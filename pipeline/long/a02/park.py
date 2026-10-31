"""The park scene, built in code with the Gemini reference ref/park.png as a guide (layout, colours, light).
Background in reference coordinates (1376x768) scaled to 1920x1080; the two characters are placed on a 2x zoom grid
of the reference (origin 600,320 in reference pixels), so they can move: breathing, the paramedic's radio arm, the
cyclist's arm, the ambulance light bar, swaying trees, drifting clouds and birds."""
import math
import numpy as np
import skia
from kit import C, P, SP, blur, sm, W, H
import body as B

S = 1920 / 1376.0
RIM = (255, 214, 120)


def sc(pts):
    return B.smooth_closed(pts)


def poly(pts):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    p.close(); return p


def flat(c, path, base, shade=None, off=(8, 2), rim=True, rim_d=(-3, 3), rim_a=230):
    """light from the right (low sun): shade on the left, rim on the right edges"""
    B.flat(c, path, base, shade, off=off, rim=False)
    if rim:
        q = skia.Path(path); q.offset(*rim_d)
        d = skia.Op(path, q, skia.PathOp.kDifference_PathOp)
        if d is not None:
            c.drawPath(d, P(RIM, rim_a))


def tree(c, x, y, r, col, shade, t, k):
    sway = 3 * math.sin(t * 0.8 + k)
    c.drawRect(skia.Rect(x - 7, y, x + 7, y + r * 1.4), P((110, 80, 60)))
    path = skia.Path()
    for dx, dy, rr in ((0, 0, 1.0), (-0.6, 0.35, 0.75), (0.6, 0.3, 0.8), (0.1, -0.55, 0.75), (-0.35, -0.3, 0.7)):
        path.addCircle(x + dx * r + sway * (1 - dy), y + dy * r, rr * r)
    path.setFillType(skia.PathFillType.kWinding)
    path = skia.Op(path, skia.Path(), skia.PathOp.kUnion_PathOp) or path
    flat(c, path, col, shade, off=(r * 0.25, r * 0.1))


def bush(c, x, y, r, col, shade, t=0, k=0, rim=True):
    sw = 2 * math.sin(t * 0.9 + k)
    path = skia.Path()
    for dx, rr in ((-0.8, 0.6), (-0.2, 0.85), (0.5, 0.7), (1.0, 0.5)):
        path.addCircle(x + dx * r + sw, y, rr * r)
    path.addRect(skia.Rect(x - 1.3 * r, y, x + 1.4 * r, y + r * 0.6))
    path.setFillType(skia.PathFillType.kWinding)
    path = skia.Op(path, skia.Path(), skia.PathOp.kUnion_PathOp) or path
    flat(c, path, col, shade, off=(r * 0.2, r * 0.1), rim=rim)


