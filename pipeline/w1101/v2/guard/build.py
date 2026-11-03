"""w1101-02-guard-faint REBUILD (Olivier 2026-11-02: story voice, premises first, every shot shows its line, one-body people).

SHOT PLAN (why each shot exists)
A  0.0  wide     Hot parade ground, a line of guards in bearskins; the hero in front sways a little. Slow push in.
B  3.4  medium   Tight on the hero: sweat runs down his face, the clock on the facade, chip "STILL FOR OVER AN HOUR".
C  7.1  x-ray    Full figure, the world dims, his body goes x-ray blue: one vein from his foot to his heart. A drop of blood
                 climbs it as it is said ("from his feet ... to his heart"); GRAVITY arrow pulls down on "gravity"; on "can't
                 push it up on their own" the drop slides back down.
D 15.4  calf     Close on his calves; a lens opens on the calf: two muscle bellies, the vein, valves. On "tighten" and with
                 every pulse the muscles squeeze, blood jumps UP through the open valves, the valves below shut on "sliding
                 back down". "Every step works like a pump": one pulse per step beat.
E 24.8  frozen   Same lens: the muscles go slack, the flow stops, cells sink onto the shut valves.
F 28.1  x-ray    Full figure again: his legs fill with pooled blood, the drop to his heart thins, his head darkens on "brain",
                 tunnel vision closes in.
G 33.8  faint    Medium wide: he topples forward stiff as a board, pivoting on his boots, and hits the gravel. The guard
                 next to him does not move.
H 35.7  neighbour Close on the neighbour's boots and calves: toes rock on "wiggle", the calf lens shows the pump running on
                 "flex" and "running"; on "keeps them on their feet" pull out wide: he stands tall beside the fallen guard.
"""
import sys, math, json
sys.path[:0] = ['/home/claude/guard2', '/home/claude/short']
import numpy as np, skia
from oldk import *
import layout as L
import person as PP, airman2 as A
from airman2 import union, inter

OUT = '/home/claude/guard2/out'
VO = json.load(open('/home/claude/guard2/vo/words.json'))
_W = [x['w'].lower().strip('.,!?:') for x in VO]


def at(w, n=1):
    w = w.lower(); k = 0
    for i, x in enumerate(_W):
        if x == w:
            k += 1
            if k == n: return VO[i]['t0']
    raise KeyError(w)


T_B = at("he's") - 0.12
T_C = at('his') - 0.12                  # "His blood has to climb"
T_D = at('when') - 0.12
T_E = at('but') - 0.1
T_F = at('blood', 3) - 0.12             # "Blood pools"
T_G = at('and', 3) - 0.1                # "and down he goes"
T_H = at("that's") - 0.12
T_WIDE = at('keeps', 2) - 0.15
END = VO[-1]['t1']
DUR = round(END + 1.6, 2)
FALL = at('down', 2) + 0.05

RED = (196, 40, 46)
Y, Wt, Tl, R = (255, 210, 63), (255, 255, 255), (46, 230, 214), (255, 107, 107)


def guard(k):
    return PP.Person(k, palette={A.OL: RED, A.OL_SH: (150, 26, 34), A.OL_HI: (220, 190, 90), A.CUFF: RED, A.BELT: (240, 238, 230),
                                 A.BELT_SH: (208, 204, 196), A.BOOT_C: (22, 22, 26), A.BOOT_SH: (12, 12, 14), A.SOLE: (10, 10, 12),
                                 A.SKIN: (222, 172, 136), A.SKIN_SH: (196, 148, 116), (150, 120, 80): (214, 172, 70)},
                     hat='bearskin', forearm=RED, trouser=(32, 34, 52), glove=(244, 242, 236), stripe=(170, 36, 40),
                     buttons=(232, 192, 90), collar=(30, 34, 64))


HERO = guard(0.46)
NB = guard(0.40)
FAR = [guard(k) for k in (0.34, 0.29, 0.25)]
HX, GY = 900, 1390
NBX, NBY = 1240, 1310
FARX = [(1520, 1250), (1740, 1205), (1930, 1170)]
ATT = dict(uarm_n=-3, elbow_n=8, hand_n='fist', uarm_f=-3, elbow_f=8, hand_f='fist')   # attention


