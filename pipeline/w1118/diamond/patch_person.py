"""Adds the w1118 diamond design options to a COPY of the v5 people model (the shared one is untouched). Run once on a fresh copy."""
s = open('person.py').read()
s = s.replace('"""People study, step 2', '"""w1118 diamond copy of people v5 (adds: cap pushed back, wide brim hat, waistcoat, neck cloth, sunburn, dry lips, dust, held props and late hands).\nPeople study, step 2', 1)
old = """    for A_, pose, palm in ((AL, ps.l_hand, False), (AR, ps.r_hand, ps.r_palm)):
        ang = math.atan2(A_['d3'][1], A_['d3'][0]); hw = (A_['wr'][0] + A_['d2'][0] * 6, A_['wr'][1] + A_['d2'][1] * 6)
        ts = A_['side'] if A_['d3'][1] > 0 else -A_['side']
        nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (pose['curls'][2] - 0.05) / 0.5)))
        H.hand(c, hw, ang, ts, 1.22 * A_['gz'], skin=SKIN, shade=SKIN_SH, hi=SKIN_HI, light=LIGHT, palm=palm, narrow=nar, **pose)"""
new = """    late = getattr(ps, 'late', ()); LATE_ = []
    for A_, pose, palm, nm in ((AL, ps.l_hand, False, 'l'), (AR, ps.r_hand, ps.r_palm, 'r')):
        ang = math.atan2(A_['d3'][1], A_['d3'][0]); hw = (A_['wr'][0] + A_['d2'][0] * 6, A_['wr'][1] + A_['d2'][1] * 6)
        ang += math.radians(getattr(ps, nm + '_hrot', 0.0))
        ts = A_['side'] if A_['d3'][1] > 0 else -A_['side']
        nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (pose['curls'][2] - 0.05) / 0.5)))
        M_ = c.getTotalMatrix(); wp = M_.mapXY(*hw); HANDS[nm] = dict(w=(wp.x(), wp.y()), ang=ang, ts=ts, s=1.22 * A_['gz'])
        job = (hw, ang, ts, A_['gz'], pose, palm, nar, getattr(ps, nm + '_prop', None), getattr(ps, nm + '_over', None))
        if nm in late: LATE_.append(job); continue
        _hand_job(c, *job)"""
