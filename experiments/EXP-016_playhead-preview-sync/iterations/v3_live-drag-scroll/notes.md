# Iteration v3 - Live Drag Scroll

**Datum:** 2026-02-19
**Typ:** Autonom (baserat på användarfeedback)
**Baserad på:** v2_auto-scroll-playhead

## Problem
1. **Preview scrubbing:** Playhead syns inte när man drar preview-slidern (timeline scrollar rätt men playhead är utanför synligt område)
2. **Playhead drag:** När man drar playhead mot höger kant scrollar inte tidslinjen förrän man släpper

## Rotorsak
Playhead har `position: absolute` i `timeline-wrapper`, men ligger UTANFÖR de scrollande `track-scroll` divvarna. När tracks scrollas, stannar playhead kvar på sin absoluta position.

## Lösning
Ny funktion `updatePlayheadVisualPosition()` som justerar playhead's visuella position baserat på scroll:

```javascript
function updatePlayheadVisualPosition() {
    const trackScroll = document.querySelector('.track-scroll');
    if (!trackScroll) return;

    const scrollLeft = trackScroll.scrollLeft;
    const absoluteLeft = playheadPosition * PIXELS_PER_SECOND + PLAYHEAD_LEFT_OFFSET;
    const visualLeft = absoluteLeft - scrollLeft;

    globalPlayhead.style.left = visualLeft + 'px';
}
```

## Ändringar
- [x] `updatePlayheadVisualPosition()` - ny funktion för visuell position
- [x] `ensurePlayheadVisible()` - kallar nu `updatePlayheadVisualPosition()`
- [x] `updateGlobalPlayhead()` - sätter inte left direkt, låter ensurePlayheadVisible() hantera det
- [x] `updatePlayheadPosition()` - samma som ovan
- [x] Mousemove för playhead drag - använder absolut position för beräkningar
- [x] Scroll-sync IIFE - kallar `updatePlayheadVisualPosition()` vid scroll
- [x] Playwright-tester uppdaterade för visuell position

## Testresultat
```
test_live_drag_scroll.js: PASS
  - updatePlayheadVisualPosition adjusts for scroll
  - Playhead visible after live scroll

test_auto_scroll.js: PASS
  - Visual position correct (960px = 4020px - 3060px)
  - All 3 tracks synced
```

## Port
5024 (v3)
