"""Code drawn paramedic, built from shapes traced off the approved painting (source_painting.png).

Every frame she is redrawn from the skeleton:
  - traced parts (head, torso with collar and belt, sleeve patch and fold, gloves, boots) ride their bones;
  - each limb is ONE outline per frame (upper and lower segment unioned with round joints), so an elbow or knee
    can never open a gap and a straight limb is drawn straight (no stretched pixels);
  - lighting is worked out per frame from the scene light direction: a hard shadow band on the side away
    from the light and a warm rim on the side facing it, so the rim stays on the lit side however a limb turns;
  - far limbs are tinted darker, the way cutout animators separate depth;
  - blinks swap the traced eye for a lid line.
Coordinates: char space is painting pixels, facing +x, y down, hip centre at (0,0).
"""
import math, json
import numpy as np
import skia
import sys
sys.path.insert(0, '/home/claude/rig')
from partrig import Rig
import vec

T = vec.load('/home/claude/trace/traced.json')

NAVY, NAVY_SH = (0x25, 0x34, 0x66), (0x18, 0x23, 0x4b)
CUFF = (0x1a, 0x26, 0x50)
FAR_TINT = 0.74


def C(rgb, a=255, k=1.0):
    return skia.Color(int(rgb[0] * k), int(rgb[1] * k), int(rgb[2] * k), a)


def rot(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s], [s, c]])


def affine(R, src_pivot, dst):
    """2x3 matrix: x -> R (x - src_pivot) + dst."""
    t = np.array(dst, float) - R @ np.array(src_pivot, float)
    return np.hstack([R, t[:, None]])


def compose(A, B):
    """A after B (both 2x3)."""
    A3 = np.vstack([A, [0, 0, 1]]); B3 = np.vstack([B, [0, 0, 1]])
    return (A3 @ B3)[:2]


# ------------------------------------------------------------------ skeleton (rest pose, standing)
NECK = (0.0, -304.0)
BONES = [
    ("body", None, (0, 0), NECK),
    ("head", "body", (2, -304), (2, -470)),
    ("f_up", "body", (-6, -258), (-6, -93)), ("f_lo", "f_up", (-6, -93), (-6, 52)), ("f_hand", "f_lo", (-6, 52), (-6, 147)),
    ("f_th", "body", (-8, 8), (-8, 238)), ("f_sh", "f_th", (-8, 238), (-8, 458)), ("f_ft", "f_sh", (-8, 458), (89, 458)),
    ("n_th", "body", (6, 10), (6, 240)), ("n_sh", "n_th", (6, 240), (6, 460)), ("n_ft", "n_sh", (6, 460), (103, 460)),
    ("n_up", "body", (9, -255), (9, -90)), ("n_lo", "n_up", (9, -90), (9, 55)), ("n_hand", "n_lo", (9, 55), (9, 150)),
]

# painting -> rest char space for each traced part
HIP_P, NECK_P = (465, 555), (598, 283)
R_TORSO = rot(math.radians(-25))
M_TORSO = affine(R_TORSO, HIP_P, (0, 0))
M_HEAD = affine(rot(math.radians(-14)), NECK_P, (2, -304))
SH_P, EL_P = (585, 330), (610, 492)
a_up = math.atan2(EL_P[1] - SH_P[1], EL_P[0] - SH_P[0])
M_UPARM = affine(rot(math.pi / 2 - a_up), SH_P, (9, -255))      # patch and fold on the near upper arm
WR_P, TIP_P = (757, 533), (842, 545)
a_h = math.atan2(TIP_P[1] - WR_P[1], TIP_P[0] - WR_P[0])
MIRROR_Y = np.array([[1, 0, 0], [0, -1, 0]], float)            # thumb forward when the hand hangs
M_HAND = compose(affine(rot(math.pi / 2), (0, 0), (9, 55)),
                 compose(MIRROR_Y, affine(rot(-a_h), WR_P, (0, 0))))
ANK_P = (648, 775)
M_BOOT = affine(np.eye(2), ANK_P, (6, 460))
ANKLE_H, FOOT_LEN = 47.0, 97.0

# torso + pelvis silhouette in rest char space: the back line follows the traced back, the front line is the
# standing chest, waist and hip (the painting's front was hidden by her reaching arm)
TORSO_PTS = [(-30, -322), (-62, -286), (-84, -232), (-87, -178), (-80, -126), (-74, -84), (-76, -44),
             (-82, -8), (-88, 24), (-80, 56), (-54, 80), (-10, 90), (34, 82), (56, 44), (57, 4), (54, -40),
             (55, -92), (62, -140), (78, -186), (74, -232), (54, -272), (34, -300), (6, -318)]
BELT_Y = (-50, -24)        # belt band at the back (front sits 8 px lower)


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


# tube half widths (front, back) at the start and end of each segment, measured on the painting
TUBES = {
    "up": ((38, 39), (33, 33)), "lo": ((31, 32), (25, 25)),
    "th": ((54, 56), (45, 45)), "sh": ((44, 44), (36, 37)),
}


