"""re-render frames [a, b) of the Short into seg.mp4 (for splicing a fixed section into silent.mp4)"""
import sys, subprocess
sys.argv = ['x']
sys.path[:0] = ['/home/claude/w1108/01']
import build as B
a, b = int(round((B.T_FIVEM - 0.35) * 30)) - 2, int(round(B.T_E * 30)) + 2
print('frames', a, b)
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '/home/claude/w1108/out/w1108-01-penny-doubling/seg.mp4'], stdin=subprocess.PIPE)
for fi in range(a, b):
    ff.stdin.write(B.SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
ff.stdin.close(); ff.wait()
open('/home/claude/w1108/out/w1108-01-penny-doubling/seg_range.txt', 'w').write(f'{a} {b}')
