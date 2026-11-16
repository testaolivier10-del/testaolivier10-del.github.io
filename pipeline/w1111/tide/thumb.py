import sys; sys.path[:0] = ['/home/claude/w1111/tide']
import skia, numpy as np, build as B, kit
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920
def make(out, words2, t=36.9):
    s = skia.Surface(W, H); c = s.getCanvas()
    c.save(); c.translate(540, 1300); c.scale(1.16, 1.16); c.translate(-560, -1130); B.lowview(c, t, True, B.man_end(t)); c.restore()
    img = kit.finish(s.makeImageSnapshot().toarray(), t, lift=1.08, sat=1.08)
    s = skia.Surface(W, H); c = s.getCanvas(); c.drawImage(skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType), 0, 0)
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 820)], [C((10, 8, 40), 235), C((10, 8, 40), 0)])
    c.drawRect(skia.Rect(0, 0, W, 820), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 168); w1 = f1.measureText(words2[0])
    for col, st in (((8, 10, 36), 26), ((255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col))
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(words2[0], 540 - w1 / 2, 400, f1, pa)
    f2 = skia.Font(ANTON, 176); w2 = f2.measureText(words2[1])
    c.save(); c.translate(540, 600); c.rotate(-3.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -102, w2 / 2 + 40, 100), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -110, w2 / 2 + 40, 90), 22, 22), P((255, 214, 64)))
    c.drawString(words2[1], -w2 / 2, 64, f2, P((16, 12, 40))); c.restore()
    fp = skia.Font(MONT, 40); fp.setEmbolden(True); wp = fp.measureText('AP PRECALCULUS')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 172), 38, 38), P((24, 120, 130)))
    c.drawString('AP PRECALCULUS', 540 - wp / 2, 149, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1840, fm, P((64, 226, 206)))
    s.makeImageSnapshot().save(out)
make('out/thumb.png', ('TIDE COMING IN', 'HOW FAST?'))
