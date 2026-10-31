"""Close ups, the ER, the chart tablet, the profile figure and the small teaching drawings, all code in the house style."""
import math
import numpy as np
import skia
from kit import C, P, SP, blur, sm, W, H, text, hand, CREAM, AMBER, CORAL, TEAL, NAVY, YELLOW, BLUE
import body as B
from body import smooth_closed as sc

SKIN, SKIN_SH = (247, 166, 129), (214, 120, 86)
TEALJ, TEALJ_SH = (32, 168, 152), (20, 124, 112)


def flat(c, path, base, shade=None, off=(-8, -3), rim=True, rim_d=(3, 3), rim_a=220):
    B.flat(c, path, base, shade, off=off, rim=rim, rim_d=rim_d, rim_a=rim_a)


# ---------------------------------------------------------------- the hurt forearm, close up (his LEFT arm, palm forward)
def arm_closeup(c, t, lift=0.0, cut=1.0, bruise=0.0, bandage=0.0, stitches=0.0, ox=0.0):
    """his LEFT arm, palm forward, seen from the front: the upper arm comes in from the left (toward his body), the
    elbow sits mid frame, the forearm hangs down (lift 0) or is raised (lift 1). The lateral (thumb) side is the side
    away from his body, the viewer's right, in both poses."""
    sh = np.array([-160.0 + ox, 520.0]); el = np.array([860.0 + ox, 480.0])
    ang = math.radians(88 - 176 * sm(lift))
    d = np.array([math.cos(ang), math.sin(ang)])
    wr = el + 300 * d
    flat(c, B.limb_path(sh, el, 200, 160), SKIN, SKIN_SH)
    flat(c, B.limb_path(sh, sh + (el - sh) * 0.45, 250, 230), TEALJ, TEALJ_SH)
    flat(c, B.limb_path(el, wr, 156, 118), SKIN, SKIN_SH)
    if bruise > 0:
        c.drawOval(skia.Rect(el[0] - 90, el[1] - 70, el[0] + 50, el[1] + 50), P((120, 70, 140), 150 * bruise, MaskFilter=blur(16)))
        c.drawOval(skia.Rect(el[0] - 64, el[1] - 46, el[0] + 26, el[1] + 30), P((90, 50, 120), 140 * bruise, MaskFilter=blur(8)))
    # hand: palm toward us, thumb on the screen right (lateral) in both poses
    up = d[1] < 0
    c.save(); c.translate(*wr); c.rotate(math.degrees(ang) - 90)
    c.scale(1.15 * (1 if up else -1), 1.15)
    palm = sc([(-50, -6), (50, -6), (52, 70), (30, 96), (-30, 96), (-52, 70)])
    fingers = skia.Path()
    for k, fl in enumerate((70, 82, 78, 62)):
        fx = 34 - k * 23
        fingers.addRRect(skia.RRect.MakeRectXY(skia.Rect(fx - 10, 80, fx + 10, 80 + fl), 10, 10))
    thumb = skia.Path(); thumb.addRRect(skia.RRect.MakeRectXY(skia.Rect(-80, 20, -56, 92), 12, 12))
    m = skia.Matrix(); m.setRotate(-26, -56, 20); thumb.transform(m)
    whole = B.union(B.union(palm, fingers), thumb)
    flat(c, whole, SKIN, SKIN_SH, off=(8, 0))
    c.drawArc(skia.Rect(-30, 14, 30, 70), 20, 140, False, SP(SKIN_SH, 4, 170))
    c.restore()
    # the cut: on the lateral (screen right) edge of the forearm, just proximal to the wrist
    along = el + 0.72 * (wr - el)
    cpos = along + np.array([52.0, 0.0])
    dd = d
    if cut > 0 and bandage < 0.99:
        a = cpos - dd * 32; b = cpos + dd * 30
        c.drawLine(*a, *b, SP((150, 26, 36), 9, 255 * cut * (1 - bandage)))
        c.drawLine(*a, *b, SP((220, 70, 70), 4, 255 * cut * (1 - bandage)))
    if stitches > 0:
        for k in range(4):
            q = cpos - dd * 24 + dd * 16 * k
            c.drawLine(q[0] - 10, q[1], q[0] + 10, q[1], SP((40, 40, 60), 3, 255 * sm(stitches * 4 - k)))
    if bandage > 0:
        r = skia.RRect.MakeRectXY(skia.Rect(cpos[0] - 70, cpos[1] - 50, cpos[0] + 20, cpos[1] + 50), 10, 10)
        c.drawRRect(r, P((250, 250, 248), 255 * bandage)); c.drawRRect(r, SP((214, 214, 220), 3, 255 * bandage))
    return dict(sh=sh, el=el, wr=wr, cut=cpos, d=d)


