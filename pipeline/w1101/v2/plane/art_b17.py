"""Boeing B-17G Flying Fortress for the survivorship bias Short (Olivier 2026-11-02: the bombers read as jets). Drop in
replacement for bomber_side, bomber_top and bomber_small in art.py (same signatures); `from art_b17 import *` after art.

Proportions from the B-17G: span 103 ft 9 in, length 74 ft 4 in, height 19 ft 1 in. Long straight tapered wings with
rounded tips set low on the fuselage, four radial engines in round cowlings well ahead of the leading edge with three blade
props, a cylindrical fuselage with a clear plexiglass nose and chin turret, a stepped cockpit, the top turret behind it,
waist windows, a ball turret under the belly, and the tall tail fin with its long curved dorsal fillet, broad horizontal
stabilizers and the tail gunner's position. Olive drab above, neutral grey below. House flat layered style.

Side view units: about 13.25 per foot, nose at +x (x 440), tail at x -545, fuselage centre line y 0.
Top view units: about 8.5 per foot, nose up (y -330), span +-440."""
import math
import numpy as np, skia
from art import *
from art import OLIVE, OLIVE_SH, OLIVE_DK, OLIVE_HI, GLASS, GLASS_HI, METAL, TIRE, HOLE

GREY, GREY_SH = (150, 154, 150), (118, 122, 120)
COWL = (74, 82, 58)
FIRE_PT = (215, 48)          # the near inboard engine (side view units), for fire and for aiming the flak at it

# ---------------------------------------------------------------- side view
HOLES_SIDE = [(-150, -22), (-110, 14), (-30, -34), (60, 4), (120, -26), (-280, -10), (-340, 8), (-400, -30), (-430, -112),
              (-455, -165), (-385, -80), (170, 14), (250, -14), (-220, 22)]
WING_HOLES_SIDE = [(-40, 38), (10, 34), (60, 40), (-80, 36)]


def _fus_side():
    # top: nose glass, the stepped windscreen, a straight spine, then the dorsal fillet sweeping up into the fin;
    # bottom: chin, a flat belly, tapering up to the tail gunner
    return curve([(446, 4), (430, -30), (392, -48), (330, -54), (300, -60), (270, -78), (222, -84), (120, -76), (-40, -70),
                  (-200, -64), (-330, -56), (-470, -30), (-548, -12), (-556, 6), (-500, 22), (-380, 36), (-200, 50),
                  (0, 56), (200, 56), (330, 50), (410, 34)])


def _fin_side():
    return curve([(-250, -64), (-330, -80), (-410, -120), (-452, -175), (-478, -236), (-500, -252), (-532, -246), (-548, -210),
                  (-552, -120), (-556, -40), (-520, -24)])


def _cowl(c, cx, cy, r, base, sh, dk, rim, light, t, prop, k, sc=1.0):
    """a radial engine nacelle seen from the side: round cowling in front, nacelle tapering back under the wing"""
    nac = curve([(cx - 10, cy - r * 0.92), (cx - 140 * sc, cy - r * 0.55), (cx - 190 * sc, cy - r * 0.15), (cx - 150 * sc, cy + r * 0.7),
                 (cx - 10, cy + r * 0.95)])
    c.drawPath(nac, P(base)); shade_rim(c, nac, sh, rim, light, sh_d=6)
    cowl = curve([(cx + 26, cy - r * 0.7), (cx + 4, cy - r), (cx - 20, cy - r * 0.98), (cx - 20, cy + r * 0.98), (cx + 4, cy + r),
                  (cx + 26, cy + r * 0.7)])
    c.drawPath(cowl, P(COWL)); shade_rim(c, cowl, dk, rim, light, sh_d=5)
    c.drawLine(cx - 4, cy - r * 0.9, cx - 4, cy + r * 0.9, SP(dk, 3, 160))
    if prop > 0:
        pc = (cx + 32, cy)
        R = 77
        c.drawOval(skia.Rect(pc[0] - 8, pc[1] - R, pc[0] + 8, pc[1] + R), P((220, 224, 230), 90 * prop))
        for b in range(3):                                   # three blades, edge on: only their vertical extent shows
            ang = t * 40 + k * 1.3 + b * 2.094
            by = math.sin(ang) * R
            c.drawLine(pc[0], pc[1], pc[0] + 2, pc[1] + by, SP((54, 54, 58), 9, 160 * prop))
        c.drawCircle(pc[0], pc[1], 10, P((70, 70, 76)))


