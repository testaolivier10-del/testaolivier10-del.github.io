"""A dairy cow seen from the side, built from real proportions (withers about 1.4 m, body about 2.3 times as long as the legs are tall,
legs about 45 percent of the height, hind legs with the hock bent backward, a deep chest, hip bones and pin bones on the rump,
an udder between the hind legs, a long tail with a switch). Flat house style: one base, one shade band away from the light,
one rim. Grazing: the neck lowers the head to the grass and the jaw works; the tail swishes. Walking: lateral sequence gait,
hooves planted while on the ground. Feet at y=0, facing +x; units are cm at s=1 (withers 140)."""
import math
import skia
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from art import shaded, diffp, op
from guy import limb

RED = dict(base=(166, 84, 54), sh=(118, 56, 44), hi=(222, 140, 96), patch=None, muzzle=(214, 162, 146))
PIED = dict(base=(70, 52, 50), sh=(42, 32, 36), hi=(140, 112, 100), patch=(240, 234, 222), muzzle=(214, 170, 156))
LIGHT = (-0.7, -0.6)


def leg(c, hip, knee, hoof, w0, w1, col, sh):
    a = limb(hip, knee, w0, w1 * 1.1, bulge=3, bu=0.3); b = limb(knee, (hoof[0], hoof[1] - 8), w1 * 1.05, w1 * 0.8)
    j = skia.Path(); j.addCircle(knee[0], knee[1], w1 * 0.58)
    p = op(op(a, b), j)
    shaded(c, p, col, sh, sh=(5, 2))
    hv = smooth_closed([(hoof[0] - w1 * 0.42, hoof[1] - 11), (hoof[0] + w1 * 0.36, hoof[1] - 11), (hoof[0] + w1 * 0.6, hoof[1] - 1), (hoof[0] - w1 * 0.48, hoof[1] - 1)])
    c.drawPath(hv, P((58, 46, 46))); c.drawLine(hoof[0] + w1 * 0.05, hoof[1] - 9, hoof[0] + w1 * 0.12, hoof[1] - 1, SP((30, 22, 26), 1.6))