# ------------------------------------------------------------------ the parade ground (world coordinates)
def sky(c, t):
    lgrad(c, skia.Rect(-900, -900, 2600, 1400), 0, 1100, [(92, 150, 214), (160, 200, 230), (236, 230, 210)], [0, 0.6, 1])
    c.drawCircle(150, 560, 240, P((255, 236, 180), 110, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(150, 560, 52, P((255, 250, 228)))
    for k, (x, y, w) in enumerate([(300, 640, 220), (760, 600, 300), (1250, 700, 200), (1700, 630, 260)]):
        xx = (x + t * 7) % 2200 - 300
        c.drawPath(smooth_closed([(xx - w / 2, y), (xx - w / 4, y - 24), (xx + w / 6, y - 32), (xx + w / 2, y), (xx, y + 8)]), P((250, 250, 250), 170))


def facade(c, t):
    base, sh = (226, 214, 190), (204, 190, 166)
    c.drawRect(skia.Rect(-900, 820, 2600, 1060), P(base))
    c.drawRect(skia.Rect(-900, 806, 2600, 822), P(sh))
    for k in range(-10, 30):
        x = -60 + k * 92
        c.drawRect(skia.Rect(x, 860, x + 40, 930), P((150, 160, 176)))
        c.drawRect(skia.Rect(x, 960, x + 40, 1030), P((150, 160, 176)))
        c.drawRect(skia.Rect(x + 30, 860, x + 40, 930), P((128, 138, 156)))
    # the clock on the facade (time passing)
    cx, cy = 1000, 760
    if CLOCK_OFF: cx = -5000
    c.drawRect(skia.Rect(cx - 70, cy - 70, cx + 70, 806), P(base)); c.drawRect(skia.Rect(cx - 70, cy - 76, cx + 70, cy - 64), P(sh))
    c.drawCircle(cx, cy, 46, P((250, 246, 236))); c.drawCircle(cx, cy, 46, SP((120, 110, 96), 5))
    mh = t * 40.0
    c.drawLine(cx, cy, cx + 34 * math.sin(math.radians(mh * 6)), cy - 34 * math.cos(math.radians(mh * 6)), SP((40, 36, 40), 4))
    c.drawLine(cx, cy, cx + 22 * math.sin(math.radians(mh * 0.5 + 60)), cy - 22 * math.cos(math.radians(mh * 0.5 + 60)), SP((40, 36, 40), 6))
    for fx in (210, 1560):
        c.drawLine(fx, 806, fx, 700, SP((90, 84, 80), 5))
        for k in range(6):
            f = k / 6; f2 = (k + 1) / 6
            w1 = 9 * math.sin(t * 5 - k * 0.9) * f; w2 = 9 * math.sin(t * 5 - (k + 1) * 0.9) * f2
            col = (40, 70, 150) if k % 2 == 0 else (196, 50, 56)
            c.drawPath(poly([(fx + k * 14, 704 + w1), (fx + (k + 1) * 14, 704 + w2), (fx + (k + 1) * 14, 744 + w2), (fx + k * 14, 744 + w1)]), P(col))
    lgrad(c, skia.Rect(-900, 760, 2600, 1080), 760, 1080, [(236, 234, 226, 60), (236, 230, 214, 150)])
    rs = np.random.default_rng(4)
    for k in range(-40, 110):
        x = -40 + k * 25 + rs.uniform(-6, 6); h = rs.uniform(36, 52); sw = 1.5 * math.sin(t * 1.3 + k)
        col = [(70, 80, 110), (120, 70, 70), (60, 90, 80), (170, 150, 120), (90, 90, 100)][k % 5]
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + sw - 9, 1060 - h, x + sw + 9, 1066), 8, 8), P(col))
        c.drawCircle(x + sw, 1060 - h - 8, 8, P((200, 160, 130)))
    c.drawRect(skia.Rect(-900, 1056, 2600, 1066), P((230, 220, 200), 200))


CLOCK_OFF = False


