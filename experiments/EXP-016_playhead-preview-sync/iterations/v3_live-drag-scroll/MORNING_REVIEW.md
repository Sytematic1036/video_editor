# Autonom körning 2026-02-19 (v3)

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Iteration: v3_live-drag-scroll
- Bygger på: v2_auto-scroll-playhead
- Port: 5024

## Problem (från användarfeedback)
1. Playhead syns inte när man drar preview-slidern
2. Timeline scrollar inte i realtid när man drar playhead mot kanten

## Lösning
**Rotorsak:** Playhead har `position: absolute` i `timeline-wrapper` men ligger UTANFÖR de scrollande `track-scroll` divvarna.

**Fix:** Ny funktion `updatePlayheadVisualPosition()` som:
1. Beräknar playhead's absoluta position (playheadPosition * PIXELS_PER_SECOND + OFFSET)
2. Subtraherar scrollLeft för att få visuell position
3. Sätter playhead's style.left till visuell position

## Ändringar
- [x] `updatePlayheadVisualPosition()` - ny funktion
- [x] `ensurePlayheadVisible()` - kallar updatePlayheadVisualPosition()
- [x] `updateGlobalPlayhead()` - låter ensurePlayheadVisible() hantera position
- [x] `updatePlayheadPosition()` - samma som ovan
- [x] Mousemove (playhead drag) - kallar ensurePlayheadVisible() för live scroll
- [x] Scroll-sync IIFE - kallar updatePlayheadVisualPosition() vid scroll
- [x] Playwright-tester uppdaterade

## Testresultat
```
test_live_drag_scroll.js: PASS
test_auto_scroll.js: PASS

Verifierat:
- Playhead visual position = absoluteLeft - scrollLeft
- Playhead synlig efter auto-scroll (960px inom 0-1200px viewport)
- Alla 3 tracks scrollar synkront
```

## Nya filer
- `test_live_drag_scroll.js` - Nytt Playwright-test

## Rekommenderade nästa steg
1. Testa manuellt:
   ```bash
   cd experiments/EXP-016_.../iterations/v3_live-drag-scroll/src
   python app.py
   # Öppna http://localhost:5024
   ```
2. Verifiera:
   - [ ] Lägg till lång video (>2 min)
   - [ ] Dra preview-slider → Playhead ska vara synlig
   - [ ] Dra playhead mot höger kant → Timeline scrollar i realtid
3. Om OK: kopiera till versions/ och commit
