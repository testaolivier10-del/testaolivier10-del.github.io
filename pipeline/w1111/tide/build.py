"""w1111-01-tide-car (AP Precalculus): the tide is coming in and his car is parked on the sand. 1080x1920, 30 fps, all code (skia).
ONE IDEA: tide height against time is close to a sine curve, so the water creeps near low tide and races halfway up.

LOGLINE  A weekend angler judges the tide by its first slow hour; the curve shows the middle hours bring half the rise, and the sea reaches his car.
BEATS    hook 0.0 (tide coming in, car on the sand, does he have time?) / his reasoning 4.0 (a few steps in an hour, plenty of time) / the doubt 9.7 /
         the curve 10.8 to 27.8 (not steady, a sine curve, flat near low, steepest halfway, first hour about 1/12) / the turn 27.9 to 31.2 (hours 3 and 4
         bring half: the sea runs to the car) / his face 32.5 / closing picture 34.8 (the car standing in water), last line echoes the first.
COLOUR   late afternoon: teal sea, warm sand, yellow jacket, red car. The story clock sinks the sun: gold at 4 pm look, rose and violet at last light.
         Key light: the low sun over the sea (top of frame). Brightest moment: the time lapse, sun on the horizon, glitter path down to the car.
SHOTS    (times from the voice take, out/words.json; third version, 2026-11-11, after two independent reviews)
 1  0.00  3.92  HOOK, low on the sand by his car (nose to the right, front wheel large in the foreground), the man beyond it at the water's edge, the sky
                above (poll band clear). A run of swash is already sliding toward the car; it stops short of the tyre, pulls back and leaves a wet
                shine and a foam line. Slow push in. His head turns from the stick to the car. Title TIDE COMING IN / DOES HE HAVE TIME?
 2  3.92  7.00  HIGH VIEW, full figure. He looks at the stick he planted at the water's edge an hour ago, shows the gap with his hand, looks to the car.
 3  7.00  9.66  CLOSE on his face, the sea behind him out of focus: a glance toward the car, a smile, a small shrug.
 4  9.66 10.76  CLOSE on the stick standing in the thin water, push in; he stands easy, one hand resting on his rod. DOES HE?
 5 10.76 16.84  WIDE HIGH VIEW. He has turned back to the sea (back view). The tide pole is the height axis: a steady line is tried and crossed out
                (gone before the curve draws), the real curve draws from LOW to HIGH. He settles his hat. The real edge creeps up the sand with the dot.
 6 16.84 21.66  CUT IN behind him: he turns his head to his marker flag, looks back out, rests his hand on the rod; the foam edge creeps to his boots.
                The flat start of the curve is lit in a panel above.
 7 21.66 27.95  WIDE again: the steep middle lights, hour columns, hour one sliver ABOUT 1/12, hour two filling as the edge passes his boots.
 8 27.95 32.46  SAME VIEW, TIME LAPSE of hours 3 and 4 at one constant clock rate: the two columns fill half the height (1/2), the sun drops, shadows
                swing, the stick and pole go under, he stands fishing in his boots as the sea runs past him to the car's wheels.
 9 32.46 34.76  CLOSE on his face in the last light: he turns from the sea, sees it, eyes widen.
10 34.76 39.40  THE FIRST VIEW AGAIN, later: the sea is past the car and up to its door sills (foam on the paint, rings, swells, a moving reflection);
                he has turned and stands in the water beyond it, facing us and the car, hands to his head, the worry held. Push in. End line.
FACTS    h(tau) = (1 - cos(pi tau / 6)) / 2 drives the waterline of the high view (screen y = Y0 + D h), the level on the pole and the dot, from one
         story clock TAU(t). The clock has three steady rates (see TAU); inside the time lapse it is constant, so the speed up seen there is the sine
         curve alone. The hook's sliding sheet is a run of swash, not the tide level. The last shot is a later moment (flooded), not driven by the clock."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/tide']
import numpy as np, skia
import world as WL, man as M, car as CAR
import tperson as PN, hands as H, kit
import layout as L
import lpk as _lpk
_el = _lpk.end_line
_lpk.end_line = lambda c, t, t0, text='levlprep.com', y=1500: _el(c, t, t0, text, y=1482)      # the end line sits above y 1500
from kit import Words, Short, Wt, Y, R, TL, OR
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed, lgrad
from art import glow
from world import h_of, yw, HOR, Y0, D, POLE_X, GX0, GPH, GY0, GH, CAR_AT, MAN_AT, STICK_X

OUT = '/home/claude/w1111/tide/out'
WD = Words(f'{OUT}/words.json')
DUR, T_END = 39.4, 37.9
T2, T3, T4, T5, T6, T7, T8 = 3.92, 7.0, 9.66, 10.76, 27.95, 32.46, 34.76
LAPSE1 = 31.1
track = PN.track


def TAU(t):
    """the story clock, hours after low water. Three steady rates: a creep while he looks (hour 1.0), a slow run while the curve is explained
    (to hour 2.0, so the real edge is seen moving with the dot), then the time lapse of hours 3 and 4 at one constant rate. The last shot is later (4.75)."""
    if t < T5: return 1.0 + 0.006 * t
    a = 1.0 + 0.006 * T5
    if t < T6: return lerp(a, 2.0, (t - T5) / (T6 - T5))
    if t < LAPSE1: return lerp(2.0, 4.0, (t - T6) / (LAPSE1 - T6))
    if t < T8: return 4.0 + 0.045 * (t - LAPSE1)
    return 4.75 + 0.045 * (t - T8)


def cam(c, cx, cy, z, ax=540, ay=960):
    c.translate(ax, ay); c.scale(z, z); c.translate(-cx, -cy)


def label(c, txt, x, y, size, col, a=255, align=0.5, shadow=True):
    f = skia.Font(L.BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias); w = f.measureText(txt)
    if shadow: c.drawString(txt, x - w * align, y + 3, f, P((4, 10, 30), a * 0.75, MaskFilter=blur(5)))
    c.drawString(txt, x - w * align, y, f, P(col, a))


# ------------------------------------------------------------------ the man's acting
def man_wide(t):
    yaw = track([(0, -0.72), (0.9, -0.72), (1.5, -0.3), (2.2, -0.34), (3.92, -0.34)], t)
    lk = (track([(0, -0.9), (0.75, -0.9), (1.2, -0.6), (3.92, -0.6)], t), track([(0, -0.3), (0.75, -0.3), (1.2, 0.6), (3.92, 0.6)], t))
    return M.pose(head_yaw=yaw, look=lk, smile=0.25, sway=-8, breath=0.5 + 0.5 * math.sin(t * 2), head_tilt=track([(0, -3), (1.0, -3), (1.6, 2), (3.92, 2)], t), l_up=8, r_up=8)


def man_full(t):
    """shot 2: looks at the stick, shows the small gap with his hand, then looks over to the car"""
    yaw = track([(3.9, -0.34), (4.2, -0.72), (5.9, -0.72), (6.45, -0.3), (7.1, -0.3)], t)
    lk = (track([(3.9, -0.6), (4.1, -0.95), (5.85, -0.95), (6.2, -0.6), (7.1, -0.6)], t), track([(3.9, 0.6), (4.1, -0.25), (5.85, -0.25), (6.2, 0.65), (7.1, 0.65)], t))
    up = track([(3.9, 8), (4.35, 8), (4.9, 46), (5.75, 44), (6.4, 9), (7.1, 8)], t)
    fore = track([(3.9, 6), (4.4, 10), (4.9, 34), (5.75, 30), (6.45, 4), (6.8, 8), (7.1, 6)], t)
    openk = smooth((t - 4.5) / 0.3) * (1 - smooth((t - 5.8) / 0.3))
    return M.pose(head_yaw=yaw, look=lk, smile=track([(3.9, 0.25), (5.9, 0.3), (6.6, 0.5), (7.1, 0.5)], t), sway=track([(3.9, -8), (4.9, -13), (5.8, -12), (6.6, 6), (7.1, 6)], t),
                  breath=0.5 + 0.5 * math.sin(t * 2), head_tilt=track([(3.9, 2), (4.3, -3), (5.9, -3), (6.5, 3), (7.1, 3)], t), r_up=up, r_fore=fore,
                  r_wrist=track([(3.9, -10), (4.6, -22), (5.0, -4), (5.8, -4), (6.3, 14), (6.7, -10), (7.1, -10)], t), r_hand=H.blend(PN.RELAX, H.OPEN, openk),
                  sh_r=track([(3.9, 0), (4.5, 0), (4.9, 7), (5.8, 6), (6.4, 0), (7.1, 0)], t), l_up=8 + math.sin(t * 1.3), brow=track([(3.9, 0), (4.6, 0.5), (5.8, 0.4), (6.6, 0.1), (7.1, 0.1)], t),
                  lid=max(0.05, min(1.0, abs(t - 6.05) / 0.08)))


def man_calm(t):
    """shot 3, close: he figures he has plenty of time. A glance toward the car, a smile, a small shrug"""
    yaw = track([(7.0, -0.05), (7.5, -0.05), (7.85, -0.3), (8.3, -0.28), (8.75, 0.02), (9.7, 0.04)], t)
    lk = (track([(7.0, -0.1), (7.4, -0.1), (7.62, -0.85), (8.25, -0.85), (8.5, 0.0), (9.7, 0.0)], t), track([(7.0, 0.1), (7.4, 0.1), (7.62, 0.7), (8.25, 0.7), (8.5, 0.05), (9.7, 0.05)], t))
    shr = track([(7.0, 0), (8.5, 0), (8.85, 1.0), (9.2, 0.9), (9.6, 0.0), (9.7, 0.0)], t)
    bl = min(abs(t - 7.3), abs(t - 8.42)); 
    return M.pose(head_yaw=yaw, look=lk, smile=track([(7.0, 0.3), (8.2, 0.35), (8.8, 0.9), (9.7, 0.8)], t), brow=track([(7.0, 0.1), (8.4, 0.1), (8.85, 0.9), (9.7, 0.5)], t),
                  head_tilt=track([(7.0, 1), (7.9, -2), (8.5, -1), (8.9, 5), (9.7, 4)], t), sh_r=11 * shr, lean=-1.2 * shr, breath=0.5 + 0.5 * math.sin(t * 2.2),
                  lid=max(0.05, min(1.0, bl / 0.08)), sway=track([(7.0, 4), (8.6, 4), (9.0, -6), (9.7, -6)], t)), shr


def man_shock(t):
    """shot 7, close: he turns from the sea, his eyes find the car, and widen"""
    k = track([(32.4, 0), (33.18, 0), (33.42, 1.0), (34.8, 1.0)], t)
    yaw = track([(32.4, 0.7), (32.62, 0.7), (33.05, -0.3), (33.3, -0.24), (34.8, -0.2)], t)
    lk = (track([(32.4, 0.9), (32.56, 0.9), (32.82, -0.75), (34.8, -0.8)], t), track([(32.4, -0.1), (32.56, -0.1), (32.82, 0.6), (34.8, 0.65)], t))
    return M.pose(head_yaw=yaw, look=lk, smile=0.2 * (1 - k), worry=k, lid=1.0 + 0.32 * k, scream=0.36 * k, brow=0.5 * k, head_tilt=track([(32.4, -3), (33.0, 2), (33.4, -1), (34.8, -1)], t),
                  head_x=-4 * k, lean=track([(32.4, 0), (33.2, 0), (33.45, 2.2), (34.8, 1.8)], t), breath=0.5 + 0.5 * math.sin(t * (2.2 + 3 * k)), sh_r=5 * k, r_up=8 + 5 * k, l_up=8 + 5 * k)


GRIPH = dict(curls=(0.4, 0.45, 0.5, 0.55, 0.6), spread=0.3)


def hold_k(t):
    """how far his left hand has settled on the rod (0 hanging, 1 gripping it): on from 19.4, off again after 23.4"""
    return smooth((t - 19.4) / 0.75) * (1 - smooth((t - 23.4) / 0.8))


def man_fish(t):
    """seen from behind, watching the sea. In the wide he settles his hat; in the cut in he turns his head to look at his marker flag,
    looks back out, and rests his left hand on the rod (the hand closes on it and stays on it)."""
    k = track([(12.9, 0), (13.5, 1), (14.5, 1), (15.2, 0)], t) if 12.9 < t < 15.2 else 0.0
    hk = hold_k(t)
    flag = track([(16.6, 0), (17.15, 0), (17.6, 1), (18.55, 1), (19.1, 0), (40, 0)], t)          # the look to the flag (screen left)
    yaw = lerp(0.55 * math.sin(t * 0.37 + 1), -0.85, flag)
    return M.pose(sway=9 * math.sin(t * 0.45 + 0.4) * (1 - hk) * (1 - 0.6 * flag) - 5 * flag, head_yaw=yaw, head_tilt=2.5 * math.sin(t * 0.6) + 3 * k - 3 * flag, lean=1.0 * math.sin(t * 0.3) * (1 - hk),
                  r_up=8 + 2 * math.sin(t * 0.8) + 132 * k, r_fore=6 + 90 * smooth(k * 1.3), r_wrist=-10 + 20 * k, r_hand=H.blend(PN.RELAX, GRIPH, k), sh_r=8 * k,
                  l_up=lerp(8 + 2 * math.sin(t * 0.7 + 1), 29.5, hk), l_fore=lerp(8, 1, hk) + 16 * math.sin(math.pi * hk) * (1 if t < 21 else 0.4), l_wrist=lerp(-10, 0, hk),
                  l_hand=H.blend(PN.RELAX, H.GRIP, smooth((hk - 0.55) / 0.4)), breath=0.5 + 0.5 * math.sin(t * 2))


def man_lapse(tau):
    """in the time lapse he stays where he stands, fishing in his boots; like anyone in a time lapse he is caught in a new attitude every few frames"""
    r = np.random.default_rng(100 + int(tau * 8))
    return M.pose(sway=r.uniform(-12, 12), head_yaw=r.uniform(-0.7, 0.7), head_tilt=r.uniform(-4, 4), lean=r.uniform(-2, 2), r_up=r.uniform(6, 22), l_up=r.uniform(6, 22),
                  r_fore=r.uniform(2, 16), l_fore=r.uniform(2, 16), breath=r.uniform(0, 1))


def man_end(t):
    """the last shot: he has turned and faces his car. His hands fly to his head and stay there; the worry holds, with small life (eyes, breath, a sway, a blink)"""
    up = track([(34.6, 12), (34.82, 7), (35.15, 108), (35.42, 144), (35.62, 140), (40, 140)], t)
    fore = track([(34.6, 8), (34.85, 24), (35.2, 102), (35.45, 97), (40, 96)], t)
    on = smooth((up - 100) / 30.0)
    hand = H.blend(H.blend(PN.RELAX, H.OPEN, smooth((t - 34.8) / 0.2)), GRIPH, on)
    lk = (track([(34.6, -0.8), (36.3, -0.8), (36.5, 0.2), (37.0, 0.2), (37.2, -0.8), (40, -0.8)], t), track([(34.6, 0.45), (36.3, 0.45), (36.5, 0.75), (37.0, 0.75), (37.2, 0.45), (40, 0.45)], t))
    bl = min(abs(t - 36.4), abs(t - 38.3))
    return M.pose(r_up=up, l_up=up * 0.97 + 1, r_fore=fore, l_fore=fore * 0.96 + 1, r_wrist=lerp(-10, 10, on), l_wrist=lerp(-10, 10, on), r_hand=hand, l_hand=hand,
                  head_yaw=-0.35 + 0.08 * math.sin(t * 1.1), look=lk, worry=1.0, lid=1.28 * max(0.05, min(1.0, bl / 0.08)), scream=0.3 + 0.08 * math.sin(t * 2.3), brow=0.45,
                  lean=track([(34.6, 0), (35.5, 2.4), (37.0, 1.2), (38.2, 2.6), (40, 2.0)], t), sh_r=track([(34.6, 0), (35.3, 8), (40, 7)], t), head_tilt=-3 + 2.5 * math.sin(t * 1.4),
                  head_x=2.5 * math.sin(t * 2.0), sway=6 * math.sin(t * 0.9), breath=0.5 + 0.5 * math.sin(t * 3.8))


# ------------------------------------------------------------------ shots in the wide world
HZ = 905.0                                                   # horizon of the low view: the whole poll band above it is sky
LV_MAN, LV_S, LV_CAR, LV_CS, LV_EDGE = (832.0, 1275.0), 0.335, (200.0, 1425.0), 1.5, 1238.0
RUN = [(-0.5, 0.0), (0.0, 56.0), (0.82, 152.0), (1.15, 148.0), (2.55, 16.0), (3.1, 50.0), (3.6, 14.0), (4.0, 6.0)]


def lv_shape(x):
    return 0.5 + 0.5 * math.exp(-((x - 700) / 300.0) ** 2)


def lowview(c, t, flood=False, ps=None):
    """the beach from standing height on the landward side: sky, a band of sea, the sand, his car large in the foreground with its nose to the right,
    him beyond it at the water's edge. Used for the hook (a run of swash slides toward the car and stops short of the tyre) and, flooded, for the last shot."""
    L_ = 1.0 if flood else 0.0; pl = WL.pal(L_)
    lgrad(c, skia.Rect(-100, -100, 1180, HZ + 2), 0, HZ, [pl['sky0'], pl['sky1'], pl['sky2']], [0, 0.62, 1.0])
    sx_, sy_ = (270, 470) if not flood else (300, HZ + 16)
    glow(c, sx_, sy_, 520, mix((255, 214, 150), (255, 140, 80), L_), 170); glow(c, sx_, sy_, 170, (255, 240, 200), 200)
    c.save(); c.clipRect(skia.Rect(-100, -100, 1180, HZ)); c.drawCircle(sx_, sy_, 46, P(pl['sun'])); c.restore()
    for (u, y, w, k) in WL.CLOUDS:
        x = ((u * 1700 + t * 5 * k) % 1700) - 300; yy = 150 + (y - 120) * 1.15
        c.drawOval(skia.Rect(x - w * 1.3, yy - w * 0.18, x + w * 1.3, yy + w * 0.18), P(mix((255, 236, 214), (255, 160, 150), L_), 150 * k, MaskFilter=blur(18)))
        c.drawOval(skia.Rect(x - w, yy + w * 0.06, x + w * 1.1, yy + w * 0.2), P(mix((150, 170, 200), (110, 70, 130), L_), 110 * k, MaskFilter=blur(14)))
    for i in range(2): WL.gull(c, 620 + 240 * i + 80 * math.sin(t * 0.4 + i * 2), 440 + 50 * i + 16 * math.sin(t * 0.6 + i), 0.8 + 0.3 * i, math.sin(t * 6 + i), col=mix((255, 255, 255), (255, 226, 214), L_))
    hd = smooth_closed([(640, HZ + 1), (740, HZ - 26), (880, HZ - 38), (1040, HZ - 20), (1200, HZ - 30), (1200, HZ + 1)]); c.drawPath(hd, P(mix(pl['sky2'], (90, 110, 140), 0.45)))
    bx_ = 420 + 3 * t; sl = skia.Path(); sl.addPoly([skia.Point(bx_, HZ - 2), skia.Point(bx_, HZ - 44), skia.Point(bx_ + 22, HZ - 5)], True); c.drawPath(sl, P((255, 250, 240), 235)); c.drawLine(bx_ - 12, HZ - 1, bx_ + 24, HZ - 1, SP((60, 60, 90), 4))
    # the sea
    ye = 1562.0 if flood else LV_EDGE
    run = 0.0 if flood else PN.track(RUN, t); reach = 0.0 if flood else max(PN.track(RUN, min(t, 0.82 + 0.02 * k_)) for k_ in range(1)) if t < 0.82 else (0.0 if flood else 152.0)
    xs = list(range(-100, 1181, 20))
    base = [(x, ye + 5 * math.sin(0.9 * t + 0.004 * x) + 3 * math.sin(1.7 * t + 0.011 * x + 1) + 4 * math.sin(0.02 * x + 2)) for x in xs]
    lgrad(c, skia.Rect(-100, HZ, 1180, 2000), HZ, ye, [pl['sea_far'], pl['sea_mid'], mix(pl['sea_mid'], pl['sea_near'], 0.6), pl['sea_near']], [0, 0.2, 0.75, 1.0])
    c.drawRect(skia.Rect(-100, HZ - 5, 1180, HZ + 26), P(mix(pl['sky2'], (255, 255, 255), 0.3), 150, MaskFilter=blur(10)))
    c.save(); c.clipRect(skia.Rect(-100, HZ, 1180, ye + 10))
    c.drawOval(skia.Rect(sx_ - 150, HZ - 10, sx_ + 150, ye + 60), P(pl['glit'], 50 + 40 * L_, MaskFilter=blur(50)))
    for k in range(5 if not flood else 7):                    # swells coming in toward us: a lit front, a dark back
        v = ((k / (5.0 if not flood else 7.0) + t * 0.085) % 1.0); yy = HZ + 14 + (ye - HZ - 30) * v ** 1.6; dp = (yy - HZ) / (ye - HZ); al = min(1.0, v * 6) * min(1.0, (1 - v) * 5)
        wv = skia.Path(); wv2 = skia.Path()
        for i, x in enumerate(range(-100, 1181, 30)):
            y_ = yy + (3 + 9 * dp) * math.sin(x * 0.006 + k * 1.9 + t * 0.7) + (1 + 4 * dp) * math.sin(x * 0.021 + k + t * 1.3)
            (wv.lineTo if i else wv.moveTo)(x, y_); (wv2.lineTo if i else wv2.moveTo)(x, y_ - 5 - 9 * dp)
        c.drawPath(wv2, SP(mix(pl['sea_mid'], (10, 30, 70), 0.5), 4 + 8 * dp, 90 * al, MaskFilter=blur(2.5))); c.drawPath(wv, SP(mix(pl['sea_far'], (255, 255, 255), 0.5), 2 + 3 * dp, 150 * al))
    wp = skia.Path()
    for (u, yf_, k, ph) in WL.WAVES:
        yy = HZ + 8 + (ye - HZ - 20) * ((yf_ + 0.03 * t * k) % 1.0) ** 1.7; dp = (yy - HZ) / (ye - HZ); ln = (22 + 190 * dp) * k; x = ((u * 1500 + 9 * t * k) % 1500) - 210
        wp.moveTo(x - ln / 2, yy); wp.quadTo(x, yy - 2 - 6 * dp, x + ln / 2, yy)
    c.drawPath(wp, SP(mix(pl['sea_far'], (255, 255, 255), 0.4), 2.6, 90))
    for (dx, yf_, ph, k) in WL.GLIT:
        if math.sin(t * 5.2 * k + ph) < 0.15: continue
        yy = HZ + 5 + (ye - HZ - 20) * yf_ ** 1.5; dp = (yy - HZ) / (ye - HZ); xx = sx_ + dx * (30 + 230 * dp); w_ = (6 + 30 * dp) * k
        c.drawOval(skia.Rect(xx - w_, yy - 1.6 - 3 * dp, xx + w_, yy + 1.6 + 3 * dp), skia.Paint(AntiAlias=True, Color=C(pl['glit'], 215), BlendMode=skia.BlendMode.kPlus))
    c.restore()
    # the sand in front of the edge
    sd = skia.Path(); sd.moveTo(-100, 2000)
    for p_ in base: sd.lineTo(*p_)
    sd.lineTo(1180, 2000); sd.close()
    c.drawPath(sd, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, ye), skia.Point(0, 1920)], [C(pl['wet']), C(mix(pl['wet'], pl['dry2'], 0.6)), C(pl['dry']), C(mix(pl['dry'], pl['dry2'], 0.5))], [0, 0.12, 0.45, 1.0])))
    c.save(); c.clipPath(sd, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-100, ye, 1180, ye + 46), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, ye), skia.Point(0, ye + 46)], [C(pl['sky2'], 110), C(pl['sky2'], 0)])))
    rp = skia.Path()
    for (x, y, ln, k) in WL.RIPS:
        v = (y - 1000) / 900.0; yy = ye + 26 + (1900 - ye) * v ** 1.3; sc_ = 0.8 + 1.6 * v
        rp.moveTo(x - ln * sc_ / 2, yy); rp.quadTo(x, yy - (4 + 3 * k) * sc_, x + ln * sc_ / 2, yy + 2 * k)
    c.drawPath(rp, SP(mix(pl['dry2'], pl['wet'], 0.6), 3, 110)); rp.offset(0, 3.5); c.drawPath(rp, SP(mix(pl['dry'], (255, 255, 255), 0.35), 1.8, 100))
    for (x, y, r, kind) in WL.PEBS:
        v = (y - 1010) / 890.0; yy = ye + 20 + (1900 - ye) * v ** 1.3; r_ = r * (0.9 + 1.4 * v)
        c.drawOval(skia.Rect(x - r_ * 1.2, yy - r_ * 0.6, x + r_ * 1.2, yy + r_ * 0.6), P(mix(pl['wet'], (60, 50, 70), 0.4) if kind != 1 else mix((255, 240, 226), pl['dry'], 0.3)))
    c.restore()
    if not flood:
        # the run of swash: a thin sheet sliding down the sand toward the car, its foam front, and the wet shine it leaves when it pulls back
        front = [(x, y + run * lv_shape(x) * (1 + 0.05 * math.sin(0.03 * x + t * 1.3))) for (x, y) in base]
        far = [(x, y + reach * lv_shape(x)) for (x, y) in base]
        sh_ = skia.Path(); sh_.moveTo(*base[0])
        for p_ in base[1:]: sh_.lineTo(*p_)
        for p_ in far[::-1]: sh_.lineTo(*p_)
        sh_.close(); fade = 1 - 0.45 * smooth((t - 2.6) / 1.4)
        c.drawPath(sh_, P(mix(pl['wet'], (90, 70, 80), 0.25), 215 * fade))
        c.save(); c.clipPath(sh_, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(-100, ye, 1180, ye + 230), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, ye), skia.Point(0, ye + 200)], [C(pl['sky2'], 105 * fade), C(pl['sky1'], 50 * fade)])))
        c.restore()
        fr = skia.Path()
        for i, p_ in enumerate(far): (fr.lineTo if i else fr.moveTo)(p_[0], p_[1] - 2)
        if reach - run > 6: c.drawPath(fr, skia.Paint(AntiAlias=True, Color=C(pl['foam'], 150 * fade), Style=skia.Paint.kStroke_Style, StrokeWidth=3, StrokeCap=skia.Paint.kRound_Cap, PathEffect=skia.DashPathEffect.Make([14, 9, 4, 12], 0)))   # the foam line it leaves
        st_ = skia.Path(); st_.moveTo(*base[0])
        for p_ in base[1:]: st_.lineTo(*p_)
        for p_ in front[::-1]: st_.lineTo(*p_)
        st_.close()
        c.drawPath(st_, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, ye), skia.Point(0, ye + 180)], [C(pl['sea_near'], 235), C(mix(pl['sea_near'], (255, 255, 255), 0.25), 150)])))
        c.save(); c.clipPath(st_, skia.ClipOp.kIntersect, True)
        for j in range(4):
            lf = skia.Path()
            for i, (x, y) in enumerate(front): (lf.lineTo if i else lf.moveTo)(x, y - (18 + 26 * j) * (run / 152.0) - 5 * math.sin(0.02 * x + j * 2 + t * 2))
            c.drawPath(lf, SP(pl['foam'], 2.6, 120 - 22 * j))
        c.restore()
        ff = skia.Path()
        for i, p_ in enumerate(front): (ff.lineTo if i else ff.moveTo)(*p_)
        c.drawPath(ff, SP(pl['foam'], 12, 100, MaskFilter=blur(4))); c.drawPath(ff, SP(pl['foam'], 6, 245))
        for i in range(0, len(front) - 1, 2):
            x, y = front[i]; c.drawCircle(x + 8 * math.sin(t * 1.4 + i), y - 7, 4 + 2 * math.sin(i * 1.7 + t * 2.4), P(pl['foam'], 170))
    else:
        ff = skia.Path()
        for i, p_ in enumerate(base): (ff.lineTo if i else ff.moveTo)(*p_)
        c.drawPath(ff, SP(pl['foam'], 12, 100, MaskFilter=blur(4))); c.drawPath(ff, SP(pl['foam'], 6, 245))
    # his marker flag, the rod in its rest, the bucket, and him
    mx, my = LV_MAN; ms = LV_S
    wob = 2.5 * math.sin(t * 2.1)
    ysm = my - 112 + wob if flood else None                    # flooded: the water stands above his boot tops
    fx_, fy_ = mx - 190, LV_EDGE - 16
    c.save()
    if flood: c.clipRect(skia.Rect(-100, -100, 1180, fy_ - 78 + wob))
    c.drawLine(fx_, fy_, fx_ + 8, fy_ - 98, SP((112, 78, 60), 10)); c.drawLine(fx_ - 2, fy_ - 3, fx_ + 6, fy_ - 94, SP((176, 132, 96), 3))
    fl = 8 * math.sin(t * 5); rag = smooth_closed([(fx_ + 8, fy_ - 98), (fx_ + 50, fy_ - 92 + fl), (fx_ + 76, fy_ - 74 - fl * 0.6), (fx_ + 46, fy_ - 68 + fl * 0.5), (fx_ + 10, fy_ - 70)])
    c.drawPath(rag, P((236, 70, 66))); c.drawPath(smooth_closed([(fx_ + 10, fy_ - 80), (fx_ + 48, fy_ - 78 + fl * 0.6), (fx_ + 46, fy_ - 68 + fl * 0.5), (fx_ + 10, fy_ - 70)]), P((170, 40, 60)))
    c.restore()
    ysf = fy_ - 78 + wob if flood else fy_
    for k in (0, 1):
        u = ((t * 0.8 + k * 0.5) % 1.0); c.drawOval(skia.Rect(fx_ - 14 - 20 * u, ysf - 4 - 5 * u, fx_ + 18 + 20 * u, ysf + 4 + 5 * u), SP(pl['foam'], 2.6, 220 * (1 - u)))
    rx_, ry_ = mx + 78, my + 10                               # rod rest and rod
    c.save()
    if flood: c.clipRect(skia.Rect(-100, -100, 1180, ysm + 8))
    c.drawLine(rx_, ry_, rx_ + 3, ry_ - 60, SP((120, 126, 140), 8)); c.drawLine(rx_ - 12, ry_ - 60, rx_ + 16, ry_ - 60, SP((120, 126, 140), 6))
    tip = (rx_ + 42, ry_ - 352 + 3 * math.sin(t * 1.6))
    rod = skia.Path(); rod.moveTo(rx_ - 5, ry_ - 14); rod.quadTo(rx_ + 14, ry_ - 196, *tip); c.drawPath(rod, SP((40, 36, 50), 5.5)); c.drawCircle(rx_ + 2, ry_ - 78, 11, P((60, 60, 76))); c.drawCircle(rx_ + 2, ry_ - 78, 5, P((210, 214, 226)))
    c.restore()
    flx, fly = rx_ + 88, (LV_EDGE - 40 if not flood else ysm - 30) + 2.5 * math.sin(t * 2.2)
    ln_ = skia.Path(); ln_.moveTo(*tip); ln_.quadTo(tip[0] + 44, (tip[1] + fly) / 2 + 30, flx, fly); c.drawPath(ln_, SP((255, 255, 255), 1.8, 170))
    c.drawOval(skia.Rect(flx - 14, fly - 3, flx + 14, fly + 6), SP(pl['foam'], 2.2, 170)); c.drawCircle(flx, fly - 3, 6.5, P((240, 60, 60))); c.drawCircle(flx, fly - 8, 4, P((255, 255, 255)))
    if flood: 
        for k in (0, 1):
            u = ((t * 0.7 + k * 0.5) % 1.0); c.drawOval(skia.Rect(rx_ - 10 - 18 * u, ysm + 6 - 3 - 4 * u, rx_ + 12 + 18 * u, ysm + 6 + 3 + 4 * u), SP(pl['foam'], 2.4, 210 * (1 - u)))
    if not flood:
        kx, ky = mx + 34, my + 34                              # the bucket
        c.drawOval(skia.Rect(kx - 36, ky - 6, kx + 40, ky + 14), P(pl['shadow'], 110, MaskFilter=blur(5)))
        bk = skia.Path(); bk.addPoly([skia.Point(kx - 26, ky - 52), skia.Point(kx + 26, ky - 52), skia.Point(kx + 21, ky + 4), skia.Point(kx - 21, ky + 4)], True)
        c.drawPath(bk, P((70, 130, 200))); c.drawRect(skia.Rect(kx + 5, ky - 52, kx + 26, ky + 4), P((40, 84, 150), 150)); c.drawOval(skia.Rect(kx - 26, ky - 59, kx + 26, ky - 45), P((30, 60, 110))); c.drawOval(skia.Rect(kx - 26, ky - 59, kx + 26, ky - 45), SP((150, 196, 240), 3))
        c.drawArc(skia.Rect(kx - 26, ky - 88, kx + 26, ky - 28), 180, 180, False, SP((220, 224, 234), 3))
    tint = (lambda v: mix(v, (150, 80, 120), 0.16)) if flood else None
    ex = dict(arms_front=True) if flood else None
    if not flood:
        c.saveLayer(None, skia.Paint(ColorFilter=skia.ColorFilters.Blend(C(pl['shadow']), skia.BlendMode.kSrcIn), Alphaf=0.4, ImageFilter=skia.ImageFilters.Blur(3, 3)))
        c.translate(mx, my); c.concat(skia.Matrix.MakeAll(1, -0.34, 0, 0, -0.42, 0, 0, 0, 1)); M.draw(c, ps, 0, 0, ms); c.restore()          # the low sun behind him throws his shadow toward us
        M.draw(c, ps, mx, my, ms)
        wet = smooth((run * lv_shape(mx) - (my - LV_EDGE)) / 14.0)
        for bx2 in (mx - 22, mx + 22):
            for k in (0, 1):
                u = ((t * 0.8 + k * 0.5 + bx2 * 0.01) % 1.0); c.drawOval(skia.Rect(bx2 - 22 - 16 * u, my - 4 - 4 * u, bx2 + 24 + 16 * u, my + 6 + 5 * u), SP(pl['foam'], 2.4, 210 * (1 - u) * wet))
    else:
        dm = lambda cc: M.draw(cc, ps, mx, my, ms, tint=tint, extra=ex)
        reflect(c, dm, mx - 150, mx + 150, ysm, 330, t, alpha=0.4, amp=5.0)
        c.save(); c.clipRect(skia.Rect(-100, -100, 1180, ysm)); dm(c); c.restore()
        for lx_ in (mx - 22, mx + 22):
            c.drawOval(skia.Rect(lx_ - 20, ysm - 4, lx_ + 20, ysm + 5), SP(pl['foam'], 3, 235))
            for k in range(2):
                v = ((t * 0.6 + k / 2.0 + lx_ * 0.01) % 1.0); c.drawOval(skia.Rect(lx_ - 22 - 36 * v, ysm - 5 - 8 * v, lx_ + 22 + 36 * v, ysm + 6 + 10 * v), SP(pl['foam'], 2.4, 200 * (1 - v)))
    # the car in the foreground, nose to the right as everywhere in the film
    cx, cy = LV_CAR; cs = LV_CS
    kw = dict(dusk=L_, sky=pl['glass'])
    if not flood:
        c.drawOval(skia.Rect(cx - 300 * cs, cy - 20, cx + 330 * cs, cy + 74), P(pl['shadow'], 120, MaskFilter=blur(16)))                         # its shadow falls toward us
        CAR.car(c, cx, cy, cs, **kw)
    else:
        ysc = cy - 78 + wob
        reflect(c, lambda cc: CAR.car(cc, cx, cy, cs, **kw), cx - 300 * cs, cx + 300 * cs, ysc, 300, t, alpha=0.5)
        c.drawRect(skia.Rect(cx - 290 * cs, ysc - 2, cx + 290 * cs, ysc + 30), P((16, 22, 60), 120, MaskFilter=blur(10)))
        c.save(); c.clipRect(skia.Rect(-100, -100, 1180, ysc)); CAR.car(c, cx, cy, cs, **kw); c.restore()
        x0c, x1c = cx - 283 * cs, cx + 284 * cs
        wl = skia.Path()
        for i in range(0, 51):
            x = lerp(x0c - 6, x1c + 6, i / 50.0); y_ = ysc + 2.6 * math.sin(i * 0.9 + t * 4.2) + 1.4 * math.sin(i * 2.3 - t * 3.1)
            (wl.lineTo if i else wl.moveTo)(x, y_)
        c.drawPath(wl, SP((255, 240, 228), 11, 110, MaskFilter=blur(3))); c.drawPath(wl, SP((255, 244, 234), 5.5, 245))
        for i in range(16):
            x = lerp(x0c, x1c, (i + 0.5) / 16.0) + 10 * math.sin(t * 1.7 + i * 2.1); c.drawCircle(x, ysc + 7 + 2 * math.sin(t * 2.6 + i), 5 + 3 * math.sin(t * 3 + i * 1.3), P((255, 240, 228), 170))
        for k in range(3):
            v = ((t * 0.5 + k / 3.0) % 1.0)
            c.drawArc(skia.Rect(x0c - 30 - 80 * v, ysc - 18 - 34 * v, x1c + 30 + 80 * v, ysc + 24 + 52 * v), 8, 164, False, SP((255, 226, 206), 4 - 2 * v, 215 * (1 - v) ** 1.3))
    c.drawRect(skia.Rect(-100, -100, 1180, 2000), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 300), skia.Point(0, 1900)], [C((255, 150, 90), 34 * L_), C((90, 50, 120), 50 * L_)])))


