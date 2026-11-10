"""People study, step 1 (Olivier 2026-11-09: start with a basic person, a guy doing a simple action, and iterate from there).
One man, front view, about 7 heads tall, on a plain board background. Action: he looks at us, lifts his right arm and waves, lowers it.
Built as a small forward kinematics rig: every limb is a shaped path (not a tube) driven by joint angles, the whole body shares one
shade direction and one rim. House flat layered style."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/guy']
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import shaded, diffp, tube, op, glow
import hands as H

SKIN, SKIN_SH, SKIN_HI = (226, 174, 142), (186, 128, 108), (252, 216, 188)
HAIR, HAIR_SH, HAIR_HI = (62, 42, 36), (40, 26, 26), (120, 84, 64)
TOP, TOP_SH, TOP_HI = (86, 134, 200), (56, 94, 158), (156, 194, 240)
PANT, PANT_SH, PANT_HI = (206, 180, 142), (160, 134, 108), (240, 220, 190)
SHOE, SHOE_SH, SOLE = (240, 240, 236), (186, 188, 200), (214, 216, 226)
LIGHT = (-0.7, -0.6)                                        # key light from the upper left
RELAX = dict(curls=(0.45, 0.5, 0.56, 0.62, 0.66), spread=0.12)


def rot(v, a):
    c, s = math.cos(a), math.sin(a); return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)


def limb(p0, p1, w0, w1, bulge=0.0, bu=0.35, side=1):
    """a limb as one smooth shape from p0 to p1: width w0 -> w1, with a muscle bulge on one side at fraction bu"""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy) or 1; ux, uy = dx / L, dy / L; nx, ny = -uy, ux
    us = (0.0, 0.18, bu, 0.62, 0.86, 1.0)
    left, right = [], []
    for u in us:
        w = lerp(w0, w1, u) / 2
        b = bulge * math.exp(-((u - bu) / 0.22) ** 2)
        x, y = p0[0] + dx * u, p0[1] + dy * u
        left.append((x + nx * (w + (b if side > 0 else b * 0.3)), y + ny * (w + (b if side > 0 else b * 0.3))))
        right.append((x - nx * (w + (b if side < 0 else b * 0.3)), y - ny * (w + (b if side < 0 else b * 0.3))))
    cap0 = (p0[0] - ux * w0 * 0.42, p0[1] - uy * w0 * 0.42); cap1 = (p1[0] + ux * w1 * 0.42, p1[1] + uy * w1 * 0.42)
    return smooth_closed([cap0] + left + [cap1] + right[::-1])


def stroke(c, pts, w, col, a=255):
    p = skia.Path(); p.moveTo(*pts[0])
    if len(pts) == 3: p.quadTo(*pts[1], *pts[2])
    else: p.cubicTo(*pts[1], *pts[2], *pts[3])
    c.drawPath(p, SP(col, w, a))


class Pose:
    def __init__(self, **kw):
        self.sway = 0.0          # hips shift sideways (weight), px
        self.lean = 0.0          # chest tilt, degrees
        self.breath = 0.0        # 0..1
        self.head_tilt = 0.0     # degrees
        self.head_x = 0.0        # small head shift
        self.sh_r = 0.0          # his right shoulder lift (screen left), px up
        # arms: angle of the upper arm from straight down (deg, + = out to the side), forearm bend relative, wrist relative
        self.r_up, self.r_fore, self.r_wrist = 7.0, 6.0, -10.0     # his right arm (screen left)
        self.l_up, self.l_fore, self.l_wrist = 7.0, 8.0, -10.0    # his left arm (screen right)
        self.r_hand, self.l_hand = RELAX, RELAX
        self.r_palm = False
        self.smile = 0.0; self.brow = 0.0; self.lid = 1.0; self.look = (0.0, 0.0)
        self.__dict__.update(kw)


def draw(c, ps, x=540, ground=1660, s=1.14, t=0.0):
    c.save(); c.translate(x, ground); c.scale(s, s)
    d = (LIGHT[0] * 9, LIGHT[1] * 9)
    br = 3.0 * ps.breath
    # ---------------- skeleton (y up is negative)
    hipc = (ps.sway, -520.0)
    la = math.radians(ps.lean)
    chest = (hipc[0] + 232 * math.sin(la) - ps.sway * 0.45, hipc[1] - 232 * math.cos(la) - br)
    up = (math.sin(la), -math.cos(la)); rt = (math.cos(la), math.sin(la))
    T = lambda u, v: (chest[0] + rt[0] * u + up[0] * v, chest[1] + rt[1] * u + up[1] * v)       # chest space: u right, v up
    sh_r = T(-132, 2 + ps.sh_r); sh_l = T(132, 2)
    neck0 = T(0, 46)
    # legs: feet planted; the hips shift over them
    feet = {'r': (-78.0, 0.0), 'l': (78.0, 0.0)}
    hips = {'r': (hipc[0] - 50, hipc[1] + 6), 'l': (hipc[0] + 50, hipc[1] + 6)}
    # ---------------- shadow on the floor
    c.drawOval(skia.Rect(-210, -18, 210, 26), P((6, 8, 28), 120, MaskFilter=blur(12)))
    # ---------------- shoes
    for k, sx in (('r', -1), ('l', 1)):
        fx, fy = feet[k]
        sole = smooth_closed([(fx - 52, fy + 6), (fx - 54, fy - 8), (fx + 54, fy - 8), (fx + 52 + sx * 12, fy + 6)])
        c.drawPath(sole, P(SOLE))
        upper = smooth_closed([(fx - 48, fy - 6), (fx - 52, fy - 34), (fx - 30, fy - 64), (fx + 30, fy - 64), (fx + 52, fy - 34), (fx + 48 + sx * 10, fy - 6)])
        shaded(c, upper, SHOE, SHOE_SH, sh=(-d[0] * 0.8, -d[1] * 0.8))
        c.drawPath(smooth_closed([(fx - 22, fy - 60), (fx + 22, fy - 60), (fx + 16, fy - 26), (fx - 16, fy - 26)]), P(mix(SHOE, SHOE_SH, 0.35)))
        for j in range(3): c.drawLine(fx - 15, fy - 52 + j * 10, fx + 15, fy - 52 + j * 10, SP((150, 156, 176), 3))
        c.drawRect(skia.Rect(fx - 50, fy - 14, fx + 50 + (10 if sx > 0 else 0), fy - 9), P(TOP, 230))
    # ---------------- trousers: both legs and the hips as ONE shape
    legs = None
    knees = {}
    for k, sx in (('r', -1), ('l', 1)):
        hp = hips[k]; ft = (feet[k][0], feet[k][1] - 58)
        kx = lerp(hp[0], ft[0], 0.5) + sx * 5; ky = lerp(hp[1], ft[1], 0.5) - 4
        knees[k] = (kx, ky)
        th = limb(hp, (kx, ky), 112, 82, bulge=7, bu=0.3, side=-sx)
        shin = limb((kx, ky), (ft[0], ft[1] + 10), 80, 70, bulge=5, bu=0.3, side=-sx)
        kc = skia.Path(); kc.addCircle(kx, ky, 40)
        part = op(op(th, shin), kc)
        legs = part if legs is None else op(legs, part)
    pelvis = smooth_closed([(hipc[0] - 104, hipc[1] - 6), (hipc[0] + 104, hipc[1] - 6), (hipc[0] + 116, hipc[1] + 30), (hipc[0] + 60, hipc[1] + 92), (hipc[0], hipc[1] + 70),
                            (hipc[0] - 60, hipc[1] + 92), (hipc[0] - 116, hipc[1] + 30)])
    legs = op(legs, pelvis)
    shaded(c, legs, PANT, PANT_SH, sh=(-d[0] * 1.3, -d[1] * 0.5), rimL=PANT_HI, rl=(d[0] * 0.45, d[1] * 0.45))
    c.save(); c.clipPath(legs, skia.ClipOp.kIntersect, True)
    stroke(c, [(hipc[0], hipc[1] + 20), (hipc[0] + 2, hipc[1] + 60), (hipc[0] + 0, hipc[1] + 96)], 4, PANT_SH, 200)                      # fly seam
    for k, sx in (('r', -1), ('l', 1)):
        kx, ky = knees[k]
        stroke(c, [(kx - 30, ky - 8), (kx, ky + 4), (kx + 30, ky - 10)], 4, PANT_SH, 150); stroke(c, [(kx - 24, ky + 14), (kx, ky + 22), (kx + 22, ky + 12)], 3, PANT_SH, 110)
        stroke(c, [(hips[k][0] + sx * 44, hips[k][1] + 10), (hips[k][0] + sx * 10, hips[k][1] + 40), (hips[k][0] - sx * 30, hips[k][1] + 34)], 4, PANT_SH, 120)   # hip fold
        ft = feet[k]; stroke(c, [(ft[0] - 30, ft[1] - 78), (ft[0], ft[1] - 70), (ft[0] + 30, ft[1] - 80)], 4, PANT_SH, 140)                 # break over the shoe
    c.restore()
    # ---------------- neck (under the collar)
    head_c = (neck0[0] + ps.head_x + up[0] * 108, neck0[1] + up[1] * 108)
    nk = smooth_closed([T(-34, 26), T(-30, 80), (head_c[0] - 30, head_c[1] + 50), (head_c[0] + 30, head_c[1] + 50), T(30, 80), T(34, 26), T(0, 16)])
    shaded(c, nk, mix(SKIN, SKIN_SH, 0.3), SKIN_SH, sh=(-d[0] * 1.4, 0))
    # ---------------- sweatshirt body
    wst = (hipc[0], hipc[1] + 4)
    torso = smooth_closed([T(-46, 50), T(-100, 38 + ps.sh_r * 0.6), T(-150, 12 + ps.sh_r), T(-158, -40 + ps.sh_r * 0.5), T(-140, -120), (wst[0] - 114, wst[1] - 96), (wst[0] - 118, wst[1] - 20), (wst[0] - 120, wst[1] + 26),
                           (wst[0], wst[1] + 32), (wst[0] + 120, wst[1] + 26), (wst[0] + 118, wst[1] - 20), (wst[0] + 114, wst[1] - 96), T(140, -120), T(158, -40), T(150, 12), T(100, 38), T(46, 50), T(0, 40)])
    shaded(c, torso, TOP, TOP_SH, sh=(-d[0] * 1.6, -d[1] * 0.6), rimL=TOP_HI, rl=(d[0] * 0.5, d[1] * 0.5))
    c.save(); c.clipPath(torso, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(wst[0] - 140, wst[1] - 2, wst[0] + 140, wst[1] + 40), P(TOP_SH, 110))                                           # ribbed hem
    for j in range(-10, 11): c.drawLine(wst[0] + j * 12, wst[1] + 2, wst[0] + j * 12, wst[1] + 36, SP(TOP_SH, 2.4, 150))
    stroke(c, [(wst[0] - 108, wst[1] - 40), (wst[0] - 70, wst[1] - 22), (wst[0] - 34, wst[1] - 28)], 4, TOP_SH, 110)
    stroke(c, [(wst[0] + 110, wst[1] - 56), (wst[0] + 74, wst[1] - 36), (wst[0] + 42, wst[1] - 42)], 4, TOP_SH, 100)
    raise_k = smooth((ps.r_up - 30) / 70.0)
    if raise_k > 0:                                         # cloth pulling toward the raised arm
        stroke(c, [T(-140, -30), T(-104, -60), T(-80, -110)], 4.5, TOP_SH, 130 * raise_k); stroke(c, [T(-138, -76), T(-108, -100), T(-92, -140)], 4, TOP_SH, 100 * raise_k)
    c.restore()
    col = smooth_closed([T(-50, 54), T(-30, 40), T(0, 34), T(30, 40), T(50, 54), T(44, 28), T(0, 12), T(-44, 28)])
    c.drawPath(col, P(mix(TOP, (255, 255, 255), 0.18))); c.drawPath(diffp(col, (0, -6)), P(TOP_SH))

    # ---------------- arms (forward kinematics), drawn as shaped limbs with the sleeve, cuff and the shared hand model
    def arm(sh, side, a_up, a_fore, a_wrist, pose, palm, front):
        # side -1 = his right arm (screen left). Angles measured from straight down, positive = outward on that side.
        a1 = math.radians(a_up); dir1 = (side * math.sin(a1), math.cos(a1))
        el = (sh[0] + dir1[0] * 158, sh[1] + dir1[1] * 158)
        a2 = math.radians(a_up + a_fore); dir2 = (side * math.sin(a2), math.cos(a2))
        wr = (el[0] + dir2[0] * 140, el[1] + dir2[1] * 140)
        a3 = math.radians(a_up + a_fore + a_wrist); dir3 = (side * math.sin(a3), math.cos(a3))
        upa = limb((sh[0] - side * 4, sh[1] + 10), el, 74, 60, bulge=5, bu=0.35, side=side)
        fore = limb(el, wr, 64, 46, bulge=5, bu=0.25, side=-side)
        ec = skia.Path(); ec.addCircle(el[0], el[1], 27); sc_ = skia.Path(); sc_.addCircle(sh[0] - side * 12, sh[1] + 16, 30)
        whole = op(op(op(upa, fore), ec), sc_)
        if front: c.drawPath(whole, P((20, 30, 70), 80, MaskFilter=blur(9)))
        ang = math.atan2(dir3[1], dir3[0])
        hw = (wr[0] + dir2[0] * 6, wr[1] + dir2[1] * 6)
        # thumb toward the body when the arm hangs; for a raised open palm the thumb points in toward the head
        thumb_side = side if dir3[1] > 0 else -side
        H.hand(c, hw, ang, thumb_side, 1.0, skin=SKIN, shade=SKIN_SH, hi=SKIN_HI, light=LIGHT, palm=palm, narrow=lerp(0.7, 1.0, min(1.0, max(0.0, 1 - (pose['curls'][2] - 0.05) / 0.5))), **pose)
        shaded(c, whole, TOP, TOP_SH, sh=(-d[0] * 1.3, -d[1] * 0.6))
        rimp = diffp(whole, (d[0] * 0.45, d[1] * 0.45))
        try: rimp = skia.Op(rimp, torso, skia.PathOp.kDifference_PathOp) or rimp
        except RuntimeError: pass
        c.drawPath(rimp, P(TOP_HI))
        bend = abs(a_fore)
        n2 = (-dir2[1], dir2[0])
        c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
        for j in (0, 1):                                    # folds at the inside of the elbow, deeper the more it bends
            o = 10 + j * 12
            stroke(c, [(el[0] - n2[0] * 26 + dir2[0] * o, el[1] - n2[1] * 26 + dir2[1] * o), (el[0] + dir2[0] * (o + 6), el[1] + dir2[1] * (o + 6)), (el[0] + n2[0] * 26 + dir2[0] * o, el[1] + n2[1] * 26 + dir2[1] * o)],
                   3.5, TOP_SH, min(220, 90 + bend * 1.6) * (1 if j == 0 else 0.6))
        c.restore()
        cuff = limb((wr[0] - dir2[0] * 24, wr[1] - dir2[1] * 24), (wr[0] + dir2[0] * 2, wr[1] + dir2[1] * 2), 52, 50)
        c.drawPath(cuff, P(mix(TOP, (255, 255, 255), 0.18))); c.drawPath(diffp(cuff, (-d[0] * 0.7, -d[1] * 0.4)), P(TOP_SH))

    arm(sh_l, 1, ps.l_up, ps.l_fore, ps.l_wrist, ps.l_hand, False, True)
    if ps.r_up < 40: arm(sh_r, -1, ps.r_up, ps.r_fore, ps.r_wrist, ps.r_hand, ps.r_palm, True)
    # ---------------- head
    c.save(); c.translate(*head_c); c.rotate(ps.head_tilt)
    for sx in (-1, 1):                                      # ears
        e = smooth_closed([(sx * 60, -22), (sx * 76, -30), (sx * 82, -6), (sx * 74, 18), (sx * 60, 12)])
        shaded(c, e, SKIN, SKIN_SH, sh=(-d[0] * 0.5, -d[1] * 0.4)); c.drawPath(smooth_closed([(sx * 66, -18), (sx * 74, -8), (sx * 68, 8)]), P(SKIN_SH))
    face = smooth_closed([(-58, -60), (-64, -10), (-56, 36), (-34, 66), (0, 80), (34, 66), (56, 36), (64, -10), (58, -60), (40, -92), (0, -100), (-40, -92)])
    c.drawPath(face, P(SKIN))
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
    q = skia.Path(face); q.offset(-16, -5)
    dd = skia.Op(face, q, skia.PathOp.kDifference_PathOp)
    if dd is not None: c.drawPath(dd, P(SKIN_SH, 210))        # the shade side of the face
    q2 = skia.Path(face); q2.offset(5, 3)
    d2 = skia.Op(face, q2, skia.PathOp.kDifference_PathOp)
    if d2 is not None: c.drawPath(d2, P(SKIN_HI, 230))
    for sx in (-1, 1): c.drawOval(skia.Rect(sx * 36 - 17, 14 - 4 * ps.smile, sx * 36 + 17, 34 - 4 * ps.smile), P((240, 140, 130), 40 + 50 * ps.smile, MaskFilter=blur(6)))
    c.drawPath(smooth_closed([(-40, 62), (0, 74), (40, 62), (30, 84), (0, 90), (-30, 84)]), P(SKIN_SH, 60))                            # under the lip, jaw
    c.restore()
    # eyes: almond whites, iris, a lid line; they narrow a little when he smiles
    ey = -14
    for sx in (-1, 1):
        ex = sx * 27; op_ = max(0.04, ps.lid) * (1 - 0.22 * ps.smile); h = 9.5 * op_
        eye = smooth_closed([(ex - 16, ey + 1), (ex - 6, ey - h), (ex + 7, ey - h), (ex + 16, ey), (ex + 6, ey + h * 0.8), (ex - 7, ey + h * 0.8)])
        c.drawPath(eye, P((252, 250, 246)))
        c.save(); c.clipPath(eye, skia.ClipOp.kIntersect, True)
        ix, iy = ex + ps.look[0] * 5, ey + ps.look[1] * 3
        c.drawCircle(ix, iy, 8.2, P((92, 58, 42))); c.drawCircle(ix, iy, 4.2, P((30, 20, 20))); c.drawCircle(ix - 2.6, iy - 2.8, 2.2, P((255, 255, 255)))
        c.drawRect(skia.Rect(ex - 18, ey - h - 2, ex + 18, ey - h + 3.5), P((140, 100, 96), 120))
        c.restore()
        stroke(c, [(ex - 17, ey + 1), (ex - 4, ey - h - 3), (ex + 17, ey - 1)], 3.6, (54, 34, 32))                                       # upper lid
        if ps.smile > 0.3: stroke(c, [(ex - 12, ey + h + 4), (ex, ey + h + 7), (ex + 12, ey + h + 4)], 2.2, SKIN_SH, 160 * ps.smile)      # cheek pushing up
        by = ey - 22 - 6 * ps.brow
        stroke(c, [(ex - sx * 15, by + 3 - 1 * ps.brow), (ex + sx * 2, by - 6 - 2 * ps.brow), (ex + sx * 19, by + 2)], 7.5, HAIR)           # brow
    stroke(c, [(3, 2), (11, 30), (-3, 33)], 3.4, SKIN_SH, 235)                                                                           # nose
    c.drawOval(skia.Rect(-10, 31, 8, 37), P(SKIN_SH, 110))
    mw = 19 + 9 * ps.smile; cv = 2 + 9 * ps.smile; my = 52
    if ps.smile > 0.55:                                     # an open smile with teeth
        m = smooth_closed([(-mw, my - cv * 0.5), (0, my - 1), (mw, my - cv * 0.5), (mw * 0.6, my + cv * 0.9 + 4), (0, my + cv * 1.25 + 5), (-mw * 0.6, my + cv * 0.9 + 4)])
        c.drawPath(m, P((122, 44, 54)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(-mw, my - 8, mw, my + 5), P((255, 252, 246))); c.restore()
        c.drawPath(m, SP((150, 70, 72), 2.4))
    else:
        stroke(c, [(-mw, my - cv * 0.5), (0, my + cv * 0.8), (mw, my - cv * 0.5)], 4.2, (164, 84, 84))
    stroke(c, [(-9, my + 15 + cv * 0.5), (0, my + 18 + cv * 0.5), (9, my + 15 + cv * 0.5)], 2.4, SKIN_SH, 170)
    # hair: short, brushed up and across, with a clean hairline and sides
    hair = smooth_closed([(-66, -34), (-70, -74), (-52, -114), (-10, -132), (36, -128), (66, -100), (70, -62), (64, -36), (56, -64), (30, -84), (-12, -78), (-44, -84), (-58, -60)])
    shaded(c, hair, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
    c.save(); c.clipPath(hair, skia.ClipOp.kIntersect, True)
    for x0, x1 in ((-46, -10), (-20, 26), (10, 54)): stroke(c, [(x0, -86), ((x0 + x1) / 2, -116), (x1 + 8, -124)], 4, HAIR_HI, 120)
    c.restore()
    for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 58, -62), (sx * 68, -58), (sx * 66, -24), (sx * 60, -30)]), P(HAIR))            # sides down to the ears
    c.restore()
    if ps.r_up >= 40: arm(sh_r, -1, ps.r_up, ps.r_fore, ps.r_wrist, ps.r_hand, ps.r_palm, True)
    c.restore()


# ------------------------------------------------------------------------------------------------ the action
def track(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t0 <= t < t1: return lerp(v0, v1, smooth((t - t0) / (t1 - t0)))
    return keys[-1][1]


DUR = 6.0


def pose_at(t):
    ps = Pose()
    ps.breath = 0.5 + 0.5 * math.sin(t * 2 * math.pi / 3.0)
    ps.sway = track([(0, -10), (0.8, -10), (1.3, -16), (3.4, -14), (4.2, 8), (6.0, -10)], t)                # weight shifts onto the other leg afterward
    ps.lean = track([(0, 0.0), (0.8, 0.0), (1.0, 1.5), (1.5, -2.2), (3.3, -2.0), (4.0, 0.6), (6.0, 0.0)], t)
    ps.sh_r = track([(0, 0), (0.85, 0), (1.0, -5), (1.35, 16), (3.3, 14), (3.9, -2), (4.3, 0)], t)           # the shoulder dips (anticipation), then lifts with the arm
    # the arm: shoulder leads, the forearm arrives a little later (overlap), a small overshoot, then the wave from the elbow
    up = track([(0, 7), (0.85, 7), (1.0, 3), (1.42, 122), (1.6, 114), (3.3, 114), (3.55, 60), (3.9, 4), (4.15, 9), (4.4, 7)], t)
    fore = track([(0, 6), (0.9, 6), (1.08, 14), (1.5, 62), (1.68, 74), (3.36, 70), (3.7, 30), (4.02, 1), (4.3, 8), (4.6, 6)], t)
    wv = 0.0
    if 1.62 < t < 3.36:
        k = (t - 1.62); env = smooth(k / 0.25) * (1 - smooth((t - 3.1) / 0.26))
        wv = env * 17 * math.sin(k * 2 * math.pi * 2.25)
        wl = env * 13 * math.sin((k - 0.09) * 2 * math.pi * 2.25)          # the hand trails the forearm
    else:
        wl = 0.0
    ps.r_up, ps.r_fore, ps.r_wrist = up, fore + wv, wl + track([(0, -10), (1.0, -10), (1.3, -24), (1.6, 0), (3.4, 0), (3.7, 22), (4.1, -10)], t)   # hand drags behind on the way up and down
    openk = smooth((t - 1.15) / 0.3) * (1 - smooth((t - 3.45) / 0.3))
    ps.r_hand = H.blend(RELAX, H.FLAT, openk); ps.r_palm = openk > 0.5
    ps.l_up = 7 + 1.5 * math.sin(t * 1.3); ps.l_fore = 8 + 2 * math.sin(t * 1.1 + 1)
    ps.head_tilt = track([(0, 0), (0.9, 0), (1.5, 5.5), (3.3, 5.0), (4.0, -1.5), (4.6, 0)], t) + 0.25 * wv * 0.2
    ps.head_x = track([(0, 0), (1.0, 0), (1.5, 5), (3.3, 5), (4.0, 0)], t)
    ps.smile = track([(0, 0.15), (0.9, 0.15), (1.5, 1.0), (3.6, 1.0), (4.6, 0.4), (6.0, 0.15)], t)
    ps.brow = track([(0, 0), (0.9, 0), (1.25, 1.0), (1.9, 0.5), (3.4, 0.4), (4.0, 0)], t)
    ps.lid = 0.05 if (0.42 < t < 0.52 or 4.52 < t < 4.62) else 1.0
    ps.look = (track([(0, -0.8), (0.55, -0.8), (0.8, 0.0), (6.0, 0.0)], t), 0.0)
    return ps


def background(c, t):
    sh = skia.GradientShader.MakeRadial((540, 900), 1300, [C((52, 66, 136)), C((22, 30, 76))], [0, 1])
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=sh))
    for k in range(0, 1081, 60): c.drawLine(k, 0, k, 1920, SP((130, 150, 230), 1, 18))
    for k in range(0, 1921, 60): c.drawLine(0, k, 1080, k, SP((130, 150, 230), 1, 18))
    sh2 = skia.GradientShader.MakeLinear([skia.Point(0, 1560), skia.Point(0, 1920)], [C((14, 18, 50), 0), C((14, 18, 50), 220)])
    c.drawRect(skia.Rect(0, 1560, 1080, 1920), skia.Paint(Shader=sh2))
    c.drawOval(skia.Rect(240, 1610, 840, 1720), skia.Paint(AntiAlias=True, Color=C((150, 170, 255), 40), MaskFilter=blur(30)))


def frame(t):
    s = skia.Surface(1080, 1920); c = s.getCanvas()
    background(c, t); draw(c, pose_at(t), t=t)
    return s


if __name__ == '__main__':
    import subprocess
    if len(sys.argv) > 1 and sys.argv[1] == 'stills':
        for tt in (0.3, 1.2, 1.45, 1.8, 2.0, 3.6, 4.2):
            frame(tt).makeImageSnapshot().save(f'out/g_{tt:.2f}.png')
    else:
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'out/guy_v1.mp4'], stdin=subprocess.PIPE)
        for rep in range(2):
            for fi in range(int(DUR * 30)): ff.stdin.write(frame(fi / 30).makeImageSnapshot().tobytes())
        ff.stdin.close(); ff.wait()
