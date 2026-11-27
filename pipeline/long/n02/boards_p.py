"""The practice moments (Olivier, 2026-11-24: "your turn" presented better; he approved these screens from stills):
1 a full "Your turn" card while the narrator says it, 2 the problem in one panel with numbered tasks and nothing else,
3 a large countdown beside the tasks ("Pause the video and try it"; drawn by render.py over the question board),
4 the answer under the same numbers, each step written on as it is said.
yt-nremt-02 has three practice problems: who can start an IV, what comes first at a crash, off line or on line."""
import math
from contextlib import contextmanager
import numpy as np
import skia
import kit as K
from kit import P, SP, sm, W, H, text, AMBER, CORAL, TEAL, GREEN, CREAM, INK2, NAVY
from base import Bt, cue, ua, board, ww, cues, tx, hw, panel, lightbar

NP = 3
TOPIC = {1: 'who can start an IV', 2: 'what comes first', 3: 'off line or on line'}
TX, TY = 1610, 775          # the countdown's place on every question board
NX = 180                    # the numbers' column, the same on the question and the answer
WHITE = (236, 238, 244)


def wx(k, w, nth=0, after=None):
    """time of the nth spoken word in beat k that IS w (exact, case blind), unlike base.ww which matches word starts"""
    n = 0
    for word, a, b in Bt[k]['words']:
        if after is not None and a < after: continue
        if word.lower().strip('.,?!:;"\'') == w.lower():
            if n == nth: return a
            n += 1
    print('WORD MISSING', k, w, nth); return after if after is not None else Bt[k]['t0']


def hwid(s, size):
    return K.font('hand', size).measureText(s)


@contextmanager
def lay(c, a=1.0, x=0.0, y=0.0, s=1.0):
    """draw a picture at (x, y), scaled, faded as one piece"""
    c.save()
    if a < 0.99: c.saveLayerAlpha(None, int(255 * max(0.0, a)))
    c.translate(x, y); c.scale(s, s)
    yield
    if a < 0.99: c.restore()
    c.restore()


def rr(x0, y0, x1, y1, r):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def poly(pts, round_=0.0):
    p = skia.Path(); p.addPoly([skia.Point(*q) for q in pts], True); return p


def soft(col, a, r):
    return P(col, a, MaskFilter=K.blur(r))


# ------------------------------------------------------------------ the four step frame
def head(c, t, t0, n, answer=False):
    a = ua(t, t0, 0.3)
    if a <= 0.01: return
    s = 'ANSWER' if answer else 'YOUR TURN'; w = K.width(s, 44, 'xb') + 80
    c.drawRRect(rr(90, 60, 90 + w, 136, 38), P(GREEN if answer else AMBER, 255 * a)); text(c, s, 90 + w / 2, 114, 44, NAVY, a, 'xb', 'center')
    text(c, f'practice {n} of {NP}', 90 + w + 30, 116, 50, INK2, a, 'semi')


def yt_card(c, t, t0, t1, n):
    """the full card, on screen while he says 'your turn'"""
    a = ua(t, t0 - 0.1, 0.3) * (1 - ua(t, t1 - 0.3, 0.3))
    if a <= 0.01: return False
    u = ua(t, t0, 0.5)
    c.saveLayerAlpha(None, int(255 * a))
    c.drawCircle(960, 400, 120 * (0.85 + 0.15 * u), P(AMBER))
    c.drawRRect(rr(915, 345, 945, 455, 8), P(NAVY)); c.drawRRect(rr(975, 345, 1005, 455, 8), P(NAVY))
    text(c, 'Your turn', 960, 660, 130, CREAM, 1.0, 'xb', 'center')
    c.drawRect(skia.Rect(960 - 60 * u, 700, 960 + 60 * u, 708), P(AMBER))
    text(c, f'practice {n} of {NP}: {TOPIC[n]}', 960, 790, 48, INK2, ua(t, t0 + 0.3, 0.4), 'semi', 'center')
    c.restore()
    return t < t1 - 0.3


def num(c, n, x, y, a):
    if a > 0.01: c.drawCircle(x, y - 20, 42, P(AMBER, 255 * a)); text(c, str(n), x, y, 52, NAVY, a, 'xb', 'center')


