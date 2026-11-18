"""thumbnail, pro kit pattern (lt/thumb.py): the lost man's face big, the cold bottle and the ring as the stake, 2 big words lines"""
import sys; sys.path[:0] = ['/home/claude/w1118/diamond', '/home/claude/short']
import math, skia, build as B, chars as CH, hands as H
from lpk import P, SP, C, blur
ANTON = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Anton-Regular.ttf')
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W, H_ = 1080, 1920


def words(c, l1, l2):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [C((30, 16, 10), 230), C((30, 16, 10), 0)])
    c.drawRect(skia.Rect(0, 0, W, 760), skia.Paint(Shader=sh))
    f1 = skia.Font(ANTON, 170); w1 = f1.measureText(l1)
    for col, st in (((20, 10, 8), 26), ((255, 255, 255), 0)):
        pa = skia.Paint(AntiAlias=True, Color=C(col))
        if st: pa.setStyle(skia.Paint.kStroke_Style); pa.setStrokeWidth(st); pa.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawString(l1, 540 - w1 / 2, 400, f1, pa)
    f2 = skia.Font(ANTON, 160); w2 = f2.measureText(l2)
    c.save(); c.translate(540, 590); c.rotate(-3.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -98, w2 / 2 + 40, 92), 22, 22), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w2 / 2 - 40, -106, w2 / 2 + 40, 84), 22, 22), P((255, 214, 64)))
    c.drawString(l2, -w2 / 2, 58, f2, P((24, 14, 10))); c.restore()
    fp = skia.Font(MONT, 40); fp.setEmbolden(True); wp = fp.measureText('AP MICROECONOMICS')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(540 - wp / 2 - 34, 96, 540 + wp / 2 + 34, 172), 38, 38), P((40, 120, 110)))
    c.drawString('AP MICROECONOMICS', 540 - wp / 2, 149, fp, P((255, 255, 255)))
    fm = skia.Font(MONT, 38); fm.setEmbolden(True); c.drawString('LevlPrep', W - fm.measureText('LevlPrep') - 48, 1580, fm, P((64, 226, 206)))


def make(out, l1, l2, variant):
    s = skia.Surface(W, H_); c = s.getCanvas()
    c.save(); c.translate(540, 960); c.scale(1.5, 1.5); c.translate(-600, -1060)
    B.blur_layer(c, 10); B.world_back(c, 3.0); B.shade_cloth(c, 3.0, 560, 1010, 870, 1720); B.stand(c, 3.0, 560, 1010, 1390, 1720); c.restore(); c.restore()
    c.drawRect(skia.Rect(0, 0, W, H_), P((255, 160, 80), 40))
    c.drawCircle(540, 1150, 520, P((255, 236, 190), 120, MaskFilter=blur(120)))
    ps = B.lost_pose(3.0, yaw=0.25, look=(0.7, -0.5), sq=0.6, worry=1.0)
    ps.lid = 0.62
    CH.person(c, 'lost', ps, 430 if variant == 'a' else 540, 1000 + 952 * 2.3 * 0.98, 2.3)
    # the stake: one cold bottle held up by the stranger's hand, the ring glinting on the man's hand
    if variant == 'a':
        ang = math.radians(-4); sc = 4.6; wr = (720, 1130)
        B.sleeve_arm(c, 'seller', (wr[0] + 520, wr[1] + 500), (wr[0] + 30, wr[1] + 18), 240, 180)
        B.bottle(c, wr[0] + sc * 52, wr[1] - 34 * sc, -4, sc, level=0.86, t=1.0, glint=1.0, wet=1.0)
        B.hand_at(c, 'seller', wr, ang, 1, sc, H.GRIP['curls'], 0.05)
    else:
        for (x, y, r) in ((820, 1190, 120), (260, 1240, 170)):
            c.drawCircle(x, y, r, P((255, 255, 255), 150, MaskFilter=blur(40)))
        CH.ring_loose(c, 820, 1220, 70, 0, 1.0, 1.0)
        B.bottle(c, 260, 1240, 0, 3.4, level=0.86, t=1.0, glint=1.0, wet=1.0)
    words(c, l1, l2)
    s.makeImageSnapshot().save(out)


make('out/thumb.png', 'DIAMOND', 'OR WATER?', 'b')
make('out/thumb_b.png', 'WOULD YOU', 'TRADE?', 'b')
