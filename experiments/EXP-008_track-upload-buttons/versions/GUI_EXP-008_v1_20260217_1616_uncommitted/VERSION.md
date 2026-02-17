# GUI_EXP-008_v1_20260217_1616_uncommitted

## Metadata
- **Stämplad:** 2026-02-17 16:16
- **Git commit:** uncommitted
- **Experiment:** EXP-008_track-upload-buttons
- **Iteration:** v1_autonomous_2026-02-17
- **Status:** FUNGERAR

## Komponenter

### Frontend
- app.py (Flask server, port 5014)
- concat.py (FFmpeg video processing)
- templates/index.html (GUI med track upload-knappar)

## Vad fungerar

1. **+ Add Video** - Lila knapp vid Video Timeline
2. **+ Add Speech** - Grön knapp vid Speech Track
3. **+ Add Music** - Rosa knapp vid Music Track
4. **Borttaget** - Gemensamt "Drag & Drop Files Here"-område
5. **Direkt routing** - Filer går direkt till rätt track utan dialog

## Ändringar från EXP-007

- Tog bort `<div class="drop-zone">`
- Tog bort `showAudioTypeDialog()` funktion
- Lade till `.track-header` CSS med flexbox
- Lade till `.btn-upload` knappar med gradient-färger
- Lade till `btnUploadVideo`, `btnUploadSpeech`, `btnUploadMusic`
- Ny funktion `uploadFileToTrack(file, targetTrack)`

## Testresultat

- Server startar på port 5014: OK
- Drop-zone borta: OK
- Video upload: OK
- Speech upload: OK
- Music upload: OK
- Preview med dual audio: OK

## Beroenden

- Python 3.x
- Flask
- FFmpeg

## Rollback

```bash
cd experiments/EXP-008_track-upload-buttons/versions/GUI_EXP-008_v1_20260217_1616_uncommitted
cp -r frontend/* ../../iterations/v1_autonomous_2026-02-17/src/
```
