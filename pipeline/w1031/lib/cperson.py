"""cperson: LevlPrep people built in code (Olivier 2026-11-01: "the characters should be made in code ... maybe just
improve their look or use a reference"; "shouldn't really be like same people every video").

RESEARCH NOTES (2026-11-01) and how they are applied here
- Cut-out rigs (Toon Boom Harmony character building, Godot cutout animation, Spine "How to cut your assets"): every
  joint is an overlap, never a butt join; the parent piece hides a round end of the child ("hidden joints"), and pieces
  are cut so the overlap stays covered at the full range of motion. Here every limb is ONE outline: the tangent hull of
  round cross sections at each joint, unioned, so a bend never opens a gap and there is no seam inside a limb.
  Clothing is a second plate over the body with flat ends (cuffs, hems) that cover the change of material.
  https://docs.toonboom.com/help/harmony-20/premium/getting-started/character-building.html
  https://docs.godotengine.org/en/3.5/tutorials/animation/cutout_animation.html
  https://ar.esotericsoftware.com/blog/How-to-cut-your-assets-for-animation
  https://docs.toonboom.com/help/harmony-12-2/premium/rigging/fix-articulations.html
- Shape language and silhouette (CG Master Academy "Starting with the shape", Rocketbrush shape language, Studio
  Liddell fundamentals, Binus "power of silhouette"): read the figure as a few big simple shapes first (torso mass,
  head, limb tubes), vary them per person (a barrel chest, a long neck, a square jaw) so casts read apart in
  silhouette; detail goes into a few small accents (buttons, band, stripes), never texture. The torso is built from
  ring cross sections, so build, belly and chest are parameters, not drawings.
  https://www.cgmasteracademy.com/blog/alex-untoria
  https://rocketbrush.com/blog/shape-language-in-game-character-design-how-to-make-characters-readable-and-consistent
  https://studioliddell.com/news/the-ultimate-guide-to-character-design-fundamentals
  https://binus.ac.id/bandung/dkv/2025/11/04/the-power-of-silhouette-designing-readable-characters-in-motion/
- Flat illustration (Clip Studio "important factors in creating flat illustration"): limited palette per shape, one
  hard shade shape plus one light accent, readable value contrast between neighbouring plates (far limbs darker).
  https://tips.clip-studio.com/en-us/articles/7258
- Line of action, follow through, walk cycles (Williams' Animator's Survival Kit as summarised in the UW CSE 459 walk
  assignment and GarageFarm's walk guide): contact, down, passing, up; the planted foot is LOCKED to the ground while
  the body passes over it; the hips are lowest just after contact and highest at passing; arms swing opposite to the
  legs; loose parts (hat brims, hair, hems) lag and settle. walk.py implements this with world space foot locks.
  https://courses.cs.washington.edu/courses/cse459/19au/assignments/assignment_5/index.html
  https://garagefarm.net/blog/walk-cycle-easy-steps-to-animate-walking-animation-for-beginners

HOW A PERSON IS MADE
- Spec: a parameter set (height, build, belly, shoulders, head size, jaw, nose, eyes, brows, hair style and colour,
  beard, scar, skin, and garments: top, vest, suspenders, trousers, boots, gloves, hat, suit stripes). Every story
  writes its own cast from its own reference sheet: change the numbers, not the code.
- Pose: pelvis position, facing (+1 right, -1 left), yaw (0 profile .. 1 front), torso lean and hunch, head turn,
  nod and roll, arms and legs as angles or as screen targets solved with two bone IK (bend side chosen by a preferred
  direction), foot pitch, hand poses (relaxed, fist, grip, open, gesture, flat), expression (eyes, blink, brows,
  mouth, talk), breathing.
- Head: a small 3D model (cranium sphere, jaw and chin points, nose, ears, eyes, brows, mouth, beard and hair halves,
  hats as rings) projected for any head turn, nod, roll and a slight camera pitch, so the same person reads in profile,
  three quarter and front.
- Shading: Light(shade direction, rim direction): every plate gets one hard shade tone away from the light (an offset
  difference, sized to the plate), the figure gets one thin warm rim on its lit silhouette, far limbs are darker, an
  optional tint pulls everything toward the scene's colour (dusk), and contact shadows sit under what touches ground.
"""
import math
from dataclasses import dataclass, field
import numpy as np
import skia

# ===================================================================== small helpers


def C(rgb, a=255):
    return skia.Color(int(max(0, min(255, rgb[0]))), int(max(0, min(255, rgb[1]))), int(max(0, min(255, rgb[2]))), int(max(0, min(255, a))))


def P(col, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), **k)


def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def dark(col, k):
    return tuple(c * k for c in col)


def smooth(u):
    u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def V(x, y=None):
    return np.array([x, y], float) if y is not None else np.array(x, float)


def poly(pts):
    p = skia.Path()
    if len(pts) < 2: return p
    p.moveTo(float(pts[0][0]), float(pts[0][1]))
    for q in pts[1:]: p.lineTo(float(q[0]), float(q[1]))
    p.close(); return p


def smooth_closed(pts, tension=1.0):
    """Catmull Rom closed curve through pts"""
    n = len(pts); p = skia.Path()
    if n < 3: return poly(pts)
    pts = [(float(a), float(b)) for a, b in pts]
    p.moveTo(*pts[0])
    k = 6.0 / tension
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / k, p1[1] + (p2[1] - p0[1]) / k)
        c2 = (p2[0] - (p3[0] - p1[0]) / k, p2[1] - (p3[1] - p1[1]) / k)
        p.cubicTo(*c1, *c2, *p2)
    p.close(); return p


def circle(c, r):
    p = skia.Path(); p.addCircle(float(c[0]), float(c[1]), float(max(0.1, r))); return p


def union(paths):
    """union of paths by pairwise Op (skia's OpBuilder dropped regions on some overlapping inputs)"""
    ps = [p for p in paths if p is not None and not p.isEmpty()]
    if not ps: return skia.Path()
    while len(ps) > 1:
        nxt = []
        for i in range(0, len(ps) - 1, 2):
            r = _try_op(ps[i], ps[i + 1], skia.PathOp.kUnion_PathOp)
            if r is None:          # skia gave up on this pair: keep both shapes (filled the same, so it looks identical)
                r = skia.Path(ps[i]); r.addPath(ps[i + 1]); r.setFillType(skia.PathFillType.kWinding)
            nxt.append(r)
        if len(ps) % 2: nxt.append(ps[-1])
        ps = nxt
    return ps[0]


def _try_op(a, b, kind):
    """skia's path ops sometimes fail on near coincident edges; retry with a tiny nudge before giving up"""
    for dx in (0.0, 0.013, -0.021, 0.037):
        try:
            bb = b if dx == 0.0 else skia.Path(b)
            if dx: bb.offset(dx, dx * 0.7)
            r = skia.Op(a, bb, kind)
            if r is not None: return r
        except RuntimeError:
            pass
    return None


def op(a, b, kind):
    if a is None or b is None: return a
    r = _try_op(a, b, kind)
    return r if r is not None else skia.Path()


def inter(a, b): return op(a, b, skia.PathOp.kIntersect_PathOp)
def diff(a, b): return op(a, b, skia.PathOp.kDifference_PathOp)


def hull2(c1, r1, c2, r2):
    """convex tangent hull of two circles (a tapered capsule)"""
    c1, c2 = V(c1), V(c2)
    d = c2 - c1; L = float(np.hypot(*d))
    if L < 1e-6 or L <= abs(r1 - r2):
        return circle(c1, r1) if r1 >= r2 else circle(c2, r2)
    u = d / L; k = (r1 - r2) / L; s = math.sqrt(max(0.0, 1 - k * k))
    n1 = V(k * u[0] - s * u[1], k * u[1] + s * u[0]); n2 = V(k * u[0] + s * u[1], k * u[1] - s * u[0])
    q = poly([c1 + r1 * n1, c2 + r2 * n1, c2 + r2 * n2, c1 + r1 * n2])
    return union([q, circle(c1, r1), circle(c2, r2)])


def tube(pts, radii):
    """one continuous tapered outline through joints: hulls of consecutive round sections, unioned"""
    return union([hull2(pts[i], radii[i], pts[i + 1], radii[i + 1]) for i in range(len(pts) - 1)])


def ik2(a, t, l1, l2, prefer):
    """two bone IK in screen space: root a, target t, bone lengths; the middle joint is put on the side of the line
    a->t that the preferred direction points to. Returns (mid, end); end is clamped to reach."""
    a, t = V(a), V(t)
    d = t - a; L = float(np.hypot(*d))
    L = max(abs(l1 - l2) + 1e-3, min(l1 + l2 - 1e-3, L))
    u = d / (np.hypot(*d) + 1e-9)
    end = a + u * L
    x = (l1 * l1 - l2 * l2 + L * L) / (2 * L); h = math.sqrt(max(0.0, l1 * l1 - x * x))
    n = V(-u[1], u[0])
    if np.dot(n, V(prefer)) < 0: n = -n
    return a + u * x + n * h, end


def adir(deg, face):
    """screen direction for an angle measured from straight down, positive toward the facing side"""
    r = math.radians(deg); return V(face * math.sin(r), math.cos(r))


def rotv(v, deg):
    r = math.radians(deg); c, s = math.cos(r), math.sin(r)
    return V(v[0] * c - v[1] * s, v[0] * s + v[1] * c)


def ang_of(v):
    return math.degrees(math.atan2(v[1], v[0]))


def convex_hull(pts):
    pts = sorted(set((round(float(x), 3), round(float(y), 3)) for x, y in pts))
    if len(pts) < 3: return pts
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]


# ===================================================================== light and plates
class Light:
    """sd: unit vector toward the key light (shade falls on the far side); rd: toward the rim light (usually the same).
    rim: colour, rim_w: px, rim_a: alpha; shade_k: shade crescent size as a fraction of a plate's width."""
    def __init__(self, sd=(0.8, -0.6), rd=None, rim=(255, 200, 130), rim_w=3.5, rim_a=220, shade_k=0.30, tint=None):
        self.sd = V(sd) / np.hypot(*sd)
        rd = rd if rd is not None else sd
        self.rd = V(rd) / np.hypot(*rd)
        self.rim, self.rim_w, self.rim_a, self.shade_k = rim, rim_w, rim_a, shade_k
        self.tint = tint                   # ((r, g, b), amount)

    def col(self, c):
        if self.tint is None: return c
        return mix(c, self.tint[0], self.tint[1])


def plate(c, lt, path, base, shade, width, k=None, rim_a=0, far=1.0, hi=0.10, k2=0.42):
    """flat fill; one hard shade tone on the side away from the key light and a narrower, deeper second tone along
    the far edge (k2: its size as a fraction of the first); a soft lighter band just inside the lit edge (hi: its
    strength); optional inner rim"""
    if path is None or path.isEmpty(): return
    base_ = lt.col(dark(base, far)); shade_ = lt.col(dark(shade, far))
    c.drawPath(path, P(base_))
    k = lt.shade_k if k is None else k
    if hi > 0 and width > 6:
        o = -lt.sd * width * 0.09
        q = skia.Path(path); q.offset(float(o[0]), float(o[1]))
        clip_diff_draw(c, path, q, P(mix(base_, (255, 250, 240), hi), 255))
    off = lt.sd * width * k
    q = skia.Path(path); q.offset(float(off[0]), float(off[1]))
    clip_diff_draw(c, path, q, P(shade_))
    if k2 > 0 and k > 0.05 and width * k > 4:
        q = skia.Path(path); o2 = off * k2; q.offset(float(o2[0]), float(o2[1]))
        clip_diff_draw(c, path, q, P(dark(shade_, 0.86)))
    if rim_a > 0:
        q = skia.Path(path); o = -lt.rd * lt.rim_w; q.offset(float(o[0]), float(o[1]))
        clip_diff_draw(c, path, q, P(lt.rim, rim_a))


def fold(c, lt, clip, pts, w, col, a=255):
    """a fabric fold: a short tapered crease (thin, wide, thin) in a darker tone, kept inside its plate"""
    pts = [V(p) for p in pts]
    if len(pts) == 2: pts = [pts[0], (pts[0] + pts[1]) / 2, pts[1]]
    f = tube(pts, [w * 0.25, w, w * 0.2])
    c.save(); c.clipPath(clip, skia.ClipOp.kIntersect, True); c.drawPath(f, P(lt.col(col), a)); c.restore()


