"""Pro Shorts thumbnail for w1108-02 (video standard section 9): the video's own clean scene blurred as background,
a hero rendered alone from the same code, 2 concepts; keep the clearest."""
import sys, math
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/w1108/02']
import skia
import thumbpro as T
import build as B, airman2 as A2
OUT = '/home/claude/w1108/02/thumbs/'


def scene_png(fn, t, path):
    s = skia.Surface(1080, 1920); c = s.getCanvas(); fn(c, t); s.makeImageSnapshot().save(path); return path


def hero_png(draw, path, w=1400, h=1400):
    s = skia.Surface(w, h); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0)); draw(c); s.makeImageSnapshot().save(path); return path


def collapsed(c):
    c.save(); c.translate(700, 760); c.scale(2.3, 2.3); c.translate(-420, -1180)
    kw = B.runner_lying_kw(5.0); kw.update(blink=True)
    B.draw_hip(c, B.RUN_S, kw, (486, 1179), -90, shadow_len=0)
    B.shimmer_up(c, 280, 600, 1130, 2.0, 1.0, h=200)
    c.restore()


def tub(c):
    c.save(); c.translate(700, 760); c.scale(1.9, 1.9); c.translate(-580, -1150)
    B.tub_back(c, 1.0); B.water_top(c, 1.0, 0.0)
    kw = B.runner_tub_kw(30, 1.0, 1.0)
    cl = skia.Path(); cl.addRect(skia.Rect(-600, -400, 1700, B.WL + 4))
    c.save(); c.clipPath(cl, doAntiAlias=True); B.draw_hip(c, B.RUN_S, kw, B.HIP_IN, B.ROT_IN); c.restore()
    B.tub_front(c, 1.0)
    c.restore()


bg = scene_png(B.shot_a, 7.0, OUT + 'bg_street.png')
bg2 = scene_png(B.shot_e, 27.0, OUT + 'bg_tub.png')
h1 = hero_png(collapsed, OUT + 'hero_runner.png')
h2 = hero_png(tub, OUT + 'hero_tub.png')
COL = T.COURSE['NREMT']


def con_a():
    c = T.background(bg, focus=(0.4, 0.55), zoom=1.2, blur=12, tint=(255, 120, 60), dark=0.5, burst=(540, 1150), burst_col=(255, 200, 120))
    T.top_shade(c, 820, 225)
    s, p = T.subject(h1, 500, glow=(255, 170, 90), glow_r=32)
    T.paste(c, s, 540 - s.width / 2, 1500 - s.height + p)
    T.burst(c, 300, 1220, r=90)
    T.text_line(c, '107°F', 540, 200, 240)
    T.text_line(c, 'AT THE FINISH', 540, 450, 160, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'NREMT  EMT TRAPS #3', COL); T.mark(c); return c


def con_b():
    c = T.background(bg2, focus=(0.5, 0.55), zoom=1.1, blur=14, tint=COL, dark=0.55, burst=(540, 1150), burst_col=(200, 240, 255))
    T.top_shade(c, 820, 225)
    s, p = T.subject(h2, 560, glow=(200, 240, 255), glow_r=32)
    T.paste(c, s, 540 - s.width / 2, 1480 - s.height + p)
    T.arrow(c, (900, 640), (640, 1000), bend=-0.3, col=T.YELLOW)
    T.text_line(c, 'HEAT STROKE', 540, 200, 200)
    T.text_line(c, 'NOT THE ER YET?', 540, 440, 150, box=T.YELLOW)
    T.pill(c, 'NREMT  EMT TRAPS #3', COL); T.mark(c); return c


ps = []
for name, fn in (('a', con_a), ('b', con_b)):
    p = OUT + f'thumb_{name}.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
