"""w1108-02-heat-stroke (NREMT, EMT traps #3, the body under extremes). Premium standard, all code (skia); every
person is one skinned body (pipeline/people person.py; cast.py dresses the runner and the medics).

Art plan and motion list (for the accuracy check):
- A (hook, 0 to "So"): a hot city marathon at noon: sand coloured buildings in haze, crowd barriers, a far
  spectator crowd, the inflatable FINISH arch up the street (100 m away). Frame zero: the runner is already
  staggering (slow weaving steps, feet planted on the asphalt, heat shimmer). On "dropped" his knees buckle, he
  sinks into a crouch and falls back onto the road (the body rotates about the hips at ground level, legs
  straightening). On "confused" the camera pushes in; two medics run in (feet planted walk cycle) and kneel; one
  medic's hand rests on his shoulder (the arm is solved each frame so the hand stays on the shoulder), the runner's
  eyes blink and his head rolls. On "burning hot" the second medic's hand touches his forehead; a heat flush and
  shimmer rise off his skin.
- B ("So does the medical team..." to "A rectal"): the same street wider: an ambulance at the curb on the left with
  its rear doors open, the white medical tent on the right. The medics lift him on a stretcher (their hands hold
  the handles; the stretcher is drawn from their hand points, so it moves only because they lift it). On
  "hospital" the ambulance's lights pulse; on "NOT yet" they walk the stretcher right, into the tent.
- C ("A rectal" to "So they cool"): inside the tent: he lies on a cot; a medic holds a monitor whose screen reads
  107.1 F and RECTAL (the probe cable runs down behind the cot). Camera pushes to the screen. On "every minute" a
  timer ticks. On "brain" a round lens opens from his head (he stays in a corner inset): a body outline with the
  brain and the organs (heart, liver, kidneys) warming from orange to red; on "damage" they pulse.
- D ("So they cool" to "Within"): a blue stock tank of ice water in the tent. Two medics hold a sheet under him
  and lower him in (the sheet hangs between their hands; he rests on it; their hands lower it). The water rises
  to his NECK; his head stays out, supported by the sheet under his armpits that the head end medic holds.
  Ripples and ice cubes move with the water.
- E ("Within" to "Once"): closer on the tub: the foot end medic stirs the water with his hand (circles, swirl
  lines), the head end medic keeps the sheet. The monitor readout counts down 107 toward 103 and a timer runs to
  15 minutes. On "make sense" he opens his eyes and nods.
- F ("Once" to "COOL"): the readout reaches 102 F on "a hundred and two" and cooling stops; outside, he lies on
  the wheeled stretcher in a blanket and the medics roll it into the ambulance (hands on the stretcher; it moves
  only while pushed).
- G (payoff): the street wide again: the tent with the tub, the ambulance pulling away with its lights flashing;
  titles COOL FIRST / THEN TRANSPORT; the end line.
Sources: NAEMSP 2022 consensus statement on prehospital care of exertional heat stroke ("cool first, transport
second", cold water immersion neck down, cool to about 102 F / 39 C); NATA position statement; Korey Stringer
Institute (CWI about 1 F every 3 minutes; head supported out of the water with a towel under the armpits; rectal
temperature the valid reading); diagnosis: core temperature above about 105 F (40.5 C) with altered mental status.
long_reason: the cooling has to be seen working (tub, readout falling, him coming round) before transport, which
needs about 37 s."""
import sys, math
sys.path[:0] = ['/home/claude/w1108/02']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, ease_io, Wt, Y, R, TL, W, H, OR
import airman2 as A2
import cast as CA

OUT = '/home/claude/w1108/out/w1108-02-heat-stroke'
WD = kit.Words(f'{OUT}/words.json')
at, end_of = WD.at, WD.end_of
T_DROP = at('dropped'); T_FIN = at('finish'); T_CONF = at("he's"); T_BURN = at('burning'); T_SO = at('so')
T_HOSP = at('hospital'); T_NOT = at('not'); T_RECT = at('a', 2); T_THERM = at('thermometer'); T_107 = at('seven')
T_EVERY = at('every'); T_BRAIN = at('brain'); T_DMG = at('damage'); T_COOL = at('so', 2); T_HERE = at('here')
T_TUB = at('tub'); T_NECK = at('neck'); T_WITHIN = at('within'); T_15 = at('fifteen'); T_DROPF = at('dropping')
T_SENSE = at('make'); T_ONCE = at('once'); T_102 = at('two'); T_GOES = at('goes'); T_COOL2 = at('cool', 2)
T_TRANS = at('transport')
T_END = WD.end() + 0.45
DUR = round(T_END + 1.7, 2)
T_B = T_SO - 0.15
T_C = T_RECT - 0.2
T_D = T_COOL - 0.15
T_E = T_WITHIN - 0.2
T_F = T_GOES - 0.1
T_G = T_COOL2 - 0.2
MINT = (63, 194, 169)

TITLES = [
    (-0.5, [[('HEAT STROKE', OR)], [('AT THE FINISH', Wt)]]),
    (T_CONF - 0.1, [[('CONFUSED', Y), (' AND', Wt)], [('BURNING HOT', OR)]]),
    (T_B, [[('RUSH TO THE', Wt)], [('HOSPITAL?', Y)]]),
    (T_NOT - 0.05, [[('NOT YET', R)]]),
    (T_C, [[('107', OR), ('°F', Wt)], [('RECTAL', Y)]]),
    (T_BRAIN - 0.15, [[('BRAIN AND', Wt)], [('ORGANS', OR), (' DAMAGED', Wt)]]),
    (T_D, [[('COOL HIM', TL)], [('FIRST', Wt)]]),
    (T_TUB - 0.1, [[('ICE WATER', TL)], [('UP TO THE NECK', Wt)]]),
    (T_E, [[('STIRRED', Wt), (' ICE WATER', TL)]]),
    (T_DROPF - 0.3, [[('15 MINUTES', Y)], [('LATER', Wt)]]),
    (T_SENSE - 0.15, [[('COMING', Wt), (' ROUND', TL)]]),
    (T_ONCE - 0.1, [[('DOWN TO', Wt)], [('102', TL), ('°F', Wt)]]),
    (T_F + 0.3, [[('THEN THE', Wt)], [('HOSPITAL', Y)]]),
    (T_G, [[('COOL FIRST', TL)], [('THEN TRANSPORT', Wt)]]),
]

# ------------------------------------------------------------------ palette (hot city noon)
SKY0, SKY1 = (238, 214, 168), (170, 200, 222)
BLD = [(214, 176, 132), (196, 152, 112), (226, 192, 150), (184, 140, 104)]
ASPH, ASPH_SH = (118, 110, 108), (96, 90, 90)
TENT, TENT_SH = (240, 238, 232), (206, 206, 204)
WATER, WATER_D = (120, 196, 222), (70, 150, 190)

RUN_S = CA.runner(0.36); RUN_M = CA.runner(0.26); RUN_L = CA.runner(0.5)
MED1_S = CA.medic(0.36); MED2_S = CA.medic(0.36, (222, 176, 140), (196, 150, 118), (120, 80, 50))
MED1_M = CA.medic(0.26); MED2_M = CA.medic(0.26, (222, 176, 140), (196, 150, 118), (120, 80, 50))
MED1_L = CA.medic(0.5); MED2_L = CA.medic(0.5, (222, 176, 140), (196, 150, 118), (120, 80, 50))


def noise(t, seed, f=1.0):
    return (math.sin(t * 1.7 * f + seed) + 0.6 * math.sin(t * 2.9 * f + seed * 1.3) + 0.3 * math.sin(t * 5.1 * f + seed * 0.7)) / 1.9


# ------------------------------------------------------------------ people helpers
_ARM = {}


def arm_to(who, kw, side, target, ground, key=None):
    """solve shoulder and elbow so the wrist of `side` reaches target (canvas coords for x=0); cached on a 4 px grid"""
    k = (id(who), side, round(target[0] / 4), round(target[1] / 4), key or tuple(sorted((a, b) for a, b in kw.items() if not isinstance(b, str))), ground)
    if k in _ARM: return _ARM[k]
    best = None
    for ua in range(-30, 181, 5):
        for el in range(0, 151, 5):
            kk = dict(kw); kk['uarm_' + side] = ua; kk['elbow_' + side] = el
            ps = A2.Pose(x=0, ground=ground, **kk); J = who.joints(ps)
            hx, hy = who.canvas_pt(ps, J['hand_' + side][0])
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if best is None or d < best[0]: best = (d, ua, el)
    _ARM[k] = (best[1], best[2]); return _ARM[k]


def hand_at(who, kw, side, x, ground):
    ps = A2.Pose(x=0, ground=ground, **kw); J = who.joints(ps)
    hx, hy = who.canvas_pt(ps, J['hand_' + side][0])
    return x + hx * (1 if kw.get('face', 1) == 1 else 1), hy


def gait(d, stride=52.0, amp=18):
    """foot planted walk: phase from distance travelled (the planted foot moves back at exactly the travel speed)"""
    ph = d / stride * math.pi; s = math.sin(ph)
    return dict(thigh_n=amp * s, knee_n=-8 - 30 * max(0.0, -math.cos(ph)) * (s < 0),
                thigh_f=-amp * s, knee_f=-8 - 30 * max(0.0, math.cos(ph)) * (s > 0),
                uarm_n=-14 * s, elbow_n=26, uarm_f=14 * s, elbow_f=26)


def draw_rot(c, who, ps, rot=0.0, pivot=None, **kw):
    if rot:
        c.save(); c.translate(*pivot); c.rotate(rot); c.translate(-pivot[0], -pivot[1])
        J = who.draw(c, ps, shadow=False, **kw); c.restore(); return J
    return who.draw(c, ps, **kw)


# ------------------------------------------------------------------ the street (hot city marathon at noon)
VP = (900, 790)


def sky(c, t, top=-400, bot=900):
    lgrad(c, skia.Rect(-600, top, 1700, bot), top, bot, [(150, 188, 214), SKY1, SKY0])
    # sun glare (upper right, under the fade, away from the titles)
    g = 0.85 + 0.15 * math.sin(t * 1.3)
    c.drawCircle(980, 600, 260, P((255, 240, 200), 70 * g, MaskFilter=blur(90)))
    c.drawCircle(980, 600, 70, P((255, 250, 228), 200, MaskFilter=blur(18)))


def skyline(c, t):
    for k, (y0, col, seed) in enumerate([(600, mix(BLD[3], SKY0, 0.72), 3), (660, mix(BLD[1], SKY0, 0.55), 7)]):
        x = -500; pts = [(-500, 1000)]
        rng = np.random.default_rng(seed)
        while x < 1700:
            w = rng.uniform(70, 150); h = rng.uniform(40, 200) * (1 - 0.3 * k)
            pts += [(x, y0 - h), (x + w, y0 - h)]; x += w + rng.uniform(0, 20)
        pts += [(1700, 1000)]
        c.drawPath(kit.poly(pts), P(col))


