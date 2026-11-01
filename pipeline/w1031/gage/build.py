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
    for k, (y, x0, sc, a) in enumerate(((-300, 200, 1.0, 200), (-900, 700, 1.3, 180), (-1500, 300, 1.1, 170), (-2100, 800, 1.4, 160), (300, 120, 0.8, 150))):
        x = x0 + 14 * t
        p = skia.Path()
        for dx, dy, r in ((0, 0, 60), (70, -24, 70), (150, -6, 64), (220, 8, 50), (-60, 10, 46)):
            p.addCircle(x + dx * sc, y + dy * sc, r * sc)
        p.addRect(skia.Rect(x - 100 * sc, y, x + 270 * sc, y + 40 * sc)); p.setFillType(skia.PathFillType.kWinding)
        c.drawPath(p, P((250, 240, 226), a))
        q = skia.Path(p); q.offset(0, 14 * sc); d = skia.Op(p, q, skia.PathOp.kDifference_PathOp)
        c.drawPath(p, P((214, 206, 214), a * 0.35)) if d is None else None
        r = rim_of(p, (-6, 6))
        if r is not None: c.drawPath(r, P((255, 222, 170), a * 0.9))


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
    lit = mix((196, 170, 140), (176, 112, 96), u_dusk)
    # left wall: in shade (sun from the right); right wall: lit face
    pl = poly(WALL_L + [(360, 3200), (-900, 3200), (-900, 520)])
    c.drawPath(pl, P(sh))
    c.save(); c.clipPath(pl, skia.ClipOp.kIntersect, True)
    for i, (y0, x0) in enumerate(((620, 60), (760, 170), (900, 250), (1040, 300))):
        c.drawPath(poly([(x0 - 200, y0), (x0 + 30, y0 - 20), (x0 + 60, y0 + 90), (x0 - 220, y0 + 120)]), P(mix(sh, base, 0.45)))
        c.drawLine(x0 - 220, y0 + 120, x0 + 60, y0 + 90, SP(tuple(v * 0.8 for v in sh), 4))
    c.restore()
    r = rim_of(poly(WALL_L + [(360, 1600)]), (3, 0))
    pr = poly(WALL_R + [(760, 3200), (2000, 3200), (2000, 500)])
    c.drawPath(pr, P(base))
    c.save(); c.clipPath(pr, skia.ClipOp.kIntersect, True)
    for (y0, x0) in ((600, 1060), (720, 950), (860, 880), (1000, 840)):
        c.drawPath(poly([(x0, y0), (x0 + 240, y0 - 30), (x0 + 260, y0 + 70), (x0 + 20, y0 + 100)]), P(lit))
        c.drawPath(poly([(x0 + 20, y0 + 100), (x0 + 260, y0 + 70), (x0 + 250, y0 + 90), (x0 + 24, y0 + 118)]), P(sh))
    # drill marks: vertical half pipes left in the rock by earlier blasts
    for x in (900, 940, 1000):
        c.drawLine(x, 900, x - 6, 1060, SP(sh, 5))
    c.restore()
    rr = rim_of(pr, (-4, 0))
    if rr is not None: c.drawPath(rr, P(RIM, 160))


def ground(c, t, u_dusk=0.0):
    g = mix((172, 146, 112), (110, 84, 92), u_dusk)
    lgrad(c, skia.Rect(-900, 1150, 2000, 3400), 1150, 1700, [mix(g, (210, 190, 160), 0.2), g, tuple(v * 0.8 for v in g)])
    rs = np.random.default_rng(11)
    for k in range(260):
        x = rs.uniform(-500, 1600); y = rs.uniform(1180, 1900)
        r = rs.uniform(2, 6) * (0.5 + (y - 1150) / 700)
        c.drawOval(skia.Rect(x - r * 1.5, y - r, x + r * 1.5, y + r * 0.6), P(tuple(v * rs.uniform(0.7, 0.95) for v in g)))
    # wooden sleepers stacked by the far wall, a hand cart and two far workers
    for k in range(4):
        y = 1160 - k * 14
        c.drawPath(poly([(760, y), (900, y - 6), (904, y + 10), (764, y + 16)]), P(mix((112, 80, 56), (70, 50, 52), u_dusk)))


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
ROD_L = 150 * S            # 3 ft 7 in for a man about 5 ft 6 in tall


