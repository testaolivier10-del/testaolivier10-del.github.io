"""w1031-01-cold-heart (NREMT, EMT traps #2). All code (skia), house flat style, knight v3 method.
Art plan:
- Scene: a frozen lake at night under a high moon, snowy pine shore in hazy layers, light snow falling, an ice hole
  with black water near the middle, an ambulance on the far shore with its light bar flashing red and blue (scene life),
  two ice rescuers in red dry suits with helmets and headlamps (beams in the cold air), the patient in a dark jacket and
  beanie. Why it fits: cold water ice rescue is where severe hypothermia and the handle gently rule meet.
- People built from parts in code (figure.Person), seen side on; breath vapour; headlamp beams.
- Motion list (checked with the fact check): rescuers grab his arms and start to yank him up out of the hole (the rough
  lift, shown as the wrong move); a round lens opens from his chest: a cold heart beating slowly, ECG slow and regular
  with a small J wave, an occasional early beat on "twitchy"; on "jolt" the frame jolts and the heart quivers while the
  trace turns to chaotic ventricular fibrillation (shown as what CAN happen, red); the lens closes and time runs on with
  the careful version: he is laid FLAT on a rescue sled and slid slowly across the ice to shore; the lens returns with a
  slow steady beat to the end.
"""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1031/lib']
import numpy as np, skia
from lpk import *
from figure import Person
import ctchars as tchars
import layout as L
import heart as HT
import scenekit as SK

ID = 'w1031-01-cold-heart'
OUT = f'/home/claude/lp/w1031/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(hyp=WD.at('hypothermia'), stop=WD.at('stop'), hes=WD.at("he's"), twitchy=WD.at('twitchy'), one=WD.at('one', 1),
         jolt=WD.at('jolt'), vent=WD.at('ventricular'), thats=WD.at("that's"), quivers=WD.at('quivers'), pumping=WD.at('pumping'),
         and2=WD.at('and', 3), scary=WD.at('scary'), so=WD.at('so'), flat=WD.at('flat'), slide=WD.at('slide'), glass=WD.at('glass'),
         and3=WD.at('and', 5), careful=WD.at('careful'), slow2=WD.at('slow', 2), steady=WD.at('steady'))
END = WD.end()
DUR = END + 1.6
CAP = SK.merge_singles(Captions(WD.w))
MOON = (236, 240, 255)
RIM = (196, 214, 255)
AMB_X, AMB_Y = 556, 914
# heart timing, tied to the mix (lib/mix.py cold): a heartbeat sound at LENS_ON + k*1.5 s (until the jolt) and at
# and3 + 0.5 + k*1.5 s; the monitor beep 0.08 s later is the QRS on the trace and the squeeze follows it
LENS_ON = T['hes'] + 0.6
T0A = LENS_ON + 0.08
T0B = T['and3'] + 0.58
T_VF = T['jolt'] + 0.52          # the knock against the ice edge (punch and bag drop in the mix)
SLED_CY, SLED_Z = 1052, 0.86
SS = 0.62
BG_DY = -250          # sled shot: the far shore drawn higher (camera looking down a little), so less empty sky


def sky(c):
    lgrad(c, skia.Rect(-600, -400, 1700, 1000), -400, 950, [(10, 14, 38), (24, 34, 74), (52, 64, 112)], [0, 0.6, 1])
    rs = np.random.default_rng(2)
    for k in range(90):
        x, y = rs.uniform(-200, 1300), rs.uniform(-300, 700)
        c.drawCircle(x, y, rs.uniform(0.8, 2.0), P((230, 236, 255), 150 + 90 * math.sin(k * 1.3)))


