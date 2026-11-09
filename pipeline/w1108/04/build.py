"""w1108-04-zeno-paradox (AP Calculus BC, Topics 10.1 and 10.2: a convergent geometric series). Premium standard, all
code (skia). Story type: what would happen if (Zeno's dichotomy, an ancient thought experiment). Hook type: contrarian.

Art plan and motion list (for the accuracy check):
- One place: a Greek stone colonnade at golden hour, seen from the side. The sun is low behind him on the left, so
  every column throws a long shadow to the right across the stone floor, light shafts fall between the columns with
  dust hanging in them, the sea and far hills sit in haze behind. At the right end of the walk a stone wall with a
  wooden door (bronze ring handle). Out of focus column at the left edge (depth).
- The man (one skinned body, people kit person.py, a traveller in a cream linen shirt and brown trousers) walks in
  from the left on a foot locked gait (gait.py: footfalls are planned in distance, the planted foot never slides, the
  swing foot moves forward; driven by distance so slow motion and the rewind keep the feet locked) and stops at the
  start line, looking at the door.
- Zeno's argument (4.4 to 13.6 s): on "halfway" a light line rises on the floor at 1/2 of the way; on "half of what's
  left" at 3/4; on "half of THAT" at 7/8; on "the halves never run out" the marks keep coming, faster and finer
  (15/16, 31/32, 63/64...) and the camera pushes toward the door to show they crowd without end.
- "Watch" (13.6 to 25.5 s): he walks at a STEADY speed (1.1 m/s), shown in slow motion that deepens (the stopwatch
  chip shows his real elapsed time, 3.2 s total, so the viewer sees time itself slowing): he passes 1/2, 3/4, 7/8,
  15/16 on the words "half", "quarter", "eighth", "sixteenth". Each piece he crosses lights on the floor in its own
  shade and drops into the DISTANCE bar at the top (1/2, 1/4, 1/8, 1/16 labelled). The camera pushes in toward the
  door as the marks get finer: there is always another halfway mark.
- "Infinitely many pieces... EXACTLY the whole way" (25.5 to 30.6): the camera pulls back; the bar's pieces close the
  last gap and the bracket "WHOLE WAY = 1" locks on "EXACTLY". (1/2 + 1/4 + 1/8 + ... = 1: the partial sums 1 - 1/2^n
  approach 1 and the infinite sum is defined as that limit.)
- "And the time?" (30.6 to 36.9): a visible rewind (he walks backward to the start, stopwatch back to 0.00), then the
  same walk at REAL speed: at a steady pace each piece takes half as long (1.6 s, 0.8 s, 0.4 s, 0.2 s ...), so the TIME
  bar fills exactly like the distance bar and adds up to 3.2 s on "seconds".
- "So yes, he gets there" (36.9 to 39): he stands at the door and puts his hand on the ring handle (the arm is solved
  each frame so the hand sits on the handle). "In calculus..." he pushes the door in (the hand stays on the handle,
  he takes one small step) and warm light spills out. Titles: INFINITE SERIES / THAT CONVERGES.
Facts: Zeno's dichotomy in its progressive form (Stanford Encyclopedia of Philosophy, Zeno's paradoxes); geometric
series sum a/(1 - r) = (1/2)/(1/2) = 1 (AP Calculus BC CED Topics 10.1, 10.2); at constant speed the times form the
same series, T/2 + T/4 + ... = T."""
import sys, math, json
sys.path[:0] = ['/home/claude/w1108/04']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, ease_io, Wt, Y, R, TL, W, H, OR
import layout as L
import person as PP, airman2 as A2
import gait as G

OUT = '/home/claude/w1108/out/w1108-04-zeno-paradox'
WD = kit.Words(f'{OUT}/words.json')
at = WD.at
T_DOOR = at('door'); T_FIRST = at('first'); T_HALFWAY = at('halfway'); T_THEN1 = at('then', 1); T_THEN2 = at('then', 2)
T_THAT = at('that', 2); T_HALVES = at('halves'); T_SO = at('so', 1); T_THERE1 = at('there', 1); T_WATCH = at('watch')
T_P1 = at('half', 3); T_P2 = at('quarter'); T_P3 = at('eighth'); T_P4 = at('sixteenth'); T_EACH = at('each', 1)
T_GAP = at('gap'); T_TOTAL = at('total'); T_CLOSER = at('closer', 2); T_DIST = at('distance'); T_INF = at('infinitely')
T_EXACT = at('exactly'); T_WAY = at('way'); T_AND3 = at('and', 3); T_EACH2 = at('each', 2); T_HLONG = at('half', 5)
T_WALK2 = at('walk', 2); T_TIMES = at('times'); T_SECONDS = at('seconds'); T_YES = at('yes'); T_GETS = at('gets', 2)
T_THERE2 = at('there', 2); T_CALC = at('calculus'); T_INFIN = at('infinite'); T_SERIES = at('series'); T_CONV = at('converges')
T_END = WD.end() + 0.45
DUR = round(T_END + 1.6, 2)

ACC = (186, 146, 246)      # AP Calculus BC violet (site theme), light for dark backgrounds
GOLD = (255, 206, 120)
PIECE_COLS = [(255, 196, 92), (255, 150, 84), (236, 112, 120), (200, 110, 190), (160, 120, 236), (120, 150, 250), (110, 190, 240), (120, 220, 210)]

# ------------------------------------------------------------------ world
GROUND = 1196                      # where his boots stand
K = 0.33                           # person scale (about 430 px tall)
FRONT = 66.0                       # his front (boot tip and chest) is about 50 px ahead of his hip
X0, XE = 345.0, 802.0              # hip x at the start line and where his front reaches the door
DPX = XE - X0                      # the whole way, 510 px (about 3.2 m at this scale)
Z0 = 1.18                          # base framing zoom
U = 1.0 / K                        # pose units per px
T_REAL = 3.2                       # real walk time at a steady 1.1 m/s
DOOR_X0, DOOR_X1, DOOR_TOP = 868, 1010, 712
HANDLE = (892, 978)

MAN = PP.Person(K, palette={A2.OL: (228, 214, 186), A2.OL_SH: (196, 178, 146), A2.OL_HI: (244, 234, 212), A2.CUFF: (228, 214, 186),
                A2.BELT: (122, 74, 46), A2.BELT_SH: (92, 54, 32), A2.BOOT_C: (112, 72, 46), A2.BOOT_SH: (84, 52, 32), A2.SOLE: (60, 40, 28),
                A2.HAIR: (44, 32, 26), A2.SKIN: (214, 152, 112), A2.SKIN_SH: (188, 128, 92), (150, 120, 80): (228, 214, 186)},
                cap=False, trouser=(98, 78, 60))
LIGHT = (-0.8, -0.45)              # sun low behind him on the left


