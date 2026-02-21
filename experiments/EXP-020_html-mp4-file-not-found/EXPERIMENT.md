# EXP-020: HTML to MP4 Fixes

## Status
`VERIFIED`

## Bygger fran
- EXP-019_timeline-playhead-fixes

## Mal
Fixa HTML-till-MP4-konvertering:
1. "File not found" vid download
2. Separata slide-tider fran SLIDE_CONFIG
3. Ljud fran HTML-filen

## Target Repo
https://github.com/Sytematic1036/video_editor

## Arkitektur
- **Backend:** Flask (Python)
- **Frontend:** Vanilla JavaScript (inline i HTML)
- **Port:** 5022

## Iterationer

### v1_autonomous_2026-02-21 - File not found fix
**Problem:** `download_export()` sokte ENDAST i `exports/`, men `html-to-mp4` sparar till `output/`.

**Fix:** Uppdaterade `download_export()` att soka i BADE mappar.

**Tester:** 6/6 passerade

### v2_slide-durations-and-audio - SLIDE_CONFIG + Audio (CURRENT)
**Problem 1:** HTML anvander `SLIDE_CONFIG = [{ duration: 33 }, ...]`, men konverteraren letade efter `SAVED_DURATIONS`.

**Problem 2:** Audio (5.1 MB base64 i `AUDIO_DATA`) ignorerades helt.

**Fixes:**
- `extract_slide_config()` - Laser SLIDE_CONFIG format
- `extract_audio_data()` - Extraherar base64 audio
- FFmpeg med `-i audio.mp3 -c:a aac` for att inkludera ljud

**Tester:** 10/10 passerade
- 11 slides detekterade (korrekt)
- 331.3s total duration (korrekt, inte 55s)
- MP4 har video (h264, 331s)
- MP4 har audio (aac, 331s)

## Framgangskriterier
1. [x] HTML-fil laddas upp korrekt
2. [x] SLIDE_CONFIG durations extraheras (11 slides, 331s)
3. [x] Audio extraheras fran HTML (5.1 MB)
4. [x] Konvertering slutfor utan fel
5. [x] MP4 har korrekt duration (~331s)
6. [x] MP4 har audio stream
7. [x] Download-lank returnerar 200
8. [x] Playwright-tester passerar (10/10)

## Filer
- `src/app.py` - Fixed download route (v1)
- `src/html_converter.py` - SLIDE_CONFIG + audio support (v2)
- `iterations/v1.../tests/test_html_to_mp4.js` - Download test
- `iterations/v2.../tests/test_slide_durations_and_audio.js` - Full test
