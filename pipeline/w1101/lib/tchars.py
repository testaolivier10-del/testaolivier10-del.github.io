"""The w1031 people, traced from house style references (ref/*.png, Figma AI Gemini, 2026-11-01) into vector shapes
and moved in code: region pieces rotate about their joints (head nods, a talking hand, a tamping upper body), the ice
rescue group lifts through a smooth displacement field so the rescuers' hands stay on the patient, breathing on all."""
import math
import numpy as np, skia
import tfig


def _clip_poly(pts):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p


def rot_about(px, py, deg):
    m = skia.Matrix(); m.setRotate(deg, px, py); return m


def draw_regions(c, layers, x0, y0, s, regions, flip=False, a=1.0, tint=None, rim=None):
    """regions: [(clip path in ref coords, skia.Matrix in ref coords)], drawn over the base which is clipped to
    everything outside the regions."""
    c.save(); c.translate(x0, y0); c.scale(-s if flip else s, s)
    rest = skia.Path(); rest.addRect(skia.Rect(-5000, -5000, 5000, 5000))
    for rp, _ in regions:
        rest = skia.Op(rest, rp, skia.PathOp.kDifference_PathOp) or rest
    c.save(); c.clipPath(rest, skia.ClipOp.kIntersect, True)
    tfig.draw(c, layers, 0, 0, 1.0, a, tint=tint, rim=rim)
    c.restore()
    for rp, m in regions:
        c.save(); c.concat(m); c.clipPath(rp, skia.ClipOp.kIntersect, True)
        tfig.draw(c, layers, 0, 0, 1.0, a, tint=tint, rim=rim)
        c.restore()
    c.restore()


# ===================================================================== Phineas Gage tamping (ref/gage_tamp.png)
def _no_rod(crop):
    h, w = crop.shape[:2]
    m = np.ones((h, w), np.uint8)
    yy, xx = np.mgrid[0:h, 0:w]
    xr = 305 - (yy - 315) * 40.0 / 835.0
    rgb = crop.astype(int)
    grey = (np.abs(rgb[..., 0] - rgb[..., 2]) < 28) & (rgb.max(2) < 170)
    band = (np.abs(xx - xr) < 22) & (yy > 300) & (yy < 1160)
    m[band & grey] = 0
    m[(yy > 1124) & (xx < 345)] = 0                       # the hole, drawn in code
    return m


TAMP = None
TAMP_PIVOT = (470.0, 610.0)                                 # hip
TAMP_GRIP = (295.0, 480.0)
ROD_TOP, ROD_BOT = (305.0, 315.0), (265.0, 1150.0)
CHEEK = (430.0, 268.0)


def tamp_layers():
    global TAMP
    if TAMP is None:
        TAMP = tfig.traced('gage_tamp', k=22, mask_fn=_no_rod, tag='norod')
    return TAMP


def tamp_upper_matrix(lift, br):
    """upper body: tilts up a little as he raises the iron (lift 1) and presses down (lift 0); breathing"""
    m = rot_about(*TAMP_PIVOT, 11.0 * lift - 3.0 + 0.4 * br)
    m.postTranslate(0, 26 * (1 - lift))
    return m


HAT = [(330, 95), (610, 95), (610, 192), (520, 196), (470, 214), (400, 214), (330, 205)]


def draw_tamp(c, t, x0, y0, s, lift, br, knock=0.0, heel=(600.0, 1150.0), hat_fly=0.0):
    """knock: 0..1, thrown backward (to the right, away from the blast) about the heel; hat_fly: 0..1 the hat flies off"""
    L = tamp_layers()
    up = tamp_upper_matrix(lift, br)
    upper = _clip_poly([(-200, -200), (1100, -200), (1100, 618), (-200, 618)])
    upper_nohat = skia.Op(upper, _clip_poly(HAT), skia.PathOp.kDifference_PathOp) if hat_fly > 0 else upper
    regions = [(upper_nohat, up)]
    if hat_fly > 0:
        hm = skia.Matrix()
        hm.setConcat(rot_about(470 + 260 * hat_fly, 160 - 420 * hat_fly + 300 * hat_fly * hat_fly, 220 * hat_fly), skia.Matrix.Translate(260 * hat_fly, -420 * hat_fly + 300 * hat_fly * hat_fly))
        hm.preConcat(up)
        regions.append((_clip_poly(HAT), hm))
    c.save()
    if knock > 0:
        c.translate(x0 + heel[0] * s, y0 + heel[1] * s); c.rotate(24 * knock); c.translate(-(x0 + heel[0] * s), -(y0 + heel[1] * s))
    if hat_fly > 0:
        # his hair, hidden by the hat until now, so the head stays round when the hat flies off
        c.save(); c.translate(x0, y0); c.scale(s, s); c.concat(up)
        hair = skia.Path(); hair.addOval(skia.Rect(402, 150, 540, 250))
        c.drawPath(hair, skia.Paint(AntiAlias=True, Color=skia.Color(58, 38, 30)))
        c.drawArc(skia.Rect(402, 150, 540, 250), 200, 120, False, skia.Paint(AntiAlias=True, Color=skia.Color(255, 206, 120, 160), Style=skia.Paint.kStroke_Style, StrokeWidth=4))
        c.restore()
    draw_regions(c, L, x0, y0, s, regions, rim=((255, 206, 120), (-4, 3), 200))
    c.restore()


