"""Code drawn hoodie runner, built from shapes traced off the approved painting (src.png, the grey hoodie man
from the burning building scene). Same method as the paramedic (studio/codechar/model.py):
  - traced parts (head, hoodie details, fists, sneakers) ride their bones;
  - each limb is ONE winding filled outline per frame (sleeve tubes with dark cuffs, jeans tubes with a
    rolled hem), so a joint can never open a gap;
  - per frame lighting from the scene light: hard shadow band away from the light, warm fire rim facing it;
  - far limbs tinted darker; blinks swap the traced eye for a lid line.
Coordinates: char space is painting pixels, facing +x, y down, hip centre at (0,0)."""
import math, json
import numpy as np
import skia
import sys
sys.path.insert(0, '/home/claude/rig')
sys.path.insert(0, '/home/claude/trace')
from partrig import Rig
import vec

T = vec.load('/home/claude/runner/traced.json')
# the painting lit the front of the face cold blue; in the fire scene the face is warm skin with a cel shade step
# (trace.py merges those clusters into the skin; the merged median reads purple, so the skin fill is set back)
for _l in T['head']['layers']:
    _c = np.array([int(_l['fill'][j:j + 2], 16) for j in (1, 3, 5)])
    if np.abs(_c - np.array([0x6e, 0x52, 0x70])).sum() < 40:
        _l['fill'] = '#774945'
    _l['fill'] = {'eyew': '#e9e1dc', 'mouth': '#3b1d1e', 'eye': '#1d1a2c', 'brow': '#231a2a'}.get(_l.get('tag'), _l['fill'])

HOOD, HOOD_SH = (0x58, 0x5b, 0x6e), (0x37, 0x3a, 0x4d)
CUFF = (0x2a, 0x2a, 0x3c)
JEANS, JEANS_HEM = (0x33, 0x51, 0x75), (0x2b, 0x47, 0x69)
SEAM = (0x1d, 0x30, 0x4f)
FAR_TINT = 0.72


def C(rgb, a=255, k=1.0):
    return skia.Color(int(rgb[0] * k), int(rgb[1] * k), int(rgb[2] * k), a)


def rot(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s], [s, c]])


def affine(R, src_pivot, dst):
    t = np.array(dst, float) - R @ np.array(src_pivot, float)
    return np.hstack([R, t[:, None]])


def compose(A, B):
    A3 = np.vstack([A, [0, 0, 1]]); B3 = np.vstack([B, [0, 0, 1]])
    return (A3 @ B3)[:2]


def ap(M, p):
    return M @ np.array([p[0], p[1], 1.0])


# ------------------------------------------------------------------ painting landmarks
HIP_P, NECK_P = (276, 548), (346, 252)
LEAN = math.atan2(NECK_P[0] - HIP_P[0], HIP_P[1] - NECK_P[1])          # torso lean in the painting
M_TORSO = affine(rot(-LEAN), HIP_P, (0, 0))
TORSO_LEN = math.hypot(NECK_P[0] - HIP_P[0], NECK_P[1] - HIP_P[1])
NECK = (0.0, -TORSO_LEN)
M_HEAD = affine(rot(-0.35 * LEAN), NECK_P, NECK)                       # face stays near vertical
SH_P = (300, 292)
SH = tuple(ap(M_TORSO, SH_P))
WR_P, TIP_P = (147, 472), (146, 538)
M_HAND = affine(rot(math.pi / 2 - math.atan2(TIP_P[1] - WR_P[1], TIP_P[0] - WR_P[0])), WR_P, (0, 0))
ANK_P = (418, 904)
SOLE_A = math.atan2(905 - 960, 530 - 400)                              # the near sneaker is toe up in the painting
M_SHOE0 = affine(rot(-SOLE_A), ANK_P, (0, 0))
_sh = np.array([ap(M_SHOE0, p) for s in T['shoe']['sil'] for p in s])
ANKLE_H = float(_sh[:, 1].max())
FOOT_LEN = float(_sh[:, 0].max())
UP_L, LO_L, HAND_L = 118.0, 110.0, 64.0
TH_L, SHIN_L = 186.0, 186.0

