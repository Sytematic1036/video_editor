/**
 * Playwright test for EXP-011 v2: Verify split happens at correct playhead position
 * Tests that when we split a clip, it splits at the visual playhead position
 */
const { chromium } = require('playwright');

async function testSplitAlignment() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-011 v2 Split Alignment Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Add a speech clip
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

        // Set playhead to 8 seconds
        const targetTime = 8;
        await page.evaluate((t) => {
            playheadPosition = t;
            updateGlobalPlayhead();
        }, targetTime);
        console.log(`✓ Set playhead to ${targetTime}s`);

        // Get the playhead visual position
        const playheadLeft = await page.evaluate(() => {
            return parseFloat(document.getElementById('globalPlayhead').style.left);
        });
        console.log(`✓ Playhead visual left: ${playheadLeft}px`);

        // The clip should be rendered starting at 0px relative to track
        // With 20px container padding, playhead at 8s should be at:
        // 8 * 20 + 20 = 180px from timeline-wrapper left
        const expectedPlayheadLeft = targetTime * 20 + 20;
        console.log(`✓ Expected playhead left: ${expectedPlayheadLeft}px`);

        if (Math.abs(playheadLeft - expectedPlayheadLeft) < 1) {
            console.log('✓ PASS: Playhead position correct');
        } else {
            console.log(`✗ FAIL: Playhead position incorrect (got ${playheadLeft}, expected ${expectedPlayheadLeft})`);
        }

        // Now split the speech clip
        await page.evaluate(() => {
            splitSpeechAtPlayhead();
        });
        console.log('✓ Split speech at playhead');

        // Check the resulting clips
        const clips = await page.evaluate(() => {
            return speechClips.map(c => ({
                filename: c.filename,
                duration: c.duration,
                trimStart: c.trimStart,
                trimEnd: c.trimEnd,
                trimmedDuration: getTrimmedDuration(c)
            }));
        });

        console.log('\n=== Resulting clips after split ===');
        clips.forEach((c, i) => {
            console.log(`Clip ${i}: trimmedDuration=${c.trimmedDuration.toFixed(2)}s`);
        });

        // First clip should have trimmed duration = playheadPosition = 8s
        const firstClipDuration = clips[0].trimmedDuration;
        console.log(`\n✓ First clip duration: ${firstClipDuration.toFixed(2)}s (expected: ${targetTime}s)`);

        if (Math.abs(firstClipDuration - targetTime) < 0.01) {
            console.log('✓ PASS: Split happened at correct position!');
        } else {
            console.log(`✗ FAIL: Split at wrong position (expected ${targetTime}s, got ${firstClipDuration.toFixed(2)}s)`);
            console.log(`   Offset: ${(firstClipDuration - targetTime).toFixed(2)}s`);
        }

        // Verify second clip
        if (clips.length === 2) {
            const secondClipDuration = clips[1].trimmedDuration;
            const expectedSecond = 20 - targetTime; // 12s
            console.log(`✓ Second clip duration: ${secondClipDuration.toFixed(2)}s (expected: ${expectedSecond}s)`);

            if (Math.abs(secondClipDuration - expectedSecond) < 0.01) {
                console.log('✓ PASS: Second clip duration correct!');
            } else {
                console.log('✗ FAIL: Second clip duration incorrect');
            }
        }

        console.log('\n=== TEST COMPLETE ===');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testSplitAlignment();