def bomber_side(c, x, y, s, rot=0.0, t=0.0, light=(-0.6, -0.8), rim=(255, 214, 150), gear=0.0, holes=1.0, backlit=0.0,
                smoke=0.0, dark=0.0, prop=1.0, flaps=0.0, tint=None, tint_a=0):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    base = mix(OLIVE, (20, 26, 38), dark); sh = mix(OLIVE_SH, (14, 18, 28), dark); dk = mix(OLIVE_DK, (12, 16, 24), dark)
    grey = mix(GREY, (20, 26, 38), dark); grey_sh = mix(GREY_SH, (14, 18, 28), dark)
    # far wing and far engines (behind the fuselage, darker, slightly higher because of dihedral)
    farw = curve([(-80, 18), (150, 10), (190, 0), (170, -6), (-80, 4)])
    c.drawPath(farw, P(dk))
    for k, (ex, ey) in enumerate(((268, 14), (238, 2))):
        _cowl(c, ex, ey, 26, dk, dk, mix(dk, (0, 0, 0), 0.2), None, light, t, prop * 0.8, k + 2, sc=0.8)
    # far horizontal stabilizer
    c.drawPath(curve([(-560, -12), (-440, -24), (-390, -16), (-450, -2), (-555, 0)]), P(dk))
    # fin with the dorsal fillet, rudder hinge line
    fin = _fin_side()
    c.drawPath(fin, P(base)); shade_rim(c, fin, sh, rim, light)
    c.drawLine(-505, -60, -520, -238, SP(dk, 3.5, 200))
    # fuselage: olive drab above, neutral grey below
    fus = _fus_side()
    c.drawPath(fus, P(base))
    c.save(); c.clipPath(fus, skia.ClipOp.kIntersect, True)
    c.drawPath(curve([(460, 10), (300, 18), (0, 22), (-300, 14), (-560, -2), (-560, 80), (460, 80)], closed=True), P(grey))
    c.drawRect(skia.Rect(-600, 40, 500, 90), P(grey_sh))
    for px in (-420, -300, -140, 40, 180, 300):              # panel lines
        c.drawLine(px, -90, px - 4, 70, SP(dk, 2, 90))
    c.restore()
    shade_rim(c, fus, None, rim, light)
    # clear plexiglass nose with its frame, chin turret under it, cheek window
    nose = curve([(448, 4), (432, -30), (398, -46), (372, -44), (370, 10), (400, 28), (436, 22)])
    c.drawPath(nose, P(GLASS))
    c.drawPath(curve([(430, -22), (408, -40), (392, -36), (412, -16)]), P(GLASS_HI, 190))
    for gx in (392, 416): c.drawLine(gx, -44, gx + 4, 24, SP((30, 38, 60), 2.5))
    c.drawLine(372, -12, 444, -6, SP((30, 38, 60), 2.5))
    c.drawCircle(398, 48, 22, P(mix((60, 62, 66), (12, 16, 24), dark)))       # chin turret
    c.drawLine(410, 46, 452, 42, SP((40, 40, 44), 5)); c.drawLine(410, 54, 452, 52, SP((40, 40, 44), 5))
    c.drawRoundRect(skia.Rect(332, -32, 352, -14), 4, 4, P(GLASS))
    # stepped cockpit windscreen
    cp = curve([(300, -60), (270, -80), (224, -86), (214, -66), (262, -62)])
    c.drawPath(cp, P(GLASS)); c.drawLine(246, -84, 250, -62, SP((30, 38, 60), 2.5))
    c.drawPath(curve([(266, -76), (236, -82), (232, -72), (258, -70)]), P(GLASS_HI, 150))
    # top turret dome behind the cockpit
    c.drawPath(curve([(204, -82), (196, -104), (170, -112), (144, -104), (138, -80)]), P(GLASS))
    c.drawPath(curve([(194, -98), (176, -108), (166, -102), (184, -94)]), P(GLASS_HI, 170))
    # radio room window, waist gun window, tail gunner glass
    c.drawRoundRect(skia.Rect(-60, -52, -28, -34), 5, 5, P(GLASS))
    c.drawRoundRect(skia.Rect(-236, -40, -186, -10), 6, 6, P(GLASS))
    c.drawPath(curve([(-540, -22), (-566, -12), (-570, 4), (-546, 8), (-536, -6)]), P(GLASS))
    # ball turret under the belly
    c.drawCircle(-70, 64, 26, P(mix((84, 88, 92), (12, 16, 24), dark)))
    c.drawCircle(-76, 58, 9, P(GLASS))
    # holes in the fuselage and fin (backlit: light leaks through them)
    if holes > 0:
        rs = np.random.default_rng(3)
        for i, (hx, hy) in enumerate(HOLES_SIDE):
            r = 7 + rs.uniform(0, 5)
            pet = [(hx + r * (1.0 + 0.5 * ((k * 37 + i) % 5) / 5) * math.cos(k * 0.698), hy + r * (1.0 + 0.5 * ((k * 53 + i) % 5) / 5) * math.sin(k * 0.698)) for k in range(9)]
            c.drawPath(curve(pet), P(OLIVE_HI if hy < 18 else (178, 182, 178), 230 * holes))
            core = [(hx + 0.62 * (x_ - hx), hy + 0.62 * (y_ - hy)) for x_, y_ in pet]
            c.drawPath(curve(core), P(HOLE, 255 * holes))
            if backlit > 0:
                c.drawCircle(hx + 1, hy, r * 0.22, P((255, 236, 190), 230 * backlit * holes))
    # near wing: low on the fuselage, almost edge on, a sliver of the top showing, flaps on the trailing edge
    wing = curve([(-90, 30), (60, 24), (200, 30), (226, 44), (60, 54), (-96, 48)])
    c.drawPath(wing, P(base)); shade_rim(c, wing, sh, rim, light, sh_d=5)
    if flaps > 0:
        c.drawPath(poly([(-96, 46), (20, 52), (20, 52 + 18 * flaps), (-96, 46 + 20 * flaps)]), P(sh))
    if holes > 0:
        for hx, hy in WING_HOLES_SIDE:
            c.drawCircle(hx, hy, 5, P(HOLE, 255 * holes))
            if backlit > 0: rglow(c, hx, hy, 16, (255, 228, 170), 170 * backlit * holes)
    # near engines: outboard a little further back and higher, inboard in front, cowlings well ahead of the wing
    _cowl(c, 286, 44, 30, mix(base, (0, 0, 0), 0.08), sh, dk, rim, light, t, prop, 1, sc=0.9)
    _cowl(c, 318, 52, 33, base, sh, dk, rim, light, t, prop, 0)
    # near horizontal stabilizer
    stab = curve([(-566, 2), (-450, -12), (-380, -4), (-430, 18), (-560, 18)])
    c.drawPath(stab, P(base)); shade_rim(c, stab, sh, rim, light, sh_d=4)
    # landing gear: main wheel under the inboard nacelle, tail wheel
    if gear > 0:
        gx = 210
        c.drawLine(gx, 70, gx - 8, 76 + 70 * gear, SP(METAL, 9)); c.drawLine(gx + 30, 70, gx - 8, 76 + 70 * gear, SP(METAL, 5))
        c.drawCircle(gx - 8, 84 + 70 * gear, 30 * gear, P(TIRE)); c.drawCircle(gx - 8, 84 + 70 * gear, 12 * gear, P(METAL))
        c.drawLine(-470, 26, -478, 26 + 34 * gear, SP(METAL, 5))
        c.drawCircle(-478, 32 + 34 * gear, 13 * gear, P(TIRE))
    c.restore()