def facades(c, t):
    """the far side of the street: sand coloured buildings receding toward VP, windows, awnings, race flags"""
    rng = np.random.default_rng(11)
    x = -500
    while x < 1500:
        w = rng.uniform(170, 260); h = rng.uniform(260, 420)
        # depth: buildings shrink toward the vanishing point
        k = max(0.25, 1 - max(0, x - 200) / 1100)
        base = 900 - 110 * (1 - k)
        col = BLD[int(rng.integers(0, 4))]
        col = mix(col, SKY0, 0.25 + 0.45 * (1 - k))
        top = base - h * k
        c.drawRect(skia.Rect(x, top, x + w * k, base), P(col))
        c.drawRect(skia.Rect(x + w * k * 0.82, top, x + w * k, base), P(mix(col, (90, 70, 60), 0.18)))
        c.drawRect(skia.Rect(x - 4, top - 10 * k, x + w * k + 4, top), P(mix(col, (255, 240, 220), 0.2)))
        for r in range(int(h / 70)):
            for q in range(3):
                wx = x + (24 + q * 62) * k; wy = top + (30 + r * 70) * k
                if wy + 40 * k > base - 70 * k: continue
                c.drawRect(skia.Rect(wx, wy, wx + 34 * k, wy + 40 * k), P(mix((70, 90, 110), SKY0, 0.3 + 0.4 * (1 - k))))
                c.drawRect(skia.Rect(wx, wy, wx + 34 * k, wy + 8 * k), P(mix((240, 220, 190), SKY0, 0.4), 120))
        # awning over the ground floor
        aw = mix((60, 150, 140) if rng.random() < 0.5 else (200, 90, 70), SKY0, 0.2 + 0.4 * (1 - k))
        c.drawPath(kit.poly([(x + 6 * k, base - 80 * k), (x + w * k - 6 * k, base - 80 * k), (x + w * k + 4 * k, base - 52 * k), (x - 4 * k, base - 52 * k)]), P(aw))
        x += w * k + 6
    # race flags on a line across the street, swaying in the hot breeze
    for i in range(12):
        fx = -60 + i * 110; fy = 520 + 0.0006 * (fx - 500) ** 2 * 0.4
        sw = 6 * math.sin(t * 2.2 + i * 0.9)
        col = [(63, 194, 169), (255, 210, 63), (226, 92, 52)][i % 3]
        c.drawPath(kit.poly([(fx - 20, fy), (fx + 20, fy), (fx + sw * 0.6, fy + 46)]), P(col, 230))
    c.drawPath(_flagline(), SP((90, 80, 70), 2.5))


def _flagline():
    p = skia.Path(); p.moveTo(-100, 520)
    for x in range(-100, 1301, 40): p.lineTo(x, 520 + 0.0006 * (x - 500) ** 2 * 0.4)
    return p


def arch(c, t, x=860, y=905, s=1.0):
    """the inflatable FINISH arch far up the street"""
    c.save(); c.translate(x, y); c.scale(s, s)
    sway = 1.5 * math.sin(t * 1.6)
    for side in (-1, 1):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(side * 110 - 18 + sway * 0.3, -170, side * 110 + 18 + sway * 0.3, 0), 16, 16), P(mix((226, 92, 52), SKY0, 0.35)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-128 + sway, -206, 128 + sway, -150), 26, 26), P(mix((226, 92, 52), SKY0, 0.35)))
    f = skia.Font(kit.L.BLACK, 38); w = f.measureText('FINISH')
    c.drawString('FINISH', -w / 2 + sway, -164, f, P(mix((255, 255, 255), SKY0, 0.2)))
    c.restore()


def crowd(c, t, y=900, x0=-200, x1=1300, k=1.0, seed=5, a=255):
    """far spectators behind the barriers: heads and shoulders, shifting and fanning themselves"""
    rng = np.random.default_rng(seed)
    x = x0
    while x < x1:
        col = [(70, 110, 160), (220, 220, 220), (226, 92, 52), (80, 80, 90), (240, 200, 80), (150, 90, 140)][int(rng.integers(0, 6))]
        skin = [(206, 156, 120), (150, 104, 76), (232, 190, 156), (110, 76, 56)][int(rng.integers(0, 4))]
        ph = rng.uniform(0, 6); bob = 3 * math.sin(t * 1.5 + ph) * k
        hx = x + 2 * math.sin(t * 0.7 + ph)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hx - 16 * k, y - 34 * k + bob, hx + 16 * k, y + 10), 10 * k, 10 * k), P(mix(col, SKY0, 0.35), a))
        c.drawCircle(hx, y - 46 * k + bob, 11 * k, P(mix(skin, SKY0, 0.3), a))
        if rng.random() < 0.18:      # a hand fanning in the heat
            fa = math.sin(t * 6 + ph)
            c.drawLine(hx + 10 * k, y - 26 * k + bob, hx + 22 * k + 4 * fa * k, y - 56 * k + bob, SP(mix(skin, SKY0, 0.3), 5 * k, a))
        x += rng.uniform(26, 38) * k


def barrier(c, y, x0, x1, k=1.0, a=255):
    col = mix((170, 176, 182), SKY0, 0.2)
    c.drawLine(x0, y - 60 * k, x1, y - 60 * k, SP(col, 5 * k, a))
    c.drawLine(x0, y - 8 * k, x1, y - 8 * k, SP(col, 4 * k, a))
    x = x0
    while x <= x1:
        c.drawLine(x, y - 60 * k, x, y - 8 * k, SP(col, 2.5 * k, a)); x += 14 * k
    x = x0
    while x <= x1:
        c.drawLine(x, y - 64 * k, x - 10 * k, y + 4 * k, SP(mix(col, (60, 60, 70), 0.3), 5 * k, a)); x += 220 * k


def road(c, t, y_far=905, y_near=1500):
    c.drawRect(skia.Rect(-600, y_far, 1700, 2400), P(ASPH))
    lgrad(c, skia.Rect(-600, y_far, 1700, y_far + 160), y_far, y_far + 160, [mix(ASPH, SKY0, 0.45), ASPH])
    # the painted blue race line and dashed lane marks, converging to the vanishing point
    for frac, col, wd in ((0.45, (60, 140, 220), 10), (0.75, (236, 232, 220), 7)):
        p = skia.Path(); p.moveTo(-200 + frac * 900, 2000); p.lineTo(VP[0] - 60 + frac * 60, y_far)
        c.drawPath(p, SP(col, wd, 200))
    # heat shimmer over the asphalt: thin pale bands that ripple
    for i in range(7):
        yy = y_far + 30 + i * 36
        q = skia.Path(); q.moveTo(-100, yy)
        for x in range(-100, 1201, 30): q.lineTo(x, yy + 3 * math.sin(x * 0.03 + t * 5 + i))
        c.drawPath(q, SP((255, 236, 210), 3, 26))
    # cracks and a sun sheen on the hot asphalt, discarded paper cups from the water stations
    for (x, y, l, a) in ((120, 1240, 90, 0.3), (640, 1400, 120, -0.2), (300, 1700, 140, 0.5), (900, 1150, 70, 0.1)):
        p = skia.Path(); p.moveTo(x, y); p.lineTo(x + l * 0.4, y + l * 0.1 * (1 + a)); p.lineTo(x + l * 0.7, y - l * 0.05); p.lineTo(x + l, y + l * 0.08)
        c.drawPath(p, SP(ASPH_SH, 3))
    c.drawOval(skia.Rect(-200, 1000, 700, 1120), P((200, 186, 170), 40, MaskFilter=blur(30)))
    for (x, y, s, r) in ((90, 1330, 1.0, 80), (760, 1290, 0.9, -20), (980, 1460, 1.1, 30), (210, 1060, 0.6, 10), (560, 1010, 0.5, -70)):
        c.save(); c.translate(x, y); c.rotate(r); c.scale(s, s)
        c.drawPath(kit.poly([(-14, -20), (14, -20), (10, 18), (-10, 18)]), P((240, 240, 236)))
        c.drawRect(skia.Rect(-12, -6, 12, 2), P(MINT))
        c.drawOval(skia.Rect(-14, -24, 14, -16), P((214, 214, 210)))
        c.restore()


def street(c, t, crowd_a=255):
    sky(c, t); skyline(c, t); facades(c, t)
    arch(c, t, x=872, y=906, s=0.52)
    crowd(c, t, y=910, k=0.8, seed=5, a=crowd_a); barrier(c, 920, -300, 1400, k=0.8)
    road(c, t)


def shimmer_up(c, x0, x1, y, t, a=1.0, h=160):
    """heat rising off a hot body: soft wavering columns"""
    for i in range(6):
        xx = lerp(x0, x1, (i + 0.5) / 6)
        p = skia.Path(); p.moveTo(xx, y)
        for k in range(12):
            yy = y - k * h / 11; p.lineTo(xx + 10 * math.sin(k * 0.9 + t * 4 + i), yy)
        c.drawPath(p, SP((255, 220, 180), 6, 60 * a, MaskFilter=blur(3)))


# ------------------------------------------------------------------ shot A: the collapse
GROUND_A = 1225
RX0 = 440


def hip_y(who, kw):
    ps = A2.Pose(x=0, ground=0, **kw); J = who.joints(ps)
    return who.canvas_pt(ps, J['hip'])[1]


def draw_hip(c, who, kw, hip, rot=0.0, shadow_len=0.0, **dk):
    """draw a person so the hip sits at world point `hip`, rotated by `rot` about the hip (lying, falling, reclining)"""
    hy = hip_y(who, kw)
    ps = A2.Pose(x=hip[0], ground=hip[1] - hy, **kw)
    if rot == 0: return who.draw(c, ps, **dk)
    if shadow_len:
        c.drawOval(skia.Rect(hip[0] - shadow_len, hip[1] + 30 * who.k / 0.36, hip[0] + shadow_len * 0.9, hip[1] + 62 * who.k / 0.36),
                   P((20, 18, 24), 80, MaskFilter=blur(10)))
    c.save(); c.translate(*hip); c.rotate(rot); c.translate(-hip[0], -hip[1])
    J = who.draw(c, ps, shadow=False, **dk); c.restore(); return J


def rot_pt(p, piv, rot):
    a = math.radians(rot); dx, dy = p[0] - piv[0], p[1] - piv[1]
    return (piv[0] + dx * math.cos(a) - dy * math.sin(a), piv[1] + dx * math.sin(a) + dy * math.cos(a))


