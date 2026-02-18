#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-013_v1_20260218_1312_80eca33
# Skapad: 2026-02-18 13:12

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")/iterations/v1_autonomous_2026-02-18/src"

echo "Rullar tillbaka till: GUI_EXP-013_v1_20260218_1312_80eca33"
echo "Källa: $SCRIPT_DIR/frontend"
echo "Mål: $TARGET_DIR"

cp -r "$SCRIPT_DIR/frontend/"* "$TARGET_DIR/"

echo "Klar! Starta om servern för att aktivera:"
echo "  cd $TARGET_DIR && python app.py"
