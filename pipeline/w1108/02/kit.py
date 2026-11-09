"""w1104 shared kit: words, film finish (bomber build4 finish()), house layout, render. Premium standard."""
import sys, math, json
sys.path[:0] = ['/home/claude/short', '/home/claude/w1104']
import numpy as np, skia, cv2
import layout as L
import lpk
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, flat, lgrad, ridge, jag, ik2

W, H, FPS = 1080, 1920, 30
_GRAIN = np.random.default_rng(7)
_VIG = None


def ease_io(u):
    u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)


class Words:
    def __init__(self, path):
        self.w = json.load(open(path))
        self.k = [x['w'].lower().strip('.,!?:;"') for x in self.w]

    def at(self, word, n=1):
        word = word.lower(); k = 0
        for i, x in enumerate(self.k):
            if x == word:
                k += 1
                if k == n: return self.w[i]['t0']
        raise KeyError(word)

    def end_of(self, word, n=1):
        word = word.lower(); k = 0
        for i, x in enumerate(self.k):
            if x == word:
                k += 1
                if k == n: return self.w[i]['t1']
        raise KeyError(word)

    def end(self):
        return self.w[-1]['t1']


def finish(img, t, lift=1.0, warm=(-0.02, 0.0, 0.03), sat=0.95):
    """film finish: bloom on bright light, one grade (no grey veil), vignette, fine moving grain"""
    global _VIG
    x = img[:, :, :3].astype(np.float32) / 255.0
    lum = x @ np.array([0.114, 0.587, 0.299], np.float32)
    hi = np.clip((lum - 0.72) / 0.28, 0, 1)[..., None] * x
    small = cv2.resize(hi, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bl = cv2.GaussianBlur(small, (0, 0), 10)
    bl = cv2.resize(bl, (W, H), interpolation=cv2.INTER_LINEAR)
    x = 1 - (1 - x) * (1 - 0.35 * bl)
    g = lum[..., None]
    x = g + (x - g) * sat
    if lift != 1.0: x = np.power(np.clip(x, 0, 1), 1 / lift)
    x = 0.5 + (x - 0.5) * 1.06
    x = x * (1 + np.array(warm, np.float32) * g)
    if _VIG is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.47) / (H * 0.6)) ** 2
        _VIG = (1 - 0.14 * np.clip(d, 0, 1.4) ** 1.6)[..., None]
    x = x * _VIG
    n = _GRAIN.normal(0, 0.011, (H // 2, W // 2)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    x = x + n * (0.5 + 0.5 * (1 - g))
    out = img.copy(); out[:, :, :3] = np.clip(x * 255 + 0.5, 0, 255).astype(np.uint8)
    return out


def blur_layer(c, r):
    """start a blurred layer (foreground out of focus); close with c.restore()"""
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(r, r)))


def push(c, u, cx, cy, z0, z1, tx0=540, ty0=960, tx1=None, ty1=None):
    """camera: zoom from z0 to z1 around a target that moves from (tx0,ty0) to (tx1,ty1); u in 0..1"""
    z = lerp(z0, z1, u)
    tx1 = tx0 if tx1 is None else tx1; ty1 = ty0 if ty1 is None else ty1
    c.translate(cx, cy); c.scale(z, z); c.translate(-lerp(tx0, tx1, u), -lerp(ty0, ty1, u))


MERGE = [(['A', 'P'], 'AP'), (['nineteen', 'forty', 'seven,'], '1947,'), (['levlprep', 'dot', 'com.'], 'levlprep.com.')]


def merge_words(ws):
    """caption display: spelled letters and spoken numbers shown the way they are written"""
    out = []; i = 0
    while i < len(ws):
        for seq, rep in MERGE:
            if [x['w'] for x in ws[i:i + len(seq)]] == seq:
                out.append(dict(ws[i], w=rep, t1=ws[i + len(seq) - 1]['t1'])); i += len(seq); break
        else:
            w = dict(ws[i]); w['w'] = w['w'].replace('PARASITISM', 'parasitism').replace('ONE', 'one').replace('HUGE', 'huge')
            out.append(w); i += 1
    return out


class Short:
    """titles hard switch, badge, captions, watermark, end line; frame = scene -> finish -> overlays"""
    def __init__(self, words, badge, titles, scene, dur, t_end, lift=lambda t: 1.0, series=None, fix=None, brk=(), cuts=()):
        self.WD = words; self.badge = badge; self.titles = titles; self.scene = scene
        self.dur = dur; self.t_end = t_end; self.lift = lift; self.series = series; self.cuts = cuts
        self.cap = lpk.Captions(merge_words(words.w), fix=fix or {}, brk=brk)

    def frame(self, t):
        s = skia.Surface(W, H); c = s.getCanvas()
        z = 1.0
        for ct in self.cuts:          # zoom cut: an accelerating push into the cut, the next shot settles from 1.1
            if ct - 0.42 < t < ct: z = 1 + 0.55 * ((t - (ct - 0.42)) / 0.42) ** 2.2
            elif ct <= t < ct + 0.4: z = 1.1 - 0.1 * ease_io((t - ct) / 0.4)
        c.save(); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
        self.scene(c, t)
        c.restore()
        img = finish(s.makeImageSnapshot().toarray(), t, lift=self.lift(t))
        s = skia.Surface(W, H); c = s.getCanvas()
        c.drawImage(skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType), 0, 0)
        L.fades(c)
        L.badge(c, self.badge)
        if self.series: lpk.series_tag(c, self.series)
        # titles hard switch: each holds until the next starts (no crossfade overlap)
        for i, (a, lines) in enumerate(self.titles):
            b = self.titles[i + 1][0] if i + 1 < len(self.titles) else self.dur + 1
            if a <= t < b:
                _title_hard(c, lines, t, a)
        if t < self.t_end:
            f = skia.Font(L.BLACK, 32); ww = f.measureText('levlprep.com')
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(40, 1368, 72 + ww, 1414), 20, 20), P((5, 12, 26), 150))
            L.watermark(c)
        self.cap.draw(c, t, y=1472)
        if t > self.t_end: lpk.end_line(c, t, self.t_end, y=1600)
        return s


def _title_hard(c, lines, t, a, size=92):
    widest = max(L.line_width(ln, size) for ln in lines)
    if widest > 960: size = size * 960 / widest
    s = 0.92 + 0.08 * smooth((t - a) / 0.18)
    al = smooth((t - a) / 0.12)
    c.save(); c.translate(540, 300); c.scale(s, s); c.translate(-540, -300)
    n = len(lines); y0 = 300 - (n - 1) * size * 0.52 + size * 0.36
    for i, ln in enumerate(lines):
        L.rich_line(c, ln, 540, y0 + i * size * 1.04, size, al)
    c.restore()


Wt, Y, R, TL, OR = (255, 255, 255), (255, 210, 63), (255, 92, 92), (90, 220, 200), (255, 150, 60)


def render(short, out=None, stills=None, outdir='.'):
    import os
    os.makedirs(outdir, exist_ok=True)
    lpk.render(short.frame, short.dur, out, stills=stills, outdir=outdir)


def args():
    return lpk.args()
