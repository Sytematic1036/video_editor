#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-014_v1_20260218_1619_9ba1ce3
# Skapad: 2026-02-18 16:19

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$(dirname "$(dirname "$SCRIPT_DIR")")/iterations/v1_autonomous_2026-02-18/src"

echo "Rullar tillbaka till: GUI_EXP-014_v1_20260218_1619_9ba1ce3"
echo "Källa: $SCRIPT_DIR/frontend"
echo "Mål: $TARGET"

cp "$SCRIPT_DIR/frontend/app.py" "$TARGET/"
cp "$SCRIPT_DIR/frontend/concat.py" "$TARGET/"
cp "$SCRIPT_DIR/frontend/templates/index.html" "$TARGET/templates/"

echo "Klar! Starta om servern för att aktivera."
