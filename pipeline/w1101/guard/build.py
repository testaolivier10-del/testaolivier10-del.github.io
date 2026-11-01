"""w1101-02-guard-faint (A&P: the skeletal muscle pump and venous return). All code (skia), house flat style, knight v3 method.
Art plan:
- Scene: a gravel parade ground on a hot summer morning: pale blue sky, the sun high on the left with a glow, a cream stone
  facade with flags fluttering (scene life) in the haze, a crowd behind a rope far back swaying, heat shimmer over the gravel.
  A line of ceremonial guards in red tunics, dark trousers and tall black fur caps stands at attention facing left
  (figure.Person built from parts in code; caps, belts and buttons drawn in code). Why it fits: long still parades in heat are
  where guards famously faint.
- The hero guard sways from frame zero. On "veins" a round lens grows from his calf: a leg vein running up between two calf
  muscle bellies, one way valves (pairs of cream leaflets), blood drawn dark red with red cells. On "tighten" and every pump after
  it the muscles bulge and squeeze the vein, the cells jump up through the open valves and the valves below close behind them.
  On "frozen" the muscles go slack, the flow stops, the cells sink back onto the closed valves and pile up (pooling), the vein
  widens a little. Lens closes on "less"; a dark tunnel closes in on him; on "down" he topples forward stiffly and hits the gravel.
- Then the guard next to him: on "wiggle" his boot toes flex, on "tense" the lens returns on his calf with the pump working again;
  he stays on his feet to the end.
Motion list for the accuracy check: muscle contraction squeezes the vein, blood moves toward the heart (up), valves open in the
direction of flow and close against backflow; standing still stalls the flow and blood pools; fainting falls forward, rigid.
"""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1101/lib']
import numpy as np, skia
from lpk import *
from figure import Person
import layout as L

ID = 'w1101-02-guard-faint'
OUT = f'/home/claude/lp/w1101/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(heart=WD.at('heart'), why=WD.at('why'), he=WD.at('he'), see=WD.at('see'), veins=WD.at('veins'), every=WD.at('every'), tighten=WD.at('tighten'),
         squeeze=WD.at('squeeze'), valves=WD.at('valves'), sliding=WD.at('sliding'), so=WD.at('so'), pump=WD.at('pump'), but=WD.at('but'),
         frozen=WD.at('frozen'), stops=WD.at('stops'), blood=WD.at('blood', 3), pools=WD.at('pools'), less=WD.at('less'), brain=WD.at('brain'),
         down=WD.at('down', 2), goes=WD.at('goes'), thats=WD.at("that's"), guards=WD.at('guards'), wiggle=WD.at('wiggle'), tense=WD.at('tense'),
         it=WD.at('it'), feet=WD.at('feet'))
END = WD.end()
DUR = END + 1.6
CAP = Captions(WD.w)
R, Y, Wt, Tl = (255, 107, 107), (255, 210, 63), (255, 255, 255), (46, 230, 214)
RED_T = (196, 40, 46)
SHOT_D = T['thats'] - 0.25
FALL = T['down'] - 0.05
WIDE = [x['t0'] for x in WD.w if x['w'].lower().strip('.,') == 'keeps'][1] - 0.15
GY = 1372
HERO_X = 1080 - 230
NB_X = 1080 - 860


def guard_person(s, light=-1):
    return Person(s=s, shirt=RED_T, vest=RED_T, pants=(32, 34, 52), skin=(222, 172, 136), boots=(20, 20, 24), hair=(60, 40, 30),
                  hatted=False, light=1, rim=(255, 226, 170))


hero = guard_person(2.3)
nb = guard_person(2.2)
far = [guard_person(s) for s in (1.45, 1.15, 0.92, 0.75)]


