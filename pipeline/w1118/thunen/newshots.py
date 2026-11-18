"""New shots for the v2 fix round (times are in the OLD timeline; build.py maps them to the re-cut voice):
 desk  9.07-13.71  von Thunen's own desk by the window at his estate: the 1826 book beside him, his hand (dark coat, white cuff, the
                   one hand model) moving a quill whose nib draws rings around a town on the page. Our farmer is not on screen.
 coins 38.63-39.85 the sale, close on the hands at the gate: the buyer (a new person seen as hands and coat sleeve: dark green coat,
                   cream cuff, darker skin, a signet ring) lets three silver coins slide from his fingers; they fall under gravity into
                   the farmer's open palm. Behind, out of focus, the cows stand haltered with a rope running taut out of frame to the right.
 loop  42.50-45.0  back to the opening frame's composition: the same road, verge and city; the cart loaded with grain sacks, the empty
                   churn standing on the verge, the old pasture now golden wheat, the farmer standing easy and smiling."""
import math
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from art import shaded, diffp, op
import hands as H
import person as PN
import cast as K
import cow as CW
import world as WO
from guy import limb
LIGHT = (-0.7, -0.6)


def ease(u): return smooth(max(0.0, min(1.0, u)))


SERIF = skia.Typeface.MakeFromName('DejaVu Serif', skia.FontStyle.Bold())
# ---------------------------------------------------------------- the desk
PAGE_C = (600.0, 1020.0)                               # centre of the ring diagram on the right hand page (screen, before the push)
RING_R = (34, 70, 112, 156)


def page_pt(r, a):  # the page lies in perspective: circles become ellipses
    return (PAGE_C[0] + r * math.cos(a), PAGE_C[1] + 0.52 * r * math.sin(a))


RING_T = (9.9, 10.75, 11.6, 12.45)                     # the quill draws one ring every 0.85 s, then the dot for the town
RING_D = 0.72


def nib_at(t):
    if t < RING_T[0]:
        u = ease((t - 9.1) / 0.75); return (lerp(PAGE_C[0] + 150, PAGE_C[0] + RING_R[0], u), lerp(PAGE_C[1] - 120, PAGE_C[1], u)), True
    for i, t0 in enumerate(RING_T):
        if t0 <= t < t0 + RING_D:
            a = 2 * math.pi * (t - t0) / RING_D; return page_pt(RING_R[i], a), True
        nxt = RING_T[i + 1] if i + 1 < len(RING_T) else 13.3
        if t0 + RING_D <= t < nxt:                     # lift and carry to the start of the next ring
            u = ease((t - t0 - RING_D) / (nxt - t0 - RING_D)); r = lerp(RING_R[i], RING_R[i + 1] if i + 1 < len(RING_R) else 0, u)
            return (PAGE_C[0] + r, PAGE_C[1] - 14 * math.sin(u * math.pi)), False
    u = ease((t - 13.3) / 0.3); return (PAGE_C[0] + 4 * u, PAGE_C[1] - 30 * u), False


