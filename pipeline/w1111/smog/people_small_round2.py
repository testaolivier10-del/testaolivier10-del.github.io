"""The three who wait at the bus stop in the five days shot: small far figures (about 250 px tall on screen), simple on purpose, but three different
people who each do something: a tall man who coughs into a handkerchief, a woman who turns her head to look for the bus, a man who shifts his weight."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/smog']
sys.path += ['/home/claude/short', '/home/claude/guy']
import skia
import person as PN
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import diffp

RIMC = (186, 164, 94)


def _sh(c, path, col, rim=True):
    c.drawPath(path, P(col))
    if rim: c.drawPath(diffp(path, (-2.2, 0.7)), P(RIMC, 150))      # the street lamp is to their right


def _tube(c, a, b, w0, w1, col, rim=True):
    p = PN.limb(a, b, w0, w1); _sh(c, p, col, rim); return p


def waiting_man_tall(c, x, y, t):
    """a tall man in a trilby and a long overcoat; every few seconds he coughs into a handkerchief"""
    ph = (t % 2.9) / 2.9; cg = math.exp(-((ph - 0.3) / 0.035) ** 2) + 0.8 * math.exp(-((ph - 0.42) / 0.035) ** 2)       # two coughs
    dip = 5.0 * cg; hun = 2.5 * cg
    c.save(); c.translate(x, y)
    c.drawOval(skia.Rect(-34, -5, 34, 7), P((8, 8, 8), 150, MaskFilter=blur(4)))
    coat_c, tr_c, skin = (44, 41, 38), (24, 24, 24), (156, 116, 86)
    for sx in (-1, 1): c.drawOval(skia.Rect(sx * 13 - 12, -7, sx * 13 + 13 + (4 if sx > 0 else 0), 3), P((14, 13, 12))); _tube(c, (sx * 11, -44), (sx * 12, -8), 15, 12, tr_c, rim=sx > 0)
    _tube(c, (26, -132 - hun), (31, -72), 15, 12, coat_c); c.drawOval(skia.Rect(26, -72, 37, -58), P(skin))                         # his left arm hangs
    coat = smooth_closed([(-22, -142 - hun), (22, -142 - hun), (30, -128 - hun), (30, -96), (33, -40), (28, -33), (0, -31), (-28, -33), (-33, -40), (-30, -96), (-30, -128 - hun)])
    _sh(c, coat, coat_c)
    c.drawLine(3, -128, 5, -34, SP((20, 19, 18), 2)); c.drawLine(-24, -86, 24, -86, SP((20, 19, 18), 2.4))                           # front edge, belt
    for v in (-112, -98): c.drawCircle(-4, v, 2, P((20, 19, 18)))
    for sx in (-1, 1): c.drawPath(poly([(sx * 3, -142 - hun), (sx * 16, -146 - hun), (sx * 13, -118), (sx * 2, -126)]), P((30, 28, 26)))   # collar turned up
    hx_, hy_ = 2 * cg, -160 + dip
    c.drawOval(skia.Rect(hx_ - 12, hy_ - 15, hx_ + 12, hy_ + 14), P(skin)); c.drawOval(skia.Rect(hx_ - 12, hy_ - 15, hx_ + 12, hy_ - 2), P((70, 50, 44), 150))   # brim shadow over the eyes
    for sx in (-1, 1): c.drawLine(hx_ + sx * 5 - 2.4, hy_ - 1 + cg, hx_ + sx * 5 + 2.4, hy_ - 1 + 1.2 * cg, SP((30, 20, 20), 1.6))              # eyes, screwed shut in the cough
    hat_c = (36, 34, 32); c.drawOval(skia.Rect(hx_ - 21, hy_ - 15, hx_ + 21, hy_ - 7), P(hat_c)); _sh(c, smooth_closed([(hx_ - 13, hy_ - 12), (hx_ - 12, hy_ - 27), (hx_ - 4, hy_ - 30), (hx_, hy_ - 27), (hx_ + 4, hy_ - 30), (hx_ + 12, hy_ - 27), (hx_ + 13, hy_ - 12)]), hat_c)
    c.drawRect(skia.Rect(hx_ - 13, hy_ - 17, hx_ + 13, hy_ - 13), P((18, 17, 16)))
    el = (-36, -100 - hun); hd = (hx_ - 3, hy_ + 8)                                                                              # his right arm brings the handkerchief to his mouth
    _tube(c, (-26, -132 - hun), el, 15, 13, coat_c, rim=False); _tube(c, el, (hd[0] - 4, hd[1] + 8), 13, 11, coat_c, rim=False)
    hk = smooth_closed([(hd[0] - 11, hd[1] - 4), (hd[0] + 2, hd[1] - 8), (hd[0] + 11, hd[1] - 2), (hd[0] + 9, hd[1] + 8), (hd[0] + 1, hd[1] + 12 + 2 * cg), (hd[0] - 9, hd[1] + 8)])
    c.drawPath(hk, P((222, 214, 190))); c.drawLine(hd[0] - 6, hd[1] + 1, hd[0] + 5, hd[1] + 6, SP((150, 142, 120), 1.4)); c.drawOval(skia.Rect(hd[0] - 12, hd[1] + 2, hd[0] - 2, hd[1] + 12), P(skin))
    c.restore()


def waiting_woman(c, x, y, t):
    """a short woman in a headscarf and a belted coat, a muffler wound over her mouth and nose, a handbag on her arm; she turns her head to look down the street"""
    yaw = 0.5 + 0.5 * (smooth((math.sin(2 * math.pi * t / 4.6 - 0.6) + 0.2) / 0.5) * 2 - 1); fx = -5.0 * yaw
    c.save(); c.translate(x, y)
    c.drawOval(skia.Rect(-32, -5, 32, 7), P((8, 8, 8), 150, MaskFilter=blur(4)))
    coat_c, skin, stock = (84, 44, 44), (166, 124, 96), (112, 88, 70)
    for sx in (-1, 1): c.drawOval(skia.Rect(sx * 9 - 8, -6, sx * 9 + 10, 3), P((16, 14, 14))); _tube(c, (sx * 9, -40), (sx * 9, -8), 10, 7, stock, rim=sx > 0)
    coat = smooth_closed([(-18, -120), (18, -120), (25, -108), (24, -84), (36, -38), (0, -33), (-36, -38), (-24, -84), (-25, -108)]); _sh(c, coat, coat_c)
    c.drawLine(-24, -84, 24, -84, SP((40, 20, 22), 3.4)); c.drawRect(skia.Rect(-3, -88, 4, -80), P((150, 130, 80))); c.drawLine(1, -118, 2, -36, SP((46, 24, 26), 1.8))
    for v in (-108, -98): c.drawCircle(-5, v, 2.2, P((40, 20, 22)))
    _tube(c, (-23, -112), (-28, -62), 13, 10, coat_c, rim=False); c.drawOval(skia.Rect(-33, -62, -23, -50), P(skin))
    el = (30, -84); _tube(c, (23, -112), el, 13, 11, coat_c); _tube(c, el, (12, -74), 11, 9, coat_c)                               # the arm that carries the bag, folded across
    c.drawLine(27, -84, 27, -66, SP((30, 22, 20), 2)); bag = skia.Path(); bag.addRRect(skia.RRect.MakeRectXY(skia.Rect(15, -68, 40, -46), 4, 4)); _sh(c, bag, (48, 34, 28)); c.drawRect(skia.Rect(25, -68, 30, -62), P((170, 150, 90)))
    hy_ = -134
    hs_c = (92, 104, 122); hs = smooth_closed([(-15 - fx * 0.4, hy_ + 6), (-16, hy_ - 8), (-9, hy_ - 19), (0, hy_ - 22), (9, hy_ - 19), (16, hy_ - 8), (15 - fx * 0.4, hy_ + 6), (8, hy_ + 16), (0, hy_ + 18), (-8, hy_ + 16)]); _sh(c, hs, hs_c)
    c.drawOval(skia.Rect(fx - 9.5, hy_ - 12, fx + 9.5, hy_ + 12), P(skin)); c.drawPath(smooth_closed([(fx - 9.5, hy_ - 12), (fx, hy_ - 15), (fx + 9.5, hy_ - 12), (fx + 7, hy_ - 7), (fx - 2, hy_ - 9), (fx - 8, hy_ - 6)]), P(hs_c))   # the scarf's edge over her brow
    for sx in (-1, 1): c.drawOval(skia.Rect(fx * 1.3 + sx * 4 - 1.6, hy_ - 4, fx * 1.3 + sx * 4 + 1.6, hy_ - 1), P((30, 20, 20)))                # her eyes follow the turn
    mf = smooth_closed([(fx - 11, hy_ + 1), (fx - 2, hy_ - 1), (fx + 11, hy_ + 1), (fx + 12, hy_ + 10), (fx + 4, hy_ + 16), (fx - 6, hy_ + 16), (fx - 12, hy_ + 10)])              # the muffler wound over mouth and nose
    mc = (150, 126, 70); _sh(c, mf, mc); c.drawLine(fx - 10, hy_ + 6, fx + 10, hy_ + 7, SP((96, 78, 44), 1.4)); c.drawLine(fx - 8, hy_ + 11, fx + 8, hy_ + 12, SP((96, 78, 44), 1.2))
    c.drawPath(smooth_closed([(-9, hy_ + 14), (-2, hy_ + 16), (0, hy_ + 34), (-5, hy_ + 40), (-10, hy_ + 34)]), P(mc)); c.drawLine(-8, hy_ + 22, -2, hy_ + 24, SP((96, 78, 44), 1.2))     # its tail tucked down the front
    c.restore()


def waiting_man_cap(c, x, y, t):
    """a stocky man in a flat cap and a short jacket, a muffler over his nose with the ends hanging, hands in his pockets; he shifts his weight from foot to foot"""
    w = math.sin(2 * math.pi * t / 3.4 + 1.0); w = math.copysign(abs(w) ** 0.6, w); hx_ = 4.5 * w
    c.save(); c.translate(x, y)
    c.drawOval(skia.Rect(-36, -5, 36, 7), P((8, 8, 8), 150, MaskFilter=blur(4)))
    jk, tr_c, skin = (50, 56, 44), (32, 31, 30), (160, 118, 88)
    for sx in (-1, 1):
        free = max(0.0, -sx * w)                               # the leg without the weight bends at the knee
        c.drawOval(skia.Rect(sx * 15 - 12, -7, sx * 15 + 13 + (3 if sx > 0 else 0), 3), P((14, 13, 12)))
        kn = (sx * 14 + hx_ * 0.5 + sx * 4 * free, -40 + 2 * free); _tube(c, (sx * 11 + hx_, -78), kn, 19, 16, tr_c, rim=sx > 0); _tube(c, kn, (sx * 15, -8), 16, 13, tr_c, rim=sx > 0)
    body = smooth_closed([(-24 - hx_ * 0.3, -132), (24 - hx_ * 0.3, -132), (31 - hx_ * 0.3, -120), (29 + hx_ * 0.5, -92), (27 + hx_, -68), (0 + hx_, -65), (-27 + hx_, -68), (-29 + hx_ * 0.5, -92), (-31 - hx_ * 0.3, -120)]); _sh(c, body, jk)
    c.drawLine(1 - hx_ * 0.2, -126, 2 + hx_, -67, SP((26, 30, 24), 2)); c.drawRect(skia.Rect(-26 + hx_, -74, 26 + hx_, -68), P((34, 38, 30)))
    for sx in (-1, 1):                                       # arms down into the jacket pockets
        _tube(c, (sx * 27 - hx_ * 0.3, -124), (sx * 30 + hx_ * 0.4, -96), 15, 13, jk, rim=sx > 0); _tube(c, (sx * 30 + hx_ * 0.4, -96), (sx * 22 + hx_, -80), 13, 12, jk, rim=sx > 0)
        c.drawLine(sx * 14 + hx_, -84, sx * 25 + hx_, -78, SP((26, 30, 24), 2.2))
    hx2, hy_ = -hx_ * 0.4, -146 + 0.8 * abs(w)
    c.drawOval(skia.Rect(hx2 - 13, hy_ - 14, hx2 + 13, hy_ + 13), P(skin)); c.drawOval(skia.Rect(hx2 - 13, hy_ - 14, hx2 + 13, hy_ - 3), P((70, 50, 44), 150))
    for sx in (-1, 1): c.drawOval(skia.Rect(hx2 + sx * 5 - 1.8, hy_ - 3, hx2 + sx * 5 + 1.8, hy_), P((30, 20, 20)))
    cap = smooth_closed([(hx2 - 15, hy_ - 9), (hx2 - 14, hy_ - 17), (hx2, hy_ - 21), (hx2 + 14, hy_ - 17), (hx2 + 15, hy_ - 9), (hx2, hy_ - 12)]); _sh(c, cap, (40, 38, 34)); c.drawPath(smooth_closed([(hx2 - 14, hy_ - 10), (hx2, hy_ - 13), (hx2 + 15, hy_ - 10), (hx2 + 12, hy_ - 6), (hx2 - 2, hy_ - 8)]), P((22, 21, 19)))
    mc = (128, 56, 50); mf = smooth_closed([(hx2 - 14, hy_ + 1), (hx2, hy_ - 1), (hx2 + 14, hy_ + 1), (hx2 + 15, hy_ + 11), (hx2 + 6, hy_ + 17), (hx2 - 6, hy_ + 17), (hx2 - 15, hy_ + 11)]); _sh(c, mf, mc)
    c.drawLine(hx2 - 12, hy_ + 7, hx2 + 12, hy_ + 8, SP((78, 30, 30), 1.5))
    for sx, ln in ((-1, 34), (1, 26)):                        # the two ends of the muffler hang down his chest and sway a little as he shifts
        e0 = (hx2 + sx * 5, hy_ + 15); e1 = (hx2 + sx * 7 + hx_ * 0.5, hy_ + 15 + ln); pth = PN.limb(e0, e1, 9, 8); c.drawPath(pth, P(mc)); c.drawLine(e1[0] - 3, e1[1] + 2, e1[0] + 3, e1[1] + 2, SP((78, 30, 30), 1.6))
    c.restore()


if __name__ == '__main__':
    s = skia.Surface(2400, 620); c = s.getCanvas(); c.clear(C((120, 108, 66)))
    for i in range(6):
        t = i * 0.5; c.save(); c.translate(i * 400, 0); c.scale(2.2, 2.2); waiting_man_tall(c, 40, 260, t + 0.6); waiting_woman(c, 96, 262, t); waiting_man_cap(c, 150, 261, t); c.restore()
    s.makeImageSnapshot().save('out/test/waiting.png')
