"""n35 renderer core: timing from the voiced plan, skia helpers in the house look, handwriting, header, chapter cards,
pause timer, image cache, camera, liquid frame player. One renderer for the whole video (1920x1080, 30 fps)."""
import sys, os, json, math, functools
sys.path[:0] = ['/home/claude/n35', '/home/claude/short', '/home/claude/lp']
import numpy as np, skia, cv2
from PIL import Image
import layout as L
from layout import smooth, col

W, H, FPS = 1920, 1080, 30
VID = 'yt-nremt-35-bleeding'
OUT = f'/home/claude/lp/out/{VID}'
PLAN = json.load(open(f'{OUT}/plan.json'))
T, D = PLAN['T'], PLAN['D']
C = {k: {int(n): v for n, v in c.items()} for k, c in PLAN['C'].items()}
CH = PLAN['CH']
TOT = round(PLAN['TOT'] + 1.0, 2)

TEAL, YELLOW, CORAL, WHITE, GREEN = (0x2e, 0xe6, 0xd6), (0xff, 0xd2, 0x3f), (0xff, 0x6b, 0x6b), (255, 255, 255), (0x3f, 0xe0, 0x7a)
MINT = (0x3f, 0xc2, 0xa9)
RED = (0xe8, 0x2a, 0x3a)
NAVY = (8, 20, 40)
INK = (0xa9, 0xbb, 0xd8)
LILAC = (0xc9, 0xa6, 0xf2)
# inks for light (diagram) backgrounds
DINK, DRED, DGREEN, DTEAL, DGOLD = (27, 42, 74), (196, 34, 56), (22, 128, 74), (8, 118, 120), (176, 120, 0)

BLACK = L.BLACK
XB = L.XBOLD
KALAM = skia.Typeface.MakeFromFile('/home/claude/lp/fonts/Kalam-700.ttf')
SMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kNone)


def cue(k, n=None):
    return T[k] if n is None else C[k][n]


def end(k):
    return T[k] + D[k]


def lerp(a, b, u):
    return a + (b - a) * u


def clamp(u, a=0.0, b=1.0):
    return min(max(u, a), b)


def ease(t, t0, d=0.4):
    return smooth((t - t0) / max(d, 1e-6))


def win(t, t0, t1, fin=0.3, fout=0.3):
    return smooth((t - t0) / fin) * (1 - smooth((t - t1) / fout))


def pop(t, t0, d=0.35):
    """0 -> 1 with a small overshoot (for marks landing on a word)."""
    u = clamp((t - t0) / d)
    if u <= 0:
        return 0.0
    return 1 + 0.12 * math.sin(u * math.pi) * (1 - u) if u < 1 else 1.0


# ------------------------------------------------------------------ images
_KEEP = []


def skimg(a):
    a = np.ascontiguousarray(a)
    if a.ndim == 2:
        a = np.dstack([a, a, a])
    if a.shape[2] == 3:
        a = np.dstack([a, np.full(a.shape[:2], 255, np.uint8)])
    im = skia.Image.fromarray(np.ascontiguousarray(a), colorType=skia.ColorType.kRGBA_8888_ColorType)
    return im          # fromarray copies the pixels (copy=True), so nothing has to be kept alive


@functools.lru_cache(maxsize=None)
def plate_img(name):
    import geo
    return skimg(geo.plate(name, sharpen=not name.startswith('l_')))


@functools.lru_cache(maxsize=None)
def calm_bg():
    """The calm teaching background: the garage painting, blurred and darkened (same world, same light)."""
    import geo
    a = geo.plate('g_garage.png').astype(np.float32)
    a = cv2.GaussianBlur(a, (0, 0), 22)
    navy = np.array([10, 22, 44], np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    v = np.clip(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.7)) ** 2, 0, 1)[..., None]
    a = a * 0.38 + navy * 0.62
    a = a * (1 - 0.45 * v)
    return skimg(np.clip(a, 0, 255).astype(np.uint8))


