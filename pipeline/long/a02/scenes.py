"""Every beat of the A&P 02 pilot drawn in code. Each function draws the whole frame for global time t.
Bt is the timeline's beat table; cue(k, n) is the global time of cue n of beat k."""
import math
import numpy as np
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, hand, chip, pill, arrow, glow, label, CREAM, AMBER, CORAL, TEAL, YELLOW, BLUE, GREEN, NAVY, INK2, PREFIX, ROOT, SUFFIX, VOWEL
import props as PR
import park as PK
import body as Bd

Bt = {}


def cue(k, n=0):
    b = Bt[k]
    if n == 0:
        return b['t0']
    return b['cues'].get(n, b['cues'].get(str(n), b['t0']))


def u(t, k, n=0, d=0.5, lead=0.1):
    return sm((t - cue(k, n) + lead) / d)


def fin(k):
    return Bt[k]['t1']


# ---------------------------------------------------------------- shared pieces
def word_row(c, t, parts, cx, y, times, size=86, gap=12, meanings=None, mt=None, split=1.0, drop=None):
    """parts: [(text, colour)]. They pop in at times; split 0 pushes them together into one word."""
    ws = [K.width(p, size, 'xb') + 44 for p, _ in parts]
    tot = sum(ws) + gap * (len(ws) - 1) * split
    x = cx - tot / 2
    out = []
    for i, ((p, col), w) in enumerate(zip(parts, ws)):
        a = sm((t - times[i]) / 0.35) if times[i] is not None else 0
        dy = 0
        if drop is not None and i in drop:
            dd = sm((t - drop[i]) / 0.6)
            dy = 220 * dd * dd; a *= 1 - dd
        if a > 0.01:
            sc = 0.85 + 0.15 * sm((t - times[i]) / 0.25)
            chip(c, p, x, y + dy, col, size, a, sc)
            if meanings and meanings[i] and mt and mt[i] is not None:
                ma = sm((t - mt[i]) / 0.4)
                hand(c, meanings[i], x + w / 2, y + size * 1.45 + 70, 46, col, ma, 'center')
        out.append((x, w))
        x += w + gap * split
    return out


def board_title(c, s, t, t0, col=CREAM):
    text(c, s, W / 2, 140, 56, col, sm((t - t0) / 0.4), 'xb', 'center')


def practice_tag(c, t, t0, s='YOUR TURN'):
    a = sm((t - t0) / 0.3)
    pill(c, s, 190, 90, AMBER, 30, a, kind='xb')


def answer_tag(c, t, t0):
    pill(c, 'ANSWER', 170, 90, GREEN, 30, sm((t - t0) / 0.3), kind='xb')


def park_bg_dim(c, t, dim=0.0):
    PK.background(c, t)
    if dim > 0:
        c.drawRect(skia.Rect(0, 0, W, H), P((16, 20, 40), 160 * dim))


# ---------------------------------------------------------------- intro
def hook(c, t):
    k = 'hook'
    if t < cue(k, 3) - 0.2:
        rad = u(t, k, 2, 0.6)
        PK.scene(c, t, radio=rad, wound=1)
        # the cut, labelled
        a1 = u(t, k, 1, 0.5) * (1 - u(t, k, 2, 0.4))
        label(c, 'left forearm, thumb side', 1250, 1000, CREAM, 38, a1, dot=(PK.S * 823, PK.S * 527))
        if rad > 0.5:
            pill(c, '"just above the wrist"', 1260, 330, AMBER, 40, u(t, k, 2, 0.4, -0.5))
            for r in range(3):
                ph = ((t * 1.4 + r / 3) % 1)
                c.drawArc(skia.Rect(1000 - 40 * ph * 3, 330 - 40 * ph * 3, 1000 + 40 * ph * 3, 330 + 40 * ph * 3), -40, 80, False, SP(AMBER, 4, 200 * (1 - ph)))
        K.vignette(c)
    else:
        lift = u(t, k, 4, 1.2, 0.6)
        park_bg_dim(c, t, 0.15)
        dy = 300 * lift
        c.save(); c.translate(0, dy)
        g = PR.arm_closeup(c, t, lift=lift)
        c.restore()
        wr, el = g['wr'] + np.array([0, dy]), g['el'] + np.array([0, dy])
        # "above the wrist": straight up the screen from the wrist
        a = u(t, k, 3, 0.5, -0.3)
        base = np.array([wr[0] - 170, wr[1] - 40 if lift < 0.5 else wr[1] + 40])
        tip = base + np.array([0, -220])
        arrow(c, base, tip, AMBER, 12, a, 1.0)
        tw = 'above the wrist'
        my = (base[1] + tip[1]) / 2
        pill(c, tw, base[0] - 220, my - 30, AMBER, 42, a)
        if lift > 0.5:
            pill(c, 'now: toward the fingers', base[0] - 220, my + 50, YELLOW, 34, sm((lift - 0.6) / 0.3))
            text(c, '?', 1420, 400, 260, AMBER, sm((t - fin(k) + 1.6) / 0.5), 'xb', 'center')
        else:
            pill(c, 'toward the elbow', base[0] - 220, my + 50, YELLOW, 34, a)
        K.vignette(c)


def promise(c, t):
    k = 'promise'
    K.calm_bg(c, t)
    a = u(t, k, 0, 0.5)
    text(c, 'Describe any spot on the body', W / 2, 260, 60, CREAM, a, 'xb', 'center')
    text(c, 'so it means the same thing to everyone', W / 2, 340, 44, INK2, a, 'semi', 'center')
    t1 = cue(k, 1); t2 = cue(k, 2)
    sp = sm((t - t2) / 0.6)
    if t >= t1 - 0.1:
        if sp < 0.02:
            hand(c, 'hepatomegaly', W / 2, 640, 120, CREAM, sm((t - t1) / 1.0), 'center')
        else:
            word_row(c, t, [('hepat', ROOT), ('o', VOWEL), ('megaly', SUFFIX)], W / 2, 560, [t2, t2 + 0.15, t2 + 0.3], 96, 26, split=sp,
                     meanings=['liver', '', 'enlarged'], mt=[t2 + 0.6, None, t2 + 0.9])


