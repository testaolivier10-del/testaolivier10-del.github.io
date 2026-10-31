"""Code built person in the house flat style, front view, made from the Gemini reference ref/anat.png (anatomical
position) used only as a guide: proportions, colours, the palms forward hands. Coordinates: origin between the feet
on the floor, y up is negative, about 700 units tall; draw(c, x, y, s) places the feet at x, y with scale s.
Arms are a two bone chain with a shoulder angle and an elbow bend; the hand turns from palm in (sup 0) to palm
forward (sup 1), which moves the thumb from the front of the hand to its lateral side."""
import math
import numpy as np
import skia

SKIN, SKIN_SH, SKIN_D = (246, 165, 128), (214, 118, 84), (200, 104, 74)
SHIRT, SHIRT_SH = (190, 195, 202), (150, 156, 168)
SHORTS, SHORTS_SH = (42, 64, 114), (30, 44, 86)
HAIR, HAIR_SH = (96, 94, 110), (70, 68, 84)
INK = (60, 36, 34)
RIM = (255, 198, 87)


def C(rgb, a=255):
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(max(0, min(255, a))))


def P(col, a=255):
    return skia.Paint(AntiAlias=True, Color=C(col, a))


def SP(col, w, a=255):
    return skia.Paint(AntiAlias=True, Color=C(col, a), Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                      StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)