def tasks(c, t, items, y0=720, dy=130, size=58):
    for i, (s, tt) in enumerate(items):
        a = ua(t, tt, 0.35); num(c, i + 1, NX, y0 + i * dy, a); tx(c, s, NX + 80, y0 + i * dy, size, CREAM, t, tt, 'xb')


_PW = K.width('Pause the video and try it', 46, 'xb')


def countdown(c, left, total, a=1.0):
    """render.py draws this over the question board during the pause"""
    if a <= 0.01: return
    c.drawCircle(TX, TY, 170, P((14, 18, 44), 255 * a)); c.drawCircle(TX, TY, 140, SP((70, 76, 120), 22, 255 * a))
    c.drawArc(skia.Rect(TX - 140, TY - 140, TX + 140, TY + 140), -90, 360 * max(0.0, left) / total, False, SP(AMBER, 22, 255 * a))
    text(c, str(max(1, math.ceil(left))), TX, TY + 52, 150, CREAM, a, 'xb', 'center')
    text(c, 'Pause the video and try it', min(TX, W - 92 - _PW / 2), TY + 232, 46, AMBER, a, 'xb', 'center')


def loop(c, cx, cy, rx, ry, u, a=1.0, col=AMBER, w=6):
    if u <= 0.01 or a <= 0.01: return
    c.drawArc(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry), -100, 360 * sm(u), False, SP(col, w, 255 * a))


def trap(c, s, t, t0, y, size=48, x=None):
    """the coral trap pill; x = its left edge (centred on the frame when None)"""
    w = K.width(s, size, 'xb') + 68
    K.pill(c, s, 960 if x is None else x + w / 2, y, CORAL, size, ua(t, t0, 0.4), kind='xb', pad=34)


# ------------------------------------------------------------------ pictures (house flat style, drawn in code)
def _tube():
    p = skia.Path(); p.moveTo(14, 318); p.cubicTo(14, 386, 160, 394, 232, 320); p.cubicTo(262, 288, 292, 258, 324, 234); return p


def ivset(c, x, y, s, a=1.0, u=1.0, t=0.0, drip=1.0, line=True):
    """an IV bag on its hook with the drip chamber and the line down to a catheter; (x, y) = top centre of the hook"""
    if a <= 0.01: return
    FL, FL2, BAG = (120, 190, 232), (150, 208, 240), (222, 236, 246)
    with lay(c, a, x, y, s):
        c.drawRRect(rr(-63, 40, 87, 250, 28), soft((4, 6, 20), 120, 9))                       # soft shadow
        c.drawArc(skia.Rect(-13, 0, 13, 26), 150, 250, False, SP((150, 160, 200), 7))          # the hook
        c.drawRRect(rr(-24, 14, 24, 50, 8), P(BAG))                                             # hang tab
        c.drawCircle(0, 28, 7, P((14, 18, 44)))
        body = rr(-75, 34, 75, 240, 28)
        c.drawRRect(body, P(BAG))
        c.save(); c.clipRRect(body, True)
        c.drawRect(skia.Rect(-75, 96, 75, 240), P(FL2)); c.drawRect(skia.Rect(-75, 180, 75, 240), P(FL))
        c.drawRect(skia.Rect(-66, 34, -52, 240), P((255, 255, 255), 90))                        # highlight
        c.restore()
        c.drawRRect(rr(-40, 112, 44, 176, 8), P((250, 250, 252)))                               # the label
        c.drawRRect(rr(-30, 122, 34, 134, 4), P(K.COURSE)); c.drawRRect(rr(-30, 144, 24, 151, 3), P((170, 176, 200))); c.drawRRect(rr(-30, 159, 8, 166, 3), P((170, 176, 200)))
        for i in range(4): c.drawRRect(rr(54, 104 + i * 30, 68, 109 + i * 30, 2), P((90, 130, 180), 200))
        c.drawRRect(rr(-38, 238, -20, 262, 4), P((96, 150, 220)))                               # the injection port
        c.drawRRect(rr(6, 238, 22, 268, 4), P((196, 208, 226)))                                 # the spike
        ch = rr(-2, 262, 30, 320, 9)
        c.drawRRect(ch, P((206, 226, 242)))
        c.save(); c.clipRRect(ch, True); c.drawRect(skia.Rect(-2, 298, 30, 320), P(FL)); c.restore()
        if drip > 0.01:
            ph = (t * 1.1) % 1.0
            c.drawOval(skia.Rect(10, 270 + 24 * ph, 18, 281 + 24 * ph), P(FL, 255 * drip * (1 - ph * 0.3)))
        if line and u > 0.01:
            tp = _tube(); meas = skia.PathMeasure(tp, False); L = meas.getLength(); seg = skia.Path(); meas.getSegment(0, L * sm(u), seg, True)
            c.drawPath(seg, SP((176, 214, 240), 8))
            if u > 0.5:                                                                          # roller clamp
                pos, tan = meas.getPosTan(L * 0.33); k = ua(u, 0.5, 0.2)
                c.save(); c.translate(pos.x(), pos.y()); c.rotate(math.degrees(math.atan2(tan.y(), tan.x())))
                c.drawRRect(rr(-22, -15, 22, 15, 6), P(WHITE, 255 * k)); c.drawCircle(4, 0, 9, P((96, 150, 220), 255 * k)); c.restore()
            if u > 0.9:                                                                          # the catheter hub and its tip
                pos, tan = meas.getPosTan(L); k = ua(u, 0.9, 0.1)
                c.save(); c.translate(pos.x(), pos.y()); c.rotate(math.degrees(math.atan2(tan.y(), tan.x())))
                c.drawRRect(rr(30, -3, 78, 3, 3), P((206, 214, 232), 255 * k))
                c.drawPath(poly([(-6, -12), (22, -12), (34, -6), (34, 6), (22, 12), (-6, 12)]), P((238, 120, 150), 255 * k))
                c.drawRect(skia.Rect(-6, -12, 4, 12), P((206, 92, 124), 255 * k))
                c.restore()


