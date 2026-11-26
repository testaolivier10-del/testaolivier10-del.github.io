"""Inset pictures for the story scenes of yt-orgo-03: what the carbon is doing inside the diamond, the graphite and the
acetylene. Each is drawn inside a round inset (dark navy disc, soft rim, clipped to radius R around (x, y)).
  diamond(c, t, x, y, R, a=1.0, grow=1.0)                       every carbon bonded to four others, built outward with grow
  graphite(c, t, x, y, R, a=1.0, sheets=1.0, p=0.0, slide=0.0)  honeycomb sheets; p brings on the leftover p cloud; slide moves the top sheet off
  acetylene(c, t, x, y, R, a=1.0, count=0.0, line=0.0)          H-C≡C-H; count loops the two groups on the left carbon; line draws 180°"""
import math
import skia
import kit as K
import orb as O
from kit import P, SP, C, sm, text, CREAM, INK2, NAVY, AMBER

DISC0, DISC1 = (30, 38, 86), (10, 14, 40)


def _begin(c, x, y, R, a):
    c.saveLayerAlpha(None, int(255 * max(0.0, min(1.0, a))))
    c.drawCircle(x, y, R + 10, P((4, 6, 22), 120, MaskFilter=K.blur(18)))
    sh = skia.GradientShader.MakeRadial(skia.Point(x, y - R * 0.2), R * 1.25, [C(DISC0), C(DISC1)], [0, 1])
    c.drawCircle(x, y, R, skia.Paint(AntiAlias=True, Shader=sh))
    c.save(); p = skia.Path(); p.addCircle(x, y, R); c.clipPath(p, skia.ClipOp.kIntersect, True)


def _end(c, x, y, R):
    vg = skia.GradientShader.MakeRadial(skia.Point(x, y), R, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((6, 8, 30), 150)], [0, 0.78, 1])
    c.drawCircle(x, y, R, skia.Paint(AntiAlias=True, Shader=vg))
    c.restore()
    c.drawCircle(x, y, R, SP((150, 166, 236), 5, 230)); c.drawCircle(x, y, R - 6, SP((255, 255, 255), 1.5, 50))
    c.restore()


def _rot(p, yaw, pitch):
    x, y, z = p
    cy, sy = math.cos(yaw), math.sin(yaw); x, z = x * cy + z * sy, -x * sy + z * cy
    cp, sp_ = math.cos(pitch), math.sin(pitch); y, z = y * cp - z * sp_, y * sp_ + z * cp
    return x, y, z


def _ball(c, x, y, r, col, a=1.0, hi=0.45):
    if a <= 0.01 or r < 0.5: return
    sh = skia.GradientShader.MakeRadial(skia.Point(x - r * 0.32, y - r * 0.36), r * 1.3, [C(O.mix(col, (255, 255, 255), hi), 255 * a), C(col, 255 * a), C(O.mix(col, (16, 14, 50), 0.5), 255 * a)], [0.0, 0.5, 1.0])
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawCircle(x, y, r, SP(O.mix(col, (255, 255, 255), 0.3 + hi * 0.5), max(1.2, r * 0.06), 150 * a))


# ------------------------------------------------------------------ diamond
def _diamond_atoms(rmax=4.5):
    pts = []
    for i in range(-6, 7):
        for j in range(-6, 7):
            for k in range(-6, 7):
                ev = i % 2 == 0 and j % 2 == 0 and k % 2 == 0 and (i + j + k) % 4 == 0
                od = i % 2 == 1 and j % 2 == 1 and k % 2 == 1 and (i + j + k - 3) % 4 == 0
                if (ev or od) and math.sqrt(i * i + j * j + k * k) <= rmax: pts.append((i, j, k))
    pts.sort(key=lambda p: p[0] ** 2 + p[1] ** 2 + p[2] ** 2)
    bonds = [(a, b) for a in range(len(pts)) for b in range(a + 1, len(pts)) if abs(sum((pts[a][n] - pts[b][n]) ** 2 for n in range(3)) - 3) < 0.01]
    return pts, bonds


_DA, _DB = _diamond_atoms()
_DMAX = max(math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2) for p in _DA)
CARB_L = (128, 138, 176)        # the carbons, a little lighter than on the boards so they stand off the dark disc


