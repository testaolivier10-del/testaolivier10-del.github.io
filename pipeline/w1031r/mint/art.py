"""Kitchen world for w1031-03-mirror-mint (premium rebuild 2026-11-09). All code (skia), house flat layered style.

A warm morning kitchen: window light from the right, a cook (ONE skinned body, pipeline/people person.py) standing
behind a wooden counter, a sprig of spearmint in his near hand, a seeded rye loaf on a board in front of him.
World coordinates are the 1080x1920 frame; the build moves a camera over this world (pushes, zoom cuts)."""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1031r/mint', '/home/claude/short']
import numpy as np, skia
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, poly
import person as PP, airman2 as A2

W, H = 1080, 1920
TOP = 1196             # far edge of the island worktop (at the cook's hip)
BACK = 1040            # back counter top
NEAR = 1520            # near edge of the island worktop
SKY = (196, 222, 236)
WALL0, WALL1 = (244, 226, 200), (226, 200, 170)
WOOD, WOOD_SH, WOOD_HI = (190, 134, 90), (154, 104, 70), (222, 170, 120)
CAB, CAB_SH = (92, 122, 120), (70, 96, 96)
SUN = (255, 232, 186)
G, AMB = (110, 214, 130), (255, 178, 92)

# ------------------------------------------------------------------ the cook: one skinned body
SHIRT, SHIRT_SH, SHIRT_HI = (70, 96, 136), (52, 72, 106), (98, 126, 166)
ROLL, ROLL_SH, ROLL_HI = (104, 132, 172), (60, 84, 120), (150, 176, 212)


class CookPerson(PP.Person):
    """the cook: the people kit body, with his rolled shirt sleeve drawn as folded shirt fabric (two fold creases and a
    lit fold edge, skinned to the arm like the rest of the figure) instead of a flat cuff"""
    def _build_rest(self):
        L = super()._build_rest()
        J = self.J0
        stroke = lambda path, w: (lambda d: (SP((0, 0, 0), w).getFillPath(path, d), d)[1])(skia.Path())
        for s in 'fn':
            uf = self.frame(*J['uarm_' + s])
            for y, col, w, al in ((160, ROLL_SH, 5, 220), (171, ROLL_HI, 4, 170), (198, ROLL_SH, 4, 190), (210, ROLL_HI, 3, 150)):
                p = skia.Path(); p.moveTo(*uf(-70, y)); p.quadTo(*uf(0, y + 8), *uf(68, y))
                L.append(dict(grp='far' if s == 'f' else 'arm', col=col, kind='detail', a=al, bones=['uarm_' + s, 'farm_' + s],
                              rings=self._bind(stroke(p, w), ['uarm_' + s, 'farm_' + s], 12), limb='arm'))
        return L


COOK = CookPerson(0.92, cap=False, palette={A2.OL: SHIRT, A2.OL_SH: SHIRT_SH, A2.OL_HI: SHIRT_HI, A2.CUFF: ROLL,
                 A2.BELT: (236, 230, 216), A2.BELT_SH: (206, 198, 182), (150, 120, 80): (236, 230, 216),
                 A2.SKIN: (226, 168, 128), A2.SKIN_SH: (202, 146, 110)})
CX, GROUND = 300, 1842
BASE = dict(face=1, lean=4, neck=4, thigh_n=0, knee_n=0, thigh_f=0, knee_f=0)
_ARM = {}


