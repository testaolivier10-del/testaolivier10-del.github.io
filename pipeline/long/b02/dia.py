"""Teaching diagrams drawn in code for AP Bio 02: atoms, ball and stick molecules, element tiles, the matter loop,
bead chains (monomers and polymers), water molecules, enzymes, and the four family icons. House flat style:
flat fills, one shade tone, a thin amber rim, labels in code."""
import math
import numpy as np
import skia
import kit as K
from kit import C, P, SP, sm, text, W, H, CREAM, AMBER, CORAL, TEAL, YELLOW, BLUE, GREEN, NAVY, INK2, LILAC
from gk import flat, smooth_closed, poly, blur, mix

RIM = (255, 214, 140)
T = 0.0          # global time, set by render.frame: atoms and beads jiggle gently (thermal motion)


def jig(x, y, amp=3.2):
    return x + amp * math.sin(T * 2.3 + y * 0.031 + x * 0.017), y + amp * math.cos(T * 1.9 + x * 0.029)
# element colours (CPK-like, softened for the navy background)
EL = dict(C=(70, 74, 92), H=(236, 236, 240), O=(232, 84, 76), N=(92, 132, 232), P=(250, 150, 60), S=(246, 210, 70), K=(176, 120, 230))
EL_TXT = dict(C=CREAM, H=NAVY, O=CREAM, N=CREAM, P=NAVY, S=NAVY, K=CREAM)
NAME = dict(C='carbon', H='hydrogen', O='oxygen', N='nitrogen', P='phosphorus', S='sulfur')


def part(c, path, base, shade=None, sh=6, rim_a=160, a=1.0):
    flat(c, path, base, shade if shade is not None else tuple(v * 0.78 for v in base), sh_off=(-sh, 0), rim=RIM, rim_d=(2, 2), rim_a=rim_a * a, a=255 * a)


def ball(c, x, y, r, el, a=1.0, label=True, glow=0.0):
    if a <= 0.01:
        return
    x, y = jig(x, y)
    if glow > 0:
        K.glow(c, x, y, r * 2.2, EL[el] if el != 'C' else AMBER, glow * a)
    p = skia.Path(); p.addCircle(x, y, r)
    part(c, p, EL[el], sh=r * 0.22, a=a)
    c.drawCircle(x - r * 0.35, y - r * 0.38, r * 0.18, P((255, 255, 255), 70 * a))
    if label and r >= 14:
        text(c, el, x, y + r * 0.36, r * 1.0, EL_TXT[el], a, 'xb', 'center')


def bond(c, p0, p1, order=1, a=1.0, u=1.0, col=(220, 214, 200), w=7, jg=True):
    if a <= 0.01 or u <= 0.01:
        return
    x0, y0 = jig(*p0) if jg else p0; x1, y1 = jig(*p1) if jg else p1
    x1, y1 = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
    dx, dy = x1 - x0, y1 - y0; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d
    offs = [0] if order == 1 else ([-6, 6] if order == 2 else [-9, 0, 9])
    for o in offs:
        c.drawLine(x0 + nx * o, y0 + ny * o, x1 + nx * o, y1 + ny * o, SP(col, w, 255 * a))


def mol(c, atoms, bonds, x, y, s=1.0, a=1.0, r=None, u=1.0, glow=None, labels=True):
    """atoms: [(el, ax, ay)] in local units; bonds: [(i, j, order)]. u reveals bonds then atoms."""
    pts = [(x + ax * s, y + ay * s) for _, ax, ay in atoms]
    for i, j, o in bonds:
        bond(c, pts[i], pts[j], o, a, sm(u * 1.5), w=7 * s)
    for k, ((el, _, _), p) in enumerate(zip(atoms, pts)):
        rr = (r or (28 if el != 'H' else 19)) * s
        g = glow.get(k, 0) if glow else 0
        ball(c, *p, rr, el, a * sm(u * 2 - k / max(1, len(atoms))), labels, g)
    return pts


# ---------------------------------------------------------------- small molecules
def co2(c, x, y, s=1.0, a=1.0, rot=0.0):
    c.save(); c.translate(x, y); c.rotate(rot)
    mol(c, [('O', -52, 0), ('C', 0, 0), ('O', 52, 0)], [(0, 1, 2), (1, 2, 2)], 0, 0, s, a)
    c.restore()


