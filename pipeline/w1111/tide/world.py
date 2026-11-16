"""The tide flat for the tide video, all code, house flat style. One world seen from a low dune: sky and a low sun over the sea at the top,
the sea, the waterline, the wet flat with the car, the man near the water. Scene coords = screen coords at camera zoom 1.
THE RULE: everything that shows the tide is driven by one story clock tau (hours after low water) through h(tau) = (1 - cos(pi tau / 6)) / 2:
the waterline on the sand (screen y = Y0 + D h), the water level on the tide pole, and the dot on the curve."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/tide']
import numpy as np, skia
import man as M, car as CAR
sys.path[:0] = ['/home/claude/w1111/tide']
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed, lgrad
from art import glow

HOR = 520.0
Y0, D = 1002.2, 564.0              # waterline at low water, and how far it travels up the flat from low to high
POLE_X, GX0, GPH, GY0, GH = 90.0, 90.0, 124.0, 880.0, 320.0     # the tide pole is the height axis of the curve: 124 px an hour, 320 px from low to high
CAR_AT = (580.0, 1405.0); MAN_AT = (925.0, 1100.0); MAN_S = 0.19; STICK_X = 800.0
PLUS = skia.BlendMode.kPlus
_R = np.random.default_rng(11)
RIPS = [(_R.uniform(-150, 1230), _R.uniform(1000, 1900), _R.uniform(26, 70), _R.uniform(-1, 1)) for _ in range(150)]
PEBS = [(_R.uniform(-150, 1230), _R.uniform(1010, 1900), _R.uniform(2.5, 6.5), _R.integers(0, 3)) for _ in range(70)]
WAVES = [(_R.uniform(0, 1), _R.uniform(0.02, 1), _R.uniform(0.5, 1.0), _R.uniform(0, 6.28)) for _ in range(90)]
GLIT = [(_R.uniform(-1, 1), _R.uniform(0, 1), _R.uniform(0, 6.28), _R.uniform(0.6, 1.4)) for _ in range(80)]
CLOUDS = [(_R.uniform(0, 1), _R.uniform(120, 470), _R.uniform(120, 260), _R.uniform(0.5, 1.0)) for _ in range(7)]
CSH = [(0.05, 1180, 520, 150), (0.42, 1420, 620, 190), (0.74, 1250, 460, 140), (0.9, 1650, 640, 200)]
POOLS = [(250, 1236, 120, 20, 0.3), (742, 1262, 86, 15, -0.2), (120, 1560, 150, 26, 0.1), (930, 1640, 130, 22, -0.1), (440, 1128, 70, 11, 0.15)]


def h_of(tau):
    return (1 - math.cos(math.pi * min(6.0, max(0.0, tau)) / 6)) / 2


def yw(tau):
    return Y0 + D * h_of(tau)


def light_of(tau):
    """0 = late afternoon, 1 = last light. The sun sinks as the story clock runs"""
    return smooth((tau - 1.1) / 3.3)


def pal(L):
    return dict(sky0=mix((52, 112, 160), (58, 52, 116), L), sky1=mix((148, 196, 204), (214, 120, 124), L), sky2=mix((255, 222, 160), (255, 164, 96), L),
                sea_far=mix((176, 222, 206), (250, 178, 132), L), sea_mid=mix((36, 150, 162), (40, 104, 138), L), sea_near=mix((52, 176, 172), (74, 132, 150), L),
                dry=mix((236, 200, 146), (228, 158, 118), L), dry2=mix((222, 180, 128), (204, 132, 106), L), wet=mix((164, 134, 112), (140, 96, 104), L),
                shadow=mix((84, 58, 96), (56, 38, 100), L), foam=mix((255, 252, 244), (255, 226, 206), L), sun=mix((255, 246, 214), (255, 190, 120), L),
                glit=mix((255, 248, 214), (255, 196, 130), L), glass=(mix((176, 228, 228), (255, 176, 130), L), mix((44, 92, 120), (70, 56, 110), L)))


def sun_pos(L):
    return (330 + 150 * L, 398 + 104 * L)


def edge(x, t, tau, calm=0.0, surge=0.0):
    """the swash edge: the true waterline plus a thin wave sliding in and out around it (zero mean)"""
    a = 7.0 * (1 - 0.75 * calm)
    return yw(tau) + a * (0.6 * math.sin(0.9 * t + 0.004 * x) + 0.4 * math.sin(1.7 * t + 0.011 * x + 1.0)) + 4.0 * math.sin(0.021 * x + 0.5 * math.sin(t * 0.6) + 2.0) + surge * (0.72 + 0.28 * math.sin(0.011 * x + 0.6))


def gull(c, x, y, s, fl, col=(255, 255, 255), a=255):
    p = skia.Path(); p.moveTo(x - 22 * s, y - 8 * s * fl); p.quadTo(x - 10 * s, y - 10 * s * fl - 4 * s, x, y); p.quadTo(x + 10 * s, y - 10 * s * fl - 4 * s, x + 22 * s, y - 8 * s * fl)
    c.drawPath(p, SP(col, 3.2 * s, a)); c.drawCircle(x, y + 1.5 * s, 2.6 * s, P(col, a))


def sky(c, t, L, W, pl=None):
    pl = pl or pal(L)
    lgrad(c, skia.Rect(-200, -200, 1300, HOR + 4), 0, HOR, [pl['sky0'], pl['sky1'], pl['sky2']], [0, 0.62, 1.0])
    sx, sy = sun_pos(L)
    glow(c, sx, sy, 330, mix((255, 214, 150), (255, 150, 90), L), 150); glow(c, sx, sy, 120, (255, 240, 200), 200)
    c.save(); c.clipRect(skia.Rect(-200, -200, 1300, HOR)); c.drawCircle(sx, sy, 36, P(pl['sun'])); c.restore()
    for (u, y, w, k) in CLOUDS:
        x = ((u * 1700 + W * 0.5 * k) % 1700) - 300
        c.drawOval(skia.Rect(x - w, y - w * 0.16, x + w, y + w * 0.16), P(mix((255, 236, 214), (255, 170, 150), L), 150 * k, MaskFilter=blur(14)))
        c.drawOval(skia.Rect(x - w * 0.7, y + w * 0.05, x + w * 0.8, y + w * 0.2), P(mix((150, 170, 200), (120, 80, 130), L), 110 * k, MaskFilter=blur(12)))


def sand(c, t, tau, L, pl, hide_marks=False):
    y_w = yw(tau)
    lgrad(c, skia.Rect(-200, Y0 - 30, 1300, 2100), Y0, 1920, [pl['dry2'], pl['dry'], mix(pl['dry'], pl['dry2'], 0.4)], [0, 0.55, 1.0])
    # the flat is still damp from the last tide: darker and glossier toward the water
    c.drawRect(skia.Rect(-200, Y0 - 30, 1300, y_w + 330), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, y_w - 10), skia.Point(0, y_w + 320)], [C(pl['wet'], 255), C(pl['wet'], 120), C(pl['wet'], 0)], [0, 0.35, 1.0])))
    c.drawRect(skia.Rect(-200, y_w, 1300, y_w + 60), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, y_w), skia.Point(0, y_w + 60)], [C(pl['sky2'], 120), C(pl['sky2'], 0)])))
    rp = skia.Path()
    for (x, y, ln, k) in RIPS:                                # ripple marks left by the last tide
        if y > y_w + 6: rp.moveTo(x - ln / 2, y); rp.quadTo(x, y - 5 - 3 * k, x + ln / 2, y + 2 * k)
    c.drawPath(rp, SP(mix(pl['dry2'], pl['wet'], 0.6), 2.6, 120)); rp.offset(0, 3); c.drawPath(rp, SP(mix(pl['dry'], (255, 255, 255), 0.35), 1.6, 110))
    for (x, y, r, kind) in PEBS:
        if y < y_w + 4: continue
        if kind == 0: c.drawOval(skia.Rect(x - r, y - r * 0.6, x + r, y + r * 0.6), P(mix(pl['wet'], (60, 50, 70), 0.4))); c.drawOval(skia.Rect(x - r * 0.6, y - r * 0.5, x + r * 0.2, y - r * 0.1), P((255, 255, 255), 90))
        elif kind == 1: c.drawArc(skia.Rect(x - r, y - r, x + r, y + r), 180, 180, True, P(mix((255, 240, 226), pl['dry'], 0.3))); c.drawLine(x, y, x, y - r, SP(pl['wet'], 1, 160))
        else: c.drawOval(skia.Rect(x - r * 1.3, y - r * 0.5, x + r * 1.3, y + r * 0.5), P(mix(pl['dry2'], (90, 70, 80), 0.35)))
    for (x, y, w, hh, k) in POOLS:                           # shallow pools holding the sky
        if y < y_w + hh + 8: continue
        pp = smooth_closed([(x - w, y), (x - w * 0.5, y - hh * (1 + k)), (x + w * 0.4, y - hh), (x + w, y - hh * 0.2 * k), (x + w * 0.5, y + hh), (x - w * 0.4, y + hh * (1 - k))])
        q = skia.Path(pp); q.offset(0, 4); c.drawPath(q, P(pl['wet'], 220)); c.drawPath(pp, P(mix(pl['sky1'], pl['sky2'], 0.5)))
        c.save(); c.clipPath(pp, skia.ClipOp.kIntersect, True); c.drawOval(skia.Rect(x - w * 0.6, y - hh * 0.7, x + w * 0.1, y - hh * 0.1), P((255, 255, 255), 110, MaskFilter=blur(3))); c.restore()
    if hide_marks: return
    cx, cy = CAR_AT
    for dy, a in ((0, 150), (-17, 100)):                      # the tyre tracks he drove in on
        tr = skia.Path(); tr.moveTo(-180, 1512 + dy); tr.cubicTo(60, 1470 + dy, 220, cy - 2 + dy, cx - 170, cy - 2 + dy); tr.lineTo(cx + 176, cy - 2 + dy)
        c.save(); c.clipRect(skia.Rect(-200, y_w + 4, 1300, 2000))
        c.drawPath(tr, SP(mix(pl['wet'], (70, 50, 70), 0.3), 13, a)); c.drawPath(tr, skia.Paint(AntiAlias=True, Color=C(pl['dry'], a * 0.8), Style=skia.Paint.kStroke_Style, StrokeWidth=9, PathEffect=skia.DashPathEffect.Make([5, 7], 0)))
        c.restore()
    for i in range(13):                                       # his footprints from the car door to where he stands
        u = i / 12.0; fx = lerp(cx + 96, MAN_AT[0] - 6, u) + 26 * math.sin(u * math.pi); fy = lerp(cy + 6, MAN_AT[1] + 6, u ** 0.8)
        if fy < y_w + 6: continue
        sd = 1 if i % 2 else -1; sc_ = lerp(1.15, 0.9, u)
        c.save(); c.translate(fx + sd * 7 * sc_, fy); c.rotate(52 + sd * 8); c.scale(sc_, sc_)
        c.drawOval(skia.Rect(-9, -4, 5, 4), P(mix(pl['wet'], (70, 50, 70), 0.35), 200)); c.drawOval(skia.Rect(7, -3.2, 13, 3.2), P(mix(pl['wet'], (70, 50, 70), 0.35), 200)); c.restore()


def sea(c, t, tau, L, pl, W, calm=0.0, surge=0.0):
    y_w = yw(tau)
    xs = list(range(-200, 1301, 20))
    ed = [(x, edge(x, t, tau, calm, surge)) for x in xs]
    sp = skia.Path(); sp.moveTo(-200, HOR)
    for p_ in ed: sp.lineTo(*p_)
    sp.lineTo(1300, HOR); sp.close()
    y_g = y_w + 0.85 * surge; f1 = max(0.12, min(0.5, 110 / (y_g - HOR)))      # with a run of swash the shallow fade stretches out with it
    sh = skia.GradientShader.MakeLinear([skia.Point(0, HOR), skia.Point(0, y_g + 8)], [C(pl['sea_far']), C(pl['sea_mid']), C(pl['sea_mid']), C(pl['sea_near'], 235), C(pl['sea_near'], 150)],
                                        [0, f1, max(f1 + 0.01, 1 - (150 + surge) / (y_g - HOR)), max(f1 + 0.02, 1 - (46 + 0.5 * surge) / (y_g - HOR)), 1.0])
    c.drawPath(sp, skia.Paint(AntiAlias=True, Shader=sh))
    c.save(); c.clipPath(sp, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-200, HOR - 4, 1300, HOR + 26), P(mix(pl['sky2'], (255, 255, 255), 0.3), 150, MaskFilter=blur(9)))     # haze where the sea meets the sky
    wp = skia.Path(); wp2 = skia.Path()
    for (u, yf, k, ph) in WAVES:                              # swell lines, closer together toward the horizon, sliding in
        yy = HOR + 8 + (y_w - HOR - 30) * ((yf + 0.02 * t * k + 0.0) % 1.0) ** 1.7
        dp = (yy - HOR) / 480.0; ln = (24 + 150 * dp) * k; x = ((u * 1500 + 9 * t * k + 60 * math.sin(ph)) % 1500) - 210
        (wp if k > 0.75 else wp2).moveTo(x - ln / 2, yy); (wp if k > 0.75 else wp2).quadTo(x, yy - 2 - 6 * dp, x + ln / 2, yy)
    c.drawPath(wp, SP(mix(pl['sea_far'], (255, 255, 255), 0.4), 2.6, 95)); c.drawPath(wp2, SP(mix(pl['sea_mid'], (10, 40, 70), 0.35), 2.6, 80))
    sx, sy = sun_pos(L)                                       # the sun's path on the water
    c.drawOval(skia.Rect(sx - 110, HOR - 10, sx + 110, y_w + 40), P(pl['glit'], 46 + 34 * L, MaskFilter=blur(46)))
    for (dx, yf, ph, k) in GLIT:
        if math.sin(t * 5.2 * k + ph) < 0.15: continue
        yy = HOR + 5 + (y_w - HOR - 26) * yf ** 1.5; dp = (yy - HOR) / 480.0
        xx = sx + dx * (24 + 200 * dp); w_ = (5 + 22 * dp) * k
        c.drawOval(skia.Rect(xx - w_, yy - 1.4 - 2.2 * dp, xx + w_, yy + 1.4 + 2.2 * dp), skia.Paint(AntiAlias=True, Color=C(pl['glit'], 215), BlendMode=PLUS))
    c.restore()
    # the edge: foam on the front, an older foam line behind it
    fp = skia.Path(); fp.moveTo(*ed[0]); f2 = skia.Path(); f2.moveTo(ed[0][0], ed[0][1] - 16)
    for i, (x, y) in enumerate(ed[1:]):
        fp.lineTo(x, y); f2.lineTo(x, y - 15 - 7 * math.sin(0.03 * x + t * 0.8))
    c.drawPath(f2, SP(pl['foam'], 3, 80)); c.drawPath(fp, SP(pl['foam'], 9, 90, MaskFilter=blur(3))); c.drawPath(fp, SP(pl['foam'], 4.4, 240))
    for i in range(0, len(ed) - 1, 2):                        # scalloped lace on the foam
        x, y = ed[i]; c.drawCircle(x + 8 * math.sin(t + i), y - 5, 3.2 + 1.4 * math.sin(i * 1.7 + t * 2), P(pl['foam'], 150))
    # far away: a headland and a small sail
    hd = smooth_closed([(700, HOR + 1), (790, HOR - 16), (900, HOR - 24), (1040, HOR - 12), (1320, HOR - 20), (1320, HOR + 1)])
    c.drawPath(hd, P(mix(pl['sky2'], (90, 110, 140), 0.45)))
    bx = ((560 + W * 0.12) % 1500) - 200
    sl = skia.Path(); sl.addPoly([skia.Point(bx, HOR - 2), skia.Point(bx, HOR - 30), skia.Point(bx + 15, HOR - 4)], True); c.drawPath(sl, P((255, 250, 240), 235)); c.drawLine(bx - 8, HOR - 1, bx + 16, HOR - 1, SP((60, 60, 90), 3))


def pole(c, t, tau, L, pl, hot=0.0):
    """the tide pole: twelve bands from low water to high water. The water stands on it at exactly h(tau) of its height"""
    y_l = GY0 - GH * h_of(tau); x = POLE_X; top = GY0 - GH
    c.drawRect(skia.Rect(x - 8, y_l, x + 8, GY0 + 46), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, y_l), skia.Point(0, GY0 + 46)], [C((214, 240, 236), 120), C((214, 240, 236), 0)])))   # the part under water
    c.save(); c.clipRect(skia.Rect(x - 40, top - 60, x + 40, y_l))
    if hot: c.drawRect(skia.Rect(x - 16, top - 8, x + 16, GY0), P((255, 240, 180), 150 * hot, MaskFilter=blur(9)))
    for i in range(12):
        ya = GY0 - (i + 1) * GH / 12; yb = GY0 - i * GH / 12
        c.drawRect(skia.Rect(x - 10, ya, x + 10, yb), P((226, 66, 58) if i % 2 == 0 else (248, 244, 234)))
    c.drawRect(skia.Rect(x + 3, top, x + 10, GY0), P((50, 30, 70), 70)); c.drawRect(skia.Rect(x - 10, top, x - 6, GY0), P((255, 255, 255), 90))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 13, top - 14, x + 13, top + 2), 5, 5), P((44, 40, 60))); c.drawCircle(x, top - 22, 9, P((255, 214, 90))); c.drawCircle(x - 3, top - 25, 3, P((255, 255, 255), 200))
    c.restore()
    for k in (0, 1):                                          # the ring where the water meets the pole
        u = ((t * 0.7 + k * 0.5) % 1.0)
        c.drawOval(skia.Rect(x - 14 - 16 * u, y_l - 3 - 4 * u, x + 14 + 16 * u, y_l + 3 + 4 * u), SP(pl['foam'], 2.4, 220 * (1 - u)))
    c.drawOval(skia.Rect(x - 13, y_l - 3, x + 13, y_l + 3), SP(pl['foam'], 2.6, 240))


def stick(c, t, tau, pl):
    """the stick he pushed in at the water's edge an hour ago (the low water line)"""
    x, y = STICK_X, Y0 + 2; cov = min(30.0, max(0.0, (yw(tau) - Y0) * 0.085))
    c.save(); c.clipRect(skia.Rect(x - 60, y - 200, x + 120, y - cov + 1))
    c.drawLine(x, y, x + 5, y - 56, SP((112, 78, 60), 6.5)); c.drawLine(x - 1.5, y - 2, x + 3.5, y - 54, SP((176, 132, 96), 2))
    fl = 5 * math.sin(t * 5); rag = smooth_closed([(x + 5, y - 56), (x + 30, y - 52 + fl), (x + 44, y - 42 - fl * 0.6), (x + 26, y - 38 + fl * 0.5), (x + 6, y - 40)])
    c.drawPath(rag, P((236, 70, 66))); c.drawPath(smooth_closed([(x + 6, y - 46), (x + 28, y - 44 + fl * 0.6), (x + 26, y - 38 + fl * 0.5), (x + 6, y - 40)]), P((170, 40, 60)))
    c.restore(); x += cov * 0.09; y -= cov
    if yw(tau) > y + 3:
        for k in (0, 1):
            u = ((t * 0.8 + k * 0.5) % 1.0); c.drawOval(skia.Rect(x - 9 - 12 * u, y - 2.4 - 3 * u, x + 9 + 12 * u, y + 2.4 + 3 * u), SP(pl['foam'], 2, 210 * (1 - u)))


