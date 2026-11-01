"""w1101-03-speed-camera (AP Calculus AB: the Mean Value Theorem). All code (skia), house flat style, knight v3 method.
Art plan:
- Shot A (hook): a motorway at dusk, side view, hills in hazy layers, lamp posts and the crash barrier sliding past (parallax).
  A small hatchback (code drawn, driver silhouette) brakes hard as it passes under a camera gantry: brake lights flare, the
  gantry camera's scan beam reads the plate. Why it fits: average speed (section control) cameras live on gantries over roads.
- Shot B: the camera rises to an aerial map at dusk: patchwork fields, a river, the road winding from gantry A to gantry B,
  the car (top view) driving it while a trip timer runs; "10 MILES" brackets the section; at B the timer reads 8:00.
- Shot C: 10 mi in 8 min = 75 mph against a 65 limit (chips built on the words).
- Shot D: the trip as a speed vs time graph that draws itself as the car drives along a road strip under it; the curve starts
  and ends at 60 (she braked at both cameras) and its average is exactly 75 (v = 60 + 23.56 sin(pi u), mean 75); on "exactly"
  the cursor stops where the curve crosses the dashed 75 line and the speedometer needle reads exactly 75; both crossings glow.
- Shot E: back on the motorway at gantry B: she brakes again under the camera (the loop back to the hook), chip AVERAGE 75 MPH.
Motion list for the accuracy check: speed below 65 at both gantries, above 75 in between; 10 miles / 8 minutes = 75 mph; the
graph is continuous and smooth and touches 75 at two moments; the needle and cursor agree.
POLL POST (hot take): "Calculus in everyday life?" Everywhere / Rarely; the upper middle stays clear for the first 8 s.
"""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1101/lib']
import numpy as np, skia
from lpk import *
import layout as L

ID = 'w1101-03-speed-camera'
OUT = f'/home/claude/lp/w1101/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(braked=WD.at('braked'), mean=WD.at('mean'), speeding=WD.at('speeding'), these=WD.at('these'), they=WD.at('they'),
         between=WD.at('between'), covered=WD.at('covered'), ten=WD.at('ten'), eight=WD.at('eight'), thats=WD.at("that's"),
         average=WD.at('average'), seventy=WD.at('seventy'), limit=WD.at("limit's"), sixty=WD.at('sixty'), her=WD.at('her'),
         position=WD.at('position'), smoothly=WD.at('smoothly'), jumps=WD.at('jumps'), moment=WD.at('moment'), exactly=WD.at('exactly'),
         seventy2=WD.at('seventy', 2), so=[x['t0'] for x in WD.w if x['w'].lower().strip('.,') == 'so'][1], fair=WD.at('fair'), slow=WD.at('slow'), cameras=WD.at('cameras', 3))
END = WD.end()
DUR = END + 1.6
CAP = Captions(WD.w)
R, Y, Wt, Tl = (255, 107, 107), (255, 210, 63), (255, 255, 255), (46, 230, 214)
ROSE = (232, 80, 122)
SHOT_B = T['these'] - 0.3
SHOT_D = T['her'] - 0.25
SHOT_E = T['so'] - 0.25
CAR = (60, 128, 168); CAR_SH = (40, 92, 124)
U75 = (0.21968, 0.78032)


def v_of(u):
    return 60 + 23.562 * math.sin(math.pi * u)


