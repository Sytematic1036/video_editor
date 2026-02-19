#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-016_v3_20260219_1420_287326c
# Skapad: 2026-02-19

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_ITERATION="../iterations/v3_live-drag-scroll/src"

echo "Rullar tillbaka till: GUI_EXP-016_v3_20260219_1420_287326c"
cp -r "$SCRIPT_DIR/frontend/"* "$TARGET_ITERATION/"
echo "Klar! Starta om servern för att aktivera."
