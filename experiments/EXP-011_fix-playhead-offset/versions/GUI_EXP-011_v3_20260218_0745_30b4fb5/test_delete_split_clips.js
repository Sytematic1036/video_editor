/**
 * Playwright test for EXP-011 v3: Test delete functionality for split clips
 * Verifies that split clips can be deleted from Speech Track and Music Track
 */
const { chromium } = require('playwright');

async function testDeleteSplitClips() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-011 v3 Delete Split Clips Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Add a speech clip (20s duration)
        await page.evaluate(() => {
            speechClips.push({
                filename: 'test_speech.wav',
                duration: 20,
                trimStart: 0,
                trimEnd: 0
            });
            renderTimeline();
        });
        console.log('✓ Added 20s speech clip');

        // Verify initial state: 1 clip
        let clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ Initial clip count: ${clipCount}`);
        if (clipCount !== 1) {
            console.log('✗ FAIL: Expected 1 clip initially');
            process.exit(1);
        }

        // Set playhead to 10 seconds and split
        await page.evaluate(() => {
            playheadPosition = 10;
            updateGlobalPlayhead();
            splitSpeechAtPlayhead();
        });
        console.log('✓ Split speech at 10s');

        // Verify we now have 2 clips
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After split: ${clipCount} clips`);
        if (clipCount !== 2) {
            console.log('✗ FAIL: Expected 2 clips after split');
            process.exit(1);
        }

        // Get clip info before delete
        const clipsBeforeDelete = await page.evaluate(() => {
            return speechClips.map((c, i) => ({
                index: i,
                filename: c.filename,
                duration: c.duration,
                trimStart: c.trimStart,
                trimEnd: c.trimEnd,
                trimmedDuration: getTrimmedDuration(c)
            }));
        });
        console.log('\n=== Clips before delete ===');
        clipsBeforeDelete.forEach((c, i) => {
            console.log(`  Clip ${i}: ${c.trimmedDuration.toFixed(2)}s (trimStart=${c.trimStart}, trimEnd=${c.trimEnd})`);
        });

        // Try to delete the second clip (index 1) using removeSpeech
        console.log('\n--- Attempting to delete clip at index 1 ---');

        const deleteResult = await page.evaluate(() => {
            try {
                const beforeCount = speechClips.length;
                removeSpeech(1);  // Delete second clip
                const afterCount = speechClips.length;
                return {
                    success: true,
                    beforeCount,
                    afterCount,
                    deleted: beforeCount - afterCount
                };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });

        if (!deleteResult.success) {
            console.log(`✗ FAIL: Delete threw error: ${deleteResult.error}`);
            process.exit(1);
        }

        console.log(`✓ Delete executed: ${deleteResult.beforeCount} -> ${deleteResult.afterCount} clips`);

        if (deleteResult.deleted !== 1) {
            console.log(`✗ FAIL: Expected to delete 1 clip, but deleted ${deleteResult.deleted}`);
            process.exit(1);
        }

        // Verify remaining clip
        const remainingClips = await page.evaluate(() => {
            return speechClips.map((c, i) => ({
                index: i,
                trimmedDuration: getTrimmedDuration(c)
            }));
        });

        console.log('\n=== Clips after delete ===');
        remainingClips.forEach((c) => {
            console.log(`  Clip ${c.index}: ${c.trimmedDuration.toFixed(2)}s`);
        });

        if (remainingClips.length !== 1) {
            console.log('✗ FAIL: Expected 1 clip remaining');
            process.exit(1);
        }

        console.log('✓ PASS: Delete function works on split clips');

        // Now test the remove button click
        console.log('\n--- Testing remove button click ---');

        // Add clips again
        await page.evaluate(() => {
            speechClips = [];
            speechClips.push({
                filename: 'test_speech2.wav',
                duration: 20,
                trimStart: 0,
                trimEnd: 0
            });
            playheadPosition = 8;
            updateGlobalPlayhead();
            splitSpeechAtPlayhead();
            renderTimeline();
        });

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After new split: ${clipCount} clips`);

        // Find and click the remove button on the second clip
        const removeButtons = await page.$$('#speechTrack .timeline-clip .remove-btn');
        console.log(`✓ Found ${removeButtons.length} remove buttons`);

        if (removeButtons.length >= 2) {
            // Click the second remove button
            await removeButtons[1].click();
            await page.waitForTimeout(100);

            clipCount = await page.evaluate(() => speechClips.length);
            console.log(`✓ After button click: ${clipCount} clips`);

            if (clipCount === 1) {
                console.log('✓ PASS: Remove button works on split clips!');
            } else {
                console.log(`✗ FAIL: Expected 1 clip after button click, got ${clipCount}`);

                // Debug: check what clips remain
                const debugClips = await page.evaluate(() => speechClips);
                console.log('Remaining clips:', JSON.stringify(debugClips, null, 2));
                process.exit(1);
            }
        } else {
            console.log('✗ FAIL: Not enough remove buttons found');
            process.exit(1);
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

testDeleteSplitClips();