# ------------------------------------------------------------------ the car, side view (faces +x)
def car_side(c, x, y, s, t, brake=0.0, wheel_rot=0.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-150, 52, 160, 70), P((10, 10, 20), 120, MaskFilter=blur(6)))
    body = smooth_closed([(-150, 30), (-152, -8), (-130, -26), (-80, -36), (-50, -78), (40, -80), (90, -40), (148, -26), (158, 4), (152, 34)])
    flat(c, body, CAR, CAR_SH, sh_off=(0, 9), rim=(255, 200, 150), rim_d=(0, -3), rim_a=170)
    win = smooth_closed([(-46, -70), (36, -72), (76, -40), (-70, -38)])
    c.drawPath(win, P((30, 40, 70)))
    c.drawLine(10, -72, 6, -38, SP(CAR_SH, 7))
    # driver silhouette (head and shoulder) behind the glass
    c.drawCircle(26, -54, 13, P((16, 18, 30))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(10, -44, 44, -36), 6, 6), P((16, 18, 30)))
    c.drawPath(smooth_closed([(-40, -66), (-20, -68), (-50, -42), (-62, -42)]), P((140, 160, 210), 90))
    c.drawLine(-100, -6, 130, -6, SP(CAR_SH, 3))
    c.drawRect(skia.Rect(-20, -6, -14, 26), P(CAR_SH))
    # lights: tail / brake light at the back, headlight beam at the front
    bl = 0.35 + 0.65 * brake
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-154, -18, -140, 2), 4, 4), P((255, 60, 60), 255))
    if bl > 0.36:
        c.drawCircle(-150, -8, 40 + 40 * brake, P((255, 40, 40), 150 * brake, MaskFilter=blur(22), BlendMode=skia.BlendMode.kScreen))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(146, -16, 158, -2), 4, 4), P((255, 246, 210)))
    beam = poly([(156, -10), (520, -40), (520, 60)])
    c.drawPath(beam, P((255, 240, 200), 40, MaskFilter=blur(14)))
    for wx in (-90, 95):
        c.drawCircle(wx, 30, 30, P((22, 22, 26)))
        c.drawCircle(wx, 30, 15, P((150, 156, 166)))
        for k in range(5):
            a = wheel_rot + k * 2 * math.pi / 5
            c.drawLine(wx, 30, wx + 13 * math.cos(a), 30 + 13 * math.sin(a), SP((96, 100, 110), 3))
    c.restore()


def car_top(c, x, y, s, ang):
    c.save(); c.translate(x, y); c.rotate(math.degrees(ang)); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-30, -16, 34, 18), 9, 9), P((10, 10, 20), 110, MaskFilter=blur(4)))
    b = skia.Path(); b.addRRect(skia.RRect.MakeRectXY(skia.Rect(-32, -17, 32, 17), 9, 9))
    flat(c, b, CAR, CAR_SH, sh_off=(0, 5), rim=(255, 200, 150), rim_d=(0, -2), rim_a=180)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-12, -13, 14, 13), 5, 5), P((30, 40, 70)))
    c.drawPath(poly([(32, -10), (150, -40), (150, 40), (32, 10)]), P((255, 240, 200), 45, MaskFilter=blur(8)))
    c.drawRect(skia.Rect(-34, -13, -30, -7), P((255, 70, 70))); c.drawRect(skia.Rect(-34, 7, -30, 13), P((255, 70, 70)))
    c.restore()


