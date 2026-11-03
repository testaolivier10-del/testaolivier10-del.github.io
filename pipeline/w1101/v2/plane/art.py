"""Art for the survivorship bias Short (rebuild, 2026-11-01). House flat layered style, all drawn in code.
A generic 1940s four engine bomber (no insignia, no real plane copied), seen from the side, from above, small in formation."""
import math, sys
import numpy as np, skia
sys.path.insert(0, '/home/claude/plane')

W, H = 1080, 1920


def C(rgb, a=255):
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(max(0, min(255, a))))


def P(col, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), **k)


def SP(col, w, a=255, **k):
    return skia.Paint(AntiAlias=True, Color=C(col, a), Style=skia.Paint.kStroke_Style, StrokeWidth=w,
                      StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join, **k)


def blur(r):
    return skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, max(0.1, r))


def sm(u):
    u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)


def ease_io(u):
    u = min(1.0, max(0.0, u)); return 0.5 - 0.5 * math.cos(math.pi * u)


def ease_out(u):
    u = min(1.0, max(0.0, u)); return 1 - (1 - u) ** 3


def lerp(a, b, u):
    return a + (b - a) * u


def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def poly(pts):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p


def curve(pts, closed=True):
    n = len(pts); p = skia.Path(); p.moveTo(*pts[0])
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0, p1, p2, p3 = pts[i - 1] if (closed or i > 0) else pts[0], pts[i], pts[(i + 1) % n], pts[(i + 2) % n] if (closed or i + 2 < n) else pts[-1]
        p.cubicTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, *p2)
    if closed: p.close()
    return p


def op(a, b, kind):
    r = skia.Op(a, b, kind)
    return r if r is not None else skia.Path()


def shade_rim(c, path, shade, rim, light=(-0.6, -0.8), sh_d=10, rim_d=3.5, rim_a=220, sh_a=255):
    """house method: a hard shade tone on the side away from the light, a warm rim on the lit edge"""
    q = skia.Path(path); q.offset(-light[0] * sh_d, -light[1] * sh_d)
    d = op(path, q, skia.PathOp.kDifference_PathOp)
    if shade is not None: c.drawPath(d, P(shade, sh_a))
    q2 = skia.Path(path); q2.offset(light[0] * -rim_d * -1 * -1, 0) if False else None
    q2 = skia.Path(path); q2.offset(-light[0] * rim_d, -light[1] * rim_d)
    r = op(path, q2, skia.PathOp.kDifference_PathOp)
    q3 = skia.Path(path); q3.offset(light[0] * rim_d, light[1] * rim_d)
    r = op(path, q3, skia.PathOp.kDifference_PathOp)
    if rim is not None: c.drawPath(r, P(rim, rim_a))


def vgrad(c, rect, stops):
    """stops: [(pos 0..1, rgb)]"""
    sh = skia.GradientShader.MakeLinear([skia.Point(0, rect.top()), skia.Point(0, rect.bottom())],
                                        [C(s[1]) for s in stops], [s[0] for s in stops])
    c.drawRect(rect, skia.Paint(Shader=sh))


def rglow(c, x, y, r, col, a=255):
    sh = skia.GradientShader.MakeRadial(skia.Point(x, y), r, [C(col, a), C(col, 0)])
    c.drawCircle(x, y, r, skia.Paint(Shader=sh))


# ---------------------------------------------------------------- palette
OLIVE = (104, 116, 78)
OLIVE_SH = (70, 80, 54)
OLIVE_DK = (58, 66, 44)
OLIVE_HI = (138, 148, 104)
GLASS = (40, 52, 82)
GLASS_HI = (150, 180, 220)
METAL = (150, 156, 160)
TIRE = (32, 30, 32)
HOLE = (22, 22, 20)


# ---------------------------------------------------------------- bomber, side view (nose to +x), local units: length about 1000
HOLES_SIDE = [(-180, -20), (-140, 12), (-60, -30), (40, 6), (110, -22), (-300, -10), (-360, 10), (-420, -40), (-450, -120),
              (-470, -170), (-400, -95), (180, 18), (250, -14), (-230, 24)]
