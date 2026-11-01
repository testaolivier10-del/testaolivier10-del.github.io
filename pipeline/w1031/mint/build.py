"""w1031-03-mirror-mint (organic chemistry). All code (skia), house flat style, knight v3 method.
Art plan:
- Scene: a sunny kitchen counter in the morning (window light from the upper left, warm cream wall, teal tile
  backsplash, wooden counter). A glass with a spearmint sprig stands on the left; a vanity mirror stands on the right,
  turned toward it. In the mirror, where the mint's reflection should be, are a bowl of caraway seeds and a seeded rye
  loaf: the visual question at frame zero. Scene life: sun motes drifting, leaves stirring, steam from a mug, curtain sway.
  Why it fits: the story is a kitchen smell; caraway is the seed in deli rye.
- Molecules: carvone (2 methyl 5 isopropenyl cyclohex 2 en 1 one) in house style ball and stick, from 3D coordinates,
  depth sorted, carbons charcoal, oxygen red, the one H on the stereocentre white. The spearmint side is (R) carvone,
  the caraway side its true mirror image (S); CIP check in the fact log: isopropenyl > C6 > C4 > H, clockwise with H
  back for the left molecule.
- Motion list: scent wisps rise from the mint and the seeds and gather into the two molecules, mirrored across the
  mirror line; atoms pulse on "atoms", bonds on "bonds"; two oven mitts WITH thumbs (left and right) swing on "left"
  and "right"; the left molecule slides over the right one and turns about its vertical axis but never lines up (red
  mismatch at the stereocentre); "chiral" title; cutaway inside the nose (the kitchen stays in a round inset): a chiral
  receptor pocket; the spearmint molecule docks one way and sends a green signal, the caraway molecule docks another
  way and sends an amber signal (both bind, differently); back in the kitchen the molecule flips through the mirror
  and the mint's scent turns into the rye bread's.
"""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1031/lib']
import numpy as np, skia
from lpk import *
import layout as L

ID = 'w1031-03-mirror-mint'
OUT = f'/home/claude/lp/w1031/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(mirror=WD.at('mirror'), both=WD.at('both'), carvone=WD.at('carvone'), they=WD.at('they'), atoms=WD.at('atoms'),
         bonds=WD.at('bonds'), but=WD.at('but'), flipped=WD.at('flipped'), left=WD.at('left'), right=WD.at('right'),
         nomatter=WD.at('no'), turn=WD.at('turn'), cant=WD.at("can't"), stack=WD.at('stack'), chemists=WD.at('chemists'),
         kyral=WD.at('kyral'), your=WD.at('your', 3), nose=WD.at('nose'), receptors=WD.at('receptors'), each=WD.at('each'),
         fits=WD.at('fits'), so2=WD.at('so', 2), flip=WD.at('flip', 2), mint=WD.at('mint'), rye=WD.at('rye'), free=WD.at('free'))
END = WD.end()
DUR = END + 1.4
CAP = Captions(WD.w, {'kyral.': 'chiral.', 'kyral': 'chiral'})
# break the caption before the second "are" so it reads "because the receptors inside it / are chiral too,"
_t = WD.w[67]['t0']
_new = []
for _ch in CAP.chunks:
    _k = next((i for i, x in enumerate(_ch) if abs(x['t0'] - _t) < 1e-6 and i > 0), None)
    if _k is None: _new.append(_ch)
    else: _new += [_ch[:_k], _ch[_k:]]
CAP.chunks = _new

MX = 540          # mirror line on screen


# ===================================================================== carvone in 3D
def carvone():
    """atoms: (element, x, y, z) with y up and z toward the viewer; (R) carvone"""
    R = 1.4
    ring = {i: (R * math.cos(math.radians(a)), R * math.sin(math.radians(a)), 0.0) for i, a in zip(range(1, 7), (90, 30, -30, -90, -150, 150))}
    A = {f'C{i}': ('C',) + ring[i] for i in ring}
    def out(i, d):
        x, y, _ = ring[i]; n = math.hypot(x, y); return (x / n * d, y / n * d)
    ox, oy = out(1, 2.62); A['O'] = ('O', ox, oy, 0.0)
    mx, my = out(2, 2.9); A['Me'] = ('C', mx, my, 0.0)
    px, py = out(5, 1.0)
    c5 = ring[5]
    A['Ca'] = ('C', c5[0] + px * 0.85, c5[1] + py * 0.85, 1.05)            # isopropenyl carbon, toward the viewer (wedge)
    A['H5'] = ('H', c5[0] + px * 0.2 - 0.75, c5[1] + py * 0.2 - 0.55, -0.85)           # H back (dash)
    ca = A['Ca'][1:]
    A['Cb'] = ('C', ca[0] - 1.2, ca[1] + 0.1, ca[2] + 0.55)                # =CH2
    A['Cc'] = ('C', ca[0] + 0.15, ca[1] - 1.3, ca[2] + 0.45)               # CH3
    B = [('C1', 'C2', 1), ('C2', 'C3', 2), ('C3', 'C4', 1), ('C4', 'C5', 1), ('C5', 'C6', 1), ('C6', 'C1', 1), ('C1', 'O', 2),
         ('C2', 'Me', 1), ('C5', 'Ca', 1), ('C5', 'H5', 1), ('Ca', 'Cb', 2), ('Ca', 'Cc', 1)]
    return A, B


