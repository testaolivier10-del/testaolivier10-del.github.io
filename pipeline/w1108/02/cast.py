"""w1108-02 cast: the runner (singlet, shorts, race bib, running shoes) and the medics (navy uniform, reflective
stripe, navy cap), all on the one skinned body of pipeline/people (person.py)."""
import sys; sys.path[:0] = ['/home/claude/w1108/02']
import person as PP, airman2 as A2
from airman2 import curve, union, inter, circ

SHORTS = (34, 38, 52); BIB = (246, 246, 240)


class Runner(PP.Person):
    def _build_rest(self):
        L = super()._build_rest()
        J = self.J0
        for s in 'fn':
            g = 'far' if s == 'f' else 'leg'
            pts = [(-104, -34), (-70, -64), (20, -68), (100, -12), (98, 60), (94, 118), (-70, 124), (-94, 60)]
            L.append(dict(grp=g, col=SHORTS, kind='base', a=255, bones=['spine', 'thigh_' + s],
                          rings=self._bind(self.part(J, 'thigh_' + s, pts), ['spine', 'thigh_' + s], 14), limb=''))
        T = J['torso_f']
        bib = curve([T(px, py) for px, py in [(-20, 130), (80, 128), (82, 230), (-18, 232)]])
        L.append(dict(grp='torso', col=BIB, kind='detail', a=255, bones=['spine'], rings=self._bind(bib, ['spine'], 10), limb=''))
        L.append(dict(grp='torso', col=(63, 194, 169), kind='detail', a=255, bones=['spine'],
                      rings=self._bind(curve([T(px, py) for px, py in [(-19, 200), (81, 198), (82, 228), (-18, 230)]]), ['spine'], 10), limb=''))
        L.append(dict(grp='torso', col=(60, 60, 70), kind='detail', a=255, bones=['spine'],
                      rings=self._bind(curve([T(px, py) for px, py in [(6, 150), (58, 149), (58, 176), (6, 177)]]), ['spine'], 10), limb=''))
        return L


def runner(scale):
    return Runner(scale, cap=False, palette={
        A2.OL: (226, 92, 52), A2.OL_SH: (180, 66, 38), A2.OL_HI: (248, 140, 96), A2.CUFF: (226, 92, 52),
        A2.BELT: (226, 92, 52), A2.BELT_SH: (180, 66, 38), (150, 120, 80): (226, 92, 52),
        A2.SKIN: (204, 146, 108), A2.SKIN_SH: (176, 120, 88), A2.BOOT_C: (236, 240, 244), A2.BOOT_SH: (190, 196, 206),
        A2.SOLE: (60, 200, 180)}, sleeve=(204, 146, 108), trouser=(204, 146, 108))


def medic(scale, skin=(170, 118, 86), skin_sh=(146, 98, 70), hair=None):
    pal = {A2.OL: (34, 46, 74), A2.OL_SH: (24, 32, 54), A2.OL_HI: (58, 72, 104), A2.CUFF: (34, 46, 74),
           A2.SKIN: skin, A2.SKIN_SH: skin_sh, A2.CAP: (30, 40, 66), A2.CAP_SH: (22, 30, 50), A2.BOOT_C: (30, 28, 30), A2.BOOT_SH: (20, 18, 20)}
    if hair: pal[A2.HAIR] = hair
    return PP.Person(scale, palette=pal, stripe=(214, 226, 96))
