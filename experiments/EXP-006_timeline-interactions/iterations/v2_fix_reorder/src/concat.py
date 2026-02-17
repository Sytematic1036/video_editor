"""
FFmpeg-based video concatenation with crossfade transitions.
EXP-005: Added trim support (in/out points).
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


def concat_videos(
    video_clips: list[VideoClipSpec],
    output_path: Path,
    crossfade: Optional[CrossfadeSpec] = None,
    audio_track: Optional[AudioTrackSpec] = None,
    resolution: tuple[int, int] = (1920, 1080),
) -> None:
    """Concatenate videos with crossfade and optional background audio.

    Supports trim points: clips are trimmed using -ss (start) and -t (duration).
    """
    if len(video_clips) < 1:
        raise ValueError("Need at least 1 video clip")

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

    audio_input_idx = len(video_clips) if audio_track else None
    if audio_track:
        if not audio_track.path.exists():
            raise FileNotFoundError(audio_track.path)
        cmd += ["-i", str(audio_track.path)]

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
        for i, clip in enumerate(video_clips):
            trimmed_dur = clip.trimmed_duration

            trim_part = ""
            if clip.trim_start > 0 or clip.trim_end > 0:
                trim_part = f"trim=start={clip.trim_start}:duration={trimmed_dur},setpts=PTS-STARTPTS,"

            filter_parts.append(
                f"[{i}:v]{trim_part}scale={width}:{height}:force_original_aspect_ratio=decrease,"
                f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}]"
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

    # Audio handling (with trim support)
    if audio_track:
        audio_dur = ffprobe_duration_seconds(audio_track.path)
        trimmed_audio_dur = audio_dur - audio_track.trim_start - audio_track.trim_end

        audio_filter = f"[{audio_input_idx}:a]"

        # Apply trim to audio if specified
        if audio_track.trim_start > 0 or audio_track.trim_end > 0:
            audio_filter += f"atrim=start={audio_track.trim_start}:duration={trimmed_audio_dur},asetpts=PTS-STARTPTS,"

        if audio_track.volume != 1.0:
            audio_filter += f"volume={audio_track.volume},"
        if audio_track.fade_in_s > 0:
            audio_filter += f"afade=t=in:st=0:d={audio_track.fade_in_s},"
        if audio_track.fade_out_s > 0:
            fade_start = min(trimmed_audio_dur, total_duration) - audio_track.fade_out_s
            audio_filter += f"afade=t=out:st={fade_start:.3f}:d={audio_track.fade_out_s},"
        audio_filter = audio_filter.rstrip(",") + "[aout]"
        filter_parts.append(audio_filter)
        cmd += ["-filter_complex", ";".join(filter_parts)]
        cmd += ["-map", "[vout]", "-map", "[aout]"]
    else:
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

    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k", "-shortest", str(output_path)]

    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {p.stderr}")
