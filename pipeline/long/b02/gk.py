"""Shared helpers for the w1031 Shorts: house flat style primitives (from knight v3), word timing, layout, render."""
import sys, math, json, subprocess, os
import numpy as np, skia

W, H, FPS = 1080, 1920, 30
START = 0.0


def C(rgb, a=255):
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(max(0, min(255, a))))


def P(col, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), **k)


def SP(col, w, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                      StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join, **k)


def blur(r):
    return skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, max(0.1, r))


def smooth(u):
    u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def poly(pts):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p


def smooth_closed(pts):
    """Catmull Rom closed curve through pts."""
    n = len(pts); p = skia.Path()
    p.moveTo(*pts[0])
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        p.cubicTo(*c1, *c2, *p2)
    p.close(); return p


def rim_of(path, d):
    q = skia.Path(path); q.offset(*d)
    return skia.Op(path, q, skia.PathOp.kDifference_PathOp)


def flat(c, path, base, shade=None, sh_off=(9, -2), rim=None, rim_d=(-3.5, 4), rim_a=255, a=255):
    """flat fill, a hard shade tone on the side away from the light, a rim on the lit edge (knight v3 method)"""
    c.drawPath(path, P(base, a))
    if shade is not None:
        q = skia.Path(path); q.offset(*sh_off)
        d = skia.Op(path, q, skia.PathOp.kDifference_PathOp)
        if d is not None: c.drawPath(d, P(shade, a))
    if rim is not None:
        r = rim_of(path, rim_d)
        if r is not None: c.drawPath(r, P(rim, rim_a * a / 255))


def lgrad(c, rect, y0, y1, cols, pos=None):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, y0), skia.Point(0, y1)], [C(x) if len(x) == 3 else C(x[:3], x[3]) for x in cols], pos)
    c.drawRect(rect, skia.Paint(Shader=sh))


def ridge(pts, bottom=2400):
    return poly(list(pts) + [(pts[-1][0], bottom), (pts[0][0], bottom)])


def jag(pts, seed, amp=4, step=18):
    rs = np.random.default_rng(seed); out = []
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        out.append((x0, y0)); n = max(1, int(abs(x1 - x0) / step))
        for k in range(1, n):
            f = k / n; out.append((x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + rs.uniform(-amp, amp)))
    out.append(pts[-1]); return out


def limb(c, a, b, w0, w1, col):
    """a tapered limb tube from a to b with round ends"""
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d
    p = poly([(ax + nx * w0 / 2, ay + ny * w0 / 2), (bx + nx * w1 / 2, by + ny * w1 / 2), (bx - nx * w1 / 2, by - ny * w1 / 2), (ax - nx * w0 / 2, ay - ny * w0 / 2)])
    p.addCircle(ax, ay, w0 / 2); p.addCircle(bx, by, w1 / 2)
    p.setFillType(skia.PathFillType.kWinding)
    p2 = skia.Path(); skia.Op(p, p, skia.PathOp.kUnion_PathOp, p2) if False else None
    c.drawPath(p, P(col))
    return p


def ik2(root, target, l1, l2, bend=1):
    """two bone IK in screen coords, returns the middle joint"""
    rx, ry = root; tx, ty = target
    d = min(math.hypot(tx - rx, ty - ry), l1 + l2 - 0.01)
    a = math.atan2(ty - ry, tx - rx)
    cosb = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    b = math.acos(max(-1, min(1, cosb)))
    ang = a + bend * b
    return (rx + l1 * math.cos(ang), ry + l1 * math.sin(ang))


