"""Every frame of both performances, drawn at several sizes and screen positions: count real breaks in the
drawn pixels (separate pieces, or a joint disc left uncovered)."""
import sys; sys.path.insert(0,'/home/claude/mocap'); sys.path.insert(0,'/home/claude/rig'); sys.path.insert(0,'/home/claude/trace'); sys.path.insert(0,'/home/claude/neuro')
import numpy as np, skia, model, partrig, mocap_perf as MP
from scipy import ndimage
import demo, neuro
def run(plan, take, n, name):
    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    P = MP.MocapPerformer(rig, spec, plan, ground_take=take)
    bad = []
    rng = np.random.default_rng(1)
    for i in range(n):
        W = P.pose(i / 60)
        if i % 3: continue
        for sc in (0.3, 0.6, 1.0):
            ox, oy = rng.uniform(300, 700), rng.uniform(400, 700)
            xf = np.array([[sc, 0, ox - sc * P.x], [0, sc, oy], [0, 0, 1.0]])
            g = partrig.gap_check(rig, W, xf, (1080, 1920), joints, radius, down=1.0)
            s = skia.Surface(1080, 1920); c = s.getCanvas(); c.clear(skia.ColorTRANSPARENT); rig.draw(c, W, xf)
            a = s.makeImageSnapshot().toarray()[..., 3] > 127
            lab, k = ndimage.label(a); pieces = int((np.bincount(lab.ravel())[1:] > 3).sum())
            if max(g[j] for j in joints) > 0.02 or pieces > 1:
                bad.append((i, sc, pieces, {j: round(g[j], 2) for j in joints if g[j] > 0.02}))
    print(name, 'checked', len(range(0, n, 3)) * 3, 'drawings; breaks:', len(bad), bad[:5])
run(demo.plan, demo.WALK, 600, 'idle/wave/walk')
run(neuro.mplan, neuro.WALK, 552, 'brain scene')
