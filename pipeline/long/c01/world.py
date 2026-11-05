"""The kitchen at night, built in code from the Gemini reference ref/kitchen.png (layout, palette and light only; nothing
traced). World coordinates are the 1920x1080 frame at camera zoom 1. Scene life: the pendant lamp sways a little and
its warm cone follows, dust drifts in the beam, the city lights in the window twinkle, a thin cloud drifts past the
moon, and the faucet keeps dripping (the drop swells, falls, and rings out in the sink)."""
import math
import numpy as np
import skia
from kit import C, P, SP, sm, W, H, blur, text, hand, CREAM, AMBER

WALL, WALL_D, CEIL = (110, 132, 160), (28, 50, 92), (84, 104, 140)
CAB, CAB_D, CAB_L = (122, 138, 112), (98, 114, 92), (146, 160, 132)
TILE, TILE_L = (200, 192, 160), (222, 214, 182)
WOOD, WOOD_D, WOOD_L = (186, 126, 84), (130, 82, 52), (210, 150, 104)
FLOOR, FLOOR_D = (140, 86, 50), (110, 66, 38)
SINK, SINK_D = (232, 224, 214), (196, 188, 180)
FRIDGE, FRIDGE_D = (206, 192, 162), (164, 154, 138)
CHROME, CHROME_D, CHROME_L = (176, 184, 196), (120, 128, 142), (236, 240, 246)
NIGHT, NIGHT_L = (24, 34, 78), (52, 64, 120)
LAMP, LAMP_D = (176, 132, 62), (128, 92, 40)
WARM = (255, 196, 120)

SPOUT = (888, 560)          # where the drop hangs
SINK_HOLE = (900, 742)
FLOORY = 1010
DRIP = 1.0                  # seconds between drops


def rr(x0, y0, x1, y1, r):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def panel(c, x0, y0, x1, y1, col, dcol, light=1.0, knob=None):
    """a shaker cabinet door: body, inset panel with a shade edge, knob"""
    c.drawRRect(rr(x0, y0, x1, y1, 6), P(col))
    c.drawRRect(rr(x0 + 16, y0 + 16, x1 - 16, y1 - 16, 4), P(dcol))
    c.drawRRect(rr(x0 + 20, y0 + 22, x1 - 16, y1 - 16, 4), P(col))
    if knob:
        c.drawCircle(*knob, 6, P((150, 104, 66)))


def lamp_angle(t):
    return 1.6 * math.sin(t * 0.55) + 0.6 * math.sin(t * 1.3 + 1)


def lamp_pos(t):
    a = math.radians(lamp_angle(t))
    L = 230
    return 960 + L * math.sin(a), 0 + L * math.cos(a), a


def drop_phase(t):
    """0..1 swelling on the spout, then the fall; returns (u, k) with k the drop count"""
    k = math.floor(t / DRIP)
    return t / DRIP - k, k


def room(c, t, lamp=1.0, dark=0.0):
    # back wall with a soft vertical light falloff from the lamp
    c.drawRect(skia.Rect(0, 0, W, H), P(WALL))
    lx, ly, a = lamp_pos(t)
    g = skia.GradientShader.MakeRadial(skia.Point(lx, 420), 900, [C(WARM, int(70 * lamp)), C(WARM, 0)], [0, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=g, BlendMode=skia.BlendMode.kScreen))
    # ceiling and side walls (the stage box)
    c.drawRect(skia.Rect(0, 0, W, 120), P(CEIL))
    c.drawRect(skia.Rect(0, 112, W, 130), P((150, 168, 196)))
    for side in (0, 1):
        p = skia.Path()
        if side == 0:
            p.moveTo(0, 0); p.lineTo(120, 120); p.lineTo(120, 960); p.lineTo(0, H); p.close()
        else:
            p.moveTo(W, 0); p.lineTo(W - 120, 120); p.lineTo(W - 120, 960); p.lineTo(W, H); p.close()
        c.drawPath(p, P(WALL_D))
    # floor with planks
    c.drawRect(skia.Rect(0, 960, W, H), P(FLOOR))
    for k in range(9):
        y = 965 + k * 14 + k * k * 1.2
        c.drawLine(0, y, W, y, SP(FLOOR_D, 2, 120))
    g = skia.GradientShader.MakeRadial(skia.Point(lx, 1000), 520, [C(WARM, int(80 * lamp)), C(WARM, 0)], [0, 1])
    c.drawRect(skia.Rect(0, 960, W, H), skia.Paint(Shader=g, BlendMode=skia.BlendMode.kScreen))


