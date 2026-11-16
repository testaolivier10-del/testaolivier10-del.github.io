"""w1111-02-great-smog (AP Environmental Science 7.3, thermal inversion). 1080x1920, 30 fps, all drawn in code (skia).
Logline: in the Great Smog of London a bus conductor has to walk ahead of his own bus with a flare, because the city's coal smoke is trapped
under a lid of warm air and cannot rise away.
Beat sheet: hook 0 to 3 s (a man in danger in the murk, flare up, the bus creeping behind him) / the driver cannot see (his face, straining) /
the question, and the rise up the brick fronts to the chimneys / normal night: warm smoke rises and leaves / the turn: the warm layer comes down
like a lid (peak: light, low sound, a short shake) / the smoke meets it, flattens, beds down into the streets: thermal inversion /
five days, the lamps go out of sight one by one / at least 4,000 dead (a still beat) / payoff: he is still out in front.
Colour script: street = sulphur yellow and soot with ONE hard warm light (the flare, key from screen left) and dim lamp halos; normal night =
clean cold blue with stars; the lid = an amber rose band over blue grey cold air that slowly turns sulphur; the dead = nearly one colour, ochre grey;
the end = back to the flare's warmth, the brightest street frame.
Shot list (times from the voice):
 1  0.00  3.04 wide, eye level, slow push. Conductor, flare up in his right fist, left arm beckoning; bus (two headlamps, dark red) behind. Title.
 1b 3.04  6.92 medium (cut in on the same axis), slow push. Flare, sparks, beckon; the bus creeps closer.
 2  6.92  9.05 close on his face, flare light flickering on it; he looks back at the bus over his shoulder, then ahead, eyes narrowed.
 3  9.05 15.60 ONE rising move: a coal fire through a window at street level (flare light on the bricks) up the brick front to the pots, pulling back.
 4 15.60 21.15 the air over the roofs, clean night: smoke columns rise, lean and thin away. NORMAL NIGHT.
 5 21.15 26.40 the warm layer slides down and settles on "LID" (25.56): light change, low tone, shake. WARM AIR above, COLD AIR below.
 6 26.40 33.10 smoke climbs, stops under the band, slides sideways, beds down until the roofs dim. THERMAL INVERSION.
 7 33.10 36.82 street, looking along it: people at a bus stop with scarves over their faces; DAY 1 to DAY 5, a lamp lost to the smog each day.
 8 36.82 39.46 the same street nearly swallowed, one lamp. AT LEAST 4,000 DEAD. Still, slow push.
 9 39.46 41.30 close on his face: set, eyes ahead.   9b 41.30 44.00 medium: flare up, beckoning, the headlamps closer. End line.
Sound: city hush bed, flare hiss (shots 1, 2, 9), diesel idle (shots 1, 9), one low tone on LID, one far cough in shot 7."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/smog']
sys.path += ['/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import person as PN, hands as H
import cond, world as Wd, kit, lpk
from kit import Words, Short, Wt, Y, R, TL
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
import layout as L
from world import fog, puff, glow, label, SMOG, SMOG_D

WD = Words('/home/claude/w1111/smog/out/words.json')
DUR, T_END = 44.0, 42.9
T1B = WD.at('has'); T2 = WD.at('driver') - 0.36; T3 = WD.at('so') - 0.07; T4 = WD.at('normally') - 0.08; T5 = WD.at('but') - 0.05
T_LID = WD.at('lid'); T6 = WD.at('smoke', 2) - 0.16; T_INV = WD.at('thermal') - 0.1; T7 = WD.at('for') - 0.06; T8 = WD.at('at') - 0.06
T9 = WD.at('and', 3) - 0.06; T9B = WD.at('guiding') - 0.06
OR, BL = (255, 150, 60), (140, 204, 255)
DAYS = [T7 + 0.1 + i * 0.72 for i in range(5)]


# ------------------------------------------------------------------ the conductor in the street
WALK_V = 0.47                                # metres a second: small careful steps


def conductor(c, t, s, x, yf, h, zb, pose_kw, thick=0.0, bg_blur=0.0, beams=1.0, nfl=60, plate=True, walk=1.0, bus_xw=0.05, t_ref=0.0):
    """He walks toward the camera with small careful steps; the camera backs away at his pace. s = his scale, (x, yf) = where his feet meet the road,
    h = horizon, zb = the bus's distance in metres (it creeps a little faster than he walks, so it grows). The road, kerbs and lamps are fixed to the
    street and slide away at exactly the speed his planted foot is carried back."""
    Pm = 617.5 * s; z0 = Wd.F_CAM / Pm; K = (yf - h) * z0; dist = WALK_V * walk * (t - t_ref) + 3.0
    Wd.street_back2(c, t, h, K, dist, thick)
    bx, by = Wd.proj(h, K, bus_xw, zb); bs = Wd.F_CAM / zb / 175.0
    by += 2.6 * bs / 1.6 * math.sin(2 * math.pi * 1.15 * t) * walk; roll = 0.35 * math.sin(2 * math.pi * 0.62 * t + 1) * walk       # the bus rocks on its springs as it creeps over the setts
    fx_ = x - 330 * s
    if bg_blur: kit.blur_layer(c, bg_blur)
    Wd.street_ground2(c, t, h, K, dist, lights=((bx - 152 * bs, (226, 200, 104), 1.0), (bx + 152 * bs, (226, 200, 104), 1.0), (fx_, (255, 150, 60), 1.3 * Wd.flick(t))), wash=(bx, beams))
    c.save(); c.translate(bx, by); c.rotate(roll); c.translate(-bx, -by)
    Wd.bus(c, bx, by, bs, t, beams=beams, dim=0.42 + 0.2 * thick, plate=plate)
    c.restore()
    if bg_blur: c.restore()
    fog(c, t, SMOG, 0.34 + 0.18 * thick, 3.0 + 0.05 * (t - t_ref), 10, 4.0, seed=3, oy=120)       # the murk drifts and opens as we go
    c.drawOval(skia.Rect(x - 300 * s, yf - 34 * s, x + 420 * s, yf + 60 * s), P((6, 6, 8), 150, MaskFilter=blur(22 * s)))      # his shadow, thrown away from the flare
    v_px = (yf - h) * WALK_V / z0                                # how fast the road under his feet slides up the screen
    step_a = 0.5 * v_px * 0.6 * cond.STEP_T / s
    ps = cond.pose(t, walk=walk, step_a=step_a, **pose_kw); cond.FLAME[0] = None
    cond.draw(c, ps, x, yf, s)
    if cond.FLAME[0] is not None:
        m = skia.Matrix()
        if c.getTotalMatrix().invert(m): Wd.flare_fx(c, t, m.mapXY(*cond.FLAME[0]), s * 1.25)
    else:                                                     # the flare is out of frame to the left: its light still falls across him
        f = Wd.flick(t); glow(c, -60, yf - 1000 * s, 900, (255, 150, 60), 120 * f); glow(c, -40, yf - 1000 * s, 420, (255, 200, 120), 110 * f)
    fog(c, t, SMOG, 0.12 + 0.1 * thick, 4.2, 22, 6.0, seed=4)
    Wd.flecks(c, t, 1.0, n=nfl)


def shot1(c, t):
    """0 to 6.92, ONE shot: wide on him stepping toward us, a slow push in to a medium wide; the bus gains on him the whole time"""
    u = t / T2; z = 1.0 + 0.42 * u ** 1.15
    yaw = 0.55 * smooth((t - 4.5) / 0.5) * (1 - smooth((t - 5.7) / 0.5))                       # a look back at the bus over his shoulder
    c.save(); c.translate(575, 850); c.scale(z, z); c.translate(-575, -850)
    conductor(c, t, 0.8, 620, 1404, 1112, 7.6 - 1.35 * u, dict(yaw=yaw, look=(yaw * 0.9, 0.1)))
    c.restore()


def shot9b(c, t):
    """41.30 to the end: wide again, the bus closer and still creeping, he still stepping ahead of it"""
    u = (t - T9B) / (DUR - T9B); z = 1.0 + 0.05 * u
    c.save(); c.translate(600, 900); c.scale(z, z); c.translate(-600, -900)
    conductor(c, t, 0.86, 690, 1408, 1104, 5.9 - 0.5 * u, dict(yaw=0.0, look=(0.0, 0.05), worry=0.6, lid=0.66), thick=0.3, beams=1.25, bus_xw=0.42, t_ref=T9, plate=False)
    c.restore()


def face(c, t, t0, t1, mode=1):
    """close on his face as he walks: eyes down on the road he cannot see, then up and ahead"""
    u = (t - t0) / (t1 - t0); z = 1.0 + 0.08 * u
    k = smooth((t - (t0 + 0.55)) / 0.35)
    yaw = -0.14 + 0.14 * smooth((t - (t0 + 0.6)) / 0.6); look = (lerp(-0.45, 0.0, k), lerp(0.75, 0.0, k)); bl = abs(t - (t0 + 0.72)); lid = lerp(0.5, 0.7, k) * min(1.0, bl / 0.08) + 0.04; worry = lerp(0.9, 0.5, k)
    c.save(); c.translate(600, 860); c.scale(z, z); c.translate(-600, -860)
    conductor(c, t, 2.05, 610, 2800, 1700, 2.6 - 0.1 * u, dict(yaw=yaw, look=look, lid=max(0.05, lid), worry=worry), thick=0.3, bg_blur=7, nfl=26, bus_xw=-0.07, t_ref=T9)
    c.restore()


# ------------------------------------------------------------------ from the driver's cab
GLOVE = dict(skin=(50, 38, 32), shade=(18, 13, 14), hi=(190, 160, 96))


def back_figure(c, x, y, hgt, t):
    """the conductor seen from the bus, small and far in the murk: his back, cap, long coat, the flare up in his right hand, the other arm waving the bus on.
    A small dark shape on purpose (he is a few metres off in smog)."""
    k = hgt / 100.0; p = (t / cond.STEP_T) % 1.0
    c.save(); c.translate(x + 1.2 * k * math.sin(2 * math.pi * p), y - 1.0 * k * abs(math.sin(2 * math.pi * p))); c.scale(k, k)
    ink = (22, 21, 17); rim = (255, 170, 90)
    c.drawOval(skia.Rect(-20, -3, 22, 5), P((8, 8, 8), 150, MaskFilter=blur(3)))
    lf = 3.0 * max(0.0, math.sin(2 * math.pi * p)); rf = 3.0 * max(0.0, -math.sin(2 * math.pi * p))
    for sx, l_ in ((-1, lf), (1, rf)): c.drawPath(poly([(sx * 2, -34), (sx * 9, -34), (sx * 8, -4 - l_), (sx * 11, -l_), (sx * 2, -l_)]), P(ink))
    coat = smooth_closed([(-13, -80), (13, -80), (15, -56), (17, -24), (0, -22), (-17, -24), (-15, -56)]); c.drawPath(coat, P(ink))
    c.drawLine(0, -74, 0, -26, SP((10, 10, 9), 1.2)); c.drawLine(-10, -52, 10, -52, SP((10, 10, 9), 1.4))                # back seam and half belt
    c.drawCircle(0, -90, 8, P(ink)); c.drawPath(smooth_closed([(-10, -93), (-11, -99), (0, -103), (11, -99), (10, -93), (0, -95)]), P(ink))   # head and cap from behind
    ex, ey = 24, -86; hx_, hy_ = 31, -104                    # right arm up with the flare (screen right from behind)
    c.drawPath(poly([(10, -80), (15, -76), (ex + 2, ey + 4), (ex - 3, ey - 3)]), P(ink)); c.drawPath(poly([(ex - 3, ey + 3), (ex + 3, ey + 2), (hx_ + 2.4, hy_), (hx_ - 2.4, hy_)]), P(ink))
    c.drawLine(hx_, hy_ + 3, hx_ + 1, hy_ - 13, SP((150, 40, 36), 2.6)); fp = c.getTotalMatrix().mapXY(hx_ + 1, hy_ - 14)
    kb = 0.5 - 0.5 * math.cos(2 * math.pi * t / 1.25)       # left arm: the forearm swings forward and back beside his head (the same beckon, from behind)
    lx, ly = -24, -80; wx, wy = lx - 2 + 3 * kb, ly - 18 + 7 * kb
    c.drawPath(poly([(-10, -80), (-15, -76), (lx - 2, ly + 4), (lx + 3, ly - 3)]), P(ink)); c.drawPath(poly([(lx - 3, ly + 2), (lx + 3, ly + 2), (wx + 2.4, wy), (wx - 2.4, wy)]), P(ink)); c.drawCircle(wx, wy - 2, 3.2, P((120, 86, 64)))
    for pth, d_ in ((coat, (-1.4, 0.8)),): c.drawPath(Wd.diffp(pth, d_), P(rim, 200))            # the flare's light along his right side
    c.restore()
    return fp


def cab(c, t):
    """6.92 to 9.05, from the driver's seat: the wheel and his gloved hands dark in front of us, the windscreen full of glowing murk, and out in it the
    conductor's small shape with the flare. The wiper hangs still. The engine shakes the cab; the driver makes small corrections on the wheel."""
    u = (t - T2) / (T3 - T2); z = 1.0 + 0.05 * u
    jx, jy = 1.2 * math.sin(t * 75), 1.0 * math.sin(t * 61 + 1)
    c.save(); c.translate(540 + jx, 800 + jy); c.scale(z, z); c.translate(-540, -800)
    ws = skia.Path(); ws.addRRect(skia.RRect.MakeRectXY(skia.Rect(64, 410, 1016, 1110), 46, 46))
    c.drawRect(skia.Rect(-200, -200, 1280, 2200), P((12, 11, 10)))
    c.save(); c.clipPath(ws, skia.ClipOp.kIntersect, True)
    # outside: murk lit from below by our own headlamps, the road gone a few metres ahead
    c.drawRect(skia.Rect(0, 380, 1080, 1200), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 410), skia.Point(0, 1170)], [C((56, 51, 28)), C((128, 116, 58)), C((176, 160, 84)), C((84, 76, 44))], [0, 0.45, 0.8, 1.0])))
    fog(c, t, SMOG, 0.5, 2.4 + 0.12 * (t - T2), 8, 10, seed=1)
    h_, K_ = 915.0, 330.0 * 1.6; dist = 0.47 * (t - T2) + 1.0
    c.save(); c.clipRect(skia.Rect(0, h_ + 40, 1080, 1200))
    for k in range(0, 24):                                   # the setts come toward us out of the murk
        zz = 1.9 + k * 0.5 - (dist % 0.5); y = h_ + K_ / zz
        if zz < 1.7 or y > 1220: continue
        c.drawLine(0, y, 1080, y, SP((40, 36, 22), max(1.0, 7 / zz), 150 * min(1.0, (5.2 - zz) / 2.5) if zz < 5.2 else 0))
    for sd in (-1, 1): c.drawLine(540 + sd * 150, h_ + K_ / 4.6, 540 + sd * 620, 1200, SP((150, 136, 80), 6, 120))
    c.restore()
    for sd in (-1, 1): glow(c, 540 + sd * 250, 1230, 520, (236, 214, 120), 120); c.drawPath(poly([(540 + sd * 250 - 90, 1200), (540 + sd * 250 + 90, 1200), (540 + sd * 120 + 150, 840), (540 + sd * 120 - 150, 840)]), P((236, 214, 130), 26, MaskFilter=blur(30)))
    Wd.lamp(c, 150 - 26 * (t - T2), 1010 + 6 * (t - T2), 0.5 + 0.02 * (t - T2), t, ph=1.0, post=(60, 54, 34), on=0.7)                 # a street lamp drifting past on the kerb
    fog(c, t, SMOG, 0.34, 3.2, -6, 6, seed=2, oy=200)
    fp = back_figure(c, 548, 1000, 210, t)
    m = skia.Matrix(); c.getTotalMatrix().invert(m); fpl = m.mapXY(*fp); Wd.flare_fx(c, t, fpl, 0.42)
    fog(c, t, SMOG, 0.3, 3.6 + 0.2 * (t - T2), 14, 12, seed=3, oy=80)
    Wd.flecks(c, t, 0.8, n=40)
    c.drawLine(64, 1110, 760, 410, SP((255, 250, 220), 70, 14)); c.drawLine(300, 1110, 1016, 520, SP((255, 250, 220), 30, 10))                  # the sheen on the glass
    for (gx, gy, gr) in ((180, 520, 60), (880, 1040, 80), (700, 470, 40)): c.drawOval(skia.Rect(gx - gr, gy - gr * 0.5, gx + gr, gy + gr * 0.5), P((30, 28, 20), 40, MaskFilter=blur(14)))   # soot film
    c.restore()
    c.drawPath(ws, SP((6, 6, 6), 22)); c.drawPath(ws, SP((120, 108, 64), 3, 150))
    c.drawLine(74, 642, 1006, 642, SP((8, 8, 8), 12)); c.drawLine(74, 636, 1006, 636, SP((120, 108, 64), 2, 110))                               # the opening top pane's bar
    c.drawCircle(540, 420, 16, P((8, 8, 8))); c.drawLine(540, 420, 742, 598, SP((8, 8, 8), 9)); c.drawLine(650, 628, 838, 566, SP((8, 8, 8), 12)); c.drawLine(650, 624, 838, 562, SP((90, 82, 52), 2, 130))   # the wiper, still
    # the dash and the dim instruments
    dash = smooth_closed([(-60, 1136), (300, 1106), (780, 1106), (1140, 1136), (1140, 2100), (-60, 2100)]); c.drawPath(dash, P((16, 15, 13))); c.drawPath(Wd.diffp(dash, (0, 4)), P((112, 100, 58), 160))
    gx, gy = 930, 1262; c.drawCircle(gx, gy, 74, P((8, 8, 8))); c.drawCircle(gx, gy, 62, P((34, 32, 24))); c.drawCircle(gx, gy, 62, SP((120, 108, 64), 3))
    for a_ in range(150, 400, 25): c.drawLine(gx + 46 * math.cos(math.radians(a_)), gy + 46 * math.sin(math.radians(a_)), gx + 56 * math.cos(math.radians(a_)), gy + 56 * math.sin(math.radians(a_)), SP((214, 200, 150), 3, 200))
    na = math.radians(158 + 3 * math.sin(t * 2.1)); c.drawLine(gx, gy, gx + 48 * math.cos(na), gy + 48 * math.sin(na), SP((230, 90, 60), 4)); c.drawCircle(gx, gy, 7, P((200, 190, 150))); glow(c, gx, gy, 110, (220, 200, 120), 40)
    # the wheel, turned a little this way and that, and the hands that turn it
    wcx, wcy, rx, ry = 480.0, 1420.0, 400.0, 262.0; d = math.radians(3.2 * math.sin(2 * math.pi * 0.45 * (t - T2)) + 1.4 * math.sin(2 * math.pi * 1.1 * t))
    rim = skia.Path(); rim.addOval(skia.Rect(wcx - rx, wcy - ry, wcx + rx, wcy + ry))
    c.drawOval(skia.Rect(wcx - rx - 6, wcy - ry + 14, wcx + rx + 6, wcy + ry + 26), SP((0, 0, 0), 44, 120, MaskFilter=blur(10)))
    for k_ in range(3):
        a_ = d + math.radians(-90 + k_ * 120); px, py = wcx + rx * math.cos(a_), wcy + ry * math.sin(a_); c.drawLine(wcx, wcy + 40, px, py, SP((20, 19, 17), 30)); c.drawLine(wcx - 4, wcy + 34, px - 4, py - 4, SP((96, 86, 54), 3, 120))
    c.drawPath(rim, SP((40, 36, 30), 44)); c.drawOval(skia.Rect(wcx - rx, wcy - ry - 10, wcx + rx, wcy + ry - 10), SP((196, 176, 104), 7, 210)); c.drawOval(skia.Rect(wcx - rx, wcy - ry + 12, wcx + rx, wcy + ry + 12), SP((6, 6, 6), 6, 200))
    c.drawCircle(wcx, wcy + 40, 64, P((18, 17, 15))); c.drawCircle(wcx, wcy + 40, 64, SP((110, 98, 60), 3, 140))
    for sd, a0 in ((-1, -130.0), (1, -50.0)):
        a_ = d + math.radians(a0); px, py = wcx + rx * math.cos(a_), wcy + ry * math.sin(a_)
        tx, ty = -rx * math.sin(a_), ry * math.cos(a_); n_ = math.hypot(tx, ty); tx, ty = tx / n_, ty / n_          # the rim's direction here
        fa = math.atan2(ty, tx) - sd * math.pi / 2             # fingers go across the rim, up and away from us
        if math.sin(fa) > 0: fa += math.pi
        sc = 2.3; wr = (px - math.cos(fa) * 47 * sc, py - math.sin(fa) * 47 * sc)
        el = (wr[0] + sd * 190 - 30, wr[1] + 640)             # the forearm comes up from his lap
        sl = PN.limb(el, (wr[0] - math.cos(fa) * 40, wr[1] - math.sin(fa) * 40), 250, 150)
        c.drawPath(sl, P((0, 0, 0), 120, MaskFilter=blur(12))); c.drawPath(sl, P((26, 28, 40))); c.drawPath(Wd.diffp(sl, (-sd * 5, 4)), P((110, 100, 66), 170))
        cf = PN.limb((wr[0] - math.cos(fa) * 150, wr[1] - math.sin(fa) * 150), (wr[0] + math.cos(fa) * 6, wr[1] + math.sin(fa) * 6), 190, 128)                      # the gauntlet cuff of the glove
        c.drawPath(cf, P(GLOVE['skin'])); c.drawPath(Wd.diffp(cf, (-sd * 4, 4)), P(GLOVE['hi'], 170)); c.drawPath(cf, SP(GLOVE['shade'], 4))
        H.hand(c, wr, fa, -sd, sc, light=(0.25 * sd, 0.8), curls=(0.62, 0.8, 0.82, 0.82, 0.8), spread=0.06, **GLOVE)
    c.restore()


