"""Story settings built in code from the Gemini scene references ref/patio.png and ref/kitchen.png (layout, colours,
light from the upper left): the backyard patio with the garden bed, the kitchen at lunch, and the props (pot, soil,
the tomato plant at any growth stage, the kitchen scale with its readout, the plant food bag, the lunch).
Coordinates: reference pixels (1062 x 593) scaled to the 1920 x 1080 frame; props take frame pixels."""
import math
import numpy as np
import skia
from gk import P, SP, C, poly, smooth_closed, flat, blur, mix
import kit as K

S = 1920 / 1062.0
RIM = (255, 214, 140)


def part(c, path, base, shade=None, sh=8, rim_a=170, a=255):
    flat(c, path, base, shade if shade is not None else tuple(v * 0.8 for v in base), sh_off=(-sh, 0), rim=RIM, rim_d=(2.5, 2.5), rim_a=rim_a, a=a)


def blob(pts_r):
    p = skia.Path()
    for x, y, r in pts_r:
        p.addCircle(x, y, r)
    return skia.Op(p, p, skia.PathOp.kUnion_PathOp) or p


def tree(c, x, y, r, col, sh, t, k, trunk=(120, 92, 70)):
    sway = 2.5 * math.sin(t * 0.7 + k)
    c.drawPath(poly([(x - 6, y + r * 0.2), (x + 6, y + r * 0.2), (x + 9, y + r * 2.2), (x - 9, y + r * 2.2)]), P(trunk))
    c.drawPath(poly([(x, y + r * 0.9), (x + 4, y + r * 1.1), (x - r * 0.5, y + r * 0.5), (x - r * 0.48, y + r * 0.42)]), P(trunk))
    b = blob([(x + sway, y, r), (x - r * 0.7 + sway, y + r * 0.35, r * 0.75), (x + r * 0.7 + sway, y + r * 0.3, r * 0.8),
              (x - r * 0.2 + sway * 1.3, y - r * 0.6, r * 0.7), (x + r * 0.35 + sway * 1.3, y - r * 0.45, r * 0.6)])
    part(c, b, col, sh, sh=r * 0.22, rim_a=150)
    # inner leaf clusters, one tone lighter
    part(c, blob([(x - r * 0.25 + sway, y - r * 0.15, r * 0.42), (x + r * 0.1 + sway, y - r * 0.3, r * 0.36)]), mix(col, (255, 255, 230), 0.12), col, sh=r * 0.1, rim_a=120)


