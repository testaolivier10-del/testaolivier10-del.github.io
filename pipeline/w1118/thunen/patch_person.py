import re
s = open('person.py').read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:60], s.count(a))
    s = s.replace(a, b)

s = s.replace('"""People study, step 2', '"""w1118 thunen copy of the v5 people model with new design options for an 1820s farmer: tall leather boots (boots),\nrolled linen sleeves with bare forearms (rolled), a wool waistcoat (waistcoat), a neckerchief (kerchief), a straw hat (hair=\'straw\'),\na frown, two bone IK for the wrists (ik_r, ik_l) and a held prop drawn between the forearms and the hands (prop). Returns joint points.\nPeople study, step 2', 1)

# A. boots
rep("""def draw(c, ps, x=540, ground=1670, s=1.1, t=0.0, cl=None):""",
'''def boot_foot(c, x, y, sx, turn, cols):
    """a leather work boot on a foot turned out: heel under the ankle, rounded toe, a stacked heel, no laces"""
    cb_, cs_, so_ = cols
    L = 74 + 30 * turn
    c.save(); c.translate(x, y + 4); c.scale(sx, 1)
    up = smooth_closed([(-38, -8), (-40, -46), (-34, -84), (0, -90), (30, -82), (44, -56), (L - 30, -40), (L - 6, -30), (L + 4, -14), (L, -6), (-36, -6)])
    shaded(c, up, cb_, cs_, sh=(sx * 8, 5), rimL=mix(cb_, (255, 236, 200), 0.45), rl=(-sx * 3, -3))
    c.save(); c.clipPath(up, skia.ClipOp.kIntersect, True)
    stroke(c, [(L - 44, -46), (L - 36, -26), (L - 44, -6)], 3, cs_, 200)                                         # toe cap seam
    c.drawOval(skia.Rect(L - 40, -40, L - 6, -24), P(mix(cb_, (255, 240, 210), 0.35), 120, MaskFilter=blur(3)))   # polish on the toe
    c.restore()
    sole = skia.Path(); sole.addRoundRect(skia.Rect(-42, -12, L + 7, 6), 7, 7); c.drawPath(sole, P(so_))
    hl = skia.Path(); hl.addRoundRect(skia.Rect(-42, -14, -8, 8), 4, 4); c.drawPath(hl, P(mix(so_, (0, 0, 0), 0.25)))
    c.restore()


def ik2b(sh, side, tgt, l1=160.0, l2=148.0, bend=1.0):
    """two bone IK in the model's arm angles: upper arm angle from straight down (+ = out to the side) and the forearm bend"""
    dx, dy = tgt[0] - sh[0], tgt[1] - sh[1]; L = max(abs(l1 - l2) + 2, min(l1 + l2 - 0.5, math.hypot(dx, dy)))
    aD = math.atan2(side * dx, dy)
    al = math.acos(max(-1.0, min(1.0, (l1 * l1 + L * L - l2 * l2) / (2 * l1 * L))))
    a1 = aD + bend * al
    el = (sh[0] + side * math.sin(a1) * l1, sh[1] + math.cos(a1) * l1)
    a2 = math.atan2(side * (tgt[0] - el[0]), tgt[1] - el[1])
    return math.degrees(a1), math.degrees(a2 - a1)


def draw(c, ps, x=540, ground=1670, s=1.1, t=0.0, cl=None):''')
rep("""        shoe(c, feet['r'][0], feet['r'][1], -1, 0.35 + 0.5 * max(0.0, w), cfg.get('shoe')); shoe(c, feet['l'][0], feet['l'][1], 1, 0.35 + 0.5 * max(0.0, -w), cfg.get('shoe'))""",
"""        if cfg.get('boots'):
            boot_foot(c, feet['r'][0], feet['r'][1], -1, 0.35 + 0.5 * max(0.0, w), cfg['boots']); boot_foot(c, feet['l'][0], feet['l'][1], 1, 0.35 + 0.5 * max(0.0, -w), cfg['boots'])
        else:
            shoe(c, feet['r'][0], feet['r'][1], -1, 0.35 + 0.5 * max(0.0, w), cfg.get('shoe')); shoe(c, feet['l'][0], feet['l'][1], 1, 0.35 + 0.5 * max(0.0, -w), cfg.get('shoe'))""")
