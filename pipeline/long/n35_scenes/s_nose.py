"""Chapter 4, Nosebleeds: the patient (traced hoodie runner, seated, CMU 13_04 seated window) in a sunny kitchen.
Tipping the head back (blood runs down the throat to the stomach: vomiting) is crossed out; then he sits upright, leans
forward, and pinches the soft part of the nose below the bony bridge."""
import sys, math, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, col
from cast import RM, MP, Perf, with_ik, pingpong
import geo

D = math.radians
SIT = MP.Take('13_04', near='Left')
SEAT = (geo.Y(366), geo.X(520))
FLOOR = geo.Y(536)
CS = 0.93
T0, T1 = cue('n1') - 0.5, end('n2') + 1.0
BACK = (cue('n1', 1) - 0.2, cue('n2', 1) - 0.3)       # head tipped back
FWD = cue('n2', 1)                                     # sits up, leans forward
PINCH = cue('n2', 2) - 0.2


class Kitchen:
    def __init__(self):
        self.rr, rs, _, _ = RM.build()
        self.rr.light = (0.86, -0.5)
        self.rr.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
        self.P = Perf(self.rr, rs, lambda t: [('a', SIT, pingpong(t, 14.2, 16.8, 0.12), 1.0)], ground_take=SIT)
        self.P.arms = self.arms
        self.P.extra = self.extra
        self.P.anchor_standing('a', SIT, 0.0)
        W = self.P.at(0.0)
        hip = self.rr.joint(W, 'body'); sole = self.P.ground + RM.ANKLE_H
        self.P.ground += (FLOOR - SEAT[0] - 14) / CS - (sole - hip[1])
        self.P.anchor_standing('a', SIT, 0.0)
        W = self.P.at(0.0)
        hip = self.rr.joint(W, 'body'); self.sole = self.P.ground + RM.ANKLE_H
        self.xf = np.array([[-CS, 0, SEAT[1] + CS * hip[0] + 50], [0, CS, FLOOR - CS * self.sole], [0, 0, 1.0]])
        with_ik(self.P, self.ik)
        self.cache = None

    def back(self, t):
        return smooth((t - BACK[0]) / 0.7) * (1 - smooth((t - BACK[1]) / 0.6))

    def fwd(self, t):
        return smooth((t - FWD) / 0.9)

    def arms(self, t):
        return {'near': (D(95), D(60), D(70), 1.0), 'far': (D(100), D(40), D(50), 1.0)}

    def extra(self, t):
        b, f = self.back(t), self.fwd(t)
        br = 0.012 * math.sin(t * 2 * math.pi / 3.4)
        return dict(spine=br - 0.12 * b + 0.30 * f, head=-0.62 * b + 0.10 * f)

    def nose(self, W):
        """Nose tip in rig coords: from the head joint along the head bone, forward of the face."""
        th, _, hp = W['head']
        R = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]])
        return hp + R @ np.array([72.0, -60.0])

    def ik(self, t, W0, pose):
        k = smooth((t - PINCH) / 0.8)
        if k <= 0.001:
            return
        tgt = self.nose(W0) + np.array([40.0, 46.0])
        cur = self.rr.tail(W0, 'n_lo')
        self.rr.ik2(W0, pose, 'n_up', 'n_lo', cur + k * (tgt - cur), bend=-1)
        pose['world']['n_hand'] = lerp(pose['world'].get('n_hand', D(70)), D(-120), k)

    def poses(self):
        if self.cache is None:
            out = {}
            n = int((T1 - T0 + 1.0) * 60) + 2
            for i in range(n):
                t = T0 - 1.0 + i / 60
                W = self.P.at(t)
                if t >= T0 - 1e-6 and i % 2 == 0:
                    out[round(t * 30)] = W
            self.cache = out
        return self.cache


@functools.lru_cache(maxsize=1)
def kitchen():
    return Kitchen()


def S(k, p):
    return (k.xf @ np.r_[p, 1])[:2]


def scene(c, t, cam):
    k = kitchen()
    ps = k.poses()
    W = ps[min(ps.keys(), key=lambda q: abs(q - round(t * 30)))]
    K.draw_plate(c, 'g_kitchen.png', cam)
    K.push_cam(c, cam)
    # sun on the floor breathing, a leaf of the plant swaying is in the painting; dust in the light
    rng = np.random.default_rng(4)
    for i in range(30):
        x = geo.X(180) + rng.uniform(0, 520) + 20 * math.sin(t * 0.3 + i)
        y = geo.Y(60) + ((rng.uniform(0, 420) - t * rng.uniform(4, 10)) % 420)
        c.drawCircle(x, y, rng.uniform(1.5, 3.2), skia.Paint(AntiAlias=True, Color=skia.Color(255, 246, 214, 90)))
    c.drawOval(skia.Rect(SEAT[1] - 160, FLOOR - 8, SEAT[1] + 150, FLOOR + 18),
               skia.Paint(AntiAlias=True, Color=skia.Color(120, 70, 30, 60), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10)))
    k.rr.blink = 1.0 if (t % 3.9) < 0.12 else 0.0
    k.rr.draw(c, W, k.xf)
    nose = S(k, k.nose(W))
    # the nosebleed: a thin dark red trickle from the nostril to the lip while he is not pinching
    tr = 1 - smooth((t - PINCH - 0.6) / 1.0)
    if tr > 0.01 and k.back(t) < 0.3:
        L_ = 26 + 6 * math.sin(t * 2)
        c.drawLine(nose[0] + 6, nose[1] + 8, nose[0] + 9, nose[1] + 8 + L_, skia.Paint(AntiAlias=True, Color=col((150, 14, 30), 255 * tr),
                                                                                    StrokeWidth=7, StrokeCap=skia.Paint.kRound_Cap))
    c.restore()
    return K.w2s(cam, nose), W, k