def ground(c, t):
    c.drawRect(skia.Rect(-900, 1066, 2600, 3200), P((214, 196, 156)))
    lgrad(c, skia.Rect(-900, 1066, 2600, 1300), 1066, 1300, [(236, 226, 200, 200), (214, 196, 156, 0)])
    rs = np.random.default_rng(8)
    for k in range(420):
        x, y = rs.uniform(-600, 2400), rs.uniform(1080, 2600); r = rs.uniform(1.5, 4) * (0.6 + (y - 1066) / 900)
        c.drawCircle(x, y, r, P((188, 168, 128) if k % 3 else (232, 216, 180)))
    for k in range(5):
        y = 1180 - ((t * 30 + k * 60) % 300)
        a = 26 * math.sin(math.pi * ((t * 30 + k * 60) % 300) / 300)
        pth = skia.Path(); pth.moveTo(-300, y)
        for x in range(-300, 2400, 40): pth.lineTo(x, y + 5 * math.sin(x * 0.03 + t * 3 + k))
        c.drawPath(pth, SP((255, 250, 236), 6, a))


# ------------------------------------------------------------------ people
def hero_pose(t, k=0.0):
    br = math.sin(t * 2.2)
    sway = (0.9 + 1.6 * smooth((t - T_F) / 3)) * math.sin(t * 1.7)
    return A.Pose(x=HX, ground=GY, face=-1, lean=sway * (1 if t < FALL else 0), neck=2, br=br,
                  blink=(t > T_F and int(t * 6) % 9 == 0) or (int(t * 10) % 41 == 0), **ATT)


def fall_angle(t):
    if t < FALL: return 0.0
    u = (t - FALL) / 0.62
    if u < 1: return -86 * u * u
    d = t - FALL - 0.62
    return -86 + 3 * math.exp(-d * 9) * math.sin(d * 30)


def nb_pose(t, wiggle=0.0):
    return A.Pose(x=NBX, ground=NBY, face=-1, neck=2, br=math.sin(t * 2.2 + 1.3), ank_n=wiggle, **ATT)


def wig(t):
    return (9 * (0.5 + 0.5 * math.sin(t * 8))) * smooth((t - at('wiggle')) / 0.25) if t > at('wiggle') - 0.1 else 0.0


def pale_tint(t):
    p = smooth((t - T_F) / 4.0)
    return (236, 226, 214, int(70 * p)) if p > 0.01 else None


def draw_people(c, t, hero=True):
    for (x, y), g in zip(FARX, FAR):
        g.draw(c, A.Pose(x=x, ground=y, face=-1, neck=2, br=math.sin(t * 2.2 + x), **ATT), light=(0.7, -0.6), rim=(255, 226, 170))
    NB.draw(c, nb_pose(t, wig(t)), light=(0.7, -0.6), rim=(255, 226, 170))
    if not hero: return
    ang = fall_angle(t)
    # his shadow on the gravel stretches as he falls
    sx = 1 - min(1, abs(ang) / 86)
    c.drawOval(skia.Rect(HX - 80 - 640 * (1 - sx), GY - 10, HX + 70, GY + 10), P((120, 100, 70), 110, MaskFilter=blur(6)))
    c.save(); c.translate(HX - 40, GY); c.rotate(ang); c.translate(-(HX - 40), -GY)
    HERO.draw(c, hero_pose(t), light=(0.7, -0.6), rim=(255, 226, 170), tint=pale_tint(t), shadow=False)
    c.restore()
    # sweat beads in the heat
    if t < FALL:
        hx, hy = HERO.canvas_pt(hero_pose(t), HERO.joints(hero_pose(t))['head_piv'])
        for k in range(2):
            u = ((t * 0.5 + k * 0.5) % 1.0)
            c.drawPath(smooth_closed([(hx - 16 - k * 10, hy - 70 + 40 * u), (hx - 12 - k * 10, hy - 60 + 40 * u), (hx - 20 - k * 10, hy - 60 + 40 * u)]),
                       P((220, 240, 255), 220 * math.sin(math.pi * u)))
    if t >= FALL + 0.6:
        d = t - FALL - 0.6
        for k in range(7):
            c.drawCircle(HX - 700 + k * 100, GY - 10 - 20 * d, 20 + 40 * d, P((236, 222, 190), 150 * math.exp(-d * 5.0), MaskFilter=blur(10)))


