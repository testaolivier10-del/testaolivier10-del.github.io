"""The airman, built in code from his Gemini model sheet (ref/airman_sheet.png, side view), Olivier 2026-11-01.

Not tubes: every body part is a DESIGNED outline measured off the reference (deltoid, rolled sleeve, forearm taper,
seat of the coverall, trouser blousing over the boot, the boot itself, the head profile with cap, nose, jaw, ear).
Each part lives in its bone's frame and turns at real joints with real limits (elbows and knees bend one way only).
Parts of the same material are unioned into ONE path before filling, with round joint caps sized to the part, so a bend
never shows a seam. One light over the whole figure: a hard shade tone on the side away from the light, an amber rim
on the lit edge, soft fold lines at the joints and seams/pocket/belt details inside the cloth.

Units: the reference crop at 2x (figure about 1365 tall, ground at y=0 in pose space). Profile facing +x."""
import math
import skia

LIM = dict(elbow=(0, 150), knee=(-150, 0), wrist=(-80, 70), neck=(-22, 26), ankle=(-35, 30))


def C(rgb, a=255):
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(max(0, min(255, a))))


def P(col, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), **k)


def SP(col, w, a=255):
    return skia.Paint(AntiAlias=True, Color=C(col, a), Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                      StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)


def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def curve(pts):
    n = len(pts); p = skia.Path(); p.moveTo(*pts[0])
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        p.cubicTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, *p2)
    p.close(); return p


def opn(a, b, k):
    r = skia.Op(a, b, k)
    return r if r is not None else skia.Path()


def union(ps):
    ps = [p for p in ps if p is not None and not p.isEmpty()]
    if not ps: return skia.Path()
    b = skia.OpBuilder()
    for p in ps: b.add(p, skia.PathOp.kUnion_PathOp)
    return b.resolve() or ps[0]


def inter(a, b): return opn(a, b, skia.PathOp.kIntersect_PathOp)
def diff(a, b): return opn(a, b, skia.PathOp.kDifference_PathOp)


def circ(x, y, r):
    p = skia.Path(); p.addCircle(x, y, r); return p


# ------------------------------------------------------------------ palette from the sheet
SKIN, SKIN_SH = (227, 154, 110), (205, 139, 98)
OL, OL_SH, OL_HI = (112, 118, 80), (80, 85, 56), (138, 144, 100)
CUFF = (136, 140, 98)
BELT, BELT_SH = (82, 54, 40), (60, 38, 28)
BOOT_C, BOOT_SH, SOLE = (122, 72, 46), (92, 52, 32), (58, 38, 28)
HAIR, HAIR_SH = (58, 40, 30), (40, 28, 22)
CAP, CAP_SH = (100, 106, 70), (74, 80, 50)
RIM = (255, 198, 87)

# ------------------------------------------------------------------ part outlines in bone frames
# local frame: bone from (0,0) at the parent joint, +y along the bone, +x toward the front (the way he faces).
L_THIGH, L_SHIN, L_UARM, L_FARM, L_SPINE, L_NECK = 290, 250, 215, 200, 380, 92
THIGH = [(-100, -30), (-70, -60), (20, -64), (96, -10), (92, 60), (80, 150), (66, 250), (58, 300), (-60, 300), (-66, 240),
         (-86, 150), (-108, 70), (-112, 10)]
SHIN = [(-62, -10), (60, -12), (56, 60), (52, 130), (60, 196), (70, 228), (-86, 230), (-84, 186), (-66, 140), (-76, 70)]
CUFFB = [(-86, 200), (72, 200), (78, 245), (-90, 248)]
BOOT = [(-66, -40), (52, -40), (56, 30), (96, 66), (120, 104), (122, 132), (-70, 132), (-74, 60)]
UARM = [(-60, -30), (-20, -62), (40, -44), (60, 10), (54, 90), (56, 150), (64, 165), (66, 215), (-70, 218), (-74, 160),
        (-66, 90), (-72, 20)]
