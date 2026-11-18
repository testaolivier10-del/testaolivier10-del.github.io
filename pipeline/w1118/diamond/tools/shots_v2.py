# ------------------------------------------------------------------ shots
L_GROUND, S_GROUND = 1980, 1750                                 # the lost man nearer the camera, the stranger behind his stand


def two_shot(c, t, z0, z1, u, tx=540, ty=1200, seller_raise=1.0, lost_arm=0.0, seller_kw=None, lost_kw=None, cy=1200, tx1=None, ty1=None):
    c.save(); push(c, u, 540, cy, z0, z1, tx, ty, tx1, ty1)
    world_back(c, t)
    shade_cloth(c, t, 560, 1010, 880, S_GROUND)
    person(c, 'seller', seller_pose(t, seller_raise, **(seller_kw or {})), 790, S_GROUND, 0.74)
    stand(c, t, 560, 1010, 1420, S_GROUND)
    m = c.getTotalMatrix(); y0 = m.mapXY(0, 1000).y(); y1 = m.mapXY(0, 1090).y()
    shimmer(c, y0, y1 + 20, t)
    person(c, 'lost', lost_pose(t, arm_out=lost_arm, **(lost_kw or {})), 290, L_GROUND, 1.0)
    dust(c, t)
    c.restore()


def flare(c, x, y, k, t, r=1.0):
    """sunlight catching glass or a stone: a bloom and a slowly turning star"""
    if k <= 0: return
    c.drawCircle(x, y, 120 * r * k, P((255, 250, 230), 120 * k, MaskFilter=blur(40 * r)))
    c.drawCircle(x, y, 26 * r * k, P((255, 255, 255), 230 * k, MaskFilter=blur(6)))
    for a_ in (0, 90, 45, 135):
        c.save(); c.translate(x, y); c.rotate(a_ + 12 * t); L_ = (150 if a_ % 90 == 0 else 70) * r * k
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-L_, -2.6 * r, L_, 2.6 * r), 2, 2), P((255, 255, 240), 220 * k)); c.restore()


def shot1(c, t):
    r = 0.25 + 0.75 * smooth(t / 1.3)                            # he is already lifting the bottle at frame zero
    two_shot(c, t, OPEN[0], OPEN[1], smooth(t / T2), 540, 900, seller_raise=r, cy=900, seller_kw=dict(glint=1.0),
             lost_kw=dict(yaw=lerp(0.15, 0.5, smooth((t - 0.5) / 0.8)), look=(lerp(0.3, 0.7, smooth((t - 0.4) / 0.6)), 0.1), sq=0.8))
    hx, hy = PN.HANDS_SELLER
    flare(c, hx + 52 * 0.74 * 1.22 * OPEN[0] * 0.9, hy - 60, 0.8 + 0.2 * math.sin(t * 5), t, 0.9)


def hand_close_bg(c, t, z=1.6, cx=640, cy=1060, br=14):
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    blur_layer(c, br)
    world_back(c, t); shade_cloth(c, t, 560, 1010, 880, S_GROUND)
    person(c, 'seller', seller_pose(t, 1.0, glint=0.5 + 0.5 * math.sin(t * 2)), 790, S_GROUND, 0.74)
    stand(c, t, 560, 1010, 1420, S_GROUND)
    c.restore()
    c.restore()


def sleeve_arm(c, look, el, wr, w0=110, w1=86, cuff=True):
    """a forearm in its sleeve from `el` to the wrist, shaded like the people (flat, one shade band, a rim)"""
    LK = CH.LOOKS[look]
    sl = limb(el, wr, w0, w1)
    shaded(c, sl, LK['TOP'], LK['TOP_SH'], sh=(8, 10), rimL=LK['TOP_HI'], rl=(-4, -4))
    if cuff:
        dx, dy = wr[0] - el[0], wr[1] - el[1]; L = math.hypot(dx, dy); ux, uy = dx / L, dy / L
        cf = limb((wr[0] - ux * 40, wr[1] - uy * 40), (wr[0] - ux * 6, wr[1] - uy * 6), w1 * 1.02, w1 * 0.98)
        c.drawPath(cf, P(mix(LK['TOP'], LK['TOP_SH'], 0.5)))


def hand_at(c, look, wr, ang, side, s, curls, spread=0.12, **kw):
    LK = CH.LOOKS[look]
    return H.hand(c, wr, ang, side, s, curls=curls, spread=spread, skin=LK['SKIN'], shade=LK['SKIN_SH'], hi=LK['SKIN_HI'], light=PN.LIGHT, nails=True, **kw)


