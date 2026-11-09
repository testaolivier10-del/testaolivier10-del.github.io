"""Pro Shorts thumbnail for the Gage rebuild (video standard section 9): the video's own clean scene as background, a hero
rendered alone from the same code (Gage leaning over the iron, the moment before the spark), 2 concepts."""
import sys, math
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/lp/w1031r/gage']
import skia
import thumbpro as T
import build as B, airman2 as A

OUT = '/home/claude/lp/w1031r/gage/thumbs/'
PSY = (80, 170, 220)


def scene_png(t, path):
    s = skia.Surface(1080, 1920); c = s.getCanvas(); B.scene(c, t); s.makeImageSnapshot().save(path); return path


def hero_png(path, iron_up=0.0):
    s = skia.Surface(1400, 1600); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0))
    c.translate(700 - B.GX * 1.6 + 120, 1550 - B.GY * 1.6); c.scale(1.6, 1.6)
    ps, by = B.tamp_pose(2.0)
    B.GAGE.draw(c, ps, light=(0.7, -0.6), rim=(255, 224, 170), shadow=False)
    c.save(); c.clipPath(B.near_hand_path(B.GAGE, ps), skia.ClipOp.kDifference, True)
    B.iron(c, (B.HOLE_X, by), 0.0, B.ROD_L, B.ROD_W); c.restore()
    s.makeImageSnapshot().save(path); return path


bg = scene_png(1.0, OUT + 'bg.png')
bg2 = scene_png(B.T_LEFT + 1.2, OUT + 'bg_xray.png')
hero = hero_png(OUT + 'hero.png')


def concept_a():
    c = T.background(bg, focus=(0.45, 0.55), zoom=1.15, blur=12, tint=PSY, dark=0.5, burst=(560, 1150), burst_col=(255, 230, 170))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero, 1150, glow=(255, 230, 170), glow_r=32)
    T.paste(c, s, 560 - s.width / 2, 1760 - s.height + p)
    T.arrow(c, (900, 1060), (480, 880), bend=0.35, col=T.YELLOW)
    T.text_line(c, 'AN IRON ROD', 540, 190, 200)
    T.text_line(c, 'THROUGH HIS SKULL', 540, 430, 130, box=T.YELLOW)
    T.pill(c, 'AP PSYCHOLOGY', PSY); T.mark(c); return c


def concept_b():
    c = T.background(bg2, focus=(0.5, 0.48), zoom=1.05, blur=6, tint=PSY, dark=0.35, burst=(540, 1100), burst_col=(255, 210, 120))
    T.top_shade(c, 820, 225)
    T.text_line(c, 'HE SURVIVED', 540, 190, 210)
    T.text_line(c, 'BUT CHANGED', 540, 440, 170, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'AP PSYCHOLOGY', PSY); T.mark(c); return c


ps = []
for name, fn in (('thumb_a', concept_a), ('thumb_b', concept_b)):
    p = OUT + name + '.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
