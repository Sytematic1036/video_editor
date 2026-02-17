# Autonom körning 2026-02-17

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Skapar experiment: EXP-008_track-upload-buttons
- Implementerar: Individuella upload-knappar per track
- Server: port 5014

## Planerade features

| # | Feature | Status | Test |
|---|---------|--------|------|
| 1 | Ta bort drop-zone | [x] | Inget blått "Drag & Drop"-område |
| 2 | Video upload-knapp | [x] | Knapp "Add Video" bredvid Video Timeline |
| 3 | Speech upload-knapp | [x] | Knapp "Add Speech" bredvid Speech Track |
| 4 | Music upload-knapp | [x] | Knapp "Add Music" bredvid Music Track |
| 5 | Filväljare öppnas | [x] | Klick på knapp öppnar dialog |
| 6 | Filer hamnar rätt | [x] | Video→video, speech→speech, music→music |

## Logg
- 15:30 - Skapade EXP-008 struktur
- 15:31 - Kopierade EXP-007 som bas
- 15:32 - Lade till CSS för track-header och upload-knappar
- 15:33 - Tog bort drop-zone HTML
- 15:34 - Uppdaterade instruktioner
- 15:35 - Lade till upload-knappar i varje track-header
- 15:36 - Ersatte gamla upload-logik med tre separata handlers
- 15:37 - Ändrade port till 5014
- 15:38 - Startade server och testade

## Nya filer
- templates/index.html - GUI med track upload-knappar
- app.py - Flask server (port 5014)
- concat.py - FFmpeg (oförändrad från EXP-007)

## Implementerade ändringar

### 1. Borttaget
- `<div class="drop-zone">` - gemensamt Drag & Drop-område
- `showAudioTypeDialog()` - dialog för att välja speech/music

### 2. Tillagt CSS
```css
.track-header {
    display: flex;
    align-items: center;
    gap: 15px;
}
.btn-upload { ... }
.btn-upload-video { background: purple gradient }
.btn-upload-speech { background: green gradient }
.btn-upload-music { background: pink gradient }
```

### 3. Tillagt HTML
```html
<div class="track-header">
    <h3>Video Timeline</h3>
    <button class="btn-upload btn-upload-video">Add Video</button>
</div>
```

### 4. Ny JavaScript
```javascript
btnUploadVideo.addEventListener('click', () => {
    // Öppnar filväljare för video
    await uploadFileToTrack(file, 'video');
});

async function uploadFileToTrack(file, targetTrack) {
    // Laddar upp till specifik track direkt
}
```

## Tester

### Automatiserade tester (2026-02-17)
- [x] Server startar på port 5014
- [x] Drop-zone finns INTE i HTML
- [x] "Add Video" knapp finns
- [x] "Add Speech" knapp finns
- [x] "Add Music" knapp finns
- [x] Video upload fungerar (test_video.mp4 → 2.0s)
- [x] Speech upload fungerar (test_speech.mp3 → 3.0s)
- [x] Music upload fungerar (test_music.mp3 → 5.0s)
- [x] Preview med alla tre tracks: OK
- [x] Genererad fil har video (h264) och audio (aac)

## Rekommenderade nästa steg
1. Öppna: http://localhost:5014/
2. Testa knapparna manuellt i browser
3. Om OK: `/stamp-version EXP-008 "Track upload buttons fungerar"`
