"""
Flask web app - Video Editor + HTML to MP4 Converter
EXP-018: Merged from EXP-016 (video_editor v3) and EXP-017 (html-to-mp4)

Features:
- Video Editor: Upload, trim, crossfade, preview, export videos
- HTML to MP4: Convert HTML presentations to MP4 with per-slide durations
"""
import os
import uuid
import time
import threading
from pathlib import Path
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, send_file, url_for
from werkzeug.utils import secure_filename

from concat import VideoClipSpec, CrossfadeSpec, AudioTrackSpec, SpeechClipSpec, concat_videos, ffprobe_duration_seconds
from html_converter import (
    convert_html_to_mp4,
    ConversionSettings,
    extract_saved_durations,
    detect_total_slides
)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "output"
PREVIEW_DIR = BASE_DIR / "preview"
EXPORT_DIR = BASE_DIR / "exports"
HTML_DIR = BASE_DIR / "html_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
PREVIEW_DIR.mkdir(exist_ok=True)
EXPORT_DIR.mkdir(exist_ok=True)
HTML_DIR.mkdir(exist_ok=True)

VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
AUDIO_EXTENSIONS = {'.mp3', '.wav', '.aac', '.m4a', '.flac'}

# Job tracking
export_jobs = {}
conversion_jobs = {}

# Default duration for slides without SAVED_DURATIONS
DEFAULT_SLIDE_DURATION = 5


