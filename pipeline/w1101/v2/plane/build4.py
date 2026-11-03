"""w1101-01 survivorship bias, SCRIPT REBUILD (Olivier 2026-11-01: the story was hard to follow; the facts it rests on
now come first: many bombers never came back, bullets hit everywhere, armor is heavy). Every shot shows exactly the line
being said.

A  0.0  sky     A formation in flak; one bomber already smoking before 2 s, two drop out on "never came back".
B  4.6  field   Dawn: a battered bomber lands, light through its holes; the airman shades his eyes. "The ones that did return"
C  7.8  hangar  Top down: red marks land on the wings, tail and body as each is named.   label: illustration of the story
D 10.9  hoist   Close on a wing: ONE armor plate swings down on chains, heavy. "Armor is heavy... only a little"
E 14.0  hangar  Wide again: plates drop onto the wings, tail and body on "put it where the holes are" (the obvious plan).
F 16.9  Wald    At his desk at night, lamp light.
G 20.7  paper   His drawing: pencil dots sweep evenly over the WHOLE plane on "everywhere" (what you'd expect), then his
                pencil circles the engines, which have no red holes: "why were the engines almost clean?"
H 26.4  sky     A bomber is hit in the ENGINE on the word and falls out of the formation: "never came back".
I 31.2  hangar  The hole map again; green rings mark where a plane CAN take a hit and still make it home. On "So" the plates
                lift off and drop onto the engines on "armor"; rings flash on "AREN'T".
J 38.5  field   The row of parked survivors with one empty, chalked spot: "only looking at the survivors"; the name lands.
"""
import sys, math, json
sys.path.insert(0, '/home/claude/plane'); sys.path.insert(0, '/home/claude/short')
import numpy as np, skia
import layout as L
from art import *
try:
    from art_b17 import *
except Exception as _e:
    print('art_b17 not loaded:', _e)
from onebody import Build, Pose, Person
import person as _PP, airman2 as _A
import lpk

VO = json.load(open('/home/claude/plane/vo3/words.json'))
WD = lpk.Words('/home/claude/plane/vo3/words.json')

_W = [x['w'].lower().strip('.,!?:') for x in VO]


def at(w, n=1):
    w = w.lower().strip('.,!?:'); k = 0
    for i, x in enumerate(_W):
        if x == w or x.rstrip('.') == w:
            k += 1
            if k == n: return VO[i]['t0']
    raise KeyError(w)


def atc(w, n=1):
    """case sensitive (the sentence starts: 'The', 'Only')"""
    k = 0
    for i, x in enumerate(VO):
        if x['w'].strip('.,!?:') == w:
            k += 1
            if k == n: return x['t0']
    raise KeyError(w)


T_B = atc('The') - 0.1
T_C = at('mostly') - 0.12
T_D = atc('Every') - 0.1
T_E = atc('The', 2) - 0.1
T_F = at('But') - 0.1
T_G = at('Bullets') - 0.1
T_H = at('Because') - 0.1
T_I = atc('The', 3) - 0.1
T_J = atc('Counting') - 0.1
T_END = at('bias') + 0.75
DUR = round(T_END + 1.6, 2)
T_S2 = T_C - T_B          # length of the landing shot (s1 runs on its own local clock)

LIGHT = (-0.7, -0.6)

# ---------------------------------------------------------------- people (one body)
CREW = Person(Build(h=640, stocky=1.05), skin=(206, 150, 114), top=(112, 98, 72), top_sh=None, legs=(84, 74, 58), legs_sh=None,
              boots=(46, 36, 30), hair=(58, 42, 32), cap=(92, 82, 62), sleeve=0.5, belt=(56, 44, 34))
WALD = Person(Build(h=620, stocky=0.95, head=1.05), skin=(222, 176, 140), top=(52, 58, 72), top_sh=None, legs=(44, 48, 60), legs_sh=None,
              boots=(28, 24, 24), hair=(70, 66, 64), sleeve=0.92)

# the people, as one skinned body each (person.py): the airman from his model sheet, and Wald in waistcoat and shirtsleeves
AIRMAN = _PP.Person(640 / 1364)
WALD2 = _PP.Person(620 / 1364, palette={_A.OL: (52, 58, 72), _A.OL_SH: (38, 42, 54), _A.OL_HI: (70, 76, 92), _A.CUFF: (52, 58, 72),
                   _A.BELT: (52, 58, 72), _A.BELT_SH: (38, 42, 54), _A.BOOT_C: (30, 28, 30), _A.BOOT_SH: (20, 18, 20), _A.SOLE: (16, 14, 16),
                   _A.SKIN: (222, 176, 140), _A.SKIN_SH: (198, 152, 120), _A.HAIR: (52, 40, 34), (150, 120, 80): (52, 58, 72)},
                   cap=False, glasses=True, collar=(236, 232, 222), tie=(120, 40, 40), sleeve=(236, 232, 222))


def man(c, who, x, hip_y, light=(0.75, -0.65), rim=_A.RIM, tint=None, shadow=False, **kw):
    """draw a person with the hip at (x, hip_y); returns (pose, joints) so props can sit in a hand"""
    ps = _A.Pose(x=x, ground=0, **kw)
    J = who.joints(ps)
    ps.ground = hip_y - J['hip'][1] * ps.s * who.k
    who.draw(c, ps, light=light, rim=rim, tint=tint, shadow=shadow)
    return ps, J


def cut_fade(c, t, t0, d=0.22, col=(6, 8, 14)):
    """a short dip at a cut (in and out)"""
    u = abs(t - t0)
    if u < d:
        c.drawRect(skia.Rect(0, 0, W, H), P(col, 150 * (1 - u / d) ** 1.6))


# ================================================================ S1: landing at dawn
def dawn_sky(c, k=0.0):
    vgrad(c, skia.Rect(0, 0, W, H), [(0, mix((40, 52, 96), (30, 38, 70), k)), (0.38, (122, 104, 150)), (0.56, (246, 168, 132)), (0.68, (255, 214, 160)), (1, (255, 226, 176))])


