"""A generic 1940s four engine bomber drawn in code in the house flat style (no insignia): top view and side view.
Plane local units: length about 600 (nose at -y in the top view, at +x in the side view). Light from the upper left."""
import math, skia
from lpk import P, SP, C, poly, smooth_closed, flat, blur, mix

OLIVE = (98, 112, 72)
OLIVE_SH = (66, 77, 48)
OLIVE_DK = (78, 90, 56)
GLASS = (34, 44, 74)
GLASS_HI = (120, 150, 200)
PROP = (176, 182, 190)
RIM = (255, 214, 140)

# hole spots (top view, plane units): wings, tail, body; none on the engines or cockpit
HOLES_TOP = {
    'wings': [(-330, -20), (-300, 2), (-205, -30), (-180, 10), (-390, -12), (-150, -40), (175, -28), (215, 6), (300, -10), (350, 0),
              (395, -20), (160, 12), (-260, -8), (265, -32)],
    'tail': [(-100, 250), (-60, 258), (85, 246), (120, 258), (-8, 286), (40, 254)],
    'body': [(-14, 40), (12, 90), (-10, 150), (16, -40), (-6, 200), (8, 5), (-18, 110)],
}
ENGINES_X = (-240, -120, 120, 240)


def _wing_le(x):
    """leading edge y and trailing edge y of the wing at span x (top view)"""
    u = min(1.0, abs(x) / 440)
    return -70 + 40 * u, 40 - 40 * u


