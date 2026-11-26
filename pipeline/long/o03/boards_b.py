"""Teaching boards, part B (sp2, sp, sigma and pi bonds, the counting shortcut): the one navy board, never zooms.
Colour story from orb.py: the s orbital is red, p orbitals are white, hybrids are pink (sp2 deeper than sp3, sp deepest).
Everything comes on with its word. Models may turn or tilt slowly (the diagram moves, the board does not)."""
import math
import skia
import kit as K
import orb as O
from kit import P, SP, C, sm, W, H, text, pill, chip, arrow, label, AMBER, CORAL, TEAL, YELLOW, GREEN, CREAM, INK2, NAVY, BLUE, LILAC
from base import Bt, cue, fin, ua, lightbar, board, check, cross, title, ww, cues, tx, hw, panel, tag, pulse

HP = math.pi / 2


def lerp(a, b, u):
    return a + (b - a) * u


def plus(c, x, y, a, s=1.0, col=CREAM):
    if a > 0.01:
        c.drawLine(x - 20 * s, y, x + 20 * s, y, SP(col, 8 * s, 255 * a)); c.drawLine(x, y - 20 * s, x, y + 20 * s, SP(col, 8 * s, 255 * a))


def badge(c, n, x, y, a, r=30):
    if a > 0.01:
        c.drawCircle(x, y, r * (0.7 + 0.3 * a), P(AMBER, 255 * a)); text(c, str(n), x, y + r * 0.4, r * 1.2, NAVY, a, 'xb', 'center')


def loop(c, x0, y0, x1, y1, a, col=AMBER):
    if a > 0.01:
        r = min(x1 - x0, y1 - y0) / 2; rr = skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)
        c.drawRRect(rr, P(col, 30 * a)); c.drawRRect(rr, SP(col, 6, 255 * a))


def gatom(c, x, y, r, col, a=1.0):
    """a plain atom with no letter (any atom)"""
    O.atom(c, x, y, 'C', r, a, col=col, label=False)


def model(c, x, y, items, yaw, pitch, a=1.0, plane=0.0, plane_r=1.0, scale=1.0):
    """a small 3D orbital model. items: (kind, origin3, dir3, L, col, u, extra) with kind 'hyb' | 'lobe' | 'H' | 'nuc';
    depth sorted by the far end. plane: alpha of a faint disc in the x z plane (radius plane_r units of scale)."""
    if a <= 0.01: return
    if plane > 0.01:
        pts = []
        for i in range(48):
            th = i / 48 * 2 * math.pi; dx, dy, z = O.proj((math.cos(th) * plane_r, 0, math.sin(th) * plane_r), yaw, pitch, scale); pts.append(skia.Point(x + dx, y + dy))
        pp = skia.Path(); pp.addPoly(pts, True)
        c.drawPath(pp, P((120, 140, 230), 46 * plane * a)); c.drawPath(pp, SP((170, 186, 250), 3, 150 * plane * a))
    dl = []
    for it in items:
        kind, o, d, L, col, u = it[:6]
        ox, oy, oz = O.proj(o, yaw, pitch, scale)
        if kind == 'nuc': dl.append((oz, it, ox, oy, 0, 0)); continue
        ex, ey, ez = O.proj((o[0] + d[0], o[1] + d[1], o[2] + d[2]), yaw, pitch, scale)
        dl.append((oz * 0.4 + ez * 0.6 + (0.002 if kind == 'H' else 0), it, ox, oy, ex - ox, ey - oy))
    for z, it, ox, oy, dx, dy in sorted(dl, key=lambda q: q[0]):
        kind, o, d, L, col, u = it[:6]
        if kind == 'nuc': O.nucleus(c, x + ox, y + oy, a * u); continue
        n = math.hypot(dx, dy); ang = math.atan2(dy, dx); Ls = L * n / max(1e-6, scale)
        if kind == 'hyb': O.hyb(c, x + ox, y + oy, Ls, ang, col, a, u)
        elif kind == 'lobe': O.lobe(c, x + ox, y + oy, Ls, ang, col, a, max(10.0, min(L * 0.62, Ls * 0.9 + L * 0.25)), u)
        elif kind == 'H': O.atom(c, x + ox + dx * L / scale, y + oy + dy * L / scale, 'H', it[6] if len(it) > 6 else 28, a * u)


def fan(c, x, y, r, t, a):
    """a little ceiling fan seen from below: three blades 120° apart, turning"""
    if a <= 0.01: return
    c.saveLayerAlpha(None, int(255 * a))
    c.drawLine(x, y - r * 1.45, x, y, SP(INK2, 8)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 46, y - r * 1.45 - 14, x + 46, y - r * 1.45 + 6), 8, 8), P(INK2))
    for i in range(3):
        ang = t * 1.6 + i * 2 * math.pi / 3
        pth, T = O._lobe(x, y, r, r * 0.42, ang)
        c.drawPath(pth, P((226, 196, 150))); c.drawPath(pth, SP((255, 236, 200), 3, 200))
    c.drawCircle(x, y, r * 0.2, P(INK2)); c.drawCircle(x, y, r * 0.09, P(AMBER))
    c.restore()


