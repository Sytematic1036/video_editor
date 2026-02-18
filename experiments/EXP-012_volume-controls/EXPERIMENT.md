# EXP-012: Volume Controls

**Status:** VERIFIED
**Skapad:** 2026-02-18
**Bygger på:** GUI_EXP-011_v4_20260218_0814_e174cf1

## Mål

Skapa separata volyminställningar för Speech Track och Music Track så att användaren kan:
- Justera volymen för Speech Track (0-200%)
- Justera volymen för Music Track (0-200%)
- Sänka Music Track för att inte överrösta Speech Track

## Ändringar

### Frontend (index.html)
1. Nya volymsliders i settings-sektionen:
   - `speechVolumeSlider` (0-200%, default 100%)
   - `musicVolumeSlider` (0-200%, default 50%)
2. Volymdisplay som visar aktuellt värde i procent
3. JavaScript-variabler och funktioner för volymhantering
4. Volymvärden skickas till backend vid preview/export

### Backend (app.py + concat.py)
1. Tar emot `speech_volume` och `music_volume` i payload
2. Applicerar volym på respektive audio track i ffmpeg
3. Music volume appliceras via AudioTrackSpec
4. Speech volume appliceras via nytt `volume` filter i concat.py

## Framgångskriterier

- [x] Speech Volume slider finns och kan ändras
- [x] Music Volume slider finns och kan ändras
- [x] Volymvärden skickas till backend
- [x] Default-värden: Speech=100%, Music=50%
- [x] Volymområde: 0-200%
- [x] Playwright-tester passerar (10/10)

## Test

```bash
cd iterations/v1_autonomous_2026-02-18/src
python app.py
# Öppna http://localhost:5019
```
