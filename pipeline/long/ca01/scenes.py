"""Teaching boards for AP Calc AB 01 (one navy board, never zooms): handwritten math revealed on the word, the amber
band behind the line being explained, graphs drawn on, strikes on the traps. Story beats live in story.py."""
import math
import numpy as np
import skia
import kit as K
import mk as M
import gr as G
from kit import P, SP, sm, W, H, text, pill, chip, arrow, label, AMBER, CORAL, TEAL, YELLOW, GREEN, CREAM, INK2, NAVY, BLUE, LILAC, COURSE
from base import Bt, cue, fin, ua, lightbar, board, check, cross, practice_tag, answer_tag, title
import story as ST


def ww(k, w, nth=0, after=None):
    """time of a spoken word, or a sensible fallback (never crashes a render)"""
    from base import wt
    try:
        return wt(k, w, nth, after)
    except KeyError:
        print('WORD MISSING', k, w, nth)
        return after if after is not None else Bt[k]['t0']


def cues(k, n):
    return [cue(k, i) for i in range(n + 1)]


def big(c, toks, x, y, size, t, t0, d=0.8, col=CREAM, a=1.0, align='left'):
    return G.eq(c, toks, x, y, size, ua(t, t0, d), col, a, align)


# ================================================================ intro
def promise(c, t):
    k = 'promise'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    big(c, ['4 cm  →  ?'], 520, 470, 140, t, t0 + 0.2, 0.9, align='center')
    text(c, 'two hours after feeding', 520, 590, 44, INK2, ua(t, t0 + 0.6, 0.4), 'semi', 'center')
    for i, (s, cc, col) in enumerate((('functions', c1, TEAL), ('reading graphs', c2, AMBER), ('exponent rules', c3, CORAL))):
        u = ua(t, cc - 0.1, 0.35)
        if u > 0:
            chip(c, s, 1080, 250 + i * 170, col, 60, u, 0.85 + 0.15 * u)


def why(c, t):
    k = 'why'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'why start here?', t, t0, 170, CREAM, 64)
    a1 = 1 - ua(t, c2 - 0.2, 0.4)
    for i, w_ in enumerate(('formula', 'graph', 'table', 'sentence')):
        u = ua(t, ww(k, w_) - 0.1, 0.35) * a1
        if u <= 0:
            continue
        x = 300 + i * 440
        G.panel(c, x - 180, 330, x + 180, 640, u)
        if i == 0:
            G.eq(c, ['f(x) = x^{2} − 3x'], x, 510, 56, 1.0, CREAM, u, 'center')
        elif i == 1:
            ax = G.Ax(x - 130, 380, x + 130, 590, -1, 3, -2, 3)
            G.axes(c, ax, u, (), (), '', '', 24)
            G.curve(c, ax, lambda v: v * v - 2 * v - 0.5, -0.8, 2.8, 1.0, AMBER, 6, u)
        elif i == 2:
            for r_, row in enumerate((('x', 'f(x)'), ('0', '1'), ('1', '3'), ('2', '9'))):
                for j, s_ in enumerate(row):
                    text(c, s_, x - 70 + j * 140, 410 + r_ * 62, 40, CREAM if r_ else AMBER, u, 'semi', 'center')
            c.drawLine(x - 140, 425, x + 140, 425, SP(INK2, 2, 200 * u))
        else:
            for j, s_ in enumerate(('"the tank', 'drains at', '3 L/min"')):
                text(c, s_, x, 430 + j * 60, 42, CREAM, u, 'hand', 'center')
        text(c, w_, x, 700, 40, INK2, u, 'semi', 'center')
    a2 = ua(t, c2 - 0.2, 0.4) * (1 - ua(t, c3 - 0.2, 0.4))
    if a2 > 0:
        G.eq(c, ['(−2)^{2} = 4'], 560, 470, 110, ua(t, c2, 0.8), GREEN, a2, 'center')
        G.eq(c, ['−2^{2} = −4'], 1360, 470, 110, ua(t, c2 + 0.5, 0.8), CREAM, a2, 'center')
        text(c, 'a missing parenthesis', 960, 620, 50, CORAL, ua(t, ww(k, 'parenthesis'), 0.4) * a2, 'semi', 'center')
        G.eq(c, ['x^{−2}  =  −x^{2} ?'], 960, 840, 100, ua(t, ww(k, 'negative'), 0.7), CREAM, a2, 'center')
        G.strike(c, 740, 1180, 815, ua(t, ww(k, 'wrong'), 0.4), a2)
        text(c, 'a negative exponent moved the wrong way', 960, 950, 44, CORAL, ua(t, ww(k, 'wrong'), 0.4) * a2, 'semi', 'center')
    a3 = ua(t, c3 - 0.2, 0.4)
    if a3 > 0:
        G.eq(c, ['(  )      x^{−n}      ( √ )'], 960, 500, 130, ua(t, c3, 0.8), YELLOW, a3, 'center')
        pill(c, 'fix these now', 960, 720, AMBER, 50, a3)


# ================================================================ functions
def machine(c, x, y, a=1.0, inp='', out='', glow=0.0, label_='f', s=1.0):
    """the function as a box: an input goes in on the left, one output comes out on the right"""
    if a <= 0.01:
        return
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-170, -120, 170, 120), 30, 30), P((28, 36, 84), 255 * a))
    if glow > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-180, -130, 180, 130), 34, 34), P(TEAL, 90 * glow * a, MaskFilter=K.blur(24)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-170, -120, 170, 120), 30, 30), SP(TEAL, 6, 255 * a))
    text(c, label_, 0, 40, 120, TEAL, a, 'hand', 'center')
    arrow(c, (-400, 0), (-190, 0), AMBER, 8, 1.0, a)
    arrow(c, (190, 0), (400, 0), AMBER, 8, 1.0, a)
    if inp:
        G.eq(c, [inp], -430, 28, 80, 1.0, CREAM, a, 'right')
    if out:
        G.eq(c, [out], 430, 28, 80, 1.0, YELLOW, a, 'left')
    c.restore()


def f1(c, t):
    k = 'f1'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    a1 = 1 - ua(t, c2 - 0.3, 0.4)
    one = ww(k, 'one')
    if a1 > 0:
        machine(c, 960, 420, ua(t, t0 + 0.2, 0.5) * a1, 'x' if t > c1 - 0.2 else 'input', 'f(x)' if t > c1 else 'output',
                ua(t, one, 0.3) * (1 - ua(t, one + 1.2, 0.5)))
        text(c, 'exactly ONE output for each input', 960, 720, 56, YELLOW, ua(t, one - 0.1, 0.4) * a1, 'xb', 'center')
        text(c, 'f(x): the output when the input is x', 960, 820, 46, CREAM, ua(t, c1, 0.4) * a1, 'semi', 'center')
    a2 = ua(t, c2 - 0.2, 0.4)
    if a2 > 0:
        lightbar(c, t, 380, c2, c3 + 0.3, 280, 1640, 150)
        big(c, ['f(x) = x^{2} − 3x'], 960, 380, 130, t, c2, 0.9, CREAM, a2, 'center')
        text(c, 'square the input, then subtract 3 times the input', 960, 510, 46, INK2, ua(t, ww(k, 'square'), 0.5) * a2, 'semi', 'center')
        u3 = ua(t, c3, 0.6)
        if u3 > 0:
            G.eq(c, ['f(   ) = (   )^{2} − 3(   )'], 960, 760, 120, u3, TEAL, a2, 'center')
            text(c, 'x is just an empty slot', 960, 900, 46, INK2, u3, 'semi', 'center')


