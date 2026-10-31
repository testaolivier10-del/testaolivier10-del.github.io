"""Drawing kit for the long video (1920x1080, house flat style)."""
import math
import numpy as np
import skia

W, H, FPS = 1920, 1080, 30
TF = '/usr/share/fonts/opentype/inter/'
TYPE = {k: skia.Typeface.MakeFromFile(TF + f) for k, f in
        (('bold', 'Inter-Bold.otf'), ('semi', 'Inter-SemiBold.otf'), ('xb', 'Inter-ExtraBold.otf'), ('med', 'Inter-Medium.otf'))}
TYPE['hand'] = skia.Typeface.MakeFromFile('/home/claude/lp/fonts/Kalam-700.ttf')

NAVY, INDIGO = (20, 26, 51), (42, 37, 80)
CREAM, INK2 = (240, 236, 228), (150, 156, 190)
AMBER, CORAL, TEAL, YELLOW, BLUE, GREEN, LILAC = (255, 198, 87), (255, 112, 102), (63, 194, 169), (255, 214, 92), (110, 150, 232), (110, 206, 130), (182, 160, 240)
COURSE = (236, 132, 108)          # A&P coral
PREFIX, ROOT, SUFFIX, VOWEL = TEAL, CORAL, AMBER, (255, 240, 200)


def C(rgb, a=255):
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(max(0, min(255, a))))


def P(col, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), **k)


def SP(col, w, a=255):
    return skia.Paint(AntiAlias=True, Color=C(col, a), Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                      StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)


def blur(r):
    return skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r)


def sm(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def win(t, t0, t1, fi=0.35, fo=0.35):
    """1 inside [t0, t1] with eased fades"""
    return sm((t - t0) / fi) * (1 - sm((t - t1) / fo))


def font(kind, size):
    f = skia.Font(TYPE[kind], size); f.setEdging(skia.Font.Edging.kAntiAlias); return f


def text(c, s, x, y, size, col=CREAM, a=1.0, kind='bold', align='left'):
    if a <= 0.01 or not s:
        return 0
    f = font(kind, size); w = f.measureText(s)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    c.drawString(s, x, y, f, P(col, 255 * a))
    return w


def width(s, size, kind='bold'):
    return font(kind, size).measureText(s)


def hand(c, s, x, y, size, col=CREAM, u=1.0, align='left'):
    """handwriting reveal: the line is uncovered left to right as u goes 0 -> 1"""
    if u <= 0.001:
        return
    f = font('hand', size); w = f.measureText(s)
    if align == 'center':
        x -= w / 2
    c.save(); c.clipRect(skia.Rect(x - 4, y - size * 1.2, x + w * u + 4, y + size * 0.5))
    c.drawString(s, x, y, f, P(col))
    c.restore()


def pill(c, s, cx, cy, col, size=34, a=1.0, fill=None, kind='bold', pad=22):
    if a <= 0.01:
        return
    w = width(s, size, kind) + pad * 2; h = size * 1.55
    r = skia.RRect.MakeRectXY(skia.Rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), h / 2, h / 2)
    c.drawRRect(r, P(fill or (16, 18, 38), 225 * a))
    c.drawRRect(r, SP(col, 3.5, 255 * a))
    text(c, s, cx, cy + size * 0.36, size, CREAM, a, kind, 'center')


def chip(c, s, x, y, col, size=64, a=1.0, scale=1.0, txt=NAVY):
    """a word part tile: rounded flat block with a darker lower lip and an amber rim on top"""
    if a <= 0.01:
        return 0
    w = width(s, size, 'xb') + 44; h = size * 1.45
    c.save(); c.translate(x + w / 2, y + h / 2); c.scale(scale, scale); c.translate(-w / 2, -h / 2)
    lip = skia.RRect.MakeRectXY(skia.Rect(0, 6, w, h + 6), 16, 16)
    c.drawRRect(lip, P(tuple(v * 0.7 for v in col), 255 * a))
    body = skia.RRect.MakeRectXY(skia.Rect(0, 0, w, h), 16, 16)
    c.drawRRect(body, P(col, 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(3, 2, w - 3, 8), 4, 4), P((255, 255, 255), 70 * a))
    text(c, s, w / 2, h * 0.7, size, txt, a, 'xb', 'center')
    c.restore()
    return w


