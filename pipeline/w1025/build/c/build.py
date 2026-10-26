"""LevlPrep Short w1025-03-dead-zone (AP Environmental Science, first one). Vertical 1080x1920, 30 fps, skia.

Story: a backyard lawn sloping to a lake under storm clouds (new flat layered Gemini scenes c_lawn2.jpg, and the cut
away c_lake.jpg, c_bloom.jpg, c_buffer.jpg painted in one chat with the same framing). The traced hoodie guy (code drawn,
re-cast as a homeowner) tosses a handful of fertilizer across his lawn (real motion capture CMU 124_12 "Underhand Toss"):
the granules arc out and land on the grass; rain starts, lightning; rain water runs over the lawn as muddy streams
toward the lake. The camera follows the runoff down to the shore and into the cut away: a nutrient plume clouds the water
(nitrogen, phosphorus chips); the algae bloom spreads across the surface (the bloom painting revealed from where the
runoff came in), the light dims; the algae die and sink (brown piles on the bottom), the oxygen meter drops as the
bottom decays, the fish slow down, gasp at the surface and float belly up. EUTROPHICATION. The fix in the same cut
away, now with a strip of wild plants along the shore: the rain's runoff stops in the plants, healthy fish swim, chips
for the three fixes. The question with two chips.

MOTIONS (for the accuracy check):
1 Toss (recorded 124_12, 4.75 to 6.6 s): backswing, underhand swing forward with the right (far) hand, release at
  5.45 s; granules leave the hand with its velocity plus a spread, fly ballistically (g = 9.81 m/s^2 at 1.75 m tall) and
  stay on the grass where they land.
2 Rain: streaks falling at a slant from the storm, splashes on the grass; runoff = shaded water ribbons growing down
  the slope from the fertilized area to the shore, carrying granule specks with them, and staying.
3 Cut away: the runoff enters at the shore; the nutrient plume is a soft drifting volume that spreads and fades into
  the water as it mixes (dissolved nutrients), from the surface down and to the left.
4 Bloom: the green bloom painting is revealed from the shore where nutrients entered, across the surface first, then
  down into the upper water; the sun rays dim.
5 Die off: algae flakes sink and turn brown; the brown piles on the bottom (bloom painting, lower part) appear; the
  dissolved oxygen meter falls from high to very low, the drop starting at the bottom where the dead algae decay.
6 Fish: swim with tail beats while oxygen is high; slow down, rise to the surface gasping (mouth opening), then turn
  belly up and float.
7 Fix: buffer strip painting (same framing): rain runoff reaches the plant strip and soaks in there, the water stays
  clear, healthy fish swim.
"""
import sys, math, json, os
sys.path[:0] = ['/home/claude/w1025']
import numpy as np, skia, cv2
import kit as K
from PIL import Image
from kit import smooth, col, TEAL, YELLOW, CORAL, WHITE, GREEN, lerp, clamp, W_, H_, FPS
import layout as L
sys.path.insert(0, '/home/claude/runner')
sys.modules.pop('model', None)
import model, partrig, perf
import mocap_perf as MP

VID = 'w1025-03-dead-zone'
OUT = f'/home/claude/w1025/out/{VID}'
TOSS = MP.Take('124_12', near='Left')
FIXED = perf.repair(TOSS)
S_PL = 1080 / 768                  # plate px -> world px (all four paintings are 768 x 1376)
PXM = 380.0                        # world px per metre at the man's depth on the lawn (he is 1.75 m)
CS = PXM * 1.75 / 897.0            # rig px -> world px (the runner is 897 rig px tall)
SOLE_W = 1300.0
X0 = 330.0
G = 9.81 * PXM
WATER_Y = 636 * S_PL               # water line in the cut away (world)


def load(name):
    a = K.load_rgb(K.ART + name)
    return cv2.resize(a, (1080, int(a.shape[0] * S_PL)), interpolation=cv2.INTER_CUBIC)