def h2o(c, x, y, s=1.0, a=1.0, rot=0.0):
    c.save(); c.translate(x, y); c.rotate(rot)
    mol(c, [('O', 0, 0), ('H', -34, 26), ('H', 34, 26)], [(0, 1, 1), (0, 2, 1)], 0, 0, s, a)
    c.restore()


def o2(c, x, y, s=1.0, a=1.0, rot=0.0):
    c.save(); c.translate(x, y); c.rotate(rot)
    mol(c, [('O', -26, 0), ('O', 26, 0)], [(0, 1, 2)], 0, 0, s, a)
    c.restore()


# ---------------------------------------------------------------- atom
def atom(c, x, y, s, protons, neutrons, electrons=0, a=1.0, t=0.0, pu=1.0, nu=1.0, eu=1.0, radiate=0.0, seed=1, shells=True):
    """nucleus of packed protons (coral) and neutrons (slate), with electrons on rings"""
    if a <= 0.01:
        return
    n = protons + neutrons
    rs = np.random.default_rng(seed)
    order = list(rs.permutation(n))
    R = 13 * s
    pts = []
    # pack on a sunflower spiral
    for i in range(n):
        rr = R * 0.95 * math.sqrt(i + 0.5)
        th = i * 2.39996
        pts.append((x + rr * math.cos(th), y + rr * math.sin(th)))
    pts.sort(key=lambda p: -math.hypot(p[0] - x, p[1] - y))
    for i, p in enumerate(pts):
        kind = order[i] < protons
        uu = pu if kind else nu
        if uu <= 0.01:
            continue
        col = CORAL if kind else (150, 160, 190)
        q = skia.Path(); q.addCircle(*p, R * sm(uu * 1.4))
        part(c, q, col, sh=R * 0.25, a=a)
    if radiate > 0:
        for k in range(8):
            ang = k * math.pi / 4 + t
            r0 = R * 4 + 40 * ((t * 2 + k * 0.13) % 1)
            c.drawLine(x + r0 * math.cos(ang), y + r0 * math.sin(ang), x + (r0 + 24) * math.cos(ang), y + (r0 + 24) * math.sin(ang), SP(YELLOW, 5, 255 * a * radiate))
    if electrons and eu > 0:
        rings = [2, 8, 8][:]
        left = electrons; ri = 0
        while left > 0:
            m = min(left, rings[ri])
            rad = R * 4.2 + ri * 52 * s
            if shells:
                c.drawCircle(x, y, rad, SP((120, 128, 180), 2.5, 160 * a * eu))
            for j in range(m):
                ang = j * 2 * math.pi / m + t * (0.6 - 0.2 * ri) + ri
                c.drawCircle(x + rad * math.cos(ang), y + rad * math.sin(ang), 8 * s, P((120, 200, 255), 255 * a * eu))
                c.drawCircle(x + rad * math.cos(ang), y + rad * math.sin(ang), 14 * s, P((120, 200, 255), 50 * a * eu, MaskFilter=blur(6)))
            left -= m; ri += 1


# ---------------------------------------------------------------- tiles and chips
def tile(c, el, x, y, size=120, a=1.0, sc=1.0, glow=0.0, name=True, sub=None):
    if a <= 0.01:
        return
    c.save(); c.translate(x, y + 5 * math.sin(T * 1.6 + x * 0.01)); c.scale(sc, sc)
    if glow > 0:
        K.glow(c, 0, 0, size, EL[el] if el != 'C' else AMBER, glow * a)
    h = size / 2
    r = skia.RRect.MakeRectXY(skia.Rect(-h, -h, h, h), 18, 18)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-h, -h + 7, h, h + 7), 18, 18), P(tuple(v * 0.6 for v in EL[el]), 255 * a))
    c.drawRRect(r, P(EL[el], 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-h + 4, -h + 3, h - 4, -h + 10), 4, 4), P((255, 255, 255), 60 * a))
    text(c, el, 0, size * 0.18, size * 0.55, EL_TXT[el], a, 'xb', 'center')
    if name:
        text(c, sub or NAME.get(el, ''), 0, h + 40, size * 0.24, CREAM, a, 'semi', 'center')
    c.restore()


