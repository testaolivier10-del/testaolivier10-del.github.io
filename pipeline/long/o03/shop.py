"""Places and props for the story of yt-orgo-03 (Ines the sculptor): her workshop at night, the steel plate, the oxyacetylene
cart, the flame, three macro insert shots (pencil on paper, diamond scribe on steel, the cutting flame) and the town square at
sunrise with the plinth, the steel heron and its cloth cover. Everything is drawn in code at 1920x1080 in the house flat style
(layout, palette and the heron's outline from ref/workshop.png, ref/square.png and ref/heron.png, Figma AI gemini-3.1-flash-image).

LIGHT. Night: one hanging lamp at the upper LEFT (x 560), so people shaded from the upper left (lperson.LIGHT) match. Morning:
the sun is low at screen RIGHT (x 1640, y 405), rims are on right edges and shadows fall to the left and toward the camera.

WORKSHOP, medium shot staging (all in scene coordinates, before any camera):
  STAND   = x 820, ground 1180, s 0.9   the person behind the bench (hips at y 644, head top about y 235; the feet are hidden)
  BENCH_Y = 660                          the back edge of the bench top (the person is cut off here); the front edge is y 870
  PAPER   = quad (694,690) (946,690) (972,850) (668,850)   the sheet on the bench (PAPER_MID is its centre)
  PLATE   = x 1410, y 1010, s 0.9       plate() default: the easel's floor point; the plate face spans about x 1268..1541, y 402..778
  CART    = x 1740, ground 1020, s 0.7  cart() default (spans x 1560..1905, handle near (1830, 510))
  Draw order: workshop_back, [person], workshop_front, plate, cart (plate and cart stand to screen right of the bench, on the floor).
  Camera: cam = (pan x, pan y, zoom). workshop_back and workshop_front apply it themselves with parallax; wrap the person, the
  plate and the cart with  c.save(); cam_apply(c, cam, 0.9); ...; c.restore()  and map returned points with cam_point(p, cam, 0.9).

SQUARE, wide shot staging:
  STATUE  = x 1100, ground 900, s 0.8    plinth(), heron_statue() and cover() share these (plinth top y = ground - 176 s)
  INES    = x 724, ground 930, s 0.5     screen left of the statue, facing the camera; her screen right hand holds cover()'s
                                         returned point: (890, 660) at pull 0 (arm reaching out and down), (800, 700) from pull 0.6 (hand by her hip)
  TOWN    = (250, 800, 0.3), (392, 806, 0.3), (1590, 800, 0.3)   three small background people (x, ground, s)
  The sky above y 300 between x 120 and 1150 stays calm (no tower, bunting or birds) for a handwritten line (give it a pill).
"""
import math
import numpy as np
import skia
import kit as K
from kit import P, SP, C, W, H, sm, blur

STAND = dict(x=820, ground=1180, s=0.9)
BENCH_Y = 660
PAPER = [(694, 690), (946, 690), (972, 850), (668, 850)]
PAPER_MID = (820, 770)
PLATE = dict(x=1410, y=1010, s=0.9)
CART = dict(x=1740, ground=1020, s=0.7)
STATUE = dict(x=1100, ground=900, s=0.8)
INES_SQ = dict(x=724, ground=930, s=0.5)
TOWN = [(250, 800, 0.3), (392, 806, 0.3), (1590, 800, 0.3)]
PLINTH_H = 176
LIN = skia.SamplingOptions(skia.FilterMode.kLinear)

# the outline traced from ref/heron.png (x from the base centre, y up negative, height 1), starting at the bill tip
HERON = [(-0.2945, -0.9312), (-0.2625, -0.9265), (-0.1739, -0.9274), (-0.1287, -0.9189), (-0.0664, -0.9171), (-0.0533, -0.9123), (-0.041, -0.8935), (-0.0476, -0.8624), (-0.0975, -0.8266), (-0.1202, -0.7879), (-0.1362, -0.7229), (-0.1371, -0.6607), (-0.1296, -0.623), (-0.106, -0.558), (-0.1013, -0.5137), (-0.0947, -0.524), (-0.0862, -0.5231), (-0.0834, -0.4779), (-0.0749, -0.4995), (-0.0655, -0.4995), (-0.0391, -0.4496), (-0.008, -0.4147), (0.0221, -0.3402), (0.0297, -0.279), (0.0297, -0.2139), (0.008, -0.0641), (0.0014, -0.0462), (-0.0099, -0.0396), (-0.0193, -0.0405), (-0.024, -0.0707), (-0.025, -0.1659), (-0.0353, -0.1357), (-0.0391, -0.0961), (-0.0476, -0.0952), (-0.0693, -0.1602), (-0.0872, -0.1932), (-0.1032, -0.2092), (-0.0759, -0.1348), (-0.0636, -0.082), (-0.0721, -0.0811), (-0.0872, -0.1037), (-0.1164, -0.1282), (-0.0844, -0.0735), (-0.074, -0.0339), (-0.1145, -0.0302), (-0.1268, -0.0189), (-0.1315, -0.0019), (0.2078, -0.0009), (0.2041, -0.0179), (0.1871, -0.032), (0.1305, -0.033), (0.106, -0.0452), (0.106, -0.1414), (0.1145, -0.246), (0.0975, -0.3167), (0.1004, -0.3497), (0.1107, -0.3506), (0.1569, -0.3355), (0.2182, -0.2592), (0.254, -0.2413), (0.2587, -0.246), (0.2531, -0.2714), (0.2747, -0.2658), (0.2766, -0.2752), (0.2945, -0.2752), (0.2917, -0.3054), (0.2795, -0.345), (0.2399, -0.4241), (0.2267, -0.4703), (0.2003, -0.5278), (0.1711, -0.574), (0.1315, -0.6221), (0.0853, -0.6645), (0.0457, -0.689), (0.0071, -0.6965), (-0.041, -0.6805), (-0.0561, -0.6918), (-0.0646, -0.7144), (-0.0646, -0.7502), (-0.0551, -0.7776), (-0.0382, -0.7974), (-0.0052, -0.8219), (0.0127, -0.8501), (0.0193, -0.8765), (0.0203, -0.9171), (0.0287, -0.9161), (0.0372, -0.8926), (0.0372, -0.9076), (0.0467, -0.9076), (0.0655, -0.8539), (0.0636, -0.8775), (0.0504, -0.9152), (0.0108, -0.9642), (-0.025, -0.9915), (-0.0533, -1.0), (-0.0928, -0.9972), (-0.1192, -0.9849), (-0.139, -0.968)]


# ------------------------------------------------------------------ helpers
def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def poly(pts, close=True):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    if close: p.close()
    return p


def rr(x0, y0, x1, y1, r=8):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def lin(p0, p1, cols, pos=None):
    cs = [C(c_[:3], c_[3] if len(c_) > 3 else 255) for c_ in cols]
    return skia.GradientShader.MakeLinear([skia.Point(*p0), skia.Point(*p1)], cs, pos) if pos else skia.GradientShader.MakeLinear([skia.Point(*p0), skia.Point(*p1)], cs)


def rad(p, r, cols, pos=None):
    cs = [C(c_[:3], c_[3] if len(c_) > 3 else 255) for c_ in cols]
    return skia.GradientShader.MakeRadial(skia.Point(*p), r, cs, pos) if pos else skia.GradientShader.MakeRadial(skia.Point(*p), r, cs)


def SH(shader, **k):
    return skia.Paint(AntiAlias=True, Shader=shader, **k)


def crom(pts, closed=True, k=0.32):
    """a smooth path through pts (Catmull Rom as cubics; a low k keeps sharp tips sharp)"""
    n = len(pts); p = skia.Path(); p.moveTo(*pts[0])
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if (closed or i > 0) else pts[i]; p1 = pts[i]; p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else p2
        p.cubicTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1])
    if closed: p.close()
    return p


def seg(path, u0, u1):
    """the part of a path between fractions u0 and u1 of its length"""
    pm = skia.PathMeasure(path, False); L = pm.getLength(); dst = skia.Path()
    if u1 > u0: pm.getSegment(max(0.0, u0) * L, min(1.0, u1) * L, dst, True)
    return dst


def at(path, u):
    """(point, unit tangent) at fraction u of a path's length"""
    pm = skia.PathMeasure(path, False); L = pm.getLength()
    pos, tan = pm.getPosTan(min(1.0, max(0.0, u)) * L)
    return (pos.x(), pos.y()), (tan.x(), tan.y())


_IMG = {}
_SAMP = {}


def samp(key, pts, n=300):
    """a cached sampler for an open curve through pts: returns f(u) -> (x, y, tx, ty)"""
    if key not in _SAMP:
        path = crom(pts, False, 0.3); pm = skia.PathMeasure(path, False); L = pm.getLength(); rows = []
        for i in range(n + 1):
            pos, tan = pm.getPosTan(L * i / n); rows.append((pos.x(), pos.y(), tan.x(), tan.y()))
        _SAMP[key] = rows
    rows = _SAMP[key]
    return lambda u: rows[int(round(min(1.0, max(0.0, u)) * (len(rows) - 1)))]


def _layer(key, fn, m=120, w=W, h=H):
    if key not in _IMG:
        s = skia.Surface(w + 2 * m, h + 2 * m); cc = s.getCanvas(); cc.translate(m, m); fn(cc); _IMG[key] = s.makeImageSnapshot()
    return _IMG[key]


def _blit(c, key, fn, m=120):
    c.drawImage(_layer(key, fn, m), -m, -m, LIN)


