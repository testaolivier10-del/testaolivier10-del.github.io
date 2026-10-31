"""Trace a reference figure into vector shapes for skia (no image pixels in the output).
trace(png, box, k) -> [(rgb, skia.Path)] in the crop's pixel coordinates, drawn bottom layer first."""
import numpy as np, cv2, skia
from PIL import Image


def _mask(crop):
    """the figure: everything connected to the crop border that looks like the background is removed"""
    lab = cv2.cvtColor(crop, cv2.COLOR_RGB2LAB).astype(np.float32)
    border = np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    bgc = np.median(border, 0)
    d = np.linalg.norm(lab - bgc, axis=2)
    near = (d < 26).astype(np.uint8)
    n, cc = cv2.connectedComponents(near)
    edge = set(np.unique(np.concatenate([cc[0], cc[-1], cc[:, 0], cc[:, -1]])))
    sizes = np.bincount(cc.ravel())
    keep = [e for e in range(1, n) if e in edge or sizes[e] > 150]       # enclosed gaps (arm to body) are background too
    bgm = np.isin(cc, keep) & (near > 0)
    m = (~bgm).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m


def _curve(pts):
    k = 2
    pts = np.stack([np.convolve(np.r_[pts[-k:, j], pts[:, j], pts[:k, j]], np.ones(2 * k + 1) / (2 * k + 1), 'valid') for j in (0, 1)], 1)
    pts = pts[::2]
    p = skia.Path()
    if len(pts) < 3:
        return p
    p.moveTo(*pts[0])
    for q in range(1, len(pts) - 1, 2):
        p.quadTo(*pts[q], *pts[q + 1])
    p.close()
    return p


def trace(png, box, k=12, min_area=30, mask=None, up=1):
    im = np.array(Image.open(png).convert('RGB'))
    x0, y0, x1, y1 = box
    crop = np.ascontiguousarray(im[y0:y1, x0:x1])
    m = _mask(crop) if mask is None else mask
    if up != 1:
        crop = np.array(Image.fromarray(crop).resize((crop.shape[1] * up, crop.shape[0] * up), Image.LANCZOS))
        m = cv2.resize(m, (crop.shape[1], crop.shape[0]), interpolation=cv2.INTER_NEAREST)
        min_area *= up * up
    Z = crop[m > 0].astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.3)
    _, lab, cen = cv2.kmeans(Z, k, None, crit, 4, cv2.KMEANS_PP_CENTERS)
    L = np.full(m.shape, 255, np.uint8); L[m > 0] = lab[:, 0]
    # clean thin anti-aliased fringes: a mode filter on the labels
    L = cv2.medianBlur(L, 5)
    L[m == 0] = 255
    layers = []
    # base silhouette first in the most common colour, so no gaps show between layers
    counts = [(L == i).sum() for i in range(k)]
    order = np.argsort(counts)[::-1]
    sil = skia.Path()
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for cnt in cs:
        if cv2.contourArea(cnt) > min_area:
            sil.addPath(_curve(cnt[:, 0, :].astype(np.float32)))
    layers.append((tuple(int(v) for v in cen[order[0]]), sil))
    for i in order[1:]:
        mm = (L == i).astype(np.uint8)
        if mm.sum() < min_area:
            continue
        cs, hier = cv2.findContours(mm, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
        p = skia.Path(); p.setFillType(skia.PathFillType.kEvenOdd)
        for cnt in cs:
            if cv2.contourArea(cnt) >= 4:
                p.addPath(_curve(cnt[:, 0, :].astype(np.float32)))
        layers.append((tuple(int(v) for v in cen[i]), p))
    if up != 1:
        mt = skia.Matrix(); mt.setScale(1 / up, 1 / up)
        for _, p in layers:
            p.transform(mt)
    return layers


def draw(c, layers, x, y, s, a=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    for col, p in layers:
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(*col, int(255 * a))))
    c.restore()
