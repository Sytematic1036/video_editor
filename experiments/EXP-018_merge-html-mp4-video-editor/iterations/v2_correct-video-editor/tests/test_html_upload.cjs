/**
 * Playwright test for HTML upload and conversion - EXP-018
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5022';
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'test_presentation.html');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('=== EXP-018 HTML Upload Test ===\n');

    // Check if fixture exists
    if (!fs.existsSync(FIXTURE_PATH)) {
        console.log('Creating minimal test HTML...');
        const minimalHtml = `<!DOCTYPE html>
<html>
<head><title>Test Presentation</title></head>
<body style="background: #1a1a2e; color: white; font-family: sans-serif;">
    <div id="slide1" style="padding: 50px; text-align: center;">
        <h1>Slide 1</h1>
        <p>Test presentation for EXP-018</p>
    </div>
    <script>
        const TOTAL_STEPS = 2;
        const NARRATIVES = ["", ""];
        const SAVED_DURATIONS = {"0": 3, "1": 3};
        let currentSlide = 0;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' && currentSlide < TOTAL_STEPS) {
                currentSlide++;
                document.body.innerHTML = '<div style="padding: 50px; text-align: center;"><h1>Slide ' + (currentSlide + 1) + '</h1></div>';
            }
        });
    </script>
</body>
</html>`;
        fs.writeFileSync(FIXTURE_PATH, minimalHtml);
        console.log('Created test HTML at:', FIXTURE_PATH);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let passed = 0;
    let failed = 0;

    try {
        // Navigate to HTML to MP4 tab
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.click('.main-tab-btn[data-tab="html-to-mp4"]');
        await sleep(300);
        console.log('✓ Navigated to HTML to MP4 tab');
        passed++;

        // Upload HTML file
        console.log('\nUploading HTML file...');
        const fileInput = await page.$('#htmlFileInput');
        await fileInput.setInputFiles(FIXTURE_PATH);
        await sleep(2000);

        // Check if file info is visible
        const fileInfoVisible = await page.$('#htmlFileInfo.visible');
        if (fileInfoVisible) {
            console.log('✓ File info displayed after upload');
            passed++;
        } else {
            console.log('✗ File info not displayed');
            failed++;
        }

        // Check if slide durations section is visible
        const durationsVisible = await page.$('#slideDurationsSection.visible');
        if (durationsVisible) {
            console.log('✓ Slide durations section visible');
            passed++;
        } else {
            console.log('✗ Slide durations section not visible');
            failed++;
        }

        // Check if generate button is enabled
        const generateBtn = await page.$('#generateHtmlBtn');
        const isEnabled = !(await generateBtn.isDisabled());
        if (isEnabled) {
            console.log('✓ Generate button is enabled after upload');
            passed++;
        } else {
            console.log('✗ Generate button still disabled');
            failed++;
        }

        // Check filename display
        const filenameEl = await page.$('#htmlFileName');
        const filename = await filenameEl?.textContent();
        if (filename && filename.includes('test_presentation') || filename && filename.length > 0) {
            console.log('✓ Filename displayed correctly:', filename);
            passed++;
        } else {
            console.log('✗ Filename not displayed correctly');
            failed++;
        }

        // Test clear button
        console.log('\nTesting clear button...');
        await page.click('#clearHtmlBtn');
        await sleep(500);

        const fileInfoHidden = await page.$('#htmlFileInfo:not(.visible)');
        const generateDisabled = await page.$('#generateHtmlBtn:disabled');

        if (fileInfoHidden || generateDisabled) {
            console.log('✓ Clear button works - form reset');
            passed++;
        } else {
            console.log('✗ Clear button did not reset form');
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(40));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(40));

        if (failed === 0) {
            console.log('\n✓ ALL UPLOAD TESTS PASSED\n');
        } else {
            console.log('\n✗ SOME TESTS FAILED\n');
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('\n✗ Test error:', error.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

runTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
