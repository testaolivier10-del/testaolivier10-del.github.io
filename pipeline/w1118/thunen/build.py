"""w1118-03-von-thunen (AP Human Geography, CED 5.10). 1080x1920, 30 fps, everything drawn in code with skia.
LOGLINE: a farmer pours out milk that soured on the long cart ride to the city; the von Thunen model shows he is farming the wrong
thing for how far out he lives, so he sells his cows and plants wheat.
BEATS: hook 0-5.9 (the pour, the stake, the search phrase) / why it spoils 5.9-9.1 (the push to his face, he looks at the far city) /
the man who worked it out 9.1-13.7 (close on his face, the book THE ISOLATED STATE 1826) / the model arrives in the land 13.7-23.6
(camera cranes up over him: the bid rent cone over the city, the road from his farm lights, distance ripples, a milk pulse souring
on the way) / the rings on their words 23.6-35.9 (milk and vegetables, firewood, grain, cattle; cows walk in to market) / where he
is 35.9-38.6 (pin on his farm in the grain ring) / payoff 38.6-45 (his field: SOLD on the empty pasture gate, he sows wheat by hand,
the wheat grows gold; CTA, short end line).
COLOUR SCRIPT: warm summer morning, key light low from the upper left (sun), green and gold fields, soft haze toward the city;
the map shot keeps the same sun; brightest moment = the grain ring glowing gold under the pin; payoff in golden late light.
SHOT LIST (times from out/words.json, voice sped 5 percent):
 1  0.00-9.07  medium, eye level, slow push, then an accelerating push to his face at 5.9; the farmer tips a churn, soured milk pours
               in a lumpy stream into the ditch; two cows graze behind; unhitched cart on the road; the city on the horizon. He turns
               to look at the city at 'spoils'. Sound: milk pour.
 2  9.07-13.71 close (zoom cut), his face: grimace easing to thought; parchment card THE ISOLATED STATE 1826 beside him at 'von Thunen'.
 3 13.71-23.62 crane up from in front of him (he stays in the lower foreground) to a high oblique view of the plain around the city;
               cone of land rent rises over the city ('costs more'), the road from his farm glows ('trip ... costs less'), ripples
               ('how far'), a milk pulse turns sour on the road ('how fast it spoils').
 4 23.62-35.89 same high view drifting: rings paint in on their words (MILK + VEGETABLES, FIREWOOD, GRAIN, CATTLE), each band glows
               then settles with its crop painted in; at 'walk' cows walk in along the roads toward the city (accent on cattle only).
 5 35.89-38.63 push toward his farm: a pin drops on it (OUR FARMER), the grain ring pulses gold.
 6 38.63-45.00 hard cut to ground level: his field, SOLD board on the gate of the empty pasture, he broadcasts seed by hand; time lapse,
               the wheat comes up and turns gold; he smiles. CTA over it; short end line.
FACTS SHOWN: rings from the city out: dairy and market gardening, forest for firewood, grain, livestock ranching, then wilderness;
land rent highest at the city falling with distance; one city, flat land, one road type (carts). His farm is in the grain ring.
PEOPLE: one farmer, a new design (cast.py). No horse (the cart stands unhitched with its shafts resting on the road, seen from behind).
No buyer (the model has no walk): the cows are simply gone and a SOLD board hangs on the gate."""
import sys, math, functools
sys.path[:0] = ['/home/claude/w1118/thunen', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import person as PN
import cast as K
import cow as CW
import world as WO
import mapview as MV
import hands as H
import kit
from kit import Words, Short, Wt, Y, R, TL, OR
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from person import track
import layout as L

DUR, T_END = 45.0, 44.15                               # the OLD timeline every shot below is written in (see the edit at the end)
T2, T3, T4, T5, T6 = 9.07, 13.71, 23.62, 35.89, 38.63
GOLD = (255, 206, 84); GRN = (120, 220, 130)
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
SERIF = skia.Typeface.MakeFromName('DejaVu Serif', skia.FontStyle.Bold()) or MONT


def ease(u): return smooth(max(0.0, min(1.0, u)))


# ======================================================================= shot 1 and 2: the pour, then his face
FX, FG, FS = 330.0, 1400.0, 0.82                       # the farmer on the verge: x, feet, scale
BW = K.FARMER['cfg']['bw']


def to_scr(p): return (FX + p[0] * FS * BW, FG + p[1] * FS)


def churn_state(t):
    """the churn's centre and tilt (radians) and how hard the milk flows. Both hands stay on it all through: his left hand on the upper
    handle, his right hand under the base; at the end he tips it partly back up and the stream thins"""
    tilt = math.radians(track([(0, 108), (2.0, 111), (4.0, 114), (5.3, 116), (6.05, 94)], t) + 1.5 * math.sin(t * 5.3))
    Cc = (track([(0, 190), (5.3, 190), (6.05, 172)], t), track([(0, -600), (5.3, -600), (6.05, -628)], t))
    flow = ease((math.degrees(tilt) - 80) / 18.0) * (1 - 0.6 * ease((t - 5.3) / 0.7))
    return tilt, Cc, flow


def farmer_pour(t):
    tilt, Cc, flow = churn_state(t)
    G = K.handle_pt(Cc, tilt, -1)
    angl = math.radians(60)
    base = K.cpt(Cc, tilt, 64, 204)
    angr = math.radians(-24)
    def prop(c, AR, AL): K.churn(c, Cc, tilt)
    look_city = ease((t - 4.9) / 0.6)
    blink = 0.1 if (abs(t - 3.2) < 0.07) else None
    ps = K.pose(ik_l=K.hand_wrist(G, angl, 46), hand_ang_l=angl, ik_bend_l=-1.0,
                ik_r=K.hand_wrist(base, angr, 40), hand_ang_r=angr,
                l_hand=dict(curls=(0.72, 0.86, 0.9, 0.9, 0.88), spread=0.02),
                r_hand=dict(curls=(0.4, 0.62, 0.7, 0.72, 0.74), spread=0.06), prop=prop,
                breath=0.5 + 0.5 * math.sin(t * 2.2), lean=lerp(-2.5, 0, look_city), sway=-6,
                head_yaw=lerp(0.22, 0.5, look_city), head_tilt=lerp(7, -2, look_city),
                look=(lerp(0.55, 0.95, look_city), lerp(0.85, -0.1, look_city)),
                worry=0.9, frown=1.0, brow=0.3, lid=blink or 0.62, smile=0.0)
    return ps, tilt, Cc, flow


COWS1 = ((150, 1196, 0.78, 1, CW.RED, 0.0), (470, 1118, 0.52, -1, CW.PIED, 2.0))


def shot_pour(c, t):
    if t < 6.1:                                               # open close on the splash and his sour face, then ease out to the whole scene
        u = ease(t / 2.6); z = lerp(1.16, 1.03, u) + 0.01 * t; cen = (lerp(610, 540, u), lerp(1000, 962, u))
    elif t < T2:
        u = (t - 5.9) / (T2 - 5.9); e = u * u * (3 - 2 * u)
        z = lerp(1.07, 1.85, e ** 1.3); cen = (lerp(520, 352, e), lerp(930, 640, e))
    else:
        u = (t - T2) / (T3 - T2); z = lerp(2.95, 3.25, u); cen = (lerp(364, 360, u), lerp(628, 622, u))
    V = WO.View(z, cen)
    bl = max(0.0, (z - 1.15) * 7)
    if bl > 0.3: c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(bl, bl)))
    c.save(); V.apply(c, 0.15); WO.sky(c, t); c.restore()
    c.save(); V.apply(c, 0.4); WO.far_land(c, t); c.restore()
    c.save(); V.apply(c, 0.75)
    WO.pasture(c, t); WO.fence(c, -60, 660, 1082, 1060, h=56); WO.road(c, t)
    for (x, y, s, f, look, ph) in COWS1:
        gz = 0.5 + 0.5 * math.sin(t * 0.45 + ph); CW.cow(c, x, y, s, t, facing=f, look=look, graze=0.65 + 0.35 * gz, chew=t if gz > 0.5 else 0.0, tail=0.6 * math.sin(t * 1.7 + ph), ph=ph)
    WO.cart(c, 900, 1150, 0.95)
    c.restore()
    if bl > 0.3: c.restore()
    c.save(); V.apply(c, 1.0)
    WO.verge(c, t)
    tufts_far = lambda y: WO.ditch_x(y) - 20
    WO.tufts(c, t, ymin=1240, xmax=tufts_far)
    ps, tilt, Cc, flow = farmer_pour(t)
    mouth = to_scr(K.cpt(Cc, tilt, 0, -196)); a = (math.sin(tilt), -math.cos(tilt))
    land = (WO.ditch_x(1398) - 8, 1398)
    WO.pool(c, (land[0] + 6, 1402), min(1.0, 0.3 + t / 5.0) * (1.0 if t < 7 else 1.0))
    K.farmer(c, ps, FX, FG, FS)
    end = WO.stream(c, mouth, a, flow, t, scale=1.0, ground=1398)
    if end: WO.splash(c, end, t, flow)
    WO.motes(c, t)
    c.restore()