# ------------------------------------------------------------------ the city and the air above it
def city_cam(t):
    if t < T4:
        keys_z = [(T3, 2.6), (T3 + 2.0, 2.5), (T3 + 4.2, 1.9), (T4 - 0.15, 1.15)]
        keys_x = [(T3, 336), (T3 + 2.0, 336), (T3 + 4.2, 440), (T4 - 0.15, 540)]
        keys_y = [(T3, 1772), (T3 + 2.0, 1660), (T3 + 4.2, 1380), (T4 - 0.15, 1300 - 400 / 1.15)]
        if t < T4 - 0.15: return (PN.track(keys_z, t), PN.track(keys_x, t), PN.track(keys_y, t))
    u = max(0.0, (t - (T4 - 0.15)) / (T7 - T4)); z = 1.15 + 0.06 * u
    sh = math.exp(-(t - T_LID) / 0.25) * 5 * math.sin((t - T_LID) * 30) if t >= T_LID else 0.0             # the lid lands
    return (z, 540, 1300 - 400 / z + sh)                # the chimney pots keep their place low in the frame while the sky part grows


def band_y(t):
    """the underside of the warm layer: it sinks in from above and settles on the word LID"""
    t0 = T5 + 0.5
    if t < t0: return -400.0
    u = min(1.0, (t - t0) / (T_LID - t0)); return lerp(-200.0, 830.0, 1 - (1 - u) ** 2.4)


