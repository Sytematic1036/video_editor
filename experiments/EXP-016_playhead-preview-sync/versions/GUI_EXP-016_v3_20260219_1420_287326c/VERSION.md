# GUI_EXP-016_v3_20260219_1420_287326c

## Metadata
- **Stämplad:** 2026-02-19 14:20
- **Git commit:** 287326c - Add version stamp: GUI_EXP-014_v1_20260218_1619_9ba1ce3
- **Experiment:** EXP-016_playhead-preview-sync
- **Iteration:** v3_live-drag-scroll
- **Status:** FUNGERAR

## Beskrivning
Live drag scroll - fixar två buggar:
1. Playhead syns nu vid preview-scrubbing (var tidigare utanför synligt område)
2. Timeline scrollar i realtid när man drar playhead mot kanten

## Komponenter

### Frontend
- `app.py` - Flask server (port 5024)
- `concat.py` - FFmpeg video concatenation med xfade
- `templates/index.html` - GUI med timeline, preview, export

## Vad fungerar
- Playhead synlig vid preview-scrubbing
- Live scroll under playhead-drag
- Auto-scroll när playhead sätts utanför synligt område
- 20% marginal från kanter
- Scroll-sync mellan Video/Speech/Music tracks
- Tidsformat M:SS (0:30, 1:00, 1:30)
- Multi-clip preview (från EXP-015)
- Clear All fungerar (från EXP-015)

## Ändringar från v2
1. **Ny funktion `updatePlayheadVisualPosition()`** - Justerar playhead's visuella position baserat på scroll
2. **`ensurePlayheadVisible()`** - Kallar nu updatePlayheadVisualPosition()
3. **`updateGlobalPlayhead()`** - Låter ensurePlayheadVisible() hantera position
4. **`updatePlayheadPosition()`** - Samma som ovan
5. **Mousemove (playhead drag)** - Kallar ensurePlayheadVisible() för live scroll
6. **Scroll-sync IIFE** - Kallar updatePlayheadVisualPosition() vid scroll

## Testresultat
```
test_live_drag_scroll.js: PASS
  - updatePlayheadVisualPosition adjusts for scroll
  - Playhead visible after live scroll

test_auto_scroll.js: PASS
  - Visual position correct
  - All 3 tracks synced
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
# Öppna http://localhost:5024
```

## Rollback
```bash
./rollback.sh
```