def head_clip_screen(x0, y0, s, lift=0.0, br=0.0):
    """his head (below the hat brim) in screen space, to hide the part of the iron that is inside it"""
    p = _clip_poly([(395, 205), (520, 205), (530, 300), (470, 330), (405, 300)])
    p.transform(tamp_upper_matrix(lift, br))
    m = skia.Matrix(); m.setScaleTranslate(s, s, x0, y0); p.transform(m)
    return p


def grip_screen(x0, y0, s, lift, br):
    m = tamp_upper_matrix(lift, br)
    p = m.mapXY(*TAMP_GRIP)
    return (x0 + p.x() * s, y0 + p.y() * s), (x0 + TAMP_GRIP[0] * s, y0 + TAMP_GRIP[1] * s)


# ===================================================================== Gage sitting, talking (ref/gage_sit.png)
SIT = None


def sit_layers():
    global SIT
    if SIT is None: SIT = tfig.traced('gage_sit', k=22)
    return SIT


def draw_sit(c, t, x0, y0, s, talk=0.0, daze=1.0):
    L = sit_layers()
    br = math.sin(t * 1.5)
    head = _clip_poly([(800, 90), (1010, 90), (1010, 300), (930, 300), (880, 318), (800, 300)])
    hand = _clip_poly([(590, 260), (720, 250), (800, 470), (790, 540), (730, 540)])
    nod = (2.5 * math.sin(t * 5.5) * talk) + (-3 * daze * (0.5 + 0.5 * math.sin(t * 0.9)))
    wave = 7 * math.sin(t * 4.2) * talk - 10 * (1 - talk)
    draw_regions(c, L, x0, y0 - 1.5 * br * s, s, [(head, rot_about(900, 300, nod)), (hand, rot_about(775, 520, wave))], rim=((255, 206, 120), (-4, 3), 200))


# ===================================================================== two kneeling workers (ref/workers_kneel.png)
WK = None


def workers_layers():
    global WK
    if WK is None: WK = tfig.traced('workers_kneel', k=22)
    return WK


def draw_workers(c, t, x0, y0, s):
    L = workers_layers()
    h1 = _clip_poly([(270, 160), (450, 160), (450, 330), (420, 362), (270, 362)])     # red beard head
    h2 = _clip_poly([(680, 90), (915, 90), (915, 260), (840, 285), (740, 280), (680, 200)])   # black hat head
    reach = _clip_poly([(150, 480), (262, 480), (268, 600), (150, 600)])
    draw_regions(c, L, x0, y0, s, [(h1, rot_about(420, 350, 2.0 * math.sin(t * 1.3))), (h2, rot_about(820, 280, 1.5 * math.sin(t * 1.1 + 1))),
                                    (reach, rot_about(258, 528, 4 * math.sin(t * 1.7)))], rim=((255, 206, 120), (-4, 3), 200))


# ===================================================================== dusk: Gage turning away, two friends (ref/dusk_group.png)
DG = None
DF = None


def dusk_layers():
    global DG, DF
    if DG is None:
        DG = tfig.traced('dusk_group2', box=(100, 90, 380, 800), k=22, tag='gage')
        DF = tfig.traced('dusk_group2', box=(770, 90, 1180, 800), k=22, tag='friends')
    return DG, DF


