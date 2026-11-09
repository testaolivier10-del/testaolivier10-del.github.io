"""render frames [f0, f1) of the Short to a silent piece (for splicing a fixed section into silent.mp4)"""
import sys, subprocess
sys.path[:0] = ['/home/claude/lp/w1031r/mint', '/home/claude/short']
import build as B
f0, f1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
for fi in range(f0, f1):
    ff.stdin.write(B.SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
ff.stdin.close(); ff.wait(); print('frames', f1 - f0)