def formula(c, s, x, y, size=80, col=CREAM, a=1.0, align='center'):
    """C6H12O6 with subscripts"""
    if a <= 0.01:
        return
    import re
    toks = re.findall(r'[A-Z][a-z]?|\d+|[a-z]+|[^A-Za-z\d]', s)
    f = K.font('xb', size); fs = K.font('xb', size * 0.58)
    w = sum((fs if t.isdigit() else f).measureText(t) for t in toks)
    xx = x - (w / 2 if align == 'center' else 0)
    for t in toks:
        ff = fs if t.isdigit() else f
        c.drawString(t, xx, y + (size * 0.22 if t.isdigit() else 0), ff, P(col, 255 * a))
        xx += ff.measureText(t)
    return w


# ---------------------------------------------------------------- beads
BEAD = [(250, 198, 87), (110, 206, 130), (232, 84, 76), (92, 132, 232), (182, 160, 240), (63, 194, 169)]


def bead(c, x, y, r=34, col=AMBER, a=1.0, oh=0.0, hh=0.0, hl=0.0):
    """a monomer bead; oh/hh show an -OH stub on its right and an -H stub on its left"""
    if a <= 0.01:
        return
    x, y = jig(x, y, 2.5)
    if hl > 0:
        K.glow(c, x, y, r * 1.8, col, hl * a)
    p = skia.Path(); p.addCircle(x, y, r)
    part(c, p, col, sh=r * 0.22, a=a)
    c.drawCircle(x - r * 0.35, y - r * 0.38, r * 0.2, P((255, 255, 255), 80 * a))
    if oh > 0.01:
        bond(c, (x + r, y), (x + r + 22, y), 1, a * oh, w=5)
        ball(c, x + r + 34, y, 15, 'O', a * oh, False)
        bond(c, (x + r + 44, y), (x + r + 56, y), 1, a * oh, w=5)
        ball(c, x + r + 64, y, 10, 'H', a * oh, False)
    if hh > 0.01:
        bond(c, (x - r, y), (x - r - 14, y), 1, a * hh, w=5)
        ball(c, x - r - 22, y, 10, 'H', a * hh, False)


def string(c, p0, p1, a=1.0, u=1.0, col=(236, 226, 200)):
    bond(c, p0, p1, 1, a, u, col, 6)


def chain(c, x0, y, n, gap=88, r=30, a=1.0, cols=None, t=0.0, wave=0.0, us=None):
    pts = []
    for i in range(n):
        yy = y + wave * 14 * math.sin(t * 2 + i * 0.6)
        pts.append((x0 + i * gap, yy))
    for i in range(n - 1):
        uu = 1.0 if us is None else us[i + 1]
        string(c, pts[i], pts[i + 1], a * uu)
    for i, p in enumerate(pts):
        uu = 1.0 if us is None else us[i]
        bead(c, *p, r, (cols[i % len(cols)] if cols else AMBER), a * uu)
    return pts


# ---------------------------------------------------------------- icons
def leaf_icon(c, x, y, s=1.0, a=1.0, rot=-20):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    lf = smooth_closed([(-90, 0), (-30, -46), (60, -40), (100, 0), (60, 40), (-30, 46)])
    part(c, lf, (96, 176, 96), (72, 144, 76), sh=10, a=a)
    c.drawLine(-90, 0, 92, 0, SP((150, 210, 130), 5, 255 * a))
    for k in range(4):
        xx = -50 + k * 38
        c.drawLine(xx, 0, xx + 26, -26, SP((150, 210, 130), 3, 255 * a)); c.drawLine(xx, 0, xx + 26, 26, SP((150, 210, 130), 3, 255 * a))
    c.restore()


