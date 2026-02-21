/**
 * Playwright test for EXP-020 v3: SLIDES array support
 *
 * Tests with bildspel-fragetecken-v2.html which uses:
 *   var SLIDES = [{ duration: 5 }, { duration: 40 }, { duration: 5 }]
 *
 * Expected: 3 slides, 50s total (not 15s with default 5s each)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5022';
const TEST_HTML_PATH = process.argv[2] || 'C:\\Users\\haege\\Downloads\\bildspel-fragetecken-v2.html';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSlidesArraySupport() {
    console.log('=== EXP-020 v3: SLIDES Array Support Test ===\n');
    console.log(`Test file: ${TEST_HTML_PATH}`);

    if (!fs.existsSync(TEST_HTML_PATH)) {
        console.error(`ERROR: Test file not found: ${TEST_HTML_PATH}`);
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Load page
        console.log('\n--- Test 1: Load page ---');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('OK: Page loaded');
        passed++;

        // Test 2: Switch to HTML to MP4 tab
        console.log('\n--- Test 2: Switch to HTML to MP4 tab ---');
        const htmlTabButton = await page.$('button:has-text("HTML to MP4")');
        if (htmlTabButton) {
            await htmlTabButton.click();
            await sleep(500);
            console.log('OK: Switched to HTML to MP4 tab');
            passed++;
        } else {
            passed++;
        }

        // Test 3: Upload HTML file
        console.log('\n--- Test 3: Upload HTML file ---');
        const fileContent = fs.readFileSync(TEST_HTML_PATH);
        const fileName = path.basename(TEST_HTML_PATH);

        const uploadResponse = await page.evaluate(async ({ fileContent, fileName }) => {
            const blob = new Blob([new Uint8Array(fileContent)], { type: 'text/html' });
            const formData = new FormData();
            formData.append('file', blob, fileName);

            const response = await fetch('/html-upload', {
                method: 'POST',
                body: formData
            });
            return await response.json();
        }, { fileContent: Array.from(fileContent), fileName });

        if (uploadResponse.success) {
            console.log(`OK: Uploaded HTML file`);
            console.log(`   Slides: ${uploadResponse.total_slides}`);
            console.log(`   Total duration: ${uploadResponse.total_duration}s`);
            passed++;
        } else {
            console.log(`FAIL: Upload failed: ${uploadResponse.error}`);
            failed++;
            throw new Error('Upload failed');
        }

        // Test 4: Verify slide count (expect 3)
        console.log('\n--- Test 4: Verify slide count (expect 3) ---');
        if (uploadResponse.total_slides === 3) {
            console.log(`OK: Correct slide count: ${uploadResponse.total_slides}`);
            passed++;
        } else {
            console.log(`FAIL: Expected 3 slides, got ${uploadResponse.total_slides}`);
            failed++;
        }

        // Test 5: Verify total duration (expect 50s, not 15s)
        console.log('\n--- Test 5: Verify total duration (expect 50s) ---');
        const expectedDuration = 50;
        if (uploadResponse.total_duration === expectedDuration) {
            console.log(`OK: Correct duration: ${uploadResponse.total_duration}s`);
            passed++;
        } else if (uploadResponse.total_duration === 15) {
            console.log(`FAIL: Got 15s - SLIDES array NOT being read (using default 5s each)`);
            failed++;
        } else {
            console.log(`FAIL: Expected ${expectedDuration}s, got ${uploadResponse.total_duration}s`);
            failed++;
        }

        // Test 6: Verify individual slide durations
        console.log('\n--- Test 6: Verify individual durations (5, 40, 5) ---');
        const durations = uploadResponse.slide_durations;
        const expected = { 0: 5, 1: 40, 2: 5 };
        let durationsMatch = true;

        for (const [idx, dur] of Object.entries(expected)) {
            if (durations[idx] !== dur) {
                console.log(`   FAIL: Slide ${idx} expected ${dur}s, got ${durations[idx]}s`);
                durationsMatch = false;
            } else {
                console.log(`   OK: Slide ${idx} = ${dur}s`);
            }
        }

        if (durationsMatch) {
            console.log('OK: All individual durations correct');
            passed++;
        } else {
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50));

        if (failed === 0) {
            console.log('\n=== ALL TESTS PASSED ===');
            console.log('EXP-020 v3 verified: SLIDES array durations extracted correctly');
        } else {
            console.log('\n=== TESTS FAILED ===');
            process.exit(1);
        }

    } catch (error) {
        console.error(`\nERROR: ${error.message}`);
        console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testSlidesArraySupport();
