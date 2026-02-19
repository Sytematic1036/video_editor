#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-015_v1_20260219_1059_287326c
# Skapad: 2026-02-19

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$SCRIPT_DIR/../../iterations/v1_autonomous_2026-02-19/src"

echo "Rullar tillbaka till: GUI_EXP-015_v1_20260219_1059_287326c"
cp -r "$SCRIPT_DIR/frontend/"* "$TARGET/"
echo "Klar! Starta om servern för att aktivera."
