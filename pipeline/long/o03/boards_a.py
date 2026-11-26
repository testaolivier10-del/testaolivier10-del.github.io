"""Teaching boards, part A (promise, why, and chapter 'Why carbon makes four bonds': c1 to c6) of yt-orgo-03.
The one navy board, never zooms. Everything appears on its word. Colour story from orb.py: s red, p white, hybrids pink."""
import math
import skia
import kit as K
import orb as O
from kit import P, SP, sm, W, H, text, pill, chip, arrow, label, AMBER, CORAL, TEAL, YELLOW, GREEN, CREAM, INK2, NAVY, BLUE, LILAC
from base import Bt, cue, fin, ua, lightbar, board, check, cross, title, ww, cues, tx, hw, panel, tag, pulse

PI = math.pi


def myaw(t):
    """a gentle rocking view of a tetrahedral model in which all four outer atoms always show"""
    return -PI / 2 + 0.33 * math.sin(0.5 * t)


def lerp(a, b, u): return a + (b - a) * u


def ring(c, x, y, r, a=1.0, col=AMBER, w=6):
    if a > 0.01: c.drawCircle(x, y, r, SP(col, w, 255 * a)); c.drawCircle(x, y, r, P(col, 26 * a))


def boxes(c, x, y, a=1.0, s_up=1.0, s_dn=1.0, p=(1.0, 1.0, 0.0), size=100, glow=(), labels=1.0, energy=True):
    """carbon's outer orbitals as boxes: 2s low at (x, y + 200), the three 2p boxes higher starting at (x + 240, y)"""
    if a <= 0.01: return
    sx, sy = x, y + 200; px = [x + 240 + i * (size + 14) for i in range(3)]
    if energy:
        arrow(c, (x - 130, sy + 60), (x - 130, y - 70), INK2, 5, 1.0, a * 0.9, 0.0, 20)
        text(c, 'energy', x - 130, y - 96, 50, INK2, a, 'semi', 'center')
    for g in glow:
        gx, gy = (sx, sy) if g == 's' else (px[g], y)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(gx - size * 0.62, gy - size * 0.62, gx + size * 0.62, gy + size * 0.62), 16, 16), P(AMBER, 70 * a, MaskFilter=K.blur(12)))
    n = 2 if s_dn > 0.01 else 1
    if n == 2: O.box(c, sx, sy, 2, a, size, up=s_up, dn=s_dn)
    else: O.box(c, sx, sy, 1 if s_up > 0.01 else 0, a, size, up=s_up)
    for i in range(3): O.box(c, px[i], y, 1 if p[i] > 0.01 else 0, a, size, up=p[i])
    text(c, '2s', sx, sy + size * 0.5 + 60, 58, O.S_COL, a * labels, 'xb', 'center')
    text(c, '2p', px[1], y + size * 0.5 + 60, 58, O.P_COL, a * labels, 'xb', 'center')
    return (sx, sy), [(q, y) for q in px]


# ------------------------------------------------------------------ promise
MOL = dict(C1=(400, 450), C2=(620, 330), C3=(840, 450), C4=(1060, 330), N=(1280, 210))


def molecule(c, a, u=1.0):
    m = MOL
    hs = [('C1', (-140, -30)), ('C1', (-90, 120)), ('C1', (-40, -140)), ('C2', (0, -145)), ('C3', (0, 145))]
    for k, (dx, dy) in hs:
        O.bond(c, m[k], (m[k][0] + dx, m[k][1] + dy), a, u, 8)
    O.bond(c, m['C1'], m['C2'], a, u); O.bond(c, m['C2'], m['C3'], a, u, n=2, gap=18); O.bond(c, m['C3'], m['C4'], a, u); O.bond(c, m['C4'], m['N'], a, u, 8, n=3, gap=15)
    for k, (dx, dy) in hs: O.atom(c, m[k][0] + dx, m[k][1] + dy, 'H', 32, a)
    for k in ('C1', 'C2', 'C3', 'C4'): O.atom(c, *m[k], 'C', 50, a)
    O.atom(c, *m['N'], 'N', 50, a)


def promise(c, t):
    k = 'promise'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'the goal', t, t0 - 1, 120, CREAM, 58)
    molecule(c, ua(t, t0 + 0.2, 0.5), ua(t, t0 + 0.2, 0.8))
    th = ww(k, 'hybridization') + 0.15; ti = ww(k, 'in', 1) + 0.1
    stamps = (('C1', 'sp3', ww(k, 'name') - 0.1, (560, 540)), ('C2', 'sp2', th, (770, 270)), ('C3', 'sp2', th + 0.25, (990, 550)), ('C4', 'sp', ti, (1070, 210)), ('N', 'sp', ti + 0.25, (1440, 220)))
    for i, (at, kind, ts, cp) in enumerate(stamps):
        te = stamps[i + 1][2] if i < 4 else ts + 1.3
        ring(c, *MOL[at], 70, ua(t, ts - 0.35, 0.25) * (1 - ua(t, te - 0.3, 0.3)))
        u = ua(t, ts, 0.3)
        if u > 0: O.hyb_chip(c, kind, cp[0], cp[1], 70, u, 0.8 + 0.2 * u + 0.12 * pulse(t, ts, 0.4))
    hw(c, 'in a few seconds', 1520, 440, 64, AMBER, t, ww(k, 'few') - 0.1, 0.7, 'center')
    rows = (('why carbon makes 4 bonds', c1, TEAL), ('where double and triple bonds come from', c2, AMBER), ('pencil vs diamond', c3, CORAL))
    for i, (s, cc, col) in enumerate(rows):
        u = ua(t, cc - 0.1, 0.35)
        if u > 0: chip(c, s, 160, 700 + i * 125, col, 58, u, 0.9 + 0.1 * u)