WING_HOLES_SIDE = [(-40, 34), (20, 30), (70, 36), (-90, 32)]


def bomber_side(c, x, y, s, rot=0.0, t=0.0, light=(-0.6, -0.8), rim=(255, 214, 150), gear=0.0, holes=1.0, backlit=0.0,
                smoke=0.0, dark=0.0, prop=1.0, flaps=0.0, tint=None, tint_a=0):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    base = mix(OLIVE, (20, 26, 38), dark); sh = mix(OLIVE_SH, (14, 18, 28), dark); dk = mix(OLIVE_DK, (12, 16, 24), dark)
    # far wing (behind fuselage): a thin dark sliver above
    farw = poly([(-60, -20), (120, -30), (150, -48), (-40, -44)])
    c.drawPath(farw, P(dk))
    # far engines peeking over the fuselage top
    for ex in (60, 150):
        c.drawPath(curve([(ex - 30, -40), (ex + 70, -46), (ex + 78, -30), (ex - 30, -26)]), P(dk))
    # tail fin
    fin = curve([(-430, -40), (-470, -110), (-510, -196), (-470, -214), (-410, -200), (-330, -110), (-260, -56)])
    c.drawPath(fin, P(base)); shade_rim(c, fin, sh, rim, light)
    # rudder line
    c.drawLine(-470, -60, -488, -196, SP(dk, 4))
    # horizontal stabilizer (near)
    stab = curve([(-520, 6), (-400, -8), (-340, 6), (-400, 26), (-510, 24)])
    # fuselage
    fus = curve([(404, -8), (380, -48), (300, -66), (100, -72), (-200, -60), (-420, -36), (-540, -6), (-545, 12),
                 (-420, 34), (-200, 52), (100, 58), (300, 52), (390, 30)])
    c.drawPath(fus, P(base)); shade_rim(c, fus, sh, rim, light)
    # belly shadow band
    c.save(); c.clipPath(fus, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-600, 24, 500, 80), P(sh))
    # panel lines
    for px in (-330, -150, 40, 220):
        c.drawLine(px, -80, px - 6, 70, SP(dk, 2.4, 120))
    c.restore()
    # nose glass
    nose = curve([(440, -2), (410, -40), (350, -58), (334, -18), (344, 24), (404, 22)])
    c.drawPath(nose, P(GLASS))
    c.drawPath(curve([(420, -22), (392, -46), (372, -40), (400, -16)]), P(GLASS_HI, 200))
    for gx in (372, 400): c.drawLine(gx, -50, gx + 4, 22, SP((30, 38, 60), 3))
    # cockpit glass
    cp = curve([(300, -66), (262, -96), (196, -100), (170, -72), (240, -68)])
    c.drawPath(cp, P(GLASS)); c.drawPath(curve([(260, -88), (224, -94), (212, -82), (250, -78)]), P(GLASS_HI, 170))
    # waist window, turret
    c.drawRoundRect(skia.Rect(-180, -36, -130, -6), 6, 6, P(GLASS))
    c.drawPath(curve([(60, -72), (78, -100), (120, -102), (134, -74)]), P(GLASS))
    # holes in fuselage and fin (backlit: light leaks through them)
    if holes > 0:
        rs = np.random.default_rng(3)
        for i, (hx, hy) in enumerate(HOLES_SIDE):
            r = 7 + rs.uniform(0, 5)
            pet = [(hx + r * (1.0 + 0.5 * ((k * 37 + i) % 5) / 5) * math.cos(k * 0.698), hy + r * (1.0 + 0.5 * ((k * 53 + i) % 5) / 5) * math.sin(k * 0.698)) for k in range(9)]
            c.drawPath(curve(pet), P(OLIVE_HI, 230 * holes))                      # torn metal petals catching light
            core = [(hx + 0.62 * (x - hx), hy + 0.62 * (y - hy)) for x, y in pet]
            c.drawPath(curve(core), P(HOLE, 255 * holes))
            if backlit > 0:
                c.drawCircle(hx + 1, hy, r * 0.22, P((255, 236, 190), 230 * backlit * holes))
    # near wing: seen almost edge on, slight top showing
    wing = curve([(-70, 28), (60, 18), (190, 26), (210, 44), (60, 52), (-80, 46)])
    c.drawPath(wing, P(base)); shade_rim(c, wing, sh, rim, light, sh_d=6)
    if flaps > 0:
        c.drawPath(poly([(-80, 44), (40, 50), (40, 50 + 16 * flaps), (-80, 44 + 18 * flaps)]), P(sh))
    if holes > 0:
        for hx, hy in WING_HOLES_SIDE:
            c.drawCircle(hx, hy, 5, P(HOLE, 255 * holes))
            if backlit > 0: rglow(c, hx, hy, 16, (255, 228, 170), 170 * backlit * holes)
    # near engines (two), nacelles under the wing
    for k, ex in enumerate((10, 150)):
        nac = curve([(ex - 70, 40), (ex + 70, 30), (ex + 104, 44), (ex + 98, 76), (ex + 60, 86), (ex - 70, 70)])
        c.drawPath(nac, P(base)); shade_rim(c, nac, sh, rim, light, sh_d=7)
        c.drawOval(skia.Rect(ex + 90, 34, ex + 112, 82), P(dk))
        if prop > 0:
            pc = (ex + 114, 58)
            c.drawOval(skia.Rect(pc[0] - 9, pc[1] - 92, pc[0] + 9, pc[1] + 92), P((220, 224, 230), 110 * prop))
            c.drawOval(skia.Rect(pc[0] - 9, pc[1] - 92, pc[0] + 9, pc[1] + 92), SP((90, 94, 100), 2, 120 * prop))
            ang = t * 40 + k * 1.3
            by = math.sin(ang) * 88
            c.drawLine(pc[0], pc[1], pc[0] + 2, pc[1] + by, SP((60, 60, 64), 8, 170 * prop))
            c.drawCircle(pc[0], pc[1], 8, P((70, 70, 76)))
    # stabilizer drawn last (near)
    c.drawPath(stab, P(base)); shade_rim(c, stab, sh, rim, light, sh_d=5)
    # landing gear
    if gear > 0:
        gx = 100
        c.drawLine(gx, 50, gx - 10, 50 + 70 * gear, SP(METAL, 8))
        c.drawCircle(gx - 10, 58 + 70 * gear, 28 * gear, P(TIRE)); c.drawCircle(gx - 10, 58 + 70 * gear, 11 * gear, P(METAL))
        c.drawLine(-470, 20, -476, 20 + 34 * gear, SP(METAL, 5))
        c.drawCircle(-476, 26 + 34 * gear, 12 * gear, P(TIRE))
    if tint is not None and tint_a > 0:
        c.saveLayer(None, None)
        c.restore()
    c.restore()