def cow(c, x, y, s, t=0.0, facing=1, look=None, graze=0.0, chew=0.0, tail=0.0, walk=None, ph=0.0, shadow=True):
    """graze 0 = head up, 1 = muzzle on the grass. walk = gait phase in cycles (None = standing)."""
    K = look or RED
    base, sh, hi = K['base'], K['sh'], K['hi']
    far = mix(base, (30, 22, 30), 0.3); far_sh = mix(sh, (20, 14, 22), 0.3)
    c.save(); c.translate(x, y); c.scale(s * facing * 0.9, s)
    if shadow: c.drawOval(skia.Rect(-150, -12, 150, 12), P((20, 24, 10), 110, MaskFilter=blur(9)))
    br = 1.5 * math.sin(t * 2.1 + ph)                           # breathing in the barrel
    # leg swing (lateral walk): angle per leg, hooves lift on the forward swing only
    def gait(off):
        if walk is None: return 0.0, 0.0
        u = (walk + off) % 1.0
        if u < 0.7: a = lerp(14, -14, u / 0.7); lift = 0.0              # stance: the hoof stays planted while the body passes over it
        else: v = (u - 0.7) / 0.3; a = lerp(-14, 14, smooth(v)); lift = math.sin(v * math.pi) * 12
        return math.radians(a), lift
    def leg_pts(hx, hy, kx_, ky_, off, hind):
        a, lift = gait(off)
        L1 = math.hypot(kx_ - hx, ky_ - hy); a1 = math.atan2(kx_ - hx, ky_ - hy) + a
        k_ = (hx + L1 * math.sin(a1), hy + L1 * math.cos(a1))
        hoof = (k_[0] + (hx - kx_) * 0.15 * (1 if hind else -0.3) + math.sin(a) * 30, -lift)
        return k_, hoof
    # far legs first (darker), then the body, then the near legs
    for (hx, hy, kx_, ky_, off, hind) in ((58, -78, 60, -36, 0.5, False), (-80, -86, -96, -40, 0.0, True)):
        k_, hoof = leg_pts(hx, hy, kx_, ky_, off, hind); leg(c, (hx, hy), k_, hoof, 30 if not hind else 40, 17, far, far_sh)
    # tail: hangs from the tail head, swishes from the root, the switch trails
    sw = tail
    tp = [(-128, -136)]
    for i in range(1, 7):
        u = i / 6; ang = math.radians(8 + 24 * sw * u ** 1.4)
        px, py = tp[-1]; tp.append((px - 4 * math.cos(ang) + 16 * math.sin(ang) * 0.4 * sw, py + 16 * math.cos(ang)))
    tpa = skia.Path(); tpa.moveTo(*tp[0])
    for q in tp[1:]: tpa.lineTo(*q)
    c.drawPath(tpa, SP(sh, 6))
    ex, ey = tp[-1]; sws = smooth_closed([(ex - 6, ey - 8), (ex + 6, ey - 8), (ex + 8, ey + 14), (ex + 1, ey + 30), (ex - 7, ey + 14)])
    c.drawPath(sws, P(mix(sh, (30, 20, 20), 0.4)))
    # head and neck: graze lowers the head on an arc from the shoulder
    g = smooth(graze)
    hb = (lerp(136, 158, g), lerp(-130, -40, g))                 # base of the skull (poll)
    ha = lerp(0.62, 1.3, g)                                     # head angle: about level when up, pointing down to the grass when grazing
    neck = smooth_closed([(70, -144), (lerp(124, 136, g), lerp(-142, -60, g)), (hb[0] + 10 * math.cos(ha), hb[1] - 12), (hb[0] + 18 * math.sin(ha), hb[1] + 22 * math.cos(ha)),
                          (lerp(128, 140, g), lerp(-88, -20, g)), (100, -72), (84, -64)])
    # the barrel: deep chest, belly, flank, hip and pin bones
    body = smooth_closed([(-130, -132), (-112, -146), (-92, -142), (-60, -136 - br * 0.3), (0, -140 - br * 0.3), (60, -146), (84, -142), (104, -126), (110, -100),
                          (100, -72), (80, -62), (30, -60 + br), (-30, -62 + br), (-70, -68), (-108, -80), (-130, -100)])
    dew = smooth_closed([(100, -76), (lerp(126, 140, g), lerp(-92, -26, g)), (lerp(118, 132, g), lerp(-70, -10, g)), (96, -60)])
    whole = op(op(body, neck), dew)
    shaded(c, whole, base, sh, sh=(10, 9), rimL=hi, rl=(-3, -3))
    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
    if K['patch']:
        for pp in ([(-40, -150), (20, -150), (40, -110), (0, -86), (-50, -96)], [(70, -150), (100, -140), (96, -96), (66, -104)]):
            c.drawPath(smooth_closed(pp), P(K['patch']))
    c.drawPath(smooth_closed([(-60, -70), (40, -64), (100, -76), (110, -40), (-110, -40)]), P(sh, 120, MaskFilter=blur(8)))   # under the belly
    for (a_, b_, d_) in (((-14, -126), (-6, -100), (-16, -80)), ((6, -128), (14, -102), (4, -80)), ((26, -128), (32, -104), (24, -82))):
        p = skia.Path(); p.moveTo(*a_); p.quadTo(*b_, *d_); c.drawPath(p, SP(sh, 2.4, 50))    # ribs under the hide
    c.drawOval(skia.Rect(-106, -146, -86, -134), P(hi, 90, MaskFilter=blur(3)))      # hip bone and pin bone catch the light
    p = skia.Path(); p.moveTo(-70, -136); p.quadTo(-100, -100, -86, -70); c.drawPath(p, SP(sh, 3, 120))   # the thigh line
    c.restore()
    # udder and teats between the hind legs
    ud = smooth_closed([(-72, -70), (-44, -68), (-42, -56), (-52, -48), (-68, -50)])
    c.drawPath(ud, P(mix(K['muzzle'], base, 0.35)))
    for tx in (-64, -50): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - 2.5, -52, tx + 2.5, -42), 2.5, 2.5), P(mix(K['muzzle'], base, 0.5)))
    # head: a long wedge from the poll to the muzzle, ear, eye, short horn
    c.save(); c.translate(*hb); c.rotate(math.degrees(ha))
    jaw = 3 * math.sin(chew * 9.0) if chew else 0.0
    hd = smooth_closed([(-12, -14), (12, -18), (44, -14), (64, -10), (72, 2 + jaw * 0.3), (70, 16 + jaw), (58, 24 + jaw), (36, 30 + jaw), (12, 34), (-8, 24), (-14, 6)])
    shaded(c, hd, base, sh, sh=(4, 7), rimL=hi, rl=(-2, -2))
    if K['patch']: c.drawPath(smooth_closed([(8, -18), (40, -13), (58, -2), (40, 2), (12, -2)]), P(K['patch']))
    mz = smooth_closed([(56, -12), (68, -9), (75, 3 + jaw * 0.3), (72, 17 + jaw), (60, 25 + jaw), (54, 8)])
    c.drawPath(mz, P(K['muzzle'])); c.drawOval(skia.Rect(64, -6, 71, 2), P((70, 46, 50))); c.drawLine(58, 17 + jaw, 72, 15 + jaw, SP((150, 100, 96), 1.8))
    c.drawPath(smooth_closed([(4, 20), (26, 26), (36, 30 + jaw), (12, 34), (-8, 24)]), P(sh, 140))
    c.drawCircle(16, -4, 4.4, P((26, 18, 22))); c.drawCircle(15, -5.3, 1.4, P((255, 255, 255), 200)); c.drawArc(skia.Rect(9, -11, 23, 3), 200, 140, False, SP(sh, 2))
    ear = smooth_closed([(-2, -8), (-16, -30), (-24, -30), (-10, -2)]); shaded(c, ear, base, sh, sh=(2, 3)); c.drawPath(smooth_closed([(-8, -11), (-26, -21), (-28, -18), (-10, -7)]), P(K['muzzle'], 160))
    hn = smooth_closed([(-6, -14), (-4, -30), (4, -38), (6, -34), (2, -16)]); c.drawPath(hn, P((236, 224, 200)))
    c.restore()
    # near legs
    for (hx, hy, kx_, ky_, off, hind) in ((74, -76, 76, -36, 0.0, False), (-96, -88, -112, -40, 0.5, True)):
        k_, hoof = leg_pts(hx, hy, kx_, ky_, off, hind); leg(c, (hx, hy), k_, hoof, 32 if not hind else 44, 18, base, sh)
    c.restore()
