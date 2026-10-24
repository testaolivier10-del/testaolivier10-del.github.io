import sys, subprocess
sys.path.insert(0, '/home/claude/runner')
import numpy as np, skia, model, partrig, perf, mocap_perf as MP
from PIL import Image
m0, m1, speed = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]); name = sys.argv[4]
rig, spec, joints, radius = model.build()
rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
P = MP.MocapPerformer(rig, spec, lambda t: perf.plan_m(m0 + t * speed), ground_take=perf.START)
P.extra = lambda t: perf.extra_m(m0 + t * speed)
prev = None; jumps = []
n = int((m1 - m0) / speed * 60); sc = 0.5; tiles = []; gaps = 0
proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '900x700', '-r', '60', '-i', '-',
                         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', f't/{name}.mp4'], stdin=subprocess.PIPE)
xs = []
for i in range(n):
    W = P.pose(i / 60); xs.append(P.x)
    pts = np.array([rig.tail(W, n) - np.array([P.x, 0]) for n in rig.order])
    if prev is not None: jumps.append((np.abs(pts - prev).max(), m0 + i / 60 * speed))
    prev = pts
    xf = np.array([[sc, 0, 450 - sc * P.x], [0, sc, 330], [0, 0, 1.0]])
    s = skia.Surface(900, 700); c = s.getCanvas(); c.clear(skia.Color(205, 205, 205))
    gy = 330 + sc * (P.ground + model.ANKLE_H)
    c.drawLine(0, gy, 900, gy, skia.Paint(Color=skia.Color(120, 120, 120), StrokeWidth=2))
    for k in range(-5, 60):
        x = (k * 200 - P.x) * sc + 450
        c.drawLine(x, gy, x, gy + 20, skia.Paint(Color=skia.Color(120, 120, 120), StrokeWidth=2))
    rig.draw(c, W, xf)
    c.drawString(f'M {m0 + i / 60 * speed:.3f}', 20, 40, skia.Font(None, 28), skia.Paint(Color=skia.ColorBLACK))
    g = partrig.gap_check(rig, W, xf, (900, 700), joints, radius)
    if max(g[j] for j in joints) > 0.02 or g['components'] > 1: gaps += 1
    fr = s.makeImageSnapshot().toarray(); proc.stdin.write(fr.tobytes())
    if i % max(1, n // 24) == 0 and len(tiles) < 24: tiles.append(fr[100:700, 200:700, [2, 1, 0]])
proc.stdin.close(); proc.wait()
rows = [np.concatenate(tiles[r * 8:(r + 1) * 8], 1) for r in range(len(tiles) // 8)]
Image.fromarray(np.concatenate(rows, 0)).resize((2000, 300 * len(rows))).save(f't/{name}_sheet.png')
v = np.diff(xs) * 60 / speed
jumps.sort(reverse=True); print('biggest per-frame joint moves', [(round(a), round(b, 3)) for a, b in jumps[:6]])
print('frames', n, 'gap frames', gaps, 'speed min/max (rig px per mocap s) after launch', v[int(len(v) * 0.5):].min().round(), v[int(len(v) * 0.5):].max().round())