def ring_hand(c, t, t0, t1, wr0=(330, 1420), sparkle_t=None):
    """the lost man's left hand in the foreground with the ring on the ring finger, the stranger soft behind"""
    u = smooth((t - t0) / (t1 - t0))
    hand_close_bg(c, t, z=1.5 + 0.1 * u, cx=700, cy=1080, br=12)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 30))
    tr = 1.2 * math.sin(t * 11) + 2 * math.sin(t * 3.1)          # a small tremble
    wr = (wr0[0] + tr + 20 * u, wr0[1] - 40 * u); ang = math.radians(-30 + 3 * math.sin(t * 1.3))
    el = (wr[0] - math.cos(ang) * 520, wr[1] - math.sin(ang) * 520)
    sleeve_arm(c, 'lost', el, (wr[0] - math.cos(ang) * 30, wr[1] - math.sin(ang) * 30), 330, 250)
    s = 6.4
    Wf = hand_at(c, 'lost', wr, ang, -1, s, (0.34, 0.36, 0.42, 0.5, 0.58), 0.08)
    sp = 0.4 if sparkle_t is None else 0.4 + 0.6 * smooth((t - sparkle_t) / 0.3) * (1 - smooth((t - sparkle_t - 1.2) / 0.6))
    CH.ring_on_finger(sp, t)(c, Wf, wr, ang, -1, s)
    rs = np.random.default_rng(4)                               # dust in the creases of his knuckles
    for _ in range(10):
        p = Wf(rs.uniform(0, 50), rs.uniform(-20, 20)); c.drawCircle(p[0], p[1], rs.uniform(3, 7), P((186, 150, 110), 60, MaskFilter=blur(3)))
    dust(c, t, 0.8)
    return Wf(58, -6)


def shot2(c, t):
    ring_hand(c, t, T2, T3, sparkle_t=WD.at('diamond', 2))


def face_close(c, t, s=2.5, x=540, ground=None, head_y=900, ps=None, bg_blur=16, bgz=1.6):
    c.save(); c.translate(540, 960); c.scale(bgz, bgz); c.translate(-560, -1080)
    blur_layer(c, bg_blur); world_back(c, t); shade_cloth(c, t, 560, 1010, 880, S_GROUND); stand(c, t, 560, 1010, 1420, S_GROUND); c.restore()
    c.restore()
    gy = head_y + 952 * s * 0.98 if ground is None else ground
    person(c, 'lost', ps, x, gy, s)


def shot3(c, t):
    u = (t - T3) / (T4 - T3)
    look = (lerp(0.2, 0.0, smooth(u / 0.3)), lerp(0.2, 1.0, smooth(u / 0.3))) if u < 0.55 else (lerp(0.0, 0.8, smooth((u - 0.55) / 0.2)), lerp(1.0, -0.2, smooth((u - 0.55) / 0.2)))
    ps = lost_pose(t, yaw=lerp(0.15, 0.3, u), look=look, sq=0.55, worry=0.8)
    ps.head_tilt = lerp(3, -2, smooth((u - 0.5) / 0.4))
    c.save(); z = 1.0 + 0.05 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    face_close(c, t, s=2.7, head_y=880, ps=ps)
    sweat(c, t, 540, 880, 2.7)
    c.restore()


def sweat(c, t, x, y, s):
    """a bead of sweat slides down his temple (gravity)"""
    u = (t * 0.35) % 1.0
    px, py = x - 50 * s * 0.86, y - 40 * s * 0.86 + u * 70 * s * 0.86
    c.drawCircle(px, py, 4.5 * s, P((255, 255, 255), 150 * (1 - u))); c.drawCircle(px - 1.4 * s, py - 1.4 * s, 1.6 * s, P((255, 255, 255), 230 * (1 - u)))