def world(c, t, cam, hero=True):
    global CLOCK_OFF
    z, cx, cy = cam
    CLOCK_OFF = z > 1.9
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-cx, -cy)
    c.save(); c.translate((cx - 900) * 0.5, 0)
    sky(c, t); facade(c, t)
    c.restore()
    ground(c, t)
    draw_people(c, t, hero)
    c.restore()


def rglow(c, x, y, r, col, a=255):
    sh = skia.GradientShader.MakeRadial(skia.Point(x, y), r, [C(col, a), C(col, 0)], [0, 1])
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Shader=sh))


def scr(p, cam):
    z, cx, cy = cam
    return (540 + (p[0] - cx) * z, 1000 + (p[1] - cy) * z)


# ------------------------------------------------------------------ x-ray: the vein from foot to heart
def vein_pts(J):
    """near leg vein from the ankle up the calf, behind the knee, up the thigh, to the heart (pose space)"""
    an, _ = J['boot_n']; kn, _ = J['shin_n']; hp = J['hip']
    sf = Airframe(J, 'shin_n'); tf = Airframe(J, 'thigh_n')
    return [(an[0] - 10, an[1] - 10), sf(-20, 130), sf(-24, 40), (kn[0] - 10, kn[1]), tf(-10, 160), tf(10, 40), J['torso_f'](10, 60),
            J['torso_f'](24, 170), J['torso_f'](34, 250)]


def Airframe(J, key):
    o, d = J[key]
    return HERO.frame(o, d)


def polyline_at(pts, u):
    d = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
    L_ = sum(d) * max(0, min(1, u)); acc = 0
    for i, di in enumerate(d):
        if acc + di >= L_:
            f = (L_ - acc) / di
            return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f)
        acc += di
    return pts[-1]


def xray(c, t, cam, pooled=0.0):
    """dim the world, show the hero as x-ray blue with the vein path; returns screen points of key places"""
    c.drawRect(skia.Rect(0, 0, W, H), P((8, 14, 30), 165))
    ps = hero_pose(t); J = HERO.joints(ps)
    z, cx, cy = cam
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-cx, -cy)
    HERO.draw(c, ps, light=(0.7, -0.6), rim=(255, 226, 170), shadow=False)
    c.translate(ps.x, ps.ground); c.scale(ps.s * HERO.k * ps.face, ps.s * HERO.k)
    S = HERO._silhouette(J, ps)
    c.drawPath(S, P((20, 60, 110), 170))
    c.drawPath(S, SP((120, 200, 255), 5, 200))
    # bones faintly, so it reads as an x-ray
    for key, Lb in (('thigh_n', 290), ('shin_n', 250), ('thigh_f', 290), ('shin_f', 250)):
        f = Airframe(J, key); c.drawLine(*f(0, 20), *f(0, Lb - 20), SP((170, 210, 240), 16, 70))
    c.drawLine(*J['torso_f'](0, 30), *J['torso_f'](0, 360), SP((170, 210, 240), 12, 60))
    # pooled blood fills the legs from the boots up
    if pooled > 0.01:
        legs = union([HERO._leg_path(J, 'n'), HERO._leg_path(J, 'f')])
        lvl = J['hip'][1] + (1 - pooled * 0.75) * (0 - J['hip'][1]) * 1.0
        rect = skia.Path(); rect.addRect(skia.Rect(-600, J['hip'][1] * pooled * 0.8, 600, 200))
        c.drawPath(inter(legs, rect), P((150, 20, 34), 210))
    vp = vein_pts(J)
    vpath = skia.Path(); vpath.moveTo(*vp[0])
    for p in vp[1:]: vpath.lineTo(*p)
    c.drawPath(vpath, SP((90, 20, 40), 22, 230))
    c.drawPath(vpath, SP((190, 40, 60), 12, 240))
    # the heart
    hc = J['torso_f'](34, 262)
    beat = 1 + 0.12 * max(0, math.sin(t * 7.5)) ** 8
    c.save(); c.translate(*hc); c.scale(beat, beat)
    c.drawPath(smooth_closed([(0, 26), (-30, -2), (-26, -24), (-8, -26), (0, -12), (8, -26), (26, -24), (30, -2)]), P((220, 50, 66)))
    c.restore()
    c.restore()
    toS = lambda p: scr(HERO.canvas_pt(ps, p), cam)
    return [toS(p) for p in vp], toS(hc), toS(J['head_piv']), ps, J


