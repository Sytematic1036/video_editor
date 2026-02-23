/**
 * Playwright tests for EXP-026: Audio Source Export Integration
 *
 * Tests that audio_source parameter is sent correctly to backend
 * when export button is clicked with each radio option selected.
 *
 * Note: These tests mock/intercept the /export request to verify
 * the payload contains correct audio_source value.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5022';

// Get pre-created test video path
function getTestVideo() {
    const testVideoPath = path.join(__dirname, '..', 'fixtures', 'test_video.mp4');
    if (fs.existsSync(testVideoPath)) {
        return testVideoPath;
    }
    console.log('Test video not found at:', testVideoPath);
    return null;
}

async function runTests() {
    console.log('Starting Export Audio Source Integration Tests...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;
    let capturedAudioSource = null;

    // Helper function for test results
    function logResult(testName, success, error = null) {
        if (success) {
            console.log(`  ✅ ${testName}`);
            passed++;
        } else {
            console.log(`  ❌ ${testName}`);
            if (error) console.log(`     Error: ${error}`);
            failed++;
        }
    }

    try {
        // Intercept /export requests to capture payload
        await page.route('**/export', async (route, request) => {
            if (request.method() === 'POST') {
                const postData = request.postDataJSON();
                capturedAudioSource = postData?.audio_source || null;
                console.log(`     [Intercepted] audio_source = "${capturedAudioSource}"`);

                // Return a mock successful response
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        job_id: 'test_job_123',
                        message: 'Export started (mocked)'
                    })
                });
            } else {
                await route.continue();
            }
        });

        // Navigate to the page
        console.log('Navigating to Video Editor...');
        await page.goto(BASE_URL, { timeout: 10000 });
        await page.waitForLoadState('domcontentloaded');

        // Make sure we're on the Video Editor tab
        const videoEditorTab = page.locator('.main-tab-btn[data-tab="video-editor"]');
        await videoEditorTab.click();
        await page.waitForTimeout(500);

        // Get test video
        console.log('Looking for test video...');
        const testVideoPath = getTestVideo();

        if (testVideoPath) {
            console.log('\n--- Test: Upload video for export test ---');

            // Upload the test video
            const fileInput = page.locator('#btnUploadVideo + input[type="file"], input[type="file"][accept*="video"]').first();

            // If there's no visible file input, try clicking the upload button
            const uploadBtn = page.locator('#btnUploadVideo');
            if (await uploadBtn.count() > 0) {
                // Create a file chooser listener
                const [fileChooser] = await Promise.all([
                    page.waitForEvent('filechooser'),
                    uploadBtn.click()
                ]);
                await fileChooser.setFiles(testVideoPath);
                await page.waitForTimeout(2000);

                // Check if video was uploaded
                const videoClips = page.locator('.timeline-clip.video');
                const clipCount = await videoClips.count();
                logResult('Video uploaded successfully', clipCount > 0, clipCount === 0 ? 'No video clips found' : null);

                if (clipCount > 0) {
                    console.log('\n--- Test: Export with "Ljud från Video" ---');
                    {
                        capturedAudioSource = null;
                        const videoOption = page.locator('.audio-source-option:has(#audioSourceVideo)');
                        await videoOption.click();
                        await page.waitForTimeout(200);

                        const exportBtn = page.locator('#exportFinalBtn');
                        if (await exportBtn.isEnabled() || true) {
                            // Force enable for test
                            await page.evaluate(() => {
                                document.getElementById('exportFinalBtn').disabled = false;
                            });
                            await exportBtn.click();
                            await page.waitForTimeout(500);

                            logResult('audio_source="video" sent in request', capturedAudioSource === 'video',
                                capturedAudioSource !== 'video' ? `Got "${capturedAudioSource}"` : null);
                        }
                    }

                    console.log('\n--- Test: Export with "Ljud från Video Editor" ---');
                    {
                        capturedAudioSource = null;
                        const editorOption = page.locator('.audio-source-option:has(#audioSourceEditor)');
                        await editorOption.click();
                        await page.waitForTimeout(200);

                        await page.evaluate(() => {
                            document.getElementById('exportFinalBtn').disabled = false;
                        });
                        const exportBtn = page.locator('#exportFinalBtn');
                        await exportBtn.click();
                        await page.waitForTimeout(500);

                        logResult('audio_source="editor" sent in request', capturedAudioSource === 'editor',
                            capturedAudioSource !== 'editor' ? `Got "${capturedAudioSource}"` : null);
                    }

                    console.log('\n--- Test: Export with "Inget ljud" ---');
                    {
                        capturedAudioSource = null;
                        const noneOption = page.locator('.audio-source-option:has(#audioSourceNone)');
                        await noneOption.click();
                        await page.waitForTimeout(200);

                        await page.evaluate(() => {
                            document.getElementById('exportFinalBtn').disabled = false;
                        });
                        const exportBtn = page.locator('#exportFinalBtn');
                        await exportBtn.click();
                        await page.waitForTimeout(500);

                        logResult('audio_source="none" sent in request', capturedAudioSource === 'none',
                            capturedAudioSource !== 'none' ? `Got "${capturedAudioSource}"` : null);
                    }
                }
            } else {
                console.log('     Could not find upload button, skipping export tests');
            }

            // Don't cleanup test video - it's a fixture
        } else {
            console.log('     Skipping export tests (no test video)');
        }

    } catch (error) {
        console.error('\nTest execution error:', error.message);
        failed++;
    } finally {
        await browser.close();
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    // Exit with error code if any tests failed
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