# ------------------------------------------------------------------ the parade ground
def sky(c, t):
    lgrad(c, skia.Rect(-900, -900, 2000, 1400), 0, 1100, [(92, 150, 214), (160, 200, 230), (236, 230, 210)], [0, 0.6, 1])
    c.drawCircle(150, 560, 240, P((255, 236, 180), 110, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(150, 560, 52, P((255, 250, 228)))
    for k, (x, y, w) in enumerate([(300, 640, 220), (760, 600, 300), (1050, 700, 200)]):
        xx = (x + t * 7) % 1500 - 200
        c.drawPath(smooth_closed([(xx - w / 2, y), (xx - w / 4, y - 24), (xx + w / 6, y - 32), (xx + w / 2, y), (xx, y + 8)]), P((250, 250, 250), 170))


def facade(c, t):
    # a cream stone building in the haze, behind the parade ground
    base, sh = (226, 214, 190), (204, 190, 166)
    c.drawRect(skia.Rect(-700, 820, 1800, 1060), P(base))
    c.drawRect(skia.Rect(-700, 806, 1800, 822), P(sh))
    for k in range(-6, 20):
        x = -60 + k * 92
        c.drawRect(skia.Rect(x, 860, x + 40, 930), P((150, 160, 176)))
        c.drawRect(skia.Rect(x, 960, x + 40, 1030), P((150, 160, 176)))
        c.drawRect(skia.Rect(x + 30, 860, x + 40, 930), P((128, 138, 156)))
    # flags on poles, fluttering
    for fx in (210, 860):
        c.drawLine(fx, 806, fx, 700, SP((90, 84, 80), 5))
        for k in range(6):
            f = k / 6; f2 = (k + 1) / 6
            w1 = 9 * math.sin(t * 5 - k * 0.9) * f; w2 = 9 * math.sin(t * 5 - (k + 1) * 0.9) * f2
            col = (40, 70, 150) if k % 2 == 0 else (196, 50, 56)
            c.drawPath(poly([(fx + k * 14, 704 + w1), (fx + (k + 1) * 14, 704 + w2), (fx + (k + 1) * 14, 744 + w2), (fx + k * 14, 744 + w1)]), P(col))
    # haze over the building
    lgrad(c, skia.Rect(-700, 760, 1800, 1080), 760, 1080, [(236, 234, 226, 60), (236, 230, 214, 150)])
    # far crowd behind a rope, swaying a little
    rs = np.random.default_rng(4)
    for k in range(-20, 70):
        x = -40 + k * 25 + rs.uniform(-6, 6); h = rs.uniform(36, 52); sw = 1.5 * math.sin(t * 1.3 + k)
        col = [(70, 80, 110), (120, 70, 70), (60, 90, 80), (170, 150, 120), (90, 90, 100)][k % 5]
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + sw - 9, 1060 - h, x + sw + 9, 1066), 8, 8), P(col))
        c.drawCircle(x + sw, 1060 - h - 8, 8, P((200, 160, 130)))
    c.drawRect(skia.Rect(-700, 1056, 1800, 1066), P((230, 220, 200), 200))
    lgrad(c, skia.Rect(-700, 990, 1800, 1080), 990, 1080, [(236, 230, 214, 0), (236, 230, 214, 120)])


def ground(c, t):
    c.drawRect(skia.Rect(-700, 1066, 1800, 2900), P((214, 196, 156)))
    lgrad(c, skia.Rect(-700, 1066, 1800, 1300), 1066, 1300, [(236, 226, 200, 200), (214, 196, 156, 0)])
    rs = np.random.default_rng(8)
    for k in range(260):
        x, y = rs.uniform(-400, 1500), rs.uniform(1080, 2300); r = rs.uniform(1.5, 4) * (0.6 + (y - 1066) / 900)
        c.drawCircle(x, y, r, P((188, 168, 128) if k % 3 else (232, 216, 180)))
    # heat shimmer: soft bands drifting up over the gravel
    for k in range(5):
        y = 1180 - ((t * 30 + k * 60) % 300)
        a = 26 * math.sin(math.pi * ((t * 30 + k * 60) % 300) / 300)
        pth = skia.Path(); pth.moveTo(-50, y)
        for x in range(-50, 1180, 40): pth.lineTo(x, y + 5 * math.sin(x * 0.03 + t * 3 + k))
        c.drawPath(pth, SP((255, 250, 236), 6, a))


