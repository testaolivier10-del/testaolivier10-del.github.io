"""Teaching boards, part C (the counting shortcut on real molecules, lone pairs, hybridization vs shape, the recap):
the one navy board, never zooms. Everything lands on its word; 3D models rock slowly for scene life."""
import math
import skia
import kit as K
import orb as O
from kit import P, SP, sm, W, H, text, pill, AMBER, CORAL, TEAL, YELLOW, GREEN, CREAM, INK2, NAVY
from base import Bt, cue, fin, ua, lightbar, board, check, cross, title, ww, cues, tx, hw, panel, tag, pulse

GREY = (150, 158, 196)


def lerp_(a, b, u): return a + (b - a) * u


def wx(k, w, nth=0, after=None):
    """time of the nth spoken word in beat k that IS w (exact, case blind), unlike base.ww which matches word starts"""
    n = 0
    for word, a, b in Bt[k]['words']:
        if after is not None and a < after: continue
        if word.lower().strip('.,?!:;"\'') == w.lower():
            if n == nth: return a
            n += 1
    print('WORD MISSING', k, w, nth); return after if after is not None else Bt[k]['t0']


def badge(c, n, x, y, a=1.0, r=27, col=AMBER):
    """a count badge: an amber disc with a number"""
    if a <= 0.01: return
    k = 0.7 + 0.3 * sm(a)
    c.drawCircle(x + 2, y + 3, r * k, P((6, 8, 28), 120 * a)); c.drawCircle(x, y, r * k, P(col, 255 * a))
    text(c, str(n), x, y + 14 * k, 40 * k, NAVY, a, 'xb', 'center')


def loop(c, cx, cy, rx, ry, u, a=1.0, col=AMBER, w=5):
    """an oval drawn around one electron group"""
    if u <= 0.01 or a <= 0.01: return
    c.drawArc(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry), -100, 360 * sm(u), False, SP(col, w, 255 * a))


def divider(c, a):
    if a > 0.01: c.drawLine(960, 190, 960, 1000, SP((90, 104, 170), 3, 150 * a))


# ------------------------------------------------------------------ e3: methane and carbon dioxide
def e3(c, t):
    k = 'e3'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    title(c, 'test the count', t, t0 - 1, 120, CREAM, 58)
    divider(c, 1.0)
    # methane, turning slowly (faint from the first frame, lit on its cue)
    cx, cy, L = 480, 520, 235; yaw = 0.5 + 0.22 * math.sin(t * 0.5)
    am = 0.3 + 0.7 * ua(t, c1 - 0.2, 0.5)
    text(c, 'methane', cx, 222, 58, CREAM, am, 'xb', 'center')
    O.ball_stick(c, cx, cy, L, yaw, O.TET, 'C', 'H', am, 1.0, r_c=62, r_o=44, w=13)
    tb = ww(k, 'four', 0, c1) - 0.15
    pr = sorted([(O.proj(d, yaw, 0.3, L), i) for i, d in enumerate(O.TET)], key=lambda q: q[1])
    for i, ((dx, dy, z), _) in enumerate(pr):
        badge(c, i + 1, cx + dx * 0.56, cy + dy * 0.56, ua(t, tb + i * 0.22, 0.3), 30)
    tg = ww(k, 'four', 1, c1) - 0.15
    tx(c, '4 groups', cx - 30, 870, 70, AMBER, t, tg, 'xb', 'right')
    O.hyb_chip(c, 'sp3', cx + 120, 870, 70, ua(t, wx(k, 's', 0, c1) - 0.15, 0.35))
    tx(c, '4 bonds, 0 lone pairs', cx, 985, 56, INK2, t, ww(k, 'bonds', 0, c1) - 0.1, 'semi', 'center')
    # carbon dioxide, drawn straight
    x0, y0, d = 1440, 480, 290
    ac = 0.3 + 0.7 * ua(t, c2 - 0.2, 0.5)
    text(c, 'carbon dioxide', x0, 222, 58, CREAM, ac, 'xb', 'center')
    tl_ = ww(k, 'straight') - 0.2; ul = ua(t, tl_, 0.7)
    if ul > 0.01:                                             # the straight line through all three atoms
        xa, xb = x0 - d - 95, x0 - d - 95 + (2 * d + 190) * ul
        xx = xa
        while xx < xb: c.drawLine(xx, y0, min(xx + 18, xb), y0, SP(AMBER, 4, 200)); xx += 32
    for sgn in (-1, 1):
        O.bond(c, (x0 + sgn * 58, y0), (x0 + sgn * (d - 54), y0), ac, 1.0, 12, n=2, gap=28)
    O.atom(c, x0, y0, 'C', 66, ac)
    for sgn in (-1, 1):
        O.atom(c, x0 + sgn * d, y0, 'O', 64, ac)
        for ang in (-0.9, 0.9):                               # two lone pairs on each oxygen
            a_ = (math.pi if sgn < 0 else 0.0) + ang
            O.lone(c, x0 + sgn * d + 90 * math.cos(a_), y0 + 90 * math.sin(a_), a_, ac * 0.9, 7, 11)
    te = ww(k, 'Each', 0, c2) - 0.15
    for i, sgn in enumerate((-1, 1)):
        loop(c, x0 + sgn * d / 2, y0, 104, 58, ua(t, te + i * 0.35, 0.5))
        badge(c, i + 1, x0 + sgn * d / 2, y0 - 96, ua(t, te + 0.3 + i * 0.35, 0.3), 30)
    tx(c, '2 groups', x0 - 30, 740, 70, AMBER, t, ww(k, 'two', 1, c2) - 0.15, 'xb', 'right')
    O.hyb_chip(c, 'sp', x0 + 110, 740, 70, ua(t, ww(k, 'plain') - 0.1, 0.35))
    tx(c, '2 π bonds need 2 leftover p', x0, 870, 52, CREAM, t, wx(k, 'pi') - 0.4, 'semi', 'center')
    tx(c, 'linear: a straight line', x0, 985, 52, AMBER, t, tl_, 'xb', 'center')