def shot4(c, t):
    u = smooth((t - T4) / (T5 - T4))
    world_back(c, t, hz=1180)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 240, 210), 30))
    show = dict(jewel=smooth((t - WD.at('diamond', 3)) / 0.3), bottle=smooth((t - WD.at('bottle', 2)) / 0.3), tap=smooth((t - WD.at('water', 4)) / 0.5))
    a = smooth((t - T4 - 0.05) / 0.35)
    c.save(); z = 1.0 + 0.03 * u; c.translate(540, 800); c.scale(z, z); c.translate(-540, -800)
    memory_home(c, t, a, (40, 540, 1040, 1070), show)
    c.restore()
    look = (0.15, -1.0) if t < WD.at('even') - 0.2 else (0.1, -0.6)
    ps = lost_pose(t, yaw=0.12, look=look, sq=0.6, worry=0.7)
    ps.head_tilt = -4
    c.save(); z = 1.0 + 0.05 * u; c.translate(540, 1500); c.scale(z, z); c.translate(-540, -1500)
    person(c, 'lost', ps, 540, 2950, 1.7)
    c.restore()
    shimmer(c, 1140, 1230, t)
    dust(c, t, 0.7)


def bars_values(t):
    """the water bar: unknown until 'at home', then small, almost nothing at 'so one more bottle', over the top 'out here'"""
    home = smooth((t - WD.at('home', 2)) / 0.4)
    shrink = smooth((t - WD.at('so')) / 1.2)
    out = smooth((t - WD.at('out')) / 0.9)
    water = lerp(0.24, 0.05, shrink); water = lerp(water, 1.18, out)
    return water, 0.86, home < 0.5


def shot5(c, t):
    u = smooth((t - T5) / (T6A - T5))
    two_shot(c, t, 1.3, 1.42, u, 560, 1150, seller_raise=0.55 + 0.45 * smooth((t - T5) / 1.2),
             seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.0)))


def shot6a(c, t):
    """what you'll pay: close on the ring, the diamond card beside it"""
    rp = ring_hand(c, t, T6A, T6B, wr0=(300, 1480))
    a = smooth((t - T6A - 0.15) / 0.3)
    card(c, 790, 560, 'DIAMOND', 0.86, DBAR, a)
    leader(c, 700, 980, rp[0] + 6, rp[1] - 26, a)


def bottle_close(c, t, t0, t1, glint_t=None):
    u = smooth((t - t0) / (t1 - t0))
    hand_close_bg(c, t, z=2.0, cx=640, cy=1000, br=18)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    ang = math.radians(-4 + 2 * math.sin(t * 1.4)); s = 5.0
    wr = (560 + 30 * u, 1170 - 40 * u)
    el = (wr[0] + 560, wr[1] + 420)
    sleeve_arm(c, 'seller', el, (wr[0] + 30, wr[1] + 18), 260, 190)
    bx, by = wr[0] + s * 52 * math.cos(ang), wr[1] + s * 52 * math.sin(ang) - 34 * s
    g = 0.4 if glint_t is None else 0.4 + 0.6 * smooth((t - glint_t) / 0.3)
    bottle(c, bx, by, math.degrees(ang), s, level=0.86, t=t, glint=g, wet=1.0)
    hand_at(c, 'seller', wr, ang, 1, s, H.GRIP['curls'], 0.05)
    dust(c, t, 0.8)
    return bx, by


def shot6b(c, t):
    """what the NEXT unit adds: close on the bottle, its card beside it (no value yet)"""
    bx, by = bottle_close(c, t, T6B, T6C)
    a = smooth((t - T6B - 0.1) / 0.3)
    water, dia, unk = bars_values(t)
    card(c, 200, 560, 'BOTTLE', water, WBAR, a, unknown=unk)
    leader(c, 300, 980, bx - 40, by - 40, a)


def shot6c(c, t):
    """at home there's always more water: the two shot, both cards, the memory of endless shelves"""
    u = smooth((t - T6C) / (T6D - T6C))
    two_shot(c, t, 1.3, 1.38, u, 540, 1180, seller_raise=1.0, lost_arm=1.0, seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.1)))
    water, dia, unk = bars_values(t)
    card(c, 160, 560, 'DIAMOND', dia, DBAR, 1.0)
    card(c, 920, 560, 'BOTTLE', water, WBAR, 1.0, unknown=unk)
    memory_endless(c, t, smooth((t - T6C) / 0.35), (330, 570, 750, 960), 0)


def shot6d(c, t):
    """so one more bottle adds almost nothing: cut in closer on the stranger's bottle, the water bar sinks"""
    u = smooth((t - T6D) / (T7 - T6D))
    two_shot(c, t, 1.75, 1.85, u, 700, 1130, seller_raise=1.0, lost_arm=1.0, seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.1)))
    water, dia, unk = bars_values(t)
    card(c, 170, 560, 'DIAMOND', dia, DBAR, 1.0)
    card(c, 420, 560, 'BOTTLE', water, WBAR, 1.0)


