"""The freediver, side view (w1110 dive reflex Short). A new character built for this story (people standard: every character is a new design).
Who she is: a trained freediver in her late twenties, lean swimmer's build, dark hair tied back in a ponytail that trails in the water,
a low volume mask, a charcoal two piece wetsuit with a coral side stripe, long coral freediving fins, bare hands.
One continuous body: torso and both legs are skinned along smooth centre lines (no hinged parts), arms are tapered sleeves from the shoulder,
every hand is the one hand model (hands.py). All points are transformed to the screen first, so the shade band and the rim always follow
the light from the surface whatever way up she is."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/mh']
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from art import op, diffp, tube
import hands as H

SUIT, SUIT_SH, SUIT_HI = (38, 46, 78), (20, 24, 50), (96, 128, 176)
STRIPE = (255, 118, 92)
SKIN, SKIN_SH, SKIN_HI = (226, 172, 136), (176, 118, 104), (252, 218, 186)
HAIR, HAIR_SH, HAIR_HI = (44, 30, 34), (24, 14, 22), (110, 86, 92)
FIN, FIN_SH, FIN_HI = (255, 124, 92), (196, 72, 78), (255, 196, 150)
MASK, MASK_HI = (22, 26, 44), (150, 220, 240)
RIM = (170, 232, 250)


class Pose:
    def __init__(self, **k):
        self.bend = 0.0          # spine curl, degrees (+ = curls forward)
        self.head = 0.0          # head tilt on the neck, degrees (+ = chin down)
        self.hip = (0.0, 0.0)    # near, far thigh angle from the body line, degrees (+ = forward)
        self.knee = (0.0, 0.0)   # near, far knee bend, degrees
        self.fin = (0.0, 0.0)    # near, far blade bend, degrees (+ = tip trails back)
        self.arm = (0.0, 0.0)    # near, far shoulder angle from the body line (0 = along the side toward the feet, 180 = overhead)
        self.elbow = (4.0, 4.0)
        self.flow = (0.0, -1.0)  # which way the water streams past her on screen (the ponytail trails this way)
        self.t = 0.0
        self.lid = 0.0
        self.look = (0.0, 0.0)
        for a, b in k.items(): setattr(self, a, b)


def _resample(pts, n):
    """Catmull Rom through pts, n samples evenly in parameter"""
    pts = [np.array(p, float) for p in pts]; m = len(pts); out = []
    for i in range(n):
        u = i / (n - 1) * (m - 1); k = min(int(u), m - 2); f = u - k
        p0 = pts[max(k - 1, 0)]; p1 = pts[k]; p2 = pts[k + 1]; p3 = pts[min(k + 2, m - 1)]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f ** 3))
    return out


def skin(center, us, wf, wb, n=26, cap0=0.6, cap1=0.6):
    """one closed outline skinned along a centre line. center: joint points; us: 0..1 stations; wf, wb: half widths on the two sides at the stations"""
    cl = _resample(center, n); uu = np.linspace(0, 1, n)
    f = np.interp(uu, us, wf); b = np.interp(uu, us, wb)
    L, R = [], []
    for i in range(n):
        a = cl[max(i - 1, 0)]; z = cl[min(i + 1, n - 1)]; d = z - a; d /= (np.linalg.norm(d) or 1)
        nrm = np.array([-d[1], d[0]])
        L.append(tuple(cl[i] - nrm * f[i])); R.append(tuple(cl[i] + nrm * b[i]))
    d0 = cl[0] - cl[1]; d0 /= (np.linalg.norm(d0) or 1); d1 = cl[-1] - cl[-2]; d1 /= (np.linalg.norm(d1) or 1)
    c0 = tuple(cl[0] + d0 * (f[0] + b[0]) * 0.5 * cap0); c1 = tuple(cl[-1] + d1 * (f[-1] + b[-1]) * 0.5 * cap1)
    return smooth_closed([c0] + L[::2] + [L[-1], c1, R[-1]] + R[::-2][1:]), cl


def line_of(cl, a=0, b=None):
    p = skia.Path(); pts = cl[a:b]; p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    return p


def _rot(v, deg):
    r = math.radians(deg); c, s = math.cos(r), math.sin(r); return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)


def _add(a, b, k=1.0): return (a[0] + b[0] * k, a[1] + b[1] * k)


def shade(c, path, base, sh, rim=None, light=(0.25, -1.0), k=1.0, a=255, rim_a=220):
    """house flat shading: flat fill, one shade band on the side away from the light, one rim on the lit side"""
    k = k ** 0.7 if k > 1 else k
    c.drawPath(path, P(base, a))
    c.drawPath(diffp(path, (light[0] * 13 * k, light[1] * 13 * k)), P(sh, a))
    if rim is not None: c.drawPath(diffp(path, (-light[0] * 5 * k, -light[1] * 5 * k)), P(rim, rim_a * a / 255))


def skeleton(ps):
    """joint positions in her own upright frame: origin at the hip, +x the way she faces, +y toward her feet"""
    J = {}
    up = (0.0, -1.0)
    J['hip'] = (0.0, 0.0)
    d1 = _rot(up, ps.bend * 0.25 - 2); J['waist'] = _add(J['hip'], d1, 112)
    d2 = _rot(up, ps.bend * 0.6 + 1); J['chest'] = _add(J['waist'], d2, 138)
    d3 = _rot(up, ps.bend * 1.0 - 4); J['neck'] = _add(J['chest'], d3, 92)
    J['sho'] = _add(_add(J['chest'], d3, 62), _rot(d3, 90), 6)
    dh = _rot(up, ps.bend * 1.0 + ps.head + 6); J['hd'] = _add(J['neck'], dh, 86); J['hdir'] = dh
    J['tors_dir'] = d3
    for i, nm in enumerate(('n', 'f')):
        dn = (0.0, 1.0)
        dt = _rot(dn, -ps.hip[i]); J['knee_' + nm] = _add(J['hip'], dt, 252)
        ds = _rot(dn, -ps.hip[i] + ps.knee[i]); J['ank_' + nm] = _add(J['knee_' + nm], ds, 236); J['sdir_' + nm] = ds
        df = _rot(ds, ps.fin[i] * 0.35); J['pock_' + nm] = _add(J['ank_' + nm], df, 96)
        J['fdir_' + nm] = df
        da = _rot(_rot(d3, 180), -ps.arm[i]); J['elb_' + nm] = _add(J['sho'], da, 176)
        dfo = _rot(da, -ps.elbow[i]); J['wri_' + nm] = _add(J['elb_' + nm], dfo, 158); J['adir_' + nm] = dfo
    return J


class Diver:
    def __init__(self, x, y, s, rot=0.0, face=1):
        self.x, self.y, self.s, self.rot, self.face = x, y, s, rot, face
        r = math.radians(rot); self.cr, self.sr = math.cos(r), math.sin(r)

    def T(self, p):
        px = p[0] * self.face; py = p[1]
        return (self.x + self.s * (px * self.cr - py * self.sr), self.y + self.s * (px * self.sr + py * self.cr))

    def TV(self, v):
        px = v[0] * self.face
        return (px * self.cr - v[1] * self.sr, px * self.sr + v[1] * self.cr)

    # ------------------------------------------------------------------ parts
    def leg(self, c, J, nm, far, light, tint):
        s = self.s
        hip_top = _add(J['hip'], J['tors_dir'], 46)
        cen = [self.T(hip_top), self.T(J['hip']), self.T(_add(J['hip'], (0, 1), 0)), self.T(J['knee_' + nm]), self.T(J['ank_' + nm])]
        cen = [cen[0], cen[1], self.T(_lerp2(J['hip'], J['knee_' + nm], 0.5)), cen[3], self.T(_lerp2(J['knee_' + nm], J['ank_' + nm], 0.45)), cen[4]]
        us = [0, 0.1, 0.3, 0.5, 0.58, 0.72, 0.9, 1.0]
        wf = [34, 62, 76, 50, 46, 43, 31, 28]; wb = [30, 66, 76, 47, 54, 66, 34, 28]
        if self.face < 0: wf, wb = wb, wf
        path, cl = skin(cen, us, [w * s for w in wf], [w * s for w in wb], n=30, cap0=0.2, cap1=0.3)
        return path, cl

    def fin(self, c, J, nm, far, light, tint):
        s = self.s
        a = self.T(J['ank_' + nm]); pk = self.T(J['pock_' + nm]); fd = J['fdir_' + nm]
        bend = self_bend = 0
        # the blade: three stations bending progressively so it trails in the kick
        i = 0 if nm == 'n' else 1
        pts = [J['pock_' + nm]]; d = fd
        for k in range(4):
            d = _rot(d, self._fin[i] * 0.16); pts.append(_add(pts[-1], d, 74))
        cen = [self.T(_add(J['pock_' + nm], fd, -30))] + [self.T(p) for p in pts]
        blade, cl = skin(cen, [0, 0.12, 0.5, 0.92, 1.0], [17 * s, 25 * s, 31 * s, 36 * s, 30 * s], [17 * s, 25 * s, 31 * s, 36 * s, 30 * s], n=22, cap0=0.3, cap1=0.1)
        col = mix(FIN, tint, 0.3) if far else FIN; sh = mix(FIN_SH, tint, 0.3) if far else FIN_SH
        shade(c, blade, col, sh, None if far else FIN_HI, light, k=s * 2.0)
        c.drawPath(line_of(cl, 3), SP(mix(sh, (60, 30, 60), 0.3), max(1.5, 4.5 * s), 150))                       # the centre rail of the blade
        pocket = tube(self.T(_add(J['ank_' + nm], J['sdir_' + nm], -22)), self.T(_add(J['pock_' + nm], fd, 6)), 60 * s, 48 * s)
        pc = mix((30, 34, 56), tint, 0.3) if far else (30, 34, 56)
        shade(c, pocket, pc, mix(pc, (8, 10, 26), 0.6), None if far else SUIT_HI, light, k=s * 1.6)

    def arm(self, c, J, nm, far, light, tint):
        s = self.s
        S = self.T(J['sho']); E = self.T(J['elb_' + nm]); Wr = self.T(J['wri_' + nm])
        mid1 = ((S[0] + E[0]) / 2, (S[1] + E[1]) / 2); mid2 = ((E[0] + Wr[0]) / 2, (E[1] + Wr[1]) / 2)
        path, cl = skin([S, mid1, E, mid2, Wr], [0, 0.2, 0.5, 0.62, 1.0], [36 * s, 37 * s, 28 * s, 29 * s, 20 * s], [36 * s, 37 * s, 28 * s, 29 * s, 20 * s], n=22, cap0=0.9, cap1=0.2)
        col = mix(SUIT, tint, 0.3) if far else SUIT; sh = mix(SUIT_SH, tint, 0.3) if far else SUIT_SH
        shade(c, path, col, sh, None, light, k=s * 1.5)
        if not far: c.drawPath(line_of(cl, 2, -1), SP(STRIPE, max(2, 7 * s), 235))
        cuff = tube(self.T(_add(J['wri_' + nm], J['adir_' + nm], -16)), Wr, 43 * s, 41 * s)
        c.drawPath(cuff, P(mix(col, (10, 12, 30), 0.45)))
        dv = self.TV(J['adir_' + nm]); ang = math.atan2(dv[1], dv[0])
        sk = (mix(SKIN, SKIN_SH, 0.45), mix(SKIN_SH, (120, 70, 80), 0.4), mix(SKIN, SKIN_SH, 0.2)) if far else (SKIN, SKIN_SH, SKIN_HI)
        H.hand(c, (Wr[0] - dv[0] * 4 * s, Wr[1] - dv[1] * 4 * s), ang, side=self.face * (1 if nm == 'n' else 1), s=s * 0.74, skin=sk[0], shade=sk[1], hi=sk[2],
               light=(light[0] * -1 if False else -0.3, -0.8), shadow=False, nails=(s > 1.2), **self._hand)

    def head(self, c, J, light, ps):
        s = self.s; hd = J['hd']; ux = _rot(J['hdir'], 90); uy = (-J['hdir'][0], -J['hdir'][1])       # head frame: ux = face front, uy = down the neck
        Hh = lambda x, y: self.T((hd[0] + (ux[0] * x + uy[0] * y) * 1.06, hd[1] + (ux[1] * x + uy[1] * y) * 1.06))
        fl = ps.flow
        # neck (skin shows between the collar and the jaw)
        neck = tube(self.T(_add(J['neck'], J['tors_dir'], -22)), Hh(-12, 46), 58 * s, 50 * s)
        shade(c, neck, mix(SKIN, SKIN_SH, 0.35), SKIN_SH, None, light, k=s)
        col = tube(self.T(_add(J['neck'], J['tors_dir'], -30)), self.T(_add(J['neck'], J['tors_dir'], 2)), 78 * s, 66 * s)
        shade(c, col, SUIT, SUIT_SH, None, light, k=s)
        # ponytail: tied at the back of the crown, trails the way the water streams, with a slow wave down its length
        root = Hh(-60, -34); n = 12; pts = [root]; L = 200 * s
        bd = self.TV((-(ux[0]) * 0.8 + uy[0] * 0.2, -(ux[1]) * 0.8 + uy[1] * 0.2))
        for i in range(1, n):
            u = i / (n - 1); wgt = smooth(u * 1.5)
            dx = lerp(bd[0], fl[0], wgt); dy = lerp(bd[1], fl[1], wgt); dl = math.hypot(dx, dy) or 1
            pts.append((pts[-1][0] + dx / dl * L / (n - 1), pts[-1][1] + dy / dl * L / (n - 1)))
        wav = []
        for i, (px, py) in enumerate(pts):
            u = i / (n - 1); a_ = pts[max(i - 1, 0)]; b_ = pts[min(i + 1, n - 1)]; dx, dy = b_[0] - a_[0], b_[1] - a_[1]; dl = math.hypot(dx, dy) or 1
            wv = math.sin(ps.t * 2.4 - u * 4.6) * 15 * s * u
            wav.append((px - dy / dl * wv, py + dx / dl * wv))
        tail, tcl = skin(wav, [0, 0.12, 0.45, 0.85, 1.0], [12 * s, 19 * s, 17 * s, 10 * s, 3 * s], [12 * s, 19 * s, 17 * s, 10 * s, 3 * s], n=24, cap0=0.5, cap1=0.8)
        shade(c, tail, HAIR, HAIR_SH, HAIR_HI, light, k=s * 0.9, rim_a=140)
        c.drawPath(line_of(tcl, 2, -2), SP(HAIR_HI, max(1.2, 2.4 * s), 80))
        # skull and face in profile: forehead, brow, nose, lips, chin, jaw
        prof = [(-4, -80), (32, -72), (51, -50), (57, -28), (55, -13), (63, -2), (75, 10), (65, 18), (63, 25), (68, 31), (63, 36), (66, 42), (59, 49), (61, 60), (52, 72),
                (28, 76), (4, 64), (-16, 58), (-42, 46), (-64, 20), (-70, -20), (-50, -60)]
        hp = smooth_closed([Hh(x, y) for x, y in prof])
        shade(c, hp, SKIN, SKIN_SH, SKIN_HI, light, k=s)
        c.drawPath(smooth_closed([Hh(22, 22), Hh(40, 16), Hh(48, 30), Hh(34, 42), Hh(18, 36)]), P((244, 140, 124), 70))                   # cheek
        lips = smooth_closed([Hh(54, 30), Hh(67, 29), Hh(64, 36), Hh(66, 43), Hh(55, 41)])
        c.drawPath(lips, P((206, 98, 104)))
        c.drawLine(*Hh(54, 36), *Hh(64, 36), SP((140, 60, 76), max(1, 1.6 * s), 220))
        # the eye, seen through the clear skirt of her mask
        lid = ps.lid
        if lid < 0.85:
            eye = smooth_closed([Hh(31, -17), Hh(41, -23 + 5 * lid), Hh(51, -17), Hh(42, -12 - 3 * lid)])
            c.drawPath(eye, P((250, 250, 255)))
            c.save(); c.clipPath(eye, skia.ClipOp.kIntersect, True); ip = Hh(46 + 3.5 * ps.look[0], -18 + 4.5 * ps.look[1]); c.drawCircle(ip[0], ip[1], 6.4 * s, P((126, 78, 46))); c.drawCircle(ip[0], ip[1], 3 * s, P((20, 14, 20))); c.drawCircle(ip[0] - 2 * s, ip[1] - 2.4 * s, 1.5 * s, P((255, 255, 255), 235)); c.restore()
        ll = skia.Path(); ll.moveTo(*Hh(30, -17)); ll.quadTo(*Hh(41, -25 + 12 * lid), *Hh(53, -17 + 1 * lid)); c.drawPath(ll, SP((40, 24, 30), max(1.4, 3.2 * s)))
        for k_ in range(3): c.drawLine(*Hh(47 + k_ * 3, -19 + 2 * lid + k_ * 0.6), *Hh(51 + k_ * 3.4, -23 + 6 * lid + k_ * 1.4), SP((40, 24, 30), max(1, 1.8 * s)))
        br = skia.Path(); br.moveTo(*Hh(30, -34)); br.quadTo(*Hh(44, -40), *Hh(55, -33)); c.drawPath(br, SP(HAIR, max(1.6, 4.6 * s), 235))
        # hair: swept back from the hairline to the tie
        hair = smooth_closed([Hh(44, -62), Hh(22, -80), Hh(-10, -86), Hh(-50, -68), Hh(-75, -24), Hh(-66, 22), Hh(-40, 52), Hh(-30, 30), Hh(-18, 4), Hh(-2, -22), Hh(20, -42), Hh(38, -52)])
        shade(c, hair, HAIR, HAIR_SH, HAIR_HI, light, k=s, rim_a=170)
        for k_ in range(4):                                                                             # brushed back strands
            pa = skia.Path(); pa.moveTo(*Hh(34 - k_ * 7, -64 + k_ * 8)); pa.quadTo(*Hh(-16 - k_ * 4, -66 + k_ * 16), *Hh(-58, -38 + k_ * 6))
            c.drawPath(pa, SP(HAIR_HI, max(1.0, 1.8 * s), 70))
        tie = skia.Path(); tie.addCircle(*Hh(-62, -34), 11 * s); c.drawPath(tie, P(STRIPE))
        # ear
        ear = smooth_closed([Hh(-12, -8), Hh(0, -12), Hh(7, 2), Hh(1, 19), Hh(-9, 21), Hh(-15, 6)])
        shade(c, ear, mix(SKIN, SKIN_SH, 0.2), SKIN_SH, None, light, k=s * 0.5)
        pa = skia.Path(); pa.moveTo(*Hh(-8, -3)); pa.quadTo(*Hh(3, 0), *Hh(-4, 13)); c.drawPath(pa, SP(SKIN_SH, max(1, 2 * s), 200))
        # mask: strap round the head, a clear soft skirt on the face, a dark frame with the lens at the front, the nose pocket below
        st = skia.Path(); st.moveTo(*Hh(26, -27)); st.quadTo(*Hh(-14, -32), *Hh(-73, -16))
        c.drawPath(st, SP(MASK, 13 * s)); c.drawPath(st, SP((84, 100, 140), max(1, 2.6 * s), 170))
        skirt = smooth_closed([Hh(22, -42), Hh(58, -45), Hh(67, -28), Hh(72, -6), Hh(82, 8), Hh(70, 20), Hh(46, 10), Hh(24, -6)])
        c.drawPath(skirt, P((150, 214, 240), 62)); c.drawPath(skirt, SP((206, 240, 252), max(1.2, 2.4 * s), 170))
        nosep = smooth_closed([Hh(64, -6), Hh(73, -5), Hh(83, 8), Hh(71, 21), Hh(58, 12)])
        c.drawPath(nosep, P(MASK, 215))
        fr = skia.Path(); fr.moveTo(*Hh(57, -45)); fr.quadTo(*Hh(68, -28), *Hh(72, -6)); c.drawPath(fr, SP(MASK, 12 * s))
        gl = skia.Path(); gl.moveTo(*Hh(62, -42)); gl.quadTo(*Hh(72, -27), *Hh(76, -8)); c.drawPath(gl, SP(MASK_HI, max(1.2, 3.4 * s), 230))
        bk = tube(Hh(18, -30), Hh(28, -29), 20 * s, 20 * s); c.drawPath(bk, P(MASK))
        self.Hh = Hh

    # ------------------------------------------------------------------ whole figure
    def draw(self, c, ps, light=(0.25, -1.0), tint=(16, 70, 124), hand=None, xray=None):
        s = self.s; J = skeleton(ps); self.J = J; self._fin = ps.fin; self._hand = hand or H.FLAT
        self.P = {k: self.T(v) for k, v in J.items() if not k.endswith('dir') and '_dir' not in k and not k.startswith(('sdir', 'fdir', 'adir', 'hdir', 'tors'))}
        # far side first
        self.arm(c, J, 'f', True, light, tint)
        self.fin(c, J, 'f', True, light, tint)
        lp, lcl = self.leg(c, J, 'f', True, light, tint)
        shade(c, lp, mix(SUIT_SH, tint, 0.22), mix(SUIT_SH, (6, 10, 30), 0.5), None, light, k=s * 1.6)
        # torso and near leg: one outline, one shade
        cen = [self.T(_add(J['neck'], J['tors_dir'], -4)), self.T(J['chest']), self.T(J['waist']), self.T(J['hip']), self.T(_add(J['hip'], (0, 1), 40))]
        us = [0, 0.1, 0.27, 0.45, 0.62, 0.8, 0.92, 1.0]
        wf = [44, 72, 106, 84, 64, 70, 74, 64]; wb = [50, 82, 84, 64, 56, 86, 102, 84]
        if self.face < 0: wf, wb = wb, wf
        tp, tcl = skin(cen, us, [w * s for w in wf], [w * s for w in wb], n=30, cap0=0.25, cap1=0.2)
        self.fin(c, J, 'n', False, light, tint)
        np_, ncl = self.leg(c, J, 'n', False, light, tint)
        body = op(tp, np_)
        shade(c, body, SUIT, SUIT_SH, RIM, light, k=s * 1.6)
        # suit details: the coral side stripe follows the body from the armpit to the ankle, a waist seam, a knee panel
        c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
        st = skia.Path(); pts = [self.T(_add(J['chest'], J['tors_dir'], 40)), self.T(J['chest']), self.T(J['waist']), self.T(J['hip'])] + [tuple(p) for p in ncl[6:-1:3]]
        st.moveTo(*pts[0])
        rs = _resample(pts, 40)
        for q in rs[1:]: st.lineTo(*q)
        c.drawPath(st, SP(STRIPE, max(2.5, 9 * s), 240))
        wa = self.T(J['waist']); wd = self.TV(_rot(J['tors_dir'], 90))
        c.drawLine(wa[0] - wd[0] * 90 * s, wa[1] - wd[1] * 90 * s, wa[0] + wd[0] * 90 * s, wa[1] + wd[1] * 90 * s, SP(SUIT_SH, max(1.5, 4 * s), 170))
        kn = self.T(J['knee_n']); c.drawOval(skia.Rect(kn[0] - 26 * s, kn[1] - 34 * s, kn[0] + 26 * s, kn[1] + 34 * s), P(mix(SUIT, SUIT_HI, 0.2), 70))
        c.restore()
        if xray: xray(c, self, J)
        self.head(c, J, light, ps)
        self.arm(c, J, 'n', False, light, tint)
        return J


def _lerp2(a, b, u): return (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u)


def sheet(out):
    """model sheet: standing, free fall, kicking up, and the profile close"""
    s = skia.Surface(2000, 1500); c = s.getCanvas(); c.drawRect(skia.Rect(0, 0, 2000, 1500), P((20, 84, 140)))
    d = Diver(260, 640, 0.62); d.draw(c, Pose(arm=(4, -4), flow=(-0.2, -1)))
    d = Diver(700, 520, 0.62, rot=180); d.draw(c, Pose(arm=(3, -3), hip=(3, -3), fin=(8, -8), flow=(0, -1), head=4))
    for i, ph in enumerate((0.0, 1.57)):
        k = math.sin(ph); k2 = math.sin(ph - 0.9)
        d = Diver(1100 + i * 330, 700, 0.6, rot=8); d.draw(c, Pose(arm=(176, 172), elbow=(6, 8), hip=(13 * k, -13 * k), knee=(max(0, 18 * k2 + 8), max(0, -18 * k2 + 8)), fin=(30 * k2, -30 * k2), flow=(-0.1, 1), bend=-4), hand=H.FLAT)
    d = Diver(1700, 1500, 2.0); d.draw(c, Pose(arm=(4, -4), flow=(-0.3, -1)))
    s.makeImageSnapshot().save(out)


if __name__ == '__main__':
    sheet('/home/claude/dv/out/stills/sheet.png')


def place(ps, s, rot, face, joint, target):
    """a Diver positioned so that one of her joints sits exactly on a screen point (for a hand that stays on the line, or a head held in frame)"""
    d0 = Diver(0, 0, s, rot, face); p = d0.T(skeleton(ps)[joint])
    return Diver(target[0] - p[0], target[1] - p[1], s, rot, face)
