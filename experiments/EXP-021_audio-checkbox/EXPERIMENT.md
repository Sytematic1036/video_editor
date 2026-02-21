# EXP-021: Audio Checkbox för HTML to MP4 Converter

## Status
EXPERIMENTAL

## Mål
Lägga till en kryssruta i HTML to MP4 Converter för att välja om ljud ska inkluderas.
- Default: utan ljud (unchecked)
- Om checked och HTML har audio: MP4 får ljudspår

## Bygger från
EXP-020 v4 (GUI_EXP-020_v4_20260221_1725_a86c271)

## Target Repo
https://github.com/Sytematic1036/video_editor

## Teknisk approach
1. Backend: Lägg till `include_audio` parameter i `/html-to-mp4` endpoint
2. html_converter.py: Skippa audio extraction om include_audio=False
3. Frontend: Lägg till checkbox i HTML to MP4 tab

## Framgångskriterier
1. [ ] Kryssruta "Include audio" syns i HTML to MP4 tab
2. [ ] Default = unchecked
3. [ ] checked + audio i HTML → MP4 med ljud
4. [ ] unchecked → MP4 utan ljud
5. [ ] API accepterar include_audio parameter