def shot_C(c, t):
    cam = (1.25, HX - 60, 1126)
    world(c, t, cam)
    vp, heart, head, ps, J = xray(c, t, cam)
    # the drop climbs from his foot to his heart as it is said, then can't hold and slides back down
    u = smooth((t - at('climb')) / (at('heart') + 0.3 - at('climb'))) * 0.93
    back = smooth((t - at("can't")) / 1.1)
    u = u - 0.38 * back
    if t > at('climb') - 0.2:
        for k in range(10):
            uu = u - k * 0.012
            if uu < 0: break
            px, py = polyline_at(vp, uu)
            c.drawCircle(px, py, 15 - k, P((255, 70, 80), 255 - k * 22))
        px, py = polyline_at(vp, max(0, u))
        rglow(c, px, py, 70, (255, 90, 90), 120)
    L.chip(c, 'FEET', vp[0][0] - 190, vp[0][1] - 60, (255, 241, 214), 34, smooth((t - at('feet')) / 0.3), anchor=vp[0])
    L.chip(c, 'HEART', heart[0] - 230, heart[1] - 10, (255, 241, 214), 34, smooth((t - at('heart')) / 0.3), anchor=heart)
    g = smooth((t - at('gravity') + 0.1) / 0.35)
    if g > 0:
        ax = vp[2][0] + 200; ay0 = vp[6][1]; ay1 = vp[0][1] - 40
        c.drawLine(ax, ay0, ax, ay0 + (ay1 - ay0) * g, SP(Y, 16, 255 * g))
        c.drawPath(poly([(ax - 34, ay0 + (ay1 - ay0) * g - 10), (ax + 34, ay0 + (ay1 - ay0) * g - 10), (ax, ay0 + (ay1 - ay0) * g + 40)]), P(Y, 255 * g))
        L.chip(c, 'GRAVITY', ax, ay0 - 50, Y, 38, g)
    L.chip(c, 'VEINS CAN\'T PUSH IT UP', vp[3][0] - 250, vp[3][1] - 20, R, 34, smooth((t - at("can't")) / 0.3), anchor=vp[3])


def shot_F(c, t):
    cam = (1.25, HX - 60, 1126)
    world(c, t, cam)
    pooled = smooth((t - at('pools') + 0.3) / 1.4)
    vp, heart, head, ps, J = xray(c, t, cam, pooled)
    # a thin trickle to the heart: fewer drops, slower
    for k in range(3):
        uu = 0.35 + ((t * 0.08 + k * 0.33) % 1.0) * 0.6
        px, py = polyline_at(vp, uu)
        c.drawCircle(px, py, 9, P((255, 70, 80), 160 * (1 - smooth((t - at('heart', 2)) / 1.0) * 0.6)))
    L.chip(c, 'BLOOD POOLS', vp[1][0] - 230, vp[1][1], R, 38, smooth((t - at('pools')) / 0.3), anchor=vp[1])
    L.chip(c, 'LESS TO HEART', heart[0] - 250, heart[1] + 10, R, 34, smooth((t - at('heart', 2)) / 0.3), anchor=heart)
    b = smooth((t - at('brain')) / 0.3)
    hx, hy = head[0], head[1] - 60
    L.chip(c, 'LESS TO BRAIN', hx - 260, hy - 40, R, 34, b, anchor=(hx, hy))
    tv = smooth((t - at('brain') + 0.2) / 1.0)
    if tv > 0.01:
        vg = skia.GradientShader.MakeRadial(skia.Point(hx, hy), 900 - 560 * tv, [C((0, 0, 0), 0), C((4, 4, 8), 240 * tv)], [0.3, 1.0])
        c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))


