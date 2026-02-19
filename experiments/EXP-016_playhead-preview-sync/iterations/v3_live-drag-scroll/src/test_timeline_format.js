/**
 * Playwright test for EXP-016: Timeline Time Format (M:SS)
 * Tests that the ruler displays time in M:SS format (0:30, 1:00, 1:30)
 */
const { chromium } = require('playwright');

const PORT = 5022;
const BASE_URL = `http://localhost:${PORT}`;

async function testTimelineFormat() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-016 Timeline Format Test ===\n');

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('Page loaded');

        // Test formatTime function
        const formatTimeResults = await page.evaluate(() => {
            // formatTime should be defined globally
            if (typeof formatTime !== 'function') {
                return { error: 'formatTime function not found' };
            }
            return {
                test0: formatTime(0),       // Expected: "0:00"
                test30: formatTime(30),     // Expected: "0:30"
                test60: formatTime(60),     // Expected: "1:00"
                test90: formatTime(90),     // Expected: "1:30"
                test125: formatTime(125),   // Expected: "2:05"
            };
        });

        if (formatTimeResults.error) {
            console.log('FAIL: ' + formatTimeResults.error);
            process.exit(1);
        }

        console.log('formatTime(0) = ' + formatTimeResults.test0);
        console.log('formatTime(30) = ' + formatTimeResults.test30);
        console.log('formatTime(60) = ' + formatTimeResults.test60);
        console.log('formatTime(90) = ' + formatTimeResults.test90);
        console.log('formatTime(125) = ' + formatTimeResults.test125);

        // Verify results
        let allPassed = true;

        if (formatTimeResults.test0 !== '0:00') {
            console.log('FAIL: formatTime(0) should be "0:00"');
            allPassed = false;
        }
        if (formatTimeResults.test30 !== '0:30') {
            console.log('FAIL: formatTime(30) should be "0:30"');
            allPassed = false;
        }
        if (formatTimeResults.test60 !== '1:00') {
            console.log('FAIL: formatTime(60) should be "1:00"');
            allPassed = false;
        }
        if (formatTimeResults.test90 !== '1:30') {
            console.log('FAIL: formatTime(90) should be "1:30"');
            allPassed = false;
        }
        if (formatTimeResults.test125 !== '2:05') {
            console.log('FAIL: formatTime(125) should be "2:05"');
            allPassed = false;
        }

        if (!allPassed) {
            console.log('\n=== TEST FAILED ===');
            process.exit(1);
        }

        console.log('\nAll formatTime tests passed');

        // Check that ruler markers use M:SS format (not "Xs")
        const rulerMarkers = await page.evaluate(() => {
            const markers = document.querySelectorAll('.time-marker.major');
            const texts = [];
            markers.forEach(m => {
                if (m.textContent) texts.push(m.textContent);
            });
            return texts;
        });

        console.log('\nRuler markers found: ' + JSON.stringify(rulerMarkers));

        // Check that markers don't contain "s" suffix
        const hasOldFormat = rulerMarkers.some(t => t.match(/^\d+s$/));
        if (hasOldFormat) {
            console.log('FAIL: Ruler still uses old "Xs" format');
            process.exit(1);
        }

        // Check that markers use M:SS format
        const hasMSSFormat = rulerMarkers.length === 0 || rulerMarkers.some(t => t.match(/^\d+:\d{2}$/));
        if (rulerMarkers.length > 0 && !hasMSSFormat) {
            console.log('FAIL: Ruler does not use M:SS format');
            process.exit(1);
        }

        console.log('Ruler uses correct M:SS format');
        console.log('\n=== TEST PASSED ===');

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testTimelineFormat();