def s1(c, t):
    u = (t - 0) / (T_S2 - 0)
    cam = ease_io(u)
    dawn_sky(c)
    c.save()
    pz = 1 - ease_io(t / 1.0)
    c.translate(0, -250 + 60 * cam); c.scale(1 + 0.05 * cam, 1 + 0.05 * cam)
    hx_, hy_ = 330 - 120, 1150 + 250 - 30
    c.translate(hx_, hy_); c.scale(1 + 1.6 * pz, 1 + 1.6 * pz); c.translate(-hx_, -hy_)
    sx, sy = 640, 1230
    rglow(c, sx, sy, 520, (255, 236, 190), 200); c.drawCircle(sx, sy, 70, P((255, 246, 222)))
    # far clouds and ridges (haze layers)
    for i, (cx, cy, w, h) in enumerate([(160, 900, 360, 60), (820, 820, 420, 70), (520, 1010, 300, 46)]):
        cloud(c, cx + 8 * t * (0.4 + i * 0.2), cy, w, h, (255, 214, 190), (236, 176, 160), 10 + i, a=200, rim=(255, 240, 220))
    c.drawPath(poly([(0, 1300), (200, 1255), (430, 1280), (640, 1240), (900, 1272), (1080, 1250), (1080, 1400), (0, 1400)]), P((188, 136, 150)))
    c.drawPath(poly([(0, 1340), (260, 1312), (520, 1330), (820, 1300), (1080, 1326), (1080, 1460), (0, 1460)]), P((140, 104, 128)))
    # airfield seen from the side: grass, then the runway as a horizontal band with edge lights, grass in front
    c.drawRect(skia.Rect(0, 1350, W, H), P((86, 92, 72)))
    c.drawRect(skia.Rect(0, 1360, W, 1420), P((120, 118, 114)))
    c.drawRect(skia.Rect(0, 1360, W, 1366), P((150, 146, 140)))
    for k in range(9):
        lx = (k * 140 - t * 0) % 1260 - 60
        c.drawCircle(lx, 1424, 5, P((255, 214, 140), 200))
        rglow(c, lx, 1424, 18, (255, 214, 140), 90 + 60 * math.sin(t * 4 + k))
    c.drawRect(skia.Rect(0, 1430, W, H + 400), P((70, 80, 58)))
    # the bomber comes in: from the left, descending, nose slightly up, flaps down; touches down at 1.2 s
    pu = ease_out(min(1, t / 2.9))
    px = lerp(330, 560, pu); py = lerp(1150, 1290, min(1, t / 1.25) ** 1.4) if t < 1.25 else 1290 + 2 * math.sin(t * 9) * max(0, 1.7 - t)
    rot = lerp(-7, -1, min(1, t / 1.3))
    sc = lerp(0.82, 0.92, pu)
    # its shadow on the runway
    c.drawOval(skia.Rect(px - 340 * sc, 1380, px + 340 * sc, 1404), P((40, 40, 48), 90 * sm(t / 1.2)))
    bomber_side(c, px, py, sc, rot, t, light=(0.6, 0.5), rim=(255, 230, 180), gear=1.0,
                holes=1.0, backlit=0.9, prop=1.0, flaps=1.0)
    # tyre smoke at touchdown
    if 1.1 < t < 2.6:
        k = (t - 1.1)
        for j in range(3):
            r = 14 + 34 * k + j * 8
            c.drawCircle(px + 60 * sc - k * 120 - j * 26, 1398 - j * 4 - k * 8, r, P((236, 226, 214), 90 * max(0, 1 - k / 1.2)))
    # foreground grass (parallax), then the crewman
    c.restore()
    blur_layer(c, 3)
    grass_blades(c, 1920, t, (54, 70, 46), 3, n=40, h=(160, 300), x_off=-30 * cam, wide=1.6)
    c.restore()
    # crewman, foreground right, back three quarter in silhouette against the sunrise, hand up to shade his eyes
    lift = sm((t - 0.6) / 0.6)
    br = math.sin(t * 2.2)
    man(c, AIRMAN, 930, 1480, face=-1, lean=4 * lift, neck=-6 * lift, uarm_n=lerp(-3, 108, lift), elbow_n=lerp(22, 103, lift),
        wrist_n=lerp(0, -80, lift), hand_n='flat' if lift > 0.5 else 'relaxed', uarm_f=-6, elbow_f=16, br=br,
        light=(-0.6, -0.5), rim=(255, 220, 170), tint=(255, 150, 110, 30))
    blur_layer(c, 9)
    grass_blades(c, 1940, t, (40, 52, 36), 9, n=18, h=(120, 220), x_off=-60 * cam, wide=2.0)
    c.restore()


# ================================================================ S3 and S7: top down in the hangar
def blur_layer(c, r):
    """everything drawn until the matching restore is out of focus (depth of field)"""
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(r, r)))