def background(c, t, warm=0.0):
    """sky to foreground, in reference pixels"""
    c.save(); c.scale(S, S)
    top = (205, 226, 236); hor = (252, 236, 196)
    if warm:
        top = tuple(a + (b - a) * warm for a, b in zip(top, (238, 196, 170))); hor = tuple(a + (b - a) * warm for a, b in zip(hor, (255, 200, 140)))
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 320)], [C(top), C(hor)])
    c.drawRect(skia.Rect(-10, -10, 1400, 800), skia.Paint(Shader=sh))
    c.drawCircle(1250 - 20 * warm, 120 + 140 * warm, 70, P((255, 236, 190), 120, MaskFilter=blur(50)))
    # skyline, hazy
    for x0, w, h in ((560, 40, 120), (605, 34, 90), (640, 48, 160), (690, 36, 110), (760, 50, 150), (815, 30, 210), (850, 46, 120),
                     (890, 40, 250), (935, 52, 170), (995, 36, 130), (1050, 46, 200), (1100, 40, 140), (1140, 56, 230), (1200, 42, 160), (1250, 50, 120)):
        c.drawRect(skia.Rect(x0, 300 - h, x0 + w, 310), P((196, 214, 224)))
        c.drawRect(skia.Rect(x0 + w * 0.65, 300 - h, x0 + w, 310), P((210, 224, 230)))
    c.drawRect(skia.Rect(500, 260, 1376, 320), P((206, 222, 226), 120, MaskFilter=blur(20)))
    # far hills
    hill = skia.Path(); hill.moveTo(0, 240); hill.cubicTo(200, 190, 380, 230, 520, 250); hill.cubicTo(700, 270, 900, 290, 1376, 280)
    hill.lineTo(1376, 400); hill.lineTo(0, 400); hill.close()
    c.drawPath(hill, P((140, 186, 150)))
    # clouds drifting
    for k, (x0, y0, r) in enumerate(((300, 70, 30), (900, 50, 24), (1150, 90, 20))):
        x = (x0 + t * 4) % 1500 - 60
        cl = skia.Path()
        for dx, rr in ((-1, 0.7), (0, 1), (1, 0.75)):
            cl.addCircle(x + dx * r, y0, rr * r)
        c.drawPath(cl, P((255, 250, 240), 150))
    # mid ground grass
    g = skia.Path(); g.moveTo(0, 300); g.cubicTo(300, 280, 500, 320, 760, 330); g.cubicTo(1000, 340, 1200, 330, 1376, 320)
    g.lineTo(1376, 800); g.lineTo(0, 800); g.close()
    c.drawPath(g, P((126, 182, 84)))
    for k, (x, y, r) in enumerate(((110, 190, 85), (300, 240, 55), (1330, 250, 55))):
        tree(c, x, y, r, (78, 140, 72), (56, 112, 58), t, k)
    for k, (x, y, r) in enumerate(((60, 420, 60), (200, 400, 50), (430, 340, 40), (560, 330, 38))):
        bush(c, x, y, r, (90, 150, 70), (66, 120, 56), t, k)
    # path
    road = skia.Path(); road.moveTo(0, 520); road.cubicTo(200, 440, 420, 410, 700, 400); road.cubicTo(950, 392, 1200, 380, 1376, 372)
    road.lineTo(1376, 400); road.cubicTo(1200, 404, 950, 412, 720, 420); road.cubicTo(480, 430, 330, 520, 230, 768); road.lineTo(0, 768); road.close()
    c.drawPath(road, P((126, 124, 140)))
    edge = skia.Path(); edge.moveTo(0, 520); edge.cubicTo(200, 440, 420, 410, 700, 400); edge.cubicTo(950, 392, 1200, 380, 1376, 372)
    c.drawPath(edge, SP((236, 236, 236), 6))
    e2 = skia.Path(); e2.moveTo(1376, 400); e2.cubicTo(1200, 404, 950, 412, 720, 420); e2.cubicTo(480, 430, 330, 520, 230, 768)
    c.drawPath(e2, SP((236, 236, 236), 6))
    # near grass lighter band
    ng = skia.Path(); ng.moveTo(380, 768); ng.cubicTo(460, 560, 700, 450, 1376, 420); ng.lineTo(1376, 768); ng.close()
    c.drawPath(ng, P((150, 196, 92)))
    c.restore()


