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

WD = Words('/home/claude/w1118/diamond/out/words_t.json')      # word times after two silent pauses were trimmed (trim_voice.py)
SP_END = WD.end()
T2 = WD.at('a') - 0.12; T3 = WD.at('would') - 0.06; T4 = WD.at('back') - 0.04; T5 = WD.at('economists') - 0.06
T6A = WD.at('what') - 0.05; T6B = WD.at('what', 2) - 0.05; T6C = WD.at('at') - 0.05; T6D = WD.at('so') - 0.05
T7 = WD.at('out') - 0.05; T8 = WD.at('he') - 0.12; T9 = T8 + 1.6; T9B = T9 + 0.75; T10 = WD.at('is') - 0.06
T6 = T6A
T_FIN = SP_END + 0.06
DUR = round(SP_END + 1.9, 2)
T_END = DUR + 1.0                                               # titles and watermark run to the end; the URL is drawn by frame() below
OPEN = (1.2, 1.26)                                              # opening zoom (around y 900, so heads sit just below the poll band)
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
    sg = skia.Rect(x0 + 34, top + 74, x0 + 262, top + 176)            # a painted wooden board nailed to the crates
    c.drawRect(skia.Rect(sg.left() + 6, sg.top() + 8, sg.right() + 6, sg.bottom() + 8), P((70, 40, 26), 120, MaskFilter=blur(6)))
    c.drawRect(sg, P((196, 150, 102)))
    for k in range(1, 3): yy = sg.top() + k * sg.height() / 3; c.drawLine(sg.left(), yy, sg.right(), yy, SP((150, 108, 70), 3))
    c.drawRect(skia.Rect(sg.left(), sg.top(), sg.right(), sg.top() + 6), P((186, 134, 90)))
    for nx in (sg.left() + 12, sg.right() - 12): c.drawCircle(nx, sg.top() + 16, 4, P((90, 80, 76)))
    text_c(c, 'COLD WATER', sg.centerX(), sg.top() + 66, 38, (54, 30, 20))
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
              lid=1.0 if ((t + 1.1) % 3.7) > 0.12 else 0.15, l_up=8, l_fore=10, sway=-6)
    if hold:
        ps.r_hand = H.GRIP if not ring else dict(curls=(0.4, 0.5, 0.8, 0.84, 0.86), spread=0.1)
        ps.r_habs = lerp(60, -10, raise_) if not ring else -60
        if not ring: ps.r_prop = CH.held_bottle(level=lvl, t=t, glint=glint)
        else: ps.r_over = pinch_ring(glint, t)
    return ps


RING_PT = [None]


def pinch_ring(sparkle, t, scale=1.0):
    def f(c, Wf, hw, ang, ts, s):
        p = Wf(76, 21)
        ring_loose(c, p[0], p[1], 9.5 * s * scale, math.degrees(ang) - 90, sparkle, t)
        q = c.getTotalMatrix().mapXY(p[0], p[1] - 9.5 * s * scale * 0.82); RING_PT[0] = (q.x(), q.y())
    return f


BOTTLE_HABS = 0


def lost_pose(t, yaw=0.45, look=(0.6, 0.0), arm_out=0.0, sq=0.62, worry=0.6, bottle_lvl=None, smile=0.0, bottle_fore=105, **extra):
    ps = pose(head_yaw=yaw, look=look, lid=sq if ((t + 1.7) % 4.3) > 0.12 else 0.08, worry=worry, brow=-0.2, smile=smile, breath=0.5 + 0.5 * math.sin(t * 2.6),
              l_up=lerp(8, 50, arm_out), l_fore=lerp(10, -30, arm_out), l_wrist=-10, r_up=7, r_fore=8, sway=8, head_tilt=-2)
    ps.l_over = CH.ring_on_finger(0.0)
    if bottle_lvl is not None:
        ps.l_hand = H.GRIP; ps.l_up = 30; ps.l_fore = bottle_fore; ps.l_habs = BOTTLE_HABS; ps.l_prop = CH.held_bottle(level=bottle_lvl, t=t, wet=0.6, flip=180, cap=False)
        ps.l_over = None
    for k_, v_ in extra.items(): setattr(ps, k_, v_)
    return ps


# ------------------------------------------------------------------ value cards (in the world)
def card(c, x, y, lab, val, col, a=1.0, w=300, h=420, unknown=False):
    """a card hanging in the scene: the VALUE OF ONE MORE of this, here. val 0..1.2 fills the bar (it can spill over the top)"""
    if a <= 0: return
    c.save(); c.saveLayerAlpha(None, int(255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 + 4, y + 8, x + w / 2 + 4, y + h + 8), 28, 28), P((60, 30, 20), 100, MaskFilter=blur(12)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y, x + w / 2, y + h), 28, 28), P((24, 22, 44), 235))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2, y, x + w / 2, y + h), 28, 28), SP((255, 255, 255), 3, 130))
    text_c(c, 'VALUE OF', x, y + 48, 40, (255, 210, 63)); text_c(c, 'ONE MORE', x, y + 92, 40, (255, 210, 63))
    text_c(c, lab, x, y + 140, 42 if w < 290 else 46, (255, 255, 255))
    bx0, bx1, by0, by1 = x - 40, x + 40, y + 162, y + h - 20
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 16, 16), P((255, 255, 255), 40))
    if unknown:
        text_c(c, '?', x, (by0 + by1) / 2 + 22, 64, (255, 255, 255), 200)
    else:
        hh = (by1 - by0) * max(0.0, val); top_ = by1 - hh
        c.save()
        if val <= 1.0: c.clipRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 16, 16), True)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, top_, bx1, by1), 16, 16), P(col))
        c.drawRect(skia.Rect(bx0 + 9, top_ + 7, bx0 + 20, by1 - 9), P((255, 255, 255), 90))
        if val > 1.0: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0 - 10, top_ - 10, bx1 + 10, top_ + 34), 18, 18), P(col, 130, MaskFilter=blur(12)))
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


