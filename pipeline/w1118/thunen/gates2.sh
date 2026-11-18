#!/bin/bash
cd /home/claude/w1118/thunen/out
for n in music nomusic; do f=final; [ $n = nomusic ] && f=final_nomusic
ffmpeg -y -loglevel error -i silent.mp4 -i mix_$n.wav -map 0:v -map 1:a -c:v libx264 -preset medium -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart $f.mp4; done
for f in final final_nomusic; do ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate,duration,nb_frames -of compact $f.mp4; ffmpeg -i $f.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A20 Summary | grep -E " I:|Peak:"; done
python3 /home/claude/lp/motion_qc.py final.mp4 --out motion_qc3 2>&1 | grep -v Fontconfig | tail -6
ffmpeg -y -loglevel error -i final.mp4 -vf "fps=4,scale=270:-1,tile=8x4" strips/v3_%02d.jpg
cd .. && python3 -c "
t=open('vo.txt').read().strip(); open('tspec.py','w').write('SPEC = {\"beats\": [{\"vo\": %r}]}\n' % t)"
python3 /home/claude/lp/transcript_check.py tspec out/final_nomusic.mp4 --out out/transcript3.json 2>&1 | tail -5
python3 thumb.py 2>&1 | grep -v Fontconfig
echo GATES2_DONE
cd /home/claude/w1118/thunen/out && ffmpeg -y -loglevel error -i final.mp4 -vf "fps=4,crop=700:700:150:600,scale=200:200,tile=10x6" strips/v3_arms_%02d.jpg
echo ALL_DONE