def ambulance(c, x, y, s, a=1.0):
    """a US box ambulance, side view; (x, y) = left end of the ground line"""
    if a <= 0.01: return
    with lay(c, a, x, y, s):
        c.drawOval(skia.Rect(0, -10, 262, 12), soft((4, 6, 20), 150, 7))
        c.drawRRect(rr(0, -148, 166, -24, 10), P(WHITE))                                         # the box
        c.drawPath(poly([(160, -112), (206, -112), (236, -76), (254, -70), (258, -62), (258, -24), (160, -24)]), P(WHITE))   # the cab
        c.drawPath(poly([(172, -104), (203, -104), (226, -76), (172, -76)]), P((112, 156, 220)))
        c.drawRect(skia.Rect(0, -66, 258, -50), P(CORAL))                                         # the stripe
        c.drawRect(skia.Rect(0, -36, 258, -24), P((196, 200, 216)))
        c.drawRRect(rr(18, -134, 62, -100, 5), P((112, 156, 220)))                               # box window
        c.save(); c.translate(112, -104)
        for d in (0, 60, 120):
            c.save(); c.rotate(d); c.drawRRect(rr(-7, -27, 7, 27, 3), P((64, 104, 208))); c.restore()
        c.restore()
        c.drawRRect(rr(120, -160, 164, -148, 4), P(CORAL)); c.drawRRect(rr(4, -156, 26, -148, 3), P(CORAL))   # light bar
        c.drawRRect(rr(250, -54, 260, -42, 3), P(AMBER))
        for wx_ in (50, 210):
            c.drawCircle(wx_, -24, 27, P((14, 18, 44))); c.drawCircle(wx_, -24, 23, P((40, 44, 72))); c.drawCircle(wx_, -24, 10, P((186, 192, 214)))