def bomber_small(c, x, y, s, col, rot=0.0, rim=None, rim_a=160, t=0.0, fire=0.0):
    """the side view bomber at small size, silhouetted against the dusk sky (four engines, props turning)"""
    bomber_side(c, x, y, s * 0.28, rot, t, light=(0.6, 0.7), rim=rim or (255, 190, 150), gear=0.0, holes=0.0, dark=0.72, prop=1.0)
    if fire > 0:
        c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * 0.28, s * 0.28)
        fx, fy = FIRE_PT
        rglow(c, fx, fy, 240, (255, 150, 50), 230 * fire)
        for k in range(7):
            fl = curve([(fx - 30 + k * 6, fy), (fx + 10 - k * 30, fy - 60 - k * 10 + math.sin(t * 18 + k) * 14), (fx + 40 - k * 26, fy - 10)])
            c.drawPath(fl, P((255, 200 - k * 18, 70), 240 * fire))
        c.restore()


# ---------------------------------------------------------------- top view (nose up), span about 880
ENGINES_X = (-255, -140, 140, 255)


def _le(x):            # wing leading edge y at span position x (tapered, swept leading edge)
    return -112 + 0.17 * abs(x)


def _te(x):            # trailing edge, nearly straight
    return 46 - 0.04 * abs(x)


def eng_y(ex):
    """engine centre (cowling plus nacelle) in top view, used for armor plates and the rings"""
    return _le(ex) - 22


