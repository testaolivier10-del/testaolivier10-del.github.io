#!/bin/bash
# Set up the code drawn studio (traced characters, motion capture, skia renderer) in a fresh cloud session.
# Run from anywhere after the media branch sparse checkout includes /pipeline/studio/ and /sfx/ :
#   bash /tmp/m/pipeline/studio/codechar/setup_codechar.sh
set -e
S=/tmp/m/pipeline/studio
pip install -q --break-system-packages skia-python svgpathtools scikit-learn opencv-python-headless soundfile scipy pillow numpy 2>/dev/null || true
which potrace >/dev/null || sudo apt-get install -y -q potrace >/dev/null
which inkscape >/dev/null || sudo apt-get install -y -q inkscape >/dev/null
mkdir -p /home/claude/rig /home/claude/trace /home/claude/mocap/cache /home/claude/runner /home/claude/neuro /home/claude/short /home/claude/lp/assets
cp $S/partrig/*.py /home/claude/rig/
cp $S/codechar/*.py $S/codechar/traced.json /home/claude/trace/ ; cp $S/codechar/fg.npy /home/claude/trace/ 2>/dev/null || true
cp $S/codechar/mocap/*.py /home/claude/mocap/
cp $S/codechar/runner/* /home/claude/runner/
cp $S/codechar/neuro/* /home/claude/neuro/
cp $S/codechar/kit/layout.py /home/claude/short/
mkdir -p /home/claude/jump && cp -r $S/codechar/jump/* /home/claude/jump/
cp /tmp/m/sfx/*.wav /home/claude/lp/assets/ 2>/dev/null || true
(cd /tmp/m/pipeline && python3 sfx.py >/dev/null 2>&1) || true      # UI sounds (swish, pop, check, wrong, shimmer, pat)
python3 -c "import sys; sys.path[:0]=['/home/claude/rig','/home/claude/trace','/home/claude/mocap','/home/claude/runner']; import partrig, model, mocap_perf; print('codechar studio ready')"
