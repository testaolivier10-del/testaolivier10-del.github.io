"""w1104-02-sodium-lake (AP Chem, real moment from history). Premium standard, all code (skia); the workers are one
skinned body each (pipeline/people person.py, recoloured for 1940s winter work clothes).

Art plan and motion list (for the accuracy check):
- A (hook): Lake Lenore in January 1947: basalt coulee cliffs with snow, the lake frozen white with dark open water
  in cracks. A fireball is already erupting from the ice at frame zero, a white smoke column rising (sodium burns
  yellow orange; the smoke is white sodium hydroxide). A steel drum tumbles down the cliff on "sodium".
- B (leftovers): a winter rail yard: rows of rusty steel drums, one leaking a dark streak; a worker beside them; on
  "no one would ship it" the boxcar door slides shut.
- C (the dump): cliff top; two workers roll drums to the edge; the drums tumble down and land on the ice. On "shot
  holes" muzzle flashes and tracer lines from the cliff (no gun detail); the ice cracks under the drums and water
  seeps up; on "exploded" fireballs burst one after another, orange light on the cliffs, white smoke rising.
- D (why): a round lens opens from a burst drum (the lake keeps burning around it): a sodium atom with shells 2, 8, 1
  (nucleus, 11 electrons). On "ONE electron" the single outer electron glows; on "gives it up" it leaves; on "water
  grabs that electron" it lands on a water molecule; on "hydrogen gas" two H atoms pair into an H2 bubble and a heat
  glow spreads; on "the heat lights the hydrogen" the bubble ignites. The lens closes back onto the lake.
- E: the lake burning down to smoke; a lab jar with sodium pieces under oil on "stored under oil".
Sources: Lake Lenore (Wikipedia, newsreel of January 1947, grandcoulee.com, iafi.org: War Assets Administration and
the Army, drums onto the frozen lake, holes shot to puncture them); Na electron configuration 2,8,1 and low first
ionization energy (AP Chem CED 1.7 and 1.8); 2Na + 2H2O -> 2NaOH + H2, exothermic, the heat ignites the hydrogen."""
import sys, math
sys.path[:0] = ['/home/claude/w1104', '/home/claude/w1104/sodium']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, ease_io, Wt, Y, R, TL, W, H, OR
import person as PP, airman2 as A2
import crew as CR

WD = kit.Words('/home/claude/w1104/out/w1104-02-sodium-lake/words.json')
at = WD.at
T_SOD = at('sodium'); T_AM = at('america'); T_DRUMS = at('drums'); T_NO = at('no'); T_SO = at('so')
T_ROLL = at('rolled'); T_CLIFF = at('cliff'); T_FROZ = at('frozen'); T_SHOT = at('shot'); T_EXP = at('exploded')
T_WHY = at('why?') if False else WD.w[[x['w'] for x in WD.w].index('Why?')]['t0']
T_ONE = at('one', 2); T_GIVES = at('gives'); T_WATER = at('water', 2); T_GRABS = at('grabs'); T_H2 = at('hydrogen')
T_HEAT = at('heat', 2); T_LIGHTS = at('lights'); T_THAT = at("that's"); T_OIL = at('oil'); T_FREE = at('free')
T_END = WD.end() + 0.45
DUR = round(T_END + 1.6, 2)
T_B = T_AM - 0.15
T_C = T_SO - 0.1
T_D = T_WHY - 0.2
T_E = T_THAT - 0.25

TITLES = [
    (0.0, [[('SODIUM', Y), (' AND', Wt)], [('WATER', Wt), (', 1947', Y)]]),
    (T_B, [[('LEFTOVER', Wt)], [('WAR SODIUM', Y)]]),
    (T_NO - 0.1, [[('NO ONE', R), (' WOULD', Wt)], [('SHIP IT', Wt)]]),
    (T_C, [[('ONTO', Wt), (' LAKE LENORE', Y)]]),
    (T_EXP - 0.15, [[('THE LAKE', Wt)], [('EXPLODED', OR)]]),
    (T_D, [[('WHY?', Y)]]),
    (T_ONE - 0.2, [[('ONE', Y), (' OUTER', Wt)], [('ELECTRON', Wt)]]),
    (T_WATER - 0.1, [[('HYDROGEN', Y), (' + HEAT', OR)]]),
    (T_LIGHTS - 0.15, [[('HEAT LIGHTS', OR)], [('THE HYDROGEN', Y)]]),
    (T_E, [[('STORED', Wt), (' UNDER OIL', Y)]]),
    (T_FREE - 0.1, [[('FREE PRACTICE', TL)], [('LEVLPREP.COM', Wt)]]),
]