def moon(c, cam, t, sy_max=452):
    """the moon stays put on screen (a far object does not slide with a short pan); drawn in world space so the
    shore pines still pass in front of it"""
    cx, cy, z, jx = cam
    sx, sy = 120 + 6 * math.sin(t * 0.05), sy_max
    x, y = cx + (sx - 540 - jx) / z, cy + (sy - 1050) / z
    c.save(); c.translate(x, y); c.scale(1 / z, 1 / z)
    c.drawCircle(0, 0, 200, P((180, 200, 255), 60, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(0, 0, 46, P(MOON))
    c.drawCircle(-12, -8, 8, P((214, 220, 240))); c.drawCircle(14, 10, 6, P((214, 220, 240))); c.drawCircle(4, -20, 4, P((220, 226, 244)))
    q = skia.Path(); q.addCircle(0, 0, 46); r_ = skia.Path(); r_.addCircle(-7, -6, 46)
    d = skia.Op(q, r_, skia.PathOp.kDifference_PathOp)
    if d is not None: c.drawPath(d, P((200, 210, 236)))
    c.restore()


SH1 = jag([(-400, 830), (0, 800), (200, 820), (420, 790), (700, 815), (1000, 790), (1500, 805)], 4, 4)
SH2 = jag([(-400, 900), (100, 880), (360, 895), (640, 870), (900, 890), (1500, 880)], 5, 4)


def pines(c, t, y0, n, h0, h1, col, snow, seed, x0=-380, step=30):
    rs = np.random.default_rng(seed)
    for k in range(n):
        x = x0 + k * step + rs.uniform(-8, 8); h = rs.uniform(h0, h1); y = y0 + rs.uniform(-8, 10)
        sw = 1.5 * math.sin(t * 0.9 + k * 0.6)
        c.drawPath(poly([(x + sw, y - h), (x + h * 0.22, y), (x - h * 0.22, y)]), P(col))
        for j in range(3):  # snow on the tiers, moonlit side left
            yy = y - h * (0.25 + 0.25 * j); w = h * 0.22 * (1 - (0.25 + 0.25 * j))
            c.drawPath(poly([(x - w, yy + 6), (x + sw * 0.6, yy - 8), (x - w * 0.1, yy + 3)]), P(snow))


def shore(c, t):
    c.drawPath(ridge(SH1), P((40, 52, 92)))
    pines(c, t, 820, 66, 50, 110, (30, 40, 74), (110, 124, 170), 1)
    c.drawPath(ridge(SH2), P((56, 70, 112)))
    pines(c, t, 892, 60, 70, 140, (22, 32, 60), (150, 166, 210), 2, step=32)
    # snow bank along the near shore
    c.drawPath(ridge(jag([(-400, 930), (200, 918), (600, 932), (1000, 920), (1500, 928)], 6, 3)), P((150, 164, 210)))


def ambulance(c, t, s=0.62):
    """a box ambulance parked on the far shore, facing left: cab with windows, box body, red stripe, star of life,
    light bar flashing red and blue, headlights; moonlight from the left, so the shade falls on the right faces"""
    x, y = AMB_X, AMB_Y
    ph = (t * 2.4) % 1.0; red = ph < 0.5
    col = (255, 60, 70) if red else (70, 120, 255)
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-100, -8, 100, 8), P((20, 26, 50), 150, MaskFilter=blur(5)))
    body = skia.Path(); body.addRRect(skia.RRect.MakeRectXY(skia.Rect(-26, -92, 92, -14), 6, 6))
    cab = smooth_closed([(-26, -70), (-50, -70), (-66, -56), (-86, -40), (-90, -24), (-90, -14), (-26, -14)])
    WH, WSH, WSH2 = (226, 232, 246), (176, 186, 214), (150, 160, 194)
    for p_ in (cab, body):
        flat(c, p_, WH, WSH, sh_off=(-10, -6), rim=RIM, rim_d=(3, 3), rim_a=200)
    c.drawRect(skia.Rect(84, -92, 92, -14), P(WSH2))                    # the far end in shade
    c.drawRect(skia.Rect(-90, -42, 92, -34), P((214, 52, 62)))           # stripe
    c.drawRect(skia.Rect(-90, -34, 92, -31), P((160, 36, 48)))
    win = poly([(-48, -64), (-30, -64), (-30, -46), (-68, -46), (-60, -56)])
    c.drawPath(win, P((40, 56, 96))); c.drawLine(-52, -60, -42, -50, SP((140, 170, 220), 2.5, 200))
    c.drawRect(skia.Rect(-10, -80, 14, -60), P((40, 56, 96)))            # box side window
    c.drawLine(44, -88, 44, -16, SP(WSH, 2)); c.drawLine(40, -54, 48, -54, SP((90, 96, 120), 2))   # side door and handle
    # star of life: three crossed bars and the rod of Asclepius
    c.save(); c.translate(68, -64)
    for ang in (0, 60, 120):
        c.save(); c.rotate(ang); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-4.5, -13, 4.5, 13), 2, 2), P((40, 96, 206))); c.restore()
    c.drawLine(0, -9, 0, 9, SP((240, 244, 255), 1.6)); c.restore()
    # bumpers, headlight, wheels in their arches
    c.drawRect(skia.Rect(-94, -22, -82, -14), P((120, 126, 150)))
    c.drawRect(skia.Rect(88, -22, 96, -14), P((120, 126, 150)))
    c.drawOval(skia.Rect(-92, -36, -84, -28), P((255, 244, 200)))
    for wx in (-58, 58):
        c.drawCircle(wx, -12, 17, P((20, 24, 40)))
        c.drawCircle(wx, -10, 13, P((34, 36, 48))); c.drawCircle(wx, -10, 5, P((130, 136, 156)))
    # light bar on the cab roof and a small beacon on the box
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-50, -78, -22, -70), 3, 3), P((60, 64, 80)))
    c.drawRect(skia.Rect(-48, -77, -37, -71), P((255, 70, 80) if red else (110, 40, 50)))
    c.drawRect(skia.Rect(-35, -77, -24, -71), P((80, 130, 255) if not red else (40, 50, 110)))
    c.drawRect(skia.Rect(80, -98, 90, -92), P(col))
    c.restore()
    bx = x + (-42 if red else -30) * s
    c.drawCircle(bx, y - 74 * s, 60, P(col, 60, MaskFilter=blur(22), BlendMode=skia.BlendMode.kScreen))
    c.drawOval(skia.Rect(x - 150, y - 8, x + 150, y + 30), P(col, 40, MaskFilter=blur(24), BlendMode=skia.BlendMode.kScreen))
    # headlight beam on the snow, toward the lake
    hb = poly([(x - 90 * s, y - 32 * s), (x - 260, y + 6), (x - 230, y + 30)])
    c.drawPath(hb, P((255, 246, 210), 50, MaskFilter=blur(10), BlendMode=skia.BlendMode.kScreen))


def ice(c, t):
    lgrad(c, skia.Rect(-900, 925, 2000, 3400), 925, 1900, [(120, 140, 196), (86, 104, 160), (60, 74, 124)])
    # moon path on the ice and wind polished streaks
    c.drawOval(skia.Rect(150, 940, 360, 1700), P((200, 214, 255), 60, MaskFilter=blur(40)))
    rs = np.random.default_rng(8)
    for k in range(40):
        x = rs.uniform(-200, 1300); y = rs.uniform(960, 1900); w = rs.uniform(40, 200) * (y - 900) / 600
        c.drawLine(x, y, x + w, y + 2, SP((150, 170, 226), 2.5 * (y - 900) / 600, 120))
    for k in range(20):
        x = rs.uniform(-200, 1300); y = rs.uniform(1000, 1900)
        c.drawLine(x, y, x + rs.uniform(-80, 80), y + rs.uniform(10, 50), SP((70, 86, 140), 1.6, 160))


