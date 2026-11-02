"""w1031-02-phineas-gage (AP Psychology). All code (skia), house flat style, knight v3 method.
Art plan:
- Scene A, the railroad cut near Cavendish, Vermont, 1848, about 4:30 pm: low warm sun from the right, hazy Green
  Mountain ridges in layers, a conifer band, faceted rock walls of the cut, a gravel bed, far workers and a cart.
  Why it fits: Gage was a blasting foreman on the Rutland and Burlington Railroad cutting rock there.
- Gage: a period worker (brimmed hat, shirt, vest) built from parts (figure.Person), seen in profile facing left,
  tamping powder into an already drilled hole with the long iron (blunt end down, tapered end up). No face detail
  needed: small scale, rim light.
- Motion list (checked): tamp strokes 0 to 4.6 s; on "spark" the iron strikes rock and sparks; on "off" the powder
  blasts; the iron shoots up TAPERED END FIRST (fact check) and the camera tilts up after it; he is knocked back.
  Head cutaway (his own head in profile, facing left so we see the LEFT side): the iron enters below the left
  cheekbone, passes behind the left eye and exits the top front of the skull near the midline; only the LEFT frontal
  lobe is highlighted. The iron lands point first about 80 ft away. He sits up and talks, two workers run in.
  Afterward: dusk, he walks away while friends watch. Loop: the opening tamp and one spark.
"""
import sys, math, os
sys.path[:0] = ['/home/claude/lp/w1031/lib']
import numpy as np, skia
from lpk import *
from figure import Person
import ctchars as tchars
import layout as L
import skull as SKL
import scenekit as SK

ID = 'w1031-02-phineas-gage'
OUT = f'/home/claude/lp/w1031/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(spark=WD.at('spark'), off=WD.at('off'), this=WD.at('this'), skull=WD.at('skull'), went=WD.at('went'),
         came=WD.at('came'), landed=WD.at('landed'), feet=WD.at('feet'), somehow=WD.at('somehow'), talking=WD.at('talking'),
         but=WD.at('but'), frontal=WD.at('frontal'), plans=WD.at('plans'), keeps=WD.at('keeps'), and2=WD.at('and', 5),
         friends=WD.at('friends'), longer=WD.at('longer'), all=WD.at('all'), spark2=WD.at('spark', 2))
END = WD.end()
DUR = END + 1.6
CAP = Captions(WD.w, {'eighteen': '1848', 'forty': '', 'eight,': ''})
# fold "eighteen forty eight" into one caption word
for ch in CAP.chunks:
    ch[:] = [x for x in ch if x['d'] != '']
CAP.chunks = [ch for ch in CAP.chunks if ch]
SK.merge_singles(CAP)
rng = np.random.default_rng(7)

SUN = (255, 214, 150)
RIM = (255, 200, 130)


# ===================================================================== scene A: the rock cut
def sky(c, u_dusk=0.0, top=-2600):
    a = [(118, 156, 206), (170, 196, 222), (236, 214, 178), (255, 214, 160)]
    b = [(56, 52, 108), (132, 86, 128), (232, 128, 104), (255, 168, 112)]
    cols = [mix(x, y, u_dusk) for x, y in zip(a, b)]
    lgrad(c, skia.Rect(-900, top, 2000, 1500), top, 900, cols, [0, 0.55, 0.85, 1.0])


def clouds(c, t):
    """flat clouds: puffs unioned with round bottoms, a soft lavender underside and a warm rim on the sunlit top
    right, all drawn opaque. None of them reaches the title zone at the end of the tilt."""
    for k, (y, x0, sc) in enumerate(((-700, 160, 1.0), (-1000, 640, 1.2))):
        x = x0 + 14 * t
        p = skia.Path()
        for dx, dy, r in ((0, 0, 60), (70, -24, 70), (150, -6, 64), (220, 8, 50), (-60, 10, 46), (110, 22, 50), (30, 24, 44)):
            p.addCircle(x + dx * sc, y + dy * sc, r * sc)
        p = skia.Op(p, p, skia.PathOp.kUnion_PathOp) or p
        c.drawPath(p, P((248, 240, 230)))
        q = skia.Path(p); q.offset(-8 * sc, -16 * sc)
        c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(p, P((226, 216, 226))); c.restore()
        q = skia.Path(p); q.offset(-6, 6)
        c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(p, P((255, 222, 170))); c.restore()


