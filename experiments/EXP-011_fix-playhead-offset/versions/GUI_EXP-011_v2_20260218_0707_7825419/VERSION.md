# GUI_EXP-011_v2_20260218_0707_7825419

## Metadata
- **Stämplad:** 2026-02-18 07:07
- **Git commit:** 7825419 - Add EXP-011 v2: Fix Speech/Music Track offset on split/insert
- **Experiment:** EXP-011_fix-playhead-offset
- **Iteration:** v2_fix_speech_offset_2026-02-18
- **Status:** FUNGERAR (Playwright-testad)

## Beskrivning
EXP-011 v2 - Playwright-tester AVKLARADE

Fixade playhead-offset för Speech Track och Music Track. Rootcause var CSS padding (20px) i `.timeline-container` som orsakade visuell offset mellan playhead och klipp.

## Komponenter

### Frontend
- `frontend/templates/index.html` - Huvudfil med alla fixar
- `frontend/app.py` - Flask server (port 5019)
- `frontend/concat.py` - Video concatenation logic

### Tester (Playwright)
- `test_playhead_offset.js` - Verifierar playhead position med offset
- `test_split_alignment.js` - Verifierar split sker vid exakt playhead

## Vad fungerar
- Playhead positioneras korrekt med 20px offset för padding
- Split at Playhead för Video Timeline - exakt vid playhead
- Split at Playhead för Speech Track - exakt vid playhead
- Split at Playhead för Music Track - exakt vid playhead
- Insert Silence - börjar vid exakt playhead-position
- Playhead dragging fungerar korrekt

## Fixar i denna version
1. **PLAYHEAD_LEFT_OFFSET = 20** - Ny konstant för padding-kompensation
2. **updateGlobalPlayhead()** - Lägger till offset vid positionering
3. **Playhead drag start** - Subtraherar offset vid läsning
4. **Playhead mousemove** - Lägger till offset vid skrivning
5. **getTrimmedDuration()** - Används konsekvent för alla klipp (inkl silence)

## Testresultat (Playwright)

### test_playhead_offset.js
```
✓ Playhead at 5s: 120px (expected: 120px) - PASS
✓ Playhead at 10s: 220px (expected: 220px) - PASS
✓ playheadPosition variable: 10s (expected: 10s) - PASS
```

### test_split_alignment.js
```
✓ Playhead visual left: 180px (expected: 180px) - PASS
✓ First clip duration: 8.00s (expected: 8s) - PASS
✓ Second clip duration: 12.00s (expected: 12s) - PASS
```

## Beroenden
- Python 3.x
- Flask
- ffmpeg (för video concatenation)
- Playwright (för tester)

## Starta
```bash
cd iterations/v2_fix_speech_offset_2026-02-18/src
python app.py
# Öppna http://localhost:5019
```

## Rollback
```bash
./rollback.sh
```
