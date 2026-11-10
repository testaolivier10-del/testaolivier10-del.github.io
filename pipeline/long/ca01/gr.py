"""Board helpers for the calc video: handwritten equations with fractions and roots (one left to right reveal), and
graphs (axes, curves drawn on, filled and open dots, dashed guides). Everything in Kalam, house colours."""
import math
import numpy as np
import skia
import kit as K
import mk as M
from kit import P, SP, sm, CREAM, AMBER, CORAL, TEAL, YELLOW, GREEN, INK2, NAVY, blur


# ------------------------------------------------------------------ equations
def _w(tok, size):
    if isinstance(tok, str):
        return M.mw(tok, size)
    k = tok[0]
    if k == 'frac':
        return max(_w(tok[1], size * 0.8), _w(tok[2], size * 0.8)) + size * 0.3
    if k == 'root':
        return size * 0.62 + (size * 0.25 if len(tok) > 2 and tok[2] else 0) + _w(tok[1], size) + size * 0.12
    if k == 'col':
        return _w(tok[2], size)
    if k == 'seq':
        return sum(_w(x, size) for x in tok[1])
    if k == 'sub':
        return M.mw(tok[1], size) + K.font('hand', size * 0.55).measureText(tok[2]) + 2
    raise ValueError(tok)


def _draw(c, tok, x, y, size, col):
    if isinstance(tok, str):
        M.mdraw(c, tok, x, y, size, col)
        return M.mw(tok, size)
    k = tok[0]
    if k == 'col':
        return _draw(c, tok[2], x, y, size, tok[1])
    if k == 'seq':
        cx = x
        for t_ in tok[1]:
            cx += _draw(c, t_, cx, y, size, col)
        return cx - x
    if k == 'sub':
        w1 = M.mw(tok[1], size); M.mdraw(c, tok[1], x, y, size, col)
        f = K.font('hand', size * 0.55); c.drawString(tok[2], x + w1 + 2, y + size * 0.22, f, P(col))
        return w1 + f.measureText(tok[2]) + 2
    if k == 'frac':
        s2 = size * 0.8
        wt_, wb = _w(tok[1], s2), _w(tok[2], s2)
        w = max(wt_, wb) + size * 0.3
        by = y - size * 0.32
        c.drawLine(x + size * 0.05, by, x + w - size * 0.05, by, SP(col, max(3, size * 0.05)))
        _draw(c, tok[1], x + (w - wt_) / 2, by - size * 0.16, s2, col)
        _draw(c, tok[2], x + (w - wb) / 2, by + s2 * 0.98, s2, col)
        return w
    if k == 'root':
        idx = tok[2] if len(tok) > 2 else None
        cx = x
        if idx:
            f = K.font('hand', size * 0.45); c.drawString(idx, cx, y - size * 0.55, f, P(col)); cx += size * 0.25
        wr = _w(tok[1], size)
        p = skia.Path(); p.moveTo(cx, y - size * 0.32); p.lineTo(cx + size * 0.14, y - size * 0.4); p.lineTo(cx + size * 0.3, y + size * 0.08)
        p.lineTo(cx + size * 0.52, y - size * 0.92); p.lineTo(cx + size * 0.62 + wr + size * 0.06, y - size * 0.92)
        c.drawPath(p, SP(col, max(3, size * 0.05)))
        _draw(c, tok[1], cx + size * 0.62, y, size, col)
        return cx + size * 0.62 + wr + size * 0.12 - x
    raise ValueError(tok)


def eq(c, toks, x, y, size, u=1.0, col=CREAM, a=1.0, align='left'):
    """a handwritten equation. toks: a list of strings (with ^{..} powers), ('frac', top, bottom), ('root', inner[, index]),
    ('col', colour, tok), ('seq', [toks]). Revealed left to right as u goes 0 -> 1. Returns (x_left, width)."""
    w = sum(_w(t_, size) for t_ in toks)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    if u <= 0.001 or a <= 0.01:
        return x, w
    c.save(); c.clipRect(skia.Rect(x - 10, y - size * 2.2, x + (w + 20) * u, y + size * 1.4))
    if a < 0.99:
        c.saveLayerAlpha(None, int(255 * a))
    cx = x
    for t_ in toks:
        cx += _draw(c, t_, cx, y, size, col)
    if a < 0.99:
        c.restore()
    c.restore()
    return x, w


def strike(c, x0, x1, y, u, a=1.0, col=CORAL, w=6):
    if u > 0.01:
        c.drawLine(x0 - 6, y + 8, x0 - 6 + (x1 - x0 + 12) * u, y - 12 * u, SP(col, w, 235 * a))


# ------------------------------------------------------------------ graphs
class Ax:
    def __init__(self, x0, y0, x1, y1, xmin, xmax, ymin, ymax):
        self.b = (x0, y0, x1, y1); self.r = (xmin, xmax, ymin, ymax)

    def X(self, x):
        x0, _, x1, _ = self.b; a, b, _, _ = self.r
        return x0 + (x - a) / (b - a) * (x1 - x0)

    def Y(self, y):
        _, y0, _, y1 = self.b; _, _, a, b = self.r
        return y1 - (y - a) / (b - a) * (y1 - y0)

    def pt(self, x, y):
        return (self.X(x), self.Y(y))


