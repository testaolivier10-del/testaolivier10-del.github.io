"""The water world of the dive reflex Short: open blue water lit from the surface, the dive line, marine snow, bubbles, a fish school,
a seal and a whale, and the look inside her body (brain, face nerves, the nerve to the heart, heart, vessels). All code drawn, house flat style."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/mh', '/home/claude/dv']
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from art import op, diffp, tube
from diver import skin, line_of, shade, _resample, _add, _rot

W, H = 1080, 1920
SCREEN = skia.BlendMode.kScreen
PLUS = skia.BlendMode.kPlus
_R = np.random.default_rng(11)
SNOW = [(_R.uniform(0, 1080), _R.uniform(0, 2200), _R.uniform(0.25, 1.0) ** 1.5 * 1.6 + 0.2, _R.uniform(0, 6.28), _R.uniform(0.4, 1.0)) for _ in range(150)]
FISH = [(_R.uniform(-1, 1), _R.uniform(-1, 1), _R.uniform(0.7, 1.3), _R.uniform(0, 6.28)) for _ in range(34)]


def water(c, t, depth=0.6, sunx=600, scroll=0.0, rays=1.0, sun_y=-260):
    """depth 0 = just under the surface, 1 = a hundred feet down. scroll: how far the camera has sunk (px), moves the snow"""
    d = depth
    top = mix((126, 226, 240), (22, 98, 166), d); mid = mix((40, 150, 206), (10, 54, 116), d); bot = mix((14, 84, 150), (4, 20, 58), d)
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, H)], [C(top), C(mid), C(bot)], [0, 0.45, 1.0])))
    g = skia.GradientShader.MakeRadial((sunx, sun_y), 1500, [C((200, 250, 255), int(210 * (1 - 0.55 * d))), C((120, 220, 250), int(90 * (1 - 0.5 * d))), C((60, 160, 220), 0)], [0, 0.35, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=g, BlendMode=SCREEN))
    # shafts of light from the surface, slowly swaying
    for i in range(9):
        k = i - 4; sw = math.sin(t * 0.5 + i * 1.3) * 26 + math.sin(t * 0.23 + i * 2.1) * 18
        x0 = sunx + k * 62 + sw * 0.4; x1 = sunx + k * 300 + sw * 2.2 + (k * k) * 6 * (1 if k > 0 else -1)
        w0 = 26 + 9 * (i % 3); w1 = 150 + 40 * (i % 3)
        a = (46 + 22 * ((i * 7) % 4)) * rays * (1 - 0.45 * d) * (0.75 + 0.25 * math.sin(t * 0.9 + i * 2.4))
        pth = skia.Path(); pth.addPoly([skia.Point(x0 - w0, -40), skia.Point(x0 + w0, -40), skia.Point(x1 + w1, H * (1.06 - 0.25 * d)), skia.Point(x1 - w1, H * (1.06 - 0.25 * d))], True)
        sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, H * (1.0 - 0.25 * d))], [C((190, 246, 255), int(a)), C((120, 220, 255), 0)])
        c.drawPath(pth, skia.Paint(Shader=sh, AntiAlias=True, BlendMode=SCREEN, MaskFilter=blur(16)))


def snow(c, t, scroll=0.0, a=1.0, drift=0.0, zmin=0.0, zmax=9.0):
    """marine snow: specks at several distances; near ones are larger, softer and slide faster as the camera moves"""
    for (x, y, z, ph, al) in SNOW:
        if not (zmin <= z < zmax): continue
        yy = (y - scroll * z + 12 * z * t) % 2200 - 140
        xx = (x + drift * z + 14 * z * math.sin(t * 0.5 + ph)) % 1080
        r = 1.6 + 2.6 * z
        pa = P((190, 232, 250), 150 * al * a * min(1.0, 0.35 + 0.5 * z))
        if z > 1.2: pa.setMaskFilter(blur(2.5 * z))
        c.drawCircle(xx, yy, r, pa)


def surface(c, t, y, a=1.0):
    """the underside of the surface seen from below: a bright rippling skin"""
    pth = skia.Path(); pth.moveTo(-20, -40)
    for x in range(-20, 1101, 20):
        pth.lineTo(x, y + 16 * math.sin(x * 0.012 + t * 1.7) + 9 * math.sin(x * 0.031 - t * 2.3) + 5 * math.sin(x * 0.07 + t * 3.1))
    pth.lineTo(1100, -40); pth.close()
    c.drawPath(pth, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, y - 260), skia.Point(0, y + 20)], [C((26, 104, 160), int(255 * a)), C((120, 214, 238), int(245 * a))])))
    c.drawPath(pth, SP((255, 255, 255), 7, 230 * a))
    c.drawPath(pth, SP((200, 250, 255), 30, 120 * a, MaskFilter=blur(14)))
    for i in range(14):                                   # light netting on the underside
        xx = (i * 97 + 40 * math.sin(t * 0.8 + i)) % 1080; ww = 60 + 30 * math.sin(t * 1.3 + i * 2)
        c.drawOval(skia.Rect(xx - ww, y - 150 + 40 * math.sin(i * 1.7), xx + ww, y - 120 + 40 * math.sin(i * 1.7)), P((255, 255, 255), 90 * a, MaskFilter=blur(8)))


def bubble(c, x, y, r, a=1.0):
    c.drawCircle(x, y, r, P((190, 240, 255), 46 * a))
    c.drawCircle(x, y, r, SP((226, 250, 255), max(1.2, r * 0.16), 210 * a))
    c.drawCircle(x - r * 0.34, y - r * 0.36, r * 0.26, P((255, 255, 255), 230 * a))


def bubbles(c, t, src, t0, n=40, dur=3.0, spread=120, rise=520, seed=1, size=1.0):
    """a burst of bubbles born at src around time t0, rising and wobbling, thinning out"""
    r = np.random.default_rng(seed)
    for i in range(n):
        b = t0 + r.uniform(0, 0.5); life = r.uniform(0.6, 1.0) * dur; ox = r.uniform(-1, 1) * spread; oy = r.uniform(-0.6, 0.6) * spread; rad = r.uniform(4, 20) * size; ph = r.uniform(0, 6.28)
        u = (t - b) / life
        if not 0 < u < 1: continue
        x = src[0] + ox * (0.4 + 0.6 * u) + 14 * math.sin(t * 5 + ph); y = src[1] + oy - rise * (u ** 0.85) * (0.6 + 12 / (rad + 12))
        bubble(c, x, y, rad * (0.7 + 0.5 * u), min(1.0, 4 * u) * (1 - u ** 3))


def rope(c, t, x, scroll=0.0, y0=-60, y1=2000, a=1.0, plate_y=None, s=1.0):
    """the dive line: a white rope hanging straight under its float, taped every few metres; a bottom plate and weight when plate_y is given"""
    end = plate_y if plate_y is not None else y1
    pth = skia.Path(); pth.moveTo(x + 5 * math.sin(t * 0.7), y0)
    for yy in range(int(y0), int(end) + 1, 60):
        pth.lineTo(x + (5 * math.sin(t * 0.7 + yy * 0.004) + 3 * math.sin(t * 1.1 + yy * 0.011)) * min(1.0, (end - yy) / 500 + 0.2), yy)
    pth.lineTo(x, end)
    c.drawPath(pth, SP((16, 40, 84), 13 * s, 90 * a)); c.drawPath(pth, SP((226, 238, 236), 8 * s, 255 * a)); c.drawPath(pth, SP((150, 190, 214), 3 * s, 170 * a))
    for k in range(-2, 12):                               # tape marks
        yy = (k * 420 - scroll) % 4200 - 400
        if y0 < yy < end - 40:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 8 * s, yy - 16, x + 8 * s, yy + 16), 4, 4), P((255, 118, 92), 255 * a))
    if plate_y is not None:
        c.drawCircle(x, plate_y - 150, 20 * s, P((214, 240, 90), 255 * a)); c.drawCircle(x - 5, plate_y - 156, 7 * s, P((246, 255, 170), 255 * a))      # the stop ball
        pl = skia.RRect.MakeRectXY(skia.Rect(x - 120 * s, plate_y - 14, x + 120 * s, plate_y + 14), 14, 14)
        c.drawRRect(pl, P((236, 240, 244), 255 * a)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 120 * s, plate_y + 2, x + 120 * s, plate_y + 14), 8, 8), P((150, 176, 200), 255 * a))
        for kx in (-70, 0, 70):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + kx * s - 16, plate_y + 20, x + kx * s + 16, plate_y + 62), 6, 6), P((255, 214, 64), 255 * a))                 # depth tags to bring back
            c.drawLine(x + kx * s, plate_y + 10, x + kx * s, plate_y + 24, SP((226, 238, 236), 3, 255 * a))
        c.drawLine(x, plate_y + 14, x, plate_y + 190, SP((226, 238, 236), 7 * s, 255 * a))
        wgt = smooth_closed([(x - 44 * s, plate_y + 190), (x + 44 * s, plate_y + 190), (x + 56 * s, plate_y + 300), (x, plate_y + 322), (x - 56 * s, plate_y + 300)])
        shade(c, wgt, (60, 76, 110), (30, 40, 72), (150, 200, 230), k=1.2)


def fish(c, t, cx, cy, s=1.0, a=1.0, col=(24, 80, 140), n=34, dirx=1):
    """a distant school: small bodies with a flick of the tail, moving together"""
    for (ux, uy, k, ph) in FISH[:n]:
        x = cx + ux * 300 * s + 20 * math.sin(t * 0.7 + ph) + dirx * t * 22; y = cy + uy * 130 * s + 10 * math.sin(t * 0.9 + ph * 2)
        L = 30 * s * k; wag = math.sin(t * 7 + ph) * 5 * s
        p = smooth_closed([(x + dirx * L, y), (x + dirx * L * 0.3, y - L * 0.26), (x - dirx * L * 0.5, y - L * 0.08 + wag * 0.3), (x - dirx * L * 0.95, y - L * 0.3 + wag), (x - dirx * L * 0.8, y + wag),
                           (x - dirx * L * 0.95, y + L * 0.3 + wag), (x - dirx * L * 0.5, y + L * 0.08 + wag * 0.3), (x + dirx * L * 0.3, y + L * 0.26)])
        c.drawPath(p, P(col, 220 * a))


# ------------------------------------------------------------------ animals
def seal(c, t, x, y, s=1.0, ang=0.0, face=1, tint=None, tk=0.0):
    """a harbour seal gliding: a spindle body that bends as it swims, fore flipper, hind flippers, whiskers, a spotted coat"""
    body_c, body_s, belly, rim = (120, 132, 156), (76, 86, 116), (196, 204, 214), (190, 236, 250)
    if tint is not None:
        body_c, body_s, belly, rim = [mix(q, tint, tk) for q in (body_c, body_s, belly, rim)]
    cr, sr = math.cos(ang), math.sin(ang)
    T = lambda px, py: (x + s * (px * face * cr - py * sr), y + s * (px * face * sr + py * cr))
    n = 9; cen = []
    for i in range(n):
        u = i / (n - 1); px = 300 - u * 640; py = math.sin(t * 3.0 - u * 3.4) * 16 * (0.25 + u * 1.1) - 12 * math.sin(u * 3.14)
        cen.append(T(px, py))
    us = [0, 0.06, 0.16, 0.36, 0.6, 0.82, 0.94, 1.0]
    up = [26, 46, 56, 78, 70, 40, 22, 16]; dn = [24, 44, 62, 92, 80, 44, 22, 16]
    if face < 0: up, dn = dn, up
    bp, cl = skin(cen, us, [w * s for w in up], [w * s for w in dn], n=34, cap0=0.55, cap1=0.3)
    # hind flippers behind the body
    tail = cl[-1]; prev = cl[-3]; dx, dy = tail[0] - prev[0], tail[1] - prev[1]; dl = math.hypot(dx, dy) or 1; dx /= dl; dy /= dl
    for sg in (-1, 1):
        fa = math.sin(t * 3.0 - 3.6) * 0.5 + sg * 0.42
        ex = tail[0] + (dx * math.cos(fa) - dy * math.sin(fa)) * 150 * s; ey = tail[1] + (dx * math.sin(fa) + dy * math.cos(fa)) * 150 * s
        mx = (tail[0] + ex) / 2 - dy * sg * 20 * s; my = (tail[1] + ey) / 2 + dx * sg * 20 * s
        fp, _ = skin([tail, (mx, my), (ex, ey)], [0, 0.5, 1.0], [15 * s, 30 * s, 24 * s], [15 * s, 30 * s, 24 * s], n=14, cap0=0.3, cap1=0.5)
        shade(c, fp, body_s, mix(body_s, (20, 26, 56), 0.4), None, k=s)
    shade(c, bp, body_c, body_s, rim, k=s * 1.4)
    c.save(); c.clipPath(bp, skia.ClipOp.kIntersect, True)
    bl = skia.Path(); pts = [tuple(p) for p in cl]
    low = [(p[0] + sr * 60 * s * -1 + 0, p[1] + 70 * s * cr) for p in pts]
    bl.moveTo(*low[0])
    for q in low[1:]: bl.lineTo(*q)
    c.drawPath(bl, SP(belly, 80 * s, 235, MaskFilter=blur(10 * s)))
    rs = np.random.default_rng(5)
    for k in range(46):
        i = rs.integers(4, 30); off = rs.uniform(-60, 30) * s; r_ = rs.uniform(4, 11) * s
        c.drawOval(skia.Rect(pts[i][0] - r_ * 1.3, pts[i][1] + off - r_, pts[i][0] + r_ * 1.3, pts[i][1] + off + r_), P(body_s, 130))
    c.restore()
    # fore flipper
    sh_ = cl[9]; fa = 0.9 + 0.25 * math.sin(t * 3.0 - 1.0)
    ex = sh_[0] - face * math.cos(fa) * 150 * s * cr; ey = sh_[1] + math.sin(fa) * 150 * s + 40 * s
    fp, _ = skin([(sh_[0], sh_[1] + 46 * s), ((sh_[0] + ex) / 2 - 10 * s, (sh_[1] + 46 * s + ey) / 2), (ex, ey)], [0, 0.5, 1.0], [26 * s, 30 * s, 14 * s], [26 * s, 30 * s, 14 * s], n=14, cap0=0.4, cap1=0.6)
    shade(c, fp, mix(body_c, body_s, 0.5), body_s, None, k=s)
    # face
    hd = cl[1]; e = T(250, -14)
    c.drawCircle(e[0], e[1], 13 * s, P((16, 18, 34))); c.drawCircle(e[0] - 3 * s, e[1] - 4 * s, 4 * s, P((255, 255, 255), 230))
    nz = T(318, 4); c.drawOval(skia.Rect(nz[0] - 12 * s, nz[1] - 9 * s, nz[0] + 12 * s, nz[1] + 9 * s), P((30, 30, 50)))
    for k in range(4):
        w0 = T(300, 14 + k * 5); w1 = T(352 + k * 4, 34 + k * 16 + 3 * math.sin(t * 2 + k))
        c.drawLine(*w0, *w1, SP((230, 240, 250), max(1, 2 * s), 190))


def whale(c, t, x, y, s=1.0, col=(12, 58, 116), a=255, face=1):
    """a humpback far off in the haze: only its shape, with the long flipper and the slow tail"""
    T = lambda px, py: (x + s * px * face, y + s * py)
    n = 9; cen = []
    for i in range(n):
        u = i / (n - 1); px = 520 - u * 1100; py = math.sin(t * 0.9 - u * 2.6) * 34 * (0.1 + u ** 1.6) - 30 * math.sin(u * 3.14)
        cen.append(T(px, py))
    us = [0, 0.08, 0.3, 0.55, 0.8, 0.93, 1.0]; up = [30, 86, 120, 104, 54, 22, 14]; dn = [40, 110, 150, 112, 50, 22, 14]
    bp, cl = skin(cen, us, [w * s for w in up], [w * s for w in dn], n=34, cap0=0.5, cap1=0.2)
    lay = skia.Paint(MaskFilter=None); c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(5, 5), Alphaf=a / 255))
    c.drawPath(bp, P(col))
    tail = cl[-1]; prev = cl[-3]; dx, dy = tail[0] - prev[0], tail[1] - prev[1]; dl = math.hypot(dx, dy) or 1; dx /= dl; dy /= dl
    fl = smooth_closed([tail, (tail[0] + dx * 60 * s - dy * 190 * s, tail[1] + dy * 60 * s + dx * 190 * s), (tail[0] + dx * 150 * s - dy * 210 * s, tail[1] + dy * 150 * s + dx * 210 * s), (tail[0] + dx * 80 * s, tail[1] + dy * 80 * s),
                        (tail[0] + dx * 150 * s + dy * 210 * s, tail[1] + dy * 150 * s - dx * 210 * s), (tail[0] + dx * 60 * s + dy * 190 * s, tail[1] + dy * 60 * s - dx * 190 * s)])
    c.drawPath(fl, P(col))
    sh_ = cl[10]; fa = 0.2 * math.sin(t * 0.8)
    pf, _ = skin([(sh_[0], sh_[1] + 90 * s), (sh_[0] - face * 120 * s, sh_[1] + (250 + 60 * fa) * s), (sh_[0] - face * 300 * s, sh_[1] + (360 + 120 * fa) * s)], [0, 0.5, 1.0], [40 * s, 36 * s, 14 * s], [40 * s, 36 * s, 14 * s], n=14, cap0=0.3, cap1=0.6)
    c.drawPath(pf, P(col))
    c.drawPath(diffp(bp, (0, 16 * s)), P(mix(col, (120, 200, 240), 0.35)))                           # a little surface light along its back
    c.drawPath(diffp(bp, (0, -60 * s)), P(mix(col, (150, 200, 230), 0.22)))                          # the pale belly
    c.save(); c.clipPath(bp, skia.ClipOp.kIntersect, True)
    for k_ in range(5): c.drawPath(line_of([(p[0], p[1] + (70 + k_ * 16) * s) for p in cl[1:14]]), SP(mix(col, (6, 30, 80), 0.5), 3 * s, 150))    # throat pleats
    c.restore()
    e_ = cl[3]; c.drawCircle(e_[0], e_[1] + 30 * s, 7 * s, P((6, 24, 60)))
    c.restore()


# ------------------------------------------------------------------ inside her body
NERVE, NERVE_HI = (255, 226, 110), (255, 250, 214)
BLOOD, BLOOD_HI, BLOOD_DIM = (255, 80, 96), (255, 200, 196), (120, 60, 110)


def part(path, u0, u1):
    """the stretch of a path between fractions u0 and u1 of its length"""
    pm = skia.PathMeasure(path, False); L = pm.getLength(); d = skia.Path()
    pm.getSegment(max(0.0, u0) * L, min(1.0, u1) * L, d, True); return d


def curve(pts, n=40):
    p = skia.Path(); r = _resample(pts, n); p.moveTo(*r[0])
    for q in r[1:]: p.lineTo(*q)
    return p


def glowline(c, path, col, w, a=255, glow=True):
    if glow: c.drawPath(path, SP(col, w * 3.2, a * 0.35, MaskFilter=blur(w * 1.2)))
    c.drawPath(path, SP(col, w, a))


def pulse_dot(c, path, u, col, r, a=255):
    pm = skia.PathMeasure(path, False); L = pm.getLength()
    if not 0 <= u <= 1: return
    pos = pm.getPosTan(u * L)[0] if isinstance(pm.getPosTan(u * L), tuple) else pm.getPosTan(u * L)
    try: x, y = pos.x(), pos.y()
    except AttributeError: x, y = pos[0], pos[1]
    c.drawCircle(x, y, r * 2.6, P(col, a * 0.5, MaskFilter=blur(r * 1.4))); c.drawCircle(x, y, r, P((255, 255, 255), a))


def brain_paths(D):
    H0 = D.Hh; Hh = lambda x, y: H0(-12 + (x + 12) * 0.8, -30 + (y + 30) * 0.8)       # sized to sit inside her skull, behind the forehead and above the ear
    cer = smooth_closed([Hh(-60, -22), Hh(-52, -52), Hh(-28, -70), Hh(4, -72), Hh(32, -60), Hh(44, -40), Hh(38, -22), Hh(18, -14), Hh(-4, -10), Hh(-26, -6), Hh(-48, -6)])
    cbl = smooth_closed([Hh(-56, -4), Hh(-34, -6), Hh(-22, 6), Hh(-30, 20), Hh(-50, 20), Hh(-60, 8)])
    stem, scl = skin([Hh(-12, -12), Hh(-14, 8), H0(-20, 28), H0(-24, 50)], [0, 0.4, 1.0], [9 * D.s, 10 * D.s, 7 * D.s], [9 * D.s, 10 * D.s, 7 * D.s], n=14, cap0=0.4, cap1=0.3)
    return cer, cbl, stem, Hh


def brain(c, D, a=1.0, stem_hot=0.0, warm=0.0):
    cer, cbl, stem, Hh = brain_paths(D); s = D.s * 0.8
    sk = smooth_closed([D.Hh(-66, -24), D.Hh(-54, -62), D.Hh(-20, -80), D.Hh(26, -72), D.Hh(50, -46), D.Hh(46, -14), D.Hh(10, 2), D.Hh(-30, 26), D.Hh(-62, 14)])
    c.drawPath(sk, P((14, 12, 40), 150 * a, MaskFilter=blur(4 * D.s)))
    base = mix((236, 150, 176), (255, 190, 170), warm)
    c.drawPath(op(op(cer, cbl), stem), P((20, 16, 50), 150 * a, MaskFilter=blur(5 * s)))
    c.drawPath(stem, P(mix((214, 132, 168), (255, 236, 150), stem_hot), 255 * a))
    if stem_hot > 0: c.drawPath(stem, P((255, 240, 160), 200 * a * stem_hot, MaskFilter=blur(9 * s)))
    c.drawPath(cbl, P(mix(base, (200, 110, 150), 0.35), 255 * a))
    for k in range(3): c.drawLine(*Hh(-54 + k * 2, 2 + k * 6), *Hh(-28 - k * 2, 2 + k * 6), SP((170, 90, 136), max(1, 1.6 * s), 200 * a))
    c.drawPath(cer, P(base, 255 * a)); c.drawPath(diffp(cer, (3 * s, -6 * s)), P(mix(base, (190, 100, 150), 0.5), 255 * a))
    for pts in ([(-46, -44), (-30, -58), (-12, -50), (-4, -62)], [(-50, -26), (-32, -36), (-14, -30), (4, -44), (22, -48)], [(-34, -14), (-16, -18), (2, -22), (20, -30), (36, -34)], [(8, -62), (18, -54), (30, -52)]):
        c.drawPath(curve([Hh(*p) for p in pts], 16), SP((196, 104, 150), max(1.2, 2.2 * s), 230 * a))
    c.drawPath(diffp(cer, (-2 * s, 5 * s)), P((255, 220, 226), 150 * a))
    if warm > 0: c.drawPath(cer, P((255, 150, 120), 150 * a * warm, MaskFilter=blur(14 * s)))


def face_nerves(D):
    """the trigeminal nerve: three branches from the skin of the forehead, the cheek and the jaw, meeting in front of the ear and entering the brainstem"""
    Hh = D.Hh; G = (6, 4)
    v1 = curve([Hh(50, -56), Hh(34, -50), Hh(18, -30), Hh(*G)], 24)
    v2 = curve([Hh(58, 20), Hh(40, 14), Hh(22, 8), Hh(*G)], 24)
    v3 = curve([Hh(52, 60), Hh(36, 46), Hh(18, 24), Hh(*G)], 24)
    root = curve([Hh(*G), Hh(-4, 6), Hh(-13, 4)], 10)
    twigs = [curve([Hh(*a_), Hh(*b_)], 6) for a_, b_ in (((34, -50), (46, -68)), ((34, -50), (54, -44)), ((40, 14), (54, 6)), ((40, 14), (60, 30)), ((36, 46), (56, 48)), ((36, 46), (44, 66)))]
    return [v1, v2, v3], root, twigs


def heart_at(D):
    J = D.J; ch = J['chest']; td = J['tors_dir']
    return _add(_add(ch, td, -6), _rot(td, 90), 30)


def heart(c, D, beat=0.0, a=1.0, glow=0.0, k=1.0):
    """her heart: a tilted muscular cone with the great vessels on top; it swells a little on each beat"""
    hc = heart_at(D); s = D.s * k * (1 + 0.13 * beat)
    td = D.J['tors_dir']; ax = _rot(td, 90); dn = (-td[0], -td[1])
    Q = lambda x, y: D.T((hc[0] + (ax[0] * x + dn[0] * y) * k * (1 + 0.13 * beat), hc[1] + (ax[1] * x + dn[1] * y) * k * (1 + 0.13 * beat)))
    body = smooth_closed([Q(-6, -40), Q(22, -42), Q(44, -22), Q(46, 8), Q(30, 40), Q(8, 62), Q(-16, 44), Q(-36, 16), Q(-38, -14), Q(-26, -34)])
    aorta, _ = skin([Q(4, -34), Q(6, -62), Q(-10, -78), Q(-30, -70), Q(-36, -48)], [0, 1], [12 * D.s * k, 10 * D.s * k], [12 * D.s * k, 10 * D.s * k], n=14, cap0=0.2, cap1=0.3)
    pul, _ = skin([Q(-14, -30), Q(-10, -52), Q(14, -66), Q(34, -62)], [0, 1], [10 * D.s * k, 8 * D.s * k], [10 * D.s * k, 8 * D.s * k], n=12, cap0=0.2, cap1=0.3)
    c.drawPath(op(op(body, aorta), pul), P((30, 10, 40), 150 * a, MaskFilter=blur(6 * D.s)))
    if glow > 0: c.drawPath(body, P((255, 110, 110), 230 * a * glow, MaskFilter=blur(26 * D.s * k)))
    c.drawPath(pul, P((120, 130, 220), 255 * a)); c.drawPath(aorta, P((236, 70, 84), 255 * a)); c.drawPath(diffp(aorta, (3 * D.s, -4 * D.s)), P((170, 40, 76), 255 * a))
    c.drawPath(body, P((232, 64, 82), 255 * a)); c.drawPath(diffp(body, (5 * D.s * k, -9 * D.s * k)), P((168, 36, 74), 255 * a)); c.drawPath(diffp(body, (-3 * D.s * k, 5 * D.s * k)), P((255, 150, 150), 220 * a))
    c.drawPath(curve([Q(4, -30), Q(12, 0), Q(6, 36)], 12), SP((150, 30, 66), max(1.4, 3 * D.s * k), 210 * a))
    c.drawPath(curve([Q(-28, -20), Q(-8, -24), Q(20, -32)], 10), SP((255, 190, 150), max(1.2, 2.4 * D.s * k), 180 * a))
    return Q


def vagus(D):
    J = D.J; hc = heart_at(D); td = J['tors_dir']
    return curve([D.Hh(-22, 44), D.T(_add(J['neck'], td, -6)), D.T(_add(_add(J['chest'], td, 78), _rot(td, 90), 6)), D.T(_add(_add(hc, td, 62), _rot(td, 90), -8))], 30)


def vessels(D):
    """the main arteries she can spare and the ones she cannot: to the brain (kept open), and down the near arm and the near leg (tightened)"""
    J = D.J; hc = heart_at(D); td = J['tors_dir']
    top = _add(_add(hc, td, 64), _rot(td, 90), -8)
    car = curve([D.T(top), D.T(_add(J['neck'], td, -10)), D.Hh(-8, 40), D.Hh(-2, 6), D.Hh(-6, -28)], 30)
    arm = curve([D.T(top), D.T(_add(J['sho'], td, 4)), D.T(J['elb_n']), D.T(J['wri_n'])], 34)
    trunk = curve([D.T(top), D.T(_add(hc, _rot(td, 90), -40)), D.T(_add(J['waist'], (-6, 0))), D.T(_add(J['hip'], (0, -20)))], 30)
    leg = curve([D.T(_add(J['hip'], (0, -20))), D.T(_add(J['hip'], (4, 60))), D.T(_add(J['knee_n'], (-4, 0))), D.T(_add(J['ank_n'], (0, -10)))], 34)
    return car, arm, trunk, leg


def flow(c, path, t, w, col, a=255, speed=120, dash=(26, 44), bright=1.0):
    """blood as one continuous stream with light running along it (never drops)"""
    glowline(c, path, col, w, a)
    if bright > 0.02:
        pe = skia.DashPathEffect.Make([dash[0], dash[1]], -(t * speed) % (dash[0] + dash[1]))
        c.drawPath(path, SP(BLOOD_HI, max(1.2, w * 0.42), a * bright * 0.9, PathEffect=pe))
