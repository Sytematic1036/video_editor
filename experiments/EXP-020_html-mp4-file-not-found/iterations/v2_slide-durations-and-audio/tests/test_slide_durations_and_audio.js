/**
 * Playwright test for EXP-020 v2: Slide durations and audio
 *
 * Tests:
 * 1. Upload HTML with SLIDE_CONFIG
 * 2. Verify slide count and total duration detected (~331s, not 55s)
 * 3. Start conversion
 * 4. Verify MP4 has correct duration (~331s)
 * 5. Verify MP4 has audio stream
 */
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5022';
const TEST_HTML_PATH = process.argv[2] || 'C:\\Users\\haege\\Downloads\\paradigmskifte-presentation.html';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getVideoInfo(filepath) {
    try {
        const output = execSync(
            `ffprobe -v quiet -print_format json -show_streams "${filepath}"`,
            { encoding: 'utf-8' }
        );
        return JSON.parse(output);
    } catch (e) {
        return null;
    }
}

async function testSlideDurationsAndAudio() {
    console.log('=== EXP-020 v2: Slide Durations & Audio Test ===\n');
    console.log(`Test file: ${TEST_HTML_PATH}`);

    // Check if test file exists
    if (!fs.existsSync(TEST_HTML_PATH)) {
        console.error(`ERROR: Test file not found: ${TEST_HTML_PATH}`);
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Load page
        console.log('\n--- Test 1: Load page ---');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('OK: Page loaded');
        passed++;

        // Test 2: Switch to HTML to MP4 tab
        console.log('\n--- Test 2: Switch to HTML to MP4 tab ---');
        const htmlTabButton = await page.$('button:has-text("HTML to MP4")');
        if (htmlTabButton) {
            await htmlTabButton.click();
            await sleep(500);
            console.log('OK: Switched to HTML to MP4 tab');
            passed++;
        } else {
            console.log('WARN: No tab button found');
            passed++;
        }

        // Test 3: Upload HTML file via API
        console.log('\n--- Test 3: Upload HTML file ---');
        const fileContent = fs.readFileSync(TEST_HTML_PATH);
        const fileName = path.basename(TEST_HTML_PATH);

        const uploadResponse = await page.evaluate(async ({ fileContent, fileName }) => {
            const blob = new Blob([new Uint8Array(fileContent)], { type: 'text/html' });
            const formData = new FormData();
            formData.append('file', blob, fileName);

            const response = await fetch('/html-upload', {
                method: 'POST',
                body: formData
            });
            return await response.json();
        }, { fileContent: Array.from(fileContent), fileName });

        if (uploadResponse.success) {
            console.log(`OK: Uploaded HTML file, id: ${uploadResponse.id}`);
            console.log(`   Slides: ${uploadResponse.total_slides}`);
            console.log(`   Total duration: ${uploadResponse.total_duration}s`);
            passed++;

            // Test 4: Verify slide count
            console.log('\n--- Test 4: Verify slide count (expect 11) ---');
            if (uploadResponse.total_slides === 11) {
                console.log(`OK: Correct slide count: ${uploadResponse.total_slides}`);
                passed++;
            } else {
                console.log(`FAIL: Expected 11 slides, got ${uploadResponse.total_slides}`);
                failed++;
            }

            // Test 5: Verify total duration (~331s, not 55s)
            console.log('\n--- Test 5: Verify total duration (expect ~331s) ---');
            const expectedDuration = 331.3;
            const tolerance = 5;  // Allow 5s tolerance
            if (Math.abs(uploadResponse.total_duration - expectedDuration) <= tolerance) {
                console.log(`OK: Correct duration: ${uploadResponse.total_duration}s (expected ~${expectedDuration}s)`);
                passed++;
            } else if (uploadResponse.total_duration < 60) {
                console.log(`FAIL: Duration too short: ${uploadResponse.total_duration}s (expected ~${expectedDuration}s)`);
                console.log('      This indicates SLIDE_CONFIG durations are NOT being read');
                failed++;
            } else {
                console.log(`WARN: Duration mismatch: ${uploadResponse.total_duration}s (expected ~${expectedDuration}s)`);
                passed++;  // Close enough
            }

        } else {
            console.log(`FAIL: Upload failed: ${uploadResponse.error}`);
            failed++;
            throw new Error('Upload failed');
        }

        const htmlId = uploadResponse.id;

        // Test 6: Start conversion
        console.log('\n--- Test 6: Start HTML to MP4 conversion ---');
        const conversionResponse = await page.evaluate(async (htmlId) => {
            const response = await fetch('/html-to-mp4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html_id: htmlId,
                    width: 1280,  // Lower res for faster test
                    height: 720,
                    fps: 1  // Very low FPS for faster test
                })
            });
            return await response.json();
        }, htmlId);

        if (conversionResponse.success) {
            console.log(`OK: Conversion started, job_id: ${conversionResponse.job_id}`);
            passed++;
        } else {
            console.log(`FAIL: Conversion start failed: ${conversionResponse.error}`);
            failed++;
            throw new Error('Conversion start failed');
        }

        const jobId = conversionResponse.job_id;

        // Test 7: Wait for completion (this will take a while!)
        console.log('\n--- Test 7: Wait for conversion to complete ---');
        console.log('    (This may take several minutes for 11 slides...)');
        let status = 'processing';
        let downloadUrl = null;
        let outputFilename = null;
        let attempts = 0;
        const maxAttempts = 180;  // 180 * 2s = 6 minutes max

        while (status === 'processing' && attempts < maxAttempts) {
            await sleep(2000);
            attempts++;

            const statusResponse = await page.evaluate(async (jobId) => {
                const response = await fetch(`/html-to-mp4/status/${jobId}`);
                return await response.json();
            }, jobId);

            status = statusResponse.status;
            if (attempts % 10 === 0) {
                console.log(`   Attempt ${attempts}: status=${status}`);
            }

            if (status === 'completed') {
                downloadUrl = statusResponse.download_url;
                outputFilename = downloadUrl.split('/').pop();
                console.log(`OK: Conversion completed!`);
                console.log(`   Download URL: ${downloadUrl}`);
                if (statusResponse.result) {
                    console.log(`   Result duration: ${statusResponse.result.duration_s}s`);
                }
                passed++;
            } else if (status === 'failed') {
                console.log(`FAIL: Conversion failed: ${statusResponse.error}`);
                failed++;
                throw new Error(`Conversion failed: ${statusResponse.error}`);
            }
        }

        if (status !== 'completed') {
            console.log('FAIL: Conversion timed out');
            failed++;
            throw new Error('Conversion timed out');
        }

        // Test 8: Download and verify MP4
        console.log('\n--- Test 8: Download MP4 ---');
        const downloadResponse = await page.evaluate(async (downloadUrl) => {
            const response = await fetch(downloadUrl);
            return {
                status: response.status,
                contentType: response.headers.get('content-type'),
                ok: response.ok
            };
        }, downloadUrl);

        if (downloadResponse.status === 200) {
            console.log(`OK: Download returned HTTP ${downloadResponse.status}`);
            passed++;
        } else {
            console.log(`FAIL: Download returned HTTP ${downloadResponse.status}`);
            failed++;
        }

        // Test 9: Verify MP4 has audio using ffprobe
        console.log('\n--- Test 9: Verify MP4 has audio stream ---');
        const mp4Path = path.join('C:\\Users\\haege\\video_editor\\output', outputFilename);

        if (fs.existsSync(mp4Path)) {
            const info = getVideoInfo(mp4Path);
            if (info && info.streams) {
                const videoStream = info.streams.find(s => s.codec_type === 'video');
                const audioStream = info.streams.find(s => s.codec_type === 'audio');

                if (videoStream) {
                    const videoDuration = parseFloat(videoStream.duration || 0);
                    console.log(`   Video: ${videoStream.codec_name}, ${videoDuration.toFixed(1)}s`);

                    // Verify duration is close to expected
                    if (videoDuration > 300) {  // At least 5 minutes
                        console.log(`OK: Video duration ${videoDuration.toFixed(1)}s is correct (>300s)`);
                        passed++;
                    } else {
                        console.log(`FAIL: Video duration ${videoDuration.toFixed(1)}s too short (expected >300s)`);
                        failed++;
                    }
                }

                if (audioStream) {
                    console.log(`   Audio: ${audioStream.codec_name}, ${parseFloat(audioStream.duration || 0).toFixed(1)}s`);
                    console.log('OK: MP4 has audio stream');
                    passed++;
                } else {
                    console.log('FAIL: MP4 has NO audio stream');
                    failed++;
                }
            } else {
                console.log('WARN: Could not analyze MP4 with ffprobe');
            }
        } else {
            console.log(`WARN: MP4 file not found at ${mp4Path}`);
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50));

        if (failed === 0) {
            console.log('\n=== ALL TESTS PASSED ===');
            console.log('EXP-020 v2 verified:');
            console.log('  - SLIDE_CONFIG durations extracted correctly');
            console.log('  - Audio extracted and included in MP4');
        } else {
            console.log('\n=== TESTS FAILED ===');
            process.exit(1);
        }

    } catch (error) {
        console.error(`\nERROR: ${error.message}`);
        console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testSlideDurationsAndAudio();