def cap(c, head, s, tilt=0.0):
    """the tall black fur cap with a chin strap"""
    hx, hy = head
    c.save(); c.translate(hx, hy); c.rotate(math.degrees(tilt))
    pts = [(-30 * s, -6 * s), (-34 * s, -44 * s), (-30 * s, -86 * s), (-14 * s, -106 * s), (10 * s, -108 * s), (28 * s, -90 * s),
           (32 * s, -50 * s), (26 * s, -10 * s), (4 * s, -16 * s)]
    pth = smooth_closed(pts)
    flat(c, pth, (26, 24, 30), (12, 12, 16), sh_off=(7 * s, 0), rim=(255, 210, 160), rim_d=(-2.5 * s, 0), rim_a=150)
    # fur tufts on the lit edge
    for k in range(6):
        a = -2.2 + k * 0.35
        x = -30 * s + 6 * s * math.cos(k); y = (-20 - k * 14) * s
        c.drawCircle(x, y, 5 * s, P((44, 40, 48)))
    c.drawLine(-22 * s, -4 * s, -10 * s, 26 * s, SP((200, 160, 60), 2.5 * s))
    c.restore()


def guard_pose(x, gy, s, t, ph, toe_lift=0.0):
    br = 1.6 * math.sin(t * 2.2 + ph) * s
    face = -1
    hip = (x, gy - 118 * s); neck = (x - 2 * s, gy - 196 * s + br); head = (x - 6 * s, gy - 232 * s + br)
    knN = (x - 2 * s, gy - 60 * s); ftN = (x - 6 * s, gy - 4 * s - toe_lift * 3 * s); knF = (x + 4 * s, gy - 60 * s); ftF = (x, gy - 4 * s)
    shN = (neck[0] + 2 * s, neck[1] + 12 * s); shF = (neck[0] + 6 * s, neck[1] + 12 * s)
    hdN = (x - 4 * s, gy - 108 * s + br * 0.5); hdF = (x + 6 * s, gy - 108 * s)
    elN = ik2(shN, hdN, 42 * s, 42 * s, bend=1); elF = ik2(shF, hdF, 42 * s, 42 * s, bend=1)
    return dict(head=head, neck=neck, hip=hip, shN=shN, elN=elN, hdN=hdN, shF=shF, elF=elF, hdF=hdF, knN=knN, ftN=ftN, knF=knF, ftF=ftF)


def draw_guard(c, p, x, gy, t, ph, ang=0.0, toe_lift=0.0, shadow=True):
    s = p.s
    if shadow:
        sx = 1 - min(1, abs(ang) / 1.4)
        c.drawOval(skia.Rect(x - 60 * s - 230 * s * (1 - sx), gy - 8 * s, x + 50 * s, gy + 8 * s), P((120, 100, 70), 110, MaskFilter=blur(6)))
    c.save(); c.translate(x, gy); c.rotate(-math.degrees(ang)); c.translate(-x, -gy)
    J = guard_pose(x, gy, s, t, ph, toe_lift)
    p.draw(c, J, face=-1, vest=False)
    # white belt, brass buttons
    hx, hy = J['hip']; nx, ny = J['neck']
    c.drawRect(skia.Rect(hx - 22 * s, hy - 14 * s, hx + 20 * s, hy - 6 * s), P((240, 238, 230)))
    for k in range(4):
        f = 0.2 + k * 0.18
        c.drawCircle(nx + (hx - nx) * f - 19 * s, ny + (hy - ny) * f, 2.6 * s, P((236, 196, 90)))
    # trouser stripe
    c.drawLine(J['hip'][0] - 6 * s, J['hip'][1] + 10 * s, J['knN'][0] - 6 * s, J['knN'][1], SP((180, 40, 44), 3 * s))
    cap(c, J['head'], s)
    c.restore()
    return J


def hero_angle(t):
    sway = (0.014 + 0.03 * (1 - smooth((t - 4.5) / 2))) * math.sin(t * 2.6) + 0.07 * math.exp(-((t - 2.3) / 0.22) ** 2) + 0.02 * smooth((t - T['less']) / 2.5) * math.sin(t * 3.4)
    if t < FALL: return sway
    u = (t - FALL) / 0.62
    if u < 1: return sway + (math.pi / 2 - 0.08) * u * u
    d = (t - FALL - 0.62)
    return math.pi / 2 - 0.08 + 0.05 * math.exp(-d * 9) * math.sin(d * 30)


# ------------------------------------------------------------------ the lens: vein, valves, muscle pump
VALVES = (-150, 10, 170)


