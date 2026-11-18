"""w1118-02-diamond-water (AP Microeconomics, CED 1.6 marginal analysis): the diamond water paradox in one trade. 1080x1920, 30 fps, all code (skia).

Logline: a man lost two days in the desert is offered one bottle of water for his diamond ring; the trade shows that price follows what the NEXT
unit adds (marginal utility), not how useful a good is in total.
Beats: hook, the choice (0-10.1) / the stake on his face (10.1-11.6) / the paradox: at home diamonds cost thousands, water a dollar (11.6-19.3) /
the answer: MARGINAL (19.3-23.5) / the idea in the world: next bottle vs next diamond, at home (23.5-31.8) / out here the bar flips (31.8-34.4) /
the trade, hands on both objects (34.4-36.0) / he drinks (36.0-38.3) / payoff: the stranger holds the ring to the sun, the man holds the bottle (38.3-end).
Colour script: blazing noon all through; bleached sky, warm sand, hard short shadows under people, heat shimmer on the horizon; the memory panels are
cooler and indoor (kitchen white, jeweller's velvet) so home reads as a different place; the brightest moment is the ring flashing in the sun at the end.
Key light: the sun high on the upper left (people's LIGHT is upper left).

Shot list (times from out/words.json):
 1  0.00- 6.20  medium wide, slow push: the stranger behind his crate stand raises one bottle (moving from frame 0), the lost man in the foreground left
                turns his head to it. Poll band y 560-900 holds only sky for the first 8 s (heads below 900). Title DIAMOND WATER PARADOX / WOULD YOU TRADE?
 2  6.20-10.10  close: the lost man's left hand in the foreground with the diamond ring on the ring finger; the stranger and his bottle soft behind.
 3 10.10-11.60  close on the lost man's face: squint, dry cracked lips, sunburn; he looks down at the ring, then up at the bottle.
 4 11.60-19.30  medium on the lost man (face visible, looking up) with a heat haze memory panel of home above him: jeweller's window, shelf of bottles, tap.
 5 19.30-23.50  two shot at the stand, slow push, only heat shimmer and dust moving; MARGINAL lands big.
 6 23.50-31.84  same two shot: NEXT BOTTLE and NEXT DIAMOND cards over the two objects with value bars; AT HOME: the memory of endless bottles, the
                water bar shrinks to almost nothing.
 7 31.84-34.40  close on the single bottle in the stranger's hand (cold drops, sun glint); OUT HERE: the water bar rises above the diamond bar.
 8 34.40-36.00  close on four hands: the stranger's fingers take the ring from the lost man's pinch; the bottle passes from the stranger's grip to the
                lost man's grip (both hands on the bottle for the handover). Effects: ring tick, slosh.
 9 36.00-38.30  close: he drinks, eyes closed, the water level drops (his own arm drawn from his elbow, his hand round the bottle).
10 38.30-end    wide: the stranger holds the ring up to the sun (flash), the lost man stands with the bottle; hold and end.
Motion list (accuracy): the bottle only moves while a hand grips it; the ring moves only in a hand; water surface stays level and drops while he drinks;
the canteen is empty (cap hanging open); value bars are the marginal value of ONE more unit in each place (no numbers)."""
import sys, math
sys.path[:0] = ['/home/claude/w1118/diamond', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia, cv2
import chars as CH, person as PN, hands as H, kit
from chars import pose, person, bottle, ring_loose, diamond
from guy import limb
from art import shaded, diffp, op
from kit import Words, Short, Wt, Y, R, TL, push, blur_layer
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed

WD = Words('/home/claude/w1118/diamond/out/words.json')
T_END = WD.end() + 0.35
DUR = round(T_END + 1.4, 2)
T2, T3, T4, T5, T6 = 6.2, 10.1, 11.6, 19.3, 23.5
T7, T8, T9, T10 = 31.84, 34.4, 36.0, 38.3
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
W_, H_ = 1080, 1920
_R = np.random.default_rng(18)
DUST = [(_R.uniform(-100, 1180), _R.uniform(500, 1900), _R.uniform(1.5, 4.0), _R.uniform(0, 6.28), _R.uniform(0.3, 1.0)) for _ in range(70)]
SCRUB = [(_R.uniform(-80, 1160), _R.uniform(0.0, 1.0), _R.uniform(0.6, 1.3), _R.uniform(0, 6.28)) for _ in range(26)]
ROCKS = [(_R.uniform(-80, 1160), _R.uniform(0.0, 1.0), _R.uniform(0.5, 1.4)) for _ in range(30)]
SUN = (190, 640)
BL = (130, 210, 255); ICE = (200, 236, 255)
WBAR = (70, 170, 250); DBAR = (196, 160, 255)


def font(sz, bold=True):
    f = skia.Font(MONT, sz); f.setEmbolden(bold); return f


def text_c(c, txt, x, y, sz, col, a=255):
    f = font(sz); w = f.measureText(txt); c.drawString(txt, x - w / 2, y, f, P(col, a))


# ------------------------------------------------------------------ the desert
def sky(c, t, hz=1080):
    c.drawRect(skia.Rect(-400, -400, 1480, hz + 40), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, hz)],
               [C((150, 196, 226)), C((196, 222, 236)), C((240, 236, 222)), C((252, 236, 206))], [0, 0.45, 0.85, 1.0])))
    sx, sy = SUN
    c.drawCircle(sx, sy, 420, P((255, 250, 226), 120, MaskFilter=blur(150)))
    c.drawCircle(sx, sy, 150, P((255, 252, 236), 200, MaskFilter=blur(50)))
    c.drawCircle(sx, sy, 64, P((255, 255, 248)))
    for i in range(3):                                         # thin high cloud streaks drifting
        x = (i * 470 + t * 7) % 1500 - 260; y = 700 + i * 70
        c.drawOval(skia.Rect(x, y, x + 380, y + 16), P((255, 255, 255), 90, MaskFilter=blur(8)))


