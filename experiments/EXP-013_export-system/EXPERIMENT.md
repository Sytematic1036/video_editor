# EXP-013: Export System

## Status: EXPERIMENTAL

## Mål
Skapa ett robust export-system för video editor med best practices för:
1. Temporär filhantering med säker upload
2. Tydligt export-flöde (separat från preview)
3. Progress-indikator under export
4. Enkel nedladdning av exporterad fil
5. Cleanup av gamla temporära filer

## Bygger på
- EXP-012_volume-controls (volymkontroller för Speech/Music)

## Target Repo
https://github.com/Sytematic1036/video_editor

## Teknisk stack
- Flask (Python) - Backend
- Vanilla HTML/JS/CSS - Frontend
- FFmpeg - Video rendering
- Port 5020

## Nya funktioner
1. `/export` endpoint - Renderar slutgiltig fil (separerad från preview)
2. `/export-status/<job_id>` - Poll-baserad progress
3. `/download/<filename>` - Nedladdning av exporterad fil
4. `/cleanup` - Rensa gamla temporära filer
5. Export-knapp i GUI med progress-bar
6. Download-knapp efter export

## Framgångskriterier
1. [x] Export-knapp finns i GUI
2. [x] Progress visas under export
3. [x] Fil kan laddas ner efter export
4. [x] Playwright-tester passerar
