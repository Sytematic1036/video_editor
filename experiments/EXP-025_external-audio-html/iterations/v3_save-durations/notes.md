# Iteration v3 - Save Durations in HTML Copy

**Datum:** 2026-02-22
**Typ:** Kollaborativ
**Baserad på:** v2_download-html-copy

## Syfte
Spara de ändrade slide-tiderna i HTML-kopian så att de finns kvar när filen laddas upp igen.

## Problem
- Användaren ändrar tider i GUI (t.ex. 5s → 10s)
- Klickar "Download HTML Copy"
- Filen laddas ner med ORIGINAL-tiderna
- Vid ny uppladdning är ändringarna borta

## Lösning
- Frontend skickar `custom_durations` till `/copy-html`
- Backend uppdaterar `SLIDE_CONFIG` eller `SAVED_DURATIONS` i HTML innan nedladdning

## Ändringar
- [x] Uppdatera `/copy-html` att ta emot `custom_durations`
- [x] Skriva funktion `update_html_durations()` som ändrar tiderna i HTML
- [x] Frontend skickar `slideDurations` vid nedladdning