def wide(c, t):
    """the hook: low on the sand by his car. A run of swash is already sliding toward the car; it stops short of the tyre and pulls back"""
    u = t / T2
    c.save(); cam(c, lerp(610, 640, u), 905, lerp(1.0, 1.045, u), lerp(610, 640, u) - 20 * u, 905); lowview(c, t, False, man_wide(t)); c.restore()


def full(c, t):
    u = (t - T2) / (T3 - T2); tau = TAU(t)
    c.save(); cam(c, lerp(848, 856, u), 1040, lerp(1.96, 2.08, u), 540, 1224)
    WL.flat(c, t, tau, man_full(t))
    a = smooth((t - 4.25) / 0.25)                             # where the edge was an hour ago
    if a > 0:
        dp = skia.Path(); dp.moveTo(STICK_X - 200, Y0 + 2); dp.lineTo(STICK_X - 14, Y0 + 2)
        c.drawPath(dp, skia.Paint(AntiAlias=True, Color=C((255, 255, 255), 200 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=2.6, PathEffect=skia.DashPathEffect.Make([9, 7], 0)))
    c.restore()
    z = lerp(1.96, 2.08, u); cx = lerp(848, 856, u)
    sx = lambda x: 540 + z * (x - cx); sy = lambda y: 1224 + z * (y - 1040)
    L.chip(c, '1 HOUR AGO', sx(STICK_X - 122), sy(Y0 - 38), L.YELLOW, 40, a, 0.9 + 0.1 * a)
    b = smooth((t - 4.7) / 0.25)
    L.chip(c, 'NOW', sx(STICK_X - 122), sy(yw(tau) + 34), L.TEAL, 40, b, 0.9 + 0.1 * b)


def stick_close(c, t):
    u = (t - T4) / (T5 - T4)
    ps = M.pose(head_yaw=track([(9.6, -0.3), (10.0, -0.3), (10.5, -0.62), (10.8, -0.62)], t), look=(track([(9.6, -0.6), (10.0, -0.6), (10.3, -0.95), (10.8, -0.95)], t), track([(9.6, 0.6), (10.0, 0.6), (10.3, -0.1), (10.8, -0.1)], t)),
                smile=0.5, l_up=29.5, l_fore=1, l_wrist=0, l_hand=H.GRIP, r_up=10 + 2 * math.sin(t * 2), r_fore=14, head_tilt=-3 + 2 * math.sin(t * 1.5), breath=0.5 + 0.5 * math.sin(t * 2.4))
    c.save(); cam(c, lerp(872, 880, u), Y0 + 6, lerp(3.0, 3.5, u), 540, 1236); WL.flat(c, t, TAU(t), ps, held=1.0); c.restore()


def curve_pt(tau):
    return (GX0 + GPH * tau, GY0 - GH * h_of(tau))


def curve_path(a, b, n=60):
    p = skia.Path(); p.moveTo(*curve_pt(a))
    for i in range(1, n + 1): p.lineTo(*curve_pt(lerp(a, b, i / n)))
    return p


def graph(c, t, tau, inset=False):
    A = lambda t0, d=0.3: smooth((t - t0) / d)
    ax = A(10.95); LB = 46 if inset else 42
    if ax <= 0: return
    if not inset:
        # a soft dusk behind the drawing so the lines read on the water, and a dark plate under the axis so no glint crosses the labels
        c.drawRect(skia.Rect(-200, GY0 - GH - 70, 1300, GY0 + 80), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, GY0 - GH - 70), skia.Point(0, GY0 + 80)],
                   [C((6, 26, 52), 0), C((6, 26, 52), 120 * ax), C((6, 26, 52), 120 * ax), C((6, 26, 52), 0)], [0, 0.2, 0.84, 1.0])))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(GX0 - 6, GY0 + 9, GX0 + 6 * GPH + 44, GY0 + 68), 18, 18), P((6, 18, 44), 210 * ax))
    else:
        c.drawLine(GX0, GY0, GX0, GY0 - GH - 8, SP((255, 255, 255), 3, 210 * ax))
    c.drawLine(GX0, GY0, GX0 + 6 * GPH + 14, GY0, SP((255, 255, 255), 3, 210 * ax))
    for i in range(1, 7):
        x = GX0 + GPH * i; passed = tau >= i - 0.02
        c.drawLine(x, GY0 - 7, x, GY0 + 7, SP((255, 255, 255), 3, 210 * ax))
        label(c, f'{i}h', x + (0 if i < 6 else -8), GY0 + 54, LB, Y if passed else (255, 255, 255), (255 if passed else 225) * ax)
    label(c, 'LOW', GX0 + 40, GY0 + 52, LB - 8, TL, 255 * ax)
    hi = A(15.4)
    if hi > 0: label(c, 'HIGH', GX0 + 6 * GPH - 4, GY0 - GH + 58, 44, TL, 255 * hi, align=1.0); c.drawLine(GX0, GY0 - GH, GX0 + 6 * GPH, GY0 - GH, skia.Paint(AntiAlias=True, Color=C((255, 255, 255), 90 * hi), Style=skia.Paint.kStroke_Style, StrokeWidth=2, PathEffect=skia.DashPathEffect.Make([8, 9], 0)))
    # "a steady pace": a straight line from low to high is tried, then dropped
    s1 = A(11.3, 0.9); s2 = A(12.9, 0.4); gone = A(13.62, 0.3)
    if s1 > 0 and gone < 1:
        x1, y1 = lerp(GX0, GX0 + 6 * GPH, s1), lerp(GY0, GY0 - GH, s1)
        col = mix((255, 255, 255), (255, 92, 92), s2); al = (230 - 120 * A(13.6, 0.5)) * (1 - gone)
        sl = skia.Path(); sl.moveTo(GX0, GY0); sl.lineTo(x1, y1)
        c.drawPath(sl, skia.Paint(AntiAlias=True, Color=C(col, al), Style=skia.Paint.kStroke_Style, StrokeWidth=5, PathEffect=skia.DashPathEffect.Make([16, 12], 0)))
        lx, ly = GX0 + 1.75 * GPH, GY0 - GH * 2.2 / 6 - 62             # the label sits clear above the line
        la = A(11.9, 0.3) * (1 - gone) * (1 - 0.45 * A(13.6, 0.5))
        if la > 0:
            label(c, 'STEADY', lx, ly, 50, col, 255 * la, align=0.5)
            if s2 > 0:
                f_ = skia.Font(L.BLACK, 50); hw = f_.measureText('STEADY') / 2 + 34
                for sg in (-1, 1): c.drawLine(lx + hw - 17, ly - 18 - 17 * sg, lx + hw + 17, ly - 18 + 17 * sg, SP((255, 92, 92), 8, 255 * la * s2))
    # the columns: what each hour adds
    cols = A(24.0, 0.5)
    if cols > 0:
        for i in range(1, 7):
            x = GX0 + GPH * i; c.drawLine(x, GY0, x, lerp(GY0, curve_pt(i)[1], cols), SP((255, 255, 255), 2, 110 * cols))
        for i in range(1, 5):
            if i == 1: top = h_of(1.0) * A(24.5, 0.6)
            else: top = h_of(min(max(tau, i - 1), i))
            lo = h_of(i - 1)
            if top - lo < 0.002: continue
            colr = (90, 220, 200) if i == 1 else ((120, 186, 204) if i == 2 else (255, 210, 63))
            xa, xb = GX0 + GPH * (i - 1) + 3, GX0 + GPH * i - 3
            c.drawRect(skia.Rect(xa, GY0 - GH * top, xb, GY0 - GH * lo), P(colr, 225 if i != 2 else 170))
            c.drawRect(skia.Rect(xa, GY0 - GH * top, xb, GY0 - GH * top + 4), P((255, 255, 255), 150))
    # the real curve
    dr = A(13.9, 2.0) if t < 16.0 else 1.0
    draw_u = (t - 13.9) / 2.0
    if draw_u > 0:
        cp = curve_path(0, 6 * min(1.0, draw_u), 80)
        c.drawPath(cp, SP((255, 214, 120), 20, 110, MaskFilter=blur(9))); c.drawPath(cp, SP((255, 250, 226), 7, 255))
    fl = A(16.84, 0.35) * (1 - A(21.3, 0.4))                  # the flat start
    if fl > 0:
        seg = curve_path(0, 1.5, 20); c.drawPath(seg, SP((90, 230, 210), 30, 150 * fl, MaskFilter=blur(8))); c.drawPath(seg, SP((150, 255, 236), 10, 255 * fl))
        c.drawLine(GX0 + 10, GY0 - 34, GX0 + 180, GY0 - 34, SP((150, 255, 236), 4, 230 * fl)); label(c, 'FLAT', GX0 + 16, GY0 - 52, 46, (150, 255, 236), 255 * fl, align=0.0)
    stp = max(A(21.68, 0.35) * (1 - A(23.8, 0.4)), A(28.3, 0.4) * (1 - A(32.3, 0.3)))   # the steep middle
    if stp > 0:
        seg = curve_path(2, 4, 30); c.drawPath(seg, SP((255, 150, 60), 32, 160 * stp, MaskFilter=blur(9))); c.drawPath(seg, SP((255, 200, 110), 11, 255 * stp))
    st2 = A(21.68, 0.35) * (1 - A(23.8, 0.4))
    if st2 > 0:
        px, py = curve_pt(3); sl_ = GH * math.pi / 12 / GPH
        c.drawLine(px - 120, py + 120 * sl_, px + 120, py - 120 * sl_, SP((255, 255, 255), 4, 220 * st2)); label(c, 'STEEPEST', px + 40, py + 58, 44, (255, 200, 110), 255 * st2, align=0.0)
    # labels for the two facts
    l1 = A(26.3, 0.3) * (1 - A(27.9, 0.25))
    if l1 > 0:
        c.drawLine(GX0 + 66, GY0 - 14, GX0 + 66, GY0 - 122, SP((90, 220, 200), 4, 255 * l1)); c.drawCircle(GX0 + 66, GY0 - 12, 6, P((90, 220, 200), 255 * l1))
        label(c, 'ABOUT 1/12', GX0 + 20, GY0 - 134, 48, (150, 255, 236), 255 * l1, align=0.0)
    l2 = A(30.66, 0.22)
    if l2 > 0:
        bx = GX0 + 4 * GPH + 16; ya, yb = GY0 - GH * 0.75, GY0 - GH * 0.25
        br = skia.Path(); br.moveTo(bx, ya); br.lineTo(bx + 16, ya); br.lineTo(bx + 16, yb); br.lineTo(bx, yb)
        c.drawPath(br, SP(Y, 5, 255 * l2)); s_ = 0.85 + 0.15 * l2
        c.save(); c.translate(bx + 34, (ya + yb) / 2 + 34); c.scale(s_, s_); label(c, '1/2', 0, 0, 100, Y, 255 * l2, align=0.0); c.restore()
    # now: the dot on the curve, level with the water on the pole
    da = A(15.2, 0.4)
    if da > 0:
        px, py = curve_pt(tau)
        c.drawLine(GX0 + 16, py, px - 14, py, skia.Paint(AntiAlias=True, Color=C((255, 255, 255), 150 * da), Style=skia.Paint.kStroke_Style, StrokeWidth=2.5, PathEffect=skia.DashPathEffect.Make([7, 8], 0)))
        pul = 0.5 + 0.5 * math.sin(t * 5)
        glow(c, px, py, 46 + 10 * pul, (255, 230, 150), 170 * da); c.drawCircle(px, py, 13, P((20, 30, 60), 255 * da)); c.drawCircle(px, py, 10, P((255, 244, 200), 255 * da))
        if T6 < t < 32.3:
            hr = min(4, int(math.floor(tau - 1e-6)) + 1)
            L.chip(c, f'HOUR {hr}', px - 110, py - 50, L.YELLOW, 40, 1.0 - A(31.9, 0.4))