def page(c, x, y, s, a=1.0, usig=1.0):
    """a written protocol page with the physician's signature at the bottom; (x, y) = top left"""
    if a <= 0.01: return
    with lay(c, a, x, y, s):
        c.drawRect(skia.Rect(8, 12, 208, 272), soft((4, 6, 20), 140, 9))
        c.drawPath(poly([(0, 0), (164, 0), (200, 36), (200, 262), (0, 262)]), P(CREAM))
        c.drawPath(poly([(164, 0), (164, 36), (200, 36)]), P((202, 196, 184)))
        c.drawRRect(rr(20, 24, 140, 46, 5), P(K.COURSE))                                          # the heading
        for i, w_ in enumerate((150, 128, 142)): c.drawRRect(rr(20, 68 + i * 22, 20 + w_, 77 + i * 22, 4), P((172, 176, 198)))
        for i, w_ in enumerate((96, 110)):                                                         # two checked steps
            yy = 142 + i * 28
            c.drawRRect(rr(20, yy, 40, yy + 20, 4), P(K.COURSE))
            p = skia.Path(); p.moveTo(24, yy + 10); p.lineTo(29, yy + 15); p.lineTo(36, yy + 5); c.drawPath(p, SP(CREAM, 3.5))
            c.drawRRect(rr(52, yy + 6, 52 + w_, yy + 15, 4), P((172, 176, 198)))
        c.drawRect(skia.Rect(20, 238, 150, 241), P((120, 124, 150)))                               # the signature line
        if usig > 0.01:
            p = skia.Path(); p.moveTo(26, 228); p.cubicTo(34, 196, 46, 200, 44, 224); p.cubicTo(42, 240, 56, 204, 66, 212)
            p.cubicTo(74, 220, 70, 232, 80, 222); p.cubicTo(92, 208, 96, 232, 108, 220); p.lineTo(140, 214)
            meas = skia.PathMeasure(p, False); seg = skia.Path(); meas.getSegment(0, meas.getLength() * sm(usig), seg, True)
            c.drawPath(seg, SP((44, 58, 140), 4.5))


def radio(c, x, y, s, a=1.0, wave=0.0, t=0.0):
    """a portable two way radio; (x, y) = top left of its box (the antenna tip is the top)"""
    if a <= 0.01: return
    BODY, BODY2, DARK = (112, 124, 176), (84, 96, 148), (30, 36, 70)
    with lay(c, a, x, y, s):
        c.drawRRect(rr(16, 92, 114, 268, 16), soft((4, 6, 20), 150, 9))
        c.drawRRect(rr(22, 0, 38, 90, 8), P((70, 80, 130))); c.drawRRect(rr(20, 62, 40, 90, 5), P(BODY2))        # antenna
        c.drawRRect(rr(70, 60, 92, 90, 6), P(BODY2))                                                 # the knob
        body = rr(8, 80, 104, 258, 16)
        c.drawRRect(rr(0, 120, 14, 176, 5), P(AMBER))                                                         # the talk button
        c.drawRRect(body, P(BODY))
        c.save(); c.clipRRect(body, True); c.drawRect(skia.Rect(8, 222, 104, 258), P(BODY2)); c.drawRect(skia.Rect(14, 80, 24, 258), P((255, 255, 255), 46)); c.restore()
        c.drawRRect(rr(26, 98, 88, 132, 6), P(DARK)); c.drawRRect(rr(30, 102, 84, 128, 4), P(K.COURSE))       # the display
        c.drawRRect(rr(36, 109, 66, 114, 2), P(DARK, 170)); c.drawRRect(rr(36, 118, 56, 123, 2), P(DARK, 170))
        for i in range(4): c.drawRRect(rr(30, 150 + i * 16, 82, 158 + i * 16, 4), P(DARK))                     # the speaker
        c.drawCircle(84, 240, 6, P(CORAL))
        if wave > 0.01:
            for i in range(3):
                ph = 0.72 + 0.28 * math.sin(t * 5 - i * 0.9)
                r_ = 30 + i * 22
                c.drawArc(skia.Rect(30 - r_, 6 - r_, 30 + r_, 6 + r_), -62, 74, False, SP(AMBER, 7, 255 * wave * ph))


def stairs(c, x, y, a=1.0, lit=(0, 0, 0, 0), cols=(K.COURSE, K.COURSE, AMBER, AMBER), names=('', '', '', ''), w=140, r=84):
    """the four levels as four steps, (x, y) = the bottom left; lit[i] 0..1 lights step i, names[i] is written on it"""
    if a <= 0.01: return
    with lay(c, a, x, y):
        c.drawRect(skia.Rect(10, 6, 4 * w + 10, 22), soft((4, 6, 20), 140, 8))
        for i in range(4):
            top = -(i + 1) * r; u = lit[i]
            base = tuple(58 + (cols[i][j] - 58) * 0 for j in range(3)); base = (56, 66, 122)
            col = tuple(base[j] + (cols[i][j] - base[j]) * u for j in range(3))
            c.drawRect(skia.Rect(i * w, top, (i + 1) * w, 0), P(col))
            c.drawRect(skia.Rect(i * w, top, (i + 1) * w, top + 12), P(tuple(min(255, v + 44) for v in col)))
            if names[i] and u > 0.01: text(c, names[i], i * w + w / 2, top + 66, 40, NAVY, u, 'xb', 'center')


