"""
FFmpeg-based video concatenation with crossfade transitions.
EXP-005: Added trim support (in/out points).
EXP-007: Added dual audio support (speech track + music track).
EXP-014: Added audio-only support (black video + audio when no video clips).
EXP-026: Added audio_source parameter for selecting audio source.
"""
import subprocess
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class VideoClipSpec:
    """Specification for a video clip with optional trim points."""
    path: Path
    duration_s: float = 0.0
    # Trim points (non-destructive)
    trim_start: float = 0.0  # seconds to skip from start
    trim_end: float = 0.0    # seconds to skip from end

    @property
    def trimmed_duration(self) -> float:
        """Duration after trim applied."""
        return max(0, self.duration_s - self.trim_start - self.trim_end)


@dataclass
class CrossfadeSpec:
    """Crossfade settings."""
    duration_s: float = 1.0
    transition: str = "fade"


@dataclass
class AudioTrackSpec:
    """Background audio track with optional trim."""
    path: Path
    volume: float = 1.0
    fade_in_s: float = 0.5
    fade_out_s: float = 0.5
    trim_start: float = 0.0  # seconds to skip from start
    trim_end: float = 0.0    # seconds to skip from end


@dataclass
class SpeechClipSpec:
    """Speech clip or silence segment for the speech track."""
    is_silence: bool = False
    path: Optional[Path] = None  # None if silence
    duration_s: float = 0.0  # For silence, this is the silence duration
    trim_start: float = 0.0
    trim_end: float = 0.0

    @property
    def trimmed_duration(self) -> float:
        """Duration after trim applied (silence has no trim)."""
        if self.is_silence:
            return self.duration_s
        return max(0, self.duration_s - self.trim_start - self.trim_end)


def ffprobe_duration_seconds(path: Path) -> float:
    """Get duration of a media file in seconds."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"ffprobe failed for {path}: {p.stderr}")
    return float(p.stdout.strip())


def ffprobe_has_audio(path: Path) -> bool:
    """Check if media file has an audio stream."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "a:0",
        "-show_entries", "stream=codec_type",
        "-of", "csv=p=0",
        str(path),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.returncode == 0 and "audio" in p.stdout.lower()