CUT_A, CUT_B = 16.84, 21.66


def lesson(c, t):
    tau = TAU(t)
    if CUT_A <= t < CUT_B:
        # cut in close behind him: the real edge creeps to his boots while the flat start of the curve is lit in a panel above
        u = (t - CUT_A) / (CUT_B - CUT_A)
        c.save(); cam(c, lerp(876, 884, u), 1050, lerp(1.86, 1.98, u), 540, 1180); WL.flat(c, t, tau, man_fish(t), back=True, held=hold_k(t)); c.restore()
        c.save(); c.translate(198, 758); c.scale(0.92, 0.92); c.translate(-GX0, -GY0)
        pn = skia.RRect.MakeRectXY(skia.Rect(GX0 - 56, GY0 - GH - 44, GX0 + 6 * GPH + 56, GY0 + 78), 26, 26)
        c.drawRRect(pn, P((6, 18, 44), 190)); c.drawRRect(pn, SP((90, 220, 200), 3, 150))
        graph(c, t, tau, inset=True); c.restore()
        return
    u = (t - T5) / (T7 - T5)
    lapse = smooth((t - T6) / 0.4) * (1 - smooth((t - LAPSE1) / 0.5))
    pk = math.exp(-((t - 30.5) / 0.7) ** 2)
    c.save(); cam(c, 538, lerp(966, 984, u), lerp(1.0, 1.03, u) + 0.012 * pk)
    ps = man_fish(t) if t < T6 else man_lapse(tau)
    WL.flat(c, t, tau, ps, calm=lapse, hot_pole=smooth((t - 10.8) / 0.4) * (1 - smooth((t - 13.2) / 0.6)), back=True, held=hold_k(t) if t < T6 else 0.0)
    graph(c, t, tau)
    c.restore()


