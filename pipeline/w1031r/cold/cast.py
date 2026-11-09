"""The cold heart cast, each ONE skinned body from the people kit (person.py over airman2.py, linear blend skinning).

Adds to the kit, for this story:
- IK: a pose can give targets instead of angles. hand_tn / hand_tf (wrist targets) solve the shoulder and elbow,
  foot_tn / foot_tf (ankle targets) solve the hip and knee, hip_h sets the hip height (kneeling, crouching). Targets
  come from the world (wpt -> pose space), so a hand that holds something is solved onto it every frame.
- Free ankle angle (a kneeling back foot points its toes into the ground).
- Helmets with a headlamp (the ice rescuers) and a knit beanie (the patient), drawn as props over the head with their
  own shade and rim, as the house rules ask for hats.
Cast: RED (rescuer 1, red dry suit, white helmet), ORANGE (rescuer 2, orange dry suit, yellow helmet), PATIENT (navy
parka, grey beanie, cold pale skin)."""
import math
import numpy as np
import skia
import airman2 as A
import person as PP
from airman2 import P, SP, curve, union, inter, diff, mix, _hp, HEAD_SHAPES, L_THIGH, L_SHIN, L_UARM, L_FARM, LIM

MOON_RIM = (200, 216, 255)


class Pose(A.Pose):
    def __init__(self, **kw):
        extra = {k: kw.pop(k) for k in list(kw) if k in ('hip_h', 'hand_tn', 'hand_tf', 'foot_tn', 'foot_tf', 'free_ank', 'bend_n', 'bend_f')}
        super().__init__(**kw)
        for k in ('hip_h', 'hand_tn', 'hand_tf', 'foot_tn', 'foot_tf'):
            setattr(self, k, extra.get(k))
        self.free_ank = extra.get('free_ank', False)


def _ik(root, tgt, l1, l2, sign):
    """two bone IK in pose space (angles from straight down, + toward the front). sign +1: the middle joint points
    forward (knee), -1: backward (elbow). Returns (first angle, bend) with the bend in the kit's convention."""
    dx, dy = tgt[0] - root[0], tgt[1] - root[1]
    d = max(1e-3, min(math.hypot(dx, dy), l1 + l2 - 0.5, ))
    d = max(d, abs(l1 - l2) + 0.5)
    a = math.degrees(math.atan2(dx, dy))
    b = math.degrees(math.acos(max(-1, min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))))
    g = math.degrees(math.acos(max(-1, min(1, (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)))))
    bend = 180 - g
    if sign > 0: return a + b, -bend
    return a - b, bend


