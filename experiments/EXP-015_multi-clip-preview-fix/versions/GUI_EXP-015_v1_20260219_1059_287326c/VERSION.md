# GUI_EXP-015_v1_20260219_1059_287326c

## Metadata
- **Stämplad:** 2026-02-19 10:59
- **Git commit:** 287326c - Add version stamp: GUI_EXP-014_v1_20260218_1619_9ba1ce3
- **Experiment:** EXP-015_multi-clip-preview-fix
- **Iteration:** v1_autonomous_2026-02-19
- **Status:** FUNGERAR

## Beskrivning
Multi-clip preview fix - fixar två buggar:
1. Preview visade bara ~20s istället av alla klipp concatenerade
2. Clear All rensade inte preview-videon

## Komponenter

### Frontend
- `app.py` - Flask server (port 5021)
- `concat.py` - FFmpeg video concatenation med xfade
- `templates/index.html` - GUI med timeline, preview, export

## Vad fungerar
- Multi-clip preview med olika framerates (2fps + 35fps)
- xfade crossfade mellan klipp
- Clear All rensar nu även preview-element
- Audio-only preview (från EXP-014)
- Dual audio tracks (Speech + Music)

## Ändringar från EXP-014
1. **concat.py rad 327-339:** Lagt till `fps=30,format=yuv420p,setpts=PTS-STARTPTS` för att normalisera framerate innan xfade
2. **concat.py rad 471-475:** Tar bort `-shortest` flagga för multi-clip (så output inte begränsas till kortaste audio)
3. **index.html rad 2593-2602:** Clear All rensar nu `videoPreview.src`, döljer preview-sektion, disablar knappar

## Testresultat
```
Test: strategiska-fordelar.mp4 (233s) + ScreenRecording (18.9s)
Expected: ~250.9s
Result: 250.87s ✓ PASS
```

## Beroenden
- Python 3.x
- Flask
- FFmpeg (med libx264, aac)
- Node.js + Playwright (för tester)

## Starta
```bash
cd frontend
python app.py
# Öppna http://localhost:5021
```

## Rollback
```bash
./rollback.sh
```
