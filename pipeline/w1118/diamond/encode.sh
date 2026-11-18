#!/bin/bash
cd /home/claude/w1118/diamond/out
for m in music nomusic; do n=final; [ $m = nomusic ] && n=final_nomusic
ffmpeg -y -loglevel error -threads 1 -i silent.mp4 -i mix_$m.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest $n.mp4; done
echo ENCODE_OK