def f2(c, t):
    k = 'f2'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    text(c, 'every input goes in parentheses', 960, 150, 50, INK2, ua(t, t0 + 0.3, 0.4), 'semi', 'center')
    lightbar(c, t, 330, c1, c3, 220, 1700, 150)
    big(c, ['f(−2) = ', ('col', AMBER, '(−2)'), '^{2} − 3', ('col', AMBER, '(−2)')], 300, 330, 120, t, c1 - 0.2, 1.2)
    big(c, ['= 4 + 6 = 10'], 600, 500, 120, t, c2, 0.9)
    check(c, 1300, 460, 1.0, ua(t, c2 + 1.2, 0.3))
    a3 = ua(t, c3 - 0.1, 0.4)
    if a3 > 0:
        G.panel(c, 240, 620, 1680, 980, a3)
        big(c, ['−2^{2} = −4'], 330, 820, 110, t, c3, 0.8, CORAL, a3)
        cross(c, 940, 780, 1.0, ua(t, ww(k, 'wrong') - 0.1, 0.3) * a3)
        text(c, 'without ( ), the square grabs only the 2', 1030, 790, 42, CREAM, ua(t, ww(k, 'grabs'), 0.4) * a3, 'semi')
        text(c, 'one missing pair of parentheses', 1030, 870, 40, INK2, ua(t, ww(k, 'missing'), 0.4) * a3, 'semi')


def f3(c, t):
    k = 'f3'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'the input can be a whole expression', t, t0, 140, INK2, 50)
    lightbar(c, t, 330, c1, c2, 160, 1760, 150)
    big(c, ['f(', ('col', AMBER, 'a + 1'), ') = ', ('col', AMBER, '(a + 1)'), '^{2} − 3', ('col', AMBER, '(a + 1)')], 220, 330, 104, t, c1, 1.2)
    lightbar(c, t, 520, c2, c3, 160, 1760, 150)
    big(c, ['= a^{2} + 2a + 1 − 3a − 3'], 380, 520, 96, t, c2, 1.0)
    big(c, ['= a^{2} − a − 2'], 380, 680, 104, t, c2 + 1.6, 0.8, YELLOW)
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        G.panel(c, 380, 770, 1540, 1010, a3)
        G.eq(c, ['f(a + 1)  ≠  f(a) + 1'], 960, 890, 96, ua(t, c3, 0.8), CREAM, a3, 'center')
        text(c, 'the function acts on the whole input', 960, 970, 40, INK2, ua(t, ww(k, 'whole'), 0.4) * a3, 'semi', 'center')


def f4(c, t):
    k = 'f4'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    text(c, 'some inputs a rule can\'t take', 1820, 140, 46, INK2, ua(t, t0, 0.4) * (1 - ua(t, ww(k, 'domain') - 0.3, 0.3)), 'semi', 'right')
    G.eq(c, ['f(?)'], 1500, 300, 120, ua(t, t0 + 0.2, 0.6), CORAL, 1 - ua(t, ww(k, 'range'), 0.3), 'center')
    u0 = ua(t, ww(k, 'domain') - 0.1, 0.4)
    if u0 > 0:
        chip(c, 'domain', 300, 140, TEAL, 60, u0)
        text(c, 'the inputs a rule accepts', 640, 200, 50, CREAM, u0, 'semi')
    u1 = ua(t, ww(k, 'range') - 0.1, 0.4)
    if u1 > 0:
        chip(c, 'range', 300, 290, AMBER, 60, u1)
        text(c, 'the outputs it actually makes', 640, 350, 50, CREAM, u1, 'semi')
    a = ua(t, c1 - 0.1, 0.4)
    if a > 0:
        text(c, 'for now, two things shrink a domain', 960, 500, 50, INK2, a, 'semi', 'center')
        text(c, '(logarithms add a third later)', 960, 560, 36, INK2, ua(t, ww(k, 'logarithms'), 0.4), 'med', 'center')
    for i, (cc, toks, note, col) in enumerate(((c2, [('frac', '1', '0')], 'a denominator can never be 0', CORAL), (c3, [('root', '−9')], 'a square root needs 0 or more', TEAL))):
        u = ua(t, cc - 0.1, 0.4)
        if u <= 0:
            continue
        x = 520 + i * 880
        G.panel(c, x - 380, 620, x + 380, 980, u)
        G.eq(c, toks, x, 810, 120, ua(t, cc, 0.6), col, u, 'center')
        cross(c, x + 170, 760, 0.9, ua(t, cc + 0.6, 0.3) * u)
        text(c, note, x, 930, 40, CREAM, u, 'semi', 'center')


def f5(c, t):
    k = 'f5'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    xl, wd = big(c, ['h(x) = ', ('frac', ('root', 'x + 4'), 'x − 1')], 960, 230, 120, t, t0 + 0.3, 1.0, CREAM, 1.0, 'center')
    hl1 = ua(t, c1, 0.3) * (1 - ua(t, c2, 0.3)); hl2 = ua(t, c2, 0.3) * (1 - ua(t, c3, 0.3))
    fx0 = xl + G.M.mw('h(x) = ', 120)
    if hl1 > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(fx0 - 10, 70, xl + wd + 10, 200), 20, 20), P(TEAL, 55 * hl1))
    if hl2 > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(fx0 - 10, 200, xl + wd + 10, 330), 20, 20), P(CORAL, 55 * hl2))
    big(c, ['x + 4 ≥ 0   →   x ≥ −4'], 260, 470, 80, t, c1 + 0.2, 1.0, TEAL)
    big(c, ['x − 1 ≠ 0   →   x ≠ 1'], 260, 600, 80, t, c2 + 0.2, 1.0, CORAL)
    a3 = ua(t, c3 - 0.1, 0.4)
    if a3 > 0:
        X = G.numline(c, 300, 1620, 790, -6, 4, (-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4), a3)
        u = ua(t, c3 + 0.3, 1.0)
        c.drawLine(X(-4), 790, X(-4) + (X(4) + 40 - X(-4)) * u, 790, SP(YELLOW, 12, 255 * a3))
        c.drawCircle(X(-4), 790, 16, P(YELLOW, 255 * a3))
        if u > 0.6:
            c.drawCircle(X(1), 790, 18, P(NAVY, 255 * a3)); c.drawCircle(X(1), 790, 16, SP(YELLOW, 6, 255 * a3))
        text(c, 'domain: x ≥ −4 and x ≠ 1', 1620, 700, 46, YELLOW, ua(t, c3 + 1.0, 0.4), 'semi', 'right')
        label(c, 'x = −4 is fine: √0 = 0', 520, 960, GREEN, 42, ua(t, ww(k, 'fine'), 0.4), dot=(X(-4), 806))