assert old in s; s = s.replace(old, new)
helper = '''
HANDS = {}


def _hand_job(c, hw, ang, ts, gz, pose, palm, nar, prop, over):
    """a hand with what it holds: the prop goes under the fingers, `over` (the part of a thing in front of the fingers) on top"""
    if prop: prop(c, hw, ang, ts, 1.22 * gz)
    Wf = H.hand(c, hw, ang, ts, 1.22 * gz, skin=SKIN, shade=SKIN_SH, hi=SKIN_HI, light=LIGHT, palm=palm, narrow=nar, **pose)
    if over: over(c, Wf, hw, ang, ts, 1.22 * gz)


def draw(c, ps,'''
s = s.replace('\n\ndef draw(c, ps,', helper, 1)
old_end = """        c.restore(); c.drawPath(bnd, SP(HAT_SH, 2.5, 200))
    c.restore()
    c.restore()
"""
assert old_end in s
s = s.replace(old_end, """        c.restore(); c.drawPath(bnd, SP(HAT_SH, 2.5, 200))
    HEADX(c, ps, cfg, d, hs, fx, yaw)
    c.restore()
    for job in LATE_: _hand_job(c, *job)
    c.restore()
""")
old_f = "    c.drawPath(smooth_closed([(-40 + fx, 70), (fx, 82), (40 + fx, 70), (28 + fx, 92), (fx, 98), (-28 + fx, 92)]), P(SKIN_SH, 60))      # under the lower lip and chin\n"
assert old_f in s
s = s.replace(old_f, old_f + """    if cfg.get('sunburn'):                                    # sun: red across the nose and the tops of the cheeks
        sb = cfg['sunburn']
        c.drawOval(skia.Rect(fx - 66, -8, fx + 66, 40), P((236, 104, 84), 90 * sb, MaskFilter=blur(12)))
        c.drawOval(skia.Rect(fx - 50, -70, fx + 50, -44), P((236, 120, 96), 60 * sb, MaskFilter=blur(10)))
    if cfg.get('dust'):
        rs = np.random.default_rng(11)
        for _ in range(9): c.drawCircle(rs.uniform(-55, 55), rs.uniform(-60, 80), rs.uniform(5, 12), P((176, 140, 104), 55 * cfg['dust'], MaskFilter=blur(4)))
""")
old_m = "    stroke(c, [(mx - 11, my + 17 + cv * 0.5), (mx, my + 20.5 + cv * 0.5), (mx + 11, my + 17 + cv * 0.5)], 2.6, SKIN_SH, 170)                  # under the lower lip\n"
assert old_m in s
s = s.replace(old_m, old_m + """    if cfg.get('dry') and sc <= 0.2 and ps.smile <= 0.55 and not getattr(ps, 'drink', 0):   # dry, cracked lips: a pale lower lip with short splits
        lp_ = smooth_closed([(mx - mw * 0.8, my + 1), (mx, my + 4), (mx + mw * 0.8, my + 1), (mx + mw * 0.55, my + 11), (mx, my + 13), (mx - mw * 0.55, my + 11)])
        c.drawPath(lp_, P((214, 150, 140), 200)); c.drawPath(diffp(lp_, (0, -3)), P((236, 196, 184), 160))
        for k_ in (-0.45, -0.1, 0.3, 0.55): c.drawLine(mx + mw * k_, my + 3, mx + mw * k_ + 1.5, my + 9, SP((150, 84, 84), 1.6, 200))
        stroke(c, [(mx - mw, my - 0.5), (mx - mw * 0.4, my + 2.5), (mx + mw * 0.4, my + 2.5), (mx + mw, my - 0.5)], 3, (150, 80, 80))
""")
s = s.replace("    elif hstyle == 'beanie':", """    elif hstyle in ('cap', 'brim'):                          # short hair under a hat: the hat itself is drawn last, in HEADX
        cap_ = smooth_closed([(-63, -46), (-68, -90), (-50 + hs, -120), (hs, -128), (50 + hs, -120), (68, -90), (63, -46), (55, -72), (30 + hs, -84), (hs, -90), (-30 + hs, -84), (-55, -72)])
        shaded(c, cap_, HAIR, HAIR_SH, sh=(-d[0] * 0.8, -d[1] * 0.4), rimL=HAIR_HI, rl=(d[0] * 0.4, d[1] * 0.4))
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 56, -74), (sx * 66, -66), (sx * 65, -26), (sx * 60, -32)]), P(mix(HAIR, SKIN_SH, 0.3)))
        if hstyle == 'cap':                                  # loose strands fall on the forehead under the pushed back cap
            for (a_, b_) in ((-30, -2), (-8, 14), (14, 30)): stroke(c, [(a_ + hs, -100), (a_ + 8 + hs, -86), (b_ + hs, -74)], 5, HAIR, 230)
    elif hstyle == 'beanie':""", 1)
