"""LevlPrep part rig engine (2026-10-24).

Animates painted parts on a 2D skeleton, the way pro cutout animators do:
  - rigid parts with round joint caps that pivot at the cap centre (a circle rotated about its centre never opens a gap)
  - or one continuous painted limb bent by angle blended skinning around each joint (no collapse at the elbow)
  - analytic 2 bone IK (fixed length, no stretch) for planted feet and hand targets
  - follow through on any bone: its WORLD angle is a damped spring chasing parent + target, so children drag
  - a joint gap checker that measures every joint disk on every frame

    rig = Rig(bones)                       # [dict(name, parent, head, tail)], parents first, char space px
    rig.add_part(name, rgba, origin, bones, mode="rigid"|"skin", z=0, blend=0.5)
    frames = rig.render(pose_fn, n, size, view)   # pose_fn(t) -> Pose
"""
import math
import numpy as np
import skia
from scipy import ndimage


def _ang(v):
    return math.atan2(v[1], v[0])


def _rot(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s], [s, c]])


def wrap(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


# ------------------------------------------------------------------ easing (pro defaults: never linear)
def ease_io(u):
    """Cubic in-out (roughly After Effects easy ease at 75% influence)."""
    u = min(max(u, 0.0), 1.0)
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def ease_out_back(u, k=1.4):
    u = min(max(u, 0.0), 1.0) - 1
    return 1 + (k + 1) * u ** 3 + k * u ** 2


class Track:
    """Keyframes [(t, value, ease)] where ease shapes the segment arriving at that key."""

    def __init__(self, keys):
        self.k = sorted(keys, key=lambda k: k[0])

    def __call__(self, t):
        k = self.k
        if t <= k[0][0]:
            return k[0][1]
        for (t0, v0, *_), (t1, v1, *e) in zip(k[:-1], k[1:]):
            if t <= t1:
                u = (t - t0) / max(t1 - t0, 1e-9)
                f = {"io": ease_io, "back": ease_out_back, "lin": lambda x: x,
                     "out": lambda x: 1 - (1 - x) ** 3, "in": lambda x: x ** 3}[(e or ["io"])[0]](u)
                return v0 + (v1 - v0) * f
        return k[-1][1]


# ------------------------------------------------------------------ skeleton
class Rig:
    def __init__(self, bones):
        self.b, self.order = {}, []
        for d in bones:
            h, t = np.array(d["head"], float), np.array(d["tail"], float)
            self.b[d["name"]] = dict(d, head=h, tail=t, len=float(np.linalg.norm(t - h)), a0=_ang(t - h))
            self.order.append(d["name"])
        self.parts = []
        self.springs = {}  # bone -> dict(freq, damp)
        self._spr = {}

    def children(self, n):
        return [k for k in self.order if self.b[k]["parent"] == n]

    # pose: dict(delta={bone: rad}, root=(x,y), root_rot=rad, world={bone: rad absolute target world angle})
    def fk(self, pose, dt=None):
        W = {}
        for n in self.order:
            d = self.b[n]
            p = d["parent"]
            if p is None:
                th = pose.get("root_rot", 0.0) + pose["delta"].get(n, 0.0)
                hp = d["head"] + np.array(pose.get("root", (0, 0)), float)
            else:
                thp, hrp, hpp = W[p]
                hp = _rot(thp) @ (d["head"] - hrp) + hpp
                if n in pose.get("world", {}):
                    th = pose["world"][n] - d["a0"]
                else:
                    th = thp + pose["delta"].get(n, 0.0)
                if n in self.springs and dt is not None:          # follow through: world angle chases its target
                    sp, st = self.springs[n], self._spr.get(n)
                    tgt = th
                    if st is None:
                        st = [tgt, 0.0]
                    w, z = 2 * math.pi * sp["freq"], sp["damp"]
                    x, v = st
                    tgt = x + wrap(tgt - x)
                    for _ in range(4):                               # 4 substeps for stability
                        a = w * w * (tgt - x) - 2 * z * w * v
                        v += a * dt / 4
                        x += v * dt / 4
                    self._spr[n] = [x, v]
                    th = x
            W[n] = (th, d["head"], hp)
        return W

    def world_angle(self, W, n):
        return W[n][0] + self.b[n]["a0"]

    def joint(self, W, n):
        """Posed head of bone n."""
        return W[n][2]

    def tail(self, W, n):
        th, hr, hp = W[n]
        return _rot(th) @ (self.b[n]["tail"] - hr) + hp

    # ---------------------------------------------------------------- IK (2 bones, fixed length, chosen bend side)
    def ik2(self, W, pose, upper, lower, target, bend=1.0):
        """Set pose['world'] for upper/lower so lower's tail reaches target (clamped to reach)."""
        r = self.joint(W, upper)
        L1, L2 = self.b[upper]["len"], self.b[lower]["len"]
        dv = np.array(target, float) - r
        d = float(np.linalg.norm(dv))
        d = min(max(d, abs(L1 - L2) + 1e-3), (L1 + L2) * 0.9995)
        base = _ang(dv)
        a = math.acos(min(1, max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
        A1 = base - bend * a
        e = r + L1 * np.array([math.cos(A1), math.sin(A1)])
        t = r + d * np.array([math.cos(base), math.sin(base)])
        A2 = _ang(t - e)
        pose.setdefault("world", {})
        pose["world"][upper] = A1
        pose["world"][lower] = A2
        return e

    # ---------------------------------------------------------------- parts
    def add_part(self, name, rgba, origin, bones, mode="rigid", z=0, blend=0.5, cell=10, pad=3):
        """rgba: HxWx4 uint8 painted part; origin: char space position of its top left pixel.
        mode rigid: follows bones[0]. mode skin: bones is a parent->child chain; vertices near each joint
        blend the two bone angles about that joint (half width = blend * local limb width)."""
        rgba = np.ascontiguousarray(rgba)
        H, Wd = rgba.shape[:2]
        al = rgba[..., 3] > 4
        al = ndimage.binary_dilation(al, iterations=pad)
        ys, xs = np.nonzero(al)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        gx = np.arange(x0, x1 + cell, cell)
        gy = np.arange(y0, y1 + cell, cell)
        gx = np.clip(gx, 0, Wd); gy = np.clip(gy, 0, H)
        nx, ny = len(gx), len(gy)
        V = np.array([[x, y] for y in gy for x in gx], float)
        tris = []
        for j in range(ny - 1):
            for i in range(nx - 1):
                cx0, cx1, cy0, cy1 = gx[i], gx[i + 1], gy[j], gy[j + 1]
                if cx1 <= cx0 or cy1 <= cy0 or not al[cy0:cy1, cx0:cx1].any():
                    continue
                a, b, c, d = j * nx + i, j * nx + i + 1, (j + 1) * nx + i, (j + 1) * nx + i + 1
                tris += [a, b, d, a, d, c]
        used = sorted(set(tris))
        remap = {u: k for k, u in enumerate(used)}
        V = V[used]
        tris = np.array([remap[t] for t in tris], np.uint16)
        P = V + np.array(origin, float)                        # char space rest positions
        # per vertex: (bone, other bone or None, pivot joint name, blend weight toward other)
        info = []
        if mode == "rigid":
            info = [(bones[0], None, None, 0.0)] * len(P)
        else:
            joints = []                                         # joint k between bones[k] and bones[k+1]
            for k in range(len(bones) - 1):
                pb, cb = self.b[bones[k]], self.b[bones[k + 1]]
                J = cb["head"]
                u = (pb["tail"] - pb["head"]) / pb["len"] + (cb["tail"] - cb["head"]) / cb["len"]
                u /= np.linalg.norm(u)
                # local width: painted alpha extent across the axis near the joint
                wpx = self._width(rgba, np.array(origin, float), J, u)
                joints.append((J, u, max(6.0, blend * wpx)))
            for p in P:
                s = [float((p - J) @ u) for J, u, h in joints]
                k = sum(1 for v in s if v > 0)                  # segment index
                k = min(k, len(bones) - 1)
                best, bw = None, 0.0
                cand = [kk for kk in (k - 1, k) if 0 <= kk < len(joints)]
                if cand:
                    kk = min(cand, key=lambda q: abs(s[q]))
                    h = joints[kk][2]
                    if abs(s[kk]) < h:
                        x = (s[kk] / h + 1) / 2
                        wc = x * x * (3 - 2 * x)                # weight toward the child bone of that joint
                        info.append((bones[kk], bones[kk + 1], bones[kk + 1], wc))
                        continue
                info.append((bones[k], None, None, 0.0))
        names = self.order
        bi = np.array([names.index(b) for b, o, pv, w in info])
        oi = np.array([names.index(o) if o else -1 for b, o, pv, w in info])
        ww = np.array([w for b, o, pv, w in info], float)
        pm = rgba.astype(np.float32)
        pm[..., :3] *= pm[..., 3:4] / 255.0                    # premultiply once, so drawing never converts
        img = skia.Image.fromarray(np.ascontiguousarray(pm.round().astype(np.uint8)),
                                   colorType=skia.ColorType.kRGBA_8888_ColorType,
                                   alphaType=skia.AlphaType.kPremul_AlphaType)
        self.parts.append(dict(name=name, img=img, uv=V.astype(np.float32), P=P, info=info, tris=tris, z=z,
                               bones=bones, bi=bi, oi=oi, w=ww))

    @staticmethod
    def _width(rgba, origin, J, u):
        n = np.array([-u[1], u[0]])
        H, W = rgba.shape[:2]
        cnt = 0
        for t in np.arange(-200, 200, 1.0):
            q = J + n * t - origin
            x, y = int(round(q[0])), int(round(q[1]))
            if 0 <= x < W and 0 <= y < H and rgba[y, x, 3] > 128:
                cnt += 1
        return float(cnt)

    def deform(self, part, W):
        names = self.order
        th = np.array([W[n][0] for n in names])
        hr = np.array([W[n][1] for n in names])
        hp = np.array([W[n][2] for n in names])
        b, o, w = part["bi"], part["oi"], part["w"]
        has = o >= 0
        oo = np.where(has, o, b)
        d = (th[oo] - th[b] + np.pi) % (2 * np.pi) - np.pi
        ang = th[b] + np.where(has, w * d, 0.0)
        pr = hr[oo]
        pp = hp[oo]
        q = part["P"] - pr
        c, s = np.cos(ang), np.sin(ang)
        return np.stack([c * q[:, 0] - s * q[:, 1], s * q[:, 0] + c * q[:, 1]], 1) + pp

    # ---------------------------------------------------------------- render
    def draw(self, canvas, W, xf=None, only_alpha=False, z_override=None):
        """xf: 3x3 matrix char space -> canvas."""
        if xf is not None:
            canvas.save()
            canvas.concat(skia.Matrix().setAll(*[float(v) for v in xf.flatten()]))
        paint = skia.Paint(AntiAlias=True)
        zs = z_override or {}
        for part in sorted(self.parts, key=lambda q: zs.get(q["name"], q["z"])):
            pos = self.deform(part, W).astype(np.float32)
            if "shader" not in part:
                img = part["img"].makeRasterImage()
                part["shader"] = img.makeShader(skia.TileMode.kClamp, skia.TileMode.kClamp,
                                                skia.SamplingOptions(skia.FilterMode.kLinear))
            paint.setShader(part["shader"])
            if only_alpha:
                paint.setColorFilter(skia.ColorFilters.Matrix([0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                                                               0, 0, 0, 1, 0]))
            v = skia.Vertices.MakeCopy(skia.Vertices.kTriangles_VertexMode,
                                       [skia.Point(*q) for q in pos],
                                       [skia.Point(*q) for q in part["uv"]],
                                       None, [int(t) for t in part["tris"]])
            canvas.drawVertices(v, paint, skia.BlendMode.kDst)
        if xf is not None:
            canvas.restore()


# ------------------------------------------------------------------ QA: joint gaps and detached pieces
def gap_check(rig, W, xf, size, joints, radius, down=0.5):
    """Render the character's alpha alone and measure each joint disk.
    joints: [bone names whose HEAD is a joint]; radius: {bone: px in char space}.
    Returns dict(joint -> uncovered fraction of its disk, components=#pieces > 40 px)."""
    xf = np.diag([down, down, 1.0]) @ xf
    size = (int(size[0] * down), int(size[1] * down))
    surf = skia.Surface(*size)
    c = surf.getCanvas()
    c.clear(skia.ColorTRANSPARENT)
    rig.draw(c, W, xf, only_alpha=True)
    a = surf.makeImageSnapshot().toarray()[..., 3] > 127
    sc = math.hypot(xf[0, 0], xf[1, 0])
    out = {}
    H, Wd = a.shape
    for n in joints:
        j = xf @ np.array([*rig.joint(W, n), 1.0])
        r = radius[n] * sc
        x0, x1 = int(max(0, j[0] - r - 1)), int(min(Wd, j[0] + r + 2))
        y0, y1 = int(max(0, j[1] - r - 1)), int(min(H, j[1] + r + 2))
        if x1 <= x0 or y1 <= y0:
            out[n] = 0.0
            continue
        Y, X = np.ogrid[y0:y1, x0:x1]
        disk = (X - j[0]) ** 2 + (Y - j[1]) ** 2 <= r * r
        out[n] = float((disk & ~a[y0:y1, x0:x1]).sum() / max(disk.sum(), 1))
    lab, k = ndimage.label(a)
    sizes = np.bincount(lab.ravel())[1:] if k else []
    out["components"] = int(sum(1 for s in sizes if s > 10))
    return out
