"""Leo and Ana (AP Physics 1 01), each ONE skinned body (pipeline/people/person.py, linear blend skinning) with their own
head measured off their own Figma AI (gemini) head turnaround (ref/heads_leo.png, ref/heads_ana.png; measure_heads.py):
- Leo (16, sprinter): royal blue tank top with white trim, black running shorts, bare arms and legs, orange running shoes,
  short twists on top with a high fade.
- Ana (16): forest green track jacket with white stripes and a stand collar, charcoal track pants with a white stripe,
  white sneakers, dark brown hair in a low bun.
Heads: designed outlines in sheet units (face toward +x), the throat placed at the airman head's neck pivot."""
import math
import numpy as np
import skia
import person as PR
import airman2 as A
from airman2 import (P, SP, curve, union, inter, diff, circ, SKIN, SKIN_SH, OL, OL_SH, OL_HI, CUFF, BELT, BELT_SH, BOOT_C, BOOT_SH,
                     SOLE, HAIR, HAIR_SH, RIM, TORSO, CUFFB, BOOT, UARM, SLEEVE_ROLL, FARM, L_SPINE, L_THIGH, Pose, HEAD_SHAPES, _hp, mix)

Pose = A.Pose
SHORTS = (34, 36, 46)


class Kid(PR.Person):
    """the shared body with sports clothes; kind 'leo' or 'ana'"""

    def __init__(self, kind, scale):
        self.kind = kind
        if kind == 'leo':
            pal = {SKIN: (201, 141, 94), SKIN_SH: (170, 108, 70), HAIR: (35, 27, 23), HAIR_SH: (22, 17, 14), OL: (47, 99, 200),
                   OL_SH: (34, 74, 160), OL_HI: (90, 140, 230), CUFF: (240, 240, 244), BOOT_C: (246, 120, 60), BOOT_SH: (206, 88, 40),
                   SOLE: (244, 244, 240)}
            super().__init__(scale, palette=pal, cap=False, trouser=SHORTS, collar=(47, 99, 200))
        else:
            pal = {SKIN: (226, 180, 140), SKIN_SH: (196, 147, 108), HAIR: (58, 36, 24), HAIR_SH: (40, 24, 16), OL: (46, 125, 91),
                   OL_SH: (32, 96, 68), OL_HI: (80, 160, 120), CUFF: (40, 112, 80), BOOT_C: (246, 244, 238), BOOT_SH: (206, 204, 200),
                   SOLE: (178, 180, 186)}
            super().__init__(scale, palette=pal, cap=False, trouser=(56, 60, 72), forearm=(46, 125, 91), collar=(46, 125, 91))
        self.headk = 1.42
        self.layers = self._casual()

    def _hf(self, J):
        cx, cy = J['head_piv']; a = math.radians(J['head_ang'])
        ca, sa = math.cos(a), math.sin(a)
        ox, oy = 22.0, 78.0; k = getattr(self, 'headk', 1.25)
        return lambda px, py: (cx + k * ((px - ox) * ca - (py - oy) * sa), cy + k * ((px - ox) * sa + (py - oy) * ca))

    def _casual(self):
        J = self.J0; L = []
        add = lambda grp, path, col, bones, kind='base', sigma=10.0, a=255: L.append(dict(
            grp=grp, col=col, kind=kind, a=a, bones=bones, rings=self._bind(path, bones, sigma),
            limb='arm' if any(b.startswith('uarm') for b in bones) else ('leg' if any(b.startswith(('thigh', 'shin')) for b in bones) else '')))
        stroke = lambda path, w: (lambda d: (SP((0, 0, 0), w).getFillPath(path, d), d)[1])(skia.Path())
        line = lambda a, b, w: stroke(self._seg(a, b), w)
        T = J['torso_f']
        leo = self.kind == 'leo'
        for s in 'fn':
            g = 'far' if s == 'f' else 'leg'
            legb = ['spine', 'thigh_' + s, 'shin_' + s]
            o, an = J['boot_' + s]; a = math.radians(an); ca, sa = math.cos(a), math.sin(a)
            fb = lambda px, py: (o[0] + px * ca - py * sa, o[1] + px * sa + py * ca)
            shoe = [(-60, 30), (30, 26), (70, 56), (114, 80), (128, 104), (124, 132), (-70, 132), (-74, 80)]
            add(g, curve([fb(*p) for p in shoe]), BOOT_C, ['boot_' + s])
            add(g, curve([fb(*p) for p in [(-74, 110), (130, 110), (128, 140), (-74, 140)]]), SOLE, ['boot_' + s], 'detail')
            if leo:   # a swoosh-free stripe on the running shoe
                add(g, line(fb(-40, 60), fb(70, 80), 7), (255, 236, 210), ['boot_' + s], 'detail')
            else:
                add(g, line(fb(58, 60), fb(20, 84), 4), BOOT_SH, ['boot_' + s], 'detail')
            leg = self._leg_path(J, s)
            tf = self.frame(*J['thigh_' + s])
            if leo:
                # bare leg (skin), then the running shorts over the top half of the thigh
                add(g, leg, SKIN, legb, sigma=14)
                box = curve([tf(*p) for p in [(-260, -220), (260, -220), (260, 150), (-260, 175)]])
                add(g, inter(leg, box), OL, ['spine', 'thigh_' + s], sigma=14)
            else:
                add(g, leg, OL, legb, sigma=14)
                sf = self.frame(*J['shin_' + s])
                add(g, line(tf(-6, 30), tf(-10, 290), 8), (236, 236, 240), legb, 'detail', sigma=14)
                add(g, line(sf(-12, -10), sf(-14, 200), 8), (236, 236, 240), legb, 'detail', sigma=14)
        for s in 'fn':
            g = 'far' if s == 'f' else 'arm'
            armb = ['uarm_' + s, 'farm_' + s]
            o, _ = J['farm_' + s]
            fa = union([self.part(J, 'farm_' + s, FARM), circ(o[0], o[1], 38)])
            add(g, fa, SKIN, ['uarm_' + s, 'farm_' + s, 'hand_' + s], sigma=10)
            if leo:   # bare upper arm: the shoulder is skin too
                add(g, self.part(J, 'uarm_' + s, UARM), SKIN, armb, sigma=12)
            else:
                add(g, self.part(J, 'uarm_' + s, UARM), OL, armb, sigma=12)
                ff = self.frame(*J['farm_' + s]); uf = self.frame(*J['uarm_' + s])
                add(g, line(ff(-30, 176), ff(30, 174), 9), OL_SH, ['farm_' + s], 'detail', a=200)
                add(g, line(uf(-4, 20), uf(-8, 200), 8), (236, 236, 240), armb, 'detail', sigma=12)
        add('neck', self._neck_path(J), SKIN, ['spine', 'neck', 'head'], sigma=24)
        torso = curve([T(px, py) for px, py in TORSO])
        add('torso', torso, OL, ['spine'])
        if leo:
            # tank top: deep white trimmed neckline and armhole, a race number bib
            add('torso', inter(stroke(curve([T(px, py) for px, py in [(-40, 372), (24, 296), (96, 356)]]), 9), torso), CUFF, ['spine', 'neck'], 'detail')
        else:
            hem = skia.Path(); hem.moveTo(*T(-160, -50)); hem.lineTo(*T(160, -50)); hem.lineTo(*T(160, 20)); hem.lineTo(*T(-160, 20)); hem.close()
            add('torso', inter(hem, torso), CUFF, ['spine'])
            add('torso', line(T(96, 370), T(104, 0), 4), (190, 200, 196), ['spine'], 'detail')       # the zip
            add('torso', line(T(-40, 330), T(60, 240), 8), (236, 236, 240), ['spine'], 'detail', a=230)  # chest stripe
            collar = curve([T(px, py) for px, py in [(-70, 350), (-62, 430), (-10, 446), (60, 440), (96, 410), (92, 350), (40, 370), (-20, 366)]])
            add('collar', collar, OL, ['spine', 'neck'], sigma=30)
            add('collar', line(T(-56, 410), T(80, 418), 5), (236, 236, 240), ['spine', 'neck'], 'detail', sigma=30)
        return L

    def _silhouette(self, J, ps):
        return skia.Path()