# ------------------------------------------------------------------------------------------------ patio
def patio_bg(c, t, cam=0.0, warm=0.0, house=True):
    """the backyard patio: sky, hazy trees, fence, the house wall and door, the paving, the raised garden bed"""
    c.save()
    c.translate(-cam * 30, 0)
    c.scale(S, S)
    sky0, sky1 = (186, 224, 236), (236, 244, 232)
    c.drawRect(skia.Rect(-60, -20, 1200, 620), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 300)], [C(sky0), C(sky1)])))
    c.drawCircle(160, 40, 90, P((255, 246, 210), 150 * (0.6 + 0.4 * warm), MaskFilter=blur(60)))
    for k, (x0, y0, r) in enumerate(((560, 90, 26), (860, 60, 30), (1000, 130, 20))):
        x = (x0 + t * 3 + k * 40) % 1250 - 80
        cl = blob([(x - r, y0 + 4, r * 0.7), (x, y0, r), (x + r, y0 + 5, r * 0.75)])
        c.drawPath(cl, P((255, 255, 252), 200))
    # far hazy trees
    for k, (x, y, r) in enumerate(((640, 245, 52), (760, 225, 60), (900, 240, 50), (1010, 250, 48), (560, 260, 40))):
        tree(c, x - cam * 6, y, r, (198, 220, 188), (184, 208, 176), t, k, trunk=(176, 190, 168))
    c.drawRect(skia.Rect(420, 250, 1200, 300), P((210, 228, 200), 160, MaskFilter=blur(14)))
    # mid trees
    tree(c, 520 - cam * 10, 140, 78, (128, 164, 118), (104, 140, 100), t, 3, trunk=(126, 98, 74))
    tree(c, 975 - cam * 10, 150, 86, (140, 176, 110), (112, 148, 92), t, 5, trunk=(126, 98, 74))
    # fence
    c.drawRect(skia.Rect(420, 300, 1200, 450), P((178, 128, 78)))
    for i in range(30):
        x = 428 + i * 26
        top = 292 + (6 if i % 2 else 0)
        pk = poly([(x, top + 6), (x + 10, top), (x + 21, top + 6), (x + 21, 452), (x, 452)])
        part(c, pk, (204, 152, 96), (176, 126, 76), sh=5, rim_a=120)
    c.drawRect(skia.Rect(420, 336, 1200, 344), P((168, 118, 70)))
    c.drawRect(skia.Rect(420, 412, 1200, 420), P((168, 118, 70)))
    # hose on the fence
    for rr, w in ((40, 11), (30, 11)):
        c.drawCircle(775, 372, rr, SP((40, 112, 72), w))
    c.drawCircle(775, 372, 40, SP((60, 140, 92), 3))
    c.drawRect(skia.Rect(770, 330, 780, 340), P((150, 150, 150)))
    # grass strip and bushes along the fence foot
    c.drawRect(skia.Rect(420, 440, 1200, 470), P((150, 180, 92)))
    part(c, blob([(440, 430, 26), (470, 440, 22)]), (110, 150, 84), (88, 126, 70), sh=5)
    # paving
    c.drawRect(skia.Rect(-60, 455, 1200, 620), P((226, 220, 206)))
    for row, y in enumerate((462, 500, 545, 590)):
        for i in range(12):
            x = -40 + i * 110 + (55 if row % 2 else 0)
            c.drawRect(skia.Rect(x, y, x + 3, y + 40), P((206, 198, 184)))
        c.drawRect(skia.Rect(-60, y, 1200, y + 3), P((206, 198, 184)))
    # soft shade under the house eave on the paving
    c.drawPath(poly([(0, 455), (430, 455), (250, 600), (0, 600)]), P((180, 176, 170), 40))
    # raised bed (right)
    bed_front = poly([(660, 440), (1200, 440), (1200, 556), (690, 556)])
    part(c, poly([(660, 430), (1200, 430), (1200, 446), (660, 446)]), (176, 124, 82), (146, 100, 66), sh=4)
    part(c, bed_front, (150, 102, 66), (124, 84, 54), sh=10)
    c.drawRect(skia.Rect(690, 494, 1200, 499), P((124, 84, 54)))
    c.drawRect(skia.Rect(668, 432, 1200, 444), P((80, 58, 46)))
    for k, (x, r) in enumerate(((720, 22), (760, 26), (812, 24), (860, 22), (905, 28))):
        sw = 1.5 * math.sin(t * 1.1 + k)
        part(c, blob([(x + sw, 420, r), (x - r * 0.6 + sw, 428, r * 0.7), (x + r * 0.6 + sw, 428, r * 0.7)]), (126, 180, 80), (98, 150, 64), sh=5)
    for k, x in enumerate((945, 985, 1025, 1060)):
        c.drawRect(skia.Rect(x - 2, 360, x + 2, 434), P((150, 110, 70)))
        sw = 1.5 * math.sin(t * 1.2 + k)
        part(c, blob([(x - 10 + sw, 390, 12), (x + 10 + sw, 405, 12), (x + sw, 372, 11)]), (100, 156, 74), (78, 128, 60), sh=4)
        for dx, dy in ((-8, 400), (9, 382)):
            c.drawCircle(x + dx + sw, dy, 6, P((222, 70, 54)))
    # grass corner
    c.drawPath(poly([(880, 593), (1200, 560), (1200, 620), (880, 620)]), P((150, 180, 84)))
    if house:
        # house wall, roof edge, door and step
        wall = poly([(-60, -20), (380, -20), (430, 70), (430, 470), (-60, 560)])
        c.drawPath(wall, P((248, 230, 190)))
        c.drawPath(poly([(330, -20), (380, -20), (430, 70), (430, 470), (400, 474), (400, 60)]), P((236, 212, 168)))
        part(c, poly([(270, -20), (300, -20), (462, 84), (446, 96)]), (150, 116, 88), (120, 92, 70), sh=6)
        frame = poly([(130, 95), (300, 130), (300, 505), (130, 520)])
        part(c, frame, (218, 166, 104), (186, 136, 82), sh=8)
        glass = poly([(150, 128), (280, 152), (280, 488), (150, 498)])
        c.drawPath(glass, P((150, 170, 168)))
        c.drawPath(poly([(150, 300), (280, 290), (280, 488), (150, 498)]), P((134, 150, 146)))
        c.drawPath(poly([(170, 140), (200, 146), (160, 330), (152, 300)]), P((200, 220, 214), 160))
        c.drawRect(skia.Rect(272, 300, 286, 320), P((210, 210, 214)))
        part(c, poly([(130, 512), (360, 482), (360, 520), (140, 552)]), (234, 146, 100), (200, 116, 80), sh=6)
    c.restore()


