# GUI_EXP-009_v1_20260217_2115_uncommitted

## Metadata
- **Stämplad:** 2026-02-17 21:15
- **Git commit:** uncommitted (base: 7f58c5b)
- **Experiment:** EXP-009_enhanced-playhead
- **Iteration:** v1_autonomous_2026-02-17
- **Status:** FUNGERAR

## Komponenter

### Frontend
- app.py (Flask server, port 5016)
- concat.py (FFmpeg video processing med dual audio)
- templates/index.html (GUI med global playhead)

## Vad fungerar

1. **Global Playhead** - Röd vertikal linje som täcker alla tracks
2. **Extended Drag Range** - Playhead kan dras till max(video, speech, music) duration
3. **Playhead Context Menu** - Högerklick på playhead visar meny
4. **Insert Silence at Playhead** - Infogar tystnad i speech track vid playhead-position
5. **Split Clip at Playhead** - Delar video/speech klipp vid playhead-position

## Ändringar från föregående version (EXP-008 v2)

- Lade till `.timeline-wrapper` container runt alla tracks
- Ny `.global-playhead` element med CSS för visuell feedback
- `getMaxDuration()` funktion för att beräkna max längd
- `updateGlobalPlayhead()` uppdaterar position vid render
- Högerklick context menu för playhead
- `splitClipAtPlayhead()` funktion för split-funktionalitet
- Port ändrad från 5015 till 5016

## Teknisk implementation

### Global Playhead CSS
```css
.timeline-wrapper { position: relative; }
.global-playhead {
    position: absolute; top: 0; bottom: 0;
    width: 2px; background: #ff3333; z-index: 500;
}
```

### JavaScript
```javascript
function getMaxDuration() {
    return Math.max(videoDur, speechDur, musicDur, 1);
}

function splitClipAtPlayhead() {
    // Splits video or speech clip at playhead position
}
```

## Beroenden
- Python 3.x
- Flask
- FFmpeg (för concat.py)

## Rollback

```bash
cd experiments/EXP-009_enhanced-playhead/versions/GUI_EXP-009_v1_20260217_2115_uncommitted
cp -r frontend/* ../../iterations/v1_autonomous_2026-02-17/src/
```