def rod(c, x0, y0, x1, y1, a=255, glint=0.0, wk=1.0):
    """the tamping iron: 1.25 in round bar, tapered over its top 11 in; (x0, y0) blunt end, (x1, y1) point"""
    dx, dy = x1 - x0, y1 - y0; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d; w = 5.0 * S * wk
    tx, ty = x0 + dx * 0.74, y0 + dy * 0.74
    body = poly([(x0 + nx * w, y0 + ny * w), (tx + nx * w, ty + ny * w), (x1 + nx * 0.8, y1 + ny * 0.8), (x1 - nx * 0.8, y1 - ny * 0.8),
                 (tx - nx * w, ty - ny * w), (x0 - nx * w, y0 - ny * w)])
    flat(c, body, (86, 88, 100), (58, 58, 72), sh_off=(-3, 0), rim=(255, 220, 170), rim_d=(-2.5, 0), rim_a=220, a=a)
    c.drawLine(x0 + nx * 1.5, y0 + ny * 1.5, x1 + nx * 0.4, y1 + ny * 0.4, SP((176, 180, 196), 1.6, a * 0.8))
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
    tchars.draw_tamp(c, t, TX0, TY0, TS, lift, br, knock, hat_fly=smooth((t - T['off'] - 0.25) / 0.9) if T['off'] < t < T['went'] else 0.0)


def _old_gage_tamping(c, t, knock=0.0):
    fx, fy = FOOT
    br = 1.5 * math.sin(t * 1.7)
    lift = tamp_phase(t) if t < T['spark'] else max(0.0, 1 - (t - T['spark']) / 0.25) * 0.0
    up = 46 * S * lift
    c.save()
    if knock > 0:
        # thrown back by the blast: rotates back about the heels and sits down hard
        c.translate(fx + 30 * S, fy); c.rotate(-28 * smooth(knock)); c.translate(40 * S * smooth(knock), 0); c.translate(-(fx + 30 * S), -fy)
    s = S
    hip = (fx - 2 * s, fy - 100 * s)
    neck = (fx - 44 * s, fy - 168 * s + br * 0.4 - 4 * s * lift)
    head = (fx - 62 * s, fy - 186 * s + br * 0.4 - 4 * s * lift)
    hx = HOLE[0]
    hdN = (hx + 4 * s, fy - 128 * s - up)
    hdF = (hx + 2 * s, fy - 104 * s - up)
    shN = (neck[0] - 2 * s, neck[1] + 10 * s); shF = (neck[0] + 6 * s, neck[1] + 8 * s)
    from lpk import ik2
    elN = ik2(shN, hdN, 32 * s, 30 * s, bend=1)
    elF = ik2(shF, hdF, 32 * s, 30 * s, bend=1)
    J = dict(head=head, neck=neck, hip=hip, shN=shN, elN=elN, hdN=hdN, shF=shF, elF=elF, hdF=hdF,
             knN=(fx - 18 * s, fy - 52 * s), ftN=(fx - 20 * s, fy - 4 * s), knF=(fx + 8 * s, fy - 50 * s), ftF=(fx + 16 * s, fy - 4 * s))
    if t < T['off']:
        rod(c, hx, fy - up + 10, hx, fy - up - ROD_L + 10)
    GAGE.draw(c, J, face=-1)
    c.restore()


