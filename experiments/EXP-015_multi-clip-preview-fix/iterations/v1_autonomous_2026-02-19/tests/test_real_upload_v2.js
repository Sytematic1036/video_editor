/**
 * Playwright test for EXP-015: Real Upload Test v2
 *
 * Uses fileChooser to handle dynamic file input
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5021';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function testRealUpload() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-015: Real Upload Test v2 ===\n');

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

        // 4. Upload first video using fileChooser
        console.log('\nUploading first video...');
        const file1Path = path.join(UPLOADS_DIR, videoFiles[0]);

        // Wait for file chooser when clicking upload button
        const [fileChooser1] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click('#btnUploadVideo'),
        ]);
        await fileChooser1.setFiles(file1Path);
        await page.waitForTimeout(2000);

        // Check videoClips count
        let clipsCount = await page.evaluate(() => window.videoClips.length);
        console.log(`After first upload: ${clipsCount} clips`);

        // 5. Upload second video
        console.log('Uploading second video...');
        const file2Path = path.join(UPLOADS_DIR, videoFiles[1]);

        const [fileChooser2] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click('#btnUploadVideo'),
        ]);
        await fileChooser2.setFiles(file2Path);
        await page.waitForTimeout(2000);

        clipsCount = await page.evaluate(() => window.videoClips.length);
        console.log(`After second upload: ${clipsCount} clips`);

        // 6. Verify both clips are in the array
        const clipDetails = await page.evaluate(() => {
            return window.videoClips.map(c => ({
                filename: c.filename,
                duration: c.duration,
                path: c.path,
            }));
        });

        console.log('\nClips in videoClips array:');
        clipDetails.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.filename} (${c.duration}s)`);
        });

        if (clipDetails.length < 2) {
            console.log('\nFAIL: Expected 2 clips, got ' + clipDetails.length);
            console.log('BUG FOUND: Multiple uploads not working correctly!');
            await browser.close();
            process.exit(1);
        }

        console.log('\nOK: Both clips uploaded successfully');

        // 7. Test Preview Full button
        console.log('\nTesting Preview Full...');

        // Intercept the API call
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

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/preview-full')),
            page.click('#previewFullBtn'),
        ]);

        const responseData = await response.json();

        console.log(`\n/preview-full payload:`);
        console.log(`  Videos sent: ${previewPayload?.videos?.length || 0}`);
        previewPayload?.videos?.forEach((v, i) => {
            console.log(`    ${i + 1}. ${v.path?.split(/[/\\]/).pop() || v.path}`);
        });

        console.log(`\nPreview response: success=${responseData.success}`);
        if (responseData.success) {
            console.log(`  Duration: ${responseData.duration}s`);
            console.log(`  Preview URL: ${responseData.preview_url}`);

            // Calculate expected duration (both clips minus crossfade)
            const expectedMinDuration = clipDetails[0].duration + clipDetails[1].duration - 2; // -2 for crossfade
            console.log(`\n  Expected min duration: ~${expectedMinDuration}s`);
            console.log(`  Actual duration: ${responseData.duration}s`);

            if (responseData.duration >= expectedMinDuration - 1) {
                console.log('\n  OK: Duration suggests both clips were concatenated!');
            } else {
                console.log('\n  WARN: Duration seems too short - might only have one clip');
                console.log('  BUG POSSIBLE: Check if only last clip was used');
            }
        } else {
            console.log(`  Error: ${responseData.error}`);
        }

        // 8. Test Clear All
        console.log('\n\n=== Testing Clear All ===');

        await page.click('#clearBtn');
        await page.waitForTimeout(500);

        clipsCount = await page.evaluate(() => window.videoClips.length);
        console.log(`After Clear All: videoClips.length = ${clipsCount}`);

        const videoSrc = await page.evaluate(() => document.getElementById('videoPreview').src);
        console.log(`videoPreview.src after clear: ${videoSrc ? 'HAS SRC' : 'EMPTY'}`);

        if (clipsCount === 0 && !videoSrc) {
            console.log('OK: Clear All works correctly');
        } else if (clipsCount === 0 && videoSrc) {
            console.log('BUG FOUND: Clear All clears arrays but NOT videoPreview.src!');
            console.log('This is why preview still plays after clear.');
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
