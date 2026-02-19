"""Direct test of concat.py"""
import sys
sys.path.insert(0, 'src')

from pathlib import Path
from concat import VideoClipSpec, CrossfadeSpec, concat_videos

# Test files
clip1 = VideoClipSpec(
    path=Path("C:/Users/haege/Downloads/strategiska-fordelar.mp4"),
    duration_s=233.0,
    trim_start=0,
    trim_end=0
)

clip2 = VideoClipSpec(
    path=Path("C:/Users/haege/Downloads/ScreenRecording_02-18-2026 08-44-30_1.MP4"),
    duration_s=18.9,
    trim_start=0,
    trim_end=0
)

crossfade = CrossfadeSpec(duration_s=1.0, transition="fade")

output = Path("preview/test_direct.mp4")

print("Testing concat_videos directly...")
print(f"Clip 1: {clip1.path.name}, duration={clip1.duration_s}s")
print(f"Clip 2: {clip2.path.name}, duration={clip2.duration_s}s")
print(f"Expected output: ~{clip1.duration_s + clip2.duration_s - 1}s")
print()

try:
    concat_videos(
        video_clips=[clip1, clip2],
        output_path=output,
        crossfade=crossfade,
        resolution=(1280, 720)
    )
    print(f"\nOutput: {output}")

    # Check result
    import subprocess
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(output)],
        capture_output=True, text=True
    )
    print(f"Actual duration: {result.stdout.strip()}s")

except Exception as e:
    print(f"ERROR: {e}")