# ------------------------------------------------------------------ the walk: footfalls planned in distance (gait.py)
class Walk:
    """a walk from standing at hip p0 to standing at hip p1 (px). Start half step, n full steps, closing step.
    feet(p) -> (near x, near lift, far x, far lift) in px; the planted foot never moves."""
    def __init__(self, p0, p1, n):
        self.p0, self.p1 = p0, p1; self.L = p1 - p0; self.n = n; self.S = self.L / (n + 1)

    def feet(self, p):
        S, L = self.S, self.L; d = min(max(p - self.p0, 0.0), L)
        pos = {'n': 0.0, 'f': 0.0}; lift = {'n': 0.0, 'f': 0.0}
        # step list: (side, hip from, hip to, foot from, foot to)
        steps = [('n', 0.0, S / 2, 0.0, S)]
        for j in range(1, self.n + 1):
            side = 'f' if j % 2 == 1 else 'n'
            steps.append((side, (j - 0.5) * S, (j + 0.5) * S, (j - 1) * S if j > 1 else 0.0, (j + 1) * S))
        last = 'f' if (self.n + 1) % 2 == 1 else 'n'
        steps.append((last, (self.n + 0.5) * S, L, self.n * S if self.n >= 1 else 0.0, L))
        # foot positions: start both at 0, then apply every finished step and the one in progress
        for side, a, b, f0, f1 in steps:
            if d >= b: pos[side] = f1
            elif d > a:
                g = (d - a) / (b - a); e = g * g * (3 - 2 * g)
                pos[side] = f0 + (f1 - f0) * e; lift[side] = math.sin(math.pi * g)
                break
            else: break
        return self.p0 + pos['n'], lift['n'], self.p0 + pos['f'], lift['f']


def leg_pose(hip_px, fx_n, ln, fx_f, lf):
    out = {}
    for s, fx, li in (('n', fx_n, ln), ('f', fx_f, lf)):
        dx = (fx - hip_px) * U
        th, kn = G.leg_ik(dx, G.HS - 16 * (dx / (G.S / 2)) ** 2 - 64 * li)
        out['thigh_' + s] = th; out['knee_' + s] = min(0.0, kn); out['ank_' + s] = -10 * li
    return out


XS = X0 - 18.0                                # where the walk in stops; a small step on the question brings him to X0
WALK_IN = Walk(-120.0, XS, 3)                 # he walks in (frame zero is mid stride)
STEP_Q = Walk(XS, X0, 0)
WALK = Walk(X0, XE, 3)                        # the whole way
STEP_IN = Walk(XE, XE + 150, 1)               # through the open door into the light


def frac_p(f):
    return X0 + FRONT + DPX * f


# ------------------------------------------------------------------ time maps
def real_pass1(t):
    """screen time -> his real elapsed walk time (s) during the slow motion pass; hits each piece on its word"""
    pts = [(T_WATCH + 0.1, 0.0), (T_P1 + 0.05, 1.6), (T_P2 + 0.1, 2.4), (T_P3 + 0.12, 2.8), (T_P4 + 0.2, 3.0),
           (T_EACH + 0.4, 3.1)]
    # then the remaining gap halves every second (the floor zoom doubles every second to match)
    if t <= pts[0][0]: return 0.0
    for (a, ra), (b, rb) in zip(pts, pts[1:]):
        if t <= b:
            u = (t - a) / (b - a)
            return ra + (rb - ra) * u
    # after "distance": keeps creeping toward 3.2 without arriving (halves of the remaining gap every 1.3 s)
    dt = t - pts[-1][0]
    return T_REAL - (T_REAL - 3.1) * 0.5 ** (dt / 1.0)


T_RW0, T_RW1 = T_AND3 - 0.05, T_AND3 + 0.95          # the rewind
T_GO = T_WALK2 - 0.25                                 # the real speed replay starts (ends on "seconds")


def hip_and_feet(t):
    """hip x (px) and the feet for the whole video"""
    if t < T_WATCH + 0.1:
        # walk in: frame zero already mid stride, then a steady walk that eases to a stop at the start line
        if t < 0:                                   # the loop: the last 1.6 s lead into frame zero
            p = 262.0 + 130.0 * t
            return p, WALK_IN.feet(p)
        if t < T_SO + 0.2:
            u = min(1.0, t / 1.0); e = 1 - (1 - u) ** 2.0
            p = lerp(262.0, XS, e)
            return p, WALK_IN.feet(p)
        u = ease_io(min(1.0, (t - (T_SO + 0.2)) / 0.6)); p = lerp(XS, X0, u)
        return p, STEP_Q.feet(p)
    if t < T_RW0:
        r = real_pass1(t); p = X0 + DPX * r / T_REAL
        return p, WALK.feet(p)
    if t < T_RW1:
        r_end = real_pass1(T_RW0); p_end = X0 + DPX * r_end / T_REAL
        u = ease_io((t - T_RW0) / (T_RW1 - T_RW0)); p = lerp(p_end, X0, u)
        return p, WALK.feet(p)
    if t < T_GO:
        return X0, WALK.feet(X0)
    r = min(T_REAL, t - T_GO)
    if r < T_REAL:
        p = X0 + DPX * r / T_REAL
        return p, WALK.feet(p)
    if t < T_SW0:
        return XE, WALK.feet(XE)
    if t < T_IN0:
        p = XE + 50 * ease_io(min(1.0, (t - T_SW0) / (T_SW1 - T_SW0)))     # he leans in and steps with the door
        return p, STEP_IN.feet(p)
    u = min(1.0, max(0.0, (t - T_IN0) / (T_IN1 - T_IN0))); p = XE + 50 + 100 * u
    return p, STEP_IN.feet(p)


def real_time(t):
    """the stopwatch: his real elapsed walking time"""
    if t < T_WATCH + 0.1: return 0.0
    if t < T_RW0: return real_pass1(t)
    if t < T_RW1:
        return real_pass1(T_RW0) * (1 - ease_io((t - T_RW0) / (T_RW1 - T_RW0)))
    if t < T_GO: return 0.0
    return min(T_REAL, t - T_GO)


T_SW0 = T_GETS + 0.35      # the door starts to swing in under his hand
T_SW1 = T_SW0 + 1.0
T_IN0 = T_SW1 + 0.1        # he lets go and walks through
T_IN1 = T_IN0 + 1.5
DOOR_MAX = 72


def door_angle(t):
    return 0.0 if t < T_SW0 else DOOR_MAX * ease_io((t - T_SW0) / (T_SW1 - T_SW0))


def light_in(t):
    """how far he has gone into the light of the doorway (0..1)"""
    p, _ = hip_and_feet(t)
    return smooth((p - (XE + 80)) / 66.0)


def handle_pos(t):
    a = math.radians(door_angle(t))
    return (DOOR_X1 - (DOOR_X1 - HANDLE[0]) * math.cos(a), HANDLE[1])


