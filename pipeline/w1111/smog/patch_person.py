"""One time patch: turns the shared v5 people model into this build's copy with the new options the conductor needs:
top='coat' (long double breasted uniform greatcoat, lapels, brass buttons, skirt to below the knee), scarf, crossed straps with a ticket
machine and a cash bag, hair='cap' (peaked uniform cap with a badge plate), beard='moustache', age lines, a forearm that can come toward
the camera on the LEFT arm too (l_fz, for the beckon), and a prop held in the right fist (r_prop, drawn under the fingers)."""
s = open('person.py').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a, s.count(a)); s = s.replace(a, b)

rep("sys.path[:0] = ['/home/claude/short', '/home/claude/guy']", "sys.path += ['/home/claude/short', '/home/claude/guy']")
# left arm: forearm toward the camera
rep("AL = arm_geo(sh_l, 1, ps.l_up, ps.l_fore, ps.l_wrist)", "AL = arm_geo(sh_l, 1, ps.l_up, ps.l_fore, ps.l_wrist, fz=getattr(ps, 'l_fz', 0.0))")
# prop in the right fist, drawn before the hand so the fingers close over it; anchors out
rep("""        nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (pose['curls'][2] - 0.05) / 0.5)))
""", """        nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (pose['curls'][2] - 0.05) / 0.5)))
        if A_ is AR and getattr(ps, 'r_prop', None): ps.r_prop(c, hw, ang, ts, 1.22 * A_['gz'], nar)
        if A_ is AL: ps.out_lhand = c.getTotalMatrix().mapXY(hw[0], hw[1])
""")
# coat: the skirt joins the one silhouette
rep("""    for g in gussets: whole = op(whole, g)
    whole = rounded(whole, 22)
""", """    for g in gussets: whole = op(whole, g)
    coat = top == 'coat'; SK = wst[1] + 318
    if coat:
        skirt = smooth_closed([(wst[0] - 100 + hx, wst[1] - 20 + hr), (wst[0] - 112 + hx, wst[1] + 90), (wst[0] - 124 + hx * 0.6, SK - 60), (wst[0] - 128 + hx * 0.4, SK), (wst[0] - 40, SK + 7), (wst[0] + 40, SK + 7),
                               (wst[0] + 128 + hx * 0.4, SK), (wst[0] + 124 + hx * 0.6, SK - 60), (wst[0] + 112 + hx, wst[1] + 90), (wst[0] + 100 + hx, wst[1] - 20 + hl), (wst[0], wst[1] - 40)])
        c.drawOval(skia.Rect(wst[0] - 120, SK - 6, wst[0] + 120, SK + 40), P(AO, 120, MaskFilter=blur(12)))       # the coat's shadow on the shins
        whole = op(whole, skirt)
    whole = rounded(whole, 22)
""")
# coat details inside the torso clip
rep("""    if cfg.get('straps'):                                    # a backpack""", """    if coat:
        c.restore(); c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
        BR, BR_SH, BR_HI = (214, 168, 84), (128, 88, 44), (255, 232, 160)
        ex = 34                                               # the overlap edge of the double breasted front
        stroke(c, [T(ex, -64), (wst[0] + ex + 4 + hx * 0.6, wst[1] + 60), (wst[0] + ex + 8 + hx * 0.4, SK + 6)], 3.6, TOP_SH, 240)
        stroke(c, [T(ex - 5, -64), (wst[0] + ex - 1 + hx * 0.6, wst[1] + 60), (wst[0] + ex + 3 + hx * 0.4, SK + 6)], 2, TOP_HI, 70)
        for sd in (-1, 1):                                   # wide lapels, the screen right one laid over
            lp = smooth_closed([T(sd * 30, 52), T(sd * 74, 30), T(sd * 84, -6), T(sd * 62, -22), T(sd * 66, -36), T(ex * 0.9 if sd < 0 else ex, -72), T(sd * 8, -14 if sd < 0 else -30)])
            c.drawPath(lp, P(mix(TOP, TOP_HI, 0.07))); c.drawPath(lp, SP(TOP_SH, 3.2, 240)); c.drawPath(diffp(lp, (d[0] * 0.45, d[1] * 0.45)), P(TOP_HI, 150))
        for sd in (-1, 1):                                   # two rows of brass buttons
            for j, v in enumerate((-96, -150, -204)):
                q_ = T(ex - 34 + sd * 34, v); c.drawCircle(q_[0] + 2, q_[1] + 3, 9, P(TOP_SH)); c.drawCircle(q_[0], q_[1], 8.5, P(BR)); c.drawCircle(q_[0] + 1.6, q_[1] + 1.8, 6, P(BR_SH, 150)); c.drawCircle(q_[0] - 2.4, q_[1] - 2.6, 2.8, P(BR_HI))
            q_ = (wst[0] + ex - 34 + sd * 35 + hx * 0.6, wst[1] + 40); c.drawCircle(q_[0] + 2, q_[1] + 3, 9, P(TOP_SH)); c.drawCircle(q_[0], q_[1], 8.5, P(BR)); c.drawCircle(q_[0] + 1.6, q_[1] + 1.8, 6, P(BR_SH, 150)); c.drawCircle(q_[0] - 2.4, q_[1] - 2.6, 2.8, P(BR_HI))
        for xx, a_ in ((-84, 150), (-34, 110), (72, 130), (104, 100)):                      # the skirt hangs in long folds
            stroke(c, [(wst[0] + xx + hx * 0.7, wst[1] + 70), (wst[0] + xx * 1.07 + hx * 0.5, wst[1] + 190), (wst[0] + xx * 1.13 + hx * 0.4, SK + 4)], 3.4, TOP_SH, a_)
        for sd in (-1, 1):                                   # flapped hip pockets
            a_, b_ = (wst[0] + sd * 100 + hx, wst[1] + 84), (wst[0] + sd * (40 if sd < 0 else 50) + hx, wst[1] + 78)
            stroke(c, [a_, ((a_[0] + b_[0]) / 2, a_[1] + 2), b_], 3.2, TOP_SH, 230); stroke(c, [(a_[0], a_[1] + 30), ((a_[0] + b_[0]) / 2, a_[1] + 36), (b_[0], b_[1] + 30)], 2.4, TOP_SH, 160)
        c.drawRect(skia.Rect(wst[0] - 140, SK - 14, wst[0] + 140, SK + 12), P(TOP_SH, 110, MaskFilter=blur(5)))               # the hem turns under
        c.drawPath(smooth_closed([(wst[0] + 40, wst[1]), (wst[0] + 140, wst[1]), (wst[0] + 140, SK + 20), (wst[0] + 52, SK + 20)]), P(TOP_SH, 84, MaskFilter=blur(18)))   # the skirt's side away from the light
        c.restore(); c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True)
        LE, LE_SH, LE_HI = cfg.get('leather', ((132, 84, 50), (78, 46, 34), (214, 150, 96)))
        for sd in (-1, 1):                                   # two crossed leather straps: the ticket machine on one, the cash bag on the other
            a_, b_ = T(sd * 74, 50), (wst[0] - sd * 96 + hx, wst[1] + 30)
            c.drawLine(a_[0] + 3, a_[1] + 5, b_[0] + 3, b_[1] + 5, SP(AO, 20, 90, MaskFilter=blur(4)))
            c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(LE_SH, 19)); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(LE, 14)); c.drawLine(a_[0] - 3, a_[1] - 2, b_[0] - 3, b_[1] - 2, SP(LE_HI, 2.4, 170))
        q_ = T(-41, -22); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(q_[0] - 13, q_[1] - 15, q_[0] + 13, q_[1] + 15), 5, 5), P((200, 204, 214))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(q_[0] - 7, q_[1] - 9, q_[0] + 7, q_[1] + 9), 3, 3), SP((90, 96, 116), 3))   # a strap buckle
    if cfg.get('straps'):                                    # a backpack""")