# ------------------------------------------------------------------ the calf lens: vein, valves, muscle pump
VALVES = (-150, 10, 170)
CELLS = [(i * 37.3 % 520, (i * 13) % 5 - 2) for i in range(26)]


def pulses(t):
    ps_ = []
    k = 0
    while at('tighten') - 0.1 + k * 1.5 < T_E - 0.3:
        ps_.append(at('tighten') - 0.1 + k * 1.5); k += 1
    k = 0
    while at('flex') - 0.05 + k * 1.3 < DUR:
        ps_.append(at('flex') - 0.05 + k * 1.3); k += 1
    return ps_


PULSES = None


def pump(t):
    global PULSES
    if PULSES is None: PULSES = pulses(0)
    F = 0.0; Pq = 0.0; vel = 0.0
    for tp in PULSES:
        u = (t - tp) / 0.55
        F += 230 * smooth(u)
        if 0 <= u <= 1:
            Pq = max(Pq, math.sin(math.pi * u)); vel = max(vel, 6 * u * (1 - u))
    return F, Pq, vel


def lens_content(c, cx, cy, r, t, frozen):
    F, Pq, vel = pump(t)
    if frozen > 0: Pq *= (1 - frozen); vel *= (1 - frozen)
    c.drawCircle(cx, cy, r, P((240, 149, 127)))
    for k in range(-14, 15):
        x = cx + k * 26
        c.drawLine(x, cy - r, x + 10, cy + r, SP((201, 103, 95), 4, 120))
    vw = 92 * (1 - 0.62 * Pq) + 16 * frozen
    for sd in (-1, 1):
        x0 = cx + sd * (vw / 2 + 10)
        bel = smooth_closed([(x0, cy - r), (x0 - sd * 10 * Pq, cy - 120), (x0 - sd * 30 * Pq, cy), (x0 - sd * 10 * Pq, cy + 120), (x0, cy + r),
                             (cx + sd * (r + 20), cy + r), (cx + sd * (r + 20 - 40 * Pq), cy), (cx + sd * (r + 20), cy - r)])
        flat(c, bel, (232, 136, 114), (201, 103, 95), sh_off=(sd * 10, 0), rim=(255, 214, 170), rim_d=(-sd * 4, 0), rim_a=200)
        c.save(); c.clipPath(bel, skia.ClipOp.kIntersect, True)
        for k in range(-3, 12):
            xx = x0 + sd * (20 + k * 34)
            pth = skia.Path(); pth.moveTo(xx, cy - r - 20)
            pth.quadTo(xx - sd * (14 + 26 * Pq), cy, xx + sd * 30, cy + r + 20)
            c.drawPath(pth, SP((206, 108, 96), 5, 170))
        c.restore()
        c.drawPath(bel, SP((250, 200, 180), 3, 120))
    c.drawRect(skia.Rect(cx - vw / 2 - 9, cy - r - 10, cx + vw / 2 + 9, cy + r + 10), P((150, 60, 78)))
    lum = skia.Rect(cx - vw / 2, cy - r - 10, cx + vw / 2, cy + r + 10)
    c.drawRect(lum, P((122, 26, 40)))
    c.save(); c.clipRect(lum)
    span = 2 * r + 60
    for i, (b, dx) in enumerate(CELLS):
        y_up = cy + r - ((b + F) % span) + 40
        if frozen > 0:
            below = [vy for vy in VALVES if cy + vy > y_up]
            stop = (cy + min(below) - 18 - (i % 3) * 16) if below else cy + r - 18 - (i % 3) * 16
            y_up = y_up + (max(y_up, stop) - y_up) * smooth(frozen)
        x = cx + dx * vw * 0.12
        c.save(); c.translate(x, y_up); c.rotate(20 * math.sin(i))
        c.drawOval(skia.Rect(-16, -7, 16, 7), P((176, 38, 50)))
        c.drawOval(skia.Rect(-8, -3, 8, 3), P((140, 28, 40)))
        c.restore()
    if vel > 0.05:
        for k in range(5):
            y = cy + r - ((k * 110 + F) % 560)
            c.drawPath(poly([(cx - 16, y + 10), (cx, y - 6), (cx + 16, y + 10), (cx + 16, y + 18), (cx, y + 2), (cx - 16, y + 18)]), P((255, 255, 255), 150 * min(1, vel)))
    c.restore()
    opn = min(1.0, vel * 1.4)
    for vy in VALVES:
        y = cy + vy
        for sd in (-1, 1):
            xw = cx + sd * vw / 2
            tip_x = cx + sd * (2 + (vw / 2 - 6) * opn)
            tip_y = y - 30 - 20 * opn
            leaf = smooth_closed([(xw, y + 22), (xw, y - 10), (tip_x, tip_y), (tip_x + sd * 9, tip_y + 14), (xw - sd * 4, y + 26)])
            c.drawPath(leaf, P((255, 241, 214)))
            c.drawPath(leaf, SP((220, 200, 170), 2))
    return Pq


