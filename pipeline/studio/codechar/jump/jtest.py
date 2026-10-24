"""Retarget CMU 13_11 (forward jump) onto the girl; sheet, video, pop scan, gap check."""
import sys, subprocess, math
sys.path.insert(0, '/home/claude/runner'); sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig'); sys.path.insert(0, '/home/claude/jump/side')
import numpy as np, skia
from PIL import Image
import model, partrig, mocap_perf as MP, perf
code = sys.argv[1]; t0, t1, speed = float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]); near = sys.argv[5] if len(sys.argv) > 5 else 'Left'
TK = MP.Take(code, near=near)
print('repaired', perf.repair(TK))
rig, spec, joints, radius = model.build()
rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
P = MP.MocapPerformer(rig, spec, lambda t: [('a', TK, t0 + t * speed, 1.0)], ground_take=TK)
n = int((t1 - t0) / speed * 60); sc = 0.55; tiles = []; gaps = 0; prev = None; jumps = []
proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '900x700', '-r', '60', '-i', '-',
                         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', f't_{code}.mp4'], stdin=subprocess.PIPE)
for i in range(n):
    W = P.pose(i / 60)
    pts = np.array([rig.tail(W, k) - np.array([P.x, 0]) for k in rig.order])
    if prev is not None: jumps.append((np.abs(pts - prev).max(), round(t0 + i / 60 * speed, 3)))
    prev = pts
    xf = np.array([[sc, 0, 380 - sc * P.x], [0, sc, 330], [0, 0, 1.0]])
    s = skia.Surface(900, 700); c = s.getCanvas(); c.clear(skia.Color(205, 205, 205))
    gy = 330 + sc * (P.ground + model.ANKLE_H)
    c.drawLine(0, gy, 900, gy, skia.Paint(Color=skia.Color(120, 120, 120), StrokeWidth=2))
    rig.draw(c, W, xf)
    g = partrig.gap_check(rig, W, xf, (900, 700), joints, radius)
    if max(g[j] for j in joints) > 0.02 or g['components'] > 1: gaps += 1
    fr = s.makeImageSnapshot().toarray(); proc.stdin.write(fr.tobytes())
    if i % max(1, n // 16) == 0 and len(tiles) < 16: tiles.append(fr[0:640, 150:650, [2, 1, 0]])
proc.stdin.close(); proc.wait()
rows = [np.concatenate(tiles[r * 8:(r + 1) * 8], 1) for r in range(len(tiles) // 8)]
Image.fromarray(np.concatenate(rows, 0)).resize((2000, 320 * len(rows))).save(f't_{code}_sheet.png')
jumps.sort(reverse=True); print('pops', jumps[:5]); print('frames', n, 'gap frames', gaps)
