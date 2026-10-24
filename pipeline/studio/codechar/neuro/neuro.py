"""Brain to foot: a motor signal from the motor cortex to the calf, inside the traced paramedic (Short, 1080x1920).

Science (checked against standard neuroanatomy):
  - the leg and foot area of the primary motor cortex sits at the top of the brain, just in front of the
    central sulcus; the upper motor neuron runs down the brainstem and spinal cord (corticospinal tract)
  - the spinal cord ends around the L1 vertebra (above the belt line); the lower motor neurons for the calf
    sit in the lower cord and their axons leave as roots (cauda equina) that join the sciatic nerve, which runs
    behind the hip and down the back of the thigh
  - above the knee the sciatic splits: the tibial nerve runs down the back of the calf (it drives the calf
    muscles), the common fibular nerve wraps around the outside of the knee to the front of the shin
  - motor axons are myelinated, so the signal jumps from node to node (saltatory conduction)
  - real time from cortex to calf muscle is roughly 30 ms (about 1/30 of a second); shown slowed down
"""
import sys, math, subprocess, json
import numpy as np, skia
from PIL import Image
sys.path.insert(0, '/home/claude/rig'); sys.path.insert(0, '/home/claude/trace')
import acting, partrig, model
sys.path.insert(0, '/home/claude/mocap')
import mocap_perf as MP
IDLE = MP.Take('82_08', near='Left')
WALK = MP.Take('104_19', near='Right')


def mplan(t):
    """Real motion: standing (82_08), then a walk start (104_19) whose near calf pushes off as the signal arrives."""
    w = MP.xfade(t, 6.2, 6.6)
    return [('idle', IDLE, 1.0 + t, 1 - w), ('walk', WALK, 0.85 + (t - 6.2), w)]

from acting import Track, ease_io

FPS, DUR = 60, 9.2
W_, H_ = 1080, 1920
TEAL, VIOLET, YELLOW, CORAL, NAVY = (0x2e, 0xe6, 0xd6), (0x9b, 0x7b, 0xff), (0xff, 0xd2, 0x3f), (0xff, 0x6b, 0x6b), (0x08, 0x14, 0x28)
FONT = skia.Typeface.MakeFromFile('/usr/share/fonts/opentype/inter/Inter-Black.otf')


def col(c, a=255):
    return skia.Color(c[0], c[1], c[2], int(max(0, min(255, a))))


def smooth(u):
    u = min(max(u, 0.0), 1.0); return u * u * (3 - 2 * u)


def win(t, a, b, fade=0.25):
    """1 inside [a,b], eased fade in and out."""
    return smooth((t - a) / fade) * smooth((b - t) / fade)


# ---------------------------------------------------------------- brain (painted, from the library)
BRAIN = np.array(Image.open('/home/claude/neuro/brain.png'))
BRAIN_IMG = skia.Image.fromarray(BRAIN, colorType=skia.ColorType.kRGBA_8888_ColorType, alphaType=skia.AlphaType.kUnpremul_AlphaType)
BS = 0.176                                        # crop px -> char px
BRAIN_O = np.array([-44.0, -466.0]) - BS * np.array([29.0, 30.0])
def brain_pt(px, py):
    return (BRAIN_O + BS * np.array([px, py])).tolist()
MOTOR = brain_pt(395, 72)                        # leg area of the motor cortex (top, in front of the central sulcus)

# ---------------------------------------------------------------- nerve paths (bone, rest char point)
UPPER = [('head', MOTOR), ('head', brain_pt(372, 190)), ('head', brain_pt(320, 380)), ('head', brain_pt(288, 520)),
         ('head', brain_pt(284, 600)), ('head', (-4, -350)), ('head', (-10, -330)),
         ('body', (-16, -316)), ('body', (-32, -290)), ('body', (-50, -245)), ('body', (-60, -185)),
         ('body', (-57, -125)), ('body', (-52, -80))]                       # cord ends about L1
LOWER = [('body', (-52, -80)), ('body', (-55, -35)), ('body', (-52, 8)), ('body', (-36, 44)),
         ('n_th', (-27, 64)), ('n_th', (-22, 130)), ('n_th', (-16, 196)), ('n_th', (-13, 226)),     # sciatic
         ('n_sh', (-13, 252)), ('n_sh', (-17, 318)), ('n_sh', (-13, 392)), ('n_sh', (-5, 446)),      # tibial
         ('n_ft', (14, 486)), ('n_ft', (48, 494)), ('n_ft', (86, 492))]
