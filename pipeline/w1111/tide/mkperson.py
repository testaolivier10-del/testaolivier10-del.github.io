"""builds tperson.py: a copy of the v5 people model (/home/claude/guy/person.py) with new options built for this video:
hair='bucket' (a bucket hat), boots=(col, shade, hi) (rubber boots to below the knee), age=True (lines by the eyes), plain shoes."""
src = open('/home/claude/guy/person.py').read()
def rep(a, b, n=1):
    global src
    assert src.count(a) == n, (a, src.count(a))
    src = src.replace(a, b)
rep("def shoe(c, x, y, sx, turn, cols=None):", "def shoe(c, x, y, sx, turn, cols=None, plain=False):")
rep("    for j in range(3):\n        u = j / 2; px, py = lerp(22, L - 50, u), lerp(-68, -44, u)", "    for j in (range(3) if not plain else ()):\n        u = j / 2; px, py = lerp(22, L - 50, u), lerp(-68, -44, u)")
rep("0.35 + 0.5 * max(0.0, w), cfg.get('shoe'))", "0.35 + 0.5 * max(0.0, w), cfg.get('shoe'), plain=bool(cfg.get('boots')))")
rep("0.35 + 0.5 * max(0.0, -w), cfg.get('shoe'))", "0.35 + 0.5 * max(0.0, -w), cfg.get('shoe'), plain=bool(cfg.get('boots')))")
BOOTS = '''        if cfg.get('boots'):                                     # rubber boots to below the knee: the trouser legs are tucked in and bunch over the top
            BC, BS, BH = cfg['boots']; by_ = -268
            c.save(); c.clipRect(skia.Rect(-400, by_, 400, 30))
            shaded(c, legs, BC, BS, sh=(-d[0] * 1.4, -d[1] * 0.4), rimL=BH, rl=(d[0] * 0.5, d[1] * 0.5))
            for k, sx in (('r', -1), ('l', 1)):
                ft = ank[k]
                c.drawPath(smooth_closed([(ft[0] - 22, by_ + 30), (ft[0] - 12, by_ + 24), (ft[0] - 10, -30), (ft[0] - 20, -26)]), P(BH, 90))           # a long soft shine down the shaft
                stroke(c, [(ft[0] - 30, ft[1] + 34), (ft[0], ft[1] + 44), (ft[0] + 30, ft[1] + 32)], 3, BS, 200)                              # the crease at the ankle
                stroke(c, [(ft[0] - 26, ft[1] + 16), (ft[0] + 2, ft[1] + 24), (ft[0] + 26, ft[1] + 14)], 2.6, BS, 150)
            c.drawRect(skia.Rect(-400, by_, 400, by_ + 15), P(mix(BC, BH, 0.45))); c.drawRect(skia.Rect(-400, by_ + 15, 400, by_ + 19), P(BS))  # the rolled top edge
            c.restore()
            c.drawRect(skia.Rect(-400, by_ - 12, 400, by_), P(AO, 90, MaskFilter=blur(5)))                                                   # the trousers' shadow line above the boot
            for k, sx in (('r', -1), ('l', 1)):
                ft = ank[k]; stroke(c, [(ft[0] - 30, by_ - 16), (ft[0] - 4, by_ - 6), (ft[0] + 28, by_ - 18)], 3, PANT_SH, 170)
        c.restore()
    if not sit: draw_legs()'''
