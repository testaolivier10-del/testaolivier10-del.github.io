#!/bin/bash
# render, mix, encode and CBR one Short in the background: rr.sh <dir> <id>
cd /home/claude/lp/w1101/out/$2 && python3 /home/claude/lp/w1101/$1/build.py --out silent.mp4 > render.log 2>&1 && cd /home/claude/lp/w1101 && bash lib/encode.sh $2 > out/$2/enc.log 2>&1 && bash ../cbr.sh out/$2 && echo DONE >> out/$2/enc.log