# ------------------------------------------------------------------ the man
def arm_to(ps, target_px, hand='grip'):
    """solve the near arm so the hand sits on target (canvas px); returns pose kwargs"""
    J = MAN.joints(ps)
    sh = J['sh']
    tx = (target_px[0] - ps.x) * U * ps.face; ty = (target_px[1] - ps.ground) * U
    # aim the wrist a little short so the grip (about 46 units past the wrist) closes on the handle
    dx, dy = tx - sh[0], ty - sh[1]
    d = math.hypot(dx, dy); ux, uy = dx / d, dy / d
    wx, wy = tx - ux * 46, ty - uy * 46
    dx, dy = wx - sh[0], wy - sh[1]
    l1, l2 = A2.L_UARM, A2.L_FARM
    dd = min(math.hypot(dx, dy), l1 + l2 - 1)
    phi = math.atan2(dx, dy)
    al = math.acos(max(-1, min(1, (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd))))
    be = math.acos(max(-1, min(1, (l2 * l2 + dd * dd - l1 * l1) / (2 * l2 * dd))))
    a1 = phi - al; a2 = phi + be
    return dict(uarm_n=math.degrees(a1), elbow_n=math.degrees(a2 - a1), wrist_n=-12, hand_n=hand)


def man_pose(t):
    p, (fn, ln, ff, lf) = hip_and_feet(t)
    legs = leg_pose(p, fn, ln, ff, lf)
    moving = abs(hip_and_feet(t + 1 / 30)[0] - p) > 0.05
    # arms swing against the legs while walking (phase from the far foot's progress), rest when standing
    sw = (fn - ff) / 150.0
    br = 0.5 + 0.5 * math.sin(t * 2.2)
    look = 0.0
    blink = (t % 3.7) < 0.12 or (t % 5.3) < 0.1
    kw = dict(face=1, lean=4 + (2 if moving else 0), neck=-2 + 2 * math.sin(t * 0.7), br=br, blink=blink,
              uarm_n=-3 - 14 * sw, elbow_n=16, uarm_f=-3 + 14 * sw, elbow_f=16, hand_n='flat', hand_f='flat')
    kw.update(legs)
    if t < T_WATCH and t > 1.3:
        kw['neck'] = 4 + 2 * math.sin(t * 0.9)           # looking along the floor toward the door
    ps = A2.Pose(x=p, ground=GROUND, **kw)
    if 1.3 < t < T_WATCH:
        # he points along the floor at each piece Zeno names (halfway, then the quarter, then the eighth)
        wpt = smooth((t - (T_FIRST - 0.1)) / 0.35) * (1 - smooth((t - (T_THAT + 0.5)) / 0.35))
        if wpt > 0:
            # a different gesture for each piece: point low at the first half, an open hand sweeping on toward the
            # quarter, then a point lifted toward the door for the eighth; his head turns to each tile
            stage = 0 if t < T_THEN1 + 0.3 else (1 if t < T_THEN2 + 0.27 else 2)
            fc = (0.25, 0.625, 0.8125)[stage]
            J = MAN.joints(ps); sh = MAN.canvas_pt(ps, J['sh'])
            tx_, ty_ = frac_p(fc), GROUND + (10, -80, -170)[stage]
            d = math.hypot(tx_ - sh[0], ty_ - sh[1]); reach = (140, 150, 155)[stage]
            tgt = (sh[0] + (tx_ - sh[0]) / d * reach, sh[1] + (ty_ - sh[1]) / d * reach)
            a_ = arm_to(ps, tgt, hand='point')
            kw['uarm_n'] = lerp(kw['uarm_n'], a_['uarm_n'], wpt); kw['elbow_n'] = lerp(kw['elbow_n'], a_['elbow_n'], wpt)
            if wpt > 0.5: kw['hand_n'] = ('point', 'flat', 'point')[stage]
            if stage == 1: kw['wrist_n'] = 20 * math.sin((t - T_THEN1) * 2.0)
            look = (18, 12, 4)[stage]
            kw['neck'] = lerp(kw['neck'], look, wpt); kw['lean'] = kw['lean'] + (3, 1, -1)[stage] * wpt
        # a small shrug at "the halves never run out"
        wsh = smooth((t - (T_HALVES + 0.2)) / 0.3) * (1 - smooth((t - (T_HALVES + 1.4)) / 0.35))
        if wsh > 0:
            kw['uarm_n'] = lerp(kw['uarm_n'], 6, wsh); kw['elbow_n'] = lerp(kw['elbow_n'], 78, wsh)
            kw['uarm_f'] = lerp(kw['uarm_f'], 2, wsh); kw['elbow_f'] = lerp(kw['elbow_f'], 74, wsh)
            kw['neck'] = lerp(kw['neck'], -6, wsh)
        # leaning toward the door on "does he ever get there?"
        wq = smooth((t - (T_SO + 0.3)) / 0.4)
        kw['lean'] = kw['lean'] + 4 * wq; kw['neck'] = lerp(kw['neck'], 0, wq)
        ps = A2.Pose(x=p, ground=GROUND, **kw)
    # the hand to the handle: rises on "so yes", on the handle from "gets", stays on it while the door swings in
    if T_YES <= t < T_IN0:
        rest = MAN.canvas_pt(ps, MAN.joints(ps)['hand_n'][0])
        hp = handle_pos(t)
        u = ease_io((t - T_YES) / max(0.3, T_GETS - T_YES))
        tgt = (lerp(rest[0] + 10, hp[0], u), lerp(rest[1], hp[1], u))
        kw.update(arm_to(ps, tgt, hand='grip' if u >= 1 else 'flat'))
        kw['lean'] = 6 + 4 * u + 10 * door_angle(t) / DOOR_MAX
        ps = A2.Pose(x=p, ground=GROUND, **kw)
        kw.update(arm_to(ps, handle_pos(t) if u >= 1 else tgt, hand='grip' if u >= 1 else 'flat'))
        ps = A2.Pose(x=p, ground=GROUND, **kw)
    return ps


# ------------------------------------------------------------------ the place
_r = np.random.default_rng(31)
DUST = [(_r.uniform(-200, 1300), _r.uniform(520, 1250), _r.uniform(0.6, 1.6), _r.uniform(0, 6.28)) for _ in range(90)]
COLS = [-40 + k * 172 for k in range(6)]          # back row of columns (bases on the floor's back edge)
COL_W = 66
FLOOR_BACK, FLOOR_FRONT = 1150, 1440
ARCH_TOP, ARCH_BOT = 430, 560