def city(c, t):
    cam = city_cam(t)
    murk = 1 - smooth((t - (T4 - 0.1)) / 0.9)                 # this week's smog, wiped away for the normal night
    yb = band_y(t); on = smooth((t - T5 - 0.5) / 1.2); settled = smooth((t - (T_LID - 0.25)) / 0.3)
    fill = smooth((t - (T6 + 0.9)) / (T7 - T6 - 1.3)); depth = 330 * fill
    pulse = math.exp(-(t - T_LID) / 0.5) if t >= T_LID else smooth((t - (T_LID - 0.14)) / 0.14)       # the light comes up over four frames, then dies away
    clear = 1 - smooth((yb - 480) / 350)
    L_ = lambda p: (c.save(), Wd.cam_layer(c, cam, p))
    # sky
    L_(0.1)
    c.drawRect(skia.Rect(-600, -900, 1680, 2600), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 300), skia.Point(0, 1250)],
               [C(mix((8, 14, 34), (20, 18, 14), 0.5 * fill)), C(mix((20, 36, 70), (40, 36, 24), 0.5 * fill)), C(mix((52, 80, 116), (96, 86, 50), 0.7 * fill))], [0, 0.55, 1.0])))
    for (sx, sy, sr, ph) in Wd.STARS:
        a_ = (0.55 + 0.45 * math.sin(t * 2.2 + ph)) * (1 - murk) * (1 - 0.9 * fill) * (1.0 if sy < yb - 250 or sy > yb else 0.25)
        if a_ > 0.02: c.drawCircle(sx, sy, sr, P((226, 234, 255), 230 * a_))
    c.restore()
    # the cold air under the band
    L_(1.0)
    if on > 0: c.drawRect(skia.Rect(-400, yb, 1480, 1500), P((110, 150, 196), 74 * settled * (1 - 0.6 * fill)))
    c.restore()
    L_(0.3); c.translate(0, -50); Wd.skyline(c, mix((24, 34, 60), (60, 56, 40), 0.6 * max(murk, fill))); c.restore()
    L_(0.3); c.drawRect(skia.Rect(-400, 1000, 1480, 1400), P(mix((40, 62, 96), SMOG_D, max(murk, fill)), 60)); c.restore()
    for (p, ye, rise, ss, xo, pitch, k) in ((0.5, 1272, 68, 0.4, 110, 180, 0.55), (0.72, 1345, 77, 0.62, 20, 262.5, 0.3)):
        L_(p)
        Wd.roof_row(c, ye, rise, mix(Wd.SLATE, (52, 76, 110), k), mix(Wd.SLATE_D, (40, 60, 90), k), xo, pitch, ss, t)
        c.drawRect(skia.Rect(-400, ye - rise - 120 * ss, 1480, ye + 20), P(mix((40, 62, 96), SMOG_D, max(murk, fill)), 150 * k))
        Wd.smoke(c, t, yb, depth, clear, only=ss)
        c.restore()
    L_(1.0)
    Wd.roof_row(c, 1420, 80, Wd.SLATE, Wd.SLATE_D, 135, 270, 1.0, t)
    flare = 1 - smooth((t - T3 - 1.6) / 2.2)
    Wd.facade(c, t, flare)
    if t < T4 + 0.5:
        Wd.lamp(c, 196, 1972, 0.98, t, ph=0.4)
        fog(c, t, SMOG, 0.3 * murk, 1.6, 6, 0.6, seed=5, rect=skia.Rect(-400, 1380, 1480, 2500))
        Wd.flare_glow_low(c, t, flare)
    Wd.smoke(c, t, yb, depth, clear, only=1.0)
    # the warm layer
    if on > 0:
        top = yb - 250
        sh = skia.GradientShader.MakeLinear([skia.Point(0, top - 40), skia.Point(0, yb + 6)],
             [C((255, 170, 110), 0), C(mix((240, 150, 96), (255, 214, 150), 0.6 * pulse), 150 + 60 * pulse), C(mix((232, 112, 92), (255, 190, 130), 0.6 * pulse), 190 + 50 * pulse), C((255, 150, 110), 0)], [0, 0.2, 0.93, 1.0])
        c.drawRect(skia.Rect(-400, top - 40, 1480, yb + 6), skia.Paint(Shader=sh))
        fog(c, t, (255, 206, 150), 0.16, 3.2, 26, 0, seed=6, rect=skia.Rect(-400, top, 1480, yb - 6))
        c.drawRect(skia.Rect(-400, yb - 7, 1480, yb), P((255, 222, 170), 150 + 100 * pulse)); c.drawRect(skia.Rect(-400, yb - 30, 1480, yb + 16), P((255, 190, 120), 60 + 150 * pulse, MaskFilter=blur(14)))
        if pulse > 0.01: c.drawRect(skia.Rect(-400, yb, 1480, 2000), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, yb), skia.Point(0, yb + 700)], [C((255, 190, 120), 130 * pulse), C((255, 190, 120), 0)])))
    # the smoke that cannot leave beds down under the band
    if fill > 0:
        r = skia.Rect(-400, yb, 1480, yb + depth + 120)
        c.saveLayer(r, None)
        fog(c, t, SMOG, 0.9 * smooth(fill * 2.2), 2.2, 16, 0, seed=7, rect=r); fog(c, t, mix(SMOG, (120, 110, 90), 0.5), 0.6 * smooth(fill * 2.2), 1.3, -12, 0, seed=8, rect=r)
        c.drawRect(r, skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, yb + depth - 40), skia.Point(0, yb + depth + 120)], [C((0, 0, 0), 255), C((0, 0, 0), 0)]), BlendMode=skia.BlendMode.kDstIn))
        c.restore()
        dim = smooth((fill - 0.62) / 0.38)
        if dim > 0:
            fog(c, t, SMOG, 0.5 * dim, 2.8, 12, 2, seed=2, rect=skia.Rect(-400, yb + depth, 1480, 2400)); c.drawRect(skia.Rect(-400, yb, 1480, 2400), P(SMOG_D, 60 * dim))
    c.restore()
    # this week's murk during the rise (before the normal night)
    if murk > 0:
        L_(0.6); fog(c, t, SMOG, 0.8 * murk, 2.4, 9, -3, seed=1, rect=skia.Rect(-600, -900, 1680, 1330))
        c.drawRect(skia.Rect(-600, -900, 1680, 1500), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 500), skia.Point(0, 1500)], [C(SMOG_D, 200 * murk), C(SMOG_D, 0)]))); c.restore()
        fog(c, t, SMOG, 0.16 * murk, 4.0, 20, 2, seed=4)
        Wd.flecks(c, t, murk)
    # labels (screen space; the camera barely moves here)
    a = smooth((t - T4 - 0.25) / 0.3) * (1 - smooth((t - (T5 - 0.1)) / 0.2))
    if a > 0:
        L.chip(c, 'NORMAL NIGHT', 290, 506, BL, size=56, a=a, scale=0.94 + 0.06 * a)
        a2 = smooth((t - WD.at('warmer') - 0.0) / 0.3) * (1 - smooth((t - (T5 - 0.1)) / 0.2))
        if a2 > 0:
            label(c, 'COLDER', 868, 640, 56, BL, 255 * a2); label(c, 'HIGHER UP', 868, 704, 56, BL, 255 * a2)
            yy = 990 - 16 * math.sin(t * 2.2) ; c.drawLine(868, yy, 868, 770, SP(BL, 10, 230 * a2)); c.drawPath(poly([(838, 786), (868, 736), (898, 786)]), P(BL, 255 * a2))
            label(c, 'WARM SMOKE', 232, 1196, 54, (255, 206, 150), 255 * a2)
    if on > 0.5:
        aw = smooth((t - WD.at('warm') + 0.0) / 0.3) * (1 if yb > 520 else 0)
        zz = cam[0]; sy = lambda y: 960 + (y - cam[2]) * zz
        if aw > 0 and yb > 640: label(c, 'WARM AIR', 540, sy(yb - 100), 66, (255, 244, 220), 255 * aw)
        ac = smooth((t - T_LID - 0.25) / 0.3)
        if ac > 0: label(c, 'COLD AIR', 540, sy(1000), 58, (190, 224, 255), 255 * ac)
    ar = smooth((t - (WD.at('meets') + 0.5)) / 0.4) * (1 - smooth((t - (T_INV + 0.6)) / 0.5))
    if ar > 0:                                               # it cannot go up, so it goes sideways
        zz = cam[0]; sy = 960 + (yb + 64 - cam[2]) * zz
        for x0 in (405, 675):
            sx0 = 540 + (x0 + 40 - 540) * zz
            for sd in (-1, 1):
                k = (t * 0.7 + (0 if sd > 0 else 0.5)) % 1.0; xa = sx0 + sd * (34 + 16 * k); xb = xa + sd * 58
                c.drawLine(xa, sy, xb, sy, SP((255, 255, 255), 7, 235 * ar)); c.drawPath(poly([(xb + sd * 20, sy), (xb - sd * 4, sy - 15), (xb - sd * 4, sy + 15)]), P((255, 255, 255), 235 * ar))
            ya = sy + 196 - 14 * ((t * 0.7) % 1.0); c.drawLine(sx0, ya + 70, sx0, ya, SP((255, 255, 255), 7, 235 * ar)); c.drawPath(poly([(sx0, ya - 20), (sx0 - 15, ya + 4), (sx0 + 15, ya + 4)]), P((255, 255, 255), 235 * ar))
    if -0.14 < t - T_LID < 0.4: c.drawRect(skia.Rect(0, 0, 1080, 1920), P((255, 214, 160), 44 * (smooth((t - T_LID + 0.14) / 0.14) if t < T_LID else 1 - (t - T_LID) / 0.4)))


