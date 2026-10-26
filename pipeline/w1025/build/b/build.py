"""LevlPrep Short w1025-02-free-throw (AP Statistics, first one). Vertical 1080x1920, 30 fps, skia.

Story: an outdoor court at golden hour (new flat layered Gemini scene, b_court_wide.jpg, court extended toward the camera).
Frame zero: a ball clanks off the front of the rim, the fifth red X lands in a tally of misses; the rebound bounces back
to the girl at the free throw line (the traced girl from the flat courtyard Short, code drawn). "Next one's due?" bubble,
then GAMBLER'S FALLACY; the X tally dissolves ("no memory"); a 70% chip; she shoots (real motion capture CMU 124_04
"Basketball Free Throw") and the camera follows the ball. Fast forward: she keeps shooting while a live graph plots her
running make percentage, first over 10 shots (jumping around), then the axis grows to 300 shots and the line settles
near the dashed 70% line. A grid of all 300 shots shows the first 5 misses still there, just drowned out. Back to her
for the question, five green makes, two chips. Spoken CTA over the end card.

MOTIONS (for the accuracy check):
1 Ball: projectile with g = 9.81 m/s^2 at the scene's scale (rim 3.05 m above the court, free throw line 4.57 m from
  the backboard); misses hit the front of the rim and rebound, bounces lose energy (restitution 0.75), rolls are drawn
  rotating with the ball's speed.
2 Girl (recorded 124_04): stands, sets the ball at her chest, shoots at 4.45 s of the take (ball leaves her hands at the
  top of the motion), follows through. Fast forward = the same take looped at 3x, labelled FAST FORWARD.
3 Graph: running proportion of makes for one simulated sequence: shots 1 to 5 are the misses shown at the start (given),
  shots 6 to 300 independent with p = 0.70 (seeded random, numpy default_rng(19)); it ends at 69.3%, not exactly 70%.
4 Shot 6 (the one she takes after the misses) is a make in that sequence and in the video; the 5 makes at the end are
  labelled as a separate run ("five makes in a row").
"""
import sys, math, json, os
sys.path[:0] = ['/home/claude/w1025']
import numpy as np, skia, cv2
import kit as K
from kit import smooth, col, TEAL, YELLOW, CORAL, WHITE, GREEN, lerp, clamp, W_, H_, FPS
import layout as L
sys.path[:0] = ['/home/claude/jump/side', '/home/claude/jump']
for m in ('model',):
    sys.modules.pop(m, None)
import model, partrig, perf
import mocap_perf as MP

VID = 'w1025-02-free-throw'
OUT = f'/home/claude/w1025/out/{VID}'
PS = 2.5                     # plate px -> world px
PXM = 135 * PS               # world px per metre (rim 3.05 m above the court in the painting)
CS = PXM / 525.0             # rig px -> world px (the girl is 1.6 m = 840 rig px)
GROUND = 645 * PS            # world y of the court under her feet (the pole base row)
RIM = np.array([1180 * PS, 233 * PS])     # rim centre (world)
RIM_R = 0.23 * PXM
BACKBOARD_X = 1226 * PS
FT_X = BACKBOARD_X - 4.57 * PXM          # free throw line
X0 = FT_X - 0.20 * PXM                   # her hip (rig origin) a little behind the line
BALL_R = 0.12 * PXM
G = 9.81 * PXM
EXT = 420                                # world px of court added toward the camera

SHOT = MP.Take('124_04', near='Left')
FIXED = perf.repair(SHOT)
REL = 4.45                               # release time in the take

rng = np.random.default_rng(19)
SEQ = np.r_[np.zeros(5), (rng.random(295) < 0.7)].astype(int)
SEQ[5:10] = [1, 0, 1, 1, 0]          # shots 6 to 10 make the early line visibly go up and down
RUN = np.cumsum(SEQ) / np.arange(1, 301)


