# GUI_EXP-006_v5_20260217_1342_5715514

## Metadata
- **Stamplad:** 2026-02-17 13:42
- **Git commit:** 5715514 - Add EXP-006: Timeline Interactions
- **Experiment:** EXP-006_timeline-interactions
- **Iteration:** v5_mouse_reorder
- **Status:** FUNGERAR

## Komponenter

### Frontend
- app.py (Flask server, port 5012)
- concat.py (FFmpeg video processing)
- templates/index.html (GUI med alla features)

## Vad fungerar

1. **Klickbar timeline** - Klicka pa track/ruler for att seekar video
2. **Dragbar playhead** - Dra rod linje for live scrubbing
3. **Omordna klipp** - Drag-drop klipp for att andra ordning (FIXAT!)
4. **Auto-fit audio** - Knapp trimmar ljud till videolangd

## Andringar fran foregaende version (v4)

- Bytte fran HTML5 Drag & Drop API till pure Mouse Events
- Fixade bugg dar villkoret `toIndex !== fromIndex + 1` blockerade flytt ett steg framat
- Forenklad logik: berakna insertAt forst, sedan kolla om det ar samma som fromIndex
- Lade till debug-loggning for att spara buggar

## Buggfix-detaljer

Ursprunglig bugg: Klipp atergick till ursprungsposition efter drag.

Orsak: Felaktigt villkor i mouseup-handler:
```javascript
// FEL: Blockerade flytt ett steg framat
if (toIndex !== fromIndex && toIndex !== fromIndex + 1)

// RATT: Berakna faktisk insertAt forst
let insertAt = toIndex;
if (fromIndex < toIndex) {
    insertAt = toIndex - 1;
}
if (insertAt !== fromIndex) {
    // Utfor reorder
}
```

## Testresultat

- Manuell test: OK
- Dra klipp at hoger: OK
- Dra klipp at vanster: OK
- Ordning bevaras efter drag: OK

## Beroenden

- Python 3.x
- Flask
- FFmpeg (for concat/preview)

## Rollback

```bash
cd experiments/EXP-006_timeline-interactions/versions/GUI_EXP-006_v5_20260217_1342_5715514
cp -r frontend/* ../../iterations/v5_mouse_reorder/src/
```