SLEEVE_ROLL = [(-76, 150), (66, 150), (72, 222), (-78, 226)]
FARM = [(-40, -6), (30, -8), (34, 60), (28, 130), (22, 200), (-22, 202), (-30, 140), (-40, 60)]
TORSO = [(-112, -40), (-106, 30), (-104, 110), (-122, 220), (-128, 296), (-100, 346), (-40, 372), (30, 372), (80, 330),
         (114, 250), (110, 170), (92, 100), (88, 40), (110, -30), (40, -66), (-62, -66)]


def hand_shape(kind):
    """hand outlines in the wrist frame (+y toward the fingers, +x toward the thumb side / front)"""
    if kind == 'fist':
        return [(-26, -4), (24, -6), (36, 30), (34, 74), (8, 92), (-24, 86), (-34, 50)], [((26, 30), (34, 54), 11)]
    if kind == 'point':
        return [(-26, -4), (24, -6), (32, 30), (30, 52), (40, 70), (34, 130), (24, 132), (18, 80), (-6, 86), (-30, 70), (-34, 34)], [((26, 24), (40, 46), 10)]
    if kind == 'flat':
        return [(-24, -4), (24, -4), (30, 40), (26, 110), (6, 122), (-14, 118), (-26, 70)], [((24, 20), (40, 50), 10)]
    if kind == 'grip':
        return [(-26, -4), (24, -6), (34, 30), (30, 70), (6, 84), (-22, 78), (-32, 40)], [((26, 22), (38, 52), 11)]
    return [(-24, -4), (24, -6), (30, 40), (22, 96), (4, 104), (-14, 98), (-26, 50)], [((24, 22), (34, 54), 10)]   # relaxed


class Pose:
    def __init__(self, x=0, ground=0, s=1.0, face=1, lean=0, neck=0, thigh_n=0, knee_n=0, thigh_f=0, knee_f=0,
                 uarm_n=-3, elbow_n=22, uarm_f=-3, elbow_f=22, hand_n='fist', hand_f='fist', wrist_n=0, wrist_f=0,
                 ank_n=0, ank_f=0, br=0.0, blink=False, mouth=0.0, look=0.0, crouch=0.0, smile=0.4):
        self.__dict__.update(locals()); del self.__dict__['self']