def why(c, t):
    k = 'why'
    K.calm_bg(c, t)
    # left: a few parts that keep their meaning; right: a figure whose "above" changes, then the standard pose
    a = u(t, k, 1, 0.5)
    for i, (p, col, m) in enumerate((('cardi', ROOT, 'heart'), ('itis', SUFFIX, 'inflamed'), ('peri', PREFIX, 'around'))):
        chip(c, p, 240, 300 + i * 170, col, 70, sm((t - cue(k, 1) - i * 0.25) / 0.35))
        hand(c, '= ' + m, 520, 360 + i * 170, 50, col, sm((t - cue(k, 1) - i * 0.25 - 0.3) / 0.5))
    fa = u(t, k, 2, 0.5)
    if fa > 0.01:
        pp = PR.person('cyclist')
        std = u(t, k, 3, 0.8)
        sw = math.sin(t * 1.6) * (1 - std)
        pp.arm = {1: [14 + 150 * max(0, sw), 4, 1.0], -1: [14, 4, 1.0]}
        c.saveLayerAlpha(None, int(255 * fa))
        pp.draw(c, 1380, 980, 1.15, t)
        c.restore()
        if std > 0.01:
            pill(c, 'one standard pose', 1380, 120, AMBER, 40, std)
            glow(c, 1380, 560, 380, AMBER, 0.35 * std)


# ---------------------------------------------------------------- roots
def w0(c, t):
    k = 'w0'
    PR.er_scene(c, t, tablet=u(t, k, 2, 0.5))
    if t > cue(k, 2):
        z = sm((t - cue(k, 2) - 1.0) / 0.8)
        if z > 0:
            c.drawRect(skia.Rect(0, 0, W, H), P((20, 26, 40), 180 * z))
    K.vignette(c)


CHART = [('History of', 'cholecystitis'), ('Reported', 'gastralgia'), ('Exam showed', 'hepatomegaly')]


def w1(c, t):
    k = 'w1'
    us = [sm((t - cue(k, i + 1)) / 1.0) for i in range(3)]
    PR.tablet_closeup(c, t, CHART, us)
    if t > cue(k, 4):
        a = sm((t - cue(k, 4)) / 0.5)
        pill(c, 'built from word parts', W / 2, 980, AMBER, 40, a)
    K.vignette(c)


def w2(c, t):
    k = 'w2'
    K.calm_bg(c, t)
    board_title(c, 'ROOT = the main meaning', t, cue(k))
    rows = [
        ([('cardi', ROOT), ('o', VOWEL), ('logy', SUFFIX)], cue(k, 1), ['heart', '', 'study of']),
        ([('gastr', ROOT), ('itis', SUFFIX)], cue(k, 2), ['stomach', 'inflamed']),
        ([('gastr', ROOT), ('o', VOWEL), ('enter', ROOT), ('o', VOWEL), ('logy', SUFFIX)], cue(k, 3), ['stomach', '', 'intestine', '', 'study of']),
    ]
    for i, (parts, t0, means) in enumerate(rows):
        y = 230 + i * 260
        n = len(parts)
        word_row(c, t, parts, W / 2, y, [t0 + j * 0.15 for j in range(n)], 70, 14, meanings=means, mt=[t0 + 0.5 + j * 0.15 for j in range(n)])


def w3(c, t):
    k = 'w3'
    K.calm_bg(c, t)
    t0 = cue(k)
    # cardilogy, clunky -> slip in an O
    a = sm((t - t0) / 0.4) * (1 - sm((t - cue(k, 2) + 0.3) / 0.4))
    if a > 0.01:
        o_in = sm((t - cue(k, 1)) / 0.5)
        word_row(c, t, [('cardi', ROOT), ('o', VOWEL), ('logy', SUFFIX)], W / 2, 380, [t0, cue(k, 1), t0], 100, 20 + 20 * (1 - o_in))
        if o_in < 0.5:
            text(c, 'cardilogy?', W / 2, 300, 50, INK2, a * (1 - o_in * 2), 'semi', 'center')
    # combining form, then the three cases
    if t > cue(k, 2) - 0.3:
        a2 = sm((t - cue(k, 2)) / 0.4)
        text(c, 'combining form:', 520, 220, 46, INK2, a2, 'semi', 'right')
        text(c, 'cardi / o', 560, 248, 64, CREAM, a2, 'xb')
        word_row(c, t, [('gastr', ROOT), ('o', VOWEL), ('entero', ROOT), ('logy', SUFFIX)], W / 2 - 300, 420, [cue(k, 3)] * 4, 58, 10)
        text(c, 'between two roots: O stays', W / 2 - 300, 560, 36, GREEN, sm((t - cue(k, 3) - 0.3) / 0.4), 'semi', 'center')
        word_row(c, t, [('hepat', ROOT), ('o', VOWEL), ('megaly', SUFFIX)], W / 2 + 480, 420, [cue(k, 3) + 1.5] * 3, 58, 10)
        text(c, 'consonant next: O stays', W / 2 + 480, 560, 36, GREEN, sm((t - cue(k, 3) - 1.8) / 0.4), 'semi', 'center')
        t4 = cue(k, 4)
        word_row(c, t, [('gastr', ROOT), ('o', VOWEL), ('itis', SUFFIX)], W / 2, 700, [t4, t4, t4], 70, 12, drop={1: t4 + 0.7})
        text(c, 'vowel next: O drops', W / 2, 880, 40, CORAL, sm((t - t4 - 0.9) / 0.4), 'semi', 'center')


def r1q(c, t):
    k = 'r1q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    word_row(c, t, [('neur', ROOT)], W / 2 - 260, 380, [cue(k, 1)], 90, meanings=['nerve'], mt=[cue(k, 1) + 0.3])
    text(c, '+', W / 2, 470, 100, CREAM, sm((t - cue(k, 1) - 0.6) / 0.3), 'xb', 'center')
    word_row(c, t, [('logy', SUFFIX)], W / 2 + 260, 380, [cue(k, 1) + 0.8], 90, meanings=['study of'], mt=[cue(k, 1) + 1.1])
    hand(c, '= ?    and why the O?', W / 2, 820, 70, YELLOW, sm((t - cue(k, 2)) / 1.0), 'center')


def r1a(c, t):
    k = 'r1a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    word_row(c, t, [('neur', ROOT), ('o', VOWEL), ('logy', SUFFIX)], W / 2, 400, [cue(k), cue(k) + 0.1, cue(k) + 0.2], 100, 16)
    a = u(t, k, 1, 0.5)
    glow(c, W / 2 - 40, 470, 120, AMBER, a)
    hand(c, 'logy starts with a consonant, so the O stays', W / 2, 760, 58, GREEN, sm((t - cue(k, 1)) / 1.2), 'center')


