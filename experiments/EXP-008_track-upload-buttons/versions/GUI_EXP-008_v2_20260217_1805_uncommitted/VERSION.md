# GUI_EXP-008_v2_20260217_1805_uncommitted

## Metadata
- **Stämplad:** 2026-02-17 18:05
- **Git commit:** uncommitted
- **Experiment:** EXP-008_track-upload-buttons
- **Iteration:** v2_fix_delete_bug
- **Status:** FUNGERAR

## Komponenter

### Frontend
- app.py (Flask server, port 5015)
- concat.py (FFmpeg video processing)
- templates/index.html (GUI med fixad remove-logik)

## Buggfix

**Problem:** Radera speech → raderade music istället

**Orsak:** `removeAudio()` anropades för alla icke-video clips

**Fix:**
```javascript
// FÖRE (BUGG):
if (type === 'video') removeVideo(index);
else removeAudio();

// EFTER (FIXAT):
if (type === 'video') removeVideo(index);
else if (type === 'speech' || type === 'silence') removeSpeech(index);
else if (type === 'audio') removeAudio();
```

## Ny funktion

```javascript
function removeSpeech(index) {
    speechClips.splice(index, 1);
    // ... handle selectedSpeechClip
    renderTimeline();
}
```

## Testresultat

- Server startar: OK
- Remove-logik korrekt: OK
- removeSpeech funktion finns: OK

## Rollback

```bash
cd experiments/EXP-008_track-upload-buttons/versions/GUI_EXP-008_v2_20260217_1805_uncommitted
cp -r frontend/* ../../iterations/v2_fix_delete_bug/src/
```
