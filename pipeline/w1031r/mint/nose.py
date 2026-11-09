"""Inside his nose: the olfactory epithelium, house style, all code (fix round 2026-11-09).
Mucus on top, the cilia of smell neurons reaching up into it, and on their membrane two DIFFERENT smell receptor
proteins (different shapes and colours; never mirror images of each other). Each has a chiral binding pocket: the
pocket is carved from the shape of the one carvone form it fits (docked in different orientations), so the spearmint
form fits the first pocket and the caraway form fits the second. Swapped, a molecule's atoms hit the pocket walls (red)
and it cannot go in. Accuracy note: real carvone smell comes from a pattern of several receptors that respond more or
less strongly to each form (LibreTexts; Wikipedia Carvone; PMC11107518); two receptors stand for that pattern."""
import math
import numpy as np, skia
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad
import mol as M

G, AMB = (110, 214, 130), (255, 178, 92)
MEM = 1000
_rs = np.random.default_rng(9)
BUB = _rs.uniform(0, 1, (40, 3))


def _union(ps):
    out = ps[0]
    for p in ps[1:]:
        r = skia.Op(out, p, skia.PathOp.kUnion_PathOp)
        if r is not None: out = r
    return out


def cavity(pts, sc, grow=1.0):
    """the space a docked molecule fills: its atoms and bonds, slightly inflated"""
    ps = []
    for k in range(len(pts)):
        q = skia.Path(); q.addCircle(float(pts[k, 0]), float(pts[k, 1]), M.RAD[M.EL[k]] * sc * 1.25 * grow + 6); ps.append(q)
    for i, j, o in M.BONDS:
        q = skia.Path(); q.moveTo(float(pts[i, 0]), float(pts[i, 1])); q.lineTo(float(pts[j, 0]), float(pts[j, 1]))
        d = skia.Path(); SP((0, 0, 0), sc * 0.42 * grow + 8).getFillPath(q, d); ps.append(d)
    return _union(ps)


class Receptor:
    def __init__(self, cx, top, outline, col, sh, dock_pts, sc):
        self.cx, self.top, self.col, self.sh = cx, top, col, sh
        self.body0 = smooth_closed([(cx + x, top + y) for x, y in outline])
        self.cav = cavity(dock_pts, sc)
        b = skia.Op(self.body0, self.cav, skia.PathOp.kDifference_PathOp)
        self.body = b if b is not None else self.body0

    def solid_hits(self, pts):
        """atoms that would sit inside the protein (a clash) at these positions"""
        return [k for k in range(len(pts)) if self.body.contains(float(pts[k, 0]), float(pts[k, 1]))]

    def draw(self, c, t, glow=0.0, gcol=G, pocket_hl=0.0):
        flat(c, self.body, self.col, self.sh, sh_off=(-14, 4), rim=(236, 222, 255), rim_d=(3, -3), rim_a=170)
        c.save(); c.clipPath(self.body, skia.ClipOp.kIntersect, True)
        for k in range(8):
            hx = self.cx - 200 + k * 57
            c.drawRoundRect(skia.Rect(hx - 20, self.top - 40, hx + 20, MEM + 200), 20, 20, P(mix(self.col, (255, 255, 255), 0.13 if k % 2 else 0.0)))
            for j in range(14):
                yy = self.top - 30 + j * 30
                c.drawLine(hx - 18, yy, hx + 18, yy + 12, SP(self.sh, 2.6, 150))
        lin = skia.Path(); SP((0, 0, 0), 26).getFillPath(self.cav, lin)
        c.drawPath(lin, P(mix(self.sh, (30, 20, 50), 0.35), 200))
        c.drawCircle(self.cx + 70, self.top + 120, 150, P((255, 255, 255), 40, MaskFilter=blur(50)))
        c.restore()
        if pocket_hl > 0.01:
            edge = skia.Path(); SP((0, 0, 0), 7).getFillPath(self.cav, edge)
            e2 = skia.Op(edge, self.body0, skia.PathOp.kIntersect_PathOp)
            if e2 is not None: c.drawPath(e2, P((255, 240, 160), 255 * pocket_hl))
        if glow > 0.01:
            c.drawPath(self.body, SP(gcol, 9, 255 * glow))
            c.drawCircle(self.cx, self.top + 150, 200, P(gcol, 70 * glow, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))


def nerve(x):
    p = skia.Path(); p.moveTo(x, MEM + 120); p.cubicTo(x, MEM + 260, x + (60 if x < 540 else -60), MEM + 380, 540 + (x - 540) * 0.4, 2000)
    return p


def backdrop(c, t, recs, glow=(0.0, 0.0)):
    lgrad(c, skia.Rect(-300, -300, 1400, 2300), -300, 2300, [(70, 40, 70), (150, 70, 96), (214, 116, 120), (120, 56, 80)], [0, 0.35, 0.55, 1])
    mp = skia.Path(); mp.moveTo(-300, 470)
    for k in range(0, 1500, 60): mp.lineTo(-300 + k, 470 + 16 * math.sin(k * 0.01 + t * 0.6))
    mp.lineTo(1400, MEM); mp.lineTo(-300, MEM); mp.close()
    c.drawPath(mp, P((236, 190, 196), 90))
    for k in range(40):
        bx, by, br = BUB[k]
        x = bx * 1180 - 50; y = 500 + ((by * 420 - t * 14 * (0.5 + br)) % 420)
        c.drawCircle(x, y, 4 + 8 * br, SP((255, 236, 240), 2, 110))
    for k in range(26):
        x0 = -20 + k * 44
        p = skia.Path(); p.moveTo(x0, MEM - 20)
        for j in range(1, 11):
            p.lineTo(x0 + 22 * math.sin(t * 1.6 + k * 0.7 + j * 0.6) * (j / 10), MEM - 20 - j * 48)
        c.drawPath(p, SP((246, 180, 186), 6, 170))
    c.drawRect(skia.Rect(-300, MEM - 26, 1400, MEM + 26), P((242, 196, 170)))
    for k in range(0, 1400, 22):
        c.drawCircle(k - 300, MEM - 20, 9, P((252, 214, 184))); c.drawCircle(k - 289, MEM + 20, 9, P((252, 214, 184)))
    c.drawRect(skia.Rect(-300, MEM - 8, 1400, MEM + 8), P((214, 150, 140)))
    lgrad(c, skia.Rect(-300, MEM + 26, 1400, 2300), MEM + 26, 1800, [(196, 100, 116), (150, 70, 96)])
    for i, r in enumerate(recs):
        x = r.cx
        c.drawPath(nerve(x), SP((226, 140, 150), 26)); c.drawPath(nerve(x), SP((236, 164, 170), 10))
        if glow[i] > 0.01:
            gc = G if i == 0 else AMB
            pm = skia.PathMeasure(nerve(x), False); Ln = pm.getLength()
            for k in range(3):
                u = ((t * 0.9 + k / 3) % 1.0)
                pos, _ = pm.getPosTan(Ln * u)
                c.drawCircle(pos.x(), pos.y(), 26 * (1 - 0.4 * u), P(gc, 230 * glow[i] * (1 - u), MaskFilter=blur(8)))


def foreground(c, t):
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(10, 10)))
    for k, x0 in enumerate((-30, 40, 1010, 1080)):
        p = skia.Path(); p.moveTo(x0, 1500)
        for j in range(1, 12):
            p.lineTo(x0 + 40 * math.sin(t * 1.2 + k + j * 0.5) * (j / 11) + (30 if x0 < 540 else -30) * j / 11, 1500 - j * 90)
        c.drawPath(p, SP((250, 196, 200), 22, 150))
    c.restore()
