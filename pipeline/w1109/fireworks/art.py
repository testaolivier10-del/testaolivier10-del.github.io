"""Monty Hall Short: the art. Stage set, doors, goat, car, the contestant seen from behind, the host's arm.
House flat layered style, all code. World coords = screen coords at zoom 1 (1080x1920)."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/fw']
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, lgrad, ik2
import layout as L

DOORX = {1: 215, 2: 540, 3: 865}
DW, DY0, DY1 = 250, 600, 1090
GOLD, GOLD_SH, GOLD_HI = (246, 196, 84), (186, 132, 44), (255, 236, 160)
BLUE, BLUE_SH, BLUE_HI = (46, 86, 184), (30, 58, 138), (86, 130, 222)
TEAL, RED = (64, 226, 206), (255, 92, 92)
SCREEN = skia.BlendMode.kScreen
PLUS = skia.BlendMode.kPlus


def op(a, b, k=skia.PathOp.kUnion_PathOp):
    try:
        r = skia.Op(a, b, k)
    except RuntimeError:
        r = None
    if r is None:
        r = skia.Path(a); r.addPath(b); r.setFillType(skia.PathFillType.kWinding)
    return r


def diffp(a, d):
    q = skia.Path(a); q.offset(*d)
    try:
        return skia.Op(a, q, skia.PathOp.kDifference_PathOp) or skia.Path()
    except RuntimeError:
        return skia.Path()


def shaded(c, path, base, shade=None, sh=(-12, -4), rimL=None, rimR=None, rl=(5, 3), rr=(-4, 3), a=255):
    """flat fill, one shade band, thin rims (backlight on both edges, stronger on the key side)"""
    c.drawPath(path, P(base, a))
    if shade is not None: c.drawPath(diffp(path, sh), P(shade, a))
    if rimL is not None: c.drawPath(diffp(path, rl), P(rimL, a))
    if rimR is not None: c.drawPath(diffp(path, rr), P(rimR, a * 0.75))


def tube(a, b, w0, w1):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d
    p = poly([(ax + nx * w0 / 2, ay + ny * w0 / 2), (bx + nx * w1 / 2, by + ny * w1 / 2), (bx - nx * w1 / 2, by - ny * w1 / 2), (ax - nx * w0 / 2, ay - ny * w0 / 2)])
    c0 = skia.Path(); c0.addCircle(ax, ay, w0 / 2); c1 = skia.Path(); c1.addCircle(bx, by, w1 / 2)
    return op(op(p, c0), c1)


def glow(c, x, y, r, col, a=255, mode=SCREEN):
    sh = skia.GradientShader.MakeRadial((x, y), r, [C(col, a), C(col, 0)], [0, 1])
    c.drawCircle(x, y, r, skia.Paint(Shader=sh, BlendMode=mode, AntiAlias=True))


def text(c, s, x, y, size, col, a=255, face=None):
    f = skia.Font(face or L.BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias)
    w = f.measureText(s)
    c.drawString(s, x - w / 2, y, f, P(col, a))
    return w


# ------------------------------------------------------------------------------------------------ the stage
_RS = np.random.default_rng(11)
MOTES = [(_RS.uniform(0, 1080), _RS.uniform(380, 1300), _RS.uniform(1.5, 4.5), _RS.uniform(0, 6.28), _RS.uniform(0.3, 1.0)) for _ in range(46)]


def backdrop(c, t, warm=0.0):
    """far layer: wall, curtains, marquee bulbs"""
    lgrad(c, skia.Rect(-600, -400, 1680, 2400), 0, 1920, [(26, 18, 62), (38, 22, 78), (20, 14, 50)], [0, 0.45, 1])
    # velvet curtain folds, swaying a little
    for k in range(-6, 22):
        x = k * 78 + 6 * math.sin(t * 0.5 + k * 0.9)
        col = (104, 34, 84) if k % 2 == 0 else (72, 22, 66)
        p = poly([(x, -400), (x + 80, -400), (x + 84 + 5 * math.sin(t * 0.4 + k), 1130), (x - 2, 1130)])
        c.drawPath(p, P(mix(col, (255, 190, 110), 0.10 * warm)))
        c.drawRect(skia.Rect(x + 58, -400, x + 80, 1130), P((40, 12, 46), 110))
        c.drawRect(skia.Rect(x + 4, -400, x + 12, 1130), P((168, 70, 120), 70))
    lgrad(c, skia.Rect(-600, -400, 1680, 760), 200, 760, [(10, 8, 30, 240), (10, 8, 30, 0)])
    for k in range(14):                                    # a soft sunburst on the curtain behind the doors
        an = math.radians(-90 + (k - 6.5) * 13 + 2 * math.sin(t * 0.2))
        c.drawPath(poly([(540, 1100), (540 + 1500 * math.cos(an - 0.045), 1100 + 1500 * math.sin(an - 0.045)), (540 + 1500 * math.cos(an + 0.045), 1100 + 1500 * math.sin(an + 0.045))]),
                   skia.Paint(AntiAlias=True, Color=C((255, 150, 190), 16 + 8 * warm), BlendMode=SCREEN))
    for sx, col in ((-1, (64, 226, 206)), (1, (255, 120, 190))):   # neon strips on the side pillars
        x = 540 + sx * 512
        c.drawRect(skia.Rect(x - 34, -400, x + 34, 1130), P((26, 14, 52)))
        c.drawRect(skia.Rect(x - 5, 420, x + 5, 1090), skia.Paint(AntiAlias=True, Color=C(col, 150), MaskFilter=blur(12), BlendMode=SCREEN))
        c.drawRect(skia.Rect(x - 3, 420, x + 3, 1090), P(mix(col, (255, 255, 255), 0.5)))
    # valance with scallops
    v = skia.Path(); v.moveTo(-200, -400); v.lineTo(1280, -400); v.lineTo(1280, 404)
    for k in range(12, -3, -1):
        x1 = k * 110 - 60
        v.quadTo(x1 + 55, 462, x1, 404)
    v.close()
    c.drawPath(v, P((58, 18, 60)))
    c.drawPath(diffp(v, (0, -6)), P(GOLD_SH, 120))
    # marquee bulbs chasing
    n = 23; ph = int(t * 5)
    for i in range(n):
        u = i / (n - 1); x = 40 + 1000 * u; y = 478 - 20 * math.sin(math.pi * u)
        on = (i + ph) % 3 == 0
        if on: glow(c, x, y, 34, (255, 214, 120), 150)
        c.drawCircle(x, y, 9, P((255, 232, 170) if on else (150, 104, 60)))


def floor(c, t, door_cols, warm=0.0):
    c.drawRect(skia.Rect(-600, 1090, 1680, 1122), P((64, 44, 112)))
    c.drawRect(skia.Rect(-600, 1090, 1680, 1096), P((126, 100, 190)))
    lgrad(c, skia.Rect(-600, 1122, 1680, 2400), 1122, 1700, [(34, 26, 84), (14, 12, 40)])
    # glossy reflections of the doors
    for i, col in door_cols.items():
        x = DOORX[i]
        sh = skia.GradientShader.MakeLinear([skia.Point(0, 1122), skia.Point(0, 1520)], [C(col, 120), C(col, 0)])
        c.drawRect(skia.Rect(x - 112, 1122, x + 112, 1520), skia.Paint(Shader=sh, MaskFilter=blur(14), BlendMode=SCREEN))
    for rr_, al in ((250, 70), (170, 60)):                 # her spotlight pool on the floor
        c.drawOval(skia.Rect(378 - rr_ * 1.5, 1640 - rr_ * 0.34, 378 + rr_ * 1.5, 1640 + rr_ * 0.34), skia.Paint(AntiAlias=True, Color=C((200, 190, 255), al), BlendMode=SCREEN, MaskFilter=blur(18)))
    for k in range(7):                                     # floor board seams running toward the doors
        x = 540 + (k - 3) * 250
        c.drawLine(540 + (k - 3) * 170, 1122, x + (k - 3) * 260, 1920, SP((120, 104, 190), 2, 34))
    if warm > 0:
        sh = skia.GradientShader.MakeRadial((540, 1122), 760, [C((255, 206, 110), 150 * warm), C((255, 206, 110), 0)])
        c.drawRect(skia.Rect(-600, 1090, 1680, 2400), skia.Paint(Shader=sh, BlendMode=SCREEN))


def lights(c, t, amt=1.0):
    """two slow sweeping spot cones and dust in the beams (screen blended so light reads as light)"""
    for sx, ph, col in ((-40, 0.0, (150, 170, 255)), (1120, 2.1, (255, 190, 150))):
        tx = 540 + (-1 if sx < 0 else 1) * -120 + 150 * math.sin(t * 0.33 + ph)
        p = poly([(sx, 120), (tx - 190, 1140), (tx + 190, 1140)])
        sh = skia.GradientShader.MakeLinear([skia.Point(0, 120), skia.Point(0, 1140)], [C(col, 70 * amt), C(col, 14 * amt)])
        c.drawPath(p, skia.Paint(Shader=sh, MaskFilter=blur(26), BlendMode=SCREEN, AntiAlias=True))
    for x, y, r, ph, sp in MOTES:
        yy = 380 + ((y - 380 - t * 9 * sp) % 920); xx = x + 14 * math.sin(t * 0.4 * sp + ph)
        a = 40 + 60 * (0.5 + 0.5 * math.sin(t * 1.3 * sp + ph))
        c.drawCircle(xx, yy, r, skia.Paint(AntiAlias=True, Color=C((255, 236, 200), a * amt), BlendMode=SCREEN, MaskFilter=blur(1.2)))


def audience(c, t):
    """out of focus heads in the near corners"""
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(7, 7)))
    for x, y, r, ph in ((-30, 1450, 108, 0), (140, 1600, 100, 1.3), (1110, 1440, 110, 2.2), (950, 1610, 96, 0.6), (-110, 1680, 130, 3.0), (1180, 1690, 130, 4.1)):
        yy = y + 5 * math.sin(t * 0.9 + ph)
        c.drawCircle(x, yy, r, P((9, 8, 26)))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - r * 1.5, yy + r * 0.8, x + r * 1.5, yy + r * 4), 80, 80), P((9, 8, 26)))
        c.drawPath(diffp(skia.Path().addCircle(x, yy, r), (0, 6)), P((120, 90, 170), 120))
    c.restore()


# ------------------------------------------------------------------------------------------------ doors
def _door_face(c, lit=0.0):
    """closed door artwork in a local 250 x 490 box"""
    c.drawRect(skia.Rect(0, 0, 250, 490), P(mix(BLUE, BLUE_HI, 0.35 * lit)))
    c.drawRect(skia.Rect(196, 0, 250, 490), P(BLUE_SH, 150))
    for y0, y1 in ((34, 226), (262, 456)):
        r = skia.RRect.MakeRectXY(skia.Rect(34, y0, 216, y1), 14, 14)
        c.drawRRect(r, P(BLUE_SH)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(40, y0 + 8, 216, y1), 12, 12), P(mix(BLUE, BLUE_HI, 0.18 + 0.3 * lit)))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(40, y0 + 8, 216, y0 + 20), 8, 8), P(BLUE_HI, 120))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(222, 204, 234, 316), 6, 6), P(GOLD_SH))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(222, 204, 230, 316), 5, 5), P(GOLD_HI))


def handle_pt(i, a):
    """world point of the middle of door i's handle bar at opening angle a (degrees)"""
    x0 = DOORX[i] - DW / 2
    m = door_matrix(i, a)
    p = m.mapXY(228, 260)
    return (p.x(), p.y())