# no shirt hem stitching on the coat
rep("""    else:                                                    # a plain hem with one line of stitching
        stroke(c,""", """    elif top != 'coat':                                      # a plain hem with one line of stitching
        stroke(c,""")
# the machine and bag hang outside the clip; the scarf replaces the collar
rep("""    for A_ in (AL, AR):                                     # shoulder seams and elbow folds""", """    if coat:
        LE, LE_SH, LE_HI = cfg.get('leather', ((132, 84, 50), (78, 46, 34), (214, 150, 96)))
        ME, ME_SH, ME_HI = (150, 156, 172), (84, 90, 112), (236, 226, 204)
        mx_, my_ = wst[0] - 84 + hx, wst[1] + 44                                             # the ticket machine at his right hip: a metal box with a dial and a crank handle
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(mx_ - 44, my_ - 38, mx_ + 50, my_ + 62), 14, 14), P(AO, 120, MaskFilter=blur(9)))
        mb = skia.Path(); mb.addRRect(skia.RRect.MakeRectXY(skia.Rect(mx_ - 46, my_ - 46, mx_ + 44, my_ + 52), 13, 13))
        shaded(c, mb, ME, ME_SH, sh=(-d[0] * 1.3, -d[1] * 0.7), rimL=ME_HI, rl=(d[0] * 0.45, d[1] * 0.45))
        c.drawCircle(mx_ - 6, my_ - 8, 22, P(ME_SH)); c.drawCircle(mx_ - 6, my_ - 8, 17, P((226, 222, 206))); c.drawCircle(mx_ - 6, my_ - 8, 17, SP((60, 62, 80), 2.4))
        for a_ in range(0, 360, 45): c.drawLine(mx_ - 6 + 11 * math.cos(math.radians(a_)), my_ - 8 + 11 * math.sin(math.radians(a_)), mx_ - 6 + 15 * math.cos(math.radians(a_)), my_ - 8 + 15 * math.sin(math.radians(a_)), SP((60, 62, 80), 2))
        c.drawLine(mx_ - 6, my_ - 8, mx_ + 2, my_ - 17, SP((170, 40, 40), 2.6))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(mx_ - 30, my_ + 26, mx_ + 28, my_ + 37), 4, 4), P((32, 34, 48))); c.drawRect(skia.Rect(mx_ - 22, my_ + 29, mx_ + 14, my_ + 44), P((244, 238, 220)))     # a ticket in the slot
        c.drawLine(mx_ - 46, my_ + 6, mx_ - 64, my_ + 6, SP(ME_SH, 8)); c.drawLine(mx_ - 64, my_ + 6, mx_ - 64, my_ - 20, SP(ME_SH, 7)); c.drawCircle(mx_ - 64, my_ - 24, 9, P((40, 40, 54)))                # the crank
        bx_, by_ = wst[0] + 82 + hx, wst[1] + 52                                              # the leather cash bag at his left hip
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_ - 52, by_ - 34, bx_ + 60, by_ + 62), 16, 16), P(AO, 120, MaskFilter=blur(9)))
        bag = smooth_closed([(bx_ - 54, by_ - 40), (bx_ + 52, by_ - 40), (bx_ + 58, by_ + 30), (bx_ + 44, by_ + 54), (bx_ - 46, by_ + 54), (bx_ - 60, by_ + 30)])
        shaded(c, bag, LE, LE_SH, sh=(-d[0] * 1.3, -d[1] * 0.7), rimL=LE_HI, rl=(d[0] * 0.45, d[1] * 0.45))
        flap = smooth_closed([(bx_ - 56, by_ - 42), (bx_ + 54, by_ - 42), (bx_ + 56, by_ - 4), (bx_, by_ + 14), (bx_ - 58, by_ - 4)])
        c.drawPath(flap, P(mix(LE, LE_SH, 0.3))); c.drawPath(flap, SP(LE_SH, 3, 240)); c.drawPath(diffp(flap, (d[0] * 0.4, d[1] * 0.4)), P(LE_HI, 190))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_ - 8, by_ + 2, bx_ + 8, by_ + 22), 4, 4), P((214, 168, 84))); c.drawCircle(bx_, by_ + 12, 3, P((90, 60, 34)))
    for A_ in (AL, AR):                                     # shoulder seams and elbow folds""")
