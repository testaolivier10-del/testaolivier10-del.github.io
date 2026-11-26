"""Orbital and molecule kit for yt-orgo-03 (hybridization), house flat style on the navy board.
Colour story (the paint analogy of beat c5 runs through the whole video): the s orbital is RED, p orbitals are WHITE, and a
hybrid is the pink you get from mixing them (sp3 palest, sp2 deeper, sp deepest). A leftover p orbital stays white.
Everything takes an alpha `a` (0..1) and most things a grow factor `u` (0..1) so boards can bring them on with the voice.
3D: pts are (x, y, z) with y up; proj() turns them with a yaw and a small pitch and returns screen offsets plus depth."""
import math
import skia
import kit as K
from kit import P, SP, C, sm, text, CREAM, INK2, NAVY, AMBER, CORAL, TEAL

S_COL = (238, 84, 84)            # s orbital: red
P_COL = (244, 242, 236)          # p orbital: white
SP3, SP2, SP1 = (255, 176, 190), (255, 148, 170), (250, 120, 150)     # hybrids: pink, deeper with more s in the mix
HYB = {'sp3': SP3, 'sp2': SP2, 'sp': SP1}
CARB, HYD, NIT, OXY = (86, 92, 118), (232, 236, 246), (104, 150, 240), (240, 104, 96)
ATOM = {'C': CARB, 'H': HYD, 'N': NIT, 'O': OXY}
ATXT = {'C': CREAM, 'H': NAVY, 'N': NAVY, 'O': NAVY}
BOND = (206, 212, 236)


def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def proj(p, yaw=0.0, pitch=0.28, scale=1.0):
    """3D point (x, y up, z toward the viewer) -> (dx, dy on screen, depth)"""
    x, y, z = p
    cy, sy = math.cos(yaw), math.sin(yaw); x, z = x * cy + z * sy, -x * sy + z * cy
    cp, s_ = math.cos(pitch), math.sin(pitch); y, z = y * cp - z * s_, y * s_ + z * cp
    k = 1.0 + z * 0.12
    return (x * scale * k, -y * scale * k, z)


TET = [(0.0, 1.0, 0.0), (0.9428, -0.3333, 0.0), (-0.4714, -0.3333, 0.8165), (-0.4714, -0.3333, -0.8165)]      # four tetrahedral directions
TRI = [(1.0, 0.0, 0.0), (-0.5, 0.0, 0.866), (-0.5, 0.0, -0.866)]                                                # three flat directions (in the x z plane)


def _lobe(x, y, L, wid, ang):
    """a teardrop from (x, y) out to length L along ang"""
    ca, sa = math.cos(ang), math.sin(ang)
    T = lambda u, v: (x + u * ca - v * sa, y + u * sa + v * ca)
    p = skia.Path(); p.moveTo(*T(0, 0))
    p.cubicTo(*T(L * 0.25, -wid * 0.62), *T(L * 0.72, -wid * 0.66), *T(L * 0.94, -wid * 0.3))
    p.cubicTo(*T(L * 1.03, -wid * 0.12), *T(L * 1.03, wid * 0.12), *T(L * 0.94, wid * 0.3))
    p.cubicTo(*T(L * 0.72, wid * 0.66), *T(L * 0.25, wid * 0.62), *T(0, 0)); p.close()
    return p, T


def lobe(c, x, y, L, ang, col, a=1.0, wid=None, u=1.0, glow=True):
    """one shaded lobe (the building block of p orbitals and hybrids)"""
    if a <= 0.01 or u <= 0.01 or L * u < 3: return
    L = L * u; wid = (wid or L * 0.62) * (0.5 + 0.5 * u)
    p, T = _lobe(x, y, L, wid, ang)
    if glow: c.drawPath(p, P(col, 46 * a, MaskFilter=K.blur(14)))
    hi = T(L * 0.62, -wid * 0.14)
    sh = skia.GradientShader.MakeRadial(skia.Point(*hi), L * 0.75, [C(mix(col, (255, 255, 255), 0.5), 235 * a), C(col, 225 * a), C(mix(col, (40, 30, 90), 0.42), 215 * a)], [0.0, 0.5, 1.0])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawPath(p, SP(mix(col, (255, 255, 255), 0.55), 2.5, 150 * a))


def s_orb(c, x, y, r, col=S_COL, a=1.0, u=1.0):
    """the round s orbital"""
    if a <= 0.01 or u <= 0.01: return
    r = r * (0.6 + 0.4 * u); a = a * min(1.0, u * 1.5)
    c.drawCircle(x, y, r * 1.12, P(col, 50 * a, MaskFilter=K.blur(16)))
    sh = skia.GradientShader.MakeRadial(skia.Point(x - r * 0.3, y - r * 0.34), r * 1.25, [C(mix(col, (255, 255, 255), 0.55), 240 * a), C(col, 230 * a), C(mix(col, (40, 30, 90), 0.45), 220 * a)], [0.0, 0.5, 1.0])
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawCircle(x, y, r, SP(mix(col, (255, 255, 255), 0.55), 2.5, 150 * a))


