"""w1101-01-bomber-holes (AP Statistics: survivorship bias, a kind of sampling bias). All code (skia), house flat style, knight v3 method.
Art plan:
- Shot A (hook): an English airfield at dawn, side view. A generic four engine bomber (no insignia, lib/bomber.py) touches down
  with a puff of tyre smoke and rolls out, its wings, tail and body peppered with holes; two ground crew (figure.Person, built from
  parts in code) watch and one points. Why it fits: the famous story is about bombers coming back to base.
- Shot B: the camera swings overhead: the parked bomber seen from above on the concrete, cloud shadows drifting over it (scene life).
  Red rings mark the holes as an illustration of the story (not data): wings on "wings", tail on "tail", body on "body"; dashed
  plates show the obvious idea (armor there) on "armor". On "But" the plates fade and the engines and cockpit glow: no holes there.
- Shot C: in the air over the clouds at sunrise: a formation; flak bursts; the near plane takes a hit in an engine on "engines",
  catches fire and falls away trailing smoke into the clouds before "count" (it never comes home, so its holes are never counted).
- Shot D: back on the ground, wide overhead: three survivors parked with holes, two empty spots drawn as dashed outlines.
- Shot E: the payoff: real armor plates drop onto the engines and cockpit with a clank and a glint as the sun clears (key moment).
Motion list for the accuracy check: holes only on wings, tail and body of returners; engines and cockpit clean; the plane that falls
was hit in an engine; armor finally over engines and cockpit. The dot pattern is labelled an illustration.
"""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1101/lib']
import numpy as np, skia
from lpk import *
from figure import Person
import bomber as B
import layout as L

ID = 'w1101-01-bomber-holes'
OUT = f'/home/claude/lp/w1101/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(holes=WD.at('holes'), surv=WD.at('survivorship'), wrong=WD.at('wrong'), famous=WD.at('famous'), wings=WD.at('wings'),
         tail=WD.at('tail'), body=WD.at('body'), obvious=WD.at('obvious'), armor=WD.at('armor', 2), but=WD.at('but'), wald=WD.at('wald'),
         missing=WD.at('missing'), planes=WD.at('planes'), engines=WD.at('engines'), home=WD.at('home'), nobody=WD.at('nobody'),
         count=WD.at('count'), they=WD.at('they'), survived=WD.at('survived'), so=WD.at('so', 3), armor3=WD.at('armor', 3), aren=WD.at("aren't"))
END = WD.end()
DUR = END + 1.6
CAP = Captions(WD.w, brk=('world', 'mostly', 'count'))
R, Y, Wt, Tl = (255, 107, 107), (255, 210, 63), (255, 255, 255), (46, 230, 214)
SHOT_B = T['famous'] - 0.45
SHOT_C = T['planes'] - 0.35
SHOT_D = T['they'] - 0.3
SHOT_E = T['so'] - 0.25
crew = [Person(s=1.75, shirt=(120, 112, 84), vest=(88, 84, 62), pants=(92, 86, 66), hat=(70, 64, 50), hat_style='brim', light=-1),
        Person(s=1.68, shirt=(130, 120, 94), vest=(96, 90, 70), pants=(84, 80, 62), hat=(60, 56, 48), hat_style='beanie', light=-1, hair=(50, 36, 28))]