def book_card(c, t):
    a = ease((t - 11.35) / 0.35) * (1 - ease((t - 13.45) / 0.25))
    if a <= 0: return
    c.save(); c.translate(880, 1200); c.rotate(4 - 2 * a); s = (0.9 + 0.1 * a) * 0.78; c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-150, -190, 150, 190), 10, 10), P((0, 0, 0), 110 * a, MaskFilter=blur(14)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-146, -196, 146, 180), 8, 8), P((120, 70, 52), 255 * a))           # a leather bound book
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-128, -180, 128, 164), 4, 4), SP((214, 176, 110), 3, 255 * a))
    c.drawRect(skia.Rect(-146, -196, -128, 180), P((90, 50, 40), 255 * a))
    for i, (txt, sz, y) in enumerate((('THE', 30, -110), ('ISOLATED', 40, -64), ('STATE', 40, -18))):
        f = skia.Font(SERIF, sz); w = f.measureText(txt); c.drawString(txt, -w / 2 + 6, y, f, P((236, 206, 140), 255 * a))
    c.drawLine(-70, 14, 82, 14, SP((214, 176, 110), 2.5, 255 * a))
    f = skia.Font(SERIF, 26); txt = 'VON THÜNEN'; w = f.measureText(txt); c.drawString(txt, -w / 2 + 6, 62, f, P((236, 206, 140), 255 * a))
    f = skia.Font(SERIF, 44); txt = '1826'; w = f.measureText(txt); c.drawString(txt, -w / 2 + 6, 132, f, P((255, 226, 160), 255 * a))
    c.restore()


# ======================================================================= shots 3 to 5: the model in the land
def cam_at(t):
    fx, fz = MV.FARM
    k0 = (fx + 0.03, 0.12, fz - 0.42, 6.0)
    k1 = (fx + 0.02, 0.55, fz - 0.95, 20.0)
    k2 = (-0.15, 3.0, -4.6, 38.0)
    k3 = (-0.1, 3.15, -4.75, 38.5)
    k4 = (-0.36, 2.0, -3.95, 33.0)
    if t < 17.6: u = ease((t - T3) / (17.6 - T3)) ; A, B = k0, k1; u = u ** 1.35
    elif t < 23.4: u = ease((t - 17.6) / 5.8); A, B = k1, k2
    elif t < 35.9: u = (t - 23.4) / 12.5; A, B = k2, k3
    else: u = ease((t - 35.9) / 2.4); A, B = k3, k4
    v = [lerp(a_, b_, u) for a_, b_ in zip(A, B)]
    return MV.Cam(v[0], v[1], v[2], v[3])


