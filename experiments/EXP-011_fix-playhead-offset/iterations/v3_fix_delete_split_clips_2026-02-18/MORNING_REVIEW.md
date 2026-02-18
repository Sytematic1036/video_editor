# Iteration v3 - Fix Delete Split Clips

**Datum:** 2026-02-18
**Typ:** Fix (buggfix)
**Baserad på:** v2_fix_speech_offset_2026-02-18

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Problem
Användaren kunde inte radera splittade delar av ljudfiler i Speech Track och Music Track.

## Rotorsak
Två buggar identifierades:

### Bug 1: Högerklick satte inte selectedSpeechClip
`contextmenu`-eventet (högerklick) triggade INTE `click`-eventet som sätter `selectedSpeechClip`.
Därför visste "Remove Clip" i context-menyn inte vilket klipp som skulle raderas.

### Bug 2: removeAudio() hanterade inte musicClips-arrayen
`removeAudio()` satte bara `audioClip = null`, men efter split lagras klipp i `musicClips[]`-arrayen.
Remove-knappen anropade `removeAudio()` utan index.

## Lösning

### Fix 1: Högerklick väljer klipp (rad ~2301)
```javascript
// EXP-011 v3 FIX: Check if right-click is on a clip and select it
speechTrack.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const clipEl = e.target.closest('.timeline-clip');
    if (clipEl && (clipEl.classList.contains('speech') || clipEl.classList.contains('silence'))) {
        const index = parseInt(clipEl.dataset.index);
        selectSpeechClip(index);  // <-- NYTT: Välj klipp vid högerklick
    }
    // ... rest of handler
});
```

### Fix 2: Ny removeMusicClip(index) funktion (rad ~2146)
```javascript
// EXP-011 v3 FIX: Add function to remove individual music clips
function removeMusicClip(index) {
    if (musicClips.length > 0) {
        musicClips.splice(index, 1);
        if (musicClips.length === 0) {
            audioClip = null;  // Rensa även audioClip
        }
    } else if (audioClip) {
        audioClip = null;
    }
    // ... render och status
}
```

### Fix 3: Uppdaterad createClipElement (rad ~1202)
```javascript
removeBtn.onclick = (e) => {
    e.stopPropagation();
    if (type === 'video') removeVideo(index);
    else if (type === 'speech' || type === 'silence') removeSpeech(index);
    // EXP-011 v3 FIX: Use removeMusicClip with index instead of removeAudio
    else if (type === 'audio') removeMusicClip(index);
};
```

## Filer ändrade
- `src/templates/index.html` - 3 fixar

## Verifiering
- [x] Server startar på port 5019 (HTTP 200)
- [x] **Playwright test: test_delete_split_clips.js PASSED**
- [x] **Playwright test: test_speech_delete_fixed.js PASSED**
- [x] **Playwright test: test_music_delete.js PASSED**

## Testresultat (Playwright)

### test_speech_delete_fixed.js
```
✓ Direct removeSpeech(1) works
✓ Menu remove works when clip is selected
✓ Remove button works
=== ALL TESTS PASSED ===
```

### test_music_delete.js
```
✓ removeMusicClip(1) works
✓ Remove button works for music clips
✓ Removing last clip also clears audioClip
=== ALL TESTS PASSED ===
```

### test_delete_split_clips.js
```
✓ Delete function works on split clips
✓ Remove button works on split clips
=== ALL TESTS PASSED ===
```

## Test
Öppna: http://localhost:5019
1. Ladda upp en speech-fil
2. Dra playhead till en position
3. Högerklicka Speech Track → Split at Playhead
4. Klicka på X-knappen på någon av de splittade delarna
5. Verifiera att klippet raderas