def _noise(key, kind, seed=3):
    """cached texture images at half size: 'tooth' (paper grain) or 'brush' (horizontal brushed steel streaks)"""
    k = (key, kind)
    if k not in _IMG:
        import cv2
        rs = np.random.default_rng(seed)
        if kind == 'tooth':
            a = rs.normal(128, 46, (H // 2, W // 2)); a = cv2.GaussianBlur(a, (0, 0), 0.7); al = 34
        else:
            a = rs.normal(128, 70, (H // 2, W // 2)); a = cv2.blur(a, (161, 1)); a = 128 + (a - 128) * 6.5; al = 60
        a = a.clip(0, 255).astype(np.uint8)
        _IMG[k] = skia.Image.fromarray(np.ascontiguousarray(np.dstack([a, a, a, np.full_like(a, al)])), colorType=skia.kRGBA_8888_ColorType)
    return _IMG[k]


def _texture(c, kind, rect=None, a=1.0, seed=3):
    r = rect or skia.Rect(0, 0, W, H)
    c.drawImageRect(_noise(seed, kind, seed), r, LIN, skia.Paint(BlendMode=skia.BlendMode.kOverlay, Alphaf=a))


def cam_apply(c, cam=(0, 0, 1.0), depth=1.0):
    """apply the camera to a layer: depth 0.5 far wall .. 1.0 the bench front (near layers slide and grow more)"""
    px, py, z = cam; zl = 1 + (z - 1) * (0.55 + 0.45 * depth)
    c.translate(W / 2, H / 2); c.scale(zl, zl); c.translate(-W / 2 - px * depth, -H / 2 - py * depth)


def cam_point(p, cam=(0, 0, 1.0), depth=1.0):
    px, py, z = cam; zl = 1 + (z - 1) * (0.55 + 0.45 * depth)
    return (W / 2 + (p[0] - W / 2 - px * depth) * zl, H / 2 + (p[1] - H / 2 - py * depth) * zl)


def _star(c, x, y, r, a, col=(255, 255, 255)):
    if a <= 0.01: return
    p = skia.Path()
    for i in range(8):
        ang = i * math.pi / 4; rr_ = r if i % 2 == 0 else r * 0.16
        q = (x + rr_ * math.cos(ang), y + rr_ * math.sin(ang))
        p.moveTo(*q) if i == 0 else p.lineTo(*q)
    p.close(); c.drawPath(p, P(col, 255 * a)); c.drawCircle(x, y, r * 0.9, P(col, 60 * a, MaskFilter=blur(r * 0.5)))


# ------------------------------------------------------------------ 1. the heron
def _heron_pts(x, y, h):
    return [(x + px * h, y + py * h) for px, py in HERON]


def heron_path(x, y, h):
    """the heron's outline as one closed path: height h, the centre of its base at (x, y); it faces screen left.
    About 0.59 h wide (from x - 0.295 h at the bill tip to x + 0.295 h at the tail). The path starts at the bill tip and runs
    along the underside of the bill first, so a stroke grows bill, throat, neck front, breast, reeds, base (about u 0.5), legs,
    tail, back, crown and returns to the bill."""
    return crom(_heron_pts(x, y, h), True, 0.2)


def heron_point(x, y, h, u):
    """(point, tangent) at fraction u along the outline (the place of the pencil, scribe or flame)"""
    return at(heron_path(x, y, h), u)


def heron_stroke(c, x, y, h, u, paint):
    """draw the first u (0..1) of the outline with `paint` (a stroke paint)"""
    if u <= 0.001: return
    c.drawPath(heron_path(x, y, h) if u >= 0.999 else seg(heron_path(x, y, h), 0.0, u), paint)


# ------------------------------------------------------------------ small props
def _tool(c, kind, x, y, s=1.0, ang=0.0, hc=(214, 118, 60)):
    """hand tools for the pegboard and the bench: hammer, wrench, file, pliers, clamp, driver, saw"""
    ST, ST_SH, ST_HI = (150, 160, 186), (92, 100, 134), (214, 222, 240); HC_SH = mix(hc, (40, 20, 60), 0.4)
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    sh = lambda path: c.drawPath(path, P((8, 10, 30), 90, MaskFilter=blur(4)))
    if kind == 'hammer':
        c.save(); c.translate(5, 6); sh(poly([(-7, 0), (7, 0), (8, 150), (-8, 150)])); c.restore()
        c.drawRRect(rr(-8, 10, 8, 150, 6), P(hc)); c.drawRect(skia.Rect(2, 10, 8, 150), P(HC_SH)); c.drawRRect(rr(-9, 96, 9, 150, 7), P(HC_SH)); c.drawRect(skia.Rect(-9, 100, -5, 146), P(mix(hc, (255, 255, 255), 0.3)))
        hd = poly([(-34, -12), (22, -12), (40, -4), (40, 10), (22, 14), (-22, 14), (-40, 22), (-44, 14), (-34, 2)]); c.drawPath(hd, P(ST)); c.drawRect(skia.Rect(-34, 4, 40, 14), P(ST_SH, 180)); c.drawLine(-32, -11, 22, -11, SP(ST_HI, 2.5))
    elif kind == 'wrench':
        c.save(); c.translate(4, 5); sh(poly([(-7, -50), (7, -50), (7, 60), (-7, 60)])); c.restore()
        c.drawRRect(rr(-7, -46, 7, 58, 5), P(ST)); c.drawRect(skia.Rect(2, -46, 7, 58), P(ST_SH))
        for yy, r_, op in ((-58, 20, True), (68, 15, False)):
            c.drawCircle(0, yy, r_, P(ST)); c.drawCircle(3, yy + 2, r_ - 3, P(ST_SH, 110))
            if op: c.drawPath(poly([(-8, yy - 26), (8, yy - 26), (7, yy - 6), (-7, yy - 6)]), P((44, 50, 96)))
            else: c.drawCircle(0, yy, 7, P((44, 50, 96)))
        c.drawLine(-5, -44, -5, 56, SP(ST_HI, 2))
    elif kind == 'file':
        c.save(); c.translate(4, 5); sh(poly([(-8, -90), (8, -90), (8, 80), (-8, 80)])); c.restore()
        c.drawPath(poly([(-7, -90), (7, -90), (9, 20), (-9, 20)]), P(ST)); c.drawPath(poly([(2, -90), (7, -90), (9, 20), (2, 20)]), P(ST_SH))
        for i in range(12): c.drawLine(-7, -84 + i * 8.5, 7, -80 + i * 8.5, SP(ST_SH, 1.2, 150))
        c.drawRRect(rr(-11, 20, 11, 84, 9), P(hc)); c.drawRRect(rr(3, 22, 11, 84, 6), P(HC_SH)); c.drawRect(skia.Rect(-11, 20, 11, 28), P(ST_HI))
    elif kind == 'driver':
        c.drawRect(skia.Rect(-3, -84, 3, 10), P(ST)); c.drawRect(skia.Rect(1, -84, 3, 10), P(ST_SH)); c.drawPath(poly([(-3, -84), (3, -84), (5, -96), (-5, -96)]), P(ST_SH))
        c.drawRRect(rr(-12, 8, 12, 80, 10), P(hc)); c.drawRRect(rr(3, 10, 12, 80, 7), P(HC_SH)); c.drawLine(-7, 16, -7, 72, SP(mix(hc, (255, 255, 255), 0.4), 3))
    elif kind == 'pliers':
        for sx in (-1, 1):
            c.drawPath(crom([(sx * 3, -64), (sx * 9, -30), (sx * 4, -2), (sx * -10, 30), (sx * -20, 82), (sx * -12, 84), (sx * -2, 34), (sx * 9, 4), (sx * 15, -30), (sx * 8, -64)], True, 0.25), P(ST if sx < 0 else ST_SH))
            c.drawPath(crom([(sx * -8, 26), (sx * -22, 84), (sx * -11, 88), (sx * 0, 34)], True, 0.3), P(hc if sx < 0 else HC_SH))
        c.drawCircle(0, 0, 6, P(ST_HI))
    elif kind == 'clamp':
        c.drawPath(poly([(-30, -60), (30, -60), (30, -42), (-12, -42), (-12, 42), (30, 42), (30, 60), (-30, 60)]), P(hc)); c.drawPath(poly([(-30, -60), (-22, -60), (-22, 60), (-30, 60)]), P(mix(hc, (255, 255, 255), 0.3)))
        c.drawPath(poly([(-12, 42), (30, 42), (30, 60), (-30, 60), (-30, 52), (-12, 52)]), P(HC_SH)); c.drawRect(skia.Rect(18, -4, 26, 46), P(ST)); c.drawRect(skia.Rect(10, 62, 34, 68), P(ST_SH)); c.drawCircle(22, -6, 8, P(ST_HI))
    elif kind == 'saw':
        c.drawPath(poly([(-14, -150), (26, -150), (26, 30), (-30, 30)]), P(ST)); c.drawPath(poly([(14, -150), (26, -150), (26, 30), (14, 30)]), P(ST_SH, 160))
        for i in range(15): c.drawPath(poly([(-14 - i * 1.07, -150 + i * 12), (-22 - i * 1.07, -144 + i * 12), (-15 - i * 1.07, -138 + i * 12)]), P(ST))
        c.drawRRect(rr(-34, 28, 30, 92, 16), P(hc)); c.drawRRect(rr(-18, 44, 14, 76, 10), P((44, 50, 96))); c.drawRRect(rr(8, 30, 30, 92, 12), P(HC_SH, 140))
    c.restore()


def _jar(c, x, y, w, h, fill, seed=1):
    """a glass jar standing on y with small parts inside"""
    c.drawRRect(rr(x - w / 2, y - h, x + w / 2, y, 10), P((120, 150, 200), 70)); rs = np.random.default_rng(seed)
    c.save(); c.clipRRect(rr(x - w / 2 + 4, y - h * 0.62, x + w / 2 - 4, y - 3, 6), True)
    c.drawRect(skia.Rect(x - w, y - h * 0.62, x + w, y), P(mix(fill, (20, 20, 60), 0.35)))
    for i in range(46): c.drawCircle(x + rs.uniform(-w / 2, w / 2), y - rs.uniform(0, h * 0.62), rs.uniform(2.5, 5), P(mix(fill, (255, 255, 255), rs.uniform(0, 0.4))))
    c.restore()
    c.drawRRect(rr(x - w / 2, y - h, x + w / 2, y, 10), SP((170, 196, 240), 2.5, 130)); c.drawLine(x - w / 2 + 8, y - h + 16, x - w / 2 + 8, y - 12, SP((230, 240, 255), 3.5, 120))
    c.drawRRect(rr(x - w / 2 + 3, y - h - 12, x + w / 2 - 3, y - h + 4, 4), P((96, 70, 66))); c.drawRect(skia.Rect(x - w / 2 + 3, y - h - 12, x + w / 2 - 3, y - h - 8), P((150, 112, 96)))


def _pencil(c, tip, ang, s=1.0, col=(238, 176, 64), length=1500, worn=True):
    """a hexagonal pencil whose graphite point touches `tip`; ang is the direction from the tip up along the body (radians).
    s = 1 is the macro size (body 150 px wide). Wood cone, scalloped paint edge, graphite point with a small worn facet."""
    c.save(); c.translate(*tip); c.rotate(math.degrees(ang) - 90); c.scale(s, s)          # local: the body runs along +y
    w = 75.0; cone = 250.0; lead = 62.0; SHc = mix(col, (90, 40, 60), 0.42); HIc = mix(col, (255, 255, 255), 0.45)
    WOOD, WOOD_SH, WOOD_HI = (226, 178, 128), (176, 124, 92), (248, 214, 170)
    c.drawPath(poly([(-w, cone), (-w / 3, cone - 12), (-w / 3, length), (-w, length)]), P(HIc))
    c.drawPath(poly([(-w / 3, cone - 12), (w / 3, cone - 12), (w / 3, length), (-w / 3, length)]), P(col))
    c.drawPath(poly([(w / 3, cone - 12), (w, cone), (w, length), (w / 3, length)]), P(SHc))
    c.drawLine(-w / 3, cone, -w / 3, length, SP(mix(col, HIc, 0.5), 3, 200)); c.drawLine(w / 3, cone, w / 3, length, SP(mix(SHc, (30, 10, 40), 0.3), 3, 170))
    wood = poly([(-w * lead / cone, lead), (w * lead / cone, lead), (w, cone), (w / 3, cone - 12), (0, cone + 16), (-w / 3, cone - 12), (-w, cone)])
    wood = skia.Path(); wood.moveTo(-w * lead / cone, lead); wood.lineTo(w * lead / cone, lead); wood.lineTo(w, cone)
    wood.quadTo(w * 0.66, cone - 40, w / 3, cone - 4); wood.quadTo(0, cone - 52, -w / 3, cone - 4); wood.quadTo(-w * 0.66, cone - 40, -w, cone); wood.close()
    c.drawPath(wood, P(WOOD)); c.save(); c.clipPath(wood, skia.ClipOp.kIntersect, True)
    c.drawPath(poly([(w * 0.12, 0), (w * 1.2, 0), (w * 1.2, cone + 20), (w * 0.38, cone + 20)]), P(WOOD_SH, 200))
    c.drawPath(poly([(-w * 1.2, 0), (-w * 0.16, 0), (-w * 0.5, cone + 20), (-w * 1.2, cone + 20)]), P(WOOD_HI, 170))
    for i in range(7): c.drawLine(-w + i * w * 0.31, cone, -w * 0.2 + i * w * 0.07, lead, SP(WOOD_SH, 1.5, 70))
    c.restore()
    G, G_SH, G_HI = (74, 76, 92), (40, 42, 58), (150, 154, 176)
    gr = poly([(-w * lead / cone, lead), (w * lead / cone, lead), (5 if worn else 0.5, 0), (-7 if worn else -0.5, 3 if worn else 0)]); c.drawPath(gr, P(G))
    c.drawPath(poly([(2, lead), (w * lead / cone, lead), (5 if worn else 0.5, 0), (1, 1)]), P(G_SH)); c.drawLine(-w * lead / cone + 4, lead - 3, -6, 6, SP(G_HI, 3, 200))
    if worn: c.drawPath(poly([(-7, 3), (5, 0), (7, 5), (-5, 9)]), P(G_HI, 200))
    c.restore()


def _scribe(c, tip, ang, s=1.0, length=1500):
    """a steel scribe whose diamond point touches `tip`; ang is the direction from the tip up along the tool (radians).
    s = 1 is the macro size: a small faceted diamond set in a tapered steel shank, a knurled grip above it."""
    c.save(); c.translate(*tip); c.rotate(math.degrees(ang) - 90); c.scale(s, s)
    ST, ST_SH, ST_HI = (156, 166, 194), (84, 92, 130), (232, 238, 250)
    w = 46.0; tp = 300.0
    shank = poly([(-11, 34), (11, 34), (w, tp), (-w, tp)]); c.drawPath(shank, P(ST)); c.drawPath(poly([(3, 34), (11, 34), (w, tp), (w * 0.3, tp)]), P(ST_SH)); c.drawLine(-9, 40, -w + 8, tp, SP(ST_HI, 4, 210))
    c.drawRect(skia.Rect(-w, tp, w, length), P(ST)); c.drawRect(skia.Rect(w * 0.3, tp, w, length), P(ST_SH)); c.drawRect(skia.Rect(-w + 7, tp, -w + 15, length), P(ST_HI, 210))
    c.save(); c.clipRect(skia.Rect(-w, tp + 60, w, tp + 520))
    c.drawRect(skia.Rect(-w, tp + 60, w, tp + 520), P(mix(ST, ST_SH, 0.35)))
    for i in range(-10, 40):
        c.drawLine(-w, tp + 60 + i * 22, w, tp + 60 + i * 22 + 2 * w, SP(ST_SH, 3, 170)); c.drawLine(-w, tp + 60 + i * 22 + 2 * w, w, tp + 60 + i * 22, SP(ST_HI, 2, 90))
    c.restore(); c.drawRect(skia.Rect(-w - 3, tp + 50, w + 3, tp + 62), P(ST_HI)); c.drawRect(skia.Rect(-w - 3, tp + 518, w + 3, tp + 530), P(ST_SH))
    c.drawRect(skia.Rect(-12, 26, 12, 38), P(ST_SH)); c.drawRect(skia.Rect(-12, 26, 12, 30), P(ST_HI))            # the collar that holds the stone
    D, D_SH, D_HI = (170, 232, 250), (86, 150, 214), (246, 254, 255)                                               # the diamond: a small faceted point
    c.drawCircle(0, 12, 26, P(D, 70, MaskFilter=blur(10)))
    c.drawPath(poly([(0, 0), (11, 16), (9, 28), (-9, 28), (-11, 16)]), P(D)); c.drawPath(poly([(0, 0), (11, 16), (3, 18)]), P(D_SH)); c.drawPath(poly([(3, 18), (11, 16), (9, 28), (2, 28)]), P(mix(D, D_SH, 0.5)))
    c.drawPath(poly([(0, 0), (-11, 16), (-3, 18)]), P(D_HI)); c.drawPath(poly([(-3, 18), (3, 18), (2, 28), (-9, 28), (-11, 16)]), P(D, 255)); c.drawLine(-3, 18, 3, 18, SP(D_HI, 1.5, 220)); c.drawLine(0, 0, -3, 18, SP(D_HI, 1.5, 200)); c.drawLine(0, 0, 3, 18, SP(D_SH, 1.5, 200))
    c.restore()


# ------------------------------------------------------------------ 5. the flame
def flame(c, tip, ang, s, k, t):
    """the flame at a nozzle tip, pointing along ang (radians). k about 0.3: the soft yellow, sooty acetylene flame just lit
    (long and lazy); k 1.0: the tight blue white cutting cone with a pale blue outer envelope. Flickers with t; additive glow."""
    if k <= 0.01: return
    ca, sa = math.cos(ang), math.sin(ang)
    T = lambda u, v: (tip[0] + s * (u * ca - v * sa), tip[1] + s * (u * sa + v * ca))
    fl = 0.5 + 0.5 * math.sin(t * 31) * math.sin(t * 13.7 + 1); fl2 = math.sin(t * 9.1 + 2)
    ay = (1 - sm((k - 0.35) / 0.4)) * sm(k / 0.15); ab = sm((k - 0.35) / 0.4)
    PL = skia.BlendMode.kPlus
    if ay > 0.01:                                             # yellow acetylene flame: a long wavering teardrop with a sooty tail
        L = 250 * (0.9 + 0.12 * fl); wv = 14 * fl2
        c.drawCircle(*T(L * 0.45, 0), 190 * s, P((255, 150, 40), 80 * ay, MaskFilter=blur(60 * s), BlendMode=PL))
        soot = crom([T(L * 0.7, -16), T(L * 1.2, -30 + wv), T(L * 1.6, -10 + wv * 2), T(L * 1.25, 12 + wv), T(L * 0.7, 16)], True, 0.3); c.drawPath(soot, P((30, 22, 30), 90 * ay, MaskFilter=blur(14 * s)))
        for sc_, col, al in ((1.0, (255, 132, 30), 210), (0.78, (255, 190, 60), 235), (0.5, (255, 240, 170), 245)):
            pts = [T(0, -7), T(L * 0.3 * sc_, -34 * sc_), T(L * 0.72 * sc_, -22 * sc_ + wv * 0.6), T(L * sc_, wv), T(L * 0.72 * sc_, 22 * sc_ + wv * 0.6), T(L * 0.3 * sc_, 34 * sc_), T(0, 7)]
            c.drawPath(crom(pts, True, 0.3), P(col, al * ay, MaskFilter=blur(2.5 * s)))
    if ab > 0.01:                                             # the neutral cutting flame: pale envelope, small bright inner cone
        L = 150 * (0.96 + 0.06 * fl)
        c.drawCircle(*T(40, 0), 120 * s, P((120, 170, 255), 70 * ab, MaskFilter=blur(44 * s), BlendMode=PL))
        env = crom([T(0, -9), T(L * 0.3, -19), T(L * 0.75, -12), T(L, fl2 * 2), T(L * 0.75, 12), T(L * 0.3, 19), T(0, 9)], True, 0.3)
        c.drawPath(env, P((96, 150, 255), 120 * ab, MaskFilter=blur(5 * s))); c.drawPath(env, P((150, 196, 255), 70 * ab, BlendMode=PL))
        Lc = 46 * (0.95 + 0.08 * fl)
        cone = crom([T(0, -6), T(Lc * 0.5, -5), T(Lc, 0), T(Lc * 0.5, 5), T(0, 6)], True, 0.3)
        c.drawPath(cone, P((170, 214, 255), 255 * ab, MaskFilter=blur(3 * s))); c.drawPath(cone, P((244, 252, 255), 255 * ab)); c.drawCircle(*T(Lc * 0.5, 0), 26 * s, P((200, 230, 255), 110 * ab, MaskFilter=blur(12 * s), BlendMode=PL))


# ------------------------------------------------------------------ 2. the workshop at night
LAMP = (560, 168)            # the bulb


def _back_static(c):
    c.drawRect(skia.Rect(-200, -200, W + 200, H + 200), SH(lin((0, 0), (0, 900), [(22, 27, 64), (28, 34, 78), (24, 29, 68)], [0, 0.6, 1])))
    c.drawRect(skia.Rect(-200, -200, W + 200, 40), P((14, 17, 44)))                                                # ceiling shadow
    c.drawCircle(700, 430, 620, SH(rad((700, 430), 620, [(120, 96, 110, 70), (60, 60, 110, 0)])))                 # the lamp warms the wall
    # floor
    c.drawRect(skia.Rect(-200, 900, W + 200, H + 200), SH(lin((0, 900), (0, 1080), [(40, 42, 78), (30, 31, 62)])))
    for i in range(-6, 30): c.drawLine(960 + (i * 110 - 960) * 0.9, 900, 960 + (i * 110 - 960) * 1.5, 1200, SP((24, 26, 54), 2.5, 150))
    c.drawRect(skia.Rect(-200, 884, W + 200, 902), P((16, 19, 48))); c.drawRect(skia.Rect(-200, 884, W + 200, 888), P((52, 58, 110)))
    # window (panes; the moon and clouds are drawn live)
    c.drawRRect(rr(40, 170, 350, 590, 6), P((12, 14, 40), 120, MaskFilter=blur(14)))
    c.drawRect(skia.Rect(52, 180, 338, 568), P((50, 44, 70))); c.drawRect(skia.Rect(52, 180, 338, 186), P((92, 82, 110)))
    c.drawRect(skia.Rect(40, 566, 350, 588), P((62, 54, 80))); c.drawRect(skia.Rect(40, 566, 350, 571), P((108, 96, 124)))
    # pegboard
    c.drawRRect(rr(408, 262, 1198, 632, 8), P((10, 12, 36), 130, MaskFilter=blur(12)))
    c.drawRRect(rr(400, 250, 1190, 620, 8), P((46, 53, 102))); c.drawRRect(rr(400, 250, 1190, 258, 4), P((74, 84, 146)))
    for gx in range(424, 1180, 26):
        for gy in range(276, 610, 26): c.drawCircle(gx, gy, 3.2, P((26, 30, 66)))
    # the top row leaves a gap around x 690..815 (her head at the bench) and the saw hangs at the far right, clear of a head anywhere up to x 1075
    tools = [('hammer', 470, 330, 1.25, 0), ('hammer', 556, 336, 1.05, 0), ('pliers', 640, 392, 1.1, 0), ('clamp', 990, 372, 1.0, 0), ('saw', 1152, 428, 0.9, 0),
             ('file', 842, 400, 1.15, 0), ('file', 888, 404, 1.0, 0), ('driver', 932, 410, 1.1, 0), ('wrench', 1052, 380, 0.9, 0),
             ('pliers', 468, 540, 0.8, 0), ('wrench', 560, 548, 0.72, 0), ('wrench', 612, 552, 0.62, 0), ('wrench', 660, 556, 0.54, 0), ('driver', 730, 548, 0.72, 0), ('driver', 778, 550, 0.66, 0)]
    for kind, x, y, s_, an in tools:
        c.drawRect(skia.Rect(x - 5, y - (100 if kind in ('file', 'driver', 'saw') else 30) * s_ - 8, x + 5, y - (100 if kind in ('file', 'driver', 'saw') else 30) * s_), P((120, 130, 170)))
        _tool(c, kind, x, y, s_, an, hc=((214, 118, 60) if (x // 7) % 2 else (196, 84, 70)))
    # shelves at the right
    for sy, x0, x1 in ((250, 1250, 1890), (430, 1330, 1890)):
        c.drawRect(skia.Rect(x0 + 6, sy + 8, x1 + 6, sy + 34), P((10, 12, 36), 110, MaskFilter=blur(8)))
        c.drawRect(skia.Rect(x0, sy, x1, sy + 20), P((104, 70, 60))); c.drawRect(skia.Rect(x0, sy, x1, sy + 5), P((150, 104, 80)))
        for bx in (x0 + 50, x1 - 70): c.drawPath(poly([(bx, sy + 20), (bx + 16, sy + 20), (bx + 16, sy + 34), (bx, sy + 58)]), P((70, 46, 50)))
    _jar(c, 1300, 250, 62, 96, (150, 160, 190), 1); _jar(c, 1378, 250, 62, 110, (214, 150, 80), 2); _jar(c, 1456, 250, 62, 90, (120, 170, 160), 3)
    for i, hgt in enumerate((60, 74, 52)): c.drawRect(skia.Rect(1520 + i * 20, 250 - hgt, 1528 + i * 20, 250), P((150, 160, 186)))
    c.drawRRect(rr(1610, 196, 1716, 250, 6), P((82, 92, 140))); c.drawRRect(rr(1622, 180, 1704, 200, 6), P((120, 132, 180)))
    c.drawRRect(rr(1760, 176, 1850, 250, 8), P((150, 70, 60)))
    for i in range(7): c.drawLine(1764, 186 + i * 9, 1846, 186 + i * 9, SP((196, 106, 80), 3))
    c.drawRect(skia.Rect(1752, 170, 1858, 180), P((80, 54, 56))); c.drawRect(skia.Rect(1752, 244, 1858, 252), P((80, 54, 56)))
    _jar(c, 1392, 430, 60, 84, (200, 120, 90), 4); _jar(c, 1466, 430, 60, 92, (160, 150, 120), 5)
    c.drawRect(skia.Rect(1540, 396, 1680, 430), P((88, 98, 146))); c.drawRect(skia.Rect(1540, 396, 1680, 402), P((130, 142, 196)))
    c.drawRect(skia.Rect(1700, 372, 1800, 430), P((176, 130, 90))); c.drawRect(skia.Rect(1716, 344, 1790, 374), P((200, 152, 104))); c.drawRect(skia.Rect(1700, 372, 1800, 377), P((216, 170, 120)))
    # things on the floor at the left: steel bars against the wall, a tool box
    for bx, by, bw in ((70, 520, 30), (118, 600, 22), (160, 650, 44)):
        c.drawPath(poly([(bx, by), (bx + bw, by), (bx + bw + 14, 930), (bx + 14, 930)]), P((70, 80, 126))); c.drawPath(poly([(bx, by), (bx + 6, by), (bx + 20, 930), (bx + 14, 930)]), P((120, 132, 180)))
    c.drawOval(skia.Rect(150, 944, 420, 986), P((8, 10, 30), 120, MaskFilter=blur(12)))
    c.drawPath(poly([(176, 884), (392, 884), (372, 964), (196, 964)]), P((120, 74, 58))); c.drawPath(poly([(176, 884), (392, 884), (390, 894), (178, 894)]), P((168, 110, 78)))
    c.drawPath(poly([(196, 884), (206, 836), (362, 836), (372, 884)]), SP((96, 58, 50), 9)); _tool(c, 'wrench', 262, 876, 0.5, 70); _tool(c, 'driver', 318, 880, 0.5, -60)
    # low haze along the floor (depth)
    c.drawRect(skia.Rect(-200, 760, W + 200, 930), SH(lin((0, 760), (0, 930), [(70, 80, 140, 0), (70, 80, 140, 46)])))


def workshop_back(c, t, cam=(0, 0, 1.0), lamp=1.0, glow=0.0):
    """the back of the workshop at night: wall, window with the moon and slow clouds, pegboard with tools, shelves with jars,
    steel bars and a tool box, the lamp's warm cone with dust motes. glow 0..1 adds the torch's orange flicker from screen right.
    Draw the person after this and workshop_front after the person. See the module docstring for STAND, BENCH_Y and PAPER."""
    c.save(); cam_apply(c, cam, 0.6)
    _blit(c, 'wback', _back_static)
    # the night in the window
    c.save(); c.clipRect(skia.Rect(64, 192, 326, 556))
    c.drawRect(skia.Rect(64, 192, 326, 556), SH(lin((0, 192), (0, 556), [(10, 14, 46), (30, 40, 96)])))
    rs = np.random.default_rng(11)
    for i in range(22):
        sx, sy = rs.uniform(70, 320), rs.uniform(198, 440); c.drawCircle(sx, sy, rs.uniform(1.0, 2.2), P((230, 236, 255), 130 + 110 * math.sin(t * rs.uniform(0.6, 1.8) + i)))
    c.drawCircle(246, 270, 60, P((200, 214, 255), 40, MaskFilter=blur(26)))
    moon = skia.Path(); moon.addCircle(246, 270, 30); cut_ = skia.Path(); cut_.addCircle(262, 260, 27); c.drawPath(skia.Op(moon, cut_, skia.PathOp.kDifference_PathOp), P((250, 240, 206)))
    for i, (cy, sp, wd) in enumerate(((300, 5.0, 130), (372, 8.0, 100), (236, 3.4, 90))):
        cx = 40 + ((t * sp + i * 150) % 420) - 60
        for dx, dy, r_ in ((0, 0, 20), (wd * 0.25, -9, 26), (wd * 0.5, -3, 22), (wd * 0.75, 3, 17)): c.drawCircle(cx + dx, cy + dy, r_, P((58, 70, 130), 150))
    c.drawPath(poly([(64, 556), (64, 500), (110, 500), (110, 470), (168, 470), (168, 490), (230, 490), (230, 452), (262, 430), (294, 452), (294, 510), (326, 510), (326, 556)]), P((16, 20, 52)))
    c.drawRect(skia.Rect(240, 476, 252, 490), P((255, 206, 120), 190))
    c.restore()
    c.drawRect(skia.Rect(52, 364, 338, 380), P((50, 44, 70))); c.drawRect(skia.Rect(188, 180, 202, 568), P((50, 44, 70))); c.drawRect(skia.Rect(52, 364, 338, 368), P((92, 82, 110)))
    c.drawRect(skia.Rect(52, 180, 64, 568), P((50, 44, 70))); c.drawRect(skia.Rect(326, 180, 338, 568), P((50, 44, 70)))
    c.drawPath(poly([(64, 590), (326, 590), (420, 900), (20, 900)]), P((120, 140, 230), 12))                       # faint moonlight on the wall and floor
    c.restore()
    # lamp cone, motes and the torch glow sit between wall and person
    c.save(); cam_apply(c, cam, 0.8)
    fl = lamp * (0.96 + 0.04 * math.sin(t * 2.3) * math.sin(t * 0.7))
    cone = poly([(LAMP[0] - 78, LAMP[1] + 6), (LAMP[0] + 78, LAMP[1] + 6), (1420, 1200), (-40, 1200)])
    c.drawPath(cone, SH(lin((0, LAMP[1]), (0, 1100), [(255, 200, 120, int(66 * fl)), (255, 190, 110, int(26 * fl)), (255, 180, 100, int(12 * fl))], [0, 0.5, 1]), MaskFilter=blur(26), BlendMode=skia.BlendMode.kScreen))
    rs = np.random.default_rng(4)
    for i in range(46):
        u = (rs.uniform(0, 1) + t * rs.uniform(0.004, 0.012)) % 1.0; y = 220 + u * 520; half = 80 + (y - 170) * 0.72
        x = LAMP[0] + 130 + rs.uniform(-1, 1) * half * 0.82 + 12 * math.sin(t * 0.3 + i)
        c.drawCircle(x, y + 6 * math.sin(t * 0.5 + i * 1.7), rs.uniform(1.2, 2.8), P((255, 226, 170), fl * (60 + 60 * math.sin(t * 0.8 + i * 2.1))))
    if glow > 0.01:
        g = glow * (0.8 + 0.2 * math.sin(t * 23) * math.sin(t * 7.3) + 0.08 * math.sin(t * 41))
        c.drawRect(skia.Rect(-200, -200, W + 200, H + 200), SH(rad((1500, 620), 1250, [(255, 150, 60, int(120 * g)), (255, 110, 50, int(46 * g)), (255, 90, 40, 0)], [0, 0.45, 1]), BlendMode=skia.BlendMode.kScreen))
    c.restore()


BENCH = dict(back=(300, 1160, 660), front=(215, 1245, 870))      # (x0, x1, y) of the top's back and front edges


def _front_static(c):
    bx0, bx1, by = BENCH['back']; fx0, fx1, fy = BENCH['front']
    WD, WD_SH, WD_HI, WD_DK = (170, 110, 64), (124, 74, 50), (214, 152, 92), (84, 50, 44)
    top = poly([(bx0, by), (bx1, by), (fx1, fy), (fx0, fy)])
    c.drawRect(skia.Rect(fx0 - 20, fy + 150, fx1 + 30, 1400), P((8, 9, 28), 150, MaskFilter=blur(30)))
    # the cabinet front below the top (it hides the person's legs)
    c.drawRect(skia.Rect(fx0 + 22, fy + 30, fx1 - 22, 1400), SH(lin((0, fy), (0, 1200), [(104, 62, 46), (70, 42, 44)])))
    for k, (dx0, dx1) in enumerate(((fx0 + 60, 700), (724, fx1 - 60))):
        c.drawRRect(rr(dx0, fy + 62, dx1, fy + 196, 8), P((120, 74, 52))); c.drawRRect(rr(dx0, fy + 62, dx1, fy + 70, 4), P((160, 104, 70))); c.drawRRect(rr(dx0, fy + 186, dx1, fy + 196, 4), P((78, 46, 44)))
        mx = (dx0 + dx1) / 2; c.drawRRect(rr(mx - 60, fy + 116, mx + 60, fy + 136, 10), P((60, 38, 44))); c.drawRRect(rr(mx - 56, fy + 114, mx + 56, fy + 126, 8), P((176, 150, 120)))
    # the top: planks toward the back edge, a lamp pool, a thick front edge
    c.drawPath(top, P(WD)); c.save(); c.clipPath(top, skia.ClipOp.kIntersect, True)
    for i in range(1, 8):
        u = i / 8; c.drawLine(bx0 + (bx1 - bx0) * u, by, fx0 + (fx1 - fx0) * u, fy, SP(WD_SH, 2.5, 120))
    rs = np.random.default_rng(8)
    for i in range(40):
        u = rs.uniform(0, 1); v0 = rs.uniform(0, 0.8); v1 = v0 + rs.uniform(0.08, 0.2)
        xa = lambda v: (bx0 + (fx0 - bx0) * v) + ((bx1 + (fx1 - bx1) * v) - (bx0 + (fx0 - bx0) * v)) * u
        c.drawLine(xa(v0), by + (fy - by) * v0, xa(v1), by + (fy - by) * v1, SP(WD_SH, 1.5, 70))
    c.drawRect(skia.Rect(0, by, W, fy), SH(rad((690, 760), 520, [(255, 214, 150, 120), (255, 200, 130, 30), (255, 190, 120, 0)], [0, 0.6, 1]), BlendMode=skia.BlendMode.kScreen))
    c.drawRect(skia.Rect(900, by, W, fy), SH(lin((900, 0), (1250, 0), [(30, 20, 60, 0), (30, 20, 60, 90)])))
    c.drawRect(skia.Rect(0, by, W, by + 18), SH(lin((0, by), (0, by + 18), [(30, 16, 50, 110), (30, 16, 50, 0)])))        # the person's shadow line at the back edge
    c.restore()
    c.drawPath(poly([(fx0, fy), (fx1, fy), (fx1, fy + 34), (fx0, fy + 34)]), P(WD_SH)); c.drawRect(skia.Rect(fx0, fy, fx1, fy + 5), P(WD_HI)); c.drawRect(skia.Rect(fx0, fy + 28, fx1, fy + 34), P(WD_DK))
    # vise at the left front corner
    c.drawRRect(rr(fx0 + 30, fy - 10, fx0 + 190, fy + 70, 8), P((70, 80, 120))); c.drawRRect(rr(fx0 + 30, fy - 10, fx0 + 190, fy + 2, 5), P((120, 132, 180))); c.drawRRect(rr(fx0 + 96, fy + 22, fx0 + 124, fy + 50, 14), P((40, 46, 84)))
    c.drawLine(fx0 + 70, fy + 36, fx0 + 150, fy + 36, SP((150, 160, 200), 8)); c.drawCircle(fx0 + 70, fy + 36, 8, P((190, 198, 226))); c.drawCircle(fx0 + 150, fy + 36, 8, P((120, 130, 170)))
    # the sheet of paper
    c.drawPath(poly([(PAPER[0][0] + 10, PAPER[0][1] + 10), (PAPER[1][0] + 12, PAPER[1][1] + 10), (PAPER[2][0] + 14, PAPER[2][1] + 12), (PAPER[3][0] + 10, PAPER[3][1] + 12)]), P((40, 20, 40), 110, MaskFilter=blur(8)))
    c.drawPath(poly(PAPER), SH(lin((PAPER[0][0], 0), (PAPER[1][0], 0), [(250, 244, 228), (232, 222, 206)])))
    # a pencil cup at the back left, tools at the right
    cx, cy = 396, 716
    c.drawOval(skia.Rect(cx - 50, cy - 12, cx + 70, cy + 22), P((40, 20, 40), 120, MaskFilter=blur(8)))
    for i, (dx, col, hh, an) in enumerate(((-18, (238, 176, 64), 150, -9), (-4, (86, 150, 200), 170, -2), (12, (214, 96, 80), 140, 7), (22, (120, 190, 150), 160, 13))):
        c.save(); c.translate(cx + dx, cy - 60); c.rotate(an); c.drawRect(skia.Rect(-6, -hh + 60, 6, 0), P(col)); c.drawRect(skia.Rect(2, -hh + 60, 6, 0), P(mix(col, (40, 20, 60), 0.4)))
        c.drawPath(poly([(-6, -hh + 60), (6, -hh + 60), (0, -hh + 40)]), P((226, 178, 128))); c.drawPath(poly([(-2, -hh + 47), (2, -hh + 47), (0, -hh + 40)]), P((60, 62, 80))); c.restore()
    c.drawPath(poly([(cx - 36, cy - 96), (cx + 36, cy - 96), (cx + 30, cy), (cx - 30, cy)]), P((62, 72, 124))); c.drawPath(poly([(cx + 10, cy - 96), (cx + 36, cy - 96), (cx + 30, cy), (cx + 8, cy)]), P((40, 46, 92)))
    c.drawOval(skia.Rect(cx - 36, cy - 104, cx + 36, cy - 88), P((34, 38, 78))); c.drawLine(cx - 30, cy - 90, cx - 26, cy - 8, SP((110, 124, 190), 4))
    c.drawOval(skia.Rect(1010, 742, 1200, 800), P((40, 20, 40), 90, MaskFilter=blur(10)))
    c.save(); c.translate(1100, 756); c.scale(1.0, 0.5); _tool(c, 'hammer', 0, 0, 0.9, 62); c.restore()
    c.save(); c.translate(1090, 818); c.scale(1.0, 0.5); _tool(c, 'pliers', 0, 0, 0.8, -70); c.restore()
    c.drawRRect(rr(500, 760, 566, 806, 14), P((236, 190, 70))); c.drawRRect(rr(500, 790, 566, 806, 10), P((176, 130, 60))); c.drawCircle(533, 778, 12, P((70, 60, 70))); c.drawRect(skia.Rect(560, 790, 590, 800), P((220, 220, 226)))


def _paper_matrix():
    m = skia.Matrix()
    m.setPolyToPoly([skia.Point(0, 0), skia.Point(240, 0), skia.Point(240, 330), skia.Point(0, 330)], [skia.Point(*q) for q in PAPER])
    return m


def sketch_point(u):
    """screen point (before the camera) of the pencil tip on the bench paper when `sketch` = u"""
    (px, py), _ = heron_point(126, 318, 300, u); q = _paper_matrix().mapXY(px, py); return (q.x(), q.y())


def workshop_front(c, t, cam=(0, 0, 1.0), sketch=0.0):
    """the workbench in front of the person (its top seen from above, a cabinet front that hides her legs), the sheet of paper
    with `sketch` 0..1 of the heron drawn on it in pencil, a pencil cup, a tape, tools, and the hanging lamp (it hangs nearer
    than the person). Returns dict(paper=quad, pencil=point of the sketch's growing end), both in screen coordinates."""
    c.save(); cam_apply(c, cam, 1.0)
    _blit(c, 'wfront', _front_static)
    if sketch > 0.001:
        c.save(); c.concat(_paper_matrix())
        heron_stroke(c, 126, 318, 300, sketch, SP((74, 76, 92), 3.4, 225)); heron_stroke(c, 127, 319, 300, sketch, SP((74, 76, 92), 6.0, 46))
        c.restore()
    c.restore()
    # the lamp: cord, shade, bulb, glow (a near layer: it slides a little more than the bench)
    c.save(); cam_apply(c, cam, 1.05)
    sw = 1.2 * math.sin(t * 0.5); lx, ly = LAMP[0] + sw, LAMP[1]
    c.drawLine(LAMP[0], -260, lx, ly - 120, SP((14, 16, 40), 6))
    c.drawCircle(lx, ly + 10, 150, P((255, 200, 120), 60, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))
    c.drawPath(poly([(lx - 22, ly - 124), (lx + 22, ly - 124), (lx + 30, ly - 96), (lx - 30, ly - 96)]), P((60, 44, 56)))
    shade = crom([(lx - 34, ly - 98), (lx + 34, ly - 98), (lx + 84, ly - 30), (lx + 112, ly + 2), (lx - 112, ly + 2), (lx - 84, ly - 30)], True, 0.2)
    c.drawPath(shade, P((226, 138, 52))); c.save(); c.clipPath(shade, skia.ClipOp.kIntersect, True)
    c.drawPath(poly([(lx + 14, ly - 110), (lx + 130, ly - 110), (lx + 130, ly + 10), (lx + 52, ly + 10)]), P((168, 88, 48))); c.drawPath(poly([(lx - 30, ly - 100), (lx - 14, ly - 100), (lx - 70, ly + 4), (lx - 100, ly + 4)]), P((255, 190, 100), 200)); c.restore()
    c.drawOval(skia.Rect(lx - 112, ly - 8, lx + 112, ly + 12), P((250, 196, 110))); c.drawOval(skia.Rect(lx - 96, ly - 5, lx + 96, ly + 10), P((255, 236, 180)))
    c.drawCircle(lx, ly + 10, 26, P((255, 250, 226))); c.drawCircle(lx, ly + 10, 44, P((255, 236, 170), 150, MaskFilter=blur(14), BlendMode=skia.BlendMode.kScreen))
    c.restore()
    return dict(paper=[cam_point(q, cam, 1.0) for q in PAPER], pencil=cam_point(sketch_point(sketch), cam, 1.0))


# ------------------------------------------------------------------ 3. the steel plate on its easel
def _kerf(c, path, cutu, hot, wd=5.0, glow=True, t=0.0):
    """the cut along `path` up to fraction cutu: a dark slot whose newest stretch still glows (white, yellow, orange, dull red)"""
    if cutu <= 0.001: return
    sg_ = seg(path, 0, cutu); c.drawPath(sg_, SP((196, 206, 236), wd + max(2.0, wd * 0.22), 120)); c.drawPath(sg_, SP((8, 8, 18), wd))
    if hot <= 0.01: return
    span = 0.16
    for a0, a1, col, al, wm in ((0.0, 1.0, (150, 30, 20), 150, 1.9), (0.3, 1.0, (236, 90, 24), 200, 1.7), (0.62, 1.0, (255, 170, 50), 230, 1.5), (0.86, 1.0, (255, 240, 190), 255, 1.3)):
        u0 = max(0.0, cutu - span * (1 - a0)); pth = seg(path, u0, cutu)
        if glow: c.drawPath(pth, SP(col, wd * wm * 2.6, al * hot * 0.35)) if False else None
        c.drawPath(pth, skia.Paint(AntiAlias=True, Color=C(col, al * hot), Style=skia.Paint.kStroke_Style, StrokeWidth=wd * wm, StrokeCap=skia.Paint.kRound_Cap, BlendMode=skia.BlendMode.kPlus))
    if glow:
        (px, py), _ = at(path, cutu); c.drawCircle(px, py, wd * 9, P((255, 150, 50), 150 * hot, MaskFilter=blur(wd * 4), BlendMode=skia.BlendMode.kPlus))


def plate(c, t, x=1410, y=1010, s=0.9, scribed=0.0, cut=0.0, hot=None):
    """the steel plate on its steel work stand (an A frame with a ledge), facing the camera at a slight angle (its right edge a little farther away).
    (x, y) is the floor point under the middle of the easel, s the scale (default x 1410, y 1010, s 0.9: the plate's face is
    then about x 1268..1541, y 402..778, screen right of the bench). scribed 0..1: how much of the heron outline is scratched
    bright into the steel (same order as heron_stroke). cut 0..1: how much of that line is cut through (a dark kerf whose newest
    stretch glows orange and cools). hot: None = the kerf glows only while 0 < cut < 1; or 0..1 to set the glow yourself.
    Returns dict(scribe=point, cut=point, quad=the four corners of the face, top=(x, y of the top edge centre)) in the same
    coordinates you drew in (map with cam_point if you wrapped it in cam_apply)."""
    c.save(); c.translate(x, y); c.scale(s, s)
    ST, ST_SH, ST_HI = (128, 140, 172), (70, 78, 116), (206, 216, 240); WD, WD_SH, WD_HI = (92, 100, 140), (54, 60, 100), (158, 168, 210)      # a welded steel work stand (a torch cut never happens over wood)
    c.drawOval(skia.Rect(-210, -22, 230, 30), P((6, 8, 26), 150, MaskFilter=blur(14)))
    c.drawPath(poly([(18, -640), (34, -640), (62, -60), (44, -60)]), P(WD_SH))                                     # the back leg
    for sx in (-1, 1):                                                                                             # front legs, splayed
        leg = poly([(sx * 96, -690), (sx * 118, -690), (sx * 186, 0), (sx * 160, 0)]); c.drawPath(leg, P(WD if sx < 0 else WD_SH)); c.drawLine(sx * 97 - 0, -688, sx * 161, -2, SP(WD_HI, 3, 200 if sx < 0 else 70))
    c.drawRect(skia.Rect(-150, -160, 150, -138), P(WD_SH)); c.drawRect(skia.Rect(-150, -160, 150, -155), P(WD))
    c.drawPath(poly([(-186, -262), (190, -256), (196, -224), (-190, -228)]), P(WD)); c.drawPath(poly([(-186, -262), (190, -256), (190, -250), (-186, -255)]), P(WD_HI)); c.drawPath(poly([(-190, -236), (196, -231), (196, -224), (-190, -228)]), P(WD_SH))
    quad = [(-158, -676), (146, -664), (146, -258), (-158, -264)]                                                   # the plate face
    c.drawPath(poly([(quad[0][0] + 12, quad[0][1] + 10), (quad[1][0] + 14, quad[1][1] + 10), (quad[2][0] + 14, quad[2][1] + 4), (quad[3][0] + 12, quad[3][1] + 4)]), P((10, 10, 30), 130, MaskFilter=blur(8)))
    c.drawPath(poly([(quad[1][0], quad[1][1]), (quad[1][0] + 9, quad[1][1] + 5), (quad[2][0] + 9, quad[2][1] - 2), (quad[2][0], quad[2][1])]), P((48, 54, 90)))  # its thickness
    m = skia.Matrix(); m.setPolyToPoly([skia.Point(0, 0), skia.Point(300, 0), skia.Point(300, 410), skia.Point(0, 410)], [skia.Point(*q) for q in quad])
    c.save(); c.concat(m)
    face = skia.Rect(0, 0, 300, 410)
    c.drawRect(face, SH(lin((0, 0), (300, 410), [(150, 162, 194), (112, 124, 160), (84, 94, 134)], [0, 0.5, 1])))
    c.save(); c.clipRect(face)
    c.drawImageRect(_noise(5, 'brush', 5), skia.Rect(0, 0, 480, 270), face, LIN, skia.Paint(BlendMode=skia.BlendMode.kOverlay))
    sx_ = -260 + ((t * 26) % 900)                                                                                 # a soft sheen that drifts across
    c.drawPath(poly([(sx_, 0), (sx_ + 90, 0), (sx_ - 60, 410), (sx_ - 150, 410)]), P((236, 242, 255), 44, MaskFilter=blur(18)))
    c.drawPath(poly([(40, 0), (120, 0), (0, 330), (0, 110)]), P((255, 226, 180), 30, MaskFilter=blur(20)))        # the lamp's warm catch at the upper left
    c.restore()
    hp = heron_path(150, 392, 366)
    if scribed > 0.001:
        pth = hp if scribed >= 0.999 else seg(hp, 0, scribed)
        off = skia.Path(pth); off.offset(1.2, 1.6); c.drawPath(off, SP((40, 46, 80), 2.2, 170)); c.drawPath(pth, SP((232, 240, 255), 2.2)); c.drawPath(pth, SP((200, 220, 255), 6, 40))
    hot_ = (1.0 if 0.0 < cut < 0.999 else 0.0) if hot is None else hot
    _kerf(c, hp, cut, hot_, 4.6, True, t)
    c.restore()
    c.drawLine(quad[0][0], quad[0][1], quad[1][0], quad[1][1], SP(ST_HI, 3)); c.drawLine(quad[0][0], quad[0][1], quad[3][0], quad[3][1], SP(ST_HI, 2.5, 200))
    for kx in (-120, 110):                                                                                         # two clips hold the plate on the ledge
        c.drawRRect(rr(kx - 12, -282, kx + 12, -250, 4), P((60, 64, 100))); c.drawRect(skia.Rect(kx - 12, -282, kx + 12, -277), P((130, 140, 190)))
    c.restore()
    def out(u):
        (px, py), _ = at(hp, u); q = m.mapXY(px, py); return (x + q.x() * s, y + q.y() * s)
    return dict(scribe=out(scribed), cut=out(cut), quad=[(x + qx * s, y + qy * s) for qx, qy in quad], top=(x - 6 * s, y - 670 * s))


# ------------------------------------------------------------------ 4. the oxyacetylene cart
_WOB = [0.0]            # extra needle swing while the cart rolls (cart_close)


def _tank(c, x, base, w, h, col, word, t, side=1):
    """one gas cylinder; side = which way its regulator and gauges point. Returns the hose outlet."""
    SHc, HIc = mix(col, (14, 10, 40), 0.5), mix(col, (255, 255, 255), 0.42)
    body = skia.Path(); body.moveTo(x - w / 2, base); body.lineTo(x - w / 2, base - h + w * 0.42)
    body.cubicTo(x - w / 2, base - h + w * 0.1, x - w * 0.2, base - h, x - w * 0.14, base - h - 8); body.lineTo(x + w * 0.14, base - h - 8)
    body.cubicTo(x + w * 0.2, base - h, x + w / 2, base - h + w * 0.1, x + w / 2, base - h + w * 0.42); body.lineTo(x + w / 2, base); body.close()
    c.drawPath(body, P(col)); c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(x + w * 0.16, base - h - 20, x + w, base), P(SHc)); c.drawRect(skia.Rect(x - w * 0.36, base - h - 20, x - w * 0.22, base), P(HIc, 190))
    c.drawRect(skia.Rect(x - w, base - 16, x + w, base), P(SHc, 200))
    c.restore()
    f = skia.Font(K.TYPE['xb'], w * 0.4); f.setEdging(skia.Font.Edging.kAntiAlias); tw = f.measureText(word)       # the word, stencilled up the tank
    c.save(); c.translate(x + w * 0.1, base - h * 0.44 + tw / 2); c.rotate(-90); c.drawString(word, 0, 0, f, P((246, 242, 230), 240)); c.restore()
    ny = base - h - 8                                                                                              # valve, regulator, two gauges
    c.drawRect(skia.Rect(x - w * 0.1, ny - 30, x + w * 0.1, ny), P((176, 150, 90))); c.drawRect(skia.Rect(x - w * 0.1, ny - 30, x - w * 0.04, ny), P((226, 204, 140)))
    c.drawRRect(rr(x - w * 0.2, ny - 46, x + w * 0.2, ny - 30, 5), P((60, 62, 90))); c.drawRRect(rr(x - w * 0.2, ny - 46, x + w * 0.2, ny - 41, 3), P((120, 124, 160)))
    ox = x + side * w * 0.5
    c.drawLine(x, ny - 16, ox, ny - 16, SP((176, 150, 90), 10)); c.drawCircle(ox, ny - 16, 15, P((190, 164, 100)))
    for gx, gy, need in ((x + side * w * 0.26, ny - 54, -0.7 + 0.02 * math.sin(t * 3) + _WOB[0]), (x + side * w * 0.62, ny - 52, 0.5 + 0.02 * math.sin(t * 2.3 + 1) - 0.7 * _WOB[0])):
        c.drawCircle(gx, gy, 23, P((44, 46, 74))); c.drawCircle(gx, gy, 19, P((240, 240, 232))); c.drawArc(skia.Rect(gx - 14, gy - 14, gx + 14, gy + 14), 200, 140, False, SP((200, 60, 50), 3))
        c.drawLine(gx, gy, gx + 14 * math.sin(need), gy - 14 * math.cos(need), SP((30, 30, 50), 2.6)); c.drawCircle(gx, gy, 3, P((30, 30, 50)))
    return (ox, ny - 16)


def cart(c, t, x=1740, ground=1020, s=0.7, roll=0.0):
    """the oxyacetylene cart, front view: a taller GREEN tank stencilled OXYGEN (screen left) and a shorter, wider MAROON tank
    stencilled ACETYLENE, each with a valve, a regulator and two gauges; a chain across; a green and a red hose that run down
    behind the tanks to a coil hung at the left side; two wheels that turn with roll (radians); a tubular frame rising to a
    handle bar at the top right. (x, ground) is the floor point under the middle of the cart. Returns dict(handle=(x, y) the
    middle of the handle bar, hose=(x, y) the bottom of the hose coil, where the hoses leave toward the torch, top=y of the
    highest gauge). Size at s = 1: about 500 wide and 800 tall; at the default (1740, 1020, 0.7) it spans about x 1560..1905
    and y 470..1020 (handle at about (1830, 500))."""
    c.save(); c.translate(x, ground); c.scale(s, s)
    FR, FR_SH, FR_HI = (88, 96, 140), (50, 56, 98), (150, 160, 206)
    c.drawOval(skia.Rect(-240, -24, 250, 34), P((6, 8, 26), 160, MaskFilter=blur(16)))
    c.drawLine(-172, -40, -172, -560, SP(FR_SH, 16)); c.drawLine(176, -40, 176, -640, SP(FR_SH, 16)); c.drawLine(176, -640, 206, -706, SP(FR_SH, 16))
    c.drawLine(-172, -560, 176, -560, SP(FR_SH, 12))
    hpt = (130, -730); c.drawLine(206, -706, 60, -752, SP(FR, 20)); c.drawLine(206, -712, 60, -758, SP(FR_HI, 5, 200)); c.drawLine(96, -741, 166, -719, SP((40, 42, 70), 27))
    hook = (-196, -330); o1 = (-88 - 75, -44 - 640 - 24); o2 = (82 + 86, -44 - 520 - 24)
    for (rx, ry), col, off in ((o1, (60, 170, 110), 0), (o2, (206, 64, 60), 10)):                                    # hoses, behind the tanks
        pth = skia.Path(); pth.moveTo(rx, ry)
        if rx < 0: pth.cubicTo(rx - 50, ry + 40, hook[0] - 30, hook[1] - 200, hook[0] - 16 + off, hook[1] + 10)
        else: pth.cubicTo(rx + 60, ry + 60, rx + 20, ry + 330, 0, -200); pth.cubicTo(-80, -150, hook[0] + 60, hook[1] - 60, hook[0] + off, hook[1] + 10)
        c.drawPath(pth, SP(mix(col, (10, 10, 40), 0.45), 12)); c.drawPath(pth, SP(col, 8))
    _tank(c, -88, -44, 150, 640, (36, 132, 92), 'OXYGEN', t, -1)
    _tank(c, 82, -44, 172, 520, (132, 40, 60), 'ACETYLENE', t, 1)
    c.drawLine(-168, -488, 172, -488, SP((60, 64, 100), 9)); c.drawLine(-168, -490, 172, -490, SP((150, 156, 190), 4))      # the chain, above both stencils
    for i in range(18): c.drawCircle(-164 + i * 19.6, -489, 6, SP((196, 202, 230), 2.5))
    c.drawRRect(rr(-196, -52, 196, -28, 6), P(FR)); c.drawRRect(rr(-196, -52, 196, -45, 4), P(FR_HI)); c.drawRRect(rr(-196, -34, 196, -28, 3), P(FR_SH))
    for wx in (-176, 176):
        c.drawCircle(wx, -58, 58, P((26, 28, 50))); c.drawCircle(wx, -58, 43, P((70, 76, 116))); c.drawCircle(wx - 4, -62, 43, SP((120, 130, 180), 3, 150))
        for k in range(5):
            a_ = roll + k * 2 * math.pi / 5; c.drawLine(wx, -58, wx + 39 * math.cos(a_), -58 + 39 * math.sin(a_), SP((34, 38, 70), 9))
        c.drawCircle(wx, -58, 12, P((170, 178, 214))); c.drawCircle(wx, -58, 58, SP((60, 62, 90), 4))
    c.drawLine(-172, -338, -214, -338, SP(FR_HI, 9)); c.drawLine(-214, -338, -214, -360, SP(FR_HI, 9))                # the hook and the coil on it
    for k in range(3):
        for col, off in (((60, 170, 110), 0), ((206, 64, 60), 9)):
            r_ = skia.Rect(hook[0] - 52 + off - k * 4, hook[1] - 6 + k * 6, hook[0] + 40 + off + k * 4, hook[1] + 150 + k * 8)
            c.drawOval(r_, SP(mix(col, (10, 10, 40), 0.45), 11)); c.drawOval(r_, SP(col, 7))
    c.restore()
    return dict(handle=(x + hpt[0] * s, ground + hpt[1] * s), hose=(x + (hook[0] - 2) * s, ground + (hook[1] + 166) * s), top=ground - 776 * s)


# ------------------------------------------------------------------ 6. macro insert shots
def _bokeh(c, t, cols, y0=0, y1=250, seed=2, n=12):
    rs = np.random.default_rng(seed)
    for i in range(n):
        x, y, r_ = rs.uniform(-50, W + 50), rs.uniform(y0, y1), rs.uniform(40, 120); col = cols[i % len(cols)]
        c.drawCircle(x + 10 * math.sin(t * 0.2 + i), y, r_, P(col, 46 + 20 * math.sin(t * 0.6 + i * 2), MaskFilter=blur(30)))


def _paper_bg(c, t, x0=0, x1=W):
    c.drawRect(skia.Rect(x0, 0, x1, H), SH(lin((x0, 0), (x1, H), [(248, 240, 222), (232, 222, 204), (206, 194, 184)], [0, 0.55, 1])))
    c.drawRect(skia.Rect(x0, 0, x1, H), SH(rad((x0 + 380, 420), 1300, [(255, 232, 190, 90), (255, 220, 170, 0)])))
    c.save(); c.clipRect(skia.Rect(x0, 0, x1, H)); _texture(c, 'tooth', None, 1.0, 3)
    rs = np.random.default_rng(21)
    for i in range(260):                                                                                           # paper fibres
        fx, fy, fa, fl_ = rs.uniform(0, W), rs.uniform(0, H), rs.uniform(0, math.pi), rs.uniform(8, 26)
        c.drawLine(fx, fy, fx + fl_ * math.cos(fa), fy + fl_ * math.sin(fa), SP((160, 146, 130), 1.2, 46))
    # the out of focus workshop beyond the far edge of the sheet
    c.drawRect(skia.Rect(x0, -40, x1, 150), SH(lin((0, 0), (0, 150), [(30, 30, 70, 255), (120, 80, 70, 230), (190, 150, 120, 0)], [0, 0.6, 1]), MaskFilter=blur(22)))
    _bokeh(c, t, [(255, 196, 110), (90, 110, 200), (230, 120, 70)], -20, 90, 6, 9)
    c.restore()


def _steel_bg(c, t, x0=0, x1=W, dark=0.0):
    a_, b_, d_ = mix((170, 182, 210), (70, 74, 104), dark), mix((128, 140, 174), (48, 52, 84), dark), mix((88, 98, 138), (30, 32, 60), dark)
    c.drawRect(skia.Rect(x0, 0, x1, H), SH(lin((x0, 0), (x1, H), [a_, b_, d_], [0, 0.5, 1])))
    c.save(); c.clipRect(skia.Rect(x0, 0, x1, H)); _texture(c, 'brush', None, 1.0, 5)
    sx_ = -400 + ((t * 40) % 2800)
    c.drawPath(poly([(sx_, 0), (sx_ + 300, 0), (sx_ - 100, H), (sx_ - 400, H)]), P((240, 246, 255), 34 * (1 - 0.6 * dark), MaskFilter=blur(60)))
    c.drawRect(skia.Rect(x0, -40, x1, 130), SH(lin((0, 0), (0, 130), [(20, 22, 56, 255), (50, 50, 96, 200), (90, 100, 150, 0)], [0, 0.6, 1]), MaskFilter=blur(22)))
    _bokeh(c, t, [(255, 196, 110), (100, 120, 210)], -20, 70, 9, 7)
    c.restore()


_PCURVE = [(120, 800), (260, 720), (400, 600), (500, 470), (600, 400), (720, 390), (820, 450)]
_SCURVE = [(130, 380), (250, 440), (380, 560), (480, 700), (590, 770), (720, 760), (830, 690)]
_CCURVE = [(150, 250), (240, 380), (360, 500), (470, 640), (600, 730), (720, 740), (840, 680)]


def macro_pencil(c, t, u, flakes=0.0):
    """MACRO: the pencil's graphite point drawing a soft gray line on paper. Full frame, no hand: the pencil enters from the
    top edge (its body runs up and a little left, toward the hand that is out of frame). u 0..1 moves the tip along a curve
    from (120, 800) up to (820, 450); the line ends exactly at the contact. flakes 0..1: thin gray flakes shed at the contact
    and stay along the line. All the action sits at x < 860; an inset circle of radius up to 430 at (1380, 540) covers only
    empty paper. Returns the contact point."""
    _paper_bg(c, t)
    path = crom(_PCURVE, False, 0.3); F = samp('p', _PCURVE); px, py, tx, ty = F(u)
    if u > 0.002:
        ln = seg(path, 0, u)
        c.drawPath(ln, SP((84, 86, 100), 40, 12)); c.drawPath(ln, SP((84, 86, 102), 28, 200)); c.drawPath(ln, SP((62, 64, 80), 13, 110))
        rs = np.random.default_rng(12)                                                                             # the paper's tooth breaks the graphite up
        for i in range(700):
            fu = rs.uniform(0, 1); d_ = rs.uniform(-15, 15); r_ = rs.uniform(1.2, 3.4)
            if fu > u: continue
            qx, qy, qtx, qty = F(fu)
            c.drawCircle(qx - qty * d_, qy + qtx * d_, r_, P((240, 232, 214), 120))
    if flakes > 0.01:
        rs = np.random.default_rng(31)
        for i in range(150):
            fu = rs.uniform(0, 1); d_ = rs.normal(0, 26); al = rs.uniform(0, 6.3); r_ = rs.uniform(3.0, 10.0); born = rs.uniform(0, 1)
            if fu > u or born > flakes: continue
            qx, qy, qtx, qty = F(fu); age = min(1.0, (u - fu) * 14); x_, y_ = qx - qty * d_ * (0.4 + 0.6 * age), qy + qtx * d_ * (0.4 + 0.6 * age)
            fp = poly([(x_ + r_ * math.cos(al + k * 1.7) * (0.6 + 0.4 * ((i + k) % 2)), y_ + r_ * 0.6 * math.sin(al + k * 1.7)) for k in range(4)])
            c.drawPath(fp, P((40, 20, 40), 60, MaskFilter=blur(1.5))); c.drawPath(fp, P((70, 72, 90), 235)); c.drawLine(x_ - r_ * 0.3, y_ - r_ * 0.2, x_ + r_ * 0.2, y_ - r_ * 0.3, SP((160, 164, 186), 1.2, 200))
    ang = math.radians(-104) + 0.10 * tx + 0.03 * math.sin(t * 1.3)                                               # the body leans a little into the stroke
    c.save(); c.translate(46, 60)
    c.save(); c.translate(px, py); c.rotate(math.degrees(ang) - 90 + 14); c.drawRect(skia.Rect(-110, 90, 110, 1900), P((60, 40, 60), 70, MaskFilter=blur(30))); c.restore(); c.restore()
    c.drawOval(skia.Rect(px - 20, py - 8, px + 46, py + 22), P((40, 30, 50), 110, MaskFilter=blur(7)))
    _pencil(c, (px, py), ang, 1.6)
    return (px, py)


def macro_scribe(c, t, u, bite=0.0, lift=0.0):
    """MACRO: the scribe's diamond point scratching a bright thin line into brushed steel. Full frame, no hand: the scribe
    enters from the top edge. u 0..1 moves the point along a curve from (130, 380) to (830, 690); a fine curl of swarf and
    tiny glints sit at the contact; bite 0..1 adds bigger glints (for the line 'the diamond tip bites into the steel').
    lift 0..1: at 1 the point hovers about 60 px above its contact point (its soft shadow apart from it on the steel, no swarf,
    a glint on the diamond) and comes down to touch at 0, so a shot can open with the point arriving (keep u still meanwhile).
    All the action sits at x < 860 (an inset circle of radius up to 430 at (1380, 540) covers only steel). Returns the contact."""
    _steel_bg(c, t)
    path = crom(_SCURVE, False, 0.3); F = samp('s', _SCURVE); px, py, tx, ty = F(u)
    if u > 0.002:
        ln = seg(path, 0, u); off = skia.Path(ln); off.offset(2.0, 3.0)
        c.drawPath(off, SP((30, 36, 72), 9, 210)); c.drawPath(ln, SP((200, 220, 255), 24, 34)); c.drawPath(ln, SP((240, 247, 255), 7))
        rs = np.random.default_rng(17)
        for i in range(36):                                                                                        # burrs thrown up along the scratch
            fu = rs.uniform(0, 1); d_ = rs.choice([-1, 1]) * rs.uniform(7, 13); l_ = rs.uniform(6, 18)
            if fu > u: continue
            qx, qy, qtx, qty = F(fu); c.drawLine(qx - qty * d_, qy + qtx * d_, qx - qty * d_ + qtx * l_, qy + qtx * d_ + qty * l_, SP((226, 236, 255), 2.4, 180))
    # swarf: a fine curl leaving the point
    sw = skia.Path(); n = 26
    for i in range(n):
        a_ = i * 0.55 + t * 2.0; r_ = 8 + i * 1.5; q = (px - 34 - i * 2.2 + r_ * math.cos(a_) * 0.6, py - 14 - i * 0.8 + r_ * math.sin(a_) * 0.6)
        sw.moveTo(*q) if i == 0 else sw.lineTo(*q)
    lift = max(0.0, min(1.0, lift)); down = 1 - sm(lift / 0.12)
    if u > 0.01 and down > 0.01: c.drawPath(sw, SP((40, 46, 80), 6, 120 * down)); c.drawPath(sw, SP((226, 234, 252), 3.6, 255 * down))
    ang = math.radians(-108) + 0.08 * tx
    cx_, cy_ = px, py                                                                                              # the contact point on the steel
    px, py = px + math.cos(ang) * 60 * lift, py + math.sin(ang) * 60 * lift                                       # the point itself, lifted back along the tool
    if lift > 0.01:
        c.drawOval(skia.Rect(cx_ - 8 - 26 * lift, cy_ - 6 - 6 * lift, cx_ + 30 + 40 * lift, cy_ + 12 + 10 * lift), P((14, 16, 50), 150 - 60 * lift, MaskFilter=blur(5 + 12 * lift)))
    c.save(); c.translate(px + 40, py + 54); c.rotate(math.degrees(ang) - 90 + 12); c.drawRect(skia.Rect(-76, 100, 76, 1900), P((14, 16, 50), 90, MaskFilter=blur(28))); c.restore()
    _scribe(c, (px, py), ang, 1.75)
    g = 0.5 + 0.5 * math.sin(t * 17) * math.sin(t * 5.3)
    bite = bite * down
    c.drawCircle(px, py, 26 + 14 * bite, P((200, 230, 255), 50 + 50 * bite, MaskFilter=blur(14), BlendMode=skia.BlendMode.kPlus))
    _star(c, px - 6, py + 4, 16 + 8 * g + 16 * bite, 0.55 + 0.45 * g)
    rs = np.random.default_rng(int(t * 12) + 5)
    for i in range(int((3 + int(5 * bite)) * down)): _star(c, px + rs.uniform(-70, 24), py + rs.uniform(-10, 50), rs.uniform(5, 10) * (1 + 0.6 * bite), rs.uniform(0.3, 0.9))
    return (cx_, cy_)


def macro_pair(c, t):
    """MACRO: the two tips side by side and still. Left half: the pencil's graphite point on paper (tip at (480, 430), the
    pencil enters from the bottom edge). Right half: the scribe's diamond point on brushed steel (tip at (1440, 430), entering
    from the bottom edge). Nothing above y 260 but paper and steel, so a label fits over each tip (about (480, 180) and
    (1440, 180)). Returns dict(pencil=(480, 430), diamond=(1440, 430))."""
    _paper_bg(c, t, 0, 960); _steel_bg(c, t, 960, W)
    c.drawRect(skia.Rect(948, 0, 972, H), P((14, 16, 40), 150, MaskFilter=blur(8))); c.drawRect(skia.Rect(957, 0, 963, H), P((20, 24, 56)))
    b = 2.0 * math.sin(t * 0.8)
    for tip, ang, kind in (((480, 430), math.radians(98), 'p'), ((1440, 430), math.radians(82), 's')):
        c.save(); c.translate(tip[0] + 44, tip[1] + 40); c.rotate(math.degrees(ang) - 90 + 6); c.drawRect(skia.Rect(-100, 70, 100, 1500), P((30, 24, 56), 80, MaskFilter=blur(30))); c.restore()
        if kind == 'p': _pencil(c, (tip[0], tip[1] + b), ang, 1.45, worn=True)
        else:
            _scribe(c, (tip[0], tip[1] - b), ang, 2.5)
            g = 0.5 + 0.5 * math.sin(t * 3.1); _star(c, tip[0] - 10, tip[1] + 26 - b, 20 + 12 * g, 0.5 + 0.5 * g)
    return dict(pencil=(480, 430), diamond=(1440, 430))


def _cut_kerf(c, path, u, hot, t):
    """the macro kerf: a narrow dark gap through the plate with a thin bright bevel along one side, its newest stretch glowing
    (white hot at the cut, then yellow, orange, dull red), and cooled dark with rough beads of slag farther back"""
    if u <= 0.002: return
    sg_ = seg(path, 0, u)
    bev = skia.Path(sg_); bev.offset(-5.0, -6.0); c.drawPath(bev, SP((186, 198, 232), 4.0, 150))                   # the lit bevel on the upper left edge
    low = skia.Path(sg_); low.offset(4.0, 5.0); c.drawPath(low, SP((16, 16, 34), 5.0, 150))                        # the shaded lower edge
    c.drawPath(sg_, SP((6, 6, 14), 13.0))                                                                          # the gap: you see the dark behind the plate
    c.drawPath(sg_, SP((36, 30, 44), 3.0, 120))
    F = lambda uu: at(path, uu)
    rs = np.random.default_rng(41)
    for i in range(70):                                                                                            # slag: rough dark beads clinging to the lower edge, only where it has cooled
        fu = rs.uniform(0, 1); r_ = rs.uniform(2.5, 6.5); d_ = rs.uniform(7, 12); j = rs.uniform(-3, 3)
        if fu > u - 0.03: continue
        (qx, qy), (qtx, qty) = F(fu); age = min(1.0, (u - fu) / 0.2)
        col = mix((255, 150, 50), (44, 38, 52), age) if hot > 0.01 else (44, 38, 52)
        c.drawCircle(qx - qty * d_ + j, qy + qtx * d_ + j, r_, P(col)); c.drawCircle(qx - qty * d_ + j - r_ * 0.3, qy + qtx * d_ + j - r_ * 0.3, r_ * 0.35, P((150, 150, 180), 110))
    if hot <= 0.01: return
    span = 0.2; PL = skia.BlendMode.kPlus
    for a0, col, al, wd in ((0.0, (120, 20, 16), 170, 20), (0.35, (226, 76, 20), 210, 17), (0.65, (255, 160, 44), 235, 14), (0.88, (255, 244, 200), 255, 11)):
        u0 = max(0.0, u - span * (1 - a0)); pth = seg(path, u0, u)
        c.drawPath(pth, skia.Paint(AntiAlias=True, Color=C(col, al * hot), Style=skia.Paint.kStroke_Style, StrokeWidth=wd, StrokeCap=skia.Paint.kRound_Cap, BlendMode=PL))
    c.drawPath(seg(path, max(0.0, u - span * 0.8), u), skia.Paint(AntiAlias=True, Color=C((255, 120, 40), 60 * hot), Style=skia.Paint.kStroke_Style, StrokeWidth=60, StrokeCap=skia.Paint.kRound_Cap, MaskFilter=blur(18), BlendMode=PL))


def _cut_head(c, tipn, na, glow=1.0):
    """the cutting torch head for the macro, the same parts and colours as the torch in her hands (cast._torch): a short
    tapered COPPER nozzle, the BRASS head it screws into, and the gas tubes and oxygen tube running back out of the top edge"""
    BR, BR_SH, BR_HI = (214, 168, 78), (150, 104, 58), (255, 228, 150); ST, ST_SH, ST_HI = (170, 178, 196), (108, 116, 142), (236, 240, 250)
    CU, CU_SH, CU_HI = (206, 122, 78), (140, 76, 60), (255, 196, 150); PL = skia.BlendMode.kPlus
    c.save(); c.translate(*tipn); c.rotate(math.degrees(na) + 180)                                                 # local +x runs back up the nozzle
    c.save(); c.translate(250, 0); c.rotate(-34)                                                                   # the tubes leave the head at the bend, up toward the top edge
    for v0, w_ in ((-30, 22), (0, 18), (30, 22)):
        c.drawRect(skia.Rect(30, v0 - w_ / 2, 2200, v0 + w_ / 2), P(ST)); c.drawRect(skia.Rect(30, v0 - w_ / 2, 2200, v0 - w_ / 2 + w_ * 0.36), P(ST_SH)); c.drawRect(skia.Rect(30, v0 + w_ * 0.18, 2200, v0 + w_ * 0.34), P(ST_HI, 220))
    c.restore()
    hd = skia.Path(); hd.moveTo(150, -40); hd.lineTo(232, -52); hd.cubicTo(300, -62, 330, -30, 318, 10); hd.cubicTo(312, 44, 270, 56, 232, 52); hd.lineTo(150, 40); hd.close()      # the brass head
    c.drawPath(hd, P(BR)); c.save(); c.clipPath(hd, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(140, -70, 340, -22), P(BR_SH)); c.drawRect(skia.Rect(140, 24, 340, 36), P(BR_HI, 230)); c.restore()
    c.drawRect(skia.Rect(132, -46, 156, 46), P(BR_SH)); c.drawRect(skia.Rect(132, 26, 156, 46), P(BR)); c.drawRect(skia.Rect(132, 30, 156, 37), P(BR_HI, 200))         # the nut that holds the nozzle
    for k_ in range(3): c.drawLine(138 + k_ * 7, -46, 138 + k_ * 7, 46, SP((110, 74, 48), 2, 160))
    nz = poly([(0, -15), (132, -32), (132, 32), (0, 15)]); c.drawPath(nz, P(CU)); c.drawPath(poly([(0, -15), (132, -32), (132, -10), (0, -4)]), P(CU_SH)); c.drawLine(4, 11, 130, 25, SP(CU_HI, 5, 230))   # the copper nozzle
    c.drawRect(skia.Rect(0, -15, 8, 15), P((90, 50, 46)))
    if glow > 0.01: c.drawPath(poly([(0, -15), (40, -20), (40, 20), (0, 15)]), P((255, 190, 110), 150 * glow, BlendMode=PL))
    c.restore()


def macro_cut(c, t, u, k=1.0):
    """MACRO: the cutting flame on the steel plate, along the scratched line. Full frame, no hand: the torch head (a copper
    nozzle in a brass head, its tubes running back out of the top edge) comes down above the cut and points at it. u 0..1
    moves the cut along a curve from (150, 250) to (840, 680): a white hot spot, a kerf behind it (a narrow dark gap with a
    bright bevel, glowing orange then dull red, cooling to dark with beads of slag), sparks thrown out below the cut and falling
    with gravity, heat shimmer above. k: 1.0 is the cut. Below 1 it is the LIGHTING moment, with no cutting yet (keep u still):
    about 0.3 a soft yellow sooty flame from the nozzle held a little off the plate, no sparks; the flame tightens to the blue
    white cone and the nozzle comes down as k goes to 1. All the action sits at x < 900 (an inset circle of radius up to 430 at
    (1380, 540) covers only steel; a few sparks may cross under it). Returns the cut point."""
    k = max(0.0, min(1.0, k)); kc = sm((k - 0.75) / 0.25)                                                          # kc: how much it is really cutting
    _steel_bg(c, t, dark=0.25 + 0.45 * sm(k / 0.4))
    path = crom(_CCURVE, False, 0.3); (px, py), (tx, ty) = at(path, u); PLs = skia.BlendMode.kPlus
    warm = (255, 170, 70) if k < 0.6 else (255, 150, 60)
    c.drawRect(skia.Rect(0, 0, W, H), SH(rad((px, py), 1200, [warm + (int(150 * (0.35 * sm(k / 0.2) + 0.65 * kc)),), (255, 110, 50, int(60 * kc + 30 * sm(k / 0.2))), (255, 90, 40, 0)], [0, 0.4, 1]), BlendMode=skia.BlendMode.kScreen))
    off = skia.Path(path); off.offset(1.5, 2.5); c.drawPath(off, SP((14, 16, 40), 4, 180)); c.drawPath(path, SP((214, 226, 250), 3.4, 230))     # the scratched guide line, still bright ahead of the cut
    if kc > 0.02: _cut_kerf(c, path, u, kc, t)                                                                  # no kerf while she is only lighting it
    if kc > 0.02:
        for i in range(5):                                                                                         # heat shimmer: soft warm air rising from the spot
            ph = (t * 0.5 + i * 0.2) % 1.0
            c.drawOval(skia.Rect(px - 40 + 26 * math.sin(t * 2 + i) - 30 * ph, py - 80 - 300 * ph, px + 50 + 26 * math.sin(t * 2 + i) + 30 * ph, py - 300 * ph), P((255, 200, 150), 34 * (1 - ph) * kc, MaskFilter=blur(26), BlendMode=PLs))
        rs = np.random.default_rng(3)                                                                              # sparks: thrown down and to the right of the cut, falling
        for i in range(int(130 * kc)):
            life = rs.uniform(0.45, 1.1); ph = rs.uniform(0, 1); a0 = math.radians(rs.uniform(-10, 150)); v = rs.uniform(400, 1300); age = ((t / life) + ph) % 1.0; ta = age * life
            vx, vy = v * math.cos(a0), v * math.sin(a0)
            x_ = px + vx * ta; y_ = py + vy * ta + 900 * ta * ta; dx, dy = vx, vy + 1800 * ta; dl = math.hypot(dx, dy) or 1; ln_ = 16 + 44 * (1 - age)
            col = mix((255, 250, 210), (255, 120, 30), age)
            c.drawLine(x_, y_, x_ - dx / dl * ln_, y_ - dy / dl * ln_, skia.Paint(AntiAlias=True, Color=C(col, 255 * (1 - age) ** 0.7), Style=skia.Paint.kStroke_Style, StrokeWidth=4.2 * (1 - 0.5 * age), StrokeCap=skia.Paint.kRound_Cap, BlendMode=PLs))
    # the head and its flame: it comes down from the top edge, leaning a little; while lighting it is held off the plate
    na = math.radians(100); back = 78 + 150 * (1 - sm((k - 0.3) / 0.6)); tipn = (px - back * math.cos(na), py - back * math.sin(na))
    c.save(); c.translate(tipn[0] + 60, tipn[1] + 70); c.rotate(math.degrees(na) + 180); c.drawRect(skia.Rect(0, -40, 330, 40), P((10, 10, 34), 80, MaskFilter=blur(26))); c.restore()
    flame(c, tipn, na, 1.5, k, t)
    if kc > 0.02: c.drawCircle(px, py, 46, P((255, 214, 150), 190 * kc, MaskFilter=blur(20), BlendMode=PLs)); c.drawCircle(px, py, 15, P((255, 255, 240), 255 * kc, MaskFilter=blur(4)))
    _cut_head(c, tipn, na, glow=sm(k / 0.3))
    return (px, py)


# ------------------------------------------------------------------ 7. the town square at sunrise
SUN = (1640, 405)
GROUND_Y = 760          # where the house fronts meet the cobbles


def _house(c, x0, x1, top, col, roof=(150, 84, 66), wins=3, floors=2, shutter=(70, 110, 96), door=None, haze=0.0, seed=1):
    HZ = (246, 196, 160); col = mix(col, HZ, haze); roof = mix(roof, HZ, haze); shutter = mix(shutter, HZ, haze)
    SHc = mix(col, (70, 60, 110), 0.34); g = GROUND_Y
    c.drawRect(skia.Rect(x0, top, x1, g), SH(lin((0, top), (0, g), [col, mix(col, HZ, 0.3 + 0.3 * haze)])))
    c.drawRect(skia.Rect(x0, top, x0 + (x1 - x0) * 0.16, g), P(SHc, 70))                                           # each front turns a little from the sun at its left
    c.drawRect(skia.Rect(x1 - 5, top, x1, g), P(mix(col, (255, 230, 180), 0.6)))                                    # sunlit right corner
    c.drawPath(poly([(x0 - 12, top + 6), (x0 + 14, top - 46), (x1 - 14, top - 46), (x1 + 12, top + 6)]), P(roof)); c.drawPath(poly([(x0 - 12, top + 6), (x1 + 12, top + 6), (x1 + 12, top - 2), (x0 - 12, top - 2)]), P(mix(roof, (60, 30, 60), 0.4)))
    c.drawLine(x0 + 14, top - 46, x1 - 14, top - 46, SP(mix(roof, (255, 220, 170), 0.6), 3))
    cw = x1 - x0 - 36; ww_ = min(46, cw / wins * 0.5); fh = (g - top - 120) / floors
    for f_ in range(floors):
        for i in range(wins):
            wx = x0 + 18 + (i + 0.5) * cw / wins; wy = top + 34 + f_ * fh; wh = min(fh * 0.62, 92)
            c.drawRect(skia.Rect(wx - ww_ / 2 - 5, wy - 5, wx + ww_ / 2 + 5, wy + wh + 7), P(mix(col, (255, 244, 220), 0.5)))
            lit = ((seed * 7 + i * 3 + f_ * 5) % 9 == 0)
            c.drawRect(skia.Rect(wx - ww_ / 2, wy, wx + ww_ / 2, wy + wh), P((255, 214, 130) if lit else mix((58, 66, 104), HZ, haze * 0.6)))
            c.drawLine(wx, wy, wx, wy + wh, SP(mix(col, (255, 244, 220), 0.5), 2.5)); c.drawLine(wx - ww_ / 2, wy + wh * 0.5, wx + ww_ / 2, wy + wh * 0.5, SP(mix(col, (255, 244, 220), 0.5), 2.5))
            if (i + f_ + seed) % 2 == 0:
                for sx in (-1, 1): c.drawRect(skia.Rect(wx + sx * (ww_ / 2 + 3), wy - 2, wx + sx * (ww_ / 2 + 3 + ww_ * 0.44), wy + wh + 2), P(shutter))
            c.drawRect(skia.Rect(wx - ww_ / 2 - 8, wy + wh + 5, wx + ww_ / 2 + 8, wy + wh + 11), P(SHc))
    dx = door if door is not None else (x0 + x1) / 2
    dp = skia.Path(); dp.moveTo(dx - 30, g); dp.lineTo(dx - 30, g - 78); dp.cubicTo(dx - 30, g - 116, dx + 30, g - 116, dx + 30, g - 78); dp.lineTo(dx + 30, g); dp.close()
    c.drawPath(dp, P(mix((70, 48, 56), HZ, haze * 0.5))); c.drawPath(dp, SP(mix(col, (255, 244, 220), 0.5), 5)); c.drawCircle(dx + 16, g - 50, 3.5, P((230, 190, 110)))


def _square_static(c):
    # sky
    c.drawRect(skia.Rect(-200, -200, W + 200, GROUND_Y), SH(lin((0, 0), (0, GROUND_Y), [(120, 158, 214), (176, 196, 226), (250, 208, 170), (255, 188, 132)], [0, 0.4, 0.74, 1])))
    c.drawCircle(SUN[0], SUN[1], 900, SH(rad(SUN, 900, [(255, 232, 170, 210), (255, 200, 130, 70), (255, 190, 120, 0)], [0, 0.4, 1])))
    for i, (cx, cy, wd) in enumerate(((1380, 250, 520), (1680, 330, 360), (980, 420, 300))):
        c.drawOval(skia.Rect(cx - wd / 2, cy - 7, cx + wd / 2, cy + 7), P((255, 220, 190), 120, MaskFilter=blur(6)))
    # far roofs in the haze
    far = [(-200, 560), (60, 520), (150, 470), (240, 520), (430, 500), (520, 440), (560, 380), (600, 440), (760, 500), (980, 480), (1120, 520), (1500, 500), (1700, 540), (W + 200, 520), (W + 200, GROUND_Y), (-200, GROUND_Y)]
    c.drawPath(poly(far), P((226, 180, 160)))
    # the row of house fronts
    rows = [(120, 360, 410, (206, 150, 112), 3, 2, (96, 74, 70), 5), (360, 590, 366, (226, 204, 168), 3, 2, (110, 70, 62), 2), (590, 800, 420, (214, 166, 92), 3, 2, (70, 116, 96), 3),
            (800, 1010, 392, (150, 172, 198), 3, 2, (70, 96, 130), 4), (1010, 1210, 430, (212, 132, 98), 3, 2, (60, 112, 104), 6), (1410, 1640, 400, (198, 150, 110), 3, 2, (84, 100, 90), 7)]
    for x0, x1, top, col, wn, fl_, shc, sd in rows: _house(c, x0, x1, top, col, wins=wn, floors=fl_, shutter=shc, haze=0.22, seed=sd)
    # the clock tower
    tx0, tx1, ttop = 1230, 1390, 150; TW, TW_SH, TW_HI = (214, 194, 170), (160, 140, 144), (255, 236, 200)
    c.drawRect(skia.Rect(tx0, ttop + 110, tx1, GROUND_Y), SH(lin((0, ttop), (0, GROUND_Y), [TW, mix(TW, (246, 196, 160), 0.4)])))
    c.drawRect(skia.Rect(tx0, ttop + 110, tx0 + 46, GROUND_Y), P(TW_SH, 120)); c.drawRect(skia.Rect(tx1 - 7, ttop + 110, tx1, GROUND_Y), P(TW_HI))
    for yy in (ttop + 260, ttop + 420): c.drawRect(skia.Rect(tx0 - 8, yy, tx1 + 8, yy + 12), P(TW_SH)); c.drawRect(skia.Rect(tx0 - 8, yy, tx1 + 8, yy + 4), P(TW_HI))
    c.drawRect(skia.Rect(tx0 - 10, ttop + 96, tx1 + 10, ttop + 114), P(TW_SH)); c.drawRect(skia.Rect(tx0 + 6, ttop - 6, tx1 - 6, ttop + 100), P(TW)); c.drawRect(skia.Rect(tx0 + 6, ttop - 6, tx0 + 40, ttop + 100), P(TW_SH, 120))
    bell = skia.Path(); bell.moveTo(tx0 + 50, ttop + 96); bell.lineTo(tx0 + 50, ttop + 40); bell.cubicTo(tx0 + 50, ttop + 2, tx1 - 50, ttop + 2, tx1 - 50, ttop + 40); bell.lineTo(tx1 - 50, ttop + 96); bell.close()
    c.drawPath(bell, P((96, 90, 124))); c.drawPath(crom([(1296, 228), (1302, 196), (1318, 196), (1324, 228)], True, 0.3), P((196, 150, 80)))
    c.drawPath(poly([(tx0 - 14, ttop - 2), (1310, ttop - 78), (tx1 + 14, ttop - 2)]), P((150, 84, 66))); c.drawPath(poly([(1310, ttop - 78), (tx1 + 14, ttop - 2), (1330, ttop - 2)]), P((200, 120, 80))); c.drawLine(1310, ttop - 78, 1310, ttop - 108, SP((90, 70, 80), 4))
    c.drawCircle(1310, ttop + 190, 50, P(TW_SH)); c.drawCircle(1310, ttop + 190, 43, P((250, 244, 228)))
    for k in range(12): a_ = k * math.pi / 6; c.drawLine(1310 + 34 * math.sin(a_), ttop + 190 - 34 * math.cos(a_), 1310 + 40 * math.sin(a_), ttop + 190 - 40 * math.cos(a_), SP((70, 60, 80), 2.5))
    c.drawLine(1310, ttop + 190, 1310, ttop + 222, SP((50, 44, 66), 5)); c.drawLine(1310, ttop + 190, 1310 + 5, ttop + 156, SP((50, 44, 66), 3.5)); c.drawCircle(1310, ttop + 190, 4.5, P((50, 44, 66)))     # six o'clock and a few minutes
    for yy in (ttop + 300, ttop + 470): c.drawRRect(rr(1298, yy, 1322, yy + 54, 10), P((96, 90, 124)))
    dp = skia.Path(); dp.moveTo(1274, GROUND_Y); dp.lineTo(1274, GROUND_Y - 90); dp.cubicTo(1274, GROUND_Y - 136, 1346, GROUND_Y - 136, 1346, GROUND_Y - 90); dp.lineTo(1346, GROUND_Y); dp.close(); c.drawPath(dp, P((84, 60, 66)))
    # haze at the foot of the row, then the near side buildings that frame the square
    c.drawRect(skia.Rect(-200, 560, W + 200, GROUND_Y + 10), SH(lin((0, 560), (0, GROUND_Y), [(255, 214, 170, 0), (255, 214, 170, 120)])))
    c.drawRect(skia.Rect(-200, -200, 150, GROUND_Y + 30), SH(lin((0, 200), (0, GROUND_Y), [(150, 82, 70), (120, 66, 72)])))
    c.drawPath(poly([(-200, 150), (176, 250), (176, 262), (-200, 170)]), P((92, 50, 60)))
    for wy in (330, 520):
        for wx in (10, 96): c.drawRect(skia.Rect(wx - 26, wy, wx + 26, wy + 100), P((58, 44, 70))); c.drawRect(skia.Rect(wx - 44, wy - 4, wx - 28, wy + 104), P((90, 60, 66))); c.drawRect(skia.Rect(wx + 28, wy - 4, wx + 44, wy + 104), P((90, 60, 66)))
    c.drawRect(skia.Rect(143, 262, 150, GROUND_Y + 30), P((255, 196, 140)))
    c.drawRect(skia.Rect(1720, -200, W + 200, GROUND_Y + 40), SH(lin((0, 200), (0, GROUND_Y), [(96, 62, 78), (80, 54, 76)])))
    c.drawPath(poly([(1694, 300), (W + 200, 200), (W + 200, 222), (1694, 314)]), P((66, 40, 60)))
    for wy in (380, 560):
        for wx in (1790, 1876): c.drawRect(skia.Rect(wx - 26, wy, wx + 26, wy + 96), P((46, 38, 66))); c.drawRect(skia.Rect(wx - 44, wy - 4, wx - 28, wy + 100), P((60, 84, 80)))
    # cobbles: rows that grow toward the camera, long light from the right, long shadows to the left
    c.drawRect(skia.Rect(-200, GROUND_Y, W + 200, H + 200), SH(lin((0, GROUND_Y), (0, H), [(214, 170, 140), (160, 124, 124), (112, 90, 110)], [0, 0.4, 1])))
    rs = np.random.default_rng(14); y = GROUND_Y + 2; rh = 9.0
    while y < H + 200:
        c.drawLine(-200, y, W + 200, y, SP((90, 66, 92), max(1.2, rh * 0.09), 120)); k = (y - GROUND_Y) / 320 + 0.25; wd = 70 * k; x = -200 - rs.uniform(0, wd)
        while x < W + 200:
            c.drawLine(x, y, x, y + rh, SP((90, 66, 92), max(1.2, rh * 0.09), 110))
            if rs.uniform() < 0.3: c.drawRect(skia.Rect(x + 2, y + 1, x + wd - 2, y + rh - 1), P((255, 226, 190) if rs.uniform() < 0.5 else (80, 60, 96), 26))
            x += wd * rs.uniform(0.8, 1.25)
        y += rh; rh *= 1.13
    c.drawPath(poly([(1720, GROUND_Y), (W + 200, GROUND_Y), (W + 200, H + 200), (700, H + 200)]), P((60, 44, 86), 110, MaskFilter=blur(18)))           # the right building's long shadow
    c.drawPath(poly([(1230, GROUND_Y), (1390, GROUND_Y), (560, H + 200), (60, H + 200)]), P((70, 50, 90), 60, MaskFilter=blur(20)))                    # the tower's shadow
    c.drawPath(poly([(1400, GROUND_Y), (1720, GROUND_Y), (1500, H + 200), (700, H + 200)]), P((255, 220, 160), 60, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))   # the sun's lane across the square
    c.drawRect(skia.Rect(-200, GROUND_Y - 6, W + 200, GROUND_Y + 60), SH(lin((0, GROUND_Y - 6), (0, GROUND_Y + 60), [(255, 220, 180, 120), (255, 220, 180, 0)])))


def square_back(c, t, sun=1.0):
    """the town square at sunrise: sky, the sun low behind the roofs at screen right (x 1640, y 405) with soft rays, a row of
    house fronts with shutters, a clock tower at x 1230..1390 (just after six), bunting that sways, birds, cobbles with long
    shadows falling to the left, haze at the foot of the houses. The house fronts meet the cobbles at y 760. sun 0..1 dims
    the sun, the rays and the warm light (1 = full sunrise). The sky above y 300 from x 120 to 1150 stays clear."""
    _blit(c, 'square', _square_static)
    if sun < 0.99: c.drawRect(skia.Rect(0, 0, W, H), P((40, 44, 96), 120 * (1 - sun)))
    PLs = skia.BlendMode.kScreen
    c.save(); c.clipRect(skia.Rect(0, 0, W, GROUND_Y - 150))
    c.drawCircle(SUN[0], SUN[1], 150, P((255, 226, 160), 150 * sun, MaskFilter=blur(60), BlendMode=PLs)); c.drawCircle(SUN[0], SUN[1], 58, P((255, 248, 220), 255 * sun))
    c.restore()
    _house(c, 1560, 1730, 468, (176, 120, 100), wins=2, floors=2, shutter=(70, 100, 96), haze=0.1, seed=9)       # the house the sun rises behind
    for k, (a0, wd, al) in enumerate(((168, 4, 30), (180, 5, 26), (192, 3, 30), (206, 5, 22), (150, 4, 26), (222, 4, 18), (136, 3, 20), (120, 4, 16))):
        a_ = math.radians(a0 + 1.6 * math.sin(t * 0.4 + k)); w_ = math.radians(wd); L = 1900
        c.drawPath(poly([SUN, (SUN[0] + L * math.cos(a_ - w_), SUN[1] + L * math.sin(a_ - w_)), (SUN[0] + L * math.cos(a_ + w_), SUN[1] + L * math.sin(a_ + w_))]), P((255, 226, 170), al * sun * (0.75 + 0.25 * math.sin(t * 0.8 + k * 2)), MaskFilter=blur(8), BlendMode=PLs))
    # bunting between the tower and the houses (kept below y 300 at the left)
    cols = [(240, 110, 96), (255, 198, 87), (63, 194, 169), (110, 150, 232), (246, 240, 228)]
    for (x0, y0), (x1, y1), sag in (((1230, 330), (600, 400), 60), ((1390, 320), (1720, 330), 46), ((600, 400), (150, 380), 50)):
        pts = []
        for i in range(25):
            u = i / 24; pts.append((x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u) + 3 * math.sin(t * 1.3 + u * 9)))
        c.drawPath(poly(pts, False), SP((90, 70, 90), 2, 200))
        for i in range(0, 24):
            (ax, ay), (bx, by) = pts[i], pts[i + 1]; fl_ = 5 * math.sin(t * 2.2 + i * 1.3)
            c.drawPath(poly([(ax + 2, ay), (bx - 2, by), ((ax + bx) / 2 + fl_, (ay + by) / 2 + 24)]), P(cols[i % 5]))
    # birds over the roofs at the right
    for i, (bx, by, sp) in enumerate(((1460, 250, 16), (1540, 210, 13), (1610, 270, 18), (1500, 300, 11))):
        x = bx + ((t * sp) % 300) - 60; y = by + 10 * math.sin(t * 0.7 + i) - ((t * sp) % 300) * 0.06; fp = math.sin(t * 7 + i * 2)
        c.drawPath(poly([(x - 16, y - 7 * fp), (x - 5, y), (x, y + 3), (x + 5, y), (x + 16, y - 7 * fp)], False), SP((70, 56, 80), 3.4))


def plinth(c, x=1100, ground=900, s=0.8):
    """a low stone plinth (two steps and a cap) lit from the right. (x, ground) is the middle of its base; its top is at
    ground - 176 s and is 300 s wide. Draw it before heron_statue and cover."""
    c.save(); c.translate(x, ground); c.scale(s, s)
    ST, ST_SH, ST_HI = (190, 168, 150), (126, 106, 122), (250, 226, 190)
    c.drawPath(poly([(-230, 14), (230, 14), (-420, 150), (-900, 150)]), P((60, 44, 86), 130, MaskFilter=blur(14)))           # long shadow to the left and toward the camera
    for x0, x1, y0, y1 in ((-230, 230, -34, 14), (-170, 170, -150, -34), (-190, 190, -176, -150)):
        c.drawRect(skia.Rect(x0, y0, x1, y1), P(ST)); c.drawRect(skia.Rect(x0, y0, x0 + (x1 - x0) * 0.3, y1), P(ST_SH, 150)); c.drawRect(skia.Rect(x1 - 8, y0, x1, y1), P(ST_HI)); c.drawRect(skia.Rect(x0, y0, x1, y0 + 5), P(ST_HI, 230)); c.drawRect(skia.Rect(x0, y1 - 6, x1, y1), P(ST_SH, 140))
    for bx in (-90, -10, 70): c.drawLine(bx, -146, bx, -38, SP(ST_SH, 2.5, 110))
    c.drawLine(-170, -92, 170, -92, SP(ST_SH, 2.5, 110))
    c.restore()


def heron_statue(c, t, x=1100, ground=900, s=0.8, a=1.0):
    """the finished steel heron: the cut plate silhouette (560 s tall, facing screen left), brushed steel, rim lit by the
    sunrise on its right edges, a glint that travels, standing on the plinth top (ground - 176 s). a = alpha."""
    if a <= 0.01: return
    by = ground - PLINTH_H * s; h = 560 * s; hp = heron_path(x, by, h)
    if a < 0.99: c.saveLayerAlpha(None, int(255 * a))
    sh = skia.Path(hp); m = skia.Matrix(); m.setSkew(1.5, 0, 0, by); m.postScale(1, -0.16, 0, by); sh.transform(m); sh.offset(-8 * s, 6 * s)
    c.drawPath(sh, P((60, 44, 86), 110, MaskFilter=blur(6)))
    c.drawPath(hp, SH(lin((x - h * 0.3, by - h), (x + h * 0.3, by), [(120, 130, 166), (88, 98, 138), (64, 70, 110)], [0, 0.55, 1])))
    c.save(); c.clipPath(hp, skia.ClipOp.kIntersect, True)
    c.drawImageRect(_noise(5, 'brush', 5), skia.Rect(0, 0, 400, 400), skia.Rect(x - h * 0.4, by - h, x + h * 0.4, by), LIN, skia.Paint(BlendMode=skia.BlendMode.kOverlay))
    inner = skia.Path(hp); inner.offset(-7 * s, 2 * s)
    rim = skia.Op(hp, inner, skia.PathOp.kDifference_PathOp)
    if rim: c.drawPath(rim, P((255, 226, 168))); c.drawPath(rim, P((255, 240, 200), 110, MaskFilter=blur(5 * s)))
    gx = x - h * 0.6 + ((t * 0.16) % 1.0) * h * 1.6
    c.drawPath(poly([(gx, by - h), (gx + 46 * s, by - h), (gx - 80 * s, by), (gx - 126 * s, by)]), P((255, 250, 235), 70, MaskFilter=blur(10 * s)))
    c.restore()
    if a < 0.99: c.restore()


def cover(c, t, x=1100, ground=900, s=0.8, pull=0.0):
    """the cloth cover over the statue and plinth (draw plinth, heron_statue, then this). pull 0: a tall draped shape with
    folds, its top over the heron's head, its hem on the cobbles. As pull goes to 1 the cloth SLIDES off toward SCREEN LEFT:
    its far (right) side lifts first and a trailing edge travels over the statue from right to left, so the heron appears only
    where the cloth has really left it; the part still on the statue clings and sags, its folds dragging toward the hand; then
    the last of it drops, overshoots a little and settles into a soft heap at the left foot of the plinth (about x - 300 s).
    Returns the screen point of the cloth the hand holds: (x - 262 s, ground - 300 s) at pull 0, moving in a straight line to
    (x - 375 s, ground - 250 s) at pull 0.6 and staying there (the hand keeps its hold; the rest lies on the ground). With the
    defaults that is (890, 660) to (800, 700)."""
    S = lambda px, py: (x + px * s, ground - py * s)
    e = lambda a_, b_: sm((pull - a_) / (b_ - a_))
    br = 3 * math.sin(t * 1.1)                                                # a little morning air in the cloth
    hx = -262 - 113 * e(0.0, 0.6); hy = 300 - 50 * e(0.0, 0.6); hand = S(hx, hy)
    CL, CL_SH, CL_HI, CL_DK = (236, 226, 208), (166, 152, 176), (255, 244, 214), (120, 108, 146)
    sl = e(0.04, 0.8)                                                          # the trailing edge's travel, right to left
    sag = e(0.25, 0.8)                                                         # the part still on the statue sinks as it is drawn off
    drop = e(0.62, 0.95)                                                       # the last of it falls
    heap = e(0.45, 0.95); settle = 1 + 0.22 * math.sin(math.pi * e(0.8, 1.0))  # the heap fills, overshoots and settles
    ky = (1 - 0.3 * sag) * (1 - 0.9 * drop)
    lean = -70 * sag                                                           # the top leans toward the pull
    V = lambda px, py: S(px + lean * (py / 770.0), py * ky)
    body = [V(-40, 770), V(130, 600), V(262, 260 + br), V(306, 50), V(300, 0), V(150, -8), V(0, -10), V(-160, -6), V(-310, 0), V(-304, 40 - 20 * drop),
            (hand[0] - 6 * s, hand[1] + 20 * s), (hand[0] - 4 * s, hand[1] - 16 * s), V(-190, 640)]
    hull = crom(body, True, 0.22)
    ex = 360 - 800 * sl                                                        # the trailing edge: a billowing curve leaning with the pull
    edge = [S(ex - 190, 900), S(ex - 150, 620), S(ex - 60 + 14 * math.sin(t * 2.3), 400), S(ex + 30, 190 + 10 * math.sin(t * 1.7 + 1)), S(ex + 20, 60), S(ex - 30, -40)]
    ep = crom(edge, False, 0.3)
    left = skia.Path(ep); left.lineTo(*S(-1400, -40)); left.lineTo(*S(-1400, 900)); left.close()
    on = skia.Op(hull, left, skia.PathOp.kIntersect_PathOp) if pull > 0.03 else hull
    if on is None: on = skia.Path()
    hp_ = None
    if heap > 0.02:                                                            # the heap at the plinth's left foot
        hh = 78 * heap * settle; hw_ = 150 + 40 * heap
        hp_ = crom([S(-300 - hw_, 0), S(-300 - hw_ * 0.7, hh * 0.55), S(-330, hh), S(-270, hh * 0.86), S(-300 + hw_ * 0.6, hh * 0.6), S(-300 + hw_, 0), S(-300, -10)], True, 0.3)
    cloth = skia.Path(on)
    if hp_ is not None:
        u_ = skia.Op(cloth, hp_, skia.PathOp.kUnion_PathOp)
        if u_ is not None: cloth = u_
        if e(0.0, 0.6) > 0.5 and drop < 0.98:                                  # the stretch of cloth between the fist and the heap
            tr = poly([(hand[0] - 4 * s, hand[1] - 10 * s), (hand[0] + 16 * s, hand[1] + 6 * s), S(-250, 30 * heap), S(-390, 20 * heap)])
            u_ = skia.Op(cloth, tr, skia.PathOp.kUnion_PathOp)
            if u_ is not None: cloth = u_
    elif pull > 0.03:
        pass
    if drop > 0.98 and hp_ is not None:
        tr = poly([(hand[0] - 5 * s, hand[1] - 10 * s), (hand[0] + 14 * s, hand[1] + 4 * s), S(-240, 40), S(-380, 30)])
        u_ = skia.Op(hp_, tr, skia.PathOp.kUnion_PathOp); cloth = u_ if u_ is not None else hp_
    # shadows on the cobbles
    if pull < 0.9: c.drawPath(poly([S(-310, 4), S(300 - 600 * sl, 4), S(-320 - 600 * sl * 0.3, -130), S(-870, -130)]), P((60, 44, 86), 90 * (1 - drop), MaskFilter=blur(14)))
    c.drawOval(skia.Rect(*S(-470 if heap > 0.3 else -320, 16), *S(max(-140.0, 310 - 620 * sl), -22)), P((50, 36, 80), 130, MaskFilter=blur(8)))
    c.drawPath(cloth, P(CL)); c.save(); c.clipPath(cloth, skia.ClipOp.kIntersect, True)
    ap = V(-40, 770)
    c.drawPath(poly([(ap[0] - 30 * s, ap[1] - 40 * s), (ap[0] - 700 * s, ap[1] - 40 * s), S(-620, -40), S(-40 + lean, -40)]), P(CL_SH, 150, MaskFilter=blur(16)))      # the side away from the sun
    c.drawPath(poly([V(120, 660), V(640, 660), V(600, -40), V(260, -40)]), P(CL_HI, 170 * (1 - sl), MaskFilter=blur(14)))
    if pull > 0.03 and drop < 0.98:                                            # the trailing edge: lit rim, soft shade just inside it
        ins = skia.Path(ep); ins.offset(-26 * s, 0); c.drawPath(ins, SP(CL_DK, 30 * s, 70, )); c.drawPath(ep, SP(CL_HI, 12 * s, 230))
    src = hand if pull > 0.02 else ap                                          # folds run from the apex, or drag toward the pulling hand
    ends = ((300, 10), (250, 130), (160, 6), (40, 4), (-90, 4), (-250, 6), (120, 540), (-212, 150), (40, 660), (220, 330))
    for i, (ex_, ey) in enumerate(ends):
        a0 = ap if (i % 2 == 0 and pull <= 0.3) or pull <= 0.02 else src; b0 = V(ex_ + 6 * math.sin(t * 0.9 + i), ey)
        mxy = ((a0[0] + b0[0]) / 2 + (18 - 5 * i) * s * (1 - sag), (a0[1] + b0[1]) / 2 + 30 * s * sag)
        f_ = skia.Path(); f_.moveTo(*a0); f_.quadTo(*mxy, *b0)
        c.drawPath(f_, SP(CL_DK, 5 * s, 90 * (1 - 0.6 * drop))); f2 = skia.Path(f_); f2.offset(5 * s, 0); c.drawPath(f2, SP(CL_HI, 3 * s, 130 * (1 - 0.6 * drop)))
    if heap > 0.2:
        hh = 78 * heap * settle
        for i in range(4):
            yy = (14 + i * 15) * heap; c.drawPath(crom([S(-440, yy * 0.5), S(-360, yy + 10 * heap), S(-290, yy + 2), S(-200, yy * 0.6)], False, 0.3), SP(CL_DK, 4 * s, 90 * heap))
        c.drawPath(crom([S(-420, hh * 0.5), S(-330, hh * 0.98), S(-250, hh * 0.8), S(-170, hh * 0.4)], False, 0.3), SP(CL_HI, 6 * s, 170 * heap))
    for k_ in range(3):                                                        # the bunch where the fist holds it
        an = -0.5 + 0.5 * k_; c.drawLine(hand[0] + 2 * s, hand[1], hand[0] + (60 * math.cos(an)) * s, hand[1] + (60 * math.sin(an) - 10) * s, SP(CL_DK, 4 * s, 110))
    c.restore()
    c.drawPath(cloth, SP(CL_HI, 2.5, 150))
    return hand


def cover_close(c, t, pull):
    """TIGHT SHOT of the pull, with NO person: the wide square shot enlarged 2.2 times about the cloth's corner, framed on the
    left half of the cloth and the plinth; the square behind is hazed and softened by distance. The corner of the cloth a fist
    holds is at about (620, 560) of the frame at pull 0 and travels down and left to about (422, 648) by pull 0.6, where it
    stays while the cloth slides off the heron and drops into its heap (bottom centre of the frame). Everything to the LEFT of
    the hold point is kept clear (sky, hazed house fronts, cobbles): draw the forearm and fist there with cast.hands_only(c,
    'cloth' or 'none', hold, ang, s about 1.1, ...) entering from the left frame edge, the fingers pointing along `dir`.
    Returns dict(hold=(x, y) in frame pixels, dir=(dx, dy) unit vector in which the cloth leaves the fist, toward the statue)."""
    Z = 2.2; hold0 = cover.__defaults__ and (STATUE['x'] - 262 * STATUE['s'], STATUE['ground'] - 300 * STATUE['s'])
    ox, oy = 620 - hold0[0] * Z, 560 - hold0[1] * Z
    c.save(); c.translate(ox, oy); c.scale(Z, Z)
    square_back(c, t)
    c.drawRect(skia.Rect(-100, -100, W + 100, GROUND_Y + 6), P((255, 226, 190), 70))                               # distance haze over the far house fronts
    c.drawRect(skia.Rect(-100, GROUND_Y - 30, W + 100, GROUND_Y + 60), SH(lin((0, GROUND_Y - 30), (0, GROUND_Y + 60), [(255, 220, 180, 0), (255, 220, 180, 90), (255, 220, 180, 0)], [0, 0.5, 1])))
    plinth(c); heron_statue(c, t)
    hold = cover(c, t, pull=pull)
    c.restore()
    hp = (ox + hold[0] * Z, oy + hold[1] * Z)
    e = sm(pull / 0.6); d = (math.cos(math.radians(-38 + 16 * e)), math.sin(math.radians(-38 + 16 * e)))
    return dict(hold=hp, dir=d)


def cart_close(c, t, u):
    """TIGHT SHOT for 'Ines rolls her cutting torch over to the steel', with no person: the top of the cart large in frame
    (the green OXYGEN and maroon ACETYLENE tank shoulders with their valves and gauges, the chain, the frame and the handle
    bar). u 0..1: the cart rolls toward SCREEN LEFT about 430 px and eases to a stop while the workshop wall passes behind
    with parallax; the gauge needles swing and the whole cart rocks a little as it stops, then settles. The handle's grip
    (a dark sleeve on the bar, about 46 px thick, rising gently toward the right) is where a fist goes: returns
    dict(handle=(x, y) its middle, ang=the bar's direction in radians (about +17 degrees, pointing down toward screen right),
    s=1.7, the scale to draw the hand at). At u = 1 the handle is at about (1050, 430). Nothing is drawn to the right of
    the handle except the wall, so a forearm can enter from the right frame edge: hands_only(c, 'none', wrist, ang_fingers,
    1.7, ...) with the fist closed over the grip (the bar passes through the fist at right angles to the fingers)."""
    u = max(0.0, min(1.0, u)); S_ = 1.7
    e = sm(u / 0.82) if u < 0.82 else 1.0; v = (1 - e) * e * 4                                                     # e: travel; v: speed bump
    stop = max(0.0, u - 0.8) / 0.2; ring = math.exp(-4.5 * stop) * math.sin(stop * 15.0) if u > 0.8 else 0.0      # follow through after the stop
    workshop_back(c, t, (560 - 170 * e, -140, 1.55), 1.0, 0.0)
    c.drawRect(skia.Rect(0, 0, W, H), P((10, 12, 34), 120))                                                        # the wall falls back so the cart and the grip stand clear
    x = 829 + 430 * (1 - e); ground = 430 + 730 * S_
    rock = math.radians(0.9 * ring - 0.5 * v)
    _WOB[0] = 0.35 * ring + 0.12 * v * math.sin(t * 9)
    c.save(); c.translate(x, ground); c.rotate(math.degrees(rock)); c.translate(-x, -ground)
    r = cart(c, t, x, ground, S_, roll=-(430 * (1 - e)) / (58 * S_))
    hx0, hy0 = r['handle']; a_ = math.atan2(22, 70); ux, uy = math.cos(a_), math.sin(a_)                         # a longer rubber grip on the bar, for the fist
    g0, g1 = (hx0 - ux * 120, hy0 - uy * 120), (hx0 + ux * 120, hy0 + uy * 120)
    c.drawLine(g0[0] + 5, g0[1] + 8, g1[0] + 5, g1[1] + 8, SP((6, 8, 26), 46, 110)); c.drawLine(*g0, *g1, SP((34, 36, 62), 46)); c.drawLine(g0[0] + uy * 13, g0[1] - ux * 13, g1[0] + uy * 13, g1[1] - ux * 13, SP((96, 102, 150), 7, 200))
    for k_ in range(-5, 6): c.drawLine(hx0 + ux * k_ * 20 + uy * 20, hy0 + uy * k_ * 20 - ux * 20, hx0 + ux * k_ * 20 - uy * 20, hy0 + uy * k_ * 20 + ux * 20, SP((20, 22, 44), 3, 150))
    c.restore(); _WOB[0] = 0.0
    hx, hy = r['handle']; dx, dy = hx - x, hy - ground; cr, sr = math.cos(rock), math.sin(rock)
    return dict(handle=(x + dx * cr - dy * sr, ground + dx * sr + dy * cr), ang=math.atan2(22, 70) + rock, s=S_)


# ------------------------------------------------------------------ tests
if __name__ == '__main__':
    import os, sys, time
    sys.path[:0] = ['/home/claude/lv']
    from places import finish
    os.makedirs('/tmp/shop', exist_ok=True)

    def save(name, fn, w=W, h=H):
        s = skia.Surface(w, h); fn(s.getCanvas()); s.makeImageSnapshot().save(f'/tmp/shop/{name}.png', skia.kPNG)

    def workshop(c, t=3.0, cam=(0, 0, 1.0), sketch=0.6, scribed=1.0, cut=0.35, glow=0.0):
        workshop_back(c, t, cam, 1.0, glow)
        c.save(); cam_apply(c, cam, 0.9); c.drawRRect(rr(STAND['x'] - 110, 235, STAND['x'] + 110, 1180, 60), P((120, 124, 140), 200)); c.restore()
        workshop_front(c, t, cam, sketch)
        c.save(); cam_apply(c, cam, 0.9); r = plate(c, t, scribed=scribed, cut=cut); k = cart(c, t, roll=0.4)
        c.drawCircle(*r['cut'], 6, P((0, 255, 0))); c.drawCircle(*k['handle'], 6, P((0, 255, 0))); c.drawCircle(*k['hose'], 6, P((255, 0, 255))); c.restore()
        finish(c, t, vig=0.2, warm=8)

    def two(fn):
        def f(c):
            for i, u in enumerate((0.2, 0.8)):
                s = skia.Surface(W, H); fn(s.getCanvas(), u); finish(s.getCanvas(), 2.0, vig=0.16)
                c.drawImageRect(s.makeImageSnapshot(), skia.Rect(i * 960, 0, i * 960 + 960, 540), LIN)
        return f

    def square(pull):
        def f(c, t=2.0):
            square_back(c, t); plinth(c); heron_statue(c, t)
            if pull < 1.5: hp = cover(c, t, pull=pull); c.drawCircle(*hp, 7, P((0, 200, 0)))
            c.drawRRect(rr(INES_SQ['x'] - 60, INES_SQ['ground'] - 525, INES_SQ['x'] + 60, INES_SQ['ground'], 30), P((120, 124, 140), 200))
            for tx_, tg, ts in TOWN: c.drawRRect(rr(tx_ - 36, tg - 315, tx_ + 36, tg, 20), P((120, 124, 140), 200))
            finish(c, t, vig=0.14, warm=12)
        return f

    def heron(c):
        c.clear(skia.Color(30, 36, 80)); c.drawPath(heron_path(500, 1040, 1000), P((200, 210, 236))); heron_stroke(c, 1400, 1040, 1000, 0.55, SP((255, 198, 87), 6))
        for u in (0, 0.25, 0.5, 0.75): (px, py), _ = heron_point(1400, 1040, 1000, u); c.drawCircle(px, py, 10, P((255, 80, 80))); K.text(c, str(u), px + 14, py, 30)

    what = sys.argv[1:] or ['all']
    A = 'all' in what
    if A or 'heron' in what: save('heron', heron)
    if A or 'workshop' in what:
        save('workshop', workshop); save('workshop_cam', lambda c: workshop(c, 5.0, (60, 20, 1.18), 1.0, 1.0, 0.7, 0.9))
    if A or 'macro' in what:
        save('macro_pencil', two(lambda c, u: macro_pencil(c, 2.0, u, flakes=u)), 1920, 540); save('macro_scribe', two(lambda c, u: macro_scribe(c, 2.0, u, bite=(u > 0.5) * 1.0)), 1920, 540)
        save('macro_cut', two(lambda c, u: macro_cut(c, 2.3, u)), 1920, 540)
        save('macro_pair', lambda c: (macro_pair(c, 2.0), finish(c, 2.0, vig=0.16)))
        save('macro_pencil_full', lambda c: (macro_pencil(c, 2.0, 0.7, 1.0), finish(c, 2.0, vig=0.16))); save('macro_cut_full', lambda c: (macro_cut(c, 2.3, 0.6), finish(c, 2.3, vig=0.2, warm=0)))
        save('macro_scribe_full', lambda c: (macro_scribe(c, 2.0, 0.6, 1.0), finish(c, 2.0, vig=0.16, warm=0)))
    if A or 'square' in what:
        save('square', square(0.0)); save('square_mid', square(0.45)); save('square_late', square(0.8)); save('square_open', square(2.0)); save('square_end', square(1.0))
    def strip(fn, vals, w=640, h=360):
        def f(c):
            for i, v_ in enumerate(vals):
                s_ = skia.Surface(W, H); fn(s_.getCanvas(), v_); finish(s_.getCanvas(), 2.0, vig=0.14)
                c.drawImageRect(s_.makeImageSnapshot(), skia.Rect(i * w, 0, i * w + w, h), LIN)
        return f, w * len(vals), h
    if A or 'new' in what:
        f, w_, h_ = strip(lambda c, k: macro_cut(c, 2.3, 0.06 if k < 1 else 0.55, k), (0.3, 0.6, 1.0), 960, 540); save('cut_k', f, w_, h_)
        f, w_, h_ = strip(lambda c, l: macro_scribe(c, 2.0, 0.05, 0.0, l), (1.0, 0.5, 0.0), 960, 540); save('scribe_lift', f, w_, h_)
        def sq(c, pl): square_back(c, 2.0); plinth(c); heron_statue(c, 2.0); cover(c, 2.0, pull=pl)
        f, w_, h_ = strip(sq, (0.0, 0.2, 0.4, 0.6, 0.8, 1.0)); save('cover_strip', f, w_, h_)
        def cc(c, pl):
            r_ = cover_close(c, 2.0, pl); c.drawCircle(*r_['hold'], 10, P((0, 200, 0))); c.drawLine(*r_['hold'], r_['hold'][0] + r_['dir'][0] * 80, r_['hold'][1] + r_['dir'][1] * 80, SP((0, 200, 0), 5))
        f, w_, h_ = strip(cc, (0.0, 0.35, 0.7), 960, 540); save('cover_close', f, w_, h_)
        def kc(c, u_):
            r_ = cart_close(c, 2.0, u_); c.drawCircle(*r_['handle'], 10, P((0, 255, 0)))
        f, w_, h_ = strip(kc, (0.0, 0.5, 1.0), 960, 540); save('cart_close', f, w_, h_)
    if A or 'flame' in what:
        def fl(c):
            c.clear(skia.Color(20, 22, 50))
            for i, k in enumerate((0.15, 0.3, 0.5, 0.7, 1.0)): flame(c, (120 + i * 370, 300), 0.0, 1.0, k, 1.0 + i); flame(c, (120 + i * 370, 760), 0.3, 1.6, k, 2.0 + i)
        save('flame', fl)
    if A or 'time' in what:
        s = skia.Surface(W, H); c = s.getCanvas()
        for name, fn in (('workshop', lambda t: workshop(c, t)), ('macro_pencil', lambda t: macro_pencil(c, t, 0.6, 1.0)), ('macro_scribe', lambda t: macro_scribe(c, t, 0.6, 1.0)), ('macro_cut', lambda t: macro_cut(c, t, 0.6)), ('macro_pair', lambda t: macro_pair(c, t)), ('square', lambda t: square(0.4)(c, t))):
            fn(0.0); t0 = time.time()
            for i in range(10): fn(i / 30)
            print(name, round((time.time() - t0) / 10, 3), 's per frame')