# boot shafts over the trouser legs, at the end of draw_legs
rep("""            c.drawPath(cuffb, P(mix(PANT, PANT_SH, 0.2))); c.drawLine(ft[0] - 33, ft[1] - 6, ft[0] + 33, ft[1] - 6, SP(PANT_SH, 2.6, 220)); c.drawLine(ft[0] - 30, ft[1] + 13, ft[0] + 30, ft[1] + 13, SP(PANT_SH, 2, 130))
        c.restore()""",
"""            if not cfg.get('boots'): c.drawPath(cuffb, P(mix(PANT, PANT_SH, 0.2))); c.drawLine(ft[0] - 33, ft[1] - 6, ft[0] + 33, ft[1] - 6, SP(PANT_SH, 2.6, 220)); c.drawLine(ft[0] - 30, ft[1] + 13, ft[0] + 30, ft[1] + 13, SP(PANT_SH, 2, 130))
        c.restore()
        if cfg.get('boots'):                                 # the trousers tucked into tall boots: the shaft follows the shin, a soft turned top
            cb_, cs_, so_ = cfg['boots']
            for k, sx in (('r', -1), ('l', 1)):
                kx, ky = knees[k]; ft = ank[k]
                top_ = (lerp(ft[0], kx, 0.62), lerp(ft[1], ky, 0.62))
                sh_ = limb((top_[0], top_[1]), (ft[0], ft[1] + 6), 98, 80, bulge=5, bu=0.3, side=sx)
                shaded(c, sh_, cb_, cs_, sh=(-d[0] * 1.1, -d[1] * 0.3), rimL=mix(cb_, (255, 236, 200), 0.4), rl=(d[0] * 0.4, d[1] * 0.4))
                c.save(); c.clipPath(sh_, skia.ClipOp.kIntersect, True)
                for j, v in enumerate((0.3, 0.55)):          # soft creases where the leather folds at the ankle
                    q = (lerp(ft[0], top_[0], v), lerp(ft[1], top_[1], v)); stroke(c, [(q[0] - 34, q[1] - 4), (q[0], q[1] + 6 - 3 * j), (q[0] + 32, q[1] - 6)], 3, cs_, 150)
                c.drawRect(skia.Rect(top_[0] - 70, top_[1] - 10, top_[0] + 70, top_[1] + 22), P(AO, 70, MaskFilter=blur(6)))
                c.restore()
                tp = smooth_closed([(top_[0] - 52, top_[1] + 4), (top_[0] - 30, top_[1] - 8), (top_[0], top_[1] - 11), (top_[0] + 30, top_[1] - 8), (top_[0] + 52, top_[1] + 4),
                                    (top_[0] + 48, top_[1] + 22), (top_[0] + 16, top_[1] + 18), (top_[0] - 14, top_[1] + 20), (top_[0] - 48, top_[1] + 22)])
                c.drawPath(tp, P(mix(cb_, (240, 210, 170), 0.25))); c.drawPath(diffp(tp, (0, -5)), P(mix(cb_, (255, 236, 200), 0.45), 200))""")
# B. rolled sleeves: the cloth stops just below the elbow
rep("""        path = op(op(upa, fore), ec)""",
"""        if cfg.get('rolled'):
            fore = limb(el, (el[0] + d2[0] * 40, el[1] + d2[1] * 40), 70, 68, bulge=4, bu=0.3, side=-side)
        path = op(op(upa, fore), ec)""")
rep("""        if bf > 1:
            bf *= (1 - fz)""", """        if bf > 1:
            bf *= (1 - fz)
        if cfg.get('rolled'): bf = 0.0""")
# H. IK before the arm geometry
rep("""    AR = arm_geo(sh_r, -1,""", """    if getattr(ps, 'ik_r', None) is not None: ps.r_up, ps.r_fore = ik2b(sh_r, -1, ps.ik_r, bend=getattr(ps, 'ik_bend_r', 1.0))
    if getattr(ps, 'ik_l', None) is not None: ps.l_up, ps.l_fore = ik2b(sh_l, 1, ps.ik_l, bend=getattr(ps, 'ik_bend_l', 1.0))
    rolled = cfg.get('rolled', False)
    AR = arm_geo(sh_r, -1,""")