def table(c, x, y, s=1.0):
    """round wooden patio table, top centre at (x, y) in frame pixels"""
    c.save(); c.translate(x, y); c.scale(s, s)
    for dx in (-110, 110):
        part(c, poly([(dx - 8, 10), (dx + 8, 10), (dx * 1.25 + 9, 210), (dx * 1.25 - 9, 210)]), (170, 120, 70), (140, 96, 56), sh=5)
    part(c, poly([(-8, 10), (8, 10), (10, 190), (-10, 190)]), (150, 104, 60), (124, 86, 50), sh=4)
    top = skia.Path(); top.addOval(skia.Rect(-175, -18, 175, 22))
    part(c, top, (224, 172, 104), (190, 140, 82), sh=10)
    c.drawPath(poly([(-175, 4), (175, 4), (172, 18), (-172, 18)]), P((176, 126, 74)))
    c.drawOval(skia.Rect(-170, 190, 170, 226), P((60, 60, 70), 40, MaskFilter=blur(8)))
    c.restore()


def scale_(c, x, y, s=1.0, reading=None, a=1.0, hl=0.0):
    """white kitchen scale with a flat platform and a digital readout; (x, y) = platform centre top"""
    c.save(); c.translate(x, y); c.scale(s, s)
    body = smooth_closed([(-95, 6), (95, 6), (104, 70), (-104, 70)])
    part(c, body, (244, 244, 246), (212, 214, 222), sh=8, a=255 * a)
    part(c, poly([(-110, -6), (110, -6), (110, 8), (-110, 8)]), (226, 228, 234), (196, 198, 208), sh=6, a=255 * a)
    lcd = skia.RRect.MakeRectXY(skia.Rect(-62, 20, 62, 58), 8, 8)
    c.drawRRect(lcd, P((40, 52, 60), 255 * a))
    if hl > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-68, 14, 68, 64), 11, 11), SP(K.AMBER, 4, 255 * hl * a))
    if reading:
        K.text(c, reading, 0, 50, 28, (150, 240, 200), a, 'xb', 'center')
    c.restore()


def pot(c, x, y, s=1.0, soil=True, cut=0.0, roots=0.0, t=0.0):
    """terracotta pot standing on (x, y) (bottom centre). cut: a cutaway showing the soil and roots inside."""
    c.save(); c.translate(x, y); c.scale(s, s)
    body = poly([(-62, -118), (62, -118), (48, 0), (-48, 0)])
    part(c, body, (196, 104, 64), (162, 82, 50), sh=10)
    part(c, poly([(-70, -132), (70, -132), (70, -110), (-70, -110)]), (210, 116, 74), (176, 92, 58), sh=8)
    if soil:
        c.drawOval(skia.Rect(-62, -138, 62, -124), P((74, 54, 42)))
    if cut > 0:
        win = poly([(-50, -104), (50, -104), (40, -12), (-40, -12)])
        c.save(); c.clipPath(win, skia.ClipOp.kIntersect, True)
        c.drawPath(win, P((86, 62, 48), 255 * cut))
        rs = np.random.default_rng(3)
        for k in range(18):
            c.drawCircle(rs.uniform(-45, 45), rs.uniform(-100, -16), rs.uniform(2, 5), P((112, 84, 64), 255 * cut))
        if roots > 0:
            for k, (ex, ey) in enumerate(((-30, -30), (-8, -18), (20, -26), (36, -60), (-38, -70))):
                pth = skia.Path(); pth.moveTo(0, -120); pth.quadTo(ex * 0.3, (ey - 120) / 2, ex, ey)
                c.drawPath(pth, SP((236, 222, 196), 3.2, 255 * cut * roots))
        c.restore()
        c.drawPath(win, SP((150, 74, 44), 4, 255 * cut))
    c.restore()


