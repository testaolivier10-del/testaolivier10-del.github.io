import sys; sys.path[:0] = ['/home/claude/short', '/home/claude/mh', '/home/claude/dv']
import skia, build, world as WO
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920
def make(out, words2, concept):
    s = skia.Surface(W, H); c = s.getCanvas()
    if concept == 1:
        build.s1(c, 5.2)
    else:
        c.drawRect(skia.Rect(0, 0, W, H), P((4, 12, 40))); c.save(); c.translate(0, 260); build.s34(c, 14.05); c.restore()
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [C((4, 12, 40), 255), C((4, 12, 40), 255), C((4, 12, 40), 0)], [0, 0.36, 1.0])
    c.drawRect(skia.Rect(0, 0, W, 760), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 170); w1 = f1.measureText(words2[0])
    for col, st in (((6, 12, 40), 26), ((255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col))
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(words2[0], 540 - w1 / 2, 400, f1, pa)
    f2 = skia.Font(ANTON, 150); w2 = f2.measureText(words2[1])
    c.save(); c.translate(540, 590); c.rotate(-3.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -92, w2 / 2 + 40, 92), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -100, w2 / 2 + 40, 80), 22, 22), P((255, 214, 64)))
    c.drawString(words2[1], -w2 / 2, 56, f2, P((10, 16, 44))); c.restore()
    fp = skia.Font(MONT, 40); fp.setEmbolden(True); wp = fp.measureText('A&P')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 172), 38, 38), P((20, 120, 150)))
    c.drawString('A&P', 540 - wp / 2, 149, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1840, fm, P((64, 226, 206)))
    s.makeImageSnapshot().save(out)
make('out/thumb1.png', ('DIVE REFLEX', 'HER HEART SLOWS'), 1)
make('out/thumb2.png', ('DIVE REFLEX', 'HER HEART SLOWS'), 2)
