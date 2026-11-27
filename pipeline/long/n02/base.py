"""Shared helpers for the long video scenes: beat and word times, eases, tags, marks, the board."""
import math
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, pill, AMBER, CORAL, GREEN, CREAM
import fin as WD

Bt = {}


class _D:
    T = 0.0


D = _D()


def cue(k, n=0):
    b = Bt[k]
    if n == 0:
        return b['t0']
    return b['cues'].get(n, b['cues'].get(str(n), b['t0']))


def wt(k, w, nth=0, after=None):
    """global start time of the nth word in beat k that starts with w (case blind); after: only words after that time"""
    n = 0
    for word, a, b in Bt[k]['words']:
        if after is not None and a < after:
            continue
        if word.lower().strip('.,?!:;"\'').startswith(w.lower()):
            if n == nth:
                return a
            n += 1
    raise KeyError(f'{k}: no word {w!r} #{nth}')


def fin(k):
    return Bt[k]['t1']


def ua(t, t0, d=0.5):
    return sm((t - t0) / d)


def talking(t, k, t0=None, t1=None):
    for w, a, b in Bt[k]['words']:
        if (t0 is None or a >= t0) and (t1 is None or a <= t1) and a <= t <= b:
            return 0.35 + 0.35 * abs(math.sin((t - a) * 18))
    return 0.0


def practice_tag(c, t, t0, s='YOUR TURN'):
    pill(c, s, 230, 92, AMBER, 44, sm((t - t0) / 0.3), kind='xb')


def answer_tag(c, t, t0):
    pill(c, 'ANSWER', 200, 92, GREEN, 44, sm((t - t0) / 0.3), kind='xb')


def title(c, s, t, t0, y=150, col=CREAM, size=54):
    text(c, s, W / 2, y, size, col, sm((t - t0) / 0.4), 'xb', 'center')


def check(c, x, y, s=1.0, a=1.0, col=GREEN):
    if a > 0.01:
        p = skia.Path(); p.moveTo(x - 30 * s, y); p.lineTo(x - 8 * s, y + 22 * s); p.lineTo(x + 34 * s, y - 26 * s)
        c.drawPath(p, SP(col, 11 * s, 255 * a))


def cross(c, x, y, s=1.0, a=1.0, col=CORAL):
    if a > 0.01:
        c.drawLine(x - 26 * s, y - 26 * s, x + 26 * s, y + 26 * s, SP(col, 11 * s, 255 * a))
        c.drawLine(x + 26 * s, y - 26 * s, x - 26 * s, y + 26 * s, SP(col, 11 * s, 255 * a))


def lightbar(c, t, y, t_on, t_off, x0=200, x1=1720, h=118):
    """a soft amber band behind the line being talked about"""
    a = ua(t, t_on - 0.1, 0.35) * (1 - ua(t, t_off - 0.2, 0.4))
    if a > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y - h * 0.7, x1, y + h * 0.3), 22, 22), P(AMBER, 30 * a))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y - h * 0.7, x0 + 10, y + h * 0.3), 5, 5), P(AMBER, 200 * a))


def board(c, t):
    """the one calm board (never zooms) with the story's grade and grain"""
    K.calm_bg(c, t)
    WD.finish(c, t, vig=0.12)


def ww(k, w, nth=0, after=None):
    """time of a spoken word, or a sensible fallback (never crashes a render)"""
    try:
        return wt(k, w, nth, after)
    except KeyError:
        print('WORD MISSING', k, w, nth)
        return after if after is not None else Bt[k]['t0']


def cues(k, n):
    return [cue(k, i) for i in range(n + 1)]


def tx(c, s, x, y, size, col, t, t0, kind='semi', align='left', d=0.35, a=1.0):
    """text that fades in and settles up a few pixels on its cue"""
    u = ua(t, t0, d) * a
    if u > 0.01:
        text(c, s, x, y + 10 * (1 - ua(t, t0, d)), size, col, u, kind, align)


def hw(c, s, x, y, size, col, t, t0, d=0.8, align='left', a=1.0):
    """handwriting written on from its cue"""
    u = ua(t, t0, d)
    if u > 0.001 and a > 0.01:
        if a < 0.99: c.saveLayerAlpha(None, int(255 * a))
        K.hand(c, s, x, y, size, col, u, align)
        if a < 0.99: c.restore()


def panel(c, x0, y0, x1, y1, a=1.0, col=(14, 18, 44), edge=(90, 104, 170)):
    if a > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 24, 24), P(col, 215 * a))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 24, 24), SP(edge, 2.5, 190 * a))


def tag(c, s, x, y, col, a=1.0, size=40, align='center'):
    """a small filled tag (dark text on a course colour)"""
    if a <= 0.01: return
    w = K.width(s, size, 'xb') + 36; h = size * 1.5
    x0 = x - w / 2 if align == 'center' else (x if align == 'left' else x - w)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y - h * 0.72, x0 + w, y + h * 0.28), 12, 12), P(col, 255 * a))
    text(c, s, x0 + 18, y, size, K.NAVY, a, 'xb')


def dots(n, x0, y0, x1, y1, seed=1, r=0):
    """n points scattered evenly in a box (jittered grid)"""
    import numpy as np
    rs = np.random.default_rng(seed); cols = int(math.ceil(math.sqrt(n * (x1 - x0) / (y1 - y0)))); rows = int(math.ceil(n / cols))
    pts = []
    for i in range(n):
        gx, gy = i % cols, i // cols
        pts.append((x0 + (gx + 0.5) / cols * (x1 - x0) + rs.uniform(-1, 1) * (x1 - x0) / cols * 0.28, y0 + (gy + 0.5) / rows * (y1 - y0) + rs.uniform(-1, 1) * (y1 - y0) / rows * 0.28))
    return pts


def pulse(t, t0, d=0.6):
    """0 -> 1 -> 0 bump at t0"""
    u = (t - t0) / d
    return math.sin(math.pi * u) if 0 < u < 1 else 0.0