def draw_dusk_gage(c, t, x0, y0, s, turn=0.0, tint=None):
    G, _ = dusk_layers()
    br = math.sin(t * 1.4)
    # drawn mirrored so the healed scar sits on his LEFT cheek; he faces a little away from his friends
    head = _clip_poly([(40, 0), (260, 0), (260, 150), (200, 165), (110, 165), (40, 150)])
    c.save(); c.translate(x0 + 280 * s, y0)
    draw_regions(c, G, 0, 0, s, [(head, rot_about(165, 155, 5 * turn + 0.8 * br))], flip=True, tint=tint, rim=((255, 170, 120), (-4, 3), 190))
    c.restore()


def draw_dusk_friends(c, t, x0, y0, s, lean=0.0, tint=None):
    _, F = dusk_layers()
    h1 = _clip_poly([(50, 60), (200, 60), (200, 225), (50, 225)])
    h2 = _clip_poly([(210, 10), (390, 10), (390, 195), (210, 195)])
    draw_regions(c, F, x0, y0, s, [(h1, rot_about(120, 215, -3 * lean + 1.2 * math.sin(t * 1.2))),
                                   (h2, rot_about(290, 185, -2 * lean + 1.0 * math.sin(t * 1.0 + 2)))], tint=tint, rim=((255, 170, 120), (4, 3), 190))


# ===================================================================== ice rescue group (ref/ice_hole2.png)
ICE = None
ICE_COL = [(206, 234, 253), (193, 222, 252), (194, 224, 254), (131, 197, 229), (150, 205, 236), (118, 179, 220), (176, 194, 223)]


def _no_ice(crop):
    """drop the ice slab, the hole and the hole's rim (all redrawn in code): ice colours below the ice line only"""
    import cv2
    h, w = crop.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    lab = cv2.cvtColor(crop, cv2.COLOR_RGB2LAB).astype(np.float32)
    m = np.ones((h, w), np.uint8)
    for col in ICE_COL:
        c = cv2.cvtColor(np.uint8([[col]]), cv2.COLOR_RGB2LAB).astype(np.float32)[0, 0]
        m[(np.linalg.norm(lab - c, axis=2) < 18) & (yy > 525)] = 0
    m[(crop.astype(int).max(2) < 22) & (yy > 560)] = 0
    return m


def ice_layers():
    global ICE
    if ICE is None: ICE = tfig.traced('ice_hole3', k=24, mask_fn=_no_ice, tag='v3')
    return ICE


PATIENT_X = 660.0


def ice_field(lift_px, lean):
    """vertical lift centred on the patient that fades out across the rescuers' arms to their bodies; the rescuers
    lean back a little as they pull"""
    def f(x, y):
        d = abs(x - PATIENT_X)
        w = 1.0 if d < 150 else max(0.0, 1 - (d - 150) / 240.0)
        w = w * w * (3 - 2 * w)
        dy = -lift_px * w
        # lean: points high on the rescuers tilt away from the hole
        side = -1 if x < PATIENT_X else 1
        hgt = max(0.0, (640 - y) / 400.0)
        dx = side * lean * hgt * (1 - w) * 34
        return (x + dx, y + dy)
    return f


