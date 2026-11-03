"""w1101-01 survivorship bias, REBUILD (Olivier 2026-11-01): cinematic documentary, every shot planned for a reason.

SHOT PLAN (why each shot exists)
S1 0.00 hook   Low angle in the grass at dawn. A battered bomber comes in to land toward us, backlit, so sunlight pours
               through its bullet holes; a ground crewman in the foreground shields his eyes. The holes are the story,
               so the first frame makes them glow.                         camera: slow tilt up and push, parallax grass
S2 3.05 idea   Inside the fuselage: dark ribs, beams of dawn light through the holes, dust drifting in them. The idea
               (survivorship bias) is said over the most beautiful image of the damage.   camera: slow dolly along the wall
S3 7.10 data   Top down in the hangar under work lights, the planners' view. Red marks land on the wings, tail and body
               exactly as each is named; at "more armor right there" plates drop onto those spots (the obvious fix).
               camera: locked high, slow rotate, so the pattern reads like a chart          label: illustration of the story
S4a 16.25 who  Abraham Wald at his desk at night, side on, lamp light; a person thinking, not a chart. camera: slow push
S4b 18.55 q    Match back to top down: the same plane, now as his pencil drawing on paper under the lamp. His hand circles
               the engines and the cockpit, where there are no marks: "where are the missing holes?"
S5 22.45 why   Up in the sky at dusk, a formation. Flak; one plane is hit in the ENGINE on the word, smokes, peels away
               and drops into the clouds. The camera holds on the gap it leaves: nobody got to count it.
S6 27.75 bias  Back on the field: a row of parked survivors, one empty hardstand with a chalk outline. The sample has a
               hole in it.                                                  camera: slow lateral track
S7 30.55 fix   Top down again: the plates lift off the wings and drop onto the engines and cockpit on "armor", and the
               rings flash on "AREN'T". Last 1.5 s the plane rolls out toward the sunrise; loops into the first frame.
"""
import sys, math, json
sys.path.insert(0, '/home/claude/plane'); sys.path.insert(0, '/home/claude/short')
import numpy as np, skia
import layout as L
from art import *
from onebody import Build, Pose, Person
import person as _PP, airman2 as _A
import lpk

VO = json.load(open('/home/claude/plane/vo/words.json'))
WD = lpk.Words('/home/claude/plane/vo/words.json')
DUR = 34.6


_W = [x['w'].lower().strip('.,!?') for x in VO]


def at(w, n=1):
    w = w.lower().strip('.,!?'); k = 0
    for i, x in enumerate(_W):
        if x == w:
            k += 1
            if k == n: return VO[i]['t0']
    raise KeyError(w)


T_S2 = at('and') - 0.1           # 3.02
T_S3 = at('in', 2) - 0.15
T_S4 = at('But') - 0.1
T_S4B = at('asked') + 0.02
T_S5 = at('Planes') - 0.12
T_S6 = at('They') - 0.12
T_S7 = at('so', 3) - 0.12
T_END = at("aren't") + 0.55

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
    grass_blades(c, 1920, t, (54, 70, 46), 3, n=40, h=(160, 300), x_off=-30 * cam, wide=1.6)
    # crewman, foreground right, back three quarter in silhouette against the sunrise, hand up to shade his eyes
    lift = sm((t - 0.6) / 0.6)
    br = math.sin(t * 2.2)
    man(c, AIRMAN, 930, 1480, face=-1, lean=4 * lift, neck=-6 * lift, uarm_n=lerp(-3, 108, lift), elbow_n=lerp(22, 103, lift),
        wrist_n=lerp(0, -80, lift), hand_n='flat' if lift > 0.5 else 'relaxed', uarm_f=-6, elbow_f=16, br=br,
        light=(-0.6, -0.5), rim=(255, 220, 170), tint=(255, 150, 110, 30))
    grass_blades(c, 1940, t, (40, 52, 36), 9, n=18, h=(120, 220), x_off=-60 * cam, wide=2.0)


# ================================================================ S2: inside the fuselage, light through the holes
BEAM_HOLES = [(300, 520, 9), (420, 610, 7), (250, 760, 11), (640, 470, 8), (700, 690, 10), (820, 560, 6), (540, 820, 9), (900, 760, 8), (380, 900, 6)]


