"""The settings and props of yt-nremt-02's story (house flat style, drawn in code from ref/store.png and ref/ambulance.png).
WORLD UNITS: the store is built at the people model's scale (a person drawn at s = 1 is about 1010 units tall; the back wall
meets the floor at y = 0; x runs 0 .. 4400). The camera frames it with shot(c, z, fx, fy).
  store_back(c, t, amb)     wall, door, window with the morning beam, pegboard, shelves, clock, hanging lamp, floor (people who
                            stand behind the counter are drawn after it); amb 0..1 = the ambulance outside with its flashing bar
  counter(c, t)             the sales counter (top y = CT, front) with the register; draw it after the people behind it
  chair(c, x, g)            the wooden chair Walt sits on (seat at g - 330)
  store_air(c, t, amb)      dust in the beam, the lamp's pool of light, the light bar's red and blue spill
  ambulance(c, t)           the patient compartment seen from the rear doors, with the monitor's moving tracing
finish and camera are re-exported from fin.py."""
import math
import numpy as np
import skia
from fin import finish, camera, glow, lgrad, rr, poly, mixc
from kit import C, P, SP, sm, W, H, blur

CT = -622.0            # the counter's top front edge (world y)
CB = -672.0            # the top's back edge
CX0 = 2350.0           # the counter's left end
FLOOR_F = 190.0        # the counter's base on the floor (nearer the camera than the wall)
WALL = (104, 158, 150); WALL_D = (78, 128, 126); WOOD = (196, 140, 86); WOOD_D = (150, 100, 64); WOOD_L = (232, 184, 124); CREAMW = (244, 232, 206)


def shot(c, z, fx, fy):
    camera(c, z, fx, fy)


def _tool(c, kind, x, y, k=1.0):
    ST, STD, HD, HDD = (176, 184, 200), (120, 128, 150), (206, 92, 60), (150, 60, 50)
    c.save(); c.translate(x, y); c.scale(k, k)
    c.drawCircle(0, -4, 7, P((60, 50, 44)))
    if kind == 'hammer':
        c.drawRRect(rr(-9, 20, 9, 190, 7), P(WOOD_L)); c.drawRRect(rr(1, 20, 9, 190, 4), P(WOOD_D, 120)); c.drawRRect(rr(-46, 0, 40, 34, 6), P(ST)); c.drawRect(skia.Rect(-46, 20, 40, 34), P(STD)); c.drawPath(poly([(-46, 0), (-70, -8), (-66, 14), (-46, 30)]), P(STD))
    elif kind == 'wrench':
        c.drawRRect(rr(-10, 30, 10, 190, 8), P(ST)); c.drawRRect(rr(2, 30, 10, 190, 4), P(STD)); c.drawCircle(0, 22, 27, P(ST)); c.drawRect(skia.Rect(-9, -10, 9, 22), P((222, 196, 150))); c.drawCircle(0, 190, 15, P(ST)); c.drawCircle(0, 190, 7, P((222, 196, 150)))
    elif kind == 'saw':
        c.drawPath(poly([(-10, 40), (60, 40), (36, 250), (4, 250)]), P(ST)); c.drawPath(poly([(40, 40), (60, 40), (36, 250), (26, 250)]), P(STD))
        c.drawRRect(rr(-30, -6, 70, 60, 16), P(HD)); c.drawRRect(rr(-8, 12, 44, 40, 10), P((222, 196, 150)))
    elif kind == 'pliers':
        c.drawPath(poly([(-8, 0), (8, 0), (12, 70), (-12, 70)]), P(ST)); c.drawRRect(rr(-22, 66, -6, 170, 8), P(HD)); c.drawRRect(rr(6, 66, 22, 170, 8), P(HDD)); c.drawCircle(0, 66, 9, P(STD))
    elif kind == 'driver':
        c.drawRRect(rr(-4, 60, 4, 170, 3), P(ST)); c.drawRRect(rr(-13, 0, 13, 70, 10), P((240, 190, 70))); c.drawRRect(rr(3, 0, 13, 70, 6), P((196, 140, 50)))
    elif kind == 'level':
        c.drawRRect(rr(-150, 0, 150, 40, 6), P((240, 190, 70))); c.drawRect(skia.Rect(-150, 28, 150, 40), P((196, 140, 50))); c.drawRRect(rr(-24, 8, 24, 30, 6), P((190, 236, 200)))
    elif kind == 'tape':
        c.drawRRect(rr(-34, 0, 34, 62, 14), P((240, 190, 70))); c.drawRect(skia.Rect(-34, 44, 34, 62), P((196, 140, 50))); c.drawCircle(0, 30, 15, P((60, 60, 70)))
    c.restore()


