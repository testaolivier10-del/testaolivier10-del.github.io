import sys; sys.path.insert(0,'/home/claude/mocap'); sys.path.insert(0,'/home/claude/rig'); sys.path.insert(0,'/home/claude/runner')
import numpy as np, skia, model, partrig, mocap_perf as MP
from scipy import ndimage
from PIL import Image
TK = MP.Take('104_55', near='Left')
rig, spec, joints, radius = model.build()
rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
P = MP.MocapPerformer(rig, spec, lambda t: [('a', TK, 1.2 + t * 0.5, 1.0)], ground_take=TK)
bad = []; rng = np.random.default_rng(1); n = int(1.9 / 0.5 * 60); big = {}
for i in range(n):
    W = P.pose(i / 60); tau = 1.2 + i / 60 * 0.5
    if i % 3: continue
    for sc in (0.35, 0.7, 1.1):
        ox, oy = rng.uniform(300, 700), rng.uniform(300, 600)
        xf = np.array([[sc, 0, ox - sc * P.x], [0, sc, oy], [0, 0, 1.0]])
        g = partrig.gap_check(rig, W, xf, (1080, 1920), joints, radius, down=1.0)
        s = skia.Surface(1080, 1920); c = s.getCanvas(); c.clear(skia.ColorTRANSPARENT); rig.draw(c, W, xf)
        a = s.makeImageSnapshot().toarray()[..., 3] > 127
        lab, k = ndimage.label(a); pieces = int((np.bincount(lab.ravel())[1:] > 3).sum())
        if max(g[j] for j in joints) > 0.02 or pieces > 1:
            bad.append((round(tau, 3), sc, pieces, {j: round(g[j], 2) for j in joints if g[j] > 0.02}))
    for want in (1.7, 1.95, 2.03, 2.3, 2.6, 2.9):
        if abs(tau - want) < 0.004 and want not in big:
            s = skia.Surface(900, 1100); c = s.getCanvas(); c.clear(skia.Color(205, 205, 205))
            rig.draw(c, W, np.array([[1.0, 0, 450 - P.x], [0, 1.0, 560], [0, 0, 1.0]]))
            big[want] = s.makeImageSnapshot().toarray()[..., [2, 1, 0]]
print('checked', len(range(0, n, 3)) * 3, 'breaks', len(bad), bad[:8])
ims = [big[k] for k in sorted(big)]
Image.fromarray(np.concatenate(ims, 1)).resize((450 * len(ims), 550)).save('t/big.png')