def clip_diff_draw(c, path, minus, paint):
    """draw (path minus minus) with clips instead of a path op: skia's path ops can silently return the whole
    path on near coincident edges (a full body flashed in rim colour for one frame), clips never do"""
    c.save(); c.clipPath(minus, skia.ClipOp.kDifference, True); c.drawPath(path, paint); c.restore()


def dilate(path, d):
    """the path grown by d px (round joins)"""
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=2 * d, StrokeJoin=skia.Paint.kRound_Join, StrokeCap=skia.Paint.kRound_Cap)
    out = skia.Path()
    p.getFillPath(path, out)
    return union([out, path])


def gap_fill(parts, d):
    """closing between the parts of one figure: where two parts come within 2d px of each other, the thin pocket of
    background between them is filled (drawn behind both, in the colour of the one further back). parts: [(path, col)]
    in back to front order. Returns [(path, col)]."""
    dl = [(dilate(p, d), col) for p, col in parts if p is not None and not p.isEmpty()]
    out = []
    for i in range(len(dl)):
        for j in range(i + 1, len(dl)):
            q = inter(dl[i][0], dl[j][0])
            if q is not None and not q.isEmpty():
                out.append((q, dl[i][1]))
    return out


def rim_path(c, lt, path, a=None, w=None):
    if path is None or path.isEmpty(): return
    q = skia.Path(path); o = -lt.rd * (w or lt.rim_w); q.offset(float(o[0]), float(o[1]))
    clip_diff_draw(c, path, q, P(lt.rim, lt.rim_a if a is None else a))


def stripe_across(p0, p1, f, w, r):
    """a band across the segment p0->p1 at fraction f, width w, long enough to cross a tube of radius r"""
    p0, p1 = V(p0), V(p1); d = p1 - p0; L = np.hypot(*d) + 1e-9; u = d / L; n = V(-u[1], u[0])
    m = p0 + d * f
    return poly([m - u * w / 2 - n * r * 1.6, m + u * w / 2 - n * r * 1.6, m + u * w / 2 + n * r * 1.6, m - u * w / 2 + n * r * 1.6])


# ===================================================================== spec (a person) and pose
@dataclass
class Spec:
    name: str = 'person'
    height: float = 1.0          # overall scale
    build: float = 1.0           # girth of torso and limbs
    belly: float = 0.0           # 0 flat .. 1 round belly
    shoulders: float = 1.0       # shoulder width
    legs: float = 1.0            # leg length factor
    neck: float = 1.0            # neck length
    head: float = 1.0            # head size
    jaw: float = 1.0             # jaw width
    chin: float = 0.0            # -1 receding .. 1 strong
    nose: str = 'straight'       # straight, round, hook, button
    nose_size: float = 1.0
    eye: float = 1.0             # eye size
    brow: float = 1.0            # brow thickness
    brow_col: tuple = None
    lips: bool = False
    skin: tuple = (236, 172, 130)
    skin_sh: tuple = (206, 128, 96)
    hair: tuple = (70, 42, 30)
    hair_sh: tuple = (50, 30, 22)
    hair_style: str = 'short'    # short, side_part, cropped, bun, ponytail, curly, none
    beard: str = None            # full, short, stubble
    beard_col: tuple = None
    scar: bool = False
    mouth_col: tuple = None     # lip line colour (e.g. bluish with cold)
    cold: float = 0.0           # red nose tip and cheeks from the cold
    ear_back: float = 0.0       # moves the ears further back (head units), for long profiles
    cheek_tone: float = 0.0     # strength of a soft shade under the cheekbone and along the jaw
    jaw_shadow: float = 0.0     # strength of the shadow the jaw casts on the neck
    sideburn: bool = False      # a sideburn in front of the ear (shows under hats)
    torso: float = 1.0          # torso (spine) length factor
    blush: float = 0.0
    # garments
    top: dict = field(default_factory=lambda: dict(kind='shirt', col=(244, 230, 196), sh=(214, 194, 156), sleeves='long', collar=True))
    vest: dict = None            # dict(col, sh, buttons=(r,g,b))
    suspenders: tuple = None
    belt: tuple = None
    trousers: dict = field(default_factory=lambda: dict(col=(84, 98, 114), sh=(60, 72, 86), loose=1.0))
    boots: dict = field(default_factory=lambda: dict(col=(136, 78, 46), sh=(98, 54, 34), sole=(66, 40, 30), kind='boot'))
    gloves: tuple = None         # (col, sh)
    hat: dict = None             # dict(kind=brim|flatcap|beanie|helmet, col, sh, band, lamp)
    stripes: tuple = None        # reflective stripes on a suit
    patch: tuple = None          # chest patch colour


class Pose:
    DEFAULTS = dict(x=0.0, y=0.0, s=1.0, face=1, yaw=0.0, lean=0.0, hunch=0.0, br=0.0,
                    head_yaw=None, head_face=None, nod=0.0, roll=0.0, neck_lean=0.0,
                    arm_n=('ang', 8, 12), arm_f=('ang', -6, 12), leg_n=('ang', 2, 2), leg_f=('ang', -2, 2),
                    foot_n=0.0, foot_f=0.0, hand_n='relaxed', hand_f='relaxed', hand_rot_n=0.0, hand_rot_f=0.0,
                    eyes='open', blink=0.0, look=(0.0, 0.0), brow_ang=0.0, brow_up=0.0, mouth='closed', talk=0.0,
                    ground=None, far_arm_front=None, far_leg_front=False, hat_m=None, hat_off=False, hips_yaw=None,
                    cuffs_up=False, sway=0.0, t=0.0, near_arm_behind=False, arms_crossed=False,
                    wound=0.0, near_leg_front=False)

    def __init__(self, **kw):
        for k, v in self.DEFAULTS.items(): setattr(self, k, v)
        for k, v in kw.items():
            if k not in self.DEFAULTS: raise KeyError(k)
            setattr(self, k, v)

    def copy(self, **kw):
        d = {k: getattr(self, k) for k in self.DEFAULTS}; d.update(kw); return Pose(**d)


# ===================================================================== the head (3D model, projected)
class Head:
    PITCH = math.radians(9.0)      # the camera looks down a little, so brims and rings read as ellipses

    def __init__(self, center, R, face, yaw, nod=0.0, roll=0.0):
        self.c = V(center); self.R = R
        self.psi = math.radians(face * (1 - yaw) * 90.0)
        self.nod = math.radians(nod); self.roll = math.radians(roll)
        self.face = face

    def p(self, x, y, z):
        """unit head coords (x right when seen from the front, y up, z out of the face) -> (screen point, depth)"""
        cn, sn = math.cos(self.nod), math.sin(self.nod)
        y1 = y * cn - z * sn; z1 = y * sn + z * cn
        cp, sp = math.cos(self.psi), math.sin(self.psi)
        x2 = x * cp + z1 * sp; z2 = -x * sp + z1 * cp
        cq, sq = math.cos(self.PITCH), math.sin(self.PITCH)
        sy = -y1 * cq + z2 * sq; dep = z2 * cq + y1 * sq
        cr, sr = math.cos(self.roll), math.sin(self.roll)
        X = x2 * cr - sy * sr; Y = x2 * sr + sy * cr
        return self.c + self.R * V(X, Y), dep

    def pts(self, lst):
        return [self.p(*q)[0] for q in lst]

    def ring(self, y, r, n=40, x0=0.0, z0=0.0):
        return [self.p(x0 + r * math.cos(a), y, z0 + r * math.sin(a)) for a in np.linspace(0, 2 * math.pi, n, endpoint=False)]

    def hull_of(self, *rings):
        pts = [q[0] for rg in rings for q in rg]
        return poly(convex_hull(pts))

    def depth_dir(self, x, y, z):
        """depth of a direction (normal) for visibility"""
        a, d0 = self.p(0, 0, 0); b, d1 = self.p(x, y, z)
        return d1 - d0


