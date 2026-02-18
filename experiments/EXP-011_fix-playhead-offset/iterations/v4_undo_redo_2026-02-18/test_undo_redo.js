/**
 * Playwright test for EXP-011 v4: Test Undo/Redo functionality
 * Verifies that undo and redo work for various operations
 */
const { chromium } = require('playwright');

async function testUndoRedo() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Enable console logging from browser
    page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('[Undo]')) {
            console.log('  [browser]', msg.text());
        }
    });

    console.log('=== EXP-011 v4 Undo/Redo Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Verify undo/redo functions exist
        const hasUndoRedo = await page.evaluate(() => {
            return typeof undo === 'function' &&
                   typeof redo === 'function' &&
                   typeof saveState === 'function' &&
                   Array.isArray(undoStack) &&
                   Array.isArray(redoStack);
        });
        console.log(`✓ Undo/Redo functions exist: ${hasUndoRedo}`);
        if (!hasUndoRedo) {
            console.log('✗ FAIL: Undo/Redo system not found');
            process.exit(1);
        }

        // Verify undo/redo buttons exist
        const buttonsExist = await page.evaluate(() => {
            return document.getElementById('undoBtn') !== null &&
                   document.getElementById('redoBtn') !== null;
        });
        console.log(`✓ Undo/Redo buttons exist: ${buttonsExist}`);

        // Test 1: Undo after adding speech clip
        console.log('\n--- Test 1: Undo after adding speech clip ---');

        // Add a speech clip
        await page.evaluate(() => {
            saveState('Test add');
            speechClips.push({
                filename: 'test_speech.wav',
                duration: 20,
                trimStart: 0,
                trimEnd: 0
            });
            renderTimeline();
        });

        let clipCount = await page.evaluate(() => speechClips.length);
        let undoStackSize = await page.evaluate(() => undoStack.length);
        console.log(`✓ Added speech clip: ${clipCount} clips, undoStack: ${undoStackSize}`);

        // Undo
        await page.evaluate(() => undo());
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After undo: ${clipCount} clips`);

        if (clipCount !== 0) {
            console.log('✗ FAIL: Expected 0 clips after undo');
            process.exit(1);
        }
        console.log('✓ PASS: Undo after add works');

        // Test 2: Redo
        console.log('\n--- Test 2: Redo ---');
        await page.evaluate(() => redo());
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After redo: ${clipCount} clips`);

        if (clipCount !== 1) {
            console.log('✗ FAIL: Expected 1 clip after redo');
            process.exit(1);
        }
        console.log('✓ PASS: Redo works');

        // Test 3: Undo after delete
        console.log('\n--- Test 3: Undo after delete ---');
        await page.evaluate(() => {
            removeSpeech(0);
        });
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After delete: ${clipCount} clips`);

        await page.evaluate(() => undo());
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After undo delete: ${clipCount} clips`);

        if (clipCount !== 1) {
            console.log('✗ FAIL: Expected 1 clip after undo delete');
            process.exit(1);
        }
        console.log('✓ PASS: Undo delete works');

        // Test 4: Undo after split
        console.log('\n--- Test 4: Undo after split ---');
        await page.evaluate(() => {
            playheadPosition = 10;
            updateGlobalPlayhead();
            splitSpeechAtPlayhead();
        });
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After split: ${clipCount} clips`);

        await page.evaluate(() => undo());
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After undo split: ${clipCount} clips`);

        if (clipCount !== 1) {
            console.log('✗ FAIL: Expected 1 clip after undo split');
            process.exit(1);
        }
        console.log('✓ PASS: Undo split works');

        // Test 5: Multiple undos
        console.log('\n--- Test 5: Multiple undos ---');
        await page.evaluate(() => {
            // Clear and start fresh
            undoStack = [];
            redoStack = [];
            speechClips = [];

            // Do 5 actions
            for (let i = 1; i <= 5; i++) {
                saveState(`Action ${i}`);
                speechClips.push({
                    filename: `clip${i}.wav`,
                    duration: 10,
                    trimStart: 0,
                    trimEnd: 0
                });
            }
            renderTimeline();
        });

        undoStackSize = await page.evaluate(() => undoStack.length);
        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After 5 actions: ${clipCount} clips, undoStack: ${undoStackSize}`);

        // Undo 3 times
        await page.evaluate(() => {
            undo();
            undo();
            undo();
        });
        clipCount = await page.evaluate(() => speechClips.length);
        const redoStackSize = await page.evaluate(() => redoStack.length);
        console.log(`✓ After 3 undos: ${clipCount} clips, redoStack: ${redoStackSize}`);

        if (clipCount !== 2) {
            console.log(`✗ FAIL: Expected 2 clips after 3 undos, got ${clipCount}`);
            process.exit(1);
        }
        if (redoStackSize !== 3) {
            console.log(`✗ FAIL: Expected redoStack size 3, got ${redoStackSize}`);
            process.exit(1);
        }
        console.log('✓ PASS: Multiple undos work');

        // Test 6: Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
        console.log('\n--- Test 6: Keyboard shortcuts ---');

        // Redo 2 times with Ctrl+Y
        await page.keyboard.down('Control');
        await page.keyboard.press('y');
        await page.keyboard.press('y');
        await page.keyboard.up('Control');

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After Ctrl+Y x2: ${clipCount} clips`);

        if (clipCount !== 4) {
            console.log(`✗ FAIL: Expected 4 clips after Ctrl+Y x2, got ${clipCount}`);
            process.exit(1);
        }

        // Undo with Ctrl+Z
        await page.keyboard.down('Control');
        await page.keyboard.press('z');
        await page.keyboard.up('Control');

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After Ctrl+Z: ${clipCount} clips`);

        if (clipCount !== 3) {
            console.log(`✗ FAIL: Expected 3 clips after Ctrl+Z, got ${clipCount}`);
            process.exit(1);
        }
        console.log('✓ PASS: Keyboard shortcuts work');

        // Test 7: Max undo stack size
        console.log('\n--- Test 7: Max undo stack size (20) ---');
        await page.evaluate(() => {
            undoStack = [];
            redoStack = [];
            speechClips = [];

            // Do 25 actions (should only keep last 20)
            for (let i = 1; i <= 25; i++) {
                saveState(`Action ${i}`);
                speechClips.push({
                    filename: `clip${i}.wav`,
                    duration: 5,
                    trimStart: 0,
                    trimEnd: 0
                });
            }
        });

        undoStackSize = await page.evaluate(() => undoStack.length);
        console.log(`✓ After 25 actions, undoStack size: ${undoStackSize}`);

        if (undoStackSize !== 20) {
            console.log(`✗ FAIL: Expected max 20 in undo stack, got ${undoStackSize}`);
            process.exit(1);
        }
        console.log('✓ PASS: Max undo stack size enforced');

        // Test 8: Button states
        console.log('\n--- Test 8: Button states ---');
        await page.evaluate(() => {
            undoStack = [];
            redoStack = [];
            updateUndoRedoButtons();
        });

        let undoBtnDisabled = await page.evaluate(() => document.getElementById('undoBtn').disabled);
        let redoBtnDisabled = await page.evaluate(() => document.getElementById('redoBtn').disabled);
        console.log(`✓ Empty stacks - undoBtn disabled: ${undoBtnDisabled}, redoBtn disabled: ${redoBtnDisabled}`);

        if (!undoBtnDisabled || !redoBtnDisabled) {
            console.log('✗ FAIL: Buttons should be disabled when stacks are empty');
            process.exit(1);
        }

        // Add something
        await page.evaluate(() => {
            saveState('test');
            speechClips.push({ filename: 'test.wav', duration: 10, trimStart: 0, trimEnd: 0 });
            updateUndoRedoButtons();
        });

        undoBtnDisabled = await page.evaluate(() => document.getElementById('undoBtn').disabled);
        console.log(`✓ After action - undoBtn disabled: ${undoBtnDisabled}`);

        if (undoBtnDisabled) {
            console.log('✗ FAIL: Undo button should be enabled after action');
            process.exit(1);
        }
        console.log('✓ PASS: Button states work correctly');

        console.log('\n=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testUndoRedo();
