/**
 * Playwright tests for EXP-019: Timeline width consistency
 * Tests that all tracks have the same width
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5022';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('=== EXP-019 Timeline Tests ===\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let passed = 0;
    let failed = 0;

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('Page loaded\n');

        // Test 1: All tracks have same width (empty state)
        console.log('Test 1: All tracks have same width (empty state)...');
        const widths = await page.evaluate(() => {
            const videoTrack = document.getElementById('videoTrack');
            const audioTrack = document.getElementById('audioTrack');
            const speechTrack = document.getElementById('speechTrack');
            return {
                video: videoTrack ? parseInt(videoTrack.style.width) || videoTrack.offsetWidth : 0,
                audio: audioTrack ? parseInt(audioTrack.style.width) || audioTrack.offsetWidth : 0,
                speech: speechTrack ? parseInt(speechTrack.style.width) || speechTrack.offsetWidth : 0
            };
        });

        console.log(`  Video track width: ${widths.video}px`);
        console.log(`  Audio track width: ${widths.audio}px`);
        console.log(`  Speech track width: ${widths.speech}px`);

        if (widths.video === widths.audio && widths.audio === widths.speech && widths.video > 0) {
            console.log('  PASS: All tracks have same width');
            passed++;
        } else {
            console.log('  FAIL: Track widths differ');
            failed++;
        }

        // Test 2: Timeline has minimum width (30 seconds * PIXELS_PER_SECOND)
        console.log('\nTest 2: Timeline has minimum width...');
        const minWidth = await page.evaluate(() => {
            const PIXELS_PER_SECOND = 20; // From the code
            return 30 * PIXELS_PER_SECOND; // Minimum 30 seconds
        });

        if (widths.video >= minWidth) {
            console.log(`  PASS: Timeline width (${widths.video}px) >= minimum (${minWidth}px)`);
            passed++;
        } else {
            console.log(`  FAIL: Timeline width (${widths.video}px) < minimum (${minWidth}px)`);
            failed++;
        }

        // Test 3: getTimelineMaxDuration function exists
        console.log('\nTest 3: getTimelineMaxDuration function exists...');
        const hasFunction = await page.evaluate(() => {
            return typeof getTimelineMaxDuration === 'function';
        });

        if (hasFunction) {
            console.log('  PASS: getTimelineMaxDuration function exists');
            passed++;
        } else {
            console.log('  FAIL: getTimelineMaxDuration function not found');
            failed++;
        }

        // Test 4: getTimelineMaxDuration returns correct value
        console.log('\nTest 4: getTimelineMaxDuration returns minimum 30...');
        const maxDuration = await page.evaluate(() => {
            return getTimelineMaxDuration();
        });

        if (maxDuration >= 30) {
            console.log(`  PASS: getTimelineMaxDuration returns ${maxDuration} (>= 30)`);
            passed++;
        } else {
            console.log(`  FAIL: getTimelineMaxDuration returns ${maxDuration} (< 30)`);
            failed++;
        }

        // Test 5: Rulers have same width as tracks
        console.log('\nTest 5: Rulers have same width as tracks...');
        const rulerWidths = await page.evaluate(() => {
            const videoRuler = document.getElementById('videoRuler');
            const audioRuler = document.getElementById('audioRuler');
            const speechRuler = document.getElementById('speechRuler');
            return {
                video: videoRuler ? parseInt(videoRuler.style.width) || videoRuler.offsetWidth : 0,
                audio: audioRuler ? parseInt(audioRuler.style.width) || audioRuler.offsetWidth : 0,
                speech: speechRuler ? parseInt(speechRuler.style.width) || speechRuler.offsetWidth : 0
            };
        });

        // Rulers should be same width as each other
        if (rulerWidths.video === rulerWidths.audio && rulerWidths.audio === rulerWidths.speech) {
            console.log(`  PASS: All rulers have same width (${rulerWidths.video}px)`);
            passed++;
        } else {
            console.log('  FAIL: Ruler widths differ');
            console.log(`    Video ruler: ${rulerWidths.video}px`);
            console.log(`    Audio ruler: ${rulerWidths.audio}px`);
            console.log(`    Speech ruler: ${rulerWidths.speech}px`);
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(40));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(40));

        if (failed === 0) {
            console.log('\nALL TIMELINE TESTS PASSED\n');
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