def mesas(c, t, hz=1080):
    # far mesas, pale and hazy; a nearer ridge warmer; faces as flat shade facets with lit edges on the sun side
    far = [(-100, hz), (-100, hz - 70), (90, hz - 74), (120, hz - 120), (330, hz - 126), (360, hz - 70), (560, hz - 60), (700, hz - 64), (730, hz - 150), (930, hz - 156), (960, hz - 84), (1200, hz - 80), (1200, hz)]
    pa = skia.Path(); pa.addPoly([skia.Point(*p) for p in far], True); c.drawPath(pa, P((222, 196, 196)))
    for (x0, x1, top) in ((120, 330, hz - 120), (730, 930, hz - 150)):
        fa = skia.Path(); fa.addPoly([skia.Point(x1 - 60, top + 6), skia.Point(x1, top), skia.Point(x1 + 30, hz - 70), skia.Point(x1 - 40, hz - 60)], True); c.drawPath(fa, P((204, 172, 178)))
        c.drawLine(x0, top + 1, x1 - 60, top + 4, SP((250, 230, 210), 3, 200))
    c.drawRect(skia.Rect(-400, hz - 70, 1480, hz + 10), P((246, 226, 200), 150, MaskFilter=blur(14)))       # haze at their feet
    near = [(-100, hz + 30), (-100, hz - 26)] + [(x, hz - 30 - 22 * math.sin(x * 0.006 + 1.2) - 10 * math.sin(x * 0.02)) for x in range(-100, 1201, 60)] + [(1200, hz + 30)]
    pb = skia.Path(); pb.addPoly([skia.Point(*p) for p in near], True); c.drawPath(pb, P((232, 190, 150)))


def ground(c, t, hz=1080):
    c.drawRect(skia.Rect(-400, hz - 4, 1480, 2600), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, hz), skia.Point(0, 2000)],
               [C((240, 206, 156)), C((230, 184, 128)), C((214, 160, 104))], [0, 0.4, 1.0])))
    # the dirt road: a strip from the bottom left to the horizon
    rd = skia.Path(); rd.addPoly([skia.Point(-300, 2600), skia.Point(380, 2600), skia.Point(600, hz), skia.Point(560, hz)], True)
    c.drawPath(rd, P((214, 170, 120)))
    c.save(); c.clipPath(rd, skia.ClipOp.kIntersect, True)
    for j in range(2):                                         # wheel ruts
        e = skia.Path(); e.moveTo(-160 + j * 330, 2600); e.lineTo(570 + j * 20, hz); c.drawPath(e, SP((196, 148, 100), 10, 160))
    c.restore()
    for (x, v, k) in ROCKS:                                    # stones, bigger nearer
        y = hz + 8 + v ** 2 * 900; s = k * (0.3 + v * 1.5)
        c.drawOval(skia.Rect(x - 18 * s, y - 2 * s, x + 22 * s, y + 6 * s), P((150, 100, 70), 90, MaskFilter=blur(2)))
        c.drawPath(smooth_closed([(x - 16 * s, y), (x - 8 * s, y - 12 * s), (x + 10 * s, y - 13 * s), (x + 18 * s, y)]), P((196, 150, 116)))
        c.drawPath(smooth_closed([(x + 2 * s, y - 12 * s), (x + 10 * s, y - 13 * s), (x + 18 * s, y), (x + 4 * s, y)]), P((168, 120, 92)))
    for (x, v, k, ph) in SCRUB:                                # dry scrub that sways in the hot wind
        y = hz + 6 + v ** 2 * 860; s = k * (0.25 + v * 1.3); sw = 3 * math.sin(t * 1.6 + ph) * s
        c.drawOval(skia.Rect(x - 40 * s, y - 4 * s, x + 44 * s, y + 6 * s), P((150, 100, 70), 80, MaskFilter=blur(3)))
        for a_ in range(-3, 4):
            c.drawLine(x, y, x + a_ * 12 * s + sw, y - (36 - abs(a_) * 5) * s, SP((150, 140, 92), 3.2 * s ** 0.6, 230))
            c.drawCircle(x + a_ * 12 * s + sw, y - (36 - abs(a_) * 5) * s, 4 * s, P((160, 154, 100)))


def dust(c, t, a=1.0):
    for (x, y, r, ph, k) in DUST:
        xx = (x + t * 26 * k) % 1300 - 110; yy = y + 14 * math.sin(t * 0.8 + ph)
        c.drawCircle(xx, yy, r, P((255, 240, 210), 110 * k * a, MaskFilter=blur(1.5)))


def pickup(c, x, y, s):
    """an old pickup parked side on behind the stand: faded teal, rounded fenders, a white roof, chrome bumper"""
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-280, -16, 300, 22), P((110, 70, 50), 110, MaskFilter=blur(10)))
    body = smooth_closed([(-280, -40), (-280, -120), (-120, -126), (-90, -210), (60, -214), (86, -130), (290, -122), (300, -40)])
    shaded(c, body, (112, 168, 160), (78, 124, 124), sh=(14, 10), rimL=(200, 236, 222), rl=(-4, -4))
    c.drawPath(smooth_closed([(-74, -200), (40, -204), (62, -136), (-96, -134)]), P((170, 214, 226)))   # window
    c.drawRect(skia.Rect(-280, -66, 300, -50), P((228, 230, 232)))                                      # chrome trim
    for wx in (-180, 190):
        c.drawCircle(wx, -34, 50, P((40, 40, 48))); c.drawCircle(wx, -34, 26, P((170, 170, 176))); c.drawCircle(wx, -34, 10, P((90, 90, 100)))
    c.drawRect(skia.Rect(270, -112, 300, -94), P((255, 236, 180)))
    c.restore()


def shade_cloth(c, t, x0, x1, y, ground_y):
    """a ragged sun shade on two poles over the stand; its loose front edge flutters in the hot wind"""
    for px in (x0 + 20, x1 - 20):
        c.drawRect(skia.Rect(px - 7, y, px + 7, ground_y), P((132, 96, 66))); c.drawRect(skia.Rect(px - 7, y, px - 2, ground_y), P((168, 128, 92)))
    top = [(x0 - 20, y - 6), (x1 + 20, y - 20)]
    pts = top + [(x1 + 20 - (x1 - x0 + 40) * u, y + 60 + 10 * math.sin(u * 19 + t * 5) + 6 * math.sin(u * 7 - t * 3)) for u in np.linspace(0, 1, 18)]
    cl = skia.Path(); cl.addPoly([skia.Point(*p) for p in pts], True)
    c.drawPath(cl, P((232, 144, 92)))
    c.save(); c.clipPath(cl, skia.ClipOp.kIntersect, True)
    for j in range(6): xx = x0 + j * (x1 - x0) / 5; c.drawRect(skia.Rect(xx, y - 40, xx + 34, y + 90), P((246, 222, 186)))
    c.drawRect(skia.Rect(x0 - 40, y + 30, x1 + 40, y + 90), P((150, 80, 60), 90))
    c.restore()
    c.drawRect(skia.Rect(x0 - 20, y + 64, x1 + 20, y + 180), P((120, 70, 50), 50, MaskFilter=blur(30)))   # its shadow falls straight down