# ---------------- practice 1
def p1q(c, t):
    k = 'p1q'; t0, c1, c2 = cues(k, 2)
    board(c, t); practice_tag(c, t, t0)
    big(c, ['g(x) = x^{2} + 2x'], 220, 330, 100, t, c1, 0.8)
    big(c, ['g(−3) = ?'], 1180, 330, 100, t, c1 + 1.2, 0.6, YELLOW)
    big(c, ['k(x) = ', ('frac', ('root', 'x − 2'), 'x − 5')], 220, 700, 100, t, c2, 0.9)
    big(c, ['domain?'], 1180, 680, 100, t, c2 + 1.6, 0.6, YELLOW)


def p1a(c, t):
    k = 'p1a'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t); answer_tag(c, t, t0)
    lightbar(c, t, 280, t0, c1, 120, 1800, 140)
    big(c, ['g(−3) = (−3)^{2} + 2(−3) = 9 − 6 = 3'], 160, 280, 84, t, t0 + 0.3, 2.0)
    check(c, 1740, 250, 0.9, ua(t, c1 - 0.6, 0.3))
    a1 = ua(t, c1, 0.4)
    if a1 > 0:
        G.eq(c, ['−3^{2} + 2(−3) = −15'], 160, 430, 76, ua(t, c1, 0.8), CORAL, a1)
        cross(c, 960, 400, 0.8, ua(t, c1 + 1.0, 0.3))
        text(c, 'trap: no parentheses', 1060, 420, 44, CORAL, ua(t, c1 + 1.0, 0.4), 'semi')
    lightbar(c, t, 680, c2, fin(k) + 0.5, 120, 1800, 260)
    big(c, ['x − 2 ≥ 0  →  x ≥ 2'], 160, 620, 80, t, c2, 0.9, TEAL)
    big(c, ['x − 5 ≠ 0  →  x ≠ 5'], 160, 760, 80, t, ww(k, 'bottom', 0, c2), 0.9, CORAL)
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        pill(c, 'x ≥ 2  and  x ≠ 5', 1360, 700, GREEN, 56, a3)


# ================================================================ graphs
def g1(c, t):
    k = 'g1'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    ax = G.Ax(420, 200, 1500, 900, -1, 6, -1, 6)
    G.axes(c, ax, ua(t, t0, 0.4), (1, 2, 3, 4, 5), (1, 2, 3, 4, 5), 'x', 'y', 34)
    f = lambda x: 1 + 0.9 * x - 0.11 * x * x + 0.3 * math.sin(x * 1.3)
    G.curve(c, ax, f, -0.6, 5.8, ua(t, t0 + 0.2, 1.4), AMBER, 8)
    text(c, 'every point is (x, f(x))', 1500, 170, 46, CREAM, ua(t, t0 + 0.8, 0.4), 'semi', 'right')
    a = 3.5
    u1 = ua(t, c1, 0.5)
    if u1 > 0:
        X = ax.X(a)
        c.drawCircle(X, ax.Y(0), 14, P(TEAL, 255 * u1))
        text(c, 'a', X, ax.Y(0) + 80, 56, TEAL, u1, 'hand', 'center')
    u2 = ua(t, c2, 0.8)
    if u2 > 0:
        X, Y0, Y1 = ax.X(a), ax.Y(0), ax.Y(f(a))
        arrow(c, (X, Y0 - 16), (X, Y0 + (Y1 - Y0) * u2 + 10), YELLOW, 8, 1.0, 1.0, 0, 30)
        G.dashed(c, (ax.X(0), Y1), (X, Y1), YELLOW, 4, ua(t, c2 + 0.9, 0.4))
        G.dot(c, ax, a, f(a), True, YELLOW, ua(t, c2 + 0.7, 0.3), 15)
        label(c, 'f(a) is a HEIGHT', X + 60, Y1 - 40, YELLOW, 50, ua(t, ww(k, 'read'), 0.4))


def pw_graph(c, ax, t, t0, a=1.0):
    G.axes(c, ax, a, (1, 2, 3), (1, 2, 3, 4, 5), 'x', 'y', 32)
    G.curve(c, ax, lambda x: 1.5 + 2 * x if x <= 1 else None, -0.3, 1.0, ua(t, t0, 0.8), AMBER, 8, a)
    G.curve(c, ax, lambda x: 5 - 0.8 * (x - 1) ** 2 if x >= 1 else None, 1.0, 3.2, ua(t, t0 + 0.6, 0.8), AMBER, 8, a)


def g2(c, t):
    k = 'g2'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    ax = G.Ax(560, 180, 1400, 900, -0.5, 3.3, -0.5, 6)
    pw_graph(c, ax, t, t0, 1.0)
    text(c, 'graphs often come in pieces', 960, 120, 46, INK2, ua(t, t0 + 0.3, 0.4), 'semi', 'center')
    G.dot(c, ax, 1, 5, True, YELLOW, ua(t, c1, 0.3), 17)
    la = ua(t, c1, 0.4) * (1 - ua(t, c3, 0.3))
    label(c, 'filled: ON the graph', 1440, 300, YELLOW, 44, la, dot=ax.pt(1, 5))
    G.dot(c, ax, 1, 3.5, False, CORAL, ua(t, c2, 0.3), 17)
    lb = ua(t, c2, 0.4) * (1 - ua(t, c3, 0.3))
    label(c, 'open: NOT included', 1440, 600, CORAL, 44, lb, dot=ax.pt(1, 3.5))
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        label(c, '(1, 3.5): not on the graph', 1440, 600, CORAL, 40, a3, dot=ax.pt(1, 3.5))
        label(c, '(1, 5): on the graph', 1440, 300, YELLOW, 40, a3, dot=ax.pt(1, 5))
        pill(c, 'f(1) = 5', 960, 990, YELLOW, 56, ua(t, ww(k, 'so', 0, c3), 0.4))