# ------------------------------------------------------------------ shot A and E: the motorway at dusk
def dusk(c, t):
    lgrad(c, skia.Rect(-100, -100, 1200, 1300), 300, 1150, [(40, 40, 92), (120, 80, 132), (236, 132, 110), (255, 190, 130)], [0, 0.4, 0.78, 1])
    c.drawCircle(820, 1060, 200, P((255, 170, 110), 120, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(820, 1080, 44, P((255, 220, 170)))
    rs = np.random.default_rng(1)
    for k in range(40):
        x, y = rs.uniform(0, 1080), rs.uniform(500, 820)
        c.drawCircle(x, y, rs.uniform(0.8, 1.8), P((255, 240, 255), 90 + 60 * math.sin(t * 2 + k)))


def hills(c, t, camx):
    for i, (y0, col, haze, k) in enumerate(((1030, (120, 82, 120), (220, 140, 130), 0.04), (1070, (88, 62, 100), (200, 120, 120), 0.1),
                                            (1110, (62, 46, 80), (170, 100, 110), 0.2))):
        c.save(); c.translate(-((camx * k) % 2400), 0)
        for rep in (0, 2400):
            pts = jag([(-200 + rep, y0), (300 + rep, y0 - 60 + i * 10), (700 + rep, y0 - 20), (1200 + rep, y0 - 70), (1700 + rep, y0 - 10), (2300 + rep, y0 - 40), (2700 + rep, y0)], 3 + i, 4)
            pth = ridge(pts)
            c.drawPath(pth, P(col))
            c.save(); c.clipPath(pth, skia.ClipOp.kIntersect, True)
            lgrad(c, skia.Rect(-400 + rep, y0 - 40, 2800 + rep, y0 + 80), y0 - 40, y0 + 80, [haze + (0,), haze + (190,)])
            c.restore()
        c.restore()


def road(c, t, camx, lamps=True):
    c.drawRect(skia.Rect(-100, 1150, 1200, 2000), P((44, 40, 56)))
    c.drawRect(skia.Rect(-100, 1150, 1200, 1166), P((96, 90, 104)))
    for k in range(-1, 12):
        x = k * 160 - (camx % 160)
        c.drawRect(skia.Rect(x, 1236, x + 90, 1244), P((236, 226, 200)))
    c.drawRect(skia.Rect(-100, 1320, 1200, 1328), P((236, 226, 200)))
    # hard shoulder, verge grass and a near barrier with reflectors (fast parallax) fill the lower frame
    c.drawRect(skia.Rect(-100, 1328, 1200, 1400), P((54, 50, 64)))
    c.drawRect(skia.Rect(-100, 1400, 1200, 2000), P((74, 70, 70)))
    lgrad(c, skia.Rect(-100, 1400, 1200, 2000), 1400, 2000, [(110, 84, 90, 255), (40, 34, 52, 255)])
    rs = np.random.default_rng(12)
    for k in range(-1, 26):
        x = k * 60 - (camx * 1.35 % 60)
        h = 22 + (k * 37 % 17)
        c.drawPath(poly([(x - 8, 1420), (x + 2, 1420 - h), (x + 8, 1420)]), P((96, 76, 70)))
    c.drawRect(skia.Rect(-100, 1540, 1200, 2000), P((70, 86, 62)))
    lgrad(c, skia.Rect(-100, 1540, 1200, 2000), 1540, 2000, [(110, 110, 80, 255), (34, 40, 40, 255)])
    for k in range(-1, 40):
        x = k * 34 - (camx * 1.7 % 34); h = 30 + (k * 53 % 26)
        sw = 5 * math.sin(t * 2 + k)
        c.drawPath(poly([(x - 9, 1600), (x + sw, 1600 - h), (x + 9, 1600)]), P((60, 80, 52)))
    c.drawRect(skia.Rect(-100, 1440, 1200, 1470), P((150, 150, 164)))
    c.drawRect(skia.Rect(-100, 1462, 1200, 1470), P((112, 112, 126)))
    for k in range(-1, 6):
        x = k * 260 - (camx * 1.5 % 260)
        c.drawRect(skia.Rect(x, 1440, x + 14, 1540), P((120, 120, 134)))
        c.drawCircle(x + 7, 1455, 6, P((255, 170, 80), 220))
    # crash barrier and lamp posts (near, fast)
    c.drawRect(skia.Rect(-100, 1124, 1200, 1140), P((150, 150, 164)))
    for k in range(-1, 8):
        x = k * 220 - (camx * 1.0 % 220)
        c.drawRect(skia.Rect(x, 1124, x + 8, 1152), P((110, 110, 124)))
    for k in range(-1, 4):
        if lamps is False: break
        x = k * 520 - (camx * 0.9 % 520)
        c.drawLine(x, 1124, x, 780, SP((70, 66, 84), 8))
        c.drawLine(x, 784, x + 70, 770, SP((70, 66, 84), 7))
        c.drawCircle(x + 74, 774, 9, P((255, 226, 160)))
        c.drawCircle(x + 74, 790, 50, P((255, 220, 150), 50, MaskFilter=blur(20), BlendMode=skia.BlendMode.kScreen))


def gantry(c, x, t, label, scan=0.0):
    col, sh = (130, 132, 148), (96, 96 , 112)
    for px in (x - 330, x + 330):
        c.drawRect(skia.Rect(px - 12, 905, px + 12, 1160), P(col)); c.drawRect(skia.Rect(px + 2, 905, px + 12, 1160), P(sh))
    c.drawRect(skia.Rect(x - 350, 905, x + 350, 945), P(col)); c.drawRect(skia.Rect(x - 350, 934, x + 350, 945), P(sh))
    # the camera box and its lens
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 40, 945, x + 40, 995), 8, 8), P((210, 180, 60)))
    c.drawRect(skia.Rect(x - 40, 982, x + 40, 995), P((170, 140, 40)))
    c.drawCircle(x - 18, 982, 11, P((30, 30, 40))); c.drawCircle(x - 18, 982, 4, P((255, 70, 70), 200 + 55 * math.sin(t * 6)))
    f = skia.Font(L.BLACK, 30); w = f.measureText(label)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 60, 950, x + 60 + w + 28, 986), 10, 10), P((5, 12, 26), 220))
    c.drawString(label, x + 74, 978, f, P(Y))
    if scan > 0.01:
        beam = poly([(x - 18, 990), (x - 160, 1150), (x + 120, 1150)])
        c.drawPath(beam, P((255, 80, 80), 70 * scan, MaskFilter=blur(6)))