# ---------------------------------------------------------------- the emergency department bay (no reference: built in the house style)
def er_bg(c, t):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [C((206, 222, 214)), C((182, 204, 196))])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=sh))
    c.drawRect(skia.Rect(0, 760, W, H), P((214, 216, 222)))
    c.drawRect(skia.Rect(0, 760, W, 772), P((180, 186, 196)))
    # window light from the left
    c.drawPath(sc([(0, 120), (260, 120), (520, 1080), (0, 1080)]), P((255, 240, 200), 40))
    # curtain on a rail, gently moving
    c.drawRect(skia.Rect(1250, 40, W, 50), P((150, 160, 170)))
    for k in range(9):
        x = 1270 + k * 72 + 6 * math.sin(t * 0.6 + k)
        c.drawRect(skia.Rect(x, 50, x + 64, 760), P((150, 196, 176) if k % 2 else (136, 184, 164)))
    # monitor with a moving trace
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(260, 150, 600, 380), 18, 18), P((60, 66, 80)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(280, 170, 580, 360), 10, 10), P((18, 26, 34)))
    tr = skia.Path(); first = True
    for i in range(120):
        x = 290 + i * 2.4; ph = (i / 120 * 2 + t * 0.9) % 1
        y = 270 - (60 if 0.30 < ph < 0.33 else (-18 if 0.33 < ph < 0.36 else 0))
        (tr.moveTo if first else tr.lineTo)(x, y); first = False
    c.drawPath(tr, SP((90, 230, 140), 3))
    text(c, '72', 520, 220, 36, (90, 230, 140), 1, 'bold')
    # IV pole and cabinet
    c.drawRect(skia.Rect(1150, 130, 1160, 760), P((170, 176, 186)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1118, 140, 1192, 240), 14, 14), P((226, 236, 244), 220))
    c.drawRect(skia.Rect(60, 470, 230, 760), P((170, 186, 196))); c.drawRect(skia.Rect(60, 470, 230, 486), P((200, 210, 218)))


def stretcher(c, x, y, w=820):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y, x + w / 2, y + 60), 20, 20), P((246, 248, 250)))
    c.drawRect(skia.Rect(x - w / 2 + 20, y + 50, x + w / 2 - 20, y + 74), P((150, 156, 168)))
    for dx in (-w / 2 + 60, w / 2 - 60):
        c.drawRect(skia.Rect(x + dx - 8, y + 70, x + dx + 8, y + 240), P((150, 156, 168)))
        c.drawCircle(x + dx, y + 250, 16, P((60, 64, 74)))


def person(kind):
    if kind == 'cyclist':
        p = B.Person(shirt=TEALJ, shirt_sh=TEALJ_SH, shorts=(36, 40, 44), shorts_sh=(24, 26, 30), hair=(140, 90, 60))
    elif kind == 'nurse':
        p = B.Person(shirt=(52, 70, 128), shirt_sh=(36, 50, 96), shorts=(52, 70, 128), shorts_sh=(36, 50, 96), hair=(60, 40, 36), skin=(196, 132, 96), skin_sh=(160, 100, 70))
        p.pants = True; p.shoe = (240, 240, 244); p.shoe_sh = (200, 200, 210)
    elif kind == 'doctor':
        p = B.Person(shirt=(150, 196, 230), shirt_sh=(110, 160, 200), shorts=(150, 196, 230), shorts_sh=(110, 160, 200), hair=(70, 56, 50))
        p.pants = True; p.shoe = (60, 60, 70); p.shoe_sh = (40, 40, 50)
    return p