def desk(c, t):
    u = (t - 9.07) / (13.71 - 9.07); z = lerp(1.0, 1.1, u)
    c.save(); c.translate(540, 980); c.scale(z, z); c.translate(-560, -1000)
    # the room: plaster wall, a tall window on the left with the estate's fields outside and a beam of morning light
    c.drawRect(skia.Rect(-200, -200, 1300, 2200), P((214, 192, 160)))
    c.drawRect(skia.Rect(-200, -200, 1300, 900), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(1080, 0)], [C((236, 216, 180)), C((176, 150, 124))])))
    win = skia.Rect(40, 140, 420, 760)
    c.drawRect(win.makeOutset(26, 26), P((150, 112, 82)))
    c.save(); c.clipRect(win)
    c.drawRect(win, skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 140), skia.Point(0, 760)], [C((170, 206, 236)), C((252, 236, 200))])))
    for i, (yy, col) in enumerate(((560, (150, 180, 120)), (600, (206, 190, 110)), (640, (130, 168, 94)), (690, (214, 194, 104)))):
        pts = [(40, 800)] + [(x, yy + 8 * math.sin(x * 0.02 + i)) for x in range(40, 430, 30)] + [(420, 800)]
        p = skia.Path(); p.addPoly([skia.Point(*q) for q in pts], True); c.drawPath(p, P(col))
    for k, x in enumerate((120, 300)): c.drawCircle(x + 3 * math.sin(t * 1.2 + k), 556, 26, P((96, 132, 80)))
    c.restore()
    c.drawRect(skia.Rect(225, 140, 235, 760), P((150, 112, 82))); c.drawRect(skia.Rect(40, 445, 420, 455), P((150, 112, 82)))
    beam = skia.Path(); beam.addPoly([skia.Point(60, 160), skia.Point(420, 160), skia.Point(1100, 1300), skia.Point(500, 1500)], True)
    c.drawPath(beam, P((255, 236, 190), 60, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    for i in range(40):                                # dust drifting in the beam
        x = 300 + (i * 97 % 600) + 20 * math.sin(t * 0.4 + i); y = 300 + (i * 61 % 800) - (t * 12 + i * 7) % 60
        c.drawCircle(x, y, 2.2, P((255, 246, 210), 140 * (0.5 + 0.5 * math.sin(t * 2 + i)), MaskFilter=blur(1)))
    # the desk top in perspective
    top = skia.Path(); top.addPoly([skia.Point(-200, 820), skia.Point(1300, 820), skia.Point(1500, 2200), skia.Point(-400, 2200)], True)
    c.drawPath(top, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, 820), skia.Point(0, 1700)], [C((132, 86, 58)), C((96, 60, 44))])))
    for k in range(9): c.drawLine(-200, 860 + k * 90 + k * k * 6, 1300, 850 + k * 92 + k * k * 6, SP((112, 72, 50), 2.5, 120))
    # the 1826 book, closed, on the left of the desk
    c.save(); c.translate(330, 1330); c.skew(-0.2, 0); c.rotate(-6); c.scale(0.85, 0.85)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-150, -110, 150, 120), 8, 8), P((0, 0, 0), 90, MaskFilter=blur(12)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-150, -126, 150, 104), 8, 8), P((110, 64, 48)))
    c.drawRect(skia.Rect(-150, 90, 150, 104), P((236, 222, 190)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-130, -110, 130, 80), 4, 4), SP((214, 176, 110), 3))
    for txt, sz, y in (('DER ISOLIRTE', 30, -56), ('STAAT', 40, -12), ('1826', 40, 52)):
        f = skia.Font(SERIF, sz); w = f.measureText(txt); c.drawString(txt, -w / 2, y, f, P((236, 206, 140)))
    c.restore()
    # inkwell
    c.drawOval(skia.Rect(830, 980, 930, 1010), P((0, 0, 0), 90, MaskFilter=blur(6)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(842, 920, 918, 1000), 14, 14), P((40, 48, 60))); c.drawOval(skia.Rect(856, 912, 904, 930), P((20, 22, 30)))
    c.drawRect(skia.Rect(850, 930, 862, 990), P((120, 140, 170), 120))
    # the open manuscript: two pages, written lines, and the ring diagram the quill is drawing
    pg = skia.Path(); pg.addPoly([skia.Point(300, 880), skia.Point(800, 880), skia.Point(860, 1240), skia.Point(240, 1240)], True)
    c.drawPath(pg, P((0, 0, 0), 80, MaskFilter=blur(14)))
    c.drawPath(pg, P((246, 236, 212))); c.drawLine(550, 880, 550, 1240, SP((210, 196, 170), 4))
    c.save(); c.clipPath(pg, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(240, 880, 560, 1240), P((226, 212, 186), 120))
    rs = np.random.default_rng(3)
    for k in range(9):                                 # handwriting on the left page
        y = 920 + k * 34; x0 = 330 - k * 4
        p = skia.Path(); p.moveTo(x0, y)
        for j in range(18): p.lineTo(x0 + j * 11, y + 3 * math.sin(j * 1.7 + k) + rs.uniform(-1, 1))
        c.drawPath(p, SP((70, 60, 70), 2, 190))
    c.restore()
    ink = (40, 36, 60)
    for i, t0 in enumerate(RING_T):                    # each ring exactly where the nib has been
        if t < t0: continue
        f = min(1.0, (t - t0) / RING_D); p = skia.Path(); n = max(2, int(64 * f))
        for j in range(n + 1):
            q = page_pt(RING_R[i], 2 * math.pi * f * j / n); (p.lineTo if j else p.moveTo)(*q)
        c.drawPath(p, SP(ink, 3.2, 230))
    if t > 13.0: c.drawCircle(PAGE_C[0], PAGE_C[1], 9 * ease((t - 13.0) / 0.2), P(ink))
    # the hand with the quill: the nib is ON the page while it draws; the pen sits between thumb and fingers
    nib, down = nib_at(t)
    lift = 0 if down else 10
    ang = math.radians(-58)                            # the pen leans up and to the right
    pen_dir = (math.cos(ang), math.sin(ang))
    grip = (nib[0] + pen_dir[0] * 70, nib[1] + pen_dir[1] * 70 - lift)
    wrist = (grip[0] + 70, grip[1] + 70)
    # coat sleeve and shirt cuff come in from the lower right
    el = (wrist[0] + 380, wrist[1] + 330)
    sl = limb(el, (wrist[0] + 26, wrist[1] + 22), 170, 120, bulge=8, bu=0.3, side=1)
    c.drawPath(sl, P((0, 0, 0), 80, MaskFilter=blur(16)))
    shaded(c, sl, (44, 50, 72), (28, 30, 48), sh=(10, 8), rimL=(110, 120, 150), rl=(-3, -3))
    cuff = smooth_closed([(wrist[0] + 2, wrist[1] - 30), (wrist[0] + 44, wrist[1] - 12), (wrist[0] + 58, wrist[1] + 30), (wrist[0] + 30, wrist[1] + 58), (wrist[0] - 10, wrist[1] + 40), (wrist[0] - 22, wrist[1] + 6)])
    shaded(c, cuff, (244, 240, 230), (206, 200, 190), sh=(6, 6))
    H.hand(c, (wrist[0] + 4, wrist[1] + 4), math.radians(-135), 1, 1.35, curls=(0.55, 0.42, 0.66, 0.78, 0.84), spread=0.05,
           skin=(236, 196, 166), shade=(196, 146, 124), hi=(255, 226, 200), light=LIGHT)
    # the quill: a shaft from the nib through the fingers, the feather above
    tip = nib; top = (nib[0] + pen_dir[0] * 330, nib[1] + pen_dir[1] * 330 - lift)
    c.drawLine(tip[0], tip[1] - lift, grip[0], grip[1], SP((60, 52, 50), 4))
    c.drawLine(grip[0], grip[1], top[0], top[1], SP((236, 228, 210), 4))
    fe = smooth_closed([(lerp(grip[0], top[0], 0.35), lerp(grip[1], top[1], 0.35)), (top[0] + 30, top[1] + 8), (top[0] + 4, top[1] - 8), (lerp(grip[0], top[0], 0.4) - 26, lerp(grip[1], top[1], 0.4) - 4)])
    sw = 3 * math.sin(t * 9)
    c.save(); c.translate(sw, 0); shaded(c, fe, (246, 240, 226), (210, 200, 186), sh=(5, 4)); c.drawLine(lerp(grip[0], top[0], 0.35), lerp(grip[1], top[1], 0.35), top[0], top[1], SP((200, 190, 176), 2)); c.restore()
    c.drawCircle(tip[0], tip[1] - lift, 3, P((30, 26, 40)))
    c.restore()


