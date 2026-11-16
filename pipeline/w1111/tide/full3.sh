#!/bin/bash
# last fix round: every shot changed, full render, two processes
cd /home/claude/w1111/tide
python3 render2.py 0 600 out/q1.mp4 > out/r1.log 2>&1 &
python3 render2.py 600 1182 out/q2.mp4 > out/r2.log 2>&1 &
wait
printf "file 'q1.mp4'\nfile 'q2.mp4'\n" > out/list3.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/list3.txt -c copy out/silent3.mp4 && echo RENDER_OK > out/render3.status
