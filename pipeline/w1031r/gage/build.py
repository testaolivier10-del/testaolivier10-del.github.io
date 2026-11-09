"""w1031-02-phineas-gage, PREMIUM REBUILD (2026-11-09). AP Psychology, real moment from history. All code (skia); every
person is ONE skinned body from the pipeline/people kit (gperson.py adds the 1840s felt hat, brows, the healed entry scar
and the lost left eye); film finish, hard title switches, continuous camera with zoom cuts (kit.py, from w1104).

STORY PREMISES (video standard 5d): a railroad blasting foreman in 1848 is packing blasting powder into a drill hole in rock
with an iron rod; a spark sets the powder off; the rod is driven up through his head and lands far away; he survives and
talks within minutes; the rod went through his left frontal lobe (the brain's planner and brake); before, his bosses called
him their most capable foreman; afterward he swore, brushed off advice and dropped his plans; his friends said he was no
longer Gage. The one idea: the frontal lobe plans ahead and holds back impulses.

SHOT PLAN AND MOTION LIST (for the accuracy check; hands and causes for every action)
A  0.0  rock cut, side view, day. Gage (facing left, so his LEFT side shows all video) packs powder: both hands grip the iron
        every frame (arms solved per frame onto the iron), he leans and pushes it down into the drill hole in the rock ledge
        and lifts it again; the iron moves only with his hands. Grit kicks out of the hole on each push; on one push a tiny
        spark (iron on rock), on "spark" a bigger one. Slow push in. Upper right is calm sky (poll sticker).
B  5.62 the powder goes off: a flash and rock chips out of the hole, smoke swells; the blast drives the iron straight up out
        of the hole TAPERED END FIRST, past his face (the flash covers the instant it passes through his head); he is thrown
        back onto his back, his hat knocked off. The camera tilts up with the iron into the sky; it slows, turns slowly as it
        arcs over (Harlow: it landed point first).
C  10.2 zoom cut to a wide view down the cut: Gage lies on the ledge in front, smoke drifting from the hole; far down the cut
        the iron comes down point first into the ground (dust puff) about 80 ft away.
D  12.4 the camera pushes in on Gage (same place, no cut). On "lived" he stirs and sits up on his own, propped on his hands
        (hands planted on the rock); a worker runs in from the right, feet planted step by step, bends and puts his hand on
        Gage's shoulder (arm solved onto the shoulder every frame); on "talking" Gage's mouth moves.
E  17.4 the push continues to his head. The world dims and an x ray wipes over HIS HEAD ONLY (hat is on the ground, not on
        him): skull with orbit, cheekbone and zygomatic arch, upper and lower jaw with molars, neck vertebrae, brain with
        gyri; the iron's path replays as a ghost iron from under the left cheekbone, behind the left eye, out the top front
        of the skull; on "left frontal lobe" only the left frontal lobe (in front of the central sulcus) lights amber; chips
        PLANS AHEAD and HOLDS BACK IMPULSES on their words. The x ray wipes off.
F1 26.0 zoom cut to the cut on a sunny day, before the accident: Gage holds the plan sheet in both hands; the contractor
        rests a hand on his shoulder (hand on the shoulder every frame) and nods; workers drill in the background.
F2 30.6 zoom cut, same place after the accident, grey light; Gage now has the healed scar under his left cheekbone and his
        left eye shut (he lost it). On "swore" he scowls and snaps; the contractor raises an open hand (advice), Gage turns his
        head away and lifts his near hand to wave it off; on "dropped" his hand opens and the sheet falls to the ground under
        gravity, fluttering.
G  36.3 dusk at the camp: Gage walks off to the left along the cut, feet planted step by step (stride matched to travel); two
        friends in front watch him go. The end line over the last 1.5 s.
Sources: Harlow 1848 and 1868; Macmillan (An Odd Kind of Fame); Ratiu 2004 and Van Horn 2012 CT reconstructions; Wikipedia
(Phineas Gage); AP Psychology CED unit 1 (biological bases: frontal lobes, executive function)."""
import sys, math, os
sys.path[:0] = ['/home/claude/lp/w1031r/gage']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, ease_io, Wt, Y, R, TL, W, H, OR, poly, jag
import airman2 as A
from airman2 import union, inter, diff, curve, HEAD_SHAPES, _hp
import gcast as G

OUTD = '/home/claude/lp/w1031r/out/w1031-02-phineas-gage'
WD = kit.Words(f'{OUTD}/words.json')
at = WD.at
T_SPARK = at('spark'); T_BLAST = at('set') + 0.02; T_SHOT = at('shot'); T_SKULL = at('skull')
T_LANDED = at('landed'); T_EIGHTY = at('eighty'); T_SOMEHOW = at('somehow'); T_LIVED = at('lived'); T_TALK = at('talking')
T_SO = at('so'); T_TORE = at('tore'); T_LEFT = at('left'); T_PLANS = at('plans'); T_HOLDS = at('holds')
T_BEFORE = at('before'); T_CAPABLE = at('capable'); T_AFTER = at('afterward'); T_SWORE = at('swore'); T_BRUSH = at('brushed')
T_ADVICE = at('advice'); T_DROP = at('dropped'); T_AND3 = at('and', 5); T_NO = at('no'); T_GAGE = at('gage', 2)
END = WD.end()
T_END = END + 0.15
DUR = round(END + 1.6, 2)

C_B = T_BLAST                     # blast (shot B starts with no cut: the camera tilts up)
C_C = T_LANDED - 0.04             # zoom cut to the wide view down the cut
C_D = T_SOMEHOW - 0.15            # zoom cut from the landing spot back to Gage by the hole
C_E = T_SO - 0.15                 # (no cut) push continues into the head
C_F1 = T_BEFORE - 0.14
C_F2 = T_AFTER - 0.12
C_G = T_AND3 - 0.1
CUTS = [0.95, C_C, C_D, C_F1, C_F2, C_G]
LAND = T_EIGHTY - 0.02            # the iron hits the ground
APEX = (C_B + LAND) / 2

TITLES = [
    (0.0, [[('PHINEAS GAGE', Y)], [('1848', Wt)]]),
    (at('and') - 0.05, [[('THE IRON ROD', Wt)], [('THROUGH HIS ', Wt), ('SKULL', R)]]),
    (C_C, [[('LANDED ABOUT', Wt)], [('80 FEET', Y), (' AWAY', Wt)]]),
    (T_SOMEHOW, [[('AND HE ', Wt), ('LIVED', Y)]]),
    (T_SO - 0.05, [[('WHAT DID IT', Wt)], [('TAKE FROM HIM?', Y)]]),
    (T_LEFT - 0.1, [[('LEFT', Y), (' FRONTAL LOBE', Wt)]]),
    (C_F1, [[('THE MOST ', Wt), ('CAPABLE', Y)], [('FOREMAN', Wt)]]),
    (C_F2, [[('AFTER: SWORE,', R)], [('BRUSHED OFF ADVICE', Wt)]]),
    (T_DROP - 0.1, [[('DROPPED', R), (' HIS', Wt)], [('PLANS', Wt)]]),
    (C_G, [[('NO LONGER', Wt)], [('GAGE', Y)]]),
]

# ------------------------------------------------------------------ palettes (September 1848, Cavendish, Vermont)
def PAL(mode):
    d = dict(sky0=(104, 158, 214), sky1=(196, 222, 236), hill_far=(150, 178, 170), hill_mid=(104, 140, 108), hill_near=(78, 112, 74),
             tree=(58, 92, 60), tree2=(150, 120, 60), rock=(176, 160, 138), rock_sh=(132, 118, 102), rock_hi=(214, 200, 176),
             rock2=(156, 140, 120), floor=(196, 178, 146), floor_sh=(160, 142, 114), sun=(255, 244, 214), rim=(255, 224, 170),
             light=(0.7, -0.6), dark=(48, 42, 38))
    if mode == 'grey':
        g = (150, 156, 162)
        d = {k: (mix(v, g, 0.45) if isinstance(v, tuple) and len(v) == 3 and k not in ('light',) else v) for k, v in d.items()}
        d['sky0'], d['sky1'] = (128, 138, 150), (178, 184, 190); d['rim'] = (220, 222, 226)
    if mode == 'dusk':
        d = {k: (mix(v, (70, 56, 84), 0.5) if isinstance(v, tuple) and len(v) == 3 and k not in ('light',) else v) for k, v in d.items()}
        d['sky0'], d['sky1'] = (60, 62, 112), (238, 150, 104); d['sun'] = (255, 190, 120); d['rim'] = (255, 170, 110)
        d['light'] = (-0.8, -0.4)
    return d


RS = np.random.default_rng(11)
CLOUDS = [(RS.uniform(-200, 1300), RS.uniform(-2600, 520), RS.uniform(0.7, 1.4)) for _ in range(16)]


def cloud(c, x, y, s, col, a=255):
    for dx, dy, r in ((-70, 10, 46), (-20, -18, 60), (40, -6, 52), (86, 14, 38), (0, 18, 50)):
        c.drawCircle(x + dx * s, y + dy * s, r * s, P(col, a))
    c.drawRect(skia.Rect(x - 110 * s, y + 14 * s, x + 120 * s, y + 52 * s), P(col, a))   # flat soft base
    c.drawCircle(x - 10 * s, y + 30 * s, 52 * s, P(mix(col, (150, 170, 200), 0.25), a * 0.5))


def sky(c, t, p, top=-3000, bot=1500):
    lgrad(c, skia.Rect(-2000, top, 3200, bot), top, 980, [p['sky0'], p['sky0'], p['sky1']], [0, 0.55, 1])
    for x, y, s in CLOUDS:
        xx = (x + 6 * t) % 1700 - 300
        cloud(c, xx, y, s, mix(p['sky1'], (255, 255, 255), 0.6), 230)


# ------------------------------------------------------------------ the side view world (rock cut, day / grey / dusk)
GY = 1360
LEDGE = [(-900, 1330), (-300, 1330), (110, 1300), (250, 1290), (420, 1296), (620, 1310), (760, 1340), (1400, 1350), (1900, 1350)]
HOLE_X = 300
WALL_L = jag([(-400, 560), (-120, 600), (60, 680), (150, 820), (200, 1000), (230, 1140), (260, 1300)], 3, 7, 24)
WALL_R = jag([(780, 1300), (830, 1150), (900, 1010), (1000, 940), (1150, 900), (1500, 880)], 4, 7, 24)
TREES = [(RS.uniform(-900, 1900), RS.uniform(0, 1)) for _ in range(120)]
FG = [(RS.uniform(-200, 1300), RS.uniform(1650, 1950), RS.uniform(40, 120), int(RS.integers(0, 99))) for _ in range(14)]


