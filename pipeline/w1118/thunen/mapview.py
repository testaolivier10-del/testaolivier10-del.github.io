"""The von Thunen landscape seen by a craning camera: one ground plane (a top down map texture drawn once, then projected with a true
perspective homography each frame), upright things (houses, church spires, the farmer, cows, barns) projected in 3D, the bid rent
cone, and the four rings painting themselves in on their words. City at the origin; units are model units (not to scale)."""
import math, functools
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
import cow as CW

MR, MPX = 6.0, 200
MS = int(2 * MR * MPX)
RC, R1, R2, R3, R4 = 0.34, 1.0, 1.75, 2.7, 3.8
FARM = (-0.42, -2.25)                                    # our farmer's farm: in the grain ring (1.75 to 2.7 from the city)
F = 1000.0
GRASS = (132, 170, 92)


def m2p(X, Z): return ((X + MR) * MPX, (MR - Z) * MPX)


class Cam:
    def __init__(self, x, h, z, pitch_deg, cy=960.0, f=F):
        self.x, self.h, self.z = x, h, z; self.p = math.radians(pitch_deg); self.cy = cy; self.f = f
        self.sp, self.cp = math.sin(self.p), math.cos(self.p)

    def depth(self, X, Y, Z): return -(Y - self.h) * self.sp + (Z - self.z) * self.cp

    def pr(self, X, Y, Z):
        dpt = max(1e-4, self.depth(X, Y, Z)); ys = (Y - self.h) * self.cp + (Z - self.z) * self.sp
        return (540 + self.f * (X - self.x) / dpt, self.cy - self.f * ys / dpt)

    def horizon(self): return self.cy - self.f * math.tan(self.p)

    def zmin(self, near=0.06): return self.z + (near - self.h * self.sp) / self.cp


# ---------------- the map texture, drawn once
def _rng(seed): return np.random.default_rng(seed)


ROAD_ANG = [math.atan2(FARM[1], FARM[0]), math.radians(20), math.radians(95), math.radians(150), math.radians(205), math.radians(-25)]


def road_path(a, r0=RC * 0.8, r1=MR * 1.4, wob=0.05, seed=0):
    rs = _rng(seed); p = skia.Path(); pts = []
    for i in range(30):
        r = lerp(r0, r1, i / 29); aa = a + wob * math.sin(r * 1.7 + seed) / max(0.6, r)
        pts.append(m2p(r * math.cos(aa), r * math.sin(aa)))
    p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    return p


def farm_road():
    p = skia.Path(); p.moveTo(*m2p(0, 0)); p.lineTo(*m2p(*FARM)); return p


def annulus(r0, r1, a0=None, a1=None):
    cx, cy = m2p(0, 0)
    ring = skia.Path(); ring.addCircle(cx, cy, r1 * MPX); hole = skia.Path(); hole.addCircle(cx, cy, r0 * MPX)
    ring = skia.Op(ring, hole, skia.PathOp.kDifference_PathOp)
    if a0 is None: return ring
    w = skia.Path(); w.moveTo(cx, cy); n = 40
    for i in range(n + 1):
        a = lerp(a0, a1, i / n); w.lineTo(cx + math.cos(a) * r1 * MPX * 1.2, cy + math.sin(a) * r1 * MPX * 1.2)
    w.close()
    return skia.Op(ring, w, skia.PathOp.kIntersect_PathOp)


def fields(c, rs, r0, r1, cols, n, size=(0.18, 0.4), stripes=None, a=255):
    for _ in range(n):
        r = math.sqrt(rs.uniform(r0 ** 2, r1 ** 2)); th = rs.uniform(0, 2 * math.pi)
        x, y = m2p(r * math.cos(th), r * math.sin(th))
        w = rs.uniform(*size) * MPX; h = rs.uniform(*size) * MPX * 0.7
        c.save(); c.translate(x, y); c.rotate(math.degrees(th) + rs.uniform(-12, 12))
        col = cols[rs.integers(len(cols))]
        rr = skia.Rect(-w / 2, -h / 2, w / 2, h / 2)
        c.drawRect(rr, P(col, a))
        if stripes:
            c.save(); c.clipRect(rr)
            for k in range(-20, 21): c.drawLine(-w, k * stripes, w, k * stripes, SP(mix(col, (40, 40, 20), 0.18), 2.2, 120))
            c.restore()
        c.drawRect(rr, SP(mix(col, (40, 60, 30), 0.45), 3, 150))
        c.restore()


