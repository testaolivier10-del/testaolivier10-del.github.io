import sys, math
sys.path.insert(0, '/tmp/th')
from PIL import Image, ImageDraw, ImageFilter
import thumbpro as T

P = '/tmp/m/characters/flat/w1025/'
OUT = '/tmp/th/out/'
import os; os.makedirs(OUT, exist_ok=True)


def lift(v):
    c = T.background(P + 'a_bay_clean.jpg', focus=(0.62, 0.42), zoom=1.15, tint=T.COURSE['NREMT'], burst=(560, 1150), burst_col=(255, 120, 90))
    T.top_shade(c)
    s, pad = T.subject('/tmp/th/a0_isnet-general-use_k.png', 1180, glow=(255, 90, 70))
    sx, sy = 40 - pad, 640 - pad
    T.paste(c, s, sx, sy)
    bag, bp = T.subject(P + 'a_bag.png', 230, outline=10, glow=(255, 200, 120), glow_r=20)
    T.paste(c, bag, 640 - bp, 1500 - bp)
    # pain burst on the lumbar spine (cut is 404x617 at 1180 tall -> scale 1.912)
    k = 1180 / 617
    T.burst(c, sx + pad + 92 * k, sy + pad + 175 * k, r=118)
    T.arrow(c, (900, 980), (380, 990), bend=-0.22, w=24)
    if v == 'a':
        T.text_line(c, 'STOP LIFTING', 540, 205, 210)
        T.text_line(c, 'LIKE THIS', 540, 450, 200, box=T.YELLOW)
    else:
        T.text_line(c, 'THIS LIFT', 540, 205, 220)
        T.text_line(c, 'WRECKS BACKS', 540, 450, 190, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'EMT TRAPS #1', T.COURSE['NREMT'])
    T.mark(c)
    return c