def s2(c, t):
    u = (t - T_S2) / (T_S3 - T_S2)
    dx = -110 * ease_io(u)
    vgrad(c, skia.Rect(0, 0, W, H), [(0, (26, 26, 30)), (0.5, (38, 36, 36)), (1, (20, 20, 24))])
    c.save(); c.translate(dx, 0)
    # curved fuselage wall panels and ribs (perspective: ribs converge to the right)
    for i in range(-1, 9):
        x = 60 + i * 150
        c.drawPath(poly([(x, 200), (x + 140, 230), (x + 140, 1250), (x, 1290)]), P((60, 62, 52)))
        c.drawPath(poly([(x + 120, 220), (x + 144, 226), (x + 144, 1258), (x + 120, 1270)]), P((40, 42, 36)))
        for ry in range(300, 1200, 120):
            c.drawCircle(x + 130, ry + 12, 3.5, P((90, 92, 80)))
    # a small waist window with daylight, so we know where we are
    c.drawRoundRect(skia.Rect(470, 560, 640, 660), 18, 18, P((40, 42, 36)))
    c.drawRoundRect(skia.Rect(480, 570, 630, 650), 14, 14, P((255, 222, 176)))
    c.drawLine(555, 570, 555, 650, SP((40, 42, 36), 8))
    rglow(c, 555, 610, 220, (255, 220, 170), 60)
    # floor and the light pool
    c.drawPath(poly([(-200, 1260), (1400, 1180), (1400, 1920), (-200, 1920)]), P((32, 30, 30)))
    c.drawPath(poly([(-200, 1300), (1400, 1230), (1400, 1250), (-200, 1330)]), P((52, 50, 46)))
    # holes in the wall with jagged petals, and their beams falling across the dark to the floor
    for i, (hx, hy, r) in enumerate(BEAM_HOLES):
        sway = math.sin(t * 0.6 + i) * 6
        bx = hx + 260 + sway * 3; by = 1380 + i * 22
        beam = poly([(hx - r * 0.9, hy - r * 0.6), (hx + r * 0.9, hy + r * 0.6), (bx + 120, by + 10), (bx - 90, by - 20)])
        c.drawPath(beam, P((255, 214, 150), 40, MaskFilter=blur(14)))
        c.drawPath(beam, P((255, 230, 180), 18))
        c.drawOval(skia.Rect(bx - 60, by - 14, bx + 70, by + 12), P((255, 214, 150), 60, MaskFilter=blur(8)))
        # the hole: bright core, torn metal petals
        pet = []
        for k in range(9):
            a = k / 9 * 6.283
            rr = r * (1.0 + 0.55 * ((k * 37) % 5) / 5)
            pet.append((hx + rr * math.cos(a), hy + rr * math.sin(a)))
        c.drawPath(curve(pet), P((86, 88, 74)))
        rglow(c, hx, hy, r * 4, (255, 220, 160), 170)
        c.drawCircle(hx, hy, r * 0.8, P((255, 244, 214)))
    # dust motes in the beams
    rs = np.random.default_rng(5)
    for k in range(70):
        x0 = rs.uniform(150, 1100); y0 = rs.uniform(400, 1350)
        x = x0 + math.sin(t * 0.5 + k) * 20; y = y0 - (t * 18 + k * 13) % 260
        c.drawCircle(x, y, rs.uniform(1.4, 3), P((255, 236, 200), 120))
    c.restore()
    # a mechanic steps in and puts his hand up to a hole: dark silhouette with a warm rim (one body)
    m = 0.35 + 0.65 * sm((t - T_S2) / 1.6)
    reach = sm((t - T_S2 - 1.8) / 0.9)
    CREW.draw(c, Pose(lerp(-120, 170, m) + dx * 0.4, 1560, face=1, lean=3, neck=-14 * reach,
                       arm_n=(lerp(12, 128, reach), lerp(20, 34, reach)), arm_f=(-10, 18),
                       leg_n=(10 * math.sin(m * 9) * (1 - m), 4), leg_f=(-10 * math.sin(m * 9) * (1 - m), 6), breath=math.sin(t * 2.2)),
              light=(1, -0.3), rim=(255, 210, 150), shade_amt=0.0, tint=None, silhouette=None, far_dim=0.7) if False else None
    _silhouette_mech(c, t, m, reach, dx)


