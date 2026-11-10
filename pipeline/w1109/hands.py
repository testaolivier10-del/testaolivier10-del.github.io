"""One hand model for every hand in the video (Olivier 2026-11-09: hands should look and work like actual hands).
Seen from the back of the hand: a palm, four fingers with three phalanges each and a two segment thumb. Each finger has its
own curl (0 straight .. 1 fully curled under); curling bends the joints in order (base, middle, tip) and foreshortens the
finger the way a real one does when it curls away from the viewer. Proportions from anatomy: middle finger about as long as
the palm, index and ring a little shorter, the little finger shortest and set lower, the thumb leaving the palm near the wrist."""
import math
import skia
from lpk import P, SP, mix, smooth_closed, lerp
from art import shaded, diffp, tube, op

#            v (across, + = thumb side), u of knuckle, length, width
FINGERS = [(17.0, 47.0, 43.0, 13.5),     # index
           (5.5, 50.0, 48.0, 14.0),      # middle
           (-6.0, 48.0, 44.0, 13.0),     # ring
           (-17.0, 42.0, 34.0, 11.5)]    # little
SPLAY = [9.0, 2.0, -5.0, -13.0]          # degrees at full spread
REST = dict(curls=(0.25, 0.3, 0.36, 0.42, 0.48), spread=0.35)
FLAT = dict(curls=(0.05, 0.03, 0.03, 0.04, 0.06), spread=0.7)
POINT = dict(curls=(0.85, 0.0, 0.92, 0.95, 0.95), spread=0.1)
GRIP = dict(curls=(0.7, 0.78, 0.8, 0.8, 0.78), spread=0.05)
OPEN = dict(curls=(0.1, 0.1, 0.12, 0.14, 0.16), spread=0.5)


def blend(a, b, u):
    return dict(curls=tuple(lerp(x, y, u) for x, y in zip(a['curls'], b['curls'])), spread=lerp(a['spread'], b['spread'], u))


