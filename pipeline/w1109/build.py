"""w1109-01-monty-hall (AP Statistics): the Monty Hall problem as a game show. 1080x1920, 30 fps, all code.
Director's shot list:
 1  0.0-9.0   present, wide over her shoulder: door 3 open (goat), door 1 her pick. Slow push, then on toward doors 1 and 2 (ghost car).
 2  9.0-13.1  earlier, wide: three closed doors, she points at door 1.
 3  13.1-19.3 earlier, close on door 3: the host's hand opens it, the goat.
 4  19.3-35.3 present, wide: 50/50 struck out; 1 in 3 on her door, 2 in 3 on the other two, door 3 crossed out, the 2 in 3 lands on door 2.
 5  35.3-41.5 she points at door 2, it opens on the car: the light, the push and the score peak together. Loops to shot 1.
Motion list (for the accuracy check): the host opens only a door she did not pick and that hides a goat; the 1 in 3 stays on door 1;
the 2 in 3 covers doors 2 and 3 together and then sits on door 2 alone once door 3 is shown; nothing is added to or taken from door 1."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/mh']
import skia
import kit, lpk, art as A, char as CH
from kit import Words, Short, ease_io, Wt, Y, R, TL
from lpk import P, SP, C, blur, smooth, lerp, mix
import layout as L

WD = Words('/home/claude/mh/out/words.json')
DUR, T_END = 41.5, 40.05
T_FLASH, T_CLOSE, T_NOW = 8.96, 13.12, 19.28
T_OPEN3 = 15.68
T_FIRST, T_13, T_23, T_OTHER, T_X, T_SLIDE = 24.16, 25.44, 27.28, 30.32, 33.95, 34.45
T_SO, T_OPEN2, T_WINS = 35.28, 36.70, 38.08
OPEN_A = 83.0


def track(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t0 <= t < t1: return lerp(v0, v1, smooth((t - t0) / (t1 - t0)))
    return keys[-1][1]


def pulse(t, t0, rise=0.12, hold=0.3, fall=0.5):
    if t < t0: return 0.0
    if t < t0 + rise: return smooth((t - t0) / rise)
    if t < t0 + rise + hold: return 1.0
    return 1 - smooth((t - t0 - rise - hold) / fall)


def back_out(u, k=1.6):
    u = min(1.0, max(0.0, u)); u -= 1
    return 1 + (k + 1) * u ** 3 + k * u ** 2


def pop(t, t0, d=0.28):
    return 0.0 if t < t0 else back_out((t - t0) / d, 2.2)


YAW = [(0, 0.0), (0.7, -0.15), (1.25, -0.85), (2.0, -0.85), (2.75, 0.6), (3.7, 0.6), (4.6, 0.0), (6.9, 0.0), (7.3, -0.4), (7.75, -0.4), (8.15, 0.35), (8.96, 0.3)]
YAW_F = [(8.96, 0.1), (9.9, -0.5), (10.4, 0.2), (10.9, 0.7), (11.3, 0.5), (11.75, -0.75), (13.12, -0.75)]
YAW_N = [(19.28, 0.2), (20.2, 0.0), (20.5, -0.7), (20.78, -0.7), (21.2, 0.55), (21.7, 0.55), (22.3, 0.0), (22.85, 0.0), (23.15, 0.28), (23.8, 0.28),
         (24.2, -0.8), (26.8, -0.8), (27.4, 0.6), (30.2, 0.5), (30.6, 0.8), (31.4, 0.8), (31.9, 0.5), (33.0, 0.5), (33.5, 0.9), (34.5, 0.9), (35.0, 0.55),
         (37.9, 0.55), (38.3, 0.2), (41.5, 0.2)]


def yaw_at(t):
    if t < T_FLASH: return track(YAW, t)
    if t < T_CLOSE: return track(YAW_F, t)
    return track(YAW_N, max(t, T_NOW))


def arm_to(t, t0, d, side, target, frm=None, bulge=46):
    """hand position on an outward arc from rest (or frm) to target, with a small overshoot that settles"""
    a = frm or CH.rest_hand(side)
    u = (t - t0) / d
    if u <= 0: return a if frm else None
    e = back_out(u, 1.2); uu = min(1.0, max(0.0, u))
    return (lerp(a[0], target[0], e) + side * bulge * math.sin(math.pi * uu), lerp(a[1], target[1], e))


PL, PR = (224, 1016), (532, 1016)
AIM1, AIM2 = (A.DOORX[1], 850), (A.DOORX[2], 850)
HEAD_L, HEAD_R = (CH.X0 - 44, 1104), (CH.X0 + 44, 1104)


def camera(t):
    if t < T_FLASH:
        if t < 4.0: u = t / 4.0; return lerp(1.0, 1.05, u), 540, lerp(960, 952, u)
        u = ease_io((t - 4.0) / (T_FLASH - 4.0))
        return lerp(1.05, 1.42, u), lerp(540, 384, u), lerp(952, 870, u)
    if t < T_CLOSE:
        u = (t - T_FLASH) / (T_CLOSE - T_FLASH); return lerp(1.0, 1.05, u), 540, 958
    if t < T_NOW:
        u0 = (t - T_CLOSE) / (T_NOW - T_CLOSE)
        u = ease_io((t - 16.1) / 1.7)
        return lerp(1.62, 1.40, u) + 0.05 * u0, lerp(892, 866, u), lerp(852, 846, u)
    if t < T_SO:
        u = (t - T_NOW) / (T_SO - T_NOW); return lerp(1.0, 1.09, u), 540, lerp(960, 934, u)
    u = ease_io((t - T_SO) / 2.2); u2 = ease_io((t - 36.9) / 4.6)
    return lerp(1.09, 1.2, u) + 0.42 * u2, lerp(540, 510, u) + 62 * u2, lerp(934, 925, u) + 8 * u2


def cam(c, z, tx, ty, k=1.0):
    zz = 1 + (z - 1) * k
    c.translate(540, 960); c.scale(zz, zz); c.translate(-(540 + (tx - 540) * k), -(960 + (ty - 960) * k))


def door3_angle(t):
    if t < T_FLASH or t >= T_NOW: return OPEN_A
    if t < T_FLASH + 0.6: return OPEN_A * (1 - ease_io((t - T_FLASH) / 0.55))
    if t < T_OPEN3: return 0.0
    u = (t - T_OPEN3) / 1.25
    return OPEN_A * back_out(u, 0.9)


def door2_angle(t):
    if t < T_OPEN2: return 0.0
    return 84.0 * back_out((t - T_OPEN2) / 1.05, 0.9)


CUS = ((4.0, 6.3), (22.72, 23.92), (37.45, 38.4))
GOLDK, TEALK = (255, 214, 150), (120, 230, 220)


def closeup(c, t):
    for i, (a, bb) in enumerate(CUS):
        if a <= t < bb:
            u = (t - a) / (bb - a)
            c.save(); z = 1.0 + 0.06 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
            lid = 0.05 if (0.42 < u < 0.47 and i == 0) else 1.0
            if i == 0:      # eyes go from door 1 (gold, screen right) to door 2 (teal, screen left)
                k = smooth((t - 4.95) / 0.3); key = mix(GOLDK, TEALK, k); ks = 1 if k < 0.5 else -1
                CH.reverse_bg(c, t, key, ks); CH.face(c, t, look=lerp(0.85, -0.75, k), worry=0.75, smile=-0.35, lid=lid, key=key, key_side=ks, tilt=lerp(-2, 2, k))
            elif i == 1:    # "Why not?": she turns from the doors to us
                k = smooth((t - a - 0.15) / 0.3)
                CH.reverse_bg(c, t, GOLDK, 1); CH.face(c, t, look=lerp(-0.7, 0.0, k), brow=0.9 * k, worry=0.35, smile=-0.15, tilt=6 * k, key=GOLDK, key_side=1)
            else:           # the car: gold light, eyes wide, hands up, then the smile
                k = smooth((t - a - 0.25) / 0.35)
                CH.reverse_bg(c, t, (255, 226, 150), -1, warm=1); CH.face(c, t, look=-0.25, brow=1.0, lid=1.22, smile=lerp(0.1, 0.95, k), opn=lerp(0.55, 0.85, k),
                                                                         hands=smooth((t - a) / 0.3), key=(255, 226, 150), key_side=-1)
            c.restore(); return True
    return False


def scene(c, t):
    if closeup(c, t): return
    z, tx, ty = camera(t)
    flash = T_FLASH <= t < T_NOW
    close = T_CLOSE <= t < T_NOW
    a3, a2 = door3_angle(t), door2_angle(t)
    warm = smooth((t - 37.0) / 0.9)
    # ---- far layer
    c.save(); cam(c, z, tx, ty, 0.88); A.backdrop(c, t, warm); c.restore()
    # ---- the stage
    c.save(); cam(c, z, tx, ty)
    cols = {1: A.BLUE, 2: mix(A.BLUE, (255, 210, 120), smooth(a2 / 60)), 3: mix(A.BLUE, (255, 196, 130), smooth(a3 / 60))}
    A.floor(c, t, cols, warm)
    picked = (not flash) or t >= 12.2 or t < T_FLASH + 0.5
    pg = (0.62 + 0.38 * max(pulse(t, 1.3), pulse(t, 12.25), pulse(t, 20.45), pulse(t, T_FIRST))) * ((smooth((t - 12.2) / 0.3) if t >= 12.2 else 1 - smooth((t - T_FLASH) / 0.45)) if flash else 1.0)
    g2 = max(pulse(t, 2.95, 0.12, 0.5, 0.6), pulse(t, 20.85), pulse(t, T_OTHER + 0.2), 0.85 * smooth((t - T_SLIDE) / 0.6)) * (1 - smooth((t - 37.0) / 0.5))
    g3 = max(pulse(t, T_OTHER + 0.45), 0.0)
    lit = {i: pulse(t, 9.85 + 0.25 * (i - 1), 0.1, 0.25, 0.45) if flash else 0.0 for i in (1, 2, 3)}
    goat_fn = lambda cc, cx: (A.goat_room(cc, cx), A.goat(cc, cx + 128, 1084, t, 0.98, look=max(pulse(t, 16.7, 0.25, 2.0, 0.5), pulse(t, 33.7, 0.3, 1.6, 0.6)), bleat=pulse(t, 16.98, 0.08, 0.42, 0.2)))
    car_fn = lambda cc, cx: (A.car_room(cc, cx), A.car(cc, cx + 10, 1086, t, 1.0, beams=smooth((t - 37.35) / 0.4)))
    A.door(c, 1, 0.0, lit=lit[1] + 0.3 * (pg if picked else 0), frame_glow=(A.GOLD, pg) if picked else None, t=t)
    A.door(c, 2, a2, interior=car_fn, lit=lit[2] + 0.5 * g2, frame_glow=((A.TEAL, g2) if g2 > 0.02 else ((A.GOLD_HI, warm) if warm > 0.02 else None)), t=t)
    A.door(c, 3, a3, interior=goat_fn, lit=lit[3], frame_glow=(A.TEAL, g3) if g3 > 0.02 else None, t=t)
    for i in (1, 2, 3):
        A.plaque(c, i, max(lit[i], pg if (i == 1 and picked) else 0, g2 if i == 2 else 0, warm if i == 2 else 0), A.TEAL if (i == 2 and g2 > 0.02) else A.GOLD)
    # the host's hand on door 3 (close shot): on the handle for the whole pull, then it lets go and the door swings on
    if close:
        hp0 = A.handle_pt(3, 0.0)
        REL = 46.0
        if t < 14.0:
            u = ease_io((t - 13.2) / 0.8); hand = (hp0[0] + 440 * (1 - u), hp0[1] + 46 * (1 - u)); grip = 0.0
        elif a3 < REL and t < T_OPEN3 + 0.6:
            hand = A.handle_pt(3, a3); grip = smooth((t - 14.0) / 0.22)
        else:
            tr = T_OPEN3
            while door3_angle(tr) < REL: tr += 1 / 120
            hr_ = A.handle_pt(3, REL); u = max(0.0, (t - tr) / 0.7); e = 1 - (1 - min(1.0, u)) ** 2
            hand = (hr_[0] + 520 * min(1.0, e) + 30 * smooth(u / 0.25), hr_[1] + 60 * min(1.0, e)); grip = 1 - smooth(u / 0.18)
        hand = (hand[0] - 14, hand[1])
        A.host_hand_back(c, hand)
        A.handle_bar(c, 3, a3 if grip > 0.5 else a3)
        A.host_hand_front(c, hand, grip)
    # ---- the numbers, in the set
    if not flash:
        A.tag(c, 'HER PICK', A.DOORX[1], 668, A.GOLD, 34, 1.0, 1.0 - smooth((t - 36.2) / 0.4))
    elif t >= 12.3:
        A.tag(c, 'HER PICK', A.DOORX[1], 668, A.GOLD, 34, pop(t, 12.3), 1.0)
    elif t < T_FLASH + 0.4:
        A.tag(c, 'HER PICK', A.DOORX[1], 668, A.GOLD, 34, 1.0, 1 - smooth((t - T_FLASH) / 0.35))
    if t < T_FLASH:
        A.ghost_car(c, A.DOORX[1], pulse(t, 6.95, 0.15, 0.45, 0.3)); A.ghost_car(c, A.DOORX[2], pulse(t, 7.7, 0.15, 0.5, 0.35))
    if T_NOW <= t < 23.2:                                   # fifty fifty, struck out
        for i, t0 in ((1, 20.48), (2, 20.88)):
            if t >= t0:
                fall = max(0.0, t - 22.3); y = 800 + 520 * fall * fall; al = 1 - smooth(fall / 0.55)
                c.save(); c.translate(A.DOORX[i], y); c.rotate((8 if i == 1 else -8) * fall * 2.2); c.translate(-A.DOORX[i], -y)
                A.tag(c, '50%', A.DOORX[i], y, Wt, 66, pop(t, t0), al)
                s = smooth((t - 22.0) / 0.16)
                if s > 0: c.drawLine(A.DOORX[i] - 96, y + 12, A.DOORX[i] - 96 + 192 * s, y - 44, SP(A.RED, 13, 255 * al))
                c.restore()
    if t >= T_FIRST:
        fo = 1 - smooth((t - T_SO) / 0.5)
        A.outline(c, 74, 356, A.GOLD, (t - T_FIRST) / 0.8, fo)
        if t >= T_13: A.tag(c, '1 in 3', A.DOORX[1], 810, A.GOLD, 62, pop(t, T_13), fo)
    if t >= T_23:
        s = ease_io((t - T_SLIDE) / 0.7); fo = 1 - smooth((t - 36.1) / 0.45)
        A.outline(c, 398, lerp(1006, 682, s), A.TEAL, (t - T_23) / 1.0, fo)
        A.tag(c, '2 in 3', lerp(702, A.DOORX[2], s), lerp(548, 810, s), A.TEAL, lerp(54, 62, s), pop(t, T_23 + 0.05), fo)
    if t >= T_X:                                             # door 3 is out
        fo = 1 - smooth((t - 36.1) / 0.45); cx, cy, r = A.DOORX[3] + 26, 716, 78
        for k, (dx0, dx1) in enumerate(((-1, 1), (1, -1))):
            s = smooth((t - T_X - 0.16 * k) / 0.16)
            if s > 0:
                for w, col in ((30, (40, 8, 20)), (18, A.RED)):
                    c.drawLine(cx + dx0 * r, cy - r, cx + dx0 * r + (dx1 - dx0) * r * s, cy - r + 2 * r * s, SP(col, w, 255 * fo))
    A.lights(c, t, 1.0)
    # ---- her
    if not close:
        yaw = yaw_at(t); pony = max(-17.0, min(17.0, -(yaw - yaw_at(t - 0.22)) * 40)) + 3 * math.sin(t * 1.1)
        sway = 5 * math.sin(t * 0.8); dy = 0.0; sq = 1.0
        hl = hr = pl = pr = None; front = False
        if flash:
            dy = 12 * pulse(t, 11.1, 0.14, 0.06, 0.3)
            hl = arm_to(t, 11.3, 0.85, -1, PL); pl = AIM1 if hl is not None and t > 11.7 else None
        elif T_NOW <= t < T_SO:
            rs = CH.rest_hand(1); chin = (CH.X0 + 58, 1168); gest = (600, 1196)
            keys = [(22.75, rs), (23.25, chin), (26.7, chin), (27.2, gest), (28.6, gest), (29.2, rs), (30.2, rs), (30.7, gest), (31.5, gest), (32.1, chin), (34.6, chin), (35.15, rs)]
            if keys[0][0] < t < keys[-1][0]:
                hr = (track([(a, p[0]) for a, p in keys], t), track([(a, p[1]) for a, p in keys], t)); front = t < 26.9 or t > 31.9
            sway += track([(22.8, 0), (23.3, -10), (26.8, -10), (27.4, 12), (33.2, 12), (33.8, 22), (35.0, 22), (35.3, 0)], t)
            dy = -6 * pulse(t, 33.6, 0.3, 1.0, 0.4)
        elif t >= T_SO:
            dy = 12 * pulse(t, 35.3, 0.14, 0.06, 0.3)
            T_GASP = 37.12
            if t < T_GASP:
                hr = arm_to(t, 35.5, 0.85, 1, PR); pr = AIM2 if hr is not None and t > 35.9 else None
            else:                                               # both hands fly to her head when she sees the car
                front = True
                hr = arm_to(t, T_GASP, 0.45, 1, HEAD_R, frm=PR, bulge=8); hl = arm_to(t, T_GASP + 0.05, 0.46, -1, HEAD_L)
                k = t - T_WINS - 0.1
                if 0 < k < 1.65:                                # and she bounces on "wins"
                    ph = (k % 0.55) / 0.55; dy = -32 * math.sin(math.pi * ph); sq = 1 - 0.02 * math.cos(2 * math.pi * ph)
        CH.back(c, t, yaw=yaw, pony=pony, dy=dy, sway=sway, hl=hl, hr=hr, pl=pl, pr=pr, sq=sq, rim_boost=warm, arms_front=front, tilt=6 * pulse(t, 22.2, 0.3, 1.4, 0.4))
    if warm > 0:                                             # the peak: gold light floods from door 2
        fl = pulse(t, 37.25, 0.3, 0.25, 1.4)
        A.glow(c, A.DOORX[2], 860, 1000, (255, 226, 150), 80 * fl + 22 * warm)
        A.confetti(c, t, 37.55)
    c.restore()
    if not close:
        c.save(); cam(c, z, tx, ty, 1.22); A.audience(c, t); c.restore()


TITLES = [
    (0.0, [[('MONTY HALL PROBLEM', Wt)], [('STAY OR ', Wt), ('SWITCH?', Y)]]),
    (T_FLASH, [[('ONE CAR', Y)], [('THREE DOORS', Wt)]]),
    (11.3, [[('SHE PICKED', Wt)], [('DOOR 1', Y)]]),
    (T_CLOSE, [[('THE HOST ', Wt), ('KNOWS', Y)], [('WHERE THE CAR IS', Wt)]]),
    (15.5, [[('HE OPENS', Wt)], [('DOOR 3', Y)]]),
    (T_NOW, [[('FEELS LIKE', Wt)], [('50 / 50', Y)]]),
    (21.76, [[('BUT IT ', Wt), ("ISN'T", R)]]),
    (T_FIRST, [[('HER FIRST PICK', Wt)], [('1 IN 3', Y)]]),
    (T_23, [[('THE OTHER TWO', Wt)], [('2 IN 3', TL)]]),
    (T_X, [[('NOT ', R), ('DOOR 3', Wt)], [('SO DOOR 2: ', Wt), ('2 IN 3', TL)]]),
    (T_SO + 0.45, [[('SWITCHING WINS', Wt)], [('2 OUT OF 3', Y)]]),
]

SHORT = Short(WD, 'AP STATISTICS', TITLES, scene, DUR, T_END, lift=lambda t: 1.12, fix={'NOT': 'not'}, cuts=(T_FLASH, T_CLOSE, T_NOW))

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/mh/out/stills')