# C. skip early wrists and hands in rolled mode
rep("""    for A_ in (AL, AR):                                     # the wrist and a little forearm, for when the sleeve slips back""",
"""    for A_ in ((AL, AR) if not rolled else ()):              # the wrist and a little forearm, for when the sleeve slips back""")
rep("""    for A_, pose, palm in ((AL, ps.l_hand, False), (AR, ps.r_hand, ps.r_palm)):
        ang""", """    def draw_hands():
      for A_, pose, palm in ((AL, ps.l_hand, False), (AR, ps.r_hand, ps.r_palm)):
        ang""")
rep("""        H.hand(c, hw, ang, ts, 1.22 * A_['gz'], skin=SKIN, shade=SKIN_SH, hi=SKIN_HI, light=LIGHT, palm=palm, narrow=nar, **pose)
""", """        H.hand(c, hw, ang, ts, 1.22 * A_['gz'], skin=SKIN, shade=SKIN_SH, hi=SKIN_HI, light=LIGHT, palm=palm, narrow=nar, **pose)
    if not rolled: draw_hands()
""")
# fix indentation of the hand loop body (it was 8 spaces, keep; loop now at 6)
rep("""    for A_ in (AL, AR):                                     # ribbed cuffs: a soft band the sleeve gathers into (not a block)""",
"""    for A_ in ((AL, AR) if not rolled else ()):              # ribbed cuffs: a soft band the sleeve gathers into (not a block)""")
rep("""    if sit: draw_legs()
    # ---------------- head""", """    if rolled:                                               # bare forearms out of the rolled linen, then the held prop, then the hands on it
        for A_ in (AL, AR):
            el, wr, d2 = A_['el'], A_['wr'], A_['d2']; sd = A_['side']
            fa = limb((el[0] + d2[0] * 18, el[1] + d2[1] * 18), (wr[0] + d2[0] * 8, wr[1] + d2[1] * 8), 62, 44, bulge=7, bu=0.28, side=-sd)
            shaded(c, fa, SKIN, SKIN_SH, sh=(-d[0] * 0.9, -d[1] * 0.4), rimL=SKIN_HI, rl=(d[0] * 0.4, d[1] * 0.4))
            c.save(); c.clipPath(fa, skia.ClipOp.kIntersect, True)                     # a few hairs and the tendon line on the forearm
            stroke(c, [(lerp(el[0], wr[0], 0.45), lerp(el[1], wr[1], 0.45)), (lerp(el[0], wr[0], 0.65) + 3, lerp(el[1], wr[1], 0.65)), (lerp(el[0], wr[0], 0.85), lerp(el[1], wr[1], 0.85))], 2.2, SKIN_SH, 90)
            c.restore()
            # the rolled linen: two soft folds wrapped round the arm just below the elbow (organic edges, never a capsule)
            rc = (el[0] + d2[0] * 30, el[1] + d2[1] * 30); n2 = (-d2[1], d2[0]); ww = 44
            def R_(u, v): return (rc[0] + n2[0] * u + d2[0] * v, rc[1] + n2[1] * u + d2[1] * v)
            roll = smooth_closed([R_(-ww, -14), R_(-ww * 0.5, -19), R_(0, -17), R_(ww * 0.5, -20), R_(ww + 2, -12), R_(ww + 5, 2), R_(ww, 15), R_(ww * 0.4, 19), R_(-ww * 0.2, 17), R_(-ww * 0.7, 20), R_(-ww - 4, 10), R_(-ww - 5, -2)])
            shaded(c, roll, mix(TOP, TOP_HI, 0.2), TOP_SH, sh=(-d[0] * 0.7, -d[1] * 0.7), rimL=TOP_HI, rl=(d[0] * 0.3, d[1] * 0.3))
            stroke(c, [R_(-ww + 4, 1), R_(0, 5), R_(ww - 4, 0)], 3, TOP_SH, 200)
            stroke(c, [R_(-ww * 0.6, 12), R_(-ww * 0.1, 14), R_(ww * 0.3, 11)], 2.2, TOP_SH, 130)
            c.drawPath(diffp(roll, (0, -6)), P(AO, 40))
        if getattr(ps, 'prop', None): ps.prop(c, AR, AL)
        draw_hands()
    if cfg.get('kerchief'):                                  # a knotted neckerchief at the open collar
        KC = cfg['kerchief']; KS = mix(KC, (40, 10, 30), 0.35)
        kn = T(0, 28)
        for sd in (-1, 1):
            tail = smooth_closed([(kn[0] + sd * 4, kn[1]), (kn[0] + sd * 22, kn[1] + 30), (kn[0] + sd * 14, kn[1] + 64), (kn[0] + sd * 2, kn[1] + 58), (kn[0] - sd * 2, kn[1] + 14)])
            shaded(c, tail, KC, KS, sh=(-d[0] * 0.6, -d[1] * 0.6))
        band = smooth_closed([T(-38, 50), T(0, 34), T(38, 50), T(34, 40), T(0, 24), T(-34, 40)]); c.drawPath(band, P(KC)); c.drawPath(diffp(band, (0, -4)), P(KS))
        knot = skia.Path(); knot.addOval(skia.Rect(kn[0] - 14, kn[1] - 12, kn[0] + 14, kn[1] + 14)); shaded(c, knot, KC, KS, sh=(-d[0] * 0.5, -d[1] * 0.5), rimL=mix(KC, (255, 255, 255), 0.4), rl=(d[0] * 0.25, d[1] * 0.25))
        for j in range(3): c.drawCircle(kn[0] - 30 + j * 30, kn[1] + 16, 3, P(mix(KC, (255, 255, 255), 0.6), 160))
    G = dict(AR=AR, AL=AL, head=head_c)
    if sit: draw_legs()
    # ---------------- head""")