# ------------------------------------------------------------------ why
def why(c, t):
    k = 'why'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'why this one label matters', t, t0 - 1, 120, CREAM, 58)
    u = ua(t, t0 + 0.15, 0.4); tl_ = ww(k, 'hybridization', 0, c1) - 0.1
    if u > 0: O.hyb_chip(c, 'sp3', 200, 540, 110, u, 0.85 + 0.15 * u + 0.1 * pulse(t, tl_, 0.5))
    tp = ww(k, 'which') - 0.1
    arrow(c, (320, 500), (430, 500), AMBER, 8, ua(t, tp - 0.3, 0.4))
    a1 = max(0.28 * u, ua(t, tp, 0.5))
    if a1 > 0:
        yaw = -PI / 2 + 0.3 + 0.12 * math.sin(0.5 * t)          # a fixed tetrahedral view: all four lobes read, one toward the viewer
        O.tetra(c, 640, 480, 200, yaw, a1, (1.0,) * 4)
        ta = ww(k, 'angles') - 0.1; ua_ = ua(t, ta, 0.5)
        if ua_ > 0:
            dx, dy, _ = O.proj(O.TET[2], yaw, 0.3, 200); an = math.atan2(dy, dx)
            d = (an + PI / 2 + PI) % (2 * PI) - PI
            O.arc(c, 640, 480, 110, -PI / 2, -PI / 2 + d, 1.0, ua_, AMBER, 6)
    tx(c, 'which way the bonds point', 560, 790, 52, CREAM, t, tp + 0.2, 'semi', 'center')
    tx(c, 'and the angles between them', 560, 858, 52, AMBER, t, ww(k, 'angles') - 0.1, 'semi', 'center')
    # double or triple bond?
    td = ww(k, 'double') - 0.2; tt = ww(k, 'triple') - 0.2
    panel(c, 1030, 290, 1830, 850, max(0.35 * u, ua(t, c2 - 0.1, 0.4)))
    for y_, n_, ts, s in ((500, 2, td, 'a double bond?'), (700, 3, tt, 'a triple bond?')):
        a_ = max(0.25 * u, ua(t, ts, 0.35))
        O.bond(c, (1130, y_), (1300, y_), a_, 1.0, 9, n=n_, gap=17)
        O.atom(c, 1110, y_, 'C', 40, a_); O.atom(c, 1320, y_, 'C', 40, a_)
        tx(c, s, 1400, y_ + 18, 52, CREAM, t, ts + 0.1, 'semi')
    tx(c, 'can this atom make...', 1430, 384, 50, INK2, t, c2 + 0.5, 'semi', 'center')
    # every chapter from here on
    tabs = ('acids and bases', 'resonance', 'alkenes', 'reactions', 'aromatics')
    tc = ww(k, 'almost') - 0.3; x = 130
    for i, s in enumerate(tabs):
        a_ = ua(t, tc + i * 0.3, 0.35); wd = K.width(s, 46, 'bold') + 44
        pill(c, s, x + wd / 2, 980, O.SP3 if a_ > 0.99 else INK2, 46, max(0.25 * u, a_))
        x += wd + 26
    tx(c, '...', x + 10, 984, 54, INK2, t, tc + 1.5, 'xb')