def stand(c, t, x0, x1, top, bottom):
    """crate counter: old planks, a hand painted sign, a cooler with a few sweating bottles on top"""
    c.drawOval(skia.Rect(x0 - 30, bottom - 20, x1 + 30, bottom + 30), P((110, 70, 50), 140, MaskFilter=blur(12)))
    n = 3; w = (x1 - x0) / n
    for i in range(n):
        a, b = x0 + i * w, x0 + (i + 1) * w - 6
        cr = skia.Rect(a, top + 30, b, bottom)
        c.drawRect(cr, P((196, 146, 96))); c.drawRect(skia.Rect(b - 22, top + 30, b, bottom), P((160, 112, 74)))
        for k in range(4):
            yy = top + 30 + (k + 1) * (bottom - top - 30) / 4.5; c.drawLine(a, yy, b, yy, SP((150, 104, 70), 4))
        c.drawLine(a + 4, top + 34, b - 4, bottom - 4, SP((176, 126, 84), 9))
    c.drawRect(skia.Rect(x0 - 16, top, x1 + 16, top + 34), P((214, 168, 112))); c.drawRect(skia.Rect(x0 - 16, top + 24, x1 + 16, top + 34), P((168, 120, 80)))
    sg = skia.Rect(x0 + 40, top + 80, x0 + 250, top + 170)
    c.drawRect(sg, P((240, 226, 196))); c.drawRect(skia.Rect(sg.left(), sg.bottom() - 10, sg.right(), sg.bottom()), P((210, 190, 160)))
    text_c(c, 'COLD WATER', sg.centerX(), sg.top() + 58, 34, (40, 100, 170))
    # the cooler with bottles standing in ice
    cx = x1 - 150
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 90, top - 100, cx + 90, top + 4), 12, 12), P((236, 240, 244)))
    c.drawRect(skia.Rect(cx + 50, top - 100, cx + 90, top + 4), P((196, 204, 216)))
    c.drawRect(skia.Rect(cx - 90, top - 40, cx + 90, top - 28), P((60, 120, 190)))
    for j, bx in enumerate((-50, -14, 22)):
        bottle(c, cx + bx, top - 128, 0, 0.62, level=0.88, t=t + j, wet=1.0)


def shimmer(c, y0, y1, t, amp=3.2):
    """heat haze: the band just above the hot ground wobbles sideways (device space)"""
    surf = c.getSurface()
    if surf is None: return
    img = surf.makeImageSnapshot().toarray()
    a, b = max(0, int(y0)), min(H_, int(y1))
    if b - a < 4: return
    band = img[a:b].copy()
    ys = np.arange(b - a, dtype=np.float32)[:, None]; xs = np.arange(W_, dtype=np.float32)[None, :]
    env = np.sin(np.pi * ys / (b - a)) ** 1.5
    mx = (xs + amp * env * np.sin(ys * 0.21 + t * 9.0) + 0.6 * amp * env * np.sin(ys * 0.07 - t * 5.3 + xs * 0.01)).astype(np.float32)
    my = np.repeat(ys, W_, axis=1).astype(np.float32)
    out = cv2.remap(band, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    c.save(); c.resetMatrix()
    c.drawImage(skia.Image.fromarray(np.ascontiguousarray(out), colorType=skia.kBGRA_8888_ColorType), 0, a)
    c.restore()


def world_back(c, t, hz=1080, stand_on=True, truck=True):
    sky(c, t, hz); mesas(c, t, hz); ground(c, t, hz)
    if truck: pickup(c, 905, hz + 210, 0.9)


# ------------------------------------------------------------------ people's poses
def seller_pose(t, raise_=1.0, ring=False, glint=0.0, lvl=0.86, hold=True):
    """the stranger: raise_ 0 = arm down, 1 = the bottle held up beside his head"""
    up = lerp(9, 30, raise_); fore = lerp(8, 140, raise_)
    ps = pose(head_yaw=-0.28, look=(-0.6, 0.1), breath=0.5 + 0.5 * math.sin(t * 2.1), r_up=up, r_fore=fore, r_wrist=-30, smile=0.15, brow=0.2,
              lid=1.0 if (t % 3.7) > 0.12 else 0.15, l_up=8, l_fore=10, sway=-6)
    if hold:
        ps.r_hand = H.GRIP if not ring else dict(curls=(0.4, 0.5, 0.8, 0.84, 0.86), spread=0.1)
        ps.r_habs = lerp(60, -10, raise_) if not ring else -60
        if not ring: ps.r_prop = CH.held_bottle(level=lvl, t=t, glint=glint)
        else: ps.r_over = pinch_ring(glint, t)
    return ps


def pinch_ring(sparkle, t, scale=1.0):
    def f(c, Wf, hw, ang, ts, s):
        p = Wf(76, 21)
        ring_loose(c, p[0], p[1], 9.5 * s * scale, math.degrees(ang) - 90, sparkle, t)
    return f


BOTTLE_HABS = 0


def lost_pose(t, yaw=0.45, look=(0.6, 0.0), arm_out=0.0, sq=0.62, worry=0.6, bottle_lvl=None):
    ps = pose(head_yaw=yaw, look=look, lid=sq if (t % 4.3) > 0.12 else 0.08, worry=worry, brow=-0.2, breath=0.5 + 0.5 * math.sin(t * 2.6),
              l_up=lerp(8, 50, arm_out), l_fore=lerp(10, -30, arm_out), l_wrist=-10, r_up=7, r_fore=8, sway=8, head_tilt=-2)
    ps.l_over = CH.ring_on_finger(0.0)
    if bottle_lvl is not None:
        ps.l_hand = H.GRIP; ps.l_up = 30; ps.l_fore = 105; ps.l_habs = BOTTLE_HABS; ps.l_prop = CH.held_bottle(level=bottle_lvl, t=t, wet=0.6, flip=180, cap=False)
        ps.l_over = None
    return ps


# ------------------------------------------------------------------ value cards (in the world)
def card(c, x, y, lab, val, col, a=1.0, w=230, h=300, top_line=None):
    """a small card hanging in the scene: what ONE MORE of this is worth here. val 0..1.2 fills the bar (can spill over the top)"""
    if a <= 0: return
    c.save(); c.saveLayerAlpha(None, int(255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 + 4, y + 8, x + w / 2 + 4, y + h + 8), 26, 26), P((60, 30, 20), 90, MaskFilter=blur(12)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y, x + w / 2, y + h), 26, 26), P((24, 22, 44), 225))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y, x + w / 2, y + h), 26, 26), SP((255, 255, 255), 3, 120))
    text_c(c, 'NEXT', x, y + 44, 30, (255, 210, 63)); text_c(c, lab, x, y + 80, 34, (255, 255, 255))
    bx0, bx1, by0, by1 = x - 34, x + 34, y + 104, y + h - 22
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 14, 14), P((255, 255, 255), 40))
    hh = (by1 - by0) * max(0.0, val); top_ = by1 - hh
    c.save()
    if val <= 1.0: c.clipRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 14, 14), True)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, top_, bx1, by1), 14, 14), P(col))
    c.drawRect(skia.Rect(bx0 + 8, top_ + 6, bx0 + 18, by1 - 8), P((255, 255, 255), 90))
    if val > 1.0: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0 - 8, top_ - 8, bx1 + 8, top_ + 30), 16, 16), P(col, 120, MaskFilter=blur(10)))
    c.restore()
    c.restore(); c.restore()


