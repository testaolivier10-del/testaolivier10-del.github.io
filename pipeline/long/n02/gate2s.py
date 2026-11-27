"""Ship gate 2 for the story of yt-nremt-02: every pose the five story beats draw (sampled every 0.25 s) is drawn ALONE on a key
colour; the figure with what its hands hold must be ONE connected region and no background may show inside a 10 px disc at any
joint (neck, shoulders, elbows, wrists, hips)."""
import sys, os
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia, cv2
import render as R, story as ST, cast as CA, nperson as PN
os.makedirs('/tmp/story/g2', exist_ok=True)
def samples(step=0.4):
    out = []; S = skia.Surface(1920, 1080)
    for k in ('hook', 'l6', 'j4', 'm3', 'end'):
        b = R.T['beats'][k]; t = b['t0']
        while t < b['t1'] + 1.0:
            ST.REC = []; R.frame(t, S)
            for (tag, name, ps, x, g, s) in ST.REC: out.append((k, round(t, 2), tag, name, ps, x, g, s))
            t += step
    ST.REC = None; return out
if __name__ == '__main__':
    bad = holes = n = 0; tags = {}
    for (k, t, tag, name, ps, x, g, s) in samples():
        n += 1; tags[tag] = tags.get(tag, 0) + 1; sc = 0.9 / CA.LOOKS[name]['hs']; X, G = 650, 1180
        S = skia.Surface(1300, 1300); c = S.getCanvas(); c.clear(skia.Color(255, 0, 255))
        mid = getattr(ps, 'mid', None); keep = tag in ('priya_strap', 'joan_strip', 'priya_mic')
        if mid is not None and not keep: ps.mid = None        # the counter or blanket between body and forearms is scenery, not body
        CA.draw(c, name, ps, X, G, sc)
        ps.mid = mid
        a = S.makeImageSnapshot().toarray()[:, :, :3].astype(int)
        key = (abs(a[:, :, 0] - 255) < 40) & (a[:, :, 1] < 60) & (abs(a[:, :, 2] - 255) < 40)
        body = (~key).astype(np.uint8); body[1150:, :] = 0
        body = cv2.morphologyEx(body, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        kk, lab, st, _ = cv2.connectedComponentsWithStats(body, 8)
        big = [j for j in range(1, kk) if st[j, cv2.CC_STAT_AREA] > 60]
        if len(big) != 1:
            bad += 1; print('NOT ONE BODY', k, t, tag, [(int(st[j, 0]), int(st[j, 1]), int(st[j, 4])) for j in big]); cv2.imwrite(f'/tmp/story/g2/{tag}_{n}.png', np.dstack([a[:, :, 2], a[:, :, 1], a[:, :, 0]]).astype(np.uint8))
        J = [PN.skel(ps)['T'](0, 46)]
        for key_ in ('l', 'r'): A = PN.arm_pts(ps, key_); J += [A['sh'], A['el'], A['wr']]
        hc = PN.skel(ps)['hipc']; J += [(hc[0] - 47, hc[1] + 8), (hc[0] + 47, hc[1] + 8)]
        sl = []
        for q in J:
            q = CA._to_screen(ps, q, X, G, sc)
            if not (0 <= q[1] < 1150): continue
            m = np.zeros(body.shape, np.uint8); cv2.circle(m, (int(round(q[0])), int(round(q[1]))), 10, 1, -1)
            gap = int(((1 - body) & m).sum())
            if gap > 0: sl.append((int(q[0]), int(q[1]), gap))
        if sl: holes += 1; print('GAP AT A JOINT', k, t, tag, sl[:4]); cv2.imwrite(f'/tmp/story/g2/hole_{tag}_{n}.png', np.dstack([a[:, :, 2], a[:, :, 1], a[:, :, 0]]).astype(np.uint8))
    print('gate 2 connected body:', n, 'poses checked,', bad, 'not one body,', holes, 'with a hole at a joint'); print(tags)
