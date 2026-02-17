# Iteration v2 - Fix Delete Bug

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Problem
När man raderade en fil i Speech Track, så raderades filen i Music Track istället.

## Orsak
I `createClipElement()` funktionen, rad 1036-1037:
```javascript
// FÖRE (BUGG):
if (type === 'video') removeVideo(index);
else removeAudio();  // <-- Anropades för ALLA icke-video clips!
```

Detta betydde att:
- Video clips → `removeVideo(index)` ✓
- Speech clips → `removeAudio()` ← FEL! Raderade music track
- Music clips → `removeAudio()` ✓

## Fix
1. Lade till `removeSpeech(index)` funktion
2. Uppdaterade onclick-handler för remove-knappen

```javascript
// EFTER (FIXAT):
if (type === 'video') removeVideo(index);
else if (type === 'speech' || type === 'silence') removeSpeech(index);
else if (type === 'audio') removeAudio();
```

## Ny funktion
```javascript
function removeSpeech(index) {
    speechClips.splice(index, 1);
    if (selectedSpeechClip === index) {
        selectedSpeechClip = null;
    } else if (selectedSpeechClip !== null && selectedSpeechClip > index) {
        selectedSpeechClip--;
    }
    updatePreviewSelect();
    renderTimeline();
    showStatus('Removed clip from speech track', 'success');
}
```

## Tester
- [x] Server startar på port 5015
- [x] Video upload fungerar
- [x] Speech upload fungerar
- [x] Music upload fungerar
- [x] remove-knappen har korrekt logik (verifierat i HTML)
- [x] `removeSpeech` funktion finns

## Filer ändrade
- `templates/index.html`:
  - Rad 1036-1038: Uppdaterad onclick-handler
  - Rad 1703-1713: Ny `removeSpeech()` funktion

## Server
Port: 5015 (http://localhost:5015)
