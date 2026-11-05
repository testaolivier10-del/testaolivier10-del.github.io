"""Code drawn carpenter ant (Camponotus) for the zombie ant Short, house flat style: side view, dark brown plates with a
shade tone away from the light and a warm rim, legs as two segment IK with feet planted on the surface (tripod gait,
feet locked to the ground while in stance), antennae with an elbow, mandibles that open and lock, a see through
cutaway that shows only the body (fungal threads in the thorax and gaster, never in the head), and the fungal stalk
that grows from behind the head. Units: ant length about 300 at scale 1, facing +x, surface at y=0 (y down)."""
import math
import numpy as np, skia
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat

BODY = (52, 34, 26)
BODY_SH = (34, 22, 17)
BODY_HI = (96, 66, 48)
RIM = (255, 196, 120)
LEG = (44, 29, 22)
HYPHA = (246, 238, 214)
STALK = (214, 190, 150)
STALK_SH = (170, 142, 104)

# body plates in ant space (facing +x)
GASTER = [(-150, -58), (-118, -96), (-60, -104), (-24, -84), (-12, -58), (-30, -34), (-80, -26), (-132, -32)]
PETIOLE = [(-18, -66), (-6, -84), (6, -78), (6, -54), (-10, -50)]
THORAX = [(4, -64), (14, -92), (56, -104), (92, -96), (104, -82), (96, -64), (56, -56), (20, -54)]
HEAD = [(100, -96), (122, -122), (162, -126), (190, -110), (196, -84), (176, -66), (134, -64), (108, -74)]
HIPS = [(86, -62), (66, -60), (46, -60)]        # front, mid, hind leg roots on the thorax


def _leg_ik(hip, foot, l1, l2, up=-1):
    hx, hy = hip; fx, fy = foot
    d = min(math.hypot(fx - hx, fy - hy), l1 + l2 - 0.5)
    a = math.atan2(fy - hy, fx - hx)
    cb = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    b = math.acos(max(-1, min(1, cb)))
    k1 = (hx + l1 * math.cos(a + b), hy + l1 * math.sin(a + b))
    k2 = (hx + l1 * math.cos(a - b), hy + l1 * math.sin(a - b))
    return k1 if k1[1] < k2[1] else k2          # knee always above the hip to foot line


def _seg(c, a, b, w0, w1, col):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d
    p = skia.Path(); p.moveTo(ax + nx * w0 / 2, ay + ny * w0 / 2); p.lineTo(bx + nx * w1 / 2, by + ny * w1 / 2)
    p.lineTo(bx - nx * w1 / 2, by - ny * w1 / 2); p.lineTo(ax - nx * w0 / 2, ay - ny * w0 / 2); p.close()
    p.addCircle(ax, ay, w0 / 2); p.addCircle(bx, by, w1 / 2)
    c.drawPath(p, P(col))


def gait_feet(travel, stride=86, lift=26, still=False, splay=0.0):
    """foot targets for the 6 legs relative to the body (near and far side). Tripod gait: legs (front near, mid far,
    hind near) move together. travel = distance walked so far (ant space units); in stance the foot stays planted
    on the surface (moves back relative to the body exactly as fast as the body moves forward)."""
    out = []
    base = [196, 70, -96]           # neutral foot x for front, mid, hind
    for side in (0, 1):
        for i in range(3):
            off = 0.5 * ((i + side) % 2)
            p = (travel / stride + off) % 1.0
            if still: p = 0.25
            if p < 0.5:      # stance: planted
                fx = base[i] + stride * (0.25 - p); fy = 0.0
            else:            # swing forward with lift
                q = (p - 0.5) / 0.5
                fx = base[i] + stride * (-0.25 + q * 0.5); fy = -lift * math.sin(math.pi * q)
            fx += splay * (i - 1) * 30
            out.append((side, i, fx, fy))
    return out


