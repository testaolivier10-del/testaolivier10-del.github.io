"""Three thumbnail concepts (video standard 9, 2026-11-05 rules): the video's own art big on the right as white outlined
stickers (Marco reacting, the starter jar with its tape marks), one big result, the house layout on the left (course
pill, two line title, a yellow handwritten scope line, levlprep.com), bottom right corner clear."""
import sys, numpy as np, skia
sys.path.insert(0, '/home/claude/lv')
import kit as K, mk as M, gr as G, bakery as B, marco as MC
from thumbs_p01 import bg, sticker, num, save, DEEP, YEL
import thumbs_p01 as TP
TP.ACC = (232, 96, 70)
PILL = 'AP CALCULUS AB  ·  SKILLS'


def marco(c, x, ground, s, **kw):
    ps = MC.pose(**kw); MC.draw(c, ps, x, ground, s)


def jar(c, x, base, s, lv, marks):
    B.jar(c, 0.0, lv, x=x, base=base, s=s, marks=marks, side=1)


def a():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    TP.chrome(c, 'Functions &', 'Exponents', 'not halfway!', PILL, 140)
    sticker(c, lambda c: marco(c, 1080, 2000, 1.5, look=(0.8, 0.2), head_yaw=0.3, worry=0.9, brow=0.7, smile=0.0, scream=0.25))
    sticker(c, lambda c: jar(c, 1430, 860, 1.6, 5.66, ((5.66, '5.7 cm', (30, 140, 90)),)))
    num(c, '4 → 5.7, not 6', 66, 880, 104)
    save(s, 'a')


def b():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    TP.chrome(c, 'Functions &', 'Exponents', 'the rules calculus runs on', PILL, 140)
    sticker(c, lambda c: marco(c, 1080, 2000, 1.5, look=(0.7, 0.4), head_yaw=0.25, smile=1.0))
    sticker(c, lambda c: jar(c, 1430, 860, 1.6, 8.0, ((8.0, 'double', (196, 64, 54)),)))
    num(c, '2^{1/2} ≈ 1.41', 66, 880, 130)
    save(s, 'b')


def c_():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    TP.chrome(c, 'Functions &', 'Exponents', 'before Unit 1: the toolkit', PILL, 140)
    sticker(c, lambda c: marco(c, 1080, 2000, 1.5, look=(0.6, 0.6), head_yaw=0.2, worry=0.3, brow=0.6, smile=0.2))
    sticker(c, lambda c: jar(c, 1430, 860, 1.6, 4.0, ((4.0, '4 cm', (40, 90, 190)), (2.0, '2 cm', (120, 110, 130)))))
    num(c, 'x^{−2} = ?', 66, 880, 140)
    save(s, 'c')


a(); b(); c_()
print('thumbs ok')
