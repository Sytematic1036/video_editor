/**
 * Playwright test for EXP-012: Volume Controls
 * Tests that speech and music volume sliders exist and work correctly
 */
const { chromium } = require('playwright');

async function testVolumeControls() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-012 Volume Controls Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Test 1: Speech Volume slider exists
        console.log('\n--- Test 1: Speech Volume slider exists ---');
        const speechSlider = await page.$('#speechVolumeSlider');
        if (!speechSlider) {
            console.log('✗ FAIL: Speech volume slider not found');
            process.exit(1);
        }
        console.log('✓ PASS: Speech volume slider exists');

        // Test 2: Music Volume slider exists
        console.log('\n--- Test 2: Music Volume slider exists ---');
        const musicSlider = await page.$('#musicVolumeSlider');
        if (!musicSlider) {
            console.log('✗ FAIL: Music volume slider not found');
            process.exit(1);
        }
        console.log('✓ PASS: Music volume slider exists');

        // Test 3: Speech Volume display exists
        console.log('\n--- Test 3: Speech Volume display exists ---');
        const speechDisplay = await page.$('#speechVolumeDisplay');
        if (!speechDisplay) {
            console.log('✗ FAIL: Speech volume display not found');
            process.exit(1);
        }
        const speechDisplayText = await speechDisplay.textContent();
        console.log(`✓ Speech volume display: "${speechDisplayText}"`);
        console.log('✓ PASS: Speech volume display exists');

        // Test 4: Music Volume display exists
        console.log('\n--- Test 4: Music Volume display exists ---');
        const musicDisplay = await page.$('#musicVolumeDisplay');
        if (!musicDisplay) {
            console.log('✗ FAIL: Music volume display not found');
            process.exit(1);
        }
        const musicDisplayText = await musicDisplay.textContent();
        console.log(`✓ Music volume display: "${musicDisplayText}"`);
        console.log('✓ PASS: Music volume display exists');

        // Test 5: Default values are correct
        console.log('\n--- Test 5: Default values ---');
        const speechValue = await page.$eval('#speechVolumeSlider', el => el.value);
        const musicValue = await page.$eval('#musicVolumeSlider', el => el.value);
        console.log(`✓ Speech slider value: ${speechValue}`);
        console.log(`✓ Music slider value: ${musicValue}`);

        if (speechValue !== '100') {
            console.log(`✗ FAIL: Expected speech default 100, got ${speechValue}`);
            process.exit(1);
        }
        if (musicValue !== '50') {
            console.log(`✗ FAIL: Expected music default 50, got ${musicValue}`);
            process.exit(1);
        }
        console.log('✓ PASS: Default values correct');

        // Test 6: Speech slider can be changed
        console.log('\n--- Test 6: Speech slider can be changed ---');
        await page.fill('#speechVolumeSlider', '150');
        await page.waitForTimeout(100);
        const newSpeechValue = await page.$eval('#speechVolumeSlider', el => el.value);
        const newSpeechDisplay = await page.$eval('#speechVolumeDisplay', el => el.textContent);
        console.log(`✓ After change: slider=${newSpeechValue}, display="${newSpeechDisplay}"`);

        if (newSpeechValue !== '150') {
            console.log('✗ FAIL: Speech slider value did not change');
            process.exit(1);
        }
        console.log('✓ PASS: Speech slider can be changed');

        // Test 7: Music slider can be changed
        console.log('\n--- Test 7: Music slider can be changed ---');
        await page.fill('#musicVolumeSlider', '25');
        await page.waitForTimeout(100);
        const newMusicValue = await page.$eval('#musicVolumeSlider', el => el.value);
        const newMusicDisplay = await page.$eval('#musicVolumeDisplay', el => el.textContent);
        console.log(`✓ After change: slider=${newMusicValue}, display="${newMusicDisplay}"`);

        if (newMusicValue !== '25') {
            console.log('✗ FAIL: Music slider value did not change');
            process.exit(1);
        }
        console.log('✓ PASS: Music slider can be changed');

        // Test 8: Volume variables are accessible in JavaScript
        console.log('\n--- Test 8: JavaScript variables ---');
        const jsVars = await page.evaluate(() => {
            return {
                speechVolume: typeof speechVolume !== 'undefined' ? speechVolume : null,
                musicVolume: typeof musicVolume !== 'undefined' ? musicVolume : null,
                getSpeechVolumeDecimal: typeof getSpeechVolumeDecimal !== 'undefined' ? getSpeechVolumeDecimal() : null,
                getMusicVolumeDecimal: typeof getMusicVolumeDecimal !== 'undefined' ? getMusicVolumeDecimal() : null,
            };
        });
        console.log(`✓ speechVolume: ${jsVars.speechVolume}`);
        console.log(`✓ musicVolume: ${jsVars.musicVolume}`);
        console.log(`✓ getSpeechVolumeDecimal(): ${jsVars.getSpeechVolumeDecimal}`);
        console.log(`✓ getMusicVolumeDecimal(): ${jsVars.getMusicVolumeDecimal}`);

        if (jsVars.speechVolume === null || jsVars.musicVolume === null) {
            console.log('✗ FAIL: JavaScript volume variables not defined');
            process.exit(1);
        }
        console.log('✓ PASS: JavaScript volume variables accessible');

        // Test 9: Slider input event updates JavaScript variables
        console.log('\n--- Test 9: Slider input event updates variables ---');
        // Trigger input event by moving slider
        await page.evaluate(() => {
            const slider = document.getElementById('speechVolumeSlider');
            slider.value = '75';
            slider.dispatchEvent(new Event('input'));
        });
        await page.waitForTimeout(100);

        const updatedSpeechVolume = await page.evaluate(() => speechVolume);
        console.log(`✓ After slider change, speechVolume = ${updatedSpeechVolume}`);

        if (updatedSpeechVolume !== 75) {
            console.log(`✗ FAIL: Expected speechVolume=75, got ${updatedSpeechVolume}`);
            process.exit(1);
        }
        console.log('✓ PASS: Slider input updates JavaScript variable');

        // Test 10: Volume range is 0-200
        console.log('\n--- Test 10: Volume range is 0-200 ---');
        const speechMin = await page.$eval('#speechVolumeSlider', el => el.min);
        const speechMax = await page.$eval('#speechVolumeSlider', el => el.max);
        const musicMin = await page.$eval('#musicVolumeSlider', el => el.min);
        const musicMax = await page.$eval('#musicVolumeSlider', el => el.max);
        console.log(`✓ Speech range: ${speechMin}-${speechMax}`);
        console.log(`✓ Music range: ${musicMin}-${musicMax}`);

        if (speechMin !== '0' || speechMax !== '200' || musicMin !== '0' || musicMax !== '200') {
            console.log('✗ FAIL: Volume range should be 0-200');
            process.exit(1);
        }
        console.log('✓ PASS: Volume range is 0-200');

        console.log('\n=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testVolumeControls();