@functools.lru_cache(maxsize=1)
def face_pt():
    k = kitchen(); ps = k.poses()
    W = ps[min(ps.keys(), key=lambda q: abs(q - round((PINCH + 2.0) * 30)))]
    return S(k, k.nose(W))


def cam_at(t):
    base = (geo.X(480), geo.Y(300), 1.18)
    n = face_pt()
    face = (n[0] + 40, n[1] + 120, 1.7)
    u = smooth((t - PINCH - 0.2) / 1.4) * (1 - smooth((t - cue('n2', 3) + 0.2) / 1.2))
    return K.cam_lerp(base, face, u)


def nose_shot(c, t):
    cam = cam_at(t)
    nose, W, k = scene(c, t, cam)
    t1, t2, t3 = cue('n1', 1), cue('n1', 2), cue('n1', 3)
    # tipping the head back: crossed out; the path of the blood down the throat to the stomach
    a = win(t, t2, cue('n2', 1) - 0.4)
    if a > 0.01:
        neck = K.w2s(cam, S(k, k.rr.tail(W, 'body')))
        hip = K.w2s(cam, S(k, k.rr.joint(W, 'body')))
        belly = hip + 0.38 * (neck - hip)
        throat = neck + np.array([-12.0, -10.0])
        pts = [nose + np.array([14, 10]), throat, neck + 0.5 * (belly - neck) + np.array([-6, 0]), belly]
        K.curve_arrow(c, pts, K.CORAL, 10, 30, a, grow=smooth((t - t2) / 1.6))
        K.glow(c, belly, 70, K.CORAL, a * smooth((t - t3) / 0.4) * (0.6 + 0.3 * math.sin(t * 6)))
    K.chip(c, 'tipping the head back', 1420, 230, K.CORAL, win(t, t1, cue('n2', 1) - 0.4), 42)
    K.x_mark(c, 1700, 340, 0.75, win(t, t2, cue('n2', 1) - 0.4))
    K.text_card(c, [('blood runs down the throat', K.WHITE, win(t, t2 + 0.3, cue('n2', 1) - 0.4)),
                    ('gets swallowed, irritates the stomach', K.WHITE, win(t, t3, cue('n2', 1) - 0.4)),
                    ('now he vomits too', K.CORAL, win(t, t3 + 1.6, cue('n2', 1) - 0.4))], 120, 760)
    # the right way
    af = win(t, cue('n2', 1), end('n2') + 0.5)
    K.chip(c, 'upright, lean FORWARD', 1400, 230, K.GREEN, win(t, cue('n2', 1), PINCH + 0.2), 44)
    ap = win(t, PINCH + 1.2, cue('n2', 3) - 0.1)
    if ap > 0.01:
        z = cam[2] * CS
        soft = nose + np.array([6.0 * z, 5.0 * z])
        bridge = nose + np.array([12.0 * z, -18.0 * z])
        K.ring(c, soft, 30, K.GREEN, ap, 6)
        K.chip(c, 'pinch the soft part', soft[0] - 330, soft[1] + 120, K.GREEN, ap, 40, anchor=soft)
        K.chip(c, "bony bridge: can't squeeze it", bridge[0] + 120, bridge[1] - 110, K.INK, smooth((t - PINCH - 3.2) / 0.3) * ap, 36, anchor=bridge)
        K.text_card(c, [('most nosebleeds start in the soft front part', K.WHITE, smooth((t - PINCH - 5.5) / 0.3) * ap)], 120, 880)
    K.chip(c, 'lean forward, pinch', 960, 960, K.GREEN, win(t, cue('n2', 3), end('n2') + 0.5), 48)


def sounds():
    K.snd('wrong', cue('n1', 2), 0.35)
    K.snd('swish', cue('n2', 1), 0.35)
    K.snd('cloth_real', cue('n2', 1) + 0.1, 0.35)
    K.snd('pat', PINCH + 0.8, 0.35)
    K.snd('check', cue('n2', 3), 0.35)


SHOTS = [dict(t0=T0, t1=end('n2') + 0.45, fn=nose_shot, fin=0.4)]
