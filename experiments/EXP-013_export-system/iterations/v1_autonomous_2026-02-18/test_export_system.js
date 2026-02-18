/**
 * Playwright tests for EXP-013: Export System
 * Tests export panel, progress tracking, storage info, and cleanup
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5020';

async function runTests() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-013 Export System Tests ===\n');

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (error) {
            console.log(`✗ ${name}`);
            console.log(`  Error: ${error.message}`);
            failed++;
        }
    }

    try {
        // Navigate to app
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('Page loaded\n');

        // Test 1: Page title
        await test('Page title is EXP-013', async () => {
            const title = await page.title();
            if (!title.includes('EXP-013')) {
                throw new Error(`Expected title to contain "EXP-013", got "${title}"`);
            }
        });

        // Test 2: H1 contains EXP-013
        await test('H1 header contains EXP-013', async () => {
            const h1 = await page.$eval('h1', el => el.textContent);
            if (!h1.includes('EXP-013')) {
                throw new Error(`Expected H1 to contain "EXP-013", got "${h1}"`);
            }
        });

        // Test 3: Export panel exists
        await test('Export panel exists', async () => {
            const panel = await page.$('#exportPanel');
            if (!panel) {
                throw new Error('Export panel not found');
            }
        });

        // Test 4: Export Final button exists
        await test('Export Final button exists', async () => {
            const btn = await page.$('#exportFinalBtn');
            if (!btn) {
                throw new Error('Export Final button not found');
            }
            const text = await btn.textContent();
            if (!text.includes('1080p')) {
                throw new Error(`Expected button to mention 1080p, got "${text}"`);
            }
        });

        // Test 5: Export Final button is disabled when no clips
        await test('Export Final button is disabled initially', async () => {
            const disabled = await page.$eval('#exportFinalBtn', el => el.disabled);
            if (!disabled) {
                throw new Error('Export button should be disabled when no clips');
            }
        });

        // Test 6: Progress container exists but hidden
        await test('Progress container exists and hidden initially', async () => {
            const progress = await page.$('#exportProgress');
            if (!progress) {
                throw new Error('Progress container not found');
            }
            const display = await progress.evaluate(el => getComputedStyle(el).display);
            if (display !== 'none') {
                throw new Error(`Expected progress to be hidden, got display: ${display}`);
            }
        });

        // Test 7: Storage info elements exist
        await test('Storage info elements exist', async () => {
            const uploadsSize = await page.$('#uploadsSize');
            const previewsSize = await page.$('#previewsSize');
            const exportsSize = await page.$('#exportsSize');
            const exportsCount = await page.$('#exportsCount');

            if (!uploadsSize || !previewsSize || !exportsSize || !exportsCount) {
                throw new Error('Storage info elements missing');
            }
        });

        // Test 8: Cleanup button exists
        await test('Cleanup button exists', async () => {
            const btn = await page.$('#cleanupBtn');
            if (!btn) {
                throw new Error('Cleanup button not found');
            }
            const text = await btn.textContent();
            if (!text.includes('Cleanup')) {
                throw new Error(`Expected button to say "Cleanup", got "${text}"`);
            }
        });

        // Test 9: Exports list exists
        await test('Exports list exists', async () => {
            const list = await page.$('#exportsList');
            if (!list) {
                throw new Error('Exports list not found');
            }
        });

        // Test 10: Test /storage-info endpoint
        await test('/storage-info endpoint works', async () => {
            const response = await page.evaluate(async () => {
                const res = await fetch('/storage-info');
                return await res.json();
            });
            if (typeof response.uploads_mb !== 'number') {
                throw new Error('Invalid storage info response');
            }
        });

        // Test 11: Test /exports endpoint
        await test('/exports endpoint works', async () => {
            const response = await page.evaluate(async () => {
                const res = await fetch('/exports');
                return await res.json();
            });
            if (!Array.isArray(response.exports)) {
                throw new Error('Invalid exports response');
            }
        });

        // Test 12: Volume controls from EXP-012 still work
        await test('Volume controls exist (from EXP-012)', async () => {
            const speechSlider = await page.$('#speechVolumeSlider');
            const musicSlider = await page.$('#musicVolumeSlider');
            if (!speechSlider || !musicSlider) {
                throw new Error('Volume sliders not found');
            }
        });

        // Test 13: Download button exists but hidden
        await test('Download button exists and hidden initially', async () => {
            const btn = await page.$('#downloadBtn');
            if (!btn) {
                throw new Error('Download button not found');
            }
            const display = await btn.evaluate(el => getComputedStyle(el).display);
            if (display !== 'none') {
                throw new Error(`Expected download button to be hidden, got display: ${display}`);
            }
        });

        // Test 14: Preview button renamed to 720p
        await test('Preview button mentions 720p', async () => {
            const btn = await page.$('#exportBtn');
            if (!btn) {
                throw new Error('Preview/Export button not found');
            }
            const text = await btn.textContent();
            if (!text.includes('720p')) {
                throw new Error(`Expected button to mention 720p, got "${text}"`);
            }
        });

        // Test 15: Test /export-status endpoint (with non-existent job)
        await test('/export-status returns 404 for invalid job', async () => {
            const response = await page.evaluate(async () => {
                const res = await fetch('/export-status/invalid123');
                return { status: res.status, data: await res.json() };
            });
            if (response.status !== 404) {
                throw new Error(`Expected 404, got ${response.status}`);
            }
        });

        console.log('\n' + '='.repeat(40));
        console.log(`Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(40));

        if (failed === 0) {
            console.log('\n=== ALL TESTS PASSED ===\n');
        }

    } catch (error) {
        console.error('Test suite error:', error.message);
        failed++;
    } finally {
        await browser.close();
    }

    // Write results to JSON file
    const results = {
        timestamp: new Date().toISOString(),
        experiment: 'EXP-013_export-system',
        passed,
        failed,
        total: passed + failed,
        success: failed === 0,
    };

    const fs = require('fs');
    fs.writeFileSync(
        __dirname + '/test_results.json',
        JSON.stringify(results, null, 2)
    );

    process.exit(failed > 0 ? 1 : 0);
}

runTests();
