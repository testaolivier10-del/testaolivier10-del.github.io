import sys, math, numpy as np, skia, cv2
sys.path.insert(0, '/home/claude/n35')
from cast import PM, RM, MP, Perf, with_ik, pingpong
from PIL import Image
ART = '/home/claude/lp/art/n35/'
a = np.array(Image.open(ART + 'g_garage.png').convert('RGB'))[13:-14, 13:-13]
sc = 1080 / a.shape[0]
b = cv2.resize(a, (int(a.shape[1] * sc), 1080), interpolation=cv2.INTER_LANCZOS4)
b = cv2.addWeighted(b, 1.3, cv2.GaussianBlur(b, (0, 0), 1.2), -0.3, 0)
x0 = (b.shape[1] - 1920) // 2; b = b[:, x0:x0 + 1920]
SIT = MP.Take('13_04', near='Left'); KN = MP.Take('23_03', near='Left')
rr, rs, _, _ = RM.build(); pr, ps, _, _ = PM.build()
rr.light = (0.86, -0.5)
D = math.radians
t0 = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
P1 = Perf(rr, rs, lambda t: [('a', SIT, pingpong(t, 14.0, 17.0, 0.2), 1.0)], ground_take=SIT)
P1.arms = lambda t: {'near': (D(70), D(-8), D(-4), 1.0), 'far': (D(95), D(15), D(20), 1.0)}
SEAT = ((375 - 13) * sc, (515 - 13) * sc - x0)     # stool top y, x
FLOOR = (500 - 13) * sc
P1.anchor_standing('a', SIT, 0.0)
W1 = P1.at(t0)
CS1 = float(sys.argv[2]) if len(sys.argv) > 2 else 0.78
hip = rr.joint(W1, 'body'); sole1 = P1.ground + RM.ANKLE_H
P1.ground += (FLOOR - SEAT[0] - 18) / CS1 - (sole1 - hip[1])
W1 = P1.at(t0); hip = rr.joint(W1, 'body'); sole1 = P1.ground + RM.ANKLE_H
xf1 = np.array([[-CS1, 0, SEAT[1] + CS1 * hip[0] + 10], [0, CS1, FLOOR - CS1 * sole1], [0, 0, 1.0]])
wrist = xf1 @ np.r_[rr.tail(W1, 'n_lo'), 1]; elbow = xf1 @ np.r_[rr.joint(W1, 'n_lo'), 1]
wound = elbow[:2] + 0.78 * (wrist[:2] - elbow[:2])
CS2 = CS1 * 0.97
X2 = SEAT[1] - float(sys.argv[3]) if len(sys.argv) > 3 else SEAT[1] - 470
P2 = Perf(pr, ps, lambda t: [('a', KN, pingpong(t, 2.2, 3.9, 0.2), 1.0)], ground_take=KN)
sole2 = P2.ground + PM.ANKLE_H
xf2 = np.array([[CS2, 0, X2], [0, CS2, FLOOR + 12 - CS2 * sole2], [0, 0, 1.0]])
inv2 = np.linalg.inv(xf2)
def ik(t, W0, pose):
    tg = (inv2 @ np.r_[wound, 1])[:2]
    pr.ik2(W0, pose, 'n_up', 'n_lo', tg + np.array([-55, -18]), bend=-1)
    pose['world']['n_hand'] = D(10)
    pr.ik2(W0, pose, 'f_up', 'f_lo', tg + np.array([-35, -30]), bend=-1)
    pose['world']['f_hand'] = D(5)
with_ik(P2, ik)
P2.anchor_standing('a', KN, 0.0)
W2 = P2.at(t0)
surf = skia.Surface(1920, 1080); c = surf.getCanvas()
c.drawImage(skia.Image.fromarray(np.dstack([b, np.full(b.shape[:2], 255, np.uint8)]).copy()), 0, 0)
rr.blink = 0; pr.blink = 0
pr.draw(c, W2, xf2); rr.draw(c, W1, xf1)
c.drawCircle(*wound, 6, skia.Paint(Color=skia.ColorRED))
im = surf.makeImageSnapshot().toarray()[..., [2, 1, 0]]
cv2.imwrite('/tmp/proto2.jpg', cv2.cvtColor(im, cv2.COLOR_RGB2BGR))
print('CS1', CS1, 'wound', wound)