TAKE_B = [(0, 0)]


def memory_home(c, t, a, rect, show):
    """home: a jeweller's window (glass, brass frame, velvet stand, an open ring box, a price tag on a string) and a kitchen
    (tiles, a shelf of water bottles with a price tag, a chrome tap running into a steel sink)"""
    if a <= 0: return
    pa = haze_panel(c, t, rect, a)
    c.save(); c.saveLayerAlpha(None, int(255 * a)); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    x0, y0, x1, y1 = rect; mxp = (x0 + x1) / 2
    # ---- left: the jeweller's shop front
    c.drawRect(skia.Rect(x0, y0, mxp, y1), P((70, 46, 40)))                                       # dark wood shop front
    jw = skia.Rect(x0 + 50, y0 + 70, mxp - 30, y1 - 70)
    c.drawRect(skia.Rect(jw.left() - 14, jw.top() - 14, jw.right() + 14, jw.bottom() + 14), P((206, 168, 92)))   # brass frame
    c.drawRect(jw, P((34, 26, 48)))
    for k in range(3): c.drawCircle(jw.left() + (k + 1) * jw.width() / 4, jw.top() + 10, 70, P((255, 228, 170), 70, MaskFilter=blur(34)))   # spot lights
    hl = show.get('jewel', 0)
    cx, base = jw.centerX(), jw.bottom() - 40
    c.drawRect(skia.Rect(jw.left(), base, jw.right(), jw.bottom()), P((96, 34, 60)))              # velvet floor of the window
    c.drawPath(smooth_closed([(cx - 120, base), (cx - 100, base - 70), (cx + 100, base - 70), (cx + 120, base)]), P((120, 44, 74)))   # display step
    bx_ = skia.Rect(cx - 70, base - 150, cx + 70, base - 70)                                      # the ring box, open
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_.left(), bx_.top() - 70, bx_.right(), bx_.top() + 4), 12, 12), P((40, 22, 40)))   # lid, open
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx_.left() + 10, bx_.top() - 62, bx_.right() - 10, bx_.top() - 4), 8, 8), P((236, 226, 236)))   # satin lining
    c.drawRRect(skia.RRect.MakeRectXY(bx_, 10, 10), P((58, 30, 52))); c.drawRect(skia.Rect(bx_.left(), bx_.top(), bx_.right(), bx_.top() + 26), P((110, 40, 70)))   # cushion
    ring_loose(c, cx, bx_.top() - 4, 34, 0, 0.5 * hl + 0.3 * (0.5 + 0.5 * math.sin(t * 3)), t)
    stx, sty = cx + 90, base - 100                                                                # the price tag on a thread
    c.drawLine(bx_.right() - 8, bx_.top() + 20, stx - 40, sty - 20, SP((240, 230, 210), 2))
    tag(c, stx + 10, sty + 20, 'THOUSANDS', (255, 210, 63), max(0.35, hl))
    c.save(); c.clipRect(jw)                                                                      # the glass: two slanted reflections
    for k, (o, wd) in enumerate(((0.15, 46), (0.32, 18))):
        xx = jw.left() + o * jw.width() + 40 * math.sin(t * 0.3)
        pg = skia.Path(); pg.addPoly([skia.Point(xx, jw.bottom()), skia.Point(xx + wd, jw.bottom()), skia.Point(xx + wd + 220, jw.top()), skia.Point(xx + 220, jw.top())], True)
        c.drawPath(pg, P((255, 255, 255), 46))
    c.restore()
    # ---- right: the kitchen
    c.drawRect(skia.Rect(mxp, y0, x1, y1), P((242, 240, 234)))
    for j in range(int((x1 - mxp) / 46) + 1):                                                    # tiles
        for i in range(int((y1 - y0) / 46) + 1):
            c.drawRect(skia.Rect(mxp + j * 46 + 2, y0 + i * 46 + 2, mxp + j * 46 + 44, y0 + i * 46 + 44), P((226, 232, 236)))
    sh = y0 + 0.36 * (y1 - y0)
    c.drawRect(skia.Rect(mxp + 30, sh, x1 - 40, sh + 14), P((176, 140, 104))); c.drawRect(skia.Rect(mxp + 30, sh + 14, x1 - 40, sh + 22), P((120, 90, 70), 160))
    nb = 6; rch = show.get('reach', 0.0); grab = show.get('grab', 0.0); lift = show.get('lift', 0.0)
    for j in range(nb):
        bx_, by_ = mxp + 70 + j * (x1 - 110 - mxp - 70) / (nb - 1), sh - 54
        if j == nb - 1: bx_, by_ = bx_ + 26 * lift, by_ - 40 * lift                 # the one he takes moves only once his hand has it
        bottle(c, bx_, by_, 0, 0.66, level=0.9, t=t + j, wet=0)
        if j == nb - 1: TAKE_B[0] = (bx_, by_)
    hb = show.get('bottle', 0)
    tag(c, mxp + 120, sh + 64, 'ABOUT $1', (90, 220, 200), max(0.35, hb), ink=(20, 18, 44))
    if rch > 0:                                                                       # a hand from the right takes the last bottle off the shelf
        hs_ = 0.9; bx_, by_ = TAKE_B[0]
        tgt = (bx_ + 52 * hs_, by_ + 4)
        wr = (lerp(x1 + 120, tgt[0], rch), lerp(by_ + 40, tgt[1], rch))
        sleeve_arm(c, 'lost', (wr[0] + 260, wr[1] + 60), (wr[0] + 10, wr[1] + 2), 44, 34)
        cur = H.blend(dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), H.GRIP, grab)
        hand_at(c, 'lost', wr, math.pi, -1, hs_, cur['curls'], cur['spread'])
    # counter, sink and tap
    cy_ = y1 - 120
    c.drawRect(skia.Rect(mxp, cy_, x1, y1), P((206, 196, 184))); c.drawRect(skia.Rect(mxp, cy_, x1, cy_ + 12), P((232, 224, 214)))
    sk = skia.Rect(mxp + 90, cy_ + 6, x1 - 90, cy_ + 50)
    c.drawRRect(skia.RRect.MakeRectXY(sk, 14, 14), P((150, 160, 172))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(sk.left() + 8, sk.top() + 6, sk.right() - 8, sk.bottom()), 12, 12), P((112, 122, 136)))
    tx = sk.centerX() + 30
    neck = skia.Path(); neck.moveTo(tx, cy_); neck.lineTo(tx, cy_ - 110); neck.quadTo(tx, cy_ - 170, tx + 60, cy_ - 170); neck.quadTo(tx + 110, cy_ - 170, tx + 110, cy_ - 120)
    c.drawPath(neck, SP((150, 158, 170), 22)); c.drawPath(neck, SP((214, 222, 232), 12)); c.drawPath(neck, SP((255, 255, 255), 4, 200))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - 22, cy_ - 12, tx + 22, cy_ + 4), 6, 6), P((170, 178, 190)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - 50, cy_ - 50, tx - 22, cy_ - 38), 6, 6), P((200, 208, 220)))   # the handle
    run = show.get('tap', 0)
    if run > 0:
        sx_, top_ = tx + 110, cy_ - 118
        bot = lerp(top_, sk.bottom() - 6, min(1.0, run * 1.6))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(sx_ - 7, top_, sx_ + 7, bot), 6, 6), P((150, 210, 246), 235))
        c.drawRect(skia.Rect(sx_ - 2, top_, sx_ + 1, bot), P((255, 255, 255), 200))
        for k in range(6):
            yy = top_ + ((t * 420 + k * 30) % max(1, bot - top_)); c.drawLine(sx_ + 3, yy, sx_ + 3, yy + 12, SP((255, 255, 255), 2, 180))
        if run > 0.6:
            for k in range(5):
                u_ = (t * 3 + k * 0.2) % 1.0; ang = math.radians(200 + k * 35)
                c.drawCircle(sx_ + math.cos(ang) * 30 * u_, sk.bottom() - 10 - 22 * u_ * (1 - u_) * 4, 3.5, P((200, 236, 255), 220 * (1 - u_)))
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
    """at home there's always more water: a supermarket aisle of water, shelves on both sides running off to the far wall"""
    if a <= 0: return
    pa = haze_panel(c, t, rect, a)
    c.save(); c.saveLayerAlpha(None, int(255 * a)); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    x0, y0, x1, y1 = rect; vx, vy = (x0 + x1) / 2, y0 + (y1 - y0) * 0.44
    c.drawRect(skia.Rect(x0, y0, x1, y1), P((236, 236, 232)))                                    # far wall and ceiling
    fl = skia.Path(); fl.addPoly([skia.Point(x0, y1), skia.Point(x1, y1), skia.Point(vx + 18, vy + 12), skia.Point(vx - 18, vy + 12)], True)
    c.drawPath(fl, P((214, 210, 202)))                                                          # the floor
    for k in range(5):                                                                            # ceiling lights
        u = 0.25 + k * 0.17; yy = lerp(y0 + 10, vy - 10, u); w_ = (1 - u) * (x1 - x0) * 0.18
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(vx - w_, yy, vx + w_, yy + 8 * (1 - u) + 2), 3, 3), P((255, 255, 250)))
    for side in (-1, 1):
        ex = x0 if side < 0 else x1
        unit = skia.Path(); unit.addPoly([skia.Point(ex, y0 + 10), skia.Point(vx + side * 20, vy - 30), skia.Point(vx + side * 20, vy + 12), skia.Point(ex, y1)], True)
        c.drawPath(unit, P((196, 186, 172)))                                                    # the shelving unit's back panel
        for lv in range(4):                                                                       # four shelves of bottles
            fy = lerp(y0 + 60, y1 - 20, (lv + 1) / 4.3)
            c.drawLine(ex, fy, vx + side * 20, lerp(vy - 30, vy + 12, (lv + 1) / 4.3), SP((150, 120, 96), 5))
            n = 14
            for i in range(n, -1, -1):
                u = 1 - (i / n) ** 0.55                                                           # spacing shrinks toward the far end
                px = lerp(ex, vx + side * 20, u); sc = 1 - u
                if sc < 0.06: continue
                py = lerp(fy, lerp(vy - 30, vy + 12, (lv + 1) / 4.3), u)
                bottle(c, px - side * 18 * sc, py - 30 * sc, 0, 0.46 * sc, level=0.9, t=t + i, wet=0)
    c.drawRect(skia.Rect(vx - 30, vy - 30, vx + 30, vy + 14), P((255, 255, 255), 140, MaskFilter=blur(10)))
    c.restore(); c.restore()
    c.drawPath(pa, SP((255, 255, 255), 4, 150 * a))


