"""The practice moments (Olivier, 2026-11-24: "your turn" presented better; he approved these screens from stills):
1 a full "Your turn" card while the narrator says it, 2 the problem in one panel with numbered tasks and nothing else,
3 a large countdown beside the tasks ("Pause the video and try it"; drawn by render.py over the question board),
4 the answer under the same numbers, each step written on as it is said.
yt-orgo-03 has three practice problems: mixing orbitals, a triple bond, hybridize each atom of H3C-C≡N."""
import math
import skia
import kit as K
import orb as O
from kit import P, SP, sm, W, H, text, AMBER, CORAL, TEAL, YELLOW, GREEN, CREAM, INK2, NAVY, LILAC
from base import Bt, cue, fin, ua, board, ww, cues, tx, hw, panel, tag

NP = 3
TOPIC = {1: 'mixing orbitals', 2: 'a triple bond', 3: 'hybridize each atom'}
TX, TY = 1610, 800          # the countdown's place on every question board
GREY = (150, 158, 196)


def wx(k, w, nth=0, after=None):
    """time of the nth spoken word in beat k that IS w (exact, case blind), unlike base.ww which matches word starts"""
    n = 0
    for word, a, b in Bt[k]['words']:
        if after is not None and a < after: continue
        if word.lower().strip('.,?!:;"\'') == w.lower():
            if n == nth: return a
            n += 1
    print('WORD MISSING', k, w, nth); return after if after is not None else Bt[k]['t0']


def head(c, t, t0, n, answer=False):
    a = ua(t, t0, 0.3)
    if a <= 0.01: return
    s = 'ANSWER' if answer else 'YOUR TURN'; w = K.width(s, 44, 'xb') + 80
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(90, 60, 90 + w, 136), 38, 38), P(GREEN if answer else AMBER, 255 * a)); text(c, s, 90 + w / 2, 114, 44, NAVY, a, 'xb', 'center')
    text(c, f'practice {n} of {NP}', 90 + w + 30, 116, 50, INK2, a, 'semi')


def yt_card(c, t, t0, t1, n):
    """the full card, on screen while he says 'your turn'"""
    a = ua(t, t0 - 0.1, 0.3) * (1 - ua(t, t1 - 0.3, 0.3))
    if a <= 0.01: return False
    u = ua(t, t0, 0.5)
    c.saveLayerAlpha(None, int(255 * a))
    c.drawCircle(960, 400, 120 * (0.85 + 0.15 * u), P(AMBER))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(915, 345, 945, 455), 8, 8), P(NAVY)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(975, 345, 1005, 455), 8, 8), P(NAVY))
    text(c, 'Your turn', 960, 660, 130, CREAM, 1.0, 'xb', 'center')
    c.drawRect(skia.Rect(960 - 60 * u, 700, 960 + 60 * u, 708), P(AMBER))
    text(c, f'practice {n} of {NP}: {TOPIC[n]}', 960, 790, 48, INK2, ua(t, t0 + 0.3, 0.4), 'semi', 'center')
    c.restore()
    return t < t1 - 0.3


def num(c, n, x, y, a):
    if a > 0.01: c.drawCircle(x, y - 20, 42, P(AMBER, 255 * a)); text(c, str(n), x, y, 52, NAVY, a, 'xb', 'center')


def tasks(c, t, items, y0, dy=130, size=58):
    for i, (s, tt) in enumerate(items):
        a = ua(t, tt, 0.35); num(c, i + 1, 180, y0 + i * dy, a); tx(c, s, 260, y0 + i * dy, size, CREAM, t, tt, 'xb')


def countdown(c, left, total, a=1.0):
    """render.py draws this over the question board during the pause"""
    if a <= 0.01: return
    c.drawCircle(TX, TY, 170, P((14, 18, 44), 255 * a)); c.drawCircle(TX, TY, 140, SP((70, 76, 120), 22, 255 * a))
    c.drawArc(skia.Rect(TX - 140, TY - 140, TX + 140, TY + 140), -90, 360 * max(0.0, left) / total, False, SP(AMBER, 22, 255 * a))
    text(c, str(max(1, math.ceil(left))), TX, TY + 52, 150, CREAM, a, 'xb', 'center')
    text(c, 'Pause the video and try it', TX - 70, TY + 236, 46, AMBER, a, 'xb', 'center')