# ---------------------------------------------------------------- prefixes and suffixes
def breath_wave(c, x, y, w, rate, a, t, col):
    p = skia.Path(); first = True
    for i in range(80):
        xx = x + i * w / 79
        yy = y - (math.sin((i / 79) * rate * 2 * math.pi - t * 3) * 34 if rate > 0 else 0)
        (p.moveTo if first else p.lineTo)(xx, yy); first = False
    c.drawPath(p, SP(col, 6, 255 * a))


def x1(c, t):
    k = 'x1'
    K.calm_bg(c, t)
    board_title(c, 'PREFIX = in front, changes the meaning', t, cue(k))
    rows = [('tachy', 'fast', 6, cue(k, 2)), ('brady', 'slow', 1.5, cue(k, 3)), ('a', 'none', 0, cue(k, 4))]
    pa = u(t, k, 1, 0.4)
    for i, (pre, m, rate, t0) in enumerate(rows):
        y = 300 + i * 220
        a = sm((t - t0) / 0.4)
        w1_ = chip(c, pre, 300, y, PREFIX, 74, a)
        chip(c, 'pnea', 300 + max(w1_, 0) + 14, y, ROOT, 74, pa if i == 0 else a)
        breath_wave(c, 1000, y + 50, 520, rate, a, t, PREFIX)
        hand(c, m + ' breathing', 1600, y + 70, 50, CREAM, a)
    if t > cue(k, 5):
        glow(c, 520, 520, 260, ROOT, 0.4 * sm((t - cue(k, 5)) / 0.4))
        text(c, 'breathing never changed', 520, 1000, 40, ROOT, sm((t - cue(k, 5)) / 0.4), 'semi', 'center')


def x2(c, t):
    k = 'x2'
    K.calm_bg(c, t)
    board_title(c, 'Prefixes that look alike', t, cue(k))
    a1, a2 = u(t, k, 1), u(t, k, 2)
    chip(c, 'inter', 250, 240, PREFIX, 64, a1); hand(c, '= between', 480, 290, 52, CREAM, a1)
    PR.ribs(c, 560, 560, 0.9, a1, between=u(t, k, 1, 0.6, -0.6))
    chip(c, 'intra', 1060, 240, PREFIX, 64, a2); hand(c, '= inside', 1290, 290, 52, CREAM, a2)
    PR.vein(c, 1390, 560, 1.0, a2, inside=u(t, k, 2, 0.8, -0.6))
    a3 = u(t, k, 3)
    chip(c, 'hyper', 380, 820, CORAL, 58, a3); hand(c, 'more than normal', 620, 870, 48, CREAM, a3)
    chip(c, 'hypo', 1100, 820, BLUE, 58, a3); hand(c, 'less than normal', 1320, 870, 48, CREAM, a3)
    arrow(c, (330, 960), (330, 880), CORAL, 8, a3, a3); arrow(c, (1050, 880), (1050, 960), BLUE, 8, a3, a3)


def x3(c, t):
    k = 'x3'
    K.calm_bg(c, t)
    board_title(c, 'SUFFIX = at the end, what kind of word', t, cue(k))
    a = u(t, k, 1)
    for i, (s_, m) in enumerate((('itis', 'inflamed'), ('algia', 'pain'), ('megaly', 'enlarged'))):
        tt = cue(k, 1) + i * 0.9
        aa = sm((t - tt) / 0.4)
        chip(c, s_, 330, 280 + i * 170, SUFFIX, 70, aa)
        hand(c, '= ' + m, 680, 340 + i * 170, 54, CREAM, aa)
    text(c, 'conditions', 330, 250, 34, INK2, a, 'semi')
    b = u(t, k, 2)
    chip(c, 'ac', 1180, 450, SUFFIX, 70, b)
    hand(c, '= having to do with', 1360, 510, 50, CREAM, b)
    hand(c, 'cardiac', 1180, 640, 80, CREAM, b)


def x4(c, t):
    k = 'x4'
    K.calm_bg(c, t)
    a0 = u(t, k)
    chip(c, 'nephr', W / 2 - 110, 150, ROOT, 70, a0); hand(c, '= kidney', W / 2 + 170, 205, 52, CREAM, a0)
    a1, a2 = u(t, k, 1), u(t, k, 2)
    chip(c, 'tomy', 330, 360, SUFFIX, 70, a1); hand(c, 'cutting into', 330, 520, 52, CREAM, a1)
    PR.kidney(c, 480, 760, 1.1, a1, cut=u(t, k, 1, 1.0, -0.6))
    text(c, 'kidney stays', 480, 960, 40, GREEN, u(t, k, 1, 0.5, -1.6), 'semi', 'center')
    chip(c, 'ectomy', 1240, 360, SUFFIX, 70, a2); hand(c, 'cutting out', 1280, 520, 52, CREAM, a2)
    PR.kidney(c, 1420, 760, 1.1, a2, out=u(t, k, 2, 1.2, -1.2))
    text(c, 'kidney gone', 1420, 960, 40, CORAL, u(t, k, 2, 0.5, -2.2), 'semi', 'center')
    ga = u(t, k, 2, 0.5, -2.2)
    if ga > 0.01:
        c.drawOval(skia.Rect(1420 - 70, 760 - 95, 1420 + 70, 760 + 95), skia.Paint(AntiAlias=True, Color=C(INK2, 200 * ga), Style=skia.Paint.kStroke_Style, StrokeWidth=5, PathEffect=skia.DashPathEffect.Make([16, 12], 0)))


def x5(c, t):
    k = 'x5'
    park_bg = False
    PR.er_bg(c, t)
    c.drawRect(skia.Rect(0, 0, W, H), P((20, 26, 40), 90))
    PR.arm_closeup(c, t, lift=0, bruise=u(t, k, 1, 0.8), bandage=1.0)
    hand(c, 'subcutaneous hematoma', 1420, 300, 64, YELLOW, sm((t - cue(k, 2)) / 1.4), 'center')
    if t > cue(k, 1):
        label(c, 'bruise on the elbow', 1180, 640, CREAM, 38, u(t, k, 1, 0.5), dot=(840, 470))
    K.vignette(c)


def p1q(c, t):
    k = 'p1q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    hand(c, 'subcutaneous hematoma', W / 2, 220, 80, CREAM, u(t, k, 0, 1.0))
    a = u(t, k, 1)
    parts = [('sub', PREFIX, 'under'), ('cutane', ROOT, 'skin'), ('hemat', ROOT, 'blood'), ('oma', SUFFIX, 'mass, swelling')]
    for i, (p, col, m) in enumerate(parts):
        x = 260 + i * 380
        aa = sm((t - cue(k, 1) - i * 0.8) / 0.4)
        chip(c, p, x, 420, col, 66, aa)
        hand(c, m, x + 60, 600, 46, col, aa)
    hand(c, 'where is it, and what is it?', W / 2, 860, 64, YELLOW, u(t, k, 2, 1.0), 'center')


