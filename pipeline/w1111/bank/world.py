"""w1111-03-bank-run: the two places. (1) A town main street on a clear morning seen from the bank's portico, looking back along the line
of people waiting to get in. (2) A cut through the ground: the street on top (a house and a shop), the bank's vault underneath.
House flat layered style, all code. World coords = screen coords at zoom 1 (1080x1920)."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/bank', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import layout as L
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import shaded, diffp, tube, op, glow
import bhands as H

MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
_R = np.random.default_rng(11)
HORIZON = 700
STONE, STONE_SH, STONE_HI = (232, 212, 178), (190, 164, 140), (255, 242, 214)
COOL = (72, 84, 140)                                         # the colour of the long morning shadows
BRASS, BRASS_SH, BRASS_HI = (214, 164, 78), (150, 104, 52), (255, 226, 150)
CLOUDS = [(_R.uniform(-200, 1280), _R.uniform(150, 600), _R.uniform(90, 200), _R.uniform(0.4, 1.0)) for _ in range(7)]
BIRDS = [(_R.uniform(0, 1), _R.uniform(430, 600), _R.uniform(0.7, 1.2), _R.uniform(0, 6.28)) for _ in range(5)]
MOTES = [(_R.uniform(0, 1080), _R.uniform(0, 1), _R.uniform(1.5, 4.0), _R.uniform(0, 6.28), _R.uniform(0.3, 1.0)) for _ in range(40)]


def text(c, s, x, y, size, col, a=255, face=None, bold=True, align=0.5):
    f = skia.Font(face or L.BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias)
    w = f.measureText(s); c.drawString(s, x - w * align, y, f, P(col, a)); return w


def grad(c, rect, p0, p1, cols, pos=None):
    c.drawRect(rect, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(*p0), skia.Point(*p1)], [C(x[:3], x[3] if len(x) > 3 else 255) for x in cols], pos)))


def feet_y(s):
    """the camera stands on the bank's top step, a little above eye level: people further away sit higher in the frame"""
    return HORIZON + 1110 * s


def line_x(s):
    return 965 - 565 * (s / 0.95)


# ------------------------------------------------------------------------------------------------ the street
def sky(c, t):
    grad(c, skia.Rect(0, 0, 1080, 760), (0, 0), (0, 740), [(70, 138, 214), (126, 182, 232), (196, 224, 238), (250, 236, 208)], [0, 0.45, 0.8, 1.0])
    c.drawCircle(120, 520, 420, P((255, 240, 200), 70, MaskFilter=blur(140)))                                     # the low morning sun, off to the left
    for (x, y, w, k) in CLOUDS:
        xx = (x + t * 7 * k + 300) % 1500 - 300
        for dx, dy, r in ((0, 0, 1.0), (-0.55, 0.12, 0.7), (0.5, 0.1, 0.76), (0.1, -0.22, 0.7)):
            c.drawOval(skia.Rect(xx + dx * w - w * r * 0.6, y + dy * w - w * r * 0.24, xx + dx * w + w * r * 0.6, y + dy * w + w * r * 0.24), P((255, 255, 255), 215))
        c.drawOval(skia.Rect(xx - w * 0.8, y + w * 0.1, xx + w * 0.8, y + w * 0.3), P((190, 206, 236), 120, MaskFilter=blur(8)))


def bird(c, x, y, s, flap):
    p = skia.Path(); p.moveTo(x - 16 * s, y - 7 * s * flap); p.quadTo(x - 6 * s, y - 3 * s - 5 * s * flap, x, y); p.quadTo(x + 6 * s, y - 3 * s - 5 * s * flap, x + 16 * s, y - 7 * s * flap)
    c.drawPath(p, SP((50, 60, 90), 3.2 * s, 220))


