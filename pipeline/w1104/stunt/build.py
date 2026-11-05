"""w1104-03-stunt-airbag (AP Physics 1, X vs Y showdown: concrete vs airbag). Premium standard, all code (skia); the
stuntman and the crew are one skinned body each (pipeline/people person.py, recoloured). Poll post (prediction): the
upper left sky stays clear for the sticker for the first 8 s.

Art plan and motion list (for the accuracy check):
- A, night film set: an eight storey brick building lit by film lights, the stuntman in a black stunt suit at the roof
  edge (right side of frame), wind in the light. On "stunt airbag" the camera tilts down the eight floors (floor
  numbers pass) to the red airbag on the street with the crew; on "He'll hit it" he steps off and falls on his back
  in real free fall from about 24 m (about 2.2 s; g = 9.8 m/s^2, drawn at 92 px per metre); the camera tracks him; a
  speed chip counts up to about 48 mph as v = g t. He lands on his back in the bag; it sinks and air puffs from the
  vents on its sides.
- B, the showdown: two panels with the same fall speed arrow: concrete on the left (a ghost, labelled what would
  happen: he stops in a split second, a huge red force arrow), the airbag on the right (it sinks and vents, the stop
  takes much longer, a small force arrow). Below, a force vs time graph: a tall narrow spike (concrete) and a low
  wide hump (airbag) drawn with EQUAL areas; on "impulse" the two areas fill and a chip says same area = same change
  in momentum. No bounce is shown (vented bags are built to minimise rebound).
- C: back on the set, he rolls off the bag and stands; the crew's fan blows the bag back up for the next take.
Physics: free fall v = sqrt(2 g h) = about 21.7 m/s (48.5 mph) from 24 m, a little less with drag; impulse
J = F_avg * dt = dp (AP Physics 1, momentum unit); vented stunt bags (Actsafe air bag bulletin)."""
import sys, math
sys.path[:0] = ['/home/claude/w1104', '/home/claude/w1104/stunt']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, ease_io, Wt, Y, R, TL, W, H, OR
import person as PP, airman2 as A2

WD = kit.Words('/home/claude/w1104/out/w1104-03-stunt-airbag/words.json')
at = WD.at
T_BAG = at('stunt'); T_EIGHT = at('eight'); T_HIT = at("he'll"); T_HOUR = at('hour'); T_SO = at('so')
T_EITHER = at('either'); T_CON = at('concrete'); T_HUGE = at('huge'); T_BUT = at('but'); T_SINKS = at('sinks')
T_STOP = at('stop'); T_AVG = at('average'); T_IMP = at('impulse'); T_SAME = at('same'); T_SPREAD = at('spread')
T_THEN = at('then'); T_CREW = at('crew')
T_END = WD.end() + 0.45
DUR = round(T_END + 1.6, 2)

# world (shot A): street at y 3000, roof at 3000 - 8 floors of 275 px = 800; 92 px per metre (24 m = 2200 px)
STREET, ROOF = 3000, 800
EDGE_X = 690
PXM = 2200 / 24.0
G = 9.8 * PXM
T_STEP = T_HIT + 0.05
T_FALL = math.sqrt(2 * (2830 - ROOF) / G)
T_LAND = T_STEP + T_FALL
BAG_X0, BAG_X1, BAG_TOP = 470, 1060, 2790
T_B = T_EITHER - 0.15
T_C = T_THEN - 0.2

TITLES = [
    (0.0, [[('STUNT AIRBAG', Y)], [('8 STORIES DOWN', Wt)]]),
    (T_HIT - 0.05, [[('ABOUT', Wt), (' 50 MPH', Y)]]),
    (T_SO - 0.1, [[('HOW DOES AIR', Wt)], [('SAVE HIM?', Y)]]),
    (T_B, [[('SAME SPEED', Wt)], [('TO LOSE', Y)]]),
    (T_CON - 0.1, [[('CONCRETE', R), (':', Wt)], [('HUGE FORCE', R)]]),
    (T_BUT - 0.1, [[('AIRBAG', TL), (':', Wt)], [('LONGER STOP', TL)]]),
    (T_AVG - 0.1, [[('MUCH', Wt), (' SMALLER FORCE', TL)]]),
    (at('in') if False else T_IMP - 1.9, [[('IMPULSE', Y)], [('F', Wt), (' × ', Y), ('TIME', Wt)]]),
    (T_C, [[('NEXT TAKE', Wt)]]),
]