def _arm_to(base, side, target):
    """grid search shoulder and elbow so the wrist of arm side ('n' or 'f') sits on target (canvas coords)"""
    key = (side, tuple(sorted((k, v) for k, v in base.items() if not k.startswith(('uarm', 'elbow', 'hand')))), round(target[0] / 2), round(target[1] / 2))
    if key in _ARM: return _ARM[key]
    best = None
    for ua in range(-20, 181, 5):
        for el in range(0, 151, 5):
            kw = dict(base); kw['uarm_' + side] = ua; kw['elbow_' + side] = el
            ps = A2.Pose(x=CX, ground=GROUND, **kw); J = COOK.joints(ps)
            hx, hy = COOK.canvas_pt(ps, J['hand_' + side][0])
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if best is None or d < best[0]: best = (d, ua, el)
    # refine
    d0, ua0, el0 = best
    for ua in np.arange(ua0 - 5, ua0 + 5.1, 1.0):
        for el in np.arange(max(0, el0 - 5), min(150, el0 + 5) + 0.1, 1.0):
            kw = dict(base); kw['uarm_' + side] = ua; kw['elbow_' + side] = el
            ps = A2.Pose(x=CX, ground=GROUND, **kw); J = COOK.joints(ps)
            hx, hy = COOK.canvas_pt(ps, J['hand_' + side][0])
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if d < best[0]: best = (d, ua, el)
    _ARM[key] = (best[1], best[2], best[0] ** 0.5)
    return _ARM[key]


def nose_pt(kw):
    ps = A2.Pose(x=CX, ground=GROUND, **kw); J = COOK.joints(ps); h = COOK._hf(J)
    return COOK.canvas_pt(ps, h(*A2._hp((274, 182))))


def wrist_pt(kw, side):
    ps = A2.Pose(x=CX, ground=GROUND, **kw); J = COOK.joints(ps)
    o, d = J['hand_' + side]
    f = COOK.frame(o, d)
    return COOK.canvas_pt(ps, o), COOK.canvas_pt(ps, f(4, 46)), d   # wrist, palm centre, hand direction