def highway(c, t, carx_world, cam_speed, label, brake, gx_world):
    camx = carx_world - 470
    dusk(c, t)
    hills(c, t, camx)
    road(c, t, camx)
    gx = gx_world - camx
    if -500 < gx < 1600:
        d = abs((carx_world) - gx_world)
        gantry(c, gx, t, label, scan=math.exp(-(d / 140) ** 2))
    car_side(c, 470, 1222, 1.25, t, brake=brake, wheel_rot=carx_world / 34)


def car_x_a(t):
    # she brakes from about 80 down to 60 as she reaches gantry A, then speeds up again
    return 1400 * t - 260 * smooth(t / 1.4) * t + 180 * max(0, t - 1.6) ** 2 * 0.3


def shot_a(c, t):
    z = 1.0 + 0.1 * smooth((t - 1.2) / 3.6)
    c.save(); c.translate(470, 1222); c.scale(z, z); c.translate(-470, -1222)
    x = car_x_a(t)
    brake = smooth((t - 0.0) / 0.2) * (1 - smooth((t - 2.0) / 0.5))
    highway(c, t, x, 0, 'A', brake, 820)
    v = 80 - 20 * smooth((t - 0.2) / 0.4)
    a = 1.0
    L.chip(c, f'{v:.0f} MPH' + ('  \u2713' if t > 0.65 else ''), 470, 1095, Tl if t > 0.65 else Wt, 40, a)
    if t > 1.0:
        f_, u_ = trip_f(t); secs = 480 * u_
        L.chip(c, f'TIMER  {int(secs // 60)}:{int(secs % 60):02d}', 540, 1240 - 160, Wt, 46, smooth((t - 1.0) / 0.3)) if False else None
    if t > 0.7:
        L.chip(c, 'CAMERA A: TIME STAMPED', 540, 1010, Wt, 34, smooth((t - 0.7) / 0.3) * (1 - smooth((t - 2.6) / 0.3)))
    fl = math.exp(-((t - 0.65) / 0.08) ** 2)
    if fl > 0.02: c.drawRect(skia.Rect(-200, -200, W + 200, H + 200), P((255, 240, 240), 110 * fl))
    c.restore()
    if t > 0.65:
        f_, u_ = trip_f(t); secs = 480 * u_
        L.chip(c, f'SECTION TIMER {int(secs // 60)}:{int(secs % 60):02d}', 540, 1340 - 0, Y, 40, smooth((t - 0.65) / 0.3))


def shot_e(c, t):
    u = t - SHOT_E
    x = 1500 * u - 420 * smooth(u / 1.6) * u
    brake = smooth((u - 0.2) / 0.2) * (1 - smooth((u - 3.0) / 0.5))
    highway(c, t, x, 0, 'B', brake, 1700)
    v = 80 - 20 * smooth(u / 0.8)
    L.chip(c, f'{v:.0f} MPH' + ('  \u2713' if u > 0.85 else ''), 470, 1095, Tl if u > 0.85 else Wt, 40, smooth(u / 0.3))
    fl = math.exp(-((u - 0.85) / 0.08) ** 2)
    if fl > 0.02: c.drawRect(skia.Rect(0, 0, W, H), P((255, 240, 240), 110 * fl))
    ticket(c, t, smooth((t - SHOT_E - 0.9) / 0.4))


