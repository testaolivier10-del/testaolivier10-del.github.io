"""Thumbnail (pro kit pattern, see /home/claude/lt/thumb.py): the strongest frame (Ray's worried face, the line behind him) plus the topic in the viewer's words."""
import sys; sys.path[:0] = ['/home/claude/w1111/bank']
import skia, build as B
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920
s = skia.Surface(W, H); c = s.getCanvas()
B.street(c, 2.2, cam=(410, 790, 2.05), dof=0.6, extra=1.0, fg=False)
img = B.kit.finish(s.makeImageSnapshot().toarray(), 0.0)
s = skia.Surface(W, H); c = s.getCanvas(); c.drawImage(skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType), 0, 0)
c.drawRect(skia.Rect(0, 0, W, 760), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [C((6, 10, 40), 245), C((6, 10, 40), 170), C((6, 10, 40), 0)], [0, 0.55, 1])))
c.drawRect(skia.Rect(0, 1500, W, H), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 1500), skia.Point(0, H)], [C((6, 10, 40), 0), C((6, 10, 40), 170)])))
f1 = skia.Font(ANTON, 236); t1 = 'BANK RUN'; w1 = f1.measureText(t1)
for col, st in (((8, 10, 36), 30), ((255, 255, 255), 0)):
    pa = skia.Paint(AntiAlias=True, Color=C(col))
    if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
    c.drawString(t1, 540 - w1 / 2, 430, f1, pa)
f2 = skia.Font(ANTON, 128); t2 = 'STAY OR GO HOME?'; w2 = f2.measureText(t2)
c.save(); c.translate(540, 610); c.rotate(-3.0)
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -92, w2 / 2 + 40, 92), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -100, w2 / 2 + 40, 80), 22, 22), P((255, 214, 64)))
c.drawString(t2, -w2 / 2, 54, f2, P((16, 12, 40))); c.restore()
fp = skia.Font(MONT, 40); fp.setEmbolden(True); tp = 'AP MACROECONOMICS'; wp = fp.measureText(tp)
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 172), 38, 38), P((24, 120, 136)))
c.drawString(tp, 540 - wp / 2, 149, fp, P((255, 255, 255)))
fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1560, fm, P((64, 226, 206)))
s.makeImageSnapshot().save('/home/claude/w1111/bank/out/thumb.png')