def shot7(c, t):
    """out here it's the only one: close on the one bottle; the water bar climbs over the diamond bar"""
    bottle_close(c, t, T7, T8, glint_t=WD.at('only') - 0.2)
    water, dia, unk = bars_values(t)
    card(c, 170, 560, 'DIAMOND', dia, DBAR, 1.0)
    card(c, 420, 560, 'BOTTLE', water, WBAR, 1.0)


def shot8(c, t):
    """the trade, close on the hands: the stranger's fingers take the ring; the bottle passes from his grip to the lost man's"""
    t = t - T8 + 34.4                                             # the move was timed with the shot starting at 34.4
    hand_close_bg(c, t, z=1.9, cx=600, cy=1250, br=20)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    s = 3.3
    k_in = smooth((t - 34.4) / 0.3)
    take = smooth((t - 34.82) / 0.14)
    let = smooth((t - 34.96) / 0.14)
    away = smooth((t - 35.08) / 0.4)
    ang_l = math.radians(-14)
    def wr_for(p, ang, side, s_, u=76, v=21):
        return (p[0] - s_ * (u * math.cos(ang) - v * side * math.sin(ang)), p[1] - s_ * (u * math.sin(ang) + v * side * math.cos(ang)))
    lp = (lerp(260, 520, k_in) - 220 * away, lerp(900, 820, k_in) + 160 * away)
    lw = wr_for(lp, ang_l, 1, s)
    lcurls = H.blend(dict(curls=(0.4, 0.5, 0.82, 0.84, 0.86), spread=0.1), dict(curls=(0.25, 0.22, 0.6, 0.66, 0.7), spread=0.25), let)
    ang_r = math.radians(194)
    reach = smooth((t - 34.5) / 0.32)
    spt = (lerp(1180, 520, reach) + 420 * away, lerp(760, 820, reach) - 60 * away)
    sw = wr_for(spt, ang_r, -1, s)
    scurls = H.blend(dict(curls=(0.12, 0.15, 0.6, 0.66, 0.7), spread=0.3), dict(curls=(0.4, 0.5, 0.82, 0.84, 0.86), spread=0.1), take)
    ring_pt = lp if let < 0.5 else spt
    b_in = smooth((t - 34.75) / 0.4)
    grab = smooth((t - 35.3) / 0.15)
    s_let = smooth((t - 35.5) / 0.15)
    pull = smooth((t - 35.62) / 0.38)
    bpos = (lerp(1250, 640, b_in) - 380 * pull, lerp(1380, 1300, b_in) - 120 * pull)
    sb_ang = math.radians(184); lb_ang = math.radians(-2)
    def wr_grip(b, ang, dv):
        ax = (math.sin(ang), -math.cos(ang))
        return (b[0] - s * 52 * math.cos(ang) + ax[0] * dv, b[1] - s * 52 * math.sin(ang) + ax[1] * dv)
    sbw = wr_grip(bpos, sb_ang, -40)
    sbw = (sbw[0] + 500 * smooth((t - 35.62) / 0.35), sbw[1] + 120 * smooth((t - 35.62) / 0.35))
    lb_in = smooth((t - 35.05) / 0.3)
    lbw_target = wr_grip(bpos, lb_ang, 70)
    lbw = (lerp(-200, lbw_target[0], lb_in), lerp(1500, lbw_target[1], lb_in)) if grab < 0.01 else lbw_target
    bcurls_l = H.blend(dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), H.GRIP, grab)
    bcurls_s = H.blend(H.GRIP, dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), s_let)
    sleeve_arm(c, 'seller', (sbw[0] + 600, sbw[1] + 240), (sbw[0] + 20, sbw[1] + 8), 210, 160)
    sleeve_arm(c, 'lost', (lbw[0] - 600, lbw[1] + 300), (lbw[0] - 20, lbw[1] + 10), 190, 150)
    if b_in > 0: bottle(c, bpos[0], bpos[1], 0, s, level=0.86, t=t, glint=0.3, wet=1.0)
    if b_in > 0: hand_at(c, 'seller', sbw, sb_ang, -1, s, bcurls_s['curls'], bcurls_s['spread'])
    if lb_in > 0: hand_at(c, 'lost', lbw, lb_ang, 1, s, bcurls_l['curls'], bcurls_l['spread'])
    sleeve_arm(c, 'lost', (lw[0] - 640 * math.cos(ang_l), lw[1] - 640 * math.sin(ang_l) + 200), (lw[0] - 20 * math.cos(ang_l), lw[1] - 20 * math.sin(ang_l)), 190, 150)
    sleeve_arm(c, 'seller', (sw[0] + 620, sw[1] - 100), (sw[0] + 20, sw[1] - 4), 210, 160)
    hand_at(c, 'lost', lw, ang_l, 1, s, lcurls['curls'], lcurls['spread'])
    if reach > 0: hand_at(c, 'seller', sw, ang_r, -1, s, scurls['curls'], scurls['spread'])
    ring_loose(c, ring_pt[0], ring_pt[1], 9.5 * s, math.degrees(ang_l if let < 0.5 else ang_r) - 90, 0.5, t)
    dust(c, t, 0.6)