RING_T = (23.62, 26.67, 28.95, 32.91)
LAB = (('MILK + VEGETABLES', 0.5 * (MV.RC + MV.R1), math.radians(70), (560, 580)), ('FIREWOOD', 0.5 * (MV.R1 + MV.R2), math.radians(170), (250, 760)),
       ('GRAIN', 0.5 * (MV.R2 + MV.R3), math.radians(-15), (860, 1010)), ('CATTLE', 0.5 * (MV.R3 + MV.R4), math.radians(-160), (230, 1200)))
RADII = ((MV.RC, MV.R1), (MV.R1, MV.R2), (MV.R2, MV.R3), (MV.R3, MV.R4))
_rs = np.random.default_rng(31)
BARNS = [(0.66 * math.cos(a), 0.66 * math.sin(a)) for a in (0.5, 2.3, 4.2, 5.4)]
FARMS = [(2.25 * math.cos(a), 2.25 * math.sin(a)) for a in (0.3, 1.2, 2.5, 3.4)]
DCOWS = [(0.82 * math.cos(a), 0.82 * math.sin(a), a) for a in (0.9, 2.9, 4.6, 5.8)]
RCOWS = [(r * math.cos(a), r * math.sin(a), a) for r, a in ((3.1, 0.2), (3.4, 0.9), (3.0, 1.7), (3.5, 2.4), (3.2, 3.0), (3.6, 3.5), (3.3, 6.0), (3.25, 5.75))]
_rg = np.random.default_rng(77)
GTUFTS = [(MV.FARM[0] + _rg.uniform(-0.9, 0.9), MV.FARM[1] + _rg.uniform(-0.8, 0.6), _rg.uniform(0, 1)) for _ in range(260)]
WALKERS = [(MV.ROAD_ANG[1], 0.0), (MV.ROAD_ANG[3], 0.35), (MV.ROAD_ANG[5], 0.7)]


def reveal(i, t):
    return ease((t - RING_T[i]) / 0.95)


def sweep_angle(i, t):
    return -math.pi / 2 + 2 * math.pi * reveal(i, t) * 1.001     # starts toward the camera, goes round


def map_ground(c, cam, draw_fn):
    zmin = max(-MV.MR, cam.zmin(0.08))
    src = [MV.m2p(-MV.MR, MV.MR), MV.m2p(MV.MR, MV.MR), MV.m2p(MV.MR, zmin), MV.m2p(-MV.MR, zmin)]
    dst = [cam.pr(-MV.MR, 0, MV.MR), cam.pr(MV.MR, 0, MV.MR), cam.pr(MV.MR, 0, zmin), cam.pr(-MV.MR, 0, zmin)]
    m = skia.Matrix(); m.setPolyToPoly([skia.Point(*p) for p in src], [skia.Point(*p) for p in dst])
    c.save(); c.concat(m); c.clipRect(skia.Rect(0, src[0][1], MV.MS, src[2][1])); draw_fn(c); c.restore()


SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)


@functools.lru_cache(None)
def mip(i):
    img = MV.base_map() if i < 0 else MV.ring_layer(i)
    return img.withDefaultMipmaps()


def chipw(c, txt, x, y, col, a, size=40, anchor=None):
    if a > 0.01: L.chip(c, txt, x, y, col, size=size, a=a, anchor=anchor)


def standing(c, cam, items):
    items.sort(key=lambda it: -cam.depth(it[0], 0.05, it[1]))
    for it in items: it[2]()


NOLABEL = False