def hills(c, t, p, par=0.0):
    c.save(); c.translate(-par * 0.3, 0)
    c.drawPath(ridge_path([(-1000, 820), (-500, 820), (0, 760), (300, 800), (640, 720), (1000, 780), (1600, 740), (2000, 760)]), P(p['hill_far']))
    c.drawPath(ridge_path([(-1000, 900), (-500, 900), (100, 850), (500, 890), (800, 840), (1600, 880), (2000, 880)]), P(p['hill_mid']))
    for x, u in TREES:
        y = 880 + 40 * u + (20 * math.sin(x * 0.01))
        col = p['tree'] if u < 0.8 else p['tree2']
        sw = 2 * math.sin(t * 1.3 + x)
        c.drawPath(poly([(x - 14, y + 16), (x + sw, y - 34 - 10 * u), (x + 14, y + 16)]), P(mix(col, p['hill_mid'], 0.35)))
    c.drawPath(ridge_path([(-1000, 960), (-500, 960), (200, 930), (700, 950), (1600, 930), (2000, 930)]), P(p['hill_near']))
    c.restore()


def ridge_path(pts):
    q = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        for k in range(1, 9):
            f = k / 8; q.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - 14 * math.sin(f * math.pi)))
    return poly(q + [(pts[-1][0], 2600), (pts[0][0], 2600)])


def rock_wall(c, pts, side, p):
    x_out = -1000 if side < 0 else 2000
    body = poly(pts + [(x_out, pts[-1][1] + 60), (x_out, pts[0][1])] if side < 0 else pts + [(x_out, pts[-1][1]), (x_out, pts[0][1] + 400)])
    c.drawPath(body, P(p['rock']))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    # strata: slanted bands of a second rock tone, facets lit from the left
    for k in range(9):
        y0 = 560 + k * 92
        band = poly([(-600, y0), (1700, y0 - 120), (1700, y0 - 92), (-600, y0 + 30)])
        c.drawPath(band, P(p['rock2'] if k % 2 else mix(p['rock'], p['rock_hi'], 0.25)))
    # blasting half pipes: the drill holes left on a cut face (vertical grooves)
    xs = [-80, 40, 130, 190] if side < 0 else [860, 960, 1080, 1220]
    for i, x in enumerate(xs):
        top = 640 if side < 0 else 960
        c.drawRect(skia.Rect(x - 7, top + 20 * i, x + 7, GY - 60), P(p['rock_sh'], 150))
        c.drawRect(skia.Rect(x - 7, top + 20 * i, x - 3, GY - 60), P(p['rock_hi'], 120))
    # facet shade along the cut edge
    edge = poly(pts + [(pts[-1][0] - 140 * side, pts[-1][1]), (pts[0][0] - 140 * side, pts[0][1])])
    c.drawPath(edge, P(p['rock_sh'], 110 if side > 0 else 60))
    c.restore()
    c.drawPath(skia.Path(body), SP(p['rock_hi'], 3, 90))


def ledge(c, p):
    pts = jag(LEDGE, 9, 3, 30)
    body = poly(pts + [(1900, 2600), (-900, 2600)])
    lgrad(c, skia.Rect(-1000, 1180, 2000, 2600), 1290, 1800, [p['floor'], p['floor_sh']])
    c.drawPath(body, P(p['rock']))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawPath(poly([(-300, 1300), (1400, 1340), (1400, 1380), (-300, 1350)]), P(p['rock_hi']))
    for k in range(6):
        c.drawPath(poly([(-300 + k * 280, 1420 + 30 * (k % 2)), (-140 + k * 280, 1405), (-40 + k * 280, 1470), (-260 + k * 280, 1490)]), P(p['rock2'], 160))
    c.restore()
    # the drill hole: a dark mouth in the ledge
    c.drawOval(skia.Rect(HOLE_X - 22, GY - 70, HOLE_X + 22, GY - 52), P((30, 24, 22)))
    c.drawOval(skia.Rect(HOLE_X - 22, GY - 72, HOLE_X + 22, GY - 60), P(p['rock_sh']))
    c.drawOval(skia.Rect(HOLE_X - 18, GY - 70, HOLE_X + 18, GY - 58), P((24, 20, 18)))


def props(c, t, p, keg=True, steels=True):
    # powder keg with hoops, a sledge, drill steels leaning on the right wall, a water bucket
    if keg:
        kx, ky = 760, 1338
        body = smooth_closed([(kx - 46, ky), (kx - 54, ky - 60), (kx - 46, ky - 120), (kx + 46, ky - 120), (kx + 54, ky - 60), (kx + 46, ky)])
        flat(c, body, (128, 86, 54), (96, 62, 38), (10, 0), p['rim'], (-3, 0), 160)
        for yy in (ky - 22, ky - 98):
            c.drawRect(skia.Rect(kx - 50, yy - 5, kx + 50, yy + 5), P((70, 66, 64)))
        c.drawOval(skia.Rect(kx - 46, ky - 128, kx + 46, ky - 112), P((150, 104, 66)))
        c.drawOval(skia.Rect(kx - 70, ky - 8, kx + 70, ky + 10), P((40, 30, 24), 70, MaskFilter=blur(6)))
    for i, x in enumerate((-10, 15, 42) if steels else ()):
        c.drawLine(x, GY - 20, x + 40 + 6 * i, GY - 300 + 20 * i, SP((70, 72, 78), 9))
        c.drawLine(x - 2, GY - 20, x + 38 + 6 * i, GY - 300 + 20 * i, SP((130, 134, 140), 2.5, 180))
    c.drawLine(560, GY - 6, 680, GY - 26, SP((120, 84, 50), 10))      # sledge handle on the ground
    c.drawRect(skia.Rect(670, GY - 46, 712, GY - 14), P((64, 66, 72)))


def fg_rocks(c, t, p, dx=0.0):
    kit.blur_layer(c, 10)
    for x, y, r, s in FG:
        rr = np.random.default_rng(s)
        pts = [(x + dx + r * math.cos(a) * rr.uniform(0.8, 1.15), y + r * 0.6 * math.sin(a) * rr.uniform(0.8, 1.1)) for a in np.linspace(0, 2 * math.pi, 9)[:-1]]
        flat(c, smooth_closed(pts), mix(p['rock_sh'], p['rock'], 0.3), p['rock_sh'], (12, 6))
    c.restore()


def motes(c, t, p, region=(0, 700, 1080, 1500), n=30, a=120):
    rs = np.random.default_rng(5)
    for k in range(n):
        x0, y0 = rs.uniform(region[0], region[2]), rs.uniform(region[1], region[3])
        x = x0 + 30 * math.sin(t * 0.3 + k); y = y0 - (t * 12 + k * 40) % 200
        c.drawCircle(x, y, rs.uniform(1.5, 3.5), P(mix(p['sun'], (255, 255, 255), 0.3), a * (0.5 + 0.5 * math.sin(t + k))))


def side_world(c, t, mode='day', keg=True, fg=True, steels=True):
    p = PAL(mode)
    sky(c, t, p)
    if mode == 'dusk': kit_sun(c, 260, 900, p, r=90)
    hills(c, t, p)
    rock_wall(c, WALL_L, -1, p)
    rock_wall(c, WALL_R, 1, p)
    ledge(c, p)
    props(c, t, p, keg, steels)
    return p


def kit_sun(c, x, y, p, r=60):
    c.drawCircle(x, y, r * 3.2, P(p['sun'], 50, MaskFilter=blur(r)))
    c.drawCircle(x, y, r, P(p['sun']))


# ------------------------------------------------------------------ the tamping iron (3 ft 7 in, 1.25 in, last foot tapers)
def iron(c, base, ang, Lr, wr, a=255, mode='day'):
    """the iron from its blunt end at base, pointing at angle ang (radians, 0 = up); the last 28 percent tapers to a point"""
    ux, uy = math.sin(ang), -math.cos(ang); nx, ny = -uy, ux
    bx, by = base; tp = 0.72
    pts = [(bx + nx * wr / 2, by + ny * wr / 2), (bx + ux * Lr * tp + nx * wr / 2, by + uy * Lr * tp + ny * wr / 2),
           (bx + ux * Lr + nx * 1.5, by + uy * Lr + ny * 1.5), (bx + ux * Lr - nx * 1.5, by + uy * Lr - ny * 1.5),
           (bx + ux * Lr * tp - nx * wr / 2, by + uy * Lr * tp - ny * wr / 2), (bx - nx * wr / 2, by - ny * wr / 2)]
    body = poly(pts)
    c.drawPath(body, P((70, 72, 78), a))
    hl = poly([(bx + nx * wr * 0.32, by + ny * wr * 0.32), (bx + ux * Lr * tp + nx * wr * 0.32, by + uy * Lr * tp + ny * wr * 0.32),
               (bx + ux * Lr * 0.98 + nx * 0.5, by + uy * Lr * 0.98 + ny * 0.5), (bx + ux * Lr * tp + nx * wr * 0.1, by + uy * Lr * tp + ny * wr * 0.1),
               (bx + nx * wr * 0.1, by + ny * wr * 0.1)])
    c.drawPath(hl, P((176, 182, 192), a * 0.8))
    sh = poly([(bx - nx * wr * 0.2, by - ny * wr * 0.2), (bx + ux * Lr * tp - nx * wr * 0.2, by + uy * Lr * tp - ny * wr * 0.2),
               (bx + ux * Lr * tp - nx * wr / 2, by + uy * Lr * tp - ny * wr / 2), (bx - nx * wr / 2, by - ny * wr / 2)])
    c.drawPath(sh, P((40, 42, 48), a))
    return (bx + ux * Lr, by + uy * Lr)


# ------------------------------------------------------------------ Gage tamping (shot A) and the blast (B)
K_A = 0.56
GAGE = G.gage(K_A)
GAGE_NH = G.gage(K_A, hat=None)
ROD_L = 0.65 * 1365 * K_A * 0.98       # 3 ft 7 in on a 5 ft 6 in man
ROD_W = 16
GX = HOLE_X + 119                      # refined below so the iron's line passes just under his left cheekbone
ROD_B = GY + 90                        # the blunt end deep in the drill hole, on the powder (hidden below the mouth)
HOLE_Y = GY - 64


T_STROKE = 1.15
def tamp_off(t):
    """how far the iron is lifted above the bottom of its stroke (px): a clear lift, then a firm push down, one stroke a
    little over a second; still at the bottom when the spark comes"""
    if t >= T_SPARK - 0.05: return 0.0
    ph = (t / T_STROKE + 0.25) % 1.0
    v = 86 * (0.5 - 0.5 * math.cos(ph / 0.62 * math.pi)) if ph < 0.62 else 86 * (1 - smooth((ph - 0.62) / 0.28))
    return v * (1 - smooth((t - (T_SPARK - 0.5)) / 0.42))      # the last push ends at the bottom as the spark comes


HEAD_DOWN = 24          # his head is turned down to the hole he is packing


def _fist_center(who, ps, side):
    b = near_hand_path(who, ps, side).computeTightBounds()
    return ((b.left() + b.right()) / 2, (b.top() + b.bottom()) / 2)


