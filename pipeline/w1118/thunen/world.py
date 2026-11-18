"""Ground level scenes: a summer morning on a farm road in Mecklenburg, green and gold fields, a small city with two church spires on
the horizon. Code drawn in the house flat layered style (flat fills, one shade, a warm rim from the low sun on the left, haze with distance)."""
import math, functools
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from art import shaded, diffp, op

W, H = 1080, 1920
HY = 880                                                  # horizon
CITY_X = 770
_R = np.random.default_rng(5)
CLOUDS = [(_R.uniform(-200, 1280), _R.uniform(120, 640), _R.uniform(160, 320), _R.uniform(40, 80), _R.uniform(0.4, 1.0)) for _ in range(9)]
MOTES = [(_R.uniform(0, 1080), _R.uniform(300, 1500), _R.uniform(1.5, 4.0), _R.uniform(0, 6.28), _R.uniform(0.3, 1.0)) for _ in range(60)]
TUFTS = [(_R.uniform(-60, 1140), _R.uniform(1180, 1960), _R.uniform(0.6, 1.4), _R.uniform(0, 6.28)) for _ in range(150)]
FLOWERS = [(_R.uniform(0, 1080), _R.uniform(1260, 1900), [(255, 255, 255), (250, 220, 90), (190, 150, 230)][_R.integers(3)]) for _ in range(46)]
BIRDS = [(_R.uniform(0, 1), _R.uniform(380, 640), _R.uniform(0.7, 1.2), _R.uniform(0, 6.28)) for _ in range(4)]


class View:
    """2D camera with parallax: the world point `cen` sits at the screen centre, zoomed by z; a layer with depth factor k moves less"""
    def __init__(self, z=1.0, cen=(540.0, 960.0)): self.z, self.cen = z, cen

    def apply(self, c, k=1.0):
        z = 1 + (self.z - 1) * k; cx = 540 + (self.cen[0] - 540) * k; cy = 960 + (self.cen[1] - 960) * k
        c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)


def sky(c, t, sun=(170, 560), warm=0.0):
    c.drawRect(skia.Rect(-400, -400, 1480, HY + 60), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, -200), skia.Point(0, HY + 40)],
               [C(mix((120, 176, 226), (150, 190, 230), warm)), C((176, 210, 236)), C(mix((250, 232, 196), (255, 214, 150), warm))], [0, 0.55, 1.0])))
    c.drawCircle(sun[0], sun[1], 420, P((255, 236, 180), 110, MaskFilter=blur(140)))
    c.drawCircle(sun[0], sun[1], 70, P((255, 248, 220), 240, MaskFilter=blur(10)))
    c.drawCircle(sun[0], sun[1], 160, P((255, 240, 200), 120, MaskFilter=blur(40)))
    for (x, y, w, h, k) in CLOUDS:
        xx = (x + t * 7 * k + 300) % 1700 - 300
        c.drawOval(skia.Rect(xx - w, y - h, xx + w, y + h), P((255, 250, 240), 150 * k, MaskFilter=blur(20)))
        c.drawOval(skia.Rect(xx - w * 0.6, y - h * 1.5, xx + w * 0.5, y + h * 0.4), P((255, 252, 246), 140 * k, MaskFilter=blur(16)))
    for (u, y, k, ph) in BIRDS:                                # larks high over the fields, wings beating
        x = ((u * 1400 + t * 30 * k) % 1400) - 160; yy = y + 12 * math.sin(t * 0.8 + ph)
        f = math.sin(t * 14 * k + ph) * 6
        p = skia.Path(); p.moveTo(x - 9, yy - f); p.quadTo(x - 4, yy - 2, x, yy); p.quadTo(x + 4, yy - 2, x + 9, yy - f); c.drawPath(p, SP((70, 70, 90), 2.2, 200))