def map_scene(c, t):
    cam = cam_at(t)
    hy = cam.horizon()
    if hy > -200:
        c.save(); c.translate(0, hy - WO.HY + 10); WO.sky(c, t, sun=(-400, 300)); c.restore()
    c.drawRect(skia.Rect(-10, max(-10, hy), 1090, 1930), P((118, 146, 96)))
    def ground(cc):
        cc.drawImage(mip(-1), 0, 0, SAMP)
        for i in range(4):
            rv = reveal(i, t)
            if rv <= 0: continue
            cc.save(); cc.clipPath(MV.annulus(*RADII[i], -math.pi / 2, sweep_angle(i, t)), skia.ClipOp.kIntersect, True)
            cc.drawImage(mip(i), 0, 0, SAMP)
            glow = 1.0 - 0.75 * ease((t - RING_T[i] - 0.9) / 1.4)
            if i == 2: glow = max(glow, 0.55 * ease((t - 37.2) / 0.4) * (0.75 + 0.25 * math.sin(t * 6)))
            if i == 3: glow = max(glow, 0.5 * ease((t - 33.7) / 0.3) * (1 - ease((t - 35.2) / 0.8)))
            cc.drawPaint(P(MV.RING_COL[i], 90 * glow))
            cc.restore()
            cx, cy = MV.m2p(0, 0)
            for r in RADII[i]:
                if r < MV.RC + 0.01: continue
                cc.save(); cc.clipPath(MV.annulus(r - 0.3, r + 0.3, -math.pi / 2, sweep_angle(i, t)), skia.ClipOp.kIntersect, True)
                cc.drawCircle(cx, cy, r * MV.MPX, SP(mix(MV.RING_COL[i], (255, 255, 255), 0.5), 26, 200 * (0.35 + 0.65 * glow), MaskFilter=blur(10), BlendMode=skia.BlendMode.kScreen))
                cc.drawCircle(cx, cy, r * MV.MPX, SP((255, 255, 240), 5, 220 * (0.4 + 0.6 * glow)))
                cc.restore()
        fp = skia.Path(); x0, y0 = MV.m2p(MV.FARM[0] - 0.32, MV.FARM[1] + 0.34); x1, y1 = MV.m2p(MV.FARM[0] + 0.32, MV.FARM[1] - 0.22)
        fp.addRect(skia.Rect(x0, y0, x1, y1)); cc.drawPath(fp, P((150, 196, 104))); cc.drawPath(fp, SP((120, 84, 56), 6))   # his own fenced pasture
        # the road from his farm to the city lights up; a cream pulse runs it and turns sour on the way
        rg = ease((t - 15.75) / 0.5) * (1 - ease((t - 23.4) / 0.6))
        if rg > 0:
            fr = MV.farm_road(); cc.drawPath(fr, SP((255, 226, 140), 40, 150 * rg, MaskFilter=blur(14), BlendMode=skia.BlendMode.kScreen)); cc.drawPath(fr, SP((255, 246, 200), 12, 255 * rg))
            for k in range(3):
                u = ((t - 15.75) * 0.45 + k / 3) % 1.0
                if t < 22.1: q = MV.m2p(MV.FARM[0] * (1 - u), MV.FARM[1] * (1 - u)); cc.drawCircle(*q, 16, P((255, 255, 230), 255 * rg * math.sin(u * math.pi), MaskFilter=blur(4)))
        if 22.1 < t < 23.9:                                   # how fast it spoils: a load of milk sets off from his farm and has turned sour before the city
            u = ease((t - 22.1) / 1.25); fo = 1 - ease((t - 23.5) / 0.4)
            for j in range(12):
                v = u * j / 11; q = MV.m2p(MV.FARM[0] * (1 - v), MV.FARM[1] * (1 - v)); col = mix((250, 248, 232), (150, 196, 60), ease((v - 0.15) / 0.6))
                cc.drawCircle(*q, 26, P(col, 150 * fo, MaskFilter=blur(8)))
            q = MV.m2p(MV.FARM[0] * (1 - u), MV.FARM[1] * (1 - u)); col = mix((250, 248, 232), (150, 196, 60), ease((u - 0.15) / 0.6))
            cc.drawCircle(*q, 80, P(col, 200 * fo, MaskFilter=blur(22))); cc.drawCircle(*q, 40, P(col, 255 * fo)); cc.drawCircle(*q, 40, SP((255, 255, 255), 6, 220 * fo))
        for k in range(3):                                    # how far it has to travel: rings of distance spread from the city
            u = (t - 20.2 - k * 0.35) / 1.6
            if 0 < u < 1: cc.drawCircle(*MV.m2p(0, 0), (0.3 + 3.6 * u) * MV.MPX, SP((255, 255, 255), 8, 200 * (1 - u)))
    map_ground(c, cam, ground)
    c.drawRect(skia.Rect(-10, hy - 10, 1090, hy + 300), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, hy), skia.Point(0, hy + 300)], [C((226, 232, 226), 170), C((226, 232, 226), 0)])))
    for (X, Z, k) in GTUFTS:                                  # standing grass around his farm, for the low start of the crane
        if cam.depth(X, 0, Z) < 0.15: continue
        sc = MV.sprite_scale(cam, X, Z) * 1100 * 0.05
        if sc < 4: continue
        gx, gy = cam.pr(X, 0, Z); sw = 0.12 * sc * math.sin(t * 1.6 + X * 40)
        for d_ in (-0.3, -0.1, 0.1, 0.3): c.drawLine(gx + d_ * sc * 0.4, gy, gx + d_ * sc + sw, gy - sc, SP(mix((96, 138, 70), (170, 200, 110), k), max(1.2, sc * 0.08), 230))
    # the bid rent cone over the city
    cg = ease((t - 13.95) / 0.9) * (1 - ease((t - 23.3) / 0.7))
    if cg > 0:
        HC = 1.25 * cg
        base_pts = [cam.pr(MV.R4 * math.cos(a), 0, MV.R4 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 64)]
        apex = cam.pr(0, HC, 0)
        pts = base_pts + [apex]
        hull = _hull(pts)
        p = skia.Path(); p.addPoly([skia.Point(*q) for q in hull], True)
        lo = max(base_pts, key=lambda q: q[1])
        c.drawPath(p, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(*apex), skia.Point(*lo)], [C((255, 196, 80), int((70 - 40 * ease((t - 17.0) / 1.5)) * cg)), C((255, 220, 120), 0)])))
        for r in (MV.R1, MV.R2, MV.R3):
            hh = HC * (1 - r / MV.R4); q = [cam.pr(r * math.cos(a), hh, r * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 64)]
            pp = skia.Path(); pp.addPoly([skia.Point(*x) for x in q], True); c.drawPath(pp, SP((255, 240, 190), 3, 170 * cg))
        c.drawCircle(*apex, 22, P((255, 240, 180), 230 * cg, MaskFilter=blur(8)))
        la = ease((t - 14.5) / 0.3) * (1 - ease((t - 17.9) / 0.3))
        if la > 0: chipw(c, 'LAND COSTS MORE', 540, max(580, apex[1] - 80), (255, 120, 100), la, size=66, anchor=apex)
    # standing things, far to near
    items = []
    for (X, Z, w, d, h, rot, wall, roof) in MV.HOUSES:
        items.append((X, Z, (lambda X=X, Z=Z, w=w, d=d, h=h, rot=rot, wall=wall, roof=roof: MV.box(c, cam, X, Z, w, d, h, rot, wall, roof))))
    for (X, Z, h) in MV.SPIRES: items.append((X, Z, (lambda X=X, Z=Z, h=h: MV.spire(c, cam, X, Z, h))))
    def ang_ok(i, X, Z):
        a = math.atan2(Z, X); s0 = -math.pi / 2; a = (a - s0) % (2 * math.pi) + s0
        return reveal(i, t) > 0 and a <= sweep_angle(i, t)
    for (X, Z) in BARNS:
        if ang_ok(0, X, Z): items.append((X, Z, (lambda X=X, Z=Z: MV.box(c, cam, X, Z, 0.2, 0.12, 0.1, math.atan2(Z, X) + 1.2, (236, 226, 206), (176, 64, 50)))))
    for (X, Z) in FARMS:
        if ang_ok(2, X, Z): items.append((X, Z, (lambda X=X, Z=Z: MV.box(c, cam, X, Z, 0.08, 0.06, 0.045, math.atan2(Z, X) + 0.5, (240, 230, 210), (160, 80, 60)))))
    fx, fz = MV.FARM
    items.append((fx + 0.22, fz + 0.28, lambda: MV.box(c, cam, fx + 0.22, fz + 0.28, 0.13, 0.09, 0.075, 0.4, (240, 232, 212), (170, 84, 62))))
    for (X, Z, a) in DCOWS:
        if ang_ok(0, X, Z): items.append((X, Z, (lambda X=X, Z=Z, a=a: cow_at(c, cam, X, Z, t, a, graze=True, k=3.4))))
    for (X, Z, a) in RCOWS:
        if ang_ok(3, X, Z): items.append((X, Z, (lambda X=X, Z=Z, a=a: cow_at(c, cam, X, Z, t, a, graze=True))))
    wk = ease((t - 33.75) / 0.4)
    if wk > 0:                                                # they walk to market themselves: cows coming in along the roads
        for (ra, off) in WALKERS:
            r = MV.R4 - 0.08 - (t - 33.75) * 0.11 - off * 0.25
            X, Z = r * math.cos(ra), r * math.sin(ra)
            items.append((X, Z, (lambda X=X, Z=Z, ra=ra: cow_at(c, cam, X, Z, t, ra + math.pi, walk=(t * 1.4) % 1.0, fade=wk))))
    # our farmer and his two cows, at his farm (they are there until he sells them)
    items.append((fx - 0.15, fz + 0.16, lambda: cow_at(c, cam, fx - 0.15, fz + 0.16, t, 0.3, graze=True)))
    items.append((fx + 0.12, fz + 0.1, lambda: cow_at(c, cam, fx + 0.12, fz + 0.1, t, 2.6, graze=True, pied=True)))
    items.append((fx, fz, lambda: farmer_map(c, cam, t)))
    standing(c, cam, items)
    # labels on the rings
    for i, (txt, r, a, lp0) in enumerate(LAB):
        la = ease((t - RING_T[i] - 0.25) / 0.3)
        if la <= 0 or NOLABEL: continue
        gp = cam.pr(r * math.cos(a), 0, r * math.sin(a)); lp = lp0
        chipw(c, txt, lp[0], lp[1], MV.RING_COL[i], la, size=64 if i == 0 else 72, anchor=gp)
    # the pin on his farm
    pa = ease((t - 36.15) / 0.25)
    if pa > 0 and not NOLABEL:
        gp = cam.pr(fx, 0, fz); drop = (1 - ease((t - 36.15) / 0.45)) * -260
        bounce = math.exp(-(t - 36.6) * 7) * math.sin((t - 36.6) * 26) * 16 if t > 36.6 else 0
        pin(c, gp[0], gp[1] - 230 + drop + bounce, pa)
        chipw(c, 'OUR FARMER', min(800, gp[0] + 300), gp[1] - 30, GOLD, ease((t - 36.45) / 0.3), size=60, anchor=(gp[0] + 40, gp[1] - 240 + drop + bounce))


