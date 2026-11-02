"""Phineas Gage's head as an x-ray in the house flat style, built in code from lateral skull anatomy (facing left, so
the viewer sees his LEFT side). Units: skull length about 200 (glabella x -100 to opisthocranion x +100), y down.
The tamping iron is drawn to scale: 1.25 in wide on a skull about 7.7 in long gives 32 units; 3 ft 7 in long
(1117 units) with the top 12 in (311 units) tapering to a 0.25 in point.
Its path (Harlow 1868; Ratiu 2004; Van Horn 2012): in under the left cheekbone (below the zygomatic arch, in front
of the coronoid process), up behind the left eye (behind the orbit), through the left frontal lobe and out the top
of the skull near the midline, in front of the coronal suture."""
import math
import numpy as np, skia
from cperson import smooth_closed, tube, union, inter, diff, V, P, mix

ENTRY = (-16.0, 44.0)          # under the zygomatic arch
EXIT = (-70.0, -95.0)         # top of the frontal bone, in front of bregma
ROD_W = 32.0
ROD_LEN = 1117.0
TAPER = 311.0          # drawn as a short point only: inside the head the iron reads as one width, matching the wound band
POINT_W = 6.5

VAULT = [(-98, -6), (-102, -30), (-96, -58), (-80, -82), (-54, -100), (-18, -110), (22, -108), (58, -94), (86, -68), (102, -34),
         (104, 0), (98, 26), (84, 46), (64, 58), (46, 60), (34, 50), (18, 44), (-20, 40), (-60, 36), (-86, 22)]
SKIN = [(-104, -60), (-108, -26), (-112, -10), (-118, 6), (-128, 24), (-122, 30), (-114, 34), (-116, 46), (-112, 54), (-116, 62),
        (-110, 72), (-110, 92), (-104, 108), (-90, 122), (-60, 132), (-42, 150), (-40, 240), (74, 240), (76, 150), (80, 100),
        (100, 64), (110, 30), (114, -10), (106, -56), (82, -94), (40, -120), (-10, -124), (-60, -112), (-90, -90)]
BRAIN = [(-92, -10), (-96, -34), (-88, -62), (-68, -86), (-36, -100), (4, -103), (44, -96), (76, -76), (94, -46), (98, -14),
         (92, 12), (78, 22), (56, 22), (40, 14), (22, 18), (6, 24), (-16, 26), (-40, 22), (-56, 8), (-74, 2)]
TEMPORAL = [(-58, 8), (-44, 0), (-10, -6), (24, -4), (46, 6), (40, 16), (18, 26), (-12, 30), (-40, 26), (-56, 18)]
CEREBELLUM = [(42, 24), (64, 22), (86, 24), (94, 36), (84, 50), (62, 54), (44, 46), (38, 34)]
CENTRAL = [(8, -103), (2, -80), (-6, -58), (-12, -36), (-18, -10)]          # slants down and forward
SYLVIAN = [(-52, 4), (-28, -6), (0, -12), (28, -20), (50, -30)]
FRONTAL = [(-92, -10), (-96, -34), (-88, -62), (-68, -86), (-36, -100), (8, -103), (2, -80), (-6, -58), (-12, -36), (-18, -10),
           (-30, -8), (-52, 4), (-74, 2)]


def _line(pts):
    p = skia.Path(); p.moveTo(*pts[0])
    for i in range(1, len(pts) - 1):
        mx, my = (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2
        p.quadTo(*pts[i], mx, my)
    p.lineTo(*pts[-1]); return p


def _stroke_path(path, w, cap=skia.Paint.kRound_Cap):
    pt = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=w, StrokeCap=cap, StrokeJoin=skia.Paint.kRound_Join)
    out = skia.Path(); pt.getFillPath(path, out); return out


def _shrunk(pts, k, c=(0, -30)):
    return [(c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k) for x, y in pts]


BONE, BONE_HI, BONE_SH = (226, 234, 248), (246, 250, 255), (150, 170, 206)


def rod_dir():
    d = (EXIT[0] - ENTRY[0], EXIT[1] - ENTRY[1]); n = math.hypot(*d)
    return d[0] / n, d[1] / n, n