def sun(c, x, y, u=1.0):
    c.drawCircle(x, y, 220, P((255, 220, 160), 110 * u, MaskFilter=blur(90), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(x, y, 58, P((255, 244, 214), 255 * u))


RID1 = jag([(-400, 760), (-100, 720), (120, 690), (300, 730), (520, 680), (760, 700), (980, 660), (1500, 700)], 1, 5)
RID2 = jag([(-400, 820), (0, 790), (220, 800), (420, 760), (640, 800), (860, 770), (1500, 790)], 2, 6)
RID3 = jag([(-400, 880), (100, 860), (300, 870), (520, 850), (760, 880), (1000, 860), (1500, 870)], 3, 5)


def far(c, t, u_dusk=0.0, par=0.0):
    c.save(); c.translate(par * 0.1, 0)
    c.drawPath(ridge(RID1), P(mix((176, 184, 210), (126, 104, 150), u_dusk)))
    c.restore()
    c.save(); c.translate(par * 0.2, 0)
    c.drawPath(ridge(RID2), P(mix((138, 152, 182), (98, 80, 126), u_dusk)))
    # haze band between ridges
    c.drawRect(skia.Rect(-600, 800, 1700, 900), P(mix((236, 222, 200), (200, 140, 140), u_dusk), 90, MaskFilter=blur(30)))
    c.restore()
    c.save(); c.translate(par * 0.3, 0)
    c.drawPath(ridge(RID3), P(mix((92, 116, 116), (66, 58, 92), u_dusk)))
    # conifers along the near ridge, swaying a touch
    rs = np.random.default_rng(5)
    for k in range(70):
        x = -380 + k * 28 + rs.uniform(-8, 8); h = rs.uniform(60, 130); y = 880 + rs.uniform(-10, 18)
        sw = 2.0 * math.sin(t * 1.1 + k * 0.7)
        col = mix((58, 84, 76), (44, 42, 70), u_dusk); colsh = tuple(v * 0.8 for v in col)
        tr = poly([(x + sw, y - h), (x + 18, y), (x - 18, y)])
        c.drawPath(tr, P(col))
        c.drawPath(poly([(x + sw, y - h), (x - 18, y), (x - 4, y)]), P(colsh))
    c.restore()


WALL_L = [(-300, 520), (-40, 560), (120, 640), (230, 760), (300, 900), (330, 1080), (360, 1180)]
WALL_R = [(1380, 500), (1110, 560), (960, 650), (870, 780), (820, 940), (790, 1100), (760, 1190)]


def walls(c, t, u_dusk=0.0):
    base = mix((150, 128, 112), (96, 74, 86), u_dusk); sh = mix((112, 92, 88), (66, 50, 66), u_dusk)
    lit = mix((196, 170, 140), (176, 112, 96), u_dusk); deep = tuple(v * 0.78 for v in sh)
    # left wall: in shade (sun from the right); stepped ledges of bedrock with lit tops and darker risers
    pl = poly(WALL_L + [(360, 3200), (-900, 3200), (-900, 520)])
    c.drawPath(pl, P(sh))
    c.save(); c.clipPath(pl, skia.ClipOp.kIntersect, True)
    for i, (y0, x0) in enumerate(((620, 60), (760, 170), (900, 250), (1040, 300))):
        top = poly([(x0 - 260, y0 + 6), (x0 + 30, y0 - 20), (x0 + 50, y0 + 8), (x0 - 250, y0 + 34)])
        c.drawPath(top, P(mix(sh, base, 0.55)))
        c.drawPath(poly([(x0 - 250, y0 + 34), (x0 + 50, y0 + 8), (x0 + 60, y0 + 90), (x0 - 220, y0 + 120)]), P(mix(sh, base, 0.2)))
        c.drawPath(poly([(x0 + 50, y0 + 8), (x0 + 60, y0 + 90), (x0 + 40, y0 + 94), (x0 + 34, y0 + 10)]), P(deep))
        c.drawLine(x0 - 140, y0 + 44, x0 - 120, y0 + 96, SP(deep, 2.5)); c.drawLine(x0 - 40, y0 + 30, x0 - 50, y0 + 70, SP(deep, 2))
    c.restore()
    pr = poly(WALL_R + [(760, 3200), (2000, 3200), (2000, 500)])
    c.drawPath(pr, P(base))
    c.save(); c.clipPath(pr, skia.ClipOp.kIntersect, True)
    # lit slabs: each a lit face, a narrow top facet catching the sun and a shaded underside, a crack or two
    for k, (y0, x0, w_, h_) in enumerate(((600, 1060, 250, 92), (722, 952, 230, 100), (866, 884, 210, 88), (1004, 846, 190, 84))):
        face = poly([(x0, y0), (x0 + w_, y0 - 28), (x0 + w_ + 18, y0 + h_ - 28), (x0 + 16, y0 + h_)])
        c.drawPath(face, P(lit))
        c.drawPath(poly([(x0, y0), (x0 + w_, y0 - 28), (x0 + w_ - 10, y0 - 40), (x0 - 8, y0 - 12)]), P(mix(lit, (255, 236, 200), 0.35)))
        c.drawPath(poly([(x0 + 16, y0 + h_), (x0 + w_ + 18, y0 + h_ - 28), (x0 + w_ + 14, y0 + h_ - 10), (x0 + 22, y0 + h_ + 18)]), P(sh))
        c.drawPath(poly([(x0, y0), (x0 + 16, y0 + h_), (x0 + 6, y0 + h_ + 4), (x0 - 8, y0 + 4)]), P(mix(sh, base, 0.4)))
        cx_ = x0 + w_ * (0.35 + 0.2 * (k % 2))
        c.drawLine(cx_, y0 - 6, cx_ + 10, y0 + h_ * 0.6, SP(mix(lit, sh, 0.55), 2.2))
    c.restore()
    rr = rim_of(pr, (-4, 0))
    if rr is not None: c.drawPath(rr, P(RIM, 160))


def ground(c, t, u_dusk=0.0):
    g = mix((172, 146, 112), (110, 84, 92), u_dusk)
    lgrad(c, skia.Rect(-900, 1150, 2000, 3400), 1150, 1700, [mix(g, (210, 190, 160), 0.2), g, tuple(v * 0.8 for v in g)])
    rs = np.random.default_rng(11)
    for k in range(260):
        x = rs.uniform(-500, 1600); y = rs.uniform(1180, 1900)
        r = rs.uniform(2, 6) * (0.5 + (y - 1150) / 700); f_ = rs.uniform(0.7, 0.95)
        c.drawOval(skia.Rect(x - r * 1.5, y - r, x + r * 1.5, y + r * 0.6), P(tuple(v * f_ for v in g)))
    props(c, t, u_dusk)


def props(c, t, u_dusk=0.0):
    """a stack of planks and a powder keg by the far wall, each with a soft contact shadow"""
    wood, wood_sh, end = mix((150, 108, 70), (90, 64, 60), u_dusk), mix((112, 78, 52), (66, 46, 48), u_dusk), mix((196, 160, 112), (130, 96, 80), u_dusk)
    c.drawOval(skia.Rect(740, 1150, 930, 1172), P((70, 50, 40), 110, MaskFilter=blur(6)))
    for k in range(4):
        y = 1156 - k * 12; x0 = 752 + (k % 2) * 6
        c.drawPath(poly([(x0, y - 10), (x0 + 136, y - 14), (x0 + 136, y - 3), (x0, y + 1)]), P(wood if k % 2 == 0 else wood_sh))
        c.drawPath(poly([(x0 + 136, y - 14), (x0 + 146, y - 12), (x0 + 146, y - 1), (x0 + 136, y - 3)]), P(end))
    kx, ky = 910, 1160
    keg = smooth_closed([(kx - 18, ky - 50), (kx + 18, ky - 50), (kx + 23, ky - 25), (kx + 18, ky), (kx - 18, ky), (kx - 23, ky - 25)])
    flat(c, keg, mix((126, 88, 58), (80, 56, 56), u_dusk), mix((94, 64, 44), (58, 40, 44), u_dusk), sh_off=(8, 0), rim=RIM, rim_d=(-3, 0), rim_a=200)
    for yy in (ky - 42, ky - 10):
        c.drawLine(kx - 20, yy, kx + 20, yy, SP(mix((70, 66, 70), (44, 40, 52), u_dusk), 3))
    c.drawOval(skia.Rect(kx - 18, ky - 56, kx + 18, ky - 45), P(end))


def ledge(c, t, u_dusk=0.0):
    """the bedrock outcrop Gage stands on, with the drilled hole he is tamping: an angular sunlit top with a crack and
    a small step, faceted front faces, loose rubble along its foot"""
    top_c = mix((168, 150, 132), (118, 96, 104), u_dusk)
    face, face_sh, deep = mix((128, 110, 98), (86, 66, 80), u_dusk), mix((104, 88, 82), (70, 54, 68), u_dusk), mix((80, 68, 66), (54, 42, 56), u_dusk)
    top = poly([(-200, 1300), (60, 1296), (180, 1288), (300, 1294), (430, 1290), (560, 1298), (690, 1304), (760, 1316), (792, 1338), (770, 1356),
                (640, 1362), (420, 1366), (200, 1362), (-200, 1358)])
    c.drawPath(top, P(top_c))
    c.drawPath(poly([(560, 1298), (690, 1304), (760, 1316), (792, 1338), (700, 1330), (600, 1316)]), P(mix(top_c, (255, 232, 196), 0.28)))   # sunlit step
    c.drawPath(poly([(-200, 1300), (60, 1296), (180, 1288), (160, 1300), (-200, 1310)]), P(mix(top_c, face_sh, 0.35)))                         # far edge in shade
    for pts in ([(80, 1320), (140, 1332), (170, 1352)], [(470, 1300), (500, 1318), (488, 1340)]):
        p = skia.Path(); p.moveTo(*pts[0]); [p.lineTo(*q_) for q_ in pts[1:]]; c.drawPath(p, SP(face_sh, 2.2))
    fr = poly([(-200, 1356), (200, 1360), (420, 1364), (640, 1360), (770, 1354), (792, 1338), (808, 1400), (760, 1446), (520, 1462), (240, 1458), (-200, 1450)])
    c.drawPath(fr, P(face))
    c.save(); c.clipPath(fr, skia.ClipOp.kIntersect, True)
    for x0, x1, col in ((100, 170, face_sh), (330, 360, face_sh), (560, 610, face_sh), (700, 820, deep)):
        c.drawPath(poly([(x0, 1350), (x1, 1350), (x1 + 24, 1470), (x0 - 6, 1470)]), P(col))
    c.drawPath(poly([(-200, 1420), (820, 1420), (820, 1470), (-200, 1470)]), P(deep, 120))
    c.restore()
    # rubble along the foot of the ledge
    rs = np.random.default_rng(61)
    for k in range(14):
        x = rs.uniform(-60, 840); r = rs.uniform(8, 20); y = 1452 + rs.uniform(-6, 10)
        pr_ = poly([(x - r, y), (x - r * 0.5, y - r * 0.8), (x + r * 0.6, y - r * 0.7), (x + r, y), (x, y + r * 0.3)])
        flat(c, pr_, face, deep, sh_off=(6, -2), rim=RIM, rim_d=(-2.5, 2), rim_a=150)
    rr = rim_of(top, (-5, 2))
    if rr is not None: c.drawPath(rr, P(RIM, 140))
    # the drill hole: a small dark mouth with a sunlit lip
    hx, hy = HOLE
    c.drawOval(skia.Rect(hx - 17, hy - 6, hx + 17, hy + 6), P((40, 30, 30)))
    c.drawArc(skia.Rect(hx - 17, hy - 6, hx + 17, hy + 6), 20, 140, False, SP(mix(top_c, (255, 232, 196), 0.4), 2.5))


def _rock(c, x, y, r, seed, base, sh, top):
    """a near rock: an irregular body, a lit top facet toward the sun (right), a shaded left face, a soft foot shadow"""
    rs = np.random.default_rng(seed)
    pts = [(x + r * (0.85 + 0.3 * rs.uniform()) * math.cos(a), y + r * 0.62 * (0.85 + 0.3 * rs.uniform()) * math.sin(a))
           for a in np.linspace(math.pi, 2 * math.pi, 7)]
    body = poly(pts + [(x + r * 1.02, y + r * 0.16), (x - r * 1.02, y + r * 0.16)])
    c.drawOval(skia.Rect(x - r * 1.2, y + r * 0.02, x + r * 1.25, y + r * 0.3), P((40, 30, 30), 90, MaskFilter=blur(4)))
    c.drawPath(body, P(base))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawPath(poly([pts[2], pts[3], pts[5], (x + r, y - r * 0.05), (x + r * 0.3, y - r * 0.15), (x - r * 0.2, y - r * 0.25)]), P(top))
    c.drawPath(poly([(x - r * 1.2, y + r), (x - r * 1.2, y - r), pts[2], (x - r * 0.25, y - r * 0.2), (x - r * 0.05, y + r)]), P(sh))
    c.restore()


def fg_rubble(c, t, dx=0.0, u_dusk=0.0, y0=1600):
    """near layer under the captions (screen space, parallax): blasted rock and gravel to the bottom of the frame,
    darker and more saturated than the scene"""
    c.save(); c.translate(dx, 0)
    g_ = mix((120, 100, 82), (70, 52, 64), u_dusk)
    gp_ = jag([(-200, y0 + 30), (100, y0 + 4), (360, y0 + 24), (620, y0), (900, y0 + 20), (1300, y0 + 6)], 51, 6, 26)
    c.drawPath(ridge(gp_, 2200), P(g_))
    gp2 = jag([(-200, y0 + 170), (200, y0 + 150), (520, y0 + 176), (820, y0 + 150), (1300, y0 + 170)], 53, 6, 26)
    c.drawPath(ridge(gp2, 2200), P(tuple(v * 0.82 for v in g_)))
    rs = np.random.default_rng(52)
    for k in range(90):
        x = rs.uniform(-150, 1250); y = rs.uniform(y0 + 30, max(y0 + 31, 1950)); r = rs.uniform(3, 9); f_ = rs.uniform(0.7, 1.15)
        c.drawOval(skia.Rect(x - r * 1.4, y - r * 0.8, x + r * 1.4, y + r * 0.6), P(tuple(min(255, v * f_) for v in g_)))
    base, sh, top = mix((140, 122, 108), (88, 66, 78), u_dusk), mix((104, 88, 80), (60, 46, 58), u_dusk), mix((196, 176, 150), (130, 100, 104), u_dusk)
    for k, (x, y, r) in enumerate(((40, y0 + 50, 70), (200, y0 + 80, 38), (880, y0 + 40, 86), (1050, y0 + 90, 60), (620, y0 + 110, 34),
                                   (420, y0 + 130, 28), (120, y0 + 230, 90), (560, y0 + 250, 60), (960, y0 + 260, 100), (330, y0 + 300, 44))):
        if y - r > 1930: continue
        _rock(c, x, y, r, 70 + k, base, sh, top)
    c.restore()


def far_workers(c, t, u_dusk=0.0):
    for k, (x, ph) in enumerate(((820, 0.0), (870, 1.7))):
        col = mix((70, 60, 64), (40, 34, 48), u_dusk)
        sw = math.sin(t * 2.2 + ph)
        y = 1150
        c.drawPath(poly([(x - 7, y - 50), (x + 7, y - 50), (x + 6, y - 20), (x - 6, y - 20)]), P(col))
        c.drawLine(x - 3, y - 20, x - 4, y, SP(col, 5)); c.drawLine(x + 3, y - 20, x + 4, y, SP(col, 5))
        c.drawCircle(x, y - 57, 6, P(col)); c.drawLine(x - 10, y - 62, x + 10, y - 62, SP(col, 3))
        # pick swing for one, shovel for the other
        a = -1.2 + 0.8 * (0.5 + 0.5 * sw)
        c.drawLine(x, y - 44, x + 26 * math.cos(a), y - 44 + 26 * math.sin(a), SP(col, 3))


def motes(c, t, n=40, region=(0, 600, 1080, 1400), col=(255, 232, 190)):
    rs = np.random.default_rng(9)
    for k in range(n):
        x0, y0, sp = rs.uniform(region[0], region[2]), rs.uniform(region[1], region[3]), rs.uniform(6, 16)
        x = (x0 - sp * t) % (region[2] - region[0] + 60) + region[0] - 30
        y = y0 + 12 * math.sin(t * 0.7 + k)
        c.drawCircle(x, y, rs.uniform(1.2, 2.6), P(col, 90 + 60 * math.sin(t * 2 + k)))


# ===================================================================== Gage and the iron
S = 2.7
TS, TX0 = 0.86, 110.0
TY0 = 1335 - 1150 * TS
HOLE = (TX0 + 265 * TS, TY0 + 1138 * TS)
_cm = tchars.tamp_upper_matrix(0.0, 0.0).mapXY(*tchars.CHEEK)   # where the cheek is in the held pose at the blast
CHEEK = (TX0 + _cm.x() * TS, TY0 + _cm.y() * TS)
FOOT = (TX0 + 470 * TS, 1335)
ROD_L = math.dist(tchars.ROD_TOP, tchars.ROD_BOT) * TS     # the held iron's length, kept in flight (3 ft 7 in)
ROD_WK = 0.62


def rod(c, x0, y0, x1, y1, a=255, glint=0.0, wk=1.0):
    """the tamping iron: 1.25 in round bar, tapered over its top 11 in; (x0, y0) blunt end, (x1, y1) point"""
    dx, dy = x1 - x0, y1 - y0; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d; w = 5.0 * S * wk
    tx, ty = x0 + dx * 0.74, y0 + dy * 0.74
    pw = max(0.8, w * 0.2)
    body = poly([(x0 + nx * w, y0 + ny * w), (tx + nx * w, ty + ny * w), (x1 + nx * pw, y1 + ny * pw), (x1 - nx * pw, y1 - ny * pw),
                 (tx - nx * w, ty - ny * w), (x0 - nx * w, y0 - ny * w)])
    flat(c, body, (86, 88, 100), (58, 58, 72), sh_off=(-3, 0), rim=(255, 220, 170), rim_d=(-2.5, 0), rim_a=220, a=a)
    c.drawLine(x0 + nx * w * 0.35, y0 + ny * w * 0.35, tx + nx * w * 0.35, ty + ny * w * 0.35, SP((176, 180, 196), max(1.2, w * 0.3), a * 0.8))
    if glint > 0.02:
        gx, gy = x0 + dx * 0.6, y0 + dy * 0.6
        L_ = 40 * glint
        for ang in (0, 90, 45, 135):
            r = math.radians(ang); k = 1.0 if ang in (0, 90) else 0.45
            c.drawLine(gx - L_ * k * math.cos(r), gy - L_ * k * math.sin(r), gx + L_ * k * math.cos(r), gy + L_ * k * math.sin(r), SP((255, 248, 226), 2.6, 255 * glint))
        c.drawCircle(gx, gy, 7 * glint, P((255, 250, 235), 255 * glint, MaskFilter=blur(4)))


GAGE = Person(s=S, shirt=(226, 210, 184), vest=(86, 64, 56), pants=(78, 72, 92), skin=(216, 164, 124), hat=(68, 54, 48),
              boots=(52, 40, 36), hair=(84, 58, 40), light=1, rim=RIM)


def tamp_phase(t):
    """tamp strokes about every 1.0 s; returns iron lift (0 down at the hole .. 1 up) and the strike flag time"""
    p = (t / 0.7) % 1.0
    lift = smooth(p / 0.55) * (1 - smooth((p - 0.6) / 0.38))
    return lift


def gage_tamping(c, t, knock=0.0, hold=True):
    lift = tamp_phase(t) if t < T['spark'] else 0.0
    br = math.sin(t * 1.7)
    if hold:
        g1, g0 = tchars.grip_screen(TX0, TY0, TS, lift, br)
        ox, oy = g1[0] - g0[0], g1[1] - g0[1]
        top = (TX0 + tchars.ROD_TOP[0] * TS + ox, TY0 + tchars.ROD_TOP[1] * TS + oy)
        bot = (TX0 + tchars.ROD_BOT[0] * TS + ox, TY0 + tchars.ROD_BOT[1] * TS + oy)
        c.save(); c.clipRect(skia.Rect(-500, -3000, 2000, HOLE[1] + 2))
        rod(c, bot[0], bot[1], top[0], top[1], wk=0.62)
        c.restore()
    # the entry wound under his left cheekbone appears the moment the iron hits his cheek (about 0.12 s after "off")
    wound = smooth((t - T['off'] - 0.12) / 0.15) if T['off'] < t < T['went'] else 0.0
    if knock < 0.05:
        if hasattr(tchars, 'TAMP_FEET') and not tchars.TAMP_FEET:      # first frame (stills): measure the boots once
            tchars.draw_tamp(skia.Surface(8, 8).getCanvas(), t, TX0, TY0, TS, lift, br, 0.0)
        for xl, xr, gy in getattr(tchars, 'TAMP_FEET', []):
            c.drawOval(skia.Rect(xl - 10, gy - 7, xr + 14, gy + 9), P((50, 36, 32), 120, MaskFilter=blur(5)))
    tchars.draw_tamp(c, t, TX0, TY0, TS, lift, br, knock, hat_fly=smooth((t - T['off'] - 0.25) / 0.9) if T['off'] < t < T['went'] else 0.0, wound=wound)


def _puff(cx, cy, r, seed, t):
    rs = np.random.default_rng(seed)
    pts = [(cx + r * (0.82 + 0.25 * rs.uniform()) * math.cos(a) + 3 * math.sin(t * 2 + a * 3), cy + r * (0.78 + 0.25 * rs.uniform()) * math.sin(a))
           for a in np.linspace(0, 2 * math.pi, 9, endpoint=False)]
    return smooth_closed(pts)


def blast(c, t, x, y):
    """the powder goes off in the drill hole: a white flash, spark streaks and rock chips out of the hole, a short
    yellow and orange fireball, then layered smoke and dust rolling up (lit from the sun on the right)"""
    u = t - T['off']
    if u < 0 or u > 3.2: return
    f = math.exp(-u / 0.10)
    c.drawCircle(x, y - 40, 300 * (0.5 + u), P((255, 240, 210), 230 * f, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))
    grow = 1 - math.exp(-u / 0.35)
    # smoke and dust: three layered masses; each layer's puffs are merged into one billowing shape and toned as one
    # (a darker underside, a sunlit top right), kept mostly left of his legs so his body never reads as cut
    rs = np.random.default_rng(31)
    al = (1 - smooth((u - 0.8) / 2.3)) * (1 - smooth((u - 0.75) / 0.5))
    for layer, (col, lit_, dark_, n) in enumerate((((112, 98, 92), (150, 132, 118), (90, 78, 74), 6), ((150, 132, 118), (196, 176, 150), (122, 106, 98), 6),
                                                    ((186, 168, 146), (232, 214, 184), (156, 138, 122), 5))):
        mass = skia.Path(); mass.setFillType(skia.PathFillType.kWinding)
        for k in range(n):
            a = math.radians(-118 + rs.uniform(-40, 30)); sp = rs.uniform(0.6, 1.0)
            d = (40 + 360 * grow * sp)
            cx, cy = x + d * math.cos(a) * 1.1 - 20 * u, y - 30 + d * math.sin(a) * 0.9 - 80 * u * (layer + 1) / 3
            r = (46 + 140 * grow) * rs.uniform(0.6, 1.0) * (1 - 0.15 * layer)
            mass.addPath(_puff(cx, cy, r, 100 + layer * 10 + k, t))
        c.saveLayer(None, skia.Paint(Alphaf=max(0.0, min(1.0, 0.92 * al))))
        c.drawPath(mass, P(col))
        q = skia.Path(mass); q.offset(0, -22)
        c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(mass, P(dark_)); c.restore()
        q = skia.Path(mass); q.offset(-26, 22)
        c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(mass, P(lit_)); c.restore()
        c.restore()
    # fireball: short lived lobes out of the hole, yellow core inside orange
    fa = 1 - smooth(u / 0.35)
    if fa > 0:
        for col, k_ in (((255, 140, 50), 1.0), ((255, 200, 90), 0.66), ((255, 246, 206), 0.32)):
            pts = [(x + (60 + 150 * grow) * k_ * math.cos(a) * (0.75 + 0.3 * math.sin(a * 3.7 + t * 31)),
                    y - 20 - (40 + 160 * grow) * k_ * 0.9 + (40 + 150 * grow) * k_ * math.sin(a) * (0.75 + 0.3 * math.cos(a * 2.9 + t * 27)))
                   for a in np.linspace(0, 2 * math.pi, 14, endpoint=False)]
            c.drawPath(smooth_closed(pts), P(col, 255 * fa))
    # spark streaks: short bright lines flying out of the hole, fading in 0.4 s
    sa = 1 - smooth(u / 0.45)
    if sa > 0:
        rs2 = np.random.default_rng(22)
        for k in range(26):
            a = math.radians(rs2.uniform(-165, -15)); v = rs2.uniform(600, 1500)
            px = x + v * math.cos(a) * u; py = y + v * math.sin(a) * u + 700 * u * u
            c.drawLine(px, py, px - v * math.cos(a) * 0.05, py - (v * math.sin(a) + 1400 * u) * 0.05, SP((255, 228, 150), 3, 255 * sa))
    # rock chips from the hole: angular, two tones, tumbling on ballistic arcs
    rs3 = np.random.default_rng(23)
    for k in range(18):
        a = math.radians(rs3.uniform(-160, -20)); v = rs3.uniform(500, 1100); spin = rs3.uniform(-14, 14)
        px = x + v * math.cos(a) * u; py = y + v * math.sin(a) * u + 1000 * u * u
        if py > y + 20 or u > 1.6: continue
        r = rs3.uniform(5, 12)
        c.save(); c.translate(px, py); c.rotate(math.degrees(spin * u))
        chip = poly([(-r, -r * 0.3), (-r * 0.2, -r), (r, -r * 0.4), (r * 0.6, r * 0.7), (-r * 0.6, r * 0.6)])
        c.drawPath(chip, P((120, 104, 96)))
        c.drawPath(poly([(-r * 0.2, -r), (r, -r * 0.4), (r * 0.2, -r * 0.1)]), P((196, 176, 150)))
        c.restore()


def sparks(c, t, x, y, t0, n=14, scale=1.0):
    u = t - t0
    if u < 0 or u > 0.6: return
    rs = np.random.default_rng(int(t0 * 100))
    for k in range(n):
        a = math.radians(rs.uniform(-170, -10)); v = rs.uniform(150, 420) * scale
        px = x + v * math.cos(a) * u; py = y + v * math.sin(a) * u + 500 * u * u
        al = 255 * (1 - u / 0.6)
        c.drawLine(px, py, px - v * math.cos(a) * 0.03, py - v * math.sin(a) * 0.03, SP((255, 226, 140), 3 * scale, al))
    c.drawCircle(x, y, 28 * scale, P((255, 220, 150), 200 * math.exp(-u / 0.06), MaskFilter=blur(10), BlendMode=skia.BlendMode.kScreen))


# the sit shot: ground line and placement (checked so the group stays 40+ px inside the frame, above the watermark)
SIT_GROUND, SIT_S, SIT_GX, SIT_WX = 1352, 0.5, -10, 440


# ===================================================================== the landing, looking down the cut
VP = (610, 930)                 # vanishing point of the cut floor
NEAR_Y = 1330                   # screen y of the ground at the hole (depth scale 1)
FAR_SIT_S = 0.36                # Gage dazed by the hole, near the camera
LAND_F = 0.34                   # depth scale where the iron comes down, about 80 ft further down the cut


def gp(X, f):
    """a point on the cut floor: lateral offset X (px at the near depth), depth scale f (1 near .. 0 at the VP)"""
    return VP[0] + X * f, VP[1] + (NEAR_Y - VP[1]) * f


def scene_far(c, t, z=1.0):
    c.save(); c.translate(540, 1100); c.scale(z, z); c.translate(-540, -1100)
    sky(c); sun(c, 880, 650)
    c.save(); c.translate(0, 50); far(c, t); c.restore()
    # the floor of the cut: hazy and pale far away, warmer and darker near
    floor = poly([(-200, VP[1]), (1300, VP[1]), (1300, 2200), (-200, 2200)])
    sh = skia.GradientShader.MakeLinear([skia.Point(0, VP[1]), skia.Point(0, 1700)], [C((214, 192, 160)), C((176, 148, 112)), C((140, 114, 90))], [0, 0.4, 1])
    c.drawPath(floor, skia.Paint(AntiAlias=True, Shader=sh))
    rs = np.random.default_rng(71)
    for k in range(240):
        f = rs.uniform(0.08, 1.6) ** 1.4; X = rs.uniform(-1400, 1400)
        x, y = gp(X, f); r = 4 * f + 0.6
        if -20 < x < 1100: c.drawOval(skia.Rect(x - r * 1.5, y - r * 0.7, x + r * 1.5, y + r * 0.5), P((132, 108, 86), 200))
    # the two rock walls converging on the far end, strata running to the vanishing point
    for side in (-1, 1):
        base = (112, 92, 88) if side < 0 else (176, 152, 126)
        lit_ = (140, 118, 104) if side < 0 else (214, 188, 152)
        foot_near, foot_far = gp(side * 520, 1.2), gp(side * 520, 0.06)
        top_near, top_far = (foot_near[0] + side * 160, 360), (foot_far[0] + side * 30, VP[1] - 120)
        wall = poly([foot_far, top_far, top_near, (side * 2000 + 540, 300), (side * 2000 + 540, 2200), foot_near])
        c.drawPath(wall, P(base))
        c.save(); c.clipPath(wall, skia.ClipOp.kIntersect, True)
        for k in range(5):
            u0 = k / 5.0
            a0 = (foot_near[0] + (top_near[0] - foot_near[0]) * u0, foot_near[1] + (top_near[1] - foot_near[1]) * u0)
            b0 = (foot_far[0] + (top_far[0] - foot_far[0]) * u0, foot_far[1] + (top_far[1] - foot_far[1]) * u0)
            u1 = (k + 0.5) / 5.0
            a1 = (foot_near[0] + (top_near[0] - foot_near[0]) * u1, foot_near[1] + (top_near[1] - foot_near[1]) * u1)
            b1 = (foot_far[0] + (top_far[0] - foot_far[0]) * u1, foot_far[1] + (top_far[1] - foot_far[1]) * u1)
            c.drawPath(poly([a0, b0, b1, a1]), P(mix(base, lit_, 0.55 if k % 2 else 0.25)))
        c.restore()
        # rock facets: irregular plates on the face, lit or shaded, shrinking with depth
        c.save(); c.clipPath(wall, skia.ClipOp.kIntersect, True)
        rsf = np.random.default_rng(80 + side)
        def wp(f, v):
            fl = (foot_far[0] + (foot_near[0] - foot_far[0]) * (f - 0.06) / 1.14, foot_far[1] + (foot_near[1] - foot_far[1]) * (f - 0.06) / 1.14)
            tp_ = (top_far[0] + (top_near[0] - top_far[0]) * (f - 0.06) / 1.14, top_far[1] + (top_near[1] - top_far[1]) * (f - 0.06) / 1.14)
            return fl[0] + (tp_[0] - fl[0]) * v, fl[1] + (tp_[1] - fl[1]) * v
        for k in range(26):
            f = rsf.uniform(0.1, 1.15); df = rsf.uniform(0.05, 0.16) * f; v = rsf.uniform(0.05, 0.85); dv = rsf.uniform(0.06, 0.14)
            q = poly([wp(f, v), wp(f + df, v + rsf.uniform(-0.02, 0.02)), wp(f + df * 0.9, v + dv), wp(f + df * 0.1, v + dv * 1.1)])
            col = mix(base, lit_, rsf.uniform(0.2, 1.0)) if rsf.uniform() < 0.6 else tuple(x * 0.84 for x in base)
            c.drawPath(q, P(col))
        c.restore()
        if side > 0:
            rr = rim_of(wall, (6, 0))
            if rr is not None: c.drawPath(rr, P(RIM, 170))
    # a plank stack and a keg at the far end give the scale there
    c.restore()


def far_shot(c, t):
    """the iron comes down about 80 ft away down the cut, tumbling end over end, and lands on its side; Gage sits
    dazed by the smoking hole near the camera; a dashed flight arc in the air joins the hole to where it lies"""
    z = 1.0 + 0.03 * smooth((t - T['landed']) / 3.0)
    scene_far(c, t, z)
    c.save(); c.translate(540, 1100); c.scale(z, z); c.translate(-540, -1100)
    hole = gp(-190, 1.0)
    land = gp(120, LAND_F)
    L_far = ROD_L / 0.86 * 0.5 * LAND_F * 1.4         # the iron at that depth (about 3 of his head lengths there)
    tf = T['feet']
    # lying on the floor it points along the cut, toward the far end (so it is foreshortened like the floor)
    vx, vy = VP[0] - land[0], VP[1] - land[1]; vn = math.hypot(vx, vy)
    lie_ang = math.pi / 2 + 0.12             # lying across the floor, a little skewed
    L_lie = L_far * 0.95
    slide = (16.0, 0.0)
    if t < tf:
        u = smooth((t - T['landed'] + 0.15) / (tf - T['landed'] + 0.15))
        cx_, cy_ = land[0] - 120 * (1 - u), land[1] - 560 * (1 - u) ** 1.6 - L_far * 0.1
        ang = lie_ang + 9.0 * (1 - u)
    else:
        d = t - tf
        b = max(0.0, math.sin(min(1.0, d / 0.32) * math.pi)) * 18 * math.exp(-d * 3)
        cx_, cy_ = land[0] + slide[0] * smooth(d / 0.6), land[1] + slide[1] * smooth(d / 0.6) - b - 2
        ang = lie_ang + 0.4 * math.exp(-d / 0.12) * math.cos(d * 20)
    L_now = L_far if t < tf else lerp(L_far, L_lie, smooth((t - tf) / 0.25))
    dx_, dy_ = math.sin(ang) * L_now / 2, -math.cos(ang) * L_now / 2
    # its shadow on the ground (grows as it comes down)
    sh_k = 1.0 if t >= tf else smooth((t - T['landed']) / (tf - T['landed']))
    c.save(); c.translate(land[0] + (slide[0] if t >= tf else 0), land[1] + 4 + (slide[1] if t >= tf else 0)); c.rotate(math.degrees(lie_ang) - 90)
    c.drawOval(skia.Rect(-L_lie * 0.55 * sh_k, -4, L_lie * 0.55 * sh_k, 4), P((70, 52, 40), 160 * sh_k, MaskFilter=blur(3)))
    c.restore()
    # the iron: dark round bar, a warm rim on top, its last foot tapering to the point
    x0, y0, x1, y1 = cx_ - dx_, cy_ - dy_, cx_ + dx_, cy_ + dy_
    nx, ny = -(y1 - y0) / L_now, (x1 - x0) / L_now; w = 3.6
    tx, ty = x0 + (x1 - x0) * 0.72, y0 + (y1 - y0) * 0.72
    body = poly([(x0 + nx * w, y0 + ny * w), (tx + nx * w, ty + ny * w), (x1, y1), (tx - nx * w, ty - ny * w), (x0 - nx * w, y0 - ny * w)])
    c.drawPath(body, P((52, 52, 64)))
    q = skia.Path(body); q.offset(1.5, 2); c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(body, P((255, 214, 160))); c.restore()
    # a small dust puff where it hits: soft, one tone, drifting off
    if t >= tf:
        d = t - tf
        al = 170 * (1 - smooth((d - 0.2) / 1.2))
        for k in range(4):
            r = (8 + 22 * smooth(d / 0.8)) * (0.8 + 0.15 * k)
            c.drawCircle(land[0] - 30 + k * 26 + 14 * d, land[1] - 6 - 10 * k * smooth(d / 1.0), r, P((214, 192, 158), al, MaskFilter=blur(5)))
    # the hole, still smoking, and Gage on the ground beside it
    lx_, ly_ = hole
    top_ = poly([(lx_ - 120, ly_ - 6), (lx_ - 60, ly_ - 22), (lx_ + 40, ly_ - 26), (lx_ + 120, ly_ - 12), (lx_ + 130, ly_ + 8), (lx_ + 40, ly_ + 18), (lx_ - 110, ly_ + 14)])
    face_ = poly([(lx_ - 110, ly_ + 14), (lx_ + 40, ly_ + 18), (lx_ + 130, ly_ + 8), (lx_ + 134, ly_ + 40), (lx_ + 30, ly_ + 54), (lx_ - 116, ly_ + 46)])
    c.drawOval(skia.Rect(lx_ - 140, ly_ + 34, lx_ + 150, ly_ + 62), P((70, 52, 40), 110, MaskFilter=blur(6)))
    c.drawPath(face_, P((120, 104, 94))); c.drawPath(poly([(lx_ + 40, ly_ + 18), (lx_ + 130, ly_ + 8), (lx_ + 134, ly_ + 40), (lx_ + 30, ly_ + 54)]), P((98, 84, 80)))
    c.drawPath(top_, P((168, 150, 132)))
    c.drawPath(poly([(lx_ + 40, ly_ - 26), (lx_ + 120, ly_ - 12), (lx_ + 130, ly_ + 8), (lx_ + 60, ly_)]), P((196, 178, 154)))
    c.drawOval(skia.Rect(lx_ - 14, ly_ - 5, lx_ + 14, ly_ + 5), P((40, 30, 30)))
    c.drawArc(skia.Rect(lx_ - 14, ly_ - 5, lx_ + 14, ly_ + 5), 20, 140, False, SP((214, 196, 170), 2.2))
    for k in range(5):
        uu = ((t * 0.35 + k * 0.2) % 1.0)
        c.drawCircle(hole[0] + 20 * math.sin(t + k), hole[1] - 40 - 300 * uu, 26 + 60 * uu, P((150, 140, 132), 90 * (1 - uu), MaskFilter=blur(10)))
    tchars.draw_sit(c, t, hole[0] - 1060 * FAR_SIT_S, NEAR_Y - 14 - 735 * FAR_SIT_S, FAR_SIT_S, talk=0.0, daze=1.0)
    # the flight: a dashed arc in the air from the hole to where it lies (in perspective: dashes thin with depth)
    if t >= tf - 0.1:
        k_ = smooth((t - tf + 0.1) / 0.45)
        n = 26
        def ap(u):
            f = 1 / (1 + (1 / LAND_F - 1) * u)
            X = -190 + (310 + slide[0] / LAND_F) * u
            gx, gy = gp(X, f)
            return gx, gy - 560 * f * 4 * u * (1 - u) * (1 - 0.3 * u), f
        for i in range(n):
            u0, u1 = i / n, (i + 0.55) / n
            if u0 > k_: break
            a_ = ap(u0); b_ = ap(min(u1, k_))
            c.drawLine(a_[0], a_[1], b_[0], b_[1], SP((255, 210, 63), max(2.5, 9 * a_[2]), 235))
    c.restore()


# ===================================================================== the head x-ray (his own head, left side)
HC = (728, 960)          # head centre on screen (labels sit in the free band left of the face)
HS = 2.75


def head_xray(c, t, a, hl=0.0, track_u=0.0, tip_s=None):
    """Gage's head as an x-ray in profile facing left (the viewer sees his LEFT side): skull, brain, the iron to
    scale (lib/skull.py)"""
    if a <= 0.01: return
    c.saveLayer(None, skia.Paint(Alphaf=a))
    lgrad(c, skia.Rect(0, 0, W, H), 0, H, [(24, 30, 58), (36, 52, 84), (20, 26, 48)])
    for k in range(8):   # soft background shapes breathing
        x = 140 + k * 130; y = 300 + 160 * math.sin(k * 1.9 + t * 0.25)
        c.drawCircle(x, y + k * 140, 120 + 20 * math.sin(t * 0.6 + k), P((60, 84, 120), 40, MaskFilter=blur(40)))
    SKL.draw_xray(c, HC[0], HC[1], HS, t, hl, track_u, tip_s, top_y=(540 - HC[1]) / HS)
    c.restore()


def xp(p):
    return SKL.to_screen(HC[0], HC[1], HS, p)


# ===================================================================== dusk: he walks away, friends watch
def scene_dusk(c, t, u):
    sky(c, u_dusk=0.85)
    sun(c, 240, 980, 0.8)
    far(c, t, u_dusk=0.85)
    g = (110, 84, 92)
    lgrad(c, skia.Rect(-100, 1100, 1200, 2000), 1100, 1700, [(128, 92, 96), g, (70, 52, 66)])
    # a dirt road into town and a house with a lit window
    rs_ = np.random.default_rng(14)
    for k in range(90):
        x_, y_ = rs_.uniform(-50, 1130), rs_.uniform(1130, 1900); r_ = rs_.uniform(2, 6) * (0.5 + (y_ - 1100) / 600)
        c.drawOval(skia.Rect(x_ - r_ * 1.5, y_ - r_, x_ + r_ * 1.5, y_ + r_ * 0.6), P((88, 64, 76)))
    # Gage stands apart, turning his head away; his two friends watch him, uneasy; long shadows away from the low sun
    turn = smooth((t - T['friends'] - 0.2) / 0.8)
    tn = ((120, 70, 120), 0.22)
    tchars.draw_dusk_gage(c, t, 230, 1346 - 690 * 0.98, 0.98, turn, tint=tn, walk_t0=T['friends'] + 0.4)   # he turns and walks slowly away
    tchars.draw_dusk_friends(c, t, 540, 1346 - 688 * 0.98, 0.98, lean=smooth((t - T['longer']) / 0.8), tint=tn)
    motes(c, t, 26, (0, 900, 1080, 1400), (255, 200, 150))


# ===================================================================== frames
def titles(c, t):
    R, Y, Wt = (255, 107, 107), (255, 210, 63), (255, 255, 255)
    L.title(c, [[('PHINEAS ', Y), ('GAGE', Y)], [('1848', Wt)]], t, -0.5, T['this'] - 0.2)
    L.title(c, [[('THROUGH HIS', Wt)], [('SKULL', R)]], t, T['this'], T['went'] - 0.1)
    L.title(c, [[('IN UNDER THE CHEEK', Wt)], [('OUT THE ', Wt), ('TOP', Y)]], t, T['went'], T['landed'] - 0.15)
    L.title(c, [[('ABOUT ', Wt), ('80 FEET', Y)], [('AWAY', Wt)]], t, T['landed'], T['somehow'] - 0.1)
    L.title(c, [[('AND HE ', Wt), ('LIVED', Y)]], t, T['somehow'], T['but'] - 0.1)
    L.title(c, [[('TORN THROUGH', Wt)], [('HIS ', Wt), ('BRAIN', Y)]], t, T['but'], T['and2'] - 0.1)
    L.title(c, [[('NO LONGER', Wt)], [('GAGE', R)]], t, T['and2'], T['all'] - 0.62)
    L.title(c, [[('ONE ', Wt), ('SPARK', Y)]], t, T['all'] + 0.1, None)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    c.clear(C((20, 20, 30)))
    hx, hy = HOLE
    # ---------------- A: tamping, the spark, the blast, the iron shoots up (0 .. went)
    if t < T['went'] - 0.35 or t >= T['all'] - 0.25:
        tt = t if t < T['went'] else (t - T['all'] + 0.25) % 2.0 + 0.2   # the loop back reuses the opening
        tilt = 0.0 if t >= T['went'] else smooth((t - T['off'] - 0.25) / 0.5)
        zoom = 1.0 + 0.08 * smooth(tt / 5.0) if t < T['off'] else 1.08
        shake = 0.0
        if T['off'] <= t < T['off'] + 0.6:
            shake = 14 * math.exp(-(t - T['off']) / 0.15) * math.sin(t * 90)
        dy = 1900 * tilt
        c.save()
        c.translate(540 + shake, 960); c.scale(zoom, zoom); c.translate(-540, -960 + dy)
        sky(c); clouds(c, tt); sun(c, 960, 500)
        far(c, tt, par=-20 * tilt)
        walls(c, tt); ground(c, tt); ledge(c, tt)
        motes(c, tt, 30)
        knock = smooth((t - T['off'] - 0.4) / 0.4) if (t >= T['off'] and t < T['went']) else 0.0
        if T['off'] <= t < T['went']:
            u = t - T['off']
            view_c = 960 - dy
            dvx, dvy = CHEEK[0] - hx, CHEEK[1] - hy; dn = math.hypot(dvx, dvy); dvx, dvy = dvx / dn, dvy / dn
            # one straight line: tip from the hole to the cheek (0.12 s), through the head slowly so the eye can follow it
            # (0.3 s), then away out the top; only later, high above him, does it start to tumble upright
            tip = dn * smooth(u / 0.12) + 300 * smooth((u - 0.12) / 0.3) + 1900 * max(0.0, u - 0.42) ** 1.2
            tx_, ty_ = hx + dvx * tip, hy + dvy * tip
            cx0, cy0 = tx_ - dvx * ROD_L * 0.5, ty_ - dvy * ROD_L * 0.5
            blend = smooth((u - 0.6) / 0.8)
            y_mid = lerp(cy0, view_c + 40 - 300 * smooth((u - 0.4) / 2.6), blend)
            xm = lerp(cx0, CHEEK[0] + 40, blend)
            ang = lerp(math.atan2(dvx, -dvy), 0.10, smooth((u - 0.6) / 1.0))
            x0, y0 = xm - math.sin(ang) * ROD_L / 2, y_mid + math.cos(ang) * ROD_L / 2
            x1, y1 = xm + math.sin(ang) * ROD_L / 2, y_mid - math.cos(ang) * ROD_L / 2
            if (tip - ROD_L) < dn + 300:
                # it only ever comes up out of the hole: nothing of it below the rock surface
                c.save(); c.clipRect(skia.Rect(-2000, -4000, 3000, HOLE[1] - 2))
                rod(c, x0, y0, x1, y1, wk=ROD_WK)
                c.restore()
        gage_tamping(c, tt if t >= T['all'] - 0.25 else t, knock, hold=(t < T['off'] or t >= T['all'] - 0.25))
        # spark on each strike near the end, and the big one on "spark"
        if t < T['spark']:
            p = (t / 0.7) % 1.0
            if p > 0.9 and t > 0.3:
                sparks(c, t, hx, hy - 4, t - (p - 0.9) * 0.7, 6, 0.7)
        sparks(c, t, hx, hy - 4, T['spark'] + 0.05, 18, 1.2)
        if t >= T['all'] - 0.25:
            sparks(c, t, hx, hy - 4, T['spark2'] + 0.05, 18, 1.2)
        blast(c, t, hx, hy)
        # the iron in flight: up from the hole BEHIND his hands and jaw (we see it below his fists), in under the cheek,
        # out through the top of the head; drawn behind him until its tail has cleared his head, then in front
        if T['off'] <= t < T['went']:
            u = t - T['off']
            view_c = 960 - dy
            dvx, dvy = CHEEK[0] - hx, CHEEK[1] - hy; dn = math.hypot(dvx, dvy); dvx, dvy = dvx / dn, dvy / dn
            # one straight line: tip from the hole to the cheek (0.12 s), through the head slowly so the eye can follow it
            # (0.3 s), then away out the top; only later, high above him, does it start to tumble upright
            tip = dn * smooth(u / 0.12) + 300 * smooth((u - 0.12) / 0.3) + 1900 * max(0.0, u - 0.42) ** 1.2
            tx_, ty_ = hx + dvx * tip, hy + dvy * tip
            cx0, cy0 = tx_ - dvx * ROD_L * 0.5, ty_ - dvy * ROD_L * 0.5
            blend = smooth((u - 0.6) / 0.8)
            y_mid = lerp(cy0, view_c + 40 - 300 * smooth((u - 0.4) / 2.6), blend)
            xm = lerp(cx0, CHEEK[0] + 40, blend)
            ang = lerp(math.atan2(dvx, -dvy), 0.10, smooth((u - 0.6) / 1.0))
            x0, y0 = xm - math.sin(ang) * ROD_L / 2, y_mid + math.cos(ang) * ROD_L / 2
            x1, y1 = xm + math.sin(ang) * ROD_L / 2, y_mid - math.cos(ang) * ROD_L / 2
            behind = (tip - ROD_L) < dn + 300
            if not behind:
                c.save(); c.clipRect(skia.Rect(-2000, -4000, 3000, HOLE[1] - 2))
                rod(c, x0, y0, x1, y1, glint=math.exp(-((t - T['skull'] - 0.1) / 0.25) ** 2), wk=ROD_WK)
                c.restore()
            hf = 0.6 * math.exp(-((u - 0.13) / 0.06) ** 2)
            if hf > 0.02:
                hd = CHEEK
                c.drawCircle(*hd, 60, P((255, 250, 235), 200 * hf, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
        c.restore()
        if dy * zoom * 1.25 < 600: fg_rubble(c, t, 0, y0=1600 + dy * zoom * 1.25)
        sky_k = smooth((tilt - 0.4) / 0.5) if t < T['went'] else 0.0
        if sky_k > 0.01:
            hz = skia.GradientShader.MakeLinear([skia.Point(0, 1000), skia.Point(0, 1920)], [C((178, 204, 232), 0), C((196, 216, 238), 255 * sky_k)])
            c.drawRect(skia.Rect(0, 1000, W, H), skia.Paint(Shader=hz))
    a1 = 1.0 if T['went'] - 0.35 <= t < T['landed'] - 0.15 else 0.0
    a2 = 1.0 if T['but'] - 0.05 <= t < T['and2'] - 0.2 else 0.0
    a = max(a1, a2)
    # ---------------- C: the iron lands about 80 ft away (looking down the cut); he sits up and talks (landed .. but)
    if T['landed'] - 0.5 <= t < T['but'] + 0.2 and a < 0.99:
        close = t >= T['somehow'] - 0.05
        if not close:
            far_shot(c, t)
            fg_rubble(c, t, 0, y0=1610)
        else:
            c.save()
            z = 1.0 + 0.05 * smooth((t - T['somehow']) / 3.5)
            c.translate(540, 1300); c.scale(z, z); c.translate(-540, -1300)
            sky(c); sun(c, 900, 560); far(c, t); walls(c, t); ground(c, t)
            # dust still hanging; he sits up and talks while two workers kneel by him; everyone 40+ px inside the
            # frame and standing on ground above the watermark and caption
            for k in range(6):
                c.drawOval(skia.Rect(100 + k * 170 + 30 * math.sin(t * 0.3 + k) - 200, 1120 + 20 * math.sin(t * 0.5 + k) - 70, 100 + k * 170 + 30 * math.sin(t * 0.3 + k) + 200, 1120 + 20 * math.sin(t * 0.5 + k) + 70), P((226, 206, 176), 40, MaskFilter=blur(40)))
            gy = SIT_GROUND
            tchars.draw_workers(c, t, SIT_WX, gy - 730 * SIT_S * 0.54 / 0.58, SIT_S * 0.54 / 0.58)
            tchars.draw_sit(c, t, SIT_GX, gy - 735 * SIT_S, SIT_S, talk=smooth((t - T['talking']) / 0.3), daze=1 - smooth((t - T['talking']) / 0.6))
            motes(c, t, 30)
            c.restore()
            fg_rubble(c, t, 0, y0=1600)
    # ---------------- D: afterward, dusk (and2 .. all)
    if T['and2'] - 0.3 <= t < T['all'] - 0.25 and a < 0.99:
        u = smooth((t - T['and2'] + 0.3) / (T['all'] - T['and2'] + 0.3))
        c.save()
        z = 1.0 + 0.05 * u
        c.translate(540, 960); c.scale(z, z); c.translate(-540, -960)
        scene_dusk(c, t, u * 4)
        c.restore()
        fg_rubble(c, t, 0, u_dusk=0.85, y0=1610)
        fa = 1 - smooth((t - T['and2'] + 0.3) / 0.3)
        if fa > 0: c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 20), 255 * fa))
    # ---------------- B: the head cutaway (went .. landed) and again (but .. and2)
    a1 = 1.0 if T['went'] - 0.35 <= t < T['landed'] - 0.15 else 0.0
    a2 = 1.0 if T['but'] - 0.05 <= t < T['and2'] - 0.2 else 0.0
    a = max(a1, a2)
    if a > 0.01:
        if a1 >= a2:
            # the iron's point: at the cheek on "under", behind the eye on "cheekbone", out the top on "top"
            n_ = SKL.rod_dir()[2]
            tw = WD.at('under'); tc_ = WD.at('cheekbone'); tt_ = WD.at('top')
            if t < tw: tip = lerp(-70, 0, smooth((t - T['went'] + 0.35) / (tw - T['went'] + 0.35)))
            elif t < tc_: tip = lerp(0, 52, (t - tw) / (tc_ - tw))
            elif t < tt_: tip = lerp(52, n_, smooth((t - tc_) / (tt_ - tc_)))
            else: tip = n_ + 320 * smooth((t - tt_) / 0.9)
            head_xray(c, t, 1.0, 0.0, max(0.0, min(1.0, tip / n_)), tip)
            fl = 1 - smooth((t - T['went'] + 0.35) / 0.12)
            if fl > 0: c.drawRect(skia.Rect(0, 0, W, H), P((255, 250, 240), 170 * fl))
        else:
            hl = smooth((t - T['frontal']) / 0.4)
            head_xray(c, t, a2, hl, 1.0, None)
            # labels outside the head, each with its own leader and dot; the iron's track never crosses a label
            for word, txt, x, y, col, anc in (('frontal', 'LEFT FRONTAL LOBE', 236, 650, (255, 190, 96), (-84, -64)),
                                              ('plans', 'PLANS AHEAD', 200, 760, (46, 230, 214), (-88, -40)),
                                              ('keeps', 'KEEPS YOU IN CHECK', 238, 870, (46, 230, 214), (-84, -14))):
                u = smooth((t - T[word] + 0.05) / 0.12)
                if u > 0:
                    L.chip(c, txt, x, y, col, 30, a2 * u, 0.94 + 0.06 * u, anchor=xp(anc))
    # dips between sections
    in_sky = T['off'] + 0.5 <= t < T['went'] - 0.35
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((10, 6, 20), 130)], [0, 0.62, 1.0])
    if not in_sky: c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    # ---------------- layout
    L.fades(c)
    L.badge(c, 'AP PSYCHOLOGY')
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    tc_ = T['all'] - 0.25
    if not (tc_ - 0.1 <= t < tc_ + 0.3): CAP.draw(c, t)      # no text over the fade into the bright tamp
    # one clean transition from dusk to the bright tamp: everything (captions too) fades to black, then back up
    tc = T['all'] - 0.25
    if tc - 0.35 <= t < tc:
        c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 20), 255 * smooth((t - tc + 0.35) / 0.35)))
    elif tc <= t < tc + 0.3:
        c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 20), 255 * (1 - smooth((t - tc) / 0.3))))
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
