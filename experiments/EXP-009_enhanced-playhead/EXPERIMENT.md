# EXP-009: Enhanced Playhead

**Status:** EXPERIMENTAL
**Skapad:** 2026-02-17
**Bygger på:** EXP-008 v2 (Track Upload Buttons + Delete Fix)

## Mål

1. Playhead (tidsmarkör) sträcker sig över ALLA tracks (video, speech, music)
2. Playhead kan dras hela vägen till längsta filens slut
3. Högerklick på playhead visar context menu:
   - Insert Silence (vid playhead-position)
   - Split Clip (dela klipp vid playhead-position)

## Features

| Feature | Beskrivning | Status |
|---------|-------------|--------|
| Global playhead | Vertikal linje över alla tracks | [ ] |
| Extended drag | Dra till max(video, speech, music) duration | [ ] |
| Playhead context menu | Högerklick → Insert Silence / Split | [ ] |
| Split clip | Dela klipp vid playhead-position | [ ] |

## Teknisk design

### Frontend (index.html)
- Flytta playhead till en gemensam overlay-container
- Ny `.playhead-overlay` som täcker alla tracks
- Högerklick-meny på playhead
- Split-funktion för video och speech clips

### Backend (app.py)
- Ingen ändring behövs (split görs i frontend)

## Iterationer

| Version | Typ | Datum | Beskrivning |
|---------|-----|-------|-------------|
| v1_autonomous | Autonom | 2026-02-17 | Initial implementation |

## Stämplade versioner

| Version | Datum | Status |
|---------|-------|--------|
| GUI_EXP-009_v1_20260217_2115_uncommitted | 2026-02-17 21:15 | FUNGERAR |