def arrow(c, p0, p1, col=AMBER, w=8, u=1.0, a=1.0, bend=0.0, head=26):
    """curved arrow drawn on as u goes 0 -> 1"""
    if u <= 0.01 or a <= 0.01:
        return
    p0, p1 = np.array(p0, float), np.array(p1, float)
    m = (p0 + p1) / 2; d = p1 - p0; n = np.array([-d[1], d[0]])
    ctrl = m + n * bend
    path = skia.Path(); path.moveTo(*p0); path.quadTo(*ctrl, *p1)
    meas = skia.PathMeasure(path, False); L = meas.getLength()
    seg = skia.Path(); meas.getSegment(0, L * u, seg, True)
    c.drawPath(seg, SP(col, w, 255 * a))
    pos, tan = meas.getPosTan(L * u)
    tx, ty = tan.x(), tan.y(); x, y = pos.x(), pos.y()
    hp = skia.Path(); hp.moveTo(x + tx * head * 0.4, y + ty * head * 0.4)
    hp.lineTo(x - tx * head * 0.7 - ty * head * 0.55, y - ty * head * 0.7 + tx * head * 0.55)
    hp.lineTo(x - tx * head * 0.7 + ty * head * 0.55, y - ty * head * 0.7 - tx * head * 0.55); hp.close()
    c.drawPath(hp, P(col, 255 * a))


def glow(c, x, y, r, col=AMBER, a=1.0):
    if a > 0.01:
        c.drawCircle(x, y, r, P(col, 110 * a, MaskFilter=blur(r * 0.4), BlendMode=skia.BlendMode.kScreen))


def calm_bg(c, t, tint=COURSE):
    """the calm teaching background: navy to indigo with slow drifting soft shapes and motes (scene life)"""
    sh = skia.GradientShader.MakeRadial(skia.Point(W * 0.5, H * 0.45), W * 0.75, [C((46, 40, 92)), C(NAVY)], [0, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=sh))
    for k, (x0, y0, r, sp) in enumerate(((300, 260, 260, 7), (1600, 820, 320, 5), (1500, 200, 180, 9), (420, 900, 220, 6))):
        x = x0 + 40 * math.sin(t * 0.05 * sp + k); y = y0 + 30 * math.cos(t * 0.04 * sp + k * 2)
        c.drawCircle(x, y, r, P(tint if k % 2 == 0 else (90, 96, 170), 18, MaskFilter=blur(60)))
    rs = np.random.default_rng(5)
    for k in range(26):
        x = (rs.uniform(0, W) + t * rs.uniform(4, 10)) % W
        y = rs.uniform(0, H) + 8 * math.sin(t * 0.5 + k)
        c.drawCircle(x, y, rs.uniform(1.2, 2.8), P((170, 176, 230), 60 + 40 * math.sin(t + k)))


def vignette(c):
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * 0.62, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((8, 6, 20), 140)], [0, 0.62, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))


def timer(c, u, cx=W - 130, cy=130, a=1.0):
    """pause timer: a ring that empties over the pause"""
    if a <= 0.01:
        return
    c.drawCircle(cx, cy, 62, P((16, 18, 38), 220 * a))
    c.drawCircle(cx, cy, 52, SP((70, 76, 120), 10, 255 * a))
    c.drawArc(skia.Rect(cx - 52, cy - 52, cx + 52, cy + 52), -90, 360 * (1 - u), False, SP(AMBER, 10, 255 * a))
    text(c, 'PAUSE', cx, cy + 9, 24, CREAM, a, 'xb', 'center')


def card(c, t, title, n, u):
    """chapter card over the calm background"""
    calm_bg(c, t)
    a = sm(u / 0.25) * (1 - sm((u - 0.8) / 0.2))
    text(c, f'{n:02d}', W / 2, 470, 64, COURSE, a, 'xb', 'center')
    c.drawRect(skia.Rect(W / 2 - 60 * a, 500, W / 2 + 60 * a, 506), P(AMBER, 255 * a))
    text(c, title, W / 2, 600, 84, CREAM, a, 'xb', 'center')


def label(c, s, x, y, col=CREAM, size=34, a=1.0, dot=None, align='left'):
    """a label with an amber dot ringed in navy at its anchor (style guide labels)"""
    if a <= 0.01:
        return
    if dot is not None:
        c.drawLine(*dot, x - (12 if align == 'left' else -12), y - size * 0.35, SP(INK2, 2.5, 255 * a))
        c.drawCircle(*dot, 9, P(NAVY, 255 * a)); c.drawCircle(*dot, 6, P(AMBER, 255 * a))
    w = width(s, size, 'semi'); x0 = x - (w if align == 'right' else 0)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 14, y - size * 1.0, x0 + w + 14, y + size * 0.38), 12, 12), P((16, 18, 38), 190 * a))
    text(c, s, x, y, size, col, a, 'semi', align)