def light_shafts(c, t, a=1.0):
    """skylight beams falling across the hangar floor, with dust drifting through them"""
    for k, (x0, w) in enumerate([(-120, 220), (300, 160), (720, 240)]):
        sway = math.sin(t * 0.3 + k) * 8
        beam = poly([(x0 + sway, -300), (x0 + w + sway, -300), (x0 + w + 520, 2300), (x0 + 520, 2300)])
        c.drawPath(beam, P((255, 226, 170), 38 * a, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
        c.drawPath(beam, P((255, 236, 190), 14 * a, MaskFilter=blur(16), BlendMode=skia.BlendMode.kPlus))
    rs = np.random.default_rng(11)
    for k in range(60):
        x0 = rs.uniform(-100, 1200); y0 = rs.uniform(0, 1900)
        x = x0 + 30 * math.sin(t * 0.4 + k) + t * 6; y = (y0 - t * (8 + k % 7)) % 1900
        c.drawCircle(x, y, rs.uniform(2.6, 5.0), P((255, 244, 214), 120 * a, MaskFilter=blur(1.5), BlendMode=skia.BlendMode.kScreen))


def hangar_floor(c, t, u):
    vgrad(c, skia.Rect(0, 0, W, H), [(0, (64, 66, 68)), (1, (52, 54, 58))])
    for gx in range(-200, 1400, 160):
        c.drawLine(gx, -200, gx, 2200, SP((76, 78, 80), 3))
    for gy in range(-200, 2200, 160):
        c.drawLine(-200, gy, 1400, gy, SP((76, 78, 80), 3))
    # oil stains
    for (ox, oy, r) in [(180, 1500, 60), (900, 520, 44), (760, 1680, 50)]:
        c.drawOval(skia.Rect(ox - r, oy - r * 0.6, ox + r, oy + r * 0.6), P((44, 44, 46)))
    # yellow safety line
    c.drawRect(skia.Rect(-200, 1720, 1400, 1740), P((214, 180, 60), 160))


def work_lights(c, t):
    for (lx, ly) in [(300, 700), (780, 700), (540, 1300)]:
        rglow(c, lx, ly, 640, (255, 236, 196), 40 + 6 * math.sin(t * 7 + lx))


def crew_shadows(c, t):
    """crew are off frame; only their long shadows fall onto the floor (the planners are watching)"""
    for k, (x, y, a) in enumerate([(70, 1350, -0.4), (1010, 1180, 0.5)]):
        sway = math.sin(t * 0.8 + k) * 0.03
        c.save(); c.translate(x, y); c.rotate(math.degrees(a + sway))
        c.drawPath(curve([(-26, 0), (-30, -200), (-60, -330), (-40, -400), (0, -430), (40, -400), (60, -330), (30, -200), (26, 0)]),
                   P((20, 22, 26), 110, MaskFilter=blur(6)))
        c.restore()


def ill_chip(c, a=1.0):
    f = skia.Font(L.XBOLD, 26); txt = 'ILLUSTRATION OF THE STORY'; w = f.measureText(txt)
    x0 = W - w - 70; y0 = 1255
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + w + 36, y0 + 44), 22, 22), P((8, 14, 26), 200 * a))
    c.drawString(txt, x0 + 18, y0 + 31, f, P((220, 226, 236), 230 * a))


def hangar(c, t, a, b, rot0, rot1, sc0, sc1, holes, armor, ring=0.0, ok=0.0, prop=0.0):
    u = ease_io((t - a) / (b - a))
    c.save(); c.translate(540, 900); c.rotate(lerp(rot0, rot1, u)); c.scale(lerp(sc0, sc1, u), lerp(sc0, sc1, u)); c.translate(-540, -900)
    hangar_floor(c, t, u)
    work_lights(c, t)
    # a cloud passing over the skylights: the light on the floor breathes
    c.drawOval(skia.Rect(80, 560, 1020, 1280), P((24, 26, 30), 110, MaskFilter=blur(30)))
    bomber_top(c, 540, 930, 1.06, 0, t, holes=holes, armor=armor, eng_ring=ring, cockpit=False, ok=ok, prop=prop)
    crew_shadows(c, t)
    light_shafts(c, t)
    c.restore()


def _push(c, u, cx, cy, z):
    """camera push toward (cx, cy) by factor z, eased by u in 0..1"""
    k = ease_io(u); zz = 1 + (z - 1) * k
    c.translate(540, 900); c.scale(zz, zz); c.translate(-lerp(540, cx, k), -lerp(900, cy, k))


def sC(c, t):
    c.save(); _push(c, (t - (T_D - 1.5)) / 1.5, 400, 900, 1.55)
    _sC(c, t); c.restore()
    out = 1 - sm((t - (T_D - 0.7)) / 0.3)
    ill_chip(c, sm((t - T_C - 0.3) / 0.4) * out)
    L.chip(c, 'ENGINES', 540, 560, (200, 210, 225), size=32, a=sm((t - at('body') - 0.2) / 0.3) * out, anchor=(292, 800))


def _sC(c, t):
    holes = dict(wings=sm((t - at('wings') + 0.3) / 0.55), tail=sm((t - at('tail') + 0.25) / 0.45), body=sm((t - at('body') + 0.25) / 0.5))
    hangar(c, t, T_C, T_D, -6, -1, 1.10, 1.04, holes, None)


def sD(c, t):
    """close on the port wing: one steel plate comes down on chains and sways, heavy; only one"""
    u = ease_io((t - T_D) / (T_E - T_D))
    c.save(); c.translate(540, 900); c.scale(1.55 + 0.1 * u, 1.55 + 0.1 * u); c.translate(-400 + 20 * u, -900)
    hangar_floor(c, t, u)
    work_lights(c, t)
    bomber_top(c, 540, 930, 1.06, 0, t, holes=dict(wings=1, tail=1, body=1), cockpit=False, prop=0.0)
    c.restore()
    # the plate: drops in fast, then a heavy settle (overshoot down, slow bounce), swinging a little on its chains
    k = t - T_D
    pos = lambda kk: lerp(-420, 760, min(1.08, (1 - math.exp(-kk * 4.0) * math.cos(kk * 7.0)) if kk > 0 else 0))
    drop = 1 - math.exp(-k * 4.0) * math.cos(k * 7.0) if k > 0 else 0
    y = pos(k)
    sw = math.sin(k * 2.2) * 4 * math.exp(-k * 0.5)
    # motion blur while it falls: faint copies along the path it just travelled
    c.save(); c.translate(560, y); c.rotate(sw)
    for dx in (-150, 150):
        c.drawLine(dx, -40, dx * 0.2, -900, SP((70, 72, 78), 9))
        for j in range(14): c.drawCircle(lerp(dx, dx * 0.2, j / 14), -40 - j * 62, 7, SP((96, 98, 104), 4))
    rr = skia.RRect.MakeRectXY(skia.Rect(-300, -60, 300, 110), 16, 16)
    q = skia.RRect(rr); 
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-280, -10, 320, 150), 16, 16), P((10, 12, 16), 120, MaskFilter=blur(18)))
    c.drawRRect(rr, P((168, 176, 186)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-300, 70, 300, 110), 16, 16), P((132, 140, 152)))
    c.drawRRect(rr, SP((96, 104, 116), 6))
    for j in range(7): c.drawCircle(-260 + j * 87, -32, 6, P((96, 104, 116)))
    c.restore()
    # dust kicked out from under the plate when it settles on the wing
    kd = k - 0.26
    if 0 < kd < 2.2:
        rd = np.random.default_rng(5)
        for j in range(40):
            side = -1 if j % 2 else 1
            sp = rd.uniform(0.5, 1.0); dy = rd.uniform(-30, 30); rr = rd.uniform(10, 26)
            r = 290 + 230 * ease_out(min(1, kd / 1.6)) * sp
            c.drawCircle(560 + side * r, 895 + dy - 30 * kd * sp, rr * (1 + 1.4 * kd), P((190, 182, 168), 46 * max(0, 1 - kd / 2.2) ** 1.5, MaskFilter=blur(9 + 6 * kd)))
    # floor shadow grows as it comes down
    c.drawOval(skia.Rect(260, 1000, 860, 1080), P((10, 12, 16), 90 * min(1, drop), MaskFilter=blur(24)))
    L.chip(c, 'EVERY POUND SLOWS IT DOWN', 540, 640, (255, 107, 107), size=36, a=sm((t - at('pound') - 0.1) / 0.3))
    L.chip(c, 'ONLY A LITTLE FITS', 540, 1180, (255, 210, 63), size=36, a=sm((t - at('little') + 0.2) / 0.35))