# ------------------------------------------------------------------ d1: sp2
def d1(c, t):
    k = 'd1'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    out = 1 - ua(t, c2 - 0.5, 0.5)                              # the mixing row leaves when the big model comes
    # ---- the mixing row: s + p + p -> three sp2 hybrids ; the third p is held back
    ta = t0 - 0.6; y = 520
    th = ww(k, 'hold') - 0.1; held = ua(t, th, 0.6)
    title(c, 'mixing fewer p orbitals', t, t0 - 1, 120, CREAM, 58)
    if out > 0.01:
        O.s_orb(c, 230, y, 104, a=out, u=ua(t, ta, 0.5))
        plus(c, 395, y, ua(t, ta + 0.3, 0.3) * out, 1.2)
        for i, px in enumerate((530, 770)):
            O.p_orb(c, px, y, 150, -HP, a=out, u=ua(t, ta + 0.5 + i * 0.2, 0.5))
        plus(c, 650, y, ua(t, ta + 0.6, 0.3) * out, 1.2)
        x3 = lerp(1010, 1690, held)
        plus(c, 890, y, ua(t, ta + 0.8, 0.3) * out * (1 - held), 1.2)
        O.p_orb(c, x3, y, 150, -HP, a=out * (1 - 0.25 * held), u=ua(t, ta + 0.9, 0.5))
        tx(c, 'held back', 1690, y + 250, 50, YELLOW, t, th + 0.5, 'xb', 'center', a=out)
        tm = c1 + 0.2
        arrow(c, (900, y), (1050, y), AMBER, 10, ua(t, ww(k, 'gets') - 0.1, 0.4), out)
        tg = ww(k, 'three', 0, c1) - 0.1
        for i in range(3):
            ang = -HP + i * 2 * math.pi / 3
            O.hyb(c, 1240, y + 20, 165, ang, O.SP2, out, ua(t, tg + i * 0.12, 0.5))
        O.nucleus(c, 1240, y + 20, out * ua(t, tg, 0.3))
        ub = ua(t, tm, 0.5) * out
        if ub > 0.01:
            c.drawLine(120, y + 185, 120 + 730 * ub, y + 185, SP(AMBER, 6, 255 * out))
            tx(c, 'mix the s with two p', 485, y + 250, 50, AMBER, t, tm + 0.2, 'semi', 'center', a=out)
        tx(c, 'three hybrids', 1240, y + 250, 50, O.SP2, t, tg + 0.2, 'semi', 'center', a=out)
    tn = max(ww(k, 'S', 0, c1) - 0.15, ww(k, 'three', 0, c1) + 0.5)      # only once the three hybrids exist, and right under them
    un = ua(t, tn, 0.4)
    if un > 0.01:
        mv = ua(t, c2 - 0.5, 0.6)
        O.hyb_chip(c, 'sp2', lerp(1240, 1700, mv), lerp(y + 370, 300, mv), 84, un, 0.85 + 0.15 * un)
    # ---- the big model: seen from above first (flat, 120° apart), then it tilts and the leftover p stands up through the plane
    am = ua(t, c2 - 0.2, 0.5)
    if am > 0.01:
        tilt = ua(t, c3 - 0.9, 1.6)
        pitch = lerp(HP, 0.42, tilt); yaw = 0.25 + 0.16 * (t - c2) * (0.25 + 0.75 * tilt)
        cx, cy = 720, 640; L = 300
        items = [('hyb', (0, 0, 0), d, L, O.SP2, 1.0) for d in O.TRI]
        up = ua(t, ww(k, 'leftover', 0, c3) - 0.2, 0.8)
        if up > 0.01:
            items += [('lobe', (0, 0, 0), (0, 1, 0), 260, O.P_COL, up), ('lobe', (0, 0, 0), (0, -1, 0), 260, O.P_COL, up)]
        items.append(('nuc', (0, 0, 0), None, 0, None, 1.0))
        model(c, cx, cy, items, yaw, pitch, am, plane=tilt, plane_r=1.22, scale=L)
        # 120° arcs while it is seen from above
        aa = ua(t, ww(k, 'one', 0, c2) - 0.2, 0.5) * (1 - tilt) * am
        if aa > 0.01:
            dirs = []
            for d in O.TRI:
                dx, dy, z = O.proj(d, yaw, pitch, L); dirs.append(math.atan2(dy, dx))
            dirs.sort()
            for i in range(3):
                a0 = dirs[i]; a1 = dirs[(i + 1) % 3] + (2 * math.pi if i == 2 else 0)
                O.arc(c, cx, cy, 120, a0 + 0.22, a1 - 0.22, aa, 1.0, AMBER, 6)
                mid = (a0 + a1) / 2; text(c, '120°', cx + 200 * math.cos(mid), cy + 200 * math.sin(mid) + 18, 54, AMBER, aa, 'xb', 'center')
        fl = ua(t, ww(k, 'FLAT') - 0.15, 0.4) * (1 - ua(t, c3 - 0.5, 0.4))
        tx(c, 'flat, 120° apart', 1420, 470, 64, CREAM, t, ww(k, 'FLAT') - 0.15, 'xb', 'center', a=1 - ua(t, c3 - 0.5, 0.4))
        tf = ww(k, 'ceiling') - 0.5
        fan(c, 1420, 760, 150, t, ua(t, tf, 0.5) * (1 - ua(t, c3 - 0.5, 0.4)))
        tx(c, 'like a ceiling fan', 1420, 985, 54, INK2, t, tf + 0.3, 'semi', 'center', a=1 - ua(t, c3 - 0.5, 0.4))
        # the leftover p
        tl_ = ww(k, 'leftover', 0, c3) - 0.2
        al = ua(t, tl_ + 0.3, 0.4)
        if al > 0.01:
            label(c, 'leftover p orbital', 1120, 420, CREAM, 54, al, dot=(cx + 30, cy - 180))
            tx(c, 'straight up', 1120, 530, 54, INK2, t, ww(k, 'straight') - 0.1, 'semi')
            tx(c, 'through the plane', 1120, 598, 54, INK2, t, ww(k, 'straight') + 0.3, 'semi')
            tx(c, 'one lobe above', 1120, 710, 58, O.P_COL, t, ww(k, 'above') - 0.3, 'xb')
            tx(c, 'one lobe below', 1120, 795, 58, O.P_COL, t, ww(k, 'below') - 0.3, 'xb')
            label(c, 'three sp² hybrids, flat', 1120, 930, O.SP2, 52, ua(t, tl_ + 1.2, 0.4), dot=(cx + 230, cy + 70))