def city(c, x0=CITY_X, base=HY + 4, s=1.0, haze=0.55):
    col = mix((120, 120, 150), (220, 214, 214), haze); col2 = mix(col, (90, 90, 120), 0.25); roof = mix((150, 90, 90), (220, 210, 210), haze)
    rs = np.random.default_rng(8)
    for i in range(16):                                      # roofs, gables and chimneys
        hx = x0 + (i - 8) * 15 * s + rs.uniform(-4, 4) * s; hw = rs.uniform(14, 24) * s; hh = rs.uniform(14, 26) * s
        c.drawRect(skia.Rect(hx - hw / 2, base - hh, hx + hw / 2, base), P(col))
        p = skia.Path(); p.addPoly([skia.Point(hx - hw / 2 - 2 * s, base - hh), skia.Point(hx, base - hh - hw * 0.5), skia.Point(hx + hw / 2 + 2 * s, base - hh)], True); c.drawPath(p, P(roof))
    for (dx, h) in ((-34, 110), (52, 84)):                   # two church towers with spires
        tx = x0 + dx * s
        c.drawRect(skia.Rect(tx - 9 * s, base - h * 0.55 * s, tx + 9 * s, base), P(col2))
        p = skia.Path(); p.addPoly([skia.Point(tx - 11 * s, base - h * 0.55 * s), skia.Point(tx, base - h * s), skia.Point(tx + 11 * s, base - h * 0.55 * s)], True); c.drawPath(p, P(mix((90, 130, 130), (220, 214, 214), haze)))
        c.drawRect(skia.Rect(tx - 3 * s, base - h * 0.45 * s, tx + 3 * s, base - h * 0.38 * s), P(mix(col2, (40, 40, 60), 0.4)))
    c.drawRect(skia.Rect(x0 - 160 * s, base - 4, x0 + 160 * s, base + 4), P(col))


def far_land(c, t):
    c.drawRect(skia.Rect(-400, HY - 30, 1480, HY + 40), P((176, 196, 200), 120, MaskFilter=blur(12)))
    pts = [(-400, HY + 30)] + [(x, HY - 18 - 22 * math.sin(x * 0.004 + 1.3) - 10 * math.sin(x * 0.013)) for x in range(-400, 1481, 60)] + [(1480, HY + 30)]
    p = skia.Path(); p.addPoly([skia.Point(*q) for q in pts], True); c.drawPath(p, P((150, 176, 170)))
    city(c)
    rows = [(HY + 4, (170, 184, 120)), (HY + 14, (196, 190, 116)), (HY + 28, (150, 176, 100)), (HY + 46, (214, 196, 110)), (HY + 70, (136, 168, 92)),
            (HY + 100, (206, 186, 100)), (HY + 140, (128, 164, 88)), (HY + 190, (196, 176, 92))]
    for i, (y, col) in enumerate(rows):
        pts = [(-400, 1300)] + [(x, y + 6 * math.sin(x * 0.006 + i * 1.7)) for x in range(-400, 1481, 60)] + [(1480, 1300)]
        p = skia.Path(); p.addPoly([skia.Point(*q) for q in pts], True); c.drawPath(p, P(mix(col, (214, 222, 214), max(0.0, 0.5 - i * 0.07))))
        c.drawPath(p, SP(mix((70, 100, 60), (190, 200, 190), max(0.0, 0.5 - i * 0.07)), 2.5, 160))          # hedgerow along the field edge
    rs = np.random.default_rng(9)
    for i in range(26):                                       # trees along the hedges, swaying a little
        y = HY + rs.uniform(10, 200); x = rs.uniform(-100, 1180); k = (y - HY) / 200; r = 6 + 22 * k
        hz = max(0.0, 0.5 - k * 0.5); sw = 1.5 * k * math.sin(t * 1.3 + i)
        c.drawRect(skia.Rect(x - r * 0.12, y - r * 0.6, x + r * 0.12, y), P(mix((90, 70, 60), (200, 200, 200), hz)))
        c.drawCircle(x + sw, y - r * 1.1, r, P(mix((76, 112, 66), (200, 210, 200), hz))); c.drawCircle(x - r * 0.3 + sw, y - r * 1.35, r * 0.55, P(mix((120, 156, 84), (220, 226, 210), hz)))


def pasture(c, t, y0=1080):
    p = skia.Path(); p.addPoly([skia.Point(-400, y0), skia.Point(1480, y0 - 40), skia.Point(1480, 2200), skia.Point(-400, 2200)], True)
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, y0), skia.Point(0, 1500)], [C((150, 186, 98)), C((118, 160, 78))])))


