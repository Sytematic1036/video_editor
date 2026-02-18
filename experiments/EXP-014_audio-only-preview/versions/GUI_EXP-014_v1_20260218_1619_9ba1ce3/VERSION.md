# GUI_EXP-014_v1_20260218_1619_9ba1ce3

## Metadata
- **Stämplad:** 2026-02-18 16:19
- **Git commit:** 9ba1ce3 - Add EXP-014: Audio-only preview support
- **Experiment:** EXP-014_audio-only-preview
- **Iteration:** v1_autonomous_2026-02-18
- **Status:** FUNGERAR

## Komponenter

### Frontend
- `app.py` - Flask server (port 5021)
- `concat.py` - FFmpeg video/audio concatenation
- `templates/index.html` - GUI med audio-only support

## Vad fungerar
- Preview med endast Speech Track (svart video + ljud)
- Preview med endast Music Track (svart video + ljud)
- Preview med Speech + Music utan video
- Export med endast audio
- GUI-knappar aktiveras när audio finns (även utan video)
- Felmeddelande när ingen media finns

## Ändringar från EXP-013
- Ny funktion `concat_audio_only()` i concat.py
- Ny helper `has_audio_content()` i app.py
- Ny helper `hasAnyMedia()` i index.html
- Ändrad knapplogik: `!hasAnyMedia()` istället för `videoClips.length === 0`

## Testresultat
- **GUI-tester (Playwright):** 10/10 passerade
- **API-tester:** 4/4 passerade

```
Playwright GUI-tester:
- Page loads with correct title
- Preview/Export buttons disabled when no media
- hasAnyMedia() function exists
- Adding speech clip enables hasAnyMedia()
- Buttons enabled after adding speech clip
- Adding music enables hasAnyMedia()
- Preview button enabled with only music
- hasAnyMedia() true with speech+music, no video
- hasAnyMedia() returns false when empty
- Preview button disabled when no media

API-tester:
- Speech-only preview generated (10s)
- Music-only preview generated (180.74s)
- Both audio preview generated (180.77s)
- Correct error returned for no media
```

## Beroenden
- Python 3.10+
- Flask
- FFmpeg (ffmpeg, ffprobe i PATH)
- Playwright (för tester)

## Starta
```bash
cd frontend
python app.py
# Öppna http://localhost:5021
```

## Rollback
```bash
./rollback.sh
```