# ------------------------------------------------------------------ props
def sprig(c, x, y, ang, t, s=1.0, crushed=0.0, glow=0.0):
    """a spearmint sprig whose stem passes through a gripping hand at (x, y); ang: stem direction (deg, 0 = up)"""
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    c.drawPath(poly([(-4, 60), (4, 60), (3, -150), (-3, -150)]), P((96, 134, 66)))
    leaves = ((-1, -40, -58, 1.0), (1, -60, 56, 1.0), (-1, -92, -50, 0.92), (1, -108, 48, 0.9), (-1, -136, -38, 0.78),
              (1, -146, 34, 0.74), (0, -160, 0, 0.62))
    for k, (side, yy, a, sc) in enumerate(leaves):
        sw = 3.5 * math.sin(t * 1.7 + k * 1.3)
        c.save(); c.translate(0, yy); c.rotate(a + sw)
        L_ = 78 * sc; Wd = 30 * sc
        leaf = smooth_closed([(0, 0), (Wd, -L_ * 0.28), (Wd * 0.8, -L_ * 0.66), (0, -L_), (-Wd * 0.8, -L_ * 0.66), (-Wd, -L_ * 0.28)])
        base = mix((78, 170, 88), (60, 140, 70), 0.4 * crushed)
        flat(c, leaf, base, mix(base, (30, 80, 40), 0.35), sh_off=(9 * (1 if side >= 0 else -1), 0), rim=(220, 255, 190), rim_d=(-3, 2), rim_a=170)
        c.drawLine(0, -3, 0, -L_ * 0.9, SP((52, 120, 58), 2.4))
        for j in range(4):
            yj = -L_ * (0.2 + j * 0.17)
            c.drawLine(0, yj, Wd * 0.62, yj - L_ * 0.12, SP((52, 120, 58), 1.4, 200))
            c.drawLine(0, yj, -Wd * 0.62, yj - L_ * 0.12, SP((52, 120, 58), 1.4, 200))
        # serrated edge hint
        for j in range(5):
            u = 0.15 + j * 0.15
            c.drawCircle(Wd * 0.9 * math.sin(u * math.pi) * 0.95, -L_ * u, 2.2, P(mix(base, (255, 255, 255), 0.25)))
        c.restore()
    if glow > 0.01:
        c.drawCircle(0, -100, 120, P(G, 90 * glow, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    c.restore()


SEEDS = np.random.default_rng(21).uniform(0, 1, (120, 3))


def seed(c, x, y, ang, s=1.0, hl=0.0):
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    c.drawPath(smooth_closed([(-7, 0), (-3, -2.6), (4, -2.4), (7, 0), (3, 2.6), (-4, 2.4)]), P(mix((112, 80, 46), (255, 210, 120), hl)))
    c.drawLine(-5, 0, 5, 0, SP((150, 116, 70), 1.0))
    c.restore()


LOAF = (780, 1262)


def loaf(c, t, hl=0.0):
    """a seeded rye loaf (oval, scored, caraway seeds in the crust) on a board, with two slices cut"""
    bx, by = LOAF
    # board
    bd = smooth_closed([(540, 1300), (1040, 1288), (1056, 1352), (548, 1366)])
    flat(c, bd, (214, 168, 112), (180, 136, 90), sh_off=(0, 8), rim=(255, 230, 180), rim_d=(0, -3))
    c.drawPath(poly([(548, 1352), (1056, 1340), (1056, 1360), (548, 1374)]), P((150, 108, 72)))
    c.drawOval(skia.Rect(bx - 190, by + 44, bx + 190, by + 74), P((60, 36, 20), 70, MaskFilter=blur(10)))
    body = smooth_closed([(bx - 180, by + 56), (bx - 196, by + 4), (bx - 160, by - 56), (bx - 60, by - 92), (bx + 70, by - 90),
                          (bx + 150, by - 60), (bx + 186, by + 2), (bx + 170, by + 56)])
    flat(c, body, (128, 78, 46), (98, 58, 34), sh_off=(-16, 6), rim=(255, 206, 140), rim_d=(4, -3), rim_a=220)
    # cut face toward the viewer (left end): the crumb, grey brown rye with seeds
    face = smooth_closed([(bx - 186, by + 50), (bx - 194, by + 2), (bx - 166, by - 48), (bx - 140, by - 40), (bx - 150, by + 4), (bx - 144, by + 52)])
    c.drawPath(face, P((176, 140, 104)))
    for k in range(14):
        sx, sy, a = SEEDS[k]
        seed(c, bx - 186 + sx * 40, by - 30 + sy * 76, a * 180, 0.8, hl)
    # scoring
    for k in range(4):
        x0 = bx - 110 + k * 64
        c.drawPath(smooth_closed([(x0, by - 72), (x0 + 22, by - 86), (x0 + 30, by - 40), (x0 + 8, by - 30)]), P((196, 150, 96)))
    # caraway seeds in the crust
    for k in range(14, 90):
        sx, sy, a = SEEDS[k]
        x = bx - 150 + sx * 320; y = by - 70 + sy * 120
        if ((x - bx) / 185) ** 2 + ((y - by + 10) / 80) ** 2 < 0.9:
            seed(c, x, y, a * 180, 1.0, hl)
    if hl > 0.01:
        c.drawCircle(bx, by - 20, 200, P(AMB, 80 * hl, MaskFilter=blur(50), BlendMode=skia.BlendMode.kScreen))


SLICE_W = (520, 1250)     # a slice already cut, lying on the worktop within his reach


def slice_(c, x, y, ang=0.0, s=1.0, hl=0.0, lying=True):
    """one slice of seeded rye; lying flat on the board it is a thin ellipse edge, held up it shows its face"""
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    if lying:
        c.drawPath(smooth_closed([(-70, -4), (-60, -16), (60, -18), (74, -6), (66, 4), (-64, 4)]), P((176, 140, 104)))
        c.drawPath(smooth_closed([(-70, -4), (-60, -16), (60, -18), (74, -6), (60, -10), (-58, -9)]), P((116, 70, 40)))
    else:
        f = smooth_closed([(-60, 0), (-68, -60), (-44, -112), (0, -126), (46, -112), (66, -60), (58, 0)])
        flat(c, f, (122, 74, 42), (96, 56, 32), sh_off=(-6, 0))
        inner = smooth_closed([(-50, -8), (-57, -60), (-38, -102), (0, -114), (38, -102), (55, -60), (48, -8)])
        c.drawPath(inner, P((182, 146, 108)))
        for k in range(18):
            sx, sy, a = SEEDS[90 + k]
            seed(c, -40 + sx * 80, -96 + sy * 80, a * 180, 0.8, hl)
        for k in range(30):
            sx, sy, a = SEEDS[(k * 7) % 120]
            c.drawCircle(-44 + sx * 88, -100 + sy * 86, 2 + 2 * a, P((150, 116, 84)))
    c.restore()


def knife(c):
    c.save(); c.translate(0, 130)
    c.drawPath(poly([(830, 1210), (1010, 1196), (1012, 1204), (832, 1218)]), P((214, 218, 226)))
    for k in range(10):
        x = 840 + k * 17
        c.drawLine(x, 1217 - k * 1.1, x + 6, 1214 - k * 1.1, SP((170, 176, 186), 2))
    c.drawPath(poly([(1010, 1194), (1070, 1190), (1072, 1206), (1012, 1206)]), P((70, 44, 30)))
    c.restore()


def mint_glass(c, t, x=1000, y=1330):
    g = smooth_closed([(x - 40, y - 140), (x + 40, y - 140), (x + 34, y), (x - 34, y)])
    c.drawPath(g, P((214, 236, 240), 140))
    c.drawPath(poly([(x - 37, y - 80), (x + 37, y - 80), (x + 34, y), (x - 34, y)]), P((176, 214, 226), 120))
    for k, (dx, a) in enumerate(((-10, -14), (8, 10), (0, -2))):
        sprig(c, x + dx, y - 40, a, t + k, 0.62)
    c.drawPath(g, SP((255, 255, 255), 3, 200))


# ------------------------------------------------------------------ the room
def room(c, t):
    lgrad(c, skia.Rect(-400, -400, 1500, TOP), -400, TOP, [WALL0, WALL1])
    # window on the right, morning sky, a tree outside that moves
    wx0, wy0, wx1, wy1 = 560, 330, 1000, 900
    lgrad(c, skia.Rect(wx0, wy0, wx1, wy1), wy0, wy1, [(150, 200, 236), (226, 238, 236)])
    for k in range(4):
        bx = 640 + k * 100 + 12 * math.sin(t * 0.7 + k)
        c.drawCircle(bx, 820 - (k % 2) * 50, 90, P((126, 176, 120)))
        c.drawCircle(bx + 40, 760 - (k % 2) * 50, 64, P((150, 196, 136)))
    c.drawCircle(860, 420, 46, P((255, 246, 214), 200, MaskFilter=blur(18)))
    fr = SP((252, 246, 236), 22)
    c.drawRect(skia.Rect(wx0, wy0, wx1, wy1), fr)
    c.drawLine((wx0 + wx1) / 2, wy0, (wx0 + wx1) / 2, wy1, SP((252, 246, 236), 12))
    c.drawLine(wx0, (wy0 + wy1) / 2, wx1, (wy0 + wy1) / 2, SP((252, 246, 236), 12))
    c.drawRect(skia.Rect(wx0 - 30, wy1, wx1 + 30, wy1 + 26), P((240, 230, 214)))
    # a potted herb on the sill
    c.drawPath(poly([(900, 900), (960, 900), (950, 850), (910, 850)]), P((196, 110, 80)))
    for k in range(5):
        a = -40 + k * 20 + 4 * math.sin(t * 1.2 + k)
        c.save(); c.translate(930, 850); c.rotate(a)
        c.drawPath(smooth_closed([(0, 0), (12, -30), (0, -60), (-12, -30)]), P((96, 168, 96))); c.restore()
    # curtain at the window's right edge, swaying
    sw = 8 * math.sin(t * 0.9)
    cur = smooth_closed([(wx1 - 10, wy0 - 40), (wx1 + 70, wy0 - 40), (wx1 + 80 + sw, 640), (wx1 + 90 + sw * 1.4, wy1 + 40), (wx1 + 14 + sw, wy1 + 50), (wx1 + 4, 640)])
    flat(c, cur, (238, 206, 150), (210, 176, 124), sh_off=(10, 0), rim=(255, 236, 196), rim_d=(-3, 0), rim_a=160)
    # shelf on the left with jars, hanging pans
    c.drawRect(skia.Rect(-60, 520, 440, 540), P((176, 124, 84)))
    c.drawRect(skia.Rect(-60, 540, 440, 552), P((140, 96, 64)))
    for k, (x, w, h, col) in enumerate(((20, 70, 110, (236, 196, 120)), (110, 60, 80, (200, 90, 70)), (190, 80, 120, (120, 160, 120)), (300, 64, 90, (230, 220, 200)))):
        jar = smooth_closed([(x, 520), (x + w, 520), (x + w, 520 - h), (x, 520 - h)])
        flat(c, jar, col, mix(col, (0, 0, 0), 0.2), sh_off=(-8, 0), rim=(255, 240, 210), rim_d=(3, 0), rim_a=160)
        c.drawRect(skia.Rect(x - 2, 520 - h - 14, x + w + 2, 520 - h), P((120, 90, 60)))
    c.drawLine(-60, 96, 520, 96, SP((120, 90, 60), 8))
    for k, (x, r) in enumerate(((80, 70), (230, 56), (370, 46))):
        sw = 2.0 * math.sin(t * 0.8 + k)
        c.save(); c.translate(x, 96); c.rotate(sw)
        c.drawLine(0, 0, 0, 30, SP((90, 70, 50), 4))
        c.drawRect(skia.Rect(-6, 30, 6, 110), P((90, 60, 40)))
        c.drawCircle(0, 110 + r, r, P((196, 116, 70))); c.drawCircle(-r * 0.2, 110 + r * 0.85, r * 0.72, P((214, 140, 90)))
        c.restore()
    # tile backsplash and the back counter (behind the cook)
    c.save(); c.clipRect(skia.Rect(-400, 900, 1500, BACK))
    lgrad(c, skia.Rect(-400, 900, 1500, BACK), 900, BACK, [(214, 230, 222), (190, 210, 204)])
    for x in range(-400, 1500, 64): c.drawLine(x, 900, x, BACK, SP((246, 250, 246), 3))
    for y in range(932, BACK, 32): c.drawLine(-400, y, 1500, y, SP((246, 250, 246), 3))
    c.restore()
    c.drawRect(skia.Rect(-400, BACK - 4, 1500, BACK + 18), P((236, 226, 210)))
    lgrad(c, skia.Rect(-400, BACK + 18, 1500, TOP + 40), BACK + 18, TOP + 40, [(120, 148, 144), (96, 122, 120)])
    for x0 in range(-400, 1500, 300):
        c.drawLine(x0, BACK + 30, x0, TOP + 40, SP((86, 110, 108), 4))
    # sunbeam from the window falling to the left (screen blend), with dust in it
    beam = poly([(wx0, wy0), (wx0, wy1), (-200, 1500), (-200, 600)])
    c.drawPath(beam, P(SUN, 34, BlendMode=skia.BlendMode.kScreen, MaskFilter=blur(20)))
    rs = np.random.default_rng(12)
    for k in range(40):
        x0, y0, sp = rs.uniform(0, 600), rs.uniform(500, 1150), rs.uniform(4, 12)
        x = (x0 - sp * t) % 640 - 40; y = y0 + 16 * math.sin(t * 0.5 + k)
        c.drawCircle(x, y, rs.uniform(1.4, 3.0), P((255, 246, 214), 90 + 60 * math.sin(t * 1.7 + k), BlendMode=skia.BlendMode.kScreen))


def counter(c, t):
    """the island in front of the cook: a butcher block worktop seen from above, its front face below"""
    lgrad(c, skia.Rect(-400, TOP, 1500, NEAR), TOP, NEAR, [(206, 152, 102), (222, 170, 118)])
    rs = np.random.default_rng(5)
    for k in range(22):
        y = TOP + 8 + k * 15 + rs.uniform(-3, 3)
        c.drawLine(-400, y, 1500, y + rs.uniform(-4, 4), SP((186, 132, 88), 2, 110))
    for k in range(9):
        x = rs.uniform(-100, 1100); y = rs.uniform(TOP + 20, NEAR - 20)
        c.drawOval(skia.Rect(x - 40, y - 4, x + 40, y + 4), SP((176, 122, 80), 2, 90))
    c.drawRect(skia.Rect(-400, TOP - 4, 1500, TOP + 4), P((170, 118, 78)))
    c.drawRect(skia.Rect(-400, NEAR, 1500, NEAR + 34), P(WOOD_HI))
    lgrad(c, skia.Rect(-400, NEAR + 34, 1500, NEAR + 60), NEAR + 34, NEAR + 60, [WOOD, WOOD_SH])
    lgrad(c, skia.Rect(-400, NEAR + 60, 1500, 2400), NEAR + 60, 1920, [CAB, CAB_SH])
    for x0 in (-400, 140, 680):
        r = skia.RRect.MakeRectXY(skia.Rect(x0 + 30, NEAR + 96, x0 + 510, 2100), 14, 14)
        c.drawRRect(r, SP(mix(CAB, (255, 255, 255), 0.15), 6))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 + 230, NEAR + 130, x0 + 310, NEAR + 146), 8, 8), P((210, 190, 150)))
    # tea towel hanging from the handle, swaying
    sw = 6 * math.sin(t * 1.1)
    tw = smooth_closed([(400, NEAR + 140), (490, NEAR + 140), (496 + sw, NEAR + 320), (406 + sw * 1.2, NEAR + 330)])
    flat(c, tw, (240, 236, 226), (210, 204, 192), sh_off=(8, 0))
    for k in range(3): c.drawLine(404 + sw * 0.3, NEAR + 190 + k * 16, 492 + sw * 0.3, NEAR + 190 + k * 16, SP((200, 90, 80), 5))
    # warm window light on the worktop
    c.drawOval(skia.Rect(380, TOP + 20, 1300, NEAR - 40), P(SUN, 70, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))


