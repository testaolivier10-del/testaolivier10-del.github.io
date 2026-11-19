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
  5. writes figures/specimens/<figure>.avif and .webp (WebP is the fallback for a browser without AVIF), and
     figures/specimens/index.json with each crop (figure pixels) so the page can place the spots.

The spots themselves (where each leader line ended) are data, set by eye: this script never moves them.
Needs Pillow with AVIF support, NumPy and OpenCV (cv2.inpaint).

  python3 scripts/build-lab-specimens.py            write every specimen
  python3 scripts/build-lab-specimens.py --check    exit 1 if a specimen picture or its crop entry is missing
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


def two_sided(white):
    """white on both sides (left and right, or above and below, 3 to 6 px away): a line on the background, not the
    outline of the drawing, which has the drawing on one side"""
    H, W = white.shape
    w = white.astype(np.uint8)

    def shifted(dx, dy):
        out = np.zeros((H, W), np.uint8)
        ys, yd = (slice(0, H - dy), slice(dy, H)) if dy >= 0 else (slice(-dy, H), slice(0, H + dy))
        xs, xd = (slice(0, W - dx), slice(dx, W)) if dx >= 0 else (slice(-dx, W), slice(0, W + dx))
        out[yd, xd] = w[ys, xs]
        return out

    def side(dx, dy):
        return sum(shifted(dx * k, dy * k) for k in (3, 4, 5, 6)) >= 3
    return (side(1, 0) & side(-1, 0)) | (side(0, 1) & side(0, -1))


def walk(core, loose, pos, d, img=None):
    """follow a line from pos along d: straight on dark pixels (loose: a black line over a colour is a little
    tinted), round a bend only along neutral black (core), so an outline is never followed"""
    H, W = core.shape

    def on(m, p):
        x, y = int(round(p[0])), int(round(p[1]))
        return 0 <= x < W and 0 <= y < H and m[y, x]
    path = [pos.copy()]
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
    return path


