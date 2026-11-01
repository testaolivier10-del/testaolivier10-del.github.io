"""Pro Shorts thumbnails for w1101 (video standard section 9, pipeline/thumbpro): the video's own clean scene as the
background, one big hero rendered alone from the build's own code (no cutout needed), Anton words, one graphic.
usage: python3 thumbs.py"""
import sys, importlib.util, math
sys.path[:0] = ['/home/claude/lp/w1101/lib', '/home/claude/lp/thumbpro', '/home/claude/short']
import numpy as np, skia
from PIL import Image
import thumbpro as tp
import layout as L

OUT = '/home/claude/lp/w1101/out'


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    nop = lambda *a, **k: None
    for f in ('fades', 'badge', 'title', 'watermark', 'chip'):
        setattr(m.L, f, nop)
    m.CAP.draw = nop; m.end_line = nop
    if hasattr(m, 'series'): m.series = nop
    return m


def clean(m, t, path):
    m.frame(t).makeImageSnapshot().save(path)
    return path


def hero(draw, w=1080, h=1920):
    s = skia.Surface(w, h); c = s.getCanvas(); c.clear(skia.Color(0, 0, 0, 0))
    draw(c)
    a = s.makeImageSnapshot().toarray()            # BGRA premultiplied
    rgba = a[..., [2, 1, 0, 3]].astype(float)
    al = rgba[..., 3:4] / 255.0
    rgba[..., :3] = np.where(al > 0, rgba[..., :3] / np.maximum(al, 1e-3), 0)
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')


def compose(bgsrc, hero_img, hero_h, hx, hy, l1, l2, course, col, path, focus=(0.5, 0.5), graphic=None, box=tp.YELLOW, box_txt=tp.INK, l2fill=None):
    cv = tp.background(bgsrc, focus=focus, tint=col, burst=(hx, hy), burst_col=(255, 236, 200))
    tp.top_shade(cv)
    sub, pad = tp.subject(hero_img, hero_h, glow=col)
    tp.paste(cv, sub, hx - sub.width / 2, hy - sub.height / 2)
    if graphic: graphic(cv)
    a = tp.text_line(cv, l1, 540, 190, 170)
    if l2fill:
        tp.text_line(cv, l2, 540, 190 + a + 20, 170, fill=l2fill)
    else:
        tp.text_line(cv, l2, 540, 190 + a + 30, 150, box=box, box_txt=box_txt)
    tp.pill(cv, course, col, y=60)
    tp.mark(cv)
    tp.save(cv, path)
    return path


def bomber():
    m = load('/home/claude/lp/w1101/bomber/build.py', 'bomber')
    import bomber as B
    k = 'w1101-01-bomber-holes'
    bg = clean(m, 12.0, f'{OUT}/{k}/clean_a.png')
    bg2 = clean(m, 3.0, f'{OUT}/{k}/clean_b.png')
    def top(c):
        B.top(c, 540, 960, 0.9, t=12, holes=dict(wings=1, tail=1, body=1), ring=dict(wings=1, tail=1, body=1), prop_spin=False)
    ha = hero(top)
    def ring_g(cv):
        tp.ring(cv, 540, 1180 - 262 * 0.66 - 90, 64)
    a = compose(bg, ha, 700, 540, 1180, 'WHERE DO YOU', 'ADD ARMOR?', 'AP STATISTICS', (240, 188, 235), f'{OUT}/{k}/thumb_a.png', graphic=ring_g)
    def side(c):
        B.side(c, 600, 960, 1.6, t=3, gear=True, holes=True, prop_k=0.0)
    hb = hero(side)
    b = compose(bg2, hb, 620, 560, 1180, 'SHOT FULL', 'OF HOLES', 'AP STATISTICS', (110, 36, 112), f'{OUT}/{k}/thumb_b.png', box=tp.RED, box_txt=tp.WHITE)
    return a, b


