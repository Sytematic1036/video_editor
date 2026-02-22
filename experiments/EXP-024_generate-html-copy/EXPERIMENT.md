# EXP-024: Generate HTML Copy

## Status: EXPERIMENTAL

## Mål
Skapa en "Generate HTML Copy"-knapp i HTML to MP4-tabben som kopierar den aktuella HTML-filen till html_uploads/-mappen med datum och klockslag i filnamnet.

Detta gör det möjligt att spara ändringar (t.ex. slide-tider) genom att generera en kopia av HTML-filen.

## Bygger på
- EXP-023 (rename-title)
- EXP-018 (merge-html-mp4-video-editor)

## Funktionalitet
1. Ny knapp "Generate HTML Copy" i HTML to MP4-tabben
2. Knappen är disabled tills en HTML-fil laddats upp
3. Vid klick kopieras HTML-filen med namnformat: `originalnamn_YYYY-MM-DD_HHMMSS.html`
4. Kopian sparas i `html_uploads/` mappen
5. Statusmeddelande visas efter kopiering

## Teknisk implementation
- Frontend: Ny knapp i `index.html` rad ~1265
- Backend: Ny Flask endpoint `POST /copy-html`
- Filnamnsformat: `{original}_YYYY-MM-DD_HHMMSS.html`

## Framgångskriterier
1. [ ] Knappen visas i HTML to MP4-tabben
2. [ ] Knappen är disabled utan uppladdad HTML-fil
3. [ ] Kopian skapas med korrekt filnamn
4. [ ] Statusmeddelande visas
5. [ ] Playwright-tester passerar

## Edge cases
1. [ ] Ingen HTML uppladdad -> Knappen disabled
2. [ ] Filnamn med specialtecken -> secure_filename hanterar

## Skapad
2026-02-22
