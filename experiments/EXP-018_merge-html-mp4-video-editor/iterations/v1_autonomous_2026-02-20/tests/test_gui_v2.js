/**
 * Playwright tests for EXP-018 v2: Video Editor + HTML to MP4 Merged
 * Updated to match v3_live-drag-scroll structure.
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5022';
const TIMEOUT = 30000;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('=== EXP-018 v2 GUI Tests ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    try {
        // ==================== TEST 1: Page loads ====================
        console.log('Test 1: Page loads...');
        await page.goto(BASE_URL, { timeout: TIMEOUT });
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        if (title.includes('EXP-018')) {
            console.log('  ✓ Page title contains EXP-018');
            passed++;
        } else {
            console.log('  ✗ Page title missing EXP-018:', title);
            failed++;
        }

        // ==================== TEST 2: Both tabs exist ====================
        console.log('\nTest 2: Both tabs exist...');

        const videoEditorTab = await page.$('.main-tab-btn[data-tab="video-editor"]');
        const htmlToMp4Tab = await page.$('.main-tab-btn[data-tab="html-to-mp4"]');

        if (videoEditorTab && htmlToMp4Tab) {
            console.log('  ✓ Both tabs exist');
            passed++;
        } else {
            console.log('  ✗ Missing tabs:', { videoEditorTab: !!videoEditorTab, htmlToMp4Tab: !!htmlToMp4Tab });
            failed++;
        }

        // ==================== TEST 3: Video Editor tab is active by default ====================
        console.log('\nTest 3: Video Editor tab is active by default...');

        const activeTab = await page.$('.main-tab-btn.active');
        const activeTabText = await activeTab?.textContent();

        if (activeTabText && activeTabText.includes('Video Editor')) {
            console.log('  ✓ Video Editor tab is active by default');
            passed++;
        } else {
            console.log('  ✗ Video Editor tab not active:', activeTabText);
            failed++;
        }

        // ==================== TEST 4: Video Editor content is visible ====================
        console.log('\nTest 4: Video Editor content is visible...');

        const videoEditorContent = await page.$('#video-editor.main-tab-content.active');
        if (videoEditorContent) {
            console.log('  ✓ Video Editor content is visible');
            passed++;
        } else {
            console.log('  ✗ Video Editor content not visible');
            failed++;
        }

        // ==================== TEST 5: Tab switching works ====================
        console.log('\nTest 5: Tab switching works...');

        await page.click('.main-tab-btn[data-tab="html-to-mp4"]');
        await sleep(300);

        const htmlTabActive = await page.$('.main-tab-btn[data-tab="html-to-mp4"].active');
        const htmlContentActive = await page.$('#html-to-mp4.main-tab-content.active');

        if (htmlTabActive && htmlContentActive) {
            console.log('  ✓ Tab switching works - HTML to MP4 now active');
            passed++;
        } else {
            console.log('  ✗ Tab switching failed');
            failed++;
        }

        // ==================== TEST 6: HTML to MP4 drop zone exists ====================
        console.log('\nTest 6: HTML to MP4 drop zone exists...');

        const htmlDropZone = await page.$('#htmlDropZone');
        if (htmlDropZone) {
            console.log('  ✓ HTML drop zone exists');
            passed++;
        } else {
            console.log('  ✗ HTML drop zone missing');
            failed++;
        }

        // ==================== TEST 7: Generate button is disabled initially ====================
        console.log('\nTest 7: Generate button is disabled initially...');

        const generateBtn = await page.$('#generateHtmlBtn');
        const isDisabled = await generateBtn?.isDisabled();

        if (isDisabled) {
            console.log('  ✓ Generate button is disabled');
            passed++;
        } else {
            console.log('  ✗ Generate button should be disabled');
            failed++;
        }

        // ==================== TEST 8: Switch back to Video Editor ====================
        console.log('\nTest 8: Switch back to Video Editor...');

        await page.click('.main-tab-btn[data-tab="video-editor"]');
        await sleep(300);

        const videoTabActive = await page.$('.main-tab-btn[data-tab="video-editor"].active');
        const videoContentActive = await page.$('#video-editor.main-tab-content.active');

        if (videoTabActive && videoContentActive) {
            console.log('  ✓ Switched back to Video Editor');
            passed++;
        } else {
            console.log('  ✗ Failed to switch back');
            failed++;
        }

        // ==================== TEST 9: Video upload button exists (v3 uses buttons, not drop zone) ====================
        console.log('\nTest 9: Video upload button exists...');

        const videoUploadBtn = await page.$('#btnUploadVideo');
        if (videoUploadBtn) {
            console.log('  ✓ Video upload button exists');
            passed++;
        } else {
            console.log('  ✗ Video upload button missing');
            failed++;
        }

        // ==================== TEST 10: Export button disabled initially ====================
        console.log('\nTest 10: Export button disabled initially...');

        const exportBtn = await page.$('#exportBtn');
        const exportDisabled = await exportBtn?.isDisabled();

        if (exportDisabled) {
            console.log('  ✓ Export button is disabled');
            passed++;
        } else {
            console.log('  ✗ Export button should be disabled');
            failed++;
        }

        // ==================== TEST 11: Settings grid exists in HTML to MP4 ====================
        console.log('\nTest 11: Settings grid exists in HTML to MP4...');

        await page.click('.main-tab-btn[data-tab="html-to-mp4"]');
        await sleep(200);

        const settingsGrid = await page.$('.html-settings-grid');
        const resolutionSelect = await page.$('#htmlResolution');
        const fpsInput = await page.$('#htmlFps');

        if (settingsGrid && resolutionSelect && fpsInput) {
            console.log('  ✓ Settings grid with resolution and FPS exists');
            passed++;
        } else {
            console.log('  ✗ Missing settings elements:', { settingsGrid: !!settingsGrid, resolutionSelect: !!resolutionSelect, fpsInput: !!fpsInput });
            failed++;
        }

        // ==================== TEST 12: Clear buttons exist ====================
        console.log('\nTest 12: Clear buttons exist...');

        const clearHtmlBtn = await page.$('#clearHtmlBtn');
        await page.click('.main-tab-btn[data-tab="video-editor"]');
        await sleep(200);
        const clearBtn = await page.$('#clearBtn');  // v3 uses #clearBtn not #clearVideoBtn

        if (clearHtmlBtn && clearBtn) {
            console.log('  ✓ Clear buttons exist in both tabs');
            passed++;
        } else {
            console.log('  ✗ Missing clear buttons:', { clearHtmlBtn: !!clearHtmlBtn, clearBtn: !!clearBtn });
            failed++;
        }

        // ==================== TEST 13: Playhead context menu exists (v3 feature) ====================
        console.log('\nTest 13: Playhead context menu exists (v3 feature)...');

        const playheadMenu = await page.$('#playheadContextMenu');
        if (playheadMenu) {
            console.log('  ✓ Playhead context menu exists');
            passed++;
        } else {
            console.log('  ✗ Playhead context menu missing');
            failed++;
        }

        // ==================== TEST 14: Timeline exists ====================
        console.log('\nTest 14: Timeline container exists...');

        const timeline = await page.$('.timeline-container');
        if (timeline) {
            console.log('  ✓ Timeline container exists');
            passed++;
        } else {
            console.log('  ✗ Timeline container missing');
            failed++;
        }

        // ==================== SUMMARY ====================
        console.log('\n' + '='.repeat(40));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(40));

        if (failed === 0) {
            console.log('\n✓ ALL TESTS PASSED\n');
        } else {
            console.log('\n✗ SOME TESTS FAILED\n');
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('\n✗ Test error:', error.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