# ------------------------------------------------------------------ palette (winter coulee, January)
SKY0, SKY1 = (112, 132, 156), (178, 186, 196)
BAS, BAS_SH, BAS_HI = (110, 92, 82), (82, 68, 62), (150, 128, 112)
SNOW, SNOW_SH = (238, 242, 246), (200, 212, 226)
ICE, ICE_SH = (176, 196, 212), (132, 154, 176)
WATER = (50, 72, 84)
DRUM, DRUM_SH, DRUM_HI = (92, 98, 82), (62, 66, 56), (136, 142, 120)
RUST = (150, 80, 44)
_rs = np.random.default_rng(3)

WORKER = PP.Person(0.19, palette={A2.OL: (70, 62, 56), A2.OL_SH: (50, 44, 40), A2.OL_HI: (96, 86, 78), A2.CUFF: (70, 62, 56),
                   A2.BELT: (40, 32, 28), A2.BELT_SH: (30, 24, 20), A2.SKIN: (220, 170, 136), A2.SKIN_SH: (196, 148, 118),
                   (150, 120, 80): (70, 62, 56)})
WORKER2 = PP.Person(0.19, palette={A2.OL: (52, 60, 74), A2.OL_SH: (38, 44, 56), A2.OL_HI: (74, 84, 100), A2.CUFF: (52, 60, 74),
                    A2.SKIN: (200, 150, 116), A2.SKIN_SH: (176, 130, 100), (150, 120, 80): (52, 60, 74)})


WORKER3 = PP.Person(0.19, palette={A2.OL: (88, 80, 64), A2.OL_SH: (66, 60, 48), A2.OL_HI: (110, 100, 82), A2.CUFF: (88, 80, 64),
                    A2.SKIN: (214, 160, 124), A2.SKIN_SH: (190, 138, 106), (150, 120, 80): (88, 80, 64)})
WORKER3_BACK = PP.Person(0.172, palette={A2.OL: (82, 76, 62), A2.OL_SH: (62, 58, 48), A2.OL_HI: (102, 94, 78), A2.CUFF: (82, 76, 62),
                         A2.SKIN: (206, 156, 122), A2.SKIN_SH: (184, 136, 104), (150, 120, 80): (82, 76, 62)})
WORKER_B = PP.Person(0.34, palette={A2.OL: (52, 60, 74), A2.OL_SH: (38, 44, 56), A2.OL_HI: (74, 84, 100), A2.CUFF: (52, 60, 74),
                     A2.SKIN: (200, 150, 116), A2.SKIN_SH: (176, 130, 100), (150, 120, 80): (52, 60, 74)})


def man(c, who, x, ground, light=(0.75, -0.65), **kw):
    ps = A2.Pose(x=x, ground=ground, **kw)
    who.draw(c, ps, light=light)
    return ps


