/**
 * EXP-025 v2: Test Download HTML Copy functionality
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:5022';
const TEST_HTML = path.join(__dirname, 'fixtures', 'test_presentation.html');

async function test() {
    console.log('\n=== Testing: Download HTML Copy ===\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(BASE_URL);
    await page.click('button[data-tab="html-to-mp4"]');
    await page.waitForTimeout(500);

    // Upload HTML file
    console.log('1. Uploading HTML file...');
    await page.locator('#htmlFileInput').setInputFiles(TEST_HTML);
    await page.waitForTimeout(2000);

    // Check button text
    const btnText = await page.locator('#copyHtmlBtn').textContent();
    console.log(`2. Button text: "${btnText}"`);
    if (!btnText.includes('Download')) {
        throw new Error('Button should say "Download HTML Copy"');
    }
    console.log('   PASS: Button text is correct');

    // Check button is enabled
    const isDisabled = await page.locator('#copyHtmlBtn').isDisabled();
    if (isDisabled) {
        throw new Error('Download button should be enabled after upload');
    }
    console.log('   PASS: Button is enabled');

    // Set up download handler
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('#copyHtmlBtn')
    ]);

    const filename = download.suggestedFilename();
    console.log(`3. Download triggered: ${filename}`);

    if (!filename.endsWith('.html')) {
        throw new Error('Downloaded file should be .html');
    }
    console.log('   PASS: Download filename is correct');

    // Check filename has timestamp
    if (!filename.match(/\d{4}-\d{2}-\d{2}_\d{6}\.html$/)) {
        throw new Error('Filename should have timestamp format');
    }
    console.log('   PASS: Filename has timestamp');

    await browser.close();

    console.log('\n=== All tests passed! ===\n');
}

test().catch(err => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