rep("        c.restore()\n    if not sit: draw_legs()", BOOTS)
HAT = '''    elif hstyle == 'bucket':                                 # a cotton bucket hat: a soft crown, a band, and a stitched brim that slopes down all round
        HAT = cfg.get('hat', (150, 160, 110)); HAT_SH = mix(HAT, (40, 30, 50), 0.36); HAT_HI = mix(HAT, (255, 255, 255), 0.42); BAND = cfg.get('band', (70, 60, 70))
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 55, -64), (sx * 66, -58), (sx * 65, -20), (sx * 60, -27), (sx * 57, -44)]), P(HAIR))    # his hair shows at the sides, under the brim
        c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
        c.drawPath(smooth_closed([(-90, -90), (0, -84), (90, -90), (92, -46), (0, -34), (-92, -46)]), P(AO, 100, MaskFilter=blur(7))); c.restore()   # the brim's shadow over the forehead
        crown = smooth_closed([(-66, -80), (-67, -124), (-54 + hs, -157), (hs, -166), (54 + hs, -157), (67, -124), (66, -80), (0, -88)])
        shaded(c, crown, HAT, HAT_SH, sh=(-d[0] * 1.3, -d[1] * 0.6), rimL=HAT_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(crown, skia.ClipOp.kIntersect, True)
        bnd = smooth_closed([(-72, -118), (0, -127), (72, -118), (72, -92), (0, -101), (-72, -92)])
        c.drawPath(bnd, P(BAND)); c.drawPath(diffp(bnd, (0, 5)), P(mix(BAND, (255, 255, 255), 0.25)))
        stroke(c, [(-40 + hs, -150), (hs, -158), (40 + hs, -150)], 2.4, HAT_SH, 120)                                                      # the seam round the top of the crown
        stroke(c, [(hs * 1.5, -160), (hs * 1.3, -144), (hs * 1.1, -128)], 2.2, HAT_SH, 110)
        c.restore()
        brim = smooth_closed([(-64, -93), (0, -101), (64, -93), (92, -76), (112, -52), (104, -41), (68, -55), (0, -63), (-68, -55), (-104, -41), (-112, -52), (-92, -76)])
        c.drawPath(brim, P(AO, 90, MaskFilter=blur(5)))
        shaded(c, brim, mix(HAT, HAT_HI, 0.12), HAT_SH, sh=(-d[0] * 1.1, -d[1] * 0.2), rimL=HAT_HI, rl=(d[0] * 0.4, d[1] * 0.5))
        c.save(); c.clipPath(brim, skia.ClipOp.kIntersect, True)
        for o_, a_ in ((0, 150), (9, 110), (18, 80)):                                                                                       # rows of stitching round the brim
            stroke(c, [(-104, -50 - o_ * 0.6), (-60, -64 - o_), (0, -71 - o_), (60, -64 - o_)], 1.8, HAT_SH, a_); stroke(c, [(0, -71 - o_), (60, -64 - o_), (104, -50 - o_ * 0.6)], 1.8, HAT_SH, a_)
        c.drawPath(smooth_closed([(-70, -96), (0, -104), (70, -96), (70, -86), (0, -93), (-70, -86)]), P(HAT_SH, 120, MaskFilter=blur(3)))        # where the crown meets the brim
        c.restore()
    c.restore()
    c.restore()


def track(keys, t):'''
rep("    c.restore()\n    c.restore()\n\n\ndef track(keys, t):", HAT)
AGE = '''        if cfg.get('age'):                                   # an older face: lines at the outer corner of each eye and a fold from the nose toward the mouth
            for j, (ly, ln) in enumerate(((-5, 8), (2, 9), (9, 7))):
                c.drawLine(ex + sx * 21 * w_, ey + ly * 0.5 + 1, ex + sx * (21 + ln) * w_, ey + ly + 1.5, SP(SKIN_SH, 1.7, 150))
            stroke(c, [(fx * 1.1 + sx * 17, 34), (fx * 1.1 + sx * 25, 46), (fx * 1.1 + sx * 26, 60)], 2, SKIN_SH, 120)
        by = ey - 27 - 6 * ps.brow'''
rep("        by = ey - 27 - 6 * ps.brow", AGE)
rep('"""People study, step 2', '"""LOCAL COPY for w1111 tide (see mkperson.py for what was added). People study, step 2')
open('tperson.py', 'w').write(src)

# ---------------------------------------------------------------- fix round: a real BACK VIEW (cfg back=True) and arms that can come up onto the head
src = open('tperson.py').read()
rep("cfg = getattr(ps, 'cfg', {}); bw = cfg.get('bw', 1.0);", "cfg = getattr(ps, 'cfg', {}); back = bool(cfg.get('back')); bw = cfg.get('bw', 1.0);")
rep("    for A_, pose, palm in ((AL, ps.l_hand, False), (AR, ps.r_hand, ps.r_palm)):\n        ang = math.atan2",
    "    HANDS = ((AL, ps.l_hand, False), (AR, ps.r_hand, ps.r_palm)); late = lambda A_: (back or cfg.get('arms_front')) and A_['k'] > 0.9      # an arm lifted onto the head is drawn after the head\n    def _hand(A_, pose, palm):\n        ang = math.atan2")