# ------------------------------------------------------------------ e4: lone pairs count
def _ammonia(c, x, y, a_n, a_h, uh, a_lp):
    hs = [(-175, 70), (0, 190), (175, 70)]
    for hx, hy in hs: O.bond(c, (x, y), (x + hx, y + hy), a_h, uh, 10)
    O.atom(c, x, y, 'N', 56, a_n)
    for hx, hy in hs: O.atom(c, x + hx * uh, y + hy * uh, 'H', 36, a_h * sm(uh * 2 - 0.6))
    O.lone(c, x, y - 80, -math.pi / 2, a_lp, 8, 13)
    return hs


def _water(c, x, y, a_o, a_h, uh, a_lp):
    hs = [(-160, 125), (160, 125)]
    for hx, hy in hs: O.bond(c, (x, y), (x + hx, y + hy), a_h, uh, 10)
    O.atom(c, x, y, 'O', 56, a_o)
    for hx, hy in hs: O.atom(c, x + hx * uh, y + hy * uh, 'H', 36, a_h * sm(uh * 2 - 0.6))
    for ang in (-2.25, -0.89):
        O.lone(c, x + 82 * math.cos(ang), y + 82 * math.sin(ang), ang, a_lp, 8, 13)


def e4(c, t):
    k = 'e4'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'lone pairs count as groups', t, t0 - 1, 120, CREAM, 58)
    divider(c, 1.0)
    F = lambda u: 0.3 + 0.7 * u
    xn, xo, y = 480, 1440, 430
    tn, to = ww(k, 'nitrogen') - 0.15, ww(k, 'oxygen') - 0.15
    # ammonia
    text(c, 'ammonia', xn, 240, 56, CREAM, F(ua(t, c1 - 0.1, 0.4)), 'xb', 'center')
    th = ww(k, 'three', 0, c1) - 0.2
    hs = _ammonia(c, xn, y, F(ua(t, tn, 0.4)), F(ua(t, th, 0.4)), 1.0, F(ua(t, tn + 0.3, 0.4)))
    for i, (hx, hy) in enumerate(hs): badge(c, i + 1, xn + hx * 0.52, y + hy * 0.52 - (0 if i != 1 else 0) + (-34 if i != 1 else 0), ua(t, th + 0.3 + i * 0.2, 0.3))
    tlp = ww(k, 'one', 0, c1) - 0.1
    loop(c, xn, y - 80, 44, 28, ua(t, tlp, 0.4)); badge(c, 4, xn + 86, y - 92, ua(t, tlp + 0.25, 0.3))
    tx(c, '3 + 1 = 4 groups', xn - 60, 790, 60, AMBER, t, ww(k, 'Three', 0, c1) - 0.15, 'xb', 'center')
    O.hyb_chip(c, 'sp3', xn + 300, 790, 60, ua(t, wx(k, 's', 0, c1) - 0.15, 0.35))
    # water
    text(c, 'water', xo, 240, 56, CREAM, F(ua(t, c2 - 0.1, 0.4)), 'xb', 'center')
    tw = ww(k, 'two', 0, c2) - 0.2
    _water(c, xo, y, F(ua(t, to, 0.4)), F(ua(t, tw, 0.4)), 1.0, F(ua(t, to + 0.3, 0.4)))
    for i, (hx, hy) in enumerate(((-160, 125), (160, 125))): badge(c, i + 1, xo + hx * 0.55 + (-30 if hx < 0 else 30), y + hy * 0.55 - 28, ua(t, tw + 0.3 + i * 0.2, 0.3))
    tl2 = ww(k, 'two', 1, c2) - 0.1
    for i, ang in enumerate((-2.25, -0.89)):
        lx, ly = xo + 82 * math.cos(ang), y + 82 * math.sin(ang)
        loop(c, lx, ly, 40, 40, ua(t, tl2 + i * 0.25, 0.4)); badge(c, i + 3, xo + 150 * math.cos(ang), y + 150 * math.sin(ang), ua(t, tl2 + 0.25 + i * 0.25, 0.3))
    tx(c, '2 + 2 = 4 groups', xo - 60, 790, 60, AMBER, t, ww(k, 'makes') - 0.15, 'xb', 'center')
    O.hyb_chip(c, 'sp3', xo + 300, 790, 60, ua(t, wx(k, 's', 0, c2) - 0.15, 0.35))
    # the trap: forget the lone pairs and both answers go wrong
    a3 = ua(t, c3 - 0.1, 0.4)
    if a3 > 0.01:
        panel(c, 90, 880, 880, 1010, a3, edge=CORAL); panel(c, 1040, 880, 1830, 1010, a3, edge=CORAL)
        tx(c, 'without it: 3 groups → sp²', 125, 962, 48, GREY, t, c3, 'semi')
        tx(c, 'without them: 2 groups → sp', 1075, 962, 48, GREY, t, c3 + 0.3, 'semi')
        tc = ww(k, 'wrong') - 0.1
        cross(c, 830, 945, 0.8, ua(t, tc, 0.3)); cross(c, 1780, 945, 0.8, ua(t, tc + 0.25, 0.3))


