import sys; sys.path[:0]=['/home/claude/short','/home/claude/fw']
import skia, build
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920
def make(out, words2, t):
    s = skia.Surface(W, H); c = s.getCanvas()
    build.scene(c, t)
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 700)], [C((6, 8, 34), 240), C((6, 8, 34), 0)])
    c.drawRect(skia.Rect(0, 0, W, 700), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 200); w1 = f1.measureText(words2[0])
    for col, st in (((8, 10, 36), 26), ((255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col))
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(words2[0], 540 - w1 / 2, 390, f1, pa)
    f2 = skia.Font(ANTON, 168); w2 = f2.measureText(words2[1])
    c.save(); c.translate(540, 580); c.rotate(-3.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -98, w2 / 2 + 40, 96), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -106, w2 / 2 + 40, 86), 22, 22), P((70, 150, 255)))
    c.drawString(words2[1], -w2 / 2, 62, f2, P((255, 255, 255))); c.restore()
    fp = skia.Font(MONT, 40); fp.setEmbolden(True); wp = fp.measureText('AP CHEMISTRY')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 172), 38, 38), P((20, 110, 120)))
    c.drawString('AP CHEMISTRY', 540 - wp / 2, 149, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1560, fm, P((64, 226, 206)))
    s.makeImageSnapshot().save(out)
make('out/thumb.png', ('WHY IS BLUE', 'THE HARDEST?'), 41.15)
