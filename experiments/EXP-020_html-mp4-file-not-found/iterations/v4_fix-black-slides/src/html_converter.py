"""
HTML to MP4 converter - v3 with per-slide durations and audio support.
Handles React-based presentations with SAVED_DURATIONS or SLIDE_CONFIG.
EXP-020 v2: Added SLIDE_CONFIG parsing and audio extraction.
"""
import os
import re
import json
import shutil
import subprocess
import tempfile
import base64
from pathlib import Path
from typing import Optional, Dict, Tuple
from dataclasses import dataclass, field


@dataclass
class ConversionSettings:
    """Settings for HTML to MP4 conversion."""
    width: int = 1920
    height: int = 1080
    fps: int = 2
    default_seconds_per_slide: int = 5
    max_slides: int = 50
    crf: int = 18  # Quality (lower = better, 18-23 is good)


@dataclass
class ConversionResult:
    """Result of HTML to MP4 conversion."""
    success: bool
    error: Optional[str] = None
    slides: int = 0
    frames: int = 0
    duration_s: float = 0
    size_mb: float = 0
    output_path: str = ""
    slide_durations: Dict[int, float] = field(default_factory=dict)
    has_audio: bool = False  # EXP-020 v2


def extract_slide_config(html_content: str) -> Dict[int, float]:
    """
    Extract slide durations from HTML file.
    EXP-020 v2: Handles SLIDE_CONFIG format
    EXP-020 v3: Also handles SLIDES format

    Supported formats:
        var SLIDE_CONFIG = [{ duration: 33 }, ...]
        var SLIDES = [{ duration: 5 }, { duration: 40 }, ...]

    Returns dict of slide_index -> duration in seconds.
    """
    durations = {}

    # Try multiple variable names: SLIDE_CONFIG, SLIDES
    for var_name in ['SLIDE_CONFIG', 'SLIDES']:
        config_pattern = rf'var\s+{var_name}\s*=\s*\[(.*?)\];'
        match = re.search(config_pattern, html_content, re.DOTALL)

        if match:
            config_content = match.group(1)
            # Extract duration from each entry: { ... duration: 33, ... }
            duration_pattern = r'\{\s*[^}]*?duration\s*:\s*([\d.]+)[^}]*?\}'
            entries = re.findall(duration_pattern, config_content)
            for i, dur in enumerate(entries):
                try:
                    durations[i] = float(dur)
                except ValueError:
                    continue

            if durations:
                print(f"[INFO] Found {var_name} with {len(durations)} slides")
                return durations

    return durations


def extract_audio_data(html_content: str) -> Optional[bytes]:
    """
    Extract AUDIO_DATA (base64 encoded) from HTML file.
    EXP-020 v2: Handles format like:
        var AUDIO_DATA = "data:audio/mpeg;base64,SUQzBA...";
    Returns raw audio bytes or None if not found.
    """
    # Pattern for AUDIO_DATA with data URL
    pattern = r'var\s+AUDIO_DATA\s*=\s*["\']data:audio/[^;]+;base64,([^"\']+)["\']'
    match = re.search(pattern, html_content)

    if match:
        base64_data = match.group(1)
        try:
            return base64.b64decode(base64_data)
        except Exception as e:
            print(f"[WARN] Failed to decode audio: {e}")
            return None

    return None


def extract_saved_durations(html_content: str) -> Dict[int, float]:
    """
    Extract slide durations from HTML file.
    EXP-020 v2: Now checks SLIDE_CONFIG first, then falls back to SAVED_DURATIONS.

    Looks for:
    1. SLIDE_CONFIG = [{ duration: 33 }, ...] (new format)
    2. SAVED_DURATIONS = {"0":16,"1":10,...} (old format)

    Returns dict of slide_index -> duration in seconds.
    """
    # First try SLIDE_CONFIG (new format)
    slide_config = extract_slide_config(html_content)
    if slide_config:
        print(f"[INFO] Found SLIDE_CONFIG with {len(slide_config)} slides")
        return slide_config

    # Fall back to SAVED_DURATIONS (old format)
    all_durations = []

    # Pattern for single-line JSON object (most common in minified/inline code)
    # Matches: {"0":16,"1":10,"2":20,...}
    inline_pattern = r'SAVED_DURATIONS\s*=\s*(\{[^{}]*?"[\d]+"\s*:\s*\d+[^{}]*?\})'

    matches = re.findall(inline_pattern, html_content)
    for match in matches:
        try:
            durations = json.loads(match)
            if durations:  # Not empty
                parsed = {int(k): float(v) for k, v in durations.items()}
                all_durations.append(parsed)
        except (json.JSONDecodeError, ValueError):
            continue

    # Also try multi-line pattern for formatted JSON
    # This handles cases where the object spans multiple lines
    multiline_pattern = r'SAVED_DURATIONS\s*=\s*\{([^;]*?)\}\s*;'
    matches = re.findall(multiline_pattern, html_content, re.DOTALL)
    for match in matches:
        try:
            # Try to parse as JSON object
            json_str = '{' + match.strip() + '}'
            # Clean up potential issues
            json_str = re.sub(r',\s*}', '}', json_str)  # Remove trailing comma
            durations = json.loads(json_str)
            if durations:
                parsed = {int(k): float(v) for k, v in durations.items()}
                all_durations.append(parsed)
        except (json.JSONDecodeError, ValueError):
            continue

    # Return the one with the most entries (most complete)
    if all_durations:
        return max(all_durations, key=len)

    return {}