def fence(c, x0, x1, y0, y1, h=70, col=(140, 106, 76)):
    n = int(abs(x1 - x0) / 110) + 1
    for i in range(n + 1):
        u = i / n; x = lerp(x0, x1, u); y = lerp(y0, y1, u)
        c.drawRect(skia.Rect(x - 5, y - h, x + 5, y), P(col)); c.drawRect(skia.Rect(x - 5, y - h, x - 1, y), P(mix(col, (255, 230, 190), 0.3)))
    for k in (0.3, 0.7):
        c.drawLine(x0, y0 - h * k, x1, y1 - h * k, SP(col, 6)); c.drawLine(x0, y0 - h * k - 2, x1, y1 - h * k - 2, SP(mix(col, (255, 230, 190), 0.3), 2))


def road(c, t):
    """the farm road running to the city, with a ditch on its near side"""
    vx = CITY_X
    rd = skia.Path(); rd.addPoly([skia.Point(vx - 6, HY + 6), skia.Point(vx + 14, HY + 6), skia.Point(1480, 1920), skia.Point(900, 1920)], True)
    c.drawPath(rd, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, HY), skia.Point(0, 1920)], [C((214, 200, 170)), C((196, 168, 126))])))
    for k in (0.33, 0.7):                                     # wheel ruts
        p = skia.Path(); p.moveTo(vx + 4, HY + 8); p.lineTo(lerp(900, 1480, k), 1920); c.drawPath(p, SP((160, 132, 100), 7, 140))
    dt = skia.Path(); dt.addPoly([skia.Point(vx - 10, HY + 6), skia.Point(vx - 4, HY + 6), skia.Point(920, 1920), skia.Point(820, 1920)], True)
    c.drawPath(dt, P((92, 110, 70)))                          # the ditch: damp, darker, reeds along it
    c.save(); c.clipPath(dt, skia.ClipOp.kIntersect, True)
    c.drawPath(dt, P((70, 96, 84), 180)); c.restore()
    for i in range(30):
        u = i / 29; y = lerp(HY + 20, 1900, u ** 1.6); x = lerp(vx - 8, 840, (y - HY) / (1920 - HY)); k = (y - HY) / 1040
        for d_ in (-1, 0, 1):
            c.drawLine(x + d_ * 6 * k, y, x + d_ * 10 * k + 3 * k * math.sin(t * 2 + i), y - 34 * k, SP((86, 124, 70), 2 + 2 * k, 220))


def ditch_x(y): return lerp(CITY_X - 7, 870, (y - HY) / (1920 - HY))


def verge(c, t, y0=1240, sway=1.0):
    p = skia.Path(); p.addPoly([skia.Point(-400, y0 + 30), skia.Point(ditch_x(y0) - 30, y0), skia.Point(ditch_x(2100) - 40, 2100), skia.Point(-400, 2100)], True)
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, y0), skia.Point(0, 1900)], [C((148, 182, 92)), C((112, 152, 70))])))


def tufts(c, t, ymin=1180, xmax=None, fg=False):
    for (x, y, k, ph) in TUFTS:
        if y < ymin or (xmax and x > xmax(y)): continue
        kk = k * (0.5 + (y - 1100) / 900)
        sw = 5 * kk * math.sin(t * 1.6 + ph + x * 0.004)
        for d_ in (-12, -4, 4, 12):
            c.drawLine(x + d_ * kk * 0.4, y, x + d_ * kk + sw, y - 34 * kk, SP(mix((90, 132, 64), (176, 206, 110), 0.5 + 0.4 * math.sin(ph + d_)), 3.4 * kk, 230))
    for (x, y, col) in FLOWERS:
        if y < ymin or (xmax and x > xmax(y)): continue
        kk = 0.6 + (y - 1200) / 900; sw = 4 * kk * math.sin(t * 1.6 + x)
        c.drawLine(x, y, x + sw, y - 26 * kk, SP((90, 130, 66), 2 * kk)); c.drawCircle(x + sw, y - 28 * kk, 5 * kk, P(col)); c.drawCircle(x + sw, y - 28 * kk, 2 * kk, P((240, 190, 60)))


def motes(c, t, a=1.0):
    for (x, y, r, ph, k) in MOTES:
        xx = x + 20 * math.sin(t * 0.3 * k + ph); yy = y - (t * 8 * k) % 120 + 40 * math.sin(t * 0.2 + ph)
        c.drawCircle(xx, yy, r, P((255, 246, 210), 120 * k * a * (0.6 + 0.4 * math.sin(t * 2 + ph)), MaskFilter=blur(1.5)))


