#!/bin/bash
# Long video pipeline setup (16:9). Run from /home/claude/lp after the project files are written there.
set -e
cd /home/claude/lp
[ -f package.json ] || npm init -y >/dev/null
npm i playwright-core gsap @fontsource/inter @fontsource/kalam 3dmol >/dev/null 2>&1
mkdir -p assets out long
for w in 700 800 900; do cp node_modules/@fontsource/inter/files/inter-latin-$w-normal.woff2 assets/; done
pip install --break-system-packages -q pillow numpy soundfile rdkit cairosvg >/dev/null 2>&1 || true
# sound effects: synthesized UI sounds (sfx.py) plus the real CC0 library from the media branch (sfx/)
[ -f sfx.py ] && python3 sfx.py >/dev/null 2>&1 || true
[ -d /tmp/m/.git ] && git -C /tmp/m sparse-checkout add /sfx/ 2>/dev/null || true
[ -d /tmp/m/sfx ] && cp /tmp/m/sfx/*.wav assets/ 2>/dev/null || true
ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome | tail -1
echo long setup done