def teapot(c, t):
    x, y = 140, BACK + 4
    body = smooth_closed([(x - 80, y), (x - 96, y - 70), (x - 60, y - 130), (x + 60, y - 130), (x + 96, y - 70), (x + 80, y)])
    flat(c, body, (232, 92, 72), (196, 66, 54), sh_off=(-14, 0), rim=(255, 220, 180), rim_d=(3, -2))
    c.drawPath(poly([(x + 90, y - 80), (x + 150, y - 130), (x + 160, y - 122), (x + 100, y - 60)]), P((214, 80, 62)))
    c.drawOval(skia.Rect(x - 30, y - 150, x + 30, y - 128), P((196, 66, 54)))
    for k in range(4):
        u = ((t * 0.35 + k * 0.25) % 1.0)
        sx = x + 155 + 18 * math.sin(t * 1.4 + k * 2) * u
        c.drawCircle(sx, y - 140 - 170 * u, 12 + 26 * u, P((255, 255, 255), 70 * (1 - u) * min(1, u * 5), MaskFilter=blur(8)))


def foreground(c, t):
    """an out of focus bowl of lemons, bottom left, for depth"""
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(14, 14)))
    c.drawOval(skia.Rect(-120, 1560, 300, 1760), P((236, 232, 224)))
    for k, (x, y) in enumerate(((20, 1580), (120, 1560), (210, 1590))):
        c.drawCircle(x, y, 70, P((246, 206, 70)))
    c.drawPath(smooth_closed([(-140, 1640), (320, 1640), (260, 1900), (-80, 1900)]), P((214, 206, 192)))
    c.restore()


