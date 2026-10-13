#!/bin/bash
set -e
mkdir -p /home/claude/lp/{assets,kokoro,out} && cd /home/claude/lp
[ -f package.json ] || npm init -y >/dev/null
npm i playwright-core gsap @fontsource/inter >/dev/null 2>&1
for w in 700 800 900; do cp node_modules/@fontsource/inter/files/inter-latin-$w-normal.woff2 assets/; done
pip install --break-system-packages -q kokoro-onnx soundfile numpy pillow
[ -f kokoro/kokoro-v1.0.onnx ] || curl -sL -o kokoro/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
[ -f kokoro/voices-v1.0.bin ] || curl -sL -o kokoro/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd assets
ff() { ffmpeg -y -loglevel error "$@"; }
ff -f lavfi -i "aevalsrc='sin(2*PI*(500+900*t)*t)*exp(-t*28)':d=0.18:s=44100" pop.wav
ff -f lavfi -i "aevalsrc='sin(2*PI*1800*t)*exp(-t*90)':d=0.06:s=44100" tick.wav
ff -f lavfi -i "aevalsrc='sin(2*PI*950*t)*exp(-t*80)':d=0.07:s=44100" tock.wav
ff -f lavfi -i "aevalsrc='(sin(2*PI*1320*t)+0.6*sin(2*PI*1760*t))*exp(-t*6)*0.6':d=0.9:s=44100" ding.wav
ff -f lavfi -i "aevalsrc='sin(2*PI*(70+80*exp(-t*30))*t)*exp(-t*9)':d=0.35:s=44100" punch.wav
ff -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.5,highpass=f=800,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.15" whoosh.wav
ff -f lavfi -i "aevalsrc='sin(2*PI*220*t)*exp(-t*14)+0.5*sin(2*PI*180*t)*exp(-t*10)':d=0.4:s=44100" buzz.wav
echo setup done

# Manim (optional second animation tool for graphs, equations, mechanisms, 3D molecules)
apt-get install -y -q libpango1.0-dev pkg-config >/dev/null 2>&1 || (apt-get update -q >/dev/null 2>&1 && apt-get install -y -q libpango1.0-dev pkg-config >/dev/null 2>&1)
[ -x /home/claude/lp/mvenv/bin/manim ] || (cd /home/claude/lp && python3 -m venv --system-site-packages mvenv && ./mvenv/bin/pip install -q --upgrade pip setuptools wheel && ./mvenv/bin/pip install -q manim)

# Science and illustration tools (added 2026-10-12): RDKit molecules, 3Dmol.js 3D molecules,
# cairosvg previews, Bioicons/Servier drawings (fetched on demand by medart.py from GitHub)
cd /home/claude/lp
npm i 3dmol >/dev/null 2>&1
pip install --break-system-packages -q rdkit cairosvg
# synthesized effects (sfx.py) and real sounds already fetched from Freesound (media branch sfx/)
[ -f sfx.py ] && python3 sfx.py >/dev/null 2>&1 || true
[ -d /tmp/m/sfx ] && cp /tmp/m/sfx/* /home/claude/lp/assets/ 2>/dev/null || true
echo science tools ready
