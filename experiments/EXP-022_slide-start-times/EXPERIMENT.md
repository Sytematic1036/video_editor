# EXP-022: Slide Start Times

## Status
`VERIFIED`

## Mål
Ändra "Slide Durations" i HTML to MP4 Converter så att den visar varje slides starttid (min:sek) istället för antal sekunder per slide.

**Nuvarande visning:**
```
Slide 1: [3] s
Slide 2: [23] s
Slide 3: [10] s
```

**Ny visning:**
```
0:00 [3] s
0:03 [23] s
0:26 [10] s
```

Starttiden beräknas kumulativt från slide-durations.

## Bygger från
- EXP-021 v1 (audio-checkbox)

## Target Repo
https://github.com/Sytematic1036/video_editor

## Arkitektur
- **Backend:** Flask (ingen ändring)
- **Frontend:** Vanilla JavaScript (ändring i index.html)

## Framgångskriterier
1. [ ] Starttider visas i format mm:ss (0:00, 0:03, 0:26, etc.)
2. [ ] Första slide visar alltid 0:00
3. [ ] Efterföljande slides beräknas kumulativt
4. [ ] Duration-input fortfarande fungerar
5. [ ] Total duration beräknas korrekt
6. [ ] Playwright-tester passerar

## Edge cases
1. [ ] Slide med 0 duration → nästa slide får samma starttid
2. [ ] Duration > 60s → visar 1:30 format
3. [ ] Tom duration-input → fallback till 5s

## Filer
- `iterations/v1_autonomous_2026-02-21/src/templates/index.html` - Modifierad GUI
- `iterations/v1_autonomous_2026-02-21/tests/test_start_times.js` - Playwright tester
