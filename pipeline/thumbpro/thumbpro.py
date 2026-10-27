"""LevlPrep pro Shorts thumbnails (1080x1920). The 2026-10-26 standard (Olivier: "like a professional thumbnail maker").

Recipe, every Short:
  1. Background: the video's own clean scene plate, cropped to the story spot, blurred, darkened and colour graded
     toward the course colour, with a soft light burst behind the subject and a dark vignette at the edges.
  2. Subject: ONE hero cut out of the video's own art (isnet segmentation of a clean frame, or the rig rendered alone),
     scaled BIG (55 to 75 percent of the frame height), sharpened, with a thick white sticker outline, a coloured
     outer glow and a drop shadow. The subject overlaps the text a little, so the layers read as one picture.
  3. Words: 2 to 5, huge condensed caps (Anton), line 1 white, line 2 black on a tilted yellow box (or the accent),
     heavy dark outline and shadow, in the top third. Curiosity, never the answer.
  4. One graphic that points at the payoff: a red X stamp, a hand drawn arrow, a ring, a pain burst or a prop.
  5. Course pill at the very top, small LevlPrep mark bottom right; nothing important in the bottom 300 px.
  6. Check at feed size with preview() (180x320 and 360x640) and keep the clearest of 2 concepts.
Approved by Olivier 2026-10-26 (w1025 set: pipeline/thumbpro/w1025/make_w1025.py is the reference build).

Cutting out the hero:  python3 cut.py <frame.png> <x0,y0,x1,y1> <out.png>   (rembg isnet-general-use, keeps the largest
part and opens the mask so thin background slivers go; check the cutout on magenta before use). setup: bash setup_thumbpro.sh
"""
import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageEnhance

W, H = 1080, 1920
import os
_F = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')
ANTON = os.path.join(_F, 'Anton-Regular.ttf')
MONT = os.path.join(_F, 'Montserrat.ttf')
YELLOW = (255, 214, 10); RED = (255, 59, 48); WHITE = (255, 255, 255); INK = (10, 14, 28)
COURSE = {'NREMT': (63, 194, 169), 'ORGO': (156, 143, 224), 'A&P': (236, 132, 108), 'AP BIO': (140, 200, 110),
          'AP CHEM': (90, 130, 230), 'AP PHYSICS': (235, 165, 50), 'AP CALC': (232, 80, 122),
          'AP STATISTICS': (190, 120, 200), 'AP ENV SCI': (80, 190, 120)}


def font(path, size, weight=None):
    f = ImageFont.truetype(path, size)
    if weight:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def cover(img, focus=(0.5, 0.5), zoom=1.0):
    img = img.convert('RGB')
    s = max(W / img.width, H / img.height) * zoom
    img = img.resize((int(img.width * s + 0.5), int(img.height * s + 0.5)), Image.LANCZOS)
    x = int(np.clip(focus[0] * img.width - W / 2, 0, img.width - W)); y = int(np.clip(focus[1] * img.height - H / 2, 0, img.height - H))
    return img.crop((x, y, x + W, y + H))