# ------------------------------------------------------------------ c1
def c1(c, t):
    k = 'c1'; t0, q1, q2, q3 = cues(k, 3)
    board(c, t)
    title(c, 'the problem from last time', t, t0 - 1, 120, CREAM, 58)
    a1 = ua(t, t0 + 0.2, 0.5)
    if a1 > 0:
        cx, cy = 430, 540; R = 235
        c.drawCircle(cx, cy, R, SP(INK2, 3.5, 120 * a1))
        O.atom(c, cx, cy, 'C', 100, a1)
        te = ww(k, 'four') - 0.2
        for i in range(4):
            an = 0.25 * t + i * PI / 2; ae = ua(t, te + i * 0.12, 0.3)
            if ae > 0: c.drawCircle(cx + R * math.cos(an), cy + R * math.sin(an), 21, P(NAVY, 255 * ae)); c.drawCircle(cx + R * math.cos(an), cy + R * math.sin(an), 16, P(AMBER, 255 * ae))
        tx(c, 'outer shell: 4 electrons', cx, 870, 50, CREAM, t, te, 'semi', 'center')
    a2 = max(0.3 * a1, ua(t, q2 - 0.3, 0.5))
    tp = ww(k, 'pair') - 0.1; t2 = ww(k, 'two', 1) - 0.1
    g_a = ua(t, ww(k, 'unpaired', 1) - 0.1, 0.4); size = 132; bx, by = 1010, 400
    if a2 > 0:
        pos = boxes(c, bx, by, a2, ua(t, tp, 0.3), ua(t, tp + 0.2, 0.3), (ua(t, t2, 0.3), ua(t, t2 + 0.25, 0.3), 0.0), size)
        if g_a > 0:
            for i in (0, 1):
                gx, gy = pos[1][i]; pu = 1 + 0.07 * math.sin(t * 3); h_ = size * 0.6 * pu
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(gx - h_, gy - h_, gx + h_, gy + h_), 16, 16), SP(AMBER, 6, 255 * g_a))
    tx(c, '2 unpaired electrons', bx + 240 + 0.5 * (size + 14), 270, 48, AMBER, t, ww(k, 'unpaired', 1) - 0.1, 'semi', 'center')
    hw(c, 'so just 2 bonds?', 1330, 950, 124, AMBER, t, ww(k, 'two', 2) - 0.5, 0.9, 'center')


# ------------------------------------------------------------------ c2
def c2(c, t):
    k = 'c2'; t0, q1, q2, q3 = cues(k, 3)
    board(c, t)
    title(c, 'but look at methane', t, t0 - 1, 120, CREAM, 58)
    am = ua(t, t0 + 0.2, 0.6)
    if am > 0: O.ball_stick(c, 490, 440, 250, myaw(t), O.TET, 'C', 'H', am, am, r_c=68, r_o=46, w=13)
    tx(c, '1 carbon, 4 hydrogens', 490, 770, 52, CREAM, t, ww(k, 'one') - 0.1, 'semi', 'center')
    tx(c, '4 identical bonds', 490, 836, 50, AMBER, t, ww(k, 'identical') - 0.3, 'xb', 'center')
    # the wedge and dash drawing
    td = ww(k, 'drawing') - 0.4; ad = ua(t, td, 0.5); cx, cy = 1420, 450
    ptop, pleft, pw, pd = (cx, cy - 215), (cx - 203, cy + 72), (cx + 60, cy + 210), (cx + 225, cy + 70)
    if ad > 0:
        panel(c, 1000, 180, 1830, 830, ad)
        ud = ua(t, td + 0.1, 0.6)
        O.bond(c, (cx, cy), ptop, ad, ud, 10); O.bond(c, (cx, cy), pleft, ad, ud, 10)
        tw = ww(k, 'solid') - 0.15; ts = ww(k, 'striped') - 0.15
        gw = pulse(t, tw, 1.6); gs = pulse(t, ts, 1.6)
        O.wedge(c, (cx, cy), pw, ad, ud, 34, O.mix(O.BOND, AMBER, gw)); O.dash(c, (cx, cy), pd, ad, ud, 34, O.mix(O.BOND, AMBER, gs), 8)
        for p_ in (ptop, pleft, pw, pd): O.atom(c, p_[0], p_[1], 'H', 40, ad * ud)
        O.atom(c, cx, cy, 'C', 56, ad)
        tx(c, 'toward you', pw[0] + 10, pw[1] + 108, 52, CREAM, t, ww(k, 'toward') - 0.2, 'semi', 'center')
        tx(c, 'away', pd[0] + 20, pd[1] + 104, 52, CREAM, t, ww(k, 'away') - 0.3, 'semi', 'center')
        # the angle
        t9 = ww(k, 'one', 0, q2) - 0.1
        a0 = math.atan2(pleft[1] - cy, pleft[0] - cx); a1_ = -PI / 2 + 2 * PI
        O.arc(c, cx, cy, 110, a0, a1_, ad, ua(t, q2 + 0.4, 0.8), AMBER, 6)
        hw(c, '109.5°', 1040, 350, 92, AMBER, t, t9, 1.0)
    hw(c, 'where did the 2 extra bonds come from?', 960, 940, 64, CREAM, t, ww(k, 'where') - 0.1, 1.2, 'center')
    hw(c, 'why do all 4 match?', 960, 1022, 64, YELLOW, t, ww(k, 'why') - 0.1, 0.8, 'center')


# ------------------------------------------------------------------ c3
def bez(p0, p1, p2, u):
    return ((1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1])