# ===================================================================== the person
class Person:
    # base proportions in units (a 1000 unit tall adult)
    SPINE = 326.0
    THIGH, SHIN = 224.0, 224.0
    UPPER, FORE = 152.0, 132.0
    HAND = 92.0
    HEAD_R = 77.0
    HIP_UP = 548.0                 # hip joint height above the soles, standing

    def __init__(self, spec):
        self.sp = spec

    # -------------------------------------------------------------- measurements in px
    def u(self, pose):
        return pose.s * self.sp.height

    def lengths(self, pose):
        u = self.u(pose); L = self.sp.legs
        return dict(thigh=self.THIGH * u * L, shin=self.SHIN * u * L, upper=self.UPPER * u, fore=self.FORE * u,
                    hand=self.HAND * u, spine=self.SPINE * u * self.sp.torso, R=self.HEAD_R * u * self.sp.head, u=u)

    def kneel_hip_y(self, s, ground, thigh_ang, knee_r=40.0):
        """pelvis y for a pose whose kneeling leg has its knee on the ground"""
        u = s * self.sp.height
        return ground - self.THIGH * u * self.sp.legs * math.cos(math.radians(thigh_ang)) - knee_r * u * self.sp.build

    def standing_hip(self, pose):
        """hip height above the soles for a straight standing pose, in px"""
        return (self.THIGH + self.SHIN) * self.u(pose) * self.sp.legs * 0.995 + 60.0 * self.u(pose) * (self.sp.boots or {}).get("size", 1.12)

    # -------------------------------------------------------------- skeleton
    def skeleton(self, pose):
        sp = self.sp; Ln = self.lengths(pose); u = Ln['u']; f = pose.face
        yaw = pose.yaw
        J = dict(pelvis=V(pose.x, pose.y))
        fwd = V(f, 0.0)
        b = sp.build
        # spine points (with lean and hunch), and ring cross sections
        rings_def = [(-0.13, 54, 64, 100), (0.0, 72, 80, 112), (0.30, 68 + 40 * sp.belly, 66, 100 + 30 * sp.belly),
                     (0.60, 88 + 28 * sp.belly, 76, 118 + 18 * sp.belly), (0.82, 74, 72, 134 * sp.shoulders), (0.94, 56, 58, 100 * sp.shoulders),
                     (1.0, 34, 38, 50)]
        spine = []
        pos = V(J['pelvis']); prev = 0.0
        steps = 24
        for i in range(steps + 1):
            ff = i / steps
            ang = pose.lean + pose.hunch * smooth(ff)
            if i > 0:
                pos = pos + adir(180 - ang, f) * 0 + V(f * math.sin(math.radians(ang)), -math.cos(math.radians(ang))) * Ln['spine'] / steps
            spine.append((ff, V(pos), ang))
        def at(ff):
            if ff <= 0:
                p0, a0 = spine[0][1], spine[0][2]
                return p0 + V(f * math.sin(math.radians(a0)), -math.cos(math.radians(a0))) * Ln['spine'] * ff, a0
            i = min(steps - 1, int(ff * steps)); w = ff * steps - i
            return spine[i][1] * (1 - w) + spine[i + 1][1] * w, spine[i][2] * (1 - w) + spine[i + 1][2] * w
        J['at'] = at
        rings = []
        brk = 1 + 0.025 * pose.br
        for ff, F, B, W in rings_def:
            c, a = at(ff)
            up = V(f * math.sin(math.radians(a)), -math.cos(math.radians(a)))
            nf = V(-up[1], up[0]) if f > 0 else V(up[1], -up[0])     # forward normal (toward facing)
            if nf[0] * f < 0: nf = -nf
            k = brk if 0.4 < ff < 0.9 else 1.0
            ef = lerp(F, W, yaw) * b * u * k; eb = lerp(B, W, yaw) * b * u * k
            rings.append((ff, c, nf, ef, eb, up))
        J['rings'] = rings
        neck_c, neck_a = at(1.0)
        J['neck'] = neck_c
        sh_c, sh_a = at(0.84)
        upv = V(f * math.sin(math.radians(sh_a)), -math.cos(math.radians(sh_a)))
        nf = V(-upv[1], upv[0]);  nf = nf if nf[0] * f >= 0 else -nf
        W = 132 * sp.shoulders * b * u
        lift = 4 * u * pose.br
        sb = sh_c - nf * 12 * u * (1 - yaw) - upv * (4 + 4 * yaw) * u + upv * lift
        J['sh_n'] = sb - nf * W * 0.86 * yaw ** 0.6 + nf * 4 * u * (1 - yaw)
        J['sh_f'] = sb + nf * W * 0.86 * yaw ** 0.6 - nf * 6 * u * (1 - yaw)
        hy = pose.hips_yaw if pose.hips_yaw is not None else yaw
        hip_c, ha = at(0.0)
        hupv = V(f * math.sin(math.radians(ha)), -math.cos(math.radians(ha))); hnf = V(-hupv[1], hupv[0]); hnf = hnf if hnf[0] * f >= 0 else -hnf
        J['hip_n'] = hip_c - hnf * 46 * b * u * hy + hnf * 4 * u * (1 - hy) + hupv * 4 * u
        J['hip_f'] = hip_c + hnf * 46 * b * u * hy - hnf * 4 * u * (1 - hy) + hupv * 4 * u
        # head
        R = Ln['R']
        na = neck_a + pose.neck_lean
        nup = V(f * math.sin(math.radians(na)), -math.cos(math.radians(na)))
        J['head'] = neck_c + nup * (R * 0.98 + 6 * u * sp.neck) - V(f, 0) * R * 0.10 * (1 - yaw)
        J['R'] = R
        # limbs
        for side in ('n', 'f'):
            J.update(self._arm(pose, J, side, Ln))
            J.update(self._leg(pose, J, side, Ln))
        return J

    def _arm(self, pose, J, side, Ln):
        spec = getattr(pose, 'arm_' + side)
        sh = J['sh_' + side]; f = pose.face
        if spec[0] == 'ang':
            a1, a2 = spec[1], spec[2]; ab = spec[3] if len(spec) > 3 else 8.0
            y = pose.yaw; out = -1 if side == 'n' else 1
            s1 = f * a1 * (1 - y) + out * f * ab * y
            s2 = f * (a1 + a2) * (1 - y) + out * f * (ab * 0.6) * y
            fs = 1 - 0.25 * y * abs(math.sin(math.radians(a1)))
            el = sh + adir(s1, 1) * Ln['upper'] * fs
            wr = el + adir(s2, 1) * Ln['fore'] * (1 - 0.3 * y * abs(math.sin(math.radians(a1 + a2))))
        else:
            tgt = V(spec[1]); prefer = V(spec[2]) if len(spec) > 2 else V(-f, 0.6)
            el, wr = ik2(sh, tgt, Ln['upper'], Ln['fore'], prefer)
        return {'el_' + side: el, 'wr_' + side: wr}

    def _leg(self, pose, J, side, Ln):
        spec = getattr(pose, 'leg_' + side)
        hp = J['hip_' + side]; f = pose.face
        if spec[0] == 'ang':
            a1, a2 = spec[1], spec[2]; ab = spec[3] if len(spec) > 3 else 2.0
            y = pose.yaw; out = -1 if side == 'n' else 1
            s1 = f * a1 * (1 - y) + out * f * ab * y; s2 = f * (a1 - a2) * (1 - y) + out * f * ab * 0.3 * y
            kn = hp + adir(s1, 1) * Ln['thigh']
            an = kn + adir(s2, 1) * Ln['shin']
        elif spec[0] == 'fk2':
            # absolute thigh and shin angles from straight down (positive toward the facing side): kneeling, sitting
            kn = hp + adir(spec[1], f) * Ln['thigh']
            an = kn + adir(spec[2], f) * Ln['shin']
        else:
            tgt = V(spec[1]); prefer = V(spec[2]) if len(spec) > 2 else V(f, -0.2)
            kn, an = ik2(hp, tgt, Ln['thigh'], Ln['shin'], prefer)
        return {'kn_' + side: kn, 'an_' + side: an}

    # -------------------------------------------------------------- body shapes
    def torso_path(self, J, lo=-0.2, hi=1.01, extra=0.0, u=1.0):
        rings = [r for r in J['rings'] if lo - 1e-6 <= r[0] <= hi + 1e-6]
        front = [r[1] + r[2] * (r[3] + extra * u) for r in rings]
        back = [r[1] - r[2] * (r[4] + extra * u) for r in rings]
        pts = front + back[::-1]
        if lo < 0:
            c0 = rings[0]; pts.append(c0[1] - c0[5] * 22 * u)
        return smooth_closed(pts)

    def arm_parts(self, J, side, u, extra=0.0):
        b = self.sp.build
        sh, el, wr = J['sh_' + side], J['el_' + side], J['wr_' + side]
        up = [sh, sh * 0.5 + el * 0.5, el]
        fo = [el, el * 0.7 + wr * 0.3, wr]
        ru = [(36 + extra) * b * u, (31 + extra) * b * u, (25 + extra) * b * u]
        rf = [(25 + extra) * b * u, (27 + extra) * b * u, (19 + extra * 0.9) * b * u]
        return up, ru, fo, rf

    def leg_parts(self, J, side, u, extra=0.0):
        b = self.sp.build
        hp, kn, an = J['hip_' + side], J['kn_' + side], J['an_' + side]
        th = [hp, hp * 0.55 + kn * 0.45, kn]
        sh = [kn, kn * 0.7 + an * 0.3, an]
        rt = [(60 + extra) * b * u, (54 + extra) * b * u, (40 + extra) * b * u]
        rs = [(40 + extra) * b * u, (42 + extra) * b * u, (25 + extra) * b * u]
        return th, rt, sh, rs

    # -------------------------------------------------------------- feet
    def foot_path(self, pose, J, side, u):
        bt = self.sp.boots or {}
        an = J['an_' + side]; f = pose.face
        pitch = getattr(pose, 'foot_' + side)
        kind = bt.get('kind', 'boot')
        if isinstance(pitch, str) and pitch == 'auto':
            pitch = self.auto_pitch(pose, J, side, u)
        top = -96 if kind == 'tall' else (-62 if kind == 'boot' else -26)
        pts = [(-30, top), (-37, 6), (-42, 40), (-40, 54), (-30, 58), (118, 58), (138, 52), (142, 38), (130, 22), (96, 10), (54, -4), (30, top + 10), (24, top)]
        sole = [(-42, 44), (-42, 60), (-6, 60), (-4, 50), (14, 52), (30, 56), (120, 60), (139, 55), (143, 46), (40, 48), (-4, 44)]
        sq = 1 - 0.72 * pose.yaw
        bs = bt.get('size', 1.12)
        def tr(q):
            x, y = q[0] * sq * u * bs, q[1] * u * bs
            r = math.radians(pitch)
            x2 = x * math.cos(r) - y * math.sin(r); y2 = x * math.sin(r) + y * math.cos(r)
            return an + V(f * x2, y2)
        wid = 1 + 0.35 * pose.yaw
        return smooth_closed([tr((q[0], q[1])) for q in pts], 1.0), poly([tr(q) for q in sole]), tr((60, 58)), tr((-40, 56)), tr((140, 50))

    def auto_pitch(self, pose, J, side, u):
        """the foot pitch whose lowest sole point lands on pose.ground (searching from flat to toes tucked)"""
        bt = self.sp.boots or {}; bs = bt.get('size', 1.12); sq = 1 - 0.72 * pose.yaw
        an = J['an_' + side]; g = pose.ground if pose.ground is not None else an[1] + 60 * u * bs
        best, bp = 1e9, 0.0
        for p in range(-20, 101, 2):
            r = math.radians(p)
            low = max(an[1] + (x * sq * u * bs) * math.sin(r) + (60 * u * bs) * math.cos(r) for x in (-40, 140))
            e = abs(low - g) + (0 if low <= g + 2 else 1000)
            if e < best: best, bp = e, p
        return float(bp)

    # -------------------------------------------------------------- hands
    def hand_shape(self, kind, u, size):
        """paths in hand local coords (x along the forearm, y toward the thumb), scaled; returns (main, details)"""
        s = u * size * 0.88 * self.sp.build ** 0.5
        def T(pts, rr): return tube([V(p) * s for p in pts], [r * s for r in rr])
        lines = []
        if kind == 'grip':
            parts = [T([(0, 0), (28, 0)], [21, 24])]
            for k in range(4):
                y = -17 + k * 11.5
                parts.append(T([(28, y), (50, y + 1)], [8.5, 7.5]))
            parts.append(T([(14, -16), (32, -26), (46, -26)], [10, 9, 8]))
            main = union(parts)
            lines = [((36 * s, -11.5 * s), (52 * s, -11 * s)), ((36 * s, 0), (52 * s, 0.5 * s)), ((36 * s, 11.5 * s), (52 * s, 12 * s))]
        elif kind == 'fist':
            main = union([T([(6, 0), (36, 2)], [22, 25]), T([(30, -6), (44, 2)], [22, 20]), T([(12, 12), (30, 20), (42, 16)], [11, 10, 9])])
            lines = [((40 * s, -12 * s), (30 * s, -16 * s)), ((44 * s, -2 * s), (32 * s, -6 * s)), ((44 * s, 8 * s), (32 * s, 4 * s))]
        elif kind == 'open':
            parts = [T([(0, 0), (40, 0)], [20, 23])]
            for a, Lf, r in ((-26, 46, 8), (-9, 52, 8.5), (8, 50, 8.5), (25, 40, 7.5)):
                d = V(math.cos(math.radians(a)), math.sin(math.radians(a)))
                b0 = V(38, a * 0.55)
                parts.append(T([b0, b0 + d * Lf * 0.55, b0 + d * Lf], [r + 1, r, r * 0.85]))
            parts.append(T([(12, 16), (28, 34), (40, 46)], [10, 9, 7.5]))
            main = union(parts)
        elif kind == 'gesture':
            parts = [T([(0, 0), (40, 2)], [20, 23])]
            for a, Lf, r, cu in ((-22, 44, 8, -14), (-7, 50, 8.5, -10), (8, 48, 8.5, -6), (23, 38, 7.5, -4)):
                d = V(math.cos(math.radians(a)), math.sin(math.radians(a)))
                b0 = V(38, a * 0.55)
                m = b0 + d * Lf * 0.55; e = m + rotv(d, cu * 2) * Lf * 0.45
                parts.append(T([b0, m, e], [r + 1, r, r * 0.85]))
            parts.append(T([(12, 16), (26, 30), (38, 38)], [10, 9, 7.5]))
            main = union(parts)
            lines = [((40 * s, -8 * s), (72 * s, -16 * s)), ((40 * s, 3 * s), (78 * s, -2 * s)), ((40 * s, 14 * s), (74 * s, 14 * s))]
        elif kind == 'flat':
            main = union([T([(0, 0), (44, 0)], [18, 21]), T([(40, 0), (70, 1), (94, 3)], [21, 18, 14]), T([(12, 16), (28, 32), (44, 40)], [10, 9, 7.5])])
            lines = [((52 * s, -8 * s), (92 * s, -6 * s)), ((52 * s, 2 * s), (94 * s, 4 * s)), ((52 * s, 11 * s), (90 * s, 12 * s)), ((20 * s, 16 * s), (40 * s, 22 * s))]
        else:   # relaxed: fingers curl a little toward the palm
            main = union([T([(0, 0), (40, 0)], [19, 22]), T([(38, -2), (62, -6), (80, -14)], [21, 17, 13]), T([(10, 14), (26, 24), (38, 26)], [10, 9, 7.5])])
            lines = [((50 * s, -12 * s), (76 * s, -20 * s)), ((52 * s, 0), (80 * s, -6 * s))]
        return main, lines

    def draw_hand(self, c, lt, pose, J, side, u, far):
        kind = getattr(pose, 'hand_' + side)
        el, wr = J['el_' + side], J['wr_' + side]
        d = wr - el; d = d / (np.hypot(*d) + 1e-9)
        a = ang_of(d) + getattr(pose, 'hand_rot_' + side)
        main, lines = self.hand_shape(kind, u, 1.0)
        m = skia.Matrix(); m.setTranslate(float(wr[0]), float(wr[1])); m.preRotate(a)
        # thumb toward the facing side: mirror local y when needed
        yax = rotv(V(0, 1), a)
        want = V(pose.face, -0.3)
        if side == 'f': want = V(pose.face, -0.3)
        if np.dot(yax, want) < 0: m.preScale(1, -1)
        main.transform(m)
        gl = self.sp.gloves
        if gl:
            base, sh = gl
        else:
            base, sh = self.sp.skin, self.sp.skin_sh
        plate(c, lt, main, base, sh, 46 * u, far=far)
        ln = dark(sh, 0.88) if not gl else mix(base, (255, 255, 255), 0.28)     # glove seams read lighter
        for p0, p1 in lines:
            q0 = m.mapXY(*p0); q1 = m.mapXY(*p1)
            c.drawLine(q0.x(), q0.y(), q1.x(), q1.y(), skia.Paint(AntiAlias=True, Color=C(lt.col(dark(ln, far))), StrokeWidth=max(1.0, 3.2 * u), StrokeCap=skia.Paint.kRound_Cap, Style=skia.Paint.kStroke_Style))
        if gl:
            cuff = hull2(wr - d * 4 * u, 24 * u, wr + d * 6 * u, 23 * u)
            plate(c, lt, cuff, dark(base, 0.9), dark(sh, 0.9), 40 * u, far=far)
        return main

    # -------------------------------------------------------------- limbs with clothes
    def bend_folds(self, c, lt, clip, a, j, b, r, col, far, n=2):
        """creases on the inside of a bent joint (elbow, knee): a few short tapered folds fanning from the joint"""
        d1 = (a - j) / (np.hypot(*(a - j)) + 1e-9); d2 = (b - j) / (np.hypot(*(b - j)) + 1e-9)
        cosang = float(np.dot(d1, d2))
        if cosang < -0.6: return               # under about 55 degrees of bend: no creases
        inside = d1 + d2; inside = inside / (np.hypot(*inside) + 1e-9)
        k = min(1.0, (cosang + 0.6) / 0.8)
        for d_ in ((d1, d2) if n > 1 else (d1,)):
            # a thin crease from the inner corner of the bend running a little way up the limb
            p0 = j + inside * r * 0.25 + d_ * r * 0.35
            p1 = j + d_ * r * (1.1 + 0.6 * k) + inside * r * 0.1
            fold(c, lt, clip, [p0, p1], r * 0.12, dark(col, 0.86 * far), 200)

    def draw_arm(self, c, lt, pose, J, side, u, far=1.0):
        sp = self.sp; top = sp.top or {}
        up, ru, fo, rf = self.arm_parts(J, side, u)
        sil = []
        kind = top.get('kind', 'shirt'); sleeves = top.get('sleeves', 'long')
        skin = tube(up + fo[1:], ru + rf[1:])
        col, sh = top.get('col', (200, 200, 200)), top.get('sh', (160, 160, 160))
        ex = dict(shirt=5, tee=5, puffer=20, suit=8, coat=9).get(kind, 5)
        if kind == 'puffer' or kind == 'suit' or kind == 'coat' or sleeves == 'long':
            upx, rux, fox, rfx = self.arm_parts(J, side, u, ex)
            cuff_end = 0.94 if sp.gloves is None else 1.0
            fo2 = [fox[0], fox[1], fox[0] * (1 - cuff_end) + fox[2] * cuff_end]
            sl = tube(upx + fo2[1:], rux + rfx[1:])
            if kind == 'puffer':
                # puffy: the outline bulges between quilted bands
                bulges = []
                for seg, rr in ((upx, rux), (fo2, rfx)):
                    for k in range(3):
                        ff = (k + 0.5) / 3
                        m = seg[0] * (1 - ff) + seg[-1] * ff
                        bulges.append(circle(m, (rr[0] * (1 - ff) + rr[-1] * ff) * 1.04))
                sl = union([sl] + bulges)
            # the hand first so the cuff overlaps the wrist
            hp = self.draw_hand(c, lt, pose, J, side, u, far)
            if sp.gloves is None:
                stub = tube([fo[1], fo[2]], [rf[1], rf[2]])
                plate(c, lt, stub, sp.skin, sp.skin_sh, 40 * u, far=far)
            plate(c, lt, sl, col, sh, 64 * u, far=far)
            self.bend_folds(c, lt, sl, upx[0], upx[2], fox[2], rux[2], sh, far)
            if kind == 'puffer':
                for seg in (upx, fo2):
                    for ff in (0.34, 0.67):
                        band = inter(stripe_across(seg[0], seg[-1], ff, 5 * u, 60 * u), sl)
                        c.drawPath(band, P(lt.col(dark(sh, 0.82 * far))))
            if sp.stripes:
                for seg, rr, ff in ((upx, rux, 0.55), (fo2, rfx, 0.55)):
                    band = inter(inter(stripe_across(seg[0], seg[-1], ff, 16 * u, 60 * u), tube(seg, rr)), sl)
                    c.drawPath(band, P(lt.col(dark(sp.stripes, far))))
            if kind != 'puffer':
                # cuff band at the wrist end
                e0 = fo2[-1]; d = fo2[-1] - fo2[1]; d = d / (np.hypot(*d) + 1e-9)
                cf = inter(hull2(e0 - d * 16 * u, rfx[-1], e0, rfx[-1]), sl)
                c.drawPath(cf, P(lt.col(dark(sh, far))))
            sil += [sl, hp]
        else:
            hp = self.draw_hand(c, lt, pose, J, side, u, far)
            plate(c, lt, skin, sp.skin, sp.skin_sh, 46 * u, far=far)
            upx, rux, fox, rfx = self.arm_parts(J, side, u, ex)
            if sleeves == 'rolled':
                end = fox[0] * 0.72 + fox[1] * 0.28
                sl = tube(upx + [end], rux + [rfx[0] * 1.02])
                plate(c, lt, sl, col, sh, 60 * u, far=far)
                d = end - fox[0]; d = d / (np.hypot(*d) + 1e-9)
                roll = hull2(end - d * 12 * u, rfx[0] * 1.04, end + d * 8 * u, rfx[0] * 1.0)
                plate(c, lt, roll, mix(col, (255, 255, 255), 0.18), sh, 34 * u, k=0.45, far=far)
                # a fold on the upper sleeve
                fd = poly([up[0] * 0.5 + up[2] * 0.5 + V(0, 0), up[0] * 0.38 + up[2] * 0.62])
                sil += [sl, roll]
            else:   # short sleeves
                end = upx[0] * 0.35 + upx[2] * 0.65
                sl = tube([upx[0], end], [rux[0], rux[1] * 1.05])
                plate(c, lt, sl, col, sh, 60 * u, far=far)
                sil.append(sl)
            sil += [skin, hp]
        return union(sil)

    def draw_leg(self, c, lt, pose, J, side, u, far=1.0, seat=None):
        side_ = side
        sp = self.sp; tr = sp.trousers or {}
        th, rt, sh, rs = self.leg_parts(J, side, u)
        loose = tr.get('loose', 1.0)
        ex = 6 * loose
        thx, rtx, shx, rsx = self.leg_parts(J, side, u, ex)
        rsx[-1] = rsx[-1] + 6 * u * loose
        # boot
        bt = sp.boots
        sil = []
        if bt:
            bp, sole, mid, heel, toe = self.foot_path(pose, J, side, u)
            plate(c, lt, bp, bt['col'], bt['sh'], 70 * u, k=0.22, far=far)
            c.drawPath(sole, P(lt.col(dark(bt['sole'], far))))
            sil.append(union([bp, sole]))
        # trousers (or suit legs): one tube hip -> knee -> ankle, the cuff covering the boot top
        an = sh[-1]; kn = sh[0]
        d = an - kn; d = d / (np.hypot(*d) + 1e-9)
        cuff = an + d * (10 if (bt or {}).get('kind') != 'tall' else -26) * u
        legp = tube(thx + [shx[1], cuff], rtx + [rsx[1], rsx[-1]])
        # the top of the thigh tube must not poke out above the hips as a bump: keep it below a line across the
        # pelvis (perpendicular to the spine), then add the seat
        r1 = J['rings'][1]; pc = r1[1] + r1[5] * 30 * u; upv = r1[5]; side = V(-upv[1], upv[0])
        below = poly([pc + side * 3000, pc - side * 3000, pc - side * 3000 - upv * 3000, pc + side * 3000 - upv * 3000])
        tdir = (J['kn_' + side_] - J['hip_' + side_]); tdir = tdir / (np.hypot(*tdir) + 1e-9)
        if float(np.dot(tdir, -upv)) > 0.7:      # only a thigh that hangs down; a raised thigh keeps its round top
            legp = inter(legp, below)
        if seat is not None: legp = union([legp, seat])
        plate(c, lt, legp, tr.get('col', (90, 90, 100)), tr.get('sh', (60, 60, 70)), 92 * u, far=far)
        self.bend_folds(c, lt, legp, th[0], th[2], sh[2], rtx[2], tr.get('sh', (60, 60, 70)), far, n=2)
        if sp.stripes:
            for seg, rr, ff in ((thx, rtx, 0.62), ([shx[0], cuff], [rsx[0], rsx[-1]], 0.55)):
                band = inter(inter(stripe_across(seg[0], seg[-1], ff, 18 * u, 90 * u), tube(seg, rr)), legp)
                c.drawPath(band, P(lt.col(dark(sp.stripes, far))))
        if tr.get('pocket'):
            pc = th[0] * 0.45 + th[2] * 0.55
            dd = th[2] - th[0]; dd = dd / (np.hypot(*dd) + 1e-9); nn = V(-dd[1], dd[0])
            if np.dot(nn, V(-pose.face, 0)) < 0: nn = -nn
            pk = smooth_closed([pc - dd * 34 * u - nn * 22 * u, pc - dd * 34 * u + nn * 30 * u, pc + dd * 30 * u + nn * 30 * u, pc + dd * 34 * u - nn * 18 * u])
            c.drawPath(inter(pk, legp), P(lt.col(dark(tr.get('sh'), 0.92 * far))))
        sil.append(legp)
        return union(sil)

    # -------------------------------------------------------------- torso and clothes
    def draw_torso(self, c, lt, pose, J, u):
        sp = self.sp; top = sp.top or {}; f = pose.face; yaw = pose.yaw
        kind = top.get('kind', 'shirt')
        ex = dict(puffer=20, suit=6, coat=8).get(kind, 3)
        body = self.torso_path(J, 0.12, 1.0, ex, u)
        col, sh = top.get('col'), top.get('sh')
        sil = [body]
        if kind == 'puffer':
            # big quilted jacket from the hips up, high collar
            body = union([self.torso_path(J, -0.1, 1.0, ex, u), self.torso_path(J, -0.16, 0.06, ex + 14, u)])

        if kind == 'coat':
            body = union([self.torso_path(J, -0.2, 1.0, ex, u), self.torso_path(J, -0.2, 0.4, ex + 14, u)])
            th_n = J['hip_n'] * 0.15 + J['kn_n'] * 0.85; th_f = J['hip_f'] * 0.15 + J['kn_f'] * 0.85
            body = union([body, poly([J['at'](0.1)[0] - J['rings'][1][2] * 90 * u, J['at'](0.1)[0] + J['rings'][1][2] * 90 * u,
                                      th_f + J['rings'][1][2] * 70 * u, th_n - J['rings'][1][2] * 70 * u])])
        plate(c, lt, body, col, sh, 170 * u, k=0.24)
        rings = J['rings']; at = J['at']
        if kind in ('shirt', 'tee', 'suit', 'coat'):
            # waist folds where the shirt is tucked or gathered: short creases rising from the waist
            if kind in ('shirt', 'tee'):
                for ff, fr, ln in ((0.31, 0.2, 0.22), (0.32, -0.4, 0.18)):
                    pc, a_ = at(ff); r_ = J['rings'][2]
                    p0 = pc + r_[2] * (r_[3] * fr if fr > 0 else r_[4] * fr)
                    p1 = p0 + r_[5] * ln * self.SPINE * u + r_[2] * 16 * u
                    fold(c, lt, body, [p0, p1], 6 * u, dark(sh, 0.92), 150)
        def side_line(ff, ext_sign=1.0, frac=1.0):
            pc, a = at(ff)
            r = min(rings, key=lambda r: abs(r[0] - ff))
            return pc + r[2] * r[3] * frac * ext_sign
        # front centre line position (forward silhouette in profile, middle at front view)
        def front_c(ff, extra=0.0):
            pc, a = at(ff); r = min(rings, key=lambda r: abs(r[0] - ff))
            return pc + r[2] * ((r[3] + extra * u) * (1 - yaw) * 0.92)
        if kind == 'puffer':
            for ff in (0.15, 0.38, 0.6, 0.8):
                pc, a = at(ff); r = min(rings, key=lambda r: abs(r[0] - ff))
                w0 = pc - r[2] * (r[4] + ex * u) * 1.1; w1 = pc + r[2] * (r[3] + ex * u) * 1.1
                mid = (w0 + w1) / 2 + r[5] * -10 * u
                pth = skia.Path(); pth.moveTo(*w0); pth.quadTo(*(mid - r[5] * 14 * u), *w1)
                q = skia.Path(); q.moveTo(*w1); q.quadTo(*(mid - r[5] * 4 * u), *w0); pth.addPath(q)
                band = skia.Path(); band.moveTo(*w0); band.quadTo(*(mid + r[5] * (-14) * u), *w1); band.lineTo(*(w1 - r[5] * 6 * u)); band.quadTo(*(mid - r[5] * 20 * u), *(w0 - r[5] * 6 * u)); band.close()
                c.drawPath(inter(band, body), P(lt.col(dark(sh, 0.8))))
            # zip line and collar
            zl = [front_c(ff, ex) for ff in np.linspace(-0.08, 0.98, 12)]
            if yaw > 0.25:
                zp = tube(zl, [3 * u] * len(zl)); c.drawPath(inter(zp, body), P(lt.col(dark(sh, 0.75))))
            nc, na = at(1.0)
            col_p = hull2(nc - J['rings'][-1][5] * 30 * u, 52 * u * (0.6 + 0.4 * yaw), nc + J['rings'][-1][5] * 12 * u, 46 * u * (0.6 + 0.4 * yaw))
            plate(c, lt, col_p, col, sh, 60 * u, k=0.3)
            sil.append(col_p)
            return union(sil)
        # tucked shirt: a fold or two
        if kind in ('shirt', 'tee', 'suit', 'coat'):
            for ff, fr in ((0.48, 0.5), (0.7, 0.35)):
                p0 = side_line(ff, -1.0, 0.7); p1 = side_line(ff - 0.06, -1.0, 0.1)
            if sp.patch and kind == 'suit':
                pc = front_c(0.66, ex) - J['rings'][3][2] * 36 * u
                pk = smooth_closed([pc + V(-22, -18) * u, pc + V(22, -18) * u, pc + V(22, 22) * u, pc + V(-22, 22) * u])
                c.drawPath(inter(pk, body), P(lt.col(sp.patch)))
            if kind == 'suit':
                # zip from collar to waist, and a waist belt
                zl = [front_c(ff, ex) - J['rings'][3][2] * 4 * u for ff in np.linspace(0.3, 0.98, 10)]
                zp = tube(zl, [3.5 * u] * len(zl)); c.drawPath(inter(zp, body), P(lt.col(dark(sh, 0.8))))
            if sp.stripes and kind == 'suit':
                for ff in (0.75,):
                    pc, a = at(ff); r = J['rings'][4]
                    a0 = pc - r[2] * 300 * u; a1 = pc + r[2] * 300 * u
                    band = hull2(a0, 9 * u, a1, 9 * u)
                    band.offset(0, 0)
                # shoulder stripe runs over the near shoulder and down the side (like the reference suits)
                s0 = at(0.97)[0]; s1 = J['sh_n'] + (J['sh_n'] - at(0.84)[0]) * 0.2
                st = tube([at(0.94)[0] + J['rings'][4][2] * 30 * u * (1 - yaw), J['sh_n'] * 0.5 + at(0.3)[0] * 0.5 - J['rings'][2][2] * 20 * u], [9 * u, 8 * u])
                c.drawPath(inter(st, body), P(lt.col(sp.stripes)))
        # collar
        if top.get('collar') and kind in ('shirt', 'suit', 'coat'):
            nc, na = at(1.0); r = J['rings'][-1]
            fwdc = front_c(0.97, ex)
            kc = 0.55 + 0.45 * yaw          # a profile collar is a small turned down flap, not a bib
            cl = smooth_closed([nc - r[2] * 16 * u * kc - r[5] * 6 * u, fwdc + r[5] * 14 * u * kc, fwdc - r[5] * 18 * u * kc + r[2] * 4 * u, nc + r[2] * 6 * u - r[5] * 10 * u * kc])
            if kind == 'suit':
                cl = hull2(nc - r[2] * 14 * u, 36 * u, nc + r[2] * 12 * u + r[5] * 6 * u, 32 * u)
            plate(c, lt, cl, mix(col, (255, 255, 255), 0.1) if kind != 'suit' else dark(col, 0.92), sh, 30 * u, k=0.4)
            if kind != 'suit' and yaw > 0.3:
                # second collar point on the other side of the opening
                cl2 = smooth_closed([fwdc + r[5] * 18 * u, fwdc - r[2] * 34 * u * yaw + r[5] * 16 * u, fwdc - r[2] * 10 * u - r[5] * 22 * u])
                plate(c, lt, cl2, mix(col, (255, 255, 255), 0.1), sh, 26 * u, k=0.4)
        # vest
        if sp.vest:
            vs = sp.vest
            vb = self.torso_path(J, 0.04, 0.97, ex + 2.5, u)
            # opening: a V at the front centre, wider at the top
            ops = []
            top_c = front_c(0.99, ex + 30)
            mid_c = front_c(vs.get('v', 0.56), ex + 10)
            r = J['rings'][4]
            hw = (26 + 34 * yaw) * u
            ext = lerp(260, 1.0, yaw) * u + hw * yaw
            opn = poly([top_c - r[2] * hw + r[5] * 40 * u, top_c + r[2] * hw * yaw + r[5] * 40 * u, mid_c])
            vb = diff(vb, opn)
            # arm holes show the shirt at the shoulders
            for s_ in ('n', 'f'):
                ah = circle(J['sh_' + s_] + J['rings'][4][5] * 6 * u, 44 * u * self.sp.build)
                vb = diff(vb, inter(ah, body))
            plate(c, lt, vb, vs['col'], vs['sh'], 150 * u, k=0.22)
            # lapel edge and buttons along the opening
            for k in range(4):
                bp = mid_c * (1 - k / 5) + front_c(0.32, ex + 6) * (k / 5) - r[2] * 8 * u * (0.4 + yaw)
                if k > 0:
                    c.drawCircle(float(bp[0]), float(bp[1]), 4.5 * u, P(lt.col(vs.get('buttons', dark(vs['col'], 0.6)))))
            # pocket welt
            pw = at(0.45)[0] + J['rings'][3][2] * (J['rings'][3][3] * 0.35)
            c.drawPath(inter(hull2(pw - J['rings'][3][2] * 16 * u, 3 * u, pw + J['rings'][3][2] * 16 * u, 3 * u), vb), P(lt.col(dark(vs['sh'], 0.85))))
            sil.append(vb)
        if sp.suspenders:
            for lat in ((-0.42, 0.42) if yaw > 0.4 else (-0.15,)):
                pts = []
                for ff in (0.27, 0.6, 0.9):
                    pc, a = at(ff); r = min(J['rings'], key=lambda r: abs(r[0] - ff))
                    pts.append(pc + r[2] * (r[3] * (1 - yaw) * 0.3 + lat * 110 * u * yaw - 10 * u * (1 - yaw)))
                st = tube(pts, [8 * u] * 3)
                c.drawPath(inter(st, body), P(lt.col(sp.suspenders)))
                c.drawRect(skia.Rect.MakeXYWH(float(pts[0][0] - 7 * u), float(pts[0][1] - 4 * u), 14 * u, 10 * u), P(lt.col((150, 150, 150))))
        return union(sil)

    def draw_seat(self, J, u):
        """the trousers' seat: torso from the crotch to the waist"""
        return self.torso_path(J, -0.2, 0.32, 4, u)

    def draw_belt(self, c, lt, J, u, pose):
        if not self.sp.belt: return
        at = J['at']; r = J['rings'][2]
        pts = [at(0.27)[0] - r[2] * (r[4] + 6 * u), at(0.27)[0] + r[2] * (r[3] + 6 * u), at(0.33)[0] + r[2] * (r[3] + 6 * u), at(0.33)[0] - r[2] * (r[4] + 6 * u)]
        b = inter(poly(pts), self.torso_path(J, 0.2, 0.4, 7, u))
        c.drawPath(b, P(lt.col(self.sp.belt)))
        return b

    # -------------------------------------------------------------- head
    def head_model(self, pose, J):
        yaw = pose.yaw if pose.head_yaw is None else pose.head_yaw
        face = pose.face if pose.head_face is None else pose.head_face
        return Head(J['head'], J['R'], face, yaw, pose.nod, pose.roll)

    def cranium(self, H, k=1.0, dy=0.0, dz=0.0, top=1.0):
        """the skull as a projected ellipsoid (deeper than wide), as a convex outline"""
        pts = []
        for y in np.linspace(-0.55, 0.98, 9):
            r = math.sqrt(max(0.0, 1 - y * y))
            for a in np.linspace(0, 2 * math.pi, 28, endpoint=False):
                zz = math.sin(a); bk = 1.03 if zz > 0 else 1.18 + 0.14 * max(0.0, min(1.0, (y + 0.3) / 0.5)) * (1 - max(0.0, y - 0.55) / 0.45)
                pts.append(H.p(k * r * math.cos(a) * 0.96, k * y * top + 0.08 + dy, k * r * zz * bk - 0.04 + dz)[0])
        pts.append(H.p(0, 0.08 + dy + k * top, -0.08 + dz)[0])
        # a round occiput: a small ball at the back of the skull so a profile never ends in a flat edge behind the ear
        for a_ in np.linspace(0, 2 * math.pi, 16, endpoint=False):
            for b_ in (-0.6, 0.0, 0.6):
                rr = 0.55 * math.cos(b_)
                pts.append(H.p(k * rr * math.cos(a_) * 0.9, k * (-0.15 + rr * math.sin(a_)) + dy, k * (-0.62 + 0.55 * math.sin(b_) * 0.0 - 0.35 * abs(math.cos(a_ / 2))) + dz)[0])
        # the occiput: the back of the skull rounds down behind the ears to the nape
        for x_, y_, z_ in ((0.0, -0.4, -1.1), (0.0, -0.64, -0.92), (0.42, -0.6, -0.84), (-0.42, -0.6, -0.84), (0.0, -0.82, -0.68)):
            pts.append(H.p(k * x_, k * y_ + dy, k * z_ - 0.04 + dz)[0])
        return pts

    def profile_curve(self, H):
        """the face's midline (forehead, brow, nose bridge, nose, lips, chin) as (y, z) pairs in head units"""
        sp = self.sp; ch = sp.chin; nk = sp.nose_size
        tipz = {'straight': 1.24, 'round': 1.19, 'hook': 1.27, 'button': 1.13}[sp.nose]
        tipz = 1.0 + (tipz - 1.0) * nk
        tipy = -0.36 if sp.nose != 'hook' else -0.33
        return [(0.62, 0.84), (0.42, 0.93), (0.22, 0.99), (0.1, 0.965), (-0.05, 0.99 + (0.05 if sp.nose == 'hook' else 0.0)),
                (tipy, tipz), (-0.43, 1.07), (-0.47, 1.0), (-0.57, 1.02), (-0.63, 0.97), (-0.7, 1.0), (-0.82, 0.93),
                (-0.96, 0.95 + 0.05 * ch), (-1.08, 0.84 + 0.04 * ch), (-1.15, 0.62), (-1.14, 0.35), (-1.06, 0.15)]

    def head_shape(self, H):
        sp = self.sp
        jw = sp.jaw; ch = sp.chin
        face_pts = [(0.44 * jw, -1.02, 0.5), (-0.44 * jw, -1.02, 0.5), (0, -1.1, 0.45), (0.62 * jw, -0.92, 0.22), (-0.62 * jw, -0.92, 0.22),
                    (0.72 * jw, -0.8, -0.06), (-0.72 * jw, -0.8, -0.06), (0.78, -0.45, -0.3), (-0.78, -0.45, -0.3),
                    (0.83, -0.28, 0.4), (-0.83, -0.28, 0.4), (0.6, -0.72, 0.55), (-0.6, -0.72, 0.55)]
        pts = self.cranium(H) + [H.p(*q)[0] for q in face_pts]
        hull = smooth_closed(convex_hull(pts), 0.7)
        # the midline profile, so brow, nose bridge, lips and chin show as soft curves when the head turns
        prof = self.profile_curve(H)
        fr = [H.p(0, y, z)[0] for y, z in prof]; bk = [H.p(0, y, 0.25)[0] for y, z in prof]
        quads = [hull]
        for i in range(len(prof) - 1):
            q = convex_hull([fr[i], fr[i + 1], bk[i + 1], bk[i]])
            if len(q) >= 3: quads.append(poly(q))
        return union(quads)

    def nose_path(self, H):
        prof = self.profile_curve(H)
        tip = prof[5]
        pts = [(0, 0.1, 0.97), (0.06, -0.1, 1.0), (0.15, -0.4, 0.98), (0, tip[0], tip[1]), (0, -0.44, 1.06), (-0.15, -0.4, 0.98), (-0.06, -0.1, 1.0)]
        return smooth_closed(convex_hull([H.p(*q)[0] for q in pts]), 1.0)

    def hair_cut(self, H, front_y=0.45, side_y=0.12, nape=-0.5):
        """region of the head BELOW the hairline (face, ears, neck): the face in front of the ears (hairline across the
        forehead, temples, sideburn line) swept down, plus the nape below the hair at the back swept down. The back of
        the skull between the ears and the nape stays hair at any head turn or nod."""
        # sweep along the head's own down axis (a bowed head sweeps forward, not into the back of the skull)
        dv = H.p(0, -1, 0.3)[0] - H.p(0, 0, 0.3)[0]; dvn = float(np.hypot(*dv)) + 1e-9
        down = dv / dvn * H.R * 4
        face = []
        for x_ in np.linspace(-0.85, 0.85, 9):
            z_ = math.sqrt(max(0.0, 1 - x_ * x_ - front_y * front_y)) * 1.02
            face.append((x_, front_y - 0.1 * x_ * x_, z_))
        for sx in (1, -1):
            face += [(0.97 * sx, side_y, 0.04), (0.99 * sx, side_y - 0.3, -0.12), (0.9 * sx, -0.7, -0.1)]
        pts = [H.p(*q)[0] for q in face]
        sweep = smooth_closed(convex_hull(pts + [p + down for p in pts]), 0.5)
        # only in front of the ears: the face sweep must never eat the back of the skull, whatever the nod
        front = poly(convex_hull([H.p(x_, y_, z_)[0] for x_ in (-3, 3) for y_ in (-4, 3) for z_ in (-0.14, 3)]))
        reg = [inter(sweep, front)]
        back = [(0.0, nape, -0.6), (0.55, nape + 0.08, -0.54), (-0.55, nape + 0.08, -0.54), (0.88, nape + 0.42, -0.3), (-0.88, nape + 0.42, -0.3)]
        bp = [H.p(*q)[0] for q in back]
        reg.append(smooth_closed(convex_hull(bp + [p + down for p in bp]), 0.5))
        return union(reg)

    def draw_head(self, c, lt, pose, J, u, t=0.0):
        sp = self.sp; H = self.head_model(pose, J); R = H.R
        skin, ssh = sp.skin, sp.skin_sh
        hs = self.head_shape(H)
        style = sp.hair_style
        hair_vol = None
        # long hair behind
        if style in ('bun', 'ponytail'):
            bp, d = H.p(0, 0.25, -0.95)
            bun = circle(bp, R * 0.36)
            plate(c, lt, bun, sp.hair, sp.hair_sh, R * 0.7)
        # neck
        nb = J['neck']; ntop = H.p(0, -0.62, -0.3)[0]
        # the neck column runs from the collar up into the skull behind the jaw, so the nape shows behind it
        bvec = H.p(0, -0.7, -0.85)[0] - H.p(0, -0.7, 0.0)[0]
        nape_pt = H.p(0, -0.72, -0.78)[0]
        neck = union([hull2(nb, R * 0.46, ntop, R * 0.44), hull2(nb + (ntop - nb) * 0.3, R * 0.46, H.p(0, -0.7, -0.5)[0], R * 0.4),
                      hull2(nb + bvec * 0.35, R * 0.44, nape_pt, R * 0.42)])     # the back of the neck up to the occiput
        plate(c, lt, neck, ssh, dark(ssh, 0.88), R, k=0.25, hi=0, k2=0)
        self._neck = neck
        if sp.jaw_shadow > 0:
            js = skia.Path(hs); dn = V(-math.sin(H.roll), math.cos(H.roll)) * R * 0.16; js.offset(float(dn[0]), float(dn[1]))
            c.save(); c.clipPath(neck, skia.ClipOp.kIntersect, True)
            c.drawPath(js, P(lt.col(dark(ssh, 0.8)), 255 * sp.jaw_shadow)); c.restore()
        plate(c, lt, hs, skin, ssh, R * 2.0, k=0.1, hi=0.06, k2=0)
        # under the jaw: everything below the jaw line (chin to jaw angle, then back to the nape) takes the neck's tone,
        # so the jaw reads as one clean edge and the head's lower hull never shows as a pale band (double chin)
        hyaw = pose.yaw if pose.head_yaw is None else pose.head_yaw
        c.save(); c.clipPath(hs, skia.ClipOp.kIntersect, True)
        dn_ = V(-math.sin(H.roll), math.cos(H.roll)) * R * 4
        for sx in ((1, -1) if hyaw < 0.3 else ()):     # profiles only: in turned views the jaw edge reads by itself
            jl = [H.p(0, -1.13, 0.46)[0], H.p(0.42 * sx * sp.jaw, -1.07, 0.38)[0], H.p(0.68 * sx * sp.jaw, -0.93, -0.12)[0], H.p(0.68 * sx, -0.92, -0.5)[0], H.p(0.3 * sx, -0.92, -0.8)[0]]
            c.drawPath(poly(convex_hull(jl + [p + dn_ for p in jl])), P(lt.col(ssh)))
        c.restore()
        if sp.cheek_tone > 0:
            c.save(); c.clipPath(hs, skia.ClipOp.kIntersect, True)
            for sx in (1, -1):
                pts = [(0.88 * sx, -0.28, 0.08), (0.78 * sx, -0.52, 0.3), (0.66 * sx, -0.8, 0.4), (0.7 * sx, -0.9, 0.18), (0.82 * sx, -0.7, -0.02), (0.88 * sx, -0.45, -0.06)]
                pr = [H.p(*q) for q in pts]
                if max(d for _, d in pr) < 0.0: continue
                c.drawPath(smooth_closed([q for q, _ in pr]), P(lt.col(mix(skin, dark(ssh, 0.92), 0.45)), 210 * sp.cheek_tone))
            c.restore()
        if sp.cold > 0:
            for sx in (1, -1):
                q, d = H.p(0.5 * sx, -0.36, 0.78)
                if d > 0.1:
                    c.drawOval(skia.Rect(q[0] - R * 0.2, q[1] - R * 0.1, q[0] + R * 0.2, q[1] + R * 0.1), P(lt.col((226, 120, 128)), 32 * sp.cold, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, max(0.5, R * 0.06))))
        if sp.blush > 0:
            for sx in (1, -1):
                q, d = H.p(0.55 * sx, -0.38, 0.75)
                if d > 0.1:
                    c.drawOval(skia.Rect(q[0] - R * 0.16, q[1] - R * 0.08, q[0] + R * 0.16, q[1] + R * 0.08), P(lt.col((236, 120, 110)), 90 * sp.blush))
        # beard
        if sp.beard:
            bc = sp.beard_col or sp.hair
            halves = []
            for sx in (1, -1):
                outer = [(0.93 * sx, -0.12, 0.1), (0.86 * sx, -0.52, 0.05), (0.7 * sx, -0.92, 0.1), (0.4 * sx, -1.22, 0.45), (0, -1.3, 0.72)]
                inner = [(0, -0.44, 1.03), (0.3 * sx, -0.46, 0.92), (0.58 * sx, -0.36, 0.76), (0.8 * sx, -0.16, 0.5), (0.9 * sx, -0.02, 0.3)]
                if sp.beard == 'short':
                    outer = [(0.97 * sx, -0.1, 0.1), (0.88 * sx, -0.55, 0.1), (0.68 * sx, -0.92, 0.1), (0.38 * sx, -1.16, 0.4), (0, -1.2, 0.52)]
                pr = [H.p(*q) for q in outer + inner]
                if max(d for _, d in pr) < -0.1: continue
                halves.append(smooth_closed([q for q, _ in pr]))
            bd = union(halves)
            plate(c, lt, bd, bc, dark(bc, 0.8), R * 1.6, k=0.18)
        # hair cap
        if style != 'none':
            cp = self.cranium(H, 1.06, 0.03, -0.03) + [H.p(x_, y_, z_)[0] for x_, y_, z_ in ((0, -1.08, -0.62), (0.5, -1.0, -0.56), (-0.5, -1.0, -0.56), (0.82, -0.62, -0.5), (-0.82, -0.62, -0.5), (0, -0.85, -0.86), (0.4, -0.8, -0.8), (-0.4, -0.8, -0.8))]
            lumps = []
            if style == 'side_part':
                # volume over the forehead, swept to one side (part on the person's left)
                cp = cp + [H.p(x_, y_, z_)[0] for x_, y_, z_ in ((0.2, 1.12, 0.45), (-0.35, 1.08, 0.4), (0.55, 0.95, 0.5), (0.0, 0.95, 0.78), (-0.55, 0.9, 0.5))]
            vol = [smooth_closed(convex_hull(cp), 0.7)]
            if style == 'curly':
                for a in np.linspace(0, 2 * math.pi, 9, endpoint=False):
                    q, _ = H.p(1.0 * math.cos(a), 0.55 + 0.25 * math.sin(a * 2), 1.0 * math.sin(a)); vol.append(circle(q, R * 0.3))
            if style == 'ponytail':
                q0, _ = H.p(0, 0.2, -1.0)
                sw = 6 * math.sin(t * 2.0) * u
                vol.append(tube([q0, q0 + V(-H.face * R * 0.35 + sw, R * 0.6), q0 + V(-H.face * R * 0.3 + sw * 1.6, R * 1.2)], [R * 0.25, R * 0.22, R * 0.12]))
            vol = union(vol)
            fy = 0.52 if style != 'cropped' else 0.58
            cut = self.hair_cut(H, front_y=fy, side_y=0.14 if style != 'cropped' else 0.25, nape=-1.3)
            hp = diff(vol, cut)
            if sp.hat and not pose.hat_off and pose.hat_m is None and sp.hat.get('kind') in ('brim', 'flatcap', 'beanie', 'helmet'):
                hy = {'brim': sp.hat.get('y', 0.38), 'flatcap': 0.45, 'beanie': sp.hat.get('y', 0.3), 'helmet': 0.3}[sp.hat['kind']]
                above = H.hull_of(H.ring(hy - 0.02, 1.5, 40), H.ring(hy + 2.5, 1.5, 40))
                hp = diff(hp, above)
            if lumps:
                hp = union([hp] + [diff(l, self.hair_cut(H, front_y=0.62, side_y=0.3, nape=-0.3)) for l in lumps])
            if sp.sideburn:
                for sx in (1, -1):
                    pts = [(0.92 * sx, 0.3, 0.1), (0.96 * sx, -0.08, 0.04), (0.99 * sx, -0.1, -0.04), (0.99 * sx, 0.3, -0.12)]
                    pr = [H.p(*q) for q in pts]
                    if max(d for _, d in pr) < -0.05: continue
                    hp = union([hp, inter(smooth_closed([q for q, _ in pr]), hs)])
            plate(c, lt, hp, sp.hair, sp.hair_sh, R * 1.6, k=0.12, hi=0.1, k2=0)
            hair_vol = hp
        # ears
        for sx in (1, -1):
            q, d = H.p(0.97 * sx, -0.13, -0.16 - sp.ear_back)
            if d < -0.25: continue
            w = R * (0.11 + 0.08 * min(1, max(0, d + 0.25) / 0.6) * (1 if d > -0.1 else 0.5))
            e = skia.Path(); e.addOval(skia.Rect(q[0] - w, q[1] - R * 0.23, q[0] + w, q[1] + R * 0.21))
            m = skia.Matrix(); m.setRotate(math.degrees(H.roll), float(q[0]), float(q[1])); e.transform(m)
            plate(c, lt, e, skin, ssh, R * 0.4, k=0.3)
            inner = skia.Path(); inner.addOval(skia.Rect(q[0] - w * 0.45, q[1] - R * 0.15, q[0] + w * 0.45, q[1] + R * 0.12)); inner.transform(m)
            c.drawPath(inner, P(lt.col(dark(ssh, 0.92))))
        # features, kept inside the face (the nose may stand out of the profile)
        c.save(); c.clipPath(union([hs] + ([bd] if sp.beard else [])), skia.ClipOp.kIntersect, True)
        self.draw_face(c, lt, pose, H, u, t, nose=False)
        c.restore()
        nz = self.nose_path(H)
        plate(c, lt, nz, skin, ssh, R * 0.3, k=0.45)
        if sp.cold > 0:
            q, d = H.p(0, -0.34, 1.12)
            c.save(); c.clipPath(nz, skia.ClipOp.kIntersect, True)
            c.drawCircle(float(q[0]), float(q[1]), R * 0.13, P(lt.col((226, 118, 124)), 110 * sp.cold))
            c.restore()
        for sx in (1, -1):
            q, d = H.p(0.07 * sx, -0.44, 1.04)
            if d > 0.55:
                c.drawOval(skia.Rect(float(q[0] - R * 0.05), float(q[1] - R * 0.025), float(q[0] + R * 0.05), float(q[1] + R * 0.025)), P(lt.col(dark(ssh, 0.85))))
        # hat
        if sp.hat and not pose.hat_off:
            self.draw_hat(c, lt, pose, H, u, t)
        extra = [p for p in (hair_vol, bd if sp.beard else None, nz) if p is not None]
        return union([hs] + extra), H

    def draw_face(self, c, lt, pose, H, u, t, nose=True):
        sp = self.sp; R = H.R
        skin, ssh = sp.skin, sp.skin_sh
        dk = (52, 34, 32)
        # eyes: almond white, a big dark iris with a highlight, a strong upper lid line; lids drop for blink, half, squint
        blink = max(pose.blink, {'open': 0.0, 'half': 0.5, 'closed': 1.0, 'squint': 0.35}.get(pose.eyes, 0.0))
        es = sp.eye
        lidc = (40, 26, 26)
        for sx in (1, -1):
            nd = H.depth_dir(0.3 * sx, 0, 0.95)
            if nd < 0.02: continue
            inn = H.p(0.15 * sx, -0.06, 0.92)[0]; out = H.p(0.5 * sx, -0.03, 0.76)[0]
            topp = H.p(0.32 * sx, -0.04 + 0.12 * es, 0.89)[0]; bot = H.p(0.32 * sx, -0.04 - 0.08 * es, 0.88)[0]
            lw = max(1.3, R * 0.075)
            if blink > 0.92:
                pth = skia.Path(); pth.moveTo(*inn); pth.quadTo(*(bot * 0.7 + (inn + out) / 2 * 0.3), *out)
                c.drawPath(pth, skia.Paint(AntiAlias=True, Color=C(lt.col(lidc)), Style=skia.Paint.kStroke_Style, StrokeWidth=lw, StrokeCap=skia.Paint.kRound_Cap))
                continue
            al = smooth_closed([inn, topp, out, bot])
            c.drawPath(al, P(lt.col((252, 248, 240))))
            gx, gy = pose.look
            ic, _ = H.p(0.31 * sx + 0.1 * gx, -0.035 + 0.05 * gy, 0.92)
            ir = R * 0.105 * es * (0.8 + 0.2 * min(1, nd * 1.4))
            c.save(); c.clipPath(al, skia.ClipOp.kIntersect, True)
            c.drawOval(skia.Rect(float(ic[0] - ir * (0.55 + 0.45 * min(1, nd * 1.3))), float(ic[1] - ir), float(ic[0] + ir * (0.55 + 0.45 * min(1, nd * 1.3))), float(ic[1] + ir)), P(lt.col((58, 36, 30))))
            c.drawCircle(float(ic[0] + ir * 0.3), float(ic[1] - ir * 0.35), max(0.9, ir * 0.32), P((255, 255, 255), 230 * (1 - blink)))
            if blink > 0.02:
                mid = topp + (bot - topp) * blink
                sag = V(-math.sin(H.roll), math.cos(H.roll)) * R * 0.07 * min(1.0, blink * 1.6)
                lidp = skia.Path(); lidp.moveTo(*(inn + (topp - bot) * 2)); lidp.lineTo(*(out + (topp - bot) * 2)); lidp.lineTo(*(out + sag))
                lidp.quadTo(*(mid * 2 - (inn + out) / 2 + sag * 0.6), *(inn - sag * 0.3)); lidp.close()
                c.drawPath(lidp, P(lt.col(mix(skin, ssh, 0.35))))
            c.restore()
            mid = topp + (bot - topp) * blink
            sag = V(-math.sin(H.roll), math.cos(H.roll)) * R * 0.07 * min(1.0, blink * 1.6)
            lp = skia.Path(); lp.moveTo(*(inn - sag * 0.3)); lp.quadTo(*(mid * 2 - (inn + out) / 2 + sag * 0.6), *(out + (out - inn) * 0.08 + sag))
            c.drawPath(lp, skia.Paint(AntiAlias=True, Color=C(lt.col(lidc)), Style=skia.Paint.kStroke_Style, StrokeWidth=lw, StrokeCap=skia.Paint.kRound_Cap))
        # brows: thick at the inner end, tapering out; brow_ang > 0 lifts the inner ends (worried, sad), < 0 lowers them (focus)
        bcol = sp.brow_col or dark(sp.hair, 0.95)
        for sx in (1, -1):
            nd = H.depth_dir(0.3 * sx, 0.2, 0.9)
            if nd < -0.02: continue
            ba = pose.brow_ang; bu = pose.brow_up
            a = H.p(0.11 * sx, 0.15 + bu + 0.2 * ba, 0.96)[0]; b = H.p(0.32 * sx, 0.2 + bu + 0.02 * ba - 0.02 * max(0.0, ba), 0.9)[0]; e = H.p(0.55 * sx, 0.15 + bu - 0.07 * ba, 0.74)[0]
            th = R * 0.11 * sp.brow
            upn = V(-math.sin(H.roll), -math.cos(H.roll))
            pts = [a + upn * th * 0.55, b + upn * th * 0.6, e + upn * th * 0.15, e - upn * th * 0.15, b - upn * th * 0.4, a - upn * th * 0.45]
            c.drawPath(smooth_closed(pts), P(lt.col(bcol)))
        if pose.wound > 0:
            a, d1 = H.p(0.5, -0.24, 0.8)
            if d1 > 0.05:
                w_ = R * (0.05 + 0.03 * pose.wound)
                o = skia.Rect(float(a[0] - w_ * 1.3), float(a[1] - w_ * 0.8), float(a[0] + w_ * 1.3), float(a[1] + w_ * 0.8))
                c.drawOval(o.makeOutset(R * 0.04, R * 0.04), P(lt.col(mix(ssh, (170, 60, 60), 0.6)), 220 * min(1.0, pose.wound * 1.5)))
                c.drawOval(o, P(lt.col((70, 20, 24)), 255 * min(1.0, pose.wound * 1.5)))
                if pose.wound > 0.5:   # a trickle of blood down the cheek
                    b = H.p(0.5, -0.42, 0.78)[0]
                    c.drawPath(hull2(a, R * 0.03, b, R * 0.02), P(lt.col((150, 34, 36)), 230))
        # scar: healed, on the left cheek (the person's left = +x in head coords seen from the front)
        if sp.scar:
            a, d1 = H.p(0.5, -0.18, 0.84); b, d2 = H.p(0.28, -0.52, 0.92)
            if min(d1, d2) > 0.05:
                sc = hull2(a, R * 0.02, b, R * 0.03)
                c.drawPath(sc, P(lt.col(mix(ssh, (170, 80, 80), 0.4))))
                for k in (0.3, 0.65):
                    m = a * (1 - k) + b * k; n = rotv((b - a) / (np.hypot(*(b - a)) + 1e-9), 90) * R * 0.05
                    c.drawLine(float(m[0] - n[0]), float(m[1] - n[1]), float(m[0] + n[0]), float(m[1] + n[1]), skia.Paint(AntiAlias=True, Color=C(lt.col(mix(ssh, (170, 80, 80), 0.3))), StrokeWidth=max(1, R * 0.018), StrokeCap=skia.Paint.kRound_Cap))
        # mouth: a short lip line with a soft lower lip shade; open for talk, wince shows teeth
        nd = H.depth_dir(0, -0.6, 1)
        if nd > -0.25:
            mo = pose.mouth; tk = pose.talk
            open_ = {'talk': 0.05 + 0.13 * tk, 'open': 0.16, 'wince': 0.07}.get(mo, 0.0)
            curve = {'smile': -0.06, 'frown': 0.05, 'wince': 0.03, 'sad': 0.035}.get(mo, 0.0)
            wdt = {'wince': 0.27, 'smile': 0.25}.get(mo, 0.2)
            L_ = H.p(-wdt, -0.63 - curve, 0.9); Rr = H.p(wdt, -0.63 - curve, 0.9)
            top = H.p(0, -0.625, 1.0); bot = H.p(0, -0.63 - open_ + curve, 0.99)
            mcol = sp.mouth_col or (128, 60, 56)
            lip, ld = H.p(0, -0.715, 0.99)
            if ld > -0.1 and open_ < 0.1:
                c.drawOval(skia.Rect(float(lip[0] - R * 0.12), float(lip[1] - R * 0.035), float(lip[0] + R * 0.12), float(lip[1] + R * 0.035)), P(lt.col(mix(skin, sp.mouth_col, 0.6) if sp.mouth_col else mix(skin, ssh, 0.55))))
            if open_ > 0.02:
                pts = [L_[0], top[0], Rr[0], bot[0]] if L_[1] > -0.05 and Rr[1] > -0.05 else ([top[0], Rr[0], bot[0]] if Rr[1] > -0.05 else [L_[0], top[0], bot[0]])
                mp = smooth_closed(pts)
                c.drawPath(mp, P(lt.col(dark(sp.mouth_col, 0.55) if sp.mouth_col else (92, 34, 38))))
                c.save(); c.clipPath(mp, skia.ClipOp.kIntersect, True)
                tt = H.p(0, -0.655, 1.0)[0]
                if mo == 'wince':
                    c.drawRect(skia.Rect(-1e4, -1e4, 1e4, 1e4), P(lt.col((244, 240, 230))))
                else:
                    c.drawRect(skia.Rect(-1e4, -1e4, 1e4, float(tt[1])), P(lt.col((244, 240, 230))))
                    if sp.mouth_col is None:
                        c.drawOval(skia.Rect(float(bot[0][0] - R * 0.13), float(bot[0][1] - R * 0.07), float(bot[0][0] + R * 0.13), float(bot[0][1] + R * 0.05)), P(lt.col((214, 104, 104))))
                c.restore()
            else:
                a = L_[0] if L_[1] > -0.05 else top[0]; b = Rr[0] if Rr[1] > -0.05 else top[0]
                mid = H.p(0, -0.63 + curve * 0.9, 1.0)[0]
                pth = skia.Path(); pth.moveTo(*a); pth.quadTo(*(mid * 2 - (a + b) / 2), *b)
                c.drawPath(pth, skia.Paint(AntiAlias=True, Color=C(lt.col(mcol)), Style=skia.Paint.kStroke_Style, StrokeWidth=max(1.3, R * 0.055), StrokeCap=skia.Paint.kRound_Cap))

    def hat_paths(self, pose, H, t=0.0):
        """list of (path, base, shade, width, k) for the hat, back to front"""
        hat = self.sp.hat; R = H.R; out = []
        kind = hat['kind']; col, sh = hat['col'], hat['sh']
        if kind == 'brim':
            by = hat.get('y', 0.38); bw = hat.get('w', 1.6)
            flap = 0.04 * math.sin(t * 3.0) * hat.get('flap', 1.0)
            # brim curls up at the sides, dips a little at the front
            brim = [H.p(bw * math.cos(a), by - 0.04 + 0.14 * abs(math.cos(a)) - 0.07 * max(0, math.sin(a)) + flap * math.sin(a), 0.1 + bw * 0.92 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 48, endpoint=False)]
            bp = smooth_closed([q for q, _ in brim])
            out.append((bp, col, sh, R * 0.8, 0.3))
            ch = hat.get('h', 0.74)
            crown = smooth_closed(convex_hull([q[0] for rg in (H.ring(by, 1.0, 32), H.ring(by + ch * 0.7, 0.95, 32), H.ring(by + ch, 0.72, 32)) for q in rg]))
            out.append((crown, mix(col, (255, 255, 255), 0.05), sh, R * 1.5, 0.2))
            band = inter(H.hull_of(H.ring(by - 0.02, 1.03, 32), H.ring(by + 0.2, 1.02, 32)), crown)
            out.append((band, hat.get('band', dark(col, 0.6)), dark(hat.get('band', dark(col, 0.6)), 0.85), R, 0.2))
            # pinch dent at the top
            dent = smooth_closed([H.p(-0.36, by + ch * 0.98, 0.2)[0], H.p(0, by + ch * 0.86, 0.3)[0], H.p(0.36, by + ch * 0.98, 0.2)[0], H.p(0, by + ch * 1.04, -0.1)[0]])
            out.append((inter(dent, crown), sh, sh, R * 0.3, 0.0))
        elif kind == 'flatcap':
            by = 0.45
            crown = smooth_closed(convex_hull([q[0] for rg in (H.ring(by, 1.06, 32), H.ring(by + 0.5, 1.08, 32, z0=0.15), H.ring(by + 0.72, 0.8, 32, z0=0.12)) for q in rg]))
            peak = []
            for a in np.linspace(-0.15 * math.pi, 1.15 * math.pi, 20):
                peak.append(H.p(1.1 * math.cos(a), by - 0.02, 0.15 + 1.25 * math.sin(a))[0])
            for a in np.linspace(1.15 * math.pi, -0.15 * math.pi, 20):
                peak.append(H.p(1.02 * math.cos(a), by + 0.05, 1.0 * math.sin(a))[0])
            out.append((smooth_closed(peak), dark(col, 0.85), dark(sh, 0.85), R * 0.6, 0.3))
            out.append((crown, col, sh, R * 1.7, 0.22))
            seam = inter(H.hull_of(H.ring(by + 0.42, 1.12, 32, z0=0.15), H.ring(by + 0.47, 1.12, 32, z0=0.15)), crown)
            out.append((seam, dark(sh, 0.95), sh, R * 0.1, 0.0))
        elif kind == 'beanie':
            by = hat.get('y', 0.3)
            dome = smooth_closed(convex_hull([q[0] for rg in (H.ring(by, 1.1, 32), H.ring(by + 0.5, 1.02, 32), H.ring(by + 0.9, 0.72, 32), H.ring(by + 1.08, 0.3, 16)) for q in rg]))
            out.append((dome, col, sh, R * 1.8, 0.2))
            rib = inter(H.hull_of(H.ring(by - 0.04, 1.14, 40), H.ring(by + 0.34, 1.12, 40)), dome)
            out.append((rib, dark(col, 0.86), dark(sh, 0.9), R * 1.2, 0.18))
            # rib lines
            for a in np.linspace(0, 2 * math.pi, 26, endpoint=False):
                p0, d0 = H.p(1.13 * math.sin(a), by - 0.02, 1.13 * math.cos(a)); p1, d1 = H.p(1.12 * math.sin(a), by + 0.32, 1.12 * math.cos(a))
                if d0 > 0.15:
                    out.append((hull2(p0, R * 0.025, p1, R * 0.025), dark(col, 0.7), dark(col, 0.7), 1, 0.0))
        elif kind == 'helmet':
            by = 0.3
            dome = smooth_closed(convex_hull([q[0] for rg in (H.ring(by, 1.18, 36, z0=0.05), H.ring(by + 0.6, 1.12, 36), H.ring(by + 1.02, 0.8, 32), H.ring(by + 1.22, 0.32, 16)) for q in rg]))
            out.append((dome, col, sh, R * 1.8, 0.2))
            band = inter(H.hull_of(H.ring(by + 0.3, 1.2, 40, z0=0.05), H.ring(by + 0.42, 1.2, 40, z0=0.05)), dome)
            out.append((band, hat.get('band', (44, 54, 96)), dark(hat.get('band', (44, 54, 96)), 0.85), R * 0.3, 0.1))
            ridge = inter(H.hull_of(H.ring(by + 1.0, 0.1, 8), H.ring(by + 0.6, 0.1, 8, z0=0.95)), dome)
            for k in range(3):
                q, d = H.p(-0.25 + 0.25 * k, by + 0.8, 0.62)
                if d > 0.2: out.append((circle(q, R * 0.06), hat.get('band', (44, 54, 96)), hat.get('band', (44, 54, 96)), 1, 0.0))
            if hat.get('lamp'):
                q, d = H.p(0, by + 0.36, 1.2)
                if d > -0.3:
                    lamp = hull2(q - V(H.face * R * 0.12, 0) * (1 - abs(math.cos(H.psi))), R * 0.17, q + V(H.face * R * 0.12, 0) * (1 - abs(math.cos(H.psi))), R * 0.16)
                    out.append((lamp, (60, 64, 80), (40, 42, 56), R * 0.3, 0.2))
                    lens = circle(q + V(H.face * R * 0.14 * (1 - abs(math.cos(H.psi))), 0), R * 0.1)
                    out.append((lens, (255, 248, 210), (255, 236, 170), R * 0.2, 0.0))
        return out

    def hat_strap(self, H):
        if self.sp.hat.get('kind') != 'helmet': return []
        out = []
        for sx in (1, -1):
            a, d1 = H.p(0.98 * sx, 0.1, 0.05); b, d2 = H.p(0.5 * sx, -1.0, 0.5)
            if max(d1, d2) > -0.2:
                out.append(hull2(a, H.R * 0.06, b, H.R * 0.05))
        return out

    def draw_hat(self, c, lt, pose, H, u, t):
        for s_ in self.hat_strap(H):
            c.drawPath(s_, P(lt.col((40, 44, 70))))
        m = pose.hat_m
        for path, base, sh, w, k in self.hat_paths(pose, H, t):
            if m is not None:
                path = skia.Path(path); path.transform(m)
            plate(c, lt, path, base, sh, w, k=k)

    def hat_union(self, pose, J, t=0.0):
        if not self.sp.hat: return None
        H = self.head_model(pose, J)
        u_ = union([p for p, *_ in self.hat_paths(pose, H, t)])
        return u_

    # -------------------------------------------------------------- whole figure
    def draw(self, c, pose, lt, t=None, shadow=True, rim=True, clip_body=None, skip=(), close_gaps=True):
        """draw the person; returns the joints. clip_body: a path limiting legs and torso (e.g. a water line).
        close_gaps: thin pockets of background between two parts (an arm grazing the torso, two legs nearly touching)
        are filled behind them, so no sliver of the scene shows through a body (the green screen check)."""
        if close_gaps:
            rec = skia.PictureRecorder()
            rc = rec.beginRecording(skia.Rect(-20000, -20000, 20000, 20000))
            rc.setMatrix(c.getTotalMatrix())
            J = self.draw(rc, pose, lt, t, shadow, rim, clip_body, skip, close_gaps=False)
            pic = rec.finishRecordingAsPicture()
            d = max(1.2, 3.2 * J['u'])
            parts = self._parts
            if clip_body is not None:
                parts = [(inter(p, clip_body) if k in ('leg', 'torso') else p, col) for p, col, k in parts]
            else:
                parts = [(p, col) for p, col, k in parts]
            for q, col in gap_fill(parts, d):
                c.drawPath(q, P(lt.col(col)))
            c.save(); c.resetMatrix(); c.drawPicture(pic); c.restore()
            return J
        t = pose.t if t is None else t
        J = self.skeleton(pose); u = J['R'] / (self.HEAD_R * self.sp.head)
        if shadow and pose.ground is not None:
            self.contact_shadows(c, pose, J, u)
        sil = []
        far_k = 0.84
        sp = self.sp
        top_sh = dark((sp.top or {}).get('sh', (90, 90, 90)), 0.9)
        tr_sh = dark((sp.trousers or {}).get('sh', (60, 60, 70)), 0.9)
        self._parts = []
        far_arm_behind = (pose.yaw < 0.62) if pose.far_arm_front is None else (not pose.far_arm_front)
        def body_layer(fn):
            if clip_body is not None:
                c.save(); c.clipPath(clip_body, skia.ClipOp.kIntersect, True)
            r = fn()
            if clip_body is not None:
                c.restore()
                r = inter(r, clip_body) if r is not None else r
            return r
        def add(p, col, kind):
            sil.append(p); self._parts.append((p, col, kind))
        if far_arm_behind and 'arm_f' not in skip:
            add(self.draw_arm(c, lt, pose, J, 'f', u, far_k), dark(top_sh, far_k), 'arm')
        if pose.near_arm_behind and 'arm_n' not in skip:
            add(self.draw_arm(c, lt, pose, J, 'n', u, 0.93), top_sh, 'arm')
        seat = self.draw_seat(J, u)
        if 'legs' not in skip:
            if pose.far_leg_front:
                add(body_layer(lambda: self.draw_leg(c, lt, pose, J, 'n', u, 1.0, seat=seat)), tr_sh, 'leg')
                add(body_layer(lambda: self.draw_leg(c, lt, pose, J, 'f', u, far_k if pose.yaw < 0.7 else 0.95)), dark(tr_sh, far_k), 'leg')
            elif pose.near_leg_front:
                add(body_layer(lambda: self.draw_leg(c, lt, pose, J, 'f', u, far_k if pose.yaw < 0.7 else 0.95)), dark(tr_sh, far_k), 'leg')
            else:
                add(body_layer(lambda: self.draw_leg(c, lt, pose, J, 'f', u, far_k if pose.yaw < 0.7 else 0.95)), dark(tr_sh, far_k), 'leg')
                add(body_layer(lambda: self.draw_leg(c, lt, pose, J, 'n', u, 1.0, seat=seat)), tr_sh, 'leg')
        if 'torso' not in skip:
            add(body_layer(lambda: self.draw_torso(c, lt, pose, J, u)), top_sh, 'torso')
        if pose.near_leg_front and 'legs' not in skip:
            # a raised front knee: the near thigh runs from the hip over the torso's lower edge to the knee
            add(body_layer(lambda: self.draw_leg(c, lt, pose, J, 'n', u, 1.0, seat=None)), tr_sh, 'leg')
            b = body_layer(lambda: self.draw_belt(c, lt, J, u, pose))
        if not far_arm_behind and 'arm_f' not in skip:
            add(self.draw_arm(c, lt, pose, J, 'f', u, 0.93), top_sh, 'arm')
        hs = None
        if 'head' not in skip:
            hs, H = self.draw_head(c, lt, pose, J, u, t)
            add(union([hs, self._neck]), dark(sp.skin_sh, 0.9), 'head')
            if self.sp.hat and not pose.hat_off and pose.hat_m is None:
                sil.append(self.hat_union(pose, J, t))
        if not pose.near_arm_behind and 'arm_n' not in skip:
            add(self.draw_arm(c, lt, pose, J, 'n', u, 1.0), top_sh, 'arm')
        if rim:
            rim_path(c, lt, union(sil), w=lt.rim_w * min(2.0, max(0.7, u * 1.5)))
        J['u'] = u
        return J

    def contact_shadows(self, c, pose, J, u):
        g = pose.ground
        for key in ('an_n', 'an_f', 'kn_n', 'kn_f', 'wr_n', 'wr_f', 'pelvis'):
            q = J[key]
            if abs(q[1] + (55 * u if key.startswith('an') else 30 * u) - g) < 30 * u:
                w = (120 if key.startswith('an') else 80) * u
                cx = q[0] + (pose.face * 40 * u if key.startswith('an') else 0)
                c.drawOval(skia.Rect(float(cx - w), float(g - 12 * u), float(cx + w), float(g + 12 * u)), P((30, 20, 30), 120, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 7 * u + 0.5)))


def blink_at(t, seed=0.0, period=3.7):
    """quick blinks every few seconds"""
    ph = (t + seed * 1.37) % period
    return max(0.0, 1 - abs(ph - 0.08) / 0.08) if ph < 0.16 else 0.0