# ------------------------------------------------------------------ e5: hybridization vs shape
_S, _Cc = 0.8165, 0.5774
WATER = [(-_S, -_Cc, 0.0), (_S, -_Cc, 0.0), (0.0, _Cc, _S), (0.0, _Cc, -_S)]


def model(c, x, y, L, yaw, dirs, center, lone_idx, a=1.0, ghost=1.0, edges=0.0, pitch=0.3):
    """a 3D model on tetrahedral directions: H atoms on bonds, lone pairs as pale lobes with two dots (ghost fades them)"""
    items = sorted([(O.proj(d, yaw, pitch, L), i) for i, d in enumerate(dirs)], key=lambda q: q[0][2])
    hp = {i: (x + q[0], y + q[1]) for q, i in items if i not in lone_idx}
    if edges > 0.01:                                          # the outline of the shape the atoms make
        ks = sorted(hp)
        for i in range(len(ks)):
            for j in range(i + 1, len(ks)):
                c.drawLine(*hp[ks[i]], *hp[ks[j]], SP(AMBER, 3.5, 150 * edges * a))
    def one(q, i):
        dx, dy, z = q; kz = 0.84 + 0.16 * (z + 1) / 2
        if i in lone_idx:
            g = a * ghost; ang = math.atan2(dy, dx); Lp = math.hypot(dx, dy) * 0.86
            O.lobe(c, x, y, Lp, ang, (200, 206, 240), g * 0.75, Lp * 0.6, 1.0, glow=False)
            O.lone(c, x + dx * 0.56, y + dy * 0.56, ang, g, 7, 11)
        else:
            Lq = math.hypot(dx, dy) or 1.0; st = (x + dx / Lq * 50, y + dy / Lq * 50) if z >= 0 else (x, y)
            O.bond(c, st, (x + dx, y + dy), a, 1.0, 12 * kz, O.mix(O.BOND, (60, 60, 110), 0.3 * (1 - (z + 1) / 2)))
            O.atom(c, x + dx, y + dy, 'H', 38 * kz, a)
    for q, i in items:
        if q[2] < 0 or i in lone_idx: one(q, i)
    O.atom(c, x, y, center, 58, a)
    for q, i in items:
        if q[2] >= 0 and i not in lone_idx: one(q, i)