HOLES_TOP = {
    'wings': [(-330, -20), (-300, 4), (-200, -30), (-190, 10), (-395, -6), (-70, -50), (-360, -30), (175, -26), (205, 8), (300, -10),
              (350, 2), (400, -16), (80, -40), (-90, 12), (330, -32), (60, 10)],
    'tail': [(-120, 262), (-70, 270), (85, 258), (130, 268), (-10, 300), (40, 266)],
    'body': [(-14, 40), (12, 90), (-10, 150), (16, -40), (-6, 200), (8, 5), (-18, 110)],
}


def _top_paths():
    span = [-440, -420, -380, -300, -200, -120, -40, 40, 120, 200, 300, 380, 420, 440]
    le = [(x, _le(x)) for x in span if abs(x) < 440]
    wing = curve([(-436, _le(436) + 18)] + [(x, _le(x)) for x in (-410, -300, -200, -100, 0, 100, 200, 300, 410)] + [(436, _le(436) + 18),
                  (430, _te(430) - 8)] + [(x, _te(x)) for x in (300, 150, 0, -150, -300)] + [(-430, _te(430) - 8)])
    tail = curve([(-188, 262), (-170, 238), (-60, 226), (60, 226), (170, 238), (188, 262), (180, 282), (60, 296), (-60, 296), (-180, 282)])
    fus = curve([(0, -332), (24, -316), (34, -270), (36, -150), (34, 60), (26, 220), (14, 300), (0, 318), (-14, 300), (-26, 220),
                 (-34, 60), (-36, -150), (-34, -270), (-24, -316)])
    nacs = []
    for ex in ENGINES_X:
        f = _le(ex) - 78; back = _te(ex) + (6 if abs(ex) < 200 else -10)
        nacs.append(curve([(ex - 20, f + 6), (ex - 26, f + 30), (ex - 24, back - 40), (ex - 12, back), (ex + 12, back), (ex + 24, back - 40),
                           (ex + 26, f + 30), (ex + 20, f + 6), (ex, f - 2)]))
    return wing, tail, fus, nacs