def loop(c, cx, cy, rx, ry, u, a=1.0, col=AMBER, w=5):
    if u <= 0.01 or a <= 0.01: return
    c.drawArc(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry), -100, 360 * sm(u), False, SP(col, w, 255 * a))


def trap(c, s, t, t0, y=1000, size=44):
    K.pill(c, s, 960, y, CORAL, size, ua(t, t0, 0.4), kind='xb', pad=34)


# ------------------------------------------------------------------ practice 1: mixing orbitals
def p1q(c, t):
    k = 'p1q'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    if yt_card(c, t, t0, c1, 1): return
    head(c, t, c1 - 0.2, 1)
    panel(c, 90, 190, 1830, 600, ua(t, c1 - 0.2, 0.4))
    tx(c, 'An atom mixes its s orbital with only TWO', 150, 285, 60, CREAM, t, c1, 'semi'); tx(c, 'of its three p orbitals.', 150, 368, 60, CREAM, t, ww(k, 'TWO') - 0.1, 'semi')
    # the picture: the s and two p orbitals go into the mix; the third p stands aside
    y = 490; ts_ = wx(k, 's') - 0.2; tp_ = ww(k, 'TWO') - 0.15; t3 = ww(k, 'three') - 0.15
    O.s_orb(c, 215, y, 44, O.S_COL, ua(t, ts_, 0.4), ua(t, ts_, 0.4))
    tx(c, '+', 300, y + 20, 60, INK2, t, tp_, 'xb', 'center')
    for i, x in enumerate((385, 495)): O.p_orb(c, x, y, 56, -math.pi / 2, O.P_COL, ua(t, tp_ + i * 0.2, 0.4), 1.0, 40)
    um = ua(t, tp_ + 0.5, 0.5)
    K.arrow(c, (570, y), (690, y), AMBER, 8, um)
    tx(c, 'mix', 720, y + 20, 56, AMBER, t, tp_ + 0.7, 'xb')
    hw(c, '?', 850, y + 26, 84, AMBER, t, tp_ + 1.0, 0.3)
    O.p_orb(c, 1080, y, 56, -math.pi / 2, O.P_COL, ua(t, t3, 0.4), 1.0, 40)
    tx(c, 'the third p', 1140, y + 18, 46, INK2, t, t3 + 0.2, 'semi')
    tasks(c, t, (('How many hybrid orbitals?', c2), ('How many p orbitals are left over?', ww(k, 'And', 0, c2) - 0.2)), 720)


def p1a(c, t):
    k = 'p1a'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t); head(c, t, t0, 1, True)
    # 1: three in, three out
    y = 330
    num(c, 1, 160, y, ua(t, t0 + 0.1, 0.3))
    hw(c, '1 s + 2 p = 3 orbitals in', 250, y, 76, CREAM, t, t0 + 0.1, 2.6)
    th = ww(k, 'three', 1) - 0.2
    K.arrow(c, (1105, y - 24), (1195, y - 24), AMBER, 8, ua(t, th - 0.3, 0.4))
    hw(c, '3 hybrids', 1235, y, 76, AMBER, t, th, 0.7)
    uo = ua(t, ww(k, 'come') - 0.2, 0.6)
    for i in range(3):
        ang = -math.pi / 2 + i * 2 * math.pi / 3
        O.hyb(c, 1700, y - 20, 86, ang, O.SP2, uo, uo, False)
    O.nucleus(c, 1700, y - 20, uo, 7)
    # 2: three p, two used, one left
    y = 600
    num(c, 2, 160, y, ua(t, c1 - 0.1, 0.3))
    hw(c, '3 p - 2 used', 250, y, 76, CREAM, t, ww(k, 'three', 0, c1) - 0.2, 1.8)
    tl_ = ww(k, 'one', 0, c1) - 0.2
    hw(c, '= 1 p left over', 760, y, 76, AMBER, t, tl_, 1.2)
    O.p_orb(c, 1700, y - 20, 84, -math.pi / 2, O.P_COL, ua(t, tl_ + 0.3, 0.5), ua(t, tl_ + 0.3, 0.5), 54)
    trap(c, 'trap: mixing never uses orbitals up (in = out)', t, c2, 830, 48)
    tx(c, 'that leftover p matters next', 960, 980, 52, TEAL, t, c3, 'xb', 'center')