def sky(c, t):
    lgrad(c, skia.Rect(-800, -400, 2000, 1500), -400, 1300, [(70, 64, 120), (196, 112, 110), (250, 170, 110), (255, 216, 150)], [0, 0.42, 0.75, 1])
    # the low sun behind him (left), soft disc and glow
    sx, sy = -60, 1040
    if CUR_Z < 2.5: c.drawCircle(sx, sy, 420, P((255, 214, 150), 70, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 120)))
    c.drawCircle(sx, sy, 90, P((255, 240, 200), 235))
    # far sea and hills in haze
    p = skia.Path(); p.moveTo(-800, 1060)
    for k in range(30): p.lineTo(-800 + k * 100, 1000 - 40 * math.sin(k * 0.9) - 22 * math.sin(k * 2.3))
    p.lineTo(2000, 1500); p.lineTo(-800, 1500); p.close()
    c.drawPath(p, P((206, 140, 140)))
    c.drawRect(skia.Rect(-800, 1060, 2000, 1500), P((228, 162, 132)))
    for k in range(7):                                   # glints drifting on the sea
        x = (k * 210 + t * 14) % 1400 - 200
        c.drawRect(skia.Rect(x, 1080 + k * 9, x + 70 + 20 * math.sin(t + k), 1083 + k * 9), P((255, 226, 180), 120))
    # a far temple on the hill
    for k in range(5):
        c.drawRect(skia.Rect(600 + k * 26, 952, 610 + k * 26, 994), P((190, 128, 132)))
    c.drawRect(skia.Rect(592, 942, 722, 954), P((190, 128, 132)))
    tri = skia.Path(); tri.moveTo(592, 942); tri.lineTo(657, 922); tri.lineTo(722, 942); tri.close(); c.drawPath(tri, P((190, 128, 132)))


def column(c, x, top, bot, w=COL_W, col=(232, 196, 150), sh=(178, 132, 110)):
    body = skia.Path(); body.addRect(skia.Rect(x - w / 2, top + 40, x + w / 2, bot - 26))
    c.drawPath(body, P(col))
    c.drawRect(skia.Rect(x + w * 0.05, top + 40, x + w / 2, bot - 26), P(sh))           # shade side away from the sun
    c.drawRect(skia.Rect(x - w / 2, top + 40, x - w / 2 + 6, bot - 26), P((255, 230, 180), 220))   # sun rim on the left
    for k in range(1, 5):                                                                   # flutes
        fx = x - w / 2 + k * w / 5
        c.drawLine(fx, top + 46, fx, bot - 30, SP(mix(col, sh, 0.6) if fx < x else mix(sh, (120, 84, 80), 0.4), 2, 150))
    c.drawRect(skia.Rect(x - w / 2 - 14, top + 16, x + w / 2 + 14, top + 40), P(col))   # capital
    c.drawRect(skia.Rect(x - w / 2 - 20, top, x + w / 2 + 20, top + 16), P(mix(col, sh, 0.3)))
    c.drawRect(skia.Rect(x - w / 2 - 12, bot - 26, x + w / 2 + 12, bot), P(mix(col, sh, 0.25)))   # base


def colonnade(c, t):
    # back wall of the stoa in deep shade, with the light shafts' bright patches on it
    c.drawRect(skia.Rect(-400, ARCH_BOT, 860, FLOOR_BACK), P((150, 96, 96), 0))
    for x in COLS:
        column(c, x, ARCH_BOT - 10, FLOOR_BACK)
    # entablature (the beam above the columns) and the roof edge
    c.drawRect(skia.Rect(-400, ARCH_TOP, 900, ARCH_BOT), P((214, 172, 136)))
    c.drawRect(skia.Rect(-400, ARCH_BOT - 26, 900, ARCH_BOT), P((176, 128, 110)))
    for k in range(-3, 12):
        x = k * 86
        c.drawRect(skia.Rect(x, ARCH_TOP + 20, x + 26, ARCH_BOT - 40), P((190, 146, 120)))  # triglyphs
    c.drawRect(skia.Rect(-400, ARCH_TOP - 30, 900, ARCH_TOP), P((236, 198, 160)))


def wall_and_door(c, t):
    # the end wall, in the warm side light, with the door
    wall = skia.Path(); wall.addRect(skia.Rect(842, ARCH_TOP - 60, 1500, FLOOR_FRONT))
    flat(c, wall, (218, 170, 132), (186, 136, 110), sh_off=(40, 0))
    for k in range(9):
        y = ARCH_TOP + k * 92
        c.drawLine(842, y, 1500, y, SP((176, 128, 106), 3, 160))
        for j in range(4):
            x = 842 + ((j * 170 + (k % 2) * 85))
            c.drawLine(x, y, x, y + 92, SP((176, 128, 106), 3, 140))
    c.drawRect(skia.Rect(842, ARCH_TOP - 60, 852, FLOOR_FRONT), P((255, 226, 176), 200))   # sun on its edge
    # doorway (the warm room behind), stone frame
    fr = skia.Rect(DOOR_X0 - 20, DOOR_TOP - 30, DOOR_X1 + 20, GROUND + 2)
    c.drawRect(fr, P((196, 150, 118)))
    room = skia.Rect(DOOR_X0, DOOR_TOP, DOOR_X1, GROUND)
    a = door_angle(t)
    glow = min(1.0, a / 40)
    lgrad(c, room, DOOR_TOP, GROUND, [mix((60, 36, 30), (255, 214, 140), glow), mix((40, 24, 22), (255, 180, 100), glow)])



def floor(c, t):
    lgrad(c, skia.Rect(-400, FLOOR_BACK, 1500, FLOOR_FRONT), FLOOR_BACK, FLOOR_FRONT, [(214, 164, 128), (236, 190, 146)])
    # slab joints, receding (depth: joints converge toward a far point above)
    for y in (1176, 1214, 1262, 1322, 1394):
        c.drawLine(-400, y, 1500, y, SP((188, 138, 110), 3, 150))
    for k in range(-6, 14):
        xb = k * 140
        c.drawLine(xb + (FLOOR_BACK - 1150) * 0, FLOOR_BACK, xb + (k - 4) * 34, FLOOR_FRONT, SP((188, 138, 110), 3, 120))
    # long column shadows thrown to the right by the low sun
    for x in COLS:
        sh = skia.Path(); sh.moveTo(x - 30, FLOOR_BACK); sh.lineTo(x + 30, FLOOR_BACK); sh.lineTo(x + 30 + 300, FLOOR_FRONT); sh.lineTo(x - 30 + 300, FLOOR_FRONT); sh.close()
        c.drawPath(sh, P((150, 92, 96), 70, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4)) if CUR_Z < 2.5 else P((150, 92, 96), 70))
    # the step's front face
    c.drawRect(skia.Rect(-400, FLOOR_FRONT, 1500, 1520), P((170, 118, 100)))
    c.drawRect(skia.Rect(-400, FLOOR_FRONT, 1500, FLOOR_FRONT + 6), P((255, 222, 176), 200))
    for k in range(6):
        y = 1520 + k * 70
        c.drawRect(skia.Rect(-400, y, 1500, y + 70), P(mix((176, 122, 102), (110, 72, 70), k / 6)))
        c.drawRect(skia.Rect(-400, y, 1500, y + 6), P((255, 214, 170), 170 - k * 20))
        for j in range(10):
            sx = -300 + j * 190 + (k % 2) * 95
            c.drawLine(sx, y + 8, sx, y + 70, SP((120, 80, 72), 2, 120))