def cap_drawing(c, x, y, s, ang, phase):
    """the bottle cap alone: white, ridged; the ridges slide round as it turns"""
    c.save(); c.translate(x, y); c.rotate(ang)
    w, h = 18 * s * 0.46, 64 * s * 0.1
    r = skia.Rect(-w, -h, w, h)
    c.drawRRect(skia.RRect.MakeRectXY(r, 3 * s, 3 * s), P((236, 240, 246))); c.drawRect(skia.Rect(w * 0.2, -h, w, h), P((180, 192, 210)))
    for j in range(7):
        xx = -w + ((j / 7 + phase) % 1.0) * 2 * w
        c.drawLine(xx, -h + 2 * s, xx, h - 2 * s, SP((160, 172, 192), 1.3 * s))
    c.restore()


def shot9(c, t):
    """the cap: his left hand holds the bottle, his right finger and thumb twist the cap twice and lift it off"""
    u = smooth((t - T9) / (T9B - T9))
    hand_close_bg(c, t, z=2.1, cx=560, cy=1150, br=22)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    s = 4.6
    bc = (560, 1240 - 30 * u)
    capy = bc[1] - 64 * s * 1.08                                  # the cap's centre on the bottle
    k = (t - T9) / (T9B - T9)
    tw = 0.0
    for t0 in (0.08, 0.38):                                       # two twists: the hand turns, comes back
        tw += smooth((k - t0) / 0.22)
    turn = 22 * math.sin(math.pi * min(1.0, ((k - 0.08) % 0.3) / 0.22)) if 0.08 < k < 0.68 else 0.0
    lift = smooth((k - 0.7) / 0.28)
    cap_on = lift < 0.02
    # left hand grips the bottle low, from the left
    lang = math.radians(-2)
    lwr = (bc[0] - s * 52 * math.cos(lang), bc[1] + 30 * s)
    sleeve_arm(c, 'lost', (lwr[0] - 620, lwr[1] + 380), (lwr[0] - 20, lwr[1] + 8), 300, 230)
    bottle(c, bc[0], bc[1], 0, s, level=0.86, t=t, wet=0.8, glint=0.4, cap=cap_on)
    hand_at(c, 'lost', lwr, lang, 1, s, H.GRIP['curls'], 0.05)
    # right hand: pinch on the cap, turning, then lifting away up and to the right
    cp = (bc[0] + 160 * lift, capy - 260 * lift)
    rang = math.radians(196 + turn - 30 * lift)
    def wr_for(p, ang, side, s_, u_=76, v_=21):
        return (p[0] - s_ * (u_ * math.cos(ang) - v_ * side * math.sin(ang)), p[1] - s_ * (u_ * math.sin(ang) + v_ * side * math.cos(ang)))
    rw = wr_for(cp, rang, -1, s * 0.9)
    sleeve_arm(c, 'lost', (rw[0] + 560, rw[1] - 260), (rw[0] + 18 * math.cos(rang + math.pi) * -1, rw[1]), 280, 220)
    if not cap_on: cap_drawing(c, cp[0], cp[1], s, turn * 0.3, tw * 0.5)
    hand_at(c, 'lost', rw, rang, -1, s * 0.9, (0.42, 0.5, 0.82, 0.84, 0.86), 0.1)
    if cap_on:                                                    # the ridges turn under his fingers
        c.save(); c.translate(bc[0], capy)
        for j in range(3):
            xx = -6 * s + ((j / 3 + tw * 0.5) % 1.0) * 12 * s
            c.drawLine(xx, -2 * s, xx, 3 * s, SP((150, 162, 186), 1.4 * s, 200))
        c.restore()
    dust(c, t, 0.6)


