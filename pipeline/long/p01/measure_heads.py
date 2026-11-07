"""Measure Leo's and Ana's heads off their Figma AI (gemini) head turnarounds: the right facing profile panel
(Ana's sheet is left facing, so her panel is mirrored), skin+head silhouette and hair outlines -> ref/head_contours.json."""
import cv2, numpy as np, json
OUT = {}
for name, box, flip, cut in [('leo', (270, 30, 540, 380), False, 262), ('ana', (270, 40, 540, 380), True, 255)]:
    im = cv2.imread(f'ref/heads_{name}.png').astype(int)
    x0, y0, x1, y1 = box; c = im[y0:y1, x0:x1]
    if flip: c = c[:, ::-1]
    b, g, r = c[..., 0], c[..., 1], c[..., 2]
    bg = (np.abs(c - np.array([228, 228, 228])).sum(-1) < 36)
    blue = (b > r + 30); green = (g > r + 15) & (g > b); white = c.min(-1) > 240
    fg = ~bg & ~blue & ~green & ~white
    fg[cut + 25:] = False
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
    big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); fg = (lab == big).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    hair = ((c.max(-1) < 75) & ~bg).astype(np.uint8)
    hair = cv2.morphologyEx(hair, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    hair = cv2.morphologyEx(hair, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    def conts(m, minarea, eps=1.0):
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        out = []
        for k in cs:
            if cv2.contourArea(k) < minarea: continue
            a = cv2.approxPolyDP(k, eps, True)[:, 0, :]
            out.append([[int(x), int(y)] for x, y in a])
        return out
    OUT[name] = dict(skin=conts(fg, 3000), hair=conts(hair, 150))
    print(name, [len(k) for k in OUT[name]['skin']], [len(k) for k in OUT[name]['hair']])
    vis = np.full_like(c, 255).astype(np.uint8)
    for k in OUT[name]['skin']: cv2.fillPoly(vis, [np.array(k)], (90, 140, 200))
    for k in OUT[name]['hair']: cv2.fillPoly(vis, [np.array(k)], (30, 30, 30))
    cv2.imwrite(f'/tmp/meas_{name}.png', np.hstack([c.astype(np.uint8), vis]))
json.dump(OUT, open('ref/head_contours.json', 'w'))