def part_pt(who, kw, hip, rot, name, off=(0, 0)):
    """world point of a joint (head_c, sh, ...) for a figure placed by draw_hip"""
    hy = hip_y(who, kw); ps = A2.Pose(x=hip[0], ground=hip[1] - hy, **kw); J = who.joints(ps)
    j = J[name] if not isinstance(J[name], tuple) or not isinstance(J[name][0], tuple) else J[name][0]
    p = who.canvas_pt(ps, (j[0] + off[0], j[1] + off[1]))
    return rot_pt(p, hip, rot)


T_BK = T_DROP + 0.05          # knees buckle
T_SIT = T_BK + 0.45           # deep crouch, sits down
T_BACK = T_SIT + 0.55         # rolled onto his back, knees up
T_FLAT = T_BACK + 0.45        # legs slide out flat
LIE_HIP_LIFT = 46             # hip height above the road when lying (buttock thickness at scale 0.36)


def runner_state(t, k=1.0):
    """the runner over the hook: staggering, knees buckle, sits down and falls back onto the road, legs slide out.
    Returns kw, hip (world), rot. Feet stay planted on the road until he sits."""
    if t < T_BK:
        # a real stagger from frame 0: uneven steps, the body lurching forward and catching itself, head lolling,
        # arms loose; one stumble dip at about 0.45 s
        tt = t + 0.5
        d = 46 * tt + 10 * math.sin(tt * 3.1)
        kw = gait(d, stride=36, amp=20)
        wob = math.sin(tt * 6.3) + 0.5 * math.sin(tt * 11.0)
        dip = math.exp(-((t - 0.05) / 0.14) ** 2) + 0.8 * math.exp(-((t - 0.62) / 0.12) ** 2)
        kw.update(face=1, lean=18 + 9 * wob + 12 * dip, neck=-10 + 10 * math.sin(tt * 4.4), uarm_n=kw['uarm_n'] * 0.4 + 18 + 14 * dip,
                  uarm_f=kw['uarm_f'] * 0.4 + 4 + 10 * math.sin(tt * 5), elbow_n=40 + 20 * math.sin(tt * 3), elbow_f=55,
                  knee_n=kw['knee_n'] - 28 * dip, knee_f=kw['knee_f'] - 20 * dip, look=0.25, mouth=0.35, blink=(t % 0.9) < 0.18)
        x = RX0 + d - 46 * 0.5
        return dict(kw=kw, hip=(x, GROUND_A + hip_y(RUN_S, kw)), rot=0.0, lying=0.0)
    x = RX0 + 46 * (T_BK + 0.5) + 10 * math.sin((T_BK + 0.5) * 3.1) - 23
    crouch = dict(face=1, lean=34, neck=10, thigh_n=92, knee_n=-150, thigh_f=80, knee_f=-148, uarm_n=34, elbow_n=30,
                  uarm_f=28, elbow_f=30, hand_n='flat', hand_f='flat', blink=True, mouth=0.4)
    if t < T_SIT:
        u = smooth((t - T_BK) / (T_SIT - T_BK))
        kw = dict(face=1, lean=lerp(16, 34, u), neck=lerp(-6, 10, u), thigh_n=lerp(14, 92, u), knee_n=lerp(-20, -150, u),
                  thigh_f=lerp(-14, 80, u), knee_f=lerp(-12, -148, u), uarm_n=lerp(14, 34, u), elbow_n=lerp(60, 30, u),
                  uarm_f=lerp(8, 28, u), elbow_f=lerp(60, 30, u), hand_n='flat', hand_f='flat', blink=u > 0.6, mouth=0.4)
        return dict(kw=kw, hip=(x, GROUND_A + hip_y(RUN_S, kw)), rot=0.0, lying=0.0)
    h_crouch = GROUND_A + hip_y(RUN_S, crouch)
    if t < T_BACK:
        u = (t - T_SIT) / (T_BACK - T_SIT); e = u * u           # gravity: slow then fast as he tips back
        # the thighs counter the roll so the feet stay down on the road while he sits and rolls back
        kw = dict(crouch, lean=lerp(34, 0, e), neck=lerp(10, -10, e), uarm_n=lerp(34, 20, e), uarm_f=lerp(28, 24, e),
                  thigh_n=92 - 90 * e, thigh_f=80 - 90 * e, knee_n=lerp(-150, -120, e), knee_f=lerp(-148, -118, e))
        hip = (x - 10 * e, lerp(h_crouch, GROUND_A - LIE_HIP_LIFT, min(1, u * 1.6)))
        return dict(kw=kw, hip=hip, rot=-90 * e, lying=e)
    u = smooth((t - T_BACK) / (T_FLAT - T_BACK))
    lk = runner_lying_kw(t)
    kw = dict(lk, thigh_n=lerp(2, lk['thigh_n'], u), knee_n=lerp(-120, lk['knee_n'], u), thigh_f=lerp(-10, lk['thigh_f'], u),
              knee_f=lerp(-118, lk['knee_f'], u), uarm_n=lerp(20, lk['uarm_n'], u), uarm_f=lerp(24, lk['uarm_f'], u))
    # a small settle as the back meets the road
    sett = 4 * math.sin(min(1, (t - T_BACK) / 0.25) * math.pi) * (t - T_BACK < 0.25)
    return dict(kw=kw, hip=(x - 10, GROUND_A - LIE_HIP_LIFT + sett), rot=-90, lying=1.0)


def runner_lying_kw(t, wake=0.0):
    """on his back, head to the left: breathing fast, eyes half open, head rolling"""
    br = 0.5 + 0.5 * math.sin(t * 7.0)
    return dict(face=1, lean=0, neck=-14 + 6 * math.sin(t * 0.9), thigh_n=6, knee_n=-18, thigh_f=18, knee_f=-30,
                uarm_n=-4, elbow_n=6, uarm_f=0, elbow_f=6, hand_n='flat', hand_f='flat', br=br,
                blink=(t % 2.3) < 0.9, mouth=0.35 + 0.15 * math.sin(t * 7.0), look=-0.3)


KNEEL = dict(lean=30, neck=26, thigh_n=60, knee_n=-120, thigh_f=40, knee_f=-110, uarm_f=30, elbow_f=30, hand_n='flat', hand_f='flat')


def medic_track(t, t0, x0, x1, speed, face, t_kneel):
    """a medic runs in (feet planted, distance driven gait) and kneels; returns (x, kw base, kneel u)"""
    d = max(0.0, min(abs(x1 - x0), (t - t0) * speed))
    x = x0 + d * (1 if x1 > x0 else -1)
    run = gait(d, stride=70, amp=30); run.update(face=face, lean=14, uarm_n=run['uarm_n'] * 2.2, uarm_f=run['uarm_f'] * 2.2, elbow_n=80, elbow_f=80)
    if d < abs(x1 - x0): return x, run, 0.0
    u = smooth((t - t_kneel) / 0.4)
    stand = dict(face=face, lean=8, uarm_n=10, elbow_n=30, uarm_f=10, elbow_f=30)
    kw = {k: (lerp(stand.get(k, 0), v, u) if isinstance(v, (int, float)) else v) for k, v in KNEEL.items()}
    kw['face'] = face
    return x, kw, u


def kneel_reach(who, x, kw, ground, target, u):
    """the near hand moves to target and stays there (arm solved per frame)"""
    if u <= 0 or target is None: return kw
    tx, ty = target
    rel = (tx - x, ty)
    ua, el = arm_to(who, kw, 'n', rel, ground)
    kk = dict(kw); kk['uarm_n'] = lerp(kw.get('uarm_n', 10), ua, u); kk['elbow_n'] = lerp(kw.get('elbow_n', 30), el, u)
    return kk


def shot_a(c, t):
    u = (t - T_FLAT) / (T_B - T_FLAT)
    # close on him mid lurch at frame 0, easing out as he goes down so the fall stays in frame, then pushing in
    e0 = smooth(min(t, T_FLAT) / T_FLAT)
    z0 = lerp(1.78, 1.62, e0); tx0 = lerp(490, 560, e0); ty0 = lerp(1062, 1050, e0)
    c.save(); kit.push(c, ease_io(max(0, u)), 540, 1060, z0, 1.7, tx0, ty0, 400, 1110)
    street(c, t)
    st = runner_state(t)
    lying = st['rot'] == -90
    # medic 2 runs in from the finish side and kneels on the far side of him at his chest (his knees hidden behind
    # the runner's body); his near hand rests on the runner's shoulder
    x2, kw2, u2 = medic_track(t, T_FLAT - 0.3, 1250, 500, 420, -1, T_FLAT - 0.3 + 750 / 420)
    if u2 > 0: kw2['lean'] = lerp(kw2['lean'], 44, u2)
    g2 = GROUND_A - 22 - 46 * (1 - u2)
    if u2 > 0 and lying:
        shp = part_pt(RUN_S, st['kw'], st['hip'], st['rot'], 'sh')
        kw2 = kneel_reach(MED2_S, x2, kw2, g2, (shp[0] + 16, shp[1] - 26), smooth((t - (T_FLAT - 0.3 + 750 / 420 + 0.2)) / 0.3))
    MED2_S.draw(c, A2.Pose(x=x2, ground=g2, **kw2), light=(-0.6, -0.7), shadow=False)
    draw_hip(c, RUN_S, st['kw'], st['hip'], st['rot'], shadow_len=230 if st['rot'] else 0)
    if lying:
        hc = part_pt(RUN_S, st['kw'], st['hip'], st['rot'], 'head_c')
        flush = smooth((t - T_BURN) / 0.6)
        if flush > 0:
            c.drawCircle(hc[0] + 40, hc[1] - 20, 120, P((255, 90, 50), 40 * flush, MaskFilter=blur(40)))
            shimmer_up(c, hc[0] - 40, st['hip'][0] + 120, st['hip'][1] - 50, t, flush, h=220)
    x1, kw1, u1 = medic_track(t, T_FLAT + 0.1, -200, 165, 380, 1, T_FLAT + 0.1 + 365 / 380)
    if u1 > 0: kw1['lean'] = lerp(kw1['lean'], 46, u1)
    g1 = GROUND_A + 16
    if u1 > 0 and lying:
        hc = part_pt(RUN_S, st['kw'], st['hip'], st['rot'], 'head_c')
        rr = smooth((t - (T_BURN - 0.25)) / 0.35)
        tgt = (lerp(hc[0] - 46, hc[0] - 4, rr), lerp(hc[1] - 10, hc[1] - 42, rr))
        kw1 = kneel_reach(MED1_S, x1, kw1, g1, tgt, smooth((t - (T_FLAT + 0.1 + 365 / 380 + 0.2)) / 0.3))
    MED1_S.draw(c, A2.Pose(x=x1, ground=g1, **kw1))
    c.restore()