def _silhouette_mech(c, t, m, reach, dx):
    s = skia.Surface(W, H); cc = s.getCanvas(); cc.clear(skia.Color(0, 0, 0, 0))
    wk = 12 * math.sin(m * 9) * (1 - m)
    man(cc, AIRMAN, lerp(120, 300, m) + dx * 0.4, 1420, face=1, lean=3, neck=-16 * reach,
        uarm_n=lerp(-3, 140, reach), elbow_n=lerp(22, 28, reach), hand_n='flat' if reach > 0.5 else 'fist', wrist_n=lerp(0, -20, reach),
        uarm_f=-8, elbow_f=18, thigh_n=wk, knee_n=-6 - max(0, wk), thigh_f=-wk, knee_f=-6 - max(0, -wk))
    cc.drawPaint(skia.Paint(Color=C((18, 16, 18)), BlendMode=skia.BlendMode.kSrcIn))
    img = s.makeImageSnapshot()
    c.drawImage(img, 0, 0)
    # warm rim: the silhouette offset toward the light, kept only at its lit edge
    c.saveLayer(None, None)
    c.drawImage(img, 3, -1, skia.SamplingOptions(), skia.Paint(ColorFilter=skia.ColorFilters.Blend(C((255, 200, 140)), skia.BlendMode.kSrcIn)))
    c.drawImage(img, 0, 0, skia.SamplingOptions(), skia.Paint(BlendMode=skia.BlendMode.kDstOut))
    c.restore()


# ================================================================ S3 and S7: top down in the hangar
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


def s3(c, t):
    u = (t - T_S3) / (T_S4 - T_S3)
    c.save(); c.translate(540, 900); c.rotate(-6 + 10 * ease_io(u)); c.scale(1.08 - 0.06 * ease_io(u), 1.08 - 0.06 * ease_io(u)); c.translate(-540, -900)
    hangar_floor(c, t, u)
    work_lights(c, t)
    # the plane's soft contact shadow, then the plane
    c.drawOval(skia.Rect(80, 560, 1020, 1280), P((24, 26, 30), 110, MaskFilter=blur(30)))
    holes = dict(wings=sm((t - at('wings')) / 0.55), tail=sm((t - at('tail')) / 0.45), body=sm((t - at('body')) / 0.5))
    armor = dict(wings=sm((t - at('armor', 2) - 0.05) / 0.5), tail=sm((t - at('armor', 2) - 0.2) / 0.5), body=sm((t - at('armor', 2) - 0.35) / 0.5))
    bomber_top(c, 540, 930, 1.06, 0, t, holes=holes, armor=armor, prop=0.0)
    # red tally marks appear beside each hole group as it is named (the planners' count)
    crew_shadows(c, t)
    c.restore()
    ill_chip(c, sm((t - T_S3 - 0.4) / 0.4))


def s7(c, t):
    u = (t - T_S7) / (DUR - T_S7)
    c.save(); c.translate(540, 900); c.rotate(4 - 4 * ease_io(min(1, u * 1.6))); c.translate(-540, -900)
    hangar_floor(c, t, u)
    work_lights(c, t)
    c.drawOval(skia.Rect(80, 560, 1020, 1280), P((24, 26, 30), 110, MaskFilter=blur(30)))
    lift = sm((t - T_S7) / 0.45)
    drop = sm((t - at('armor', 3) + 0.05) / 0.55)
    armor = dict(wings=1 - lift, tail=1 - lift, body=1 - lift, engines=drop, cockpit=sm((t - at('armor', 3) - 0.2) / 0.55))
    ring = sm((t - at("aren't")) / 0.4)
    bomber_top(c, 540, 930, 1.06, 0, t, holes=dict(wings=1, tail=1, body=1), armor=armor, eng_ring=ring, prop=sm((t - T_END + 0.3) / 0.5))
    crew_shadows(c, t)
    c.restore()
    ill_chip(c, 1.0 - sm((t - T_END) / 0.3))
    if ring > 0.5:
        rglow(c, 540, 830, 520, (255, 220, 120), 50 * (ring - 0.5) * math.exp(-(t - at("aren't") - 0.4) * 1.5))


