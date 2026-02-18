# Autonom körning 2026-02-18

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Skapade experiment: EXP-014_audio-only-preview
- Mål: Tillåt preview/export med endast audio (ingen video krävs)
- **ALLA TESTER PASSERAR** (14/14)

## Progress
- [x] Experimentstruktur skapad
- [x] concat.py modifierad för audio-only (ny funktion `concat_audio_only()`)
- [x] app.py modifierad för audio-only (`has_audio_content()` helper)
- [x] index.html modifierad för GUI-uppdateringar (`hasAnyMedia()` helper)
- [x] Playwright-tester skrivna och passerar (10/10)
- [x] API-tester skrivna och passerar (4/4)

## Nya filer
- `src/concat.py` - FFmpeg concatenation med audio-only support
- `src/app.py` - Flask app med audio-only endpoints
- `src/templates/index.html` - GUI med uppdaterad knapplogik
- `test_audio_only_preview.js` - Playwright GUI-tester
- `test_audio_only_api.js` - Backend API-tester

## Ändringar från EXP-013

### concat.py
- Ny funktion `concat_audio_only()` som skapar svart video + ljudspår
- `concat_videos()` anropar `concat_audio_only()` när `video_clips` är tom

### app.py
- Ny helper `has_audio_content()` för att kontrollera om audio finns
- `/preview-full` tillåter nu tom videos-array om audio finns
- `/export` tillåter nu tom videos-array om audio finns
- Port: 5021

### index.html
- Ny helper `hasAnyMedia()` returnerar true om video, speech eller music finns
- Knapplogik ändrad från `videoClips.length === 0` till `!hasAnyMedia()`
- Preview/Export-knappar aktiveras med endast audio

## Tester

### Playwright GUI-tester (10/10)
```
PASS: Page loads with correct title
PASS: Preview/Export buttons disabled when no media
PASS: hasAnyMedia() function exists
PASS: Adding speech clip enables hasAnyMedia()
PASS: Buttons enabled after adding speech clip
PASS: Adding music enables hasAnyMedia()
PASS: Preview button enabled with only music
PASS: hasAnyMedia() true with speech+music, no video
PASS: hasAnyMedia() returns false when empty
PASS: Preview button disabled when no media
```

### API-tester (4/4)
```
PASS: Speech-only preview generated (10s, black video)
PASS: Music-only preview generated (180.74s, black video)
PASS: Both audio preview generated (180.77s, black video)
PASS: Correct error returned for no media
```

## Problem/Blockers
Inga problem stöttes på.

## Edge Cases Hanterade
1. Endast speech track -> Svart video + speech audio
2. Endast music track -> Svart video + music audio
3. Speech + music (ingen video) -> Svart video + mixat audio
4. Ingen media alls -> Felmeddelande "No media (need video or audio)"

## Rekommenderade nästa steg
1. Granska: `git diff`
2. Testa manuellt: Öppna http://localhost:5021
3. Ladda upp en ljudfil och tryck Preview
4. Om OK: commit
