#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-011_v3_20260218_0745_30b4fb5
# Skapad: 2026-02-18 07:45

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")/iterations/v3_fix_delete_split_clips_2026-02-18/src"

echo "Rullar tillbaka till: GUI_EXP-011_v3_20260218_0745_30b4fb5"
echo "Källa: $SCRIPT_DIR/frontend"
echo "Mål: $TARGET_DIR"

cp -r "$SCRIPT_DIR/frontend/"* "$TARGET_DIR/"

echo "Klar! Starta om servern för att aktivera:"
echo "  cd $TARGET_DIR && python app.py"
