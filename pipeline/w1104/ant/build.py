"""w1104-01-zombie-ant (AP Bio, nature being strange). Premium standard, all code (skia), no person (the story's
subject is an ant: Camponotus carpenter ant drawn in code from real proportions, antart.py).

Art plan and motion list (for the accuracy check):
- Shot A, forest floor (0 to "Now"): a Thai rainforest floor in layers (hazy trunks, ferns, leaf litter, a root the
  colony walks along). The trail ants walk left along the root; the hero ant walks right, alone, away from them.
  "Three weeks ago": the scene tints warm (a flashback) and one pale spore drifts down and sticks to the ant's shell.
  The tint clears, the body turns see through (body only, never the head) and white fungal threads grow through the
  thorax muscles and the gaster. An accelerating push into the ant cuts to the plant.
- Shots B to E, one plant, one continuous camera: the ant climbs the stem (feet planted, tripod gait); a ruler chip
  reads about 25 cm on "twenty five centimeters"; damp mist drifts at "where the air suits the fungus". At the top it
  turns under a leaf and walks upside down along the main vein. The noon sun sits straight overhead behind the leaf
  (leaf glows, veins show). On "bites" the jaws open and close on the vein; on "locks" they lock shut. On "dies" the
  legs stiffen and the light drops. "Days later": three quick day and night cycles, then one stalk grows out of the
  back of the head with a swelling partway up; spores fall from it onto the forest floor below, where the colony
  forages. Wide pull back for the ending on "parasitism".
Science: Hughes et al. 2011 (bite about 25 cm up, main vein on the leaf underside, around solar noon; stalk from the
back of the head after death); Andersen et al. 2009 (that height suits the fungus); Fredericksen et al. 2017 (threads
in the body and muscles, not the brain); infection to death about 16 to 24 days (Britannica)."""
import sys, math
sys.path[:0] = ['/home/claude/w1104', '/home/claude/w1104/ant']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, ease_io, Wt, Y, R, TL, W, H
import antart as A

WD = kit.Words('/home/claude/w1104/out/w1104-01-zombie-ant/words.json')
at = WD.at
T_SP = at('three'); T_LAND = at('landed'); T_GREW = at('grew'); T_NOW = at('now'); T_25 = at('twenty')
T_AIR = at('where'); T_Q = at('so'); T_NOON = at('noon'); T_BITE = at('bites'); T_JAW = at('jaw'); T_LOCK = at('locks')
T_DIES = at('dies'); T_DAYS = at('days'); T_STALK = at('stalk'); T_RAIN = at('rains'); T_WINS = at('wins')
T_LOSES = at('loses'); T_PARA = at('parasitism')
T_END = WD.end() + 0.5
DUR = round(T_END + 1.6, 2)
PUSH0 = T_NOW - 0.55

TITLES = [
    (0.0, [[('ZOMBIE ANT', Y)], [('FUNGUS', Wt)]]),
    (T_SP, [[('3 WEEKS AGO', Y)], [('A SPORE LANDS', Wt)]]),
    (T_NOW, [[('IT CLIMBS', Wt)], [('25 CM UP', Y)]]),
    (T_Q, [[('UP THERE...', Wt)]]),
    (at('at'), [[('AT NOON', Y)], [('IT BITES', Wt)]]),
    (at('and', 1) if False else T_JAW - 0.3, [[('JAW', Wt), (' LOCKED', R)]]),
    (at('it', 4) if False else T_DIES - 0.15, [[('IT DIES', Wt)], [('HANGING THERE', Y)]]),
    (T_DAYS, [[('DAYS LATER', Y)], [('A STALK GROWS', Wt)]]),
    (T_RAIN, [[('SPORES', Y), (' RAIN DOWN', Wt)]]),
    (WD.at('the', 3) if False else T_WINS - 0.5, [[('FUNGUS WINS', TL)], [('ANT LOSES', R)]]),
    (at('and', 3) if False else T_PARA - 1.8, [[('PARASITISM', Y)]]),
]

