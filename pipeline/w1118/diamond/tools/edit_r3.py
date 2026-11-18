s = open('build.py').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:70]); s = s.replace(a, b)
def rep_block(start, end, new):
    global s
    a = s.index(start); b = s.index(end, a + len(start)); s = s[:a] + new + s[b:]

# lost_pose: extra attributes can be set
rep("def lost_pose(t, yaw=0.45, look=(0.6, 0.0), arm_out=0.0, sq=0.62, worry=0.6, bottle_lvl=None, smile=0.0, bottle_fore=105):",
    "def lost_pose(t, yaw=0.45, look=(0.6, 0.0), arm_out=0.0, sq=0.62, worry=0.6, bottle_lvl=None, smile=0.0, bottle_fore=105, **extra):")
rep("""        ps.l_over = None
    return ps""", """        ps.l_over = None
    for k_, v_ in extra.items(): setattr(ps, k_, v_)
    return ps""")
# ring pinch records where the ring is
rep("""        p = Wf(76, 21)
        ring_loose(c, p[0], p[1], 9.5 * s * scale, math.degrees(ang) - 90, sparkle, t)""",
"""        p = Wf(76, 21)
        ring_loose(c, p[0], p[1], 9.5 * s * scale, math.degrees(ang) - 90, sparkle, t)
        q = c.getTotalMatrix().mapXY(p[0], p[1] - 9.5 * s * scale * 0.82); RING_PT[0] = (q.x(), q.y())""")
rep("def pinch_ring(sparkle, t, scale=1.0):", "RING_PT = [None]\n\n\ndef pinch_ring(sparkle, t, scale=1.0):")
# sign: dark painted letters on lighter wood
rep("    c.drawRect(sg, P((150, 98, 62)))", "    c.drawRect(sg, P((196, 150, 102)))")
rep("for k in range(1, 3): yy = sg.top() + k * sg.height() / 3; c.drawLine(sg.left(), yy, sg.right(), yy, SP((112, 70, 44), 3))",
    "for k in range(1, 3): yy = sg.top() + k * sg.height() / 3; c.drawLine(sg.left(), yy, sg.right(), yy, SP((150, 108, 70), 3))")
rep("    text_c(c, 'COLD WATER', sg.centerX(), sg.top() + 66, 38, (252, 240, 210))", "    text_c(c, 'COLD WATER', sg.centerX(), sg.top() + 66, 38, (54, 30, 20))")
# kitchen: tag left on the shelf edge, tap to the right, a hand takes a bottle
rep("""    nb = 6
    for j in range(nb):
        bottle(c, mxp + 70 + j * (x1 - 110 - mxp - 70) / (nb - 1), sh - 54, 0, 0.66, level=0.9, t=t + j, wet=0)
    hb = show.get('bottle', 0)
    tag(c, mxp + (x1 - mxp) * 0.5, sh + 74, 'ABOUT $1', (90, 220, 200), max(0.35, hb), ink=(20, 18, 44))""",
"""    nb = 6; rch = show.get('reach', 0.0); grab = show.get('grab', 0.0); lift = show.get('lift', 0.0)
    for j in range(nb):
        bx_, by_ = mxp + 70 + j * (x1 - 110 - mxp - 70) / (nb - 1), sh - 54
        if j == nb - 1: bx_, by_ = bx_ + 26 * lift, by_ - 40 * lift                 # the one he takes moves only once his hand has it
        bottle(c, bx_, by_, 0, 0.66, level=0.9, t=t + j, wet=0)
        if j == nb - 1: TAKE_B[0] = (bx_, by_)
    hb = show.get('bottle', 0)
    tag(c, mxp + 120, sh + 64, 'ABOUT $1', (90, 220, 200), max(0.35, hb), ink=(20, 18, 44))
    if rch > 0:                                                                       # a hand from the right takes the last bottle off the shelf
        hs_ = 0.9; bx_, by_ = TAKE_B[0]
        tgt = (bx_ + 52 * hs_, by_ + 4)
        wr = (lerp(x1 + 120, tgt[0], rch), lerp(by_ + 40, tgt[1], rch))
        sleeve_arm(c, 'lost', (wr[0] + 260, wr[1] + 60), (wr[0] + 10, wr[1] + 2), 44, 34)
        cur = H.blend(dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), H.GRIP, grab)
        hand_at(c, 'lost', wr, math.pi, -1, hs_, cur['curls'], cur['spread'])""")