s += '''

def HEADX(c, ps, cfg, d, hs, fx, yaw):
    """hats over the hair, in head space"""
    h = cfg.get('hair')
    if h == 'cap':                                           # a baseball cap pushed far back: the crown sits on the back of the head, the brim tilts up
        CC = cfg.get('hat', (200, 70, 60)); CS = mix(CC, (40, 20, 40), 0.35); CH = mix(CC, (255, 255, 255), 0.35)
        crown = smooth_closed([(-70, -98), (-60 + hs, -142), (-20 + hs, -164), (24 + hs, -164), (62 + hs, -142), (72, -98), (40 + hs, -112), (0 + hs, -116), (-40 + hs, -112)])
        shaded(c, crown, CC, CS, sh=(-d[0] * 1.1, -d[1] * 0.6), rimL=CH, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(crown, skia.ClipOp.kIntersect, True)
        for xx in (-26, 26): stroke(c, [(xx + hs, -114), (xx * 0.6 + hs, -142), (hs, -164)], 2.4, CS, 170)
        c.drawCircle(hs, -162, 7, P(CS)); c.restore()
        brim = smooth_closed([(-58 + hs, -150), (-30 + hs, -186), (20 + hs, -194), (60 + hs, -178), (70 + hs, -150), (30 + hs, -160), (-20 + hs, -160)])
        shaded(c, brim, mix(CC, CS, 0.3), CS, sh=(0, 5), rimL=CH, rl=(d[0] * 0.4, d[1] * 0.4))
        stroke(c, [(-52 + hs, -154), (0 + hs, -166), (62 + hs, -154)], 2.4, CS, 200)
    elif h == 'brim':                                        # a wide brimmed straw hat: a dented crown, a band, a wide brim
        HC = cfg.get('hat', (214, 178, 112)); HS = mix(HC, (70, 40, 30), 0.35); HH = mix(HC, (255, 255, 255), 0.35); BD = cfg.get('band', (90, 50, 40))
        bw_ = 168
        c.drawOval(skia.Rect(-bw_ + hs, -112, bw_ + hs, -60), P(AO, 120, MaskFilter=blur(10)))
        brim_back = smooth_closed([(-bw_ + hs, -94), (-120 + hs, -122), (0 + hs, -136), (120 + hs, -122), (bw_ + hs, -94), (0 + hs, -104)])
        shaded(c, brim_back, mix(HC, HS, 0.4), HS, sh=(0, 4))
        crown = smooth_closed([(-74 + hs, -98), (-70 + hs, -160), (-46 + hs, -192), (-10 + hs, -182), (0 + hs, -172), (10 + hs, -182), (46 + hs, -192), (70 + hs, -160), (74 + hs, -98)])
        shaded(c, crown, HC, HS, sh=(-d[0] * 1.2, -d[1] * 0.4), rimL=HH, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(crown, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(-90 + hs, -128, 90 + hs, -100), P(BD)); c.drawRect(skia.Rect(-90 + hs, -128, 90 + hs, -123), P(mix(BD, (255, 255, 255), 0.25)))
        stroke(c, [(0 + hs, -174), (2 + hs, -150), (0 + hs, -128)], 3, HS, 160)
        for j in range(-5, 6): c.drawLine(j * 14 + hs, -186, j * 14 + 3 + hs, -130, SP(HS, 1.4, 60))
        c.restore()
        front = smooth_closed([(-bw_ - 6 + hs, -96), (-110 + hs, -86), (0 + hs, -76), (110 + hs, -86), (bw_ + 6 + hs, -96), (bw_ - 10 + hs, -104), (0 + hs, -98), (-bw_ + 10 + hs, -104)])
        shaded(c, front, HC, HS, sh=(0, -5), rimL=HH, rl=(0, -3))
        stroke(c, [(-bw_ + 20 + hs, -96), (0 + hs, -82), (bw_ - 20 + hs, -96)], 2, HS, 120)


def extras(c, ps, cfg, T, wst, whole, torso, d, TOP, TOP_SH, TOP_HI, hx):
    """waistcoat, dust on the clothes, a canteen strap, a neck cloth: drawn over the shirt"""
    if cfg.get('waist'):                                     # an open waistcoat: two front panels with a gap down the middle
        VC = cfg['waist']; VS = mix(VC, (20, 10, 20), 0.35); VH = mix(VC, (255, 230, 200), 0.3)
        c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True)
        for sd in (-1, 1):
            pn = skia.Path(); pn.addPoly([skia.Point(*T(sd * 30, 40)), skia.Point(*T(sd * 110, 40)), skia.Point(*T(sd * 130, -120)), skia.Point(wst[0] + sd * 130, wst[1] + 50),
                                          skia.Point(wst[0] + sd * 34 + hx, wst[1] + 56), skia.Point(*T(sd * 24, -150)), skia.Point(*T(sd * 22, -20))], True)
            shaded(c, pn, VC, VS, sh=(-d[0] * 1.4 * (1 if sd > 0 else 0.4), -d[1] * 0.4), rimL=VH, rl=(d[0] * 0.4, d[1] * 0.4))
            ed = skia.Path(); ed.moveTo(*T(sd * 30, 40)); ed.lineTo(*T(sd * 22, -20)); ed.lineTo(*T(sd * 24, -150)); ed.lineTo(wst[0] + sd * 34 + hx, wst[1] + 56)
            c.drawPath(ed, SP(VS, 5)); c.drawPath(ed, SP(VH, 1.6, 140))
            pk = T(sd * 70, -132); c.drawLine(pk[0] - 24, pk[1], pk[0] + 24, pk[1] - 4 * sd, SP(VS, 4))
            pk2 = T(sd * 66, -40); c.drawLine(pk2[0] - 20, pk2[1], pk2[0] + 20, pk2[1], SP(VS, 3.4))
        for v in (-60, -110, -160):
            b_ = T(-22, v); c.drawCircle(b_[0], b_[1], 5, P((210, 190, 140)))
        c.restore()
    if cfg.get('dustcl'):                                    # dust on the clothes: soft pale patches
        rs = np.random.default_rng(5)
        c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
        for _ in range(16):
            p_ = T(rs.uniform(-150, 150), rs.uniform(-240, 30)); c.drawOval(skia.Rect(p_[0] - 26, p_[1] - 14, p_[0] + 26, p_[1] + 14), P((226, 200, 160), 50 * cfg['dustcl'], MaskFilter=blur(9)))
        c.restore()
    if cfg.get('canteen'):                                   # a strap across the chest down to the canteen at the hip
        SC = cfg.get('canteen_strap', (110, 80, 56))
        a_, b_ = T(-80, 30), (wst[0] + 96 + hx, wst[1] - 10)
        c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(mix(SC, (0, 0, 0), 0.3), 16)); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(SC, 12)); c.drawLine(a_[0] - 2, a_[1] - 4, b_[0] - 2, b_[1] - 4, SP(mix(SC, (255, 255, 255), 0.3), 2.5, 160))
        CANT[0] = c.getTotalMatrix().mapXY(wst[0] + 104 + hx, wst[1] + 10)
    if cfg.get('neck'):                                      # a cotton neck cloth knotted at the throat, its point on the chest
        NC = cfg['neck']; NS = mix(NC, (30, 10, 30), 0.35); NH = mix(NC, (255, 255, 255), 0.35)
        band = smooth_closed([T(-58, 60), T(0, 44), T(58, 60), T(56, 30), T(0, 14), T(-56, 30)])
        shaded(c, band, NC, NS, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=NH, rl=(d[0] * 0.4, d[1] * 0.4))
        tri = smooth_closed([T(-38, 26), T(38, 26), T(4, -44)])
        shaded(c, tri, NC, NS, sh=(-d[0] * 1.2, -d[1] * 0.5))
        k0 = T(0, 22); k1 = T(-2, 25)
        c.drawCircle(k0[0], k0[1], 13, P(NS)); c.drawCircle(k1[0], k1[1], 9, P(NC))
        stroke(c, [T(-20, 18), T(-6, -6), T(2, -36)], 2.2, NS, 170); stroke(c, [T(20, 18), T(10, -4), T(4, -36)], 2.2, NS, 140)


CANT = [None]
'''
old_x = "    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)\n    c.save(); c.clipPath(torso, skia.ClipOp.kIntersect, True)\n    hb ="
assert old_x in s
s = s.replace(old_x, "    extras(c, ps, cfg, T, wst, whole, torso, d, TOP, TOP_SH, TOP_HI, hx)\n" + old_x)
open('person.py', 'w').write(s)
print('patched')
