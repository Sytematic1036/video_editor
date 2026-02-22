# Autonom körning 2026-02-22

## Repo
`video_editor` (https://github.com/Sytematic1036/video_editor)

## Status
[x] LYCKADES / [ ] DELVIS / [ ] MISSLYCKADES

## Sammanfattning
Implementerade "Generate HTML Copy"-funktionalitet som kopierar HTML-filer med datum+klockslag i filnamnet. Alla 6 Playwright-tester passerar.

## Nya filer
- `experiments/EXP-024_generate-html-copy/EXPERIMENT.md`
- `experiments/EXP-024_generate-html-copy/fixtures/success_criteria.yaml`
- `experiments/EXP-024_generate-html-copy/learnings.md`
- `experiments/EXP-024_generate-html-copy/tests/test_fixture.html`
- `experiments/EXP-024_generate-html-copy/tests/test_copy_html.js`

## Ändringar i src/
1. **src/app.py** (rad 653-695)
   - Ny Flask endpoint `POST /copy-html`
   - Kopierar HTML-fil till html_uploads/ med tidsstämpel
   - Format: `{originalnamn}_{YYYY-MM-DD_HHMMSS}.html`

2. **src/templates/index.html**
   - Rad 820-832: Ny CSS `.btn-secondary` för knappen
   - Rad 1268: Ny knapp `#copyHtmlBtn` i HTML to MP4-tabben
   - Rad 3610: JavaScript-referens till copyHtmlBtn
   - Rad 3672: copyHtmlBtn.disabled = false vid upload
   - Rad 3853: copyHtmlBtn.disabled = true vid clear
   - Rad 3864-3883: Click-event handler för copyHtmlBtn

## Tester
```
Playwright: 6 passed, 0 failed
  ✓ Knappen finns (#copyHtmlBtn)
  ✓ Disabled utan HTML-upload
  ✓ Enabled efter upload
  ✓ Statusmeddelande visas
  ✓ Fil skapas med tidsstämpel
  ✓ Disabled efter Clear
```

## Hur du testar manuellt
1. Starta servern: `cd src && python app.py`
2. Öppna http://localhost:5022
3. Klicka på "HTML to MP4"-tabben
4. Dra in en HTML-fil
5. Klicka "Generate HTML Copy"
6. Kontrollera att kopian finns i `html_uploads/` med tidsstämpel

## Kör automatiska tester
```bash
# Starta server i en terminal
cd src && python app.py

# I en annan terminal, kör testerna
node experiments/EXP-024_generate-html-copy/tests/test_copy_html.js
```

## Nästa steg för användaren
1. Verifiera funktionaliteten i browsern
2. Om OK, committa och pusha:
   ```bash
   git add .
   git commit -m "feat(EXP-024): Add Generate HTML Copy button"
   git push
   ```
3. Skapa PR om önskat