class Paramedic(Rig):
    def __init__(self, light=(-0.78, -0.62), rim=(255, 214, 160), rim_a=230, shadow_k=0.70):
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

    def part_list(self, S):
        """Every visible part as (path, clip or None): together they are her exact silhouette."""
        out = [(S['torso'], None), (S['nleg'], S['nleg_clip'])]
        for k in ('farm', 'fleg', 'narm', 'fwstub', 'nwstub', 'fastub', 'nastub'):
            out.append((S[k], None))
        for k in ('fboot', 'nboot', 'fglove', 'nglove', 'head'):
            out.append((S[k][0][0], None))
        return out

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

    # ---------------------------------------------------------------- draw
    def shapes(self, W, M):
        bm = lambda n: compose(M, self.bm(W, n))
        sc = math.hypot(M[0, 0], M[1, 0])
        S = {}
        for sd in ('f', 'n'):
            S[sd + 'boot'] = self.traced('boot', compose(bm(sd + '_ft'), M_BOOT))
            S[sd + 'leg'] = self.limb(W, sd + '_th', sd + '_sh', 'th', 'sh', M, end_cap=False)
            arm = self.limb(W, sd + '_up', sd + '_lo', 'up', 'lo', M, end_cap=False)
            lo_h = M @ np.array([*self.joint(W, sd + '_lo'), 1]); lo_t = M @ np.array([*self.tail(W, sd + '_lo'), 1])
            u = (lo_t - lo_h) / (np.linalg.norm(lo_t - lo_h) + 1e-9)
            cuff = self.tube(lo_t - u * 24 * sc, lo_t + u * 6 * sc, (30 * sc, 30 * sc), (30 * sc, 30 * sc), cap0=False, cap1=False)
            S[sd + 'arm'] = arm
            S[sd + 'cuff'] = cuff                     # drawn clipped to the arm
            S[sd + 'glove'] = self.traced('glove', compose(bm(sd + '_hand'), M_HAND))
            wr = M @ np.array([*self.joint(W, sd + '_hand'), 1]); hu = M @ np.array([*self.tail(W, sd + '_hand'), 1]) - wr
            hu /= np.linalg.norm(hu) + 1e-9
            S[sd + 'wstub'] = self.tube(wr - hu * 16 * sc, wr + hu * 14 * sc, (17 * sc, 17 * sc), (16 * sc, 16 * sc))
            an = M @ np.array([*self.joint(W, sd + '_ft'), 1])
            st = skia.Path(); st.addCircle(an[0], an[1] - 4 * sc, 31 * sc)
            S[sd + 'astub'] = st
        Mb = bm('body')
        S['Mb'] = Mb
        S['torso'] = smooth_closed(TORSO_PTS, Mb)
        S['Mt'] = compose(Mb, M_TORSO)
        S['Mhd'] = compose(bm('head'), M_HEAD)
        S['head'] = self.traced('head', S['Mhd'], skip_tags=('eye',) if self.blink > 0.5 else ())
        # near leg shows from the belt down (its top tucks under the belt)
        hipcut = smooth_closed([(-2000, -30), (2000, -22), (2000, 3000), (-2000, 3000)], Mb, tension=0.0)
        S['nleg_clip'] = hipcut
        Mu = compose(bm('n_up'), M_UPARM)
        S['armdet'] = self.traced('crease', Mu)[1:] + self.traced('patch', Mu)[1:]
        # belt: a band across the torso, clipped to it, slightly lower at the front
        belt = smooth_closed([(-120, BELT_Y[0]), (120, BELT_Y[0] + 9), (120, BELT_Y[1] + 9), (-120, BELT_Y[1])],
                             Mb, tension=0.0)
        S['belt'] = belt                              # drawn clipped to the torso
        loop = smooth_closed([(-22, BELT_Y[0] - 3), (-14, BELT_Y[0] - 3), (-14, BELT_Y[1] + 4), (-22, BELT_Y[1] + 4)],
                             Mb, tension=0.0)
        S['loop'] = loop
        return S

    def silhouette(self, S):
        u = skia.Path(S['torso'])
        for k in ('farm', 'fleg', 'nleg', 'narm', 'fcuff', 'ncuff', 'fwstub', 'nwstub', 'fastub', 'nastub'):
            u = union(u, S[k])
        for k in ('fboot', 'nboot', 'fglove', 'nglove', 'head'):
            u = union(u, S[k][0][0])
        return u

    def draw(self, c, W, xf=None, only_alpha=False, z_override=None):
        M = np.eye(3)[:2] if xf is None else np.asarray(xf, float)[:2]
        S = self.shapes(W, M)
        if only_alpha:     # exact coverage: every part drawn on its own, like the colour render
            self.fill_parts(c, S, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK))
            return
        kf = FAR_TINT
        paint = skia.Paint(AntiAlias=True)
        drawn = skia.Path(); drawn.setFillType(skia.PathFillType.kWinding)

        def add(p):
            drawn.addPath(p)

        def clipped(path, clip, color):
            c.save(); c.clipPath(clip, doAntiAlias=True); paint.setColor(color); c.drawPath(path, paint); c.restore()

        # far side (darker)
        g = S['fglove']
        paint.setColor(C(vec_rgb(g[1][1]), k=kf)); c.drawPath(S['fwstub'], paint)
        self.lit(c, g[0][0], vec_rgb(g[1][1]), M, sh_w=10, k=kf); add(g[0][0])
        self.lit(c, S['farm'], NAVY, M, sh_w=18, k=kf); add(S['farm'])
        clipped(S['fcuff'], S['farm'], C(CUFF, k=kf))
        b = S['fboot']; paint.setColor(C(vec_rgb(b[1][1]), k=kf)); c.drawPath(S['fastub'], paint)
        self.lit(c, b[0][0], vec_rgb(b[1][1]), M, sh_w=8, k=kf, details=b[2:]); add(b[0][0])
        self.lit(c, S['fleg'], NAVY, M, sh_w=24, k=kf); add(S['fleg'])
        # head (the neck tucks under the collar)
        h = S['head']
        self.lit(c, h[0][0], vec_rgb(h[1][1]), M, sh_w=16, details=h[2:], sh_k=0.84); add(h[0][0])
        if self.blink > 0.5:
            self.lid(c, S['Mhd'])
        # torso, pelvis and collar
        self.occlude(c, S['torso'], drawn, M, r=8, a=70)
        coll = self.traced('collar', S['Mt'])[1:]
        self.lit(c, S['torso'], NAVY, M, sh_w=26, details=coll); add(S['torso'])
        # near leg over the hip (its top tucks under the belt), boot first
        b = S['nboot']; paint.setColor(C(vec_rgb(b[1][1]))); c.drawPath(S['nastub'], paint)
        self.lit(c, b[0][0], vec_rgb(b[1][1]), M, sh_w=8, details=b[2:]); add(b[0][0])
        c.save(); c.clipPath(S['nleg_clip'], doAntiAlias=True)
        self.occlude(c, S['nleg'], drawn, M)
        c.restore()
        self.lit(c, S['nleg'], NAVY, M, sh_w=24, clip=S['nleg_clip']); add(S['nleg'])
        clipped(S['belt'], S['torso'], C((0x10, 0x0f, 0x19)))
        clipped(S['loop'], S['torso'], C((0x1e, 0x24, 0x44)))
        # near arm on top
        self.occlude(c, S['narm'], drawn, M, r=9, a=110)
        g = S['nglove']
        paint.setColor(C(vec_rgb(g[1][1]))); c.drawPath(S['nwstub'], paint)
        self.lit(c, g[0][0], vec_rgb(g[1][1]), M, sh_w=10); add(g[0][0])
        self.lit(c, S['narm'], NAVY, M, sh_w=18, details=S['armdet']); add(S['narm'])
        clipped(S['ncuff'], S['narm'], C(CUFF))
        # warm rim on the outer silhouette, on the side facing the light
        self.rim_light(c, S, M)

    def lid(self, c, Mhd):
        """Closed eye: a short dark arc where the eye was (painting coords 678..694, 206..214)."""
        p = skia.Path()
        pts = [(677.5, 207.0), (683, 212.5), (689, 213.5), (694.5, 210.5)]
        q = [Mhd @ np.array([x, y, 1.0]) for x, y in pts]
        p.moveTo(*q[0]); p.cubicTo(*q[1], *q[2], *q[3])
        s = math.hypot(Mhd[0, 0], Mhd[1, 0])
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(20, 10, 8), Style=skia.Paint.kStroke_Style,
                                 StrokeWidth=2.6 * s, StrokeCap=skia.Paint.kRound_Cap))


def vec_rgb(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))


def build():
    rig = Paramedic()
    spec = dict(spine="body", head="head", facing=1,
                arms={"near": ("n_up", "n_lo", "n_hand"), "far": ("f_up", "f_lo", "f_hand")},
                legs={"near": ("n_th", "n_sh", "n_ft"), "far": ("f_th", "f_sh", "f_ft")},
                ankle_h=ANKLE_H, foot_len=FOOT_LEN, stand_k=0.982, foot_rest={"near": 0.0, "far": 0.0},
                springs=[("n_lo", 3.2, 0.55), ("n_hand", 4.0, 0.5), ("f_lo", 3.2, 0.55), ("f_hand", 4.0, 0.5),
                         ("head", 2.6, 0.7)])
    joints = ["n_lo", "n_hand", "f_lo", "f_hand", "n_sh", "f_sh", "n_ft", "f_ft", "n_up", "f_up", "n_th", "f_th"]
    radius = {j: 14 for j in joints}
    return rig, spec, joints, radius