# ------------------------------------------------------------------ d2: sp
def d2(c, t):
    k = 'd2'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    title(c, 'mix the s with just one p', t, t0 - 1, 120, CREAM, 58)
    tm = ww(k, 'Those') - 0.2; am = ua(t, tm, 0.5)
    mvu = ua(t, tm - 0.5, 0.7); y = lerp(560, 330, mvu); q = lerp(1.5, 1.0, mvu)      # big and centred first, then up to make room
    ts = t0 - 0.6; tp = ww(k, 'one') - 0.1
    O.s_orb(c, 250, y, 74 * q, u=ua(t, ts, 0.5)); plus(c, 420, y, ua(t, tp - 0.2, 0.3), q); O.p_orb(c, 580, y, 100 * q, -HP, u=ua(t, tp, 0.5))
    tg = ww(k, 'pair') - 0.2
    arrow(c, (720, y), (880, y), AMBER, 9, ua(t, ww(k, 'gets') - 0.1, 0.4))
    for i in range(2): O.hyb(c, 1130, y, 135 * q, i * math.pi, O.SP1, 1.0, ua(t, tg + i * 0.15, 0.5))
    O.nucleus(c, 1130, y, ua(t, tg, 0.3))
    tn = ww(k, 'plain') - 0.1
    un = ua(t, tn, 0.4)
    O.hyb_chip(c, 'sp', 1560, y + 6, 84 * (0.85 + 0.15 * q), un, 0.85 + 0.15 * un)
    tx(c, 'no number', 1560, y + 110, 52, YELLOW, t, ww(k, 'no') - 0.1, 'xb', 'center')
    if mvu < 0.99:
        tx(c, 'the s + one p', 420, y + 250, 54, AMBER, t, tp + 0.3, 'semi', 'center', a=1 - mvu)
        tx(c, 'a pair of hybrids', 1130, y + 250, 54, O.SP1, t, tg + 0.3, 'semi', 'center', a=1 - mvu)
    # ---- the big model: two hybrids on a line; later two leftover p orbitals turning about that line
    if am > 0.01:
        cx, cy = 700, 730; L = 290
        yaw = 0.42; pitch = 0.2; ph = 0.3 * (t - c2)
        items = [('hyb', (0, 0, 0), (1, 0, 0), L, O.SP1, ua(t, tm, 0.6)), ('hyb', (0, 0, 0), (-1, 0, 0), L, O.SP1, ua(t, tm + 0.15, 0.6))]
        u1 = ua(t, ww(k, 'TWO') - 0.2, 0.7); u2 = ua(t, ww(k, 'TWO') + 0.2, 0.7)
        for u, d in ((u1, (0, math.cos(ph), math.sin(ph))), (u2, (0, -math.sin(ph), math.cos(ph)))):
            if u > 0.01: items += [('lobe', (0, 0, 0), d, 200, O.P_COL, u), ('lobe', (0, 0, 0), (-d[0], -d[1], -d[2]), 200, O.P_COL, u)]
        items.append(('nuc', (0, 0, 0), None, 0, None, 1.0))
        # the straight line and 180°
        tl_ = ww(k, 'one', 1) - 0.2; ul = ua(t, tl_, 0.7)
        if ul > 0.01:
            ex, ey, _ = O.proj((1.32, 0, 0), yaw, pitch, L)
            c.drawLine(cx - ex * ul, cy - ey * ul, cx + ex * ul, cy + ey * ul, skia.Paint(AntiAlias=True, Color=C(AMBER, 255 * am), Style=skia.Paint.kStroke_Style, StrokeWidth=5, PathEffect=skia.DashPathEffect.Make([18, 12], 0)))
        model(c, cx, cy, items, yaw, pitch, am, scale=L)
        if ul > 0.01:
            a2 = 1 - ua(t, c2 - 0.3, 0.4)
            O.arc(c, cx, cy, 110, math.pi, 2 * math.pi, am * a2, ul, AMBER, 6)
            text(c, '180°', cx, cy - 135, 64, AMBER, ul * am * a2, 'xb', 'center')
        tx(c, 'opposite directions', 1150, 600, 54, CREAM, t, ww(k, 'opposite') - 0.2, 'xb', a=1 - ua(t, c2 - 0.3, 0.4))
        tx(c, '180°: a straight line', 1150, 700, 54, AMBER, t, ww(k, 'straight') - 0.3, 'xb', a=1 - ua(t, c2 - 0.3, 0.4))
        tx(c, 'two leftover p orbitals', 1150, 600, 58, O.P_COL, t, ww(k, 'TWO') - 0.2, 'xb')
        tx(c, '90° to the line', 1150, 720, 54, CREAM, t, ww(k, 'right') - 0.2, 'semi')
        tx(c, '90° to each other', 1150, 810, 54, CREAM, t, ww(k, 'right', 1) - 0.2, 'semi')
        label(c, 'two sp hybrids', 1150, 940, O.SP1, 52, ua(t, ww(k, 'TWO') + 1.2, 0.4), dot=(cx + 250, cy + 26))


