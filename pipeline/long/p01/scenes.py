"""Every beat of AP Physics 1 01. Teaching beats are drawn on the one calm board (never zooms); motion comes from what is
written, struck, lit or moved on the word. Story beats live in story.py."""
import math
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, chip, pill, arrow, label, CREAM, AMBER, CORAL, TEAL, YELLOW, BLUE, GREEN, NAVY, INK2, LILAC
import mk as M
from mk import mdraw, mw, qty, frac, row, strike, UNIT
import base as B
from base import cue, wt, fin, ua, practice_tag, answer_tag, title, check, cross, lightbar, board
from story import STORY, panel
import world as WD

PHYS = (255, 160, 70)
Bt = B.Bt
D = B.D


def hop_number(c, digits, p0, p1, x, y, size, u, col=CREAM, a=1.0, fade_lead=0):
    """digits with a decimal point that hops from slot p0 to slot p1; arcs count the hops"""
    f = K.font('hand', size)
    xs = [x]
    for ch in digits:
        xs.append(xs[-1] + f.measureText(ch) + size * 0.08)
    for i, ch in enumerate(digits):
        if ch != '.':
            al = (1 - 0.85 * u) if i < fade_lead else 1.0
            c.drawString(ch, xs[i], y, f, P(col, 255 * a * al))
    pos = p0 + (p1 - p0) * u
    i0 = int(math.floor(pos)); fr = pos - i0
    i0 = max(0, min(len(xs) - 1, i0)); i1 = max(0, min(len(xs) - 1, i0 + 1))
    px = xs[i0] + (xs[i1] - xs[i0]) * fr - size * 0.04
    hop = abs(math.sin(math.pi * fr)) * size * 0.4
    c.drawCircle(px, y - hop + size * 0.02, size * 0.1, P(AMBER, 255 * a))
    done = int(abs(pos - p0) + 1e-6)
    for j in range(done):
        a0 = p0 + (j if p1 > p0 else -j); a1 = a0 + (1 if p1 > p0 else -1)
        xa, xb = xs[max(0, min(len(xs) - 1, a0))], xs[max(0, min(len(xs) - 1, a1))]
        r = skia.Rect(min(xa, xb), y - size * 1.25, max(xa, xb), y - size * 0.75)
        c.drawArc(r, 180, 180, False, SP(AMBER, 4, 220 * a))
        text(c, str(j + 1), (xa + xb) / 2, y - size * 1.3, size * 0.4, AMBER, a, 'xb', 'center')
    return xs


def calculator(c, x, y, s, a, disp='', dim_from=None, keys=None):
    if a <= 0.01:
        return
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-220, -330, 220, 330), 34, 34), P((52, 58, 86), 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-190, -300, 190, -180), 14, 14), P((190, 214, 178), 255 * a))
    f = K.font('xb', 50)
    if dim_from is not None:
        s1, s2 = disp[:dim_from], disp[dim_from:]
        w1, w2 = f.measureText(s1), f.measureText(s2)
        c.drawString(s1, 170 - w1 - w2, -222, f, P((40, 56, 40), 255 * a))
        c.drawString(s2, 170 - w2, -222, f, P((40, 56, 40), 90 * a))
    else:
        text(c, disp, 170, -222, 50, (40, 56, 40), a, 'xb', 'right')
    labels = ['7', '8', '9', 'E', '4', '5', '6', '(−)', '1', '2', '3', '−', '0', '.', '×', '=']
    for i, lb in enumerate(labels):
        cx = -150 + (i % 4) * 100; cy = -110 + (i // 4) * 100
        hl = (keys or {}).get(lb, 0.0)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 40, cy - 38, cx + 40, cy + 38), 12, 12), P((96, 104, 140), 255 * a))
        if hl > 0.01:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 45, cy - 43, cx + 45, cy + 43), 14, 14), SP(AMBER, 7, 255 * hl * a))
        text(c, lb, cx, cy + 13, 36, CREAM, a, 'xb', 'center')
    c.restore()


def motorcycle(c, x, y, s, a):
    if a <= 0.01:
        return
    c.save(); c.translate(x, y); c.scale(s, s)
    for wx in (-90, 90):
        c.drawCircle(wx, 40, 44, P((40, 42, 52), 255 * a)); c.drawCircle(wx, 40, 18, P((170, 176, 190), 255 * a))
    p = skia.Path(); p.moveTo(-90, 40); p.lineTo(-30, -20); p.lineTo(50, -20); p.lineTo(90, 40); p.close()
    c.drawPath(p, P(CORAL, 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-60, -50, 30, -20), 12, 12), P((40, 42, 52), 255 * a))
    c.drawLine(50, -20, 70, -60, SP((170, 176, 190), 8, 255 * a)); c.drawLine(60, -60, 90, -60, SP((170, 176, 190), 8, 255 * a))
    c.restore()


def car(c, x, y, s, a):
    if a <= 0.01:
        return
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-150, -50, 150, 20), 22, 22), P(BLUE, 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-80, -100, 70, -40), 26, 26), P(BLUE, 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-62, -88, 52, -50), 10, 10), P((200, 226, 250), 255 * a))
    for wx in (-90, 90):
        c.drawCircle(wx, 22, 30, P((30, 32, 40), 255 * a)); c.drawCircle(wx, 22, 12, P((170, 176, 190), 255 * a))
    c.restore()