def shot9b(c, t):
    """he drinks: his own arm from his elbow, his hand round the bottle, the open neck ON his parted lips, the bottle tipped up, the level dropping"""
    u = (t - T9B) / (T10 - T9B)
    tipu = smooth(u / 0.3)
    lvl = lerp(0.86, 0.45, smooth((u - 0.15) / 0.8))
    ps = lost_pose(t, yaw=0.0, look=(0.0, -0.3), sq=lerp(0.6, 0.04, smooth((u - 0.1) / 0.2)), worry=lerp(0.6, 0.0, u))
    ps.head_tilt = -3 * tipu; ps.drink = 1; ps.scream = 0.32
    ps.r_up = 22; ps.r_fore = 150; ps.hide = ('r',)
    c.save(); z = 1.0 + 0.04 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    s = 2.4
    gy = 820 + 952 * s * 0.98
    rec = skia.PictureRecorder(); dc = rec.beginRecording(skia.Rect(0, 0, 10, 10))
    dc.concat(c.getTotalMatrix()); person(dc, 'lost', ps, 540, gy, s); rec.finishRecordingAsPicture()
    inv = skia.Matrix(); c.getTotalMatrix().invert(inv)
    mq = inv.mapXY(*PN.HANDS['mouth']); mouth = (mq.x(), mq.y())
    ang_b = lerp(122, 146, tipu) + 8 * smooth((u - 0.35) / 0.5)   # bottle axis (open neck end toward his lips): bottom tipped up and out
    a_r = math.radians(ang_b)
    h_ = 64 * s
    bc = (mouth[0] - math.sin(a_r) * h_ * 0.98, mouth[1] + math.cos(a_r) * h_ * 0.98)
    hang = math.radians(ang_b - 180)
    wr = (bc[0] - s * 52 * math.cos(hang) - math.sin(a_r) * 20, bc[1] - s * 52 * math.sin(hang) + math.cos(a_r) * 20)
    q_ = c.getTotalMatrix().mapXY(*wr)
    el = PN.HANDS['r']['el']
    dx, dy = q_.x() - el[0], q_.y() - el[1]; a2 = math.degrees(math.atan2(dx, dy)); ps.r_fore = -a2 - ps.r_up
    face_close(c, t, s=s, head_y=820, ps=ps)
    e_ = inv.mapXY(*PN.HANDS['r']['el']); el = (e_.x(), e_.y())
    sleeve_arm(c, 'lost', el, (wr[0] - 18 * math.cos(hang), wr[1] - 18 * math.sin(hang)), 64 * s * 0.9, 56 * s * 0.9)
    bottle(c, bc[0], bc[1], ang_b, s, level=lvl, t=t, wet=0.7, cap=False)
    hand_at(c, 'lost', wr, hang, 1, s, H.GRIP['curls'], 0.05)
    c.restore()


def shot10(c, t):
    """payoff: the stranger holds the ring up to the sun (a real glint), the lost man lowers the half empty bottle, eyes open, relieved;
    the camera eases back to the opening framing so the end loops into frame zero"""
    u = smooth((t - T10) / (DUR - T10))
    up = smooth((t - T10 - 0.05) / 0.7)
    fl = smooth((t - (T10 + 0.75)) / 0.2) * (0.85 + 0.15 * math.sin(t * 7))
    low = smooth((t - T10) / 1.2)
    two_shot(c, t, 1.62, OPEN[0], u, 600, 1060, seller_raise=0.3 + 0.7 * up, cy=900, tx1=540, ty1=900,
             seller_kw=dict(ring=True, glint=fl), lost_kw=dict(yaw=lerp(0.4, 0.25, low), look=(0.7, -0.5), sq=1.0, worry=0.0, smile=0.6, bottle_lvl=0.45,
                                                                bottle_fore=lerp(105, 62, low)))
    hx, hy = PN.HANDS_SELLER
    flare(c, hx + 30, hy - 30, fl, t, 1.2)


def scene(c, t):
    for t0, f in ((T10, shot10), (T9B, shot9b), (T9, shot9), (T8, shot8), (T7, shot7), (T6D, shot6d), (T6C, shot6c), (T6B, shot6b), (T6A, shot6a),
                  (T5, shot5), (T4, shot4), (T3, shot3), (T2, shot2)):
        if t >= t0: return f(c, t)
    shot1(c, t)


