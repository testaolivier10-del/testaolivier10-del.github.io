"""w1108-01 cast: the sister and the brother, each ONE skinned body (pipeline/people person.py). The sister is the same
body with a longer hair shape (a low ponytail over the nape) and a rust sweater; the brother wears a teal hoodie colour.
Hands reach props through a solved arm (grid search of shoulder and elbow so the hand centre sits on the target)."""
import math, numpy as np, skia
import person as PP, airman2 as A2
from airman2 import curve, _hp, P, mix

SIS_PAL = {A2.OL: (196, 92, 70), A2.OL_SH: (160, 70, 56), A2.OL_HI: (220, 120, 96), A2.CUFF: (196, 92, 70),
           A2.BELT: (52, 58, 82), A2.BELT_SH: (40, 44, 64), A2.SKIN: (230, 178, 146), A2.SKIN_SH: (218, 164, 134),
           A2.HAIR: (70, 44, 34), A2.HAIR_SH: (52, 32, 26), (150, 120, 80): (196, 92, 70)}
BRO_PAL = {A2.OL: (52, 128, 132), A2.OL_SH: (38, 100, 106), A2.OL_HI: (80, 160, 160), A2.CUFF: (52, 128, 132),
           A2.BELT: (60, 64, 88), A2.BELT_SH: (44, 48, 66), A2.SKIN: (204, 152, 118), A2.SKIN_SH: (180, 132, 100),
           A2.HAIR: (46, 34, 30), A2.HAIR_SH: (32, 24, 22), (150, 120, 80): (52, 128, 132)}

PONY = [(104, 112), (78, 130), (62, 176), (56, 236), (62, 296), (76, 340), (96, 352), (104, 330), (96, 290), (98, 236),
        (108, 190), (122, 150)]                      # a long ponytail hanging behind the neck, clear of the skull
TIE = [(98, 132), (114, 126), (118, 144), (102, 150)]
SIDE = [(104, 110), (150, 90), (206, 86), (246, 104), (238, 120), (200, 112), (176, 118), (168, 150), (160, 196), (140, 204),
        (122, 186), (112, 150)]                      # hair swept back over the ear to the tie
BANG = [(170, 82), (220, 80), (250, 100), (252, 118), (232, 108), (204, 100), (180, 104)]
LASH = [(214, 146), (220, 140), (230, 137), (240, 139), (246, 143)]


class Sib(PP.Person):
    def __init__(self, scale, pal, pony=False):
        super().__init__(scale, palette=pal, cap=False, trouser=(54, 60, 86))
        self.pony = pony

    def _head(self, c, J, ps, l):
        if not self.pony:
            return super()._head(c, J, ps, l)
        # her head: the same skull outline, no cheek or jaw shading, soft skin, hair over the ear, a long ponytail,
        # lashes and fuller lips, so she reads as a woman in every view
        h = self._hf(J); pc = self.pc
        S = lambda pts: curve([h(*_hp(p)) for p in pts])
        pony = S(PONY)
        c.drawPath(pony, P(pc(A2.HAIR))); self._shade(c, pony, pc(A2.HAIR_SH), l, 10)
        head = S(A2.HEAD_SHAPES['skin'])
        c.drawPath(head, P(pc(A2.SKIN)))
        hair = A2.union([S(A2.HEAD_SHAPES['hair']), S(A2.HEAD_SHAPES['hairtop']), S(SIDE)])
        c.drawPath(hair, P(pc(A2.HAIR))); self._shade(c, hair, pc(A2.HAIR_SH), l, 7)
        c.drawPath(S(TIE), P((214, 92, 72)))
        c.drawPath(S(BANG), P(pc(A2.HAIR)))
        c.drawPath(S([(208, 136), (228, 128), (250, 128), (250, 133), (228, 132), (210, 140)]), P(pc(A2.HAIR)))
        if ps.blink:
            c.drawLine(*h(*_hp((216, 149))), *h(*_hp((240, 149))), A2.SP((52, 34, 24), 3))
        else:
            c.drawPath(S([(216, 149), (228, 141), (242, 144), (238, 154), (224, 155)]), P((250, 246, 238)))
            c.drawCircle(*h(*_hp((232 + 3 * ps.look, 148))), 4.8, P((48, 30, 22)))
            lp = skia.Path(); q = [h(*_hp(p)) for p in LASH]; lp.moveTo(*q[0])
            for p in q[1:]: lp.lineTo(*p)
            c.drawPath(lp, A2.SP((40, 26, 20), 3.2))
        c.drawPath(S([(250, 183), (264, 184), (258, 188), (250, 187)]), P(mix(pc(A2.SKIN), (0, 0, 0), 0.06)))
        sm = ps.smile
        lips = S([(236, 204), (246, 201), (256, 203), (252, 210 + 2 * sm), (242, 211 + 2 * sm)])
        c.drawPath(lips, P((196, 96, 92)))
        if ps.mouth > 0.05:
            c.drawPath(S([(239, 206), (252, 204), (250, 204 + 12 * ps.mouth), (241, 206 + 10 * ps.mouth)]), P((110, 46, 48)))
        c.drawCircle(*h(*_hp((214, 176))), 9, P((240, 140, 130), 70))


SIS = Sib(0.66, SIS_PAL, pony=True)
BRO = Sib(0.66, BRO_PAL)
SIS_S = Sib(0.221, SIS_PAL, pony=True)
BRO_S = Sib(0.221, BRO_PAL)

_CACHE = {}


def hand_center(who, ps, side='n'):
    J = who.joints(ps); o, d = J['hand_' + side]
    f = who.frame(o, d)
    return who.canvas_pt(ps, f(0, 46))


def reach(who, base, side, target, key=None):
    """grid search uarm and elbow so the hand centre of arm `side` sits on target (canvas). returns kw"""
    k = None if key is None else (id(who), side, key)
    if k is not None and k in _CACHE: return dict(base, **_CACHE[k])
    best = None
    for ua in range(-30, 181, 5):
        for el in range(0, 151, 5):
            kw = dict(base); kw['uarm_' + side] = ua; kw['elbow_' + side] = el
            ps = A2.Pose(**kw)
            hx, hy = hand_center(who, ps, side)
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if best is None or d < best[0]: best = (d, ua, el)
    # refine
    d0, ua0, el0 = best
    for ua in np.arange(ua0 - 5, ua0 + 5.1, 1):
        for el in np.arange(max(0, el0 - 5), el0 + 5.1, 1):
            kw = dict(base); kw['uarm_' + side] = ua; kw['elbow_' + side] = el
            hx, hy = hand_center(who, A2.Pose(**kw), side)
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if d < best[0]: best = (d, ua, el)
    res = {'uarm_' + side: float(best[1]), 'elbow_' + side: float(best[2])}
    if k is not None: _CACHE[k] = res
    return dict(base, **res)