def fish_path(c, x, y, s, flip, tail, mouth, belly_up, a, body=(0xf2, 0xa1, 0x3a), back=(0xd2, 0x6f, 0x26)):
    """A flat two tone fish (body, darker back, tail, fin, eye), facing +x (flip -1 faces -x)."""
    if a <= 0.01:
        return
    c.save(); c.translate(x, y); c.scale(s * flip, s * (-1 if belly_up else 1))
    p = skia.Path()
    p.moveTo(-60, 0); p.cubicTo(-40, -34, 30, -38, 62, -6 + 6 * mouth); p.lineTo(62, 6 - 6 * mouth)
    p.cubicTo(30, 34, -40, 30, -60, 0); p.close()
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(body, 255 * a)))
    c.save(); c.clipPath(p, doAntiAlias=True)
    c.drawOval(skia.Rect(-80, -60, 80, -6), skia.Paint(AntiAlias=True, Color=col(back, 255 * a)))
    c.restore()
    tl = skia.Path(); tl.moveTo(-56, 0); tl.lineTo(-96, -28 + 10 * tail); tl.lineTo(-88, 0); tl.lineTo(-96, 28 + 10 * tail); tl.close()
    c.drawPath(tl, skia.Paint(AntiAlias=True, Color=col(back, 255 * a)))
    fn = skia.Path(); fn.moveTo(-8, 6); fn.lineTo(-30, 24 + 4 * tail); fn.lineTo(6, 16); fn.close()
    c.drawPath(fn, skia.Paint(AntiAlias=True, Color=col(back, 230 * a)))
    if belly_up:
        c.drawLine(36, -14, 46, -4, skia.Paint(AntiAlias=True, Color=col((40, 20, 20), 255 * a), StrokeWidth=3))
        c.drawLine(46, -14, 36, -4, skia.Paint(AntiAlias=True, Color=col((40, 20, 20), 255 * a), StrokeWidth=3))
    else:
        c.drawCircle(40, -9, 6, skia.Paint(AntiAlias=True, Color=col((255, 255, 255), 255 * a)))
        c.drawCircle(41.5, -9, 3, skia.Paint(AntiAlias=True, Color=col((25, 25, 40), 255 * a)))
    # warm rim light on the top edge
    c.drawArc(skia.Rect(-58, -34, 60, 30), 200, 110, False, skia.Paint(AntiAlias=True, Color=col((255, 220, 170), 140 * a),
                                                                      Style=skia.Paint.kStroke_Style, StrokeWidth=3))
    c.restore()


FLOW = [0.0]


