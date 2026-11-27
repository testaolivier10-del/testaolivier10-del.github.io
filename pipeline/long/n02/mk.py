"""Handwritten math for the teaching boards: powers of ten with raised exponents, quantities with coloured units,
fractions (conversion factors) whose units get struck through on cue. Kalam for everything written by hand."""
import re
import skia
import kit as K
from kit import P, SP, sm, CREAM, AMBER, CORAL, TEAL, YELLOW

UNIT = (138, 176, 255)       # units: light cobalt (the AP Chem course colour, lifted for contrast)
STRIKE = CORAL
_TOK = re.compile(r"\^\{([^}]*)\}|\^(-?[0-9a-z]+)|([^^]+)")


def _parts(s):
    out = []
    for m in _TOK.finditer(s):
        if m.group(1) is not None or m.group(2) is not None:
            e = m.group(1) if m.group(1) is not None else m.group(2)
            out.append(('e', e.replace('-', '−')))
        else:
            out.append(('t', m.group(3).replace('-', '−') if re.fullmatch(r"[\s0-9.\-×÷=+()]*", m.group(3)) else m.group(3)))
    return out


def mw(s, size):
    f = K.font('hand', size); fe = K.font('hand', size * 0.6)
    fa = K.font('bold', size * 0.8)
    tot = 0
    for k, v in _parts(s):
        if k == 't':
            segs = v.split('→')
            tot += sum(f.measureText(x) for x in segs) + fa.measureText('→') * (len(segs) - 1)
        else:
            tot += fe.measureText(v) + 2
    return tot


def mdraw(c, s, x, y, size, col=CREAM, u=1.0, a=1.0, align='left'):
    """draw a math string (10^{-3}, 10^4) with a left to right handwriting reveal; returns the width"""
    if u <= 0.001 or a <= 0.01:
        return mw(s, size)
    w = mw(s, size)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    f = K.font('hand', size); fe = K.font('hand', size * 0.6)
    c.save(); c.clipRect(skia.Rect(x - 6, y - size * 1.6, x + w * u + 6, y + size * 0.6))
    cx = x
    fa = K.font('bold', size * 0.8)
    for k, v in _parts(s):
        if k == 't':
            for j, seg in enumerate(v.split('→')):
                if j > 0:
                    c.drawString('→', cx, y, fa, P(col, 255 * a)); cx += fa.measureText('→')
                c.drawString(seg, cx, y, f, P(col, 255 * a)); cx += f.measureText(seg)
        else:
            cx += 2
            c.drawString(v, cx, y - size * 0.42, fe, P(col, 255 * a)); cx += fe.measureText(v)
    c.restore()
    return w


def strike(c, x0, x1, y, u, a=1.0, w=5):
    if u > 0.01:
        c.drawLine(x0 - 4, y + 6, x0 - 4 + (x1 - x0 + 8) * u, y - 10 * u, SP(STRIKE, w, 235 * a))


def qty(c, v, unit, x, y, size, u=1.0, su=0.0, a=1.0, vcol=CREAM, ucol=UNIT):
    """a value and its unit; the unit is struck through as su goes 0 -> 1. returns width"""
    w1 = mdraw(c, v, x, y, size, vcol, u, a)
    if not unit:
        return w1
    gap = size * 0.28
    uu = sm((u * (w1 + gap + mw(unit, size)) - w1 - gap) / max(1, mw(unit, size))) if u < 1 else 1
    w2 = mdraw(c, unit, x + w1 + gap, y, size, ucol, uu, a)
    strike(c, x + w1 + gap, x + w1 + gap + w2, y - size * 0.32, su, a)
    return w1 + gap + w2


def qw(v, unit, size):
    return mw(v, size) + (size * 0.28 + mw(unit, size) if unit else 0)


def frac(c, n, d, x, y, size, u=1.0, sn=0.0, sd=0.0, a=1.0, hl=0.0):
    """a conversion factor n/d, each (value, unit); x is the left edge, y the bar. returns width"""
    wn, wd = qw(*n, size), qw(*d, size)
    w = max(wn, wd) + size * 0.5
    if hl > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 12, y - size * 1.25, x + w + 12, y + size * 1.35), 18, 18), P(AMBER, 40 * hl * a))
    if u > 0.01:
        c.drawLine(x, y, x + w * sm(u / 0.4), y, SP(CREAM, 4, 230 * a))
    qty(c, *n, x + (w - wn) / 2, y - size * 0.28, size, sm((u - 0.15) / 0.6), sn, a)
    qty(c, *d, x + (w - wd) / 2, y + size * 0.98, size, sm((u - 0.35) / 0.6), sd, a)
    return w


def row(c, items, x, y, size, t, align='left', a=1.0):
    """items: list of dicts: {'q': (v, unit), 't0', 's'} | {'f': ((v,u),(v,u)), 't0', 'sn', 'sd', 'hl'} | {'m': '× ', 't0', 'col'}
    times are global; strike times 's', 'sn', 'sd' are when the strike starts. returns total width"""
    gap = size * 0.35
    ws = []
    for it in items:
        if 'q' in it:
            ws.append(qw(*it['q'], size))
        elif 'f' in it:
            ws.append(max(qw(*it['f'][0], size), qw(*it['f'][1], size)) + size * 0.5)
        else:
            ws.append(mw(it['m'], size))
    total = sum(ws) + gap * (len(items) - 1)
    if align == 'center':
        x -= total / 2
    cx = x
    for it, w in zip(items, ws):
        uu = sm((t - it.get('t0', -1e9)) / it.get('d', 0.55))
        if 'q' in it:
            qty(c, *it['q'], cx, y, size, uu, sm((t - it.get('s', 1e9)) / 0.35), a, it.get('col', CREAM))
        elif 'f' in it:
            frac(c, *it['f'], cx, y - size * 0.3, size, uu, sm((t - it.get('sn', 1e9)) / 0.35), sm((t - it.get('sd', 1e9)) / 0.35), a,
                 it.get('hl', 0.0))
        else:
            mdraw(c, it['m'], cx, y, size, it.get('col', CREAM), uu, a)
        it['_x'] = cx; it['_w'] = w
        cx += w + gap
    return total


def boxed(c, x0, y0, x1, y1, a=1.0, col=(16, 18, 38), r=26):
    if a > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r), P(col, 248 * a))


def underline(c, x0, x1, y, u, col=AMBER, a=1.0):
    if u > 0.01:
        p = skia.Path(); p.moveTo(x0, y); p.quadTo((x0 + x1) / 2, y + 10, x0 + (x1 - x0) * u, y + 2 * u)
        c.drawPath(p, SP(col, 6, 230 * a))


def circle_mark(c, cx, cy, rx, ry, u, col=AMBER, a=1.0):
    if u > 0.01:
        c.drawArc(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry), -100, 360 * u, False, SP(col, 6, 230 * a))
