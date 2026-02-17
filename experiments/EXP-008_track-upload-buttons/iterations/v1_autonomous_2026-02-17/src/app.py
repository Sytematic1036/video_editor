"""
Flask web app for video editor with track upload buttons.
EXP-008: Individual upload buttons per track (Video, Speech, Music).
"""
import os
import uuid
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file, url_for
from werkzeug.utils import secure_filename

from concat import VideoClipSpec, CrossfadeSpec, AudioTrackSpec, SpeechClipSpec, concat_videos, ffprobe_duration_seconds

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "output"
PREVIEW_DIR = BASE_DIR / "preview"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
PREVIEW_DIR.mkdir(exist_ok=True)

VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
AUDIO_EXTENSIONS = {'.mp3', '.wav', '.aac', '.m4a', '.flac'}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    filename = secure_filename(file.filename)
    suffix = Path(filename).suffix.lower()

    if suffix in VIDEO_EXTENSIONS:
        file_type = 'video'
    elif suffix in AUDIO_EXTENSIONS:
        file_type = 'audio'
    else:
        return jsonify({'error': f'Unsupported: {suffix}'}), 400

    unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    filepath = UPLOAD_DIR / unique_name
    file.save(filepath)

    try:
        duration = ffprobe_duration_seconds(filepath)
    except Exception:
        duration = 0

    return jsonify({
        'success': True,
        'id': unique_name,
        'filename': filename,
        'path': str(filepath),
        'type': file_type,
        'duration': round(duration, 2),
        'preview_url': url_for('preview_file', filename=unique_name),
        'trimStart': 0,
        'trimEnd': 0,
    })


@app.route('/preview/<filename>')
def preview_file(filename):
    """Serve uploaded file for preview."""
    filepath = UPLOAD_DIR / secure_filename(filename)
    if not filepath.exists():
        return jsonify({'error': 'File not found'}), 404
    return send_file(filepath)


