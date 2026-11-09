"""The w1108-03 cast, each ONE skinned body from the people kit (person.py): the worker (flat cap, work jacket),
his wife (headscarf, blouse, long skirt bound across hips, thighs and shins so it swings with the legs), the baker
(white shirt, apron) and the pressman. A skirt is extra rest-pose artwork bound to the spine and both legs."""
import math
import skia
import person as PP, airman2 as A
from airman2 import P, SP, curve, union, mix


class Woman(PP.Person):
    def __init__(self, scale, skirt=(70, 58, 64), skirt_sh=(52, 42, 48), apron=None, **kw):
        self.skirt, self.skirt_sh, self.apron = skirt, skirt_sh, apron
        super().__init__(scale, cap=False, **kw)

    def _build_rest(self):
        L = super()._build_rest()
        J = self.J0; T = J['torso_f']
        bones = ['spine', 'thigh_n', 'thigh_f', 'shin_n', 'shin_f']
        sk = curve([T(-104, 60), T(-116, 0), (-136, -520), (-170, -300), (-186, -200), (-170, -174), (-20, -168), (130, -172),
                    (196, -180), (190, -240), (160, -380), (128, -560), T(104, 0), T(96, 60)])
        self._skirt_rings = None
        L.append(dict(grp='torso', col=self.skirt, kind='base', a=255, bones=bones, rings=self._bind(sk, bones, 60.0), limb=''))
        fold = curve([(10, -600), (22, -600), (40, -200), (24, -196)])
        L.append(dict(grp='torso', col=self.skirt_sh, kind='detail', a=200, bones=bones, rings=self._bind(fold, bones, 60.0), limb=''))
        fold2 = curve([(-70, -560), (-60, -560), (-96, -210), (-110, -214)])
        L.append(dict(grp='torso', col=self.skirt_sh, kind='detail', a=180, bones=bones, rings=self._bind(fold2, bones, 60.0), limb=''))
        if self.apron:
            ap = curve([T(70, 40), T(112, 30), (150, -260), (140, -240), (60, -250)])
            L.append(dict(grp='torso', col=self.apron, kind='detail', a=255, bones=bones, rings=self._bind(ap, bones, 60.0), limb=''))
        return L

    def _head(self, c, J, ps, l):
        super()._head(c, J, ps, l)
        h = self._hf(J)
        # the headscarf knot at the nape (scarf = the hair colour of this palette), and a softer brow line under it
        S = lambda pts: curve([h(*A._hp(p)) for p in pts])
        col = self.pc(A.HAIR)
        c.drawPath(S([(80, 176), (98, 170), (102, 192), (86, 200)]), P(mix(col, (0, 0, 0), 0.12)))
        c.drawPath(S([(84, 196), (96, 198), (90, 226), (80, 222)]), P(mix(col, (0, 0, 0), 0.22)))



def worker(scale):
    return PP.Person(scale, palette={A.OL: (78, 74, 70), A.OL_SH: (56, 52, 50), A.OL_HI: (104, 98, 92), A.CUFF: (78, 74, 70),
                                     A.BELT: (60, 46, 36), A.BELT_SH: (44, 34, 26), (150, 120, 80): (78, 74, 70),
                                     A.CAP: (66, 62, 60), A.CAP_SH: (48, 46, 44), A.SKIN: (226, 176, 140), A.SKIN_SH: (200, 150, 118),
                                     A.HAIR: (70, 52, 40), A.HAIR_SH: (50, 38, 30), A.BOOT_C: (54, 40, 32), A.BOOT_SH: (40, 30, 24)},
                     trouser=(62, 60, 66), collar=(196, 188, 170))


def wife(scale):
    return Woman(scale, skirt=(64, 72, 98), skirt_sh=(48, 54, 76), apron=(206, 196, 172),
                 palette={A.OL: (150, 92, 80), A.OL_SH: (120, 70, 62), A.OL_HI: (178, 120, 104), A.CUFF: (150, 92, 80),
                          A.BELT: (64, 72, 98), A.BELT_SH: (48, 54, 76), (150, 120, 80): (150, 92, 80),
                          A.SKIN: (234, 188, 156), A.SKIN_SH: (210, 162, 132), A.HAIR: (122, 46, 44), A.HAIR_SH: (96, 34, 34),
                          A.BOOT_C: (46, 36, 32), A.BOOT_SH: (34, 26, 24)}, trouser=(46, 40, 44), collar=(228, 220, 204))


def baker(scale):
    return PP.Person(scale, cap=False, palette={A.OL: (232, 228, 218), A.OL_SH: (200, 194, 184), A.OL_HI: (250, 248, 242),
                                                A.CUFF: (232, 228, 218), A.BELT: (232, 228, 218), A.BELT_SH: (200, 194, 184),
                                                (150, 120, 80): (232, 228, 218), A.SKIN: (220, 166, 130), A.SKIN_SH: (196, 144, 112),
                                                A.HAIR: (150, 140, 130), A.HAIR_SH: (120, 112, 104),
                                                A.BOOT_C: (50, 40, 34), A.BOOT_SH: (36, 28, 24)}, trouser=(74, 70, 66), collar=(240, 238, 232))


def pressman(scale):
    return PP.Person(scale, palette={A.OL: (70, 80, 96), A.OL_SH: (52, 60, 72), A.OL_HI: (94, 106, 124), A.CUFF: (70, 80, 96),
                                     A.BELT: (40, 34, 30), A.BELT_SH: (30, 24, 20), (150, 120, 80): (70, 80, 96),
                                     A.CAP: (52, 56, 64), A.CAP_SH: (40, 42, 48), A.SKIN: (214, 160, 124), A.SKIN_SH: (190, 138, 106),
                                     A.BOOT_C: (44, 34, 28), A.BOOT_SH: (32, 24, 20)}, trouser=(50, 56, 66))


def walk_kw(d, face=1, amp=16.0, arms=12, k=1.0):
    """a foot-planted walk keyed to distance travelled d in CANVAS px for a figure of scale k: one half cycle (pi of
    phase) covers exactly one step, the distance between the two feet at full stride (2 x leg length x sin(amp)), so
    the planted foot does not slide; legs swing in opposite phase, the arms counter-swing"""
    step = 2 * (A.L_THIGH + A.L_SHIN) * math.sin(math.radians(amp)) * k
    ph = d / step * math.pi; s = math.sin(ph)
    return dict(face=face, lean=5, thigh_n=amp * s, knee_n=-4 - amp * 1.1 * max(0.0, -s), thigh_f=-amp * s, knee_f=-4 - amp * 1.1 * max(0.0, s),
                uarm_n=-arms * s, elbow_n=22, uarm_f=arms * s, elbow_f=22, br=0.0)
