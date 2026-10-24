"""LevlPrep Short layout in skia, matching the approved engine2 full screen look (fullbleed):
progress bar, course badge, two line Inter Black titles with colored words, top and bottom fades, teal watermark,
word by word captions in a dark box, chips, and the end card."""
import math
import numpy as np
import skia

W_, H_ = 1080, 1920
BLACK = skia.Typeface.MakeFromFile('/usr/share/fonts/opentype/inter/Inter-Black.otf')
XBOLD = skia.Typeface.MakeFromFile('/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf') or BLACK
TEAL, YELLOW, CORAL, WHITE, NAVY = (0x2e, 0xe6, 0xd6), (0xff, 0xd2, 0x3f), (0xff, 0x6b, 0x6b), (255, 255, 255), (0x08, 0x14, 0x28)
GREEN = (0x3f, 0xe0, 0x7a)


def col(c, a=255):
    return skia.Color(int(c[0]), int(c[1]), int(c[2]), int(max(0, min(255, a))))


def smooth(u):
    u = min(max(u, 0.0), 1.0); return u * u * (3 - 2 * u)


def fades(c):
    """fullbleed.CSS #stagewrap::after gradient."""
    stops = [(0, .78), (280, .5), (420, .12), (500, 0), (1320, 0), (1440, .32), (1600, .42), (1920, .55)]
    pos = [s / 1920 for s, _ in stops]
    cols = [skia.Color(5, 8, 22, int(255 * a)) for _, a in stops]
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 1920)], cols, pos)
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Shader=sh))


def progress(c, u):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(W_, 0)], [col(TEAL), col(GREEN)])
    c.drawRect(skia.Rect(0, 0, W_ * min(max(u, 0), 1), 7), skia.Paint(Shader=sh))


def badge(c, text, a=1.0):
    f = skia.Font(BLACK, 30); f.setEdging(skia.Font.Edging.kAntiAlias)
    sp = 5.0
    w = sum(f.measureText(ch) + sp for ch in text) - sp
    x0 = (W_ - w) / 2 - 28; y0 = 92
    r = skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + w + 56, y0 + 56), 28, 28)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(8, 20, 40, int(160 * a))))
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col(TEAL, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=3))
    x = x0 + 28
    p = skia.Paint(AntiAlias=True, Color=col((225, 255, 250), 255 * a))
    for ch in text:
        c.drawString(ch, x, y0 + 39, f, p); x += f.measureText(ch) + sp


def rich_line(c, parts, cx, y, size, a=1.0, shadow=True):
    """parts: [(text, color)], centered at cx, baseline y."""
    f = skia.Font(BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias)
    track = -1.5 * size / 92
    widths = [f.measureText(t) + track * max(len(t) - 1, 0) for t, _ in parts]
    x = cx - sum(widths) / 2
    for (t, colr), w in zip(parts, widths):
        xx = x
        for ch in t:
            if shadow:
                for blur, dy, al in ((22, 3, .95), (8, 0, .8)):
                    c.drawString(ch, xx, y + dy, f, skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, int(255 * al * a * .75)),
                                                                MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur / 2.5)))
                c.drawString(ch, xx, y + 6, f, skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, int(102 * a))))
            c.drawString(ch, xx, y, f, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a)))
            xx += f.measureText(ch) + track
        x += w


def line_width(parts, size):
    f = skia.Font(BLACK, size)
    track = -1.5 * size / 92
    return sum(f.measureText(t) + track * max(len(t) - 1, 0) for t, _ in parts)


def title(c, lines, t, t_in, t_out, size=96):
    """lines: list of [(text, color)]; pops in after t_in (scale 0.9 -> 1), fades out by t_out. Auto fits 960 px."""
    if t < t_in or (t_out is not None and t > t_out):
        return
    widest = max(line_width(ln, size) for ln in lines)
    if widest > 960:
        size = size * 960 / widest
    a = smooth((t - t_in) / 0.18) * ((1 - smooth((t - (t_out - 0.14)) / 0.14)) if t_out is not None else 1)
    s = 0.9 + 0.1 * smooth((t - t_in) / 0.22)
    c.save()
    c.translate(W_ / 2, 300); c.scale(s, s); c.translate(-W_ / 2, -300)
    n = len(lines)
    y0 = 300 - (n - 1) * size * 0.52 + size * 0.36
    for i, ln in enumerate(lines):
        rich_line(c, ln, W_ / 2, y0 + i * size * 1.04, size, a)
    c.restore()