def shopfront(c, x0, x1, y0, y1, wall, awn=None, sign=None, door=None, t=0.0):
    wsh = mix(wall, COOL, 0.35)
    c.drawRect(skia.Rect(x0, y0, x1, y1), P(wall)); c.drawRect(skia.Rect(x1 - (x1 - x0) * 0.16, y0, x1, y1), P(wsh, 120))
    c.drawRect(skia.Rect(x0 - 4, y0 - 10, x1 + 4, y0 + 4), P(mix(wall, (255, 255, 255), 0.4))); c.drawRect(skia.Rect(x0 - 4, y0 + 4, x1 + 4, y0 + 9), P(wsh))
    n = max(2, int((x1 - x0) / 62)); ww = (x1 - x0) / n
    for i in range(n):                                       # upstairs windows
        wx = x0 + ww * (i + 0.5)
        for wy in ((y0 + 34,) if y1 - y0 < 230 else (y0 + 34, y0 + 112)):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wx - 15, wy, wx + 15, wy + 48), 3, 3), P((110, 150, 190))); c.drawRect(skia.Rect(wx - 15, wy, wx + 15, wy + 16), P((190, 220, 240), 200))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wx - 15, wy, wx + 15, wy + 48), 3, 3), SP(mix(wall, (255, 255, 255), 0.5), 3)); c.drawRect(skia.Rect(wx - 19, wy + 48, wx + 19, wy + 53), P(mix(wall, (255, 255, 255), 0.4)))
    gy = y1 - 78
    c.drawRect(skia.Rect(x0 + 8, gy, x1 - 8, y1), P((70, 96, 130))); c.drawRect(skia.Rect(x0 + 8, gy, x1 - 8, gy + 26), P((150, 190, 220), 150))
    if door is not None: c.drawRect(skia.Rect(door - 13, gy + 8, door + 13, y1), P(mix(wall, (40, 30, 50), 0.55)))
    if awn is not None:
        ap = poly([(x0 + 2, gy - 16), (x1 - 2, gy - 16), (x1 + 8, gy + 14), (x0 - 8, gy + 14)]); c.drawPath(ap, P(awn))
        c.save(); c.clipPath(ap, skia.ClipOp.kIntersect, True)
        k = 0
        xx = x0 - 10
        while xx < x1 + 10:
            if k % 2: c.drawRect(skia.Rect(xx, gy - 20, xx + 16, gy + 16), P((250, 244, 232)))
            xx += 16; k += 1
        c.restore(); c.drawRect(skia.Rect(x0 - 8, gy + 14, x1 + 8, gy + 24), P(COOL, 90, MaskFilter=blur(4)))
    if sign: text(c, sign, (x0 + x1) / 2, gy - 26, 15, mix(wall, (30, 20, 40), 0.75), face=MONT)


def tree(c, x, y, s, t, ph):
    sw = 3 * math.sin(t * 1.3 + ph)
    c.drawRect(skia.Rect(x - 5 * s, y - 70 * s, x + 5 * s, y), P((120, 86, 70)))
    for dx, dy, r, col in ((0, -112, 46, (92, 150, 96)), (-28, -92, 34, (78, 134, 90)), (28, -94, 36, (104, 162, 100)), (-6, -128, 30, (128, 180, 110))):
        c.drawCircle(x + dx * s + sw * (1 + (-dy) / 100), y + dy * s, r * s, P(col))
    c.drawCircle(x - 14 * s + sw, y - 124 * s, 18 * s, P((176, 214, 140), 150))
    c.drawOval(skia.Rect(x + 4 * s, y - 5 * s, x + 110 * s, y + 7 * s), P(COOL, 80, MaskFilter=blur(4)))


def far_row(c, t):
    """the other side of the street, small and hazed"""
    y1 = 716
    shopfront(c, 500, 640, 470, y1, (224, 150, 116), awn=(190, 70, 60), door=572, t=t)
    shopfront(c, 640, 772, 510, y1, (240, 222, 180), awn=(60, 130, 120), door=706, t=t)
    shopfront(c, 772, 930, 452, y1, (170, 190, 170), awn=(226, 170, 60), door=850, t=t)
    shopfront(c, 930, 1100, 496, y1, (214, 176, 150), awn=(90, 100, 160), door=1010, t=t)
    for tx, ph in ((660, 0.0), (900, 2.0), (1040, 4.0)): tree(c, tx, 722, 0.62, t, ph)
    c.drawRect(skia.Rect(480, 420, 1080, 730), P((236, 226, 220), 46))                                              # morning haze over the far side
    c.drawRect(skia.Rect(0, 716, 1080, 730), P((206, 196, 190)))                                                    # the far pavement
    c.drawRect(skia.Rect(0, 728, 1080, 800), P((108, 114, 138))); grad(c, skia.Rect(0, 728, 1080, 800), (0, 728), (0, 800), [(150, 150, 170, 120), (90, 96, 124, 0)])   # the road
    for i in range(9): c.drawRect(skia.Rect(-40 + i * 150, 760, 30 + i * 150, 765), P((236, 230, 214), 170))
    c.drawRect(skia.Rect(0, 796, 1080, 806), P((250, 240, 220)))                                                    # our kerb, catching the sun