def window(c, t):
    x0, y0, x1, y1 = 780, 222, 1146, 632
    c.drawRect(skia.Rect(x0 - 22, y0 - 22, x1 + 22, y1 + 22), P((214, 210, 202)))
    sky = skia.GradientShader.MakeLinear([skia.Point(0, y0), skia.Point(0, y1)], [C(NIGHT), C(NIGHT_L)])
    c.save(); c.clipRect(skia.Rect(x0, y0, x1, y1))
    c.drawRect(skia.Rect(x0, y0, x1, y1), skia.Paint(Shader=sky))
    rs = np.random.default_rng(3)
    for k in range(26):                       # stars
        x, y = rs.uniform(x0, x1), rs.uniform(y0, y0 + 200)
        c.drawCircle(x, y, rs.uniform(0.8, 1.8), P((230, 232, 255), 120 + 100 * math.sin(t * rs.uniform(0.6, 1.6) + k)))
    mx, my = 890, 330                          # crescent moon with a glow
    c.drawCircle(mx, my, 80, P((255, 240, 200), 40, MaskFilter=blur(30)))
    moon = skia.Path(); moon.addCircle(mx, my, 34)
    bite = skia.Path(); bite.addCircle(mx + 18, my - 10, 30)
    c.drawPath(skia.Op(moon, bite, skia.PathOp.kDifference_PathOp), P((255, 236, 186)))
    cx = x0 - 160 + ((t * 9) % (x1 - x0 + 320))     # a thin cloud drifting past
    for dx, dy, r in ((0, 0, 30), (34, -10, 26), (64, 4, 22), (-30, 6, 20)):
        c.drawCircle(cx + dx, 300 + dy, r, P((70, 82, 140), 150))
    # far city: building blocks with twinkling windows
    for k, (bx, bw, bh) in enumerate(((790, 70, 120), (860, 50, 170), (915, 90, 90), (1010, 60, 150), (1070, 76, 110))):
        c.drawRect(skia.Rect(bx, y1 - bh, bx + bw, y1), P((34, 44, 92)))
        for j in range(6):
            wx = bx + 10 + (j % 3) * (bw - 20) / 3; wy = y1 - bh + 18 + (j // 3) * 34
            on = 0.5 + 0.5 * math.sin(t * 0.7 + k * 1.7 + j * 2.3)
            c.drawRect(skia.Rect(wx, wy, wx + 8, wy + 10), P((255, 210, 130), 90 + 140 * on))
    for k in range(9):                          # soft bokeh lights
        x = x0 + 30 + k * 40; y = y1 - 60 + 14 * math.sin(k * 2.1)
        c.drawCircle(x, y, 9 + 3 * math.sin(k), P((255, 180, 120), 70 + 50 * math.sin(t * 0.9 + k), MaskFilter=blur(4)))
    c.restore()
    # sash bar and sill
    c.drawRect(skia.Rect(x0, (y0 + y1) / 2 - 6, x1, (y0 + y1) / 2 + 6), P((214, 210, 202)))
    c.drawRect(skia.Rect(x0 - 40, y1 + 14, x1 + 40, y1 + 34), P((230, 226, 218)))


def cabinets(c, t):
    for x0, x1 in ((160, 448), (452, 740)):
        panel(c, x0, 190, x1, 520, CAB, CAB_D, knob=(x1 - 34 if x0 < 300 else x0 + 34, 490))
    for x0, x1 in ((1172, 1460), (1464, 1756)):
        panel(c, x0, 190, x1, 540, CAB, CAB_D, knob=(x1 - 34 if x0 < 1400 else x0 + 34, 510))
    c.drawRect(skia.Rect(140, 176, 760, 192), P(CAB_L)); c.drawRect(skia.Rect(1152, 176, 1776, 192), P(CAB_L))


def backsplash(c):
    c.drawRect(skia.Rect(430, 520, 1500, 664), P(TILE))
    for y in range(520, 664, 36):
        c.drawLine(430, y, 1500, y, SP(TILE_L, 2))
    for k, y in enumerate(range(520, 664, 36)):
        for x in range(430 + (k % 2) * 30, 1500, 60):
            c.drawLine(x, y, x, y + 36, SP(TILE_L, 2))


def fridge(c, t):
    c.drawRRect(rr(140, 362, 422, 980, 26), P(FRIDGE))
    c.drawRRect(rr(140, 362, 176, 980, 18), P(FRIDGE_D))
    c.drawLine(150, 580, 420, 580, SP(FRIDGE_D, 4))
    c.drawRRect(rr(372, 420, 386, 540, 6), P((150, 146, 140))); c.drawRRect(rr(372, 620, 386, 780, 6), P((150, 146, 140)))
    # magnets: a note, a star, a round one
    c.drawRect(skia.Rect(190, 430, 240, 480), P((236, 232, 222)))
    star = skia.Path()
    for k in range(10):
        r = 22 if k % 2 == 0 else 10; a = -math.pi / 2 + k * math.pi / 5
        (star.moveTo if k == 0 else star.lineTo)(320 + r * math.cos(a), 450 + r * math.sin(a))
    star.close(); c.drawPath(star, P((214, 150, 64)))
    c.drawCircle(262, 420, 13, P((112, 98, 84)))


def counter(c, t):
    # lower cabinets
    for x0 in range(430, 1500, 214):
        x1 = x0 + 210
        if 790 < x0 < 1130:
            continue
        panel(c, x0, 716, x1, 958, CAB, CAB_D, knob=(x0 + 30, 750))
    c.drawRect(skia.Rect(430, 958, 1500, 968), P(CAB_D))
    # counter top with its front edge
    c.drawRect(skia.Rect(416, 662, 1524, 694), P(WOOD))
    c.drawRect(skia.Rect(416, 690, 1524, 708), P(WOOD_D))
    c.drawRect(skia.Rect(416, 662, 1524, 668), P(WOOD_L))
    # farmhouse sink front
    c.drawRRect(rr(802, 664, 1120, 790, 10), P(SINK))
    c.drawRRect(rr(812, 676, 1110, 700, 6), P(SINK_D))
    c.drawRect(skia.Rect(802, 790, 1120, 958), P(CAB))
    panel(c, 806, 796, 1116, 958, CAB, CAB_D)


def faucet(c, t, handle=0.0):
    """chrome gooseneck: base behind the sink rim, arch up, spout tip at SPOUT; handle turns by `handle` (0..1)"""
    p = skia.Path(); p.moveTo(960, 668); p.lineTo(960, 520); p.cubicTo(960, 448, 888, 448, 888, 520); p.lineTo(888, SPOUT[1] - 8)
    c.drawPath(p, SP(CHROME_D, 22)); c.drawPath(p, SP(CHROME, 16)); c.drawPath(p, SP(CHROME_L, 4, 200))
    c.drawRRect(rr(940, 640, 980, 672, 8), P(CHROME_D))
    c.drawRRect(rr(874, SPOUT[1] - 14, 902, SPOUT[1], 4), P(CHROME_D))
    # cross handle on the right of the base
    c.save(); c.translate(1004, 636); c.rotate(-80 * handle)
    c.drawRRect(rr(-6, -26, 6, 26, 5), P(CHROME)); c.drawRRect(rr(-26, -6, 26, 6, 5), P(CHROME))
    c.drawCircle(0, 0, 8, P(CHROME_L))
    c.restore()
    c.drawRect(skia.Rect(996, 636, 1012, 668), P(CHROME_D))


def drip(c, t, on=True, scale=1.0):
    """the drop forms on the spout and falls into the sink; a soft ring where it lands"""
    u, k = drop_phase(t)
    x, y = SPOUT
    if on:
        if u < 0.72:
            r = 4 + 8 * sm(u / 0.72)
            drop(c, x, y + r * 0.9, r)
        else:
            f = (u - 0.72) / 0.28
            yy = y + 12 + (SINK_HOLE[1] - 20 - y) * f * f
            drop(c, x, yy, 10, stretch=1 + 0.6 * f)
    # ring from the previous drop
    if on or u < 0.6:
        v = u
        if v < 0.6:
            rr_ = 10 + 60 * (v / 0.6)
            c.drawOval(skia.Rect(x - rr_, SINK_HOLE[1] - 8 - rr_ * 0.18, x + rr_, SINK_HOLE[1] - 8 + rr_ * 0.18), SP((180, 200, 230), 3, 200 * (1 - v / 0.6)))


def drop(c, x, y, r, stretch=1.0, a=1.0):
    p = skia.Path()
    p.moveTo(x, y - r * 1.5 * stretch)
    p.cubicTo(x + r * 0.5, y - r * 0.6, x + r, y, x + r, y + r * 0.2)
    p.cubicTo(x + r, y + r * 0.9, x - r, y + r * 0.9, x - r, y + r * 0.2)
    p.cubicTo(x - r, y, x - r * 0.5, y - r * 0.6, x, y - r * 1.5 * stretch)
    c.drawPath(p, P((150, 196, 236), 230 * a))
    c.drawCircle(x - r * 0.35, y - r * 0.05, r * 0.28, P((240, 250, 255), 220 * a))


def lamp(c, t, on=1.0):
    lx, ly, a = lamp_pos(t)
    c.drawLine(960, 0, lx, ly, SP((40, 40, 46), 4))
    c.save(); c.translate(lx, ly); c.rotate(-math.degrees(a))
    sh = skia.Path(); sh.moveTo(-80, 66); sh.cubicTo(-70, 4, 70, 4, 80, 66); sh.close()
    c.drawPath(sh, P(LAMP)); c.drawRect(skia.Rect(-80, 60, 80, 70), P(LAMP_D))
    c.drawRRect(rr(-10, -6, 10, 16, 4), P(LAMP_D))
    c.drawCircle(0, 70, 18, P((255, 236, 180), 255 * on))
    c.restore()


def light_cone(c, t, on=1.0):
    """the warm cone under the lamp, additive, with dust drifting in it"""
    lx, ly, a = lamp_pos(t)
    tip = (lx - 70 * math.sin(a), ly + 70)
    p = skia.Path(); p.moveTo(tip[0] - 70, tip[1]); p.lineTo(tip[0] + 70, tip[1])
    p.lineTo(tip[0] + 420 + 300 * math.sin(a), 980); p.lineTo(tip[0] - 420 + 300 * math.sin(a), 980); p.close()
    g = skia.GradientShader.MakeLinear([skia.Point(0, tip[1]), skia.Point(0, 980)], [C(WARM, int(120 * on)), C(WARM, int(18 * on))])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=g, BlendMode=skia.BlendMode.kScreen, MaskFilter=blur(14)))
    rs = np.random.default_rng(11)
    c.save(); c.clipPath(p, skia.ClipOp.kIntersect, True)
    for k in range(40):
        x = tip[0] + rs.uniform(-300, 300) + 20 * math.sin(t * 0.3 + k)
        y = tip[1] + ((rs.uniform(0, 600) + t * rs.uniform(4, 12)) % 600)
        c.drawCircle(x, y, rs.uniform(1, 2.4), P((255, 236, 200), (60 + 50 * math.sin(t * 0.8 + k)) * on))
    c.restore()


