#!/bin/bash
cd /home/claude/w1118/thunen
python3 render_seg.py 272 720 out/segB.mp4 && python3 render_seg.py 1077 1350 out/segD.mp4 || exit 1
ffmpeg -y -loglevel error -i out/silent_v1.mp4 -vf "select='lt(n\,272)',setpts=N/30/TB" -r 30 -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p out/segA.mp4
ffmpeg -y -loglevel error -i out/silent_v1.mp4 -vf "select='between(n\,720\,1076)',setpts=N/30/TB" -r 30 -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p out/segC.mp4
printf "file 'segA.mp4'\nfile 'segB.mp4'\nfile 'segC.mp4'\nfile 'segD.mp4'\n" > out/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/list.txt -c copy out/silent.mp4 && echo RENDER_OK
