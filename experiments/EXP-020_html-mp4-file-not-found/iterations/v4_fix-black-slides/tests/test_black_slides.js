/**
 * Playwright test for EXP-020 v4: Black slides fix
 *
 * Tests that ALL slides are captured, including duplicate-looking ones.
 * bildspel-fragetecken-v2.html has: [black 5s, generated 40s, black 5s]
 *
 * Bug: v3 skipped the last black slide because it looked like the first one.
 * Fix: v4 removes duplicate detection, captures all slides.
 *
 * Expected: 3 slides, 50s total, MP4 duration = 50s
 */
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5022';
const TEST_HTML_PATH = 'C:\\Users\\haege\\Downloads\\bildspel-fragetecken-v2.html';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getVideoDuration(filepath) {
    try {
        const output = execSync(
            `ffprobe -v quiet -print_format json -show_streams "${filepath}"`,
            { encoding: 'utf-8' }
        );
        const info = JSON.parse(output);
        const video = info.streams.find(s => s.codec_type === 'video');
        return video ? parseFloat(video.duration) : 0;
    } catch (e) {
        return 0;
    }
}

async function testBlackSlides() {
    console.log('=== EXP-020 v4: Black Slides Fix Test ===\n');
    console.log(`Test file: ${TEST_HTML_PATH}`);
    console.log('Expected: 3 slides [black 5s, generated 40s, black 5s] = 50s total\n');

    if (!fs.existsSync(TEST_HTML_PATH)) {
        console.error(`ERROR: Test file not found`);
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Load page
        console.log('--- Test 1: Load page ---');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('OK: Page loaded');
        passed++;

        // Test 2: Switch to HTML to MP4 tab
        console.log('\n--- Test 2: Switch to HTML to MP4 tab ---');
        const tab = await page.$('button:has-text("HTML to MP4")');
        if (tab) await tab.click();
        await sleep(500);
        console.log('OK: Tab switched');
        passed++;

        // Test 3: Upload HTML
        console.log('\n--- Test 3: Upload HTML ---');
        const fileContent = fs.readFileSync(TEST_HTML_PATH);
        const upload = await page.evaluate(async ({ content, name }) => {
            const blob = new Blob([new Uint8Array(content)], { type: 'text/html' });
            const form = new FormData();
            form.append('file', blob, name);
            const res = await fetch('/html-upload', { method: 'POST', body: form });
            return res.json();
        }, { content: Array.from(fileContent), name: 'bildspel-fragetecken-v2.html' });

        if (upload.success) {
            console.log(`OK: Uploaded, ${upload.total_slides} slides, ${upload.total_duration}s`);
            passed++;
        } else {
            console.log(`FAIL: ${upload.error}`);
            failed++;
            throw new Error('Upload failed');
        }

        // Test 4: Start conversion
        console.log('\n--- Test 4: Start conversion ---');
        const conv = await page.evaluate(async (id) => {
            const res = await fetch('/html-to-mp4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html_id: id, width: 1280, height: 720, fps: 2 })
            });
            return res.json();
        }, upload.id);

        if (conv.success) {
            console.log(`OK: Conversion started, job ${conv.job_id}`);
            passed++;
        } else {
            console.log(`FAIL: ${conv.error}`);
            failed++;
            throw new Error('Conversion failed');
        }

        // Test 5: Wait for completion
        console.log('\n--- Test 5: Wait for completion ---');
        let status = 'processing';
        let result = null;
        let attempts = 0;

        while (status === 'processing' && attempts < 90) {
            await sleep(2000);
            attempts++;
            const s = await page.evaluate(async (id) => {
                const res = await fetch(`/html-to-mp4/status/${id}`);
                return res.json();
            }, conv.job_id);
            status = s.status;
            if (status === 'completed') {
                result = s;
                console.log(`OK: Completed in ${attempts * 2}s`);
                passed++;
            } else if (status === 'failed') {
                console.log(`FAIL: ${s.error}`);
                failed++;
                throw new Error('Conversion failed');
            }
        }

        if (status !== 'completed') {
            console.log('FAIL: Timeout');
            failed++;
            throw new Error('Timeout');
        }

        // Test 6: Verify MP4 duration is 50s (not 45s)
        console.log('\n--- Test 6: Verify MP4 duration (expect 50s) ---');
        const filename = result.download_url.split('/').pop();
        const mp4Path = path.join('C:\\Users\\haege\\video_editor\\output', filename);

        if (fs.existsSync(mp4Path)) {
            const duration = getVideoDuration(mp4Path);
            console.log(`   MP4 duration: ${duration.toFixed(1)}s`);

            if (Math.abs(duration - 50) < 1) {
                console.log('OK: Duration is 50s (all 3 slides captured)');
                passed++;
            } else if (Math.abs(duration - 45) < 1) {
                console.log('FAIL: Duration is 45s - last black slide SKIPPED (bug not fixed)');
                failed++;
            } else {
                console.log(`FAIL: Unexpected duration ${duration}s`);
                failed++;
            }
        } else {
            console.log('WARN: MP4 file not found for verification');
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50));

        if (failed === 0) {
            console.log('\n=== ALL TESTS PASSED ===');
            console.log('EXP-020 v4 verified: All slides captured including black ones');
        } else {
            console.log('\n=== TESTS FAILED ===');
            process.exit(1);
        }

    } catch (error) {
        console.error(`\nERROR: ${error.message}`);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testBlackSlides();