def _can(c, x, y, col, w=92, h=104):
    c.drawRRect(rr(x, y - h, x + w, y, 6), P(col)); c.drawRect(skia.Rect(x + w * 0.66, y - h, x + w, y), P(mixc(col, (30, 30, 70), 0.3)))
    c.drawRect(skia.Rect(x, y - h, x + w, y - h + 12), P((206, 210, 222))); c.drawRect(skia.Rect(x, y - 10, x + w, y), P((176, 180, 198)))
    c.drawRRect(rr(x + 14, y - h + 30, x + w - 22, y - 28, 5), P(CREAMW)); c.drawCircle(x + w * 0.38, y - h * 0.48, 15, P(col))
    a = skia.Path(); a.addArc(skia.Rect(x + 8, y - h - 30, x + w - 8, y - h + 26), 180, 180); c.drawPath(a, SP((150, 154, 170), 3))


_PIC = {}


def _street(c, amb):
    """what shows through the glass: a bright morning street"""
    lgrad(c, (100, -1400, 1900, -200), (206, 232, 244), (250, 240, 214))
    for x0, w, h, col in ((150, 380, 520, (226, 200, 178)), (560, 300, 640, (214, 190, 186)), (900, 420, 480, (232, 212, 180)), (1360, 360, 600, (220, 196, 180)), (1700, 300, 500, (228, 206, 184))):
        c.drawRect(skia.Rect(x0, -330 - h, x0 + w, -330), P(col))
        for j in range(3): c.drawRect(skia.Rect(x0 + 40 + j * 100, -330 - h + 70, x0 + 100 + j * 100, -330 - h + 150), P((250, 244, 226), 200))
    c.drawRect(skia.Rect(100, -330, 1900, 0), P((196, 190, 186))); c.drawRect(skia.Rect(100, -330, 1900, -316), P((224, 218, 208)))


def ambulance_out(c, t, a=1.0):
    """the box ambulance parked outside, seen through the window: white box, an orange stripe, the star of life, the light bar"""
    if a <= 0.01: return
    c.drawRRect(rr(1010, -1010, 1790, -330, 26), P((246, 246, 244))); c.drawRect(skia.Rect(1560, -1010, 1790, -330), P((220, 224, 232)))
    c.drawRect(skia.Rect(1010, -640, 1790, -560), P((240, 130, 50))); c.drawRect(skia.Rect(1010, -552, 1790, -536), P((63, 150, 190)))
    for k in range(3):
        c.save(); c.translate(1240, -800); c.rotate(60 * k); c.drawRRect(rr(-20, -66, 20, 66, 5), P((60, 110, 200))); c.restore()
    c.drawRRect(rr(1470, -960, 1730, -720, 12), P((150, 190, 214))); c.drawRRect(rr(1090, -1052, 1710, -1010, 10), P((60, 62, 76)))
    for i, col in enumerate(((240, 60, 60), (70, 110, 240), (240, 60, 60), (70, 110, 240))):
        on = 0.35 + 0.65 * (1 if int(t * 3.2 + i) % 2 == 0 else 0)
        c.drawRRect(rr(1110 + i * 150, -1046, 1230 + i * 150, -1016, 8), P(mixc((90, 90, 110), col, on)))