def watermark(c):
    f = skia.Font(BLACK, 32)
    c.drawString('levlprep.com', 56, 1404, f, skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, 150),
                                                          MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 3)))
    c.drawString('levlprep.com', 56, 1402, f, skia.Paint(AntiAlias=True, Color=col(TEAL, 225)))


def caption(c, words, cur, a=1.0, y=1480, hl=YELLOW):
    """words: list of display words in the current chunk; cur: index of the spoken word (or -1)."""
    if not words or a <= 0.01:
        return
    f = skia.Font(BLACK, 62); f.setEdging(skia.Font.Edging.kAntiAlias)
    gap = f.measureText(' ')
    ws = [f.measureText(w) for w in words]
    tw = sum(ws) + gap * (len(words) - 1)
    x0 = (W_ - tw) / 2
    box = skia.RRect.MakeRectXY(skia.Rect(x0 - 30, y - 56, x0 + tw + 30, y + 22), 24, 24)
    c.drawRRect(box, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(219 * a))))
    c.drawRRect(box, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(20 * a)), Style=skia.Paint.kStroke_Style, StrokeWidth=2))
    x = x0
    for i, (w, ww) in enumerate(zip(words, ws)):
        c.drawString(w, x, y, f, skia.Paint(AntiAlias=True, Color=col(hl if i == cur else WHITE, 255 * a)))
        x += ww + gap


def chip(c, text, x, y, color, size=40, a=1.0, scale=1.0, anchor=None):
    """Dark pill with a colored border and white text, centered at x, y. Optional leader line to anchor."""
    if a <= 0.01:
        return
    f = skia.Font(BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias)
    w = f.measureText(text)
    c.save(); c.translate(x, y); c.scale(scale, scale)
    if anchor is not None:
        ax, ay = anchor[0] - x, anchor[1] - y
        c.drawLine(0, 0, ax, ay, skia.Paint(AntiAlias=True, Color=col(color, 230 * a), StrokeWidth=4))
        c.drawCircle(ax, ay, 8, skia.Paint(AntiAlias=True, Color=col(color, 255 * a)))
    r = skia.RRect.MakeRectXY(skia.Rect(-w / 2 - 26, -size * 0.78, w / 2 + 26, size * 0.52), size * 0.65, size * 0.65)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(225 * a))))
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col(color, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=4))
    c.drawString(text, -w / 2, size * 0.18, f, skia.Paint(AntiAlias=True, Color=col(WHITE, 255 * a)))
    c.restore()


def end_card(c, snapshot, u, line_parts):
    """Blurred, darkened scene with the end line, 'Free practice on' and big levlprep.com."""
    if u <= 0:
        return
    a = smooth(u / 0.35)
    img = snapshot
    c.saveLayer(None, skia.Paint(Alphaf=a))
    c.drawImage(img, 0, 0, skia.SamplingOptions(), skia.Paint(ImageFilter=skia.ImageFilters.Blur(18, 18)))
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=skia.Color(5, 10, 26, 150)))
    y = 830
    for ln in line_parts:
        rich_line(c, ln, W_ / 2, y, 64, 1.0); y += 70
    f = skia.Font(BLACK, 50)
    t = 'Free practice on'; w = f.measureText(t)
    c.drawString(t, (W_ - w) / 2, y + 40, f, skia.Paint(AntiAlias=True, Color=col(TEAL)))
    f2 = skia.Font(BLACK, 120)
    t2 = 'levlprep.com'; w2 = f2.measureText(t2) - 2 * 11
    xx = (W_ - w2) / 2
    for ch in t2:
        c.drawString(ch, xx, y + 190, f2, skia.Paint(AntiAlias=True, Color=col(TEAL)))
        xx += f2.measureText(ch) - 2
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect((W_ - w2) / 2, y + 222, (W_ + w2) / 2, y + 232), 5, 5),
                skia.Paint(AntiAlias=True, Color=col(YELLOW)))
    c.restore()


def vignette(c, amount, t):
    """Tunnel vision: dark closing in from the edges, breathing a little."""
    if amount <= 0.005:
        return
    k = amount * (0.92 + 0.08 * math.sin(t * 2.6))
    r0 = 1150 * (1 - 0.62 * k)
    sh = skia.GradientShader.MakeRadial(skia.Point(W_ / 2, H_ * 0.47), 1250,
                                         [skia.Color(4, 6, 14, 0), skia.Color(4, 6, 14, 0), skia.Color(4, 6, 14, int(245 * min(1, k * 1.3)))],
                                         [0, r0 / 1250, 1])
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Shader=sh))
