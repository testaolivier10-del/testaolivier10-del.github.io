"""Heads of the yt-nremt-02 cast, each built as its own designed outlines from its head sheet (ref/walt_sheet.png,
ref/priya_sheet.png, ref/heads_trio.png). One function draws a head in the people model's head frame (centre of the skull at
0, 0; chin near y = 85; eyes at y = -12); each person has their OWN spec: face outline, hair shapes, brows, eyes, nose, mouth,
facial hair, glasses, age lines. Nothing is shared by recolouring.
Expression fields read from the pose: lid, look, brow, worry, smile (below 0 = corners down), talk, wince (0..1: eyes squeezed,
teeth clenched), head_pitch, pony_sway, puff (0..1 a short breath: lips part), chew (0..1 jaw moving with a closed mouth)."""
import math
import skia
from lpk import P, SP, blur, lerp, mix, smooth_closed
from art import shaded, diffp
from guy import stroke

AO = (70, 30, 60)

SPEC = dict(
    walt=dict(jw=57, jy=74, cw=22, cy=86, ck=3, jowl=7, ew=12.5, eh=7.0, iris=(92, 62, 44), brow=(132, 132, 140), bth=1.5, barch=0.5, lash=3.0, nose='broad', nsz=1.28,
              lip=(170, 92, 88), stache=(150, 150, 156), lines='old', ear=1.12, hair='walt', eyy=-10, formsh=120, blush=46),
    priya=dict(jw=47, jy=70, cw=9, cy=83, ck=4, jowl=0, bgap=10.5, ew=18.5, eh=10.6, iris=(74, 44, 32), brow=(26, 20, 24), bth=0.78, barch=0.6, lash=4.2, fem=True, nose='small', nsz=0.84,
               lip=(168, 86, 80), hair='priya', ear=0.92, eyy=-10, formsh=70, blush=22),
    ruiz=dict(jw=58, jy=72, cw=21, cy=85, ck=2, jowl=2, ew=16, eh=9.0, iris=(60, 38, 30), brow=(22, 18, 20), bth=1.5, barch=0.1, lash=3.2, nose='straight', nsz=1.08,
              lip=(150, 84, 76), goatee=(22, 18, 22), hair='ruiz', ear=1.0, eyy=-12, formsh=120, blush=10),
    marcus=dict(jw=45, jy=74, cw=15, cy=90, ck=0, jowl=0, ew=16, eh=9.6, iris=(50, 30, 26), brow=(18, 14, 18), bth=1.1, barch=0.7, lash=3.2, nose='wide', nsz=1.05,
                lip=(108, 60, 60), glasses=(40, 40, 52), hair='marcus', ear=0.96, eyy=-14, formsh=130, blush=0),
    joan=dict(jw=50, jy=72, cw=12, cy=84, ck=2, jowl=2, ew=16, eh=9.6, iris=(70, 100, 96), brow=(138, 70, 46), bth=0.8, barch=0.9, lash=3.6, fem=True, nose='straight', nsz=0.94,
              lip=(196, 104, 100), lines='mid', freckles=True, hair='joan', ear=0.0, eyy=-11, formsh=80, blush=26),
)


