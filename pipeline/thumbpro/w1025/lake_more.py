import sys, math, numpy as np
sys.path.insert(0, '/tmp/th')
from PIL import Image, ImageDraw, ImageFilter
import thumbpro as T, make_w1025 as M
P = M.P; O = '/tmp/th/out/'

def live_fish(i, h, flip=False):
    im = Image.open(f'/tmp/th/fish{i}.png').convert('RGBA'); a = np.array(im)
    rgb = a[..., :3].astype(int)
    import cv2
    inner = cv2.erode((a[..., 3] > 200).astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
    dark = (rgb.sum(-1) < 250) & inner          # the X eye
    dk = cv2.dilate(dark.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    dark = dk & (a[..., 3] > 200)
    ys, xs = np.where(dark)
    body = np.median(a[(a[..., 3] > 200) & ~dark][:, :3], axis=0).astype(np.uint8)
    a[dark, :3] = body
    im = Image.fromarray(a); d = ImageDraw.Draw(im)
    cx, cy = xs.mean(), ys.mean(); r = max(14, (xs.max() - xs.min()) * 0.7)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255)); d.ellipse((cx - r * 0.5, cy - r * 0.5, cx + r * 0.5, cy + r * 0.5), fill=(15, 15, 25))
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return T.subject(im, h, sharpen=False, outline=8, glow=(120, 220, 255), glow_r=18)

def dead(c, items, glow=(255, 80, 60)):
    for (fn, x, y, h) in items:
        fi, fq = T.subject('/tmp/th/' + fn + '.png', h, sharpen=False, outline=9, glow=glow, glow_r=22)
        T.paste(c, fi, x - fq, y - fq)

def split():
    top = T.background(P + 'c_lake.jpg', focus=(0.5, 0.45), zoom=1.05, blur=3, dark=0.85, burst=None)
    bot = T.background(P + 'c_bloom.jpg', focus=(0.5, 0.45), zoom=1.05, blur=3, dark=0.7, tint=(90, 200, 60), tint_amt=0.15, burst=None)
    m = Image.new('L', (T.W, T.H), 0); d = ImageDraw.Draw(m)
    zig = [(0, 1120)] + [(x, 1120 - 60 * math.sin(x / 70) - (x / 1080) * 120) for x in range(0, 1081, 30)] + [(1080, T.H), (0, T.H)]
    d.polygon(zig, fill=255)
    c = Image.composite(bot, top, m)
    ln = Image.new('RGBA', c.size, (0, 0, 0, 0)); ImageDraw.Draw(ln).line(zig[1:-2], fill=(255, 255, 255, 255), width=16)
    c.alpha_composite(ln)
    T.top_shade(c, 760, 220)
    for (i, x, y, h, f) in ((1, 140, 900, 120, False), (2, 560, 980, 110, True), (3, 830, 860, 100, False)):
        s, p = live_fish(i, h, f); T.paste(c, s, x - p, y - p)
    dead(c, (('fish0', 80, 1330, 140), ('fish1', 580, 1380, 130), ('fish2', 320, 1500, 115)))
    def chip(txt, y, col):
        f = T.font(T.MONT, 48, 900); w = f.getlength(txt); dd = ImageDraw.Draw(c)
        dd.rounded_rectangle((60, y, 60 + w + 50, y + 80), 20, fill=T.INK + (230,), outline=col, width=5); dd.text((85, y + 12), txt, font=f, fill=col)
    chip('BEFORE', 720, (120, 220, 255)); chip('AFTER ONE STORM', 1190, (255, 110, 90))
    T.text_line(c, 'SAME LAKE', 540, 190, 240)
    T.text_line(c, 'ONE BAG LATER', 540, 440, 180, box=T.YELLOW)
    T.pill(c, 'AP ENV SCI', T.COURSE['AP ENV SCI']); T.mark(c); return c

def bag():
    c = T.background(P + 'c_bloom.jpg', focus=(0.5, 0.5), zoom=1.15, blur=6, tint=(90, 200, 60), tint_amt=0.18, dark=0.62, burst=(560, 1000), burst_col=(230, 255, 160))
    T.top_shade(c, 800, 225)
    b, bp = T.subject('/tmp/th/fert_cut.png', 860, outline=16, glow=(160, 255, 120), glow_r=30)
    b = b.rotate(-18, expand=True, resample=Image.BICUBIC)
    T.paste(c, b, 520 - b.width / 2, 1000 - b.height / 2)
    rng = np.random.default_rng(3); d = ImageDraw.Draw(c)
    for _ in range(70):   # granules pouring out of the bag mouth toward the water
        x = 700 + rng.normal(0, 60) + rng.uniform(0, 160); y = 1150 + rng.uniform(0, 330)
        r = rng.uniform(6, 12); d.ellipse((x - r - 3, y - r - 3, x + r + 3, y + r + 3), fill=T.INK); d.ellipse((x - r, y - r, x + r, y + r), fill=(240, 240, 230))
    dead(c, (('fish0', 60, 1420, 140), ('fish3', 640, 1480, 120), ('fish2', 330, 1540, 110)))
    T.text_line(c, 'THIS BAG', 540, 190, 240)
    T.text_line(c, 'KILLED A LAKE', 540, 440, 180, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'AP ENV SCI', T.COURSE['AP ENV SCI']); T.mark(c); return c

def hedid():
    c = T.background(P + 'c_bloom.jpg', focus=(0.62, 0.45), zoom=1.1, blur=4, tint=(90, 200, 60), tint_amt=0.15, dark=0.7, burst=(330, 1000), burst_col=(255, 245, 210))
    T.top_shade(c, 780, 225)
    s, pad = T.subject('/tmp/th/c1_cut_k.png', 1500, glow=(255, 255, 255), glow_r=30, crop_bottom=0.78)
    T.paste(c, s, -60 - pad, 680 - pad)
    dead(c, (('fish0', 560, 1180, 150), ('fish1', 690, 1360, 130), ('fish3', 600, 1520, 110)))
    T.arrow(c, (560, 760), (720, 1100), bend=-0.35, w=26)
    T.text_line(c, 'HE DID THIS', 540, 190, 240)
    T.text_line(c, 'WITHOUT KNOWING', 540, 440, 165, box=T.YELLOW)
    T.pill(c, 'AP ENV SCI', T.COURSE['AP ENV SCI']); T.mark(c); return c

ps = []
for n, fn in (('split', split), ('bag', bag), ('hedid', hedid)):
    p = O + f'lake_{n}.png'; T.save(fn(), p); ps.append(p)
T.preview([O + 'w1025-03-dead-zone_a.png'] + ps, O + 'lake_prev.jpg'); print('ok')
