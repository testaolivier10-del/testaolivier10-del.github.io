#!/bin/bash
d=/home/claude/w1108/out/w1108-01-penny-doubling; cd $d
for m in music nomusic; do o=final.mp4; [ $m = nomusic ] && o=final_nomusic.mp4
ffmpeg -y -loglevel error -i silent.mp4 -i mix_$m.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart $o; done
echo ENC_DONE
/home/claude/w1108/01/gates2.sh
