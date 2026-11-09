#!/bin/bash
# splice the re-rendered frames 690-999 (piece.mp4) into silent.mp4 -> silent2.mp4 (lossless-ish crf 14)
O=/home/claude/lp/w1031r/out/w1031-03-mirror-mint
ffmpeg -y -loglevel error -i $O/silent.mp4 -i $O/piece.mp4 -filter_complex \
 "[0:v]trim=start_frame=0:end_frame=690,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=1000,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
 -map "[v]" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 30 $O/silent2.mp4
