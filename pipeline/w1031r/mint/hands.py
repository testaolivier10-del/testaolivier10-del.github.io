"""The cook's own two hands, seen from his point of view (palms toward him, fingers up), for "his left hand and his
right". A close up is used here instead of the full body because the side view figure cannot show both palms; the
sleeves and skin match the cook (same palette as art.COOK). Correct anatomy: looking at your own palms, the right
hand's thumb points right and the left hand's thumb points left; the two hands are exact mirror images.
Turning the left hand over shows its back (nails, knuckles) with the thumb now on the right: it still never matches
the right palm, because the palm now faces the other way."""
import math
import skia
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed

SKIN, SKIN_SH, SKIN_HI = (226, 168, 128), (198, 142, 106), (240, 190, 152)
SHIRT, SHIRT_SH = (70, 96, 136), (52, 72, 106)
CUFF = (104, 132, 172)      # the rolled shirt sleeve (same fabric as the cook's)
# fingers in the right hand's palm view: (base x, base y, length, width, splay deg); thumb listed separately
FINGERS = [(-50, -150, 92, 30, -9), (-17, -160, 116, 33, -3), (17, -160, 126, 34, 1), (51, -150, 112, 33, 6)]
THUMB = ((62, -40), 110, 38, 52)


def _cap(x0, y0, ang, L, w, w2=None):
    w2 = w2 or w * 0.86
    a = math.radians(ang); dx, dy = math.sin(a), -math.cos(a); nx, ny = -dy, dx
    x1, y1 = x0 + dx * L, y0 + dy * L
    p = skia.Path()
    p.moveTo(x0 + nx * w / 2, y0 + ny * w / 2); p.lineTo(x1 + nx * w2 / 2, y1 + ny * w2 / 2)
    p.arcTo(skia.Rect(x1 - w2 / 2, y1 - w2 / 2, x1 + w2 / 2, y1 + w2 / 2), math.degrees(math.atan2(ny, nx)), -180, False)
    p.lineTo(x0 - nx * w / 2, y0 - ny * w / 2); p.close()
    return p, (x1, y1), (dx, dy)


def _union(ps):
    out = ps[0]
    for p in ps[1:]:
        r = skia.Op(out, p, skia.PathOp.kUnion_PathOp)
        if r is not None: out = r
    return out


def hand_paths():
    palm = smooth_closed([(-66, -150), (-30, -170), (30, -170), (70, -150), (78, -80), (66, -10), (40, 30), (-40, 30), (-70, -20), (-76, -90)])
    parts = [palm]; tips = []
    for x, y, L, w, a in FINGERS:
        p, tip, d = _cap(x, y + 10, a, L + 10, w); parts.append(p); tips.append((tip, d, w, a))
    (tx, ty), L, w, a = THUMB
    tp, ttip, td = _cap(tx - 10, ty, a, L, w, w * 0.9); parts.append(tp); tips.append((ttip, td, w, a))
    return _union(parts), palm, tips


OUTLINE, PALM, TIPS = hand_paths()


