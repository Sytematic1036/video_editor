# Iteration v2 - Fix Reorder

**Datum:** 2026-02-17
**Typ:** Fix
**Baserad pa:** v1_autonomous_2026-02-17

## Problem att losa

1. **Klipp atergar till ursprungsplats** - Efter att man drar ett klipp i sidled
   sa stannar det inte pa den nya platsen utan atergar till ursprungslaget.

2. **Fit Audio-knappen forklaras inte** - Anvandaren forstar inte hur man
   anpassar musiken/ljudet till filmernas sammanlagda langd.

## Losning

### Problem 1: Reorder fungerar inte
Buggen ar att `reorderClip()` anropas men klippen aterstalls nar
`renderTimeline()` kors. Problemet ar troligen i logiken som bestammer
om reorder ska ske eller inte.

### Problem 2: Fit Audio UX
- Gora knappen mer synlig
- Lagga till tydligare instruktioner
- Visa resultat efter klick

## Andringar
- [x] Fixa reorder-logiken
- [x] Forbattra Fit Audio UX

## Genomforda andringar

### Reorder-fix (index.html rad 999-1009)
Buggen var att villkoret `toIndex !== fromIndex + 1` forhindrade att flytta klipp
ett steg framat. Losen:
```javascript
if (toIndex !== undefined && toIndex !== fromIndex) {
    const actualNewIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
    if (actualNewIndex !== fromIndex) {
        reorderClip(fromIndex, actualNewIndex);
    }
}
```

### Fit Audio UX (index.html rad 440-445)
Lade till tydliga instruktioner pa svenska:
- "Klicka for att automatiskt trimma ljudet sa det matchar videolangden"
- "Om ljudet ar langre an videon → trimmas fran slutet"
- "Om ljudet ar kortare → du far en varning"