def guard():
    m = load('/home/claude/lp/w1101/guard/build.py', 'guard')
    k = 'w1101-02-guard-faint'
    bg = clean(m, 4.0, f'{OUT}/{k}/clean_a.png')
    def g(c):
        c.save(); c.translate(1080, 0); c.scale(-1, 1)
        m.draw_guard(c, m.guard_person(2.6), 560, 1500, 4.0, 0.0, ang=0.32, shadow=False)
        c.restore()
    ha = hero(g)
    def burst_g(cv):
        tp.burst(cv, 420, 820, 80, tp.RED)
    a = compose(bg, ha, 1050, 560, 1160, 'WHY SOLDIERS', 'FAINT', 'ANATOMY & PHYSIOLOGY', (236, 132, 108), f'{OUT}/{k}/thumb_a.png', graphic=burst_g, box=tp.RED, box_txt=tp.WHITE)
    def lensd(c):
        c.save(); pth = skia.Path(); pth.addCircle(540, 960, 330); c.clipPath(pth, skia.ClipOp.kIntersect, True)
        m.lens_content(c, 540, 960, 330, m.T['tighten'] + 0.3, 0.0); c.restore()
        c.drawCircle(540, 960, 330, m.SP((255, 241, 214), 12))
    hb = hero(lensd)
    b = compose(bg, hb, 760, 540, 1180, "DON'T STAND", 'TOO STILL', 'ANATOMY & PHYSIOLOGY', (236, 132, 108), f'{OUT}/{k}/thumb_b.png')
    return a, b


def calc():
    m = load('/home/claude/lp/w1101/calc/build.py', 'calc')
    k = 'w1101-03-speed-camera'
    bg = clean(m, 0.8, f'{OUT}/{k}/clean_a.png')
    def car(c):
        m.speedometer(c, 540, 960, 340, 75, glow=0.0)
        f = skia.Font(L.BLACK, 200); w = f.measureText('75')
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - w / 2 - 20, 1010, 540 + w / 2 + 20, 1230), 30, 30), m.P((24, 26, 48)))
        c.drawString('75', 540 - w / 2, 1195, f, m.P((255, 210, 63)))
    ha = hero(car)
    def x_g(cv):
        tp.ring(cv, 300, 1500, 80, col=tp.RED)
    a = compose(bg, ha, 760, 540, 1200, 'SLOW AT BOTH', 'STILL A TICKET', 'AP CALCULUS AB', (232, 80, 122), f'{OUT}/{k}/thumb_a.png', box=tp.RED, box_txt=tp.WHITE)
    def spd(c):
        m.speedometer(c, 540, 960, 330, 75, glow=1.0)
    hb = hero(spd)
    b = compose(bg, hb, 760, 540, 1180, 'MEAN VALUE', 'THEOREM', 'AP CALCULUS AB', (232, 80, 122), f'{OUT}/{k}/thumb_b.png')
    return a, b


def toads():
    m = load('/home/claude/lp/w1101/toads/build.py', 'toads')
    k = 'w1101-04-cane-toads'
    bg = clean(m, 1.5, f'{OUT}/{k}/clean_a.png')
    bg2 = clean(m, 34.0, f'{OUT}/{k}/clean_b.png')
    def td(c):
        m.toad(c, 560, 1180, 5.0, 1.0, shadow=False)
    ha = hero(td)
    a = compose(bg, ha, 640, 560, 1150, '100 TOADS', 'TOOK OVER', 'AP ENVIRONMENTAL SCIENCE', (120, 170, 80), f'{OUT}/{k}/thumb_a.png')
    def mp(c):
        c.save(); c.translate(0, 0)
        m.shot_d2.__globals__['L'].chip = lambda *a_, **k_: None
        m.shot_d2(c, m.T['invasive'] + 1.0)
        c.restore()
    hb = hero(mp)
    b = compose(bg2, ha, 640, 560, 1150, 'IT BACKFIRED', 'CANE TOADS', 'AP ENVIRONMENTAL SCIENCE', (120, 170, 80), f'{OUT}/{k}/thumb_b.png', box=tp.RED, box_txt=tp.WHITE)
    return a, b


if __name__ == '__main__':
    allp = []
    for f in sys.argv[1:] or ('bomber', 'guard', 'calc', 'toads'):
        allp += list(globals()[f]())
    tp.preview(allp, f'{OUT}/thumbs_preview.jpg')
    print('\n'.join(allp))