# ------------------------------------------------------------------ practice 2: a carbon in a triple bond
def _triple(c, x, y, a, ub):
    """a carbon with a triple bond to an unnamed neighbour and one more single bond"""
    O.bond(c, (x - 40, y), (x - 190, y), a, ub, 10)
    O.bond(c, (x + 44, y), (x + 236, y), a, ub, 9, n=3, gap=19)
    O.atom(c, x + 280, y, 'C', 46, a * sm(ub * 2 - 0.6), GREY, label=False)
    O.atom(c, x, y, 'C', 54, a)


def p2q(c, t):
    k = 'p2q'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    if yt_card(c, t, t0, c1, 2): return
    head(c, t, c1 - 0.2, 2)
    panel(c, 90, 190, 1830, 585, ua(t, c1 - 0.2, 0.4))
    tx(c, 'A carbon atom is part of a triple bond.', 150, 290, 62, CREAM, t, c1, 'semi')
    _triple(c, 420, 425, ua(t, c1 + 0.2, 0.4), ua(t, ww(k, 'triple') - 0.2, 0.6))
    al = ua(t, ww(k, 'triple') + 0.4, 0.4)
    if al > 0.01: c.drawCircle(420, 425, 64, SP(AMBER, 5, 255 * al)); text(c, 'this carbon', 420, 548, 42, AMBER, al, 'xb', 'center')
    tasks(c, t, (('Its hybridization?', c2), ('Leftover p orbitals?', ww(k, 'How') - 0.2), ('Bond angle?', ww(k, 'And') - 0.2)), 700, 118)


def p2a(c, t):
    k = 'p2a'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t); head(c, t, t0, 2, True)
    y1, y2, y3 = 300, 480, 660
    # said first: two pi bonds use two p, so two are left over (task 2)
    for n_, yy in ((1, y1), (2, y2), (3, y3)):                 # the three numbered rows are there from the first frame, as empty slots
        num(c, n_, 160, yy, 1.0); c.drawLine(250, yy + 26, 1340, yy + 26, SP((90, 104, 170), 3, 120))
    hw(c, '2 pi bonds use 2 p', 250, y2, 68, CREAM, t, ww(k, 'two') - 0.2, 1.2)
    tl_ = ww(k, 'two', 1) - 0.2
    K.arrow(c, (885, y2 - 20), (955, y2 - 20), AMBER, 8, ua(t, tl_ - 0.2, 0.4))
    hw(c, '2 left over', 985, y2, 72, AMBER, t, tl_, 0.6)
    for i in range(2): O.p_orb(c, 1450 + i * 110, y2 - 20, 62, -math.pi / 2, O.P_COL, ua(t, tl_ + 0.2 + i * 0.2, 0.4), 1.0, 42)
    # then: the s and one p mix, so it is sp (task 1)
    hw(c, 's + 1 p mix', 250, y1, 68, CREAM, t, ww(k, 'leaves') - 0.1, 0.9)
    tsp = ww(k, 'plain') - 0.15
    K.arrow(c, (885, y1 - 20), (955, y1 - 20), AMBER, 8, ua(t, tsp - 0.2, 0.4))
    O.hyb_chip(c, 'sp', 1055, y1, 68, ua(t, tsp, 0.35))
    # the angle (task 3)
    hw(c, 'opposite directions', 250, y3, 68, CREAM, t, ww(k, 'opposite') - 0.2, 1.0)
    ta = ww(k, 'eighty') - 0.5
    K.arrow(c, (885, y3 - 20), (955, y3 - 20), AMBER, 8, ua(t, ta - 0.2, 0.4))
    hw(c, '180°', 985, y3, 76, AMBER, t, ta, 0.5)
    uh = ua(t, ww(k, 'hybrids') - 0.2, 0.6)
    for ang in (0.0, math.pi): O.hyb(c, 1505, y3 - 20, 120, ang, O.SP1, uh, uh, False)
    O.nucleus(c, 1505, y3 - 20, uh, 7)
    trap(c, 'trap: triple does not mean sp³', t, c3, 840, 50)
    tx(c, 'the number counts the p orbitals in the mix, not bonds', 960, 980, 50, CREAM, t, ww(k, 'That', 0, c3) - 0.1, 'semi', 'center')


