# EXP-016 Implementation Notes

## Ändringar gjorda

### 1. Tidsformat på tidslinje (M:SS)

**Fil:** `templates/index.html`

**Ny funktion (rad ~1060):**
```javascript
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + secs.toString().padStart(2, '0');
}
```

**Ändring i renderRuler (rad ~1630):**
```javascript
// FÖRE:
if (s % 5 === 0) marker.textContent = s + 's';

// EFTER:
if (s % 5 === 0) marker.textContent = formatTime(s);
```

**Resultat:**
- Ruler visar nu "0:00", "0:05", "0:10", "0:15"... istället för "0s", "5s", "10s", "15s"...
- Playhead-labeln visade redan M:SS (oförändrat)

### 2. Preview ↔ Playhead synkronisering

**Status:** Fungerade REDAN i EXP-015

**Analys av befintlig kod:**

a) **Playhead → Preview** (dra playhead uppdaterar video):
```javascript
// Rad 1729-1731 (mousemove för playhead dragging)
if (videoPreview.src && videoPreview.duration) {
    const scaledTime = (playheadPosition / timelineDuration) * videoPreview.duration;
    videoPreview.currentTime = Math.min(scaledTime, videoPreview.duration);
}
```

b) **Preview → Playhead** (video timeupdate uppdaterar playhead):
```javascript
// Rad 2483-2487
videoPreview.addEventListener('timeupdate', () => {
    if (!isPlayingPreview && !isDraggingPlayhead) {
        updatePlayheadPosition();
    }
});
```

**Villkorslogik:**
- `isPlayingPreview = true` när video spelar → använder requestAnimationFrame istället
- `isDraggingPlayhead = true` när man drar playhead → undviker konflikt
- Vid scrubbing (dra preview-slider): båda är false → playhead uppdateras

## Testresultat

### test_timeline_format.js
```
formatTime(0) = 0:00
formatTime(30) = 0:30
formatTime(60) = 1:00
formatTime(90) = 1:30
formatTime(125) = 2:05
Ruler markers: ["0:00","0:05","0:10","0:15","0:20","0:25","0:30",...]
=== TEST PASSED ===
```

### test_playhead_sync.js
```
Max duration = 120s
Set playheadPosition = 30
Playhead left = 620px (korrekt: 30*20+20)
Time label = 0:30
=== ALL TESTS PASSED ===
```

## Port

Ändrat från 5021 (EXP-015) till 5022 (EXP-016)

## Edge cases testade

| Input | Expected | Actual |
|-------|----------|--------|
| 0 | 0:00 | 0:00 |
| 30 | 0:30 | 0:30 |
| 60 | 1:00 | 1:00 |
| 90 | 1:30 | 1:30 |
| 125 | 2:05 | 2:05 |

## Framtida förbättringar

1. **Millisekunder:** Visa "1:30.5" för mer precision vid trimning
2. **Längre videor:** Format som "1:02:30" för videor över 1 timme
3. **Ruller-intervall:** Vid långa videor, visa markörer var 10:e eller 30:e sekund istället för var 5:e
