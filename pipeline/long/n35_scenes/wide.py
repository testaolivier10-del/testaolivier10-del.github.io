"""The garage wide shot: patient (traced hoodie runner, mirrored to face left) seated on the step stool, paramedic
(traced, facing right) kneeling and pressing on his right forearm. Real motion capture: CMU 13_04 (sit on stepstool,
seated window 14 to 17 s) and CMU 23_03 (subject B kneels, kneel window 2.2 to 3.9 s), both played slowly back and forth
(holds that still breathe), with keyed arms (his held out, hers by 2 bone IK onto his forearm), breathing, blinks, winces."""
import sys, math, json, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp
from cast import PM, RM, MP, Perf, with_ik, pingpong
import geo

D = math.radians
SIT = MP.Take('13_04', near='Left')
KN = MP.Take('23_03', near='Left')
SEAT = (geo.Y(375), geo.X(515))
FLOOR = geo.Y(500)
CS = 0.88          # him (the runner rig is drawn about 8% shorter than the paramedic rig; he is about 6% taller)
CS_HER = 0.757
WINCES = []          # times he winces (filled by the shots)
TQ_ON = []           # (t0, t1) the tourniquet is on his forearm in the wide shot
GAUZE = []           # (t0, t1) gauze under her hands
PRESS = []           # (t0, t1) her hands on his forearm (otherwise resting on her thigh)


def in_any(t, spans):
    return any(a <= t < b for a, b in spans)


class Garage:
    def __init__(self):
        self.rr, rs, self.rj, self.rrad = RM.build()
        self.pr, ps, self.pj, self.prad = PM.build()
        self.rr.light = (0.86, -0.5)
        self.rr.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
        self.P1 = Perf(self.rr, rs, lambda t: [('a', SIT, pingpong(t, 14.2, 16.8, 0.12), 1.0)], ground_take=SIT)
        self.P1.arms = self.his_arms
        self.P1.extra = self.his_extra
        self.P1.anchor_standing('a', SIT, 0.0)
        W1 = self.P1.at(0.0)
        hip = self.rr.joint(W1, 'body'); sole1 = self.P1.ground + RM.ANKLE_H
        self.P1.ground += (FLOOR - SEAT[0] - 18) / CS - (sole1 - hip[1])
        self.P1.anchor_standing('a', SIT, 0.0)
        W1 = self.P1.at(0.0)
        hip = self.rr.joint(W1, 'body'); self.sole1 = self.P1.ground + RM.ANKLE_H
        self.xf1 = np.array([[-CS, 0, SEAT[1] + CS * hip[0] + 10], [0, CS, FLOOR - CS * self.sole1], [0, 0, 1.0]])
        self.P2 = Perf(self.pr, ps, lambda t: [('a', KN, pingpong(t, 2.25, 3.85, 0.12), 1.0)], ground_take=KN)
        self.P2.extra = self.her_extra
        self.P2.anchor_standing('a', KN, 0.0)
        self.sole2 = self.P2.ground + PM.ANKLE_H
        CS2 = CS_HER
        self.xf2 = np.array([[CS2, 0, SEAT[1] - 480], [0, CS2, FLOOR + 12 - CS2 * self.sole2], [0, 0, 1.0]])
        self.inv2 = np.linalg.inv(self.xf2)
        self.W1 = W1
        self.wound_now = self.wound(W1)
        with_ik(self.P2, self.her_ik)
        self.cache = {}

    # ---------------- his performance
    def his_arms(self, t):
        br = 0.03 * math.sin(t * 2 * math.pi / 2.4)
        return {'near': (D(48) + br, D(-4) + br * 0.5, D(4), 1.0), 'far': (D(100), D(22), D(30), 1.0)}

    def his_extra(self, t):
        fast = 0.022 * math.sin(t * 2 * math.pi / 2.2)          # fast breathing (pain, blood loss)
        w = 0.0
        for tw in WINCES:
            w = max(w, smooth((t - tw) / 0.12) * (1 - smooth((t - tw - 0.5) / 0.9)))
        return dict(spine=fast - 0.08 * w, head=-0.28 * w + 0.03 * math.sin(t * 0.9))

    def her_extra(self, t):
        br = 0.012 * math.sin(t * 2 * math.pi / 3.4)
        push = 0.0
        for a_, b_ in PRESS:
            if a_ <= t < b_:
                push = 0.025 * (0.5 + 0.5 * math.sin(t * 2 * math.pi * 118 / 60))   # leaning into each beat
        return dict(spine=br + push, head=0.02 * math.sin(t * 0.7))

    def wound(self, W1):
        wr = self.xf1 @ np.r_[self.rr.tail(W1, 'n_lo'), 1]
        el = self.xf1 @ np.r_[self.rr.joint(W1, 'n_lo'), 1]
        return el[:2] + 0.64 * (wr[:2] - el[:2])

    def her_ik(self, t, W0, pose):
        k = 0.0
        for a_, b_ in PRESS:
            k = max(k, smooth((t - a_) / 0.5) * (1 - smooth((t - b_) / 0.5)))
        if k <= 0.001:
            return
        tg = (self.inv2 @ np.r_[self.wound_now, 1])[:2]
        nh = self.pr.joint(W0, 'n_up')
        fh = self.pr.joint(W0, 'f_up')
        cur_n = self.pr.tail(W0, 'n_lo'); cur_f = self.pr.tail(W0, 'f_lo')
        want_n = tg + np.array([-52, -22]); want_f = tg + np.array([-30, -36])
        self.pr.ik2(W0, pose, 'n_up', 'n_lo', cur_n + k * (want_n - cur_n), bend=-1)
        pose['world']['n_hand'] = lerp(pose['world'].get('n_hand', D(60)), D(12), k)
        self.pr.ik2(W0, pose, 'f_up', 'f_lo', cur_f + k * (want_f - cur_f), bend=-1)
        pose['world']['f_hand'] = lerp(pose['world'].get('f_hand', D(60)), D(6), k)

    def poses(self, t0, t1):
        """Poses for every 1/30 s from t0 (simulated from t0 - 1 s so springs settle)."""
        key = (round(t0, 2), round(t1, 2))
        if key in self.cache:
            return self.cache[key]
        out = {}
        n = int((t1 - t0 + 1.0) * 60) + 2
        for i in range(n):
            t = t0 - 1.0 + i / 60
            W1 = self.P1.at(t)
            self.wound_now = self.wound(W1)
            W2 = self.P2.at(t)
            if t >= t0 - 1e-6 and i % 2 == 0:
                out[round(t * 30)] = (W1, W2, self.wound_now.copy())
        self.cache[key] = out
        return out

    def draw(self, c, t, span, cam, extra=None):
        """Draw the garage at time t inside the shot span (t0, t1) with camera cam=(cx, cy, z) in plate coords.
        extra(c, t, wound_world) draws liquids and props between the patient and the paramedic."""
        ps = self.poses(*span)
        k = min(ps.keys(), key=lambda q: abs(q - round(t * 30)))
        W1, W2, wnd = ps[k]
        K.draw_plate(c, 'g_garage.png', cam)
        K.push_cam(c, cam)
        # ambulance lights pulse softly in the door (red and blue, out of phase)
        for (lx, ly), colr, ph in (((geo.X(800), geo.Y(207)), (255, 60, 70), 0.0), ((geo.X(862), geo.Y(207)), (70, 140, 255), 0.5)):
            u = 0.5 + 0.5 * math.sin((t * 1.6 + ph) * 2 * math.pi)
            K.glow(c, (lx, ly), 90 + 40 * u, colr, 0.35 + 0.35 * u)
        # lamp flicker-free warm glow breathing slightly
        K.glow(c, (geo.X(175), geo.Y(70)), 230, (255, 214, 140), 0.18 + 0.03 * math.sin(t * 1.3))
        # contact shadows
        sh = skia.Paint(AntiAlias=True, Color=skia.Color(40, 24, 30, 70), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10))
        hip2 = self.xf2 @ np.r_[self.pr.joint(W2, 'body'), 1]
        c.drawOval(skia.Rect(hip2[0] - 230, FLOOR - 4, hip2[0] + 170, FLOOR + 22), sh)
        self.rr.blink = 1.0 if (t % 3.7) < 0.12 else 0.0
        self.pr.blink = 1.0 if ((t + 1.3) % 4.3) < 0.12 else 0.0
        self.rr.draw(c, W1, self.xf1)
        if extra:
            extra(c, t, wnd, 'mid')
        if in_any(t, TQ_ON):
            tq_wide(c, W1, self)
        if in_any(t, GAUZE):
            gauze_wide(c, wnd)
        self.pr.draw(c, W2, self.xf2)
        if extra:
            extra(c, t, wnd, 'top')
        c.restore()
        return wnd