def diamond(c, t, x, y, R, a=1.0, grow=1.0):
    """a fragment of the diamond lattice: 47 carbons, each bonded to four others at the tetrahedral angle, turning slowly.
    grow 0..1 builds it out from the centre carbon shell by shell."""
    if a <= 0.01: return
    _begin(c, x, y, R, a)
    sc = R / 4.25; yaw = 0.35 + 0.22 * t; pitch = 0.42
    g = max(0.0, min(1.0, grow)) * 1.18
    Q = []; U = []
    for p in _DA:
        d = math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2) / _DMAX
        U.append(sm((g - d * 0.92) / 0.2))                      # this atom's own 0..1
        rx, ry, rz = _rot(p, yaw, pitch); k = 1.0 + rz * 0.035
        Q.append((x + rx * sc * k, y - ry * sc * k, rz, k))
    items = []
    for i, (px, py, pz, k) in enumerate(Q):
        if U[i] > 0.01: items.append((pz, 1, i, 0))
    for i, j in _DB:                                           # i is the inner atom (sorted by radius)
        if U[i] > 0.5: items.append(((Q[i][2] + Q[j][2]) / 2 - 0.01, 0, i, j))
    for z, kind, i, j in sorted(items):
        dep = max(0.0, min(1.0, (z + _DMAX) / (2 * _DMAX)))      # 0 far, 1 near
        if kind == 0:
            u = sm(U[j] * 1.6) if U[j] > 0 else sm((U[i] - 0.5) * 2) * 0.0
            if u <= 0.01: continue
            p0, p1 = Q[i], Q[j]
            q = (p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u)
            col = O.mix((60, 68, 120), (214, 220, 244), dep)
            c.drawLine(p0[0], p0[1], q[0], q[1], SP((8, 10, 30), sc * 0.26 * (0.7 + 0.5 * dep), 150)); c.drawLine(p0[0], p0[1], q[0], q[1], SP(col, sc * 0.16 * (0.7 + 0.5 * dep)))
        else:
            px, py, pz, k = Q[i]
            col = O.mix((58, 64, 116), CARB_L, dep)
            if i == 0: col = O.mix(col, AMBER, 0.55 * (1 - sm(grow * 3 - 1.2)) + 0.25)      # the centre carbon stays a little warm so the eye has a start
            _ball(c, px, py, sc * 0.36 * k * (0.86 + 0.2 * dep) * sm(U[i] * 1.5), col, 1.0, 0.12 + 0.4 * dep)
    _end(c, x, y, R)


# ------------------------------------------------------------------ graphite
def _honey(rmax=4.45, shift=(0.0, 0.0)):
    """honeycomb atoms (bond length 1) within rmax of the origin, and their bonds"""
    a1 = (math.sqrt(3), 0.0); a2 = (math.sqrt(3) / 2, 1.5); pts = []
    for i in range(-9, 10):
        for j in range(-9, 10):
            for b in ((0.0, 0.0), (0.0, 1.0)):
                px = i * a1[0] + j * a2[0] + b[0] + shift[0]; pz = i * a1[1] + j * a2[1] + b[1] + shift[1]
                if math.hypot(px, pz) <= rmax: pts.append((px, pz))
    bonds = [(a, b) for a in range(len(pts)) for b in range(a + 1, len(pts)) if abs(math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]) - 1.0) < 0.02]
    return pts, bonds


_HA = _honey(); _HB = _honey(shift=(0.0, 1.0))