class Body(PP.Person):
    def __init__(self, scale, palette, head='helmet', helmet=(240, 240, 236), lamp=True, **kw):
        self.headgear, self.helmet_col, self.lamp = head, helmet, lamp
        super().__init__(scale, palette=palette, cap=False, hat='prop', **kw)

    # ------------------------------------------------------------ world <-> pose space
    def wpt(self, ps, w):
        k = ps.s * self.k
        return ((w[0] - ps.x) / (k * ps.face), (w[1] - ps.ground) / k)

    def joints(self, ps):
        J = {}
        hip_h = getattr(ps, 'hip_h', None)
        if hip_h is None:
            def leg_drop(th, kk):
                return L_THIGH * math.cos(math.radians(th)) + L_SHIN * math.cos(math.radians(th + kk)) + 150
            kn = max(LIM['knee'][0], min(LIM['knee'][1], ps.knee_n)); kf = max(LIM['knee'][0], min(LIM['knee'][1], ps.knee_f))
            hip_h = max(leg_drop(ps.thigh_n, kn), leg_drop(ps.thigh_f, kf))
        hip = (0.0, -hip_h)
        J['hip'] = hip
        J['spine'] = 180 - ps.lean
        top = self.frame(hip, 180 - ps.lean)
        J['torso_f'] = lambda px, py: top(-px, py)
        J['neck0'] = J['torso_f'](8, A.L_SPINE - 10)
        nk = max(-22, min(80, ps.neck))
        na = 180 - ps.lean + nk * 0.5
        nf = self.frame(J['neck0'], na)
        J['neck_f'] = lambda px, py: nf(-px, py)
        J['head_c'] = J['neck_f'](-4, 168)
        J['head_piv'] = J['neck_f'](20, 24)
        J['head_ang'] = -ps.lean + nk
        J['sh'] = J['torso_f'](-22, A.L_SPINE - 78)
        for s in 'nf':
            h0 = (hip[0] + (0 if s == 'n' else -6), hip[1])
            ft = getattr(ps, 'foot_t' + s, None)
            if ft is not None:
                th, kk = _ik(h0, ft, L_THIGH, L_SHIN, +1)
            else:
                th = getattr(ps, 'thigh_' + s); kk = max(LIM['knee'][0], min(LIM['knee'][1], getattr(ps, 'knee_' + s)))
            J['thigh_' + s] = (h0, th)
            knee = self.frame(h0, th)(0, L_THIGH)
            J['shin_' + s] = (knee, th + kk)
            ank = self.frame(knee, th + kk)(0, L_SHIN)
            an = getattr(ps, 'ank_' + s)
            if not getattr(ps, 'free_ank', False): an = max(LIM['ankle'][0], min(LIM['ankle'][1], an))
            J['boot_' + s] = (ank, an)
            sh = J['sh'] if s == 'n' else (J['sh'][0] + 34, J['sh'][1] + 8)
            ht = getattr(ps, 'hand_t' + s, None)
            if ht is not None:
                ua, el = _ik(sh, ht, L_UARM, L_FARM, -1)
                el = max(LIM['elbow'][0], min(LIM['elbow'][1], el))
            else:
                ua = getattr(ps, 'uarm_' + s); el = max(LIM['elbow'][0], min(LIM['elbow'][1], getattr(ps, 'elbow_' + s)))
            J['uarm_' + s] = (sh, ua)
            elb = self.frame(sh, ua)(0, L_UARM)
            J['farm_' + s] = (elb, ua + el)
            wri = self.frame(elb, ua + el)(0, L_FARM)
            wr = getattr(ps, 'wrist_' + s)
            J['hand_' + s] = (wri, ua + el + max(LIM['wrist'][0], min(LIM['wrist'][1], wr)))
        return J

    def hand_world(self, ps, s='n'):
        J = self.joints(ps)
        o, d = J['hand_' + s]; f = self.frame(o, d)
        return self.canvas_pt(ps, f(4, 60))

    def lamp_world(self, ps):
        J = self.joints(ps); h = self._hf(J)
        return self.canvas_pt(ps, h(*_hp((262, 112))))

    def mouth_world(self, ps):
        J = self.joints(ps); h = self._hf(J)
        return self.canvas_pt(ps, h(*_hp((262, 206))))

    # ------------------------------------------------------------ hats as props
    def _head(self, c, J, ps, l):
        super()._head(c, J, ps, l)
        h = self._hf(J)
        S = lambda pts: curve([h(*_hp(p)) for p in pts])
        if self.headgear == 'helmet':
            shell = S([(66, 150), (64, 100), (86, 58), (130, 30), (190, 24), (236, 46), (258, 84), (264, 116), (250, 122),
                       (206, 104), (150, 108), (104, 128), (90, 162)])
            col = self.helmet_col; sh = mix(col, (40, 50, 90), 0.32)
            c.drawPath(shell, P(col))
            q = skia.Path(shell); q.offset(-l[0] * 16, -l[1] * 16)
            c.drawPath(diff(shell, q), P(sh))
            r = skia.Path(shell); r.offset(-l[0] * 3, -l[1] * 3)      # rim on the lit edge
            c.drawPath(diff(shell, skia.Path(r)) if False else diff(shell, _off(shell, l[0] * 3, l[1] * 3)), P(MOON_RIM, 170))
            c.drawPath(S([(150, 108), (206, 104), (252, 122), (270, 126), (262, 132), (206, 116), (150, 120), (106, 138), (100, 130)]), P(sh))
            c.drawPath(S([(120, 60), (180, 40), (230, 60)]), SP(mix(col, (255, 255, 255), 0.4), 5, 160))
            # chin strap
            st = skia.Path(); st.moveTo(*h(*_hp((112, 136)))); st.quadTo(*h(*_hp((150, 220))), *h(*_hp((226, 246))))
            c.drawPath(st, SP((40, 40, 46), 4))
            if self.lamp:
                lp = S([(236, 92), (262, 96), (268, 120), (244, 122)])
                c.drawPath(lp, P((48, 50, 58)))
                c.drawCircle(*h(*_hp((264, 110))), 6, P((255, 250, 220)))
        elif self.headgear == 'beanie':
            b = S([(68, 150), (66, 100), (88, 60), (134, 34), (192, 30), (236, 54), (252, 96), (248, 118), (200, 112), (150, 116), (104, 134), (92, 168)])
            col = (96, 104, 120); sh = (66, 72, 90)
            c.drawPath(b, P(col))
            q = skia.Path(b); q.offset(-l[0] * 14, -l[1] * 14); c.drawPath(diff(b, q), P(sh))
            band = S([(92, 168), (104, 134), (150, 116), (200, 112), (248, 118), (246, 96), (198, 90), (146, 94), (96, 118), (78, 150)])
            c.drawPath(band, P(mix(col, (255, 255, 255), 0.08)))
            for k_ in range(7):     # knit ribs on the fold
                x = 104 + k_ * 22
                c.drawLine(*h(*_hp((x, 128 - k_ * 2.6))), *h(*_hp((x + 4, 104 - k_ * 1.6))), SP(sh, 3, 170))
            c.drawPath(diff(b, _off(b, l[0] * 3, l[1] * 3)), P(MOON_RIM, 120))
            # frost on the brow and lashes
            c.drawPath(S([(214, 130), (236, 126), (250, 132)]), SP((236, 244, 255), 3, 160))


