#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-018_v2_20260221_0930_c83baa5
# Skapad: 2026-02-21 09:30

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$SCRIPT_DIR/../../iterations/v2_correct-video-editor/src"

echo "Rullar tillbaka till: GUI_EXP-018_v2_20260221_0930_c83baa5"
cp -r "$SCRIPT_DIR/src/"* "$TARGET/"
echo "Klar! Starta om servern för att aktivera."
