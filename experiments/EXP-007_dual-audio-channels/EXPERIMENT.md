# EXP-007: Dual Audio Channels (Speech + Music)

**Status:** EXPERIMENTAL
**Skapad:** 2026-02-17
**Bygger pa:** EXP-006 v5

## Mal

1. Tva separata ljudkanaler - Speech + Music
2. Lagga till flera speech-clips pa speech-kanalen
3. Infoga tystnad/pauser for att tima speech ratt

## Features

| Feature | Beskrivning | Status |
|---------|-------------|--------|
| Speech-kanal | Ny track for speech/voiceover | [ ] |
| Music-kanal | Befintlig audio-track for musik | [ ] |
| Insert Silence | Hogerklick -> dialog for langd | [ ] |
| Dual mix | FFmpeg mixar bada ljudsparen vid export | [ ] |

## Teknisk design

### Frontend (index.html)
- Ny `speechTrack` element under videoTrack
- Ny `speechClips[]` array for speech-segment
- `silenceClips[]` array for tysta segment
- Kontextmeny vid hogerklick pa speech-track

### Backend (app.py)
- `/upload` hantera bade music och speech
- `/export` mixa tva ljudspar med FFmpeg

### FFmpeg (concat.py)
- `amix` filter for att kombinera speech + music
- Silence-generator: `-f lavfi -i anullsrc=r=44100:cl=stereo`

## Iterationer

| Version | Typ | Datum | Beskrivning |
|---------|-----|-------|-------------|
| v1_autonomous | Autonom | 2026-02-17 | Initial implementation |
