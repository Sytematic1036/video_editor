#!/bin/bash
# Rulla tillbaka till version: GUI_EXP-019_v2_20260221_1122_895cd03
# Skapad: 2026-02-21 11:22

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$SCRIPT_DIR/../../../src"

echo "Rullar tillbaka till: GUI_EXP-019_v2_20260221_1122_895cd03"
cp -r "$SCRIPT_DIR/src/"* "$TARGET/"
echo "Klar! Starta om servern for att aktivera."