def lens(c, t, cx, cy, r, src, frozen):
    if r < 3: return 0
    d = math.hypot(src[0] - cx, src[1] - cy)
    c.drawLine(src[0], src[1], cx + (src[0] - cx) * r / d, cy + (src[1] - cy) * r / d, SP((255, 241, 214), 5))
    c.drawCircle(src[0], src[1], 30, SP((255, 241, 214), 5))
    c.drawCircle(cx, cy + 10, r + 6, P((0, 0, 0), 90, MaskFilter=blur(14)))
    c.save(); pth = skia.Path(); pth.addCircle(cx, cy, r); c.clipPath(pth, skia.ClipOp.kIntersect, True)
    Pq = lens_content(c, cx, cy, r, t, frozen)
    c.restore()
    c.drawCircle(cx, cy, r, SP((255, 241, 214), 8))
    return Pq


def calf_pt(who, ps):
    J = who.joints(ps); f = who.frame(*J['shin_n'])
    return who.canvas_pt(ps, f(-30, 90))


def shot_DE(c, t):
    u = smooth((t - T_D) / 2.0)
    cam = (2.0 + 0.15 * u, HX - 40, GY - 330)
    world(c, t, cam)
    src = scr(calf_pt(HERO, hero_pose(t)), cam)
    r = 330 * smooth((t - T_D - 0.1) / 0.6)
    frozen = smooth((t - at('frozen') - 0.1) / 1.6)
    lx, ly = 400, 880
    Pq = lens(c, t, lx, ly, r, src, frozen)
    if r > 250:
        L.chip(c, 'CALF MUSCLE', lx - 160, ly - 230, (255, 241, 214), 32, smooth((t - at('calf') - 0.1) / 0.3) * (1 - smooth((t - at('veins', 2)) / 0.3)), anchor=(lx - 110, ly - 120))
        L.chip(c, 'VEIN', lx + 170, ly - 230, (255, 241, 214), 32, smooth((t - at('veins', 2)) / 0.3) * (1 - smooth((t - at('valves')) / 0.3)), anchor=(lx + 10, ly - 120))
        L.chip(c, 'VALVES', lx + 200, ly + 40, (255, 241, 214), 34, smooth((t - at('valves')) / 0.3) * (1 - smooth((t - T_E) / 0.3)), anchor=(lx + 20, ly + 10))
        L.chip(c, 'BLOOD UP ↑', lx, ly - r - 30, Tl, 36, smooth((t - at('squeeze')) / 0.3) * (1 - smooth((t - at('every')) / 0.3)))
        L.chip(c, 'EVERY STEP = A PUMP', lx, ly - r - 30, Tl, 36, smooth((t - at('every')) / 0.3) * (1 - smooth((t - T_E) / 0.3)))
        L.chip(c, 'STANDING FROZEN', lx, ly - r - 30, R, 36, smooth((t - T_E - 0.05) / 0.3))
        L.chip(c, 'PUMP STOPPED', lx, ly + r + 36, R, 38, smooth((t - at('stopped') + 0.1) / 0.3))


