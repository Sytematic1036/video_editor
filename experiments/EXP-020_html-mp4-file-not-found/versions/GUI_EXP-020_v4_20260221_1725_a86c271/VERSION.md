# GUI_EXP-020_v4_20260221_1725_a86c271

## Metadata
- **Stamplad:** 2026-02-21 17:25
- **Git commit:** a86c271 - EXP-020 v4: Fix black slides being skipped
- **Experiment:** EXP-020_html-mp4-file-not-found
- **Iteration:** v4_fix-black-slides
- **Status:** FUNGERAR

## Komponenter
### Backend
- `src/app.py` - Flask backend med download fix (v1)
- `src/html_converter.py` - HTML to MP4 converter med:
  - SLIDE_CONFIG parsing (v2)
  - Audio extraction (v2)
  - SLIDES array support (v3)
  - Black slides fix (v4)

## Vad fungerar
- HTML upload och slide detection
- SLIDE_CONFIG och SLIDES array parsing
- Per-slide durations (individuella tider)
- Audio extraction fran HTML (base64)
- Download av konverterade MP4-filer
- ALLA slides fangas (inklusive svarta/duplicates)

## Andringar i v4
- Tog bort duplicate-detection som felaktigt hoppade over slides
- Nu fangas ALLA slides baserat pa total_slides count

## Testresultat
- bildspel-fragetecken-v2.html: 3 slides, 50s (korrekt)
- paradigmskifte-presentation.html: 11 slides, 331s med audio
- Alla Playwright-tester passerar

## Beroenden
- Python 3.x
- Flask
- Playwright (for konvertering)
- FFmpeg (for video encoding)

## Rollback
```bash
cd /c/Users/haege/video_editor
git checkout a86c271 -- src/app.py src/html_converter.py
```
