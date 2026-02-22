/**
 * Playwright test for EXP-023: Rename Video Editor Title
 * Verifies that the title is "Video Editor + HTML to MP4" without EXP-XXX suffix
 */
const { chromium } = require('playwright');

async function testTitle() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-023: Title Verification Test ===\n');

    try {
        await page.goto('http://localhost:5022');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Test 1: Check <title> tag
        const pageTitle = await page.title();
        console.log(`  Page title: "${pageTitle}"`);

        if (pageTitle === 'Video Editor + HTML to MP4') {
            console.log('✓ PASS: <title> is correct');
        } else if (pageTitle.includes('EXP-')) {
            console.log('✗ FAIL: <title> still contains EXP version number');
            process.exit(1);
        } else {
            console.log('✗ FAIL: <title> is incorrect');
            process.exit(1);
        }

        // Test 2: Check <h1> heading
        const h1Text = await page.$eval('h1', el => el.textContent);
        console.log(`  H1 heading: "${h1Text}"`);

        if (h1Text === 'Video Editor + HTML to MP4') {
            console.log('✓ PASS: <h1> is correct');
        } else if (h1Text.includes('EXP-')) {
            console.log('✗ FAIL: <h1> still contains EXP version number');
            process.exit(1);
        } else {
            console.log('✗ FAIL: <h1> is incorrect');
            process.exit(1);
        }

        // Test 3: Verify no EXP-XXX in visible title elements
        const bodyText = await page.$eval('h1', el => el.textContent);
        if (!bodyText.match(/EXP-\d{3}/)) {
            console.log('✓ PASS: No EXP-XXX pattern in main heading');
        } else {
            console.log('✗ FAIL: EXP-XXX pattern found in heading');
            process.exit(1);
        }

        console.log('\n=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testTitle();