def ticket(c, t, u):
    if u <= 0: return
    zt = 1.0 + 0.18 * smooth((t - T['slow'] + 0.4) / 1.4)
    c.save(); c.translate(540 + 900 * (1 - u), 760); c.rotate(-4 + 10 * (1 - u)); c.scale(zt, zt)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-250, -150, 250, 150), 14, 14), P((0, 0, 0), 120, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-250, -160, 250, 140), 14, 14), P((250, 244, 228)))
    c.drawRect(skia.Rect(-250, -160, 250, -110), P(R))
    f = skia.Font(L.BLACK, 34); fb = skia.Font(L.BLACK, 46); fs = skia.Font(L.XBOLD, 28)
    c.drawString('SPEEDING NOTICE', -150, -122, f, P((255, 255, 255)))
    c.drawString('SECTION A TO B', -220, -60, fs, P((90, 80, 80)))
    c.drawString('AVERAGE 75 MPH', -220, 0, fb, P((40, 30, 40)))
    fm = skia.Font(L.BLACK, 36)
    c.drawString('LIMIT 65 MPH', -220, 52, fm, P((90, 80, 80)))
    c.drawString('10 MI IN 8:00', -220, 104, fm, P((90, 80, 80)))
    st = smooth((t - T['slow'] - 0.1) / 0.18)
    if st > 0:
        c.save(); c.translate(150, 40); c.rotate(-14); c.scale(1.6 - 0.6 * st, 1.6 - 0.6 * st)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-80, -34, 80, 34), 8, 8), SP(R, 6, 255 * st))
        fz = skia.Font(L.BLACK, 40); c.drawString('FAIR', -46, 14, fz, P(R, 255 * st))
        c.restore()
    c.restore()


# ------------------------------------------------------------------ shot B and C: the aerial map
ROUTE = [(150, 1250), (270, 1200), (240, 1120), (380, 1060), (560, 1090), (700, 1010), (660, 960), (820, 935), (960, 925)]


def route_path():
    return smooth_open(ROUTE)


