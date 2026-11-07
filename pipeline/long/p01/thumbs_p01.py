"""Three thumbnail concepts (video standard 9 and the 2026-11-05 rules): the video's own art big on the right as white
outlined stickers (Leo sprinting or celebrating, the timing display, the phone app), one big result, the house layout on
the left (course pill, two line title, a yellow handwritten scope line, levlprep.com), bottom right corner clear."""
import sys, math, numpy as np, skia
sys.path.insert(0, '/home/claude/lv')
import kit as K, mk as M, world as WD, cast as CA, people as PE, story as ST
from PIL import Image
ACC, DEEP, MID = (255, 160, 70), (10, 18, 58), (28, 50, 128)
YEL = (255, 210, 63)


def save(s, name):
    a = s.makeImageSnapshot().toarray()[:, :, :3][:, :, ::-1]
    Image.fromarray(np.ascontiguousarray(a)).resize((1280, 720), Image.LANCZOS).save(f'/home/claude/lv/out/thumb_{name}.png')


def bg(c, cx=1400):
    sh = skia.GradientShader.MakeRadial(skia.Point(cx, 540), 1300, [K.C(MID), K.C((18, 32, 92)), K.C(DEEP)], [0, 0.5, 1])
    c.drawRect(skia.Rect(0, 0, 1920, 1080), skia.Paint(Shader=sh))
    for x in range(0, 1920, 96):
        c.drawLine(x, 0, x, 1080, K.SP((110, 140, 230), 2, 22))
    for y in range(0, 1080, 96):
        c.drawLine(0, y, 1920, y, K.SP((110, 140, 230), 2, 22))


def chrome(c, l1, l2, scope, pill='AP PHYSICS 1  ·  SKILLS', size=150):
    f = K.font('xb', 34); w = f.measureText(pill)
    r = skia.RRect.MakeRectXY(skia.Rect(66, 66, 66 + w + 60, 132), 33, 33)
    c.drawRRect(r, K.P(DEEP, 220)); c.drawRRect(r, K.SP(ACC, 5))
    c.drawString(pill, 96, 111, f, K.P((255, 200, 150)))
    for i, (s, col) in enumerate(((l1, (255, 255, 255)), (l2, ACC))):
        ft = K.font('xb', size)
        c.drawString(s, 66, 330 + i * (size + 14) + 10, ft, K.P(DEEP))
        c.drawString(s, 66, 330 + i * (size + 14), ft, K.P(col))
    K.hand(c, scope, 72, 660, 66, YEL, 1.0)
    c.drawString('levlprep.com', 70, 1010, K.font('xb', 46), K.P((236, 240, 255)))


def sticker(c, draw, pad=12):
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.DropShadow(0, 18, 14, 14, K.C((0, 0, 0), 150))))
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Dilate(pad, pad), ColorFilter=skia.ColorFilters.Blend(K.C((255, 255, 255)), skia.BlendMode.kSrcIn)))
    draw(c); c.restore()
    draw(c)
    c.restore()


def num(c, s, x, y, size, col=YEL, align='left'):
    M.mdraw(c, s, x + 4, y + 6, size, DEEP, align=align)
    M.mdraw(c, s, x, y, size, col, align=align)


def leo_run(c, x, ground, s):
    L = CA.leo()
    sp = PE.Sprint(L, s, 0.0, 0.0, lambda t: 8.0, 3.0, ground=ground)
    ps, X = sp.pose(1.31)
    ps.x = x; ps.mouth = 0.5; ps.smile = 0.6
    L.draw(c, ps, world=True)


def leo_win(c, x, ground, s):
    L, ps = PE.leo_stand(0.0, x, s=s, face=-1, smile=1.3, mouth=0.6, ground=ground)
    ps.uarm_n = 95; ps.elbow_n = 85; ps.uarm_f = -10; ps.elbow_f = 30; ps.hand_n = ps.hand_f = 'fist'; ps.blink = False
    L.draw(c, ps, world=True)


def disp(val, x, y, s):
    return lambda c: WD.display(c, x, y, s, val, glow_=1.0, pole=False)


def a():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'Units &', 'Sig Figs', 'is he really 30 km/h?')
    sticker(c, disp('12.431', 1520, 190, 1.4))
    sticker(c, lambda c: leo_run(c, 1300, 1010, 1.3))
    num(c, '28.96 km/h', 66, 880, 120, (255, 140, 120))
    save(s, 'a')


def b():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'Units &', 'Sig Figs', 'round once, at the end')
    sticker(c, disp('11.998', 1200, 200, 1.3))
    sticker(c, lambda c: leo_win(c, 1470, 980, 1.35))
    num(c, '30.01 km/h', 66, 880, 130)
    save(s, 'b')


def c_():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c, 1450)
    chrome(c, 'Units &', 'Sig Figs', 'never off by 100x again')
    sticker(c, lambda c: ST.phone_screen(c, 1200, 470, 1.1, 1.0, '30'))
    sticker(c, lambda c: leo_run(c, 1610, 990, 1.2))
    num(c, '30 km/h ?', 66, 880, 120)
    save(s, 'c')


a(); b(); c_()
print('thumbs ok')
