"""Marco's small bakery at night, built in code in the house flat style (front view across the workbench, like a
cooking show set). Set coordinates are the wide shot at zoom 1 (1920x1080). Layers: back wall (plaster over cream subway
tile), window on the left (night sky, rooftops; dawn at the end), wall clock, his starter chart taped to the wall,
shelves with loaves and flour on the right, the oven glowing behind the bench on the right, a pendant lamp, then Marco
behind the bench, then the bench with the jar, notebook, flour bag and bowl in front.
Scene life: the lamp breathes, flour motes drift in its light, the oven glow flickers, bubbles rise in the starter,
stars twinkle, the clock's second hand moves. Every shot gets a slow camera push (premium standard)."""
import math
import numpy as np
import skia
from kit import C, P, SP, sm, W, H, blur, text, CREAM, AMBER
import world as WD
import kit as K
import marco as MC

WALL, WALL_D, WALL_L = (214, 170, 128), (176, 132, 100), (236, 196, 152)
TILE, TILE_L, GROUT = (238, 226, 204), (252, 244, 228), (196, 178, 156)
WOOD, WOOD_D, WOOD_L = (176, 112, 70), (130, 78, 52), (212, 150, 100)
BENCH_TOP, BENCH_EDGE = (214, 164, 112), (160, 108, 72)
GLASS = (200, 226, 236)
STARTER, STARTER_D, STARTER_L = (240, 228, 196), (210, 192, 152), (255, 248, 226)
BAND = (226, 84, 70)
INK = (52, 46, 70)
BENCH_Y = 742            # top surface front edge at zoom 1
JAR_X, JAR_BASE = 1290, 770
CHART = (1000, 226, 1250, 436)   # the taped chart's rectangle at zoom 1
MX = 760
LS = 1.0          # tape label scale (close ups set it smaller)
PX_CM = 22.0             # jar scale at zoom 1: 22 px per centimetre
RS = np.random.default_rng(11)
MOTES = [(RS.uniform(600, 1400), RS.uniform(80, 700), RS.uniform(1.5, 4), RS.uniform(0, 6.28), RS.uniform(0.3, 1)) for _ in range(46)]
STARS = [(RS.uniform(130, 510), RS.uniform(150, 380), RS.uniform(1, 2.6), RS.uniform(0, 6.28)) for _ in range(22)]
BUB = [(RS.uniform(-0.8, 0.8), RS.uniform(0, 1), RS.uniform(0.5, 1.4), RS.uniform(0.3, 1.0)) for _ in range(40)]


def rr(x0, y0, x1, y1, r):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def dawn_of(t_story):
    """0 at night, 1 at full dawn light"""
    return t_story


# ------------------------------------------------------------------ the back of the room
def wall(c, t, dawn=0.0):
    c.drawRect(skia.Rect(-300, -300, W + 300, 460), P(WALL))
    g = skia.GradientShader.MakeRadial(skia.Point(960, 120), 1100, [C(WALL_L), C(WALL), C(WALL_D)], [0, 0.45, 1])
    c.drawRect(skia.Rect(-300, -300, W + 300, 460), skia.Paint(Shader=g))
    c.drawRect(skia.Rect(-300, 452, W + 300, 470), P(WOOD_D))                                   # a wooden rail between plaster and tile
    c.drawRect(skia.Rect(-300, 452, W + 300, 458), P(WOOD_L, 160))
    c.drawRect(skia.Rect(-300, 470, W + 300, 900), P(TILE))
    for r in range(0, 9):                                                                         # subway tile, offset rows
        y = 470 + r * 46
        c.drawLine(-300, y, W + 300, y, SP(GROUT, 2.2))
        off = 0 if r % 2 == 0 else 46
        for x in range(-300 + off, W + 300, 92):
            c.drawLine(x, y, x, y + 46, SP(GROUT, 2.2))
            c.drawRect(skia.Rect(x + 6, y + 6, x + 40, y + 12), P(TILE_L, 150))
    # warm light pooling under the lamp, cooler corners
    g = skia.GradientShader.MakeRadial(skia.Point(960, 260), 900, [C((255, 220, 160), 70), C((255, 200, 140), 0)], [0, 1])
    c.drawRect(skia.Rect(-300, -300, W + 300, 900), skia.Paint(Shader=g))
    vg = skia.GradientShader.MakeRadial(skia.Point(960, 400), 1300, [C((40, 20, 40), 0), C((40, 22, 50), int(120 * (1 - 0.5 * dawn)))], [0.4, 1])
    c.drawRect(skia.Rect(-300, -300, W + 300, 900), skia.Paint(Shader=vg))