def clamp_cam(cam):
    cx, cy, z = cam
    z = max(z, 1.0)
    return (clamp(cx, W / (2 * z), W - W / (2 * z)), clamp(cy, H / (2 * z), H - H / (2 * z)), z)


def draw_plate(c, name, cam=(W / 2, H / 2, 1.0), a=1.0):
    cx, cy, z = clamp_cam(cam)
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cx, -cy)
    p = skia.Paint(AntiAlias=True)
    if a < 1:
        p.setAlphaf(a)
    c.drawImage(plate_img(name), 0, 0, SMP, p)
    c.restore()


def w2s(cam, p):
    cx, cy, z = clamp_cam(cam)
    return np.array([z * (p[0] - cx) + W / 2, z * (p[1] - cy) + H / 2])


def push_cam(c, cam):
    cx, cy, z = clamp_cam(cam)
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cx, -cy)


def cam_lerp(a, b, u):
    return tuple(lerp(a[i], b[i], u) for i in range(3))


# ------------------------------------------------------------------ liquid frame player
class Liq:
    def __init__(self, d, t0, dx=0.0, dy=0.0):
        self.d, self.t0 = d, t0
        self.n = json.load(open(f'{d}/meta.json'))['n'] if os.path.exists(f'{d}/meta.json') else 0
        self.dx, self.dy = dx, dy
        if d.rstrip('/').endswith('/wide'):
            # the wide sim was run for the first cast scale; follow the wound to where it is now
            g = json.load(open('/home/claude/n35/wide_geo.json'))
            self.dx, self.dy = g['wound'][0] - 787.80, g['wound'][1] - 607.04
        self._last = (None, None)

    def img(self, t):
        i = int(clamp((t - self.t0) * FPS, 0, self.n - 1))
        if t < self.t0 or self.n == 0:
            return None
        if self._last[0] != i:
            a = cv2.imread(f'{self.d}/{i:04d}.png', cv2.IMREAD_UNCHANGED)
            a = cv2.cvtColor(a, cv2.COLOR_BGRA2RGBA)
            self._last = (i, skimg(a))
        return self._last[1]

    def draw(self, c, t, a=1.0, dx=0.0, dy=0.0, clip_y=None, below=True):
        im = self.img(t)
        if im is None:
            return
        if clip_y is not None:
            c.save()
            c.clipRect(skia.Rect(-4000, clip_y, 6000, 6000) if below else skia.Rect(-4000, -4000, 6000, clip_y))
            self.draw(c, t, a, dx, dy)
            c.restore()
            return
        p = skia.Paint(AntiAlias=True)
        if a < 1:
            p.setAlphaf(max(a, 0))
        c.drawImage(im, self.dx + dx, self.dy + dy, SMP, p)


# ------------------------------------------------------------------ text
def font(face, size):
    f = skia.Font(face, size); f.setEdging(skia.Font.Edging.kAntiAlias); f.setSubpixel(True)
    return f


def tw(s, size, face=None):
    return font(face or BLACK, size).measureText(s)


def text(c, s, x, y, size, color=WHITE, a=1.0, align='left', face=None, shadow=True):
    if a <= 0.01:
        return
    f = font(face or BLACK, size)
    w = f.measureText(s)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    if shadow:
        c.drawString(s, x, y + size * 0.06, f, skia.Paint(AntiAlias=True, Color=skia.Color(3, 8, 20, int(150 * a)),
                                                          MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, size * 0.08)))
    c.drawString(s, x, y, f, skia.Paint(AntiAlias=True, Color=col(color, 255 * a)))
    return w


