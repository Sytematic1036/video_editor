# GUI_EXP-012_v1_20260218_0905_2ac8b3a

## Metadata
- **Stämplad:** 2026-02-18 09:05
- **Git commit:** 2ac8b3a - Add EXP-012: Separate volume controls for Speech and Music tracks
- **Experiment:** EXP-012_volume-controls
- **Iteration:** v1_autonomous_2026-02-18
- **Status:** FUNGERAR (Playwright-testad)

## Beskrivning
Separata volyminställningar för Speech Track och Music Track.

## Komponenter

### Frontend
- `frontend/templates/index.html` - Huvudfil med volymsliders
- `frontend/app.py` - Flask server (port 5019)
- `frontend/concat.py` - Video concatenation med volymhantering

### Tester (Playwright)
- `test_volume_controls.js` - 10 tester för volymkontroller

## Vad fungerar
- Speech Volume slider (0-200%, default 100%)
- Music Volume slider (0-200%, default 50%)
- Volymvisning uppdateras i realtid
- JavaScript-variabler `speechVolume` och `musicVolume`
- Funktioner `getSpeechVolumeDecimal()` och `getMusicVolumeDecimal()`
- Volymvärden skickas till backend vid preview/export
- FFmpeg applicerar volymfilter på speech track

## Testresultat (Playwright)

### test_volume_controls.js - 10 tester
```
✓ Speech Volume slider exists
✓ Music Volume slider exists
✓ Speech Volume display exists
✓ Music Volume display exists
✓ Default values correct
✓ Speech slider can be changed
✓ Music slider can be changed
✓ JavaScript variables accessible
✓ Slider input updates variables
✓ Volume range is 0-200
=== ALL TESTS PASSED ===
```

## Beroenden
- Python 3.x
- Flask
- ffmpeg
- Playwright (för tester)

## Starta
```bash
cd iterations/v1_autonomous_2026-02-18/src
python app.py
# Öppna http://localhost:5019
```

## Rollback
```bash
./rollback.sh
```
