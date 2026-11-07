"""Thumbnails v2 (Olivier 2026-11-05: "the thumbnail needs to improve"): the video's own best art big on the right as
stickers (Theo amazed at the giant drop, the drop with its molecules, the conversion board), the house layout on the left."""
import sys, math, numpy as np, skia
sys.path.insert(0, '/home/claude/lv')
import kit as K, mk as M, cast as CA, scenes as SC, tl, world as WD
import thumbs as T0
from PIL import Image
T = tl.build(); SC.Bt = dict(T['beats']); SC.Bt['__DUR'] = T['DUR']
YEL = T0.YEL


def theo_big(c, x, ground, s, mouth=0.75, look=0.6, neck=16):
    p = CA.theo()
    ps = CA.Pose(x=x, ground=ground, face=1, s=s, neck=neck, look=look, mouth=mouth, uarm_n=40, elbow_n=70, hand_n='flat', uarm_f=30, elbow_f=60)
    p.draw(c, ps)


def num(c, s, x, y, size, col=YEL):
    """big '1 × 10^22' style number with a dark outline"""
    for dx, dy in ((4, 6),):
        M.mdraw(c, s, x + dx, y + dy, size, T0.DEEP)
    M.mdraw(c, s, x, y, size, col)


CUPX, CUPY = 1385, 772


def a():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); T0.bg(c, 1450)
    T0.chrome(c, 'Units &', 'Sci Notation', 'count the molecules in 1 drop')
    T0.sticker(c, lambda c: SC.big_drop(c, 2.0, 1620, 450, 230, 1.0, n=50, glow_=0.6), 12)
    def theo_cup(c):   # Theo holds Maya's measuring cup up to the drop (reviewer: hands reached toward nothing)
        theo_big(c, 1170, 1180, 2.1)
        WD.medicine_cup(c, CUPX, CUPY, 0.7, 2.3, 1.0, marks=True)
    T0.sticker(c, theo_cup, 12)
    num(c, '10^{22}', 1500, 900, 180)
    T0.save(s, 'a2')


def b():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); T0.bg(c, 1450)
    T0.chrome(c, 'Units &', 'Sci Notation', 'never flip a factor again')

    def board(c):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1000, 150, 1820, 640), 40, 40), K.P((16, 22, 60)))
        M.qty(c, '2.45', 'km', 1060, 330, 92, 1.0, 1.0)
        M.mdraw(c, '×', 1405, 330, 92, K.CREAM)
        M.frac(c, ('1000', 'm'), ('1', 'km'), 1475, 310, 84, 1.0, sd=1.0)
        M.mdraw(c, '= 2450 m', 1140, 550, 110, YEL)
    T0.sticker(c, board, 10)
    T0.sticker(c, lambda c: theo_big(c, 1180, 1250, 1.7, mouth=0.0, look=0.4, neck=10), 12)
    T0.save(s, 'b2')


def c_():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); T0.bg(c, 1450)
    T0.chrome(c, 'Units &', 'Sci Notation', 'the 3 skills behind every answer')
    T0.sticker(c, lambda c: SC.big_drop(c, 2.0, 1480, 520, 280, 1.0, n=60, glow_=0.5), 12)
    T0.sticker(c, lambda c: SC.molecule(c, 1770, 210, 3.0), 10)
    num(c, '1.0 × 10^{22}', 1080, 960, 130)
    T0.save(s, 'c2')


a(); b(); c_()
print('thumbs v2 ok')