# ---------------------------------------------------------------- the coins
COIN_T = (38.95, 39.18, 39.41)


def coins(c, t):
    u = (t - 38.63) / 1.47; z = lerp(1.0, 1.05, u)
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-540, -960)
    # behind, in focus: the gate, his two cows haltered, their ropes running to the buyer's other hand
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(3, 3)))
    WO.sky(c, t); WO.far_land(c, t); WO.pasture(c, t)
    WO.fence(c, -60, 1140, 1150, 1130, h=90)
    hand2 = (1010.0, 1250.0)
    for (x, y, s, look) in ((170, 1330, 0.95, CW.RED), (470, 1290, 0.8, CW.PIED)):
        CW.cow(c, x, y, s, t, facing=1, look=look, graze=0.0, tail=0.4 * math.sin(t * 1.6 + x), ph=x)
        hx, hy = x + 165 * s * 0.9, y - 115 * s
        c.drawOval(skia.Rect(hx - 10 * s, hy - 16 * s, hx + 14 * s, hy + 18 * s), SP((90, 60, 40), 4 * s))   # the rope halter round the muzzle
        c.drawLine(hx, hy, hand2[0], hand2[1], SP((150, 120, 80), 6))
    c.restore()
    # the buyer: green coat from the shoulder down at the right of frame, his left fist holding both ropes
    coat = smooth_closed([(1130, 300), (980, 330), (900, 420), (880, 700), (900, 1100), (930, 1500), (1130, 1500)])
    c.drawPath(coat, P((0, 0, 0), 80, MaskFilter=blur(16))); shaded(c, coat, (58, 92, 70), (36, 62, 50), sh=(14, 4), rimL=(120, 160, 120), rl=(-4, -3))
    c.save(); c.clipPath(coat, skia.ClipOp.kIntersect, True)
    lap = smooth_closed([(990, 330), (1040, 360), (1010, 640), (980, 620)]); c.drawPath(lap, P((44, 74, 58)))
    for k in range(4): c.drawCircle(1050, 720 + k * 110, 9, P((200, 170, 100)))
    c.restore()
    H.hand(c, hand2, math.radians(95), -1, 1.9, curls=(0.75, 0.86, 0.9, 0.9, 0.88), spread=0.02, skin=(150, 100, 72), shade=(112, 70, 54), hi=(196, 146, 112), light=LIGHT)
    # the farmer's hand, open palm up, from the lower left
    FS = K.FARMER; fw = (320.0, 1150.0)
    fa = limb((-80, 1520), (fw[0] - 10, fw[1] + 8), 150, 110, bulge=8, bu=0.3, side=-1)
    sleeve = limb((-200, 1700), (60, 1440), 190, 170)
    shaded(c, fa, FS['SKIN'], FS['SKIN_SH'], sh=(10, 8), rimL=FS['SKIN_HI'], rl=(-3, -3))
    shaded(c, sleeve, FS['TOP'], FS['TOP_SH'], sh=(10, 8))
    W_ = H.hand(c, fw, math.radians(-28), -1, 2.6, curls=(0.25, 0.2, 0.24, 0.3, 0.36), spread=0.25, skin=FS['SKIN'], shade=FS['SKIN_SH'], hi=FS['SKIN_HI'], light=LIGHT, palm=True)
    palm_c = W_(26, 2)
    # the buyer's right arm: from his shoulder down to the hand that pays
    bw = (740.0 - 30 * ease((t - 38.7) / 0.4), 800.0 + 40 * ease((t - 38.7) / 0.4))
    tilt = math.radians(150 - 25 * ease((t - 38.85) / 0.4))
    sh_ = (950.0, 450.0); el_ = (lerp(sh_[0], bw[0], 0.45) + 60, lerp(sh_[1], bw[1], 0.5) + 10)
    up = limb(sh_, el_, 170, 140, bulge=8, bu=0.3, side=1); fo = limb(el_, (bw[0] + 30, bw[1] - 20), 140, 120, bulge=6, bu=0.3, side=1)
    ec = skia.Path(); ec.addCircle(el_[0], el_[1], 68)
    arm = op(op(up, fo), ec)
    c.drawPath(arm, P((0, 0, 0), 90, MaskFilter=blur(18)))
    shaded(c, arm, (58, 92, 70), (36, 62, 50), sh=(10, 8), rimL=(120, 160, 120), rl=(-3, -3))
    cf = smooth_closed([(bw[0] + 10, bw[1] - 70), (bw[0] + 66, bw[1] - 40), (bw[0] + 70, bw[1] + 20), (bw[0] + 30, bw[1] + 50), (bw[0] - 20, bw[1] + 20), (bw[0] - 30, bw[1] - 30)])
    shaded(c, cf, (236, 226, 200), (200, 188, 160), sh=(6, 6))
    BS = dict(skin=(150, 100, 72), shade=(112, 70, 54), hi=(196, 146, 112))
    WB = H.hand(c, bw, tilt, 1, 2.4, curls=(0.45, 0.32, 0.36, 0.42, 0.5), spread=0.12, light=LIGHT, **BS)
    rp = WB(30, -16); c.drawCircle(rp[0], rp[1], 9, P((214, 180, 90))); c.drawCircle(rp[0] - 2, rp[1] - 2, 3, P((255, 236, 170)))
    for k, tr in enumerate(COIN_T):
        hold = WB(78 - k * 6, 6 + k * 4)
        land = (palm_c[0] + (k - 1) * 22, palm_c[1] - k * 9)
        if t < tr: p = hold; ang = 0
        else:
            tt = t - tr; tf = 0.32
            if tt < tf: v = tt / tf; p = (lerp(hold[0], land[0], v), hold[1] + (land[1] - hold[1]) * v * v); ang = v * 3
            else: p = land; ang = 3
        c.save(); c.translate(*p); c.rotate(math.degrees(ang) * 20)
        c.drawOval(skia.Rect(-28, -15, 28, 15), P((0, 0, 0), 60, MaskFilter=blur(4)))
        c.drawOval(skia.Rect(-28, -17, 28, 13), P((190, 196, 206))); c.drawOval(skia.Rect(-21, -13, 21, 8), P((222, 228, 236))); c.drawOval(skia.Rect(-13, -10, 4, -3), P((255, 255, 255), 200))
        c.restore()
    c.restore()