def sE(c, t):
    c.save(); _push(c, 1 - (t - T_E) / 0.9, 410, 900, 1.55)
    _sE(c, t); c.restore()
    ill_chip(c, sm((t - T_E - 0.7) / 0.3))


def _sE(c, t):
    p = at('armor', 2)
    armor = dict(wings=sm((t - p) / 0.5), tail=sm((t - p - 0.18) / 0.5), body=sm((t - p - 0.36) / 0.5))
    hangar(c, t, T_E, T_F, -1, 3, 1.04, 1.0, dict(wings=1, tail=1, body=1), armor)


def sI(c, t):
    so = atc('So'); arm = at('armor', 3)
    lift = 1.0
    drop = sm((t - at("weren't") + 0.15) / 0.55)
    armor = dict(wings=1 - lift, tail=1 - lift, body=1 - lift, engines=drop)
    ok = sm((t - at('showed') + 0.3) / 0.5) * (1 - sm((t - so) / 0.4))
    ring = sm((t - at('engines', 3) + 0.1) / 0.4)
    hangar(c, t, T_I, T_J, 3, 0, 1.0, 1.05, dict(wings=1, tail=1, body=1), armor, ring=ring, ok=ok)
    if ok > 0.05:
        L.chip(c, 'PLANES SURVIVE THESE', 540, 600, (120, 220, 140), size=36, a=ok)
    ill_chip(c, 1.0)
    if ring > 0.5:
        rglow(c, 540, 830, 520, (255, 220, 120), 50 * (ring - 0.5) * math.exp(-(t - at('engines', 3) - 0.3) * 1.5))


# ================================================================ S4a: Wald at his desk, side on
def s4a(c, t):
    u = (t - T_F) / (T_G - T_F)
    k = ease_io(u)
    c.save(); c.translate(540, 1000); c.scale(1 + 0.08 * k, 1 + 0.08 * k); c.translate(-540 - 30 * k, -1140)
    vgrad(c, skia.Rect(0, 0, W, H + 400), [(0, (18, 22, 40)), (1, (12, 14, 26))])
    # window behind: night sky and a far airfield with a few lights
    c.drawRect(skia.Rect(600, 380, 1000, 980), P((34, 46, 82)))
    vgrad(c, skia.Rect(610, 390, 990, 970), [(0, (30, 40, 78)), (0.7, (52, 62, 104)), (1, (80, 78, 112))])
    for i in range(18):
        rs = np.random.default_rng(i)
        c.drawCircle(rs.uniform(620, 980), rs.uniform(400, 700), 1.6, P((230, 236, 255), 140 + 80 * math.sin(t * 2 + i)))
    c.drawPath(poly([(610, 900), (990, 880), (990, 970), (610, 970)]), P((20, 24, 40)))
    for i in range(6):
        c.drawCircle(640 + i * 60, 905 - i * 3, 3, P((255, 210, 140), 200 * (0.6 + 0.4 * math.sin(t * 3 + i))))
    c.drawRect(skia.Rect(790, 380, 806, 980), P((14, 16, 26))); c.drawRect(skia.Rect(600, 672, 1000, 686), P((14, 16, 26)))
    # lamp pool on the desk
    rglow(c, 330, 1180, 620, (255, 214, 150), 120)
    # desk
    c.drawPath(poly([(-60, 1240), (1140, 1240), (1140, 1290), (-60, 1290)]), P((92, 62, 44)))
    c.drawRect(skia.Rect(-60, 1290, 1140, 2000), P((28, 22, 22)))
    c.drawRect(skia.Rect(-60, 1240, 1140, 1250), P((255, 210, 150), 90))
    # lamp
    c.drawLine(180, 1240, 230, 1010, SP((40, 40, 46), 12)); c.drawLine(230, 1010, 340, 960, SP((40, 40, 46), 10))
    c.drawPath(poly([(300, 930), (400, 980), (370, 1030), (280, 990)]), P((54, 70, 60)))
    c.drawOval(skia.Rect(150, 1226, 220, 1246), P((40, 40, 46)))
    rglow(c, 360, 1010, 70, (255, 240, 200), 230)
    # papers, a coffee cup with steam, a slide rule
    c.drawPath(poly([(240, 1236), (520, 1232), (530, 1242), (236, 1246)]), P((236, 228, 206)))
    c.drawRect(skia.Rect(400, 1190, 440, 1240), P((214, 210, 202))); c.drawRect(skia.Rect(400, 1190, 440, 1196), P((90, 60, 40)))
    for j in range(3):
        y = 1170 - ((t * 30 + j * 30) % 90)
        c.drawCircle(420 + 8 * math.sin(t * 2 + j * 2), y + 10, 6 + 3 * j, P((230, 230, 240), 40 * (1 - ((t * 30 + j * 30) % 90) / 90)))
    # Wald, seated, side on, facing left over his papers (one body), chair
    c.drawPath(poly([(760, 1100), (790, 1100), (820, 1470), (790, 1470)]), P((30, 24, 24)))
    c.drawRect(skia.Rect(640, 1300, 820, 1320), P((34, 28, 28)))
    br = math.sin(t * 2.0)
    write = math.sin(t * 9) * 3
    man(c, WALD2, 720, 1300, face=-1, lean=16 + 2 * br * 0.2, neck=24, uarm_n=22, elbow_n=66 + write, hand_n='grip', wrist_n=10,
        uarm_f=18, elbow_f=70, hand_f='flat', thigh_n=88, knee_n=-88, thigh_f=84, knee_f=-84, blink=(int(t * 10) % 37 == 0), look=0.6,
        light=(0.9, -0.4), rim=(255, 210, 150), tint=(40, 50, 90, 26))
    c.restore()