_orig_person = CH.person


def _person_rec(c, who, ps, x, ground, s):
    _orig_person(c, who, ps, x, ground, s)
    if who == 'seller': PN.HANDS_SELLER = PN.HANDS['r']['w']
    else: PN.HANDS_LOST = PN.HANDS['l']['w']


person = _person_rec
PN.HANDS_SELLER = (700, 1000); PN.HANDS_LOST = (500, 1300)


def _title_cut(c, lines, t, a, size=92):
    """titles change on a hard cut: no fade, no scale pop"""
    widest = max(kit.L.line_width(ln, size) for ln in lines)
    if widest > 960: size = size * 960 / widest
    n = len(lines); y0 = 300 - (n - 1) * size * 0.52 + size * 0.36
    for i, ln in enumerate(lines): kit.L.rich_line(c, ln, 540, y0 + i * size * 1.04, size, 1.0)


kit._title_hard = _title_cut

ICEY = (170, 226, 255)
TITLES = [
    (0.0, [[('DIAMOND WATER PARADOX', Wt)], [('WOULD YOU ', Wt), ('TRADE?', Y)]]),
    (WD.at("he's"), [[('LOST FOR ', Wt), ('TWO DAYS', R)]]),
    (WD.at('a', 1), [[('HIS ', Wt), ('DIAMOND RING', ICEY)], [('FOR ONE ', Wt), ('BOTTLE?', BL)]]),
    (WD.at('would'), [[('WOULD YOU', Wt)], [('TAKE IT?', Y)]]),
    (WD.at('back'), [[('BACK HOME, A ', Wt), ('DIAMOND', ICEY)], [('COSTS ', Wt), ('THOUSANDS', Y)]]),
    (WD.at('and', 2), [[('A BOTTLE OF ', Wt), ('WATER', BL)], [('ABOUT ', Wt), ('A DOLLAR', TL)]]),
    (WD.at('even'), [[('BUT ', Wt), ('WATER', BL)], [('KEEPS YOU ', Wt), ('ALIVE', Y)]]),
    (WD.at('economists'), [[('THE ANSWER IS', Wt)], [('ONE WORD', Y)]]),
    (WD.at('marginal'), [[('MARGINAL', Y)]]),
    (WD.at('what'), [[('WHAT YOU PAY FOLLOWS', Wt)], [('THE ', Wt), ('NEXT ONE', Y)]]),
    (WD.at('at'), [[('AT HOME', Wt)], [('ALWAYS MORE ', Wt), ('WATER', BL)]]),
    (WD.at('so'), [[('ONE MORE BOTTLE', BL)], [('ADDS ', Wt), ('ALMOST NOTHING', R)]]),
    (WD.at('out'), [[('OUT HERE', Y)], [("IT'S THE ", Wt), ('ONLY ONE', BL)]]),
    (WD.at('he'), [[('HE TAKES', Wt)], [('THE TRADE', Y)]]),
    (WD.at('right'), [[('THE ', Wt), ('CHEAPEST', BL), (' THING', Wt)], [('IN THE WORLD', Wt)]]),
    (WD.at('is', 1), [[('WORTH MORE THAN', Wt)], [('A ', Wt), ('DIAMOND', ICEY)]]),
    (T_FIN, [[('WATER', BL), (' BEATS', Wt)], [('A ', Wt), ('DIAMOND', ICEY)]]),
]

SHORT = Short(WD, 'AP MICROECONOMICS', TITLES, scene, DUR, T_END, lift=lambda t: 1.0, fix={'MARGINAL.': 'marginal.', 'NEXT': 'next'})
URL_AT = SP_END + 0.35
URL_XY = (540, 1700)
_frame = SHORT.frame


def _frame_url(t):
    """the URL for the last stretch, on clean ground (not on the sign or a face)"""
    s = _frame(t)
    a = smooth((t - URL_AT) / 0.3)
    if a > 0:
        c = s.getCanvas(); f = skia.Font(kit.L.BLACK, 54); w = f.measureText('levlprep.com'); x, y = URL_XY
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 30, y - 56, x + w / 2 + 30, y + 22), 24, 24), P((5, 12, 26), 200 * a))
        c.drawString('levlprep.com', x - w / 2, y, f, P(kit.L.TEAL, 255 * a))
    return s


SHORT.frame = _frame_url

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1118/diamond/out/stills')