def shafts(c, t):
    """light between the columns (screened, reads as light) and dust hanging in it"""
    c.saveLayer(None, skia.Paint(BlendMode=skia.BlendMode.kScreen))
    for x in COLS[:-1]:
        g = x + COL_W / 2 + 10
        p = skia.Path(); p.moveTo(g, ARCH_BOT); p.lineTo(g + 100, ARCH_BOT); p.lineTo(g + 520, FLOOR_FRONT); p.lineTo(g + 330, FLOOR_FRONT); p.close()
        a = 46 + 10 * math.sin(t * 0.6 + x)
        c.drawPath(p, P((255, 196, 130), a, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 22)))
    rt = slowmo_rate(t)
    for (x, y, s, ph) in DUST:
        tt = dust_clock(t)
        xx = x + 10 * math.sin(tt * 0.4 * s + ph) + tt * 4 * s; yy = y + 12 * math.sin(tt * 0.3 + ph * 2)
        c.drawCircle(xx % 1300 - 100, yy, 2.0 * s, P((255, 236, 200), 90 + 60 * math.sin(tt * s + ph)))
    c.restore()


def slowmo_rate(t):
    return 1.0


def dust_clock(t):
    """the dust hangs in slow motion with him during the slow pass (time itself looks slowed)"""
    if T_WATCH + 0.1 < t < T_RW0:
        return T_WATCH + 0.1 + real_pass1(t) * 1.0
    if t >= T_RW0: return t - (T_RW0 - (T_WATCH + 0.1) - real_pass1(T_RW0))
    return t


def foreground(c, t, tx):
    """close to the lens, out of focus: an olive branch moving in the breeze"""
    c.save(); c.translate((tx - 640) * -0.3, 0)
    # olive branch at the bottom left, swaying
    c.save(); kit.blur_layer(c, 16)
    sw = 6 * math.sin(t * 0.9) + 3 * math.sin(t * 2.1)
    c.translate(-40, 1900); c.rotate(-28 + sw * 0.4)
    c.drawLine(0, 0, 520, -40, SP((70, 56, 40), 14))
    for k in range(9):
        x = 60 + k * 54; y = -6 - k * 4; ang = (35 if k % 2 else -35) + sw * (0.5 + k * 0.1)
        c.save(); c.translate(x, y); c.rotate(ang)
        leaf = skia.Path(); leaf.addOval(skia.Rect(0, -11, 120, 11)); c.drawPath(leaf, P((96, 120, 70) if k % 2 else (124, 146, 90)))
        c.restore()
    c.restore(); c.restore()
    c.restore()


# ------------------------------------------------------------------ the halves on the floor: glowing tiles
FR = ['1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128', '1/256', '1/512', '1/1024', '1/2048', '1/4096']
NT = 26
CUR_Z = 1.0


def tile_born(k):
    """when Zeno names piece k: 1/2 on "halfway", 1/4 and 1/8 on their words, then a fast cascade, ever finer"""
    if k < 3: return [T_HALFWAY - 0.1, T_THEN1 + 0.3, T_THEN2 + 0.27][k]
    return T_HALVES + 0.1 + (k - 3) * 0.24


def frac_label(c, x, y, text, a, size=34, col=Wt):
    if a <= 0: return
    f = skia.Font(L.BLACK, size); w = f.measureText(text)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 14, y - size - 4, x + w / 2 + 14, y + 12), 16, 16), P((22, 16, 36), 200 * a))
    c.drawString(text, x - w / 2, y, f, P(col, 255 * a))


def tile(c, x0, x1, col, a, lit):
    """one piece of the walk as a tile of light set into the floor (a parallelogram on the floor plane)"""
    if a <= 0 or (x1 - x0) * CUR_Z * Z0 < 0.4: return
    if CUR_Z > 2.5:     # close up in the floor zoom: crisp slivers, edges a constant few pixels on screen
        y0, y1, sk = GROUND - 8, GROUND + 44, 16
        p = skia.Path(); p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1 + sk, y1); p.lineTo(x0 + sk, y1); p.close()
        c.drawPath(p, P(mix(col, (120, 50, 60), 0.3 * (1 - lit)), (215 + 40 * lit) * a))
        e = skia.Path(); e.moveTo(x1, y0); e.lineTo(x1 + sk, y1)
        c.drawPath(e, SP((255, 246, 214), 5.0 / (CUR_Z * Z0), 255 * a))
        c.drawRect(skia.Rect(x0, y0, x1, y0 + 5.0 / (CUR_Z * Z0)), P((255, 250, 230), 230 * a))
        return
    y0, y1, sk = GROUND - 8, GROUND + 44, 16
    p = skia.Path(); p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1 + sk, y1); p.lineTo(x0 + sk, y1); p.close()
    c.drawPath(p, P(mix(col, (120, 50, 60), 0.3 * (1 - lit)), (215 + 40 * lit) * a))
    c.drawRect(skia.Rect(x0 + 2, y0, x1 - 1, y0 + 5), P((255, 250, 230), (170 + 85 * lit) * a))
    c.save(); c.saveLayer(None, skia.Paint(BlendMode=skia.BlendMode.kScreen))
    c.drawPath(p, P(mix(col, (255, 255, 255), 0.4), (90 + 110 * lit) * a, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14)))
    o = skia.Path(p); c.drawPath(o, SP(mix(col, (255, 255, 255), 0.6), 4, 200 * a, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 3)))
    e = skia.Path(); e.moveTo(x1, y0 - 2); e.lineTo(x1 + sk, y1 + 2)
    c.drawPath(e, SP((255, 246, 214), 4.5, 255 * a))
    c.restore(); c.restore()