# ------------------------------------------------------------------ shots
L_GROUND, S_GROUND = 2025, 1750                                 # the lost man nearer the camera, the stranger behind his stand


def two_shot(c, t, z0, z1, u, tx=540, ty=1200, seller_raise=1.0, lost_arm=0.0, seller_kw=None, lost_kw=None, cy=1200, tx1=None, ty1=None, lost_draw=None):
    c.save(); push(c, u, 540, cy, z0, z1, tx, ty, tx1, ty1)
    world_back(c, t)
    shade_cloth(c, t, 560, 1010, 880, S_GROUND)
    person(c, 'seller', seller_pose(t, seller_raise, **(seller_kw or {})), 790, S_GROUND, 0.74)
    stand(c, t, 560, 1010, 1420, S_GROUND)
    m = c.getTotalMatrix(); y0 = m.mapXY(0, 1000).y(); y1 = m.mapXY(0, 1090).y()
    shimmer(c, y0, y1 + 20, t)
    if lost_draw: lost_draw(c, t)
    else: person(c, 'lost', lost_pose(t, arm_out=lost_arm, **(lost_kw or {})), 290, L_GROUND, 1.0)
    dust(c, t)
    c.restore()


def flare(c, x, y, k, t, r=1.0):
    """sunlight catching glass or a stone: a bloom and a slowly turning star"""
    if k <= 0: return
    c.drawCircle(x, y, 120 * r * k, P((255, 250, 230), 120 * k, MaskFilter=blur(40 * r)))
    c.drawCircle(x, y, 26 * r * k, P((255, 255, 255), 230 * k, MaskFilter=blur(6)))
    for a_ in (0, 90, 45, 135):
        c.save(); c.translate(x, y); c.rotate(a_ + 12 * t); L_ = (150 if a_ % 90 == 0 else 70) * r * k
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-L_, -2.6 * r, L_, 2.6 * r), 2, 2), P((255, 255, 240), 220 * k)); c.restore()


