/**
 * Playwright test for EXP-015: Real Upload Test v3
 *
 * Tests by checking DOM elements and API responses
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5021';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function testRealUpload() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-015: Real Upload Test v3 ===\n');

    try {
        // 1. Load page
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('OK: Page loaded');

        // 2. Clear any existing clips
        await page.click('#clearBtn');
        await page.waitForTimeout(500);
        console.log('OK: Cleared existing clips');

        // 3. Get video files
        const videoFiles = fs.readdirSync(UPLOADS_DIR)
            .filter(f => f.endsWith('.mp4'))
            .slice(0, 2); // Take first 2

        console.log(`Will upload: ${videoFiles.join(', ')}`);

        // 4. Upload first video
        console.log('\nUploading first video...');
        const file1Path = path.join(UPLOADS_DIR, videoFiles[0]);

        const [fileChooser1] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click('#btnUploadVideo'),
        ]);
        await fileChooser1.setFiles(file1Path);
        await page.waitForTimeout(2000);

        // Count clips by checking timeline elements
        let clipsInTimeline = await page.$$eval('#videoTrack .timeline-clip', els => els.length);
        console.log(`After first upload: ${clipsInTimeline} clips in timeline`);

        // 5. Upload second video
        console.log('Uploading second video...');
        const file2Path = path.join(UPLOADS_DIR, videoFiles[1]);

        const [fileChooser2] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click('#btnUploadVideo'),
        ]);
        await fileChooser2.setFiles(file2Path);
        await page.waitForTimeout(2000);

        clipsInTimeline = await page.$$eval('#videoTrack .timeline-clip', els => els.length);
        console.log(`After second upload: ${clipsInTimeline} clips in timeline`);

        if (clipsInTimeline < 2) {
            console.log('\nFAIL: Expected 2 clips in timeline, got ' + clipsInTimeline);
            process.exit(1);
        }

        console.log('OK: Both clips visible in timeline');

        // 6. Get clip info from timeline
        const clipWidths = await page.$$eval('#videoTrack .timeline-clip', els =>
            els.map(el => ({
                width: parseFloat(el.style.width),
                left: parseFloat(el.style.left),
                text: el.textContent?.trim()
            }))
        );
        console.log('\nClips in timeline:');
        clipWidths.forEach((c, i) => {
            console.log(`  ${i + 1}. width=${c.width}px, left=${c.left}px, text="${c.text?.substring(0, 30)}..."`);
        });

        // 7. Test Preview Full
        console.log('\nTesting Preview Full...');

        let previewPayload = null;
        page.on('request', request => {
            if (request.url().includes('/preview-full')) {
                previewPayload = JSON.parse(request.postData());
            }
        });

        // Wait for the button to be enabled
        await page.waitForFunction(() => {
            const btn = document.getElementById('previewFullBtn');
            return btn && !btn.disabled;
        });

        console.log('Preview Full button enabled, clicking...');

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/preview-full'), { timeout: 60000 }),
            page.click('#previewFullBtn'),
        ]);

        const responseData = await response.json();

        console.log(`\n/preview-full PAYLOAD ANALYSIS:`);
        console.log(`  Videos in payload: ${previewPayload?.videos?.length || 0}`);

        if (previewPayload?.videos?.length !== 2) {
            console.log(`\n  *** BUG FOUND! ***`);
            console.log(`  Expected 2 videos in payload, got ${previewPayload?.videos?.length}`);
            console.log(`  This is why preview only shows last clip!`);
        } else {
            console.log(`  OK: Payload contains both clips`);
            previewPayload.videos.forEach((v, i) => {
                console.log(`    ${i + 1}. duration=${v.duration}s, path=${v.path?.split(/[/\\]/).pop()}`);
            });
        }

        console.log(`\nPreview response: success=${responseData.success}`);
        if (responseData.success) {
            console.log(`  Duration: ${responseData.duration}s`);

            // Check if duration makes sense for 2 clips
            const totalInputDuration = previewPayload?.videos?.reduce((sum, v) => sum + (v.duration || 0), 0) || 0;
            const expectedMinDuration = totalInputDuration - 2; // Account for crossfade

            console.log(`  Total input duration: ${totalInputDuration}s`);
            console.log(`  Expected output (with crossfade): ~${expectedMinDuration}s`);

            if (responseData.duration >= expectedMinDuration - 1) {
                console.log(`  OK: Output duration suggests both clips concatenated`);
            } else {
                console.log(`  WARN: Output duration (${responseData.duration}s) much shorter than expected (${expectedMinDuration}s)`);
            }
        } else {
            console.log(`  Error: ${responseData.error}`);
        }

        // 8. Test Clear All - check for the bug
        console.log('\n\n=== Testing Clear All Bug ===');

        // Get current video src before clear
        const srcBeforeClear = await page.$eval('#videoPreview', el => el.src);
        console.log(`videoPreview.src BEFORE clear: ${srcBeforeClear ? 'HAS SRC' : 'EMPTY'}`);

        await page.click('#clearBtn');
        await page.waitForTimeout(500);

        // Check clips in timeline after clear
        clipsInTimeline = await page.$$eval('#videoTrack .timeline-clip', els => els.length);
        console.log(`Clips in timeline AFTER clear: ${clipsInTimeline}`);

        // Check videoPreview.src after clear
        const srcAfterClear = await page.$eval('#videoPreview', el => el.getAttribute('src') || el.src);
        const isDisplayed = await page.$eval('#videoPreview', el => el.style.display !== 'none');
        console.log(`videoPreview.src AFTER clear: "${srcAfterClear}"`);
        console.log(`videoPreview displayed: ${isDisplayed}`);

        // Consider it cleared if src is empty or if the video is hidden
        const isCleared = !srcAfterClear || srcAfterClear === '' || !isDisplayed;

        if (clipsInTimeline === 0 && isCleared) {
            console.log('\n  OK: Clear All works correctly');
        } else {
            console.log('\n  *** BUG FOUND! ***');
            console.log('  Clear All may not be clearing properly');
        }

        console.log('\n=== TEST COMPLETE ===');

    } catch (error) {
        console.error('Test error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testRealUpload();