class Airman:
    def __init__(self, scale=1.0):
        self.k = scale

    # ---------------------------------------------------------- skeleton
    @staticmethod
    def frame(o, deg):
        a = math.radians(deg)
        d = (math.sin(a), math.cos(a)); n = (math.cos(a), -math.sin(a))
        return lambda px, py: (o[0] + n[0] * px + d[0] * py, o[1] + n[1] * px + d[1] * py)

    def joints(self, ps):
        """pose space: facing +x, ground at y=0, y down. Angles from straight down, + swings the limb forward."""
        J = {}
        kn = max(LIM['knee'][0], min(LIM['knee'][1], ps.knee_n)); kf = max(LIM['knee'][0], min(LIM['knee'][1], ps.knee_f))
        # hip height from the near leg standing on the ground (or the deeper of the two legs)
        def leg_drop(th, k):
            a1 = math.radians(th); a2 = math.radians(th + k)
            return L_THIGH * math.cos(a1) + L_SHIN * math.cos(a2) + 150
        hy = -max(leg_drop(ps.thigh_n, kn), leg_drop(ps.thigh_f, kf))
        hip = (0.0, hy)
        J['hip'] = hip
        J['spine'] = 180 - ps.lean
        top = self.frame(hip, 180 - ps.lean)
        J['torso_f'] = lambda px, py: top(-px, py)          # spine frame points up; flip x so +x stays front
        J['neck0'] = J['torso_f'](8, L_SPINE - 10)
        na = 180 - ps.lean + max(LIM['neck'][0], min(LIM['neck'][1], ps.neck)) * 0.5
        nf = self.frame(J['neck0'], na)
        J['neck_f'] = lambda px, py: nf(-px, py)
        J['head_c'] = J['neck_f'](-4, 168)
        J['head_piv'] = J['neck_f'](20, 24)
        J['head_ang'] = -ps.lean + max(LIM['neck'][0], min(LIM['neck'][1], ps.neck))
        J['sh'] = J['torso_f'](-22, L_SPINE - 78)
        for s, th, k, ua, el, wr, an in (('n', ps.thigh_n, kn, ps.uarm_n, ps.elbow_n, ps.wrist_n, ps.ank_n),
                                         ('f', ps.thigh_f, kf, ps.uarm_f, ps.elbow_f, ps.wrist_f, ps.ank_f)):
            el = max(LIM['elbow'][0], min(LIM['elbow'][1], el))
            h0 = (hip[0] + (0 if s == 'n' else -6), hip[1])
            J['thigh_' + s] = (h0, th)
            knee = self.frame(h0, th)(0, L_THIGH)
            J['shin_' + s] = (knee, th + k)
            ank = self.frame(knee, th + k)(0, L_SHIN)
            J['boot_' + s] = (ank, max(LIM['ankle'][0], min(LIM['ankle'][1], an)))
            sh = J['sh'] if s == 'n' else (J['sh'][0] + 34, J['sh'][1] + 8)
            J['uarm_' + s] = (sh, ua - ps.lean * 0.0)
            elb = self.frame(sh, ua)(0, L_UARM)
            J['farm_' + s] = (elb, ua + el)
            wri = self.frame(elb, ua + el)(0, L_FARM)
            J['hand_' + s] = (wri, ua + el + max(LIM['wrist'][0], min(LIM['wrist'][1], wr)))
        return J

    def part(self, J, key, pts, extra=None):
        o, deg = J[key]
        f = self.frame(o, deg)
        return curve([f(px, py) for px, py in pts])

    # ---------------------------------------------------------- draw
    def draw(self, c, ps, light=(0.75, -0.65), rim=RIM, far_dim=0.82, tint=None, shadow=True, world=False):
        J = self.joints(ps)
        c.save()
        c.translate(ps.x, ps.ground); c.scale(ps.s * self.k * ps.face, ps.s * self.k)
        lx = light[0] * (ps.face if world else 1); ly = light[1]
        if shadow:
            c.drawOval(skia.Rect(-170, -14, 220, 14), P((20, 20, 24), 70, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8)))
        dim = lambda col: mix(col, (24, 26, 34), 1 - far_dim)
        # far side: arm and leg, one darker tone set
        self._leg(c, J, 'f', dim, (lx, ly), rim, rim_on=False)
        self._arm(c, J, 'f', dim, (lx, ly), rim, rim_on=False, ps=ps)
        # body
        torso = curve([J['torso_f'](px, py) for px, py in TORSO])
        neck = self._neck_path(J)
        cloth = union([torso])
        # ONE figure: the near side is a single silhouette; the shade band and the rim come from that one outline,
        # so the head, neck, chest and near limbs share one continuous edge instead of each part having its own
        self.S = self._silhouette(J, ps)
        q = skia.Path(self.S); q.offset(-lx * 16, -ly * 16); self._B = diff(self.S, q)
        c.drawPath(neck, P(SKIN)); self._shade(c, neck, SKIN_SH, (lx, ly), 16)
        c.save(); c.clipPath(neck, skia.ClipOp.kIntersect, True)
        hf = self._hf(J); c.drawPath(curve([hf(*_hp(p)) for p in HEAD_SHAPES['jawshadow']]), P(SKIN_SH))
        c.restore()
        self._leg(c, J, 'n', lambda x: x, (lx, ly), rim, torso=cloth)
        c.drawPath(cloth, P(OL)); self._shade(c, cloth, OL_SH, (lx, ly), 18)
        # belt, chest pocket, button placket, collar
        c.save(); c.clipPath(cloth, skia.ClipOp.kIntersect, True)
        a, b = J['torso_f'](-140, 10), J['torso_f'](140, 10)
        bl = skia.Path(); bl.moveTo(*J['torso_f'](-140, 6)); bl.lineTo(*J['torso_f'](140, 6)); bl.lineTo(*J['torso_f'](140, 46)); bl.lineTo(*J['torso_f'](-140, 46)); bl.close()
        c.drawPath(bl, P(BELT)); c.drawPath(inter(bl, self._half(J, (lx, ly))), P(BELT_SH))
        bk = curve([J['torso_f'](px, py) for px, py in [(60, 12), (92, 12), (92, 40), (60, 40)]]); c.drawPath(bk, P((150, 120, 80)))
        pk = curve([J['torso_f'](px, py) for px, py in [(36, 230), (90, 232), (88, 290), (40, 292)]])
        c.drawPath(pk, SP(OL_SH, 4))
        c.drawCircle(*J['torso_f'](64, 266), 5, P(OL_HI))
        c.drawLine(*J['torso_f'](98, 60), *J['torso_f'](104, 330), SP(OL_SH, 4))
        c.restore()
        self._head(c, J, ps, (lx, ly))
        collar = curve([J['torso_f'](px, py) for px, py in [(-58, 360), (-44, 396), (-8, 404), (30, 396), (66, 360), (84, 322), (60, 318), (36, 352), (0, 372), (-38, 366)]])
        c.drawPath(collar, P(OL)); self._shade(c, collar, OL_SH, (lx, ly), 8)
        c.drawPath(curve([J['torso_f'](px, py) for px, py in [(36, 352), (60, 318), (84, 322), (70, 300), (46, 330)]]), P(OL_SH))
        self._rim(c, collar, (lx, ly), rim, 170)
        self._arm(c, J, 'n', lambda x: x, (lx, ly), rim, ps=ps, body=union([cloth, neck]))
        # one rim over the one silhouette
        whole = union([cloth, neck])
        self._B = None
        self._rim(c, self.S, (lx, ly), rim, force=True)
        if tint is not None:
            c.save(); c.clipPath(union([whole, self._leg_path(J, 'n'), self._leg_path(J, 'f'), self._arm_path(J, 'n', ps), self._arm_path(J, 'f', ps)]), skia.ClipOp.kIntersect, True)
            c.drawPaint(P(tint[:3], tint[3])); c.restore()
        c.restore()
        return J

    def _half(self, J, l):
        p = skia.Path(); x, y = J['hip']; lx, ly = l
        p.addRect(skia.Rect(x - 2000, y - 2000, x + 2000, y + 2000)) if False else None
        # the half plane away from the light
        nx, ny = -lx, -ly
        cx, cy = J['torso_f'](0, 180)
        q = skia.Path(); big = 3000
        q.moveTo(cx + ny * big, cy - nx * big); q.lineTo(cx + ny * big + nx * big, cy - nx * big + ny * big)
        q.lineTo(cx - ny * big + nx * big, cy + nx * big + ny * big); q.lineTo(cx - ny * big, cy + nx * big); q.close()
        return q

    _B = None

    def _shade(self, c, path, sh, l, d):
        if self._B is not None:
            c.drawPath(inter(path, self._B), P(sh)); return
        q = skia.Path(path); q.offset(-l[0] * d, -l[1] * d)
        c.drawPath(diff(path, q), P(sh))

    def _rim(self, c, path, l, rim, a=210, force=False):
        if self._B is not None and not force: return
        a = a * 0.75
        q = skia.Path(path); q.offset(-l[0] * 2.6, -l[1] * 2.6)
        c.drawPath(diff(path, q), P(rim, a))

    def _leg_path(self, J, s):
        th = self.part(J, 'thigh_' + s, THIGH)
        sh = self.part(J, 'shin_' + s, SHIN + [])
        o, deg = J['shin_' + s]; kc = o
        cap = circ(kc[0], kc[1], 70)
        return union([th, sh, cap])

    def _leg(self, c, J, s, tone, l, rim, rim_on=True, torso=None):
        cloth = self._leg_path(J, s)
        cuff = self.part(J, 'shin_' + s, CUFFB)
        o, an = J['boot_' + s]
        boot = curve([self.frame(o, an)(px * 0 + (px * math.cos(math.radians(an)) - py * math.sin(math.radians(an))) * 0 + px, py) for px, py in BOOT]) if False else None
        # the boot stays upright (feet on the ground), rotated only by the ankle angle
        a = math.radians(an); ca, sa = math.cos(a), math.sin(a)
        boot = curve([(o[0] + px * ca - py * sa, o[1] + px * sa + py * ca) for px, py in BOOT])
        sole = curve([(o[0] + px * ca - py * sa, o[1] + px * sa + py * ca) for px, py in [(-72, 116), (124, 116), (124, 138), (-72, 138)]])
        c.drawPath(boot, P(tone(BOOT_C))); self._shade(c, boot, tone(BOOT_SH), l, 12); c.drawPath(sole, P(tone(SOLE)))
        for k in range(4):
            c.drawLine(*(o[0] + (10 + k * 14) * ca + 6 * sa, o[1] - 10 + k * 14), *(o[0] + (36 + k * 14) * ca, o[1] - 2 + k * 14), SP(tone(BOOT_SH), 4))
        c.drawPath(cloth, P(tone(OL))); self._shade(c, cloth, tone(OL_SH), l, 16)
        c.drawPath(cuff, P(tone(CUFF))); self._shade(c, cuff, tone(OL_SH), l, 8)
        # knee fold: two short soft creases on the back of the knee when bent
        ko, kd = J['shin_' + s]; to, td = J['thigh_' + s]
        bend = abs(kd - td)
        tf = self.frame(*J['thigh_' + s]); sf = self.frame(*J['shin_' + s])
        c.drawLine(*tf(30, 120), *tf(24, 250), SP(tone(OL_SH), 4, 150))
        c.drawLine(*sf(-50, 120), *sf(-30, 180), SP(tone(OL_SH), 4, 140))
        if bend > 8:
            f = self.frame(ko, (kd + td) / 2)
            for k in range(2):
                c.drawLine(*f(-40 + k * 10, -10 - k * 14), *f(-8 + k * 8, 6 - k * 10), SP(tone(OL_SH), 5, min(255, bend * 6)))
        if rim_on: self._rim(c, union([cloth, boot]), l, rim, 170)

    def _arm_path(self, J, s, ps):
        ua = self.part(J, 'uarm_' + s, UARM)
        fa = self.part(J, 'farm_' + s, FARM)
        o, _ = J['farm_' + s]
        cap = circ(o[0], o[1], 46)
        hk = ps.hand_n if s == 'n' else ps.hand_f
        hp, th = hand_shape(hk)
        hand = self.part(J, 'hand_' + s, hp)
        return union([ua, fa, cap, hand])

    def _arm(self, c, J, s, tone, l, rim, rim_on=True, ps=None, body=None):
        hk = ps.hand_n if s == 'n' else ps.hand_f
        ua = self.part(J, 'uarm_' + s, UARM)
        roll = self.part(J, 'uarm_' + s, SLEEVE_ROLL)
        fa = self.part(J, 'farm_' + s, FARM)
        o, _ = J['farm_' + s]
        elbow = circ(o[0], o[1], 38)
        hp, thumbs = hand_shape(hk)
        hand = self.part(J, 'hand_' + s, hp)
        ho, hd = J['hand_' + s]; hf = self.frame(ho, hd)
        thumb = union([skia.Path(circ(*hf(*t0), r)) for (t0, t1, r) in thumbs] + [self._cap2(hf(*t0), hf(*t1), r) for (t0, t1, r) in thumbs])
        skin = union([fa, elbow, hand, thumb])
        if body is not None:
            q = skia.Path(union([ua, skin])); q.offset(-l[0] * 10, -l[1] * 10)
            c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
            c.drawPath(q, P((0, 0, 0), 45, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8))); c.restore()
        B, self._B = self._B, (None if body is not None else self._B)
        c.drawPath(skin, P(tone(SKIN))); self._shade(c, skin, tone(SKIN_SH), l, 9)
        # forearm muscle line and knuckle creases
        f = self.frame(*J['farm_' + s])
        c.drawLine(*f(20, 30), *f(10, 110), SP(tone(SKIN_SH), 4, 150))
        if hk in ('fist', 'grip'):
            for k in range(3):
                c.drawLine(*hf(6 + k * 8, 56 + k * 9), *hf(30, 52 + k * 9), SP(tone(SKIN_SH), 3.5, 200))
        if hk == 'point':
            c.drawLine(*hf(6, 70), *hf(14, 88), SP(tone(SKIN_SH), 3.5, 200))
        cloth = union([ua])
        c.drawPath(cloth, P(tone(OL))); self._shade(c, cloth, tone(OL_SH), l, 14)
        c.drawPath(roll, P(tone(CUFF))); self._shade(c, roll, tone(OL_SH), l, 8)
        c.drawLine(*self.frame(*J['uarm_' + s])(-60, 186), *self.frame(*J['uarm_' + s])(62, 186), SP(tone(OL_SH), 3, 160))
        self._B = B
        if rim_on: self._rim(c, union([cloth, roll, skin]), l, rim, 190)

    @staticmethod
    def _cap2(a, b, r):
        dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d * r, dx / d * r
        p = skia.Path(); p.moveTo(a[0] + nx, a[1] + ny); p.lineTo(b[0] + nx, b[1] + ny); p.lineTo(b[0] - nx, b[1] - ny); p.lineTo(a[0] - nx, a[1] - ny); p.close()
        return union([p, circ(*b, r)])

    # ---------------------------------------------------------- head (profile, measured off the sheet)
    def _hf(self, J):
        # the head turns about the top of the neck (just under the jaw), so the neck always stays joined to it
        cx, cy = J['head_piv']; a = math.radians(J['head_ang'])
        ca, sa = math.cos(a), math.sin(a)
        ox, oy = 22.0, 78.0; k = 1.25
        return lambda px, py: (cx + k * ((px - ox) * ca - (py - oy) * sa), cy + k * ((px - ox) * sa + (py - oy) * ca))

    def _head(self, c, J, ps, l):
        """the head built the same way as the body: designed outlines (measured off the model sheet), each filled flat,
        with the same hard shade tone away from the light and the same thin rim on the lit edge"""
        h = self._hf(J)
        S = lambda pts: curve([h(*_hp(p)) for p in pts])
        head = S(HEAD_SHAPES['skin'])
        c.drawPath(head, P(SKIN)); self._shade(c, head, SKIN_SH, l, 14)
        # the jaw plane, the same shade tone, under the cheekbone back to the ear
        c.save(); c.clipPath(head, skia.ClipOp.kIntersect, True)
        c.drawPath(S(HEAD_SHAPES['cheek']), P(SKIN_SH))
        c.restore()
        self._rim(c, head, l, RIM, 200)
        hair = S(HEAD_SHAPES['hair'])
        c.drawPath(hair, P(HAIR)); self._shade(c, hair, HAIR_SH, l, 8)
        ear = S(HEAD_SHAPES['ear'])
        c.drawPath(ear, P(SKIN)); self._shade(c, ear, SKIN_SH, l, 6)
        c.drawPath(S([(130, 150), (144, 148), (145, 172), (135, 178), (132, 164)]), P(SKIN_SH))
        # face: brow, eye, nose underside, mouth
        c.drawPath(S([(208, 136), (228, 128), (250, 128), (250, 134), (228, 134), (210, 141)]), P(HAIR))
        if ps.blink:
            c.drawLine(*h(*_hp((216, 149))), *h(*_hp((240, 149))), SP((52, 34, 24), 3))
        else:
            c.drawPath(S([(216, 149), (228, 141), (242, 144), (238, 154), (224, 155)]), P((250, 246, 238)))
            c.drawCircle(*h(*_hp((232 + 3 * ps.look, 148))), 4.6, P((48, 30, 22)))
            ep = skia.Path(); ep.moveTo(*h(*_hp((215, 148)))); ep.quadTo(*h(*_hp((228, 139))), *h(*_hp((243, 143))))
            c.drawPath(ep, SP((60, 36, 28), 2.6))
        c.drawPath(S([(250, 183), (266, 184), (260, 189), (250, 188)]), P(SKIN_SH))
        sm = ps.smile
        mp = skia.Path(); mp.moveTo(*h(*_hp((236, 206 + 2 * sm)))); mp.quadTo(*h(*_hp((244, 210 + 2 * sm))), *h(*_hp((254, 204))))
        c.drawPath(mp, SP((150, 80, 66), 3))
        if ps.mouth > 0.05:
            c.drawPath(S([(238, 205), (252, 203), (250, 203 + 12 * ps.mouth), (240, 205 + 10 * ps.mouth)]), P((100, 46, 44)))
        # cap: crown and visor, same shading and rim
        cap = S(HEAD_SHAPES['cap'])
        c.drawPath(cap, P(CAP)); self._shade(c, cap, CAP_SH, l, 10)
        visor = S(HEAD_SHAPES['visor'])
        c.drawPath(visor, P(mix(CAP, (255, 240, 200), 0.12)))
        c.drawPath(S([(72, 112), (88, 108), (88, 132), (72, 136)]), P((60, 46, 36)))
        self._rim(c, union([cap, visor]), l, RIM, 200)

    def _neck_path(self, J):
        h = self._hf(J); T = J['torso_f']
        H = lambda p: h(*_hp(p))
        # nape and throat in the head's frame, neck base in the chest's frame: one shape that always joins both
        return curve([H((120, 196)), H((160, 160)), H((204, 234)), T(60, 350), T(0, 320), T(-46, 350)])

    def _silhouette(self, J, ps):
        h = self._hf(J); S = lambda pts: curve([h(*_hp(p)) for p in pts])
        torso = curve([J['torso_f'](px, py) for px, py in TORSO])
        collar = curve([J['torso_f'](px, py) for px, py in [(-58, 360), (-44, 396), (-8, 404), (30, 396), (66, 360), (84, 322), (60, 318), (36, 352), (0, 372), (-38, 366)]])
        o, an = J['boot_n']; a = math.radians(an); ca, sa = math.cos(a), math.sin(a)
        boot = curve([(o[0] + px * ca - py * sa, o[1] + px * sa + py * ca) for px, py in BOOT])
        return union([torso, collar, self._neck_path(J), S(HEAD_SHAPES['skin']), S(HEAD_SHAPES['hair']), S(HEAD_SHAPES['cap']),
                      S(HEAD_SHAPES['visor']), self._leg_path(J, 'n'), self.part(J, 'shin_n', CUFFB), boot, self._arm_path(J, 'n', ps)])

    def _head_path(self, J):
        h = self._hf(J)
        return curve([h(*_hp(p)) for p in HEAD_SHAPES['skin']])


import json as _json, os as _os
HEAD_SHAPES = _json.load(open(_os.path.join(_os.path.dirname(__file__), 'ref', 'head_shapes.json')))


def _hp(p):
    return (p[0] - 160, p[1] - 160)


# head outline measured off the side view (sheet pixels): nape, skull, forehead, brow, nose, lips, chin, jaw
HEAD2 = [(112, 236), (84, 186), (78, 120), (130, 70), (210, 70), (246, 100), (252, 116), (261, 134), (258, 150),
         (266, 168), (276, 186), (270, 193), (250, 194), (254, 198), (242, 206), (253, 212), (252, 236), (240, 252),
         (214, 254), (184, 236), (162, 214), (140, 214), (122, 232)]


# head outline (profile facing +x) in head units around the skull centre: cranium, brow, nose, lips, chin, jaw, nape
HEAD = [(-90, -10), (-80, -60), (-30, -88), (40, -86), (82, -52), (90, -24), (96, -6), (108, 26), (112, 36), (98, 44),
        (96, 56), (100, 64), (92, 72), (90, 90), (70, 108), (40, 112), (6, 98), (-24, 70), (-50, 74), (-76, 44)]