# ---------------------------------------------------------------- the loop back to the opening frame
def sacks_cart(c, x, y, s):
    WO.cart(c, x, y, s, load='grain')


def loop(c, t, farmer_fn):
    u = (t - 42.5) / 2.5; z = lerp(1.0, 1.05, u)
    V = WO.View(z, (lerp(540, 520, u), lerp(960, 930, u)))
    c.save(); V.apply(c, 0.15); WO.sky(c, t, sun=(860, 470), warm=1.0); c.restore()
    c.save(); V.apply(c, 0.4); WO.far_land(c, t); c.restore()
    c.save(); V.apply(c, 0.75)
    WO.pasture(c, t); WO.wheatfield(c, t, 1082); WO.fence(c, -60, 660, 1082, 1060, h=56); WO.road(c, t)
    WO.cart(c, 900, 1150, 0.95, load='grain')
    c.restore()
    c.save(); V.apply(c, 1.0)
    WO.verge(c, t); WO.tufts(c, t, ymin=1240, xmax=lambda y: WO.ditch_x(y) - 20)
    farmer_fn(c, t)
    WO.motes(c, t)
    c.restore()


# ---------------------------------------------------------------- the long cart ride (old 6.02 to 9.07)
def churn_lidded(c, x, y, s, lid_up=0.0, lid_tilt=0.0, curd=0.0):
    """a churn standing upright with its lid on; lid_up lifts the lid (a bump on the road jolts it), curd shows the soured milk"""
    c.save(); c.translate(x, y); c.scale(s, s)
    K.churn(c, (0, -196), 0.0)
    if curd > 0:                                         # the soured milk at the mouth: thick, lumpy, yellowed
        c.drawOval(skia.Rect(-36, -400, 36, -388), P((226, 218, 170), 255 * curd))
        for k in range(6): c.drawCircle(-26 + k * 10, -396 + 3 * math.sin(k * 1.7), 6, P((236, 230, 190), 255 * curd))
    c.save(); c.translate(0, -394 - 60 * lid_up); c.rotate(lid_tilt)
    lid = skia.Path(); lid.addOval(skia.Rect(-50, -12, 50, 12)); c.drawPath(lid, P(K.TIN_SH)); c.drawOval(skia.Rect(-50, -16, 50, 6), P(K.TIN))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-12, -34, 12, -12), 6, 6), P(K.TIN_DK)); c.drawOval(skia.Rect(-40, -14, -6, -6), P(K.TIN_HI, 160))
    c.restore()
    c.restore()