def hw(c, s, x, y, size, color, t, t0, dur=None, a=1.0, align='left', shadow=True):
    """Handwriting: Kalam text revealed left to right from t0 over dur (default by length)."""
    if t < t0 or a <= 0.01:
        return 0
    f = font(KALAM, size)
    w = f.measureText(s)
    dur = dur if dur is not None else min(1.6, max(0.3, len(s) / 22))
    u = clamp((t - t0) / dur)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    c.save()
    c.clipRect(skia.Rect(x - 12, y - size * 1.3, x - 12 + (w + 30) * u, y + size * 0.6))
    if shadow:
        c.drawString(s, x + 2, y + 4, f, skia.Paint(AntiAlias=True, Color=skia.Color(3, 8, 20, int(170 * a)),
                                                    MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4)))
    c.drawString(s, x, y, f, skia.Paint(AntiAlias=True, Color=col(color, 255 * a)))
    c.restore()
    return w


def hw_rich(c, parts, x, y, size, t, t0, dur=None, a=1.0, align='left'):
    """parts [(text, color)] written as one line."""
    full = ''.join(p for p, _ in parts)
    f = font(KALAM, size)
    w = f.measureText(full)
    dur = dur if dur is not None else min(1.8, max(0.3, len(full) / 22))
    if align == 'center':
        x -= w / 2
    xx = x; acc = 0
    for s, colr in parts:
        n0 = acc / max(len(full), 1); n1 = (acc + len(s)) / max(len(full), 1)
        hw(c, s, xx, y, size, colr, t, t0 + dur * n0, dur * (n1 - n0) + 1e-3, a, shadow=sum(colr) > 360)
        xx += f.measureText(s); acc += len(s)
    return w


def chip(c, s, x, y, color, a=1.0, size=40, anchor=None, t=None, t0=None):
    if a <= 0.01:
        return
    sc = 1.0
    if t is not None and t0 is not None:
        sc = 0.85 + 0.15 * smooth((t - t0) / 0.2)
    L.chip(c, s, x, y, color, size, a, scale=sc, anchor=anchor)


def card(c, x, y, w, h, a=1.0, r=26, fill=(5, 12, 26), fa=0.82, border=None):
    if a <= 0.01:
        return
    rr = skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), r, r)
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Color=skia.Color(*fill, int(255 * fa * a)),
                               ImageFilter=None))
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Color=col(border or (255, 255, 255), (255 if border else 34) * a),
                               Style=skia.Paint.kStroke_Style, StrokeWidth=3 if border else 2))


def shadow_rect(c, x, y, w, h, r, a):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, y + 10, x + w, y + h + 10), r, r),
                skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, int(110 * a)), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16)))


def pic(c, name, src, x, y, w, h, a=1.0, r=26, border=None, zoom=1.0, img=None):
    """A rounded picture card: crop src=(cx, cy, cw) of a 1920x1080 plate (cw wide, aspect of w/h)."""
    if a <= 0.01:
        return
    shadow_rect(c, x, y, w, h, r, a)
    cx, cy, cw = src
    cw /= zoom
    ch = cw * h / w
    c.save()
    c.clipRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), r, r), True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(img if img is not None else plate_img(name), skia.Rect(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2), skia.Rect(x, y, x + w, y + h), SMP, p)
    c.restore()
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), r, r),
                skia.Paint(AntiAlias=True, Color=col(border or (255, 255, 255), 255 * a if border else 60 * a),
                           Style=skia.Paint.kStroke_Style, StrokeWidth=4 if border else 2))


def arrow(c, p0, p1, color, w=12, head=34, a=1.0, grow=1.0):
    p0, p1 = np.array(p0, float), np.array(p1, float)
    if a <= 0.01 or grow <= 0.01:
        return
    p1 = p0 + (p1 - p0) * grow
    d = p1 - p0; Ln = np.linalg.norm(d)
    if Ln < 2:
        return
    u = d / Ln; n = np.array([-u[1], u[0]])
    hd = min(head, Ln * 0.6)
    base = p1 - u * hd
    path = skia.Path(); path.moveTo(*p1); path.lineTo(*(base + n * hd * 0.62)); path.lineTo(*(base - n * hd * 0.62)); path.close()
    for widen, colr, al in ((6, (8, 10, 24), 0.5), (0, color, 1.0)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=w + widen, StrokeCap=skia.Paint.kRound_Cap,
                        Style=skia.Paint.kStroke_Style)
        c.drawLine(*p0, *(base + u * 4), pa)
        pf = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al))
        if widen:
            pf.setStyle(skia.Paint.kStrokeAndFill_Style); pf.setStrokeWidth(widen); pf.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawPath(path, pf)


