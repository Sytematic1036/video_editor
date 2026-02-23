/**
 * EXP-025 v3: Test that custom durations are saved in HTML copy
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5022';
const TEST_HTML = path.join(__dirname, 'fixtures', 'test_presentation.html');
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

async function test() {
    console.log('\n=== Testing: Save Durations in HTML Copy ===\n');

    // Create download directory
    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        acceptDownloads: true
    });
    const page = await context.newPage();

    await page.goto(BASE_URL);
    await page.click('button[data-tab="html-to-mp4"]');
    await page.waitForTimeout(500);

    // Upload HTML file
    console.log('1. Uploading HTML file...');
    await page.locator('#htmlFileInput').setInputFiles(TEST_HTML);
    await page.waitForTimeout(2000);

    // Check original durations (should be 3, 3, 3 from test file)
    const slide0Before = await page.locator('#slide-duration-0').inputValue();
    console.log(`   Original slide 0 duration: ${slide0Before}s`);

    // Change slide 0 duration to 10 seconds
    console.log('2. Changing slide 0 duration to 10s...');
    await page.locator('#slide-duration-0').fill('10');
    await page.waitForTimeout(500);

    // Change slide 1 duration to 15 seconds
    console.log('   Changing slide 1 duration to 15s...');
    await page.locator('#slide-duration-1').fill('15');
    await page.waitForTimeout(500);

    // Download HTML copy
    console.log('3. Downloading HTML copy with new durations...');
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('#copyHtmlBtn')
    ]);

    const downloadPath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
    await download.saveAs(downloadPath);
    console.log(`   Saved to: ${downloadPath}`);

    // Read downloaded file and check durations
    console.log('4. Verifying durations in downloaded file...');
    const content = fs.readFileSync(downloadPath, 'utf-8');

    // Check for SLIDE_CONFIG with new durations
    const slideConfigMatch = content.match(/SLIDE_CONFIG\s*=\s*\[(.*?)\]/s);
    if (slideConfigMatch) {
        const configContent = slideConfigMatch[1];
        console.log('   Found SLIDE_CONFIG');

        // Extract durations
        const durations = [...configContent.matchAll(/duration\s*:\s*(\d+)/g)].map(m => parseInt(m[1]));
        console.log(`   Durations in file: ${durations.join(', ')}`);

        if (durations[0] === 10 && durations[1] === 15) {
            console.log('   PASS: Durations correctly saved!');
        } else {
            throw new Error(`Expected [10, 15, ...] but got [${durations.join(', ')}]`);
        }
    } else {
        // Check SAVED_DURATIONS
        const savedMatch = content.match(/SAVED_DURATIONS\s*=\s*(\{[^}]+\})/);
        if (savedMatch) {
            const saved = JSON.parse(savedMatch[1]);
            console.log(`   Found SAVED_DURATIONS: ${JSON.stringify(saved)}`);

            if (saved['0'] === 10 && saved['1'] === 15) {
                console.log('   PASS: Durations correctly saved!');
            } else {
                throw new Error(`Expected {"0":10,"1":15,...} but got ${JSON.stringify(saved)}`);
            }
        } else {
            throw new Error('No SLIDE_CONFIG or SAVED_DURATIONS found in downloaded file');
        }
    }

    // Cleanup
    fs.unlinkSync(downloadPath);
    fs.rmdirSync(DOWNLOAD_DIR);

    await browser.close();
    console.log('\n=== All tests passed! ===\n');
}

test().catch(err => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