def ribbon(c, pts, w0, w1, color, a, hl=True):
    """A shaded water ribbon along a polyline (runoff stream)."""
    if a <= 0.01 or len(pts) < 2:
        return
    pts = np.array(pts, float)
    left, right = [], []
    for i, p in enumerate(pts):
        d = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        d /= np.linalg.norm(d) + 1e-9
        n = np.array([-d[1], d[0]])
        w = lerp(w0, w1, i / (len(pts) - 1))
        left.append(p + n * w); right.append(p - n * w)
    path = skia.Path(); path.moveTo(*left[0])
    for q in left[1:]:
        path.lineTo(*q)
    for q in right[::-1]:
        path.lineTo(*q)
    path.close()
    c.drawPath(path, skia.Paint(AntiAlias=True, Color=col(color, 220 * a)))
    if hl:
        hp = skia.Path(); hp.moveTo(*left[0])
        for q in left[1:]:
            hp.lineTo(*q)
        c.drawPath(hp, skia.Paint(AntiAlias=True, Color=col((215, 232, 236), 170 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=4))
        # flowing sheen: dashes moving downstream along the centre line
        cp = skia.Path(); cp.moveTo(*pts[0])
        for q in pts[1:]:
            cp.lineTo(*q)
        c.drawPath(cp, skia.Paint(AntiAlias=True, Color=col((235, 245, 248), 150 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=max(3, w0 * 0.35),
                                  StrokeCap=skia.Paint.kRound_Cap, PathEffect=skia.DashPathEffect.Make([26, 40], -FLOW[0] * 260)))


def build(vid_out=None, stills=()):
    tl = K.Timeline(VID)
    k = tl.k
    T = {}
    T['rel'] = 0.70
    T['rain'] = 1.15
    T['flash'] = k('hook', 'storm')
    T['run0'] = k('result', 'now') - 0.6
    T['lake'] = k('result', 'lake')
    T['pan0'] = k('result', 'trouble') + 0.1
    T['xf0'] = T['pan0'] + 0.75
    T['xf1'] = T['xf0'] + 0.5
    T['nitro'] = k('chain', 'nitrogen')
    T['phos'] = k('chain', 'phosphorus')
    T['water'] = k('chain', 'water')
    T['algae'] = k('chain', 'algae')
    T['explode'] = k('chain', 'explode')
    T['bloom'] = k('chain', 'bloom')
    T['die'] = k('die', 'die')
    T['sink'] = k('die', 'sink')
    T['bact'] = k('die', 'bacteria')
    T['oxygen'] = k('die', 'oxygen')
    T['fish'] = k('die', 'fish')
    T['suff'] = k('die', 'suffocate')
    T['eutro'] = k('name', 'eutrophication')
    T['fix0'] = tl.span('fix')[0] - 0.25
    T['less'] = k('fix', 'less')
    T['before'] = k('fix', 'before')
    T['strip'] = k('fix', 'strip')
    T['shore'] = k('fix', 'shore')
    T['mowed'] = k('ask', 'mowed')
    T['wild'] = k('ask', 'wild')
    T['end'] = tl.end + 0.45
    DUR = T['end'] + 1.9

    # ---------------- the toss (recorded)
    def tau(t):
        if t < 1.9:
            return 4.75 + t
        return 6.65 + 0.15 * (1 - math.exp(-(t - 1.9) * 0.5))

    def extra(t):
        u = smooth((t - T['rain'] - 0.3) / 0.6)                  # looks up at the rain
        return dict(head=-0.30 * u, spine=0.012 * math.sin(t * 2 * math.pi / 3.4))

    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    clk = {'t': 0.0}
    P = MP.ClampedPerformer(rig, spec, lambda tt: [('a', TOSS, tau(clk['t']), 1.0)], ground_take=TOSS)
    P.extra = lambda tt: extra(clk['t'])
    SOLE = P.ground + model.ANKLE_H
    sim = []
    for i in range(int(min(DUR, T['xf1'] + 0.3) * 60) + 2):
        clk['t'] = i / 60
        W = P.pose(i / 60)
        sim.append(W)

    def to_w(p):
        return np.array([X0 + CS * p[0], SOLE_W + CS * (p[1] - SOLE)])
    # release: far hand position and velocity at the release frame
    i_r = int(T['rel'] * 60)
    h0 = to_w(rig.tail(sim[i_r - 2], 'f_hand')); h1 = to_w(rig.tail(sim[i_r + 2], 'f_hand'))
    v_rel = (h1 - h0) / (4 / 60)
    rng = np.random.default_rng(5)
    grains = []
    for j in range(70):
        v = v_rel * rng.uniform(0.55, 1.0) + np.array([rng.uniform(-60, 140), rng.uniform(-120, 80)])
        land_y = SOLE_W + rng.uniform(-90, 160)
        grains.append(dict(p0=h1 + rng.normal(0, 6, 2), v=v, ly=land_y, t0=T['rel'] + rng.uniform(-0.03, 0.08), r=rng.uniform(3, 5.5)))

    def grain_pos(g, t):
        u = t - g['t0']
        if u < 0:
            return None
        p = g['p0'] + g['v'] * u + np.array([0, 0.5 * G * u * u])
        if p[1] > g['ly']:
            # landed: solve the landing time once
            a_, b_, c_ = 0.5 * G, g['v'][1], g['p0'][1] - g['ly']
            tu = (-b_ + math.sqrt(max(b_ * b_ - 4 * a_ * c_, 0))) / (2 * a_)
            p = g['p0'] + g['v'] * tu + np.array([0, 0.5 * G * tu * tu])
            if t > T['run0']:                                   # washed downhill with the runoff
                q = clamp((t - T['run0'] - (p[0] - 300) / 900) / 2.5)
                p = p + np.array([380, 520]) * q * q
        return p

    # ---------------- plates
    _lw = load('c_lawn2.jpg'); LAWN = K.skimg(_lw)
    EDGE = tuple(int(v) for v in np.asarray(_lw)[900:1900, -6:, :3].reshape(-1, 3).mean(0))   # fill past the painting's right edge
    lake_a, bloom_a, buf_a = load('c_lake.jpg'), load('c_bloom.jpg'), load('c_buffer.jpg')
    LAKE, BUF = K.skimg(lake_a), K.skimg(buf_a)
    PH = lake_a.shape[0]
    yy, xx = np.mgrid[0:PH, 0:1080].astype(np.float32)
    noise = cv2.GaussianBlur(np.random.default_rng(2).random((PH // 8, 1080 // 8)).astype(np.float32), (0, 0), 2)
    noise = cv2.resize(noise, (1080, PH)); noise = (noise - noise.min()) / (noise.max() - noise.min())
    BOT_Y = 1200 * S_PL / 1.0 * 0 + 1590.0                     # world y where the bottom piles start

    def bloom_img(top_u, bot_u):
        """The bloom painting revealed: top_u sweeps from the shore (right) across the surface and down; bot_u reveals
        the dead algae piles on the bottom."""
        d = (1080 - xx) / 1080 * 0.6 + np.clip((yy - WATER_Y) / (BOT_Y - WATER_Y), 0, 1) * 0.6 + noise * 0.25
        m_top = np.clip((top_u * 1.5 - d) / 0.12, 0, 1) * (yy > WATER_Y - 30) * np.clip((BOT_Y + 160 - yy) / 220, 0, 1)
        d2 = noise * 0.6 + (1 - np.clip((yy - BOT_Y) / 300, 0, 1)) * 0.4
        m_bot = np.clip((bot_u * 1.2 - d2) / 0.12, 0, 1) * np.clip((yy - (BOT_Y - 160)) / 220, 0, 1)
        m = np.maximum(m_top, m_bot)
        rgba = np.ascontiguousarray(np.dstack([bloom_a, (m * 255).astype(np.uint8)]))
        keep.append(rgba)
        return skia.Image.fromarray(rgba, colorType=skia.ColorType.kRGBA_8888_ColorType)
    bloom_cache = {}
    keep = []

    def camera(t):
        if t < T['pan0']:
            return 540.0, 960.0, 1.0
        if t < T['xf1']:
            u = smooth((t - T['pan0']) / (T['xf1'] - T['pan0']))
            return lerp(540, 700, u), lerp(960, 1160, u), lerp(1.0, 1.25, u)
        return 540.0, 966.0, 1.0

    # fish: lane y, speed, phase
    fishes = [dict(y=1180, x0=150, sp=70, ph=0.0, s=0.9), dict(y=1330, x0=700, sp=-55, ph=1.3, s=1.05),
              dict(y=1460, x0=420, sp=60, ph=2.1, s=0.8), dict(y=1260, x0=900, sp=-48, ph=0.7, s=0.75)]
    rng2 = np.random.default_rng(9)
    flakes = [dict(x=rng2.uniform(150, 1050), y0=rng2.uniform(WATER_Y + 20, WATER_Y + 160), sp=rng2.uniform(110, 190), r=rng2.uniform(5, 10),
                   t0=rng2.uniform(0, 0.8)) for _ in range(46)]
    bubbles = [dict(x=rng2.uniform(80, 1000), sp=rng2.uniform(70, 130), ph=rng2.uniform(0, 1), r=rng2.uniform(4, 9)) for _ in range(22)]
    rain = [dict(x=rng2.uniform(-200, 1300), ph=rng2.uniform(0, 1), sp=rng2.uniform(1700, 2300), ln=rng2.uniform(40, 80)) for _ in range(150)]
    # runoff streams on the lawn (world coordinates of the lawn plate): from the fertilized grass to the shore
    streams = [[(380, 1330), (520, 1420), (640, 1540), (760, 1660), (880, 1800), (980, 1935)],
               [(560, 1290), (690, 1390), (800, 1500), (900, 1620), (1000, 1750), (1080, 1840)],
               [(250, 1400), (390, 1520), (520, 1650), (640, 1790), (720, 1935)]]

    def stream_pts(st, u):
        st = np.array(st, float)
        seg = np.cumsum(np.r_[0, np.linalg.norm(np.diff(st, axis=0), axis=1)])
        L_ = seg[-1] * clamp(u)
        out = [st[0]]
        for i in range(1, len(st)):
            if seg[i] <= L_:
                out.append(st[i])
            else:
                f = (L_ - seg[i - 1]) / (seg[i] - seg[i - 1]); out.append(st[i - 1] + (st[i] - st[i - 1]) * f); break
        # subdivide for a smooth ribbon with a gentle wobble
        pts = []
        for i in range(len(out) - 1):
            for s_ in np.linspace(0, 1, 6, endpoint=False):
                p = out[i] + (out[i + 1] - out[i]) * s_
                pts.append(p + np.array([6 * math.sin(p[1] * 0.03), 0]))
        pts.append(out[-1])
        return pts

    titles = [
        (0.0, T['lake'] - 0.6, [[('Fertilizer, then', WHITE)], [('A STORM', CORAL)]]),
        (T['lake'] - 0.6, T['nitro'] - 0.3, [[('Now the lake', WHITE)], [('IS IN TROUBLE', CORAL)]]),
        (T['nitro'] - 0.3, T['die'] - 0.2, [[('Nutrients', WHITE)], [('FEED ALGAE', GREEN)]]),
        (T['die'] - 0.2, T['eutro'] - 0.3, [[('Algae die,', WHITE)], [('OXYGEN CRASHES', CORAL)]]),
        (T['eutro'] - 0.3, T['fix0'], [[('This is', WHITE)], [('EUTROPHICATION', YELLOW)]]),
        (T['fix0'], tl.span('ask')[0] - 0.1, [[('The fix: a', WHITE)], [('PLANT STRIP', GREEN)]]),
        (tl.span('ask')[0] - 0.1, T['end'], [[('Which one', WHITE)], [('SAVES THE FISH?', TEAL)]]),
    ]
    sounds = []

    def snd(name, t, g):
        sounds.append((name, round(t, 3), g))
    snd('cloth_real', 0.2, 0.4); snd('swish', T['rel'], 0.4); snd('pat', T['rel'] + 0.45, 0.25)
    snd('thunder_real', T['flash'] - 0.05, 0.7); snd('water_pour_real', T['run0'], 0.35); snd('whoosh_real', T['pan0'], 0.45)
    snd('splash_real', T['xf0'], 0.45); snd('pop', T['nitro'], 0.3); snd('pop', T['phos'], 0.3); snd('bubbling_real', T['explode'], 0.35)
    snd('swish', T['sink'], 0.35); snd('riser', T['bact'], 0.35); snd('wrong', T['suff'], 0.35); snd('shimmer', T['eutro'], 0.4)
    snd('whoosh_real', T['fix0'], 0.4); snd('pop', T['less'], 0.3); snd('pop', T['before'], 0.3); snd('ding', T['strip'], 0.35)
    snd('pat', T['mowed'], 0.45); snd('pat', T['wild'], 0.45)
    beds = [('rain_real', -24, T['rain'], T['xf0'] + 0.4), ('underwater_real', -27, T['xf0'], T['fix0'] + 0.2),
            ('rain_real', -31, T['fix0'], T['end'] + 1), ('underwater_real', -32, T['fix0'], DUR)]

    LIQD = '/home/claude/w1025/c/liq/lawn'
    LIQN = len([f for f in os.listdir(LIQD) if f.endswith('.png')])
    _lc = {}
    def liq_img(i):
        if i not in _lc:
            _lc.clear(); _lc[i] = K.skimg(np.array(Image.open(f'{LIQD}/{i:04d}.png').convert('RGBA')))
        return _lc[i]
    blinks = (0.4, 2.9, 4.3)
    W_wr = K.Writer(vid_out, stills, OUT)
    frames = int(DUR * FPS)
    last_frame = None
    gaps = 0
    for fi in range(frames):
        t = fi / FPS
        if os.environ.get('ONLY') and fi not in W_wr.stills:
            continue
        cx, cy, z = camera(t)
        mow = K.window(t, T['mowed'] - 0.15, T['wild'] - 0.3, 0.3, 0.3)   # the question: the mowed shore is the dead lake
        surf = skia.Surface(W_, H_); c = surf.getCanvas()
        c.clear(skia.Color(*EDGE))
        lawn_a = 1 - smooth((t - T['xf0']) / (T['xf1'] - T['xf0']))
        c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
        if lawn_a > 0.01:
            c.drawImage(LAWN, 0, 0, K.SMP)
            # storm darkening over the sky, a lightning flash
            dk = smooth((t - 0.3) / 1.4)
            c.drawRect(skia.Rect(0, 0, 1080, 1935), skia.Paint(Color=skia.Color(20, 30, 60, int(70 * dk))))
            fl = math.exp(-max(0, t - T['flash']) * 9) * (t >= T['flash'])
            if fl > 0.01:
                c.drawRect(skia.Rect(0, 0, 1080, 1935), skia.Paint(Color=skia.Color(230, 240, 255, int(120 * fl))))
                bolt = skia.Path(); pts_ = [(840, 120), (800, 230), (850, 250), (760, 400), (800, 410), (720, 560)]
                bolt.moveTo(*pts_[0])
                for q_ in pts_[1:]:
                    bolt.lineTo(*q_)
                for wd_, al_ in ((26, 0.35), (9, 1.0)):
                    c.drawPath(bolt, skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=wd_, StrokeJoin=skia.Paint.kRound_Join,
                                                Color=skia.Color(255, 255, 230, int(255 * al_ * min(1, fl * 1.6))),
                                                MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6) if wd_ > 10 else None))
            # runoff streams over the grass
            # runoff from the studio liquid sim (liq.py 'lawn'), frames in world coordinates
            if t >= T['run0']:
                li = min(int((t - T['run0']) * 30), LIQN - 1)
                c.drawImage(liq_img(li), 0, 0, K.SMP, skia.Paint(ColorFilter=skia.ColorFilters.Blend(skia.Color(205, 175, 120), skia.BlendMode.kModulate)))
            # grains
            for g in grains:
                p = grain_pos(g, t)
                if p is not None:
                    c.drawCircle(p[0], p[1], g['r'], skia.Paint(AntiAlias=True, Color=skia.Color(236, 240, 228, 255)))
                    c.drawCircle(p[0] + g['r'] * 0.3, p[1] + g['r'] * 0.3, g['r'] * 0.55, skia.Paint(AntiAlias=True, Color=skia.Color(150, 190, 200, 255)))
        c.restore()
        if lawn_a > 0.01 and t < T['xf1']:
            i = min(int(round(t * 60)), len(sim) - 1)
            W = sim[i]
            rig.blink = 1.0 if any(b <= t < b + 0.12 for b in blinks) else 0.0
            a_ = z * CS
            xf = np.array([[a_, 0, z * (X0 - cx) + 540], [0, a_, z * (SOLE_W - CS * SOLE - cy) + 960], [0, 0, 1.0]])
            hip_s = (xf @ np.array([*rig.joint(W, 'body'), 1.0]))[:2]
            gy = z * (SOLE_W - cy) + 960
            K.contact_shadow(c, hip_s[0] + 10 * z, gy, 110 * z * CS / 0.72, 12 * z, 0.28)
            c.saveLayer(None, skia.Paint(Alphaf=lawn_a))
            rig.draw(c, W, xf)
            c.restore()
            if i % 2 == 0:
                g_ = partrig.gap_check(rig, W, xf, (W_, H_), joints, radius, down=1.0)
                if max(g_[j] for j in joints) > 0.02 or g_['components'] > 1:
                    gaps += 1
        # ---- the cut away
        if t >= T['xf0']:
            ca = smooth((t - T['xf0']) / (T['xf1'] - T['xf0']))
            fixa = smooth((t - T['fix0']) / 0.5) * (1 - mow)
            c.saveLayer(None, skia.Paint(Alphaf=ca))
            c.save(); zc = lerp(1.18, 1.0, smooth((t - T['xf0']) / 1.2)); c.translate(540, 960); c.scale(zc, zc); c.translate(-540, -966)
            c.drawImage(LAKE, 0, 0, K.SMP)
            top_u = smooth((t - T['explode'] + 0.3) / 1.8)
            bot_u = smooth((t - T['sink']) / 2.0)
            key = (round(top_u, 2), round(bot_u, 2))
            if top_u > 0.005 or bot_u > 0.005:
                if key not in bloom_cache:
                    bloom_cache.clear(); del keep[:-1]; bloom_cache[key] = bloom_img(*key)
                c.drawImage(bloom_cache[key], 0, 0, K.SMP)
            # nutrient plume: soft drifting volume from the shore, mixing into the water
            pa = smooth((t - T['xf1'] + 0.2) / 0.6) * (1 - smooth((t - T['explode'] - 0.6) / 1.2))
            if pa > 0.01:
                for j in range(9):
                    u = (t - T['xf1'] + j * 0.25)
                    px = 880 - 70 * u - 40 * j + 25 * math.sin(t * 1.3 + j)
                    py = WATER_Y + 40 + 55 * u + 18 * j
                    rr = 70 + 30 * u + 10 * j
                    sh = skia.GradientShader.MakeRadial(skia.Point(px, py), rr, [skia.Color(150, 140, 70, int(110 * pa)), skia.Color(150, 140, 70, 0)])
                    c.drawCircle(px, py, rr, skia.Paint(Shader=sh))
            # oxygen bubbles from the plants while there is oxygen
            ox = 1 - smooth((t - T['bact'] + 0.6) / 1.0) * (1 - fixa)
            for b in bubbles:
                u = (t * b['sp'] / 600 + b['ph']) % 1
                x = b['x'] + 10 * math.sin(t * 2 + b['ph'] * 6)
                y = lerp(1800, WATER_Y + 20, u)
                c.drawCircle(x, y, b['r'], skia.Paint(AntiAlias=True, Color=skia.Color(225, 245, 255, int(130 * ox)), Style=skia.Paint.kStroke_Style, StrokeWidth=2.5))
            # algae flakes sinking and browning
            fa_ = K.window(t, T['die'] - 0.2, T['fix0'], 0.3, 0.4)
            if fa_ > 0.01:
                for f in flakes:
                    u = max(0.0, t - T['die'] - f['t0'])
                    y = min(f['y0'] + f['sp'] * u, BOT_Y + 40)
                    br = clamp(u / 2.5)
                    cc = (int(lerp(110, 120, br)), int(lerp(170, 90, br)), int(lerp(60, 40, br)))
                    c.drawOval(skia.Rect(f['x'] - f['r'] * 1.4 + 6 * math.sin(t * 3 + f['x']), y - f['r'] * 0.7, f['x'] + f['r'] * 1.4, y + f['r'] * 0.7),
                               skia.Paint(AntiAlias=True, Color=skia.Color(*cc, int(230 * fa_))))
            # fish
            for j, f in enumerate(fishes):
                if t >= T['fix0']:
                    break
                sick = smooth((t - T['oxygen']) / 1.2)
                dead = smooth((t - T['fish'] - 0.15 * j) / 0.7)
                sp = f['sp'] * (1 - 0.8 * sick)
                x = f['x0'] + sp * (t - T['xf0']) * (1 - 0.6 * sick)
                x = 80 + (x - 80) % 920
                y = lerp(f['y'], WATER_Y + 60 + 15 * j, smooth((t - T['oxygen'] - 0.3) / 1.4))
                y += 10 * math.sin(t * 1.5 + f['ph'])
                y = lerp(y, WATER_Y + 22, dead)
                tail = math.sin(t * (9 - 7 * sick) + f['ph']) * (1 - dead)
                mouth = (0.5 + 0.5 * math.sin(t * 7 + j)) * K.window(t, T['oxygen'] + 0.6, T['fish'] + 0.3)
                fish_path(c, x, y, f['s'], 1 if f['sp'] > 0 else -1, tail, mouth, dead > 0.5, 1.0)
            c.restore()
            c.restore()
            # sun rays dimming under the bloom: a dark green wash over the deep water
            dim = smooth((t - T['bloom']) / 1.5) * (1 - fixa)
            if dim > 0.01:
                sh = skia.GradientShader.MakeLinear([skia.Point(0, WATER_Y), skia.Point(0, 1935)], [skia.Color(10, 40, 20, 0), skia.Color(10, 40, 20, int(110 * dim))])
                c.drawRect(skia.Rect(0, WATER_Y, 1080, 1935), skia.Paint(Shader=sh))
        # ---- the fix scene (buffer strip), cross faded in
        if t >= T['fix0']:
            fx = smooth((t - T['fix0']) / 0.5) * (1 - mow)
            c.saveLayer(None, skia.Paint(Alphaf=fx))
            c.drawImage(BUF, 0, -6, K.SMP)
            # rain runoff reaching the plant strip and stopping in it
            u = smooth((t - T['fix0'] - 0.3) / 1.5)
            for st in ([(150, 830), (260, 845), (380, 858), (470, 866)], [(60, 855), (200, 862), (330, 872), (430, 880)]):
                FLOW[0] = t; ribbon(c, stream_pts(st, u), 5, 11, (0x86, 0x9c, 0x8a), 0.9)
            for j, f in enumerate(fishes):
                x = 80 + (f['x0'] + f['sp'] * (t - T['fix0'])) % 920
                y = f['y'] + 10 * math.sin(t * 1.5 + f['ph'])
                fish_path(c, x, y, f['s'], 1 if f['sp'] > 0 else -1, math.sin(t * 9 + f['ph']), 0, False, 1.0)
            c.restore()
        # ---- rain (in front of everything outdoors)
        ra = smooth((t - T['rain']) / 0.5) * (1 - smooth((t - T['xf0']) / 0.4)) + 0.5 * smooth((t - T['fix0'] - 0.2) / 0.5)
        if ra > 0.01:
            for r in rain:
                u = (t * r['sp'] / 2000 + r['ph']) % 1
                y = -100 + u * (2100 if t < T['xf0'] else WATER_Y + 100)
                x = r['x'] - 0.25 * y
                c.drawLine(x, y, x - 0.25 * r['ln'], y + r['ln'], skia.Paint(AntiAlias=True, Color=skia.Color(210, 225, 245, int(120 * ra)), StrokeWidth=2.5))
        if t >= T['end'] and last_frame is None:
            last_frame = surf.makeImageSnapshot()
        # ---- labels and meters
        K.label(c, 'fertilizer', 880, 1260, YELLOW, K.window(t, T['rel'] + 0.2, T['run0'] + 0.4), 36)
        K.label(c, 'runoff', 640, 1250, TEAL, K.window(t, T['run0'] + 0.5, T['pan0'] + 0.2), 36)
        K.label(c, 'nitrogen', 770, 1010, YELLOW, K.window(t, T['nitro'] - 0.05, T['explode']), 36)
        K.label(c, 'phosphorus', 640, 1110, YELLOW, K.window(t, T['phos'] - 0.05, T['explode']), 36)
        K.label(c, 'algae bloom', 540, WATER_Y - 70, GREEN, K.window(t, T['bloom'] - 0.1, T['die'] + 0.4), 38)
        K.label(c, 'dead algae sink', 300, 1300, (0xd0, 0x9a, 0x60), K.window(t, T['sink'] + 0.4, T['eutro'] - 0.1), 34, anchor=(380, 1600))
        K.label(c, 'bacteria use up O₂', 700, 1220, CORAL, K.window(t, T['bact'] - 0.05, T['eutro'] - 0.1), 34)
        o2 = 0.9 if t < T['bact'] else lerp(0.9, 0.08, smooth((t - T['bact']) / (T['oxygen'] - T['bact'] + 1.2)))
        o2 = lerp(o2, 0.9, smooth((t - T['strip'] - 0.2) / 1.2) * (1 - mow))
        K.meter(c, 900, 600, 150, 340, o2, K.window(t, T['nitro'], tl.span('ask')[0] - 0.2), 'OXYGEN', colr_lo=CORAL, colr_hi=GREEN)
        a_dz = K.window(t, T['eutro'] + 0.3, T['fix0'])
        K.label(c, 'DEAD ZONE', 540, 1300, CORAL, a_dz, 58)
        K.label(c, 'use less fertilizer', 560, 480, WHITE, K.window(t, T['less'] - 0.05, tl.span('ask')[0] - 0.1), 36)
        K.label(c, 'not before rain', 560, 550, WHITE, K.window(t, T['before'] - 0.05, tl.span('ask')[0] - 0.1), 36)
        a_s = K.window(t, T['strip'] - 0.05, tl.span('ask')[0] - 0.1)
        if a_s > 0.01:
            K.ring(c, (430, 830), 100 * (1 + 0.1 * math.sin(t * 5)), GREEN, a_s, 7)
            K.label(c, 'plant strip catches the runoff', 420, 1070, GREEN, a_s, 32)
        for txt, t0, ychip, colr in (('MOWED TO THE WATER', T['mowed'] - 0.05, 650, CORAL), ('WILD PLANT STRIP', T['wild'] - 0.05, 780, GREEN)):
            a = smooth((t - t0) / 0.2) * (1 - smooth((t - T['end']) / 0.2))
            if txt.startswith('MOWED'):
                a *= 1 - smooth((t - T['wild'] + 0.35) / 0.25)      # each chip only over its own shore
            if a > 0:
                L.chip(c, txt, 640, 560, colr, 50, a, scale=0.85 + 0.15 * smooth((t - t0) / 0.18))
        K.layout_pass(c, t, tl, DUR, 'AP ENV SCIENCE  ·  WATER POLLUTION', titles, T['end'],
                      [[('Mowed lawn or', WHITE)], [('a plant strip?', GREEN)]], last_frame)
        W_wr.put(fi, surf)
    W_wr.close()
    json.dump(dict(T=T, DUR=DUR, sounds=sounds, beds=beds), open(f'{OUT}/build.json', 'w'), indent=1)
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
