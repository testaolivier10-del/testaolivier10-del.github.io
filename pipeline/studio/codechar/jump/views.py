"""Front and three quarter views of the girl: traced from their paintings into a few rigid parts (head with its
eyes tagged for blinks, two arms, the body) that move with simple procedural acting (breathing, a weight shift,
arm sway, head tilt, blinks). Used for the turn to camera; the side view (side/model.py) does the real motion.
python3 views.py build   -> traces both views into views_traced.json"""
import json, math, sys, subprocess, re
import numpy as np, cv2, skia
from PIL import Image, ImageFilter
from scipy import ndimage
from sklearn.cluster import KMeans
sys.path.insert(0, '/home/claude/trace'); sys.path.insert(0, '/home/claude/jump/side')
import vec

VIEWS = {
    'front': dict(src='/home/claude/jump/front/src.png', neck=(270, 232), sh_l=(186, 305), sh_r=(362, 305),
                  feet_y=935, top_y=20, cx=272,
                  arm_l=[(140, 336), (206, 336), (204, 360), (200, 380), (176, 470), (166, 600), (105, 600), (118, 480), (140, 350)],
                  arm_r=[(340, 336), (400, 336), (404, 350), (412, 470), (432, 600), (378, 600), (372, 480), (352, 380), (342, 352)],
                  head=[(195, 0), (350, 0), (350, 232), (300, 232), (270, 250), (240, 232), (195, 232)],
                  eyes=[(222, 120, 268, 146), (280, 120, 326, 146)], mouth=(245, 168, 300, 190)),
    'q3': dict(src='/home/claude/jump/art/girl_3q.png', neck=(255, 215), sh_l=(170, 292), sh_r=(328, 292),
               feet_y=880, top_y=15, cx=255,
               arm_l=[(120, 318), (192, 318), (190, 340), (182, 380), (160, 460), (155, 565), (98, 565), (108, 460), (122, 335)],
               arm_r=[(316, 322), (356, 322), (360, 340), (378, 440), (398, 565), (348, 565), (346, 450), (330, 380), (318, 338)],
               head=[(165, 0), (330, 0), (330, 215), (290, 215), (255, 232), (225, 215), (165, 215)],
               eyes=[(225, 112, 268, 138), (275, 112, 315, 138)], mouth=(245, 158, 295, 180)),
}
UP = 4


def potrace(mask, x0, y0, blur=1.0):
    h, w = mask.shape
    mk = Image.fromarray((mask * 255).astype(np.uint8)).resize((w * UP, h * UP), Image.BILINEAR)
    mk = mk.filter(ImageFilter.GaussianBlur(blur * UP / 3)).point(lambda v: 0 if v > 127 else 255).convert('1')
    mk.save('/tmp/_v.bmp')
    subprocess.run(['potrace', '/tmp/_v.bmp', '-s', '-o', '/tmp/_v.svg', '--flat', '-a', '1.1', '-O', '0.6'], check=True)
    import xml.etree.ElementTree as ET
    from svgpathtools import parse_path, Line, CubicBezier
    NS = '{http://www.w3.org/2000/svg}'
    root = ET.parse('/tmp/_v.svg').getroot(); segs = []
    for g_ in root.iter(NS + 'g'):
        mt = re.search(r'translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)\s*scale\(([-\d.e]+)[ ,]+([-\d.e]+)\)', g_.get('transform') or '')
        tx, ty, sx, sy = [float(v) for v in mt.groups()] if mt else (0, 0, 1, 1)
        for el in g_.iter(NS + 'path'):
            for sg in parse_path(el.get('d')):
                if isinstance(sg, Line):
                    p0, p3 = sg.start, sg.end; c1, c2 = p0 + (p3 - p0) / 3, p0 + 2 * (p3 - p0) / 3
                elif isinstance(sg, CubicBezier):
                    p0, c1, c2, p3 = sg.start, sg.control1, sg.control2, sg.end
                else:
                    continue
                f = lambda z: [round((z.real * sx + tx) / UP + x0, 2), round((z.imag * sy + ty) / UP + y0, 2)]
                segs.append([f(p0), f(c1), f(c2), f(p3)])
    return segs