# ------------------------------------------------------------------ forest pieces
FG1, FG2 = (38, 74, 52), (26, 54, 40)
TRUNK_FAR, TRUNK_MID = (128, 170, 150), (86, 128, 102)
GROUND, GROUND_SH = (92, 70, 48), (70, 52, 36)
LITTER = [(150, 104, 58), (178, 128, 70), (120, 86, 52), (196, 150, 84)]
_rs = np.random.default_rng(5)
LIT = [(_rs.uniform(-200, 1300), _rs.uniform(0, 1), _rs.integers(0, 4), _rs.uniform(0, 6.28), _rs.uniform(0.7, 1.3)) for _ in range(90)]
MOTES = [(_rs.uniform(0, 1), _rs.uniform(0, 1), _rs.uniform(0.6, 1.4), _rs.uniform(0, 6.28)) for _ in range(60)]


def sky_haze(c, top, bot, k=1.0):
    lgrad(c, skia.Rect(-400, -2000, 1600, 4000), top, bot, [mix((196, 226, 178), (40, 60, 70), 1 - k), mix((112, 160, 120), (30, 46, 50), 1 - k), mix((60, 98, 72), (16, 26, 26), 1 - k)], [0, 0.55, 1])


def trunks(c, t, y0, y1, xs, col, w, sway=0.0):
    for i, x in enumerate(xs):
        dx = sway * math.sin(t * 0.4 + i)
        p = skia.Path(); p.moveTo(x - w / 2, y1); p.lineTo(x - w * 0.42 + dx, y0); p.lineTo(x + w * 0.42 + dx, y0); p.lineTo(x + w / 2, y1); p.close()
        c.drawPath(p, P(col))
        c.drawRect(skia.Rect(x + w * 0.18, y0, x + w * 0.3, y1), P(mix(col, (255, 240, 200), 0.18)))


def fern(c, x, y, s, t, col, ph=0.0, flip=1):
    c.save(); c.translate(x, y); c.scale(s * flip, s)
    sw = 4 * math.sin(t * 0.9 + ph)
    for k in range(5):
        ang = -60 + k * 30 + sw
        c.save(); c.rotate(ang)
        leaf = smooth_closed([(0, 0), (20, -60), (12, -170), (0, -230), (-12, -170), (-20, -60)])
        c.drawPath(leaf, P(col)); c.drawLine(0, 0, 0, -220, SP(mix(col, (0, 0, 0), 0.25), 3))
        c.restore()
    c.restore()


def light_shafts(c, t, sx, sy, a=1.0, n=5):
    for k in range(n):
        ang = math.radians(100 + k * 9 + 2 * math.sin(t * 0.3 + k))
        w = 0.025 + 0.012 * (k % 3)
        p = skia.Path(); p.moveTo(sx, sy)
        for s_ in (-w, w): p.lineTo(sx + 3000 * math.cos(ang + s_), sy + 3000 * math.sin(ang + s_))
        p.close()
        br = (0.75 + 0.25 * math.sin(t * 0.6 + k)) * a
        c.drawPath(p, P((255, 240, 180), 34 * br, MaskFilter=blur(26), BlendMode=skia.BlendMode.kScreen))
        c.drawPath(p, P((255, 236, 170), 16 * br, MaskFilter=blur(10), BlendMode=skia.BlendMode.kPlus))


def motes(c, t, rect, a=1.0, col=(255, 246, 210)):
    x0, y0, x1, y1 = rect
    for (u, v, s, ph) in MOTES:
        x = x0 + (u * (x1 - x0) + 14 * math.sin(t * 0.5 * s + ph)) % (x1 - x0)
        y = y0 + ((v + t * 0.012 * s) % 1.0) * (y1 - y0)
        c.drawCircle(x, y, 2.2 * s, P(col, 120 * a * (0.5 + 0.5 * math.sin(t * s + ph))))


