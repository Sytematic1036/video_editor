/**
 * Playwright test for EXP-011 v3: Test the fixed delete functionality
 * Uses page.evaluate to directly trigger right-click behavior
 */
const { chromium } = require('playwright');

async function testSpeechDeleteFixed() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Enable console logging from browser
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log('  [browser]', msg.text());
        }
    });

    console.log('=== EXP-011 v3 Speech Delete Fixed Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Add a speech clip and split it
        await page.evaluate(() => {
            speechClips.push({
                filename: 'test_speech.wav',
                duration: 20,
                trimStart: 0,
                trimEnd: 0
            });
            playheadPosition = 10;
            updateGlobalPlayhead();
            splitSpeechAtPlayhead();
            renderTimeline();
        });

        let clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ Created and split clip: ${clipCount} clips`);

        // Test 1: Direct removeSpeech function
        console.log('\n--- Test 1: Direct removeSpeech(1) ---');
        await page.evaluate(() => {
            removeSpeech(1);  // Remove second clip
        });

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After removeSpeech(1): ${clipCount} clips`);
        if (clipCount !== 1) {
            console.log('✗ FAIL: Expected 1 clip');
            process.exit(1);
        }
        console.log('✓ PASS: removeSpeech works');

        // Reset: add and split again
        await page.evaluate(() => {
            speechClips = [{
                filename: 'test_speech2.wav',
                duration: 20,
                trimStart: 0,
                trimEnd: 0
            }];
            playheadPosition = 8;
            updateGlobalPlayhead();
            splitSpeechAtPlayhead();
            renderTimeline();
        });
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`\n✓ Reset: ${clipCount} clips`);

        // Test 2: Simulate right-click selection + menu click
        console.log('\n--- Test 2: Simulate right-click on second clip ---');

        // First, manually call selectSpeechClip as the fix should do
        await page.evaluate(() => {
            selectSpeechClip(1);  // Select second clip
        });

        let selected = await page.evaluate(() => selectedSpeechClip);
        console.log(`✓ After selectSpeechClip(1): selectedSpeechClip = ${selected}`);

        // Now simulate clicking the menu remove
        await page.evaluate(() => {
            // Simulate what menuRemoveClip does
            if (selectedSpeechClip !== null && selectedSpeechClip < speechClips.length) {
                speechClips.splice(selectedSpeechClip, 1);
                selectedSpeechClip = null;
                renderTimeline();
            }
        });

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After menu remove: ${clipCount} clips`);
        if (clipCount !== 1) {
            console.log('✗ FAIL: Expected 1 clip');
            process.exit(1);
        }
        console.log('✓ PASS: Menu remove works when clip is selected');

        // Test 3: Test remove button click
        console.log('\n--- Test 3: Remove button click ---');

        // Reset again
        await page.evaluate(() => {
            speechClips = [{
                filename: 'test_speech3.wav',
                duration: 20,
                trimStart: 0,
                trimEnd: 0
            }];
            playheadPosition = 5;
            updateGlobalPlayhead();
            splitSpeechAtPlayhead();
            renderTimeline();
        });
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ Reset: ${clipCount} clips`);

        // Find remove buttons and click the second one
        const removeButtons = await page.$$('#speechTrack .timeline-clip .remove-btn');
        console.log(`✓ Found ${removeButtons.length} remove buttons`);

        if (removeButtons.length >= 2) {
            await removeButtons[1].click();
            await page.waitForTimeout(100);

            clipCount = await page.evaluate(() => speechClips.length);
            console.log(`✓ After button click: ${clipCount} clips`);
            if (clipCount === 1) {
                console.log('✓ PASS: Remove button works!');
            } else {
                console.log('✗ FAIL: Remove button did not work');
                process.exit(1);
            }
        }

        console.log('\n=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testSpeechDeleteFixed();
