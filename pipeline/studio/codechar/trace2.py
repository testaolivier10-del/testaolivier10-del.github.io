"""Trace each design part as flat colour shapes, the way the house style is built:
k-means palette per part (Lab), mode filtered labels, each colour region traced with potrace (upscaled, smoothed),
largest region at the bottom covering the whole silhouette so no seams show. Paths in PAINTING coordinates.
Writes traced.json: {part: {sil: [segs], layers: [{fill, segs}...]}} and an Inkscape-cleaned SVG per part."""
import json, os, re, subprocess
import numpy as np, cv2
from PIL import Image, ImageFilter
import xml.etree.ElementTree as ET
from scipy import ndimage
from sklearn.cluster import KMeans
from svgpathtools import parse_path, Line, CubicBezier

UP = 4
K = {'head': 9, 'boot': 3, 'glove': 1, 'patch': 1, 'belt': 1, 'collar': 1, 'crease': 1, 'torso': 1}
SVGNS = '{http://www.w3.org/2000/svg}'


def potrace_mask(mask, x0, y0, blur=1.6):
    h, w = mask.shape
    mk = Image.fromarray((mask * 255).astype(np.uint8)).resize((w * UP, h * UP), Image.BILINEAR)
    mk = mk.filter(ImageFilter.GaussianBlur(blur * UP / 3)).point(lambda v: 0 if v > 127 else 255).convert('1')
    mk.save('/tmp/_m.bmp')
    subprocess.run(['potrace', '/tmp/_m.bmp', '-s', '-o', '/tmp/_m.svg', '--flat', '-a', '1.1', '-O', '0.6'],
                   check=True)
    # Inkscape cleanup pass (simplify removes potrace's leftover wobble on long edges)
    subprocess.run(['inkscape', '/tmp/_m.svg', '--actions=select-all;path-simplify;export-overwrite;export-do'],
                   capture_output=True, timeout=120)
    root = ET.parse('/tmp/_m.svg').getroot()
    segs = []
    for el in root.iter(SVGNS + 'path'):
        # Inkscape may bake the transform into absolute coordinates or keep potrace's group transform
        tr = ''
        node = el
        tr = el.get('transform') or ''
        for g in root.iter(SVGNS + 'g'):
            if el in list(g):
                tr = (g.get('transform') or '') + ' ' + tr
        mt = re.search(r'translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)\s*scale\(([-\d.e]+)[ ,]+([-\d.e]+)\)', tr)
        if mt:
            tx, ty, sx, sy = [float(v) for v in mt.groups()]
        else:
            mm = re.search(r'matrix\(([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([-\d.e]+)\)', tr)
            if mm:
                a_, b_, c_, d_, e_, f_ = [float(v) for v in mm.groups()]
                sx, sy, tx, ty = a_, d_, e_, f_
            else:
                sx, sy, tx, ty = 1.0, 1.0, 0.0, 0.0
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


def main():
    src = np.array(Image.open('src.png').convert('RGB'))
    out = {}
    for name, k in K.items():
        im = np.array(Image.open(f'parts/{name}.png'))
        m = im[..., 3] > 127
        lab, n = ndimage.label(m)
        if name in ('collar', 'crease', 'torso', 'patch') and n > 1:
            sz = ndimage.sum(m, lab, range(1, n + 1)); m = lab == 1 + int(np.argmax(sz))
        if name == 'torso':
            m = ndimage.binary_fill_holes(m)
        ys, xs = np.nonzero(m)
        x0, y0, x1, y1 = xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7
        mc = m[y0:y1, x0:x1]
        rgb = src[y0:y1, x0:x1].astype(np.float32)
        layers = []
        if k == 1 or name == 'torso':
            core = ndimage.binary_erosion(mc, iterations=2)
            col = np.median(rgb[core if core.any() else mc], 0) if name != 'torso' else np.array([0x25, 0x34, 0x66])
            layers.append(dict(fill='#%02x%02x%02x' % tuple(int(v) for v in col), segs=None))
            labels = None
        else:
            labx = cv2.cvtColor(np.ascontiguousarray(rgb.astype(np.uint8)), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
            inner = ndimage.binary_erosion(mc, iterations=1)
            km = KMeans(k, n_init=6, random_state=1).fit(labx[inner.ravel()])
            L = km.predict(labx).reshape(mc.shape)
            # mode filter (3 passes, 5x5) so antialias pixels join their neighbours
            for _ in range(3):
                votes = np.stack([cv2.blur((L == i).astype(np.float32), (5, 5)) for i in range(k)])
                L = votes.argmax(0)
            # silhouette edge pixels are blended with the background: give them the nearest interior label
            core2 = ndimage.binary_erosion(mc, iterations=3)
            _, (iy, ix) = ndimage.distance_transform_edt(~core2, return_indices=True)
            L = L[iy, ix]
            if name == 'head':   # small dark features (eye, lashes, brow) are traced on their own, unfiltered
                lum = rgb.mean(-1)
                XX = np.arange(mc.shape[1])[None, :] + x0
                YY = np.arange(mc.shape[0])[:, None] + y0
                feat = (lum < 75) & (XX > 670) & (XX < 704) & (YY > 192) & (YY < 232) & mc
                L[feat & (YY < 204)] = k                     # brow
                L[feat & (YY >= 204)] = k + 1                # eye (swapped for a lid line on blinks)
                k_eff = k + 1
            L[~mc] = -1
            kk = k + 2 if name == 'head' else k
            areas = [(L == i).sum() for i in range(kk)]
            order = list(np.argsort(areas[:k])[::-1]) + ([k, k + 1] if name == 'head' else [])
            for i in order:
                reg = L == i
                if reg.sum() < 12:
                    continue
                core = ndimage.binary_erosion(reg, iterations=1)
                col = np.median(rgb[core if core.sum() > 6 else reg], 0)
                layers.append(dict(fill='#%02x%02x%02x' % tuple(int(v) for v in col), mask=reg,
                                   fine=(name == 'head' and i >= k),
                                   tag={k: 'brow', k + 1: 'eye'}.get(i) if name == 'head' else None))
        sil = potrace_mask(mc, x0, y0)
        for j, ly in enumerate(layers):
            if j == 0:
                ly['segs'] = None          # bottom layer = the whole silhouette
            else:
                ly['segs'] = potrace_mask(ly.pop('mask'), x0, y0, blur=0.6 if ly.get('fine') else 1.0)
            ly.pop('fine', None)
            ly.pop('mask', None)
        out[name] = dict(sil=sil, layers=layers)
        print(name, [l['fill'] for l in layers])
    json.dump(out, open('traced.json', 'w'))


if __name__ == '__main__':
    main()