# ================================================================ intro
def promise(c, t):
    k = 'promise'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    mdraw(c, '30 km/h ?', 520, 470, 150, CREAM, ua(t, t0 + 0.2, 0.9), align='center')
    text(c, "Leo's claim", 520, 590, 46, INK2, ua(t, t0 + 0.6, 0.4), 'semi', 'center')
    for i, (s, cc, col) in enumerate((('SI units', c1, TEAL), ('convert units', c2, AMBER), ('significant figures', c3, CORAL))):
        u = ua(t, cc - 0.1, 0.35)
        if u > 0:
            chip(c, s, 1100, 250 + i * 170, col, 60, u, 0.85 + 0.15 * u)


def why(c, t):
    k = 'why'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    lightbar(c, t, 250, c1, c2, 260, 1660)
    lightbar(c, t, 430, c2, c2 + 2.4, 260, 1660)
    lightbar(c, t, 610, c2 + 2.4, c3, 260, 1660)
    mdraw(c, 'v = d ÷ t', 320, 250, 90, CREAM, ua(t, c1 - 0.2, 0.8))
    check(c, 820, 220, 0.9, ua(t, wt(k, 'perfectly'), 0.3))
    text(c, 'right equation', 900, 236, 46, GREEN, ua(t, wt(k, 'perfectly'), 0.4), 'semi')
    qty(c, '12', 'cm', 320, 430, 90, ua(t, c2 - 0.3, 0.6))
    mdraw(c, 't = 0.40 s', 760, 430, 90, CREAM, ua(t, c2, 0.6))
    M.circle_mark(c, 420, 400, 150, 70, ua(t, wt(k, 'centimeters'), 0.5), CORAL)
    mdraw(c, 'v = 12 ÷ 0.40 = 30 m/s', 320, 610, 90, CORAL, ua(t, c2 + 2.4, 1.0))
    cross(c, 1340, 580, 0.9, ua(t, c2 + 3.0, 0.3))
    pill(c, '100 times too big', 1500, 500, CORAL, 40, ua(t, c2 + 3.2, 0.4))
    a = ua(t, c3, 0.5)
    if a > 0:
        M.boxed(c, 300, 720, 1620, 960, a)
        mdraw(c, '12 cm = 0.12 m  →  v = 0.30 m/s', 960, 820, 76, GREEN, ua(t, c3 + 0.3, 1.0), a, align='center')
        text(c, 'no error message: you have to catch it', 960, 910, 44, CREAM, ua(t, wt(k, 'catch'), 0.4), 'semi', 'center')


# ================================================================ SI units and prefixes
def u1(c, t):
    k = 'u1'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    a1 = 1 - ua(t, c2 - 0.2, 0.4)
    mdraw(c, '3', W / 2, 520, 260, CREAM, ua(t, c1 - 0.3, 0.3), a1, align='center')
    for i, w_ in enumerate(('inches', 'miles')):
        aa = ua(t, wt(k, w_) - 0.1, 0.3) * a1
        pill(c, w_ + '?', 620 + i * 680, 680, CORAL, 48, aa)
    text(c, 'three what?', W / 2, 260, 56, YELLOW, ua(t, wt(k, 'three', 1), 0.3) * a1, 'xb', 'center')
    a2 = ua(t, c2 - 0.2, 0.4)
    if a2 > 0:
        qty(c, '3', 'm', 760, 560, 240, ua(t, c2 - 0.2, 0.7), a=a2)
        label(c, 'number', 520, 740, CREAM, 44, ua(t, wt(k, 'measurement'), 0.4), dot=(800, 560))
        label(c, 'unit', 1240, 740, UNIT, 44, ua(t, wt(k, 'measurement'), 0.4), dot=(1050, 560))
        text(c, '3 on its own is just a number', W / 2, 920, 46, INK2, ua(t, wt(k, 'own'), 0.4), 'semi', 'center')


def u2(c, t):
    k = 'u2'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    title(c, 'SI units  =  the International System', t, t0 + 1.0, 170, CREAM, 56)
    text(c, 'from the French: Système International', W / 2, 240, 38, INK2, ua(t, wt(k, 'french'), 0.4), 'semi', 'center')
    rows = [(c1, 'length', 'meter', 'm'), (c2, 'mass', 'kilogram', 'kg'), (c3, 'time', 'second', 's')]
    for i, (tt, q, nm, sym) in enumerate(rows):
        y = 430 + i * 170
        u = ua(t, tt - 0.2, 0.5)
        if u <= 0:
            continue
        lightbar(c, t, y, tt, rows[i + 1][0] if i < 2 else fin(k) + 0.5, 300, 1620, 130)
        text(c, q, 380, y, 64, INK2, u, 'semi')
        mdraw(c, nm, 820, y, 80, CREAM, u)
        chip(c, sym, 1380, y - 72, TEAL, 64, u)


def u3(c, t):
    k = 'u3'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    u = ua(t, t0 + 0.3, 0.5)
    x = 560
    wk = chip(c, 'kilo', x, 330, AMBER, 96, u, 1.0 + 0.08 * math.sin(max(0, t - c1) * 6) * ua(t, c1, 0.3) * (1 - ua(t, c1 + 1.5, 0.3)))
    chip(c, 'gram', x + wk + 16, 330, (200, 206, 230), 96, u)
    text(c, 'the base unit for mass', W / 2, 560, 52, CREAM, ua(t, wt(k, 'base'), 0.4), 'semi', 'center')
    pill(c, 'it already has a prefix', W / 2, 660, AMBER, 44, ua(t, wt(k, 'prefix'), 0.4))
    a = ua(t, c2, 0.5)
    if a > 0:
        M.boxed(c, 460, 760, 1460, 960, a)
        mdraw(c, 'g', 620, 885, 96, UNIT, a)
        cross(c, 720, 852, 0.7, ua(t, c2 + 0.6, 0.3))
        arrow(c, (820, 856), (1080, 856), AMBER, 8, ua(t, wt(k, 'change'), 0.5))
        mdraw(c, 'kg', 1160, 885, 96, UNIT, ua(t, wt(k, 'kilograms', after=c2), 0.4))
        check(c, 1330, 852, 0.7, ua(t, wt(k, 'first'), 0.3))


