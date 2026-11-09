"""render the Short in N parallel segments, then join: render_par.py <out.mp4> [N]"""
import sys, subprocess, os
out = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 2
if len(sys.argv) > 3:          # worker: render frames [a, b)
    a, b = int(sys.argv[3]), int(sys.argv[4])
    sys.argv = ['x']
    import build as B
    W, H, FPS = 1080, 1920, 30
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    for fi in range(a, b):
        ff.stdin.write(B.SHORT.frame(fi / FPS).makeImageSnapshot().tobytes())
    ff.stdin.close(); ff.wait(); sys.exit(0)
sys.argv = ['x']
import build as B
n = int(round(B.DUR * 30)); cuts = [round(n * i / N) for i in range(N + 1)]
d = os.path.dirname(os.path.abspath(out))
segs = [f'{d}/seg{i}.mp4' for i in range(N)]
ps = [subprocess.Popen([sys.executable, __file__, segs[i], str(N), str(cuts[i]), str(cuts[i + 1])]) for i in range(N)]
for p in ps: p.wait()
open(f'{d}/segs.txt', 'w').write(''.join(f"file '{s}'\n" for s in segs))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'{d}/segs.txt', '-c', 'copy', out], check=True)
print('frames', n)
