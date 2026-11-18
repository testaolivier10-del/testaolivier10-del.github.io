#!/bin/bash
cd /home/claude/w1118/thunen/out
for f in final final_nomusic; do ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate,duration,pix_fmt,nb_frames -of compact $f.mp4; ffmpeg -i $f.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A20 Summary | grep -E " I:|Peak:"; done
python3 /home/claude/lp/motion_qc.py final.mp4 --out motion_qc 2>&1 | grep -v Fontconfig | tail -4
ffmpeg -i final.mp4 -af silencedetect=n=-45dB:d=1.2 -f null - 2>&1 | grep silence_ | head
ffmpeg -y -loglevel error -i final.mp4 -vf "fps=4,scale=270:-1,tile=8x4" strips/s%02d.jpg
cd .. && python3 /home/claude/lp/transcript_check.py tspec out/final_nomusic.mp4 --out out/transcript.json 2>&1 | tail -5
echo GATES_DONE