# ------------------------------------------------------------------ ambulance, tent, stretcher
def ambulance(c, t, x, y, s=1.0, lights=0.0, doors=1.0, a=255):
    """side view box ambulance, rear to the right; doors swing open; light bar flashes red and white"""
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-330, -16, 330, 18), P((20, 18, 24), 90, MaskFilter=blur(12)))
    body = skia.Path(); body.addRRect(skia.RRect.MakeRectXY(skia.Rect(-120, -330, 300, -40), 18, 18))
    cab = kit.smooth_closed([(-300, -40), (-300, -170), (-260, -230), (-130, -240), (-120, -40)])
    c.drawPath(cab, P((236, 238, 240))); c.drawPath(body, P((246, 246, 244)))
    c.drawRect(skia.Rect(-300, -112, 300, -88), P(MINT))
    c.drawRect(skia.Rect(-120, -330, 300, -300), P((226, 92, 52)))
    c.drawPath(kit.poly([(-280, -168), (-246, -222), (-160, -226), (-160, -168)]), P((120, 160, 190)))
    c.drawPath(kit.poly([(-276, -170), (-250, -212), (-226, -214), (-250, -170)]), P((210, 230, 240), 120))
    # a plain cross free emblem: the word on the side
    f = skia.Font(kit.L.BLACK, 44); c.drawString('AMBULANCE', -60, -150, f, P((226, 92, 52)))
    c.drawRect(skia.Rect(-120, -330, 300, -40), P((0, 0, 0), 0)); c.drawRect(skia.Rect(270, -320, 300, -50), P((200, 204, 210)))
    for wx in (-200, 190):
        c.drawCircle(wx, -36, 50, P((40, 40, 46))); c.drawCircle(wx, -36, 24, P((170, 176, 184)))
    # light bar
    for k, col in enumerate([(255, 60, 60), (250, 250, 250), (255, 60, 60)]):
        lx = -250 + k * 30
        on = lights * max(0.0, math.sin(t * 12 + k * 2.2)) ** 2
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(lx - 12, -256, lx + 12, -240), 5, 5), P(mix(col, (120, 120, 120), 0.6 * (1 - on))))
        if on > 0.05:
            c.drawCircle(lx, -248, 140, P(col, 220 * on, MaskFilter=blur(44), BlendMode=skia.BlendMode.kScreen))
            c.drawCircle(lx, -248, 26, P((255, 255, 255), 220 * on, MaskFilter=blur(8)))
            c.drawOval(skia.Rect(lx - 260, 10, lx + 260, 60), P(col, 60 * on, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    # rear doors (hinged at the back edge, swing open toward the viewer)
    if doors > 0:
        dw = 140 * (1 - 0.7 * doors)
        c.drawRect(skia.Rect(300, -310, 300 + dw * 0.5, -50), P((226, 228, 230)))
        c.drawRect(skia.Rect(300, -260, 300 + dw * 0.5, -230), P(MINT))
        c.drawRect(skia.Rect(270, -320, 300, -50), P((70, 80, 96)))          # the dark open rear
    c.restore()


def tent_ext(c, t, x, y, s=1.0):
    """the white race medical tent from outside: canopy, valance with MEDICAL, open front, cots and a tub inside"""
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-320, -14, 320, 16), P((20, 18, 24), 60, MaskFilter=blur(14)))
    c.drawRect(skia.Rect(-290, -380, 290, 0), P((96, 104, 116)))               # shade inside
    c.drawRect(skia.Rect(-280, -120, -60, -80), P((200, 196, 190)))            # a cot
    c.drawRoundRect(skia.Rect(20, -110, 260, 0), 30, 30, P((70, 130, 190)))     # the blue tub
    c.drawRect(skia.Rect(34, -104, 246, -86), P(WATER))
    for k in range(5):
        c.drawRect(skia.Rect(50 + k * 40, -100 + 3 * math.sin(t * 2 + k), 70 + k * 40, -86 + 3 * math.sin(t * 2 + k)), P((236, 248, 252)))
    sway = 3 * math.sin(t * 1.4)
    roof = kit.poly([(-330, -380), (0, -520 + sway), (330, -380)])
    c.drawPath(roof, P(TENT)); c.drawPath(kit.poly([(0, -520 + sway), (330, -380), (0, -400)]), P(TENT_SH))
    c.drawRect(skia.Rect(-330, -390, 330, -330), P(TENT))
    for k in range(-330, 330, 60):
        c.drawPath(kit.poly([(k, -330), (k + 60, -330), (k + 30, -312 + 4 * math.sin(t * 2 + k))]), P(TENT))
    f = skia.Font(kit.L.BLACK, 40); w = f.measureText('MEDICAL'); c.drawString('MEDICAL', -w / 2, -346, f, P(MINT))
    for px in (-300, 300): c.drawRect(skia.Rect(px - 8, -390, px + 8, 0), P((180, 184, 190)))
    c.restore()


def stretcher_draw(c, a, b, who_kw=None, t=0.0, wheels=False, blanket=False):
    """a stretcher whose two handle ends are a (left) and b (right): poles, canvas, the runner lying on it"""
    ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
    L_ = math.hypot(b[0] - a[0], b[1] - a[1])
    c.save(); c.translate(*a); c.rotate(ang)
    if wheels:
        for wx0, wx1 in ((70, L_ - 150), (L_ - 70, 150)):          # the X frame under the cot
            c.drawLine(wx0, 8, wx1, 96, SP((150, 156, 166), 7))
        for wx in (150, L_ - 150):
            c.drawLine(wx, 96, wx, 108, SP((120, 126, 136), 6))
            c.drawCircle(wx, 120, 17, P((34, 34, 40))); c.drawCircle(wx, 120, 9, P((176, 182, 190)))
            for k in range(3):
                aw = t * 3 + k * 2.094
                c.drawLine(wx, 120, wx + 8 * math.cos(aw), 120 + 8 * math.sin(aw), SP((110, 116, 126), 2))
        # the push rail at the foot end
        c.drawLine(L_ - 4, 0, L_ + 6, -46, SP((170, 176, 186), 8)); c.drawLine(L_ + 6, -46, L_ + 26, -46, SP((170, 176, 186), 8))
    c.drawLine(0, 0, L_, 0, SP((160, 166, 176), 9))
    c.drawRect(skia.Rect(26, -6, L_ - 26, 10), P((214, 102, 70)))
    c.restore()
    if who_kw is not None:
        mid = ((a[0] + b[0]) / 2 + (0 if wheels else 40), (a[1] + b[1]) / 2 - 34)
        draw_hip(c, RUN_M, who_kw, mid, -90 + ang)
        if blanket:
            c.save(); c.translate(mid[0] + 30, mid[1]); c.rotate(ang)
            c.drawPath(kit.smooth_closed([(-60, -26), (150, -24), (190, 10), (150, 40), (-60, 40)]), P((150, 170, 196)))
            c.drawPath(kit.smooth_closed([(-60, -26), (150, -24), (160, -10), (-60, -8)]), P((180, 196, 218)))
            c.restore()


CARRY_H = None


def carriers(c, t, x_rear, lift, walk_d, lying_kw, light=(0.75, -0.65)):
    """two medics carry the stretcher: their hands hold the handles; the stretcher is drawn from their hand points.
    lift 0 = crouched with the stretcher on the road, 1 = standing; walk_d = distance walked to the right."""
    span = 440
    out = []
    for i, who in enumerate((MED1_M, MED2_M)):
        x = x_rear + walk_d + i * span
        g = gait(walk_d + i * 26, stride=56, amp=20) if walk_d > 0 else dict(thigh_n=0, knee_n=-6, thigh_f=0, knee_f=-6)
        kw = dict(face=1, lean=lerp(30, 6, lift), neck=10,
                  thigh_n=lerp(80, g['thigh_n'], lift), knee_n=lerp(-130, g['knee_n'], lift),
                  thigh_f=lerp(70, g['thigh_f'], lift), knee_f=lerp(-126, g['knee_f'], lift),
                  hand_n='grip', hand_f='grip', uarm_f=4, elbow_f=10)
        # near arm hangs to the handle: rear medic reaches forward, front medic reaches back
        kw['uarm_n'] = 12 if i == 0 else -16; kw['elbow_n'] = 8 if i == 0 else 4
        kw['uarm_f'] = 10 if i == 0 else -12
        ps = A2.Pose(x=x, ground=GROUND_B, **kw); J = who.joints(ps)
        out.append((who, ps, who.canvas_pt(ps, J['hand_n'][0])))
    a, b = out[0][2], out[1][2]
    for who, ps, _ in out: who.draw(c, ps, light=light)
    stretcher_draw(c, (a[0] - 6, a[1] + 4), (b[0] + 6, b[1] + 4), lying_kw, t)
    return a, b


GROUND_B = 1240


def shot_b(c, t):
    u = (t - T_B) / (T_C - T_B)
    pan = smooth((t - (T_NOT - 0.3)) / 1.1)
    z = lerp(1.15, 1.3, pan); tx = lerp(390, 780, pan); ty = lerp(1050, 1070, pan)
    c.save(); c.translate(540, 1080); c.scale(z, z); c.translate(-tx, -ty)
    street(c, t)
    amb = smooth((t - (at('rush') - 0.1)) / 0.15) * (1 - 0.6 * smooth((t - T_NOT) / 0.4))
    ambulance(c, t, 140, GROUND_B - 120, 0.7, lights=amb, doors=0.0)
    tent_ext(c, t, 1180, GROUND_B - 90, 0.9)
    lift = smooth((t - (T_B + 0.15)) / 0.6)
    walk = max(0.0, t - (T_B + 0.75)) * 70 + max(0.0, t - (T_NOT + 0.05)) * 90
    carriers(c, t, 250, lift, walk, runner_lying_kw(t))
    c.restore()


# ------------------------------------------------------------------ inside the medical tent
GROUND_T = 1300