def leader(c, x0, y0, x1, y1, a):
    if a <= 0: return
    c.drawLine(x0, y0, x1, y1, SP((255, 255, 255), 3.5, 200 * a)); c.drawCircle(x1, y1, 9, P((255, 210, 63), 255 * a)); c.drawCircle(x1, y1, 9, SP((24, 22, 44), 3, 255 * a))


def chip(c, txt, x, y, col, a, ink=(255, 255, 255), sz=44):
    if a <= 0: return
    f = font(sz); w = f.measureText(txt)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 28, y - sz - 2, x + w / 2 + 28, y + sz * 0.55), 36, 36), P(col, 255 * a))
    c.drawString(txt, x - w / 2, y + 4, f, P(ink, 255 * a))


# ------------------------------------------------------------------ memory of home (a heat haze panel, drawn in the scene)
def haze_panel(c, t, rect, a):
    """the panel's edge wobbles like heat haze; returns the clip path"""
    x0, y0, x1, y1 = rect; n = 60; pts = []
    for i in range(n):
        u = i / n; ang = 2 * math.pi * u
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
        k = 1 + 0.02 * math.sin(ang * 7 + t * 4) + 0.015 * math.sin(ang * 13 - t * 6)
        e = 4.0                                                 # a squarish ellipse (superellipse)
        cs, sn = math.cos(ang), math.sin(ang)
        pts.append((cx + rx * k * math.copysign(abs(cs) ** (2 / e), cs), cy + ry * k * math.copysign(abs(sn) ** (2 / e), sn)))
    pa = smooth_closed(pts)
    c.drawPath(pa, P((255, 246, 226), 160 * a, MaskFilter=blur(26)))
    return pa


def memory_home(c, t, a, rect, show):
    """home: a jeweller's window (diamond ring, THOUSANDS tag), a shelf of water bottles ($1 tag), a kitchen tap running"""
    if a <= 0: return
    pa = haze_panel(c, t, rect, a)
    c.save(); c.saveLayerAlpha(None, int(255 * a)); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    x0, y0, x1, y1 = rect; mxp = (x0 + x1) / 2
    c.drawRect(skia.Rect(x0, y0, x1, y1), P((236, 232, 226)))
    c.drawRect(skia.Rect(x0, y1 - 120, x1, y1), P((206, 196, 186)))
    # left: the jeweller's window (dark velvet, warm spot lights)
    jw = skia.Rect(x0 + 30, y0 + 40, mxp - 15, y1 - 60)
    c.drawRect(jw, P((40, 30, 54))); c.drawRect(skia.Rect(jw.left(), jw.top(), jw.right(), jw.top() + 16), P((200, 170, 90)))
    for k in range(3): c.drawCircle(jw.left() + (k + 1) * jw.width() / 4, jw.top() + 20, 60, P((255, 230, 160), 60, MaskFilter=blur(30)))
    hl = show.get('jewel', 0)
    cx, cy = jw.centerX(), jw.bottom() - 120
    c.drawPath(smooth_closed([(cx - 50, cy + 70), (cx - 30, cy - 10), (cx + 30, cy - 10), (cx + 50, cy + 70)]), P((96, 40, 70)))   # velvet ring stand
    ring_loose(c, cx, cy - 26, 30, 0, 0.6 * hl + 0.25 * (0.5 + 0.5 * math.sin(t * 3)), t)
    tag(c, cx + 2, cy + 112, 'THOUSANDS', (255, 210, 63), hl)
    # right: a kitchen: a shelf of bottles and a tap
    kx = mxp + 15
    c.drawRect(skia.Rect(kx, y0 + 40, x1 - 30, y1 - 60), P((246, 246, 242)))
    sh = y0 + 0.42 * (y1 - y0)
    c.drawRect(skia.Rect(kx + 10, sh, x1 - 40, sh + 12), P((190, 170, 150)))
    nb = 6
    for j in range(nb):
        bottle(c, kx + 40 + j * (x1 - 70 - kx - 40) / (nb - 1), sh - 50, 0, 0.62, level=0.9, t=t + j, wet=0)
    hb = show.get('bottle', 0)
    tag(c, kx + (x1 - 30 - kx) / 2, sh + 68, 'ABOUT $1', (90, 220, 200), hb, ink=(20, 18, 44))
    # the tap over a sink, water running
    tx, ty = kx + (x1 - 30 - kx) * 0.62, y1 - 150
    c.drawRect(skia.Rect(kx + 10, y1 - 92, x1 - 40, y1 - 72), P((200, 204, 212)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - 8, ty - 70, tx + 8, ty), 6, 6), P((180, 186, 196)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - 8, ty - 70, tx + 50, ty - 54), 6, 6), P((200, 206, 216)))
    run = show.get('tap', 0)
    if run > 0:
        sx_ = tx + 44
        c.drawRect(skia.Rect(sx_ - 5, ty - 54, sx_ + 5, y1 - 86), P((140, 200, 240), 230 * run))
        for k in range(5):
            yy = ty - 50 + ((t * 300 + k * 24) % 120); c.drawLine(sx_ - 2, yy, sx_ - 2, yy + 10, SP((255, 255, 255), 2, 200 * run))
    c.restore(); c.restore()
    c.drawPath(pa, SP((255, 255, 255), 4, 150 * a))