def c3(c, t):
    k = 'c3'; t0, q1, q2, q3 = cues(k, 3)
    board(c, t)
    title(c, 'step 1: promotion', t, t0 - 1, 120, CREAM, 58)
    tm0 = ww(k, 'leaves') - 0.2; tm1 = ww(k, 'orbital', 1) + 0.6; m = sm((t - tm0) / (tm1 - tm0)); size = 130
    x0, y0 = 300, 400
    arrived = 1.0 if m >= 1 else 0.0
    gl = ()
    pos = boxes(c, x0, y0, ua(t, t0 - 0.2, 0.4), 1.0, 0.0 if m > 0 else 1.0, (1.0, 1.0, arrived), size)
    if 0 < m < 1:
        s_ = (x0 + size * 0.16, y0 + 200); e_ = (x0 + 240 + 2 * (size + 14), y0)
        px, py = bez(s_, (e_[0] + 70, s_[1] + 30), e_, m); fl = sm((m - 0.3) / 0.4)
        c.drawCircle(px, py, 46, P(AMBER, 50, MaskFilter=K.blur(14)))
        O.earrow(c, px, py, 1 - fl, size, -1); O.earrow(c, px, py, fl, size, 1)
    if ua(t, tm0, 0.3) > 0 and m < 1:      # the path it takes, drawn faintly
        pass
    tx(c, 'one electron moves up', 560, 830, 52, AMBER, t, ww(k, 'moves') - 0.2, 'semi', 'center')
    t4 = ww(k, 'four', 0, q2) - 0.1; g4 = ua(t, t4, 0.4)
    if g4 > 0:
        pu = 1 + 0.06 * math.sin(t * 3)
        for gx, gy in [(x0, y0 + 200)] + [(x0 + 240 + i * (size + 14), y0) for i in range(3)]:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(gx - size * 0.58 * pu, gy - size * 0.58 * pu, gx + size * 0.58 * pu, gy + size * 0.58 * pu), 16, 16), SP(AMBER, 5, 230 * g4 * (1 - 0.7 * ua(t, q3, 0.5))))
    hw(c, '4 unpaired electrons', 560, 950, 84, AMBER, t, t4, 0.9, 'center')
    # the energy trade
    a3 = ua(t, q3 - 0.2, 0.4)
    if a3 > 0:
        panel(c, 1080, 260, 1820, 1000, a3)
        base_y = 820; c.drawLine(1140, base_y, 1760, base_y, SP(INK2, 4, 255 * a3))
        u1 = ua(t, ww(k, 'costs') - 0.1, 0.6); u2 = ua(t, ww(k, 'give') - 0.1, 1.0)
        if u1 > 0: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1182, base_y - 110 * u1, 1342, base_y), 10, 10), P(CORAL, 255 * a3))
        if u2 > 0: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1520, base_y - 440 * u2, 1680, base_y), 10, 10), P(GREEN, 255 * a3))
        tx(c, 'cost of', 1262, 880, 48, CORAL, t, ww(k, 'costs') - 0.1, 'semi', 'center'); tx(c, 'the move', 1262, 936, 48, CORAL, t, ww(k, 'costs') - 0.1, 'semi', 'center')
        tx(c, 'energy back from', 1592, 880, 46, GREEN, t, ww(k, 'give') - 0.1, 'semi', 'center'); tx(c, '2 more bonds', 1592, 936, 46, GREEN, t, ww(k, 'give') - 0.1, 'semi', 'center')
        check(c, 1450, 340, 1.2, ua(t, ww(k, 'worth') - 0.1, 0.3))
        tx(c, 'worth it', 1500, 358, 52, GREEN, t, ww(k, 'worth') - 0.1, 'xb')


# ------------------------------------------------------------------ c4
AX = [(1, 0, 0), (0, 1, 0), (0, 0, 1)]


def pcross(c, x, y, L, yaw, us, a=1.0, pitch=0.42):
    """three p orbitals at right angles, depth sorted lobe by lobe"""
    lobes = []
    for i, d in enumerate(AX):
        for s_ in (1, -1):
            dx, dy, z = O.proj((d[0] * s_, d[1] * s_, d[2] * s_), yaw, pitch, L); lobes.append((z, dx, dy, us[i]))
    for z, dx, dy, u in sorted(lobes):
        O.lobe(c, x, y, math.hypot(dx, dy), math.atan2(dy, dx), O.mix(O.P_COL, (70, 70, 130), 0.3 * (1 - (z + 1) / 2)), a, L * 0.42, u)
    O.nucleus(c, x, y, a * max(us))


