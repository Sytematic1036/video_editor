# GUI_EXP-021_v1_20260221_1925_fdf916e

## Metadata
- **Stamplad:** 2026-02-21 19:25
- **Git commit:** fdf916e - EXP-021: Add Include audio checkbox to HTML to MP4 converter
- **Experiment:** EXP-021_audio-checkbox
- **Iteration:** v1_autonomous_2026-02-21
- **Status:** FUNGERAR

## Komponenter
### Backend
- `src/app.py` - Flask backend med include_audio parameter
- `src/html_converter.py` - Konverterare med include_audio stod

### Frontend
- `src/templates/index.html` - GUI med "Include audio" checkbox

## Vad fungerar
- Checkbox "Include audio" i HTML to MP4 tab
- Default = unchecked (ingen audio)
- include_audio=true -> MP4 med ljud (om HTML har audio)
- include_audio=false -> MP4 utan ljud
- Alla 8 Playwright-tester passerar

## Andringar fran EXP-020 v4
- Lade till checkbox #htmlIncludeAudio i frontend
- Lade till include_audio parameter i /html-to-mp4 endpoint
- Modifierade convert_html_to_mp4() for att respektera include_audio

## Testresultat
```
Test 1: Load page              OK
Test 2: Switch tab             OK
Test 3: Checkbox exists        OK (unchecked by default)
Test 4: Upload HTML            OK
Test 5: Start conversion       OK (include_audio=false)
Test 6: Wait for completion    OK
Test 7: Verify no audio        OK (0 audio streams)
Test 8: Toggle checkbox        OK

RESULTS: 8 passed, 0 failed
```

## Beroenden
- Python 3.x
- Flask
- Playwright (for konvertering)
- FFmpeg (for video encoding)

## Rollback
```bash
cd /c/Users/haege/video_editor
git checkout fdf916e -- src/app.py src/html_converter.py src/templates/index.html
```