# ================================================================ S4b: his drawing on the desk, top down
def s4b(c, t):
    u = (t - T_G) / (T_H - T_G)
    k = ease_io(u)
    c.save(); c.translate(540, 920); c.scale(1.0 + 0.12 * k, 1.0 + 0.12 * k); c.translate(-540, -920)
    # desk wood
    vgrad(c, skia.Rect(0, 0, W, H), [(0, (78, 52, 38)), (1, (58, 38, 28))])
    for i in range(14):
        c.drawLine(0, 120 + i * 140 + 20 * math.sin(i), W, 140 + i * 140, SP((66, 44, 32), 6))
    # lamp pool
    rglow(c, 420, 760, 900, (255, 214, 150), 110)
    # the paper
    c.save(); c.rotate(-3)
    c.drawRect(skia.Rect(70, 420, 1030, 1420), P((30, 20, 16), 90, MaskFilter=blur(14)))
    c.drawRect(skia.Rect(60, 400, 1020, 1400), P((240, 232, 212)))
    for gy in range(440, 1400, 40):
        c.drawLine(60, gy, 1020, gy, SP((190, 200, 214), 1.5, 120))
    bomber_top(c, 540, 930, 0.95, 0, t, holes=dict(wings=1, tail=1, body=1), paper=True, cockpit=False,
               eng_ring=sm((t - at('engines')) / 0.9), ring_col=(40, 70, 160))
    c.restore()
    # his hand and pencil, coming in from the bottom right, tracing the ring around the engines
    ring = sm((t - at('engines')) / 0.9)
    ang = -1.2 + 6.283 * ease_out(ring)
    ev = sm((t - at('everywhere') + 0.5) / 1.4)
    hx = 540 + 250 * math.cos(ang) * 0.9 + 140 if ring > 0 else lerp(1180, lerp(150, 980, ev) if ev > 0 else 820, sm((t - T_G) / 0.8))
    hy = 860 + 60 * math.sin(ang) if ring > 0 else lerp(1700, (900 + 80 * math.sin(t * 9)) if ev > 0 else 1040, sm((t - T_G) / 0.8))
    if ring >= 1: hx, hy = lerp(hx, 1500, sm((t - at('engines') - 0.9) / 0.5)), lerp(hy, 2300, sm((t - at('engines') - 0.9) / 0.5))
    _hand_pencil(c, hx, hy)
    c.restore()
    g0 = sm((t - T_G - 0.2) / 0.3) * (1 - sm((t - at('everywhere') + 0.6) / 0.25))
    L.chip(c, 'RED DOTS = HOLES ON PLANES THAT CAME BACK', 540, 1296, (214, 52, 48), size=28, a=g0)
    g1 = sm((t - at('everywhere') + 0.4) / 0.3) * (1 - sm((t - at('engines') + 0.1) / 0.25))
    L.chip(c, 'BULLETS HIT EVERYWHERE', 540, 1296, (220, 220, 230), size=36, a=g1)
    L.chip(c, 'ENGINES: ALMOST NO HOLES', 540, 1296, (120, 160, 255), size=36, a=sm((t - at('engines') + 0.05) / 0.25))
    # light flicker of the lamp: warmth breathing
    c.drawRect(skia.Rect(0, 0, W, H), P((255, 200, 140), 10 + 4 * math.sin(t * 5)))


def _hand_pencil(c, x, y):
    """forearm, palm and fingers from the bottom right edge, unioned into ONE outline (seen from above), sleeve and cuff
    inside it; the pencil sits between thumb and index finger with its tip at (x, y)"""
    from onebody import capsule, union
    elbow = (x + 430, y + 640); wrist = (x + 120, y + 170)
    palm_c = (x + 78, y + 108)
    fingers = [capsule((x + 60, y + 80), (x + 28, y + 40), 15, 12),      # index along the pencil
               capsule((x + 84, y + 88), (x + 54, y + 52), 15, 12),      # middle, curled under
               capsule((x + 104, y + 100), (x + 82, y + 70), 14, 11),
               capsule((x + 118, y + 116), (x + 104, y + 94), 12, 10)]
    thumb = capsule((x + 104, y + 150), (x + 46, y + 92), 18, 13)
    palm = capsule(wrist, palm_c, 50, 42)
    arm = union([capsule(elbow, wrist, 74, 50), palm, thumb] + fingers)
    sh = skia.Path(arm); sh.offset(28, 34)
    c.drawPath(sh, P((30, 20, 16), 80, MaskFilter=blur(12)))
    # pencil under the fingers
    c.drawLine(x + 70, y + 92, x + 4, y + 8, SP((232, 190, 70), 13))
    c.drawLine(x + 4, y + 8, x - 4, y - 4, SP((230, 200, 160), 10))
    c.drawLine(x - 4, y - 4, x - 8, y - 10, SP((50, 46, 44), 5))
    c.save(); c.clipPath(arm, skia.ClipOp.kIntersect, True)
    c.drawPath(arm, P((222, 176, 140)))
    for f in fingers[1:]:
        q = skia.Path(f); q.offset(4, 5)
        c.drawPath(op(q, f, skia.PathOp.kDifference_PathOp), P((190, 140, 110)))   # the gap shadow between fingers
    c.drawPath(capsule(elbow, (x + 150, y + 210), 96, 76), P((52, 58, 72)))
    c.drawPath(capsule((x + 170, y + 240), (x + 150, y + 210), 78, 76), P((236, 232, 222)))
    c.restore()
    rim = skia.Path(arm); rim.offset(4, 4)
    c.drawPath(op(arm, rim, skia.PathOp.kDifference_PathOp), P((255, 220, 170), 200))