def car(c, t, t0=0.0, speed=150.0, col=(214, 84, 70), x0=-240):
    x = x0 + (t - t0) * speed; y = 786
    if x < -260 or x > 1340: return
    c.drawOval(skia.Rect(x - 80, y - 6, x + 90, y + 10), P((30, 34, 60), 130, MaskFilter=blur(5)))
    body = smooth_closed([(x - 78, y - 6), (x - 80, y - 30), (x - 50, y - 36), (x - 34, y - 60), (x + 26, y - 60), (x + 46, y - 36), (x + 76, y - 30), (x + 80, y - 6)])
    shaded(c, body, col, mix(col, (40, 20, 60), 0.4), sh=(0, -8), rimL=mix(col, (255, 255, 255), 0.5), rl=(2, 3))
    c.drawPath(poly([(x - 28, y - 54), (x - 2, y - 54), (x - 2, y - 37), (x - 42, y - 37)]), P((176, 210, 232))); c.drawPath(poly([(x + 4, y - 54), (x + 22, y - 54), (x + 38, y - 37), (x + 4, y - 37)]), P((176, 210, 232)))
    for wx in (x - 46, x + 46):
        c.drawCircle(wx, y - 6, 14, P((34, 34, 48))); c.drawCircle(wx, y - 6, 6, P((170, 174, 190)))
        a = (t - t0) * speed / 14
        c.drawLine(wx - 5 * math.cos(a), y - 6 - 5 * math.sin(a), wx + 5 * math.cos(a), y - 6 + 5 * math.sin(a), SP((90, 94, 110), 2))


def neighbour(c, t):
    """the brick building next to the bank: the line of people comes round its corner"""
    x0, x1, y0, y1 = 150, 520, 380, 800
    wall, wsh = (196, 112, 88), (150, 84, 86)
    c.drawRect(skia.Rect(x0, y0, x1, y1), P(wall))
    c.save(); c.clipRect(skia.Rect(x0, y0, x1, y1))
    for j in range(0, 30):
        yy = y0 + j * 15; c.drawLine(x0, yy, x1, yy, SP(wsh, 1.4, 70))
    c.drawRect(skia.Rect(x1 - 46, y0, x1, y1), P(wsh, 120))                                                          # the shaded turn of the corner
    c.restore()
    c.drawRect(skia.Rect(x0 - 6, y0 - 16, x1 + 6, y0 + 6), P((240, 220, 196))); c.drawRect(skia.Rect(x0 - 6, y0 + 6, x1 + 6, y0 + 13), P(wsh))
    for i in range(4):
        for j in range(2):
            wx, wy = 212 + i * 82, 426 + j * 112
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wx - 22, wy, wx + 22, wy + 72), 3, 3), P((92, 130, 170))); c.drawRect(skia.Rect(wx - 22, wy, wx + 22, wy + 24), P((190, 220, 240), 190))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wx - 22, wy, wx + 22, wy + 72), 3, 3), SP((244, 230, 210), 4)); c.drawLine(wx, wy, wx, wy + 72, SP((244, 230, 210), 3)); c.drawRect(skia.Rect(wx - 28, wy + 72, wx + 28, wy + 79), P((244, 230, 210)))
    c.drawRect(skia.Rect(x0 + 20, 668, x1 - 60, y1), P((60, 84, 110))); c.drawRect(skia.Rect(x0 + 20, 668, x1 - 60, 700), P((150, 190, 214), 150))
    ap = poly([(x0 + 10, 640), (x1 - 50, 640), (x1 - 36, 682), (x0 - 4, 682)]); c.drawPath(ap, P((54, 110, 104)))
    c.save(); c.clipPath(ap, skia.ClipOp.kIntersect, True)
    for i in range(12): c.drawRect(skia.Rect(x0 + i * 60, 630, x0 + 30 + i * 60, 690), P((244, 238, 224)))
    c.restore()
    c.drawRect(skia.Rect(x0 + 10, 600, x1 - 50, 640), P((40, 84, 80))); text(c, 'HARDWARE', (x0 + x1 - 50) / 2, 630, 26, (250, 240, 214))
    c.drawRect(skia.Rect(x0 - 10, 380, x1, y1), P((240, 228, 216), 34))                                              # a little haze: it is across the square


