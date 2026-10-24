"""Code drawn background, gradient aware: the painting is split into regions (Felzenszwalb segmentation on a
smoothed copy), each region is traced as a vector shape (potrace) and filled with a linear gradient fitted to the
painting's colours in that region, so soft shading survives without posterized blotches. Regions are assigned to
depth layers (sky, far, building, trees with one pivot per tree for sway, wall, ground).
Output art/bg2.json in crop pixel coordinates."""
import json, subprocess, re, sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage
from skimage.segmentation import felzenszwalb
import xml.etree.ElementTree as ET
from svgpathtools import parse_path, Line, CubicBezier

SVGNS = '{http://www.w3.org/2000/svg}'
src = np.array(Image.open('art/scene_crop.png').convert('RGB'))
H, W = src.shape[:2]
S = 3
big = cv2.resize(src, (W * S, H * S), interpolation=cv2.INTER_CUBIC)
sm = cv2.bilateralFilter(big, 9, 40, 9)
seg = felzenszwalb(sm, scale=float(sys.argv[1]) if len(sys.argv) > 1 else 300, sigma=0.9, min_size=int(sys.argv[2]) if len(sys.argv) > 2 else 90)
n = seg.max() + 1
print('regions', n)
Yb, Xb = np.mgrid[:H * S, :W * S]


def potrace(mask, x0, y0, alpha=1.0):
    h, w = mask.shape
    Image.fromarray(((~mask) * 255).astype(np.uint8)).convert('1').save('/tmp/_r2.bmp')
    subprocess.run(['potrace', '/tmp/_r2.bmp', '-s', '-o', '/tmp/_r2.svg', '--flat', '-a', str(alpha), '-O', '0.4', '-t', '6'], check=True)
    root = ET.parse('/tmp/_r2.svg').getroot()
    segs = []
    for g_ in root.iter(SVGNS + 'g'):
        tr = g_.get('transform') or ''
        mt = re.search(r'translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)\s*scale\(([-\d.e]+)[ ,]+([-\d.e]+)\)', tr)
        tx, ty, sx, sy = [float(v) for v in mt.groups()] if mt else (0, 0, 1, 1)
        for el in g_.iter(SVGNS + 'path'):
            for sg in parse_path(el.get('d')):
                if isinstance(sg, Line):
                    p0, p3 = sg.start, sg.end; c1, c2 = p0 + (p3 - p0) / 3, p0 + 2 * (p3 - p0) / 3
                elif isinstance(sg, CubicBezier):
                    p0, c1, c2, p3 = sg.start, sg.control1, sg.control2, sg.end
                else:
                    continue
                f = lambda z: [round(((z.real * sx + tx) + x0) / S, 2), round(((z.imag * sy + ty) + y0) / S, 2)]
                segs.append([f(p0), f(c1), f(c2), f(p3)])
    return segs


# layer assignment helpers (crop coords)
def poly(pts):
    m = np.zeros((H * S, W * S), np.uint8); cv2.fillPoly(m, [(np.array(pts) * S).astype(np.int32)], 1); return m > 0