# ------------------------------------------------------------------ close shots of his face
def close_bg(c, t, L, hz=1010.0, sunx=250.0):
    pl = WL.pal(L)
    lgrad(c, skia.Rect(0, 0, 1080, hz + 2), 0, hz, [pl['sky0'], pl['sky1'], pl['sky2']], [0, 0.6, 1.0])
    sy = hz - 190 + 170 * L
    glow(c, sunx, sy, 520, mix((255, 214, 150), (255, 140, 80), L), 170); glow(c, sunx, sy, 190, (255, 240, 200), 210)
    c.save(); c.clipRect(skia.Rect(0, 0, 1080, hz)); c.drawCircle(sunx, sy, 70, P(pl['sun'])); c.restore()
    for (u, y, w, k) in WL.CLOUDS:
        x = ((u * 1700 + t * 5 * k) % 1700) - 300; yy = 180 + (y - 120) * 2.0
        c.drawOval(skia.Rect(x - w * 1.6, yy - w * 0.22, x + w * 1.6, yy + w * 0.22), P(mix((255, 236, 214), (255, 170, 150), L), 150 * k, MaskFilter=blur(22)))
    lgrad(c, skia.Rect(0, hz, 1080, 1920), hz, 1920, [pl['sea_far'], pl['sea_mid'], mix(pl['sea_mid'], pl['sea_near'], 0.5)], [0, 0.16, 1.0])
    c.drawRect(skia.Rect(0, hz - 6, 1080, hz + 30), P(mix(pl['sky2'], (255, 255, 255), 0.3), 150, MaskFilter=blur(12)))
    wp = skia.Path()
    for (u, yf, k, ph) in WL.WAVES:
        yy = hz + 10 + 900 * ((yf + 0.03 * t * k) % 1.0) ** 1.8; dp = (yy - hz) / 900.0; ln = (40 + 420 * dp) * k; x = ((u * 1700 + 14 * t * k) % 1700) - 300
        wp.moveTo(x - ln / 2, yy); wp.quadTo(x, yy - 4 - 16 * dp, x + ln / 2, yy)
    c.drawPath(wp, SP(mix(pl['sea_far'], (255, 255, 255), 0.4), 5, 100))
    c.drawOval(skia.Rect(sunx - 200, hz - 10, sunx + 200, 1700), P(pl['glit'], 60 + 40 * L, MaskFilter=blur(70)))
    for (dx, yf, ph, k) in WL.GLIT:
        if math.sin(t * 5.2 * k + ph) < 0.1: continue
        yy = hz + 8 + 800 * yf ** 1.5; dp = (yy - hz) / 800.0; xx = sunx + dx * (50 + 330 * dp); w_ = (10 + 44 * dp) * k
        c.drawOval(skia.Rect(xx - w_, yy - 3 - 5 * dp, xx + w_, yy + 3 + 5 * dp), skia.Paint(AntiAlias=True, Color=C(pl['glit'], 215), BlendMode=skia.BlendMode.kPlus))
    for i in range(2):
        gx = 700 + 200 * i + 120 * math.sin(t * 0.4 + i * 2); gy = 420 + 160 * i + 30 * math.sin(t * 0.7 + i); WL.gull(c, gx, gy, 1.5 + 0.5 * i, math.sin(t * 6 + i))


