/**
 * Playwright tests for EXP-019: Playhead visibility
 * Tests that playhead is always visible with margin on right side
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5022';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('=== EXP-019 Playhead Tests ===\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let passed = 0;
    let failed = 0;

    try {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('Page loaded\n');

        // Test 1: Playhead exists and is visible
        console.log('Test 1: Playhead exists and is visible...');
        const playheadExists = await page.evaluate(() => {
            const playhead = document.getElementById('globalPlayhead');
            if (!playhead) return false;
            const style = window.getComputedStyle(playhead);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });

        if (playheadExists) {
            console.log('  PASS: Playhead exists and is visible');
            passed++;
        } else {
            console.log('  FAIL: Playhead not found or hidden');
            failed++;
        }

        // Test 2: Playhead visible without any files
        console.log('\nTest 2: Playhead visible without files...');
        const playheadInfo = await page.evaluate(() => {
            const playhead = document.getElementById('globalPlayhead');
            const wrapper = document.getElementById('timelineWrapper');
            if (!playhead || !wrapper) return null;

            const playheadRect = playhead.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();

            return {
                playheadLeft: playheadRect.left,
                playheadRight: playheadRect.right,
                wrapperLeft: wrapperRect.left,
                wrapperRight: wrapperRect.right,
                isVisible: playheadRect.left >= wrapperRect.left &&
                           playheadRect.right <= wrapperRect.right
            };
        });

        if (playheadInfo && playheadInfo.isVisible) {
            console.log('  PASS: Playhead is visible within timeline wrapper');
            passed++;
        } else {
            console.log('  FAIL: Playhead not visible in timeline');
            if (playheadInfo) {
                console.log(`    Playhead position: ${playheadInfo.playheadLeft} - ${playheadInfo.playheadRight}`);
                console.log(`    Wrapper bounds: ${playheadInfo.wrapperLeft} - ${playheadInfo.wrapperRight}`);
            }
            failed++;
        }

        // Test 3: Playhead time display shows 0:00 initially
        console.log('\nTest 3: Playhead time display...');
        const timeDisplay = await page.evaluate(() => {
            const timeEl = document.getElementById('globalPlayheadTime');
            return timeEl ? timeEl.textContent : null;
        });

        if (timeDisplay === '0:00') {
            console.log('  PASS: Playhead time shows 0:00');
            passed++;
        } else {
            console.log(`  FAIL: Playhead time shows "${timeDisplay}" instead of "0:00"`);
            failed++;
        }

        // Test 4: ensurePlayheadVisible function exists
        console.log('\nTest 4: ensurePlayheadVisible function exists...');
        const hasEnsureVisible = await page.evaluate(() => {
            return typeof ensurePlayheadVisible === 'function';
        });

        if (hasEnsureVisible) {
            console.log('  PASS: ensurePlayheadVisible function exists');
            passed++;
        } else {
            console.log('  FAIL: ensurePlayheadVisible function not found');
            failed++;
        }

        // Test 5: updatePlayheadVisualPosition function exists
        console.log('\nTest 5: updatePlayheadVisualPosition function exists...');
        const hasUpdateVisual = await page.evaluate(() => {
            return typeof updatePlayheadVisualPosition === 'function';
        });

        if (hasUpdateVisual) {
            console.log('  PASS: updatePlayheadVisualPosition function exists');
            passed++;
        } else {
            console.log('  FAIL: updatePlayheadVisualPosition function not found');
            failed++;
        }

        // Test 6: Playhead clamps to max duration (correct behavior)
        console.log('\nTest 6: Playhead clamps to max duration...');
        const positionTest = await page.evaluate(() => {
            // Without clips, getMaxDuration returns 1
            // Setting playhead to 5 should clamp to 1
            playheadPosition = 5;
            updateGlobalPlayhead();

            const maxDur = getMaxDuration();
            const clampedPos = playheadPosition;
            const timeEl = document.getElementById('globalPlayheadTime');
            return {
                maxDuration: maxDur,
                clampedPosition: clampedPos,
                display: timeEl ? timeEl.textContent : null
            };
        });

        // Playhead should be clamped to maxDuration
        if (positionTest.clampedPosition <= positionTest.maxDuration) {
            console.log(`  PASS: Playhead clamped to max duration (${positionTest.maxDuration}s)`);
            passed++;
        } else {
            console.log(`  FAIL: Playhead not clamped (pos=${positionTest.clampedPosition}, max=${positionTest.maxDuration})`);
            failed++;
        }

        // Test 7: Reset playhead to 0
        await page.evaluate(() => {
            playheadPosition = 0;
            updateGlobalPlayhead();
        });

        // Test 8: Playhead hitarea exists for easier clicking
        console.log('\nTest 7: Playhead hitarea exists...');
        const hitareaExists = await page.$('.global-playhead-hitarea');
        if (hitareaExists) {
            console.log('  PASS: Playhead hitarea exists');
            passed++;
        } else {
            console.log('  FAIL: Playhead hitarea not found');
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(40));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(40));

        if (failed === 0) {
            console.log('\nALL PLAYHEAD TESTS PASSED\n');
        } else {
            console.log('\nSOME TESTS FAILED\n');
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('\nTest error:', error.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