def u4(c, t):
    k = 'u4'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    lightbar(c, t, 240, c1, c2, 220, 1700)
    lightbar(c, t, 440, c2, c3, 220, 1700)
    lightbar(c, t, 680, c3, fin(k) + 0.5, 220, 1700, 230)
    mdraw(c, 'speed = length ÷ time', 280, 240, 80, CREAM, ua(t, c1 - 0.2, 0.9))
    mdraw(c, '→  m/s', 1200, 240, 80, UNIT, ua(t, wt(k, 'meters'), 0.5))
    mdraw(c, 'equation sheet:  g = 9.8 m/s^2', 280, 440, 76, CREAM, ua(t, wt(k, 'nine') - 0.4, 1.0))
    pill(c, 'all SI', 1480, 420, TEAL, 44, ua(t, wt(k, 'SI'), 0.4))
    mdraw(c, 'm, kg, s in  →  SI out', 280, 640, 76, GREEN, ua(t, c3, 0.9))
    check(c, 1180, 615, 0.8, ua(t, c3 + 1.0, 0.3))
    mdraw(c, 'cm or g in  →  off by 10^n', 280, 780, 76, CORAL, ua(t, wt(k, 'mix'), 0.9))
    cross(c, 1250, 755, 0.8, ua(t, wt(k, 'wrong'), 0.3))


def u5(c, t):
    k = 'u5'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    title(c, 'a prefix multiplies the unit by a power of ten', t, t0 + 0.3, 130, INK2, 48)
    rows = [(c1, 'kilo', 'k', '10^3', '1 km = 1000 m'), (c2, 'centi', 'c', '10^{-2}', '1 cm = 0.01 m'),
            (c3, 'milli', 'm', '10^{-3}', '1 ms = 0.001 s'), (c4, 'micro', 'μ', '10^{-6}', 'a millionth')]
    for i, (tt, nm, sym, pw, ex) in enumerate(rows):
        y = 300 + i * 160
        u = ua(t, tt - 0.2, 0.5)
        if u <= 0:
            continue
        lightbar(c, t, y, tt, rows[i + 1][0] if i < 3 else fin(k) + 0.5, 140, 1780, 130)
        mdraw(c, nm, 200, y, 76, CREAM, u)
        chip(c, sym, 520, y - 66, AMBER, 60, u)
        mdraw(c, pw, 700, y, 76, YELLOW, u)
        mdraw(c, ex, 1060, y, 70, CREAM, ua(t, tt + 1.4, 0.8))
    # same letter, different job
    a = ua(t, wt(k, 'watch'), 0.4) * (1 - ua(t, c4 - 0.4, 0.4))
    if a > 0:
        M.boxed(c, 1000, 590, 1760, 760, a)
        mdraw(c, 'ms', 1080, 700, 84, UNIT, a)
        text(c, '= milliseconds', 1210, 690, 40, CREAM, a, 'semi')
        mdraw(c, 'm', 1480, 700, 84, UNIT, ua(t, wt(k, 'alone'), 0.3) * a)
        text(c, '= meters', 1550, 690, 40, CREAM, ua(t, wt(k, 'alone'), 0.3) * a, 'semi')
    pill(c, 'the AP equation sheet lists the rest', W / 2, 1000, TEAL, 38, ua(t, wt(k, 'sheet'), 0.4))


def p1q(c, t):
    k = 'p1q'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); practice_tag(c, t, t0)
    mdraw(c, 'cart:  250 g  =  ? kg', W / 2, 420, 100, CREAM, ua(t, c1 - 0.2, 1.0), align='center')
    mdraw(c, 'timer:  40 ms  =  ? s', W / 2, 600, 100, CREAM, ua(t, wt(k, 'timer'), 1.0), align='center')
    text(c, 'both in SI units, ready for an equation', W / 2, 780, 50, YELLOW, ua(t, c2, 0.4), 'semi', 'center')


def p1a(c, t):
    k = 'p1a'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); answer_tag(c, t, t0)
    lightbar(c, t, 300, t0 + 0.3, c1, 300, 1620)
    lightbar(c, t, 480, c1, c2, 300, 1620)
    mdraw(c, '250 g  =  0.25 kg', W / 2, 300, 100, CREAM, ua(t, t0 + 0.2, 1.0), align='center')
    mdraw(c, '40 ms  =  0.04 s', W / 2, 480, 100, CREAM, ua(t, c1, 1.0), align='center')
    a = ua(t, c2, 0.4)
    if a > 0:
        M.boxed(c, 300, 600, 1620, 960, a)
        mdraw(c, 'm = 250', 380, 720, 90, CORAL, a)
        cross(c, 850, 690, 0.8, ua(t, c2 + 0.6, 0.3))
        text(c, 'the equation reads it as 250 kg', 380, 820, 48, CREAM, ua(t, wt(k, 'kilograms', 1), 0.4), 'semi')
        motorcycle(c, 1340, 760, 1.4, ua(t, wt(k, 'motorcycle'), 0.4))
        text(c, 'about this much', 1340, 920, 40, INK2, ua(t, wt(k, 'motorcycle'), 0.4), 'semi', 'center')


