/**
 * Playwright tests for EXP-026: Audio Source Radio Buttons
 *
 * Tests:
 * 1. Radio buttons render correctly
 * 2. Radio button selection works
 * 3. Default selection is "Ljud från Video Editor"
 * 4. Visual selection state updates
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5022';

async function runTests() {
    console.log('Starting Playwright tests for EXP-026...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    // Helper function for test results
    function logResult(testName, success, error = null) {
        if (success) {
            console.log(`  ✅ ${testName}`);
            passed++;
        } else {
            console.log(`  ❌ ${testName}`);
            if (error) console.log(`     Error: ${error}`);
            failed++;
        }
    }

    try {
        // Navigate to the page
        console.log('Navigating to Video Editor...');
        await page.goto(BASE_URL, { timeout: 10000 });
        await page.waitForLoadState('domcontentloaded');

        // Make sure we're on the Video Editor tab
        const videoEditorTab = page.locator('.main-tab-btn[data-tab="video-editor"]');
        await videoEditorTab.click();
        await page.waitForTimeout(500);

        console.log('\n--- Test 1: Radio buttons render ---');
        {
            const radioButtons = page.locator('input[name="audioSource"]');
            const count = await radioButtons.count();
            logResult('3 radio buttons exist', count === 3, count !== 3 ? `Found ${count} buttons` : null);
        }

        console.log('\n--- Test 2: Radio button labels ---');
        {
            const videoRadio = page.locator('#audioSourceVideo');
            const editorRadio = page.locator('#audioSourceEditor');
            const noneRadio = page.locator('#audioSourceNone');

            const videoExists = await videoRadio.count() === 1;
            const editorExists = await editorRadio.count() === 1;
            const noneExists = await noneRadio.count() === 1;

            logResult('audioSourceVideo exists', videoExists);
            logResult('audioSourceEditor exists', editorExists);
            logResult('audioSourceNone exists', noneExists);
        }

        console.log('\n--- Test 3: Default selection ---');
        {
            const editorRadio = page.locator('#audioSourceEditor');
            const isChecked = await editorRadio.isChecked();
            logResult('audioSourceEditor is default checked', isChecked);
        }

        console.log('\n--- Test 4: Selection changes ---');
        {
            // Click on "Ljud från Video"
            const videoOption = page.locator('.audio-source-option:has(#audioSourceVideo)');
            await videoOption.click();
            await page.waitForTimeout(200);

            const videoRadio = page.locator('#audioSourceVideo');
            const isVideoChecked = await videoRadio.isChecked();
            logResult('Can select "Ljud från Video"', isVideoChecked);

            // Click on "Inget ljud"
            const noneOption = page.locator('.audio-source-option:has(#audioSourceNone)');
            await noneOption.click();
            await page.waitForTimeout(200);

            const noneRadio = page.locator('#audioSourceNone');
            const isNoneChecked = await noneRadio.isChecked();
            logResult('Can select "Inget ljud"', isNoneChecked);

            // Click back to "Ljud från Video Editor"
            const editorOption = page.locator('.audio-source-option:has(#audioSourceEditor)');
            await editorOption.click();
            await page.waitForTimeout(200);

            const editorRadio = page.locator('#audioSourceEditor');
            const isEditorChecked = await editorRadio.isChecked();
            logResult('Can select "Ljud från Video Editor"', isEditorChecked);
        }

        console.log('\n--- Test 5: Visual selection state ---');
        {
            // Select "Ljud från Video" and check for .selected class
            const videoOption = page.locator('.audio-source-option:has(#audioSourceVideo)');
            await videoOption.click();
            await page.waitForTimeout(200);

            const hasSelected = await videoOption.evaluate(el => el.classList.contains('selected'));
            logResult('Selected option has .selected class', hasSelected);

            // Check other options don't have .selected
            const editorOption = page.locator('.audio-source-option:has(#audioSourceEditor)');
            const editorHasSelected = await editorOption.evaluate(el => el.classList.contains('selected'));
            logResult('Non-selected options do not have .selected class', !editorHasSelected);
        }

        console.log('\n--- Test 6: Audio source group visibility ---');
        {
            const audioSourceGroup = page.locator('.audio-source-group');
            const isVisible = await audioSourceGroup.isVisible();
            logResult('Audio source group is visible', isVisible);

            const header = page.locator('.audio-source-group h4');
            const headerText = await header.textContent();
            logResult('Header text is correct', headerText.includes('Audio Source'));
        }

    } catch (error) {
        console.error('\nTest execution error:', error.message);
        failed++;
    } finally {
        await browser.close();
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    // Exit with error code if any tests failed
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