def ball(c, cx, cy, r):
    L = Image.new('RGBA', c.size, (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    d.ellipse((cx - r - 14, cy - r - 14, cx + r + 14, cy + r + 14), fill=(255, 255, 255))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(236, 112, 38), outline=T.INK, width=8)
    w = max(6, r // 14)
    d.line((cx - r, cy, cx + r, cy), fill=T.INK, width=w); d.line((cx, cy - r, cx, cy + r), fill=T.INK, width=w)
    d.arc((cx - r * 1.6, cy - r, cx - r * 0.35, cy + r), -60, 60, fill=T.INK, width=w)
    d.arc((cx + r * 0.35, cy - r, cx + r * 1.6, cy + r), 120, 240, fill=T.INK, width=w)
    d.ellipse((cx - r * 0.55, cy - r * 0.7, cx - r * 0.1, cy - r * 0.35), fill=(255, 170, 110))
    sh = L.filter(ImageFilter.GaussianBlur(12)); g = Image.new('RGBA', c.size, (0, 0, 0, 0)); g.putalpha(sh.getchannel('A').point(lambda v: v // 2))
    c.alpha_composite(g, (8, 14)); c.alpha_composite(L)


def miss_row(c, y, n=5, size=150):
    gap = 22; x0 = 540 - (n * size + (n - 1) * gap) / 2
    d = ImageDraw.Draw(c)
    for i in range(n):
        x = x0 + i * (size + gap)
        d.rounded_rectangle((x - 6, y - 6, x + size + 6, y + size + 6), 28, fill=T.INK)
        d.rounded_rectangle((x, y, x + size, y + size), 24, fill=(40, 44, 60), outline=(255, 255, 255), width=6)
        T.x_stamp(c, x + size / 2, y + size / 2, r=size * 0.3)


def throw(v):
    c = T.background(P + 'b_court.jpg', focus=(0.55, 0.45), zoom=1.1, tint=(190, 120, 200), tint_amt=0.12, burst=(600, 1250), burst_col=(255, 190, 120))
    T.top_shade(c, 900, 220)
    s, pad = T.subject('/tmp/th/b1_isnet-general-use.png', 1180, glow=(255, 170, 80))
    GY = 860 if v == 'a' else 800
    T.paste(c, s, 120 - pad, GY - pad)
    k = 1180 / 572
    ball(c, 120 + (300) * k * 0.88 + 30, GY + 175 * k, 112)
    if v == 'a':
        T.text_line(c, '5 MISSES', 540, 160, 230)
        T.text_line(c, 'IS SHE DUE?', 540, 410, 190, box=T.YELLOW)
        miss_row(c, 690, size=130)
    else:
        miss_row(c, 170)
        T.text_line(c, 'NEXT ONE', 540, 360, 210)
        T.text_line(c, 'GOES IN?', 540, 590, 180, box=T.YELLOW)
    T.pill(c, 'AP STATISTICS', (240, 188, 235), y=60)
    T.mark(c)
    return c


def lake(v):
    c = T.background(P + 'c_bloom.jpg', focus=(0.5, 0.42), zoom=1.05, blur=4, tint=(90, 200, 60), tint_amt=0.12, dark=0.75, burst=(540, 1300), burst_col=(220, 255, 150))
    T.top_shade(c, 820, 225)
    s, pad = T.subject('/tmp/th/c1_cut_k.png', 780, glow=(255, 255, 255), glow_r=26)
    T.paste(c, s, 640 - pad, 700 - pad)
    f, fp = T.subject('/tmp/th/fert_cut.png', 380, outline=12, glow=(255, 255, 200), glow_r=24)
    T.paste(c, f, 120 - fp, 900 - fp)
    for (fn, x, y, h) in (('fish0', 50, 1330, 150), ('fish1', 560, 1390, 135), ('fish2', 300, 1500, 125), ('fish3', 790, 1520, 110)):
        fi, fq = T.subject('/tmp/th/' + fn + '.png', h, sharpen=False, outline=9, glow=(255, 80, 60), glow_r=22)
        T.paste(c, fi, x - fq, y - fq)
    T.arrow(c, (300, 1150), (320, 1320), bend=0.35, w=22, col=T.YELLOW)
    if v == 'a':
        T.text_line(c, 'HIS LAWN', 540, 190, 230)
        T.text_line(c, 'KILLED THESE FISH', 540, 440, 160, box=T.YELLOW)
    else:
        T.text_line(c, 'FERTILIZER', 540, 190, 220)
        T.text_line(c, '+ RAIN = ?', 540, 440, 200, box=T.YELLOW)
    T.pill(c, 'AP ENV SCI', T.COURSE['AP ENV SCI'])
    T.mark(c)
    return c


def rush(v):
    import numpy as np
    c = T.background(P + 'd_kitchen.jpg', focus=(0.4, 0.4), zoom=1.15, tint=T.COURSE['A&P'], tint_amt=0.1, burst=(560, 1050), burst_col=(255, 220, 170))
    s, pad = T.subject('/tmp/th/d0_cut_k.png', 1500, glow=(255, 255, 255), glow_r=28, crop_bottom=0.86)
    T.paste(c, s, 170 - pad, 760 - pad)
    # tunnel vision: dark blotches closing in from the edges
    yy, xx = np.mgrid[0:T.H, 0:T.W]
    d = np.hypot((xx - 640) / 600, (yy - 1080) / 760)
    a = (np.clip((d - 0.55) / 0.6, 0, 1) ** 1.3 * 245).astype(np.uint8)
    L = Image.new('RGBA', c.size, (4, 2, 10, 0)); L.putalpha(Image.fromarray(a))
    c.alpha_composite(L)
    # dizzy stars around his head
    dd = ImageDraw.Draw(c)
    for (x, y, r) in ((500, 760, 46), (900, 740, 40), (700, 660, 34)):
        pts = []
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * 0.45
            pts.append((x + rr * math.cos(ang), y + rr * math.sin(ang)))
        dd.polygon([(px + (px - x) * 0.25, py + (py - y) * 0.25) for px, py in pts], fill=T.INK)
        dd.polygon(pts, fill=T.YELLOW)
    T.top_shade(c, 700, 120)
    if v == 'a':
        T.text_line(c, 'STAND UP FAST', 540, 190, 200)
        T.text_line(c, 'EVERYTHING GOES BLACK?', 540, 420, 130, box=T.YELLOW, maxw=980)
    else:
        T.text_line(c, 'WHY YOUR VISION', 540, 190, 170)
        T.text_line(c, 'GOES DARK', 540, 410, 200, box=T.YELLOW)
    T.pill(c, 'A&P', T.COURSE['A&P'])
    T.mark(c)
    return c


JOBS = {'w1025-01-power-lift': lift, 'w1025-02-free-throw': throw, 'w1025-03-dead-zone': lake, 'w1025-04-head-rush': rush}
if __name__ == '__main__':
    paths = []
    for vid, fn in JOBS.items():
        for v in 'ab':
            p = f'{OUT}{vid}_{v}.png'; T.save(fn(v), p); paths.append(p)
    T.preview(paths[:4], OUT + 'prev1.jpg'); T.preview(paths[4:], OUT + 'prev2.jpg')
    print('done')