# ------------------------------------------------------------------ shot A: dawn airfield, side view
def dawn_sky(c, u):
    lgrad(c, skia.Rect(-400, -400, 1500, 1500), 300, 1150, [(58, 70, 120), (150, 120, 140), (240, 170, 120), (255, 210, 150)], [0, 0.45, 0.8, 1])
    c.drawCircle(780, 1010, 260, P((255, 200, 130), 90, MaskFilter=blur(90), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(780, 1010 - 30 * u, 54, P((255, 236, 190)))


def clouds_far(c, t, y0=760, col=(250, 196, 170), a=150, sp=6):
    for k, (x, y, w) in enumerate([(120, 0, 260), (520, -60, 340), (900, 20, 220), (1300, -30, 300)]):
        xx = (x + t * sp) % 1700 - 300
        pth = smooth_closed([(xx - w / 2, y0 + y), (xx - w / 4, y0 + y - 26), (xx, y0 + y - 36), (xx + w / 4, y0 + y - 22), (xx + w / 2, y0 + y),
                             (xx, y0 + y + 8)])
        c.drawPath(pth, P(col, a))


def layer_ridge(c, pts, col, haze, y_fade):
    pth = ridge(pts)
    c.drawPath(pth, P(col))
    # fade toward haze at its foot
    c.save(); c.clipPath(pth, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(-2000, y_fade - 120, 4000, y_fade + 120), y_fade - 120, y_fade + 120, [haze + (0,), haze + (200,)])
    c.restore()


def airfield(c, t, camx):
    c.save(); c.translate(0, 70)
    u = smooth(t / 6.5)
    dawn_sky(c, u)
    clouds_far(c, t)
    # far hills, tree line, hangars and tower with parallax
    c.save(); c.translate(-camx * 0.05, 0)
    layer_ridge(c, jag([(-600, 1050), (0, 1010), (400, 1035), (900, 1000), (1500, 1030), (2400, 1010)], 1, 6), (176, 132, 140), (236, 176, 150), 1090)
    c.restore()
    c.save(); c.translate(-camx * 0.15, 0)
    rs = np.random.default_rng(3)
    tree = skia.Path()
    for k in range(70):
        x = -600 + k * 46 + rs.uniform(-10, 10); r = rs.uniform(22, 40)
        tree.addCircle(x, 1080 - r * 0.4, r)
    tree.addRect(skia.Rect(-700, 1080, 3200, 1130))
    c.drawPath(tree, P((96, 84, 104)))
    c.save(); c.clipPath(tree, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(-700, 1040, 3200, 1130), 1040, 1130, [(220, 160, 140, 0), (230, 170, 150, 170)]); c.restore()
    c.restore()
    c.save(); c.translate(-camx * 0.3, 0)
    for hx in (-300, 260, 700, 1400):
        h = skia.Path(); h.addOval(skia.Rect(hx, 1010, hx + 300, 1210)); h2 = skia.Path(); h2.addRect(skia.Rect(hx - 10, 1110, hx + 310, 1300))
        hp = skia.Op(h, h2, skia.PathOp.kDifference_PathOp)
        flat(c, hp, (84, 78, 92), (66, 60, 76), sh_off=(10, 0), rim=(255, 196, 140), rim_d=(3, 0), rim_a=150)
        c.drawRect(skia.Rect(hx + 110, 1060, hx + 190, 1110), P((52, 48, 60)))
    # control tower
    tx = 1060
    c.drawRect(skia.Rect(tx, 1000, tx + 110, 1110), P((112, 100, 108))); c.drawRect(skia.Rect(tx + 75, 1000, tx + 110, 1110), P((90, 80, 92)))
    c.drawRect(skia.Rect(tx - 8, 994, tx + 118, 1004), P((70, 62, 72)))
    for k in range(3): c.drawRect(skia.Rect(tx + 12 + k * 32, 1020, tx + 32 + k * 32, 1040), P((255, 214, 150), 200))
    c.restore()
    # low mist
    c.drawRect(skia.Rect(-100, 1080, 1200, 1140), P((250, 200, 170), 90, MaskFilter=blur(20)))
    # grass and runway (moves with the ground)
    c.drawRect(skia.Rect(-200, 1110, 1300, 2000), P((96, 112, 70)))
    lgrad(c, skia.Rect(-200, 1110, 1300, 1200), 1110, 1200, [(240, 190, 150, 150), (240, 190, 150, 0)])
    c.drawRect(skia.Rect(-200, 1150, 1300, 1215), P((120, 112, 112)))
    c.drawRect(skia.Rect(-200, 1150, 1300, 1158), P((150, 140, 136)))
    for k in range(-2, 30):
        x = k * 140 - (camx % 140)
        c.drawRect(skia.Rect(x, 1180, x + 70, 1186), P((210, 200, 186)))
    # windsock (scene life)
    wx = 230 - camx * 1.0 + 900
    if -100 < wx < 1200:
        c.drawLine(wx, 1150, wx, 1010, SP((70, 66, 70), 5))
        for k in range(5):
            f = k / 5
            sway = 8 * math.sin(t * 6 + k * 0.9) * f
            c.drawPath(poly([(wx + 4 + k * 22, 1012 + f * 6 + sway), (wx + 4 + (k + 1) * 22, 1014 + (k + 1) / 5 * 6 + sway), (wx + 4 + (k + 1) * 22, 1034 + sway - (k + 1)),
                             (wx + 4 + k * 22, 1036 + sway - k)]), P((236, 120, 70) if k % 2 == 0 else (240, 236, 226)))
    # near grass tufts, wildflowers and a crew toolbox in the foreground
    rs = np.random.default_rng(9)
    for k in range(70):
        x = (k * 47 - camx * 1.3) % 1500 - 200; y = 1300 + rs.uniform(0, 420); h = rs.uniform(24, 60) * (0.7 + (y - 1300) / 500)
        sw = 6 * math.sin(t * 2.0 + k)
        c.drawPath(poly([(x - 8, y), (x + sw, y - h), (x + 8, y)]), P((64, 84, 48)))
        if k % 5 == 0: c.drawCircle(x + sw, y - h, 6, P((255, 226, 140)))
    bx = 1500 - camx * 1.3
    if -300 < bx < 1300:
        tb = skia.Path(); tb.addRRect(skia.RRect.MakeRectXY(skia.Rect(bx, 1500, bx + 220, 1590), 10, 10))
        flat(c, tb, (176, 60, 52), (130, 40, 36), sh_off=(10, 0), rim=(255, 210, 160), rim_d=(-3, -2), rim_a=180)
        c.drawRect(skia.Rect(bx + 70, 1484, bx + 150, 1500), P((60, 60, 66)))
    for k in range(40):
        x = (k * 61 - camx * 1.2) % 1400 - 160; y = 1260 + rs.uniform(0, 60); h = rs.uniform(16, 34)
        sw = 5 * math.sin(t * 2.2 + k)
        c.drawPath(poly([(x - 6, y), (x + sw, y - h), (x + 6, y)]), P((70, 90, 52)))
    c.restore()


def stand_pose(x, gy, s, t, ph, point=0.0, face=1, look=0.0):
    br = 2.0 * math.sin(t * 2.4 + ph) * s
    hip = (x, gy - 118 * s); neck = (x + 4 * s * face, gy - 196 * s + br); head = (x + 8 * s * face, gy - 232 * s + br)
    knN = (x + 6 * s * face, gy - 60 * s); ftN = (x + 10 * s * face, gy - 4 * s); knF = (x - 8 * s * face, gy - 60 * s); ftF = (x - 6 * s * face, gy - 4 * s)
    shN = (neck[0], neck[1] + 12 * s); shF = (neck[0] - 6 * s * face, neck[1] + 12 * s)
    hdF = (x - 4 * s * face, gy - 112 * s); elF = ik2(shF, hdF, 40 * s, 40 * s, bend=-face)
    rest = (x + 12 * s * face, gy - 112 * s)
    aim = (neck[0] + face * 80 * s, neck[1] - 30 * s)
    hdN = (rest[0] + (aim[0] - rest[0]) * point, rest[1] + (aim[1] - rest[1]) * point)
    elN = ik2(shN, hdN, 40 * s, 40 * s, bend=face if point < 0.5 else -face)
    return dict(head=head, neck=neck, hip=hip, shN=shN, elN=elN, hdN=hdN, shF=shF, elF=elF, hdF=hdF, knN=knN, ftN=ftN, knF=knF, ftF=ftF)


def plane_state(t):
    """world x, altitude above the runway (px), pitch (rad), speed px/s"""
    v0 = 520; dec = 70
    x = v0 * t - 0.5 * dec * t * t
    v = v0 - dec * t
    td = 1.15
    alt = 70 * (1 - smooth(t / td)) if t < td else 0.0
    pitch = -0.06 * (1 - smooth((t - td) / 0.5)) if t < td + 0.5 else 0.0
    return x, alt, pitch, v


def shot_a(c, t):
    zz = 1.0 + 0.08 * smooth(t / 6)
    c.save(); c.translate(540, 1200); c.scale(zz, zz); c.translate(-540, -1200)
    px, alt, pitch, v = plane_state(t)
    camx = px - 520
    airfield(c, t, camx)
    s = 1.55
    sx = px - camx + 0
    gy = 1250
    bounce = 6 * math.exp(-(t - 1.15) * 5) * abs(math.sin((t - 1.15) * 14)) if t > 1.15 else 0
    sy = gy - 132 * s - alt - bounce
    # shadow on the runway
    c.drawOval(skia.Rect(sx - 420, gy - 8, sx + 420, gy + 22), P((40, 34, 40), 100 * (1 - alt / 120), MaskFilter=blur(10)))
    B.side(c, sx, sy, s, rot=pitch, t=t, gear=True, holes=True, light=0.8 + 0.2 * smooth(t / 6), prop_k=0.6)
    # tyre smoke at touchdown
    td = 1.15
    if t > td:
        u = t - td
        for k in range(7):
            r = 20 + 60 * u + k * 6
            a = 160 * math.exp(-u * 1.4) * (1 - k / 8)
            c.drawCircle(sx + 70 * s - 140 * u - k * 22, gy - 10 - k * 4 - 20 * u, r, P((236, 226, 216), a, MaskFilter=blur(10)))
    # ground crew in the foreground, they stand on the grass; the near one points at the holes
    for i, (wx, ph) in enumerate(((1900, 0.0), (2010, 1.3))):
        x = wx - camx * 1.15
        if -200 < x < 1300:
            gy2 = 1395 + i * 22
            point = smooth((t - (T['holes'] + 1.6)) / 0.4) if i == 0 else 0.0
            J = stand_pose(x, gy2, crew[i].s, t, ph, point=point, face=-1)
            c.drawOval(skia.Rect(x - 70, gy2 - 8, x + 50, gy2 + 8), P((30, 34, 22), 110, MaskFilter=blur(5)))
            crew[i].draw(c, J, face=-1, vest=True)
    c.restore()


# ------------------------------------------------------------------ shot B and E: overhead on the concrete
def tarmac(c, t, cx=540, cy=930, edge=760):
    c.drawRect(skia.Rect(-4000, -4000, 5000, 6000), P((150, 146, 140)))
    for gx in range(-16, 17):
        x = cx + gx * 240
        c.drawRect(skia.Rect(x - 2, -4000, x + 2, 6000), P((126, 122, 118)))
    for gy in range(-16, 18):
        y = cy + gy * 240
        c.drawRect(skia.Rect(-4000, y - 2, 5000, y + 2), P((126, 122, 118)))
    rs = np.random.default_rng(5)
    for k in range(160):
        x, y = rs.uniform(-2500, 3600), rs.uniform(-2500, 4400); r = rs.uniform(14, 40)
        c.drawOval(skia.Rect(x - r, y - r * 0.6, x + r, y + r * 0.6), P((136, 132, 126), 120))
    # grass beyond the concrete edges
    for side_ in (-1, 1):
        x0 = cx + side_ * edge
        c.drawRect(skia.Rect(min(x0, x0 + side_ * 4000), -4000, max(x0, x0 + side_ * 4000), 6000), P((92, 116, 70)))
        for k in range(100):
            y = -4000 + k * 100
            sw = 6 * math.sin(t * 1.8 + k * 0.7)
            c.drawCircle(x0 + side_ * (40 + (k * 37) % 120) + sw, y, 24, P((80, 104, 60)))
    lgrad(c, skia.Rect(-4000, -4000, 5000, 6000), 300, 1600, [(255, 200, 140, 40), (120, 140, 200, 30)])
    # painted parking line
    c.drawRect(skia.Rect(cx - 4, cy + 350, cx + 4, cy + 900), P((236, 210, 120), 200))


def cloud_shadows(c, t):
    for k in range(3):
        x = (k * 520 + t * 38) % 1700 - 400; y = 500 + k * 420
        pth = smooth_closed([(x - 260, y), (x - 120, y - 90), (x + 60, y - 110), (x + 250, y - 40), (x + 200, y + 70), (x - 60, y + 90)])
        c.drawPath(pth, P((30, 34, 48), 46, MaskFilter=blur(30)))


def plane_shadow_top(c, x, y, s):
    c.save(); c.translate(x + 26, y + 30); c.scale(s, s)
    pth = skia.Path()
    pth.addPath(poly([(-440, -30), (-30, -72), (30, -72), (440, -30), (440, 0), (30, 42), (-30, 42), (-440, 0)]))
    pth.addPath(smooth_closed([(0, -305), (30, -210), (33, -60), (24, 190), (0, 300), (-24, 190), (-33, -60), (-30, -210)]))
    pth.addPath(poly([(-150, 240), (150, 240), (150, 262), (-150, 262)]))
    c.drawPath(pth, P((40, 40, 46), 90, MaskFilter=blur(6)))
    c.restore()


def shot_b(c, t):
    tb = t - SHOT_B
    z = 1.0 + 0.06 * smooth(tb / 13)
    c.save(); c.translate(540, 990); c.scale(z, z); c.translate(-540, -990)
    tarmac(c, t)
    plane_shadow_top(c, 540, 990, 1.14)
    holes = dict(wings=1.0, tail=1.0, body=1.0)
    ring = {k: smooth((t - T[k]) / 0.25) * (1 - 0.6 * smooth((t - T[k] - 1.2) / 0.5)) for k in ('wings', 'tail', 'body')}
    plan = smooth((t - T['armor']) / 0.4) * (1 - smooth((t - T['missing'] + 0.8) / 0.4))
    armor = dict(wings=plan, tail=plan, body=plan)
    cross = smooth((t - T['but'] - 0.1) / 0.3)
    g = smooth((t - T['missing'] + 0.6) / 0.4)
    glow = {ex: g * (0.6 + 0.4 * math.sin(t * 6 + i)) for i, ex in enumerate(B.ENGINES_X)}
    B.top(c, 540, 990, 1.14, t=t, holes=holes, hole_a=0.9, ring=ring, armor=armor, cross=cross, engine_glow=glow, prop_spin=True, prop_k=0.05)
    if g > 0.01:
        c.drawCircle(540, 990 - 228 * 1.14, 54, SP((255, 226, 120), 6, 220 * g * (0.6 + 0.4 * math.sin(t * 6))))
    cloud_shadows(c, t)
    c.restore()
    # labels in the art zone
    if t > T['wings'] - 0.2:
        L.chip(c, 'ILLUSTRATION OF THE STORY', 820, 610, (200, 206, 220), 28, smooth((t - T['wings'] + 0.2) / 0.3) * 0.9 * (1 - smooth((t - T['missing'] + 0.8) / 0.3)))
    if g > 0.01:
        L.chip(c, 'NO HOLES HERE?', 300, 700, Y, 44, g, anchor=(540 - 120 * 1.14 * 1.06, 990 - 110 * 1.14))


def fuel_truck(c, t):
    x = -300 + (t - SHOT_B) * 110; y = 1330
    c.save(); c.translate(x, y); c.scale(1.5, 1.5); c.translate(-x, -y)
    if x > 1400: return
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 70 + 10, y - 34 + 12, x + 90 + 10, y + 34 + 12), 10, 10), P((40, 40, 46), 90, MaskFilter=blur(5)))
    tank = skia.Path(); tank.addRRect(skia.RRect.MakeRectXY(skia.Rect(x - 70, y - 30, x + 40, y + 30), 14, 14))
    flat(c, tank, (196, 172, 92), (160, 136, 70), sh_off=(5, 5), rim=(255, 236, 180), rim_d=(-2, -2), rim_a=200)
    cab = skia.Path(); cab.addRRect(skia.RRect.MakeRectXY(skia.Rect(x + 46, y - 28, x + 92, y + 28), 8, 8))
    flat(c, cab, (98, 112, 72), (70, 80, 50), sh_off=(4, 4), rim=(255, 236, 180), rim_d=(-2, -2), rim_a=200)
    c.drawRect(skia.Rect(x + 70, y - 22, x + 86, y + 22), P((40, 52, 80)))
    c.restore()