def concat_audio_only(
    output_path: Path,
    audio_track: Optional[AudioTrackSpec] = None,
    speech_clips: Optional[list[SpeechClipSpec]] = None,
    speech_volume: float = 1.0,
    resolution: tuple[int, int] = (1920, 1080),
) -> float:
    """Create a video with black background and audio tracks only.

    EXP-014: New function to handle audio-only preview/export.
    Returns the total duration of the output.
    """
    if not audio_track and not speech_clips:
        raise ValueError("Need at least one audio source (music or speech)")

    # Calculate total duration from audio sources
    total_duration = 0.0

    if speech_clips:
        speech_duration = sum(c.trimmed_duration for c in speech_clips)
        total_duration = max(total_duration, speech_duration)

    if audio_track:
        if not audio_track.path.exists():
            raise FileNotFoundError(audio_track.path)
        audio_dur = ffprobe_duration_seconds(audio_track.path)
        trimmed_audio_dur = audio_dur - audio_track.trim_start - audio_track.trim_end
        total_duration = max(total_duration, trimmed_audio_dur)

    if total_duration <= 0:
        raise ValueError("Total audio duration must be greater than 0")

    width, height = resolution

    cmd = ["ffmpeg", "-y"]

    # Add black video source
    cmd += [
        "-f", "lavfi",
        "-i", f"color=c=black:s={width}x{height}:r=30:d={total_duration:.3f}",
    ]

    next_input_idx = 1  # 0 is the black video

    # Add music track input
    audio_input_idx = None
    if audio_track:
        cmd += ["-i", str(audio_track.path)]
        audio_input_idx = next_input_idx
        next_input_idx += 1

    # Add speech clip inputs
    speech_input_indices = []
    if speech_clips:
        for speech_clip in speech_clips:
            if not speech_clip.is_silence and speech_clip.path:
                if not speech_clip.path.exists():
                    raise FileNotFoundError(speech_clip.path)
                cmd += ["-i", str(speech_clip.path)]
                speech_input_indices.append(next_input_idx)
                next_input_idx += 1
            else:
                speech_input_indices.append(None)

    filter_parts = []
    audio_tracks_to_mix = []

    # Process music track
    if audio_track:
        audio_dur = ffprobe_duration_seconds(audio_track.path)
        trimmed_audio_dur = audio_dur - audio_track.trim_start - audio_track.trim_end

        music_filter = f"[{audio_input_idx}:a]"

        if audio_track.trim_start > 0 or audio_track.trim_end > 0:
            music_filter += f"atrim=start={audio_track.trim_start}:duration={trimmed_audio_dur},asetpts=PTS-STARTPTS,"

        if audio_track.volume != 1.0:
            music_filter += f"volume={audio_track.volume},"
        if audio_track.fade_in_s > 0:
            music_filter += f"afade=t=in:st=0:d={audio_track.fade_in_s},"
        if audio_track.fade_out_s > 0:
            fade_start = min(trimmed_audio_dur, total_duration) - audio_track.fade_out_s
            music_filter += f"afade=t=out:st={fade_start:.3f}:d={audio_track.fade_out_s},"
        music_filter = music_filter.rstrip(",") + "[music]"
        filter_parts.append(music_filter)
        audio_tracks_to_mix.append("[music]")

    # Process speech track
    if speech_clips and len(speech_clips) > 0:
        speech_filter_parts = []
        speech_labels = []

        for i, speech_clip in enumerate(speech_clips):
            if speech_clip.is_silence:
                dur = speech_clip.duration_s
                speech_filter_parts.append(
                    f"anullsrc=r=44100:cl=stereo,atrim=duration={dur:.3f}[sil{i}]"
                )
                speech_labels.append(f"[sil{i}]")
            else:
                input_idx = speech_input_indices[i]
                if input_idx is None:
                    continue

                trimmed_dur = speech_clip.trimmed_duration
                if speech_clip.trim_start > 0 or speech_clip.trim_end > 0:
                    speech_filter = f"[{input_idx}:a]atrim=start={speech_clip.trim_start}:duration={trimmed_dur},asetpts=PTS-STARTPTS[sp{i}]"
                else:
                    speech_filter = f"[{input_idx}:a]acopy[sp{i}]"
                speech_filter_parts.append(speech_filter)
                speech_labels.append(f"[sp{i}]")

        filter_parts.extend(speech_filter_parts)

        if len(speech_labels) == 1:
            filter_parts.append(f"{speech_labels[0]}acopy[speech_raw]")
        elif len(speech_labels) > 1:
            concat_inputs = "".join(speech_labels)
            filter_parts.append(f"{concat_inputs}concat=n={len(speech_labels)}:v=0:a=1[speech_raw]")

        if speech_labels:
            if speech_volume != 1.0:
                filter_parts.append(f"[speech_raw]volume={speech_volume}[speech]")
            else:
                filter_parts.append("[speech_raw]acopy[speech]")
            audio_tracks_to_mix.append("[speech]")

    # Mix audio tracks
    if len(audio_tracks_to_mix) == 1:
        filter_parts.append(f"{audio_tracks_to_mix[0]}acopy[aout]")
    elif len(audio_tracks_to_mix) > 1:
        mix_inputs = "".join(audio_tracks_to_mix)
        filter_parts.append(f"{mix_inputs}amix=inputs={len(audio_tracks_to_mix)}:normalize=0[aout]")

    cmd += ["-filter_complex", ";".join(filter_parts)]
    cmd += ["-map", "0:v", "-map", "[aout]"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k", "-shortest", str(output_path)]

    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {p.stderr}")

    return total_duration


def concat_videos(
    video_clips: list[VideoClipSpec],
    output_path: Path,
    crossfade: Optional[CrossfadeSpec] = None,
    audio_track: Optional[AudioTrackSpec] = None,  # Music track
    speech_clips: Optional[list[SpeechClipSpec]] = None,  # Speech track
    speech_volume: float = 1.0,  # EXP-012: Speech volume (0-2.0)
    resolution: tuple[int, int] = (1920, 1080),
    audio_source: str = "editor",  # EXP-026: "video", "editor", or "none"
) -> None:
    """Concatenate videos with crossfade and dual audio (speech + music).

    Supports trim points: clips are trimmed using -ss (start) and -t (duration).
    EXP-007: Added speech_clips parameter for dual audio mixing.
    EXP-012: Added speech_volume parameter for separate volume control.
    EXP-014: Falls back to audio-only when no video clips.
    EXP-026: Added audio_source parameter:
        - "video": Use audio from video files only (ignore speech/music tracks)
        - "editor": Use speech and music tracks (default, current behavior)
        - "none": No audio output (silent video)
    """
    # EXP-014: If no video clips, use audio-only function
    if len(video_clips) == 0:
        if audio_track or (speech_clips and len(speech_clips) > 0):
            concat_audio_only(
                output_path=output_path,
                audio_track=audio_track,
                speech_clips=speech_clips,
                speech_volume=speech_volume,
                resolution=resolution,
            )
            return
        else:
            raise ValueError("Need at least 1 video clip or audio source")

    # Get durations
    for clip in video_clips:
        if not clip.path.exists():
            raise FileNotFoundError(clip.path)
        if clip.duration_s == 0:
            clip.duration_s = ffprobe_duration_seconds(clip.path)

    cmd = ["ffmpeg", "-y"]

    # Add inputs (trim is applied via filter_complex, not here)
    for clip in video_clips:
        cmd += ["-i", str(clip.path)]

    # Track input indices for audio
    next_input_idx = len(video_clips)

    # Add music track input
    audio_input_idx = None
    if audio_track:
        if not audio_track.path.exists():
            raise FileNotFoundError(audio_track.path)
        cmd += ["-i", str(audio_track.path)]
        audio_input_idx = next_input_idx
        next_input_idx += 1

    # Add speech clip inputs (not silence - those are generated)
    speech_input_indices = []
    if speech_clips:
        for speech_clip in speech_clips:
            if not speech_clip.is_silence and speech_clip.path:
                if not speech_clip.path.exists():
                    raise FileNotFoundError(speech_clip.path)
                cmd += ["-i", str(speech_clip.path)]
                speech_input_indices.append(next_input_idx)
                next_input_idx += 1
            else:
                speech_input_indices.append(None)  # Silence, no input file

    width, height = resolution
    filter_parts = []

    if len(video_clips) == 1:
        clip = video_clips[0]
        trimmed_dur = clip.trimmed_duration

        # Apply trim via trim filter for single clip
        trim_filter = f"[0:v]"
        if clip.trim_start > 0 or clip.trim_end > 0:
            trim_filter += f"trim=start={clip.trim_start}:duration={trimmed_dur},setpts=PTS-STARTPTS,"
        trim_filter += (
            f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
            f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2[vout]"
        )
        filter_parts.append(trim_filter)
        total_duration = trimmed_dur
    else:
        xfade_dur = crossfade.duration_s if crossfade else 1.0
        xfade_type = crossfade.transition if crossfade else "fade"

        # Scale and trim all videos
        # EXP-015 FIX: Normalize framerate and pixel format for xfade compatibility
        # Order matters: scale -> fps -> format -> setpts
        for i, clip in enumerate(video_clips):
            trimmed_dur = clip.trimmed_duration

            trim_part = ""
            if clip.trim_start > 0 or clip.trim_end > 0:
                trim_part = f"trim=start={clip.trim_start}:duration={trimmed_dur},setpts=PTS-STARTPTS,"

            filter_parts.append(
                f"[{i}:v]{trim_part}scale={width}:{height}:force_original_aspect_ratio=decrease,"
                f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,setsar=1,"
                f"fps=30,format=yuv420p,setpts=PTS-STARTPTS[v{i}]"
            )

        # Chain xfades using trimmed durations
        trimmed_durations = [c.trimmed_duration for c in video_clips]

        if len(video_clips) == 2:
            offset = trimmed_durations[0] - xfade_dur
            filter_parts.append(
                f"[v0][v1]xfade=transition={xfade_type}:duration={xfade_dur}:offset={offset:.3f}[vout]"
            )
            total_duration = trimmed_durations[0] + trimmed_durations[1] - xfade_dur
        else:
            current_offset = trimmed_durations[0] - xfade_dur
            prev_label = "v0"
            for i in range(1, len(video_clips)):
                out_label = "vout" if i == len(video_clips) - 1 else f"vx{i}"
                filter_parts.append(
                    f"[{prev_label}][v{i}]xfade=transition={xfade_type}:"
                    f"duration={xfade_dur}:offset={current_offset:.3f}[{out_label}]"
                )
                current_offset += trimmed_durations[i] - xfade_dur
                prev_label = out_label
            total_duration = sum(trimmed_durations) - xfade_dur * (len(video_clips) - 1)

    # Audio handling (EXP-007: dual audio support - speech + music)
    # EXP-026: audio_source controls which audio to use
    has_music = audio_track is not None
    has_speech = speech_clips and len(speech_clips) > 0

    # EXP-026: Handle audio_source="none" - silent video
    if audio_source == "none":
        cmd += ["-filter_complex", ";".join(filter_parts)]
        cmd += ["-map", "[vout]", "-an"]
        cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23", str(output_path)]
        p = subprocess.run(cmd, capture_output=True, text=True)
        if p.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {p.stderr}")
        return

    # EXP-026: Handle audio_source="video" - use video audio only
    if audio_source == "video":
        videos_with_audio = [c for c in video_clips if ffprobe_has_audio(c.path)]
        if videos_with_audio:
            audio_filters = [f"[{i}:a]" for i, c in enumerate(video_clips) if ffprobe_has_audio(c.path)]
            if len(audio_filters) == 1:
                cmd += ["-filter_complex", ";".join(filter_parts)]
                cmd += ["-map", "[vout]", "-map", audio_filters[0].strip("[]")]
            else:
                audio_merge = "".join(audio_filters) + f"amix=inputs={len(audio_filters)}:normalize=0[aout]"
                filter_parts.append(audio_merge)
                cmd += ["-filter_complex", ";".join(filter_parts)]
                cmd += ["-map", "[vout]", "-map", "[aout]"]
        else:
            cmd += ["-filter_complex", ";".join(filter_parts)]
            cmd += ["-map", "[vout]", "-an"]

        if len(video_clips) > 1:
            cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k", str(output_path)]
        else:
            cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k", "-shortest", str(output_path)]

        p = subprocess.run(cmd, capture_output=True, text=True)
        if p.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {p.stderr}")
        return

    # audio_source="editor" (default) - use speech and music tracks
    if has_music or has_speech:
        audio_tracks_to_mix = []

        # Process music track
        if has_music:
            audio_dur = ffprobe_duration_seconds(audio_track.path)
            trimmed_audio_dur = audio_dur - audio_track.trim_start - audio_track.trim_end

            music_filter = f"[{audio_input_idx}:a]"

            if audio_track.trim_start > 0 or audio_track.trim_end > 0:
                music_filter += f"atrim=start={audio_track.trim_start}:duration={trimmed_audio_dur},asetpts=PTS-STARTPTS,"

            if audio_track.volume != 1.0:
                music_filter += f"volume={audio_track.volume},"
            if audio_track.fade_in_s > 0:
                music_filter += f"afade=t=in:st=0:d={audio_track.fade_in_s},"
            if audio_track.fade_out_s > 0:
                fade_start = min(trimmed_audio_dur, total_duration) - audio_track.fade_out_s
                music_filter += f"afade=t=out:st={fade_start:.3f}:d={audio_track.fade_out_s},"
            music_filter = music_filter.rstrip(",") + "[music]"
            filter_parts.append(music_filter)
            audio_tracks_to_mix.append("[music]")

        # Process speech track (concatenate speech clips and silence)
        if has_speech:
            speech_filter_parts = []
            speech_labels = []

            for i, speech_clip in enumerate(speech_clips):
                if speech_clip.is_silence:
                    # Generate silence using anullsrc
                    dur = speech_clip.duration_s
                    speech_filter_parts.append(
                        f"anullsrc=r=44100:cl=stereo,atrim=duration={dur:.3f}[sil{i}]"
                    )
                    speech_labels.append(f"[sil{i}]")
                else:
                    # Speech audio file - use pre-computed input index
                    input_idx = speech_input_indices[i]
                    if input_idx is None:
                        continue  # Should not happen

                    trimmed_dur = speech_clip.trimmed_duration
                    if speech_clip.trim_start > 0 or speech_clip.trim_end > 0:
                        # Apply trim
                        speech_filter = f"[{input_idx}:a]atrim=start={speech_clip.trim_start}:duration={trimmed_dur},asetpts=PTS-STARTPTS[sp{i}]"
                    else:
                        # No trim - just copy the audio
                        speech_filter = f"[{input_idx}:a]acopy[sp{i}]"
                    speech_filter_parts.append(speech_filter)
                    speech_labels.append(f"[sp{i}]")

            # Add speech filter parts
            filter_parts.extend(speech_filter_parts)

            # Concatenate all speech segments
            if len(speech_labels) == 1:
                # Just one clip, rename it to speech_raw
                filter_parts.append(f"{speech_labels[0]}acopy[speech_raw]")
            else:
                # Concatenate multiple clips
                concat_inputs = "".join(speech_labels)
                filter_parts.append(f"{concat_inputs}concat=n={len(speech_labels)}:v=0:a=1[speech_raw]")

            # EXP-012: Apply speech volume
            if speech_volume != 1.0:
                filter_parts.append(f"[speech_raw]volume={speech_volume}[speech]")
            else:
                filter_parts.append("[speech_raw]acopy[speech]")

            audio_tracks_to_mix.append("[speech]")

        # Mix audio tracks together
        if len(audio_tracks_to_mix) == 1:
            # Only one track, just output it
            single_track = audio_tracks_to_mix[0].strip("[]")
            filter_parts.append(f"{audio_tracks_to_mix[0]}acopy[aout]")
        else:
            # Mix music and speech together
            mix_inputs = "".join(audio_tracks_to_mix)
            filter_parts.append(f"{mix_inputs}amix=inputs={len(audio_tracks_to_mix)}:normalize=0[aout]")

        cmd += ["-filter_complex", ";".join(filter_parts)]
        cmd += ["-map", "[vout]", "-map", "[aout]"]
    else:
        # No external audio tracks, use video audio if available
        videos_with_audio = [c for c in video_clips if ffprobe_has_audio(c.path)]
        if videos_with_audio:
            audio_filters = [f"[{i}:a]" for i, c in enumerate(video_clips) if ffprobe_has_audio(c.path)]
            if len(audio_filters) == 1:
                cmd += ["-filter_complex", ";".join(filter_parts)]
                cmd += ["-map", "[vout]", "-map", audio_filters[0].strip("[]")]
            else:
                audio_merge = "".join(audio_filters) + f"amix=inputs={len(audio_filters)}:normalize=0[aout]"
                filter_parts.append(audio_merge)
                cmd += ["-filter_complex", ";".join(filter_parts)]
                cmd += ["-map", "[vout]", "-map", "[aout]"]
        else:
            cmd += ["-filter_complex", ";".join(filter_parts)]
            cmd += ["-map", "[vout]", "-an"]

    # EXP-015 FIX: Don't use -shortest for multi-clip video, as individual clip audio
    # may be shorter than the concatenated video output
    if len(video_clips) > 1:
        cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k", str(output_path)]
    else:
        cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k", "-shortest", str(output_path)]


    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {p.stderr}")