# ------------------------------------------------------------------ d3: ethene, sigma and pi
ETH_C = [(-1.0, 0, 0), (1.0, 0, 0)]
ETH_D = {0: [(1, 0, 0), (-0.5, 0, 0.866), (-0.5, 0, -0.866)], 1: [(-1, 0, 0), (0.5, 0, 0.866), (0.5, 0, -0.866)]}


def d3(c, t):
    k = 'd3'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'what are the leftover p orbitals for?', t, t0 - 1, 120, CREAM, 58)
    a0 = 1 - ua(t, c1 - 0.4, 0.4)                                # the question: two leftover p orbitals and a question mark
    if a0 > 0.01:
        for i, px in enumerate((760, 1160)): O.p_orb(c, px, 600, 210, -HP, a=a0, u=ua(t, t0 - 0.8 + i * 0.3, 0.6))
        text(c, '?', 960, 660, 200, AMBER, a0 * ua(t, t0 + 0.6, 0.5), 'xb', 'center')
    # ---- stage 1: the structure of ethene
    a1 = 1 - ua(t, c2 - 0.5, 0.5)
    if a1 > 0.01 and t > c1 - 0.5:
        cy = 560; xa, xb = 560, 880
        te = ww(k, 'ethene') - 0.2
        ub = ua(t, ww(k, 'double') - 0.2, 0.6)
        O.bond(c, (xa, cy), (xb, cy), a1, ub, 11, n=2, gap=26)
        th = ww(k, 'each', 0, c1) - 0.1
        for i, (cx_, sx) in enumerate(((xa, -1), (xb, 1))):
            for j, sy in enumerate((-1, 1)):
                u = ua(t, th + 0.15 * (i * 2 + j), 0.5); hx, hy = cx_ + sx * 150, cy + sy * 190
                O.bond(c, (cx_, cy), (hx, hy), a1, u); O.atom(c, hx, hy, 'H', 34, a1 * sm(u * 2 - 0.6))
            O.atom(c, cx_, cy, 'C', 54, a1 * ua(t, c1 - 0.3 + i * 0.15, 0.4))
        tx(c, 'ethene', 720, 290, 70, CREAM, t, te, 'xb', 'center', a=a1)
        tx(c, '(also called ethylene)', 720, 356, 52, INK2, t, ww(k, 'also') - 0.1, 'semi', 'center', a=a1)
        tp = ww(k, 'share') - 0.2
        panel(c, 1080, 380, 1820, 740, ua(t, ww(k, 'double') - 0.2, 0.4) * a1)
        tx(c, 'double bond', 1450, 470, 66, CREAM, t, ww(k, 'double') - 0.1, 'xb', 'center', a=a1)
        tx(c, '2 shared pairs of electrons', 1450, 560, 50, AMBER, t, tp, 'semi', 'center', a=a1)
        for i in range(2):
            u = ua(t, tp + 0.3 + i * 0.3, 0.4) * a1
            O.lone(c, 1380 + i * 140, 650, HP, u, r=11, sep=18)
        ts = ww(k, 'Both') - 0.1
        for i, cx_ in enumerate((xa, xb)):
            u = ua(t, ts + 0.6 + i * 0.2, 0.4) * a1; O.hyb_chip(c, 'sp2', cx_, cy + 330 - 0, 60, u, 0.85 + 0.15 * u)
            if u > 0.01: c.drawLine(cx_, cy + 64, cx_, cy + 250, SP(O.SP2, 4, 200 * u))
    # ---- stage 2 and 3: the orbital picture. Seen from above (the molecule's plane is the screen), then it tilts to show the p orbitals
    a2 = ua(t, c2 - 0.2, 0.5)
    if a2 > 0.01:
        ttilt = ww(k, 'spot') - 0.3; tilt = ua(t, ttilt, 2.6)
        pitch = lerp(HP, 0.36, tilt); yaw = 0.0 + 0.1 * tilt + 0.05 * tilt * math.sin((t - c3) * 0.5)
        cx, cy = 960, lerp(560, 590, tilt); S = 270
        tcc = ww(k, 'points') - 0.2; tch = ww(k, 'its', 0, c2) - 0.2
        items = []
        for i in (0, 1):
            o = ETH_C[i]
            items.append(('hyb', o, ETH_D[i][0], 315, O.SP2, ua(t, tcc, 0.7)))
            for j in (1, 2):
                u = ua(t, tch + 0.15 * (i * 2 + j), 0.6)
                items.append(('hyb', o, ETH_D[i][j], 205, O.SP2, u)); items.append(('H', o, ETH_D[i][j], 238, None, sm(u * 2 - 1), 34))
            items.append(('nuc', o, None, 0, None, 1.0))
        tpz = ww(k, 'leftover', 0, c3) - 0.3
        up = ua(t, tpz, 0.9)
        lean = ua(t, ww(k, 'They', 0, c3) - 0.1, 1.2)
        # the pi cloud and p lobes go between the back and front hybrids: draw back items, then p, then front
        back = [it for it in items if it[0] != 'nuc' and (it[1][2] + (it[2][2] if it[2] else 0)) < -0.1]
        front = [it for it in items if it not in back]
        model(c, cx, cy, back, yaw, pitch, a2, plane=sm((tilt - 0.8) / 0.2) * 0.9, plane_r=1.75, scale=S)
        def plobes(sgn):
            for i in (0, 1):
                ox, oy, oz = O.proj(ETH_C[i], yaw, pitch, S)
                Lp = 240 * math.cos(pitch)
                O.lobe(c, cx + ox, cy + oy, Lp, -sgn * HP + (0.0), O.P_COL, a2, 124 + 30 * lean, up)
        def cloud(sgn):
            if lean <= 0.01: return
            ox0, oy0, _ = O.proj(ETH_C[0], yaw, pitch, S); ox1, oy1, _ = O.proj(ETH_C[1], yaw, pitch, S)
            yy = cy + (oy0 + oy1) / 2 - sgn * 150; xa_, xb_ = cx + ox0 - 118, cx + ox1 + 118; xm = (xa_ + xb_) / 2; hh = 66 * (0.6 + 0.4 * lean)
            # one shaped lobe spanning both carbons (the two p lobes on this side, merged): fat over each carbon, a soft waist between
            pp = skia.Path(); pp.moveTo(xa_, yy)
            pp.cubicTo(xa_, yy - hh * 1.25, xm - 150, yy - hh * 1.05, xm, yy - hh * 0.72); pp.cubicTo(xm + 150, yy - hh * 1.05, xb_, yy - hh * 1.25, xb_, yy)
            pp.cubicTo(xb_, yy + hh * 1.25, xm + 150, yy + hh * 1.05, xm, yy + hh * 0.72); pp.cubicTo(xm - 150, yy + hh * 1.05, xa_, yy + hh * 1.25, xa_, yy); pp.close()
            al_ = lean * a2
            c.drawPath(pp, P(O.P_COL, 60 * al_, MaskFilter=K.blur(14)))
            sh = skia.GradientShader.MakeLinear([skia.Point(xm, yy - hh * 1.2), skia.Point(xm, yy + hh * 1.2)], [C((255, 255, 255), 225 * al_), C(O.P_COL, 205 * al_), C(O.mix(O.P_COL, (40, 30, 90), 0.4), 195 * al_)], [0.0, 0.5, 1.0])
            c.drawPath(pp, skia.Paint(AntiAlias=True, Shader=sh)); c.drawPath(pp, SP((255, 255, 255), 2.5, 170 * al_))
        if up > 0.01: plobes(-1); cloud(-1)
        model(c, cx, cy, [it for it in front if it[0] == 'hyb' and it[2][2] == 0], yaw, pitch, a2, scale=S)      # the two head on hybrids
        # the overlap between the nuclei
        tov = ww(k, 'overlap') - 0.2; uo = ua(t, tov, 0.5)
        if uo > 0.01:
            pu = 0.6 + 0.4 * pulse(t, tov, 1.2)
            c.drawOval(skia.Rect(cx - 72, cy - 46, cx + 72, cy + 46), P(TEAL, 120 * uo * pu * a2, MaskFilter=K.blur(10)))
            c.drawOval(skia.Rect(cx - 66, cy - 40, cx + 66, cy + 40), SP(TEAL, 5, 255 * uo * a2))
        if up > 0.01: plobes(1); cloud(1)
        model(c, cx, cy, [it for it in front if not (it[0] == 'hyb' and it[2][2] == 0)], yaw, pitch, a2, scale=S)
        # labels
        tsg = ww(k, 'sigma') - 0.2; us = ua(t, tsg, 0.4)
        if us > 0.01:
            c.drawLine(300, 908, cx - 46, cy + 40, SP(TEAL, 3.5, 210 * us * a2)); c.drawCircle(cx - 46, cy + 40, 7, P(TEAL, 255 * us * a2))
            tag(c, 'sigma bond (σ): head on', 110, 962, TEAL, us * a2, 50, 'left')
        tev = ww(k, 'every', 0, c2) - 0.1
        ae = ua(t, tev, 0.4) * (1 - ua(t, ttilt - 0.2, 0.4)) * a2
        if ae > 0.01:
            for i in (0, 1):
                for j in (1, 2):
                    dx, dy, _ = O.proj((ETH_C[i][0] + ETH_D[i][j][0] * 0.62, 0, ETH_D[i][j][2] * 0.62), yaw, pitch, S)
                    c.drawCircle(cx + dx, cy + dy, 28, P(NAVY, 230 * ae)); text(c, 'σ', cx + dx, cy + dy + 15, 44, TEAL, ae, 'xb', 'center')
            text(c, 'every single bond is a σ bond', 1400, 962, 52, CREAM, ae, 'semi', 'center')
        tpi = ww(k, 'pi') - 0.2; upi = ua(t, tpi, 0.4)
        if upi > 0.01:
            ox1, oy1, _ = O.proj(ETH_C[1], yaw, pitch, S)
            c.drawLine(1580, 908, cx + ox1 + 60, cy + oy1 + 196, SP(O.P_COL, 3.5, 210 * upi * a2)); c.drawCircle(cx + ox1 + 60, cy + oy1 + 196, 7, P(O.P_COL, 255 * upi * a2))
            tag(c, 'pi bond (π): sideways', 1180, 962, O.P_COL, upi * a2, 50, 'left')
        if up > 0.01:
            label(c, 'leftover p orbitals', 1380, 300, O.P_COL, 52, ua(t, tpz + 0.3, 0.4) * a2, dot=(cx + S + 30, cy - 170))
            usd = ua(t, ww(k, 'side') - 0.2, 0.4) * a2 * (1 - 0.0)
            if usd > 0.01:                                   # 'side by side' sits between the two p orbitals, a short leader to each
                for sx in (-1, 1): c.drawLine(960 + sx * 150, 300, 960 + sx * 215, 350, SP(CREAM, 3.5, 210 * usd))
                text(c, 'side by side', 960, 315, 54, CREAM, usd, 'xb', 'center')
        ttk = ww(k, 'taken') - 0.5
        tx(c, 'this spot is taken', 960, 868, 54, TEAL, t, ttk, 'xb', 'center', a=(1 - ua(t, tpz - 0.2, 0.4)) * a2)
        tx(c, 'overlap above and below the plane', 960, 868, 54, YELLOW, t, ww(k, 'above') - 0.3, 'xb', 'center', a=a2)