def close_calm(c, t):
    u = (t - T3) / (T4 - T3)
    ps, shr = man_calm(t)
    c.save(); cam(c, 540, 1180, lerp(1.0, 1.05, u), 540, lerp(1212, 1030, smooth((t - 8.0) / 1.5)))
    kit.blur_layer(c, 7); close_bg(c, t, 0.0); c.restore()
    M.draw(c, ps, 548, 1180 + 952 * 2.0 - 7 * shr, 2.0, extra=dict(shk=0.35))
    c.restore()


def close_shock(c, t):
    u = (t - T7) / (T8 - T7); ps = man_shock(t)
    k = smooth((t - 33.2) / 0.25)
    c.save(); cam(c, 540, 1100, lerp(1.0, 1.04, u) + 0.05 * k, 540, 1100)
    kit.blur_layer(c, 7); close_bg(c, t, 1.0, hz=1000.0, sunx=820.0); c.restore()
    tint = lambda v: mix(v, (170, 80, 110), 0.15)
    M.draw(c, ps, 530, 1100 + 952 * 2.0, 2.0, tint=tint, extra=dict(shk=0.35))
    c.restore()
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(1080, 600), skia.Point(0, 1400)], [C((255, 150, 80), 60), C((60, 30, 110), 50)])))


# ------------------------------------------------------------------ the last picture, from the water
_RF = np.random.default_rng(5)
TUFT = [(_RF.uniform(-60, 1140), _RF.uniform(0, 1), _RF.uniform(0.7, 1.3), _RF.uniform(0, 6.28)) for _ in range(120)]
FW = [(_RF.uniform(0, 1), _RF.uniform(0, 1), _RF.uniform(0.5, 1.0), _RF.uniform(0, 6.28)) for _ in range(70)]
FRIP = [(_RF.uniform(-60, 1140), _RF.uniform(0, 1), _RF.uniform(30, 80)) for _ in range(60)]