def c4(c, t):
    k = 'c4'; t0, q1, q2, q3 = cues(k, 3)
    board(c, t)
    title(c, "the 4 orbitals aren't alike", t, t0 - 1, 120, CREAM, 58)
    ts = ww(k, 'round') - 0.3; on = ua(t, t0 + 0.1, 0.5)
    O.s_orb(c, 280, 520, 120, O.S_COL, 0.3 + 0.7 * ua(t, ts, 0.5), on)
    tx(c, '1 s orbital: round', 290, 760, 50, O.S_COL, t, ts + 0.2, 'semi', 'center')
    tp = ww(k, 'three') - 0.2
    for i in range(3):                                           # faint from the start, each lit as it is counted
        lit = ua(t, tp + i * 0.35, 0.5)
        if on > 0: pcross(c, 800, 510, 190, 0.6 + 0.22 * t, [on if j == i else 0.0 for j in range(3)], 0.3 + 0.7 * lit)
    O.nucleus(c, 800, 510, on)
    tx(c, '3 p orbitals: dumbbells', 810, 800, 50, O.P_COL, t, ww(k, 'dumbbells') - 0.4, 'semi', 'center')
    tx(c, 'at right angles', 810, 862, 50, INK2, t, ww(k, 'right') - 0.1, 'semi', 'center')
    # used as they are
    a2 = ua(t, q2 - 0.1, 0.4); cx, cy = 1500, 590
    if a2 > 0:
        panel(c, 1160, 250, 1820, 900, a2)
        text(c, 'if used as they are', 1470, 332, 50, INK2, a2, 'semi', 'center')
        t3 = ww(k, 'three', 1) - 0.2; yaw, pitch = 0.62, 0.42
        ends = [O.proj(d, yaw, pitch, 190) for d in ((1, 0, 0), (0, 1, 0), (0, 0, 1))]
        ends = [(dx * 0.9, dy * 0.9, z) for dx, dy, z in ends]
        t4 = ww(k, 'fourth') - 0.2; u4 = ua(t, t4, 0.5)
        if u4 > 0:
            e4 = (cx - 140, cy + 120)
            c.drawLine(cx, cy, cx + (e4[0] - cx) * u4, cy + (e4[1] - cy) * u4, skia.Paint(AntiAlias=True, Color=K.C(O.S_COL, 255), Style=skia.Paint.kStroke_Style, StrokeWidth=10, StrokeCap=skia.Paint.kRound_Cap, PathEffect=skia.DashPathEffect.Make([18, 16], 0)))
            O.atom(c, e4[0], e4[1], 'H', 32, sm(u4 * 2 - 1))
            tx(c, 'a different 4th', cx - 60, cy + 256, 50, O.S_COL, t, t4 + 0.2, 'semi', 'center')
        for i, (dx, dy, z) in enumerate(ends):
            u = ua(t, t3 + i * 0.2, 0.5)
            O.bond(c, (cx, cy), (cx + dx, cy + dy), 1.0, u, 10); O.atom(c, cx + dx * u, cy + dy * u, 'H', 32, sm(u * 2 - 0.6))
        O.atom(c, cx, cy, 'C', 50, a2)
        t9 = ww(k, 'ninety') - 0.1
        a0 = math.atan2(ends[0][1], ends[0][0]); a1_ = math.atan2(ends[1][1], ends[1][0])
        O.arc(c, cx, cy, 92, a1_, a0, 1.0, ua(t, t9, 0.5), AMBER, 6)
        hw(c, '90°', cx + 96, cy - 96, 68, AMBER, t, t9, 0.5)
        x3 = ua(t, ww(k, 'doesn\'t') - 0.1, 0.3)
        cross(c, 1740, 322, 1.3, x3)
        if x3 > 0: pill(c, 'not what methane looks like', 1450, 980, CORAL, 48, ua(t, q3 + 0.4, 0.4))


# ------------------------------------------------------------------ c5
def can(c, x, y, col, a=1.0, tilt=0.0, s=1.0, fill=1.0):
    """a paint can centred at (x, y); tilt in degrees about its top right lip"""
    if a <= 0.01: return
    w, h = 104 * s, 124 * s
    c.save(); c.translate(x + w / 2, y - h / 2); c.rotate(tilt); c.translate(-(x + w / 2), -(y - h / 2))
    if a < 0.99: c.saveLayerAlpha(None, int(255 * a))
    c.drawOval(skia.Rect(x - w / 2, y + h / 2 - 14 * s, x + w / 2, y + h / 2 + 14 * s), P((120, 126, 150)))
    c.drawRect(skia.Rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2), P((170, 176, 198)))
    c.drawRect(skia.Rect(x - w / 2, y - h / 2, x - w / 2 + 16 * s, y + h / 2), P((214, 218, 234)))
    c.drawRect(skia.Rect(x + w / 2 - 20 * s, y - h / 2, x + w / 2, y + h / 2), P((126, 132, 158)))
    c.drawRect(skia.Rect(x - w / 2, y - h * 0.2, x + w / 2, y + h * 0.3), P(col))
    c.drawRect(skia.Rect(x + w / 2 - 20 * s, y - h * 0.2, x + w / 2, y + h * 0.3), P(O.mix(col, (40, 30, 90), 0.3)))
    c.drawOval(skia.Rect(x - w / 2, y - h / 2 - 14 * s, x + w / 2, y - h / 2 + 14 * s), P((206, 210, 226)))
    if fill > 0.02: c.drawOval(skia.Rect(x - w / 2 + 9 * s, y - h / 2 - 9 * s, x + w / 2 - 9 * s, y - h / 2 + 9 * s), P(col, 255 * min(1.0, fill * 1.5)))
    else: c.drawOval(skia.Rect(x - w / 2 + 9 * s, y - h / 2 - 9 * s, x + w / 2 - 9 * s, y - h / 2 + 9 * s), P((90, 94, 120)))
    if a < 0.99: c.restore()
    c.restore()