def g3(c, t):
    k = 'g3'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    ax = G.Ax(420, 200, 1380, 880, -1, 7, -2, 5)
    f = lambda x: -0.25 * (x - 1) * (x - 3.2) * (x - 6.2) / 2.2 + 0.6
    G.axes(c, ax, 1.0, (1, 2, 3, 4, 5, 6), (-1, 1, 2, 3, 4), 'x', 'y', 30)
    G.curve(c, ax, f, 0.0, 6.4, ua(t, t0, 1.0), AMBER, 8)
    G.dot(c, ax, 0.0, f(0.0), True, AMBER, ua(t, t0 + 0.4, 0.3), 12); G.dot(c, ax, 6.4, f(6.4), True, AMBER, ua(t, t0 + 1.0, 0.3), 12)
    u1 = ua(t, c1, 0.6) * (1 - ua(t, c2, 0.4))
    if u1 > 0:
        kk = 0.9
        G.dashed(c, ax.pt(-1, kk), ax.pt(7, kk), TEAL, 5, u1)
        text(c, 'y = k', 1420, ax.Y(kk) + 12, 50, TEAL, u1, 'hand')
        xs = [x for x in np.linspace(0.0, 6.4, 6000) if abs(f(x) - kk) < 0.006]
        sol = []
        for x in xs:
            if not sol or x - sol[-1] > 0.3:
                sol.append(x)
        for x in sol:
            G.dashed(c, ax.pt(x, kk), ax.pt(x, 0), TEAL, 3, u1)
            G.dot(c, ax, x, 0, True, TEAL, u1, 12)
        text(c, 'solutions of f(x) = k', 1420, ax.Y(kk) + 70, 40, TEAL, u1, 'semi')
    u2 = ua(t, c2, 0.5) * (1 - ua(t, c3, 0.4))
    if u2 > 0:
        c.save(); c.clipRect(skia.Rect(ax.X(-1), ax.Y(5), ax.X(7), ax.Y(0)))
        pth = skia.Path(); pth.moveTo(ax.X(0.0), ax.Y(0))
        for i in range(200):
            x = 6.4 * i / 199; pth.lineTo(ax.X(x), ax.Y(max(0, f(x))))
        pth.lineTo(ax.X(6.4), ax.Y(0)); pth.close(); c.drawPath(pth, P(GREEN, 80 * u2)); c.restore()
        text(c, 'f > 0: above the x axis', 1880, 300, 42, GREEN, u2, 'semi', 'right')
    u3 = ua(t, c3, 0.5)
    if u3 > 0:
        ys = [f(x / 100) for x in range(0, 641)]
        lo, hi = min(ys), max(ys)
        for yv in (lo, hi):
            G.dashed(c, (300, ax.Y(yv)), (ax.X(6.4), ax.Y(yv)), YELLOW, 2, u3 * 0.7)
        c.drawLine(300, ax.Y(lo), 300, ax.Y(hi), SP(YELLOW, 8, 255 * u3))
        for yv in (lo, hi):
            c.drawLine(284, ax.Y(yv), 316, ax.Y(yv), SP(YELLOW, 8, 255 * u3))
        text(c, 'range', 250, (ax.Y(lo) + ax.Y(hi)) / 2 + 14, 44, YELLOW, u3, 'semi', 'center')
        text(c, 'lowest height to highest', 1880, 300, 42, YELLOW, u3, 'semi', 'right')


def brace(c, x, y0, y1, a, col=CREAM):
    m = (y0 + y1) / 2
    br = skia.Path(); br.moveTo(x + 30, y0); br.quadTo(x, y0, x, y0 + 50); br.lineTo(x, m - 16); br.quadTo(x, m, x - 24, m)
    br.quadTo(x, m, x, m + 16); br.lineTo(x, y1 - 50); br.quadTo(x, y1, x + 30, y1)
    c.drawPath(br, SP(col, 6, 255 * a))


def g5(c, t):
    k = 'g5'; t0, c1, c2, c3, c4 = cues(k, 4)
    board(c, t)
    text(c, 'a piecewise function', 120, 140, 50, AMBER, ua(t, t0, 0.4), 'semi')
    a1 = ua(t, c1 - 0.2, 0.4)
    if a1 > 0:
        G.eq(c, ['f(x) = '], 120, 330, 92, ua(t, c1, 0.4), CREAM, a1)
        brace(c, 450, 200, 430, a1)
        hlB = ua(t, c3, 0.3) * (1 - ua(t, c4, 0.3)); hlA = ua(t, c4, 0.3)
        if hlB > 0: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(490, 330, 1090, 425), 18, 18), P(TEAL, 55 * hlB))
        if hlA > 0: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(490, 200, 1090, 295), 18, 18), P(AMBER, 55 * hlA))
        G.eq(c, ['x^{2}', '         x < 2'], 510, 275, 74, ua(t, c1 + 0.4, 0.7), CREAM, a1)
        G.eq(c, ['3x − 1', '     x ≥ 2'], 510, 405, 74, ua(t, c1 + 1.4, 0.7), CREAM, a1)
    u2 = ua(t, c2, 0.4)
    if u2 > 0:
        text(c, '1. which piece?    2. use only that formula', 120, 540, 44, INK2, u2, 'semi')
    ax = G.Ax(1200, 180, 1780, 760, -0.5, 3.3, -0.5, 9)
    ag = ua(t, c1 + 0.8, 0.4)
    if ag > 0:
        G.axes(c, ax, ag, (1, 2, 3), (2, 4, 6, 8), 'x', 'y', 28)
        G.curve(c, ax, lambda x: x * x if x < 2 else None, -0.3, 1.999, ua(t, c1 + 1.0, 0.8), AMBER, 7)
        G.curve(c, ax, lambda x: 3 * x - 1 if x >= 2 else None, 2.0, 3.2, ua(t, c1 + 1.8, 0.6), TEAL, 7)
        G.dot(c, ax, 2, 4, False, AMBER, ua(t, c1 + 1.8, 0.3), 13)
        G.dot(c, ax, 2, 5, True, TEAL, ua(t, c1 + 2.2, 0.3), 13)
        G.dot(c, ax, 1.9, 3.61, True, YELLOW, ua(t, c4 + 0.6, 0.3), 10)
    u3 = ua(t, c3, 0.4)
    if u3 > 0:
        G.eq(c, ['f(2) = 3(2) − 1 = 5'], 120, 700, 80, ua(t, c3 + 0.5, 0.8), TEAL, u3)
        text(c, 'the boundary goes with "or equal to"', 120, 785, 44, INK2, u3, 'semi')
    u4 = ua(t, c4, 0.4)
    if u4 > 0:
        G.eq(c, ['f(1.9) = 1.9^{2} = 3.61'], 120, 910, 80, ua(t, c4 + 0.4, 0.8), AMBER, u4)
        pill(c, 'go slowly at boundaries', 1490, 900, YELLOW, 44, ua(t, ww(k, 'boundaries'), 0.4))


def p2q(c, t):
    k = 'p2q'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t); practice_tag(c, t, t0)
    a1 = ua(t, c1 - 0.2, 0.4)
    if a1 > 0:
        G.eq(c, ['f(x) = '], 330, 380, 92, ua(t, c1, 0.4), CREAM, a1)
        brace(c, 660, 250, 480, a1)
        G.eq(c, ['x + 1', '      x < 3'], 720, 325, 74, ua(t, c1 + 0.3, 0.7), CREAM, a1)
        G.eq(c, ['2x', '          x ≥ 3'], 720, 455, 74, ua(t, c1 + 1.3, 0.7), CREAM, a1)
    big(c, ['f(3) = ?      f(2.9) = ?'], 960, 680, 90, t, c2, 0.8, YELLOW, 1.0, 'center')
    big(c, ['is (3, 4) on the graph?'], 960, 860, 90, t, c3, 0.8, YELLOW, 1.0, 'center')