def _car(c, body, low, win, lamp=1.0, tail=1.0, hood=False, driver=False):
    """a sedan, side view, nose to the right; the ground line is y = 0, the car is 250 long"""
    shell = poly([(4, -22), (6, -50), (58, -58), (92, -92), (168, -92), (206, -58), (244, -50), (248, -22)])
    c.drawPath(shell, skia.Paint(AntiAlias=True, Color=K.C(body), PathEffect=skia.CornerPathEffect.Make(9)))
    c.save(); c.clipPath(shell, True); c.drawRect(skia.Rect(0, -36, 250, -10), P(low)); c.restore()
    if hood: c.drawPath(poly([(202, -58), (228, -74), (245, -50)]), P(low))
    wf = poly([(134, -84), (164, -84), (192, -60), (134, -60)])
    c.drawPath(poly([(98, -84), (128, -84), (128, -60), (74, -60)]), P(win)); c.drawPath(wf, P(win))
    if driver:
        c.save(); c.clipPath(wf, True)
        c.drawRRect(rr(140, -66, 172, -40, 10), P((60, 86, 150)))                      # the shoulders, bent forward
        c.drawCircle(171, -67, 10, P((226, 176, 138))); c.drawArc(skia.Rect(159, -79, 181, -57), 150, 170, True, P((70, 50, 44)))
        c.restore()
    for wx_ in (52, 198):
        c.drawCircle(wx_, -20, 21, P((12, 14, 30))); c.drawCircle(wx_, -20, 9, P((150, 156, 184)))
    if lamp > 0.01: c.drawRRect(rr(238, -50, 249, -39, 3), P((255, 236, 170), 255 * lamp))
    if tail > 0.01: c.drawRRect(rr(3, -52, 11, -38, 3), P((255, 90, 80), 255 * tail))


_BG = {}


def _road(s):
    """the still part of the night highway, rendered once per size"""
    if s in _BG: return _BG[s]
    sf = skia.Surface(int(640 * s), int(340 * s)); c = sf.getCanvas(); c.scale(s, s)
    c.drawRect(skia.Rect(0, 0, 640, 340), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 180)], [K.C((8, 11, 34)), K.C((30, 40, 92))])))
    rs = np.random.default_rng(4)
    for i in range(16): c.drawCircle(rs.uniform(10, 630), rs.uniform(8, 98), rs.uniform(1.3, 2.4), P(CREAM, rs.uniform(110, 210)))
    c.drawCircle(566, 50, 22, P(CREAM)); c.drawCircle(576, 44, 20, P((11, 15, 44)))
    c.drawPath(poly([(0, 160), (0, 122), (70, 106), (150, 126), (240, 100), (330, 124), (420, 108), (520, 130), (600, 112), (640, 120), (640, 160)]), P((13, 17, 42)))
    for xx in range(20, 640, 86): c.drawRect(skia.Rect(xx, 134, xx + 7, 160), P((64, 72, 112)))
    c.drawRect(skia.Rect(0, 138, 640, 148), P((92, 102, 148)))                                  # the guard rail
    c.drawRect(skia.Rect(0, 158, 640, 278), P((38, 42, 68)))                                    # the road
    c.drawRect(skia.Rect(0, 162, 640, 165), P(CREAM, 130)); c.drawRect(skia.Rect(0, 270, 640, 274), P(CREAM, 190))
    for xx in range(-10, 640, 74): c.drawRRect(rr(xx, 213, xx + 40, 218, 2), P(AMBER, 220))
    c.drawRect(skia.Rect(0, 278, 640, 340), P((60, 62, 88)))                                    # the shoulder
    for i in range(50): c.drawCircle(rs.uniform(0, 640), rs.uniform(282, 338), rs.uniform(1.2, 2.2), P((84, 86, 112)))
    _BG[s] = sf.makeImageSnapshot(); return _BG[s]


