# Autonom korning 2026-02-18

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Skapade experiment: EXP-011_fix-playhead-offset
- Fixade: Dubbel playhead + offset vid split/insert
- Server: port 5018

## Fixar implementerade

### Fix 1: Dubbel playhead (KLAR)
**Problem:** I `renderVideoTimeline()` skapades en gammal playhead dynamiskt (rad 1067-1088) UTOVER den globala playheaden.

**Losning:** Tog bort den gamla koden som skapade `#playhead`-elementet. Nu finns bara `#globalPlayhead`.

**Verifiering:**
- Sökresultat visar 0 element med `id="playhead"`
- Sökresultat visar 1 element med `id="globalPlayhead"`

### Fix 2: Offset vid split/insert (KLAR)
**Problem:** Playhead-linjen är 2px bred. När `left: Xpx` sätts placeras VÄNSTER kant vid X, men visuellt förväntar sig användaren att MITTEN (X+1px) är split-punkten.

**Losning:** La till `margin-left: -1px;` i `.global-playhead` CSS så att mittlinjen är vid exakt position.

**Verifiering:**
```css
.global-playhead {
    width: 2px;
    margin-left: -1px; /* Center the playhead line at exact position */
}
```

## Filer andrade

| Fil | Andring |
|-----|---------|
| `src/templates/index.html` | Tog bort gammal playhead-kod, la till margin-left fix |
| `src/app.py` | Uppdaterade port till 5018, uppdaterade beskrivning |

## Kodandringar i detalj

### index.html
1. Andrade titel till EXP-011
2. La till `margin-left: -1px;` i `.global-playhead` CSS
3. Tog bort `renderVideoTimeline()` playhead-skapande kod (22 rader)
4. Uppdaterade `videoPreview.addEventListener('ended')` att anvanda globalPlayhead
5. Uppdaterade `videoPreview.addEventListener('play')` att anvanda globalPlayhead
6. Uppdaterade `updatePlayheadPosition()` att anvanda globalPlayhead
7. Uppdaterade preview full composition att anvanda globalPlayhead

### app.py
1. Andrade port fran 5017 till 5018
2. Uppdaterade docstring och banner

## Tester

### Automatiska verifieringar (ALLA PASSERADE)
- [x] Server startar pa port 5018 (HTTP 200) ✅
- [x] Endast 1 playhead-element (globalPlayhead) ✅
- [x] margin-left: -1px finns i CSS ✅
- [x] Inga gamla `getElementById('playhead')` anrop (utom playheadContextMenu) ✅

**Testresultat:**
```
Test 1: Old playhead count = 0 (expected: 0) ✓
Test 2: Global playhead count = 1 (expected: 1) ✓
Test 3: HTTP status = 200 (expected: 200) ✓
```

### Manuella tester (KRAV)
- [ ] Oppna http://localhost:5018
- [ ] Ladda upp video - bara EN playhead syns
- [ ] Dra playhead - linjen foljer musen
- [ ] Hogerklicka Video Track → Split at Playhead → split exakt vid linje
- [ ] Hogerklicka Speech Track → Insert Silence → silence borjar vid linje
- [ ] Hogerklicka Music Track → Split at Playhead → split exakt vid linje

## Rekommenderade nasta steg
1. Oppna: http://localhost:5018
2. Testa manuellt enligt checklistan ovan
3. Om OK: `/stamp-version EXP-011`

## Tekniska detaljer

### Varfor margin-left: -1px?
```
Playhead width = 2px
left: 100px → linjen tacker 100-102px
Visuell mitt = 101px

Med margin-left: -1px:
left: 100px → linjen tacker 99-101px
Visuell mitt = 100px ✓
```

### Borttagen kod (renderVideoTimeline)
```javascript
// BORTTAGET - skapade dubbel playhead
const playheadEl = document.createElement('div');
playheadEl.className = 'playhead';
playheadEl.id = 'playhead';
// ... 22 rader
videoTrack.appendChild(playheadEl);
```
