# Iteration v2 - Fix Speech Track Offset

**Datum:** 2026-02-18
**Typ:** Fix (buggfix)
**Baserad på:** v1_autonomous_2026-02-18

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Problem
Video Timeline split fungerade exakt vid playhead (tack vare v1 fix), men Speech Track och Music Track hade fortfarande offset-problem.

## Rotorsak
Inkonsekvent användning av `getTrimmedDuration()` vs `clip.duration` för silence-klipp:

| Funktion | Silence-klipp | Vanliga klipp |
|----------|---------------|---------------|
| `renderSpeechTrack()` | `getTrimmedDuration(clip)` ✓ | `getTrimmedDuration(clip)` ✓ |
| `splitSpeechAtPlayhead()` | `clip.duration` ❌ | `getTrimmedDuration(clip)` ✓ |
| `splitMusicAtPlayhead()` | `clip.duration` ❌ | `getTrimmedDuration(clip)` ✓ |
| `findInsertPositionAtPlayhead()` | `clip.duration` ❌ | `getTrimmedDuration(clip)` ✓ |

När rendering använder en beräkning men split-logiken använder en annan, blir det offset.

## Lösning
Ändrade alla funktioner att konsekvent använda `getTrimmedDuration(clip)` för ALLA klipp:

### splitSpeechAtPlayhead()
```javascript
// FÖRE (felaktigt):
if (clip.isSilence) {
    currentTime += clip.duration;
    continue;
}
const clipDur = getTrimmedDuration(clip);

// EFTER (korrekt):
const clipDur = getTrimmedDuration(clip);  // Beräkna för ALLA klipp
if (clip.isSilence) {
    currentTime += clipDur;
    continue;
}
```

### splitMusicAtPlayhead()
Samma fix som ovan.

### findInsertPositionAtPlayhead()
```javascript
// FÖRE (felaktigt):
const clipDur = clip.isSilence ? clip.duration : getTrimmedDuration(clip);

// EFTER (korrekt):
const clipDur = getTrimmedDuration(clip);  // Samma beräkning som rendering
```

## Filer ändrade
- `src/templates/index.html` - 3 funktioner fixade

## Verifiering
- [x] Server startar på port 5019 (HTTP 200)
- [x] Alla 3 fixar finns i koden ("EXP-011 v2 FIX" kommentarer)
- [ ] Manuell test: Speech Track split vid exakt playhead-position
- [ ] Manuell test: Music Track split vid exakt playhead-position
- [ ] Manuell test: Insert Silence börjar vid exakt playhead-position

## Test
Öppna: http://localhost:5019
1. Ladda upp en speech-fil
2. Dra playhead till en position
3. Högerklicka Speech Track → Split at Playhead
4. Verifiera att split sker EXAKT vid playhead-linjen (ingen offset)