rep("""    else:                                                    # a shirt collar: two points
        for sd in (-1, 1):""", """    elif top == 'coat':                                      # a thick wool scarf wound round the neck, pulled down off his mouth, one end tucked into the coat
        SC = cfg.get('scarf', (150, 44, 40)); SC_SH = mix(SC, (30, 10, 30), 0.5); SC_HI = mix(SC, (255, 190, 120), 0.5)
        tail = smooth_closed([T(-28, 30), T(18, 34), T(22, -30), T(12, -70), T(-10, -62), T(-26, -20)])
        shaded(c, tail, mix(SC, SC_SH, 0.25), SC_SH, sh=(-d[0] * 1.1, -d[1] * 0.3), rimL=SC_HI, rl=(d[0] * 0.4, d[1] * 0.4))
        for v in (-6, -30, -52): a_, b_ = T(-24, v), T(18, v - 4); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(SC_SH, 2.6, 190))
        c.drawPath(smooth_closed([T(-70, 44), T(70, 44), T(60, 16), T(-60, 16)]), P(AO, 90, MaskFilter=blur(8)))
        wrap = smooth_closed([T(-62, 52), T(-58, 92), T(-30, 110), T(0, 104), T(30, 110), T(58, 92), T(62, 52), T(50, 26), T(0, 12), T(-50, 26)])
        shaded(c, wrap, SC, SC_SH, sh=(-d[0] * 1.4, -d[1] * 0.5), rimL=SC_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(wrap, skia.ClipOp.kIntersect, True)
        stroke(c, [T(-66, 70), T(0, 44), T(66, 76)], 4, SC_SH, 230); stroke(c, [T(-60, 44), T(-6, 22), T(52, 40)], 3, SC_SH, 170); stroke(c, [T(-52, 98), T(0, 78), T(54, 100)], 3, SC_SH, 150)
        for j in range(-7, 8): a_, b_ = T(j * 9, 112), T(j * 9 + 5, 10); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(SC_SH, 1.6, 70))       # the knit
        c.restore()
    else:                                                    # a shirt collar: two points
        for sd in (-1, 1):""")