def c5(c, t):
    k = 'c5'; t0, q1, q2, q3 = cues(k, 3)
    board(c, t)
    title(c, 'step 2: mix, like mixing paint', t, t0 - 1, 120, CREAM, 58)
    ap = 1 - ua(t, q3 - 0.5, 0.5); CS = 1.25; CY = 356
    # ---- the paint row (upper half)
    if ap > 0.01:
        c.saveLayerAlpha(None, int(255 * ap))
        tr = ww(k, 'one') - 0.2; twh = ww(k, 'three') - 0.2; tpour = ww(k, 'into') - 0.3; tstir = ww(k, 'stir') - 0.2; tfill = ww(k, 'fill') - 0.1; tpink = ww(k, 'same') - 0.2
        tubx, tuby = 515, 560; pour = ua(t, tpour, 0.5) * (1 - ua(t, tstir + 0.2, 0.5)); lvl = ua(t, tpour + 0.3, 0.9); mixu = ua(t, tstir, 1.4)
        drain = ua(t, tfill, 0.9)
        xs = (215, 400, 630, 815); cols = (O.S_COL, O.P_COL, O.P_COL, O.P_COL)
        at = ua(t, t0 + 0.2, 0.4)                                # the tub is there from the start
        if at > 0:
            tub = skia.Path(); tub.moveTo(tubx - 340, tuby - 40); tub.lineTo(tubx + 340, tuby - 40); tub.lineTo(tubx + 290, tuby + 100); tub.lineTo(tubx - 290, tuby + 100); tub.close()
            c.drawPath(tub, P((70, 78, 120), 255 * at)); c.drawPath(tub, SP((150, 160, 210), 4, 255 * at))
            c.drawOval(skia.Rect(tubx - 340, tuby - 74, tubx + 340, tuby - 6), P((40, 46, 86), 255 * at))
            if lvl > 0:
                r_ = skia.Rect(tubx - 318, tuby - 66, tubx + 318, tuby - 14)
                c.save(); pth = skia.Path(); pth.addOval(r_); c.clipPath(pth, skia.ClipOp.kIntersect, True)
                c.drawRect(r_, P(O.SP3, 255 * at * lvl))
                if mixu < 1:                      # streaks of red and white turning into pink
                    for j in range(10):
                        ph = j * 0.63 + t * 5.0; col = O.S_COL if j % 4 == 0 else O.P_COL
                        ex = tubx + 280 * math.cos(ph) * (0.3 + 0.07 * j); ey = tuby - 40 + 20 * math.sin(ph)
                        c.drawOval(skia.Rect(ex - 80, ey - 10, ex + 80, ey + 10), P(col, 255 * at * lvl * (1 - mixu)))
                c.restore()
                if drain > 0: c.drawOval(r_, P((40, 46, 86), 255 * at * drain))
        for i in range(4):
            a_ = ua(t, (tr if i == 0 else twh + (i - 1) * 0.12), 0.3)
            if a_ <= 0: continue
            left = xs[i] < tubx; sg = 1 if left else -1
            if pour > 0.3:                                       # a stream from the can's lip (the pivot of its tilt) down into the tub
                lip = (xs[i] + sg * 65, CY - 77 * CS + 22); land = (tubx + (-215, -75, 75, 215)[i], tuby - 34)
                st = skia.Path(); st.moveTo(*lip); st.quadTo(lip[0] + sg * 26, lip[1] + 120, *land)
                c.drawPath(st, SP(cols[i], 18, 255 * sm((pour - 0.3) / 0.4) * a_))
            if left: can(c, xs[i], CY, cols[i], a_, 78 * pour, CS, 1 - 0.9 * lvl)
            else:
                c.save(); c.translate(xs[i], 0); c.scale(-1, 1); can(c, 0, CY, cols[i], a_, 78 * pour, CS, 1 - 0.9 * lvl); c.restore()
        if at > 0:                                                # the stirring stick
            ss = ua(t, tstir - 0.1, 0.3) * (1 - ua(t, tstir + 1.5, 0.3))
            if ss > 0:
                sx_ = tubx + 170 * math.cos(t * 6); c.drawLine(sx_, tuby - 40 + 14 * math.sin(t * 6), sx_ + 70, tuby - 250, SP((214, 180, 130), 16, 255 * ss))
        for i in range(4):
            a_ = ua(t, tfill + i * 0.15, 0.35)
            if a_ < 1: can(c, 1180 + i * 180, CY + 20, (90, 94, 120), 0.3 * at * (1 - a_), 0, CS, 0.0)       # empty cans wait at the right
            can(c, 1180 + i * 180, CY + 20, O.SP3, a_, 0, CS, 1.0)
        arrow(c, (930, CY + 20), (1070, CY + 20), AMBER, 8, 1.0, max(0.25 * at, ua(t, tfill - 0.2, 0.4)))
        tx(c, '1 red + 3 white', tubx, tuby + 64, 50, CREAM, t, twh + 0.4, 'semi', 'center')
        tx(c, '4 cans of the same pink', 1450, 566, 50, O.SP3, t, tpink, 'semi', 'center')
        c.restore()
    # ---- the orbital row (lower half)
    a2 = ua(t, t0 + 0.3, 0.5)
    if a2 > 0:
        ts_ = ww(k, 'one', 0, q2) - 0.2; tp_ = ww(k, 'three', 0, q2) - 0.2; t4 = ww(k, 'four', 0, q2) - 0.2
        yo = 835; xo = (215, 400, 580, 760)
        O.s_orb(c, xo[0], yo, 88, O.S_COL, a2 * (0.25 + 0.75 * ua(t, ts_, 0.4)), 1.0)
        for i in range(3): O.p_orb(c, xo[i + 1], yo, 104, -PI / 2, O.P_COL, a2 * (0.25 + 0.75 * ua(t, tp_ + i * 0.12, 0.4)), 1.0)
        tx(c, '1 s + 3 p', 487, 1036, 50, CREAM, t, tp_ + 0.3, 'semi', 'center')
        arrow(c, (930, yo), (1070, yo), AMBER, 8, ua(t, t4 - 0.3, 0.4))
        for i in range(4): O.hyb(c, 1180 + i * 180, 912, 185, -PI / 2, O.SP3, 1.0, ua(t, t4 + i * 0.15, 0.5))
        tx(c, '4 identical hybrids', 1450, 1036, 50, O.SP3, t, ww(k, 'identical') - 0.3, 'semi', 'center')
    # ---- the name
    if t > q3 - 0.3:
        hw(c, 'hybrid orbitals', 520, 440, 110, CREAM, t, ww(k, 'hybrid') - 0.1, 0.9, 'center')
        tn = ww(k, 'S', 0, q3) - 0.1; u = ua(t, tn, 0.4)
        if u > 0: O.hyb_chip(c, 'sp3', 1260, 450, 190, u, 0.85 + 0.15 * u)
        tb = ww(k, 'one', 0, tn) - 0.1
        tx(c, '1 s', 1650, 370, 70, O.S_COL, t, tb, 'xb', 'center'); tx(c, '+', 1650, 448, 60, CREAM, t, tb + 0.4, 'xb', 'center'); tx(c, '3 p', 1650, 530, 70, O.P_COL, t, ww(k, 'three', 0, tb) - 0.1, 'xb', 'center')