# ------------------------------------------------------------------ shot C: over the clouds
def sky_high(c, t):
    lgrad(c, skia.Rect(-400, -400, 1500, 2400), 300, 1400, [(46, 62, 120), (120, 120, 170), (250, 180, 140), (255, 214, 160)], [0, 0.4, 0.8, 1])
    c.drawCircle(860, 1180, 300, P((255, 210, 150), 90, MaskFilter=blur(100), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(860, 1180, 60, P((255, 240, 200)))


def cloud_bank(c, t, y, col, sh, sp, seed, a=255, h=80):
    rs = np.random.default_rng(seed)
    pth = skia.Path()
    off = (t * sp) % 260
    for k in range(-2, 12):
        x = k * 130 - off + rs.uniform(-20, 20); r = rs.uniform(h * 0.8, h * 1.3)
        pth.addCircle(x, y, r)
    pth.addRect(skia.Rect(-400, y, 1500, 2600))
    c.drawPath(pth, P(col, a))
    q = skia.Path(pth); q.offset(0, 18)
    d = skia.Op(pth, q, skia.PathOp.kDifference_PathOp)
    c.drawPath(pth, P(sh, int(a * 0.0)))
    c.save(); c.clipPath(pth, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(-400, y - 120, 1500, y + 300), y - 120, y + 300, [col + (0,), sh + (255,)])
    c.restore()


def flak(c, t, x, y, t0):
    u = t - t0
    if u < 0 or u > 2.5: return
    if u < 0.12:
        c.drawCircle(x, y, 30 * u / 0.12, P((255, 220, 150), 220, MaskFilter=blur(6)))
    for k in range(5):
        a = (k * 1.3)
        r = (16 + 22 * min(1, u * 2)) * (0.8 + 0.2 * k / 5)
        c.drawCircle(x + 18 * math.cos(a) * min(1, u * 3), y + 14 * math.sin(a) * min(1, u * 3), r, P((52, 50, 58), 200 * (1 - u / 2.5)))


def shot_c(c, t):
    tc = t - SHOT_C
    sky_high(c, t)
    cloud_bank(c, t, 1290, (240, 206, 196), (176, 150, 170), 20, 4, h=70)
    # formation, mid distance, flying right
    for i, (ox, oy, s) in enumerate(((140, 700, 0.36), (600, 650, 0.32), (440, 930, 0.95))):
        x = ox + tc * 30; y = oy + 4 * math.sin(t * 1.5 + i)
        if i == 2:
            hit = T['engines'] - 0.05
            if t >= hit:
                u = t - hit
                # it rolls off and falls away, trailing smoke and fire from the hit engine
                x = ox + tc * 30 + 60 * u
                y = oy + 38 * u * u + 20 * u
                rot = 0.35 * u
                for k in range(40):
                    tk = u - k * 0.05
                    if tk < 0: break
                    xk = ox + (hit - SHOT_C + tk) * 30 + 60 * tk
                    yk = oy + 38 * tk * tk + 20 * tk
                    ex_ = 116 * s; ey_ = 18 * s
                    c.drawCircle(xk + ex_ * math.cos(0.35 * tk) - ey_ * math.sin(0.35 * tk) - 10 * k, yk + ex_ * math.sin(0.35 * tk) + ey_ * math.cos(0.35 * tk), 8 + k * 1.2, P((60, 56, 62), max(0, 170 - k * 4), MaskFilter=blur(4)))
                fire = 0.8 + 0.2 * math.sin(t * 30)
                B.side(c, x, y, s, rot=rot, t=t, gear=False, holes=False, smoke_engine=True, fire=fire, dark=0.25)
                continue
        B.side(c, x, y, s, t=t, gear=False, holes=False, dark=0.25 if i < 2 else 0.15)
    for (fx, fy, f0) in ((300, 620, SHOT_C + 0.2), (700, 600, SHOT_C + 0.9), (440 + 76 * 0.95 + (T['engines'] - SHOT_C) * 30, 930 + 41 * 0.95, T['engines'] - 0.12), (420, 880, SHOT_C + 2.0), (640, 960, SHOT_C + 3.0)):
        flak(c, t, fx + (t - f0) * 10, fy, f0)
    hit = T['engines'] - 0.05
    if 0 <= t - hit < 0.3:
        c.drawRect(skia.Rect(0, 0, W, H), P((255, 230, 190), 120 * (1 - (t - hit) / 0.3)))
    # a near cloud layer the falling plane disappears into
    cloud_bank(c, t, 1240 + 30 * math.sin(t * 0.3), (250, 220, 210), (200, 170, 186), 34, 8, h=60)
    cloud_bank(c, t, 1420, (236, 200, 196), (170, 140, 166), 50, 9, h=70)
    cloud_bank(c, t, 1600, (186, 150, 170), (120, 92, 126), 70, 10, h=70)
    cloud_bank(c, t, 1780, (150, 118, 146), (96, 72, 108), 90, 12, h=70)


# ------------------------------------------------------------------ shot D: the survivors and the empty spots
def shot_d(c, t):
    td = t - SHOT_D
    z = 0.34 + 0.03 * smooth(td / 3.2)
    c.save(); c.translate(540, 930); c.scale(z, z); c.translate(-540, -930)
    tarmac(c, t, edge=1600)
    spots = [(-960, -550, False), (0, -550, True), (960, -550, False), (-960, 550, True), (0, 550, False), (960, 550, True)]
    for k, (dx, dy, ghost) in enumerate(spots):
        x = 540 + dx; y = 935 + dy
        if ghost:
            B.top(c, x, y, 1.04, t=t, ghost=True, ghost_hits=smooth((t - T['they'] - 0.6) / 0.4))
        else:
            plane_shadow_top(c, x, y, 1.04)
            B.top(c, x, y, 1.04, t=t, holes=dict(wings=1, tail=1, body=1), hole_a=0.85, prop_spin=False)
    cloud_shadows(c, t)
    c.restore()
    a = smooth((t - T['they'] - 0.3) / 0.3)
    for (dx, dy, ghost) in spots:
        if ghost:
            L.chip(c, 'MISSING', 540 + dx * z, 930 + (dy + 5) * z, R, 30, a)
    L.chip(c, 'SAMPLING BIAS', 540, 1320, Y, 70, smooth((t - T['they'] - 0.25) / 0.3))


def shot_e(c, t):
    z = 1.08 + 0.03 * smooth((t - SHOT_E) / 3)
    c.save(); c.translate(540, 930); c.scale(z, z); c.translate(-540, -930)
    tarmac(c, t)
    land = T['armor3'] - 0.1
    roll = 0.0
    plane_shadow_top(c, 540, 990 - roll, 1.14)
    armor = dict(engines=smooth((t - land) / 0.28), cockpit=smooth((t - land - 0.12) / 0.28))
    B.top(c, 540, 990 - roll, 1.14, t=t, holes=dict(wings=1, tail=1, body=1), hole_a=0.55, armor=armor, prop_spin=True, prop_k=0.05 + 0.95 * smooth((t - END + 0.6) / 0.8))
    # props spin up: blurred discs and dust blown back from each engine
    sp = smooth((t - END + 1.2) / 1.0)
    if sp > 0:
        for ex in B.ENGINES_X:
            le, te = B._wing_le(ex)
            px, py = 540 + ex * 1.14, 990 + (le - 76) * 1.14
            c.drawCircle(px, py, 66, P((220, 224, 230), 90 * sp, MaskFilter=blur(4)))
            for k in range(6):
                u_ = ((t * 1.6 + k / 6) % 1.0)
                c.drawCircle(px + 18 * math.sin(k * 2.1 + t * 3), py + 120 + 260 * u_, 20 + 50 * u_, P((206, 196, 176), 110 * sp * (1 - u_), MaskFilter=blur(12)))
    cloud_shadows(c, t)
    # the sun clears: a warm light sweep and a glint on the plates
    sw = smooth((t - land) / 1.2)
    if sw > 0:
        x = -400 + 1900 * sw
        sh = skia.GradientShader.MakeLinear([skia.Point(x - 300, 0), skia.Point(x + 300, 300)], [C((255, 220, 150), 0), C((255, 220, 150), 90), C((255, 220, 150), 0)], [0, 0.5, 1])
        c.drawRect(skia.Rect(-600, -600, 1700, 2600), skia.Paint(Shader=sh, BlendMode=skia.BlendMode.kScreen))
    for i, ex in enumerate(B.ENGINES_X):
        g = math.exp(-((t - land - 0.35 - i * 0.07) / 0.12) ** 2)
        if g > 0.02:
            gx, gy = 540 + ex * 1.14, 990 - 60 * 1.14
            c.drawLine(gx - 40 * g, gy, gx + 40 * g, gy, SP((255, 250, 230), 4, 255 * g)); c.drawLine(gx, gy - 40 * g, gx, gy + 40 * g, SP((255, 250, 230), 4, 255 * g))
            c.drawCircle(gx, gy, 18, P((255, 250, 220), 200 * g, MaskFilter=blur(8)))
    c.restore()


def titles(c, t):
    L.title(c, [[('SURVIVORSHIP BIAS', Y)], [('SHOT FULL OF HOLES', Wt)]], t, -0.5, SHOT_B)
    L.title(c, [[('HOLES ON THE', Wt)], [('WINGS, TAIL, BODY', Y)]], t, SHOT_B, T['but'])
    L.title(c, [[('WHERE ARE THE', Wt)], [('MISSING HOLES?', Y)]], t, T['but'], SHOT_C)
    L.title(c, [[('ENGINE HITS', Wt)], [('NEVER CAME HOME', R)]], t, SHOT_C, SHOT_D)
    L.title(c, [[('THEY ONLY SAW', Wt)], [('THE SURVIVORS', Y)]], t, SHOT_D, SHOT_E)
    L.title(c, [[('ARMOR WHERE THE', Wt)], [("HOLES AREN'T", Tl)]], t, SHOT_E, None)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    if t < SHOT_B: shot_a(c, t)
    elif t < SHOT_C: shot_b(c, t)
    elif t < SHOT_D: shot_c(c, t)
    elif t < SHOT_E: shot_d(c, t)
    else: shot_e(c, t)
    # whip transitions: a short blurred streak and dip at each cut
    for tc in (SHOT_B, SHOT_C, SHOT_D, SHOT_E):
        d = abs(t - tc)
        if d < 0.14:
            c.drawRect(skia.Rect(0, 0, W, H), P((12, 14, 30), 230 * (1 - d / 0.14)))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((8, 8, 20), 130)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    L.fades(c)
    L.badge(c, 'AP STATISTICS')
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
