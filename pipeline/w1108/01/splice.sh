#!/bin/bash
d=/home/claude/w1108/out/w1108-01-penny-doubling; cd $d
read a b < seg_range.txt
ffmpeg -y -loglevel error -i silent_v2.mp4 -i seg.mp4 -filter_complex "[0:v]trim=start_frame=0:end_frame=$a,setpts=PTS-STARTPTS[x];[0:v]trim=start_frame=$b,setpts=PTS-STARTPTS[z];[x][1:v][z]concat=n=3:v=1:a=0[v]" -map "[v]" -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -r 30 silent.mp4
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 silent.mp4
/home/claude/w1108/01/enc.sh