# ------------------------------------------------------------------ d4: counting sigma and pi
def cc(c, x, y, n, a, u=1.0, r=34, d=150):
    """a small C-C glyph with n bond lines"""
    O.bond(c, (x, y), (x + d, y), a, u, 8, n=n, gap=15); O.atom(c, x, y, 'C', r, a); O.atom(c, x + d, y, 'C', r, a)


def sig_sk(c, x, y, a):
    """a tiny sigma picture: two hybrids meeting head on"""
    if a <= 0.01: return
    O.hyb(c, x - 62, y, 74, 0, O.SP2, a, 1.0, back=False); O.hyb(c, x + 62, y, 74, math.pi, O.SP2, a, 1.0, back=False)
    c.drawOval(skia.Rect(x - 20, y - 26, x + 20, y + 26), SP(TEAL, 4, 255 * a))


def pi_sk(c, x, y, a):
    """a tiny pi picture: two p orbitals side by side, joined above and below"""
    if a <= 0.01: return
    for sgn in (-1, 1):
        rr = skia.RRect.MakeRectXY(skia.Rect(x - 50, y + sgn * 36 - 20, x + 50, y + sgn * 36 + 20), 20, 20); c.drawRRect(rr, P(O.P_COL, 110 * a, MaskFilter=K.blur(7)))
    for dx in (-30, 30): O.p_orb(c, x + dx, y, 58, -HP, a=a, wid=34)