def plaza(c, t):
    grad(c, skia.Rect(0, 800, 1080, 1920), (0, 800), (0, 1920), [(236, 220, 192), (226, 206, 176), (210, 188, 160)], [0, 0.4, 1.0])
    for k in range(-14, 15):                                 # the joints between the paving stones run away from us
        xb = 540 + k * 230; c.drawLine(540 + (xb - 540) * 0.09, 806, xb + (xb - 540) * 0.2, 1920, SP((190, 166, 140), 2.4, 120))
    for s_ in (0.12, 0.17, 0.25, 0.37, 0.56, 0.86):
        yy = HORIZON + 1110 * s_; c.drawLine(0, yy, 1080, yy, SP((190, 166, 140), 1.5 + 3 * s_, 110))
    # the long shadows of the bank's columns lie across the square
    for (xa, w) in ((-260, 150), (40, 110)):
        sp = poly([(xa, 1920), (xa + w * 2.2, 1920), (xa + 1500 + w, 1000), (xa + 1500, 1000)])
        c.drawPath(sp, P(COOL, 52, MaskFilter=blur(10)))


def cast_shadow(c, x, y, s, a=1.0):
    """a person's long morning shadow on the paving: their own outline laid down to the right"""
    c.save(); c.translate(x, y); c.concat(skia.Matrix().setAll(1, -0.66, 0, 0, -0.085, 0, 0, 0, 1)); c.scale(s, s)
    p = skia.Path(); p.addRoundRect(skia.Rect(-100, -830, 100, -520), 60, 60); p.addRoundRect(skia.Rect(-96, -600, -6, 0), 30, 30); p.addRoundRect(skia.Rect(6, -600, 96, 0), 30, 30)
    p.addRoundRect(skia.Rect(-150, -810, -98, -500), 26, 26); p.addRoundRect(skia.Rect(98, -810, 150, -500), 26, 26); p.addCircle(0, -930, 78); p.setFillType(skia.PathFillType.kWinding)
    c.drawPath(p, P(COOL, 74 * a, MaskFilter=blur(max(1.0, 9 * s)))); c.restore()


def column(c, x, w, t):
    """one of the bank's stone columns, close to the camera"""
    grad(c, skia.Rect(x, -20, x + w, 1940), (x, 0), (x + w, 0), [(250, 232, 196), (236, 214, 178), (200, 174, 150), (168, 146, 140)], [0, 0.3, 0.75, 1.0])
    n = 5
    for i in range(1, n):
        fx = x + w * i / n; c.drawLine(fx, 0, fx, 1700, SP((170, 144, 130), 5, 90)); c.drawLine(fx + 5, 0, fx + 5, 1700, SP((255, 244, 220), 3, 120))
    base = smooth_closed([(x - 30, 1940), (x - 30, 1730), (x - 10, 1700), (x + w + 16, 1700), (x + w + 36, 1730), (x + w + 36, 1940)])
    shaded(c, base, (226, 204, 170), (176, 150, 138), sh=(-10, 0), rimL=(255, 244, 216), rl=(4, 3))
    c.drawRect(skia.Rect(x + w, 0, x + w + 60, 1940), P(COOL, 46, MaskFilter=blur(18)))


def plaque(c, x, y, w, h, ins=0.0):
    """the bank's brass name plate; `ins` 0..1 shows the insured shield docked under the name"""
    r = skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), 10, 10)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 4, y + 8, x + w + 6, y + h + 10), 10, 10), P((60, 40, 50), 120, MaskFilter=blur(7)))
    c.drawRRect(r, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(x, y), skia.Point(x + w, y + h)], [C(BRASS_HI), C(BRASS), C(BRASS_SH)], [0, 0.45, 1])))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 7, y + 7, x + w - 7, y + h - 7), 6, 6), SP((120, 80, 44), 2.5, 200))
    for (sx, sy) in ((x + 16, y + 16), (x + w - 16, y + 16), (x + 16, y + h - 16), (x + w - 16, y + h - 16)): c.drawCircle(sx, sy, 4, P((120, 80, 44)))
    ink = (74, 44, 30)
    for i, wd in enumerate(('CITY', 'SAVINGS', 'BANK')): text(c, wd, x + w / 2, y + 52 + i * 36, 30 if i != 1 else 23, ink)