HOLE = (520, 1370)
K_ = 0.76 / 0.55
RIM_O = smooth_closed([(HOLE[0] - 150 * K_, HOLE[1]), (HOLE[0] - 100 * K_, HOLE[1] - 33 * K_), (HOLE[0], HOLE[1] - 40 * K_), (HOLE[0] + 104 * K_, HOLE[1] - 32 * K_),
                       (HOLE[0] + 152 * K_, HOLE[1] + 2), (HOLE[0] + 100 * K_, HOLE[1] + 34 * K_), (HOLE[0], HOLE[1] + 40 * K_), (HOLE[0] - 102 * K_, HOLE[1] + 32 * K_)])
RIM_I = smooth_closed([(HOLE[0] - 124 * K_, HOLE[1]), (HOLE[0] - 86 * K_, HOLE[1] - 24 * K_), (HOLE[0], HOLE[1] - 30 * K_), (HOLE[0] + 88 * K_, HOLE[1] - 23 * K_),
                       (HOLE[0] + 126 * K_, HOLE[1] + 2), (HOLE[0] + 84 * K_, HOLE[1] + 24 * K_), (HOLE[0], HOLE[1] + 30 * K_), (HOLE[0] - 86 * K_, HOLE[1] + 23 * K_)])


def _crack_lines(seed, cx, cy, rx, ry, angs, grow):
    """connected crack polylines running out from an ellipse (the hole's rim) across the ice, each with one side
    branch that starts on it; only in the ice plane, drawn before anyone on it"""
    rs = np.random.default_rng(seed); out = []
    for a_deg in angs:
        a = math.radians(a_deg + rs.uniform(-6, 6)); L_ = (150 + rs.uniform(0, 150)) * grow
        if L_ < 4: continue
        pts = [(cx + rx * math.cos(a), cy + ry * math.sin(a))]
        for _ in range(4):
            aa = a + rs.uniform(-0.35, 0.35)
            pts.append((pts[-1][0] + L_ / 4 * math.cos(aa), pts[-1][1] + L_ / 4 * 0.38 * math.sin(aa)))
        out.append(pts)
        if L_ > 80:
            b0 = pts[2]; ab = a + rs.choice([-0.9, 0.9])
            out.append([b0, (b0[0] + 0.3 * L_ * math.cos(ab), b0[1] + 0.3 * L_ * 0.38 * math.sin(ab))])
    return out


def cracks(c, t):
    x, y = HOLE
    g = smooth(t / 2.2)
    # out to the sides and toward the camera only: never up the ice behind the people, so no crack shows through a
    # gap between his arm and body
    for pts in _crack_lines(3, x, y, 152 * K_, 36 * K_, (-12, 20, 55, 90, 125, 160, 192), g):
        p = skia.Path(); p.moveTo(*pts[0])
        for q in pts[1:]: p.lineTo(*q)
        c.drawPath(p, SP((236, 244, 255), 3, 200))
        c.drawPath(p, SP((50, 66, 120), 1.2, 220))


def snow(c, t, n=80, near=False):
    rs = np.random.default_rng(31 if near else 30)
    for k in range(n):
        x0, y0, sp = rs.uniform(0, 1080), rs.uniform(0, 1920), rs.uniform(30, 70) * (2 if near else 1)
        x = (x0 + 20 * math.sin(t * 0.6 + k)) % 1080
        y = (y0 + sp * t) % 1920
        c.drawCircle(x, y, rs.uniform(1.5, 3.2) * (2 if near else 1), P((240, 244, 255), 200 if near else 150, MaskFilter=blur(1.5 if near else 0.5)))


def beam(c, x, y, ang, L_=520, a=60):
    p = poly([(x, y), (x + L_ * math.cos(ang - 0.18), y + L_ * math.sin(ang - 0.18)), (x + L_ * math.cos(ang + 0.18), y + L_ * math.sin(ang + 0.18))])
    sh = skia.GradientShader.MakeRadial(skia.Point(x, y), L_, [C((255, 250, 220), a), C((255, 250, 220), 0)])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=sh, BlendMode=skia.BlendMode.kScreen))


def breath(c, t, x, y, period, ph, dirx=-1):
    u = ((t + ph) % period) / period
    if u > 0.55: return
    k = u / 0.55
    for j in range(3):
        c.drawCircle(x + dirx * (20 + 60 * k + j * 14), y - 10 * k - j * 6, 12 + 24 * k, P((230, 236, 255), 60 * (1 - k), MaskFilter=blur(8 + 10 * k)))


IS = 0.76
IX0, IY0 = HOLE[0] - 660 * IS, HOLE[1] - 638 * IS


def ice_ref(x, y, jolt=0.0):
    return IX0 + x * IS, IY0 + 14 * jolt + y * IS


def patient_chest(t, lift, jolt):
    """world point over his heart (his left chest, the viewer's right of his sternum), from the code character"""
    try:
        pat, _, _ = tchars.ice_poses(t, lift * 250, lift)
        J = tchars.P_PAT.skeleton(pat)
        a_, b_ = J['sh_n'], J['sh_f']
        x, y = (a_[0] * 0.35 + b_[0] * 0.65), (a_[1] + b_[1]) / 2 + 58
    except Exception:
        x, y = tchars.PATIENT_X + 40, 470 - lift * 250
    return ice_ref(x, y, jolt)


