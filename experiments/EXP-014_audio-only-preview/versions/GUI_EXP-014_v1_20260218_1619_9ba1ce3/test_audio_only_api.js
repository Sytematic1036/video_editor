/**
 * API tests for EXP-014: Audio-Only Preview
 *
 * Tests the backend endpoints with actual audio files:
 * 1. /preview-full with only speech track
 * 2. /preview-full with only music track
 * 3. /preview-full with both audio tracks (no video)
 * 4. Error handling when no media provided
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5021';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function getAudioFiles() {
    const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.mp3'));
    if (files.length < 2) {
        throw new Error('Need at least 2 audio files for testing');
    }
    return files.slice(0, 2).map(f => ({
        filename: f,
        path: path.join(UPLOADS_DIR, f).replace(/\\/g, '/')
    }));
}

async function testPreviewWithSpeechOnly(speechFile) {
    console.log('Test: Preview with speech only...');

    const payload = {
        videos: [],
        audio: null,
        speech: [{
            id: 'test_speech',
            filename: speechFile.filename,
            path: speechFile.path,
            duration: 10.0,
            trimStart: 0,
            trimEnd: 0,
            is_silence: false
        }],
        crossfade_duration: 1.0,
        crossfade_transition: 'fade',
        speech_volume: 1.0,
        music_volume: 0.5,
        audio_fade_in: 1.0,
        audio_fade_out: 2.0
    };

    const response = await fetch(`${BASE_URL}/preview-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success && data.preview_url) {
        console.log('  PASS: Speech-only preview generated');
        console.log('  Preview URL:', data.preview_url);
        console.log('  Duration:', data.duration, 's');
        return true;
    } else {
        console.log('  FAIL:', data.error || 'Unknown error');
        return false;
    }
}

async function testPreviewWithMusicOnly(musicFile) {
    console.log('Test: Preview with music only...');

    const payload = {
        videos: [],
        audio: {
            id: 'test_music',
            filename: musicFile.filename,
            path: musicFile.path,
            duration: 60.0,
            trimStart: 0,
            trimEnd: 50.0  // Trim to 10 seconds
        },
        speech: [],
        crossfade_duration: 1.0,
        crossfade_transition: 'fade',
        speech_volume: 1.0,
        music_volume: 0.8,
        audio_fade_in: 1.0,
        audio_fade_out: 2.0
    };

    const response = await fetch(`${BASE_URL}/preview-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success && data.preview_url) {
        console.log('  PASS: Music-only preview generated');
        console.log('  Preview URL:', data.preview_url);
        console.log('  Duration:', data.duration, 's');
        return true;
    } else {
        console.log('  FAIL:', data.error || 'Unknown error');
        return false;
    }
}

async function testPreviewWithBothAudio(speechFile, musicFile) {
    console.log('Test: Preview with speech + music (no video)...');

    const payload = {
        videos: [],
        audio: {
            id: 'test_music',
            filename: musicFile.filename,
            path: musicFile.path,
            duration: 60.0,
            trimStart: 0,
            trimEnd: 50.0
        },
        speech: [{
            id: 'test_speech',
            filename: speechFile.filename,
            path: speechFile.path,
            duration: 10.0,
            trimStart: 0,
            trimEnd: 0,
            is_silence: false
        }],
        crossfade_duration: 1.0,
        crossfade_transition: 'fade',
        speech_volume: 1.0,
        music_volume: 0.5,
        audio_fade_in: 1.0,
        audio_fade_out: 2.0
    };

    const response = await fetch(`${BASE_URL}/preview-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success && data.preview_url) {
        console.log('  PASS: Both audio preview generated');
        console.log('  Preview URL:', data.preview_url);
        console.log('  Duration:', data.duration, 's');
        return true;
    } else {
        console.log('  FAIL:', data.error || 'Unknown error');
        return false;
    }
}

async function testNoMediaError() {
    console.log('Test: Error when no media...');

    const payload = {
        videos: [],
        audio: null,
        speech: [],
        crossfade_duration: 1.0,
        crossfade_transition: 'fade',
        speech_volume: 1.0,
        music_volume: 0.5,
        audio_fade_in: 1.0,
        audio_fade_out: 2.0
    };

    const response = await fetch(`${BASE_URL}/preview-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
        console.log('  PASS: Correct error returned for no media');
        console.log('  Error message:', data.error);
        return true;
    } else {
        console.log('  FAIL: Should return error when no media');
        return false;
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('EXP-014: Audio-Only Preview - API Tests');
    console.log('='.repeat(60));
    console.log();

    try {
        const audioFiles = await getAudioFiles();
        console.log('Audio files found:', audioFiles.map(f => f.filename).join(', '));
        console.log();

        const speechFile = audioFiles[0];
        const musicFile = audioFiles[1];

        let passed = 0;
        let failed = 0;

        if (await testPreviewWithSpeechOnly(speechFile)) passed++; else failed++;
        if (await testPreviewWithMusicOnly(musicFile)) passed++; else failed++;
        if (await testPreviewWithBothAudio(speechFile, musicFile)) passed++; else failed++;
        if (await testNoMediaError()) passed++; else failed++;

        console.log();
        console.log('='.repeat(60));
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(60));

        if (failed > 0) {
            process.exit(1);
        }
    } catch (e) {
        console.error('Test runner error:', e.message);
        process.exit(1);
    }
}

runTests();