def shield_path(s=1.0):
    return smooth_closed([(0, -150 * s), (60 * s, -128 * s), (122 * s, -118 * s), (124 * s, -20 * s), (96 * s, 70 * s), (48 * s, 124 * s), (0, 152 * s), (-48 * s, 124 * s), (-96 * s, 70 * s), (-124 * s, -20 * s), (-122 * s, -118 * s), (-60 * s, -128 * s)])


def shield(c, x, y, s, a=1.0, small=False, glow_=0.0):
    """the deposit insurance shield: teal, a white tick"""
    c.save(); c.translate(x, y)
    sp = shield_path(s)
    if glow_ > 0: c.drawPath(shield_path(s * 1.16), P((120, 255, 230), 200 * glow_ * a, MaskFilter=blur(40 * s)))
    q = skia.Path(sp); q.offset(6 * s, 12 * s); c.drawPath(q, P((10, 20, 50), 130 * a, MaskFilter=blur(10 * s)))
    c.drawPath(sp, P((250, 252, 255), 255 * a))
    inner = shield_path(s * 0.88)
    c.drawPath(inner, skia.Paint(AntiAlias=True, Alphaf=a, Shader=skia.GradientShader.MakeLinear([skia.Point(-120 * s, -150 * s), skia.Point(120 * s, 150 * s)], [C((70, 226, 200)), C((30, 160, 170)), C((24, 112, 150))], [0, 0.5, 1])))
    c.save(); c.clipPath(inner, skia.ClipOp.kIntersect, True); c.drawPath(poly([(-140 * s, -160 * s), (-10 * s, -160 * s), (-90 * s, 160 * s), (-140 * s, 160 * s)]), P((255, 255, 255), 40 * a)); c.restore()
    tk = skia.Path(); tk.moveTo(-52 * s, -6 * s); tk.lineTo(-14 * s, 36 * s); tk.lineTo(58 * s, -52 * s)
    c.drawPath(tk, SP((10, 60, 90), 30 * s, 90 * a)); c.drawPath(tk, SP((255, 255, 255), 24 * s, 255 * a))
    c.restore()


def door_leaf(c, t, x=968):
    """the edge of the bank's open brass door, close to the camera on the right"""
    grad(c, skia.Rect(x, -20, 1300, 1940), (x, 0), (x + 140, 0), [(250, 214, 130), (206, 152, 70), (150, 100, 52)], [0, 0.35, 1.0])
    c.drawRect(skia.Rect(x - 50, 0, x, 1940), P(COOL, 40, MaskFilter=blur(16)))
    c.drawRect(skia.Rect(x, -20, x + 9, 1940), P((255, 238, 180)))
    g = skia.RRect.MakeRectXY(skia.Rect(x + 34, 430, 1300, 1250), 8, 8); c.drawRRect(g, P((120, 170, 200))); c.drawRRect(g, SP((130, 86, 44), 7))
    c.save(); c.clipRRect(g, True); c.drawPath(poly([(x + 30, 560), (1300, 400), (1300, 500), (x + 30, 680)]), P((255, 255, 255), 70)); c.restore()
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 16, 900, x + 30, 1240), 7, 7), P((255, 232, 160))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 16, 900, x + 30, 1240), 7, 7), SP((130, 86, 44), 2.5))
    for yy in (1340, 1640): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 30, yy, 1300, yy + 240), 6, 6), SP((130, 86, 44), 5, 200))


def pigeon(c, x, y, s, t, ph, flip=1):
    pk = max(0.0, math.sin(t * 3.1 + ph)) ** 4                 # pecks now and then
    c.save(); c.translate(x, y); c.scale(s * flip, s)
    c.drawOval(skia.Rect(-26, -4, 30, 8), P(COOL, 90, MaskFilter=blur(4)))
    c.drawLine(-4, -6, -5, 2, SP((226, 120, 100), 2.6)); c.drawLine(6, -6, 7, 2, SP((226, 120, 100), 2.6))
    body = smooth_closed([(-30, -18), (-14, -30), (10, -30), (22, -18), (14, -6), (-10, -4), (-34, -10)]); shaded(c, body, (150, 158, 182), (110, 116, 150), sh=(-4, -4), rimL=(214, 220, 236), rl=(2, 2))
    c.drawPath(poly([(-34, -12), (-52, -8), (-30, -20)]), P((96, 102, 136)))
    hx, hy = 18 + 8 * pk, -38 + 26 * pk
    c.drawLine(12, -24, hx, hy, SP((96, 150, 140), 11)); c.drawCircle(hx, hy, 8, P((120, 130, 160))); c.drawPath(poly([(hx + 6, hy - 2), (hx + 16, hy + 2 + 3 * pk), (hx + 6, hy + 4)]), P((236, 180, 90))); c.drawCircle(hx + 2, hy - 2, 1.8, P((30, 20, 30)))
    c.restore()


