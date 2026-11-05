#!/bin/bash
# encode + Gate B/C checks for one w1104 Short: gates.sh <id>
set -e
k=$1; d=/home/claude/w1104/out/$k; cd $d
ffmpeg -y -loglevel error -i silent.mp4 -i mix_music.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart final.mp4
ffmpeg -y -loglevel error -i silent.mp4 -i mix_nomusic.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart final_nomusic.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,bit_rate,duration -show_entries format=duration,bit_rate -of compact final.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo "silences>1.2s: $(ffmpeg -hide_banner -i final.mp4 -af silencedetect=n=-45dB:d=1.2 -f null - 2>&1 | grep -c silence_start || true)"
python3 /home/claude/lp/motion_qc.py final.mp4 --out motion_qc 2>&1 | grep -v Fontconfig | tail -4
cd /home/claude/w1104 && python3 /home/claude/lp/transcript_check.py spec_${k//-/_} out/$k/final_nomusic.mp4 --out out/$k/transcript.json 2>&1 | tail -6