# ------------------------------------------------------------------ five days
from people_small import waiting_man_tall, waiting_woman, waiting_man_cap


def across(c, t, day, u):
    """shots 7 and 8: the terrace across the street, people waiting at a bus stop with cloths over their mouths; each day the smog takes more of it"""
    th = min(1.2, day / 5.0); z = 1.5 + 0.1 * u; cam = (z, 560, 1700 - 16 * u)
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 900)], [C((20, 19, 14)), C((70, 63, 34))])))
    c.save(); Wd.cam_layer(c, cam, 1.0)
    fog(c, t, SMOG, 0.6, 2.0, 7, 0, seed=1, rect=skia.Rect(-400, 400, 1480, 1440))
    Wd.roof_row(c, 1420, 80, Wd.SLATE, Wd.SLATE_D, 135, 270, 1.0, t)
    Wd.facade(c, t, 0.0)
    Wd.smoke(c, t, -9999, 0, 0.5, only=1.0, col=(150, 142, 110))
    fog(c, t, SMOG, 0.16 + 0.5 * min(1, th), 2.2, 9, 1, seed=5); c.drawRect(skia.Rect(-400, 400, 1480, 2500), P(mix(SMOG_D, SMOG, 0.25), 150 * min(1, th)))
    Wd.lamp(c, 842, 1972, 0.98, t, ph=0.4, on=1 - 0.5 * min(1, th), halo=1.0 + 0.4 * th, post=(26, 24, 18))
    # the bus stop and the three who wait
    bx_ = 470; c.drawRect(skia.Rect(bx_ - 5, 1700, bx_ + 5, 1972), P((24, 22, 18))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_ - 34, 1690, bx_ + 34, 1740), 6, 6), P((132, 36, 32)))
    c.drawRect(skia.Rect(bx_ - 26, 1708, bx_ + 26, 1720), P((226, 216, 186))); c.drawOval(skia.Rect(bx_ - 30, 1966, bx_ + 30, 1978), P((10, 10, 10), 150))
    waiting_man_tall(c, bx_ + 78, 1966, t); waiting_woman(c, bx_ + 152, 1969, t); waiting_man_cap(c, bx_ + 232, 1967, t)
    fog(c, t, SMOG, 0.08 + 0.42 * min(1, th), 3.0, -11, 1.5, seed=7, oy=200); c.drawRect(skia.Rect(-400, 400, 1480, 2500), P(mix(SMOG_D, SMOG, 0.4), 110 * max(0.0, th - 0.4) / 0.6))
    c.restore()
    Wd.lamp(c, 150, 2060, 3.0, t, ph=2.0, on=1 - 0.25 * min(1, th), halo=0.8 + 0.5 * th, post=(14, 13, 10))        # the lamp on our side of the street
    fog(c, t, SMOG, 0.1 + 0.12 * th, 4.4, 18, 2, seed=4)
    Wd.flecks(c, t, 1.0)