def curve_arrow(c, pts, color, w=10, head=30, a=1.0, grow=1.0):
    """Arrow along a smooth polyline (list of points), drawn up to fraction grow."""
    if a <= 0.01 or grow <= 0.01:
        return
    P = np.array(pts, float)
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1); Ltot = seg.sum(); want = Ltot * grow
    out = [P[0]]; acc = 0
    for i, s in enumerate(seg):
        if acc + s >= want:
            out.append(P[i] + (P[i + 1] - P[i]) * (want - acc) / max(s, 1e-6)); break
        out.append(P[i + 1]); acc += s
    out = np.array(out)
    if len(out) < 2:
        return
    path = skia.Path(); path.moveTo(*out[0])
    for q in out[1:-1]:
        path.lineTo(*q)
    tip = out[-1]; d = tip - out[-2]; Ln = np.linalg.norm(d)
    if Ln < 1e-3:
        return
    u = d / Ln; n = np.array([-u[1], u[0]]); base = tip - u * head
    path.lineTo(*(base + u * 2))
    hp = skia.Path(); hp.moveTo(*tip); hp.lineTo(*(base + n * head * 0.62)); hp.lineTo(*(base - n * head * 0.62)); hp.close()
    for widen, colr, al in ((6, (8, 10, 24), 0.5), (0, color, 1.0)):
        c.drawPath(path, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=w + widen, Style=skia.Paint.kStroke_Style,
                                    StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join))
        pf = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al))
        if widen:
            pf.setStyle(skia.Paint.kStrokeAndFill_Style); pf.setStrokeWidth(widen); pf.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawPath(hp, pf)


def ring(c, p, r, color, a=1.0, w=7):
    if a <= 0.01:
        return
    c.drawCircle(*p, r, skia.Paint(AntiAlias=True, Color=col((8, 10, 24), 130 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=w + 5))
    c.drawCircle(*p, r, skia.Paint(AntiAlias=True, Color=col(color, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=w))


def glow(c, p, r, color, a=1.0):
    if a <= 0.01:
        return
    sh = skia.GradientShader.MakeRadial(skia.Point(*p), max(r, 1), [col(color, 190 * a), col(color, 0)])
    c.drawCircle(*p, r, skia.Paint(Shader=sh))


def x_mark(c, x, y, s, a):
    if a <= 0.01:
        return
    for widen, colr in ((12, (20, 6, 10)), (0, CORAL)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=26 * s + widen, StrokeCap=skia.Paint.kRound_Cap,
                        Style=skia.Paint.kStroke_Style)
        c.drawLine(x - 60 * s, y - 60 * s, x + 60 * s, y + 60 * s, pa)
        c.drawLine(x - 60 * s, y + 60 * s, x + 60 * s, y - 60 * s, pa)


def check_mark(c, x, y, s, a):
    if a <= 0.01:
        return
    p = skia.Path(); p.moveTo(x - 55 * s, y); p.lineTo(x - 14 * s, y + 42 * s); p.lineTo(x + 62 * s, y - 48 * s)
    for widen, colr in ((12, (6, 20, 12)), (0, GREEN)):
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=24 * s + widen, StrokeCap=skia.Paint.kRound_Cap,
                                 StrokeJoin=skia.Paint.kRound_Join, Style=skia.Paint.kStroke_Style))


