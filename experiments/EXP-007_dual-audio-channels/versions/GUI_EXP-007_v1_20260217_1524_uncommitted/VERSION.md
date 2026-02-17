# GUI_EXP-007_v1_20260217_1524_uncommitted

## Metadata
- **Stämplad:** 2026-02-17 15:24
- **Git commit:** uncommitted (EXP-007 inte pushat ännu)
- **Experiment:** EXP-007_dual-audio-channels
- **Iteration:** v1_autonomous_2026-02-17
- **Status:** FUNGERAR

## Komponenter

### Frontend
- app.py (Flask server, port 5013)
- concat.py (FFmpeg video processing med dual audio)
- templates/index.html (GUI med speech track)

## Vad fungerar

1. **Speech Track** - Ny grön track för voiceover
2. **Music Track** - Befintlig rosa track för bakgrundsmusik
3. **Audio Type Dialog** - Vid upload: OK = Speech, Cancel = Music
4. **Insert Silence** - Högerklick på speech track → dialog för duration
5. **Dual Audio Mix** - FFmpeg mixar speech + music vid export
6. **Context Menu** - Högerklick visar meny med Insert Silence / Remove Clip
7. **Silence Segments** - Visas som streckade rutor i speech track

## Ändringar från EXP-006

- Lade till Speech Track (speechTrack element)
- Lade till speechClips[] array
- Lade till context menu och silence dialog
- Lade till showAudioTypeDialog() för att välja speech/music
- Lade till renderSpeechTrack() funktion
- Uppdaterade concat.py med SpeechClipSpec dataclass
- Uppdaterade concat.py för dual audio mixing med amix filter
- Uppdaterade app.py för att hantera speech track i preview/export

## Testresultat

- Server startar: OK
- Video upload: OK
- Audio upload (speech): OK
- Audio upload (music): OK
- Insert silence: OK
- Preview med dual audio: OK
- Export med dual audio: OK
- Genererad fil har video (h264) och audio (aac): OK

## FFmpeg-filter

```
# Music track
[audio_idx:a]volume=0.5,afade=in,afade=out[music]

# Speech track (silence + audio concat)
anullsrc=r=44100:cl=stereo,atrim=duration=1.0[sil0]
[speech_idx:a]acopy[sp1]
[sil0][sp1]concat=n=2:v=0:a=1[speech]

# Mix
[music][speech]amix=inputs=2:normalize=0[aout]
```

## Beroenden

- Python 3.x
- Flask
- FFmpeg

## Rollback

```bash
cd experiments/EXP-007_dual-audio-channels/versions/GUI_EXP-007_v1_20260217_1524_uncommitted
cp -r frontend/* ../../iterations/v1_autonomous_2026-02-17/src/
```