# D. waistcoat over the shirt, clipped to the torso
rep("""    # the arms hang BESIDE the body, so the only mark""", """    if cfg.get('waistcoat'):                                 # a wool waistcoat: V neck showing the shirt, six buttons, two welt pockets, points at the front
        WC = cfg['waistcoat']; WS = mix(WC, (20, 10, 30), 0.35); WH = mix(WC, (255, 236, 200), 0.35)
        wv = skia.Path(); wv.addPoly([skia.Point(*T(-104, 40)), skia.Point(*T(-46, 52)), skia.Point(*T(-8, -60)), skia.Point(*T(8, -60)), skia.Point(*T(46, 52)), skia.Point(*T(104, 40)), skia.Point(*T(122, -70)),
                                       skia.Point(wst[0] + 126, wst[1] + 40), skia.Point(wst[0] + 22, wst[1] + 40), skia.Point(wst[0], wst[1] + 66), skia.Point(wst[0] - 22, wst[1] + 40), skia.Point(wst[0] - 126, wst[1] + 40), skia.Point(*T(-122, -70))], True)
        wv = rounded(wv, 8)
        c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True)
        c.drawPath(wv, P((0, 0, 0), 60, MaskFilter=blur(6)))
        c.clipPath(wv, skia.ClipOp.kIntersect, True)
        c.drawPaint(P(WC))
        c.drawPath(smooth_closed([T(40, 60), T(130, 20), (wst[0] + 130, wst[1] + 60), (wst[0] + 40, wst[1] + 60), T(56, -90)]), P(WS, 150, MaskFilter=blur(14)))
        c.drawOval(skia.Rect(T(-60, 0)[0] - 50, T(-60, 0)[1] - 30, T(-60, 0)[0] + 50, T(-60, 0)[1] + 80), P(WH, 60, MaskFilter=blur(18)))
        p0, p1 = T(0, -60), (wst[0], wst[1] + 60); c.drawLine(p0[0] + 2, p0[1], p1[0] + 2, p1[1], SP(WS, 3.4, 230))
        for j in range(6):
            q_ = (lerp(p0[0], p1[0], 0.06 + j * 0.16) - 6, lerp(p0[1], p1[1], 0.06 + j * 0.16)); c.drawCircle(q_[0], q_[1], 6, P((214, 190, 120))); c.drawCircle(q_[0] - 1.5, q_[1] - 1.5, 2.4, P((255, 240, 190)))
        for sd in (-1, 1):
            a_ = (wst[0] + sd * 34, wst[1] - 48); b_ = (wst[0] + sd * 86, wst[1] - 52); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(WS, 5)); c.drawLine(a_[0], a_[1] - 4, b_[0], b_[1] - 4, SP(WH, 2, 150))
            stroke(c, [T(sd * 30, -100), T(sd * 54, -120), T(sd * 70, -110)], 2.6, WS, 110)
        c.restore()
        c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True)
        lap = skia.Path(); lap.moveTo(*T(-46, 52)); lap.lineTo(*T(-8, -60)); lap.moveTo(*T(46, 52)); lap.lineTo(*T(8, -60)); c.drawPath(lap, SP(WH, 3, 200)); c.restore()
    # the arms hang BESIDE the body, so the only mark""")
