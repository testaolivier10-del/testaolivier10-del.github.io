"""Maya and Theo, each ONE skinned body (pipeline/people/person.py, linear blend skinning), from the Gemini model sheet
ref/cast_sheet.png (side view). A new character is a palette, clothes and hair on the same body (video standard 0):
- Maya (16): mustard hoodie with the sleeves pushed to the elbows (the rolled sleeve), navy jeans with a rolled cuff,
  white sneakers, high ponytail.
- Theo (8): light blue pajamas with long sleeves and long legs, grey socks, short curly hair, a child's bigger head.
Heads: designed outlines in the head sheet units of head_shapes.json (face toward +x)."""
import math
import numpy as np
import skia
import person as PR
import airman2 as A
from airman2 import (P, SP, curve, union, inter, diff, circ, SKIN, SKIN_SH, OL, OL_SH, OL_HI, CUFF, BELT, BELT_SH, BOOT_C, BOOT_SH,
                     SOLE, HAIR, HAIR_SH, RIM, TORSO, CUFFB, BOOT, UARM, SLEEVE_ROLL, FARM, L_SPINE, Pose, HEAD_SHAPES, _hp, mix)

Pose = A.Pose
SK, SK_SH = (187, 117, 83), (160, 96, 66)
HR, HR_SH = (66, 37, 26), (46, 26, 18)

MAYA_HAIR = [(244, 100), (240, 76), (224, 58), (182, 44), (134, 50), (98, 74), (80, 114), (82, 160), (98, 198), (120, 216),
             (138, 194), (134, 162), (150, 132), (196, 104), (226, 98)]
PONY = [(104, 62), (82, 40), (52, 40), (30, 70), (20, 130), (28, 196), (48, 250), (62, 262), (54, 214), (50, 160), (60, 110), (80, 82), (98, 78)]
THEO_BASE = [(244, 104), (242, 80), (222, 56), (180, 42), (130, 46), (94, 70), (78, 110), (80, 156), (100, 192), (124, 206),
             (138, 186), (134, 158), (152, 132), (196, 108), (228, 104)]
THEO_CURLS = [(244, 96, 20), (232, 66, 24), (204, 46, 26), (170, 36, 27), (134, 40, 27), (102, 58, 26), (82, 90, 24), (74, 126, 22),
              (80, 160, 20), (96, 190, 18), (188, 54, 18), (150, 50, 18), (116, 74, 18)]


