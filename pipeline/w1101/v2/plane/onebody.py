"""onebody: a person drawn as ONE continuous shape around a real skeleton (Olivier, 2026-11-01).

Why: the older kits drew every body part as its own shaded piece stacked at the joints, so seams showed and
joints worked like door hinges. Here the near side of the body (torso, neck, head, near arm, near leg) is ONE
outline: tapered capsules around each bone, unioned with skia PathOps into a single path, recomputed every frame.
The far arm and far leg are one second outline drawn behind (a darker tone, as every flat style figure does).
Clothes are regions clipped INSIDE that outline; light is one gradient and one rim over the whole silhouette.

Joint limits (degrees) are real ones; every pose is clamped, so impossible arms cannot happen:
  elbow 0..150 (bends one way only), knee 0..150 (one way only), shoulder flexion -60..180, hip -30..120,
  neck -40..50, wrist -70..70, ankle -30..40.
Angles: limbs measured from straight down; positive swings the limb FORWARD (toward the way the person faces).
"""
import math
import skia

LIM = dict(shoulder=(-60, 180), elbow=(0, 150), hip=(-30, 120), knee=(0, 150), neck=(-40, 50),
           wrist=(-70, 70), ankle=(-30, 40), lean=(-35, 60))


def clamp(v, lim):
    a, b = LIM[lim]
    return max(a, min(b, v))


def C(rgb, a=255):
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(max(0, min(255, a))))


def P(col, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), **k)


def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def capsule(a, b, r0, r1, n=14):
    """convex hull of two circles: a tapered limb with round ends, no seams (sampled outline)"""
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; d = math.hypot(dx, dy)
    p = skia.Path()
    if d < abs(r0 - r1) + 0.5:
        p.addCircle(ax, ay, max(r0, r1)); return p
    ang = math.atan2(dy, dx)
    s = math.asin(max(-1, min(1, (r0 - r1) / d)))
    h = math.pi / 2 + s
    pts = []
    for i in range(n + 1):                       # arc around b, from +h to -h through the far side
        t = ang + h - (2 * h) * 0 + (i / n) * (2 * math.pi - 2 * h) * 0
    pts = []
    for i in range(n + 1):
        t = ang - h + (i / n) * (2 * h)          # around b (front)
        pts.append((bx + r1 * math.cos(t), by + r1 * math.sin(t)))
    for i in range(n + 1):
        t = ang + h + (i / n) * (2 * math.pi - 2 * h)   # around a (back)
        pts.append((ax + r0 * math.cos(t), ay + r0 * math.sin(t)))
    p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p


def blob(pts):
    """smooth closed Catmull Rom curve"""
    n = len(pts); p = skia.Path(); p.moveTo(*pts[0])
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        p.cubicTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
                  p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, *p2)
    p.close(); return p


def union(paths):
    paths = [p for p in paths if p is not None]
    if not paths: return skia.Path()
    b = skia.OpBuilder()
    for p in paths: b.add(p, skia.PathOp.kUnion_PathOp)
    r = b.resolve()
    return r if r is not None else paths[0]


def inter(a, b):
    r = skia.Op(a, b, skia.PathOp.kIntersect_PathOp)
    return r if r is not None else skia.Path()


def diff(a, b):
    r = skia.Op(a, b, skia.PathOp.kDifference_PathOp)
    return r if r is not None else skia.Path()


class Build:
    """proportions in units of total height (1.0). Real adult ratios: head about 1/7.5 of height."""
    def __init__(self, h=520, stocky=1.0, head=1.0):
        self.h = h; u = h
        self.head_r = 0.064 * u * head
        self.neck = 0.05 * u
        self.torso = 0.27 * u
        self.uarm = 0.17 * u; self.farm = 0.15 * u; self.hand = 0.07 * u
        self.thigh = 0.26 * u; self.shin = 0.25 * u; self.foot = 0.13 * u
        k = stocky
        self.w_chest = 0.115 * u * k; self.w_waist = 0.095 * u * k; self.w_hip = 0.105 * u * k
        self.r_sh = 0.040 * u * k; self.r_el = 0.026 * u * k; self.r_wr = 0.020 * u * k
        self.r_hip = 0.058 * u * k; self.r_kn = 0.036 * u * k; self.r_an = 0.024 * u * k
        self.r_neck = 0.03 * u * k


