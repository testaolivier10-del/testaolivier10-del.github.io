"""Shared drawing helpers and the film finish (split out of places.py so boards do not depend on the story modules)."""
import math
import numpy as np
import skia
from kit import C, P, SP, sm, W, H, blur, text, width, CREAM, AMBER


def mixc(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def rr(x0, y0, x1, y1, r):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def lgrad(c, rect, c0, c1, vertical=True, a=255):
    x0, y0, x1, y1 = rect
    pts = [skia.Point(x0, y0), skia.Point(x0, y1) if vertical else skia.Point(x1, y0)]
    c.drawRect(skia.Rect(x0, y0, x1, y1), skia.Paint(Shader=skia.GradientShader.MakeLinear(pts, [C(c0, a), C(c1, a)]), AntiAlias=True))


def poly(pts):
    p = skia.Path(); p.addPoly([skia.Point(*q) for q in pts], True); return p


def glow(c, x, y, r, col, a=1.0):
    if a > 0.01:
        c.drawCircle(x, y, r, P(col, 255 * min(1, a), MaskFilter=blur(r * 0.45), BlendMode=skia.BlendMode.kScreen))


def camera(c, z, fx, fy, ox=W / 2, oy=H / 2):
    """zoom z about scene point (fx, fy), which lands at (ox, oy)"""
    c.translate(ox, oy); c.scale(z, z); c.translate(-fx, -fy)


_GR = None


def finish(c, t, vig=0.14, warm=10, lift=0.0):
    """film finish: a gentle warm grade, a light vignette, fine moving grain (the bloom is the additive light drawn in the scene)"""
    global _GR
    if warm: c.drawRect(skia.Rect(0, 0, W, H), P((255, 200, 150), warm, BlendMode=skia.BlendMode.kSoftLight))
    if lift: c.drawRect(skia.Rect(0, 0, W, H), P((120, 130, 190), 255 * lift, BlendMode=skia.BlendMode.kScreen))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * 0.7, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((6, 8, 20), int(255 * vig * 1.6))], [0, 0.55, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    if _GR is None:
        rs = np.random.default_rng(7); _GR = []
        for k in range(6):
            a = (rs.normal(128, 40, (H // 2, W // 2))).clip(0, 255).astype(np.uint8)
            _GR.append(skia.Image.fromarray(np.ascontiguousarray(np.dstack([a, a, a, np.full_like(a, 9)])), colorType=skia.kRGBA_8888_ColorType))
    c.drawImageRect(_GR[int(t * 24) % 6], skia.Rect(0, 0, W, H), skia.SamplingOptions(), skia.Paint(BlendMode=skia.BlendMode.kOverlay))