@functools.lru_cache(None)
def base_map():
    s = skia.Surface(MS, MS); c = s.getCanvas(); rs = _rng(3)
    c.clear(C(GRASS))
    cx, cy = m2p(0, 0)
    fields(c, rs, 0.4, MR * 1.4, [(140, 176, 96), (120, 160, 86), (170, 180, 104), (186, 176, 110), (150, 140, 96), (112, 150, 84)], 900, (0.25, 0.5), stripes=6)
    wild = skia.Path(); wild.addRect(skia.Rect(0, 0, MS, MS)); hole = skia.Path(); hole.addCircle(cx, cy, R4 * MPX + 40)
    wild = skia.Op(wild, hole, skia.PathOp.kDifference_PathOp)
    c.save(); c.clipPath(wild, skia.ClipOp.kIntersect, True)
    c.drawPaint(P((104, 132, 84), 150))
    for _ in range(900):
        x, y = rs.uniform(0, MS, 2); r = rs.uniform(10, 26); c.drawCircle(x + 5, y + 6, r, P((50, 70, 50), 90)); c.drawCircle(x, y, r, P((80, 112, 70), 220))
    c.restore()
    for i, a in enumerate(ROAD_ANG):
        rp = road_path(a, seed=i) if i else farm_road_ext()
        c.drawPath(rp, SP((150, 130, 96), 16)); c.drawPath(rp, SP((222, 200, 150), 10))
    c.drawCircle(cx, cy, RC * MPX, P((176, 160, 140)))                    # the town's paved ground
    return s.makeImageSnapshot()


def farm_road_ext():
    p = skia.Path(); p.moveTo(*m2p(0, 0)); fx, fz = FARM; L = math.hypot(fx, fz)
    p.lineTo(*m2p(fx / L * MR * 1.4, fz / L * MR * 1.4)); return p


@functools.lru_cache(None)
def ring_layer(i):
    s = skia.Surface(MS, MS); c = s.getCanvas(); rs = _rng(10 + i)
    r0, r1 = ((RC, R1), (R1, R2), (R2, R3), (R3, R4))[i]
    c.save(); c.clipPath(annulus(r0, r1), skia.ClipOp.kIntersect, True)
    if i == 0:                                                        # market gardens and dairy pastures
        c.drawPaint(P((150, 190, 104)))
        for _ in range(170):                                       # market gardens: plots of vegetable rows, dark leaves on brown soil
            r = math.sqrt(rs.uniform(r0 ** 2, r1 ** 2)); th = rs.uniform(0, 2 * math.pi)
            x, y = m2p(r * math.cos(th), r * math.sin(th)); w = rs.uniform(0.12, 0.22) * MPX; h = rs.uniform(0.08, 0.14) * MPX
            c.save(); c.translate(x, y); c.rotate(math.degrees(th) + rs.uniform(-10, 10)); rr = skia.Rect(-w / 2, -h / 2, w / 2, h / 2)
            leaf = [(70, 140, 60), (110, 170, 70), (60, 120, 70)][rs.integers(3)]
            c.drawRect(rr, P((150, 112, 80))); c.save(); c.clipRect(rr)
            for k in range(-12, 13): c.drawLine(-w, k * 7, w, k * 7, SP(leaf, 4.5))
            c.restore(); c.drawRect(rr, SP((90, 120, 60), 2.5)); c.restore()
    elif i == 1:                                                      # woodland: crowns seen from above, each with its shadow
        c.drawPaint(P((56, 92, 58)))
        for _ in range(2600):
            r = math.sqrt(rs.uniform(r0 ** 2, r1 ** 2)); th = rs.uniform(0, 2 * math.pi); x, y = m2p(r * math.cos(th), r * math.sin(th)); rr = rs.uniform(9, 17)
            col = [(54, 98, 58), (72, 118, 62), (44, 84, 54), (88, 130, 70)][rs.integers(4)]
            c.drawCircle(x + 5, y + 6, rr, P((24, 44, 34), 120)); c.drawCircle(x, y, rr, P(col)); c.drawCircle(x - rr * 0.3, y - rr * 0.3, rr * 0.5, P(mix(col, (220, 230, 150), 0.3), 160))
    elif i == 2:                                                      # grain: gold fields with combed rows, a few still green
        c.drawPaint(P((214, 184, 96)))
        fields(c, rs, r0, r1, [(232, 196, 96), (222, 180, 84), (240, 210, 120), (206, 170, 80), (176, 186, 100)], 420, (0.16, 0.32), stripes=5)
    else:                                                             # open pasture with fences
        c.drawPaint(P((160, 196, 112)))
        fields(c, rs, r0, r1, [(166, 202, 116), (150, 190, 104), (176, 206, 124)], 240, (0.3, 0.55), a=255)
        for _ in range(160):
            r = math.sqrt(rs.uniform(r0 ** 2, r1 ** 2)); th = rs.uniform(0, 2 * math.pi); x, y = m2p(r * math.cos(th), r * math.sin(th))
            c.drawCircle(x + 4, y + 5, 12, P((40, 60, 40), 90)); c.drawCircle(x, y, 12, P((76, 116, 66)))
    c.restore()
    for k, a in enumerate(ROAD_ANG):                                  # roads stay on top of the crops
        rp = road_path(a, seed=k) if k else farm_road_ext()
        c.save(); c.clipPath(annulus(r0, r1), skia.ClipOp.kIntersect, True); c.drawPath(rp, SP((150, 130, 96), 16)); c.drawPath(rp, SP((222, 200, 150), 10)); c.restore()
    return s.makeImageSnapshot()