def detect_total_slides(html_content: str) -> int:
    """
    Detect total number of slides from HTML.
    EXP-020 v2: Now checks SLIDE_CONFIG first, then TOTAL_SLIDES, NARRATIVES, TOTAL_STEPS.
    """
    # First check SLIDE_CONFIG (most reliable)
    slide_config = extract_slide_config(html_content)
    if slide_config:
        return len(slide_config)

    # Look for TOTAL_SLIDES variable
    match = re.search(r'var\s+TOTAL_SLIDES\s*=\s*(?:SLIDE_CONFIG\.length|(\d+))', html_content)
    if match:
        if match.group(1):
            return int(match.group(1))
        # If it's SLIDE_CONFIG.length, we already checked above

    # Look for NARRATIVES array
    match = re.search(r'NARRATIVES\s*=\s*\[(.*?)\]', html_content, re.DOTALL)
    if match:
        # Count elements (empty strings or content)
        content = match.group(1)
        # Count quotes pairs for empty strings
        count = len(re.findall(r'["\']', content)) // 2
        if count > 0:
            return count

    # Look for TOTAL_STEPS
    match = re.search(r'TOTAL_STEPS\s*=\s*(\d+)', html_content)
    if match:
        return int(match.group(1)) + 1  # TOTAL_STEPS is usually length - 1

    return -1  # Unknown


def detect_current_slide(page) -> int:
    """Detect current slide number from the page."""
    try:
        # Look for slide counter (e.g., "1/19")
        counter = page.evaluate('''() => {
            const text = document.body.innerText;
            const match = text.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
            return match ? parseInt(match[1]) : null;
        }''')
        if counter:
            return counter - 1  # Convert to 0-indexed
    except:
        pass
    return -1