# ------------------------------------------------------------------ fire and smoke
def fireball(c, x, y, age, s=1.0, seed=0):
    """a burst on the ice: hot core, yellow orange puffs out of sync, then a white smoke column climbing"""
    if age < 0: return
    rs = np.random.default_rng(seed)
    grow = 1 - math.exp(-age * 4)
    fade = math.exp(-max(0, age - 0.6) * 1.1)
    # smoke column (white, swelling, drifting)
    for k in range(14):
        a0 = k * 0.12
        if age < a0: continue
        g = age - a0
        sx = x + rs.uniform(-30, 30) * s + 18 * g * s
        sy = y - (60 + 160 * g) * s
        r = (50 + 40 * g) * s * rs.uniform(0.8, 1.2)
        al = 210 * math.exp(-g * 0.35) * min(1, g * 3)
        c.drawCircle(sx, sy, r, P((236, 236, 232), al * 0.75, MaskFilter=blur(6 * s)))
        c.drawCircle(sx - r * 0.25, sy - r * 0.25, r * 0.55, P((252, 252, 250), al * 0.5, MaskFilter=blur(4 * s)))
    if fade < 0.02: return
    # flame puffs
    for k in range(9):
        ph = rs.uniform(0, 6.28)
        fx = x + rs.uniform(-70, 70) * s * grow
        fy = y - rs.uniform(10, 150) * s * grow
        r = rs.uniform(36, 70) * s * grow * (0.85 + 0.15 * math.sin(age * 14 + ph))
        c.drawCircle(fx, fy, r, P((255, 132, 40), 220 * fade))
        c.drawCircle(fx + 4, fy + 6, r * 0.66, P((255, 196, 70), 230 * fade))
        c.drawCircle(fx + 6, fy + 8, r * 0.34, P((255, 244, 190), 240 * fade))
    c.drawCircle(x, y - 60 * s, 260 * s * grow, P((255, 170, 70), 90 * fade, MaskFilter=blur(60 * s), BlendMode=skia.BlendMode.kScreen))
    # flying ice and water bits
    for k in range(10):
        ang = rs.uniform(-2.7, -0.4); v = rs.uniform(200, 420) * s
        px = x + math.cos(ang) * v * age; py = y + math.sin(ang) * v * age + 420 * age * age * s
        if py > y + 20: continue
        c.drawCircle(px, py, 4 * s, P((236, 246, 255), 200 * fade))


def glow_wash(c, a, col=(255, 150, 60)):
    if a > 0: c.drawRect(skia.Rect(0, 0, W, H), P(col, 60 * a, BlendMode=skia.BlendMode.kScreen))


# ------------------------------------------------------------------ the coulee and the lake
def coulee(c, t, light=0.0):
    lgrad(c, skia.Rect(-300, -400, 1400, 900), -200, 900, [SKY0, SKY1])
    # high thin clouds drifting
    for k in range(4):
        x = (k * 380 + 12 * t) % 1600 - 300
        c.drawOval(skia.Rect(x, 120 + k * 60, x + 420, 150 + k * 60), P((244, 246, 248), 120, MaskFilter=blur(10)))
    # far basalt walls with columns and snow ledges (haze)
    far = mix(BAS, SKY1, 0.45)
    c.drawPath(kit.ridge([(-300, 560), (60, 520), (300, 560), (520, 500), (820, 540), (1100, 500), (1400, 530)]), P(far))
    for k in range(40):
        x = -280 + k * 42
        c.drawLine(x, 560, x, 760, SP(mix(far, (0, 0, 0), 0.1), 3))
    for y_ in (600, 680):
        c.drawRect(skia.Rect(-300, y_, 1400, y_ + 10), P(mix(SNOW, far, 0.25)))
    c.drawPath(kit.ridge([(-300, 700), (400, 690), (1400, 710)]), P(mix(BAS, SKY1, 0.3)))
    # the frozen lake
    c.drawRect(skia.Rect(-300, 820, 1400, 2400), P(ICE))
    lgrad(c, skia.Rect(-300, 820, 1400, 1700), 820, 1700, [mix(ICE, SKY1, 0.4), ICE, ICE_SH])
    for k in range(9):        # cracks with dark open water
        x0 = 120 + k * 130; y0 = 900 + (k * 97) % 500
        p = skia.Path(); p.moveTo(x0, y0)
        for j in range(5): p.lineTo(x0 + j * 40 + 10 * math.sin(k + j), y0 + j * 14 + 6 * math.cos(k * j))
        c.drawPath(p, SP(WATER, 3, 160))
    # glare
    c.drawOval(skia.Rect(500, 940, 1100, 1000), P((255, 255, 255), 70, MaskFilter=blur(20)))
    if light > 0:     # the orange light of the fires on the ice and the far walls
        c.drawRect(skia.Rect(-300, 400, 1400, 2400), P((255, 140, 60), 50 * light, BlendMode=skia.BlendMode.kScreen))