def er_scene(c, t, tablet=0.0, doctor=0.0, bandage=1.0):
    er_bg(c, t)
    stretcher(c, 820, 640)
    cy = person('cyclist'); cy.mode = 'none'
    # sitting up on the stretcher, the blanket over his legs, both arms resting on top of it;
    # his left forearm (viewer's right) lies across his lap with the bandage on it
    cy.arm = {1: [12, -70, 0.4], -1: [8, -78, 0.4]}
    X0, Y0, S0 = 700, 952, 0.82
    cy.draw(c, X0, Y0, S0, t)
    blanket = sc([(560, 640), (700, 628), (900, 636), (1150, 630), (1200, 604), (1236, 624), (1246, 690), (1230, 712), (600, 714), (560, 690)])
    flat(c, blanket, (236, 240, 246), (206, 212, 224), off=(0, -8))
    for k in range(3):
        c.drawLine(760 + k * 140, 660, 800 + k * 140, 700, SP((206, 212, 224), 3, 160))
    c.save(); c.translate(X0, Y0); c.scale(S0, S0)
    for side in (1, -1):
        cy.arm_draw(c, side)
    c.restore()
    sh, el, wr, _ = cy.joints(-1)
    p = (el + (wr - el) * 0.55) * S0 + np.array([X0, Y0])
    c.save(); c.translate(*p); c.rotate(math.degrees(math.atan2(*(wr - el)[::-1])))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-22, -14, 22, 14), 6, 6), P((250, 250, 248), 255 * bandage))
    c.drawLine(-10, -14, -10, 14, SP((220, 222, 226), 2, 255 * bandage)); c.drawLine(8, -14, 8, 14, SP((220, 222, 226), 2, 255 * bandage))
    c.restore()
    cy.bandage_pt = p
    nu = person('nurse')
    nu.arm = {1: [-4, -100, 0.3], -1: [-4, -100, 0.3]}
    nu.draw(c, 1380, 900, 0.82, t + 1)
    # tablet in her hands
    c.save(); c.translate(1380, 900 - 0.82 * 390); c.rotate(-6)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-70, -50, 70, 50), 10, 10), P((40, 44, 56)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-62, -42, 62, 42), 6, 6), P((210, 230, 250), 255 * (0.6 + 0.4 * tablet)))
    c.restore()
    if doctor > 0:
        dr = person('doctor'); dr.back = True; dr.arm = {1: [10, -6, 0.15], -1: [10, -6, 0.15]}
        c.save(); c.translate(0, 120 * (1 - sm(doctor)))
        dr.draw(c, 560, 1180, 1.05, t)
        c.restore()
    return cy


def tablet_closeup(c, t, lines, us, hl=None):
    """the chart on the nurse's tablet, close up; lines handwritten as us go 0 -> 1"""
    er_bg(c, t)
    c.drawRect(skia.Rect(0, 0, W, H), P((20, 26, 40), 120))
    c.save(); c.translate(W / 2, H / 2 + 20); c.rotate(-2)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-620, -400, 620, 400), 40, 40), P((36, 40, 52)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-590, -370, 590, 370), 22, 22), P((246, 248, 252)))
    c.drawRect(skia.Rect(-590, -370, 590, -290), P((63, 194, 169)))
    text(c, 'PATIENT CHART', -550, -318, 34, (255, 255, 255), 1, 'xb')
    text(c, 'Previous visit', 330, -318, 30, (230, 250, 246), 1, 'semi')
    for k, (lab, word) in enumerate(lines):
        y = -170 + k * 150
        text(c, lab, -530, y, 34, (110, 116, 130), 1, 'semi')
        hand(c, word, -200, y + 6, 72, (40, 48, 92) if not (hl and hl.get(k)) else hl[k], us[k] if k < len(us) else 0)
    c.restore()


