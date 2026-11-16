#!/bin/bash
cd /home/claude/w1111/smog
nice -n 5 python3 render2.py 0 660 out/p1.mp4 > out/r1.log 2>&1 &
nice -n 5 python3 render2.py 660 1320 out/p2.mp4 > out/r2.log 2>&1 &
wait
printf "file 'p1.mp4'\nfile 'p2.mp4'\n" > out/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/list.txt -c copy out/silent.mp4 && echo RENDER_OK