def cartride(c, t):
    u = (t - 6.02) / (9.07 - 6.02)
    sun = (lerp(160, 760, u), lerp(660, 300, math.sin(u * math.pi / 2)))
    c.save(); c.translate(0, -120); WO.sky(c, t, sun=sun, warm=0.3 * u); c.restore()
    # the city straight ahead, growing a little as the cart gets nearer
    k = lerp(1.0, 1.3, u)
    c.save(); c.translate(540, WO.HY - 120); c.scale(k, k); c.translate(-WO.CITY_X, -WO.HY); WO.far_land(c, t); c.restore()
    hy = WO.HY - 116
    # the road runs straight to the city; ruts and stones stream past under the cart
    rd = skia.Path(); rd.addPoly([skia.Point(530, hy), skia.Point(550, hy), skia.Point(1120, 1920), skia.Point(-40, 1920)], True)
    gr = skia.Path(); gr.addRect(skia.Rect(-10, hy, 1090, 1930))
    c.drawPath(gr, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, hy), skia.Point(0, 1920)], [C((160, 190, 104)), C((112, 152, 70))])))
    c.drawPath(rd, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([skia.Point(0, hy), skia.Point(0, 1920)], [C((214, 200, 170)), C((190, 160, 118))])))
    for side in (-1, 1):
        for j in range(26):
            v = ((j / 26) + t * 0.45) % 1.0; y = hy + (1920 - hy) * v * v; x = 540 + side * (40 + 440 * v * v) * 0.62
            c.drawOval(skia.Rect(x - 14 * v, y - 3 * v, x + 14 * v, y + 3 * v), P((160, 132, 100), 200))
        for j in range(30):                                # grass tufts on the verges passing by
            v = ((j / 30) + t * 0.45 + 0.017 * side) % 1.0; y = hy + (1920 - hy) * v * v; x = 540 + side * (60 + 900 * v * v)
            kk = 0.2 + 1.4 * v * v
            for d_ in (-1, 0, 1): c.drawLine(x + d_ * 8 * kk, y, x + d_ * 14 * kk, y - 34 * kk, SP((86, 128, 64), 3 * kk, 230))
    # the cart from behind, its team out of frame ahead: two big wheels turning, the bed with three churns; it rocks on the ruts
    bump = math.exp(-((t - 8.25) / 0.08) ** 2) * 18
    bob = 4 * math.sin(t * 13) + bump
    cx, cy, s = 540, 1360 - bob, 3.1
    WOOD, WSH, WHI = (150, 104, 70), (104, 70, 52), (196, 150, 104)
    c.drawOval(skia.Rect(cx - 520, 1340, cx + 520, 1440), P((30, 30, 10), 110, MaskFilter=blur(24)))
    for sd in (-1, 1):                                    # the shafts run ahead, out of frame toward the unseen horse
        c.drawLine(cx + sd * 150, cy - 250, cx + sd * 60, hy + 200, SP(WSH, 18)); c.drawLine(cx + sd * 150, cy - 250, cx + sd * 60, hy + 200, SP(WHI, 5, 160))
    for k_, (dx, sc) in enumerate(((-150, 0.62), (150, 0.62), (0, 0.66))):
        jolt = ease((t - 8.25) / 0.12) * (1 - ease((t - 8.45) / 0.25)) if k_ == 2 else 0.0
        settled = ease((t - 8.45) / 0.25) if k_ == 2 else 0.0
        churn_lidded(c, cx + dx, cy - 172, sc, lid_up=jolt * 0.9 + settled * 0.12, lid_tilt=-24 * (jolt + settled), curd=settled if k_ == 2 else 0.0)
    bed = skia.Path(); bed.addRect(skia.Rect(cx - 330, cy - 262, cx + 330, cy - 150))
    c.drawPath(bed, P(WOOD)); c.drawRect(skia.Rect(cx - 330, cy - 262, cx + 330, cy - 240), P(WHI))
    for k_ in range(2): c.drawLine(cx - 330, cy - 214 + k_ * 36, cx + 330, cy - 214 + k_ * 36, SP(WSH, 5, 200))
    c.drawRect(skia.Rect(cx + 100, cy - 262, cx + 330, cy - 150), P(WSH, 80))
    for sd in (-1, 1): c.drawRect(skia.Rect(cx + sd * 330 - 14, cy - 300, cx + sd * 330 + 14, cy - 150), P(WSH))   # corner posts of the bed
    c.drawRect(skia.Rect(cx - 360, cy - 150, cx + 360, cy - 118), P(WSH))
    rot = t * 5.5
    for sd in (-1, 1):
        wx = cx + sd * 380; wy = cy - 150
        c.drawOval(skia.Rect(wx - 64, wy - 210, wx + 64, wy + 210), P(WSH)); c.drawOval(skia.Rect(wx - 44, wy - 180, wx + 44, wy + 180), P(mix(WSH, (60, 50, 60), 0.4)))
        for a in range(8):                                  # spokes turning: the wheel is seen end on, so a spoke's swing shows as up and down
            aa = rot + a * math.pi / 4; c.drawLine(wx, wy, wx + 30 * math.cos(aa) * sd, wy + 175 * math.sin(aa), SP(WOOD, 9))
        c.drawCircle(wx, wy, 22, P(WHI)); c.drawOval(skia.Rect(wx - 64, wy - 210, wx + 64, wy + 210), SP(WHI if sd < 0 else WSH, 10))
    WO.motes(c, t, 0.7)