def dune_y(x, k=0):
    return 742 + 30 * math.sin(x * 0.0052 + 1.0 + k) + 16 * math.sin(x * 0.013 + 2.0 * k) - 60 * math.exp(-((x - 860) / 260.0) ** 2) * (1 - k)


def reflect(c, draw_fn, x0, x1, ys, hgt, t, alpha=0.4, squash=0.85, amp=6.0, step=4):
    """a moving reflection: what stands above the water at ys is drawn once, then laid upside down below it in thin bands that slide sideways with the ripples"""
    w, h = int(x1 - x0), int(hgt)
    sf = skia.Surface(w, h); cc = sf.getCanvas(); cc.translate(-x0, -(ys - hgt)); draw_fn(cc); img = sf.makeImageSnapshot()
    n = int(hgt * squash / step); so = skia.SamplingOptions(skia.FilterMode.kLinear)
    for j in range(n):
        sy = h - (j + 1) * step / squash
        if sy < 0: break
        off = amp * math.sin(t * 2.6 + j * 0.5) * min(1.0, j / 5.0) + 0.5 * amp * math.sin(t * 4.1 + j * 1.3)
        c.drawImageRect(img, skia.Rect(0, sy, w, sy + step / squash), skia.Rect(x0 + off, ys + j * step, x1 + off, ys + (j + 1) * step + 0.7), so, skia.Paint(Alphaf=alpha * (1 - 0.75 * j / n)))