def gauze_wide(c, w):
    """A small folded gauze pad under her fingers (flat, two tones)."""
    x, y = w
    r = skia.RRect.MakeRectXY(skia.Rect(x - 30, y - 10, x + 26, y + 9), 4, 4)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(238, 241, 246)))
    c.drawRect(skia.Rect(x - 30, y + 2, x + 26, y + 9), skia.Paint(AntiAlias=True, Color=skia.Color(200, 208, 222)))
    c.drawOval(skia.Rect(x - 18, y - 8, x + 14, y + 7), skia.Paint(AntiAlias=True, Color=skia.Color(176, 22, 36, 230)))


def tq_wide(c, W1, g):
    """The tourniquet on his forearm, a few inches toward the elbow from the wound (small, flat, two tones)."""
    wr = g.xf1 @ np.r_[g.rr.tail(W1, 'n_lo'), 1]
    el = g.xf1 @ np.r_[g.rr.joint(W1, 'n_lo'), 1]
    p = el[:2] + 0.42 * (wr[:2] - el[:2])
    d = (wr[:2] - el[:2]); d = d / np.linalg.norm(d); n = np.array([-d[1], d[0]])
    hw_, hh = 11, 24
    pts = [p - d * hw_ - n * hh, p + d * hw_ - n * hh, p + d * hw_ + n * hh, p - d * hw_ + n * hh]
    path = skia.Path(); path.moveTo(*pts[0])
    for q in pts[1:]:
        path.lineTo(*q)
    path.close()
    c.drawPath(path, skia.Paint(AntiAlias=True, Color=skia.Color(34, 37, 46)))
    top = p - n * hh * 1.05
    c.drawLine(*(top - d * 26), *(top + d * 26), skia.Paint(AntiAlias=True, Color=skia.Color(58, 63, 76), StrokeWidth=8, StrokeCap=skia.Paint.kRound_Cap))


@functools.lru_cache(maxsize=1)
def garage():
    return Garage()


def export_geo():
    g = garage()
    json.dump(dict(wound=[float(v) for v in g.wound_now], floor=float(FLOOR)), open('/home/claude/n35/wide_geo.json', 'w'))
    return g.wound_now


if __name__ == '__main__':
    print(export_geo())