# ---------------------------------------------------------------- profile (side view) figure, facing right
def profile(c, x, y, s, t=0.0, hl=None, shirt=(190, 195, 202), shirt_sh=(150, 156, 168), inside=0.0):
    """standing side view facing right (anterior = +x), feet at x, y; built to match the front view person
    (same proportions, colours, hands and hair). Landmarks are returned in world coordinates."""
    shorts, shorts_sh = (42, 64, 114), (30, 44, 86)
    hair, hair_sh = B.HAIR, B.HAIR_SH
    c.save(); c.translate(x, y); c.scale(s, s)
    br = 1.2 * math.sin(t * 1.7)
    # far leg, a step darker, then the near leg
    def leg(dx, col, sh_):
        lg = sc([(dx - 34, -224), (dx + 34, -224), (dx + 24, -150), (dx + 20, -96), (dx + 12, -34), (dx - 14, -34), (dx - 30, -96), (dx - 24, -150)])
        flat(c, lg, col, sh_, off=(-5, 0))
        ft = sc([(dx - 16, -38), (dx + 12, -38), (dx + 30, -16), (dx + 58, -10), (dx + 60, 4), (dx - 22, 4), (dx - 24, -16)])
        flat(c, ft, col, sh_, off=(-4, 0))
    leg(-6, (226, 146, 110), (196, 106, 76))
    leg(4, SKIN, SKIN_SH)
    c.drawArc(skia.Rect(4 + 4, -150, 4 + 26, -132), -60, 100, False, SP(SKIN_SH, 2.2, 140))
    shp = skia.Path(); shp.moveTo(-50, -378); shp.lineTo(46, -378); shp.quadTo(54, -340, 50, -300); shp.lineTo(42, -206)
    shp.lineTo(-40, -206); shp.lineTo(-50, -300); shp.quadTo(-56, -340, -50, -378); shp.close()
    flat(c, shp, shorts, shorts_sh, off=(-9, 0))
    c.save(); c.translate(0, -br)
    neck = sc([(-14, -592), (16, -592), (18, -548), (-18, -548)])
    flat(c, neck, SKIN, SKIN_SH, rim=False)
    torso = sc([(-44, -560), (18, -568), (44, -548), (54, -504), (48, -444), (46, -366), (-48, -366), (-50, -444), (-56, -502), (-52, -546)])
    if inside > 0:
        c.saveLayerAlpha(None, int(255 * (1 - 0.55 * inside)))
    flat(c, torso, shirt, shirt_sh, off=(-8, 0))
    if inside > 0:
        c.restore()
    # the arm hangs at the side, palm forward, so the thumb points to the front (faded when we look inside)
    if inside > 0:
        c.saveLayerAlpha(None, int(255 * (1 - 0.75 * inside)))
    shd, el, wr = np.array([-4.0, -528.0]), np.array([-6.0, -410.0]), np.array([4.0, -324.0])
    flat(c, B.limb_path(el, wr, 28, 22), SKIN, SKIN_SH, off=(-4, 0))
    flat(c, B.limb_path(shd, el, 34, 28), SKIN, SKIN_SH, off=(-4, 0))
    hnd = sc([(-10, -332), (12, -332), (14, -300), (13, -272), (4, -262), (-8, -266), (-12, -300)])
    thb = sc([(8, -318), (24, -300), (26, -290), (18, -290), (8, -300)])
    flat(c, hnd, SKIN, SKIN_SH, off=(-3, 0)); flat(c, thb, SKIN, SKIN_SH, off=(-2, 0), rim=False)
    slv = B.union(B.limb_path(shd, shd + (el - shd) * 0.42, 46, 42), sc([(-30, -560), (20, -560), (20, -520), (-30, -520)]))
    flat(c, slv, shirt, shirt_sh, off=(-7, 0))
    if inside > 0:
        c.restore()
    if inside > 0:
        a_ = 255 * inside
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(30, -528, 44, -440), 7, 7), P((250, 244, 230), a_))      # breastbone
        hp = sc([(-4, -508), (20, -506), (28, -478), (8, -446), (-14, -470), (-18, -496)])
        c.drawPath(hp, P((214, 60, 70), a_))                                                                   # heart
        for k in range(9):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-48, -548 + k * 20, -32, -534 + k * 20), 5, 5), P((250, 244, 230), a_))
    # head: profile with nose, lips and chin; ear, eye and short hair
    head = sc([(-42, -650), (-34, -700), (12, -712), (42, -690), (48, -656), (52, -638), (50, -612), (48, -596), (40, -580),
               (20, -572), (-8, -580), (-36, -596), (-46, -622)])
    flat(c, head, SKIN, SKIN_SH, off=(-6, 0))
    nose = sc([(44, -644), (60, -620), (58, -614), (46, -612)])
    c.drawPath(nose, P(SKIN)); c.drawLine(56, -614, 47, -613, SP(SKIN_SH, 2.2))
    c.drawLine(42, -600, 51, -601, SP(SKIN_SH, 3))
    ear = skia.Path(); ear.addOval(skia.Rect(-14, -646, 4, -616)); flat(c, ear, SKIN, SKIN_SH, rim=False, off=(2, 0))
    hr = sc([(-48, -648), (-40, -704), (12, -716), (46, -694), (44, -672), (22, -676), (6, -668), (-10, -660), (-20, -640),
             (-30, -604), (-46, -612)])
    flat(c, hr, hair, hair_sh, off=(-4, 0), rim_a=120)
    c.drawLine(28, -650, 42, -650, SP(hair_sh, 4))
    c.drawOval(skia.Rect(31, -641, 39, -630), P((60, 36, 34)))
    c.restore(); c.restore()
    LM = dict(nose=(60, -620), ear=(-5, -631), breastbone=(40, -484), heart=(6, -476), backbone=(-40, -480), chest=(52, -480), back=(-56, -480))
    return {k: (x + v[0] * s, y + (v[1] - br) * s) for k, v in LM.items()}


