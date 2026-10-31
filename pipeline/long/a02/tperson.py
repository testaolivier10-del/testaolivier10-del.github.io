"""TPerson: the reference figure (ref/anat.png) traced into vector shapes and cut into parts at the joints, so it poses
like body.Person with the exact look of the reference. Same local units as body.Person (feet at 0, head top near -700,
side +1 = the figure's right = viewer's left) and the same pose fields: arm {side: [shoulder deg out, elbow deg, sup]},
back, mode ('stand' | 'none'), leg {side: deg}. Recolouring per class (skin, shirt, shorts, hair) makes the cast."""
import math, colorsys
import numpy as np
import skia
import trace as TR
from body import union, smooth_closed

REF = '/home/claude/lv/ref/anat.png'
BOX = (500, 30, 880, 740)
CX, FEET = 190.0, 690.0
K = 700.0 / 665.0                       # crop pixels -> body units


def L(x, y):
    return ((x - CX) * K, (y - FEET) * K)


def poly(pts):
    p = skia.Path(); p.moveTo(*L(*pts[0]))
    for q in pts[1:]:
        p.lineTo(*L(*q))
    p.close(); return p


BASE = dict(skin=(245, 163, 126), shirt=(188, 192, 198), shorts=(41, 61, 111), hair=(93, 89, 116))


def classify(col):
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in col]); h *= 360
    if l < 0.26:
        return 'ink'
    if col == (250, 186, 109) or (25 < h < 45 and s > 0.85):
        return 'rim'
    if (h < 40 or h > 340) and s > 0.45:
        return 'skin'
    if s < 0.14 and l > 0.5:
        return 'shirt'
    if 200 < h < 240 and s > 0.3:
        return 'shorts'
    if l < 0.45:
        return 'hair'
    return 'skin'


_CACHE = {}


def _parts():
    if 'p' in _CACHE:
        return _CACHE['p']
    layers = TR.trace(REF, BOX, k=12)
    # move the traced paths into body units
    m = skia.Matrix(); m.setScaleTranslate(K, K, -CX * K, -FEET * K)
    lay = []
    for col, p in layers:
        q = skia.Path(p); q.transform(m)
        lay.append((col, classify(col), q))
    # part regions in crop pixels (viewer-left side; the other side is mirrored)
    def mir(pts):
        return [(2 * CX - x, y) for x, y in pts]
    R = {}
    R['ua', 1] = [(0, 138), (121, 146), (125, 236), (124, 290), (0, 290)]
    R['fa', 1] = [(0, 290), (124, 290), (118, 330), (114, 358), (0, 358)]
    R['hd', 1] = [(0, 358), (114, 358), (112, 460), (0, 460)]
    for k_ in ('ua', 'fa', 'hd'):
        R[k_, -1] = mir(R[k_, 1])
    R['head', 0] = [(124, 0), (256, 0), (256, 147), (124, 147)]
    R['leg', 1] = [(100, 470), (190, 470), (190, 720), (100, 720)]
    R['leg', -1] = mir(R['leg', 1])
    regions = {k_: poly(v) for k_, v in R.items()}
    allr = skia.Path()
    for v in regions.values():
        allr = union(allr, v)
    # parts overlap their neighbours by a couple of pixels so no seam shows at the cuts
    def grow(pts, d=2.5):
        cx_ = sum(p[0] for p in pts) / len(pts); cy_ = sum(p[1] for p in pts) / len(pts)
        return [(x + d * np.sign(x - cx_), y + d * np.sign(y - cy_)) for x, y in pts]
    R['leg', 1] = [(100, 456), (190, 456), (190, 720), (100, 720)]; R['leg', -1] = mir(R['leg', 1])
    regions = {k_: poly(grow(v)) for k_, v in R.items()}
    big = skia.Path(); big.addRect(skia.Rect(-1000, -1000, 1000, 1000))
    regions['torso', 0] = skia.Op(big, allr, skia.PathOp.kDifference_PathOp)
    parts = {}
    for key, reg in regions.items():
        pl = []
        for col, cls, p in lay:
            q = skia.Op(p, reg, skia.PathOp.kIntersect_PathOp)
            if q is not None and not q.isEmpty():
                pl.append((col, cls, q))
        parts[key] = pl
    # head silhouette for the back view
    hs = skia.Path()
    for col, cls, p in parts['head', 0]:
        hs = union(hs, p)
    _CACHE['p'] = (parts, hs)
    return _CACHE['p']


