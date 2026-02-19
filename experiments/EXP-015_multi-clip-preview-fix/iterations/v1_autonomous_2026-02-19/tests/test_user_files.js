/**
 * Test with user's actual files
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:5021';

async function testUserFiles() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== Testing with user files ===\n');

    page.on('console', msg => {
        if (msg.text().includes('Error') || msg.text().includes('error')) {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Clear
        await page.click('#clearBtn');
        await page.waitForTimeout(500);

        const files = [
            'C:/Users/haege/Downloads/strategiska-fordelar.mp4',
            'C:/Users/haege/Downloads/ScreenRecording_02-18-2026 08-44-30_1.MP4'
        ];

        console.log('Uploading files in order:');
        for (let i = 0; i < files.length; i++) {
            console.log(`  ${i + 1}. ${files[i].split('/').pop()}`);
            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser'),
                page.click('#btnUploadVideo'),
            ]);
            await fileChooser.setFiles(files[i]);
            await page.waitForTimeout(2000);
        }

        // Check timeline
        const clipsCount = await page.$$eval('#videoTrack .timeline-clip', els => els.length);
        console.log(`\nClips in timeline: ${clipsCount}`);

        // Capture request
        let payload = null;
        page.on('request', req => {
            if (req.url().includes('/preview-full')) {
                payload = JSON.parse(req.postData());
            }
        });

        // Click preview
        await page.waitForFunction(() => !document.getElementById('previewFullBtn').disabled);

        console.log('\nGenerating preview...');
        const [response] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/preview-full'), { timeout: 120000 }),
            page.click('#previewFullBtn'),
        ]);

        const data = await response.json();

        console.log('\n=== RESULTS ===');
        console.log(`Videos sent: ${payload?.videos?.length}`);
        payload?.videos?.forEach((v, i) => {
            console.log(`  ${i + 1}. ${v.path?.split(/[/\\]/).pop()} (${v.duration}s)`);
        });

        console.log(`\nPreview success: ${data.success}`);
        console.log(`Preview duration: ${data.duration}s`);

        if (data.error) {
            console.log(`ERROR: ${data.error}`);
        }

        // Analysis
        const totalInput = payload?.videos?.reduce((s, v) => s + v.duration, 0) || 0;
        const expected = totalInput - 1; // 1s crossfade

        console.log(`\nExpected: ~${expected}s`);
        console.log(`Got: ${data.duration}s`);

        if (Math.abs(data.duration - expected) < 2) {
            console.log('✓ CORRECT - Both clips included');
        } else if (Math.abs(data.duration - payload?.videos?.[0]?.duration) < 2) {
            console.log('✗ BUG - Only FIRST clip (strategiska-fordelar)');
        } else if (Math.abs(data.duration - payload?.videos?.[1]?.duration) < 2) {
            console.log('✗ BUG - Only SECOND clip (ScreenRecording)');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
}

testUserFiles();