def shot_G(c, t):
    u = smooth((t - T_G) / 1.2)
    cam = (1.05 - 0.15 * u, 760 - 80 * u, 1100 + 30 * u)
    d_ = t - FALL - 0.62
    if 0 < d_ < 0.5:
        c.translate(14 * math.exp(-d_ * 8) * math.sin(d_ * 60), 10 * math.exp(-d_ * 8) * math.cos(d_ * 50))
    world(c, t, cam)


def shot_H(c, t):
    if t >= T_WIDE:
        u = smooth((t - T_WIDE) / 1.6)
        world(c, t, (2.2 - 1.38 * u, NBX - 60 - 480 * u, NBY - 130 - 70 * u))
        return
    u = smooth((t - T_H) / 3.0)
    cam = (2.1 + 0.1 * u, NBX - 60, NBY - 130)
    world(c, t, cam)
    src = scr(calf_pt(NB, nb_pose(t, wig(t))), cam)
    r = 300 * smooth((t - at('flex') + 0.1) / 0.6)
    lx, ly = 380, 800
    lens(c, t, lx, ly, r, src, 0.0)
    boot = scr(NB.canvas_pt(nb_pose(t), NB.joints(nb_pose(t))['boot_n'][0]), cam)
    L.chip(c, 'WIGGLE TOES', boot[0] - 280, boot[1] - 40, Y, 36, smooth((t - at('wiggle')) / 0.3) * (1 - smooth((t - at('flex')) / 0.3)), anchor=(boot[0] - 60, boot[1] + 40))
    if r > 250:
        L.chip(c, 'PUMP RUNNING', lx, ly + r + 36, Tl, 38, smooth((t - at('running') + 0.2) / 0.3))


def shot_A(c, t):
    u = smooth(t / T_B)
    world(c, t, (0.62 + 0.18 * u, 1150 - 160 * u, 1000 + 40 * u))


def shot_B(c, t):
    u = smooth((t - T_B) / (T_C - T_B))
    world(c, t, (1.55 + 0.12 * u, HX - 50, GY - 620))
    L.chip(c, 'STILL FOR OVER AN HOUR', 540, 1300, Y, 38, smooth((t - at('hour') + 0.3) / 0.3))


def titles(c, t):
    L.title(c, [[('WHY SOLDIERS', Wt)], [('FAINT', Y)]], t, -0.5, T_C - 0.05)
    L.title(c, [[('BLOOD HAS TO CLIMB', Wt)], [('AGAINST GRAVITY', Y)]], t, T_C, T_D - 0.05)
    L.title(c, [[('HIS CALVES', Wt)], [('ARE A PUMP', Tl)]], t, T_D, T_E - 0.05)
    L.title(c, [[('STANDING FROZEN', Wt)], [('PUMP STOPS', R)]], t, T_E, T_F - 0.05)
    L.title(c, [[('BLOOD POOLS', Wt)], [('IN HIS LEGS', R)]], t, T_F, at('less') - 0.05)
    L.title(c, [[('LESS BLOOD', Wt)], [('TO THE BRAIN', R)]], t, at('less'), T_H - 0.05)
    L.title(c, [[('WIGGLE TOES', Wt)], [('FLEX CALVES', Tl)]], t, T_H, None)


CAP = Captions(VO, fix={'brain...': 'brain,'})


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    c.save()
    if t < T_B: shot_A(c, t)
    elif t < T_C: shot_B(c, t)
    elif t < T_D: shot_C(c, t)
    elif t < T_F: shot_DE(c, t)
    elif t < T_G: shot_F(c, t)
    elif t < T_H: shot_G(c, t)
    else: shot_H(c, t)
    c.restore()
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((20, 14, 10), 110)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    for tc in (T_B, T_C, T_D, T_F, T_G, T_H, T_WIDE):
        if abs(t - tc) < 0.08: c.drawRect(skia.Rect(0, 0, W, H), P((10, 8, 14), 150 * (1 - abs(t - tc) / 0.08) ** 1.6))
    L.fades(c)
    L.badge(c, 'ANATOMY & PHYSIOLOGY')
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import oldk
    render(frame, DUR, out, st, OUT, start=oldk.START)