def cart(c, x, y, s=1.0, load='churns'):
    """a wooden farm cart seen from behind, unhitched: its shafts rest on the road ahead of it (no horse); three churns stand in the bed"""
    c.save(); c.translate(x, y); c.scale(s, s)
    WOOD, WSH, WHI = (150, 104, 70), (104, 70, 52), (196, 150, 104)
    c.drawOval(skia.Rect(-130, -14, 130, 14), P((40, 40, 20), 90, MaskFilter=blur(8)))
    for sd in (-1, 1):                                       # the shafts run forward to the road, resting on it
        p = skia.Path(); p.moveTo(sd * 46, -96); p.lineTo(sd * 22, -40); c.drawPath(p, SP(WSH, 7))
    if load == 'churns':
      for k, (cx_, cy_) in enumerate(((-24, -150), (8, -156), (34, -148))):  # churns standing in the bed
        b = skia.Path(); b.addRoundRect(skia.Rect(cx_ - 16, cy_ - 44, cx_ + 16, cy_ + 14), 6, 6); c.drawPath(b, P((180, 188, 198))); c.drawRect(skia.Rect(cx_ + 4, cy_ - 44, cx_ + 16, cy_ + 14), P((130, 140, 158)))
        c.drawOval(skia.Rect(cx_ - 10, cy_ - 52, cx_ + 10, cy_ - 42), P((150, 160, 176)))
    else:                                                    # a full load of grain sacks, tied at the neck
      for k, (cx_, cy_) in enumerate(((-60, -150), (-10, -156), (40, -150), (-34, -196), (18, -200), (-8, -236))):
        sk = smooth_closed([(cx_ - 28, cy_ + 10), (cx_ - 30, cy_ - 30), (cx_ - 12, cy_ - 46), (cx_ + 12, cy_ - 46), (cx_ + 30, cy_ - 30), (cx_ + 28, cy_ + 10)])
        c.drawPath(sk, P((214, 190, 140))); c.drawPath(diffp(sk, (-6, -4)), P((176, 150, 106))); c.drawLine(cx_ - 8, cy_ - 42, cx_ + 8, cy_ - 42, SP((120, 96, 70), 3))
    bed = smooth_closed([(-96, -150), (96, -150), (100, -82), (-100, -82)])
    c.drawRect(skia.Rect(-100, -150, 100, -82), P(WOOD)); c.drawRect(skia.Rect(-100, -150, 100, -140), P(WHI))
    for k in range(4): c.drawLine(-100, -128 + k * 14, 100, -128 + k * 14, SP(WSH, 2.4, 200))
    c.drawRect(skia.Rect(30, -150, 100, -82), P(WSH, 90))
    for sd in (-1, 1):                                       # two big spoked wheels
        cx_ = sd * 112; c.drawOval(skia.Rect(cx_ - 22, -140, cx_ + 22, 0), P(WSH)); c.drawOval(skia.Rect(cx_ - 14, -132, cx_ + 14, -8), P(mix(WSH, (60, 50, 60), 0.4)))
        c.drawOval(skia.Rect(cx_ - 22, -140, cx_ + 22, 0), SP(WHI if sd < 0 else WSH, 4))
        for a in range(0, 360, 45): c.drawLine(cx_, -70, cx_ + 12 * math.cos(math.radians(a)), -70 + 62 * math.sin(math.radians(a)), SP(WOOD, 3))
    c.drawRect(skia.Rect(-112, -76, 112, -64), P(WSH))      # the axle
    c.restore()


