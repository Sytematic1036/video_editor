# Iteration v3 - Stable Reorder

**Datum:** 2026-02-17
**Typ:** Fix (autonom)
**Baserad på:** v2_fix_reorder

## Problem att lösa

Reorder-funktionen är instabil:
- Klipp stannar på ny plats ibland, men återgår sedan
- Fungerar en gång, sedan slutar det fungera
- Problemet verkar vara i hur state hanteras efter drag-and-drop

## Grundorsak (hypotes)

1. **Race condition** - renderTimeline() körs innan splice är klar
2. **Index-förvirring** - dropIndex beräknas fel vid framåtflyttning
3. **State-korruption** - clipDragData blir förvirrad mellan drag-events

## Ny approach: Enklare reorder-logik

Istället för komplex dropIndex-beräkning, använd en enklare metod:
1. Spara ursprungsordning vid drag-start
2. Vid drop: beräkna ny position baserat på slutlig X-koordinat
3. Sortera om array baserat på visuell position
4. Re-rendera

## Ändringar
- [ ] Förenkla reorder-logik
- [ ] Ta bort komplex dropIndex-beräkning
- [ ] Använd position-baserad sortering istället
- [ ] Testa stabiliteten