def chairs(c, t):
    for x in (1440, 1700):
        chair(c, x, back_left=(x > 1560))


def table(c, t, cup=True, notebook=True):
    cx, ty = 1560, 792
    c.drawRect(skia.Rect(cx - 16, ty, cx + 16, 980), P(WOOD_D))
    c.drawOval(skia.Rect(cx - 90, 966, cx + 90, 994), P(WOOD_D))
    c.drawOval(skia.Rect(cx - 210, ty - 22, cx + 210, ty + 22), P(WOOD))
    c.drawRect(skia.Rect(cx - 210, ty, cx + 210, ty + 14), P(WOOD_D))
    c.drawOval(skia.Rect(cx - 210, ty - 22, cx + 210, ty + 6), P(WOOD_L))
    if notebook:
        p = skia.Path(); p.moveTo(1460, 786); p.lineTo(1540, 774); p.lineTo(1620, 786); p.lineTo(1540, 798); p.close()
        c.drawPath(p, P((244, 240, 230))); c.drawLine(1540, 774, 1540, 798, SP((190, 186, 176), 2))
        c.drawLine(1630, 790, 1680, 776, SP((214, 172, 60), 5))
    if cup:
        medicine_cup(c, 1690, 790, 0.0)


def chair(c, x, back_left=False):
    bx = x + (60 if back_left else -60)
    c.drawRect(skia.Rect(bx - 8, 640, bx + 8, 860), P(WOOD_D))
    for y in (650, 690):
        c.drawRect(skia.Rect(bx - 12, y, bx + 12, y + 12), P(WOOD))
    c.drawRect(skia.Rect(x - 70, 850, x + 70, 866), P(WOOD))
    for lx in (x - 60, x + 60):
        c.drawRect(skia.Rect(lx - 6, 866, lx + 6, 990), P(WOOD_D))


