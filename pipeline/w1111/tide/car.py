"""The little red hatchback, drawn new for the tide video: a true side view (nose to the right), about 560 px long at s=1.
Origin = the ground under the middle of the car. House flat style: flat fills, one shade band, a lit shoulder line, glass that mirrors the sky."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/guy']
import skia
from lpk import P, SP, C, blur, lerp, mix, smooth_closed

WHEELS = (176.0, -170.0)
WR = 46.0


def body_path():
    p = skia.Path(); p.moveTo(-262, -44)
    p.cubicTo(-280, -46, -283, -70, -279, -92); p.cubicTo(-277, -120, -273, -146, -263, -162)
    p.cubicTo(-251, -192, -233, -220, -205, -230); p.cubicTo(-150, -244, -40, -248, 30, -240)
    p.cubicTo(72, -233, 112, -206, 152, -167); p.cubicTo(192, -160, 240, -152, 262, -138)
    p.cubicTo(279, -127, 285, -104, 283, -80); p.cubicTo(283, -60, 277, -46, 262, -44)
    p.lineTo(233, -44); p.arcTo(skia.Rect(119, -103, 233, 11), 0, -180, False)
    p.lineTo(-113, -44); p.arcTo(skia.Rect(-227, -103, -113, 11), 0, -180, False)
    p.close(); return p


def glass_path():
    p = skia.Path(); p.moveTo(-246, -163)
    p.cubicTo(-238, -188, -224, -209, -201, -217); p.cubicTo(-150, -229, -40, -233, 26, -226)
    p.cubicTo(60, -219, 100, -197, 133, -163); p.close(); return p


def wheel(c, x, rot=0.0):
    y = -WR
    c.drawCircle(x, y, WR, P((30, 30, 40))); c.drawCircle(x, y, WR - 4, SP((70, 72, 86), 3, 200))
    c.drawArc(skia.Rect(x - WR + 3, y - WR + 3, x + WR - 3, y + WR - 3), 200, 70, False, SP((120, 124, 140), 4, 200))      # light on the tyre wall
    c.drawCircle(x, y, 31, P((66, 70, 86)))
    c.save(); c.translate(x, y); c.rotate(rot)
    for k in range(5):
        a = math.radians(k * 72 - 90)
        c.drawLine(4 * math.cos(a), 4 * math.sin(a), 27 * math.cos(a), 27 * math.sin(a), SP((206, 212, 224), 9))
        c.drawLine(4 * math.cos(a) + 2, 4 * math.sin(a) + 2, 26 * math.cos(a) + 2, 26 * math.sin(a) + 2, SP((150, 156, 176), 3, 200))
    c.restore()
    c.drawCircle(x, y, 30, SP((214, 220, 232), 5)); c.drawCircle(x, y, 9, P((224, 228, 238))); c.drawCircle(x, y, 4, P((120, 126, 146)))
    c.drawArc(skia.Rect(x - 30, y - 30, x + 30, y + 30), 20, 120, False, SP((120, 126, 150), 5, 220))


def car(c, x, y, s=1.0, flip=False, dusk=0.0, sky=((170, 226, 228), (44, 92, 120)), base=(220, 58, 46)):
    """dusk 0..1 warms and deepens the paint; sky = the two colours the glass mirrors (top, bottom)"""
    RED = mix(base, (196, 52, 60), 0.5 * dusk); RED_SH = mix(mix(base, (70, 10, 50), 0.52), (60, 16, 70), 0.4 * dusk); RED_HI = mix((255, 150, 110), (255, 190, 120), dusk)
    DARK = (38, 30, 44)
    c.save(); c.translate(x, y); c.scale(-s if flip else s, s)
    c.drawOval(skia.Rect(-250, -26, 262, 22), P((20, 14, 34), 150, MaskFilter=blur(9)))                    # the dark under the car
    for wx in WHEELS: c.drawOval(skia.Rect(wx - 50, -10, wx + 50, 12), P((10, 8, 24), 190, MaskFilter=blur(4)))
    c.drawRect(skia.Rect(-120, -60, 126, -34), P((34, 26, 40)))                                            # the floor pan between the wheels
    for wx in WHEELS: c.drawCircle(wx, -46, 57, P((52, 16, 34)))                                            # inside of the wheel arches
    for wx in WHEELS: wheel(c, wx, rot=18)
    body = body_path()
    c.drawPath(body, P(RED))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-300, -92, 300, -30), P(RED_SH))                                                  # the lower body turns under, away from the light
    c.drawRect(skia.Rect(-300, -100, 300, -92), P(mix(RED, RED_SH, 0.5)))
    q = skia.Path(body); q.offset(-10, 0)                                                                   # shade on the nose end, away from the low sun
    c.drawPath(skia.Op(body, q, skia.PathOp.kDifference_PathOp), P(RED_SH, 200))
    sh = skia.Path(); sh.moveTo(-268, -156); sh.cubicTo(-120, -166, 60, -168, 150, -164); sh.cubicTo(200, -156, 244, -148, 270, -134)
    c.drawPath(sh, SP(RED_HI, 7, 235)); sh.offset(0, 7); c.drawPath(sh, SP(RED_SH, 3, 120))               # the lit shoulder line
    rf = skia.Path(); rf.moveTo(-204, -233); rf.cubicTo(-150, -245, -40, -249, 30, -241); c.drawPath(rf, SP(RED_HI, 8, 220))   # light along the roof
    c.drawRect(skia.Rect(238, -76, 300, -50), P(DARK)); c.drawRect(skia.Rect(-300, -76, -250, -50), P(DARK))      # bumper inserts
    c.drawRect(skia.Rect(-112, -58, 118, -50), P(DARK, 200))                                               # sill strip
    c.restore()
    for wx in WHEELS: c.drawArc(skia.Rect(wx - 57, -103, wx + 57, 11), 180, 180, False, SP(RED_SH, 5))      # arch lips
    g = glass_path()
    c.drawPath(g, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, -232), skia.Point(0, -160)], [C(sky[0]), C(sky[1])])))
    c.save(); c.clipPath(g, skia.ClipOp.kIntersect, True)
    for hx in (-128, -8):                                                                                   # head rests seen through the glass
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hx - 17, -206, hx + 17, -150), 9, 9), P((24, 30, 50), 150))
    for (x0, w_) in ((-190, 34), (-140, 12), (20, 26)):                                                     # the sky sliding across the glass
        st = skia.Path(); st.addPoly([skia.Point(x0, -150), skia.Point(x0 + w_, -150), skia.Point(x0 + w_ + 60, -240), skia.Point(x0 + 60, -240)], True); c.drawPath(st, P((255, 255, 255), 70))
    c.drawRect(skia.Rect(-260, -168, 140, -160), P((20, 20, 40), 90))
    c.restore()
    c.drawPath(g, SP(DARK, 5))
    c.drawLine(-56, -230, -52, -163, SP(DARK, 12)); c.drawLine(-178, -223, -166, -163, SP(DARK, 9))         # door pillars
    dl = skia.Path(); dl.moveTo(-52, -163); dl.lineTo(-52, -62); dl.moveTo(-166, -163); dl.cubicTo(-170, -130, -150, -108, -120, -98)
    dl.moveTo(133, -163); dl.cubicTo(128, -130, 128, -100, 122, -62); c.drawPath(dl, SP(RED_SH, 3.2, 230))  # door shuts
    for hx in (-88, 86): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hx - 17, -146, hx + 17, -136), 5, 5), P(mix(RED_SH, DARK, 0.3))); c.drawLine(hx - 12, -143, hx + 12, -143, SP(RED_HI, 2.4, 220))
    c.drawPath(smooth_closed([(126, -168), (150, -182), (166, -178), (164, -162), (140, -158)]), P(RED_SH)); c.drawPath(smooth_closed([(132, -170), (150, -180), (160, -177), (150, -168)]), P(RED_HI, 200))   # door mirror
    hl = smooth_closed([(246, -136), (270, -128), (281, -108), (270, -104), (244, -116)]); c.drawPath(hl, P((255, 244, 214))); c.drawPath(hl, SP(DARK, 3)); c.drawCircle(262, -118, 5, P((255, 255, 255)))
    tl = smooth_closed([(-268, -154), (-278, -128), (-279, -108), (-264, -112), (-258, -146)]); c.drawPath(tl, P((255, 96, 70))); c.drawPath(tl, SP((120, 20, 40), 3))
    c.drawLine(-190, -240, -216, -284, SP(DARK, 3.5))                                                       # aerial
    c.drawPath(body, SP(mix(RED_SH, DARK, 0.5), 2.5, 170))
    c.restore()


if __name__ == '__main__':
    s = skia.Surface(1400, 700); c = s.getCanvas(); c.clear(skia.Color(214, 180, 134))
    car(c, 380, 560, 1.0); car(c, 1040, 560, 1.0, flip=True, dusk=1.0, sky=((250, 170, 130), (70, 60, 110)))
    s.makeImageSnapshot().save('out/test/car.png', skia.kPNG)