def door_matrix(i, a):
    x0 = DOORX[i] - DW / 2
    ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
    wd = max(6.0, 250 * ca); dy = 26 * sa
    m = skia.Matrix()
    m.setPolyToPoly([skia.Point(0, 0), skia.Point(250, 0), skia.Point(250, 490), skia.Point(0, 490)],
                    [skia.Point(x0, DY0), skia.Point(x0 + wd, DY0 - dy), skia.Point(x0 + wd, DY1 + dy * 0.6), skia.Point(x0, DY1)])
    return m


def handle_bar(c, i, a):
    c.save(); c.concat(door_matrix(i, a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(222, 204, 234, 316), 6, 6), P(GOLD_SH))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(222, 204, 230, 316), 5, 5), P(GOLD_HI))
    c.restore()


def door(c, i, a=0.0, interior=None, lit=0.0, frame_glow=None, t=0.0):
    cx = DOORX[i]; x0, x1 = cx - DW / 2, cx + DW / 2
    # gold frame
    fr = skia.Path(); fr.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 16, DY0 - 16, x1 + 16, DY1 + 6), 14, 14))
    if frame_glow is not None:
        col, ga = frame_glow
        c.drawPath(fr, skia.Paint(AntiAlias=True, Color=C(col, 230 * ga), MaskFilter=blur(26), BlendMode=SCREEN))
        c.drawPath(fr, skia.Paint(AntiAlias=True, Color=C(col, 255 * ga), Style=skia.Paint.kStroke_Style, StrokeWidth=12, MaskFilter=blur(5), BlendMode=SCREEN))
    c.drawPath(fr, P(GOLD_SH)); c.drawPath(diffp(fr, (5, 5)), P(GOLD_HI)); c.drawRect(skia.Rect(x0 - 8, DY0 - 8, x1 + 8, DY1), P(GOLD))
    c.drawRect(skia.Rect(x0, DY0, x1, DY1), P((14, 10, 26)))
    if a > 0.5 and interior is not None:
        c.save(); c.clipRect(skia.Rect(x0, DY0, x1, DY1), skia.ClipOp.kIntersect, True)
        interior(c, cx)
        c.restore()
    # the door panel, hinged on the left, swinging toward the camera
    ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
    wd = max(6.0, 250 * ca); dy = 26 * sa
    m = skia.Matrix()
    m.setPolyToPoly([skia.Point(0, 0), skia.Point(250, 0), skia.Point(250, 490), skia.Point(0, 490)],
                    [skia.Point(x0, DY0), skia.Point(x0 + wd, DY0 - dy), skia.Point(x0 + wd, DY1 + dy * 0.6), skia.Point(x0, DY1)])
    if a > 0.5:   # shadow of the open door on the floor
        c.drawPath(poly([(x0, DY1), (x0 + wd, DY1 + dy * 0.6), (x0 + wd + 30, DY1 + dy * 0.6 + 16), (x0 + 10, DY1 + 12)]), P((6, 4, 20), 120, MaskFilter=blur(6)))
    c.save(); c.concat(m)
    _door_face(c, lit)
    if a > 0.5: c.drawRect(skia.Rect(0, 0, 250, 490), P((10, 12, 40), 150 * sa))
    c.restore()
    if a > 0.5:   # the lit edge of the open door
        c.drawLine(x0 + wd, DY0 - dy, x0 + wd, DY1 + dy * 0.6, SP(mix(BLUE_HI, (255, 240, 200), 0.5), 5))


