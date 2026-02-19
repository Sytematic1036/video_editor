/**
 * EXP-015 Final Test Suite
 *
 * Tests:
 * 1. Multi-clip Preview - Verify all clips are concatenated
 * 2. Clear All - Verify preview is cleared properly
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5021';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

let passed = 0;
let failed = 0;

function test(name, success) {
    if (success) {
        console.log(`  PASS: ${name}`);
        passed++;
    } else {
        console.log(`  FAIL: ${name}`);
        failed++;
    }
}

async function runTests() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('========================================');
    console.log('EXP-015: Final Test Suite');
    console.log('========================================\n');

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Get video files
        const videoFiles = fs.readdirSync(UPLOADS_DIR)
            .filter(f => f.endsWith('.mp4'))
            .slice(0, 2);

        if (videoFiles.length < 2) {
            console.log('ERROR: Need at least 2 video files for testing');
            process.exit(1);
        }

        // === TEST 1: Multi-clip Preview ===
        console.log('--- Test 1: Multi-clip Preview ---');

        // Clear first
        await page.click('#clearBtn');
        await page.waitForTimeout(500);

        // Upload 2 videos
        for (const filename of videoFiles) {
            const filePath = path.join(UPLOADS_DIR, filename);
            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser'),
                page.click('#btnUploadVideo'),
            ]);
            await fileChooser.setFiles(filePath);
            await page.waitForTimeout(2000);
        }

        // Check clips in timeline
        const clipsInTimeline = await page.$$eval('#videoTrack .timeline-clip', els => els.length);
        test('Both clips appear in timeline', clipsInTimeline === 2);

        // Test Preview Full
        let previewPayload = null;
        page.on('request', request => {
            if (request.url().includes('/preview-full')) {
                previewPayload = JSON.parse(request.postData());
            }
        });

        await page.waitForFunction(() => {
            const btn = document.getElementById('previewFullBtn');
            return btn && !btn.disabled;
        });

        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/preview-full'), { timeout: 60000 }),
            page.click('#previewFullBtn'),
        ]);

        const responseData = await response.json();

        test('Preview payload contains 2 videos', previewPayload?.videos?.length === 2);
        test('Preview generates successfully', responseData.success === true);

        // Check duration is reasonable (both clips minus crossfade)
        const totalInputDuration = previewPayload?.videos?.reduce((sum, v) => sum + (v.duration || 0), 0) || 0;
        const expectedMinDuration = totalInputDuration - 2;
        test('Output duration includes both clips', responseData.duration >= expectedMinDuration - 1);

        // === TEST 2: Clear All ===
        console.log('\n--- Test 2: Clear All ---');

        // Verify video preview is showing
        const previewVisible = await page.$eval('#previewSection', el => el.style.display !== 'none');
        test('Preview section visible before clear', previewVisible);

        // Click Clear All
        await page.click('#clearBtn');
        await page.waitForTimeout(500);

        // Check timeline is empty
        const clipsAfterClear = await page.$$eval('#videoTrack .timeline-clip', els => els.length);
        test('Timeline empty after clear', clipsAfterClear === 0);

        // Check preview is hidden
        const previewHidden = await page.$eval('#previewSection', el => el.style.display === 'none');
        test('Preview section hidden after clear', previewHidden);

        // Check video element is hidden
        const videoHidden = await page.$eval('#videoPreview', el => el.style.display === 'none');
        test('Video preview hidden after clear', videoHidden);

        // Check preview button is disabled
        const btnDisabled = await page.$eval('#previewFullBtn', el => el.disabled);
        test('Preview button disabled after clear', btnDisabled);

    } catch (error) {
        console.error('\nTest error:', error.message);
        failed++;
    } finally {
        await browser.close();
    }

    // Summary
    console.log('\n========================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('========================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