def ice_scene(c, t, lift, jolt, imp=0.0):
    """the code rescue group (lib/ctchars.py) over a code hole; the lift raises the patient so the rescuers' hands
    stay on him; the water and the near lip of the hole cover him below the waterline"""
    x, y = HOLE
    wl = IY0 + 14 * jolt + 636 * IS          # the waterline (the character's water_y)
    cracks(c, t)
    c.drawPath(RIM_O, P((176, 206, 246)))
    c.save(); c.translate(0, 6); c.drawPath(RIM_O, P((120, 146, 200))); c.restore()      # the ice slab's cut edge
    c.drawPath(RIM_O, P((176, 206, 246)))
    c.drawPath(RIM_I, P((10, 16, 36)))
    lp_ = lift * 250
    # beams under the figures so they light the air, not paint over faces
    for hx_, hy_, ang in ((IX0 + 482 * IS, IY0 + 228 * IS, 0.6), (IX0 + 888 * IS, IY0 + 248 * IS, math.pi - 0.6)):
        beam(c, hx_, hy_, ang, 330, 26)
    if imp > 0.02:   # he hits the ice edge: the flash lights the ice and the hole, under the people
        c.drawOval(skia.Rect(HOLE[0] - 260, HOLE[1] - 40, HOLE[0] + 260, HOLE[1] + 60), P((255, 240, 230), 120 * imp, MaskFilter=blur(24), BlendMode=skia.BlendMode.kScreen))
    # water rings: full ellipses on the water BEFORE him (their back halves show at his sides and behind him);
    # the front halves are drawn again over him below
    def rings(a_mul):
        c.drawOval(skia.Rect(x - 90, wl - 10, x + 90, wl + 12), SP((170, 200, 250), 3, 210 * a_mul))
        for k in range(4):
            r = 90 + ((t * 26 + k * 30) % 120)
            al = 190 * (1 - (r - 90) / 120) * a_mul
            c.drawOval(skia.Rect(x - r, wl - r * 0.13, x + r, wl + r * 0.18), SP((90, 120, 190), 2.2, al))
    wl0 = IY0 + 14 * jolt + 636 * IS
    c.save(); c.clipPath(RIM_I, skia.ClipOp.kIntersect, True); rings(1.0); c.restore()
    # the people in their own layer, so the wet band can darken only his jacket at the waterline
    c.saveLayer(None, None)
    tchars.draw_ice(c, t, IX0, IY0 + 14 * jolt, IS, lift_px=lp_, lean=lift, rim=((196, 214, 255), (-3, 2), 190))
    wa_ = 1 - smooth((lift - 0.32) / 0.08)          # the wet band sits at the waterline only while he is in the water
    if wa_ > 0.01:
        c.save(); c.clipRect(skia.Rect(x - 120, wl - 40, x + 120, wl + 2))
        sh = skia.GradientShader.MakeLinear([skia.Point(0, wl - 40), skia.Point(0, wl)], [C((6, 10, 30), 0), C((6, 10, 30), 170 * wa_)])
        c.drawRect(skia.Rect(x - 120, wl - 40, x + 120, wl + 2), skia.Paint(Shader=sh, BlendMode=skia.BlendMode.kSrcATop))
        c.restore()
    c.restore()
    # water running off him while he is pulled up
    k_ = smooth((lift - 0.33) / 0.15)
    if k_ > 0.01:
        top = wl - lp_ * IS * 0.9
        for j in range(4):
            sx_ = x - 66 + j * 44 + 4 * math.sin(t * 9 + j)
            y_s = top + 30 + 14 * (j % 2)
            c.drawLine(sx_, y_s, sx_ + 2 * math.sin(t * 13 + j), wl, SP((170, 200, 250), 2.4, 80 * k_))
        for j in range(8):
            dy_ = (t * 420 + j * 31) % max(10, wl - top)
            c.drawCircle(x - 80 + j * 23, top + dy_, 3.5, P((200, 224, 255), 170 * k_))
    # the water in front: the lower half of the hole covers him below the waterline
    c.save(); c.clipPath(RIM_I, skia.ClipOp.kIntersect, True)
    c.clipRect(skia.Rect(x - 260, wl - 2, x + 260, y + 80))
    c.drawRect(skia.Rect(x - 260, wl - 2, x + 260, y + 80), P((12, 20, 44)))
    c.drawOval(skia.Rect(x - 110, wl - 10, x + 110, wl + 20), P((4, 8, 24), 200, MaskFilter=blur(6)))       # his shadow in the water
    # ripples spreading from his body (they start at his sides, not in front of him)
    rings(1.0)
    c.restore()
    # the waterline ring hugging him: a bright meniscus round the front of the torso, small bumps at his sides
    c.save(); c.clipRect(skia.Rect(x - 200, wl - 1, x + 200, wl + 30))
    c.drawOval(skia.Rect(x - 84, wl - 8, x + 84, wl + 8), SP((200, 224, 255), 2.6, 190))
    c.restore()
    # the near lip of the hole over everything below the waterline
    lip = skia.Op(RIM_O, RIM_I, skia.PathOp.kDifference_PathOp)
    if lip is not None:
        c.save(); c.clipRect(skia.Rect(x - 260, wl - 2, x + 260, y + 80)); c.drawPath(lip, P((196, 222, 252))); c.restore()
    c.drawArc(skia.Rect(x - 124 * K_, y - 30 * K_, x + 124 * K_, y + 30 * K_), 12, 156, False, SP((236, 244, 255), 3, 200))
    # breath in the cold air
    breath(c, t, IX0 + 440 * IS, IY0 + 285 * IS, 2.6, 0.0, dirx=1)
    breath(c, t, IX0 + 925 * IS, IY0 + 318 * IS, 2.8, 1.1, dirx=-1)
    breath(c, t, IX0 + 668 * IS, IY0 + 462 * IS - lift * 250 * IS, 3.4, 0.5, dirx=1)


def sled_pull(t):
    return smooth((t - T['so'] - 0.2) / (DUR - T['so'] - 0.2))