def shadow_xf(L):
    """how the low sun throws shadows on the flat: (sideways per unit of height, length per unit of height). They swing and grow as the sun sinks"""
    return lerp(0.55, -0.42, L), lerp(0.5, 1.25, L)


def cast(c, base, L, pl, draw_fn, a=0.42):
    shx, shy = shadow_xf(L)
    pt = skia.Paint(ColorFilter=skia.ColorFilters.Blend(C(pl['shadow']), skia.BlendMode.kSrcIn), Alphaf=a, ImageFilter=skia.ImageFilters.Blur(2.5, 2.5))
    c.saveLayer(None, pt); c.translate(*base); c.concat(skia.Matrix.MakeAll(1, -shx, 0, 0, -shy, 0, 0, 0, 1)); draw_fn(c); c.restore()


def man_props(c, t, tau, pl, held=0.0):
    mx, my = MAN_AT; y_w = yw(tau)
    bx, by = mx + 44, my + 6                                   # rod rest spike, rod, line and float
    cr = cover(by, y_w); c.save(); c.clipRect(skia.Rect(bx - 200, by - 400, bx + 200, by + 20 if cr <= 0 else by - cr))
    c.drawLine(bx, by, bx + 2, by - 34, SP((120, 126, 140), 5)); c.drawLine(bx - 7, by - 34, bx + 9, by - 34, SP((120, 126, 140), 4))
    tip = (bx + 24, by - 196 + 2 * math.sin(t * 1.6) * (1 - held))
    rod = skia.Path(); rod.moveTo(bx - 3, by - 8); rod.quadTo(bx + 8, by - 110, *tip); c.drawPath(rod, SP((40, 36, 50), 3.4)); c.drawCircle(bx + 1, by - 44, 6.5, P((60, 60, 76))); c.drawCircle(bx + 1, by - 44, 3, P((210, 214, 226)))
    c.restore()
    if cr > 0: rings(c, t, pl, by - cr, ((bx, 5),))
    fx, fy = bx + 52, min(Y0 + 10, yw(tau) - 14) + 1.6 * math.sin(t * 2.2)
    ln = skia.Path(); ln.moveTo(*tip); ln.quadTo(tip[0] + 26, (tip[1] + fy) / 2 + 20, fx, fy); c.drawPath(ln, SP((255, 255, 255), 1.3, 170))
    c.drawOval(skia.Rect(fx - 9, fy - 2, fx + 9, fy + 4), SP(pl['foam'], 1.6, 170)); c.drawCircle(fx, fy - 2, 4, P((240, 60, 60))); c.drawCircle(fx, fy - 5, 2.4, P((255, 255, 255)))
    kx, ky = mx + 30, my + 24                                  # his bucket
    cb = cover(ky + 2, y_w, cmax=20); c.save(); c.clipRect(skia.Rect(kx - 60, ky - 80, kx + 60, ky + 20 if cb <= 0 else ky + 2 - cb))
    c.drawOval(skia.Rect(kx - 22, ky - 4, kx + 24, ky + 8), P(pl['shadow'], 110, MaskFilter=blur(3)))
    bk = skia.Path(); bk.addPoly([skia.Point(kx - 15, ky - 30), skia.Point(kx + 15, ky - 30), skia.Point(kx + 12, ky + 2), skia.Point(kx - 12, ky + 2)], True)
    c.drawPath(bk, P((70, 130, 200))); c.drawRect(skia.Rect(kx + 3, ky - 30, kx + 15, ky + 2), P((40, 84, 150), 150)); c.drawOval(skia.Rect(kx - 15, ky - 34, kx + 15, ky - 26), P((30, 60, 110))); c.drawOval(skia.Rect(kx - 15, ky - 34, kx + 15, ky - 26), SP((150, 196, 240), 2))
    c.drawArc(skia.Rect(kx - 15, ky - 50, kx + 15, ky - 16), 180, 180, False, SP((220, 224, 234), 2)); c.restore()
    if cb > 0: rings(c, t, pl, ky + 2 - cb, ((kx, 15),))