# ================================================================ S4a: Wald at his desk, side on
def s4a(c, t):
    u = (t - T_S4) / (T_S4B - T_S4)
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
    u = (t - T_S4B) / (T_S5 - T_S4B)
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
    bomber_top(c, 540, 930, 0.95, 0, t, holes=dict(wings=1, tail=1, body=1), paper=True,
               eng_ring=sm((t - at('missing')) / 0.9), ring_col=(40, 70, 160))
    c.restore()
    # his hand and pencil, coming in from the bottom right, tracing the ring around the engines
    ring = sm((t - at('missing')) / 0.9)
    ang = -1.2 + 6.283 * ease_out(ring)
    hx = 540 + 250 * math.cos(ang) * 0.9 + 140 if ring > 0 else lerp(1180, 820, sm((t - T_S4B) / 0.8))
    hy = 860 + 60 * math.sin(ang) if ring > 0 else lerp(1700, 1040, sm((t - T_S4B) / 0.8))
    if ring >= 1: hx, hy = lerp(hx, 980, sm((t - at('missing') - 0.9) / 0.4)), lerp(hy, 1500, sm((t - at('missing') - 0.9) / 0.4))
    _hand_pencil(c, hx, hy)
    c.restore()
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


# ================================================================ S5: the formation at dusk
def s5(c, t):
    u = (t - T_S5) / (T_S6 - T_S5)
    tt = t - T_S5
    cam_y = 40 * ease_io(u)
    vgrad(c, skia.Rect(0, 0, W, H), [(0, (36, 40, 84)), (0.45, (116, 88, 132)), (0.7, (242, 150, 120)), (1, (255, 200, 150))])
    rglow(c, 820, 1180, 420, (255, 214, 160), 160)
    hitc = at('engines')
    shk = max(0.0, 1 - (t - hitc) / 0.5) if t >= hitc else 0.0
    c.translate(math.sin(t * 90) * 10 * shk, math.cos(t * 77) * 8 * shk)
    zk = ease_io((t - hitc + 0.6) / 1.4)
    fx0, fy0 = 820 - (hitc - T_S5) * 8, 900
    c.save(); c.translate(0, cam_y)
    c.translate(fx0, fy0); c.scale(1 + 0.4 * zk, 1 + 0.4 * zk); c.translate(-fx0 - 60 * zk, -fy0 + 40 * zk)
    # high thin clouds drift (parallax), cloud sea below
    for i in range(4):
        cloud(c, (1200 - (tt * (30 + i * 12) + i * 330)) % 1500 - 200, 600 + i * 120, 380, 40, (196, 150, 170), (170, 124, 150), 30 + i, a=160)
    # formation: five four engine bombers flying right to left; the hit one is the middle right plane
    hit = at('engines')
    planes = [(600, 720, 0.95), (470, 830, 0.75), (820, 900, 0.8), (500, 1000, 0.62), (1000, 1060, 0.58)]
    for i, (x0, y0, s) in enumerate(planes):
        bob = math.sin(tt * 1.2 + i) * 6
        x = x0 - tt * 10 * s; y = y0 + bob
        if i == 2:
            fall = min(2.6, max(0.0, t - hit))
            x += -fall * 50; y += 40 * fall ** 2 + 30 * fall
            rot = min(34, fall * 20)
            if fall > 0:
                # continuous tapered smoke: a wide soft stroke along the path the engine has travelled
                pts = []
                for k in range(30):
                    q = fall * k / 29
                    fq = fall - q
                    pts.append((x0 - (t - q - T_S5) * 10 * s - fq * 50 + 30 * s, y0 + 40 * fq ** 2 + 30 * fq + 6 * s))
                for k in range(len(pts) - 1):
                    w = (90 - 60 * (1 - k / 29)) * s
                    a = 200 * (1 - k / 29) ** 0.7
                    c.drawLine(*pts[k], *pts[k + 1], SP((46, 42, 52), w, a, MaskFilter=blur(6)))
                    c.drawLine(*pts[k], *pts[k + 1], SP((110, 92, 104), w * 0.4, a * 0.5, MaskFilter=blur(4)))
            bomber_small(c, x, y, s, None, rot=rot, t=t, fire=sm(fall / 0.2) if fall > 0 else 0.0)
        else:
            bomber_small(c, x, y, s, None, t=t)
    # flak: a bright core flash, then a lumpy black puff that drifts and thins
    for (fx, fy, f0) in [(470, 700, T_S5 + 0.3), (760, 820, T_S5 + 1.0), (300, 980, T_S5 + 2.4), (640, 640, T_S5 + 3.3), (900, 930, hit - 0.05)]:
        a = t - f0
        if 0 < a < 3.0:
            r = 18 + 30 * ease_out(a / 0.5)
            bx, by = fx - a * 18, fy - a * 5
            pts = [(bx + r * (1 + 0.3 * math.sin(k * 2.3 + f0)) * math.cos(k * 0.785), by + r * 0.8 * (1 + 0.3 * math.cos(k * 1.7 + f0)) * math.sin(k * 0.785)) for k in range(8)]
            if a < 0.3:
                rglow(c, bx, by, r * 2.4, (255, 200, 120), 255 * (1 - a / 0.3))
            c.drawPath(curve(pts), P((30, 28, 36), 200 * max(0, 1 - a / 3) * sm(a / 0.12), MaskFilter=blur(5)))
            if a < 0.35: c.drawPath(curve([(bx + 0.5 * (px - bx), by + 0.5 * (py - by)) for px, py in pts]), P((255, 210, 120), 255 * (1 - a / 0.35)))
    # the cloud sea below swallows the falling plane
    for i in range(6):
        cloud(c, i * 220 - 40 - (tt * 18) % 220, 1340 + (i % 2) * 30, 360, 110, (255, 212, 186), (232, 168, 158), 50 + i, rim=(255, 236, 220))
    c.drawRect(skia.Rect(0, 1380, W, 2100), P((244, 186, 166)))
    c.drawRect(skia.Rect(0, 1520, W, 2100), P((210, 150, 150)))
    c.restore()
    # after the fall, a soft ring marks the empty slot in the formation
    gap = sm((t - at('nobody')) / 0.6)
    if gap > 0:
        x0, y0, s = planes[2]
        L.chip(c, 'never counted', x0 - (t - T_S5) * 10 * s, y0 - 110 + cam_y, (255, 107, 107), size=34, a=gap)
        path = skia.Path(); path.addCircle(x0 - (t - T_S5) * 10 * s, y0 + cam_y, 70)
        c.drawPath(path, SP((255, 107, 107), 5, 220 * gap, PathEffect=skia.DashPathEffect.Make([16, 12], t * 20)))


