"""Ship gate 2, automatic part: every person alone on a key colour, over every pose the video uses (idle with every face and the
goggles up, down and between; the pencil, scribe and torch poses over their whole work areas including the corners; the cloth
pull from start to end; the day outfit; the three townspeople). The filled figure (body, clothes and what the hands hold) must be
ONE connected region, and no background may show inside a 10 px disc at any joint (neck, shoulders, elbows, wrists, hips)."""
import sys, math, os
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia, cv2
import cast as CA, lperson as PN
samples = CA.gate_samples
os.makedirs('/tmp/cast/g2', exist_ok=True)
bad = 0; holes = 0; n = 0
for name, who, ps, x, g, s, tg, side in samples():
    S = skia.Surface(1200, 1200); c = S.getCanvas(); c.clear(skia.Color(255, 0, 255))
    CA.draw(c, who, ps, x, g, s)
    a = S.makeImageSnapshot().toarray()[:, :, :3].astype(int)
    key = (abs(a[:, :, 0] - 255) < 40) & (a[:, :, 1] < 60) & (abs(a[:, :, 2] - 255) < 40)
    body = (~key).astype(np.uint8); body[1100:, :] = 0          # leave out the ground shadow
    body = cv2.morphologyEx(body, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    k, lab, st, _ = cv2.connectedComponentsWithStats(body, 8)
    big = [j for j in range(1, k) if st[j, cv2.CC_STAT_AREA] > 60]
    n += 1
    if len(big) != 1:
        bad += 1; print('NOT ONE BODY', name, n, [(int(st[j, 0]), int(st[j, 1]), int(st[j, 4])) for j in big]); cv2.imwrite(f'/tmp/cast/g2/{name}_{n}.png', body * 255)
    J = [PN.skel(ps)['T'](0, 46)]                               # the joints: neck, shoulders, elbows, wrists, hips
    for key in ('l', 'r'): A = PN.arm_pts(ps, key); J += [A['sh'], A['el'], A['wr']]
    hc = PN.skel(ps)['hipc']; J += [(hc[0] - 47, hc[1] + 8), (hc[0] + 47, hc[1] + 8)]
    J = [CA._to_screen(ps, q, x, g, s) for q in J]
    sl = []
    for q in J:                                                 # no background may show through a disc of 10 px at any joint
        m = np.zeros(body.shape, np.uint8); cv2.circle(m, (int(round(q[0])), int(round(q[1]))), 10, 1, -1)
        gap = int(((1 - body) & m).sum())
        if gap > 0: sl.append((int(q[0]), int(q[1]), gap))
    if sl: holes += 1; print('GAP AT A JOINT', name, n, sl[:4]); cv2.imwrite(f'/tmp/cast/g2/hole_{name}_{n}.png', np.dstack([a[:, :, 2], a[:, :, 1], a[:, :, 0]]).astype(np.uint8))
print('gate 2 connected body:', n, 'poses checked,', bad, 'not one body,', holes, 'with a hole at a joint')