class Kid(PR.Person):
    """the shared body with casual clothes; kind 'maya' or 'theo'"""

    def __init__(self, kind, scale):
        self.kind = kind
        if kind == 'maya':
            pal = {SKIN: SK, SKIN_SH: SK_SH, HAIR: HR, HAIR_SH: HR_SH, OL: (217, 152, 61), OL_SH: (180, 118, 40), OL_HI: (236, 182, 92),
                   CUFF: (206, 140, 52), BOOT_C: (246, 244, 238), BOOT_SH: (206, 204, 200), SOLE: (178, 180, 186)}
            super().__init__(scale, palette=pal, cap=False, trouser=(37, 53, 78), collar=(217, 152, 61))
            self.headk = 1.25
        else:
            pal = {SKIN: SK, SKIN_SH: SK_SH, HAIR: HR, HAIR_SH: HR_SH, OL: (136, 177, 213), OL_SH: (104, 142, 184), OL_HI: (170, 202, 230),
                   CUFF: (124, 164, 204), BOOT_C: (192, 192, 196), BOOT_SH: (160, 160, 166), SOLE: (176, 176, 182)}
            super().__init__(scale, palette=pal, cap=False, trouser=(136, 177, 213), forearm=(136, 177, 213), collar=(124, 164, 204))
            self.headk = 1.25 * 1.6
        self.layers = self._casual()

    # the head scale differs for the child; everything else is the shared skeleton
    def _hf(self, J):
        cx, cy = J['head_piv']; a = math.radians(J['head_ang'])
        ca, sa = math.cos(a), math.sin(a)
        ox, oy = 22.0, 78.0; k = getattr(self, 'headk', 1.25)
        return lambda px, py: (cx + k * ((px - ox) * ca - (py - oy) * sa), cy + k * ((px - ox) * sa + (py - oy) * ca))

    def _casual(self):
        """rest-pose artwork: the airman's layers minus the belt, pocket, laces and seams; hoodie or pajama details instead"""
        J = self.J0; L = []
        add = lambda grp, path, col, bones, kind='base', sigma=10.0, a=255: L.append(dict(
            grp=grp, col=col, kind=kind, a=a, bones=bones, rings=self._bind(path, bones, sigma),
            limb='arm' if any(b.startswith('uarm') for b in bones) else ('leg' if any(b.startswith(('thigh', 'shin')) for b in bones) else '')))
        stroke = lambda path, w: (lambda d: (SP((0, 0, 0), w).getFillPath(path, d), d)[1])(skia.Path())
        line = lambda a, b, w: stroke(self._seg(a, b), w)
        T = J['torso_f']
        maya = self.kind == 'maya'
        for s in 'fn':
            g = 'far' if s == 'f' else 'leg'
            legb = ['spine', 'thigh_' + s, 'shin_' + s]
            o, an = J['boot_' + s]; a = math.radians(an); ca, sa = math.cos(a), math.sin(a)
            fb = lambda px, py: (o[0] + px * ca - py * sa, o[1] + px * sa + py * ca)
            if maya:   # a low sneaker: a rounded upper, a thick sole, a toe cap line
                shoe = [(-62, -34), (44, -34), (70, 40), (112, 76), (126, 104), (122, 132), (-70, 132), (-74, 70)]
                add(g, curve([fb(*p) for p in shoe]), BOOT_C, ['boot_' + s])
                add(g, curve([fb(*p) for p in [(-74, 108), (128, 108), (126, 138), (-74, 138)]]), SOLE, ['boot_' + s], 'detail')
                add(g, line(fb(58, 60), fb(20, 84), 4), BOOT_SH, ['boot_' + s], 'detail')
            else:      # a sock foot: slimmer, no sole
                sock = [(-56, -30), (48, -30), (52, 40), (98, 84), (118, 112), (112, 134), (-62, 134), (-66, 60)]
                add(g, curve([fb(*p) for p in sock]), BOOT_C, ['boot_' + s])
            add(g, self._leg_path(J, s), OL, legb, sigma=14)
            if maya:
                add(g, self.part(J, 'shin_' + s, CUFFB), CUFF, ['shin_' + s])
            tf = self.frame(*J['thigh_' + s])
            add(g, line(tf(34, 140), tf(28, 250), 3), OL_SH, legb, 'detail', a=110)
        for s in 'fn':
            g = 'far' if s == 'f' else 'arm'
            armb = ['uarm_' + s, 'farm_' + s]
            o, _ = J['farm_' + s]
            fa = union([self.part(J, 'farm_' + s, FARM), circ(o[0], o[1], 38)])
            add(g, fa, SKIN, ['uarm_' + s, 'farm_' + s, 'hand_' + s], sigma=10)
            add(g, self.part(J, 'uarm_' + s, UARM), OL, armb, sigma=12)
            if maya:    # the hoodie sleeve pushed up and bunched at the elbow
                add(g, self.part(J, 'uarm_' + s, SLEEVE_ROLL), CUFF, ['uarm_' + s])
                uf = self.frame(*J['uarm_' + s])
                for yy in (170, 196):
                    add(g, line(uf(-56, yy), uf(58, yy + 4), 3), OL_SH, ['uarm_' + s], 'detail', a=150)
            else:       # pajama cuff at the wrist
                ff = self.frame(*J['farm_' + s])
                add(g, line(ff(-34, 186), ff(30, 184), 6), OL_SH, ['farm_' + s], 'detail', a=120)
        add('neck', self._neck_path(J), SKIN, ['spine', 'neck', 'head'], sigma=24)
        torso = curve([T(px, py) for px, py in TORSO])
        add('torso', torso, OL, ['spine'])
        if maya:
            # hoodie: ribbed hem band, kangaroo pocket edge, the hood folded on the back of the neck, drawstring
            hem = skia.Path(); hem.moveTo(*T(-160, -50)); hem.lineTo(*T(160, -50)); hem.lineTo(*T(160, 30)); hem.lineTo(*T(-160, 30)); hem.close()
            add('torso', inter(hem, torso), CUFF, ['spine'])
            add('torso', stroke(curve([T(px, py) for px, py in [(10, 40), (40, 140), (100, 150)]]), 4), OL_SH, ['spine'], 'detail', a=170)
            hood = curve([T(px, py) for px, py in [(-120, 300), (-136, 360), (-110, 420), (-60, 440), (-10, 420), (-20, 370), (-60, 330)]])
            add('collar', hood, OL, ['spine', 'neck'], sigma=30)
            add('collar', stroke(curve([T(px, py) for px, py in [(-100, 330), (-110, 380), (-70, 420)]]), 4), OL_SH, ['spine'], 'detail', a=170)
            add('torso', line(T(70, 350), T(78, 270), 4), (246, 240, 226), ['spine'], 'detail')
        else:
            # pajama top: a round neckband and three buttons
            add('torso', stroke(curve([T(px, py) for px, py in [(-50, 360), (10, 340), (70, 352)]]), 7), OL_SH, ['spine', 'neck'], 'detail', a=150)
            for k in range(3):
                add('torso', circ(*T(92, 120 + k * 70), 7), (246, 246, 250), ['spine'], 'detail')
        collar = curve([T(px, py) for px, py in [(-58, 360), (-44, 386), (-8, 392), (30, 386), (66, 360), (70, 340), (40, 350), (0, 362), (-38, 356)]])
        add('collar', collar, OL, ['spine', 'neck'], sigma=30)
        return L

    def _head(self, c, J, ps, l):
        h = self._hf(J); pc = self.pc
        S = lambda pts: curve([h(*_hp(p)) for p in pts])
        if self.kind == 'maya':
            pony = S(PONY)
            # the ponytail sways a little with the head (secondary motion from the pose's own time)
            c.drawPath(pony, P(pc(HAIR))); self._shade(c, pony, pc(HAIR_SH), l, 10)
        head = S(HEAD_SHAPES['skin'])
        c.drawPath(head, P(pc(SKIN))); self._shade(c, head, pc(SKIN_SH), l, 14)
        c.save(); c.clipPath(head, skia.ClipOp.kIntersect, True)
        c.drawPath(S(HEAD_SHAPES['cheek']), P(mix(pc(SKIN), pc(SKIN_SH), 0.6))); c.restore()
        if self.kind == 'maya':
            hair = S(MAYA_HAIR)
        else:
            hair = union([S(THEO_BASE)] + [circ(*h(*_hp((x, y))), r * self.headk) for x, y, r in THEO_CURLS])
        c.drawPath(hair, P(pc(HAIR))); self._shade(c, hair, pc(HAIR_SH), l, 8)
        if self.kind == 'maya':
            tie = circ(*h(*_hp((98, 70))), 9 * self.headk)
            c.drawPath(tie, P((214, 92, 80)))
        ear = S(HEAD_SHAPES['ear'])
        c.drawPath(ear, P(pc(SKIN))); self._shade(c, ear, pc(SKIN_SH), l, 6)
        c.drawPath(S([(130, 150), (144, 148), (145, 172), (135, 178), (132, 164)]), P(pc(SKIN_SH)))
        c.drawPath(S([(212, 134), (230, 128), (248, 130), (248, 135), (230, 134), (213, 139)]), P(pc(HAIR)))
        if ps.blink:
            c.drawLine(*h(*_hp((216, 149))), *h(*_hp((240, 149))), SP((52, 34, 24), 3))
        else:
            c.drawPath(S([(216, 150), (228, 139), (243, 143), (239, 156), (224, 157)]), P((250, 246, 238)))
            c.drawCircle(*h(*_hp((232 + 3 * ps.look, 148))), 5.0 if self.kind == 'maya' else 6.2, P((40, 24, 18)))
            ep = skia.Path(); ep.moveTo(*h(*_hp((214, 148)))); ep.quadTo(*h(*_hp((228, 138))), *h(*_hp((244, 143))))
            c.drawPath(ep, SP((44, 26, 20), 3.0))
            if self.kind == 'maya':
                c.drawLine(*h(*_hp((243, 143))), *h(*_hp((250, 139))), SP((44, 26, 20), 2.6))
        c.drawPath(S([(250, 183), (266, 184), (260, 189), (250, 188)]), P(pc(SKIN_SH)))
        sm_ = ps.smile
        mp = skia.Path(); mp.moveTo(*h(*_hp((236, 206 + 2 * sm_)))); mp.quadTo(*h(*_hp((244, 210 + 3 * sm_))), *h(*_hp((254, 204))))
        c.drawPath(mp, SP((130, 64, 54), 3))
        if ps.mouth > 0.05:
            c.drawPath(S([(238, 205), (252, 203), (250, 203 + 12 * ps.mouth), (240, 205 + 10 * ps.mouth)]), P((96, 40, 40)))

    def head_sil(self, hd, HS):
        S = lambda pts: curve([hd(*_hp(p)) for p in pts])
        if self.kind == 'maya':
            return [HS('skin'), S(MAYA_HAIR), S(PONY)]
        return [HS('skin'), S(THEO_BASE)] + [circ(*hd(*_hp((x, y))), r * self.headk) for x, y, r in THEO_CURLS]

    def _silhouette(self, J, ps):
        return skia.Path()


MAYA = None
THEO = None


def maya():
    global MAYA
    if MAYA is None:
        MAYA = Kid('maya', 0.40)
    return MAYA


def theo():
    global THEO
    if THEO is None:
        THEO = Kid('theo', 0.25)
    return THEO