ATOMS, BONDS = carvone()
ECOL = {'C': ((70, 72, 84), (48, 50, 62)), 'O': ((226, 70, 66), (176, 44, 48)), 'H': ((236, 236, 240), (190, 192, 204))}
ERAD = {'C': 0.42, 'O': 0.44, 'H': 0.5}


def mol(c, cx, cy, sc, roty=0.0, mirror=False, a=1.0, glow=None, pulse_atoms=0.0, pulse_bonds=0.0, hl_center=0.0, rotx=0.0):
    """draw carvone at (cx, cy); mirror reflects x (the enantiomer); roty turns it about the vertical axis"""
    pts = {}
    roty = roty + (-0.35 if mirror else 0.35)
    rotx = rotx + 0.45
    cr, sr = math.cos(roty), math.sin(roty)
    cx_, sx_ = math.cos(rotx), math.sin(rotx)
    for k, (e, x, y, z) in ATOMS.items():
        if mirror: x = -x
        x, z = x * cr + z * sr, -x * sr + z * cr
        y, z = y * cx_ - z * sx_, y * sx_ + z * cx_
        f = 1 + z * 0.16
        pts[k] = (cx + x * sc * f, cy - y * sc * f, z, e)
    items = []
    for b1, b2, order in BONDS:
        items.append(((pts[b1][2] + pts[b2][2]) / 2 - 0.01, 'b', (b1, b2, order)))
    for k in pts:
        items.append((pts[k][2], 'a', k))
    items.sort(key=lambda q: q[0])
    c.saveLayer(None, skia.Paint(Alphaf=a))
    if glow is not None:
        c.drawCircle(cx, cy, 3.6 * sc, P(glow, 70, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    for z, kind, d in items:
        if kind == 'b':
            b1, b2, order = d
            x0, y0, z0, _ = pts[b1]; x1, y1, z1, _ = pts[b2]
            w = 0.16 * sc * (1 + 0.25 * pulse_bonds)
            dx, dy = x1 - x0, y1 - y0; n = math.hypot(dx, dy) or 1; nx, ny = -dy / n, dx / n
            offs = [0] if order == 1 else [-0.13 * sc, 0.13 * sc]
            if {b1, b2} == {'C5', 'H5'}:      # hashed bond: the H points away from the viewer
                for j in range(1, 7):
                    f = j / 7; hw = w * (0.5 + 1.6 * f)
                    mx_, my_ = x0 + dx * f, y0 + dy * f
                    c.drawLine(mx_ - nx * hw, my_ - ny * hw, mx_ + nx * hw, my_ + ny * hw, SP((236, 236, 240), w * 0.45))
                continue
            if {b1, b2} == {'C5', 'Ca'}:      # wedge bond: the isopropenyl group comes toward the viewer
                ww = w * 2.4
                c.drawPath(poly([(x0, y0), (x1 + nx * ww, y1 + ny * ww), (x1 - nx * ww, y1 - ny * ww)]), P((150, 146, 140)))
                c.drawPath(poly([(x0, y0), (x1 + nx * ww * 0.4, y1 + ny * ww * 0.4), (x1 - nx * ww * 0.1, y1 - ny * ww * 0.1)]), P((210, 204, 194)))
                continue
            for o in offs:
                c.drawLine(x0 + nx * o, y0 + ny * o, x1 + nx * o, y1 + ny * o, SP((150, 146, 140), w))
                c.drawLine(x0 + nx * o + nx * w * 0.2, y0 + ny * o + ny * w * 0.2, x1 + nx * o + nx * w * 0.2, y1 + ny * o + ny * w * 0.2, SP((210, 204, 194), w * 0.35))
        else:
            x, y, zz, e = pts[d]
            r = ERAD[e] * sc * (1 + zz * 0.16) * (1 + 0.12 * pulse_atoms)
            base, sh = ECOL[e]
            if d == 'C5' and hl_center > 0.02:
                c.drawCircle(x, y, r * 1.9, P((255, 90, 90), 160 * hl_center, MaskFilter=blur(12)))
            c.drawCircle(x, y, r, P(base))
            cp = skia.Path(); cp.addCircle(x, y, r)
            q = skia.Path(); q.addCircle(x - r * 0.35, y - r * 0.35, r)
            d_ = skia.Op(cp, q, skia.PathOp.kDifference_PathOp)
            if d_ is not None: c.drawPath(d_, P(sh))
            c.drawCircle(x - r * 0.35, y - r * 0.38, r * 0.28, P((255, 255, 255), 90))
            if e == 'H' and r > 10:
                f_ = skia.Font(L.BLACK, r * 1.2); tw = f_.measureText('H')
                c.drawString('H', x - tw / 2, y + r * 0.42, f_, P((60, 60, 80)))
            rr = rim_of(cp, (3, 3))
            if rr is not None: c.drawPath(rr, P((255, 236, 200), 120))
    c.restore()
    return pts


# ===================================================================== kitchen
def kitchen(c, t, scent=0.0):
    # wall and window light
    lgrad(c, skia.Rect(-300, -300, 1400, 1120), -300, 1120, [(250, 232, 204), (240, 214, 182)])
    # window upper left with a sky, a branch outside, a curtain that sways
    wx0, wy0, wx1, wy1 = 40, 380, 380, 900
    lgrad(c, skia.Rect(wx0, wy0, wx1, wy1), wy0, wy1, [(150, 204, 236), (214, 234, 240)])
    for k in range(3):
        bx = 120 + k * 90 + 10 * math.sin(t * 0.8 + k)
        c.drawCircle(bx, 760 - k * 30, 60, P((120, 176, 120)))
        c.drawCircle(bx + 30, 730 - k * 30, 44, P((146, 196, 136)))
    c.drawRect(skia.Rect(wx0, wy0, wx1, wy1), SP((255, 250, 240), 18))
    c.drawLine((wx0 + wx1) / 2, wy0, (wx0 + wx1) / 2, wy1, SP((255, 250, 240), 10))
    c.drawLine(wx0, (wy0 + wy1) / 2, wx1, (wy0 + wy1) / 2, SP((255, 250, 240), 10))
    sw = 10 * math.sin(t * 0.9)
    cur = smooth_closed([(wx1 - 20, wy0 - 30), (wx1 + 60, wy0 - 30), (wx1 + 70 + sw, (wy0 + wy1) / 2), (wx1 + 80 + sw * 1.5, wy1 + 20), (wx1 + 10 + sw, wy1 + 30), (wx1, (wy0 + wy1) / 2)])
    flat(c, cur, (236, 120, 96), (200, 92, 78), sh_off=(10, 0), rim=(255, 220, 180), rim_d=(-3, 0), rim_a=180)
    # sunbeam across the wall and counter
    beam = poly([(wx0, wy0), (wx1, wy0), (1000, 1250), (560, 1250)])
    c.drawPath(beam, P((255, 236, 190), 55, BlendMode=skia.BlendMode.kScreen))
    # hooks and the two oven mitts on the wall (drawn later in mitts())
    # tile backsplash
    c.save(); c.clipRect(skia.Rect(-300, 960, 1400, 1120))
    lgrad(c, skia.Rect(-300, 960, 1400, 1120), 960, 1120, [(112, 186, 186), (96, 168, 170)])
    for x in range(-300, 1400, 90):
        c.drawLine(x, 960, x, 1120, SP((236, 246, 240), 4))
    for y in (1000, 1040, 1080):
        c.drawLine(-300, y, 1400, y, SP((236, 246, 240), 4))
    c.restore()
    # counter
    lgrad(c, skia.Rect(-300, 1110, 1400, 2400), 1110, 1700, [(204, 150, 104), (176, 122, 84), (150, 102, 72)])
    c.drawRect(skia.Rect(-300, 1110, 1400, 1130), P((226, 176, 128)))
    for k in range(9):
        c.drawLine(-300, 1170 + k * 70, 1400, 1180 + k * 70, SP((168, 116, 80), 3, 120))


def mug(c, t):
    x, y = 120, 1230
    m = smooth_closed([(x - 50, y - 120), (x + 50, y - 120), (x + 46, y), (x - 46, y)])
    flat(c, m, (240, 236, 226), (206, 200, 190), sh_off=(10, 0), rim=(255, 236, 200), rim_d=(-3, 2))
    c.drawArc(skia.Rect(x + 34, y - 100, x + 84, y - 40), -80, 170, False, SP((240, 236, 226), 12))
    for k in range(3):
        u = ((t * 0.4 + k * 0.33) % 1.0)
        sx = x + 12 * math.sin(t * 1.5 + k * 2) * u
        c.drawCircle(sx, y - 140 - 140 * u, 16 + 24 * u, P((255, 255, 255), 90 * (1 - u)))


def board(c, t):
    # a cutting board with chopped mint and a few loose caraway seeds on the counter, front left
    b = smooth_closed([(60, 1330), (520, 1316), (540, 1400), (70, 1420)])
    flat(c, b, (226, 186, 132), (190, 150, 104), sh_off=(0, 8), rim=(255, 236, 196), rim_d=(0, -3))
    rs = np.random.default_rng(6)
    for k in range(18):
        x, y = rs.uniform(150, 420), rs.uniform(1340, 1395)
        c.drawOval(skia.Rect(x - 9, y - 5, x + 9, y + 5), P((86, 160, 86)))
    for k in range(14):
        x, y = rs.uniform(640, 980), rs.uniform(1330, 1420)
        c.save(); c.translate(x, y); c.rotate(rs.uniform(0, 180)); c.drawOval(skia.Rect(-6, -2, 6, 2), P((120, 86, 50))); c.restore()
    c.drawPath(poly([(380, 1350), (560, 1300), (566, 1312), (388, 1362)]), P((200, 206, 216)))
    c.drawPath(poly([(560, 1300), (640, 1278), (646, 1292), (566, 1312)]), P((60, 44, 40)))


def mint_glass(c, t, x=300, y=1290):
    # a short glass of water with a spearmint sprig; the leaves stir in the air from the window
    g = smooth_closed([(x - 62, y - 200), (x + 62, y - 200), (x + 54, y), (x - 54, y)])
    c.drawPath(g, P((214, 236, 240), 150))
    c.drawPath(poly([(x - 58, y - 120), (x + 58, y - 120), (x + 54, y), (x - 54, y)]), P((176, 214, 226), 130))
    c.drawPath(g, SP((255, 255, 255), 4, 200))
    c.drawLine(x, y - 30, x + 6, y - 300, SP((96, 140, 70), 9))
    for k, (dx, dy, ang, s_) in enumerate(((-40, -230, -40, 1.0), (40, -250, 40, 1.0), (-36, -300, -30, 0.9), (34, -320, 34, 0.9), (0, -360, 0, 0.8), (-30, -180, -60, 0.8), (36, -200, 60, 0.8))):
        sw = 4 * math.sin(t * 1.3 + k)
        c.save(); c.translate(x + dx * 0.4, y + dy * 0.82); c.rotate(ang + sw)
        leaf = smooth_closed([(0, 0), (22 * s_, -22 * s_), (12 * s_, -66 * s_), (0, -84 * s_), (-12 * s_, -66 * s_), (-22 * s_, -22 * s_)])
        flat(c, leaf, (92, 176, 92), (66, 140, 72), sh_off=(8, 0), rim=(220, 255, 190), rim_d=(-3, 2), rim_a=180)
        c.drawLine(0, -4, 0, -74 * s_, SP((66, 130, 64), 2.5))
        for j in range(3):
            c.drawLine(0, -20 * s_ - j * 16 * s_, 14 * s_, -32 * s_ - j * 16 * s_, SP((66, 130, 64), 1.6))
            c.drawLine(0, -20 * s_ - j * 16 * s_, -14 * s_, -32 * s_ - j * 16 * s_, SP((66, 130, 64), 1.6))
        c.restore()


MIR = [(640, 330), (1010, 300), (1010, 1150), (640, 1110)]     # mirror face (turned toward the mint)


def mirror_stand(c, t, rye_glow=0.0):
    # frame
    fr = poly([(620, 300), (1040, 266), (1040, 1180), (620, 1140)])
    flat(c, fr, (196, 160, 106), (156, 124, 80), sh_off=(10, 0), rim=(255, 230, 170), rim_d=(-3, 2))
    face = poly(MIR)
    lgrad(c, skia.Rect(640, 300, 1010, 1150), 300, 1150, [(196, 222, 226), (170, 200, 210), (150, 180, 196)])
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(640, 300, 1010, 1150), 300, 1150, [(214, 232, 232), (190, 214, 220)])
    # the reflected room: tiles and counter edge, mirrored
    c.drawRect(skia.Rect(640, 930, 1010, 1060), P((104, 176, 178)))
    for x in range(650, 1010, 70): c.drawLine(x, 930, x, 1060, SP((230, 242, 238), 3))
    c.drawRect(skia.Rect(640, 1060, 1010, 1150), P((190, 136, 94)))
    # where the mint should be: a bowl of caraway seeds and a seeded rye loaf
    bx, by = 860, 1060
    loaf = smooth_closed([(bx - 120, by - 30), (bx - 100, by - 110), (bx - 20, by - 140), (bx + 60, by - 120), (bx + 100, by - 60), (bx + 96, by - 20)])
    flat(c, loaf, (150, 96, 56), (116, 72, 44), sh_off=(-10, 0), rim=(255, 210, 150), rim_d=(3, 3))
    for k in range(4):
        c.drawLine(bx - 70 + k * 40, by - 116 + k * 4, bx - 50 + k * 40, by - 76 + k * 4, SP((206, 150, 96), 5))
    rs = np.random.default_rng(4)
    for k in range(40):
        sx, sy = bx + rs.uniform(-90, 80), by - rs.uniform(30, 120)
        c.drawOval(skia.Rect(sx - 4, sy - 1.6, sx + 4, sy + 1.6), P((96, 70, 44)))
    bowl = smooth_closed([(720, 1010), (820, 1010), (810, 1060), (730, 1060)])
    flat(c, bowl, (236, 232, 222), (200, 194, 184), sh_off=(-8, 0), rim=(255, 240, 210), rim_d=(3, 2))
    for k in range(60):
        sx, sy = 770 + rs.uniform(-46, 46), 1006 - abs(rs.normal(0, 8))
        c.save(); c.translate(sx, sy); c.rotate(rs.uniform(0, 180))
        c.drawOval(skia.Rect(-6, -2, 6, 2), P((120, 86, 50))); c.restore()
    if rye_glow > 0.02:
        c.drawCircle(bx - 40, by - 70, 160, P((255, 200, 120), 120 * rye_glow, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    # glass sheen sweeping slowly across
    sx = 640 + ((t * 60) % 800) - 200
    c.drawPath(poly([(sx, 300), (sx + 60, 300), (sx - 140, 1150), (sx - 200, 1150)]), P((255, 255, 255), 50))
    c.restore()
    c.drawPath(face, SP((255, 255, 255), 3, 160))
    # stand
    c.drawPath(poly([(810, 1150), (850, 1150), (870, 1240), (790, 1240)]), P((156, 124, 80)))
    c.drawOval(skia.Rect(740, 1230, 920, 1262), P((176, 140, 92)))


def mitt_one(c, x, y, side, sc, sw=0.0, hl=0.0, a=1.0):
    c.saveLayer(None, skia.Paint(Alphaf=a))
    c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(sw)
    body = smooth_closed([(-34, 30), (34, 30), (40, 120), (36, 190), (0, 214), (-36, 190), (-40, 120)])
    thumb = smooth_closed([(side * 34, 110), (side * 66, 120), (side * 74, 156), (side * 54, 168), (side * 34, 150)])
    col, shc = (226, 92, 76), (186, 66, 58)
    flat(c, thumb, col, shc, sh_off=(side * 8, 0), rim=(255, 230, 190), rim_d=(-side * 2, 2))
    flat(c, body, col, shc, sh_off=(side * 10, 0), rim=(255, 230, 190), rim_d=(-side * 2, 2))
    c.drawRect(skia.Rect(-36, 30, 36, 50), P((250, 236, 214)))
    for j in range(3):
        c.drawLine(-30, 80 + j * 34, 30, 80 + j * 34, SP(shc, 3))
    if hl > 0.02:
        c.drawPath(body, SP((255, 230, 120), 7, 255 * hl)); c.drawPath(thumb, SP((255, 230, 120), 7, 255 * hl))
    c.restore(); c.restore()


def mitts_big(c, t):
    u = smooth((t - T['but']) / 0.45) * (1 - smooth((t - T['nomatter'] + 0.1) / 0.4))
    if u <= 0.01: return 0.0
    for word, x, side in (('left', MX - 200, -1), ('right', MX + 200, 1)):
        d = t - T[word]
        hl = math.exp(-max(0, d) / 1.0) if d > 0 else 0.0
        sw = (8 * math.exp(-max(0, d) / 0.5) * math.sin(max(0, d) * 9)) if d > 0 else 2 * math.sin(t * 1.2)
        mitt_one(c, x, 600 + 60 * (1 - u), side, 1.6 * (0.8 + 0.2 * u), sw * side, hl, u)
    return u


def mitts(c, t):
    """two oven mitts WITH thumbs, a left and a right, hanging on hooks; mirror images of each other"""
    for k, (x, side, word) in enumerate(((505, -1, "left"), (615, 1, "right"))):
        u = t - T[word]
        sw = 10 * math.exp(-max(0, u) / 0.6) * math.sin(max(0, u) * 9) if u > 0 else 1.5 * math.sin(t * 0.8 + k)
        c.save(); c.translate(x, 760); c.rotate(sw)
        c.drawCircle(0, -6, 7, P((120, 120, 130)))
        loop = skia.Path(); loop.addCircle(0, 10, 12)
        c.drawPath(loop, SP((200, 80, 70), 4))
        body = smooth_closed([(-34, 30), (34, 30), (40, 120), (36, 190), (0, 214), (-36, 190), (-40, 120)])
        thumb = smooth_closed([(side * 34, 110), (side * 66, 120), (side * 74, 156), (side * 54, 168), (side * 34, 150)])
        hl = math.exp(-max(0, u) / 1.4) if u > 0 else 0.0
        col, shc = (226, 92, 76), (186, 66, 58)
        flat(c, thumb, col, shc, sh_off=(side * 8, 0), rim=(255, 230, 190), rim_d=(-side * 2, 2))
        flat(c, body, col, shc, sh_off=(side * 10, 0), rim=(255, 230, 190), rim_d=(-side * 2, 2))
        c.drawRect(skia.Rect(-36, 30, 36, 50), P((250, 236, 214)))
        for j in range(3):
            c.drawLine(-30, 80 + j * 34, 30, 80 + j * 34, SP(shc, 3))
        if hl > 0.02:
            c.drawPath(body, SP((255, 230, 120), 8, 255 * hl))
        c.restore()


def motes(c, t, n=36):
    rs = np.random.default_rng(12)
    for k in range(n):
        x0, y0, sp = rs.uniform(100, 1000), rs.uniform(400, 1200), rs.uniform(5, 14)
        x = (x0 + sp * t) % 1000 + 40; y = y0 + 14 * math.sin(t * 0.6 + k)
        c.drawCircle(x, y, rs.uniform(1.2, 2.6), P((255, 244, 210), 110 + 60 * math.sin(t * 2 + k)))


def wisp(c, t, x0, y0, x1, y1, u, col, seed):
    """a soft scent volume drifting from (x0, y0) toward (x1, y1)"""
    rs = np.random.default_rng(seed)
    for k in range(14):
        f = (u * 1.2 - k * 0.04)
        if f <= 0: continue
        f = min(f, 1.0)
        x = lerp(x0, x1, f) + 50 * math.sin(f * 6 + k + t) * (1 - f)
        y = lerp(y0, y1, smooth(f)) + 20 * math.sin(t * 1.3 + k)
        r = 30 + 30 * math.sin(k * 1.7) + 20 * (1 - f)
        c.drawCircle(x, y, r, P(col, 70 * (1 - 0.6 * f), MaskFilter=blur(14)))


# ===================================================================== receptor cutaway
def receptor_scene(c, t, a):
    if a <= 0.01: return
    c.saveLayer(None, skia.Paint(Alphaf=a))
    lgrad(c, skia.Rect(0, 0, W, H), 0, H, [(250, 214, 214), (236, 172, 186), (196, 120, 150)])
    # mucus layer and cilia waving along the top of the cells
    for k in range(40):
        x = k * 30
        sw = 18 * math.sin(t * 3 + k * 0.5)
        c.drawLine(x, 1180, x + sw, 1080, SP((214, 140, 160), 6))
    # cell surface (membrane) with two receptor proteins
    c.drawRect(skia.Rect(-10, 1180, 1090, 1420), P((214, 130, 150)))
    c.drawRect(skia.Rect(-10, 1180, 1090, 1200), P((240, 170, 180)))
    for k in range(20):
        c.drawCircle(k * 60 + 20, 1300 + 20 * math.sin(k), 18, P((196, 110, 136)))
    c.restore()


def receptor(c, cx, cy, t, glow_col=None, glow=0.0, mirror=False):
    """a receptor protein in the membrane with a chiral pocket (an asymmetric notch: deep on one side, a ledge on the other)"""
    s = -1 if mirror else 1
    pts = [(-170, 180), (-180, 40), (-150, -60), (-110, -110), (-60, -116), (-40, -70), (-60, -20), (-10, 20), (40, -10), (40, -60),
           (90, -120), (140, -100), (176, -30), (176, 60), (170, 180)]
    body = smooth_closed([(cx + s * x, cy + y) for x, y in pts])
    flat(c, body, (132, 96, 176), (104, 72, 148), sh_off=(10 * s, 0), rim=(230, 210, 255), rim_d=(-3 * s, 3), rim_a=180)
    for k in range(5):
        c.drawLine(cx - 150, cy + 60 + k * 26, cx + 150, cy + 70 + k * 26, SP((118, 84, 160), 4))
    if glow > 0.02:
        c.drawPath(body, SP(glow_col, 10, 255 * glow))
        # the signal: a pulse running down into the cell
        for k in range(3):
            u = ((t * 1.4 + k / 3) % 1.0)
            c.drawCircle(cx, cy + 200 + 200 * u, 18 * (1 - u) + 6, P(glow_col, 220 * glow * (1 - u)))


# ===================================================================== frames
def titles(c, t):
    Y, Wt, G, A_, R = (255, 210, 63), (255, 255, 255), (63, 224, 122), (255, 180, 90), (255, 107, 107)
    L.title(c, [[('MIRROR IMAGE', Y)], [('MOLECULES', Y)]], t, -0.5, T['both'] - 0.1)
    L.title(c, [[('BOTH ARE', Wt)], [('CARVONE', Y)]], t, T['both'], T['but'] - 0.1)
    L.title(c, [[('ONE IS ', Wt), ('FLIPPED', Y)]], t, T['but'], T['nomatter'] - 0.1)
    L.title(c, [[('THEY ', Wt), ("CAN'T STACK", R)]], t, T['nomatter'], T['chemists'] - 0.1)
    L.title(c, [[('CHIRAL', Y)]], t, T['chemists'], T['your'] - 0.1, size=130)
    L.title(c, [[('YOUR NOSE', Wt)], [('CAN ', Wt), ('TELL', Y)]], t, T['your'], T['so2'] - 0.1)
    L.title(c, [[('MINT ', G), ('OR ', Wt), ('RYE', A_)]], t, T['so2'], None)


A_X, B_X, MOL_Y = 315, 2 * MX - 315, 690


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    G, AMB = (120, 220, 140), (255, 190, 110)
    cut = T['your'] - 0.3 <= t < T['so2'] - 0.75
    z = 1.12 + 0.05 * smooth(t / 12) - 0.03 * smooth((t - T['so2']) / 3) + 0.05 * smooth((t - T['flip'] - 1.5) / 3.0)
    px_c = 540 + 60 * smooth((t - T['flip'] - 1.5) / 3.0)
    c.save(); c.translate(540 + 18 * math.sin(t * 0.21), 1080 + 8 * math.sin(t * 0.17)); c.scale(z, z); c.translate(-px_c, -1080 + 30 * smooth((t - T['flip'] - 1.5) / 3.0))
    kitchen(c, t); mitts(c, t); mug(c, t); board(c, t)
    flip = smooth((t - T['flip']) / 1.4)
    mirror_stand(c, t, rye_glow=smooth((t - T['rye']) / 0.4))
    mint_glass(c, t)
    motes(c, t)
    # scent wisps from the mint (left) and from the seeds in the mirror (right)
    u = smooth(t / 4.5)
    wisp(c, t, 300, 960, A_X, MOL_Y, u * (1 - smooth((t - T['carvone']) / 0.8)), G, 1)
    wisp(c, t, 820, 980, B_X, MOL_Y, u * (1 - smooth((t - T['carvone']) / 0.8)), AMB, 2)
    wisp(c, t, 300, 1000, 300, 700, ((t * 0.25) % 1.0), G, 7)
    wisp(c, t, 820, 1000, 820, 720, ((t * 0.25 + 0.5) % 1.0), AMB, 8)
    if t >= T['so2']:
        wisp(c, t, 300, 960, B_X, MOL_Y - 40, smooth((t - T['mint']) / 1.6), AMB, 3)
    # molecules gather from the wisps on "both are carvone"
    ma = smooth((t - 0.1) / 0.5)
    if ma > 0 and not cut:
        pa = math.exp(-((t - T['atoms'] - 0.2) / 0.35) ** 2)
        pb = math.exp(-((t - T['bonds'] - 0.2) / 0.35) ** 2)
        # stacking attempt: the left molecule slides over the right one and turns
        st = smooth((t - T['nomatter']) / 0.8) * (1 - smooth((t - T['chemists']) / 0.6))
        ax = lerp(A_X, B_X, st)
        turn = 2 * math.pi * smooth((t - T['turn']) / 1.6) if t < T['chemists'] else 0.0
        miss = smooth((t - T['stack']) / 0.3) * (1 - smooth((t - T['chemists'] + 0.1) / 0.3))
        sc = 52
        # in the payoff, the spearmint molecule flips through the mirror into the caraway one
        if t >= T['so2']:
            fu = flip
            idle = 0.35 * math.sin(t * 0.9) * (1 - fu)
            bob = 10 * math.sin(t * 1.3)
            mol(c, B_X, MOL_Y + bob, sc, roty=-idle, mirror=True, a=ma, glow=AMB)
            xs = 1 - 2 * fu
            c.save(); c.translate(MX, 0); c.scale(xs if abs(xs) > 0.02 else 0.02, 1); c.translate(-MX, 0)
            mol(c, A_X, MOL_Y + bob, sc, roty=idle, a=ma, glow=G if fu < 0.5 else AMB)
            c.restore()
            pu = smooth((t - T['flip'] - 0.3) / 1.6)
            if 0 < pu < 1:
                px_ = lerp(A_X, B_X, smooth((t - T['flip']) / 1.4))
                pc = mix(G, AMB, smooth((t - T['flip'] - 0.4) / 0.8))
                for k in range(9):
                    a_ = k * 0.7
                    rr = 40 + 160 * pu
                    c.drawCircle(px_ + rr * math.cos(a_) * 0.8, MOL_Y + 120 + rr * math.sin(a_) * 0.5 - 60 * pu, 50 + 40 * pu, P(pc, 110 * (1 - pu), MaskFilter=blur(16)))
        else:
            idle = 0.35 * math.sin(t * 0.9) * (1 - st)
            bob = 10 * math.sin(t * 1.3)
            ma = ma * (1 - 0.8 * smooth((t - T['but']) / 0.45) * (1 - smooth((t - T['nomatter'] + 0.1) / 0.4)))
            mol(c, B_X, MOL_Y + bob, sc, roty=-idle, mirror=True, a=ma, glow=AMB, pulse_atoms=pa, pulse_bonds=pb, hl_center=miss)
            mol(c, ax, MOL_Y - 10 * st + bob, sc, roty=turn + idle, a=ma * (1 - 0.35 * st), glow=G, pulse_atoms=pa, pulse_bonds=pb, hl_center=miss)
        # labels for the two sides
        la = ma * (1 - smooth((t - T['but']) / 0.3)) + smooth((t - T['so2']) / 0.4)
        if la > 0.02:
            L.chip(c, 'SPEARMINT', A_X, MOL_Y + 230, G, 40, min(1, la) * (1 - (smooth((t - T['flip']) / 0.4) if t >= T['so2'] else 0.0)))
            L.chip(c, 'CARAWAY', B_X, MOL_Y + 230, AMB, 40, min(1, la))
        if miss > 0.05:
            L.chip(c, "DOESN'T MATCH", B_X, MOL_Y + 230, (255, 107, 107), 40, miss)
    mitts_big(c, t)
    # the mirror line between the two molecules
    if T['both'] < t < T['your'] - 0.3 or t >= T['so2']:
        a = smooth((t - T['both']) / 0.5)
        for k in range(16):
            y = 420 + k * 40
            c.drawLine(MX, y, MX, y + 22, SP((255, 255, 255), 4, 150 * a))
    c.restore()
    # ---------- cutaway: inside the nose (the kitchen stays in a round inset)
    ca = smooth((t - T['your'] + 0.3) / 0.4) * (1.0 if t < T['so2'] - 0.3 else 0.0)
    if ca > 0.01:
        ir = smooth((t - T['your'] + 0.3) / 0.5)
        c.save()
        ex = smooth((t - T['so2'] + 0.75) / 0.45)
        cp = skia.Path(); cp.addCircle(540, 900, max(1, (80 + 1300 * ir) * (1 - ex))); c.clipPath(cp, skia.ClipOp.kIntersect, True)
        receptor_scene(c, t, 1.0)
        rx = (330, 750)
        dockA = smooth((t - T['nose']) / 1.2); dockB = smooth((t - T['nose'] - 0.5) / 1.2)
        receptor(c, rx[0], 1010, t, G, smooth((t - T['receptors'] - 0.3) / 0.3) * dockA)
        receptor(c, rx[1], 1010, t, AMB, smooth((t - T['receptors'] - 0.6) / 0.3) * dockB, mirror=True)
        # spearmint docks deep; caraway, the mirror image, sits on the other ledge, tilted
        mol(c, rx[0] - 6 + 8 * math.sin(t * 2.1) * (1 - dockA), lerp(560, 900, dockA) + 6 * math.sin(t * 1.7), 40, roty=0.2 * (1 - dockA) + 0.6 * math.sin(t * 0.8) * (1 - dockA), glow=G)
        mol(c, rx[1] + 30, lerp(560, 862, dockB), 40, mirror=True, rotx=0.0, roty=-0.5 * dockB, glow=AMB)
        L.chip(c, 'SPEARMINT', rx[0], lerp(560, 900, dockA) - 150, G, 38, smooth((t - T['nose']) / 0.3))
        L.chip(c, 'CARAWAY', rx[1], lerp(560, 862, dockB) - 150, AMB, 38, smooth((t - T['nose'] - 0.5) / 0.3))
        L.chip(c, 'RECEPTOR', 540, 1150, (190, 160, 240), 36, smooth((t - T['receptors']) / 0.3))
        c.restore()
        # the kitchen in a round inset, top right
        if ir > 0.6 and ex < 0.5:
            ia = smooth((ir - 0.6) / 0.4) * ca
            c.save()
            ic = (968, 1290); irad = 92
            ip = skia.Path(); ip.addCircle(*ic, irad); c.clipPath(ip, skia.ClipOp.kIntersect, True)
            c.translate(ic[0], ic[1]); c.scale(0.3, 0.3); c.translate(-560, -900)
            kitchen(c, t); mirror_stand(c, t); mint_glass(c, t)
            c.restore()
            c.drawCircle(968, 1290, 92, SP((255, 255, 255), 6, 230 * ia))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((40, 20, 10), 110)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    L.fades(c)
    L.badge(c, 'ORGANIC CHEMISTRY')
    titles(c, t)
    if t < END - 0.6: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END - 0.6, y=1330)
    return surf


if __name__ == '__main__':
    out, st = args()
    render(frame, DUR, out, st, OUT)