def near_cliff(c, t, light=0.0):
    """the near cliff the drums go over (left), basalt with snow on top"""
    top = [(-300, 760), (120, 760), (380, 760), (432, 768), (440, 800)]
    face = [(440, 800), (466, 920), (500, 1040), (530, 1100), (-300, 1160)]
    p = kit.poly(top + face)
    flat(c, p, BAS, BAS_SH, sh_off=(14, 0), rim=BAS_HI, rim_d=(-3, 2), rim_a=220)
    for k in range(12):
        x = 20 + k * 36
        c.drawLine(x, 800, x + 24, 1120, SP(BAS_SH, 4, 160))
    c.drawPath(kit.poly([(-300, 744), (120, 744), (380, 746), (436, 756), (432, 768), (380, 760), (120, 760), (-300, 760)]), P(SNOW))
    c.drawPath(kit.poly([(-300, 760), (380, 760), (432, 768), (440, 800), (-300, 790)]), P(SNOW_SH))
    if light > 0: c.drawPath(p, P((255, 150, 60), 60 * light, BlendMode=skia.BlendMode.kScreen))


def drum(c, x, y, ang, s=1.0, holes=0.0, seed=0):
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    body = skia.Path(); body.addRoundRect(skia.Rect(-34, -46, 34, 46), 8, 8)
    flat(c, body, DRUM, DRUM_SH, sh_off=(9, 0), rim=DRUM_HI, rim_d=(-3, 0), rim_a=220)
    for yy in (-18, 18): c.drawLine(-34, yy, 34, yy, SP(DRUM_SH, 4))
    c.drawLine(-12, -46, -12, 30, SP(RUST, 5, 140))
    if holes > 0:
        rs = np.random.default_rng(seed)
        for k in range(int(4 * holes)):
            c.drawCircle(rs.uniform(-24, 24), rs.uniform(-36, 36), 4, P((24, 20, 18)))
    c.restore()


def drum_fall(t, t0, x0, y0, x1, y1):
    """a drum rolling to the edge and tumbling down the cliff onto the ice: position and angle"""
    u = t - t0
    if u < 0: return x0, y0, 0, False
    if u < 0.5:
        return x0 + 80 * u / 0.5, y0, 300 * u, False
    g = u - 0.5
    x = x0 + 80 + 140 * g
    y = y0 + 900 * g * g
    if y >= y1: return min(x, x1 + 30), y1, 300 * 0.5 + 400 * 0.9, True
    return x, y, 150 + 400 * g, False


DRUMS = [(T_ROLL - 0.2, 600, 1090, 1), (T_ROLL + 0.6, 700, 1130, 2), (T_ROLL + 1.3, 820, 1080, 3), (T_ROLL + 2.0, 930, 1140, 4)]


# the drum schedule in shot C: drums 0 and 1 were pushed before the shot and already lie on the ice; worker A walks
# drum 2 to the edge, worker B walks drum 3 behind him
# (worker B walks his drum in a lane just behind worker A's, so both are seen at once)
SCHED_T = [T_C - 4.0, T_C - 3.2, T_ROLL - 0.4, T_ROLL + 0.7]
LANE = [(760, CR.DS), (760, CR.DS), (760, CR.DS), (750, CR.DS * 0.92)]
SCHED = [lambda t, i=i: CR.drum_state(t, SCHED_T[i], (260, 260, 280, 190)[i], DRUMS[i][1], DRUMS[i][2], ground=LANE[i][0], ds=LANE[i][1]) for i in range(4)]


# ------------------------------------------------------------------ shots
def shot_a(c, t):
    u = t / T_B
    c.save(); kit.push(c, ease_io(u), 540, 960, 1.3, 1.42, 560, 820, 600, 840)
    burst = 1 - math.exp(-t * 2)
    coulee(c, t, light=0.6 * burst)
    near_cliff(c, t, 0.3 * burst)
    fireball(c, 740, 1090, t + 0.35, 1.6, seed=1)
    fireball(c, 900, 1090, t - 1.6, 1.1, seed=2)
    st = CR.drum_state(t, T_SOD - 0.9 - (CR.EDGE - 270) / CR.SPEED, 270, 640, 1110)
    CR.pusher(c, WORKER, t, st)
    drum(c, st['cx'], st['cy'], st['ang'], CR.DS)
    c.restore()
    glow_wash(c, 0.35 * burst * (0.8 + 0.2 * math.sin(t * 9)))