rep("    tx = sk.centerX() - 60", "    tx = sk.centerX() + 30")
rep("def memory_home(c, t, a, rect, show):", "TAKE_B = [(0, 0)]\n\n\ndef memory_home(c, t, a, rect, show):")
# aisle instead of the see through grid
rep_block("def memory_endless(c, t, a, rect, u_shrink):", "# ------------------------------------------------------------------ shots",
'''def memory_endless(c, t, a, rect, u_shrink):
    """at home there's always more water: a supermarket aisle of water, shelves on both sides running off to the far wall"""
    if a <= 0: return
    pa = haze_panel(c, t, rect, a)
    c.save(); c.saveLayerAlpha(None, int(255 * a)); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    x0, y0, x1, y1 = rect; vx, vy = (x0 + x1) / 2, y0 + (y1 - y0) * 0.44
    c.drawRect(skia.Rect(x0, y0, x1, y1), P((236, 236, 232)))                                    # far wall and ceiling
    fl = skia.Path(); fl.addPoly([skia.Point(x0, y1), skia.Point(x1, y1), skia.Point(vx + 18, vy + 12), skia.Point(vx - 18, vy + 12)], True)
    c.drawPath(fl, P((214, 210, 202)))                                                          # the floor
    for k in range(5):                                                                            # ceiling lights
        u = 0.25 + k * 0.17; yy = lerp(y0 + 10, vy - 10, u); w_ = (1 - u) * (x1 - x0) * 0.18
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(vx - w_, yy, vx + w_, yy + 8 * (1 - u) + 2), 3, 3), P((255, 255, 250)))
    for side in (-1, 1):
        ex = x0 if side < 0 else x1
        unit = skia.Path(); unit.addPoly([skia.Point(ex, y0 + 10), skia.Point(vx + side * 20, vy - 30), skia.Point(vx + side * 20, vy + 12), skia.Point(ex, y1)], True)
        c.drawPath(unit, P((196, 186, 172)))                                                    # the shelving unit's back panel
        for lv in range(4):                                                                       # four shelves of bottles
            fy = lerp(y0 + 60, y1 - 20, (lv + 1) / 4.3)
            c.drawLine(ex, fy, vx + side * 20, lerp(vy - 30, vy + 12, (lv + 1) / 4.3), SP((150, 120, 96), 5))
            n = 14
            for i in range(n, -1, -1):
                u = 1 - (i / n) ** 0.55                                                           # spacing shrinks toward the far end
                px = lerp(ex, vx + side * 20, u); sc = 1 - u
                if sc < 0.06: continue
                py = lerp(fy, lerp(vy - 30, vy + 12, (lv + 1) / 4.3), u)
                bottle(c, px - side * 18 * sc, py - 30 * sc, 0, 0.46 * sc, level=0.9, t=t + i, wet=0)
    c.drawRect(skia.Rect(vx - 30, vy - 30, vx + 30, vy + 14), P((255, 255, 255), 140, MaskFilter=blur(10)))
    c.restore(); c.restore()
    c.drawPath(pa, SP((255, 255, 255), 4, 150 * a))


''')
# shot 4: water runs from the start, slow push, the hand
rep("    show = dict(jewel=smooth((t - WD.at('diamond', 3)) / 0.3), bottle=smooth((t - WD.at('bottle', 2)) / 0.3), tap=smooth((t - WD.at('water', 4)) / 0.5))",
    """    tb = WD.at('bottle', 2)
    show = dict(jewel=smooth((t - WD.at('diamond', 3)) / 0.3), bottle=smooth((t - tb) / 0.3), tap=1.0,
                reach=smooth((t - tb + 0.2) / 0.5), grab=smooth((t - tb - 0.3) / 0.15), lift=smooth((t - tb - 0.5) / 0.5))""")
rep("    c.save(); z = 1.0 + 0.03 * u; c.translate(540, 800); c.scale(z, z); c.translate(-540, -800)\n    memory_home(",
    "    c.save(); z = 1.0 + 0.09 * u; c.translate(540, 800); c.scale(z, z); c.translate(-540, -800)\n    memory_home(")