FIBULAR = [('n_th', (-13, 214)), ('n_sh', (2, 262)), ('n_sh', (22, 290)), ('n_sh', (27, 350)),
           ('n_sh', (23, 432)), ('n_ft', (50, 470))]
SPLIT_I = 7          # index in LOWER where the sciatic splits (above the knee)


def mapped(rig, W, xf, pts):
    out = []
    for bone, p in pts:
        m = model.compose(xf[:2], rig.bm(W, bone))
        out.append(m @ np.array([p[0], p[1], 1.0]))
    return out


def catmull(P, n=10):
    P = [np.array(p) for p in P]
    Q = []
    for i in range(len(P) - 1):
        p0, p1, p2 = P[max(i - 1, 0)], P[i], P[i + 1]
        p3 = P[min(i + 2, len(P) - 1)]
        for k in range(n):
            t = k / n
            Q.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                            (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    Q.append(P[-1])
    return np.array(Q)


def polypath(Q):
    p = skia.Path(); p.moveTo(*Q[0])
    for q in Q[1:]:
        p.lineTo(*q)
    return p


def arclen(Q):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(Q, axis=0), axis=1))]
    return d


def at(Q, d, s):
    s = min(max(s, 0), d[-1]); i = int(np.searchsorted(d, s) - 1); i = max(0, min(i, len(Q) - 2))
    f = (s - d[i]) / max(d[i + 1] - d[i], 1e-9)
    return Q[i] + (Q[i + 1] - Q[i]) * f


def sub(Q, d, s0, s1):
    i0, i1 = np.searchsorted(d, s0), np.searchsorted(d, s1)
    return np.vstack([at(Q, d, s0)[None], Q[i0:i1], at(Q, d, s1)[None]])


# ---------------------------------------------------------------- performance
def script(t, P):
    c = acting.script(min(t, 0.5), P)                   # idle arms and posture from the shared performance
    sway = math.sin(2 * math.pi * t / 4.3)
    c["near_arm"] = (0.05 + 0.02 * sway, 0.16, 0.0)
    c["far_arm"] = (-0.04 - 0.02 * sway, 0.16, 0.0)
    c["lean"] = 0.02 + Track([(0, 0), (6.9, 0), (7.4, 0.05, "io")])(t)
    c["head"] = 0.012 * sway
    c["near_heel"] = Track([(0, 0), (6.95, 0), (7.35, 0.42, "out"), (7.7, 0.30, "io")])(t)
    ww = Track([(0, 0), (7.55, 0), (8.4, 1.0, "io")])(t)
    c["walk"] = ww
    if ww > 0:
        ph = 2 * math.pi * P.p; sw = 0.42 * ww
        c["near_arm"] = (c["near_arm"][0] * (1 - ww) + sw * math.cos(ph + math.pi), 0.16, 0.0)
        c["far_arm"] = (c["far_arm"][0] * (1 - ww) + sw * math.cos(ph), 0.16 + 0.2 * ww * max(0, math.cos(ph)), 0.0)
    return c


# ---------------------------------------------------------------- drawing helpers
def glow_stroke(c, path, color, w, a, glow=10):
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap,
                   StrokeJoin=skia.Paint.kRound_Join)
    p.setStrokeWidth(w * 2.6); p.setColor(col(color, a * 0.45))
    p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, glow)); c.drawPath(path, p)
    q = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap,
                   StrokeJoin=skia.Paint.kRound_Join, StrokeWidth=w, Color=col(color, a))
    c.drawPath(path, q)


def dot(c, xy, r, color, a, blur=0):
    p = skia.Paint(AntiAlias=True, Color=col(color, a))
    if blur: p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    c.drawCircle(float(xy[0]), float(xy[1]), r, p)


def label(c, text, anchor, a, side=1, dy=-10):
    """House caption pill (Inter Black, dark box) with a short leader to the point."""
    if a <= 0.01: return
    f = skia.Font(FONT, 44)
    w = f.measureText(text)
    side = -1 if anchor[0] > W_ * 0.55 else 1
    x = anchor[0] + side * 70 - (0 if side > 0 else w + 56)
    x = min(max(x, 24), W_ - w - 80)
    y = anchor[1] + dy - 6 * (1 - a)
    box = skia.RRect.MakeRectXY(skia.Rect(x, y - 44, x + w + 56, y + 30), 22, 22)
    c.drawRRect(box, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(220 * a))))
    lead = skia.Paint(AntiAlias=True, Color=col(TEAL, 230 * a), StrokeWidth=4, Style=skia.Paint.kStroke_Style)
    ex = x if side > 0 else x + w + 56
    c.drawLine(float(anchor[0]), float(anchor[1]), ex, y - 7, lead)
    dot(c, anchor, 8, TEAL, 255 * a)
    c.drawString(text, x + 28, y + 9, f, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(255 * a))))


