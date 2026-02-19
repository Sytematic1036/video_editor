# EXP-016: Playhead-Preview Sync & Timeline Time Format

## Status
VERIFIED

## Bygger från
EXP-015_multi-clip-preview-fix

## Mål
1. **Synkronisera Playhead med Preview**: När man drar i preview-slider ska playhead följa med, och tvärtom
2. **Ändra tidsformat på tidslinje**: Visa minuter:sekunder (M:SS) istället för endast sekunder (Xs)

## Framgångskriterier
1. [x] Dra preview-slider → Playhead flyttas synkront (fungerade redan i EXP-015)
2. [x] Dra playhead → Preview-bild uppdateras (fungerade redan i EXP-015)
3. [x] Tidslinje visar `M:SS` format (0:30, 1:00, 1:30) istället för `Xs` (30s, 60s, 90s)
4. [x] Alla tre tracks (Video, Speech, Music) har samma tidsformat
5. [x] Edge cases: 0s = "0:00", 60s = "1:00", 90s = "1:30"

## Teknisk analys
- Target: video_editor repo
- Framework: Flask + vanilla JavaScript
- Port: 5022
- Baseline: GUI_EXP-015_v1_20260219_1059_287326c
