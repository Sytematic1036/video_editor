#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-011_v4_20260218_0814_e174cf1
# Skapad: 2026-02-18 08:14

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")/iterations/v4_undo_redo_2026-02-18/src"

echo "Rullar tillbaka till: GUI_EXP-011_v4_20260218_0814_e174cf1"
echo "Källa: $SCRIPT_DIR/frontend"
echo "Mål: $TARGET_DIR"

cp -r "$SCRIPT_DIR/frontend/"* "$TARGET_DIR/"

echo "Klar! Starta om servern för att aktivera:"
echo "  cd $TARGET_DIR && python app.py"
