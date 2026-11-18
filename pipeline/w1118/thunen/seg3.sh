#!/bin/bash
cd /home/claude/w1118/thunen
python3 render_seg.py 165 190 out/s3B.mp4 || exit 1
ffmpeg -y -loglevel error -i out/silent.mp4 -vf "select='lt(n\,165)',setpts=N/30/TB" -r 30 -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p out/s3A.mp4
ffmpeg -y -loglevel error -i out/silent.mp4 -vf "select='gte(n\,190)',setpts=N/30/TB" -r 30 -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p out/s3C.mp4
printf "file 's3A.mp4'\nfile 's3B.mp4'\nfile 's3C.mp4'\n" > out/list3.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/list3.txt -c copy out/silent3.mp4 && echo SPLICE_OK