# shot 1: the lost man is alive: lifts his head, sways, shifts his weight, eyes on the bottle
rep("""             lost_kw=dict(yaw=lerp(0.15, 0.5, smooth((t - 0.5) / 0.8)), look=(lerp(0.3, 0.7, smooth((t - 0.4) / 0.6)), 0.1), sq=0.8))""",
"""             lost_kw=dict(yaw=lerp(0.15, 0.5, smooth((t - 0.5) / 0.8)) + 0.06 * math.sin(t * 0.9), look=(lerp(0.3, 0.75, smooth((t - 0.4) / 0.6)), lerp(0.4, -0.2, smooth((t - 0.3) / 1.0))), sq=0.8,
                          head_tilt=lerp(6, -3, smooth((t - 0.2) / 1.2)) + 1.5 * math.sin(t * 1.3), sway=8 + 10 * math.sin(t * 0.7 + 0.4), lean=1.2 * math.sin(t * 0.9),
                          breath=0.5 + 0.5 * math.sin(t * 3.0)))""")
# shot 6c: lower framing, smaller cards clear of the heads, the aisle
rep_block("def shot6c(c, t):", "def shot6d(c, t):",
'''def shot6c(c, t):
    """at home there's always more water: the two shot, both cards above the heads, the memory of a whole aisle of water"""
    u = smooth((t - T6C) / (T6D - T6C))
    two_shot(c, t, 1.3, 1.36, u, 540, 1080, seller_raise=1.0, lost_arm=1.0, seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.1)))
    water, dia, unk = bars_values(t)
    card(c, 150, 530, 'DIAMOND', dia, DBAR, 1.0, w=270, h=330)
    card(c, 930, 530, 'BOTTLE', water, WBAR, 1.0, w=270, h=330, unknown=unk)
    memory_endless(c, t, smooth((t - T6C) / 0.35), (300, 535, 780, 900), 0)


''')
# card: compact layout when short
rep("    text_c(c, 'VALUE OF', x, y + 52, 40, (255, 210, 63)); text_c(c, 'ONE MORE', x, y + 98, 40, (255, 210, 63))\n    text_c(c, lab, x, y + 150, 46, (255, 255, 255))\n    bx0, bx1, by0, by1 = x - 40, x + 40, y + 180, y + h - 24",
    "    text_c(c, 'VALUE OF', x, y + 48, 40, (255, 210, 63)); text_c(c, 'ONE MORE', x, y + 92, 40, (255, 210, 63))\n    text_c(c, lab, x, y + 140, 42 if w < 290 else 46, (255, 255, 255))\n    bx0, bx1, by0, by1 = x - 40, x + 40, y + 162, y + h - 20")
# diamond bar shrinks out here
rep("    water = lerp(0.24, 0.05, shrink); water = lerp(water, 1.18, out)\n    return water, 0.86, home < 0.5",
    "    water = lerp(0.24, 0.05, shrink); water = lerp(water, 1.18, out)\n    return water, lerp(0.86, 0.12, out), home < 0.5")
# shot 8: no stray sleeves before their hands come in
rep("    sleeve_arm(c, 'seller', (sbw[0] + 600, sbw[1] + 240), (sbw[0] + 20, sbw[1] + 8), 210, 160)\n    sleeve_arm(c, 'lost', (lbw[0] - 600, lbw[1] + 300), (lbw[0] - 20, lbw[1] + 10), 190, 150)",
    "    if b_in > 0: sleeve_arm(c, 'seller', (sbw[0] + 600, sbw[1] + 240), (sbw[0] + 20, sbw[1] + 8), 210, 160)\n    if lb_in > 0: sleeve_arm(c, 'lost', (lbw[0] - 600, lbw[1] + 300), (lbw[0] - 20, lbw[1] + 10), 190, 150)")
# two_shot: optional custom drawing of the lost man
rep("    person(c, 'lost', lost_pose(t, arm_out=lost_arm, **(lost_kw or {})), 290, L_GROUND, 1.0)\n    dust(c, t)\n    c.restore()",
    "    if lost_draw: lost_draw(c, t)\n    else: person(c, 'lost', lost_pose(t, arm_out=lost_arm, **(lost_kw or {})), 290, L_GROUND, 1.0)\n    dust(c, t)\n    c.restore()")