def halves(c, t, p):
    """Zeno's pieces as tiles: named one by one, then denser and denser toward the door; they brighten as he crosses
    them and carry their fraction labels"""
    f = (p - X0) / DPX
    rewound = T_RW0 <= t < T_GO
    for k in range(NT):
        lo, hi = 1 - 0.5 ** k, 1 - 0.5 ** (k + 1)
        a = smooth((t - tile_born(k)) / 0.25)
        crossed = 0.0 if rewound else smooth((f - lo) / max(1e-6, hi - lo))
        if t >= T_GO: crossed = smooth((f - lo) / max(1e-6, hi - lo))
        tile(c, frac_p(lo), frac_p(hi), PIECE_COLS[k % len(PIECE_COLS)], a, crossed)
        w = DPX * (hi - lo)
        size = [36, 32, 28, 24][k] if k < 4 else 0
        la = a * (1 - smooth((t - (T_YES - 0.3)) / 0.4))
        la *= 1 - smooth((CUR_Z - 2.0) / 1.0)
        if k < 3 and w > 26 and la > 0:
            pop = 1 + 0.35 * (1 - smooth((t - tile_born(k)) / 0.3)) if t < tile_born(k) + 0.3 else 1.0
            cx_, cy_ = (frac_p(lo) + frac_p(hi)) / 2 + 8, GROUND + 92
            c.save(); c.translate(cx_, cy_ - size / 2); c.scale(pop, pop); c.translate(-cx_, -(cy_ - size / 2))
            frac_label(c, cx_, cy_, FR[k], la, size=size)
            c.restore()


def hook_path(c, t, p):
    """the hook: a dashed line of light runs along the floor from him to the door (the way he has to cover)"""
    a = smooth((t - 0.6) / 0.5) * (1 - smooth((t - (T_HALFWAY - 0.3)) / 0.4))
    if a <= 0: return
    x0 = p + FRONT; x1 = frac_p(1.0)
    grow = smooth((t - 0.6) / 1.2)
    xe = lerp(x0, x1, grow)
    c.save(); c.saveLayer(None, skia.Paint(BlendMode=skia.BlendMode.kScreen))
    ph = (t * 60) % 40
    x = x0 + ph
    while x < xe - 10:
        c.drawRect(skia.Rect(x, GROUND + 8, min(x + 22, xe), GROUND + 16), P((255, 226, 160), 210 * a))
        x += 40
    c.drawCircle(x1, GROUND + 12, 10 + 3 * math.sin(t * 5), P((255, 226, 160), 200 * a * grow, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 5)))
    c.restore(); c.restore()


# ------------------------------------------------------------------ HUD: stopwatch and the distance and time bars
BX0, BX1 = 120, 960
T_PUSH = T_EACH - 0.1                        # the floor zoom takes over from the slow motion on "Each step"
T_ZOUT0 = T_INF + 0.3                        # it pulls back out for "EXACTLY"
T_ZOUT1 = T_EXACT - 0.15
T_LOOP = T_END                               # the last 1.6 s cut to the opening walk, so the loop lands on frame 0


def gap_px(t):
    """the real gap between his front and the door (world px) during the slow pass"""
    r = real_pass1(t); return DPX * (1 - r / T_REAL)


def floor_zoom(t):
    """camera zoom (times Z0) into the floor gap at his feet: it ramps in, then doubles every second while the gap
    halves every second, so there is always another sliver; then it pulls back out. Returns (z, takeover 0..1)"""
    if t < T_PUSH or t >= T_ZOUT1: return 1.0, 0.0
    zr = 300.0 / (gap_px(T_PUSH + 1.4) * Z0)              # the gap fills about 300 px on screen
    if t < T_PUSH + 1.4:
        u = ease_io((t - T_PUSH) / 1.4); z = 2 ** (math.log2(zr) * u)
    elif t < T_ZOUT0:
        z = 300.0 / (gap_px(t) * Z0)
    else:
        zmax = 300.0 / (gap_px(T_ZOUT0) * Z0)
        u = ease_io((t - T_ZOUT0) / (T_ZOUT1 - T_ZOUT0)); z = 2 ** (math.log2(zmax) * (1 - u))
    return max(1.0, z), smooth((t - T_PUSH) / 0.5) * (1 - smooth((t - (T_ZOUT1 - 0.6)) / 0.6))


def bar_zoom(t):
    return 1.0, 0.0


def bar(c, y, label, fill, a, t, unit=None, Z=1.0, hgt=44, door=False):
    if a <= 0: return
    f = skia.Font(L.XBOLD, 26)
    c.drawString(label, BX0, y - 22, f, P((255, 240, 220), 235 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(BX0 - 8, y - 8, BX1 + 8, y + hgt + 8), 14, 14), P((22, 16, 36), 185 * a))
    W_ = BX1 - BX0
    X = lambda fr: BX1 - (1 - fr) * W_ * Z          # the right end (the door) stays put as the bar is magnified
    c.save(); c.clipRect(skia.Rect(BX0, y - 4, BX1, y + hgt + 4))
    for k in range(40):
        lo, hi = 1 - 0.5 ** k, 1 - 0.5 ** (k + 1)
        if fill <= lo: break
        x0 = max(BX0 - 10, X(lo)); x1 = X(min(hi, fill))
        if x1 < BX0: continue
        if x1 - x0 < 0.3: break
        c.drawRect(skia.Rect(x0, y, x1, y + hgt), P(PIECE_COLS[k % len(PIECE_COLS)], 245 * a))
        c.drawLine(x1, y, x1, y + hgt, SP((30, 20, 40), 2.5, 220 * a))
        txt = ('1/' + str(2 ** (k + 1))) if unit is None else (unit[k] if k < len(unit) else '')
        if txt and fill >= hi - 1e-6:
            for fs_ in (28, 24, 20):
                fs = skia.Font(L.BLACK, fs_); w = fs.measureText(txt)
                if w < (x1 - max(x0, BX0)) - 8:
                    c.drawString(txt, (max(x0, BX0) + x1 - w) / 2, y + hgt / 2 + fs_ * 0.36, fs, P((30, 20, 40), 255 * a)); break
    c.restore()
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(BX0, y, BX1, y + hgt), 6, 6), SP((255, 240, 220), 3, 210 * a))
    if door:   # the door at the bar's right end
        c.drawRect(skia.Rect(BX1 + 14, y - 6, BX1 + 36, y + hgt + 6), P((132, 82, 50), 255 * a))
        c.drawCircle(BX1 + 19, y + hgt / 2 + 4, 3, P((220, 170, 90), 255 * a))


def stopwatch(c, t, a):
    if a <= 0: return
    r = real_time(t)
    f = skia.Font(L.BLACK, 42); txt = f'{r:0.2f} s'
    x, y = 60, HY_SW - 8
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + 256, y + 66), 30, 30), P((22, 16, 36), 205 * a))
    cx, cy = x + 34, y + 33
    c.drawCircle(cx, cy, 18, SP((255, 240, 220), 4, 255 * a))
    c.drawRect(skia.Rect(cx - 5, cy - 28, cx + 5, cy - 22), P((255, 240, 220), 255 * a))
    ang = r / T_REAL * 2 * math.pi
    c.drawLine(cx, cy, cx + 14 * math.sin(ang), cy - 14 * math.cos(ang), SP(GOLD, 4, 255 * a))
    c.drawString(txt, x + 66, y + 48, f, P((255, 240, 220), 255 * a))
    lab = skia.Font(L.XBOLD, 28)
    rw = T_RW0 <= t < T_RW1
    tag = 'REWIND' if rw else ('SLOW MOTION' if T_WATCH + 0.1 < t < T_PUSH + 0.3 else ('REAL SPEED' if T_GO <= t < T_GO + T_REAL + 0.4 else ''))
    if tag:
        w = lab.measureText(tag)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 268, y + 12, x + 300 + w, y + 54), 20, 20), P(ACC if not rw else (236, 112, 120), 235 * a))
        c.drawString(tag, x + 284, y + 43, lab, P((20, 14, 30), 255 * a))


