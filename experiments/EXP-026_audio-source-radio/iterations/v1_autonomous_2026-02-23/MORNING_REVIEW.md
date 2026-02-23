# Autonom korning 2026-02-23

## Repo
`video_editor` (https://github.com/Sytematic1036/video_editor)

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Branch
`experiment/026-audio-source-radio`

## Sammanfattning
- Skapade experiment: EXP-026_audio-source-radio
- Implementerade 3 radioknappar for ljudkalla i Video Editor-fliken
- Frontend och backend fullt integrerade
- Alla Playwright-tester passerar (16/16)

## Radioknappar

| Alternativ | Varde | Funktion |
|------------|-------|----------|
| Ljud fran Video | `"video"` | Anvander originalljud fran uppladdade videofiler |
| Ljud fran Video Editor | `"editor"` | Anvander Speech Track + Music Track (default) |
| Inget ljud | `"none"` | Exporterar tyst video utan ljud |

## Nya filer
- `experiments/EXP-026_audio-source-radio/EXPERIMENT.md`
- `experiments/EXP-026_audio-source-radio/fixtures/success_criteria.yaml`
- `experiments/EXP-026_audio-source-radio/fixtures/test_video.mp4`
- `experiments/EXP-026_audio-source-radio/tests/test_audio_source_radio.js`
- `experiments/EXP-026_audio-source-radio/tests/test_export_audio_source.js`
- `experiments/EXP-026_audio-source-radio/learnings.md`

## Andringar i src/
- `src/templates/index.html` - Radioknappar med CSS och JavaScript
- `src/app.py` - Ny `audio_source` parameter i `/export` endpoint
- `src/concat.py` - Hantering av de tre ljudlagena

## Tester

### test_audio_source_radio.js (12 tester)
- 3 radio buttons exist
- audioSourceVideo exists
- audioSourceEditor exists
- audioSourceNone exists
- audioSourceEditor is default checked
- Can select "Ljud fran Video"
- Can select "Inget ljud"
- Can select "Ljud fran Video Editor"
- Selected option has .selected class
- Non-selected options do not have .selected class
- Audio source group is visible
- Header text is correct

### test_export_audio_source.js (4 tester)
- Video uploaded successfully
- audio_source="video" sent in request
- audio_source="editor" sent in request
- audio_source="none" sent in request

**Totalt: 16 passerade, 0 misslyckade**

## Commits
```
c818d69 feat(EXP-026): Add audio source radio buttons in Video Editor
```

## Nasta steg for anvandaren

1. Granska andringar:
   ```bash
   cd C:\Users\haege\video_editor\.worktrees\026-audio-source-radio
   git diff main...experiment/026-audio-source-radio
   ```

2. Om OK, pusha och skapa PR:
   ```bash
   git push -u origin experiment/026-audio-source-radio
   gh pr create --base main --title "EXP-026: Audio Source Radio Buttons"
   ```

3. Efter merge, stada:
   ```bash
   cd C:\Users\haege\video_editor
   git worktree remove .worktrees/026-audio-source-radio
   git branch -d experiment/026-audio-source-radio
   ```

## Tekniska detaljer

### Frontend (index.html)
- CSS-klass `.audio-source-group` med grid-spanning
- Radioknappar med namn `audioSource` och varden `video|editor|none`
- JavaScript-event-handler som uppdaterar `.selected`-klass
- Valt varde lasas vid export och skickas till backend

### Backend (app.py)
- `/export` endpoint tar emot `audio_source` parameter (default: `"editor"`)
- Varden skickas vidare till `run_export()` och `concat_videos()`

### concat.py
- Ny parameter `audio_source` i `concat_videos()`
- `"none"`: Anvander `-an` flagga (ingen audio)
- `"video"`: Anvander endast videofilers inbyggda ljud
- `"editor"`: Befintligt beteende (speech + music tracks)

## Session-logg
Se: `~/McClaw/overnight/logs/2026-02-23_EXP-026_video_editor_session.log`
