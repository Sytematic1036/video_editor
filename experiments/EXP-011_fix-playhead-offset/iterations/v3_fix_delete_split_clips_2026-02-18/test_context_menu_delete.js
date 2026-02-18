/**
 * Playwright test for EXP-011 v3: Test context menu delete for split clips
 * Verifies that the right-click context menu can delete split clips
 */
const { chromium } = require('playwright');

async function testContextMenuDelete() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-011 v3 Context Menu Delete Test ===\n');

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

        // Test 1: Select a clip by clicking on it, then use context menu
        console.log('\n--- Test 1: Click to select, then context menu ---');

        // Get the second clip element
        const clips = await page.$$('#speechTrack .timeline-clip');
        console.log(`✓ Found ${clips.length} clip elements in DOM`);

        if (clips.length < 2) {
            console.log('✗ FAIL: Expected 2 clip elements');
            process.exit(1);
        }

        // Click on second clip to select it
        await clips[1].click();
        await page.waitForTimeout(100);

        // Check if selectedSpeechClip is set
        const selectedIndex = await page.evaluate(() => selectedSpeechClip);
        console.log(`✓ selectedSpeechClip = ${selectedIndex}`);

        if (selectedIndex !== 1) {
            console.log(`✗ FAIL: Expected selectedSpeechClip=1, got ${selectedIndex}`);
            // This could be the bug!
        }

        // Now right-click to open context menu
        await clips[1].click({ button: 'right' });
        await page.waitForTimeout(100);

        // Check if context menu is visible
        const menuVisible = await page.evaluate(() => {
            const menu = document.getElementById('contextMenu');
            return menu && menu.classList.contains('visible');
        });
        console.log(`✓ Context menu visible: ${menuVisible}`);

        // Click "Remove Clip" in context menu
        const removeMenuItem = await page.$('#menuRemoveClip');
        if (removeMenuItem) {
            await removeMenuItem.click();
            await page.waitForTimeout(100);

            clipCount = await page.evaluate(() => speechClips.length);
            console.log(`✓ After context menu delete: ${clipCount} clips`);

            if (clipCount === 1) {
                console.log('✓ PASS: Context menu delete works!');
            } else {
                console.log(`✗ FAIL: Expected 1 clip, got ${clipCount}`);

                // Debug info
                const debugInfo = await page.evaluate(() => ({
                    selectedSpeechClip,
                    speechClipsLength: speechClips.length,
                    clips: speechClips.map((c, i) => ({ index: i, filename: c.filename }))
                }));
                console.log('Debug:', JSON.stringify(debugInfo, null, 2));
            }
        } else {
            console.log('✗ FAIL: Could not find menuRemoveClip element');
        }

        // Test 2: Test Music Track delete
        console.log('\n--- Test 2: Music Track delete ---');

        // Check if there's a musicClips array or audioClip
        const hasMusicSystem = await page.evaluate(() => {
            return typeof musicClips !== 'undefined' || typeof audioClip !== 'undefined';
        });
        console.log(`✓ Music system exists: ${hasMusicSystem}`);

        // Add music clip if possible
        const addedMusic = await page.evaluate(() => {
            if (typeof audioClip !== 'undefined') {
                audioClip = {
                    filename: 'test_music.mp3',
                    duration: 30,
                    trimStart: 0,
                    trimEnd: 0,
                    path: '/test/music.mp3'
                };
                renderTimeline();
                return true;
            }
            return false;
        });

        if (addedMusic) {
            console.log('✓ Added music clip');

            // Check if music track has a remove button
            const musicRemoveBtn = await page.$('#musicTrack .remove-btn');
            if (musicRemoveBtn) {
                console.log('✓ Found music remove button');
                await musicRemoveBtn.click();
                await page.waitForTimeout(100);

                const musicRemoved = await page.evaluate(() => audioClip === null);
                console.log(`✓ Music removed: ${musicRemoved}`);
            } else {
                console.log('⚠ No remove button found on music track');
            }
        }

        console.log('\n=== TEST COMPLETE ===');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testContextMenuDelete();
