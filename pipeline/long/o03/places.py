"""The three places of yt-stats-01, built in code from the Gemini references ref/pool.png and ref/rooms.png (layout,
palette and light only; nothing traced): the town pool at six in a heat wave (and again at dusk with its lights on),
the council chamber in the evening, and Lena's desk at night. Every place has its own scene life."""
import math
import numpy as np
import skia
from kit import C, P, SP, sm, W, H, blur, text, width, CREAM, AMBER
import cast as CA


def mixc(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def rr(x0, y0, x1, y1, r):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def lgrad(c, rect, c0, c1, vertical=True, a=255):
    x0, y0, x1, y1 = rect
    pts = [skia.Point(x0, y0), skia.Point(x0, y1) if vertical else skia.Point(x1, y0)]
    c.drawRect(skia.Rect(x0, y0, x1, y1), skia.Paint(Shader=skia.GradientShader.MakeLinear(pts, [C(c0, a), C(c1, a)]), AntiAlias=True))


def poly(pts):
    p = skia.Path(); p.addPoly([skia.Point(*q) for q in pts], True); return p


def glow(c, x, y, r, col, a=1.0):
    if a > 0.01:
        c.drawCircle(x, y, r, P(col, 255 * min(1, a), MaskFilter=blur(r * 0.45), BlendMode=skia.BlendMode.kScreen))


def camera(c, z, fx, fy, ox=W / 2, oy=H / 2):
    """zoom z about scene point (fx, fy), which lands at (ox, oy)"""
    c.translate(ox, oy); c.scale(z, z); c.translate(-fx, -fy)


_GR = None


def finish(c, t, vig=0.14, warm=10, lift=0.0):
    """film finish: a gentle warm grade, a light vignette, fine moving grain (the bloom is the additive light drawn in the scene)"""
    global _GR
    if warm: c.drawRect(skia.Rect(0, 0, W, H), P((255, 200, 150), warm, BlendMode=skia.BlendMode.kSoftLight))
    if lift: c.drawRect(skia.Rect(0, 0, W, H), P((120, 130, 190), 255 * lift, BlendMode=skia.BlendMode.kScreen))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * 0.7, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((6, 8, 20), int(255 * vig * 1.6))], [0, 0.55, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    if _GR is None:
        rs = np.random.default_rng(7); _GR = []
        for k in range(6):
            a = (rs.normal(128, 40, (H // 2, W // 2))).clip(0, 255).astype(np.uint8)
            _GR.append(skia.Image.fromarray(np.ascontiguousarray(np.dstack([a, a, a, np.full_like(a, 9)])), colorType=skia.kRGBA_8888_ColorType))
    c.drawImageRect(_GR[int(t * 24) % 6], skia.Rect(0, 0, W, H), skia.SamplingOptions(), skia.Paint(BlendMode=skia.BlendMode.kOverlay))


def crown(c, x, y, r, col, rim, seed, t, sway=1.0, a=255):
    """a tree crown: overlapping circles that sway a little, a lit rim on the sun side (upper left)"""
    rs = np.random.default_rng(seed)
    pts = [(x + rs.uniform(-r, r) * 0.9, y + rs.uniform(-r, r) * 0.5, r * rs.uniform(0.45, 0.75), rs.uniform(0, 6)) for _ in range(9)]
    for px, py, pr, ph in pts:
        dx = sway * 3 * math.sin(t * 0.7 + ph)
        c.drawCircle(px + dx - pr * 0.12, py - pr * 0.12, pr, P(rim, a))
    for px, py, pr, ph in pts:
        dx = sway * 3 * math.sin(t * 0.7 + ph)
        c.drawCircle(px + dx, py, pr, P(col, a))
    for px, py, pr, ph in pts[::3]:
        dx = sway * 3 * math.sin(t * 0.7 + ph)
        c.drawCircle(px + dx + pr * 0.25, py + pr * 0.3, pr * 0.55, P(mixc(col, (30, 40, 70), 0.25), a))


# ====================================================================== the pool
POOL_FAR, POOL_NEAR = 566, 846
LENA_X, LENA_G, LENA_S = 700, 1016, 0.47


def _px(u, v):
    """a point on the water: u 0..1 across, v 0 (far edge) .. 1 (near edge)"""
    q = v ** 1.5 if v >= 0 else v
    y = POOL_FAR + (POOL_NEAR - POOL_FAR) * q
    xl = 600 + (-140 - 600) * q; xr = 1260 + (1760 - 1260) * q
    return xl + (xr - xl) * u, y


def pool(c, t, dusk=0.0, hours='6', lena=None, ball=True, prints=0.0, people=None, sign='10 AM to 6 PM', lights=None):
    """the town pool. dusk 0 = six o'clock in the heat (low golden sun), 1 = dusk with the pool lights on.
    lena: a Pose or None; prints: 0..1 wet footprints leading to the gate; people(c): swimmers drawn in the water."""
    L = dusk if lights is None else lights
    sky0 = mixc((244, 164, 118), (38, 44, 104), dusk); sky1 = mixc((254, 220, 164), (228, 130, 120), dusk)
    lgrad(c, (0, 0, W, 560), sky0, sky1)
    # the sun, low on the left, breathing a little
    sa = (1 - dusk)
    glow(c, 150, 150, 420 + 12 * math.sin(t * 0.6), (255, 236, 170), 0.5 * sa); glow(c, 150, 150, 170, (255, 250, 220), 0.9 * sa)
    if dusk > 0.3:
        rs = np.random.default_rng(3)
        for k in range(40):
            c.drawCircle(rs.uniform(0, W), rs.uniform(0, 300), rs.uniform(0.8, 2.0), P((255, 244, 220), (dusk - 0.3) * 250 * (0.5 + 0.5 * math.sin(t * 1.3 + k))))
    # clouds drifting
    for k, (cx, cy, s_) in enumerate(((520, 120, 1.0), (1180, 80, 1.3), (1640, 170, 0.9), (60, 250, 0.8))):
        x = (cx + t * (5 + k)) % (W + 500) - 250
        cc = mixc((255, 232, 196), (120, 96, 150), dusk)
        for dx, dy, r in ((-70, 8, 34), (-20, -8, 48), (40, 0, 42), (90, 10, 28)):
            c.drawOval(skia.Rect(x + (dx - r * 1.5) * s_, cy + (dy - r * 0.55) * s_, x + (dx + r * 1.5) * s_, cy + (dy + r * 0.55) * s_), P(cc, 150))
    # far hills, hazy
    for k, (yy, col) in enumerate(((430, (236, 170, 140)), (462, (214, 150, 132)))):
        col = mixc(col, (60, 60, 120), dusk * 0.85)
        p = skia.Path(); p.moveTo(0, 560)
        for x in range(0, W + 40, 40): p.lineTo(x, yy + 22 * math.sin(x * 0.004 + k * 2) + 12 * math.sin(x * 0.011 + k))
        p.lineTo(W, 560); p.close(); c.drawPath(p, P(col))
    # the tree line behind the fence
    tf, tr = mixc((142, 160, 116), (40, 60, 96), dusk), mixc((226, 204, 126), (90, 100, 150), dusk)
    for k in range(13):
        crown(c, -40 + k * 165, 450 + 14 * math.sin(k * 2.1), 78, tf, tr, 20 + k, t, 0.6)
    tn, tnr = mixc((96, 136, 96), (26, 46, 80), dusk), mixc((240, 212, 120), (80, 96, 150), dusk)
    for k, x in enumerate((60, 330, 1460, 1700, 1900)):
        c.drawRect(skia.Rect(x - 9, 470, x + 9, 560), P(mixc((110, 78, 60), (30, 30, 60), dusk)))
        crown(c, x, 400, 104, tn, tnr, 60 + k, t, 1.0)
    # the pool house
    bh, bhs = mixc((190, 96, 74), (64, 50, 90), dusk), mixc((150, 70, 62), (44, 36, 72), dusk)
    c.drawRect(skia.Rect(880, 420, 1210, 540), P(bh)); c.drawRect(skia.Rect(1060, 420, 1210, 540), P(bhs, 120))
    c.drawRect(skia.Rect(866, 408, 1224, 424), P(mixc((232, 214, 186), (90, 84, 130), dusk)))
    c.drawRect(skia.Rect(1000, 456, 1090, 540), P(mixc((96, 50, 48), (24, 20, 44), dusk)))
    for wx in (906, 1130):
        c.drawRRect(rr(wx, 450, wx + 56, 480, 4), P(mixc((120, 60, 54), (255, 220, 140), L)))
        if L > 0.2: glow(c, wx + 28, 465, 40, (255, 210, 130), 0.5 * L)
    c.drawRRect(rr(960, 366, 1130, 404, 5), P(mixc((244, 232, 206), (110, 100, 150), dusk)))
    text(c, 'TOWN POOL', 1045, 394, 25, mixc((120, 60, 54), (30, 26, 60), dusk), 1.0, 'xb', 'center')
    # light poles
    for px in (640, 1300):
        c.drawRect(skia.Rect(px - 5, 210, px + 5, 560), P(mixc((150, 140, 140), (50, 54, 90), dusk)))
        c.drawRRect(rr(px - 44, 196, px + 44, 226, 6), P(mixc((170, 160, 156), (64, 68, 104), dusk)))
        for j in range(4):
            c.drawCircle(px - 30 + j * 20, 211, 7, P(mixc((226, 220, 210), (255, 250, 220), L)))
        if L > 0.02:
            glow(c, px, 214, 150, (255, 240, 190), 0.75 * L); glow(c, px, 214, 44, (255, 255, 240), L)
            cone = poly([(px - 30, 222), (px + 30, 222), (px + 330, 880), (px - 330, 880)])
            c.drawPath(cone, P((255, 236, 180), 26 * L, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    # far fence
    fc = mixc((176, 160, 150), (60, 62, 100), dusk)
    c.drawRect(skia.Rect(0, 478, W, 482), P(fc)); c.drawRect(skia.Rect(0, 536, W, 540), P(fc))
    for x in range(0, W, 16): c.drawLine(x, 482, x + 8, 536, SP(fc, 1, 90)); c.drawLine(x + 8, 482, x, 536, SP(fc, 1, 90))
    for x in range(40, W, 150): c.drawRect(skia.Rect(x - 3, 470, x + 3, 548), P(fc))
    # the deck
    d0, d1 = mixc((240, 214, 178), (70, 70, 116), dusk), mixc((226, 190, 150), (44, 44, 84), dusk)
    lgrad(c, (0, 540, W, H), d0, d1)
    for x0, x1 in ((-300, 300), (300, 760), (1160, 1460), (1620, 2100)):
        c.drawLine(x1 * 0.45 + 528, 540, x1, H, SP(mixc((206, 174, 140), (36, 36, 70), dusk), 2, 120))
    c.drawLine(0, 905, W, 905, SP(mixc((206, 174, 140), (36, 36, 70), dusk), 2, 110))
    # the pool: coping, water, lane lines, shimmer
    cop = poly([_px(-0.03, -0.06), _px(1.03, -0.06), (1820, POOL_NEAR + 26), (-200, POOL_NEAR + 26)])
    c.drawPath(cop, P(mixc((250, 238, 214), (120, 120, 170), dusk)))
    water = poly([_px(0, 0), _px(1, 0), _px(1, 1), _px(0, 1)])
    c.save(); c.clipPath(water, skia.ClipOp.kIntersect, True)
    w0, w1 = mixc((70, 190, 190), (20, 120, 170), dusk), mixc((40, 150, 170), (16, 70, 130), dusk)
    lgrad(c, (-200, POOL_FAR, W + 200, POOL_NEAR), w0, w1)
    if L > 0.05:                                      # underwater lights
        for u in (0.18, 0.5, 0.82):
            x, y = _px(u, 0.55); glow(c, x, y, 230, (120, 255, 240), 0.5 * L)
    for k in range(1, 6):                             # lane lines on the floor, wobbling with the water
        p = skia.Path()
        for j in range(21):
            v = j / 20; x, y = _px(k / 6, v); x += 5 * math.sin(t * 1.6 + v * 9 + k) * (0.4 + v)
            (p.moveTo if j == 0 else p.lineTo)(x, y)
        c.drawPath(p, SP(mixc((30, 110, 140), (10, 50, 100), dusk), 7, 150))
    rs = np.random.default_rng(11)                    # light shimmering on the surface
    for k in range(70):
        u, v, ph, ln = rs.uniform(0.02, 0.98), rs.uniform(0.03, 0.98), rs.uniform(0, 6.28), rs.uniform(18, 60)
        x, y = _px(u, v); x += 14 * math.sin(t * 0.5 + ph)
        a = 0.5 + 0.5 * math.sin(t * 1.9 + ph * 3)
        sc_ = 0.35 + v
        col = mixc((255, 250, 226), (170, 255, 244), dusk)
        c.drawLine(x - ln * sc_ * 0.5, y, x + ln * sc_ * 0.5, y + 2 * math.sin(t + ph), SP(col, 2 + 2.4 * sc_, 150 * a))
    sun_path = poly([_px(0.0, 0.0), _px(0.22, 0.0), _px(0.42, 1.0), _px(0.05, 1.0)])   # the low sun's glitter path
    c.drawPath(sun_path, P((255, 226, 150), 46 * sa, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    c.restore()
    c.drawPath(poly([_px(0, 0), _px(1, 0), _px(1, 0.07), _px(0, 0.07)]), P((10, 40, 70), 50))     # the far wall's shadow line
    # lane rope across the far third, floats bobbing
    for j in range(25):
        x, y = _px(0.02 + j * 0.04, 0.2); y += 2.2 * math.sin(t * 2.2 + j * 0.9)
        c.drawOval(skia.Rect(x - 13, y - 5, x + 13, y + 5), P((214, 62, 62) if j % 2 else (250, 244, 232)))
    if ball:
        bx, by = _px(0.56 + 0.03 * math.sin(t * 0.13), 0.48); by += 3 * math.sin(t * 1.7)
        c.drawOval(skia.Rect(bx - 40, by + 16, bx + 40, by + 34), P((10, 60, 90), 70, MaskFilter=blur(5)))
        c.save(); c.translate(bx, by); c.rotate(8 * math.sin(t * 0.5))
        b = skia.Path(); b.addCircle(0, 0, 34); c.save(); c.clipPath(b, skia.ClipOp.kIntersect, True)
        c.drawPaint(P((250, 244, 232)))
        for i, col in enumerate(((226, 84, 70), (250, 196, 80), (70, 150, 200))):
            c.save(); c.rotate(i * 60); c.drawPath(poly([(0, 0), (-16, -40), (16, -40)]), P(col)); c.drawPath(poly([(0, 0), (-16, 40), (16, 40)]), P(col)); c.restore()
        c.drawCircle(12, 10, 34, P((40, 30, 80), 50, MaskFilter=blur(8)))
        c.restore(); c.restore()
        c.drawArc(skia.Rect(bx - 46, by + 18, bx + 46, by + 34), 0, 180, False, SP((255, 255, 255), 2.5, 150))
    if people: people(c)
    # the ladder at the right edge
    for dx in (0, 34):
        p = skia.Path(); p.moveTo(1560 + dx, 792); p.lineTo(1560 + dx, 700); p.quadTo(1560 + dx, 672, 1590 + dx, 672)
        c.drawPath(p, SP(mixc((214, 220, 228), (130, 140, 190), dusk), 8))
    # the right fence with the clock and the hours sign
    c.drawRect(skia.Rect(1380, 316, 1392, 600), P(fc)); c.drawRect(skia.Rect(1890, 296, 1904, 640), P(fc))
    c.drawLine(1386, 330, 1900, 306, SP(fc, 6)); c.drawLine(1386, 584, 1900, 616, SP(fc, 6))
    c.save(); c.clipPath(poly([(1392, 332), (1890, 310), (1890, 612), (1392, 582)]), skia.ClipOp.kIntersect, True)
    for x in range(1300, 2300, 22): c.drawLine(x, 300, x - 180, 640, SP(fc, 1.4, 120)); c.drawLine(x - 400, 300, x - 220, 640, SP(fc, 1.4, 120))
    c.restore()
    clock(c, 1500, 420, 52, hours, dusk)
    board = rr(1590, 356, 1850, 506, 8)
    c.drawRRect(rr(1594, 362, 1856, 512, 8), P((40, 20, 40), 80, MaskFilter=blur(6)))
    c.drawRRect(board, P(mixc((250, 240, 216), (150, 150, 196), dusk))); c.drawRRect(board, SP(mixc((170, 112, 70), (60, 50, 90), dusk), 7))
    ink = mixc((70, 50, 60), (26, 24, 60), dusk)
    text(c, 'POOL HOURS', 1720, 404, 30, ink, 1.0, 'xb', 'center')
    c.drawRect(skia.Rect(1630, 418, 1810, 422), P((214, 62, 62)))
    text(c, sign, 1720, 468, 34 if len(sign) < 14 else 25, (196, 50, 54) if dusk < 0.5 else (20, 110, 110), 1.0, 'xb', 'center')
    # wet footprints toward the gate
    if prints > 0:
        n = int(prints * 12)
        for i in range(n):
            x = 1040 + i * 62; y = 960 - i * 9 + (12 if i % 2 else -12)
            a = 150 * (1 - 0.05 * (n - i))
            c.save(); c.translate(x, y); c.rotate(-8); c.drawOval(skia.Rect(-17, -8, 14, 8), P(mixc((190, 150, 124), (30, 30, 66), dusk), a)); c.drawCircle(21, -1, 6, P(mixc((190, 150, 124), (30, 30, 66), dusk), a)); c.restore()
    # the lifeguard chair and its umbrella, near on the left
    chair(c, 330, 1010, t, dusk)
    if lena is not None:
        if dusk > 0.5:
            c.saveLayer(None, None); CA.draw(c, 'lena', lena, LENA_X, LENA_G, LENA_S); c.drawRect(skia.Rect(LENA_X - 300, LENA_G - 700, LENA_X + 300, LENA_G + 60), P((40, 50, 120), 70 * dusk, BlendMode=skia.BlendMode.kSrcATop)); c.restore()
        else:
            # long warm shadow on the deck, away from the sun
            c.drawPath(poly([(LENA_X - 30, LENA_G - 6), (LENA_X + 40, LENA_G + 4), (LENA_X + 420, LENA_G + 44), (LENA_X + 380, LENA_G + 14)]), P((150, 90, 80), 70, MaskFilter=blur(8)))
            CA.draw(c, 'lena', lena, LENA_X, LENA_G, LENA_S)
            c.save(); c.clipRect(skia.Rect(LENA_X - 200, LENA_G - 600, LENA_X + 200, LENA_G + 20)); glow(c, LENA_X - 60, LENA_G - 430, 110, (255, 220, 150), 0.10); c.restore()
    # heat haze near the ground, drifting motes in the sun
    rs = np.random.default_rng(5)
    for k in range(26):
        x = (rs.uniform(0, W) + t * rs.uniform(6, 16)) % W; y = rs.uniform(120, 980) + 10 * math.sin(t * 0.6 + k)
        c.drawCircle(x, y, rs.uniform(1.5, 3.4), P((255, 240, 200), (60 + 40 * math.sin(t * 0.9 + k)) * (1 - 0.6 * dusk)))
    if dusk > 0.02:
        c.drawRect(skia.Rect(0, 0, W, H), P((30, 30, 90), 60 * dusk, BlendMode=skia.BlendMode.kMultiply))


def clock(c, x, y, r, hours, dusk=0.0):
    c.drawCircle(x + 4, y + 6, r, P((40, 20, 40), 80, MaskFilter=blur(5)))
    c.drawCircle(x, y, r, P(mixc((96, 70, 96), (40, 36, 80), dusk))); c.drawCircle(x, y, r - 8, P(mixc((252, 246, 230), (170, 170, 214), dusk)))
    for k in range(12):
        a = math.radians(k * 30); c.drawLine(x + (r - 16) * math.sin(a), y - (r - 16) * math.cos(a), x + (r - 11) * math.sin(a), y - (r - 11) * math.cos(a), SP((70, 50, 70), 3))
    hh = float(hours); ah = math.radians(hh * 30); am = math.radians((hh % 1) * 360)
    c.drawLine(x, y, x + (r - 28) * math.sin(ah), y - (r - 28) * math.cos(ah), SP((50, 36, 56), 6))
    c.drawLine(x, y, x + (r - 16) * math.sin(am), y - (r - 16) * math.cos(am), SP((50, 36, 56), 4))
    c.drawCircle(x, y, 5, P((214, 62, 62)))


def chair(c, x, g, t, dusk=0.0):
    """the lifeguard chair: a tall white wooden stand with a seat, a rescue tube and a red and white umbrella"""
    wd, ws, wr = mixc((250, 240, 222), (120, 124, 176), dusk), mixc((206, 178, 160), (70, 72, 126), dusk), mixc((255, 226, 160), (160, 170, 220), dusk)
    def beam(p0, p1, w):
        c.drawLine(p0[0] + 5, p0[1] + 3, p1[0] + 5, p1[1] + 3, SP(ws, w)); c.drawLine(*p0, *p1, SP(wd, w)); c.drawLine(p0[0] - w * 0.3, p0[1], p1[0] - w * 0.3, p1[1], SP(wr, w * 0.22, 220))
    c.drawPath(poly([(x - 150, g - 4), (x + 150, g - 4), (x + 560, g + 60), (x + 200, g + 60)]), P((150, 90, 80), 60 * (1 - dusk), MaskFilter=blur(10)))
    # umbrella pole and canopy (behind the seat)
    px, py = x + 10, g - 660
    c.drawLine(px, g - 470, px - 26, py - 70, SP(mixc((170, 160, 156), (70, 72, 110), dusk), 8))
    flut = 5 * math.sin(t * 1.3)
    um = skia.Path(); um.moveTo(px - 250, py + 6 + flut); um.quadTo(px - 150, py - 150, px - 26, py - 120); um.quadTo(px + 120, py - 150, px + 210, py - 10 - flut * 0.6)
    um.quadTo(px + 150, py - 36, px + 96, py - 14); um.quadTo(px + 40, py - 40, px - 20, py - 10); um.quadTo(px - 80, py - 40, px - 140, py - 6); um.quadTo(px - 200, py - 26, px - 250, py + 6 + flut); um.close()
    c.save(); c.clipPath(um, skia.ClipOp.kIntersect, True)
    c.drawPaint(P(mixc((250, 240, 226), (130, 130, 180), dusk)))
    for a0, a1 in ((-250, -140), (-20, 96)):
        c.drawPath(poly([(px - 26, py - 126), (px + a0, py + 40), (px + a1, py + 40)]), P(mixc((214, 62, 62), (110, 40, 90), dusk)))
    c.drawPath(poly([(px - 26, py - 126), (px + 96, py + 40), (px + 260, py + 40)]), P((60, 30, 60), 46))
    c.restore()
    # legs, braces, the seat and its back
    beam((x - 96, g - 440), (x - 150, g), 22); beam((x + 96, g - 440), (x + 150, g), 22)
    beam((x - 150 + 14, g - 110), (x + 150 - 14, g - 110), 16); beam((x - 122, g - 240), (x + 122, g - 240), 16)
    beam((x - 118, g - 232), (x + 140, g - 110), 12); beam((x + 118, g - 232), (x - 140, g - 110), 12)
    for k in range(4): beam((x - 60, g - 150 - k * 74), (x + 60, g - 150 - k * 74), 10)
    c.drawRRect(rr(x - 130, g - 470, x + 130, g - 436, 8), P(wd)); c.drawRRect(rr(x - 130, g - 446, x + 130, g - 436, 4), P(ws))
    for k in range(5):
        bx = x - 96 + k * 48
        c.drawRRect(rr(bx - 20, g - 620, bx + 20, g - 466, 14), P(wd)); c.drawRect(skia.Rect(bx + 10, g - 606, bx + 20, g - 470), P(ws, 150)); c.drawRect(skia.Rect(bx - 20, g - 606, bx - 15, g - 474), P(wr, 220))
    beam((x - 136, g - 520), (x - 136, g - 450), 14); beam((x + 136, g - 520), (x + 136, g - 450), 14)
    beam((x - 150, g - 524), (x - 60, g - 524), 12); beam((x + 60, g - 524), (x + 150, g - 524), 12)
    # the rescue tube hanging on the side, swinging a touch
    c.save(); c.translate(x + 168, g - 430); c.rotate(2.5 * math.sin(t * 0.8))
    c.drawLine(0, 0, 0, 30, SP((40, 40, 60), 5))
    c.drawRRect(rr(-28, 30, 28, 250, 26), P(mixc((206, 54, 58), (110, 36, 90), dusk))); c.drawRRect(rr(4, 40, 28, 244, 20), P((120, 20, 50), 110)); c.drawRRect(rr(-24, 40, -14, 230, 6), P((255, 150, 130), 170 * (1 - dusk)))
    c.restore()


def swimmers(t, spots=((0.2, 0.62, 'nguyen', 0.0), (0.44, 0.78, 'hale', 0.4), (0.8, 0.7, 'ortiz', 0.7))):
    return None


# ====================================================================== the council chamber
def chamber(c, t, members=None, lena=None, board=None, lamps=1.0):
    """the council chamber in the evening: panelled wall, a round seal, flags, tall windows with the last light, brass pendant
    lamps, the dais with three seats. members: dict name -> Pose (seated behind the dais). lena: a Pose, standing at the podium."""
    lgrad(c, (0, 0, W, H), (92, 54, 60), (58, 36, 58))
    for x in range(0, W, 120):                      # wall panels
        c.drawRect(skia.Rect(x + 6, 150, x + 114, 760), P((120, 70, 62), 110)); c.drawRect(skia.Rect(x + 6, 150, x + 12, 760), P((206, 130, 90), 60)); c.drawRect(skia.Rect(x + 104, 150, x + 114, 760), P((50, 28, 50), 90))
    c.drawRect(skia.Rect(0, 0, W, 150), P((60, 36, 56))); c.drawRect(skia.Rect(0, 142, W, 152), P((206, 150, 96), 150))
    # tall windows on the right with the evening outside
    for wx in (1420, 1660):
        win = skia.Path(); win.moveTo(wx, 640); win.lineTo(wx, 330); win.quadTo(wx, 220, wx + 90, 220); win.quadTo(wx + 180, 220, wx + 180, 330); win.lineTo(wx + 180, 640); win.close()
        c.drawPath(win, P((40, 24, 44)))
        c.save(); c.clipPath(win, skia.ClipOp.kIntersect, True)
        lgrad(c, (wx, 220, wx + 180, 640), (70, 76, 150), (250, 150, 110))
        for k in range(3): crown(c, wx + 30 + k * 70, 610 + 10 * (k % 2), 46, (40, 56, 90), (90, 90, 140), 80 + k + wx, t, 0.5)
        c.restore()
        c.drawPath(win, SP((70, 40, 50), 12)); c.drawLine(wx + 90, 222, wx + 90, 640, SP((70, 40, 50), 7)); c.drawLine(wx, 360, wx + 180, 360, SP((70, 40, 50), 7)); c.drawLine(wx, 500, wx + 180, 500, SP((70, 40, 50), 7))
        c.drawPath(poly([(wx, 640), (wx + 180, 640), (wx - 60, 1080), (wx - 420, 1080)]), P((255, 170, 120), 22, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    # the seal and the flags
    c.drawCircle(960, 330, 118, P((70, 40, 52))); c.drawCircle(960, 330, 104, P((214, 160, 92))); c.drawCircle(960, 330, 86, P((96, 56, 60))); c.drawCircle(960, 330, 86, SP((236, 190, 120), 4))
    for k in range(3):                              # a little wave emblem
        p = skia.Path(); p.moveTo(900, 318 + k * 22)
        for j in range(1, 7): p.quadTo(900 + j * 20 - 10, 318 + k * 22 + (10 if j % 2 else -10), 900 + j * 20, 318 + k * 22)
        c.drawPath(p, SP((236, 190, 120), 5))
    for fx_, col, col2 in ((640, (50, 86, 160), (236, 190, 90)), (1280, (236, 236, 226), (60, 140, 110))):
        c.drawRect(skia.Rect(fx_ - 4, 190, fx_ + 4, 720), P((206, 160, 96))); c.drawCircle(fx_, 186, 9, P((236, 190, 120)))
        sw = 6 * math.sin(t * 0.5 + fx_)
        fl = skia.Path(); fl.moveTo(fx_ + 4, 204); fl.quadTo(fx_ + 70 + sw, 300, fx_ + 60 + sw, 420); fl.quadTo(fx_ + 44 + sw * 0.6, 520, fx_ + 70 + sw, 620); fl.lineTo(fx_ + 4, 640); fl.close()
        c.drawPath(fl, P(col)); c.save(); c.clipPath(fl, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(fx_ + 30 + sw * 0.5, 200, fx_ + 46 + sw * 0.5, 650), P(col2)); c.drawRect(skia.Rect(fx_ + 46, 200, fx_ + 120, 650), P((30, 20, 50), 60)); c.restore()
    # pendant lamps, swaying a hair, dust in their beams
    for k, lx in enumerate((420, 960, 1500)):
        sx = 4 * math.sin(t * 0.45 + k * 2)
        c.drawLine(lx, 0, lx + sx, 150, SP((40, 24, 40), 4))
        sh = skia.Path(); sh.moveTo(lx + sx - 70, 196); sh.quadTo(lx + sx, 100, lx + sx + 70, 196); sh.close(); c.drawPath(sh, P((214, 160, 80))); c.drawPath(poly([(lx + sx, 148), (lx + sx + 70, 196), (lx + sx + 10, 196)]), P((150, 96, 60), 140))
        c.drawOval(skia.Rect(lx + sx - 34, 186, lx + sx + 34, 214), P((255, 244, 200)))
        glow(c, lx + sx, 204, 190, (255, 214, 140), 0.55 * lamps); glow(c, lx + sx, 204, 60, (255, 250, 220), 0.9 * lamps)
        c.drawPath(poly([(lx + sx - 40, 206), (lx + sx + 40, 206), (lx + sx + 330, 1000), (lx + sx - 330, 1000)]), P((255, 214, 150), 20 * lamps, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    rs = np.random.default_rng(9)
    for k in range(34):
        x = rs.uniform(100, 1800) + 20 * math.sin(t * 0.2 + k); y = (rs.uniform(220, 900) + t * rs.uniform(3, 8)) % 700 + 220
        c.drawCircle(x, y, rs.uniform(1.4, 3), P((255, 230, 180), 50 + 40 * math.sin(t + k)))
    # the seats, the people, then the dais in front of them
    seats = {'nguyen': 520, 'ortiz': 960, 'hale': 1400}
    for nm, sx_ in seats.items():
        c.drawRRect(rr(sx_ - 120, 420, sx_ + 120, 800, 40), P((84, 40, 62))); c.drawRRect(rr(sx_ - 106, 434, sx_ + 106, 800, 30), P((110, 54, 74))); c.drawRRect(rr(sx_ + 40, 434, sx_ + 106, 800, 30), P((60, 30, 56), 110))
    for nm, sx_ in seats.items():
        if members and nm in members: CA.draw(c, nm, members[nm], sx_, 1150, 0.66)
    dais = skia.Path(); dais.moveTo(150, 1080); dais.lineTo(150, 760); dais.quadTo(960, 700, 1770, 760); dais.lineTo(1770, 1080); dais.close()
    c.drawPath(dais, P((122, 66, 52)))
    c.save(); c.clipPath(dais, skia.ClipOp.kIntersect, True)
    lgrad(c, (150, 700, 1770, 1080), (150, 84, 60), (92, 48, 50))
    for x in (330, 760, 1190, 1620 - 30):
        c.drawRRect(rr(x - 150, 840, x + 150, 1060, 10), P((104, 54, 50))); c.drawRRect(rr(x - 150, 840, x + 150, 850, 4), P((60, 30, 44), 160)); c.drawRRect(rr(x - 150, 1050, x + 150, 1060, 4), P((196, 120, 80), 120))
    c.restore()
    top = skia.Path(); top.moveTo(120, 770); top.quadTo(960, 706, 1800, 770); top.lineTo(1800, 800); top.quadTo(960, 738, 120, 800); top.close()
    c.drawPath(top, P((196, 120, 76))); c.drawPath(top, SP((236, 170, 110), 3, 150))
    for nm, sx_ in seats.items():                   # name plates and microphones
        yy = 752 + abs(sx_ - 960) * 0.045
        c.drawRRect(rr(sx_ - 150, yy - 16, sx_ - 50, yy + 14, 5), P((214, 170, 96))); c.drawRRect(rr(sx_ - 146, yy - 12, sx_ - 54, yy + 10, 3), P((70, 44, 50)))
        mp = skia.Path(); mp.moveTo(sx_ + 90, yy + 12); mp.quadTo(sx_ + 96, yy - 60, sx_ + 54, yy - 84); c.drawPath(mp, SP((30, 26, 40), 5)); c.drawOval(skia.Rect(sx_ + 40, yy - 96, sx_ + 62, yy - 76), P((30, 26, 40)))
    if board: board(c)


def podium(c, t, lena, board=None):
    """the reverse shot: Lena at the podium, seen from the dais. Behind her the back of the chamber: panelled wall, the double
    doors, rows of empty seats, the same pendant lamps."""
    lgrad(c, (0, 0, W, H), (86, 52, 62), (52, 34, 58))
    for x in range(0, W, 120):
        c.drawRect(skia.Rect(x + 6, 150, x + 114, 800), P((112, 66, 62), 110)); c.drawRect(skia.Rect(x + 6, 150, x + 12, 800), P((206, 130, 90), 50)); c.drawRect(skia.Rect(x + 104, 150, x + 114, 800), P((50, 28, 50), 90))
    c.drawRect(skia.Rect(0, 0, W, 150), P((60, 36, 56))); c.drawRect(skia.Rect(0, 142, W, 152), P((206, 150, 96), 150))
    # double doors with small windows, an exit light above
    c.drawRRect(rr(1180, 250, 1620, 800, 8), P((60, 34, 50)))
    for dx in (1196, 1404):
        c.drawRRect(rr(dx, 266, dx + 200, 800, 6), P((132, 74, 60))); c.drawRRect(rr(dx + 120, 266, dx + 200, 800, 6), P((84, 44, 54), 120))
        c.drawRRect(rr(dx + 50, 320, dx + 150, 460, 8), P((70, 84, 150))); c.drawRRect(rr(dx + 50, 320, dx + 150, 460, 8), SP((60, 34, 50), 6))
    c.drawCircle(1386, 560, 8, P((236, 190, 120))); c.drawCircle(1414, 560, 8, P((236, 190, 120)))
    c.drawRRect(rr(1340, 196, 1460, 236, 6), P((40, 110, 90))); text(c, 'EXIT', 1400, 226, 26, (220, 255, 236), 0.9 + 0.1 * math.sin(t * 2.0), 'xb', 'center'); glow(c, 1400, 216, 70, (90, 255, 190), 0.25)
    # a framed town map on the wall
    c.drawRRect(rr(1700, 300, 1880, 520, 6), P((60, 34, 50))); c.drawRect(skia.Rect(1714, 314, 1866, 506), P((214, 196, 160)))
    for k in range(4): c.drawLine(1720, 350 + k * 40, 1860, 340 + k * 44, SP((150, 120, 100), 3, 150))
    c.drawCircle(1790, 410, 16, P((70, 150, 170)))
    for k, lx in enumerate((300, 960, 1620)):
        sx = 4 * math.sin(t * 0.45 + k * 2)
        c.drawLine(lx, 0, lx + sx, 150, SP((40, 24, 40), 4))
        sh = skia.Path(); sh.moveTo(lx + sx - 70, 196); sh.quadTo(lx + sx, 100, lx + sx + 70, 196); sh.close(); c.drawPath(sh, P((214, 160, 80)))
        c.drawOval(skia.Rect(lx + sx - 34, 186, lx + sx + 34, 214), P((255, 244, 200)))
        glow(c, lx + sx, 204, 190, (255, 214, 140), 0.5); glow(c, lx + sx, 204, 60, (255, 250, 220), 0.9)
        c.drawPath(poly([(lx + sx - 40, 206), (lx + sx + 40, 206), (lx + sx + 330, 1000), (lx + sx - 330, 1000)]), P((255, 214, 150), 20, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    # rows of empty seats, hazier toward the back
    for r_, (yy, sc_, col) in enumerate(((690, 0.62, (96, 56, 76)), (760, 0.8, (104, 54, 74)), (850, 1.0, (112, 52, 72)))):
        for k in range(-1, 14):
            x = k * 190 * sc_ + (60 if r_ % 2 else 0)
            c.drawRRect(rr(x, yy - 150 * sc_, x + 160 * sc_, yy + 200, 26 * sc_), P(col)); c.drawRRect(rr(x + 110 * sc_, yy - 150 * sc_, x + 160 * sc_, yy + 200, 20 * sc_), P((50, 24, 50), 90)); c.drawRRect(rr(x + 6, yy - 144 * sc_, x + 20, yy + 200, 6), P((206, 120, 110), 50))
    rs = np.random.default_rng(9)
    for k in range(30):
        x = rs.uniform(100, 1800) + 20 * math.sin(t * 0.2 + k); y = (rs.uniform(220, 900) + t * rs.uniform(3, 8)) % 700 + 220
        c.drawCircle(x, y, rs.uniform(1.4, 3), P((255, 230, 180), 50 + 40 * math.sin(t + k)))
    c.drawRect(skia.Rect(0, 900, W, H), P((58, 36, 60)))
    LX = 720
    CA.draw(c, 'lena', lena, LX, 1420, 0.9)
    c.save(); c.clipRect(skia.Rect(LX - 400, 300, LX + 400, 1000)); glow(c, LX - 110, 520, 150, (255, 214, 150), 0.10); c.restore()
    pod = poly([(LX - 250, 1080), (LX - 226, 880), (LX + 226, 880), (LX + 250, 1080)])
    c.drawPath(pod, P((112, 60, 52))); c.drawPath(poly([(LX + 60, 880), (LX + 226, 880), (LX + 250, 1080), (LX + 90, 1080)]), P((70, 36, 50), 130))
    c.drawPath(poly([(LX - 280, 892), (LX - 244, 836), (LX + 244, 836), (LX + 280, 892)]), P((176, 104, 70))); c.drawLine(LX - 244, 836, LX + 244, 836, SP((236, 170, 110), 3, 170))
    c.drawRect(skia.Rect(LX - 150, 800, LX + 30, 838), P((250, 244, 230))); c.drawRect(skia.Rect(LX - 150, 800, LX + 30, 806), P((200, 190, 180)))        # her notes, standing against the lip
    mp = skia.Path(); mp.moveTo(LX + 170, 850); mp.quadTo(LX + 176, 760, LX + 110, 726); c.drawPath(mp, SP((30, 26, 40), 6)); c.drawOval(skia.Rect(LX + 90, 712, LX + 122, 738), P((30, 26, 40)))
    if board: board(c)


# ====================================================================== Lena's desk at night
DESK_Y = 800
LENA_HOME = 'lena_home'


def desk(c, t, lena=None, screen_glow=1.0, sheets=True):
    """Lena's room at night, seen across her desk: window with a street lamp, corkboard and pennant, a shelf with trophies and a
    plant, a hanging lamp, the laptop open toward her, survey sheets and a clipboard, a mug with steam."""
    lgrad(c, (0, 0, W, H), (34, 40, 86), (26, 28, 64))
    # window
    c.drawRRect(rr(1300, 120, 1820, 620, 10), P((60, 44, 70)))
    c.save(); c.clipRRect(rr(1318, 138, 1802, 602, 6), True)
    lgrad(c, (1318, 138, 1802, 602), (20, 30, 84), (50, 70, 140))
    rs = np.random.default_rng(2)
    for k in range(26): c.drawCircle(rs.uniform(1320, 1800), rs.uniform(140, 380), rs.uniform(0.8, 2), P((255, 244, 220), 130 + 110 * math.sin(t * 1.4 + k)))
    c.drawPath(poly([(1318, 602), (1318, 500), (1420, 430), (1520, 500), (1520, 602)]), P((30, 36, 80))); c.drawRect(skia.Rect(1400, 520, 1440, 560), P((255, 214, 130)))
    c.drawPath(poly([(1560, 602), (1560, 470), (1690, 400), (1802, 470), (1802, 602)]), P((24, 30, 72))); c.drawRect(skia.Rect(1700, 500, 1740, 544), P((255, 214, 130), 200 + 40 * math.sin(t * 0.7)))
    c.drawRect(skia.Rect(1528, 250, 1536, 602), P((18, 22, 54))); c.drawRRect(rr(1500, 240, 1564, 258, 6), P((18, 22, 54)))
    glow(c, 1532, 266, 46, (255, 226, 160), 0.6); c.drawPath(poly([(1512, 260), (1552, 260), (1640, 602), (1424, 602)]), P((255, 226, 160), 30, MaskFilter=blur(14), BlendMode=skia.BlendMode.kScreen))
    crown(c, 1460, 470, 44, (20, 44, 70), (40, 70, 110), 5, t, 0.8)
    c.restore()
    c.drawRect(skia.Rect(1552, 138, 1566, 602), P((60, 44, 70))); c.drawRect(skia.Rect(1318, 360, 1802, 372), P((60, 44, 70)))
    cw = 10 * math.sin(t * 0.5)                      # a curtain moving at the open window
    cu = skia.Path(); cu.moveTo(1250, 100); cu.lineTo(1340, 100); cu.quadTo(1360 + cw, 360, 1330 + cw * 1.6, 640); cu.lineTo(1250, 640); cu.close()
    c.drawPath(cu, P((92, 70, 130))); c.drawPath(poly([(1300, 100), (1340, 100), (1340, 640), (1310, 640)]), P((50, 40, 90), 90))
    # corkboard and pennant, shelf
    c.drawRRect(rr(130, 250, 700, 640, 12), P((120, 84, 70))); c.drawRRect(rr(146, 266, 684, 624, 8), P((176, 128, 92)))
    pen = poly([(180, 300), (470, 352), (180, 404)]); c.drawPath(pen, P((40, 80, 150))); c.drawPath(poly([(180, 300), (200, 300), (200, 404), (180, 404)]), P((236, 236, 226)))
    text(c, 'SWIM TEAM', 290, 364, 26, (240, 236, 228), 1.0, 'xb', 'center')
    for k, (nx, ny, col) in enumerate(((520, 310, (250, 226, 150)), (590, 420, (170, 214, 190)), (300, 470, (240, 190, 180)), (430, 520, (200, 200, 240)), (560, 540, (250, 226, 150)))):
        c.save(); c.translate(nx, ny); c.rotate(4 * math.sin(k * 2.2)); c.drawRect(skia.Rect(-38, -34, 38, 34), P(col)); c.drawCircle(0, -26, 5, P((214, 62, 62)))
        for j in range(3): c.drawLine(-26, -8 + j * 12, 26 - 8 * j, -8 + j * 12, SP((90, 80, 100), 2.4, 150))
        c.restore()
    c.drawRRect(rr(150, 170, 720, 190, 5), P((96, 64, 64)))
    cup = skia.Path(); cup.moveTo(210, 80); cup.lineTo(290, 80); cup.quadTo(290, 130, 258, 140); cup.lineTo(258, 160); cup.lineTo(280, 170); cup.lineTo(220, 170); cup.lineTo(242, 160); cup.lineTo(242, 140); cup.quadTo(210, 130, 210, 80); cup.close()
    c.drawPath(cup, P((236, 186, 80))); c.drawPath(poly([(254, 80), (290, 80), (280, 130), (258, 140)]), P((170, 110, 50), 120))
    c.save(); c.translate(170, 34); c.scale(0.8, 0.8); c.drawPath(cup, P((206, 140, 96))); c.restore()
    c.drawRRect(rr(560, 126, 640, 170, 6), P((196, 104, 80)))
    for k in range(5):
        lf = skia.Path(); a = -60 + k * 30 + 4 * math.sin(t * 0.8 + k); lf.moveTo(600, 128); lf.quadTo(600 + 30 * math.sin(math.radians(a)) - 10, 90, 600 + 70 * math.sin(math.radians(a)), 128 - 70 * math.cos(math.radians(a))); lf.quadTo(600 + 30 * math.sin(math.radians(a)) + 10, 100, 600, 128)
        c.drawPath(lf, P((70, 150, 110) if k % 2 else (56, 124, 100)))
    # the hanging lamp and its cone of warm light
    lx = 960 + 5 * math.sin(t * 0.4)
    c.drawLine(960, 0, lx, 120, SP((20, 20, 44), 4))
    c.drawPath(poly([(lx - 30, 120), (lx + 30, 120), (lx + 86, 216), (lx - 86, 216)]), P((70, 76, 130))); c.drawPath(poly([(lx + 4, 120), (lx + 30, 120), (lx + 86, 216), (lx + 30, 216)]), P((40, 44, 96)))
    c.drawOval(skia.Rect(lx - 60, 200, lx + 60, 240), P((255, 240, 200)))
    glow(c, lx, 226, 240, (255, 206, 130), 0.5); glow(c, lx, 226, 70, (255, 248, 220), 0.9)
    c.drawPath(poly([(lx - 70, 226), (lx + 70, 226), (lx + 560, DESK_Y + 120), (lx - 560, DESK_Y + 120)]), P((255, 206, 130), 34, MaskFilter=blur(26), BlendMode=skia.BlendMode.kScreen))
    rs = np.random.default_rng(4)
    for k in range(24):
        x = lx + rs.uniform(-380, 380) + 14 * math.sin(t * 0.3 + k); y = (rs.uniform(250, 760) + t * rs.uniform(4, 9)) % 520 + 250
        c.drawCircle(x, y, rs.uniform(1.4, 2.8), P((255, 230, 180), 50 + 40 * math.sin(t * 1.1 + k)))
    if lena is not None:
        # the chair back behind her, then Lena (sitting at the desk: the desk and the laptop are in front of her)
        c.drawRRect(rr(800, 500, 1120, 900, 50), P((52, 60, 120))); c.drawRRect(rr(1040, 510, 1120, 900, 40), P((34, 40, 92), 150))
        c.saveLayer(None, None)
        CA.draw(c, LENA_HOME, lena, 960, 1240, 0.8)
        c.drawRect(skia.Rect(600, 200, 1320, 900), P((30, 40, 110), 40, BlendMode=skia.BlendMode.kSrcATop))
        c.drawOval(skia.Rect(800, 560, 1120, 900), P((120, 190, 255), int(70 * screen_glow), BlendMode=skia.BlendMode.kSrcATop, MaskFilter=blur(50)))
        c.restore()
    # the desk, laptop, sheets, clipboard, mug
    lgrad(c, (0, DESK_Y, W, H + 200), (150, 92, 60), (96, 56, 52))
    c.drawRect(skia.Rect(0, DESK_Y, W, DESK_Y + 8), P((214, 150, 96), 190))
    c.drawOval(skia.Rect(420, DESK_Y + 10, 1500, DESK_Y + 300), P((255, 196, 120), 44, MaskFilter=blur(50), BlendMode=skia.BlendMode.kScreen))
    lid = poly([(772, DESK_Y + 150), (790, 690), (1130, 690), (1148, DESK_Y + 150)])
    q = skia.Path(lid); q.offset(8, 12); c.drawPath(q, P((20, 10, 30), 110, MaskFilter=blur(10)))
    c.drawPath(lid, P((70, 86, 150))); c.drawPath(poly([(960, 690), (1130, 690), (1148, DESK_Y + 150), (980, DESK_Y + 150)]), P((46, 58, 118), 150)); c.drawLine(792, 692, 1128, 692, SP((150, 170, 236), 4, 200))
    c.drawCircle(960, 820, 18, P((120, 140, 214))); glow(c, 960, 660, 200, (120, 180, 255), 0.22 * screen_glow)
    c.drawPath(poly([(750, DESK_Y + 150), (1170, DESK_Y + 150), (1186, DESK_Y + 172), (734, DESK_Y + 172)]), P((50, 60, 116)))
    if sheets:
        for k in range(3):
            c.save(); c.translate(420 - k * 8, DESK_Y + 120 - k * 7); c.rotate(-9 + k * 3)
            c.drawRect(skia.Rect(-120, -70, 120, 70), P((60, 30, 40), 60, MaskFilter=blur(5))); c.drawRect(skia.Rect(-124, -76, 116, 64), P((250, 244, 230) if k == 2 else (232, 224, 210)))
            if k == 2:
                for j in range(5): c.drawRect(skia.Rect(-100, -56 + j * 24, -84, -42 + j * 24), SP((120, 110, 130), 2)); c.drawLine(-70, -48 + j * 24, 80 - 14 * (j % 3), -48 + j * 24, SP((120, 110, 130), 3, 170))
            c.restore()
        c.save(); c.translate(1470, DESK_Y + 150); c.rotate(7)
        c.drawRRect(rr(-130, -84, 130, 84, 8), P((40, 20, 30), 80, MaskFilter=blur(6))); c.drawRRect(rr(-136, -90, 124, 78, 8), P((50, 130, 110))); c.drawRect(skia.Rect(-120, -74, 108, 64), P((250, 244, 230))); c.drawRRect(rr(-40, -100, 28, -76, 5), P((170, 176, 196)))
        for j in range(4): c.drawLine(-100, -44 + j * 26, 80 - 20 * (j % 2), -44 + j * 26, SP((120, 110, 130), 3, 170))
        c.restore()
    mx_, my_ = 1260, DESK_Y + 60
    c.drawOval(skia.Rect(mx_ - 70, my_ + 46, mx_ + 80, my_ + 76), P((30, 14, 30), 100, MaskFilter=blur(6)))
    c.drawArc(skia.Rect(mx_ + 30, my_ - 10, mx_ + 86, my_ + 46), -80, 170, False, SP((196, 60, 60), 12))
    c.drawRRect(rr(mx_ - 46, my_ - 36, mx_ + 46, my_ + 62, 12), P((214, 70, 66))); c.drawRRect(rr(mx_ + 6, my_ - 36, mx_ + 46, my_ + 62, 12), P((150, 40, 60), 130)); c.drawOval(skia.Rect(mx_ - 46, my_ - 50, mx_ + 46, my_ - 22), P((96, 50, 44)))
    for k in range(3):                               # steam
        ph = (t * 0.25 + k / 3) % 1.0
        sp_ = skia.Path(); sx_ = mx_ - 18 + k * 18; sy_ = my_ - 44 - ph * 110
        sp_.moveTo(sx_, sy_ + 30); sp_.quadTo(sx_ + 16 * math.sin(t + k), sy_ + 14, sx_ + 6 * math.sin(t * 0.7 + k), sy_)
        c.drawPath(sp_, SP((240, 236, 250), 6, 70 * math.sin(ph * math.pi), ))
