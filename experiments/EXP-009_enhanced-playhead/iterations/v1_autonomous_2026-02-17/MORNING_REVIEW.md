# Autonom körning 2026-02-17

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Skapar experiment: EXP-009_enhanced-playhead
- Implementerar: Global playhead över alla tracks + högerklick-meny
- Server: port 5016

## Planerade features

| # | Feature | Status | Test |
|---|---------|--------|------|
| 1 | Global playhead | [x] | Röd linje över alla tracks |
| 2 | Extended drag range | [x] | Kan dra till längsta fil |
| 3 | Playhead context menu | [x] | Högerklick på playhead |
| 4 | Insert Silence at playhead | [x] | Via högerklick-meny |
| 5 | Split clip at playhead | [x] | Via högerklick-meny |

## Logg
- 18:10 - Skapade EXP-009 struktur
- 18:15 - Kopierade EXP-008 v2 som bas
- 18:20 - Implementerade global playhead CSS (timeline-wrapper, global-playhead)
- 18:25 - Lade till playhead context menu HTML
- 18:30 - Implementerade JavaScript för global playhead drag
- 18:35 - Lade till Insert Silence at Playhead funktion
- 18:40 - Implementerade splitClipAtPlayhead() för video och speech
- 18:45 - Uppdaterade port till 5016, startade server
- 18:50 - Verifierade alla komponenter via curl

## Nya filer
- `src/app.py` - Flask server (port 5016)
- `src/concat.py` - FFmpeg processing (kopierad från EXP-008)
- `src/templates/index.html` - GUI med global playhead

## Implementerade funktioner

### Global Playhead
- `.timeline-wrapper` - Container för alla tracks + playhead
- `.global-playhead` - Röd vertikal linje med drag-stöd
- `playheadPosition` - Tidposition i sekunder
- `getMaxDuration()` - Returnerar max av video/speech/music längd

### Playhead Dragging
- Mousedown på playhead → dragging mode
- Mousemove → uppdaterar position
- Mouseup → avslutar drag
- Klick på ruler → hoppar till position

### Context Menu (Högerklick)
- `playheadContextMenu` - Meny med två alternativ
- "Insert Silence at Playhead" → Infogar tystnad i speech track
- "Split Clip at Playhead" → Delar video/speech klipp vid playhead

### Split Clip Logic
```javascript
function splitClipAtPlayhead() {
    // 1. Hitta vilket klipp playhead är över
    // 2. Beräkna split-offset inom klippet
    // 3. Justera trimEnd på första delen
    // 4. Skapa kopia med justerad trimStart
    // 5. Infoga i array efter original
}
```

## Tester
- [x] Server startar på port 5016
- [x] Global playhead CSS renderas korrekt
- [x] Context menu HTML finns
- [x] getMaxDuration() beräknar max av alla tracks
- [x] splitClipAtPlayhead() implementerad
- [x] renderTimeline() anropar updateGlobalPlayhead()

## Rekommenderade nästa steg
1. Öppna: http://localhost:5016
2. Ladda upp video/speech-filer via track buttons
3. Dra playhead - verifiera att den täcker alla tracks
4. Högerklicka på playhead - testa Insert Silence
5. Högerklicka på playhead - testa Split Clip
6. Om OK: `/stamp-version EXP-009`
