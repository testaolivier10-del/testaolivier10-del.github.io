"""Pro Shorts thumbnail for w1108-01 (video standard section 9): the video's own clean scene behind, a hero rendered
alone from the same code, 2 concepts; the clearest becomes thumb.png."""
import sys
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/w1108/01']
import skia, shutil
import thumbpro as T
import build as B

OUT = '/home/claude/w1108/01/thumbs/'
PC = (60, 170, 100)     # AP Precalculus forest green, lifted for video


def scene_png(t, path):
    s = skia.Surface(1080, 1920); c = s.getCanvas(); B.scene(c, t); s.makeImageSnapshot().save(path); return path


def hero_png(draw, path, w=1400, h=1400):
    s = skia.Surface(w, h); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0)); draw(c); s.makeImageSnapshot().save(path); return path


def hero_choice(c):
    c.save(); c.translate(700, 700); c.scale(2.4, 2.4); c.translate(-560, -1250)
    B.briefcase(c, 480, 1300)
    B.draw_penny(c, 680, 1306, 3.0, 1.0, 1.0)
    f = skia.Font(skia.Typeface('DejaVu Sans', skia.FontStyle.Bold()), 34)
    c.drawString('1¢', 662, 1296, f, skia.Paint(AntiAlias=True, Color=skia.Color(150, 78, 40)))
    c.restore()


def hero_penny(c):
    c.save(); c.translate(700, 760); c.scale(5.0, 5.0)
    B.draw_penny(c, 0, 40, 4.6, 1.0, 1.0)
    c.restore()


bg_k = scene_png(B.T_SHE + 0.9, OUT + 'bg_kitchen.png')
bg_w = scene_png(B.T_MILLION3 + 0.4, OUT + 'bg_warehouse.png')
h1 = hero_png(hero_choice, OUT + 'hero_choice.png')
h2 = hero_png(hero_penny, OUT + 'hero_penny.png')


def a():
    c = T.background(bg_k, focus=(0.5, 0.62), zoom=1.3, blur=12, tint=PC, dark=0.5, burst=(540, 1150), burst_col=(255, 230, 160))
    T.top_shade(c, 820, 225)
    s, p = T.subject(h1, 560, glow=(255, 225, 150), glow_r=32)
    T.paste(c, s, 540 - s.width / 2, 1500 - s.height + p)
    T.text_line(c, 'ONE PENNY', 540, 190, 220)
    T.text_line(c, 'OR $1,000,000?', 540, 440, 150, box=T.YELLOW)
    T.pill(c, 'AP PRECALCULUS', PC); T.mark(c); return c


def b():
    c = T.background(bg_w, focus=(0.5, 0.5), zoom=1.05, blur=10, tint=PC, dark=0.5, burst=(540, 1200), burst_col=(255, 220, 140))
    T.top_shade(c, 820, 225)
    s, p = T.subject(h2, 700, glow=(255, 210, 140), glow_r=34)
    T.paste(c, s, 540 - s.width / 2, 1620 - s.height + p)
    T.arrow(c, (880, 700), (700, 1050), bend=-0.3, col=T.YELLOW)
    T.text_line(c, 'DOUBLE IT', 540, 190, 230)
    T.text_line(c, 'FOR 30 DAYS', 540, 440, 170, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'AP PRECALCULUS', PC); T.mark(c); return c


ps = []
for n, fn in (('a', a), ('b', b)):
    p = OUT + f'thumb_{n}.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