def shot_b(c, t):
    """a winter rail yard: drums of leftover sodium, one leaking; the boxcar door slides shut"""
    u = (t - T_B) / (T_C - T_B)
    c.save(); kit.push(c, ease_io(u), 540, 960, 1.05, 1.18, 540, 1000, 480, 1080)
    lgrad(c, skia.Rect(-300, -300, 1400, 1000), -300, 1000, [(150, 166, 182), (206, 210, 210)])
    # snowfall
    for k in range(60):
        sx = (k * 71 + 20 * math.sin(t + k)) % 1300 - 100; sy = ((k * 53) + 90 * t) % 2000 - 100
        c.drawCircle(sx, sy, 3 + k % 3, P((250, 252, 255), 200))
    # boxcar (right)
    car = skia.Rect(620, 560, 1300, 1060)
    flat(c, skia.Path().addRect(car), (120, 60, 44), (92, 44, 32), sh_off=(0, 14), rim=(170, 96, 70), rim_d=(0, -3), rim_a=200)
    for k in range(9): c.drawLine(640 + k * 76, 570, 640 + k * 76, 1050, SP((96, 48, 36), 4))
    door = smooth((t - T_NO + 0.1) / 0.6)
    dx = lerp(1060, 760, door)
    c.drawRect(skia.Rect(760, 640, 1060, 1040), P((30, 20, 18)))
    c.drawRect(skia.Rect(dx, 630, dx + 300, 1046), P((136, 70, 52)))
    c.drawLine(dx + 20, 640, dx + 20, 1040, SP((96, 48, 36), 6))
    for wx in (700, 1220):
        c.drawCircle(wx, 1100, 56, P((40, 36, 34))); c.drawCircle(wx, 1100, 22, P((80, 74, 70)))
    # ground with snow
    c.drawRect(skia.Rect(-300, 1120, 1400, 2400), P((214, 220, 226)))
    c.drawRect(skia.Rect(-300, 1150, 1400, 1166), P((96, 86, 78)))
    # far hills and telegraph poles
    c.drawPath(kit.ridge([(-300, 900), (200, 820), (600, 870), (1000, 800), (1400, 860)]), P((168, 176, 186)))
    for k in range(5):
        px = -40 + k * 300
        c.drawLine(px, 1120, px, 760, SP((80, 70, 62), 8)); c.drawLine(px - 40, 790, px + 40, 790, SP((80, 70, 62), 6))
    c.drawLine(-300, 790, 1400, 800, SP((60, 54, 50), 2, 160))
    # stacked drums, one leaking (dark streak, a wisp where the sodium meets the damp air)
    for row in range(3):
        for k in range(5 - row):
            x = 60 + k * 100 + row * 50; y = 1080 - row * 92
            drum(c, x, y, 0, 1.0, seed=k)
    lk = smooth((t - T_DRUMS + 0.3) / 0.5)
    c.drawPath(smooth_closed([(260, 1080), (272, 1084), (276, 1130), (262, 1132)]), P((60, 46, 40), 220 * lk))
    for k in range(5):
        g = (t * 0.6 + k * 0.2) % 1
        c.drawCircle(266 + 16 * math.sin(g * 6 + k), 1066 - 120 * g, 10 + 18 * g, P((236, 236, 236), 120 * (1 - g) * lk, MaskFilter=blur(6)))
    man(c, WORKER_B, 560, 1150, face=-1, uarm_n=6, elbow_n=18, uarm_f=4, elbow_f=16, lean=3, neck=-8, br=0.5 + 0.5 * math.sin(t * 2))
    c.restore()


