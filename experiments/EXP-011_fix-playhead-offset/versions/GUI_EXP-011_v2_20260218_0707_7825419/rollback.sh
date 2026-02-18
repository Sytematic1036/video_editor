#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-011_v2_20260218_0707_7825419
# Skapad: 2026-02-18 07:07

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")/iterations/v2_fix_speech_offset_2026-02-18/src"

echo "Rullar tillbaka till: GUI_EXP-011_v2_20260218_0707_7825419"
echo "Källa: $SCRIPT_DIR/frontend"
echo "Mål: $TARGET_DIR"

cp -r "$SCRIPT_DIR/frontend/"* "$TARGET_DIR/"

echo "Klar! Starta om servern för att aktivera:"
echo "  cd $TARGET_DIR && python app.py"