# ================================================================ A and H: the formation in the sky
PLANES = [(600, 720, 0.95), (470, 830, 0.75), (820, 900, 0.8), (500, 1000, 0.62), (1000, 1060, 0.58), (300, 650, 0.5)]


def sky(c, t, a, b, falls, push=None, chip=None, flak=()):
    """falls: {plane index: time hit}; push: plane index the camera pushes in on at its hit; chip: (text, time, plane idx)"""
    u = (t - a) / (b - a)
    tt = t - a
    cam_y = 40 * ease_io(u)
    vgrad(c, skia.Rect(0, 0, W, H), [(0, (36, 40, 84)), (0.45, (116, 88, 132)), (0.7, (242, 150, 120)), (1, (255, 200, 150))])
    rglow(c, 820, 1180, 420, (255, 214, 160), 160)
    shk = 0.0
    for th in falls.values():
        if t >= th: shk = max(shk, 1 - (t - th) / 0.5)
    c.save()
    c.translate(math.sin(t * 90) * 10 * shk, math.cos(t * 77) * 8 * shk)
    c.translate(0, cam_y)
    if push is not None:
        zk = ease_io((t - falls[push] + 0.6) / 1.4)
        fx0, fy0 = PLANES[push][0] - (falls[push] - a) * 8, PLANES[push][1]
        c.translate(fx0, fy0); c.scale(1 + 0.4 * zk, 1 + 0.4 * zk); c.translate(-fx0 - 60 * zk, -fy0 + 40 * zk)
    for i in range(4):
        cloud(c, (1200 - (tt * (30 + i * 12) + i * 330)) % 1500 - 200, 600 + i * 120, 380, 40, (196, 150, 170), (170, 124, 150), 30 + i, a=160)
    for i, (x0, y0, s) in enumerate(PLANES):
        bob = math.sin(tt * 1.2 + i) * 6
        x = x0 - tt * 10 * s; y = y0 + bob
        if i in falls:
            hit = falls[i]
            fall = min(2.6, max(0.0, t - hit))
            x += -fall * 50; y += 40 * fall ** 2 + 30 * fall
            rot = min(34, fall * 20)
            if fall > 0:
                pts = []
                for k in range(30):
                    q = fall * k / 29
                    fq = fall - q
                    pts.append((x0 - (t - q - a) * 10 * s - fq * 50 + 30 * s, y0 + 40 * fq ** 2 + 30 * fq + 6 * s))
                for k in range(len(pts) - 1):
                    w = (90 - 60 * (1 - k / 29)) * s
                    al = 200 * (1 - k / 29) ** 0.7
                    c.drawLine(*pts[k], *pts[k + 1], SP((46, 42, 52), w, al, MaskFilter=blur(6)))
                    c.drawLine(*pts[k], *pts[k + 1], SP((110, 92, 104), w * 0.4, al * 0.5, MaskFilter=blur(4)))
            if 0 < fall < 2.6:
                for j in range(1, 4):
                    f2 = max(0.0, fall - j * 0.02)
                    c.saveLayerAlpha(None, 60 - j * 15)
                    bomber_small(c, x0 - tt * 10 * s + j * 0.2 * s - f2 * 50, y0 + bob + 40 * f2 ** 2 + 30 * f2, s, None, rot=min(34, f2 * 20), t=t)
                    c.restore()
                # smoke puffs that swell and drift behind the falling plane
                for j in range(10):
                    q = fall - j * 0.16
                    if q <= 0: continue
                    px = x0 - (t - j * 0.16 - a) * 10 * s - q * 50 + 30 * s + j * 6
                    py = y0 + 40 * q ** 2 + 30 * q - j * 3
                    c.drawCircle(px, py, (14 + j * 7) * s, P((60, 54, 64), 150 * (1 - j / 10), MaskFilter=blur(8 + j)))
            bomber_small(c, x, y, s, None, rot=rot, t=t, fire=sm(fall / 0.2) if fall > 0 else 0.0)
        else:
            bomber_small(c, x, y, s, None, t=t)
    for (fx, fy, f0) in list(flak) + [(PLANES[i][0] - (th - a) * 10 * PLANES[i][2] + FIRE_PT[0] * 0.28 * PLANES[i][2], PLANES[i][1] + FIRE_PT[1] * 0.28 * PLANES[i][2], th - 0.05) for i, th in falls.items()]:
        aa = t - f0
        if 0 < aa < 3.0:
            r = 18 + 30 * ease_out(aa / 0.5)
            bx, by = fx - aa * 18, fy - aa * 5
            pts = [(bx + r * (1 + 0.3 * math.sin(k * 2.3 + f0)) * math.cos(k * 0.785), by + r * 0.8 * (1 + 0.3 * math.cos(k * 1.7 + f0)) * math.sin(k * 0.785)) for k in range(8)]
            if aa < 0.3:
                rglow(c, bx, by, r * 2.4, (255, 200, 120), 255 * (1 - aa / 0.3))
            c.drawPath(curve(pts), P((30, 28, 36), 200 * max(0, 1 - aa / 3) * sm(aa / 0.12), MaskFilter=blur(5)))
            if aa < 0.35: c.drawPath(curve([(bx + 0.5 * (px - bx), by + 0.5 * (py - by)) for px, py in pts]), P((255, 210, 120), 255 * (1 - aa / 0.35)))
    for i in range(6):
        cloud(c, i * 220 - 40 - (tt * 18) % 220, 1340 + (i % 2) * 30, 360, 110, (255, 212, 186), (232, 168, 158), 50 + i, rim=(255, 236, 220))
    c.drawRect(skia.Rect(0, 1380, W, 2100), P((244, 186, 166)))
    c.drawRect(skia.Rect(0, 1520, W, 2100), P((210, 150, 150)))
    c.restore()
    # near cloud wisps racing past the camera, out of focus: depth and speed
    blur_layer(c, 18)
    for i in range(3):
        x = (1500 - ((t - a) * (260 + 90 * i) + i * 700)) % 2400 - 600
        cloud(c, x, 420 + i * 520, 520, 90, (255, 226, 214), (236, 196, 196), 70 + i, a=110)
    c.restore()
    if chip:
        txt, t0, i = chip
        g = sm((t - t0) / 0.5)
        if g > 0:
            x0, y0, s = PLANES[i]
            L.chip(c, txt.upper(), x0 - (t - a) * 10 * s, y0 - 120 + cam_y, (255, 107, 107), size=38, a=g)
            path = skia.Path(); path.addCircle(x0 - (t - a) * 10 * s, y0 + cam_y, 70)
            c.drawPath(path, SP((255, 107, 107), 5, 220 * g, PathEffect=skia.DashPathEffect.Make([16, 12], t * 20)))