def tomato_plant(c, x, y, g, t=0.0, s=1.0, yellow=0.0, roots=0.0, glow=0.0):
    """a tomato plant growing from (x, y) (soil level). g: 0 = seed, 1 = knee high with flowers and small tomatoes."""
    if g <= 0.01:
        c.drawOval(skia.Rect(x - 6 * s, y - 4 * s, x + 6 * s, y + 4 * s), P((214, 196, 150)))
        return
    c.save(); c.translate(x, y); c.scale(s, s)
    hgt = 30 + 300 * g
    sw = 4 * math.sin(t * 1.1) * g
    leaf = mix((84, 150, 70), (200, 186, 70), yellow); leaf_sh = mix((64, 122, 58), (170, 150, 54), yellow)
    stem = skia.Path(); stem.moveTo(0, 0); stem.quadTo(6, -hgt * 0.5, sw, -hgt)
    c.drawPath(stem, SP((96, 140, 64), 7 + 4 * g))
    if roots > 0:
        for ex, ey in ((-40, 40), (-15, 58), (14, 62), (38, 44), (-30, 70), (30, 72)):
            r = skia.Path(); r.moveTo(0, 0); r.quadTo(ex * 0.4, ey * 0.6, ex * roots, ey * roots)
            c.drawPath(r, SP((232, 216, 186), 3.5))
        c.drawPath(blob([(0, 22, 26 * roots), (-14, 30, 18 * roots), (14, 32, 18 * roots)]), P((86, 62, 48)))
    n = 2 + int(8 * g)
    for i in range(n):
        f = (i + 1) / (n + 1)
        yy = -hgt * f; xx = sw * f
        side = -1 if i % 2 else 1
        L = (40 + 50 * g) * (1 - f * 0.35)
        lw = sw * 0.5 + 2 * math.sin(t * 1.4 + i)
        br = skia.Path(); br.moveTo(xx, yy); br.quadTo(xx + side * L * 0.5, yy - 14, xx + side * L + lw, yy - 4)
        c.drawPath(br, SP((96, 140, 64), 4))
        for j, (u, r) in enumerate(((0.45, 0.32), (0.75, 0.36), (1.0, 0.42))):
            lx = xx + side * L * u + lw * u; ly = yy - 10 * math.sin(u * 3.0) + (6 if j % 2 else -6)
            lf = smooth_closed([(lx - r * 30, ly), (lx, ly - r * 22), (lx + r * 30, ly), (lx, ly + r * 20)])
            part(c, lf, leaf, leaf_sh, sh=4, rim_a=120)
        if g > 0.75 and i in (2, 4):
            fr = (g - 0.75) / 0.25
            c.drawCircle(xx + side * L * 0.6, yy + 16, 10 * fr, P((150, 196, 80)))
    # top cluster
    part(c, blob([(sw - 14, -hgt, 16 + 6 * g), (sw + 14, -hgt + 4, 14 + 6 * g), (sw, -hgt - 14, 14 + 6 * g)]), leaf, leaf_sh, sh=5)
    if glow > 0:
        c.drawCircle(sw, -hgt * 0.6, hgt * 0.6, P(K.AMBER, 60 * glow, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    c.restore()


def plant_food(c, x, y, s=1.0, tilt=0.0, a=1.0):
    """a small bag of plant food with N P K drawn on it (code text)"""
    c.save(); c.translate(x, y); c.rotate(tilt); c.scale(s, s)
    bag = smooth_closed([(-46, -70), (46, -70), (52, 60), (-52, 60)])
    part(c, bag, (240, 230, 200), (210, 198, 168), sh=8, a=255 * a)
    c.drawRect(skia.Rect(-46, -76, 46, -62), P((120, 160, 80), 255 * a))
    c.drawPath(blob([(-12, -26, 14), (8, -32, 12), (0, -16, 12)]), P((110, 170, 80), 255 * a))
    K.text(c, 'N-P-K', 0, 30, 24, (60, 60, 70), a, 'xb', 'center')
    c.restore()


def scoop(c, x, y, ang=0.0, pour=0.0, t=0.0):
    c.save(); c.translate(x, y); c.rotate(ang)
    part(c, poly([(-8, -4), (60, -4), (60, 4), (-8, 4)]), (110, 110, 120), sh=3)
    part(c, smooth_closed([(55, -18), (110, -20), (114, 10), (60, 16)]), (186, 190, 200), (150, 154, 166), sh=5)
    c.restore()
    if pour > 0:
        rs = np.random.default_rng(int(t * 30) % 7)
        for k in range(14):
            yy = (k * 13 + t * 300) % 140
            c.drawCircle(x + 90 + rs.uniform(-8, 8), y + 20 + yy, 3.2, P((150, 200, 230), 220 * pour))


# ------------------------------------------------------------------------------------------------ kitchen
KS = 1920 / 1062.0


def kitchen_bg(c, t, cam=0.0):
    c.save(); c.translate(-cam * 20, 0); c.scale(KS, KS)
    c.drawRect(skia.Rect(-60, -20, 1200, 620), P((182, 220, 190)))
    # sun shaft from the window
    c.drawPath(poly([(340, 60), (720, 40), (900, 470), (300, 470)]), P((214, 236, 206), 160))
    # window with the garden outside
    fr = poly([(340, 38), (722, 38), (722, 420), (340, 420)])
    part(c, fr, (196, 132, 74), (166, 108, 58), sh=10)
    view = skia.Rect(372, 66, 690, 400)
    c.save(); c.clipRect(view)
    c.drawRect(view, skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 66), skia.Point(0, 300)], [C((226, 240, 222)), C((206, 230, 196))])))
    tree(c, 440, 180, 60, (150, 190, 120), (126, 166, 104), t, 1)
    tree(c, 640, 170, 70, (126, 176, 110), (104, 150, 92), t, 2)
    c.drawRect(skia.Rect(372, 280, 690, 345), P((206, 158, 104)))
    for i in range(14):
        c.drawRect(skia.Rect(376 + i * 24, 276, 394 + i * 24, 345), P((216, 170, 112)))
    c.drawRect(skia.Rect(372, 340, 690, 400), P((132, 184, 92)))
    c.drawPath(poly([(590, 350), (690, 340), (690, 390), (600, 400)]), P((150, 104, 66)))
    for k, x in enumerate((610, 640, 668)):
        c.drawPath(blob([(x, 340, 12), (x + 8, 346, 10)]), P((110, 170, 80)))
    c.restore()
    c.drawRect(skia.Rect(526, 66, 536, 400), P((196, 132, 74)))
    c.drawRect(skia.Rect(532, 220, 540, 260), P((214, 214, 220)))
    part(c, poly([(330, 418), (732, 418), (732, 438), (330, 438)]), (204, 140, 80), (172, 116, 64), sh=6)
    # shelves with jars and herbs
    for x0 in (0, 750):
        part(c, poly([(x0, 198), (x0 + 312, 198), (x0 + 312, 212), (x0, 212)]), (196, 128, 70), (166, 104, 56), sh=5)
        for k, (dx, col) in enumerate(((30, (150, 90, 60)), (72, (120, 80, 50)), (114, (200, 160, 120)))):
            part(c, poly([(x0 + dx, 160), (x0 + dx + 30, 160), (x0 + dx + 30, 198), (x0 + dx, 198)]), col, sh=4)
            c.drawRect(skia.Rect(x0 + dx - 1, 154, x0 + dx + 31, 162), P((236, 226, 210)))
        for k, dx in enumerate((190, 248)):
            part(c, poly([(x0 + dx - 20, 165), (x0 + dx + 20, 165), (x0 + dx + 15, 198), (x0 + dx - 15, 198)]), (196, 104, 64), sh=4)
            sw = 1.5 * math.sin(t * 1.3 + k + x0)
            part(c, blob([(x0 + dx + sw, 138, 14), (x0 + dx - 12 + sw, 150, 12), (x0 + dx + 12 + sw, 148, 12)]), (100, 150, 80), (80, 124, 64), sh=4)
    # cabinets
    for x0, x1 in ((-60, 318), (746, 1200)):
        part(c, poly([(x0, 340), (x1, 340), (x1, 470), (x0, 470)]), (166, 100, 52), (140, 82, 42), sh=8)
        part(c, poly([(x0, 330), (x1 + 6, 330), (x1 + 6, 344), (x0, 344)]), (206, 140, 80), (176, 116, 64), sh=5)
        for i in range(3):
            xa = x0 + 20 + i * (x1 - x0) / 3
            c.drawRect(skia.Rect(xa, 360, xa + (x1 - x0) / 3 - 30, 400), P((180, 112, 60)))
            c.drawCircle(xa + ((x1 - x0) / 3 - 30) / 2, 380, 4, P((110, 70, 40)))
    c.restore()