def shot1(c, t):
    r = 0.25 + 0.75 * smooth(t / 1.3)                            # he is already lifting the bottle at frame zero
    two_shot(c, t, OPEN[0], OPEN[1], smooth(t / T2), 540, 900, seller_raise=r, cy=900, seller_kw=dict(glint=1.0),
             lost_kw=dict(yaw=lerp(0.15, 0.5, smooth((t - 0.5) / 0.8)) + 0.06 * math.sin(t * 0.9), look=(lerp(0.3, 0.75, smooth((t - 0.4) / 0.6)), lerp(0.4, -0.2, smooth((t - 0.3) / 1.0))), sq=0.8,
                          head_tilt=lerp(6, -3, smooth((t - 0.2) / 1.2)) + 1.5 * math.sin(t * 1.3), sway=8 + 10 * math.sin(t * 0.7 + 0.4), lean=1.2 * math.sin(t * 0.9),
                          breath=0.5 + 0.5 * math.sin(t * 3.0)))
    hx, hy = PN.HANDS_SELLER
    flare(c, hx + 52 * 0.74 * 1.22 * OPEN[0] * 0.9, hy - 60, 0.8 + 0.2 * math.sin(t * 5), t, 0.9)


def hand_close_bg(c, t, z=1.6, cx=640, cy=1060, br=14):
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    blur_layer(c, br)
    world_back(c, t); shade_cloth(c, t, 560, 1010, 880, S_GROUND)
    person(c, 'seller', seller_pose(t, 1.0, glint=0.5 + 0.5 * math.sin(t * 2)), 790, S_GROUND, 0.74)
    stand(c, t, 560, 1010, 1420, S_GROUND)
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


def ring_hand(c, t, t0, t1, wr0=(330, 1420), sparkle_t=None):
    """the lost man's left hand in the foreground with the ring on the ring finger, the stranger soft behind"""
    u = smooth((t - t0) / (t1 - t0))
    hand_close_bg(c, t, z=1.5 + 0.1 * u, cx=700, cy=1080, br=12)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 30))
    tr = 1.2 * math.sin(t * 11) + 2 * math.sin(t * 3.1)          # a small tremble
    wr = (wr0[0] + tr + 20 * u, wr0[1] - 40 * u); ang = math.radians(-30 + 3 * math.sin(t * 1.3))
    el = (wr[0] - math.cos(ang) * 520, wr[1] - math.sin(ang) * 520)
    sleeve_arm(c, 'lost', el, (wr[0] - math.cos(ang) * 30, wr[1] - math.sin(ang) * 30), 330, 250)
    s = 6.4
    Wf = hand_at(c, 'lost', wr, ang, -1, s, (0.34, 0.36, 0.42, 0.5, 0.58), 0.08)
    sp = 0.4 if sparkle_t is None else 0.4 + 0.6 * smooth((t - sparkle_t) / 0.3) * (1 - smooth((t - sparkle_t - 1.2) / 0.6))
    CH.ring_on_finger(sp, t)(c, Wf, wr, ang, -1, s)
    rs = np.random.default_rng(4)                               # dust in the creases of his knuckles
    for _ in range(10):
        p = Wf(rs.uniform(0, 50), rs.uniform(-20, 20)); c.drawCircle(p[0], p[1], rs.uniform(3, 7), P((186, 150, 110), 60, MaskFilter=blur(3)))
    dust(c, t, 0.8)
    return Wf(58, -6)


def shot2(c, t):
    ring_hand(c, t, T2, T3, sparkle_t=WD.at('diamond', 2))


def face_close(c, t, s=2.5, x=540, ground=None, head_y=900, ps=None, bg_blur=16, bgz=1.6):
    c.save(); c.translate(540, 960); c.scale(bgz, bgz); c.translate(-560, -1080)
    blur_layer(c, bg_blur); world_back(c, t); shade_cloth(c, t, 560, 1010, 880, S_GROUND); stand(c, t, 560, 1010, 1420, S_GROUND); c.restore()
    c.restore()
    gy = head_y + 952 * s * 0.98 if ground is None else ground
    person(c, 'lost', ps, x, gy, s)


