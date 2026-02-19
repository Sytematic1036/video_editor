# EXP-015: Multi-Clip Preview & Clear All Fix

## Status
VERIFIED

## Bygger från
EXP-014_audio-only-preview

## Mål
Fixa två buggar i video editor GUI:
1. **Preview visar bara sista klippet** - när flera filmklipp läggs till, tas endast det sista med i preview
2. **Clear All fungerar inte** - preview spelar fortfarande film efter "Clear All"

## Framgångskriterier
1. [x] Lägg till 2+ videoklipp → Preview visar alla i sekvens (FIXAD - fps normalisering + ta bort -shortest)
2. [x] Clear All → Alla videos/audio rensas, preview visar ingenting (FIXAD - rensa videoPreview.src)
3. [x] Playwright-tester passerar - test_user_files.js: 250.87s output (korrekt)
4. [x] Koden följer samma patterns som EXP-014

## Teknisk analys
- Target: video_editor repo
- Framework: Flask + vanilla JavaScript
- Port: 5021