def kidney(c, x, y, s=1.0, a=1.0, cut=0.0, out=0.0, scar=0.0):
    if a <= 0.01:
        return
    c.save(); c.translate(x, y - 300 * sm(out)); c.scale(s, s)
    k = sc([(-60, -110), (20, -130), (80, -90), (96, 0), (80, 90), (20, 130), (-60, 110), (-90, 40), (-40, 10), (-40, -10), (-90, -40)])
    c.saveLayerAlpha(None, int(255 * a * (1 - sm(out))))
    flat(c, k, (168, 70, 76), (128, 48, 58))
    c.drawPath(sc([(-40, -40), (-6, -30), (-6, 30), (-40, 40), (-60, 0)]), P((236, 196, 150)))
    if cut > 0:
        c.drawLine(40, -80 + 0, 40 + 0, -80 + 160 * sm(cut), SP((255, 255, 255), 6))
    if scar > 0:
        c.drawLine(40, -80, 40, 80, SP((236, 170, 160), 5, 255 * scar))
    c.restore()
    c.restore()


def heart_sac(c, x, y, s=1.0, a=1.0, sac=0.0, inflamed=0.0, t=0.0):
    if a <= 0.01:
        return
    beat = 1 + 0.03 * max(0, math.sin(t * 7.5)) ** 8
    c.save(); c.translate(x, y); c.scale(s * beat, s * beat)
    c.saveLayerAlpha(None, int(255 * a))
    if sac > 0:
        sp = sc([(-120, -150), (60, -170), (150, -80), (130, 60), (20, 180), (-110, 90), (-150, -40)])
        c.drawPath(sp, P((255, 140, 110) if inflamed else (255, 220, 190), 120 * sac))
        c.drawPath(sp, SP((255, 120, 90) if inflamed else (255, 230, 200), 8, 255 * sac))
        if inflamed:
            c.drawPath(sp, P((255, 90, 60), 90 * inflamed, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    h = sc([(-90, -110), (20, -130), (110, -60), (100, 40), (10, 150), (-80, 70), (-110, -20)])
    flat(c, h, (214, 60, 70), (160, 36, 52))
    c.drawPath(sc([(-40, -170), (-10, -170), (-6, -110), (-40, -110)]), P((214, 60, 70)))
    c.drawPath(sc([(10, -180), (60, -170), (56, -110), (12, -116)]), P((90, 120, 210)))
    c.restore()
    c.restore()


def ribs(c, x, y, s=1.0, a=1.0, between=0.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    for k in range(4):
        yy = -120 + k * 80
        c.drawPath(sc([(-150, yy), (150, yy), (150, yy + 34), (-150, yy + 34)]), P((246, 236, 216), 255 * a))
    if between > 0:
        c.drawRect(skia.Rect(-150, -86, 150, -40), P((255, 112, 102), 170 * between * a))
    c.restore()


def vein(c, x, y, s=1.0, a=1.0, inside=0.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-200, -40, 200, 40), 40, 40), P((80, 110, 200), 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-200, -24, 200, 24), 24, 24), P((60, 90, 180), 255 * a))
    if inside > 0:
        nx = -40 + 60 * sm(inside)
        c.drawLine(nx - 260, -110, nx, -6, SP((220, 226, 236), 10, 255 * a))
        c.drawCircle(nx, -6, 8, P((255, 214, 92), 255 * a))
    c.restore()


