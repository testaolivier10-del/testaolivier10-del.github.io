import sys, math
sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig'); sys.path.insert(0, '/home/claude/runner')
import numpy as np, model, mocap_perf as MP, phys
TK = MP.Take('104_55', near='Left')
rig, spec, joints, radius = model.build()
P = MP.MocapPerformer(rig, spec, lambda t: [('a', TK, 1.2 + t, 1.0)], ground_take=TK)
for i in range(int(2.0 * 120)):
    t = i / 120; W = P.pose(t); tau = 1.2 + t
    if i % 6: continue
    c = phys.com(rig, W)
    out = []
    for sd in ('n', 'f'):
        an = rig.joint(W, sd + '_ft')
        out.append((sd, round(an[0] - c[0]), round(P.ground - an[1]), round(P.lock_w['near' if sd == 'n' else 'far'], 2)))
    sp = math.degrees(model.LEAN * 0 + (rig.world_angle(W, 'body') + math.pi / 2))
    print(f'{tau:.2f} com {c.round()} x {P.x:7.1f} spine {sp:5.1f}', out)