def rod_path(tip_s):
    """the iron as a closed path; tip_s = distance of the point along the line from ENTRY (negative: still below)"""
    ux, uy, _ = rod_dir(); nx, ny = -uy, ux
    tip = (ENTRY[0] + ux * tip_s, ENTRY[1] + uy * tip_s)
    tb = (tip[0] - ux * TAPER, tip[1] - uy * TAPER)
    end = (tip[0] - ux * ROD_LEN, tip[1] - uy * ROD_LEN)
    w0, w1 = POINT_W / 2, ROD_W / 2
    return skia.Path().addPoly([(tip[0] + nx * w0, tip[1] + ny * w0), (tb[0] + nx * w1, tb[1] + ny * w1), (end[0] + nx * w1, end[1] + ny * w1),
                                (end[0] - nx * w1, end[1] - ny * w1), (tb[0] - nx * w1, tb[1] - ny * w1), (tip[0] - nx * w0, tip[1] - ny * w0)], True)


def draw_rod(c, tip_s, a=1.0):
    """the iron as a round bar (cylinder shading across its width: dark edge, mid tone, a highlight streak, mid,
    dark edge), the point leading, tapered over its last foot"""
    p = rod_path(tip_s)
    ux, uy, _ = rod_dir(); nx, ny = -uy, ux
    c.save(); c.clipPath(p, skia.ClipOp.kIntersect, True)
    # cross section bands measured from the centre line (the path narrows over the taper, the bands follow the
    # centre so the point stays round looking)
    tip = (ENTRY[0] + ux * tip_s, ENTRY[1] + uy * tip_s)
    end = (tip[0] - ux * ROD_LEN, tip[1] - uy * ROD_LEN)
    def band(o0, o1, col):
        c.drawPath(skia.Path().addPoly([(tip[0] + ux * 4 + nx * o0, tip[1] + uy * 4 + ny * o0), (tip[0] + ux * 4 + nx * o1, tip[1] + uy * 4 + ny * o1),
                                        (end[0] + nx * o1, end[1] + ny * o1), (end[0] + nx * o0, end[1] + ny * o0)], True), P(col, 255 * a))
    W2 = ROD_W / 2
    band(-W2, W2, (58, 60, 74))                    # dark edges
    band(-W2 * 0.72, W2 * 0.8, (100, 104, 120))   # mid
    band(-W2 * 0.45, W2 * 0.1, (150, 156, 172))   # lit half
    band(-W2 * 0.32, -W2 * 0.08, (226, 230, 240)) # highlight streak
    c.restore()


def track_path(u=1.0):
    """the wound track from the entry to the exit (u: how much of it is drawn)"""
    ux, uy, n = rod_dir()
    e = (ENTRY[0] + ux * n * u, ENTRY[1] + uy * n * u)
    return _stroke_path(_line([ENTRY, e]), ROD_W * 1.08, cap=skia.Paint.kButt_Cap)