def shot3(c, t):
    u = (t - T3) / (T4 - T3)
    look = (lerp(0.2, 0.0, smooth(u / 0.3)), lerp(0.2, 1.0, smooth(u / 0.3))) if u < 0.55 else (lerp(0.0, 0.8, smooth((u - 0.55) / 0.2)), lerp(1.0, -0.2, smooth((u - 0.55) / 0.2)))
    ps = lost_pose(t, yaw=lerp(0.15, 0.3, u), look=look, sq=0.55, worry=0.8)
    ps.head_tilt = lerp(3, -2, smooth((u - 0.5) / 0.4))
    c.save(); z = 1.0 + 0.05 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
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
    tb = WD.at('bottle', 2)
    show = dict(jewel=smooth((t - WD.at('diamond', 3)) / 0.3), bottle=smooth((t - tb) / 0.3), tap=1.0,
                reach=smooth((t - tb + 0.2) / 0.5), grab=smooth((t - tb - 0.3) / 0.15), lift=smooth((t - tb - 0.5) / 0.5))
    a = smooth((t - T4 - 0.05) / 0.35)
    c.save(); z = 1.0 + 0.09 * u; c.translate(540, 800); c.scale(z, z); c.translate(-540, -800)
    memory_home(c, t, a, (40, 540, 1040, 1070), show)
    c.restore()
    look = (0.15, -1.0) if t < WD.at('even') - 0.2 else (0.1, -0.6)
    ps = lost_pose(t, yaw=0.12, look=look, sq=0.6, worry=0.7)
    ps.head_tilt = -4
    c.save(); z = 1.0 + 0.05 * u; c.translate(540, 1500); c.scale(z, z); c.translate(-540, -1500)
    person(c, 'lost', ps, 540, 2950, 1.7)
    c.restore()
    shimmer(c, 1140, 1230, t)
    dust(c, t, 0.7)


def bars_values(t):
    """the water bar: unknown until 'at home', then small, almost nothing at 'so one more bottle', over the top 'out here'"""
    home = smooth((t - WD.at('home', 2)) / 0.4)
    shrink = smooth((t - WD.at('so')) / 1.2)
    out = smooth((t - WD.at('out')) / 0.9)
    water = lerp(0.24, 0.05, shrink); water = lerp(water, 1.18, out)
    return water, lerp(0.86, 0.12, out), home < 0.5


def shot5(c, t):
    u = smooth((t - T5) / (T6A - T5))
    two_shot(c, t, 1.3, 1.42, u, 560, 1150, seller_raise=0.55 + 0.45 * smooth((t - T5) / 1.2),
             seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.0)))


def shot6a(c, t):
    """what you'll pay: close on the ring, the diamond card beside it"""
    rp = ring_hand(c, t, T6A, T6B, wr0=(300, 1480))
    a = smooth((t - T6A - 0.15) / 0.3)
    card(c, 790, 560, 'DIAMOND', 0.86, DBAR, a)
    leader(c, 700, 980, rp[0] + 6, rp[1] - 26, a)


def bottle_close(c, t, t0, t1, glint_t=None):
    u = smooth((t - t0) / (t1 - t0))
    hand_close_bg(c, t, z=2.0, cx=640, cy=1000, br=18)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    ang = math.radians(-4 + 2 * math.sin(t * 1.4)); s = 5.0
    wr = (560 + 30 * u, 1170 - 40 * u)
    el = (wr[0] + 560, wr[1] + 420)
    sleeve_arm(c, 'seller', el, (wr[0] + 30, wr[1] + 18), 260, 190)
    bx, by = wr[0] + s * 52 * math.cos(ang), wr[1] + s * 52 * math.sin(ang) - 34 * s
    g = 0.4 if glint_t is None else 0.4 + 0.6 * smooth((t - glint_t) / 0.3)
    bottle(c, bx, by, math.degrees(ang), s, level=0.86, t=t, glint=g, wet=1.0)
    hand_at(c, 'seller', wr, ang, 1, s, H.GRIP['curls'], 0.05)
    dust(c, t, 0.8)
    return bx, by


def shot6b(c, t):
    """what the NEXT unit adds: close on the bottle, its card beside it (no value yet)"""
    bx, by = bottle_close(c, t, T6B, T6C)
    a = smooth((t - T6B - 0.1) / 0.3)
    water, dia, unk = bars_values(t)
    card(c, 200, 560, 'BOTTLE', water, WBAR, a, unknown=unk)
    leader(c, 300, 980, bx - 40, by - 40, a)


def shot6c(c, t):
    """at home there's always more water: the two shot, both cards above the heads, the memory of a whole aisle of water"""
    u = smooth((t - T6C) / (T6D - T6C))
    two_shot(c, t, 1.3, 1.36, u, 540, 1080, seller_raise=1.0, lost_arm=1.0, seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.1)))
    water, dia, unk = bars_values(t)
    card(c, 150, 530, 'DIAMOND', dia, DBAR, 1.0, w=270, h=330)
    card(c, 930, 530, 'BOTTLE', water, WBAR, 1.0, w=270, h=330, unknown=unk)
    memory_endless(c, t, smooth((t - T6C) / 0.35), (300, 535, 780, 900), 0)


def shot6d(c, t):
    """so one more bottle adds almost nothing: cut in closer on the stranger's bottle, the water bar sinks"""
    u = smooth((t - T6D) / (T7 - T6D))
    two_shot(c, t, 1.75, 1.85, u, 700, 1010, seller_raise=1.0, lost_arm=1.0, seller_kw=dict(glint=0.3), lost_kw=dict(yaw=0.45, look=(0.6, 0.1)))
    water, dia, unk = bars_values(t)
    card(c, 175, 560, 'DIAMOND', dia, DBAR, 1.0)
    card(c, 495, 560, 'BOTTLE', water, WBAR, 1.0)


def shot7(c, t):
    """out here it's the only one: close on the one bottle; the water bar climbs over the diamond bar"""
    bottle_close(c, t, T7, T8, glint_t=WD.at('only') - 0.2)
    water, dia, unk = bars_values(t)
    card(c, 175, 560, 'DIAMOND', dia, DBAR, 1.0)
    card(c, 495, 560, 'BOTTLE', water, WBAR, 1.0)