# ------------------------------------------------------------------ c6
def unit(v):
    n = math.sqrt(sum(q * q for q in v)) or 1.0
    return tuple(q / n for q in v)


def c6(c, t):
    k = 'c6'; t0, q1, q2, q3 = cues(k, 3)
    board(c, t)
    # 4 in, 4 out
    title(c, 'four in, four out', t, t0 - 1, 120, CREAM, 58)
    ti = t0 + 0.1; to = ww(k, 'four', 1) - 0.1
    tx(c, '4 in', 330, 262, 60, CREAM, t, ti, 'xb', 'center')
    O.s_orb(c, 500, 242, 36, O.S_COL, 1.0, ua(t, ti, 0.4))
    for i in range(3): O.p_orb(c, 600 + i * 80, 242, 46, -PI / 2, O.P_COL, 1.0, ua(t, ti + 0.1 * i, 0.4))
    arrow(c, (840, 242), (980, 242), AMBER, 8, ua(t, to - 0.3, 0.4))
    for i in range(4): O.hyb(c, 1060 + i * 86, 284, 84, -PI / 2, O.SP3, 1.0, ua(t, to + 0.08 * i, 0.4))
    tx(c, '4 out', 1500, 262, 60, O.SP3, t, to, 'xb', 'center')
    tx(c, 'the shape changes, the count never does', 960, 376, 50, INK2, t, ww(k, 'never') - 0.6, 'semi', 'center')
    # one hybrid, large
    a1 = max(0.25 * ua(t, t0 + 0.3, 0.5), ua(t, q1 - 0.1, 0.4)) * (1 - ua(t, q3 - 0.6, 0.5))
    if a1 > 0:
        O.hyb(c, 200, 720, 330, 0.0, O.SP3, a1, 1.0); O.nucleus(c, 200, 720, a1)
        tb = ww(k, 'big') - 0.2
        label(c, 'one big lobe', 300, 545, CREAM, 48, ua(t, tb, 0.3) * a1, dot=(400, 660))
        label(c, 'electrons in every lobe', 110, 934, AMBER, 48, ua(t, ww(k, 'holds') - 0.1, 0.3) * a1)
    # four lobes push apart into a tetrahedron
    cx, cy, L = 1060, 730, 235
    tsp0 = ww(k, 'four', 0, q1) - 0.3; tsp1 = ww(k, 'can', 0, q1) + 0.5; sp = sm((t - tsp0) / (tsp1 - tsp0))
    a4 = max(0.25 * ua(t, t0 + 0.3, 0.5), ua(t, tsp0 - 0.4, 0.5))
    if a4 > 0:
        tt = t if t < q3 else q3 + 0.8 * (1 - math.exp(-(t - q3) / 0.8))
        yaw = 0.2 + 0.35 * math.sin(0.5 * (tt - tsp0))
        bunch = [(0.0, 1.0, 0.0), (0.42, 0.9, 0.0), (-0.21, 0.9, 0.36), (-0.21, 0.9, -0.36)]
        dirs = [unit(tuple(lerp(b_[j], d_[j], sp) for j in range(3))) for b_, d_ in zip(bunch, O.TET)]
        pr = [O.proj(d, yaw, 0.3, L) for d in dirs]
        tips = [(cx + dx * 1.02, cy + dy * 1.02) for dx, dy, z in pr]
        ae = ua(t, ww(k, 'corners') - 0.3, 0.6); af = ua(t, ww(k, 'triangle') - 0.2, 0.5)
        if af > 0:
            order = sorted(range(4), key=lambda i: pr[i][2])
            for tri in ((0, 1, 2), (0, 1, 3), (0, 2, 3), (1, 2, 3)):
                p = skia.Path(); p.moveTo(*tips[tri[0]]); p.lineTo(*tips[tri[1]]); p.lineTo(*tips[tri[2]]); p.close(); c.drawPath(p, P(AMBER, 16 * af * a4))
        if ae > 0:
            for i in range(4):
                for j in range(i + 1, 4): c.drawLine(*tips[i], *tips[j], SP(AMBER, 3.5, 150 * ae * a4))
        for i in sorted(range(4), key=lambda i: pr[i][2]):
            dx, dy, z = pr[i]
            O.hyb(c, cx, cy, math.hypot(dx, dy), math.atan2(dy, dx), O.mix(O.SP3, (60, 50, 110), 0.28 * (1 - (z + 1) / 2)), a4, 1.0)
        O.nucleus(c, cx, cy, a4)
        if ae > 0:
            for p_ in tips: c.drawCircle(p_[0], p_[1], 11, P(NAVY, 255 * ae * a4)); c.drawCircle(p_[0], p_[1], 8, P(AMBER, 255 * ae * a4))
        # repel marks while they push apart
        rp = ua(t, ww(k, 'repel') - 0.2, 0.3) * (1 - ua(t, tsp1, 0.5))
        if rp > 0:
            angs = sorted(math.atan2(dy, dx) for dx, dy, z in pr)
            for i in range(4):
                a_, b_ = angs[i], angs[(i + 1) % 4] + (2 * PI if i == 3 else 0); m_ = (a_ + b_) / 2
                if b_ - a_ > PI: continue
                r_ = 150 + 12 * math.sin(t * 9)
                for sgn in (-1, 1):
                    an = m_ + sgn * min(0.22, (b_ - a_) * 0.3); q0 = (cx + r_ * math.cos(m_), cy + r_ * math.sin(m_)); q1_ = (cx + r_ * math.cos(an), cy + r_ * math.sin(an))
                    arrow(c, q0, q1_, AMBER, 5, 1.0, rp, 0.0, 14)
        tx(c, 'the lobes push apart', cx, 1034, 50, AMBER, t, ww(k, 'push') - 0.2, 'semi', 'center', a=1 - ua(t, q2 - 0.3, 0.3))
        hw(c, 'tetrahedron', 1420, 520, 76, AMBER, t, ww(k, 'tetrahedron') - 0.1, 0.9)
        tx(c, '4 corners', 1420, 600, 50, CREAM, t, ww(k, 'corners', 1) - 0.3, 'semi'); tx(c, '4 triangle faces', 1420, 664, 50, CREAM, t, ww(k, 'triangle') - 0.2, 'semi')
        # the angle
        t9 = ww(k, 'one', 0, q3) - 0.1; ta = ww(k, 'angle', 0, q3) - 0.1
        if t > ta:
            an = math.atan2(pr[1][1], pr[1][0]); d = (an + PI / 2 + PI) % (2 * PI) - PI
            O.arc(c, cx, cy, 110, -PI / 2, -PI / 2 + d, 1.0, ua(t, ta, 0.8), AMBER, 7)
        hw(c, '109.5°', 1420, 840, 120, AMBER, t, t9, 1.0)
    # matches methane
    tm = ww(k, 'methane') - 0.5; am = ua(t, tm, 0.5)
    if am > 0:
        O.ball_stick(c, 330, 700, 180, myaw(t), O.TET, 'C', 'H', am, am, r_c=50, r_o=34)
        tx(c, 'matches methane', 330, 990, 50, GREEN, t, tm + 0.3, 'xb', 'center'); check(c, 590, 975, 1.0, ua(t, tm + 0.5, 0.3))


SCENES = dict(promise=promise, why=why, c1=c1, c2=c2, c3=c3, c4=c4, c5=c5, c6=c6)
