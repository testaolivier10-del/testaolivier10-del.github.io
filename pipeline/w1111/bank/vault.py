"""w1111-03-bank-run: the vault. A cut through the ground: the street on top (the bank, a house, a shop), the vault room underneath.
Money is drawn as packs of notes. In the EXAMPLE 100 were deposited: ten columns of ten packs. One column is real cash on the shelf;
the other nine are dashed outlines, because those 90 left earlier as loans, drawn as gold light running up to the house and the shop.
Also here: the bank wall with the round vault door the camera goes through, and the hands that take and bring packs."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/bank', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import layout as L
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import shaded, diffp, glow, op
import bperson as PN, bhands as H
import people as PP
from world import text, grad, MONT, STONE, STONE_SH, STONE_HI, BRASS, BRASS_SH, BRASS_HI, shield

TM = {}                                                       # times, set by build.py from the spoken words
GOLD, GOLD_HI = (255, 200, 80), (255, 240, 170)
NOTE, NOTE_SH, NOTE_HI, BAND = (132, 196, 150), (84, 146, 116), (196, 236, 200), (246, 238, 214)
SHELF_Y = 1080.0
COLS = [190, 260, 330, 400, 470, 610, 680, 750, 820]          # the nine columns that are out on loan (five went to the house, four to the shop)
REAL_X = 540.0
PH, PW = 18.0, 64.0
_R = np.random.default_rng(5)
STONES = [(_R.uniform(0, 1080), _R.uniform(708, 762), _R.uniform(4, 11)) for _ in range(46)] + [(_R.uniform(0, 1080), _R.uniform(1612, 1960), _R.uniform(5, 16)) for _ in range(40)]
DUST = [(_R.uniform(120, 960), _R.uniform(0, 1), _R.uniform(1.2, 3.2), _R.uniform(0, 6.28), _R.uniform(0.4, 1.0)) for _ in range(34)]


def pack(c, x, y, a=1.0, gold=0.0, w=PW, h=PH - 2):
    """one pack of notes, centred at x, y"""
    r = skia.Rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2)
    base = mix(NOTE, GOLD, gold); sh = mix(NOTE_SH, (220, 150, 50), gold); hi = mix(NOTE_HI, GOLD_HI, gold)
    c.drawRRect(skia.RRect.MakeRectXY(r, 3, 3), P(base, 255 * a))
    c.drawRect(skia.Rect(x - w / 2 + 1, y + h / 2 - 5, x + w / 2 - 1, y + h / 2), P(sh, 255 * a)); c.drawRect(skia.Rect(x - w / 2 + 2, y - h / 2, x + w / 2 - 2, y - h / 2 + 3), P(hi, 255 * a))
    c.drawRect(skia.Rect(x - 9, y - h / 2, x + 9, y + h / 2), P(mix(BAND, GOLD_HI, gold), 255 * a)); c.drawRect(skia.Rect(x - 9, y + h / 2 - 5, x + 9, y + h / 2), P(mix((200, 188, 160), (240, 190, 90), gold), 255 * a))
    c.drawCircle(x - 21, y - 1, 3.4, P(sh, 200 * a)); c.drawCircle(x + 21, y - 1, 3.4, P(sh, 200 * a))


def ghost(c, x, n=10, a=1.0, col=(176, 204, 250)):
    """the outline of a column of packs that is not here"""
    if a <= 0.01: return
    pe = skia.DashPathEffect.Make([9, 7], 0)
    for j in range(n):
        y = SHELF_Y - PH / 2 - PH * j
        r = skia.RRect.MakeRectXY(skia.Rect(x - PW / 2, y - PH / 2 + 1, x + PW / 2, y + PH / 2 - 1), 3, 3)
        c.drawRRect(r, P(col, 40 * a)); c.drawRRect(r, skia.Paint(AntiAlias=True, Color=C(col, 235 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=2.2, PathEffect=pe))


# ------------------------------------------------------------------------------------------------ the street on top
def house(c, lit, t):
    x, g = 255, 700
    c.drawOval(skia.Rect(x - 110, g - 6, x + 190, g + 12), P((40, 50, 90), 80, MaskFilter=blur(8)))
    c.drawRect(skia.Rect(x + 34, g - 196, x + 58, g - 130), P((170, 96, 84)))                                           # chimney
    wall = mix((196, 186, 190), (250, 226, 190), lit); c.drawRect(skia.Rect(x - 86, g - 122, x + 86, g), P(wall)); c.drawRect(skia.Rect(x + 52, g - 122, x + 86, g), P(mix(wall, (90, 80, 130), 0.3)))
    roof = poly([(x - 104, g - 118), (x, g - 204), (x + 104, g - 118)]); c.drawPath(roof, P(mix((120, 90, 100), (196, 92, 72), lit))); c.drawPath(poly([(x, g - 204), (x + 104, g - 118), (x + 60, g - 118)]), P((80, 50, 70), 90))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 18, g - 66, x + 18, g), 4, 4), P(mix((96, 84, 100), (150, 84, 60), lit))); c.drawCircle(x + 10, g - 32, 3, P(BRASS_HI))
    for wx in (x - 54, x + 54):
        r = skia.Rect(wx - 19, g - 100, wx + 19, g - 56)
        if lit > 0.02: c.drawRect(skia.Rect(wx - 34, g - 116, wx + 34, g - 40), P((255, 210, 120), 190 * lit, MaskFilter=blur(14)))
        c.drawRect(r, P(mix((90, 104, 140), (255, 226, 140), lit))); c.drawRect(r, SP((250, 244, 232), 4)); c.drawLine(wx, g - 100, wx, g - 56, SP((250, 244, 232), 3))
    if lit > 0.3:                                             # the family at the window: two grown ups and a child, tiny
        a = 255 * smooth((lit - 0.3) / 0.5); wx = x - 54
        c.save(); c.clipRect(skia.Rect(wx - 17, g - 98, wx + 17, g - 58))
        for dx, hh, col in ((-9, 26, (110, 70, 80)), (4, 23, (80, 70, 110)), (13, 13, (140, 80, 70))):
            bob = 1.2 * math.sin(t * 2 + dx); c.drawCircle(wx + dx, g - 58 - hh + bob, 5, P(col, a)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wx + dx - 6, g - 58 - hh + 5 + bob, wx + dx + 6, g - 50), 4, 4), P(col, a))
        c.restore()
        for i in range(3):                                    # smoke from the chimney
            u = (t * 0.35 + i / 3) % 1.0; c.drawCircle(x + 46 + 22 * u + 6 * math.sin(t + i), g - 200 - 80 * u, 9 + 16 * u, P((250, 250, 255), 150 * (1 - u) * lit, MaskFilter=blur(5)))


def shop(c, lit, t):
    x, g = 825, 700
    c.drawOval(skia.Rect(x - 120, g - 6, x + 200, g + 12), P((40, 50, 90), 80, MaskFilter=blur(8)))
    wall = mix((190, 190, 200), (240, 232, 214), lit); c.drawRect(skia.Rect(x - 104, g - 150, x + 104, g), P(wall)); c.drawRect(skia.Rect(x + 66, g - 150, x + 104, g), P(mix(wall, (90, 80, 130), 0.3)))
    c.drawRect(skia.Rect(x - 110, g - 160, x + 110, g - 146), P(mix(wall, (255, 255, 255), 0.5)))
    sg = skia.RRect.MakeRectXY(skia.Rect(x - 76, g - 142, x + 76, g - 104), 8, 8)
    if lit > 0.02: c.drawRRect(sg, P((255, 150, 110), 200 * lit, MaskFilter=blur(14)))
    c.drawRRect(sg, P(mix((84, 80, 100), (214, 70, 70), lit))); text(c, 'SHOP', x, g - 112, 28, mix((150, 150, 166), (255, 244, 220), lit))
    aw = poly([(x - 100, g - 98), (x + 100, g - 98), (x + 112, g - 70), (x - 112, g - 70)]); c.drawPath(aw, P(mix((120, 124, 140), (60, 140, 130), lit)))
    c.save(); c.clipPath(aw, skia.ClipOp.kIntersect, True)
    for i in range(8): c.drawRect(skia.Rect(x - 112 + i * 30, g - 100, x - 97 + i * 30, g - 68), P(mix((170, 172, 184), (250, 244, 230), lit)))
    c.restore()
    r = skia.Rect(x - 84, g - 64, x + 22, g - 10)
    if lit > 0.02: c.drawRect(skia.Rect(x - 100, g - 80, x + 40, g + 4), P((255, 214, 130), 170 * lit, MaskFilter=blur(14)))
    c.drawRect(r, P(mix((88, 100, 136), (255, 230, 150), lit))); c.drawRect(r, SP((250, 244, 232), 4))
    for i, col in enumerate(((226, 96, 80), (90, 150, 200), (240, 190, 70), (120, 180, 120))): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 74 + i * 23, g - 40, x - 58 + i * 23, g - 14), 3, 3), P(mix((70, 80, 110), col, lit)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 40, g - 64, x + 80, g), 3, 3), P(mix((84, 80, 100), (60, 110, 110), lit)))
    if lit > 0.5: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 44, g - 54, x + 76, g - 38), 3, 3), P((255, 250, 220), 255 * smooth((lit - 0.5) / 0.4))); text(c, 'OPEN', x + 60, g - 42, 11, (200, 60, 60), 255 * smooth((lit - 0.5) / 0.4))


def minibank(c):
    x, g = 540, 700
    c.drawOval(skia.Rect(x - 110, g - 6, x + 190, g + 12), P((40, 50, 90), 80, MaskFilter=blur(8)))
    c.drawRect(skia.Rect(x - 92, g - 12, x + 92, g), P(STONE_SH)); c.drawRect(skia.Rect(x - 84, g - 22, x + 84, g - 12), P(STONE))
    c.drawRect(skia.Rect(x - 76, g - 150, x + 76, g - 22), P(mix(STONE, (120, 100, 110), 0.25)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 17, g - 92, x + 17, g - 22), 3, 3), P(BRASS)); c.drawLine(x, g - 92, x, g - 22, SP(BRASS_SH, 2.5))
    for i in range(4):
        cx = x - 63 + i * 42; c.drawRect(skia.Rect(cx - 9, g - 150, cx + 9, g - 22), P(STONE_HI)); c.drawRect(skia.Rect(cx + 3, g - 150, cx + 9, g - 22), P(STONE_SH, 150))
    c.drawRect(skia.Rect(x - 86, g - 176, x + 86, g - 150), P(STONE)); text(c, 'BANK', x, g - 155, 21, (110, 76, 60))
    c.drawPath(poly([(x - 94, g - 176), (x, g - 228), (x + 94, g - 176)]), P(STONE_HI)); c.drawPath(poly([(x, g - 228), (x + 94, g - 176), (x + 40, g - 176)]), P(STONE_SH, 130))


def town(c, t, lit_h, lit_s):
    grad(c, skia.Rect(-600, -600, 1680, 706), (0, 200), (0, 700), [(96, 160, 224), (170, 210, 236), (250, 232, 204)], [0, 0.6, 1.0])
    for i, (cx, cy, w) in enumerate(((180, 470, 110), (760, 430, 140), (1010, 520, 90))):
        xx = (cx + t * 5) % 1300 - 100
        c.drawOval(skia.Rect(xx - w, cy - w * 0.22, xx + w, cy + w * 0.22), P((255, 255, 255), 200)); c.drawOval(skia.Rect(xx - w * 0.5, cy - w * 0.42, xx + w * 0.4, cy + w * 0.1), P((255, 255, 255), 200))
    hp = [(-600, 706)] + [(x, 640 - 26 * math.sin(x * 0.006) - 14 * math.sin(x * 0.017 + 1)) for x in range(-600, 1700, 60)] + [(1680, 706)]
    c.drawPath(poly(hp), P((150, 190, 180)))
    for tx in (60, 420, 668, 1010):
        c.drawRect(skia.Rect(tx - 4, 650, tx + 4, 700), P((120, 90, 80))); c.drawCircle(tx, 630, 30, P((96, 156, 110))); c.drawCircle(tx - 9, 620, 16, P((150, 200, 140), 170))
    minibank(c); house(c, lit_h, t); shop(c, lit_s, t)
    c.drawRect(skia.Rect(-600, 696, 1680, 708), P((120, 170, 110))); c.drawRect(skia.Rect(-600, 696, 1680, 699), P((190, 226, 150)))


def ground(c):
    grad(c, skia.Rect(-600, 706, 1680, 2600), (0, 706), (0, 1900), [(98, 74, 78), (70, 54, 70), (44, 36, 60)], [0, 0.2, 1.0])
    for (x, y, r) in STONES: c.drawOval(skia.Rect(x - r, y - r * 0.7, x + r, y + r * 0.7), P((130, 104, 104), 150))
    c.drawLine(-600, 738, 1680, 742, SP((60, 44, 60), 3, 120))


def room(c, t, cold=0.0, lamp=1.0):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(76, 764, 1004, 1994), 20, 20), P((20, 22, 40), 150, MaskFilter=blur(14)))
    fr = skia.RRect.MakeRectXY(skia.Rect(80, 760, 1000, 1990), 18, 18)
    c.drawRRect(fr, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(80, 760), skia.Point(1000, 1990)], [C((176, 190, 214)), C((112, 126, 160)), C((74, 84, 120))], [0, 0.4, 1])))
    for i in range(14):
        for (bx, by) in ((112 + i * 66, 772), (112 + i * 66, 1978)): c.drawCircle(bx, by, 5, P((70, 80, 112))); c.drawCircle(bx - 1.5, by - 1.5, 2, P((210, 220, 240)))
    for i in range(18):
        for (bx, by) in ((92, 820 + i * 66), (988, 820 + i * 66)): c.drawCircle(bx, by, 5, P((70, 80, 112))); c.drawCircle(bx - 1.5, by - 1.5, 2, P((210, 220, 240)))
    ir = skia.Rect(104, 784, 976, 1966)
    c.save(); c.clipRect(ir)
    grad(c, ir, (0, 784), (0, 1966), [mix((62, 84, 130), (50, 60, 100), cold), mix((52, 70, 116), (38, 46, 86), cold), mix((48, 64, 108), (34, 40, 78), cold)], [0, 0.5, 1.0])
    for i in range(13):                                       # a wall of safe deposit boxes at the back
        for j in range(16):
            bx, by = 110 + i * 67, 792 + j * 68
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx, by, bx + 61, by + 62), 5, 5), SP((110, 136, 190), 2, 70)); c.drawCircle(bx + 30, by + 40, 4, P((196, 160, 96), 120)); c.drawRect(skia.Rect(bx + 18, by + 14, bx + 43, by + 22), P((120, 146, 196), 60))
    grad(c, skia.Rect(104, 1880, 976, 1966), (0, 1880), (0, 1966), [(104, 124, 170), (66, 80, 124)])                    # the floor
    c.drawLine(104, 1880, 976, 1880, SP((150, 170, 214), 2.4, 200))
    # the lamp and its light
    fl = lamp
    cone = poly([(516, 836), (564, 836), (820, 1880), (260, 1880)])
    lc = mix((255, 226, 150), (190, 210, 255), cold)
    c.drawPath(cone, P(lc, 52 * fl, MaskFilter=blur(22))); c.drawOval(skia.Rect(260, 1850, 820, 1930), P(lc, 80 * fl, MaskFilter=blur(18)))
    c.drawOval(skia.Rect(400, 860, 680, 1100), P(lc, 44 * fl, MaskFilter=blur(40)))
    c.restore()
    c.drawLine(540, 784, 540, 806, SP((30, 34, 54), 4)); c.drawPath(poly([(522, 806), (558, 806), (574, 834), (506, 834)]), P((214, 164, 78))); c.drawPath(poly([(545, 806), (558, 806), (574, 834), (552, 834)]), P((150, 104, 52)))
    c.drawOval(skia.Rect(520, 828, 560, 846), P(mix((255, 244, 200), (214, 230, 255), cold), 255 * (0.25 + 0.75 * fl))); c.drawCircle(540, 838, 44, P(lc, 120 * fl, MaskFilter=blur(18)))
    # the shelves
    for ux in (150, 930):
        c.drawRect(skia.Rect(ux - 9, 880, ux + 9, 1882), P((120, 136, 176))); c.drawRect(skia.Rect(ux + 3, 880, ux + 9, 1882), P((76, 90, 130))); c.drawRect(skia.Rect(ux - 9, 880, ux - 6, 1882), P((190, 204, 232)))
    for sy in (930, SHELF_Y, 1230, 1380, 1530, 1680):
        c.drawRect(skia.Rect(140, sy + 16, 940, sy + 34), P((16, 20, 44), 110, MaskFilter=blur(7)))
        c.drawRect(skia.Rect(136, sy, 944, sy + 18), P((150, 166, 204))); c.drawRect(skia.Rect(136, sy, 944, sy + 4), P((214, 226, 246))); c.drawRect(skia.Rect(136, sy + 12, 944, sy + 18), P((92, 106, 150)))
    for (bx, bw_, bh_, sy) in ((230, 120, 78, 1380), (372, 96, 60, 1380), (792, 132, 84, 1380), (690, 110, 64, 1230), (300, 130, 84, 1680), (470, 100, 62, 1680), (846, 104, 70, 1530), (640, 150, 92, 1680), (700, 120, 66, 1760), (800, 96, 58, 1760), (740, 100, 56, 1702)):      # a few locked strongboxes on the lower shelves: no cash in them
        r_ = skia.RRect.MakeRectXY(skia.Rect(bx - bw_ / 2, sy - bh_, bx + bw_ / 2, sy), 7, 7)
        c.drawRRect(r_, P((104, 120, 160))); c.drawRect(skia.Rect(bx - bw_ / 2 + 3, sy - bh_ + 3, bx + bw_ / 2 - 3, sy - bh_ + 12), P((170, 186, 220))); c.drawRect(skia.Rect(bx + bw_ / 2 - 16, sy - bh_ + 4, bx + bw_ / 2 - 3, sy - 3), P((70, 84, 124)))
        c.drawRRect(r_, SP((60, 72, 110), 2.5)); c.drawLine(bx - bw_ / 2 + 4, sy - bh_ * 0.62, bx + bw_ / 2 - 4, sy - bh_ * 0.62, SP((60, 72, 110), 2.5))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx - 9, sy - bh_ * 0.62 - 4, bx + 9, sy - bh_ * 0.62 + 16), 4, 4), P(BRASS)); c.drawCircle(bx, sy - bh_ * 0.62 + 6, 3, P(BRASS_SH))
    for k_, (bx, col) in enumerate(((226, (150, 84, 70)), (250, (84, 110, 150)), (272, (196, 160, 96)), (296, (110, 140, 120)), (318, (150, 84, 70)), (344, (90, 96, 130)), (430, (84, 110, 150)), (454, (196, 160, 96)), (476, (130, 100, 140)))):   # ledgers
        hh = 78 + 10 * ((k_ * 7) % 3); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx - 11, 1530 - hh, bx + 11, 1530), 3, 3), P(mix(col, (40, 50, 90), 0.25))); c.drawRect(skia.Rect(bx - 11, 1530 - hh + 14, bx + 11, 1530 - hh + 22), P((226, 214, 180), 200)); c.drawRect(skia.Rect(bx + 6, 1530 - hh, bx + 11, 1530), P((20, 24, 60), 70))
    # a trolley on the floor (the strongboxes at 1760 and 1702 sit on it) and a step ladder against the shelves
    c.drawOval(skia.Rect(610, 1868, 900, 1896), P((10, 14, 40), 130, MaskFilter=blur(7)))
    c.drawRect(skia.Rect(620, 1760, 880, 1776), P((176, 150, 96))); c.drawRect(skia.Rect(620, 1772, 880, 1776), P((120, 96, 66)))
    for wx_ in (636, 864): c.drawRect(skia.Rect(wx_ - 5, 1776, wx_ + 5, 1852), P((120, 136, 176)))
    c.drawRect(skia.Rect(626, 1836, 874, 1846), P((120, 136, 176)))
    for wx_ in (650, 850): c.drawCircle(wx_, 1864, 16, P((40, 44, 70))); c.drawCircle(wx_, 1864, 6, P((170, 176, 200)))
    c.drawLine(880, 1762, 906, 1640, SP((150, 166, 204), 8)); c.drawLine(894, 1640, 918, 1640, SP((150, 166, 204), 8))
    for (lx0, lx1) in ((196, 222), (286, 262)):
        c.drawLine(lx0, 1880, lx1, 1700, SP((196, 160, 96), 9)); c.drawLine(lx0 + 3, 1880, lx1 + 3, 1700, SP((140, 108, 66), 3))
    for k_ in range(4): c.drawLine(203 + k_ * 5.4, 1846 - k_ * 40, 280 - k_ * 5.2, 1846 - k_ * 40, SP((176, 140, 84), 7))
    for (x, ph, r, p2, k) in DUST:                             # dust in the lamp light
        yy = 800 + ((ph + t * 0.03 * k) % 1.0) * 1060; xx = x + 16 * math.sin(t * 0.6 * k + p2)
        if 360 < xx < 720: c.drawCircle(xx, yy, r, P((255, 240, 200), 90 * k * fl, MaskFilter=blur(1)))


def tag(c, x, y, t, a=1.0):
    """a paper tag tied to the shelf under the empty place: HIS MONEY"""
    sw = 4 * math.sin(t * 1.6)
    c.save(); c.translate(x, y); c.rotate(sw); c.scale(1.5, 1.5)
    c.drawLine(0, 0, 0, 22, SP((230, 220, 200), 2.2, 255 * a))
    tp = poly([(-52, 34), (-40, 22), (40, 22), (52, 34), (52, 84), (-52, 84)])
    q = skia.Path(tp); q.offset(3, 5); c.drawPath(q, P((10, 14, 40), 110 * a, MaskFilter=blur(4)))
    c.drawPath(tp, P((250, 240, 214), 255 * a)); c.drawCircle(0, 31, 4, P((90, 100, 140), 255 * a))
    text(c, 'HIS', 0, 55, 19, (40, 44, 80), 255 * a); text(c, 'MONEY', 0, 77, 19, (200, 60, 60), 255 * a)
    c.restore()


def flow_path(k):
    p = skia.Path()
    if k == 0: p.moveTo(330, 1000); p.lineTo(330, 830); p.cubicTo(330, 750, 255, 780, 255, 704)
    else: p.moveTo(715, 1000); p.lineTo(715, 830); p.cubicTo(715, 750, 825, 780, 825, 704)
    return p


def flows(c, t, a, pulse=1.0):
    """the 90 that are out on loan: gold light from the vault to the house and the shop, with slow pulses still travelling"""
    if a <= 0.01: return
    for k in (0, 1):
        p = flow_path(k)
        c.drawPath(p, SP(GOLD, 26, 70 * a, MaskFilter=blur(12))); c.drawPath(p, SP(GOLD, 9, 150 * a, MaskFilter=blur(3))); c.drawPath(p, SP(GOLD_HI, 3.6, 255 * a))
        ms = skia.PathMeasure(p, False); ln = ms.getLength()
        for i in range(5):
            u = ((t * 0.33 + i / 5 + k * 0.1) % 1.0); pos, tan = ms.getPosTan(u * ln)
            c.drawCircle(pos.x(), pos.y(), 7, P((255, 250, 220), 235 * a * pulse * math.sin(math.pi * u) ** 0.5)); c.drawCircle(pos.x(), pos.y(), 16, P(GOLD, 130 * a * pulse, MaskFilter=blur(6)))


def n_cash(t, acts):
    n = 10
    for a in acts:
        if a['kind'] == 'take' and t >= a['t0'] + a['d'] * 0.45: n -= 1
        if a['kind'] == 'give' and t >= a['t0'] + a['d'] * 0.5: n += 1
    return max(0, n)


def contents(c, t, acts, ghosts=1.0):
    """everything on the shelf: the outlines of what was lent, his tag, the real cash"""
    T5 = TM['T5']
    his = smooth((t - TM['T_IN'] - 0.5) / 0.4)
    for i, x in enumerate(COLS):
        ga = smooth((t - (TM['T4'] + 0.25 + 0.2 * i)) / 0.25) if t < T5 else 1.0
        if i == 1:                                            # the place where his money would be shows first, lit: it is empty
            ga = max(ga, his); hot = his * (1 - smooth((t - TM['T4']) / 0.5))
            if hot > 0.01:
                c.drawPath(poly([(x - 16, 790), (x + 16, 790), (x + 84, SHELF_Y), (x - 84, SHELF_Y)]), P((255, 236, 190), 70 * hot, MaskFilter=blur(14))); c.drawOval(skia.Rect(x - 90, SHELF_Y - 210, x + 90, SHELF_Y + 20), P((255, 230, 180), 60 * hot * (0.8 + 0.2 * math.sin(t * 5)), MaskFilter=blur(26)))
            ghost(c, x, 10, ga * ghosts, col=mix((176, 204, 250), (255, 236, 200), hot)); continue_ = False
        else: ghost(c, x, 10, ga * ghosts)
        if t < T5 and t > TM['T4']:                           # in the example the packs are shown arriving: this is what was deposited
            fa = smooth((t - (TM['T4'] + 0.25 + 0.2 * i)) / 0.25)
            dim = lerp(1.0, 0.42, smooth((t - TM['T_AS']) / 0.35))      # only one column in ten is really cash: the rest fade toward outlines
            for j in range(10): pack(c, x, SHELF_Y - PH / 2 - PH * j - 30 * (1 - fa), a=fa * dim)
        elif t >= T5:                                         # then they leave as loans: each column lifts off and runs up the line of light
            tc = T5 + 0.3 + 0.1 * (i if i < 5 else i - 5) + (0.0 if i < 5 else 0.75)
            px = 330 if i < 5 else 715
            for j in range(10):
                u = (t - tc - 0.035 * (9 - j)) / 0.55
                if u >= 1: continue
                e = smooth(u); y0 = SHELF_Y - PH / 2 - PH * j
                pack(c, lerp(x, px, smooth(u * 1.4)), lerp(y0, 800, e * e), a=1 - smooth((u - 0.75) / 0.25), gold=smooth(u * 3))
    tag(c, 260, SHELF_Y + 18, t, his)
    n = n_cash(t, acts)
    c.drawOval(skia.Rect(REAL_X - 48, SHELF_Y - 8, REAL_X + 48, SHELF_Y + 6), P((10, 14, 40), 120, MaskFilter=blur(5)))
    for j in range(n): pack(c, REAL_X, SHELF_Y - PH / 2 - PH * j)
    return n


def hand_at(c, a, t, n_before):
    """one customer's hand: reaches in, closes its fingers round a pack and takes it away (take), or brings one and leaves it (give),
    or reaches for the bare shelf and closes on nothing (empty). A held pack lies across the fist and shows on both sides of it."""
    u = (t - a['t0']) / a['d']
    if u <= 0 or u >= 1: return
    kind = a['kind']; LK = PP.LOOKS[a['who']]; s = a.get('s', 0.95)
    ang = math.radians(a['ang']); ux, uy = math.cos(ang), math.sin(ang)
    j = a['j']
    tx, ty = (REAL_X + a.get('dx', 0), SHELF_Y - PH / 2 - PH * j) if kind != 'empty' else (REAL_X + a.get('dx', 0), SHELF_Y - 10)
    HO = 52
    if kind == 'empty':
        e = 1 - smooth(u / 0.17) if u < 0.5 else smooth((u - 0.86) / 0.14)
        g = 0.5 - 0.5 * math.cos((t - a['t0'] - 0.17 * a['d']) * 2 * math.pi / 0.62) if 0.17 < u < 0.86 else 0.0     # the fingers close on nothing, open, close again
        curl = H.blend(H.OPEN, H.GRIP, 0.95 * g); has = False
    else:
        e = (1 - smooth(u / 0.42)) if u < 0.5 else smooth((u - 0.55) / 0.45)
        if kind == 'take': g = smooth((u - 0.36) / 0.1); has = u >= 0.45
        else: g = 1 - smooth((u - 0.46) / 0.1); has = u < 0.5
        curl = H.blend(H.OPEN, H.GRIP, g)
    wx, wy = tx - ux * (HO * s + 470 * e), ty - uy * (HO * s + 470 * e)
    ts = a.get('ts', -1 if ux > 0 else 1)
    ex, ey = wx - ux * 900, wy - uy * 900
    sl = PN.limb((ex, ey), (wx - ux * 22 * s, wy - uy * 22 * s), 70 * s, 50 * s)
    q = skia.Path(sl); q.offset(5, 12); c.drawPath(q, P((8, 10, 34), 90, MaskFilter=blur(9)))
    if has:                                                   # the pack turns to lie across the fingers that hold it
        hold_ = smooth((u - 0.45) / 0.12) if kind == 'take' else 1 - smooth((u - 0.4) / 0.1)
        c.save(); c.translate(wx + ux * HO * s, wy + uy * HO * s); c.rotate((a['ang'] - 90) * hold_); pack(c, 0, 0); c.restore()
    c.drawPath(sl, P(LK['TOP'])); c.drawPath(PN.diffp(sl, (-5, -8)), P(LK['TOP_SH'])); c.drawPath(PN.diffp(sl, (4, 5)), P(LK['TOP_HI'], 200))
    cf = PN.limb((wx - ux * 40 * s, wy - uy * 40 * s), (wx - ux * 14 * s, wy - uy * 14 * s), 52 * s, 49 * s); c.drawPath(cf, P(mix(LK['TOP'], LK['TOP_SH'], 0.7))); c.drawPath(PN.diffp(cf, (3, 4)), P(LK['TOP_HI'], 150))
    H.hand(c, (wx, wy), ang, ts, s, skin=LK['SKIN'], shade=LK['SKIN_SH'], hi=LK['SKIN_HI'], light=PN.LIGHT, show_thumb=not has, creases=False, **curl)


def chip(c, txt, x, y, col, a=1.0, ink=(20, 18, 44), size=44, scale=1.0):
    if a <= 0.01: return
    f = skia.Font(L.BLACK, size); w = f.measureText(txt)
    c.save(); c.translate(x, y); s = scale * (0.9 + 0.1 * smooth(a)); c.scale(s, s)
    r = skia.RRect.MakeRectXY(skia.Rect(-w / 2 - 26, -size * 0.82, w / 2 + 26, size * 0.48), size * 0.6, size * 0.6)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w / 2 - 24, -size * 0.82 + 6, w / 2 + 28, size * 0.48 + 8), size * 0.6, size * 0.6), P((6, 8, 30), 120 * a, MaskFilter=blur(8)))
    c.drawRRect(r, P(col, 255 * a)); c.drawString(txt, -w / 2, size * 0.16, f, P(ink, 255 * a)); c.restore()


def cross(c, t, cam, acts):
    """the whole cut through the ground, seen with cam = (world x, world y, zoom); returns the world to screen mapping"""
    cx, cy, z = cam
    lit_h = smooth((t - TM['T_HOUSE']) / 0.5); lit_s = smooth((t - TM['T_SHOP']) / 0.5)
    dry = smooth((t - TM['T_DRY'] + 0.5) / 0.5) * (1 - smooth((t - TM['T_HEALTHY'] - 0.2) / 0.6) * 0.5)
    flick = 1.0
    if TM['T7'] + 0.5 < t < TM['T_HEALTHY']: flick = 0.72 + 0.28 * math.sin(t * 41) * math.sin(t * 13.3)
    c.save(); c.translate(540, 900); c.scale(z, z); c.translate(-cx, -cy)
    town(c, t, lit_h, lit_s)
    flick *= lerp(0.22, 1.0, smooth((t - TM['T4'] + 0.15) / 0.5))    # until the example starts the lamp over the cash is low: the light is on the empty place
    veil = 1 - smooth((t - TM['T5'] + 0.1) / 0.7)                 # the street above is not the subject until the loans go up to it
    if veil > 0.01: c.drawRect(skia.Rect(-600, -600, 1680, 708), P((10, 14, 40), 215 * veil))
    v2 = 0.62 * smooth((z - 1.3) / 0.5) * smooth((t - TM['T5']) / 0.5)   # pushed in on the shelf, the street above sits back behind the titles
    if v2 > 0.01: c.drawRect(skia.Rect(-600, -600, 1680, 708), P((10, 14, 40), 255 * v2))
    ground(c); room(c, t, cold=dry, lamp=flick * (1 - 0.35 * dry))
    fa = smooth((t - TM['T5'] - 0.35) / 0.5)
    flows(c, t, fa)
    n = contents(c, t, acts)
    for a in sorted(acts, key=lambda a: a['t0']): hand_at(c, a, t, n)
    if dry > 0.02: c.drawRect(skia.Rect(104, 784, 976, 1966), P((255, 60, 60), 30 * dry * (0.6 + 0.4 * math.sin(t * 7))))
    c.restore()
    return (lambda wx, wy: (540 + (wx - cx) * z, 900 + (wy - cy) * z)), n


# ------------------------------------------------------------------------------------------------ the wall and the round door
def wall(c, t, R, swing, spin, inside):
    """the bank's stone wall with the round vault door in it, centred on (540, 960); `inside(c)` draws what is behind the door.
    swing 0 = shut, 1 = swung fully open on its left hinge"""
    cx, cy = 540, 960
    grad(c, skia.Rect(-3000, -3000, 4080, 4920), (0, 0), (0, 1920), [(244, 226, 192), (222, 198, 166)])
    for j in range(-12, 24):
        y0 = j * 150 - 30
        c.drawLine(-3000, y0, 4080, y0, SP(STONE_SH, 6, 170)); c.drawLine(-3000, y0 + 6, 4080, y0 + 6, SP(STONE_HI, 3, 200))
        for i in range(-10, 16):
            x0 = i * 300 + (150 if j % 2 else 0); c.drawLine(x0, y0, x0, y0 + 150, SP(STONE_SH, 6, 150)); c.drawLine(x0 + 6, y0 + 4, x0 + 6, y0 + 150, SP(STONE_HI, 3, 170))
    c.drawCircle(cx + 14, cy + 26, R + 70, P((60, 44, 70), 120, MaskFilter=blur(26)))
    c.drawCircle(cx, cy, R + 58, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(cx - R, cy - R), skia.Point(cx + R, cy + R)], [C((214, 224, 242)), C((130, 144, 178)), C((84, 94, 130))], [0, 0.5, 1])))
    for i in range(16):
        a = i * math.pi / 8 + 0.2; c.drawCircle(cx + (R + 34) * math.cos(a), cy + (R + 34) * math.sin(a), 11, P((84, 94, 130))); c.drawCircle(cx + (R + 34) * math.cos(a) - 3, cy + (R + 34) * math.sin(a) - 3, 4.5, P((226, 234, 248)))
    c.drawCircle(cx, cy, R + 6, P((40, 46, 76)))
    hole = skia.Path(); hole.addCircle(cx, cy, R)
    c.save(); c.clipPath(hole, skia.ClipOp.kIntersect, True)
    c.drawPaint(P((14, 18, 40)))
    if swing > 0.01: inside(c)
    c.drawCircle(cx, cy, R, SP((6, 8, 26), 46, 150, MaskFilter=blur(16)))                                              # the thickness of the wall shades the edge of the opening
    c.restore()
    phi = math.radians(96 * swing); k = math.cos(phi); hx = cx - R - 26
    if swing < 0.995:
        c.save(); c.translate(hx, 0); c.scale(max(0.02, k), 1); c.translate(-hx, 0)
        Rd = R + 14
        c.drawCircle(cx, cy, Rd, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(cx - Rd, cy - Rd), skia.Point(cx + Rd, cy + Rd)], [C((228, 236, 250)), C((150, 164, 198)), C((96, 108, 148))], [0, 0.5, 1])))
        c.drawCircle(cx, cy, Rd - 4, SP((240, 244, 252), 5, 200)); c.drawCircle(cx, cy, Rd * 0.8, SP((96, 108, 148), 7, 200)); c.drawCircle(cx, cy, Rd * 0.8 - 6, SP((226, 232, 246), 3, 200))
        for i in range(12):
            a = i * math.pi / 6; c.drawCircle(cx + Rd * 0.9 * math.cos(a), cy + Rd * 0.9 * math.sin(a), 12, P((90, 100, 140))); c.drawCircle(cx + Rd * 0.9 * math.cos(a) - 3, cy + Rd * 0.9 * math.sin(a) - 3, 5, P((230, 236, 250)))
        for i in range(4):                                    # the locking bars pull in as the wheel turns
            a = i * math.pi / 2 + math.pi / 4; r0 = Rd * 0.3; r1 = Rd * (0.78 - 0.2 * smooth(spin))
            c.drawLine(cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + r1 * math.cos(a), cy + r1 * math.sin(a), SP((70, 80, 116), 30)); c.drawLine(cx + r0 * math.cos(a) - 4, cy + r0 * math.sin(a) - 4, cx + r1 * math.cos(a) - 4, cy + r1 * math.sin(a) - 4, SP((200, 210, 234), 9))
        wr = Rd * 0.36
        c.save(); c.translate(cx, cy); c.rotate(spin * 300)
        c.drawCircle(4, 8, wr + 10, P((30, 30, 60), 100, MaskFilter=blur(10)))
        for i in range(5):
            a = i * 2 * math.pi / 5; c.drawLine(0, 0, wr * math.cos(a), wr * math.sin(a), SP(BRASS_SH, 22)); c.drawLine(-2, -3, wr * math.cos(a) - 2, wr * math.sin(a) - 3, SP(BRASS, 13))
        c.drawCircle(0, 0, wr, SP(BRASS_SH, 26)); c.drawCircle(-2, -3, wr, SP(BRASS, 16)); c.drawCircle(-4, -6, wr, SP(BRASS_HI, 4, 220))
        c.drawCircle(0, 0, wr * 0.3, P(BRASS_SH)); c.drawCircle(-3, -4, wr * 0.24, P(BRASS)); c.drawCircle(-7, -9, wr * 0.08, P(BRASS_HI))
        c.restore()
        c.drawCircle(cx, cy, Rd, P((10, 14, 40), 150 * (1 - k)))                                                      # the door's face turns away from the light as it opens
        c.restore()
    if swing > 0.02:                                          # the edge of the thick door shows once it has swung
        th = 80 * math.sin(phi); xe = hx + (cx + R + 14 - hx) * max(0.02, k)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(min(hx, xe) - th * 0.2, cy - R * 0.98, min(hx, xe) + th, cy + R * 0.98), 20, 20) if swing > 0.97 else skia.RRect.MakeRectXY(skia.Rect(xe - 2, cy - R * 0.94 * (0.4 + 0.6 * k), xe + th, cy + R * 0.94 * (0.4 + 0.6 * k)), 16, 16), P((74, 84, 122)))
    for hy in (cy - R * 0.5, cy + R * 0.5):                   # the hinges
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hx - 44, hy - 46, hx + 30, hy + 46), 12, 12), P((96, 108, 148))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hx - 44, hy - 46, hx + 30, hy - 34), 6, 6), P((210, 220, 240)))
        c.drawCircle(hx - 8, hy, 12, P((60, 68, 104)))
