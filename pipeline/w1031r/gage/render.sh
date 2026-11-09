#!/bin/bash
# render the Short in 2 parallel chunks and join: render.sh <out.mp4>
cd /home/claude/lp/w1031r/gage
O=/home/claude/lp/w1031r/out/w1031-02-phineas-gage
python3 build.py --chunk 0/2 --out $O/part0.mp4 > $O/r0.log 2>&1 &
python3 build.py --chunk 1/2 --out $O/part1.mp4 > $O/r1.log 2>&1 &
wait
printf "file '%s'\nfile '%s'\n" $O/part0.mp4 $O/part1.mp4 > $O/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $O/parts.txt -c copy $1
echo done $(ffprobe -v error -show_entries format=duration -of csv=p=0 $1)