def d4(c, t):
    k = 'd4'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    title(c, 'counting sigma and pi bonds', t, t0 - 1, 120, CREAM, 58)
    a1 = 1 - ua(t, c2 - 0.5, 0.4); a2 = ua(t, c2 - 0.2, 0.4)
    rows = ((360, 2, 'double bond', min(t0 + 0.3, ww(k, 'double') - 0.2), ww(k, 'one') - 0.15, ww(k, 'plus') - 0.1, '1 π', 1),
            (610, 3, 'triple bond', ww(k, 'triple') - 0.2, ww(k, 'one', 0, c1) - 0.15, ww(k, 'plus', 1) - 0.1, '2 π', 2))
    if a1 > 0.01:
        lightbar(c, t, 360, rows[0][3], c1 - 0.1, 90, 1830, 190); lightbar(c, t, 610, c1, ww(k, 'every') - 0.4, 90, 1830, 190)
        for y, n, name, ta, tb, tc, pi_, npi in rows:
            ua_ = ua(t, ta, 0.4) * a1
            if ua_ < 0.99 * a1:                                 # the row waits faintly until its words
                g_ = 0.3 * a1 * (1 - ua(t, ta, 0.4)) * ua(t, t0 - 1, 0.3); cc(c, 150, y - 24, n, g_, 1.0, 42, 180); text(c, name, 420, y, 66, CREAM, g_, 'xb')
            cc(c, 150, y - 24, n, ua_, ua(t, ta, 0.6), 42, 180)
            tx(c, name, 420, y, 66, CREAM, t, ta, 'xb', a=a1)
            tx(c, '=', 870, y, 66, INK2, t, tb - 0.2, 'xb', a=a1)
            tag(c, '1 σ', 1010, y, TEAL, ua(t, tb, 0.35) * a1, 62)
            plus(c, 1120, y - 24, ua(t, tc, 0.3) * a1)
            tag(c, pi_, 1230, y, O.P_COL, ua(t, tc + 0.15, 0.35) * a1, 62)
            sig_sk(c, 1470, y - 24, ua(t, tb + 0.2, 0.4) * a1)
            for j in range(npi): pi_sk(c, 1650 + j * 120, y - 24, ua(t, tc + 0.3 + j * 0.2, 0.4) * a1)
        te = ww(k, 'every') - 0.2
        panel(c, 110, 790, 1810, 940, max(0.4 * ua(t, t0 - 1, 0.3), ua(t, te, 0.4)) * a1)
        O.p_orb(c, 200, 865, 56, -HP, a=a1, u=ua(t, te + 0.2, 0.4))
        tx(c, 'each π bond uses up one unmixed p orbital on each atom', 280, 884, 52, CREAM, t, te + 0.1, 'semi', a=a1)
    # ---- read it backwards (the rule stays as one line under the title)
    if a2 > 0.01:
        text(c, 'double bond = 1 σ + 1 π          triple bond = 1 σ + 2 π', 960, 240, 54, CREAM, a2, 'semi', 'center')
        tb_ = ww(k, 'read') - 0.3
        hw(c, 'read the rule backwards:', 130, 400, 72, AMBER, t, tb_, 0.9)
        r2 = ((600, 2, 'one double bond', ww(k, 'one', 0, c2) - 0.3, ww(k, 'keep') - 0.1, 'keep 1 p out', ww(k, 'S', 0, c2) - 0.2, 'sp2'),
              (850, 3, 'a triple bond', ww(k, 'triple', 0, c2) - 0.5, ww(k, 'keep', 1) - 0.1, 'keep 2 p out', ww(k, 'plain') - 0.1, 'sp'))
        for y, n, name, ta, tk, keep, tch, kind in r2:
            panel(c, 110, y - 120, 1810, y + 80, max(0.5 * a2, ua(t, ta, 0.4)))
            cc(c, 190, y - 22, n, 0.35 * a2 * (1 - ua(t, ta, 0.4)), 1.0, 36, 150)
            cc(c, 190, y - 22, n, ua(t, ta, 0.4), ua(t, ta, 0.6), 36, 150)
            tx(c, name, 400, y, 58, CREAM, t, ta, 'xb')
            arrow(c, (910, y - 22), (990, y - 22), AMBER, 8, ua(t, tk - 0.2, 0.35))
            tx(c, keep, 1020, y, 60, O.P_COL, t, tk, 'xb')
            arrow(c, (1425, y - 22), (1510, y - 22), AMBER, 8, ua(t, tch - 0.25, 0.35))
            u = ua(t, tch, 0.4); O.hyb_chip(c, kind, 1660, y, 84, u, 0.85 + 0.15 * u)


