import sys, subprocess
sys.path[:0] = ['/home/claude/w1118/stack', '/home/claude/short', '/home/claude/guy']
import build as B
n = int(round(B.DUR * 30)); out = sys.argv[1]
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
for fi in range(n):
    ff.stdin.write(B.SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
    if fi % 100 == 0: print('frame', fi, flush=True)
ff.stdin.close(); ff.wait(); print('RENDER_OK', n)
