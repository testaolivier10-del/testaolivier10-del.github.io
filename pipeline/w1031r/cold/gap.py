import sys, math; sys.argv=['x']
import build as B
def head(who, ps):
    J = who.joints(ps); return who.canvas_pt(ps, J['head_c'])
g=[]
for t in (0.1, 0.5, 3.0, 7, 22):
    L = B.lift_at(t); pat = B.patient_pose(t, L); rp = B.red_pose(t, L, pat)
    a, b = head(B.RK, rp), head(B.PK, pat); g.append(round(math.hypot(a[0]-b[0], a[1]-b[1])))
print(B.RX, g)