def sled_geom(t):
    """sled origin (world), its travel so far (ref px) and the camera centre that keeps the whole group framed"""
    sx = 900 - 300 * sled_pull(t)
    x0, y0 = sx - 640 * SS, 1362 - 735 * SS
    return x0, y0, (900 - sx) / SS, x0 + 510 * SS


def sled_scene2(c, t):
    """the code sled group (lib/ctchars.py): he lies flat, wrapped, on the rescue sled; one rescuer walks ahead
    pulling the rope, the other walks beside the tail on a tag line; slowly toward shore (left)"""
    x0, y0, d, _ = sled_geom(t)
    # the empty hole they came out of, behind on the right
    hx_, hy_ = 1650, 1262          # where they pulled him out, fixed in the world right of the sled's start: it is at the right edge as the shot opens and slides off right as the camera follows
    c.drawOval(skia.Rect(hx_ - 120, hy_ - 24, hx_ + 120, hy_ + 24), P((176, 206, 246)))
    c.drawOval(skia.Rect(hx_ - 102, hy_ - 18, hx_ + 102, hy_ + 18), P((10, 16, 36)))
    c.drawArc(skia.Rect(hx_ - 102, hy_ - 18, hx_ + 102, hy_ + 18), 10, 160, False, SP((236, 244, 255), 3, 190))
    # the sled's track in the snow behind it
    c.drawLine(x0 + 1140 * SS, 1366, hx_ - 120, hy_ + 20, SP((150, 170, 226), 10, 90))
    c.drawOval(skia.Rect(x0 + 100 * SS, 1350, x0 + 1180 * SS, 1380), P((30, 40, 80), 110, MaskFilter=blur(8)))
    # the rope from the sled's nose to the puller's far shoulder, behind him
    try:
        tchars._sled_walkers(t, d, math.sin(t * 1.4))
    except Exception:
        pass
    rope0 = (x0 + 125 * SS, y0 + 640 * SS)
    rh = tchars.SLED_ROPE_HAND[0]
    rope1 = (x0 + rh[0] * SS, y0 + rh[1] * SS)
    rp = skia.Path(); rp.moveTo(*rope0); rp.quadTo((rope0[0] + rope1[0]) / 2, max(rope0[1], rope1[1]) + 6, *rope1)
    c.drawPath(rp, SP((240, 210, 70), 4))
    # a light snow spray where the sled runs
    for k in range(5):
        u_ = ((t * 1.3 + k * 0.2) % 1.0)
        c.drawCircle(x0 + 1150 * SS + 40 * u_, 1366 - 10 * u_, 6 + 10 * u_, P((236, 244, 255), 120 * (1 - u_) * min(1, sled_pull(t) * 20)))
    tchars.draw_sled(c, t, x0, y0, SS, travel=d)
    (lx_, ly_), (mx_, my_) = tchars.SLED_LAMP      # the rescuer's helmet lamp and mouth, from the code character
    beam(c, x0 + lx_ * SS, y0 + ly_ * SS, math.radians(160), 360, 40)
    breath(c, t, x0 + mx_ * SS, y0 + my_ * SS, 2.6, 0.4, dirx=-1)


def sled_chest(t):
    x0, y0, _, _ = sled_geom(t)
    return x0 + 470 * SS, y0 + 560 * SS


# ------------------------------------------------------------------ foreground (fills the band under the captions)
def _slab(c, sx_, sy_, w_, h_, lean_, seed):
    """a pushed up ice slab: a lit face toward the moon (left), a shaded side face, a snow cap, inner cracks and
    air bubbles, sitting in a small drift"""
    rs = np.random.default_rng(seed)
    top = (sx_ + w_ * 0.45 + h_ * lean_, sy_ - h_)
    face = poly([(sx_, sy_), (top[0] - w_ * 0.2, top[1] + 10), top, (top[0] + w_ * 0.08, top[1] + 14), (sx_ + w_ * 0.62, sy_ + 10)])
    side = poly([top, (top[0] + w_ * 0.08, top[1] + 14), (sx_ + w_, sy_ + 6), (sx_ + w_ * 0.62, sy_ + 10)])
    c.drawPath(face, P((140, 170, 226)))
    c.drawPath(side, P((86, 110, 176)))
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
    c.drawPath(poly([(sx_, sy_), (top[0] - w_ * 0.2, top[1] + 10), (top[0] - w_ * 0.05, top[1] + 30), (sx_ + w_ * 0.2, sy_)]), P((176, 204, 246)))
    for k in range(2):
        a0 = (sx_ + w_ * rs.uniform(0.2, 0.5), sy_ - h_ * rs.uniform(0.2, 0.6))
        c.drawLine(*a0, a0[0] + rs.uniform(-20, 20), a0[1] + rs.uniform(15, 30), SP((214, 230, 255), 2, 200))
    for k in range(4):
        c.drawCircle(sx_ + w_ * rs.uniform(0.25, 0.55), sy_ - h_ * rs.uniform(0.15, 0.6), rs.uniform(1.5, 3), P((220, 236, 255), 180))
    c.restore()
    cap = smooth_closed([(top[0] - w_ * 0.24, top[1] + 14), (top[0] - w_ * 0.05, top[1] - 4), top, (top[0] + w_ * 0.1, top[1] + 12), (top[0] - w_ * 0.08, top[1] + 18)])
    c.drawPath(cap, P((226, 234, 252)))
    c.drawPath(smooth_closed([(sx_ - 24, sy_ + 2), (sx_ + w_ * 0.4, sy_ - 10), (sx_ + w_ + 22, sy_ + 4), (sx_ + w_ + 10, sy_ + 22), (sx_ - 16, sy_ + 20)]), P((110, 128, 184)))


