"""LevlPrep Short: why sprinters lean forward (AP Physics 1). Vertical 1080x1920, 30 fps.

Story: night street, burning building behind. The hoodie runner (traced from the approved painting, code drawn)
tries to launch standing straight up and tips over backward (what physics predicts) -> rewind -> he launches for
real, leaning (real motion capture, CMU 104_55) -> slow motion into a freeze on the push off -> forces built on the
frozen frame: foot pushes ground back, static friction pushes him forward, centre of mass, weight, a ghost tipping
backward (torque about the CoM), normal force, the total ground force lining up with the CoM, net torque about the
CoM = 0 -> unfreeze: real steady running (CMU 09_01 joined on a matched stride), lean and speed meters -> the brake
question with two chips -> end card.

MOTIONS (for the accuracy check):
1 Hook (keyed, labelled 'what physics predicts'): push off with the trunk upright; the whole body rotates backward about
  the centre of mass (feet swing forward, head goes back), arms thrown forward.
2 Launch: recorded human start (trunk leans about 35 degrees), slowed, freezing at push off with the stance foot behind
  the centre of mass.
3 Forces on the freeze: friction forward at the contact (static, ground on foot); the foot's push on the ground backward
  (drawn at the ground in another colour, then faded); normal force up; weight at the CoM, as long as the normal force
  (step averaged); resultant = friction + normal from the contact, f/N matching the drawn angle, its line passing
  through the CoM; ghost rotates backward about the CoM while only friction is shown.
4 Unfreeze: recorded running; the step averaged lean (contact to CoM line) falls toward vertical as speed rises.
"""
import sys, math, json, subprocess, os
import numpy as np, skia
from PIL import Image
sys.path.insert(0, '/home/claude/rig'); sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/runner')
sys.path.insert(0, '/home/claude/short')
import model, partrig, perf, phys, bg, timing
import mocap_perf as MP
import layout as L
from layout import smooth, col, TEAL, YELLOW, CORAL, WHITE, GREEN

FPS = 30
W_, H_ = 1080, 1920
CS = 0.52 * bg.PS                 # rig px -> world px (the approved scene's man to building ratio)
GROUND_W = 965 * bg.PS            # sole line in world px
X0 = 300 * bg.PS                  # start position (in front of the burning building)
GREY = (205, 208, 220)
OUT = '/home/claude/runner/out'


def lerp(a, b, u):
    return a + (b - a) * u


# ------------------------------------------------------------------ hook: keyed 'what physics predicts' fall
def hook_pose(t, T):
    """Push off with the trunk kept upright: friction at the feet turns the whole body backward about the centre of
    of mass; the straight legs rotate with it, so the feet slide forward along the ground while the hips drop, and he
    lands on his back (a 'what physics predicts' illustration, keyed)."""
    crouch = smooth((t - 0.12) / 0.3) * (1 - smooth((t - 0.45) / 0.12))
    u = smooth((t - 0.45) / (T['x'] - 0.45)) if t > 0.45 else 0.0
    th = -math.radians(82) * (u ** 1.7)                      # backward rotation (counterclockwise)
    land = smooth((t - T['x'] + 0.12) / 0.12)
    wob = math.sin(t * 14) * 0.2 * u
    L_leg = 8 + model.TH_L + model.SHIN_L
    g_ank = L_leg - 7.0                                       # ankle height (rig y) on the ground
    root_y = g_ank - L_leg * math.cos(th) + 16 * crouch * 1.0
    root_y = min(root_y, g_ank - 64)
    d = {}
    knee = 0.38 * crouch + 0.12 * u
    d['n_th'] = -0.5 * knee - 0.35 * land; d['n_sh'] = knee
    d['f_th'] = -0.4 * knee - 0.15 * land; d['f_sh'] = knee * 0.9
    d['n_ft'] = -th - 0.5 * knee * 0 + 0.25 * land; d['f_ft'] = -th + 0.15 * land
    d['n_ft'] = -th * (1 - land) + 0.0; d['f_ft'] = -th * (1 - land)
    d['n_up'] = lerp(lerp(0.12, 0.45, crouch), -2.1 + wob, u); d['n_lo'] = lerp(-0.35, -0.5, u)
    d['f_up'] = lerp(lerp(0.05, -0.35, crouch), -2.5 - wob, u); d['f_lo'] = lerp(-0.35, -0.4, u)
    d['n_hand'] = -0.1; d['f_hand'] = -0.1
    d['head'] = 0.35 * u
    root = (20 * u + 40 * u * u, root_y)
    return dict(delta=d, world={}, root=root, root_rot=th)


