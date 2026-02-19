# Iteration v2 - Auto-scroll Playhead

**Datum:** 2026-02-19
**Typ:** Autonom (baserat på användarfeedback)
**Baserad på:** v1_autonomous_2026-02-19

## Problem
När playhead är på en tidposition utanför synligt viewport (t.ex. 2 minuter när bara 0-30s visas), försvinner playhead ur bild.

## Lösning
Implementerat `ensurePlayheadVisible()` som auto-scrollar timeline-containern horisontellt så att playhead alltid är synlig med 20% marginal från kanterna.

## Ändringar
- [x] Lagt till `ensurePlayheadVisible()` funktion
- [x] Kallat den från `updateGlobalPlayhead()`
- [x] Kallat den från `updatePlayheadPosition()` (timeupdate)
- [x] Lagt till scroll-synkronisering mellan alla tracks
- [x] Playwright-test för auto-scroll

## Ny kod

### ensurePlayheadVisible()
```javascript
function ensurePlayheadVisible() {
    const playheadLeft = parseFloat(globalPlayhead.style.left) || 0;
    const trackScrolls = document.querySelectorAll('.track-scroll');

    if (trackScrolls.length === 0) return;

    const firstScroll = trackScrolls[0];
    const viewportWidth = firstScroll.clientWidth;
    const currentScroll = firstScroll.scrollLeft;
    const margin = viewportWidth * 0.2; // 20% margin

    const visibleLeft = currentScroll + margin;
    const visibleRight = currentScroll + viewportWidth - margin;

    let newScrollLeft = null;

    if (playheadLeft > visibleRight) {
        newScrollLeft = playheadLeft - viewportWidth + margin;
    }
    else if (playheadLeft < visibleLeft) {
        newScrollLeft = Math.max(0, playheadLeft - margin);
    }

    if (newScrollLeft !== null) {
        trackScrolls.forEach(scroll => {
            scroll.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        });
    }
}
```

### Scroll sync mellan tracks
```javascript
(function setupScrollSync() {
    const trackScrolls = document.querySelectorAll('.track-scroll');
    let isScrolling = false;

    trackScrolls.forEach(scroll => {
        scroll.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;

            const scrollLeft = scroll.scrollLeft;
            trackScrolls.forEach(otherScroll => {
                if (otherScroll !== scroll) {
                    otherScroll.scrollLeft = scrollLeft;
                }
            });

            setTimeout(() => { isScrolling = false; }, 10);
        });
    });
})();
```

## Testresultat
```
test_auto_scroll.js: PASS
  - ensurePlayheadVisible exists
  - Timeline scrolled to follow playhead (scrollLeft = 3060px)
  - Playhead visible in viewport
  - Margin check: 960px from left, 240px from right (20% = 240px)
  - All 3 tracks synced: [3060, 3060, 3060]
```

## Port
5023 (v2)