def hand(c, wrist, ang, side=1, s=1.0, curls=(0.25, 0.3, 0.36, 0.42, 0.48), spread=0.35, skin=(240, 190, 160), shade=(206, 146, 128), hi=(255, 222, 196),
         light=(-0.6, -0.5), nails=False, shadow=True):
    """wrist: world point; ang: direction the fingers point (radians); side: +1 thumb on the clockwise side, -1 mirrored."""
    ca, sa = math.cos(ang), math.sin(ang)
    W = lambda u, v: (wrist[0] + s * (u * ca - v * side * sa), wrist[1] + s * (u * sa + v * side * ca))
    d = (light[0] * 5 * s ** 0.5, light[1] * 5 * s ** 0.5)
    parts = []
    # ---- thumb: two segments from the base of the palm; curled, it folds across the palm
    tc = curls[0]
    a1 = math.radians(lerp(52, 12, tc) * 1.0); a2 = a1 - math.radians(lerp(8, 70, tc))
    t0 = (12.0, 19.0); l1, l2 = 24.0, 21.0
    t1 = (t0[0] + l1 * math.cos(a1), t0[1] + l1 * math.sin(a1)); t2 = (t1[0] + l2 * math.cos(a2), t1[1] + l2 * math.sin(a2))
    thumb = op(tube(W(*t0), W(*t1), 19 * s, 15.5 * s), tube(W(*t1), W(*t2), 15.5 * s, 12.5 * s))
    # ---- fingers
    fpaths = []; tips = []; mids = []
    for i, (v, u, L, w) in enumerate(FINGERS):
        cu = curls[i + 1]
        aa = math.radians(SPLAY[i] * spread)
        # foreshortening: each phalanx shortens as its joint bends away from the viewer; joints bend in order
        b1 = min(1.0, cu * 1.6); b2 = min(1.0, max(0.0, cu * 1.5 - 0.15)); b3 = min(1.0, max(0.0, cu * 1.5 - 0.3))
        l1 = L * 0.46 * math.cos(math.radians(62 * b1)); l2 = L * 0.30 * math.cos(math.radians(80 * b1 + 60 * b2) * 0.62); l3 = L * 0.24 * math.cos(math.radians(70 * (b1 + b2 + b3) / 3) )
        if cu > 0.7: l2 *= lerp(1.0, 0.35, (cu - 0.7) / 0.3); l3 *= lerp(1.0, 0.0, (cu - 0.7) / 0.3)
        p0 = (u - 4, v); p1 = (p0[0] + (l1 + 4) * math.cos(aa), p0[1] + (l1 + 4) * math.sin(aa))
        a2_ = aa * 1.15; p2 = (p1[0] + l2 * math.cos(a2_), p1[1] + l2 * math.sin(a2_)); p3 = (p2[0] + l3 * math.cos(a2_), p2[1] + l3 * math.sin(a2_))
        f = op(tube(W(*p0), W(*p1), w * s, w * 0.94 * s), tube(W(*p1), W(*p2), w * 0.94 * s, w * 0.86 * s))
        if l3 > 1.0: f = op(f, tube(W(*p2), W(*p3), w * 0.86 * s, w * 0.76 * s))
        fpaths.append((f, cu, w)); tips.append((p2, p3, a2_, cu, w, l3)); mids.append((p1, aa, w, cu))
    palm = smooth_closed([W(-8, -15), W(10, -19), W(30, -22), W(44, -21), W(52, -10), W(54, 4), W(52, 16), W(44, 23), W(26, 24), W(10, 19), W(-8, 15)])
    sil = palm
    for f, _, _ in fpaths: sil = op(sil, f)
    sil = op(sil, thumb)
    if shadow: c.drawPath(sil, P((30, 14, 40), 70, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 5 * s ** 0.5)))
    under = tc > 0.5                                           # a curled thumb lies over the fingers; an open one sits behind
    if not under: shaded(c, thumb, skin, shade, sh=(-d[0], -d[1]))
    for (f, cu, w), (p2, p3, a2_, _, _, l3), (p1, aa, _, _) in zip(fpaths, tips, mids):
        base = mix(skin, shade, 0.35 * cu)                     # fingers curled under catch less light
        shaded(c, f, base, shade, sh=(-d[0] * 0.8, -d[1] * 0.8))
        if cu < 0.6:                                           # knuckle creases on a straight finger
            for q, k in ((p1, 0.42), (p2, 0.36)):
                n = (-math.sin(aa), math.cos(aa)); a_ = W(q[0] + n[0] * w * k, q[1] + n[1] * w * k); b_ = W(q[0] - n[0] * w * k, q[1] - n[1] * w * k)
                c.drawLine(*a_, *b_, SP(shade, max(1.4, 1.5 * s), 150))
        if nails and cu < 0.4 and l3 > 3:
            m = ((p2[0] + p3[0]) / 2 + 2.2 * math.cos(a2_), (p2[1] + p3[1]) / 2 + 2.2 * math.sin(a2_))
            c.save(); c.translate(*W(*m)); c.rotate(math.degrees(ang + a2_ * side))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-l3 * 0.36 * s, -w * 0.27 * s, l3 * 0.4 * s, w * 0.27 * s), w * 0.2 * s, w * 0.2 * s), P(mix(hi, (255, 200, 200), 0.35)))
            c.restore()
    shaded(c, palm, skin, shade, sh=(-d[0], -d[1]))
    for (v, u, L, w), cu in zip(FINGERS, curls[1:]):          # knuckles: a soft bump where each finger leaves the palm
        k = W(u - 3, v)
        c.drawCircle(k[0] - d[0] * 0.25, k[1] - d[1] * 0.25, w * 0.36 * s, P(mix(skin, hi, 0.5 + 0.3 * cu), 95))
        c.drawCircle(k[0] + d[0] * 0.5, k[1] + d[1] * 0.5, w * 0.26 * s, P(shade, 45))
    if under: shaded(c, thumb, skin, shade, sh=(-d[0], -d[1]))
    tk = W(*t1); c.drawCircle(tk[0], tk[1], 4.2 * s, P(mix(skin, hi, 0.5), 150))
    if nails and tc < 0.5:
        m = ((t1[0] + t2[0]) / 2 + 4 * math.cos(a2), (t1[1] + t2[1]) / 2 + 4 * math.sin(a2))
        c.save(); c.translate(*W(*m)); c.rotate(math.degrees(ang + a2 * side))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-6 * s, -4.2 * s, 7 * s, 4.2 * s), 3 * s, 3 * s), P(mix(hi, (255, 200, 200), 0.35))); c.restore()
    c.drawPath(diffp(sil, (d[0] * 0.7, d[1] * 0.7)), P(hi, 200))                                         # one rim around the whole hand
    return W