def tent_inside(c, t):
    lgrad(c, skia.Rect(-600, -400, 1700, 1400), -400, 1400, [(252, 246, 232), (238, 230, 214), (222, 214, 200)])
    # sun glowing through the fabric roof, seams and poles
    c.drawCircle(820, 520, 420, P((255, 236, 190), 90, MaskFilter=blur(120)))
    for k in range(-2, 7):
        x = k * 220 + 30 * math.sin(t * 0.6 + k) * 0.1
        c.drawLine(x, 300, x + 60, 980, SP((214, 206, 192), 4, 160))
    c.drawRect(skia.Rect(-600, 960, 1700, 990), P((200, 194, 184)))                  # the valance seam
    # the open side panel: the bright street outside, soft
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(6, 6)))
    c.drawRect(skia.Rect(-120, 640, 240, 1180), P((236, 214, 170)))
    crowd(c, t, y=1120, x0=-140, x1=260, k=1.2, seed=9)
    c.restore()
    c.drawRect(skia.Rect(-140, 620, 250, 640), P((206, 200, 190)))
    c.drawLine(250, 620, 250, GROUND_T, SP((184, 188, 196), 12))
    # floor tarp
    c.drawRect(skia.Rect(-600, 1180, 1700, 2400), P((150, 156, 160)))
    lgrad(c, skia.Rect(-600, 1180, 1700, 1300), 1180, 1300, [(176, 180, 184), (150, 156, 160)])
    # a table with water bottles and ice bags, a standing fan turning (scene life)
    c.drawRect(skia.Rect(940, 1060, 1260, 1080), P((120, 124, 132))); c.drawLine(960, 1080, 960, 1190, SP((90, 94, 100), 8)); c.drawLine(1240, 1080, 1240, 1190, SP((90, 94, 100), 8))
    for k in range(4):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(960 + k * 34, 990, 986 + k * 34, 1060), 8, 8), P((170, 214, 236), 220))
    for k in range(2):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1110 + k * 70, 1004 + k * 6, 1176 + k * 70, 1062), 18, 18), P((240, 246, 250)))
        f = skia.Font(kit.L.BLACK, 16); c.drawString('ICE', 1126 + k * 70, 1040 + k * 6, f, P((60, 140, 200)))
    fx, fy = 1300, 820
    c.drawLine(fx, fy, fx, GROUND_T - 120, SP((90, 94, 100), 8))
    c.drawCircle(fx, fy, 70, P((200, 206, 214)))
    for k in range(3):
        a = t * 14 + k * 2.094
        c.drawPath(kit.smooth_closed([(fx, fy), (fx + 60 * math.cos(a - 0.3), fy + 60 * math.sin(a - 0.3)), (fx + 64 * math.cos(a + 0.3), fy + 64 * math.sin(a + 0.3))]), P((150, 160, 172)))
    c.drawCircle(fx, fy, 70, SP((120, 126, 136), 4))


def cot(c, x, y, w=520):
    c.drawRect(skia.Rect(x, y, x + w, y + 18), P((70, 96, 120)))
    c.drawRect(skia.Rect(x, y - 6, x + w, y + 4), P((96, 126, 152)))
    for lx in (x + 30, x + w - 30):
        c.drawLine(lx, y + 14, lx - 26, y + 120, SP((150, 156, 166), 7)); c.drawLine(lx, y + 14, lx + 26, y + 120, SP((150, 156, 166), 7))


def monitor(c, x, y, temp, s=1.0, timer=None, glow=0.0, cable=True):
    """the handheld temperature monitor: screen with the reading in F and RECTAL; cable trailing down"""
    c.save(); c.translate(x, y); c.scale(s, s)
    if cable: c.drawPath(_cable(), SP((40, 44, 50), 5))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-120, -80, 120, 80), 22, 22), P((52, 58, 70)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-104, -64, 104, 52), 12, 12), P((18, 30, 34)))
    hot = max(0.0, min(1.0, (temp - 102) / 5))
    col = mix((120, 240, 200), (255, 120, 80), hot)
    if glow: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-104, -64, 104, 52), 12, 12), P(col, 60 * glow, MaskFilter=blur(16)))
    f = skia.Font(kit.L.BLACK, 62); txt = f'{temp:.1f}'
    w = f.measureText(txt); c.drawString(txt, -w / 2 - 14, 8, f, P(col))
    f2 = skia.Font(kit.L.BLACK, 24); c.drawString('°F', w / 2 - 8, -16, f2, P(col))
    f3 = skia.Font(kit.L.BLACK, 20); w3 = f3.measureText('RECTAL'); c.drawString('RECTAL', -w3 / 2, 40, f3, P((200, 210, 214)))
    if timer is not None:
        f4 = skia.Font(kit.L.BLACK, 22); tt = f'{int(timer):02d}:{int((timer % 1) * 60):02d}'
        c.drawString(tt, -98, -38, f4, P((200, 210, 214)))
    c.restore()


def _cable():
    p = skia.Path(); p.moveTo(0, 80); p.cubicTo(10, 160, -80, 180, -60, 320); return p


def body_map(c, t, cx, cy, heat, dmg):
    """front view body outline with the brain and the organs warming orange to red (the cutaway inside the lens)"""
    c.drawRect(skia.Rect(cx - 600, cy - 600, cx + 600, cy + 600), P((24, 30, 44)))
    for k in range(12):
        c.drawCircle(cx - 500 + k * 90 + 20 * math.sin(t + k), cy - 300 + 60 * math.sin(t * 0.7 + k * 2), 3, P((120, 140, 180), 90))
    # an anatomical front view outline: head, neck, sloping shoulders, arms hanging at the sides, waist, hips, legs
    R = [(0, -282), (26, -280), (34, -258), (60, -244), (120, -232), (156, -214), (170, -180), (178, -120), (186, -40),
         (196, 40), (206, 120), (210, 170), (198, 186), (182, 160), (172, 90), (160, 20), (150, -40), (142, -10), (132, 50),
         (140, 120), (150, 200), (140, 300), (110, 420), (40, 420), (26, 300), (8, 230), (0, 222)]
    pts = [(cx + x, cy + y) for x, y in R] + [(cx - x, cy + y) for x, y in R[::-1][1:-1]]
    body = kit.poly(pts)
    head = skia.Path(); head.addOval(skia.Rect(cx - 54, cy - 410, cx + 54, cy - 272))
    sil = skia.Op(body, head, skia.PathOp.kUnion_PathOp)
    hotc = mix((255, 170, 80), (230, 40, 30), heat)
    c.drawPath(sil, P((60, 70, 92)))
    c.drawPath(sil, P(hotc, 60 + 60 * heat, MaskFilter=blur(30)))
    c.drawPath(sil, SP((150, 170, 210), 4, 180))
    pul = 1 + 0.05 * dmg * math.sin(t * 9)

    heat_v = max(0.0, min(1.0, heat))

    def hcol(base):
        return mix(base, hotc, 0.12 + 0.45 * heat_v)

    def glow(path):
        if heat_v > 0.2: c.drawPath(path, P((255, 120, 60), 110 * heat_v, MaskFilter=blur(16)))

    def at_scale(ox, oy, fn):
        c.save(); c.translate(ox, oy); c.scale(pul, pul); c.translate(-ox, -oy); fn(); c.restore()

    # brain: rounded cerebrum with a few folds, small cerebellum
    def brain():
        p = kit.smooth_closed([(cx - 58, cy - 318), (cx - 40, cy - 356), (cx, cy - 370), (cx + 44, cy - 356), (cx + 60, cy - 320), (cx + 46, cy - 296), (cx - 44, cy - 296)])
        glow(p); c.drawPath(p, P(hcol((236, 168, 176))))
        for k in range(4):
            q = skia.Path(); q.moveTo(cx - 40 + k * 26, cy - 352 + 6 * (k % 2)); q.quadTo(cx - 30 + k * 26, cy - 330, cx - 44 + k * 26, cy - 306)
            c.drawPath(q, SP(hcol((200, 120, 132)), 4))
        c.drawPath(kit.smooth_closed([(cx + 10, cy - 300), (cx + 40, cy - 302), (cx + 36, cy - 284), (cx + 14, cy - 284)]), P(hcol((210, 140, 150))))
    at_scale(cx, cy - 330, brain)

    # heart: two rounded lobes to a point, with the aorta arching up
    def heart():
        hx, hy = cx + 20, cy - 130
        p = skia.Path(); p.moveTo(hx, hy + 52)
        p.cubicTo(hx - 70, hy + 10, hx - 50, hy - 40, hx - 12, hy - 24); p.cubicTo(hx, hy - 44, hx + 50, hy - 40, hx + 44, hy); p.cubicTo(hx + 40, hy + 24, hx + 16, hy + 40, hx, hy + 52); p.close()
        glow(p); c.drawPath(p, P(hcol((204, 64, 74))))
        a_ = skia.Path(); a_.moveTo(hx + 2, hy - 30); a_.quadTo(hx - 4, hy - 66, hx - 34, hy - 62); a_.quadTo(hx - 54, hy - 58, hx - 50, hy - 40)
        c.drawPath(a_, SP(hcol((214, 84, 90)), 10))
        c.drawLine(hx + 16, hy - 32, hx + 22, hy - 58, SP(hcol((120, 120, 200)), 9))
    at_scale(cx + 20, cy - 130, heart)

    # liver: the big wedge on the right side of the body (viewer's left), under the ribs
    def liver():
        p = kit.smooth_closed([(cx - 130, cy - 62), (cx - 20, cy - 74), (cx + 46, cy - 58), (cx + 10, cy - 30), (cx - 70, cy - 2), (cx - 124, cy - 20)])
        glow(p); c.drawPath(p, P(hcol((150, 64, 54))))
        c.drawLine(cx - 24, cy - 72, cx - 40, cy - 22, SP(hcol((120, 50, 44)), 4))
    at_scale(cx - 40, cy - 40, liver)

    # kidneys: two beans low on the back, each with its notch facing the middle
    def kidney(sx):
        kx, ky = cx + sx * 86, cy + 70
        p = skia.Path(); p.addOval(skia.Rect(kx - 24, ky - 40, kx + 24, ky + 40))
        notch = skia.Path(); notch.addOval(skia.Rect(kx - sx * 30 - 12, ky - 12, kx - sx * 30 + 12, ky + 12))
        p = skia.Op(p, notch, skia.PathOp.kDifference_PathOp)
        glow(p); c.drawPath(p, P(hcol((176, 86, 78))))
    at_scale(cx - 86, cy + 70, lambda: kidney(-1)); at_scale(cx + 86, cy + 70, lambda: kidney(1))
    # heat ripples rising off the body
    for i in range(5):
        p = skia.Path(); x0 = cx - 160 + i * 80; p.moveTo(x0, cy - 260)
        for k in range(8): p.lineTo(x0 + 12 * math.sin(k + t * 5 + i), cy - 260 - k * 30)
        c.drawPath(p, SP((255, 160, 90), 5, 80 * heat, MaskFilter=blur(3)))


def tent_cam(t):
    """tent shot camera: settles, punches in on the monitor on "seven", holds, eases back for the lens"""
    k1 = smooth((t - (T_107 - 0.35)) / 0.45) * (1 - smooth((t - (T_BRAIN - 1.1)) / 0.7))
    z = lerp(1.33 + 0.08 * smooth((t - T_C) / 2.0), 2.15, k1)
    tx = lerp(640, 830, k1); ty = lerp(1080, 1010, k1)
    return z, tx, ty