def medicine_cup(c, x, y, fill, s=1.0, a=1.0, marks=False):
    """a small clear medicine cup with tick marks; fill 0..1 of its 30 mL"""
    c.save(); c.translate(x, y); c.scale(s, s)
    p = skia.Path(); p.moveTo(-22, -46); p.lineTo(22, -46); p.lineTo(16, 0); p.lineTo(-16, 0); p.close()
    if fill > 0.01:
        hgt = 46 * fill
        q = skia.Path(); q.moveTo(-16 - 6 * fill, -hgt); q.lineTo(16 + 6 * fill, -hgt); q.lineTo(16, 0); q.lineTo(-16, 0); q.close()
        c.drawPath(q, P((150, 196, 236), 200 * a))
        c.drawLine(-16 - 6 * fill, -hgt, 16 + 6 * fill, -hgt, SP((220, 240, 255), 2, 230 * a))
    c.drawPath(p, P((230, 240, 250), 70 * a)); c.drawPath(p, SP((210, 226, 240), 2.4, 220 * a))
    if marks:
        for k in range(1, 4):
            yy = -46 * k / 3; c.drawLine(10, yy, 18 - 2 * k / 3, yy, SP((120, 130, 150), 2, 220 * a))
    c.restore()


def stool(c, x):
    c.drawRect(skia.Rect(x - 70, 912, x + 70, 930), P((214, 150, 90)))
    for lx in (x - 56, x + 56):
        c.drawRect(skia.Rect(lx - 7, 930, lx + 7, 1004), P((176, 116, 66)))
    c.drawRect(skia.Rect(x - 60, 968, x + 60, 976), P((176, 116, 66)))