STUNT = PP.Person(0.33, palette={A2.OL: (40, 40, 46), A2.OL_SH: (26, 26, 30), A2.OL_HI: (70, 70, 80), A2.CUFF: (40, 40, 46),
                  A2.BELT: (24, 24, 28), A2.BELT_SH: (18, 18, 20), A2.BOOT_C: (30, 30, 34), A2.BOOT_SH: (20, 20, 24), A2.SOLE: (14, 14, 16),
                  A2.SKIN: (198, 140, 104), A2.SKIN_SH: (170, 116, 86), A2.HAIR: (36, 28, 24), (150, 120, 80): (40, 40, 46)}, cap=False)
CREW1 = PP.Person(0.3, palette={A2.OL: (60, 74, 96), A2.OL_SH: (44, 54, 72), A2.OL_HI: (84, 100, 124), A2.CUFF: (60, 74, 96),
                  A2.SKIN: (230, 182, 146), A2.SKIN_SH: (206, 158, 124), (150, 120, 80): (60, 74, 96)})
CREW2 = PP.Person(0.3, palette={A2.OL: (96, 70, 56), A2.OL_SH: (72, 52, 42), A2.OL_HI: (120, 92, 74), A2.CUFF: (96, 70, 56),
                  A2.SKIN: (150, 100, 74), A2.SKIN_SH: (124, 82, 60), (150, 120, 80): (96, 70, 56)})


def man(c, who, x, ground, light=(0.75, -0.65), **kw):
    ps = A2.Pose(x=x, ground=ground, **kw)
    who.draw(c, ps, light=light)
    return ps


def man_rot(c, who, x, y, ang, s=1.0, **kw):
    """a posed person rotated about his hip (for the fall and lying in the bag)"""
    ps = A2.Pose(x=0, ground=0, **kw)
    J = who.joints(ps)
    hx, hy = J['hip'][0] * who.k, J['hip'][1] * who.k
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s); c.translate(-hx, -hy)
    who.draw(c, ps, light=(0.6, -0.8), shadow=False)
    c.restore()


# ------------------------------------------------------------------ the set
SKY0, SKY1 = (16, 22, 44), (40, 46, 78)
BRICK, BRICK_SH = (120, 64, 52), (92, 46, 38)
_rs = np.random.default_rng(9)
WINDOWS = [(f, k, _rs.uniform()) for f in range(8) for k in range(3)]
STARS = [(_rs.uniform(-300, 1400), _rs.uniform(-200, 2600), _rs.uniform(0.5, 1.5)) for _ in range(80)]


def night(c, t):
    lgrad(c, skia.Rect(-600, -600, 1800, 3400), -600, 3400, [SKY0, SKY1, (60, 56, 86)])
    for (x, y, s) in STARS:
        c.drawCircle(x, y, 1.6 * s, P((230, 236, 255), 140 + 80 * math.sin(t * s * 2 + x)))
    # far skyline with lit windows (haze)
    for k in range(9):
        x0 = -300 + k * 190; hgt = 900 + (k * 377) % 900
        c.drawRect(skia.Rect(x0, STREET - hgt, x0 + 170, STREET), P((44, 46, 74)))
        for j in range(int(hgt / 90)):
            if (j * 7 + k) % 3 == 0:
                c.drawRect(skia.Rect(x0 + 30, STREET - hgt + 40 + j * 90, x0 + 60, STREET - hgt + 70 + j * 90), P((240, 210, 140), 120))