def _off(p, dx, dy):
    q = skia.Path(p); q.offset(dx, dy); return q


SUIT_RED = dict(main=(206, 50, 46), sh=(146, 30, 36), hi=(236, 110, 96))
SUIT_OR = dict(main=(236, 126, 36), sh=(176, 80, 24), hi=(252, 176, 90))


def rescuer(scale, suit, helmet):
    pal = {A.OL: suit['main'], A.OL_SH: suit['sh'], A.OL_HI: suit['hi'], A.CUFF: suit['main'], A.BELT: (34, 36, 44),
           A.BELT_SH: (20, 22, 28), A.BOOT_C: (40, 42, 50), A.BOOT_SH: (26, 28, 34), A.SOLE: (18, 18, 22),
           A.SKIN: (226, 168, 132), A.SKIN_SH: (196, 136, 106), A.HAIR: (60, 44, 34), A.HAIR_SH: (40, 30, 24)}
    return Body(scale, pal, head='helmet', helmet=helmet, forearm=suit['main'], glove=(44, 46, 54), stripe=(230, 232, 210))


def patient(scale):
    pal = {A.OL: (40, 52, 84), A.OL_SH: (26, 34, 58), A.OL_HI: (70, 86, 126), A.CUFF: (40, 52, 84), A.BELT: (40, 52, 84),
           A.BELT_SH: (26, 34, 58), A.SKIN: (214, 190, 186), A.SKIN_SH: (176, 156, 166), A.HAIR: (70, 56, 46), A.HAIR_SH: (50, 40, 34),
           A.BOOT_C: (60, 50, 44), A.BOOT_SH: (40, 34, 30)}
    return Body(scale, pal, head='beanie', lamp=False, forearm=(40, 52, 84), glove=(52, 56, 66), trouser=(58, 70, 96))


RED = None; ORANGE = None; PATIENT = None


def make(scale=0.41):
    global RED, ORANGE, PATIENT
    RED = rescuer(scale, SUIT_RED, (240, 240, 236))
    ORANGE = rescuer(scale, SUIT_OR, (250, 206, 60))
    PATIENT = patient(scale)
    return RED, ORANGE, PATIENT