def _back_static(c):
    c.drawRect(skia.Rect(-400, -2000, 4900, 0), P(WALL)); c.drawRect(skia.Rect(-400, -2000, 4900, -1500), P(WALL_D)); c.drawRect(skia.Rect(-400, -1500, 4900, -1380), P(mixc(WALL_D, WALL, 0.5)))
    c.drawRect(skia.Rect(-400, -330, 4900, 0), P((176, 126, 82))); c.drawRect(skia.Rect(-400, -344, 4900, -322), P(WOOD_L))
    for x in range(-400, 4900, 150): c.drawLine(x, -322, x, 0, SP(WOOD_D, 4, 110))
    c.drawRect(skia.Rect(-400, -26, 4900, 0), P(WOOD_D))
    c.drawRect(skia.Rect(-400, 0, 4900, 900), P((186, 134, 88))); c.drawRect(skia.Rect(-400, 330, 4900, 900), P((172, 122, 80)))
    for i in range(-14, 34): c.drawLine(2100 + i * 150, 0, 2100 + i * 330, 800, SP((120, 80, 54), 4, 130))
    for y in (60, 170, 330, 540): c.drawLine(-400, y, 4900, y, SP((120, 80, 54), 2, 50))
    c.drawRRect(rr(160, -1300, 780, 0, 8), P(WOOD_D)); c.drawRect(skia.Rect(200, -1260, 740, 0), P(WOOD))
    c.drawRRect(rr(900, -1300, 1900, -500, 8), P(WOOD_D))
    c.drawRect(skia.Rect(880, -520, 1920, -480), P(WOOD_L)); c.drawRect(skia.Rect(880, -486, 1920, -470), P(WOOD_D))
    c.drawCircle(2128, -1230, 98, P((60, 44, 40), 60)); c.drawCircle(2120, -1240, 96, P(WOOD_D)); c.drawCircle(2120, -1240, 82, P(CREAMW))
    for i in range(12):
        a = i * math.pi / 6; c.drawLine(2120 + 66 * math.sin(a), -1240 - 66 * math.cos(a), 2120 + 76 * math.sin(a), -1240 - 76 * math.cos(a), SP((90, 70, 60), 5 if i % 3 == 0 else 3))
    c.drawRRect(rr(2488, -1390, 3330, -768, 12), P((70, 50, 44), 60))
    c.drawRRect(rr(2480, -1400, 3320, -780, 10), P(WOOD_D)); c.drawRect(skia.Rect(2500, -1380, 3300, -800), P((222, 196, 150)))
    for ix in range(2530, 3300, 46):
        for iy in range(-1350, -800, 46): c.drawRect(skia.Rect(ix - 3, iy - 3, ix + 3, iy + 3), skia.Paint(Color=C((176, 146, 106))))
    for kind, x, y, k in (('hammer', 2590, -1330, 1.0), ('wrench', 2720, -1330, 1.0), ('saw', 2800, -1320, 0.74), ('pliers', 2960, -1330, 1.0), ('driver', 3050, -1330, 1.0), ('driver', 3110, -1330, 0.9), ('wrench', 3200, -1330, 0.8),
                          ('level', 2700, -980, 1.0), ('tape', 2600, -900, 1.0)):
        _tool(c, kind, x, y, k)
    for sy in (-1360, -1100, -840):
        c.drawRect(skia.Rect(3420, sy, 4900, sy + 26), P(WOOD_L)); c.drawRect(skia.Rect(3420, sy + 20, 4900, sy + 34), P(WOOD_D)); c.drawRect(skia.Rect(3420, sy + 34, 4900, sy + 52), P((60, 90, 96), 50))
    cols = ((214, 80, 70), (240, 190, 70), (70, 130, 200), (246, 240, 226), (92, 170, 120), (236, 130, 60), (150, 110, 190))
    for j, sy in enumerate((-1360, -1100, -840)):
        x = 3450
        for i in range(12):
            col = cols[(i * 3 + j * 2) % len(cols)]
            if (i + j) % 4 == 3:
                c.drawRect(skia.Rect(x, sy - 80, x + 120, sy), P((214, 176, 120))); c.drawRect(skia.Rect(x + 84, sy - 80, x + 120, sy), P((176, 136, 92))); c.drawRect(skia.Rect(x + 16, sy - 56, x + 70, sy - 26), P(col)); x += 134
            else:
                _can(c, x, sy, col, 92, 104 if (i + j) % 3 else 84); x += 106
    c.drawRRect(rr(2206, -700, 2226, 0, 6), P(WOOD_L)); c.drawPath(poly([(2170, -70), (2262, -70), (2280, 0), (2152, 0)]), P((226, 190, 110))); c.drawRect(skia.Rect(2170, -84, 2262, -66), P((190, 70, 60)))