def background(src, focus=(0.5, 0.5), zoom=1.0, blur=14, dark=0.55, tint=None, tint_amt=0.18, burst=(540, 900), burst_col=None):
    bg = cover(Image.open(src), focus, zoom).filter(ImageFilter.GaussianBlur(blur))
    bg = ImageEnhance.Color(bg).enhance(1.25)
    a = np.asarray(bg).astype(float) * dark
    if tint:
        a = a * (1 - tint_amt) + np.array(tint) * tint_amt * dark * 1.6
    yy, xx = np.mgrid[0:H, 0:W]
    if burst:
        d = np.hypot((xx - burst[0]) / 620, (yy - burst[1]) / 760)
        g = np.clip(1 - d, 0, 1) ** 1.6
        bc = np.array(burst_col or (255, 240, 200))
        a = a + g[..., None] * (bc * 0.55)
    v = np.hypot((xx - W / 2) / (W * 0.75), (yy - H * 0.45) / (H * 0.62))
    a = a * np.clip(1.15 - v ** 2 * 0.75, 0.25, 1)[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')


def subject(cut, height, sharpen=True, outline=14, glow=(255, 255, 255), glow_r=34, crop_bottom=None):
    im = Image.open(cut).convert('RGBA') if isinstance(cut, str) else cut
    im = im.crop(im.getbbox())
    if crop_bottom:
        im = im.crop((0, 0, im.width, int(im.height * crop_bottom)))
    s = height / im.height
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    if sharpen:
        rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(3, 90, 2)); rgb.putalpha(im.getchannel('A')); im = rgb
    a = im.getchannel('A').point(lambda v: 255 if v > 110 else 0).filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(ImageChops.multiply(im.getchannel('A'), a.point(lambda v: min(255, v * 2))))
    pad = outline + glow_r * 2 + 10
    big = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    alpha = Image.new('L', big.size, 0); alpha.paste(im.getchannel('A'), (pad, pad))
    ring = alpha.filter(ImageFilter.MaxFilter(outline * 2 + 1)) if outline else alpha
    out = Image.new('RGBA', big.size, (0, 0, 0, 0))
    sh = Image.new('RGBA', big.size, (0, 0, 0, 0)); sh.putalpha(ring.filter(ImageFilter.GaussianBlur(18)).point(lambda v: int(v * 0.7)))
    out.alpha_composite(sh, (14, 22))
    if glow:
        gl = Image.new('RGBA', big.size, glow + (0,)); gl.putalpha(ring.filter(ImageFilter.GaussianBlur(glow_r)).point(lambda v: min(255, int(v * 1.6))))
        out.alpha_composite(gl)
    if outline:
        wl = Image.new('RGBA', big.size, (255, 255, 255, 0)); wl.putalpha(ring.filter(ImageFilter.GaussianBlur(1)))
        out.alpha_composite(wl)
    out.alpha_composite(im, (pad, pad))
    return out, pad


def paste(canvas, layer, x, y):
    canvas.alpha_composite(layer, (int(x), int(y)))