def ambulance(c, t, lights=1.0):
    c.save(); c.scale(S, S)
    # body
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1000, 250, 1242, 392), 10, 10), P((250, 250, 252)))
    cab = sc([(930, 330), (960, 280), (1006, 266), (1010, 392), (930, 392)])
    c.drawPath(cab, P((240, 242, 246)))
    c.drawPath(sc([(944, 322), (968, 286), (1000, 280), (1000, 322)]), P((120, 140, 180)))
    c.drawRect(skia.Rect(930, 330, 1242, 346), P((224, 58, 60)))
    c.drawRect(skia.Rect(1100, 262, 1120, 282), P((224, 58, 60))); c.drawRect(skia.Rect(1220, 262, 1236, 282), P((224, 58, 60)))
    c.drawRect(skia.Rect(1000, 250, 1242, 260), P((222, 226, 234)))
    for x in (970, 1180):
        c.drawCircle(x, 392, 24, P((44, 44, 56))); c.drawCircle(x, 392, 10, P((150, 150, 160)))
    # light bar: red and blue alternating with a soft spill on the ground
    ph = (t * 3.2) % 1
    red, blue = (1.0 if ph < 0.5 else 0.25) * lights, (0.25 if ph < 0.5 else 1.0) * lights
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(990, 252, 1080, 266), 4, 4), P((60, 60, 70)))
    c.drawRect(skia.Rect(992, 254, 1034, 264), P((255, 70, 70), 120 + 135 * red))
    c.drawRect(skia.Rect(1036, 254, 1078, 264), P((90, 130, 255), 120 + 135 * blue))
    c.drawCircle(1012, 258, 40, P((255, 80, 80), 90 * red, MaskFilter=blur(20), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(1058, 258, 40, P((90, 130, 255), 90 * blue, MaskFilter=blur(20), BlendMode=skia.BlendMode.kScreen))
    c.drawOval(skia.Rect(900, 390, 1280, 440), P((255, 80, 80) if ph < 0.5 else (90, 130, 255), 26 * lights, MaskFilter=blur(24)))
    c.restore()


def bike(c):
    c.save(); c.scale(S, S)
    for cx, cy in ((358, 600), (548, 668)):
        c.drawOval(skia.Rect(cx - 80, cy - 40, cx + 80, cy + 40), SP((40, 40, 52), 9))
        c.drawOval(skia.Rect(cx - 10, cy - 5, cx + 10, cy + 5), P((80, 80, 90)))
    fr = skia.Path(); fr.moveTo(358, 600); fr.lineTo(450, 590); fr.lineTo(548, 668); fr.moveTo(450, 590); fr.lineTo(420, 620); fr.lineTo(358, 600)
    fr.moveTo(450, 590); fr.lineTo(470, 545); fr.moveTo(420, 620); fr.lineTo(600, 590)
    c.drawPath(fr, SP((210, 50, 56), 9))
    c.drawPath(sc([(455, 540), (500, 534), (505, 546), (460, 552)]), P((40, 40, 52)))
    c.drawPath(sc([(590, 575), (620, 568), (626, 580), (598, 590)]), P((40, 40, 52)))
    c.restore()


# ---------------------------------------------------------------- characters on the 2x zoom grid
TEAL, TEAL_SH = (32, 168, 152), (20, 124, 112)
SKIN, SKIN_SH = (247, 166, 129), (214, 120, 86)
NAVYU, NAVYU_SH = (44, 58, 112), (30, 40, 82)
BLACK, BLACK_SH = (36, 40, 44), (24, 26, 30)
HAIRB = (128, 66, 44)


def limb(c, a, b, wa, wb, col, sh):
    flat(c, B.limb_path(a, b, wa, wb), col, sh, off=(6, 0))


def shaped_limb(c, pts_a, pts_b, col, sh, off=(6, 0)):
    """a limb as one smooth outline: pts_a run down one edge, pts_b back up the other"""
    flat(c, sc(list(pts_a) + list(pts_b)[::-1]), col, sh, off=off)


def hand(c, at, ang, s, col=None, sh=None, kind='open', thumb=1):
    """the house hand in the park scale: palm, fingers with crease lines and a thumb; ang points the fingers.
    kind 'open' (relaxed), 'grip' (fingers wrapped, seen from the back), 'rest' (flat on a knee).
    thumb +1/-1 picks which side the thumb sits on."""
    col = col or SKIN; sh = sh or SKIN_SH
    c.save(); c.translate(*at); c.rotate(ang - 90); c.scale(s, s)
    T = thumb
    if kind == 'grip':
        pts = [(-15, -4), (15, -4), (18, 14), (20, 30), (14, 40), (0, 42), (-14, 40), (-19, 28), (-18, 12)]
        flat(c, sc(pts), col, sh, off=(3, 0))
        for fx in (-8, 0, 8):
            c.drawLine(fx, 24, fx, 40, SP(sh, 2.6, 200))
        th = sc([(T * 10, 4), (T * 24, 14), (T * 26, 24), (T * 16, 24), (T * 8, 16)])
        flat(c, th, col, sh, off=(2, 0), rim=False)
    else:
        L = T
        pts = [(-12, -2), (12, -2), (L * 15, 12), (L * 30, 22), (L * 32, 30), (L * 18, 32), (L * 15, 44), (L * 11, 60), (L * 3, 64),
               (-L * 5, 63), (-L * 12, 56), (-L * 15, 44), (-L * 15, 14)]
        flat(c, sc(pts), col, sh, off=(3, 0))
        for fx in (-7, 0, 7):
            c.drawLine(fx, 44, fx * 1.05, 58 - abs(fx) * 0.3, SP(sh, 2.4, 190))
    c.restore()


def face_eyes(c, xs, y, r=6):
    for ex in xs:
        c.drawOval(skia.Rect(ex - r * 0.8, y - r, ex + r * 0.8, y + r), P((50, 30, 30)))


def cyclist(c, t, arm_lift=0.0, wound=0.0):
    """sitting on the grass, left knee up, holding his cut left forearm with his right hand (from ref/park.png)"""
    br = 1.5 * math.sin(t * 2.0)
    SOCK = (232, 236, 242); SHOE, SHOE_SH = (40, 46, 50), (26, 30, 34)
    # extended right leg (far from the paramedic): thigh in the shorts, shin, sock, shoe pointing up
    shaped_limb(c, [(150, 560), (330, 590), (470, 628)], [(140, 640), (330, 650), (466, 662)], SKIN, SKIN_SH)
    c.drawPath(sc([(456, 626), (494, 622), (500, 664), (460, 668)]), P(SOCK))
    flat(c, sc([(486, 606), (520, 596), (560, 610), (572, 660), (530, 690), (496, 676), (488, 640)]), SHOE, SHOE_SH, off=(6, 0))
    # bent left leg: thigh up to the knee, shin down to the foot
    flat(c, B.union(B.limb_path((280, 540), (372, 424), 84, 64), B.limb_path((372, 424), (458, 572), 60, 40)), SKIN, SKIN_SH, off=(8, 0))
    c.drawArc(skia.Rect(360, 410, 396, 440), 200, 120, False, SP(SKIN_SH, 3, 150))
    c.drawPath(sc([(440, 560), (476, 556), (484, 594), (446, 598)]), P(SOCK))
    flat(c, sc([(452, 578), (498, 568), (540, 584), (548, 630), (500, 648), (466, 640), (456, 606)]), SHOE, SHOE_SH, off=(6, 0))
    # shorts (bike shorts, to above the knee)
    shorts = sc([(92, 474), (230, 470), (300, 446), (352, 440), (380, 470), (330, 560), (330, 610), (160, 628), (96, 606), (84, 540)])
    flat(c, shorts, BLACK, BLACK_SH, off=(8, 0))
    c.save(); c.translate(0, -br)
    # jersey
    torso = sc([(90, 288), (150, 258), (205, 248), (262, 256), (304, 282), (296, 380), (278, 470), (262, 524), (104, 524), (84, 420)])
    flat(c, torso, TEAL, TEAL_SH, off=(10, 0))
    c.drawLine(206, 266, 206, 500, SP(TEAL_SH, 3))
    c.drawPath(sc([(168, 246), (206, 258), (246, 248), (240, 270), (206, 276), (172, 268)]), P(TEAL_SH))
    # the hurt left forearm lies across his body; the forearm lifts on cue
    el = np.array([292.0, 392.0])
    ang = math.radians(14 - 110 * arm_lift)
    dv = np.array([math.cos(ang), math.sin(ang)])
    wr = el + 196 * dv
    flat(c, B.limb_path((270, 300), el, 46, 40), SKIN, SKIN_SH, off=(6, 0))
    flat(c, B.limb_path(el, wr, 42, 30), SKIN, SKIN_SH, off=(6, 0))
    flat(c, poly([(244, 262), (290, 274), (310, 300), (304, 344), (258, 346)]), TEAL, TEAL_SH, off=(6, 0))          # sleeve
    hand(c, wr - dv * 4, math.degrees(ang) + 30, 1.25, kind='open', thumb=-1)
    if wound > 0:
        cut = el + 0.72 * (wr - el)
        nrm = np.array([-math.sin(ang), math.cos(ang)])
        a = cut - nrm * 4 - 16 * dv; b = cut - nrm * 6 + 16 * dv
        c.drawLine(*a, *b, SP((170, 30, 40), 6, 255 * wound))
        c.drawCircle(*cut, 40, P((255, 120, 90), 90 * wound, MaskFilter=blur(14)))
    # his right arm, near us: sleeve, upper arm down to the elbow, forearm up to the hand gripping above the cut
    shd, rel = np.array([112.0, 312.0]), np.array([150.0, 452.0])
    grip = el + 60 * dv + np.array([0, -6])
    flat(c, B.limb_path(shd, rel, 48, 40), SKIN, SKIN_SH, off=(6, 0))
    flat(c, B.limb_path(rel, grip - np.array([10, -4]), 40, 32), SKIN, SKIN_SH, off=(6, 0))
    flat(c, poly([(84, 300), (120, 270), (162, 278), (172, 312), (160, 368), (100, 382), (82, 340)]), TEAL, TEAL_SH, off=(8, 0))
    hand(c, grip, -70, 1.3, kind='grip', thumb=1)
    # neck, head, helmet with straps
    flat(c, sc([(190, 230), (236, 230), (238, 268), (192, 270)]), SKIN, SKIN_SH, rim=False)
    head = sc([(172, 160), (214, 142), (286, 154), (298, 194), (292, 232), (262, 258), (222, 262), (188, 236), (174, 200)])
    flat(c, head, SKIN, SKIN_SH, off=(8, 0))
    ear = skia.Path(); ear.addOval(skia.Rect(160, 170, 184, 204)); flat(c, ear, SKIN, SKIN_SH, rim=False)
    c.drawPath(sc([(156, 152), (220, 140), (300, 148), (304, 170), (270, 166), (236, 172), (200, 166), (170, 176)]), P((140, 90, 60)))
    face_eyes(c, (236, 274), 194, 6)
    c.drawLine(222, 178, 244, 171, SP((110, 64, 44), 4)); c.drawLine(266, 171, 288, 178, SP((110, 64, 44), 4))   # worried brows
    c.drawOval(skia.Rect(250, 204, 262, 214), P(SKIN_SH, 200))
    c.drawArc(skia.Rect(240, 230, 262, 242), 200, 140, False, SP((160, 80, 66), 3.2))
    helm = sc([(150, 148), (176, 96), (236, 70), (300, 82), (326, 126), (318, 160), (240, 150), (168, 160)])
    flat(c, helm, (244, 246, 250), (200, 206, 216), off=(10, 0))
    for k in range(4):
        c.drawPath(sc([(196 + k * 28, 94 + k * 2), (214 + k * 28, 92 + k * 2), (218 + k * 28, 132), (204 + k * 28, 134)]), P((60, 66, 80)))
    c.drawPath(sc([(150, 150), (326, 140), (326, 160), (150, 166)]), P((50, 54, 66)))
    c.drawLine(182, 164, 214, 254, SP((50, 54, 66), 4)); c.drawLine(214, 254, 240, 250, SP((50, 54, 66), 4))
    c.restore()
    return el, wr


def paramedic(c, t, radio=0.0, part='body'):
    """kneeling at his side (from ref/park.png): bob haircut, navy uniform with reflective bands, radio on her chest.
    part 'body' draws everything except her right forearm and hand, 'front' draws those over the cyclist."""
    br = 1.5 * math.sin(t * 1.8 + 1)
    BAND = (196, 202, 214)
    shd_r = np.array([560.0, 262.0]); el_r = np.array([476.0, 318.0]); hd_r = np.array([372.0, 372.0])
    if part == 'front':
        c.save(); c.translate(0, -br)
        flat(c, B.limb_path(el_r, hd_r + np.array([22, -8]), 46, 38), NAVYU, NAVYU_SH, off=(6, 0))
        c.drawPath(sc([(386, 352), (404, 346), (410, 392), (392, 398)]), P(NAVYU_SH))                       # cuff
        hand(c, hd_r, 200, 1.3, kind='grip', thumb=-1)
        c.restore()
        return
    # legs: right knee up in front of her, left knee on the ground with the foot behind
    shaped_limb(c, [(700, 430), (680, 520), (650, 604)], [(760, 470), (740, 560), (720, 622)], NAVYU, NAVYU_SH, off=(10, 0))
    flat(c, sc([(700, 586), (776, 566), (840, 590), (846, 630), (760, 640), (706, 632)]), (30, 36, 60), (20, 24, 44), off=(6, 0))
    for y in (572, 600):
        c.drawLine(744, y - 8, 790, y - 14, SP(BAND, 8))
    shaped_limb(c, [(640, 420), (560, 400), (500, 410)], [(660, 480), (570, 452), (530, 460)], NAVYU, NAVYU_SH, off=(8, 0))
    shaped_limb(c, [(492, 404), (488, 500), (494, 600)], [(548, 436), (546, 520), (548, 604)], NAVYU, NAVYU_SH, off=(8, 0))
    for y in (510, 548):
        c.drawLine(490, y, 548, y, SP(BAND, 9))
    flat(c, sc([(470, 596), (556, 592), (568, 634), (462, 640)]), (30, 36, 60), (20, 24, 44), off=(6, 0))
    c.save(); c.translate(0, -br)
    # jacket
    torso = sc([(548, 222), (612, 198), (684, 200), (724, 226), (744, 310), (756, 410), (700, 432), (604, 428), (574, 360), (552, 280)])
    flat(c, torso, NAVYU, NAVYU_SH, off=(10, 0))
    c.drawPath(sc([(590, 410), (756, 400), (758, 424), (594, 432)]), P((30, 40, 82)))                     # belt
    c.drawPath(sc([(596, 206), (628, 204), (612, 232)]), P((240, 240, 244)))                               # collar
    c.drawLine(612, 232, 618, 400, SP(NAVYU_SH, 3))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(566, 280, 604, 292), 3, 3), P(BAND))
    # radio on her chest
    rx, ry = 650, 228
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(rx - 17, ry, rx + 17, ry + 64), 6, 6), P((30, 32, 40)))
    c.drawRect(skia.Rect(rx - 11, ry + 8, rx + 11, ry + 24), P((120, 140, 150)))
    c.drawLine(rx + 10, ry, rx + 12, ry - 26, SP((30, 32, 40), 5))
    for k in range(3):
        for j in range(3):
            c.drawCircle(rx - 9 + j * 9, ry + 34 + k * 9, 2.4, P((90, 96, 110)))
    # her right upper arm, reaching toward his forearm (forearm and hand come in 'front')
    flat(c, B.limb_path(shd_r, el_r, 50, 46), NAVYU, NAVYU_SH, off=(8, 0))
    c.drawLine(*(shd_r + (el_r - shd_r) * 0.45 + np.array([-8, -22])), *(shd_r + (el_r - shd_r) * 0.45 + np.array([10, 22])), SP(BAND, 9))
    # her left arm: hand on her knee, or up to the radio
    sh_l = np.array([712.0, 262.0])
    hand_rest, hand_radio = np.array([540.0, 400.0]), np.array([640.0, 270.0])
    hd = hand_rest + (hand_radio - hand_rest) * sm(radio)
    el_l = np.array([712.0, 384.0]) + (np.array([700.0, 320.0]) - np.array([712.0, 384.0])) * sm(radio)
    flat(c, B.limb_path(sh_l, el_l, 50, 44), NAVYU, NAVYU_SH, off=(8, 0))
    c.drawLine(*(sh_l + (el_l - sh_l) * 0.5 + np.array([-24, 0])), *(sh_l + (el_l - sh_l) * 0.5 + np.array([24, 0])), SP(BAND, 9))
    flat(c, B.limb_path(el_l, hd + (el_l - hd) / np.linalg.norm(el_l - hd) * 26, 44, 36), NAVYU, NAVYU_SH, off=(8, 0))
    ha = math.degrees(math.atan2(*(hd - el_l)[::-1]))
    hand(c, hd - (hd - el_l) / np.linalg.norm(hd - el_l) * 20, ha, 1.25, kind='grip' if radio > 0.5 else 'open', thumb=1)
    # head: neck, face, bob haircut
    flat(c, sc([(584, 182), (622, 182), (624, 214), (586, 216)]), SKIN, SKIN_SH, rim=False)
    hair_back = sc([(516, 110), (540, 44), (606, 18), (670, 36), (700, 96), (704, 170), (690, 196), (640, 200), (600, 196)])
    flat(c, hair_back, HAIRB, (100, 50, 34), off=(10, 0))
    face = sc([(528, 108), (556, 76), (620, 76), (644, 116), (640, 166), (604, 196), (562, 196), (534, 166)])
    flat(c, face, SKIN, SKIN_SH, off=(8, 0))
    c.drawPath(sc([(520, 116), (548, 52), (620, 38), (680, 70), (690, 130), (650, 110), (610, 82), (566, 96)]), P(HAIRB))
    face_eyes(c, (556, 598), 132, 6)
    c.drawLine(546, 116, 564, 114, SP((100, 50, 34), 3.5)); c.drawLine(588, 112, 606, 114, SP((100, 50, 34), 3.5))
    c.drawOval(skia.Rect(568, 146, 580, 156), P(SKIN_SH, 200))
    talk = 0.5 + 0.5 * math.sin(t * 14) if radio > 0.5 else 0
    c.drawOval(skia.Rect(566, 170 - 3 * talk, 588, 175 + 5 * talk), P((170, 80, 70)))
    c.restore()