def p1a(c, t):
    k = 'p1a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    # skin cross section with a pocket of blood under it
    a = u(t, k, 0)
    c.save(); c.translate(W / 2, 560)
    c.drawRect(skia.Rect(-700, -160, 700, -110), P((236, 156, 126), 255 * a))
    c.drawRect(skia.Rect(-700, -110, 700, 60), P((250, 222, 150), 255 * a))
    c.drawRect(skia.Rect(-700, 60, 700, 220), P((200, 80, 84), 255 * a))
    bl = u(t, k, 1, 0.8)
    c.drawOval(skia.Rect(-220 * bl, -100, 220 * bl, 30), P((110, 30, 60), 230 * a))
    c.restore()
    label(c, 'skin', 330, 390, CREAM, 36, a, dot=(420, 425))
    label(c, 'a pocket of blood under the skin', 1260, 330, YELLOW, 40, u(t, k, 1, 0.5), dot=(1040, 520))
    hand(c, 'a bad bruise', W / 2, 960, 70, CREAM, u(t, k, 2, 1.0), 'center')


# ---------------------------------------------------------------- decode
def d1(c, t):
    k = 'd1'
    K.calm_bg(c, t)
    t0 = cue(k, 2)
    xs = word_row(c, t, [('peri', PREFIX), ('card', ROOT), ('itis', SUFFIX)], W / 2 - 260, 260, [t0, t0, t0], 84, 18)
    order = [(2, cue(k, 3), 'inflamed'), (0, cue(k, 4), 'around'), (1, cue(k, 5), 'heart')]
    for n, (i, tt, m) in enumerate(order):
        a = sm((t - tt) / 0.4)
        x, w = xs[i]
        c.drawCircle(x + w / 2, 200, 30, P(AMBER, 255 * a)); text(c, str(n + 1), x + w / 2, 212, 34, NAVY, a, 'xb', 'center')
        hand(c, m, x + w / 2, 470, 52, CREAM, a, 'center')
    a6 = u(t, k, 6)
    PR.heart_sac(c, 1460, 560, 1.4, u(t, k, 2, 0.6), sac=a6, inflamed=a6, t=t)
    hand(c, 'inflammation around the heart', W / 2 - 260, 640, 56, YELLOW, sm((t - cue(k, 6)) / 1.2), 'center')
    text(c, 'read: suffix, then prefix, then root', W / 2 - 260, 800, 40, INK2, u(t, k, 1, 0.5), 'semi', 'center')


def d2(c, t):
    k = 'd2'
    hl = {}
    us = [1, 1, 1]
    PR.tablet_closeup(c, t, CHART, us, hl={i: (GREEN if t > cue(k, i + 1) else (40, 48, 92)) for i in range(3)})
    means = ['= inflamed gallbladder', '= stomach pain', '= enlarged liver']
    c.save(); c.translate(W / 2, H / 2 + 20); c.rotate(-2)
    for i, m in enumerate(means):
        hand(c, m, 80, -170 + i * 150 + 64, 48, (200, 80, 60), sm((t - cue(k, i + 1) - 0.8) / 0.8))
    c.restore()
    if t > cue(k, 4):
        pill(c, 'none of it is gibberish now', W / 2, 1000, GREEN, 38, u(t, k, 4, 0.4))
    K.vignette(c)


def q1q(c, t):
    k = 'q1q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k), 'QUICK CHECK')
    hand(c, 'nephrectomy last year', W / 2, 260, 84, CREAM, u(t, k, 1, 1.0), 'center')
    PR.kidney(c, W / 2, 620, 1.3, u(t, k, 1, 0.5))
    hand(c, 'still has that whole kidney?', W / 2, 920, 64, YELLOW, u(t, k, 2, 1.0), 'center')


def q1a(c, t):
    k = 'q1a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    text(c, 'No', 480, 300, 120, CORAL, u(t, k), 'xb', 'center')
    chip(c, 'ectomy', 320, 380, SUFFIX, 60, u(t, k, 1)); hand(c, 'cut out', 480, 560, 50, CREAM, u(t, k, 1))
    PR.kidney(c, 480, 760, 1.0, 1 - u(t, k, 1, 1.0) * 0.0, out=u(t, k, 1, 1.0, -0.4))
    a2 = u(t, k, 2)
    chip(c, 'tomy', 1300, 380, SUFFIX, 60, a2); hand(c, 'cut that healed', 1430, 560, 50, CREAM, a2)
    PR.kidney(c, 1430, 760, 1.0, a2, scar=a2)


# ---------------------------------------------------------------- the anatomical position
def figure(c, t, x=W / 2, y=1020, s=1.18, arm=None, hl=None, std=1.0, back=False):
    p = PR.person('cyclist') if not std else Bd.Person()
    if arm:
        p.arm = arm
    p.back = back
    p.draw(c, x, y, s, t)
    return p


def a1(c, t):
    k = 'a1'
    if t < cue(k, 3) - 0.1:
        PK.scene(c, t, radio=1.0)
        pill(c, '"just above the wrist"', 1260, 330, AMBER, 40, u(t, k, 1, 0.4))
        if t > cue(k, 2):
            pill(c, 'depends on how the arm is posed', W / 2, 980, AMBER, 42, u(t, k, 2))
        K.vignette(c)
    else:
        K.calm_bg(c, t)
        a = u(t, k, 3, 0.6)
        c.saveLayerAlpha(None, int(255 * a))
        figure(c, t)
        c.restore()
        pill(c, 'ANATOMICAL POSITION', W / 2, 90, AMBER, 44, a, kind='xb')


def a2(c, t):
    k = 'a2'
    K.calm_bg(c, t)
    pill(c, 'ANATOMICAL POSITION', W / 2, 90, AMBER, 44, 1, kind='xb')
    sup = u(t, k, 2, 1.2)
    p = Bd.Person(); p.arm = {1: [8 + 6 * sup, 3, sup], -1: [8 + 6 * sup, 3, sup]}
    p.draw(c, W / 2, 1020, 1.18, t)
    a0 = u(t, k)
    label(c, 'standing straight, facing forward', 300, 230, CREAM, 36, a0, dot=(W / 2 - 40, 1020 - 1.18 * 640))
    a1_ = u(t, k, 1)
    label(c, 'feet flat, parallel, toes forward', 1290, 990, CREAM, 36, a1_, dot=(W / 2 + 50, 1015))
    label(c, 'palms forward, thumbs point out', 1290, 640, YELLOW, 38, u(t, k, 2), dot=(W / 2 + 1.18 * 130, 1020 - 1.18 * 270))
    if sup > 0.6:
        for side in (1, -1):
            hx = W / 2 - side * 1.18 * 170; hy = 1020 - 1.18 * 260
            arrow(c, (hx, hy), (hx - side * 110, hy), AMBER, 7, sm((sup - 0.6) / 0.4), 1.0, head=20)