def pump_flow(t):
    """F(t): how far the column of blood has moved up (px); P(t): squeeze 0..1"""
    pulses = []
    k = 0
    while True:
        tp = T['tighten'] - 0.1 + k * 1.55
        if tp > T['but'] + 0.2: break
        pulses.append(tp); k += 1
    k = 0
    while True:
        tp = T['tense'] - 0.05 + k * 1.3
        if tp > DUR: break
        pulses.append(tp); k += 1
    F = 0.0; Pq = 0.0
    for tp in pulses:
        u = (t - tp) / 0.55
        F += 230 * smooth(u)
        Pq = max(Pq, math.sin(math.pi * min(1, max(0, u))) if 0 <= u <= 1 else 0)
    vel = 0.0
    for tp in pulses:
        u = (t - tp) / 0.55
        if 0 <= u <= 1: vel = max(vel, 6 * u * (1 - u))
    return F, Pq, vel


CELLS = [(i * 37.3 % 520, (i * 13) % 5 - 2) for i in range(26)]


def lens_content(c, cx, cy, r, t, frozen):
    F, Pq, vel = pump_flow(t)
    if frozen > 0: Pq *= (1 - frozen)
    # background: calf muscle (cut surface), fibres
    c.drawCircle(cx, cy, r, P((240, 149, 127)))
    for k in range(-10, 11):
        x = cx + k * 26
        c.drawLine(x, cy - r, x + 10, cy + r, SP((201, 103, 95), 4, 120))
    # muscle bellies bulge inward with the squeeze
    vw = 92 * (1 - 0.62 * Pq) + 16 * frozen
    for sd in (-1, 1):
        x0 = cx + sd * (vw / 2 + 10)
        bel = smooth_closed([(x0, cy - r), (x0 - sd * 10 * Pq, cy - 120), (x0 - sd * 30 * Pq, cy), (x0 - sd * 10 * Pq, cy + 120), (x0, cy + r),
                             (cx + sd * (r + 20), cy + r), (cx + sd * (r + 20 - 40 * Pq), cy), (cx + sd * (r + 20), cy - r)])
        flat(c, bel, (232, 136, 114), (201, 103, 95), sh_off=(sd * 10, 0), rim=(255, 214, 170), rim_d=(-sd * 4, 0), rim_a=200)
        c.save(); c.clipPath(bel, skia.ClipOp.kIntersect, True)
        for k in range(-3, 10):
            xx = x0 + sd * (20 + k * 34)
            pth = skia.Path(); pth.moveTo(xx, cy - r - 20)
            pth.quadTo(xx - sd * (14 + 26 * Pq), cy, xx + sd * 30, cy + r + 20)
            c.drawPath(pth, SP((206, 108, 96), 5, 170))
        c.restore()
        # fascia line between the bellies and the vein
        c.drawPath(bel, SP((250, 200, 180), 3, 120))
    # the vein: a wall and the dark red blood inside
    wall = skia.Path(); wall.addRect(skia.Rect(cx - vw / 2 - 9, cy - r - 10, cx + vw / 2 + 9, cy + r + 10))
    c.drawPath(wall, P((150, 60, 78)))
    lum = skia.Rect(cx - vw / 2, cy - r - 10, cx + vw / 2, cy + r + 10)
    c.drawRect(lum, P((122, 26, 40)))
    c.drawRect(skia.Rect(cx - vw / 2, cy - r - 10, cx - vw / 2 + 10, cy + r + 10), P((150, 44, 56)))
    # red cells: carried up by F; when frozen they sink onto the valve below them and pile up
    c.save(); c.clipRect(lum)
    span = 520
    for i, (b, dx) in enumerate(CELLS):
        y_up = cy + r - ((b + F) % span) + 40
        if frozen > 0:
            # find the valve below and settle onto it
            below = [vy for vy in VALVES if cy + vy > y_up]
            stop = (cy + min(below) - 18 - (i % 3) * 16) if below else cy + r - 18 - (i % 3) * 16
            y_up = y_up + (max(y_up, stop) - y_up) * smooth(frozen)
        x = cx + dx * vw * 0.12
        w = 32; h = 14
        c.save(); c.translate(x, y_up); c.rotate(20 * math.sin(i))
        c.drawOval(skia.Rect(-w / 2, -h / 2, w / 2, h / 2), P((176, 38, 50)))
        c.drawOval(skia.Rect(-w / 4, -h / 5, w / 4, h / 5), P((140, 28, 40)))
        c.drawArc(skia.Rect(-w / 2, -h / 2, w / 2, h / 2), 200, 120, False, SP((224, 92, 96), 2))
        c.restore()
    # flow chevrons inside, only while blood moves
    if vel > 0.05:
        for k in range(5):
            y = cy + r - ((k * 110 + F * 1.0) % 560)
            c.drawPath(poly([(cx - 16, y + 10), (cx, y - 6), (cx + 16, y + 10), (cx + 16, y + 18), (cx, y + 2), (cx - 16, y + 18)]), P((255, 255, 255), 150 * min(1, vel)))
    c.restore()
    # valves: pairs of cream leaflets that open upward with the flow and close against backflow
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
    # warm rim of the lens
    c.drawCircle(cx, cy, r, SP((255, 241, 214), 8))
    return Pq


