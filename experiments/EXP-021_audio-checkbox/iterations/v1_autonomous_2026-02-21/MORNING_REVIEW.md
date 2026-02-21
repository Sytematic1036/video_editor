# Autonom korning 2026-02-21 - EXP-021

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Iteration: v1_autonomous_2026-02-21
- Mal: Lagg till "Include audio" checkbox i HTML to MP4 Converter
- Default: unchecked (inget ljud)
- Resultat: Alla 8 tester passerade

## Andrade filer
- `src/templates/index.html` - Lade till checkbox #htmlIncludeAudio
- `src/app.py` - Lade till include_audio parameter i /html-to-mp4 endpoint
- `src/html_converter.py` - Modifierade convert_html_to_mp4() for att respektera include_audio

## Implementation
### Frontend (index.html)
```html
<input type="checkbox" id="htmlIncludeAudio">
Include audio (if present in HTML)
```

### Backend (app.py)
```python
include_audio = data.get('include_audio', False)  # EXP-021: Default off
```

### Converter (html_converter.py)
```python
def convert_html_to_mp4(..., include_audio: bool = False):
    if include_audio:
        audio_data = extract_audio_data(html_content)
        # ... extract and include audio
    else:
        print("[INFO] Audio extraction skipped (include_audio=False)")
```

## Testresultat
```
Test 1: Load page              OK
Test 2: Switch tab             OK
Test 3: Checkbox exists        OK (unchecked by default)
Test 4: Upload HTML            OK (3 slides, 50s)
Test 5: Start conversion       OK (include_audio=false)
Test 6: Wait for completion    OK (22s)
Test 7: Verify no audio        OK (0 audio streams)
Test 8: Toggle checkbox        OK

RESULTS: 8 passed, 0 failed
=== ALL TESTS PASSED ===
```

## Beteende
| Checkbox | HTML har audio | Resultat |
|----------|----------------|----------|
| Unchecked | Ja | MP4 utan ljud |
| Unchecked | Nej | MP4 utan ljud |
| Checked | Ja | MP4 med ljud |
| Checked | Nej | MP4 utan ljud |

## Nasta steg
1. Granska: `git diff`
2. Testa manuellt i GUI pa http://localhost:5022
3. Om OK: `/stamp-version` for att skapa stamplead version