def _passing(c, x, y, s, d, a):
    """a passing car at night: a dark shape behind its headlights; d = +1 drives right, -1 drives left"""
    c.save(); c.translate(x, y); c.scale(s * d, s)
    c.drawPath(poly([(246, -46), (500, -74), (500, 0), (246, -36)]), P((255, 232, 160), 44 * a))
    c.drawPath(poly([(246, -45), (420, -58), (420, -8), (246, -38)]), P((255, 232, 160), 50 * a))
    if a < 0.99: c.saveLayerAlpha(None, int(255 * a))
    _car(c, (26, 32, 66), (18, 22, 48), (58, 72, 124))
    c.drawRRect(rr(96, -92, 166, -87, 2), P((84, 96, 150)))
    if a < 0.99: c.restore()
    c.drawCircle(246, -44, 18, P((255, 236, 170), 150 * a, MaskFilter=K.blur(9), BlendMode=skia.BlendMode.kScreen))
    c.restore()


def highway(c, x, y, s, t, a=1.0, ucar=1.0, udrv=0.0, ufuel=1.0, utraf=1.0, rfuel=0.0, rtraf=0.0):
    """a night highway: a crashed car on the shoulder, fuel leaking under it, traffic still passing; (x, y) = top left,
    the picture is 640 x 340 at s = 1. udrv rings the driver, rfuel rings the puddle, rtraf frames the live lanes."""
    if a <= 0.01: return
    c.save()
    if a < 0.99: c.saveLayerAlpha(None, int(255 * a))
    c.drawRRect(rr(x + 6, y + 10, x + 640 * s + 6, y + 340 * s + 10, 22 * s), soft((4, 6, 20), 150, 10))
    c.clipRRect(rr(x, y, x + 640 * s, y + 340 * s, 22 * s), True)
    c.drawImage(_road(s), x, y)
    c.translate(x, y); c.scale(s, s)
    if utraf > 0.01:
        _passing(c, 760 - ((t * 230 + 300) % 1150), 208, 0.55, -1, utraf)
        _passing(c, -330 + ((t * 270 + 150) % 1150), 262, 0.72, 1, utraf)
    if rtraf > 0.01: c.drawRRect(rr(8, 166, 632, 268, 14), SP(AMBER, 5, 255 * sm(rtraf)))
    if ucar > 0.01:
        if ufuel > 0.01:                                                                        # the fuel, pooling behind the rear wheel
            k = sm(ufuel)
            c.drawOval(skia.Rect(212 - 104 * k, 313 - 3 * k, 212 + 104 * k, 319 + 9 * k), P((176, 126, 40), 255 * ucar))
            c.drawOval(skia.Rect(194 - 56 * k, 316 - 1 * k, 194 + 56 * k, 318 + 4 * k), P((240, 196, 96), 255 * ucar))
            for i in range(2):
                ph = (t * 1.3 + i * 0.5) % 1.0
                c.drawOval(skia.Rect(236 + i * 26, 290 + 22 * ph, 244 + i * 26, 302 + 22 * ph), P((240, 196, 96), 255 * ucar * k * (1 - ph * 0.5)))
        c.save(); c.translate(150, 318); c.rotate(-2.5); c.scale(1.25, 1.25)
        if ucar < 0.99: c.saveLayerAlpha(None, int(255 * ucar))
        _car(c, (228, 230, 240), (176, 184, 210), (70, 92, 150), lamp=0.0, tail=0.45 + 0.55 * (math.sin(t * 6) > 0), hood=True, driver=True)
        if ucar < 0.99: c.restore()
        loop(c, 168, -68, 32, 28, udrv, 1.0, AMBER, 4.5)
        c.restore()
    loop(c, 212, 319, 122, 17, rfuel, 1.0, AMBER, 5)
    if a < 0.99: c.restore()
    c.restore()


def bullet(c, s, y, t, t0, x=150, size=48):
    a = ua(t, t0, 0.35)
    if a > 0.01: c.drawCircle(x + 10, y - size * 0.33, 9, P(AMBER, 255 * a)); tx(c, s, x + 40, y, size, CREAM, t, t0, 'semi')