_TC = {}
def tamp_kw(key):
    """pose for a lift of key px: both fists closed around the iron (solved, then corrected on the drawn fist centres)"""
    if key not in _TC:
        base_y = ROD_B - key
        lean = 34 - 0.10 * key
        kw = dict(face=-1, lean=lean, neck=10, thigh_n=-4, knee_n=-12 - 0.12 * key, thigh_f=16, knee_f=-14 - 0.12 * key,
                  hand_n='grip', hand_f='grip', x=GX)
        out = dict(kw)
        for side, f in (('n', 0.64), ('f', 0.82)):
            tgt = (HOLE_X, base_y - ROD_L * f)
            for it in range(3):
                u, e, _ = G.arm_to(GAGE, kw, side, tgt, GY, gd=40)
                k2 = dict(out, **{'uarm_' + side: u, 'elbow_' + side: e})
                ps = A.Pose(ground=GY, **k2); ps.head_abs = HEAD_DOWN
                cx, cy = _fist_center(GAGE, ps, side)
                want = (HOLE_X, base_y - ROD_L * f)
                tgt = (tgt[0] + (want[0] - cx), tgt[1] + (want[1] - cy))
            out = k2
        _TC[key] = out
    return _TC[key]


def tamp_pose(t):
    key = int(round(tamp_off(t)))
    ps = A.Pose(ground=GY, br=math.sin(t * 2.4) * 0.5, blink=int(t * 10) % 37 == 0, **tamp_kw(key))
    ps.head_abs = HEAD_DOWN
    return ps, ROD_B - key


def _cheek_dx():
    kw = dict(face=-1, lean=34, neck=10, thigh_n=-4, knee_n=-12, thigh_f=16, knee_f=-14, x=0)
    ps = A.Pose(ground=GY, **kw); ps.head_abs = HEAD_DOWN; J = GAGE.joints(ps); h = GAGE._hf(J)
    return GAGE.canvas_pt(ps, h(*_hp((206, 196))))[0]


def near_hand_path(who, ps, side='n'):
    J = who.joints(ps); h, _ = who._hand(J, side, ps)
    m = skia.Matrix(); m.setTranslate(ps.x, ps.ground); m.preScale(ps.s * who.k * ps.face, ps.s * who.k)
    q = skia.Path(h); q.transform(m); return q


GX = HOLE_X - _cheek_dx()


def draw_tamp(c, t):
    ps, by = tamp_pose(t)
    GAGE.draw(c, ps, light=(0.7, -0.6), rim=(255, 224, 170))
    # the far fist is redrawn over his chest so it reads clearly around the iron; the iron passes in front of it and behind
    # the near fist
    fh = near_hand_path(GAGE, ps, 'f'); sk = GAGE.pc(A.SKIN); sks = GAGE.pc(A.SKIN_SH)
    c.drawPath(fh, P(mix(sk, (60, 50, 50), 0.12))); q = skia.Path(fh); q.offset(8, -6); c.drawPath(diff(fh, q), P(sks))
    c.save(); c.clipPath(near_hand_path(GAGE, ps), skia.ClipOp.kDifference, True)
    c.clipRect(skia.Rect(-4000, -4000, 4000, HOLE_Y + 4))
    iron(c, (HOLE_X, by), 0.0, ROD_L, ROD_W)
    c.restore()
    # grit puffs from the hole at the bottom of each push; a tiny spark early (iron on rock); the big one on "spark"
    ph = (t / T_STROKE + 0.25) % 1.0
    if t < T_SPARK - 0.05 and (0.86 < ph or ph < 0.12):
        u = ((ph - 0.86) % 1.0) / 0.26
        for k in range(7):
            a = -math.pi / 2 + (k - 3) * 0.42
            c.drawCircle(HOLE_X + math.cos(a) * 46 * u, GY - 62 + math.sin(a) * 30 * u + 40 * u * u, 4 + 6 * u, P((196, 180, 150), 150 * (1 - u), MaskFilter=blur(3)))
    for ts, n, sc in ((1.75, 5, 0.6), (T_SPARK - 0.04, 14, 1.0)):
        if ts <= t < ts + 0.45: sparks(c, t - ts, HOLE_X, GY - 64, n, sc)


def sparks(c, u, x, y, n, sc):
    rs = np.random.default_rng(int(n * 7))
    for k in range(n):
        a = rs.uniform(-2.7, -0.4); v = rs.uniform(300, 700) * sc
        px = x + math.cos(a) * v * u; py = y + math.sin(a) * v * u + 900 * u * u
        tail = 0.03
        qx = x + math.cos(a) * v * (u - tail); qy = y + math.sin(a) * v * (u - tail) + 900 * (u - tail) ** 2
        al = 255 * max(0, 1 - u / 0.45)
        c.drawLine(qx, qy, px, py, SP((255, 236, 160), 3.2 * sc, al))
        c.drawCircle(px, py, 4 * sc, P((255, 250, 220), al))
    c.drawCircle(x, y, 40 * sc, P((255, 220, 140), 160 * max(0, 1 - u / 0.3), MaskFilter=blur(14)))


# iron flight in shot B: launched straight up out of the hole by the blast, tapered end first; it slows, turns over at the top
APEX_Y = -300
T_APEX = C_B + 2.9


T_PASS = 0.27          # the blast drives it up through his head over about 8 frames (drawn, not hidden)
V_PASS = 1600.0


def flight(t):
    d = t - C_B
    y0 = ROD_B - ROD_L / 2
    if d < T_PASS:
        return HOLE_X, y0 - V_PASS * d, 0.0
    y1 = y0 - V_PASS * T_PASS
    u = min(1.0, (d - T_PASS) / (T_APEX - C_B - T_PASS))
    y = y1 + (APEX_Y - y1) * (1 - (1 - u) ** 5)
    if d > T_APEX - C_B:
        e = d - (T_APEX - C_B); y = APEX_Y + 380 * e * e
    x = HOLE_X - 40 * u - 30 * max(0, d - (T_APEX - C_B))
    ang = math.pi * smooth(min(1, max(0, (d - 1.4) / 2.2)))
    return x, y, ang


def thrown(t):
    """he is thrown back off his feet: pivot at the heels, rotating back (to the right) toward the ground"""
    u = smooth((t - C_B - T_PASS) / 0.55)
    return 80 * u, 140 * u


def draw_blast(c, t, p):
    d = t - C_B
    rs = np.random.default_rng(4)
    for k in range(18):          # smoke: swelling, drifting puffs rising from the hole, grey white, soft
        tk = d - k * 0.04
        if tk <= 0: continue
        r = 26 + 170 * (1 - math.exp(-tk * 1.4)) * rs.uniform(0.6, 1.1)
        x = HOLE_X + rs.uniform(-130, 130) * (1 - math.exp(-tk)) + 30 * tk
        y = GY - 80 - rs.uniform(60, 460) * (1 - math.exp(-tk * 1.2)) - 20 * tk
        col = mix((240, 234, 224), (150, 140, 130), rs.uniform(0, 0.6))
        c.drawCircle(x, y, r, P(col, 215 * min(1, tk * 6) * max(0, 1 - tk / 7), MaskFilter=blur(10 + 6 * tk)))
    if d < 1.4:                  # rock chips thrown out of the hole
        for k in range(18):
            a = rs.uniform(-2.9, -0.25); v = rs.uniform(500, 1200)
            x = HOLE_X + math.cos(a) * v * d; y = GY - 64 + math.sin(a) * v * d + 1400 * d * d
            if y < GY + 40:
                c.drawPath(poly([(x - 6, y), (x, y - 7), (x + 7, y + 2), (x, y + 6)]), P(p['rock_sh']))
    if d < 0.5:                  # the flash
        a = max(0, 1 - d / 0.5)
        c.drawRect(skia.Rect(HOLE_X - 90, GY - 1300, HOLE_X + 90, GY - 60), P((255, 248, 226), 255 * max(0, 1 - d / 0.2), MaskFilter=blur(24)))
        c.drawCircle(HOLE_X, GY - 700, 220, P((255, 248, 226), 255 * max(0, 1 - d / 0.16), MaskFilter=blur(40)))
        c.drawCircle(HOLE_X, GY - 160, 160 + 700 * d, P((255, 236, 190), 230 * a, MaskFilter=blur(40)))
        c.drawCircle(HOLE_X, GY - 90, 70 + 260 * d, P((255, 250, 235), 255 * a, MaskFilter=blur(14)))


def head_path(who, ps):
    J = who.joints(ps); h = who._hf(J)
    q = union([curve([h(*_hp(p)) for p in HEAD_SHAPES[k]]) for k in ('skin', 'hair', 'hairtop', 'ear')])
    m = skia.Matrix(); m.setTranslate(ps.x, ps.ground); m.preScale(ps.s * who.k * ps.face, ps.s * who.k)
    q.transform(m); return q


def draw_gage_A(c, t):
    if t < C_B + T_PASS:
        if t < C_B:
            draw_tamp(c, t); return
        # the instant of the injury: he is still bent over the hole; the iron goes in under his left cheekbone and comes
        # out of the top of his skull, tapered end first (drawn inside the head as hidden, entering and leaving)
        ps, by = tamp_pose(C_B - 0.01)
        ps.hand_n = ps.hand_f = 'relaxed'; ps.smile = -0.6; ps.blink = True; ps.mouth = 0.3
        GAGE.draw(c, ps, light=(0.7, -0.6), rim=(255, 224, 170))
        x, y, ang = flight(t)
        hp = head_path(GAGE, ps)
        c.save(); c.clipPath(hp, skia.ClipOp.kDifference, True); c.clipRect(skia.Rect(-4000, -4000, 4000, HOLE_Y + 4))
        iron(c, (x, y + ROD_L / 2), 0.0, ROD_L, ROD_W)
        c.restore()
        # where it passes through, a dark red wound band shows on his cheek
        J = GAGE.joints(ps); hh = GAGE._hf(J); ex, ey = GAGE.canvas_pt(ps, hh(*_hp((206, 196))))
        if y - ROD_L / 2 < ey: c.drawCircle(ex, ey, 6, P((110, 18, 28), 230))
        return
    ang, dx = thrown(t)
    k = smooth((t - C_B) / 0.3)
    ps = A.Pose(x=GX, ground=GY, face=-1, lean=lerp(32, -6, k), neck=lerp(10, -20, k), thigh_n=-6, knee_n=-6, thigh_f=8, knee_f=-6,
                uarm_n=lerp(40, -40, k), elbow_n=lerp(60, 30, k), uarm_f=lerp(50, -30, k), elbow_f=lerp(60, 40, k), hand_n='relaxed', hand_f='relaxed', blink=True)
    c.save(); c.translate(dx, 0); c.translate(GX + 50, GY); c.rotate(ang); c.translate(-GX - 50, -GY)
    GAGE_NH.draw(c, ps, light=(0.7, -0.6), rim=(255, 224, 170), shadow=False)
    c.restore()
    d = t - C_B - T_PASS    # his hat knocked up off his head by the iron, tumbling back
    hx0, hy0 = HOLE_X + 40, GY - 1230 * K_A
    draw_hat(c, hx0 + 220 * d, hy0 - 700 * d + 900 * d * d, 0.9 * K_A, 380 * d)