TREEBOX = poly([(0, 110), (495, 110), (495, 352), (0, 352)])
BUILD = poly([(440, 95), (W, 95), (W, 352), (440, 352)])
WALL = poly([(50, 340), (1002, 340), (1002, 458), (50, 458)])
r, g, b = [big[..., i].astype(int) for i in range(3)]
greenish = (g > r + 8) & (g > b) | ((r > b + 25) & (r < 175) & (Y := Yb) < 350 * S) & TREEBOX & (np.abs(r - g) < 70)
regions = []
objs = ndimage.find_objects(seg + 1)
for k in range(n):
    sl = objs[k]
    if sl is None:
        continue
    m = seg[sl] == k
    area = m.sum()
    ys, xs = np.nonzero(m)
    ys = ys + sl[0].start; xs = xs + sl[1].start
    col = big[ys, xs].astype(np.float64)
    A = np.c_[np.ones(len(xs)), xs / S, ys / S]
    coef, *_ = np.linalg.lstsq(A, col, rcond=None)          # colour = a + bx*x + by*y per channel
    # dominant direction from luminance
    lum = coef[1:] @ np.array([0.3, 0.59, 0.11])
    gd = lum / (np.linalg.norm(lum) + 1e-9) if np.linalg.norm(lum) > 1e-3 else np.array([0.0, 1.0])
    proj = (xs / S) * gd[0] + (ys / S) * gd[1]
    s0, s1 = np.percentile(proj, 2), np.percentile(proj, 98)
    cx, cy = xs.mean() / S, ys.mean() / S
    def colat(s):
        # mean colour along the direction at projection s (fit along the axis)
        return np.clip(coef[0] + coef[1] * (cx + (s - (cx * gd[0] + cy * gd[1])) * gd[0]) + coef[2] * (cy + (s - (cx * gd[0] + cy * gd[1])) * gd[1]), 0, 255)
    c0, c1_ = colat(s0), colat(s1)
    # pad mask by 1 px so neighbours overlap (no seams)
    pad = 3
    y0, y1 = max(sl[0].start - pad, 0), min(sl[0].stop + pad, H * S)
    x0, x1 = max(sl[1].start - pad, 0), min(sl[1].stop + pad, W * S)
    mm = seg[y0:y1, x0:x1] == k
    mm = ndimage.binary_dilation(mm, iterations=1)
    inside = lambda M: M[ys, xs].mean()
    gfrac = greenish[ys, xs].mean()
    if cy < 345 and inside(TREEBOX) > 0.6 and gfrac > 0.5 and area < 60000 * S:
        layer = 'trees'
    elif cy < 352 and inside(BUILD) > 0.6:
        layer = 'building'
    elif inside(WALL) > 0.6:
        layer = 'wall'
    elif cy < 300 and (big[ys, xs, 2].astype(int) > big[ys, xs, 0].astype(int) + 10).mean() > 0.5 or cy < 110:
        layer = 'sky'
    elif cy < 352:
        layer = 'far'
    else:
        layer = 'ground'
    if layer == 'sky':
        continue                                   # the sky is drawn in code (gradient, sun glow, traced clouds)
    segs = potrace(mm, x0, y0, 0.55 if layer in ('building', 'wall') else 1.0)
    if not segs:
        continue
    regions.append(dict(layer=layer, area=int(area), segs=segs, g0=[float(gd[0] * s0), float(gd[1] * s0)],
                        g1=[float(gd[0] * s1), float(gd[1] * s1)], c0=[int(v) for v in c0], c1=[int(v) for v in c1_],
                        cx=float(cx), cy=float(cy)))
# tree groups: connected tree regions -> one pivot per tree (trunk base)
tm = np.zeros((H * S, W * S), bool)
for rgn in regions:
    if rgn['layer'] == 'trees':
        pass
lab = None
# sky: per row colour of the clear blue sky (right half, away from the sun), and pale clouds traced as shapes
skym = (b > r + 15) & (Yb < 360 * S)
lab_, nl = ndimage.label(skym)
topl = set(np.unique(lab_[:6][lab_[:6] > 0])); skym = np.isin(lab_, list(topl))
rows = []
for y in range(0, H * S, S):
    m = skym[y] & (Xb[y] > 600 * S) & (big[y, :, 0] < 150)
    rows.append(np.median(big[y][m], 0).astype(int).tolist() if m.sum() > 10 else None)
last = None
for i in range(len(rows)):
    rows[i] = rows[i] if rows[i] is not None else last; last = rows[i]
rows = [v if v is not None else next(x for x in rows if x) for v in rows]
cl = skym & (big[..., 0] > 110) & (big[..., 2] > 185) & (big[..., 1] > 150) & (Yb < 120 * S) & (Xb > 40 * S)
cl = ndimage.gaussian_filter(cl.astype(float), 3.5 * S) > 0.5
cl = ndimage.binary_opening(cl, iterations=3)
clouds = []
clab, nc = ndimage.label(cl)
for k in range(1, nc + 1):
    m = clab == k
    if m.sum() < 300:
        continue
    ys, xs = np.nonzero(m)
    col = big[ys, xs].astype(float)
    top = col[ys < np.percentile(ys, 40)].mean(0); bot = col[ys > np.percentile(ys, 60)].mean(0)
    sl = ndimage.find_objects(m.astype(int))[0]
    y0, x0 = max(sl[0].start - 3, 0), max(sl[1].start - 3, 0)
    segs = potrace(m[y0:sl[0].stop + 3, x0:sl[1].stop + 3], x0, y0, 1.2)
    clouds.append(dict(segs=segs, top=[int(v) for v in top], bot=[int(v) for v in bot], y0=float(ys.min() / S), y1=float(ys.max() / S)))
json.dump(dict(W=W, H=H, regions=regions, sky=rows, clouds=clouds, sun=[0, 150, 230]), open('art/bg2.json', 'w'))
from collections import Counter
print(Counter(r_['layer'] for r_ in regions))
