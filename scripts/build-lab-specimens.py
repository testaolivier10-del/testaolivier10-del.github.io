#!/usr/bin/env python3
"""Clean specimen pictures for the lab practical's Explore (tools v2, docs/tools-v2-anp-lab-practical-brief.md).

Explore shows a few lab figures as specimens to tap: the drawing alone, with no printed labels and no leader lines,
on the stage's own background. For each specimen in anatomy-physiology/data/tools/lab-specimens.json this reads the
OpenStax figure (figures/<figure>.jpg) and its label boxes (data/labels/<figure>.json) and:

  1. paints every printed label box white;
  2. paints out the leader lines: thin grey or black pixels on the white background (a 9 x 9 window mostly white)
     go white, and each line is followed on into the drawing (straight, round a bend) and inpainted there, so no
     line points at a label that is gone;
  3. crops to the drawing (the specimen's "crop" when it has one; else the box round everything left that is not
     a small speck, plus a margin);
  4. makes the white background transparent: white connected to the picture's edge, with a soft one pixel edge, so
     a white part inside the drawing (teeth, valve cusps) stays white;
  5. leaves no dark mark the original figure does not have (step 6 in clean(): a fill, a crossing, an outline put
     back at an open vessel end, a checkered join or a grey block darker than the original with its lines inpainted
     out gets that colour back; --check runs the same test on every written picture);
  6. writes figures/specimens/<figure>.avif and .webp (WebP is the fallback for a browser without AVIF), and
     figures/specimens/index.json with each crop (figure pixels) so the page can place the spots.

The spots themselves (where each leader line ended) are data, set by eye: this script never moves them.
Needs Pillow with AVIF support, NumPy and OpenCV (cv2.inpaint).

  python3 scripts/build-lab-specimens.py            write every specimen
  python3 scripts/build-lab-specimens.py --check    exit 1 if a specimen picture or its crop entry is missing, or a
                                                    picture has a dark mark its original figure does not (step 6)
  python3 scripts/build-lab-specimens.py --debug    also write /tmp/specimen-<figure>.png with the spots drawn
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSE = os.path.join(ROOT, 'anatomy-physiology')
OUT = os.path.join(COURSE, 'figures', 'specimens')
DATA = os.path.join(COURSE, 'data', 'tools', 'lab-specimens.json')
MARGIN = 14
# a specimen pixel is a new dark mark when it is darker than lightness MARK_DARK and darker by more than MARK_DROP than
# every pixel of the original within 2 px (so the original's outline, and a leader line that was painted out, are
# allowed; a black block on white or a grey block in a pale fill is not)
MARK_DARK = 200
MARK_BLACK = 110
MARK_DROP = 40


def load(fig):
    im = Image.open(os.path.join(COURSE, 'figures', fig + '.jpg')).convert('RGB')
    labels = json.load(open(os.path.join(COURSE, 'data', 'labels', fig + '.json')))['labels']
    return np.asarray(im).astype(np.int16), [l['box'] for l in labels if l.get('box')]


def masks(A):
    import cv2
    mx = A.max(2)
    mn = A.min(2)
    sat = mx - mn
    white = mn > 232
    core = (sat < 50) & (mx < 140)            # the dark core of a line
    # its anti-aliased edge: grey, light or mid, right beside a core pixel (a pale fill of the drawing is not)
    near = cv2.dilate(core.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    soft = (sat < 18) & ~white & ~core & near
    return white, core, soft


def mark_ref(A, band):
    """the original (RGB) with its lines taken out, two ways: (soft) each whole band (the line, its soft edge and the
    light halo some figures draw round it) inpainted from the original round it; (strict) only the band's dark
    pixels inpainted, so a line that ran along an outline or over an open vessel end leaves the light side there"""
    import cv2
    A8 = np.clip(A, 0, 255).astype(np.uint8)
    soft = cv2.inpaint(A8, band.astype(np.uint8), 3, cv2.INPAINT_TELEA)
    lum = A8.astype(np.int16).mean(2)
    sat = A8.max(2).astype(np.int16) - A8.min(2)
    dark = band & (lum < 170) & (sat < 90)
    hole = (cv2.dilate(dark.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0) & band
    strict = cv2.inpaint(A8, hole.astype(np.uint8), 3, cv2.INPAINT_TELEA)
    return soft, strict


def new_dark(spec, refs, drop=MARK_DROP, gate=0):
    """pixels of a specimen (RGB) that are a dark mark the original does not have: darker than every pixel of the
    soft reference within 2 px, or near black (MARK_BLACK) and darker than every pixel of the strict one (refs from
    mark_ref, same crop); gate raises both darkness limits. The strict test is for black only, so a mid-tone fill beside a haloed line is not judged by
    the halo."""
    import cv2
    sl = spec.astype(np.float32).mean(2)
    k = np.ones((5, 5), np.uint8)
    soft, strict = (cv2.erode(r.astype(np.float32).mean(2), k) for r in refs)
    return ((sl < MARK_DARK + gate) & (sl < soft - drop)) | ((sl < MARK_BLACK + gate) & (sl < strict - drop))


def box_share(m, r):
    """share of m in a (2r+1) square round each pixel (summed-area table)"""
    H, W = m.shape
    s = np.zeros((H + 1, W + 1), np.int32)
    s[1:, 1:] = np.cumsum(np.cumsum(m.astype(np.int32), 0), 1)
    ys = np.arange(H)[:, None]
    xs = np.arange(W)[None, :]
    y0 = np.clip(ys - r, 0, H)
    y1 = np.clip(ys + r + 1, 0, H)
    x0 = np.clip(xs - r, 0, W)
    x1 = np.clip(xs + r + 1, 0, W)
    tot = s[y1, x1] - s[y0, x1] - s[y1, x0] + s[y0, x0]
    return tot / ((y1 - y0) * (x1 - x0))


def same_sides(img, pos, dd):
    """a leader line has the same colour on both sides; an outline of the drawing parts two colours"""
    if img is None:
        return True
    H, W = img.shape[:2]
    nx, ny = -dd[1], dd[0]
    diff = []
    for k in range(3, 13, 3):
        c = pos + k * dd
        a = (int(round(c[0] + 4 * nx)), int(round(c[1] + 4 * ny)))
        b = (int(round(c[0] - 4 * nx)), int(round(c[1] - 4 * ny)))
        if not (0 <= a[0] < W and 0 <= a[1] < H and 0 <= b[0] < W and 0 <= b[1] < H):
            return False
        diff.append(np.abs(img[a[1], a[0]].astype(int) - img[b[1], b[0]].astype(int)).sum())
    return np.median(diff) < 60


def walk(core, loose, pos, d, img=None):
    """follow a line from pos along d: straight on dark pixels (loose: a black line over a colour is a little
    tinted), round a bend only along neutral black (core), so an outline is never followed"""
    H, W = core.shape

    def on(m, p):
        x, y = int(round(p[0])), int(round(p[1]))
        return 0 <= x < W and 0 <= y < H and m[y, x]
    path = [pos.copy()]
    runs_bad = 0
    for _ in range(3000):
        best = None
        for r, lim in ((2, 30), (3, 30), (4, 30), (6, 30), (2, 110), (3, 110)):
            for ang in range(-lim, lim + 1, 5):
                a = math.radians(ang)
                dd = np.array([d[0] * math.cos(a) - d[1] * math.sin(a), d[0] * math.sin(a) + d[1] * math.cos(a)])
                p = pos + r * dd
                if abs(ang) <= 30:
                    if not on(loose, p):
                        continue
                elif not all(on(core, pos + k * dd) for k in range(2, 13)) or not same_sides(img, pos, dd):
                    continue
                score = -abs(ang)
                if best is None or score > best[0]:
                    best = (score, p)
            if best:
                break
        if not best:
            break
        step = best[1] - pos
        step /= np.linalg.norm(step)
        d = 0.8 * d + 0.2 * step
        d /= np.linalg.norm(d)
        pos = best[1]
        path.append(pos.copy())
        # an outline has two different colours either side: a walk that has run onto one (a leader ends on the
        # drawing's edge) stops where the two sides stopped matching
        if img is not None and len(path) > 6:
            H_, W_ = img.shape[:2]
            nx_, ny_ = -d[1], d[0]
            a_ = (int(round(pos[0] + 3.5 * nx_)), int(round(pos[1] + 3.5 * ny_)))
            b_ = (int(round(pos[0] - 3.5 * nx_)), int(round(pos[1] - 3.5 * ny_)))
            if 0 <= a_[0] < W_ and 0 <= a_[1] < H_ and 0 <= b_[0] < W_ and 0 <= b_[1] < H_:
                diffp = np.abs(img[a_[1], a_[0]].astype(int) - img[b_[1], b_[0]].astype(int)).sum()
                runs_bad = (runs_bad + 1) if diffp > 120 else 0
                if runs_bad >= 12:
                    del path[-12:]
                    break
    return path


def seg_profile(img, white, x0, y0, x1, y1):
    """(share of samples with the same colour on both sides, share with a thin dark core) along a segment"""
    H, W = white.shape
    L = math.hypot(x1 - x0, y1 - y0)
    if L < 1:
        return 0, 0
    dx, dy = (x1 - x0) / L, (y1 - y0) / L
    nx, ny = -dy, dx
    same = thin = n = 0
    for t in np.arange(2, L - 1, 3):
        cx, cy = x0 + dx * t, y0 + dy * t
        pa = (int(round(cx + 4 * nx)), int(round(cy + 4 * ny)))
        pb = (int(round(cx - 4 * nx)), int(round(cy - 4 * ny)))
        if not (0 <= pa[0] < W and 0 <= pa[1] < H and 0 <= pb[0] < W and 0 <= pb[1] < H):
            continue
        n += 1
        ca, cb = img[pa[1], pa[0]].astype(int), img[pb[1], pb[0]].astype(int)
        if np.abs(ca - cb).sum() < 70:
            same += 1
        # thin: the pixels 3 px to each side are not part of the same dark run
        qa = img[int(round(cy + 3 * ny)), int(round(cx + 3 * nx))].astype(int) if 0 <= int(round(cx + 3 * nx)) < W and 0 <= int(round(cy + 3 * ny)) < H else ca
        qb = img[int(round(cy - 3 * ny)), int(round(cx - 3 * nx))].astype(int) if 0 <= int(round(cx - 3 * nx)) < W and 0 <= int(round(cy - 3 * ny)) < H else cb
        if qa.max() > 120 or qb.max() > 120:
            thin += 1
    return (same / n, thin / n) if n else (0, 0)


def one_white(white, x0, y0, x1, y1):
    """share of the samples along a segment with the white background on one side only: the drawing's own edge"""
    H, W = white.shape
    L = math.hypot(x1 - x0, y1 - y0)
    if L < 1:
        return 0
    dx, dy = (x1 - x0) / L, (y1 - y0) / L
    n = k = 0
    for t in np.arange(1, L, 2):
        a = (int(round(x0 + dx * t - dy * 4)), int(round(y0 + dy * t + dx * 4)))
        b = (int(round(x0 + dx * t + dy * 4)), int(round(y0 + dy * t - dx * 4)))
        if 0 <= a[0] < W and 0 <= a[1] < H and 0 <= b[0] < W and 0 <= b[1] < H:
            n += 1
            k += white[a[1], a[0]] != white[b[1], b[0]]
    return k / n if n else 0