def foreground(c, t, dx, kind):
    """near layer in screen space under the captions, sliding more than the scene (parallax), filled to the bottom:
    two snow drifts with lit crests, ice slabs pushed up along a pressure crack, and in the rescue shot a throw bag
    with its rope lying loose on the snow"""
    c.save(); c.translate(dx, 0)
    rs = np.random.default_rng(40 + kind)
    for k, (pts, col, rim_c) in enumerate((([(-300, 1600), (-60, 1566), (180, 1590), (420, 1556), (700, 1586), (960, 1552), (1400, 1584)], (78, 94, 150), (170, 190, 240)),
                                           ([(-300, 1700), (100, 1672), (380, 1706), (640, 1680), (900, 1710), (1400, 1684)], (62, 76, 130), (128, 148, 210)),
                                           ([(-300, 1806), (160, 1786), (460, 1812), (760, 1790), (1400, 1810)], (48, 60, 108), (98, 116, 178)))):
        dr = jag(pts, 41 + kind + 3 * k, 6, 30)
        c.drawPath(ridge(dr, 2100), P(col))
        rimp = rim_of(ridge(dr, 2100), (0, 5))
        if rimp is not None: c.drawPath(rimp, P(rim_c, 220))
        for j in range(14):                       # snow sparkle on the drift
            x_ = rs.uniform(-100, 1180); y_ = pts[0][1] + rs.uniform(20, 90)
            c.drawCircle(x_, y_, rs.uniform(1.2, 2.4), P((214, 226, 255), 150 + 80 * math.sin(t * 2 + j)))
    for k, (sx_, sy_, w_, h_) in enumerate(((-30, 1574, 150, 120), (110, 1594, 90, 70), (830, 1566, 170, 110), (990, 1588, 110, 90), (700, 1604, 70, 46),
                                            (40, 1760, 120, 80), (900, 1780, 160, 100))):
        if kind == 1 and k in (1, 4): continue
        _slab(c, sx_, sy_, w_, h_, rs.uniform(-0.25, 0.25), 60 + k)
    if kind == 0:
        # a throw bag lying on its side (red, black base, reflective band, drawstring top) and its yellow rope
        # paid out loose across the snow in S curves
        rp = skia.Path(); rp.moveTo(600, 1658)
        rp.cubicTo(560, 1690, 470, 1640, 420, 1668); rp.cubicTo(370, 1696, 330, 1730, 260, 1712); rp.cubicTo(200, 1696, 180, 1740, 230, 1770)
        c.drawPath(rp, SP((150, 120, 40), 8)); q_ = skia.Path(rp); q_.offset(0, -2); c.drawPath(q_, SP((240, 210, 70), 5))
        c.drawOval(skia.Rect(570, 1676, 730, 1696), P((30, 40, 80), 130, MaskFilter=blur(5)))
        # a soft sack lying on its side: rounded, sagging into the snow, cinched at the top (left) where the rope comes out
        bag = smooth_closed([(612, 1648), (636, 1630), (680, 1624), (716, 1636), (730, 1662), (716, 1686), (670, 1692), (630, 1684), (614, 1668)])
        c.drawPath(bag, P((198, 52, 54)))                                     # soft fabric: two shade tones, no hard rim
        q_ = skia.Path(bag); q_.offset(-14, -12); c.save(); c.clipPath(q_, skia.ClipOp.kDifference, True); c.drawPath(bag, P((158, 38, 46))); c.restore()
        q_ = skia.Path(bag); q_.offset(-6, -5); c.save(); c.clipPath(q_, skia.ClipOp.kDifference, True); c.drawPath(bag, P((128, 30, 40))); c.restore()
        q_ = skia.Path(bag); q_.offset(5, 6); c.save(); c.clipPath(q_, skia.ClipOp.kDifference, True); c.drawPath(bag, P((226, 92, 92))); c.restore()
        c.save(); c.clipPath(bag, skia.ClipOp.kIntersect, True)
        rb = skia.Path(); rb.moveTo(664, 1622); rb.cubicTo(658, 1650, 664, 1676, 668, 1696)
        c.drawPath(rb, SP((214, 216, 226), 6))                                  # reflective band, following the cloth
        for pts in ([(686, 1632), (700, 1650), (696, 1672), (704, 1688)], [(628, 1640), (642, 1654), (638, 1668)], [(612, 1662), (630, 1672)]):
            fp = skia.Path(); fp.moveTo(*pts[0]); lp_ = pts[0]
            for q in pts[1:]:
                fp.quadTo((lp_[0] + q[0]) / 2 + 4, (lp_[1] + q[1]) / 2, *q); lp_ = q
            c.drawPath(fp, SP((150, 34, 44), 3.5)); fp.offset(2, -2); c.drawPath(fp, SP((226, 96, 96), 1.6, 160))
        c.restore()
        neck = smooth_closed([(598, 1652), (614, 1646), (618, 1664), (600, 1668)])          # gathered drawstring neck
        c.drawPath(neck, P((170, 40, 48)))
        c.drawLine(604, 1648, 610, 1667, SP((40, 40, 50), 2.5))
        c.drawCircle(596, 1661, 4, P((40, 40, 50)))                                    # cord lock
    c.restore()


# ------------------------------------------------------------------ heart and ECG (the lens)
def ecg_v(tt, t0):
    """the cold rhythm: slow (40 a minute), a small P, QRS, then a clear Osborn (J) wave hump right after the QRS,
    and a broad T"""
    u = ((tt - t0) % 1.5)
    def g(c_, w):
        d = ((u - c_ + 0.75) % 1.5) - 0.75
        return math.exp(-(d / w) ** 2)
    return 0.12 * g(-0.17, 0.035) - 0.10 * g(-0.022, 0.008) + 1.0 * g(0.0, 0.011) - 0.30 * g(0.026, 0.010) \
        + 0.34 * g(0.058, 0.026) + 0.22 * g(0.40, 0.07)


