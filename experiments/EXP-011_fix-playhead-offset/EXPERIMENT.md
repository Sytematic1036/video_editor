# EXP-011: Fix Playhead & Offset Issues

**Status:** EXPERIMENTAL
**Skapad:** 2026-02-18
**Bygger på:** EXP-010 (Track Context Menus)

## Mål

1. **Ta bort dubbla playhead** - Det skapas en extra playhead i `renderVideoTimeline()` som överlappar med `globalPlayhead`
2. **Fixa offset vid split/insert** - Split/insert sker inte exakt vid playheadlinjen utan ~1px till höger

## Buggar som fixas

### Bug 1: Dubbel playhead
I EXP-010 skapas en gammal playhead dynamiskt i `renderVideoTimeline()` (rad 1067-1088) trots att det redan finns en global playhead i HTML. Detta skapar TVÅ synliga playheads.

**Fix:** Ta bort koden som skapar den gamla playhead-elementet.

### Bug 2: Offset vid split/insert
Playhead är 2px bred. När `left: Xpx` sätts, är det VÄNSTER kant som placeras vid X. Men visuellt förväntar man sig att MITTEN av linjen (X+1px) är split-positionen.

**Fix:** Centrera playhead genom att använda `transform: translateX(-50%)` eller justera till 1px bred.

## Features

| Feature | Beskrivning | Status |
|---------|-------------|--------|
| Single playhead | Bara EN playhead visas | [ ] |
| Exakt split | Split sker vid playhead-mittlinje | [ ] |
| Exakt insert | Insert silence börjar vid playhead-mittlinje | [ ] |

## Port
5018

## Iterationer

| Version | Typ | Datum | Beskrivning |
|---------|-----|-------|-------------|
| v1_autonomous | Autonom | 2026-02-18 | Fix double playhead + offset |
