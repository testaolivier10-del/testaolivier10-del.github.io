"""Three thumbnail concepts for NREMT 02 (video standard 9, 2026-11-05 rules): the video's own art big on the right as white
outlined stickers (Priya, the four step staircase, the aspirin bottle, the four faces), one big result, the house layout on
the left (course pill, two line title, a yellow handwritten scope line, levlprep.com), bottom right corner clear."""
import sys, math, numpy as np, skia
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import kit as K, mk as M, cast as CA, boards_a as A, story as ST
from PIL import Image
ACC, DEEP, MID = (63, 194, 169), (10, 18, 58), (28, 50, 128)
YEL = (255, 210, 63)
PILL = 'NREMT  ·  EMT CHAPTER 1'


def save(s, name):
    a = s.makeImageSnapshot().toarray()[:, :, :3][:, :, ::-1]
    Image.fromarray(np.ascontiguousarray(a)).resize((1280, 720), Image.LANCZOS).save(f'/home/claude/lv/out/thumb_{name}.png')


def bg(c, cx=1400):
    sh = skia.GradientShader.MakeRadial(skia.Point(cx, 540), 1300, [K.C(MID), K.C((18, 32, 92)), K.C(DEEP)], [0, 0.5, 1])
    c.drawRect(skia.Rect(0, 0, 1920, 1080), skia.Paint(Shader=sh))
    for x in range(0, 1920, 96): c.drawLine(x, 0, x, 1080, K.SP((110, 140, 230), 2, 22))
    for y in range(0, 1080, 96): c.drawLine(0, y, 1920, y, K.SP((110, 140, 230), 2, 22))


def chrome(c, l1, l2, scope, size=132):
    f = K.font('xb', 34); w = f.measureText(PILL)
    r = skia.RRect.MakeRectXY(skia.Rect(66, 66, 66 + w + 60, 132), 33, 33)
    c.drawRRect(r, K.P(DEEP, 220)); c.drawRRect(r, K.SP(ACC, 5)); c.drawString(PILL, 96, 111, f, K.P((214, 248, 240)))
    for i, (s, col) in enumerate(((l1, (255, 255, 255)), (l2, ACC))):
        ft = K.font('xb', size)
        c.drawString(s, 66, 320 + i * (size + 14) + 10, ft, K.P(DEEP)); c.drawString(s, 66, 320 + i * (size + 14), ft, K.P(col))
    K.hand(c, scope, 72, 640, 66, YEL, 1.0)
    c.drawString('levlprep.com', 70, 1010, K.font('xb', 46), K.P((236, 240, 255)))


def sticker(c, draw, pad=12):
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.DropShadow(0, 18, 14, 14, K.C((0, 0, 0), 150))))
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Dilate(pad, pad), ColorFilter=skia.ColorFilters.Blend(K.C((255, 255, 255)), skia.BlendMode.kSrcIn)))
    draw(c); c.restore(); draw(c); c.restore()


def num(c, s, x, y, size, col=YEL):
    M.mdraw(c, s, x + 4, y + 6, size, DEEP); M.mdraw(c, s, x, y, size, col)



def person(c, name, x, g, s, look=(-0.5, 0.2), worry=0.25, brow=0.3, smile=0.05, yaw=-0.3):
    ps = CA.idle(1.0, 0.4, look=look, smile=smile, yaw=yaw, worry=worry, brow=brow, sway=0)
    c.save(); c.clipRect(skia.Rect(0, 0, 1920, 1080)); ST.who(c, name, ps, x, g, s); c.restore()


def stairs(c, x, y, sc, lit=(1,)):
    A.staircase(c, x, y, sc, lit=lit, done=tuple(i for i in range(4) if i not in lit), labels=True)


def faces(c, x, y, r, gap):
    for i, n in enumerate(('ruiz', 'priya', 'marcus', 'joan')):
        cx = x + i * gap; cy = y - i * 46
        def inner(n=n, cx=cx, cy=cy):
            ps = CA.idle(1.0, 0.3 * i, look=(0, 0), smile=0.2, sway=0); ST.who(c, n, ps, cx, cy + r * 3.35, r / 150 * ST.SS(n) / CA.LOOKS[n]['hs'])
        ST.medallion(c, cx, cy, r, 255, ACC if i != 1 else YEL, (40, 60, 130), inner)


def a():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'EMS Provider', 'Levels', 'who can do what?', 118)
    sticker(c, lambda c: stairs(c, 800, 1010, 0.56, (1,)))
    sticker(c, lambda c: person(c, 'priya', 1560, 2000, 1.7))
    num(c, '4 levels', 66, 880, 120)
    save(s, 'a')


def b():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'EMT vs', 'Paramedic', 'four levels, one call', 126)
    sticker(c, lambda c: stairs(c, 930, 960, 0.94, (1,)), 10)
    num(c, 'who does what?', 66, 880, 100)
    save(s, 'b')


def c_():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'EMS Levels', 'Explained', 'four levels, one call', 118)
    sticker(c, lambda c: person(c, 'priya', 1500, 2000, 1.7, look=(-0.7, 0.6), worry=0.5, brow=0.5))
    sticker(c, lambda c: CA.bottle(c, (1080, 560), 3.4, -8, 'aspirin'), 10)
    num(c, 'give it, or ask first?', 66, 880, 74)
    save(s, 'c')


a(); b(); c_(); print('thumbs ok')