def a4(c, t):
    k = 'a4'
    K.calm_bg(c, t)
    a0 = u(t, k) * (1 - u(t, k, 1, 0.5))
    if a0 > 0.01:
        c.saveLayerAlpha(None, int(255 * a0)); figure(c, t); c.restore()
        text(c, 'every direction: as if standing like this', W / 2, 140, 48, CREAM, a0, 'xb', 'center')
    for n, (name, back, yy, col, sub) in enumerate((('supine', False, 400, TEAL, 'face up: on your spine'), ('prone', True, 800, CORAL, 'face down: nose to the floor'))):
        a = u(t, k, n + 1, 0.6)
        if a <= 0.01:
            continue
        p = Bd.Person(); p.back = back
        c.save(); c.translate(1600, yy); c.rotate(-90); c.saveLayerAlpha(None, int(255 * a))
        p.draw(c, 0, 0, 0.8, t)
        c.restore(); c.restore()
        text(c, name, 200, yy - 10, 80, col, a, 'xb', 'left')
        text(c, sub, 200, yy + 50, 38, CREAM, a, 'semi', 'left')
    if t > cue(k, 3):
        pill(c, 'how he is lying, not what directions mean', W / 2, 1010, AMBER, 34, u(t, k, 3))


def a5(c, t):
    k = 'a5'
    K.calm_bg(c, t)
    p = Bd.Person(); p.draw(c, W / 2 - 200, 1020, 1.1, t)
    a1_ = u(t, k, 1)
    label(c, 'his RIGHT', 220, 560, CORAL, 52, a1_, dot=(W / 2 - 200 - 1.1 * 120, 1020 - 1.1 * 300))
    label(c, 'his LEFT', 1080, 560, TEAL, 52, a1_, dot=(W / 2 - 200 + 1.1 * 120, 1020 - 1.1 * 300))
    a2_ = u(t, k, 2)
    # you, facing him
    if a2_ > 0.01:
        you = Bd.Person(shirt=(120, 110, 200), shirt_sh=(90, 80, 160), hair=(60, 40, 30)); you.back = True
        c.saveLayerAlpha(None, int(255 * a2_)); you.draw(c, 1560, 1060, 0.62, t); c.restore()
        pill(c, 'YOU, facing him', 1560, 560, CREAM, 32, a2_)
    pill(c, 'his right is on your left', 1560, 1010, YELLOW, 34, a2_)
    a3_ = u(t, k, 3)
    pill(c, 'front view diagram: his right is on the left of the page', W / 2, 90, AMBER, 34, a3_)


def a6q(c, t):
    k = 'a6q'
    PR.er_scene(c, t, doctor=u(t, k, 1, 0.8))
    practice_tag(c, t, cue(k))
    a = u(t, k, 2)
    pill(c, "cut: his LEFT forearm. Doctor's left or right?", W / 2 + 120, 990, AMBER, 38, a)
    K.vignette(c)


def a6q_pause(c, t):
    a6q(c, t)


def a6a(c, t):
    k = 'a6a'
    cy = PR.er_scene(c, t, doctor=1)
    answer_tag(c, t, cue(k))
    a = u(t, k)
    bp_ = cy.bandage_pt
    glow(c, bp_[0], bp_[1], 70, AMBER, a)
    arrow(c, (1080, 420), (bp_[0] + 30, bp_[1] - 20), AMBER, 10, a, a, bend=0.25)
    pill(c, "the doctor's RIGHT", 1180, 380, GREEN, 44, a)
    pill(c, "left means the patient's own left", W / 2, 1000, AMBER, 38, u(t, k, 1))
    K.vignette(c)


# ---------------------------------------------------------------- up and down, front and back
def u2(c, t):
    k = 'u2'
    K.calm_bg(c, t)
    X, Y, S_ = 760, 1020, 1.18
    p = Bd.Person(); p.draw(c, X, Y, S_, t)
    a0 = u(t, k)
    arrow(c, (1200, 560), (1200, 140), CORAL, 10, a0, a0); text(c, 'SUPERIOR', 1240, 170, 52, CORAL, a0, 'xb')
    text(c, 'toward the head', 1240, 220, 34, CREAM, a0, 'semi')
    arrow(c, (1200, 600), (1200, 1000), BLUE, 10, a0, a0); text(c, 'INFERIOR', 1240, 980, 52, BLUE, a0, 'xb')
    text(c, 'toward the feet', 1240, 1030, 34, CREAM, a0, 'semi')
    a1_ = u(t, k, 1)
    nose = (X, Y - S_ * 618); mouth = (X, Y - S_ * 605)
    glow(c, *nose, 30, AMBER, a1_); glow(c, mouth[0], mouth[1] + 8, 26, BLUE, a1_)
    text(c, 'nose is superior to the mouth', 1240, 400, 40, CREAM, a1_, 'semi')
    a2_ = u(t, k, 2)
    glow(c, X - S_ * 34, Y - S_ * 141, 50, BLUE, a2_); glow(c, X - S_ * 50, Y - S_ * 340, 50, CORAL, a2_)
    text(c, 'knees are inferior to the hips', 1240, 760, 40, CREAM, a2_, 'semi')


def u3(c, t):
    k = 'u3'
    K.calm_bg(c, t)
    lm = PR.profile(c, 760, 1030, 1.25, t, inside=u(t, k, 1, 0.6))
    a0 = u(t, k)
    arrow(c, (900, 300), (1300, 300), CORAL, 10, a0, a0); text(c, 'ANTERIOR', 1320, 318, 52, CORAL, a0, 'xb'); text(c, 'toward the front', 1320, 368, 34, CREAM, a0, 'semi')
    arrow(c, (620, 300), (220, 300), BLUE, 10, a0, a0); text(c, 'POSTERIOR', 200, 250, 52, BLUE, a0, 'xb', 'left'); text(c, 'toward the back', 200, 380, 34, CREAM, a0, 'semi')
    a1_ = u(t, k, 1)
    label(c, 'breastbone (anterior)', 1150, 560, CREAM, 36, a1_, dot=lm['breastbone'])
    label(c, 'heart', 1150, 660, CORAL, 36, a1_, dot=lm['heart'])
    label(c, 'backbone (posterior)', 140, 660, CREAM, 36, a1_, dot=lm['backbone'], align='left')