# ================================================================ converting units
def c1(c, t):
    k = 'c1'
    t0, q1, q2, q3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    mdraw(c, 'multiply by a fraction that equals 1', W / 2, 260, 72, CREAM, ua(t, q1 - 0.2, 1.0), align='center')
    a = ua(t, q2 - 0.2, 0.4)
    if a > 0:
        frac(c, ('1', 'm'), ('100', 'cm'), 700, 520, 100, ua(t, q2 - 0.2, 0.8), a=a)
        mdraw(c, '=  1', 1060, 560, 110, YELLOW, ua(t, wt(k, 'one', after=q2 + 1.0) - 0.2, 0.4))
        text(c, 'same length on top and bottom', W / 2, 760, 46, INK2, ua(t, wt(k, 'same'), 0.4), 'semi', 'center')
    a = ua(t, q3, 0.4)
    if a > 0:
        M.boxed(c, 380, 830, 1540, 980, a)
        text(c, '× 1 changes how it is written, not how big it is', W / 2, 920, 46, CREAM, a, 'semi', 'center')


def c2(c, t):
    k = 'c2'
    t0, q1, q2, q3, q4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    a = ua(t, q1 - 0.2, 0.4)
    if a > 0:
        frac(c, ('want', ''), ('get rid of', ''), 760, 260, 70, ua(t, q1, 0.8), a=a)
        text(c, 'the unit you want on top', 1180, 200, 40, GREEN, ua(t, wt(k, 'want'), 0.4), 'semi')
        text(c, 'the unit to cancel on the bottom', 1180, 320, 40, CORAL, ua(t, wt(k, 'bottom'), 0.4), 'semi')
    a = ua(t, q2 - 0.2, 0.5)
    if a > 0:
        x0, y0 = 300, 480
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0 - 20, x0 + 560, y0 + 20), 8, 8), P((240, 196, 70), 255 * a))
        p = skia.Path(); p.moveTo(x0 + 560, y0 - 20); p.lineTo(x0 + 640, y0); p.lineTo(x0 + 560, y0 + 20); p.close()
        c.drawPath(p, P((236, 210, 170), 255 * a)); c.drawCircle(x0 + 632, y0, 8, P((60, 60, 70), 255 * a))
        c.drawRect(skia.Rect(x0 - 40, y0 - 20, x0, y0 + 20), P(CORAL, 255 * a))
        text(c, '18 cm', x0 + 320, y0 - 40, 44, CREAM, a, 'semi', 'center')
    if t > q2:
        it = [dict(q=('18', 'cm'), t0=q2 + 0.2, s=q3 + 0.4), dict(m='×', t0=wt(k, 'times')),
              dict(f=(('1', 'm'), ('100', 'cm')), t0=wt(k, 'times') + 0.2, sd=q3 + 0.2), dict(m='=', t0=q4 - 0.2),
              dict(q=('0.18', 'm'), t0=q4, col=YELLOW)]
        row(c, it, W / 2, 760, 90, t, 'center')
        pill(c, 'units cancel like numbers', W / 2, 960, TEAL, 40, ua(t, q3 + 0.6, 0.4))


def c3(c, t):
    k = 'c3'
    t0, q1, q2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    mdraw(c, '18 cm  =  0.18 m', W / 2, 260, 96, CREAM, 1.0, align='center')
    a = ua(t, q1 - 0.2, 0.5)
    if a > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(360, 420, 1560, 480), 10, 10), P(TEAL, 255 * a))
        text(c, '1 m', 960, 400, 48, TEAL, a, 'xb', 'center')
        c.drawRect(skia.Rect(360, 520, 372, 580), P(AMBER, 255 * a))
        text(c, '1 cm', 400, 570, 40, AMBER, a, 'semi')
        mdraw(c, 'bigger unit  →  smaller number', W / 2, 700, 80, YELLOW, ua(t, wt(k, 'fewer') - 0.2, 0.9), align='center')
    a = ua(t, q2, 0.4)
    if a > 0:
        M.boxed(c, 340, 790, 1580, 980, a)
        text(c, 'number went the wrong way?', 960, 870, 48, CORAL, a, 'semi', 'center')
        text(c, 'your fraction is upside down', 960, 940, 48, CREAM, ua(t, wt(k, 'upside'), 0.4), 'semi', 'center')