def plaque(c, i, lit=0.0, col=GOLD):
    cx = DOORX[i]; y = 548
    if lit > 0: glow(c, cx, y, 70, col, 160 * lit)
    c.drawCircle(cx, y, 38, P(GOLD_SH)); c.drawCircle(cx - 1.5, y - 1.5, 36, P(GOLD_HI)); c.drawCircle(cx, y, 31, P((20, 16, 54)))
    text(c, str(i), cx, y + 17, 48, mix(GOLD, (255, 250, 220), 0.5 * lit))


def tag(c, s, x, y, col, size=58, scale=1.0, a=1.0, fill=(8, 12, 34)):
    if a <= 0.01 or scale <= 0.01: return
    f = skia.Font(L.BLACK, size); w = f.measureText(s)
    c.save(); c.translate(x, y); c.scale(scale, scale)
    r = skia.RRect.MakeRectXY(skia.Rect(-w / 2 - 26, -size * 0.80, w / 2 + 26, size * 0.50), size * 0.34, size * 0.34)
    c.drawRRect(r, P((0, 0, 0), 110 * a, MaskFilter=blur(10)))
    c.drawRRect(r, P(fill, 236 * a))
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=C(col, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=5))
    c.drawString(s, -w / 2, size * 0.16, f, P(col, 255 * a))
    c.restore()


