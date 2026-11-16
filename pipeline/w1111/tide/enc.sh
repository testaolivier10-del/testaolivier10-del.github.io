#!/bin/bash
cd /home/claude/w1111/tide
ffmpeg -y -loglevel error -i out/silent3.mp4 -i out/mix_music.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest out/final.mp4 && \
ffmpeg -y -loglevel error -i out/final.mp4 -i out/mix_nomusic.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 44100 -movflags +faststart out/final_nomusic.mp4 && echo ENC_OK > out/enc.status
