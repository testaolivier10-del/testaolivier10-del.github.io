"""Pro Shorts thumbnails for w1108-03 (video standard section 9): the video's own clean scene as background, heroes
rendered alone from the same code, 2 concepts."""
import sys
sys.path[:0] = ['/home/claude/lp/thumbpro', '/home/claude/w1108/03']
sys.argv = ['build']
import skia
import thumbpro as T
import build as B, cast, airman2 as A

OUT = '/home/claude/w1108/03/thumbs/'
MAC = (170, 210, 100)


def scene_png(fn, t, path):
    s = skia.Surface(1080, 1920); c = s.getCanvas(); fn(c, t); s.makeImageSnapshot().save(path); return path


def hero_png(draw, path, w=1400, h=1600):
    s = skia.Surface(w, h); c = s.getCanvas(); c.clear(skia.Color4f(0, 0, 0, 0)); draw(c); s.makeImageSnapshot().save(path); return path


bg = scene_png(B.shot_a, 0.9, OUT + 'bg_gate.png')
bg2 = scene_png(B.shot_c, B.T_BIL + 0.4, OUT + 'bg_tower.png')
W2 = cast.wife(1.0)


def wife_hero(c):
    kw = dict(face=1, lean=4, neck=0, thigh_n=6, knee_n=-4, thigh_f=-6, knee_f=-2, hand_n='grip', hand_f='grip')
    ua, el = B.arm_to(W2, kw, 'n', (330, 1480 - 700), 1480); kw.update(uarm_n=ua, elbow_n=el)
    ua, el = B.arm_to(W2, kw, 'f', (300, 1480 - 600), 1480); kw.update(uarm_f=ua, elbow_f=el)
    W2.draw(c, A.Pose(x=420, ground=1480, **kw), shadow=False)
    hx, hy = B.hand_pt(W2, 420, kw, 'n', 1480)
    B.stack(c, hx, hy + 120, 1.15, 4)
    B.basket(c, hx, hy, 1.6, n_bundles=0)
    for k, (dx, dy, a) in enumerate(((-150, 330, -30), (170, 380, 25), (-60, 520, 70))):
        c.save(); c.translate(hx + dx, hy + dy); c.rotate(a); c.drawRect(skia.Rect(-70, -30, 70, 30), B.P(B.NOTE_HI)); c.drawRect(skia.Rect(-58, -18, -20, 2), B.P(B.NOTE_INK, 150)); c.restore()


def stack_hero(c):
    for k in range(5): B.bundle(c, 520 + (k % 2) * 30, 1300 - k * 150, 3.2, -4 + 6 * (k % 2))
    B.loaf(c, 1000, 1360, 3.0)


h1 = hero_png(wife_hero, OUT + 'hero_wife.png')
h2 = hero_png(stack_hero, OUT + 'hero_stack.png')


def con_a():
    c = T.background(bg, focus=(0.5, 0.55), zoom=1.2, blur=12, tint=MAC, dark=0.5, burst=(540, 1150), burst_col=(255, 230, 160))
    T.top_shade(c, 820, 225)
    s, p = T.subject(h1, 1150, glow=(255, 236, 170), glow_r=30)
    T.paste(c, s, 560 - s.width / 2, 1760 - s.height + p)
    T.text_line(c, 'A BASKET OF CASH', 540, 190, 150)
    T.text_line(c, 'FOR ONE LOAF', 540, 420, 170, box=T.YELLOW)
    T.pill(c, 'AP MACRO', MAC); T.mark(c); return c


def con_b():
    c = T.background(bg2, focus=(0.5, 0.5), zoom=1.1, blur=12, tint=MAC, dark=0.5, burst=(540, 1100), burst_col=(255, 220, 140))
    T.top_shade(c, 820, 225)
    s, p = T.subject(h2, 1000, glow=(255, 255, 255), glow_r=30)
    T.paste(c, s, 540 - s.width / 2, 1720 - s.height + p)
    T.ring(c, 760, 1530, 190, col=T.YELLOW)
    T.text_line(c, '200 BILLION', 540, 190, 210)
    T.text_line(c, 'FOR BREAD?', 540, 440, 180, box=T.RED, box_txt=T.WHITE)
    T.pill(c, 'AP MACRO', MAC); T.mark(c); return c


ps = []
for name, fn in (('a', con_a), ('b', con_b)):
    p = OUT + f'w1108-03-hyperinflation_{name}.png'; T.save(fn(), p); ps.append(p)
T.preview(ps, OUT + 'preview.jpg'); print('ok')