def top(c, x, y, s, rot=0.0, t=0.0, holes=None, hole_a=1.0, engine_glow=None, armor=None, prop_spin=True, light=1.0, ghost=False, ring=None, cross=0.0, prop_k=1.0, ghost_hits=0.0):
    """top view; holes: dict name -> alpha; armor: dict 'engines'/'cockpit'/'wings'/'tail'/'body' -> 0..1 (plates slide in)"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    if ghost:
        _ghost_top(c, t, ghost_hits); c.restore(); return
    base, sh, dk = OLIVE, OLIVE_SH, OLIVE_DK
    rim_a = 170 * light
    # wings (one shape across)
    wing = poly([(-440, -30), (-30, -72), (30, -72), (440, -30), (440, 0), (30, 42), (-30, 42), (-440, 0)])
    flat(c, wing, base, sh, sh_off=(0, 9), rim=RIM, rim_d=(0, 3), rim_a=rim_a)
    # panel bands and flaps
    for sx in (-1, 1):
        c.drawPath(poly([(sx * 60, 30), (sx * 300, 12), (sx * 300, 6), (sx * 60, 24)]), P(dk))
        c.drawPath(poly([(sx * 330, -10), (sx * 438, -14), (sx * 438, -8), (sx * 330, -4)]), P(dk))
    # tailplane
    tp = poly([(-150, 240), (-24, 226), (24, 226), (150, 240), (150, 262), (24, 276), (-24, 276), (-150, 262)])
    flat(c, tp, base, sh, sh_off=(0, 7), rim=RIM, rim_d=(0, 2.5), rim_a=rim_a)
    # engines (nacelles stick out ahead of the wing)
    for ex in ENGINES_X:
        le, te = _wing_le(ex)
        nac = skia.RRect.MakeRectXY(skia.Rect(ex - 19, le - 70, ex + 19, te + 18), 18, 18)
        pth = skia.Path(); pth.addRRect(nac)
        glow = engine_glow.get(ex, 0) if engine_glow else 0
        flat(c, pth, mix(base, (210, 230, 255), 0.0), sh, sh_off=(6, 0), rim=RIM, rim_d=(-2.5, 0), rim_a=rim_a)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(ex - 15, le - 70, ex + 15, le - 52), 10, 10), P((60, 66, 54)))
        if glow > 0.01:
            c.drawRRect(nac, P((255, 236, 150), 120 * glow, MaskFilter=blur(14), BlendMode=skia.BlendMode.kScreen))
            c.drawRRect(nac, SP((255, 226, 120), 5, 230 * glow))
        # propeller: a soft disc and three blades
        px, py = ex, le - 76
        c.drawCircle(px, py, 54, P(PROP, 46))
        ang = t * 40 * prop_k if prop_spin else 0.4
        for k in range(3):
            a = ang + k * 2 * math.pi / 3
            c.drawLine(px, py, px + 52 * math.cos(a), py + 52 * math.sin(a) * 0.25, SP(PROP, 7, 150))
        c.drawCircle(px, py, 8, P((70, 74, 70)))
    # fuselage
    fus = smooth_closed([(0, -305), (20, -280), (30, -210), (33, -60), (31, 80), (24, 190), (12, 280), (0, 300), (-12, 280), (-24, 190),
                         (-31, 80), (-33, -60), (-30, -210), (-20, -280)])
    flat(c, fus, base, sh, sh_off=(9, 0), rim=RIM, rim_d=(-3, 0), rim_a=rim_a)
    c.drawPath(smooth_closed([(0, -60), (6, 40), (4, 200), (0, 260), (-4, 200), (-6, 40)]), P(dk, 130))
    # glass nose, cockpit, top turret
    c.drawPath(smooth_closed([(0, -306), (14, -286), (16, -262), (0, -254), (-16, -262), (-14, -286)]), P(GLASS))
    c.drawPath(smooth_closed([(0, -238), (15, -226), (14, -200), (0, -196), (-14, -200), (-15, -226)]), P(GLASS))
    c.drawPath(smooth_closed([(-6, -234), (-1, -232), (-3, -214), (-9, -214)]), P(GLASS_HI, 160))
    c.drawCircle(0, -150, 15, P(GLASS)); c.drawCircle(-4, -154, 5, P(GLASS_HI, 160))
    # fin seen from above (a thin dark ridge at the tail)
    c.drawPath(poly([(-4, 200), (4, 200), (5, 300), (-5, 300)]), P(sh))
    # holes
    if holes:
        for name, a in holes.items():
            if a <= 0.01: continue
            for i, (hx, hy) in enumerate(HOLES_TOP[name]):
                k = min(1.0, max(0.0, a * len(HOLES_TOP[name]) - i * 0.7))
                if k <= 0: continue
                _hole(c, hx, hy, k * hole_a, i, (ring or {}).get(name, 0.0))
    if armor:
        _armor(c, armor, t, cross)
    c.restore()


def _hole(c, x, y, a, i, ring=0.0):
    r = 7 + (i * 37 % 5)
    pts = [(x + r * (1 + 0.35 * math.sin(k * 2.1 + i)) * math.cos(k * math.pi / 4), y + r * (1 + 0.35 * math.cos(k * 1.7 + i)) * math.sin(k * math.pi / 4)) for k in range(8)]
    c.drawPath(poly(pts), P((24, 22, 20), 255 * a))
    c.drawCircle(x, y, r * 0.35, P((255, 236, 200), 160 * a))
    if ring > 0.01:
        c.drawCircle(x, y, r + 9 + 6 * (1 - ring), SP((235, 70, 70), 5, 235 * ring))


def _armor(c, armor, t, cross=0.0):
    plate = (92, 98, 110); plate_sh = (64, 68, 80)
    for key, u in armor.items():
        if u <= 0.01: continue
        drop = (1 - u) * 70 - 10 * math.sin(math.pi * min(1, u * 1.2)) * (u < 1); a = min(1.0, u * 1.6)
        rects = []
        if key == 'engines':
            for ex in ENGINES_X:
                le, te = _wing_le(ex)
                rects.append(skia.Rect(ex - 25, le - 60, ex + 25, te + 22))
        elif key == 'cockpit':
            rects.append(skia.Rect(-28, -250, 28, -186))
        elif key == 'wings':
            for sx in (-1, 1):
                rects.append(skia.Rect(min(sx * 140, sx * 410), -50, max(sx * 140, sx * 410), 22))
        elif key == 'tail':
            rects.append(skia.Rect(-140, 232, 140, 270))
        elif key == 'body':
            rects.append(skia.Rect(-26, -40, 26, 220))
        for r in rects:
            r2 = skia.Rect(r.left(), r.top() - drop, r.right(), r.bottom() - drop)
            rr = skia.RRect.MakeRectXY(r2, 8, 8)
            pth = skia.Path(); pth.addRRect(rr)
            if key in ('wings', 'tail', 'body'):   # the obvious idea: see through steel plates, then crossed out
                flat(c, pth, (170, 178, 192), (130, 136, 150), sh_off=(4, 4), rim=(255, 240, 210), rim_d=(-2, -2), rim_a=200, a=150 * a)
                if cross > 0.01:
                    cx_, cy_ = r2.centerX(), r2.centerY(); hw = min(r2.width(), 110) / 2 * cross; hh = min(r2.height(), 110) / 2 * cross
                    c.drawLine(cx_ - hw, cy_ - hh, cx_ + hw, cy_ + hh, SP((235, 70, 70), 10, 255 * a)); c.drawLine(cx_ - hw, cy_ + hh, cx_ + hw, cy_ - hh, SP((235, 70, 70), 10, 255 * a))
            else:
                flat(c, pth, plate, plate_sh, sh_off=(5, 5), rim=(255, 240, 210), rim_d=(-2, -2), rim_a=220, a=255 * a)
                for k in range(3):
                    yy = r2.top() + (k + 1) * r2.height() / 4
                    c.drawCircle(r2.left() + 7, yy, 2.5, P(plate_sh, 255 * a)); c.drawCircle(r2.right() - 7, yy, 2.5, P(plate_sh, 255 * a))


def _ghost_top(c, t, hits=0.0):
    """an empty parking spot: the outline of a plane that did not come back"""
    pth = skia.Path()
    pth.addPath(poly([(-440, -30), (-30, -72), (30, -72), (440, -30), (440, 0), (30, 42), (-30, 42), (-440, 0)]))
    pth.addPath(smooth_closed([(0, -305), (20, -280), (30, -210), (33, -60), (31, 80), (24, 190), (12, 280), (0, 300), (-12, 280), (-24, 190),
                               (-31, 80), (-33, -60), (-30, -210), (-20, -280)]))
    pth.addPath(poly([(-150, 240), (-24, 226), (24, 226), (150, 240), (150, 262), (24, 276), (-24, 276), (-150, 262)]))
    eff = skia.DashPathEffect.Make([22, 14], (t * 20) % 36)
    c.drawPath(pth, skia.Paint(AntiAlias=True, Color=C((235, 240, 250), 150), Style=skia.Paint.kStroke_Style, StrokeWidth=5, PathEffect=eff))
    if hits > 0.01:   # where the missing holes went: the engines and the cockpit
        for i, ex in enumerate(ENGINES_X):
            le, te = _wing_le(ex)
            c.drawCircle(ex, le - 30, 70, P((255, 120, 60), 120 * hits, MaskFilter=blur(14))); c.drawCircle(ex, le - 30, 46, P((235, 70, 70), 230 * hits)); c.drawCircle(ex, le - 30, 18, P((255, 220, 140), 240 * hits))
        c.drawCircle(0, -220, 70, P((255, 120, 60), 120 * hits, MaskFilter=blur(14))); c.drawCircle(0, -220, 46, P((235, 70, 70), 230 * hits)); c.drawCircle(0, -220, 18, P((255, 220, 140), 240 * hits))


def side(c, x, y, s, rot=0.0, t=0.0, gear=True, holes=True, light=1.0, smoke_engine=False, fire=0.0, dark=0.0, prop_k=1.0):
    """three quarter side view seen a little from above, nose to +x; y is the fuselage centre line.
    The near wing comes toward the camera below the fuselage with two engines on it; the far wing shows above the back."""
    c.save(); c.translate(x, y); c.rotate(math.degrees(rot)); c.scale(s, s)
    base = mix(OLIVE, (40, 46, 60), dark); sh = mix(OLIVE_SH, (28, 32, 44), dark); dk = mix(OLIVE_DK, (34, 40, 52), dark)
    rim_a = 180 * light * (1 - dark)
    # far engines peek over the back only as nacelle tops (the far wing is hidden behind the fuselage)
    for f in (0.3, 0.68):
        ex = 130 + (-6 - 130) * f + 30
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(ex - 60, -44, ex + 10, -30), 8, 8), P(dk))
    # landing gear (under the near wing engines)
    if gear:
        for gx, gy, r, leg_l in ((95, 30, 26, 76), (-250, 20, 13, 30)):
            c.drawLine(gx, gy, gx, gy + leg_l, SP((50, 52, 54), 8 if r > 20 else 5))
            c.drawCircle(gx, gy + leg_l + r * 0.4, r, P((32, 32, 34)))
            c.drawCircle(gx, gy + leg_l + r * 0.4, r * 0.45, P((110, 112, 116)))
    # fuselage
    fus = smooth_closed([(305, 4), (292, -14), (250, -30), (120, -40), (-120, -38), (-230, -26), (-292, -12), (-300, 0), (-290, 10),
                         (-200, 22), (0, 34), (200, 30), (280, 20)])
    flat(c, fus, base, sh, sh_off=(0, 9), rim=RIM, rim_d=(0, -3), rim_a=rim_a)
    c.drawPath(poly([(-260, 4), (240, 8), (240, 12), (-260, 9)]), P(dk))
    # fin with a long dorsal fairing (the generic heavy bomber shape)
    fin = smooth_closed([(-150, -36), (-205, -50), (-236, -92), (-262, -122), (-290, -126), (-304, -100), (-300, -14)])
    flat(c, fin, base, sh, sh_off=(6, 0), rim=RIM, rim_d=(-2.5, -2), rim_a=rim_a)
    # near tailplane coming toward the camera
    tp = poly([(-220, 4), (-296, 2), (-312, 24), (-252, 26)])
    flat(c, tp, base, sh, sh_off=(0, 5), rim=RIM, rim_d=(0, -2), rim_a=rim_a)
    # near wing, foreshortened toward the camera, with two engines on its leading edge
    wing = poly([(140, 8), (-40, 14), (-80, 44), (60, 42)])
    flat(c, wing, base, sh, sh_off=(0, 6), rim=RIM, rim_d=(0, -3), rim_a=rim_a)
    c.drawPath(poly([(-40, 14), (-80, 44), (-66, 44), (-28, 16)]), P(dk))
    for k, f in enumerate((0.3, 0.68)):
        lx = 140 + (60 - 140) * f; ly = 8 + (42 - 8) * f
        nac = skia.RRect.MakeRectXY(skia.Rect(lx - 80, ly - 15, lx + 34, ly + 13), 14, 14)
        pth = skia.Path(); pth.addRRect(nac)
        flat(c, pth, base, sh, sh_off=(0, 6), rim=RIM, rim_d=(0, -2.5), rim_a=rim_a)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(lx + 18, ly - 13, lx + 38, ly + 11), 9, 9), P((60, 66, 54)))
        px = lx + 42
        c.drawOval(skia.Rect(px - 7, ly - 56, px + 7, ly + 56), P(PROP, 70))
        bl = math.sin(t * 40 * prop_k + k)
        c.drawLine(px, ly, px, ly - 54 * bl, SP(PROP, 6, 180)); c.drawLine(px, ly, px, ly + 54 * bl * 0.7, SP(PROP, 6, 180))
        c.drawCircle(px, ly, 7, P((70, 74, 70)))
        if smoke_engine and k == 0 and fire > 0:
            c.drawCircle(lx - 20, ly, 34 * fire, P((255, 150, 60), 220 * fire, MaskFilter=blur(12)))
            c.drawCircle(lx - 20, ly, 18 * fire, P((255, 230, 140), 255 * fire))
    # glass nose, cockpit, top turret, waist windows
    c.drawPath(smooth_closed([(306, 4), (294, -14), (268, -20), (262, 2), (276, 18)]), P(GLASS))
    c.drawPath(smooth_closed([(232, -30), (212, -46), (178, -46), (170, -36)]), P(GLASS))
    c.drawPath(smooth_closed([(206, -40), (194, -44), (186, -40)]), P(GLASS_HI, 180))
    c.drawOval(skia.Rect(110, -58, 150, -36), P(GLASS))
    for wx in (-60, -40, 40):
        c.drawCircle(wx, -10, 5, P(GLASS))
    # holes on the returners: wings, tail and body only, never the engines or cockpit
    if holes:
        for i, (hx, hy) in enumerate([(-250, -70), (-262, -96), (-150, -20), (-80, 12), (20, -24), (-226, -42), (-30, 30), (-55, 38), (0, 26),
                                      (-270, 14), (-290, 18), (-110, -8)]):
            r = 6 + i % 3
            c.drawCircle(hx, hy, r, P((26, 22, 20)))
            c.drawCircle(hx - 1, hy - 1, r * 0.4, P((255, 230, 190), 140))
    c.restore()
