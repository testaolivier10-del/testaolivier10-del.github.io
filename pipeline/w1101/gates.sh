#!/bin/bash
# final Gate B/C checks for one Short: gates.sh <id>
cd /home/claude/lp/w1101; k=$1; m=${k//-/_}
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,bit_rate -show_entries format=duration,bit_rate -of compact out/$k/final.mp4
ffmpeg -hide_banner -i out/$k/final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
ffmpeg -hide_banner -i out/$k/final.mp4 -af silencedetect=n=-45dB:d=1.2 -f null - 2>&1 | grep -c silence_start
python3 ../motion_qc.py out/$k/final.mp4 --out out/$k/motion_qc 2>&1 | grep -v Fontconfig | tail -3
python3 ../transcript_check.py $m out/$k/final_nomusic.mp4 --out out/$k/transcript.json 2>&1 | tail -3
