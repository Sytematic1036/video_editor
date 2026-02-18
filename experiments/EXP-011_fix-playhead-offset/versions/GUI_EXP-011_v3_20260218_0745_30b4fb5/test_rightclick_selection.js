/**
 * Playwright test for EXP-011 v3: Debug right-click selection behavior
 * Tests whether right-click properly selects the clip before showing context menu
 */
const { chromium } = require('playwright');

async function testRightClickSelection() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Enable console logging from browser
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log('  [browser]', msg.text());
        }
    });

    console.log('=== EXP-011 v3 Right-Click Selection Test ===\n');

    try {
        await page.goto('http://localhost:5019');
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Add a speech clip and split it
        await page.evaluate(() => {
            speechClips.push({
                filename: 'test_speech.wav',
                duration: 20,
                trimStart: 0,
                trimEnd: 0
            });
            playheadPosition = 10;
            updateGlobalPlayhead();
            splitSpeechAtPlayhead();
            renderTimeline();
        });

        let clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ Created and split clip: ${clipCount} clips`);

        // Check initial selectedSpeechClip
        let selected = await page.evaluate(() => selectedSpeechClip);
        console.log(`✓ Initial selectedSpeechClip: ${selected}`);

        // Get bounding box of second clip
        const clips = await page.$$('#speechTrack .timeline-clip');
        const clipBox = await clips[1].boundingBox();
        console.log(`✓ Second clip box: x=${clipBox.x}, y=${clipBox.y}, w=${clipBox.width}`);

        // Right-click on second clip
        console.log('\n--- Right-clicking on second clip ---');
        await page.mouse.click(clipBox.x + clipBox.width / 2, clipBox.y + clipBox.height / 2, { button: 'right' });
        await page.waitForTimeout(200);

        // Check selectedSpeechClip after right-click
        selected = await page.evaluate(() => selectedSpeechClip);
        console.log(`✓ After right-click, selectedSpeechClip: ${selected}`);

        if (selected !== 1) {
            console.log('✗ BUG FOUND: Right-click does NOT set selectedSpeechClip!');
            console.log('  This explains why delete fails - it deletes wrong clip or nothing');
        }

        // Check if context menu is visible
        const contextMenuVisible = await page.evaluate(() => {
            return document.getElementById('contextMenu').classList.contains('visible');
        });
        console.log(`✓ Context menu visible: ${contextMenuVisible}`);

        // Try to use page.evaluate to click the menu item
        console.log('\n--- Clicking Remove Clip via evaluate ---');
        await page.evaluate(() => {
            document.getElementById('menuRemoveClip').click();
        });
        await page.waitForTimeout(100);

        clipCount = await page.evaluate(() => speechClips.length);
        console.log(`✓ After menu click: ${clipCount} clips`);

        if (clipCount === 2) {
            console.log('✗ BUG CONFIRMED: Delete did not work because selectedSpeechClip was not set');
        } else if (clipCount === 1) {
            console.log('✓ Delete worked');
        }

        console.log('\n=== DIAGNOSIS ===');
        console.log('The bug is: contextmenu event does NOT trigger the click handler');
        console.log('that sets selectedSpeechClip. So menuRemoveClip uses stale/null value.');

        console.log('\n=== SOLUTION ===');
        console.log('In the contextmenu event handler, we need to also find and select');
        console.log('the clip that was right-clicked before showing the menu.');

    } catch (error) {
        console.error('✗ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

testRightClickSelection();