def shot_c(c, t):
    """cliff top and the lake: drums over the edge, holes shot in them, the ice cracks and the lake explodes"""
    u = (t - T_C) / (T_D - T_C)
    c.save()
    sh = max(0.0, 1 - (t - T_EXP) / 0.6) if t > T_EXP else 0.0      # camera shake on the blast
    c.translate(14 * sh * math.sin(t * 90), 10 * sh * math.cos(t * 77))
    kit.push(c, ease_io(u), 540, 960, 1.32, 1.4, 430, 830, 520, 880)
    lit = smooth((t - T_EXP + 0.2) / 0.3)
    coulee(c, t, light=0.7 * lit)
    sts = []
    for i, (t0, x1, y1, sd) in enumerate(DRUMS):
        st = SCHED[i](t)
        sts.append(st)
        x, y, a, landed = st['cx'], st['cy'], st['ang'], st['ph'] == 'landed'
        hole = smooth((t - T_SHOT - 0.1 * i) / 0.4)
        if landed:
            ice = smooth((t - T_SHOT - 0.3 - 0.1 * i) / 0.8)
            c.drawOval(skia.Rect(x - 70 * ice, y + 30, x + 70 * ice, y + 50), P(WATER, 200 * ice))
            for k in range(6):
                ang = k * 1.05 + sd
                c.drawLine(x, y + 40, x + math.cos(ang) * 110 * ice, y + 40 + math.sin(ang) * 40 * ice, SP(WATER, 3, 200 * ice))
        if not (t > T_EXP + 0.3 * i + 0.2) and st['ph'] in ('landed', 'fall', 'tip'):
            drum(c, x, y, a, st['ds'], holes=hole, seed=sd)
        fireball(c, x1 + 10, y1 + 30, t - (T_EXP - 0.05 + 0.35 * i), 1.5 + 0.15 * i, seed=10 + i)
    fireball(c, 760, 1110, t - (T_EXP - 0.1), 2.6, seed=31)
    near_cliff(c, t, 0.4 * lit)
    # the crew: the rifleman at the back, then each pusher with his hands on his drum (drawn behind the drum)
    aim = smooth((t - T_SHOT + 0.6) / 0.4)
    muzzle = CR.rifleman(c, WORKER3_BACK, 330, t, aim=aim, ground=736)
    for i, who, rx in ((3, WORKER2, 230), (2, WORKER, 160)):       # back lane first
        st = sts[i]
        CR.pusher(c, who, t, st, retreat_x=rx)
        if st['ph'] in ('wait', 'push'):
            drum(c, st['cx'], st['cy'], st['ang'], st['ds'], seed=DRUMS[i][3])
    mx, my = muzzle
    if T_SHOT - 0.1 < t < T_EXP:
        for k in range(8):
            ft = T_SHOT + k * 0.16
            if ft <= t < ft + 0.08:
                c.drawCircle(mx, my, 10, P((255, 236, 170), 250))
                c.drawCircle(mx, my, 24, P((255, 200, 100), 90, MaskFilter=blur(10)))
            if ft <= t < ft + 0.14:
                tx = DRUMS[k % 4][1]; ty = DRUMS[k % 4][2]
                kk = (t - ft) / 0.14
                c.drawLine(lerp(mx, tx, kk * 0.8), lerp(my, ty, kk * 0.8), lerp(mx, tx, kk), lerp(my, ty, kk), SP((255, 236, 170), 5, 230))
            if ft + 0.14 <= t < ft + 0.6:
                tx = DRUMS[k % 4][1]; ty = DRUMS[k % 4][2]; g = (t - ft - 0.14) / 0.46
                c.drawCircle(tx + 10, ty - 10 - 40 * g, 16 + 30 * g, P((240, 240, 236), 200 * (1 - g), MaskFilter=blur(6)))
    c.restore()
    glow_wash(c, 0.4 * lit * (0.75 + 0.25 * math.sin(t * 11)))
    fl = max(0.0, 1 - abs(t - T_EXP) / 0.18)
    if fl > 0: c.drawRect(skia.Rect(0, 0, W, H), P((255, 246, 220), 200 * fl))


# ------------------------------------------------------------------ the lens: the atom
NA_C = (540, 960)


def electron(c, x, y, r=11, a=255, glow=0.0):
    if glow > 0: c.drawCircle(x, y, r * 3.2, P((120, 220, 255), 120 * glow * a / 255, MaskFilter=blur(10)))
    c.drawCircle(x, y, r, P((90, 190, 255), a)); c.drawCircle(x - 3, y - 3, r * 0.45, P((210, 240, 255), a))


def water_mol(c, x, y, s=1.0, ang=0.0, a=255):
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    for hx in (-46, 46):
        c.drawCircle(hx, 34, 26, P((236, 240, 244), a)); c.drawCircle(hx - 6, 28, 9, P((255, 255, 255), a))
    c.drawCircle(0, 0, 40, P((222, 70, 70), a)); c.drawCircle(-10, -10, 14, P((255, 140, 130), a))
    c.restore()


