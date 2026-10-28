import sys, math, numpy as np, skia, cv2
sys.path.insert(0, '/home/claude/n35')
from cast import PM, RM, MP, Perf
from PIL import Image
ART = '/home/claude/lp/art/n35/'
a = np.array(Image.open(ART + 'g_garage.png').convert('RGB'))[13:-14, 13:-13]
sc = 1080 / a.shape[0]
b = cv2.resize(a, (int(a.shape[1] * sc), 1080), interpolation=cv2.INTER_LANCZOS4)
b = cv2.addWeighted(b, 1.3, cv2.GaussianBlur(b, (0, 0), 1.2), -0.3, 0)
print('plate', b.shape, 'scale', sc)
x0 = (b.shape[1] - 1920) // 2
b = b[:, x0:x0 + 1920]
SIT = MP.Take('13_04', near='Left'); KN = MP.Take('23_03', near='Left')
rr, rs, _, _ = RM.build(); pr, ps, _, _ = PM.build()
rr.light = (0.86, -0.5)
taus = [float(v) for v in sys.argv[1:3]] if len(sys.argv) > 2 else [19.0, 3.0]
P1 = Perf(rr, rs, lambda t: [('a', SIT, taus[0], 1.0)], ground_take=SIT)
P2 = Perf(pr, ps, lambda t: [('a', KN, taus[1], 1.0)], ground_take=KN)
W1 = P1.at(0.0); W2 = P2.at(0.0)
surf = skia.Surface(1920, 1080); c = surf.getCanvas()
rgba = np.dstack([b, np.full(b.shape[:2], 255, np.uint8)]).copy()
c.drawImage(skia.Image.fromarray(rgba), 0, 0)
floor = (500 - 13) * sc
stool_x = (515 - 13) * sc - x0
CS = 0.60
sole1 = P1.ground + RM.ANKLE_H; sole2 = P2.ground + PM.ANKLE_H
# patient mirrored (faces left), hip over the stool
xf1 = np.array([[-CS, 0, stool_x + 40], [0, CS, floor - CS * sole1], [0, 0, 1.0]])
xf2 = np.array([[CS, 0, stool_x - 420], [0, CS, floor - CS * sole2 + 10], [0, 0, 1.0]])
rr.blink = 0; pr.blink = 0
rr.draw(c, W1, xf1); pr.draw(c, W2, xf2)
im = surf.makeImageSnapshot().toarray()[..., [2, 1, 0]]
cv2.imwrite('/tmp/proto.jpg', im[..., ::-1][..., ::-1] if False else cv2.cvtColor(im, cv2.COLOR_RGB2BGR))
print('hip1', rr.joint(W1, 'body'), 'sole', sole1, 'hip2', pr.joint(W2, 'body'))