def clean(fig, spec):
    import cv2
    A, boxes = load(fig)
    H, W, _ = A.shape
    img = A.copy()
    # 1. label boxes
    for b in boxes:
        x, y, w, h = b
        img[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2] = 255
    white, core, soft = masks(img)
    loose = ((img.max(2) - img.min(2)) < 60) & (img.max(2) < 110)
    drawing = ~(white | core | soft)
    # 2. leader lines on the background: straight runs of line pixels with no drawing colour round them (a curved
    # outline of the drawing is never a long straight run)
    sat = img.max(2) - img.min(2)
    # a line and its anti-aliased edge: grey and dark, or grey right beside a dark core (a pale fill further in is not)
    near2 = cv2.dilate(core.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    greyish = (sat < 50) & ((img.max(2) < 215) | near2) & ~white
    bg_line = (core | soft) & (box_share(~(white | greyish), 4) < 0.02) & (box_share(white, 4) > 0.2) & two_sided(white)
    # only runs that reach a label box are leader lines (a thin hair tip or an outline on the background is not)
    nb, lb = cv2.connectedComponents(bg_line.astype(np.uint8), connectivity=8)
    boxed = np.zeros((H, W), bool)
    for b in boxes:
        x, y, w, h = b
        boxed[max(0, y - 22):y + h + 22, max(0, x - 22):x + w + 22] = True
    keep = np.unique(lb[boxed & bg_line])
    bg_line = np.isin(lb, keep[keep > 0])
    segs = cv2.HoughLinesP((bg_line & core).astype(np.uint8) * 255, 1, np.pi / 360, 18, minLineLength=22, maxLineGap=3)
    straight = np.zeros((H, W), np.uint8)
    segs = [] if segs is None else [tuple(int(v) for v in np.ravel(l)[:4]) for l in segs]
    for (x0, y0, x1, y1) in segs:
        cv2.line(straight, (x0, y0), (x1, y1), 1, 5)
    erase_bg = bg_line & (straight > 0)
    # 3. each straight run that ends at the drawing goes on into it: followed there (straight, round a bend) and
    # painted out
    dist = cv2.distanceTransform((~drawing).astype(np.uint8), cv2.DIST_L2, 3)
    path = np.zeros((H, W), bool)
    starts = []
    for (x0, y0, x1, y1) in segs:
        for (ax, ay, bx, by) in ((x0, y0, x1, y1), (x1, y1, x0, y0)):
            if dist[ay, ax] < 12 and dist[ay, ax] < dist[by, bx]:
                d = np.array([ax - bx, ay - by], float)
                d /= np.linalg.norm(d)
                if any(abs(ax - sx) < 5 and abs(ay - sy) < 5 and abs(d @ sd) > 0.97 for sx, sy, sd in starts):
                    continue
                starts.append((ax, ay, d))
                for p in walk(core, loose, np.array([ax, ay], float), d, img):
                    px, py = int(round(p[0])), int(round(p[1]))
                    path[max(0, py - 3):py + 4, max(0, px - 3):px + 4] = True
    # 3b. and every line is also followed from its own label box (a line with a short run on the background)
    def inbox(x, y, pad=1):
        for b in boxes:
            if b[0] - pad <= x < b[0] + b[2] + pad and b[1] - pad <= y < b[1] + b[3] + pad:
                return True
        return False
    for b in boxes:
        x, y, w, h = b
        seen = []
        for yy in range(max(0, y - 3), min(H, y + h + 3)):
            for side in (-1, 1):
                for dx in range(3, 22):
                    xx = x - dx if side < 0 else x + w - 1 + dx
                    if not (0 <= xx < W) or inbox(xx, yy):
                        continue
                    if not (core[yy, xx] and bg_line[yy, xx]):
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
                    for p in walk(core, loose, np.array([xx, yy], float), d, img):
                        px, py = int(round(p[0])), int(round(p[1]))
                        path[max(0, py - 3):py + 4, max(0, px - 3):px + 4] = True
                    break
    # 4. lines the data names by hand (a branch the follower missed), figure pixels
    for e in spec.get('erase', []):
        m = np.zeros((H, W), np.uint8)
        if len(e) == 3:
            cv2.circle(m, (e[0], e[1]), e[2], 1, 7)
        else:
            cv2.line(m, (e[0], e[1]), (e[2], e[3]), 1, 7)
        path |= m > 0
    mx, mn = img.max(2), img.min(2)
    lineish = ((mx - mn) < 90) | (mx < 150)
    out = img.copy()
    # the background: away from the drawing's fill by more than its outline (an outline is never painted white)
    on_bg = cv2.dilate(drawing.astype(np.uint8), np.ones((9, 9), np.uint8)) == 0
    out[erase_bg | (path & lineish & on_bg)] = 255
    # the stub of a line just outside the drawing's outline (more than the outline's width from its colours)
    dist_fill = cv2.distanceTransform((~drawing).astype(np.uint8), cv2.DIST_L2, 3)
    out[path & (core | soft) & (dist_fill > 3.5)] = 255
    # and a tick of line left on the drawing's outer edge (more background than drawing round it)
    out[path & (core | soft) & (box_share(drawing, 3) < 0.3) & (box_share(white, 3) > 0.3)] = 255
    # the outline where a line crosses it is kept (black on black does not show), so no white is pulled into it
    wm = (white | erase_bg | (path & on_bg)).astype(np.uint8)
    reach = np.zeros((H + 2, W + 2), np.uint8)
    for sx, sy in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        if wm[sy, sx]:
            cv2.floodFill(wm, reach, (sx, sy), 2, 0, 0, flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY)
    to_out = cv2.distanceTransform((reach[1:-1, 1:-1] == 0).astype(np.uint8), cv2.DIST_L2, 3)
    inside = (path & lineish & ~on_bg & (to_out > 4)).astype(np.uint8)
    inside = cv2.dilate(inside, np.ones((3, 3), np.uint8))
    out = cv2.inpaint(out.astype(np.uint8), inside, 5, cv2.INPAINT_TELEA)
    # what is left of a line's grey edge on the background goes white
    o = out.astype(np.int16)
    near_line = cv2.dilate((path | erase_bg).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    left = on_bg & near_line & ((o.max(2) - o.min(2)) < 18) & (o.min(2) < 250) & (o.min(2) > 195)
    out[left] = 255
    # 5. crop
    if spec.get('crop'):
        cx, cy, cw, ch = spec['crop']
    else:
        nonwhite = ~masks(out.astype(np.int16))[0]
        n, lab, stats, _ = cv2.connectedComponentsWithStats(cv2.dilate(nonwhite.astype(np.uint8), np.ones((5, 5), np.uint8)))
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
    # small specks left on the background (a printed caption, a stray dot) go
    wm = masks(crop.astype(np.int16))[0]
    n, lab, stats, _ = cv2.connectedComponentsWithStats(cv2.dilate((~wm).astype(np.uint8), np.ones((5, 5), np.uint8)))
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 0.004 * ch * cw:
            crop[lab == i] = 255
    return Image.fromarray(crop.astype(np.uint8), 'RGB'), [int(cx), int(cy), int(cw), int(ch)]


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
