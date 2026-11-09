"""Pro Shorts thumbnails for w1031-03-mirror-mint (video standard section 9): the video's own clean kitchen as the
background, heroes rendered alone from the same code (the carvone mirror pair with the sprig and the rye slice; the cook
smelling the mint), 2 concepts."""
import sys, math, os
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/lp/w1031r/mint', '/home/claude/short']
import skia, numpy as np
import thumbpro as T
import build as B, art as A, mol as M

OUT = '/home/claude/lp/w1031r/out/w1031-03-mirror-mint/thumbs/'
os.makedirs(OUT, exist_ok=True)


def png(draw, path, w=1080, h=1920, clear=True):
    s = skia.Surface(w, h); c = s.getCanvas()
    if clear: c.clear(skia.Color4f(0, 0, 0, 0))
    draw(c); s.makeImageSnapshot().save(path); return path


bg = png(lambda c: B.kitchen(c, 1.3, 1.1, 600, 980, wisps=False), OUT + 'bg.png', clear=False)


def pair_hero(c):
    t = 1.0
    pr = B.proj(B.BASE, 340, 560, 112); ps = pr.copy(); ps[:, 0] = 1400 - ps[:, 0]
    M.draw(c, pr, 120, 1.0, A.G, 0.9); M.draw(c, ps, 120, 1.0, A.AMB, 0.9)
    A.sprig(c, 330, 1390, -8, t, 1.55)
    A.slice_(c, 1060, 1360, 6, 2.1, lying=False)
    for j in range(16):
        y = 240 + j * 70
        c.drawLine(700, y, 700, y + 34, skia.Paint(Color=skia.Color(255, 255, 255), StrokeWidth=10, AntiAlias=True))


hero1 = png(pair_hero, OUT + 'hero_pair.png', 1400, 1400)


def cook_hero(c):
    c.save(); c.translate(-80, -380); c.scale(1.5, 1.5)
    kw = B.cook_state(1.2)[0]
    ps = A.draw_cook(c, kw)
    p, d = A.held(kw, 'n'); A.sprig(c, p[0], p[1], -15, 1.2, 0.85, glow=0.6); A.hand_over(c, ps, 'n')
    c.restore()
    c.save(); c.clipRect(skia.Rect(0, 0, 1400, 1180)); c.restore()


hero2 = png(cook_hero, OUT + 'hero_cook.png', 1400, 1400)
ORGO = T.COURSE['ORGO']


def con_a():
    c = T.background(bg, focus=(0.5, 0.45), zoom=1.2, blur=14, tint=ORGO, dark=0.55, burst=(540, 1100), burst_col=(255, 240, 200))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero1, 1000, glow=(255, 255, 255), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1660 - s.height + p)
    T.text_line(c, 'SAME MOLECULE', 540, 190, 170)
    T.text_line(c, 'MINT OR RYE?', 540, 430, 180, box=T.YELLOW)
    T.pill(c, 'ORGANIC CHEMISTRY', ORGO); T.mark(c); return c


def con_b():
    c = T.background(bg, focus=(0.45, 0.45), zoom=1.3, blur=14, tint=ORGO, dark=0.55, burst=(500, 1100), burst_col=(200, 255, 210))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero2, 1150, glow=(200, 255, 210), glow_r=30, crop_bottom=0.86)
    T.paste(c, s, 500 - s.width / 2, 1700 - s.height + p)
    T.text_line(c, 'MIRROR IMAGE', 540, 190, 190)
    T.text_line(c, 'NEW SMELL', 540, 430, 200, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'ORGANIC CHEMISTRY', ORGO); T.mark(c); return c


ps = []
for name, fn in (('thumb_a', con_a), ('thumb_b', con_b)):
    p = OUT + name + '.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
