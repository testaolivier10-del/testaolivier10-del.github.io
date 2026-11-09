#!/bin/bash
# final encode: H.264 10 Mbps (maxrate 12M), yuv420p, 30 fps, AAC 192k 44.1 kHz, faststart
O=/home/claude/lp/w1031r/out/w1031-03-mirror-mint
for v in music nomusic; do
  f=$O/final.mp4; [ $v = nomusic ] && f=$O/final_nomusic.mp4
  ffmpeg -y -loglevel error -i $O/silent.mp4 -i $O/mix_$v.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M \
    -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart $f
done
ls -l $O/final*.mp4