def clock(c, x, y, r, frac, color, a=1.0, label=None):
    """A round timer: the arc fills to frac (0..1)."""
    if a <= 0.01:
        return
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(220 * a))))
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Color=col(color, 70 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=10))
    if frac > 0.001:
        p = skia.Path(); p.addArc(skia.Rect(x - r, y - r, x + r, y + r), -90, 360 * clamp(frac))
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(color, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=10,
                                 StrokeCap=skia.Paint.kRound_Cap))
    ang = -math.pi / 2 + 2 * math.pi * clamp(frac)
    c.drawLine(x, y, x + 0.62 * r * math.cos(ang), y + 0.62 * r * math.sin(ang),
               skia.Paint(AntiAlias=True, Color=col(WHITE, 240 * a), StrokeWidth=6, StrokeCap=skia.Paint.kRound_Cap))
    c.drawCircle(x, y, 7, skia.Paint(AntiAlias=True, Color=col(WHITE, 255 * a)))
    if label:
        text(c, label, x, y + r + 50, 34, color, a, align='center')


def vignette(c, a=0.35):
    sh = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * 0.75, [skia.Color(0, 0, 0, 0), skia.Color(4, 8, 20, int(255 * a))], [0.55, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=sh))


def top_fade(c, a=1.0):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 190)], [skia.Color(5, 10, 22, int(170 * a)), skia.Color(5, 10, 22, 0)])
    c.drawRect(skia.Rect(0, 0, W, 190), skia.Paint(Shader=sh))


# ------------------------------------------------------------------ header, chapter cards, pause timer
COURSE_TAG = 'NREMT'


def chapter_at(t):
    cur = 0
    for i, ch in enumerate(CH):
        if t >= ch['t']:
            cur = i
    return cur


def header(c, t):
    top_fade(c)
    f = font(BLACK, 22)
    sp = 4.0
    wt = sum(f.measureText(ch) + sp for ch in COURSE_TAG) - sp
    x0, y0 = 56, 40
    r = skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + wt + 40, y0 + 46), 23, 23)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(8, 20, 40, 160)))
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col(MINT), Style=skia.Paint.kStroke_Style, StrokeWidth=3))
    x = x0 + 20
    for ch in COURSE_TAG:
        c.drawString(ch, x, y0 + 31, f, skia.Paint(AntiAlias=True, Color=col(MINT))); x += f.measureText(ch) + sp
    i = chapter_at(t)
    chh = CH[i]
    t0 = chh['t'] + (1.9 if chh['card'] else 0)
    t1 = CH[i + 1]['t'] if i + 1 < len(CH) else TOT
    a = smooth((t - t0) / 0.4) * (1 - smooth((t - t1 + 0.3) / 0.3))
    if a > 0.01:
        text(c, chh['title'], x0 + wt + 66, y0 + 33 - 12 * (1 - smooth((t - t0) / 0.4)), 28, (0xcf, 0xe0, 0xff), a, face=XB)


def chapter_card(c, t):
    for i, ch in enumerate(CH):
        if not ch['card']:
            continue
        t0 = ch['t']
        if not (t0 - 0.01 <= t <= t0 + 2.2):
            continue
        abg = smooth((t - t0) / 0.35) * (1 - smooth((t - t0 - 1.65) / 0.4))
        sh = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), 1000, [skia.Color(0x12, 0x38, 0x6e, int(255 * abg)),
                                                                          skia.Color(8, 20, 40, int(255 * abg))])
        c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=sh))
        a = smooth((t - t0 - 0.05) / 0.4) * (1 - smooth((t - t0 - 1.65) / 0.35))
        if a <= 0.01:
            continue
        s = 1.04 - 0.04 * smooth((t - t0 - 0.05) / 0.4)
        c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2)
        f = font(BLACK, 40); n = str(i); sp = 6
        wn = sum(f.measureText(ch_) + sp for ch_ in n) - sp
        text(c, n, W / 2 - wn / 2, H / 2 - 92, 40, TEAL, a, shadow=False)
        text(c, ch['title'], W / 2, H / 2 + 38, 110, WHITE, a, align='center', face=KALAM)
        u = smooth((t - t0 - 0.3) / 0.5)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(W / 2 - 260, H / 2 + 74, W / 2 - 260 + 520 * u, H / 2 + 84), 5, 5),
                    skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a)))
        c.restore()


