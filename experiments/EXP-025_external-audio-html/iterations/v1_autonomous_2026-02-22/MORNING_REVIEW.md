# Autonom Korning 2026-02-22

## Repo
`video_editor` (https://github.com/Sytematic1036/video_editor)

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Branch
`experiment/025-external-audio-html`

## Sammanfattning
- Skapade experiment: EXP-025_external-audio-html
- Implementerade extern ljudfilsuppladdning for HTML-to-MP4 konvertering
- Langsta filen (video/ljud) bestammer nu MP4-langden
- 6 Playwright-tester skrivna och passerade

## Problem som lostes
- Tidigare: Om "Include audio from HTML" var avmarkerat fanns inget satt att lagga till ljud
- Nu: Anvandaren kan ladda upp en extern MP3/WAV som laggs till i MP4:n
- Bonus: Om ljudet ar langre an videon, forlängs videon med sista frame

## Nya filer
- `experiments/EXP-025_external-audio-html/EXPERIMENT.md`
- `experiments/EXP-025_external-audio-html/fixtures/success_criteria.yaml`
- `experiments/EXP-025_external-audio-html/learnings.md`
- `experiments/EXP-025_external-audio-html/tests/test_external_audio.js`
- `experiments/EXP-025_external-audio-html/tests/test_long_audio.js`
- `experiments/EXP-025_external-audio-html/tests/fixtures/test_presentation.html`
- `experiments/EXP-025_external-audio-html/tests/fixtures/test_audio.mp3`
- `experiments/EXP-025_external-audio-html/tests/fixtures/test_audio_long.mp3`

## Ändringar i src/
- `src/html_converter.py`:
  - Ny parameter `external_audio_path` i `convert_html_to_mp4()`
  - Ny funktion `get_audio_duration()` for att hämta ljudfils längd
  - Logik for att förlänga video med tpad om ljud ar langre
  - Extern ljud prioriteras over HTML-ljud

- `src/app.py`:
  - Ny endpoint `/upload-html-audio` for ljudfilsuppladdning
  - Uppdaterad `/html-to-mp4` for att acceptera `external_audio_id`

- `src/templates/index.html`:
  - Ny "Upload Audio" knapp i HTML-to-MP4 tabben
  - Visar filnamn och längd efter uppladdning
  - "Clear" knapp för att ta bort uppladdad ljud
  - JavaScript-hanterare for uppladdning och konvertering

## Tester
| Test | Resultat |
|------|----------|
| Upload Audio button visible | PASS |
| Can upload HTML file | PASS |
| Can upload external audio | PASS |
| Clear audio button works | PASS |
| Convert with external audio | PASS |
| MP4 has audio stream (ffprobe) | PASS |
| Long audio extends MP4 duration | PASS |

## Tekniska detaljer

### Prioriteringslogik
1. Om `external_audio_path` finns → använd den
2. Om `include_audio=True` → extrahera från HTML
3. Annars → tyst video

### Längd-hantering
- Om ljud > video: FFmpeg `tpad=stop_mode=clone:stop_duration=X` för att förlänga sista frame
- Om video >= ljud: Standard muxning

### FFmpeg-filter (för längre ljud)
```
[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2,tpad=stop_mode=clone:stop_duration=X[v]
```

## Nästa steg för användaren
1. Granska ändringar:
   ```bash
   cd C:\Users\haege\video_editor
   git diff main...experiment/025-external-audio-html
   ```

2. Om OK, pusha och skapa PR:
   ```bash
   cd .worktrees\025-external-audio-html
   git push -u origin experiment/025-external-audio-html
   gh pr create --base main --title "EXP-025: External Audio for HTML-to-MP4"
   ```

3. Efter merge, stada:
   ```bash
   git worktree remove .worktrees\025-external-audio-html
   git branch -d experiment/025-external-audio-html
   ```