def lying_profile(c, t, nose_glow=0.0):
    """our cyclist lying supine on the stretcher, side view, head on the left, nose to the ceiling"""
    PR.er_bg(c, t)
    PR.stretcher(c, 960, 720, 1100)
    X, Y, s_ = 1420, 692, 1.0
    c.save(); c.translate(X, Y); c.rotate(-90)
    lm = PR.profile(c, 0, 0, s_, t, shirt=PR.TEALJ, shirt_sh=PR.TEALJ_SH)
    c.restore()
    w = {k: (X + v[1], Y - v[0]) for k, v in lm.items()}     # local (x, y) -> world (X + y, Y - x)
    glow(c, *w['nose'], 40, AMBER, nose_glow)
    glow(c, *w['ear'], 34, TEAL, nose_glow)
    return w


def q2q(c, t):
    k = 'q2q'
    lm = lying_profile(c, t, u(t, k, 2)); nose = lm['nose']
    practice_tag(c, t, cue(k), 'QUICK CHECK')
    pill(c, 'SUPINE', 960, 200, TEAL, 46, u(t, k, 1), kind='xb')
    arrow(c, (nose[0], nose[1] - 30), (nose[0], nose[1] - 230), AMBER, 8, u(t, k, 1), u(t, k, 1))
    pill(c, 'is his nose still anterior to his ears?', 960, 1000, YELLOW, 42, u(t, k, 2))
    K.vignette(c)


def q2a(c, t):
    k = 'q2a'
    lm = lying_profile(c, t, 1.0); nose = lm['nose']
    label(c, 'nose', nose[0] + 120, nose[1] - 150, AMBER, 38, u(t, k, 1), dot=nose)
    label(c, 'ear', lm['ear'][0] - 200, lm['ear'][1] + 200, TEAL, 38, u(t, k, 1), dot=lm['ear'])
    answer_tag(c, t, cue(k))
    pill(c, 'Yes', 960, 220, GREEN, 80, u(t, k), kind='xb')
    pill(c, 'describe it as if standing: the nose stays anterior', 960, 1000, AMBER, 38, u(t, k, 1))
    K.vignette(c)


# ---------------------------------------------------------------- middle, side, near and far
def m1(c, t):
    k = 'm1'
    K.calm_bg(c, t)
    z = 1 + 1.6 * u(t, k, 2, 1.2, -0.4)          # push in on the face
    FY = 1020 - 1.18 * 625; m_ = min(1, (z - 1) / 1.6); cy_ = 520 + (FY - 520) * m_
    c.save(); c.translate(W / 2, 520); c.scale(z, z); c.translate(-W / 2, -cy_)
    X, Y, S_ = W / 2, 1020, 1.18
    p = Bd.Person(); p.draw(c, X, Y, S_, t)
    a0 = u(t, k)
    dl = skia.Path(); dl.moveTo(X, 100); dl.lineTo(X, 1060)
    c.drawPath(dl, skia.Paint(AntiAlias=True, Color=C(YELLOW, 220 * a0), Style=skia.Paint.kStroke_Style, StrokeWidth=4 / z,
                              PathEffect=skia.DashPathEffect.Make([18 / z, 12 / z], 0)))
    c.restore()
    text(c, 'midline', W / 2 + 20, 110, 40, YELLOW, a0, 'xb')
    a1_, a2_ = u(t, k, 1), u(t, k, 2)
    arrow(c, (W / 2 - 420, 230), (W / 2 - 40, 230), TEAL, 9, a1_, a1_); pill(c, 'MEDIAL: toward the midline', W / 2 - 520, 160, TEAL, 34, a1_)
    arrow(c, (W / 2 + 40, 300), (W / 2 + 420, 300), CORAL, 9, a2_, a2_); pill(c, 'LATERAL: away from it', W / 2 + 520, 370, CORAL, 34, a2_)
    a3_ = u(t, k, 3)
    if a3_ > 0.01:
        fy = 520 + (FY - cy_) * z
        for dx, col in ((0, TEAL), (-1.18 * 14 * z, AMBER), (1.18 * 14 * z, AMBER), (-1.18 * 40 * z, CORAL), (1.18 * 40 * z, CORAL)):
            glow(c, W / 2 + dx, fy, 24 * z / 2, col, a3_)
        pill(c, 'nose medial to the eyes; ears lateral to them', W / 2, 1000, AMBER, 38, a3_)


def m2(c, t):
    k = 'm2'
    park_bg_dim(c, t, 0.85)
    g = PR.arm_closeup(c, t, lift=0, cut=0)
    wr = g['wr']
    a1_, a2_ = u(t, k, 1), u(t, k, 2)
    label(c, 'thumb = LATERAL', 1300, 900, CORAL, 46, a1_, dot=(wr[0] + 70, wr[1] + 70))
    label(c, 'little finger = medial', 300, 980, TEAL, 46, a2_, dot=(wr[0] - 55, wr[1] + 150))
    a3_ = u(t, k, 3)
    pill(c, 'thumb side of the forearm = lateral side', W / 2, 90, AMBER, 40, a3_)
    arrow(c, (1000, 300), (1300, 300), CORAL, 9, a3_, a3_); pill(c, 'away from the body', 1480, 302, CORAL, 32, a3_)
    K.vignette(c)


