"""Shared helpers for the AP Physics 1 01 scenes: beat and word times, eases, tags, marks, the board."""
import math
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, pill, AMBER, CORAL, GREEN, CREAM
import world as WD

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
    pill(c, s, 190, 90, AMBER, 30, sm((t - t0) / 0.3), kind='xb')


def answer_tag(c, t, t0):
    pill(c, 'ANSWER', 170, 90, GREEN, 30, sm((t - t0) / 0.3), kind='xb')


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