def window(c, t, dawn=0.0):
    x0, y0, x1, y1 = 110, 120, 520, 520
    c.drawRRect(rr(x0 - 22, y0 - 22, x1 + 22, y1 + 30, 10), P(WOOD_D))
    c.save(); c.clipRect(skia.Rect(x0, y0, x1, y1))
    night = [(14, 18, 48), (30, 36, 86), (60, 58, 110)]
    day = [(110, 140, 210), (250, 170, 150), (255, 210, 150)]
    cols = [tuple(int(n + (d - n) * dawn) for n, d in zip(a, b)) for a, b in zip(night, day)]
    sh = skia.GradientShader.MakeLinear([skia.Point(0, y0), skia.Point(0, y1)], [C(cols[0]), C(cols[1]), C(cols[2])], [0, 0.65, 1])
    c.drawRect(skia.Rect(x0, y0, x1, y1), skia.Paint(Shader=sh))
    if dawn < 0.9:
        for (sx, sy, r, ph) in STARS:
            c.drawCircle(sx, sy, r, P((255, 250, 230), (150 + 100 * math.sin(t * 1.7 + ph)) * (1 - dawn)))
        c.drawCircle(440, 200, 26, P((250, 244, 220), 230 * (1 - dawn)))                       # the moon
        c.drawCircle(452, 192, 24, P(cols[0], 230 * (1 - dawn)))
    roofs = [(x0 - 10, 440), (180, 430), (180, 400), (260, 400), (260, 380), (330, 352), (400, 380), (400, 420), (470, 420), (470, 396), (x1 + 10, 396)]
    pa = skia.Path(); pa.moveTo(x0 - 10, y1 + 10)
    for p in roofs: pa.lineTo(*p)
    pa.lineTo(x1 + 10, y1 + 10); pa.close()
    rc = tuple(int(a + (b - a) * dawn) for a, b in zip((22, 22, 52), (120, 90, 120)))
    c.drawPath(pa, P(rc))
    for (wx, wy) in ((206, 446), (288, 418), (430, 438)):                                       # a few lit windows across the street
        c.drawRect(skia.Rect(wx, wy, wx + 14, wy + 18), P((255, 214, 130), 210 * (1 - dawn) * (0.8 + 0.2 * math.sin(t * 0.6 + wx))))
    c.restore()
    c.drawRect(skia.Rect((x0 + x1) / 2 - 6, y0, (x0 + x1) / 2 + 6, y1), P(WOOD_D))            # mullions
    c.drawRect(skia.Rect(x0, (y0 + y1) / 2 - 6, x1, (y0 + y1) / 2 + 6), P(WOOD_D))
    c.drawRect(skia.Rect(x0 - 34, y1 + 18, x1 + 34, y1 + 36), P(WOOD))                          # sill
    c.drawLine(x0 + 30, y0 + 20, x0 + 120, y0 + 140, SP((255, 255, 255), 6, 26))               # glass glint


