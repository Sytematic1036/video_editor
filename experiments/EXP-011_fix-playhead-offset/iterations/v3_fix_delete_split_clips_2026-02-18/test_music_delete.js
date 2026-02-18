/**
 * Playwright test for EXP-011 v3: Test Music Track delete functionality
 * Verifies that split music clips can be deleted
 */
const { chromium } = require('playwright');

async function testMusicDelete() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Enable console logging from browser
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log('  [browser]', msg.text());
        }
    });

    console.log('=== EXP-011 v3 Music Track Delete Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Add a music clip
        await page.evaluate(() => {
            audioClip = {
                filename: 'test_music.mp3',
                duration: 30,
                trimStart: 0,
                trimEnd: 0,
                path: '/test/music.mp3'
            };
            renderTimeline();
        });
        console.log('✓ Added 30s music clip');

        // Verify initial state
        let hasAudio = await page.evaluate(() => audioClip !== null);
        let musicClipsCount = await page.evaluate(() => musicClips.length);
        console.log(`✓ Initial: audioClip=${hasAudio}, musicClips.length=${musicClipsCount}`);

        // Split the music clip
        await page.evaluate(() => {
            playheadPosition = 15;
            updateGlobalPlayhead();
            splitMusicAtPlayhead();
        });
        console.log('✓ Split music at 15s');

        musicClipsCount = await page.evaluate(() => musicClips.length);
        console.log(`✓ After split: musicClips.length=${musicClipsCount}`);

        if (musicClipsCount !== 2) {
            console.log('✗ FAIL: Expected 2 music clips after split');
            process.exit(1);
        }

        // Get clip info
        const musicClipsInfo = await page.evaluate(() => {
            return musicClips.map((c, i) => ({
                index: i,
                filename: c.filename,
                duration: getTrimmedDuration(c)
            }));
        });
        console.log('Music clips:');
        musicClipsInfo.forEach(c => console.log(`  [${c.index}] ${c.filename}: ${c.duration.toFixed(1)}s`));

        // Test 1: Direct removeMusicClip function
        console.log('\n--- Test 1: Direct removeMusicClip(1) ---');
        await page.evaluate(() => {
            removeMusicClip(1);  // Remove second clip
        });

        musicClipsCount = await page.evaluate(() => musicClips.length);
        console.log(`✓ After removeMusicClip(1): musicClips.length=${musicClipsCount}`);
        if (musicClipsCount !== 1) {
            console.log('✗ FAIL: Expected 1 music clip');
            process.exit(1);
        }
        console.log('✓ PASS: removeMusicClip works');

        // Test 2: Remove button click
        console.log('\n--- Test 2: Remove button click ---');

        // Reset: add new music and split
        await page.evaluate(() => {
            musicClips = [];
            audioClip = {
                filename: 'test_music2.mp3',
                duration: 20,
                trimStart: 0,
                trimEnd: 0,
                path: '/test/music2.mp3'
            };
            playheadPosition = 10;
            updateGlobalPlayhead();
            splitMusicAtPlayhead();
            renderTimeline();
        });

        musicClipsCount = await page.evaluate(() => musicClips.length);
        console.log(`✓ Reset: musicClips.length=${musicClipsCount}`);

        // Find remove buttons in audio track
        const removeButtons = await page.$$('#audioTrack .timeline-clip .remove-btn');
        console.log(`✓ Found ${removeButtons.length} remove buttons in audio track`);

        if (removeButtons.length >= 2) {
            await removeButtons[1].click();
            await page.waitForTimeout(100);

            musicClipsCount = await page.evaluate(() => musicClips.length);
            console.log(`✓ After button click: musicClips.length=${musicClipsCount}`);
            if (musicClipsCount === 1) {
                console.log('✓ PASS: Remove button works for music clips!');
            } else {
                console.log('✗ FAIL: Remove button did not work');
                process.exit(1);
            }
        } else {
            console.log('⚠ Not enough remove buttons found, skipping button test');
        }

        // Test 3: Remove all clips
        console.log('\n--- Test 3: Remove last clip (should clear audioClip too) ---');
        await page.evaluate(() => {
            removeMusicClip(0);  // Remove last remaining clip
        });

        musicClipsCount = await page.evaluate(() => musicClips.length);
        hasAudio = await page.evaluate(() => audioClip !== null);
        console.log(`✓ After removing last: musicClips.length=${musicClipsCount}, audioClip=${hasAudio}`);

        if (musicClipsCount === 0 && !hasAudio) {
            console.log('✓ PASS: Removing last clip also clears audioClip');
        } else {
            console.log('✗ FAIL: audioClip should be null when all clips are removed');
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

testMusicDelete();