def shot_c(c, t):
    z, tx, ty = tent_cam(t)
    c.save(); c.translate(540, 1060); c.scale(z, z); c.translate(-tx, -ty)
    tent_inside(c, t)
    cot(c, 300, 1150, 500)
    # restless: head rolling, near arm twitching, fast shallow breathing
    lk = runner_lying_kw(t)
    lk.update(neck=-14 + 10 * math.sin(t * 1.7), uarm_n=-4 + 10 * max(0.0, math.sin(t * 2.3)) ** 3, elbow_n=6 + 20 * max(0.0, math.sin(t * 2.3)) ** 3,
              br=0.5 + 0.5 * math.sin(t * 9.0), mouth=0.3 + 0.2 * math.sin(t * 9.0))
    hip = (590, 1150 - LIE_HIP_LIFT + 6)
    # the second medic kneels on the far side of the cot with a hand on his shoulder
    shp = part_pt(RUN_S, lk, hip, -90, 'sh')
    kk = dict(face=1, **KNEEL); kk['lean'] = 40
    kk = kneel_reach(MED1_S, 390, kk, GROUND_T - 70, (shp[0] + 10, shp[1] - 18), 1.0)
    MED1_S.draw(c, A2.Pose(x=390, ground=GROUND_T - 70, **kk), shadow=False)
    draw_hip(c, RUN_S, lk, hip, -90, shadow_len=0)
    # a folded towel over his hips, where the rectal probe cable runs in under it
    hp = part_pt(RUN_S, lk, hip, -90, 'hip')
    c.drawPath(kit.smooth_closed([(hp[0] - 34, hp[1] - 30), (hp[0] + 44, hp[1] - 34), (hp[0] + 52, hp[1] + 6), (hp[0] - 40, hp[1] + 8)]), P((236, 240, 244)))
    c.drawLine(hp[0] - 26, hp[1] - 14, hp[0] + 40, hp[1] - 18, SP((63, 194, 169), 4))
    # the medic beside the cot holds the monitor in front of his chest: the monitor is drawn at his hands
    kw = dict(face=-1, lean=8, neck=lerp(18, 26, smooth((t - T_THERM) / 0.4)), thigh_n=4, knee_n=-6, thigh_f=-2, knee_f=-6, hand_n='grip', hand_f='grip',
              uarm_n=34 + 3 * math.sin(t * 1.3), elbow_n=96, uarm_f=30, elbow_f=100, look=lerp(0.3, -0.4, smooth((t - T_THERM) / 0.4)), br=0.5 + 0.5 * math.sin(t * 2))
    ps = A2.Pose(x=950, ground=GROUND_T - 20, **kw); J = MED2_S.joints(ps)
    hx, hy = MED2_S.canvas_pt(ps, J['hand_f'][0])
    mxy = (hx - 70, hy - 60)
    cab = skia.Path(); cab.moveTo(mxy[0], mxy[1] + 64); cab.cubicTo(mxy[0] + 10, mxy[1] + 160, hp[0] + 160, hp[1] - 60, hp[0] + 60, hp[1] - 20)
    c.drawPath(cab, SP((40, 44, 50), 5))
    MED2_S.draw(c, ps, light=(-0.6, -0.7))
    monitor(c, mxy[0], mxy[1], 107.1, 0.8, glow=smooth((t - T_THERM) / 0.4) * (1 + 1.5 * max(0, 1 - abs(t - T_107 - 0.2) / 0.3) * (0.5 + 0.5 * math.sin(t * 30))), cable=False)
    hx2, hy2 = MED2_S.canvas_pt(ps, J['hand_n'][0])
    c.drawPath(kit.smooth_closed([(hx2 - 16, hy2 - 10), (hx2 + 14, hy2 - 14), (hx2 + 16, hy2 + 12), (hx2 - 14, hy2 + 14)]), P((222, 176, 140)))
    c.restore()
    # every minute counts: a small timer on the monitor's side (screen coords near the monitor)
    k = smooth((t - (T_EVERY - 0.1)) / 0.3) * (1 - smooth((t - (T_BRAIN - 0.3)) / 0.3))
    if k > 0:
        sec = (t - T_EVERY) * 6
        cx, cy = 130, 600
        c.drawCircle(cx, cy, 64, P((14, 20, 34), 220 * k)); c.drawCircle(cx, cy, 64, SP((255, 210, 63), 5, 255 * k))
        a = -math.pi / 2 + sec * 2 * math.pi / 60 * 10
        c.drawLine(cx, cy, cx + 48 * math.cos(a), cy + 48 * math.sin(a), SP((255, 210, 63), 6, 255 * k))
        kit.L.chip(c, 'every minute', cx + 210, cy, Y, size=40, a=k)
    # the lens opens from his head: the brain and organs heating
    op = smooth((t - (T_BRAIN - 0.35)) / 0.5)
    if op > 0.06:
        r = 470 * op
        path = skia.Path(); path.addCircle(540, 930, r)
        c.save(); c.clipPath(path, doAntiAlias=True)
        c.translate(540, 930); s = 0.7 + 0.3 * op; c.scale(s, s); c.translate(-540, -930)
        body_map(c, t, 540, 960, heat=smooth((t - T_BRAIN) / 1.2), dmg=smooth((t - (T_DMG - 0.2)) / 0.3))
        c.restore()
        c.drawCircle(540, 930, r, SP((255, 150, 90), 6, 230))
        kit.L.chip(c, 'brain', 700, 600, OR, size=42, a=smooth((t - T_BRAIN) / 0.3))
        kit.L.chip(c, 'organs', 760, 1000, OR, size=42, a=smooth((t - (T_BRAIN + 0.4)) / 0.3))
        # the story stays on screen: a round inset of him on the cot, lower left
        ins = 150 * op; ix, iy = 230, 1230
        ip = skia.Path(); ip.addCircle(ix, iy, ins)
        c.save(); c.clipPath(ip, doAntiAlias=True); c.translate(ix, iy); c.scale(0.62, 0.62); c.translate(-500, -1110)
        tent_inside(c, t); cot(c, 300, 1150, 500); draw_hip(c, RUN_S, lk, (590, 1150 - LIE_HIP_LIFT + 6), -90)
        c.restore(); c.drawCircle(ix, iy, ins, SP((255, 255, 255), 5, 230))


# ------------------------------------------------------------------ the ice water tub
# seen a little from above: the rim is an ellipse (back edge 1086, front edge 1214); the water surface sits just
# inside it; the near wall runs from the front rim down to the floor
TX0, TX1, RIM_T, RIM_B, TB = 280, 880, 1086, 1214, 1368
WL = 1150                          # centre of the water surface ellipse
WS = 44                            # its half height


def tub_back(c, t):
    c.drawOval(skia.Rect(TX0 - 40, TB - 24, TX1 + 40, TB + 26), P((20, 18, 24), 90, MaskFilter=blur(14)))
    c.drawOval(skia.Rect(TX0, RIM_T, TX1, RIM_B), P((52, 92, 138)))              # inside of the tub


def water_top(c, t, stir=0.0, a=235):
    """the water surface: ripples, ice cubes bobbing, a swirl where it is stirred"""
    surf = skia.Rect(TX0 + 14, WL - WS, TX1 - 14, WL + WS + 20)
    c.save(); c.clipPath(skia.Path().addOval(surf), doAntiAlias=True)
    c.saveLayerAlpha(None, int(a))
    lgrad(c, surf, WL - WS, WL + WS + 20, [mix(WATER, (230, 248, 255), 0.35), WATER, WATER_D])
    c.restore()
    for k in range(5):
        r = ((t * 40 + k * 60) % 300)
        c.drawOval(skia.Rect(560 - r, WL + 6 - r * 0.13, 560 + r, WL + 6 + r * 0.13), SP((230, 250, 255), 3, 110 * (1 - r / 300)))
    if stir > 0:
        for k in range(4):
            a0 = t * 4 + k * 1.57
            p = skia.Path(); p.addArc(skia.Rect(822 - 70, WL + 6 - 16, 822 + 70, WL + 6 + 16), math.degrees(a0), 80)
            c.drawPath(p, SP((240, 252, 255), 4, 200 * stir))
    rng = np.random.default_rng(3)
    for k in range(10):
        px = TX0 + 380 + (k % 5) * 52 + 10 * math.sin(t * 1.3 + k) + 30 * stir * math.sin(t * 4 + k)
        py = WL - 20 + (k // 5) * 30 + 3 * math.sin(t * 2.1 + k * 1.7)
        sz = rng.uniform(18, 28); ang = rng.uniform(-20, 20) + 20 * math.sin(t + k)
        c.save(); c.translate(px, py); c.rotate(ang)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-sz / 2, -sz / 2.6, sz / 2, sz / 2.6), 4, 4), P((236, 248, 252)))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-sz / 2, -sz / 2.6, sz / 2, -sz / 8), 4, 4), P((255, 255, 255)))
        c.restore()
    c.restore()


def tub_front(c, t):
    near = skia.Path(); near.moveTo(TX0, (RIM_T + RIM_B) / 2)
    near.arcTo(skia.Rect(TX0, RIM_T, TX1, RIM_B), 180, -180, False)
    near.lineTo(TX1, TB - 40); near.quadTo(TX1, TB, TX1 - 40, TB); near.lineTo(TX0 + 40, TB); near.quadTo(TX0, TB, TX0, TB - 40); near.close()
    c.drawPath(near, P((86, 136, 186)))
    for k in range(5):
        c.drawRect(skia.Rect(TX0 + 10, RIM_B + 10 + k * 28, TX1 - 10, RIM_B + 16 + k * 28), P((70, 118, 166)))
    c.drawOval(skia.Rect(TX0 - 6, RIM_T - 6, TX1 + 6, RIM_B + 6), SP((178, 208, 234), 10))
    c.drawRect(skia.Rect(TX1 - 120, RIM_B + 4, TX1 - 40, TB - 10), P((255, 255, 255), 30))


def sheet_path(a, b, sag):
    p = skia.Path(); p.moveTo(*a)
    mx = (a[0] + b[0]) / 2; my = (a[1] + b[1]) / 2 + sag
    p.quadTo(mx, my, *b); return p


IN_KW = dict(thigh_n=70, knee_n=-30, thigh_f=74, knee_f=-34)
HIP_IN = (560, 1260); ROT_IN = -38


def lower_state(t):
    """the lowering: he lies sagging in a sheet held at its four corners by two medics, who lower it into the tub;
    u 0 above the tub, 1 settled reclined with the water at his neck"""
    u = smooth((t - (T_HERE - 0.3)) / (T_NECK + 0.1 - (T_HERE - 0.3)))
    hip = (lerp(590, HIP_IN[0], u), lerp(992, HIP_IN[1], u))
    rot = lerp(-84, ROT_IN, u)
    return hip, rot, u


def sheet_kw(t, u):
    """his body sagging in the sheet: hips low, knees a little bent, head lolling back"""
    kw = runner_tub_kw(t, 0.0, u)
    sag = 1 - smooth((u - 0.5) / 0.4)
    kw['thigh_n'] = lerp(kw['thigh_n'], 26, sag); kw['knee_n'] = lerp(kw['knee_n'], -34, sag)
    kw['thigh_f'] = lerp(kw['thigh_f'], 30, sag); kw['knee_f'] = lerp(kw['knee_f'], -38, sag)
    kw['neck'] = lerp(kw['neck'], -16, sag)
    return kw