def e5(c, t):
    k = 'e5'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'hybridization vs shape', t, t0 - 1, 120, CREAM, 58)
    xs = (340, 960, 1580); y, L = 580, 195
    names = ('methane', 'ammonia', 'water'); ts = (ww(k, 'Methane') - 0.15, ww(k, 'ammonia') - 0.15, ww(k, 'water') - 0.15)
    tg = ww(k, 'leaves') - 0.2; ghost = 1 - 0.8 * ua(t, tg, 0.8)
    te = (ww(k, 'tetrahedron', 0, c2) - 0.3, ww(k, 'pyramid') - 0.4, ww(k, 'bent') - 0.3)
    tsp = wx(k, 's') - 0.15
    specs = ((O.TET, 'C', (), 0.5), (O.TET, 'N', (0,), 0.5), (WATER, 'O', (2, 3), 0.5))
    for i, (dirs, cen, lp, y0) in enumerate(specs):
        yaw = y0 + 0.3 * math.sin(t * 0.45 + i * 0.7)
        a = 0.3 + 0.7 * ua(t, ts[i], 0.5)
        text(c, names[i], xs[i], 218, 56, CREAM, a, 'xb', 'center')
        model(c, xs[i], y, L, yaw, dirs, cen, lp, a, ghost, ua(t, te[i], 0.6))
        O.hyb_chip(c, 'sp3', xs[i], 322, 58, ua(t, tsp + i * 0.15, 0.35))
    tx(c, '4 groups point to the corners of a tetrahedron', 960, 880, 50, INK2, t, ww(k, 'four') - 0.2, 'semi', 'center', a=1 - ua(t, c2 + 3.6, 0.4))
    tx(c, 'shape = where the atoms are', 960, 880, 50, YELLOW, t, c2 + 4.0, 'xb', 'center', a=1 - ua(t, te[0] - 0.3, 0.4))
    for i, s in enumerate(('tetrahedral', 'pyramid', 'bent')):
        tx(c, s, xs[i], lerp_(880, 850, ua(t, c3 - 0.3, 0.4)), 62, AMBER, t, te[i] + 0.1, 'xb', 'center')
    a3 = ua(t, c3 - 0.1, 0.4)
    if a3 > 0.01:
        panel(c, 150, 884, 1770, 986, a3)
        tx(c, 'hybridization counts every group;', 190, 952, 48, CREAM, t, c3, 'xb')
        tx(c, 'shape shows only the atoms', 1050, 952, 48, AMBER, t, ww(k, 'shape', 0, c3) - 0.15, 'xb')


# ------------------------------------------------------------------ rc: the whole idea in one picture
def _pic(c, kind, x, y, t, a):
    """the orbital icon of a row, in a fixed 3D view (a tiny rock for life), three clearly different pictures:
    sp3 = four pink lobes (one up, two to the sides, one short toward the viewer); sp2 = THREE pink lobes seen from above their
    plane plus ONE white p through it; sp = TWO pink lobes in a line plus TWO white p orbitals crossed at right angles"""
    if a <= 0.01: return
    rock = 0.07 * math.sin(t * 0.5)
    if kind == 'sp3':
        O.tetra(c, x, y + 16, 112, 0.5236 + rock, a, pitch=0.12, back=False)
    elif kind == 'sp2':
        for d in O.TRI:                                       # the flat three, seen well from above so all three read
            dx, dy, z = O.proj(d, 0.52 + rock, 1.0, 112); O.hyb(c, x, y + 4, math.hypot(dx, dy), math.atan2(dy, dx), O.SP2, a, 1.0, False)
        O.p_orb(c, x, y + 4, 62, -math.pi / 2 + 0.12, O.P_COL, a, 1.0, 36); O.nucleus(c, x, y + 4, a, 7)
    else:
        for ang in (0.0, math.pi): O.hyb(c, x, y, 118, ang, O.SP1, a, 1.0, False)
        O.p_orb(c, x, y, 84, -math.pi / 2, O.P_COL, a, 1.0, 40)                          # one leftover p, straight up and down
        O.p_orb(c, x, y, 58, -math.pi / 2 + 0.95, O.P_COL, a, 1.0, 36)                   # the other, toward the viewer (drawn shorter)
        O.nucleus(c, x, y, a, 7)