def axes(c, ax, a=1.0, xt=(), yt=(), xl='x', yl='y', size=32, col=INK2, grid=False):
    if a <= 0.01:
        return
    x0, y0, x1, y1 = ax.b
    ox, oy = ax.X(max(ax.r[0], min(ax.r[1], 0))), ax.Y(max(ax.r[2], min(ax.r[3], 0)))
    if grid:
        for v in xt:
            c.drawLine(ax.X(v), y0, ax.X(v), y1, SP((120, 140, 220), 1.5, 40 * a))
        for v in yt:
            c.drawLine(x0, ax.Y(v), x1, ax.Y(v), SP((120, 140, 220), 1.5, 40 * a))
    c.drawLine(x0 - 10, oy, x1 + 20, oy, SP(col, 4, 255 * a)); c.drawLine(ox, y1 + 10, ox, y0 - 20, SP(col, 4, 255 * a))
    for (p, q, r_) in (((x1 + 26, oy), (x1 + 6, oy - 10), (x1 + 6, oy + 10)), ((ox, y0 - 26), (ox - 10, y0 - 6), (ox + 10, y0 - 6))):
        h = skia.Path(); h.moveTo(*p); h.lineTo(*q); h.lineTo(*r_); h.close(); c.drawPath(h, P(col, 255 * a))
    f = K.font('semi', size * 0.85)
    for v in xt:
        X = ax.X(v); c.drawLine(X, oy - 8, X, oy + 8, SP(col, 3, 255 * a))
        s = _num(v); c.drawString(s, X - f.measureText(s) / 2, oy + size * 1.15, f, P(col, 255 * a))
    for v in yt:
        Y = ax.Y(v); c.drawLine(ox - 8, Y, ox + 8, Y, SP(col, 3, 255 * a))
        s = _num(v); c.drawString(s, ox - 16 - f.measureText(s), Y + size * 0.3, f, P(col, 255 * a))
    if xl:
        K.text(c, xl, x1 + 30, oy + size * 1.1, size, col, a, 'semi')
    if yl:
        K.text(c, yl, ox + 16, y0 - 20, size, col, a, 'semi')


def _num(v):
    s = f'{v:g}'
    return s.replace('-', '−')


def curve(c, ax, f, xa, xb, u=1.0, col=AMBER, w=7, a=1.0, n=240, clipy=True):
    """f drawn from xa toward xb as u goes 0 -> 1 (breaks where f is None or off the box)"""
    if u <= 0.001 or a <= 0.01:
        return
    xe = xa + (xb - xa) * u
    path = skia.Path(); pen = False
    _, y0, _, y1 = ax.b
    for i in range(n + 1):
        x = xa + (xe - xa) * i / n
        try:
            y = f(x)
        except (ZeroDivisionError, ValueError):
            y = None
        if y is None or (clipy and not (ax.r[2] - 0.5 * (ax.r[3] - ax.r[2]) < y < ax.r[3] + 0.5 * (ax.r[3] - ax.r[2]))):
            pen = False; continue
        X, Y = ax.pt(x, y)
        if pen:
            path.lineTo(X, Y)
        else:
            path.moveTo(X, Y); pen = True
    c.save(); c.clipRect(skia.Rect(ax.b[0] - 40, y0 - 40, ax.b[2] + 40, y1 + 40))
    c.drawPath(path, SP(col, w, 255 * a))
    c.restore()


def dot(c, ax, x, y, filled=True, col=AMBER, a=1.0, r=13, hole=NAVY):
    if a <= 0.01:
        return
    X, Y = ax.pt(x, y)
    if filled:
        c.drawCircle(X, Y, r, P(col, 255 * a))
    else:
        c.drawCircle(X, Y, r, P(hole, 255 * a)); c.drawCircle(X, Y, r, SP(col, max(2, r * 0.38), 255 * a))


def dashed(c, p0, p1, col=INK2, w=3, a=1.0, on=14, off=10):
    if a <= 0.01:
        return
    pa = P(col, 255 * a); pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(w)
    pa.setPathEffect(skia.DashPathEffect.Make([on, off], 0))
    c.drawLine(*p0, *p1, pa)


def panel(c, x0, y0, x1, y1, a=1.0):
    if a > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 24, 24), P((14, 18, 44), 200 * a))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 24, 24), SP((90, 104, 170), 2, 160 * a))


def numline(c, x0, x1, y, lo, hi, ticks, a=1.0, col=INK2):
    X = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    if a <= 0.01:
        return X
    c.drawLine(x0, y, x1, y, SP(col, 4, 255 * a))
    f = K.font('semi', 30)
    for v in ticks:
        c.drawLine(X(v), y - 10, X(v), y + 10, SP(col, 3, 255 * a))
        s = _num(v); c.drawString(s, X(v) - f.measureText(s) / 2, y + 46, f, P(col, 255 * a))
    return X
