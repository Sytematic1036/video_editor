# EXP-014: Audio-Only Preview

**Status:** VERIFIED
**Skapad:** 2026-02-18
**Bygger på:** EXP-013_export-system

## Mål

Tillåt preview och export med ENDAST ljudfiler (Speech Track och/eller Music Track) utan krav på video. När ingen video finns skapas en svart bakgrund med ljudspåren.

## Ändringar

### Backend (concat.py)
1. Ny funktion `concat_audio_only()` som skapar svart video + ljudspår
2. `concat_videos()` anropar automatiskt `concat_audio_only()` vid tom video_clips

### Backend (app.py)
1. Ny helper `has_audio_content()` kontrollerar om audio finns
2. `/preview-full` tillåter `videos=[]` när audio finns
3. `/export` tillåter `videos=[]` när audio finns
4. Port: 5021

### Frontend (index.html)
1. Ny helper `hasAnyMedia()` returnerar true om video, speech eller music finns
2. Preview/Export-knappar aktiveras med endast audio
3. Titel uppdaterad till "EXP-014 (Audio-Only Preview)"

## Framgångskriterier

- [x] Preview fungerar med endast Speech Track
- [x] Preview fungerar med endast Music Track
- [x] Preview fungerar med Speech + Music (ingen video)
- [x] Export fungerar med endast audio
- [x] GUI visar Preview-knapp som aktiv när audio finns
- [x] Felmeddelande när ingen media alls finns

## Test

### GUI-tester (Playwright)
```bash
cd iterations/v1_autonomous_2026-02-18
node test_audio_only_preview.js
# 10/10 tests passed
```

### API-tester
```bash
cd iterations/v1_autonomous_2026-02-18
node test_audio_only_api.js
# 4/4 tests passed
```

### Manuell test
```bash
cd iterations/v1_autonomous_2026-02-18/src
python app.py
# Öppna http://localhost:5021
# Ladda upp en ljudfil till Speech eller Music track
# Tryck "Preview Full Composition"
```