def sA(c, t):
    sky(c, t, 0.0, T_B, {3: 0.6, 2: at('never') - 0.05, 0: at('back') - 0.1}, flak=[(470, 700, 0.25), (760, 820, 0.7), (300, 980, 2.0), (640, 640, 3.0)])


def sH(c, t):
    sky(c, t, T_H, T_I, {2: at('engines', 2)}, push=2, chip=('never came back', at('never', 2), 2),
        flak=[(300, 560, T_H + 0.3), (900, 780, T_H + 0.9), (720, 1180, T_H + 3.3)])


# ================================================================ S6: the survivors on the field, one empty spot
def s6(c, t):
    u = (t - T_J) / (DUR - T_J)
    dx = -70 * ease_io(u)
    dawn_sky(c, 0.3)
    rglow(c, 900, 760, 500, (255, 236, 190), 160)
    c.drawCircle(900, 790, 56, P((255, 246, 222)))
    c.drawPath(poly([(0, 830), (300, 800), (640, 824), (1080, 790), (1080, 1000), (0, 1000)]), P((176, 128, 142)))
    c.drawRect(skia.Rect(0, 870, W, H), P((96, 98, 86)))
    c.drawRect(skia.Rect(0, 1240, W, H), P((84, 88, 74)))
    c.save(); c.translate(dx, 0)
    # a row of parked bombers receding along the field, every one with holes; one empty hardstand with a chalk outline
    slots = [(940, 900, 0.22), (700, 950, 0.30), (420, 1020, 0.40), (60, 1130, 0.58)]
    for i, (x, y, s) in enumerate(slots):
        c.drawOval(skia.Rect(x - 420 * s, y + 90 * s, x + 420 * s, y + 130 * s), P((70, 72, 62)))
        if i == 2:
            out = sm((t - T_J - 0.3) / 0.8)
            c.save(); c.translate(x, y + 110 * s); c.scale(s, s * 0.32)
            c.drawPath(curve([(400, -8), (300, -66), (-200, -60), (-545, -6), (-420, 34), (300, 52)]), SP((236, 232, 220), 9, 230 * out, PathEffect=skia.DashPathEffect.Make([30, 20], 0)))
            c.restore()
            L.chip(c, 'MISSING', x, y + 20, (255, 107, 107), size=36, a=out)
            continue
        bomber_side(c, x, y, s, 0, t, light=(0.6, -0.6), rim=(255, 220, 170), gear=1.0, holes=1.0, prop=0.0)
    # two crew on the line: one walks and writes on a clipboard, the other stops and points down the row (one body each)
    for k in range(2):
        w = t - T_J
        c.save()
        if k == 0:
            ph = w * 3.4
            c.translate(820 - w * 22, 1230); c.scale(0.52, 0.52)
            c.drawOval(skia.Rect(-90, 318, 90, 342), P((40, 42, 36), 130))
            sw = math.sin(ph)
            ps, J = man(c, AIRMAN, 0, 0, face=-1, lean=5, neck=20, uarm_n=30, elbow_n=100, hand_n='grip', uarm_f=-14 * sw, elbow_f=24,
                        thigh_n=20 * sw, knee_n=-6 - 22 * max(0, -sw), thigh_f=-20 * sw, knee_f=-6 - 22 * max(0, sw), ank_n=-10 * sw, ank_f=10 * sw,
                        light=(-0.6, -0.6), rim=(255, 220, 170))
            who = AIRMAN
        else:
            c.translate(200, 1230); c.scale(0.5, 0.5)
            c.drawOval(skia.Rect(-90, 318, 90, 342), P((40, 42, 36), 130))
            ps, J = man(c, AIRMAN, 0, 0, face=1, lean=2, neck=-12, uarm_n=104 + 3 * math.sin(t * 1.5), elbow_n=8, hand_n='point',
                        uarm_f=-4, elbow_f=20, hand_f='fist', light=(0.6, -0.6), rim=(255, 220, 170))
            who = AIRMAN
        # the clipboard is held by the far hand (drawn at that hand), paper on a brown board
        if k == 1:
            c.restore(); continue
        o_, d_ = J['hand_n']
        hx, hy = who.canvas_pt(ps, who.frame(o_, d_)(10, 50))
        c.save(); c.translate(hx, hy); c.rotate(-20 if k == 0 else 10)
        c.drawRoundRect(skia.Rect(-38, -50, 38, 50), 6, 6, P((120, 84, 52)))
        c.drawRect(skia.Rect(-30, -40, 30, 44), P((236, 230, 212)))
        for j in range(4): c.drawLine(-22, -26 + j * 16, 20, -26 + j * 16, SP((150, 150, 160), 3))
        c.restore()
        c.restore()
    c.restore()
    grass_blades(c, 1560, t, (70, 86, 58), 31, n=60, h=(40, 90), x_off=dx * 1.2)
    grass_blades(c, 1760, t, (64, 80, 54), 33, n=50, h=(80, 170), x_off=dx * 1.4)
    blur_layer(c, 6)
    grass_blades(c, 1940, t, (78, 96, 62), 21, n=36, h=(180, 320), x_off=dx * 1.8, wide=1.6)
    c.restore()