def p2a(c, t):
    k = 'p2a'; t0, c1, c2 = cues(k, 2)
    board(c, t); answer_tag(c, t, t0)
    big(c, ['f(3) = 2(3) = 6'], 140, 320, 88, t, t0 + 0.3, 0.8, TEAL)
    text(c, '3 goes with "or equal to"', 140, 400, 40, INK2, ua(t, t0 + 0.6, 0.4), 'semi')
    big(c, ['f(2.9) = 2.9 + 1 = 3.9'], 140, 560, 88, t, c1, 0.8, AMBER)
    ax = G.Ax(1150, 180, 1760, 820, -0.5, 4.3, -0.5, 9)
    ag = ua(t, t0, 0.4)
    G.axes(c, ax, ag, (1, 2, 3, 4), (2, 4, 6, 8), 'x', 'y', 28)
    G.curve(c, ax, lambda x: x + 1 if x < 3 else None, -0.3, 2.999, ag, AMBER, 7, ag)
    G.curve(c, ax, lambda x: 2 * x if x >= 3 else None, 3, 4.2, ag, TEAL, 7, ag)
    G.dot(c, ax, 3, 4, False, CORAL, ag, 14)
    G.dot(c, ax, 3, 6, True, TEAL, ag, 14)
    hl = ua(t, c2, 0.3)
    if hl > 0:
        c.drawCircle(ax.X(3), ax.Y(4), 34, SP(CORAL, 5, 255 * hl))
        text(c, '(3, 4): open circle, NOT on the graph', 140, 720, 44, CORAL, hl, 'semi')
    trap = ua(t, ww(k, 'trap'), 0.4)
    if trap > 0:
        G.eq(c, ['f(3) = 3 + 1 = 4'], 140, 900, 76, trap, CORAL, trap)
        G.strike(c, 140, 680, 880, ua(t, ww(k, 'trap') + 0.8, 0.4))
        text(c, 'trap: using the first formula', 740, 890, 40, CORAL, trap, 'semi')


# ================================================================ lines, composites, moving graphs
def l1(c, t):
    k = 'l1'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    lightbar(c, t, 300, c1, c2, 100, 1060, 170)
    big(c, ['m = ', ('frac', ('seq', [('sub','y','2'), ' − ', ('sub','y','1')]), ('seq', [('sub','x','2'), ' − ', ('sub','x','1')]))], 140, 310, 110, t, c1, 0.9)
    text(c, 'rise over run', 720, 270, 46, INK2, ua(t, ww(k, 'rise'), 0.4), 'semi')
    text(c, 'same order, top and bottom', 720, 340, 40, AMBER, ua(t, ww(k, 'same'), 0.4), 'semi')
    text(c, '1 and 2 just label two points', 140, 480, 44, INK2, ua(t, ww(k, 'label'), 0.4), 'semi')
    ax = G.Ax(1140, 180, 1780, 880, -1, 5, -4, 6)
    ag = ua(t, c2 - 0.2, 0.4)
    G.axes(c, ax, ag, (1, 2, 3, 4), (-2, 2, 4), 'x', 'y', 28)
    G.dot(c, ax, 1, 4, True, YELLOW, ua(t, c2, 0.3), 14)
    G.dot(c, ax, 3, -2, True, YELLOW, ua(t, c2 + 0.5, 0.3), 14)
    label(c, '(1, 4)', ax.X(1) + 34, ax.Y(4) - 24, YELLOW, 36, ua(t, c2, 0.3))
    label(c, '(3, −2)', ax.X(3) + 34, ax.Y(-2) + 50, YELLOW, 36, ua(t, c2 + 0.5, 0.3))
    G.curve(c, ax, lambda x: -3 * x + 7, -0.3, 3.8, ua(t, ww(k, 'down') - 0.6, 0.8), AMBER, 7)
    big(c, ['m = ', ('frac', '−2 − 4', '3 − 1'), ' = ', ('frac', '−6', '2'), ' = −3'], 140, 700, 96, t, c2 + 0.3, 1.6)
    pill(c, 'down to the right', 560, 910, CORAL, 44, ua(t, ww(k, 'down'), 0.4))


def l2(c, t):
    k = 'l2'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'point slope form', t, t0, 160, INK2, 52)
    lightbar(c, t, 380, c1, c2, 260, 1660, 160)
    big(c, ['y − ', ('sub','y','1'), ' = m(x − ', ('sub','x','1'), ')'], 960, 380, 130, t, c1, 0.9, CREAM, 1.0, 'center')
    lightbar(c, t, 600, c2, c3, 260, 1660, 160)
    big(c, ['y − 4 = −3(x − 1)'], 960, 600, 130, t, c2, 0.9, YELLOW, 1.0, 'center')
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        pill(c, 'one point: (1, 4)', 620, 790, YELLOW, 44, a3)
        pill(c, 'the slope there: −3', 1300, 790, AMBER, 44, ua(t, ww(k, 'slope', 0, c3), 0.4))
        pill(c, 'the exam accepts it as is', 960, 940, GREEN, 46, ua(t, ww(k, 'exam'), 0.4))


def nested(c, x, y, a, inner, outer, ci=AMBER, co=TEAL, s=1.0):
    """f(g(x)) as two boxes: g inside, f outside"""
    if a <= 0.01:
        return
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 320 * s, y - 130 * s, x + 320 * s, y + 130 * s), 30, 30), SP(co, 6, 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 120 * s, y - 80 * s, x + 260 * s, y + 80 * s), 22, 22), P(ci, 60 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 120 * s, y - 80 * s, x + 260 * s, y + 80 * s), 22, 22), SP(ci, 5, 255 * a))
    text(c, inner, x + 70 * s, y + 30 * s, 84 * s, ci, a, 'hand', 'center')
    text(c, outer, x - 220 * s, y + 30 * s, 84 * s, co, a, 'hand', 'center')
    text(c, '1st', x + 70 * s, y - 92 * s, 40 * s, ci, a, 'semi', 'center')
    text(c, '2nd', x - 220 * s, y - 72 * s, 40 * s, co, a, 'semi', 'center')


def l3(c, t):
    k = 'l3'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    a1 = ua(t, c1 - 0.2, 0.4)
    nested(c, 960, 250, a1, 'g', 'f')
    text(c, 'inside first, then outside', 960, 450, 46, INK2, ua(t, ww(k, 'inside'), 0.4), 'semi', 'center')
    big(c, ['f(x) = x^{2}        g(x) = 3x − 1'], 960, 580, 80, t, c2 - 0.3, 0.8, INK2, 1.0, 'center')
    lightbar(c, t, 740, c2 + 0.6, c3, 200, 1720, 150)
    big(c, ['f(g(x)) = (3x − 1)^{2}'], 960, 740, 100, t, c2 + 0.8, 0.9, AMBER, 1.0, 'center')
    lightbar(c, t, 900, c3, fin(k) + 0.5, 200, 1720, 150)
    big(c, ['g(f(x)) = 3x^{2} − 1'], 960, 900, 100, t, c3, 0.9, TEAL, 1.0, 'center')
    pill(c, 'order matters', 1640, 820, CORAL, 46, ua(t, ww(k, 'order'), 0.4))