def kitchen(c, t, cast=None, lamp_on=1.0, drip_on=True, handle=0.0, cup_on_table=True, front=None):
    """the whole kitchen; cast(c) draws the people between the counter and the light (so the beam lies over them)"""
    room(c, t, lamp_on)
    cabinets(c, t)
    window(c, t)
    backsplash(c)
    fridge(c, t)
    counter(c, t)
    faucet(c, t, handle)
    drip(c, t, drip_on)
    chairs(c, t)
    if cast:
        cast(c)
    table(c, t, cup=cup_on_table)
    if front:
        front(c)
    night(c, t, lamp_on)
    light_cone(c, t, lamp_on)
    lamp(c, t, lamp_on)


def night(c, t, on=1.0):
    """night grade: warm where the lamp reaches, cool dim blue toward the corners (multiply)"""
    lx, ly, a = lamp_pos(t)
    g = skia.GradientShader.MakeRadial(skia.Point(lx, 640), 1150, [C((255, 236, 210)), C((200, 196, 210)), C((92, 104, 156))], [0, 0.42, 1])
    c.drawRect(skia.Rect(-200, -200, W + 200, H + 200), skia.Paint(Shader=g, BlendMode=skia.BlendMode.kMultiply))


def camera(c, z, fx, fy, ox=W / 2, oy=H / 2):
    """zoom z about world point (fx, fy), placed at screen (ox, oy); the view never leaves the drawn room"""
    z = max(1.0, z)
    hw, hh = ox / z, oy / z
    fx = min(max(fx, hw), W - (W - ox) / z); fy = min(max(fy, hh), H - (H - oy) / z)
    c.translate(ox, oy); c.scale(z, z); c.translate(-fx, -fy)


def finish(c, t, dark=False, vig=0.14, grain=True):
    """film finish (premium standard 0a): soft bloom on highlights is approximated by the additive light already drawn;
    here a gentle warm grade, a light vignette and fine moving grain"""
    c.drawRect(skia.Rect(0, 0, W, H), P((255, 200, 150), 10, BlendMode=skia.BlendMode.kSoftLight))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * 0.7, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((6, 8, 20), int(255 * vig * 1.6))], [0, 0.55, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    if grain:
        grain_layer(c, t)


_GR = None


def grain_layer(c, t):
    global _GR
    if _GR is None:
        rs = np.random.default_rng(7)
        _GR = []
        for k in range(6):
            a = (rs.normal(128, 40, (H // 2, W // 2))).clip(0, 255).astype(np.uint8)
            rgba = np.dstack([a, a, a, np.full_like(a, 9)])
            _GR.append(skia.Image.fromarray(np.ascontiguousarray(rgba), colorType=skia.kRGBA_8888_ColorType))
    img = _GR[int(t * 24) % len(_GR)]
    c.drawImageRect(img, skia.Rect(0, 0, W, H), skia.SamplingOptions(), skia.Paint(BlendMode=skia.BlendMode.kOverlay))
