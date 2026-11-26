"""Three thumbnail concepts (video standard 9, 2026-11-05 rules): the video's own art big on the right as white outlined
stickers (Ines, the orbitals, the diamond and graphite insets), one big result, the house layout on the left (course pill,
two line title, a yellow handwritten scope line, levlprep.com), bottom right corner clear."""
import sys, math, numpy as np, skia
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import kit as K, mk as M, cast as CA, orb as O, lattice as LT
from PIL import Image
ACC, DEEP, MID = (161, 143, 255), (10, 18, 58), (28, 50, 128)
YEL = (255, 210, 63)
PILL = 'ORGANIC CHEMISTRY  ·  BONDING'


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
    c.drawRRect(r, K.P(DEEP, 220)); c.drawRRect(r, K.SP(ACC, 5)); c.drawString(PILL, 96, 111, f, K.P((226, 220, 255)))
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


def ines(c, x, g, s, mood='curious', look=(0.6, -0.2), goggles=0.0, ref=None, who='ines'):
    ps = CA.idle(1.0, 0.4, look=look); ps.cfg = CA.LOOKS[who]['cfg']; CA.face(ps, mood); ps.look = look; ps.goggles = goggles; ps.sway = 0; ps.head_tilt = 3
    if ref: ps.gog_ref = ref
    c.save(); c.clipRect(skia.Rect(0, 0, 1920, 1080)); CA.draw(c, who, ps, x, g, s); c.restore()


def chips(c, x, y, size=120):
    for i, k in enumerate(('sp3', 'sp2', 'sp')): O.hyb_chip(c, k, x + i * size * 2.35, y, size)


def a():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'Hybridization', 'explained', 'why 4 bonds?', 118)
    sticker(c, lambda c: O.tetra(c, 1150, 640, 210, 0.55, atoms=None))
    sticker(c, lambda c: ines(c, 1560, 2060, 1.75, 'curious', (-0.7, 0.3)))
    chips(c, 150, 880, 96)
    save(s, 'a')


def b():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'Hybridization', 'sp³ sp² sp', 'pencil vs diamond: same atom', 118)
    sticker(c, lambda c: LT.graphite(c, 2.0, 1250, 330, 250, 1.0, sheets=1.0, p=0.0, slide=0.3), 10)
    sticker(c, lambda c: LT.diamond(c, 2.0, 1600, 700, 270, 1.0, 1.0), 10)
    num(c, 'both pure carbon', 66, 880, 104)
    save(s, 'b')


def c_():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'sp³, sp², sp', 'in 15 minutes', 'count the groups', 118)
    def orbs(c):
        import math
        for d in O.TRI:
            dx, dy, z = O.proj(d, 0.4, 0.5, 190); O.hyb(c, 1150, 640, math.hypot(dx, dy), math.atan2(dy, dx), O.SP2)
        O.p_orb(c, 1150, 640, 150, -math.pi / 2)
    sticker(c, orbs)
    sticker(c, lambda c: ines(c, 1560, 2060, 1.75, 'focused', (0.5, 0.2), 1.0, ((255, 196, 96), 0.9)))
    num(c, '4 groups = sp³', 66, 880, 104) if False else chips(c, 150, 880, 96)
    save(s, 'c')


a(); b(); c_(); print('thumbs ok')