PAUSES = []
for _k in ('q1q', 'q2q', 'x1q', 'x2q', 'x3q'):
    _p = {'q1q': 5, 'q2q': 6, 'x1q': 6, 'x2q': 6, 'x3q': 5}[_k]
    PAUSES.append((end(_k) + 0.1, _p))


def pause_pill(c, t):
    for s, p in PAUSES:
        if s <= t <= s + p:
            a = smooth((t - s) / 0.3) * (1 - smooth((t - s - p + 0.3) / 0.3))
            x1, y0 = W - 70, 110
            f = font(BLACK, 34); w = f.measureText('Pause and try it')
            x0 = x1 - w - 54 - 26 - 18
            r = skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y0 + 78), 39, 39)
            c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(205 * a))))
            c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=3))
            cx, cy = x0 + 14 + 27, y0 + 39
            c.drawCircle(cx, cy, 22, skia.Paint(AntiAlias=True, Color=col(YELLOW, 64 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=6))
            frac = 1 - clamp((t - s) / max(p - 0.4, 0.1))
            pth = skia.Path(); pth.addArc(skia.Rect(cx - 22, cy - 22, cx + 22, cy + 22), -90, 360 * frac)
            c.drawPath(pth, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=6))
            c.drawString('Pause and try it', cx + 27 + 18, y0 + 51, f, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * a)))


# ------------------------------------------------------------------ sounds (collected by the shots)
SOUNDS = []


def snd(name, t, gain=0.5):
    SOUNDS.append((name, round(t, 3), gain))


# ------------------------------------------------------------------ offscreen and lens
def offscreen(fn):
    s = skia.Surface(W, H)
    fn(s.getCanvas())
    return s.makeImageSnapshot()


def lens(c, t, scene_fn, diag_fn, origin, t_open, t_close, inset=(230, 860, 150), inset_focus=None, dur=0.9):
    """Story to diagram: a round lens grows from origin (screen px) to fill the frame with the diagram; the story
    shrinks into a round corner inset where the person keeps moving; at t_close the lens shrinks back to origin."""
    u = smooth((t - t_open) / dur)
    v = smooth((t - t_close) / dur)
    k = u * (1 - v)
    if k <= 0.001:
        scene_fn(c)
        return 0.0
    ox, oy = origin
    if k < 0.999:
        scene_fn(c)
        r = lerp(0, 1250, k ** 1.4)
        cx, cy = lerp(ox, W / 2, k), lerp(oy, H / 2, k)
        c.save()
        pth = skia.Path(); pth.addCircle(cx, cy, r)
        c.clipPath(pth, True)
        diag_fn(c)
        c.restore()
        c.drawCircle(cx, cy, r, skia.Paint(AntiAlias=True, Color=col(WHITE, 220 * (1 - k)), Style=skia.Paint.kStroke_Style, StrokeWidth=8))
    else:
        diag_fn(c)
    # the inset: the story keeps playing in a small circle
    ia = smooth((k - 0.55) / 0.4)
    if ia > 0.01:
        ix, iy, ir = inset
        img = offscreen(scene_fn)
        fx, fy = inset_focus if inset_focus is not None else origin
        s = 0.42
        c.save()
        pth = skia.Path(); pth.addCircle(ix, iy, ir * ia)
        c.drawCircle(ix, iy + 8, ir * ia, skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, 120), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 12)))
        c.clipPath(pth, True)
        c.translate(ix, iy); c.scale(s, s); c.translate(-fx, -fy)
        c.drawImage(img, 0, 0, SMP)
        c.restore()
        c.drawCircle(ix, iy, ir * ia, skia.Paint(AntiAlias=True, Color=col(WHITE, 235 * ia), Style=skia.Paint.kStroke_Style, StrokeWidth=6))
    return k