# ------------------------------------------------------------------ practice 3: H3C-C≡N
def mol(c, ox, oy, s, a1=1.0, uh=1.0, u12=1.0, u3=1.0, an=1.0, alp=1.0, labels=1.0):
    """H3C-C≡N with the lone pair on nitrogen; returns the atom centres"""
    C1, C2, N = (ox, oy), (ox + 290 * s, oy), (ox + 620 * s, oy)
    hs = [(ox - 175 * s, oy), (ox, oy - 165 * s), (ox, oy + 165 * s)]
    for hx, hy in hs: O.bond(c, C1, (hx, hy), a1, uh, 10 * s)
    O.bond(c, C1, C2, a1, u12, 10 * s)
    O.bond(c, (C2[0] + 46 * s, oy), (N[0] - 46 * s, oy), a1, u3, 9 * s, n=3, gap=20 * s)
    for hx, hy in hs: O.atom(c, ox + (hx - ox) * uh, oy + (hy - oy) * uh, 'H', 36 * s, a1 * sm(uh * 2 - 0.6))
    O.atom(c, *C1, 'C', 54 * s, a1); O.atom(c, *C2, 'C', 54 * s, sm(u12 * 2 - 0.6)); O.atom(c, *N, 'N', 54 * s, an)
    O.lone(c, N[0] + 80 * s, oy, 0.0, alp, 8 * s, 13 * s)
    if labels > 0.01:
        text(c, 'C 1', C1[0] + 104 * s, oy - 76 * s, 54, YELLOW, labels * a1, 'xb', 'center'); text(c, 'C 2', C2[0], oy - 76 * s, 54, YELLOW, labels * sm(u12 * 2 - 0.6), 'xb', 'center')
    return C1, C2, N, hs


def p3q(c, t):
    k = 'p3q'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    if yt_card(c, t, t0, c1, 3): return
    head(c, t, c1 - 0.2, 3)
    panel(c, 90, 180, 1830, 610, ua(t, c1 - 0.2, 0.4))
    mol(c, 560, 395, 1.0, ua(t, ww(k, 'carbon') - 0.2, 0.4), ua(t, ww(k, 'three') - 0.2, 0.6), ua(t, ww(k, 'second') - 0.2, 0.6),
        ua(t, ww(k, 'triple') - 0.2, 0.6), ua(t, ww(k, 'nitrogen') - 0.2, 0.4), ua(t, ww(k, 'lone') - 0.15, 0.4))
    tasks(c, t, (('Hybridization of C 1?', c2), ('of C 2?', ww(k, 'each') - 0.1), ('of N?', ww(k, 'nitrogen', 2) - 0.3)), 720, 115, 56)


