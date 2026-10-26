"""LevlPrep Short w1025-01-power-lift (NREMT, EMT traps #1). Vertical 1080x1920, 30 fps, skia.

Story: a fire station ambulance bay in the morning (new flat layered Gemini scene, a_bay.jpg; the orange jump bag cut out
of the painting and the floor behind it filled, so the bag can move). The traced paramedic bends at the waist with nearly
straight legs to lift the bag (real motion capture CMU 26_11 "bend, lift"): as the bag comes up a red pain pulse flares
at her lower back and she flinches; red X. Rewind to the moment she grips the handle, PAUSED: the lever drawn on her own
pose (lower back pivot, the long horizontal distance to the bag, the bag's weight, her back muscles pulling hard, a load
meter). Then the power lift (real motion capture CMU 69_70 "walk up to object, squat, pick up"): she steps in so the bag
is just in front of her toes, back straight, squats in slow motion; the lever line is now much shorter than the old one
(shown dashed) and the meter is low; she stands up with her legs (green leg arrows). End question with two chips.

MOTIONS (for the accuracy check):
1 Stoop (recorded 26_11, 0.44 to 1.24 s): bends at the hips, knees only slightly bent, reaches down; hands grip the
  handle at 26 cm; crossfade to the same take's rise (2.59 s on) as she starts to lift; slowed to a stop as the pain
  pulse flares at the lower back (L5 region, at the base of the spine), a small procedural flinch (trunk dips, head drops).
2 Rewind: the recorded frames played backward to the grip, then PAUSED (no blinks, no breathing while paused).
3 Lever on the paused pose: pivot = lower back (12% of the way from hip joint to neck); horizontal distance from the
  pivot to the bag's centre (yellow dimension line); bag weight arrow down at the bag; back muscle arrow along the back
  toward the pelvis; load meter = (bag weight x its distance + upper body weight x its distance), measured on the pose.
4 Power lift (recorded 69_70): steps in (1.40 to 2.25 s), stands, squats in slow motion 0.3x (2.35 to 2.95 s): knees
  bend, hips go down and back, back stays straight; grips the handle at the bottom with the bag just in front of the
  toes; same lever drawn: distance now much shorter (the stoop distance shown dashed for comparison), meter lower;
  stands up 0.4x (3.25 to 4.15 s) with the bag held close, green arrows on the thighs (leg muscles do the lifting).
"""
import sys, math, json, os
sys.path[:0] = ['/home/claude/w1025', '/home/claude/trace']
import numpy as np, skia, cv2
import kit as K
from kit import smooth, col, TEAL, YELLOW, CORAL, WHITE, GREEN, lerp, clamp, W_, H_, FPS
import layout as L
sys.path.insert(0, '/home/claude/trace')
import model, partrig, perf
import mocap_perf as MP

VID = 'w1025-01-power-lift'
OUT = f'/home/claude/w1025/out/{VID}'
CS = 0.70                  # rig px -> world px
X0 = 452.0                 # world x of the rig origin (hip) for the stoop
SOLE_W = 1450.0            # world y of the floor under her feet
HANDLE_H = 160.0           # rig px: handle height above the floor (about 26 cm)
GROUND_SOFT = 18.0         # rig px: knees never lock straight (removes a hyperextension seam, stress test 0 breaks)
PXM = 980 / 1.65           # rig px per metre (she is 1.65 m)

STOOP = MP.Take('26_11', near='Left')
LIFT = MP.Take('69_70', near='Left')
FIXED = perf.repair(STOOP) + perf.repair(LIFT)


def bag_sprite():
    a = cv2.imread(K.ART + 'a_bag.png', cv2.IMREAD_UNCHANGED)
    a = cv2.cvtColor(a, cv2.COLOR_BGRA2RGBA)
    h, w = a.shape[:2]
    m = a[..., 3] > 128
    ys, xs = np.where(m)
    top = ys.min()
    # handle grip: the topmost row of the handle, its x centre
    hx = xs[ys < top + 6].mean()
    return a, (hx, top + 4), (xs.mean(), ys.mean())