def outline(c, x0, x1, col, u=1.0, a=1.0, y0=498, y1=1108):
    """a glowing rounded outline around a group of doors, drawn on from the top left (u 0..1)"""
    if u <= 0 or a <= 0: return
    p = skia.Path(); p.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 30, 30))
    ln = skia.PathMeasure(p, False).getLength()
    pe = skia.DashPathEffect.Make([ln * min(1.0, u), ln * 2], 0) if u < 1 else None
    for w, bl, al in ((22, 14, 120), (9, 0, 255)):
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=C(col, al * a), Style=skia.Paint.kStroke_Style, StrokeWidth=w, StrokeCap=skia.Paint.kRound_Cap,
                                 PathEffect=pe, MaskFilter=blur(bl) if bl else None, BlendMode=SCREEN if bl else skia.BlendMode.kSrcOver))


# ------------------------------------------------------------------------------------------------ what is behind the doors
def goat_room(c, cx, light=1.0):
    lgrad(c, skia.Rect(cx - 130, DY0, cx + 130, DY1), DY0, DY1, [(60, 40, 44), (92, 62, 50), (120, 86, 56)], [0, 0.6, 1])
    c.drawPath(poly([(cx - 50, DY0), (cx + 50, DY0), (cx + 150, DY1), (cx - 150, DY1)]), skia.Paint(AntiAlias=True, Color=C((255, 214, 150), 70 * light), BlendMode=SCREEN, MaskFilter=blur(10)))
    c.drawRect(skia.Rect(cx - 130, 1040, cx + 130, DY1), P((196, 158, 84)))
    for k in range(16):                                    # straw
        x = cx - 120 + k * 16
        c.drawLine(x, 1046 + (k * 7) % 11, x + 16, 1036 + (k * 5) % 9, SP((236, 204, 120), 3, 220))