@app.route('/preview-full', methods=['POST'])
def preview_full():
    """Generate a quick preview of the full composition."""
    data = request.json
    videos = data.get('videos', [])
    audio = data.get('audio')  # Music track
    speech = data.get('speech', [])  # Speech track clips
    crossfade_duration = float(data.get('crossfade_duration', 1.0))
    crossfade_transition = data.get('crossfade_transition', 'fade')
    audio_volume = float(data.get('audio_volume', 0.5))
    audio_fade_in = float(data.get('audio_fade_in', 1.0))
    audio_fade_out = float(data.get('audio_fade_out', 2.0))

    if not videos:
        return jsonify({'error': 'No videos'}), 400

    video_clips = []
    for v in videos:
        path = Path(v['path'])
        if not path.exists():
            return jsonify({'error': f'Not found: {v["filename"]}'}), 400

        trim_start = float(v.get('trimStart', 0))
        trim_end = float(v.get('trimEnd', 0))

        video_clips.append(VideoClipSpec(
            path=path,
            trim_start=trim_start,
            trim_end=trim_end,
        ))

    crossfade = CrossfadeSpec(duration_s=crossfade_duration, transition=crossfade_transition)

    # Music track
    audio_track = None
    if audio:
        audio_path = Path(audio['path'])
        if audio_path.exists():
            audio_trim_start = float(audio.get('trimStart', 0))
            audio_trim_end = float(audio.get('trimEnd', 0))

            audio_track = AudioTrackSpec(
                path=audio_path,
                volume=audio_volume,
                fade_in_s=audio_fade_in,
                fade_out_s=audio_fade_out,
                trim_start=audio_trim_start,
                trim_end=audio_trim_end,
            )

    # Speech track clips
    speech_clips = []
    for s in speech:
        if s.get('isSilence'):
            speech_clips.append(SpeechClipSpec(
                is_silence=True,
                duration_s=float(s.get('silenceDuration', s.get('duration', 2.0))),
            ))
        else:
            speech_path = Path(s['path'])
            if speech_path.exists():
                speech_clips.append(SpeechClipSpec(
                    is_silence=False,
                    path=speech_path,
                    duration_s=float(s.get('duration', 0)),
                    trim_start=float(s.get('trimStart', 0)),
                    trim_end=float(s.get('trimEnd', 0)),
                ))

    # Generate preview with lower quality for speed
    preview_name = f"preview_{uuid.uuid4().hex[:8]}.mp4"
    preview_path = PREVIEW_DIR / preview_name

    try:
        # Use lower resolution for faster preview
        concat_videos(
            video_clips, preview_path,
            crossfade=crossfade,
            audio_track=audio_track,
            speech_clips=speech_clips if speech_clips else None,
            resolution=(854, 480)
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    if not preview_path.exists():
        return jsonify({'error': 'Preview generation failed'}), 500

    duration = ffprobe_duration_seconds(preview_path)

    return jsonify({
        'success': True,
        'duration': round(duration, 2),
        'preview_url': url_for('serve_preview', filename=preview_name),
    })


@app.route('/preview-full/<filename>')
def serve_preview(filename):
    """Serve preview file."""
    filepath = PREVIEW_DIR / secure_filename(filename)
    if not filepath.exists():
        return jsonify({'error': 'Not found'}), 404
    return send_file(filepath)


@app.route('/export', methods=['POST'])
def export_video():
    data = request.json
    videos = data.get('videos', [])
    audio = data.get('audio')  # Music track
    speech = data.get('speech', [])  # Speech track clips
    crossfade_duration = float(data.get('crossfade_duration', 1.0))
    crossfade_transition = data.get('crossfade_transition', 'fade')
    audio_volume = float(data.get('audio_volume', 0.5))
    audio_fade_in = float(data.get('audio_fade_in', 1.0))
    audio_fade_out = float(data.get('audio_fade_out', 2.0))

    if not videos:
        return jsonify({'error': 'No videos'}), 400

    video_clips = []
    for v in videos:
        path = Path(v['path'])
        if not path.exists():
            return jsonify({'error': f'Not found: {v["filename"]}'}), 400

        trim_start = float(v.get('trimStart', 0))
        trim_end = float(v.get('trimEnd', 0))

        video_clips.append(VideoClipSpec(
            path=path,
            trim_start=trim_start,
            trim_end=trim_end,
        ))

    crossfade = CrossfadeSpec(duration_s=crossfade_duration, transition=crossfade_transition)

    # Music track
    audio_track = None
    if audio:
        audio_path = Path(audio['path'])
        if audio_path.exists():
            audio_trim_start = float(audio.get('trimStart', 0))
            audio_trim_end = float(audio.get('trimEnd', 0))

            audio_track = AudioTrackSpec(
                path=audio_path,
                volume=audio_volume,
                fade_in_s=audio_fade_in,
                fade_out_s=audio_fade_out,
                trim_start=audio_trim_start,
                trim_end=audio_trim_end,
            )

    # Speech track clips
    speech_clips = []
    for s in speech:
        if s.get('isSilence'):
            speech_clips.append(SpeechClipSpec(
                is_silence=True,
                duration_s=float(s.get('silenceDuration', s.get('duration', 2.0))),
            ))
        else:
            speech_path = Path(s['path'])
            if speech_path.exists():
                speech_clips.append(SpeechClipSpec(
                    is_silence=False,
                    path=speech_path,
                    duration_s=float(s.get('duration', 0)),
                    trim_start=float(s.get('trimStart', 0)),
                    trim_end=float(s.get('trimEnd', 0)),
                ))

    output_name = f"export_{uuid.uuid4().hex[:8]}.mp4"
    output_path = OUTPUT_DIR / output_name

    try:
        concat_videos(
            video_clips, output_path,
            crossfade=crossfade,
            audio_track=audio_track,
            speech_clips=speech_clips if speech_clips else None,
            resolution=(1920, 1080)
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    if not output_path.exists():
        return jsonify({'error': 'Export failed'}), 500

    duration = ffprobe_duration_seconds(output_path)
    size_mb = output_path.stat().st_size / (1024 * 1024)

    return jsonify({
        'success': True,
        'filename': output_name,
        'duration': round(duration, 2),
        'size_mb': round(size_mb, 2),
        'download_url': url_for('download', filename=output_name),
        'preview_url': url_for('preview_output', filename=output_name),
    })


@app.route('/download/<filename>')
def download(filename):
    filepath = OUTPUT_DIR / secure_filename(filename)
    if not filepath.exists():
        return jsonify({'error': 'Not found'}), 404
    return send_file(filepath, as_attachment=True)


@app.route('/output/<filename>')
def preview_output(filename):
    """Serve exported file for preview."""
    filepath = OUTPUT_DIR / secure_filename(filename)
    if not filepath.exists():
        return jsonify({'error': 'Not found'}), 404
    return send_file(filepath)


@app.route('/clear', methods=['POST'])
def clear_files():
    for f in UPLOAD_DIR.glob('*'):
        if f.is_file():
            f.unlink()
    for f in PREVIEW_DIR.glob('*'):
        if f.is_file():
            f.unlink()
    return jsonify({'success': True})


if __name__ == '__main__':
    print("=" * 50)
    print("Video Editor - EXP-008 Track Upload Buttons")
    print("=" * 50)
    print(f"Upload: {UPLOAD_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Preview: {PREVIEW_DIR}")
    print()
    print("Features:")
    print("  - + Add Video (video track button)")
    print("  - + Add Speech (speech track button)")
    print("  - + Add Music (music track button)")
    print("  - No more Drag & Drop area")
    print()
    print("Open: http://localhost:5014")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5014, debug=True)