def clock(c, t, hours, x=660, y=200, r=66):
    """wall clock showing `hours` (e.g. 23.0 = 11:00)"""
    c.drawCircle(x + 4, y + 6, r + 8, P((60, 30, 30), 70, MaskFilter=blur(8)))
    c.drawCircle(x, y, r + 8, P(WOOD_D)); c.drawCircle(x, y, r, P((250, 244, 232)))
    for k in range(12):
        a = k * math.pi / 6
        c.drawLine(x + math.sin(a) * r * 0.82, y - math.cos(a) * r * 0.82, x + math.sin(a) * r * 0.94, y - math.cos(a) * r * 0.94, SP(INK, 4 if k % 3 == 0 else 2.4))
    h = hours % 12
    ah = h / 12 * 2 * math.pi; am = (hours % 1) * 2 * math.pi; asec = (t % 60) / 60 * 2 * math.pi
    c.drawLine(x, y, x + math.sin(ah) * r * 0.5, y - math.cos(ah) * r * 0.5, SP(INK, 7))
    c.drawLine(x, y, x + math.sin(am) * r * 0.76, y - math.cos(am) * r * 0.76, SP(INK, 4.5))
    c.drawLine(x, y, x + math.sin(asec) * r * 0.8, y - math.cos(asec) * r * 0.8, SP((210, 70, 60), 2))
    c.drawCircle(x, y, 6, P(INK))


def chart_paper(c, x0, y0, x1, y1, a=1.0, ang=-1.5):
    """the sheet of paper with Marco's chart, taped to the wall (the curve is drawn by the caller in the same frame)"""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    c.save(); c.translate(cx, cy); c.rotate(ang); c.translate(-cx, -cy)
    c.drawRect(skia.Rect(x0 + 6, y0 + 10, x1 + 6, y1 + 10), P((80, 50, 40), 60 * a, MaskFilter=blur(8)))
    c.drawRect(skia.Rect(x0, y0, x1, y1), P((252, 248, 236), 255 * a))
    stp = (x1 - x0) / 14
    for k in range(1, 14):
        c.drawLine(x0 + k * stp, y0, x0 + k * stp, y1, SP((180, 200, 220), 1.2, 120 * a))
    for k in range(1, int((y1 - y0) / stp) + 1):
        c.drawLine(x0, y0 + k * stp, x1, y0 + k * stp, SP((180, 200, 220), 1.2, 120 * a))
    for (tx, ty) in ((x0 + 20, y0 - 6), (x1 - 60, y0 - 6)):
        c.drawRect(skia.Rect(tx, ty, tx + 44, ty + 18), P((240, 220, 150), 200 * a))
    c.restore()


def shelves(c, t):
    for y in (210, 360):
        c.drawRect(skia.Rect(1330, y, 1880, y + 16), P(WOOD))
        c.drawRect(skia.Rect(1330, y + 16, 1880, y + 22), P(WOOD_D))
        c.drawRect(skia.Rect(1330, y + 22, 1880, y + 40), P((120, 70, 60), 50, MaskFilter=blur(8)))
    for i, x in enumerate((1370, 1500, 1630)):                                                   # flour and sugar jars
        c.drawRRect(rr(x, 110, x + 90, 210, 14), P((232, 236, 236), 220))
        c.drawRect(skia.Rect(x + 4, 140, x + 86, 206), P((250, 246, 236)))
        c.drawRRect(rr(x - 4, 96, x + 94, 116, 6), P((150, 100, 70)))
        c.drawRect(skia.Rect(x + 18, 160, x + 72, 180), P((200, 180, 150)))
    c.drawRRect(rr(1760, 120, 1860, 210, 30), P((186, 140, 96)))                                 # a cloth bag
    for k, x in enumerate((1360, 1480, 1600, 1720)):                                             # banneton baskets
        c.drawOval(skia.Rect(x, 318, x + 110, 362), P((196, 150, 104)))
        for j in range(4):
            c.drawArc(skia.Rect(x + 8 + j * 6, 322 + j * 4, x + 102 - j * 6, 358 - j * 3), 180, 180, False, SP((150, 108, 74), 2))