def goat(c, x, y, t, s=1.0, look=0.0, bleat=0.0):
    """a goat facing left, feet at (x, y). look: head raise 0..1, bleat: mouth open 0..1"""
    CR, CR_SH, TAN, HOOF, HORN = (244, 236, 218), (206, 194, 178), (214, 164, 112), (70, 54, 50), (176, 140, 96)
    c.save(); c.translate(x, y); c.scale(s, s)
    br = 2.0 * math.sin(t * 1.6)
    for lx, far in ((-52, True), (88, True), (-80, False), (58, False)):       # legs
        col = mix(CR, (120, 100, 110), 0.35) if far else CR
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(lx - 11, -84, lx + 11, 0), 9, 9), P(col))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(lx - 12, -16, lx + 12, 0), 5, 5), P(HOOF))
    tail = 18 * math.sin(t * 5.0) * (0.5 + 0.5 * math.sin(t * 0.7))
    c.save(); c.translate(104, -150); c.rotate(-30 + tail)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-8, -34, 8, 6), 8, 8), P(CR)); c.restore()
    body = smooth_closed([(-96, -150 - br), (-40, -170 - br), (40, -168 - br), (96, -152), (114, -112), (100, -72), (40, -58), (-50, -58), (-100, -76), (-114, -116)])
    shaded(c, body, CR, CR_SH, sh=(-8, -12), rimL=(255, 244, 220), rl=(4, 5))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawPath(smooth_closed([(10, -180), (80, -176), (96, -130), (50, -112), (4, -134)]), P(TAN)); c.restore()
    # neck and head, pivoting at the shoulders
    c.save(); c.translate(-92, -128); c.rotate(-16 * look + 2.5 * math.sin(t * 1.1))
    neck = smooth_closed([(-22, -8), (18, -34), (2, -92), (-48, -96), (-60, -52)])
    shaded(c, neck, CR, CR_SH, sh=(-6, -8))
    c.translate(-40, -92)
    for hx, k in ((10, 0.8), (22, 1.0)):                   # horns sweeping back
        h = skia.Path(); h.moveTo(hx, -22); h.quadTo(hx + 34, -66, hx + 70, -52)
        c.drawPath(h, SP(mix(HORN, (90, 70, 60), 1 - k), 13))
    fl = 14 * max(0.0, math.sin(t * 2.3)) ** 6
    c.save(); c.translate(28, -6); c.rotate(28 + fl * 2.2)      # ear
    c.drawOval(skia.Rect(-8, -14, 56, 14), P(CR_SH)); c.drawOval(skia.Rect(0, -8, 48, 8), P((236, 178, 170))); c.restore()
    jaw = 5 * (0.5 + 0.5 * math.sin(t * 9.0)) * (1 - bleat) + 16 * bleat
    c.drawPath(smooth_closed([(-70, 14 + jaw), (-30, 16 + jaw), (-6, 8), (-30, 2), (-68, 4)]), P(CR_SH))       # lower jaw
    if bleat > 0.2: c.drawPath(smooth_closed([(-62, 8), (-30, 8), (-30, 14 + jaw * 0.7), (-60, 12 + jaw * 0.7)]), P((150, 60, 70)))
    head = smooth_closed([(30, -26), (0, -38), (-36, -24), (-72, -4), (-82, 8), (-70, 16), (-30, 12), (14, 16), (40, 0)])
    shaded(c, head, CR, CR_SH, sh=(-5, -7), rimL=(255, 246, 226), rl=(3, 4))
    c.drawOval(skia.Rect(-86, -2, -66, 14), P((236, 150, 150)))                                              # nose
    c.drawPath(smooth_closed([(-30, 12 + jaw), (-8, 10), (-4, 30), (-12, 52), (-22, 44)]), P(CR_SH))  # beard under the chin
    bl = 1.0 if (t % 3.7) < 0.12 else 0.0
    if bl: c.drawLine(-22, -10, -6, -10, SP((70, 54, 50), 4))
    else:
        c.drawCircle(-14, -10, 8.5, P((52, 40, 40))); c.drawCircle(-16.5, -12.5, 3, P((255, 255, 255)))
    c.restore(); c.restore()


def car_room(c, cx, light=1.0):
    lgrad(c, skia.Rect(cx - 130, DY0, cx + 130, DY1), DY0, DY1, [(255, 226, 150), (250, 190, 96), (226, 146, 62)], [0, 0.55, 1])
    for k in range(9):                                     # rays
        a = math.radians(-90 + (k - 4) * 22)
        c.drawPath(poly([(cx, 900), (cx + 700 * math.cos(a - 0.07), 900 + 700 * math.sin(a - 0.07)), (cx + 700 * math.cos(a + 0.07), 900 + 700 * math.sin(a + 0.07))]),
                   P((255, 246, 210), 54 * light))
    c.drawRect(skia.Rect(cx - 130, 1050, cx + 130, DY1), P((210, 140, 60)))