def draw_hat(c, x, y, s, rot, col=(112, 78, 52)):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * 1.25, s * 1.25)
    cr = curve([(px - 170, py - 100) for px, py in HEAD_SHAPES['felt_crown']])
    br = curve([(px - 170, py - 100) for px, py in HEAD_SHAPES['felt_brim']])
    c.drawPath(br, P(mix(col, (0, 0, 0), 0.05))); c.drawPath(cr, P(col))
    c.save(); c.clipPath(cr, skia.ClipOp.kIntersect, True)
    c.drawPath(curve([(px - 170, py - 100) for px, py in HEAD_SHAPES['felt_band']]), P(mix(col, (30, 20, 16), 0.6)))
    q = skia.Path(cr); q.offset(10, 6); c.drawPath(diff(cr, q), P(tuple(int(v * 0.75) for v in col))); c.restore()
    c.restore()


T_TEASE = 0.95


def shot_teaser(c, t):
    """0 to 0.95 s: the injury itself in slow motion, close on his head (the hook), before the story starts"""
    tt = C_B + 0.16 + 0.07 * (t / T_TEASE)
    ps, _ = tamp_pose(C_B - 0.01)
    J = GAGE.joints(ps); hx, hy = GAGE.canvas_pt(ps, J['head_piv'])
    z = 2.3 + 0.25 * (t / T_TEASE)
    c.save(); c.translate(540, 980); c.scale(z, z); c.translate(-(hx + 10), -(hy + 10))
    p = side_world(c, tt, 'day')
    draw_blast(c, tt, p)
    draw_gage_A(c, tt)
    c.restore()
    # the blast lights him from below
    c.drawRect(skia.Rect(0, 900, W, H), skia.Paint(Shader=skia.GradientShader.MakeLinear([(0, 900), (0, 1700)], [skia.Color(255, 220, 150, 0), skia.Color(255, 230, 170, 200)])))


def shot_AB(c, t):
    if t < T_TEASE: return shot_teaser(c, t)
    # camera: a slow push toward his hands and the hole; from the blast it tilts up with the iron into the sky
    if t < C_B:
        u = ease_io((t - 0.95) / (C_B - 0.95))
        z = lerp(1.2, 1.32, u); cx = lerp(470, 440, u); cy = lerp(1010, 1050, u)
    else:
        x, y, _ = flight(t)
        # pull back and tilt up: the whole cut below, the smoke rising, the iron high above it
        d = t - C_B
        k1 = ease_io((d - 0.15) / 0.9); k2 = ease_io((d - 1.0) / 1.0); k3 = ease_io((d - 2.0) / 1.6)
        z = lerp(lerp(1.32, 0.62, k1), 0.5, k2); cx = lerp(440, 600, k1); cy = lerp(lerp(1050, 1080, k1), 380, k2)
        z = lerp(z, 1.05, k3); cx = lerp(cx, x + 60, k3); cy = lerp(cy, y + 30, k3)
        if t > C_C - 0.45: pass
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    p = side_world(c, t, 'day')
    motes(c, t, p)
    if t >= C_B: draw_blast(c, t, p)
    draw_gage_A(c, t)
    if C_B + T_PASS <= t < C_B + T_PASS + 0.2:
        d = t - C_B - T_PASS; a = max(0, 1 - d / 0.2)
        c.drawRect(skia.Rect(HOLE_X - 110, GY - 1400, HOLE_X + 110, GY - 60), P((255, 250, 232), 255 * a, MaskFilter=blur(26)))
        c.drawCircle(HOLE_X + 10, GY - 690, 190, P((255, 250, 232), 255 * a, MaskFilter=blur(30)))
    if t >= C_B:
        x, y, ang = flight(t)
        base = (x - math.sin(ang) * ROD_L / 2, y + math.cos(ang) * ROD_L / 2)
        if t >= C_B + T_PASS: iron(c, base, ang, ROD_L, ROD_W)
    if t < C_B + 0.5: fg_rocks(c, t, p)
    c.restore()


# ------------------------------------------------------------------ C: where it landed, about 80 feet away (perspective)
# low camera beside the landing spot, looking back up the cut toward the blast site; the iron slams in point first in the
# foreground, and far up the cut (80 ft) Gage lies by the smoking hole
VPX, VPY = 560, 1000


def proj(x, d, y=0.0, f=1150.0, h=2.2):
    """lateral x (ft, + right), distance d (ft), height y (ft) -> screen"""
    return VPX + f * x / d, VPY + f * (h - y) / d


def cut_world(c, t, p):
    sky(c, t, p, top=-600, bot=1400)
    c.save(); c.translate(0, 180); hills(c, t, p); c.restore()
    # floor: the graded bed of the cut, gravel and stones bigger as they come closer
    fl = poly([proj(-9, 400), proj(9, 400), proj(40, 3), proj(-40, 3)])
    c.save(); c.clipPath(fl, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(-400, VPY, 1500, 2400), VPY, 1900, [mix(p['floor'], p['sky1'], 0.35), p['floor'], p['floor_sh']])
    rs = np.random.default_rng(31)
    for k in range(120):
        x, d = rs.uniform(-9, 9), rs.uniform(4, 140)
        sx, sy = proj(x, d); r = 1200 * rs.uniform(0.06, 0.2) / d
        c.drawOval(skia.Rect(sx - r, sy - r * 0.5, sx + r, sy + r * 0.4), P(mix(p['rock_sh'], p['floor'], rs.uniform(0, 0.5))))
    for x in (-3.2, 3.0):        # cart ruts
        c.drawPath(poly([proj(x - 0.3, 300), proj(x + 0.3, 300), proj(x + 0.6, 4), proj(x - 0.6, 4)]), P(p['floor_sh'], 120))
    c.restore()
    # the two rock walls: blocky faces receding in steps, each block a lit facet and a shade facet, with drill grooves
    for side in (-1, 1):
        rs = np.random.default_rng(40 + side)
        dists = [300, 150, 90, 60, 40, 28, 19, 13, 9, 6, 4.2, 3]
        for i in range(len(dists) - 1):
            d0, d1 = dists[i], dists[i + 1]
            hgt0 = 15 + rs.uniform(-2, 3); hgt1 = 15 + rs.uniform(-2, 3)
            x0 = side * (9 + rs.uniform(0, 1.2)); x1 = side * (9 + rs.uniform(0, 1.2))
            # a jagged blasted top edge (no flat caps), facets in two tones, strata, drill grooves and cracks
            nj = 7; top_pts = []
            for j in range(nj + 1):
                f = j / nj; dd = d0 + (d1 - d0) * f; xx = x0 + (x1 - x0) * f
                top_pts.append(proj(xx, dd, hgt0 + (hgt1 - hgt0) * f + rs.uniform(-1.6, 1.6)))
            face = poly([proj(x0, d0, 0), proj(x1, d1, 0)] + top_pts[::-1])
            lit = p['rock'] if side < 0 else mix(p['rock'], p['rock_sh'], 0.45)
            haze = 0.5 * (1 - min(1, 30 / d0))
            c.drawPath(face, P(mix(mix(lit, p['rock2'], rs.uniform(0, 0.5)), p['sky1'], haze)))
            c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
            for j in range(3):          # big angled facets
                f0 = rs.uniform(0, 0.7); f1 = f0 + rs.uniform(0.2, 0.4)
                da, db = d0 + (d1 - d0) * f0, d0 + (d1 - d0) * f1; xa, xb = x0 + (x1 - x0) * f0, x0 + (x1 - x0) * f1
                ya, yb = rs.uniform(1, 12), rs.uniform(1, 12)
                c.drawPath(poly([proj(xa, da, ya), proj(xb, db, yb), proj(xb, db, yb + 4), proj(xa, da, ya + 6)]),
                           P(mix(p['rock_sh'] if j % 2 else p['rock_hi'], p['sky1'], haze), 120))
            for j in range(4):
                yy = 2 + j * 3.4
                c.drawPath(poly([proj(x0, d0, yy), proj(x1, d1, yy + 0.6), proj(x1, d1, yy + 1.0), proj(x0, d0, yy + 0.4)]), P(p['rock2'], 90))
            if rs.uniform() < 0.35:
                f = rs.uniform(0.2, 0.8); dd = d0 + (d1 - d0) * f; xx = x0 + (x1 - x0) * f
                c.drawLine(*proj(xx, dd, 0.3), *proj(xx, dd, 6 + rs.uniform(0, 5)), SP(p['rock_sh'], max(1.0, 40 / dd), 110))
            c.restore()
            # grass and scrub along the top edge
            gp = poly(top_pts + [(x, y - 900 / max(d0, 4)) for x, y in top_pts[::-1]])
            c.drawPath(gp, P(mix(p['hill_near'], p['sky1'], haze)))
            if i % 2 == 0:    # rubble at the foot of the wall
                for j in range(3):
                    dd = d0 + (d1 - d0) * (j + 0.5) / 3
                    sx, sy = proj(x1 - side * 0.6, dd); r = 600 / dd
                    c.drawPath(smooth_closed([(sx - r, sy), (sx - r * 0.4, sy - r * 0.8), (sx + r * 0.6, sy - r * 0.5), (sx + r, sy)]), P(p['rock_sh']))
    # trees along the top of the cut, hazy with distance
    for side in (-1, 1):
        for k in range(10):
            d = 20 + k * 22; sx, sy = proj(side * (14 + (k % 3)), d, 15)
            r = 2600 / d
            c.drawPath(poly([(sx - r * 0.6, sy), (sx, sy - r * 2.2), (sx + r * 0.6, sy)]), P(mix(p['tree'], p['sky1'], min(0.7, d / 260))))


LAND_XD = (1.0, 8.0)        # the landing spot, near the camera (lateral ft, distance ft)
GAGE_XD = (-1.0, 88.0)      # Gage lying by the hole, about 80 ft up the cut