# ------------------------------------------------------------------ the cook's poses
def cook_pose(t, near_tgt, far_tgt, smile=0.4):
    """the cook with the near wrist on near_tgt and the far wrist on far_tgt (arms solved per frame)"""
    kw = dict(BASE); kw['neck'] = 4 + 2 * math.sin(t * 0.6)
    kw['lean'] = 4 + 1.2 * math.sin(t * 1.1)          # breathing sway
    ua, el, _ = _arm_to(kw, 'n', near_tgt); kw['uarm_n'] = ua; kw['elbow_n'] = el; kw['hand_n'] = 'grip'
    kw['wrist_n'] = -30
    uf, ef, _ = _arm_to(kw, 'f', far_tgt); kw['uarm_f'] = uf; kw['elbow_f'] = ef; kw['hand_f'] = 'grip'
    kw['smile'] = smile
    return kw


NOSE0 = None


def nose0():
    global NOSE0
    if NOSE0 is None: NOSE0 = nose_pt(dict(BASE))
    return NOSE0


def draw_cook(c, kw):
    ps = A2.Pose(x=CX, ground=GROUND, **kw)
    COOK.draw(c, ps, light=(0.75, -0.65))
    return ps


def hand_over(c, ps, side='n'):
    """redraw a hand on top (so a held stem or slice passes BEHIND the fingers, as in a real grip)"""
    J = COOK.joints(ps)
    hp, lines = COOK._hand(J, side, ps)
    c.save(); c.translate(ps.x, ps.ground); c.scale(ps.s * COOK.k * ps.face, ps.s * COOK.k)
    sk, sh = COOK.pc(A2.SKIN), COOK.pc(A2.SKIN_SH)
    if side == 'f':
        sk, sh = mix(sk, (24, 26, 34), 0.18), mix(sh, (24, 26, 34), 0.18)
    c.drawPath(hp, P(sk))
    q = skia.Path(hp); q.offset(-0.75 * 10, 0.65 * 10)
    c.drawPath(A2.diff(hp, q), P(sh))
    for a, b in lines: c.drawLine(*a, *b, SP(sh, 3.5, 200))
    c.restore()


