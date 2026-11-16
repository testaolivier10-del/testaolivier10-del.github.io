"""Thumbnail (pro kit pattern, see /home/claude/lt/thumb.py and pipeline/thumbpro): the strongest frame (the conductor, flare up, the bus's
headlamps behind him in the smog) plus the topic in the viewer's words."""
import sys; sys.path[:0] = ['/home/claude/w1111/smog']
import skia, numpy as np
import build as B, kit
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920


def make(out, words2, t=5.02):
    s = skia.Surface(W, H); c = s.getCanvas()
    B.conductor(c, t, 1.42, 640, 2400, 1480, 3.9, dict(yaw=0.0, look=(0.0, 0.05), worry=0.9, lid=0.7), nfl=30, plate=False, walk=0.0, bus_xw=-0.06)
    img = kit.finish(s.makeImageSnapshot().toarray(), t, lift=1.08)
    s = skia.Surface(W, H); c = s.getCanvas(); c.drawImage(skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType), 0, 0)
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [C((12, 11, 8), 245), C((12, 11, 8), 0)])
    c.drawRect(skia.Rect(0, 0, W, 760), skia.Paint(Shader=sh))
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 1500), skia.Point(0, 1920)], [C((12, 11, 8), 0), C((12, 11, 8), 220)])
    c.drawRect(skia.Rect(0, 1500, W, 1920), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 176); w1 = f1.measureText(words2[0]); f1 = skia.Font(ANTON, 176 * min(1.0, 960 / w1)); w1 = f1.measureText(words2[0])
    for col, st in (((14, 12, 8), 28), ((255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col))
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(words2[0], 540 - w1 / 2, 390, f1, pa)
    f2 = skia.Font(ANTON, 150); w2 = f2.measureText(words2[1])
    c.save(); c.translate(540, 580); c.rotate(-3.0)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -90, w2 / 2 + 40, 92), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -98, w2 / 2 + 40, 82), 22, 22), P((255, 206, 60)))
    c.drawString(words2[1], -w2 / 2, 56, f2, P((24, 20, 10))); c.restore()
    fp = skia.Font(MONT, 36); fp.setEmbolden(True); tx = 'AP ENVIRONMENTAL SCIENCE'; wp = fp.measureText(tx)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 100, 540 + wp / 2 + 34, 172), 36, 36), P((40, 120, 96)))
    c.drawString(tx, 540 - wp / 2, 149, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1800, fm, P((64, 226, 206)))
    s.makeImageSnapshot().save(out)


make('/home/claude/w1111/smog/out/thumb.png', ('THE GREAT SMOG', 'TRAPPED SMOKE'))