# beard: moustache option must not trigger the jaw beard
rep("""    if cfg.get('beard'):
        bp =""", """    if cfg.get('beard') in ('stubble', 'full'):
        bp =""")
# age lines and the moustache, after the mouth
rep("""    hs = yaw * 5; hstyle = cfg.get('hair', 'quiff')""", """    if cfg.get('age'):                                       # a man of fifty: folds from the nose to the mouth, tired lines under the eyes, a crease between the brows
        ag = cfg['age']
        for sx in (-1, 1):
            stroke(c, [(nx + sx * 15, 34), (mx + sx * 25, 46), (mx + sx * 27, 62)], 2.6, SKIN_SH, 200 * ag)
            ex_ = fx * 1.05 + sx * 27; stroke(c, [(ex_ - 13, 5), (ex_ + 1, 10), (ex_ + 14, 4)], 2.2, SKIN_SH, 170 * ag)
            stroke(c, [(sx * 50 + fx * 0.3, 26), (sx * 45 + fx * 0.4, 44), (sx * 34 + fx * 0.6, 60)], 2.4, SKIN_SH, 110 * ag)                # a hollow cheek
        wy_ = getattr(ps, 'worry', 0.0)
        for sx in (-1, 1): stroke(c, [(fx * 1.1 + sx * 4, -44), (fx * 1.1 + sx * 5, -36), (fx * 1.1 + sx * 3.4, -28)], 2.2, SKIN_SH, 200 * ag * (0.4 + 0.6 * wy_))
    if cfg.get('beard') == 'moustache':                      # a full greying moustache over the upper lip
        mo = smooth_closed([(mx - 27, my + 1), (mx - 20, my - 8), (mx - 8, my - 13), (mx, my - 10), (mx + 8, my - 13), (mx + 20, my - 8), (mx + 27, my + 1), (mx + 15, my - 1), (mx, my - 3.5), (mx - 15, my - 1)])
        shaded(c, mo, HAIR, HAIR_SH, sh=(-d[0] * 0.5, -d[1] * 0.25), rimL=HAIR_HI, rl=(d[0] * 0.22, d[1] * 0.22))
        c.drawLine(mx, my - 10, mx, my - 3.5, SP(HAIR_SH, 1.6, 200))
    hs = yaw * 5; hstyle = cfg.get('hair', 'quiff')""")
