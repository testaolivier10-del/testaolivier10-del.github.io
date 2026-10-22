#!/bin/bash
# Re-encode a rendered Short's video stream at a constant 8 Mbps (Gate B wants >= 6 Mbps; flat art compresses below it)
d=$1
for f in final final_nomusic; do
  ffmpeg -y -loglevel error -i "$d/$f.mp4" -c:v libx264 -preset medium -b:v 8M -minrate 8M -maxrate 8M -bufsize 16M -x264-params nal-hrd=cbr:force-cfr=1 -r 30 -pix_fmt yuv420p -c:a copy -movflags +faststart "$d/${f}_cbr.mp4" && mv "$d/${f}_cbr.mp4" "$d/$f.mp4"
done