def iron_C(c, t, p):
    sx, sy = proj(*LAND_XD)
    s = 1150 / LAND_XD[1] * 3.6 / ROD_L      # the iron is 3.6 ft long at this distance
    Lr = ROD_L * s; wr = max(4, ROD_W * s)
    lean = 0.22
    if t < LAND:
        u = (t - (LAND - 0.45)) / 0.45
        if u < 0: return
        y = sy - 1400 * (1 - u) ** 2
        x = sx + 60 * (1 - u)
        iron(c, (x + math.sin(lean) * Lr, y - math.cos(lean) * Lr), math.pi + lean, Lr, wr)
        return
    d = t - LAND
    wob = 0.06 * math.exp(-d * 5) * math.sin(d * 34)
    dep = 0.14 * Lr                          # the point buried in the ground
    c.drawOval(skia.Rect(sx - 60, sy - 8, sx + 70, sy + 12), P((60, 50, 40), 100, MaskFilter=blur(6)))
    iron(c, (sx + math.sin(lean + wob) * (Lr - dep), sy - math.cos(lean + wob) * (Lr - dep)), math.pi + lean + wob, Lr, wr)
    rs = np.random.default_rng(8)
    for k in range(18):      # dust kicked up, soft and ragged, settling
        a = rs.uniform(-3.0, -0.1); v = rs.uniform(40, 140)
        c.drawCircle(sx + math.cos(a) * v * (1 + d), sy + math.sin(a) * v * 0.5 * (1 + d) - 14 * d,
                     rs.uniform(10, 26) * (1 + d), P((214, 198, 168), 160 * max(0, 1 - d / 2.0), MaskFilter=blur(8 + 6 * d)))
    for k in range(10):      # grit thrown out
        a = rs.uniform(-2.8, -0.3); v = rs.uniform(200, 420)
        if d < 0.6:
            c.drawCircle(sx + math.cos(a) * v * d, sy + math.sin(a) * v * d + 900 * d * d, 4, P(p['rock_sh']))


GC = G.gage(1150 / GAGE_XD[1] * 5.5 / (1365) * 1.0, hat=None)


def gage_far(c, t, p):
    # Gage on his back by the hole, small and far up the cut, smoke still drifting
    sx, sy = proj(*GAGE_XD)
    rs = np.random.default_rng(12)
    for k in range(6):
        tk = (t - C_C) * 0.4 + k * 0.7
        c.drawCircle(sx - 30 + 18 * tk, sy - 30 - 40 * (tk % 3), 18 + 16 * (tk % 3), P((236, 230, 222), 90 * max(0, 1 - (tk % 3) / 3), MaskFilter=blur(8)))
    ps = A.Pose(x=sx, ground=sy, face=-1, lean=-84, neck=-10, thigh_n=86, knee_n=-4, thigh_f=82, knee_f=-10, ank_n=-78, ank_f=-70,
                uarm_n=82, elbow_n=4, uarm_f=86, elbow_f=2, hand_n='flat', hand_f='flat', blink=True)
    ps.ground = sy + 4; ps.head_abs = -78
    GC.draw(c, ps, light=(0.7, -0.6), rim=(255, 224, 170), shadow=False)


def shot_C(c, t):
    p = PAL('day')
    u = (t - C_C) / (C_D - C_C)
    # a slow push up the cut toward him, accelerating into the zoom cut
    z = 1.0 + 0.08 * u + 0.5 * max(0, (u - 0.75) / 0.25) ** 2
    gx, gy = proj(*GAGE_XD)
    cx = lerp(560, gx, smooth((u - 0.5) / 0.5)); cy = lerp(1000, gy, smooth((u - 0.5) / 0.5))
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    cut_world(c, t, p)
    gage_far(c, t, p)
    iron_C(c, t, p)
    c.restore()


# ------------------------------------------------------------------ D/E: back by the hole (side view), he sits up; x ray
K_D = 0.5
GD = G.gage(K_D, hat=None)
WA = G.worker_a(0.5)
WB = G.worker_b(0.46)
G_HIP = (700, GY - 6)        # where he lies on the ledge, feet toward the hole


def sit_amt(t):
    return smooth((t - T_LIVED - 0.2) / 1.1)


def plant_amt(t):
    return smooth((t - T_LIVED + 0.45) / 0.4)


def gage_D_pose(t):
    s = sit_amt(t)
    lean = lerp(-84, -14, s)
    talk = 0.0
    if t > T_TALK - 0.05: talk = 0.35 + 0.35 * math.sin(t * 17) * math.sin(t * 5.3)
    off = lerp(40, 84, s) * K_D     # hip height: on his back, then sitting on the rock
    kw = dict(face=-1, lean=lean, neck=lerp(-10, 8, s), thigh_n=86, knee_n=-4, thigh_f=82, knee_f=-10, ank_n=-78, ank_f=-70,
              hand_n='flat', hand_f='flat', blink=(t < T_LIVED + 0.05) or (int(t * 10) % 31 == 0), mouth=max(0, talk), x=G_HIP[0])
    g = G_HIP[1] + off
    pl = plant_amt(t)
    if pl > 0.001:   # first both palms go flat onto the rock beside his hips, then he pushes himself up on them (fixed spots)
        tn = (G_HIP[0] + 70, G_HIP[1] - 2); tf = (G_HIP[0] + 92, G_HIP[1] - 4)
        un, en, _ = G.arm_to(GD, dict(kw), 'n', tn, g, key=('dn', round(s, 2)), gd=20)
        uf, ef, _ = G.arm_to(GD, dict(kw), 'f', tf, g, key=('df', round(s, 2)), gd=20)
        kw.update(uarm_n=lerp(82, un, pl), elbow_n=lerp(4, en, pl), uarm_f=lerp(86, uf, pl), elbow_f=lerp(2, ef, pl))
    else:          # flat on his back: arms lie along his sides on the rock
        kw.update(uarm_n=82, elbow_n=4, uarm_f=86, elbow_f=2)
    ps = A.Pose(ground=g, br=0.6 * math.sin(t * 2.6), **kw)
    ps.head_abs = lerp(-78, None or (-lean + kw['neck']), s)     # on his back his face looks up; it follows the body as he sits up
    return ps


def shoulder_pt(who, ps):
    J = who.joints(ps); return who.canvas_pt(ps, J['torso_f'](-10, 300))


WA_STOP = G_HIP[0] + 300


def run_kw(d, stride, amp=26):
    ph = d / stride * math.pi; s = math.sin(ph); co = math.cos(ph)
    # the swinging leg (thigh moving forward) lifts its knee; the stance leg stays long and planted
    return dict(face=-1, lean=14, thigh_n=10 + amp * s, knee_n=-10 - 50 * max(0.0, co), thigh_f=10 - amp * s, knee_f=-10 - 50 * max(0.0, -co),
                uarm_n=-30 * s, elbow_n=70, uarm_f=30 * s, elbow_f=70, hand_n='fist', hand_f='fist')


def worker_D(c, t, gps):
    """worker A runs in from the right (stride matched to travel), stops behind Gage, bends and puts his hand on his
    shoulder; the hand stays on the shoulder every frame after"""
    t0 = T_LIVED - 0.1; start = 1500; speed = 560.0
    if t < t0: return
    d = min(start - WA_STOP, (t - t0) * speed); x = start - d
    stride = (A.L_THIGH + A.L_SHIN) * math.sin(math.radians(26)) * WA.k * 2.2
    if x > WA_STOP + 1:
        WA.draw(c, A.Pose(x=x, ground=GY, **run_kw(d, stride)), light=(0.7, -0.6), rim=(255, 224, 170)); return
    tb = t0 + (start - WA_STOP) / speed
    b = smooth((t - tb) / 0.5)
    target = shoulder_pt(GD, gps)
    kw = dict(face=-1, lean=lerp(10, 44, b), neck=20 * b, thigh_n=lerp(6, 30, b), knee_n=lerp(-6, -46, b), thigh_f=lerp(-6, 16, b),
              knee_f=lerp(-6, -30, b), hand_n='flat', hand_f='relaxed', uarm_f=10, elbow_f=30, x=WA_STOP)
    un, en, err = G.arm_to(WA, dict(kw), 'n', target, GY, key=None, gd=34)
    kw.update(uarm_n=un, elbow_n=en)
    WA.draw(c, A.Pose(ground=GY, br=math.sin(t * 3) * 0.6, **kw), light=(0.7, -0.6), rim=(255, 224, 170))


def worker_B_D(c, t):
    t0 = T_LIVED - 0.05; start = 1700; stop = G_HIP[0] + 560; speed = 520.0
    if t < t0: return
    d = min(start - stop, (t - t0) * speed); x = start - d
    stride = (A.L_THIGH + A.L_SHIN) * math.sin(math.radians(24)) * WB.k * 2.2
    if x > stop + 1: kw = run_kw(d, stride, 24)
    else:
        b = smooth((t - (t0 + (start - stop) / speed)) / 0.4)
        kw = dict(face=-1, lean=lerp(14, 22, b), neck=10, uarm_n=lerp(0, 30, b), elbow_n=lerp(30, 10, b), uarm_f=lerp(0, 26, b), elbow_f=lerp(30, 12, b),
                  thigh_n=lerp(0, 22, b), knee_n=lerp(0, -30, b), thigh_f=lerp(0, 18, b), knee_f=lerp(0, -28, b), hand_n='flat', hand_f='flat')
    WB.draw(c, A.Pose(x=x, ground=GY - 24, br=math.sin(t * 3 + 1), **kw), light=(0.7, -0.6), rim=(255, 224, 170))


def cam_DE(t):
    gx, gy = G_HIP
    if t < C_E:
        u = ease_io((t - C_D) / (C_E - C_D))
        return lerp(1.1, 1.2, u), lerp(760, 780, u), lerp(1060, 1060, u)
    u = ease_io((t - C_E) / 1.6)
    ps = gage_D_pose(t); J = GD.joints(ps); hx, hy = GD.canvas_pt(ps, J['head_piv'])
    z = lerp(1.2, 4.6, u) + 0.25 * smooth((t - C_E - 1.6) / 6.5)
    return z, lerp(780, hx - 62, u), lerp(1060, hy - 52, u)


def shot_DE(c, t):
    p = PAL('day')
    z, cx, cy = cam_DE(t)
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    side_world(c, t, 'day', keg=False, steels=False)
    motes(c, t, p)
    rs = np.random.default_rng(12)
    for k in range(8):        # the last of the smoke still drifting from the hole
        tk = (t - C_D) * 0.5 + k * 0.6
        c.drawCircle(HOLE_X + 40 * (tk % 4.8), GY - 80 - 90 * (tk % 4.8), 40 + 24 * (tk % 4.8), P((232, 226, 218), 80 * max(0, 1 - (tk % 4.8) / 4.8), MaskFilter=blur(16)))
    draw_hat(c, G_HIP[0] + 470, GY - 10, 0.9 * K_D, 172)      # his hat lies on the rock where it fell, behind him
    worker_B_D(c, t)
    gps = gage_D_pose(t)
    c.drawOval(skia.Rect(G_HIP[0] - 320, G_HIP[1] - 10, G_HIP[0] + 200, G_HIP[1] + 14), P((40, 32, 26), 80, MaskFilter=blur(8)))
    GD.draw(c, gps, light=(0.7, -0.6), rim=(255, 224, 170), shadow=False)
    worker_D(c, t, gps)
    if t >= C_E: xray_head(c, t, gps)
    if t < C_E: fg_rocks(c, t, p)
    c.restore(); c.save()
    if t >= C_E: front_view(c, t)
    c.restore()


