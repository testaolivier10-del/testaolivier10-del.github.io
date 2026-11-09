#!/bin/bash
# encode final.mp4 and final_nomusic.mp4 (10 Mbps H.264, maxrate 12M, AAC 192k) and print the Gate B numbers
d=/home/claude/lp/w1031r/out/w1031-02-phineas-gage; cd $d
for n in music nomusic; do f=final.mp4; [ $n = nomusic ] && f=final_nomusic.mp4
ffmpeg -y -loglevel error -i silent.mp4 -i mix_$n.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart $f; done
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,bit_rate,duration -show_entries format=duration,bit_rate -of compact final.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo "silences>1.2s: $(ffmpeg -hide_banner -i final.mp4 -af silencedetect=n=-45dB:d=1.2 -f null - 2>&1 | grep -c silence_start || true)"