def m3(c, t):
    k = 'm3'
    K.calm_bg(c, t)
    X, Y, S_ = 760, 1030, 1.15
    raise_ = u(t, k, 4, 1.2)
    p = Bd.Person(); p.arm = {1: [14 + 160 * raise_, 4, 1.0], -1: [14, 4, 1.0]}
    p.draw(c, X, Y, S_, t)
    sh, el, wr, _ = p.joints(1)
    w = lambda q: (X + q[0] * S_, Y + q[1] * S_)
    a0 = u(t, k)
    label(c, 'PROXIMAL: closer to the trunk', 1150, 220, TEAL, 40, a0, dot=w(sh + (el - sh) * 0.3))
    label(c, 'DISTAL: farther from the trunk', 1150, 300, CORAL, 40, a0, dot=w(wr))
    a1_ = u(t, k, 1); a2_ = u(t, k, 2)
    if a1_ > 0.01:
        glow(c, *w(el), 34, TEAL, a1_ * (1 - raise_)); glow(c, *w(wr), 34, CORAL, a1_)
        text(c, 'elbow is proximal to the wrist', 1150, 470, 38, CREAM, a1_, 'semi')
    if a2_ > 0.01:
        glow(c, X - S_ * 36, Y - S_ * 2, 40, CORAL, a2_); glow(c, X - S_ * 36, Y - S_ * 30, 30, TEAL, a2_)
        text(c, 'toes are distal to the ankle', 1150, 540, 38, CREAM, a2_, 'semi')
    a3_ = u(t, k, 3)
    pill(c, 'on a limb, use these, not superior and inferior', 1350, 700, AMBER, 32, a3_)
    if raise_ > 0.3:
        glow(c, *w(wr), 40, CORAL, raise_)
        text(c, 'hand higher in the room, still DISTAL', 1350, 860, 40, YELLOW, raise_, 'xb', 'center')


def m4(c, t):
    k = 'm4'
    lift = u(t, k, 3, 1.4, -0.6) * (1 - u(t, k, 4, 1.0, 0.2))
    park_bg_dim(c, t, 0.2)
    g = PR.arm_closeup(c, t, lift=lift)
    cutp = g['cut']
    a1_ = u(t, k, 1)
    pill(c, 'lateral side of the left forearm, just proximal to the wrist', W / 2, 90, AMBER, 36, a1_)
    a2_ = u(t, k, 2)
    label(c, 'lateral = thumb side', 1320, 560, CORAL, 42, a2_, dot=(cutp[0] + 10, cutp[1]))
    label(c, 'left = his own left', 1320, 640, TEAL, 42, a2_)
    a3_ = u(t, k, 3)
    toward_el = g['el'] - g['wr']; toward_el = toward_el / np.linalg.norm(toward_el)
    arrow(c, cutp + toward_el * 30 + np.array([90, 0]), cutp + toward_el * 220 + np.array([90, 0]), YELLOW, 10, a3_, a3_)
    label(c, 'proximal: toward the elbow', 1320, 760, YELLOW, 42, a3_)
    K.vignette(c)


def lying_top(c, t, raise_=1.0):
    """seen from above: lying on his back on a mat, head to the right, the right arm swinging up over his head"""
    K.calm_bg(c, t)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(300, 360, 1640, 720), 30, 30), P((70, 76, 120)))
    p = PR.person('cyclist'); p.arm = {1: [14 + 166 * raise_, 2, 1.0], -1: [14, 4, 1.0]}
    c.save(); c.translate(480, 540); c.rotate(90)
    p.mode = 'stand'
    p.draw(c, 0, 0, 1.0, t)
    c.restore()
    return p


def p2q(c, t):
    k = 'p2q'
    p = lying_top(c, t, u(t, k, 1, 1.2))
    practice_tag(c, t, cue(k))
    text(c, 'lying on his back, arm stretched over his head', W / 2, 220, 42, CREAM, u(t, k, 1), 'xb', 'center')
    hand(c, 'hand: superior to the elbow, or distal?', W / 2, 900, 64, YELLOW, u(t, k, 2, 1.2), 'center')


def p2a(c, t):
    k = 'p2a'
    p = lying_top(c, t, 1.0)
    answer_tag(c, t, cue(k))
    text(c, 'DISTAL', W / 2, 250, 110, GREEN, u(t, k), 'xb', 'center')
    text(c, 'proximal and distal follow the limb', W / 2, 880, 44, CREAM, u(t, k, 1), 'xb', 'center')
    text(c, 'superior would be wrong: standing, the hand is below the elbow', W / 2, 960, 36, CORAL, u(t, k, 2), 'semi', 'center')


# ---------------------------------------------------------------- depth and sides
def s1(c, t):
    k = 's1'
    K.calm_bg(c, t)
    us = [u(t, k, 1, 0.5), u(t, k, 2, 0.5), u(t, k, 3, 0.5), u(t, k, 4, 0.5)]
    PR.layers(c, 700, 560, 360, us)
    for i, (nm, y) in enumerate((('skin', 230), ('fat', 330), ('muscle', 440), ('bone', 560))):
        label(c, nm, 1200, y, CREAM, 40, us[i], dot=(700 + [345, 300, 200, 60][i] * 0.7, 560 - [345, 300, 200, 60][i] * 0.7))
    a0 = u(t, k)
    arrow(c, (1600, 620), (1600, 230), CORAL, 9, a0, a0); text(c, 'SUPERFICIAL', 1640, 250, 40, CORAL, a0, 'xb')
    text(c, 'DEEP', 1640, 620, 40, BLUE, a0, 'xb')
    a5 = u(t, k, 5, 0.8)
    if a5 > 0.01:
        arrow(c, (700, 60), (700, 560 - 360 * 0.4), (230, 40, 50), 12, a5, a5)
        text(c, 'stab wound deep to the muscle: through skin, fat, muscle', W / 2, 1010, 38, CREAM, a5, 'xb', 'center')


def s1b(c, t):
    k = 's1b'
    K.calm_bg(c, t)
    a = u(t, k)
    PR.layers(c, 700, 560, 340, [a, a, a, a], wound_depth=u(t, k, 2, 1.0))
    text(c, 'his forearm cut, in cross section', 700, 140, 44, CREAM, a, 'xb', 'center')
    a2_ = u(t, k, 2)
    label(c, 'through skin and fat', 1180, 330, CORAL, 42, a2_, dot=(700, 560 - 300))
    label(c, 'muscle not cut', 1180, 460, GREEN, 42, a2_, dot=(700 + 120, 560 - 140))
    pill(c, 'the wound is SUPERFICIAL to the muscle', 1350, 760, AMBER, 40, u(t, k, 2, 0.5, -2.0))


def s2(c, t):
    k = 's2'
    K.calm_bg(c, t)
    a1_, a2_ = u(t, k, 1), u(t, k, 2)
    p = Bd.Person(); p.highlight = {}
    X, Y, S_ = 480, 1030, 0.95
    p.draw(c, X, Y, S_, t)
    if a1_ > 0.01 and a2_ < 0.5:
        glow(c, X - S_ * 120, Y - S_ * 420, 90, TEAL, a1_); glow(c, X - S_ * 36, Y - S_ * 150, 90, TEAL, a1_)
        text(c, 'IPSILATERAL: same side', X, 140, 46, TEAL, a1_, 'xb', 'center')
    if a2_ > 0.01:
        glow(c, X - S_ * 120, Y - S_ * 420, 90, CORAL, a2_); glow(c, X + S_ * 36, Y - S_ * 150, 90, CORAL, a2_)
        text(c, 'CONTRALATERAL: opposite sides', X, 140, 46, CORAL, a2_, 'xb', 'center')
    a3_ = u(t, k, 3)
    PR.brain_body(c, 1380, 300, 0.95, a3_, cross=u(t, k, 3, 1.2, -0.3), right_glow=u(t, k, 4), left_weak=u(t, k, 4, 0.8, -0.8), t=t)
    text(c, "patient's right", 1240, 100, 30, CREAM, a3_, 'semi', 'center'); text(c, "patient's left", 1520, 100, 30, CREAM, a3_, 'semi', 'center')


