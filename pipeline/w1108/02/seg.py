import sys, subprocess
sys.path[:0] = ['/home/claude/w1108/02']
import build as B
a, b, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
f0, f1 = int(round(a * 30)), int(round(b * 30))
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
for fi in range(f0, f1):
    ff.stdin.write(B.SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
ff.stdin.close(); ff.wait(); print('seg frames', f1 - f0, f0, f1)