def bomber_top(c, x, y, s, rot=0.0, t=0.0, holes=None, armor=None, eng_ring=0.0, ring_col=(255, 210, 63), prop=1.0,
               light=(-0.6, -0.8), rim=(255, 220, 160), paper=False, dark=0.0, even=0.0, cockpit=True, ok=0.0):
    """holes: dict name -> 0..1 (how many of that group are shown); armor: dict name -> 0..1 plate"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    if paper:
        base, sh, dk = (232, 222, 200), (205, 192, 168), (120, 108, 92)
    else:
        base, sh, dk = mix(OLIVE, (20, 26, 38), dark), mix(OLIVE_SH, (14, 18, 28), dark), mix(OLIVE_DK, (12, 16, 24), dark)
    ink = (60, 52, 46)
    wing, tail, fus, nacs = _top_paths()
    for pth in (wing, tail):
        c.drawPath(pth, P(base))
        if paper: c.drawPath(pth, SP(ink, 3))
        else: shade_rim(c, pth, sh, rim, light, sh_d=8)
    if not paper:   # flap and aileron lines on the trailing edge
        for xs in ((-400, -210), (-190, -45), (45, 190), (210, 400)):
            c.drawLine(xs[0], _te(xs[0]) - 26, xs[1], _te(xs[1]) - 26, SP(dk, 2.4, 140))
    for n in nacs:
        c.drawPath(n, P(base))
        if paper: c.drawPath(n, SP(ink, 3))
        else: shade_rim(c, n, sh, rim, light, sh_d=6)
    for ex in ENGINES_X:   # the round radial cowling ring at the front of each nacelle
        f = _le(ex) - 78
        c.drawOval(skia.Rect(ex - 22, f - 4, ex + 22, f + 14), P(ink if paper else COWL))
    c.drawPath(fus, P(base))
    if paper: c.drawPath(fus, SP(ink, 3))
    else: shade_rim(c, fus, sh, rim, light, sh_d=8)
    # dorsal fillet and fin seen from above: a thin ridge down the spine into the tail
    c.drawPath(curve([(0, 150), (4, 210), (4, 300), (0, 318), (-4, 300), (-4, 210)]), P(sh if not paper else (196, 184, 160)))
    # nose glass, cockpit, top turret
    c.drawPath(curve([(0, -332), (18, -318), (22, -296), (-22, -296), (-18, -318)]), P(GLASS if not paper else ink))
    c.drawPath(curve([(0, -270), (20, -252), (16, -232), (-16, -232), (-20, -252)]), P(GLASS if not paper else ink))
    c.drawCircle(0, -205, 13, P(GLASS if not paper else ink))
    # props: three blades
    for i, ex in enumerate(ENGINES_X):
        py = _le(ex) - 86
        if paper:
            c.drawLine(ex - 44, py, ex + 44, py, SP(ink, 3))
        elif prop > 0:
            c.drawOval(skia.Rect(ex - 60, py - 6, ex + 60, py + 6), P((210, 214, 220), 90 * prop))
            for b in range(3):
                a = t * 37 + i + b * 2.094
                c.drawLine(ex, py, ex + 58 * math.cos(a), py, SP((60, 60, 64), 6, 140 * prop))
    # holes
    if holes:
        rs = np.random.default_rng(7)
        for name, pts in HOLES_TOP.items():
            u = holes.get(name, 0)
            n = int(round(len(pts) * u + 0.499)) if u > 0 else 0
            for i, (hx, hy) in enumerate(pts[:n]):
                pop = min(1.0, (len(pts) * u - i) * 1.5) if u < 1 else 1.0
                r = (8 + rs.uniform(0, 4)) * (0.6 + 0.4 * sm(pop))
                if paper:
                    c.drawCircle(hx, hy, r * 0.9, P((214, 52, 48), 255 * sm(pop)))
                else:
                    c.drawCircle(hx, hy, r, P(HOLE, 255 * sm(pop)))
                    c.drawCircle(hx + 2, hy - 2, r * 0.45, P(OLIVE_HI, 140 * sm(pop)))
    # expectation: light pencil dots spread evenly over the whole plane
    if even > 0:
        whole = wing
        for q in [tail, fus] + nacs: whole = op(whole, q, skia.PathOp.kUnion_PathOp)
        c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
        for gy in range(-330, 320, 34):
            for gx in range(-460, 470, 46):
                xx = gx + (23 if (gy // 34) % 2 else 0)
                if whole.contains(xx, gy):
                    sweep = sm((even * 1.6) - (xx + 460) / 940)
                    if sweep > 0: c.drawCircle(xx, gy, 5, P((96, 92, 100), 200 * sweep))
        c.restore()
    # where a plane CAN take a hit: green rings around the hole groups (outer wing panels, tail, body)
    if ok > 0:
        for (gx, gy, rw, rh) in [(-365, -12, 85, 52), (365, -12, 85, 52), (-88, -22, 34, 30), (88, -22, 34, 30), (0, 262, 175, 50), (0, 80, 56, 175)]:
            path = skia.Path(); path.addOval(skia.Rect(gx - rw, gy - rh, gx + rw, gy + rh))
            c.drawPath(path, SP((120, 220, 140), 7, 255 * min(1, ok * 1.5), PathEffect=skia.DashPathEffect.Make([22, 14], 0)))
    # armor plates: steel grey with a rivet row, slide in
    if armor:
        spots = dict(wings=[(-345, -14), (345, -14)], tail=[(0, 262)], body=[(0, 80)], engines=[(ex, eng_y(ex)) for ex in ENGINES_X], cockpit=[(0, -250)])
        sizes = dict(wings=(110, 46), tail=(220, 34), body=(56, 230), engines=(48, 96), cockpit=(64, 70))
        for name, u in armor.items():
            if u <= 0: continue
            w, h = sizes[name]
            for (ax, ay) in spots[name]:
                k = ease_out(u)
                off = (1 - k) * 260
                rr = skia.RRect.MakeRectXY(skia.Rect(ax - w / 2, ay - h / 2 - off, ax + w / 2, ay + h / 2 - off), 10, 10)
                c.drawRRect(rr, P((168, 176, 186), 235 * min(1, u * 2)))
                c.drawRRect(rr, SP((96, 104, 116), 4, 235 * min(1, u * 2)))
                for j in range(4):
                    if w > h: c.drawCircle(ax - w / 2 + 14 + j * (w - 28) / 3, ay - h / 2 + 10 - off, 3, P((96, 104, 116)))
                    else: c.drawCircle(ax - w / 2 + 10, ay - h / 2 + 14 + j * (h - 28) / 3 - off, 3, P((96, 104, 116)))
    # engine rings (where the missing holes would be)
    if eng_ring > 0:
        for ex in ENGINES_X:
            cy = eng_y(ex)
            k = ease_out(eng_ring)
            path = skia.Path(); path.addArc(skia.Rect(ex - 46, cy - 78, ex + 46, cy + 78), -90, 360 * k)
            c.drawPath(path, SP(ring_col, 7))
        if cockpit:
            path = skia.Path(); path.addArc(skia.Rect(-56, -330, 56, -220), -90, 360 * ease_out(eng_ring)); c.drawPath(path, SP(ring_col, 7))
    c.restore()
