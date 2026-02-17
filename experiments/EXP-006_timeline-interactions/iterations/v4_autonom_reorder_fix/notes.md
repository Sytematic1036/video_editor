# Iteration v4 - Autonom Reorder Fix

**Datum:** 2026-02-17
**Typ:** Autonom (Claude)
**Baserad pa:** v3_stable_reorder

## Problem

Tidigare versioner (v2, v3) hade problem dar klipp atergick till sin ursprungsposition
efter drag-and-drop. Problemet var i den manuella berakningen av drop-index.

## Losning: HTML5 Drag & Drop API

Istallet for manuell mousedown/mousemove/mouseup-hantering, anvand webbläsarens
inbyggda HTML5 Drag & Drop API som ar mer robust och fungerar konsekvent.

### Ny implementation

1. `draggable="true"` pa videoklipp
2. `dragstart` - spara vilket klipp som dras
3. `dragover` - visa var klippet kommer att hamna (vänster/höger-indikator)
4. `dragend` - utför splice-operationen och re-rendera

### Fördelar

- Webbläsaren hanterar drag-tillstandet
- Ingen manuell position-beräkning
- Visuell feedback (cursor: grab/grabbing)
- Gröna indikatorer visar var klippet hamnar

## Tester

- [ ] Dra klipp at höger - ska stanna pa ny plats
- [ ] Dra klipp at vänster - ska stanna pa ny plats
- [ ] Dra forsta klipp till sista position
- [ ] Dra sista klipp till forsta position
- [ ] Trim-handles ska fortfarande fungera

## Port

Kors pa port 5011