LEO = None
ANA = None


def leo():
    global LEO
    if LEO is None:
        LEO = Kid('leo', 0.42)
    return LEO


def ana():
    global ANA
    if ANA is None:
        ANA = Kid('ana', 0.39)
    return ANA


# ====================================================================== heads
import json as _json, os as _os
_HC = _json.load(open(_os.path.join(_os.path.dirname(__file__), 'ref', 'head_contours.json')))
_THROAT = {'leo': (166, 258), 'ana': (172, 250)}
_CUT = {'leo': 262, 'ana': 254}
_NAPE = {'leo': [(80, 206), (125, 236)], 'ana': [(106, 210), (140, 236)]}
FEAT = {
    'leo': dict(eye=(195, 146), ew=12, eh=7.5, iris=(199, 146), ir=6.5, ear=(110, 160),
                brow=[(176, 128), (196, 118), (219, 119), (219, 125), (197, 125), (178, 133)],
                mouth=((203, 201), (215, 204), (228, 199)), blush=((188, 168), 16, 9, 0.35), lash=False,
                fade=[(36, 92), (150, 74), (150, 92), (128, 108), (102, 128), (92, 190), (82, 200), (52, 150)]),
    'ana': dict(eye=(210, 147), ew=13, eh=7.5, iris=(214, 148), ir=6.5, ear=(122, 162),
                brow=[(190, 123), (210, 115), (233, 117), (233, 122), (211, 120), (192, 128)],
                mouth=((219, 206), (230, 208), (241, 203)), blush=((197, 168), 17, 9, 0.42), lash=True, fade=None),
}