HY_SW, HY_D, HY_T, HY_F = 412, 518, 608, 698     # the HUD band: under the title, above his head
HB = 34


def hud(c, t, p):
    if t < 0: return
    f = (p - X0) / DPX
    a1 = smooth((t - T_WATCH) / 0.35) * (1 - smooth((t - (T_YES + 0.2)) / 0.4))
    z, tk = floor_zoom(t)
    zooming = T_PUSH <= t < T_AND3 - 0.05
    stopwatch(c, t, a1)
    # during the floor zoom the bar steps aside (the floor itself shows the slivers) and a zoom chip counts up
    ab = a1 * (1 - tk) if t < T_ZOUT1 else a1
    fill = f
    if t >= T_ZOUT1 and t < T_AND3 - 0.05: fill = 1.0
    snap = 0.0
    if T_ZOUT1 <= t < T_AND3 - 0.05:
        snap = 1 - smooth((t - T_ZOUT1) / 0.35)
    c.save()
    if snap > 0:
        sc = 1 + 0.08 * snap; c.translate(540, HY_D + HB / 2); c.scale(sc, sc); c.translate(-540, -(HY_D + HB / 2))
    bar(c, HY_D, 'DISTANCE', max(0.0, fill), ab, t, hgt=HB)
    if snap > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(BX0 - 8, HY_D - 8, BX1 + 8, HY_D + HB + 8), 14, 14), P((255, 248, 220), 220 * snap))
    c.restore()
    if T_ZOUT1 <= t < T_AND3 - 0.05:
        u = smooth((t - T_ZOUT1) / 0.2)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(BX0 - 8, HY_D - 8, BX1 + 8, HY_D + HB + 8), 14, 14), SP(GOLD, 6, 255 * u * a1))
        frac_label(c, 540, HY_T + 30, '1/2 + 1/4 + 1/8 + ... = 1', u * a1, size=46, col=GOLD)
    if zooming and tk > 0:
        fz = skia.Font(L.XBOLD, 30); tz = 'ZOOM ×' + str(int(round(z * Z0 / 1.18))) if z < 2 else 'ZOOM ×' + str(2 ** int(math.log2(z * Z0)))
        wz = fz.measureText(tz)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(BX1 - wz - 24, HY_SW - 2, BX1 + 4, HY_SW + 44), 22, 22), P((22, 16, 36), 210 * tk * a1))
        c.drawString(tz, BX1 - wz - 10, HY_SW + 32, fz, P(ACC, 255 * tk * a1))
    if t >= T_AND3 - 0.05:
        rt = real_time(t) / T_REAL if t >= T_GO else 0.0
        bar(c, HY_T, 'TIME', rt, a1, t, unit=['1.6 s', '0.8 s', '0.4', '0.2'], hgt=HB)
        if t >= T_SECONDS - 0.1:
            u = smooth((t - (T_SECONDS - 0.1)) / 0.3)
            frac_label(c, 540, HY_F + 4, '1.6 + 0.8 + 0.4 + ... = 3.2 s', u * a1, size=30, col=GOLD)


def zoom_labels(c, t, cam):
    """in the floor zoom, label every sliver wide enough on screen (screen space, so they stay readable)"""
    z, tk = floor_zoom(t)
    if tk <= 0 or z < 2.5: return
    zz, tx, ty = cam
    for k in range(NT):
        lo, hi = 1 - 0.5 ** k, 1 - 0.5 ** (k + 1)
        x0 = 540 + (frac_p(lo) - tx) * zz; x1 = 540 + (frac_p(hi) - tx) * zz
        if x1 - x0 < 110 or x1 < 60 or x0 > 1020: continue
        cx_ = min(1000, max(80, (max(x0, 0) + min(x1, 1080)) / 2))
        frac_label(c, cx_, 1290, '1/' + str(2 ** (k + 1)), tk, size=40, col=Wt)


# ------------------------------------------------------------------ camera
def camera(t):
    z, x, y = _cam(t)
    return z * Z0, x, y + 50          # the world sits a little higher so the floor tiles stay clear of the captions


BASE = (1.0, 640, 960)


def _cam(t):
    """zoom (times Z0), target x, target y (world, before the +50 below), anchored at screen (540, 980)"""
    OPEN = (1.15, 620, 962)
    if t < 0: return OPEN
    if t < T_HALVES:
        u = ease_io((t - 1.6) / (T_HALVES - 1.6)) if t > 1.6 else 0.0
        return (lerp(1.15, 1.0, u), lerp(620, 640, u), lerp(962, 960, u))
    if t < T_WATCH:
        u = ease_io((t - T_HALVES) / 1.4); v = ease_io((t - T_SO) / (T_WATCH - T_SO)) if t > T_SO else 0
        z = lerp(1.0, 1.06, u); z = lerp(z, 1.0, v)
        return (z, lerp(lerp(640, 662, u), 640, v), lerp(lerp(960, 1010, u), 960, v))
    if t < T_PUSH:
        return (1.0, 640, 960)
    if t < T_ZOUT1:
        z, _ = floor_zoom(t)
        # aim at the middle of the gap between his front and the door, on the floor
        gx = frac_p(1.0) - gap_px(min(t, T_ZOUT0)) / 2
        u = smooth(math.log2(max(1.0, z)) / 2.0)
        zz = z * Z0
        ty_ = (GROUND - 8) + 150.0 / zz      # the floor line sits about 150 px above screen centre: door base and boot above, slivers below
        return (z, lerp(640, gx, u), lerp(960, ty_ - 50, u))
    if t < T_YES:
        return (1.0, 640, 960)
    if t < T_IN0:
        u = ease_io((t - T_YES) / (T_IN0 - T_YES)); return (lerp(1.0, 1.22, u), lerp(640, 800, u), lerp(960, 990, u))
    u = ease_io((t - T_IN0) / (T_LOOP - T_IN0)); return (lerp(1.22, 1.3, u), lerp(800, 860, u), lerp(990, 980, u))