def tag(c, x, y, txt, col, a, ink=(20, 18, 44)):
    if a <= 0: return
    f = font(36); w = f.measureText(txt)
    c.save(); c.translate(x, y); c.rotate(-4); s = 0.85 + 0.15 * a; c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w / 2 - 22, -40, w / 2 + 22, 14), 12, 12), P(col, 255 * a))
    c.drawCircle(-w / 2 - 6, -13, 6, P((255, 255, 255), 255 * a))
    c.drawString(txt, -w / 2 + 4, 0, f, P(ink, 255 * a))
    c.restore()


def memory_endless(c, t, a, rect, u_shrink):
    """at home there's always more water: three shelves of bottles running off into the distance"""
    if a <= 0: return
    pa = haze_panel(c, t, rect, a)
    c.save(); c.saveLayerAlpha(None, int(255 * a)); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    x0, y0, x1, y1 = rect
    c.drawRect(skia.Rect(x0, y0, x1, y1), P((238, 236, 232)))
    vx, vy = x1 + 40, (y0 + y1) / 2                                 # vanishing point off the right edge
    for r_, by in enumerate((y0 + 120, y0 + 230, y0 + 340)):
        c.drawLine(x0, by + 4, vx, vy, SP((176, 156, 136), 8))
        x = x0 + 30 - ((t * 40) % 60); sz = 1.0
        while x < x1 and sz > 0.08:
            sz = (vx - x) / (vx - x0)
            yy = vy + (by - vy) * sz
            bottle(c, x, yy - 52 * sz * 0.9, 0, 0.8 * sz, level=0.9, t=t + x * 0.01, wet=0)
            x += 70 * sz + 6
    c.drawRect(skia.Rect(x1 - 140, y0, x1, y1), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(x1 - 140, 0), skia.Point(x1, 0)], [C((238, 236, 232), 0), C((238, 236, 232), 255)])))
    c.restore(); c.restore()
    c.drawPath(pa, SP((255, 255, 255), 4, 150 * a))


# ------------------------------------------------------------------ shots
def two_shot(c, t, z0, z1, u, tx=540, ty=1200, seller_raise=1.0, lost_arm=0.0, seller_kw=None, lost_kw=None, cam_t=None):
    c.save(); push(c, u, 540, 1200, z0, z1, tx, ty)
    world_back(c, t)
    shade_cloth(c, t, 560, 1010, 870, 1720)
    sk = seller_kw or {}
    person(c, 'seller', seller_pose(t, seller_raise, **sk), 790, 1720, 0.74)
    stand(c, t, 560, 1010, 1390, 1720)
    m = c.getTotalMatrix(); y0 = m.mapXY(0, 1000).y(); y1 = m.mapXY(0, 1090).y()
    shimmer(c, y0, y1 + 20, t)
    lk = lost_kw or {}
    person(c, 'lost', lost_pose(t, arm_out=lost_arm, **lk), 290, 2080, 1.0)
    dust(c, t)
    c.restore()


def shot1(c, t):
    r = smooth(t / 1.3)                                         # he is already lifting the bottle at frame zero
    r = 0.25 + 0.75 * r
    two_shot(c, t, 1.0, 1.07, smooth(t / T2), 540, 1240, seller_raise=r, seller_kw=dict(glint=0.4 * smooth((t - 1.2) / 0.4)),
             lost_kw=dict(yaw=lerp(0.1, 0.5, smooth((t - 0.5) / 0.8)), look=(lerp(0.0, 0.7, smooth((t - 0.4) / 0.6)), 0.1)))


def hand_close_bg(c, t, z=1.6, cx=640, cy=1060, br=14):
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    blur_layer(c, br)
    world_back(c, t); shade_cloth(c, t, 560, 1010, 870, 1720)
    person(c, 'seller', seller_pose(t, 1.0, glint=0.5 + 0.5 * math.sin(t * 2)), 790, 1720, 0.74)
    stand(c, t, 560, 1010, 1390, 1720)
    c.restore()
    c.restore()


def sleeve_arm(c, look, el, wr, w0=110, w1=86, cuff=True):
    """a forearm in its sleeve from `el` to the wrist, shaded like the people (flat, one shade band, a rim)"""
    LK = CH.LOOKS[look]
    sl = limb(el, wr, w0, w1)
    shaded(c, sl, LK['TOP'], LK['TOP_SH'], sh=(8, 10), rimL=LK['TOP_HI'], rl=(-4, -4))
    if cuff:
        dx, dy = wr[0] - el[0], wr[1] - el[1]; L = math.hypot(dx, dy); ux, uy = dx / L, dy / L
        cf = limb((wr[0] - ux * 40, wr[1] - uy * 40), (wr[0] - ux * 6, wr[1] - uy * 6), w1 * 1.02, w1 * 0.98)
        c.drawPath(cf, P(mix(LK['TOP'], LK['TOP_SH'], 0.5)))


def hand_at(c, look, wr, ang, side, s, curls, spread=0.12, **kw):
    LK = CH.LOOKS[look]
    return H.hand(c, wr, ang, side, s, curls=curls, spread=spread, skin=LK['SKIN'], shade=LK['SKIN_SH'], hi=LK['SKIN_HI'], light=PN.LIGHT, nails=True, **kw)


def shot2(c, t):
    """his hand with the ring, the stranger and the bottle soft behind"""
    u = smooth((t - T2) / (T3 - T2))
    hand_close_bg(c, t, z=1.5 + 0.08 * u, cx=700, cy=1080, br=12)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 30))
    tr = 4 * math.sin(t * 11) * 0.3 + 2 * math.sin(t * 3.1)    # a small tremble
    wr = (330 + tr, 1420 - 30 * u); ang = math.radians(-30 + 3 * math.sin(t * 1.3))
    el = (wr[0] - math.cos(ang) * 520, wr[1] - math.sin(ang) * 520)
    sleeve_arm(c, 'lost', el, (wr[0] - math.cos(ang) * 30, wr[1] - math.sin(ang) * 30), 330, 250)
    LK = CH.LOOKS['lost']; s = 6.4
    Wf = hand_at(c, 'lost', wr, ang, -1, s, (0.34, 0.36, 0.42, 0.5, 0.58), 0.08)
    CH.ring_on_finger(0.4 + 0.6 * smooth((t - 7.44) / 0.3) * (1 - smooth((t - 8.6) / 0.6)), t)(c, Wf, wr, ang, -1, s)
    rs = np.random.default_rng(4)                               # dust in the creases of his knuckles
    for _ in range(10):
        p = Wf(rs.uniform(0, 50), rs.uniform(-20, 20)); c.drawCircle(p[0], p[1], rs.uniform(3, 7), P((186, 150, 110), 60, MaskFilter=blur(3)))
    dust(c, t, 0.8)