def floor(c, t, y, x0=-300, x1=1400, k=1.0):
    c.drawRect(skia.Rect(x0, y, x1, y + 1600), P(mix(GROUND, (20, 18, 14), 1 - k)))
    for (lx, lv, li, la, ls) in LIT:
        if not (x0 < lx < x1): continue
        ly = y + 10 + lv * 400
        c.save(); c.translate(lx, ly); c.rotate(math.degrees(la)); c.scale(ls, ls * 0.45)
        c.drawPath(smooth_closed([(-40, 0), (0, -16), (44, 0), (0, 16)]), P(mix(LITTER[li], (20, 18, 14), 1 - k)))
        c.restore()


def root(c, y, t):
    """the root the colony walks along"""
    p = skia.Path(); p.moveTo(-300, y + 30); p.cubicTo(200, y - 10, 700, y - 30, 1400, y + 10)
    p.lineTo(1400, y + 60); p.cubicTo(700, y + 20, 200, y + 40, -300, y + 80); p.close()
    flat(c, p, (106, 76, 52), (80, 56, 38), sh_off=(0, 8), rim=(214, 170, 110), rim_d=(0, -3), rim_a=200)


def root_y(x, y):
    u = (x + 300) / 1700
    return (1 - u) ** 3 * (y + 30) + 3 * (1 - u) ** 2 * u * (y - 10) + 3 * (1 - u) * u ** 2 * (y - 30) + u ** 3 * (y + 10)


# ------------------------------------------------------------------ shot A: the trail and the hero leaving it
TRAIL = [(-200 + 230 * i) for i in range(8)]