def _window_glass(c, t, amb):
    c.save(); c.clipRect(skia.Rect(930, -1270, 1870, -530)); _street(c, amb); ambulance_out(c, t, amb); c.drawRect(skia.Rect(930, -1270, 1870, -530), P((255, 244, 214), 46)); c.restore()
    for x in (1240, 1560): c.drawRect(skia.Rect(x - 8, -1270, x + 8, -530), P(WOOD_D))
    c.drawRect(skia.Rect(930, -1010, 1870, -994), P(WOOD_D))
    c.drawPath(poly([(960, -1250), (1090, -1250), (990, -560), (960, -560)]), P((255, 255, 255), 30))
    c.save(); c.clipRect(skia.Rect(250, -1210, 690, -150)); c.translate(-760, 0); _street(c, amb); c.restore()
    c.drawRect(skia.Rect(250, -1210, 690, -150), P((255, 244, 214), 46))
    if amb > 0.01: c.drawRect(skia.Rect(250, -1210, 690, -150), P((240, 70, 70) if int(t * 3.2) % 2 == 0 else (70, 110, 240), 26 * amb))
    c.drawRect(skia.Rect(200, -700, 740, -660), P(WOOD_D)); c.drawRRect(rr(250, -690, 690, -672, 8), P((226, 204, 130)))
    if amb > 0.01:                                           # the light bar's colour: a soft wash on the frames and the wall right round the window and the door (behind the people)
        ph = int(t * 3.2) % 2; col = (255, 70, 70) if ph == 0 else (80, 130, 255); k = (0.55 + 0.45 * math.sin((t * 3.2 % 1.0) * math.pi)) * amb
        for (x0, y0, x1, y1) in ((900, -1300, 1900, -1270), (900, -530, 1900, -500), (900, -1300, 930, -500), (1870, -1300, 1900, -500), (160, -1300, 200, 0), (740, -1300, 780, 0)):
            c.drawRect(skia.Rect(x0, y0, x1, y1), P(col, 60 * k))
        for (x0, y0, x1, y1) in ((820, -1380, 900, -470), (1900, -1380, 1980, -470), (820, -1380, 1980, -1300)): c.drawRect(skia.Rect(x0, y0, x1, y1), P(col, 14 * k))


def bell(c, t, ring=0.0):
    """the small brass bell above the door; ring 0..1 swings it"""
    a = 24 * ring * math.sin(t * 22)
    c.drawLine(470, -1340, 470, -1300, SP((120, 100, 70), 6))
    c.save(); c.translate(470, -1340); c.rotate(a)
    c.drawPath(poly([(-34, 26), (34, 26), (22, -20), (-22, -20)]), P((226, 190, 90))); c.drawPath(poly([(10, 26), (34, 26), (22, -20), (12, -20)]), P((176, 136, 60))); c.drawCircle(0, 34, 8, P((150, 112, 50)))
    c.restore()


def store_back(c, t, amb=0.0, ring=0.0):
    if 'back' not in _PIC:
        rec = skia.PictureRecorder(); cc = rec.beginRecording(skia.Rect(-500, -2000, 5000, 900)); _back_static(cc); _PIC['back'] = rec.finishRecordingAsPicture()
    c.drawPicture(_PIC['back'])
    _window_glass(c, t, amb); bell(c, t, ring)
    sec = math.floor(t) + sm((t % 1.0) / 0.12)
    for a, L, w, col in ((math.radians(280 + t / 120), 44, 8, (60, 44, 40)), (math.radians(120 + t / 10), 64, 6, (60, 44, 40)), (math.radians(sec * 6), 70, 2.5, (206, 70, 60))):
        c.drawLine(2120, -1240, 2120 + L * math.sin(a), -1240 - L * math.cos(a), SP(col, w))
    c.drawCircle(2120, -1240, 7, P((60, 44, 40)))
    sw = 2.2 * math.sin(t * 0.8)
    c.save(); c.translate(3000, -2000); c.rotate(sw)
    c.drawLine(0, 0, 0, 440, SP((50, 44, 44), 6))
    c.drawPath(poly([(-150, 520), (150, 520), (70, 430), (-70, 430)]), P((70, 140, 110))); c.drawPath(poly([(60, 520), (150, 520), (70, 430), (30, 430)]), P((46, 104, 88)))
    c.drawOval(skia.Rect(-130, 506, 130, 536), P((255, 236, 170)))
    c.restore()
    store_beam(c, t)


