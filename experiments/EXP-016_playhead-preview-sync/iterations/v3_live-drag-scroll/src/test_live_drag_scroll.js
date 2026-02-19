/**
 * Playwright test for EXP-016 v3: Live Drag Scroll & Playhead Visual Position
 * Tests:
 * 1. Playhead visible during preview scrubbing
 * 2. Live scroll while dragging playhead
 * 3. Playhead visual position adjusts for scroll
 */
const { chromium } = require('playwright');

const PORT = 5024;
const BASE_URL = `http://localhost:${PORT}`;

async function testLiveDragScroll() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-016 v3 Live Drag Scroll Test ===\n');

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('Page loaded');

        // Test 1: Check new functions exist
        const functionsExist = await page.evaluate(() => {
            return {
                updatePlayheadVisualPosition: typeof updatePlayheadVisualPosition === 'function',
                ensurePlayheadVisible: typeof ensurePlayheadVisible === 'function'
            };
        });

        if (!functionsExist.updatePlayheadVisualPosition) {
            console.log('FAIL: updatePlayheadVisualPosition function not found');
            process.exit(1);
        }
        console.log('updatePlayheadVisualPosition function exists');

        if (!functionsExist.ensurePlayheadVisible) {
            console.log('FAIL: ensurePlayheadVisible function not found');
            process.exit(1);
        }
        console.log('ensurePlayheadVisible function exists');

        // Test 2: Add long mock video
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
        console.log('Added mock 300s video clip');

        // Test 3: Verify playhead visual position adjusts for scroll
        console.log('\n--- Test: Playhead visual position with scroll ---');

        const scrollTest = await page.evaluate(() => {
            const trackScroll = document.querySelector('.track-scroll');

            // Set playhead to 100 seconds (absolute position = 100*20+20 = 2020px)
            playheadPosition = 100;

            // Scroll timeline to 1000px
            trackScroll.scrollLeft = 1000;

            // Update visual position
            updatePlayheadVisualPosition();

            // Expected visual left = 2020 - 1000 = 1020px
            const visualLeft = parseFloat(globalPlayhead.style.left);

            return {
                playheadPosition: playheadPosition,
                scrollLeft: trackScroll.scrollLeft,
                visualLeft: visualLeft,
                expectedVisualLeft: (100 * 20 + 20) - 1000 // 1020
            };
        });

        console.log('  playheadPosition = ' + scrollTest.playheadPosition + 's');
        console.log('  scrollLeft = ' + scrollTest.scrollLeft + 'px');
        console.log('  visualLeft = ' + scrollTest.visualLeft + 'px');
        console.log('  expectedVisualLeft = ' + scrollTest.expectedVisualLeft + 'px');

        if (Math.abs(scrollTest.visualLeft - scrollTest.expectedVisualLeft) > 5) {
            console.log('FAIL: Visual position not correctly adjusted for scroll');
            process.exit(1);
        }
        console.log('PASS: Playhead visual position adjusts for scroll');

        // Test 4: Test manual call to updatePlayheadVisualPosition after scroll
        console.log('\n--- Test: Manual updatePlayheadVisualPosition after scroll ---');

        const syncScrollTest = await page.evaluate(() => {
            const trackScrolls = document.querySelectorAll('.track-scroll');

            // Reset
            playheadPosition = 50;
            trackScrolls[0].scrollLeft = 0;
            updatePlayheadVisualPosition();
            const beforeScroll = parseFloat(globalPlayhead.style.left);

            // Scroll to 500px
            trackScrolls[0].scrollLeft = 500;
            // Manually call update (simulates what happens in real scroll event)
            updatePlayheadVisualPosition();

            const afterScroll = parseFloat(globalPlayhead.style.left);
            return {
                beforeScroll,
                afterScroll,
                scrollLeft: 500,
                expectedDiff: -500
            };
        });

        console.log('  Before scroll: visualLeft = ' + syncScrollTest.beforeScroll + 'px');
        console.log('  After scroll to 500px: visualLeft = ' + syncScrollTest.afterScroll + 'px');
        console.log('  Difference = ' + (syncScrollTest.afterScroll - syncScrollTest.beforeScroll) + 'px');

        const actualDiff = syncScrollTest.afterScroll - syncScrollTest.beforeScroll;
        if (Math.abs(actualDiff - syncScrollTest.expectedDiff) > 10) {
            console.log('FAIL: updatePlayheadVisualPosition did not adjust for scroll');
            process.exit(1);
        }
        console.log('PASS: updatePlayheadVisualPosition adjusts for scroll');

        // Test 5: Test live scroll during playhead drag simulation
        console.log('\n--- Test: Live scroll during playhead movement ---');

        const liveDragTest = await page.evaluate(() => {
            const trackScroll = document.querySelector('.track-scroll');

            // Reset scroll
            trackScroll.scrollLeft = 0;

            // Set playhead to far position (200 seconds)
            playheadPosition = 200;
            ensurePlayheadVisible();

            // Wait for scroll to complete
            return new Promise(resolve => {
                let lastScroll = -1;
                let stableCount = 0;

                const check = () => {
                    if (Math.abs(trackScroll.scrollLeft - lastScroll) < 1) {
                        stableCount++;
                        if (stableCount >= 3) {
                            const visualLeft = parseFloat(globalPlayhead.style.left);
                            const viewportWidth = trackScroll.clientWidth;

                            resolve({
                                scrollLeft: trackScroll.scrollLeft,
                                visualLeft: visualLeft,
                                viewportWidth: viewportWidth,
                                isVisible: visualLeft >= 0 && visualLeft <= viewportWidth,
                                playheadPosition: playheadPosition
                            });
                            return;
                        }
                    } else {
                        stableCount = 0;
                    }
                    lastScroll = trackScroll.scrollLeft;
                    setTimeout(check, 50);
                };

                setTimeout(check, 100);
            });
        });

        console.log('  playheadPosition = ' + liveDragTest.playheadPosition + 's');
        console.log('  scrollLeft = ' + liveDragTest.scrollLeft + 'px');
        console.log('  visualLeft = ' + liveDragTest.visualLeft + 'px');
        console.log('  viewportWidth = ' + liveDragTest.viewportWidth + 'px');
        console.log('  isVisible = ' + liveDragTest.isVisible);

        if (!liveDragTest.isVisible) {
            console.log('FAIL: Playhead not visible after ensurePlayheadVisible()');
            process.exit(1);
        }
        console.log('PASS: Playhead is visible after live scroll');

        // Verify scroll happened
        if (liveDragTest.scrollLeft === 0) {
            console.log('FAIL: Timeline did not scroll');
            process.exit(1);
        }
        console.log('PASS: Timeline scrolled to show playhead');

        console.log('\n=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testLiveDragScroll();