def lens(c, t, cx, cy, r, src, frozen, a=1.0):
    if r < 3: return 0
    # leader from the calf
    c.drawLine(src[0], src[1], cx + (src[0] - cx) * r / math.hypot(src[0] - cx, src[1] - cy), cy + (src[1] - cy) * r / math.hypot(src[0] - cx, src[1] - cy),
               SP((255, 241, 214), 5, 230 * a))
    c.drawCircle(src[0], src[1], 26, SP((255, 241, 214), 5, 230 * a))
    c.drawCircle(cx, cy + 10, r + 6, P((0, 0, 0), 90, MaskFilter=blur(14)))
    c.save(); pth = skia.Path(); pth.addCircle(cx, cy, r); c.clipPath(pth, skia.ClipOp.kIntersect, True)
    Pq = lens_content(c, cx, cy, r, t, frozen)
    c.restore()
    c.drawCircle(cx, cy, r, SP((255, 241, 214), 8))
    return Pq


# ------------------------------------------------------------------ the close shot: the neighbour's legs, toes and calves
def close_shot(c, t):
    if t >= WIDE:
        scene(c, t, (0.92 + 0.03 * smooth((t - WIDE) / 2), 560, 1060))
        return
    z = 1.0 + 0.05 * smooth((t - SHOT_D) / 4)
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-540, -1000)
    # the parade ground seen low and close: gravel and the far line out of focus
    lgrad(c, skia.Rect(-100, -100, 1200, 1100), 0, 1000, [(150, 196, 232), (226, 222, 206)])
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(7, 7)))
    for i, p_ in enumerate(far[:3]):
        draw_guard(c, guard_person(1.5 - i * 0.2), 980 + i * 130, 1010 - i * 20, t, i, shadow=False)
    c.restore()
    c.drawRect(skia.Rect(-100, 1000, 1200, 2000), P((214, 196, 156)))
    rs = np.random.default_rng(8)
    for k in range(160):
        x, y = rs.uniform(-60, 1140), rs.uniform(1020, 1950); r = rs.uniform(2, 6) * (0.6 + (y - 1000) / 700)
        c.drawCircle(x, y, r, P((188, 168, 128) if k % 3 else (232, 216, 180)))
    # two legs, side on, facing left: trousers, red stripe, polished boots; toes wiggle, calves tense
    wig = (0.5 + 0.5 * math.sin(t * 9)) * smooth((t - T['wiggle']) / 0.2)
    _, Pq_, _ = pump_flow(t)
    ten = Pq_
    c.save(); c.translate(1080 - 40, 0); c.scale(-1, 1)
    for k, (x, sh) in enumerate(((240, 0.82), (450, 1.0))):
        col = tuple(v * sh for v in (32, 34, 52)); csh = tuple(v * 0.7 for v in col)
        bul = 22 * ten
        leg = smooth_closed([(x - 56, 520), (x + 44, 520), (x + 46, 700), (x + 38, 800), (x + 44 + bul, 920), (x + 42 + bul * 0.6, 1040), (x + 34, 1210),
                             (x - 40, 1210), (x - 46, 1060), (x - 50, 900), (x - 46, 790), (x - 54, 700)])
        flat(c, leg, col, csh, sh_off=(12, 0), rim=(255, 226, 170), rim_d=(-4, 0), rim_a=120)
        c.drawLine(x - 30, 530, x - 26 + bul * 0.2, 1200, SP(tuple(v * sh for v in (180, 40, 44)), 8))
        # boot: heel stays planted, the toe box lifts with each wiggle
        c.drawPath(smooth_closed([(x - 50, 1200), (x + 40, 1196), (x + 46, 1270), (x - 52, 1272)]), P((16, 16, 20)))
        c.drawLine(x - 44, 790, x + 36, 800, SP(csh, 4))
        c.save(); c.translate(x - 50, 1268); c.rotate(26 * wig if k == 1 else 18 * (1 - wig) * smooth((t - T['wiggle']) / 0.2))
        toe = smooth_closed([(0, -70), (-120, -48), (-150, -10), (-140, 4), (0, 4)])
        flat(c, toe, (20, 20, 24), (8, 8, 10), sh_off=(0, 6), rim=(255, 240, 220), rim_d=(0, -3), rim_a=200)
        c.drawOval(skia.Rect(-110, -46, -60, -36), P((200, 206, 220), 140))
        c.restore()
        c.drawOval(skia.Rect(x - 210, 1262, x + 60, 1290), P((120, 100, 70), 120, MaskFilter=blur(8)))
    c.restore()
    c.restore()
    if wig != 0:
        L.chip(c, 'WIGGLE', 820, 1080, Y, 40, smooth((t - T['wiggle']) / 0.3))