def _hair_back(c, kind, hs, yaw, sw, d, HAIR, HAIR_SH, HAIR_HI, SKIN=None):
    if kind == 'walt':                                        # the bare crown, behind the face and under the band of hair
        c.drawPath(smooth_closed([(-60, -56), (-58, -96), (-32 + hs, -126), (hs, -132), (32 + hs, -126), (58, -96), (60, -56), (0, -40)]), P(SKIN))
    if kind == 'priya':                                       # the ponytail falls behind the head and shows beside the neck
        tail = smooth_closed([(-20 - yaw * 30, -150), (-52 - yaw * 30, -140), (-76 - yaw * 30, -92), (-84 - yaw * 34 + sw * 0.3, -20), (-84 - yaw * 36 + sw * 0.7, 50), (-74 - yaw * 36 + sw, 104), (-58 - yaw * 36 + sw * 1.1, 122),
                              (-48 - yaw * 36 + sw * 0.9, 100), (-52 - yaw * 34 + sw * 0.5, 50), (-48 - yaw * 32, 10), (-36 - yaw * 30, -30)])
        shaded(c, tail, mix(HAIR, HAIR_SH, 0.3), HAIR_SH, sh=(-d[0] * 1.1, -d[1] * 0.3), rimL=HAIR_HI, rl=(d[0] * 0.3, d[1] * 0.3))
        knot = smooth_closed([(-36 + hs * 2, -128), (-30 + hs * 2, -160), (0 + hs * 2, -172), (32 + hs * 2, -162), (40 + hs * 2, -128), (0 + hs * 2, -116)])
        shaded(c, knot, mix(HAIR, HAIR_SH, 0.2), HAIR_SH, sh=(-d[0] * 1.2, -d[1] * 0.6), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
    elif kind == 'joan':                                      # the bob hangs behind the face to the chin
        hb_ = smooth_closed([(-72 + hs, -118), (-24 + hs, -150), (28 + hs, -152), (74 + hs, -118), (90, -52), (95, 22), (90, 70), (70, 92), (50, 84), (48, 50), (0, 34), (-48, 50), (-50, 84), (-70, 92), (-90, 70), (-95, 22), (-90, -52)])
        q_ = skia.Path(hb_); q_.offset(5, 8); c.drawPath(q_, P(AO, 80, MaskFilter=blur(7)))
        shaded(c, hb_, mix(HAIR, HAIR_SH, 0.3), HAIR_SH, sh=(-d[0] * 1.3, -d[1] * 0.4), rimL=HAIR_HI, rl=(d[0] * 0.4, d[1] * 0.3))


def _hair_front(c, kind, hs, yaw, d, HAIR, HAIR_SH, HAIR_HI, SKIN, SKIN_SH, SKIN_HI):
    if kind == 'walt':                                        # short grey hair, receding: a band round the crown and down to the ears
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 54, -84), (sx * 67, -70), (sx * 67, -26), (sx * 61, -30), (sx * 57, -56)]), P(mix(HAIR, SKIN_SH, 0.15)))
        hair = smooth_closed([(-64, -40), (-70, -76), (-60 + hs, -114), (-30 + hs, -135), (hs, -140), (30 + hs, -135), (60 + hs, -114), (70, -76), (64, -40), (58, -62), (53, -88),
                              (36 + hs, -106), (14 + hs, -110), (hs, -106), (-14 + hs, -110), (-36 + hs, -106), (-53, -88), (-58, -62)])
        shaded(c, hair, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.drawOval(skia.Rect(-34 + hs, -104, 6 + hs, -84), P(SKIN_HI, 120, MaskFilter=blur(7)))
    elif kind == 'priya':                                     # pulled back tight, a clean rounded hairline, a few short strands at the temples
        top_ = smooth_closed([(-62, -6), (-70, -54), (-64 + hs, -110), (-26 + hs, -139), (26 + hs, -141), (66 + hs, -112), (72, -54), (64, -6), (60, -40), (51 + hs, -72), (24 + hs, -90), (-4 + hs, -95), (-32 + hs, -86), (-52, -56), (-59, -34)])
        shaded(c, top_, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(top_, skia.ClipOp.kIntersect, True)
        for (x0, y0, x1, y1, x2, y2, a_) in ((-56, -70, -40, -112, 0, -136, 150), (-40, -84, -18, -116, 14, -134, 120), (-8, -94, 10, -118, 30, -134, 90), (30, -90, 44, -112, 50, -128, 80)):
            stroke(c, [(x0 + hs, y0), (x1 + hs, y1), (x2 + hs, y2)], 3.2, HAIR_HI, a_)
        c.restore()
        for sx in (-1, 1): stroke(c, [(sx * 59, -34), (sx * 63, -12), (sx * 60, 6)], 3.6, HAIR)
    elif kind == 'ruiz':                                      # a very short buzz cut with a square hairline, faded at the sides
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 54, -80), (sx * 67, -70), (sx * 66, -30), (sx * 60, -36), (sx * 57, -58)]), P(mix(HAIR, SKIN_SH, 0.5)))
        cap = skia.Path(); cap.addPoly([skia.Point(*q) for q in [(-62, -60), (-67, -90), (-54 + hs, -114), (-22 + hs, -123), (22 + hs, -123), (54 + hs, -114), (67, -90), (62, -60), (56, -82), (40 + hs, -92), (-40 + hs, -92), (-56, -82)]], True)
        pe = skia.Paint(AntiAlias=True, PathEffect=skia.CornerPathEffect.Make(12)); dst = skia.Path()
        if pe.getFillPath(cap, dst) and not dst.isEmpty(): cap = dst
        shaded(c, cap, mix(HAIR, SKIN_SH, 0.1), HAIR_SH, sh=(-d[0] * 0.8, -d[1] * 0.4), rimL=HAIR_HI, rl=(d[0] * 0.4, d[1] * 0.4))
    elif kind == 'marcus':                                    # short curls on top with a high fade
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 52, -92), (sx * 66, -80), (sx * 66, -38), (sx * 60, -44), (sx * 56, -66)]), P(mix(HAIR, SKIN, 0.45)))
        cur = []
        for i in range(9):
            a_ = math.radians(lerp(200, 340, i / 8)); cur.append((58 * math.cos(a_) + hs, -92 + 46 * math.sin(a_), 19))
        for i in range(6):
            a_ = math.radians(lerp(210, 330, i / 5)); cur.append((36 * math.cos(a_) + hs, -96 + 24 * math.sin(a_), 19))
        cur.append((hs, -104, 20))
        for (px, py, r_) in cur: c.drawCircle(px + 3, py + 4, r_, P(HAIR_SH))
        for (px, py, r_) in cur: c.drawCircle(px, py, r_, P(HAIR))
        for (px, py, r_) in cur[:9:2]: c.drawArc(skia.Rect(px - r_ * 0.6, py - r_ * 0.6, px + r_ * 0.6, py + r_ * 0.6), 190, 110, False, SP(HAIR_HI, 3, 190))
    elif kind == 'joan':                                      # a chin length bob with a side part, swept across the forehead
        top_ = smooth_closed([(-68, 40), (-80, -50), (-68 + hs, -120), (-24 + hs, -153), (26 + hs, -154), (68 + hs, -120), (80, -50), (68, 40), (61, -6), (57, -46), (38 + hs, -74), (4 + hs, -90), (-26 + hs, -98), (-42 + hs, -76), (-56, -44), (-60, -8)])
        shaded(c, top_, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(top_, skia.ClipOp.kIntersect, True)
        for (x0, y0, x1, y1, x2, y2, a_) in ((-30, -98, 6, -112, 50, -70, 150), (-30, -116, 14, -128, 66, -84, 120), (-34, -100, -56, -80, -64, -30, 120), (-30, -128, -60, -104, -72, -40, 90), (62, -40, 68, 0, 64, 34, 110)):
            stroke(c, [(x0 + hs, y0), (x1 + hs, y1), (x2, y2)], 3.4, HAIR_HI if x2 < 0 else HAIR_SH, a_)
        stroke(c, [(-28 + hs, -98), (-30 + hs, -124), (-26 + hs, -150)], 2.6, HAIR_SH, 200)        # the part
        c.restore()


def head(c, ps, cfg, yaw, d, K):
    S = SPEC[cfg['hd']]; SKIN, SKIN_SH, SKIN_HI, HAIR, HAIR_SH, HAIR_HI = K['SKIN'], K['SKIN_SH'], K['SKIN_HI'], K['HAIR'], K['HAIR_SH'], K['HAIR_HI']
    fx = yaw * 17; hs = yaw * 5; sw = getattr(ps, 'pony_sway', 0.0); wn = max(0.0, min(1.0, getattr(ps, 'wince', 0.0))); sm_ = ps.smile; fem = S.get('fem')
    pit = getattr(ps, 'head_pitch', 0.0); chew = getattr(ps, 'chew', 0.0); puff = getattr(ps, 'puff', 0.0)
    _hair_back(c, S['hair'], hs, yaw, sw, d, HAIR, HAIR_SH, HAIR_HI, SKIN)
    if S['ear'] > 0:
        for sx in (-1, 1):
            e0 = sx * (61 - 11 * yaw * sx); k = S['ear']
            e = smooth_closed([(e0 - sx * 6, -28 * k), (e0 + sx * 12 * k, -38 * k), (e0 + sx * 22 * k, -12 * k), (e0 + sx * 14 * k, 18 * k), (e0 - sx * 4, 14 * k)])
            shaded(c, e, mix(SKIN, SKIN_SH, 0.12), SKIN_SH, sh=(-d[0] * 0.5, -d[1] * 0.4))
            c.drawPath(smooth_closed([(e0 + sx * 4, -24 * k), (e0 + sx * 14 * k, -12 * k), (e0 + sx * 7 * k, 8 * k), (e0 + sx * 3, -6 * k)]), P(SKIN_SH, 210))
    jw, jy, cw, cy, ck, jl = S['jw'], S['jy'], S['cw'], S['cy'] + 2.5 * chew + 2.0 * puff, S['ck'], S['jowl']
    nr = lambda x: x * (1 - 0.07 * yaw * (1 if x > 0 else -1))                # the far cheek narrows as the head turns
    face = smooth_closed([(nr(-57), -66), (nr(-62), -22), (nr(-60 - ck), 16), (nr(-jw - jl * 0.4) + fx * 0.3, 46), (nr(-jw * 0.66 - jl) + fx * 0.6, jy), (-cw + fx * 0.8, cy), (cw + fx * 0.8, cy),
                          (nr(jw * 0.66 + jl) + fx * 0.6, jy), (nr(jw + jl * 0.4) + fx * 0.3, 46), (nr(60 + ck), 16), (nr(62), -22), (nr(57), -66), (40, -97), (0, -105), (-40, -97)])
    c.drawPath(face, P(SKIN))
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
    c.drawPath(smooth_closed([(72, -100), (50 + fx, -78), (43 + fx, -36), (48 + fx, -6), (42 + fx, 30), (24 + fx, 62), (6 + fx, 80), (0 + fx, 104), (84, 104)]), P(SKIN_SH, S['formsh']))
    q2 = skia.Path(face); q2.offset(5, 3)
    try: d2_ = skia.Op(face, q2, skia.PathOp.kDifference_PathOp)
    except RuntimeError: d2_ = None
    if d2_ is not None: c.drawPath(d2_, P(SKIN_HI, 235))
    c.drawRect(skia.Rect(-70, -108, 70, -70), P(AO, 60, MaskFilter=blur(9)))                                  # the hair's shadow on the forehead
    for sx in (-1, 1): c.drawOval(skia.Rect(fx + sx * 37 - 18, 14 - 5 * sm_ - 4 * wn, fx + sx * 37 + 18, 36 - 5 * sm_ - 4 * wn), P((240, 120, 110), 30 + 50 * max(0, sm_) + S['blush'] + 30 * wn, MaskFilter=blur(7)))
    c.drawPath(smooth_closed([(-40 + fx, cy - 15), (fx, cy - 3), (40 + fx, cy - 15), (28 + fx, cy + 7), (fx, cy + 13), (-28 + fx, cy + 7)]), P(SKIN_SH, 60))
    if jl > 4:                                               # soft jowls and a second line under the chin
        for sx in (-1, 1): stroke(c, [(fx * 0.5 + sx * (jw - 8), 40), (fx * 0.6 + sx * (jw * 0.66 + 2), jy - 8), (fx * 0.7 + sx * (cw + 10), cy - 8)], 2.6, SKIN_SH, 130)
    c.restore()
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True); c.translate(0, 9 * pit)
    if S.get('goatee'):                                      # a goatee: round the mouth and over the chin
        G = S['goatee']
        gp = smooth_closed([(fx * 1.1 - 27, 46), (fx * 1.1 - 12, 40), (fx * 1.1, 43), (fx * 1.1 + 12, 40), (fx * 1.1 + 27, 46), (fx + 29, 66), (fx * 0.9 + 22, cy - 5), (fx * 0.8, cy + 2), (fx * 0.9 - 22, cy - 5), (fx - 29, 66)])
        c.drawPath(gp, P(G)); c.drawPath(diffp(gp, (-5, -3)), P(mix(G, (80, 70, 90), 0.5), 120))
        c.drawPath(smooth_closed([(fx * 1.1 - 17, 52), (fx * 1.1, 49), (fx * 1.1 + 17, 52), (fx * 1.1 + 14, 67), (fx * 1.1, 71), (fx * 1.1 - 14, 67)]), P(mix(SKIN, SKIN_SH, 0.35)))
    ey = S['eyy']; EW = S['ew']; BC = S['brow']
    for sx in (-1, 1):
        w_ = 1 - 0.26 * max(0.0, sx * yaw); ex = fx * 1.05 + sx * 27 * (1 - 0.1 * max(0.0, sx * yaw)); ew = EW * w_
        op_ = max(0.04, ps.lid) * (1 - 0.2 * max(0, sm_)) * (1 - 0.75 * wn); h = S['eh'] * op_
        if wn > 0.62 or op_ < 0.14:                          # squeezed shut: one firm curve, lower at the nose side when in pain
            k_ = 5.0 * wn
            stroke(c, [(ex - sx * ew * 1.05, ey + 1 + k_ * 0.7), (ex, ey + 2.5), (ex + sx * ew * 1.08, ey - k_ * 0.5)], S['lash'] + 0.6, (44, 28, 28))
            if wn > 0.3:
                for j in (-1, 0, 1): stroke(c, [(ex + sx * (ew + 3), ey - 1 + j * 4), (ex + sx * (ew + 8), ey - 2 + j * 6), (ex + sx * (ew + 13), ey - 2 + j * 8.5)], 1.8, SKIN_SH, 200 * wn)
        else:
            eye = smooth_closed([(ex - ew, ey + 2), (ex - ew * 0.45, ey - h), (ex + ew * 0.4, ey - h * 1.04), (ex + ew, ey - 1), (ex + ew * 0.45, ey + h * 0.76), (ex - ew * 0.4, ey + h * 0.8)])
            c.drawPath(eye, P((253, 251, 247)))
            c.save(); c.clipPath(eye, skia.ClipOp.kIntersect, True)
            ir = min(9.4, S['eh'] * 0.86); ix, iy = ex + ps.look[0] * (ew - ir * 0.75) * 0.8, ey + ps.look[1] * 3 + 0.5
            c.drawCircle(ix, iy, ir, P(S['iris'])); c.drawCircle(ix, iy, ir, SP(mix(S['iris'], (10, 6, 10), 0.5), 1.8)); c.drawCircle(ix, iy, ir * 0.5, P((22, 14, 16)))
            c.drawCircle(ix - ir * 0.34, iy - ir * 0.36, ir * 0.28, P((255, 255, 255)))
            c.drawRect(skia.Rect(ex - 22, ey - h - 2, ex + 22, ey - h + 3), P((120, 80, 86), 100))
            c.restore()
            lash = skia.Path(); lash.moveTo(ex - ew * 1.05, ey + 2.5); lash.quadTo(ex - ew * 0.33, ey - h - 5.0, ex + ew * 0.44, ey - h * 1.04 - 1.6); lash.quadTo(ex + ew * 0.84, ey - h * 0.7, ex + ew * 1.12, ey - 2.2)
            c.drawPath(lash, SP((44, 28, 28), S['lash']))
            if fem: stroke(c, [(ex + sx * ew * 0.84, ey - h * 0.55), (ex + sx * ew * 1.1, ey - h * 0.6 - 1), (ex + sx * ew * 1.28, ey - h * 0.6 - 4)], 2.8, (44, 28, 28))
            stroke(c, [(ex - ew * 0.83, ey - h - 7), (ex, ey - h - 10.5), (ex + ew * 0.83, ey - h - 6)], 2, SKIN_SH, 170 * min(1.0, ps.lid))
            stroke(c, [(ex - ew * 0.6, ey + h * 0.8 + 2.5), (ex + 1, ey + h * 0.8 + 4), (ex + ew * 0.66, ey + h * 0.76 + 2)], 1.8, SKIN_SH, 110 + 80 * max(0, sm_))
        if S.get('lines') == 'old' and wn < 0.62:            # a bag under each eye
            stroke(c, [(ex - ew * 0.8, ey + 10), (ex, ey + 15), (ex + ew * 0.9, ey + 10)], 2, SKIN_SH, 150)
        if S.get('lines') and wn < 0.3:
            for j in (-1, 1): stroke(c, [(ex + sx * (ew + 4), ey + j * 3), (ex + sx * (ew + 9), ey + j * 5.5), (ex + sx * (ew + 13), ey + j * 8)], 1.6, SKIN_SH, 150)
        bw_ = ps.brow - 1.3 * wn; wy = getattr(ps, 'worry', 0.0) - 0.75 * wn; th = S['bth']; ar = S['barch']
        by = ey - S.get('bgap', 15) - S['eh'] - 6 * bw_ + 3.5 * wn
        inn = (ex - sx * 19 * w_ + sx * 3 * wn, by + 5 - bw_ - 9 * wy); out = (ex + sx * 23 * w_, by + 1 + 5 * wy + 2 * ar)
        mid = (ex + sx * 4 * w_, by - 5 - 3 * ar - 2 * bw_ - 3 * wy)
        br_ = smooth_closed([inn, (inn[0] + sx * 3, inn[1] - 7 * th), (mid[0], mid[1] - 3.2 * th), out, (out[0] - sx * 2, out[1] + 3.5 * th), (mid[0], mid[1] + 3.6 * th), (inn[0] + sx * 2, inn[1] + 2.2 * th)])
        c.drawPath(br_, P(BC))
    if wn > 0.25:                                            # the frown between the brows
        for sx in (-1, 1): stroke(c, [(fx * 1.05 + sx * 5, ey - 34), (fx * 1.05 + sx * 3.4, ey - 26), (fx * 1.05 + sx * 5.5, ey - 18)], 2.2, SKIN_SH, 230 * wn)
    if S.get('lines') == 'old':
        wy = getattr(ps, 'worry', 0.0)
        for j, yy in enumerate((-66, -78)): stroke(c, [(fx - 30, yy + 2 - 2 * wy), (fx, yy - 2 - 4 * wy + 3 * wn), (fx + 30, yy + 2 - 2 * wy)], 2, SKIN_SH, 120 + 60 * abs(wy) + 60 * wn)
    if S.get('freckles'):
        for (qx, qy) in ((-34, 18), (-26, 24), (-40, 26), (-30, 12), (28, 18), (36, 24), (24, 26), (33, 12), (-6, 20), (7, 21)): c.drawCircle(fx + qx, qy, 1.9, P((196, 124, 96), 170))
    # ---- nose
    nx = fx * 1.25 + yaw * 7; nz = S['nsz']; nt = S['nose']
    stroke(c, [(nx + 6 * nz, -6), (nx + 9 * nz, 14), (nx + 11 * nz, 28)], 3, SKIN_SH, 190 if nt != 'small' else 120)
    if nt == 'broad':
        c.drawOval(skia.Rect(nx - 15 * nz, 18, nx + 15 * nz, 44), P(mix(SKIN, (236, 120, 110), 0.45), 190, MaskFilter=blur(4)))
        c.drawPath(smooth_closed([(nx - 16 * nz, 34), (nx - 6, 39), (nx + 7, 39), (nx + 17 * nz, 33), (nx + 12 * nz, 45), (nx, 48), (nx - 11 * nz, 45)]), P(SKIN_SH, 200))
        for sx in (-1, 1): stroke(c, [(nx + sx * 13 * nz, 22), (nx + sx * 18 * nz, 31), (nx + sx * 14 * nz, 40)], 2.4, SKIN_SH, 170)
    elif nt == 'wide':
        c.drawPath(smooth_closed([(nx - 16 * nz, 32), (nx - 5, 38), (nx + 6, 38), (nx + 17 * nz, 31), (nx + 12 * nz, 43), (nx, 46), (nx - 11 * nz, 43)]), P(SKIN_SH, 220))
        for sx in (-1, 1): stroke(c, [(nx + sx * 14 * nz, 22), (nx + sx * 18 * nz, 30), (nx + sx * 14 * nz, 38)], 2.2, SKIN_SH, 170)
    else:
        c.drawPath(smooth_closed([(nx - 12 * nz, 31), (nx - 4, 37), (nx + 6, 37), (nx + 14 * nz, 30), (nx + 9 * nz, 41), (nx, 44), (nx - 8 * nz, 41)]), P(SKIN_SH, 185))
    c.drawCircle(nx - 1, 27, 5.5 * nz, P(SKIN_HI, 120, MaskFilter=blur(2)))
    if S.get('lines') == 'old' or (S.get('lines') and (sm_ > 0.3 or wn > 0.3)):        # the folds from the nose to the mouth corners
        for sx in (-1, 1): stroke(c, [(nx + sx * 18 * nz, 34), (fx * 1.1 + sx * 30, 48 - 3 * wn), (fx * 1.1 + sx * 31, 64)], 2.2, SKIN_SH, 150 + 80 * wn)
    # ---- mouth
    mx = fx * 1.1; my = 58 + 1.5 * chew; LIP = S['lip']
    mw = 20 + 10 * max(0.0, sm_); cv = 2 + 10 * sm_
    tk = getattr(ps, 'talk', 0.0)
    if wn > 0.5:                                             # teeth clenched: a wide flat mouth, the corners pulled back
        m = smooth_closed([(mx - 23, my - 5), (mx, my - 8), (mx + 23, my - 5), (mx + 25, my + 3), (mx + 20, my + 10), (mx, my + 12), (mx - 20, my + 10), (mx - 25, my + 3)])
        c.drawPath(m, P((112, 40, 52)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(mx - 21, my - 5.5, mx + 21, my + 9), 4, 4), P((255, 252, 246)))
        c.drawLine(mx - 22, my + 1.8, mx + 22, my + 1.8, SP((190, 170, 170), 1.6))
        for j in range(-3, 4): c.drawLine(mx + j * 6.5, my - 6, mx + j * 6.5, my + 10, SP((206, 190, 190), 1.3))
        c.restore(); c.drawPath(m, SP(LIP, 2.8))
    elif tk > 0.08 or puff > 0.15:
        o = max(tk, puff * 0.6)
        m = smooth_closed([(mx - 13 - 3 * max(0, sm_), my - 2), (mx, my - 4), (mx + 13 + 3 * max(0, sm_), my - 2), (mx + 9, my + 3 + 10 * o), (mx, my + 5 + 12 * o), (mx - 9, my + 3 + 10 * o)])
        c.drawPath(m, P((112, 40, 52)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(mx - 16, my - 8, mx + 16, my + 0.5), P((255, 252, 246))); c.restore()
        c.drawPath(m, SP(LIP, 3))
    elif sm_ > 0.55:
        m = smooth_closed([(mx - mw, my - cv * 0.5), (mx, my - 1), (mx + mw, my - cv * 0.5), (mx + mw * 0.62, my + cv * 0.9 + 4), (mx, my + cv * 1.25 + 5), (mx - mw * 0.62, my + cv * 0.9 + 4)])
        c.drawPath(m, P((116, 40, 50)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(mx - mw, my - 8, mx + mw, my + 5), P((255, 252, 246))); c.restore(); c.drawPath(m, SP(LIP, 2.4))
        for sx in (-1, 1): stroke(c, [(mx + sx * (mw + 4), my - cv * 0.7 - 5), (mx + sx * (mw + 8), my - cv * 0.2), (mx + sx * (mw + 4), my + 6)], 2.4, SKIN_SH, 200)
    elif fem:
        lp_ = smooth_closed([(mx - mw, my - cv * 0.5), (mx - 7, my - 5 - cv * 0.1), (mx, my - 2.5), (mx + 7, my - 5 - cv * 0.1), (mx + mw, my - cv * 0.5), (mx + mw * 0.5, my + 6 + cv * 0.5), (mx, my + 8 + cv * 0.6), (mx - mw * 0.5, my + 6 + cv * 0.5)])
        c.drawPath(lp_, P(LIP)); stroke(c, [(mx - mw, my - cv * 0.5), (mx, my + 1 + cv * 0.5), (mx + mw, my - cv * 0.5)], 2, mix(LIP, (60, 20, 40), 0.5), 220); c.drawOval(skia.Rect(mx - 7, my + 2 + cv * 0.4, mx + 5, my + 6 + cv * 0.5), P((255, 255, 255), 60))
    else:
        stroke(c, [(mx - mw, my - cv * 0.5), (mx - mw * 0.4, my + cv * 0.55), (mx + mw * 0.4, my + cv * 0.55), (mx + mw, my - cv * 0.5)], 4, mix(LIP, (90, 40, 50), 0.4))
        stroke(c, [(mx - mw * 0.5, my + 5), (mx, my + 7 + cv * 0.3), (mx + mw * 0.5, my + 5)], 2, LIP, 150)
    stroke(c, [(mx - 11, my + 17 + cv * 0.5), (mx, my + 20.5 + cv * 0.5), (mx + 11, my + 17 + cv * 0.5)], 2.6, SKIN_SH, 150)
    if S.get('stache'):                                      # a full grey moustache over the upper lip; its ends follow the mouth
        MC = S['stache']; dn = 3 * wn - 3 * max(0, sm_) + 1.5 * chew
        mo = smooth_closed([(nx - 34, 60 + dn), (nx - 28, 49), (nx - 9, 43), (nx, 46), (nx + 9, 43), (nx + 28, 49), (nx + 34, 60 + dn), (nx + 22, 58), (nx + 8, 56.5), (nx, 55), (nx - 8, 56.5), (nx - 22, 58)])
        c.drawPath(mo, P(MC)); c.drawPath(diffp(mo, (-4, -3)), P(mix(MC, (80, 80, 100), 0.5), 170)); c.drawPath(diffp(mo, (2, 2.5)), P(mix(MC, (255, 255, 255), 0.5), 210))
    if S.get('glasses'):
        GC = S['glasses']
        for sx in (-1, 1):
            gx = fx * 1.05 + sx * 27
            r_ = skia.RRect.MakeRectXY(skia.Rect(gx - 22, ey - 15, gx + 22, ey + 13), 6, 6); c.drawRRect(r_, P((255, 255, 255), 30)); c.drawRRect(r_, SP(GC, 4))
        c.drawLine(fx * 1.05 - 5, ey - 4, fx * 1.05 + 5, ey - 4, SP(GC, 3.6))
    c.restore()
    if S.get('glasses'):
        for sx in (-1, 1): c.drawLine(fx * 1.05 + sx * 49, S['eyy'] - 6 + 9 * pit, sx * 62, S['eyy'] - 10, SP(S['glasses'], 3.4))
    _hair_front(c, S['hair'], hs, yaw, d, HAIR, HAIR_SH, HAIR_HI, SKIN, SKIN_SH, SKIN_HI)
