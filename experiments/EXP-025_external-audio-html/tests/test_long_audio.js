/**
 * EXP-025: Test that longer audio extends MP4 duration
 */
const { chromium } = require('playwright');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:5022';
const TEST_FIXTURES = path.join(__dirname, 'fixtures');
const TEST_HTML = path.join(TEST_FIXTURES, 'test_presentation.html');
const TEST_AUDIO_LONG = path.join(TEST_FIXTURES, 'test_audio_long.mp3');

async function test() {
    console.log('\n=== Testing: Longer audio extends MP4 duration ===\n');
    console.log('HTML has 3 slides * 3s = 9s video');
    console.log('Audio is 10s');
    console.log('Expected: MP4 should be ~10s (audio length)\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(BASE_URL);
    await page.click('button[data-tab="html-to-mp4"]');
    await page.waitForTimeout(500);

    // Upload HTML
    await page.locator('#htmlFileInput').setInputFiles(TEST_HTML);
    await page.waitForTimeout(2000);

    // Upload 10s audio
    await page.locator('#htmlExternalAudioInput').setInputFiles(TEST_AUDIO_LONG);
    await page.waitForTimeout(2000);

    // Convert
    console.log('Starting conversion...');
    await page.click('#generateHtmlBtn');
    await page.waitForSelector('#htmlResultSection.visible', { timeout: 60000 });

    const duration = await page.locator('#resultDuration').textContent();
    console.log(`Result duration: ${duration}s`);

    await browser.close();

    // Verify with ffprobe
    const outputDir = 'C:\\Users\\haege\\video_editor\\.worktrees\\025-external-audio-html\\output';
    const files = fs.readdirSync(outputDir).filter(f => f.startsWith('html2mp4_'));
    const latestFile = files
        .map(f => ({ name: f, mtime: fs.statSync(path.join(outputDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime)[0].name;

    const mp4Path = path.join(outputDir, latestFile);
    const probeResult = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp4Path}"`, { encoding: 'utf8' });

    console.log(`ffprobe duration: ${probeResult.trim()}s`);

    // Check streams
    const streams = execSync(`ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 "${mp4Path}"`, { encoding: 'utf8' });
    console.log('Streams:');
    console.log(streams);
}

test().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