def cell_icon(c, x, y, s=1.0, a=1.0, t=0.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    w = 4 * math.sin(t * 1.3)
    cl = smooth_closed([(-100, -10 + w), (-60, -74), (20, -84), (90, -46), (104, 20), (60, 76), (-30, 84 - w), (-92, 50)])
    part(c, cl, (130, 110, 200), (104, 88, 170), sh=10, a=a)
    c.drawPath(smooth_closed([(-84, -6 + w), (-50, -60), (16, -68), (76, -38), (88, 16), (50, 62), (-24, 68 - w), (-78, 40)]), P((176, 156, 236), 255 * a))
    c.drawCircle(-10, 4, 30, P((110, 86, 180), 255 * a))
    for mx, my, r in ((42, -30, 14), (40, 30, 12), (-50, 34, 10)):
        c.drawOval(skia.Rect(mx - r * 1.5, my - r, mx + r * 1.5, my + r), P((240, 150, 120), 255 * a))
    c.restore()


def sun_icon(c, x, y, r=50, a=1.0, t=0.0):
    K.glow(c, x, y, r * 2.4, YELLOW, a)
    for k in range(10):
        ang = k * math.pi / 5 + t * 0.3
        c.drawLine(x + (r + 12) * math.cos(ang), y + (r + 12) * math.sin(ang), x + (r + 34) * math.cos(ang), y + (r + 34) * math.sin(ang), SP(YELLOW, 7, 255 * a))
    c.drawCircle(x, y, r, P(YELLOW, 255 * a))


def heat_waves(c, x, y, a=1.0, t=0.0):
    for k in range(3):
        p = skia.Path(); xx = x + k * 34
        p.moveTo(xx, y)
        for j in range(6):
            p.quadTo(xx + (12 if j % 2 else -12), y - 14 - j * 22 - (t * 30 % 22), xx, y - 22 - j * 22 - (t * 30 % 22))
        c.drawPath(p, SP(CORAL, 5, 255 * a))


def bread_icon(c, x, y, s=1.0, a=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    sl = smooth_closed([(-60, 60), (-64, -10), (-78, -40), (-50, -72), (0, -80), (50, -72), (78, -40), (64, -10), (60, 60)])
    part(c, sl, (190, 120, 56), (156, 94, 42), sh=8, a=a)
    c.drawPath(smooth_closed([(-48, 50), (-52, -12), (-62, -36), (-40, -60), (0, -66), (40, -60), (62, -36), (52, -12), (48, 50)]), P((240, 214, 164), 255 * a))
    c.restore()


def butter_icon(c, x, y, s=1.0, a=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-80, 20, 80, 52), P((226, 228, 236), 255 * a))
    part(c, poly([(-56, -24), (40, -24), (60, -6), (60, 34), (-56, 34)]), (252, 236, 160), (226, 206, 120), sh=8, a=a)
    part(c, poly([(-56, -24), (40, -24), (60, -6), (-36, -6)]), (255, 246, 196), (240, 220, 150), sh=4, a=a)
    c.restore()


def cheese_icon(c, x, y, s=1.0, a=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    part(c, poly([(-70, 40), (70, 40), (70, -30), (-10, -50)]), (246, 182, 60), (214, 150, 44), sh=8, a=a)
    part(c, poly([(-70, 40), (-10, -50), (70, -30), (-62, 30)]), (252, 206, 96), (240, 186, 70), sh=3, a=a)
    for hx, hy, r in ((10, 10, 9), (40, 22, 6), (-24, 24, 7), (46, -8, 6)):
        c.drawCircle(hx, hy, r, P((214, 150, 44), 255 * a))
    c.restore()


def dna_icon(c, x, y, s=1.0, a=1.0, t=0.0, n=9):
    c.save(); c.translate(x, y); c.scale(s, s)
    cols = [CORAL, TEAL, YELLOW, BLUE]
    for i in range(n):
        yy = -90 + i * 180 / (n - 1)
        ph = i * 0.7 + t * 1.2
        x1, x2 = 46 * math.sin(ph), -46 * math.sin(ph)
        dep = math.cos(ph)
        c.drawLine(x1, yy, x2, yy, SP(cols[i % 4], 7, 255 * a))
        for xx, d in ((x1, dep), (x2, -dep)):
            c.drawCircle(xx, yy, 9 + 2 * d, P((200, 206, 240) if d > 0 else (150, 156, 200), 255 * a))
    c.restore()


def enzyme(c, x, y, s=1.0, a=1.0, mouth=0.5, col=(110, 206, 180), rot=0.0):
    """an enzyme as a rounded protein blob with an active site notch that opens (mouth 0..1)"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    m = 0.15 + 0.35 * mouth
    pts = []
    for i in range(40):
        ang = m + (2 * math.pi - 2 * m) * i / 39
        rr = 90 + 8 * math.sin(ang * 5)
        pts.append((rr * math.cos(ang), rr * math.sin(ang)))
    pts.append((20, 0))
    part(c, poly(pts), col, sh=12, a=a)
    c.drawCircle(-20, -40, 10, P((255, 255, 255), 50 * a))
    c.restore()


def arrow_label(c, s, x, y, col=AMBER, size=40, a=1.0):
    K.pill(c, s, x, y, col, size, a)