def build(vid_out=None, stills=()):
    tl = K.Timeline(VID)
    k = tl.k
    T = {}
    T['grip1'] = 0.54
    T['strain'] = 1.25
    T['x'] = 1.85
    T['wreck'] = k('result', 'wreck')
    T['rw0'] = k('rewind', 'rewind') - 0.15
    T['rw1'] = T['rw0'] + 0.95
    T['pause_end'] = tl.span('why')[1] + 0.15
    T['straight'] = k('why', 'straight')
    T['hangs'] = k('why', 'hangs')
    T['spine'] = k('why', 'spine')
    T['lever'] = k('why', 'lever')
    T['farther'] = k('why', 'farther')
    T['pull'] = k('why', 'pull')
    T['fix0'] = k('fix', 'power') - 0.15
    T['walk0'] = T['fix0'] + 0.2
    T['feet'] = k('fix', 'feet')
    T['close'] = k('fix', 'close')
    T['locked'] = k('fix', 'back')
    T['sq0'] = T['locked'] - 0.3
    T['squat'] = k('fix', 'squats')
    T['legs'] = k('payoff', 'legs')
    T['rise0'] = k('payoff', 'now')
    T['rise1'] = tl.span('payoff')[1] + 0.2
    T['closer'] = k('ask', 'closer')
    T['faster'] = k('ask', 'faster')
    T['end'] = tl.end + 0.45
    DUR = T['end'] + 1.9

    # ---------------- performer clocks (tau = seconds into the take)
    def tauA(t):
        if t < T['grip1']:
            return 0.70 + t                           # bending down, real time (already moving at frame 0)
        if t < T['grip1'] + 0.7:                      # lift starts (crossfaded to the rise), slowing as the pain hits
            u = (t - T['grip1']) / 0.7
            return 2.59 + 0.14 * (1 - (1 - u) ** 2)   # only the first heave: knees stay nearly straight
        return 2.73 + 0.01 * (1 - math.exp(-(t - T['grip1'] - 0.7) * 2))

    def planA(t):
        tau = tauA(t)
        if t < T['grip1']:
            return [('d', STOOP, tau, 1.0)]
        w = MP.xfade(t, T['grip1'], T['grip1'] + 0.22)
        return [('d', STOOP, 0.70 + T['grip1'], 1 - w), ('r', STOOP, tau, w)]

    def flinch(t):
        u = smooth((t - T['strain']) / 0.12) * (1 - 0.6 * smooth((t - T['strain'] - 0.35) / 0.6))
        return dict(spine=0.10 * u + 0.015 * math.sin(t * 31) * u, head=0.22 * u)

    def tauB(t):
        if t < T['walk0'] + 0.85:
            return 1.40 + max(0.0, t - T['walk0'])
        if t < T['sq0']:
            return 2.25 + 0.10 * (t - T['walk0'] - 0.85) / max(T['sq0'] - T['walk0'] - 0.85, 0.1)
        if t < T['squat']:
            return 2.35 + 0.60 * (t - T['sq0']) / (T['squat'] - T['sq0'])
        if t < T['rise0']:
            return 2.95 + 0.30 * (t - T['squat']) / max(T['rise0'] - T['squat'], 0.1)
        if t < T['rise1']:
            return 3.25 + 0.90 * smooth((t - T['rise0']) / (T['rise1'] - T['rise0']))
        return 4.15 + 0.08 * (1 - math.exp(-(t - T['rise1']) * 0.6))

    def breath(t):
        return dict(spine=0.012 * math.sin(t * 2 * math.pi / 3.6))

    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    clk = {'t': 0.0}
    PA = MP.MocapPerformer(rig, spec, lambda tt: planA(clk['t']), ground_take=STOOP)
    PA.ground -= GROUND_SOFT
    PA.extra = lambda tt: flinch(clk['t'])
    PB = MP.MocapPerformer(rig, spec, lambda tt: [('l', LIFT, tauB(clk['t']), 1.0)], ground_take=LIFT)
    PB.ground -= GROUND_SOFT
    PB.extra = lambda tt: breath(clk['t'])
    SOLE_A = PA.ground + model.ANKLE_H
    SOLE_B = PB.ground + model.ANKLE_H

    def hand(W):
        return (rig.tail(W, 'n_hand') + rig.tail(W, 'f_hand')) / 2

    def pivot(W):
        hip, neck = rig.joint(W, 'body'), rig.tail(W, 'body')
        return hip + 0.12 * (neck - hip)

    def upper_com(W):
        hip, neck = rig.joint(W, 'body'), rig.tail(W, 'body')
        return hip + 0.55 * (neck - hip)

    # ---------------- pass 1: simulate every 1/60 s
    n60 = int(DUR * 60) + 2
    sim = []
    grip_i = None
    for i in range(n60):
        t = i / 60
        clk['t'] = t
        if t < T['fix0']:
            if t < T['rw0']:
                W = PA.pose(t)
                st = dict(seg='A', W=W, sole=SOLE_A, dx=0.0, tau=tauA(t))
                if grip_i is None and t >= T['grip1']:
                    grip_i = i
                sim.append(st)
            else:
                sim.append(None)                     # filled from the cache below (rewind / pause)
        else:
            W = PB.pose(t - T['fix0'])
            sim.append(dict(seg='B', W=W, sole=SOLE_B, dx=None, tau=tauB(t)))
    # rewind: the hook frames played backward from the strain to the grip, then paused on the grip frame
    i_rw0 = int(T['rw0'] * 60)
    last = i_rw0 - 1
    for i in range(i_rw0, int(T['fix0'] * 60) + 1):
        t = i / 60
        if i >= len(sim) or sim[i] is not None and sim[i].get('seg') == 'B':
            continue
        if t < T['rw1']:
            u = smooth((t - T['rw0']) / (T['rw1'] - T['rw0']))
            j = int(round(lerp(last, grip_i, u)))
            sim[i] = dict(sim[j], mode='rew')
        else:
            sim[i] = dict(sim[grip_i], mode='pause')
    GRIP = sim[grip_i]
    # bag: on the floor where her hands grip it in the stoop; held from each grip on
    hA = hand(GRIP['W'])
    BAG_X = hA[0]                                     # rig x (stoop frame) of the handle
    # power lift: shift take B so her hands meet the same handle at the bottom of the squat
    clk['t'] = 0
    i_sq = int(T['squat'] * 60)
    hB = hand(sim[i_sq]['W'])
    DXB = BAG_X - hB[0]
    for s in sim:
        if s['seg'] == 'B':
            s['dx'] = DXB
    grip2_i = i_sq
    # held bag offset: handle point relative to the hands at each grip (keeps the grip exact)
    off1 = np.array([BAG_X, GRIP['sole'] - HANDLE_H]) - hA
    off2 = np.array([BAG_X - DXB, sim[i_sq]['sole'] - HANDLE_H]) - hB
    for i, s in enumerate(sim):
        h = hand(s['W'])
        if s['seg'] == 'A':
            held = i >= grip_i and s.get('mode') != 'pause' and not (s.get('mode') == 'rew' and False)
            if s.get('mode') in ('rew', 'pause'):
                held = s['tau'] > tauA(T['grip1']) + 1e-6 or False
            if held:
                s['bag'] = (h + off1, True)
            else:
                s['bag'] = (np.array([BAG_X, s['sole'] - HANDLE_H]), False)
        else:
            if i >= grip2_i:
                s['bag'] = (h + off2 + np.array([0.0, 0.0]), True)
            else:
                s['bag'] = (np.array([BAG_X - DXB, s['sole'] - HANDLE_H]), False)

    # lever numbers measured on the two poses (kg and metres): bag 6 kg, upper body 60% of 62 kg
    def torque(W, bag_h, sole):
        pv = pivot(W)
        bag_c = bag_h + np.array([0.0, HANDLE_H * 0.55])
        d_bag = abs(bag_c[0] - pv[0]) / PXM
        d_up = abs(upper_com(W)[0] - pv[0]) / PXM
        return 6 * 9.81 * d_bag + 37 * 9.81 * d_up, d_bag, d_up
    TQ_A, DA, DUA = torque(GRIP['W'], GRIP['bag'][0], GRIP['sole'])
    TQ_B, DB, DUB = torque(sim[i_sq]['W'], sim[i_sq]['bag'][0], sim[i_sq]['sole'])
    print('stoop: bag %.2f m, trunk %.2f m, torque %.0f N m | squat: bag %.2f m, trunk %.2f m, torque %.0f N m | ratio %.2f'
          % (DA, DUA, TQ_A, DB, DUB, TQ_B, TQ_B / TQ_A))

    # ---------------- camera and world
    plate, s_pl = K.plate(K.ART + 'a_bay_clean.jpg', trim=22)
    PL = K.skimg(plate)
    bag_rgba, grip_px, bagc_px = bag_sprite()
    BAG_SC = (HANDLE_H * CS) / (bag_rgba.shape[0] - grip_px[1])      # sprite px -> world px (handle to bottom = HANDLE_H)
    BAG = K.skimg(bag_rgba)

    def to_world(s, p):
        dx = s['dx'] if s['dx'] is not None else 0.0
        return np.array([X0 + CS * (p[0] + dx), SOLE_W + CS * (p[1] - s['sole'])])

    def cam(t):
        z = 1.12
        cx, cy = 560.0, 1130.0
        zp = smooth((t - T['spine']) / 1.4) * (1 - smooth((t - T['fix0'] + 0.3) / 0.5))
        z += 0.10 * zp; cx += -20 * zp; cy += -40 * zp
        zq = smooth((t - T['sq0']) / 1.2) * (1 - smooth((t - T['rise1']) / 1.0))
        z += 0.06 * zq; cy += 0 * zq
        return cx, cy, z

    def W2S(t, p):
        cx, cy, z = cam(t)
        return np.array([z * (p[0] - cx) + 540, z * (p[1] - cy) + 960])

    # dust motes in the sunbeam and the trees outside the door moving in the breeze (life in the painting)
    rng = np.random.default_rng(3)
    motes = [dict(x=rng.uniform(40, 700), y=rng.uniform(500, 1400), r=rng.uniform(1.6, 3.6), ph=rng.uniform(0, 6), sp=rng.uniform(5, 14)) for _ in range(46)]
    tree_box = (int(0 / 1), int((430 - 22) * s_pl), int((235 - 22) * s_pl), int((770 - 22) * s_pl))
    tree_src = plate[tree_box[1]:tree_box[3], tree_box[0]:tree_box[2]].copy()

    def trees(t):
        h, w = tree_src.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        up = np.clip(1 - yy / h, 0, 1) ** 1.5
        dx = (3.2 * np.sin(t * 1.3 + yy * 0.012) + 1.5 * np.sin(t * 2.7 + xx * 0.02)) * up
        warp = cv2.remap(tree_src, xx + dx, yy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return K.skimg(warp)

    titles = [
        (0.0, 2.6, [[('Lifting the bag', WHITE)], [('BENT AT THE WAIST', CORAL)]]),
        (2.6, T['rw0'], [[("That's how EMTs", WHITE)], [('WRECK THEIR BACKS', CORAL)]]),
        (T['rw1'], T['fix0'], [[('Your lower back', WHITE)], [('IS A LEVER', YELLOW)]]),
        (T['fix0'] + 0.05, T['rise0'] - 0.1, [[('EMT', WHITE)], [('POWER LIFT', TEAL)]]),
        (T['rise0'] - 0.1, tl.span('ask')[0] - 0.1, [[('Legs do', WHITE)], [('THE LIFTING', GREEN)]]),
        (tl.span('ask')[0] - 0.1, T['end'], [[('Heavier bag:', WHITE)], [('CLOSER', TEAL), (' or ', WHITE), ('FASTER?', CORAL)]]),
    ]
    sounds = []

    def snd(name, t, gain):
        sounds.append((name, round(t, 3), gain))
    snd('series_emt_traps', 0.0, 0.55); snd('cloth_real', 0.15, 0.5); snd('pat', T['grip1'], 0.4)
    snd('cloth_real', T['grip1'] + 0.1, 0.35); snd('flinch', T['strain'], 0.55); snd('gasp_female_real', T['strain'] + 0.02, 0.5)
    snd('wrong', T['x'], 0.45); snd('swish', T['rw0'], 0.5)
    for key_, g in (('straight', 0.3), ('hangs', 0.35), ('lever', 0.35), ('farther', 0.3), ('pull', 0.4)):
        snd('swish' if key_ != 'pull' else 'riser', T[key_], g)
    snd('whoosh_real', T['fix0'], 0.5); snd('pat', T['feet'], 0.35); snd('pat', T['close'], 0.35); snd('swish', T['locked'], 0.35)
    snd('cloth_real', T['sq0'] + 0.2, 0.45); snd('pat', T['squat'], 0.45); snd('check', T['squat'] + 0.5, 0.45)
    snd('cloth_real', T['rise0'] + 0.1, 0.45); snd('shimmer', T['legs'], 0.35); snd('pat', T['closer'], 0.45); snd('pat', T['faster'], 0.45)

    blinks = (1.0, 4.2, 20.6, 23.9, 28.8, 32.4, 35.0)
    W_wr = K.Writer(vid_out, stills, OUT)
    frames = int(DUR * FPS)
    last_frame = None
    gaps = 0
    prev_lock = {'near': 0, 'far': 0}
    meterA = 1.0
    meterB = TQ_B / TQ_A
    for fi in range(frames):
        t = fi / FPS
        if os.environ.get('ONLY') and fi not in W_wr.stills:
            continue
        i = min(int(round(t * 60)), len(sim) - 1)
        s = sim[i]
        W = s['W']
        mode = s.get('mode', '')
        paused = mode == 'pause'
        rig.blink = 1.0 if (any(b <= t < b + 0.12 for b in blinks) and not paused) else 0.0
        cx, cy, z = cam(t)
        surf = skia.Surface(W_, H_); c = surf.getCanvas()
        c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
        c.drawImage(PL, 0, 0, K.SMP)
        if not paused:
            c.drawImage(trees(t), tree_box[0], tree_box[1], K.SMP)
        # dust motes drifting in the light from the door
        for m in motes:
            tt = t if not paused else T['rw1']
            x = m['x'] + 18 * math.sin(tt * 0.4 + m['ph']) + tt * m['sp'] * 0.5
            y = m['y'] - tt * m['sp'] + 14 * math.cos(tt * 0.5 + m['ph'])
            y = 500 + (y - 500) % 900
            k_ = clamp(1 - abs(x - 360) / 420)
            c.drawCircle(x, y, m['r'], skia.Paint(AntiAlias=True, Color=skia.Color(255, 244, 214, int(120 * k_))))
        c.restore()
        a_ = z * CS
        dx = s['dx'] if s['dx'] is not None else 0.0
        xf = np.array([[a_, 0, z * (X0 + CS * dx - cx) + 540], [0, a_, z * (SOLE_W - CS * s['sole'] - cy) + 960], [0, 0, 1.0]])
        def S(p):
            return (xf @ np.array([p[0], p[1], 1.0]))[:2]
        floor_y = S((0, s['sole']))[1]
        hip_s = S(rig.joint(W, 'body'))
        K.contact_shadow(c, hip_s[0] + 10 * z, floor_y, 120 * z * CS / 0.73, 13 * z, 0.30)
        # bag (behind her near arm: drawn before the rig, she grips the handle from above)
        bp, held = s['bag']
        bs = S(bp)
        sc = BAG_SC * z
        bw, bh = bag_rgba.shape[1] * sc, bag_rgba.shape[0] * sc
        x0 = bs[0] - grip_px[0] * sc; y0 = bs[1] - grip_px[1] * sc
        K.contact_shadow(c, bs[0], floor_y, bw * 0.48, 9 * z, 0.32 * (1 - clamp((floor_y - (y0 + bh)) / 60)))
        if True:
            rig.between = lambda cv, r=skia.Rect(x0, y0, x0 + bw, y0 + bh): cv.drawImageRect(BAG, r, K.SMP)
        # foot falls
        if s['seg'] == 'B':
            for side in ('near', 'far'):
                lk = PB.lock_w[side] if False else 0
        rig.draw(c, W, xf)
        if t >= T['end'] and last_frame is None:
            last_frame = surf.makeImageSnapshot()
        # ---- strain: red pulse at the lower back
        pv = S(pivot(W))
        nk_ = S(rig.tail(W, 'body')); u_ = (nk_ - pv) / max(np.linalg.norm(nk_ - pv), 1e-6)
        pv = pv + u_ * 70 * z                                    # the lumbar curve, above the belt line
        a_st = smooth((t - T['strain']) / 0.1) * (1 - smooth((t - T['rw0'] + 0.1) / 0.2))
        if a_st > 0.01:
            pulse = 0.55 + 0.45 * math.sin((t - T['strain']) * 9) ** 2
            K.glow(c, pv, 130 * z * pulse, CORAL, a_st)
            K.ring(c, pv, (40 + 60 * ((t - T['strain']) * 1.6 % 1)) * z * 0.8, CORAL, a_st * (1 - ((t - T['strain']) * 1.6 % 1)), 7)
        a_x = smooth((t - T['x']) / 0.12) * (1 - smooth((t - T['rw0']) / 0.12))
        K.x_stamp(c, 230, 560, 1.0 + 0.3 * math.exp(-max(0, t - T['x']) * 9), a_x)
        # ---- the lever on the paused stoop
        if paused or (T['rw1'] - 0.1 <= t < T['fix0'] + 0.3):
            fa = 1 - smooth((t - T['fix0'] + 0.25) / 0.25)
            Wg = GRIP['W']
            pv = S(pivot(Wg))
            bag_c = S(GRIP['bag'][0] + np.array([0.0, HANDLE_H * 0.55]))
            fl = S((0, GRIP['sole']))[1]
            a_lg = K.window(t, T['straight'] - 0.05, T['hangs'] - 0.1) * fa
            if a_lg > 0.01:
                kn = S(rig.joint(Wg, 'n_sh'))
                K.label(c, 'legs straight', kn[0] - 210, kn[1] + 10, CORAL, a_lg, 34, anchor=kn)
            a_d = smooth((t - T['hangs']) / 0.25) * fa
            if a_d > 0.01:
                yb = bag_c[1] - 150 * z
                K.dashed(c, (pv[0], pv[1]), (pv[0], yb), YELLOW, 4, a_d)
                K.dashed(c, (bag_c[0], bag_c[1] - 60 * z), (bag_c[0], yb), YELLOW, 4, a_d)
                g_ = smooth((t - T['spine']) / 0.5)
                K.arrow(c, (pv[0], yb), (lerp(pv[0], bag_c[0], g_), yb), YELLOW, w=10, head=30, a=a_d)
                K.arrow(c, (bag_c[0], yb), (lerp(bag_c[0], pv[0], g_), yb), YELLOW, w=10, head=30, a=a_d * g_)
                K.label(c, 'far from her spine', (pv[0] + bag_c[0]) / 2 + 40, yb + 58, YELLOW, a_d * g_, 34)
            a_pv = smooth((t - T['lever']) / 0.2) * fa
            if a_pv > 0.01:
                neck = S(rig.tail(Wg, 'body'))
                pulse = 1 + 0.3 * math.exp(-max(0, t - T['lever']) * 4)
                K.line(c, pv, neck, YELLOW, 7, a_pv * 0.9)
                K.ring(c, pv, 22 * pulse * z, YELLOW, a_pv, 7)
                K.label(c, 'lower back = pivot', pv[0] - 40, pv[1] - 130 * z, YELLOW, a_pv * (1 - smooth((t - T['pull'] + 0.15) / 0.3)), 32)
            a_w = smooth((t - T['farther']) / 0.2) * fa
            if a_w > 0.01:
                K.arrow(c, bag_c, bag_c + np.array([0, 60 * z]), K.GREY, w=11, head=32, a=a_w, grow=smooth((t - T['farther']) / 0.35))
                K.label(c, 'bag weight', bag_c[0] + 150, bag_c[1] + 40 * z, K.GREY, a_w, 30)
            a_m = smooth((t - T['pull']) / 0.2) * fa
            if a_m > 0.01:
                neck = S(rig.tail(Wg, 'body'))
                u = (neck - pv) / np.linalg.norm(neck - pv)
                nrm = np.array([u[1], -u[0]])
                if nrm[1] > 0:
                    nrm = -nrm
                p0 = pv + u * 150 * z + nrm * 26 * z
                p1 = pv + u * 30 * z + nrm * 26 * z
                for kk in range(2):
                    K.arrow(c, p0 + nrm * kk * 18, p1 + nrm * kk * 18, CORAL, w=12, head=30, a=a_m, grow=smooth((t - T['pull'] - kk * 0.1) / 0.3))
                K.label(c, 'back muscles pull HARD', p0[0] + 40, p0[1] - 80 * z, CORAL, a_m, 32)
            a_meter = smooth((t - T['farther'] - 0.2) / 0.3) * fa
            K.meter(c, 830, 600, 170, 380, meterA * smooth((t - T['farther'] - 0.2) / 1.6), a_meter, 'BACK LOAD')
            K.label(c, f'{TQ_A:.0f} N m', 915, 1035, CORAL, a_meter * smooth((t - T['farther'] - 1.2) / 0.4), 34)
        # ---- power lift overlays
        if s['seg'] == 'B':
            a_f = K.window(t, T['feet'] - 0.05, T['close'] - 0.25)
            ft = S(rig.joint(W, 'n_ft'))
            K.label(c, 'feet shoulder width', ft[0] - 20, ft[1] + 86, TEAL, a_f, 34)
            a_c = K.window(t, T['close'] - 0.05, T['squat'] - 0.2)
            if a_c > 0.01:
                toe = S(rig.tail(W, 'n_ft'))
                bg_ = S(s['bag'][0])
                K.arrow(c, (toe[0] + 10, floor_y - 12), (bg_[0] - 40, floor_y - 12), TEAL, w=9, head=26, a=a_c)
                K.label(c, 'bag in close', (toe[0] + bg_[0]) / 2, floor_y + 74, TEAL, a_c, 34)
            a_b = K.window(t, T['locked'] - 0.05, T['rise0'] + 0.3)
            if a_b > 0.01:
                hip = S(rig.joint(W, 'body')); neck = S(rig.tail(W, 'body'))
                u = (neck - hip) / np.linalg.norm(neck - hip); nrm = np.array([u[1], -u[0]])
                if nrm[0] > 0:
                    nrm = -nrm
                K.line(c, hip + nrm * 30 * z * CS / 0.73, neck + nrm * 26 * z * CS / 0.73, TEAL, 8, a_b)
                K.label(c, 'back locked', neck[0] - 160, neck[1] - 30, TEAL, a_b * (1 - smooth((t - T['squat'] - 0.2) / 0.3)), 32)
            # the lever again, at the bottom of the squat: much shorter than the stoop's (dashed)
            a_l = K.window(t, T['squat'] - 0.15, T['rise0'] + 0.6)
            if a_l > 0.01:
                Wq = sim[i_sq]['W']
                pvq = S(pivot(Wq)); bq = S(sim[i_sq]['bag'][0] + np.array([0.0, HANDLE_H * 0.55]))
                yb = bq[1] - 150 * z
                K.dashed(c, (pvq[0], pvq[1]), (pvq[0], yb), YELLOW, 4, a_l)
                K.arrow(c, (pvq[0], yb), (bq[0], yb), YELLOW, w=10, head=26, a=a_l)
                K.arrow(c, (bq[0], yb), (pvq[0], yb), YELLOW, w=10, head=26, a=a_l)
                old = DA * PXM * CS * z
                K.dashed(c, (pvq[0], yb - 40 * z), (pvq[0] + old, yb - 40 * z), CORAL, 6, a_l * 0.9)
                K.label(c, 'before', pvq[0] + old + 70, yb - 40 * z, CORAL, a_l * (1 - smooth((t - T['squat'] - 0.5) / 0.3)), 30)
                K.ring(c, pvq, 22 * z, YELLOW, a_l, 7)
            a_mb = K.window(t, T['squat'] + 0.1, tl.span('ask')[0])
            if a_mb > 0.01:
                v = lerp(meterA, meterB, smooth((t - T['squat'] - 0.1) / 0.8))
                K.meter(c, 830, 600, 170, 380, v, a_mb, 'BACK LOAD')
                K.label(c, f'{lerp(TQ_A, TQ_B, smooth((t - T["squat"] - 0.1) / 0.8)):.0f} N m', 915, 1035, GREEN if t > T['squat'] + 0.6 else CORAL, a_mb, 34)
            # legs do the lifting: green arrows along the thighs, up
            a_lg = K.window(t, T['legs'] - 0.1, tl.span('ask')[0] + 0.2)
            if a_lg > 0.01:
                for th, sh in (('n_th', 'n_sh'),):
                    kn = S(rig.joint(W, sh)); hp = S(rig.joint(W, th))
                    mid = (kn + hp) / 2
                    K.glow(c, mid, 120 * z * (0.8 + 0.2 * math.sin(t * 6)), GREEN, a_lg * 0.8)
                    K.arrow(c, mid + np.array([0, 60 * z]), mid + np.array([0, -90 * z]), GREEN, w=13, head=34, a=a_lg)
                K.label(c, 'legs push', mid[0] - 170, mid[1] - 40, GREEN, a_lg, 34)
        # ---- status pills
        K.status_pill(c, 'paused', smooth((t - T['rw1']) / 0.2) * (1 - smooth((t - T['fix0']) / 0.2)))
        K.status_pill(c, 'slow', K.window(t, T['sq0'], T['rise1']))
        K.rewind_fx(c, t, smooth((t - T['rw0']) / 0.08) * (1 - smooth((t - T['rw1']) / 0.1)))
        # ---- answer chips
        for txt, t0, yy, colr in (('PULL IT CLOSER', T['closer'] - 0.05, 660, TEAL), ('LIFT FASTER', T['faster'] - 0.05, 790, CORAL)):
            a = smooth((t - t0) / 0.2) * (1 - smooth((t - T['end']) / 0.2))
            if a > 0:
                L.chip(c, txt, 300, yy, colr, 52, a, scale=0.85 + 0.15 * smooth((t - t0) / 0.18))
        K.layout_pass(c, t, tl, DUR, 'NREMT  ·  LIFTING & MOVING', titles, T['end'],
                      [[('Heavier bag: ', WHITE), ('closer', TEAL)], [('or ', WHITE), ('faster?', CORAL)], [('New EMT traps every week', WHITE)]],
                      last_frame, series='EMT TRAPS #1')
        if fi % 2 == 0 and s['seg'] in ('A', 'B') and mode == '':
            g = partrig.gap_check(rig, W, xf, (W_, H_), joints, radius, down=1.0)
            if max(g[j] for j in joints) > 0.02 or g['components'] > 1:
                gaps += 1
        W_wr.put(fi, surf)
    W_wr.close()
    # foot fall sounds from the performer contacts (power lift steps)
    json.dump(dict(T=T, DUR=DUR, sounds=sounds, torque=dict(stoop=TQ_A, squat=TQ_B, d_bag_stoop=DA, d_bag_squat=DB, d_up_stoop=DUA,
                                                              d_up_squat=DUB)), open(f'{OUT}/build.json', 'w'), indent=1)
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
