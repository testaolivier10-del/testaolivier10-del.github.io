import sys; sys.path[:0]=['/home/claude/w1118/stack','/home/claude/short','/home/claude/guy']
import skia, math, build as B, world as Wd
from lpk import P, SP, C, blur
from art import glow
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H = 1080, 1920
def make(out, words2, z=1.32, cx=560, cy=900):
    s = skia.Surface(W, H); c = s.getCanvas(); t = 21.4
    xs = Wd.stack_x(B.offsets(30.0))
    B.world_scene(c, t, z, cx, cy, xs)
    S = lambda p: B.to_screen(p, z, cx, cy)
    B.edge_line(c, S, 1.0, Wd.YTT - 4 * Wd.T - 80, z, down=True)
    p0 = S((Wd.E, Wd.YTT - 3.5 * Wd.T)); p1 = S((xs[0], Wd.YTT - 3.5 * Wd.T))
    c.drawLine(p0[0], p0[1], p1[0], p1[1], SP((255, 226, 150), 16, 150, MaskFilter=blur(6)))
    q0 = S((xs[0], Wd.YTT - 4 * Wd.T)); q1 = S((xs[0] + Wd.L, Wd.YTT - 3 * Wd.T))
    glow(c, (q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2, 330, (255, 200, 120), 90)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(q0[0] - 6, q0[1] - 6, q1[0] + 6, q1[1] + 6), 14, 14), SP((255, 255, 255), 8))
    g = S((Wd.E + 4, Wd.YTT - 3.5 * Wd.T))
    c.drawCircle(g[0], g[1], 70, SP((0, 0, 0), 16, 120, MaskFilter=blur(6))); c.drawCircle(g[0], g[1], 70, SP((255, 70, 80), 12))
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [C((6, 8, 30), 235), C((6, 8, 30), 0)])
    c.drawRect(skia.Rect(0, 0, W, 760), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 156); w1 = f1.measureText(words2[0])
    for col, st in (((8, 10, 36), 26), ((255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col))
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(words2[0], 540 - w1 / 2, 390, f1, pa)
    f2 = skia.Font(ANTON, 160); w2 = f2.measureText(words2[1])
    c.save(); c.translate(540, 580); c.rotate(-3.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -98, w2 / 2 + 40, 96), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -106, w2 / 2 + 40, 86), 22, 22), P((255, 214, 64)))
    c.drawString(words2[1], -w2 / 2, 58, f2, P((16, 12, 40))); c.restore()
    fp = skia.Font(MONT, 40); fp.setEmbolden(True); wp = fp.measureText('AP CALCULUS BC')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 172), 38, 38), P((232, 80, 122)))
    c.drawString('AP CALCULUS BC', 540 - wp / 2, 149, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', 1080 - fm.measureText('LevlPrep') - 48, 1560, fm, P((64, 226, 206)))
    s.makeImageSnapshot().save(out)
if __name__ == '__main__':
    make('out/thumb.png', ('BOOK STACKING', 'PAST THE EDGE?'), z=1.22, cx=560, cy=880)
    make('out/thumb_b.png', ('NO GLUE', 'CAN SHE DO IT?'), z=1.55, cx=650, cy=880)