def atom_scene(c, t):
    lgrad(c, skia.Rect(0, 0, W, H), 300, 1600, [(20, 30, 56), (34, 48, 84)])
    for k in range(30):     # water all around (blue haze) with drifting molecules
        x = (k * 131 + 10 * t) % 1200 - 60; y = (k * 211) % 1500 + 200
        c.drawCircle(x, y, 3, P((140, 180, 230), 90))
    give = smooth((t - T_GIVES - 0.1) / 0.7)
    grab = smooth((t - T_GRABS + 0.1) / 0.5)
    h2 = smooth((t - T_H2 + 0.2) / 0.6)
    ign = smooth((t - T_LIGHTS) / 0.4)
    cx, cy = 400, 900
    # nucleus and shells (2, 8, 1)
    c.drawCircle(cx, cy, 70, P((90, 110, 200), 120, MaskFilter=blur(20)))
    c.drawCircle(cx, cy, 48, P((236, 176, 70))); c.drawCircle(cx - 12, cy - 12, 16, P((255, 222, 150)))
    f = skia.Font(kit.L.BLACK, 40); c.drawString('Na' + ('+' if give > 0.6 else ''), cx - 30 - 8 * (give > 0.6), cy + 14, f, P((60, 40, 20)))
    for r, n in ((100, 2), (170, 8)):
        c.drawCircle(cx, cy, r, SP((150, 180, 240), 3, 150))
        for k in range(n):
            a = k / n * 2 * math.pi + t * (1.2 if r == 100 else 0.7)
            electron(c, cx + r * math.cos(a), cy + r * math.sin(a), 10)
    c.drawCircle(cx, cy, 250, SP((150, 180, 240), 3, 150 * (1 - give)))
    # the one outer electron
    a = t * 0.5
    ox, oy = cx + 250 * math.cos(a), cy + 250 * math.sin(a)
    wx, wy = 820, 760 + 20 * math.sin(t * 1.3)
    glow = smooth((t - T_ONE + 0.1) / 0.3)
    ex, ey = lerp(ox, wx - 30, give), lerp(oy, wy + 10, give)
    # water molecule that takes it
    if h2 < 0.4: water_mol(c, wx, wy, 1.0, -15)
    else:      # one hydrogen has left: hydroxide stays behind
        c.save(); c.translate(wx, wy); c.rotate(-15)
        c.drawCircle(-46, 34, 26, P((236, 240, 244))); c.drawCircle(0, 0, 40, P((222, 70, 70))); c.restore()
        f3 = skia.Font(kit.L.BLACK, 36); c.drawString('OH-', wx - 40, wy + 100, f3, P((255, 180, 170), 255 * smooth((h2 - 0.4) / 0.3)))
    water_mol(c, 840, 1200, 0.9, 30, a=200)
    if h2 < 1: electron(c, ex, ey, 12, 255 * (1 - h2), glow)
    # hydrogen gas forming: an H2 bubble rising, heat glow
    if h2 > 0:
        bx, by = 900 + 30 * h2, 700 - 60 * h2 + 160 * (1 - h2)
        r = 70 * h2
        c.drawCircle(bx, by, r, P((200, 230, 255), 70)); c.drawCircle(bx, by, r, SP((230, 245, 255), 3, 200))
        for hx in (-18, 18): c.drawCircle(bx + hx * h2, by, 18 * h2, P((240, 244, 250)))
        f2 = skia.Font(kit.L.BLACK, 34)
        if h2 > 0.6: c.drawString('H2', bx - 20, by + r + 40, f2, P((230, 240, 255), 255 * (h2 - 0.6) / 0.4))
        heat = smooth((t - at('heat') + 0.1) / 0.4)
        c.drawCircle(820, 900, 380 * heat, P((255, 140, 50), 70 * heat, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))
        if ign > 0:
            fireball(c, bx, by + 40, (t - T_LIGHTS) * 1.2, 1.4, seed=21)
    # labels on the word
    if glow > 0 and give < 0.3:
        kit.L.chip(c, '1 outer electron', ox, oy - 70, Y, size=44, a=glow * (1 - give / 0.3))
    if grab > 0 and h2 < 0.8:
        kit.L.chip(c, 'water takes it', wx, wy - 110, TL, size=44, a=grab * (1 - h2))