def draw_ice(c, t, x0, y0, s, lift_px=0.0, lean=0.0, water_y=636, rim=None):
    L = ice_layers()
    br = math.sin(t * 1.6)
    f = ice_field(lift_px, lean + 0.04 * br)
    c.save(); c.translate(x0, y0); c.scale(s, s)
    # the patient's jacket and legs below the water line, revealed as he is lifted (code extension, two tones, dripping)
    if lift_px > 2:
        c.save(); c.clipRect(skia.Rect(-2000, -2000, 4000, water_y + 6))
        top = water_y - 60 - lift_px
        hip = water_y - lift_px + 70            # jacket hem; trousers below it, clipped at the water line
        P_ = lambda col: skia.Paint(AntiAlias=True, Color=skia.Color(*col))
        # trousers first, so the jacket hem overlaps them: two legs, knees slightly bent toward the rescuers
        for k_, (xx, kd) in enumerate(((PATIENT_X - 62, -10), (PATIENT_X + 62, 12)) if lift_px > 110 else ()):
            leg = skia.Path()
            leg.moveTo(xx - 58, hip - 20); leg.lineTo(xx + 58, hip - 20)
            leg.quadTo(xx + 58 + kd, hip + 70, xx + 50 + kd, hip + 120)
            leg.lineTo(xx + 46 + kd * 0.5, water_y + 40); leg.lineTo(xx - 46 + kd * 0.5, water_y + 40)
            leg.lineTo(xx - 50 + kd, hip + 120); leg.quadTo(xx - 58 + kd, hip + 70, xx - 58, hip - 20); leg.close()
            c.drawPath(leg, P_((52, 62, 100)))
            c.save(); c.clipPath(leg, skia.ClipOp.kIntersect, True)
            c.drawRect(skia.Rect(xx + 20 + kd, hip - 20, xx + 70 + kd, water_y + 40), P_((38, 46, 80)))
            c.drawRect(skia.Rect(xx - 70, hip - 20, xx + 70, hip + 60), P_((40, 48, 76, 120)))
            c.restore()
            c.drawLine(xx - 40 + kd, hip + 118, xx + 44 + kd, hip + 112, skia.Paint(AntiAlias=True, Color=skia.Color(36, 38, 52), StrokeWidth=4, Style=skia.Paint.kStroke_Style))
            for j in range(3):
                dy2 = (t * 300 + j * 40 + k_ * 20) % 90
                c.drawCircle(xx - 20 + j * 20, hip + 60 + dy2, 4.5, P_((180, 210, 255)))
        # puffer jacket below the traced chest, tapering to the hem, quilted seams that curve
        jk = skia.Path()
        jk.moveTo(PATIENT_X - 150, top - 120); jk.lineTo(PATIENT_X + 150, top - 120)
        jk.quadTo(PATIENT_X + 150, (top + hip) / 2, PATIENT_X + 168, hip - 6)
        jk.quadTo(PATIENT_X, hip + 22, PATIENT_X - 168, hip - 6)
        jk.quadTo(PATIENT_X - 150, (top + hip) / 2, PATIENT_X - 150, top - 120); jk.close()
        c.drawPath(jk, P_((45, 56, 113)))
        c.save(); c.clipPath(jk, skia.ClipOp.kIntersect, True)
        sd = skia.Path(); sd.moveTo(PATIENT_X + 110, top - 30); sd.quadTo(PATIENT_X + 120, hip - 40, PATIENT_X + 60, hip + 20); sd.lineTo(PATIENT_X + 220, hip + 20); sd.lineTo(PATIENT_X + 220, top - 30); sd.close()
        c.drawPath(sd, P_((32, 42, 88)))
        for k in range(1):
            yk = top + 60
            sm = skia.Path(); sm.moveTo(PATIENT_X - 180, yk); sm.quadTo(PATIENT_X, yk + 18, PATIENT_X + 180, yk)
            c.drawPath(sm, skia.Paint(AntiAlias=True, Color=skia.Color(21, 31, 81), StrokeWidth=6, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap))
        c.restore()
        hm = skia.Path(); hm.moveTo(PATIENT_X - 160, hip - 8); hm.quadTo(PATIENT_X, hip + 16, PATIENT_X + 160, hip - 8)
        c.drawPath(hm, skia.Paint(AntiAlias=True, Color=skia.Color(110, 130, 190, 150), StrokeWidth=4, Style=skia.Paint.kStroke_Style))
        for k in range(6):
            dx_ = PATIENT_X - 120 + k * 48; dy_ = (t * 260 + k * 37) % 120
            c.drawCircle(dx_, top + 100 + dy_, 5, skia.Paint(AntiAlias=True, Color=skia.Color(180, 210, 255, 170)))
        c.restore()
    c.restore()
    c.save(); c.translate(x0, y0); c.scale(s, s)
    c.clipRect(skia.Rect(-2000, -2000, 4000, 2000))
    tfig.draw(c, L, 0, 0, 1.0, f=f, rim=rim)
    c.restore()


# ===================================================================== sled (ref/sled.png)
SL = None


def sled_layers():
    global SL
    if SL is None: SL = tfig.traced('sled', k=24, extra=[(168, 196, 176), (148, 200, 185), (158, 198, 180)])
    return SL


def draw_sled(c, t, x0, y0, s):
    L = sled_layers()
    head = _clip_poly([(630, 110), (830, 110), (830, 300), (760, 305), (630, 300)])
    hand = _clip_poly([(500, 470), (625, 470), (630, 545), (500, 545)])
    br = math.sin(t * 1.4)
    draw_regions(c, L, x0, y0, s, [(head, rot_about(760, 295, 1.5 * math.sin(t * 0.8) + 0.5 * br)), (hand, rot_about(620, 505, 1.2 * math.sin(t * 1.1)))])