def oven(c, t, heat=0.6):
    x0, x1, y0 = 1420, 1900, 470
    c.drawRRect(rr(x0, y0, x1, 900, 18), P((70, 70, 84)))
    c.drawRRect(rr(x0 + 10, y0 + 10, x1 - 10, y0 + 70, 10), P((92, 92, 108)))
    for k in range(3):
        c.drawCircle(x0 + 70 + k * 70, y0 + 40, 18, P((46, 46, 58))); c.drawLine(x0 + 70 + k * 70, y0 + 40, x0 + 70 + k * 70 + 10, y0 + 28, SP((210, 210, 220), 3))
    fl = heat * (0.85 + 0.15 * math.sin(t * 3.1) * math.sin(t * 1.3))
    door = rr(x0 + 40, y0 + 100, x1 - 40, 760, 14)
    c.drawRRect(door, P((40, 34, 40)))
    c.drawRRect(rr(x0 + 70, y0 + 130, x1 - 70, 730, 10), P((255, 150, 60), 230 * fl))
    c.drawRRect(rr(x0 + 70, y0 + 130, x1 - 70, 730, 10), P((255, 220, 140), 120 * fl, MaskFilter=blur(20)))
    c.drawCircle((x0 + x1) / 2, 640, 300, P((255, 150, 70), 60 * fl, MaskFilter=blur(80)))
    c.drawRect(skia.Rect(x0 + 60, y0 + 108, x1 - 60, y0 + 122), P((200, 200, 210)))             # door handle


LX = 860


def lamp(c, t):
    br = 0.92 + 0.08 * math.sin(t * 0.9)
    c.drawLine(LX, -10, LX, 70, SP((40, 34, 40), 4))
    shade = skia.Path(); shade.moveTo(LX - 60, 120); shade.lineTo(LX - 40, 70); shade.lineTo(LX + 40, 70); shade.lineTo(LX + 60, 120); shade.close()
    c.drawPath(shade, P((50, 76, 66)))
    c.drawOval(skia.Rect(LX - 42, 110, LX + 42, 132), P((255, 236, 180)))
    c.drawCircle(LX, 140, 220 * br, P((255, 220, 150), 50, MaskFilter=blur(80)))


def motes(c, t, a=1.0):
    for (x, y, r, ph, k) in MOTES:
        yy = (y + t * 9 * k) % 700 + 80
        xx = x + 18 * math.sin(t * 0.4 * k + ph)
        c.drawCircle(xx, yy, r, P((255, 244, 210), 90 * a * (0.5 + 0.5 * math.sin(t * k + ph))))


