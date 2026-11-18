"""Nadia, the reader (designed new for w1118-01). A graduate student in her late twenties working late in the library:
warm brown skin, an oval face with a soft jaw, black hair with a centre part pulled up into a high bun with two loose strands
at the temples, thin round gold glasses, small gold hoops; a cream ribbed turtleneck under an open mustard cardigan with a
button band. Seen from the front, sitting behind the reading table (the table top hides her below the waist: that is
where the table is, not a cover for a missing pose). The ONE hand model (hands.py) for both hands. Light: the brass lamp at
screen right is the key (warm rim on the right), the moonlit window at screen left is a cool fill.
head(): one head used at every size, so the wide shot and the face close shots are the same person.
bust(): torso and head (drawn before the table). arms(): both arms (after the table, before the books). hands(): after the books."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/guy']
import skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, ik2
from art import shaded, diffp, tube, op
import hands as HD

SKIN, SKIN_SH, SKIN_HI = (178, 116, 84), (132, 80, 66), (232, 170, 128)
HAIR, HAIR_SH, HAIR_HI = (30, 22, 26), (16, 10, 16), (98, 76, 82)
CARD, CARD_SH, CARD_HI = (214, 156, 58), (156, 100, 40), (255, 210, 120)
TURT, TURT_SH, TURT_HI = (238, 226, 206), (190, 172, 160), (255, 246, 228)
LIP = (150, 72, 74)
GOLDF = (226, 186, 100)
KEY = (255, 200, 130)       # lamp
FILL = (120, 150, 230)      # window


class Pose:
    def __init__(self, **k):
        self.look = (0.0, 0.0); self.lid = 1.0; self.brow = 0.0; self.worry = 0.0; self.smile = 0.0; self.opn = 0.0
        self.tilt = 0.0; self.yaw = 0.0; self.lean = (0.0, 0.0); self.breath = 0.0; self.focus = 0.0; self.doubt = 0.0; self.det = 0.0
        for a, b in k.items(): setattr(self, a, b)


def stroke(c, pts, w, col, a=255):
    p = skia.Path(); p.moveTo(*pts[0])
    if len(pts) == 3: p.quadTo(*pts[1], *pts[2])
    elif len(pts) == 4: p.cubicTo(*pts[1], *pts[2], *pts[3])
    else:
        for q in pts[1:]: p.lineTo(*q)
    c.drawPath(p, SP(col, w, a))


def head(c, cx, cy, s, ps, t=0.0, key=1.0):
    """her head, centred on (cx, cy) = middle of the face, s = scale (1.0: face 140 px wide). key: lamp strength 0..1"""
    yaw = max(-1.0, min(1.0, ps.yaw)); fx = yaw * 12
    c.save(); c.translate(cx, cy); c.rotate(ps.tilt); c.scale(s, s)
    kl = lambda col, k=0.25: mix(col, KEY, k * key)
    # the bun on top and the hair mass behind the face
    bun = smooth_closed([(-40 + fx * 0.4, -128), (-30, -170), (6, -190), (42, -176), (52, -138), (30, -112), (-16, -110)])
    back = smooth_closed([(-80, -40), (-84, -100), (-58, -138), (0, -150), (58, -138), (84, -100), (80, -40), (70, 10), (-70, 10)])
    shaded(c, back, HAIR, HAIR_SH, sh=(-8, 0), rimL=kl(HAIR_HI, 0.5), rl=(-3, 1))
    shaded(c, bun, HAIR, HAIR_SH, sh=(-9, 3), rimL=kl(HAIR_HI, 0.5), rl=(-3, 2))
    c.save(); c.clipPath(bun, skia.ClipOp.kIntersect, True)
    for k in range(3): stroke(c, [(-30 + k * 22, -120), (-14 + k * 22, -160), (16 + k * 14, -178)], 2.4, HAIR_HI, 120)
    c.restore()
    c.drawPath(smooth_closed([(-34, -122), (0, -130), (36, -122), (30, -112), (0, -118), (-30, -112)]), P(mix(HAIR, (60, 30, 40), 0.5)))   # hair tie
    # ears with small gold hoops
    for sx in (-1, 1):
        e0 = sx * (64 - 8 * yaw * sx)
        e = smooth_closed([(e0 - sx * 4, -20), (e0 + sx * 10, -30), (e0 + sx * 16, -6), (e0 + sx * 10, 22), (e0 - sx * 4, 18)])
        shaded(c, e, mix(SKIN, SKIN_SH, 0.15), SKIN_SH, sh=(-sx * 4, 0))
        c.drawCircle(e0 + sx * 6, 30, 7, SP(GOLDF, 2.6)); c.drawCircle(e0 + sx * 3, 25, 2.2, P((255, 236, 170)))
    # neck (the turtleneck covers most of it)
    nk = poly([(-34, 40), (34, 40), (38, 110), (-38, 110)]); shaded(c, nk, mix(SKIN, SKIN_SH, 0.3), SKIN_SH, sh=(8, 0))
    c.drawOval(skia.Rect(-46, 40, 46, 92), P((70, 30, 40), 120, MaskFilter=blur(8)))
    # face: oval, soft jaw, a slightly pointed chin
    face = smooth_closed([(-60, -62), (-64, -20), (-60, 18), (-50 + fx * 0.3, 48), (-30 + fx * 0.6, 72), (-10 + fx * 0.8, 84), (10 + fx * 0.8, 84), (30 + fx * 0.6, 72),
                          (50 + fx * 0.3, 48), (60, 18), (64, -20), (60, -62), (40, -92), (0, -100), (-40, -92)])
    c.drawPath(face, P(SKIN))
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
    # one shaped form shadow on the side away from the lamp (screen left), a cool fill inside it
    c.drawPath(smooth_closed([(-80, -100), (-46 + fx, -80), (-40 + fx, -40), (-46 + fx, -4), (-38 + fx, 30), (-20 + fx, 62), (-4 + fx, 82), (fx, 100), (-80, 100)]), P(SKIN_SH, 160))
    c.drawPath(diffp(face, (7, 2)), P(mix(SKIN_SH, FILL, 0.25), 140))
    c.drawPath(diffp(face, (-5, 3)), P(kl(SKIN_HI, 0.45), 235))                                   # warm rim from the lamp
    c.drawRect(skia.Rect(-70, -100, 70, -66), P((70, 30, 40), 70, MaskFilter=blur(8)))          # hair shadow on the forehead
    for sx in (-1, 1): c.drawOval(skia.Rect(fx + sx * 36 - 17, 18 - 4 * ps.smile, fx + sx * 36 + 17, 38 - 4 * ps.smile), P((214, 104, 96), 40 + 60 * ps.smile, MaskFilter=blur(7)))
    c.drawPath(smooth_closed([(-34 + fx, 72), (fx, 80), (34 + fx, 72), (24 + fx, 90), (fx, 96), (-24 + fx, 90)]), P(SKIN_SH, 55))
    c.restore()
    # hair in front: centre part, swept back over the ears to the bun, two loose strands
    for sx in (-1, 1):
        side = smooth_closed([(sx * 2, -101), (sx * 30, -98), (sx * 58, -78), (sx * 70, -40), (sx * 70, -6), (sx * 62, -20), (sx * 54, -56), (sx * 30, -80), (sx * 4, -88)])
        shaded(c, side, HAIR, HAIR_SH, sh=(-6, 2) if sx < 0 else (-3, 2), rimL=kl(HAIR_HI, 0.5) if sx > 0 else None, rl=(-3, 1))
        c.save(); c.clipPath(side, skia.ClipOp.kIntersect, True)
        for k in range(3): stroke(c, [(sx * (6 + k * 6), -94), (sx * (34 + k * 8), -84), (sx * (58 + k * 3), -40)], 2, HAIR_HI, 110)
        c.restore()
        sw = 2.2 * math.sin(t * 1.3 + sx)                                  # the loose strand moves a little with her breathing
        stroke(c, [(sx * 46, -70), (sx * (60 + sw), -30), (sx * (56 + sw), 10), (sx * (62 + sw), 44)], 3.4, HAIR)
    # eyes
    ey = -10
    for sx in (-1, 1):
        w_ = 1 - 0.22 * max(0.0, sx * yaw); ex = fx * 1.05 + sx * 27
        op_ = max(0.04, min(1.3, ps.lid)) * (1 - 0.25 * ps.smile); h = 11.5 * op_
        eye = smooth_closed([(ex - 17 * w_, ey + 2), (ex - 7 * w_, ey - h), (ex + 8 * w_, ey - h * 1.04), (ex + 17 * w_, ey - 1), (ex + 7 * w_, ey + h * 0.74), (ex - 7 * w_, ey + h * 0.8)])
        c.drawPath(eye, P((252, 248, 242)))
        c.save(); c.clipPath(eye, skia.ClipOp.kIntersect, True)
        ix, iy = ex + ps.look[0] * 6 * w_, ey + ps.look[1] * 4 + 0.5
        c.drawCircle(ix, iy, 9.0, P((70, 42, 30))); c.drawCircle(ix, iy + 2, 6.0, P((110, 70, 44), 150)); c.drawCircle(ix, iy, 4.6, P((18, 10, 12)))
        c.drawCircle(ix + 3, iy - 3.2, 2.6, P((255, 255, 255))); c.drawCircle(ix - 3, iy + 3, 1.1, P((255, 255, 255), 170))
        c.drawRect(skia.Rect(ex - 20, ey - h - 2, ex + 20, ey - h + 3), P((100, 60, 60), 100))
        c.restore()
        lash = skia.Path(); lash.moveTo(ex - 18 * w_, ey + 2.5); lash.quadTo(ex - 6 * w_, ey - h - 6, ex + 8 * w_, ey - h * 1.04 - 2.4); lash.quadTo(ex + 16 * w_, ey - h * 0.6, ex + sx * 0 + 21 * w_, ey - 4)
        if sx < 0:
            lash = skia.Path(); lash.moveTo(ex + 18 * w_, ey + 2.5); lash.quadTo(ex + 6 * w_, ey - h - 6, ex - 8 * w_, ey - h * 1.04 - 2.4); lash.quadTo(ex - 16 * w_, ey - h * 0.6, ex - 21 * w_, ey - 4)
        c.drawPath(lash, SP((26, 14, 16), 4.4))
        stroke(c, [(ex - 14 * w_, ey - h - 8), (ex, ey - h - 11), (ex + 14 * w_, ey - h - 7)], 1.8, SKIN_SH, 170 * min(1.0, ps.lid))
        stroke(c, [(ex - 10 * w_, ey + h * 0.8 + 2.5), (ex + 1, ey + h * 0.8 + 4), (ex + 11 * w_, ey + h * 0.76 + 2)], 1.6, SKIN_SH, 110 + 90 * ps.smile)
        # doubt: one brow up (screen left), the other down; det: both brows low and drawn together
        by = ey - 26 - 6 * ps.brow - (9 * ps.doubt if sx < 0 else -3 * ps.doubt) + 3 * ps.det; wy = ps.worry; fo = ps.focus + 0.9 * ps.det
        inn = (ex - sx * 15 * w_ + sx * 2 * fo, by + 7 - 9 * wy + 4 * fo); mid = (ex + sx * 4 * w_, by - 3 - 2 * ps.brow - 2 * wy); out = (ex + sx * 22 * w_, by + 3 + 4 * wy)
        br_ = smooth_closed([inn, (inn[0], inn[1] - 6), (mid[0], mid[1] - 4), out, (mid[0], mid[1] + 2)])
        c.drawPath(br_, P(HAIR))
    # glasses: thin round gold frames, a bridge, and a glint of lamp light on each lens
    for sx in (-1, 1):
        ex = fx * 1.05 + sx * 27; r = 23 * (1 - 0.12 * max(0.0, sx * yaw))
        c.drawCircle(ex, ey - 1, r, P((255, 240, 220), 22)); c.drawCircle(ex, ey - 1, r, SP(GOLDF, 2.6))
        c.drawArc(skia.Rect(ex - r + 5, ey - 1 - r + 5, ex + r - 5, ey - 1 + r - 5), -60, 40, False, SP((255, 250, 235), 2.6, 120 * key))
        stroke(c, [(ex + sx * r, ey - 6), (sx * 64, -14)], 2.2, GOLDF, 220)
    stroke(c, [(fx * 1.05 - 5, ey - 6), (fx * 1.05, ey - 10), (fx * 1.05 + 5, ey - 6)], 2.4, GOLDF)
    # nose
    nx = fx * 1.2 + yaw * 4
    stroke(c, [(nx - 5, -2), (nx - 7, 16), (nx - 9, 26)], 2.6, SKIN_SH, 170)
    c.drawPath(smooth_closed([(nx - 11, 30), (nx - 4, 35), (nx + 5, 35), (nx + 12, 29), (nx + 8, 39), (nx, 41), (nx - 8, 39)]), P(SKIN_SH, 170))
    c.drawCircle(nx + 2, 26, 4.5, P(SKIN_HI, 120, MaskFilter=blur(2)))
    # mouth
    mx = fx * 1.1 + 5 * ps.doubt; my = 56; mw = (17 + 7 * ps.smile) * (1 - 0.18 * ps.det); cv = 2 + 9 * ps.smile; sk = 5 * ps.doubt   # sk: the mouth pulled up on one side
    if ps.opn > 0.08:
        mh = 6 + 22 * ps.opn
        m = smooth_closed([(mx - mw, my - cv * 0.5), (mx - mw * 0.4, my - 4), (mx + mw * 0.4, my - 4), (mx + mw, my - cv * 0.5), (mx + mw * 0.55, my + mh * 0.7 + cv * 0.3), (mx, my + mh + cv * 0.4), (mx - mw * 0.55, my + mh * 0.7 + cv * 0.3)])
        c.drawPath(m, P((100, 34, 44)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(mx - mw, my - 10, mx + mw, my + 2 + 2 * ps.smile), P((252, 248, 240)))
        c.drawOval(skia.Rect(mx - mw * 0.5, my + mh * 0.6, mx + mw * 0.5, my + mh * 1.4), P((206, 100, 110)))
        c.restore(); c.drawPath(m, SP(LIP, 3.2))
    else:
        th = 1 - 0.45 * ps.det                                                    # pressed lips are thinner
        up = smooth_closed([(mx - mw, my - cv * 0.5 + sk), (mx - 7, my - 6 * th), (mx, my - 4 * th), (mx + 7, my - 6 * th), (mx + mw, my - cv * 0.5 - sk), (mx, my + cv * 0.35)])
        c.drawPath(up, P(mix(LIP, SKIN_SH, 0.3)))
        lo = smooth_closed([(mx - mw * 0.9, my - cv * 0.45 + sk), (mx, my + cv * 0.35), (mx + mw * 0.9, my - cv * 0.45 - sk), (mx + mw * 0.6, my + 7 * th + cv * 0.3), (mx, my + 10 * th + cv * 0.35), (mx - mw * 0.6, my + 7 * th + cv * 0.3)])
        c.drawPath(lo, P(LIP)); c.drawOval(skia.Rect(mx - 6, my + 2 + cv * 0.4, mx + 6, my + 6 + cv * 0.4), P(kl(SKIN_HI, 0.4), 130))
        stroke(c, [(mx - mw, my - cv * 0.5 + sk), (mx, my + cv * 0.35), (mx + mw, my - cv * 0.5 - sk)], 2.2, (96, 40, 46), 220)
        if ps.doubt > 0.1: stroke(c, [(mx + mw + 2, my - sk - 4), (mx + mw + 6, my - sk + 1), (mx + mw + 3, my - sk + 6)], 2, SKIN_SH, 200 * ps.doubt)   # dimple on the pulled side
        if ps.det > 0.1: stroke(c, [(mx - 10, my + 16), (mx, my + 19), (mx + 10, my + 16)], 2.4, SKIN_SH, 200 * ps.det)                     # firm chin
        if ps.smile > 0.3:
            for sx in (-1, 1): stroke(c, [(mx + sx * (mw + 2), my - cv * 0.7 - 4), (mx + sx * (mw + 5), my - cv * 0.2), (mx + sx * (mw + 2), my + 4)], 2, SKIN_SH, 200 * ps.smile)
    c.restore()


def shoulders(cx, sy, lean):
    return (cx - 150 + lean[0] * 0.8, sy + 10 + lean[1]), (cx + 150 + lean[0], sy + 10 + lean[1] * 1.3)


BODY = [None]


def bust(c, cx, sy, ps, t, yb=1140, key=1.0):
    """torso and head. cx: body centre, sy: shoulder line y, yb: where the table top hides her"""
    lx, ly = ps.lean; br = 3 * ps.breath
    shR, shL = shoulders(cx, sy, ps.lean)
    nk = (cx + lx * 0.9, sy - 70 + ly - br)
    kl = lambda col, k=0.25: mix(col, KEY, k * key)
    # cardigan: one silhouette from the neck over the shoulders down the sides to below the table edge
    body = smooth_closed([(nk[0] - 52, nk[1] + 10), (shR[0] + 50, shR[1] - 34), (shR[0] - 4, shR[1] + 10), (shR[0] - 14, shR[1] + 90), (cx - 128 + lx * 0.3, yb - 120),
                          (cx - 124, yb + 60), (cx + 124, yb + 60), (cx + 128 + lx * 0.3, yb - 120), (shL[0] + 14, shL[1] + 90), (shL[0] + 4, shL[1] + 10), (shL[0] - 50, shL[1] - 34), (nk[0] + 52, nk[1] + 10)])
    # her left arm (screen right) hangs at her side, forearm down toward her lap under the table: ONE silhouette with the body
    ela = (shL[0] + 26, shL[1] + 190); hla = (shL[0] - 10, yb + 80)
    body = op(op(body, tube((shL[0] - 16, shL[1] + 6), ela, 92, 74)), tube(ela, hla, 74, 66))
    BODY[0] = body
    shaded(c, body, CARD, CARD_SH, sh=(16, -2), rimL=kl(CARD_HI, 0.4), rl=(-5, 2))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawPath(smooth_closed([(cx - 150, sy), (cx - 70, sy + 30), (cx - 80, yb + 60), (cx - 160, yb + 60)]), P(CARD_SH, 90, MaskFilter=blur(16)))
    # knit texture: soft vertical ribs
    for j in range(-9, 10):
        x0 = cx + j * 15 + lx * 0.5; stroke(c, [(x0, sy - 10), (x0 + 2, (sy + yb) / 2), (x0, yb + 60)], 2, CARD_SH, 60)
    # the turtleneck shows down the open front
    vt = poly([(nk[0] - 40, nk[1] + 20), (nk[0] + 40, nk[1] + 20), (cx + 52 + lx * 0.4, yb + 60), (cx - 52 + lx * 0.4, yb + 60)])
    shaded(c, vt, TURT, TURT_SH, sh=(10, 0))
    for j in range(-3, 4):
        stroke(c, [(nk[0] + j * 10, nk[1] + 40), (cx + j * 13 + lx * 0.4, yb + 60)], 2, TURT_SH, 120)
    # button bands on both front edges, with buttons
    for sx in (-1, 1):
        a = (nk[0] + sx * 42, nk[1] + 24); b = (cx + sx * 54 + lx * 0.4, yb + 60)
        c.drawLine(a[0], a[1], b[0], b[1], SP(mix(CARD, CARD_SH, 0.3), 16)); c.drawLine(a[0] + sx * 7, a[1], b[0] + sx * 7, b[1], SP(CARD_SH, 2.4, 200))
        if sx < 0:
            for k in range(1, 4):
                u = k / 4.0; q = (lerp(a[0], b[0], u), lerp(a[1], b[1], u)); c.drawCircle(q[0], q[1], 6.5, P((120, 74, 40))); c.drawCircle(q[0] - 1.5, q[1] - 1.5, 2.5, P((200, 150, 90)))
    # folds: armpits and where the arms lift the cloth
    for sx, sh_ in ((-1, shR), (1, shL)):
        stroke(c, [(sh_[0] - sx * 18, sh_[1] + 40), (sh_[0] - sx * 34, sh_[1] + 100), (sh_[0] - sx * 30, sh_[1] + 170)], 4, CARD_SH, 110)
    stroke(c, [(ela[0] - 34, ela[1] - 6), (ela[0] - 4, ela[1] + 8), (ela[0] + 30, ela[1] - 4)], 3.4, CARD_SH, 150)          # left elbow crease
    stroke(c, [(shL[0] - 30, shL[1] + 60), (shL[0] - 26, shL[1] + 140), (ela[0] - 36, ela[1] + 40)], 3.4, CARD_SH, 120)      # where the arm meets the side
    c.drawRect(skia.Rect(cx - 200, yb - 30, cx + 260, yb + 60), P((40, 20, 30), 90, MaskFilter=blur(14)))    # the table's shadow on her
    c.restore()
    # the rolled turtleneck collar, then the head
    col = smooth_closed([(nk[0] - 48, nk[1] + 20), (nk[0] - 44, nk[1] - 22), (nk[0], nk[1] - 30), (nk[0] + 44, nk[1] - 22), (nk[0] + 48, nk[1] + 20), (nk[0], nk[1] + 30)])
    head(c, nk[0] + 2, nk[1] - 112, 0.92, ps, t, key)
    shaded(c, col, TURT, TURT_SH, sh=(10, 0), rimL=kl(TURT_HI, 0.4), rl=(-4, 2))
    c.save(); c.clipPath(col, skia.ClipOp.kIntersect, True)
    for j in range(-6, 7): stroke(c, [(nk[0] + j * 8, nk[1] - 26), (nk[0] + j * 8.6, nk[1] + 26)], 1.8, TURT_SH, 120)
    c.restore()
    return shR, shL


def shoulder_cap(c, sh, key=1.0):
    """the body's own shoulder drawn again over the top of a raised sleeve, so the arm comes out of the shoulder, not on top of it"""
    if BODY[0] is None: return
    kl = lambda col, k=0.25: mix(col, KEY, k * key)
    cap = skia.Path(); cap.addOval(skia.Rect(sh[0] - 70, sh[1] - 90, sh[0] + 90, sh[1] + 34))
    c.save(); c.clipPath(cap, skia.ClipOp.kIntersect, True)
    c.saveLayer(None, skia.Paint(MaskFilter=None))
    shaded(c, BODY[0], CARD, CARD_SH, sh=(16, -2), rimL=kl(CARD_HI, 0.4), rl=(-5, 2))
    c.restore(); c.restore()