# ================================================================ S6: the survivors on the field, one empty spot
def s6(c, t):
    u = (t - T_S6) / (T_S7 - T_S6)
    dx = -70 * ease_io(u)
    dawn_sky(c, 0.3)
    rglow(c, 900, 760, 500, (255, 236, 190), 160)
    c.drawCircle(900, 790, 56, P((255, 246, 222)))
    c.drawPath(poly([(0, 830), (300, 800), (640, 824), (1080, 790), (1080, 1000), (0, 1000)]), P((176, 128, 142)))
    c.drawRect(skia.Rect(0, 870, W, H), P((96, 98, 86)))
    c.drawRect(skia.Rect(0, 1240, W, H), P((84, 88, 74)))
    c.save(); c.translate(dx, 0)
    # a row of parked bombers receding along the field, every one with holes; one empty hardstand with a chalk outline
    slots = [(900, 900, 0.22), (700, 950, 0.30), (450, 1030, 0.42), (130, 1150, 0.58)]
    for i, (x, y, s) in enumerate(slots):
        c.drawOval(skia.Rect(x - 420 * s, y + 90 * s, x + 420 * s, y + 130 * s), P((70, 72, 62)))
        if i == 2:
            out = sm((t - T_S6 - 0.4) / 0.8)
            c.save(); c.translate(x, y + 110 * s); c.scale(s, s * 0.32)
            c.drawPath(curve([(400, -8), (300, -66), (-200, -60), (-545, -6), (-420, 34), (300, 52)]), SP((236, 232, 220), 9, 230 * out, PathEffect=skia.DashPathEffect.Make([30, 20], 0)))
            c.restore()
            L.chip(c, 'MISSING', x, y + 20, (255, 107, 107), size=36, a=out)
            continue
        bomber_side(c, x, y, s, 0, t, light=(0.6, -0.6), rim=(255, 220, 170), gear=1.0, holes=1.0, prop=0.0)
    # two crew on the line: one walks and writes on a clipboard, the other stops and points down the row (one body each)
    for k in range(2):
        w = t - T_S6
        c.save()
        if k == 0:
            ph = w * 3.4
            c.translate(330 - w * 30, 1250); c.scale(0.55, 0.55)
            c.drawOval(skia.Rect(-90, 318, 90, 342), P((40, 42, 36), 130))
            sw = math.sin(ph)
            ps, J = man(c, AIRMAN, 0, 0, face=-1, lean=5, neck=20, uarm_n=30, elbow_n=100, hand_n='grip', uarm_f=-14 * sw, elbow_f=24,
                        thigh_n=20 * sw, knee_n=-6 - 22 * max(0, -sw), thigh_f=-20 * sw, knee_f=-6 - 22 * max(0, sw), ank_n=-10 * sw, ank_f=10 * sw,
                        light=(-0.6, -0.6), rim=(255, 220, 170))
            who = AIRMAN
        else:
            c.translate(520, 1250); c.scale(0.53, 0.53)
            c.drawOval(skia.Rect(-90, 318, 90, 342), P((40, 42, 36), 130))
            ps, J = man(c, AIRMAN, 0, 0, face=-1, lean=2, neck=-4, uarm_n=80 + 4 * math.sin(t * 1.5), elbow_n=8, hand_n='point',
                        uarm_f=-4, elbow_f=20, hand_f='fist', light=(-0.6, -0.6), rim=(255, 220, 170))
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
    grass_blades(c, 1925, t, (60, 74, 50), 21, n=30, h=(60, 140), x_off=dx * 1.6)