def _hull(pts):
    pts = sorted(set((round(x, 2), round(y, 2)) for x, y in pts))
    def cr(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cr(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]


def pin(c, x, y, a):
    c.save(); c.translate(x, y)
    c.drawOval(skia.Rect(-30, 216, 30, 236), P((0, 0, 0), 90 * a, MaskFilter=blur(6)))
    c.drawLine(0, 40, 0, 226, SP((240, 240, 240), 7, 255 * a))
    head = smooth_closed([(0, 64), (-40, 6), (-44, -30), (-22, -60), (22, -60), (44, -30), (40, 6)])
    c.drawPath(head, P((0, 0, 0), 80 * a, MaskFilter=blur(8))); c.drawPath(head, P((226, 62, 62), 255 * a)); c.drawCircle(0, -20, 17, P((255, 255, 255), 255 * a))
    c.drawPath(head, SP((255, 255, 255), 5, 230 * a)); c.restore()


def cow_at(c, cam, X, Z, t, a, graze=False, walk=None, pied=False, alpha=1.0, k=5.6, **kw):
    if cam.depth(X, 0, Z) < 0.1: return
    sx, sy = cam.pr(X, 0, Z); s = MV.sprite_scale(cam, X, Z) * k
    if s * 300 < 6: return
    side = math.cos(a) * 1 + 0.0                              # walking or facing direction on screen: left or right
    f = 1 if math.cos(a) >= 0 else -1
    gz = 0.5 + 0.5 * math.sin(t * 0.5 + X * 7) if graze else 0.0
    if kw.get('fade') is not None and kw['fade'] < 1: c.saveLayer(None, P((0, 0, 0), 255 * kw['fade']))
    CW.cow(c, sx, sy, s, t, facing=f, look=CW.PIED if pied else CW.RED, graze=gz, tail=0.5 * math.sin(t * 1.5 + Z * 5), walk=walk, shadow=True)
    if kw.get('fade') is not None and kw['fade'] < 1: c.restore()


def farmer_map(c, cam, t):
    fx, fz = MV.FARM
    if cam.depth(fx, 0, fz) < 0.05: return
    sx, sy = cam.pr(fx, 0, fz); s = MV.sprite_scale(cam, fx, fz)
    ps = K.pose(breath=0.5 + 0.5 * math.sin(t * 2.2), head_yaw=0.5 * math.sin(min(1.0, (t - T3) / 3) * math.pi / 2), look=(0.8, -0.4), head_tilt=-4,
                r_up=8, r_fore=6, l_up=8, l_fore=10, worry=0.4, brow=0.5)
    K.farmer(c, ps, sx, sy, s)
    hb = K.cpt((0, 0), 0, 0, 0)
    K_ = s; c.save(); c.translate(sx + 300 * s, sy - 196 * s); c.scale(K_, K_); K.churn(c, (0, 0), 0.0); c.restore()   # the empty churn on the ground beside him


# ======================================================================= shot 6: the payoff in his field
SEED_T0 = 39.85; SEED_P = 1.25; NSOW = 1
FX6, FG6, FS6 = 560.0, 1430.0, 0.84


def sow_phase(t):
    k = int((t - SEED_T0) // SEED_P); u = (t - SEED_T0) / SEED_P - k
    return k, u


def sow_targets(t):
    """broadcast sowing: the right hand dips into the bag, sweeps out and up to the side, opens to fling the seed, comes back"""
    k, u = sow_phase(t)
    bag = (-70.0, -560.0); out = (-370.0, -770.0)
    if t < SEED_T0 or k >= NSOW:
        rest_u = ease((t - (SEED_T0 + NSOW * SEED_P)) / 0.8) if k >= NSOW else 0.0
        if k >= NSOW: return (lerp(bag[0], -180, rest_u), lerp(bag[1], -470, rest_u)), lerp(80, 96, rest_u), H.blend(H.GRIP, PN.RELAX, rest_u), 0
        return bag, 80, H.GRIP, 0
    if u < 0.25: p = bag; ang = 80; hand = H.GRIP
    elif u < 0.62:
        v = ease((u - 0.25) / 0.37); p = (lerp(bag[0], out[0], v), lerp(bag[1], out[1], v) - 60 * math.sin(v * math.pi)); ang = lerp(80, 200, v); hand = H.GRIP
    elif u < 0.72: v = (u - 0.62) / 0.1; p = out; ang = 200; hand = H.blend(H.GRIP, H.OPEN, ease(v))
    else:
        v = ease((u - 0.72) / 0.28); p = (lerp(out[0], bag[0], v), lerp(out[1], bag[1], v)); ang = lerp(200, 80 + 360 * 0, v); hand = H.blend(H.OPEN, H.GRIP, v)
    return p, ang, hand, 1


def seed_bag(c, AR, AL):
    s0 = (60, -800); bagc = (-62, -520)
    st = skia.Path(); st.moveTo(72, -818); st.quadTo(-40, -650, -100, -578)
    c.drawPath(st, SP((0, 0, 0), 20, 50, MaskFilter=blur(5))); c.drawPath(st, SP((150, 124, 92), 17)); c.drawPath(st, SP((190, 164, 124), 12))
    c.save(); c.translate(bagc[0], bagc[1] - 40); c.scale(0.68, 0.68); c.translate(-bagc[0], -(bagc[1] - 40))
    if False: c.drawLine(s0[0], s0[1], bagc[0] + 30, bagc[1] - 60, SP((150, 120, 90), 16)); c.drawLine(s0[0], s0[1], bagc[0] + 30, bagc[1] - 60, SP((190, 160, 120), 6))
    b = smooth_closed([(bagc[0] - 64, bagc[1] - 52), (bagc[0] + 66, bagc[1] - 56), (bagc[0] + 78, bagc[1] + 30), (bagc[0] + 40, bagc[1] + 90), (bagc[0] - 40, bagc[1] + 92), (bagc[0] - 76, bagc[1] + 30)])
    c.drawPath(b, P((0, 0, 0), 60, MaskFilter=blur(8)))
    c.drawPath(b, P((222, 206, 170))); c.save(); c.clipPath(b, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(bagc[0] + 20, bagc[1] - 80, bagc[0] + 100, bagc[1] + 100), P((180, 160, 126), 160, MaskFilter=blur(10)))
    for j in range(3): c.drawLine(bagc[0] - 40 + j * 30, bagc[1] - 30, bagc[0] - 46 + j * 32, bagc[1] + 80, SP((190, 170, 136), 2.5, 160))
    c.restore()
    c.drawOval(skia.Rect(bagc[0] - 62, bagc[1] - 66, bagc[0] + 66, bagc[1] - 40), P((120, 96, 70)))
    c.drawOval(skia.Rect(bagc[0] - 52, bagc[1] - 62, bagc[0] + 56, bagc[1] - 44), P((214, 176, 96)))   # the seed grain showing in the mouth
    for j in range(9): c.drawCircle(bagc[0] - 40 + j * 10, bagc[1] - 54 + 3 * math.sin(j), 3.5, P((240, 206, 120)))
    c.restore()


def farmer_sow(t):
    p, ang, hand, active = sow_targets(t)
    smile = ease((t - 41.1) / 0.5)
    ps = K.pose(ik_r=K.hand_wrist(p, math.radians(ang), 40), hand_ang_r=math.radians(ang), r_hand=hand,
                ik_l=(40.0, -560.0), hand_ang_l=math.radians(160), l_hand=dict(curls=(0.5, 0.6, 0.64, 0.66, 0.68), spread=0.1),
                prop=seed_bag, breath=0.5 + 0.5 * math.sin(t * 2.2), lean=-2 * active, sway=-4,
                head_yaw=lerp(-0.25, 0.05, smile), look=(lerp(-0.7, 0.0, smile), lerp(0.3, 0.0, smile)), head_tilt=lerp(-3, 2, smile),
                smile=smile * 0.8, worry=0.0, brow=lerp(0.2, 0.4, smile), lid=0.1 if abs(t - 42.6) < 0.07 else 1.0)
    return ps


@functools.lru_cache(None)
def release_point(k):
    tr = SEED_T0 + (k + 0.62) * SEED_P
    s = skia.Surface(8, 8); g = K.farmer(s.getCanvas(), farmer_sow(tr), FX6, FG6, FS6)
    w = g['wr_r']; a = math.radians(200)
    return (w[0] + math.cos(a) * 50 * FS6, w[1] + math.sin(a) * 50 * FS6)


_rs6 = np.random.default_rng(44)
SEEDS = [(_rs6.uniform(-1, 1), _rs6.uniform(0.6, 1.2), _rs6.uniform(-0.3, 0.3)) for _ in range(70)]
WHEAT = sorted([(_rs6.uniform(-80, 1160), _rs6.uniform(1180, 1980), _rs6.uniform(0, 6.28)) for _ in range(520)], key=lambda q: q[1])


def growth(t): return ease((t - 41.15) / 1.25)


def field_ground(c, t):
    p = skia.Path(); p.addPoly([skia.Point(-400, 1150), skia.Point(1480, 1130), skia.Point(1480, 2100), skia.Point(-400, 2100)], True)
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, 1140), skia.Point(0, 1920)], [C((170, 128, 92)), C((128, 90, 66))])))
    for i in range(-14, 15):                                 # furrows run toward the horizon
        c.drawLine(540 + i * 30, 1140, 540 + i * 190, 1960, SP((110, 78, 58), 5, 150)); c.drawLine(548 + i * 30, 1140, 556 + i * 190, 1960, SP((196, 152, 112), 2, 110))