def face_close(c, t, s=2.5, x=540, ground=None, head_y=900, ps=None, bg_blur=16, bgz=1.6):
    c.save(); c.translate(540, 960); c.scale(bgz, bgz); c.translate(-560, -1080)
    blur_layer(c, bg_blur); world_back(c, t); shade_cloth(c, t, 560, 1010, 870, 1720); stand(c, t, 560, 1010, 1390, 1720); c.restore()
    c.restore()
    gy = head_y + 952 * s * 0.98 if ground is None else ground
    person(c, 'lost', ps, x, gy, s)


def shot3(c, t):
    u = (t - T3) / (T4 - T3)
    look = (lerp(0.2, 0.0, smooth(u / 0.3)), lerp(0.2, 1.0, smooth(u / 0.3))) if u < 0.55 else (lerp(0.0, 0.8, smooth((u - 0.55) / 0.2)), lerp(1.0, -0.2, smooth((u - 0.55) / 0.2)))
    ps = lost_pose(t, yaw=lerp(0.15, 0.3, u), look=look, sq=0.55, worry=0.8)
    ps.head_tilt = lerp(3, -2, smooth((u - 0.5) / 0.4))
    c.save(); z = 1.0 + 0.04 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    face_close(c, t, s=2.7, head_y=880, ps=ps)
    sweat(c, t, 540, 880, 2.7)
    c.restore()


def sweat(c, t, x, y, s):
    """a bead of sweat slides down his temple (gravity)"""
    u = (t * 0.35) % 1.0
    px, py = x - 50 * s * 0.86, y - 40 * s * 0.86 + u * 70 * s * 0.86
    c.drawCircle(px, py, 4.5 * s, P((255, 255, 255), 150 * (1 - u))); c.drawCircle(px - 1.4 * s, py - 1.4 * s, 1.6 * s, P((255, 255, 255), 230 * (1 - u)))


def shot4(c, t):
    u = smooth((t - T4) / (T5 - T4))
    world_back(c, t, hz=1180)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 240, 210), 30))
    show = dict(jewel=smooth((t - WD.at('diamond', 3)) / 0.3), bottle=smooth((t - WD.at('bottle', 2)) / 0.3), tap=smooth((t - WD.at('water', 4)) / 0.3))
    a = smooth((t - T4 - 0.1) / 0.4)
    c.save(); z = 1.0 + 0.03 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    memory_home(c, t, a, (60, 560, 1020, 1130), show)
    c.restore()
    look = (0.15, -1.0) if t < 17.0 else (0.1, -0.6)
    ps = lost_pose(t, yaw=0.12, look=look, sq=0.6, worry=0.7)
    ps.head_tilt = -4
    c.save(); z = 1.0 + 0.05 * u; c.translate(540, 1500); c.scale(z, z); c.translate(-540, -1500)
    person(c, 'lost', ps, 540, 1290 + 952 * 1.7 * 0.98, 1.7)
    c.restore()
    shimmer(c, 1140, 1230, t)
    dust(c, t, 0.7)


def bars_values(t):
    """water bar and diamond bar: at home (water tiny), out here (water over the top)"""
    home = smooth((t - WD.at('home', 2)) / 0.4)
    shrink = smooth((t - WD.at('so', 1)) / 1.2)
    out = smooth((t - WD.at('out')) / 0.9)
    water = lerp(0.35, 0.22, home); water = lerp(water, 0.05, shrink); water = lerp(water, 1.18, out)
    return water, 0.86


def shot5(c, t):
    u = smooth((t - T5) / (T6 - T5))
    two_shot(c, t, 1.22, 1.28, u, 540, 1200, seller_raise=0.55 + 0.45 * smooth((t - T5) / 1.2), lost_arm=0.0,
             seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.0)))


def shot6(c, t):
    u = smooth((t - T6) / (T7 - T6))
    arm = smooth((t - (T6 + 0.4)) / 0.9)
    two_shot(c, t, 1.28, 1.34, u, 540, 1200, seller_raise=1.0, lost_arm=arm, seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.1)))
    a = smooth((t - WD.at('next') + 0.1) / 0.35)
    water, dia = bars_values(t)
    hb, hr = PN.HANDS_SELLER, PN.HANDS_LOST
    card(c, 905, 590, 'BOTTLE', water, WBAR, a)
    leader(c, 880, 890, hb[0] + 30, hb[1] - 40, a)
    card(c, 175, 590, 'DIAMOND', dia, DBAR, a)
    leader(c, 200, 890, hr[0] + 10, hr[1], a)
    me = smooth((t - WD.at('home', 2) + 0.1) / 0.4)
    memory_endless(c, t, me, (310, 570, 770, 930), 0)


def shot7(c, t):
    """close on the one bottle in the stranger's hand; the cards: the water bar climbs over the diamond bar"""
    u = smooth((t - T7) / (T8 - T7))
    hand_close_bg(c, t, z=2.0, cx=640, cy=1000, br=18)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    ang = math.radians(-4 + 2 * math.sin(t * 1.4)); s = 5.0
    wr = (560 + 10 * u, 1150 - 20 * u)
    el = (wr[0] + 560, wr[1] + 420)
    sleeve_arm(c, 'seller', el, (wr[0] + 30, wr[1] + 18), 260, 190)
    # the hand wraps the bottle: bottle first, then the fingers over it
    bx, by = wr[0] + s * 52 * math.cos(ang), wr[1] + s * 52 * math.sin(ang) - 34 * s
    bottle(c, bx, by, math.degrees(ang), s, level=0.86, t=t, glint=0.4 + 0.6 * smooth((t - WD.at('only') + 0.2) / 0.3), wet=1.0)
    hand_at(c, 'seller', wr, ang, 1, s, H.GRIP['curls'], 0.05)
    water, dia = bars_values(t)
    card(c, 160, 600, 'DIAMOND', dia, DBAR, 1.0)
    card(c, 410, 600, 'BOTTLE', water, WBAR, 1.0)
    dust(c, t, 0.8)