rep("    # ---------------- neck and the tee collar", "    for A_, pose, palm in HANDS:\n        if not late(A_): _hand(A_, pose, palm)\n    # ---------------- neck and the tee collar")
rep("    if top == 'rain':\n        hood = smooth_closed([T(-84, 36)", "    if top == 'rain' and not back:\n        hood = smooth_closed([T(-84, 36)")
rep("P(TEE))\n", "P(TEE if not back else mix(TOP, TOP_SH, 0.35)))\n")
a = "    if top == 'rain':                                        # zip, storm flap and two zipped pockets"
rep(a, "    if back:                                                 # seen from behind: a centre seam and a yoke seam across the shoulders\n        p0 = T(0, 10); c.drawLine(p0[0], p0[1], hemc[0], hemc[1], SP(TOP_SH, 2.6, 120)); stroke(c, [T(-96, -40), T(0, -58), T(96, -40)], 3, TOP_SH, 130)\n"
       "        for sd in (-1, 1): stroke(c, [T(sd * 60, -150), T(sd * 40, -190), T(sd * 52, -232)], 3, TOP_SH, 90)\n    elif top == 'rain':                                      # zip, storm flap and two zipped pockets")
a = "    for A_ in (AL, AR):                                     # ribbed cuffs: a soft band the sleeve gathers into (not a block)\n"
rep(a, "    def _cuff(A_):                                          # ribbed cuffs: a soft band the sleeve gathers into (not a block)\n")
rep("    if top == 'sweat':\n        col = smooth_closed([T(-52, 54)", "    for A_ in (AL, AR): _cuff(A_)\n    if top == 'sweat':\n        col = smooth_closed([T(-52, 54)")
a = "    elif top == 'rain':                                      # a stand collar, zipped to the chin"
rep(a, "    elif top == 'rain' and back:                             # from behind: the collar's back and the hood lying flat between the shoulders\n"
       "        col = smooth_closed([T(-50, 52), T(-42, 72), T(0, 78), T(42, 72), T(50, 52), T(44, 26), T(0, 18), T(-44, 26)])\n"
       "        c.drawPath(col, P(mix(TOP, TOP_SH, 0.2))); c.drawPath(col, SP(TOP_SH, 2.5, 200))\n"
       "        hood = smooth_closed([T(-62, 40), T(-80, 2), T(-66, -62), T(-30, -100), T(0, -108), T(30, -100), T(66, -62), T(80, 2), T(62, 40), T(30, 30), T(0, 26), T(-30, 30)])\n"
       "        q_ = skia.Path(hood); q_.offset(5, 9); c.drawPath(q_, P(AO, 80, MaskFilter=blur(8)))\n"
       "        shaded(c, hood, mix(TOP, TOP_HI, 0.1), TOP_SH, sh=(-d[0] * 1.3, -d[1] * 0.5), rimL=TOP_HI, rl=(d[0] * 0.5, d[1] * 0.5))\n"
       "        stroke(c, [T(-40, 26), T(-26, -30), T(0, -84)], 3, TOP_SH, 150); stroke(c, [T(40, 26), T(26, -30), T(0, -84)], 3, TOP_SH, 150); stroke(c, [T(-50, 6), T(0, -10), T(50, 6)], 2.6, TOP_SH, 110)\n"
       + a)