# ------------------------------------------------------------------ e1: count electron groups
def e1(c, t):
    k = 'e1'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    a0 = 1 - ua(t, c1 - 0.5, 0.4)
    if a0 > 0.01:
        hw(c, "there's a shortcut...", 1250, 520, 100, CREAM, t, ww(k, 'shortcut') - 0.5, 0.9, 'center', a0)
        hw(c, "it's just counting", 1250, 700, 100, AMBER, t, ww(k, 'just') - 0.3, 0.8, 'center', a0)
    title(c, 'count the electron groups', t, t0 - 1, 120, CREAM, 58)
    # ---- the model on the left: any atom, with a single bond, a lone pair and a double bond
    cx, cy = 420, 610
    am = ua(t, c1, 0.5)
    CEN = (96, 178, 170); NB = (120, 128, 166)
    tb = ww(k, 'bond', 0, c2) - 0.2; tlp = ww(k, 'lone') - 0.2; td = ww(k, 'double') - 0.2; tone = ww(k, 'ONE') - 0.2
    if am <= 0.01: gatom(c, cx, cy, 62, CEN, ua(t, t0 - 1, 0.3))
    if am > 0.01:
        ug = ua(t, ww(k, 'groups') - 0.5, 0.6)
        if ug > 0.01:
            c.drawCircle(cx, cy, 250, skia.Paint(AntiAlias=True, Color=C(AMBER, 150 * ug * (1 - 0.6 * ua(t, c2, 0.5))), Style=skia.Paint.kStroke_Style, StrokeWidth=4, PathEffect=skia.DashPathEffect.Make([14, 14], t * 6)))
        # single bond, up left
        p1 = (cx - 190, cy - 150); p2 = (cx + 215, cy + 130)
        O.bond(c, (cx, cy), p1, am, ua(t, c1 + 0.2, 0.5)); gatom(c, p1[0], p1[1], 40, NB, am * ua(t, c1 + 0.5, 0.3))
        O.bond(c, (cx, cy), p2, am, ua(t, c1 + 0.5, 0.5), n=2, gap=20); gatom(c, p2[0], p2[1], 40, NB, am * ua(t, c1 + 0.8, 0.3))
        gatom(c, cx, cy, 62, CEN, 1.0)
        O.lone(c, cx, cy, -0.5, am * ua(t, c1 + 0.8, 0.4), r=10, sep=17, d=88)
        text(c, 'the atom', cx, cy + 320, 54, INK2, ua(t, t0 - 0.5, 0.4), 'semi', 'center')
        # numbered badges land with their rows
        badge(c, 1, cx - 130, cy - 40, ua(t, tb, 0.35)); badge(c, 2, cx + 150, cy - 110, ua(t, tlp, 0.35))
        u3 = ua(t, tone, 0.4)
        if u3 > 0.01:
            c.save(); c.rotate(math.degrees(math.atan2(130, 215)), cx, cy); loop(c, cx + 58, cy - 34, cx + 190, cy + 34, u3); c.restore()
            badge(c, 3, cx + 60, cy + 150, u3)
        text(c, '3 groups', cx, cy + 395, 60, AMBER, ua(t, tone + 0.6, 0.4), 'xb', 'center')
    # ---- what counts as a group
    X = 820
    ua1 = ua(t, tb, 0.4)
    panel(c, X, 220, 1830, 380, ua1)
    O.bond(c, (X + 70, 300), (X + 190, 300), ua1, ua(t, tb, 0.5)); gatom(c, X + 70, 300, 30, CEN, ua1); gatom(c, X + 190, 300, 26, NB, ua1)
    tx(c, 'a bond to a neighbor', X + 240, 318, 54, CREAM, t, tb + 0.1, 'xb')
    check(c, 1775, 300, 0.7, ua(t, tb + 0.9, 0.3))
    ua2 = ua(t, tlp, 0.4)
    panel(c, X, 410, 1830, 600, ua2)
    gatom(c, X + 100, 520, 30, CEN, ua2); O.lone(c, X + 100, 520, -HP, ua2, r=9, sep=14, d=48)
    tx(c, 'a lone pair', X + 240, 488, 54, CREAM, t, tlp + 0.1, 'xb')
    tx(c, '2 electrons kept by the atom', X + 240, 560, 48, INK2, t, ww(k, 'two') - 0.2, 'semi')
    check(c, 1775, 470, 0.7, ua(t, tlp + 1.0, 0.3))
    ua3 = ua(t, td, 0.4)
    panel(c, X, 630, 1830, 830, ua3, edge=AMBER if t > tone else (90, 104, 170))
    for i, (n, tt) in enumerate(((2, td), (3, ww(k, 'triple') - 0.2))):
        u = ua(t, tt, 0.4); x0 = X + 40 + i * 180
        O.bond(c, (x0, 730), (x0 + 110, 730), u, 1.0, 7, n=n, gap=14); gatom(c, x0, 730, 26, CEN, u); gatom(c, x0 + 110, 730, 24, NB, u)
        loop(c, x0 + 22, 696, x0 + 88, 764, ua(t, tone + i * 0.2, 0.4)); badge(c, 1, x0 + 55, 668, ua(t, tone + i * 0.2, 0.4), 24)
    tx(c, 'double or triple bond:', X + 390, 712, 50, CREAM, t, td + 0.1, 'xb')
    tx(c, 'counts as ONE group', X + 390, 784, 54, AMBER, t, tone - 0.3, 'xb')
    ts = ww(k, 'Only') - 0.2
    tx(c, 'only its σ bond sits in a hybrid', X + 10, 910, 50, TEAL, t, ww(k, 'sigma') - 0.3, 'semi')
    tx(c, 'the π bonds use the leftover p orbitals', X + 10, 982, 50, O.P_COL, t, ww(k, 'pi') - 0.3, 'semi')


