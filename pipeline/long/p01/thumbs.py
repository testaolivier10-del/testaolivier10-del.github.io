"""Three thumbnail concepts in the house long video style (thumbs/ref/apchem.png; video standard 9; Olivier 2026-11-02):
dark cobalt background with a grid, title left (white, then the AP Chem cobalt), one yellow handwritten scope line, course
pill top left, levlprep.com bottom left, the video's own art on the right as stickers and round lenses, bottom right clear."""
import sys, math, numpy as np, skia
sys.path.insert(0, '/home/claude/lv')
import kit as K, mk as M, world as WD, cast as CA, scenes as SC, tl
from PIL import Image
T = tl.build(); SC.Bt = dict(T['beats']); SC.Bt['__DUR'] = T['DUR']
ACC, DEEP, MID = (90, 130, 230), (10, 18, 58), (28, 50, 128)
YEL = (255, 210, 63)


def save(s, name):
    a = s.makeImageSnapshot().toarray()[:, :, :3][:, :, ::-1]
    Image.fromarray(np.ascontiguousarray(a)).resize((1280, 720), Image.LANCZOS).save(f'/home/claude/lv/out/thumb_{name}.png')


def bg(c, cx=1400):
    sh = skia.GradientShader.MakeRadial(skia.Point(cx, 540), 1300, [K.C(MID), K.C((18, 32, 92)), K.C(DEEP)], [0, 0.5, 1])
    c.drawRect(skia.Rect(0, 0, 1920, 1080), skia.Paint(Shader=sh))
    for x in range(0, 1920, 96):
        c.drawLine(x, 0, x, 1080, K.SP(ACC, 2, 22))
    for y in range(0, 1080, 96):
        c.drawLine(0, y, 1920, y, K.SP(ACC, 2, 22))


def chrome(c, l1, l2, scope, pill='AP CHEM  ·  SKILLS', size=150):
    f = K.font('xb', 34); w = f.measureText(pill)
    r = skia.RRect.MakeRectXY(skia.Rect(66, 66, 66 + w + 60, 132), 33, 33)
    c.drawRRect(r, K.P(DEEP, 220)); c.drawRRect(r, K.SP(ACC, 5))
    c.drawString(pill, 96, 111, f, K.P((150, 180, 255)))
    for i, (s, col) in enumerate(((l1, (255, 255, 255)), (l2, ACC))):
        ft = K.font('xb', size)
        c.drawString(s, 66, 330 + i * (size + 14) + 10, ft, K.P(DEEP))
        c.drawString(s, 66, 330 + i * (size + 14), ft, K.P(col))
    K.hand(c, scope, 72, 660, 70, YEL, 1.0)
    c.drawString('levlprep.com', 70, 1010, K.font('xb', 46), K.P((236, 240, 255)))


def sticker(c, draw, pad=10):
    """draw something with a thick white outline (draw twice on a layer: outline by dilate)"""
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.DropShadow(0, 18, 14, 14, K.C((0, 0, 0), 150))))
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Dilate(pad, pad), ColorFilter=skia.ColorFilters.Blend(K.C((255, 255, 255)), skia.BlendMode.kSrcIn)))
    draw(c); c.restore()
    draw(c)
    c.restore()


def lens(c, cx, cy, r, scene_t, z, fx, fy, cast_fn=None):
    c.save()
    p = skia.Path(); p.addCircle(cx, cy, r)
    c.drawCircle(cx, cy, r + 30, K.P(ACC, 60, MaskFilter=K.blur(30)))
    c.clipPath(p, skia.ClipOp.kIntersect, True)
    c.translate(cx - 960 * (r * 2 / 1080), cy - 540 * (r * 2 / 1080)); c.scale(r * 2 / 1080, r * 2 / 1080)
    c.translate(-420, 0)
    WD.camera(c, z, fx, fy)
    WD.kitchen(c, scene_t, cast=cast_fn)
    c.restore()
    c.drawCircle(cx, cy, r, K.SP(ACC, 12)); c.drawCircle(cx, cy, r + 9, K.SP(DEEP, 7))


def tag(c, s, x, y, size=44, col=YEL):
    f = K.font('xb', size); w = f.measureText(s)
    c.drawString(s, x - w / 2 + 3, y + 4, f, K.P(DEEP)); c.drawString(s, x - w / 2, y, f, K.P(col))


def kids(c):
    WD.stool(c, 1180)
    T_, tp = SC.theo_stool(12.0, neck=10)
    T_.draw(c, tp)


def a():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c)
    chrome(c, 'Units &', 'Sci Notation', 'conversions + powers of ten')
    sticker(c, lambda c: SC.big_drop(c, 2.0, 1430, 560, 250, 1.0, n=40))
    tag(c, '1.0 × 10²² molecules', 1430, 960, 58)
    save(s, 'a')


def b():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c)
    chrome(c, 'Units &', 'Sci Notation', 'one drop, counted')
    lens(c, 1370, 470, 330, 12.0, 2.0, 980, 600, kids)
    sticker(c, lambda c: SC.molecule(c, 1720, 170, 2.6))
    tag(c, '≈ 10²² in one drop', 1330, 960, 56)
    save(s, 'b')


def c_():
    s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c)
    chrome(c, 'Units &', 'Sci Notation', 'never flip a factor again')

    def board(c):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1040, 230, 1820, 760), 40, 40), K.P((16, 22, 60)))
        M.qty(c, '2.45', 'km', 1100, 420, 92, 1.0, 1.0)
        M.mdraw(c, '×', 1445, 420, 92, K.CREAM)
        M.frac(c, ('1000', 'm'), ('1', 'km'), 1515, 400, 84, 1.0, sd=1.0)
        M.mdraw(c, '= 2450 m', 1180, 640, 110, YEL)
    sticker(c, board, 8)
    tag(c, 'units cancel, answer checks out', 1430, 900, 48)
    save(s, 'c')


a(); b(); c_()
print('thumbs ok')