def cloth(c, pts, width, col=(238, 236, 228), sh=(206, 204, 196), a=255, folds=True):
    """a soft cloth band along pts: varying width, a shade along the lower edge and a few folds"""
    n = len(pts)
    top, bot = [], []
    for i, (x, y) in enumerate(pts):
        x0, y0 = pts[max(0, i - 1)]; x1, y1 = pts[min(n - 1, i + 1)]
        dx, dy = x1 - x0, y1 - y0; L_ = math.hypot(dx, dy) or 1
        nx, ny = -dy / L_, dx / L_
        w = width * (0.8 + 0.35 * math.sin(i / max(1, n - 1) * math.pi))
        top.append((x + nx * w / 2, y + ny * w / 2)); bot.append((x - nx * w / 2, y - ny * w / 2))
    poly = top + bot[::-1]
    c.drawPath(kit.smooth_closed(poly) if len(poly) > 4 else kit.poly(poly), P(col, a))
    c.drawPath(kit.smooth_closed([*bot[1:-1], *[(x + 0.35 * (tx - x), y + 0.35 * (ty - y)) for (x, y), (tx, ty) in zip(bot[::-1][1:-1], top[::-1][1:-1])]]), P(sh, a * 0.8))
    if folds:
        for i in range(1, n - 1, 2):
            (x0, y0), (x1, y1) = top[i], bot[i]
            c.drawLine(lerp(x0, x1, 0.2), lerp(y0, y1, 0.2), lerp(x0, x1, 0.75) + 6, lerp(y0, y1, 0.75), SP(sh, 3, a * 0.8))


def medic_hold(c, who, x, g, face, hand, t, extra=None, both=True):
    kw = dict(face=face, lean=30, neck=24, thigh_n=10, knee_n=-14, thigh_f=4, knee_f=-10, hand_n='grip', hand_f='grip',
              br=0.5 + 0.5 * math.sin(t * 2.2))
    if extra: kw.update(extra)
    ua, el = arm_to(who, kw, 'n', (hand[0] - x, hand[1]), g)
    kw.update(uarm_n=ua, elbow_n=el)
    if both:
        ua, el = arm_to(who, kw, 'f', (hand[0] - x - 14 * face, hand[1] + 4), g)
        kw.update(uarm_f=ua, elbow_f=el)
    ps = A2.Pose(x=x, ground=g, **kw); who.draw(c, ps)
    J = who.joints(ps)
    return who.canvas_pt(ps, J['hand_n'][0])


def runner_tub_kw(t, wake=0.0, u=1.0):
    kw = dict(face=1, lean=0, neck=lerp(-20, 4, wake) + 4 * math.sin(t * 0.8) * (1 - wake), thigh_n=6, knee_n=-18,
              thigh_f=18, knee_f=-30, uarm_n=-4, elbow_n=6, uarm_f=0, elbow_f=6, hand_n='flat', hand_f='flat',
              br=0.5 + 0.5 * math.sin(t * 6), blink=(wake < 0.5 and (t % 2.0) < 1.2) or (wake >= 0.5 and (t % 3.1) < 0.12),
              mouth=0.3 * (1 - wake) + 0.6 * wake * (0.5 + 0.5 * math.sin(t * 11)) * (T_SENSE - 0.1 < t < T_SENSE + 1.6), look=lerp(-0.3, 0.2, wake))
    for k, v in IN_KW.items(): kw[k] = lerp(kw[k], v, u)
    kw['uarm_n'] = lerp(-4, 20, u); kw['uarm_f'] = lerp(0, 24, u); kw['elbow_n'] = lerp(6, 40, u); kw['elbow_f'] = lerp(6, 40, u)
    return kw


def towel(c, pts, w=34):
    """a towel strand: white terry with two teal stripes, soft edges, a fold shadow"""
    cloth(c, pts, w, col=(246, 246, 240), sh=(214, 214, 206))
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    for k in (-0.25, 0.25):
        q = skia.Path(); q.moveTo(pts[0][0], pts[0][1] + k * w)
        for (x, y) in pts[1:]: q.lineTo(x, y + k * w)
        c.drawPath(q, SP((63, 194, 169), 4, 200))


def splash(c, t, t0, cx, cy):
    """him going into the water: a crown of spray rising and falling back, droplets on real arcs that fall back
    into the water (they end where they meet the surface), and a foam ring spreading out"""
    a = t - t0
    if a < 0 or a > 1.6: return
    # foam ring
    r = 60 + 260 * (1 - math.exp(-a * 2.4))
    fa = max(0.0, 1 - a / 1.6)
    c.drawOval(skia.Rect(cx - r, cy - r * 0.14, cx + r, cy + r * 0.14), SP((250, 254, 255), 10 * fa + 2, 230 * fa))
    rng = np.random.default_rng(5)
    for k in range(26):
        ang = rng.uniform(0, 2 * math.pi)
        bx = cx + r * math.cos(ang); by = cy + r * 0.14 * math.sin(ang)
        c.drawCircle(bx, by, rng.uniform(3, 7) * fa + 1, P((255, 255, 255), 220 * fa))
    # crown of spray: soft translucent water thrown up around him, rounded tips, rising then falling back
    h = 130 * max(0.0, math.sin(min(1.0, a / 0.9) * math.pi))
    for k in range(7):
        x = cx - 180 + k * 60; tilt = (x - cx) * 0.3
        hk = h * (0.55 + 0.45 * math.sin(k * 2.1 + 1))
        if hk < 4: continue
        tip = (x + tilt, cy - hk)
        p = skia.Path(); p.moveTo(x - 30, cy + 6)
        p.cubicTo(x - 26, cy - hk * 0.4, tip[0] - 16, tip[1] + 10, tip[0], tip[1])
        p.cubicTo(tip[0] + 16, tip[1] + 10, x + 26, cy - hk * 0.4, x + 30, cy + 6); p.close()
        c.drawPath(p, P((206, 236, 250), 120))
        c.drawCircle(tip[0], tip[1] + 2, 9, P((236, 250, 255), 200))
    # droplets on ballistic arcs (g in px/s^2), each gone where it lands back in the water
    for k in range(48):
        vx = rng.uniform(-300, 300); vy = rng.uniform(-520, -260); x0 = cx + rng.uniform(-150, 150)
        tt = a - rng.uniform(0, 0.15)
        if tt <= 0: continue
        x = x0 + vx * tt; y = cy + vy * tt + 900 * tt * tt
        if y > cy + 6: continue
        rr = rng.uniform(4, 8)
        c.drawOval(skia.Rect(x - rr * 0.8, y - rr, x + rr * 0.8, y + rr), P((226, 246, 255)))
        c.drawCircle(x - rr * 0.25, y - rr * 0.35, rr * 0.3, P((255, 255, 255)))


def body_pts(kw, hip, rot):
    sh = part_pt(RUN_S, kw, hip, rot, 'sh'); hp = part_pt(RUN_S, kw, hip, rot, 'hip')
    kn = part_pt(RUN_S, kw, hip, rot, 'shin_n'); an = part_pt(RUN_S, kw, hip, rot, 'boot_n')
    nk = part_pt(RUN_S, kw, hip, rot, 'neck0')
    ax, ay = sh[0] - hp[0], sh[1] - hp[1]; L_ = math.hypot(ax, ay) or 1; ax, ay = ax / L_, ay / L_
    return sh, hp, kn, an, nk, (ax, ay), (ay, -ax)


def tub_scene(c, t, phase, wake=0.0, stir=0.0, readout=None, timer=None):
    tent_inside(c, t)
    tub_back(c, t)
    if phase == 'lower':
        hip, rot, u = lower_state(t)
        kw = sheet_kw(t, u)
    else:
        hip, rot, u = HIP_IN, ROT_IN, 1.0
        kw = runner_tub_kw(t, wake, 1.0)
    sh, hp, kn, an, nk, (ax, ay), (nx, ny) = body_pts(kw, hip, rot)
    off = lambda p, k_ax, k_n: (p[0] + ax * k_ax + nx * k_n, p[1] + ay * k_ax + ny * k_n)
    # the sheet: corners beyond his shoulders and his feet, the cloth sagging under his back, hips and knees
    A0 = off(sh, 105, -64); B0 = off(an, -95, -64)
    hold = (sh[0] - 120, 1010)                                  # where the head end medic ends up holding the loop
    s_in = smooth((u - 0.55) / 0.4)
    A = (lerp(A0[0], hold[0], s_in), lerp(A0[1], hold[1], s_in))
    q = smooth((u - 0.7) / 0.25) if phase == 'lower' else 1.0   # the foot end medic lets go and kneels to the water

    def medics():
        bend1 = smooth((A[1] - 960) / 140)
        medic_hold(c, MED1_S, 205, 1250, 1, A, t, extra=dict(lean=lerp(30, 40, bend1), thigh_n=lerp(10, 40, bend1), knee_n=lerp(-14, -70, bend1), thigh_f=lerp(4, 30, bend1), knee_f=lerp(-10, -60, bend1)))
        if q < 1:
            bend2 = max(q, smooth((B0[1] - 960) / 140))
            tgt = (lerp(B0[0], 822, q), lerp(B0[1], WL + 4, q))
            legs = dict(lean=lerp(36, 34, q), thigh_n=lerp(10, 60, bend2), knee_n=lerp(-14, -120, bend2), thigh_f=lerp(4, 40, bend2), knee_f=lerp(-10, -110, bend2))
            medic_hold(c, MED2_S, 935, 1250, -1, tgt, t, extra=legs, both=q < 0.3)
        else:
            sx = 822 + 26 * math.cos(t * 4) * stir; sy = WL + 4 + 10 * math.sin(t * 4) * stir
            medic_hold(c, MED2_S, 935, 1250, -1, (sx, sy), t, extra=dict(lean=34, thigh_n=60, knee_n=-120, thigh_f=40, knee_f=-110), both=False)

    SHEET, SHEET_SH, SHEET_IN = (240, 238, 230), (204, 202, 194), (222, 220, 212)
    if u < 0.55:
        water_top(c, t, stir)
        # the sheet as a hammock: its far edge runs between the held corners, its near edge sags under him
        far = [A, ((A[0] + B0[0]) / 2, (A[1] + B0[1]) / 2 + 30), B0]
        near = [B0, off(an, -40, 40), off(kn, 0, 52), off(hp, 0, 62), off(sh, 0, 52), off(sh, 60, 30), A]
        back = skia.Path(); back.moveTo(*A); back.quadTo(far[1][0], far[1][1], *B0)
        for p in near[1:]: back.lineTo(*p)
        back.close()
        c.drawPath(back, P(SHEET_IN)); c.drawPath(back, SP(SHEET_SH, 3))
        draw_hip(c, RUN_S, kw, hip, rot)
        lip = skia.Path(); lip.moveTo(*A)
        for p in [off(sh, 30, 24), off(hp, 0, 30), off(kn, -10, 22), off(an, -50, 16), B0]: lip.lineTo(*p)
        for p in near[1:-1]: pass
        lip.lineTo(*off(an, -40, 40)); lip.lineTo(*off(kn, 0, 52)); lip.lineTo(*off(hp, 0, 62)); lip.lineTo(*off(sh, 0, 52)); lip.close()
        c.drawPath(lip, P(SHEET)); c.drawPath(lip, SP(SHEET_SH, 3))
        for p0, p1 in ((off(hp, -30, 34), off(hp, -40, 58)), (off(hp, 40, 34), off(hp, 50, 56)), (off(kn, 0, 28), off(kn, 10, 48))):
            c.drawLine(*p0, *p1, SP(SHEET_SH, 3))
        # the corners gathered in the medics' fists
        for P0 in (A, B0):
            c.drawPath(kit.smooth_closed([(P0[0] - 14, P0[1] - 6), (P0[0] + 12, P0[1] - 10), (P0[0] + 16, P0[1] + 14), (P0[0] - 10, P0[1] + 18)]), P(SHEET_SH))
        medics()
    else:
        medics()
        # in the water: his whole body and the sheet are drawn, then the translucent water over them,
        # then everything above the surface again on top
        loose = [off(sh, 0, 34), off(hp, 0, 42), off(kn, 0, 34), (lerp(B0[0], an[0] + 40, q), lerp(B0[1], WL + 30, q))]
        cloth(c, loose, 30, col=(214, 212, 204), sh=(190, 188, 182))
        draw_hip(c, RUN_S, kw, hip, rot)
        water_top(c, t, stir, a=200)
        # the sheet's head end: a towel loop under both armpits, both ends held up behind his head
        c.save(); c.clipRect(skia.Rect(-600, -400, 1700, WL + 4))
        behind = [A, (lerp(A[0], nk[0], 0.45) - 26, lerp(A[1], nk[1], 0.45)), off(nk, -2, 34), off(sh, 0, 40)]
        towel(c, behind)
        c.restore()
        c.save(); c.clipRect(skia.Rect(-600, -400, 1700, WL + 2)); draw_hip(c, RUN_S, kw, hip, rot); c.restore()
        # the front strand: from his hands' grip, past the side of his head, round to the front of his shoulder
        c.save(); c.clipRect(skia.Rect(-600, -400, 1700, WL + 4))
        front = [off(sh, 26, 20), off(sh, 4, -22), off(sh, -26, -18), off(sh, -40, 8)]   # the loop showing round the front of his shoulder
        if s_in > 0.9: towel(c, front, w=24)
        c.restore()
    if phase == 'lower':
        splash(c, t, T_TUB - 0.3, 600, WL + 6)
    tub_front(c, t)