def gage_ground(c, t, x, y, sit=0.0, s=S, talk=0.0):
    """lying on his back after the blast (sit 0) .. sitting up on one arm (sit 1)"""
    g = Person(s=s, shirt=(226, 210, 184), vest=(86, 64, 56), pants=(78, 72, 92), skin=(216, 164, 124), hat=(68, 54, 48),
               boots=(52, 40, 36), hair=(84, 58, 40), light=1, rim=RIM, hatted=False)
    u = smooth(sit)
    hip = (x, y - 18 * s)
    ang = math.radians(lerp(178, 118, u))        # torso direction from the hip (180 = flat to the left)
    L_ = 76 * s
    neck = (hip[0] + L_ * math.cos(ang), hip[1] - L_ * math.sin(ang) * (1 if u > 0 else 0.15))
    head = (neck[0] - 12 * s * math.cos(ang - 0.4), neck[1] - 22 * s - 4 * s * u)
    nod = 0.08 * math.sin(t * 6) * talk
    shN = (neck[0] + 6 * s, neck[1] + 8 * s); shF = shN
    hdF = (neck[0] + 4 * s, y - 6 * s) if u > 0.3 else (neck[0] - 30 * s, y - 6 * s)
    from lpk import ik2
    elF = ik2(shF, hdF, 32 * s, 30 * s, bend=-1)
    hdN = (neck[0] + (40 + 10 * math.sin(t * 3) * talk) * s, neck[1] + (20 - 10 * talk) * s)
    elN = ik2(shN, hdN, 32 * s, 30 * s, bend=1)
    J = dict(head=head, neck=neck, hip=hip, shN=shN, elN=elN, hdN=hdN, shF=shF, elF=elF, hdF=hdF,
             knN=(x + 48 * s, y - 40 * s), ftN=(x + 96 * s, y - 6 * s), knF=(x + 52 * s, y - 20 * s), ftF=(x + 102 * s, y - 4 * s))
    c.drawOval(skia.Rect(x - 120 * s, y - 10 * s, x + 120 * s, y + 8 * s), P((60, 40, 40), 70, MaskFilter=blur(8)))
    g.draw(c, J, face=-1, tilt=nod)
    return head


def worker_run(c, t, x, y, s, col_shirt, face=-1, run=1.0, stop_t=None, hatted=True, beard=False):
    w = Person(s=s, shirt=col_shirt, vest=(70, 60, 58), pants=(70, 66, 84), hat=(60, 50, 46), light=1, rim=RIM, hatted=hatted, beard=beard)
    ph = t * 9 * run
    a = math.sin(ph) * run
    hip = (x, y - 100 * s)
    neck = (x - 10 * s * face * -1 * run, y - 176 * s)
    head = (neck[0] - 6 * s, neck[1] - 26 * s)
    from lpk import ik2
    ftN = (x + 34 * s * a * face * -1, y - 4 * s - max(0, 14 * s * math.sin(ph + 1.5)) * run)
    ftF = (x - 34 * s * a * face * -1, y - 4 * s - max(0, 14 * s * math.sin(ph + 1.5 + math.pi)) * run)
    knN = ik2(hip, ftN, 52 * s, 50 * s, bend=1 if face < 0 else -1)
    knF = ik2(hip, ftF, 52 * s, 50 * s, bend=1 if face < 0 else -1)
    sh = (neck[0], neck[1] + 10 * s)
    hdN = (sh[0] - 30 * s * a * face * -1, sh[1] + 52 * s); hdF = (sh[0] + 30 * s * a * face * -1, sh[1] + 52 * s)
    elN = ik2(sh, hdN, 32 * s, 30 * s, bend=-1 if face < 0 else 1); elF = ik2(sh, hdF, 32 * s, 30 * s, bend=-1 if face < 0 else 1)
    J = dict(head=head, neck=neck, hip=hip, shN=sh, elN=elN, hdN=hdN, shF=sh, elF=elF, hdF=hdF, knN=knN, ftN=ftN, knF=knF, ftF=ftF)
    c.drawOval(skia.Rect(x - 50 * s, y - 6 * s, x + 50 * s, y + 6 * s), P((60, 40, 40), 70, MaskFilter=blur(6)))
    w.draw(c, J, face=face)


