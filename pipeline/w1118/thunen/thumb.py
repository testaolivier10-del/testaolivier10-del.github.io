"""Shorts thumbnail, pro kit pattern: the video's own map (rings around the city) blurred and darkened behind, the farmer pouring out
the sour milk as a big white outlined sticker, two lines of huge words, the course pill, the LevlPrep mark."""
import sys, math; sys.path[:0] = ['/home/claude/w1118/thunen', '/home/claude/short', '/home/claude/guy']
import skia, build as B, cast as K, world as WO
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920
def make(out, l1, l2):
    s = skia.Surface(W, H); c = s.getCanvas()
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(7, 7)))
    c.save(); c.translate(540, 1100); c.scale(1.25, 1.25); c.translate(-540, -1000); B.NOLABEL = True; B.map_scene(c, 37.4); c.restore()
    c.restore()
    c.drawRect(skia.Rect(0, 0, W, H), P((8, 14, 30), 120))
    c.drawCircle(560, 1250, 520, P((255, 214, 120), 110, MaskFilter=blur(160)))
    # the hero: the farmer mid pour, as a sticker
    hs = skia.Surface(W, H); hc = hs.getCanvas()
    t = 2.2; ps, tilt, Cc, flow = B.farmer_pour(t); ps.look = (0.2, 0.0); ps.head_yaw = 0.15
    FX, FG, FS = 300, 2180, 1.28
    K.farmer(hc, ps, FX, FG, FS)
    mouth = (FX + K.cpt(Cc, tilt, 0, -196)[0] * FS * 1.07, FG + K.cpt(Cc, tilt, 0, -196)[1] * FS)
    WO.stream(hc, mouth, (math.sin(tilt), -math.cos(tilt)), 1.0, 1.3, scale=1.5, ground=2000)
    img = hs.makeImageSnapshot()
    c.drawImage(img, 14, 22, paint=P((0, 0, 0), 150, ImageFilter=skia.ImageFilters.Blur(16, 16)))
    c.drawImage(img, 0, 0, paint=skia.Paint(ImageFilter=skia.ImageFilters.Dilate(12, 12), ColorFilter=skia.ColorFilters.Blend(C((255, 255, 255)), skia.BlendMode.kSrcIn)))
    c.drawImage(img, 0, 0)
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 860)], [C((6, 10, 30), 235), C((6, 10, 30), 0)])
    c.drawRect(skia.Rect(0, 0, W, 860), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 168); w1 = f1.measureText(l1)
    if w1 > 980: f1 = skia.Font(ANTON, 168 * 980 / w1); w1 = f1.measureText(l1)
    for col, st in (((8, 10, 36), 26), ((255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col))
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(l1, 540 - w1 / 2, 420, f1, pa)
    f2 = skia.Font(ANTON, 176); w2 = f2.measureText(l2)
    c.save(); c.translate(540, 620); c.rotate(-3.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -102, w2 / 2 + 40, 98), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -110, w2 / 2 + 40, 88), 22, 22), P((255, 214, 64)))
    c.drawString(l2, -w2 / 2, 64, f2, P((16, 12, 40))); c.restore()
    fp = skia.Font(MONT, 38); fp.setEmbolden(True); txt = 'AP HUMAN GEOGRAPHY'; wp = fp.measureText(txt)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 170), 37, 37), P((150, 70, 40)))
    c.drawString(txt, 540 - wp / 2, 147, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1560, fm, P((64, 226, 206)))
    s.makeImageSnapshot().save(out)
make('/home/claude/w1118/thunen/out/thumb.png', 'VON THÜNEN MODEL', 'WRONG FARM?')
make('/home/claude/w1118/thunen/out/thumb_b.png', 'WHY HIS MILK SPOILS', 'WRONG FARM?')
