# EXP-023: Rename Video Editor Title

## Status
EXPERIMENTAL

## Mål
Ändra applikationsnamnet från "Video Editor + HTML to MP4 - EXP-0XX" till "Video Editor + HTML to MP4" (utan versionsnummer).

## Bygger från
EXP-022_slide-start-times (senaste experiment i video_editor)

## Bakgrund
Titeln innehåller experimentnummer (EXP-018, EXP-019, etc.) vilket är förvirrande för slutanvändare. Titeln ska vara konsistent och professionell.

## Ändringar
- `src/app.py` - Print-satser vid startup
- `src/templates/index.html` - HTML `<title>` tag

## Verifiering
Playwright-test som verifierar att titeln är korrekt.