# ------------------------------------------------------------------ the x ray of HIS head only (head frame, facing +x)
# head frame (airman2 head units): face toward +x, nose tip x~271, back of skull x~78, crown y~50, chin y~244, eye (232,148),
# ear (120..153, 134..190). Lateral skull anatomy placed against that outline.
VAULT = [(92, 176), (80, 140), (84, 104), (104, 74), (136, 56), (176, 50), (212, 58), (236, 78), (246, 104), (248, 124), (240, 134),
         (226, 128), (214, 134), (206, 150), (196, 160), (176, 160), (150, 162), (132, 176), (110, 186)]
FACE = [(240, 134), (250, 136), (252, 150), (256, 162), (252, 176), (250, 190), (248, 200), (238, 202), (214, 198), (204, 178), (206, 150), (214, 134), (226, 128)]
MAND = [(246, 206), (250, 216), (248, 232), (238, 242), (216, 240), (192, 228), (172, 220), (164, 200), (156, 178), (164, 174), (172, 196),
        (184, 210), (208, 214), (236, 210)]
ORBIT = [(218, 138), (232, 132), (246, 138), (246, 156), (232, 162), (218, 156)]
NASAL = [(250, 156), (256, 166), (252, 182), (246, 180), (246, 164)]
ZYG = [(158, 164), (206, 160), (224, 166), (226, 174), (206, 176), (160, 174)]
BRAIN = [(94, 160), (90, 124), (100, 92), (124, 70), (160, 60), (196, 62), (224, 80), (236, 104), (236, 122), (224, 124), (210, 130),
         (204, 146), (186, 150), (164, 156), (140, 160), (124, 168), (104, 170)]
FRONTAL = [(158, 60), (196, 62), (224, 80), (236, 104), (236, 122), (224, 124), (210, 130), (196, 136), (184, 132), (174, 104), (164, 76)]
CENTRAL = [(158, 60), (164, 76), (174, 104), (184, 132)]          # the central sulcus slants down and forward
LATERAL = [(204, 140), (184, 138), (160, 142), (136, 148)]       # the lateral sulcus above the temporal lobe
TEMPORAL = [(204, 146), (186, 150), (164, 156), (140, 160), (128, 152), (150, 146), (180, 142)]
CEREB = [(96, 162), (116, 156), (138, 166), (126, 182), (104, 180)]
STEM = [(140, 160), (152, 158), (156, 190), (146, 194)]
ENTRY = (206, 196); EXIT = (186, 52)                              # in under the cheekbone, behind the eye, out the top front


XR = {}
T_FV0 = T_LEFT - 0.15         # a front view lens opens on "left frontal lobe"
T_FV1 = at('the', 2) - 0.05   # and closes before "the part of the brain"


def side_sx(t):
    return 1.0


def front_sx(t):
    return smooth((t - T_FV0) / 0.3) * (1 - smooth((t - T_FV1) / 0.3))


def front_view(c, t):
    """his head from the front as an x ray: the iron went in under his LEFT cheekbone (the viewer's right) and out the top,
    left of the midline; only the left frontal lobe is lit"""
    sx = front_sx(t)
    if sx <= 0.01 or 'head' not in XR: return
    hx, hy = XR['head']
    LX, LY, LR = 270, 830, 225          # a round lens beside his head, opening out of it
    cx, cy = lerp(hx, LX, sx), lerp(hy, LY, sx); r = LR * sx
    c.drawLine(hx - 40, hy, cx, cy, SP((255, 210, 63), 4, 200 * sx))
    lens = skia.Path(); lens.addCircle(cx, cy, r)
    c.drawPath(lens, P((10, 18, 40), 245))
    c.save(); c.clipPath(lens, skia.ClipOp.kIntersect, True)
    k = r / 150
    c.translate(cx, cy + 6 * k); c.scale(k, k)
    E = lambda pts: smooth_closed(pts)
    M = lambda pts: smooth_closed(pts + [(-x, y) for x, y in reversed(pts)])
    skin = M([(0, -112), (54, -104), (80, -70), (86, -20), (82, 24), (72, 60), (58, 92), (38, 116), (16, 128), (0, 130)])
    c.drawPath(skin, P((22, 50, 92)))
    for sd in (-1, 1): c.drawOval(skia.Rect(sd * 84 - 10, -6, sd * 84 + 10, 34), P((22, 50, 92)))     # ears
    bone = (228, 238, 252)
    vault = M([(0, -104), (46, -97), (70, -66), (76, -24), (72, 10), (0, 8)])
    brain = M([(0, -98), (42, -92), (64, -64), (68, -26), (64, 4), (0, 4)])
    c.drawPath(vault, P((200, 220, 248), 70)); c.drawPath(brain, P((206, 120, 142), 235))
    lit = smooth((t - T_LEFT + 0.1) / 0.4)
    # his left frontal lobe (viewer's right hemisphere)
    lobe = E([(3, -96), (42, -90), (64, -62), (67, -24), (62, -2), (3, -2)])
    c.drawPath(lobe, P((250, 186, 76), 235 * lit))
    for sd in (-1, 1):
        for k2 in range(4):
            q = skia.Path(); q.moveTo(sd * 8, -80 + k2 * 18); q.quadTo(sd * 34, -90 + k2 * 18, sd * 60, -70 + k2 * 20); c.drawPath(q, SP((150, 70, 96), 2.0, 140))
    c.drawLine(0, -98, 0, 4, SP((110, 40, 64), 3.4, 230))                          # the midline between the hemispheres
    c.drawPath(vault, SP(bone, 3.4, 235))
    for sd in (-1, 1):
        c.drawOval(skia.Rect(sd * 30 - 18, 6, sd * 30 + 18, 36), P((12, 26, 52))); c.drawOval(skia.Rect(sd * 30 - 18, 6, sd * 30 + 18, 36), SP(bone, 3, 235))
        c.drawPath(E([(sd * 50, 36), (sd * 74, 30), (sd * 78, 46), (sd * 56, 54)]), P(bone, 210))      # cheekbones
    c.drawPath(E([(0, 38), (8, 50), (6, 64), (-6, 64), (-8, 50)]), P((12, 26, 52)))                    # nasal opening
    maxilla = M([(0, 66), (36, 62), (52, 52), (46, 84), (0, 86)]); c.drawPath(maxilla, SP(bone, 3, 220))
    for k2 in range(-3, 4):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(k2 * 9 - 3.5, 78, k2 * 9 + 3.5, 87), 2, 2), P((236, 244, 255), 235))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(k2 * 9 - 3.5, 92, k2 * 9 + 3.5, 100), 2, 2), P((236, 244, 255), 235))
    jaw = skia.Path(); jaw.moveTo(-52, 52); jaw.quadTo(-50, 114, 0, 122); jaw.quadTo(50, 114, 52, 52); c.drawPath(jaw, SP(bone, 3.4, 230))
    # the track: from under his left cheekbone up, behind the left eye, out the top just left of the midline
    ent, ext = (50, 62), (16, -104)
    L_ = math.hypot(ext[0] - ent[0], ext[1] - ent[1]); ux, uy = (ext[0] - ent[0]) / L_, (ext[1] - ent[1]) / L_; nx, ny = -uy, ux
    w = 14
    c.save(); c.clipPath(skin, skia.ClipOp.kIntersect, True)
    c.drawPath(poly([(ent[0] + nx * w / 2, ent[1] + ny * w / 2), (ext[0] + nx * w / 2, ext[1] + ny * w / 2),
                     (ext[0] - nx * w / 2, ext[1] - ny * w / 2), (ent[0] - nx * w / 2, ent[1] - ny * w / 2)]), P((120, 20, 36), 220))
    c.restore()
    Lr = 3.6 / 7.4 * 210
    iron(c, (ent[0] - ux * 60, ent[1] - uy * 60), math.atan2(ux, -uy), Lr, w, a=120)
    c.restore()
    c.drawCircle(cx, cy, r, SP((255, 210, 63), 5, 240))
    if sx > 0.9:
        f = skia.Font(__import__('layout').BLACK, 34); txt = 'FRONT VIEW: HIS LEFT'; tw = f.measureText(txt)
        rr = skia.Rect(cx - tw / 2 - 18, cy + r + 18, cx + tw / 2 + 18, cy + r + 66)
        c.drawRRect(skia.RRect.MakeRectXY(rr, 22, 22), P((10, 18, 36), 230)); c.drawRRect(skia.RRect.MakeRectXY(rr, 22, 22), SP((255, 210, 63), 3, 230))
        c.drawString(txt, cx - tw / 2, cy + r + 54, f, P((255, 255, 255)))


def xray_alpha(t):
    return smooth((t - (C_E + 0.7)) / 0.8) * (1 - smooth((t - (C_F1 - 0.6)) / 0.45))