def _hu(kind, p):
    tx, ty = _THROAT[kind]
    return (p[0] - tx + 182, p[1] - ty + 238)


def _sm_path(pts):
    p = skia.Path(); n = len(pts)
    m = [((pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2) for i in range(n)]
    p.moveTo(*m[-1])
    for i in range(n):
        p.quadTo(*pts[i], *m[i])
    p.close(); return p


def _oval(x, y, rx, ry):
    p = skia.Path(); p.addOval(skia.Rect(x - rx, y - ry, x + rx, y + ry)); return p


def _shapes(self, J):
    h = self._hf(J); k = self.kind
    H = lambda q: h(*_hp(_hu(k, q)))
    cut = _CUT[k]
    skin = _sm_path([H(q) for q in _HC[k]['skin'][0]])
    nx, ny = _NAPE[k][0]; ny -= 16
    box = skia.Path(); box.moveTo(*H((-200, -200))); box.lineTo(*H((600, -200))); box.lineTo(*H((600, cut)))
    box.lineTo(*H((_THROAT[k][0] - 30, cut))); box.lineTo(*H((nx + 10, ny + 22))); box.lineTo(*H((-200, ny + 22))); box.close()
    skin = inter(skin, box)
    hair = [_sm_path([H(q) for q in c]) for c in _HC[k]['hair'] if len(c) > 20]
    return H, skin, hair


def _head2(self, c, J, ps, l):
    H, skin, hair = self._shapes(J)
    pc = self.pc; k = self.kind; F = FEAT[k]
    R = lambda r: r * self.headk
    c.drawPath(skin, P(pc(SKIN))); self._shade(c, skin, pc(SKIN_SH), l, 12)
    if F['fade']:   # Leo's high fade: hair colour thinning down the side of the head
        c.save(); c.clipPath(skin, skia.ClipOp.kIntersect, True)
        c.drawPath(_sm_path([H(q) for q in F['fade']]), P(pc(HAIR), 120, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9)))
        c.restore()
    for hp_ in hair:
        c.drawPath(hp_, P(pc(HAIR))); self._shade(c, hp_, pc(HAIR_SH), l, 8)
    ex, ey = H(F['ear']); sc = R(1)
    c.save(); c.translate(ex, ey)
    c.drawOval(skia.Rect(-17 * sc, -24 * sc, 17 * sc, 24 * sc), P(pc(SKIN)))
    c.drawOval(skia.Rect(-8 * sc, -14 * sc, 8 * sc, 12 * sc), P(mix(pc(SKIN), pc(SKIN_SH), 0.85)))
    c.restore()
    (bx, by), rx, ry, ba = F['blush']; bx, by = H((bx, by))
    c.drawOval(skia.Rect(bx - rx * sc, by - ry * sc, bx + rx * sc, by + ry * sc), P((214, 112, 96), 255 * ba))
    ex, ey = H(F['eye']); ew, eh = F['ew'] * sc, F['eh'] * sc
    if ps.blink:
        c.drawLine(ex - ew, ey, ex + ew, ey, SP((52, 30, 22), 3))
    else:
        c.drawOval(skia.Rect(ex - ew, ey - eh, ex + ew, ey + eh), P((252, 248, 240)))
        ix, iy = H(F['iris'])
        c.save(); c.clipPath(_oval(ex, ey, ew, eh), skia.ClipOp.kIntersect, True)
        c.drawCircle(ix + 2.5 * ps.look, iy, F['ir'] * sc, P((52, 30, 20)))
        c.drawCircle(ix + 2.5 * ps.look + 2.5 * sc, iy - 3 * sc, 2.4 * sc, P((255, 255, 255)))
        c.restore()
        lp = skia.Path(); lp.moveTo(ex - ew * 1.05, ey - eh * 0.2); lp.quadTo(ex, ey - eh * 1.5, ex + ew * 1.05, ey - eh * 0.3)
        c.drawPath(lp, SP((36, 22, 16), (3.4 if F['lash'] else 2.6) * sc))
    by_ = -6 * getattr(ps, 'brow', 0.0)
    c.save(); c.translate(0, by_ * sc)
    c.drawPath(_sm_path([H(q) for q in F['brow']]), P((40, 26, 18)))
    c.restore()
    m0, m1, m2 = F['mouth']
    if ps.mouth > 0.05:
        mo = _sm_path([H(m0), H((m1[0], m1[1] + 11 * ps.mouth)), H(m2), H((m1[0], m1[1] - 2))])
        c.drawPath(mo, P((110, 44, 44)))
    else:
        mp = skia.Path(); mp.moveTo(*H(m0)); mp.quadTo(*H((m1[0], m1[1] + 3 * (ps.smile - 0.4))), *H(m2))
        c.drawPath(mp, SP((128, 62, 52), 3 * sc))


def _head_sil2(self, hd, HS):
    H, skin, hair = self._shapes(self._J_last)
    return [skin] + hair


def _neck2(self, J):
    h = self._hf(J); T = J['torso_f']; k = self.kind
    H = lambda q: h(*_hp(_hu(k, q)))
    return curve([H(_NAPE[k][0]), H(_NAPE[k][1]), H(_THROAT[k]), T(60, 350), T(0, 320), T(-46, 350)])


_orig_draw = Kid.draw


def _draw2(self, c, ps, *a, **kw):
    self._J_last = self.joints(ps)
    return _orig_draw(self, c, ps, *a, **kw)


Kid._shapes = _shapes
Kid._head = _head2
Kid.head_sil = _head_sil2
Kid._neck_path = _neck2
Kid.draw = _draw2
