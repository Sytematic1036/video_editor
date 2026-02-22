/**
 * Simple Playwright test for EXP-022: Slide Start Times
 * Runs against existing server on port 5099
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5099';

async function runTests() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('\n=== EXP-022: Slide Start Times Test ===\n');

    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Page loads
        console.log('Test 1: Page loads correctly');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        if (title.includes('Video Editor') || title.includes('HTML to MP4')) {
            console.log('  PASS: Page loaded with title:', title);
            passed++;
        } else {
            console.log('  FAIL: Unexpected title:', title);
            failed++;
        }

        // Test 2: HTML to MP4 section exists
        console.log('Test 2: HTML to MP4 section exists');
        const htmlSection = await page.$('#htmlDropZone');
        if (htmlSection) {
            console.log('  PASS: HTML to MP4 section found');
            passed++;
        } else {
            console.log('  FAIL: HTML to MP4 section not found');
            failed++;
        }

        // Test 3: Check header shows "Slide Start Times"
        console.log('Test 3: Header shows "Slide Start Times"');
        const header = await page.$eval('#slideDurationsSection h3', el => el.textContent);
        if (header.includes('Start Times')) {
            console.log('  PASS: Header shows "Slide Start Times"');
            passed++;
        } else {
            console.log(`  FAIL: Header shows "${header}" instead of "Slide Start Times"`);
            failed++;
        }

        // Test 4: Upload test HTML file
        console.log('Test 4: Upload HTML file');
        const testFile = path.join(__dirname, '..', 'fixtures', 'bildspel-fragetecken-v2.html');

        if (!fs.existsSync(testFile)) {
            console.log('  SKIP: Test file not found:', testFile);
            failed++;
        } else {
            // Find file input
            const fileInput = await page.$('input[type="file"][accept=".html"]');
            if (fileInput) {
                await fileInput.setInputFiles(testFile);
                await page.waitForTimeout(3000); // Wait for upload and processing

                // Check if slide durations section is visible
                const isVisible = await page.evaluate(() => {
                    const section = document.getElementById('slideDurationsSection');
                    return section && section.classList.contains('visible');
                });

                if (isVisible) {
                    console.log('  PASS: File uploaded and durations section visible');
                    passed++;
                } else {
                    console.log('  FAIL: Durations section not visible after upload');
                    failed++;
                }
            } else {
                console.log('  FAIL: File input not found');
                failed++;
            }
        }

        // Test 5: Start time labels exist
        console.log('Test 5: Start time labels exist');
        const startTimeLabels = await page.$$('.start-time-label');
        if (startTimeLabels.length > 0) {
            console.log(`  PASS: Found ${startTimeLabels.length} start time labels`);
            passed++;
        } else {
            console.log('  FAIL: No start time labels found');
            failed++;
        }

        // Test 6: First slide shows 0:00
        console.log('Test 6: First slide shows 0:00');
        const firstStartTime = await page.$eval('#start-time-0', el => el.textContent);
        if (firstStartTime === '0:00') {
            console.log('  PASS: First slide shows 0:00');
            passed++;
        } else {
            console.log(`  FAIL: First slide shows "${firstStartTime}" instead of "0:00"`);
            failed++;
        }

        // Test 7: Start times are cumulative
        console.log('Test 7: Start times are cumulative');

        const results = await page.evaluate(() => {
            const times = [];
            const durs = [];
            document.querySelectorAll('.start-time-label').forEach(el => {
                times.push(el.textContent);
            });
            document.querySelectorAll('[id^="slide-duration-"]').forEach(input => {
                durs.push(parseInt(input.value) || 0);
            });
            return { times, durs };
        });

        console.log('  Start times:', results.times);
        console.log('  Durations:', results.durs);

        // Verify cumulative calculation
        let cumulative = 0;
        let allCorrect = true;
        for (let i = 0; i < results.times.length; i++) {
            const expectedMins = Math.floor(cumulative / 60);
            const expectedSecs = cumulative % 60;
            const expected = `${expectedMins}:${expectedSecs.toString().padStart(2, '0')}`;

            if (results.times[i] !== expected) {
                console.log(`  FAIL: Slide ${i+1} expected "${expected}" but got "${results.times[i]}"`);
                allCorrect = false;
                break;
            }
            cumulative += results.durs[i];
        }

        if (allCorrect && results.times.length > 0) {
            console.log('  PASS: All start times are correctly cumulative');
            passed++;
        } else if (results.times.length === 0) {
            console.log('  FAIL: No start times found');
            failed++;
        } else {
            failed++;
        }

        // Test 8: Changing duration updates start times (using JavaScript)
        console.log('Test 8: Changing duration updates start times');

        const beforeChange = await page.$eval('#start-time-1', el => el.textContent);
        console.log('  Before change, slide 2 start time:', beforeChange);

        // Use JavaScript to change the value and trigger event
        await page.evaluate(() => {
            const input = document.getElementById('slide-duration-0');
            input.value = '10';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(500);

        const afterChange = await page.$eval('#start-time-1', el => el.textContent);
        console.log('  After change to 10s, slide 2 start time:', afterChange);

        if (afterChange === '0:10') {
            console.log('  PASS: Start times update when duration changes');
            passed++;
        } else {
            console.log(`  FAIL: Second slide shows "${afterChange}" instead of "0:10"`);
            failed++;
        }

        // Test 9: Format handles > 60 seconds
        console.log('Test 9: Format handles durations > 60 seconds');

        await page.evaluate(() => {
            const input = document.getElementById('slide-duration-0');
            input.value = '75';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(500);

        const secondStartTimeAfter = await page.$eval('#start-time-1', el => el.textContent);
        if (secondStartTimeAfter === '1:15') {
            console.log('  PASS: Correctly formats 1:15 for 75 seconds');
            passed++;
        } else {
            console.log(`  FAIL: Shows "${secondStartTimeAfter}" instead of "1:15"`);
            failed++;
        }

        // Test 10: Duration inputs retain values
        console.log('Test 10: Duration inputs are functional');
        const durationInput = await page.evaluate(() => document.getElementById('slide-duration-0').value);
        if (durationInput === '75') {
            console.log('  PASS: Duration input retains value');
            passed++;
        } else {
            console.log(`  FAIL: Duration input value is "${durationInput}"`);
            failed++;
        }

        // Take screenshot for verification
        await page.screenshot({ path: path.join(__dirname, 'screenshot.png') });
        console.log('\nScreenshot saved to tests/screenshot.png');

    } catch (error) {
        console.error('\nTest error:', error.message);
        failed++;
    } finally {
        await browser.close();
    }

    console.log('\n=== TEST RESULTS ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);

    if (failed === 0) {
        console.log('\n=== ALL TESTS PASSED ===\n');
        return 0;
    } else {
        console.log('\n=== SOME TESTS FAILED ===\n');
        return 1;
    }
}

runTests().then(code => process.exit(code)).catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