# ------------------------------------------------------------------ practice 1: who can start an IV
def p1q(c, t):
    k = 'p1q'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    if yt_card(c, t, t0, c1, 1): return
    head(c, t, c1 - 0.2, 1)
    panel(c, 90, 190, 1830, 600, ua(t, c1 - 0.2, 0.4))
    tx(c, 'A patient needs an IV started', 150, 330, 64, CREAM, t, c1, 'semi')
    tx(c, 'so she can get fluids.', 150, 420, 64, CREAM, t, ww(k, 'so', 0, c1) - 0.1, 'semi')
    tiv = wx(k, 'i', 0, c1) - 0.2
    ivset(c, 1330, 212, 0.95, ua(t, c1, 0.4), ua(t, tiv, 1.4), t, ua(t, ww(k, 'fluids') - 0.2, 0.4))
    tasks(c, t, (('Lowest level that can start it?', c2), ('Usual minimum for an ambulance?', ww(k, 'And', 0, c2) - 0.2)))


def p1a(c, t):
    k = 'p1a'; t0, c1, c2 = cues(k, 2)
    board(c, t); head(c, t, t0, 1, True)
    y1, y2 = 370, 620
    # 1: the IV belongs to the AEMT
    num(c, 1, NX, y1, ua(t, t0 + 0.1, 0.3))
    ivset(c, 330, y1 - 118, 0.48, ua(t, t0 + 0.1, 0.4), ua(t, t0 + 0.3, 0.8), t)
    ta = ww(k, 'advanced') - 0.2
    K.arrow(c, (560, y1 - 30), (660, y1 - 30), AMBER, 8, ua(t, ta - 0.3, 0.4))
    hw(c, 'AEMT', 700, y1, 120, AMBER, t, ta, 0.9)
    # 2: the minimum on the ambulance is the EMT
    te = wx(k, 'e', 0, c1) - 0.15
    num(c, 2, NX, y2, ua(t, c1 - 0.1, 0.3))
    lightbar(c, t, y2 - 10, ww(k, 'An', 0, c2 + 4), ww(k, 'but', 0, c2 + 4), 100, 1010, 190)
    ambulance(c, 270, y2 + 36, 0.9, ua(t, ww(k, 'ambulance') - 0.3, 0.4))
    K.arrow(c, (560, y2 - 30), (660, y2 - 30), AMBER, 8, ua(t, te - 0.3, 0.4))
    hw(c, 'EMT', 700, y2, 120, CREAM, t, te, 0.8)
    # the staircase: lines into a vein start at the third step; the EMT is the second
    t3 = ww(k, 'third') - 0.15
    stairs(c, 1200, 680, ua(t, ww(k, 'lines') - 0.2, 0.5), (0, ua(t, te, 0.4), ua(t, t3, 0.4), 0), names=('', 'EMT', 'AEMT', ''))
    th = ww(k, 'that', 0, c2 + 8)
    K.arrow(c, (1410, 470), (1540, 380), AMBER, 8, ua(t, ww(k, 'one', 0, th) - 0.2, 0.5), bend=-0.35)
    trap(c, 'trap: not everyone on an ambulance starts IVs', t, ww(k, 'trap') - 0.1, 830)
    tx(c, 'that skill sits one step higher', 960, 975, 54, TEAL, t, th - 0.1, 'xb', 'center')


# ------------------------------------------------------------------ practice 2: what comes first at a crash
def p2q(c, t):
    k = 'p2q'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    if yt_card(c, t, t0, c1, 2): return
    head(c, t, c1 - 0.2, 2)
    panel(c, 90, 190, 1830, 600, ua(t, c1 - 0.2, 0.4))
    tx(c, 'A car crash on a dark highway.', 150, 290, 60, CREAM, t, c1, 'semi')
    td, tf, tt = ww(k, 'driver') - 0.2, ww(k, 'fuel') - 0.2, ww(k, 'traffic') - 0.2
    bullet(c, 'the driver is slumped over the wheel', 385, t, td)
    bullet(c, 'fuel is leaking', 460, t, tf)
    bullet(c, 'traffic is still passing', 535, t, tt)
    highway(c, 1150, 224, 1.0, t, ua(t, c1, 0.4), ua(t, ww(k, 'car') - 0.2, 0.4), ua(t, td, 0.5) * (1 - ua(t, tf - 0.2, 0.4)), ua(t, tf, 1.2), ua(t, tt, 0.5))
    tasks(c, t, (('Your first responsibility?', c2), ('Assessment or care first?', ww(k, 'And', 0, c2) - 0.2)))