def days(c, t):
    day = 0.4
    for i, d0 in enumerate(DAYS):
        if t >= d0: day = i + 0.4 + 0.6 * smooth((t - d0) / 0.45)
    across(c, t, day, (t - T7) / (T9 - T7))
    n = sum(1 for d0 in DAYS if t >= d0)
    if n:
        d0 = DAYS[n - 1]; L.chip(c, f'DAY {n}', 560, 548, (255, 210, 63), size=66, a=1.0, scale=0.9 + 0.1 * smooth((t - d0) / 0.14))


def dead(c, t):
    across(c, t, 5.0 + 0.9 * smooth((t - T8) / 1.6), (t - T7) / (T9 - T7))
    a = smooth((t - WD.at('thousand') - 0.2) / 0.4)
    if a > 0: label(c, 'counted at the time: about 4,000', 550, 536, 46, (240, 232, 204), 250 * a); label(c, 'later estimates: up to 12,000', 550, 598, 46, (240, 232, 204), 250 * a)


def scene(c, t):
    if t < T2: shot1(c, t)
    elif t < T3: cab(c, t)
    elif t < T7: city(c, t)
    elif t < T8: days(c, t)
    elif t < T9: dead(c, t)
    elif t < T9B: face(c, t, T9, T9B)
    else: shot9b(c, t)