def shift_panel(c, x0, t, t_on, kind, lab):
    u = ua(t, t_on - 0.1, 0.4)
    if u <= 0:
        return
    ax = G.Ax(x0, 380, x0 + 460, 800, -2.5, 3.5, -3, 4)
    G.panel(c, x0 - 40, 240, x0 + 500, 880, u)
    G.axes(c, ax, u, (), (), '', '', 24)
    f = lambda x: 0.5 * x * x - 0.5
    G.curve(c, ax, f, -2.4, 2.4, 1.0, (120, 130, 180), 6, u)
    m = ua(t, t_on + 0.6, 0.9)
    if kind == 'up':
        g = lambda x: f(x) + 2 * m
    elif kind == 'flip':
        g = lambda x: f(x) * (1 - 2 * m)
    else:
        g = lambda x: f(x - 2 * m)
    G.curve(c, ax, g, -2.4, 3.4, 1.0, AMBER, 7, u)
    G.eq(c, [lab], x0 + 230, 330, 64, 1.0, CREAM, u, 'center')
    if kind == 'up':
        arrow(c, (x0 + 330, ax.Y(1.5)), (x0 + 330, ax.Y(3.4)), YELLOW, 6, m, u)
    elif kind == 'right':
        arrow(c, (ax.X(0) + 10, ax.Y(-1.4)), (ax.X(2) - 10, ax.Y(-1.4)), YELLOW, 6, m, u)


def l5(c, t):
    k = 'l5'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'moving graphs', t, t0, 150, INK2, 52)
    shift_panel(c, 160, t, c1, 'up', 'f(x) + k')
    shift_panel(c, 730, t, c2, 'flip', '−f(x)')
    shift_panel(c, 1300, t, c3, 'right', 'f(x − h)')
    text(c, 'every height + k: up k', 390, 950, 40, YELLOW, ua(t, c1 + 0.8, 0.4), 'semi', 'center')
    text(c, 'every height flips', 960, 950, 40, YELLOW, ua(t, c2 + 0.8, 0.4), 'semi', 'center')
    text(c, 'RIGHT h ?', 1530, 960, 52, CORAL, ua(t, c3 + 0.8, 0.4), 'xb', 'center')


def l7(c, t):
    k = 'l7'; t0, c1, c2, c3, c4 = cues(k, 4)
    board(c, t)
    big(c, ['C(n) = ', ('frac', '2n + 40', 'n')], 140, 330, 104, t, ww(k, 'two', 0, c1), 1.0)
    text(c, '$40 to fire the oven + $2 of flour a loaf', 140, 480, 38, INK2, ua(t, c1, 0.4), 'semi')
    text(c, 'n = number of loaves, C = cost per loaf', 140, 540, 38, INK2, ua(t, ww(k, 'loaves'), 0.4), 'semi')
    text(c, 'polynomial over polynomial: a rational function', 140, 610, 38, AMBER, ua(t, ww(k, 'rational'), 0.4), 'semi')
    ax = G.Ax(1060, 160, 1780, 860, -2, 40, 0, 26)
    ag = ua(t, c1 + 0.5, 0.4)
    G.axes(c, ax, ag, (10, 20, 30), (2, 10, 20), 'n', 'C', 28)
    G.curve(c, ax, lambda n: (2 * n + 40) / n if n > 0.5 else None, 1.6, 39, ua(t, c2, 2.4), AMBER, 7)
    u2 = ua(t, ww(k, 'two', 0, c2) - 0.3, 0.5)
    if u2 > 0:
        G.dashed(c, ax.pt(-2, 2), ax.pt(40, 2), GREEN, 4, u2)
        label(c, 'y = 2: horizontal asymptote', 1120, ax.Y(2) + 74, GREEN, 38, ua(t, ww(k, 'horizontal'), 0.4))
        for i, s in enumerate(('10 loaves: $6.00 each', '40 loaves: $3.00 each')):
            text(c, s, 140, 720 + i * 60, 42, CREAM, ua(t, c2 + 1.0 + i * 0.8, 0.4), 'med')
    u3 = ua(t, c3, 0.4)
    if u3 > 0:
        G.dashed(c, ax.pt(0, 0), ax.pt(0, 26), CORAL, 4, u3)
        label(c, 'n = 0: vertical asymptote', 1120, 230, CORAL, 38, u3)
    u4 = ua(t, c4, 0.4)
    if u4 > 0:
        pill(c, 'top AND bottom 0?  that is Unit 1', 560, 950, YELLOW, 40, u4)


def p3q(c, t):
    k = 'p3q'; t0, c1, c2 = cues(k, 2)
    board(c, t); practice_tag(c, t, t0)
    big(c, ['f(x) = x^{2}        g(x) = x − 4'], 960, 300, 96, t, c1, 0.9, CREAM, 1.0, 'center')
    big(c, ['f(g(2)) = ?       g(f(2)) = ?'], 960, 480, 96, t, c1 + 1.6, 0.9, YELLOW, 1.0, 'center')
    big(c, ['y = (x + 3)^{2}   vs   y = x^{2}  ?'], 960, 760, 96, t, c2, 0.9, YELLOW, 1.0, 'center')


def p3a(c, t):
    k = 'p3a'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t); answer_tag(c, t, t0)
    big(c, ['g(2) = −2,   f(−2) = 4'], 140, 300, 84, t, t0 + 0.3, 1.0, AMBER)
    big(c, ['f(2) = 4,   g(4) = 0'], 140, 450, 84, t, c1, 1.0, TEAL)
    pill(c, '4  vs  0: order matters', 520, 570, CORAL, 42, ua(t, ww(k, 'versus'), 0.4))
    ax = G.Ax(1080, 180, 1780, 860, -6, 3, -1, 9)
    ag = ua(t, c2 - 0.2, 0.4)
    if ag > 0:
        G.axes(c, ax, ag, (-5, -3, -1, 1), (2, 4, 6, 8), 'x', 'y', 28)
        G.curve(c, ax, lambda x: x * x, -3, 3, 1.0, (120, 130, 180), 6, ag)
        m = ua(t, c2 + 0.5, 1.0)
        G.curve(c, ax, lambda x: (x + 3 * m) ** 2, -6, 3, 1.0, AMBER, 7, ag)
        arrow(c, (ax.X(0) - 10, ax.Y(-0.5)), (ax.X(-3) + 10, ax.Y(-0.5)), YELLOW, 6, m, ag)
        G.eq(c, ['x + 3 = x − (−3)  →  LEFT 3'], 140, 720, 68, ua(t, c2, 1.0), CREAM, ag)
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        G.eq(c, ['"+3 means right"'], 140, 900, 70, a3, CORAL, a3)
        G.strike(c, 140, 640, 880, ua(t, c3 + 0.6, 0.4))
        text(c, 'trap', 700, 890, 44, CORAL, a3, 'xb')