def draw_xray(c, cx, cy, s, t, hl=0.0, track_u=0.0, tip_s=None, a=1.0, top_y=-160.0):
    """hl: the left frontal lobe glows; track_u: wound track drawn so far; tip_s: the iron's point along its path
    (None: no iron)"""
    c.save(); c.translate(cx, cy); c.scale(s, s)
    br = 0.5 * math.sin(t * 1.6); c.translate(0, br)
    # skin and soft tissue: a faint flat silhouette with a slightly brighter lit edge
    skin = smooth_closed(SKIN)
    c.drawPath(skin, P((150, 170, 214), 46))
    q = skia.Path(skin); q.offset(3, 2); c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(skin, P((200, 214, 246), 90)); c.restore()
    c.drawOval(skia.Rect(24, 14, 46, 54), P((150, 170, 214), 60))                                      # ear
    # cervical spine: vertebral bodies, discs, spinous processes; dens up into the skull base
    for k in range(5):
        y0 = 70 + k * 30; x0 = 34 - k * 3
        body = skia.Path(); body.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + 26, y0 + 22), 4, 4))
        c.drawPath(body, P(BONE, 120)); c.drawPath(diff(body, _shrunk_rect(x0, y0, 26, 22, 4)), P(BONE_HI, 170))
        sp = smooth_closed([(x0 + 28, y0 + 4), (x0 + 58, y0 + 8), (x0 + 66, y0 + 18), (x0 + 54, y0 + 22), (x0 + 28, y0 + 18)])
        c.drawPath(sp, P(BONE, 110))
    # skull: outer table bright, diploe and inner table, then the face
    vault = smooth_closed(VAULT)
    inner = smooth_closed(_shrunk(VAULT, 0.93, (0, -24)))
    c.drawPath(vault, P(BONE, 60))
    c.drawPath(diff(vault, inner), P(BONE, 170))
    c.drawPath(diff(vault, smooth_closed(_shrunk(VAULT, 0.975, (0, -24)))), P(BONE_HI, 230))
    # sutures: coronal (bregma down to the pterion), squamous arc, lambdoid
    for pts in ([(-4, -110), (-10, -86), (-20, -60), (-30, -34), (-42, -8)], [(-40, -6), (-20, -24), (10, -30), (36, -20), (50, 0)], [(76, -82), (88, -50), (96, -20)]):
        c.drawPath(_stroke_path(_line(pts), 1.6), P(BONE_SH, 160))
    # face: frontal brow, nasal bones, maxilla with upper teeth, the orbit, zygomatic bone and arch
    face = smooth_closed([(-98, -8), (-104, -14), (-108, 2), (-114, 22), (-108, 28), (-108, 48), (-102, 62), (-60, 66), (-30, 60), (-20, 44), (-56, 36), (-86, 22)])
    c.drawPath(face, P(BONE, 90))
    c.drawPath(diff(face, smooth_closed(_shrunk([(-98, -8), (-104, -14), (-108, 2), (-114, 22), (-108, 28), (-108, 48), (-102, 62), (-60, 66), (-30, 60), (-20, 44), (-56, 36), (-86, 22)], 0.9, (-70, 30)))), P(BONE, 170))
    orbit = smooth_closed([(-96, -6), (-82, -12), (-64, -8), (-56, 6), (-62, 22), (-80, 26), (-94, 16)])
    c.drawPath(orbit, P((20, 30, 60), 170))
    c.drawPath(diff(orbit, smooth_closed(_shrunk([(-96, -6), (-82, -12), (-64, -8), (-56, 6), (-62, 22), (-80, 26), (-94, 16)], 0.8, (-78, 8)))), P(BONE_HI, 220))
    c.drawPath(smooth_closed([(-60, 22), (-20, 18), (20, 22), (24, 30), (-20, 30), (-56, 32)]), P((20, 30, 60), 150))     # temporal fossa above the arch
    zyg = smooth_closed([(-90, 24), (-66, 22), (-50, 28), (-10, 31), (22, 30), (30, 34), (24, 40), (-10, 39), (-46, 40), (-64, 44), (-86, 38)])
    c.drawPath(zyg, P(BONE_HI, 235))
    c.drawPath(smooth_closed([(-86, 24), (-66, 24), (-60, 40), (-80, 42)]), P(BONE_HI, 245))                           # zygomatic bone body
    nasal = smooth_closed([(-112, 22), (-104, 26), (-104, 46), (-110, 44)])
    c.drawPath(nasal, P((20, 30, 60), 140))
    x = -102
    for k, w_ in enumerate((5, 5, 6, 7, 7, 13, 13)):                              # upper teeth: incisors, canine, premolars, molars
        if w_ < 9: c.drawPath(smooth_closed([(x, 62), (x + w_, 62), (x + w_ - 0.5, 73), (x + w_ / 2, 76), (x + 0.5, 73)]), P(BONE_HI, 230))
        else: c.drawPath(smooth_closed([(x, 62), (x + w_, 62), (x + w_, 72), (x + w_ * 0.75, 75), (x + w_ * 0.5, 72), (x + w_ * 0.25, 75), (x, 72)]), P(BONE_HI, 230))
        x += w_ + 1
    # mandible: body, angle, ramus up to the condyle in front of the ear, coronoid under the arch; lower teeth
    mand = smooth_closed([(-100, 80), (-104, 96), (-96, 110), (-70, 114), (-20, 108), (14, 104), (24, 92), (26, 66), (32, 50), (24, 48),
                          (16, 62), (6, 54), (-2, 44), (-8, 50), (-4, 70), (-20, 86), (-60, 90), (-96, 86)])
    c.drawPath(mand, P(BONE, 110))
    c.drawPath(diff(mand, smooth_closed(_shrunk([(-100, 80), (-104, 96), (-96, 110), (-70, 114), (-20, 108), (14, 104), (24, 92), (26, 66), (32, 50), (24, 48),
                                                 (16, 62), (6, 54), (-2, 44), (-8, 50), (-4, 70), (-20, 86), (-60, 90), (-96, 86)], 0.92, (-30, 84)))), P(BONE_HI, 200))
    x = -100
    for k, w_ in enumerate((5, 5, 6, 7, 7, 13, 13)):                              # lower teeth
        if w_ < 9: c.drawPath(smooth_closed([(x + 0.5, 79), (x + w_ / 2, 76), (x + w_ - 0.5, 79), (x + w_, 90), (x, 90)]), P(BONE_HI, 220))
        else: c.drawPath(smooth_closed([(x, 79), (x + w_ * 0.25, 76), (x + w_ * 0.5, 79), (x + w_ * 0.75, 76), (x + w_, 79), (x + w_, 90), (x, 90)]), P(BONE_HI, 220))
        x += w_ + 1
    c.drawOval(skia.Rect(28, 26, 40, 36), P((20, 30, 60), 170))                      # external ear canal
    c.drawPath(smooth_closed([(30, 44), (40, 46), (42, 64), (34, 70), (28, 58)]), P(BONE, 160))   # mastoid process
    # brain inside the inner table: lobes, gyri, the slanted central sulcus, the Sylvian fissure, cerebellum, brainstem
    brain = smooth_closed(BRAIN)
    c.save(); c.clipPath(inner, skia.ClipOp.kIntersect, True)
    c.drawPath(smooth_closed([(8, 14), (24, 12), (32, 40), (38, 72), (26, 76), (16, 44)]), P((206, 142, 156), 230))     # brainstem
    cb = smooth_closed(CEREBELLUM)
    c.drawPath(cb, P((196, 120, 142)))
    c.save(); c.clipPath(cb, skia.ClipOp.kIntersect, True)
    for k in range(6):
        c.drawPath(_stroke_path(_line([(40, 28 + k * 5), (66, 24 + k * 6), (96, 30 + k * 5)]), 1.4), P((150, 84, 108)))
    c.restore()
    c.drawPath(brain, P((214, 140, 158)))
    q = skia.Path(brain); q.offset(-6, -5); c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(brain, P((182, 112, 136))); c.restore()
    fr = inter(brain, smooth_closed(FRONTAL))
    if fr is not None:
        c.drawPath(fr, P(mix((214, 140, 158), (255, 196, 100), hl)))
        if hl > 0.02:
            c.drawPath(fr, P((255, 214, 130), 110 * hl * (0.8 + 0.2 * math.sin(t * 5)), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6), BlendMode=skia.BlendMode.kScreen))
    tp = smooth_closed(TEMPORAL)
    c.drawPath(tp, P((214, 140, 158)))
    sul = mix((168, 92, 116), (206, 128, 66), hl)
    # gyri: short curved sulci scattered over the cortex, each a gentle S, a few with a side branch
    c.save(); c.clipPath(brain, skia.ClipOp.kIntersect, True); c.clipPath(tp, skia.ClipOp.kDifference, True)
    # contour-following sulci: rings inside the brain outline, gently wavy, broken into separate folds (no crossings)
    import numpy as _np
    bx = _np.array(BRAIN, float)
    dense = []
    for i in range(len(bx)):
        a0, a1 = bx[i], bx[(i + 1) % len(bx)]
        for f in _np.linspace(0, 1, 6, endpoint=False): dense.append(a0 + (a1 - a0) * f)
    dense = _np.array(dense); cen = dense.mean(axis=0)
    for li, kk in enumerate((0.84, 0.68, 0.52, 0.36)):
        ring = cen + (dense - cen) * kk
        n_ = len(ring)
        nrm = []
        for i in range(n_):
            d = ring[(i + 1) % n_] - ring[i - 1]; L = math.hypot(*d) + 1e-9; nrm.append((-d[1] / L, d[0] / L))
        pts = [(ring[i][0] + nrm[i][0] * 3.2 * math.sin(i * 0.9 + li * 1.7), ring[i][1] + nrm[i][1] * 3.2 * math.sin(i * 0.9 + li * 1.7)) for i in range(n_)]
        seg = 7 + li; gap = 2
        i = (li * 3) % (seg + gap)
        while i + 3 < n_:
            chunk = pts[i:i + seg]
            if len(chunk) >= 3: c.drawPath(_stroke_path(_line(chunk), 2.2), P(sul))
            i += seg + gap
    c.restore()
    c.save(); c.clipPath(tp, skia.ClipOp.kIntersect, True)
    c.drawPath(_stroke_path(_line([(-50, 18), (-30, 12), (-6, 16), (16, 10), (36, 16)]), 2.4), P((168, 92, 116)))
    c.drawPath(_stroke_path(_line([(-30, 22), (-14, 26), (6, 22)]), 2.0), P((168, 92, 116)))
    c.restore()
    q = skia.Path(tp); q.offset(0, -4); c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(tp, P((150, 80, 106))); c.restore()
    c.drawPath(_stroke_path(_line(CENTRAL), 3.4), P((120, 60, 86)))
    c.drawPath(_stroke_path(_line(SYLVIAN), 3.4), P((120, 60, 86)))
    # the wound track through the brain
    if track_u > 0:
        tr = track_path(track_u)
        c.drawPath(tr, P((132, 32, 48), 200))
    c.restore()
    # holes in the bone where the iron went through (the exit is a ragged gap in the frontal bone)
    if track_u > 0.9 or (tip_s is not None and tip_s > rod_dir()[2]):
        ex = smooth_closed([(EXIT[0] - 22, EXIT[1] + 4), (EXIT[0] - 10, EXIT[1] - 6), (EXIT[0] + 8, EXIT[1] - 8), (EXIT[0] + 22, EXIT[1] + 2),
                            (EXIT[0] + 14, EXIT[1] + 12), (EXIT[0] - 12, EXIT[1] + 14)])
        ring = diff(smooth_closed([(x * 1.04, y * 1.04 - 1) for x, y in VAULT]), inner)
        hole_ = inter(ex, ring) if ring is not None else ex
        if hole_ is not None: c.drawPath(hole_, P((24, 34, 64)))
    # below the cranium the same band runs down through the cheek to the entry under the cheekbone (soft tissue,
    # lighter), so the entry is the end of one continuous track
    if track_u > 0.02:
        c.save(); c.clipPath(inner, skia.ClipOp.kDifference, True); c.clipPath(skin, skia.ClipOp.kIntersect, True)
        c.drawPath(track_path(min(1.0, track_u)), P((132, 32, 48), 200)); c.restore()
    # the iron, seen as an x-ray shadow: only the part inside his head (above the entry, inside the skin outline),
    # so it never crosses the titles, the captions, his teeth or his neck
    if tip_s is not None:
        # the iron from the cheek up and out through the top of the skull, continuing above it (never into the
        # title zone: top_y is that limit in these units); seen through the translucent bone inside the skull
        ux, uy, _ = rod_dir()
        half = skia.Path(); nx, ny = -uy, ux
        e = ENTRY
        half.addPoly([(e[0] + nx * 400, e[1] + ny * 400), (e[0] + nx * 400 + ux * 800, e[1] + ny * 400 + uy * 800),
                      (e[0] - nx * 400 + ux * 800, e[1] - ny * 400 + uy * 800), (e[0] - nx * 400, e[1] - ny * 400)], True)
        c.save(); c.clipRect(skia.Rect(-400, top_y, 400, 400)); c.clipPath(half, skia.ClipOp.kIntersect, True)
        c.saveLayer(None, None)
        draw_rod(c, tip_s)
        fade = skia.GradientShader.MakeLinear([skia.Point(0, top_y), skia.Point(0, top_y + 40)], [skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, 255)])
        c.drawRect(skia.Rect(-400, top_y, 400, 400), skia.Paint(Shader=fade, BlendMode=skia.BlendMode.kDstIn))   # fades out, no square top
        c.restore()
        c.restore()
        c.save(); c.clipPath(rod_path(tip_s), skia.ClipOp.kIntersect, True)
        c.drawPath(diff(vault, inner), P(BONE, 110))                     # bone over the iron where it is inside
        c.drawPath(face, P(BONE, 50)); c.drawPath(zyg, P(BONE_HI, 90))
        c.restore()
    c.restore()


def _shrunk_rect(x0, y0, w, h, r):
    p = skia.Path(); p.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0 + 3, y0 + 3, x0 + w - 3, y0 + h - 3), r, r)); return p


def to_screen(cx, cy, s, p):
    return cx + p[0] * s, cy + p[1] * s