def rc(c, t):
    k = 'rc'; t0, c1, c2, c3, c4 = cues(k, 4)
    board(c, t)
    title(c, 'the whole idea in one picture', t, t0 - 1, 120, CREAM, 58)
    # strip under the title: promote, then mix
    a1 = ua(t, c1 - 0.1, 0.4)
    if a1 > 0.01:
        for i in range(4): O.box(c, 560 + i * 64, 196, 1, a1 * ua(t, c1 + 0.1 * i, 0.3), 56)
        K.arrow(c, (812, 196), (892, 196), AMBER, 6, ua(t, ww(k, 'mixes') - 0.2, 0.4), 1.0, 0.0, 20)
        um = ua(t, ww(k, 'mixes') - 0.1, 0.5)
        for i in range(4): O.hyb(c, 935 + i * 26, 218, 58, -math.pi / 2 + (i - 1.5) * 0.42, O.SP3, um, um, False)
        tx(c, 'promote, then mix', 1080, 214, 50, AMBER, t, ww(k, 'promotes') - 0.15, 'xb')
    # the table frame and its headers are there from the first frame
    for s_, x in (('count', 790), ('where the groups point', 1150), ('p left over', 1610)):
        text(c, s_, x, 304, 48, INK2, 1.0, 'semi', 'center')
    c.drawLine(110, 322, 1810, 322, SP((90, 104, 170), 3, 170))
    for yy in (540, 760): c.drawLine(110, yy, 1810, yy, SP((90, 104, 170), 2.5, 110))
    rows = (('sp3', c2, 430, '4 groups', ww(k, 'four') - 0.15, 'tetrahedral', ww(k, 'tetrahedron') - 0.3, '109.5°', ww(k, 'nine') - 0.5, '0 p left', '', ww(k, 'no') - 0.2, c3),
            ('sp2', c3, 650, '3 groups', ww(k, 'Three', 0, c3) - 0.15, 'flat', ww(k, 'flat') - 0.15, '120°', ww(k, 'twenty') - 0.5, '1 p left', '→ 1 π', ww(k, 'one', 0, ww(k, 'twenty')) - 0.2, c4),
            ('sp', c4, 870, '2 groups', ww(k, 'pair') - 0.15, 'line', ww(k, 'straight') - 0.15, '180°', ww(k, 'eighty') - 0.5, '2 p left', '→ 2 π', ww(k, 'two', 0, ww(k, 'eighty')) - 0.2, fin(k) + 9))
    for ri, (kind, tc, y, g, tg_, shp, ts_, ang, ta_, pl, pi_, tp_, tend) in enumerate(rows):
        lightbar(c, t, y + 30, tc, tend, 110, 1810, 200)
        a = ua(t, tc - 0.1, 0.5)
        _pic(c, kind, 250, y, t, a)
        O.hyb_chip(c, kind, 478, y + 24, 72, ua(t, wx(k, 's', 0, tc) - 0.15, 0.35))
        tx(c, g, 790, y + 22, 66, CREAM, t, tg_, 'xb', 'center')
        tx(c, shp, 1150, y - 10, 62, CREAM, t, ts_, 'xb', 'center'); tx(c, ang, 1150, y + 66, 66, AMBER, t, ta_, 'xb', 'center')
        if pi_:
            tx(c, pl, 1610, y - 10, 62, CREAM, t, tp_, 'xb', 'center'); tx(c, pi_, 1610, y + 66, 62, TEAL, t, ww(k, 'pi', 0, tp_) - 0.2, 'xb', 'center')
        else:
            tx(c, pl, 1610, y + 22, 62, CREAM, t, tp_, 'xb', 'center')


SCENES = dict(e3=e3, e4=e4, e5=e5, rc=rc)