def counter(c, t=0.0, items=True):
    """the sales counter: its top (a band seen a little from above), its panelled front, the register"""
    c.drawRect(skia.Rect(CX0 - 20, CB, 5000, CT), P(WOOD_L)); c.drawRect(skia.Rect(CX0 - 20, CT - 8, 5000, CT + 14), P((246, 204, 146)))
    lgrad(c, (CX0, CT + 14, 5000, FLOOR_F), (186, 130, 80), (150, 100, 64)); c.drawRect(skia.Rect(CX0 - 20, CT + 14, 5000, CT + 40), P(WOOD_D, 150))
    for x in range(int(CX0) + 60, 5000, 520):
        c.drawRRect(rr(x, CT + 90, x + 440, FLOOR_F - 80, 14), P((160, 108, 66))); c.drawRRect(rr(x + 14, CT + 104, x + 440, FLOOR_F - 80, 12), P((178, 124, 76)))
    c.drawRect(skia.Rect(CX0, FLOOR_F - 34, 5000, FLOOR_F), P((110, 72, 50)))
    c.drawRect(skia.Rect(CX0 - 30, FLOOR_F, 5000, FLOOR_F + 26), P((40, 20, 30), 40))
    if items: register(c, 3800)


def register(c, x):
    """an old cash register on the counter"""
    y = CT - 20
    c.drawRRect(rr(x - 6, y - 8, x + 270, y + 8, 8), P((40, 20, 30), 50))
    c.drawRRect(rr(x, y - 120, x + 260, y, 12), P((92, 104, 100))); c.drawRect(skia.Rect(x + 190, y - 120, x + 260, y), P((66, 78, 80)))
    c.drawPath(poly([(x + 20, y - 120), (x + 240, y - 120), (x + 210, y - 250), (x + 50, y - 250)]), P((116, 130, 124))); c.drawRRect(rr(x + 70, y - 236, x + 190, y - 180, 6), P((30, 40, 44)))
    for i in range(4):
        for j in range(2): c.drawCircle(x + 70 + i * 40, y - 150 + j * 34, 12, P(CREAMW))
    c.drawRRect(rr(x + 10, y - 44, x + 180, y - 14, 5), P((70, 82, 82)))


def chair(c, x, g, part='all'):
    """a plain wooden chair seen from the front. part: 'back' (behind the sitter) | 'seat' | 'all'"""
    if part in ('all', 'back'):
        c.drawOval(skia.Rect(x - 250, g - 20, x + 250, g + 44), P((40, 20, 30), 70, MaskFilter=blur(14)))
        for sx in (-1, 1): c.drawRRect(rr(x + sx * 168 - 20, g - 930, x + sx * 168 + 20, g - 30, 10), P((150, 100, 64)))
        c.drawRRect(rr(x - 176, g - 930, x + 176, g - 820, 16), P(WOOD)); c.drawRRect(rr(x - 176, g - 720, x + 176, g - 660, 12), P(WOOD)); c.drawRect(skia.Rect(x - 176, g - 846, x + 176, g - 820), P(WOOD_D, 120))
    if part in ('all', 'seat'):
        for sx in (-1, 1): c.drawRRect(rr(x + sx * 190 - 22, g - 330, x + sx * 190 + 22, g, 10), P(WOOD)); c.drawRect(skia.Rect(x + sx * 190 + 2, g - 330, x + sx * 190 + 22, g), P(WOOD_D, 140))
        c.drawRRect(rr(x - 220, g - 372, x + 220, g - 316, 14), P(WOOD_L)); c.drawRect(skia.Rect(x - 220, g - 336, x + 220, g - 316), P(WOOD_D, 170))


_DUST = np.random.default_rng(11).random((90, 4))


def rglow(c, x, y, r, col, a=1.0):
    """a soft light as a radial gradient (cheap; no blur)"""
    if a <= 0.01: return
    sh = skia.GradientShader.MakeRadial(skia.Point(x, y), r, [C(col, int(255 * min(1, a))), C(col, int(110 * min(1, a))), C(col, 0)], [0, 0.45, 1])
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Shader=sh, BlendMode=skia.BlendMode.kScreen))


def store_beam(c, t):
    """the morning beam from the window, drawn on the room before the people (flat fills: cheap to draw)"""
    c.drawPath(poly([(930, -1270), (1870, -1270), (3350, 520), (1500, 520)]), P((255, 238, 190), 34))
    c.drawPath(poly([(1150, -1270), (1700, -1270), (2900, 520), (1800, 520)]), P((255, 240, 200), 22))