def text_card(c, lines, x, y, a=1.0, size=42, pad=26, gap=1.45, border=None):
    """Lines [(text, colour, alpha)] on one dark rounded card (readable over busy art). x, y = top left.
    The card grows smoothly with its lines (height and width follow the line alphas, no pops)."""
    if a <= 0.01:
        return
    vis = [(s, cl, al) for s, cl, al in lines if al > 0.01]
    if not vis:
        return
    w = max(tw(s, size, XB) * (0.6 + 0.4 * clamp(al)) for s, _, al in vis)
    n = sum(clamp(al) for _, _, al in vis)
    h = size * gap * max(n, 0.6)
    am = max(al for _, _, al in vis) * a
    card(c, x, y, w + 2 * pad, h + pad * 0.9, am, r=24, border=border)
    c.save(); c.clipRect(skia.Rect(x, y, x + w + 2 * pad + 400, y + h + pad * 0.9))
    k = 0.0
    for s, cl, al in vis:
        text(c, s, x + pad, y + pad * 0.45 + size * (1.12 + gap * k), size, cl, al * a, face=XB, shadow=False)
        k += clamp(al)
    c.restore()


def meter(c, x, y, w, h, val, a, title, colr_lo=GREEN, colr_hi=CORAL):
    if a <= 0.01:
        return
    card(c, x, y, w, h, a)
    text(c, title, x + w / 2, y + 44, 28, WHITE, a, align='center', face=XB, shadow=False)
    bx0, by0, bx1, by1 = x + w / 2 - 26, y + 70, x + w / 2 + 26, y + h - 24
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 14, 14), skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(40 * a))))
    v = clamp(val)
    cc = tuple(int(lerp(colr_lo[i], colr_hi[i], v)) for i in range(3))
    top = by1 - (by1 - by0) * v
    if v > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, top, bx1, by1), 14, 14), skia.Paint(AntiAlias=True, Color=col(cc, 255 * a)))


@functools.lru_cache(maxsize=None)
def plate_fit_img(name, scale, cx, cy):
    """A diagram plate shrunk to scale around its point (cx, cy) moved to the frame centre, its edges feathered into
    the plate's own background colour (so a big diagram fits with room for hands and text)."""
    import geo
    a = geo.plate(name).astype(np.float32)
    bgc = np.median(np.concatenate([a[:40, :40].reshape(-1, 3), a[-40:, -40:].reshape(-1, 3), a[:40, -40:].reshape(-1, 3)]), 0)
    sm = cv2.resize(a, (int(W * scale), int(H * scale)), interpolation=cv2.INTER_AREA)
    out = np.empty((H, W, 3), np.float32); out[:] = bgc
    # faint rings like the painting's background
    yy, xx = np.mgrid[0:H, 0:W]
    rr = np.hypot(xx - W * 0.62, yy - H * 0.5)
    out += (np.cos(rr / 46.0) > 0.93)[..., None] * 10
    mask = np.zeros((int(H * scale), int(W * scale)), np.float32)
    f = 60
    mask[f:-f, f:-f] = 1; mask = cv2.GaussianBlur(mask, (0, 0), f / 2.5)
    x0 = int(W / 2 - cx * scale); y0 = int(H / 2 - cy * scale)
    hs, ws = sm.shape[:2]
    xa, ya = max(x0, 0), max(y0, 0); xb, yb = min(x0 + ws, W), min(y0 + hs, H)
    sub = sm[ya - y0:yb - y0, xa - x0:xb - x0]; m = mask[ya - y0:yb - y0, xa - x0:xb - x0, None]
    out[ya:yb, xa:xb] = out[ya:yb, xa:xb] * (1 - m) + sub * m
    return skimg(np.clip(out, 0, 255).astype(np.uint8)), (x0, y0, scale)