def sleeve(c, sh, el, wr, key=1.0, near=0.0):
    """one arm in its knit sleeve: upper arm and forearm as ONE shape, shaded once; the cuff end gathers softly"""
    kl = lambda col, k=0.25: mix(col, KEY, k * key)
    up = tube(sh, el, 76, 64); fo = tube(el, wr, 64 + 8 * near, 52 + 10 * near)
    s = op(up, fo)
    c.drawPath(s, P((20, 10, 24), 60, MaskFilter=blur(10)))
    shaded(c, s, CARD, CARD_SH, sh=(12, -3), rimL=kl(CARD_HI, 0.45), rl=(-4, 2))
    c.save(); c.clipPath(s, skia.ClipOp.kIntersect, True)
    d = (wr[0] - el[0], wr[1] - el[1]); n = math.hypot(*d) or 1; d = (d[0] / n, d[1] / n); nn = (-d[1], d[0])
    for k in (0, 1):                                                       # the elbow crease
        o = 6 + 12 * k; stroke(c, [(el[0] + nn[0] * 24 + d[0] * o, el[1] + nn[1] * 24 + d[1] * o), (el[0] + d[0] * (o + 8), el[1] + d[1] * (o + 8)), (el[0] - nn[0] * 24 + d[0] * o, el[1] - nn[1] * 24 + d[1] * o)], 3, CARD_SH, 150 - 60 * k)
    for k in range(4):                                                     # the ribbed cuff, part of the sleeve
        o = 6 + k * 7; p0 = (wr[0] - d[0] * o, wr[1] - d[1] * o)
        stroke(c, [(p0[0] + nn[0] * 30, p0[1] + nn[1] * 30), (p0[0] - d[0] * 3, p0[1] - d[1] * 3), (p0[0] - nn[0] * 30, p0[1] - nn[1] * 30)], 2.2, CARD_SH, 150)
    c.restore()


def arm(c, sh, wrist, l1=205.0, l2=180.0, bend=1, key=1.0, near=0.0):
    el = ik2(sh, wrist, l1, l2, bend)
    sleeve(c, sh, el, wrist, key, near)
    return el


HAND_S = 1.62
PUSH = dict(curls=(0.22, 0.34, 0.36, 0.4, 0.46), spread=0.12)
REST = dict(curls=(0.2, 0.18, 0.22, 0.26, 0.32), spread=0.22)


def wrist_for(tip, ang, s=HAND_S, reach=96.0):
    return (tip[0] - math.cos(ang) * reach * s, tip[1] - math.sin(ang) * reach * s)


def hand(c, wrist, ang, side, pose, key=1.0, s=HAND_S, narrow=0.78):
    HD.hand(c, wrist, ang, side, s, skin=SKIN, shade=SKIN_SH, hi=mix(SKIN_HI, KEY, 0.3 * key), light=(0.6, -0.6), narrow=narrow, nails=True, **pose)
