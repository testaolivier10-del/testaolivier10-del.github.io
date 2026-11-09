"""Pro Shorts thumbnail for w1108-04 (video standard section 9): the video's own clean scene as background, the man
rendered alone from the same code as the hero, 2 concepts."""
import sys, os, math
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/w1108/04']
import skia
import thumbpro as T
import build as B
import airman2 as A2

OUT = '/home/claude/w1108/out/w1108-04-zeno-paradox/thumbs/'
os.makedirs(OUT, exist_ok=True)
VIO = (160, 112, 224)


def scene_png(t, path):
    s = skia.Surface(1080, 1920); c = s.getCanvas(); B.scene(c, t)
    s.makeImageSnapshot().save(path); return path


def hero_png(t, path, reach=False):
    s = skia.Surface(1400, 1400); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0))
    ps = B.man_pose(t)
    big = B.PP.Person(1.0, palette=B.MAN.pal, cap=False, trouser=B.MAN.trouser)
    q = A2.Pose(**dict(ps.__dict__, x=600, ground=1340))
    big.draw(c, q, light=B.LIGHT)
    s.makeImageSnapshot().save(path); return path


bg = scene_png(B.T_HALVES + 1.2, OUT + 'bg.png')
bg2 = scene_png(B.T_EACH + 3.0, OUT + 'bg2.png')
hero = hero_png(B.T_P1 + 0.3, OUT + 'hero.png')


def door_png(path):
    s = skia.Surface(1400, 1400); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0))
    c.save(); c.translate(700 - (B.DOOR_X0 + B.DOOR_X1) / 2 * 3.0, 1360 - B.GROUND * 3.0); c.scale(3.0, 3.0)
    c.clipRect(skia.Rect(B.DOOR_X0 - 20, B.DOOR_TOP - 30, B.DOOR_X1 + 20, B.GROUND + 2))
    B.wall_and_door(c, 0.0)
    c.restore(); s.makeImageSnapshot().save(path); return path


door = door_png(OUT + 'door.png')


def a():
    c = T.background(bg, focus=(0.62, 0.6), zoom=1.0, blur=5, tint=VIO, dark=0.3, burst=(700, 1150), burst_col=(255, 220, 160))
    T.top_shade(c, 820, 225)
    T.text_line(c, 'HE NEVER', 540, 190, 210)
    T.text_line(c, 'REACHES THE DOOR?', 540, 430, 130, box=T.YELLOW)
    d, dp = T.subject(door, 820, glow=(255, 214, 150), glow_r=24)
    T.paste(c, d, 850 - d.width / 2, 1640 - d.height + dp)
    s, p = T.subject(hero, 1000, glow=(255, 214, 150), glow_r=30)
    T.paste(c, s, 280 - s.width / 2, 1720 - s.height + p)
    T.arrow(c, (430, 1330), (700, 1260), bend=0.3)
    T.pill(c, 'AP CALC BC', VIO); T.mark(c); return c


def b():
    c = T.background(bg, focus=(0.62, 0.6), zoom=1.0, blur=6, tint=VIO, dark=0.35, burst=(720, 1100), burst_col=(255, 230, 180))
    T.top_shade(c, 820, 225)
    d, dp = T.subject(door, 760, glow=(255, 255, 255), glow_r=24)
    T.paste(c, d, 860 - d.width / 2, 1600 - d.height + dp)
    s, p = T.subject(hero, 940, glow=(255, 255, 255), glow_r=30)
    T.paste(c, s, 300 - s.width / 2, 1700 - s.height + p)
    T.text_line(c, "ZENO'S PARADOX", 540, 190, 170)
    T.text_line(c, '1/2 + 1/4 + 1/8 + ...', 540, 420, 120, box=T.YELLOW)
    T.ring(c, 600, 1500, 120, col=T.YELLOW)
    T.pill(c, 'AP CALC BC', VIO); T.mark(c); return c


ps = []
for name, fn in (('thumb_a', a), ('thumb_b', b)):
    p = OUT + name + '.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