def c4(c, t):
    k = 'c4'
    t0, q1, q2, q3, q4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    car(c, 260 + min(1400, max(0, t - t0) * 50), 230, 0.8, ua(t, t0 + 0.1, 0.4))
    c.drawLine(80, 260, 1840, 260, SP((90, 96, 150), 4, 200 * ua(t, t0 + 0.1, 0.4)))
    text(c, 'speeds: two fractions, one for each unit', W / 2, 380, 44, INK2, ua(t, t0 + 0.2, 0.4) * (1 - ua(t, q2, 0.3)), 'semi', 'center')
    km = wt(k, 'kilometers', 1); hr = wt(k, 'hours')
    it = [dict(q=('72', 'km/h'), t0=min(q1, t0 + 1.0)), dict(m='×', t0=q2),
          dict(f=(('1000', 'm'), ('1', 'km')), t0=q2 + 0.2, sd=km), dict(m='×', t0=q3 + 0.4),
          dict(f=(('1', 'h'), ('3600', 's')), t0=q3 + 0.6, sn=hr + 0.6)]
    lightbar(c, t, 520, q2, q4, 160, 1760, 260)
    row(c, it, W / 2, 520, 84, t, 'center')
    q0 = it[0]
    w1 = mw('72', 84) + 84 * 0.28
    strike(c, q0['_x'] + w1, q0['_x'] + w1 + mw('km', 84), 520 - 26, ua(t, km, 0.35))
    strike(c, q0['_x'] + w1 + mw('km/', 84), q0['_x'] + q0['_w'], 520 - 26, ua(t, hr + 0.4, 0.35))
    a = ua(t, q4 - 0.2, 0.5)
    if a > 0:
        mdraw(c, '=  72 000 m ÷ 3600 s', W / 2, 800, 90, CREAM, ua(t, q4, 1.2), align='center')
        mdraw(c, '=  20 m/s', W / 2, 950, 110, YELLOW, ua(t, wt(k, 'twenty') - 0.2, 0.5), align='center')


def c5(c, t):
    k = 'c5'
    t0, q1, q2, q3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    mdraw(c, '1000 ÷ 3600', 700, 300, 100, CREAM, ua(t, t0 + 0.4, 0.8), align='center')
    mdraw(c, '=  1 ÷ 3.6', 1300, 300, 100, YELLOW, ua(t, q1 - 0.2, 0.6), align='center')
    lightbar(c, t, 520, q2, q3, 300, 1620)
    lightbar(c, t, 680, q3, fin(k) + 0.5, 300, 1620)
    mdraw(c, 'km/h  →  m/s :   ÷ 3.6', W / 2, 520, 90, CREAM, ua(t, q2 - 0.2, 0.9), align='center')
    mdraw(c, 'm/s  →  km/h :   × 3.6', W / 2, 680, 90, CREAM, ua(t, q3 - 0.2, 0.9), align='center')
    a = ua(t, wt(k, 'forget'), 0.4)
    if a > 0:
        M.boxed(c, 400, 800, 1520, 960, a)
        text(c, 'not sure which way? write the fractions out', W / 2, 895, 44, TEAL, a, 'semi', 'center')


def c6(c, t):
    k = 'c6'
    t0, q1, q2, q3, q4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    a = ua(t, q1 - 0.2, 0.5)
    x0, y0, s = 260, 260, 520
    if a > 0:
        c.drawRect(skia.Rect(x0, y0, x0 + s, y0 + s), P(TEAL, 60 * a))
        c.drawRect(skia.Rect(x0, y0, x0 + s, y0 + s), SP(TEAL, 6, 255 * a))
        text(c, '1 m', x0 + s / 2, y0 - 20, 48, CREAM, a * (1 - ua(t, q2, 0.3)), 'xb', 'center')
        text(c, '1 m', x0 - 20, y0 + s / 2, 48, CREAM, a * (1 - ua(t, q2, 0.3)), 'xb', 'right')
        text(c, '100 cm', x0 + s / 2, y0 - 20, 48, AMBER, ua(t, q2, 0.3), 'xb', 'center')
        text(c, '100 cm', x0 - 20, y0 + s / 2, 48, AMBER, ua(t, q2, 0.3), 'xb', 'right')
        g = ua(t, q3 - 0.4, 1.5)
        if g > 0:
            n = 20
            for i in range(1, n):
                c.drawLine(x0 + s * i / n, y0, x0 + s * i / n, y0 + s * g, SP(TEAL, 1.5, 140))
                c.drawLine(x0, y0 + s * i / n, x0 + s * g, y0 + s * i / n, SP(TEAL, 1.5, 140))
    mdraw(c, '1 m^2  =  100 × 100 cm^2', 920, 400, 76, CREAM, ua(t, q2 + 0.4, 1.0))
    mdraw(c, '=  10 000 cm^2', 920, 540, 90, YELLOW, ua(t, q3 - 0.2, 0.6))
    mdraw(c, '100 cm^2', 920, 680, 76, CORAL, ua(t, wt(k, 'not'), 0.4))
    cross(c, 1300, 652, 0.7, ua(t, wt(k, 'not') + 0.3, 0.3))
    a = ua(t, q4 - 0.2, 0.4)
    if a > 0:
        M.boxed(c, 260, 860, 1660, 1010, a)
        text(c, 'area: use the conversion fraction TWICE', 960, 950, 48, TEAL, a, 'semi', 'center')


def p2q(c, t):
    k = 'p2q'
    t0, q1 = cue(k), cue(k, 1)
    board(c, t); practice_tag(c, t, t0)
    a = ua(t, q1 - 0.2, 0.4)
    car(c, 300 + min(1300, max(0, t - q1) * 160), 360, 1.0, a)
    c.drawLine(80, 400, 1840, 400, SP((90, 96, 150), 4, 200 * a))
    mdraw(c, '90 km/h  =  ? m/s', W / 2, 640, 120, CREAM, ua(t, q1 + 0.3, 0.9), align='center')


