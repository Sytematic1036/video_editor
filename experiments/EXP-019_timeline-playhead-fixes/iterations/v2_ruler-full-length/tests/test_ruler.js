/**
 * Playwright tests for EXP-019 v2: Ruler full length
 * Tests that rulers show the full timeline length with second markers
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5022';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('=== EXP-019 v2 Ruler Tests ===\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let passed = 0;
    let failed = 0;

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('Page loaded\n');

        // Test 1: All three rulers exist
        console.log('Test 1: All three rulers exist...');
        const rulersExist = await page.evaluate(() => {
            const videoRuler = document.getElementById('videoRuler');
            const audioRuler = document.getElementById('audioRuler');
            const speechRuler = document.getElementById('speechRuler');
            return videoRuler && audioRuler && speechRuler;
        });

        if (rulersExist) {
            console.log('  PASS: All rulers exist');
            passed++;
        } else {
            console.log('  FAIL: Some rulers missing');
            failed++;
        }

        // Test 2: Rulers have same width as tracks
        console.log('\nTest 2: Rulers have same width as tracks...');
        const widths = await page.evaluate(() => {
            const videoRuler = document.getElementById('videoRuler');
            const videoTrack = document.getElementById('videoTrack');
            const audioRuler = document.getElementById('audioRuler');
            const audioTrack = document.getElementById('audioTrack');
            const speechRuler = document.getElementById('speechRuler');
            const speechTrack = document.getElementById('speechTrack');

            return {
                videoRuler: parseInt(videoRuler.style.width) || videoRuler.offsetWidth,
                videoTrack: parseInt(videoTrack.style.width) || videoTrack.offsetWidth,
                audioRuler: parseInt(audioRuler.style.width) || audioRuler.offsetWidth,
                audioTrack: parseInt(audioTrack.style.width) || audioTrack.offsetWidth,
                speechRuler: parseInt(speechRuler.style.width) || speechRuler.offsetWidth,
                speechTrack: parseInt(speechTrack.style.width) || speechTrack.offsetWidth
            };
        });

        console.log(`  Video: ruler=${widths.videoRuler}px, track=${widths.videoTrack}px`);
        console.log(`  Audio: ruler=${widths.audioRuler}px, track=${widths.audioTrack}px`);
        console.log(`  Speech: ruler=${widths.speechRuler}px, track=${widths.speechTrack}px`);

        if (widths.videoRuler === widths.videoTrack &&
            widths.audioRuler === widths.audioTrack &&
            widths.speechRuler === widths.speechTrack) {
            console.log('  PASS: Rulers match track widths');
            passed++;
        } else {
            console.log('  FAIL: Ruler widths do not match tracks');
            failed++;
        }

        // Test 3: Rulers have time markers
        console.log('\nTest 3: Rulers have time markers...');
        const markerCount = await page.evaluate(() => {
            const videoRuler = document.getElementById('videoRuler');
            const markers = videoRuler.querySelectorAll('.time-marker');
            return markers.length;
        });

        console.log(`  Found ${markerCount} time markers in video ruler`);

        // With 30 second minimum, we should have at least 31 markers (0-30)
        if (markerCount >= 31) {
            console.log('  PASS: Sufficient time markers exist');
            passed++;
        } else {
            console.log('  FAIL: Not enough time markers (expected >= 31)');
            failed++;
        }

        // Test 4: renderRuler uses getTimelineMaxDuration
        console.log('\nTest 4: Rulers use getTimelineMaxDuration...');
        const rulerTest = await page.evaluate(() => {
            const expectedDuration = getTimelineMaxDuration();
            const expectedWidth = expectedDuration * 20; // PIXELS_PER_SECOND = 20
            const videoRuler = document.getElementById('videoRuler');
            const actualWidth = parseInt(videoRuler.style.width) || videoRuler.offsetWidth;
            return {
                expectedDuration,
                expectedWidth,
                actualWidth,
                match: actualWidth === expectedWidth
            };
        });

        console.log(`  Expected: ${rulerTest.expectedWidth}px (${rulerTest.expectedDuration}s * 20px/s)`);
        console.log(`  Actual: ${rulerTest.actualWidth}px`);

        if (rulerTest.match) {
            console.log('  PASS: Ruler width matches getTimelineMaxDuration');
            passed++;
        } else {
            console.log('  FAIL: Ruler width does not match expected');
            failed++;
        }

        // Test 5: Simulate longer timeline and verify ruler extends
        console.log('\nTest 5: Ruler extends with simulated longer content...');
        const extendedTest = await page.evaluate(() => {
            // Temporarily override getTimelineMaxDuration to return 60 seconds
            const originalFn = getTimelineMaxDuration;
            window.getTimelineMaxDuration = () => 60;

            // Re-render timeline
            renderTimeline();

            const videoRuler = document.getElementById('videoRuler');
            const markers = videoRuler.querySelectorAll('.time-marker');
            const width = parseInt(videoRuler.style.width) || videoRuler.offsetWidth;

            // Restore original function
            window.getTimelineMaxDuration = originalFn;
            renderTimeline();

            return {
                markerCount: markers.length,
                width: width,
                expectedWidth: 60 * 20  // 60s * 20px/s
            };
        });

        console.log(`  With 60s duration: ${extendedTest.markerCount} markers, ${extendedTest.width}px width`);

        if (extendedTest.markerCount >= 61 && extendedTest.width === extendedTest.expectedWidth) {
            console.log('  PASS: Ruler correctly extends to 60 seconds');
            passed++;
        } else {
            console.log('  FAIL: Ruler did not extend properly');
            failed++;
        }

        // Test 6: Major markers at every 5 seconds
        console.log('\nTest 6: Major markers at 5-second intervals...');
        const majorMarkers = await page.evaluate(() => {
            const videoRuler = document.getElementById('videoRuler');
            const majorMarkers = videoRuler.querySelectorAll('.time-marker.major');
            return majorMarkers.length;
        });

        console.log(`  Found ${majorMarkers} major markers`);

        // With 30 seconds, we should have 7 major markers (0, 5, 10, 15, 20, 25, 30)
        if (majorMarkers >= 7) {
            console.log('  PASS: Correct number of major markers');
            passed++;
        } else {
            console.log('  FAIL: Not enough major markers (expected >= 7)');
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(40));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(40));

        if (failed === 0) {
            console.log('\nALL RULER TESTS PASSED\n');
        } else {
            console.log('\nSOME TESTS FAILED\n');
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('\nTest error:', error.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