# ------------------------------------------------------------------ the jar
def jar(c, t, level_cm, x=JAR_X, base=JAR_BASE, s=1.0, band_cm=8.0, marks=(), bubble=1.0, feed_marks=True, stand=0.0, side=-1):
    """glass jar with starter `level_cm` high (s scales the jar about its base). marks: [(cm, label, colour)] tape marks.
    stand: a small wooden stand under it, in cm."""
    c.save(); c.translate(x, base); c.scale(s, s)
    pc = PX_CM
    if stand > 0:
        c.drawRRect(rr(-120, -stand * pc, 120, 0, 6), P(WOOD)); c.drawRect(skia.Rect(-120, -10, 120, 0), P(WOOD_D))
        c.translate(0, -stand * pc)
    w, hgt = 104, 12.5 * pc
    c.drawOval(skia.Rect(-w - 14, -10, w + 14, 14), P((60, 30, 30), 90, MaskFilter=blur(8)))
    body = rr(-w, -hgt, w, 0, 26)
    c.drawRRect(body, P((214, 232, 236), 70))
    lv = max(0.0, level_cm) * pc
    if lv > 0:
        c.save(); c.clipRRect(body, True)
        c.drawRect(skia.Rect(-w, -lv, w, 0), P(STARTER))
        c.drawRect(skia.Rect(-w, -lv, w, -lv + 14), P(STARTER_L))
        c.drawRect(skia.Rect(w * 0.35, -lv, w + 40, 0), P(STARTER_D, 110, MaskFilter=blur(26)))
        for (bx, ph, r, k) in BUB:                                                              # bubbles in the glass, more as it rises
            yy = -((ph + t * 0.05 * k) % 1.0) * lv
            if -yy < lv - 6:
                c.drawCircle(bx * w * 0.9, yy, r * 5 * bubble, P(STARTER_D, 200)); c.drawCircle(bx * w * 0.9 - 1.5, yy - 1.5, r * 2 * bubble, P(STARTER_L, 220))
        dome = skia.Path(); dome.moveTo(-w, -lv + 4); dome.quadTo(0, -lv - 16, w, -lv + 4); dome.close()
        c.drawPath(dome, P(STARTER_L))
        c.restore()
    c.drawRRect(body, SP((236, 246, 250), 5, 230))
    c.drawRect(skia.Rect(-w * 0.78, -hgt + 24, -w * 0.62, -30), P((255, 255, 255), 90))           # glint
    c.drawRRect(rr(-w - 6, -hgt - 34, w + 6, -hgt + 2, 8), P((180, 186, 196)))                    # lid
    c.drawRRect(rr(-w - 6, -hgt - 34, w + 6, -hgt - 20, 8), P((206, 212, 220)))
    by = -band_cm * pc                                                                            # the rubber band
    c.drawRRect(rr(-w - 5, by - 7, w + 5, by + 7, 7), P(BAND)); c.drawRect(skia.Rect(-w, by - 3, w, by - 1), P((255, 160, 140)))
    for (cm, lab, col) in marks:                                                                 # tape marks on the glass, labels beside it (left by default)
        y = -cm * pc
        fs = 30 * LS; tw = K.width(lab, fs, 'bold'); g1, g2, g3 = 44 * LS, 64 * LS, 22 * LS
        if side < 0:
            c.drawRect(skia.Rect(-w - 40, y - 4, -w + 4, y + 4), P(col))
            c.drawRRect(rr(-w - g2 - tw, y - g3, -w - g1, y + g3 * 0.82, 9), P((22, 18, 40), 230))
            c.drawRRect(rr(-w - g1 - 6, y - g3, -w - g1, y + g3 * 0.82, 3), P(col))
            text(c, lab, -w - g1 - 12, y + fs * 0.3, fs, (250, 246, 236), 1.0, 'bold', 'right')
        else:
            c.drawRect(skia.Rect(w - 4, y - 4, w + 40, y + 4), P(col))
            c.drawRRect(rr(w + 44, y - 22, w + 64 + tw, y + 18, 9), P((22, 18, 40), 230))
            c.drawRRect(rr(w + 44, y - 22, w + 50, y + 18, 3), P(col))
            text(c, lab, w + 56, y + 9, 30, (250, 246, 236), 1.0, 'bold')
    c.restore()


def notebook(c, x, y, s=1.0, lines=(), a=1.0, ang=4):
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    c.drawRRect(rr(-8, 10, 368, 250, 10), P((60, 30, 20), 70 * a, MaskFilter=blur(8)))
    c.drawRRect(rr(0, 0, 360, 240, 8), P((248, 242, 222), 255 * a))
    for k in range(1, 6): c.drawLine(16, k * 40, 344, k * 40, SP((170, 190, 220), 1.6, 160 * a))
    c.drawLine(48, 0, 48, 240, SP((220, 120, 120), 1.6, 160 * a))
    for i, s_ in enumerate(lines):
        if s_: text(c, s_, 60, 34 + i * 40, 30, INK, a, 'hand')
    c.restore()