rep("seller_kw=None, lost_kw=None, cy=1200, tx1=None, ty1=None):", "seller_kw=None, lost_kw=None, cy=1200, tx1=None, ty1=None, lost_draw=None):")
# ending
rep_block("def shot10(c, t):", "def scene(c, t):",
'''def lost_bottle_chest(c, t, lvl=0.45, smile=0.6):
    """the lost man holds the half empty bottle against his chest with both hands: his own upper arms, forearms drawn from his elbows to the bottle"""
    ps = lost_pose(t, yaw=0.3, look=(0.7, -0.45), sq=1.0, worry=0.0, smile=smile, head_tilt=-3)
    ps.r_up = 9; ps.l_up = 9; ps.hide = ('r', 'l'); ps.l_over = None
    s = 1.0; hs_ = 1.22 * s
    bc = (300, L_GROUND - 760 * s)                                       # chest height, a little toward the stranger
    lw = (bc[0] - 52 * hs_, bc[1] + 26)                                  # his right hand (screen left), lower on the bottle
    rw = (bc[0] + 52 * hs_, bc[1] - 10)                                  # his left hand (screen right), higher
    M = c.getTotalMatrix()
    rec = skia.PictureRecorder(); dc = rec.beginRecording(skia.Rect(0, 0, 10, 10)); dc.concat(M)
    person(dc, 'lost', ps, 290, L_GROUND, s); rec.finishRecordingAsPicture()
    for nm, w_, side in (('r', lw, -1), ('l', rw, 1)):                    # each forearm points from its elbow at its hand
        q = M.mapXY(*w_); el = PN.HANDS[nm]['el']; dx, dy = q.x() - el[0], q.y() - el[1]; a2 = math.degrees(math.atan2(dx, dy))
        if side < 0: ps.r_fore = -a2 - ps.r_up
        else: ps.l_fore = a2 - ps.l_up
    person(c, 'lost', ps, 290, L_GROUND, s)
    inv = skia.Matrix(); M.invert(inv)
    els = {nm: inv.mapXY(*PN.HANDS[nm]['el']) for nm in ('r', 'l')}
    for nm, w_, ang in (('r', lw, 0.0), ('l', rw, math.pi)):
        e = (els[nm].x(), els[nm].y())
        sleeve_arm(c, 'lost', e, (w_[0] - 14 * math.cos(ang), w_[1] - 14 * math.sin(ang)), 60, 52)
    bottle(c, bc[0], bc[1], 0, hs_, level=lvl, t=t, wet=0.6, cap=False)
    hand_at(c, 'lost', lw, 0.0, 1, hs_, H.GRIP['curls'], 0.05)
    hand_at(c, 'lost', rw, math.pi, -1, hs_, H.GRIP['curls'], 0.05)


def shot10(c, t):
    """payoff: the stranger holds the ring up to the sun (a small real glint on the stone), the lost man holds the half empty bottle to his chest
    with both hands, relieved; the camera eases back to the opening framing so the end loops into frame zero"""
    u = smooth((t - T10) / (DUR - T10))
    up = smooth((t - T10 - 0.05) / 0.7)
    fl = smooth((t - (T10 + 0.75)) / 0.2) * (0.85 + 0.15 * math.sin(t * 7))
    RING_PT[0] = None
    two_shot(c, t, 1.5, OPEN[0], u, 560, 1040, seller_raise=0.3 + 0.7 * up, cy=900, tx1=540, ty1=900,
             seller_kw=dict(ring=True, glint=0.3), lost_draw=lambda c_, t_: lost_bottle_chest(c_, t_))
    if RING_PT[0] is not None:
        flare(c, RING_PT[0][0], RING_PT[0][1], fl, t, 0.42)


''')
# end: final title and URL drawn after the kit's titles; corner tag hidden while the big URL is up
rep("    (T_FIN, [[('WATER', BL), (' BEATS', Wt)], [('A ', Wt), ('DIAMOND', ICEY)]]),\n", "")
rep("SHORT = Short(WD, 'AP MICROECONOMICS', TITLES, scene, DUR, T_END,", "SHORT = Short(WD, 'AP MICROECONOMICS', TITLES, scene, DUR, T_FIN,")
rep("URL_AT = SP_END + 0.35", "URL_AT = T_FIN + 0.25\nkit.lpk.end_line = lambda *a, **k: None\nFIN_TITLE = [[('WATER', BL), (' BEATS', Wt)], [('A ', Wt), ('DIAMOND', ICEY)]]")
rep("""    s = _frame(t)
    a = smooth((t - URL_AT) / 0.3)""", """    s = _frame(t)
    if t >= T_FIN: _title_cut(s.getCanvas(), FIN_TITLE, t, T_FIN)
    a = smooth((t - URL_AT) / 0.3)""")
open('build.py', 'w').write(s); print('ok')
