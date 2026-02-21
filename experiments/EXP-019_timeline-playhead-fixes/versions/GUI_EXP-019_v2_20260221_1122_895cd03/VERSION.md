# GUI_EXP-019_v2_20260221_1122_895cd03

## Metadata
- **Stamplad:** 2026-02-21 11:22
- **Git commit:** 895cd03 - Add EXP-019 v2: Ruler full length fix
- **Experiment:** EXP-019_timeline-playhead-fixes
- **Iteration:** v2_ruler-full-length
- **Status:** FUNGERAR

## Beskrivning
Timeline och playhead-fixar for video_editor:
1. Alla tracks har samma bredd (langsta filen)
2. Playhead syns alltid med marginal pa hogersidan
3. Rulers visar sekundmarkeringar for hela tidslinjen

## Komponenter
### Frontend
- `templates/index.html` - Merged GUI med fixar

### Backend
- `app.py` - Flask backend
- `concat.py` - Video concatenation
- `html_converter.py` - HTML to MP4 converter

## Vad fungerar
- [x] Alla tracks har samma bredd
- [x] Playhead auto-scrollar med 30% hogermarginal
- [x] Rulers visar hela tidslinjens langd
- [x] Sekundmarkeringar for hela tidslinjen
- [x] 18/18 Playwright-tester passerar

## Andringar fran v1
- Rulers anvander nu `getTimelineMaxDuration()` istallet for lokal berakning
- Rulers matchar alltid track-bredden

## Testresultat
```
Ruler Tests: 6/6 PASS
Timeline Tests: 5/5 PASS
Playhead Tests: 7/7 PASS
Total: 18/18 PASS
```

## Beroenden
- Python 3.x
- Flask
- Playwright
- FFmpeg

## Port
- 5022

## Rollback
```bash
cd experiments/EXP-019_timeline-playhead-fixes/versions/GUI_EXP-019_v2_20260221_1122_895cd03
./rollback.sh
```