def shot8(c, t):
    """the trade, close on the hands: the stranger's fingers take the ring; the bottle passes from his grip to the lost man's"""
    hand_close_bg(c, t, z=1.9, cx=600, cy=1250, br=20)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    s = 3.3
    # --- the ring: lost man's right hand comes in from the left with the ring pinched; the stranger's left hand from the right takes it
    k_in = smooth((t - T8) / 0.3)
    take = smooth((t - 34.82) / 0.14)                           # the stranger's fingers close on the ring
    let = smooth((t - 34.96) / 0.14)                            # the lost man's fingers open
    away = smooth((t - 35.08) / 0.4)
    rp = (520, 820)                                             # where the ring is handed over
    # lost man's pinch: tip point at hand-local (76, 21)
    ang_l = math.radians(-14)
    def wr_for(p, ang, side, s_, u=76, v=21):
        return (p[0] - s_ * (u * math.cos(ang) - v * side * math.sin(ang)), p[1] - s_ * (u * math.sin(ang) + v * side * math.cos(ang)))
    lp = (lerp(260, 520, k_in) - 220 * away, lerp(900, 820, k_in) + 160 * away)
    lw = wr_for(lp, ang_l, 1, s)
    lcurls = H.blend(dict(curls=(0.4, 0.5, 0.82, 0.84, 0.86), spread=0.1), dict(curls=(0.25, 0.22, 0.6, 0.66, 0.7), spread=0.25), let)
    ang_r = math.radians(194)
    reach = smooth((t - 34.5) / 0.32)
    spt = (lerp(1180, 520, reach) + 420 * away, lerp(760, 820, reach) - 60 * away)
    sw = wr_for(spt, ang_r, -1, s)
    scurls = H.blend(dict(curls=(0.12, 0.15, 0.6, 0.66, 0.7), spread=0.3), dict(curls=(0.4, 0.5, 0.82, 0.84, 0.86), spread=0.1), take)
    ring_pt = lp if let < 0.5 else spt
    # --- the bottle: the stranger's right hand brings it in low from the right; the lost man's left hand closes on it; the stranger lets go
    b_in = smooth((t - 34.75) / 0.4)
    grab = smooth((t - 35.3) / 0.15)
    s_let = smooth((t - 35.5) / 0.15)
    pull = smooth((t - 35.62) / 0.38)
    bpos = (lerp(1250, 640, b_in) - 380 * pull, lerp(1380, 1300, b_in) - 120 * pull)
    sb_ang = math.radians(184); lb_ang = math.radians(-2)
    # stranger's grip lower on the bottle, lost man's grip higher
    def wr_grip(b, ang, dv):
        ax = (math.sin(ang), -math.cos(ang))                    # the bottle's axis (cap end), perpendicular to the fingers
        return (b[0] - s * 52 * math.cos(ang) + ax[0] * dv, b[1] - s * 52 * math.sin(ang) + ax[1] * dv)
    sbw = wr_grip(bpos, sb_ang, -40)
    sbw = (sbw[0] + 500 * smooth((t - 35.62) / 0.35), sbw[1] + 120 * smooth((t - 35.62) / 0.35))
    lb_in = smooth((t - 35.05) / 0.3)
    lbw_target = wr_grip(bpos, lb_ang, 70)
    lbw = (lerp(-200, lbw_target[0], lb_in), lerp(1500, lbw_target[1], lb_in)) if grab < 0.01 else lbw_target
    bcurls_l = H.blend(dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), H.GRIP, grab)
    bcurls_s = H.blend(H.GRIP, dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), s_let)
    # draw order: sleeves, the bottle, hands
    sleeve_arm(c, 'seller', (sbw[0] + 600, sbw[1] + 240), (sbw[0] + 20, sbw[1] + 8), 210, 160)
    sleeve_arm(c, 'lost', (lbw[0] - 600, lbw[1] + 300), (lbw[0] - 20, lbw[1] + 10), 190, 150)
    if b_in > 0:
        bottle(c, bpos[0], bpos[1], 0, s, level=0.86, t=t, glint=0.3, wet=1.0)
    if b_in > 0: hand_at(c, 'seller', sbw, sb_ang, -1, s, bcurls_s['curls'], bcurls_s['spread'])
    if lb_in > 0: hand_at(c, 'lost', lbw, lb_ang, 1, s, bcurls_l['curls'], bcurls_l['spread'])
    sleeve_arm(c, 'lost', (lw[0] - 640 * math.cos(ang_l), lw[1] - 640 * math.sin(ang_l) + 200), (lw[0] - 20 * math.cos(ang_l), lw[1] - 20 * math.sin(ang_l)), 190, 150)
    sleeve_arm(c, 'seller', (sw[0] + 620, sw[1] - 100), (sw[0] + 20, sw[1] - 4), 210, 160)
    hand_at(c, 'lost', lw, ang_l, 1, s, lcurls['curls'], lcurls['spread'])
    if reach > 0: hand_at(c, 'seller', sw, ang_r, -1, s, scurls['curls'], scurls['spread'])
    ring_loose(c, ring_pt[0], ring_pt[1], 9.5 * s, math.degrees(ang_l if let < 0.5 else ang_r) - 90, 0.5, t)
    dust(c, t, 0.6)


DRINK_WR = [None]


