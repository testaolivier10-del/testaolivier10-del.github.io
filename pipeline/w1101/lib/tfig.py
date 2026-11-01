"""Traced house style figures for w1031 (Olivier 2026-11-01: people at the quality of the grease fire cook).
A Gemini reference (Figma AI, house prompt) is traced into flat vector shapes (lib/trace.py: k-means colours, potrace
like curves); no image pixels reach the video. Parts are cut by masks so they can move in code; warp() bends a path's
points through a displacement field (used to lift a body smoothly while the hands that hold it follow)."""
import os, pickle, math
import numpy as np, cv2, skia
from PIL import Image
import trace as TR

REF = '/home/claude/lp/w1101/ref'
CACHE = '/home/claude/lp/w1101/ref/cache'
os.makedirs(CACHE, exist_ok=True)
BG = [(207, 232, 224)]


def bg_mask(img, extra=(), tol=16, ptol=9):
    """1 = figure. Background = mint (and extra colours) connected to the border, plus enclosed pockets that are
    almost exactly the backdrop colour (gaps between arms and body)."""
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB).astype(np.float32)
    def near_of(t, cols=None):
        near = np.zeros(img.shape[:2], np.uint8)
        for col in (cols if cols is not None else list(BG) + list(extra)):
            c = cv2.cvtColor(np.uint8([[col]]), cv2.COLOR_RGB2LAB).astype(np.float32)[0, 0]
            near |= (np.linalg.norm(lab - c, axis=2) < t).astype(np.uint8)
        return near
    near = near_of(tol)
    n, cc = cv2.connectedComponents(near)
    edge = set(np.unique(np.concatenate([cc[0], cc[-1], cc[:, 0], cc[:, -1]])))
    bgm = np.isin(cc, [e for e in range(1, n) if e in edge]) & (near > 0)
    tight = near_of(ptol, list(BG))
    n2, cc2 = cv2.connectedComponents(tight)
    sizes = np.bincount(cc2.ravel())
    bgm |= np.isin(cc2, [e for e in range(1, n2) if sizes[e] > 150]) & (tight > 0)
    m = (~bgm).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m


def traced(name, box=None, k=20, up=2, extra=(), mask_fn=None, tag='', erode=4):
    key = f'{CACHE}/{name}{tag}_{k}_{up}_e{erode}_v2.pkl'
    if os.path.exists(key):
        d = pickle.load(open(key, 'rb'))
        out = []
        for col, b in d:
            p = skia.Path(); p.readFromMemory(b); out.append((col, p))
        return out
    im = np.array(Image.open(f'{REF}/{name}.png').convert('RGB'))
    if box is None: box = (0, 0, im.shape[1], im.shape[0])
    x0, y0, x1, y1 = box
    crop = np.ascontiguousarray(im[y0:y1, x0:x1])
    m = bg_mask(crop, extra)
    if mask_fn is not None: m = (m & mask_fn(crop)).astype(np.uint8)
    # drop the anti aliased rim fringe of the reference; a clean rim is drawn in code instead (draw(rim=...))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    if erode: m = cv2.erode(m, np.ones((2 * erode + 1, 2 * erode + 1), np.uint8))
    m = cv2.GaussianBlur(m.astype(np.float32), (7, 7), 0)
    m = (m > 0.5).astype(np.uint8)
    layers = TR.trace(None, box, k=k, mask=m, up=up, img=crop)
    pickle.dump([(col, bytes(p.serialize())) for col, p in layers], open(key, 'wb'))
    return layers


def warp(p, f):
    """apply f(x, y) -> (x, y) to every point of path p"""
    q = skia.Path(); q.setFillType(p.getFillType())
    it = skia.Path.Iter(p, False)
    while True:
        verb, pts = it.next()
        if verb == skia.Path.kDone_Verb: break
        if verb == skia.Path.kMove_Verb: q.moveTo(*f(pts[0].x(), pts[0].y()))
        elif verb == skia.Path.kLine_Verb: q.lineTo(*f(pts[1].x(), pts[1].y()))
        elif verb == skia.Path.kQuad_Verb: q.quadTo(*f(pts[1].x(), pts[1].y()), *f(pts[2].x(), pts[2].y()))
        elif verb == skia.Path.kConic_Verb: q.conicTo(*f(pts[1].x(), pts[1].y()), *f(pts[2].x(), pts[2].y()), it.conicWeight())
        elif verb == skia.Path.kCubic_Verb: q.cubicTo(*f(pts[1].x(), pts[1].y()), *f(pts[2].x(), pts[2].y()), *f(pts[3].x(), pts[3].y()))
        elif verb == skia.Path.kClose_Verb: q.close()
    return q


def draw(c, layers, x=0, y=0, s=1.0, a=1.0, flip=False, f=None, tint=None, grow=True, rim=None):
    """draw traced layers; each shape drawn twice (grown 1.5 px, then exact) so seams never show pinholes"""
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s)
    for col, p in layers:
        if f is not None: p = warp(p, f)
        cc = col if tint is None else tuple(int(v * (1 - tint[1]) + tint[0][i] * tint[1]) for i, v in enumerate(col))
        paint = skia.Paint(AntiAlias=True, Color=skia.Color(*cc, int(255 * a)))
        if grow:
            g = skia.Paint(AntiAlias=True, Color=skia.Color(*cc, int(255 * a)), Style=skia.Paint.kStroke_Style, StrokeWidth=1.5 / s, StrokeJoin=skia.Paint.kRound_Join)
            c.drawPath(p, g)
        c.drawPath(p, paint)
    if rim is not None:
        # a thin rim on the lit side of the whole silhouette (the knight's method): silhouette minus itself shifted
        col, (dx, dy), al = rim
        sil = layers[0][1] if f is None else warp(layers[0][1], f)
        q = skia.Path(sil); q.offset(dx / s, dy / s)
        d = skia.Op(sil, q, skia.PathOp.kDifference_PathOp)
        if d is not None:
            c.drawPath(d, skia.Paint(AntiAlias=True, Color=skia.Color(*col, int(al * a))))
    c.restore()
