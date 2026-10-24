"""Retarget CMU StartRun takes onto the runner and render a test strip / video."""
import sys, subprocess
sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig'); sys.path.insert(0, '/home/claude/runner')
import numpy as np, skia
from PIL import Image
import model, partrig, mocap_perf as MP

code = sys.argv[1]; t0 = float(sys.argv[2]); t1 = float(sys.argv[3]); near = sys.argv[4] if len(sys.argv) > 4 else 'Left'
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
TK = MP.Take(code, near=near, skip=0.0)
def plan(t):
    return [('a', TK, t0 + t * speed, 1.0)]
rig, spec, joints, radius = model.build()
rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
P = MP.MocapPerformer(rig, spec, plan, ground_take=TK)
n = int((t1 - t0) / speed * 60)
sc = 0.5
frames = []; tiles = []; gaps = 0
proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '900x700', '-r', '60', '-i', '-',
                         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', f't/{code}.mp4'], stdin=subprocess.PIPE)
x0 = None
for i in range(n):
    W = P.pose(i / 60)
    if x0 is None: x0 = P.x
    xf = np.array([[sc, 0, 300 - sc * x0 + 0 * P.x], [0, sc, 330], [0, 0, 1.0]])
    xf[0, 2] = 450 - sc * P.x
    s = skia.Surface(900, 700); c = s.getCanvas(); c.clear(skia.Color(205, 205, 205))
    gy = 330 + sc * (P.ground + model.ANKLE_H)
    c.drawLine(0, gy, 900, gy, skia.Paint(Color=skia.Color(120, 120, 120), StrokeWidth=2))
    for k in range(-5, 30):     # ground ticks show travel
        x = (k * 200 - P.x) * sc + 450
        c.drawLine(x, gy, x, gy + 20, skia.Paint(Color=skia.Color(120, 120, 120), StrokeWidth=2))
    rig.draw(c, W, xf)
    g = partrig.gap_check(rig, W, xf, (900, 700), joints, radius)
    if max(g[j] for j in joints) > 0.02 or g['components'] > 1: gaps += 1
    fr = s.makeImageSnapshot().toarray()
    proc.stdin.write(fr.tobytes())
    if i % int(max(1, n / 12)) == 0: tiles.append(fr[100:700, 150:750, [2, 1, 0]])
proc.stdin.close(); proc.wait()
Image.fromarray(np.concatenate([np.concatenate(tiles[:6], 1), np.concatenate(tiles[6:12], 1)], 0)).resize((1800, 600)).save(f't/{code}_sheet.png')
print('frames', n, 'gap frames', gaps)