# ================================================================ titles, captions, frame
TITLES = [
    (-1.0, T_B - 0.05, [[('SURVIVORSHIP BIAS', L.YELLOW)], [('MANY NEVER CAME BACK', L.WHITE)]]),
    (T_B, T_C - 0.05, [[('SURVIVORSHIP BIAS', L.YELLOW)], [('THE ONES THAT CAME BACK', L.WHITE)]]),
    (T_C, T_D - 0.05, [[('HOLES ON THE', L.WHITE)], [('WINGS, TAIL, BODY', L.YELLOW)]]),
    (T_D, T_E - 0.05, [[('ARMOR IS HEAVY', L.WHITE)], [('WHERE DOES IT GO?', L.YELLOW)]]),
    (T_E, T_F - 0.05, [[("THE MILITARY'S PLAN", L.WHITE)], [('ARMOR THE HOLES', L.YELLOW)]]),
    (T_F, T_G - 0.05, [[('ABRAHAM WALD', L.WHITE)], [('NOTICED SOMETHING', L.YELLOW)]]),
    (T_G, T_H - 0.05, [[('WHY ARE THE', L.WHITE)], [('ENGINES CLEAN?', L.YELLOW)]]),
    (T_H, T_I - 0.05, [[('ENGINE HITS', L.WHITE)], [('NEVER CAME BACK', L.CORAL)]]),
    (T_I, atc('So') - 0.05, [[('HOLES SHOW WHERE', L.WHITE)], [('A PLANE CAN SURVIVE', L.YELLOW)]]),
    (atc('So'), T_J - 0.05, [[('ARMOR WHERE THE', L.WHITE)], [("HOLES WEREN'T", L.TEAL)]]),
    (T_J, at('survivorship') - 0.05, [[('COUNTING ONLY', L.WHITE)], [('THE SURVIVORS', L.YELLOW)]]),
    (at('survivorship'), DUR + 1, [[('THIS IS CALLED', L.WHITE)], [('SURVIVORSHIP BIAS', L.YELLOW)]]),
]
CAP = lpk.Captions(VO, fix={'WEREN\'T:': "weren't:", 'everywhere...': 'everywhere,'})


import cv2
_GRAIN = np.random.default_rng(3)
_VIG = None


def LIFT(t):
    """midtone lift per scene: the hangar and the dusk field run dark"""
    if T_C <= t < T_F or T_I <= t < T_J: return 1.16
    if t >= T_J: return 1.14
    return 1.0


def finish(img, t):
    """film finish on the scene (before titles and captions): bloom on bright light, one grade for the whole video
    (a touch desaturated, warm highlights, cool lifted shadows, gentle S curve), a soft vignette, fine moving grain"""
    global _VIG
    x = img[:, :, :3].astype(np.float32) / 255.0          # BGR
    lum = x @ np.array([0.114, 0.587, 0.299], np.float32)
    hi = np.clip((lum - 0.72) / 0.28, 0, 1)[..., None] * x
    small = cv2.resize(hi, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bl = cv2.GaussianBlur(small, (0, 0), 10)
    bl = cv2.resize(bl, (W, H), interpolation=cv2.INTER_LINEAR)
    x = 1 - (1 - x) * (1 - 0.35 * bl)
    g = lum[..., None]
    x = g + (x - g) * 0.95
    lift = LIFT(t)
    x = np.power(np.clip(x, 0, 1), 1 / lift)                                         # lift mids where a scene runs dark
    x = 0.5 + (x - 0.5) * 1.06                                                       # gentle contrast, no grey veil
    x = x * (1 + np.array([-0.02, 0.0, 0.03], np.float32) * g)                       # warm highlights only (BGR)
    if _VIG is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.47) / (H * 0.6)) ** 2
        _VIG = (1 - 0.14 * np.clip(d, 0, 1.4) ** 1.6)[..., None]
    x = x * _VIG
    n = _GRAIN.normal(0, 0.011, (H // 2, W // 2)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    x = x + n * (0.5 + 0.5 * (1 - g))
    out = img.copy(); out[:, :, :3] = np.clip(x * 255 + 0.5, 0, 255).astype(np.uint8)
    return out


def scene(c, t):
    if t < T_B: sA(c, t)
    elif t < T_C: s1(c, t - T_B)
    elif t < T_D: sC(c, t)
    elif t < T_E: sD(c, t)
    elif t < T_F: sE(c, t)
    elif t < T_G: s4a(c, t)
    elif t < T_H: s4b(c, t)
    elif t < T_I: sH(c, t)
    elif t < T_J: sI(c, t)
    else: s6(c, t)


PUSH0, PUSH1 = T_G - 0.6, T_G + 0.55


def frame(t):
    s = skia.Surface(W, H); c = s.getCanvas()
    if PUSH0 < t < PUSH1:
        # the camera pushes in from Wald at his desk down into the paper in front of him, and his drawing fills the frame
        if t < T_G:
            k = ((t - PUSH0) / (T_G - PUSH0)) ** 2.2           # ease in: the push speeds up into the paper
            z = 1 + 2.4 * k
            kk = ease_io(min(1, (t - PUSH0) / (T_G - PUSH0)))
            c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-lerp(540, 380, kk), -lerp(960, 1110, kk))
            s4a(c, t); c.restore()
        else:
            k = 1 - (1 - (t - T_G) / (PUSH1 - T_G)) ** 2.2     # ease out: his drawing settles into place
            z = 1.35 - 0.35 * k
            c.save(); c.translate(540, 920); c.scale(z, z); c.translate(-540, -920)
            s4b(c, t); c.restore()
    else:
        scene(c, t)
    # hard cuts on the music, no dips; the hangar and Wald to paper moves are continuous
    img = s.makeImageSnapshot().toarray()
    img = finish(img, t)
    s = skia.Surface(W, H); c = s.getCanvas()
    c.drawImage(skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType), 0, 0)
    L.fades(c)
    L.badge(c, 'AP STATISTICS')
    for (a, b, lines) in TITLES:
        L.title(c, lines, t, a, b)
    if t < T_END:
        f = skia.Font(L.BLACK, 32); ww = f.measureText('levlprep.com')
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(40, 1368, 72 + ww, 1414), 20, 20), P((5, 12, 26), 150))
        L.watermark(c)
    CAP.draw(c, t)
    if t > T_END: lpk.end_line(c, t, T_END, y=1560)
    return s


if __name__ == '__main__':
    out, st = lpk.args()
    lpk.render(frame, DUR, out, stills=st, outdir='/home/claude/plane/stills')
