#!/bin/bash
cd /home/claude/w1111/smog/out
for n in music nomusic; do o=final; [ $n = nomusic ] && o=final_nomusic
nice ffmpeg -y -loglevel error -i silent.mp4 -i mix_$n.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest $o.mp4 &
done
wait; echo ENC_OK
