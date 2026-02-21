# Autonom korning 2026-02-21

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
- Skapade experiment: EXP-020_html-mp4-file-not-found
- Mal: Fixa "File not found" vid HTML-till-MP4 download
- Rotorsak: `download_export()` sokte bara i `exports/`, men html2mp4 sparar i `output/`
- Fix: Uppdaterade `download_export()` att soka i BADE mappar

## Progress
- [x] Experiment-struktur skapad
- [x] Rotorsak identifierad
- [x] Fix implementerad i `src/app.py` (rad 387-410)
- [x] Playwright-test skriven
- [x] Tester passerar (6/6)

## Nya filer
- `experiments/EXP-020.../EXPERIMENT.md` - Experiment-dokumentation
- `experiments/EXP-020.../fixtures/success_criteria.yaml` - Framgangskriterier
- `experiments/EXP-020.../iterations/v1.../tests/test_html_to_mp4.js` - Playwright-test
- `experiments/EXP-020.../iterations/v1.../src/app.py` - Kopia av fixad kod

## Andrade filer
- `src/app.py` - Fixade `download_export()` att soka i bade EXPORT_DIR och OUTPUT_DIR

## Tester
```
=== EXP-020: HTML to MP4 Download Test ===
Test 1: Load page                    OK
Test 2: Switch to HTML to MP4 tab    OK
Test 3: Upload HTML file             OK
Test 4: Start conversion             OK
Test 5: Wait for completion          OK
Test 6: Download MP4 file            OK

RESULTS: 6 passed, 0 failed
=== ALL TESTS PASSED ===
```

## Teknisk fix
```python
# FORE (rad 387-401):
@app.route('/download/<filename>')
def download_export(filename):
    filepath = EXPORT_DIR / safe_filename
    if not filepath.exists():
        return jsonify({'error': 'File not found'}), 404

# EFTER (rad 387-410):
@app.route('/download/<filename>')
def download_export(filename):
    filepath = EXPORT_DIR / safe_filename
    if not filepath.exists():
        filepath = OUTPUT_DIR / safe_filename  # <-- NY RAD
    if not filepath.exists():
        return jsonify({'error': 'File not found'}), 404
```

## Rekommenderade nasta steg
1. Granska: `git diff src/app.py`
2. Testa manuellt: Oppna http://localhost:5022, ladda upp en HTML, konvertera, ladda ner
3. Om OK: `git add src/app.py && git commit -m "Fix HTML to MP4 download (EXP-020)"`
