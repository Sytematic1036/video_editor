# EXP-026: Audio Source Radio Buttons

## Status: EXPERIMENTAL

## Mål
Skapa 3 radioknappar i Video Editor-tabben för att välja ljudkälla vid export:

1. **Ljud från Video** - Ta ljudet från uppladdade MP4-filer i Video Timeline
2. **Ljud från Video Editor** - Använd Speech Track + Music Track (nuvarande beteende)
3. **Inget ljud** - Exportera tyst video

## Bygger på
- EXP-025 (external-audio-html)
- EXP-013 (export-system)
- EXP-012 (volume-controls)

## Skapad
2026-02-23

## Tekniska detaljer

### Frontend (index.html)
- Radioknappar placeras nära Export-knappen i Video Editor-tabben
- Standardval: "Ljud från Video Editor" (behåller nuvarande beteende)
- JavaScript läser valt alternativ och skickar med export-anropet

### Backend (app.py)
- `/export` endpoint får ny parameter: `audio_source`
- Värden: `"video"`, `"editor"`, `"none"`
- Default: `"editor"` (bakåtkompatibelt)

### concat.py
- `concat_videos()` hanterar de tre lägena:
  - `"video"`: Behåll ljud från video-clips
  - `"editor"`: Mix Speech + Music (nuvarande)
  - `"none"`: Ta bort allt ljud (-an flagga)

## Edge cases
- Inga video-clips uppladdade + "Ljud från Video" → Tyst video
- Inga Speech/Music clips + "Ljud från Video Editor" → Tyst video (nuvarande beteende)
