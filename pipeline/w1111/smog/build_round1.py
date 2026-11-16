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
import person as PN
import cond, world as Wd, kit
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
def conductor(c, t, s, x, ground, horizon, bus_xy, bus_s, pose_kw, thick=0.0, bg_blur=0.0, beams=1.0, nfl=60, plate=True):
    Wd.street_back(c, t, horizon, thick)
    fx_ = x - 330 * s
    if bg_blur: kit.blur_layer(c, bg_blur)
    Wd.street_ground(c, t, horizon, lights=((bus_xy[0] - 152 * bus_s, (226, 200, 104), 1.0), (bus_xy[0] + 152 * bus_s, (226, 200, 104), 1.0), (fx_, (255, 150, 60), 1.3 * Wd.flick(t))))
    Wd.bus(c, bus_xy[0], bus_xy[1], bus_s, t, beams=beams, dim=0.42 + 0.2 * thick, plate=plate)
    if bg_blur: c.restore()
    fog(c, t, SMOG, 0.34 + 0.18 * thick, 3.0, 10, -1.0, seed=3, oy=120)
    c.drawOval(skia.Rect(x - 300 * s, ground - 34 * s, x + 420 * s, ground + 60 * s), P((6, 6, 8), 150, MaskFilter=blur(22 * s)))      # his shadow, thrown away from the flare
    ps = cond.pose(t, **pose_kw); cond.FLAME[0] = None
    cond.draw(c, ps, x, ground, s)
    if cond.FLAME[0] is not None:
        inv = c.getTotalMatrix()
        ok, m = True, skia.Matrix()
        if inv.invert(m): pt = m.mapXY(*cond.FLAME[0]); Wd.flare_fx(c, t, pt, s * 1.25)
    else:                                                     # the flare is out of frame to the left: its light still falls across him
        f = Wd.flick(t); glow(c, -60, ground - 1000 * s, 900, (255, 150, 60), 120 * f); glow(c, -40, ground - 1000 * s, 420, (255, 200, 120), 110 * f)
    fog(c, t, SMOG, 0.12 + 0.1 * thick, 4.2, 22, 2.0, seed=4)
    Wd.flecks(c, t, 1.0, n=nfl)


def shot1(c, t):
    u = t / T1B; z = 1.0 + 0.06 * u
    c.save(); c.translate(560, 1000); c.scale(z, z); c.translate(-560, -1000)
    conductor(c, t, 0.8, 620, 1446, 1150, (566, 1336), 1.6 + 0.05 * u, dict(yaw=0.0, look=(0.0, 0.1)))
    c.restore()


def shot1b(c, t, t0=None, t1=None, close=0.0, thick=0.0, kw=None):
    t0 = T1B if t0 is None else t0; t1 = T2 if t1 is None else t1
    u = (t - t0) / (t1 - t0); z = 1.0 + 0.07 * u
    yaw = 0.55 * smooth((t - (t0 + 1.5)) / 0.5) * (1 - smooth((t - (t0 + 2.7)) / 0.5)) if kw is None else 0.0          # a look back at the bus over his shoulder
    c.save(); c.translate(600, 1000); c.scale(z, z); c.translate(-600, -1000)
    conductor(c, t, 1.22, 656, 1990, 1330, (624, 1650), 2.35 + 0.16 * u + close, kw or dict(yaw=yaw, look=(yaw * 0.9, 0.1)), thick=thick, beams=1.0 + 0.3 * close, plate=False)
    c.restore()


def face(c, t, t0, t1, mode):
    u = (t - t0) / (t1 - t0); z = 1.0 + 0.08 * u
    if mode == 0:                                             # he looks back toward the bus, then ahead again: eyes first, then the head
        yaw = 0.62 * (1 - smooth((t - (t0 + 0.75)) / 0.55)); look = (0.9 * (1 - smooth((t - (t0 + 0.55)) / 0.3)), 0.1)
        bl = min(abs(t - (t0 + 0.95)), abs(t - (t0 + 1.9))); lid = 0.56 * min(1.0, bl / 0.08) + 0.04; worry = 1.0
    else:                                                     # set, tired, looking ahead
        k = smooth((t - (t0 + 0.55)) / 0.35)                  # eyes down on the road he cannot see, then up and ahead
        yaw = -0.14 + 0.14 * smooth((t - (t0 + 0.6)) / 0.6); look = (lerp(-0.45, 0.0, k), lerp(0.75, 0.0, k)); bl = abs(t - (t0 + 0.72)); lid = lerp(0.5, 0.7, k) * min(1.0, bl / 0.08) + 0.04; worry = lerp(0.9, 0.5, k)
    c.save(); c.translate(600, 860); c.scale(z, z); c.translate(-600, -860)
    conductor(c, t, 2.05, 610, 2800, 1700, (520, 2560), 4.4 + 0.2 * u, dict(yaw=yaw, look=look, lid=max(0.05, lid), worry=worry), thick=0.3 if mode else 0.0, bg_blur=7, nfl=26)
    c.restore()