def shot8(c, t):
    """the trade, close on the hands: the stranger's fingers take the ring; the bottle passes from his grip to the lost man's"""
    t = t - T8 + 34.4                                             # the move was timed with the shot starting at 34.4
    hand_close_bg(c, t, z=1.9, cx=600, cy=1250, br=20)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    s = 3.3
    k_in = smooth((t - 34.4) / 0.3)
    take = smooth((t - 34.82) / 0.14)
    let = smooth((t - 34.96) / 0.14)
    away = smooth((t - 35.08) / 0.4)
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
    b_in = smooth((t - 34.75) / 0.4)
    grab = smooth((t - 35.3) / 0.15)
    s_let = smooth((t - 35.5) / 0.15)
    pull = smooth((t - 35.62) / 0.38)
    bpos = (lerp(1250, 640, b_in) - 380 * pull, lerp(1380, 1300, b_in) - 120 * pull)
    sb_ang = math.radians(184); lb_ang = math.radians(-2)
    def wr_grip(b, ang, dv):
        ax = (math.sin(ang), -math.cos(ang))
        return (b[0] - s * 52 * math.cos(ang) + ax[0] * dv, b[1] - s * 52 * math.sin(ang) + ax[1] * dv)
    sbw = wr_grip(bpos, sb_ang, -40)
    sbw = (sbw[0] + 500 * smooth((t - 35.62) / 0.35), sbw[1] + 120 * smooth((t - 35.62) / 0.35))
    lb_in = smooth((t - 35.05) / 0.3)
    lbw_target = wr_grip(bpos, lb_ang, 70)
    lbw = (lerp(-200, lbw_target[0], lb_in), lerp(1500, lbw_target[1], lb_in)) if grab < 0.01 else lbw_target
    bcurls_l = H.blend(dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), H.GRIP, grab)
    bcurls_s = H.blend(H.GRIP, dict(curls=(0.15, 0.2, 0.24, 0.28, 0.3), spread=0.3), s_let)
    if b_in > 0: sleeve_arm(c, 'seller', (sbw[0] + 600, sbw[1] + 240), (sbw[0] + 20, sbw[1] + 8), 210, 160)
    if lb_in > 0: sleeve_arm(c, 'lost', (lbw[0] - 600, lbw[1] + 300), (lbw[0] - 20, lbw[1] + 10), 190, 150)
    if b_in > 0: bottle(c, bpos[0], bpos[1], 0, s, level=0.86, t=t, glint=0.3, wet=1.0)
    if b_in > 0: hand_at(c, 'seller', sbw, sb_ang, -1, s, bcurls_s['curls'], bcurls_s['spread'])
    if lb_in > 0: hand_at(c, 'lost', lbw, lb_ang, 1, s, bcurls_l['curls'], bcurls_l['spread'])
    sleeve_arm(c, 'lost', (lw[0] - 640 * math.cos(ang_l), lw[1] - 640 * math.sin(ang_l) + 200), (lw[0] - 20 * math.cos(ang_l), lw[1] - 20 * math.sin(ang_l)), 190, 150)
    sleeve_arm(c, 'seller', (sw[0] + 620, sw[1] - 100), (sw[0] + 20, sw[1] - 4), 210, 160)
    hand_at(c, 'lost', lw, ang_l, 1, s, lcurls['curls'], lcurls['spread'])
    if reach > 0: hand_at(c, 'seller', sw, ang_r, -1, s, scurls['curls'], scurls['spread'])
    ring_loose(c, ring_pt[0], ring_pt[1], 9.5 * s, math.degrees(ang_l if let < 0.5 else ang_r) - 90, 0.5, t)
    dust(c, t, 0.6)


def cap_drawing(c, x, y, s, ang, phase):
    """the bottle cap alone: white, ridged; the ridges slide round as it turns"""
    c.save(); c.translate(x, y); c.rotate(ang)
    w, h = 18 * s * 0.46, 64 * s * 0.1
    r = skia.Rect(-w, -h, w, h)
    c.drawRRect(skia.RRect.MakeRectXY(r, 3 * s, 3 * s), P((236, 240, 246))); c.drawRect(skia.Rect(w * 0.2, -h, w, h), P((180, 192, 210)))
    for j in range(7):
        xx = -w + ((j / 7 + phase) % 1.0) * 2 * w
        c.drawLine(xx, -h + 2 * s, xx, h - 2 * s, SP((160, 172, 192), 1.3 * s))
    c.restore()