def court():
    a = K.load_rgb(K.ART + 'b_court_wide.jpg')
    b = cv2.resize(a, (int(a.shape[1] * PS), int(a.shape[0] * PS)), interpolation=cv2.INTER_CUBIC)
    b = cv2.addWeighted(b, 1.3, cv2.GaussianBlur(b, (0, 0), 1.4), -0.3, 0)
    # court continued toward the camera: the last rows stretched, a little darker (nearer, out of the sun)
    tail = b[-60:].astype(np.float32)
    rows = []
    for k in range(EXT):
        rows.append(tail[-1 - (k % 30)] * (1 - 0.18 * k / EXT))
    ext = np.stack(rows, 0).clip(0, 255).astype(np.uint8)
    ext = cv2.GaussianBlur(ext, (1, 0), 0) if False else ext
    return np.concatenate([b, ext], 0)


def draw_ball(c, p, r, ang, a=1.0):
    if a <= 0.01:
        return
    x, y = p
    c.save(); c.translate(x, y); c.rotate(math.degrees(ang))
    c.drawCircle(0, 0, r, skia.Paint(AntiAlias=True, Color=col((0xe8, 0x7a, 0x2a), 255 * a)))
    sh = skia.Path(); sh.addCircle(0, 0, r)
    c.save(); c.clipPath(sh, doAntiAlias=True)
    c.drawCircle(r * 0.28, r * 0.28, r * 0.95, skia.Paint(AntiAlias=True, Color=col((0xc8, 0x5a, 0x1c), 255 * a)))
    pa = skia.Paint(AntiAlias=True, Color=col((0x5a, 0x24, 0x10), 235 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=r * 0.09)
    c.drawLine(-r, 0, r, 0, pa); c.drawLine(0, -r, 0, r, pa)
    c.drawArc(skia.Rect(-r * 1.55, -r * 0.95, -r * 0.15, r * 0.95), -60, 120, False, pa)
    c.drawArc(skia.Rect(r * 0.15, -r * 0.95, r * 1.55, r * 0.95), 120, 120, False, pa)
    c.restore(); c.restore()
    # warm rim light from the low sun (upper left), not rotating
    c.save(); c.clipPath(skia.Path().addCircle(x, y, r), doAntiAlias=True) if False else None
    c.drawArc(skia.Rect(x - r + 2, y - r + 2, x + r - 2, y + r - 2), 190, 80, False,
              skia.Paint(AntiAlias=True, Color=col((0xff, 0xd9, 0xa0), 200 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=r * 0.12))
    c.restore()


def flight(p0, p1, T):
    """Ball from p0 to p1 in time T under gravity: returns (v0, f(t)->pos)."""
    p0, p1 = np.array(p0, float), np.array(p1, float)
    vx = (p1[0] - p0[0]) / T
    vy = (p1[1] - p0[1] - 0.5 * G * T * T) / T
    return lambda t: p0 + np.array([vx * t, vy * t + 0.5 * G * t * t]), np.array([vx, vy])


def bounce_path(p0, v0, t_end, ground_y, e=0.75):
    """Positions of a bouncing ball from p0 with velocity v0, sampled at 120 Hz for t_end s; bounce times."""
    out, bounces = [], []
    p, v = np.array(p0, float), np.array(v0, float)
    dt = 1 / 120
    for i in range(int(t_end * 120) + 1):
        out.append(p.copy())
        v[1] += G * dt
        p = p + v * dt
        if p[1] > ground_y - BALL_R and v[1] > 0:
            p[1] = ground_y - BALL_R; v[1] = -v[1] * e; v[0] *= 0.92; bounces.append(i * dt)
    return np.array(out), bounces


def build(vid_out=None, stills=()):
    tl = K.Timeline(VID)
    k = tl.k
    T = {}
    T['clank'] = 0.42
    T['catch'] = 2.05
    T['due'] = k('myth', 'due')
    T['nope'] = k('bust', 'nope')
    T['fallacy'] = k('bust', 'fallacy')
    T['indep'] = k('bust', 'independent')
    T['memory'] = k('bust', 'memory')
    T['seventy'] = k('bust', 'seventy')
    T['still'] = k('bust', 'still')
    T['shoot0'] = T['still'] - 0.55
    T['release'] = T['shoot0'] + (REL - 3.70)
    T['law'] = k('lln', 'law')
    T['ff0'] = max(T['law'] - 0.2, T['release'] + 1.65)   # the real shot finishes first
    T['ten'] = k('lln', 'ten')
    T['jumps'] = k('lln', 'jumps')
    T['hundreds'] = k('lln', 'hundreds')
    T['settles'] = k('lln', 'settles')
    T['misses'] = k('why', 'misses')
    T['drowned'] = k('why', 'drowned')
    T['ff1'] = tl.span('why')[0] - 0.2
    T['still2'] = tl.span('ask')[0]
    T['five'] = k('ask', 'five')
    T['row'] = k('ask', 'row')
    T['fire'] = k('ask', 'fire')
    T['seventy2'] = k('ask', 'seventy')
    T['end'] = tl.end + 0.45
    DUR = tl.end + 1.6

    # ---------------- girl clock
    FF = 3.0
    CYC0, CYC1 = 3.60, 5.30

    def tau_of(t):
        if t < T['catch']:
            return 0.30 + 0.3 * t
        if t < T['shoot0']:
            return 3.60 + 0.10 * (1 - math.exp(-(t - T['catch']) * 0.4))
        if t < T['ff0']:
            return 3.70 + min(t - T['shoot0'], 2.1)
        if t < T['ff1']:
            u = (t - T['ff0']) * FF
            return CYC0 + (u % (CYC1 - CYC0))
        return 3.60 + 0.10 * (1 - math.exp(-(t - T['ff1']) * 0.5))

    def plan(t):
        if t < T['catch'] - 0.35:
            return [('a', SHOT, tau_of(t), 1.0)]
        if t < T['catch'] + 0.1:
            w = MP.xfade(t, T['catch'] - 0.35, T['catch'] + 0.1)
            return [('a', SHOT, 0.30 + 0.3 * (T['catch'] - 0.35), 1 - w), ('b', SHOT, 3.60, w)]
        if T['ff0'] <= t < T['ff1']:
            u = (t - T['ff0']) * FF
            n = int(u // (CYC1 - CYC0)); ph = u % (CYC1 - CYC0)
            out = [(f'c{n}', SHOT, CYC0 + ph, 1.0)]
            if ph < 0.18 and n > 0:                    # loop join: short crossfade from the end of the last cycle
                w = smooth(ph / 0.18)
                out = [(f'c{n-1}', SHOT, CYC1, 1 - w), (f'c{n}', SHOT, CYC0 + ph, w)]
            if t < T['ff0'] + 0.3:                     # first cycle: crossfade from the follow through of the real shot
                w = smooth((t - T['ff0']) / 0.3)
                out = [('b', SHOT, tau_of(T['ff0'] - 1e-3), 1 - w)] + [(k_, s_, ta_, wa_ * w) for k_, s_, ta_, wa_ in out]
            return out
        if t >= T['ff1'] and t < T['ff1'] + 0.3:
            w = MP.xfade(t, T['ff1'], T['ff1'] + 0.3)
            u = (T['ff1'] - T['ff0']) * FF
            return [('z', SHOT, CYC0 + (u % (CYC1 - CYC0)), 1 - w), ('h', SHOT, 3.60, w)]
        return [('h' if t >= T['ff1'] else 'b', SHOT, tau_of(t), 1.0)]

    def breath(t):
        return dict(spine=0.010 * math.sin(t * 2 * math.pi / 3.4))

    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    clk = {'t': 0.0}
    P = MP.ClampedPerformer(rig, spec, lambda tt: plan(clk['t']), ground_take=SHOT)
    P.extra = lambda tt: breath(clk['t'])
    SOLE = P.ground + model.ANKLE_H

    def hands(W):
        return (rig.tail(W, 'n_hand') + rig.tail(W, 'f_hand')) / 2

    def to_w(p):
        return np.array([X0 + CS * p[0], GROUND + CS * (p[1] - SOLE)])

    n60 = int(DUR * 60) + 2
    sim = []
    base_anchor = None
    for i in range(n60):
        t = i / 60; clk['t'] = t
        if base_anchor is not None:
            for e in plan(t):
                if e[0] not in P.anchor and e[0] != 'a':
                    P.anchor[e[0]] = (base_anchor[0].copy(), base_anchor[1].copy())
        W = P.pose(t)
        if base_anchor is None and 'b' in P.anchor and t >= T['catch'] + 0.1:
            base_anchor = P.anchor['b']
        sim.append(dict(W=W, hand=to_w(hands(W)) + np.array([0.10 * PXM, -0.02 * PXM]), x=P.x))

    # ---------------- ball schedule
    # opening: the 5th miss arrives at the front rim, then rebounds and bounces back to her hands
    front = RIM + np.array([-RIM_R - BALL_R * 0.6, -BALL_R * 0.3])
    i_catch = int(T['catch'] * 60)
    f_in, _ = flight(front + np.array([-1.3 * PXM, 0.35 * PXM]), front, 0.42)
    v_out = np.array([-3.4 * PXM, -2.2 * PXM])
    reb, reb_b = bounce_path(front, v_out, T['catch'] - T['clank'] + 0.3, GROUND + 0.05 * PXM)

    def ball_open(t):
        if t < T['clank']:
            return f_in(t), 12 * t
        j = int((t - T['clank']) * 120)
        p = reb[min(j, len(reb) - 1)]
        hand = sim[min(int(t * 60), len(sim) - 1)]['hand']
        w = smooth((t - (T['catch'] - 0.25)) / 0.25)
        return p * (1 - w) + hand * w, -8 * (t - T['clank'])

    # the shot after the misses (a make): from her hands at release to just through the rim
    i_rel = int(T['release'] * 60)
    p_rel = sim[i_rel]['hand']
    f_shot, v_shot = flight(p_rel, RIM + np.array([0, BALL_R * 0.2]), 1.05)

    def ball_shot(t):
        u = t - T['release']
        if u < 1.05:
            return f_shot(u), -6 * u
        # through the net and down
        p = RIM + np.array([0.0, BALL_R * 0.2]) + np.array([v_shot[0] * 0.15 * (u - 1.05), 0.5 * G * (u - 1.05) ** 2 + 2.5 * PXM * (u - 1.05)])
        return np.array([p[0], min(p[1], GROUND - BALL_R)]), -6 * u

    # ---------------- camera
    girl_cx = X0 + 0.35 * PXM
    ZG = 1.1
    girl_cy = GROUND - (1330 - 960) / ZG
    hoop_cx, hoop_cy, hoop_z = RIM[0] - 0.5 * PXM, 686.0, 1.4

    def cam(t, ballp=None):
        if t < T['clank'] + 0.25:
            return hoop_cx, hoop_cy, hoop_z
        if t < T['catch']:
            u = smooth((t - T['clank'] - 0.25) / (T['catch'] - T['clank'] - 0.45))
            return lerp(hoop_cx, girl_cx, u), lerp(hoop_cy, girl_cy, u), lerp(hoop_z, ZG, u)
        zg = K.window(t, T['ff0'] - 0.5, tl.span('ask')[0] - 0.2, 0.8, 0.8)
        zz = lerp(ZG, 0.92, zg)
        gcy = GROUND - (lerp(1330, 1390, zg) - 960) / zz
        bx_, by_, bz_ = lerp(girl_cx, X0 + 0.15 * PXM, zg), gcy, zz
        if T['release'] <= t < T['release'] + 1.6:
            u1 = smooth((t - T['release']) / 0.75); u2 = smooth((t - T['release'] - 1.0) / 0.55)
            w = u1 if u2 <= 0 else 1 - u2
            # the returning half lands on the moving base camera, so there is no jump where the follow ends
            return lerp(bx_ if u2 > 0 else girl_cx, hoop_cx, w), lerp(by_ if u2 > 0 else girl_cy, hoop_cy, w), lerp(bz_ if u2 > 0 else ZG, hoop_z, w)
        return bx_, by_, bz_

    plate = court()
    PL = K.skimg(plate)
    WW, WH = plate.shape[1], plate.shape[0]
    # life in the painting: tree crowns sway, the sun glow breathes, the net sways after a swish
    titles = [
        (0.0, T['nope'] - 0.1, [[('5 missed', WHITE)], [('FREE THROWS', CORAL)]]),
        (T['nope'] - 0.1, T['seventy'] - 0.2, [[("Next one's due?", WHITE)], [("GAMBLER'S FALLACY", CORAL)]]),
        (T['seventy'] - 0.2, T['law'] - 0.2, [[('Every shot:', WHITE)], [('STILL 70%', TEAL)]]),
        (T['law'] - 0.2, tl.span('why')[0] - 0.1, [[('Law of', WHITE)], [('LARGE NUMBERS', YELLOW)]]),
        (tl.span('why')[0] - 0.1, T['five'] - 0.1, [[('Misses never', WHITE)], [('GET PAID BACK', CORAL)]]),
        (T['five'] - 0.1, T['end'], [[('5 makes:', WHITE)], [('ON FIRE', CORAL), (' or ', WHITE), ('70%?', TEAL)]]),
    ]
    sounds = []

    def snd(name, t, gain):
        sounds.append((name, round(t, 3), gain))
    snd('rim_real', T['clank'], 0.6)
    for b in reb_b:
        if T['clank'] + b < T['catch']:
            snd('bounce_real', T['clank'] + b, 0.5)
    snd('pat', T['catch'], 0.4); snd('pop', T['due'], 0.35); snd('wrong', T['fallacy'], 0.4); snd('swish', T['memory'], 0.4)
    snd('ding', T['seventy'], 0.35); snd('whoosh_real', T['release'], 0.35); snd('swish', T['release'] + 1.05, 0.55)
    snd('bounce_real', T['release'] + 1.45, 0.35); snd('riser', T['law'] - 0.3, 0.35); snd('tick', T['ten'], 0.35)
    snd('swish', T['hundreds'], 0.4); snd('shimmer', T['settles'], 0.4); snd('pop', T['misses'], 0.4); snd('swish', T['drowned'], 0.4)
    for j in range(5):
        snd('pop', T['five'] + 0.22 * j, 0.3)
    snd('pat', T['fire'], 0.45); snd('pat', T['seventy2'], 0.45)

    blinks = (1.4, 4.0, 7.3, 10.6, 13.0, 17.4, 21.0, 25.6, 28.9, 31.7, 35.2)
    W_wr = K.Writer(vid_out, stills, OUT)
    frames = int(DUR * FPS)
    last_frame = None
    gaps = 0
    ff_shots = []
    for fi in range(frames):
        t = fi / FPS
        if os.environ.get('ONLY') and fi not in W_wr.stills:
            continue
        i = min(int(round(t * 60)), len(sim) - 1)
        s = sim[i]; W = s['W']
        rig.blink = 1.0 if any(b <= t < b + 0.12 for b in blinks) else 0.0
        cx, cy, z = cam(t)
        cx = min(max(cx, 540 / z), WW - 540 / z); cy = min(max(cy, 960 / z), WH - 960 / z)
        surf = skia.Surface(W_, H_); c = surf.getCanvas()
        c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
        c.drawImage(PL, 0, 0, K.SMP)
        # sun glow breathing low in the sky
        gl = 0.8 + 0.2 * math.sin(t * 1.1)
        sh = skia.GradientShader.MakeRadial(skia.Point(1400, 700), 900, [skia.Color(255, 220, 160, int(50 * gl)), skia.Color(255, 220, 160, 0)])
        c.drawCircle(1400, 700, 900, skia.Paint(Shader=sh, BlendMode=skia.BlendMode.kPlus))
        # net sway after the swish (a few code strands over the painted net)
        ns = math.exp(-max(0, t - T['release'] - 1.05) * 3) * (t > T['release'] + 1.05)
        if ns > 0.01:
            for kx in range(-3, 4):
                x0 = RIM[0] + kx * RIM_R / 3.4
                c.drawLine(x0, RIM[1] + 8, x0 + 10 * ns * math.sin(t * 18 + kx), RIM[1] + 0.42 * PXM,
                           skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(170 * ns)), StrokeWidth=4))
        # contact shadow, the girl, the ball
        a_ = z * CS
        xf = np.array([[a_, 0, z * (X0 - cx) + 540], [0, a_, z * (GROUND - CS * SOLE - cy) + 960], [0, 0, 1.0]])
        c.restore()
        hip_s = (xf @ np.array([*rig.joint(W, 'body'), 1.0]))[:2]
        gy = z * (GROUND - cy) + 960
        K.contact_shadow(c, hip_s[0] + 10 * z, gy, 110 * z * CS / 0.643, 12 * z, 0.30)
        # ball position (world) for this frame
        ball, spin, held = None, 0.0, False
        if t < T['catch']:
            ball, spin = ball_open(t)
        elif t < T['release']:
            ball, held = s['hand'], True
        elif t < T['ff0']:
            ball, spin = ball_shot(t)
            if t > T['release'] + 1.6:
                ball = None
        elif t < T['ff1']:
            u = (t - T['ff0']) * FF
            ph = u % (CYC1 - CYC0)
            rel_ph = REL - CYC0
            if ph < rel_ph:
                ball, held = s['hand'], True
            else:
                tr = ph - rel_ph                                   # seconds of real motion since this release
                n_c = int(u // (CYC1 - CYC0))
                t_rel = T['ff0'] + (n_c * (CYC1 - CYC0) + rel_ph) / FF
                hr = sim[min(int(round(t_rel * 60)), len(sim) - 1)]['hand']
                ball = hr + np.array([7.0 * PXM * tr, -6.6 * PXM * tr + 0.5 * G * tr * tr])
                spin = -6 * tr
        else:
            ball, held = s['hand'], True
        def ball_screen():
            return np.array([z * (ball[0] - cx) + 540, z * (ball[1] - cy) + 960])
        if ball is not None and not held:
            bs = ball_screen()
            K.contact_shadow(c, bs[0], gy, BALL_R * z * 0.9 * clamp(1 - (gy - bs[1]) / 900), 6 * z, 0.25 * clamp(1 - (gy - bs[1]) / 900))
            draw_ball(c, bs, BALL_R * z, spin)
        if ball is not None and held:
            bs = ball_screen()
            rig.between = lambda cv, bs=bs: draw_ball(cv, bs, BALL_R * z, 0.0)
        else:
            rig.between = None
        rig.draw(c, W, xf)
        if t >= T['end'] and last_frame is None:
            last_frame = surf.makeImageSnapshot()
        head_s = (xf @ np.array([*rig.tail(W, 'head'), 1.0]))[:2]
        # ---- tally of the 5 misses (top of the art zone), the 5th lands on the clank
        a_tally = 1 - smooth((t - T['memory']) / 0.5)
        for j in range(5):
            t_in = -1 if j < 4 else T['clank']
            a = smooth((t - t_in) / 0.12) * a_tally
            if a > 0.01:
                x, y = 210 + j * 165, lerp(1150, 640, smooth((t - 1.0) / 0.8)) - 60 * smooth((t - T['memory']) / 0.5) * (j % 2 * 2 - 1)
                pop = 1 + 0.35 * math.exp(-max(0, t - t_in) * 8) if j == 4 else 1.0
                K.card(c, x - 62, y - 62, 124, 124, a)
                K.x_stamp(c, x, y, 0.42 * pop, a)
        a_miss = window = K.window(t, -1, T['due'] - 0.1)
        K.label(c, '5 misses in a row', 540, lerp(1270, 760, smooth((t - 1.0) / 0.8)), CORAL, a_miss * smooth((t - T['clank']) / 0.2), 36)
        # ---- "next one's due?" bubble, crossed out by GAMBLER'S FALLACY
        a_due = K.window(t, T['due'] - 0.4, T['fallacy'] - 0.5, 0.25, 0.5)
        if a_due > 0.01:
            bx, by = head_s[0] + 270, head_s[1] + 40
            K.label(c, "next one's due?", bx, by, WHITE, a_due, 40)
            g_n = smooth((t - T['nope']) / 0.2)
            if g_n > 0.01:
                K.line(c, (bx - 175, by), (bx - 175 + 350 * g_n, by), YELLOW, 10, a_due)
                K.label(c, 'NOPE', bx + 140, by - 70, YELLOW, a_due * g_n, 40)
        a_f = K.window(t, T['fallacy'] - 0.05, T['indep'] - 0.1)
        if a_f > 0.01:
            if False: L.chip(c, "GAMBLER'S FALLACY", 745, 800, CORAL, 50, a_f, scale=0.85 + 0.15 * smooth((t - T['fallacy']) / 0.2))
        a_i = K.window(t, T['indep'] - 0.05, T['seventy'] - 0.2)
        K.label(c, 'each shot independent', 740, 800, TEAL, a_i, 38)
        a_mem = K.window(t, T['memory'] - 0.1, T['seventy'] - 0.2)
        K.label(c, 'no memory of the misses', 740, 880, WHITE, a_mem, 34)
        # ---- 70% chip over her, and a 70% ring travelling with the ball on the shot
        a_70 = K.window(t, T['seventy'] - 0.05, T['release'] - 0.15, 0.2, 0.15)
        if a_70 > 0.01:
            L.chip(c, '70% SHOOTER', head_s[0] + 40, head_s[1] - 120, TEAL, 52, a_70, scale=0.85 + 0.15 * smooth((t - T['seventy']) / 0.2))
        a_r = K.window(t, T['release'], T['release'] + 1.1)
        if a_r > 0.01 and ball is not None:
            bs = ball_screen()
            K.ring(c, bs, BALL_R * z * 1.9, TEAL, a_r, 6)
            K.label(c, 'still 70%', bs[0], bs[1] - BALL_R * z * 3.2, TEAL, a_r, 34)
        a_in = K.window(t, T['release'] + 1.1, T['release'] + 1.8)
        if a_in > 0.01:
            rs = np.array([z * (RIM[0] - cx) + 540, z * (RIM[1] - cy) + 960])
            K.check_stamp(c, rs[0] - 180, rs[1] + 40, 0.5, a_in)
        # ---- fast forward: the live graph of her running percentage
        ffa = K.window(t, T['ff0'], T['ff1'] + 0.1)
        K.status_pill(c, 'slow', 0.0)
        if ffa > 0.01:
            r = skia.RRect.MakeRectXY(skia.Rect(56, 1236, 380, 1296), 30, 30)
            c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(200 * ffa))))
            K.text(c, 'FAST FORWARD', 80, 1278, 30, YELLOW, ffa)
            for kk in range(2):
                p = skia.Path(); x0 = 322 + kk * 22
                p.moveTo(x0, 1250); p.lineTo(x0 + 20, 1266); p.lineTo(x0, 1282); p.close()
                c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * ffa)))
        ga = K.window(t, max(T['law'] - 0.1, T['release'] + 1.45), T['misses'] - 0.2)
        if ga > 0.01:
            gx0, gy0, gw, gh = 110, 560, 880, 250
            K.card(c, gx0 - 60, gy0 - 40, gw + 90, gh + 100, ga)
            # shots revealed so far: up to 10 by "ten", then racing to 300 by "settles"
            if t < T['ten']:
                nshow = 1 + int(5 * smooth((t - T['law']) / max(T['ten'] - T['law'], 0.1)))
            elif t < T['hundreds']:
                nshow = 6 + int(4 * smooth((t - T['ten']) / 0.8))
            else:
                nshow = 10 + int(290 * smooth((t - T['hundreds']) / max(T['settles'] - T['hundreds'] + 0.6, 0.5)))
            nshow = max(1, min(300, nshow))
            xmax = lerp(10, 300, smooth((t - T['hundreds'] + 0.1) / 0.9))
            def gp(n, v):
                return gx0 + gw * (n / xmax), gy0 + gh * (1 - v)
            # axes, 70% line
            pa = skia.Paint(AntiAlias=True, Color=col(WHITE, 120 * ga), StrokeWidth=3)
            c.drawLine(gx0, gy0 + gh, gx0 + gw, gy0 + gh, pa); c.drawLine(gx0, gy0, gx0, gy0 + gh, pa)
            K.dashed(c, gp(0, 0.7), gp(xmax, 0.7), TEAL, 4, ga * (0.6 + 0.4 * smooth((t - T['settles']) / 0.3)))
            K.text(c, '70%', gx0 + 12, gp(0, 0.7)[1] - 14, 30, TEAL, ga)
            K.text(c, 'her make %', gx0 + 10, gy0 - 2, 28, WHITE, ga * 0.85)
            K.text(c, f'shots: {nshow}', gx0 + gw - 170, gy0 + gh + 50, 30, WHITE, ga)
            for tick in (0, 0.5, 1.0):
                K.text(c, f'{int(tick * 100)}%', gx0 - 8 - (34 if tick < 1 else 46), gp(0, tick)[1] + 10, 22, WHITE, ga * 0.7)
            path = skia.Path()
            for n in range(1, nshow + 1):
                x, y = gp(n, RUN[n - 1])
                if x > gx0 + gw + 1:
                    break
                path.moveTo(x, y) if n == 1 else path.lineTo(x, y)
            c.drawPath(path, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * ga), StrokeWidth=6, Style=skia.Paint.kStroke_Style,
                                        StrokeJoin=skia.Paint.kRound_Join))
            xe, ye = gp(nshow, RUN[nshow - 1])
            c.drawCircle(xe, ye, 10, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * ga)))
            K.text(c, f'{RUN[nshow - 1] * 100:.0f}%', min(xe + 16, gx0 + gw - 70), ye - 16, 34, YELLOW, ga)
            K.label(c, 'jumps all over', gp(min(5, xmax), 0.25)[0] + 120, gy0 + gh - 60, CORAL,
                    K.window(t, T['jumps'] - 0.1, T['hundreds'] - 0.1) * ga, 32)
        # ---- all 300 shots: the first 5 misses are still there, just drowned out
        da = K.window(t, T['misses'] - 0.25, tl.span('ask')[0] - 0.1)
        if da > 0.01:
            gx0, gy0 = 140, 570
            K.card(c, gx0 - 60, gy0 - 50, 920, 330, da)
            for n in range(300):
                col_, row = n % 30, n // 30
                x, y = gx0 + col_ * 28, gy0 + row * 26
                cc = GREEN if SEQ[n] else CORAL
                rr = 8
                c.drawCircle(x, y, rr, skia.Paint(AntiAlias=True, Color=col(cc, 230 * da * (1 if n < 5 else smooth((t - T['misses'] - n * 0.004) / 0.2)))))
            pulse = 1 + 0.2 * math.sin(t * 6)
            K.ring(c, (gx0 + 2 * 28, gy0), 92 * pulse, WHITE, da * (1 - 0.5 * smooth((t - T['drowned']) / 0.6)), 8)
            K.label(c, 'the first 5 misses', gx0 + 330, gy0 - 85, CORAL, da, 30, anchor=(gx0 + 2 * 28 + 80, gy0 - 40))
        # ---- five makes in a row, then the chips
        for j in range(5):
            t_in = T['five'] + 0.22 * j
            a = smooth((t - t_in) / 0.12) * (1 - smooth((t - T['end']) / 0.2))
            if a > 0.01:
                x, y = 210 + j * 165, 640
                K.card(c, x - 62, y - 62, 124, 124, a)
                K.check_stamp(c, x, y, 0.4, a)
        for txt, t0, yy, colr in (('ON FIRE', T['fire'] - 0.05, 770, CORAL), ('STILL 70%', T['seventy2'] - 0.05, 850, TEAL)):
            a = smooth((t - t0) / 0.2) * (1 - smooth((t - T['end']) / 0.2))
            if a > 0:
                L.chip(c, txt, 820, yy, colr, 48, a, scale=0.85 + 0.15 * smooth((t - t0) / 0.18))
        K.layout_pass(c, t, tl, DUR, 'AP STATISTICS  ·  PROBABILITY', titles, T['end'],
                      [[('5 makes in a row:', WHITE)], [('on fire ', CORAL), ('or ', WHITE), ('still 70%?', TEAL)]], last_frame)
        if fi % 2 == 0:
            g = partrig.gap_check(rig, W, xf, (W_, H_), joints, radius, down=1.0)
            if max(g[j] for j in joints) > 0.02 or g['components'] > 1:
                gaps += 1
        W_wr.put(fi, surf)
    W_wr.close()
    json.dump(dict(T=T, DUR=DUR, sounds=sounds, final_pct=float(RUN[-1])), open(f'{OUT}/build.json', 'w'), indent=1)
    return dict(frames=frames, dur=DUR, gaps=gaps)


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=None)
    ap.add_argument('--stills', default='')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    st = [int(float(v) * FPS) for v in a.stills.split(',') if v]
    print(build(a.out, st))