def _end_line(c, t, t0, text='levlprep.com', y=1500):
    """the end line, placed left of him and above y 1500 (the kit's default sits at 1560, over his coat)"""
    a = smooth((t - t0) / 0.4)
    if a <= 0: return
    f = skia.Font(L.BLACK, 54); w = f.measureText(text); x0 = 60; yy = 1392
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 30, yy - 56, x0 + w + 30, yy + 22), 24, 24), P((5, 12, 26), 215 * a)); c.drawString(text, x0, yy, f, P(L.TEAL, 255 * a))


lpk.end_line = _end_line

TITLES = [
    (0.0, [[('THE ', Wt), ('GREAT SMOG', Y)], [('OF LONDON', Wt)]]),
    (T1B, [[('DECEMBER 1952', Y)], [('HE GUIDES HIS BUS ON FOOT', Wt)]]),
    (T2, [[('THE DRIVER', Wt)], [("CAN'T SEE ", R), ('THE ROAD', Wt)]]),
    (T3, [[('WHERE IS IT ALL', Wt)], [('COMING FROM?', Y)]]),
    (WD.at("city's") - 0.28, [[("THE CITY'S OWN", Wt)], [('COAL FIRES', OR)]]),
    (WD.at('on', 2) - 0.05, [[('A ', Wt), ('COLD', BL), (', STILL WEEK', Wt)]]),
    (T4, [[('WARM SMOKE', OR)], [('RISES', Wt)]]),
    (WD.at('and') - 0.05, [[('AND DRIFTS ', Wt), ('AWAY', TL)]]),
    (T5, [[('BUT THIS WEEK', Wt)]]),
    (WD.at('layer') - 0.05, [[('A LAYER OF', Wt)], [('WARM AIR', OR), (' ON TOP', Wt)]]),
    (WD.at('like') - 0.05, [[('LIKE A ', Wt), ('LID', Y)]]),
    (T6, [[('THE SMOKE CLIMBS', Wt)]]),
    (WD.at('meets') - 0.05, [[('MEETS ', Wt), ('WARMER AIR', OR)]]),
    (WD.at('and', 2) - 0.05, [[('AND ', Wt), ('STOPS', R)]]),
    (T_INV, [[('THERMAL', Y)], [('INVERSION', Y)]]),
    (T7, [[('FIVE DAYS', Y)], [('OF ITS OWN SMOKE', Wt)]]),
    (T8, [[('AT LEAST', Wt)], [('4,000 DEAD', R)]]),
    (T9, [[("HE'S STILL", Wt)], [('OUT IN FRONT', Y)]]),
    (T9B, [[('GUIDING THE BUS', Wt)], [('HOME', Y)]]),
]

SHORT = Short(WD, 'AP ENVIRONMENTAL SCIENCE', TITLES, scene, DUR, T_END, lift=lambda t: 1.0, fix={'LID': 'lid'})

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1111/smog/out/stills')