def building(c, t):
    x0, x1 = EDGE_X, 1500
    p = skia.Path(); p.addRect(skia.Rect(x0, ROOF, x1, STREET))
    flat(c, p, BRICK, BRICK_SH, sh_off=(30, 0), rim=(255, 196, 140), rim_d=(-4, 0), rim_a=200)
    for y in range(ROOF + 40, STREET, 34):
        c.drawLine(x0, y, x1, y, SP(BRICK_SH, 2, 120))
    for (f, k, r) in WINDOWS:
        wy = ROOF + 60 + f * 275; wx = x0 + 60 + k * 170
        lit = r > 0.4
        c.drawRect(skia.Rect(wx, wy, wx + 110, wy + 150), P((250, 214, 150) if lit else (36, 40, 60)))
        c.drawRect(skia.Rect(wx, wy + 150, wx + 120, wy + 162), P((160, 100, 80)))
    # roof ledge
    c.drawRect(skia.Rect(x0 - 20, ROOF - 24, x1, ROOF + 6), P((150, 90, 72)))
    c.drawRect(skia.Rect(x0 - 20, ROOF - 24, x1, ROOF - 18), P((210, 150, 120)))
    # floor numbers down the edge (passing on the tilt)
    f = skia.Font(kit.L.BLACK, 48)
    for k in range(8):
        y = ROOF + 150 + k * 275
        c.drawString(str(8 - k), x0 - 70, y, f, P((255, 220, 120), 150))
    c.drawRect(skia.Rect(-600, STREET, 1800, STREET + 900), P((40, 40, 52)))
    c.drawRect(skia.Rect(-600, STREET, 1800, STREET + 10), P((96, 96, 110)))


