# Iteration v2 - Fix Speech Track Offset

**Datum:** 2026-02-18
**Typ:** Fix (buggfix)
**Baserad på:** v1_autonomous_2026-02-18

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Problem
Video Timeline split fungerade exakt vid playhead (tack vare v1 fix), men Speech Track och Music Track hade fortfarande offset-problem (~20px / ~1s offset).

## Rotorsak
Två problem upptäcktes:

### Problem 1: Inkonsekvent getTrimmedDuration()
Inkonsekvent användning av `getTrimmedDuration()` vs `clip.duration` för silence-klipp.

### Problem 2: CSS Padding Offset (huvudproblemet)
`.timeline-container` har `padding: 20px`. Klipp renderas inuti denna paddade container, men `globalPlayhead` positioneras relativt till `.timeline-wrapper` (utan padding). Detta skapade en 20px visuell offset.

## Lösning

### Fix 1: PLAYHEAD_LEFT_OFFSET konstant
```javascript
const PIXELS_PER_SECOND = 20;
// EXP-011 v2 FIX: Offset to account for .timeline-container padding
const PLAYHEAD_LEFT_OFFSET = 20;
```

### Fix 2: updateGlobalPlayhead() med offset
```javascript
function updateGlobalPlayhead() {
    const maxDuration = getMaxDuration();
    const maxLeft = maxDuration * PIXELS_PER_SECOND;
    const left = Math.min(playheadPosition * PIXELS_PER_SECOND, maxLeft);
    // EXP-011 v2 FIX: Add offset to align with clips inside padded container
    globalPlayhead.style.left = (left + PLAYHEAD_LEFT_OFFSET) + 'px';
}
```

### Fix 3: Dragging med offset
```javascript
// Vid start av drag:
startLeft: (parseFloat(globalPlayhead.style.left) || PLAYHEAD_LEFT_OFFSET) - PLAYHEAD_LEFT_OFFSET

// Vid mousemove:
globalPlayhead.style.left = (newLeft + PLAYHEAD_LEFT_OFFSET) + 'px';
```

### Fix 4: Konsekvent getTrimmedDuration()
Alla funktioner använder nu `getTrimmedDuration(clip)` för ALLA klipp (inklusive silence).

## Filer ändrade
- `src/templates/index.html` - PLAYHEAD_LEFT_OFFSET + 4 funktioner fixade

## Verifiering
- [x] Server startar på port 5019 (HTTP 200)
- [x] Alla fixar finns i koden ("EXP-011 v2 FIX" kommentarer)
- [x] **Playwright test: test_playhead_offset.js PASSED**
  - Playhead vid 5s = 120px (korrekt: 5*20 + 20)
  - Playhead vid 10s = 220px (korrekt: 10*20 + 20)
- [x] **Playwright test: test_split_alignment.js PASSED**
  - Playhead vid 8s = 180px (korrekt)
  - Split vid 8s → Första klipp 8.00s, andra 12.00s (exakt!)
- [ ] Manuell verifiering i browser (rekommenderas)

## Test
Öppna: http://localhost:5019
1. Ladda upp en speech-fil
2. Dra playhead till en position
3. Högerklicka Speech Track → Split at Playhead
4. Verifiera att split sker EXAKT vid playhead-linjen (ingen offset)
