import sys, subprocess, os
sys.path[:0] = ['/home/claude/short', '/home/claude/mh', '/home/claude/dv']
import build as B
f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
tmp = out.replace('.mp4', '.part.mp4')
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
for fi in range(f0, f1):
    ff.stdin.write(B.SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
ff.stdin.close(); rc = ff.wait()
if rc == 0: os.replace(tmp, out); print('done', f0, f1)