def car(c, x, y, t, s=1.0, beams=1.0):
    """a small red car seen from the front, wheels at (x, y)"""
    RD, RD_SH, RD_HI = (230, 60, 64), (172, 34, 48), (255, 128, 110)
    c.save(); c.translate(x, y + 1.5 * math.sin(t * 2.0)); c.scale(s, s)
    c.drawOval(skia.Rect(-120, -10, 120, 16), P((90, 50, 20), 120, MaskFilter=blur(6)))
    for sx in (-1, 1):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(sx * 94 - 20, -44, sx * 94 + 20, 4), 9, 9), P((34, 30, 44)))
    cab = smooth_closed([(-64, -190), (64, -190), (92, -118), (98, -100), (-98, -100), (-92, -118)])
    shaded(c, cab, RD, RD_SH, sh=(-8, -3), rimL=RD_HI)
    c.drawPath(smooth_closed([(-56, -178), (56, -178), (78, -116), (-78, -116)]), P((40, 58, 112)))
    c.drawPath(poly([(-40, -176), (-12, -176), (-40, -118), (-66, -118)]), P((150, 190, 250), 110))
    body = skia.Path(); body.addRRect(skia.RRect.MakeRectXY(skia.Rect(-112, -112, 112, -22), 30, 30))
    shaded(c, body, RD, RD_SH, sh=(-9, -4), rimL=RD_HI)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-112, -112, 112, -98), 14, 14), P(RD_HI, 150))
    for sx in (-1, 1):
        c.drawOval(skia.Rect(sx * 118 - 12, -128, sx * 118 + 12, -112), P(RD_SH))
        c.drawOval(skia.Rect(sx * 76 - 25, -92, sx * 76 + 25, -60), P((255, 250, 226)))
        c.drawOval(skia.Rect(sx * 76 - 16, -86, sx * 76 + 16, -66), P((255, 232, 150)))
        if beams > 0: glow(c, sx * 76, -76, 78, (255, 244, 200), 150 * beams, SCREEN)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-44, -84, 44, -56), 10, 10), P((40, 30, 40)))
    for k in range(3): c.drawRect(skia.Rect(-38, -78 + k * 8, 38, -75 + k * 8), P((190, 190, 204)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-116, -40, 116, -20), 9, 9), P((214, 214, 226)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-116, -40, 116, -33), 6, 6), P((250, 250, 255)))
    # the bow on the roof
    for sx in (-1, 1):
        lp = smooth_closed([(0, -196), (sx * 30, -232), (sx * 56, -214), (sx * 40, -190)])
        shaded(c, lp, GOLD, GOLD_SH, sh=(-4, -3), rimL=GOLD_HI, rl=(3, 3))
        c.drawPath(poly([(0, -194), (sx * 30, -170), (sx * 14, -164), (0, -186)]), P(GOLD_SH))
    c.drawCircle(0, -198, 11, P(GOLD_HI))
    c.restore()


def ghost_car(c, cx, a):
    """a faint glowing car shape with a question mark, on a closed door (it might be here)"""
    if a <= 0.01: return
    y = 900
    p = smooth_closed([(cx - 56, y - 66), (cx + 56, y - 66), (cx + 80, y - 20), (cx + 92, y + 40), (cx - 92, y + 40), (cx - 80, y - 20)])
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=C((255, 226, 150), 150 * a), BlendMode=SCREEN, MaskFilter=blur(9)))
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=C((255, 240, 190), 230 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=6, BlendMode=SCREEN))
    for sx in (-1, 1): c.drawOval(skia.Rect(cx + sx * 56 - 16, y - 2, cx + sx * 56 + 16, y + 18), P((255, 246, 210), 230 * a))
    text(c, '?', cx, y - 108, 120, (255, 236, 170), 240 * a)


# ------------------------------------------------------------------------------------------------ the contestant, from behind
SW, SW_SH, SW_RIM = (204, 192, 180), (138, 124, 144), (255, 240, 212)
SKIN_C, SKIN_SH_C = (232, 184, 150), (190, 138, 118)
HAIR_C, HAIR_SH_C, HAIR_RIM = (88, 44, 38), (58, 28, 30), (214, 130, 90)
X0, SHY = 378, 1262
U_ARM, F_ARM = 150.0, 136.0


def rest_hand(side):
    return (X0 + side * 166, SHY + 372)


