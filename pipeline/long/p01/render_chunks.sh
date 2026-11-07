# worker $1 of 2: renders chunks i where i % 2 == $1; a chunk is done when its .done file exists
cd /home/claude/lv
N=22920; C=1500
i=$1
while [ $((i*C)) -lt $N ]; do
  a=$((i*C)); b=$(( (i+1)*C < N ? (i+1)*C : N ))
  if [ ! -f out/parts/c$i.done ]; then
    python3 -c "
import sys; sys.path.insert(0,'/home/claude/lv')
import render as R, subprocess, skia
a,b=$a,$b
ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','bgra','-s','1920x1080','-r','30','-i','-','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','out/parts/c$i.mp4'],stdin=subprocess.PIPE)
s=skia.Surface(1920,1080)
for f in range(a,b):
    R.frame(f/30,s); ff.stdin.write(s.makeImageSnapshot().tobytes())
ff.stdin.close(); ff.wait()
" && touch out/parts/c$i.done
  fi
  i=$((i+2))
done
