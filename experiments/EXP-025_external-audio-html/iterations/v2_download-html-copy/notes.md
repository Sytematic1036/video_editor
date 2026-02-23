# Iteration v2 - Download HTML Copy

**Datum:** 2026-02-22
**Typ:** Kollaborativ (användare + Claude)
**Baserad på:** v1_autonomous_2026-02-22

## Syfte
Ändra "Generate HTML Copy"-knappen så att HTML-filen laddas ner till användarens Hämtade filer (Downloads) istället för att bara sparas på servern.

## Ändringar från föregående
- [x] Ändra `/copy-html` endpoint att returnera filen som download
- [x] Uppdatera frontend att trigga browser-download
- [x] Byta knapptext till "Download HTML Copy"
