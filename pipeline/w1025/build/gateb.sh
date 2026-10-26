#!/bin/bash
# Gate B: format, loudness, silence, transcript. usage: gateb.sh <vid>
V=$1; M=${V//-/_}; O=/home/claude/w1025/out/$V
cd /home/claude/w1025/mods
echo "== $V"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate,pix_fmt,sample_rate,channels:format=duration,bit_rate -of compact $O/final.mp4
ffprobe -v error -show_entries format_tags=major_brand -of compact $O/final.mp4 >/dev/null
python3 -c "
import subprocess
d=open('$O/final.mp4','rb').read(200000); print('faststart', d.find(b'moov') < d.find(b'mdat'))"
ffmpeg -hide_banner -i $O/final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
ffmpeg -hide_banner -i $O/final_nomusic.mp4 -af silencedetect=n=-40dB:d=1.2 -f null - 2>&1 | grep -E "silence_(start|end)" | head -6
ffmpeg -hide_banner -i $O/final.mp4 -vf "blackdetect=d=0.1:pix_th=0.05" -an -f null - 2>&1 | grep blackdetect | head -3
python3 /home/claude/lp/transcript_check.py $M $O/final_nomusic.mp4 --out $O/transcript.json 2>&1 | tail -12; echo "exit $?"