def ant(c, x, y, s, t, travel=0.0, rot=0.0, face=1, mand=0.0, lock=0.0, cut=0.0, hyph=0.0, spore=0.0,
        stalk=0.0, stalk_t=0.0, dead=0.0, still=False, light=1.0, br_ph=0.0, shadow=True, ant_alpha=255):
    """draw the ant with its feet on the surface at (x, y). rot in degrees (surface direction), face = +1/-1.
    mand: mandible gape 0..1; lock: 1 when locked shut on the vein; cut: see through cutaway 0..1; hyph: fungal
    threads grown 0..1; spore: a spore stuck on the shell 0..1; stalk: stalk growth 0..1; dead: legs stiffen 0..1"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * face, s)
    if shadow:
        c.drawOval(skia.Rect(-170, -8, 200, 10), P((10, 14, 8), 70, MaskFilter=blur(8)))
    bob = 0 if still else 2.2 * math.sin(travel / 86 * 2 * math.pi * 2)
    c.translate(0, -34 + bob)      # body rides above the surface on the legs
    feet = gait_feet(travel, still=still or dead > 0.5, splay=dead * 0.4)
    # far legs first (dimmer), then body, then near legs
    def legs(side):
        for (sd, i, fx, fy) in feet:
            if sd != side: continue
            hx, hy = HIPS[i]
            hx += -6 * side; hy += 2 * side
            foot = (fx - 10 * side, 34 - bob + fy)         # surface is at +34 in body space
            l1, l2 = (96, 104) if i != 2 else (110, 124)
            if i == 0: l1, l2 = 92, 100
            knee = _leg_ik((hx, hy), foot, l1, l2, up=-1 if i > 0 else 1)
            col = mix(LEG, (20, 16, 12), 0.35) if side else LEG
            _seg(c, (hx, hy), knee, 12, 9, col)
            _seg(c, knee, foot, 9, 5, col)
            # tarsus: a short foot segment lying along the surface
            _seg(c, foot, (foot[0] + (10 if i == 0 else -10), foot[1] + 1), 5, 3, col)
    legs(1)
    # antennae (far one dim), elbowed
    for side in (1, 0):
        col = (30, 20, 16) if side else LEG
        sw = 0 if still or dead > 0.5 else 8 * math.sin(t * 3.1 + side * 1.7)
        a0 = (170 - 6 * side, -118); a1 = (186 + 4 * side, -176 + sw * 0.4)
        a2 = (238 - 6 * side + sw, -150 + 6 * side + (30 * dead))
        _seg(c, a0, a1, 6, 5, col); _seg(c, a1, a2, 5, 4, col)
    br = 1 + 0.015 * math.sin(t * 2.2 + br_ph) * (1 - dead)
    gas = [(px * br if px < -20 else px, py) for px, py in GASTER]
    paths = [smooth_closed(gas), smooth_closed(PETIOLE), smooth_closed(THORAX), smooth_closed(HEAD)]
    for pth in paths:
        flat(c, pth, BODY, BODY_SH, sh_off=(0, 10), rim=mix(BODY, RIM, 0.75 * light), rim_d=(0, -3.2), rim_a=230)
    # soft highlight on gaster and head (chitin sheen)
    c.drawOval(skia.Rect(-120, -96, -60, -82), P(BODY_HI, 120 * light, MaskFilter=blur(5)))
    c.drawOval(skia.Rect(130, -120, 168, -110), P(BODY_HI, 110 * light, MaskFilter=blur(4)))
    # gaster bands
    for k in range(3):
        bx = -100 + k * 26
        pp = skia.Path(); pp.moveTo(bx, -100 + k * 2); pp.quadTo(bx + 8, -64, bx - 2, -30)
        c.drawPath(pp, SP(BODY_SH, 2.6, 160))
    # see through cutaway of the body only (thorax and gaster), threads inside
    if cut > 0.01:
        body = skia.Path(); body.addPath(paths[0]); body.addPath(paths[2]); body.addPath(paths[1])
        c.save(); c.clipPath(body, doAntiAlias=True)
        c.drawPath(body, P((92, 58, 44), 200 * cut))
        # muscle bundles (pale red) in the thorax
        for k in range(5):
            mx = 20 + k * 16
            c.drawOval(skia.Rect(mx - 9, -96, mx + 9, -60), P((176, 92, 82), 150 * cut))
        if hyph > 0.01: _hyphae(c, hyph, cut)
        c.restore()
        c.drawPath(body, SP(mix(BODY, RIM, 0.6), 3, 200 * cut))
    if spore > 0.01:
        sx, sy = 40, -104 - 30 * (1 - spore)
        c.drawOval(skia.Rect(sx - 9, sy - 5, sx + 9, sy + 5), P((240, 232, 206), 255 * min(1, spore * 2)))
        c.drawOval(skia.Rect(sx - 4, sy - 3, sx + 3, sy), P((255, 255, 240), 200 * min(1, spore * 2)))
    # eye and mandibles
    c.drawOval(skia.Rect(164, -112, 180, -100), P((16, 10, 8)))
    c.drawCircle(174, -109, 2.2, P((255, 236, 210), 200 * light))
    gape = mand * (1 - lock)
    for side in (1, 0):
        col = (36, 22, 16) if side else (64, 42, 30)
        c.save(); c.translate(190, -78); c.rotate(26 * gape - 4 * lock - 6 * side)
        m = smooth_closed([(-6, -6), (14, -8), (30, 0), (36, 10), (24, 6), (8, 6), (-4, 4)])
        c.drawPath(m, P(col))
        for k in range(3): c.drawCircle(14 + k * 7, 4, 1.6, P((20, 12, 8)))
        c.restore()
    legs(0)
    if stalk > 0.01: _stalk(c, stalk, t)
    c.restore()


_RS = np.random.default_rng(11)
_HY = []
for k in range(26):
    # branching threads seeded in the gaster and thorax (never in the head)
    x0, y0 = (_RS.uniform(-140, -30), _RS.uniform(-96, -36)) if k % 3 else (_RS.uniform(10, 96), _RS.uniform(-96, -60))
    pts = [(x0, y0)]
    ang = _RS.uniform(0, 2 * math.pi)
    for j in range(7):
        ang += _RS.uniform(-0.9, 0.9)
        x0 += 16 * math.cos(ang); y0 += 12 * math.sin(ang)
        pts.append((x0, y0))
    _HY.append((k / 26.0, pts))


def _hyphae(c, u, a):
    for (st, pts) in _HY:
        g = (u - st * 0.7) / 0.3
        if g <= 0: continue
        n = 1 + int(min(1, g) * (len(pts) - 1))
        p = skia.Path(); p.moveTo(*pts[0])
        for q in pts[1:n + 1]: p.lineTo(*q)
        c.drawPath(p, SP(HYPHA, 2.4, 230 * a))
        c.drawPath(p, SP(HYPHA, 6, 60 * a, MaskFilter=blur(3)))


def _stalk(c, u, t):
    """a single stalk out of the back of the head, curving up and out, with a swelling partway (the spore part)"""
    L_ = 260 * smooth(u)
    base = (118, -118)
    pts = []
    for k in range(13):
        f = k / 12 * (L_ / 260)
        pts.append((base[0] + 40 * f + 30 * math.sin(f * 2.2), base[1] - 260 * f))
    if len(pts) < 2: return
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    c.drawPath(p, SP(STALK_SH, 11))
    c.drawPath(p, SP(STALK, 8))
    p2 = skia.Path(); p2.moveTo(pts[0][0] - 2, pts[0][1])
    for q in pts[1:]: p2.lineTo(q[0] - 2, q[1])
    c.drawPath(p2, SP((240, 222, 186), 2.4, 200))
    # the swelling (ascoma) about two thirds up, grows last
    sw = smooth((u - 0.55) / 0.45)
    if sw > 0 and len(pts) > 8:
        sx, sy = pts[8]
        c.drawOval(skia.Rect(sx - 16 * sw, sy - 22 * sw, sx + 16 * sw, sy + 22 * sw), P(STALK_SH))
        c.drawOval(skia.Rect(sx - 13 * sw, sy - 19 * sw, sx + 11 * sw, sy + 17 * sw), P((198, 168, 120)))
        c.drawOval(skia.Rect(sx - 8 * sw, sy - 15 * sw, sx - 2 * sw, sy - 4 * sw), P((236, 216, 176), 180))
    tip = pts[-1]
    c.drawCircle(tip[0], tip[1], 5, P(STALK))


def stalk_spore_point(x, y, s, rot, face):
    """world position of the swelling for spores, from the ant's placement"""
    bx, by = 118 + 40 * (8 / 12) + 30 * math.sin(8 / 12 * 2.2), -118 - 260 * (8 / 12) - 18
    a = math.radians(rot)
    px, py = bx * s * face, by * s
    return (x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a))