# ================================================================ exponents
def e1(c, t):
    k = 'e1'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    a1 = 1 - ua(t, c2 - 0.3, 0.4)
    if a1 > 0:
        text(c, 'one rule for every power of x, but it only sees powers', 960, 250, 50, CREAM, ua(t, t0, 0.3) * a1, 'semi', 'center')
        G.eq(c, ['x^{n}'], 960, 420, 120, ua(t, t0, 0.5), YELLOW, a1 * (1 - ua(t, c1 - 0.3, 0.3)), 'center')
        for i, (fr, pw) in enumerate(((('frac', '1', 'x^{3}'), 'x^{−3}'), (('root', 'x'), 'x^{1/2}'), (('root', 'x^{2}', '3'), 'x^{2/3}'))):
            u = ua(t, c1 + i * 0.5, 0.5)
            if u <= 0:
                continue
            x = 420 + i * 540
            G.eq(c, [fr], x - 60, 560, 110, u, CREAM, a1, 'right')
            arrow(c, (x - 30, 530), (x + 60, 530), AMBER, 6, u, a1)
            G.eq(c, [pw], x + 90, 560, 110, u, YELLOW, a1)
        text(c, 'rewrite first', 960, 760, 50, AMBER, ua(t, c1, 0.4) * a1, 'semi', 'center')
    a2 = ua(t, c2 - 0.2, 0.4)
    if a2 > 0:
        big(c, ['x^{3} = x · x · x'], 960, 560, 160, t, c2, 1.0, CREAM, a2, 'center')
        text(c, 'an exponent counts repeated multiplication', 960, 760, 50, INK2, ua(t, ww(k, 'counts'), 0.4), 'semi', 'center')


def dots_row(c, x, y, n, col, a=1.0, r=22, gap=60, fade=()):
    for i in range(n):
        al = a * (0.25 if i in fade else 1.0)
        c.drawCircle(x + i * gap, y, r, P(col, 255 * al))


def e3(c, t):
    k = 'e3'; t0, c1, c2, c3, c4 = cues(k, 4)
    board(c, t)
    text(c, 'every rule comes from counting factors', 960, 100, 46, INK2, ua(t, t0, 0.3), 'semi', 'center')
    rows = [(min(c1, t0 + 0.4), ['x^{3} · x^{2} = x^{5}'], 'add', TEAL), (c2, ['x^{5} ÷ x^{2} = x^{3}'], 'subtract', AMBER), (c3, ['(x^{3})^{2} = x^{6}'], 'multiply', CORAL),
            (c4, ['x^{0} = 1   (x ≠ 0)'], 'since x³ ÷ x³ = 1', GREEN)]
    for i, (cc, toks, note, col) in enumerate(rows):
        y = 270 + i * 205
        u = ua(t, cc - 0.1, 0.5)
        if u <= 0:
            continue
        lightbar(c, t, y, cc, rows[i + 1][0] if i < 3 else fin(k) + 0.5, 140, 1780, 170)
        G.eq(c, toks, 180, y, 96, u, CREAM)
        if i == 0:
            dots_row(c, 960, y - 34, 3, TEAL, u); dots_row(c, 1160, y - 34, 2, AMBER, ua(t, cc + 0.8, 0.4))
        elif i == 1:
            dots_row(c, 960, y - 34, 5, AMBER, u, fade=(3, 4) if t > cc + 1.2 else ())
            for j in (3, 4):
                cross(c, 960 + j * 60, y - 34, 0.55, ua(t, cc + 1.2, 0.3))
        elif i == 2:
            dots_row(c, 960, y - 34, 3, CORAL, u); dots_row(c, 1160, y - 34, 3, CORAL, ua(t, cc + 0.8, 0.4))
        pill(c, note, 1560, y - 30, col, 48, u)


def e4(c, t):
    k = 'e4'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'why is x⁻² the same as 1/x² ?', t, t0, 150, INK2, 56)
    xl, wd = big(c, [('frac', 'x^{3}', 'x^{5}'), ' = ', ('frac', 'x · x · x', 'x · x · x · x · x'), ' = ', ('frac', '1', 'x^{2}')], 160, 420, 100, t, c1, 1.4)
    big(c, [('frac', 'x^{3}', 'x^{5}'), ' = x^{3 − 5} = x^{−2}'], 160, 720, 100, t, c2, 1.2)
    a = ua(t, ww(k, 'same'), 0.4)
    if a > 0:
        pill(c, 'x⁻² = 1/x²', 1500, 560, YELLOW, 60, a)
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        G.eq(c, ['2^{−3} = ', ('frac', '1', '8')], 1180, 920, 96, ua(t, ww(k, 'two', 0, c3), 0.6), GREEN, a3)
        text(c, 'small, but positive', 1520, 900, 40, GREEN, ua(t, ww(k, 'positive'), 0.4), 'semi')
        text(c, 'a negative exponent never makes it negative', 160, 900, 40, CORAL, a3, 'semi')


def e6(c, t):
    k = 'e6'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    text(c, 'an exponent touches only its own base', 960, 150, 50, INK2, ua(t, t0, 0.4), 'semi', 'center')
    lightbar(c, t, 330, c1, c2, 160, 1760, 150)
    big(c, ['3', ('col', AMBER, 'x^{−2}'), ' = ', ('frac', '3', ('col', AMBER, 'x^{2}'))], 300, 340, 110, t, c1, 0.9)
    text(c, 'only the x goes down', 1080, 320, 44, AMBER, ua(t, ww(k, 'only'), 0.4), 'semi')
    lightbar(c, t, 560, c2, c3, 160, 1760, 150)
    big(c, [('col', CORAL, '(3x)'), '^{−2} = ', ('frac', '1', ('col', CORAL, '9x^{2}'))], 300, 570, 110, t, c2, 0.9)
    text(c, 'the ( ) put the 3 under the power too', 1080, 550, 44, CORAL, ua(t, c2 + 0.8, 0.4), 'semi')
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        G.panel(c, 140, 690, 1780, 1020, a3)
        G.eq(c, [('frac', '5', 'x^{3}'), ' − ', ('frac', '1', '2x'), '  =  5x^{−3} − ', ('frac', '1', '2'), 'x^{−1}'], 960, 870, 96, ua(t, c3, 1.6), CREAM, a3, 'center')
        text(c, 'the 2 is just a number: it stays as ½', 960, 990, 40, YELLOW, ua(t, ww(k, 'number'), 0.4), 'semi', 'center')