def trace_part(src, m, k, tags=None):
    ys, xs = np.nonzero(m)
    x0, y0, x1, y1 = xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7
    mc = m[y0:y1, x0:x1]; rgb = src[y0:y1, x0:x1].astype(np.float32)
    labx = cv2.cvtColor(np.ascontiguousarray(rgb.astype(np.uint8)), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
    inner = ndimage.binary_erosion(mc, iterations=1)
    km = KMeans(k, n_init=6, random_state=1).fit(labx[inner.ravel()])
    L = km.predict(labx).reshape(mc.shape)
    for _ in range(3):
        votes = np.stack([cv2.blur((L == i).astype(np.float32), (5, 5)) for i in range(k)]); L = votes.argmax(0)
    core = ndimage.binary_erosion(mc, iterations=3)
    _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True); L = L[iy, ix]
    extra = []
    XX = np.arange(mc.shape[1])[None, :] + x0; YY = np.arange(mc.shape[0])[:, None] + y0
    lum = rgb.mean(-1)
    for tag, (bx0, by0, bx1, by1), test in (tags or []):
        box = (XX > bx0) & (XX < bx1) & (YY > by0) & (YY < by1) & mc
        sel = box & test(rgb, lum)
        if sel.sum() > 4:
            extra.append((tag, sel))
    L[~mc] = -1
    areas = [(L == i).sum() for i in range(k)]
    layers = []
    order = list(np.argsort(areas)[::-1])
    for j, i in enumerate(order):
        reg = L == i
        if reg.sum() < 12: continue
        corem = ndimage.binary_erosion(reg, iterations=1)
        col = np.median(rgb[corem if corem.sum() > 6 else reg], 0)
        if j and col[1] > col[0] + 30 and col[1] > col[2] + 30:
            continue                                   # green screen fringe
        layers.append(dict(fill='#%02x%02x%02x' % tuple(int(v) for v in col), segs=None if j == 0 else potrace(reg, x0, y0, 1.0)))
    for tag, sel in extra:
        col = np.median(rgb[sel], 0)
        layers.append(dict(fill='#%02x%02x%02x' % tuple(int(v) for v in col), segs=potrace(sel, x0, y0, 0.6), tag=tag))
    return dict(sil=potrace(mc, x0, y0), layers=layers)


def build():
    out = {}
    for name, V in VIEWS.items():
        a = np.array(Image.open(V['src']).convert('RGB')).astype(np.int16)
        H, W = a.shape[:2]; r, g, b = a[..., 0], a[..., 1], a[..., 2]
        fg = ~(g > np.maximum(r, b) + 30) & ~(a.min(-1) > 235) & ~((r > 190) & (g > 120) & (b < 110) & (r - b > 90))
        fg = ndimage.binary_opening(fg, iterations=1)
        lab, n = ndimage.label(fg); sz = ndimage.sum(fg, lab, range(1, n + 1)); fg = lab == 1 + int(np.argmax(sz))
        fg = ndimage.binary_fill_holes(fg)
        def poly(pts):
            m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 1); return m > 0
        armL, armR, head = fg & poly(V['arm_l']), fg & poly(V['arm_r']), fg & poly(V['head'])
        body = fg & ~armL & ~armR & ~head
        body = body | (ndimage.binary_dilation(head, iterations=3) & fg & ~head & (np.mgrid[:H, :W][0] > V['neck'][1] - 6))
        src = a.clip(0, 255).astype(np.uint8)
        dark = lambda rgb, lum: lum < 75
        light = lambda rgb, lum: lum > 165
        lips = lambda rgb, lum: (rgb[..., 0] > 115) & (rgb[..., 1] < 90) & (rgb[..., 0] - rgb[..., 2] > 40)
        tags = []
        for e in V['eyes']:
            tags += [('eyew', e, light), ('eye', e, dark)]
        tags.append(('mouth', V['mouth'], lips))
        out[name] = dict(V={k: v for k, v in V.items() if k != 'src'},
                         head=trace_part(src, head, 8, tags), arm_l=trace_part(src, armL, 4), arm_r=trace_part(src, armR, 4),
                         body=trace_part(src, body, 7))
        print(name, {k: len(v['layers']) for k, v in out[name].items() if k != 'V'})
    json.dump(out, open('/home/claude/jump/views_traced.json', 'w'))


# ------------------------------------------------------------------ drawing
def hexc(h, a=255, k=1.0):
    return skia.Color(int(int(h[1:3], 16) * k), int(int(h[3:5], 16) * k), int(int(h[5:7], 16) * k), a)


def mcopy(m):
    c = skia.Matrix(); c.setAll(*[m.get(i) for i in range(9)]); return c