def layers(c, x, y, r, us, a=1.0, cut=0.0, wound_depth=0.0, labels=True, t=0.0):
    """cross section of a limb: skin, fat, muscle, bone; us = reveal of each ring"""
    cols = [((236, 156, 126), 'skin'), ((250, 222, 150), 'fat'), ((200, 80, 84), 'muscle'), ((246, 240, 226), 'bone')]
    radii = [r, r * 0.9, r * 0.66, r * 0.28]
    c.save(); c.translate(x, y)
    for k, ((col, name), rr) in enumerate(zip(cols, radii)):
        u = us[k] if k < len(us) else 0
        if u <= 0.01:
            continue
        c.drawCircle(0, 0, rr * (0.9 + 0.1 * sm(u)), P(col, 255 * a * sm(u)))
        if k == 2:
            for j in range(7):
                ang = j / 7 * 2 * math.pi
                c.drawLine(math.cos(ang) * rr * 0.4, math.sin(ang) * rr * 0.4, math.cos(ang) * rr * 0.95, math.sin(ang) * rr * 0.95, SP((168, 60, 68), 3, 200 * a * sm(u)))
    c.drawCircle(0, 0, r, SP((255, 198, 87), 3, 200 * a))
    if wound_depth > 0:
        # a wedge in from the top: depth 1 = through skin and fat only, stops at the muscle
        dpt = r - r * 0.66
        wedge = skia.Path(); wedge.moveTo(-30, -r - 4); wedge.lineTo(30, -r - 4); wedge.lineTo(0, -r + dpt * sm(wound_depth)); wedge.close()
        c.drawPath(wedge, P((120, 20, 30), 255 * a))
    c.restore()


def brain_body(c, x, y, s=1.0, a=1.0, cross=0.0, right_glow=0.0, left_weak=0.0, t=0.0):
    """front view: brain halves over a small body; a pathway leaves the right half and crosses the midline to the left side"""
    c.save(); c.translate(x, y); c.scale(s, s)
    c.saveLayerAlpha(None, int(255 * a))
    for side, col in ((-1, (232, 160, 170)), (1, (232, 160, 170))):
        hp = sc([(side * 8, -160), (side * 120, -170), (side * 170, -100), (side * 160, 0), (side * 90, 30), (side * 8, 20)])
        flat(c, hp, col, (200, 120, 136), rim=False)
        for k in range(3):
            c.drawArc(skia.Rect(side * 30 - 30 if side > 0 else side * 140, -130 + k * 40, side * 30 + 110 if side > 0 else side * 20, -90 + k * 40), 200, 140, False, SP((200, 120, 136), 4))
    # the patient's right hemisphere is on the viewer's left
    if right_glow > 0:
        c.drawCircle(-90, -80, 110, P((255, 120, 90), 150 * right_glow, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    c.drawLine(0, -180, 0, 640, SP((255, 214, 92), 3, 120))
    # the patient below, in the house front view: his left side is on the viewer's right
    pp = B.Person()
    ps = 0.78
    c.save()
    pp.draw(c, 0, 640, ps, t)
    c.restore()
    if cross > 0:
        pth = skia.Path(); pth.moveTo(-80, -60); pth.cubicTo(-70, 80, -10, 150, 0, 200); pth.cubicTo(10, 250, 40, 260, 30, 330); pth.lineTo(28, 560)
        brn = skia.Path(); brn.moveTo(20, 240); brn.cubicTo(60, 240, 80, 260, 90, 300); brn.lineTo(104, 380)
        m2 = skia.PathMeasure(brn, False); sg2 = skia.Path(); m2.getSegment(0, m2.getLength() * sm((cross - 0.4) / 0.6), sg2, True)
        c.drawPath(sg2, SP((255, 198, 87), 7))
        m = skia.PathMeasure(pth, False); seg = skia.Path(); m.getSegment(0, m.getLength() * sm(cross), seg, True)
        c.drawPath(seg, SP((255, 198, 87), 7))
    if left_weak > 0:
        for (gx, gy, r) in ((120 * ps, 640 - 400 * ps, 90), (34 * ps, 640 - 140 * ps, 110)):
            c.drawCircle(gx, gy, r, P((255, 110, 90), 120 * left_weak, MaskFilter=blur(36), BlendMode=skia.BlendMode.kScreen))
        text(c, 'weak', 160, 640 - 300 * ps, 34, (255, 150, 130), left_weak, 'xb')
    c.restore()
    c.restore()
