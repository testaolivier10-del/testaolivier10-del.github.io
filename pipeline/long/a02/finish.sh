set -e
cd /home/claude/lv/out
printf "file 'p0.mp4'\nfile 'p1.mp4'\n" > parts/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i parts/list.txt -c copy video_silent.mp4
ffmpeg -y -loglevel error -i video_silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart yt-ap-02-terminology-directional-terms.mp4
ffmpeg -y -loglevel error -i yt-ap-02-terminology-directional-terms.mp4 -vf scale=1280:720 -c:v libx264 -preset veryfast -crf 26 -c:a aac -b:a 128k -movflags +faststart review_720p.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 yt-ap-02-terminology-directional-terms.mp4
ls -la *.mp4
