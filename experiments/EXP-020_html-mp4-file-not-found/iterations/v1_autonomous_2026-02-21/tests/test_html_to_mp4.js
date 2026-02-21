/**
 * Playwright test for EXP-020: HTML to MP4 "File not found" fix
 *
 * Tests:
 * 1. Upload HTML file
 * 2. Start conversion
 * 3. Wait for completion
 * 4. Download the MP4 (should return 200, not 404)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5022';
const TEST_HTML_PATH = process.argv[2] || 'C:\\Users\\haege\\Downloads\\paradigmskifte-presentation.html';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHtmlToMp4Download() {
    console.log('=== EXP-020: HTML to MP4 Download Test ===\n');
    console.log(`Test file: ${TEST_HTML_PATH}`);

    // Check if test file exists
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
            console.log('WARN: No tab button found, might be single-page');
            passed++;
        }

        // Test 3: Upload HTML file via API
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
            console.log(`OK: Uploaded HTML file, id: ${uploadResponse.id}`);
            console.log(`   Slides: ${uploadResponse.total_slides}, Duration: ${uploadResponse.total_duration}s`);
            passed++;
        } else {
            console.log(`FAIL: Upload failed: ${uploadResponse.error}`);
            failed++;
            throw new Error('Upload failed');
        }

        const htmlId = uploadResponse.id;

        // Test 4: Start conversion
        console.log('\n--- Test 4: Start HTML to MP4 conversion ---');
        const conversionResponse = await page.evaluate(async (htmlId) => {
            const response = await fetch('/html-to-mp4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html_id: htmlId,
                    width: 1920,
                    height: 1080,
                    fps: 2,
                    seconds_per_slide: 3  // Short for faster test
                })
            });
            return await response.json();
        }, htmlId);

        if (conversionResponse.success) {
            console.log(`OK: Conversion started, job_id: ${conversionResponse.job_id}`);
            passed++;
        } else {
            console.log(`FAIL: Conversion start failed: ${conversionResponse.error}`);
            failed++;
            throw new Error('Conversion start failed');
        }

        const jobId = conversionResponse.job_id;

        // Test 5: Poll for completion (max 120 seconds)
        console.log('\n--- Test 5: Wait for conversion to complete ---');
        let status = 'processing';
        let downloadUrl = null;
        let attempts = 0;
        const maxAttempts = 60;  // 60 * 2s = 120s max

        while (status === 'processing' && attempts < maxAttempts) {
            await sleep(2000);
            attempts++;

            const statusResponse = await page.evaluate(async (jobId) => {
                const response = await fetch(`/html-to-mp4/status/${jobId}`);
                return await response.json();
            }, jobId);

            status = statusResponse.status;
            console.log(`   Attempt ${attempts}: status=${status}`);

            if (status === 'completed') {
                downloadUrl = statusResponse.download_url;
                console.log(`OK: Conversion completed! download_url: ${downloadUrl}`);
                passed++;
            } else if (status === 'failed') {
                console.log(`FAIL: Conversion failed: ${statusResponse.error}`);
                failed++;
                throw new Error(`Conversion failed: ${statusResponse.error}`);
            }
        }

        if (status !== 'completed') {
            console.log('FAIL: Conversion timed out');
            failed++;
            throw new Error('Conversion timed out');
        }

        // Test 6: Download the file (THE CRITICAL TEST!)
        console.log('\n--- Test 6: Download MP4 file (the bug fix test!) ---');
        const downloadResponse = await page.evaluate(async (downloadUrl) => {
            const response = await fetch(downloadUrl);
            return {
                status: response.status,
                contentType: response.headers.get('content-type'),
                ok: response.ok
            };
        }, downloadUrl);

        if (downloadResponse.status === 200 && downloadResponse.ok) {
            console.log(`OK: Download returned HTTP ${downloadResponse.status}`);
            console.log(`   Content-Type: ${downloadResponse.contentType}`);
            passed++;
        } else if (downloadResponse.status === 404) {
            console.log(`FAIL: Download returned 404 "File not found" - BUG NOT FIXED!`);
            failed++;
        } else {
            console.log(`FAIL: Download returned HTTP ${downloadResponse.status}`);
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50));

        if (failed === 0) {
            console.log('\n=== ALL TESTS PASSED ===');
            console.log('EXP-020 fix verified: HTML to MP4 download works!');
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

testHtmlToMp4Download();