class Pose:
    def __init__(self, x, y, face=1, lean=0, neck=0, head=0,
                 arm_n=(10, 10), arm_f=(-10, 10), leg_n=(0, 0), leg_f=(0, 0), hand_n=0, hand_f=0,
                 ank_n=0, ank_f=0, breath=0.0, blink=False, mouth=0.0, look=0.0):
        self.__dict__.update(locals()); del self.__dict__['self']


def _pt(o, ang_deg, L, face):
    """from point o, a bone of length L at angle from straight down, + = forward"""
    a = math.radians(ang_deg)
    return (o[0] + face * L * math.sin(a), o[1] + L * math.cos(a))


class Person:
    def __init__(self, build, skin, top, top_sh, legs, legs_sh, boots, hair=None, cap=None, cap_sh=None,
                 sleeve=0.55, belt=None, collar=None, insignia=None, cuff=None, apron=None):
        self.b = build; self.__dict__.update(skin=skin, top=top, top_sh=top_sh, legs=legs, legs_sh=legs_sh,
                                             boots=boots, hair=hair, cap=cap, cap_sh=cap_sh, sleeve=sleeve,
                                             belt=belt, collar=collar, insignia=insignia, cuff=cuff, apron=apron)

    # ------------------------------------------------------------- skeleton
    def joints(self, ps):
        b = self.b; f = ps.face
        lean = clamp(ps.lean, 'lean')
        hipc = (ps.x, ps.y)
        br = 1 + 0.012 * ps.breath
        chest = _pt(hipc, 180 - lean, b.torso, f)              # spine goes UP: 180 deg from down
        neck_ang = 180 - lean - clamp(ps.neck, 'neck') * 0.6
        neck = _pt(chest, neck_ang, b.neck, f)
        head_ang = 180 - lean - clamp(ps.neck, 'neck')
        headc = _pt(neck, head_ang, b.head_r * 1.05, f)
        J = dict(hip=hipc, chest=chest, neck=neck, head=headc, lean=lean, head_ang=head_ang, br=br)
        # shoulders sit just below the top of the chest, a little behind its front
        sh = _pt(chest, 0 - lean, b.torso * 0.08, f)
        for side, (sa, el), hw in (('n', ps.arm_n, ps.hand_n), ('f', ps.arm_f, ps.hand_f)):
            sa = clamp(sa, 'shoulder') - lean * 0.0
            el = clamp(el, 'elbow')
            s = (sh[0] - f * (0 if side == 'n' else b.w_chest * 0.15), sh[1])
            e = _pt(s, sa - lean, b.uarm, f)
            w = _pt(e, sa + el - lean, b.farm, f)               # elbow only bends forward / up
            hnd = _pt(w, sa + el - lean + clamp(hw, 'wrist'), b.hand, f)
            J['sh_' + side], J['el_' + side], J['wr_' + side], J['hd_' + side] = s, e, w, hnd
        for side, (ha, kn), an in (('n', ps.leg_n, ps.ank_n), ('f', ps.leg_f, ps.ank_f)):
            ha = clamp(ha, 'hip'); kn = clamp(kn, 'knee')
            h0 = (hipc[0] - f * (0 if side == 'n' else b.w_hip * 0.1), hipc[1])
            k = _pt(h0, ha, b.thigh, f)
            a = _pt(k, ha - kn, b.shin, f)                      # knee only bends backward
            toe = _pt(a, 90 + clamp(an, 'ankle') - (ha - kn) * 0.0, b.foot, f)
            J['hp_' + side], J['kn_' + side], J['an_' + side], J['toe_' + side] = h0, k, a, toe
        return J

    # ------------------------------------------------------------- skins
    def _arm(self, J, s, upto=1.0):
        b = self.b
        p = [capsule(J['sh_' + s], J['el_' + s], b.r_sh, b.r_el), capsule(J['el_' + s], J['wr_' + s], b.r_el, b.r_wr)]
        return union(p)

    def _hand(self, J, s):
        b = self.b; w, h = J['wr_' + s], J['hd_' + s]
        mid = (w[0] + (h[0] - w[0]) * 0.45, w[1] + (h[1] - w[1]) * 0.45)
        return union([capsule(w, mid, b.r_wr * 1.25, b.r_wr * 1.45), capsule(mid, h, b.r_wr * 1.45, b.r_wr * 0.9)])

    def _leg(self, J, s):
        b = self.b
        hp, k, a, toe = J['hp_' + s], J['kn_' + s], J['an_' + s], J['toe_' + s]
        return union([capsule(hp, k, b.r_hip, b.r_kn), capsule(k, a, b.r_kn, b.r_an)])

    def _boot(self, J, s):
        b = self.b; a, toe = J['an_' + s], J['toe_' + s]
        heel = (a[0] - (toe[0] - a[0]) * 0.25, a[1] + b.r_an * 0.9)
        return union([capsule(a, toe, b.r_an * 1.25, b.r_an * 0.95), capsule(heel, (toe[0], toe[1] + b.r_an * 0.3), b.r_an * 0.7, b.r_an * 0.7)])

    def _torso(self, J):
        b = self.b; f = 1 if J['chest'][0] >= 0 else 1
        hip, ch = J['hip'], J['chest']
        dx, dy = ch[0] - hip[0], ch[1] - hip[1]; L = math.hypot(dx, dy) or 1
        ux, uy = dx / L, dy / L; nx, ny = -uy, ux                # normal
        br = J['br']
        def at(t, w):
            return (hip[0] + dx * t + nx * w, hip[1] + dy * t + ny * w)
        pts = [at(-0.12, b.w_hip * 0.85), at(0.0, b.w_hip), at(0.45, b.w_waist), at(0.8, b.w_chest * br), at(1.02, b.w_chest * 0.8),
               at(1.06, 0), at(1.02, -b.w_chest * 0.8), at(0.8, -b.w_chest * br), at(0.45, -b.w_waist), at(0.0, -b.w_hip), at(-0.12, -b.w_hip * 0.85)]
        return blob(pts)

    def _head(self, J, face):
        b = self.b; hx, hy = J['head']; r = b.head_r
        a = math.radians(-(J['head_ang'] - 180) * face)
        ca, sa = math.cos(a), math.sin(a)
        def R(px, py):
            return (hx + px * ca - py * sa * face * 0 - 0, hy + py * ca + px * sa * 0) if False else (hx + px * ca - py * sa, hy + px * sa + py * ca)
        # cranium plus jaw, profile facing `face`
        pts = [(-0.95, -0.15), (-0.8, -0.75), (-0.2, -1.05), (0.5, -0.95), (0.95, -0.45), (1.0, 0.05),
               (1.12, 0.25), (0.98, 0.42), (0.95, 0.62), (0.7, 0.95), (0.25, 1.05), (-0.25, 0.85), (-0.7, 0.55)]
        return blob([R(px * r * face, py * r) for px, py in pts]), R

    # ------------------------------------------------------------- draw
    def draw(self, c, ps, light=(-1, -1), rim=(255, 220, 170), tint=None, shade_amt=0.22, far_dim=0.78, scale=1.0, silhouette=None):
        J = self.joints(ps); b = self.b; f = ps.face
        dimc = lambda col, k=far_dim: tuple(v * k for v in col)
        # FAR side first: one outline of far arm + far leg (+ boot), darker
        far_leg = self._leg(J, 'f'); far_boot = self._boot(J, 'f')
        far_arm = self._arm(J, 'f'); far_hand = self._hand(J, 'f')
        far = union([far_leg, far_boot])
        if silhouette:
            c.drawPath(union([far, far_arm, far_hand]), P(silhouette))
        else:
            self._fill_regions(c, far_leg, far_boot, None, far_arm, far_hand, J, 'f', dimc, light, rim, shade_amt * 1.2, rim_on=False)
        # NEAR body: torso + neck + head + near arm + near leg as ONE outline
        torso = self._torso(J)
        neck = capsule(J['chest'], J['head'], b.r_neck, b.r_neck * 0.9)
        head, R = self._head(J, f)
        leg = self._leg(J, 'n'); boot = self._boot(J, 'n')
        arm = self._arm(J, 'n'); hand = self._hand(J, 'n')
        body = union([torso, neck, head, leg, boot])
        whole = union([body, arm, hand])
        if silhouette:
            c.drawPath(whole, P(silhouette)); return J
        # base regions inside the one outline
        trousers = union([leg, inter(torso, self._below(J, 0.12))])
        shirt = diff(union([torso, inter(arm, self._upper(J, 'n'))]), trousers)
        c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
        c.drawPath(body, P(self.skin))
        c.drawPath(trousers, P(self.legs)); c.drawPath(boot, P(self.boots))
        c.drawPath(diff(torso, trousers), P(self.top))
        if self.belt: c.drawPath(inter(torso, self._band(J, 0.1, 0.16)), P(self.belt))
        if self.apron: c.drawPath(inter(union([torso, leg]), self._apron(J)), P(self.apron))
        c.restore()
        # arm over body: a soft occlusion shadow where it crosses the torso, then the arm itself (same outline family)
        sh = skia.Path(arm); sh.offset(-light[0] * 6, -light[1] * 6)
        c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
        c.drawPath(sh, P((0, 0, 0), 40, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6)))
        c.restore()
        armall = union([arm, hand])
        c.save(); c.clipPath(armall, skia.ClipOp.kIntersect, True)
        c.drawPath(armall, P(self.skin))
        c.drawPath(inter(arm, self._sleeve(J, 'n')), P(self.top))
        if self.cuff: c.drawPath(inter(arm, self._cuffband(J, 'n')), P(self.cuff))
        c.restore()
        # collar, hair, cap, face
        self._face(c, J, R, ps)
        # ONE light over the whole silhouette: shade side gradient + rim on the lit edge
        self._light(c, whole, J, light, rim, shade_amt, tint)
        return J

    def _fill_regions(self, c, leg, boot, torso, arm, hand, J, s, dimc, light, rim, shade_amt, rim_on=True):
        armall = union([arm, hand])
        c.drawPath(leg, P(dimc(self.legs))); c.drawPath(boot, P(dimc(self.boots)))
        c.save(); c.clipPath(armall, skia.ClipOp.kIntersect, True)
        c.drawPath(armall, P(dimc(self.skin)))
        c.drawPath(inter(arm, self._sleeve(J, s)), P(dimc(self.top)))
        if self.cuff: c.drawPath(inter(arm, self._cuffband(J, s)), P(dimc(self.cuff)))
        c.restore()

    def _upper(self, J, s):
        p = skia.Path(); x, y = J['sh_' + s]; r = self.b.uarm * 2.2
        p.addCircle(x, y, r); return p

    def _sleeve(self, J, s):
        """the sleeve ends at a fixed spot along the forearm (self.sleeve: 0 at elbow, 1 at wrist)"""
        b = self.b; e, w = J['el_' + s], J['wr_' + s]
        endp = (e[0] + (w[0] - e[0]) * self.sleeve, e[1] + (w[1] - e[1]) * self.sleeve)
        return union([capsule(J['sh_' + s], e, b.r_sh * 1.6, b.r_el * 1.6), capsule(e, endp, b.r_el * 1.6, b.r_wr * 1.6)])

    def _cuffband(self, J, s):
        b = self.b; e, w = J['el_' + s], J['wr_' + s]; u0 = self.sleeve - 0.12
        p0 = (e[0] + (w[0] - e[0]) * u0, e[1] + (w[1] - e[1]) * u0)
        p1 = (e[0] + (w[0] - e[0]) * self.sleeve, e[1] + (w[1] - e[1]) * self.sleeve)
        return capsule(p0, p1, b.r_el * 1.6, b.r_wr * 1.6)

    def _below(self, J, t):
        hip, ch = J['hip'], J['chest']
        y = hip[1] + (ch[1] - hip[1]) * t
        p = skia.Path(); p.addRect(skia.Rect(hip[0] - 2000, y, hip[0] + 2000, hip[1] + 3000)); return p

    def _band(self, J, t0, t1):
        hip, ch = J['hip'], J['chest']
        y0 = hip[1] + (ch[1] - hip[1]) * t1; y1 = hip[1] + (ch[1] - hip[1]) * t0
        p = skia.Path(); p.addRect(skia.Rect(hip[0] - 2000, y0, hip[0] + 2000, y1)); return p

    def _apron(self, J):
        return self._band(J, -0.4, 0.75)

    def _face(self, c, J, R, ps):
        b = self.b; r = b.head_r; f = ps.face
        def Rf(px, py): return R(px * r * f, py * r)
        if self.hair is not None:
            hp = blob([Rf(-1.0, -0.2), Rf(-0.85, -0.85), Rf(-0.15, -1.12), Rf(0.55, -1.0), Rf(0.9, -0.55),
                       Rf(0.55, -0.62), Rf(0.0, -0.55), Rf(-0.35, -0.35), Rf(-0.55, 0.1), Rf(-0.85, 0.25)])
            c.drawPath(hp, P(self.hair))
        # ear
        ex, ey = Rf(-0.2, 0.05); c.drawCircle(ex, ey, r * 0.2, P(mix(self.skin, (0, 0, 0), 0.12)))
        # eye, brow
        ex, ey = Rf(0.55, -0.12)
        if ps.blink:
            c.drawLine(ex - r * 0.1, ey, ex + r * 0.1, ey, skia.Paint(AntiAlias=True, Color=C((40, 30, 30)), StrokeWidth=max(1.5, r * 0.06)))
        else:
            c.drawCircle(ex + f * ps.look * r * 0.05, ey, max(1.6, r * 0.085), P((35, 28, 30)))
        bx, by = Rf(0.55, -0.32)
        c.drawLine(bx - r * 0.16, by + r * 0.02, bx + r * 0.16, by - r * 0.02, skia.Paint(AntiAlias=True, Color=C(self.hair or (60, 40, 30)), StrokeWidth=max(1.5, r * 0.08), StrokeCap=skia.Paint.kRound_Cap))
        if ps.mouth > 0.05:
            mx, my = Rf(0.78, 0.55); c.drawOval(skia.Rect(mx - r * 0.08, my - r * 0.04 * ps.mouth, mx + r * 0.08, my + r * 0.06 * ps.mouth), P((90, 40, 40)))
        if self.cap is not None:
            cp = blob([Rf(-0.95, -0.35), Rf(-0.85, -0.95), Rf(-0.1, -1.25), Rf(0.65, -1.05), Rf(0.95, -0.55), Rf(0.95, -0.38)])
            c.drawPath(cp, P(self.cap))
            visor = blob([Rf(0.5, -0.45), Rf(1.45, -0.32), Rf(1.4, -0.22), Rf(0.5, -0.3)])
            c.drawPath(visor, P(self.cap_sh or mix(self.cap, (0, 0, 0), 0.3)))
        if self.collar is not None:
            nx, ny = J['neck']; cx, cy = J['chest']
            p = capsule(((nx * 0.3 + cx * 0.7), (ny * 0.3 + cy * 0.7)), (cx, cy), b.r_neck * 1.05, b.r_neck * 1.2)
            c.drawPath(p, P(self.collar))

    def _light(self, c, whole, J, light, rim, shade_amt, tint):
        lx, ly = light
        bnd = whole.getBounds()
        cx, cy = bnd.centerX(), bnd.centerY(); s = max(bnd.width(), bnd.height()) / 2
        sh = skia.GradientShader.MakeLinear([skia.Point(cx + lx * s, cy + ly * s), skia.Point(cx - lx * s, cy - ly * s)],
                                            [skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, int(255 * shade_amt))])
        c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
        c.drawRect(bnd, skia.Paint(Shader=sh))
        if tint is not None:
            c.drawRect(bnd, P(tint[:3], tint[3]))
        c.restore()
        # rim on the lit edge: the part of the silhouette not covered by itself shifted toward the light
        q = skia.Path(whole); q.offset(-lx * 3.5, -ly * 3.5)
        r = diff(whole, q)
        c.drawPath(r, P(rim, 200))