def kitchen_table(c, t, items=1.0, bread_cut=0.0, hl=None):
    """the table across the lower third with the lunch on it. hl: name of an item to glow."""
    c.save(); c.scale(KS, KS)
    top = poly([(-60, 474), (1200, 474), (1200, 620), (-60, 620)])
    part(c, top, (206, 146, 82), (176, 120, 66), sh=0)
    c.drawRect(skia.Rect(-60, 474, 1200, 482), P((226, 170, 104)))
    c.drawRect(skia.Rect(-60, 560, 1200, 620), P((172, 116, 64)))
    for x in (300, 640, 900):
        c.drawRect(skia.Rect(x, 482, x + 3, 560), P((186, 128, 72)))
    c.restore()
    if items <= 0:
        return {}
    pos = {}
    a = items
    c.save(); c.scale(KS, KS)
    # bread on a board
    part(c, skia.Path().addRRect(skia.RRect.MakeRectXY(skia.Rect(176, 488, 420, 540), 10, 10)), (190, 136, 80), (160, 110, 64), sh=6, a=255 * a)
    loaf = smooth_closed([(214, 520), (216, 470), (250, 452), (300, 454), (322, 474), (322, 520)])
    part(c, loaf, (184, 116, 54), (150, 90, 40), sh=8, a=255 * a)
    for k, dx in enumerate((0, 30)):
        sl = smooth_closed([(306 + dx, 524), (304 + dx, 494), (330 + dx, 486), (360 + dx, 494), (366 + dx, 524)])
        part(c, sl, (236, 210, 160), (210, 180, 130), sh=5, a=255 * a)
    pos['bread'] = (270 * KS, 490 * KS)
    # butter
    c.drawOval(skia.Rect(430, 524, 528, 548), P((236, 236, 240), 255 * a))
    part(c, poly([(448, 512), (508, 512), (510, 534), (446, 534)]), (252, 240, 180), (230, 216, 150), sh=5, a=255 * a)
    pos['butter'] = (478 * KS, 520 * KS)
    # cheese
    c.drawOval(skia.Rect(518, 496, 628, 520), P((236, 236, 240), 255 * a))
    ch = poly([(538, 506), (606, 506), (606, 470), (572, 462)])
    part(c, ch, (246, 182, 60), (214, 150, 44), sh=6, a=255 * a)
    for hx, hy in ((560, 490), (590, 480), (580, 498)):
        c.drawCircle(hx, hy, 4, P((214, 150, 44), 255 * a))
    pos['cheese'] = (575 * KS, 485 * KS)
    # tomatoes
    c.drawOval(skia.Rect(646, 508, 796, 540), P((236, 236, 240), 255 * a))
    for k, (tx, ty) in enumerate(((680, 514), (712, 508), (740, 516), (764, 510), (700, 524), (735, 528))):
        c.drawCircle(tx, ty, 15, P((232, 82, 62), 255 * a))
        c.drawCircle(tx, ty, 9, P((250, 120, 96), 255 * a))
    pos['tomato'] = (720 * KS, 515 * KS)
    # glasses of water
    for gx in (770, 855):
        c.drawPath(poly([(gx - 20, 436), (gx + 20, 436), (gx + 17, 492), (gx - 17, 492)]), P((210, 236, 240), 170 * a))
        c.drawPath(poly([(gx - 18, 452), (gx + 18, 452), (gx + 17, 492), (gx - 17, 492)]), P((170, 214, 230), 170 * a))
    c.restore()
    if hl:
        x, y = pos[hl]
        c.drawCircle(x, y, 120, P(K.AMBER, 90, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    return pos


def chair(c, x, s=1.0):
    c.save(); c.translate(x, 0); c.scale(KS * s, KS)
    for dx in (0, 110):
        part(c, poly([(dx, 340), (dx + 14, 336), (dx + 22, 480), (dx + 8, 480)]), (160, 96, 48), (132, 78, 38), sh=4)
    part(c, poly([(4, 344), (120, 340), (122, 380), (6, 384)]), (180, 112, 58), (150, 92, 46), sh=5)
    for k in range(4):
        xx = 26 + k * 24
        c.drawRect(skia.Rect(xx, 384, xx + 10, 474), P((168, 102, 52)))
    c.restore()