def p3q(c, t):
    k = 'p3q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    PR.brain_body(c, W / 2, 290, 0.95, u(t, k), left_weak=u(t, k, 1, 0.8))
    hand(c, 'left arm and left leg weak', 380, 560, 56, CORAL, u(t, k, 1, 1.0), 'center')
    hand(c, 'which side of the brain?', W / 2, 1000, 64, YELLOW, u(t, k, 2, 1.0), 'center')


def p3a(c, t):
    k = 'p3a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    PR.brain_body(c, W / 2, 290, 0.95, 1, cross=u(t, k, 1, 1.4), right_glow=u(t, k), left_weak=1)
    text(c, 'the RIGHT side', 380, 300, 70, GREEN, u(t, k), 'xb', 'center')
    text(c, 'pathways cross the midline', 1560, 700, 40, CREAM, u(t, k, 1), 'xb', 'center')
    text(c, 'contralateral to the weakness', 1560, 760, 40, AMBER, u(t, k, 1), 'xb', 'center')


# ---------------------------------------------------------------- recap and the end
def rc(c, t):
    k = 'rc'
    K.calm_bg(c, t)
    a1_ = u(t, k, 1)
    for i, (p, col) in enumerate((('suffix', SUFFIX), ('prefix', PREFIX), ('root', ROOT))):
        aa = sm((t - cue(k, 1) - i * 0.4) / 0.4)
        chip(c, p, 130, 200 + i * 130, col, 52, aa)
        c.drawCircle(84, 245 + i * 130, 22, P(AMBER, 255 * aa)); text(c, str(i + 1), 84, 255 + i * 130, 26, NAVY, aa, 'xb', 'center')
    X, Y, S_ = 1420, 1040, 1.05
    a2_ = u(t, k, 2)
    c.saveLayerAlpha(None, int(255 * max(a2_, 0.15)))
    p = Bd.Person(); p.draw(c, X, Y, S_, t)
    c.restore()
    if a2_ > 0.01:
        text(c, 'anatomical position, palms forward, his own right and left', 120, 640, 32, CREAM, a2_, 'semi')
    a3_ = u(t, k, 3)
    arrow(c, (1780, 520), (1780, 160), CORAL, 8, a3_, a3_); text(c, 'superior', 1770, 130, 34, CORAL, a3_, 'xb', 'center')
    arrow(c, (1780, 560), (1780, 960), BLUE, 8, a3_, a3_); text(c, 'inferior', 1770, 1010, 34, BLUE, a3_, 'xb', 'center')
    text(c, 'anterior / posterior: front to back', 120, 720, 32, CREAM, a3_, 'semi')
    a4_ = u(t, k, 4)
    arrow(c, (X + 20, 600), (X + 230, 600), TEAL, 8, a4_, a4_); text(c, 'lateral', X + 250, 612, 32, TEAL, a4_, 'xb', 'left')
    sh, el, wr, _ = p.joints(1)
    arrow(c, (X + sh[0] * S_ - 30, Y + sh[1] * S_ + 40), (X + wr[0] * S_ - 30, Y + wr[1] * S_), AMBER, 8, a4_, a4_)
    text(c, 'proximal to distal', X + wr[0] * S_ - 70, Y + wr[1] * S_ + 20, 32, AMBER, a4_, 'xb', 'right')
    a5_ = u(t, k, 5)
    text(c, 'superficial / deep: surface inward', 120, 800, 32, CREAM, a5_, 'semi')
    text(c, 'ipsi = same side, contra = opposite', 120, 880, 32, CREAM, a5_, 'semi')


def end(c, t):
    k = 'end'
    if t < cue(k, 2) - 0.2:
        PK.background(c, t, warm=0.8)
        PK.ambulance(c, t, lights=0)
        c.drawRect(skia.Rect(0, 0, W, H), P((255, 150, 80), 20))
        x = 760 + 40 * (t - cue(k))
        p = PR.person('cyclist'); p.arm = {1: [10, 4, 0.2], -1: [24, 30, 0.6]}
        p.shoe = (40, 46, 50); sw = math.sin((t - cue(k)) * 5.0); p.leg = {1: 10 * sw, -1: -10 * sw}
        p.draw(c, x, 900, 0.62, t)
        sh, el, wr, _ = p.joints(-1)
        bx, by = x + (el[0] + (wr[0] - el[0]) * 0.6) * 0.62, 900 + (el[1] + (wr[1] - el[1]) * 0.6) * 0.62
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx - 12, by - 14, bx + 12, by + 14), 4, 4), P((250, 250, 248)))
        K.vignette(c)
    else:
        K.calm_bg(c, t)
        a = u(t, k, 2)
        text(c, 'A&P talks about the body the same way, every time', W / 2, 200, 44, CREAM, a, 'xb', 'center')
        a3 = u(t, k, 3)
        text(c, 'Free notes and practice', W / 2, 300, 40, INK2, a3, 'semi', 'center')
        text(c, 'levlprep.com', W / 2, 390, 84, K.COURSE, a3, 'xb', 'center')
        # the lower two thirds stay calm for YouTube's end screen elements


SCENES = dict(hook=hook, promise=promise, why=why, w0=w0, w1=w1, w2=w2, w3=w3, r1q=r1q, r1a=r1a, x1=x1, x2=x2, x3=x3, x4=x4,
              x5=x5, p1q=p1q, p1a=p1a, d1=d1, d2=d2, q1q=q1q, q1a=q1a, a1=a1, a2=a2, a4=a4, a5=a5, a6q=a6q, a6a=a6a,
              u2=u2, u3=u3, q2q=q2q, q2a=q2a, m1=m1, m2=m2, m3=m3, m4=m4, p2q=p2q, p2a=p2a, s1=s1, s1b=s1b, s2=s2,
              p3q=p3q, p3a=p3a, rc=rc, end=end)