def store_air(c, t, amb=0.0, lamp=1.0):
    """in front of the people: dust drifting in the beam, the lamp's warm pool, the light bar's red and blue spill"""
    beam = poly([(930, -1270), (1870, -1270), (3350, 520), (1500, 520)])
    c.save(); c.clipPath(beam, skia.ClipOp.kIntersect, True)
    for i, (a, b, d, e) in enumerate(_DUST):
        u = (b + t * (0.008 + 0.012 * d)) % 1.0; x = 950 + a * 1500 + u * 900 + 30 * math.sin(t * 0.5 + i); y = -1250 + u * 1600 + 24 * math.sin(t * 0.7 + i * 2.1)
        c.drawCircle(x, y, 2.5 + 3.5 * e, P((255, 244, 210), 150 * (0.5 + 0.5 * math.sin(t * 1.3 + i * 1.7))))
    c.restore()
    sw = 2.2 * math.sin(t * 0.8); lx = 3000 + 520 * math.sin(math.radians(-sw))
    rglow(c, lx, -1480, 300, (255, 226, 150), 0.34 * lamp)


# ------------------------------------------------------------------------------------------------ the ambulance
def ecg(u, st=0.14):
    """one heart beat of a lead II style tracing, u in 0..1 -> height (up is positive): P wave, QRS, a raised ST segment, T wave"""
    g = lambda m, s_, a: a * math.exp(-((u - m) / s_) ** 2)
    stv = st * (sm((u - 0.345) / 0.02) - sm((u - 0.56) / 0.08))
    return g(0.16, 0.028, 0.13) - g(0.275, 0.009, 0.12) + g(0.30, 0.011, 1.0) - g(0.328, 0.011, 0.24) + stv + g(0.52, 0.05, 0.30)


def trace(c, x0, y0, w, h, t, col=(110, 240, 150), bpm=84, speed=220.0, lw=4.0, sweep=True):
    """a monitor tracing inside (x0, y0, w, h): the beam draws left to right and wipes the old line ahead of it"""
    per = 60.0 / bpm; head = (t * speed) % w; p = skia.Path(); first = True
    for i in range(0, int(w), 3):
        age = (head - i) % w
        if sweep and age > w - 46: first = True; continue
        tt = t - age / speed; v = ecg((tt / per) % 1.0); x = x0 + i; y = y0 + h * 0.62 - v * h * 0.5
        if first: p.moveTo(x, y); first = False
        else: p.lineTo(x, y)
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=C(col), Style=skia.Paint.kStroke_Style, StrokeWidth=lw, StrokeJoin=skia.Paint.kRound_Join, StrokeCap=skia.Paint.kRound_Cap))
    if sweep: c.drawCircle(x0 + head, y0 + h * 0.62 - ecg((t / per) % 1.0) * h * 0.5, lw * 1.4, P((220, 255, 230)))


def strip(c, x0, y0, w, h, phase=0.0, a=255, back=False):
    """a paper rhythm strip: pink grid and a black tracing. back=True: the paper's plain back with the print showing faintly through"""
    c.save(); c.clipRect(skia.Rect(x0, y0, x0 + w, y0 + h))
    c.drawRect(skia.Rect(x0, y0, x0 + w, y0 + h), P((255, 248, 242) if not back else (250, 246, 240), a))
    ga = (110 if not back else 26) * a / 255
    for i in range(0, int(w) + 1, 10): c.drawLine(x0 + i, y0, x0 + i, y0 + h, SP((240, 150, 150), 1 if i % 50 else 2, ga))
    for j in range(0, int(h) + 1, 10): c.drawLine(x0, y0 + j, x0 + w, y0 + j, SP((240, 150, 150), 1 if j % 50 else 2, ga))
    p = skia.Path()
    for i in range(0, int(w), 2):
        u = ((w - i if back else i) / 170.0 + phase) % 1.0; y = y0 + h * 0.64 - ecg(u) * h * 0.5
        (p.moveTo if i == 0 else p.lineTo)(x0 + i, y)
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=C((40, 36, 50), a if not back else 70), Style=skia.Paint.kStroke_Style, StrokeWidth=2.6, StrokeJoin=skia.Paint.kRound_Join))
    c.restore()


