# EXP-008: Track Upload Buttons

**Status:** EXPERIMENTAL
**Skapad:** 2026-02-17
**Bygger på:** EXP-007 (Dual Audio Channels)

## Mål

1. Ta bort gemensamt "Drag & Drop Files Here"-område
2. Lägg till individuella "Hämta filer"-knappar för varje track:
   - Video Timeline → knapp för videofiler
   - Speech Track → knapp för speech-audio
   - Music Track → knapp för musik-audio

## Features

| Feature | Beskrivning | Status |
|---------|-------------|--------|
| Video-knapp | Knapp till vänster om Video Timeline | [ ] |
| Speech-knapp | Knapp till vänster om Speech Track | [ ] |
| Music-knapp | Knapp till vänster om Music Track | [ ] |
| Ta bort drop-zone | Radera gemensamt Drag & Drop-område | [ ] |

## Teknisk design

### Frontend (index.html)
- Ny CSS för track-header med knapp
- Tre separata file input handlers
- Automatisk routing till rätt track

### Backend (app.py)
- Samma som EXP-007 (ingen ändring behövs)

## Iterationer

| Version | Typ | Datum | Beskrivning |
|---------|-----|-------|-------------|
| v1_autonomous | Autonom | 2026-02-17 | Initial implementation |
| v2_fix_delete_bug | Fix | 2026-02-17 | Fix: Radera speech raderade music istället |