def p2a(c, t):
    k = 'p2a'; t0, c1, c2 = cues(k, 2)
    board(c, t); head(c, t, t0, 2, True)
    y1, y2 = 340, 770
    num(c, 1, NX, y1, ua(t, t0 + 0.1, 0.3))
    hw(c, 'your own safety', NX + 80, y1, 88, CREAM, t, ww(k, 'own') - 0.3, 1.0)
    ttr, tfu = ww(k, 'traffic') - 0.2, ww(k, 'fuel') - 0.2
    hw(c, '(traffic,', NX + 80, y1 + 100, 72, AMBER, t, ttr, 0.5); hw(c, 'fuel)', NX + 80 + hwid('(traffic, ', 72), y1 + 100, 72, AMBER, t, tfu, 0.4)
    highway(c, 1190, 230, 1.0, t, ua(t, t0, 0.4), rfuel=ua(t, tfu, 0.5), rtraf=ua(t, ttr, 0.5))
    trap(c, 'trap: running straight to the patient', t, ww(k, 'running') - 0.2, 600, 46, NX - 42)
    num(c, 2, NX, y2, ua(t, c2 - 0.1, 0.3))
    hw(c, 'assess, then treat', NX + 80, y2, 88, CREAM, t, ww(k, 'assess') - 0.2, 1.4)
    tx(c, "you can't treat what you haven't found", NX + 80, y2 + 140, 54, TEAL, t, ww(k, 'because') - 0.1, 'xb')


# ------------------------------------------------------------------ practice 3: off line or on line
def p3q(c, t):
    k = 'p3q'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    if yt_card(c, t, t0, c1, 3): return
    head(c, t, c1 - 0.2, 3)
    panel(c, 90, 190, 1830, 600, ua(t, c1 - 0.2, 0.4))
    tx(c, 'Naloxone reverses an opioid overdose.', 150, 300, 56, CREAM, t, c1, 'semi')
    tx(c, 'Your protocol says you may give it,', 150, 410, 56, CREAM, t, ww(k, 'Your', 0, c1) - 0.1, 'semi')
    tx(c, "and you don't need to call anyone.", 150, 495, 56, CREAM, t, ww(k, 'and', 0, c1 + 5) - 0.1, 'semi')
    page(c, 1320, 240, 1.22, ua(t, ww(k, 'protocol') - 0.2, 0.4))
    tr = ww(k, 'radio') - 0.2
    radio(c, 1640, 286, 1.06, ua(t, tr, 0.4), ua(t, tr + 0.3, 0.4), t)
    tasks(c, t, (('Which kind of medical direction?', c2), ('Radio a physician: which kind?', ww(k, 'And', 0, c2) - 0.2)))


def p3a(c, t):
    k = 'p3a'; t0, c1, c2 = cues(k, 2)
    board(c, t); head(c, t, t0, 3, True)
    y1, y2 = 340, 640
    num(c, 1, NX, y1, ua(t, t0 + 0.1, 0.3))
    page(c, 270, y1 - 138, 0.8, ua(t, t0 + 0.1, 0.4))
    hw(c, 'off line:', 480, y1, 88, AMBER, t, wx(k, 'off') - 0.2, 0.7)
    hw(c, 'a standing order', 480 + hwid('off line: ', 88), y1, 88, CREAM, t, ww(k, 'standing') - 0.4, 0.9)
    trd = ww(k, 'radio') - 0.2
    num(c, 2, NX, y2, ua(t, c1 - 0.1, 0.3))
    radio(c, 310, y2 - 142, 0.72, ua(t, trd, 0.4), ua(t, ww(k, 'real') - 0.3, 0.4), t)
    hw(c, 'on line:', 480, y2, 88, AMBER, t, wx(k, 'on') - 0.2, 0.7)
    hw(c, 'a real time order', 480 + hwid('on line: ', 88), y2, 88, CREAM, t, ww(k, 'real') - 0.4, 0.9)
    trap(c, 'trap: thinking off line means no doctor', t, ww(k, 'They') - 0.2, 815)
    tg = ww(k, 'gave', 0, c2) - 0.3
    loop(c, 336, y1 + 38, 62, 26, ua(t, ww(k, 'writing') - 0.3, 0.5))
    hw(c, 'the physician gave the order ahead of time, in writing', 960, 960, 64, CREAM, t, tg, 2.6, 'center')


SCENES = dict(p1q=p1q, p1a=p1a, p2q=p2q, p2a=p2a, p3q=p3q, p3a=p3a)
