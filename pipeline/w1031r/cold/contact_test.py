import sys, math; sys.argv=['x']
import build as B
worst = 0; wt = None
for i in range(int(B.T_CUT * 30)):
    t = i / 30; L = B.lift_at(t); pat = B.patient_pose(t, L); rp = B.red_pose(t, L, pat)
    for s in 'nf':
        w = B.RK.canvas_pt(rp, B.RK.joints(rp)['hand_' + s][0]); g = B.grip_pt(pat, s)
        d = math.hypot(w[0] - g[0], w[1] - g[1])
        if d > worst: worst, wt = d, (t, s)
print('RED grip worst miss px', round(worst, 2), wt)
worst = 0; wt = None
for i in range(int((B.T_KIND + 1.42) * 30), int(B.T_CUT * 30)):
    t = i / 30; L = B.lift_at(t); pat = B.patient_pose(t, L); rp = B.red_pose(t, L, pat)
    op, og = B.orange_pose(t); sh = B.pat_shoulder(pat); B.bend_to(op, sh)
    op.hand_tn = B.OK_.wpt(op, sh)
    w = B.OK_.canvas_pt(op, B.OK_.joints(op)['hand_n'][0])
    d = math.hypot(w[0] - sh[0], w[1] - sh[1])
    if d > worst: worst, wt = d, t
print('ORANGE hand on shoulder worst miss px', round(worst, 2), wt)