# ================================================================ titles, captions, frame
TITLES = [
    (0.0, T_S3 - 0.05, [[('SURVIVORSHIP BIAS', L.YELLOW)], [('SHOT FULL OF HOLES', L.WHITE)]]),
    (T_S3, T_S4 - 0.05, [[('HOLES ON THE', L.WHITE)], [('WINGS, TAIL, BODY', L.YELLOW)]]),
    (T_S4, T_S5 - 0.05, [[('WHERE ARE THE', L.WHITE)], [('MISSING HOLES?', L.YELLOW)]]),
    (T_S5, T_S6 - 0.05, [[('ENGINE HITS', L.WHITE)], [('NEVER CAME HOME', L.CORAL)]]),
    (T_S6, T_S7 - 0.05, [[('THEY ONLY SAW', L.WHITE)], [('THE SURVIVORS', L.YELLOW)]]),
    (T_S7, DUR + 1, [[('ARMOR WHERE THE', L.WHITE)], [("HOLES AREN'T", L.TEAL)]]),
]
CAP = lpk.Captions(VO, fix={'AREN\'T.': "aren't.", 'survived...': 'survived.'})


def frame(t):
    s = skia.Surface(W, H); c = s.getCanvas()
    if t < T_S2: s1(c, t)
    elif t < T_S3: s2(c, t)
    elif t < T_S4: s3(c, t)
    elif t < T_S4B: s4a(c, t)
    elif t < T_S5: s4b(c, t)
    elif t < T_S6: s5(c, t)
    elif t < T_S7: s6(c, t)
    else: s7(c, t)
    for tc in (T_S2, T_S3, T_S4, T_S4B, T_S5, T_S7):
        cut_fade(c, t, tc, 0.08)
    L.fades(c)
    L.badge(c, 'AP STATISTICS')
    for (a, b, lines) in TITLES:
        L.title(c, lines, t, a, b)
    if t < T_END:
        f = skia.Font(L.BLACK, 32); ww = f.measureText('levlprep.com')
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(40, 1368, 72 + ww, 1414), 20, 20), P((5, 12, 26), 150))
        L.watermark(c)
    CAP.draw(c, t)
    if t > T_END: lpk.end_line(c, t, T_END, y=1300)
    return s


if __name__ == '__main__':
    out, st = lpk.args()
    lpk.render(frame, DUR, out, stills=st, outdir='/home/claude/plane/stills')