def convert_html_to_mp4(
    html_path: Path,
    output_path: Path,
    settings: Optional[ConversionSettings] = None,
    custom_durations: Optional[Dict[int, int]] = None
) -> ConversionResult:
    """
    Convert an HTML file to MP4 video with per-slide durations.

    Args:
        html_path: Path to the HTML file
        output_path: Path for the output MP4 file
        settings: Conversion settings
        custom_durations: Optional dict of slide_index -> seconds.
                          If provided, these override SAVED_DURATIONS from HTML.

    Returns:
        ConversionResult with details
    """
    if settings is None:
        settings = ConversionSettings()

    # Import playwright here to avoid import errors if not installed
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return ConversionResult(
            success=False,
            error='Playwright not installed. Run: pip install playwright && playwright install chromium'
        )

    # Check ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ConversionResult(
            success=False,
            error='FFmpeg not found. Please install ffmpeg and add to PATH.'
        )

    # Read HTML and extract durations
    html_content = html_path.read_text(encoding='utf-8')
    saved_durations = extract_saved_durations(html_content)
    total_slides = detect_total_slides(html_content)

    # EXP-020 v2: Extract audio from HTML
    audio_data = extract_audio_data(html_content)
    audio_temp_path = None
    if audio_data:
        audio_temp_path = Path(tempfile.mktemp(suffix='.mp3', prefix='html2mp4_audio_'))
        audio_temp_path.write_bytes(audio_data)
        print(f"[INFO] Extracted audio: {len(audio_data) / 1024 / 1024:.1f} MB")
    else:
        print("[INFO] No embedded audio found in HTML")

    # Use custom_durations if provided, otherwise use saved_durations
    if custom_durations:
        durations_to_use = custom_durations
        print(f"[INFO] Using CUSTOM durations: {custom_durations}")
    else:
        durations_to_use = saved_durations
        print(f"[INFO] Using durations from HTML: {durations_to_use}")

    print(f"[INFO] Detected {total_slides} total slides")

    if total_slides == -1:
        total_slides = settings.max_slides  # Fallback to max

    # Create temp directory for frames
    frame_dir = tempfile.mkdtemp(prefix='html2mp4_')

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            page = browser.new_page(viewport={
                'width': settings.width,
                'height': settings.height
            })

            # Load HTML file
            file_url = f'file://{html_path.absolute()}'
            page.goto(file_url, wait_until='load', timeout=60000)
            page.wait_for_timeout(3000)  # Wait for React to render

            # Hide UI elements (dots, counter, controls)
            page.evaluate('''() => {
                const style = document.createElement('style');
                style.textContent = `
                    div[style*="border-top: 1px solid"] { display: none !important; }
                    div[style*="position: absolute"][style*="top: 8px"][style*="right: 12px"] { display: none !important; }
                    button { display: none !important; }
                `;
                document.head.appendChild(style);
            }''')
            page.wait_for_timeout(500)

            frame_index = 0
            slides_captured = 0
            actual_durations = {}

            # Capture frames for each slide
            while slides_captured < total_slides:
                # Get duration for this slide (use custom or saved durations)
                duration = durations_to_use.get(slides_captured, settings.default_seconds_per_slide)
                actual_durations[slides_captured] = duration
                num_frames = int(duration * settings.fps)  # EXP-020 v2: Convert to int

                print(f"[INFO] Slide {slides_captured + 1}/{total_slides}: {duration}s ({num_frames} frames)")

                # Take screenshot
                frame_path = Path(frame_dir) / f'frame_{frame_index:05d}.png'
                page.screenshot(path=str(frame_path), type='png')

                # EXP-020 v4: Removed duplicate detection
                # The old code stopped if two consecutive slides looked the same (e.g., both black).
                # This caused the last slide to be skipped in presentations like:
                #   [black, generated, black] - the final black slide was skipped.
                # Now we always capture all slides based on total_slides count.

                frame_index += 1

                # Duplicate this frame for duration
                for _ in range(num_frames - 1):
                    dup_path = Path(frame_dir) / f'frame_{frame_index:05d}.png'
                    shutil.copy(frame_path, dup_path)
                    frame_index += 1

                slides_captured += 1

                # Navigate to next slide
                if slides_captured < total_slides:
                    page.keyboard.press('ArrowRight')
                    page.wait_for_timeout(800)  # Wait for transition

            browser.close()

        if frame_index == 0:
            return ConversionResult(
                success=False,
                error='No frames captured'
            )

        # Encode to MP4 with FFmpeg
        # EXP-020 v2: Include audio if extracted
        if audio_temp_path and audio_temp_path.exists():
            # With audio: mux video and audio together
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-framerate', str(settings.fps),
                '-i', str(Path(frame_dir) / 'frame_%05d.png'),
                '-i', str(audio_temp_path),
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-preset', 'medium',
                '-crf', str(settings.crf),
                '-movflags', '+faststart',
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                '-shortest',  # End when shortest stream ends
                '-map', '0:v:0',  # Video from first input
                '-map', '1:a:0',  # Audio from second input
                str(output_path)
            ]
            print(f"[INFO] Running FFmpeg with audio...")
        else:
            # Without audio: video only
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-framerate', str(settings.fps),
                '-i', str(Path(frame_dir) / 'frame_%05d.png'),
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-preset', 'medium',
                '-crf', str(settings.crf),
                '-movflags', '+faststart',
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                str(output_path)
            ]
            print(f"[INFO] Running FFmpeg (no audio)...")

        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return ConversionResult(
                success=False,
                error=f'FFmpeg failed: {result.stderr[:500]}'
            )

        # Get output file size
        size_mb = output_path.stat().st_size / (1024 * 1024)
        duration_s = frame_index / settings.fps

        has_audio = audio_temp_path is not None and audio_data is not None
        print(f"[INFO] Done! {slides_captured} slides, {duration_s:.1f}s, {size_mb:.1f} MB, audio={has_audio}")

        return ConversionResult(
            success=True,
            slides=slides_captured,
            frames=frame_index,
            duration_s=duration_s,
            size_mb=round(size_mb, 2),
            output_path=str(output_path),
            slide_durations=actual_durations,
            has_audio=has_audio
        )

    except Exception as e:
        import traceback
        return ConversionResult(
            success=False,
            error=f'{str(e)}\n{traceback.format_exc()}'
        )
    finally:
        # Cleanup temp directory and audio file
        shutil.rmtree(frame_dir, ignore_errors=True)
        if audio_temp_path and audio_temp_path.exists():
            try:
                audio_temp_path.unlink()
            except Exception:
                pass


if __name__ == '__main__':
    # Test conversion
    import sys
    if len(sys.argv) < 2:
        print('Usage: python html_converter.py <input.html> [output.mp4]')
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else input_path.with_suffix('.mp4')

    print(f'Converting {input_path} to {output_path}...')
    result = convert_html_to_mp4(input_path, output_path)

    if result.success:
        print(f"\nSuccess!")
        print(f"  Slides: {result.slides}")
        print(f"  Duration: {result.duration_s:.1f}s")
        print(f"  Size: {result.size_mb:.1f} MB")
        print(f"  Per-slide durations: {result.slide_durations}")
    else:
        print(f"Error: {result.error}")
        sys.exit(1)