def has_audio_content(audio, speech):
    """Check if there's any audio content (music or speech)."""
    has_music = audio and audio.get('path')
    has_speech = speech and len(speech) > 0 and any(
        not s.get('is_silence') or s.get('duration', 0) > 0 for s in speech
    )
    return has_music or has_speech


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
    """Generate a quick preview of the full composition.

    EXP-014: Now allows audio-only preview (no videos required).
    """
    data = request.json
    videos = data.get('videos', [])
    audio = data.get('audio')
    speech = data.get('speech', [])
    crossfade_duration = float(data.get('crossfade_duration', 1.0))
    crossfade_transition = data.get('crossfade_transition', 'fade')
    speech_volume = float(data.get('speech_volume', 1.0))
    music_volume = float(data.get('music_volume', 0.5))
    audio_fade_in = float(data.get('audio_fade_in', 1.0))
    audio_fade_out = float(data.get('audio_fade_out', 2.0))

    # EXP-014: Allow audio-only preview
    if not videos and not has_audio_content(audio, speech):
        return jsonify({'error': 'No media (need video or audio)'}), 400

    video_clips = []
    for v in videos:
        clip = VideoClipSpec(
            path=Path(v['path']),
            duration_s=float(v.get('duration', 0)),
            trim_start=float(v.get('trimStart', 0)),
            trim_end=float(v.get('trimEnd', 0)),
        )
        video_clips.append(clip)

    audio_track = None
    if audio and audio.get('path'):
        audio_track = AudioTrackSpec(
            path=Path(audio['path']),
            volume=music_volume,
            fade_in_s=audio_fade_in,
            fade_out_s=audio_fade_out,
            trim_start=float(audio.get('trimStart', 0)),
            trim_end=float(audio.get('trimEnd', 0)),
        )

    speech_clips = []
    for s in speech:
        if s.get('is_silence'):
            speech_clips.append(SpeechClipSpec(
                is_silence=True,
                duration_s=float(s.get('duration', 0)),
            ))
        else:
            speech_clips.append(SpeechClipSpec(
                is_silence=False,
                path=Path(s['path']),
                duration_s=float(s.get('duration', 0)),
                trim_start=float(s.get('trimStart', 0)),
                trim_end=float(s.get('trimEnd', 0)),
            ))

    crossfade = CrossfadeSpec(duration_s=crossfade_duration, transition=crossfade_transition)

    preview_id = uuid.uuid4().hex[:8]
    output_path = PREVIEW_DIR / f"preview_{preview_id}.mp4"

    try:
        # concat_videos now handles audio-only case internally
        concat_videos(
            video_clips=video_clips,
            output_path=output_path,
            crossfade=crossfade,
            audio_track=audio_track,
            speech_clips=speech_clips if speech_clips else None,
            speech_volume=speech_volume,
            resolution=(1280, 720),
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # Get duration of generated preview
    try:
        duration = ffprobe_duration_seconds(output_path)
    except Exception:
        duration = 0

    return jsonify({
        'success': True,
        'preview_url': url_for('serve_preview', filename=f"preview_{preview_id}.mp4"),
        'duration': round(duration, 2),
    })


@app.route('/preview-video/<filename>')
def serve_preview(filename):
    """Serve preview video."""
    filepath = PREVIEW_DIR / secure_filename(filename)
    if not filepath.exists():
        return jsonify({'error': 'Preview not found'}), 404
    return send_file(filepath, mimetype='video/mp4')


# ============================================================
# EXP-013: Export System (updated for EXP-014 audio-only)
# ============================================================

def run_export(job_id: str, video_clips: list, audio_track, speech_clips: list,
               crossfade, speech_volume: float, output_path: Path):
    """Background thread for export processing."""
    try:
        export_jobs[job_id]['status'] = 'processing'
        export_jobs[job_id]['progress'] = 10

        # Simulate progress stages (FFmpeg doesn't give real-time progress easily)
        export_jobs[job_id]['message'] = 'Preparing clips...'
        time.sleep(0.5)
        export_jobs[job_id]['progress'] = 20

        export_jobs[job_id]['message'] = 'Rendering video...'
        export_jobs[job_id]['progress'] = 30

        # Actual export - concat_videos handles audio-only case
        concat_videos(
            video_clips=video_clips,
            output_path=output_path,
            crossfade=crossfade,
            audio_track=audio_track,
            speech_clips=speech_clips if speech_clips else None,
            speech_volume=speech_volume,
            resolution=(1920, 1080),  # Full HD for final export
        )

        export_jobs[job_id]['progress'] = 90
        export_jobs[job_id]['message'] = 'Finalizing...'
        time.sleep(0.3)

        export_jobs[job_id]['status'] = 'completed'
        export_jobs[job_id]['progress'] = 100
        export_jobs[job_id]['message'] = 'Export complete!'
        export_jobs[job_id]['filename'] = output_path.name
        export_jobs[job_id]['completed_at'] = datetime.now().isoformat()

    except Exception as e:
        export_jobs[job_id]['status'] = 'failed'
        export_jobs[job_id]['error'] = str(e)
        export_jobs[job_id]['message'] = f'Export failed: {str(e)}'


@app.route('/export', methods=['POST'])
def start_export():
    """Start a final export job (full quality, background processing).

    EXP-014: Now allows audio-only export (no videos required).
    """
    data = request.json
    videos = data.get('videos', [])
    audio = data.get('audio')
    speech = data.get('speech', [])
    crossfade_duration = float(data.get('crossfade_duration', 1.0))
    crossfade_transition = data.get('crossfade_transition', 'fade')
    speech_volume = float(data.get('speech_volume', 1.0))
    music_volume = float(data.get('music_volume', 0.5))
    audio_fade_in = float(data.get('audio_fade_in', 1.0))
    audio_fade_out = float(data.get('audio_fade_out', 2.0))

    # Optional: custom filename
    custom_filename = data.get('filename', '')

    # EXP-014: Allow audio-only export
    if not videos and not has_audio_content(audio, speech):
        return jsonify({'error': 'No media to export (need video or audio)'}), 400

    # Build specs
    video_clips = []
    for v in videos:
        clip = VideoClipSpec(
            path=Path(v['path']),
            duration_s=float(v.get('duration', 0)),
            trim_start=float(v.get('trimStart', 0)),
            trim_end=float(v.get('trimEnd', 0)),
        )
        video_clips.append(clip)

    audio_track = None
    if audio and audio.get('path'):
        audio_track = AudioTrackSpec(
            path=Path(audio['path']),
            volume=music_volume,
            fade_in_s=audio_fade_in,
            fade_out_s=audio_fade_out,
            trim_start=float(audio.get('trimStart', 0)),
            trim_end=float(audio.get('trimEnd', 0)),
        )

    speech_clips = []
    for s in speech:
        if s.get('is_silence'):
            speech_clips.append(SpeechClipSpec(
                is_silence=True,
                duration_s=float(s.get('duration', 0)),
            ))
        else:
            speech_clips.append(SpeechClipSpec(
                is_silence=False,
                path=Path(s['path']),
                duration_s=float(s.get('duration', 0)),
                trim_start=float(s.get('trimStart', 0)),
                trim_end=float(s.get('trimEnd', 0)),
            ))

    crossfade = CrossfadeSpec(duration_s=crossfade_duration, transition=crossfade_transition)

    # Generate job ID and output path
    job_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    if custom_filename:
        safe_name = secure_filename(custom_filename)
        if not safe_name.endswith('.mp4'):
            safe_name += '.mp4'
        output_filename = f"{timestamp}_{safe_name}"
    else:
        output_filename = f"export_{timestamp}_{job_id}.mp4"

    output_path = EXPORT_DIR / output_filename

    # Initialize job tracking
    export_jobs[job_id] = {
        'status': 'queued',
        'progress': 0,
        'message': 'Export queued...',
        'filename': None,
        'created_at': datetime.now().isoformat(),
        'completed_at': None,
        'error': None,
    }

    # Start background thread
    thread = threading.Thread(
        target=run_export,
        args=(job_id, video_clips, audio_track, speech_clips, crossfade, speech_volume, output_path)
    )
    thread.start()

    return jsonify({
        'success': True,
        'job_id': job_id,
        'message': 'Export started',
    })


@app.route('/export-status/<job_id>')
def export_status(job_id):
    """Get the status of an export job."""
    if job_id not in export_jobs:
        return jsonify({'error': 'Job not found', 'status': 'not_found'}), 404

    job = export_jobs[job_id]
    response = {
        'job_id': job_id,
        'status': job['status'],
        'progress': job['progress'],
        'message': job['message'],
    }

    if job['status'] == 'completed':
        response['filename'] = job['filename']
        response['download_url'] = url_for('download_export', filename=job['filename'])
    elif job['status'] == 'failed':
        response['error'] = job['error']

    return jsonify(response)


@app.route('/download/<filename>')
def download_export(filename):
    """Download an exported file.

    EXP-020: Now searches in both EXPORT_DIR and OUTPUT_DIR.
    HTML-to-MP4 saves to OUTPUT_DIR, while video export saves to EXPORT_DIR.
    """
    safe_filename = secure_filename(filename)

    # Check exports first (video editor exports)
    filepath = EXPORT_DIR / safe_filename
    if not filepath.exists():
        # Also check output dir (html-to-mp4 conversions)
        filepath = OUTPUT_DIR / safe_filename

    if not filepath.exists():
        return jsonify({'error': 'File not found'}), 404

    return send_file(
        filepath,
        mimetype='video/mp4',
        as_attachment=True,
        download_name=safe_filename,
    )


@app.route('/exports')
def list_exports():
    """List all exported files."""
    exports = []
    for f in EXPORT_DIR.glob('*.mp4'):
        stat = f.stat()
        exports.append({
            'filename': f.name,
            'size_mb': round(stat.st_size / (1024 * 1024), 2),
            'created': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'download_url': url_for('download_export', filename=f.name),
        })

    # Sort by creation time, newest first
    exports.sort(key=lambda x: x['created'], reverse=True)
    return jsonify({'exports': exports})


@app.route('/cleanup', methods=['POST'])
def cleanup_files():
    """Remove old temporary files (previews older than 1 hour, uploads older than 24 hours)."""
    data = request.json or {}
    preview_max_age_hours = data.get('preview_max_age_hours', 1)
    upload_max_age_hours = data.get('upload_max_age_hours', 24)

    now = datetime.now()
    removed = {'previews': 0, 'uploads': 0}

    # Clean old previews
    preview_cutoff = now - timedelta(hours=preview_max_age_hours)
    for f in PREVIEW_DIR.glob('*'):
        if f.is_file():
            mtime = datetime.fromtimestamp(f.stat().st_mtime)
            if mtime < preview_cutoff:
                f.unlink()
                removed['previews'] += 1

    # Clean old uploads (be careful - only remove if not in use)
    upload_cutoff = now - timedelta(hours=upload_max_age_hours)
    for f in UPLOAD_DIR.glob('*'):
        if f.is_file():
            mtime = datetime.fromtimestamp(f.stat().st_mtime)
            if mtime < upload_cutoff:
                f.unlink()
                removed['uploads'] += 1

    return jsonify({
        'success': True,
        'removed': removed,
        'message': f"Removed {removed['previews']} previews and {removed['uploads']} uploads",
    })


@app.route('/storage-info')
def storage_info():
    """Get storage usage information."""
    def dir_size(path):
        total = 0
        for f in path.glob('**/*'):
            if f.is_file():
                total += f.stat().st_size
        return total

    return jsonify({
        'uploads_mb': round(dir_size(UPLOAD_DIR) / (1024 * 1024), 2),
        'previews_mb': round(dir_size(PREVIEW_DIR) / (1024 * 1024), 2),
        'exports_mb': round(dir_size(EXPORT_DIR) / (1024 * 1024), 2),
        'uploads_count': len(list(UPLOAD_DIR.glob('*'))),
        'previews_count': len(list(PREVIEW_DIR.glob('*'))),
        'exports_count': len(list(EXPORT_DIR.glob('*.mp4'))),
        'html_count': len(list(HTML_DIR.glob('*.html'))),
    })


# ============================================================
# HTML TO MP4 ROUTES (from EXP-017)
# ============================================================

@app.route('/html-upload', methods=['POST'])
def html_upload():
    """Upload an HTML file and analyze it for slides/durations."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    filename = secure_filename(file.filename)
    suffix = Path(filename).suffix.lower()

    if suffix != '.html':
        return jsonify({'error': f'Only HTML files supported, got {suffix}'}), 400

    unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    filepath = HTML_DIR / unique_name
    file.save(filepath)

    # Analyze HTML to extract slides and durations
    html_content = filepath.read_text(encoding='utf-8')
    saved_durations = extract_saved_durations(html_content)
    total_slides = detect_total_slides(html_content)

    # Build slide durations list
    if total_slides == -1:
        if saved_durations:
            total_slides = max(saved_durations.keys()) + 1
        else:
            total_slides = 1

    slide_durations = {}
    for i in range(total_slides):
        slide_durations[i] = saved_durations.get(i, DEFAULT_SLIDE_DURATION)

    total_duration = sum(slide_durations.values())

    return jsonify({
        'success': True,
        'id': unique_name,
        'filename': filename,
        'path': str(filepath),
        'total_slides': total_slides,
        'slide_durations': slide_durations,
        'total_duration': total_duration
    })


@app.route('/html-to-mp4', methods=['POST'])
def html_to_mp4():
    """Start HTML to MP4 conversion with custom durations.

    EXP-021: Added include_audio parameter (default: False).
    """
    data = request.json
    html_id = data.get('html_id')

    if not html_id:
        return jsonify({'error': 'No html_id provided'}), 400

    html_path = HTML_DIR / secure_filename(html_id)
    if not html_path.exists():
        return jsonify({'error': 'HTML file not found'}), 404

    width = int(data.get('width', 1920))
    height = int(data.get('height', 1080))
    fps = int(data.get('fps', 2))
    default_seconds = int(data.get('seconds_per_slide', 5))
    include_audio = data.get('include_audio', False)  # EXP-021: Default off

    custom_durations = data.get('custom_durations', None)
    if custom_durations:
        custom_durations = {int(k): int(v) for k, v in custom_durations.items()}

    settings = ConversionSettings(
        width=width,
        height=height,
        fps=fps,
        default_seconds_per_slide=default_seconds
    )

    output_name = f"html2mp4_{uuid.uuid4().hex[:8]}.mp4"
    output_path = OUTPUT_DIR / output_name

    job_id = uuid.uuid4().hex[:12]
    conversion_jobs[job_id] = {
        'status': 'processing',
        'progress': 0,
        'output_name': output_name,
        'error': None
    }

    def run_conversion():
        try:
            result = convert_html_to_mp4(
                html_path,
                output_path,
                settings,
                custom_durations=custom_durations,
                include_audio=include_audio  # EXP-021
            )
            if result.success:
                conversion_jobs[job_id]['status'] = 'completed'
                conversion_jobs[job_id]['result'] = {
                    'slides': result.slides,
                    'frames': result.frames,
                    'duration_s': result.duration_s,
                    'size_mb': result.size_mb,
                    'slide_durations': result.slide_durations
                }
            else:
                conversion_jobs[job_id]['status'] = 'failed'
                conversion_jobs[job_id]['error'] = result.error
        except Exception as e:
            import traceback
            conversion_jobs[job_id]['status'] = 'failed'
            conversion_jobs[job_id]['error'] = f'{str(e)}\n{traceback.format_exc()}'

    thread = threading.Thread(target=run_conversion)
    thread.start()

    return jsonify({
        'success': True,
        'job_id': job_id,
        'message': 'Conversion started'
    })


@app.route('/html-to-mp4/status/<job_id>')
def conversion_status(job_id):
    """Check conversion job status."""
    if job_id not in conversion_jobs:
        return jsonify({'error': 'Job not found'}), 404

    job = conversion_jobs[job_id]

    response = {
        'status': job['status'],
        'progress': job.get('progress', 0)
    }

    if job['status'] == 'completed':
        response['download_url'] = url_for('download_export', filename=job['output_name'])
        response['result'] = job.get('result', {})
    elif job['status'] == 'failed':
        response['error'] = job.get('error', 'Unknown error')

    return jsonify(response)


@app.route('/clear-html', methods=['POST'])
def clear_html():
    """Clear uploaded HTML files."""
    import shutil
    for f in HTML_DIR.iterdir():
        if f.is_file():
            f.unlink()
    return jsonify({'success': True})


if __name__ == '__main__':
    print("=" * 60)
    print("Video Editor + HTML to MP4 - EXP-018 v2")
    print("=" * 60)
    print(f"Upload: {UPLOAD_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Preview: {PREVIEW_DIR}")
    print(f"Exports: {EXPORT_DIR}")
    print(f"HTML uploads: {HTML_DIR}")
    print()
    print("Features:")
    print("  - Video Editor: Upload, trim, crossfade, preview, export")
    print("  - HTML to MP4: Convert HTML presentations with custom durations")
    print()
    print("Open: http://localhost:5022")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5022, debug=True)