def p2a(c, t):
    k = 'p2a'
    t0, q1, q2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); answer_tag(c, t, t0)
    it = [dict(q=('90', 'km/h'), t0=t0 + 0.2), dict(m='×', t0=wt(k, 'times')),
          dict(f=(('1000', 'm'), ('1', 'km')), t0=wt(k, 'times') + 0.2, sd=wt(k, 'times', 1)), dict(m='×', t0=wt(k, 'times', 1)),
          dict(f=(('1', 'h'), ('3600', 's')), t0=wt(k, 'times', 1) + 0.2, sn=q1 - 0.4), dict(m='=', t0=q1 - 0.2),
          dict(q=('25', 'm/s'), t0=q1, col=YELLOW)]
    row(c, it, W / 2, 300, 72, t, 'center')
    mdraw(c, 'or  90 ÷ 3.6 = 25', W / 2, 470, 76, TEAL, ua(t, wt(k, 'divided') - 0.6, 0.8), align='center')
    a = ua(t, q2, 0.4)
    if a > 0:
        M.boxed(c, 240, 560, 1680, 1010, a)
        mdraw(c, '90 × 3.6 = 324', 320, 670, 80, CORAL, a)
        cross(c, 900, 645, 0.7, ua(t, q2 + 0.6, 0.3))
        mdraw(c, '× 1000  →  bigger', 320, 800, 70, CREAM, ua(t, wt(k, 'bigger'), 0.6))
        mdraw(c, '÷ 3600  →  smaller', 980, 800, 70, CREAM, ua(t, wt(k, 'smaller'), 0.6))
        mdraw(c, 'the 3600 wins:  answer < 90', 320, 940, 76, YELLOW, ua(t, wt(k, 'wins'), 0.8))


# ================================================================ scientific notation and significant figures
def g1(c, t):
    k = 'g1'
    t0, q1, q2, q3, q4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    title(c, 'scientific notation', t, t0 + 0.2, 110, INK2, 48)
    mdraw(c, 'a × 10^n', 420, 220, 90, CREAM, ua(t, q1 - 0.3, 0.6))
    mdraw(c, '1 ≤ a < 10', 900, 220, 76, YELLOW, ua(t, q1 + 1.5, 0.6))
    a = ua(t, q2 - 0.2, 0.4)
    if a > 0:
        lightbar(c, t, 430, q2, q3, 160, 1760, 160)
        sl = wt(k, 'slide')
        hop_number(c, '00040', 1, 4, 260, 430, 96, ua(t, sl + 0.3, 2.2), CREAM, a, fade_lead=3)
        mdraw(c, 's  =  4.0 × 10^{-3} s', 720, 430, 90, YELLOW, ua(t, wt(k, 'negative', after=q2) - 1.0, 0.8))
    a = ua(t, q3 - 0.2, 0.4)
    if a > 0:
        lightbar(c, t, 640, q3, q4, 160, 1760, 160)
        hop_number(c, '7200', 4, 1, 260, 640, 96, ua(t, wt(k, 'slides', after=q3), 1.6), CREAM, a)
        mdraw(c, 's  =  7.2 × 10^3 s', 720, 640, 90, YELLOW, ua(t, wt(k, 'seven', 1) - 0.3, 0.8))
    a = ua(t, q4 - 0.2, 0.4)
    if a > 0:
        M.boxed(c, 200, 760, 1200, 1000, a)
        mdraw(c, '10^{-3}  =  SMALL', 260, 860, 80, TEAL, a)
        text(c, 'not a negative number', 260, 950, 46, CREAM, ua(t, wt(k, 'not', after=q4), 0.4), 'semi')
        calculator(c, 1530, 880, 0.55, ua(t, wt(k, 'calculator'), 0.4), '4.0E-3', keys={'E': ua(t, wt(k, 'means'), 0.3)})


def meterstick(c, x0, y0, wd, a, cm0=40, cm1=50):
    c.drawRect(skia.Rect(x0, y0, x0 + wd, y0 + 90), P((240, 214, 120), 255 * a))
    n = cm1 - cm0
    for i in range(n + 1):
        x = x0 + wd * i / n
        c.drawLine(x, y0, x, y0 + 50, SP((60, 50, 30), 4, 255 * a))
        if 0 < i < n:
            text(c, str(cm0 + i), x, y0 + 84, 30, (60, 50, 30), a, 'bold', 'center')


def g2(c, t):
    k = 'g2'
    t0, q1, q2, q3, q4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    title(c, 'how many digits should an answer have?', t, t0 + 0.1, 140, CREAM, 52)
    text(c, 'a measurement is only known so well', W / 2, 205, 42, INK2, ua(t, q1, 0.4), 'semi', 'center')
    a = ua(t, q2 - 0.3, 0.5)
    if a > 0:
        x0, y0, wd = 260, 300, 1400
        meterstick(c, x0, y0, wd, a, 40, 50)
        xr = x0 + wd * 5.2 / 10
        c.drawRect(skia.Rect(x0 - 120, y0 - 70, xr, y0 - 20), P(TEAL, 230 * ua(t, q2, 0.8)))
        text(c, 'object', x0 - 100, y0 - 32, 32, NAVY, ua(t, q2, 0.8), 'xb')
        c.drawLine(xr, y0 - 80, xr, y0 + 60, SP(CORAL, 4, 255 * ua(t, q2 + 0.5, 0.4)))
        text(c, 'past 45 cm', x0 + wd * 0.5, y0 + 150, 40, CREAM, ua(t, wt(k, 'forty'), 0.4), 'semi', 'center')
        mdraw(c, '0.45', 700, 590, 110, CREAM, ua(t, wt(k, 'estimate') - 0.2, 0.5))
        mdraw(c, '2', 700 + mw('0.45', 110), 590, 110, YELLOW, ua(t, wt(k, 'two', after=q2) - 0.1, 0.4))
        mdraw(c, ' m', 700 + mw('0.452', 110), 590, 110, UNIT, ua(t, wt(k, 'meters', after=q2), 0.4))
        label(c, 'best guess (estimated)', 760, 720, YELLOW, 40, ua(t, wt(k, 'guess'), 0.4), dot=(700 + mw('0.45', 110) + 24, 600))
    a = ua(t, q3 - 0.2, 0.4)
    if a > 0:
        calculator(c, 1580, 760, 0.6, a, '0.4523718', dim_from=5)
        text(c, 'nobody measured these', 1200, 860, 40, CORAL, ua(t, wt(k, 'nobody'), 0.4), 'semi', 'right')
    a = ua(t, q4 - 0.2, 0.4)
    if a > 0:
        M.boxed(c, 160, 900, 1240, 1040, a)
        text(c, 'significant figures = the digits you measured', 700, 965, 42, CREAM, a, 'semi', 'center')
        text(c, '(including the last best guess)', 700, 1018, 36, INK2, ua(t, wt(k, 'includes'), 0.4), 'semi', 'center')