# ------------------------------------------------------------------ drawing helpers
def arrow(c, p0, p1, color, w=15, head=42, a=1.0, grow=1.0):
    p0, p1 = np.array(p0, float), np.array(p1, float)
    if a <= 0.01 or grow <= 0.01:
        return
    p1 = p0 + (p1 - p0) * grow
    d = p1 - p0; Ln = np.linalg.norm(d)
    if Ln < 2:
        return
    u = d / Ln; n = np.array([-u[1], u[0]])
    hd = min(head, Ln * 0.6)
    base = p1 - u * hd
    path = skia.Path()
    path.moveTo(*p1); path.lineTo(*(base + n * hd * 0.62)); path.lineTo(*(base - n * hd * 0.62)); path.close()
    for widen, colr, al in ((7, (8, 10, 24), 0.55), (0, color, 1.0)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=w + widen, StrokeCap=skia.Paint.kRound_Cap,
                        Style=skia.Paint.kStroke_Style)
        c.drawLine(*p0, *(base + u * 4), pa)
        pf = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al))
        if widen:
            pf.setStyle(skia.Paint.kStrokeAndFill_Style); pf.setStrokeWidth(widen); pf.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawPath(path, pf)


def dashed(c, p0, p1, color, w=5, a=1.0, on=18, off=12, phase=0.0):
    if a <= 0.01:
        return
    pa = skia.Paint(AntiAlias=True, Color=col(color, 255 * a), StrokeWidth=w, Style=skia.Paint.kStroke_Style,
                    StrokeCap=skia.Paint.kRound_Cap, PathEffect=skia.DashPathEffect.Make([on, off], phase))
    c.drawLine(*p0, *p1, pa)


def label(c, text, x, y, color, a, size=34):
    if a <= 0.01:
        return
    L.chip(c, text, x, y, color, size, a, scale=0.9 + 0.1 * a)


def torque_arc(c, ctr, R, color, a=1.0, grow=1.0):
    if a <= 0.01 or grow <= 0.01:
        return
    start, sweep = -12.0, -150.0 * grow
    oval = skia.Rect(ctr[0] - R, ctr[1] - R, ctr[0] + R, ctr[1] + R)
    for widen, colr, al in ((7, (8, 10, 24), 0.55), (0, color, 1.0)):
        p = skia.Path(); p.arcTo(oval, start, sweep, True)
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=13 + widen,
                                 Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap))
    phi = math.radians(start + sweep)
    tip = np.array([ctr[0] + R * math.cos(phi), ctr[1] + R * math.sin(phi)])
    tang = np.array([math.sin(phi), -math.cos(phi)])
    arrow(c, tip - tang * 8, tip + tang * 34, color, w=1, head=40, a=a)


def card(c, x, y, w, h, a):
    r = skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), 26, 26)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(210 * a))))
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(28 * a)), Style=skia.Paint.kStroke_Style, StrokeWidth=2))


def text(c, s, x, y, size, color, a=1.0, center=False, font=None):
    f = skia.Font(font or L.BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias)
    if center:
        x -= f.measureText(s) / 2
    c.drawString(s, x, y, f, skia.Paint(AntiAlias=True, Color=col(color, 255 * a)))


def rewind_fx(c, t, a):
    if a <= 0.01:
        return
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=skia.Color(20, 30, 70, int(70 * a))))
    rng = np.random.default_rng(int(t * 60))
    for y in range(0, H_, 6):
        c.drawRect(skia.Rect(0, y, W_, y + 2), skia.Paint(Color=skia.Color(255, 255, 255, int(14 * a))))
    for _ in range(3):
        y = rng.uniform(300, 1700)
        c.drawRect(skia.Rect(0, y, W_, y + rng.uniform(4, 16)), skia.Paint(Color=skia.Color(255, 255, 255, int(55 * a))))
    # rewind icon
    p = skia.Path(); x0, y0 = 70, 590
    for k in range(2):
        p.moveTo(x0 + 46 + k * 46, y0); p.lineTo(x0 + k * 46, y0 + 30); p.lineTo(x0 + 46 + k * 46, y0 + 60); p.close()
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(235 * a))))
    text(c, 'REWIND', 70, 690, 40, WHITE, a)


def x_stamp(c, x, y, s, a):
    if a <= 0.01:
        return
    for widen, colr in ((12, (20, 6, 10)), (0, CORAL)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=34 + widen, StrokeCap=skia.Paint.kRound_Cap,
                        Style=skia.Paint.kStroke_Style)
        c.drawLine(x - 90 * s, y - 90 * s, x + 90 * s, y + 90 * s, pa)
        c.drawLine(x - 90 * s, y + 90 * s, x + 90 * s, y - 90 * s, pa)