def blast(c, t, x, y):
    """powder blast at the hole: white core flash, orange fireball lobes, dust and rock chips flung out"""
    u = t - T['off']
    if u < 0 or u > 3.0: return
    f = math.exp(-u / 0.12)
    c.drawCircle(x, y - 40, 260 * (0.6 + u), P((255, 236, 200), 230 * f, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))
    grow = 1 - math.exp(-u / 0.3)
    # dust: soft brown grey volumes rolling out and up, two tones, fading as they spread
    for k in range(7):
        a = math.radians(-90 + (k - 3) * 26)
        r = 80 + 420 * grow * (0.8 + 0.2 * math.sin(k * 2.3))
        cx, cy = x + r * math.cos(a) * 1.2, y - 40 + r * math.sin(a) * 0.7
        rr = (80 + 170 * grow) * (0.9 + 0.1 * math.sin(t * 3 + k))
        al = 230 * (1 - smooth((u - 0.6) / 2.2))
        c.drawCircle(cx, cy, rr, P((176, 156, 136), al))
        c.drawCircle(cx - rr * 0.25, cy + rr * 0.2, rr * 0.8, P((140, 122, 112), al * 0.8))
        c.drawCircle(cx + rr * 0.3, cy - rr * 0.35, rr * 0.45, P((226, 206, 176), al * 0.9))
    # fireball core: flickering lobes, orange to yellow, gone in half a second
    fa = 1 - smooth(u / 0.5)
    if fa > 0:
        pts = [(x + (130 + 170 * grow) * math.cos(i * math.pi / 8) * (0.8 + 0.25 * math.sin(i * 2.7 + t * 30)),
                y - 90 + (110 + 210 * grow) * math.sin(i * math.pi / 8) * 0.8 * (0.8 + 0.25 * math.cos(i * 1.9 + t * 25))) for i in range(16)]
        fb = smooth_closed(pts)
        c.drawPath(fb, P((255, 150, 60), 255 * fa))
        c.save(); c.scale(1, 1)
        inner = smooth_closed([(x + (px - x) * 0.6, y - 90 + (py - y + 90) * 0.6) for px, py in pts])
        c.drawPath(inner, P((255, 224, 130), 255 * fa))
        c.restore()
    rs = np.random.default_rng(21)
    for k in range(26):
        a = math.radians(rs.uniform(-170, -10)); v = rs.uniform(500, 1200)
        px = x + v * math.cos(a) * u; py = y + v * math.sin(a) * u + 900 * u * u
        if py > y + 30: continue
        r = rs.uniform(4, 10)
        c.drawPath(poly([(px - r, py), (px, py - r * 0.8), (px + r, py + r * 0.2), (px, py + r)]), P((96, 80, 76), 255 * (1 - smooth(u / 1.4))))


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


def scene_cut(c, t, cam):
    """the rock cut: cam = (dx, dy, zoom) about the screen centre"""
    dx, dy, z = cam
    c.save()
    c.translate(540, 960); c.scale(z, z); c.translate(-540 + dx, -960 + dy)
    sky(c)
    sun(c, 900, 600)
    far(c, t, par=dx)
    walls(c, t)
    ground(c, t)
    None
    return


# ===================================================================== the head cutaway (his own head, left side)
HC = (560, 860)          # head centre on screen
HS = 3.2