def shot9(c, t):
    """the cap: his left hand holds the bottle, his right finger and thumb twist the cap twice and lift it off"""
    u = smooth((t - T9) / (T9B - T9))
    hand_close_bg(c, t, z=2.1, cx=560, cy=1150, br=22)
    c.drawRect(skia.Rect(0, 0, W_, H_), P((255, 236, 200), 40))
    s = 4.6
    bc = (560, 1240 - 30 * u)
    capy = bc[1] - 64 * s * 1.08                                  # the cap's centre on the bottle
    k = (t - T9) / (T9B - T9)
    tw = 0.0
    for t0 in (0.08, 0.38):                                       # two twists: the hand turns, comes back
        tw += smooth((k - t0) / 0.22)
    turn = 22 * math.sin(math.pi * min(1.0, ((k - 0.08) % 0.3) / 0.22)) if 0.08 < k < 0.68 else 0.0
    lift = smooth((k - 0.7) / 0.28)
    cap_on = lift < 0.02
    # left hand grips the bottle low, from the left
    lang = math.radians(-2)
    lwr = (bc[0] - s * 52 * math.cos(lang), bc[1] + 30 * s)
    sleeve_arm(c, 'lost', (lwr[0] - 620, lwr[1] + 380), (lwr[0] - 20, lwr[1] + 8), 300, 230)
    bottle(c, bc[0], bc[1], 0, s, level=0.86, t=t, wet=0.8, glint=0.4, cap=cap_on)
    hand_at(c, 'lost', lwr, lang, 1, s, H.GRIP['curls'], 0.05)
    # right hand: pinch on the cap, turning, then lifting away up and to the right
    cp = (bc[0] + 160 * lift, capy - 260 * lift)
    rang = math.radians(196 + turn - 30 * lift)
    def wr_for(p, ang, side, s_, u_=76, v_=21):
        return (p[0] - s_ * (u_ * math.cos(ang) - v_ * side * math.sin(ang)), p[1] - s_ * (u_ * math.sin(ang) + v_ * side * math.cos(ang)))
    rw = wr_for(cp, rang, -1, s * 0.9)
    sleeve_arm(c, 'lost', (rw[0] + 560, rw[1] - 260), (rw[0] + 18 * math.cos(rang + math.pi) * -1, rw[1]), 280, 220)
    if not cap_on: cap_drawing(c, cp[0], cp[1], s, turn * 0.3, tw * 0.5)
    hand_at(c, 'lost', rw, rang, -1, s * 0.9, (0.42, 0.5, 0.82, 0.84, 0.86), 0.1)
    if cap_on:                                                    # the ridges turn under his fingers
        c.save(); c.translate(bc[0], capy)
        for j in range(3):
            xx = -6 * s + ((j / 3 + tw * 0.5) % 1.0) * 12 * s
            c.drawLine(xx, -2 * s, xx, 3 * s, SP((150, 162, 186), 1.4 * s, 200))
        c.restore()
    dust(c, t, 0.6)


def shot9b(c, t):
    """he drinks: his own arm from his elbow, his hand round the bottle, the open neck ON his parted lips, the bottle tipped up, the level dropping"""
    u = (t - T9B) / (T10 - T9B)
    tipu = smooth(u / 0.3)
    lvl = lerp(0.86, 0.45, smooth((u - 0.15) / 0.8))
    ps = lost_pose(t, yaw=0.0, look=(0.0, -0.3), sq=lerp(0.6, 0.04, smooth((u - 0.1) / 0.2)), worry=lerp(0.6, 0.0, u))
    ps.head_tilt = -3 * tipu; ps.drink = 1; ps.scream = 0.32
    ps.r_up = 22; ps.r_fore = 150; ps.hide = ('r',)
    c.save(); z = 1.0 + 0.04 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    s = 2.4
    gy = 820 + 952 * s * 0.98
    rec = skia.PictureRecorder(); dc = rec.beginRecording(skia.Rect(0, 0, 10, 10))
    dc.concat(c.getTotalMatrix()); person(dc, 'lost', ps, 540, gy, s); rec.finishRecordingAsPicture()
    inv = skia.Matrix(); c.getTotalMatrix().invert(inv)
    mq = inv.mapXY(*PN.HANDS['mouth']); mouth = (mq.x(), mq.y())
    ang_b = lerp(122, 146, tipu) + 8 * smooth((u - 0.35) / 0.5)   # bottle axis (open neck end toward his lips): bottom tipped up and out
    a_r = math.radians(ang_b)
    h_ = 64 * s
    bc = (mouth[0] - math.sin(a_r) * h_ * 0.9, mouth[1] + math.cos(a_r) * h_ * 0.9)
    hang = math.radians(ang_b - 180)
    wr = (bc[0] - s * 52 * math.cos(hang) - math.sin(a_r) * 20, bc[1] - s * 52 * math.sin(hang) + math.cos(a_r) * 20)
    q_ = c.getTotalMatrix().mapXY(*wr)
    el = PN.HANDS['r']['el']
    dx, dy = q_.x() - el[0], q_.y() - el[1]; a2 = math.degrees(math.atan2(dx, dy)); ps.r_fore = -a2 - ps.r_up
    face_close(c, t, s=s, head_y=820, ps=ps)
    e_ = inv.mapXY(*PN.HANDS['r']['el']); el = (e_.x(), e_.y())
    sleeve_arm(c, 'lost', el, (wr[0] - 18 * math.cos(hang), wr[1] - 18 * math.sin(hang)), 64 * s * 0.9, 56 * s * 0.9)
    bottle(c, bc[0], bc[1], ang_b, s, level=lvl, t=t, wet=0.7, cap=False)
    hand_at(c, 'lost', wr, hang, 1, s, H.GRIP['curls'], 0.05)
    c.restore()


def lost_bottle_chest(c, t, lvl=0.45, smile=0.6):
    """the lost man holds the half empty bottle against his chest with both hands: his own upper arms, forearms drawn from his elbows to the bottle"""
    ps = lost_pose(t, yaw=0.3, look=(0.7, -0.45), sq=1.0, worry=0.0, smile=smile, head_tilt=-3)
    ps.r_up = 9; ps.l_up = 9; ps.hide = ('r', 'l'); ps.l_over = None
    s = 1.0; hs_ = 1.22 * s
    bc = (300, L_GROUND - 760 * s)                                       # chest height, a little toward the stranger
    lw = (bc[0] - 52 * hs_, bc[1] + 26)                                  # his right hand (screen left), lower on the bottle
    rw = (bc[0] + 52 * hs_, bc[1] - 10)                                  # his left hand (screen right), higher
    M = c.getTotalMatrix()
    rec = skia.PictureRecorder(); dc = rec.beginRecording(skia.Rect(0, 0, 10, 10)); dc.concat(M)
    person(dc, 'lost', ps, 290, L_GROUND, s); rec.finishRecordingAsPicture()
    for nm, w_, side in (('r', lw, -1), ('l', rw, 1)):                    # each forearm points from its elbow at its hand
        q = M.mapXY(*w_); el = PN.HANDS[nm]['el']; dx, dy = q.x() - el[0], q.y() - el[1]; a2 = math.degrees(math.atan2(dx, dy))
        if side < 0: ps.r_fore = -a2 - ps.r_up
        else: ps.l_fore = a2 - ps.l_up
    person(c, 'lost', ps, 290, L_GROUND, s)
    inv = skia.Matrix(); M.invert(inv)
    els = {nm: inv.mapXY(*PN.HANDS[nm]['el']) for nm in ('r', 'l')}
    for nm, w_, ang in (('r', lw, 0.0), ('l', rw, math.pi)):
        e = (els[nm].x(), els[nm].y())
        sleeve_arm(c, 'lost', e, (w_[0] - 14 * math.cos(ang), w_[1] - 14 * math.sin(ang)), 60, 52)
    bottle(c, bc[0], bc[1], 0, hs_, level=lvl, t=t, wet=0.6, cap=False)
    hand_at(c, 'lost', lw, 0.0, 1, hs_, H.GRIP['curls'], 0.05)
    hand_at(c, 'lost', rw, math.pi, -1, hs_, H.GRIP['curls'], 0.05)


