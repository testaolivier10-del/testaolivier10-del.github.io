#!/bin/bash
k=w1108-01-penny-doubling; d=/home/claude/w1108/out/$k; cd $d
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,bit_rate,duration -show_entries format=duration,bit_rate -of compact final.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo "silences>1.2s: $(ffmpeg -hide_banner -i final.mp4 -af silencedetect=n=-45dB:d=1.2 -f null - 2>&1 | grep -c silence_start || true)"
echo "black: $(ffmpeg -hide_banner -i final.mp4 -vf blackdetect=d=0.1 -an -f null - 2>&1 | grep -c black_start || true)"
cd /home/claude/w1108 && python3 /home/claude/lp/transcript_check.py spec_w1108_01 out/$k/final_nomusic.mp4 --out out/$k/transcript.json 2>&1 | tail -12
cd $d && python3 /home/claude/lp/motion_qc.py final.mp4 --out motion_qc 2>&1 | grep -v Fontconfig | tail -8
mkdir -p strips && ffmpeg -y -loglevel error -i final.mp4 -vf "fps=4,scale=270:480,tile=8x2" strips/strip_%02d.png
echo GATES_DONE
