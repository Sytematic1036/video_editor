/**
 * Playwright test for EXP-015: Real Upload Test
 *
 * Actually uploads files and tests the preview
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5021';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function testRealUpload() {
    const browser = await chromium.launch({ headless: false }); // Show browser for debugging
    const page = await browser.newPage();

    console.log('=== EXP-015: Real Upload Test ===\n');

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
        const fileInput = await page.$('#fileInput');

        // Set files using setInputFiles
        const file1Path = path.join(UPLOADS_DIR, videoFiles[0]);
        await page.setInputFiles('#fileInput', file1Path);
        await page.waitForTimeout(1500);

        // Check videoClips count
        let clipsCount = await page.evaluate(() => window.videoClips.length);
        console.log(`After first upload: ${clipsCount} clips`);

        // 5. Upload second video
        console.log('Uploading second video...');
        const file2Path = path.join(UPLOADS_DIR, videoFiles[1]);
        await page.setInputFiles('#fileInput', file2Path);
        await page.waitForTimeout(1500);

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

        // 7. Click Preview Full
        console.log('\nClicking Preview Full...');
        await page.waitForSelector('#previewFullBtn:not([disabled])');

        // Intercept the API call to see what's sent
        page.on('request', request => {
            if (request.url().includes('/preview-full')) {
                const postData = JSON.parse(request.postData());
                console.log(`\n/preview-full payload has ${postData.videos?.length || 0} videos:`);
                postData.videos?.forEach((v, i) => {
                    console.log(`  ${i + 1}. ${v.path?.split('/').pop()}`);
                });
            }
        });

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/preview-full')),
            page.click('#previewFullBtn'),
        ]);

        const responseData = await response.json();
        console.log(`\nPreview response: success=${responseData.success}, duration=${responseData.duration}s`);

        if (responseData.error) {
            console.log(`Error: ${responseData.error}`);
        }

        // 8. Check the preview video
        await page.waitForTimeout(2000);
        const videoSrc = await page.evaluate(() => document.getElementById('videoPreview').src);
        console.log(`Preview video src: ${videoSrc}`);

        console.log('\n=== TEST COMPLETE ===');

        // Keep browser open for manual inspection
        console.log('Browser will close in 5 seconds...');
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('Test error:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
    }
}

testRealUpload();
