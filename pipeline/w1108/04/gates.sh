#!/bin/bash
# encode + Gate B/C checks for w1108-04
set -e
k=w1108-04-zeno-paradox; d=/home/claude/w1108/out/$k; cd $d
for m in music nomusic; do
  f=final; [ $m = nomusic ] && f=final_nomusic
  ffmpeg -y -loglevel error -i silent.mp4 -i mix_$m.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart $f.mp4
done
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,bit_rate,duration -show_entries format=duration,bit_rate -of compact final.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo "silences>1.2s: $(ffmpeg -hide_banner -i final.mp4 -af silencedetect=n=-45dB:d=1.2 -f null - 2>&1 | grep -c silence_start || true)"
python3 /home/claude/lp/motion_qc.py final.mp4 --out motion_qc 2>&1 | grep -v Fontconfig | tail -8
mkdir -p strips && ffmpeg -y -loglevel error -i final.mp4 -vf "fps=4,scale=270:480,tile=8x2" strips/strip_%02d.png
cd /home/claude/w1108/04 && python3 /home/claude/lp/transcript_check.py spec_w1108_04_zeno_paradox $d/final_nomusic.mp4 --out $d/transcript.json 2>&1 | tail -12