def smooth_open(pts):
    p = skia.Path(); p.moveTo(*pts[0])
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[i + 2] if i + 2 < len(pts) else pts[i + 1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        p.cubicTo(*c1, *c2, *p2)
    return p


RP = route_path()
MEAS = skia.PathMeasure(RP, False)
RLEN = MEAS.getLength()


def at_route(f):
    pos, tan = MEAS.getPosTan(max(0.0, min(1.0, f)) * RLEN)
    return (pos.x(), pos.y()), math.atan2(tan.y(), tan.x())


def trip_f(t):
    """fraction of the section done: the trip runs from gantry A (t0) to gantry B (t1) with the speed profile v(u)"""
    t0, t1 = 0.65, T['eight'] + 0.4
    u = max(0.0, min(1.0, (t - t0) / (t1 - t0)))
    # distance = integral of v; normalised so f(1) = 1
    return (60 * u + 23.562 / math.pi * (1 - math.cos(math.pi * u))) / 75.0, u


def map_scene(c, t):
    c.drawRect(skia.Rect(-200, -200, 1300, 2200), P((132, 166, 98)))
    rs = np.random.default_rng(7)
    cols = [(150, 184, 104), (176, 192, 110), (124, 160, 92), (206, 196, 122), (140, 176, 112)]
    for k in range(110):
        x, y = rs.uniform(-100, 1180), rs.uniform(300, 1900); w, h = rs.uniform(80, 200), rs.uniform(60, 160)
        pth = poly([(x, y), (x + w, y + rs.uniform(-20, 20)), (x + w + rs.uniform(-20, 20), y + h), (x + rs.uniform(-20, 20), y + h)])
        c.drawPath(pth, P(cols[k % 5]))
    # dusk light over the land
    lgrad(c, skia.Rect(-200, -200, 1300, 2200), 300, 1900, [(255, 190, 130, 60), (255, 150, 110, 40)])
    # river with shimmer
    rv = smooth_open([(-50, 860), (200, 820), (420, 870), (600, 800), (900, 840), (1150, 790)])
    c.drawPath(rv, SP((96, 140, 190), 26)); c.drawPath(rv, SP((150, 190, 230), 6, 120 + 80 * math.sin(t * 2)))
    # hedges and trees
    for k in range(40):
        x, y = rs.uniform(-50, 1130), rs.uniform(340, 1850)
        c.drawCircle(x + 4, y + 5, 15, P((50, 70, 40), 120)); c.drawCircle(x, y, 15, P((70, 120, 70))); c.drawCircle(x - 4, y - 4, 6, P((140, 190, 110)))
    # the road (pulses red once the verdict is in)
    c.drawPath(RP, SP((40, 38, 50), 34)); c.drawPath(RP, SP((70, 68, 80), 26))
    if t > T['sixty']:
        c.drawPath(RP, SP(R, 14, 120 * (0.5 + 0.5 * math.sin(t * 7)) * smooth((t - T['sixty']) / 0.3)))
    eff = skia.DashPathEffect.Make([16, 14], 0)
    c.drawPath(RP, skia.Paint(AntiAlias=True, Color=C((236, 226, 200), 200), Style=skia.Paint.kStroke_Style, StrokeWidth=3, PathEffect=eff))
    # gantries A and B across the road
    for f, lab in ((0.0, 'A'), (1.0, 'B')):
        (x, y), a = at_route(f)
        nx, ny = -math.sin(a), math.cos(a)
        c.drawLine(x - nx * 36, y - ny * 36, x + nx * 36, y + ny * 36, SP((210, 180, 60), 10))
        L.chip(c, lab, x + nx * 70, y + ny * 70 + 14, Y, 34, 1.0)


def shot_b(c, t):
    tb = t - SHOT_B
    z = 1.0 + 0.05 * smooth(tb / 7)
    c.save(); c.translate(540, 920); c.scale(z, z); c.translate(-540, -920)
    map_scene(c, t)
    f, u = trip_f(t)
    (x, y), a = at_route(f)
    # a light trail behind the car
    for k in range(10):
        (xk, yk), _ = at_route(max(0, f - k * 0.008))
        c.drawCircle(xk, yk, 6, P((255, 220, 160), 120 - k * 11))
    car_top(c, x, y, 2.0, a)
    c.restore()
    # the trip timer and the distance
    if True:
        secs = 480 * u
        L.chip(c, f'{int(secs // 60)}:{int(secs % 60):02d}', 800, 1310, Wt, 60, 1.0)
    if t > T['ten'] - 0.1:
        L.chip(c, '10 MILES', 780, 650, Tl, 44, smooth((t - T['ten'] + 0.1) / 0.3))
    if t > T['average'] - 0.1:
        a2 = smooth((t - T['average'] + 0.1) / 0.3)
        L.chip(c, '10 MI \u00f7 8 MIN', 540, 760, Wt, 48, a2 * (1 - smooth((t - T['seventy']) / 0.2)))
        L.chip(c, '= 75 MPH AVERAGE', 540, 760, R, 52, smooth((t - T['seventy']) / 0.2))
    if t > T['limit'] - 0.1:
        pl = 0.75 + 0.25 * math.sin(t * 8)
        L.chip(c, '75 > 65', 540, 870, R, 60, smooth((t - T['limit'] + 0.1) / 0.3), scale=pl if t > T['sixty'] + 0.4 else 1.0)
    if t > T['eight'] + 0.35:
        (bx, by), _ = at_route(1.0)
        g = math.exp(-((t - T['eight'] - 0.45) / 0.1) ** 2)
        c.drawCircle(bx, by, 60, P((255, 250, 230), 220 * g, MaskFilter=blur(20)))


# ------------------------------------------------------------------ shot D: the graph and the needle
GX0, GX1, GY0, GY1 = 120, 980, 560, 1040   # graph box: speed 50..90 from GY1 to GY0


def gy_of(v):
    return GY1 - (v - 50) / 40 * (GY1 - GY0)


def gx_of(u):
    return GX0 + u * (GX1 - GX0)


def speedometer(c, cx, cy, r, v, glow=0.0):
    c.drawCircle(cx, cy + 6, r + 4, P((0, 0, 0), 120, MaskFilter=blur(10)))
    c.drawCircle(cx, cy, r, P((24, 26, 48)))
    c.drawCircle(cx, cy, r, SP((255, 241, 214), 5))
    f = skia.Font(L.BLACK, 22)
    for k, vv in enumerate(range(0, 121, 10)):
        a = math.radians(150 + vv / 120 * 240)
        c.drawLine(cx + (r - 22) * math.cos(a), cy + (r - 22) * math.sin(a), cx + (r - 8) * math.cos(a), cy + (r - 8) * math.sin(a), SP((240, 236, 228), 3))
        if vv % 20 == 0:
            s = str(vv); w = f.measureText(s)
            c.drawString(s, cx + (r - 46) * math.cos(a) - w / 2, cy + (r - 46) * math.sin(a) + 8, f, P((240, 236, 228)))
    # the 65 limit mark
    a = math.radians(150 + 65 / 120 * 240)
    c.drawLine(cx + (r - 26) * math.cos(a), cy + (r - 26) * math.sin(a), cx + (r - 4) * math.cos(a), cy + (r - 4) * math.sin(a), SP(R, 6))
    a = math.radians(150 + v / 120 * 240)
    c.drawLine(cx, cy, cx + (r - 18) * math.cos(a), cy + (r - 18) * math.sin(a), SP(ROSE if glow < 0.5 else Y, 7))
    c.drawCircle(cx, cy, 12, P((240, 236, 228)))
    fb = skia.Font(L.BLACK, 40); s = f'{v:.0f}'; w = fb.measureText(s)
    c.drawString(s, cx - w / 2, cy + r * 0.55, fb, P(Y if glow > 0.5 else (240, 236, 228)))
    if glow > 0.01:
        c.drawCircle(cx, cy, r + 10, SP(Y, 6, 255 * glow))


def shot_d(c, t):
    # dusk sky backdrop with the road strip below: the story's car keeps driving under the graph
    dusk(c, t)
    hills(c, t, t * 300)
    c.drawRect(skia.Rect(-100, 500, 1200, 1150), P((10, 12, 34), 140))
    # graph box
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(GX0 - 60, GY0 - 40, GX1 + 40, GY1 + 70), 24, 24), P((12, 16, 40), 220))
    f = skia.Font(L.XBOLD, 26)
    for v in (60, 65, 75, 85):
        y = gy_of(v)
        if v == 75:
            eff = skia.DashPathEffect.Make([20, 12], (t * 40) % 32)
            c.drawLine(GX0, y, GX1, y, skia.Paint(AntiAlias=True, Color=C(Y), Style=skia.Paint.kStroke_Style, StrokeWidth=4, PathEffect=eff))
        elif v == 65:
            c.drawLine(GX0, y, GX1, y, SP(R, 3, 200))
        else:
            c.drawLine(GX0, y, GX1, y, SP((90, 96, 130), 2))
        c.drawString(str(v), GX0 - 52, y + 9, f, P(Y if v == 75 else (R if v == 65 else (200, 204, 220))))
    c.drawString('mph', GX0 - 52, GY0 - 8, f, P((200, 204, 220)))
    c.drawString('A', GX0 - 8, GY1 + 44, f, P(Y)); c.drawString('B', GX1 - 8, GY1 + 44, f, P(Y))
    c.drawString('8 min', (GX0 + GX1) / 2 - 30, GY1 + 44, f, P((200, 204, 220)))
    # the curve draws itself with the trip; on "exactly" the cursor eases to the first crossing and stops there
    d0, d1 = T['her'] - 0.1, T['jumps'] + 0.3
    uc = smooth((t - d0) / (d1 - d0))
    if t > T['moment'] - 0.4:
        # sweep to the crossing
        uc = 1.0
    pth = skia.Path(); pth.moveTo(gx_of(0), gy_of(v_of(0)))
    n = 120
    for k in range(1, n + 1):
        u = k / n * uc
        pth.lineTo(gx_of(u), gy_of(v_of(u)))
    c.drawPath(pth, SP(Tl, 8))
    # area above 75 balances area below (average exactly 75): soft shading after the curve is done
    sh = 0
    if sh > 0:
        above = skia.Path(); below = skia.Path()
        above.moveTo(gx_of(U75[0]), gy_of(75)); below.moveTo(gx_of(0), gy_of(75))
        for k in range(0, 101):
            u = U75[0] + (U75[1] - U75[0]) * k / 100; above.lineTo(gx_of(u), gy_of(v_of(u)))
        above.close()
        for k in range(0, 101):
            u = k / 100; below.lineTo(gx_of(u), gy_of(min(75, v_of(u))))
        below.lineTo(gx_of(1), gy_of(75)); below.close()
        c.drawPath(above, P(R, 70 * sh)); c.drawPath(below, P(Tl, 50 * sh))
    # cursor
    if t < T['moment'] - 0.4:
        u_cur = uc
    else:
        u_cur = 1.0 - (1.0 - U75[0]) * smooth((t - T['moment'] + 0.4) / 1.4)
        u_cur = max(U75[0], u_cur) if t < T['exactly'] + 0.5 else U75[0]
    xc, yc = gx_of(u_cur), gy_of(v_of(u_cur))
    c.drawLine(xc, GY0, xc, GY1, SP((255, 255, 255), 2, 120))
    c.drawCircle(xc, yc, 14, P((255, 255, 255)))
    hit = smooth((t - T['exactly']) / 0.3)
    if hit > 0:
        for uu in U75:
            g = 0.6 + 0.4 * math.sin(t * 8)
            c.drawCircle(gx_of(uu), gy_of(75), 22, SP(Y, 6, 255 * hit * g))
            c.drawCircle(gx_of(uu), gy_of(75), 40, P(Y, 80 * hit * g, MaskFilter=blur(12)))
        L.chip(c, 'EXACTLY 75', xc + 40, gy_of(75) - 150, Y, 40, hit, anchor=(xc, gy_of(75) - 22))
    if t > T['position'] - 0.1:
        L.chip(c, 'POSITION: NO JUMPS', 640, GY1 - 60, Tl, 36, smooth((t - T['smoothly']) / 0.3) * (1 - hit))
    # the road strip and the car driving under the graph, matched to the cursor
    road(c, t, t * 700, lamps=False)
    car_side(c, 190 + 430 * u_cur, 1222, 0.9, t, brake=0.0, wheel_rot=t * 20)
    speedometer(c, 900, 1225, 125, v_of(u_cur), glow=hit)


