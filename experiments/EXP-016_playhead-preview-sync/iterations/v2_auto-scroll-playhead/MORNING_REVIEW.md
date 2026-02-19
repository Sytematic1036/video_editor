# Autonom körning 2026-02-19 (v2)

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Iteration: v2_auto-scroll-playhead
- Bygger på: v1_autonomous_2026-02-19
- Port: 5023

## Problem (från användarfeedback)
> "När preview är på ett ställe tidsmässigt som inte syns i första bilden så försvinner playhead ur bild. Jag vill att allt scrollas åt höger så att playhead aldrig försvinner ur bild."

## Lösning
Implementerat `ensurePlayheadVisible()` som:
1. Kollar om playhead är utanför synligt viewport
2. Scrollar ALLA `.track-scroll` element så playhead blir synlig
3. Behåller 20% marginal från kanterna (smooth UX)
4. Använder smooth scroll för mjuk animation

## Ändringar
- [x] `ensurePlayheadVisible()` funktion tillagd
- [x] Anropas från `updateGlobalPlayhead()`
- [x] Anropas från `updatePlayheadPosition()`
- [x] Scroll-synkronisering mellan Video/Speech/Music tracks
- [x] Playwright-test `test_auto_scroll.js`

## Testresultat
```
test_auto_scroll.js: PASS
  - Playhead vid 200s (4020px) → timeline scrollade till 3060px
  - Playhead synlig i viewport (3060px - 4260px)
  - 20% marginal från höger kant (240px)
  - Alla 3 tracks scrollade synkront
```

## Nya filer
- `test_auto_scroll.js` - Playwright-test för auto-scroll

## Ändrade filer
- `templates/index.html`:
  - Lade till `ensurePlayheadVisible()` (rad ~1684-1713)
  - Lade till scroll-sync IIFE (rad ~1715-1733)
  - Anropar `ensurePlayheadVisible()` från två funktioner
- `app.py` - Port ändrad till 5023

## Rekommenderade nästa steg
1. Testa manuellt:
   ```bash
   cd experiments/EXP-016_.../iterations/v2_auto-scroll-playhead/src
   python app.py
   # Öppna http://localhost:5023
   ```
2. Verifiera:
   - [ ] Lägg till lång video (>2 min)
   - [ ] Dra playhead till 90+ sekunder
   - [ ] Timeline ska scrolla automatiskt
   - [ ] Alla tracks ska scrolla synkront
3. Om OK: kopiera till versions/ och commit