BONES = [
    ("body", None, (0, 0), NECK),
    ("head", "body", NECK, (NECK[0], NECK[1] - 160)),
    ("f_up", "body", (SH[0] + 8, SH[1]), (SH[0] + 8, SH[1] + UP_L)),
    ("f_lo", "f_up", (SH[0] + 8, SH[1] + UP_L), (SH[0] + 8, SH[1] + UP_L + LO_L)),
    ("f_hand", "f_lo", (SH[0] + 8, SH[1] + UP_L + LO_L), (SH[0] + 8, SH[1] + UP_L + LO_L + HAND_L)),
    ("f_th", "body", (-6, 8), (-6, 8 + TH_L)), ("f_sh", "f_th", (-6, 8 + TH_L), (-6, 8 + TH_L + SHIN_L)),
    ("f_ft", "f_sh", (-6, 8 + TH_L + SHIN_L), (-6 + FOOT_LEN, 8 + TH_L + SHIN_L)),
    ("n_th", "body", (6, 8), (6, 8 + TH_L)), ("n_sh", "n_th", (6, 8 + TH_L), (6, 8 + TH_L + SHIN_L)),
    ("n_ft", "n_sh", (6, 8 + TH_L + SHIN_L), (6 + FOOT_LEN, 8 + TH_L + SHIN_L)),
    ("n_up", "body", SH, (SH[0], SH[1] + UP_L)), ("n_lo", "n_up", (SH[0], SH[1] + UP_L), (SH[0], SH[1] + UP_L + LO_L)),
    ("n_hand", "n_lo", (SH[0], SH[1] + UP_L + LO_L), (SH[0], SH[1] + UP_L + LO_L + HAND_L)),
]

TORSO_P = [(248, 206), (285, 207), (318, 220), (335, 232), (352, 246), (366, 262), (373, 280), (375, 300), (374, 350),
           (372, 395), (362, 425), (355, 450), (351, 480), (347, 510), (338, 528), (300, 526), (250, 522), (208, 518),
           (206, 490), (210, 450), (222, 400), (230, 365), (236, 330), (238, 295), (237, 262), (240, 230)]
# pelvis (jeans) in rest char space: from under the hem down to the crotch
PELVIS = [(-66, -34), (64, -36), (60, 10), (40, 44), (0, 58), (-42, 44), (-62, 12)]
TUBES = {
    "up": ((27, 27), (23, 23)), "lo": ((23, 23), (19, 19)),
    "th": ((39, 39), (31, 31)), "sh": ((31, 31), (26, 26)),
}

def smooth_closed(pts, M=None, tension=0.5):
    """Catmull-Rom through pts (closed) as a skia path, optionally mapped by 2x3 M."""
    P = [np.array(p, float) for p in pts]
    if M is not None:
        P = [M @ np.array([*p, 1.0]) for p in P]
    n = len(P)
    path = skia.Path(); path.moveTo(*P[0])
    for i in range(n):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % n], P[(i + 2) % n]
        c1 = p1 + (p2 - p0) * tension / 3
        c2 = p2 - (p3 - p1) * tension / 3
        path.cubicTo(*c1, *c2, *p2)
    path.close()
    return path


def wind(*paths):
    """Overlapping shapes as ONE path filled with the winding rule: the fill is the exact union, no boolean ops."""
    w = skia.Path()
    for p in paths:
        w.addPath(p)
    w.setFillType(skia.PathFillType.kWinding)
    return w


def union(a, b):
    """Robust union: boolean op, verified against a winding fill of both shapes (path ops can fail on near
    tangent caps at some scales and drop a sliver, which the gap check catches)."""
    w = skia.Path(a); w.addPath(b); w.setFillType(skia.PathFillType.kWinding)
    try:
        u = skia.Op(a, b, skia.PathOp.kUnion_PathOp)
    except Exception:
        u = None
    if u is None or u.isEmpty():
        return w
    # verify: dense samples inside each input shape must be inside the union
    for p in (b, a):
        bx = p.computeTightBounds()
        for x in np.linspace(bx.left(), bx.right(), 19)[1:-1]:
            for y in np.linspace(bx.top(), bx.bottom(), 19)[1:-1]:
                if p.contains(x, y) and not u.contains(x, y):
                    return w
    return u



