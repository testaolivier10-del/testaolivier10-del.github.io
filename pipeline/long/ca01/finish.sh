#!/bin/bash
# concat the chunks, limit the mix, two pass H.264 sized for the media branch (< 100 MB), AAC 192k, and a 720p review copy
set -e
cd /home/claude/lv/out
N=$(ls parts/c*.done | wc -l); echo "chunks done: $N"
(cd parts && ls c*.mp4 | sort -V | sed "s|^|file '|; s|$|'|" > list.txt)
ffmpeg -y -v error -f concat -safe 0 -i parts/list.txt -c copy silent.mp4
ffmpeg -y -v error -i mix.wav -af "volume=4.4dB,alimiter=limit=0.71:attack=2:release=80:level=false" -ar 44100 mix_lim.wav
ffmpeg -y -v error -i silent.mp4 -c:v libx264 -preset slow -tune animation -b:v 600k -pass 1 -passlogfile p2 -an -f null /dev/null
ffmpeg -y -v error -i silent.mp4 -i mix_lim.wav -map 0:v -map 1:a -c:v libx264 -preset slow -tune animation -b:v 600k -pass 2 -passlogfile p2 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart final.mp4
ffmpeg -y -v error -i final.mp4 -vf scale=1280:720 -c:v libx264 -preset veryfast -crf 26 -c:a aac -b:a 128k -movflags +faststart review_720p.mp4
ls -la final.mp4 review_720p.mp4