# ---------------------------------------------------------------- bomber, top view (nose up), local units: span about 880
HOLES_TOP = {
    'wings': [(-330, -20), (-300, 2), (-205, -30), (-180, 10), (-390, -12), (-150, -40), (175, -28), (215, 6), (300, -10), (350, 0),
              (395, -20), (160, 12), (-260, -8), (265, -32)],
    'tail': [(-100, 250), (-60, 258), (85, 246), (120, 258), (-8, 286), (40, 254)],
    'body': [(-14, 40), (12, 90), (-10, 150), (16, -40), (-6, 200), (8, 5), (-18, 110)],
}
ENGINES_X = (-240, -120, 120, 240)


def bomber_top(c, x, y, s, rot=0.0, t=0.0, holes=None, armor=None, eng_ring=0.0, ring_col=(255, 210, 63), prop=1.0,
               light=(-0.6, -0.8), rim=(255, 220, 160), paper=False, dark=0.0, even=0.0, cockpit=True, ok=0.0):
    """holes: dict name -> 0..1 (how many of that group are shown); armor: dict name -> 0..1 plate"""
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    if paper:
        base, sh, dk = (232, 222, 200), (205, 192, 168), (120, 108, 92)
    else:
        base, sh, dk = mix(OLIVE, (20, 26, 38), dark), mix(OLIVE_SH, (14, 18, 28), dark), mix(OLIVE_DK, (12, 16, 24), dark)
    ink = (60, 52, 46)
    wing = curve([(-440, -30), (-200, -58), (-30, -72), (30, -72), (200, -58), (440, -30), (444, -4), (200, 30), (30, 42), (-30, 42), (-200, 30), (-444, -4)])
    tail = curve([(-140, 236), (-30, 222), (30, 222), (140, 236), (142, 262), (30, 274), (-30, 274), (-142, 262)])
    fus = curve([(0, -330), (34, -290), (44, -150), (40, 100), (28, 270), (0, 310), (-28, 270), (-40, 100), (-44, -150), (-34, -290)])
    nacs = []
    for ex in ENGINES_X:
        nacs.append(curve([(ex - 20, -60 + abs(ex) * 0.05), (ex - 22, -130 + abs(ex) * 0.04), (ex, -146 + abs(ex) * 0.04), (ex + 22, -130 + abs(ex) * 0.04), (ex + 20, -60 + abs(ex) * 0.05), (ex, 10)]))
    for pth in (wing, tail):
        c.drawPath(pth, P(base))
        if paper: c.drawPath(pth, SP(ink, 3))
        else: shade_rim(c, pth, sh, rim, light, sh_d=8)
    for n in nacs:
        c.drawPath(n, P(base))
        if paper: c.drawPath(n, SP(ink, 3))
        else: shade_rim(c, n, sh, rim, light, sh_d=6)
    c.drawPath(fus, P(base))
    if paper: c.drawPath(fus, SP(ink, 3))
    else: shade_rim(c, fus, sh, rim, light, sh_d=8)
    # cockpit glass
    c.drawPath(curve([(0, -300), (18, -268), (0, -250), (-18, -268)]), P(GLASS if not paper else ink))
    # props
    for i, ex in enumerate(ENGINES_X):
        py = -146 + abs(ex) * 0.04 - 8
        if paper:
            c.drawLine(ex - 40, py, ex + 40, py, SP(ink, 3))
        elif prop > 0:
            c.drawOval(skia.Rect(ex - 52, py - 6, ex + 52, py + 6), P((210, 214, 220), 90 * prop))
            a = t * 37 + i
            c.drawLine(ex - 50 * math.cos(a), py, ex + 50 * math.cos(a), py, SP((60, 60, 64), 6, 140 * prop))
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
    # Wald's expectation: light pencil dots spread evenly over the WHOLE plane (bullets hit everywhere), engines included
    if even > 0:
        whole = wing
        for q in [tail, fus] + nacs: whole = op(whole, q, skia.PathOp.kUnion_PathOp)
        c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
        k = 0
        for gy in range(-330, 320, 34):
            for gx in range(-460, 470, 46):
                k += 1
                xx = gx + (23 if (gy // 34) % 2 else 0)
                if whole.contains(xx, gy):
                    sweep = sm((even * 1.6) - (xx + 460) / 940)
                    if sweep > 0: c.drawCircle(xx, gy, 5, P((96, 92, 100), 200 * sweep))
        c.restore()
    # where a plane CAN take a hit: green rings around the hole groups
    if ok > 0:
        for (gx, gy, rw, rh) in [(-300, -14, 170, 70), (300, -14, 170, 70), (0, 248, 170, 54), (0, 80, 62, 190)]:
            path = skia.Path(); path.addOval(skia.Rect(gx - rw, gy - rh, gx + rw, gy + rh))
            c.drawPath(path, SP((120, 220, 140), 7, 255 * min(1, ok * 1.5), PathEffect=skia.DashPathEffect.Make([22, 14], 0)))
    # armor plates: steel grey with a rivet row, slide in
    if armor:
        spots = dict(wings=[(-300, -16), (300, -16)], tail=[(0, 250)], body=[(0, 80)], engines=[(ex, -96 + abs(ex) * 0.045) for ex in ENGINES_X], cockpit=[(0, -275)])
        sizes = dict(wings=(150, 50), tail=(220, 34), body=(56, 230), engines=(52, 100), cockpit=(64, 70))
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
    # engine rings (the missing holes)
    if eng_ring > 0:
        for ex in ENGINES_X:
            cy = -96 + abs(ex) * 0.045
            k = ease_out(eng_ring)
            path = skia.Path(); path.addArc(skia.Rect(ex - 52, cy - 82, ex + 52, cy + 82), -90, 360 * k)
            c.drawPath(path, SP(ring_col, 7))
        if cockpit:
            path = skia.Path(); path.addArc(skia.Rect(-56, -330, 56, -220), -90, 360 * ease_out(eng_ring)); c.drawPath(path, SP(ring_col, 7))
    c.restore()


# ---------------------------------------------------------------- tiny bomber silhouette for formations (side, nose +x)
def bomber_small(c, x, y, s, col, rot=0.0, rim=None, rim_a=160, t=0.0, fire=0.0):
    """the side view bomber at small size, silhouetted against the dusk sky (four engines, props turning)"""
    bomber_side(c, x, y, s * 0.28, rot, t, light=(0.6, 0.7), rim=rim or (255, 190, 150), gear=0.0, holes=0.0, dark=0.72, prop=1.0)
    if fire > 0:
        c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * 0.28, s * 0.28)
        fx, fy = 200, 40
        fx, fy = 170, 60
        rglow(c, fx, fy, 240, (255, 150, 50), 230 * fire)
        for k in range(7):
            fl = curve([(fx - 30 + k * 6, fy), (fx + 10 - k * 30, fy - 60 - k * 10 + math.sin(t * 18 + k) * 14), (fx + 40 - k * 26, fy - 10)])
            c.drawPath(fl, P((255, 200 - k * 18, 70), 240 * fire))
        c.restore()


# ---------------------------------------------------------------- environment helpers
def cloud(c, cx, cy, w, h, col, sh, seed, a=255, rim=None):
    rs = np.random.default_rng(seed)
    n = 6
    p = skia.Path()
    for i in range(n):
        u = (i + 0.5) / n
        bx = cx - w / 2 + u * w
        r = h * (0.45 + 0.4 * math.sin(math.pi * u)) * (0.85 + 0.3 * rs.uniform())
        p.addCircle(bx, cy - r * 0.35, r)
    p.addRect(skia.Rect(cx - w / 2, cy - h * 0.15, cx + w / 2, cy + h * 0.25))
    b = skia.OpBuilder()
    for q in [p]: b.add(q, skia.PathOp.kUnion_PathOp)
    pp = b.resolve() or p
    bottom = skia.Path(); bottom.addRect(skia.Rect(cx - w, cy - h * 2, cx + w, cy + h))
    pp = op(pp, bottom, skia.PathOp.kIntersect_PathOp)
    c.drawPath(pp, P(col, a))
    q = skia.Path(pp); q.offset(0, -h * 0.18)
    c.drawPath(op(pp, q, skia.PathOp.kDifference_PathOp), P(sh, a))
    if rim is not None:
        q2 = skia.Path(pp); q2.offset(0, 4)
        c.drawPath(op(pp, q2, skia.PathOp.kDifference_PathOp), P(rim, a * 0.8))


def grass_blades(c, y0, t, col, seed, n=60, h=(40, 120), x_off=0.0, sway=1.0, wide=1.0):
    rs = np.random.default_rng(seed)
    for i in range(n):
        bx = rs.uniform(-60, W + 60) + x_off
        bx = (bx + 60) % (W + 120) - 60
        bh = rs.uniform(*h); bw = rs.uniform(6, 14) * wide
        ph = rs.uniform(0, 6.28)
        sw = math.sin(t * 1.3 + ph + bx * 0.004) * 12 * sway * (bh / 100)
        p = skia.Path(); p.moveTo(bx - bw, y0); p.quadTo(bx - bw * 0.3 + sw * 0.5, y0 - bh * 0.6, bx + sw, y0 - bh)
        p.quadTo(bx + bw * 0.3 + sw * 0.5, y0 - bh * 0.6, bx + bw, y0); p.close()
        c.drawPath(p, P(col))