def p_orb(c, x, y, L, ang, col=P_COL, a=1.0, u=1.0, wid=None):
    """a p orbital: two equal lobes, one each side of the nucleus, along ang (radians, screen space)"""
    lobe(c, x, y, L, ang, col, a, wid, u); lobe(c, x, y, L, ang + math.pi, col, a, wid, u)


def hyb(c, x, y, L, ang, col=SP3, a=1.0, u=1.0, back=True):
    """a hybrid orbital: one big lobe along ang and a small one behind it"""
    if back: lobe(c, x, y, L * 0.3, ang + math.pi, col, a * 0.9, L * 0.2, u, glow=False)
    lobe(c, x, y, L, ang, col, a, L * 0.56, u)


def nucleus(c, x, y, a=1.0, r=9):
    if a > 0.01: c.drawCircle(x, y, r, P(NAVY, 255 * a)); c.drawCircle(x, y, r - 3, P(CREAM, 255 * a))


def atom(c, x, y, sym='C', r=44, a=1.0, col=None, label=True):
    """an atom as a shaded ball with its symbol"""
    if a <= 0.01: return
    col = col or ATOM[sym]
    c.drawCircle(x + 4, y + 6, r, P((6, 8, 28), 110 * a, MaskFilter=K.blur(6)))
    sh = skia.GradientShader.MakeRadial(skia.Point(x - r * 0.32, y - r * 0.36), r * 1.3, [C(mix(col, (255, 255, 255), 0.45), 255 * a), C(col, 255 * a), C(mix(col, (20, 16, 60), 0.45), 255 * a)], [0.0, 0.5, 1.0])
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawCircle(x, y, r, SP(mix(col, (255, 255, 255), 0.5), 2.5, 170 * a))
    if label: text(c, sym, x, y + r * 0.36, r * 1.05, ATXT.get(sym, CREAM), a, 'xb', 'center')


def bond(c, p0, p1, a=1.0, u=1.0, w=10, col=BOND, n=1, gap=16):
    """a bond drawn on from p0 to p1; n = 1, 2 or 3 parallel lines"""
    if a <= 0.01 or u <= 0.01: return
    q = (p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u)
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy) or 1.0; nx, ny = -dy / L, dx / L
    for i in range(n):
        o = (i - (n - 1) / 2) * gap
        c.drawLine(p0[0] + nx * o, p0[1] + ny * o, q[0] + nx * o, q[1] + ny * o, SP(col, w, 255 * a))


def wedge(c, p0, p1, a=1.0, u=1.0, w=26, col=BOND):
    """solid wedge: a bond coming toward the viewer (narrow at p0, wide at p1)"""
    if a <= 0.01 or u <= 0.01: return
    q = (p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u)
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy) or 1.0; nx, ny = -dy / L, dx / L; ww = w * u / 2
    p = skia.Path(); p.moveTo(p0[0] + nx * 3, p0[1] + ny * 3); p.lineTo(q[0] + nx * ww, q[1] + ny * ww); p.lineTo(q[0] - nx * ww, q[1] - ny * ww); p.lineTo(p0[0] - nx * 3, p0[1] - ny * 3); p.close()
    c.drawPath(p, P(col, 255 * a))


def dash(c, p0, p1, a=1.0, u=1.0, w=26, col=BOND, n=7):
    """striped wedge: a bond going away from the viewer"""
    if a <= 0.01 or u <= 0.01: return
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy) or 1.0; nx, ny = -dy / L, dx / L
    for i in range(n):
        f = (i + 0.6) / n
        if f > u: break
        hw_ = 3 + (w / 2 - 3) * f; x, y = p0[0] + dx * f, p0[1] + dy * f
        c.drawLine(x + nx * hw_, y + ny * hw_, x - nx * hw_, y - ny * hw_, SP(col, 5, 255 * a))


def lone(c, x, y, ang, a=1.0, r=7, sep=11, col=AMBER, d=0):
    """a lone pair: two dots side by side at (x, y), the pair facing along ang"""
    if a <= 0.01: return
    nx, ny = -math.sin(ang), math.cos(ang); x += math.cos(ang) * d; y += math.sin(ang) * d
    for s_ in (-1, 1): c.drawCircle(x + nx * sep * s_, y + ny * sep * s_, r, P(col, 255 * a))


def arc(c, x, y, r, a0, a1, a=1.0, u=1.0, col=AMBER, w=5):
    """an angle arc from a0 to a1 (radians, screen space, drawn on with u)"""
    if a <= 0.01 or u <= 0.01: return
    c.drawArc(skia.Rect(x - r, y - r, x + r, y + r), math.degrees(a0), math.degrees(a1 - a0) * u, False, SP(col, w, 255 * a))


