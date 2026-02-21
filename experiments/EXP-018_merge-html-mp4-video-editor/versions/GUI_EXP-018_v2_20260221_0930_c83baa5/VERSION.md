# GUI_EXP-018_v2_20260221_0930_c83baa5

## Metadata
- **Stämplad:** 2026-02-21 09:30
- **Git commit:** c83baa5 - Add EXP-017 v3: Individual slide durations editor
- **Experiment:** EXP-018_merge-html-mp4-video-editor
- **Iteration:** v2_correct-video-editor
- **Status:** FUNGERAR

## Beskrivning
Merged Video Editor (från EXP-016 v3_live-drag-scroll) med HTML to MP4 (från EXP-017).
Båda funktionerna är tillgängliga som flikar i samma GUI.

## Komponenter

### Frontend
- `templates/index.html` - Merged GUI (3807 rader)
  - Video Editor tab med playhead, timeline, live drag scroll
  - HTML to MP4 tab med slide durations editor

### Backend
- `app.py` - Merged Flask backend med alla routes
- `concat.py` - Video concatenation (FFmpeg)
- `html_converter.py` - HTML to MP4 converter (Playwright + FFmpeg)

## Vad fungerar
- [x] Båda flikar visas
- [x] Tab-switching fungerar
- [x] Video Editor: upload, preview, export, playhead
- [x] HTML to MP4: upload, slide durations, generate, download
- [x] Playhead context menu (split clip, insert silence)
- [x] Live drag scroll i timeline
- [x] 20/20 Playwright-tester passerar

## Testresultat
```
GUI Tests: 14 passed, 0 failed
HTML Upload Tests: 6 passed, 0 failed
Total: 20/20 PASSED
```

## Beroenden
- Python 3.x
- Flask
- Playwright
- FFmpeg
- Node.js (för tester)

## Port
- 5022

## Rollback
```bash
cd experiments/EXP-018_merge-html-mp4-video-editor/versions/GUI_EXP-018_v2_20260221_0930_c83baa5
./rollback.sh
```