def pigeon_land(c, x, y, s, t, t0, ph, flip=1):
    """a pigeon flying down to the paving and settling to peck"""
    u = (t - t0) / 0.95
    if u < 0: return
    if u >= 1: pigeon(c, x, y, s, t, ph, flip); return
    e = 1 - (1 - u) ** 2; px = x - flip * 300 * s * (1 - e); py = y - 20 * s - 380 * s * (1 - e) ** 1.4
    c.drawOval(skia.Rect(x - 26 * s, y - 3 * s, x + 30 * s, y + 8 * s), P(COOL, 70 * e, MaskFilter=blur(5)))
    fl = math.sin(t * 34 + ph)
    c.save(); c.translate(px, py); c.scale(s * flip, s); c.rotate(-14 * (1 - e))
    for sg, col in ((1, (110, 116, 150)), (-1, (170, 178, 200))):                                                   # far wing, then the body, then the near wing
        wp = smooth_closed([(-8, -22), (6, -24), (10 + 8 * sg, -24 - 44 * fl * sg - 12), (-14, -24 - 40 * fl * sg - 4)]); c.drawPath(wp, P(col))
        if sg == 1:
            body = smooth_closed([(-30, -18), (-14, -30), (10, -30), (22, -18), (14, -6), (-10, -4), (-34, -10)]); shaded(c, body, (150, 158, 182), (110, 116, 150), sh=(-4, -4), rimL=(214, 220, 236), rl=(2, 2))
            c.drawPath(poly([(-34, -12), (-56, -6), (-30, -22)]), P((96, 102, 136))); c.drawLine(12, -24, 22, -36, SP((96, 150, 140), 11)); c.drawCircle(22, -37, 8, P((120, 130, 160))); c.drawPath(poly([(28, -39), (38, -35), (28, -33)]), P((236, 180, 90))); c.drawCircle(24, -39, 1.8, P((30, 20, 30)))
            c.drawLine(-2, -6, -6, 4, SP((226, 120, 100), 2.6)); c.drawLine(8, -6, 6, 5, SP((226, 120, 100), 2.6))
    c.restore()


def newspaper(c, t, t0=0.4):
    """a sheet of newspaper tumbling across the square in the breeze"""
    u = (t - t0) / 4.6
    if u < 0 or u > 1.25: return
    x = 1010 - 760 * u; hop = abs(math.sin(u * math.pi * 3.2)); y = 1640 - 60 * u - 70 * hop
    c.drawOval(skia.Rect(x - 40, 1646 - 60 * u, x + 44, 1664 - 60 * u), P(COOL, 80 - 40 * hop, MaskFilter=blur(5)))
    c.save(); c.translate(x, y); c.rotate(-u * 560); c.scale(1.0, 0.5 + 0.5 * abs(math.cos(u * 9)))
    sh = poly([(-40, -28), (40, -30), (42, 28), (-38, 30)]); c.drawPath(sh, P((246, 242, 232))); c.drawPath(sh, SP((190, 186, 180), 2))
    c.drawRect(skia.Rect(-32, -22, 32, -12), P((70, 70, 80)))
    for j in range(4): c.drawRect(skia.Rect(-32, -4 + j * 8, 30 - (j % 2) * 16, -1 + j * 8), P((150, 150, 160)))
    c.restore()


def motes(c, t, a=1.0, col=(255, 244, 214)):
    for (x, ph, r, p2, k) in MOTES:
        yy = ((ph + t * 0.02 * k) % 1.0) * 1500 + 300; xx = x + 26 * math.sin(t * 0.5 * k + p2)
        c.drawCircle(xx, yy, r, P(col, 70 * k * a, MaskFilter=blur(1.2)))