class View:
    """Draw a traced view standing with its feet centre at (0, 0) in 'side model' units (scaled to the side height)."""
    def __init__(self, name, height=853.0, light=(-0.85, -0.53), rim=(255, 222, 160)):
        D = json.load(open('/home/claude/jump/views_traced.json'))[name]
        self.V = D['V']; self.D = D
        self.k = height / (self.V['feet_y'] - self.V['top_y'])
        self.L = np.array(light) / np.linalg.norm(light); self.rim = rim
        self.paths = {}
        for part in ('body', 'arm_l', 'arm_r', 'head'):
            P = D[part]
            sil = vec.to_path(P['sil'])
            lays = [(sil if l['segs'] is None else vec.to_path(l['segs']), l['fill'], l.get('tag')) for l in P['layers']]
            self.paths[part] = (sil, lays)
        self.blink = 0.0

    def _part(self, c, part, M):
        sil, lays = self.paths[part]
        p = skia.Paint(AntiAlias=True)
        c.save(); c.concat(M)
        for path, fill, tag in lays:
            if self.blink > 0.5 and tag in ('eye', 'eyew'):
                continue
            p.setColor(hexc(fill)); c.drawPath(path, p)
        if self.blink > 0.5 and part == 'head':
            for (x0, y0, x1, y1) in self.V['eyes']:
                lid = skia.Path(); ym = (y0 + y1) / 2 + 2
                lid.moveTo(x0 + 6, ym); lid.quadTo((x0 + x1) / 2, ym + 4, x1 - 6, ym)
                c.drawPath(lid, skia.Paint(AntiAlias=True, Color=skia.Color(40, 18, 14), Style=skia.Paint.kStroke_Style, StrokeWidth=2.6, StrokeCap=skia.Paint.kRound_Cap))
        c.restore()
        return sil

    def matrices(self, x, y, s, t, act):
        """act: dict(breath, sway, head, arm_l, arm_r) small procedural acting (radians / px)."""
        V = self.V; k = self.k * s
        base = skia.Matrix.Translate(x, y)
        base.preScale(k, k)
        base.preTranslate(-V['cx'], -V['feet_y'])
        br = act.get('breath', 0.0)
        body = mcopy(base); body.preTranslate(V['cx'], V['feet_y']); body.preScale(1.0, 1.0 + 0.006 * br); body.preTranslate(-V['cx'], -V['feet_y'])
        lift = -2.0 * br
        def rot_about(m, piv, ang, dy=0.0):
            mm = mcopy(m); mm.preTranslate(piv[0], piv[1] + dy); mm.preRotate(math.degrees(ang)); mm.preTranslate(-piv[0], -piv[1]); return mm
        head = rot_about(body, V['neck'], act.get('head', 0.0), lift)
        al = rot_about(body, V['sh_l'], act.get('arm_l', 0.0), lift)
        ar = rot_about(body, V['sh_r'], act.get('arm_r', 0.0), lift)
        sway = act.get('sway', 0.0)
        for m in (body, head, al, ar):
            m.postConcat(skia.Matrix.RotateDeg(math.degrees(sway), skia.Point(x, y)))
        return dict(body=body, head=head, arm_l=al, arm_r=ar)

    def draw(self, c, x, y, s=1.0, t=0.0, act=None, alpha=1.0):
        act = act or {}
        Ms = self.matrices(x, y, s, t, act)
        c.saveLayer(None, skia.Paint(Alphaf=alpha)) if alpha < 0.999 else c.save()
        sils = []
        for part in ('arm_l', 'arm_r', 'body', 'head'):
            sils.append((part, self._part(c, part, Ms[part])))
        # rim on the light side: silhouettes in rim colour minus themselves shifted toward the light
        k = self.k * s
        c.saveLayer(None, skia.Paint(Alphaf=0.6))
        for part, sil in sils:
            c.save(); c.concat(Ms[part]); c.drawPath(sil, skia.Paint(AntiAlias=True, Color=skia.Color(*self.rim))); c.restore()
        for part, sil in sils:
            m = mcopy(Ms[part]); m.postTranslate(-self.L[0] * 3.2, -self.L[1] * 3.2)
            c.save(); c.concat(m); c.drawPath(sil, skia.Paint(AntiAlias=True, Color=skia.ColorBLACK, BlendMode=skia.BlendMode.kDstOut)); c.restore()
        c.restore()
        c.restore()


if __name__ == '__main__':
    if sys.argv[1:] == ['build']:
        build()