def g3(c, t):
    k = 'g3'
    t0, q1, q2, q3, q4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    rows = [(q1, '8.061', '4', 'nonzero digits and zeros between them count', wt(k, 'four') - 0.1),
            (q2, '0.0450', '3', 'zeros in front only hold the decimal point', wt(k, 'three') - 0.1),
            (q3, '15.0', '3', 'an end zero after a decimal point counts', wt(k, 'three', 1) - 0.1),
            (q4, '7200', '?', 'end zeros: unclear', None)]
    for i, (tt, num, n, why, ans_t) in enumerate(rows):
        y = 230 + i * 190
        u = ua(t, tt - 0.2, 0.5)
        if u <= 0:
            continue
        lightbar(c, t, y, tt, rows[i + 1][0] if i < 3 else fin(k) + 0.5, 140, 1780, 140)
        if num == '0.0450':
            mdraw(c, '0.0', 200, y, 96, (120, 126, 170), u)
            mdraw(c, '450', 200 + mw('0.0', 96), y, 96, CREAM, u)
        else:
            mdraw(c, num, 200, y, 96, CREAM, u)
        if num == '7200':
            mdraw(c, '→ 7.2 × 10^3  has 2', 560, y, 76, YELLOW, ua(t, wt(k, 'seven', 1) - 0.2, 0.9))
        else:
            mdraw(c, '→ ' + n, 560, y, 96, YELLOW, ua(t, ans_t, 0.4))
        text(c, why, 1740, y - 20, 38, INK2, ua(t, (ans_t if ans_t else tt + 0.6) + 0.4, 0.4), 'semi', 'right')
    a = ua(t, wt(k, 'quick'), 0.3) * (1 - ua(t, wt(k, 'three') - 0.1, 0.3))
    pill(c, 'quick test: how many?', 1250, 400, AMBER, 40, a)


def g4(c, t):
    k = 'g4'
    t0, q1, q2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    pill(c, '×  ÷ :  keep the FEWEST significant figures', W / 2, 180, TEAL, 46, ua(t, wt(k, 'fewest') - 0.2, 0.4))
    text(c, 'your answer is only as good as your sloppiest measurement', W / 2, 290, 42, INK2, ua(t, wt(k, 'sloppiest'), 0.4), 'semi', 'center')
    it = [dict(q=('200.0', 'm'), t0=q1 + 0.2), dict(m='÷', t0=wt(k, 'over')), dict(q=('24.8', 's'), t0=wt(k, 'twenty')),
          dict(m='=', t0=q2 - 0.2), dict(q=('8.06', 'm/s'), t0=q2 + 0.4, col=YELLOW)]
    row(c, it, W / 2, 560, 110, t, 'center')
    for j, n, tt in ((0, '4', wt(k, 'four')), (2, '3', wt(k, 'three')), (4, '3', q2)):
        x = it[j]['_x'] + it[j]['_w'] / 2
        c.drawCircle(x, 700, 40, P(AMBER if j < 4 else GREEN, 230 * ua(t, tt, 0.3)))
        text(c, n, x, 718, 52, NAVY, ua(t, tt, 0.3), 'xb', 'center')
    text(c, 'sig figs', 200, 716, 40, INK2, ua(t, wt(k, 'four'), 0.4), 'semi')


def g5(c, t):
    k = 'g5'
    t0, q1, q2, q3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    pill(c, '+  − :  look at DECIMAL PLACES', W / 2, 160, AMBER, 46, ua(t, wt(k, 'decimal') - 0.2, 0.4))
    f = K.font('hand', 110)
    xd = 900
    lines = [('8.7', ' m', 380, q1), ('2.43', ' m', 520, wt(k, 'plus')), ('11.13', '', 720, wt(k, 'calculator'))]
    hund_x = xd + f.measureText('.4') + 4
    a = ua(t, q2 - 0.2, 0.4) * (1 - ua(t, q3 + 0.5, 0.4))
    if a > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hund_x - 6, 250, hund_x + f.measureText('3') + 10, 760), 14, 14), P(CORAL, 60 * a))
        text(c, 'hundredths: unknown in 8.7', hund_x + 260, 300, 40, CORAL, a, 'semi')
    for s, unit, y, tt in lines:
        ip = s.split('.')[0]
        x = xd - f.measureText(ip)
        mdraw(c, s + unit, x, y, 110, YELLOW if s == '11.13' else CREAM, ua(t, tt, 0.6))
    c.drawLine(560, 590, 1300, 590, SP(CREAM, 5, 230 * ua(t, wt(k, 'calculator') - 0.3, 0.4)))
    mdraw(c, '+', 560, 520, 110, CREAM, ua(t, wt(k, 'plus'), 0.4))
    a = ua(t, q3, 0.5)
    if a > 0:
        mdraw(c, '→  11.1 m', 960, 900, 120, YELLOW, ua(t, q3 + 0.4, 0.6), align='center')
        text(c, 'stop at the tenths place', 960, 990, 44, CREAM, a, 'semi', 'center')