# F. straw hat
rep("""    elif hstyle == 'beanie':""", """    elif hstyle == 'straw':                                  # a farmer's straw hat: wide woven brim, low crown, a dark band; short hair at the temples
        HAT = cfg.get('hat', (232, 196, 120)); HAT_SH = mix(HAT, (90, 50, 30), 0.38); HAT_HI = mix(HAT, (255, 250, 220), 0.5)
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 54, -76), (sx * 66, -70), (sx * 66, -26), (sx * 61, -32), (sx * 57, -52)]), P(mix(HAIR, SKIN_SH, 0.2)))
        c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(-80, -110, 80, -56), P(AO, 110, MaskFilter=blur(10))); c.restore()   # the brim's shade on the brow
        crown = smooth_closed([(-62 + hs, -92), (-60 + hs, -140), (-44 + hs, -166), (hs, -172), (44 + hs, -166), (60 + hs, -140), (62 + hs, -92)])
        brim = skia.Path(); brim.addOval(skia.Rect(-136 + hs * 0.6, -112, 136 + hs * 0.6, -66))
        shaded(c, brim, mix(HAT, HAT_SH, 0.25), HAT_SH, sh=(-d[0] * 0.8, 6), rimL=HAT_HI, rl=(d[0] * 0.4, -3))
        c.save(); c.clipPath(brim, skia.ClipOp.kIntersect, True)
        for j in range(1, 6): c.drawOval(skia.Rect(-136 + j * 13 + hs * 0.6, -112 + j * 3.2, 136 - j * 13 + hs * 0.6, -66 - j * 3.2), SP(HAT_SH, 1.6, 110))
        c.restore()
        shaded(c, crown, HAT, HAT_SH, sh=(-d[0] * 1.1, -d[1] * 0.5), rimL=HAT_HI, rl=(d[0] * 0.45, d[1] * 0.45))
        c.save(); c.clipPath(crown, skia.ClipOp.kIntersect, True)
        for j in range(5): c.drawLine(-70, -160 + j * 14, 70, -158 + j * 14, SP(HAT_SH, 1.6, 90))
        for j in range(-6, 7): c.drawLine(j * 11 + hs, -172, j * 12 + hs, -90, SP(HAT_HI, 1.2, 70))
        c.drawRect(skia.Rect(-80, -112, 80, -92), P(cfg.get('band', (70, 44, 40))))
        c.drawRect(skia.Rect(-80, -112, 80, -108), P(mix(cfg.get('band', (70, 44, 40)), (255, 255, 255), 0.25)))
        c.restore()
    elif hstyle == 'beanie':""")
# G. frown
rep("""    mx = fx * 1.1; mw = 20 + 10 * ps.smile; cv = 2 + 10 * ps.smile; my = 58""", """    mx = fx * 1.1; mw = 20 + 10 * ps.smile - 3 * getattr(ps, 'frown', 0.0); cv = 2 + 10 * ps.smile - 9 * getattr(ps, 'frown', 0.0); my = 58""")
# I. return the joints in screen space
i = s.index('\n\ndef track(')
tail = s[:i].rstrip()
assert tail.endswith('    c.restore()\n    c.restore()')
s = tail + """
    def W_(p): return (x + p[0] * s * bw, ground + p[1] * s)
    return dict(wr_r=W_(G['AR']['wr']), wr_l=W_(G['AL']['wr']), el_r=W_(G['AR']['el']), el_l=W_(G['AL']['el']), head=W_(G['head']))""" + s[i:]
open('person.py', 'w').write(s)
print('patched')
