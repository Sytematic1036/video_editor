# EXP-018: Merge HTML to MP4 with Video Editor

## Status
`VERIFIED`

## Bygger från
- EXP-016_playhead-preview-sync (video_editor GUI)
- EXP-017_html-to-mp4-tab v3 (HTML to MP4 converter)

## Mål
Slå ihop HTML-till-MP4-funktionaliteten från EXP-017 med video_editor från EXP-016
så att "HTML to MP4" blir en flik i video_editor GUI.

## Target Repo
https://github.com/Sytematic1036/video_editor

## Arkitektur
- **Backend:** Flask (Python)
- **Frontend:** Vanilla JavaScript (inline i HTML)
- **Port:** 5022
- **Pattern:** Tabs med `tab-btn` och `tab-content` klasser

## Framgångskriterier
1. [x] Båda flikarna (Video Editor + HTML to MP4) visas i GUI
2. [x] Tab-switching fungerar korrekt
3. [x] Video Editor-funktionalitet bevarad (upload, preview, export, playhead)
4. [x] HTML-uppladdning fungerar
5. [x] MP4-generering från HTML fungerar
6. [x] Download av genererad MP4 fungerar
7. [x] Playwright-tester passerar (20/20)

## Iterationer

### v1_autonomous_2026-02-20 (SUPERSEDED)
Använde fel version av video_editor (v1 istället för v3_live-drag-scroll).

### v2_correct-video-editor (CURRENT)
Använder korrekt version från EXP-016 v3_live-drag-scroll med playhead-funktionalitet.

## Teknisk approach
1. Merge Flask routes från EXP-016 v3 (video) och EXP-017 (html-to-mp4)
2. Merge index.html med tab-navigation för båda funktionerna
3. Behåll concat.py och html_converter.py som separata moduler
4. Dela gemensamma directories (uploads, output, exports)

## Filer (v2)
- `iterations/v2_correct-video-editor/src/app.py` - Merged Flask backend
- `iterations/v2_correct-video-editor/src/concat.py` - Video concatenation (från EXP-016 v3)
- `iterations/v2_correct-video-editor/src/html_converter.py` - HTML to MP4 (från EXP-017)
- `iterations/v2_correct-video-editor/src/templates/index.html` - Merged GUI (3807 rader)