def _sheet(c, x, y, sc, yaw, pitch, hy, hx, pts, bonds, col_b, col_a, a=1.0, r_at=0.27, p=0.0, t=0.0):
    if a <= 0.01: return
    Q = []
    for px, pz in pts:
        rx, ry, rz = _rot((px + hx, hy, pz), yaw, pitch); k = 1.0 + rz * 0.03
        Q.append((x + rx * sc * k, y - ry * sc * k, rz, k))
    if a < 0.99: c.saveLayerAlpha(None, int(255 * a))
    up = _rot((0, 1, 0), yaw, pitch); ux, uy = up[0] * sc, -up[1] * sc                  # one unit straight up from the sheet, on screen
    def cloud(sgn, al):
        if al <= 0.01: return
        pa = skia.Path()
        for i, j in bonds:
            pa.moveTo(Q[i][0] + sgn * ux * 0.5, Q[i][1] + sgn * uy * 0.5); pa.lineTo(Q[j][0] + sgn * ux * 0.5, Q[j][1] + sgn * uy * 0.5)
        c.drawPath(pa, skia.Paint(AntiAlias=True, Color=C(O.P_COL, 95 * al), Style=skia.Paint.kStroke_Style, StrokeWidth=sc * 0.5, StrokeCap=skia.Paint.kRound_Cap, MaskFilter=K.blur(sc * 0.2)))
    lob = sm(p / 0.45); cl = sm((p - 0.4) / 0.6)
    def lobes(sgn):
        if lob <= 0.01: return
        L = sc * 0.74 * lob; ang = math.atan2(sgn * uy, sgn * ux); al = 0.9 - 0.5 * cl
        for qx, qy, qz, k in sorted(Q, key=lambda q: q[2]):
            pth, T = O._lobe(qx, qy, L * k, L * k * 0.62, ang)
            c.drawPath(pth, P(O.P_COL, 200 * al)); c.drawPath(pth, SP((255, 255, 255), 1.5, 120 * al))
    cloud(-1, cl); lobes(-1)
    pb = skia.Path()
    for i, j in bonds: pb.moveTo(Q[i][0], Q[i][1]); pb.lineTo(Q[j][0], Q[j][1])
    c.drawPath(pb, SP((8, 10, 30), sc * 0.3, 140)); c.drawPath(pb, SP(col_b, sc * 0.17))
    for qx, qy, qz, k in sorted(Q, key=lambda q: q[2]): _ball(c, qx, qy, sc * r_at * k, col_a, 1.0, 0.4)
    lobes(1); cloud(1, cl)
    if a < 0.99: c.restore()
    return Q


def graphite(c, t, x, y, R, a=1.0, sheets=1.0, p=0.0, slide=0.0):
    """honeycomb sheets of carbon seen from above at an angle. sheets: 0 one sheet .. 1 three stacked sheets with dotted
    lines for the weak attractions between them. p: the leftover p lobes come on over the top sheet (above and below it) and
    merge sideways into one cloud across the sheet. slide: the top sheet slides off as a flake."""
    if a <= 0.01: return
    _begin(c, x, y, R, a)
    s_ = sm(sheets); sl = sm(slide)
    sc = R / (4.7 + 1.5 * s_); yaw = 0.32 + 0.1 * math.sin(t * 0.35); pitch = 0.62 - 0.32 * s_
    gap = 2.3
    lower = (70, 78, 132); lower_b = (96, 104, 160)
    y_top = gap * s_; y_mid = y_top - gap; y_bot = y_top - 2 * gap
    qb = _sheet(c, x, y, sc, yaw, pitch, y_bot, 0.0, *_HA, lower_b, lower, a=s_ * 0.9)
    qm = _sheet(c, x, y, sc, yaw, pitch, y_mid, 0.0, *_HB, O.mix(lower_b, O.BOND, 0.35), O.mix(lower, CARB_L, 0.4), a=s_)
    if s_ > 0.3:                                                # the weak attractions between sheets: faint dotted lines
        al = sm((s_ - 0.3) / 0.5) * (0.75 - 0.2 * sl)
        dp = skia.Paint(AntiAlias=True, Color=C((190, 204, 255), 230 * al), Style=skia.Paint.kStroke_Style, StrokeWidth=max(3.5, sc * 0.1), StrokeCap=skia.Paint.kRound_Cap,
                        PathEffect=skia.DashPathEffect.Make([1, sc * 0.34], 0))
        pd = skia.Path()
        for gx, gz in ((-3.46, 3.0), (-1.73, 3.0), (0.0, 3.0), (1.73, 3.0), (3.46, 3.0), (-3.46, 0.0), (3.46, 0.0), (-1.73, -3.0), (1.73, -3.0)):
            for ya, yb in ((y_bot, y_mid), (y_mid, y_top)):
                if yb == y_top and sl > 0.05: continue
                p0 = _rot((gx, ya + 0.3, gz), yaw, pitch); p1 = _rot((gx, yb - 0.3, gz), yaw, pitch)
                pd.moveTo(x + p0[0] * sc, y - p0[1] * sc); pd.lineTo(x + p1[0] * sc, y - p1[1] * sc)
        c.drawPath(pd, dp)
    hx = sl * 4.6; lift = 0.5 * math.sin(math.pi * min(1.0, sl * 1.2)) + 0.25 * sl
    _sheet(c, x, y, sc, yaw, pitch, y_top + lift, hx, *_HA, O.BOND, CARB_L, a=1.0, p=p, t=t)
    _end(c, x, y, R)