def p3a(c, t):
    k = 'p3a'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t); head(c, t, t0, 3, True)
    s = 0.8; ox, oy = 700, 330
    C1, C2, N, hs = mol(c, ox, oy, s)
    # count loops: C 1's four bonds, then C 2's two groups, then N's two groups
    f1 = 1 - ua(t, c1 - 0.4, 0.4); f2 = 1 - ua(t, c2 - 0.4, 0.4); f3 = 1 - ua(t, c3 - 0.3, 0.4)
    tb = ww(k, 'three') - 0.2
    for i, (hx, hy) in enumerate(hs):
        loop(c, (C1[0] + hx) / 2, (C1[1] + hy) / 2, 30 if hy != oy else 44, 44 if hy != oy else 30, ua(t, tb + i * 0.15, 0.4), f1)
    loop(c, (C1[0] + C2[0]) / 2, oy, 62, 32, ua(t, ww(k, 'one') - 0.2, 0.4), f1)
    loop(c, (C1[0] + C2[0]) / 2, oy, 62, 32, ua(t, ww(k, 'single') - 0.2, 0.4), f2 * (1 - f1))
    loop(c, (C2[0] + N[0]) / 2, oy, 96, 44, ua(t, ww(k, 'triple') - 0.2, 0.4), f2 * (1 - f1))
    loop(c, (C2[0] + N[0]) / 2, oy, 96, 44, ua(t, ww(k, 'triple', 1) - 0.2, 0.4), f3 * (1 - f2))
    loop(c, N[0] + 80 * s, oy, 30, 34, ua(t, ww(k, 'lone') - 0.2, 0.4), f3 * (1 - f2))
    ys = (620, 750, 880)
    # C 1
    num(c, 1, 160, ys[0], ua(t, t0 + 0.1, 0.3)); tag(c, 'C 1', 240, ys[0], LILAC, ua(t, t0 + 0.1, 0.3), 46, 'left')
    hw(c, '3 + 1 = 4 groups', 400, ys[0], 68, CREAM, t, ww(k, 'four') - 0.2, 1.0)
    ts1 = wx(k, 's') - 0.15
    K.arrow(c, (975, ys[0] - 20), (1045, ys[0] - 20), AMBER, 8, ua(t, ts1 - 0.2, 0.4)); O.hyb_chip(c, 'sp3', 1160, ys[0], 62, ua(t, ts1, 0.35))
    # C 2
    num(c, 2, 160, ys[1], ua(t, c1 - 0.1, 0.3)); tag(c, 'C 2', 240, ys[1], LILAC, ua(t, c1 - 0.1, 0.3), 46, 'left')
    ts2 = ww(k, 'plain') - 0.15
    hw(c, '2 groups', 400, ys[1], 68, CREAM, t, ww(k, 'two') - 0.2, 0.6)
    K.arrow(c, (975, ys[1] - 20), (1045, ys[1] - 20), AMBER, 8, ua(t, ts2, 0.4)); O.hyb_chip(c, 'sp', 1140, ys[1], 62, ua(t, ts2, 0.35))
    tx(c, 'single bond + triple bond', 1250, ys[1], 46, INK2, t, ww(k, 'single') - 0.2, 'semi')
    # N
    num(c, 3, 160, ys[2], ua(t, c2 - 0.1, 0.3)); tag(c, 'N', 240, ys[2], O.NIT, ua(t, c2 - 0.1, 0.3), 46, 'left')
    hw(c, '2 groups', 400, ys[2], 68, CREAM, t, ww(k, 'two', 1) - 0.2, 0.6)
    ts3 = wx(k, 's', 2) - 0.15
    K.arrow(c, (975, ys[2] - 20), (1045, ys[2] - 20), AMBER, 8, ua(t, ts3 - 0.2, 0.4)); O.hyb_chip(c, 'sp', 1140, ys[2], 62, ua(t, ts3, 0.35))
    tx(c, 'triple bond + lone pair', 1250, ys[2], 46, INK2, t, ww(k, 'triple', 1) - 0.2, 'semi')
    trap(c, "trap: forgetting N's lone pair, or counting the triple bond as 3", t, c3, 1005, 44)


SCENES = dict(p1q=p1q, p1a=p1a, p2q=p2q, p2a=p2a, p3q=p3q, p3a=p3a)