def g6(c, t):
    k = 'g6'
    t0, q1, q2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    a = ua(t, q1 - 0.2, 0.5)
    if a > 0:
        M.boxed(c, 200, 180, 1720, 520, a)
        text(c, 'EXACT (from definitions)', 280, 270, 46, TEAL, a, 'xb')
        frac(c, ('1000', 'm'), ('1', 'km'), 300, 410, 72, ua(t, q1, 0.7), a=a)
        mdraw(c, '3.6', 720, 430, 90, CREAM, ua(t, wt(k, 'three'), 0.5), a)
        text(c, 'they never limit your digits', 1000, 430, 48, CREAM, ua(t, wt(k, 'never'), 0.4), 'semi')
    a = ua(t, q2 - 0.2, 0.5)
    if a > 0:
        M.boxed(c, 200, 600, 1720, 960, a)
        text(c, 'round ONCE, at the very end', 960, 720, 64, YELLOW, a, 'xb', 'center')
        mdraw(c, 'between steps: keep every digit in the calculator', 960, 860, 56, CREAM, ua(t, wt(k, 'keep'), 1.0), align='center')


def p3q(c, t):
    k = 'p3q'
    t0, q1, q2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); practice_tag(c, t, t0)
    mdraw(c, '1)  0.00720 m :  how many sig figs?', 240, 420, 90, CREAM, ua(t, q1 - 0.2, 1.2))
    mdraw(c, '2)  12.0 m + 3.27 m  =  ?', 240, 640, 90, CREAM, ua(t, q2 - 0.2, 1.0))


def p3a(c, t):
    k = 'p3a'
    t0, q1, q2, q3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t); answer_tag(c, t, t0)
    lightbar(c, t, 300, t0 + 0.2, q1, 200, 1720)
    mdraw(c, '0.00', 260, 300, 100, (120, 126, 170), 1.0)
    mdraw(c, '720', 260 + mw('0.00', 100), 300, 100, CREAM, 1.0)
    for j, w_ in enumerate(('seven', 'two', 'zero')):
        x = 260 + mw('0.00', 100) + mw('720'[:j], 100) + mw('720'[j], 100) / 2
        c.drawCircle(x, 340, 12, P(YELLOW, 255 * ua(t, wt(k, w_), 0.2)))
    mdraw(c, '→  3', 760, 300, 100, YELLOW, ua(t, wt(k, 'three') - 0.2, 0.4))
    lightbar(c, t, 560, q1, q3, 200, 1720)
    mdraw(c, '12.0 + 3.27 = 15.27', 260, 560, 100, CREAM, ua(t, q1 - 0.1, 0.9))
    mdraw(c, '→  15.3 m', 1280, 560, 100, YELLOW, ua(t, q2 + 1.2, 0.6))
    text(c, '12.0 stops at the tenths place', 260, 650, 42, INK2, ua(t, q2, 0.4), 'semi')
    a = ua(t, q3, 0.4)
    if a > 0:
        M.boxed(c, 200, 760, 1720, 980, a)
        text(c, 'trap: counting sig figs here', 280, 850, 48, CORAL, a, 'semi'); cross(c, 1000, 834, 0.6, a)
        text(c, 'adding: decimal places', 280, 940, 48, GREEN, ua(t, wt(k, 'decimal'), 0.4), 'semi')
        check(c, 860, 924, 0.6, ua(t, wt(k, 'decimal'), 0.4))


def rc(c, t):
    k = 'rc'
    t0, q1, q2, q3, q4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    title(c, 'four checks for every calculation', t, t0, 130, INK2, 52)
    items = [(q1, 'convert to m, kg, s first', TEAL), (q2, 'carry units: do they cancel to the right one?', AMBER),
             (q3, 'does the size make sense?', CORAL), (q4, 'round once, at the end', GREEN)]
    for i, (tt, s, col) in enumerate(items):
        y = 290 + i * 190
        u = ua(t, tt - 0.2, 0.5)
        if u <= 0:
            continue
        lightbar(c, t, y + 30, tt, items[i + 1][0] if i < 3 else fin(k) + 0.5, 180, 1740, 150)
        c.drawCircle(280, y, 46, P(col, 255 * u))
        text(c, str(i + 1), 280, y + 20, 56, NAVY, u, 'xb', 'center')
        text(c, s, 370, y + 22, 60, CREAM, u, 'bold')
    a = ua(t, wt(k, 'nobody'), 0.4) * (1 - ua(t, q4 - 0.3, 0.4))
    pill(c, 'nobody walks at 30 m/s', 1400, 960, CORAL, 40, a)


SCENES = dict(STORY)
SCENES.update(promise=promise, why=why, u1=u1, u2=u2, u3=u3, u4=u4, u5=u5, p1q=p1q, p1a=p1a, c1=c1, c2=c2, c3=c3, c4=c4, c5=c5,
              c6=c6, p2q=p2q, p2a=p2a, g1=g1, g2=g2, g3=g3, g4=g4, g5=g5, g6=g6, p3q=p3q, p3a=p3a, rc=rc)