def held(kw, side='n'):
    """canvas point in the middle of the gripping fist and the hand's direction (deg, as skia rotation)"""
    ps = A2.Pose(x=CX, ground=GROUND, **kw); J = COOK.joints(ps)
    o, d = J['hand_' + side]; f = COOK.frame(o, d)
    p = COOK.canvas_pt(ps, f(4, 44))
    return p, d


def slice_in_hand(c, kw, t, hl=0.0, s=0.72):
    """the rye slice held up by his far hand: the slice's lower crust sits in the hand, the fingers wrap behind it (their
    tips show past the far edge) and the thumb lies across the front of the crust, as a real hand holds a slice"""
    p, d = held(kw, 'f')
    sk = mix(COOK.pc(A2.SKIN), (24, 26, 34), 0.12); sh = mix(COOK.pc(A2.SKIN_SH), (24, 26, 34), 0.12)
    bx, by = p[0] + 4, p[1] + 34                   # bottom centre of the slice, low in the hand
    # finger tips curling round the far edge, behind the slice
    for k in range(3):
        fx, fy = bx + 40 * s + 10, by - (34 + k * 22) * s
        c.drawRoundRect(skia.Rect(fx - 16, fy - 10, fx + 10, fy + 10), 10, 10, P(sh))
    slice_(c, bx, by, -6, s, hl=hl, lying=False)
    # the thumb across the front of the crust (from the heel of the hand up onto the slice)
    th0 = (bx - 50 * s, by - 2); th1 = (bx - 14 * s, by - 30 * s)
    q = skia.Path(); q.moveTo(*th0); q.lineTo(*th1)
    c.drawPath(q, SP(sk, 24))
    c.drawCircle(*th1, 12, P(sk))
    c.drawPath(q, SP(sh, 7, 120))
    c.drawRoundRect(skia.Rect(th1[0] - 6, th1[1] - 9, th1[0] + 7, th1[1] + 4), 5, 5, P(mix(sk, (255, 236, 226), 0.5)))
    # the heel of the hand under the crust
    c.drawOval(skia.Rect(bx - 52 * s - 14, by - 18, bx + 30 * s, by + 22), P(sk))
    c.drawOval(skia.Rect(bx - 52 * s - 14, by + 2, bx + 30 * s, by + 22), P(sh))