def ecg_vf(tt):
    return (0.36 * math.sin(tt * 37) + 0.24 * math.sin(tt * 23 + 1) + 0.13 * math.sin(tt * 61)) * (0.75 + 0.25 * math.sin(tt * 3.1))


def f_w(s, size):
    return skia.Font(L.XBOLD, size).measureText(s)


def ecg(c, x0, y0, w, h, t, t0, vf_on, col, label, lab_col, lab_a):
    """solid monitor panel: rhythm name on top, a 3 s trace below that scrolls into VF at vf_on"""
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + w, y0 + h), 18, 18), P((8, 16, 22)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + w, y0 + h), 18, 18), SP(col, 3, 200))
    ty0 = y0 + 44
    for gx in range(int(x0) + 20, int(x0 + w), 35):
        c.drawLine(gx, ty0, gx, y0 + h - 8, SP((26, 52, 54), 1))
    if label and lab_a > 0.01:
        f = skia.Font(L.XBOLD, 28 if f_w(label, 28) < w - 40 else 24)
        c.drawString(label, x0 + 20, y0 + 34, f, P(lab_col, 255 * lab_a))
    c.save(); c.clipRect(skia.Rect(x0 + 4, ty0 - 6, x0 + w - 4, y0 + h - 4))
    span = 3.0
    base, amp = ty0 + (h - 34) * 0.66, (h - 34) * 0.52
    p = skia.Path(); first = True; jx = None
    n = int(w) - 40
    for i in range(0, n, 2):
        tt = t - span + span * i / n
        m = smooth((tt - vf_on) / 0.12) * (1 - smooth((tt - T['and2']) / 0.6)) if vf_on is not None else 0.0
        yv = (1 - m) * ecg_v(tt, t0) + m * ecg_vf(tt)
        X, Y = x0 + 20 + i, base - yv * amp
        if first: p.moveTo(X, Y); first = False
        else: p.lineTo(X, Y)
        if m < 0.5 and abs(((tt - t0 - 0.058 + 0.75) % 1.5) - 0.75) < 0.012 and 20 < i < n - 130: jx = (X, Y)
    c.drawPath(p, SP(col, 3.5))
    c.drawCircle(X, Y, 6, P(col))
    c.restore()
    return jx


def lens(c, t, cx, cy, r, beat, vf, chest=None):
    if r < 2: return
    if chest is not None and r > 40:
        # the lens is tied to his chest: a soft cone from the rim to a small ring over his heart
        ax, ay = chest; d = math.hypot(ax - cx, ay - cy); ux, uy = (ax - cx) / d, (ay - cy) / d
        nx, ny = -uy, ux; w_ = r * 0.42
        cone = poly([(cx + nx * w_, cy + ny * w_), (ax, ay), (cx - nx * w_, cy - ny * w_)])
        c.drawPath(cone, P((236, 244, 255), 46 * min(1, r / 150)))
        c.drawCircle(ax, ay, 34, P((236, 244, 255), 90 * min(1, r / 150), MaskFilter=blur(14), BlendMode=skia.BlendMode.kScreen))
    cp = skia.Path(); cp.addCircle(cx, cy, r)
    c.save(); c.clipPath(cp, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(cx - r, cy - r, cx + r, cy + r), cy - r, cy + r, [(44, 30, 54), (74, 40, 62)])
    for k in range(6):
        c.drawCircle(cx - r + k * r / 3, cy + 30 * math.sin(t * 0.7 + k), r * 0.25, P((110, 60, 80), 50, MaskFilter=blur(20)))
    hs = r / 180 * 0.7
    HT.draw_heart(c, cx - 8 * hs, cy + 22 * hs, hs, t, beat, vf)
    c.restore()
    c.drawCircle(cx, cy, r, SP((236, 244, 255), 7, 230))


# ------------------------------------------------------------------ frames
def titles(c, t):
    R, Y, Wt, Tl = (255, 107, 107), (255, 210, 63), (255, 255, 255), (46, 230, 214)
    L.title(c, [[('HYPOTHERMIA ', Y), ('RESCUE', Y)], [('ONE ROUGH LIFT', Wt)]], t, -0.5, T['hes'] - 0.1)
    L.title(c, [[('A COLD HEART', Wt)], [('GETS ', Wt), ('TWITCHY', Y)]], t, T['hes'], T['one'] - 0.1)
    L.title(c, [[('ONE HARD ', Wt), ('JOLT', R)]], t, T['one'], T['thats'] - 0.1)
    L.title(c, [[('IT ', Wt), ('QUIVERS', R)], [('INSTEAD OF PUMPING', Wt)]], t, T['thats'], T['and2'] - 0.1)
    L.title(c, [[('THEY MEAN', Wt)], [('TO ', Wt), ('HELP', Y)]], t, T['and2'], T['so'] - 0.3)
    L.title(c, [[('KEEP HIM ', Wt), ('FLAT', Tl)], [('MOVE HIM ', Wt), ('SLOWLY', Tl)]], t, T['so'] - 0.32, T['and3'] - 0.1)
    L.title(c, [[('SLOW, ', Wt), ('STEADY', Tl)], [('BEAT', Wt)]], t, T['and3'], None)


def series(c, t):
    series_tag(c, 'EMT TRAPS #2', 1.0)


def camera(t):
    """(cx, cy, z) of the world camera; the rescue shot pushes in slowly, the sled shot tracks the group"""
    if t < T['so'] - 0.3:
        return 528, 1215, 0.95 + 0.04 * smooth(t / T['so'])
    # framed like a film: it opens on the whole group (the puller ahead on the rope), then settles in about 1.5x
    # on the sled, the patient and the tail walker at his handle bar; the puller leads out of frame left on the rope
    x0, _, _, _ = sled_geom(t)
    u = smooth((t - T['so'] - 1.1) / 2.6)
    k = lerp(0.55, 0.575, u)                       # screen px per ref px
    z = k / SS
    gx = x0 + lerp(591, 600, u) * SS
    return gx, 1362 - 312 / z, z