def titles(c, t):
    L.title(c, [[('MEAN VALUE', Y)], [('THEOREM', Y)]], t, -0.5, SHOT_B + 0.05)
    L.title(c, [[('TIMED FROM', Wt)], [('CAMERA TO CAMERA', Y)]], t, SHOT_B - 0.05, T['thats'] + 0.05)
    L.title(c, [[('AVERAGE ', Wt), ('75', R)], [('LIMIT ', Wt), ('65', Wt)]], t, T['thats'] - 0.05, SHOT_D + 0.05)
    L.title(c, [[('SOMEWHERE SHE WAS', Wt)], [('GOING EXACTLY 75', Y)]], t, SHOT_D - 0.05, SHOT_E + 0.05)
    L.title(c, [[('SLOW AT BOTH', Wt)], [('STILL SPEEDING', R)]], t, SHOT_E - 0.05, None)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    if t < SHOT_B: shot_a(c, t)
    elif t < SHOT_D: shot_b(c, t)
    elif t < SHOT_E: shot_d(c, t)
    else: shot_e(c, t)
    for tc in (SHOT_B, SHOT_D, SHOT_E):
        d = abs(t - tc)
        if d < 0.07: c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 24), 200 * (1 - d / 0.07)))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((8, 6, 20), 130)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    L.fades(c)
    L.badge(c, 'AP CALCULUS AB')
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
