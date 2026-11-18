#!/bin/bash
cd /home/claude/w1118/thunen/out
ffmpeg -y -loglevel error -i silent.mp4 -i mix_nomusic.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart final_nomusic.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate,duration,nb_frames -of compact final_nomusic.mp4; ffmpeg -i final_nomusic.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A20 Summary | grep -E " I:|Peak:"
cd .. && python3 /home/claude/lp/transcript_check.py tspec out/final_nomusic.mp4 --out out/transcript.json 2>&1 | tail -5
echo NM_DONE