# ------------------------------------------------------------------ frames
def scene(c, t, cam):
    z, cx, cy = cam
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-cx, -cy)
    c.save(); c.translate((cx - 540) * 0.6, 0)
    sky(c, t); facade(c, t)
    c.restore()
    ground(c, t)
    c.save(); c.translate(1080, 0); c.scale(-1, 1)
    # far guards in the line (behind, smaller), receding to the right of the frame
    for i, p in enumerate(far):
        x = 1080 - (900 + i * 95 - i * i * 4); gy = GY - 170 - i * 36
        draw_guard(c, p, x, gy, t, i * 0.9)
    # the neighbour and the hero
    J_nb = draw_guard(c, nb, NB_X, GY - 30, t, 1.7, toe_lift=(0.5 + 0.5 * math.sin(t * 9)) * smooth((t - T['wiggle']) / 0.3) if t > T['wiggle'] else 0.0)
    ang = hero_angle(t)
    pale = smooth((t - T['blood'] - 0.5) / 4.0)
    hero.cols['skin'] = (mix((222, 172, 136), (232, 214, 196), pale), mix((222, 172, 136), (232, 214, 196), pale) and tuple(v * 0.72 for v in mix((222, 172, 136), (232, 214, 196), pale)))
    J_h = draw_guard(c, hero, HERO_X, GY, t, 0.0, ang=ang)
    # sweat beads running down his face in the heat
    if t < FALL:
        hx, hy = J_h['head']
        c.save(); c.translate(HERO_X, GY); c.rotate(-math.degrees(ang)); c.translate(-HERO_X, -GY)
        for k in range(2):
            u = ((t * 0.5 + k * 0.5) % 1.0)
            c.drawPath(smooth_closed([(hx - 20 + k * 8, hy - 6 + 40 * u), (hx - 16 + k * 8, hy + 4 + 40 * u), (hx - 24 + k * 8, hy + 4 + 40 * u)]), P((220, 240, 255), 220 * math.sin(math.pi * u)))
        c.restore()
    if t >= FALL + 0.6:
        d = t - FALL - 0.6
        for k in range(6):
            c.drawCircle(HERO_X - 560 + k * 90, GY - 10 - 20 * d, 20 + 40 * d, P((236, 222, 190), 140 * math.exp(-d * 6.0), MaskFilter=blur(10)))
    c.restore()
    c.restore()
    mir = lambda J: {k: (1080 - v[0], v[1]) for k, v in J.items()}
    return mir(J_h), mir(J_nb)


