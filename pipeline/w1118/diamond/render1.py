"""single process render (the machine is shared): all frames to out/silent.mp4"""
import sys, subprocess, time
sys.path[:0] = ['/home/claude/w1118/diamond', '/home/claude/short']
import build as B
n = int(round(B.DUR * 30)); t0 = time.time()
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', 'out/silent.mp4'], stdin=subprocess.PIPE)
for fi in range(n):
    ff.stdin.write(B.SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
    if fi % 60 == 0: print(fi, n, round(time.time() - t0), flush=True)
ff.stdin.close(); ff.wait(); print('RENDER_OK', n, round(time.time() - t0))