# ------------------------------------------------------------------ e2: read off the answer
def mini(c, x, y, kind, t, a, u):
    """a small fixed picture of 4, 3 or 2 hybrids: sp3 in a tetrahedral 3D view (one lobe up, two to the sides, one toward the
    viewer, foreshortened), sp2 three flat lobes, sp two opposite lobes"""
    if a <= 0.01 or u <= 0.01: return
    if kind == 'sp3':
        O.tetra(c, x, y + 8, 84, 0.62, a, (u, u, u, u), O.SP3, pitch=0.42, back=False)
    elif kind == 'sp2':
        for i in range(3): O.hyb(c, x, y + 8, 78, -HP + i * 2 * math.pi / 3, O.SP2, a, u, back=False)
        O.nucleus(c, x, y + 8, a)
    else:
        for i in range(2): O.hyb(c, x, y, 86, i * math.pi, O.SP1, a, u, back=False)
        O.nucleus(c, x, y, a)


def e2(c, t):
    k = 'e2'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'then read off the answer', t, t0 - 1, 120, CREAM, 58)
    tw = ww(k, 'Why') - 0.2
    rows = ((330, '4 groups', 'sp3', ww(k, 'four') - 0.2, ww(k, 'S') - 0.2, c2 - 0.2, '4 hybrids'),
            (510, '3 groups', 'sp2', ww(k, 'three', 0, c2) - 0.2, ww(k, 'S', 1) - 0.2, c3 - 0.2, '3 hybrids'),
            (690, '2 groups', 'sp', ww(k, 'pair') - 0.3, ww(k, 'plain') - 0.1, tw - 0.2, '2 hybrids'))
    th = ww(k, 'needs') - 0.2
    for i, (y, s, kind, ta, tb, toff, hs) in enumerate(rows):
        panel(c, 150, y - 100, 1770, y + 60, max(0.5 * ua(t, t0 - 1, 0.3), ua(t, ta, 0.4)))
        lightbar(c, t, y + 8, ta, toff, 150, 1770, 160)
        if t < ta + 0.6: c.saveLayerAlpha(None, int(80 * ua(t, t0 - 1, 0.3) * (1 - ua(t, ta, 0.5)))); K.hand(c, s, 220, y, 84, CREAM, 1.0); c.restore()
        hw(c, s, 220, y, 84, CREAM, t, ta, 0.6)
        arrow(c, (640, y - 26), (800, y - 26), AMBER, 9, ua(t, tb - 0.3, 0.35))
        u = ua(t, tb, 0.4); O.hyb_chip(c, kind, 960, y, 84, u, 0.85 + 0.15 * u)
        um = ua(t, th + i * 0.25, 0.6)
        mini(c, 1290, y - 22, kind, t, um, um)
        tx(c, hs, 1450, y - 4, 54, O.HYB[kind], t, th + 0.3 + i * 0.25, 'xb')
    te = ww(k, 'Every') - 0.2
    tx(c, 'each σ bond and each lone pair needs one hybrid', 960, 860, 54, CREAM, t, te, 'xb', 'center')
    tx(c, 'number of groups = number of orbitals the atom mixed', 960, 960, 52, AMBER, t, ww(k, 'number') - 0.2, 'semi', 'center')


SCENES = dict(d1=d1, d2=d2, d3=d3, d4=d4, e1=e1, e2=e2)
