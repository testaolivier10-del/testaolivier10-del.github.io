#!/bin/bash
cd /home/claude/w1111/bank
N=$(python3 -c "import sys; sys.path.insert(0,'/home/claude/w1111/bank'); import build as B; print(int(round(B.DUR*30)))" 2>/dev/null)
H=$((N*46/100))
python3 render2.py 0 $H out/p1.mp4 > out/r1.log 2>&1 &
python3 render2.py $H $N out/p2.mp4 > out/r2.log 2>&1 &
wait
printf "file 'p1.mp4'\nfile 'p2.mp4'\n" > out/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/list.txt -c copy out/silent.mp4 && echo RENDER_OK $N