def shot10(c, t):
    """payoff: the stranger holds the ring up to the sun (a small real glint on the stone), the lost man holds the half empty bottle to his chest
    with both hands, relieved; the camera eases back to the opening framing so the end loops into frame zero"""
    u = smooth((t - T10) / (DUR - T10))
    up = smooth((t - T10 - 0.05) / 0.7)
    fl = smooth((t - (T10 + 0.75)) / 0.2) * (0.85 + 0.15 * math.sin(t * 7))
    RING_PT[0] = None
    two_shot(c, t, 1.5, OPEN[0], u, 560, 1040, seller_raise=0.3 + 0.7 * up, cy=900, tx1=540, ty1=900,
             seller_kw=dict(ring=True, glint=0.3), lost_draw=lambda c_, t_: lost_bottle_chest(c_, t_))
    if RING_PT[0] is not None:
        flare(c, RING_PT[0][0], RING_PT[0][1], fl, t, 0.42)


def scene(c, t):
    for t0, f in ((T10, shot10), (T9B, shot9b), (T9, shot9), (T8, shot8), (T7, shot7), (T6D, shot6d), (T6C, shot6c), (T6B, shot6b), (T6A, shot6a),
                  (T5, shot5), (T4, shot4), (T3, shot3), (T2, shot2)):
        if t >= t0: return f(c, t)
    shot1(c, t)


_orig_person = CH.person


def _person_rec(c, who, ps, x, ground, s):
    _orig_person(c, who, ps, x, ground, s)
    if who == 'seller': PN.HANDS_SELLER = PN.HANDS['r']['w']
    else: PN.HANDS_LOST = PN.HANDS['l']['w']


person = _person_rec
PN.HANDS_SELLER = (700, 1000); PN.HANDS_LOST = (500, 1300)


def _title_cut(c, lines, t, a, size=92):
    """titles change on a hard cut: no fade, no scale pop"""
    widest = max(kit.L.line_width(ln, size) for ln in lines)
    if widest > 960: size = size * 960 / widest
    n = len(lines); y0 = 300 - (n - 1) * size * 0.52 + size * 0.36
    for i, ln in enumerate(lines): kit.L.rich_line(c, ln, 540, y0 + i * size * 1.04, size, 1.0)


kit._title_hard = _title_cut

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
    (WD.at('what'), [[('WHAT YOU PAY FOLLOWS', Wt)], [('THE ', Wt), ('NEXT ONE', Y)]]),
    (WD.at('at'), [[('AT HOME', Wt)], [('ALWAYS MORE ', Wt), ('WATER', BL)]]),
    (WD.at('so'), [[('ONE MORE BOTTLE', BL)], [('ADDS ', Wt), ('ALMOST NOTHING', R)]]),
    (WD.at('out'), [[('OUT HERE', Y)], [("IT'S THE ", Wt), ('ONLY ONE', BL)]]),
    (WD.at('he'), [[('HE TAKES', Wt)], [('THE TRADE', Y)]]),
    (WD.at('right'), [[('THE ', Wt), ('CHEAPEST', BL), (' THING', Wt)], [('IN THE WORLD', Wt)]]),
    (WD.at('is', 1), [[('WORTH MORE THAN', Wt)], [('A ', Wt), ('DIAMOND', ICEY)]]),
]

SHORT = Short(WD, 'AP MICROECONOMICS', TITLES, scene, DUR, T_FIN, lift=lambda t: 1.0, fix={'MARGINAL.': 'marginal.', 'NEXT': 'next'})
URL_AT = T_FIN + 0.25
kit.lpk.end_line = lambda *a, **k: None
FIN_TITLE = [[('WATER', BL), (' BEATS', Wt)], [('A ', Wt), ('DIAMOND', ICEY)]]
URL_XY = (540, 650)
_frame = SHORT.frame


def _frame_url(t):
    """the URL for the last stretch, on clean ground (not on the sign or a face)"""
    s = _frame(t)
    if t >= T_FIN: _title_cut(s.getCanvas(), FIN_TITLE, t, T_FIN)
    a = smooth((t - URL_AT) / 0.3)
    if a > 0:
        c = s.getCanvas(); f = skia.Font(kit.L.BLACK, 54); w = f.measureText('levlprep.com'); x, y = URL_XY
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 30, y - 56, x + w / 2 + 30, y + 22), 24, 24), P((5, 12, 26), 200 * a))
        c.drawString('levlprep.com', x - w / 2, y, f, P(kit.L.TEAL, 255 * a))
    return s


SHORT.frame = _frame_url

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1118/diamond/out/stills')
