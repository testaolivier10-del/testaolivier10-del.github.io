"""The boots insert (round 3): a low close shot from the side of the conductor's boots and coat hem taking two careful steps on wet setts.
Purpose built side view of the legs below the coat. Each foot is planted at a fixed place ON THE ROAD for its whole stance (heel down, roll to flat,
heel off, toe off) and only moves through the air between; the camera follows him at part of his speed, and the setts are drawn in the same road
coordinates, so a planted boot and the stones under it move together. The coat hem follows the hips a beat late. Units: metres on the road."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/smog']
sys.path += ['/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import world as Wd
from world import fog, glow, SMOG
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, ik2
from art import diffp, op

PPM = 1000.0                 # pixels per metre at his distance
GY = 1352.0                  # the road line under his boots (screen y)
L_STEP = 0.36                # one step
T_CYC = 1.7                  # two steps
V = 2 * L_STEP / T_CYC
HIP_H, THIGH, SHIN = 0.84, 0.43, 0.42
NAVY, NAVY_D, RIM = (40, 48, 78), (18, 20, 40), (250, 160, 84)
TROU, TROU_D = (30, 32, 50), (12, 12, 26)
BOOT, BOOT_D, BOOT_HI = (34, 32, 40), (10, 10, 16), (150, 130, 110)


def foot_state(tt, ph0):
    """one foot at cycle time tt: returns (x of the ankle, height of the ankle, pitch in degrees (+ = toe up), x where it is planted, how lifted 0..1)"""
    cyc = tt / T_CYC + ph0; n = math.floor(cyc); p = cyc - n
    xs = n * 2 * L_STEP + 0.62 * L_STEP                       # where the ankle is planted this cycle (the hips pass over it in mid stance)
    HEEL, BALL, AH = -0.065, 0.165, 0.105                     # heel and ball of the foot from the ankle, ankle height
    if p < 0.62:                                              # stance: the boot does not move along the road
        if p < 0.1:                                           # heel down first, then the sole rolls flat (turning about the heel)
            a = math.radians(16.0 * (1 - smooth(p / 0.1))); return xs + (-HEEL) * (1 - math.cos(a)) - AH * math.sin(a), AH * math.cos(a) + (-HEEL) * math.sin(a), math.degrees(a), xs, 0.0
        if p < 0.4: return xs, AH, 0.0, xs, 0.0
        a = math.radians(-40.0 * smooth((p - 0.4) / 0.22) ** 1.3)                # the heel peels up, the boot stays on the ball of the foot
        return xs + BALL - BALL * math.cos(a) - AH * math.sin(a), AH * math.cos(a) - BALL * math.sin(a), math.degrees(a), xs, 0.0
    u = (p - 0.62) / 0.38; e = u * u * (3 - 2 * u)            # swing: carried through to the next place
    a0 = math.radians(-40.0); x0 = xs + BALL - BALL * math.cos(a0) - AH * math.sin(a0); y0 = AH * math.cos(a0) - BALL * math.sin(a0)
    a1 = math.radians(16.0); x1 = xs + 2 * L_STEP + (-HEEL) * (1 - math.cos(a1)) - AH * math.sin(a1); y1 = AH * math.cos(a1) + (-HEEL) * math.sin(a1)
    th = lerp(-40.0, 16.0, smooth((u - 0.1) / 0.8)); lift = math.sin(math.pi * u) ** 0.9
    return lerp(x0, x1, e), lerp(y0, y1, e) + 0.055 * lift, th, None, lift


def boot(c, ax, ay, th, far=False, lit=1.0):
    """a laced leather boot seen from the side, drawn around the ankle point (screen px), pitched th degrees"""
    k = PPM; c.save(); c.translate(ax, ay); c.rotate(-th)
    b, d, hi = (mix(BOOT, SMOG, 0.13), mix(BOOT_D, SMOG, 0.13), BOOT_HI) if far else (BOOT, BOOT_D, BOOT_HI)
    sole = smooth_closed([(-0.075 * k, 0.085 * k), (-0.08 * k, 0.105 * k), (0.2 * k, 0.105 * k), (0.232 * k, 0.094 * k), (0.225 * k, 0.078 * k), (0.06 * k, 0.085 * k)])
    heel = skia.Path(); heel.addRRect(skia.RRect.MakeRectXY(skia.Rect(-0.08 * k, 0.08 * k, 0.0 * k, 0.108 * k), 4, 4))
    up = smooth_closed([(-0.062 * k, -0.11 * k), (0.05 * k, -0.11 * k), (0.058 * k, -0.03 * k), (0.11 * k, 0.012 * k), (0.19 * k, 0.03 * k), (0.228 * k, 0.062 * k), (0.226 * k, 0.088 * k), (-0.074 * k, 0.09 * k), (-0.08 * k, 0.02 * k)])
    c.drawPath(up, P(b)); c.drawPath(diffp(up, (-9, -5)), P(d)); c.drawPath(diffp(up, (5, 6)), P(mix(b, RIM, 0.75 * lit), 235))
    c.save(); c.clipPath(up, skia.ClipOp.kIntersect, True)
    c.drawPath(smooth_closed([(0.13 * k, 0.02 * k), (0.2 * k, 0.03 * k), (0.24 * k, 0.07 * k), (0.15 * k, 0.1 * k), (0.12 * k, 0.06 * k)]), P(mix(b, (90, 84, 90), 0.5)))       # toe cap
    pth = skia.Path(); pth.moveTo(0.118 * k, 0.012 * k); pth.quadTo(0.14 * k, 0.05 * k, 0.126 * k, 0.092 * k); c.drawPath(pth, SP(d, 3))
    pth = skia.Path(); pth.moveTo(-0.07 * k, 0.03 * k); pth.quadTo(-0.02 * k, 0.02 * k, -0.01 * k, 0.09 * k); c.drawPath(pth, SP(d, 3, 200))                               # heel counter
    for j in range(5):                                        # lacing up the front
        u = j / 4; px, py = lerp(0.048, 0.092, u ** 1.6) * k, lerp(-0.095, 0.0, u) * k
        c.drawLine(px - 0.03 * k, py + 0.006 * k, px, py, SP(mix(hi, d, 0.3), 3.2)); c.drawCircle(px, py, 3.4, P(mix(hi, (255, 220, 160), 0.4 * lit)))
    c.drawOval(skia.Rect(0.14 * k, 0.03 * k, 0.21 * k, 0.055 * k), P((255, 214, 150), 90 * lit, MaskFilter=blur(5)))                                                     # the wet shine on the toe
    c.restore()
    c.drawPath(sole, P(mix((20, 18, 18), SMOG, 0.2 if far else 0.0))); c.drawPath(heel, P(mix((14, 13, 13), SMOG, 0.2 if far else 0.0)))
    c.drawLine(-0.07 * k, 0.086 * k, 0.222 * k, 0.082 * k, SP(mix(d, RIM, 0.35 * lit), 2.4, 200))
    c.restore()


def leg(c, hip, ank, th, far=False, lit=1.0):
    kx, ky = ik2(hip, ank, THIGH * PPM, SHIN * PPM, bend=-1)   # the knee goes forward
    tr, trd = (mix(TROU, SMOG, 0.13), mix(TROU_D, SMOG, 0.13)) if far else (TROU, TROU_D)
    dx, dy = ank[0] - kx, ank[1] - ky; n = math.hypot(dx, dy) or 1; nx, ny = -dy / n, dx / n
    w0, w1 = 0.062 * PPM, 0.052 * PPM
    shin = smooth_closed([(kx + nx * w0 - dx * 0.2, ky + ny * w0 - dy * 0.2), (kx - nx * w0 - dx * 0.2, ky - ny * w0 - dy * 0.2), (lerp(kx, ank[0], 0.5) - nx * w0 * 1.05, lerp(ky, ank[1], 0.5) - ny * w0 * 1.05),
                          (ank[0] - nx * w1 - dx * 0.02, ank[1] - ny * w1 - 0.07 * PPM), (ank[0] + nx * w1 * 1.1, ank[1] + ny * w1 - 0.06 * PPM), (lerp(kx, ank[0], 0.5) + nx * w0 * 0.92, lerp(ky, ank[1], 0.5) + ny * w0 * 0.92)])
    c.drawPath(shin, P(tr)); c.drawPath(diffp(shin, (-10, -3)), P(trd)); c.drawPath(diffp(shin, (5, 3)), P(mix(tr, RIM, 0.7 * lit), 220))
    c.save(); c.clipPath(shin, skia.ClipOp.kIntersect, True)
    for j, u in enumerate((0.55, 0.7, 0.84)):                 # the trouser leg breaks in folds over the boot
        px, py = lerp(kx, ank[0], u), lerp(ky, ank[1], u) - 0.03 * PPM
        pth = skia.Path(); pth.moveTo(px - nx * w0, py - ny * w0 - 8); pth.quadTo(px, py + 14 - j * 3, px + nx * w0, py + ny * w0 - 10); c.drawPath(pth, SP(trd, 4, 200 - j * 30))
    c.restore()
    boot(c, ank[0], ank[1], th, far, lit)
    return (kx, ky)


def setts(c, cam_x, t, yh):
    """the wet road from low down: rows of setts running away to a near horizon, drawn in road coordinates so they hold still under a planted boot"""
    c.drawRect(skia.Rect(0, yh, 1080, 1920), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, yh), skia.Point(0, 1920)], [C((104, 94, 50)), C((66, 60, 36)), C((30, 28, 20))], [0, 0.4, 1.0])))
    r = np.random.default_rng(11)
    rows = [yh + 14, yh + 34, yh + 62, yh + 100, yh + 150, yh + 214, yh + 296, yh + 400, yh + 530, yh + 700, yh + 900]
    tones = r.uniform(-1, 1, (len(rows), 64))
    for i in range(len(rows) - 1):
        y0, y1 = rows[i], rows[i + 1]; ym = (y0 + y1) / 2; k = (ym - yh) / (GY - yh)          # how near this row is (1 = at his feet)
        w = 0.2 * PPM * k; off = (i % 2) * w / 2
        j0 = int(math.floor((cam_x * PPM * k - 600) / w)) - 1
        for j in range(j0, j0 + int(1300 / w) + 4):
            x0 = 540 + j * w + off - cam_x * PPM * k
            tn = tones[i, j % 64]; col = mix((70, 64, 40), (120, 108, 62) if tn > 0 else (34, 32, 24), abs(tn) * 0.55)
            st = skia.Path(); st.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0 + 2.5 * k, y0 + 2 * k, x0 + w - 2.5 * k, y1 - 1.5 * k), 7 * k, 5 * k)); c.drawPath(st, P(col, 150))
            c.drawLine(x0 + 8 * k, y0 + 4 * k, x0 + w - 8 * k, y0 + 4 * k, SP((214, 192, 110), max(1.0, 2.6 * k), 90 + 40 * tn))             # each wet stone catches the light along its top edge
        c.drawLine(0, y0, 1080, y0, SP((14, 13, 10), max(1.2, 4 * k), 200))


def insert(c, t, t0, dur, flip=False):
    """the shot. t0 = its start; he walks left to right, away from the bus whose lamps glow far behind him on the left"""
    tt = t - t0 + 0.55; u = (t - t0) / dur
    cam_x = 0.6 * V * tt + 0.233                               # the camera follows at six tenths of his pace
    z = 1.0 + 0.04 * u
    c.save()
    if flip: c.translate(1080, 0); c.scale(-1, 1)
    c.translate(540, 1100); c.scale(z, z); c.translate(-540, -1100)
    yh = 1040.0
    c.drawRect(skia.Rect(-50, -50, 1130, yh + 6), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, yh)], [C((26, 24, 18)), C((70, 63, 34)), C((112, 100, 50))], [0, 0.55, 1.0])))
    fog(c, t, SMOG, 0.4, 2.8, -10, 2, seed=1)
    for (bx, by, r_) in ((150 - 60 * u, 838, 86 + 10 * u), (368 - 50 * u, 846, 80 + 9 * u)):                 # the bus's two headlamps, soft with distance and smog, creeping nearer
        f = 0.95 + 0.05 * math.sin(t * 13 + bx); by2 = by + 3 * math.sin(2 * math.pi * 1.15 * t)
        glow(c, bx, by2, r_ * 4.2, (226, 200, 104), 110 * f); glow(c, bx, by2, r_ * 1.7, (255, 232, 160), 170 * f); c.drawCircle(bx, by2, r_ * 0.5, P((255, 250, 226), 235, MaskFilter=blur(16)))
    c.drawRect(skia.Rect(-50, 560, 520, 1010), P((60, 22, 22), 60, MaskFilter=blur(60)))                    # the dark red bulk of it behind the lamps
    kx_ = 1.0
    c.drawRect(skia.Rect(-50, yh - 26, 1130, yh + 4), P((36, 33, 22))); c.drawRect(skia.Rect(-50, yh - 30, 1130, yh - 22), P((128, 116, 70), 200))       # the far kerb
    setts(c, cam_x, t, yh)
    for (bx, col, a_) in ((150 - 60 * u, (240, 216, 130), 120), (368 - 50 * u, (240, 216, 130), 110)):       # their light lying on the wet road
        c.drawOval(skia.Rect(bx - 130, yh + 6, bx + 130, 1900), P(col, a_ * 0.55, MaskFilter=blur(46))); c.drawOval(skia.Rect(bx - 40, yh + 10, bx + 40, 1700), P(col, a_ * 0.6, MaskFilter=blur(20)))
    fl = Wd.flick(t); c.drawOval(skia.Rect(240, GY - 60, 1000, GY + 260), P((255, 150, 60), 70 * fl, MaskFilter=blur(60)))                           # the flare's light on the road around him
    fog(c, t, SMOG, 0.26, 3.2, -14, 1, seed=2, oy=140)
    # the man: hips, two feet, coat
    hx = V * tt; S = lambda x, h: (540 + (x - cam_x) * PPM, GY - 0.105 * PPM - (h - 0.105) * PPM + 0.0)           # road metres to screen; h = height above the road
    pc = (tt / T_CYC) % 1.0
    hh = HIP_H - 0.012 + 0.014 * math.cos(4 * math.pi * (pc - 0.31))                                                   # the hips ride up over each planted leg
    hip = (540 + (hx - cam_x) * PPM, GY - hh * PPM)
    fa = foot_state(tt, 0.0); fb = foot_state(tt, 0.5)
    for (f_, far) in ((fb, True), (fa, False)):
        if f_[3] is not None or f_[4] < 0.5:                  # a soft contact shadow where a boot is on or near the road
            sx_ = 540 + (f_[0] - cam_x) * PPM; c.drawOval(skia.Rect(sx_ - 110, GY - 6, sx_ + 250, GY + 26), P((6, 6, 8), 170 * (1 - f_[4]), MaskFilter=blur(9 + 10 * f_[4])))
    aB = (540 + (fb[0] - cam_x) * PPM, GY - fb[1] * PPM); aA = (540 + (fa[0] - cam_x) * PPM, GY - fa[1] * PPM)
    hem_y = GY - 0.44 * PPM + 6 * math.sin(4 * math.pi * (pc - 0.4))
    c.save(); c.clipRect(skia.Rect(-200, hem_y - 16, 1400, 2200))          # everything above the hem is under the coat
    kB = leg(c, (hip[0] + 0.02 * PPM, hip[1]), aB, fb[2], far=True, lit=fl)
    kA = leg(c, hip, aA, fa[2], far=False, lit=fl)
    c.restore()
    # the coat skirt: it hangs from the hips, the hem a beat behind them, pushed out in front by whichever shin is forward
    lag = 0.045 * math.sin(2 * math.pi * (2 * pc - 0.22)); sw = 0.02 * math.sin(2 * math.pi * (pc - 0.2))
    hem_y = GY - 0.44 * PPM + 6 * math.sin(4 * math.pi * (pc - 0.4))
    kf = max(kA[0], kB[0]); kb = min(kA[0], kB[0])           # the knees push the cloth: it always covers them
    front = max(hip[0] + (0.2 - lag) * PPM, kf + 0.1 * PPM)
    back = min(hip[0] - (0.25 + lag * 1.2) * PPM, kb - 0.12 * PPM)
    top = -60.0
    coat = smooth_closed([(hip[0] - 0.2 * PPM, top), (hip[0] + 0.21 * PPM, top), (hip[0] + 0.2 * PPM, hip[1] - 0.1 * PPM), (lerp(hip[0] + 0.2 * PPM, front, 0.75), lerp(hip[1], hem_y, 0.5)), (front, hem_y - 8), (front - 0.03 * PPM, hem_y + 14),
                          (lerp(front, back, 0.5), hem_y + 22 + 8 * math.sin(2 * math.pi * (2 * pc))), (back + 0.03 * PPM, hem_y + 12), (back, hem_y - 12), (lerp(hip[0] - 0.22 * PPM, back, 0.6), lerp(hip[1], hem_y, 0.55)), (hip[0] - 0.23 * PPM, hip[1] - 0.1 * PPM)])
    c.drawPath(coat, P((0, 0, 0), 110, MaskFilter=blur(14)))
    c.drawPath(coat, P(NAVY)); c.drawPath(diffp(coat, (-22, -4)), P(NAVY_D)); c.drawPath(diffp(coat, (7, 5)), P(mix(NAVY, RIM, 0.8 * fl), 230))
    c.save(); c.clipPath(coat, skia.ClipOp.kIntersect, True)
    for j, (o, a_) in enumerate(((-0.14, 190), (-0.04, 150), (0.07, 170), (0.15, 120))):                     # long folds that sway with the hem
        x0 = hip[0] + o * PPM; x1 = lerp(back, front, (o + 0.25) / 0.45) + 0.0
        pth = skia.Path(); pth.moveTo(x0, 200); pth.quadTo(lerp(x0, x1, 0.4) - 18 * math.sin(2 * math.pi * (2 * pc - 0.1 * j)), lerp(200, hem_y, 0.6), x1, hem_y + 24); c.drawPath(pth, SP(NAVY_D, 5, a_))
    c.drawRect(skia.Rect(back - 40, hem_y - 16, front + 40, hem_y + 40), P(NAVY_D, 130, MaskFilter=blur(9)))                                           # the hem turns under
    c.drawOval(skia.Rect(hip[0] - 0.02 * PPM, top, hip[0] + 0.4 * PPM, hem_y), P((255, 170, 90), 36 * fl, MaskFilter=blur(50)))                     # flare light down the front of the skirt
    c.restore()
    fog(c, t, SMOG, 0.14, 4.4, -22, 2, seed=4)
    c.restore()
    Wd.flecks(c, t, 1.0, n=40)


if __name__ == '__main__':
    import cv2
    fr = []
    for i in range(16):
        t = i * (2.06 / 16); s = skia.Surface(1080, 1920); c = s.getCanvas(); insert(c, t, 0.0, 2.06)
        im = s.makeImageSnapshot().toarray()[:, :, :3]; fr.append(cv2.resize(im[560:1560], (405, 375), interpolation=cv2.INTER_AREA))
    cv2.imwrite('out/test/steps_strip.jpg', np.vstack([np.hstack(fr[:8]), np.hstack(fr[8:])]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    s = skia.Surface(1080, 1920); c = s.getCanvas(); insert(c, 0.9, 0.0, 2.06); s.makeImageSnapshot().save('out/test/steps_full.png')