def scene(c, t):
    global CUR_Z
    if t >= T_LOOP: t = t - DUR                    # the last 1.6 s: the opening walk again (loop)
    cam = camera(t); z, tx, ty = cam
    CUR_Z = z / Z0
    c.save(); c.translate(540, 980); c.scale(z, z); c.translate(-tx, -ty)
    c.save(); c.translate((tx - 640) * 0.35 * min(1, 2 / CUR_Z), (ty - 960) * 0.2 * min(1, 2 / CUR_Z))
    sky(c, t)
    c.restore()
    colonnade(c, t)
    floor(c, t)
    p, _ = hip_and_feet(t)
    wall_and_door(c, t)
    door_light(c, t)
    door_leaf(c, t)
    halves(c, t, p)
    hook_path(c, t, p)
    li = light_in(t)
    if li < 0.995:
        if CUR_Z < 2.5:
            sh = skia.Path(); sh.moveTo(p - 30, GROUND); sh.lineTo(p + 30, GROUND); sh.lineTo(p + 240, GROUND + 130); sh.lineTo(p + 170, GROUND + 140); sh.close()
            c.drawPath(sh, P((140, 84, 90), 70 * (1 - li), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6)))
        ps = man_pose(t)
        MAN.draw(c, ps, light=LIGHT, shadow=CUR_Z < 2.5, tint=(255, 236, 196, int(255 * min(1.0, li * 1.15))) if li > 0 else None)
    door_wash(c, t)
    if CUR_Z < 2.5:
        shafts(c, t)
        foreground(c, t, tx)
    c.restore()
    zoom_labels(c, t, cam)
    hud(c, t, p)


def door_light(c, t):
    """warm light from the room, only in the open gap beside the swinging door"""
    a = door_angle(t)
    if a <= 0: return
    w = (DOOR_X1 - DOOR_X0) * math.cos(math.radians(a))
    c.save(); c.saveLayer(None, skia.Paint(BlendMode=skia.BlendMode.kScreen))
    c.drawRect(skia.Rect(DOOR_X0, DOOR_TOP, DOOR_X1 - w, GROUND), P((255, 222, 160), 150 * a / DOOR_MAX))
    c.restore(); c.restore()


def door_leaf(c, t):
    """the door slab, hinged on its right edge, swinging in; the ring is fixed to the slab and turns with it"""
    a = door_angle(t); ca = math.cos(math.radians(a))
    w = (DOOR_X1 - DOOR_X0) * ca
    leaf = skia.Rect(DOOR_X1 - w, DOOR_TOP, DOOR_X1, GROUND)
    shade = 0.35 * math.sin(math.radians(a))
    c.drawRect(leaf, P(mix((132, 82, 50), (70, 42, 28), shade)))
    for k in range(1, 5):
        x = DOOR_X1 - w + k * w / 5
        c.drawLine(x, DOOR_TOP + 6, x, GROUND - 6, SP((96, 58, 36), 3, 200))
    for yy in (DOOR_TOP + 70, GROUND - 90):
        c.drawRect(skia.Rect(DOOR_X1 - w + 4, yy, DOOR_X1 - 4, yy + 14), P((70, 52, 40)))
        for k in range(4): c.drawCircle(DOOR_X1 - w + 10 + k * w / 4, yy + 7, 3.5, P((210, 170, 100)))
    # the bronze ring on the slab: its plate and ring foreshorten with the slab's turn
    hx, hy = handle_pos(t)
    c.drawOval(skia.Rect(hx - 7 * ca, hy - 21, hx + 7 * ca, hy - 7), P((160, 116, 60)))
    c.drawOval(skia.Rect(hx - 15 * ca, hy - 15, hx + 15 * ca, hy + 15), SP((200, 150, 70), 5))
    c.drawOval(skia.Rect(hx - 18 * ca, hy - 18, hx + 12 * ca, hy + 12), SP((255, 214, 130), 1.5, 180))
    if a > 0:   # warm light spilling out onto the floor
        g = min(1.0, a / 40)
        sp = skia.Path(); sp.moveTo(DOOR_X0, GROUND); sp.lineTo(DOOR_X1 - w, GROUND); sp.lineTo(DOOR_X1 - w - 60, FLOOR_FRONT); sp.lineTo(DOOR_X0 - 220, FLOOR_FRONT); sp.close()
        c.drawPath(sp, P((255, 210, 140), 110 * g, BlendMode=skia.BlendMode.kScreen, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 18)))


def door_wash(c, t):
    """the bloom that swallows him as he steps into the light"""
    li = light_in(t)
    wash = li * (1 - smooth((t - (T_IN1 + 0.2)) / 0.8))
    if wash <= 0: return
    w = (DOOR_X1 - DOOR_X0) * math.cos(math.radians(door_angle(t)))
    c.save(); c.saveLayer(None, skia.Paint(BlendMode=skia.BlendMode.kScreen))
    c.drawRect(skia.Rect(DOOR_X0 - 70, DOOR_TOP - 30, DOOR_X1 - w + 30, GROUND + 30), P((255, 236, 200), 255 * wash, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 26)))
    c.drawCircle((DOOR_X0 + DOOR_X1) / 2, (DOOR_TOP + GROUND) / 2, 260, P((255, 200, 130), 70 * wash, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 90)))
    c.restore(); c.restore()


TITLES = [
    (0.0, [[("ZENO'S PARADOX", Y)], [('NEVER REACH THE DOOR?', Wt)]]),
    (T_FIRST - 0.1, [[('FIRST:', Wt), (' HALFWAY', Y)]]),
    (T_THEN1 - 0.1, [[('THEN HALF', Wt)], [("OF WHAT'S LEFT", Y)]]),
    (T_HALVES - 0.1, [[('THE HALVES', Wt)], [('NEVER RUN OUT', Y)]]),
    (T_WATCH - 0.1, [[('WATCH THE', Wt), (' PIECES', Y)]]),
    (T_EACH - 0.1, [[('CLOSER', Wt)], [('AND CLOSER', Y)]]),
    (T_INF - 0.1, [[('INFINITELY', Y)], [('MANY PIECES', Wt)]]),
    (T_EXACT - 0.15, [[('EXACTLY', Y)], [('THE WHOLE WAY', Wt)]]),
    (T_AND3 - 0.05, [[('AND THE', Wt), (' TIME?', Y)]]),
    (T_TIMES - 0.1, [[('THE TIMES', Wt)], [('HALVE TOO', Y)]]),
    (T_YES - 0.1, [[('HE GETS', Wt), (' THERE', Y)]]),
    (T_INFIN - 0.1, [[('INFINITE SERIES', Y)], [('THAT CONVERGES', Wt)]]),
    (T_LOOP, [[('NEVER REACH THE DOOR?', Wt)], [('HE DID.', Y)]]),
]

FIX = {"THAT.": "that.", "EXACTLY": "exactly", "THAT": "that"}
SHORT = kit.Short(WD, 'AP CALCULUS BC', TITLES, scene, DUR, T_END + 99, fix=FIX, cuts=())
SHORT.t_url = T_END
SHORT.hard = {T_AND3 - 0.05, T_LOOP}


if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir=f'{OUT}/stills')