def to_screen(p, cam, jx=0.0):
    cx, cy, z = cam
    return 540 + jx + (p[0] - cx) * z, 1050 + (p[1] - cy) * z


def ice_lift(t):
    # the rough lift starts, then stops when the lens opens (time held still in the story while we look inside); on
    # "jolt" a hard yank up over 9 frames, then he drops back and knocks against the ice edge (T_VF)
    lift = 0.3 * smooth(t / 2.4) + 0.03 * math.sin(t * 7.5) * (1 - smooth((t - 2.6) / 1.0))
    if t >= T['jolt']:
        u_ = t - T['jolt']
        lift = 0.3 + 0.55 * smooth(u_ / 0.30) - 0.7 * (0.35 * smooth((u_ - 0.34) / 0.26) + 0.65 * min(1.0, max(0.0, (u_ - 0.34) / 0.26)))
    if t >= T['and2']:
        lift = lift - 0.12 * smooth((t - T['and2']) / 1.5)
    return lift


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    sled = t >= T['so'] - 0.3
    cx, cy, z = camera(t)
    bg = BG_DY if sled else 0.0
    jolt = 0.0
    if T['jolt'] + 0.5 <= t < T['jolt'] + 1.4:
        jolt = math.exp(-(t - T['jolt'] - 0.5) / 0.3) * math.sin((t - T['jolt'] - 0.5) * 40)
    jx = 18 * jolt
    c.save()
    c.translate(540 + jx, 1050); c.scale(z, z); c.translate(-cx, -cy)
    hz = 1050 + (740 + bg - cy) * z if sled else 999      # screen y of the pine tops
    sky(c)
    if hz - 70 > 470: moon(c, (cx, cy, z, jx), t, min(452, hz - 70))
    c.save(); c.translate(0, bg); shore(c, t); ambulance(c, t); ice(c, t); c.restore()
    lift = ice_lift(t)
    if not sled:
        imp = math.exp(-((t - T_VF - 0.02) / 0.14) ** 2)
        ice_scene(c, t, lift, jolt, imp)
        chest = to_screen(patient_chest(t, lift, jolt), (cx, cy, z), jx)
    else:
        sled_scene2(c, t)
        chest = to_screen(sled_chest(t), (cx, cy, z), jx)
    snow(c, t, 70)
    c.restore()
    foreground(c, t, -(cx - 540) * z * 0.35, 1 if sled else 0)
    snow(c, t, 18, near=True)
    # the lens: from the chest, slow cold beats, the jolt into VF, back to slow; and again at the end
    mu = 0.0
    if T['jolt'] <= t:
        mu = smooth((t - T_VF) / 0.15) * (1 - smooth((t - T['and2']) / 0.6))
    r1 = 180 * smooth((t - LENS_ON) / 0.6) * (1 - smooth((t - T['and2'] - 0.2) / 0.5))
    r2 = 158 * smooth((t - T['and3']) / 0.35)
    r = max(r1, r2)
    if r > 2:
        lx, ly = (835, 600) if not sled else (690, 566)
        t0 = T0A if r1 >= r2 else T0B
        beat = HT.beat_at(t, t0) if (r2 > r1 or t < T_VF) else 0.0
        col = (255, 90, 90) if mu > 0.5 else (90, 255, 160)
        lens(c, t, lx, ly, r, beat, mu, chest)
        pa = smooth((r - 60) / 40)
        if pa > 0.01:
            if r2 > r1:
                lab, lc, la = 'SLOW AND STEADY', (90, 255, 160), 1.0
            elif t >= T['vent'] - 0.05 and mu > 0.5:
                lab, lc, la = 'VENTRICULAR FIBRILLATION', (255, 107, 107), smooth((t - T['vent'] + 0.05) / 0.25)
            elif t < T_VF:
                lab, lc, la = 'SLOW, COLD RHYTHM', (90, 255, 160), 1.0
            else:
                lab, lc, la = None, col, 0.0
            c.saveLayer(None, skia.Paint(Alphaf=pa))
            jp = ecg(c, 60, 512, 440, 132, t, t0, T_VF if r1 >= r2 else None, col, lab, lc, la)
            if jp is not None and r1 >= r2 and mu < 0.3:
                # point out the Osborn (J) wave on the latest beat
                f = skia.Font(L.XBOLD, 33); jxp, jyp = jp
                lx_ = min(jxp + 26, 60 + 440 - 14 - f.measureText('J WAVE'))
                c.drawLine(jxp + 4, jyp - 8, lx_ - 2, jyp - 22, SP((255, 210, 63), 3.5))
                c.drawString('J WAVE', lx_, jyp - 20, f, P((255, 210, 63)))
            c.restore()
    # red warning pulse on "stop his heart"
    wa = math.exp(-((t - T['stop'] + 0.15) / 0.35) ** 2) + 0.7 * mu * (0.5 + 0.5 * math.sin(t * 12))
    if wa > 0.02:
        vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.7, [C((255, 0, 0), 0), C((255, 0, 0), 0), C((200, 20, 30), 150 * min(1, wa))], [0, 0.55, 1.0])
        c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((4, 6, 20), 140)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    # dip to black at the cut to the sled
    d = abs(t - (T['so'] - 0.3))
    if d < 0.12: c.drawRect(skia.Rect(0, 0, W, H), P((4, 6, 16), 255 * (1 - d / 0.12)))
    L.fades(c)
    L.badge(c, 'NREMT')
    series(c, t)
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