def _open(pts):
    q = skia.Path(); q.moveTo(*pts[0])
    for i in range(1, len(pts) - 1):
        q.quadTo(*pts[i], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
    q.lineTo(*pts[-1]); return q


GYRI = []
_r = np.random.default_rng(17)
for _k in range(26):
    x0, y0 = _r.uniform(100, 228), _r.uniform(70, 150)
    a0 = _r.uniform(0, math.pi)
    GYRI.append([(x0 + 9 * math.cos(a0 + j * 0.9) + j * 3, y0 + 7 * math.sin(a0 + j * 1.1)) for j in range(4)])


def xray_head(c, t, ps):
    a = xray_alpha(t)
    if a <= 0: return
    who = GD; J = who.joints(ps); h = who._hf(J)
    S = lambda pts: curve([h(*_hp(p)) for p in pts])
    O = lambda pts: _open([h(*_hp(p)) for p in pts])
    head = union([S(HEAD_SHAPES['skin']), S(HEAD_SHAPES['hair']), S(HEAD_SHAPES['hairtop']), S(HEAD_SHAPES['ear'])])
    c.drawRect(skia.Rect(-4000, -4000, 6000, 6000), P((8, 14, 30), 200 * a))     # the world dims
    hcx, hcy = who.canvas_pt(ps, h(*_hp((170, 150))))
    m = c.getTotalMatrix(); XR['head'] = m.mapXY(hcx, hcy); XR['scale'] = m.getScaleX() * ps.s * who.k * 1.25
    sx = side_sx(t)
    if sx <= 0.0: return
    w_out = smooth((t - (C_F1 - 0.6)) / 0.45)
    c.saveLayerAlpha(None, int(255 * (1 - w_out)))
    c.translate(hcx, hcy); c.scale(sx, 1); c.translate(-hcx, -hcy)
    c.save(); c.translate(ps.x, ps.ground); c.scale(ps.s * who.k * ps.face, ps.s * who.k)
    top = h(*_hp((160, 40)))[1]; bot = h(*_hp((160, 252)))[1]
    w_in = smooth((t - (C_E + 0.7)) / 0.8)
    c.save(); c.clipPath(head, skia.ClipOp.kIntersect, True)
    c.clipRect(skia.Rect(-4000, -4000, 4000, top + (bot - top) * w_in))
    c.drawPath(head, P((22, 50, 92)))
    for pts, al in ((VAULT, 70), (FACE, 60), (MAND, 70)):
        c.drawPath(S(pts), P((200, 220, 248), al))
    c.drawPath(S(BRAIN), P((206, 120, 142), 235))
    c.save(); c.clipPath(S(BRAIN), skia.ClipOp.kIntersect, True)
    c.drawPath(S(TEMPORAL), P((190, 104, 128)))
    lit = smooth((t - T_LEFT + 0.1) / 0.4)
    if lit > 0:
        c.drawPath(S(FRONTAL), P((250, 186, 76), 235 * lit))
    for g in GYRI: c.drawPath(O(g), SP((150, 70, 96), 2.2, 150))
    c.drawPath(O(CENTRAL), SP((110, 40, 64), 3.4, 230)); c.drawPath(O(LATERAL), SP((110, 40, 64), 3.4, 230))
    c.restore()
    c.drawPath(S(CEREB), P((186, 100, 124))); c.drawPath(S(STEM), P((180, 104, 126)))
    bone = (228, 238, 252)
    for pts in (VAULT, FACE, MAND):
        c.drawPath(S(pts), SP(bone, 3.6, 235))
    c.drawPath(S(ORBIT), P((12, 26, 52))); c.drawPath(S(ORBIT), SP(bone, 3.2, 235))
    c.drawPath(S(NASAL), P((12, 26, 52)))
    c.drawPath(S(ZYG), P(bone, 220))
    for k in range(6):     # teeth: incisors at the front, molars at the back, upper and lower rows
        x = 242 - k * 9; w = 3 if k < 2 else 4
        c.drawPath(S([(x - w, 199), (x + w, 199), (x + w, 206), (x - w, 206)]), P((236, 244, 255), 235))
        c.drawPath(S([(x - w, 208), (x + w, 208), (x + w, 214), (x - w, 214)]), P((236, 244, 255), 235))
    for k in range(3):     # neck vertebrae under the skull
        c.drawPath(S([(140, 200 + k * 16), (160, 198 + k * 16), (162, 210 + k * 16), (140, 212 + k * 16)]), P(bone, 170))
    # the wound track left by the iron (drawn as it goes: entry to exit)
    ex, ey = h(*_hp(ENTRY)); xx_, xy_ = h(*_hp(EXIT))
    L_ = math.hypot(xx_ - ex, xy_ - ey); ux, uy = (xx_ - ex) / L_, (xy_ - ey) / L_; nx, ny = -uy, ux
    tr = smooth((t - T_TORE) / 0.75)
    if tr > 0:
        w = 28 * 1.25
        q = poly([(ex + nx * w / 2, ey + ny * w / 2), (ex + ux * L_ * tr + nx * w / 2, ey + uy * L_ * tr + ny * w / 2),
                  (ex + ux * L_ * tr - nx * w / 2, ey + uy * L_ * tr - ny * w / 2), (ex - nx * w / 2, ey - ny * w / 2)])
        c.drawPath(q, P((120, 20, 36), 215))
    c.restore()
    # the ghost iron replaying its path, from below the jaw up through and out of the top of the head (tapered end first)
    if T_TORE - 0.15 < t < T_TORE + 1.0:
        u = (t - (T_TORE - 0.15)) / 1.0
        Lr = 3.6 / 7.4 * 172 * 1.25 * 2.0          # 3 ft 7 in against a skull about 7.4 in long (172 units)
        Lr = min(Lr, 1000)
        tip = -Lr * 0.15 + (L_ + Lr * 1.15) * smooth(u)
        base = (ex + ux * (tip - Lr), ey + uy * (tip - Lr))
        al = 170 * min(1, u * 6) * min(1, (1 - u) * 6)
        iron(c, base, math.atan2(ux, -uy), Lr, 28 * 1.25, a=al)
    c.restore()
    c.restore()
    # chips on their words, beside the face (in front of it), leaders to the lit lobe
    fx, fy = who.canvas_pt(ps, h(*_hp((224, 96))))
    for tw, text, dy in ((T_PLANS, 'PLANS AHEAD', -150), (T_HOLDS, 'HOLDS BACK IMPULSES', -40)):
        al = smooth((t - tw + 0.1) / 0.3) * a
        if al > 0: chip_world(c, text, fx, fy, dy, al)


CHIPS = []
def chip_world(c, text, ax, ay, dy, a):
    m = c.getTotalMatrix()
    CHIPS.append((text, m.mapXY(ax, ay), dy, a))


def draw_chips(c):
    import layout as L
    for text, (ax, ay), dy, a in CHIPS:
        f = skia.Font(L.BLACK, 40); w = f.measureText(text)
        if dy == 'front':
            x = W - 70 - w / 2; y = ay - 230
            c.drawLine(x - w / 2 + 10, y + 22, ax, ay, SP((255, 210, 63), 4, 230 * a))
        else:
            x = 80 + w / 2; y = ay + dy - 60
            c.drawLine(x + w / 2 + 24, y - 10, ax, ay, SP((255, 210, 63), 4, 230 * a))
        c.drawCircle(ax, ay, 8, P((255, 210, 63), 255 * a))
        r = skia.Rect(x - w / 2 - 24, y - 42, x + w / 2 + 24, y + 22)
        c.drawRRect(skia.RRect.MakeRectXY(r, 28, 28), P((10, 18, 36), 230 * a))
        c.drawRRect(skia.RRect.MakeRectXY(r, 28, 28), SP((255, 210, 63), 3, 230 * a))
        c.drawString(text, x - w / 2, y + 4, f, P((255, 255, 255), 255 * a))
    CHIPS.clear()


# ------------------------------------------------------------------ F1 / F2: before and after, same place
K_F = 0.55
G_BEFORE = G.gage(K_F)
G_AFTER = G.gage(K_F, after=True)
BOSS = G.boss(K_F)
FGX, FBX = 730, 300


def draw_sheet(c, a, b, col=(240, 232, 210)):
    """the plan sheet held open between the two hands, a drawing of the cut on it"""
    mx = (a[0] + b[0]) / 2; my = (a[1] + b[1]) / 2
    ax_, ay_ = a; bx_, by_ = b
    q = poly([(ax_, ay_ - 70), (bx_, by_ - 70), (bx_, by_ + 46), (ax_, ay_ + 46)])
    c.drawPath(q, P(col)); c.drawPath(q, SP(mix(col, (0, 0, 0), 0.25), 2))
    for k in range(3):
        c.drawLine(ax_ + 14, ay_ - 50 + k * 22, bx_ - 14, by_ - 50 + k * 22, SP((110, 120, 150), 2.4, 170))


def shot_F(c, t):
    after = t >= C_F2
    t0 = C_F2 if after else C_F1; t1 = C_G if after else C_F2
    u = (t - t0) / (t1 - t0)
    z = lerp(1.0, 1.16, ease_io(u)); cx = lerp(520, 640, ease_io(u)); cy = lerp(960, 1000, ease_io(u))
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    p = side_world(c, t, 'grey' if after else 'day', keg=not after)
    crew_bg(c, t, p)
    light = p['light']; rim = p['rim']
    if not after:
        # Gage points the crew to the next drill spot, the rolled plan in his other hand; the contractor stands just behind
        # him, looking the same way, his hand resting on Gage's shoulder, and nods on "capable"
        g = G_BEFORE
        pt = smooth((t - C_F1 - 0.3) / 0.5)
        gk = dict(face=-1, lean=4, neck=4, uarm_n=lerp(10, 78, pt), elbow_n=lerp(24, 8, pt), hand_n='point' if pt > 0.5 else 'relaxed',
                  uarm_f=8, elbow_f=30, hand_f='grip', x=FGX, smile=0.8)
        gps = A.Pose(ground=GY, br=math.sin(t * 2.2) * 0.6, **gk)
        nod = 7 * math.sin(max(0, t - T_CAPABLE + 0.2) * 7) * smooth((t - T_CAPABLE + 0.2) / 0.3) * (1 - smooth((t - T_CAPABLE - 0.9) / 0.3))
        bx = FGX + 190
        bk = dict(face=-1, lean=6, neck=4 + nod, uarm_f=4, elbow_f=22, hand_n='flat', hand_f='relaxed', x=bx, smile=0.9)
        J_ = g.joints(gps); sh_top = g.canvas_pt(gps, J_['torso_f'](-50, 352))       # the top of his back shoulder
        pat = 10 * max(0.0, math.sin((t - T_CAPABLE + 0.2) * 9)) * smooth((t - T_CAPABLE + 0.2) / 0.1) * (1 - smooth((t - T_CAPABLE - 0.5) / 0.1))
        un, en, _ = G.arm_to(BOSS, dict(bk), 'n', (sh_top[0] + 6, sh_top[1] - 10 - pat), GY - 10, key=('bossF1c', round(pat)), gd=40)
        bps = A.Pose(ground=GY - 10, br=math.sin(t * 2 + 1) * 0.6, uarm_n=un, elbow_n=en, **bk)
        BOSS.draw(c, bps, light=light, rim=rim)
        g.draw(c, gps, light=light, rim=rim)
        draw_roll(c, G.grip_pt(g, gps, 'f', 40))
        c.save(); c.clipPath(near_hand_path(BOSS, bps), skia.ClipOp.kIntersect, True); BOSS.draw(c, bps, light=light, rim=rim); c.restore()
    else:
        g = G_AFTER
        sw = smooth((t - T_SWORE + 0.2) / 0.25) * (1 - smooth((t - T_BRUSH + 0.1) / 0.25))
        br_ = smooth((t - T_BRUSH + 0.05) / 0.3)
        dr = t >= T_DROP
        if t < T_DROP - 0.12: HF_DROP.clear()
        mouth = 0.0
        if T_SWORE - 0.15 < t < T_BRUSH + 0.1: mouth = 0.55 + 0.35 * math.sin(t * 19)
        shake = 7 * math.sin(t * 22) * sw
        op = smooth((t - T_DROP + 0.5) / 0.3)        # he holds the plan out, then his fingers open and it drops
        # "swore": he leans in, scowling, mouth open, and shakes the plan in his near fist at the contractor; "brushed off
        # advice": he lowers it and turns his head away, chin up; "dropped": his hand opens and the plan falls
        gk = dict(face=-1, lean=lerp(lerp(2, 10, sw), -6, br_), neck=lerp(lerp(2, 10, sw), -32, br_), brow=1.0, mouth=mouth,
                  uarm_n=lerp(lerp(lerp(10, 92, sw), 30, br_), 34, op) + shake, elbow_n=lerp(lerp(26, 20, sw), 30, br_),
                  hand_n='grip' if t < T_DROP - 0.12 else 'flat', wrist_n=lerp(0, -20, op), uarm_f=4, elbow_f=24, hand_f='relaxed', x=FGX + 80)
        gps = A.Pose(ground=GY, br=math.sin(t * 2.6) * 0.6, **gk)
        ad = smooth((t - T_BRUSH + 0.5) / 0.4) * (1 - smooth((t - T_DROP - 0.3) / 0.5))
        bk = dict(face=1, lean=lerp(4, 10, ad), neck=6, uarm_n=lerp(4, 40, ad), elbow_n=lerp(20, 50, ad), hand_n='flat', wrist_n=lerp(0, -50, ad),
                  uarm_f=4, elbow_f=22, hand_f='relaxed', x=FBX - 150)
        BOSS.draw(c, A.Pose(ground=GY, br=math.sin(t * 2 + 1) * 0.6, **bk), light=light, rim=rim)
        g.draw(c, gps, light=light, rim=rim)
        hf = G.grip_pt(g, gps, 'n', 30)
        if t < T_DROP - 0.12:
            draw_sheet_hang(c, hf, 0.0, 0.0)
            c.save(); c.clipPath(near_hand_path(g, gps), skia.ClipOp.kIntersect, True); g.draw(c, gps, light=light, rim=rim); c.restore()
        else:
            d = max(0.0, t - T_DROP + 0.12)
            hf = HF_DROP.setdefault('p', hf)
            y_land = GY - 6
            fall = min(y_land - hf[1] - 60, 0.5 * 900 * d * d)     # light paper: slower than free fall, fluttering
            k = fall / max(1, y_land - hf[1] - 60)
            hf = G.grip_pt(g, A.Pose(ground=GY, **dict(gk, hand_n='grip')), 'n', 30) if False else hf
            x = hf[0] - 40 * d + 22 * math.sin(d * 8) * (1 - k)
            draw_sheet_hang(c, (x, hf[1] + fall), k, 0.5 * math.sin(d * 7) * (1 - k))
    c.restore()


def draw_roll(c, h):
    """the rolled plan held in a fist, hanging down at his side"""
    x, y = h
    c.drawPath(poly([(x - 10, y - 30), (x + 10, y - 30), (x + 12, y + 110), (x - 8, y + 110)]), P((236, 228, 206)))
    c.drawOval(skia.Rect(x - 8, y + 104, x + 12, y + 114), P((200, 190, 166)))
    c.drawLine(x - 4, y - 26, x - 2, y + 104, SP((210, 200, 176), 3))


HF_DROP = {}


def draw_sheet_hang(c, top, land, tilt):
    """the sheet held by its top edge (hanging), turning as it falls, then lying flat on the rock"""
    x, y = top
    if land < 1:
        hgt = lerp(150, 40, land); wid = 100
        ca, sa = math.cos(tilt), math.sin(tilt)
        pts = [(-wid / 2, 0), (wid / 2, 0), (wid / 2 + 10 * land, hgt), (-wid / 2 - 10 * land, hgt)]
        q = poly([(x + px * ca - py * sa, y + px * sa + py * ca) for px, py in pts])
    else:
        q = poly([(x - 70, GY - 10), (x + 66, GY - 14), (x + 74, GY + 2), (x - 74, GY + 4)])
    c.drawPath(q, P((240, 232, 210))); c.drawPath(q, SP((176, 168, 146), 2))


CREW1 = G.worker_a(0.34); CREW2 = G.worker_b(0.34)
def crew_bg(c, t, p):
    """two men drilling by the left wall: one crouches holding the drill steel upright, the other swings the hammer down
    onto it with both hands on the handle (the steel only moves when struck)"""
    x1, x2, g = 120, 236, GY - 40
    ph = (t * 0.8) % 1.0
    swing = 0.5 + 0.5 * math.cos(ph * 2 * math.pi)          # 1 = raised, 0 = striking
    kw2 = dict(face=-1, lean=lerp(18, 2, swing), uarm_n=lerp(70, 168, swing), elbow_n=lerp(6, 34, swing), uarm_f=lerp(66, 164, swing),
               elbow_f=lerp(8, 34, swing), hand_n='grip', hand_f='grip', x=x2, thigh_n=-6, thigh_f=10, knee_f=-6)
    ps2 = A.Pose(ground=g, **kw2)
    kw1 = dict(face=1, lean=26, thigh_n=80, knee_n=-120, thigh_f=30, knee_f=-110, uarm_n=40, elbow_n=30, uarm_f=44, elbow_f=26, hand_n='grip', hand_f='grip', x=x1)
    ps1 = A.Pose(ground=g, **kw1)
    c.saveLayer(None, skia.Paint(ColorFilter=skia.ColorFilters.Blend(skia.Color(*[int(v) for v in p['hill_far']], 60), skia.BlendMode.kSrcATop)))
    CREW1.draw(c, ps1, light=p['light'], rim=p['rim'])
    hx, hy = G.grip_pt(CREW1, ps1, 'n', 40)
    c.drawLine(hx + 4, hy - 40, hx + 4, g - 4, SP((70, 72, 78), 6))
    CREW2.draw(c, ps2, light=p['light'], rim=p['rim'])
    a, b = G.grip_pt(CREW2, ps2, 'n', 40), G.grip_pt(CREW2, ps2, 'f', 40)
    ux, uy = a[0] - b[0], a[1] - b[1]; L = math.hypot(ux, uy) or 1; ux, uy = ux / L, uy / L
    head = (a[0] + ux * 64, a[1] + uy * 64)
    c.drawLine(b[0] - ux * 10, b[1] - uy * 10, head[0], head[1], SP((120, 84, 50), 5))
    nx, ny = -uy, ux
    c.drawPath(poly([(head[0] + nx * 14 - ux * 8, head[1] + ny * 14 - uy * 8), (head[0] + nx * 14 + ux * 8, head[1] + ny * 14 + uy * 8),
                     (head[0] - nx * 14 + ux * 8, head[1] - ny * 14 + uy * 8), (head[0] - nx * 14 - ux * 8, head[1] - ny * 14 - uy * 8)]), P((64, 66, 72)))
    c.restore()


# ------------------------------------------------------------------ G: dusk, he walks off; two friends watch
K_G = 0.42
G_WALK = G.gage(K_G, after=True)
FR1 = G.worker_a(0.62); FR2 = G.worker_b(0.58)


def shot_G(c, t):
    u = (t - C_G) / (DUR - C_G)
    z = lerp(1.0, 1.18, ease_io(u)); cx = lerp(660, 600, ease_io(u)); cy = lerp(1000, 1040, ease_io(u))
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    p = side_world(c, t, 'dusk', keg=False)
    lx, ly = 1010, GY - 170          # a lantern on a post at the camp (scene life)
    c.drawLine(lx, GY, lx, ly, SP((70, 50, 40), 6))
    fl = 0.85 + 0.15 * math.sin(t * 13) * math.sin(t * 7)
    c.drawCircle(lx, ly + 30, 110 * fl, P((255, 190, 110), 70, MaskFilter=blur(34)))
    c.drawRect(skia.Rect(lx - 14, ly + 10, lx + 14, ly + 48), P((255, 214, 140)))
    # Gage walks away to the left: the planted foot moves back relative to his hips at exactly his travel speed
    speed = 92.0; d = (t - C_G) * speed
    stride = (A.L_THIGH + A.L_SHIN) * math.sin(math.radians(16)) * K_G * 2.2      # foot locked (slip under 1 px a frame)
    ph = d / stride * math.pi; s = math.sin(ph); co = math.cos(ph)
    kw = dict(face=-1, lean=5, neck=-6, thigh_n=8 + 16 * s, knee_n=-4 - 40 * max(0.0, co), thigh_f=8 - 16 * s, knee_f=-4 - 40 * max(0.0, -co),
              uarm_n=-14 * s, elbow_n=24, uarm_f=14 * s, elbow_f=24, hand_n='relaxed', hand_f='relaxed')
    G_WALK.draw(c, A.Pose(x=520 - d, ground=GY - 20, br=0.4 * math.sin(t * 3), **kw), light=p['light'], rim=p['rim'])
    # the friends watch him go: they breathe, the near one lowers his head on "no longer", the far one turns to look at him
    lo = smooth((t - T_NO + 0.2) / 0.6); tu = smooth((t - at('friends') - 0.3) / 0.5) * (1 - smooth((t - T_NO - 0.4) / 0.5))
    for who, x, g, n, nk, sh in ((FR1, 810, 1560, 0, 4 + 16 * lo, 0.0), (FR2, 940, 1530, 1, -4 - 10 * tu + 8 * lo, 1.0)):
        b = math.sin(t * 2.0 + n * 1.7)
        who.draw(c, A.Pose(x=x, ground=g + 2 * b, face=-1, neck=nk, lean=2 + 2 * lo + 1.2 * b, uarm_n=4 + 2 * n + 3 * b, elbow_n=30 + 6 * lo,
                           uarm_f=0 + 3 * b, elbow_f=26, hand_n='relaxed', hand_f='relaxed', br=1.5 * b, blink=int((t + n) * 10) % 29 == 0),
                 light=p['light'], rim=p['rim'])
    c.restore()


# ------------------------------------------------------------------ frame
def scene(c, t):
    if t < C_C: shot_AB(c, t)
    elif t < C_D: shot_C(c, t)
    elif t < C_F1: shot_DE(c, t)
    elif t < C_G: shot_F(c, t)
    else: shot_G(c, t)


def lift(t):
    return 1.12 if t >= C_G else 1.0


class GageShort(kit.Short):
    def frame(self, t):
        s = super().frame(t)
        c = s.getCanvas()
        return s


def build_short():
    sh = kit.Short(WD, 'AP PSYCHOLOGY', TITLES, scene, DUR, T_END, lift=lift, cuts=CUTS)
    base_frame = sh.frame

    def frame(t):
        CHIPS.clear()
        s = base_frame(t)
        if CHIPS:   # chips drawn after the finish, over the scene, under nothing important
            draw_chips(s.getCanvas())
        return s
    sh.frame = frame
    return sh


SHORT = build_short()

if __name__ == '__main__':
    a = sys.argv[1:]
    out = a[a.index('--out') + 1] if '--out' in a else None
    st = a[a.index('--stills') + 1].split(',') if '--stills' in a else None
    if '--from' in a:      # re-render only a time range (a fix to some shots), spliced into silent.mp4
        import subprocess
        f0 = int(round(float(a[a.index('--from') + 1]) * 30)); nf = int(round(DUR * kit.FPS))
        if '--to' in a: nf = int(round(float(a[a.index('--to') + 1]) * 30))
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for fi in range(f0, nf):
            ff.stdin.write(SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
        ff.stdin.close(); ff.wait(); print('from', f0, nf)
    elif '--chunk' in a:
        i, n = map(int, a[a.index('--chunk') + 1].split('/'))
        import subprocess
        nf = int(round(DUR * kit.FPS)); f0 = nf * i // n; f1 = nf * (i + 1) // n
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for fi in range(f0, f1):
            ff.stdin.write(SHORT.frame(fi / 30).makeImageSnapshot().tobytes())
        ff.stdin.close(); ff.wait(); print('chunk', i, f0, f1)
    else:
        kit.render(SHORT, out, stills=st, outdir=a[a.index('--outdir') + 1] if '--outdir' in a else OUTD)