def caption(c, text, a, y=210, size=58, color=(255, 255, 255)):
    if a <= 0.01: return
    f = skia.Font(FONT, size)
    w = f.measureText(text)
    x = (W_ - w) / 2
    box = skia.RRect.MakeRectXY(skia.Rect(x - 34, y - size - 10, x + w + 34, y + 28), 26, 26)
    c.drawRRect(box, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(220 * a))))
    c.drawString(text, x, y, f, skia.Paint(AntiAlias=True, Color=col(color, 255 * a)))


# ---------------------------------------------------------------- render
def main(out='/home/claude/neuro/brain_to_foot.mp4', stills=()):
    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    P = MP.MocapPerformer(rig, spec, mplan, ground_take=WALK)
    bg = skia.Image.fromarray(np.array(Image.open('/tmp/m/characters/style_b/w1021/v2_park_bg.png').convert('RGBA').resize((W_, H_), Image.LANCZOS)),
                              colorType=skia.ColorType.kRGBA_8888_ColorType)
    rng = np.random.default_rng(3)
    stars = rng.uniform([0, 0], [W_, H_ * 0.7], (70, 2)); star_r = rng.uniform(1, 2.6, 70)
    proc = None
    if out:
        proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W_}x{H_}',
                                 '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17',
                                 '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    gaps = 0
    main.freeze = None; main.cut_done = False
    burst = rng.normal(0, 1, (26, 2))
    for i in range(int(DUR * FPS)):
        t = i / FPS
        W = P.pose(t)
        rig.blink = 1.0 if any(b <= t < b + 5 / 60 for b in (0.7, 5.6, 9.1)) else 0.0
        X = smooth((t - 1.3) / 0.8) * (1 - smooth((t - 7.55) / 0.7))           # x-ray amount
        # signal positions in char space (for the camera)
        I3 = np.eye(3)
        upc = catmull(mapped(rig, W, I3, UPPER)); loc = catmull(mapped(rig, W, I3, LOWER))
        duc, dlc = arclen(upc), arclen(loc)
        brain_c = np.array(model.compose(np.eye(3)[:2], rig.bm(W, 'head')) @ np.array([*brain_pt(360, 260), 1.0]))
        FULL = (271.0, -266.7, 1.07); CALF = (P.x + 60.0, 17.0, 1.25)   # she starts on the left third
        if t < 1.3: want = FULL
        elif t < 2.1:
            k = ease_io((t - 1.3) / 0.8); hd = (brain_c[0], brain_c[1] + 30, 2.3)
            want = tuple(FULL[j] + (hd[j] - FULL[j]) * k for j in range(3))
        elif t < 2.85: want = (brain_c[0], brain_c[1] + 30, 2.3)
        elif t < 4.85:
            sp = at(upc, duc, ease_io(min(1, (t - 2.85) / 1.5)) * duc[-1]); want = (sp[0] - 20, sp[1] + 60, 1.9)
        elif t < 6.95:
            sp = at(loc, dlc, min(1, (t - 4.85) / 2.1) * dlc[-1]); want = (sp[0] - 10, sp[1] + 40, 2.05)
        elif t < 7.55: want = CALF
        else:                                   # hard cut (while dark) to the wide park shot, her on the left third
            if main.freeze is None:
                main.freeze = P.x + (540 - 170) / 1.07
            want = (main.freeze, FULL[1], FULL[2])
        if i == 0: cam = np.array(FULL, float)
        rate = 0.09 if t < 7.6 else 0.06
        cam = cam + (np.array(want, float) - cam) * rate
        if t >= 7.55 and not getattr(main, 'cut_done', False):
            cam = np.array(want, float); main.cut_done = True
        tx, ty, zoom = cam
        xf = np.array([[zoom, 0, 540 - zoom * tx], [0, zoom, 1000 - zoom * ty], [0, 0, 1.0]])
        surf = skia.Surface(W_, H_); cv = surf.getCanvas()
        cv.drawImage(bg, 0, 0)
        if X > 0:
            cv.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=col(NAVY, 222 * X)))
            for (sx, sy), r in zip(stars, star_r):
                tw = 0.55 + 0.45 * math.sin(t * 2.3 + sx)
                dot(cv, (sx, sy), r, (255, 255, 255), 150 * X * tw)
        # contact shadow
        hip = xf @ np.array([*rig.joint(W, 'body'), 1])
        gy = xf[1, 2] + xf[1, 1] * (P.ground + model.ANKLE_H)
        cv.drawOval(skia.Rect(hip[0] - 160 * zoom, gy - 16, hip[0] + 160 * zoom, gy + 14),
                    skia.Paint(AntiAlias=True, Color=skia.Color(10, 30, 10, int(70 * (1 - X))),
                               MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10)))
        rig.draw(cv, W, xf)
        M = xf[:2]
        if X > 0:
            S = rig.shapes(W, M)
            # x-ray body: dark translucent, teal edge (pixel layers: exact silhouette, no boolean ops)
            rig.silhouette_fill(cv, S, skia.Color(14, 24, 62), alpha=205 / 255 * X)
            rig.silhouette_edge(cv, S, col(TEAL), width=3.0, alpha=140 / 255 * X)
            # brain inside the skull
            mb = model.compose(M, rig.bm(W, 'head'))
            cv.save(); cv.clipPath(S['head'][0][0], doAntiAlias=True)
            m3 = skia.Matrix().setAll(float(mb[0, 0] * BS), float(mb[0, 1] * BS), float(mb[0, 0] * BRAIN_O[0] + mb[0, 1] * BRAIN_O[1] + mb[0, 2]),
                                      float(mb[1, 0] * BS), float(mb[1, 1] * BS), float(mb[1, 0] * BRAIN_O[0] + mb[1, 1] * BRAIN_O[1] + mb[1, 2]),
                                      0, 0, 1)
            cv.save(); cv.concat(m3)
            cv.drawImage(BRAIN_IMG, 0, 0, skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear),
                         skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(255 * X))))
            cv.restore(); cv.restore()
            # nerves
            up = catmull(mapped(rig, W, xf, UPPER)); lo = catmull(mapped(rig, W, xf, LOWER)); fib = catmull(mapped(rig, W, xf, FIBULAR))
            du, dl = arclen(up), arclen(lo)
            glow_stroke(cv, polypath(fib), VIOLET, 4.5 * zoom, 150 * X, glow=8)
            glow_stroke(cv, polypath(up), VIOLET, 6 * zoom, 210 * X)
            glow_stroke(cv, polypath(lo), VIOLET, 6 * zoom, 210 * X)
            # myelin sheath along the motor axon below the cord: segments with small gaps (nodes of Ranvier)
            node = 30 * zoom
            s_my0 = dl[np.searchsorted(dl, 0) ] + 40 * zoom
            nodes = np.arange(s_my0, dl[-1] - 20 * zoom, node)
            seg = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap,
                             StrokeWidth=11 * zoom, Color=skia.Color(242, 181, 107, int(215 * X)))
            for s0 in nodes[:-1]:
                cv.drawPath(polypath(sub(lo, dl, s0 + 3.5 * zoom, s0 + node - 3.5 * zoom)), seg)
            # calf muscle (gastrocnemius): lens behind the shin, contracts when the signal arrives
            con = smooth((t - 6.85) / 0.25) * (1 - smooth((t - 7.75) / 0.4))
            ms = model.compose(M, rig.bm(W, 'n_sh'))
            ln, hh = 62 * (1 - 0.1 * con), 21 * (1 + 0.18 * con)
            cen = np.array([-19, 322 - 6 * con])
            mp = skia.Path()
            pts = [cen + (0, -ln), cen + (hh * 1.1, -ln * 0.3), cen + (hh * 0.7, ln * 0.6), cen + (0, ln),
                   cen + (-hh * 0.9, ln * 0.4), cen + (-hh, -ln * 0.45)]
            mp = model.smooth_closed([tuple(p) for p in pts], ms)
            mc = tuple(int(a + (b - a) * con) for a, b in zip((150, 70, 110), CORAL))
            cv.drawPath(mp, skia.Paint(AntiAlias=True, Color=col(mc, 190 * X)))
            if con > 0:
                cv.drawPath(mp, skia.Paint(AntiAlias=True, Color=col(CORAL, 160 * con * X),
                                           MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14)))
            # motor cortex lights up
            mcx = up[0]
            fire = win(t, 2.1, 3.1, 0.25)
            if fire > 0:
                pul = 0.6 + 0.4 * math.sin(2 * math.pi * 3 * (t - 2.1))
                dot(cv, mcx, 34 * zoom * (0.8 + 0.2 * pul), YELLOW, 170 * fire * X, blur=16)
                dot(cv, mcx, 9 * zoom, (255, 255, 255), 255 * fire * X)
            # the signal
            if 2.85 <= t < 4.35:                                     # down the brainstem and cord (continuous)
                u = ease_io((t - 2.85) / 1.5); s = u * du[-1]
                tr = sub(up, du, max(0, s - 140 * zoom), s)
                glow_stroke(cv, polypath(tr), YELLOW, 7 * zoom, 230 * X, glow=12)
                dot(cv, at(up, du, s), 13 * zoom, YELLOW, 255 * X, blur=10); dot(cv, at(up, du, s), 7 * zoom, (255, 255, 255), 255 * X)
            if 4.3 <= t < 4.95:                                      # synapse onto the lower motor neuron
                k = (t - 4.3) / 0.65
                p0 = up[-1]
                dot(cv, p0, (20 + 30 * k) * zoom, YELLOW, 200 * (1 - k) * X, blur=14)
                for b in burst:
                    q = p0 + b * 22 * zoom * k
                    dot(cv, q, 3.2 * zoom, (255, 236, 160), 230 * (1 - k) * X)
            if 4.85 <= t < 6.95:                                     # down the sciatic and tibial: node to node
                u = (t - 4.85) / 2.1
                s_lin = u * dl[-1]
                if s_lin < nodes[0]:
                    s = s_lin
                else:
                    kf = (s_lin - nodes[0]) / node; k = math.floor(kf); f = kf - k
                    s = nodes[0] + node * (k + smooth((f - 0.35) / 0.65) ** 1.6)
                s = min(s, dl[-1])
                tr = sub(lo, dl, max(0, s - 70 * zoom), s)
                glow_stroke(cv, polypath(tr), YELLOW, 6 * zoom, 200 * X, glow=10)
                q = at(lo, dl, s)
                dot(cv, q, 14 * zoom, YELLOW, 240 * X, blur=10); dot(cv, q, 7 * zoom, (255, 255, 255), 255 * X)
                # node flash where it currently sits
                kn = int(np.argmin(np.abs(nodes - s)))
                if abs(nodes[kn] - s) < 4 * zoom:
                    dot(cv, at(lo, dl, nodes[kn]), 16 * zoom, (255, 255, 255), 160 * X, blur=8)
            # labels
            label(cv, 'Motor cortex', mcx, win(t, 2.2, 3.7) * X, side=1, dy=-40)
            label(cv, 'Spinal cord', at(up, du, du[-1] * 0.62), win(t, 3.2, 4.5) * X, side=-1)
            label(cv, 'Motor neuron', up[-1], win(t, 4.45, 5.5) * X, side=-1)
            label(cv, 'Sciatic nerve', at(lo, dl, dl[-1] * 0.38), win(t, 5.2, 6.4) * X, side=-1)
            label(cv, 'Calf muscle', at(lo, dl, dl[-1] * 0.72) + np.array([-25 * zoom, 0]), win(t, 6.9, 7.9) * X, side=-1)
        caption(cv, 'Brain to foot, slowed down', win(t, 1.6, 6.8, 0.35), y=230)
        caption(cv, 'Real time: about 1/30 of a second', win(t, 7.6, 9.15, 0.3), y=230, color=YELLOW)
        g = partrig.gap_check(rig, W, np.array([[0.5, 0, 540 - 0.5 * P.x], [0, 0.5, 700], [0, 0, 1.0]]), (W_, H_), joints, radius)
        if max(g[j] for j in joints) > 0.02 or g['components'] > 1: gaps += 1
        frame = surf.makeImageSnapshot().toarray()
        if i in stills:
            Image.fromarray(frame[..., [2, 1, 0]]).save(f'/home/claude/neuro/st_{i}.png')
        if proc: proc.stdin.write(frame.tobytes())
    if proc:
        proc.stdin.close(); proc.wait()
    print(json.dumps(dict(frames=int(DUR * FPS), frames_with_gap=gaps)))


if __name__ == '__main__':
    st = [int(v) for v in sys.argv[2:]]
    main(None if sys.argv[1] == '-' else sys.argv[1], stills=st)