class Runner(Rig):
    def __init__(self, light=(-0.86, -0.50), rim=(255, 150, 66), rim_a=235, shadow_k=0.68):
        super().__init__([dict(name=n, parent=p, head=h, tail=t) for n, p, h, t in BONES])
        self.L = np.array(light, float) / np.linalg.norm(light)
        self.rim, self.rim_a, self.shadow_k = rim, rim_a, shadow_k
        self.blink = 0.0           # 0 open, 1 closed
        self.parts = []           # (Rig.draw is replaced)

    # world 2x3 transform of a bone (rest char -> posed char)
    def bm(self, W, n):
        th, hr, hp = W[n]
        return affine(rot(th), hr, hp)

    # ---------------------------------------------------------------- shapes
    def traced(self, name, M, skip_tags=()):
        """[(path, color)] of a traced part under 2x3 M (painting -> canvas). First entry = silhouette."""
        sil = vec.to_path(T[name]['sil'], M)
        out = [(sil, None)]
        for j, l in enumerate(T[name]['layers']):
            if l.get('tag') in skip_tags:
                continue
            p = sil if l['segs'] is None else vec.to_path(l['segs'], M)
            out.append((p, l['fill']))
        return out

    @staticmethod
    def tube(a, b, w0, w1, cap0=True, cap1=True):
        """Closed outline from a to b with half widths w0=(front,back) at a and w1 at b; round caps optional."""
        a, b = np.array(a, float), np.array(b, float)
        d = b - a; L = np.linalg.norm(d) + 1e-9; u = d / L; n = np.array([-u[1], u[0]])
        p = skia.Path()
        # side 1 (n side) from a to b with a slight outward bow, side 2 back
        f0, k0 = w0; f1, k1 = w1
        A1, B1 = a + n * f0, b + n * f1
        A2, B2 = a - n * k0, b - n * k1
        bow = 0.04 * L
        p.moveTo(*A1)
        p.cubicTo(*(A1 + u * L / 3 + n * bow), *(B1 - u * L / 3 + n * bow), *B1)
        K = 0.5523
        if cap1:
            r = (f1 + k1) / 2; c = b + n * (f1 - k1) / 2
            p.cubicTo(*(c + n * r + u * r * K), *(c + u * r + n * r * K), *(c + u * r))
            p.cubicTo(*(c + u * r - n * r * K), *(c - n * r + u * r * K), *(c - n * r))
        else:
            p.lineTo(*B2)
        p.cubicTo(*(B2 - u * L / 3 - n * bow), *(A2 + u * L / 3 - n * bow), *A2)
        if cap0:
            r = (f0 + k0) / 2; c = a + n * (f0 - k0) / 2
            p.cubicTo(*(c - n * r - u * r * K), *(c - u * r - n * r * K), *(c - u * r))
            p.cubicTo(*(c - u * r + n * r * K), *(c + n * r - u * r * K), *(c + n * r))
        p.close()
        return p

    def limb(self, W, b1, b2, kind1, kind2, M, end_cap=True):
        """Union of two tubes along the posed bones (canvas space)."""
        P = lambda n: (M @ np.array([*self.joint(W, n), 1.0]))
        Q = lambda n: (M @ np.array([*self.tail(W, n), 1.0]))
        s = math.hypot(M[0, 0], M[1, 0])
        w = lambda k, i: tuple(v * s for v in TUBES[k][i])
        t1 = self.tube(P(b1), Q(b1), w(kind1, 0), w(kind1, 1))
        q2 = Q(b2)
        if not end_cap:                      # flat end reaches a little past the joint (sleeve over glove, hem over boot)
            d = q2 - P(b2); q2 = q2 + d / (np.linalg.norm(d) + 1e-9) * 5 * s
        t2 = self.tube(P(b2), q2, w(kind2, 0), w(kind2, 1), cap0=True, cap1=end_cap)
        return wind(t1, t2)

    # ---------------------------------------------------------------- lighting (pixel layers, no boolean ops)
    def lit(self, c, path, base, M, sh_w=22, k=1.0, details=None, sh_k=None, clip=None):
        """Fill path with base, details clipped inside, a soft light gradient, then the hard shadow band on the
        side away from the light (the path minus itself shifted toward the light, cut in a pixel layer)."""
        s = math.hypot(M[0, 0], M[1, 0])
        Lx, Ly = self.L
        paint = skia.Paint(AntiAlias=True)
        c.save()
        if clip is not None:
            c.clipPath(clip, doAntiAlias=True)
        paint.setColor(C(base, k=k)); c.drawPath(path, paint)
        c.save(); c.clipPath(path, doAntiAlias=True)
        for p, col in (details or []):
            paint.setColor(C(vec_rgb(col), k=k)); c.drawPath(p, paint)
        bnd = path.computeTightBounds()
        cx, cy = bnd.centerX(), bnd.centerY()
        R = 0.5 * math.hypot(bnd.width(), bnd.height())
        g = skia.GradientShader.MakeLinear([skia.Point(cx + Lx * R, cy + Ly * R), skia.Point(cx - Lx * R, cy - Ly * R)],
                                           [skia.Color(255, 236, 205, 26), skia.Color(255, 236, 205, 0)])
        c.drawPaint(skia.Paint(AntiAlias=True, Shader=g))
        c.restore()
        c.saveLayer(None, skia.Paint(Alphaf=1 - (sh_k or self.shadow_k)))
        c.drawPath(path, skia.Paint(AntiAlias=True, Color=skia.Color(10, 14, 40)))
        moved = skia.Path(path); moved.offset(Lx * sh_w * s, Ly * sh_w * s)
        c.drawPath(moved, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, BlendMode=skia.BlendMode.kDstOut))
        c.restore()
        c.restore()

    def occlude(self, c, path, under, M, r=7, a=95):
        """Soft contact shadow of path onto what is already drawn (clipped to `under`)."""
        s = math.hypot(M[0, 0], M[1, 0])
        sp = skia.Path(path); sp.offset(self.L[0] * -5 * s, self.L[1] * -5 * s)
        c.save(); c.clipPath(under, doAntiAlias=True)
        c.drawPath(sp, skia.Paint(AntiAlias=True, Color=skia.Color(6, 8, 26, a),
                                  MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * s)))
        c.restore()

    def fill_parts(self, c, S, paint, dx=0.0, dy=0.0):
        for p, clip in self.part_list(S):
            c.save()
            if clip is not None:
                c.clipPath(clip, doAntiAlias=True)
            c.translate(dx, dy)
            c.drawPath(p, paint)
            c.restore()

    def rim_light(self, c, S, M, w=4.2):
        """Warm rim on her outer silhouette, on the side facing the light (silhouette minus itself shifted)."""
        s = math.hypot(M[0, 0], M[1, 0])
        c.saveLayer(None, skia.Paint(Alphaf=self.rim_a / 255))
        self.fill_parts(c, S, skia.Paint(AntiAlias=True, Color=C(self.rim)))
        self.fill_parts(c, S, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, BlendMode=skia.BlendMode.kDstOut),
                        dx=-self.L[0] * w * s, dy=-self.L[1] * w * s)
        c.restore()

    def silhouette_fill(self, c, S, color, alpha=1.0):
        """Her silhouette filled once (no alpha build up where parts overlap)."""
        c.saveLayer(None, skia.Paint(Alphaf=alpha))
        self.fill_parts(c, S, skia.Paint(AntiAlias=True, Color=color))
        c.restore()

    def silhouette_edge(self, c, S, color, width=3.0, alpha=1.0):
        """A line along her outer silhouette (silhouette minus an eroded copy)."""
        c.saveLayer(None, skia.Paint(Alphaf=alpha))
        self.fill_parts(c, S, skia.Paint(AntiAlias=True, Color=color))
        c.saveLayer(None, skia.Paint(BlendMode=skia.BlendMode.kDstOut, ImageFilter=skia.ImageFilters.Erode(width, width)))
        self.fill_parts(c, S, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK))
        c.restore()
        c.restore()


    def part_list(self, S):
        """Every visible part as (path, clip or None): together they are his exact silhouette."""
        out = [(S['torso'], None), (S['pelvis'], None), (S['nleg'], S['nleg_clip'])]
        for k in ('farm', 'fleg', 'narm', 'fwstub', 'nwstub', 'fastub', 'nastub', 'fhem', 'nhem'):
            out.append((S[k], None))
        for k in ('fshoe', 'nshoe', 'ffist', 'nfist', 'head'):
            out.append((S[k][0][0], None))
        return out

    # ---------------------------------------------------------------- shapes
    def shapes(self, W, M):
        bm = lambda n: compose(M, self.bm(W, n))
        sc = math.hypot(M[0, 0], M[1, 0])
        P = lambda n: ap(M, self.joint(W, n))
        Q = lambda n: ap(M, self.tail(W, n))
        S = {}
        for sd in ('f', 'n'):
            S[sd + 'shoe'] = self.traced('shoe', compose(bm(sd + '_ft'), affine(np.eye(2), (0, 0), self.b[sd + '_ft']['head']) @ np.vstack([M_SHOE0, [0, 0, 1]])))
            S[sd + 'leg'] = self.limb(W, sd + '_th', sd + '_sh', 'th', 'sh', M, end_cap=False)
            ka, an = P(sd + '_sh'), Q(sd + '_sh')
            u = (an - ka) / (np.linalg.norm(an - ka) + 1e-9)
            S[sd + 'hem'] = self.tube(an - u * 30 * sc, an + u * 2 * sc, (31 * sc, 31 * sc), (32 * sc, 32 * sc),
                                      cap0=False, cap1=False)
            S[sd + 'hemline'] = (an - u * 30 * sc, u)
            st = skia.Path(); st.addCircle(an[0], an[1] - 4 * sc, 25 * sc)
            S[sd + 'astub'] = st
            S[sd + 'arm'] = self.limb(W, sd + '_up', sd + '_lo', 'up', 'lo', M, end_cap=False)
            lo_h, lo_t = P(sd + '_lo'), Q(sd + '_lo')
            u = (lo_t - lo_h) / (np.linalg.norm(lo_t - lo_h) + 1e-9)
            S[sd + 'cuff'] = self.tube(lo_t - u * 22 * sc, lo_t + u * 6 * sc, (21 * sc, 21 * sc), (21 * sc, 21 * sc),
                                       cap0=False, cap1=False)
            S[sd + 'fist'] = self.traced('fist', compose(bm(sd + '_hand'), affine(np.eye(2), (0, 0), self.b[sd + '_hand']['head']) @ np.vstack([M_HAND, [0, 0, 1]])))
            wr, tip = P(sd + '_hand'), Q(sd + '_hand')
            hu = (tip - wr) / (np.linalg.norm(tip - wr) + 1e-9)
            S[sd + 'wstub'] = self.tube(wr - hu * 14 * sc, wr + hu * 12 * sc, (14 * sc, 14 * sc), (14 * sc, 14 * sc))
            # jeans seam: a line down the front of the leg
            S[sd + 'seam'] = [P(sd + '_th'), P(sd + '_sh'), Q(sd + '_sh')]
        Mb = bm('body')
        S['Mb'] = Mb
        S['Mt'] = compose(Mb, M_TORSO)
        S['torso'] = smooth_closed(TORSO_P, S['Mt'], tension=0.45)
        S['pelvis'] = smooth_closed(PELVIS, Mb, tension=0.4)
        S['Mhd'] = compose(bm('head'), M_HEAD)
        S['head'] = self.traced('head', S['Mhd'], skip_tags=('eye', 'eyew') if self.blink > 0.5 else ())
        S['tdark'] = self.traced('tdark', S['Mt'])[0][0]
        S['hemband'] = self.traced('hem', S['Mt'])[0][0]
        S['strings'] = self.traced('strings', S['Mt'])[0][0]
        # near leg shows from under the hem (its top tucks under the hoodie)
        S['nleg_clip'] = smooth_closed([(-2000, -22), (2000, -30), (2000, 3000), (-2000, 3000)], Mb, tension=0.0)
        return S

    def seam(self, c, pts, M, k=1.0):
        s = math.hypot(M[0, 0], M[1, 0])
        a, kn, an = [np.array(p, float) for p in pts]
        p = skia.Path()
        def off(q, d):
            return q + np.array([d[1], -d[0]]) * 0  # centred
        d1 = (kn - a) / (np.linalg.norm(kn - a) + 1e-9); d2 = (an - kn) / (np.linalg.norm(an - kn) + 1e-9)
        n1 = np.array([-d1[1], d1[0]]); n2 = np.array([-d2[1], d2[0]])
        f = -1 if self.facing < 0 else 1
        A = a + d1 * 50 * s + n1 * 14 * s * f
        K = kn + (n1 + n2) / 2 * 12 * s * f
        B = an - d2 * 34 * s + n2 * 10 * s * f
        p.moveTo(*A); p.quadTo(*(K + (A - B) * 0.0), *B)
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=C(SEAM, 200, k), Style=skia.Paint.kStroke_Style,
                                 StrokeWidth=3.2 * s, StrokeCap=skia.Paint.kRound_Cap))

    def hemline(self, c, S, sd, M, k=1.0):
        s = math.hypot(M[0, 0], M[1, 0])
        q, u = S[sd + 'hemline']
        n = np.array([-u[1], u[0]])
        p = skia.Path(); p.moveTo(*(q + n * 30 * s)); p.lineTo(*(q - n * 30 * s))
        c.save(); c.clipPath(S[sd + 'hem'], doAntiAlias=True)
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=C(SEAM, 230, k), Style=skia.Paint.kStroke_Style, StrokeWidth=3.5 * s))
        c.restore()

    # ---------------------------------------------------------------- draw
    def draw(self, c, W, xf=None, only_alpha=False):
        M = np.eye(3)[:2] if xf is None else np.asarray(xf, float)[:2]
        self.facing = 1 if np.linalg.det(M[:, :2]) > 0 else -1
        S = self.shapes(W, M)
        if only_alpha:
            self.fill_parts(c, S, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK))
            return
        kf = FAR_TINT
        paint = skia.Paint(AntiAlias=True)
        drawn = skia.Path(); drawn.setFillType(skia.PathFillType.kWinding)
        add = drawn.addPath

        def clipped(path, clip, color):
            c.save(); c.clipPath(clip, doAntiAlias=True); paint.setColor(color); c.drawPath(path, paint); c.restore()

        def fist(sd, k):
            g = S[sd + 'fist']
            paint.setColor(C(vec_rgb(g[1][1]), k=k)); c.drawPath(S[sd + 'wstub'], paint)
            self.lit(c, g[0][0], vec_rgb(g[1][1]), M, sh_w=9, k=k, details=g[2:]); add(g[0][0])

        def shoe(sd, k):
            b = S[sd + 'shoe']
            paint.setColor(C(vec_rgb(b[1][1]), k=k)); c.drawPath(S[sd + 'astub'], paint)
            self.lit(c, b[0][0], vec_rgb(b[1][1]), M, sh_w=7, k=k, details=b[2:]); add(b[0][0])

        # far side (darker): fist, sleeve, cuff, sneaker, jeans
        fist('f', kf)
        self.lit(c, S['farm'], HOOD, M, sh_w=16, k=kf); add(S['farm'])
        clipped(S['fcuff'], S['farm'], C(CUFF, k=kf))
        shoe('f', kf)
        self.lit(c, S['fleg'], JEANS, M, sh_w=22, k=kf); add(S['fleg'])
        c.save(); c.clipPath(S['fleg'], doAntiAlias=True); self.seam(c, S['fseam'], M, k=kf); c.restore()
        self.lit(c, S['fhem'], JEANS_HEM, M, sh_w=10, k=kf); add(S['fhem'])
        self.hemline(c, S, 'f', M, k=kf)
        # pelvis, head, hoodie
        self.lit(c, S['pelvis'], JEANS, M, sh_w=22, k=0.9); add(S['pelvis'])
        h = S['head']
        self.lit(c, h[0][0], vec_rgb(h[1][1]), M, sh_w=14, details=h[2:], sh_k=0.86); add(h[0][0])
        if self.blink > 0.5:
            self.lid(c, S['Mhd'])
        self.occlude(c, S['torso'], drawn, M, r=8, a=70)
        det = [(S['tdark'], '#373a4d'), (S['hemband'], '#393a4e'), (S['strings'], '#9198b9')]
        self.lit(c, S['torso'], HOOD, M, sh_w=24, details=det); add(S['torso'])
        # near leg from under the hem, sneaker first
        shoe('n', 1.0)
        c.save(); c.clipPath(S['nleg_clip'], doAntiAlias=True)
        self.occlude(c, S['nleg'], drawn, M)
        c.restore()
        self.lit(c, S['nleg'], JEANS, M, sh_w=22, clip=S['nleg_clip']); add(S['nleg'])
        c.save(); c.clipPath(S['nleg'], doAntiAlias=True); c.clipPath(S['nleg_clip'], doAntiAlias=True)
        self.seam(c, S['nseam'], M); c.restore()
        self.lit(c, S['nhem'], JEANS_HEM, M, sh_w=10); add(S['nhem'])
        self.hemline(c, S, 'n', M)
        # a prop held between the body and the near arm (a bag, a ball): optional hook, (canvas) -> None
        if getattr(self, 'between', None):
            self.between(c)
        # near arm on top
        self.occlude(c, S['narm'], drawn, M, r=9, a=110)
        fist('n', 1.0)
        self.lit(c, S['narm'], HOOD, M, sh_w=16); add(S['narm'])
        clipped(S['ncuff'], S['narm'], C(CUFF))
        self.rim_light(c, S, M)

    def lid(self, c, Mhd):
        p = skia.Path()
        pts = [(389.0, 176.0), (394, 180.5), (400, 181.0), (407, 178.0)]
        q = [Mhd @ np.array([x, y, 1.0]) for x, y in pts]
        p.moveTo(*q[0]); p.cubicTo(*q[1], *q[2], *q[3])
        s = math.hypot(Mhd[0, 0], Mhd[1, 0])
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(20, 12, 20), Style=skia.Paint.kStroke_Style,
                                 StrokeWidth=2.4 * s, StrokeCap=skia.Paint.kRound_Cap))


def vec_rgb(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))


def build():
    rig = Runner()
    spec = dict(spine="body", head="head", facing=1,
                arms={"near": ("n_up", "n_lo", "n_hand"), "far": ("f_up", "f_lo", "f_hand")},
                legs={"near": ("n_th", "n_sh", "n_ft"), "far": ("f_th", "f_sh", "f_ft")},
                ankle_h=ANKLE_H, foot_len=FOOT_LEN, stand_k=0.982, foot_rest={"near": 0.0, "far": 0.0},
                springs=[("n_lo", 3.2, 0.55), ("n_hand", 4.0, 0.5), ("f_lo", 3.2, 0.55), ("f_hand", 4.0, 0.5),
                         ("head", 2.6, 0.7)])
    joints = ["n_lo", "n_hand", "f_lo", "f_hand", "n_sh", "f_sh", "n_ft", "f_ft", "n_up", "f_up", "n_th", "f_th"]
    radius = {j: 12 for j in joints}
    return rig, spec, joints, radius
