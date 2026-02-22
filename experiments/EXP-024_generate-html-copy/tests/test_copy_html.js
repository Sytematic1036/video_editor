/**
 * EXP-024: Playwright tests for Generate HTML Copy feature
 *
 * Run with: node experiments/EXP-024_generate-html-copy/tests/test_copy_html.js
 * Requires: Flask server running on localhost:5022
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5022';
const TEST_HTML_PATH = path.join(__dirname, 'test_fixture.html');
const HTML_UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'html_uploads');

async function runTests() {
    console.log('='.repeat(60));
    console.log('EXP-024: Generate HTML Copy - Playwright Tests');
    console.log('='.repeat(60));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Button exists and is visible
        console.log('\nTest 1: Copy HTML button exists');
        await page.goto(BASE_URL);

        // Switch to HTML to MP4 tab
        await page.click('[data-tab="html-to-mp4"]');
        await page.waitForSelector('#html-to-mp4.active', { timeout: 2000 });

        const copyBtn = await page.$('#copyHtmlBtn');
        if (copyBtn) {
            console.log('  ✓ PASSED: #copyHtmlBtn exists');
            passed++;
        } else {
            console.log('  ✗ FAILED: #copyHtmlBtn not found');
            failed++;
        }

        // Test 2: Button is disabled without HTML upload
        console.log('\nTest 2: Button disabled without HTML');
        const isDisabledBefore = await page.$eval('#copyHtmlBtn', btn => btn.disabled);
        if (isDisabledBefore) {
            console.log('  ✓ PASSED: Button is disabled before upload');
            passed++;
        } else {
            console.log('  ✗ FAILED: Button should be disabled before upload');
            failed++;
        }

        // Test 3: Upload HTML and check button becomes enabled
        console.log('\nTest 3: Button enabled after HTML upload');

        // Upload test HTML file
        const fileInput = await page.$('#htmlFileInput');
        await fileInput.setInputFiles(TEST_HTML_PATH);

        // Wait for upload to complete and button to enable
        await page.waitForFunction(() => {
            const btn = document.querySelector('#copyHtmlBtn');
            return btn && !btn.disabled;
        }, { timeout: 5000 });

        const isDisabledAfter = await page.$eval('#copyHtmlBtn', btn => btn.disabled);
        if (!isDisabledAfter) {
            console.log('  ✓ PASSED: Button is enabled after upload');
            passed++;
        } else {
            console.log('  ✗ FAILED: Button should be enabled after upload');
            failed++;
        }

        // Test 4: Clicking button creates a copy with timestamp
        console.log('\nTest 4: Copy creates file with timestamp');

        // Get count of files before
        const filesBefore = fs.existsSync(HTML_UPLOADS_DIR)
            ? fs.readdirSync(HTML_UPLOADS_DIR).filter(f => f.includes('test_fixture')).length
            : 0;

        // Wait for initial status to disappear (it auto-hides after 3s)
        await page.waitForTimeout(500);

        // Click the copy button
        await page.click('#copyHtmlBtn');

        // Wait for status message containing "HTML copy saved"
        await page.waitForFunction(() => {
            const status = document.querySelector('.html-status');
            return status && status.textContent.includes('HTML copy saved');
        }, { timeout: 5000 });
        const statusText = await page.$eval('.html-status', el => el.textContent);

        // Check status message
        if (statusText.includes('HTML copy saved')) {
            console.log('  ✓ PASSED: Success message shown');
            passed++;
        } else {
            console.log(`  ✗ FAILED: Expected success message, got: ${statusText}`);
            failed++;
        }

        // Test 5: Verify file was created with correct pattern
        console.log('\nTest 5: File created with correct name pattern');

        // Wait a bit for file system
        await page.waitForTimeout(500);

        const filesAfter = fs.existsSync(HTML_UPLOADS_DIR)
            ? fs.readdirSync(HTML_UPLOADS_DIR).filter(f => f.includes('test_fixture'))
            : [];

        // Find files matching timestamp pattern (YYYY-MM-DD_HHMMSS)
        const timestampPattern = /test_fixture_\d{4}-\d{2}-\d{2}_\d{6}\.html/;
        const matchingFiles = filesAfter.filter(f => timestampPattern.test(f));

        if (matchingFiles.length > 0) {
            console.log(`  ✓ PASSED: Found timestamped file: ${matchingFiles[matchingFiles.length - 1]}`);
            passed++;
        } else {
            console.log(`  ✗ FAILED: No file matching pattern found. Files: ${filesAfter.join(', ')}`);
            failed++;
        }

        // Test 6: Clear button disables copy button
        console.log('\nTest 6: Clear button disables copy button');
        await page.click('#clearHtmlBtn');
        await page.waitForTimeout(500);

        const isDisabledAfterClear = await page.$eval('#copyHtmlBtn', btn => btn.disabled);
        if (isDisabledAfterClear) {
            console.log('  ✓ PASSED: Button disabled after clear');
            passed++;
        } else {
            console.log('  ✗ FAILED: Button should be disabled after clear');
            failed++;
        }

    } catch (error) {
        console.error('\nTest error:', error.message);
        failed++;
    } finally {
        await browser.close();
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60));

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
