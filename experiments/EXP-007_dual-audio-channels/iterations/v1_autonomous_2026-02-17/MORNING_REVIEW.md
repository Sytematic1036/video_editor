# Autonom korning 2026-02-17

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Skapar experiment: EXP-007_dual-audio-channels
- Implementerar: Dual audio (speech + music)
- Server: port 5013

## Planerade features

| # | Feature | Status | Test |
|---|---------|--------|------|
| 1 | Speech-track i GUI | [x] | Synlig under video-track (gron bakgrund) |
| 2 | Ladda upp speech-filer | [x] | Upload -> dialog -> visas i speech-track |
| 3 | Insert Silence (hogerklick) | [x] | Hogerklick -> dialog -> tystnad infogas |
| 4 | Music-track (befintlig) | [x] | Behalles fran EXP-006 |
| 5 | Dual audio mix vid export | [x] | FFmpeg kombinerar speech + music |

## Logg
- 13:50 - Skapade EXP-007 struktur
- 13:50 - Kopierade EXP-006 v5 som bas
- 14:xx - Lade till Speech track HTML
- 14:xx - Lade till Context menu CSS
- 14:xx - Lade till Silence dialog
- 14:xx - Implementerade audio type dialog (OK=Speech, Cancel=Music)
- 14:xx - Implementerade renderSpeechTrack()
- 14:xx - Implementerade context menu handlers
- 14:xx - Implementerade insertSilence funktionalitet
- 14:xx - Uppdaterade concat.py med SpeechClipSpec
- 14:xx - Uppdaterade concat.py for dual audio mixing
- 14:xx - Uppdaterade app.py for speech track export
- 14:xx - Andrade port till 5013

## Nya filer
- templates/index.html - GUI med dual audio
- app.py - Flask server med speech track support
- concat.py - FFmpeg med dual audio mixing

## Implementerade features

### 1. Speech Track (GUI)
- Ny gron track under video track
- Visar speech clips och silence segments
- Click for att valja clip

### 2. Audio Type Dialog
- Nar audio laddas upp: confirm dialog
- OK = Speech track
- Cancel = Music track

### 3. Insert Silence (Right-click)
- Hogerklick pa speech track visar context menu
- "Insert Silence" oppnar dialog
- Valj duration (0.1-60 sekunder)
- Silence visas som streckad ruta

### 4. Dual Audio Export
- concat.py stodjer nu bade speech_clips och audio_track
- Speech clips konkateneras (inklusive silence)
- Speech och music mixas med amix filter

## Teknisk implementation

### Frontend (index.html)
```javascript
// Nya variabler
let speechClips = [];
let contextMenuTarget = null;

// Audio type val
function showAudioTypeDialog(audioData) {
    const choice = confirm(...);
    if (choice) speechClips.push(audioData);
    else audioClip = audioData;
}

// Insert silence
speechTrack.addEventListener('contextmenu', (e) => {...});
silenceConfirm.addEventListener('click', () => {
    speechClips.splice(insertAt, 0, silenceClip);
});
```

### Backend (concat.py)
```python
@dataclass
class SpeechClipSpec:
    is_silence: bool = False
    path: Optional[Path] = None
    duration_s: float = 0.0
    ...

# I concat_videos:
# - Speech clips konkateneras med concat filter
# - Silence genereras med anullsrc
# - Speech + music mixas med amix
```

## Tester
Starta servern och testa manuellt:
```bash
cd C:\Users\haege\video_editor\experiments\EXP-007_dual-audio-channels\iterations\v1_autonomous_2026-02-17\src
python app.py
```

Oppna: http://localhost:5013

### Testfall
1. Ladda upp video -> visas i video track
2. Ladda upp audio -> dialog -> OK -> visas i speech track
3. Ladda upp audio -> dialog -> Cancel -> visas i music track
4. Hogerklick pa speech track -> context menu visas
5. Klicka "Insert Silence" -> dialog oppnas
6. Ange 2.0 sekunder -> klicka Insert
7. Silence visas som streckad ruta i speech track
8. Klicka "Preview Full Composition"
9. Verifiera att bade speech och music hors

### Automatiserade tester (2026-02-17)
- [x] Server startar pa port 5013
- [x] Video upload fungerar (test_video.mp4 -> 3.0s)
- [x] Audio upload fungerar (test_speech.mp3 -> 2.0s, test_music.mp3 -> 4.0s)
- [x] Preview med dual audio (silence + speech + music)
- [x] Export med dual audio fungerar
- [x] Genererad fil har video (h264) och audio (aac)

### FFmpeg filter som anvands
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

## Rekommenderade nasta steg
1. Starta servern: `python app.py`
2. Testa i browser: http://localhost:5013
3. Om OK: `/stamp-version EXP-007 "Dual audio fungerar"`