def wheat(c, t, front):
    g = growth(t)
    if g <= 0: return
    for (x, y, ph) in WHEAT:
        if (y > FG6 + 10) != front: continue
        k = 0.45 + (y - 1150) / 800; h = (16 + 150 * g) * k
        col = mix((120, 182, 74), (246, 206, 104), ease((g - 0.55) / 0.4)); sw = 4 * k * math.sin(t * 1.5 + ph + x * 0.01) * g
        for d_ in (-1, 0, 1):
            c.drawLine(x + d_ * 5 * k, y, x + d_ * 9 * k + sw, y - h * (0.9 + 0.1 * d_ * d_), SP(mix(col, (150, 120, 60), 0.18 if d_ else 0), 2.8 * k, 245))
        if g > 0.6:                                          # ears of grain on the stalks
            ea = ease((g - 0.6) / 0.3)
            for d_ in (-1, 1):
                ex, ey = x + d_ * 9 * k + sw, y - h * 1.0
                c.save(); c.translate(ex, ey); c.rotate(d_ * 8 + sw); c.drawOval(skia.Rect(-4.5 * k, -17 * k * ea, 4.5 * k, 2), P((252, 220, 128))); c.drawOval(skia.Rect(-4.5 * k, -17 * k * ea, 0, 2), P((255, 240, 180), 160))
                c.restore()