def smooth_closed(pts):
    p = skia.Path(); n = len(pts)
    mids = [((pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2) for i in range(n)]
    p.moveTo(*mids[-1])
    for i in range(n):
        p.quadTo(pts[i][0], pts[i][1], mids[i][0], mids[i][1])
    p.close()
    return p


def flat(c, path, base, shade=None, off=(-7, -3), rim=True, rim_d=(3, 3), rim_a=220):
    c.drawPath(path, P(base))
    if shade is not None:
        q = skia.Path(path); q.offset(*off)
        d = skia.Op(path, q, skia.PathOp.kDifference_PathOp)
        if d is not None:
            c.drawPath(d, P(shade))
    if rim:
        q = skia.Path(path); q.offset(*rim_d)
        d = skia.Op(path, q, skia.PathOp.kDifference_PathOp)
        if d is not None:
            c.drawPath(d, P(RIM, rim_a))


def limb_path(a, b, wa, wb):
    a, b = np.array(a, float), np.array(b, float)
    v = b - a; L = np.linalg.norm(v) + 1e-6; n = np.array([-v[1], v[0]]) / L
    pts = [a + n * wa / 2, b + n * wb / 2, b - n * wb / 2, a - n * wa / 2]
    p = skia.Path(); p.moveTo(*pts[0]); p.lineTo(*pts[1]); p.lineTo(*pts[2]); p.lineTo(*pts[3]); p.close()
    ca = skia.Path(); ca.addCircle(*a, wa / 2); cb = skia.Path(); cb.addCircle(*b, wb / 2)
    return union(union(p, ca), cb)


def union(a, b):
    r = skia.Op(a, b, skia.PathOp.kUnion_PathOp)
    return r if r is not None else a


class PersonBuilt:
    UP, FORE = 120.0, 88.0

    def __init__(self, shirt=SHIRT, shirt_sh=SHIRT_SH, shorts=SHORTS, shorts_sh=SHORTS_SH, hair=HAIR, skin=SKIN, skin_sh=SKIN_SH):
        self.shirt, self.shirt_sh, self.shorts, self.shorts_sh = shirt, shirt_sh, shorts, shorts_sh
        self.hair, self.skin, self.skin_sh = hair, skin, skin_sh
        # pose: shoulder angle (deg from straight down, + = out to the side), elbow bend (deg), supination 0..1
        self.arm = {+1: [14.0, -4.0, 1.0], -1: [14.0, -4.0, 1.0]}
        self.back = False
        self.highlight = {}           # name -> alpha, glow on body parts

    # side +1 = figure's right (viewer's left), -1 = figure's left (viewer's right)
    def joints(self, side):
        sh = np.array([-84.0 * side, -522.0])
        a0, eb, _ = self.arm[side]
        a = math.radians(a0)
        d1 = np.array([-side * math.sin(a), math.cos(a)])
        el = sh + d1 * self.UP
        a2 = a + math.radians(eb)
        d2 = np.array([-side * math.sin(a2), math.cos(a2)])
        wr = el + d2 * self.FORE
        return sh, el, wr, d2

    def hand(self, c, side, wr, d, sup):
        """one hand shape (palm, fingers, thumb) pointing along d; palm forward (sup 1) shows the palm with the thumb
        lateral, palm in (sup 0) shows the narrow edge of the hand. Finger lines are drawn, not separate fingers."""
        ang = math.degrees(math.atan2(d[1], d[0])) - 90
        c.save(); c.translate(*wr); c.rotate(ang)
        L = -side; m = side
        k = 0.55 + 0.45 * sup          # how wide the hand reads
        th = sup                       # how far the thumb swings out to the side
        pts = [(m * 11 * k, -2), (L * 11 * k, -2), (L * 15 * k, 12), (L * (15 + 14 * th) * k + L * 4, 20 + 4 * th),
               (L * (17 + 19 * th) * k + L * 3, 29 + 2 * th), (L * (15 + 14 * th) * k, 34), (L * 16 * k, 33),
               (L * 15 * k, 46), (L * 11 * k, 60), (L * 3 * k, 64), (m * 5 * k, 63), (m * 12 * k, 56), (m * 15 * k, 44), (m * 15 * k, 14)]
        hp = smooth_closed(pts)
        flat(c, hp, self.skin, self.skin_sh, off=(3 * side, 0))
        if sup > 0.3:
            al = 200 * (sup - 0.3) / 0.7
            for fx in (-7, 0, 7):
                c.drawLine(fx * k, 44, fx * k * 1.05, 58 - abs(fx) * 0.3, SP(self.skin_sh, 2.4, al))
            c.drawArc(skia.Rect(-11 * k + L * 2, 18, 11 * k + L * 2, 36), 200 if L > 0 else -20, 140 if L > 0 else -140, False, SP(self.skin_sh, 2.2, al)) if False else None
            arc = skia.Path(); arc.moveTo(L * 8 * k, 30); arc.quadTo(0, 36, m * 9 * k, 28)
            c.drawPath(arc, SP(self.skin_sh, 2.2, al))
        c.restore()

    def arm_draw(self, c, side):
        sh, el, wr, d2 = self.joints(side)
        sup = self.arm[side][2]
        flat(c, limb_path(el, wr, 30, 22), self.skin, self.skin_sh, off=(5 * side, 0))
        flat(c, limb_path(sh, el, 36, 30), self.skin, self.skin_sh, off=(5 * side, 0))
        self.hand(c, side, wr, d2, sup)
        g = self.highlight.get(('forearm', side), 0)
        if g > 0:
            c.drawPath(limb_path(el, wr, 40, 32), skia.Paint(AntiAlias=True, Color=C((255, 214, 120), 120 * g),
                                                               MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8)))
        return sh, el, wr

    def sleeve_path(self, side):
        sh, el, _, _ = self.joints(side)
        d = (el - sh) / np.linalg.norm(el - sh); n = np.array([-d[1], d[0]])
        a0, b0 = sh - d * 10, sh + d * 54
        q = skia.Path(); q.moveTo(*(a0 + n * 20)); q.lineTo(*(b0 + n * 24)); q.lineTo(*(b0 - n * 24)); q.lineTo(*(a0 - n * 20)); q.close()
        cc = skia.Path(); cc.addCircle(*(sh - d * 2), 23)
        return union(q, cc)

    def shirt_path(self):
        """the shirt body with rounded shoulders, plus a short sleeve tube on each upper arm (no rounded end at the hem),
        joined into one outline so it reads as one shirt in any arm pose"""
        p = smooth_closed([(-24, -566), (24, -566), (64, -556), (86, -546), (84, -500), (78, -476), (72, -420), (75, -366),
                           (-75, -366), (-72, -420), (-78, -476), (-84, -500), (-86, -546), (-64, -556)])
        for side in (1, -1):
            sh, el, _, _ = self.joints(side)
            d = (el - sh) / np.linalg.norm(el - sh); n = np.array([-d[1], d[0]])
            a0, b0 = sh - d * 10, sh + d * 54
            q = skia.Path(); q.moveTo(*(a0 + n * 20)); q.lineTo(*(b0 + n * 24)); q.lineTo(*(b0 - n * 24)); q.lineTo(*(a0 - n * 20)); q.close()
            cc = skia.Path(); cc.addCircle(*(sh - d * 2), 23); q = union(q, cc)
            p = union(p, q)
        return p

    def draw(self, c, x, y, s, t=0.0):
        c.save(); c.translate(x, y); c.scale(s, s)
        br = 1.2 * math.sin(t * 1.7)
        mode = getattr(self, 'mode', 'stand')
        if mode == 'stand':
            self.legs_stand(c)
        elif mode == 'sit':
            self.legs_sit(c)
        elif mode == 'kneel':
            self.legs_kneel(c)
        c.save(); c.translate(0, -br)
        # neck first, with the shadow under the chin
        neck = smooth_closed([(-20, -590), (20, -590), (21, -556), (24, -548), (-24, -548), (-21, -556)])
        flat(c, neck, self.skin, self.skin_sh, off=(-5, 0), rim=False)
        c.save(); c.clipPath(neck, doAntiAlias=True)
        c.drawOval(skia.Rect(-30, -604, 30, -572), P(self.skin_sh, 230))
        c.restore()
        # arms under the shirt, then the shirt (body and short sleeves as one shape)
        for side in (1, -1):
            self.arm_draw(c, side)
        flat(c, self.shirt_path(), self.shirt, self.shirt_sh, off=(-10, 0))
        c.drawPath(smooth_closed([(-20, -566), (20, -566), (12, -556), (-12, -556)]), P(self.shirt_sh, 200))
        if getattr(self, 'torso_extra', None):
            self.torso_extra(c)
        # head, a touch smaller than the first pass (reference proportions: about 1/7 of the height)
        c.save(); c.translate(0, -580); c.scale(0.9, 0.9); c.translate(0, 580)
        for ex in (-1, 1):
            ear = skia.Path(); ear.addOval(skia.Rect(ex * 47 - 8, -652, ex * 47 + 8, -620)); flat(c, ear, self.skin, self.skin_sh, rim=False, off=(-3 * ex, 0))
        head = smooth_closed([(-43, -652), (-41, -694), (0, -708), (41, -694), (43, -652), (41, -612), (26, -582), (0, -574), (-26, -582), (-41, -612)])
        flat(c, head, self.skin, self.skin_sh, off=(-6, 0))
        hs = getattr(self, 'hair_sh', HAIR_SH)
        if self.back:
            hair = smooth_closed([(-45, -650), (-44, -694), (0, -710), (44, -694), (45, -650), (40, -606), (0, -592), (-40, -606)])
            flat(c, hair, self.hair, hs)
        else:
            hair = smooth_closed([(-45, -638), (-46, -690), (-18, -712), (18, -712), (46, -690), (45, -638), (40, -646), (34, -672),
                                  (6, -674), (0, -668), (-6, -674), (-34, -672), (-40, -646)])
            flat(c, hair, self.hair, hs, off=(-4, 0), rim_a=120)
            for ex in (-1, 1):
                c.drawLine(ex * 10, -647, ex * 27, -648, SP(hs, 4))
                c.drawOval(skia.Rect(ex * 18 - 4.5, -639, ex * 18 + 4.5, -628), P(INK))
            c.drawOval(skia.Rect(-6, -622, 6, -614), P(self.skin_sh, 170))
            c.drawLine(-11, -602, 11, -602, SP(self.skin_sh, 3.2))
            c.drawLine(-6, -595, 6, -595, SP(self.skin_sh, 2.4, 140))
        c.restore()
        c.restore()
        c.restore()

    def legs_stand(self, c):
        for side in (1, -1):
            hx = -34 * side; o = -side
            leg = smooth_closed([(hx - 34, -250), (hx + 34, -250), (hx + 23, -142), (hx + 26, -96), (hx + 14, -30),
                                 (hx - 14, -30), (hx - 25, -96), (hx - 22, -142)])
            flat(c, leg, self.skin, self.skin_sh, off=(5 * side, 0))
            c.drawArc(skia.Rect(hx - 12, -150, hx + 12, -132), 20, 140, False, SP(self.skin_sh, 2.2, 140))
            foot = smooth_closed([(hx - o * 13, -38), (hx + o * 13, -38), (hx + o * 24, -14), (hx + o * 24, 4), (hx - o * 19, 4), (hx - o * 19, -12)])
            flat(c, foot, getattr(self, 'shoe', self.skin), getattr(self, 'shoe_sh', self.skin_sh), off=(3 * side, 0))
            if not getattr(self, 'shoe', None):
                for k in range(3):
                    tx = hx + o * (2 + k * 7)
                    c.drawLine(tx, -5, tx, 1, SP(self.skin_sh, 1.8, 150))
        self.shorts_draw(c)

    def shorts_draw(self, c):
        if getattr(self, 'pants', False):
            for side in (1, -1):
                hx = -34 * side
                leg = smooth_closed([(hx - 36, -380), (hx + 36, -380), (hx + 28, -190), (hx + 21, -40), (hx - 21, -40), (hx - 28, -190)])
                flat(c, leg, self.shorts, self.shorts_sh, off=(6 * side, 0))
                if getattr(self, 'stripe', None):
                    c.drawRect(skia.Rect(hx - 24, -150, hx + 24, -136), P(self.stripe))
        sh_ = skia.Path(); sh_.moveTo(-72, -376); sh_.lineTo(72, -376); sh_.quadTo(80, -350, 78, -300); sh_.lineTo(75, -206)
        sh_.lineTo(6, -206); sh_.lineTo(0, -282); sh_.lineTo(-6, -206); sh_.lineTo(-75, -206); sh_.lineTo(-78, -300); sh_.quadTo(-80, -350, -72, -376); sh_.close()
        flat(c, sh_, self.shorts, self.shorts_sh, off=(-10, 0))
        c.drawLine(0, -372, 0, -300, SP(self.shorts_sh, 3, 180))

    def legs_sit(self, c):
        """sitting on the ground facing us with the legs stretched out toward the viewer (foreshortened)"""
        c.translate(0, 300)           # hips come down to the ground line
        for side in (1, -1):
            hx = -46 * side
            leg = smooth_closed([(hx - 30, -380), (hx + 30, -380), (hx + 40, -290), (hx + 36, -250), (hx - 36, -250), (hx - 40, -290)])
            flat(c, leg, self.skin, self.skin_sh, off=(5 * side, 0))
            cuff = smooth_closed([(hx - 34, -386), (hx + 34, -386), (hx + 38, -330), (hx - 38, -330)])
            flat(c, cuff, self.shorts, self.shorts_sh, off=(5 * side, 0))
            sole = skia.Path(); sole.addOval(skia.Rect(hx - 34, -296, hx + 34, -214))
            flat(c, sole, getattr(self, 'shoe', SHORTS), getattr(self, 'shoe_sh', SHORTS_SH), off=(4 * side, 0))
        seat = smooth_closed([(-84, -392), (84, -392), (88, -350), (-88, -350)])
        flat(c, seat, self.shorts, self.shorts_sh, off=(-8, 0))

    def legs_kneel(self, c):
        c.translate(0, 190)
        for side in (1, -1):
            hx = -40 * side
            thigh = smooth_closed([(hx - 32, -380), (hx + 32, -380), (hx + 26, -200), (hx - 26, -200)])
            flat(c, thigh, self.shorts, self.shorts_sh, off=(6 * side, 0))
            if getattr(self, 'stripe', None):
                c.drawRect(skia.Rect(hx - 27, -250, hx + 27, -236), P(self.stripe))
            knee = skia.Path(); knee.addOval(skia.Rect(hx - 30, -216, hx + 30, -176))
            flat(c, knee, self.shorts, self.shorts_sh, off=(5 * side, 0))
        hips = smooth_closed([(-80, -390), (80, -390), (82, -330), (-82, -330)])
        flat(c, hips, self.shorts, self.shorts_sh, off=(-8, 0))

    # handy landmarks in figure units (for arrows and highlights)
    LM = dict(nose=(0, -618), mouth=(0, -602), eye_r=(-18, -634), eye_l=(18, -634), ear_r=(-47, -636), ear_l=(47, -636),
              head=(0, -700), chest=(0, -490), navel=(0, -400), hip_r=(-40, -360), knee_r=(-34, -141), knee_l=(34, -141),
              feet=(0, 0), toes_r=(-36, -4))

    def lm(self, name, x, y, s):
        px, py = self.LM[name]
        return x + px * s, y + py * s

    def joint_world(self, side, which, x, y, s):
        sh, el, wr, _ = self.joints(side)
        p = dict(shoulder=sh, elbow=el, wrist=wr)[which]
        return x + p[0] * s, y + p[1] * s


# the traced, rigged reference figure is the standard person (Olivier 2026-10-30: trace the reference into code)
from tperson import TPerson as Person  # noqa: E402