def cover(base, y_w, k=0.09, cmax=32.0):
    """how far up the water stands on something the edge has passed (deeper the further the edge has gone by)"""
    d_ = y_w - base
    return 0.0 if d_ <= 0 else min(cmax, 3 + d_ * k)


def rings(c, t, pl, y, items):
    for (rx, rw) in items:
        for j in (0, 1):
            u = ((t * 0.7 + j * 0.5 + rx * 0.013) % 1.0)
            c.drawOval(skia.Rect(rx - rw - 12 * u, y - 2.5 - 3 * u, rx + rw + 12 * u, y + 2.5 + 3 * u), SP(pl['foam'], 2, 220 * (1 - u)))


def flat(c, t, tau, ps=None, W=None, calm=0.0, hot_pole=0.0, car_on=True, surge=0.0, back=False, held=0.0):
    """the whole wide view. ps = the man's pose (None leaves him out of this view)"""
    L = light_of(tau); pl = pal(L); W = t * 8 + tau * 420 if W is None else W
    y_w = yw(tau)
    sky(c, t, L, W, pl); sand(c, t, tau, L, pl); sea(c, t, tau, L, pl, W, calm, surge)
    pole(c, t, tau, L, pl, hot_pole); stick(c, t, tau, pl)
    for i in range(3):                                        # gulls wheeling over the water
        gx = 330 + 250 * i + 150 * math.sin(t * 0.33 + i * 2.1 + W * 0.004); gy = 610 + 70 * i + 40 * math.sin(t * 0.5 + i) ; s_ = 0.55 + 0.2 * i
        gull(c, gx, gy, s_, math.sin(t * (5.5 + i) + i))
        c.drawOval(skia.Rect(gx - 12 * s_, gy + 130 - 2, gx + 12 * s_, gy + 130 + 2), P((10, 40, 60), 40))
    for (u, y, w, hh) in CSH:                                  # cloud shadows drifting over the flat
        x = ((u * 1900 + W * 0.9) % 1900) - 400
        c.drawOval(skia.Rect(x - w, y - hh, x + w, y + hh), P(pl['shadow'], 30, MaskFilter=blur(60)))
    cx, cy = CAR_AT
    kw = dict(dusk=L, sky=pl['glass'])
    wetk = smooth((y_w - (cy - 22)) / 24.0)                   # how far the water has come under the car
    if car_on:
        if wetk < 1: cast(c, (cx, cy), L, pl, lambda cc: CAR.car(cc, 0, 0, 1.0, **kw), a=0.44 * (1 - 0.6 * wetk))
        if wetk > 0:                                          # the car mirrored in the thin water under it
            c.saveLayer(None, skia.Paint(Alphaf=0.3 * wetk)); c.clipRect(skia.Rect(-200, cy - 4, 1300, y_w + 6)); c.translate(cx, cy - 2); c.scale(1, -0.8); CAR.car(c, 0, 0, 1.0, **kw); c.restore()
        CAR.car(c, cx, cy, 1.0, **kw)
        if wetk > 0:
            for wx in CAR.WHEELS:                             # the water round each tyre
                dpt = 10 * wetk
                c.save(); c.clipRect(skia.Rect(cx + wx - 60, cy - dpt, cx + wx + 60, cy + 12)); c.drawCircle(cx + wx, cy - 46, 47, P(pl['sea_near'], 215)); c.restore()
                for k in (0, 1, 2):
                    u = ((t * 0.6 + k / 3) % 1.0)
                    c.drawOval(skia.Rect(cx + wx - 44 - 34 * u, cy - dpt - 5 - 5 * u, cx + wx + 44 + 34 * u, cy - dpt + 5 + 7 * u), SP(pl['foam'], 2.6, 230 * (1 - u) * wetk))
    if ps is not None:
        mx, my = MAN_AT
        inw = smooth((y_w - my) / 30.0)
        if inw < 1: cast(c, (mx, my), L, pl, lambda cc: M.draw(cc, ps, 0, 0, MAN_S, back=back), a=0.42 * (1 - inw))
        man_props(c, t, tau, pl, held)
        cv = cover(my + 2, y_w)                                # the water round his boots once the edge has passed him: the sea hides what is under it
        c.save(); c.clipRect(skia.Rect(mx - 300, my - 600, mx + 300, my + 40 if cv <= 0 else my + 2 - cv)); M.draw(c, ps, mx, my, MAN_S, back=back); c.restore()
        if cv > 0: rings(c, t, pl, my + 2 - cv, ((mx - 12, 11), (mx + 12, 11)))
    c.drawRect(skia.Rect(-200, -200, 1300, 2100), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 300), skia.Point(0, 1900)], [C((255, 150, 90), 34 * L), C((90, 50, 120), 46 * L)])))


if __name__ == '__main__':
    for nm, tau, pz in (('a', 1.0, M.pose(head_yaw=0.5, look=(0.7, 0.3), smile=0.4)), ('b', 2.6, None), ('c', 4.05, None)):
        s = skia.Surface(1080, 1920); c = s.getCanvas(); flat(c, 1.0, tau, pz)
        s.makeImageSnapshot().save(f'out/test/flat_{nm}.png', skia.kPNG)
