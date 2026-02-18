/**
 * Playwright test for EXP-011 v4: Test Undo/Redo buttons
 * Verifies that clicking the buttons works correctly
 */
const { chromium } = require('playwright');

async function testUndoButtons() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== EXP-011 v4 Undo/Redo Button Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Test 1: Buttons are initially disabled
        console.log('\n--- Test 1: Initial button state ---');
        let undoDisabled = await page.$eval('#undoBtn', btn => btn.disabled);
        let redoDisabled = await page.$eval('#redoBtn', btn => btn.disabled);
        console.log(`✓ Undo disabled: ${undoDisabled}, Redo disabled: ${redoDisabled}`);

        if (!undoDisabled || !redoDisabled) {
            console.log('✗ FAIL: Buttons should be disabled initially');
            process.exit(1);
        }
        console.log('✓ PASS: Buttons disabled initially');

        // Test 2: Add clips and check button states
        console.log('\n--- Test 2: Add clips and check button state ---');
        await page.evaluate(() => {
            saveState('Add clip 1');  // Save state BEFORE the change
            speechClips.push({
                filename: 'test1.wav',
                duration: 10,
                trimStart: 0,
                trimEnd: 0
            });
            renderTimeline();
            updateUndoRedoButtons();
        });

        undoDisabled = await page.$eval('#undoBtn', btn => btn.disabled);
        console.log(`✓ After add: Undo disabled = ${undoDisabled}`);

        if (undoDisabled) {
            console.log('✗ FAIL: Undo should be enabled after action');
            process.exit(1);
        }
        console.log('✓ PASS: Undo enabled after add');

        // Test 3: Click undo button
        console.log('\n--- Test 3: Click undo button ---');
        let clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ Before undo click: ${clipCount} clips`);

        await page.click('#undoBtn');
        await page.waitForTimeout(100);

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After undo click: ${clipCount} clips`);

        if (clipCount !== 0) {
            console.log('✗ FAIL: Expected 0 clips after undo click');
            process.exit(1);
        }
        console.log('✓ PASS: Undo button works');

        // Test 4: Click redo button
        console.log('\n--- Test 4: Click redo button ---');
        redoDisabled = await page.$eval('#redoBtn', btn => btn.disabled);
        console.log(`✓ Redo disabled: ${redoDisabled}`);

        if (redoDisabled) {
            console.log('✗ FAIL: Redo should be enabled after undo');
            process.exit(1);
        }

        await page.click('#redoBtn');
        await page.waitForTimeout(100);

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After redo click: ${clipCount} clips`);

        if (clipCount !== 1) {
            console.log('✗ FAIL: Expected 1 clip after redo click');
            process.exit(1);
        }
        console.log('✓ PASS: Redo button works');

        // Test 5: Multiple operations with button clicks
        console.log('\n--- Test 5: Multiple operations ---');

        // Add more clips
        for (let i = 2; i <= 4; i++) {
            await page.evaluate((num) => {
                saveState(`Add clip ${num}`);  // Save state BEFORE the change
                speechClips.push({
                    filename: `test${num}.wav`,
                    duration: 10,
                    trimStart: 0,
                    trimEnd: 0
                });
                renderTimeline();
                updateUndoRedoButtons();
            }, i);
        }

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After adding 3 more: ${clipCount} clips`);

        // Click undo 2 times
        await page.click('#undoBtn');
        await page.waitForTimeout(50);
        await page.click('#undoBtn');
        await page.waitForTimeout(50);

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After 2 undo clicks: ${clipCount} clips`);

        if (clipCount !== 2) {
            console.log(`✗ FAIL: Expected 2 clips, got ${clipCount}`);
            process.exit(1);
        }
        console.log('✓ PASS: Multiple undo clicks work');

        // Test 6: Tooltip shows action name
        console.log('\n--- Test 6: Button tooltip ---');
        const undoTitle = await page.$eval('#undoBtn', btn => btn.title);
        console.log(`✓ Undo button title: "${undoTitle}"`);

        if (!undoTitle.includes('Undo')) {
            console.log('✗ FAIL: Undo button should have descriptive title');
            process.exit(1);
        }
        console.log('✓ PASS: Button has descriptive tooltip');

        console.log('\n=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testUndoButtons();