# ------------------------------------------------------------------ the city and the air above it
def city_cam(t):
    if t < T4:
        keys_z = [(T3, 2.6), (T3 + 2.0, 2.5), (T3 + 4.2, 1.8), (T4 - 0.15, 1.0)]
        keys_x = [(T3, 336), (T3 + 2.0, 336), (T3 + 4.2, 440), (T4 - 0.15, 540)]
        keys_y = [(T3, 1772), (T3 + 2.0, 1660), (T3 + 4.2, 1370), (T4 - 0.15, 960)]
        return (PN.track(keys_z, t), PN.track(keys_x, t), PN.track(keys_y, t))
    u = (t - T4) / (T7 - T4); z = 1.0 + 0.05 * u
    sh = math.exp(-(t - T_LID) / 0.25) * 5 * math.sin((t - T_LID) * 30) if t >= T_LID else 0.0             # the lid lands
    return (z, 540, 960 + 44 * (1 - 1 / z) * 0 + sh)


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
        L.chip(c, 'NORMAL NIGHT', 226, 500, BL, size=40, a=a, scale=0.94 + 0.06 * a)
        a2 = smooth((t - WD.at('warmer') - 0.0) / 0.3) * (1 - smooth((t - (T5 - 0.1)) / 0.2))
        if a2 > 0:
            label(c, 'COLDER', 900, 596, 40, BL, 255 * a2); label(c, 'HIGHER UP', 900, 642, 40, BL, 255 * a2)
            yy = 880 - 14 * math.sin(t * 2.2) ; c.drawLine(902, yy, 902, 690, SP(BL, 7, 230 * a2)); c.drawPath(poly([(880, 704), (902, 668), (924, 704)]), P(BL, 255 * a2))
            label(c, 'WARM SMOKE', 276, 1126, 38, (255, 206, 150), 255 * a2)
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
def small_person(c, x, y, h, kind, t, ph=0.0):
    """a small far figure for the wide street shot (simple on purpose): coat, hat, two legs, one hand holding a scarf or handkerchief over the mouth"""
    c.save(); c.translate(x, y); c.scale(h / 100, h / 100); c.translate(0.6 * math.sin(t * 0.8 + ph), 0)
    ink = (20, 19, 15); rim = (150, 132, 72)
    c.drawOval(skia.Rect(-20, -3, 20, 5), P((8, 8, 8), 150, MaskFilter=blur(3)))
    for sx in (-1, 1): c.drawPath(poly([(sx * 2, -42), (sx * 10, -42), (sx * 9, -4), (sx * 12, 0), (sx * 2, 0)]), P(ink))
    coat = smooth_closed([(-13, -80), (13, -80), (15, -56), (16, -30) if kind != 1 else (20, -26), (0, -27), (-16, -30) if kind != 1 else (-20, -26), (-15, -56)])
    c.drawPath(coat, P(ink)); c.drawPath(diffp_(coat, (-1.6, 0.6)), P(rim, 150))
    hb = 1.2 * math.sin(t * 1.3 + ph)
    c.drawCircle(0, -90 + hb * 0.3, 8.5, P(ink))
    if kind == 0: c.drawRect(skia.Rect(-12, -97, 12, -94), P(ink)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-8, -105, 8, -95), 3, 3), P(ink))            # a trilby
    elif kind == 1: c.drawPath(smooth_closed([(-10, -86), (-10, -98), (0, -102), (10, -98), (10, -86), (6, -80), (-6, -80)]), P(ink))                              # a headscarf
    else: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-10, -101, 10, -94), 3, 3), P(ink)); c.drawRect(skia.Rect(-10, -95, 13, -93), P(ink))                      # a flat cap
    c.drawPath(poly([(11, -76), (15, -74), (16, -62), (5, -80 + hb * 0.3), (2, -84 + hb * 0.3), (9, -68)]), P(ink))                                                # the arm bent up to the face
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-6, -90 + hb * 0.3, 7, -81 + hb * 0.3), 3, 3), P((176, 166, 130)))                                                # the cloth over the mouth
    c.restore()


def diffp_(a, d):
    from art import diffp
    return diffp(a, d)


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
    for j, (ox, kind, hh) in enumerate(((70, 0, 168), (138, 1, 150), (204, 2, 162))): small_person(c, bx_ + ox, 1968, hh, kind, t, ph=j * 2.0)
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
    if a > 0: label(c, 'counted at the time: about 4,000', 560, 540, 38, (240, 232, 204), 245 * a); label(c, 'later estimates: up to 12,000', 560, 592, 38, (240, 232, 204), 245 * a)


def scene(c, t):
    if t < T1B: shot1(c, t)
    elif t < T2: shot1b(c, t)
    elif t < T3: face(c, t, T2, T3, 0)
    elif t < T7: city(c, t)
    elif t < T8: days(c, t)
    elif t < T9: dead(c, t)
    elif t < T9B: face(c, t, T9, T9B, 1)
    else: shot1b(c, t, T9B, DUR, close=0.45, thick=0.35, kw=dict(yaw=0.0, look=(0.0, 0.05), worry=0.6, lid=0.66))


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