def shot_a(c, t):
    u = t / PUSH0
    c.save()
    # slow push following the hero, then the accelerating push into his body (zoom cut)
    if t < T_SP:
        kit.push(c, ease_io(t / T_SP), 540, 1000, 1.0, 1.08, 540, 1000, 560, 1020)
    elif t < PUSH0:
        k = ease_io((t - T_SP) / 1.4)
        kit.push(c, 1, 540, 1000, 1.08, 1.08, lerp(560, hero_x(t) - 60, k), lerp(1020, 1150, k))
        c.translate(lerp(560, hero_x(t) - 60, k), lerp(1020, 1150, k)); c.scale(1 + 0.5 * k, 1 + 0.5 * k); c.translate(-lerp(560, hero_x(t) - 60, k), -lerp(1020, 1150, k))
    else:
        k = ((t - PUSH0) / (T_NOW - PUSH0)) ** 2.2
        kit.push(c, 1, 540, 1000, 1.62, 1.62 + 2.4 * k, hero_x(t) - 60, 1150, hero_x(t) - 60, 1150)
    sky_haze(c, -200, 1300)
    light_shafts(c, t, 900, -100, 0.9)
    trunks(c, t, -400, 1200, [80, 330, 760, 1010], TRUNK_FAR, 90, 2)
    trunks(c, t, -400, 1200, [190, 600, 940], TRUNK_MID, 150, 1)
    for i, (x, s) in enumerate([(60, 1.3), (300, 1.0), (840, 1.2), (1040, 1.4)]):
        fern(c, x, 1150, s, t, (70, 120, 84), ph=i)
    floor(c, t, 1120)
    root(c, 1080, t)
    # the colony: ants walking left along the root, in line
    for i, x0 in enumerate(TRAIL):
        x = x0 + 70 * t
        x = (x + 300) % 1900 - 300
        A.ant(c, x, root_y(x, 1080) + 4, 0.42, t, travel=70 * t / 0.42 + i * 40, face=1, br_ph=i, light=0.8)
    motes(c, t, (-100, 200, 1200, 1300), 0.8)
    # the hero, alone, walking right, out of the line
    hx = hero_x(t)
    tint = smooth((t - T_SP + 0.1) / 0.3) * (1 - smooth((t - T_GREW + 0.25) / 0.35))
    sp = smooth((t - (T_LAND - 0.45)) / 0.8)
    cut = smooth((t - T_LAND - 0.45) / 0.35)
    hy = smooth((t - T_LAND - 0.6) / 1.8)
    if 0 < sp < 1:          # the spore drifting down before it sticks
        pass
    c.drawOval(skia.Rect(hx - 260, 1100, hx + 260, 1290), P((220, 255, 210), 40 * (1 - tint), MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    A.ant(c, hx, 1250, 1.15, t, travel=(860 - hx) / 1.15, face=-1, spore=sp, cut=cut, hyph=hy)
    if sp >= 1 and t < T_NOW:       # the spore stays lit where it stuck, while the threads spread from it
        gx, gy = hx - 40 * 1.15, 1250 - (104 + 34) * 1.15
        c.drawCircle(gx, gy, 70, P((255, 250, 220), 170, MaskFilter=blur(22)))
        c.drawOval(skia.Rect(gx - 22, gy - 14, gx + 22, gy + 14), P((250, 244, 220), 250))
    if T_SP - 0.4 < t < T_LAND + 0.8 and sp < 1:
        sy = lerp(300, 1250 - 34 * 1.15 - 104 * 1.15, sp)
        sx_ = hx - 40 * 1.15 + 30 * math.sin(t * 2)
        c.drawCircle(sx_, sy, 90, P((255, 250, 220), 120, MaskFilter=blur(30)))
        c.drawOval(skia.Rect(sx_ - 26, sy - 16, sx_ + 26, sy + 16), P((246, 238, 212), 250))
    # near leaves out of focus
    kit.blur_layer(c, 14)
    fern(c, -40, 1900, 2.6, t, FG2, ph=2, flip=1)
    fern(c, 1150, 1950, 2.9, t, FG1, ph=4, flip=-1)
    c.restore()
    c.restore()
    if tint > 0:
        c.drawRect(skia.Rect(0, 0, W, H), P((190, 140, 70), 70 * tint, BlendMode=skia.BlendMode.kMultiply))
        c.drawRect(skia.Rect(0, 0, W, H), P((255, 220, 160), 26 * tint, BlendMode=skia.BlendMode.kScreen))


def hero_x(t):
    return 860 - 62 * t


# ------------------------------------------------------------------ the plant (shots B to E, one camera)
SX = 760            # stem left surface x
GY = 3000           # ground y in plant space
LEAF_Y = 900        # leaf underside (main vein) y
CLIMB_T0, CLIMB_T1 = T_NOW, T_Q + 0.6
TURN = 0.7          # seconds to turn the corner onto the leaf
BITE_X = 430


def ant_path(t):
    """position (x, y), rotation and travel of the ant in plant space"""
    s = 0.95
    if t < CLIMB_T1:
        u = (t - CLIMB_T0) / (CLIMB_T1 - CLIMB_T0)
        y = lerp(2300, LEAF_Y + 140, ease_io(u) * 0.15 + u * 0.85)
        return SX, y, -90, (2300 - y) / s
    tt = t - CLIMB_T1
    base = (2300 - (LEAF_Y + 140)) / s
    if tt < TURN:
        k = ease_io(tt / TURN)
        x = SX - 120 * k; y = LEAF_Y + 140 * (1 - k)
        return x, y, -90 - 90 * k, base + 180 * k / s
    x = SX - 120 - 180 * (tt - TURN)
    x = max(BITE_X, x)
    return x, LEAF_Y, -180, base + 180 / s + (SX - 120 - x) / s


def leaf(c, t, glow=1.0, k=1.0):
    """the leaf seen from below: blade over the vein, lit by the noon sun behind it"""
    sw = 3 * math.sin(t * 0.7)
    blade = smooth_closed([(SX + 10, LEAF_Y - 6), (620, LEAF_Y - 70 + sw), (300, LEAF_Y - 80 + sw), (40, LEAF_Y - 30 + sw * 2),
                           (-60, LEAF_Y + 6 + sw * 2), (60, LEAF_Y + 40 + sw), (330, LEAF_Y + 50), (620, LEAF_Y + 34)])
    col = mix((112, 168, 74), (40, 60, 40), 1 - k)
    c.drawPath(blade, P(col))
    # backlight: glow through the blade
    c.save(); c.clipPath(blade, doAntiAlias=True)
    c.drawCircle(420, LEAF_Y - 220, 520, P((236, 255, 160), 120 * glow * k, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
    for i in range(7):
        x = 640 - i * 90
        vp = skia.Path(); vp.moveTo(x, LEAF_Y + 2); vp.quadTo(x - 50, LEAF_Y - 30, x - 110, LEAF_Y - 70 + sw)
        c.drawPath(vp, SP(mix(col, (220, 255, 170), 0.45 * glow * k), 3))
        vp2 = skia.Path(); vp2.moveTo(x, LEAF_Y + 4); vp2.quadTo(x - 40, LEAF_Y + 24, x - 90, LEAF_Y + 40)
        c.drawPath(vp2, SP(mix(col, (220, 255, 170), 0.3 * glow * k), 3))
    c.restore()
    # main vein (midrib) along the underside, raised
    mid = skia.Path(); mid.moveTo(SX + 10, LEAF_Y); mid.lineTo(-40, LEAF_Y + 4)
    c.drawPath(mid, SP(mix((150, 190, 96), (40, 60, 40), 1 - k), 12))
    c.drawPath(mid, SP(mix((198, 226, 140), (40, 60, 40), 1 - k), 4))


def stem(c, t, k=1.0):
    p = skia.Path(); p.moveTo(SX, GY + 200); p.lineTo(SX + 2, LEAF_Y + 30); p.quadTo(SX + 6, LEAF_Y - 4, SX + 22, LEAF_Y - 8)
    p.lineTo(SX + 44, LEAF_Y - 2); p.lineTo(SX + 44, GY + 200); p.close()
    flat(c, p, mix((96, 140, 70), (30, 44, 30), 1 - k), mix((70, 108, 52), (24, 34, 24), 1 - k), sh_off=(-10, 0),
         rim=(230, 220, 150), rim_d=(3, 0), rim_a=170 * k)


def plant_world(c, t, day=1.0):
    k = day
    sky_haze(c, -400, 3200, k)
    if k > 0.3: light_shafts(c, t, 420, -300, 1.0 * k)
    trunks(c, t, -800, GY + 200, [60, 980], mix(TRUNK_FAR, (20, 30, 30), 1 - k), 140, 2)
    for i, (x, y, s) in enumerate([(120, GY, 1.6), (980, GY, 1.4), (300, 1800, 1.0), (1000, 1500, 0.9)]):
        fern(c, x, y, s, t, mix((70, 120, 84), (20, 30, 26), 1 - k), ph=i)
    floor(c, t, GY - 40, k=k)
    # the noon sun straight overhead, behind the leaf
    c.drawCircle(420, LEAF_Y - 520, 200, P((255, 250, 210), 150 * sun_a(t) * k, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(420, LEAF_Y - 520, 60, P((255, 252, 230), 230 * sun_a(t) * k))
    stem(c, t, k)
    leaf(c, t, glow=sun_a(t), k=k)


def sun_a(t):
    return 0.35 + 0.65 * smooth((t - T_NOON + 0.5) / 0.6) - 0.1 * smooth((t - T_DIES) / 0.8)


SPORES = [(_rs.uniform(0, 1), _rs.uniform(-1, 1), _rs.uniform(0.7, 1.3), _rs.uniform(0, 6.28)) for _ in range(70)]


def plant_shots(c, t):
    x, y, rot, travel = ant_path(t)
    # camera: follow up the stem, frame the leaf, then pull back down to the floor for the spores
    if t < CLIMB_T1:
        cy = y - 120; cx = 640; z = 1.25
    elif t < T_DIES:
        k = ease_io((t - CLIMB_T1) / 1.2)
        cy = lerp(LEAF_Y + 20, LEAF_Y + 40, k); cx = lerp(640, 520, k); z = lerp(1.25, 1.55, ease_io((t - T_NOON) / 4))
    elif t < T_RAIN:
        cy = LEAF_Y + 40; cx = 520; z = lerp(1.55, 1.35, ease_io((t - T_DIES) / (T_RAIN - T_DIES)))
    elif t < T_WINS - 0.4:
        k = ease_io((t - T_RAIN) / (T_WINS - 0.4 - T_RAIN))
        cy = lerp(LEAF_Y + 40, 1750, k); cx = lerp(520, 560, k); z = lerp(1.35, 0.62, k)
    else:
        k = ease_io((t - (T_WINS - 0.4)) / 1.6)
        cy = lerp(1750, LEAF_Y + 260, k); cx = lerp(560, 500, k); z = lerp(0.62, 1.15, k)
    # day/night cycles for "days later"
    day = 1.0
    if T_DIES < t < T_DAYS: day = 1 - 0.25 * smooth((t - T_DIES) / 0.8)
    elif T_DAYS <= t < T_STALK + 0.2:
        ph = (t - T_DAYS) / (T_STALK + 0.2 - T_DAYS)
        day = 0.75 - 0.55 * abs(math.sin(ph * 3 * math.pi))
    c.save()
    c.translate(540, 900); c.scale(z, z); c.translate(-cx, -cy)
    plant_world(c, t, day)
    # damp mist at "where the air suits the fungus"
    mist = smooth((t - T_AIR) / 0.6) * (1 - smooth((t - T_Q - 0.6) / 1.2))
    if mist > 0:
        for i in range(14):
            mx = (i * 97 + 30 * t) % 1300 - 150; my = y - 400 + (i * 61) % 700
            c.drawOval(skia.Rect(mx - 160, my - 40, mx + 160, my + 40), P((236, 248, 240), 50 * mist, MaskFilter=blur(30)))
    # ruler at "twenty five centimeters": a tape beside the stem from the ground up to the leaf
    rl = smooth((t - T_25 + 0.1) / 0.5) * (1 - smooth((t - T_Q + 0.8) / 0.4))
    still = t > CLIMB_T1 + TURN + (SX - 120 - BITE_X) / 180
    mand = 0.0; lock = 0.0
    if t > T_BITE - 0.6: mand = smooth((t - (T_BITE - 0.6)) / 0.35) * (1 - smooth((t - T_BITE) / 0.15))
    if t > T_BITE: lock = 1.0
    if T_BITE < t < T_JAW: mand = 0.25 * (0.5 + 0.5 * math.sin((t - T_BITE) * 9)) * (1 - smooth((t - T_JAW + 0.4) / 0.4))
    dead = smooth((t - T_DIES) / 0.6)
    stalk = smooth((t - T_STALK + 0.1) / 2.0)
    bx = x; by = y
    if t > T_BITE - 0.5:      # the head tips up to the vein and the jaws close on it; the body hangs below
        k = smooth((t - (T_BITE - 0.5)) / 0.5)
        rot = -180 + 40 * k
        a = math.radians(rot); mx, my = 224 * 0.95, -112 * 0.95
        tx, ty = BITE_X - 30 * (1 - k), LEAF_Y + 1
        wx = tx - (mx * math.cos(a) - my * math.sin(a)); wy = ty - (mx * math.sin(a) + my * math.cos(a))
        bx, by = lerp(x, wx, k), lerp(y, wy, k)
    A.ant(c, bx, by, 0.95, t, travel=travel, rot=rot, face=1, mand=mand, lock=lock, still=still, dead=dead,
          stalk=stalk, cut=0.0, light=0.9, shadow=False)
    if lock and t < T_LOCK + 1.2:       # the lock: a small ring at the jaws
        jx, jy = BITE_X, LEAF_Y + 6
        r = (t - T_LOCK + 0.2) * 120
        if 0 < r < 120: c.drawCircle(jx, jy, r, SP((255, 236, 150), 4, 220 * (1 - r / 120)))
    # spores falling from the swelling
    if t > T_RAIN - 0.2:
        sx, sy = A.stalk_spore_point(bx, by, 0.95, rot, 1)
        for (u, v, s, ph) in SPORES:
            age = (t - (T_RAIN - 0.2)) - u * 3.0
            if age <= 0: continue
            py = sy + age * 260 * s
            if py > GY - 30: continue
            px = sx + v * 60 + 40 * math.sin(age * 1.5 + ph) + age * 20 * v
            c.drawCircle(px, py, 3.2 * s, P((248, 244, 224), 210))
            c.drawCircle(px, py, 8 * s, P((248, 244, 224), 40, MaskFilter=blur(4)))
    # foragers on the forest floor below (the colony) in the wide shots
    if t > T_RAIN:
        for i in range(6):
            fx = (900 - 60 * (t - T_RAIN) - i * 210) % 1500 - 200
            A.ant(c, fx, GY - 34, 0.5, t, travel=60 * t / 0.5 + i * 33, face=-1, br_ph=i, light=0.7)
    c.restore()
    # ruler chip drawn in screen space beside the stem
    if rl > 0:
        sx_ = 540 + (SX + 70 - cx) * z
        f = skia.Font(kit.L.BLACK, 46)
        txt = 'about 25 cm up'
        w_ = f.measureText(txt)
        x0 = min(W - w_ - 70, max(40, sx_ + 20))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, 980, x0 + w_ + 44, 1050), 26, 26), P((8, 18, 24), 200 * rl))
        c.drawString(txt, x0 + 22, 1032, f, P(Y, 255 * rl))
        # tape marks along the stem below the chip
        for k_ in range(10):
            yy = 1060 + k_ * 34
            c.drawLine(sx_ + 6, yy, sx_ + (26 if k_ % 5 == 0 else 16), yy, SP(Y, 3, 220 * rl))
        c.drawLine(sx_ + 6, 1060, sx_ + 6, 1400, SP(Y, 3, 220 * rl))
    # the payoff chips: who gains, who pays
    pa = smooth((t - T_WINS + 0.1) / 0.3); pb = smooth((t - T_LOSES + 0.1) / 0.3)
    if pa > 0: kit.L.chip(c, '+ fungus', 330, 540, TL, size=56, a=pa)
    if pb > 0: kit.L.chip(c, '- ant', 760, 540, R, size=56, a=pb)
    # noon chip
    nn = smooth((t - T_NOON + 0.1) / 0.3) * (1 - smooth((t - T_BITE - 0.6) / 0.3))
    if nn > 0: kit.L.chip(c, '12:00 NOON', 540, 640, (255, 214, 90), size=56, a=nn)
    # near leaves out of focus while on the stem
    if t < CLIMB_T1 + 1.0:
        kit.blur_layer(c, 16)
        fern(c, -60, 2100, 3.0, t, FG2, ph=1)
        c.restore()


def scene(c, t):
    if t < T_NOW:
        shot_a(c, t)
    else:
        # settle after the zoom cut
        k = 1 - smooth((t - T_NOW) / 0.5)
        c.save(); c.translate(540, 960); c.scale(1 + 0.12 * k, 1 + 0.12 * k); c.translate(-540, -960)
        plant_shots(c, t)
        c.restore()


def lift(t):
    # eased lift while the light drops after death (no pop)
    return 1.0 + 0.12 * smooth((t - T_DIES) / 0.8) * (1 - smooth((t - T_STALK) / 0.8))


SHORT = kit.Short(WD, 'AP BIOLOGY', TITLES, scene, DUR, T_END, lift=lift, fix={'PARASITISM.': 'parasitism.', 'A': 'A', 'P': 'P'})

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1104/ant/stills')