i0 = src.index("    c.drawPath(face, P(SKIN))\n"); i1 = src.index("    hs = yaw * 5; hstyle")
blk = ''.join(('    ' + ln + '\n') if ln.strip() else '\n' for ln in src[i0:i1].split('\n')[:-1])
BACKHEAD = '''    if back:                                                 # the back of his head: hair down to the nape, the neck below it
        face = smooth_closed([(-57, -66), (-62, -22), (-58, 14), (-46, 40), (-24, 55), (0, 59), (24, 55), (46, 40), (58, 14), (62, -22), (57, -66), (40, -97), (0, -105), (-40, -97)])   # the skull from behind: no chin
        c.drawPath(face, P(HAIR))
        c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
        c.drawPath(smooth_closed([(72, -100), (46, -78), (40, -36), (44, 0), (38, 34), (22, 60), (80, 100)]), P(HAIR_SH, 170))
        c.drawPath(smooth_closed([(-40, 44), (-18, 50), (0, 46), (18, 50), (40, 44), (60, 110), (-60, 110)]), P(mix(SKIN, SKIN_SH, 0.25)))      # the nape, under the hairline
        for hx_ in (-30, -12, 8, 26): stroke(c, [(hx_, -34), (hx_ + 3, 6), (hx_ - 2, 42)], 2.6, HAIR_HI, 110)
        if abs(yaw) > 0.06:                                  # his head turned: the side of his face shows INSIDE the outline as a crescent (cheek, brow, beard)
            sd = 1 if yaw > 0 else -1; w_ = 34 * abs(yaw)
            c.drawPath(smooth_closed([(sd * 64, -62), (sd * (60 - w_ * 0.6), -50), (sd * (62 - w_), -18), (sd * (58 - w_ * 1.05), 12), (sd * (50 - w_ * 0.8), 38), (sd * 44, 52), (sd * 62, 20)]), P(SKIN))
            c.drawPath(smooth_closed([(sd * (60 - w_ * 1.0), 6), (sd * (58 - w_ * 1.05), 14), (sd * (50 - w_ * 0.8), 40), (sd * 42, 54), (sd * 64, 30), (sd * 64, 8)]), P(mix(HAIR, HAIR_SH, 0.2)))
            stroke(c, [(sd * (63 - w_ * 0.9), -30), (sd * (60 - w_ * 0.5), -34), (sd * 58, -30)], 4, HAIR, 255 * min(1.0, abs(yaw) * 2))
            stroke(c, [(sd * (62 - w_ * 0.85), -18), (sd * (60 - w_ * 0.5), -20), (sd * 58, -17)], 3, (44, 28, 28), 255 * min(1.0, abs(yaw) * 2))
        c.restore()
    else:
'''
src = src[:i0] + BACKHEAD + blk + src[i1:]
LATE = '''    c.restore()
    for A_, pose, palm in HANDS:                             # arms lifted onto the head come in front of it
        if late(A_):
            c.save(); c.clipRect(skia.Rect(head_c[0] - 118, -3000, head_c[0] + 118, neck0[1] - 24))
            shaded(c, A_['path'], TOP, TOP_SH, sh=(-d[0] * 1.6, -d[1] * 0.6), rimL=TOP_HI, rl=(d[0] * 0.5, d[1] * 0.5)); c.restore()
            _hand(A_, pose, palm); _cuff(A_)
    c.restore()


def track(keys, t):'''
rep("    c.restore()\n    c.restore()\n\n\ndef track(keys, t):", LATE)
open('tperson.py', 'w').write(src)

# ---------------------------------------------------------------- last fix round: crisper edges for close shots, a clearer head turn from behind
src = open('tperson.py').read()
rep("cfg = getattr(ps, 'cfg', {}); back = bool(cfg.get('back'));", "cfg = getattr(ps, 'cfg', {}); back = bool(cfg.get('back')); shk = cfg.get('shk', 1.0);")
rep("    shaded(c, whole, TOP, TOP_SH, sh=(-d[0] * 1.6, -d[1] * 0.6), rimL=TOP_HI, rl=(d[0] * 0.5, d[1] * 0.5))\n    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)   # soft form",
    "    shaded(c, whole, TOP, TOP_SH, sh=(-d[0] * 1.6 * shk, -d[1] * 0.6 * shk), rimL=TOP_HI, rl=(d[0] * 0.5 * shk, d[1] * 0.5 * shk))   # shk < 1 narrows the shade band and rim for close shots\n    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)   # soft form")
rep("        shaded(c, hood, mix(TOP, TOP_SH, 0.55), TOP_SH, sh=(-d[0] * 1.2, -d[1] * 0.5), rimL=TOP_HI, rl=(d[0] * 0.4, d[1] * 0.4))", "        shaded(c, hood, mix(TOP, TOP_SH, 0.55), TOP_SH, sh=(-d[0] * 1.2 * shk, -d[1] * 0.5 * shk), rimL=TOP_HI, rl=(d[0] * 0.4 * shk, d[1] * 0.4 * shk))")
rep("    hs = yaw * 5; hstyle", "    hs = yaw * (10 if back else 5); hstyle")
open('tperson.py', 'w').write(src)
