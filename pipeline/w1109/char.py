"""The contestant, redesigned (2026-11-09 review: the first figure was blocky and did not read as a person).
back(): the full figure from behind with natural anatomy (sloped shoulders, waist, elbows, real hands, hair with volume).
face(): a close shot of her face for reaction beats (eyes that look, brows, mouth shapes, blink, light from the doors).
House flat layered style: flat fills, one shade band, a rim on the lit side. World coords = screen at zoom 1."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/mh']
import skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, ik2
from art import shaded, diffp, tube, op, glow, SCREEN, TEAL
import hands as H

SW, SW_SH, SW_HI = (238, 132, 124), (188, 88, 104), (255, 190, 170)
SKIN, SKIN_SH, SKIN_HI = (240, 190, 160), (206, 146, 128), (255, 222, 196)
HAIR, HAIR_SH, HAIR_HI = (78, 44, 40), (48, 26, 30), (150, 92, 70)
JEAN, JEAN_SH = (58, 76, 140), (38, 50, 100)
X0, SHY = 378, 1262
U_ARM, F_ARM = 150.0, 128.0


def rest_hand(side):
    return (X0 + side * 148, SHY + 284)


def curve(pts, w, col, a=255):
    p = skia.Path(); p.moveTo(*pts[0])
    if len(pts) == 3: p.quadTo(*pts[1], *pts[2])
    else: p.cubicTo(*pts[1], *pts[2], *pts[3])
    return p, SP(col, w, a)


def stroke(c, pts, w, col, a=255):
    p, pa = curve(pts, w, col, a); c.drawPath(p, pa)


def _hand(c, hp, ang, side, aim=None, skin=SKIN, on_head=None):
    """the shared hand model at the wrist hp. aim: a world point the index finger points at. on_head: a point the fingers rest toward."""
    if aim is not None:
        ang = math.atan2(aim[1] - hp[1], aim[0] - hp[0]); pose = H.POINT
    elif on_head is not None:
        ang = math.atan2(on_head[1] - hp[1], on_head[0] - hp[0]); pose = H.blend(H.FLAT, H.REST, 0.5)
    else:
        pose = H.REST
    hs = side if (-side * math.sin(ang)) * (X0 - hp[0]) > 0 else -side           # thumb on the side toward her body
    H.hand(c, hp, ang, hs, 0.86, skin=skin, shade=SKIN_SH, hi=SKIN_HI, **pose)


def back(c, t, yaw=0.0, pony=0.0, dy=0.0, sway=0.0, hl=None, hr=None, pl=None, pr=None, sq=1.0, rim_boost=0.0, arms_front=False, tilt=0.0):
    br = 3.0 * math.sin(t * 1.7)
    rim = mix(SW_HI, (255, 232, 170), rim_boost)
    c.save(); c.translate(X0 + sway, SHY + 700); c.scale(1.0 / math.sqrt(sq), sq); c.translate(-(X0 + sway), -(SHY + 700)); c.translate(sway, dy)
    W = lambda x, y: (X0 + x, SHY + y)
    # jeans: hips, a seat, two separate legs
    for sx in (-1, 1):
        leg = smooth_closed([W(sx * 4, 372), W(sx * 60, 352), W(sx * 110, 360), W(sx * 120, 440), W(sx * 112, 600), W(sx * 100, 780), W(sx * 26, 780), W(sx * 14, 600), W(sx * 6, 470)])
        shaded(c, leg, JEAN, JEAN_SH, sh=(-12, 0), rimL=(130, 156, 226), rl=(4, 0))
        stroke(c, [W(sx * 20, 470), W(sx * 60, 486), W(sx * 104, 462)], 4, JEAN_SH, 150)                  # the fold under the seat
        pk = smooth_closed([W(sx * 34, 404), W(sx * 92, 400), W(sx * 92, 452), W(sx * 64, 468), W(sx * 36, 454)])
        c.drawPath(pk, P(JEAN_SH, 130)); c.drawPath(pk, SP((120, 140, 210), 2, 110))
    c.drawRect(skia.Rect(X0 - 112, SHY + 352, X0 + 112, SHY + 372), P((70, 50, 44)))                      # belt under the hem
    # neck rising out of the trapezius
    nk = smooth_closed([W(-21, -116 - br), W(21, -116 - br), W(24, -58 - br), W(52, -36 - br), W(-52, -36 - br), W(-24, -58 - br)])
    shaded(c, nk, mix(SKIN, (90, 50, 80), 0.12), SKIN_SH, sh=(-9, 0))
    # sweater: neck slope, round shoulders, ribcage, waist, hips, a loose ribbed hem
    pts = [(-30, -50 - br), (-62, -40 - br), (-96, -24 - br), (-118, 0 - br), (-122, 40), (-108, 96), (-102, 160), (-90, 250), (-98, 320), (-112, 366), (-60, 380), (0, 384), (60, 380),
           (112, 366), (98, 320), (90, 250), (102, 160), (108, 96), (122, 40), (118, 0 - br), (96, -24 - br), (62, -40 - br), (30, -50 - br), (0, -40 - br)]
    torso = smooth_closed([W(x, y) for x, y in pts])
    shaded(c, torso, SW, SW_SH, sh=(-16, -6), rimL=rim, rimR=mix(rim, SW, 0.4), rl=(5, 4), rr=(-4, 4))
    c.save(); c.clipPath(torso, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(X0 - 130, SHY + 340, X0 + 130, SHY + 392), P(SW_SH, 120))
    for k in range(-9, 10): c.drawLine(X0 + k * 13, SHY + 344, X0 + k * 13, SHY + 390, SP(SW_SH, 2.5, 150))
    stroke(c, [W(0, 10), W(5, 150), W(0, 320)], 4, SW_SH, 60)                                            # the spine
    for sx in (-1, 1):
        stroke(c, [W(sx * 26, 40), W(sx * 70, 70), W(sx * 84, 140)], 5, SW_SH, 70)                       # shoulder blade
        stroke(c, [W(sx * 96, 236), W(sx * 60, 258), W(sx * 30, 250)], 4, SW_SH, 80)                     # folds gathering at the waist
        stroke(c, [W(sx * 92, 276), W(sx * 64, 290), W(sx * 44, 286)], 3.5, SW_SH, 60)
        stroke(c, [W(sx * 100, 92), W(sx * 84, 120), W(sx * 86, 150)], 4, SW_SH, 90)                     # under the arm
    c.drawOval(skia.Rect(X0 - 44, SHY - 40, X0 + 44, SHY + 70), P((120, 50, 80), 60, MaskFilter=blur(14)))   # shadow under the ponytail
    c.restore()
    col = smooth_closed([W(-38, -52 - br), W(0, -62 - br), W(38, -52 - br), W(36, -32 - br), W(0, -22 - br), W(-36, -32 - br)])
    c.drawPath(col, P(mix(SW, (255, 255, 255), 0.22))); c.drawPath(diffp(col, (0, -6)), P(SW_SH))

    def draw_arms():
        for side, hand, aim in ((-1, hl, pl), (1, hr, pr)):
            sh_pt = W(side * 106, 14 - br)
            hp = hand if hand is not None else rest_hand(side)
            d = math.hypot(hp[0] - sh_pt[0], hp[1] - sh_pt[1])
            if d > U_ARM + F_ARM - 1:
                k = (U_ARM + F_ARM - 1) / d; hp = (sh_pt[0] + (hp[0] - sh_pt[0]) * k, sh_pt[1] + (hp[1] - sh_pt[1]) * k)
            el = ik2(sh_pt, hp, U_ARM, F_ARM, bend=side)
            ang = math.atan2(hp[1] - el[1], hp[0] - el[0])
            up = tube(sh_pt, el, 62, 46); fo = tube(el, hp, 47, 33)
            cap = skia.Path(); cap.addCircle(sh_pt[0] - side * 2, sh_pt[1] + 6, 30)
            arm = op(op(up, fo), cap)
            c.drawPath(arm, P((110, 40, 70), 70, MaskFilter=blur(8)))
            shaded(c, arm, SW, SW_SH, sh=(-11, -5), rimL=rim, rimR=mix(rim, SW, 0.4), rl=(4, 3), rr=(-3, 3))
            ua = math.atan2(el[1] - sh_pt[1], el[0] - sh_pt[0])                                          # elbow crease
            c.drawLine(el[0] - 16 * math.sin(ua), el[1] + 16 * math.cos(ua), el[0] + 4 * math.sin(ua), el[1] - 4 * math.cos(ua), SP(SW_SH, 3.5, 130))
            cuff = tube((hp[0] - 22 * math.cos(ang), hp[1] - 22 * math.sin(ang)), (hp[0] + 2 * math.cos(ang), hp[1] + 2 * math.sin(ang)), 42, 40)
            c.drawPath(cuff, P(mix(SW, (255, 255, 255), 0.22))); c.drawPath(diffp(cuff, (-5, -3)), P(SW_SH))
            hw = (hp[0] - 4 * math.cos(ang), hp[1] - 4 * math.sin(ang))
            _hand(c, hw, ang, side, aim, skin=mix(SKIN, (90, 50, 80), 0.06), on_head=(X0 + yaw * 6 + sway * 0, SHY - 215) if (arms_front and aim is None and hand is not None) else None)
    if not arms_front: draw_arms()
    # head from behind
    th = math.radians(-yaw * 50.0); R = 66.0                    # the head as a turning ball: features ride around it
    c.save(); c.translate(X0 + yaw * 4, SHY - 168 - br * 1.3); c.rotate(yaw * 2.0 + tilt)
    hair = smooth_closed([(-66, 4), (-70, -40), (-52, -82), (0, -100), (52, -82), (70, -40), (66, 4), (52, 40), (24, 60), (-24, 60), (-52, 40)])
    shaded(c, hair, HAIR, HAIR_SH, sh=(-14, -6), rimL=mix(HAIR_HI, (255, 226, 150), rim_boost), rimR=HAIR_HI, rl=(5, 4), rr=(-4, 4))
    # the side of her face comes into view INSIDE the head's outline on the side she turns to (a crescent, widest at the cheek)
    kk = abs(math.sin(th))
    if kk > 0.04:
        sg = -1.0 if th > 0 else 1.0
        el = skia.Path(); el.addOval(skia.Rect(sg * (R + 38 - 42 * kk) - 42, -44, sg * (R + 38 - 42 * kk) + 42, 80))
        try: cres = skia.Op(hair, el, skia.PathOp.kIntersect_PathOp)
        except RuntimeError: cres = None
        if cres is not None:
            c.drawPath(cres, P(SKIN)); c.drawPath(diffp(cres, (0, -9)), P(SKIN_SH, 150))
            c.drawPath(diffp(cres, (sg * -3.5, 2)), P(SKIN_HI, 220))
    for sx in (-1, 1):                                          # ears ride around the head: the near one turns toward us, the far one goes behind
        ph = math.radians(sx * 90.0) + th; cz = math.cos(ph)
        if cz > -0.12:
            ex = (R + 3) * math.sin(ph) * (1 - 0.08 * max(0.0, cz)); ew = 6 + 7 * max(0.0, cz)
            c.drawOval(skia.Rect(ex - ew, -14, ex + ew, 22), P(SKIN)); c.drawOval(skia.Rect(ex - ew * 0.45, -5, ex + ew * 0.5, 15), P(SKIN_SH, 200))
            if cz > 0.3: stroke(c, [(ex + ew * 0.2, -30), (ex + ew * 0.9, -4), (ex + ew * 0.5, 22)], 4.5, HAIR, 255)      # a sideburn wisp in front of the ear
    c.save(); c.clipPath(hair, skia.ClipOp.kIntersect, True)
    for k, (x, a) in enumerate(((-44, 150), (-26, 120), (26, 110), (46, 90))):                           # strands swept up to the tie
        xo = R * 0.62 * math.sin(th)
        stroke(c, [(x + xo * 0.3, 44), (x * 0.9 + xo * 0.6, -20), (x * 0.25 + xo, -62)], 5, HAIR_HI, a * 0.55)
    c.restore()
    for x in (-18, -4, 12):                                     # wisps at the nape
        stroke(c, [(x + R * 0.4 * math.sin(th), 54), (x + 3 + R * 0.4 * math.sin(th), 68), (x - 2 + R * 0.4 * math.sin(th), 78)], 3.5, HAIR, 255)
    c.save(); c.translate(R * 0.62 * math.sin(th), -58); c.rotate(pony - math.degrees(th) * 0.12)               # ponytail with volume
    pt = smooth_closed([(-22, -8), (22, -8), (34, 50), (30, 120), (12, 170), (-4, 186), (-18, 160), (-30, 110), (-32, 50)])
    c.drawPath(pt, P((30, 14, 24), 90, MaskFilter=blur(7)))
    shaded(c, pt, mix(HAIR, HAIR_HI, 0.18), HAIR_SH, sh=(-10, -4), rimL=HAIR_HI, rl=(4, 3))
    stroke(c, [(-8, 10), (-16, 80), (-6, 160)], 4, HAIR_HI, 120); stroke(c, [(10, 10), (16, 80), (6, 150)], 4, HAIR_SH, 160)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-24, -14, 24, 10), 10, 10), P(TEAL)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-24, -14, 24, -6), 6, 6), P((170, 250, 236)))
    c.restore(); c.restore()
    if arms_front: draw_arms()
    c.restore()


# ------------------------------------------------------------------------------------------------ the close shot
def face(c, t, look=0.0, looky=0.0, brow=0.0, worry=0.0, mouth='closed', smile=0.0, opn=0.0, lid=1.0, tilt=0.0, key=(255, 214, 150), key_side=-1, fill=None, hands=0.0):
    """bust shot, full frame. look -1..1 (her eyes toward screen left / right), brow raise, worry (inner brows up),
    mouth: smile -1..1 and opn 0..1, lid 0 closed..1 open (above 1 = wide), key = colour of the light from the doors,
    key_side -1 light from screen left. hands 0..1 raises both hands to her cheeks."""
    cx, cy = 540, 930
    br = 4 * math.sin(t * 1.7)
    c.save(); c.translate(cx, cy + br); c.rotate(tilt); c.translate(-cx, -cy)
    lit = lambda col, k=0.18: mix(col, key, k)
    # ponytail behind the head
    pt = smooth_closed([(cx + 150, cy - 250), (cx + 250, cy - 220), (cx + 300, cy - 60), (cx + 270, cy + 110), (cx + 200, cy + 150), (cx + 190, cy - 20)])
    c.save(); c.translate(cx + 160, cy - 240); c.rotate(4 * math.sin(t * 1.1) - tilt * 1.5); c.translate(-(cx + 160), -(cy - 240))
    shaded(c, pt, mix(HAIR, HAIR_HI, 0.15), HAIR_SH, sh=(12, -4), rimL=HAIR_HI, rl=(-5, 3)); c.restore()
    # shoulders and sweater
    for sx in (-1, 1):                                          # upper arms, behind the torso
        ua = smooth_closed([(cx + sx * 262, cy + 400), (cx + sx * 322, cy + 420), (cx + sx * 372, cy + 500), (cx + sx * 380, cy + 760), (cx + sx * 372, cy + 1100), (cx + sx * 250, cy + 1100), (cx + sx * 256, cy + 620)])
        shaded(c, ua, mix(SW, SW_SH, 0.25), SW_SH, sh=(18 * -key_side, -6), rimL=lit(SW_HI, 0.5), rl=(7 * -key_side, 5))
    sh = smooth_closed([(cx - 96, cy + 286), (cx - 170, cy + 316), (cx - 262, cy + 356), (cx - 312, cy + 410), (cx - 292, cy + 560), (cx - 262, cy + 760), (cx - 250, cy + 1100),
                        (cx + 250, cy + 1100), (cx + 262, cy + 760), (cx + 292, cy + 560), (cx + 312, cy + 410), (cx + 262, cy + 356), (cx + 170, cy + 316), (cx + 96, cy + 286), (cx, cy + 320)])
    shaded(c, sh, SW, SW_SH, sh=(20 * -key_side, -8), rimL=lit(SW_HI, 0.5), rl=(7 * -key_side, 5))
    c.save(); c.clipPath(sh, skia.ClipOp.kIntersect, True)
    for sx in (-1, 1):
        stroke(c, [(cx + sx * 300, cy + 470), (cx + sx * 250, cy + 560), (cx + sx * 258, cy + 700)], 8, SW_SH, 150)                     # the fold at the armpit
        stroke(c, [(cx + sx * 286, cy + 380), (cx + sx * 250, cy + 400), (cx + sx * 236, cy + 440)], 6, SW_SH, 110)                     # shoulder seam
    stroke(c, [(cx - 236, cy + 640), (cx - 190, cy + 668), (cx - 150, cy + 660)], 6, SW_SH, 80); stroke(c, [(cx + 236, cy + 660), (cx + 196, cy + 684), (cx + 160, cy + 676)], 6, SW_SH, 80)
    c.restore()
    # neck
    nk = smooth_closed([(cx - 78, cy + 150), (cx + 78, cy + 150), (cx + 92, cy + 300), (cx + 130, cy + 350), (cx, cy + 400), (cx - 130, cy + 350), (cx - 92, cy + 300)])
    shaded(c, nk, mix(SKIN, SKIN_SH, 0.35), SKIN_SH, sh=(14 * -key_side, 0))
    c.drawPath(smooth_closed([(cx - 96, cy + 150), (cx + 96, cy + 150), (cx + 70, cy + 250), (cx, cy + 276), (cx - 70, cy + 250)]), P((150, 90, 96), 110, MaskFilter=blur(10)))   # chin shadow
    col = smooth_closed([(cx - 150, cy + 318), (cx - 96, cy + 300), (cx, cy + 372), (cx + 96, cy + 300), (cx + 150, cy + 318), (cx + 120, cy + 372), (cx, cy + 436), (cx - 120, cy + 372)])
    c.drawPath(col, P(mix(SW, (255, 255, 255), 0.22))); c.drawPath(diffp(col, (0, -9)), P(SW_SH))
    # ears
    for sx in (-1, 1):
        e = smooth_closed([(cx + sx * 196, cy - 40), (cx + sx * 232, cy - 60), (cx + sx * 246, cy - 10), (cx + sx * 230, cy + 50), (cx + sx * 198, cy + 40)])
        shaded(c, e, SKIN, SKIN_SH, sh=(6 * -key_side, -4)); c.drawPath(smooth_closed([(cx + sx * 212, cy - 30), (cx + sx * 230, cy - 10), (cx + sx * 220, cy + 26)]), P(SKIN_SH))
    # face
    fc = smooth_closed([(cx - 200, cy - 120), (cx - 206, cy - 10), (cx - 180, cy + 100), (cx - 110, cy + 196), (cx, cy + 236), (cx + 110, cy + 196), (cx + 180, cy + 100),
                        (cx + 206, cy - 10), (cx + 200, cy - 120), (cx + 130, cy - 250), (cx, cy - 280), (cx - 130, cy - 250)])
    c.drawPath(fc, P(SKIN))
    c.save(); c.clipPath(fc, skia.ClipOp.kIntersect, True)
    q = skia.Path(fc); q.offset(46 * key_side, -10)             # one shade band on the side away from the door light
    d = skia.Op(fc, q, skia.PathOp.kDifference_PathOp)
    if d is not None: c.drawPath(d, P(SKIN_SH, 200))
    q2 = skia.Path(fc); q2.offset(-12 * key_side, 4)
    d2 = skia.Op(fc, q2, skia.PathOp.kDifference_PathOp)
    if d2 is not None: c.drawPath(d2, P(lit((255, 236, 214), 0.6), 235))    # rim from the doors
    if fill is not None:
        q3 = skia.Path(fc); q3.offset(12 * key_side, 4)
        d3 = skia.Op(fc, q3, skia.PathOp.kDifference_PathOp)
        if d3 is not None: c.drawPath(d3, P(fill, 200))
    for sx in (-1, 1): c.drawOval(skia.Rect(cx + sx * 128 - 52, cy + 36, cx + sx * 128 + 52, cy + 96), P((246, 140, 140), 80 + 50 * max(0.0, smile), MaskFilter=blur(14)))
    c.restore()
    # eyes
    ey = cy - 20
    for sx in (-1, 1):
        ex = cx + sx * 96
        op_ = max(0.02, min(1.25, lid)); h = 46 * op_
        eye = skia.Path(); eye.addOval(skia.Rect(ex - 50, ey - h, ex + 50, ey + h * 0.92))
        c.drawPath(eye, P((255, 252, 246)))
        c.save(); c.clipPath(eye, skia.ClipOp.kIntersect, True)
        ix = ex + look * 20; iy = ey + looky * 12 + 2
        c.drawCircle(ix, iy, 34, P((104, 62, 44))); c.drawCircle(ix, iy, 34, SP((60, 34, 28), 5)); c.drawCircle(ix, iy, 17, P((34, 20, 20)))
        c.drawCircle(ix - 12 * key_side * -1 - 2, iy - 13, 9, P((255, 255, 255))); c.drawCircle(ix + 10, iy + 12, 4.5, P(lit((255, 255, 255), 0.7), 220))
        c.drawRect(skia.Rect(ex - 60, ey - h - 4, ex + 60, ey - h + 12), P((150, 110, 110), 90))            # lid shadow
        c.restore()
        stroke(c, [(ex - 56, ey - h * 0.55), (ex - 20, ey - h - 12), (ex + 30, ey - h - 10), (ex + 58, ey - h * 0.45)], 9, (52, 30, 30))    # upper lash line
        stroke(c, [(ex + sx * 52, ey - h * 0.5), (ex + sx * 64, ey - h * 0.62), (ex + sx * 74, ey - h * 0.9)], 6, (52, 30, 30))           # outer lash
        stroke(c, [(ex - 44, ey + h * 0.86), (ex, ey + h + 6), (ex + 44, ey + h * 0.86)], 3, SKIN_SH, 200)
        # brow
        by = ey - 84 - 22 * brow
        inn = (ex - sx * 58, by + 10 - 22 * worry); out = (ex + sx * 66, by + 16 + 10 * worry); mid = (ex + sx * 6, by - 16 - 4 * brow)
        stroke(c, [inn, mid, out], 15, HAIR)
    # nose and mouth
    stroke(c, [(cx + 6, cy + 30), (cx + 26, cy + 78), (cx - 2, cy + 86)], 6, SKIN_SH, 230)
    c.drawOval(skia.Rect(cx - 22, cy + 82, cx + 20, cy + 98), P(SKIN_SH, 90))
    my = cy + 150; mw = 56 + 22 * max(0.0, smile) + 6 * opn
    cv = 26 * smile
    if opn > 0.08:
        mh = 14 + 62 * opn
        m = smooth_closed([(cx - mw, my - cv * 0.5), (cx - mw * 0.5, my - 10 - cv * 0.15), (cx + mw * 0.5, my - 10 - cv * 0.15), (cx + mw, my - cv * 0.5),
                           (cx + mw * 0.6, my + mh * 0.75 + cv * 0.4), (cx, my + mh + cv * 0.5), (cx - mw * 0.6, my + mh * 0.75 + cv * 0.4)])
        c.drawPath(m, P((120, 40, 56)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(cx - mw, my - 30, cx + mw, my + 6), P((255, 252, 246)))                    # teeth
        c.drawOval(skia.Rect(cx - mw * 0.6, my + mh * 0.55 + cv * 0.4, cx + mw * 0.6, my + mh * 1.5 + cv * 0.5), P((232, 110, 120)))
        c.restore()
        c.drawPath(m, SP((150, 60, 70), 5))
    else:
        stroke(c, [(cx - mw, my - cv * 0.6), (cx, my + cv * 0.9 + 4), (cx + mw, my - cv * 0.6)], 9, (170, 78, 86))
        stroke(c, [(cx - 22, my + 26 + cv * 0.5), (cx, my + 32 + cv * 0.5), (cx + 22, my + 26 + cv * 0.5)], 4, SKIN_SH, 170)
    # hair in front: a side swept fringe and the hairline
    fr = smooth_closed([(cx - 218, cy + 30), (cx - 246, cy - 130), (cx - 186, cy - 306), (cx, cy - 356), (cx + 186, cy - 306), (cx + 246, cy - 130), (cx + 220, cy + 20),
                        (cx + 196, cy - 110), (cx + 120, cy - 200), (cx - 10, cy - 176), (cx - 120, cy - 150), (cx - 186, cy - 96)])
    shaded(c, fr, HAIR, HAIR_SH, sh=(20 * -key_side, -8), rimL=lit(HAIR_HI, 0.5), rl=(8 * -key_side, 6))
    c.save(); c.clipPath(fr, skia.ClipOp.kIntersect, True)
    for x0, x1 in ((-150, -40), (-60, 60), (40, 150)): stroke(c, [(cx + x0, cy - 170), (cx + (x0 + x1) / 2, cy - 262), (cx + x1 + 40, cy - 300)], 8, HAIR_HI, 110)
    c.restore()
    for sx in (-1, 1):                                          # face framing locks down to the jaw
        lk = smooth_closed([(cx + sx * 190, cy - 130), (cx + sx * 236, cy - 120), (cx + sx * 244, cy + 20), (cx + sx * 226, cy + 130), (cx + sx * 204, cy + 176), (cx + sx * 206, cy + 60), (cx + sx * 196, cy - 30)])
        shaded(c, lk, HAIR, HAIR_SH, sh=(10 * -key_side, -4), rimL=lit(HAIR_HI, 0.5), rl=(5 * -key_side, 4))
    if hands > 0.01:                                            # hands come up to her cheeks
        for sx in (-1, 1):
            hy = lerp(cy + 900, cy + 262, smooth(hands)); hx = cx + sx * 246
            sl = tube((hx + sx * 70, hy + 420), (hx + sx * 8, hy + 96), 150, 120)
            shaded(c, sl, SW, SW_SH, sh=(14 * -key_side, -6), rimL=lit(SW_HI, 0.5), rl=(6 * -key_side, 4))
            H.hand(c, (hx + sx * 6, hy + 150), math.radians(-90 - sx * 10), sx, 3.0, skin=SKIN, shade=SKIN_SH, hi=lit(SKIN_HI, 0.5), light=(-key_side * -0.6 * -1, -0.5), nails=True, **H.FLAT)
    c.restore()


def reverse_bg(c, t, key=(255, 214, 150), key_side=-1, warm=0.0):
    """what is behind her in the close shot: the dark studio, audience shapes, soft out of focus lights"""
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 1920)], [C((22, 14, 54)), C((44, 22, 80)), C((14, 10, 36))], [0, 0.5, 1])
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=sh))
    import numpy as np
    rs = np.random.default_rng(3)
    for i in range(26):                                        # bokeh lights drifting slowly
        x = rs.uniform(-60, 1140); y = rs.uniform(360, 1300); r = rs.uniform(26, 78); ph = rs.uniform(0, 6.28)
        col = [(255, 190, 120), (140, 150, 255), (255, 120, 170), (120, 230, 220)][i % 4]
        a = 34 + 30 * (0.5 + 0.5 * math.sin(t * 0.9 + ph))
        c.drawCircle(x + 14 * math.sin(t * 0.3 + ph), y + 8 * math.cos(t * 0.25 + ph), r, skia.Paint(AntiAlias=True, Color=C(col, a), BlendMode=SCREEN, MaskFilter=blur(5)))
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(9, 9)))
    for i in range(9):
        x = -40 + i * 145 + (30 if i % 2 else 0); y = 1250 + (40 if i % 2 else 0) + 5 * math.sin(t * 0.8 + i)
        c.drawCircle(x, y, 78, P((12, 9, 30))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 120, y + 60, x + 120, y + 900), 70, 70), P((12, 9, 30)))
        c.drawPath(diffp(skia.Path().addCircle(x, y, 78), (8 * key_side, 5)), P(key, 110))
    c.restore()
    glow(c, 540 + key_side * 620, 900, 900, key, 70 + 60 * warm)