def pt_seg(px, py, s):
    x0, y0, x1, y1 = s
    vx, vy = x1 - x0, y1 - y0
    L2 = vx * vx + vy * vy
    t = 0 if L2 == 0 else max(0, min(1, ((px - x0) * vx + (py - y0) * vy) / L2))
    return math.hypot(px - (x0 + t * vx), py - (y0 + t * vy))


def extend(core, img, s, maxlen=80):
    """carry a segment on past each end while the line goes on straight (a stub into the drawing)"""
    H, W = core.shape
    x0, y0, x1, y1 = map(float, s)
    L = math.hypot(x1 - x0, y1 - y0)
    if L < 1:
        return s
    dx, dy = (x1 - x0) / L, (y1 - y0) / L
    nx, ny = -dy, dx
    ends = []
    for (ex, ey, sx, sy) in ((x1, y1, dx, dy), (x0, y0, -dx, -dy)):
        k = 0
        miss = 0
        while k < maxlen:
            cx, cy = ex + sx * (k + 1), ey + sy * (k + 1)
            hit = False
            for o in (0, -1, 1):
                X, Y = int(round(cx + nx * o)), int(round(cy + ny * o))
                if 0 <= X < W and 0 <= Y < H and core[Y, X]:
                    hit = True
                    break
            if not hit:
                miss += 1
                if miss > 1:
                    break
            else:
                miss = 0
            k += 1
        k = max(0, k - miss)
        ends.append((ex + sx * k, ey + sy * k))
    (ax, ay), (bx, by) = ends
    return (int(round(bx)), int(round(by)), int(round(ax)), int(round(ay)))


