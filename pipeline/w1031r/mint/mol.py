"""Carvone ball and stick, house style, from real 3D coordinates (carvone_R.json, RDKit, CIP checked: R).
The mirror image (S, caraway) is drawn as the TRUE reflection of the R model's screen geometry across a vertical mirror
line (x -> 2*mx - x, depth kept), so the two are exact mirror images at every frame."""
import json, math
import numpy as np, skia
from kit import P, SP, blur, mix

D = json.load(open('/home/claude/lp/w1031r/mint/carvone_R.json'))
XYZ = np.array([a['p'] for a in D['atoms']], float)
EL = [a['e'] for a in D['atoms']]
ST = [i for i, a in enumerate(D['atoms']) if a['st']][0]
HI = EL.index('H')
BONDS = [(b['a'], b['b'], b['o']) for b in D['bonds']]
# the isopropenyl carbon on the stereocentre (its neighbour outside the ring)
_nb = [b for a, b, o in BONDS if a == ST] + [a for a, b, o in BONDS if b == ST]
COL = {'C': ((92, 96, 112), (44, 46, 58)), 'O': ((236, 80, 72), (150, 34, 40)), 'H': ((246, 246, 250), (176, 180, 196))}
RAD = {'C': 0.36, 'O': 0.40, 'H': 0.27}


def rot(ax, ay, az=0.0):
    cx, sx, cy, sy, cz, sz = math.cos(ax), math.sin(ax), math.cos(ay), math.sin(ay), math.cos(az), math.sin(az)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]); Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Ry @ Rx @ Rz


def project(cx, cy, sc, R, mirror_x=None):
    """screen points (x, y, depth) for every atom; y up in model space, z toward the viewer"""
    p = XYZ @ R.T
    f = 1 + p[:, 2] * 0.07
    x = cx + p[:, 0] * sc * f; y = cy - p[:, 1] * sc * f
    if mirror_x is not None: x = 2 * mirror_x - x
    return np.c_[x, y, p[:, 2]]


def draw(c, pts, sc, a=1.0, glow=None, glow_a=0.0, pulse_atoms=0.0, pulse_bonds=0.0, hl_st=0.0, hl_col=(255, 80, 80), ghost=False, hl_set=None, tint=None, tint_a=0.0):
    """draw a projected molecule: depth sorted shaded spheres and cylinder bonds, light from the upper right"""
    c.saveLayer(None, skia.Paint(Alphaf=a))
    cx, cy = pts[:, 0].mean(), pts[:, 1].mean()
    if glow is not None and glow_a > 0.01:
        c.drawCircle(cx, cy, 3.2 * sc, P(glow, 90 * glow_a, MaskFilter=blur(sc * 0.9), BlendMode=skia.BlendMode.kScreen))
    if not ghost:   # soft contact shadow below the molecule
        c.drawOval(skia.Rect(cx - 2.6 * sc, cy + 2.6 * sc, cx + 2.6 * sc, cy + 3.1 * sc), P((10, 10, 20), 40, MaskFilter=blur(sc * 0.3)))
    items = [(min(pts[i, 2], pts[j, 2]) - 0.02, 'b', (i, j, o)) for i, j, o in BONDS] + [(pts[k, 2], 'a', k) for k in range(len(pts))]
    items.sort(key=lambda q: q[0])
    for z, kind, d in items:
        f = 1 + z * 0.07
        if kind == 'b':
            i, j, o = d
            x0, y0 = pts[i, :2]; x1, y1 = pts[j, :2]
            w = 0.14 * sc * f * (1 + 0.3 * pulse_bonds)
            dx, dy = x1 - x0, y1 - y0; n = math.hypot(dx, dy) or 1; nx, ny = -dy / n, dx / n
            offs = [0.0] if o == 1 else [-0.11 * sc * f, 0.11 * sc * f]
            ww = w if o == 1 else w * 0.72
            for off in offs:
                ax_, ay_, bx_, by_ = x0 + nx * off, y0 + ny * off, x1 + nx * off, y1 + ny * off
                base = mix((150, 150, 160), (255, 236, 170), 0.6 * pulse_bonds)
                c.drawLine(ax_, ay_, bx_, by_, SP(mix(base, (40, 40, 56), 0.45), ww))
                c.drawLine(ax_, ay_, bx_, by_, SP(base, ww * 0.7))
                c.drawLine(ax_ + nx * ww * 0.18, ay_ + ny * ww * 0.18, bx_ + nx * ww * 0.18, by_ + ny * ww * 0.18, SP(mix(base, (255, 255, 255), 0.6), ww * 0.22))
        else:
            k = d; x, y = pts[k, :2]; e = EL[k]
            r = RAD[e] * sc * f * (1 + 0.14 * pulse_atoms)
            if k in (hl_set if hl_set is not None else (ST,)) and hl_st > 0.01:
                if hl_set is None:
                    c.drawCircle(x, y, r * 2.4, P(hl_col, 200 * hl_st, MaskFilter=blur(r * 0.7)))
                else:
                    c.drawCircle(x, y, r * 1.7, P(hl_col, 90 * hl_st, MaskFilter=blur(r * 0.4)))
                    c.drawCircle(x, y, r * 1.45, SP(hl_col, max(3, r * 0.16), 255 * hl_st))
            base, dark = COL[e]
            if pulse_atoms > 0.01: base = mix(base, (255, 240, 190), 0.35 * pulse_atoms)
            if tint is not None and e == 'C': base = mix(base, tint, tint_a); dark = mix(dark, tint, tint_a * 0.6)
            sh = skia.GradientShader.MakeRadial(skia.Point(x + r * 0.35, y - r * 0.4), r * 1.45,
                                                [skia.Color4f(*(np.array(mix(base, (255, 255, 255), 0.35)) / 255), 1).toColor(),
                                                 skia.Color4f(*(np.array(base) / 255), 1).toColor(),
                                                 skia.Color4f(*(np.array(dark) / 255), 1).toColor()], [0.0, 0.45, 1.0])
            c.drawCircle(x, y, r, skia.Paint(Shader=sh, AntiAlias=True))
            c.drawCircle(x + r * 0.38, y - r * 0.42, r * 0.22, P((255, 255, 255), 170, MaskFilter=blur(r * 0.08 + 0.5)))
            # warm rim on the side away from the key light (house rim light)
            rp = skia.Path(); rp.addCircle(x, y, r); q = skia.Path(); q.addCircle(x + r * 0.16, y - r * 0.1, r)
            d_ = skia.Op(rp, q, skia.PathOp.kDifference_PathOp)
            if d_ is not None: c.drawPath(d_, P((255, 214, 160), 120))
    c.restore()


def stereo_pts(pts):
    return pts[ST, :2], pts[HI, :2]