def monitor(c, x, y, t, k=1.0):
    """the cardiac monitor: an orange case, a dark screen with the moving tracing (no numbers: nothing unspoken)"""
    c.save(); c.translate(x, y); c.scale(k, k)
    c.drawRRect(rr(6, 10, 426, 330, 22), P((20, 10, 40), 80, MaskFilter=blur(10)))
    c.drawRRect(rr(0, 0, 420, 320, 22), P((226, 110, 60))); c.drawRRect(rr(0, 250, 420, 320, 22), P((180, 76, 50))); c.drawRRect(rr(18, 18, 402, 236, 12), P((14, 22, 30)))
    for j in range(1, 6): c.drawLine(18, 18 + j * 36, 402, 18 + j * 36, SP((40, 70, 70), 1, 120))
    for i in range(1, 10): c.drawLine(18 + i * 38.4, 18, 18 + i * 38.4, 236, SP((40, 70, 70), 1, 120))
    c.save(); c.clipRect(skia.Rect(22, 22, 398, 232)); trace(c, 22, 40, 376, 170, t, speed=150.0, lw=4.5); c.restore()
    hb = (t / (60.0 / 84)) % 1.0; c.drawCircle(60, 286, 11 + 4 * math.exp(-((hb - 0.3) / 0.08) ** 2), P((255, 110, 110)))
    for i in range(4): c.drawRRect(rr(120 + i * 70, 268, 174 + i * 70, 304, 8), P((60, 44, 50)))
    c.drawRRect(rr(150, -40, 270, 6, 14), P((60, 44, 50)))
    c.restore()


def _amb_static(c):
    lgrad(c, (0, 0, W, H), (232, 232, 226), (206, 208, 208))
    c.drawPath(poly([(-100, -100), (W + 100, -100), (1500, 190), (420, 190)]), P((240, 240, 236)))
    c.drawPath(poly([(-100, H + 100), (W + 100, H + 100), (1500, 860), (420, 860)]), P((150, 158, 170)))
    c.drawPath(poly([(-100, -100), (420, 190), (420, 860), (-100, H + 100)]), P((226, 226, 218)))
    c.drawPath(poly([(W + 100, -100), (1500, 190), (1500, 860), (W + 100, H + 100)]), P((214, 216, 212)))
    c.drawRect(skia.Rect(420, 190, 1500, 860), P((220, 222, 220)))
    c.drawRRect(rr(820, 300, 1100, 470, 14), P((120, 160, 180))); c.drawRRect(rr(834, 314, 1086, 456, 8), P((176, 214, 230)))
    c.drawRect(skia.Rect(420, 520, 1500, 536), P((63, 170, 160))); c.drawRect(skia.Rect(420, 540, 1500, 548), P((240, 130, 50)))
    for (a, b) in (((560, 60), (800, 150)), ((1120, 60), (1360, 150))): c.drawPath(poly([(a[0], a[1]), (b[0], a[1]), (b[0] - 40, b[1]), (a[0] + 40, b[1])]), P((255, 252, 236)))
    c.drawLine(300, 120, 1620, 120, SP((190, 196, 204), 12)); c.drawLine(300, 120, 300, 80, SP((190, 196, 204), 10)); c.drawLine(1620, 120, 1620, 80, SP((190, 196, 204), 10))
    cab = poly([(30, 150), (400, 250), (400, 520), (30, 560)]); c.drawPath(cab, P((244, 244, 238))); c.drawPath(cab, SP((176, 180, 186), 5))
    for i, (x, y0, y1) in enumerate(((60, 190, 330), (60, 372, 520), (230, 236, 346), (230, 384, 500))):
        box = poly([(x, y0), (x + 150, y0 + 40), (x + 150, y1), (x, y1 + 14)]); c.drawPath(box, P((206, 226, 232)))
        for j, col in enumerate(((240, 130, 50), (63, 170, 160), (246, 246, 240))): c.drawRRect(rr(x + 14 + j * 44, y1 - 54 + j * 5, x + 50 + j * 44, y1 - 4 + j * 5, 5), P(col))
        c.drawPath(box, SP((150, 160, 170), 3))
    c.drawPath(poly([(-100, 600), (400, 560), (400, 600), (-100, 650)]), P((200, 204, 208)))
    c.drawPath(poly([(1520, 560), (W + 100, 650), (W + 100, 920), (1520, 760)]), P((60, 140, 140))); c.drawPath(poly([(1520, 300), (W + 100, 210), (W + 100, 610), (1520, 540)]), P((84, 170, 166)))
    c.drawPath(poly([(1520, 300), (W + 100, 210), (W + 100, 250), (1520, 330)]), P((120, 196, 190))); c.drawPath(poly([(1520, 760), (W + 100, 920), (W + 100, H + 100), (1520, 860)]), P((176, 180, 186)))
    for x in (1640, 1800): c.drawLine(x, 300 - (x - 1520) * 0.2, x, 550 + (x - 1520) * 0.2, SP((60, 140, 140), 4))