def clean(fig, spec):
    """Paint out every printed label and its leader lines: a line on the background goes white; a line over the
    drawing (its fill or its outline) is inpainted from its own two sides in a band as thin as the line, so the
    outline it crossed is drawn on and no smear is left."""
    import cv2
    A, boxes = load(fig)
    H, W, _ = A.shape
    img = A.copy()
    for b in boxes:
        x, y, w, h = b
        img[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2] = 255
    mx, mn = img.max(2), img.min(2)
    sat = mx - mn
    white = mn > 240     # (the brain figure fades to an almost white edge: that edge is drawing, not background)
    core = (sat < 50) & (mx < 150)
    img8 = img.astype(np.uint8)
    # 1. straight dark segments, kept when they look like a leader (same colour on both sides, thin)
    raw = cv2.HoughLinesP(core.astype(np.uint8) * 255, 1, np.pi / 720, 14, minLineLength=12, maxLineGap=3)
    raw = [] if raw is None else [tuple(int(v) for v in np.ravel(l)[:4]) for l in raw]
    cand = []
    for sgm in raw:
        same, thin = seg_profile(img, white, *sgm)
        if same >= 0.7 and thin >= 0.7:
            cand.append(sgm)
    # 2. only segments chained to a label box are leaders
    def near_box(x, y, m=22):
        return any(b[0] - m <= x <= b[0] + b[2] + m and b[1] - m <= y <= b[1] + b[3] + m for b in boxes)
    keep = [False] * len(cand)
    frontier = [i for i, sg in enumerate(cand) if near_box(sg[0], sg[1]) or near_box(sg[2], sg[3])]
    for i in frontier:
        keep[i] = True
    while frontier:
        i = frontier.pop()
        a = cand[i]
        for j, bsg in enumerate(cand):
            if keep[j]:
                continue
            if min(pt_seg(bsg[0], bsg[1], a), pt_seg(bsg[2], bsg[3], a), pt_seg(a[0], a[1], bsg), pt_seg(a[2], a[3], bsg)) <= 5:
                keep[j] = True
                frontier.append(j)
    segs = [extend(core, img, sg) for sg, k in zip(cand, keep) if k]
    # and each leader followed from its own label box, through its bends (a line crossing many colours can fail the
    # straight segment test above), turned into straight pieces
    loose = (sat < 60) & (mx < 110)
    def inbox(x, y, pad=1):
        return any(b[0] - pad <= x < b[0] + b[2] + pad and b[1] - pad <= y < b[1] + b[3] + pad for b in boxes)
    for b in boxes:
        x, y, w, h = b
        seen = []
        for yy in range(max(0, y - 3), min(H, y + h + 3)):
            for side in (-1, 1):
                for dx in range(3, 22):
                    xx = x - dx if side < 0 else x + w - 1 + dx
                    if not (0 <= xx < W) or inbox(xx, yy) or not core[yy, xx]:
                        continue
                    if any(abs(xx - a) < 6 and abs(yy - c) < 6 for a, c in seen):
                        break
                    seen.append((xx, yy))
                    pts = [(px, py) for py in range(yy - 12, yy + 13) for px in range(xx - 12, xx + 13)
                           if 0 <= px < W and 0 <= py < H and core[py, px] and not inbox(px, py) and (px - xx) * side >= -1]
                    if len(pts) < 5:
                        break
                    P = np.array(pts, float)
                    d = np.linalg.svd(P - P.mean(0))[2][0]
                    if d[0] * side < 0:
                        d = -d
                    path = walk(core, loose, np.array([xx, yy], float), d, img)
                    if len(path) > 4:
                        poly = cv2.approxPolyDP(np.array(path, np.float32).reshape(-1, 1, 2), 1.5, False).reshape(-1, 2)
                        for i in range(len(poly) - 1):
                            sg_ = tuple(int(round(v)) for v in (*poly[i], *poly[i + 1]))
                            # a piece with different colours either side is an outline the walk ran onto
                            if one_white(white, *sg_) > 0.5 and seg_profile(img, white, *sg_)[0] < 0.6:
                                continue
                            segs.append(extend(core, img, sg_, 12))
                    break
    # lines the data names by hand (a branch the follower missed), snapped onto the dark line pixels near them
    def snap(e):
        x0, y0, x1, y1 = e
        L = math.hypot(x1 - x0, y1 - y0) or 1.0
        ux, uy = (x1 - x0) / L, (y1 - y0) / L
        nx, ny = -uy, ux
        pts = []
        for t in np.arange(0, L, 1.0):
            best = None
            for o in np.arange(-3, 3.5, 0.5):
                X, Y = int(round(x0 + ux * t + nx * o)), int(round(y0 + uy * t + ny * o))
                if 0 <= X < W and 0 <= Y < H and core[Y, X] and (best is None or abs(o) < abs(best)):
                    best = o
            if best is not None:
                pts.append((x0 + ux * t + nx * best, y0 + uy * t + ny * best))
        if len(pts) < max(6, L * 0.3):
            return tuple(e)
        P = np.array(pts)
        mu = P.mean(0)
        v = np.linalg.svd(P - mu)[2][0]
        ts = (P - mu) @ v
        a_, b_ = mu + v * ts.min(), mu + v * ts.max()
        return tuple(int(round(z)) for z in (*a_, *b_))
    segs += [snap(e) for e in spec.get('erase', []) if len(e) == 4]
    # 3. the band of each line (the line, its anti-aliased edge and the light halo some figures draw round it, 4 px
    # each side) is filled across from its two sides: each pixel takes the colours 5.5 px out on either side,
    # mixed by how close it is to each. An outline the line crossed is so drawn on through the gap, and a fill stays
    # a fill (no blur). Where both sides are the plain white background the band goes white.
    # one segment per line: near duplicates (Hough finds a 3 px line two or three times) are merged
    def merge(segs):
        segs = [tuple(map(float, sg)) for sg in segs if math.hypot(sg[2] - sg[0], sg[3] - sg[1]) >= 3]
        changed = True
        while changed:
            changed = False
            outl = []
            used = [False] * len(segs)
            for i, a in enumerate(segs):
                if used[i]:
                    continue
                ax0, ay0, ax1, ay1 = a
                La = math.hypot(ax1 - ax0, ay1 - ay0)
                ux, uy = (ax1 - ax0) / La, (ay1 - ay0) / La
                group = [a]
                for j in range(i + 1, len(segs)):
                    if used[j]:
                        continue
                    b = segs[j]
                    Lb = math.hypot(b[2] - b[0], b[3] - b[1])
                    vx, vy = (b[2] - b[0]) / Lb, (b[3] - b[1]) / Lb
                    if abs(ux * vy - uy * vx) > 0.045:          # more than about 2.5 degrees apart
                        continue
                    # both ends of b within 2.5 px of a's line, and overlapping or touching along it
                    d0 = abs((b[0] - ax0) * -uy + (b[1] - ay0) * ux)
                    d1 = abs((b[2] - ax0) * -uy + (b[3] - ay0) * ux)
                    if max(d0, d1) > (4.0 if abs(ux * vy - uy * vx) < 0.03 else 2.5):
                        continue
                    t0 = (b[0] - ax0) * ux + (b[1] - ay0) * uy
                    t1 = (b[2] - ax0) * ux + (b[3] - ay0) * uy
                    if max(t0, t1) < -4 or min(t0, t1) > La + 4:
                        continue
                    group.append(b)
                    used[j] = True
                    changed = True
                if len(group) == 1:
                    outl.append(a)
                    continue
                # the merged line: through the mean of the points, along a's direction, over the whole extent
                pts = np.array([(g[0], g[1]) for g in group] + [(g[2], g[3]) for g in group])
                # along the longest piece's line (a short traced piece can sit a pixel or two off the line)
                lg = max(group, key=lambda g: math.hypot(g[2] - g[0], g[3] - g[1]))
                Lg = math.hypot(lg[2] - lg[0], lg[3] - lg[1])
                ux, uy = (lg[2] - lg[0]) / Lg, (lg[3] - lg[1]) / Lg
                c = np.array([lg[0], lg[1]], float)
                ts = (pts[:, 0] - c[0]) * ux + (pts[:, 1] - c[1]) * uy
                outl.append((c[0] + ux * ts.min(), c[1] + uy * ts.min(), c[0] + ux * ts.max(), c[1] + uy * ts.max()))
            segs = outl
        return [tuple(int(round(v)) for v in sg) for sg in segs]
    segs = merge(segs)

    def half_width(sg):
        # how far the line (with its soft edge and halo) reaches either side: the largest offset at which most
        # samples still differ from the colours further out
        x0, y0, x1, y1 = sg
        L = math.hypot(x1 - x0, y1 - y0) or 1.0
        dx, dy = (x1 - x0) / L, (y1 - y0) / L
        nx, ny = -dy, dx
        ts = np.arange(1, L, 2.0)
        if not len(ts):
            return 2.5
        best = 1
        for k in (1, 2, 3, 4, 5):
            hits = 0
            for t in ts:
                cx, cy = x0 + dx * t, y0 + dy * t
                ok = 0
                for sg_ in (-1, 1):
                    P = (int(round(cx + nx * sg_ * k)), int(round(cy + ny * sg_ * k)))
                    Q = (int(round(cx + nx * sg_ * 7.5)), int(round(cy + ny * sg_ * 7.5)))
                    if 0 <= P[0] < W and 0 <= P[1] < H and 0 <= Q[0] < W and 0 <= Q[1] < H:
                        if np.abs(img[P[1], P[0]].astype(int) - img[Q[1], Q[0]].astype(int)).sum() > 45:
                            ok += 1
                hits += ok >= 1
            if hits / len(ts) > 0.5:
                best = k
        return best + 1.1
    HWS = [half_width(sg) for sg in segs]
    allband = np.zeros((H, W), bool)
    for (x0, y0, x1, y1), hw in zip(segs, HWS):
        m = np.zeros((H, W), np.uint8)
        cv2.line(m, (x0, y0), (x1, y1), 1, int(round(2 * hw + 1)))
        allband |= m > 0
    src = img.astype(np.float32)
    # the drawing's silhouette without the lines (closed over the gaps they leave), to tell its outline from a line
    core_band = np.zeros((H, W), bool)
    for (x0, y0, x1, y1) in segs:
        m = np.zeros((H, W), np.uint8)
        cv2.line(m, (x0, y0), (x1, y1), 1, 5)
        core_band |= m > 0
    sil = cv2.morphologyEx(((~white) & ~core_band).astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))) > 0
    out = img8.copy()
    todo = np.zeros((H, W), bool)
    bg = np.zeros((H, W), bool)
    for (x0, y0, x1, y1), HW in zip(segs, HWS):
        SO = HW + 1.5
        L = math.hypot(x1 - x0, y1 - y0) or 1.0
        dx, dy = (x1 - x0) / L, (y1 - y0) / L
        nx, ny = -dy, dx
        m = np.zeros((H, W), np.uint8)
        cv2.line(m, (x0, y0), (x1, y1), 1, int(round(2 * HW + 1)))
        ys, xs = np.nonzero(m)
        d = (xs - x0) * nx + (ys - y0) * ny            # signed distance from the line
        ax, ay = xs + (-SO - d) * nx, ys + (-SO - d) * ny
        bx, by = xs + (SO - d) * nx, ys + (SO - d) * ny
        def samp(X, Y):
            Xi = np.clip(np.round(X).astype(int), 0, W - 1)
            Yi = np.clip(np.round(Y).astype(int), 0, H - 1)
            c = cv2.remap(src, X.astype(np.float32).reshape(-1, 1), Y.astype(np.float32).reshape(-1, 1), cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REPLICATE).reshape(-1, 3)
            return c, allband[Yi, Xi], white[Yi, Xi]
        ca, ina, wa = samp(ax, ay)
        cb, inb, wb = samp(bx, by)
        # a side sample that falls in another line's band (two lines side by side) is taken further out
        for extra in (2.5, 5.0, 7.5):
            if ina.any():
                c2, i2, w2_ = samp(xs + (-SO - extra - d) * nx, ys + (-SO - extra - d) * ny)
                ca = np.where(ina[:, None], c2, ca); wa = np.where(ina, w2_, wa); ina = ina & i2
            if inb.any():
                c2, i2, w2_ = samp(xs + (SO + extra - d) * nx, ys + (SO + extra - d) * ny)
                cb = np.where(inb[:, None], c2, cb); wb = np.where(inb, w2_, wb); inb = inb & i2
        insil = sil[ys, xs]
        # background: white on both sides, or outside the drawing's silhouette with nothing but white or another
        # line on either side (a line running along a pale rim keeps the rim: the drawing's side is not white)
        both_white = (wa & wb) | (~insil & (wa | ina) & (wb | inb))
        # white on both sides inside the silhouette is background too (a line's stub past the outline); the outline
        # itself is put back below from the original (rim)
        both_white |= wa & wb
        keep_px = np.zeros_like(wa)
        bg[ys[both_white], xs[both_white]] = True
        wgt = ((d + SO) / (2 * SO))[:, None]
        mix = ca * (1 - wgt) + cb * wgt
        # inside the silhouette next to the background: the drawing's side only (its edge follows the silhouette)
        mix = np.where((wa & ~wb)[:, None], cb, mix)
        mix = np.where((wb & ~wa)[:, None], ca, mix)
        mix = np.where(ina[:, None] & ~inb[:, None], cb, mix)
        mix = np.where(inb[:, None] & ~ina[:, None], ca, mix)
        bad = ina & inb
        # where the two sides differ (the line runs over an edge between two colours), the mix would leave a
        # staircase: those pixels are filled from round them instead (below)
        # where the two sides differ (the line runs over an edge between two colours), the mix would leave a
        # streak: those pixels are filled from the drawing round them instead (below)
        edge = (np.abs(ca - cb).sum(1) > 90) & ~wa & ~wb
        # there each pixel takes the colour of its own side, so the edge between the two colours lands on the line's
        # middle (filling from round about would bleed one colour far into the other)
        bad |= edge
        ok = ~both_white & ~bad & ~keep_px
        out[ys[ok], xs[ok]] = np.clip(mix[ok], 0, 255).astype(np.uint8)
        todo[ys[bad & ~both_white], xs[bad & ~both_white]] = True
    for e in spec.get('erase', []):
        if len(e) == 3:
            m = np.zeros((H, W), np.uint8)
            cv2.circle(m, (e[0], e[1]), e[2], 1, 5)
            todo |= m > 0
    out[bg] = 255
    # where two bands cross, the gap left is filled from round it
    if todo.any():
        # filled from the drawing only: the background round it is first given the colour of the nearest drawing
        # pixel, so no white is pulled into the drawing
        hole = (todo & ~bg)
        src_ok = sil & ~hole & ~allband
        _, lbl = cv2.distanceTransformWithLabels((~src_ok).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
        ys0, xs0 = np.nonzero(src_ok)
        lut = np.zeros((lbl.max() + 1, 3), np.uint8)
        lut[lbl[ys0, xs0]] = out[ys0, xs0]
        tmp = out.copy()
        ext = ~sil
        tmp[ext] = lut[lbl[ext]]
        tmp = cv2.inpaint(tmp, hole.astype(np.uint8), 4, cv2.INPAINT_NS)
        out[hole] = tmp[hole]
    # an outline the lines cut through is drawn on across them. Each place a dark outline meets the lines' band (an
    # "entry") gets its direction from the outline pixels behind it; two entries that point at each other across the
    # band are joined with a stroke as wide as the outline, in its colour.
    darkpx = (mx < 110) & (sat < 90)
    darkish = (mx < 175) & (sat < 90)
    near_band = (cv2.dilate(allband.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & ~allband
    ent = (darkpx & near_band).astype(np.uint8)
    n, lab, stats, cents = cv2.connectedComponentsWithStats(ent, connectivity=8)
    E = []
    for i in range(1, n):
        cx, cy = cents[i]
        if stats[i, cv2.CC_STAT_AREA] > 40:
            continue
        r = 8
        x0_, y0_, x1_, y1_ = int(max(0, cx - r)), int(max(0, cy - r)), int(min(W, cx + r + 1)), int(min(H, cy + r + 1))
        win = darkish[y0_:y1_, x0_:x1_] & ~allband[y0_:y1_, x0_:x1_]
        # only the pixels joined to this entry (another outline nearby must not turn it)
        nwl, wl = cv2.connectedComponents(win.astype(np.uint8), connectivity=8)
        ex, ey = int(round(cx)) - x0_, int(round(cy)) - y0_
        if 0 <= ey < win.shape[0] and 0 <= ex < win.shape[1] and wl[ey, ex]:
            win = wl == wl[ey, ex]
        ys_, xs_ = np.nonzero(win)
        if len(xs_) < 5:
            continue
        P = np.stack([xs_ + x0_, ys_ + y0_], 1).astype(float)
        mu = P.mean(0)
        v = np.linalg.svd(P - mu)[2][0]
        # point it from the outline into the band
        bx_, by_ = int(round(cx + v[0] * 3)), int(round(cy + v[1] * 3))
        fx_, fy_ = int(round(cx - v[0] * 3)), int(round(cy - v[1] * 3))
        inb = lambda X, Y: 0 <= X < W and 0 <= Y < H and allband[Y, X]
        if not inb(bx_, by_) and inb(fx_, fy_):
            v = -v
        elif not inb(bx_, by_):
            continue
        # its width across its own direction
        wdt = max(2.0, min(5.0, stats[i, cv2.CC_STAT_AREA] / max(1.0, max(stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]) ** 0.5 * 1.6)))
        # its colour: the darkest pixels of the outline next to the band (the centre of the line, not its soft edge)
        pix = img[y0_:y1_, x0_:x1_][win].astype(float)
        col = pix[np.argsort(pix.max(1))[:max(1, len(pix) // 4)]].mean(0)
        E.append((np.array([cx, cy]), v, wdt, col))
    used = set()
    pairs = []
    bridged = np.zeros((H, W), bool)
    for i, (ci, vi, wi, coli) in enumerate(E):
        best = None
        for j, (cj, vj, wj, colj) in enumerate(E):
            if j == i:
                continue
            dvec = cj - ci
            dist = np.linalg.norm(dvec)
            if dist < 3 or dist > 22:
                continue
            if vi @ vj > -0.6:                      # they must point at each other
                continue
            along = dvec @ vi
            off = abs(dvec[0] * vi[1] - dvec[1] * vi[0])
            if along <= 0 or off > 3.5:
                continue
            # the straight join must cross the band only (no white background between)
            ok = True
            for t in np.linspace(0.35, 0.65, 5):
                q = ci + dvec * t
                if not allband[int(round(q[1])), int(round(q[0]))]:
                    ok = False
                    break
            if not ok:
                continue
            sc = off + dist * 0.1
            if best is None or sc < best[0]:
                best = (sc, j)
        if best:
            pairs.append((min(i, best[1]), max(i, best[1])))
    for (i, j) in set(pairs):
        ci, vi, wi, coli = E[i]
        cj, vj, wj, colj = E[j]
        m = np.zeros((H * 4, W * 4), np.uint8)
        th = int(round(min(wi, wj) * 4))
        cv2.line(m, (int(ci[0] * 4), int(ci[1] * 4)), (int(cj[0] * 4), int(cj[1] * 4)), 255, th, cv2.LINE_AA)
        cov = np.clip(cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0 * 1.4, 0, 1)
        cov[~allband] = 0
        colr = (coli + colj) / 2
        bridged |= cov > 0.3
        o32 = out.astype(np.float32)
        o32 = o32 * (1 - cov[..., None]) + colr * cov[..., None]
        out = np.clip(o32, 0, 255).astype(np.uint8)
    over = allband & ~bg
    # grey crumbs a line leaves on the background just outside its band (its soft edge, a tick where it met the
    # outline): light and neutral, in the white outside the drawing, near a band
    o = out.astype(np.int16)
    wt = (o.min(2) > 225).astype(np.uint8)
    ffm = np.zeros((H + 2, W + 2), np.uint8)
    for sx, sy in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        if wt[sy, sx]:
            cv2.floodFill(wt, ffm, (sx, sy), 2, 0, 0, flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
    outside0 = ffm[1:-1, 1:-1] > 0
    nb = cv2.dilate(allband.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    nout = cv2.dilate(outside0.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    near_out = cv2.dilate(outside0.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    nb3 = cv2.dilate(allband.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    crumbs = nb3 & near_out & ~outside0 & ((o.max(2) - o.min(2)) < 22) & (o.min(2) > 205) & ~sil
    out[crumbs] = 255
    # and small dark ticks there: dark neutral pieces near a band that touch the outside white but not the drawing's
    # colours (an outline is always next to its fill)
    o = out.astype(np.int16)
    tick = nb & ((o.max(2) - o.min(2)) < 50) & (o.max(2) < 110)
    nt, lt, st, _ = cv2.connectedComponentsWithStats(tick.astype(np.uint8), connectivity=8)
    # the drawing's fill: anything not white and not a dark line (pastel fills count)
    colour = cv2.dilate(((o.min(2) <= 225) & (o.max(2) >= 150)).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    for i in range(1, nt):
        if st[i, cv2.CC_STAT_AREA] > 60:
            continue
        comp = lt == i
        if not (comp & colour).any() and (comp & nout).any():
            out[comp] = 255
    # the drawing's outer outline is put back where a line ran over it: under every band, an original dark pixel on
    # the rim of the drawing's silhouette (within 4 px of the background) is the outline itself, and is restored
    orig_dark = (A.max(2) < 120) & ((A.max(2) - A.min(2)) < 60)
    bgw = white & ~allband
    bgw2 = white & ~sil      # background, under a band or not (for the stub test)
    # the outline's own thickness from the background (a line going on into the drawing is cut there)
    rim = cv2.distanceTransform((~bgw).astype(np.uint8), cv2.DIST_L2, 3) <= 4.0
    back = allband & rim & orig_dark
    # but not the line's own stub sticking out of the outline: a pixel with background (not under a band) on two
    # opposite sides, 2 to 4 px away, is a protrusion, not the outline
    def sh(m, dx, dy):
        o_ = np.zeros_like(m)
        ys_ = slice(max(0, dy), H + min(0, dy)); yd = slice(max(0, -dy), H + min(0, -dy))
        xs_ = slice(max(0, dx), W + min(0, dx)); xd = slice(max(0, -dx), W + min(0, -dx))
        o_[yd, xd] = m[ys_, xs_]
        return o_
    def side(dx, dy):
        r_ = np.zeros((H, W), bool)
        for k_ in (2, 3, 4, 5, 6, 7):
            r_ |= sh(white, dx * k_, dy * k_)
        return r_
    stub_ = (side(1, 0) & side(-1, 0)) | (side(0, 1) & side(0, -1)) | (side(1, 1) & side(-1, -1)) | (side(1, -1) & side(-1, 1))
    back &= ~stub_
    # a join drawn across a band never stands on the background (white both sides): that stays white
    out[bg & ~back] = 255
    out[back] = A[back].astype(np.uint8)
    # dark crumbs left of a line inside the drawing: small dark pieces in or right beside a band that do not
    # reach out of it (an outline always runs on past the band) are filled from round them
    o = out.astype(np.int16)
    dk = ((o.max(2) < 120) & ((o.max(2) - o.min(2)) < 70)).astype(np.uint8)
    zone = cv2.dilate(allband.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    nd, ld, sd, _ = cv2.connectedComponentsWithStats(dk, connectivity=8)
    crumb = np.zeros((H, W), bool)
    for i in range(1, nd):
        if sd[i, cv2.CC_STAT_AREA] > 40:
            continue
        comp = ld == i
        if not (comp & ~zone).any() and not (comp & bridged).any():
            crumb |= comp
    if crumb.any():
        out = cv2.inpaint(out, cv2.dilate(crumb.astype(np.uint8), np.ones((3, 3), np.uint8)), 3, cv2.INPAINT_TELEA)
    # 4. what is left on the background: grey crumbs next to where a line was, and small specks
    o = out.astype(np.int16)
    w2 = o.min(2) > 225
    ff = np.zeros((H + 2, W + 2), np.uint8)
    wm = w2.astype(np.uint8)
    for sx, sy in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        if wm[sy, sx]:
            cv2.floodFill(wm, ff, (sx, sy), 2, 0, 0, flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
    outside = ff[1:-1, 1:-1] > 0
    nonwhite = (~w2).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(nonwhite, connectivity=8)
    big = max(stats[1:, cv2.CC_STAT_AREA]) if n > 1 else 0
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 0.002 * big:
            out[lab == i] = 255
    # neutral grey left on the background outside the drawing's silhouette (a line's faint edge) goes white
    o = out.astype(np.int16)
    ghost = ~sil & ((o.max(2) - o.min(2)) < 30) & (o.min(2) <= 240) & (o.min(2) > 200)
    ghost &= cv2.dilate((allband | bg).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    out[ghost] = 255
    # 6. no dark mark the original does not have. The measure is the original with its lines taken out (mark_ref,
    # new_dark). A fill, a crossing, an outline put back at an open vessel end, a checkered join where a line met the
    # outline or a grey block in a pale fill can then be no darker than that within 2 px. A join drawn across a band
    # (bridged) is the outline itself and stays. A pixel darker by more than MARK_DROP - 20, with darkness limits 20 higher (the
    # written pictures keep room for compression under --check's own limits), takes the soft reference's colour (the strict
    # one on the background, or where the soft one would still be black on the strict test), with its soft edge.
    refs = mark_ref(A, allband)
    # the background of the strict reference (its white joined to the picture's edge): there a mark goes white, never
    # the grey the soft reference smears out of a nearby outline
    sw = (refs[1].min(2) > 232).astype(np.uint8)
    ffs = np.zeros((H + 2, W + 2), np.uint8)
    for sx, sy in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        if sw[sy, sx]:
            cv2.floodFill(sw, ffs, (sx, sy), 2, 0, 0, flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
    ref_bg = ffs[1:-1, 1:-1] > 0
    fixed = np.zeros((H, W), bool)
    for _ in range(4):
        new = new_dark(out, refs, MARK_DROP - 20, 20) & ~bridged
        if not new.any():
            break
        # its soft edge: anything round it darker than the reference, however light (no grey ring is left)
        grow = cv2.dilate(new.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
        grow &= ~bridged & new_dark(out, refs, 12, 60)
        m = new | grow
        black = out.astype(np.float32).mean(2) < MARK_BLACK + 20
        # the strict colour only where the soft one would still be a mark by the strict test (a vessel end on white)
        soft_l = refs[0].astype(np.float32).mean(2)
        strict_e = cv2.erode(refs[1].astype(np.float32).mean(2), np.ones((5, 5), np.uint8))
        use_strict = black & (soft_l < MARK_BLACK + 20) & (soft_l < strict_e - (MARK_DROP - 20))
        out[m] = np.where((use_strict | ref_bg)[..., None], refs[1], refs[0])[m]
        fixed |= m
    # 5. crop
    if spec.get('crop'):
        cx, cy, cw, ch = spec['crop']
    else:
        o = out.astype(np.int16)
        nw = (o.min(2) <= 225).astype(np.uint8)
        n, lab, stats, _ = cv2.connectedComponentsWithStats(cv2.dilate(nw, np.ones((5, 5), np.uint8)))
        top = max(stats[i, cv2.CC_STAT_AREA] for i in range(1, n))
        big = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 0.05 * top]
        x0 = min(stats[i, 0] for i in big)
        y0 = min(stats[i, 1] for i in big)
        x1 = max(stats[i, 0] + stats[i, 2] for i in big)
        y1 = max(stats[i, 1] + stats[i, 3] for i in big)
        cx, cy = max(0, x0 - MARGIN), max(0, y0 - MARGIN)
        cw, ch = min(W, x1 + MARGIN) - cx, min(H, y1 + MARGIN) - cy
    cx, cy = max(0, cx), max(0, cy)
    cw, ch = min(W - cx, cw), min(H - cy, ch)
    crop = out[cy:cy + ch, cx:cx + cw].copy()
    # anything not joined to the specimen itself (a printed caption, a lone crumb) goes
    o = crop.astype(np.int16)
    nw = (o.min(2) <= 225).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(cv2.dilate(nw, np.ones((3, 3), np.uint8)), connectivity=8)
    if n > 1:
        top = max(stats[1:, cv2.CC_STAT_AREA])
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] < min(0.01 * top, 400):
                crop[lab == i] = 255
    DEBUG[fig] = dict(segs=segs, fixed=fixed[cy:cy + ch, cx:cx + cw], refs=tuple(r[cy:cy + ch, cx:cx + cw] for r in refs), allband=allband[cy:cy + ch, cx:cx + cw], back=back[cy:cy + ch, cx:cx + cw],
                      bridged=bridged[cy:cy + ch, cx:cx + cw], crumb=crumb[cy:cy + ch, cx:cx + cw])
    return Image.fromarray(crop.astype(np.uint8), 'RGB'), [int(cx), int(cy), int(cw), int(ch)]


DEBUG = {}


def main():
    check = '--check' in sys.argv
    debug = '--debug' in sys.argv
    data = json.load(open(DATA))
    os.makedirs(OUT, exist_ok=True)
    idx_path = os.path.join(OUT, 'index.json')
    index = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    bad = 0
    for sp in data['specimens']:
        fig = sp['figure']
        avif, webp = os.path.join(OUT, fig + '.avif'), os.path.join(OUT, fig + '.webp')
        if check:
            if not (os.path.exists(avif) and os.path.exists(webp) and fig in index):
                print(f'specimen {fig}: missing picture or crop (run python3 scripts/build-lab-specimens.py)')
                bad += 1
                continue
            # no dark mark that the original figure does not have (each written picture, as the browser gets it);
            # the bands and their sides come from cleaning the figure again in memory
            import cv2
            cx, cy, cw, ch = index[fig]['crop']
            _, crop_ = clean(fig, sp)
            if crop_ != index[fig]['crop']:
                print(f'specimen {fig}: crop {crop_} differs from index.json (run python3 scripts/build-lab-specimens.py)')
                bad += 1
                continue
            refs, joins = DEBUG[fig]['refs'], DEBUG[fig]['bridged']
            for path in (avif, webp):
                pic = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
                if pic.shape[:2] != refs[0].shape[:2]:
                    print(f'specimen {fig}: {os.path.basename(path)} is {pic.shape[1]} x {pic.shape[0]}, crop says {cw} x {ch}')
                    bad += 1
                    continue
                n, _, st, cen = cv2.connectedComponentsWithStats((new_dark(pic, refs) & ~joins).astype(np.uint8), connectivity=8)
                for i in range(1, n):
                    print(f'specimen {fig}: {os.path.basename(path)} has a dark mark the original does not, '
                          f'{st[i, cv2.CC_STAT_AREA]} px at ({int(cen[i][0])}, {int(cen[i][1])})')
                    bad += 1
            continue
        im, crop = clean(fig, sp)
        im.save(avif, quality=62)
        im.save(webp, quality=82, method=6)
        index[fig] = {'crop': crop, 'w': im.width, 'h': im.height}
        print(f'{fig}: crop {crop}, {os.path.getsize(avif) // 1024} KB avif, {os.path.getsize(webp) // 1024} KB webp')
        if debug:
            dbg = im.convert('RGBA')
            g = ImageDraw.Draw(dbg)
            for s in sp['spots']:
                for (x, y) in s['at']:
                    X, Y = x - crop[0], y - crop[1]
                    g.ellipse([X - 6, Y - 6, X + 6, Y + 6], outline=(0, 255, 0, 255), width=3)
                    g.text((X + 8, Y - 6), s['label'], fill=(0, 0, 255, 255))
            dbg.save(f'/tmp/specimen-{fig}.png')
    if not check:
        json.dump(index, open(idx_path, 'w'), indent=1, sort_keys=True)
        open(idx_path, 'a').write('\n')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