def woman(c, t, yaw=0.0, pony=0.0, dy=0.0, sway=0.0, hl=None, hr=None, pl=None, pr=None, sq=1.0, rim_boost=0.0, arms_front=False):
    """hl / hr: hand positions (world) for the left / right arm, None = hanging. pl / pr: the point the finger aims at
    (None = relaxed hand). sq: squash and stretch (1 = none). All one figure: torso, then arms over it."""
    br = 3.0 * math.sin(t * 1.7)
    c.save(); c.translate(X0 + sway, SHY + 700); c.scale(1.0 / math.sqrt(sq), sq); c.translate(-(X0 + sway), -(SHY + 700)); c.translate(sway, dy)
    rimc = mix(SW_RIM, (255, 226, 150), rim_boost)
    c.drawOval(skia.Rect(X0 - 190, 1890, X0 + 190, 1930), P((4, 4, 16), 130, MaskFilter=blur(12)))
    legs = smooth_closed([(X0 - 132, SHY + 330), (X0 - 150, SHY + 420), (X0 - 140, SHY + 760), (X0 + 140, SHY + 760), (X0 + 150, SHY + 420), (X0 + 132, SHY + 330)])
    shaded(c, legs, (52, 70, 128), (34, 46, 92), sh=(-16, 0), rimL=(120, 150, 220), rimR=(110, 130, 200))
    c.drawLine(X0, SHY + 470, X0, SHY + 760, SP((34, 46, 92), 6))
    pts = [(-44, -40 - br), (-108, -26 - br), (-150, 4 - br), (-160, 60), (-152, 150), (-138, 300), (-146, 372), (-100, 384), (0, 388), (100, 384), (146, 372), (138, 300), (152, 150), (160, 60), (150, 4 - br), (108, -26 - br), (44, -40 - br), (0, -30 - br)]
    torso = smooth_closed([(X0 + x, SHY + y) for x, y in pts])
    # neck first, so the collar overlaps it
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(X0 - 27, SHY - 96 - br, X0 + 27, SHY - 14 - br), 16, 16), P(mix(SKIN_C, (60, 40, 70), 0.22)))
    c.drawRect(skia.Rect(X0 + 4, SHY - 96 - br, X0 + 27, SHY - 20 - br), P(SKIN_SH_C, 150))
    shaded(c, torso, SW, SW_SH, sh=(-16, -6), rimL=rimc, rimR=rimc, rl=(5, 4), rr=(-4, 4))
    col = smooth_closed([(X0 - 50, SHY - 46 - br), (X0, SHY - 60 - br), (X0 + 50, SHY - 46 - br), (X0 + 44, SHY - 24 - br), (X0, SHY - 12 - br), (X0 - 44, SHY - 24 - br)])
    c.drawPath(col, P(mix(SW, (255, 255, 255), 0.25))); c.drawPath(diffp(col, (0, -7)), P(SW_SH))
    c.drawLine(X0, SHY + 60, X0 + 3, SHY + 300, SP(SW_SH, 5, 90))        # the spine fold
    hem = skia.Path(); hem.addRRect(skia.RRect.MakeRectXY(skia.Rect(X0 - 148, SHY + 346, X0 + 148, SHY + 388), 16, 16))
    c.save(); c.clipPath(torso, skia.ClipOp.kIntersect, True); c.drawPath(hem, P(SW_SH, 130)); c.restore()
    def draw_arms():
        for side, hand, aim in ((-1, hl, pl), (1, hr, pr)):
            sh_pt = (X0 + side * 136, SHY + 22 - br)
            hp = hand if hand is not None else rest_hand(side)
            el = ik2(sh_pt, hp, U_ARM, F_ARM, bend=side)
            d = math.hypot(hp[0] - sh_pt[0], hp[1] - sh_pt[1])
            if d > U_ARM + F_ARM - 0.5:
                k = (U_ARM + F_ARM - 0.5) / d; hp = (sh_pt[0] + (hp[0] - sh_pt[0]) * k, sh_pt[1] + (hp[1] - sh_pt[1]) * k)
            arm = op(tube(sh_pt, el, 70, 56), tube(el, hp, 56, 44))
            # hand first (under the cuff)
            ang = math.atan2(hp[1] - el[1], hp[0] - el[0])
            hx, hy = hp[0] + 24 * math.cos(ang), hp[1] + 24 * math.sin(ang)
            skin = mix(SKIN_C, (60, 40, 70), 0.12)
            if aim is not None:
                fa = math.atan2(aim[1] - hy, aim[0] - hx)
                c.drawPath(tube((hx, hy), (hx + 46 * math.cos(fa), hy + 46 * math.sin(fa)), 17, 14), P(skin))            # index finger
                c.drawPath(tube((hx, hy), (hx + 22 * math.cos(fa + side * 1.25), hy + 22 * math.sin(fa + side * 1.25)), 15, 13), P(skin))   # thumb
                palm = skia.Path(); palm.addCircle(hx, hy, 23)
                shaded(c, palm, skin, SKIN_SH_C, sh=(-6, -4))
                for k in (1, 2, 3):                              # curled fingers as knuckles
                    kx = hx + 15 * math.cos(fa - side * (0.5 + 0.42 * k)); ky = hy + 15 * math.sin(fa - side * (0.5 + 0.42 * k))
                    c.drawCircle(kx, ky, 8.5, P(mix(skin, SKIN_SH_C, 0.45)))
            else:
                palm = tube((hx - 6 * math.cos(ang), hy - 6 * math.sin(ang)), (hx + 22 * math.cos(ang), hy + 22 * math.sin(ang)), 40, 30)
                shaded(c, palm, skin, SKIN_SH_C, sh=(-6, -4))
            c.drawPath(arm, P((40, 30, 60), 70, MaskFilter=blur(7)))             # soft contact shadow on the torso
            shaded(c, arm, SW, SW_SH, sh=(-12, -5), rimL=rimc, rimR=rimc, rl=(4, 3), rr=(-4, 3))
            cuff = tube((hp[0] - 20 * math.cos(ang), hp[1] - 20 * math.sin(ang)), (hp[0] + 4 * math.cos(ang), hp[1] + 4 * math.sin(ang)), 50, 48)
            c.drawPath(cuff, P(mix(SW, (255, 255, 255), 0.25))); c.drawPath(diffp(cuff, (-6, -3)), P(SW_SH))

    if not arms_front: draw_arms()
    # head (hair from behind), a little cheek when she turns
    hx0, hy0 = X0 + yaw * 5, SHY - 150 - br * 1.3
    c.save(); c.translate(hx0, hy0); c.rotate(yaw * 4.0)
    if abs(yaw) > 0.05:
        sx = -1 if yaw < 0 else 1; k = abs(yaw)
        ch = smooth_closed([(sx * 30, -52), (sx * (52 + 22 * k), -24), (sx * (56 + 26 * k), 10), (sx * (48 + 20 * k), 40), (sx * 20, 58), (0, 30), (0, -40)])
        c.drawPath(ch, P(SKIN_C)); c.drawPath(diffp(ch, (0, -10)), P(SKIN_SH_C, 170))
        c.drawPath(smooth_closed([(sx * (58 + 26 * k), -6), (sx * (68 + 34 * k), 6), (sx * (58 + 26 * k), 16)]), P(SKIN_C))     # nose tip
        c.drawLine(sx * (44 + 20 * k), -14, sx * (56 + 26 * k), -16, SP((70, 40, 40), 4, 220 * k))                                # lashes
    for sx in (-1, 1):                                         # ears: the far one hides behind the head as she turns
        vis = 1.0 - max(0.0, sx * -yaw) * 0.0 - max(0.0, sx * yaw) * 1.0
        vis = max(0.0, 1.0 - max(0.0, -sx * yaw * -1.0)) if False else max(0.0, 1.0 - max(0.0, sx * yaw) * 1.4)
        if vis > 0.05:
            ex = sx * (56 - 10 * abs(yaw))
            c.drawOval(skia.Rect(ex - 10, -12, ex + 10, 20), P(SKIN_C, 255 * vis)); c.drawOval(skia.Rect(ex - 4, -4, ex + 5, 14), P(SKIN_SH_C, 200 * vis))
    hair = smooth_closed([(-58, 0), (-60, -40), (-40, -74), (0, -86), (40, -74), (60, -40), (58, 0), (46, 34), (20, 52), (-20, 52), (-46, 34)])
    shaded(c, hair, HAIR_C, HAIR_SH_C, sh=(-12, -6), rimL=mix(HAIR_RIM, (255, 226, 150), rim_boost), rimR=HAIR_RIM, rl=(5, 4), rr=(-4, 4))
    # ponytail, swinging behind the turn
    c.save(); c.translate(0, -52); c.rotate(pony)
    pt = smooth_closed([(-20, -6), (20, -6), (26, 60), (16, 124), (0, 150), (-14, 122), (-24, 60)])
    shaded(c, pt, mix(HAIR_C, (120, 60, 50), 0.25), HAIR_SH_C, sh=(-8, -4), rimL=HAIR_RIM, rl=(4, 3))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-22, -12, 22, 10), 9, 9), P(TEAL))
    c.restore(); c.restore()
    if arms_front: draw_arms()
    c.restore()