def e7(c, t):
    k = 'e7'; t0, c1, c2, c3, c4 = cues(k, 4)
    board(c, t)
    big(c, ['x^{1/2} = ?'], 960, 200, 110, t, t0 + 0.4, 0.6, CREAM, 1.0, 'center')
    big(c, ['(x^{1/2})^{2} = x^{1/2 · 2} = x^{1} = x'], 960, 380, 96, t, c1, 1.2, CREAM, 1.0, 'center')
    a2 = ua(t, c2, 0.4)
    if a2 > 0:
        G.eq(c, ['x^{1/2} = ', ('root', 'x'), '    (x ≥ 0)'], 960, 530, 90, a2, GREEN, a2, 'center')
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        G.eq(c, ['x^{m/n}'], 300, 760, 140, ua(t, c3, 0.5), YELLOW, a3, 'center')
        label(c, 'top m: a power', 520, 690, AMBER, 44, ua(t, ww(k, 'top', 0, c3), 0.4), dot=(370, 690))
        label(c, 'bottom n: a root', 520, 820, TEAL, 44, ua(t, ww(k, 'bottom', 0, c3), 0.4), dot=(390, 740))
    a4 = ua(t, c4, 0.4)
    if a4 > 0:
        G.eq(c, ['8^{2/3} = (', ('root', '8', '3'), ')^{2} = 2^{2} = 4'], 1420, 780, 80, ua(t, c4, 1.4), CREAM, a4, 'center')
        text(c, 'root first: the numbers stay small', 1420, 880, 38, INK2, a4, 'semi', 'center')


def e9(c, t):
    k = 'e9'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'exponent rules do NOT cross a plus sign', t, t0, 160, CORAL, 52)
    lightbar(c, t, 380, c1, c2, 140, 1780, 160)
    big(c, ['(x + y)^{2}  ≠  x^{2} + y^{2}'], 180, 380, 92, t, c1, 0.9)
    big(c, ['(1 + 2)^{2} = 9,  not 5'], 1080, 380, 72, t, ww(k, 'test'), 0.8, YELLOW)
    lightbar(c, t, 620, c2, c3, 140, 1780, 160)
    big(c, [('root', 'x^{2} + 9'), '  ≠  x + 3'], 180, 620, 92, t, c2, 0.9)
    big(c, ['x = 4:  √25 = 5,  not 7'], 1080, 620, 72, t, ww(k, 'try'), 0.8, YELLOW)
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        pill(c, 'test with a number: ten seconds', 960, 860, GREEN, 54, a3)


def p4q(c, t):
    k = 'p4q'; t0, c1, c2 = cues(k, 2)
    board(c, t); practice_tag(c, t, t0)
    big(c, [('frac', '6', 'x^{2}'), ' + ', ('root', 'x'), '  =  ?'], 960, 400, 120, t, c1, 0.9, CREAM, 1.0, 'center')
    text(c, 'as a sum of powers of x', 960, 540, 44, INK2, ua(t, c1 + 0.8, 0.4), 'semi', 'center')
    big(c, ['27^{2/3} = ?'], 960, 790, 120, t, c2, 0.8, YELLOW, 1.0, 'center')


def p4a(c, t):
    k = 'p4a'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t); answer_tag(c, t, t0)
    big(c, [('frac', '6', 'x^{2}'), ' = 6x^{−2}'], 180, 300, 96, t, t0 + 0.3, 0.8, AMBER)
    big(c, [('root', 'x'), ' = x^{1/2}'], 960, 300, 96, t, c1, 0.8, TEAL)
    big(c, ['27^{2/3} = (', ('root', '27', '3'), ')^{2} = 3^{2} = 9'], 180, 560, 96, t, c2, 1.2, GREEN)
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        G.panel(c, 140, 680, 1780, 1010, a3)
        text(c, 'traps', 200, 750, 44, CORAL, a3, 'xb')
        G.eq(c, [('frac', '6', 'x^{2}'), ' = (6x)^{−2}'], 220, 900, 80, ua(t, c3 + 0.3, 0.8), CORAL, a3)
        G.strike(c, 220, 760, 880, ua(t, c3 + 1.4, 0.4))
        text(c, '(that is 1/36x²)', 220, 990, 40, CORAL, ua(t, c3 + 1.0, 0.4), 'semi')
        G.eq(c, ['27 × ', ('frac', '2', '3'), ' = 18'], 1040, 900, 80, ua(t, ww(k, 'multiplying'), 0.8), CORAL, a3)
        G.strike(c, 1040, 1480, 880, ua(t, ww(k, 'eighteen'), 0.4))


def rc(c, t):
    k = 'rc'; t0, q1, q2, q3, q4 = cues(k, 4)
    board(c, t)
    title(c, 'the toolkit', t, t0, 110, INK2, 52)
    boxes = [(q1, 160, 160, TEAL), (q2, 980, 160, AMBER), (q3, 160, 600, CORAL), (q4, 980, 600, GREEN)]
    for i, (tt, x, y, col) in enumerate(boxes):
        u = ua(t, tt - 0.2, 0.5)
        if u <= 0:
            continue
        on = ua(t, tt, 0.3) * (1 - ua(t, boxes[i + 1][0] if i < 3 else fin(k) + 0.6, 0.3))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + 780, y + 400), 26, 26), P((14, 18, 44), 210 * u))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + 780, y + 400), 26, 26), SP(col, 3 + 4 * on, 255 * u))
        if i == 0:
            machine(c, x + 390, y + 160, u, '', '', on, 'f', 0.7)
            text(c, 'one output per input; ( ) around inputs', x + 390, y + 360, 36, CREAM, u, 'semi', 'center')
        elif i == 1:
            ax = G.Ax(x + 160, y + 50, x + 640, y + 290, -0.5, 3.3, -0.5, 6)
            pw_graph(c, ax, t, tt, u)
            G.dot(c, ax, 1, 5, True, YELLOW, u, 12); G.dot(c, ax, 1, 3.5, False, CORAL, u, 12)
            text(c, 'f(a) is a height; open circles don\'t count', x + 390, y + 370, 36, CREAM, u, 'semi', 'center')
        elif i == 2:
            nested(c, x + 270, y + 170, u, 'g', 'f', s=0.6)
            G.eq(c, ['f(x − h)'], x + 610, y + 160, 60, 1.0, AMBER, u, 'center')
            G.eq(c, ['→ right'], x + 610, y + 240, 50, 1.0, AMBER, u, 'center')
            text(c, 'inside out; x − h moves right', x + 390, y + 360, 36, CREAM, u, 'semi', 'center')
        else:
            G.eq(c, ['x^{−n} = ', ('frac', '1', 'x^{n}'), '     x^{1/2} = ', ('root', 'x')], x + 390, y + 200, 64, 1.0, CREAM, u, 'center')
            text(c, 'nothing crosses a plus sign', x + 390, y + 360, 36, CORAL, u, 'semi', 'center')


SCENES = dict(ST.STORY)
SCENES.update(promise=promise, why=why, f1=f1, f2=f2, f3=f3, f4=f4, f5=f5, p1q=p1q, p1a=p1a, g1=g1, g2=g2, g3=g3, g5=g5, p2q=p2q, p2a=p2a,
              l1=l1, l2=l2, l3=l3, l5=l5, l7=l7, p3q=p3q, p3a=p3a, e1=e1, e3=e3, e4=e4, e6=e6, e7=e7, e9=e9, p4q=p4q, p4a=p4a, rc=rc)