# joints in body units, measured on the reference
SH = {1: np.array(L(117, 180)), -1: np.array(L(2 * CX - 117, 180))}
EL = {1: np.array(L(101, 287)), -1: np.array(L(2 * CX - 101, 287))}
WR = {1: np.array(L(79, 360)), -1: np.array(L(2 * CX - 79, 360))}
HIP = {1: np.array(L(152, 470)), -1: np.array(L(2 * CX - 152, 470))}
NECK = np.array(L(190, 146))
A_UP = math.degrees(math.atan2(abs(EL[1][0] - SH[1][0]), EL[1][1] - SH[1][1]))
A_FO = math.degrees(math.atan2(abs(WR[1][0] - EL[1][0]), WR[1][1] - EL[1][1]))


class TPerson:
    def __init__(self, shirt=None, shirt_sh=None, shorts=None, shorts_sh=None, hair=None, skin=None, skin_sh=None, **kw):
        self.cols = dict(shirt=shirt, shorts=shorts, hair=hair, skin=skin)
        self.arm = {1: [A_UP, A_FO - A_UP, 1.0], -1: [A_UP, A_FO - A_UP, 1.0]}
        self.leg = {1: 0.0, -1: 0.0}
        self.back = False
        self.mode = 'stand'
        self.pants = False
        self.shoe = None
        self.highlight = {}
        self.head_turn = 0.0
        self.shirt = shirt or BASE['shirt']; self.shirt_sh = shirt_sh or (137, 145, 159)
        self.skin = skin or BASE['skin']; self.skin_sh = skin_sh or (207, 111, 83)

    # ------------------------------------------------------------ colours
    def col(self, col, cls, part):
        if cls in ('ink', 'rim'):
            return col
        if self.pants and part[0] == 'leg' and cls == 'skin':
            cls = 'shorts'; col = tuple(int(v * 1.0) for v in col)
            base = BASE['skin']; tgt = self.cols['shorts'] or BASE['shorts']
            return tuple(int(min(255, c * t / b)) for c, t, b in zip(col, tgt, base))
        tgt = self.cols.get(cls)
        if tgt is None:
            return col
        base = BASE[cls]
        return tuple(int(min(255, c * t / b)) for c, t, b in zip(col, tgt, base))

    def _draw_part(self, c, key, a=255):
        parts, _ = _parts()
        for col, cls, p in parts[key]:
            c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(*self.col(col, cls, key), a)))

    # ------------------------------------------------------------ pose
    def joints(self, side):
        a0, eb, _ = self.arm[side]
        a = math.radians(a0)
        sh = SH[side]
        up = np.linalg.norm(EL[side] - SH[side]); fo = np.linalg.norm(WR[side] - EL[side])
        d1 = np.array([-side * math.sin(a), math.cos(a)])
        el = sh + d1 * up
        a2 = a + math.radians(eb)
        d2 = np.array([-side * math.sin(a2), math.cos(a2)])
        wr = el + d2 * fo
        return sh, el, wr, d2

    def arm_draw(self, c, side):
        a0, eb, _ = self.arm[side]
        r1 = side * (a0 - A_UP)                 # skia rotation of the upper arm about the shoulder
        r2 = side * (a0 + eb - A_FO)            # and of the forearm and hand, as a whole
        sh, el_new, _, _ = self.joints(side)
        # joint caps so the cuts never show a gap
        cap = skia.Paint(AntiAlias=True, Color=skia.Color(*self.col(BASE['shirt'], 'shirt', ('ua', side))))
        if abs(r1) > 4:
            c.drawCircle(*(sh + np.array([side * 12, 4])), 22 * min(1.0, abs(r1) / 40), cap)
        c.save(); c.translate(*sh); c.rotate(r1); c.translate(*-sh)
        self._draw_part(c, ('ua', side))
        c.restore()
        c.save(); c.translate(*el_new); c.rotate(r2); c.translate(*-EL[side])
        if abs(r2 - r1) > 4:
            c.drawCircle(*EL[side], 14, skia.Paint(AntiAlias=True, Color=skia.Color(*self.col(BASE['skin'], 'skin', ('fa', side)))))
        self._draw_part(c, ('fa', side))
        self._draw_part(c, ('hd', side))
        g = self.highlight.get(('forearm', side), 0)
        if g > 0:
            from body import limb_path
            c.drawPath(limb_path(EL[side], WR[side], 40, 32), skia.Paint(AntiAlias=True, Color=skia.Color(255, 214, 120, int(120 * g)),
                                                                    MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8)))
        c.restore()

    def legs_draw(self, c):
        for side in (1, -1):
            c.save(); c.translate(*HIP[side]); c.rotate(side * self.leg[side]); c.translate(*-HIP[side])
            self._draw_part(c, ('leg', side))
            if self.shoe:
                parts, _ = _parts()
                c.save(); c.clipRect(skia.Rect(-400, L(0, 652)[1], 400, 60))
                base = BASE['skin']
                for col, cls, p in parts['leg', side]:
                    if cls in ('skin', 'rim'):
                        nc = tuple(int(min(255, v * t / b)) for v, t, b in zip(col, self.shoe, base)) if cls == 'skin' else col
                        c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(*nc)))
                c.restore()
            c.restore()

    def head_draw(self, c):
        parts, hs = _parts()
        c.save(); c.translate(*NECK); c.rotate(self.head_turn); c.translate(*-NECK)
        if self.back:
            hair = self.cols['hair'] or BASE['hair']
            c.drawPath(hs, skia.Paint(AntiAlias=True, Color=skia.Color(*self.col(BASE['skin'], 'skin', ('head', 0)))))
            c.save(); c.clipRect(skia.Rect(-200, -800, 200, L(0, 118)[1]))
            c.drawPath(hs, skia.Paint(AntiAlias=True, Color=skia.Color(*hair)))
            sh_ = tuple(int(v * 0.78) for v in hair)
            q = skia.Path(hs); q.offset(-7, 0)
            d = skia.Op(hs, q, skia.PathOp.kDifference_PathOp)
            if d is not None:
                c.drawPath(d, skia.Paint(AntiAlias=True, Color=skia.Color(*sh_)))
            c.restore()
        else:
            self._draw_part(c, ('head', 0))
        c.restore()

    def draw(self, c, x, y, s, t=0.0):
        c.save(); c.translate(x, y); c.scale(s, s)
        br = 1.2 * math.sin(t * 1.7)
        if self.mode == 'stand':
            self.legs_draw(c)
        c.save(); c.translate(0, -br)
        # arms that hang behind the body first would need a depth order; at the side they sit beside it
        self._draw_part(c, ('torso', 0)) if self.mode == 'stand' else self._torso_upper(c)
        for side in (1, -1):
            self.arm_draw(c, side)
        self.head_draw(c)
        c.restore()
        c.restore()

    def _torso_upper(self, c):
        c.save(); c.clipRect(skia.Rect(-400, -900, 400, L(0, 352)[1]))
        self._draw_part(c, ('torso', 0))
        c.restore()

    def sleeve_path(self, side):
        sh, el, _, _ = self.joints(side)
        d = (el - sh) / np.linalg.norm(el - sh); n = np.array([-d[1], d[0]])
        q = skia.Path(); q.moveTo(*(sh + n * 22)); q.lineTo(*(sh + d * 50 + n * 22)); q.lineTo(*(sh + d * 50 - n * 22)); q.lineTo(*(sh - n * 22)); q.close()
        return q

    LM = dict(nose=(0, -618), mouth=(0, -602), head=(0, -700), chest=(0, -490), knee_r=(-34, -141), knee_l=(34, -141), feet=(0, 0))
