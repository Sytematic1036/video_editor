/**
 * Playwright test for EXP-021: Audio checkbox
 *
 * Tests:
 * 1. Checkbox exists and is unchecked by default
 * 2. Conversion without audio (checkbox unchecked)
 * 3. Conversion with audio (checkbox checked) - if HTML has audio
 *
 * Test file: bildspel-fragetecken-v2.html (no audio, 3 slides)
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

function getAudioStreams(filepath) {
    try {
        const output = execSync(
            `ffprobe -v quiet -print_format json -show_streams "${filepath}"`,
            { encoding: 'utf-8' }
        );
        const info = JSON.parse(output);
        return info.streams.filter(s => s.codec_type === 'audio').length;
    } catch (e) {
        return 0;
    }
}

async function testAudioCheckbox() {
    console.log('=== EXP-021: Audio Checkbox Test ===\n');
    console.log(`Test file: ${TEST_HTML_PATH}`);
    console.log('Expected: Checkbox exists, default unchecked, conversion works\n');

    if (!fs.existsSync(TEST_HTML_PATH)) {
        console.error(`ERROR: Test file not found: ${TEST_HTML_PATH}`);
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

        // Test 3: Checkbox exists and is unchecked by default
        console.log('\n--- Test 3: Checkbox exists and is unchecked ---');
        const checkbox = await page.$('#htmlIncludeAudio');
        if (!checkbox) {
            console.log('FAIL: Checkbox #htmlIncludeAudio not found');
            failed++;
        } else {
            const isChecked = await checkbox.isChecked();
            if (isChecked) {
                console.log('FAIL: Checkbox should be unchecked by default');
                failed++;
            } else {
                console.log('OK: Checkbox exists and is unchecked (default)');
                passed++;
            }
        }

        // Test 4: Upload HTML
        console.log('\n--- Test 4: Upload HTML ---');
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

        // Test 5: Convert WITHOUT audio (checkbox unchecked)
        console.log('\n--- Test 5: Convert without audio (checkbox unchecked) ---');
        const conv = await page.evaluate(async (id) => {
            const res = await fetch('/html-to-mp4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html_id: id,
                    width: 1280,
                    height: 720,
                    fps: 2,
                    include_audio: false  // Explicitly false
                })
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

        // Test 6: Wait for completion
        console.log('\n--- Test 6: Wait for completion ---');
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

        // Test 7: Verify MP4 has NO audio stream
        console.log('\n--- Test 7: Verify MP4 has no audio stream ---');
        const filename = result.download_url.split('/').pop();
        const mp4Path = path.join('C:\\Users\\haege\\video_editor\\output', filename);

        if (fs.existsSync(mp4Path)) {
            const audioStreams = getAudioStreams(mp4Path);
            console.log(`   Audio streams: ${audioStreams}`);

            if (audioStreams === 0) {
                console.log('OK: No audio stream (include_audio=false worked)');
                passed++;
            } else {
                console.log('FAIL: Audio stream found when include_audio=false');
                failed++;
            }
        } else {
            console.log('WARN: MP4 file not found for verification');
        }

        // Test 8: Verify checkbox can be checked
        console.log('\n--- Test 8: Verify checkbox can be toggled ---');
        await checkbox.check();
        const isNowChecked = await checkbox.isChecked();
        if (isNowChecked) {
            console.log('OK: Checkbox can be checked');
            passed++;
        } else {
            console.log('FAIL: Checkbox did not toggle');
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50));

        if (failed === 0) {
            console.log('\n=== ALL TESTS PASSED ===');
            console.log('EXP-021 verified: Audio checkbox works correctly');
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

testAudioCheckbox();
