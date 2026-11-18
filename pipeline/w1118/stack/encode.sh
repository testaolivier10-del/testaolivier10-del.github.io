cd /home/claude/w1118/stack/out
for v in music nomusic; do n=$([ $v = music ] && echo final || echo final_nomusic); ffmpeg -y -loglevel error -i silent.mp4 -i mix_$v.wav -map 0:v -map 1:a -c:v libx264 -preset veryfast -b:v 10M -maxrate 12M -bufsize 20M -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest $n.mp4; done
echo ENC_OK
