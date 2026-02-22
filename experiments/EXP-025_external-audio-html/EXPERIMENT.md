# EXP-025: External Audio for HTML-to-MP4

## Status: EXPERIMENTAL

## Mål
Möjliggör uppladdning av extern ljudfil i HTML-to-MP4-tabben. När användaren avmarkerat
"Include audio from HTML" ska de kunna ladda upp en separat MP3/WAV-fil som läggs till
i den exporterade MP4:n.

## Bygger på
- EXP-024 (generate-html-copy)
- EXP-021 (audio-checkbox)

## Skapad
2026-02-22

## Tekniska detaljer
- Backend: Ny parameter `external_audio_path` i `convert_html_to_mp4()`
- Backend: Ny endpoint `/upload-html-audio` för ljudfil-uppladdning
- Frontend: "Upload Audio File" knapp i HTML-to-MP4 tab
- FFmpeg: Muxar extern ljud med video, längsta fil bestämmer total längd

## Prioriteringsregler
1. Om extern ljudfil finns → använd den (ignorera HTML-ljud)
2. Om ingen extern fil men "Include audio" markerad → använd HTML-ljud
3. Annars → tyst video

## Edge cases
- Ljud längre än video → video förlängs med sista frame (eller tyst)
- Video längre än ljud → tystnad i slutet av videon