def ambulance(c, t):
    if 'amb' not in _PIC:                                    # the static compartment, cached once as an image at twice the frame size
        sf = skia.Surface(2 * W + 800, 2 * H + 800); cc = sf.getCanvas(); cc.scale(2, 2); cc.translate(200, 200); _amb_static(cc)
        for (a, b) in ((680, 105), (1240, 105)): glow(cc, a, b, 260, (255, 250, 226), 0.3)
        _PIC['amb'] = sf.makeImageSnapshot()
    c.drawImageRect(_PIC['amb'], skia.Rect(-200, -200, W + 200, H + 200), skia.SamplingOptions(skia.FilterMode.kLinear))
    k = 0.5 + 0.5 * math.sin(t * 0.9); c.drawRRect(rr(834, 314, 1086, 456, 8), P((255, 236, 190), 30 + 30 * k))


def cot(c, x, y, part='back'):
    """the stretcher seen from its foot end with the backrest raised. (x, y) = where the sitter's hips are.
    part 'back': the raised backrest and pillow; 'front': the blanket over the lap and legs, the side rails and the foot end"""
    if part == 'back':
        c.drawRRect(rr(x - 300, y - 500, x + 300, y + 60, 50), P((20, 10, 40), 60, MaskFilter=blur(16)))
        c.drawRRect(rr(x - 290, y - 510, x + 290, y + 50, 50), P((70, 80, 100))); c.drawRRect(rr(x - 270, y - 494, x + 270, y + 50, 40), P((226, 232, 242))); c.drawRRect(rr(x + 120, y - 494, x + 270, y + 50, 40), P((200, 208, 226)))
        c.drawRRect(rr(x - 200, y - 470, x + 200, y - 250, 70), P((250, 250, 252))); c.drawRRect(rr(x - 200, y - 310, x + 200, y - 250, 30), P((214, 220, 234), 170))
    else:
        bl = skia.Path(); bl.moveTo(x - 280, y - 70); bl.quadTo(x, y - 110, x + 280, y - 70); bl.lineTo(x + 420, y + 420); bl.lineTo(x - 420, y + 420); bl.close()
        q = skia.Path(bl); q.offset(0, 12); c.drawPath(q, P((20, 10, 40), 70, MaskFilter=blur(14)))
        c.drawPath(bl, P((84, 132, 200))); c.save(); c.clipPath(bl, skia.ClipOp.kIntersect, True)
        c.drawPath(poly([(x + 150, y - 120), (x + 300, y - 120), (x + 440, y + 420), (x + 230, y + 420)]), P((56, 100, 168)))
        for sx in (-1, 1):                                    # the thighs and shins under the blanket, coming toward the camera
            c.drawPath(poly([(x + sx * 30, y - 60), (x + sx * 170, y - 60), (x + sx * 250, y + 420), (x + sx * 50, y + 420)]), P((116, 164, 226), 150, MaskFilter=blur(14)))
            c.drawOval(skia.Rect(x + sx * 110 - 80, y + 60, x + sx * 110 + 80, y + 190), P((150, 192, 240), 150, MaskFilter=blur(16)))
            c.drawLine(x + sx * 20, y + 10, x + sx * 34, y + 400, SP((56, 100, 168), 6, 110))
        sh = skia.Path(); sh.moveTo(x - 280, y - 70); sh.quadTo(x, y - 110, x + 280, y - 70); sh.lineTo(x + 290, y - 22); sh.quadTo(x, y - 64, x - 290, y - 22); sh.close(); c.drawPath(sh, P((246, 248, 252)))
        c.restore()
        for sx in (-1, 1):
            c.drawLine(x + sx * 330, y - 120, x + sx * 450, y + 330, SP((120, 128, 150), 16)); c.drawLine(x + sx * 330, y - 120, x + sx * 450, y + 330, SP((206, 212, 224), 9))
            c.drawLine(x + sx * 300, y - 30, x + sx * 332, y - 116, SP((206, 212, 224), 9))