def shot_field(c, t):
    u = (t - T6) / (DUR - T6); pz = ease((t - 41.1) / 1.4)
    V = WO.View(lerp(lerp(1.1, 1.02, ease(u * 2.5)), 1.75, pz), (lerp(lerp(560, 545, u), 572, pz), lerp(lerp(930, 950, u), 760, pz)))
    gold = ease((t - 41.15) / 1.25)
    c.save(); V.apply(c, 0.15); WO.sky(c, t, sun=(lerp(220, 860, gold), lerp(560, 470, gold)), warm=gold); c.restore()
    c.save(); V.apply(c, 0.4); WO.far_land(c, t); c.restore()
    c.save(); V.apply(c, 0.7)
    WO.pasture(c, t, y0=1070)
    WO.fence(c, -60, 1140, 1100, 1080, h=70)
    gate(c, 250, 1100)
    c.restore()
    c.save(); V.apply(c, 1.0)
    field_ground(c, t)
    wheat(c, t, False)
    for k in range(NSOW):                                     # seed flung in an arc, falling onto the soil
        tr = SEED_T0 + (k + 0.62) * SEED_P
        if t < tr: continue
        x0, y0 = release_point(k)
        for (dv, sp, dy) in SEEDS:
            tt = t - tr; vx = -330 * sp - 70 * dv; vy = -330 * sp + 120 * dy
            x = x0 + vx * tt; y = y0 + vy * tt + 0.5 * 1500 * tt * tt
            gy = 1180 + 380 * (0.5 + 0.5 * dv)               # each grain lands on its own spot in the soil
            if y >= gy: x = x0 + vx * _tland(y0, vy, gy); y = gy
            if growth(t) > 0.15 and y >= gy: continue
            c.drawOval(skia.Rect(x - 12, y - 7, x + 12, y + 7), P((90, 60, 30), 150)); c.drawOval(skia.Rect(x - 10, y - 6, x + 10, y + 6), P((252, 220, 130))); c.drawCircle(x - 3, y - 2, 3, P((255, 250, 220)))
    K.farmer(c, farmer_sow(t), FX6, FG6, FS6)
    wheat(c, t, True)
    sh = ease((t - 40.95) / 0.3) * (1 - ease((t - 42.2) / 0.3))
    for k in range(3):                                        # time lapse: cloud shadows race over the field
        x = ((t - 40.95) * 1400 + k * 620) % 2200 - 600
        c.drawOval(skia.Rect(x - 300, 1150 + k * 160, x + 300, 1330 + k * 160), P((40, 30, 40), 60 * sh, MaskFilter=blur(60)))
    WO.motes(c, t, 0.8)
    c.restore()


def _tland(y0, vy, gy):
    a = 750.0; b = vy; cc = y0 - gy
    return (-b + math.sqrt(max(0.0, b * b - 4 * a * cc))) / (2 * a)


