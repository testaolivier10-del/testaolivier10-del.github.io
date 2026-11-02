"""Pro Shorts thumbnails for w1031 (video standard section 9, pipeline/thumbpro): the video's own clean scene as the
background, one big hero rendered alone from the build's own code (no cutout needed), Anton words, one graphic.
usage: python3 thumbs.py"""
import sys, importlib.util, math
sys.path[:0] = ['/home/claude/lp/w1031/lib', '/home/claude/lp/thumbpro', '/home/claude/short']
import numpy as np, skia
from PIL import Image
import thumbpro as tp
import layout as L

OUT = '/home/claude/lp/w1031/out'


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


def gage():
    m = load('/home/claude/lp/w1031/gage/build.py', 'gage')
    bg = clean(m, 2.0, f'{OUT}/w1031-02-phineas-gage/clean_a.png')
    bg2 = clean(m, 10.5, f'{OUT}/w1031-02-phineas-gage/clean_b.png')
    # A: the x-ray head (lib/skull.py) with the iron through it, point out of the top
    def headcut(c):
        import skull as SKL
        SKL.draw_xray(c, m.HC[0], m.HC[1], m.HS, 11.0, 0.7, 1.0, SKL.rod_dir()[2] + 180)
    ha = hero(headcut)
    def burst_g(cv):
        tp.burst(cv, 470, 1240, 90, tp.RED)
    a = compose(bg, ha, 1180, 560, 1150, 'IRON ROD', 'THROUGH HIS SKULL', 'AP PSYCHOLOGY', (230, 120, 90), f'{OUT}/w1031-02-phineas-gage/thumb_a.png')
    # B: Gage tamping, the iron upright, a ring on the spark
    def gage_fig(c):
        m.gage_tamping(c, 0.3, 0.0)
    hb = hero(gage_fig)
    def ring_g(cv):
        tp.ring(cv, 330, 1640, 90)
    b = compose(bg, hb, 1250, 600, 1190, 'HE LIVED', 'PHINEAS GAGE', 'AP PSYCHOLOGY', (230, 120, 90), f'{OUT}/w1031-02-phineas-gage/thumb_b.png')
    return a, b


def cold():
    m = load('/home/claude/lp/w1031/cold/build.py', 'cold')
    bg = clean(m, 2.0, f'{OUT}/w1031-01-cold-heart/clean_a.png')
    def grp(c):
        import ctchars as tchars
        tchars.draw_ice(c, 2.0, 0, 200, 0.85, lift_px=0, lean=0.0)
    ha = hero(grp)
    def pulse(cv):
        from PIL import ImageDraw
        d = ImageDraw.Draw(cv); pts = []
        for i in range(60):
            x = 140 + i * 13.5; y = 1560 + 70 * math.sin(i * 1.7) * math.sin(i * 0.53)
            pts.append((x, y))
        d.line(pts, fill=(255, 70, 70), width=16, joint='curve')
    a = compose(bg, ha, 760, 540, 1150, 'ONE ROUGH LIFT', 'CAN STOP HIS HEART', 'NREMT  EMT TRAPS #2', (63, 194, 169), f'{OUT}/w1031-01-cold-heart/thumb_a.png', graphic=pulse, box=tp.RED, box_txt=tp.WHITE)
    def hrt(c):
        import heart as HT
        HT.draw_heart(c, 540, 1000, 2.6, 3.0, 0.0, 0.0)
    hb = hero(hrt)
    b = compose(bg, hb, 1050, 540, 1150, 'TOO COLD', 'HANDLE GENTLY', 'NREMT  EMT TRAPS #2', (63, 194, 169), f'{OUT}/w1031-01-cold-heart/thumb_b.png', graphic=pulse)
    return a, b


def mint():
    m = load('/home/claude/lp/w1031/mint/build.py', 'mint')
    bg = clean(m, 1.0, f'{OUT}/w1031-03-mirror-mint/clean_a.png')
    def pair(c):
        m.mol(c, 300, 960, 90, glow=None)
        m.mol(c, 780, 960, 90, mirror=True, glow=None)
    ha = hero(pair)
    def arrow_g(cv):
        tp.arrow(cv, (330, 1560), (760, 1560), bend=-0.35)
    a = compose(bg, ha, 760, 540, 1150, 'MINT OR RYE?', 'SAME MOLECULE', 'ORGANIC CHEMISTRY', (156, 143, 224), f'{OUT}/w1031-03-mirror-mint/thumb_a.png', graphic=arrow_g)
    def sprig(c):
        c.save(); c.translate(240, -260); c.scale(1.6, 1.6)
        m.mint_glass(c, 1.0)
        c.restore()
    hb = hero(sprig)
    b = compose(bg, hb, 1150, 540, 1200, 'MIRROR IMAGE', 'MOLECULES', 'ORGANIC CHEMISTRY', (156, 143, 224), f'{OUT}/w1031-03-mirror-mint/thumb_b.png')
    return a, b


if __name__ == '__main__':
    allp = []
    for f in sys.argv[1:] or ('gage', 'cold', 'mint'):
        allp += list(globals()[f]())
    tp.preview(allp, f'{OUT}/thumbs_preview.jpg')
    print('\n'.join(allp))
