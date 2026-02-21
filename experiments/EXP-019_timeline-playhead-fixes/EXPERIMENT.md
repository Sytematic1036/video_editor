# EXP-019: Timeline & Playhead Fixes

## Status
`VERIFIED`

## Bygger fran
- EXP-018_merge-html-mp4-video-editor

## Mal
1. Tidslinjen for alla filmer och ljudfiler ska ga lika langt som den langsta filen
2. Playhead maste hela tiden synas i bild med lite marginal pa hogersidan over hela tidslinjen

## Target Repo
https://github.com/Sytematic1036/video_editor

## Arkitektur
- **Backend:** Flask (Python)
- **Frontend:** Vanilla JavaScript (inline i HTML)
- **Port:** 5022

## Framgangskriterier
1. [x] Alla tracks (video, audio, speech) har samma bredd
2. [x] Tidslinjen ar lika lang som den langsta filen
3. [x] Playhead scrollar automatiskt in i bild med marginal
4. [x] Playhead ar synlig aven utan filer i tidslinjen
5. [x] Playwright-tester passerar

## Teknisk approach

### Problem 1: Timeline width
- `renderVideoTrack()` saknar speech clips i maxDuration-berakningen
- Varje track beraknar sin egen bredd separat
- **Fix:** Skapa gemensam `getTimelineMaxDuration()` funktion som alla tracks anvander

### Problem 2: Playhead visibility
- `ensurePlayheadVisible()` behover battre marginalhantering
- Playhead kan forsvinna till hoger vid drag
- **Fix:** Forbattra marginalberakning och auto-scroll

## Filer
- `iterations/v1_autonomous_2026-02-21/src/templates/index.html` - Fixed GUI
