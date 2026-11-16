"""w1111-03-bank-run: Ray leaves the line. A purpose built lower body for one low shot: hips, the hem of his jacket, his hand slipping the
phone into the jacket pocket, two legs with knees and two boots. He starts facing us (as in the line), turns to his left (screen right)
and takes two real steps away: the foot that is on the ground stays where it is (heel down, roll, toe off), the hips travel over it.
Units are the people model's body units (hips 596 above the ground, ankle 74); drawn in the model's shapes, shading and colours."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/bank', '/home/claude/short', '/home/claude/guy']
import skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, ik2
from art import shaded, diffp, op
import bperson as PN, bhands as H
track = PN.track
HIPH, ANK, L1, L2 = 596.0, 74.0, 268.0, 268.0
A1, STEP = 62.0, 205.0
B1, A2 = A1 + STEP, A1 + 2 * STEP
DUR = 1.3


def rot(v, deg):
    a = math.radians(deg); return (v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a))


def foot(piv_w, piv_l, phi, k):
    """a boot turned by phi about a point of its sole that stays on the ground. k: signed length (+ toe to screen right, 1 = side on).
    returns (ground point under the ankle, ankle joint, phi, k)"""
    g = (piv_w[0] - rot(piv_l, phi)[0], piv_w[1] - rot(piv_l, phi)[1])
    a = rot((-piv_l[0], -ANK - piv_l[1]), phi)
    return dict(g=g, ank=(piv_w[0] + a[0], piv_w[1] + a[1]), phi=phi, k=k)


def toe_len(k):
    return 78 + 30 * (0.35 + 0.9 * (abs(k) - 0.6) / 0.4 if abs(k) > 0.6 else 0.35)


def feet(tl):
    # ---- foot A (screen right at the start, his left): it turns out on its heel, carries him while B steps, then takes the second step
    kA = track([(0, 0.6), (0.06, 0.6), (0.3, 1.0), (DUR, 1.0)], tl)
    ballA = 0.72 * toe_len(1.0)
    if tl < 0.62: fa = foot((A1 - 30, 0), (-30, 0), 0, kA)
    elif tl < 0.82: fa = foot((A1 + ballA, 0), (ballA, 0), 40 * smooth((tl - 0.62) / 0.2), 1.0)                      # heel off: the heel rises round the ball of the foot
    elif tl < 1.2:
        u = (tl - 0.82) / 0.38; e = smooth(u)
        f0 = foot((A1 + ballA, 0), (ballA, 0), 40, 1.0); f1 = foot((A2 - 30, 0), (-30, 0), -17, 1.0)
        g = (lerp(f0['g'][0], f1['g'][0], e), lerp(f0['g'][1], f1['g'][1], e) - 46 * math.sin(math.pi * u) ** 1.2)
        phi = track([(0, 40), (0.3, 30), (0.75, -6), (1.0, -17)], u)
        a = rot((0, -ANK), phi); fa = dict(g=g, ank=(g[0] + a[0], g[1] + a[1]), phi=phi, k=1.0)
    else: fa = foot((A2 - 30, 0), (-30, 0), -17 * (1 - smooth((tl - 1.2) / 0.1)), 1.0)                              # heel strike, then the sole rolls down
    # ---- foot B (screen left at the start, his right): it peels off first, swings through as he turns, lands heel first ahead of A
    ballB0 = -0.72 * toe_len(0.6) * 0.6
    if tl < 0.2: fb = foot((-A1, 0), (0, 0), 0, -0.6)
    elif tl < 0.36: fb = foot((-A1 + ballB0, 0), (ballB0, 0), -30 * smooth((tl - 0.2) / 0.16), -0.6)
    elif tl < 0.78:
        u = (tl - 0.36) / 0.42; e = smooth(u)
        f0 = foot((-A1 + ballB0, 0), (ballB0, 0), -30, -0.6); f1 = foot((B1 - 30, 0), (-30, 0), -17, 1.0)
        g = (lerp(f0['g'][0], f1['g'][0], e), lerp(f0['g'][1], f1['g'][1], e) - 52 * math.sin(math.pi * u) ** 1.2)
        k = track([(0, -0.6), (0.28, -0.28), (0.34, 0.28), (0.7, 1.0), (1.0, 1.0)], u)                              # the toe swings through pointing at us
        phi = track([(0, -30), (0.3, 8), (0.75, -4), (1.0, -17)], u)
        a = rot((0, -ANK), phi); fb = dict(g=g, ank=(g[0] + a[0], g[1] + a[1]), phi=phi, k=k)
    elif tl < 0.9: fb = foot((B1 - 30, 0), (-30, 0), -17 * (1 - smooth((tl - 0.78) / 0.12)), 1.0)
    elif tl < 1.16: fb = foot((B1 - 30, 0), (-30, 0), 0, 1.0)
    else: fb = foot((B1 + ballA, 0), (ballA, 0), 26 * smooth((tl - 1.16) / 0.14), 1.0)
    return fa, fb


def planted(tl):
    return (tl < 0.82 or tl >= 1.2), (tl < 0.36 or tl >= 0.78)


def hips(tl, fa, fb):
    hx = track([(0, 0), (0.2, 6), (0.5, 62), (0.78, 150), (1.0, 258), (1.2, 356), (DUR, 398)], tl)
    hy = -HIPH + 5 * math.sin(tl * 2 * math.pi / 0.42 + 1.2) * smooth((tl - 0.3) / 0.3)
    pa, pb = planted(tl)
    for f, on in ((fa, pa), (fb, pb)):                      # the hips sink just enough for a leg on the ground to reach
        if on:
            dx = f['ank'][0] - hx; m = L1 + L2 - 3
            if abs(dx) < m: hy = max(hy, f['ank'][1] - math.sqrt(m * m - dx * dx))
    return hx, hy


def leg(c, hip, f, yaw, cols, far=False, shoe=None):
    PA, PS, PH = cols
    if far: PA, PH = mix(PA, PS, 0.45), mix(PH, PA, 0.6)
    ank = f['ank']; d = math.hypot(ank[0] - hip[0], ank[1] - hip[1]); m = L1 + L2 - 1
    if d > m: ank = (hip[0] + (ank[0] - hip[0]) * m / d, hip[1] + (ank[1] - hip[1]) * m / d)
    k1 = ik2(hip, ank, L1, L2, 1); k2 = ik2(hip, ank, L1, L2, -1); ks = k1 if k1[0] > k2[0] else k2                 # in side view the knee bends forward
    kf = ((hip[0] + ank[0]) / 2, (hip[1] + ank[1]) / 2 - 6); kn = (lerp(kf[0], ks[0], yaw), lerp(kf[1], ks[1], yaw))
    # the boot
    c.save(); c.translate(*f['g']); c.rotate(f['phi'])
    sx = 1 if f['k'] >= 0 else -1; ak = max(0.28, abs(f['k']))
    c.scale(ak / max(0.6, ak) if ak < 0.6 else 1.0, 1.0)
    PN.shoe(c, 0, 0, sx, 0.35 + 0.9 * max(0.0, ak - 0.6) / 0.4, shoe)
    c.restore()
    th = PN.limb(hip, kn, 104, 86, bulge=6, bu=0.3, side=1); sh_ = PN.limb(kn, (ank[0], ank[1] - 8), 86, 66, bulge=9, bu=0.32, side=-1)
    kc = skia.Path(); kc.addCircle(kn[0], kn[1], 42)
    c.save(); c.translate(ank[0], ank[1]); c.rotate(f['phi'] * 0.6); hem = skia.Path(); hem.addRoundRect(skia.Rect(-35, -30, 35, 14), 6, 6); m_ = c.getTotalMatrix(); c.restore()
    hm = skia.Path(); hm.addRoundRect(skia.Rect(ank[0] - 35, ank[1] - 30, ank[0] + 35, ank[1] + 12), 6, 6)
    lp = PN.rounded(op(op(op(th, sh_), kc), hm), 10)
    shaded(c, lp, PA, PS, sh=(9, 3), rimL=PH, rl=(-3, -3))
    c.save(); c.clipPath(lp, skia.ClipOp.kIntersect, True)
    PN.stroke(c, [(kn[0] - 30, kn[1] - 6), (kn[0] - 4, kn[1] + 6), (kn[0] + 26, kn[1] - 8)], 3.6, PS, 150)
    PN.stroke(c, [(ank[0] - 30, ank[1] - 30), (ank[0] - 4, ank[1] - 20), (ank[0] + 28, ank[1] - 34)], 3, PS, 150)
    PN.stroke(c, [(hip[0] + 4, hip[1] + 70), (kn[0] + 2, kn[1]), (ank[0] + 2, ank[1] - 10)], 2.2, PS, 70)
    if yaw > 0.5: PN.stroke(c, [(kn[0] - 34, kn[1] + 20), (kn[0] - 14, kn[1] + 4), (kn[0] - 30, kn[1] - 22)], 3, PS, 150 * (yaw - 0.5) * 2)      # the fold behind a bent knee
    cf = skia.Path(); cf.addRoundRect(skia.Rect(ank[0] - 37, ank[1] - 6, ank[0] + 37, ank[1] + 13), 5, 5); c.drawPath(cf, P(mix(PA, PS, 0.2))); c.drawLine(ank[0] - 33, ank[1] - 6, ank[0] + 33, ank[1] - 6, SP(PS, 2.6, 220))
    c.restore()


def draw(c, tl, x0, ground, s, look, phone_fn):
    """Ray's lower body at local time tl (0 .. 1.3 s)"""
    tl = max(0.0, min(DUR, tl))
    PANT = (look['PANT'], look['PANT_SH'], look['PANT_HI']); TOP, TOP_SH, TOP_HI = look['TOP'], look['TOP_SH'], look['TOP_HI']; shoe = look['cfg'].get('shoe')
    fa, fb = feet(tl); hx, hy = hips(tl, fa, fb)
    yaw = smooth((tl - 0.1) / 0.42)
    w = lerp(1.0, 0.2, yaw)
    c.save(); c.translate(x0, ground); c.scale(s, s)
    pa, pb = planted(tl)
    for f, on in ((fa, pa), (fb, pb)):                      # contact shadows: tight under a planted boot, soft and wide under a lifted one
        lift = max(0.0, -f['g'][1]) / 50.0; sx = 1 if f['k'] >= 0 else -1
        c.drawOval(skia.Rect(f['g'][0] - 50 + sx * 34, -5, f['g'][0] + 56 + sx * 34, 17), P((40, 46, 100), 150 * (1 - 0.6 * min(1, lift)), MaskFilter=blur(5 + 9 * min(1, lift))))
    c.save(); c.concat(skia.Matrix().setAll(1, -0.66, hx * 0.0, 0, -0.085, 0, 0, 0, 1))                                # his long morning shadow goes with him
    sp = skia.Path(); sp.addRoundRect(skia.Rect(hx - 110 * lerp(1, 0.7, yaw), -1100, hx + 110 * lerp(1, 0.7, yaw), -520), 50, 50); sp.addRoundRect(skia.Rect(fa['g'][0] - 44, -600, fa['g'][0] + 44, 0), 30, 30); sp.addRoundRect(skia.Rect(fb['g'][0] - 44, -600, fb['g'][0] + 44, 0), 30, 30)
    sp.setFillType(skia.PathFillType.kWinding); c.drawPath(sp, P((72, 84, 140), 74, MaskFilter=blur(9))); c.restore()
    hipA = (hx + 47 * w, hy + 8); hipB = (hx - 47 * w, hy + 8)
    leg(c, hipA, fa, yaw, PANT, far=yaw > 0.3, shoe=shoe)
    pw = lerp(94, 66, yaw)
    pel = smooth_closed([(hx - pw * 0.9, hy - 14), (hx + pw * 0.9, hy - 14), (hx + pw, hy + 44), (hx + pw * 0.55, hy + 96), (hx, hy + 72 + 20 * yaw), (hx - pw * 0.55, hy + 96), (hx - pw, hy + 44)])
    shaded(c, pel, PANT[0], PANT[1], sh=(9, 3), rimL=PANT[2], rl=(-3, -3))
    leg(c, hipB, fb, yaw, PANT, shoe=shoe)
    # ---- the far arm (his left): the sleeve beside the jacket, the hand taking the phone down into the side pocket
    hw = lerp(104, 80, yaw); hem = hy + 38
    wy = track([(0, -696), (0.06, -690), (0.3, -566), (DUR, -566)], tl) + (hy + HIPH); wx = hx + lerp(150, 30, yaw)
    sl = PN.limb((hx + lerp(140, 20, yaw), hy - 420), (wx + 6, wy - 26), 76, 60)
    shaded(c, sl, mix(TOP, TOP_SH, 0.25 * yaw), TOP_SH, sh=(9, 3), rimL=TOP_HI, rl=(-3, -3))
    # ---- the jacket's hem over the hips
    jk = smooth_closed([(hx - hw, hy - 470), (hx + hw, hy - 470), (hx + hw + 2, hem - 60), (hx + hw - 4 + 10 * yaw, hem - 8), (hx + hw * 0.5, hem + 2), (hx - hw * 0.5, hem + 4 - 6 * yaw), (hx - hw + 4 - 12 * yaw, hem - 6 - 8 * yaw), (hx - hw - 2, hem - 60)])
    q = skia.Path(jk); q.offset(0, 10); c.save(); c.clipPath(op(pel, op(PN.limb(hipA, (hipA[0], hipA[1] + 120), 104, 100), PN.limb(hipB, (hipB[0], hipB[1] + 120), 104, 100))), skia.ClipOp.kIntersect, True); c.drawPath(q, P(PN.AO, 90, MaskFilter=blur(8))); c.restore()
    shaded(c, jk, TOP, TOP_SH, sh=(12, 4), rimL=TOP_HI, rl=(-4, -3))
    c.save(); c.clipPath(jk, skia.ClipOp.kIntersect, True)
    tw = lerp(26, 0, smooth(yaw * 1.3)); tx = hx + lerp(0, hw - 6, yaw)
    if tw > 1:
        c.drawRect(skia.Rect(tx - tw, hy - 470, tx + tw, hem + 4), P(look['cfg'].get('inner', (244, 236, 220)))); c.drawLine(tx - tw, hy - 470, tx - tw, hem, SP(TOP_SH, 3, 235)); c.drawLine(tx + tw, hy - 470, tx + tw, hem, SP(TOP_SH, 3, 235))
        for v in (-150, -94): c.drawCircle(tx + tw + 12, hem + v, 5.4, P(mix(TOP_HI, (255, 255, 255), 0.2), 255 * (1 - yaw)))
    PN.stroke(c, [(hx - hw + 6, hem - 12), (hx, hem - 10), (hx + hw - 6, hem - 12)], 3, TOP_SH, 170)
    if yaw > 0.3: PN.stroke(c, [(hx - hw * 0.5, hem - 150), (hx - hw * 0.62, hem - 80), (hx - hw * 0.5, hem - 14)], 3, TOP_SH, 150 * yaw); PN.stroke(c, [(hx + hw * 0.2, hem - 120), (hx + hw * 0.34, hem - 70), (hx + hw * 0.2, hem - 30)], 3, TOP_SH, 110 * yaw)
    pk0 = (hx + lerp(50, 96, yaw), hem - 90); pk1 = (hx + lerp(92, 112, yaw), hem - 28); pa_ = 1 - smooth((yaw - 0.35) / 0.4)
    c.drawLine(pk0[0], pk0[1], pk1[0], pk1[1], SP(TOP_SH, 3.6, 230 * pa_)); c.drawLine(pk0[0] + 3, pk0[1] + 3, pk1[0] + 3, pk1[1] + 3, SP(TOP_HI, 1.6, 120 * pa_))
    c.drawLine(hx - lerp(50, 20, yaw), hem - 90, hx - lerp(92, 44, yaw), hem - 28, SP(TOP_SH, 3.4, 220 * (1 - 0.5 * yaw)))
    c.restore()
    if tl < 0.42 and pa_ > 0.02:                             # the hand and the phone: whatever is below the pocket's slit is inside the pocket
        dx_, dy_ = pk1[0] - pk0[0], pk1[1] - pk0[1]
        pl = skia.Path(); pl.addPoly([skia.Point(pk0[0] - dx_ * 1.4, pk0[1] - dy_ * 1.4), skia.Point(pk1[0] + dx_ * 2, pk1[1] + dy_ * 2), skia.Point(pk1[0] + dx_ * 2 - 300, pk1[1] + dy_ * 2 + 400), skia.Point(pk0[0] - dx_ - 300, pk0[1] - dy_ + 400)], True)
        c.save(); c.clipPath(pl, skia.ClipOp.kDifference, True)
        hwp = (wx, wy); ang = math.radians(180)
        phone_fn(c, hwp, ang, 1, 1.22)
        H.hand(c, hwp, ang, 1, 1.22, skin=look['SKIN'], shade=look['SKIN_SH'], hi=look['SKIN_HI'], light=PN.LIGHT, curls=(0.2, 0.42, 0.44, 0.46, 0.46), spread=0.06, show_thumb=False, creases=False)
        c.restore()
    cfp = PN.limb((wx + 2, wy - 44), (wx + 5, wy - 18), 62, 58); c.drawPath(cfp, P(mix(TOP, TOP_SH, 0.5 + 0.3 * yaw)))
    # ---- the near arm (his right): it hangs, and swings back a little as the opposite leg comes forward
    sw = 22 * math.sin((tl - 0.36) * 2 * math.pi / 0.84) * smooth((tl - 0.3) / 0.3)
    ax = hx + lerp(-150, -8, yaw); ex = ax + sw * 0.4; hand_w = (ax + sw, hy + HIPH - 512 + 6 * abs(sw) / 22)
    sl2 = PN.limb((ax - lerp(0, 6, yaw), hy - 420), (hand_w[0], hand_w[1] - 26), 78, 60)
    shaded(c, sl2, TOP, TOP_SH, sh=(9, 3), rimL=TOP_HI, rl=(-3, -3))
    H.hand(c, hand_w, math.radians(90 - sw * 0.5), -1, 1.22, skin=look['SKIN'], shade=look['SKIN_SH'], hi=look['SKIN_HI'], light=PN.LIGHT, creases=False, **PN.RELAX)
    cf2 = PN.limb((hand_w[0], hand_w[1] - 44), (hand_w[0], hand_w[1] - 18), 62, 58); c.drawPath(cf2, P(mix(TOP, TOP_SH, 0.5)))
    c.restore()
    return hx