def head_xray(c, t, a, hl=0.0, path_u=0.0, rod_u=-1.0, labels=0.0):
    """Gage's head in profile facing left (so the viewer sees his LEFT side), skin glass, skull and brain inside.
    path_u: how much of the iron's path is drawn (entry under the cheekbone to the exit at the top front)."""
    if a <= 0.01: return
    c.saveLayer(None, skia.Paint(Alphaf=a))
    lgrad(c, skia.Rect(0, 0, W, H), 0, H, [(24, 30, 58), (36, 52, 84), (20, 26, 48)])
    for k in range(8):   # soft background shapes breathing
        x = 140 + k * 130; y = 300 + 160 * math.sin(k * 1.9 + t * 0.25)
        c.drawCircle(x, y + k * 140, 120 + 20 * math.sin(t * 0.6 + k), P((60, 84, 120), 40, MaskFilter=blur(40)))
    c.save(); c.translate(*HC); c.scale(HS, HS)
    br = 0.6 * math.sin(t * 1.6)
    c.translate(0, br)
    # skin silhouette (neck, head facing left, ear, nose)
    skin = smooth_closed([(60, -120), (10, -138), (-50, -128), (-92, -96), (-112, -50), (-118, -10), (-130, 18), (-122, 30), (-112, 40),
                          (-116, 58), (-106, 70), (-100, 92), (-80, 108), (-52, 112), (-36, 130), (-30, 190), (60, 200), (64, 120),
                          (96, 60), (104, 0), (96, -60), (82, -100)])
    c.drawPath(skin, P((226, 168, 132), 70))
    c.drawPath(skin, SP((255, 200, 160), 3, 150))
    # skull: cranium, orbit, cheekbone (zygomatic arch), upper jaw and mandible
    cran = smooth_closed([(58, -110), (10, -128), (-46, -118), (-84, -88), (-100, -46), (-102, -16), (-90, 4), (-70, 6), (-40, 0),
                          (0, 6), (46, 20), (76, 30), (92, -10), (86, -60)])
    c.drawPath(cran, P((236, 226, 204), 80))
    c.drawPath(cran, SP((246, 238, 220), 4, 200))
    c.drawOval(skia.Rect(-100, -34, -60, 6), SP((255, 246, 228), 5, 240)); c.drawOval(skia.Rect(-96, -30, -64, 2), P((20, 26, 50), 120))              # orbit
    c.drawPath(smooth_closed([(-70, 12), (-30, 8), (10, 16), (12, 24), (-30, 20), (-72, 26)]), P((246, 238, 220), 180))   # zygomatic arch
    jaw = smooth_closed([(-88, 34), (-60, 30), (-10, 34), (20, 30), (24, 66), (8, 96), (-40, 104), (-72, 100), (-88, 80)])
    c.drawPath(jaw, SP((246, 238, 220), 3.5, 170))
    for k in range(6):
        c.drawLine(-86 + k * 8, 58, -86 + k * 8, 66, SP((246, 238, 220), 2, 150))
    # brain: lobes inside the cranium; the frontal lobe is its own piece so it can light up
    c.save(); c.clipPath(cran, skia.ClipOp.kIntersect, True)
    brain = smooth_closed([(52, -100), (8, -116), (-40, -106), (-74, -80), (-88, -44), (-82, -18), (-50, -12), (-10, -4), (30, 6), (64, 12), (80, -20), (76, -64)])
    c.drawPath(brain, P((214, 140, 160)))
    front = smooth_closed([(-6, -114), (-40, -106), (-74, -80), (-88, -44), (-82, -18), (-50, -12), (-20, -10), (-14, -40), (-10, -80)])
    fcol = mix((214, 140, 160), (255, 190, 96), hl)
    c.drawPath(front, P(fcol))
    if hl > 0.02:
        c.drawPath(front, P((255, 210, 120), 120 * hl * (0.8 + 0.2 * math.sin(t * 5)), MaskFilter=blur(14), BlendMode=skia.BlendMode.kScreen))
    for pts in ([(-70, -60), (-50, -70), (-30, -60), (-20, -76)], [(-80, -36), (-56, -44), (-36, -30), (-18, -44)], [(0, -90), (20, -80), (40, -94), (60, -70)],
                [(10, -40), (30, -50), (50, -30), (66, -40)], [(-40, -96), (-24, -88), (-8, -100)]):
        p = skia.Path(); p.moveTo(*pts[0])
        for q in pts[1:]: p.lineTo(*q)
        c.drawPath(p, SP((176, 102, 126), 2.2))
    c.drawPath(smooth_closed([(-12, -6), (20, 0), (40, 2), (30, -16), (0, -22)]), P((190, 118, 140)))  # temporal lobe hint
    c.restore()
    # the iron's path: in under the left cheekbone, behind the left eye, out the top front near the midline
    E0, E1 = (-66, 28), (-34, -132)
    if path_u > 0:
        x = lerp(E0[0], E1[0], path_u); y = lerp(E0[1], E1[1], path_u)
        c.drawLine(*E0, x, y, SP((255, 120, 90), 7, 220))
        c.drawLine(*E0, x, y, SP((255, 210, 170), 2, 255))
        c.drawCircle(*E0, 6, P((255, 120, 90)))
    if rod_u >= 0:
        # a ghost of the iron sliding along the path, point first
        d = (E1[0] - E0[0], E1[1] - E0[1]); n = math.hypot(*d); ux, uy = d[0] / n, d[1] / n
        tip = (E0[0] + ux * n * rod_u * 1.6 - ux * 30, E0[1] + uy * n * rod_u * 1.6 - uy * 30)
        tail = (tip[0] - ux * 130, tip[1] - uy * 130)
        c.save(); c.clipRect(skia.Rect(-200, -134, 200, 300))
        rod(c, tail[0], tail[1], tip[0], tip[1], a=200 * smooth(rod_u / 0.12), wk=0.13)
        c.restore()
    c.restore()
    c.restore()


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
    c.drawPath(poly([(700, 980), (860, 980), (860, 1110), (700, 1110)]), P((80, 60, 76)))
    c.drawPath(poly([(690, 990), (780, 930), (870, 990)]), P((60, 44, 60)))
    c.drawRect(skia.Rect(740, 1020, 770, 1050), P((255, 196, 110), 220 + 30 * math.sin(t * 3)))
    c.drawRect(skia.Rect(720, 1000, 790, 1070), P((255, 196, 110), 60, MaskFilter=blur(20)))
    # Gage stands apart, turning his head away; his two friends watch him, uneasy; long shadows away from the low sun
    for x_, w_ in ((560, 420),):        # Gage's own contact shadow moves with him (cperson)
        c.drawOval(skia.Rect(x_ + 10, 1405, x_ + w_ + 60, 1440), P((40, 28, 44), 120, MaskFilter=blur(10)))
    turn = smooth((t - T['friends'] - 0.2) / 0.8)
    tn = ((120, 70, 120), 0.22)
    tchars.draw_dusk_gage(c, t, 60, 1425 - 690 * 1.05, 1.05, turn, tint=tn, walk_t0=T['friends'] + 0.4)   # he turns and walks slowly away
    tchars.draw_dusk_friends(c, t, 600, 1425 - 688 * 1.05, 1.05, lean=smooth((t - T['longer']) / 0.8), tint=tn)
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
    L.title(c, [[('NO LONGER', Wt)], [('GAGE', R)]], t, T['and2'], T['all'] - 0.1)
    L.title(c, [[('ONE ', Wt), ('SPARK', Y)]], t, T['all'], None)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    c.clear(C((20, 20, 30)))
    hx, hy = HOLE
    # ---------------- A: tamping, the spark, the blast, the iron shoots up (0 .. went)
    if t < T['went'] - 0.35 or t >= T['all'] - 0.25:
        tt = t if t < T['went'] else (t - T['all'] + 0.25) % 2.0 + 0.2   # the loop back reuses the opening
        tilt = 0.0 if t >= T['went'] else smooth((t - T['off'] - 0.3) / 1.6)
        zoom = 1.0 + 0.08 * smooth(tt / 5.0) if t < T['off'] else 1.08
        shake = 0.0
        if T['off'] <= t < T['off'] + 0.6:
            shake = 14 * math.exp(-(t - T['off']) / 0.15) * math.sin(t * 90)
        dy = 1500 * tilt
        c.save()
        c.translate(540 + shake, 960); c.scale(zoom, zoom); c.translate(-540, -960 + dy)
        sky(c); clouds(c, tt); sun(c, 960, 500)
        far(c, tt, par=-20 * tilt)
        walls(c, tt); ground(c, tt); None
        motes(c, tt, 30)
        knock = smooth((t - T['off'] - 0.4) / 0.4) if (t >= T['off'] and t < T['went']) else 0.0
        c.drawOval(skia.Rect(HOLE[0] - 50, HOLE[1] - 9, HOLE[0] + 50, HOLE[1] + 9), P((52, 36, 32)))
        c.drawOval(skia.Rect(HOLE[0] - 50, HOLE[1] - 9, HOLE[0] + 50, HOLE[1] + 9), SP((120, 96, 80), 3))
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
            y_mid = lerp(cy0, view_c + 380 - 420 * smooth((u - 0.4) / 2.6), blend)
            xm = lerp(cx0, CHEEK[0] + 40, blend)
            ang = lerp(math.atan2(dvx, -dvy), 0.10, smooth((u - 0.6) / 1.0))
            x0, y0 = xm - math.sin(ang) * ROD_L / 2, y_mid + math.cos(ang) * ROD_L / 2
            x1, y1 = xm + math.sin(ang) * ROD_L / 2, y_mid - math.cos(ang) * ROD_L / 2
            if (tip - ROD_L) < dn + 300:
                rod(c, x0, y0, x1, y1)
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
            y_mid = lerp(cy0, view_c + 380 - 420 * smooth((u - 0.4) / 2.6), blend)
            xm = lerp(cx0, CHEEK[0] + 40, blend)
            ang = lerp(math.atan2(dvx, -dvy), 0.10, smooth((u - 0.6) / 1.0))
            x0, y0 = xm - math.sin(ang) * ROD_L / 2, y_mid + math.cos(ang) * ROD_L / 2
            x1, y1 = xm + math.sin(ang) * ROD_L / 2, y_mid - math.cos(ang) * ROD_L / 2
            behind = (tip - ROD_L) < dn + 300
            if not behind:
                if u > 0.9:
                    for k in range(5):
                        o = 40 + k * 60
                        c.drawLine(x0 - math.sin(ang) * o, y0 + math.cos(ang) * o, x0 - math.sin(ang) * (o + 90), y0 + math.cos(ang) * (o + 90), SP((255, 240, 220), 3, 70 - k * 12))
                rod(c, x0, y0, x1, y1, glint=math.exp(-((t - T['skull'] - 0.1) / 0.25) ** 2))
            hf = 0.6 * math.exp(-((u - 0.13) / 0.06) ** 2)
            if hf > 0.02:
                hd = CHEEK
                c.drawCircle(*hd, 60, P((255, 250, 235), 200 * hf, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
        c.restore()
    a1 = 1.0 if T['went'] - 0.35 <= t < T['landed'] - 0.15 else 0.0
    a2 = 1.0 if T['but'] - 0.05 <= t < T['and2'] - 0.2 else 0.0
    a = max(a1, a2)
    # ---------------- C: the iron lands about 80 ft away; he sits up and talks (landed .. but)
    if T['landed'] - 0.5 <= t < T['but'] + 0.2 and a < 0.99:
        u = t - T['landed']
        c.save()
        close = t >= T['somehow'] - 0.05
        if not close:
            z = 0.74 + 0.04 * smooth((t - T['landed']) / 5.0)
            c.translate(540, 1100); c.scale(z, z); c.translate(-760, -1240)
        else:
            z = 1.0 + 0.05 * smooth((t - T['somehow']) / 3.5)
            c.translate(540, 1300); c.scale(z, z); c.translate(-540, -1300)
        sky(c); sun(c, 900, 560); far(c, t); walls(c, t); ground(c, t); None
        if not close:
            # the blast hole, still smoking, where he stood
            c.drawOval(skia.Rect(HOLE[0] - 50, HOLE[1] - 9, HOLE[0] + 50, HOLE[1] + 9), P((52, 36, 32)))
            for k in range(5):
                uu = ((t * 0.35 + k * 0.2) % 1.0)
                c.drawCircle(HOLE[0] + 20 * math.sin(t + k), HOLE[1] - 40 - 260 * uu, 30 + 50 * uu, P((150, 140, 132), 120 * (1 - uu)))
        # the landing spot far to the right; iron falls point first and sticks in the gravel
        lx, ly = 1180, 1330
        fall = smooth((t - T['landed'] + 0.4) / (T['feet'] - T['landed'] + 0.4))
        if t < T['feet']:
            yy = ly - 700 * (1 - fall)
            rod(c, lx + 8, yy - ROD_L * 0.9, lx, yy)
        else:
            rod(c, lx + 30, ly - ROD_L * 0.66, lx, ly + 10)
            d = t - T['feet']
            if d < 1.6:
                for k in range(7):
                    c.drawCircle(lx + (k - 3) * 22 * (1 + d), ly - 10 - 40 * d * (1 - d / 2.0), 22 + 30 * d, P((196, 172, 140), 160 * (1 - d / 1.6)))
        # distance chip: dashed line from Gage to the iron
        if T['feet'] - 0.2 <= t < T['somehow'] and not close:
            k = smooth((t - T['feet'] + 0.2) / 0.3)
            for i in range(24):
                x0 = HOLE[0] + i * 46
                if x0 > HOLE[0] + (lx - HOLE[0]) * k: break
                c.drawLine(x0, 1380, x0 + 24, 1380, SP((255, 210, 63), 7))
            L.chip(c, 'ABOUT 80 FT', (HOLE[0] + lx) / 2, 1320, (255, 210, 63), 64, k)
        if close:
            # dust still hanging; he sits up and talks while two workers kneel by him
            for k in range(6):
                c.drawOval(skia.Rect(100 + k * 170 + 30 * math.sin(t * 0.3 + k) - 200, 1120 + 20 * math.sin(t * 0.5 + k) - 70, 100 + k * 170 + 30 * math.sin(t * 0.3 + k) + 200, 1120 + 20 * math.sin(t * 0.5 + k) + 70), P((226, 206, 176), 40, MaskFilter=blur(40)))
            c.drawOval(skia.Rect(0, 1380, 600, 1420), P((90, 64, 52), 90, MaskFilter=blur(10)))
            c.drawOval(skia.Rect(520, 1385, 1080, 1420), P((90, 64, 52), 90, MaskFilter=blur(10)))
            tchars.draw_workers(c, t, 425, 1420 - 730 * 0.54, 0.54)
            tchars.draw_sit(c, t, -80, 1420 - 735 * 0.58, 0.58, talk=smooth((t - T['talking']) / 0.3), daze=1 - smooth((t - T['talking']) / 0.6))
        motes(c, t, 30)
        c.restore()
    # ---------------- D: afterward, dusk (and2 .. all)
    if T['and2'] - 0.3 <= t < T['all'] and a < 0.99:
        u = smooth((t - T['and2'] + 0.3) / (T['all'] - T['and2'] + 0.3))
        c.save()
        z = 1.0 + 0.05 * u
        c.translate(540, 960); c.scale(z, z); c.translate(-540, -960)
        scene_dusk(c, t, u * 4)
        c.restore()
        fa = 1 - smooth((t - T['and2'] + 0.3) / 0.3)
        if fa > 0: c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 20), 255 * fa))
    # ---------------- B: the head cutaway (went .. landed) and again (but .. and2)
    a1 = 1.0 if T['went'] - 0.35 <= t < T['landed'] - 0.15 else 0.0
    a2 = 1.0 if T['but'] - 0.05 <= t < T['and2'] - 0.2 else 0.0
    a = max(a1, a2)
    if a > 0.01:
        if a1 >= a2:
            pu = smooth((t - T['went']) / (T['came'] + 0.9 - T['went']))
            ru = (t - T['went'] - 0.1) / (T['came'] + 1.0 - T['went'])
            # a round lens grows from his head (iris) as the cut comes in
            head_xray(c, t, 1.0, 0.0, pu, ru if 0 <= ru <= 1 else -1)
            fl = 1 - smooth((t - T['went'] + 0.35) / 0.12)
            if fl > 0: c.drawRect(skia.Rect(0, 0, W, H), P((255, 250, 240), 170 * fl))
        else:
            hl = smooth((t - T['frontal']) / 0.4)
            head_xray(c, t, a2, hl, 1.0, -1)
            for word, txt, x, y, col in (('frontal', 'LEFT FRONTAL LOBE', 300, 540, (255, 190, 96)), ('plans', 'PLANS AHEAD', 820, 600, (46, 230, 214)), ('keeps', 'KEEPS YOU IN CHECK', 760, 690, (46, 230, 214))):
                u = smooth((t - T[word]) / 0.25)
                if u > 0:
                    anc = (HC[0] - 62 * HS, HC[1] - 76 * HS) if word == 'frontal' else (HC[0] - 30 * HS, HC[1] - 60 * HS)
                    L.chip(c, txt, x, y, col, 42, a2 * u, 0.9 + 0.1 * u, anchor=anc)
    # dips between sections
    for tc in (T['all'] - 0.25,):
        d = abs(t - tc)
        if d < 0.25: c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 20), 255 * (1 - d / 0.25)))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((10, 6, 20), 130)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    # ---------------- layout
    L.fades(c)
    L.badge(c, 'AP PSYCHOLOGY')
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
