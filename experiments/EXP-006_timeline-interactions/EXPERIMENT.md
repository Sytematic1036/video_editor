# EXP-006: Timeline Interactions

**Status:** EXPERIMENTAL
**Datum:** 2026-02-17
**Bygger på:** EXP-005 (trim-handles) från McClaw

## Mål

Implementera 4 saknade standard-funktioner för video editors:

| Feature | Beskrivning |
|---------|-------------|
| Klickbar timeline | Klicka var som helst på tidslinjen → seek till den positionen |
| Dragbar playhead | Dra playhead-strecket för scrubbing med live preview |
| Omordna klipp | Drag-and-drop klipp för att ändra ordning |
| Auto-fit audio | Knapp för att automatiskt trimma ljud till videolängd |

## Teknisk approach

- **Frontend:** HTML/CSS/JavaScript (vanilla)
- **Backend:** Flask + FFmpeg
- **Port:** 5008

## Framgångskriterier

1. [ ] Klicka på timeline → video seekar till rätt position
2. [ ] Dra playhead → video uppdateras i realtid (scrubbing)
3. [ ] Dra klipp till ny position → ordningen ändras
4. [ ] "Fit Audio" knapp → ljudspåret trimmas till videolängd

## Benchmark-källor

- CapCut: https://www.capcut.com/resource/capcut-tutorial-for-beginners
- iMovie: https://support.apple.com/en-us/102353
- DaVinci Resolve: https://videowithjens.com/how-to-move-clips-in-davinci-resolve/
- Premiere Pro Remix: https://helpx.adobe.com/premiere-pro/using/remix-audio-in-premiere-pro.html