def box(c, x, y, n=0, a=1.0, size=84, col=INK2, up=1.0, dn=1.0, ecol=AMBER, fill=None):
    """an orbital box centred at (x, y) holding n electrons (0, 1 or 2) as half arrows; up/dn fade each arrow"""
    if a <= 0.01: return
    h = size / 2; r = skia.RRect.MakeRectXY(skia.Rect(x - h, y - h, x + h, y + h), 10, 10)
    c.drawRRect(r, P(fill or (14, 18, 44), 220 * a)); c.drawRRect(r, SP(col, 3.5, 255 * a))
    def arrow(dx, sgn, al):
        if al <= 0.01: return
        y0, y1 = y + sgn * size * 0.3, y - sgn * size * 0.3; pa = SP(ecol, 6, 255 * a * al)
        c.drawLine(x + dx, y0, x + dx, y1, pa); c.drawLine(x + dx, y1, x + dx - 12, y1 + sgn * 16, pa); c.drawLine(x + dx, y1, x + dx + 12, y1 + sgn * 16, pa)
    if n >= 1: arrow(-size * 0.16 if n == 2 else 0, 1, up)
    if n >= 2: arrow(size * 0.16, -1, dn)


def earrow(c, x, y, a=1.0, size=84, sgn=1, col=AMBER):
    """one loose electron arrow (for the electron that moves in promotion)"""
    if a <= 0.01: return
    y0, y1 = y + sgn * size * 0.3, y - sgn * size * 0.3
    c.drawLine(x, y0, x, y1, SP(col, 6, 255 * a)); c.drawLine(x, y1, x - 12, y1 + sgn * 16, SP(col, 6, 255 * a)); c.drawLine(x, y1, x + 12, y1 + sgn * 16, SP(col, 6, 255 * a))


def sup(c, base, exp, x, y, size, col=CREAM, a=1.0, kind='xb', align='left'):
    """text with a superscript, e.g. sup(c, 'sp', '3', ...) -> sp³ ; returns the width"""
    wb = K.width(base, size, kind); we = K.width(exp, size * 0.58, kind) if exp else 0
    if align == 'center': x -= (wb + we) / 2
    elif align == 'right': x -= wb + we
    text(c, base, x, y, size, col, a, kind)
    if exp: text(c, exp, x + wb + 2, y - size * 0.42, size * 0.58, col, a, kind)
    return wb + we


def hyb_chip(c, kind, x, y, size=64, a=1.0, scale=1.0):
    """a filled chip naming a hybridization in its own pink: kind 'sp3' | 'sp2' | 'sp' (centred at x, y baseline)"""
    if a <= 0.01: return
    col = HYB[kind]; exp = kind[2:] if len(kind) > 2 else ''
    size = size * scale; w = K.width('sp', size, 'xb') + (K.width(exp, size * 0.58, 'xb') if exp else 0) + size * 0.9; h = size * 1.5
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y - h * 0.72, x + w / 2, y + h * 0.28), 16, 16), P(col, 255 * a))
    sup(c, 'sp', exp, x, y, size, NAVY, a, 'xb', 'center')


def tetra(c, x, y, L, yaw, a=1.0, u=(1, 1, 1, 1), col=SP3, pitch=0.3, atoms=None, r_at=30, back=True):
    """four sp3 hybrids around a centre, turning slowly with yaw; atoms: None or a symbol drawn at each lobe tip. Depth sorted."""
    items = []
    for i, d in enumerate(TET):
        dx, dy, z = proj(d, yaw, pitch, L); items.append((z, i, dx, dy))
    for z, i, dx, dy in sorted(items):
        k = 0.82 + 0.18 * (z + 1) / 2
        hyb(c, x, y, math.hypot(dx, dy) * 1.0, math.atan2(dy, dx), mix(col, (60, 50, 110), 0.28 * (1 - (z + 1) / 2)), a, u[i], back)
        if atoms: atom(c, x + dx * 1.16 * u[i], y + dy * 1.16 * u[i], atoms, r_at * k, a * sm(u[i] * 2 - 1))
        if z < 0 and i == sorted(items)[0][1]: pass
    nucleus(c, x, y, a)


def ball_stick(c, x, y, L, yaw, dirs, center='C', outer='H', a=1.0, u=1.0, pitch=0.3, r_c=46, r_o=30, w=10, outs=None):
    """a ball and stick molecule: one centre atom and outer atoms along 3D unit directions, turning with yaw. Depth sorted."""
    items = [(proj(d, yaw, pitch, L), i) for i, d in enumerate(dirs)]
    back = [(q, i) for q, i in items if q[2] < 0]; front = [(q, i) for q, i in items if q[2] >= 0]
    def one(q, i):
        dx, dy, z = q; k = 0.84 + 0.16 * (z + 1) / 2; s_ = outs[i] if outs else outer
        L_ = math.hypot(dx, dy) or 1.0; st = (x + dx / L_ * r_c * 0.86, y + dy / L_ * r_c * 0.86) if z >= 0 else (x, y)
        bond(c, st, (x + dx, y + dy), a, u, w * k, mix(BOND, (60, 60, 110), 0.3 * (1 - (z + 1) / 2)))
        atom(c, x + dx * u, y + dy * u, s_, r_o * k, a * sm(u * 2 - 0.6))
    for q, i in sorted(back): one(q, i)
    atom(c, x, y, center, r_c, a)
    for q, i in sorted(front): one(q, i)