def bench(c, t, props=True, jar_level=4.0, marks=(), stand=0.0):
    # top surface (seen a little from above), then the front panel
    top = skia.Path(); top.moveTo(-300, 690); top.lineTo(W + 300, 690); top.lineTo(W + 300, BENCH_Y + 30); top.lineTo(-300, BENCH_Y + 30); top.close()
    c.drawPath(top, P(BENCH_TOP))
    for k in range(7):
        y = 696 + k * 10
        c.drawLine(-300, y, W + 300, y, SP(WOOD_L, 1.4, 70))
    c.drawRect(skia.Rect(-300, 690, W + 300, 700), P((255, 230, 190), 90))
    c.drawRect(skia.Rect(-300, BENCH_Y + 30, W + 300, H + 300), P(WOOD))
    sh = skia.GradientShader.MakeLinear([skia.Point(0, BENCH_Y + 30), skia.Point(0, H)], [C(WOOD_D), C(WOOD), C(WOOD_D)], [0, 0.25, 1])
    c.drawRect(skia.Rect(-300, BENCH_Y + 30, W + 300, H + 300), skia.Paint(Shader=sh))
    for x in range(-300, W + 300, 240):
        c.drawLine(x, BENCH_Y + 40, x, H + 300, SP(WOOD_D, 3, 140))
    c.drawRect(skia.Rect(-300, BENCH_Y + 26, W + 300, BENCH_Y + 34), P(BENCH_EDGE))
    if props:
        # flour sack, a mixing bowl, the notebook, a dough scraper
        sack = skia.Path(); sack.moveTo(180, 744); sack.cubicTo(150, 640, 170, 560, 230, 540); sack.lineTo(370, 540); sack.cubicTo(430, 560, 450, 640, 420, 744); sack.close()
        c.drawPath(sack, P((236, 222, 196))); c.drawPath(sack, SP((196, 176, 146), 3))
        c.drawRect(skia.Rect(222, 600, 378, 660), P((200, 90, 70), 200)); text(c, 'FLOUR', 300, 644, 36, (255, 244, 230), 1.0, 'xb', 'center')
        c.drawOval(skia.Rect(160, 726, 470, 762), P((255, 255, 255), 90, MaskFilter=blur(10)))   # spilt flour
        c.drawOval(skia.Rect(500, 690, 820, 760), P((120, 70, 60), 60, MaskFilter=blur(10)))
        bowl = skia.Path(); bowl.moveTo(510, 650); bowl.cubicTo(520, 740, 800, 740, 810, 650); bowl.close()
        c.drawPath(bowl, P((92, 132, 160))); c.drawOval(skia.Rect(508, 630, 812, 670), P((70, 104, 134)))
        c.drawOval(skia.Rect(530, 636, 790, 664), P((236, 222, 190)))
        notebook(c, 810, 684, 0.62, ('fed 9 pm: 4 cm', 'doubles ~ every 4 h', 'band = 8 cm'), 1.0, ang=-3)
        jar(c, t, jar_level, marks=marks, stand=stand)


def person(c, t, ps, x=760, ground=1380, s=1.0):
    MC.draw(c, ps, x, ground, s)


def room(c, t, hours=23.0, dawn=0.0, ps=None, jar_level=4.0, marks=(), chart=None, heat=0.6, push=(1.0, 1.04), fx=960, fy=540, dur=12.0, t0=0.0,
         stand=0.0, front=None, mx=None):
    """the whole set with a slow push from zoom push[0] to push[1] about (fx, fy) over dur seconds from t0"""
    u = sm((t - t0) / dur)
    z = push[0] + (push[1] - push[0]) * u
    c.save(); WD.camera(c, z, fx, fy, fx, fy)
    wall(c, t, dawn); window(c, t, dawn); clock(c, t, hours); shelves(c, t); oven(c, t, heat)
    chart_paper(c, *CHART)
    if chart: chart(c)
    lamp(c, t)
    if ps is not None:
        person(c, t, ps, mx or MX)
    bench(c, t, True, jar_level, marks, stand)
    if front: front(c)
    motes(c, t)
    c.restore()
    WD.finish(c, t, vig=0.16)