def film_lights(c, t, y=STREET):
    for (lx, ang) in ((140, -58), (1300, -122)):
        c.drawLine(lx, y, lx, y - 380, SP((60, 60, 66), 10))
        c.drawRect(skia.Rect(lx - 40, y - 440, lx + 40, y - 370), P((70, 70, 78)))
        a = math.radians(ang)
        p = skia.Path(); p.moveTo(lx, y - 400)
        for d in (-0.16, 0.16): p.lineTo(lx + 2600 * math.cos(a + d), y - 400 + 2600 * math.sin(a + d))
        p.close()
        fl = 0.9 + 0.1 * math.sin(t * 7 + lx)
        c.drawPath(p, P((255, 236, 200), 28 * fl, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
        c.drawPath(p, P((255, 236, 200), 12 * fl, BlendMode=skia.BlendMode.kPlus))


def airbag(c, x0, x1, top, t, squash=0.0, vent=0.0, dent_x=None):
    """red stunt bag: a soft box with a blue top pad; squash sinks the top (around dent_x); vents puff air out the sides"""
    h = STREET - top
    sink = 140 * squash
    dx = dent_x if dent_x is not None else (x0 + x1) / 2
    p = skia.Path(); p.moveTo(x0, STREET); p.lineTo(x0 - 8 * squash, top + 30)
    p.cubicTo(x0, top, dx - 200, top, dx - 120, top + sink)
    p.cubicTo(dx - 40, top + sink * 1.1, dx + 40, top + sink * 1.1, dx + 120, top + sink)
    p.cubicTo(x1 - 40, top, x1, top, x1 + 8 * squash, top + 30); p.lineTo(x1, STREET); p.close()
    flat(c, p, (204, 52, 48), (156, 34, 34), sh_off=(0, 26), rim=(255, 150, 120), rim_d=(0, -4), rim_a=220)
    for k in range(1, 5):
        xx = x0 + (x1 - x0) * k / 5
        c.drawLine(xx, top + 60 + sink * 0.5 * (1 - abs(xx - dx) / 400), xx, STREET - 10, SP((150, 30, 30), 4, 160))
    pass
    # vents and the puffs of air
    for vx in (x0 + 20, x1 - 20):
        c.drawRect(skia.Rect(vx - 26, STREET - 160, vx + 26, STREET - 110), P((80, 20, 20)))
        if vent > 0:
            sgn = -1 if vx < dx else 1
            for k in range(6):
                g = (vent * 1.2 + k * 0.17) % 1
                c.drawCircle(vx + sgn * (30 + 220 * g), STREET - 135 - 40 * g, 20 + 40 * g, P((236, 240, 255), 110 * (1 - g) * min(1, vent * 3), MaskFilter=blur(8)))


def crew_on_set(c, t, wave=0.0):
    man(c, CREW1, 320, STREET, face=1, uarm_n=30 + 60 * wave, elbow_n=40)
    man(c, CREW2, 1180, STREET, face=-1, uarm_n=20, elbow_n=70, lean=4)


def fall_y(t):
    if t < T_STEP: return ROOF - 4
    u = t - T_STEP
    return min(2830, ROOF - 4 + 0.5 * G * u * u)


def speed_mph(t):
    if t < T_STEP: return 0.0
    u = min(t - T_STEP, T_FALL)
    return 9.8 * u * 2.237


def shot_a(c, t):
    # camera: on the stuntman, a tilt down the floors to the bag, a fast tilt back up, then tracking the fall
    if t < T_BAG:
        k = ease_io(t / T_BAG); cy = lerp(700, 760, k); z = lerp(1.0, 1.2, k); cx = lerp(560, 640, k)
    elif t < T_EIGHT + 0.9:
        k = ease_io((t - T_BAG) / (T_EIGHT + 0.9 - T_BAG)); cy = lerp(730, 2560, k); z = lerp(1.15, 0.95, k); cx = 640
    elif t < T_STEP - 0.05:
        k = ((t - (T_EIGHT + 0.9)) / (T_STEP - 0.05 - (T_EIGHT + 0.9))); k = ease_io(k)
        cy = lerp(2560, 730, k); z = lerp(0.95, 1.15, k); cx = 640
    else:
        cy = max(730, min(2560, fall_y(t) + 100)); z = 1.1 - 0.15 * smooth((t - T_LAND + 0.4) / 0.6); cx = 640
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    night(c, t)
    film_lights(c, t)
    building(c, t)
    # the stuntman: standing at the edge (wind in his breathing), stepping off, falling on his back, landing
    y = fall_y(t)
    land = smooth((t - T_LAND) / 0.5)
    sq = smooth((t - T_LAND + 0.05) / 0.35) * (1 - 0.15 * smooth((t - T_LAND - 0.8) / 1.5))
    vent = max(0.0, t - T_LAND) if t > T_LAND else 0.0
    airbag(c, BAG_X0, BAG_X1, BAG_TOP, t, squash=sq, vent=vent, dent_x=640)
    if t < T_STEP:
        man(c, STUNT, EDGE_X + 40, ROOF - 18, face=-1, uarm_n=8 + 6 * math.sin(t * 1.3), elbow_n=14, br=0.5 + 0.5 * math.sin(t * 2), neck=-14 * smooth(t / 1.2), lean=4 * smooth(t / 1.2))
    else:
        u = t - T_STEP
        ang = lerp(0, 95, smooth(u / 0.9))        # tips back onto his back as he leaves the ledge
        x = lerp(EDGE_X + 40, 640, smooth(u / 1.2))
        yy = min(y - 90, BAG_TOP - 50 + 150 * sq) if t >= T_LAND - 0.05 else y - 90
        man_rot(c, STUNT, x, yy, ang + (0 if t < T_LAND else 0), 1.0, face=-1, uarm_n=lerp(8, 100, smooth(u / 0.6)), elbow_n=20,
                uarm_f=lerp(8, 80, smooth(u / 0.6)), thigh_n=lerp(0, 35, smooth(u / 0.7)), knee_n=-25, thigh_f=15, knee_f=-35)
    crew_on_set(c, t)
    c.restore()
    # speed chip (kept below the poll area): v = g t
    if T_STEP < t < T_SO + 0.6:
        a = smooth((t - T_STEP) / 0.2) * (1 - smooth((t - T_SO) / 0.5))
        kit.L.chip(c, f'{speed_mph(t):.0f} mph', 300, 1180, Y, size=64, a=a)


# ------------------------------------------------------------------ the showdown
def panel_bg(c, x0, x1, col):
    lgrad(c, skia.Rect(x0, 0, x1, H), 0, H, [mix(col, (10, 12, 24), 0.6), mix(col, (10, 12, 24), 0.85)])


def showdown(c, t):
    u = (t - T_B) / (T_C - T_B)
    c.save(); kit.push(c, ease_io(u), 540, 960, 1.0, 1.04)
    panel_bg(c, 0, 540, (120, 70, 70)); panel_bg(c, 540, W, (60, 100, 140))
    c.drawLine(540, 520, 540, 1360, SP((255, 255, 255), 4, 120))
    f = skia.Font(kit.L.BLACK, 46)
    for txt, cx, col in (('CONCRETE', 270, R), ('AIRBAG', 810, TL)):
        w_ = f.measureText(txt); c.drawString(txt, cx - w_ / 2, 600, f, P(col))
    # concrete ground (left) and the bag (right), each panel's own small ground
    c.drawRect(skia.Rect(0, 1000, 540, 1060), P((140, 140, 150))); c.drawRect(skia.Rect(0, 1000, 540, 1008), P((190, 190, 200)))
    k_air = smooth((t - T_SINKS + 0.2) / 2.2)
    # both arrive at the same speed
    arrive = smooth((t - T_B) / 1.0)
    # concrete: a grey ghost that stops at once
    ghost_y = lerp(720, 975, arrive)
    if t > T_CON:
        ghost_y = 975
    c.saveLayer(None, skia.Paint(Alphaf=0.55))
    man_rot(c, STUNT, 270, ghost_y, 95, 0.95, face=-1, uarm_n=100, uarm_f=80, elbow_n=20, thigh_n=35, knee_n=-25, thigh_f=15, knee_f=-35)
    c.restore()
    # the bag panel
    c.save(); c.translate(810, 0); c.scale(0.75, 0.75); c.translate(-765, -STREET + 1333)
    airbag(c, BAG_X0, BAG_X1, BAG_TOP, t, squash=k_air, vent=max(0, t - T_SINKS) * (k_air > 0), dent_x=765)
    c.restore()
    by = lerp(700, 790, arrive) + 100 * k_air
    man_rot(c, STUNT, 810, by, 95, 0.95, face=-1, uarm_n=100, uarm_f=80, elbow_n=20, thigh_n=35, knee_n=-25, thigh_f=15, knee_f=-35)
    # speed arrows (same speed) then force arrows on the word
    sa = smooth((t - T_B) / 0.4) * (1 - smooth((t - T_CON + 0.2) / 0.4))
    for cx in (270, 810):
        if sa > 0: arrow(c, cx + 120, 640, cx + 120, 780, Y, 12, sa);
    if sa > 0:
        kit.L.chip(c, 'same speed', 540, 760, Y, size=42, a=sa)
    fa = smooth((t - T_HUGE + 0.3) / 0.3)
    if fa > 0:
        arrow(c, 470, 1000, 470, 1000 - 340 * fa, R, 34, 1)
        c.drawCircle(300, 960, 120 * fa, P((255, 80, 60), 70 * fa, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    fb = smooth((t - T_AVG + 0.2) / 0.4)
    if fb > 0:
        arrow(c, 1010, 1000, 1010, 1000 - 70 * fb, TL, 18, 1)
    # the force vs time graph
    graph(c, t)
    c.restore()


def arrow(c, x0, y0, x1, y1, col, w, a):
    c.drawLine(x0, y0, x1, y1, SP(col, w, 255 * a))
    ang = math.atan2(y1 - y0, x1 - x0); L_ = w * 2.2
    p = skia.Path(); p.moveTo(x1 + math.cos(ang) * L_ * 0.6, y1 + math.sin(ang) * L_ * 0.6)
    p.lineTo(x1 + math.cos(ang + 2.4) * L_, y1 + math.sin(ang + 2.4) * L_); p.lineTo(x1 + math.cos(ang - 2.4) * L_, y1 + math.sin(ang - 2.4) * L_); p.close()
    c.drawPath(p, P(col, 255 * a))


def graph(c, t):
    gx0, gx1, gy0, gy1 = 110, 990, 1070, 1300          # axes box (time right, force up)
    ga = smooth((t - T_CON + 0.2) / 0.4)
    if ga <= 0: return
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(gx0 - 60, gy0 - 40, gx1 + 40, gy1 + 50), 28, 28), P((8, 12, 26), 210 * ga))
    c.drawLine(gx0, gy1, gx1, gy1, SP(Wt, 4, 230 * ga)); c.drawLine(gx0, gy1, gx0, gy0, SP(Wt, 4, 230 * ga))
    f = skia.Font(kit.L.XBOLD, 30)
    c.drawString('force', gx0 + 10, gy0 + 6, f, P(Wt, 220 * ga)); c.drawString('time', gx1 - 70, gy1 + 38, f, P(Wt, 220 * ga))
    area = 640 * 36 * 2 / math.pi       # hump 640 wide x 32 tall; spike 100 wide x 205 tall, same area
    # concrete: tall narrow spike (width 40 px), airbag: low wide hump (width 640 px), equal areas
    def shape(w_, x_start, prog):
        hgt = area / (w_ * 0.5 * math.pi * 0.5 * 2 / math.pi * 2) if False else area / (w_ * 2 / math.pi)
        p = skia.Path(); p.moveTo(x_start, gy1)
        n = 40
        for i in range(n + 1):
            xx = x_start + w_ * i / n * prog
            p.lineTo(xx, gy1 - hgt * math.sin(math.pi * i / n) if i / n <= prog else gy1)
        p.lineTo(x_start + w_ * prog, gy1); p.close()
        return p, hgt
    pc, hc = shape(100, gx0 + 30, smooth((t - T_CON) / 0.3))
    fill = smooth((t - T_SAME + 0.2) / 0.5)
    c.save(); c.clipRect(skia.Rect(gx0, gy0 - 30, gx1 + 30, gy1 + 2))
    c.drawPath(pc, P(R, (110 + 110 * fill) * ga)); c.drawPath(pc, SP(R, 6, 255 * ga))
    pb_prog = smooth((t - T_STOP + 0.3) / 1.6)
    if pb_prog > 0:
        pb, hb = shape(640, gx0 + 180, pb_prog)
        c.drawPath(pb, P(TL, (110 + 110 * fill) * ga)); c.drawPath(pb, SP(TL, 6, 255 * ga))
    c.restore()
    f2 = skia.Font(kit.L.BLACK, 44)
    if ga > 0.5: c.drawString('short, huge', gx0 + 150, gy0 + 30, f2, P(R, 255 * ga))
    if pb_prog > 0.6: c.drawString('long, small', gx0 + 560, gy1 - 45, f2, P(TL, 255 * smooth((pb_prog - 0.6) / 0.4)))
    if fill > 0:
        kit.L.chip(c, 'same area = same momentum change', 630, gy0 + 82, Y, size=38, a=fill)


# ------------------------------------------------------------------ the next take
def shot_c(c, t):
    u = (t - T_C) / (DUR - T_C)
    c.save(); c.translate(540, 960); z = lerp(1.0, 1.08, ease_io(u)); c.scale(z, z); c.translate(-660, -2560)
    night(c, t); film_lights(c, t); building(c, t)
    refill = smooth((t - T_CREW + 0.3) / 1.6)
    airbag(c, BAG_X0, BAG_X1, BAG_TOP, t, squash=0.85 * (1 - refill))
    roll = smooth((t - T_C - 0.1) / 1.3)
    J = STUNT.joints(A2.Pose(face=-1, uarm_n=10, elbow_n=30))
    hip_stand = STREET + J['hip'][1] * STUNT.k
    # one continuous move: he rolls off the bag and comes up standing (pose and position blend, no swap)
    man_rot(c, STUNT, lerp(640, 980, roll), lerp(BAG_TOP - 50 + 150 * 0.85, hip_stand, roll), lerp(95, 0, roll), 1.0, face=-1,
            uarm_n=lerp(60, 10, roll) + 140 * smooth((t - T_CREW) / 0.5), elbow_n=lerp(40, 30, roll) + 20 * math.sin(t * 8) * smooth((t - T_CREW) / 0.5),
            thigh_n=lerp(40, 0, roll), knee_n=lerp(-60, 0, roll),
            br=0.5 + 0.5 * math.sin(t * 2.5))
    # the crew's fan blowing the bag back up
    c.drawRect(skia.Rect(BAG_X0 - 200, STREET - 160, BAG_X0 - 60, STREET), P((60, 64, 72)))
    c.drawCircle(BAG_X0 - 130, STREET - 80, 60, P((40, 42, 48)))
    for k in range(4):
        a = t * 18 + k * math.pi / 2
        c.drawLine(BAG_X0 - 130, STREET - 80, BAG_X0 - 130 + 52 * math.cos(a), STREET - 80 + 52 * math.sin(a), SP((120, 124, 134), 10))
    man(c, CREW1, 250, STREET, face=1, uarm_n=40, elbow_n=50)
    c.restore()


def scene(c, t):
    if t < T_B: shot_a(c, t)
    elif t < T_C: showdown(c, t)
    else: shot_c(c, t)


SHORT = kit.Short(WD, 'AP PHYSICS 1', TITLES, scene, DUR, T_END, cuts=(T_B, T_C))

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1104/stunt/stills')
