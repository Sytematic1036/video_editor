# Autonom korning 2026-02-21 - EXP-020 v2

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Iteration: v2_slide-durations-and-audio
- Mal: Fixa saknade slide-tider och ljud vid HTML-till-MP4-konvertering
- Problem 1: HTML anvander SLIDE_CONFIG, men konverteraren letade efter SAVED_DURATIONS
- Problem 2: Audio (5.1 MB base64) ignorerades helt

## Fixes implementerade

### 1. SLIDE_CONFIG parsing
```python
def extract_slide_config(html_content: str) -> Dict[int, float]:
    # Extraherar: var SLIDE_CONFIG = [{ duration: 33 }, ...]
```

### 2. Audio extraktion
```python
def extract_audio_data(html_content: str) -> Optional[bytes]:
    # Extraherar: var AUDIO_DATA = "data:audio/mpeg;base64,..."
```

### 3. FFmpeg med audio
```python
if audio_temp_path:
    ffmpeg_cmd = [..., '-i', audio_temp_path, '-c:a', 'aac', ...]
```

## Testresultat

```
=== EXP-020 v2: Slide Durations & Audio Test ===

Test 1: Load page                         OK
Test 2: Switch to HTML to MP4 tab         OK
Test 3: Upload HTML file                  OK (11 slides, 331.3s)
Test 4: Verify slide count (expect 11)    OK
Test 5: Verify total duration (~331s)     OK
Test 6: Start conversion                  OK
Test 7: Wait for completion               OK (331s)
Test 8: Download MP4                      OK (HTTP 200)
Test 9: Verify video duration             OK (331s, >300s)
Test 10: Verify audio stream              OK (aac, 331s)

RESULTS: 10 passed, 0 failed
=== ALL TESTS PASSED ===
```

## Andrade filer
- `src/html_converter.py` - Lade till SLIDE_CONFIG och audio-stod

## Verifierat med ffprobe
```
Video: h264, 331.0s
Audio: aac, 331.0s
```

## Rekommenderade nasta steg
1. Granska: `git diff src/html_converter.py`
2. Om OK: `git add -A && git commit -m "Add SLIDE_CONFIG and audio support (EXP-020 v2)"`