def draw_hand(c, x, y, side, flip=1.0, rot=0.0, s=1.0, hl=0.0, hl_col=(255, 90, 90), forearm_to=None, dim=0.0):
    """side +1 = right hand, -1 = left hand (palm view). flip in [-1, 1]: the hand turning over about its vertical
    axis (1 = palm toward the viewer, -1 = back toward the viewer). forearm_to: point the forearm runs to."""
    # forearm and sleeve first (behind the hand), from the wrist down to forearm_to
    if forearm_to is not None:
        fx, fy = forearm_to
        dx, dy = fx - x, fy - y; n = math.hypot(dx, dy) or 1; nx, ny = -dy / n, dx / n
        if nx < 0: nx, ny = -nx, -ny          # -n side is the left, away from the window light
        w0, w1 = 50 * s, 70 * s
        arm = skia.Path(); arm.moveTo(x + nx * w0, y + ny * w0); arm.lineTo(fx + nx * w1, fy + ny * w1)
        arm.lineTo(fx - nx * w1, fy - ny * w1); arm.lineTo(x - nx * w0, y - ny * w0); arm.close()
        c.drawPath(arm, P(mix(SKIN, (30, 30, 40), dim)))
        sh = skia.Path(); sh.moveTo(x - nx * w0 * 0.2, y - ny * w0 * 0.2); sh.lineTo(fx - nx * w1 * 0.2, fy - ny * w1 * 0.2)
        sh.lineTo(fx - nx * w1, fy - ny * w1); sh.lineTo(x - nx * w0, y - ny * w0); sh.close()
        c.drawPath(sh, P(mix(SKIN_SH, (30, 30, 40), dim)))
        # rolled cuff then the shirt sleeve
        for u0, u1, col in ((0.55, 0.68, CUFF), (0.68, 1.4, SHIRT)):
            a0 = (x + dx * u0, y + dy * u0); a1 = (x + dx * u1, y + dy * u1); wa = lerp(w0, w1, u0) * 1.22; wb = lerp(w0, w1, min(1, u1)) * 1.3
            q = skia.Path(); q.moveTo(a0[0] + nx * wa, a0[1] + ny * wa); q.lineTo(a1[0] + nx * wb, a1[1] + ny * wb)
            q.lineTo(a1[0] - nx * wb, a1[1] - ny * wb); q.lineTo(a0[0] - nx * wa, a0[1] - ny * wa); q.close()
            c.drawPath(q, P(mix(col, (30, 30, 40), dim)))
            c.drawLine(a0[0] + nx * wa, a0[1] + ny * wa, a0[0] - nx * wa, a0[1] - ny * wa, SP(mix(mix(col, (0, 0, 0), 0.2), (30, 30, 40), dim), 5))
    back = flip < 0
    sx = side * max(0.04, abs(flip)) * (1 if not back else -1)
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx * s, s)
    base = mix(SKIN_SH if back else SKIN, (30, 30, 40), dim)
    shade = mix(mix(SKIN_SH, (120, 70, 50), 0.25), (30, 30, 40), dim)
    c.drawPath(OUTLINE, P(base))
    # one shade band on the side away from the window light (the light comes from the upper right of the frame)
    q = skia.Path(OUTLINE); q.offset(14 * (1 if sx > 0 else -1), -10)
    d = skia.Op(OUTLINE, q, skia.PathOp.kDifference_PathOp)
    if d is not None: c.drawPath(d, P(shade))
    if not back:
        # palm creases and finger joint creases
        for pts in (((-60, -100), (-10, -112), (40, -96)), ((-56, -70), (0, -78), (30, -58)), ((40, -20), (24, -70), (30, -120))):
            p = skia.Path(); p.moveTo(*pts[0]); p.quadTo(*pts[1], *pts[2]); c.drawPath(p, SP(shade, 3.4))
        for (tip, dd, w, a) in TIPS[:4]:
            for f in (0.42, 0.7):
                bx, by = tip[0] - dd[0] * (1 - f) * 120, tip[1] - dd[1] * (1 - f) * 120
                c.drawLine(bx - w * 0.32, by, bx + w * 0.32, by, SP(shade, 2.6, 200))
        c.drawCircle(-20, -40, 40, P(SKIN_HI, 90, MaskFilter=blur(16)))
    else:
        # back of the hand: nails at the finger tips, knuckle lines, tendons
        for (tip, dd, w, a) in TIPS:
            nx_, ny_ = tip[0] - dd[0] * 18, tip[1] - dd[1] * 18
            c.save(); c.translate(nx_, ny_); c.rotate(a)
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w * 0.3, -14, w * 0.3, 12), 8, 8), P(mix((246, 214, 200), (30, 30, 40), dim)))
            c.restore()
        for (tip, dd, w, a) in TIPS[:4]:
            kx, ky = tip[0] - dd[0] * 110, tip[1] - dd[1] * 110
            c.drawArc(skia.Rect(kx - 14, ky - 6, kx + 14, ky + 8), 200, 140, False, SP(shade, 3))
        for xx in (-40, -12, 16, 44):
            c.drawLine(xx * 0.6, -10, xx, -130, SP(shade, 2.4, 140))
    if hl > 0.01:
        c.drawPath(OUTLINE, SP(hl_col, 9, 255 * hl))
        tx, ty = TIPS[4][0]
        c.drawCircle(tx - 20, ty + 30, 60, SP(hl_col, 7, 255 * hl))
    c.restore()