def final(c, t):
    """the same low view as the first frame, later: the sea is past the car, up to its door sills; he has turned and stands in it beyond the car, hands to his head"""
    u = (t - T8) / (DUR - T8)
    c.save(); cam(c, lerp(560, 610, u), 1150, lerp(1.0, 1.22, smooth(u * 1.15)), lerp(560, 548, u), 1150); lowview(c, t, True, man_end(t)); c.restore()


def scene(c, t):
    if t < T2: wide(c, t)
    elif t < T3: full(c, t)
    elif t < T4: close_calm(c, t)
    elif t < T5: stick_close(c, t)
    elif t < T7: lesson(c, t)
    elif t < T8: close_shock(c, t)
    else: final(c, t)


TITLES = [
    (0.0, [[('TIDE COMING IN', Wt)], [('DOES HE ', Wt), ('HAVE TIME?', Y)]]),
    (T2, [[('ONLY ', Wt), ('A FEW STEPS', TL)], [('IN THE LAST HOUR', Wt)]]),
    (T3, [[('HE FIGURES', Wt)], [('PLENTY OF TIME', Y)]]),
    (T4, [[('DOES HE?', Y)]]),
    (T5, [[('A TIDE DOES NOT RISE', Wt)], [('AT A ', Wt), ('STEADY PACE', R)]]),
    (13.56, [[('ITS HEIGHT IS', Wt)], [('CLOSE TO A ', Wt), ('SINE CURVE', Y)]]),
    (16.84, [[('NEAR LOW TIDE', Wt)], [('ALMOST FLAT', TL)]]),
    (21.68, [[('HALFWAY UP', Wt)], [('STEEPEST', OR)]]),
    (24.0, [[('THE FIRST HOUR', Wt)], [('ABOUT ', Wt), ('ONE TWELFTH', TL)]]),
    (27.92, [[('HOURS 3 AND 4', Wt)]]),
    (30.66, [[('HOURS 3 AND 4', Wt)], [('HALF THE RISE', Y)]]),
    (31.56, [[('SAME TIDE', Wt)], [('FASTEST IN THE MIDDLE', Y)]]),
    (T8, [[('AND HIS CAR IS STILL', Wt)], [('PARKED ON THE SAND', Y)]]),
]

SHORT = Short(WD, 'AP PRECALCULUS', TITLES, scene, DUR, T_END, lift=lambda t: 1.03, fix={'HALF.': 'half.'})

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir=f'{OUT}/stills')