# ------------------------------------------------------------------ acetylene
def _badge(c, n, x, y, r, a):
    if a <= 0.01: return
    c.drawCircle(x, y, r * (0.7 + 0.3 * a), P(AMBER, 255 * a)); text(c, str(n), x, y + r * 0.38, r * 1.15, NAVY, a, 'xb', 'center')


def acetylene(c, t, x, y, R, a=1.0, count=0.0, line=0.0):
    """H-C≡C-H as balls and sticks. count 0..1: two numbered loops on the left carbon (1 its bond to H, 2 the triple bond).
    line 0..1: a dashed straight line through all four atoms and '180°'."""
    if a <= 0.01: return
    _begin(c, x, y, R, a)
    yy = y - R * 0.04 + 3 * math.sin(t * 0.8)
    xc = R * 0.31; xh = R * 0.78; rc = R * 0.17; rh = R * 0.115
    O.bond(c, (x - xh, yy), (x - xc, yy), 1.0, 1.0, R * 0.05)
    O.bond(c, (x + xc, yy), (x + xh, yy), 1.0, 1.0, R * 0.05)
    O.bond(c, (x - xc, yy), (x + xc, yy), 1.0, 1.0, R * 0.04, n=3, gap=R * 0.075)
    ln = sm(line)
    if ln > 0.01:
        x0, x1 = x - R * 0.93, x - R * 0.93 + R * 1.86 * ln
        yl = yy + rc + R * 0.07
        c.drawLine(x0, yl, x1, yl, skia.Paint(AntiAlias=True, Color=C(AMBER, 255), Style=skia.Paint.kStroke_Style, StrokeWidth=max(4, R * 0.014), PathEffect=skia.DashPathEffect.Make([R * 0.05, R * 0.035], 0)))
    O.atom(c, x - xh, yy, 'H', rh); O.atom(c, x + xh, yy, 'H', rh); O.atom(c, x - xc, yy, 'C', rc); O.atom(c, x + xc, yy, 'C', rc)
    u1 = sm(count / 0.4); u2 = sm((count - 0.5) / 0.4)
    for u, cx, hw_, hh, n in ((u1, x - (xh - rh + xc + rc) / 2, (xh - rh - xc - rc) / 2 + R * 0.004, R * 0.075, 1), (u2, x, xc - rc + R * 0.004, R * 0.15, 2)):
        if u <= 0.01: continue
        rr = skia.RRect.MakeRectXY(skia.Rect(cx - hw_, yy - hh, cx + hw_, yy + hh), hh, hh)
        c.drawRRect(rr, SP(AMBER, max(4, R * 0.014), 255 * u))                    # an outline only: the bond lines inside stay as they are
        _badge(c, n, cx, yy - R * 0.15 - R * 0.14, R * 0.1, u)
    if ln > 0.4:
        al = sm((ln - 0.4) / 0.4); s_ = max(44, R * 0.17)
        text(c, '180°', x, yy + R * 0.46, s_, AMBER, al, 'xb', 'center')
        text(c, 'one straight line', x, yy + R * 0.46 + s_ * 0.9, max(40, R * 0.1), CREAM, al, 'semi', 'center')
    if u2 > 0.5:
        al = sm((u2 - 0.5) * 2) * (1 - sm((ln - 0.2) / 0.3))
        text(c, '2 groups', x, yy - R * 0.5, max(44, R * 0.13), AMBER, al, 'xb', 'center')
    _end(c, x, y, R)


if __name__ == '__main__':
    for n_, states in (('/tmp/lattice_test.png', ((0, 0, 0), (0, 1, 0), (1, 0.4, 0))), ('/tmp/lattice_test2.png', ((1, 0.4, 0.5), (1, 0.4, 1), None))):
        s = skia.Surface(1920, 1080); c = s.getCanvas(); K.calm_bg(c, 1.0)
        for i, st in enumerate(states):
            c.save(); c.translate(i * 640, 60); c.scale(0.74, 0.74)
            if st: graphite(c, 2.0, 430, 480, 420, 1.0, *st)
            else: diamond(c, 3.0, 430, 480, 420, 1.0, 1.0)
            c.restore()
        s.makeImageSnapshot().save(n_, skia.kPNG)
    s = skia.Surface(1920, 1080); c = s.getCanvas(); K.calm_bg(c, 1.0)
    acetylene(c, 3.0, 480, 540, 400, 1.0, 1.0, 0.0); acetylene(c, 3.0, 1420, 540, 400, 1.0, 1.0, 1.0)
    s.makeImageSnapshot().save('/tmp/lattice_big2.png', skia.kPNG)