def stream(c, mouth, a, flow, t, scale=1.0, ground=1400.0):
    """the soured milk leaving the churn's mouth as one liquid stream: a parabola from the mouth (initial speed along the churn's axis,
    then gravity), thick and lumpy with curds, ending in a splash and a spreading pool"""
    if flow <= 0.01: return None
    v0 = 300.0 * scale; g = 1900.0 * scale
    pts = []; tt = 0.0
    while True:
        x = mouth[0] + a[0] * v0 * tt; y = mouth[1] + a[1] * v0 * tt + 0.5 * g * tt * tt
        pts.append((x, y))
        if y >= ground or tt > 2: break
        tt += 0.01
    n = len(pts); left = []; right = []
    for i, (x, y) in enumerate(pts):
        u = i / max(1, n - 1)
        if i < n - 1: dx, dy = pts[i + 1][0] - x, pts[i + 1][1] - y
        L = math.hypot(dx, dy) or 1; nx, ny = -dy / L, dx / L
        w = (24 - 10 * u) * scale * (0.35 + 0.65 * flow) * (1 + 0.12 * math.sin(t * 23 - i * 0.7)); wob = 3 * scale * math.sin(t * 11 - i * 0.45) * u
        left.append((x + nx * (w / 2 + wob), y + ny * (w / 2 + wob))); right.append((x - nx * (w / 2 - wob), y - ny * (w / 2 - wob)))
    p = smooth_closed(left + right[::-1])
    c.drawPath(p, P((226, 220, 186)))
    c.save(); c.clipPath(p, skia.ClipOp.kIntersect, True)
    q = skia.Path(); q.moveTo(*left[0])
    for pt in left[1:]: q.lineTo(*pt)
    c.drawPath(q, SP((255, 252, 236), 6 * scale, 220))
    c.restore()
    for i in range(7):                                       # curds riding down the stream
        u = ((t * 1.3 + i / 7.0) % 1.0); k = int(u * (n - 1)); x, y = pts[k]
        r = (7 + 3 * (i % 3)) * scale * (0.5 + 0.5 * flow)
        c.drawOval(skia.Rect(x - r, y - r * 0.8, x + r, y + r * 0.8), P((214, 206, 166))); c.drawCircle(x - r * 0.3, y - r * 0.3, r * 0.4, P((250, 246, 226)))
    return pts[-1]


def splash(c, at, t, flow, scale=1.0):
    x, y = at
    for i in range(16):                                      # the milk hits the ditch and splashes out in droplets and lumps
        u = ((t * 2.4 + i / 16) % 1.0); ang = math.radians(-170 + i * 22 + 10 * math.sin(i)); v = (150 + 40 * (i % 3)) * scale
        px = x + math.cos(ang) * v * u; py = y - abs(math.sin(ang)) * v * u * 1.5 + 420 * scale * u * u
        r = (7 + 3 * (i % 2)) * scale * (1 - u) * flow + 0.5
        c.drawOval(skia.Rect(px - r, py - r * 0.85, px + r, py + r * 0.85), P((240, 236, 210), 240 * (1 - u)))
    c.drawOval(skia.Rect(x - 40 * scale, y - 14 * scale, x + 40 * scale, y + 8 * scale), P((246, 242, 222), 235 * flow))
    for k in range(5):                                       # curds sitting in the splash
        c.drawCircle(x - 28 * scale + k * 14 * scale, y - 4 * scale + 3 * math.sin(k + t * 3), 5 * scale, P((222, 214, 172), 230 * flow))


def pool(c, at, size, scale=1.0):
    if size <= 0.01: return
    x, y = at; r = 70 * scale * size
    pth = smooth_closed([(x - r, y), (x - r * 0.6, y - r * 0.22), (x + r * 0.1, y - r * 0.26), (x + r * 0.9, y - r * 0.12), (x + r * 1.1, y + r * 0.08), (x + r * 0.4, y + r * 0.24), (x - r * 0.5, y + r * 0.2)])
    c.drawPath(pth, P((214, 210, 176), 235)); c.drawPath(diffp(pth, (0, 4 * scale)), P((248, 246, 226), 200))


def wheatfield(c, t, y0):
    """the old pasture, now a golden wheat field swaying"""
    p = skia.Path(); p.addPoly([skia.Point(-400, y0 + 6), skia.Point(ditch_x(y0) - 10, y0 - 10), skia.Point(ditch_x(1400) - 40, 1400), skia.Point(-400, 1400)], True)
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, y0), skia.Point(0, 1400)], [C((236, 198, 104)), C((214, 170, 80))])))
    c.save(); c.clipPath(p, skia.ClipOp.kIntersect, True)
    rs = np.random.default_rng(12)
    for _ in range(420):
        x = rs.uniform(-60, 1000); y = rs.uniform(y0, 1400); k = 0.4 + (y - y0) / 400; sw = 3 * k * math.sin(t * 1.4 + x * 0.02)
        c.drawLine(x, y, x + sw, y - 26 * k, SP((246, 214, 120), 2.2 * k, 220)); c.drawOval(skia.Rect(x + sw - 2.5 * k, y - 32 * k, x + sw + 2.5 * k, y - 22 * k), P((252, 226, 140)))
    c.restore()