def text_line(canvas, txt, cx, y, size, fill=WHITE, box=None, box_tilt=-2.5, stroke=None, maxw=1000, box_txt=INK, shadow=True):
    f = font(ANTON, size)
    while f.getlength(txt) > maxw and size > 60:
        size -= 6; f = font(ANTON, size)
    tw = f.getlength(txt); asc, desc = f.getmetrics()
    th = asc + desc
    layer = Image.new('RGBA', (W, th + 120), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    x = cx - tw / 2; ty = 40
    if box:
        bx = Image.new('RGBA', (int(tw + 70), int(asc * 0.98 + 44)), box + (255,))
        bx = bx.rotate(box_tilt, expand=True, resample=Image.BICUBIC)
        layer.alpha_composite(bx, (int(cx - bx.width / 2), int(ty + asc * 0.12 - (bx.height - asc * 0.98 - 44) / 2 - 22)))
        d.text((x, ty), txt, font=f, fill=box_txt)
    else:
        sw = stroke if stroke is not None else max(8, size // 11)
        if shadow:
            sl = Image.new('RGBA', layer.size, (0, 0, 0, 0)); ImageDraw.Draw(sl).text((x + 8, ty + 12), txt, font=f, fill=(0, 0, 0, 200), stroke_width=sw, stroke_fill=(0, 0, 0, 200))
            layer.alpha_composite(sl.filter(ImageFilter.GaussianBlur(6)))
        d.text((x, ty), txt, font=f, fill=fill, stroke_width=sw, stroke_fill=INK)
    canvas.alpha_composite(layer, (0, int(y - 40)))
    return asc


def pill(canvas, txt, color, y=70, size=40):
    f = font(MONT, size, 900); tw = f.getlength(txt)
    d = ImageDraw.Draw(canvas)
    x0 = W / 2 - tw / 2 - 30
    d.rounded_rectangle((x0, y, x0 + tw + 60, y + size + 30), radius=(size + 30) // 2, fill=INK + (235,), outline=color, width=5)
    d.text((W / 2 - tw / 2, y + 12), txt, font=f, fill=color)


def mark(canvas):
    f = font(MONT, 40, 900); d = ImageDraw.Draw(canvas)
    t1, t2 = 'Levl', 'Prep'; w1 = f.getlength(t1); w = w1 + f.getlength(t2)
    x, y = W - w - 60, H - 110
    d.rounded_rectangle((x - 22, y - 12, x + w + 22, y + 60), radius=18, fill=INK + (215,))
    d.text((x, y), t1, font=f, fill=(46, 230, 214)); d.text((x + w1, y), t2, font=f, fill=WHITE)


def x_stamp(canvas, cx, cy, r=110, col=RED):
    L = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    for (a, b) in (((-1, -1), (1, 1)), ((-1, 1), (1, -1))):
        d.line((cx + a[0] * r, cy + a[1] * r, cx + b[0] * r, cy + b[1] * r), fill=INK, width=int(r * 0.62))
    for (a, b) in (((-1, -1), (1, 1)), ((-1, 1), (1, -1))):
        d.line((cx + a[0] * r, cy + a[1] * r, cx + b[0] * r, cy + b[1] * r), fill=col, width=int(r * 0.42))
    sh = L.filter(ImageFilter.GaussianBlur(10)); sh = Image.composite(Image.new('RGBA', L.size, (0, 0, 0, 150)), Image.new('RGBA', L.size, (0, 0, 0, 0)), sh.getchannel('A'))
    canvas.alpha_composite(sh, (6, 10)); canvas.alpha_composite(L)


def arrow(canvas, p0, p1, bend=0.25, col=YELLOW, w=26):
    """Hand drawn curved arrow from p0 to p1 (tip at p1)."""
    L = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    (x0, y0), (x1, y1) = p0, p1
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2; nx, ny = -(y1 - y0), (x1 - x0)
    cx, cy = mx + nx * bend, my + ny * bend
    pts = [((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1) for t in np.linspace(0, 0.9, 40)]
    ang = math.atan2(y1 - pts[-1][1], x1 - pts[-1][0]); hl = w * 2.6
    head = [(x1, y1), (x1 - hl * math.cos(ang - 0.5), y1 - hl * math.sin(ang - 0.5)), (x1 - hl * math.cos(ang + 0.5), y1 - hl * math.sin(ang + 0.5))]
    for colr, ww, grow in ((INK, w + 16, 10), (col, w, 0)):
        d.line(pts, fill=colr, width=ww, joint='curve')
        for p in (pts[0],):
            d.ellipse((p[0] - ww / 2, p[1] - ww / 2, p[0] + ww / 2, p[1] + ww / 2), fill=colr)
        hh = [(x + (x - x1) * 0 + 0, y) for x, y in head]
        if grow:
            c = np.mean(head, axis=0); hh = [(c[0] + (x - c[0]) * 1.25, c[1] + (y - c[1]) * 1.25) for x, y in head]
        d.polygon(hh, fill=colr)
    canvas.alpha_composite(L)


def burst(canvas, cx, cy, r=120, col=RED):
    """Pain burst: glowing red core with jagged spikes."""
    L = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(g).ellipse((cx - r * 1.4, cy - r * 1.4, cx + r * 1.4, cy + r * 1.4), fill=col + (200,))
    canvas.alpha_composite(g.filter(ImageFilter.GaussianBlur(r * 0.45)))
    n = 12; pts = []
    for i in range(n * 2):
        a = i * math.pi / n; rr = r * (1.0 if i % 2 == 0 else 0.55)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=INK); pts2 = [(cx + (x - cx) * 0.82, cy + (y - cy) * 0.82) for x, y in pts]
    d.polygon(pts2, fill=col); d.ellipse((cx - r * 0.28, cy - r * 0.28, cx + r * 0.28, cy + r * 0.28), fill=(255, 230, 120))
    canvas.alpha_composite(L)


def ring(canvas, cx, cy, r, col=YELLOW, w=16):
    d = ImageDraw.Draw(canvas)
    d.ellipse((cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8), outline=INK, width=w + 14)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=col, width=w)


def top_shade(canvas, h=820, a=210):
    g = np.linspace(a, 0, h).astype(np.uint8)
    m = Image.fromarray(np.repeat(g[:, None], W, 1)); L = Image.new('RGBA', (W, h), INK + (0,)); L.putalpha(m)
    canvas.alpha_composite(L)


def save(canvas, path):
    canvas.convert('RGB').save(path, optimize=True)


def preview(paths, out):
    sm = [Image.open(p).convert('RGB') for p in paths]
    sheet = Image.new('RGB', (len(sm) * 560 + 40, 700), (24, 24, 24))
    for i, im in enumerate(sm):
        sheet.paste(im.resize((360, 640), Image.LANCZOS), (20 + i * 560, 30))
        sheet.paste(im.resize((180, 320), Image.LANCZOS), (380 + i * 560 + 0, 30))
    sheet.save(out, quality=88)
