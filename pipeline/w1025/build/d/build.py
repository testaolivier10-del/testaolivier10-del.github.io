"""LevlPrep Short w1025-04-head-rush (A&P, short term blood pressure control). Vertical 1080x1920, 30 fps, skia.

Story: a sunny home kitchen in the morning (new flat layered Gemini scene, d_kitchen.jpg, extended at the edges for a
wider camera). The traced hoodie guy is perched on the tall stool and stands up fast (real motion capture CMU 13_01 "sit on
high stool, stand up"); his vision greys in from the edges and he sways (small keyed sway on top of the recording).
A round lens opens from his neck into a flat body diagram (new Gemini diagram d_body.jpg: arteries bright red, veins
dark red), while he keeps swaying in a small round inset: gravity arrows, the leg veins fill and widen (about half a
liter), the return to the heart thins and the heart beats weaker, a blood pressure trace dips, the brain dims. The
pressure sensors in the neck (carotid sinus) and chest (aortic arch) light up and signal the brainstem; the heart beats
faster, the vessels squeeze, the trace recovers. The lens closes back to the kitchen: his vision clears, he stands steady
and rises onto his toes (calf flex). The question with two chips. Poll post: the upper middle (560 to 900) stays free
for the first 8 s.

MOTIONS (for the accuracy check):
1 Stand up (recorded 13_01, 7.15 to 8.45 s): from perched on the high stool (feet on the foot ring) to standing; then a
  small keyed sway of the trunk and head while his vision greys (vignette and desaturation), easing out as it clears.
2 Diagram: veins in the legs widen and darken (blood pooling, about 0.5 L, arrows of gravity down); the upward flow arrows
  in the abdominal vein to the heart thin out; the heart's beat gets smaller; the brain dims while the trace is low.
3 Sensors: rings at both carotid arteries in the neck and at the aortic arch above the heart; signals (dots) travel up to
  the brainstem; then the heart beats faster (rate rises) and the vessels narrow (squeeze arrows), the leg veins empty
  back toward normal; the trace recovers to baseline in about 15 to 20 s of its own time axis, no big overshoot.
4 Calf flex (keyed heel raise on the recorded standing pose): heels lift, balls of the feet stay planted.
"""
import sys, math, json, os
sys.path[:0] = ['/home/claude/w1025']
import numpy as np, skia, cv2
import kit as K
from kit import smooth, col, TEAL, YELLOW, CORAL, WHITE, GREEN, lerp, clamp, W_, H_, FPS
import layout as L
sys.path.insert(0, '/home/claude/runner')
sys.modules.pop('model', None)
import model, partrig, perf
import mocap_perf as MP

VID = 'w1025-04-head-rush'
OUT = f'/home/claude/w1025/out/{VID}'
SIT = MP.Take('13_01', near='Left')
FIXED = perf.repair(SIT)
SP = 1080 / 768
EXT = 400                                    # world px added on every side of the kitchen painting
CS = 1075 / 897.0                            # rig px -> world px (he is 1.75 m; the stool seat 0.8 m)
SOLE_W = 1624.0 + EXT
X0 = 300.0 + EXT
NECK_FRAC = 0.92


def kitchen():
    a = K.load_rgb(K.ART + 'd_kitchen.jpg')
    b = cv2.resize(a, (1080, int(a.shape[0] * SP)), interpolation=cv2.INTER_CUBIC)
    b = cv2.addWeighted(b, 1.3, cv2.GaussianBlur(b, (0, 0), 1.3), -0.3, 0)
    e = cv2.copyMakeBorder(b, EXT, EXT, EXT, EXT, cv2.BORDER_REFLECT)
    # soften the mirrored margins so they read as more room, not a mirror
    m = np.zeros(e.shape[:2], np.float32); m[EXT:-EXT, EXT:-EXT] = 1
    m = cv2.GaussianBlur(m, (0, 0), 60)
    bl = cv2.GaussianBlur(e, (0, 0), 6)
    return (e * m[..., None] + bl * (1 - m[..., None])).astype(np.uint8)