def shot9(c, t):
    """he drinks: his own arm from his elbow, his hand round the bottle, the bottle tipped to his lips, the water level dropping"""
    u = (t - T9) / (T10 - T9)
    tipu = smooth(u / 0.25)
    lvl = lerp(0.86, 0.42, smooth((u - 0.15) / 0.8))
    ps = lost_pose(t, yaw=0.0, look=(0.0, -0.3), sq=lerp(0.6, 0.04, smooth((u - 0.1) / 0.2)), worry=lerp(0.6, 0.0, u))
    ps.head_tilt = 0; ps.drink = 1
    ps.r_up = 22; ps.r_fore = 150; ps.hide = ('r',)
    c.save(); z = 1.0 + 0.03 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    s = 2.4
    mouth = (526, 820 + 60 * s * 0.86)
    ang_b = lerp(112, 128, tipu) + 6 * smooth((u - 0.3) / 0.6)                                  # bottle axis angle (open neck toward his lips)
    a_r = math.radians(ang_b)
    neck_len = 64 * s * 1.02
    bc = (mouth[0] - math.sin(a_r) * neck_len, mouth[1] + math.cos(a_r) * neck_len)
    hang = math.radians(ang_b - 180)                                # fingers across the bottle
    wr = (bc[0] - s * 52 * math.cos(hang) + math.sin(a_r) * 14, bc[1] - s * 52 * math.sin(hang) - math.cos(a_r) * 14)
    q_ = c.getTotalMatrix().mapXY(*wr)
    rec = skia.PictureRecorder(); dc = rec.beginRecording(skia.Rect(0, 0, 10, 10))
    dc.concat(c.getTotalMatrix()); person(dc, 'lost', ps, 540, 820 + 952 * s * 0.98, s); rec.finishRecordingAsPicture()
    el = PN.HANDS['r']['el']
    dx, dy = q_.x() - el[0], q_.y() - el[1]; a2 = math.degrees(math.atan2(dx, dy)); ps.r_fore = -a2 - ps.r_up   # his own forearm points at the hand
    face_close(c, t, s=s, head_y=820, ps=ps)
    el = PN.HANDS['r']['el']
    inv = skia.Matrix(); c.getTotalMatrix().invert(inv); e_ = inv.mapXY(*el); el = (e_.x(), e_.y())
    sleeve_arm(c, 'lost', el, (wr[0] - 18 * math.cos(hang), wr[1] - 18 * math.sin(hang)), 64 * s * 0.9, 56 * s * 0.9)
    bottle(c, bc[0], bc[1], ang_b, s, level=lvl, t=t, wet=0.7, cap=False)
    hand_at(c, 'lost', wr, hang, 1, s * 1.0, H.GRIP['curls'], 0.05)
    c.restore()


def shot10(c, t):
    u = smooth((t - T10) / (DUR - T10))
    up = smooth((t - T10 - 0.1) / 0.8)
    fl = smooth((t - (T10 + 1.0)) / 0.25) * (0.8 + 0.2 * math.sin(t * 7))
    two_shot(c, t, 1.3, 1.25, u, 520, 1240, seller_raise=0.3 + 0.7 * up, lost_arm=0.0,
             seller_kw=dict(ring=True, glint=fl), lost_kw=dict(yaw=0.4, look=(0.6, -0.4), sq=0.85, worry=0.0, bottle_lvl=0.4))
    if fl > 0:
        hx, hy = PN.HANDS_SELLER
        c.drawCircle(hx + 40, hy - 40, 190 * fl, P((255, 250, 230), 110 * fl, MaskFilter=blur(60)))
        for a_ in (0, 60, 120):
            c.save(); c.translate(hx + 40, hy - 40); c.rotate(a_ + 10 * t); L_ = 120 * fl
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-L_, -2.5, L_, 2.5), 2, 2), P((255, 255, 240), 200 * fl)); c.restore()


def scene(c, t):
    if t < T2: shot1(c, t)
    elif t < T3: shot2(c, t)
    elif t < T4: shot3(c, t)
    elif t < T5: shot4(c, t)
    elif t < T6: shot5(c, t)
    elif t < T7: shot6(c, t)
    elif t < T8: shot7(c, t)
    elif t < T9: shot8(c, t)
    elif t < T10: shot9(c, t)
    else: shot10(c, t)


# person() records the hands: keep the last seller and lost hand positions for leaders and flashes
_orig_person = CH.person


def _person_rec(c, who, ps, x, ground, s):
    _orig_person(c, who, ps, x, ground, s)
    if who == 'seller': PN.HANDS_SELLER = PN.HANDS['r']['w']
    else: PN.HANDS_LOST = PN.HANDS['l']['w']


person = _person_rec
PN.HANDS_SELLER = (700, 1000); PN.HANDS_LOST = (500, 1300)

ICEY = (170, 226, 255)
TITLES = [
    (0.0, [[('DIAMOND WATER PARADOX', Wt)], [('WOULD YOU ', Wt), ('TRADE?', Y)]]),
    (WD.at("he's"), [[('LOST FOR ', Wt), ('TWO DAYS', R)]]),
    (WD.at('a', 1), [[('HIS ', Wt), ('DIAMOND RING', ICEY)], [('FOR ONE ', Wt), ('BOTTLE?', BL)]]),
    (WD.at('would'), [[('WOULD YOU', Wt)], [('TAKE IT?', Y)]]),
    (WD.at('back'), [[('BACK HOME, A ', Wt), ('DIAMOND', ICEY)], [('COSTS ', Wt), ('THOUSANDS', Y)]]),
    (WD.at('and', 2), [[('A BOTTLE OF ', Wt), ('WATER', BL)], [('ABOUT ', Wt), ('A DOLLAR', TL)]]),
    (WD.at('even'), [[('BUT ', Wt), ('WATER', BL)], [('KEEPS YOU ', Wt), ('ALIVE', Y)]]),
    (WD.at('economists'), [[('THE ANSWER IS', Wt)], [('ONE WORD', Y)]]),
    (WD.at('marginal'), [[('MARGINAL', Y)]]),
    (WD.at('what'), [[('WHAT THE ', Wt), ('NEXT', Y)], [('ONE ', Wt), ('ADDS', Y)]]),
    (WD.at('at'), [[('AT HOME', Wt)], [('ALWAYS MORE ', Wt), ('WATER', BL)]]),
    (WD.at('so', 1), [[('ONE MORE BOTTLE', BL)], [('ADDS ', Wt), ('ALMOST NOTHING', R)]]),
    (WD.at('out'), [[('OUT HERE', Y)], [("IT'S THE ", Wt), ('ONLY ONE', BL)]]),
    (WD.at('he', 1), [[('HE TAKES', Wt)], [('THE TRADE', Y)]]),
    (WD.at('right'), [[('THE ', Wt), ('CHEAPEST', BL), (' THING', Wt)], [('IN THE WORLD', Wt)]]),
    (WD.at('is', 1), [[('WORTH MORE THAN', Wt)], [('A ', Wt), ('DIAMOND', ICEY)]]),
]

SHORT = Short(WD, 'AP MICROECONOMICS', TITLES, scene, DUR, T_END, lift=lambda t: 1.0, fix={'MARGINAL.': 'marginal.', 'NEXT': 'next'})

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1118/diamond/out/stills')
