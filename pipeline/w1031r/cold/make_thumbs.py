"""Pro Shorts thumbnails for w1031-01-cold-heart (video standard section 9): the video's own clean scene as the
background, heroes rendered alone from the same code, 2 concepts."""
import sys, math
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/lp/w1031r/cold', '/home/claude/lp/w1031/lib']
sys.argv = ['x']
import skia
import thumbpro as T
import build as B
import heart as HT
OUT = '/home/claude/lp/w1031r/cold/thumbs/'


def scene_png(t, path):
    s = skia.Surface(1080, 1920); c = s.getCanvas(); B.scene(c, t)
    s.makeImageSnapshot().save(path); return path


def hero_png(draw, path, w=1400, h=1400):
    s = skia.Surface(w, h); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0)); draw(c)
    s.makeImageSnapshot().save(path); return path


def group(c):
    """the haul at its roughest: RED on the sled board pulling the man up out of the hole by the chest"""
    t = B.T_ROUGH + 0.4
    lift = B.lift_at(t)
    c.translate(700 - B.HX, 760 - B.HY + 300)
    B.hole_back(c, t)
    pat = B.patient_pose(t, lift); rp = B.red_pose(t, lift, pat)
    c.save(); c.clipRect(skia.Rect(-2000, -2000, 4000, B.HY + 2)); B.PK.draw(c, pat, light=B.LIGHT, rim=B.RIMC, world=True, shadow=False); c.restore()
    B.hole_front(c, t, lift, B.HX + 10)
    B.sled_board(c, B.BOARD[0] - 60, B.BOARD[1] - 30, B.HY + 4)
    B.RK.draw(c, rp, light=B.LIGHT, rim=B.RIMC, world=True, shadow=False)


def heart(c):
    HT.draw_heart(c, 700, 720, 2.6, B.T_VF + 0.5, 0.0, 1.0)


bg = scene_png(B.T_HE + 1.5, OUT + 'bg.png')
hero = hero_png(group, OUT + 'hero_group.png')
hero2 = hero_png(heart, OUT + 'hero_heart.png')
NR = T.COURSE['NREMT']


def a():
    c = T.background(bg, focus=(0.45, 0.6), zoom=1.25, blur=12, tint=NR, dark=0.5, burst=(540, 1150), burst_col=(200, 220, 255))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero, 1050, glow=(200, 220, 255), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1720 - s.height + p)
    T.burst(c, 690, 1010, r=70, col=T.RED)
    T.text_line(c, 'ONE ROUGH LIFT', 540, 190, 170)
    T.text_line(c, 'CAN STOP HIS HEART', 540, 430, 120, box=T.YELLOW)
    T.pill(c, 'EMT TRAPS #2', NR); T.mark(c); return c


def b():
    c = T.background(bg, focus=(0.5, 0.5), zoom=1.0, blur=14, tint=(200, 40, 60), dark=0.55, burst=(540, 1150), burst_col=(255, 120, 120))
    T.top_shade(c, 820, 225)
    s, p = T.subject(hero2, 980, glow=(255, 255, 255), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1720 - s.height + p)
    T.text_line(c, 'DON\'T YANK HIM', 540, 190, 180)
    T.text_line(c, 'HYPOTHERMIA', 540, 430, 170, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'EMT TRAPS #2', NR); T.mark(c); return c


ps = []
for name, fn in (('cold_a', a), ('cold_b', b)):
    p = OUT + name + '.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