def body():
    a = K.load_rgb(K.ART + 'd_body.jpg')
    b = cv2.resize(a, (1080, int(a.shape[0] * SP)), interpolation=cv2.INTER_CUBIC)
    r, g, bb = [b[..., i].astype(int) for i in range(3)]
    vein = ((r > 95) & (r < 175) & (g < 75) & (bb < 85)).astype(np.uint8)
    yy = np.arange(b.shape[0])[:, None]
    legs = vein * (yy > 950)
    trunk = vein * (yy > 700) * (yy <= 950)
    return b, legs, trunk


def build(vid_out=None, stills=()):
    tl = K.Timeline(VID)
    k = tl.k
    T = {}
    T['up0'] = 0.05
    T['up1'] = T['up0'] + 1.25
    T['dark'] = k('hook', 'dark')
    T['lens0'] = k('why', 'gravity') + 0.15     # the dark beat holds about a second before the lens
    T['lens1'] = T['lens0'] + 0.8
    T['pulls'] = k('why', 'pulls')
    T['liter'] = k('why', 'liter')
    T['legs'] = k('why', 'legs')
    T['less'] = k('why', 'less')
    T['heart'] = k('why', 'heart')
    T['dips'] = k('why', 'dips')
    T['brain'] = k('why', 'brain')
    T['sensors'] = k('fix', 'sensors')
    T['neck'] = k('fix', 'neck')
    T['chest'] = k('fix', 'chest')
    T['catch'] = k('fix', 'catch')
    T['speeds'] = k('fix', 'speeds')
    T['squeeze'] = k('fix', 'squeeze')
    T['bounces'] = k('fix', 'bounces')
    T['close0'] = tl.span('tip')[0] - 0.4
    T['close1'] = T['close0'] + 0.8
    T['slower'] = k('tip', 'slower')
    T['calves'] = k('tip', 'calves')
    T['hot'] = k('ask', 'hot')
    T['cold'] = k('ask', 'cold')
    T['end'] = tl.end + 0.45
    DUR = T['end'] + 1.9

    def tau(t):
        if t < T['up0']:
            return 7.15
        if t < T['up1']:
            return 7.15 + 1.30 * (t - T['up0']) / (T['up1'] - T['up0'])
        return 8.45 + 0.02 * (1 - math.exp(-(t - T['up1'])))

    def extra(t):
        dz = K.window(t, T['dark'] - 0.4, T['bounces'], 0.6, 2.5)          # dizzy sway while the pressure is low
        sway = dz * (0.05 * math.sin(t * 2.1) + 0.025 * math.sin(t * 3.7 + 1))
        heel = 0.32 * K.window(t, T['calves'] - 0.1, T['calves'] + 1.3, 0.35, 0.45)
        return dict(spine=sway + 0.010 * math.sin(t * 2 * math.pi / 3.6), head=0.18 * dz * (0.5 + 0.5 * math.sin(t * 1.6)),
                    dx=14 * dz * math.sin(t * 2.1 - 0.4), heel=heel)

    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    clk = {'t': 0.0}
    T['reset'] = T['close0'] - 0.5                     # while the inset is tiny: back on the stool
    T['rise0'] = T['slower'] - 0.6                     # then he stands up slowly (half speed)

    def tau_b(t):
        if t < T['rise0']:
            return 7.15
        if t < T['rise0'] + 2.4:
            return 7.15 + 1.30 * smooth((t - T['rise0']) / 2.4)
        return 8.45 + 0.02 * (1 - math.exp(-(t - T['rise0'] - 2.4)))

    def plan(t):
        if t < T['reset']:
            return [('a', SIT, tau(t), 1.0)]
        if t < T['reset'] + 0.35:
            w = MP.xfade(t, T['reset'], T['reset'] + 0.35)
            return [('a', SIT, tau(t), 1 - w), ('b', SIT, tau_b(t), w)]
        return [('b', SIT, tau_b(t), 1.0)]
    P = MP.ClampedPerformer(rig, spec, lambda tt: plan(clk['t']), ground_take=SIT)
    P.extra = lambda tt: extra(clk['t'])
    sim = []
    A0 = None
    for i in range(int(DUR * 60) + 2):
        clk['t'] = i / 60
        if A0 is not None and clk['t'] >= T['reset'] and 'b' not in P.anchor:
            P.anchor['b'] = (A0[0].copy(), A0[1].copy())     # back on the stool where the take began
        sim.append(P.pose(i / 60))
        if A0 is None and 'a' in P.anchor:
            A0 = (P.anchor['a'][0].copy(), P.anchor['a'][1].copy())
    Wst = sim[int(5.0 * 60)]
    STAND_SOLE = max(rig.joint(Wst, 'n_ft')[1], rig.joint(Wst, 'f_ft')[1]) + model.ANKLE_H
    # seated frames: the take's feet rest on the stool ring, so the rig's sole is the stand sole all along (root moves)

    KIT = K.skimg(kitchen())
    body_a, legs_m, trunk_m = body()
    BODY = K.skimg(body_a)
    bgc = tuple(int(v) for v in body_a[6, 6])
    vein_rgba = np.zeros(body_a.shape[:2] + (4,), np.uint8); vein_rgba[..., 0] = 150; vein_rgba[..., 1] = 12; vein_rgba[..., 2] = 40
    dil = cv2.dilate(legs_m, np.ones((17, 17), np.uint8))
    halo = cv2.GaussianBlur(dil.astype(np.float32), (0, 0), 4)
    vein_rgba[..., 3] = (np.clip(halo * 2.2, 0, 1) * 255).astype(np.uint8)
    VEINS = K.skimg(vein_rgba)
    # the heart (cut from the diagram) to pulse; the brain region to dim
    HEART_BOX = (int(330 * SP), int(380 * SP), int(470 * SP), int(530 * SP))
    hb = body_a[HEART_BOX[1]:HEART_BOX[3], HEART_BOX[0]:HEART_BOX[2]]
    hr, hg, hbb = [hb[..., i].astype(int) for i in range(3)]
    hm = ((hr > 180) & (hg < 140) & (hbb < 130)).astype(np.float32)
    hm = cv2.GaussianBlur(cv2.morphologyEx(hm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)), (0, 0), 1)
    HEART = K.skimg(np.dstack([hb, (hm * 255).astype(np.uint8)]))
    hcx, hcy = (HEART_BOX[0] + HEART_BOX[2]) / 2, (HEART_BOX[1] + HEART_BOX[3]) / 2
    BRAIN = np.array([383 * SP, 160 * SP]); BRAIN_R = 70 * SP
    CAROT = [np.array([352 * SP, 285 * SP]), np.array([414 * SP, 285 * SP])]
    ARCH = np.array([388 * SP, 392 * SP])
    STEM = np.array([383 * SP, 228 * SP])

    def kit_cam(t):
        z = 0.72
        return 540.0 + EXT + 20, SOLE_W - (1390 - 960) / z, z

    def body_cam(t):
        zin = K.window(t, T['sensors'] - 0.5, T['speeds'] + 0.4, 0.8, 0.8)
        cx = lerp(540, 540, zin); cy = lerp(1000, 520, zin); z = lerp(0.52, 1.05, zin)
        return cx, cy, z

    def neck_screen(t, W):
        cx, cy, z = kit_cam(t)
        hip = rig.joint(W, 'body'); nk = rig.tail(W, 'body')
        p = hip + NECK_FRAC * (nk - hip)
        dx = 0.0
        wp = np.array([X0 + CS * p[0], SOLE_W + CS * (p[1] - STAND_SOLE)])
        return np.array([z * (wp[0] - cx) + 540, z * (wp[1] - cy) + 960])

    titles = [
        (0.0, T['dark'] - 0.15, [[('He stands up', WHITE)], [('FAST', CORAL)]]),
        (T['dark'] - 0.15, T['lens0'], [[('Stand up fast:', WHITE)], [('VISION GOES DARK', CORAL)]]),
        (T['lens0'], T['sensors'] - 0.2, [[('Blood pools in', WHITE)], [('YOUR LEGS', CORAL)]]),
        (T['sensors'] - 0.2, T['close0'], [[('Sensors', WHITE)], [('FIX THE PRESSURE', TEAL)]]),
        (T['close0'], tl.span('ask')[0] - 0.1, [[('Stand up', WHITE)], [('SLOWER', GREEN)]]),
        (tl.span('ask')[0] - 0.1, T['end'], [[('Worse head rush:', WHITE)], [('HOT', CORAL), (' or ', WHITE), ('COLD?', TEAL)]]),
    ]
    sounds = []

    def snd(n, t, g):
        sounds.append((n, round(t, 3), g))
    snd('cloth_real', T['up0'] + 0.1, 0.5); snd('pat', T['up1'] - 0.1, 0.35); snd('numb', T['dark'] - 0.2, 0.45)
    snd('swish', T['lens0'], 0.45); snd('dive', T['pulls'], 0.35); snd('pop', T['liter'], 0.3); snd('swish', T['less'], 0.3)
    snd('wrong', T['dips'], 0.35); snd('riser', T['sensors'] - 0.3, 0.3); snd('ding', T['catch'], 0.35)
    snd('swish', T['squeeze'], 0.35); snd('shimmer', T['bounces'], 0.4); snd('swish', T['close0'], 0.45)
    snd('cloth_real', T['calves'], 0.35); snd('pat', T['hot'], 0.45); snd('pat', T['cold'], 0.45)
    # heartbeats: slow and soft while low, then faster (the rate rises), in the diagram only
    tb = T['lens1']
    while tb < T['close0']:
        snd('heartbeat_real', tb, 0.22)
        tb += 60 / (70 if tb < T['speeds'] else 96)

    def bp(u):
        """Blood pressure trace (fraction of normal) over its own time axis u in seconds after standing (0..30)."""
        dip = 0.28 * math.exp(-((u - 6) / 3.5) ** 2) if u < 6 else 0.28 * math.exp(-((u - 6) / 6.5) ** 2)
        return 1.0 - dip + 0.02 * math.exp(-((u - 20) / 4) ** 2)

    def heart_rate(t):
        return lerp(72, 96, smooth((t - T['speeds']) / 1.0)) * (1 - smooth((t - T['bounces'] - 1.5) / 2)) + 78 * smooth((t - T['bounces'] - 1.5) / 2)

    blinks = (1.9, 3.6, 9.0, 14.5, 20.1, 23.5, 27.4, 30.6)
    W_wr = K.Writer(vid_out, stills, OUT)
    frames = int(DUR * FPS)
    last_frame = None
    gaps = 0
    beat_phase = 0.0
    for fi in range(frames):
        t = fi / FPS
        if os.environ.get('ONLY') and fi not in W_wr.stills:
            beat_phase += heart_rate(t) / 60 / FPS
            continue
        i = min(int(round(t * 60)), len(sim) - 1)
        W = sim[i]
        rig.blink = 1.0 if any(b <= t < b + 0.12 for b in blinks) else 0.0
        # ---- the kitchen, rendered on its own surface (full scene or the round inset)
        ks = skia.Surface(W_, H_); kc = ks.getCanvas()
        cx, cy, z = kit_cam(t)
        kc.save(); kc.translate(540, 960); kc.scale(z, z); kc.translate(-cx, -cy)
        kc.drawImage(KIT, 0, 0, K.SMP)
        # the pendant lamp's glow breathing and dust in the window light
        gl = 0.8 + 0.2 * math.sin(t * 1.3)
        lp = np.array([473 * SP + EXT, 275 * SP + EXT])
        sh = skia.GradientShader.MakeRadial(skia.Point(*lp), 160, [skia.Color(255, 235, 190, int(90 * gl)), skia.Color(255, 235, 190, 0)])
        kc.drawCircle(*lp, 160, skia.Paint(Shader=sh, BlendMode=skia.BlendMode.kPlus))
        kc.restore()
        a_ = z * CS
        xf = np.array([[a_, 0, z * (X0 - cx) + 540], [0, a_, z * (SOLE_W - CS * STAND_SOLE - cy) + 960], [0, 0, 1.0]])
        gy = z * (SOLE_W - cy) + 960
        hip_s = (xf @ np.array([*rig.joint(W, 'body'), 1.0]))[:2]
        K.contact_shadow(kc, hip_s[0] + 20, gy, 120 * z, 12 * z, 0.25)
        rig.draw(kc, W, xf)
        # dizziness: greying and tunnel vision
        dk = K.window(t, T['dark'] - 0.5, T['bounces'] + 0.5, 0.6, 1.5) * (1 - smooth((t - T['close1']) / 0.6))
        if dk > 0.01:
            kc.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=skia.Color(60, 60, 70, int(160 * dk)), BlendMode=skia.BlendMode.kSaturation))
            L.vignette(kc, min(1.0, dk * 1.0), t)
            # tunnel vision: a dark ring closing in around him
            tun = dk * K.window(t, T['dark'] - 0.3, T['lens0'] + 0.4, 0.4, 0.5)
            if tun > 0.01:
                hc = (xf @ np.array([*rig.joint(W, 'body'), 1.0]))[:2]
                sh = skia.GradientShader.MakeRadial(skia.Point(hc[0], hc[1] - 150), 900, [skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, 0), skia.Color(5, 5, 12, int(235 * tun))], [0.0, 0.42 + 0.25 * (1 - tun), 1.0])
                kc.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Shader=sh))
        KS = ks.makeImageSnapshot()
        # ---- the diagram surface
        bs = skia.Surface(W_, H_); bc = bs.getCanvas()
        bc.clear(col(bgc))
        bx, by, bz = body_cam(t)
        bc.save(); bc.translate(540, 960); bc.scale(bz, bz); bc.translate(-bx, -by)
        bc.drawImage(BODY, 0, 0, K.SMP)
        pool = smooth((t - T['pulls']) / 2.2) * (1 - 0.75 * smooth((t - T['squeeze']) / 1.5))
        if pool > 0.01:
            bc.save()
            pulse = 0.85 + 0.15 * math.sin(t * 3)
            bc.drawImage(VEINS, 0, 0, K.SMP, skia.Paint(Alphaf=pool * pulse))
            bc.restore()
        # brain dims while the pressure is low
        bd = K.window(t, T['brain'] - 0.1, T['bounces'] + 0.3, 0.4, 1.2)
        if bd > 0.01:
            bc.drawCircle(*BRAIN, BRAIN_R, skia.Paint(AntiAlias=True, Color=skia.Color(80, 90, 120, int(150 * bd)),
                                                    MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14)))
        # the heart: beat size follows the return (weaker while pooled), rate from the reflex
        beat_phase += heart_rate(t) / 60 / FPS
        ph = beat_phase % 1.0
        strength = 1.0 - 0.55 * smooth((t - T['less']) / 1.0) * (1 - smooth((t - T['speeds']) / 1.2))
        sc = 1 + (0.07 * strength) * math.exp(-ph * 7)
        bc.save(); bc.translate(hcx, hcy); bc.scale(sc, sc); bc.translate(-hcx, -hcy)
        bc.drawImage(HEART, HEART_BOX[0], HEART_BOX[1], K.SMP)
        bc.restore()
        bc.restore()

        def B(p):
            return np.array([bz * (p[0] - bx) + 540, bz * (p[1] - by) + 960])
        da = smooth((t - T['lens0']) / 0.6) * (1 - smooth((t - T['close0']) / 0.4))
        # gravity arrows beside the legs, pooling label
        ga = K.window(t, T['pulls'] - 0.1, T['less'] + 0.4) * da
        for lx in (290 * SP, 480 * SP):
            for kk in range(2):
                y0 = (900 + kk * 170) * SP
                K.arrow(bc, B((lx - 90 * SP * (1 if lx < 400 * SP else -1), y0)), B((lx - 90 * SP * (1 if lx < 400 * SP else -1), y0 + 120 * SP)),
                        K.GREY, w=10, head=26, a=ga, grow=smooth((t - T['pulls'] - kk * 0.2) / 0.4))
        K.label(bc, 'gravity', 860, 1060, K.GREY, ga, 34)
        la = K.window(t, T['liter'] - 0.05, T['dips'] + 0.6) * da
        K.label(bc, 'about ½ liter pools here', 800, 1250, CORAL, la, 34, anchor=tuple(B((460 * SP, 1150 * SP))))
        # less return: upward flow arrows on the big vein to the heart, thinning
        ra = K.window(t, T['less'] - 0.1, T['brain'] + 0.6) * da
        if ra > 0.01:
            th = lerp(14, 5, smooth((t - T['less']) / 0.8))
            for kk in range(3):
                u = ((t * 0.7 + kk / 3) % 1)
                y = lerp(690, 540, u) * SP
                K.arrow(bc, B((372 * SP, y + 40)), B((372 * SP, y - 10)), CORAL, w=th, head=th * 2.2, a=ra * (1 - u))
            K.label(bc, 'less blood back to the heart', 290, 690, CORAL, ra, 32, anchor=tuple(B((395 * SP, 760 * SP))))
        # sensors and the signal to the brainstem
        sa = smooth((t - T['sensors'] + 0.1) / 0.3) * (1 - smooth((t - T['close0']) / 0.3))
        for j, p in enumerate(CAROT + [ARCH]):
            t_on = T['neck'] if j < 2 else T['chest']
            a = sa * smooth((t - t_on + 0.1) / 0.25)
            if a > 0.01:
                ps = B(p)
                pul = 1 + 0.25 * math.sin(t * 8)
                K.glow(bc, ps, 46 * pul * bz, YELLOW, a * 0.8)
                K.ring(bc, ps, 26 * bz, YELLOW, a, 6)
                sig = K.window(t, T['catch'] - 0.1, T['bounces'], 0.2, 0.5)
                if sig > 0.01:
                    st = B(STEM)
                    K.dashed(bc, ps, st, YELLOW, 3, a * sig * 0.6)
                    for kk in range(3):
                        u = (t * 1.6 + kk / 3 + j * 0.2) % 1
                        q = ps + (st - ps) * u
                        bc.drawCircle(*q, 7 * bz, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a * sig)))
        K.label(bc, 'pressure sensors', 250, 1000, YELLOW, K.window(t, T['sensors'] - 0.05, T['speeds'] - 0.1) * da, 34)
        K.label(bc, 'brainstem', *B((215 * SP, 225 * SP)), YELLOW, K.window(t, T['catch'] - 0.05, T['speeds']) * da, 32, anchor=tuple(B(STEM)))
        hra = K.window(t, T['speeds'] - 0.05, T['close0']) * da
        if hra > 0.01:
            K.label(bc, f'heart rate {heart_rate(t):.0f}/min', 830, 925, CORAL, hra, 34)
        # vessels squeeze: inward arrows on the legs
        qa = K.window(t, T['squeeze'] - 0.05, T['close0']) * da
        if qa > 0.01:
            for lx, sgn in ((300 * SP, 1), (470 * SP, -1)):
                for yy_ in (1000 * SP, 1180 * SP):
                    K.arrow(bc, B((lx - 70 * SP * sgn, yy_)), B((lx - 22 * SP * sgn, yy_)), TEAL, w=10, head=24, a=qa)
            K.label(bc, 'vessels squeeze', *(B((560 * SP, 1320 * SP)) - np.array([0, 90])), TEAL, qa, 34)
        # blood pressure trace (card, right of the head; after the poll zone time)
        ta = K.window(t, T['dips'] - 0.4, T['close0'] + 0.1) * da
        if ta > 0.01:
            x0, y0, w, h = 640, 600, 400, 290
            K.card(bc, x0, y0, w, h, ta)
            K.text(bc, 'blood pressure', x0 + 24, y0 + 44, 28, WHITE, ta)
            gx0, gy0, gw, gh = x0 + 24, y0 + 70, w - 48, h - 120
            ny = gy0 + gh * 0.25
            K.dashed(bc, (gx0, ny), (gx0 + gw, ny), TEAL, 3, ta * 0.8)
            K.text(bc, 'normal', gx0 + gw - 92, ny - 10, 22, TEAL, ta)
            K.text(bc, 'seconds after standing: 0 to 30', gx0, y0 + h - 18, 20, WHITE, ta * 0.8)
            umax = 30 * clamp(smooth((t - T['dips'] + 0.4) / 1.4) * 0.35 + 0.65 * smooth((t - T['bounces'] + 0.5) / 1.4))
            path = skia.Path()
            n = 60
            for kk in range(n + 1):
                u = umax * kk / n
                x = gx0 + gw * u / 30
                y = ny + (1 - bp(u)) * gh * 2.2
                path.moveTo(x, y) if kk == 0 else path.lineTo(x, y)
            bc.drawPath(path, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * ta), StrokeWidth=5, Style=skia.Paint.kStroke_Style))
        BS = bs.makeImageSnapshot()
        # ---- compose: lens from his neck, the inset, and back
        surf = skia.Surface(W_, H_); c = surf.getCanvas()
        ns = neck_screen(t, sim[min(int(round(T['lens0'] * 60)), len(sim) - 1)])
        R_full = 2300
        if t < T['lens0']:
            R = 0
        elif t < T['lens1']:
            R = R_full * smooth((t - T['lens0']) / (T['lens1'] - T['lens0'])) ** 1.6
        elif t < T['close0']:
            R = R_full
        else:
            R = R_full * (1 - smooth((t - T['close0']) / (T['close1'] - T['close0']))) ** 1.6
        c.drawImage(KS, 0, 0)
        if R > 1:
            c.save(); p = skia.Path(); p.addCircle(*ns, R); c.clipPath(p, doAntiAlias=True)
            c.drawImage(BS, 0, 0)
            c.restore()
            K.ring(c, ns, R, WHITE, 0.7 * (1 - smooth((R - 1800) / 300)), 6)
        # inset: the kitchen shrinks into a circle in the lower left while the diagram is open
        ia = K.window(t, T['lens1'] - 0.2, T['close0'] + 0.1, 0.4, 0.3)
        if ia > 0.01:
            icx, icy, ir = 200, 1250, 150
            c.save(); p = skia.Path(); p.addCircle(icx, icy, ir); c.clipPath(p, doAntiAlias=True)
            c.translate(icx, icy); c.scale(0.42, 0.42); c.translate(-hip_s[0], -hip_s[1] + 120)
            c.drawImage(KS, 0, 0, K.SMP, skia.Paint(Alphaf=ia))
            c.restore()
            K.ring(c, (icx, icy), ir, WHITE, ia, 6)
        if t >= T['end'] and last_frame is None:
            last_frame = surf.makeImageSnapshot()
        calf_ = (xf @ np.array([*((np.array(rig.joint(W, 'n_sh')) + np.array(rig.joint(W, 'n_ft'))) / 2), 1.0]))[:2]
        K.label(c, 'calf muscles squeeze', 330, 1150, GREEN, K.window(t, T['calves'] - 0.05, T['calves'] + 1.6), 34, anchor=tuple(calf_))
        K.status_pill(c, 'slow', K.window(t, T['rise0'], T['rise0'] + 2.4))
        # the two places in the question: a warm steamy tint for the hot shower, a cold blue tint for the cold room
        a_hot = K.window(t, T['hot'] - 0.05, T['cold'] - 0.15, 0.3, 0.3) * (1 - smooth((t - T['end']) / 0.2))
        a_cold = K.window(t, T['cold'] - 0.05, T['end'], 0.3, 0.3)
        if a_hot > 0.01:
            c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=skia.Color(255, 110, 60, int(55 * a_hot))))
            for j in range(9):
                u = (t * 0.25 + j / 9) % 1
                x = 380 + 340 * ((j * 0.37) % 1) + 30 * math.sin(t * 1.3 + j)
                y = 1350 - 900 * u
                c.drawCircle(x, y, 60 + 50 * u, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(70 * a_hot * math.sin(math.pi * u))),
                             MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30)))
        if a_cold > 0.01:
            c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=skia.Color(90, 160, 255, int(60 * a_cold))))
            sh = skia.GradientShader.MakeRadial(skia.Point(540, 900), 1100, [skia.Color(255, 255, 255, 0), skia.Color(220, 240, 255, int(120 * a_cold))], [0.6, 1.0])
            c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Shader=sh))
        for txt, t0, ychip, colr in (('HOT SHOWER', T['hot'] - 0.05, 660, CORAL), ('COLD ROOM', T['cold'] - 0.05, 790, TEAL)):
            a = smooth((t - t0) / 0.2) * (1 - smooth((t - T['end']) / 0.2))
            if a > 0:
                L.chip(c, txt, 760, ychip, colr, 54, a, scale=0.85 + 0.15 * smooth((t - t0) / 0.18))
        K.layout_pass(c, t, tl, DUR, 'ANATOMY & PHYSIOLOGY  ·  BLOOD PRESSURE', titles, T['end'],
                      [[('Head rush worse after a', WHITE)], [('hot shower ', CORAL), ('or ', WHITE), ('cold room?', TEAL)]], last_frame)
        if fi % 2 == 0:
            g_ = partrig.gap_check(rig, W, xf, (W_, H_), joints, radius, down=1.0)
            if max(g_[j] for j in joints) > 0.02 or g_['components'] > 1:
                gaps += 1
        W_wr.put(fi, surf)
    W_wr.close()
    json.dump(dict(T=T, DUR=DUR, sounds=sounds), open(f'{OUT}/build.json', 'w'), indent=1)
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