def to_screen(p, cam):
    z, cx, cy = cam
    return (540 + (p[0] - cx) * z, 1000 + (p[1] - cy) * z)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    if t < SHOT_D:
        u0 = smooth(t / 2.5)
        pb = smooth((t - FALL + 0.4) / 0.6)
        z = (1.0 + 0.22 * u0 + 0.05 * smooth((t - T['but']) / 5)) * (1 - pb) + 0.92 * pb
        cam = (z, (560 - 200 * u0) * (1 - pb) + 560 * pb, (1000 + 60 * u0) * (1 - pb) + 1060 * pb)
    else:
        u = smooth((t - SHOT_D) / 1.2)
        cam = (1.08 + 0.1 * u, 560 + 160 * u, 1030 + 20 * u)
    d_ = t - FALL - 0.62
    if 0 < d_ < 0.5:
        c.translate(14 * math.exp(-d_ * 8) * math.sin(d_ * 60), 10 * math.exp(-d_ * 8) * math.cos(d_ * 50))
    if t >= SHOT_D:
        close_shot(c, t)
        J_h = J_nb = None
    else:
        J_h, J_nb = scene(c, t, cam)
    # tunnel vision as blood stops reaching his brain
    tv = smooth((t - T['less'] - 0.4) / 2.6) * (1 - smooth((t - FALL - 0.4) / 0.6)) if t < SHOT_D else 0.0
    if tv > 0.01:
        hc = to_screen(J_h['head'], cam)
        vg = skia.GradientShader.MakeRadial(skia.Point(*hc), 900 - 520 * tv, [C((0, 0, 0), 0), C((6, 4, 10), 235 * tv)], [0.35, 1.0])
        c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    # the lens on the hero's calf, then on the neighbour's
    if t < SHOT_D:
        r = 270 * smooth((t - T['veins'] + 0.2) / 0.6) * (1 - smooth((t - T['less'] + 0.1) / 0.5))
        src = to_screen(((J_h['knN'][0] + J_h['ftN'][0]) / 2 - 8, (J_h['knN'][1] + J_h['ftN'][1]) / 2), cam)
        frozen = smooth((t - T['frozen'] - 0.2) / 2.2)
        if r > 2:
            Pq = lens(c, t, 740, 800, r, src, frozen)
            if r > 200:
                L.chip(c, 'VALVES', 740 - 250, 800 + 120, (255, 241, 214), 44, smooth((t - T['valves']) / 0.3) * (1 - smooth((t - T['but']) / 0.3)), anchor=(740 - 50, 800 + 10))
                mv = smooth((t - T['every']) / 0.3) * (1 - smooth((t - T['but']) / 0.3))
                L.chip(c, 'WHEN YOU MOVE', 740, 800 - r + 4, Tl, 40, mv)
                L.chip(c, 'STANDING FROZEN', 740, 800 - r + 4, R, 40, smooth((t - T['but']) / 0.3))
                L.chip(c, 'TO HEART \u2191', 740 + 150, 800 - 30, (255, 241, 214), 40, smooth((t - T['heart'] + 0.2) / 0.3) * (1 - smooth((t - T['but']) / 0.3)))
                L.chip(c, 'MUSCLE PUMP', 740, 800 + r + 20, Tl, 46, smooth((t - T['pump']) / 0.3) * (1 - smooth((t - T['blood']) / 0.3)))
                L.chip(c, 'BLOOD POOLS', 740, 800 + r + 20, R, 46, smooth((t - T['pools']) / 0.3))
    elif t < WIDE:
        r = 250 * smooth((t - T['tense'] + 0.1) / 0.6)
        src = (1040 - 470, 1010)
        if r > 2:
            lens(c, t, 300, 830, r, src, 0.0)
            if r > 200:
                L.chip(c, 'PUMP ON', 300, 830 + r + 20, Tl, 46, smooth((t - T['it']) / 0.3))
    # the thud
    d = t - FALL - 0.62
    if 0 < d < 0.25:
        c.translate(0, 0)
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((20, 14, 10), 110)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    if abs(t - SHOT_D) < 0.12:
        c.drawRect(skia.Rect(0, 0, W, H), P((12, 10, 16), 230 * (1 - abs(t - SHOT_D) / 0.12)))
    L.fades(c)
    L.badge(c, 'ANATOMY & PHYSIOLOGY')
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


def titles(c, t):
    L.title(c, [[('WHY SOLDIERS', Wt)], [('FAINT', Y)]], t, -0.5, T['see'])
    L.title(c, [[('VEINS NEED', Wt)], [('A PUSH', Y)]], t, T['see'], T['every'])
    L.title(c, [[('YOUR CALVES', Wt)], [('ARE A PUMP', Tl)]], t, T['every'], T['but'])
    L.title(c, [[('STAND FROZEN', Wt)], [('PUMP STOPS', R)]], t, T['but'], T['less'])
    L.title(c, [[('LESS BLOOD', Wt)], [('TO THE BRAIN', R)]], t, T['less'], SHOT_D)
    L.title(c, [[('WIGGLE TOES', Wt)], [('TENSE CALVES', Tl)]], t, SHOT_D, None)


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