def shot_d(c, t):
    """the lens opens from a burst drum on the ice; the lake keeps burning around it"""
    open_ = smooth((t - T_D) / 0.6) * (1 - smooth((t - (T_E - 0.55)) / 0.5))
    shot_c_still(c, t)
    if open_ <= 0: return
    r = 560 * open_
    path = skia.Path(); path.addCircle(540, 900, r)
    c.save(); c.clipPath(path, doAntiAlias=True)
    c.translate(540, 900); s = 0.6 + 0.4 * open_; c.scale(s, s); c.translate(-540, -900)
    atom_scene(c, t)
    c.restore()
    c.drawCircle(540, 900, r, SP((255, 210, 120), 6, 230))


def burning_lake(c, t, dark=0.0, z=1.4):
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-520, -880)
    coulee(c, t, light=0.7)
    for i, (t0, x1, y1, sd) in enumerate(DRUMS):
        a0 = T_D - (T_EXP - 0.05 + 0.35 * i)
        fireball(c, x1 + 10, y1 + 30, min(a0 + (t - T_D) * 0.25, 2.2 + 0.2 * i), 1.5 + 0.15 * i, seed=10 + i)
    fireball(c, 760, 1110, min((T_D - (T_EXP - 0.1)) + (t - T_D) * 0.25, 2.4), 2.6, seed=31)
    near_cliff(c, t, 0.4)
    CR.rifleman(c, WORKER3_BACK, 330, t, aim=1.0 - smooth((t - T_D) / 1.0), ground=736)
    for i, who, rx in ((3, WORKER2, 230), (2, WORKER, 160)):
        CR.pusher(c, who, t, SCHED[i](t), retreat_x=rx)
    c.restore()
    glow_wash(c, 0.4 * (0.75 + 0.25 * math.sin(t * 11)))
    if dark > 0: c.drawRect(skia.Rect(0, 0, W, H), P((10, 14, 24), 110 * dark))


def shot_c_still(c, t):
    open_ = smooth((t - T_D) / 0.6) * (1 - smooth((t - (T_E - 0.55)) / 0.5))
    burning_lake(c, t, dark=max(open_, 0.55 * smooth((t - T_THAT + 0.45) / 0.45)))


def jar(c, x, y, a):
    c.save(); c.translate(x, y)
    body = skia.Path(); body.addRoundRect(skia.Rect(-110, -150, 110, 150), 30, 30)
    c.drawPath(body, P((214, 234, 240), 120 * a))
    c.drawRect(skia.Rect(-100, -60, 100, 140), P((236, 206, 110), 150 * a))      # the oil
    for k, (px, py, r) in enumerate([(-40, 90, 34), (30, 100, 30), (-5, 50, 26)]):
        c.drawPath(smooth_closed([(px - r, py), (px - r * 0.6, py - r * 0.8), (px + r, py - r * 0.6), (px + r * 0.8, py + r * 0.5)]), P((200, 200, 196), 255 * a))
    c.drawRect(skia.Rect(-120, -180, 120, -140), P((70, 60, 56), 255 * a))
    c.drawPath(body, SP((240, 250, 255), 4, 200 * a))
    c.restore()
    f = skia.Font(kit.L.BLACK, 40)
    for txt, yy, col in (('sodium', y + 60, Wt), ('oil', y - 20, Y)):
        pass


def shot_e(c, t):
    u = (t - T_E) / (DUR - T_E)
    burning_lake(c, t, z=1.4 + 0.08 * ease_io(u), dark=0.55 * smooth((t - T_THAT + 0.45) / 0.45))
    ja = smooth((t - T_THAT + 0.45) / 0.45)
    if ja > 0:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(200, 640, 880, 1340), 40, 40), P((14, 20, 34), 235 * ja))
        c.drawRect(skia.Rect(200, 1230, 880, 1250), P((90, 96, 110), 255 * ja))
        c.save(); c.translate(540, 1000); c.scale(1.4, 1.4); c.translate(-540, -1000); jar(c, 540, 975, ja); c.restore()
        kit.L.chip(c, 'sodium under oil', 540, 1300, Y, size=52, a=ja)


def scene(c, t):
    if t < T_B: shot_a(c, t)
    elif t < T_C: shot_b(c, t)
    elif t < T_D: shot_c(c, t)
    elif t < T_E: shot_d(c, t)
    else: shot_e(c, t)


SHORT = kit.Short(WD, 'AP CHEMISTRY', TITLES, scene, DUR, T_END, cuts=(T_B, T_C))

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1104/sodium/stills')
