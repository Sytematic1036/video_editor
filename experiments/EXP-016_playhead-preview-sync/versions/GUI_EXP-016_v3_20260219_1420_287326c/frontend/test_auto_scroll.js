/**
 * Playwright test for EXP-016 v2: Auto-scroll Playhead
 * Tests that timeline auto-scrolls to keep playhead visible
 */
const { chromium } = require('playwright');

const PORT = 5024;
const BASE_URL = `http://localhost:${PORT}`;

async function testAutoScroll() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-016 v2 Auto-scroll Playhead Test ===\n');

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('Page loaded');

        // Test 1: Check that ensurePlayheadVisible function exists
        const functionExists = await page.evaluate(() => {
            return typeof ensurePlayheadVisible === 'function';
        });

        if (!functionExists) {
            console.log('FAIL: ensurePlayheadVisible function not found');
            process.exit(1);
        }
        console.log('ensurePlayheadVisible function exists');

        // Test 2: Add a long mock video (300 seconds = 5 minutes)
        await page.evaluate(() => {
            videoClips.push({
                filename: 'long_video.mp4',
                duration: 300,
                trimStart: 0,
                trimEnd: 0,
                type: 'video'
            });
            renderTimeline();
        });
        console.log('Added mock 300s (5 min) video clip');

        // Test 3: Get initial scroll position
        const initialState = await page.evaluate(() => {
            const trackScroll = document.querySelector('.track-scroll');
            return {
                scrollLeft: trackScroll.scrollLeft,
                clientWidth: trackScroll.clientWidth,
                scrollWidth: trackScroll.scrollWidth
            };
        });

        console.log('\nInitial state:');
        console.log('  scrollLeft = ' + initialState.scrollLeft);
        console.log('  clientWidth = ' + initialState.clientWidth);
        console.log('  scrollWidth = ' + initialState.scrollWidth);

        // Verify timeline is wider than viewport
        if (initialState.scrollWidth <= initialState.clientWidth) {
            console.log('FAIL: Timeline should be wider than viewport for this test');
            process.exit(1);
        }
        console.log('Timeline is wider than viewport (good for testing)');

        // Test 4: Set playhead to 200 seconds (should be off-screen to the right)
        const afterSeek = await page.evaluate(() => {
            // Set playhead far to the right
            playheadPosition = 200;
            updateGlobalPlayhead();

            // Wait for smooth scroll to complete (poll until stable)
            return new Promise(resolve => {
                let lastScrollLeft = -1;
                let stableCount = 0;

                const checkScroll = () => {
                    const trackScroll = document.querySelector('.track-scroll');
                    const currentScroll = trackScroll.scrollLeft;

                    if (Math.abs(currentScroll - lastScrollLeft) < 1) {
                        stableCount++;
                        if (stableCount >= 3) {
                            // Scroll has stabilized
                            resolve({
                                scrollLeft: trackScroll.scrollLeft,
                                playheadLeft: parseFloat(globalPlayhead.style.left),
                                clientWidth: trackScroll.clientWidth
                            });
                            return;
                        }
                    } else {
                        stableCount = 0;
                    }

                    lastScrollLeft = currentScroll;
                    setTimeout(checkScroll, 100);
                };

                // Start checking after initial delay
                setTimeout(checkScroll, 200);
            });
        });

        console.log('\nAfter seeking to 200s:');
        console.log('  playheadLeft (visual) = ' + afterSeek.playheadLeft + 'px');
        console.log('  scrollLeft = ' + afterSeek.scrollLeft + 'px');
        console.log('  clientWidth = ' + afterSeek.clientWidth + 'px');

        // EXP-016 v3: playheadLeft is now VISUAL position (adjusted for scroll)
        // Absolute position = 200 * 20 + 20 = 4020px
        // Visual position = absoluteLeft - scrollLeft
        const absolutePlayheadLeft = 200 * 20 + 20;
        const expectedVisualLeft = absolutePlayheadLeft - afterSeek.scrollLeft;
        console.log('  Expected visual = ' + expectedVisualLeft + 'px');

        if (Math.abs(afterSeek.playheadLeft - expectedVisualLeft) > 10) {
            console.log(`FAIL: Expected visual position ~${expectedVisualLeft}px, got ${afterSeek.playheadLeft}px`);
            process.exit(1);
        }
        console.log('Visual position is correct');

        // Verify scroll happened (scrollLeft should be > 0)
        if (afterSeek.scrollLeft === 0) {
            console.log('FAIL: Timeline did not scroll (scrollLeft is still 0)');
            process.exit(1);
        }
        console.log('Timeline scrolled to follow playhead');

        // Test 5: Verify playhead is within visible area
        // EXP-016 v3: playheadLeft is now VISUAL position (0 to clientWidth)
        const margin = afterSeek.clientWidth * 0.2;

        const isPlayheadVisible = (
            afterSeek.playheadLeft >= 0 &&
            afterSeek.playheadLeft <= afterSeek.clientWidth
        );

        if (!isPlayheadVisible) {
            console.log('FAIL: Playhead is not in visible viewport');
            console.log(`  Visible range: 0px - ${afterSeek.clientWidth}px (visual)`);
            console.log(`  Playhead at: ${afterSeek.playheadLeft}px (visual)`);
            process.exit(1);
        }
        console.log('Playhead is visible in viewport');

        // Test 6: Verify playhead is not too close to edges (has margin)
        const distanceFromLeft = afterSeek.playheadLeft;
        const distanceFromRight = afterSeek.clientWidth - afterSeek.playheadLeft;

        console.log('\nMargin check:');
        console.log('  Distance from left edge: ' + distanceFromLeft.toFixed(0) + 'px');
        console.log('  Distance from right edge: ' + distanceFromRight.toFixed(0) + 'px');
        console.log('  Expected margin: ~' + margin.toFixed(0) + 'px (20% of viewport)');

        // At least one edge should have proper margin (the direction we scrolled from)
        const hasProperMargin = distanceFromRight >= margin * 0.5 || distanceFromLeft >= margin * 0.5;
        if (!hasProperMargin) {
            console.log('WARNING: Playhead might be too close to edges');
        } else {
            console.log('Playhead has proper margin from edges');
        }

        // Test 7: Test scroll sync between tracks
        const syncTest = await page.evaluate(() => {
            const trackScrolls = document.querySelectorAll('.track-scroll');
            if (trackScrolls.length < 2) return { synced: true, count: trackScrolls.length };

            // Check all tracks have same scrollLeft
            const first = trackScrolls[0].scrollLeft;
            let allSynced = true;
            trackScrolls.forEach(scroll => {
                if (Math.abs(scroll.scrollLeft - first) > 5) {
                    allSynced = false;
                }
            });

            return {
                synced: allSynced,
                count: trackScrolls.length,
                values: Array.from(trackScrolls).map(s => s.scrollLeft)
            };
        });

        console.log('\nScroll sync test:');
        console.log('  Track count: ' + syncTest.count);
        console.log('  All synced: ' + syncTest.synced);
        if (syncTest.values) {
            console.log('  Scroll values: ' + JSON.stringify(syncTest.values.map(v => Math.round(v))));
        }

        if (!syncTest.synced) {
            console.log('FAIL: Tracks are not scrolling in sync');
            process.exit(1);
        }

        console.log('\n=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testAutoScroll();