rep("""    elif hstyle == 'beanie':""", """    elif hstyle == 'cap':                                    # a peaked uniform cap: stiff band, a crown wider than the band, a shiny short peak, a badge plate on the front
        HAT = cfg.get('hat', (30, 36, 58)); HAT_SH = mix(HAT, (6, 6, 18), 0.55); HAT_HI = cfg.get('hat_hi', TOP_HI)
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 55, -72), (sx * 66, -66), (sx * 66, -24), (sx * 60, -30), (sx * 57, -50)]), P(HAIR)); c.drawPath(smooth_closed([(sx * 59, -64), (sx * 65, -60), (sx * 65, -34), (sx * 61, -40)]), P(HAIR_HI, 120))   # grey at the temples
        crown = smooth_closed([(-70, -98), (-90 + hs, -124), (-84 + hs, -152), (-46 + hs, -170), (hs, -175), (46 + hs, -170), (84 + hs, -152), (90 + hs, -124), (70, -98), (0, -90)])
        shaded(c, crown, HAT, HAT_SH, sh=(-d[0] * 1.3, -d[1] * 0.7), rimL=HAT_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(crown, skia.ClipOp.kIntersect, True); c.drawOval(skia.Rect(-80, -128, 80, -84), P(HAT_SH, 170, MaskFilter=blur(8))); c.restore()      # the crown overhangs the band
        bnd = smooth_closed([(-70, -108), (0, -118), (70, -108), (69, -68), (0, -80), (-69, -68)])
        shaded(c, bnd, mix(HAT, HAT_SH, 0.45), HAT_SH, sh=(-d[0] * 1.0, -d[1] * 0.3), rimL=HAT_HI, rl=(d[0] * 0.35, d[1] * 0.35))
        stroke(c, [(-69, -100), (0, -110), (69, -100)], 2.4, (150, 44, 40), 230)                                                   # a thin red piping line
        pk = smooth_closed([(-72, -70), (-40 + fx * 0.5, -82), (fx * 0.5, -85), (40 + fx * 0.5, -82), (72, -70), (56 + fx, -56), (fx, -50), (-56 + fx, -56)])
        c.drawPath(pk, P((0, 0, 0), 90, MaskFilter=blur(7))) ; c.save(); c.translate(0, -3)
        shaded(c, pk, (20, 20, 30), (6, 6, 14), sh=(-d[0] * 0.8, -d[1] * 0.4), rimL=HAT_HI, rl=(d[0] * 0.4, d[1] * 0.4))
        stroke(c, [(-46 + fx, -64), (fx - 10, -58), (20 + fx, -62)], 3, (200, 190, 180), 110); c.restore()                                 # the gloss on the peak
        bx_ = hs * 1.6 + fx * 0.4; bd = smooth_closed([(bx_ - 15, -146), (bx_, -152), (bx_ + 15, -146), (bx_ + 15, -126), (bx_, -114), (bx_ - 15, -126)])
        shaded(c, bd, (206, 202, 196), (116, 112, 124), sh=(-d[0] * 0.5, -d[1] * 0.4), rimL=(255, 244, 220), rl=(d[0] * 0.25, d[1] * 0.25))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_ - 9, -140, bx_ + 9, -129), 3, 3), P((150, 44, 40)))
    elif hstyle == 'beanie':""")
# the cap's peak throws a shadow over the brow
rep("""    c.drawRect(skia.Rect(-70, -104, 70, -62), P(AO, 80, MaskFilter=blur(9)))""", """    c.drawRect(skia.Rect(-70, -104, 70, -62 + (22 if cfg.get('hair') == 'cap' else 0)), P(AO, 80 + (70 if cfg.get('hair') == 'cap' else 0), MaskFilter=blur(9)))""")
# plain coat cuffs: no puffed gather needed, keep the soft band; narrowed eyes handled by ps.lid
open('person.py', 'w').write(s); print('patched')