RING_COL = [(150, 230, 120), (90, 190, 110), (255, 214, 90), (180, 240, 150)]


# ---------------- upright things
_rs = _rng(21)
HOUSES = []
for _ in range(34):
    r = RC * math.sqrt(_rs.uniform(0.02, 0.9)); th = _rs.uniform(0, 2 * math.pi)
    HOUSES.append((r * math.cos(th), r * math.sin(th), _rs.uniform(0.06, 0.1), _rs.uniform(0.05, 0.08), _rs.uniform(0.06, 0.1), _rs.uniform(0, 1.6),
                   [(236, 226, 206), (226, 210, 186), (214, 200, 190), (240, 232, 214)][_rs.integers(4)], [(176, 74, 58), (150, 66, 56), (120, 76, 70)][_rs.integers(3)]))
SPIRES = [(-0.06, 0.04, 0.5), (0.13, -0.08, 0.38)]


def box(c, cam, X, Z, w, d, h, rot, wall, roof):
    ca, sa = math.cos(rot), math.sin(rot)
    def W(u, v, y): return cam.pr(X + u * ca - v * sa, y, Z + u * sa + v * ca)
    corners = [(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)]
    # side walls facing the camera (cheap test: draw all four, far ones first)
    faces = []
    for i in range(4):
        a, b = corners[i], corners[(i + 1) % 4]
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        dep = cam.depth(X + mid[0] * ca - mid[1] * sa, h / 2, Z + mid[0] * sa + mid[1] * ca)
        faces.append((dep, i, a, b))
    faces.sort(reverse=True)
    for dep, i, a, b in faces:
        q = [W(*a, 0), W(*b, 0), W(*b, h), W(*a, h)]
        pth = skia.Path(); pth.addPoly([skia.Point(*p) for p in q], True)
        c.drawPath(pth, P(wall if i % 2 == 0 else mix(wall, (90, 80, 110), 0.3)))
    # a pitched roof along u
    r1, r2 = W(-w / 2, 0, h + w * 0.5), W(w / 2, 0, h + w * 0.5)
    for side in (-1, 1):
        q = [W(-w / 2, side * d / 2, h), W(w / 2, side * d / 2, h), r2, r1]
        pth = skia.Path(); pth.addPoly([skia.Point(*p) for p in q], True)
        c.drawPath(pth, P(roof if side < 0 else mix(roof, (60, 30, 40), 0.3)))


def spire(c, cam, X, Z, h):
    tw = 0.07
    box(c, cam, X, Z, tw, tw, h * 0.55, 0.3, (226, 214, 196), (140, 110, 100))
    top = cam.pr(X, h, Z); b1 = cam.pr(X - tw * 0.6, h * 0.55, Z); b2 = cam.pr(X + tw * 0.6, h * 0.55, Z)
    p = skia.Path(); p.addPoly([skia.Point(*top), skia.Point(*b1), skia.Point(*b2)], True); c.drawPath(p, P((96, 120, 120)))
    p2 = skia.Path(); p2.addPoly([skia.Point(*top), skia.Point(*b1), skia.Point((b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2)], True); c.drawPath(p2, P((132, 160, 156)))


HW = 0.15                                                  # the farmer's height in model units (pieces are shown larger than the land's scale)


def sprite_scale(cam, X, Z, hw=HW):
    """screen pixels per model unit (1100 units = the farmer's height) for something standing at X,Z"""
    return cam.f * hw / max(0.02, cam.depth(X, hw * 0.5, Z)) / 1100.0
