/**
 * Debug test: Investigate why preview only shows first clip duration
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5021';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function debugPreview() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== DEBUG: Preview Issue ===\n');

    // Capture all console logs from the page
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Clear first
        await page.click('#clearBtn');
        await page.waitForTimeout(500);

        // Get 2 different video files
        const videoFiles = fs.readdirSync(UPLOADS_DIR)
            .filter(f => f.endsWith('.mp4'))
            .slice(0, 2);

        console.log('Uploading files:');
        const clipDurations = [];

        for (let i = 0; i < videoFiles.length; i++) {
            const filename = videoFiles[i];
            const filePath = path.join(UPLOADS_DIR, filename);

            console.log(`  ${i + 1}. ${filename}`);

            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser'),
                page.click('#btnUploadVideo'),
            ]);
            await fileChooser.setFiles(filePath);
            await page.waitForTimeout(2000);

            // Get the duration of the clip just added
            const lastClipDuration = await page.evaluate(() => {
                const clips = document.querySelectorAll('#videoTrack .timeline-clip');
                const lastClip = clips[clips.length - 1];
                // Try to get duration from data attribute or computed
                return lastClip?.textContent?.match(/(\d+\.?\d*)s/)?.[1] || null;
            });
            clipDurations.push(lastClipDuration);
        }

        console.log(`\nClip durations: ${clipDurations.join(', ')}`);

        // Check the actual videoClips array state by examining the timeline
        const timelineInfo = await page.evaluate(() => {
            const clips = document.querySelectorAll('#videoTrack .timeline-clip');
            return Array.from(clips).map((el, i) => ({
                index: i,
                width: el.style.width,
                left: el.style.left,
                text: el.textContent?.trim().substring(0, 50),
            }));
        });

        console.log('\nTimeline clips:');
        timelineInfo.forEach(c => {
            console.log(`  ${c.index}: width=${c.width}, left=${c.left}`);
        });

        // Now capture the preview-full request in detail
        let requestPayload = null;
        let responseData = null;

        page.on('request', request => {
            if (request.url().includes('/preview-full')) {
                requestPayload = JSON.parse(request.postData());
                console.log('\n=== REQUEST TO /preview-full ===');
                console.log(`Videos in payload: ${requestPayload.videos?.length}`);
                requestPayload.videos?.forEach((v, i) => {
                    console.log(`  Video ${i + 1}:`);
                    console.log(`    path: ${v.path}`);
                    console.log(`    duration: ${v.duration}s`);
                    console.log(`    trimStart: ${v.trimStart}, trimEnd: ${v.trimEnd}`);
                });
            }
        });

        // Click preview
        await page.waitForFunction(() => !document.getElementById('previewFullBtn').disabled);

        console.log('\nClicking Preview Full...');

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/preview-full'), { timeout: 120000 }),
            page.click('#previewFullBtn'),
        ]);

        responseData = await response.json();

        console.log('\n=== RESPONSE FROM /preview-full ===');
        console.log(`Success: ${responseData.success}`);
        console.log(`Duration: ${responseData.duration}s`);
        console.log(`Preview URL: ${responseData.preview_url}`);
        if (responseData.error) {
            console.log(`Error: ${responseData.error}`);
        }

        // Calculate expected duration
        if (requestPayload?.videos) {
            const totalInput = requestPayload.videos.reduce((sum, v) => {
                const trimmed = v.duration - (v.trimStart || 0) - (v.trimEnd || 0);
                return sum + trimmed;
            }, 0);
            const crossfade = parseFloat(await page.$eval('#crossfadeDuration', el => el.value)) || 1;
            const expectedOutput = totalInput - crossfade * (requestPayload.videos.length - 1);

            console.log(`\n=== DURATION ANALYSIS ===`);
            console.log(`Total input duration: ${totalInput}s`);
            console.log(`Crossfade duration: ${crossfade}s`);
            console.log(`Expected output: ~${expectedOutput.toFixed(1)}s`);
            console.log(`Actual output: ${responseData.duration}s`);

            if (Math.abs(responseData.duration - expectedOutput) < 2) {
                console.log(`\n✓ Duration looks correct - both clips concatenated`);
            } else if (Math.abs(responseData.duration - requestPayload.videos[0].duration) < 2) {
                console.log(`\n✗ Duration matches FIRST clip only!`);
                console.log(`  BUG: Only first clip is being used in preview`);
            } else if (Math.abs(responseData.duration - requestPayload.videos[requestPayload.videos.length - 1].duration) < 2) {
                console.log(`\n✗ Duration matches LAST clip only!`);
                console.log(`  BUG: Only last clip is being used in preview`);
            } else {
                console.log(`\n? Duration doesn't match expected patterns`);
            }
        }

        // Wait a bit to let video load
        await page.waitForTimeout(3000);

        // Check the actual video element duration
        const videoDuration = await page.evaluate(() => {
            const video = document.getElementById('videoPreview');
            return video.duration || 0;
        });
        console.log(`\nActual video element duration: ${videoDuration}s`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
}

debugPreview();