def shot_d(c, t):
    u = (t - T_D) / (T_E - T_D)
    c.save(); kit.push(c, ease_io(u), 540, 1060, 1.35, 1.55, 580, 1080, 540, 1130)
    tub_scene(c, t, 'lower')
    c.restore()


def shot_e(c, t):
    u = (t - T_E) / (T_F - T_E)
    face = part_pt(RUN_S, runner_tub_kw(t, 1.0, 1.0), HIP_IN, ROT_IN, 'head_c')
    k2 = smooth((t - (T_SENSE - 0.7)) / 0.6)
    z = lerp(lerp(1.38, 1.46, ease_io(u)), 2.5, k2); tx = lerp(575, face[0] + 40, k2); ty = lerp(1078, face[1] + 30, k2)
    c.save(); c.translate(540, 1080); c.scale(z, z); c.translate(-tx, -ty)
    k = (t - T_E - 0.6) / (T_DROPF - 0.3 - T_E - 0.6)
    mins = 15 * min(1.0, max(0.0, k)) + 2 * smooth((t - (T_DROPF - 0.3)) / (T_ONCE - 0.15 - (T_DROPF - 0.3)))
    temp = 107.1 - mins / 3.0 * 1.0 * (4.1 / 5.0) * (15 / 15)
    tub_scene(c, t, 'in', wake=smooth((t - (T_SENSE - 0.3)) / 0.6), stir=1.0)
    c.restore()
    kit.L.chip(c, f'{temp:.1f}°F rectal', 430, 1290, OR if temp > 104 else Y, size=56, a=smooth((t - T_E) / 0.3))
    kit.L.chip(c, f'{int(mins):d} min', 830, 1290, Wt, size=46, a=smooth((t - T_E) / 0.3))


def shot_f(c, t):
    """cooling stops near 102 F; outside he is wheeled into the ambulance"""
    if t < T_F:
        u = (t - T_ONCE + 0.15) / (T_F - T_ONCE + 0.15)
        face = part_pt(RUN_S, runner_tub_kw(t, 1.0, 1.0), HIP_IN, ROT_IN, 'head_c')
        k3 = smooth((t - (T_ONCE - 0.15)) / 0.9)
        z = lerp(2.5, 1.48, k3); tx = lerp(face[0] + 40, 575, k3); ty = lerp(face[1] + 30, 1068, k3)
        c.save(); c.translate(540, 1080); c.scale(z, z); c.translate(-tx, -ty)
        tub_scene(c, t, 'in', wake=1.0, stir=1 - smooth((t - T_102) / 0.4))
        c.restore()
        kk = smooth((t - (T_ONCE - 0.15)) / (T_102 - 0.1 - (T_ONCE - 0.15)))
        temp = lerp(107.1 - 17 / 3.0 * (4.1 / 5.0), 102.0, kk); mins = lerp(17, 20, kk)
        ca = 1 - smooth((t - (T_F - 0.35)) / 0.12)      # gone before the zoom cut so they never grow over the captions
        kit.L.chip(c, f'{temp:.1f}°F rectal', 430, 1290, TL if temp <= 102.05 else Y, size=56, a=ca)
        kit.L.chip(c, f'{int(mins):d} min', 830, 1290, Wt, size=46, a=ca)
        return
    load(c, t)


def load(c, t):
    """the wheeled stretcher pushed in through the ambulance's open rear doors by a medic whose hands stay on its
    push rail; the cot slides in only while he pushes"""
    u = (t - T_F) / (T_G - T_F)
    c.save(); kit.push(c, ease_io(min(1, u)), 540, 1080, 1.15, 1.2, 440, 1060, 420, 1060)
    street(c, t)
    AX = 60
    tent_ext(c, t, 400, GROUND_B - 150, 0.8)
    ambulance(c, t, AX, GROUND_B - 60, 0.95, lights=1.0, doors=0.0)
    rear = AX + 300 * 0.95
    top, bot = GROUND_B - 60 - 310 * 0.95, GROUND_B - 60 - 50 * 0.95
    c.drawRect(skia.Rect(rear - 30, top + 6, rear, bot), P((60, 70, 86)))                    # the open rear, dark inside
    p = smooth((t - (T_F + 0.15)) / 1.5)
    sx0 = lerp(rear + 20, rear - 220, p)
    sy = GROUND_B - 190
    a, b2 = (sx0, sy), (sx0 + 400, sy)
    c.save(); c.clipRect(skia.Rect(rear - 30, -400, 2000, 2400))
    lk = dict(runner_tub_kw(t, 1.0, 0.0)); lk.update(neck=-4, blink=(t % 3) < 0.12)
    stretcher_draw(c, a, b2, lk, t, wheels=True)
    c.restore()
    # the rear doors swung fully open, flat out to the sides: from here we see only their edges at the corners
    for (hy0, hy1) in ((top + 8, bot - 4),):
        c.drawRect(skia.Rect(rear - 2, hy0, rear + 12, hy1), P((214, 216, 220)))
        c.drawRect(skia.Rect(rear + 2, hy0 + 30, rear + 10, hy0 + 90), P((120, 160, 190)))
    rail = (b2[0] + 26, sy - 46)
    mx = rail[0] + 110
    kw = dict(face=-1, lean=22, neck=10, hand_n='grip', hand_f='grip', **gait(p * 360, stride=56, amp=18))
    ua, el = arm_to(MED1_S, kw, 'n', (rail[0] - mx, rail[1]), GROUND_B)
    kw.update(uarm_n=ua, elbow_n=el)
    ua, el = arm_to(MED1_S, kw, 'f', (rail[0] - mx + 6, rail[1] + 4), GROUND_B)
    kw.update(uarm_f=ua, elbow_f=el)
    MED1_S.draw(c, A2.Pose(x=mx, ground=GROUND_B, **kw))
    c.restore()


def shot_g(c, t):
    """payoff, both halves: the ambulance drives off with its lights flashing (transport) and pulls away to reveal the
    medical tent with the ice tub behind it (cool first); the camera settles on the tent as the medic walks back in"""
    u = ease_io(min(1.0, max(0.0, (t - T_G - 0.6) / (DUR - 0.4 - T_G - 0.6))))
    z = lerp(1.2, 1.4, u); tx = lerp(220, 400, u); ty = lerp(1060, 1030, u)
    c.save(); c.translate(540, 1080); c.scale(z, z); c.translate(-tx, -ty)
    street(c, t)
    tent_ext(c, t, 400, GROUND_B - 150, 0.8)
    d = max(0.0, t - (T_G + 0.3)); drive = 40 * d * d + 40 * d          # pulls away, speeding up
    ambulance(c, t, 60 - drive, GROUND_B - 60, 0.95, lights=1.0, doors=0.0)
    w = min(330.0, max(0.0, t - (T_G + 0.6)) * 120)
    kw = dict(face=-1, lean=6, look=0.2, br=0.5 + 0.5 * math.sin(t * 2), **gait(w, stride=56, amp=18))
    MED1_S.draw(c, A2.Pose(x=640 - w, ground=GROUND_B, **kw))
    c.restore()


def scene(c, t):
    if t < T_B: shot_a(c, t)
    elif t < T_C: shot_b(c, t)
    elif t < T_D: shot_c(c, t)
    elif t < T_E: shot_d(c, t)
    elif t < T_ONCE - 0.15: shot_e(c, t)
    elif t < T_G: shot_f(c, t)
    else: shot_g(c, t)


SHORT = kit.Short(WD, 'NREMT', TITLES, scene, DUR, T_END, series='EMT TRAPS #3', cuts=(T_B, T_C, T_D, T_G))

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir=sys.argv[sys.argv.index('--dir') + 1] if '--dir' in sys.argv else '/home/claude/w1108/02/stills')