def gate(c, x, y):
    """the pasture gate, shut, with a SOLD board hung on it; the pasture behind is empty and trampled"""
    WOOD = (150, 112, 80)
    for k in range(5): c.drawLine(x - 110, y - 14 - k * 16, x + 110, y - 14 - k * 16, SP(WOOD, 7))
    c.drawLine(x - 110, y - 14, x + 110, y - 78, SP(WOOD, 7))
    for sx in (-1, 1): c.drawRect(skia.Rect(x + sx * 118 - 8, y - 104, x + sx * 118 + 8, y + 4), P(mix(WOOD, (60, 40, 30), 0.3)))
    for sx in (-30, 30): c.drawLine(x + sx, y - 78, x + sx * 0.6, y - 110, SP((90, 70, 60), 2.4))    # cords
    c.save(); c.translate(x, y - 108); c.rotate(-3)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-70, -40, 70, 34), 6, 6), P((0, 0, 0), 80, MaskFilter=blur(5)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-70, -44, 70, 30), 6, 6), P((236, 222, 190)))
    f = skia.Font(SERIF, 40); w = f.measureText('SOLD'); c.drawString('SOLD', -w / 2, 4, f, P((170, 50, 44)))
    c.restore()


# ======================================================================= the edit
import json
import newshots as NS
_TM = json.load(open('/home/claude/w1118/thunen/out/timemap.json'))
_O = np.array([0.0] + _TM['old'] + [DUR]); _N = np.array([0.0] + _TM['new'] + [_TM['new'][-1] + (DUR - _TM['old'][-1])])


def M(t): return float(np.interp(t, _O, _N))


def Minv(t): return float(np.interp(t, _N, _O))


WD = Words('/home/claude/w1118/thunen/out/words.json')       # the re-cut voice
T_END_N = WD.end() + 0.15
DUR_N = round(T_END_N + 0.7, 2)


def farmer_end(c, t):
    ps = K.pose(breath=0.5 + 0.5 * math.sin(t * 2.2), smile=0.85, look=(0.0, 0.05), head_yaw=0.05, head_tilt=2, brow=0.35, worry=0.0,
                lid=0.1 if abs(t - 43.6) < 0.07 else 1.0, r_up=8, r_fore=8, l_up=9, l_fore=10, sway=-8)
    K.farmer(c, ps, FX, FG, FS)


def scene(c, t):
    if t < 6.02: shot_pour(c, t)
    elif t < T2: NS.cartride(c, t)
    elif t < T3: NS.desk(c, t)
    elif t < T6: map_scene(c, t)
    elif t < 40.1: NS.coins(c, t)
    elif t < 42.5: shot_field(c, t)
    else: NS.loop(c, t, farmer_end)


TITLES_OLD = [
    (0.0, [[('HIS MILK KEEPS SPOILING', Wt)], [('WRONG ', Wt), ('FARM?', Y)]]),
    (2.8, [[('THE VON THÜNEN MODEL', Y)], [('SAYS ', Wt), ('WRONG FARM', Y)]]),
    (5.94, [[('IT SPOILS ON THE', Wt)], [('WAY TO THE ', Wt), ('CITY', Y)]]),
    (T2, [[('A GERMAN FARMER', Wt)], [('WORKED OUT ', Wt), ('WHY', Y)]]),
    (T3, [[('LAND NEAR THE CITY', Wt)], [('COSTS ', Wt), ('MORE', R)]]),
    (15.62, [[('BUT THE TRIP', Wt)], [('COSTS ', Wt), ('LESS', TL)]]),
    (18.13, [[('HOW FAR IT TRAVELS', Wt)], [('HOW FAST IT ', Wt), ('SPOILS', Y)]]),
    (T4, [[('MILK + VEGETABLES', GRN)], [('RIGHT BY THE CITY', Wt)]]),
    (26.67, [[('FIREWOOD', GRN)], [("IT'S ", Wt), ('HEAVY', Y)]]),
    (28.95, [[('GRAIN', Y)], [('IT ', Wt), ('KEEPS', Y)]]),
    (32.91, [[('CATTLE', OR)], [('WALK TO MARKET', Wt)]]),
    (T5, [[("WHERE'S OUR ", Wt), ('FARMER?', Y)]]),
    (37.18, [[('IN THE ', Wt), ('GRAIN RING', Y)]]),
    (T6, [[('SO HE ', Wt), ('SELLS THE COWS', R)]]),
    (39.92, [[('AND PLANTS ', Wt), ('WHEAT', Y)]]),
    (41.37, [[('FREE PRACTICE', Wt)], [('LEVLPREP.COM', TL)]]),
]
TITLES = [(M(a), l) for a, l in TITLES_OLD]


def _title_full(c, lines, t, a, size=92):
    """titles hard switch at full contrast: no fade, no grey frame after a cut"""
    widest = max(L.line_width(ln, size) for ln in lines)
    if widest > 960: size = size * 960 / widest
    n = len(lines); y0 = 300 - (n - 1) * size * 0.52 + size * 0.36
    for i, ln in enumerate(lines): L.rich_line(c, ln, 540, y0 + i * size * 1.04, size, 1.0)


kit._title_hard = _title_full
_end_line = kit.lpk.end_line
kit.lpk.end_line = lambda c, t, t0, text='levlprep.com', y=1500: _end_line(c, t, t0, text=text, y=1468)


def scene_new(c, t): scene(c, Minv(t))


SHORT = Short(WD, 'AP HUMAN GEOGRAPHY', TITLES, scene_new, DUR_N, T_END_N, lift=lambda t: 1.0,
              fix={'HEAVY': 'heavy', 'Thunen': 'Thünen'}, cuts=(M(T2),))

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1118/thunen/out/stills')