# ------------------------------------------------------------------------------------------------ the host's arm (close on door 3)
def host_hand_back(c, hand):
    return


def host_hand_front(c, hand, grip=1.0):
    """the host's arm from the right: jacket sleeve, shirt cuff, and the shared hand model closing on the bar.
    The knuckles sit ON the bar; the bar shows above and below the fist."""
    import hands as H
    hx, hy = hand
    JK, JK_SH = (238, 230, 214), (184, 170, 170)
    S = 1.42; wr = (hx + 49 * S, hy + 2)
    el = (wr[0] + 300, wr[1] + 96)
    sl = tube(el, (wr[0] + 34, wr[1] + 10), 100, 66)
    c.drawPath(sl, P((6, 4, 20), 80, MaskFilter=blur(8)))
    shaded(c, sl, JK, JK_SH, sh=(0, -18), rimL=(255, 252, 240), rl=(0, 5))
    cuff = tube((wr[0] + 40, wr[1] + 12), (wr[0] + 6, wr[1] + 2), 58, 54)
    c.drawPath(cuff, P((250, 250, 255))); c.drawPath(diffp(cuff, (0, 8)), P((200, 204, 226)))
    c.drawCircle(wr[0] + 24, wr[1] + 30, 5.5, P(GOLD_HI))
    H.hand(c, wr, math.pi, 1, S, skin=(214, 160, 124), shade=(166, 112, 92), hi=(244, 200, 164), light=(-0.2, -0.8), **H.blend(H.OPEN, H.GRIP, grip))


# ------------------------------------------------------------------------------------------------ confetti
_CR = np.random.default_rng(5)
CONF = [(_CR.uniform(-60, 1140), _CR.uniform(0, 1), _CR.uniform(220, 420), _CR.uniform(0, 6.28), _CR.uniform(3, 8), [GOLD_HI, TEAL, (255, 120, 110), (255, 255, 255)][i % 4]) for i in range(90)]


def confetti(c, t, t0, amt=1.0):
    if t < t0: return
    for x, dly, v, ph, sp, col in CONF:
        u = t - t0 - dly * 1.4
        if u < 0: continue
        y = 300 + v * u + 30 * math.sin(u * 2 + ph)
        if y > 1500: continue
        xx = x + 40 * math.sin(u * 1.3 + ph)
        c.save(); c.translate(xx, y); c.rotate(math.degrees(u * sp + ph)); c.scale(1, abs(math.cos(u * sp * 0.8 + ph)) * 0.8 + 0.2)
        c.drawRect(skia.Rect(-9, -6, 9, 6), P(col, 235 * amt)); c.restore()
