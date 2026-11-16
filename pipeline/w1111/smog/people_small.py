"""The three who wait at the bus stop in the five days shot (round 3: the camera now pushes in until they fill about half the frame, so they carry
more drawing and each does one readable thing). Not built on the full people model: purpose drawn front view figures with the one hand model for
their hands, flat fill, one shade band, one rim on the lamp side. Each action is driven from outside (0..1 controls), so the shot can time them."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/smog']
sys.path += ['/home/claude/short', '/home/claude/guy']
import skia
import person as PN, hands as H
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import diffp

RIMC = (206, 180, 104)
LIGHT = (0.8, 0.3)           # hand model light vector that puts its rim on the right (lamp) side


def _sh(c, path, col, rim=True, shade=True):
    c.drawPath(path, P(col))
    if shade: c.drawPath(diffp(path, (4.2, -0.6)), P(mix(col, (8, 8, 14), 0.5)))        # shade band on the side away from the lamp
    if rim: c.drawPath(diffp(path, (-1.8, 0.6)), P(RIMC, 170))                        # the street lamp is to their right


def _tube(c, a, b, w0, w1, col, rim=True):
    p = PN.limb(a, b, w0, w1); _sh(c, p, col, rim); return p


def _hand(c, wrist, ang, side, skin, s=0.17, pose=None):
    H.hand(c, wrist, ang, side, s, skin=skin, shade=mix(skin, (60, 30, 40), 0.45), hi=mix(skin, (255, 230, 190), 0.5), light=LIGHT, shadow=False, **(pose or H.REST))


def _eyes(c, x, y, dx, look=0.0, shut=0.0, brow=(40, 30, 28), wr=0.0):
    for sx in (-1, 1):
        ex = x + sx * dx
        if shut > 0.5: c.drawLine(ex - 2.6, y + 0.4, ex + 2.6, y + 0.8, SP((30, 20, 20), 1.3))
        else:
            c.drawOval(skia.Rect(ex - 2.7, y - 1.7, ex + 2.7, y + 1.7), P((236, 228, 210))); c.drawCircle(ex + look * 1.3, y, 1.5, P((30, 20, 20)))
            c.drawLine(ex - 2.9, y - 1.8, ex + 2.9, y - 1.9, SP((30, 20, 20), 0.9))
        c.drawLine(ex - 3.2, y - 4.2 - sx * wr * 0, ex + 3.2, y - 4.6 + (1.2 * shut if sx < 0 else 1.2 * shut), SP(brow, 1.4))


def waiting_man_tall(c, x, y, t, up=0.0, cough=0.0):
    """a tall man in a trilby and a long overcoat. up 0..1 brings the handkerchief from his chest to his mouth; cough is the jerk of his shoulders and head"""
    br = 0.8 * math.sin(t * 2.0); dip = 6.0 * cough; hun = 4.0 * cough + br * 0.5; fw = 2.5 * cough
    c.save(); c.translate(x, y)
    c.drawOval(skia.Rect(-36, -5, 36, 7), P((8, 8, 8), 160, MaskFilter=blur(4)))
    coat_c, tr_c, skin = (52, 48, 44), (28, 28, 30), (176, 132, 100)
    for sx in (-1, 1):
        _tube(c, (sx * 11, -44), (sx * 12, -9), 15, 12, tr_c, rim=sx > 0)
        sh_ = smooth_closed([(sx * 12 - 9, -9), (sx * 12 + 9, -9), (sx * 12 + 12 + (3 if sx > 0 else 0), -2), (sx * 12 + 10, 2), (sx * 12 - 11, 2), (sx * 12 - 12, -3)]); _sh(c, sh_, (18, 17, 18), rim=sx > 0); c.drawLine(sx * 12 - 6, -6, sx * 12 + 6, -6, SP((90, 84, 80), 1, 160))
    la = (27, -132 - hun); _tube(c, la, (31, -74), 15, 12, coat_c); _hand(c, (31, -72), math.radians(88), -1, skin)                  # his left arm hangs
    coat = smooth_closed([(-22, -142 - hun), (22, -142 - hun), (30, -128 - hun), (30, -96), (33, -40), (28, -33), (0, -31), (-28, -33), (-33, -40), (-30, -96), (-30, -128 - hun)])
    _sh(c, coat, coat_c)
    c.save(); c.clipPath(coat, skia.ClipOp.kIntersect, True)
    c.drawLine(4, -128, 6, -32, SP((24, 22, 22), 1.8)); c.drawLine(-31, -86, 31, -86, SP((24, 22, 22), 4)); c.drawRect(skia.Rect(-4, -90, 5, -82), P((120, 108, 80)))            # front edge, belt, buckle
    for v in (-116, -102, -70, -56): c.drawCircle(-3, v, 2.1, P((22, 20, 20))); c.drawCircle(-3.5, v - 0.5, 0.8, P((120, 110, 100)))
    for (x0, x1) in ((-18, -22), (16, 21)): c.drawLine(x0, -78, x1, -36, SP((30, 28, 28), 1.4, 200))                                  # folds below the belt
    c.drawLine(-22, -64, -10, -62, SP((24, 22, 22), 1.6)); c.drawLine(12, -62, 24, -64, SP((24, 22, 22), 1.6))                          # pocket flaps
    c.restore()
    for sx in (-1, 1): c.drawPath(poly([(sx * 3, -143 - hun), (sx * 17, -147 - hun), (sx * 14, -116), (sx * 2, -126)]), P((36, 33, 31))); c.drawLine(sx * 17, -147 - hun, sx * 14, -116, SP((20, 19, 19), 1))   # collar turned up
    c.drawPath(poly([(-3, -143 - hun), (3, -143 - hun), (2, -126), (-2, -126)]), P((120, 60, 50)))                                    # a scrap of scarf at the throat
    hx_, hy_ = fw, -160 + dip + br * 0.3
    c.drawRect(skia.Rect(hx_ - 5, hy_ + 8, hx_ + 5, hy_ + 20), P(mix(skin, (60, 30, 40), 0.4)))
    for sx in (-1, 1): c.drawOval(skia.Rect(hx_ + sx * 12 - 2.4, hy_ - 4, hx_ + sx * 12 + 2.4, hy_ + 4), P(mix(skin, (60, 30, 40), 0.2)))  # ears
    head = smooth_closed([(hx_ - 11.5, hy_ - 12), (hx_ + 11.5, hy_ - 12), (hx_ + 12, hy_ + 2), (hx_ + 7, hy_ + 13), (hx_, hy_ + 15.5), (hx_ - 7, hy_ + 13), (hx_ - 12, hy_ + 2)]); _sh(c, head, skin)
    c.drawPath(smooth_closed([(hx_ - 12, hy_ - 12), (hx_ + 12, hy_ - 12), (hx_ + 12, hy_ - 5), (hx_, hy_ - 3.5), (hx_ - 12, hy_ - 5)]), P((60, 40, 40), 130))    # brim shadow
    _eyes(c, hx_, hy_ - 1, 4.8, shut=cough * 1.6)
    c.drawLine(hx_ + 0.6, hy_ + 0.5, hx_ + 1.4, hy_ + 5, SP(mix(skin, (60, 30, 40), 0.5), 1.2)); c.drawPath(smooth_closed([(hx_ - 5, hy_ + 7), (hx_, hy_ + 6), (hx_ + 5, hy_ + 7), (hx_, hy_ + 8.6)]), P((92, 84, 80)))   # nose, grey moustache
    c.drawLine(hx_ - 2.6, hy_ + 10.6, hx_ + 2.6, hy_ + 10.6 + cough, SP((96, 50, 50), 1.2))
    hat_c = (40, 38, 36); brim = skia.Path(); brim.addOval(skia.Rect(hx_ - 21, hy_ - 16, hx_ + 21, hy_ - 7)); _sh(c, brim, hat_c, shade=False)
    _sh(c, smooth_closed([(hx_ - 13, hy_ - 12), (hx_ - 12, hy_ - 27), (hx_ - 4, hy_ - 30), (hx_, hy_ - 27.5), (hx_ + 4, hy_ - 30), (hx_ + 12, hy_ - 27), (hx_ + 13, hy_ - 12)]), hat_c)
    c.drawRect(skia.Rect(hx_ - 13, hy_ - 17, hx_ + 13, hy_ - 13), P((20, 19, 18)))
    # his right arm: the handkerchief rests at his chest, then comes up to his mouth
    hd = (lerp(-12, hx_ - 2, up), lerp(-104, hy_ + 9, up)); el = (lerp(-34, -37, up), lerp(-98, -102 - hun, up))
    _tube(c, (-27, -132 - hun), el, 15, 13, coat_c, rim=False); _tube(c, el, (hd[0] - 5, hd[1] + 7), 13, 11, coat_c, rim=False)
    _hand(c, (hd[0] - 6, hd[1] + 9), math.radians(-52), 1, skin, pose=H.GRIP)
    hk = smooth_closed([(hd[0] - 9, hd[1] - 5), (hd[0] + 3, hd[1] - 8), (hd[0] + 12, hd[1] - 2), (hd[0] + 10, hd[1] + 7), (hd[0] + 3, hd[1] + 13 + 2 * cough), (hd[0] - 6, hd[1] + 6)])
    c.drawPath(hk, P((230, 222, 198))); c.drawPath(diffp(hk, (3, -1)), P((176, 166, 140))); c.drawLine(hd[0] - 4, hd[1] + 1, hd[0] + 8, hd[1] + 4, SP((150, 142, 120), 1.1))
    c.restore()


def waiting_woman(c, x, y, t, pull=0.0, hand=0.0, yaw=0.0):
    """a short woman in a headscarf and a belted coat with a handbag. hand 0..1 lifts her hand to her face; pull 0..1 draws her knitted scarf up from her chin over her mouth and nose; yaw turns her head (- = screen left)"""
    br = 0.7 * math.sin(t * 2.3 + 1); fx = 5.0 * yaw
    c.save(); c.translate(x, y)
    c.drawOval(skia.Rect(-34, -5, 34, 7), P((8, 8, 8), 160, MaskFilter=blur(4)))
    coat_c, skin, stock = (98, 50, 50), (186, 140, 110), (124, 98, 78)
    for sx in (-1, 1):
        _tube(c, (sx * 9, -40), (sx * 9, -8), 10, 7, stock, rim=sx > 0)
        sh_ = smooth_closed([(sx * 9 - 6, -8), (sx * 9 + 6, -8), (sx * 9 + 9, -1), (sx * 9 + 7, 2), (sx * 9 - 7, 2), (sx * 9 - 8, -2)]); _sh(c, sh_, (22, 18, 18), rim=sx > 0)
    coat = smooth_closed([(-18, -120 + br * 0.4), (18, -120 + br * 0.4), (25, -108), (24, -84), (36, -38), (0, -33), (-36, -38), (-24, -84), (-25, -108)]); _sh(c, coat, coat_c)
    c.save(); c.clipPath(coat, skia.ClipOp.kIntersect, True)
    c.drawLine(-26, -84, 26, -84, SP((46, 22, 24), 4)); c.drawRect(skia.Rect(-4, -88, 5, -80), P((170, 148, 90))); c.drawLine(1, -118, 2, -34, SP((52, 26, 28), 1.6))
    for v in (-110, -99, -70, -56): c.drawCircle(-5, v, 2.2, P((46, 22, 24))); c.drawCircle(-5.6, v - 0.6, 0.8, P((190, 120, 110)))
    for (x0, x1) in ((-14, -24), (-4, -6), (12, 22)): c.drawLine(x0, -80, x1, -36, SP((60, 28, 30), 1.4, 200))                         # the skirt of the coat flares in folds
    c.restore()
    for sx in (-1, 1): c.drawPath(poly([(sx * 2, -121), (sx * 15, -123), (sx * 11, -106), (sx * 2, -111)]), P(mix(coat_c, (20, 10, 14), 0.35)))  # collar
    el = (30, -84); _tube(c, (23, -112), el, 13, 11, coat_c); _tube(c, el, (12, -74), 11, 9, coat_c); _hand(c, (11, -74), math.radians(170), -1, skin, s=0.15)    # the arm that carries the bag, folded across
    c.drawLine(26, -86, 27, -66, SP((36, 26, 22), 2.2)); bag = skia.Path(); bag.addRRect(skia.RRect.MakeRectXY(skia.Rect(15, -68, 40, -46), 4, 4)); _sh(c, bag, (60, 42, 32)); c.drawRect(skia.Rect(15, -68, 40, -62), P((44, 30, 24))); c.drawRect(skia.Rect(25, -66, 30, -60), P((190, 166, 100)))
    hy_ = -134 + br * 0.3
    hs_c = (104, 118, 140); hs = smooth_closed([(-15 - fx * 0.4, hy_ + 6), (-16, hy_ - 8), (-9, hy_ - 19), (0, hy_ - 22), (9, hy_ - 19), (16, hy_ - 8), (15 - fx * 0.4, hy_ + 6), (8, hy_ + 16), (0, hy_ + 18), (-8, hy_ + 16)]); _sh(c, hs, hs_c)
    for (px, py) in ((-11, hy_ - 12), (10, hy_ - 14), (-2, hy_ - 19), (12, hy_ - 2), (-13, hy_ - 1)): c.drawCircle(px, py, 1.2, P((214, 206, 180), 200))      # a spotted scarf
    face = smooth_closed([(fx - 9.5, hy_ - 9), (fx, hy_ - 12), (fx + 9.5, hy_ - 9), (fx + 10, hy_ + 2), (fx + 6, hy_ + 11), (fx, hy_ + 13), (fx - 6, hy_ + 11), (fx - 10, hy_ + 2)]); _sh(c, face, skin)
    c.drawPath(smooth_closed([(fx - 9.5, hy_ - 9), (fx, hy_ - 13), (fx + 9.5, hy_ - 9), (fx + 6, hy_ - 6.5), (fx - 1, hy_ - 8), (fx - 7, hy_ - 6)]), P((80, 60, 50)))     # hair showing under the scarf
    _eyes(c, fx * 1.25, hy_ - 2, 4.0, look=yaw * 1.4, brow=(70, 50, 44))
    c.drawLine(fx * 1.3 + 0.4, hy_ - 0.5, fx * 1.3 + 1.0, hy_ + 3.6, SP(mix(skin, (60, 30, 40), 0.5), 1.1)); c.drawLine(fx * 1.2 - 2.2, hy_ + 7, fx * 1.2 + 2.2, hy_ + 7, SP((150, 60, 60), 1.4))   # nose and mouth (until the scarf covers them)
    mc = (160, 134, 74); top = lerp(hy_ + 9.5, hy_ + 0.5, pull)                                                                           # the knitted scarf: at her chin, or pulled up over mouth and nose
    mf = smooth_closed([(fx - 11.5, top + 1.5), (fx - 3, top - 0.5 - pull), (fx + 11.5, top + 1.5), (fx + 13, hy_ + 12), (9, hy_ + 20), (-9, hy_ + 20), (fx - 13, hy_ + 12)]); _sh(c, mf, mc)
    for j in range(4): yy = lerp(top + 4, hy_ + 18, j / 3.4); c.drawLine(fx * (1 - j / 4) - 10, yy, fx * (1 - j / 4) + 10, yy + 0.8, SP((104, 84, 46), 1.2))
    tail = smooth_closed([(-9, hy_ + 16), (-2, hy_ + 18), (0, hy_ + 36), (-5, hy_ + 42), (-10, hy_ + 36)]); _sh(c, tail, mc, rim=False); c.drawLine(-8, hy_ + 26, -2, hy_ + 27, SP((104, 84, 46), 1.1)); c.drawLine(-8, hy_ + 33, -2, hy_ + 34, SP((104, 84, 46), 1.1))
    # her right arm: hangs, or comes up and takes the scarf's edge
    hd = (lerp(-29, fx - 9, hand), lerp(-58, top + 3, hand)); el2 = (lerp(-27, -34, hand), lerp(-84, -98, hand))
    _tube(c, (-23, -112), el2, 13, 11, coat_c, rim=False); _tube(c, el2, (hd[0] - 1 - 2 * hand, hd[1] + 6 * hand - 6 * (1 - hand)), 11, 9, coat_c, rim=False)
    _hand(c, (hd[0] - 3 * hand, hd[1] + 7 * hand - 4 * (1 - hand)), math.radians(lerp(90, -62, hand)), 1, skin, s=0.15, pose=H.blend(H.REST, H.GRIP, hand))
    c.restore()


def waiting_man_cap(c, x, y, t, w=0.0, yaw=0.0):
    """a stocky man in a flat cap and a short jacket, a red muffler over his nose with the ends hanging, hands in his pockets. w -1..1 puts his weight on one leg or the other; yaw turns his head (- = screen left)"""
    br = 0.8 * math.sin(t * 1.9 + 2); hx_ = 6.0 * w; fx = 6.0 * yaw
    c.save(); c.translate(x, y)
    c.drawOval(skia.Rect(-38, -5, 38, 7), P((8, 8, 8), 160, MaskFilter=blur(4)))
    jk, tr_c, skin = (60, 68, 52), (38, 36, 36), (180, 134, 102)
    for sx in (-1, 1):
        free = max(0.0, -sx * w)                               # the leg without the weight bends at the knee and the heel comes up a little
        kn = (sx * 14 + hx_ * 0.5 + sx * 5 * free, -40 + 3 * free); _tube(c, (sx * 11 + hx_, -78), kn, 19, 16, tr_c, rim=sx > 0); _tube(c, kn, (sx * 15, -9 - 1.5 * free), 16, 13, tr_c, rim=sx > 0)
        sh_ = smooth_closed([(sx * 15 - 9, -9 - 1.5 * free), (sx * 15 + 9, -9 - 1.5 * free), (sx * 15 + 12 + (3 if sx > 0 else 0), -2), (sx * 15 + 10, 2), (sx * 15 - 11, 2), (sx * 15 - 12, -3)]); _sh(c, sh_, (20, 19, 18), rim=sx > 0)
    body = smooth_closed([(-24 - hx_ * 0.3, -132 + br * 0.4), (24 - hx_ * 0.3, -132 + br * 0.4), (31 - hx_ * 0.3, -120), (29 + hx_ * 0.5, -92), (27 + hx_, -68), (0 + hx_, -65), (-27 + hx_, -68), (-29 + hx_ * 0.5, -92), (-31 - hx_ * 0.3, -120)]); _sh(c, body, jk)
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawLine(1 - hx_ * 0.2, -126, 2 + hx_, -66, SP((30, 34, 28), 1.8)); c.drawRect(skia.Rect(-30 + hx_, -75, 30 + hx_, -66), P((40, 46, 36)))
    for v in (-112, -98, -84): c.drawCircle(4 - hx_ * 0.1 + (v + 112) * hx_ * 0.02, v, 2.1, P((26, 28, 24)))
    c.drawLine(-22 - hx_ * 0.2, -108, -8, -106, SP((34, 38, 30), 1.5)); c.drawLine(10, -106, 24 - hx_ * 0.2, -108, SP((34, 38, 30), 1.5))             # chest pocket flaps
    c.restore()
    for sx in (-1, 1):                                       # arms down into the jacket pockets
        _tube(c, (sx * 27 - hx_ * 0.3, -124), (sx * 31 + hx_ * 0.4, -96), 15, 13, jk, rim=sx > 0); _tube(c, (sx * 31 + hx_ * 0.4, -96), (sx * 22 + hx_, -80), 13, 12, jk, rim=sx > 0)
        c.drawLine(sx * 13 + hx_, -85, sx * 26 + hx_, -78, SP((28, 32, 26), 2.4))
    for sx in (-1, 1): c.drawPath(poly([(sx * 3 - hx_ * 0.3, -133), (sx * 16 - hx_ * 0.3, -135), (sx * 12 - hx_ * 0.3, -118), (sx * 2 - hx_ * 0.3, -124)]), P(mix(jk, (10, 12, 10), 0.35)))
    hx2, hy_ = -hx_ * 0.4, -146 + 0.8 * abs(w) + br * 0.3
    for sx in (-1, 1): c.drawOval(skia.Rect(hx2 + sx * 13 - 2.4 - fx * 0.2, hy_ - 4, hx2 + sx * 13 + 2.4 - fx * 0.2, hy_ + 4), P(mix(skin, (60, 30, 40), 0.2)))
    head = smooth_closed([(hx2 - 13, hy_ - 12), (hx2 + 13, hy_ - 12), (hx2 + 13.5, hy_ + 2), (hx2 + 8, hy_ + 12), (hx2, hy_ + 14), (hx2 - 8, hy_ + 12), (hx2 - 13.5, hy_ + 2)]); _sh(c, head, skin)
    c.drawPath(smooth_closed([(hx2 - 13, hy_ - 12), (hx2 + 13, hy_ - 12), (hx2 + 13, hy_ - 5), (hx2 + fx * 0.5, hy_ - 4), (hx2 - 13, hy_ - 5)]), P((60, 40, 40), 120))
    _eyes(c, hx2 + fx, hy_ - 1.5, 5.0, look=yaw * 1.5)
    cap = smooth_closed([(hx2 - 15, hy_ - 9), (hx2 - 14, hy_ - 17), (hx2 + fx * 0.3, hy_ - 21), (hx2 + 14, hy_ - 17), (hx2 + 15, hy_ - 9), (hx2, hy_ - 12)]); _sh(c, cap, (46, 44, 40))
    c.drawPath(smooth_closed([(hx2 - 14 + fx * 0.6, hy_ - 10), (hx2 + fx, hy_ - 13), (hx2 + 15 + fx * 0.6, hy_ - 10), (hx2 + 12 + fx, hy_ - 6), (hx2 - 2 + fx, hy_ - 8)]), P((24, 23, 21)))    # the peak follows the turn
    mc = (140, 60, 52); mf = smooth_closed([(hx2 - 14 + fx * 0.5, hy_ + 1), (hx2 + fx, hy_ - 1), (hx2 + 14 + fx * 0.5, hy_ + 1), (hx2 + 15, hy_ + 11), (hx2 + 6, hy_ + 17), (hx2 - 6, hy_ + 17), (hx2 - 15, hy_ + 11)]); _sh(c, mf, mc)
    c.drawLine(hx2 - 12 + fx * 0.5, hy_ + 7, hx2 + 12 + fx * 0.5, hy_ + 8, SP((84, 32, 32), 1.4)); c.drawLine(hx2 - 10, hy_ + 12, hx2 + 10, hy_ + 13, SP((84, 32, 32), 1.2))
    for sx, ln in ((-1, 22), (1, 15)):                        # the two ends of the muffler hang down his chest and swing a little as he shifts
        e0 = (hx2 + sx * 5, hy_ + 15); e1 = (hx2 + sx * 7 + hx_ * 0.7, hy_ + 15 + ln); pth = PN.limb(e0, e1, 7.5, 7); _sh(c, pth, mc, rim=sx > 0)
        for q in (0.75, 0.9): c.drawLine(lerp(e0[0], e1[0], q) - 3.4, lerp(e0[1], e1[1], q), lerp(e0[0], e1[0], q) + 3.4, lerp(e0[1], e1[1], q), SP((84, 32, 32), 1.2))
    c.restore()


def bell(t, t0, w):
    return math.exp(-((t - t0) / w) ** 2)


def acts(tr):
    """what each of the three does, by seconds from the start of the shot (6.4 s in all). Returns (tall, woman, cap) keyword dicts."""
    up = smooth((tr - 0.75) / 0.5) * (1 - smooth((tr - 2.5) / 0.6)) + smooth((tr - 4.5) / 0.6)              # handkerchief up for the cough, down, and up again to breathe through it
    cough = bell(tr, 1.42, 0.07) + 0.8 * bell(tr, 1.74, 0.07) + 0.3 * bell(tr, 2.02, 0.07)
    hand = smooth((tr - 2.7) / 0.45) * (1 - smooth((tr - 3.75) / 0.5)); pull = smooth((tr - 3.1) / 0.5)        # she takes the scarf's edge and draws it up over her nose
    wy = -0.9 * smooth((tr - 1.6) / 0.35) * (1 - smooth((tr - 2.5) / 0.5))                                    # she glances at the man who coughed
    w = -1 + 2 * smooth((tr - 0.3) / 0.7) - 2 * smooth((tr - 3.9) / 0.8) + 2 * smooth((tr - 5.5) / 0.7)        # weight from one leg to the other, three times
    cy = -1.0 * smooth((tr - 1.55) / 0.3) * (1 - smooth((tr - 2.9) / 0.5))                                   # his head turns toward the cough
    return dict(up=up, cough=cough), dict(pull=pull, hand=hand, yaw=wy), dict(w=w, yaw=cy)


if __name__ == '__main__':
    s = skia.Surface(8 * 420, 1560); c = s.getCanvas(); c.clear(C((120, 108, 66)))
    for i in range(16):
        tr = i * 0.4; a, b, d_ = acts(tr); c.save(); c.translate((i % 8) * 420, (i // 8) * 780); c.scale(3.6, 3.6)
        waiting_man_tall(c, 28, 205, tr, **a); waiting_woman(c, 60, 207, tr, **b); waiting_man_cap(c, 93, 206, tr, **d_); c.restore()
    s.makeImageSnapshot().save('out/test/waiting.png')