# ------------------------------------------------------------------ build
def build(tl, out=None, stills=(), music=True, sim_only=False):
    k = tl.k
    T = {}
    T['x'] = 1.85                                                       # he lands on his back, red X
    T['rw0'] = max(T['x'] + 0.9, tl.beat_span('hook')[1] + 0.05)       # rewind
    T['rw1'] = T['rw0'] + 0.5
    T['m0'] = T['rw1']
    T['launch'] = T['m0'] + 0.4                                         # real time burst
    T['cut'] = T['launch'] + 1.2                                        # cut to the slow motion replay
    T['freeze'] = max(tl.beat_span('why')[1] + 0.2, T['cut'] + 1.3)
    T['below'] = k('torque', 'below')
    T['foot'] = k('push', 'shoves', 1)
    T['fric'] = k('push', 'ground', 2)
    T['feet'] = k('torque', 'feet')
    T['com'] = k('torque', 'center')
    T['mg'] = T['com'] + 0.45
    T['tip'] = k('torque', 'tip')
    T['lean'] = k('fix', 'lean')
    T['normal'] = k('fix', 'grounds')
    T['total'] = k('fix', 'total')
    T['lines'] = k('fix', 'lines')
    T['ctr'] = k('fix', 'center')
    T['notip'] = k('fix', 'no')
    T['unf'] = k('rule', 'harder') - 0.25
    T['top'] = k('rule', 'top')
    T['ask'] = k('ask', 'slam')
    T['fwd'] = k('ask', 'forward'); T['back'] = k('ask', 'back')
    T['end'] = tl.end + 0.4
    DUR = T['end'] + 1.8
    MF = 1.95 - perf.TAU0                                               # freeze on the push off (single support)
    M_R0 = 0.40                                                         # replay starts here

    # ---------------- mocap clocks: M1 = the real time burst, M2 = the replay (slow motion, freeze, run on)
    def M1(t):
        if t < T['launch']:
            return 0.20 * max(0.0, t - T['m0']) / (T['launch'] - T['m0'])
        return 0.20 + (t - T['launch'])

    def M2(t):
        if t < T['freeze']:
            v = (t - T['cut']) / (T['freeze'] - T['cut'])
            return M_R0 + (MF - M_R0) * (1 - (1 - v) ** 2.2)
        if t < T['unf']:
            return MF
        # speed 0 -> 0.5x over 0.45 s, then 0.5x, slowing to 0.15x for the question
        def speed(tt):
            if tt < T['unf']:
                return 0.0
            a = 0.5 * smooth((tt - T['unf']) / 0.45)
            return lerp(a, 0.15, smooth((tt - T['ask']) / 1.2))
        n = int((t - T['unf']) * 120)
        return MF + sum(speed(T['unf'] + (j + 0.5) / 120) for j in range(n)) / 120

    # ---------------- pass 1: simulate every 1/60 s
    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    clk = {'M': 0.0}
    def performer():
        p = MP.MocapPerformer(rig, spec, lambda t: perf.plan_m(clk['M']), ground_take=perf.START)
        p.extra = lambda t: perf.extra_m(clk['M'])
        return p
    P1, P2 = performer(), performer()
    SOLE = P1.ground + model.ANKLE_H
    m2_cache = {}
    sim = []
    n60 = int(DUR * 60) + 2
    for i in range(n60):
        t = i / 60
        if t < T['m0']:
            th = min(t, T['x'])
            if T['rw0'] <= t < T['rw1']:
                th = T['x'] * (1 - (t - T['rw0']) / (T['rw1'] - T['rw0']))
            pose = hook_pose(th, T)
            W = rig.fk(pose)
            sim.append(dict(mode='rew' if t >= T['rw0'] else 'hook', W=W, x=pose['root'][0], th=th, seg=0))
            continue
        if t < T['cut']:
            P, M, seg = P1, M1(t), 1
        else:
            if not m2_cache:                                  # bring the replay performer up to its start, unseen
                for j in range(int(M_R0 * 120)):
                    clk['M'] = j / 120; P2.pose(j / 120)
                m2_cache['ok'] = True
            P, M, seg = P2, M2(t), 2
        clk['M'] = M
        W = P.pose(t)
        com = phys.com(rig, W)
        cont = None
        for sd, side in (('n', 'near'), ('f', 'far')):
            if P.lock_w[side] > 0.5:
                an = rig.joint(W, sd + '_ft'); wa = rig.world_angle(W, sd + '_ft')
                ball = an + np.array([math.cos(wa) * 0.72 * model.FOOT_LEN - math.sin(wa) * model.ANKLE_H,
                                      math.sin(wa) * 0.72 * model.FOOT_LEN + math.cos(wa) * model.ANKLE_H])
                cont = np.array([ball[0], P.ground + model.ANKLE_H])
        sim.append(dict(mode='mocap', W=W, x=P.x, M=M, com=com, cont=cont, locks=dict(P.lock_w), seg=seg))
    HOOK_SOLE = 8 + model.TH_L + model.SHIN_L + model.ANKLE_H - 7.0       # keyed legs straight, root y -7
    for s_ in sim:
        s_['sole'] = SOLE
    # meters: speed, speed up (acceleration) and the lean physics asks for, tan(lean) = a / g, from the motion itself
    from scipy.ndimage import gaussian_filter1d
    clk['M'] = 0.0
    P3 = performer(); xs3 = []
    for j in range(int(6.0 * 120)):
        clk['M'] = j / 120; P3.pose(j / 120); xs3.append(P3.x)
    pxm = (model.TH_L + model.SHIN_L) / 0.87                             # rig px per metre (leg 0.87 m)
    v3 = gaussian_filter1d(np.gradient(np.array(xs3), 1 / 120), 0.18 * 120)
    a3 = gaussian_filter1d(np.gradient(v3, 1 / 120), 0.12 * 120)
    lean3 = np.degrees(np.arctan2(np.maximum(a3, 0) / pxm, 9.81))
    pk = int(np.argmax(lean3))
    lean3[pk:] = np.minimum.accumulate(lean3[pk:])                       # past the peak it only falls (step averaged)
    acc3 = np.maximum(a3, 0); acc3[pk:] = np.minimum.accumulate(acc3[pk:])
    v3 = np.maximum.accumulate(v3)
    def meter(M):
        j = min(int(M * 120), len(v3) - 1)
        return v3[j] / pxm, acc3[j] / acc3.max(), lean3[j]

    # freeze geometry (rig coords)
    i_f = int(T['freeze'] * 60) + 3
    FZ = sim[i_f]
    assert FZ['seg'] == 2
    assert FZ['cont'] is not None, 'freeze frame has no planted foot'
    phi = math.atan2(FZ['com'][0] - FZ['cont'][0], FZ['cont'][1] - FZ['com'][1])
    print('freeze M', round(FZ['M'], 3), 'contact->CoM angle', round(math.degrees(phi), 1))

    # ---------------- camera (world px)
    def to_world(s, p):
        sole = HOOK_SOLE if s['mode'] != 'mocap' else s['sole']
        return np.array([X0 + CS * p[0], GROUND_W + CS * (p[1] - sole)])

    cams = []
    cam = None
    for i, s in enumerate(sim):
        t = i / 60
        hip = to_world(s, s['W']['body'][2])
        zf = smooth((t - (T['freeze'] - 0.9)) / 1.3) * (1 - smooth((t - T['unf']) / 1.0))
        z = 1.0 + 0.30 * zf
        if s['mode'] == 'mocap':
            fz_mid = (to_world(FZ, FZ['com']) + to_world(FZ, FZ['cont'])) / 2
        follow_x = hip[0] + 140 + 120 * smooth((t - T['unf']) / 0.9) + (120 if s['seg'] == 1 else 0)
        want_x = lerp(follow_x, fz_mid[0] if s['mode'] == 'mocap' else follow_x, zf)
        if cam is None:
            cam = np.array([want_x, 0.0])
        rate = 0.06 if s['mode'] == 'mocap' else 0.0
        if s['mode'] != 'mocap':
            cam[0] = X0 + CS * 0 + 140 + 60
        if i and s['seg'] != sim[i - 1]['seg'] and s['seg'] == 2:
            cam[0] = X0 + 200                                       # cut to the replay
        cam[0] += (want_x - cam[0]) * (0.12 if s['seg'] == 1 else rate)
        # vertical: ground at screen 1340 when z=1; when zoomed, the freeze mid point sits at screen 980
        cy_base = GROUND_W - (1340 - 960) / z
        cy_zoom = (fz_mid[1] if s['mode'] == 'mocap' else cy_base) - (980 - 960) / z
        cy = lerp(cy_base, cy_zoom, zf)
        cx = min(max(cam[0], 540 / z), sim_world_w - 540 / z) if False else cam[0]
        cams.append((cx, cy, z))

    street = bg.Street()
    cams = [(min(max(cx, 540 / z + 2), street.near_w - 540 / z - 2), cy, z) for cx, cy, z in cams]
    # parallax: once he runs on, the far layer (building, sky, lamps) slides at 0.3 of the camera speed
    shifts = [0.0]
    for i in range(1, len(cams)):
        p = 1 - 0.7 * smooth((i / 60 - T['unf']) / 1.0)
        shifts.append(shifts[-1] + (1 - p) * (cams[i][0] - cams[i - 1][0]))

    def xf_of(i, s):
        cx, cy, z = cams[i]
        sole = HOOK_SOLE if s['mode'] != 'mocap' else s['sole']
        # rig -> world -> screen
        a = z * CS
        return np.array([[a, 0, z * (X0 - cx) + 540], [0, a, z * (GROUND_W - CS * sole - cy) + 960], [0, 0, 1.0]])

    if sim_only:
        return dict(T=T, DUR=DUR, cams=cams, hipx=[to_world(s, s['W']['body'][2])[0] for s in sim], world_w=street.W, shifts=shifts,
                    M=[s.get('M', 0) for s in sim], seg=[s['seg'] for s in sim], phi=math.degrees(phi))

    def world_to_screen(i, p):
        cx, cy, z = cams[i]
        return np.array([z * (p[0] - cx) + 540, z * (p[1] - cy) + 960])

    # ---------------- pass 2: render at 30 fps
    proc = None
    if out:
        proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W_}x{H_}',
                                 '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16',
                                 '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    frames = int(DUR * FPS)
    chunks = tl.chunks(3)
    titles = [
        (0.0, T['rw0'], [[('Sprint off', WHITE)], [('STANDING UP?', CORAL)]]),
        (k('why', 'sprinters') - 0.1, T['foot'] - 0.15, [[('Why sprinters', WHITE)], [('LEAN', YELLOW)]]),
        (T['foot'] - 0.15, T['com'] - 0.2, [[('Ground pushes you', WHITE)], [('FORWARD', TEAL)]]),
        (T['com'] - 0.2, T['lean'] - 0.1, [[('Push is ', WHITE), ('BELOW', CORAL)], [('center of mass', WHITE)]]),
        (T['lean'] - 0.1, T['unf'] + 0.1, [[('Push lines up with', WHITE)], [('CENTER OF MASS', YELLOW)]]),
        (T['unf'] + 0.1, T['top'] - 0.12, [[('Harder push', WHITE)], [('= ', WHITE), ('MORE LEAN', YELLOW)]]),
        (T['top'] - 0.12, T['ask'] - 0.15, [[('Top speed:', WHITE)], [('RUN TALL', TEAL)]]),
        (T['ask'] - 0.15, T['end'], [[('Hit the brakes:', WHITE)], [('FORWARD', TEAL), (' or ', WHITE), ('BACK?', CORAL)]]),
    ]
    blinks = (1.0, 5.2, 9.6, 14.8, 21.5, 27.0)
    sounds = []
    def snd(name, t, gain):
        sounds.append((name, round(t, 3), gain))
    snd('whoosh_real', 0.25, 0.7); snd('wrong', T['x'], 0.45); snd('swish', T['rw0'], 0.5)
    snd('whoosh_real', T['launch'] + 0.05, 0.7); snd('swish', T['cut'], 0.5); snd('pat', T['x'], 0.6)
    snd('swish', T['foot'], 0.35); snd('swish', T['fric'], 0.45); snd('pat', T['com'], 0.5); snd('pat', T['feet'], 0.35); snd('swish', T['mg'], 0.3)
    snd('swish', T['tip'], 0.45); snd('swish', T['normal'], 0.4); snd('shimmer', T['total'], 0.45); snd('check', T['notip'], 0.5)
    snd('swish', T['unf'], 0.35); snd('pat', T['fwd'], 0.5); snd('pat', T['back'], 0.5)
    last_frame = None
    gaps = 0
    prev_lock = {'near': 0, 'far': 0}
    for fi in range(frames):
        t = fi / FPS
        i = min(int(round(t * 60)), len(sim) - 1)
        s = sim[i]
        W = s['W']
        xf = xf_of(i, s)
        cx, cy, z = cams[i]
        frozen = T['freeze'] - 0.05 <= t < T['unf']
        rig.blink = 1.0 if (any(b <= t < b + 0.12 for b in blinks) and not frozen) else 0.0
        if s['mode'] == 'mocap':
            for side in ('near', 'far'):
                if s['locks'][side] > 0.5 and prev_lock[side] <= 0.5 and t > T['launch']:
                    snd('pat', t, 0.22)
                prev_lock[side] = s['locks'][side]
        surf = skia.Surface(W_, H_); cv = surf.getCanvas()
        # ---- world
        cv.save()
        cv.translate(540, 960); cv.scale(z, z); cv.translate(-cx, -cy)
        street.draw(cv, t, shifts[i])
        cv.restore()
        # contact shadow under the runner
        hip_s = xf @ np.array([*W['body'][2], 1.0])
        gy = xf[1, 2] + xf[1, 1] * (HOOK_SOLE if s['mode'] != 'mocap' else s['sole'])
        air = 0.0
        if s['mode'] != 'mocap':
            air = smooth((s['th'] - 0.6) / 1.5)
        cv.drawOval(skia.Rect(hip_s[0] - 140 * z, gy - 14 * z, hip_s[0] + 140 * z, gy + 14 * z),
                    skia.Paint(AntiAlias=True, Color=skia.Color(10, 6, 20, int(95 * (1 - 0.6 * air))),
                               MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10 * z)))
        # ghost (rotating backward about the CoM) drawn behind the runner
        com_s = cont_s = None
        if s['mode'] == 'mocap':
            com_s = xf @ np.array([*s['com'], 1.0])
            if FZ is not None:
                com_s = xf @ np.array([*FZ['com'], 1.0]) if T['freeze'] <= t < T['unf'] + 0.6 else com_s
                cont_s = xf @ np.array([*FZ['cont'], 1.0])
        g_a = smooth((t - T['tip'] + 0.1) / 0.25) * (1 - smooth((t - T['lean']) / 0.4))
        if g_a > 0.01 and com_s is not None:
            ang = -32.0 * smooth((t - T['tip']) / 1.1)
            S = rig.shapes(W, xf[:2])
            cv.save(); cv.translate(*com_s[:2]); cv.rotate(ang); cv.translate(-com_s[0], -com_s[1])
            rig.silhouette_fill(cv, S, skia.Color(220, 235, 255), alpha=0.30 * g_a)
            rig.silhouette_edge(cv, S, skia.Color(235, 245, 255), width=3.0, alpha=0.75 * g_a)
            cv.restore()
        # the runner
        rig.draw(cv, W, xf)
        if t >= T['end'] and last_frame is None:
            last_frame = surf.makeImageSnapshot()
        # ---- forces on the freeze
        if com_s is not None and cont_s is not None and T['freeze'] - 0.2 <= t < T['unf'] + 0.8:
            fa = 1 - smooth((t - T['unf']) / 0.45)
            Nlen = 330 * z / 1.3
            flen = Nlen * math.tan(phi)
            c0 = cont_s[:2]
            # ground reference line
            # foot pushes ground (backward, at the ground, coral), then fades
            a_fp = smooth((t - T['foot']) / 0.2) * (1 - smooth((t - T['fric'] - 0.7) / 0.4)) * fa
            arrow(cv, c0 + np.array([0, 22]), c0 + np.array([-flen * 0.95, 22]), CORAL, a=a_fp, grow=smooth((t - T['foot']) / 0.3))
            label(cv, 'foot pushes ground', c0[0] - 205, c0[1] + 95, CORAL, a_fp, 32)
            # static friction: ground on foot, forward
            a_fr = smooth((t - T['fric']) / 0.2) * fa
            arrow(cv, c0, c0 + np.array([flen, 0]), TEAL, a=a_fr, grow=smooth((t - T['fric']) / 0.3))
            label(cv, 'static friction', c0[0] + max(flen, 60) + 120, c0[1] + 4, TEAL, a_fr * (1 - smooth((t - T['total'] - 0.6) / 0.4)), 32)
            # 'down at your feet': the contact point rings
            a_ft = smooth((t - T['feet'] + 0.1) / 0.2) * (1 - smooth((t - T['com'] - 0.3) / 0.3)) * fa
            if a_ft > 0.01:
                for kk in range(2):
                    ph = ((t - T['feet']) * 1.4 + kk * 0.5) % 1.0
                    cv.drawCircle(*c0, 22 + 90 * ph, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a_ft * (1 - ph)),
                                                             Style=skia.Paint.kStroke_Style, StrokeWidth=9))
                cv.drawCircle(*c0, 13, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a_ft)))
            # centre of mass and weight
            a_c = smooth((t - T['com']) / 0.2) * fa
            if a_c > 0.01:
                pulse = 1 + 0.25 * math.exp(-max(0, t - T['com']) * 4) + 0.35 * math.exp(-max(0, t - T['ctr']) * 4) * (t > T['ctr'])
                cv.drawCircle(*com_s[:2], 21 * pulse, skia.Paint(AntiAlias=True, Color=col((8, 10, 24), 200 * a_c)))
                cv.drawCircle(*com_s[:2], 15 * pulse, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a_c)))
                cv.drawCircle(*com_s[:2], 5 * pulse, skia.Paint(AntiAlias=True, Color=col((8, 10, 24), 255 * a_c)))
                label(cv, 'center of mass', com_s[0] + 270, com_s[1] + 70, YELLOW, a_c * (1 - smooth((t - T['notip']) / 0.25)), 32)
            # lever arm: the friction line sits below the centre of mass
            a_la = smooth((t - T['below']) / 0.25) * (1 - smooth((t - T['tip'] - 0.2) / 0.3)) * fa
            if a_la > 0.01:
                xb = c0[0] - 55
                dashed(cv, (xb - 10, com_s[1]), (com_s[0] - 22, com_s[1]), YELLOW, w=5, a=a_la)
                pa = skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a_la), StrokeWidth=6, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap)
                cv.drawLine(xb, com_s[1], xb, c0[1], pa)
                cv.drawLine(xb - 16, com_s[1], xb + 16, com_s[1], pa); cv.drawLine(xb - 16, c0[1], xb + 16, c0[1], pa)
                label(cv, 'below the CoM', xb - 110, (com_s[1] + c0[1]) / 2, YELLOW, a_la, 32)
            a_mg = smooth((t - T['mg']) / 0.2) * fa
            arrow(cv, com_s[:2], com_s[:2] + np.array([0, Nlen]), GREY, w=11, head=34, a=a_mg * 0.95, grow=smooth((t - T['mg']) / 0.3))
            if a_mg > 0.01:
                label(cv, 'mg', com_s[0] + 62, com_s[1] + Nlen * 0.78, GREY, a_mg, 34)
            # torque about the CoM from friction alone
            a_tq = smooth((t - T['tip']) / 0.2) * (1 - smooth((t - T['lean']) / 0.35))
            torque_arc(cv, com_s[:2], 150 * z / 1.3, CORAL, a=a_tq, grow=smooth((t - T['tip']) / 0.5))
            if a_tq > 0.01:
                label(cv, 'tips backward', com_s[0] - 40, com_s[1] - 230 * z / 1.3, CORAL, a_tq, 34)
            # normal force
            a_n = smooth((t - T['normal']) / 0.2) * fa
            arrow(cv, c0, c0 + np.array([0, -Nlen]), GREEN, a=a_n, grow=smooth((t - T['normal']) / 0.3))
            if a_n > 0.01:
                label(cv, 'normal force', c0[0] - 175, c0[1] - Nlen * 0.55, GREEN, a_n * (1 - smooth((t - T['notip'] - 0.8) / 0.3)), 32)
            # total ground force: friction + normal, on the line from the contact through the CoM
            a_t = smooth((t - T['total']) / 0.2) * fa
            if a_t > 0.01:
                dashed(cv, c0 + np.array([flen, 0]), c0 + np.array([flen, -Nlen]), TEAL, w=4, a=0.7 * a_t)
                dashed(cv, c0 + np.array([0, -Nlen]), c0 + np.array([flen, -Nlen]), GREEN, w=4, a=0.7 * a_t)
            arrow(cv, c0, c0 + np.array([flen, -Nlen]), YELLOW, w=17, head=46, a=a_t, grow=smooth((t - T['total']) / 0.35))
            a_l = smooth((t - T['lines']) / 0.3) * fa
            if a_l > 0.01:
                d = np.array([flen, -Nlen]); d /= np.linalg.norm(d)
                end = c0 + d * (np.linalg.norm(com_s[:2] - c0) + 90 * z / 1.3)
                dashed(cv, c0 + d * (np.hypot(flen, Nlen) + 10), end, YELLOW, w=6, a=a_l, phase=-t * 60)
            a_nt = smooth((t - T['notip']) / 0.2) * fa
            if a_nt > 0.01:
                L.chip(cv, 'net torque about CoM = 0', 600, 590, YELLOW, 38, a_nt, scale=0.85 + 0.15 * smooth((t - T['notip']) / 0.2))
        # ---- time is paused while the forces are built
        rz = smooth((t - T['cut']) / 0.15) * (1 - smooth((t - T['freeze'] + 0.1) / 0.15))
        if rz > 0.01:
            r = skia.RRect.MakeRectXY(skia.Rect(56, 556, 320, 616), 30, 30)
            cv.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(200 * rz))))
            text(cv, 'SLOW MOTION', 82, 598, 30, YELLOW, rz)
        pz = smooth((t - T['freeze'] + 0.1) / 0.3) * (1 - smooth((t - T['unf']) / 0.3))
        if pz > 0.01:
            r = skia.RRect.MakeRectXY(skia.Rect(56, 556, 250, 616), 30, 30)
            cv.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(200 * pz))))
            for bx in (84, 100):
                cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx, 572, bx + 10, 600), 3, 3), skia.Paint(AntiAlias=True, Color=col(WHITE, 240 * pz)))
            text(cv, 'PAUSED', 124, 598, 30, WHITE, pz)
        # ---- what physics predicts / red X
        if s['mode'] == 'hook':
            label(cv, 'what physics predicts', 540, 565, GREY, smooth((t - 0.15) / 0.25), 34)
            x_a = smooth((t - T['x']) / 0.12)
            x_stamp(cv, hip_s[0] + 20, hip_s[1] - 160, 1.0 + 0.3 * math.exp(-max(0, t - T['x']) * 9), x_a)
        # ---- meters (speed and lean) while he runs again
        hud_a = smooth((t - T['unf'] - 0.2) / 0.3) * (1 - smooth((t - T['ask'] + 0.1) / 0.3))
        if hud_a > 0.01 and s['mode'] == 'mocap':
            spd_ms, acc_k, lean = meter(s['M'])
            x0, y0 = 676, 556
            card(cv, x0, y0, 360, 300, hud_a)
            def bar(y, label_, val, colr):
                text(cv, label_, x0 + 26, y, 30, WHITE, hud_a)
                cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 + 26, y + 14, x0 + 334, y + 36), 11, 11), skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(40 * hud_a))))
                cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 + 26, y + 14, x0 + 26 + 308 * min(max(val, 0.0), 1.0), y + 36), 11, 11), skia.Paint(AntiAlias=True, Color=col(colr, 255 * hud_a)))
            bar(y0 + 48, 'SPEED', spd_ms / 4.0, TEAL)
            bar(y0 + 124, 'SPEEDING UP', acc_k, CORAL)
            text(cv, 'LEAN', x0 + 26, y0 + 224, 30, WHITE, hud_a)
            text(cv, f'{lean:.0f}°', x0 + 26, y0 + 280, 54, YELLOW, hud_a)
            ox, oy = x0 + 270, y0 + 282
            cv.drawLine(ox, oy, ox, oy - 92, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(90 * hud_a)), StrokeWidth=3))
            r = math.radians(lean)
            cv.drawLine(ox, oy, ox + 92 * math.sin(r), oy - 92 * math.cos(r), skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * hud_a), StrokeWidth=7, StrokeCap=skia.Paint.kRound_Cap))
            cv.drawCircle(ox, oy, 7, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * hud_a)))
        # ---- answer chips
        for txt, t0, yy, colr, tilt in (('LEAN FORWARD?', T['fwd'] - 0.05, 650, TEAL, 1), ('LEAN BACK?', T['back'] - 0.05, 800, CORAL, -1)):
            a = smooth((t - t0) / 0.2) * (1 - smooth((t - T['end']) / 0.2))
            if a > 0:
                sc_ = 0.85 + 0.15 * smooth((t - t0) / 0.18)
                L.chip(cv, txt, 700, yy, colr, 52, a, scale=sc_)
                # a little leaning stick figure line next to the chip
                f_ = skia.Font(L.BLACK, 52); ix, iy = 700 + f_.measureText(txt) / 2 + 26 + 46, yy + 26
                r = math.radians(22 * tilt)
                cv.drawLine(ix, iy, ix + 70 * math.sin(r), iy - 70 * math.cos(r), skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=9, StrokeCap=skia.Paint.kRound_Cap))
                cv.drawCircle(ix + 82 * math.sin(r), iy - 82 * math.cos(r), 12, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a)))
        # ---- rewind look
        rw_a = smooth((t - T['rw0']) / 0.08) * (1 - smooth((t - T['rw1']) / 0.1))
        rewind_fx(cv, t, rw_a)
        # ---- house layout
        L.fades(cv)
        L.progress(cv, t / DUR)
        L.badge(cv, 'AP PHYSICS 1  ·  FORCES & TORQUE')
        for t_in, t_out, lines in titles:
            L.title(cv, lines, t, t_in, t_out)
        L.watermark(cv)
        cur_chunk, cur_word = None, -1
        for ch in chunks:
            if tl.words[ch[0]][1] - 0.05 <= t <= tl.words[ch[-1]][2] + 0.25:
                cur_chunk = ch
        if cur_chunk and t < T['end']:
            ws = [tl.words[j][0] for j in cur_chunk]
            for n, j in enumerate(cur_chunk):
                if tl.words[j][1] - 0.02 <= t:
                    cur_word = n
            L.caption(cv, ws, cur_word)
        if t >= T['end']:
            L.end_card(cv, last_frame, t - T['end'], [[('Brakes: lean ', WHITE), ('forward', TEAL)], [('or ', WHITE), ('back?', CORAL)]])
        g = partrig.gap_check(rig, W, np.array([[0.5, 0, 540 - 0.5 * s['x']], [0, 0.5, 700], [0, 0, 1.0]]), (W_, H_), joints, radius)
        if max(g[j] for j in joints) > 0.02 or g['components'] > 1:
            gaps += 1
        frame = surf.makeImageSnapshot().toarray()
        if fi in stills:
            Image.fromarray(frame[..., [2, 1, 0]]).save(f'{OUT}/st_{fi:04d}.png')
        if proc:
            proc.stdin.write(frame.tobytes())
    if proc:
        proc.stdin.close(); proc.wait()
    json.dump(dict(T=T, DUR=DUR, sounds=sounds, phi=math.degrees(phi)), open(f'{OUT}/build.json', 'w'), indent=1)
    return dict(frames=frames, dur=DUR, gaps=gaps, T=T)


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--words', default=None)
    ap.add_argument('--out', default=None)
    ap.add_argument('--stills', default='')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    tl = timing.load(a.words)
    st = [int(float(v) * FPS) for v in a.stills.split(',') if v]
    r = build(tl, a.out, stills=st)
    print({k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items() if k != 'T'})
    print({k: round(v, 2) for k, v in r['T'].items()})
