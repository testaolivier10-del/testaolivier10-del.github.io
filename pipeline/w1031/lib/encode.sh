#!/bin/bash
# usage: encode.sh <id>
set -e
d=/home/claude/lp/w1031/out/$1; cd $d
python3 /home/claude/lp/w1031/lib/mix.py $1 | tail -1
ffmpeg -y -loglevel error -i silent.mp4 -i mix_music.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 8M -maxrate 10M -bufsize 16M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart final.mp4
ffmpeg -y -loglevel error -i silent.mp4 -i mix_nomusic.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 8M -maxrate 10M -bufsize 16M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart final_nomusic.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