def scene(c, t, arm_lift=0.0, wound=1.0, radio=0.0, lights=1.0, warm=0.0, birds=True):
    background(c, t, warm)
    ambulance(c, t, lights)
    bike(c)
    c.save(); c.scale(S, S); c.translate(600, 320); c.scale(0.5, 0.5)
    shadow = skia.Path(); shadow.addOval(skia.Rect(60, 560, 860, 700))
    c.drawPath(shadow, P((80, 130, 60), 110))
    c.restore()
    import parkpeople as PP           # the pair traced from the reference (Olivier 2026-10-30)
    PP.draw(c, S, t, talk=sm((radio - 0.5) / 0.3), wound=wound)
    # foreground bushes
    c.save(); c.scale(S, S)
    bush(c, 1260, 520, 90, (82, 140, 64), (60, 112, 52), t, 3)
    bush(c, 1300, 720, 110, (70, 126, 56), (52, 100, 46), t, 4)
    if birds:
        for k, (x0, y0) in enumerate(((520, 130), (560, 150), (1230, 100))):
            x = x0 - 10 * t % 300; f = math.sin(t * 8 + k)
            p = skia.Path(); p.moveTo(x - 8, y0 - 3 * f); p.quadTo(x - 3, y0 - 3, x, y0); p.quadTo(x + 3, y0 - 3, x + 8, y0 - 3 * f)
            c.drawPath(p, SP((110, 110, 130), 2))
    c.restore()
