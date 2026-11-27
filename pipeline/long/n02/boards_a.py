"""Teaching boards, part A of yt-nremt-02-provider-levels: promise, why, and the chapter 'Four levels of training' (l1 to l5).
The one navy board, never zooms. Everything appears on its word.

Reusable by the other scene files (import boards_a as A):
  A.staircase(c, x, y, scale, lit=(), labels=True, a=1.0, t=0, done=(), grow=1.0, sa=1.0)
      the four step staircase (EMR, EMT, AEMT, Paramedic). (x, y) is the bottom left corner of the front face. At scale 1 it is
      974 px wide and 442 px tall (A.stair_size(scale)). lit: steps in amber (indices 0..3, or a dict {index: 0..1}); done: steps in
      mint (same forms); labels: True/False or four alphas (the label is 40 px at scale 1, so pass labels=False under scale 1);
      grow: 0..1 or four values (a step rises from a low slab); sa: alpha per step; hi: steps that flash brighter in their own colour.
  A.step_tread(x, y, scale, i) -> the middle of step i's tread (to stand something on it).
  Icons, all drawn about their own centre: badge, helmet, aed, ambulance, oxygen, arm_iv, shin_io, airway, vial, vials, emt_bust,
  exam_sheet, ecg_monitor.  Call as A.icon(A.badge, c, x, y, s, a)."""
import math
import skia
import kit as K
from kit import P, SP, sm, W, H, text, chip, arrow, AMBER, CORAL, GREEN, CREAM, INK2, NAVY, COURSE
from base import Bt, cue, ua, lightbar, board, check, title, cues, tx, hw, tag, pulse
from fin import rr, poly, mixc

PI = math.pi
WHITE = (255, 255, 255)


def we(k, w, nth=0, after=None, d=0.0):
    """time of the nth spoken word that IS w (case blind, punctuation ignored); falls back to the beat start"""
    n = 0
    for word, a, b in Bt[k]['words']:
        if after is not None and a < after: continue
        if word.lower().strip('.,?!:;"\'') == w.lower():
            if n == nth: return a + d
            n += 1
    print('WORD MISSING', k, w, nth)
    return (after if after is not None else Bt[k]['t0']) + d


def _seq(v, n=4):
    if isinstance(v, (int, float, bool)): return [float(v)] * n
    return [float(q) for q in v]


def _lev(v):
    if isinstance(v, dict): return [float(v.get(i, 0.0)) for i in range(4)]
    return [1.0 if i in v else 0.0 for i in range(4)]


def shadow(c, cx, cy, w, h=16, a=1.0):
    c.drawOval(skia.Rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), P((6, 8, 24), 120 * a, MaskFilter=K.blur(9)))


def icon(fn, c, x, y, s=1.0, a=1.0, pop=None, **kw):
    """draw an icon function about (x, y) at scale s with alpha a (pop: 0..1 gives a small settle in)"""
    if a <= 0.01: return
    if pop is not None: s = s * (0.88 + 0.12 * sm(pop))
    c.save(); c.translate(x, y); c.scale(s, s)
    if a < 0.99: c.saveLayerAlpha(skia.Rect(-330, -260, 330, 260), int(255 * a))
    fn(c, **kw)
    if a < 0.99: c.restore()
    c.restore()


# ------------------------------------------------------------------ the staircase
STEPS = ('EMR', 'EMT', 'AEMT', 'Paramedic')
SW, SH0, RISE, DX, DY = 236.0, 110.0, 104.0, 30.0, 20.0
ST_FRONT, ST_TREAD, ST_SIDE = (60, 72, 138), (104, 120, 194), (40, 48, 104)
LIT_FRONT, LIT_TREAD, LIT_SIDE = AMBER, (255, 226, 154), (206, 150, 52)
DN_FRONT, DN_TREAD, DN_SIDE = (36, 128, 116), (76, 204, 180), (24, 92, 86)


def stair_size(scale=1.0):
    return (4 * SW + DX) * scale, (SH0 + 3 * RISE + DY) * scale


def step_tread(x, y, scale, i):
    """the middle of the tread (top face) of step i"""
    return x + (SW * (i + 0.5) + DX / 2) * scale, y - (SH0 + RISE * i + DY / 2) * scale


def step_face(x, y, scale, i):
    """the middle of the front face of step i, at label height"""
    return x + SW * (i + 0.5) * scale, y - (SH0 + RISE * i - 62) * scale


def staircase(c, x, y, scale, lit=(), labels=True, a=1.0, t=0, done=(), grow=1.0, sa=1.0, hi=()):
    if a <= 0.01: return
    lit, done, grow, sa, hi = _lev(lit), _lev(done), _seq(grow), _seq(sa), _lev(hi)
    lab = _seq(1.0 if labels is True else (0.0 if labels is False else labels))
    c.save(); c.translate(x, y); c.scale(scale, scale)
    if a < 0.99: c.saveLayerAlpha(skia.Rect(-60, -(SH0 + 3 * RISE + DY) - 90, 4 * SW + DX + 60, 60), int(255 * a))
    wd = sum(1 for v in sa if v > 0.01) * SW
    if wd: shadow(c, wd / 2 + 10, 6, wd + 60, 26, max(sa))
    for i in range(4):                                   # glow behind a lit step
        if lit[i] > 0.01 and sa[i] > 0.01:
            h = SH0 + RISE * i; pu = 0.8 + 0.2 * math.sin(t * 2.4)
            c.drawRRect(rr(SW * i - 14, -h - 34, SW * (i + 1) + DX + 14, 10, 30), P(AMBER, 120 * lit[i] * pu * sa[i], MaskFilter=K.blur(26), BlendMode=skia.BlendMode.kScreen))
    for i in range(4):
        if sa[i] <= 0.01: continue
        al = 255 * sa[i]; h = 16 + (SH0 + RISE * i - 16) * sm(grow[i]); x0, x1 = SW * i, SW * (i + 1)
        fr = mixc(mixc(ST_FRONT, DN_FRONT, done[i]), LIT_FRONT, lit[i])
        tr = mixc(mixc(ST_TREAD, DN_TREAD, done[i]), LIT_TREAD, lit[i])
        sd = mixc(mixc(ST_SIDE, DN_SIDE, done[i]), LIT_SIDE, lit[i])
        if hi[i] > 0.01: fr, tr, sd = (mixc(q, WHITE, 0.3 * hi[i]) for q in (fr, tr, sd))
        hn = 16 + (SH0 + RISE * (i + 1) - 16) * sm(grow[i + 1]) if i < 3 and sa[i + 1] > 0.01 else 0
        if hn < h:                                       # the right side shows only where no taller step hides it
            c.drawPath(poly([(x1, -h), (x1 + DX, -h - DY), (x1 + DX, -hn - DY if hn else -DY), (x1, -hn if hn else 0)]), P(sd, al))
        c.drawPath(poly([(x0, -h), (x1, -h), (x1 + DX, -h - DY), (x0 + DX, -h - DY)]), P(tr, al))
        c.drawRect(skia.Rect(x0, -h, x1, 0), P(fr, al))
        c.drawRect(skia.Rect(x0, -h, x1, -h + 5), P(WHITE, 46 * sa[i]))            # soft rim under the tread edge
        if i > 0 and sa[i - 1] > 0.01:                    # a thin crease where the lower step meets this face
            hp = 16 + (SH0 + RISE * (i - 1) - 16) * sm(grow[i - 1])
            c.drawRect(skia.Rect(x0, -min(h, hp), x0 + 4, 0), P((8, 12, 40), 70 * sa[i]))
        if lab[i] > 0.01 and grow[i] > 0.9:
            col = mixc(mixc(CREAM, CREAM, done[i]), NAVY, lit[i])
            text(c, STEPS[i], (x0 + x1) / 2, -h + 62, 40, col, lab[i] * sa[i], 'xb', 'center')
    if a < 0.99: c.restore()
    c.restore()


# ------------------------------------------------------------------ icons (house flat style: flat shapes, two tones, a soft rim, a soft shadow)
SKIN, SKIN_D = (224, 172, 134), (196, 140, 104)
SKIN2, SKIN2_D = (188, 132, 96), (158, 104, 74)
GLASS = (104, 146, 214)


def _bolt(c, x, y, s, col=WHITE, a=255):
    c.drawPath(poly([(x + 4 * s, y - 14 * s), (x - 8 * s, y + 2 * s), (x - 1 * s, y + 2 * s), (x - 4 * s, y + 14 * s), (x + 8 * s, y - 3 * s), (x + 1 * s, y - 3 * s)]), P(col, a))


def _star(c, x, y, r, col, n=5, inner=0.42, rot=-PI / 2):
    pts = []
    for i in range(n * 2):
        q = r if i % 2 == 0 else r * inner; an = rot + i * PI / n
        pts.append((x + q * math.cos(an), y + q * math.sin(an)))
    c.drawPath(poly(pts), P(col))


def _life(c, x, y, r, col=(58, 110, 206)):
    """the six pointed star of life: three crossed bars"""
    for k in range(3):
        c.save(); c.translate(x, y); c.rotate(60 * k)
        c.drawRRect(rr(-r * 0.27, -r, r * 0.27, r, r * 0.06), P(col)); c.restore()
    c.drawRect(skia.Rect(x - r * 0.07, y - r * 0.55, x + r * 0.07, y + r * 0.55), P(WHITE, 235))


def _heart(x, y, s):
    p = skia.Path(); p.moveTo(x, y + 15 * s)
    p.cubicTo(x - 26 * s, y - 2 * s, x - 18 * s, y - 22 * s, x, y - 9 * s)
    p.cubicTo(x + 18 * s, y - 22 * s, x + 26 * s, y - 2 * s, x, y + 15 * s); p.close(); return p


def badge(c):
    """a police badge: a gold shield with a banner and a star on a navy seal (about 196 x 226)"""
    def shield(k):
        p = skia.Path(); p.moveTo(0, -110 * k)
        p.cubicTo(-28 * k, -86 * k, -62 * k, -84 * k, -88 * k, -98 * k)
        p.cubicTo(-80 * k, -70 * k, -94 * k, -44 * k, -96 * k, -18 * k)
        p.cubicTo(-98 * k, 36 * k, -62 * k, 84 * k, 0, 112 * k)
        p.cubicTo(62 * k, 84 * k, 98 * k, 36 * k, 96 * k, -18 * k)
        p.cubicTo(94 * k, -44 * k, 80 * k, -70 * k, 88 * k, -98 * k)
        p.cubicTo(62 * k, -84 * k, 28 * k, -86 * k, 0, -110 * k); p.close(); return p
    shadow(c, 0, 118, 150, 18)
    c.drawPath(shield(1.0), P((246, 200, 96)))
    c.drawPath(shield(0.84), P((212, 156, 52)))
    c.drawCircle(0, 18, 46, P((246, 200, 96))); c.drawCircle(0, 18, 38, P((30, 42, 96)))
    _star(c, 0, 18, 27, (246, 200, 96))
    c.drawRRect(rr(-62, -66, 62, -40, 8), P((255, 232, 160)))
    c.drawRRect(rr(-34, -58, 34, -49, 4), P((212, 156, 52)))
    c.save(); c.clipPath(shield(1.0), True)
    c.drawPath(poly([(-110, -120), (-40, -120), (-96, 30), (-110, 30)]), P(WHITE, 42)); c.restore()


def helmet(c):
    """a fire helmet from the front: a red dome with ridges, a wide brim and a gold front shield (about 290 x 200)"""
    shadow(c, 0, 82, 250, 18)
    b = skia.Path(); b.moveTo(-146, 58); b.cubicTo(-128, 16, -84, 2, 0, 2); b.cubicTo(84, 2, 128, 16, 146, 58)
    b.cubicTo(96, 82, -96, 82, -146, 58); b.close()
    c.drawPath(b, P((160, 40, 40)))
    d = skia.Path(); d.moveTo(-96, 34); d.cubicTo(-98, -68, -54, -114, 0, -114); d.cubicTo(54, -114, 98, -68, 96, 34)
    d.cubicTo(44, 20, -44, 20, -96, 34); d.close()
    c.drawPath(d, P((222, 68, 56)))
    for sg in (-1, 1):                                   # the side ridges
        r_ = skia.Path(); r_.moveTo(sg * 10, -110); r_.cubicTo(sg * 46, -96, sg * 64, -40, sg * 66, 22)
        r_.lineTo(sg * 54, 20); r_.cubicTo(sg * 52, -36, sg * 36, -86, sg * 4, -100); r_.close()
        c.drawPath(r_, P((168, 44, 42)))
    c.drawRRect(rr(-9, -124, 9, -96, 6), P((168, 44, 42)))
    c.save(); c.clipPath(d, True)
    c.drawPath(poly([(-100, -120), (-66, -120), (-92, 30), (-100, 30)]), P(WHITE, 50)); c.restore()
    s = skia.Path(); s.moveTo(0, -92); s.cubicTo(-14, -78, -30, -76, -42, -84); s.cubicTo(-38, -50, -46, -20, -36, 12)
    s.cubicTo(-28, 34, -12, 46, 0, 52); s.cubicTo(12, 46, 28, 34, 36, 12); s.cubicTo(46, -20, 38, -50, 42, -84)
    s.cubicTo(30, -76, 14, -78, 0, -92); s.close()
    c.drawPath(s, P((250, 204, 96)))
    c.save(); c.scale(0.76, 0.76); c.translate(0, -5); c.drawPath(s, P((212, 152, 50))); c.restore()
    c.drawRRect(rr(-17, -34, 17, 8, 5), P((255, 236, 176)))


def aed(c, shock=0.0):
    """an AED: a small carry case with a heart and bolt mark, an on button, an orange shock button, and two pads on leads (about 330 x 200)"""
    shadow(c, 20, 92, 300, 18)
    for (px, py, rot, x0, y0) in ((122, -44, 14, 38, -20), (132, 46, -10, 38, 30)):          # leads, then pads
        w = skia.Path(); w.moveTo(x0, y0); w.cubicTo(x0 + 30, y0 - 6, px - 50, py + 30 * (1 if py < 0 else -1), px - 22, py)
        c.drawPath(w, SP((150, 160, 196), 5))
        c.save(); c.translate(px, py); c.rotate(rot)
        c.drawRRect(rr(-30, -40, 30, 40, 13), P((246, 242, 232)))
        c.drawRRect(rr(-20, -30, 20, 30, 9), P((150, 214, 226)))
        c.drawRRect(rr(-30, -40, -22, 40, 4), P(WHITE, 120)); c.restore()
    h = skia.Path(); h.addRRect(rr(-104, -98, -8, -48, 20)); h.addRRect(rr(-86, -82, -26, -52, 10)); h.setFillType(skia.PathFillType.kEvenOdd)
    c.drawPath(h, P((64, 74, 122)))
    c.drawRRect(rr(-152, -62, 40, 84, 26), P((240, 240, 234)))
    c.save(); c.clipRRect(rr(-152, -62, 40, 84, 26), True)
    c.drawRect(skia.Rect(-152, 52, 40, 84), P((206, 210, 212)))
    c.drawRect(skia.Rect(-152, -62, 40, -56), P(WHITE, 160)); c.restore()
    c.drawPath(_heart(-96, 2, 2.0), P((222, 68, 56))); _bolt(c, -96, 0, 1.25)
    if shock > 0.01: c.drawCircle(-18, 8, 46, P((255, 150, 60), 200 * shock, MaskFilter=K.blur(14), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(-18, 8, 34, P((206, 96, 30))); c.drawCircle(-18, 8, 27, P(mixc((255, 140, 50), (255, 214, 150), shock))); _bolt(c, -18, 8, 1.2)
    c.drawCircle(-18, -42, 9, P((90, 196, 120)))


def ambulance(c, lights=0.0):
    """a US box ambulance from the side, facing right (about 440 x 220, centred)"""
    c.save(); c.translate(-212, -112)
    shadow(c, 212, 208, 430, 20)
    c.drawRRect(rr(398, 150, 424, 172, 5), P((120, 128, 156)))                # bumpers
    c.drawRRect(rr(-2, 158, 16, 172, 4), P((120, 128, 156)))
    cab = skia.Path(); cab.moveTo(262, 66); cab.lineTo(326, 66); cab.cubicTo(342, 66, 350, 74, 362, 104); cab.lineTo(398, 114)
    cab.cubicTo(410, 116, 414, 124, 414, 136); cab.lineTo(414, 172); cab.lineTo(262, 172); cab.close()
    c.drawPath(cab, P((240, 240, 236)))
    c.drawRRect(rr(8, 18, 272, 172, 12), P((240, 240, 236)))                  # the patient module (the box)
    c.save(); c.clipRRect(rr(8, 18, 272, 172, 12), True)
    c.drawRect(skia.Rect(8, 138, 272, 172), P((208, 212, 216)))
    c.drawRect(skia.Rect(8, 18, 272, 25), P(WHITE, 200)); c.restore()
    c.save(); c.clipPath(cab, True); c.drawRect(skia.Rect(262, 138, 414, 172), P((208, 212, 216))); c.restore()
    c.drawRect(skia.Rect(8, 108, 272, 130), P((232, 96, 60)))                 # the stripe runs along the box and the cab
    c.save(); c.clipPath(cab, True); c.drawRect(skia.Rect(262, 118, 414, 136), P((232, 96, 60))); c.restore()
    win = skia.Path(); win.moveTo(284, 76); win.lineTo(324, 76); win.cubicTo(334, 76, 340, 82, 350, 106); win.lineTo(284, 106); win.close()
    c.drawPath(win, P(GLASS)); c.save(); c.clipPath(win, True); c.drawPath(poly([(296, 70), (314, 70), (300, 110), (282, 110)]), P(WHITE, 70)); c.restore()
    c.drawRRect(rr(196, 40, 250, 86, 7), P(GLASS)); c.drawPath(poly([(206, 40), (220, 40), (208, 86), (196, 86)]), P(WHITE, 60))
    _life(c, 104, 64, 34)
    for (x0, x1, col) in ((20, 56, (232, 70, 60)), (222, 262, (232, 70, 60)), (280, 314, (255, 190, 80))):   # the light bars
        y0 = 54 if x0 > 270 else 6
        if lights > 0.01: c.drawRRect(rr(x0 - 8, y0 - 8, x1 + 8, y0 + 22, 12), P(col, 210 * lights, MaskFilter=K.blur(10), BlendMode=skia.BlendMode.kScreen))
        c.drawRRect(rr(x0, y0, x1, y0 + 13, 5), P(col))
    c.drawRRect(rr(400, 124, 414, 138, 4), P((255, 226, 150)))                # headlight
    c.drawRect(skia.Rect(140, 134, 143, 172), P((176, 180, 190))); c.drawRect(skia.Rect(60, 134, 63, 172), P((176, 180, 190)))
    for wx in (100, 338):
        c.drawCircle(wx, 172, 39, P((52, 58, 92)))
        c.drawCircle(wx, 176, 31, P((26, 28, 44))); c.drawCircle(wx, 176, 15, P((178, 184, 200))); c.drawCircle(wx, 176, 6, P((96, 104, 132)))
    c.restore()


def oxygen(c):
    """a green oxygen cylinder with its regulator and gauge, and a mask on its tubing (about 250 x 180)"""
    shadow(c, 0, 92, 230, 16)
    tb = skia.Path(); tb.moveTo(-42, -62); tb.cubicTo(6, -70, -6, 40, 28, 62); tb.cubicTo(44, 72, 54, 66, 60, 56)
    c.drawPath(tb, SP((206, 226, 232), 6))
    c.drawRect(skia.Rect(-86, -52, -66, -30), P((176, 184, 204)))
    c.drawRRect(rr(-106, -36, -46, 88, 26), P((66, 172, 104)))
    c.save(); c.clipRRect(rr(-106, -36, -46, 88, 26), True)
    c.drawRect(skia.Rect(-64, -36, -46, 88), P((44, 132, 80))); c.drawRect(skia.Rect(-100, -30, -92, 88), P(WHITE, 60)); c.restore()
    c.drawRRect(rr(-100, -74, -52, -50, 7), P((196, 202, 218)))
    c.drawCircle(-40, -62, 19, P((120, 128, 160))); c.drawCircle(-40, -62, 14, P((246, 244, 236)))
    c.drawLine(-40, -62, -32, -70, SP((222, 68, 56), 3.5))
    for sg in (-1, 1):                                   # the elastic strap
        st = skia.Path(); st.moveTo(64 + sg * 34, -8); st.cubicTo(64 + sg * 58, -30, 64 + sg * 52, -62, 64 + sg * 20, -66)
        c.drawPath(st, SP((150, 168, 200), 4))
    m = skia.Path(); m.moveTo(64, -58); m.cubicTo(98, -54, 112, 6, 102, 38); m.cubicTo(92, 66, 36, 66, 26, 38)
    m.cubicTo(16, 6, 30, -54, 64, -58); m.close()
    c.drawPath(m, P((190, 236, 226), 235))
    c.save(); c.clipPath(m, True); c.drawOval(skia.Rect(30, 6, 98, 78), P((132, 206, 196), 235))
    c.drawPath(poly([(22, -60), (44, -60), (30, 60), (16, 60)]), P(WHITE, 80)); c.restore()
    c.drawRRect(rr(55, -52, 73, -40, 4), P((246, 244, 236)))
    c.drawRRect(rr(52, 50, 76, 70, 6), P((120, 180, 180)))


def _limb(c, path, base, dark, band=13):
    """skin in two tones: the dark tone shows as a band along the lower edge"""
    c.drawPath(path, P(dark))
    c.save(); c.clipPath(path, True); c.translate(0, -band); c.drawPath(path, P(base)); c.restore()


def _flow(c, path, t, a=1.0, col=(150, 232, 255), n=4, sp=0.35):
    """small drops of fluid moving along a line"""
    if a <= 0.01: return
    m = skia.PathMeasure(path, False); L = m.getLength()
    for i in range(n):
        u = (t * sp + i / n) % 1.0
        pos, _ = m.getPosTan(L * u)
        c.drawCircle(pos.x(), pos.y(), 5.5, P(col, 255 * a * math.sin(PI * u) ** 0.5))


def _bag(c):
    """the fluid bag on its hook, with its drip chamber"""
    c.drawRRect(rr(-112, -232, -96, -214, 6), P((150, 160, 196)))
    c.drawRRect(rr(-136, -226, -72, -148, 13), P((226, 240, 246), 240))
    c.save(); c.clipRRect(rr(-136, -226, -72, -148, 13), True); c.drawRect(skia.Rect(-136, -196, -72, -148), P((150, 214, 238))); c.restore()
    c.drawRRect(rr(-130, -220, -122, -156, 4), P(WHITE, 120))
    c.drawRRect(rr(-110, -148, -98, -128, 4), P((226, 240, 246), 240))


def arm_iv(c, t=0.0, flow=0.0):
    """a forearm, palm up, with an IV catheter in a forearm vein, a clear dressing, and the line up to a fluid bag (about 350 x 250)"""
    c.save(); c.translate(0, 40)
    shadow(c, 0, 64, 320, 16)
    arm = skia.Path(); arm.moveTo(-172, -40); arm.cubicTo(-100, -46, -16, -34, 58, -27)
    arm.cubicTo(74, -48, 106, -58, 120, -48); arm.cubicTo(128, -40, 112, -32, 102, -27)
    arm.cubicTo(132, -32, 166, -28, 172, -8); arm.cubicTo(176, 12, 166, 24, 148, 27)
    arm.cubicTo(118, 31, 88, 27, 58, 23); arm.cubicTo(-16, 33, -100, 46, -172, 42); arm.close()
    _limb(c, arm, SKIN, SKIN_D)
    for fy in (-10, 4, 16): c.drawLine(132, fy, 166, fy + 1, SP(SKIN_D, 3))
    c.drawRRect(rr(-190, -52, -148, 54, 12), P((112, 134, 200)))             # the pushed up sleeve
    c.drawRRect(rr(-190, -52, -180, 54, 5), P((86, 106, 170)))
    v = skia.Path(); v.moveTo(-146, 4); v.cubicTo(-90, -4, -30, 2, 44, -4)
    c.drawPath(v, SP((104, 140, 206), 6, 150))
    v2 = skia.Path(); v2.moveTo(-60, 0); v2.cubicTo(-30, 14, 10, 16, 40, 12)
    c.drawPath(v2, SP((104, 140, 206), 5, 120))
    line = skia.Path(); line.moveTo(-104, -196); line.cubicTo(-104, -112, 58, -124, 50, -52); line.cubicTo(46, -18, 22, -3, -12, -2)
    c.drawPath(line, SP((214, 232, 240), 5))
    _flow(c, line, t, flow)
    c.drawRRect(rr(-84, -22, -14, 20, 8), P(WHITE, 70)); c.drawRRect(rr(-84, -22, -14, -17, 3), P(WHITE, 110))    # the clear dressing
    c.drawLine(-70, 0, -42, -1, SP((206, 214, 226), 3.5))                    # the catheter in the vein, pointing up the arm
    c.drawRRect(rr(-44, -8, -14, 6, 4), P((240, 112, 160))); c.drawRRect(rr(-34, -13, -26, 11, 3), P((214, 84, 134)))
    _bag(c)
    c.restore()


def shin_io(c, t=0.0, flow=0.0):
    """a leg lying flat seen from the side, the shin bone showing, with an IO needle in the upper shin just below the knee (about 350 x 250)"""
    c.save(); c.translate(0, 40)
    shadow(c, 0, 70, 330, 16)
    leg = skia.Path(); leg.moveTo(-172, -34); leg.cubicTo(-130, -42, -100, -52, -72, -50)
    leg.cubicTo(-48, -48, -34, -34, 0, -28); leg.cubicTo(50, -22, 96, -18, 124, -18)
    leg.cubicTo(134, -40, 140, -70, 152, -82); leg.cubicTo(164, -88, 176, -78, 174, -62)
    leg.cubicTo(172, -30, 176, 6, 168, 26); leg.cubicTo(160, 38, 140, 36, 126, 28)
    leg.cubicTo(96, 30, 60, 48, 20, 48); leg.cubicTo(-20, 48, -40, 34, -72, 38)
    leg.cubicTo(-110, 44, -140, 56, -172, 54); leg.close()
    _limb(c, leg, SKIN2, SKIN2_D)
    c.save(); c.clipPath(leg, True)
    bone = (250, 240, 214)
    fe = skia.Path(); fe.moveTo(-180, -4); fe.lineTo(-112, -12); fe.cubicTo(-96, -24, -78, -22, -76, -6)
    fe.cubicTo(-74, 14, -96, 22, -112, 12); fe.lineTo(-180, 18); fe.close()
    c.drawPath(fe, P(bone, 225))
    ti = skia.Path(); ti.moveTo(-64, -30); ti.cubicTo(-44, -30, -30, -22, -6, -16); ti.lineTo(112, -8)
    ti.cubicTo(124, -12, 132, -4, 130, 6); ti.cubicTo(128, 14, 118, 14, 110, 10); ti.lineTo(-10, 6)
    ti.cubicTo(-34, 12, -52, 14, -64, 8); ti.cubicTo(-72, -4, -72, -20, -64, -30); ti.close()
    c.drawPath(ti, P(bone, 240))
    c.drawOval(skia.Rect(-88, -48, -62, -32), P(bone, 225))                  # the kneecap
    c.restore()
    c.drawRRect(rr(-192, -46, -150, 66, 12), P((112, 134, 200)))             # the rolled up trouser leg
    c.drawRRect(rr(-192, -46, -182, 66, 5), P((86, 106, 170)))
    line = skia.Path(); line.moveTo(-104, -196); line.cubicTo(-104, -124, -22, -150, -30, -84)
    c.drawPath(line, SP((214, 232, 240), 5))
    _flow(c, line, t, flow)
    _bag(c)
    c.drawRect(skia.Rect(-32.5, -66, -27.5, -8), P((196, 204, 220)))         # the needle, straight down into the bone
    c.drawPath(poly([(-32.5, -8), (-27.5, -8), (-30, 0)]), P((196, 204, 220)))
    c.drawRRect(rr(-46, -45, -14, -38, 3), P((246, 244, 236)))               # the flange on the skin
    c.drawRRect(rr(-42, -88, -18, -58, 6), P((240, 112, 160))); c.drawRRect(rr(-42, -88, -18, -80, 4), P((214, 84, 134)))
    if flow > 0.01: c.drawCircle(-30, -4, 13, P((150, 232, 255), 150 * flow * (0.6 + 0.4 * math.sin(t * 5)), MaskFilter=K.blur(5), BlendMode=skia.BlendMode.kScreen))
    c.restore()


def airway(c):
    """an advanced airway device (a supraglottic airway) lying on its side: connector, bite block, curved tube and the soft cuff (about 430 x 120)"""
    shadow(c, 0, 58, 380, 14)
    tb = skia.Path(); tb.moveTo(-130, 14); tb.cubicTo(-50, 16, 30, 12, 104, -16)
    c.drawPath(tb, SP((208, 222, 234), 30))
    hl = skia.Path(); hl.moveTo(-126, 5); hl.cubicTo(-50, 7, 26, 3, 96, -24)
    c.drawPath(hl, SP(WHITE, 6, 120))
    c.save(); c.translate(142, -30); c.rotate(-21)
    cf = skia.Path(); cf.moveTo(-62, 0); cf.cubicTo(-58, -36, -10, -44, 26, -34); cf.cubicTo(52, -26, 72, -10, 78, 0)
    cf.cubicTo(72, 10, 52, 26, 26, 34); cf.cubicTo(-10, 44, -58, 36, -62, 0); cf.close()
    c.drawPath(cf, P((112, 214, 196)))
    c.drawOval(skia.Rect(-36, -19, 44, 19), P((58, 160, 148)))
    c.drawOval(skia.Rect(-46, -31, 20, -22), P(WHITE, 90)); c.restore()
    c.drawRRect(rr(-160, -14, -100, 42, 10), P((150, 190, 232)))
    c.drawRRect(rr(-160, -14, -100, -6, 4), P(WHITE, 90))
    c.drawRRect(rr(-204, -6, -156, 34, 5), P((246, 244, 236))); c.drawRect(skia.Rect(-204, 22, -156, 34), P((212, 214, 216)))


VIAL_COLS = (AMBER, (120, 200, 240), CORAL, COURSE, (182, 160, 240), (255, 150, 190), (110, 206, 130), (255, 170, 90), (120, 150, 240), (240, 220, 120))


def vial(c, col=AMBER):
    """a medication vial: glass body with liquid, a label band, a crimped neck and a flip cap (36 x 90)"""
    c.drawRRect(rr(-11, -45, 11, -37, 3), P(col))
    c.drawRRect(rr(-10, -38, 10, -29, 2), P((188, 196, 214)))
    c.drawRect(skia.Rect(-6, -30, 6, -22), P((214, 232, 242), 235))
    body = rr(-17, -24, 17, 45, 7)
    c.drawRRect(body, P((222, 238, 246), 240))
    c.save(); c.clipRRect(body, True)
    c.drawRect(skia.Rect(-17, -8, 17, 45), P((170, 214, 236)))
    c.drawRect(skia.Rect(-17, 2, 17, 30), P(col)); c.drawRect(skia.Rect(-9, 11, 9, 15), P(WHITE, 210)); c.drawRect(skia.Rect(-9, 19, 3, 23), P(WHITE, 150))
    c.drawRect(skia.Rect(-13, -24, -8, 45), P(WHITE, 100)); c.restore()


def vials(c, x, y, n, u=1.0, gap=44, s=1.0, i0=0, a=1.0):
    """a row of n vials starting at x (centre of the first), appearing one after another as u goes 0 -> 1"""
    if a <= 0.01 or u <= 0.0: return
    k = min(n, u * n)
    shadow(c, x + gap * (max(1, math.ceil(k)) - 1) / 2 * s, y + 48 * s, (gap * max(1, math.ceil(k)) + 10) * s, 12, a * min(1, k))
    for i in range(n):
        ai = sm((u * n - i) / 1.0)
        if ai > 0.01: icon(vial, c, x + i * gap * s, y, s, ai * a, ai, col=VIAL_COLS[(i + i0) % len(VIAL_COLS)])


def emt_bust(c):
    """an EMT, head and shoulders: dark hair tied back, navy uniform shirt, a star of life patch, a stethoscope (about 250 x 300)"""
    tor = skia.Path(); tor.moveTo(-122, 150); tor.cubicTo(-124, 76, -86, 44, -34, 34); tor.lineTo(34, 34)
    tor.cubicTo(86, 44, 124, 76, 122, 150); tor.close()
    c.drawPath(tor, P((50, 84, 164)))
    c.save(); c.clipPath(tor, True)
    c.drawRect(skia.Rect(62, 20, 130, 150), P((36, 62, 130))); c.restore()
    c.drawOval(skia.Rect(-58, -94, -8, -28), P((40, 30, 34)))                # hair gathered at the back
    c.drawOval(skia.Rect(-64, -116, -24, -78), P((40, 30, 34)))
    c.drawRect(skia.Rect(-17, 0, 17, 46), P(SKIN2_D))
    c.drawPath(poly([(-36, 32), (-17, 30), (0, 62)]), P((84, 118, 196))); c.drawPath(poly([(36, 32), (17, 30), (0, 62)]), P((84, 118, 196)))
    c.drawOval(skia.Rect(-44, -100, 44, 14), P(SKIN2))
    c.drawOval(skia.Rect(40, -52, 52, -28), P(SKIN2_D))                      # ear
    hr = skia.Path(); hr.moveTo(-46, -40); hr.cubicTo(-52, -92, -20, -112, 6, -110); hr.cubicTo(34, -108, 50, -84, 46, -48)
    hr.cubicTo(36, -72, 14, -84, -10, -78); hr.cubicTo(-30, -72, -40, -58, -46, -40); hr.close()
    c.drawPath(hr, P((40, 30, 34)))
    c.drawOval(skia.Rect(-22, -44, -14, -34), P((40, 30, 34))); c.drawOval(skia.Rect(14, -44, 22, -34), P((40, 30, 34)))
    sm_ = skia.Path(); sm_.moveTo(-12, -14); sm_.cubicTo(-4, -7, 6, -7, 13, -15)
    c.drawPath(sm_, SP(SKIN2_D, 4))
    st = skia.Path(); st.moveTo(-26, 36); st.cubicTo(-40, 84, -24, 116, 0, 116); st.cubicTo(24, 116, 40, 84, 26, 36)
    c.drawPath(st, SP((24, 28, 52), 7))
    c.drawLine(0, 116, 0, 136, SP((24, 28, 52), 7)); c.drawCircle(0, 140, 12, P((196, 202, 218))); c.drawCircle(0, 140, 6, P((120, 128, 160)))
    c.drawRRect(rr(58, 78, 100, 120, 8), P(WHITE)); _life(c, 79, 99, 17)


def exam_sheet(c):
    """an exam sheet: a page with a folded corner, a heading bar and answer rows, one bubble filled (about 200 x 260)"""
    shadow(c, 0, 132, 190, 16)
    pg = poly([(-96, -126), (58, -126), (96, -88), (96, 126), (-96, 126)])
    c.drawPath(pg, P((244, 240, 230)))
    c.drawPath(poly([(58, -126), (96, -88), (58, -88)]), P((204, 198, 186)))
    c.drawRRect(rr(-72, -98, 20, -84, 5), P((92, 104, 160)))
    for i in range(4):
        y = -44 + i * 44
        c.drawCircle(-62, y, 12, P(COURSE if i == 1 else (196, 198, 208)))
        c.drawRRect(rr(-36, y - 7, 70 - (22 if i % 2 else 0), y + 7, 5), P((196, 198, 208)))
    c.drawRect(skia.Rect(-96, -126, -88, 126), P(WHITE, 120))


def _ecg(x):
    """one heartbeat of an ECG, x in 0..1 -> height (R = 1)"""
    g = lambda m, w, h: h * math.exp(-((x - m) / w) ** 2)
    return g(0.18, 0.035, 0.13) - g(0.335, 0.010, 0.12) + g(0.36, 0.011, 1.0) - g(0.385, 0.011, 0.22) + g(0.60, 0.055, 0.26)


_ECGP = {}


def ecg_monitor(c, x0, y0, x1, y1, a=1.0, u=0.0, t=0.0):
    """a heart monitor screen; the tracing draws across as u goes 0 -> 1, then a bright point keeps sweeping it"""
    if a <= 0.01: return
    if a < 0.99: c.saveLayerAlpha(skia.Rect(x0 - 30, y0 - 30, x1 + 30, y1 + 40), int(255 * a))
    shadow(c, (x0 + x1) / 2, y1 + 10, (x1 - x0) * 0.92, 18)
    c.drawRRect(rr(x0, y0, x1, y1, 26), P((72, 84, 140)))
    c.drawRRect(rr(x0, y0, x1, y0 + 8, 4), P(WHITE, 40))
    sx0, sy0, sx1, sy1 = x0 + 18, y0 + 18, x1 - 18, y1 - 18
    c.drawRRect(rr(sx0, sy0, sx1, sy1, 14), P((10, 18, 34)))
    c.save(); c.clipRRect(rr(sx0, sy0, sx1, sy1, 14), True)
    for gx in range(int(sx0) + 40, int(sx1), 40): c.drawLine(gx, sy0, gx, sy1, SP((70, 150, 120), 1.5, 46))
    for gy in range(int(sy0) + 40, int(sy1), 40): c.drawLine(sx0, gy, sx1, gy, SP((70, 150, 120), 1.5, 46))
    key = (round(sx0), round(sy0), round(sx1), round(sy1))
    if key not in _ECGP:
        base = sy0 + (sy1 - sy0) * 0.66; amp = (sy1 - sy0) * 0.50; per = (sx1 - sx0 - 30) / 3.4
        p = skia.Path(); n = int(sx1 - sx0 - 30) // 2
        for i in range(n + 1):
            xx = sx0 + 15 + i * 2; yy = base - amp * _ecg(((xx - sx0 - 15) / per + 0.05) % 1.0)
            p.moveTo(xx, yy) if i == 0 else p.lineTo(xx, yy)
        _ECGP[key] = (p, skia.PathMeasure(p, False).getLength(), base)
    p, L, base = _ECGP[key]
    col = (120, 240, 160)
    if u <= 0.001:
        c.drawLine(sx0 + 15, base, sx1 - 15, base, SP(col, 4, 90))
    else:
        seg = skia.Path(); m = skia.PathMeasure(p, False); m.getSegment(0, L * min(1, u), seg, True)
        c.drawPath(seg, SP(col, 12, 60)); c.drawPath(seg, SP(col, 5))
        hu = u if u < 1 else ((t * 0.3) % 1.0)
        pos, _ = m.getPosTan(L * hu)
        c.drawCircle(pos.x(), pos.y(), 16, P(col, 150, MaskFilter=K.blur(8), BlendMode=skia.BlendMode.kScreen)); c.drawCircle(pos.x(), pos.y(), 6, P((230, 255, 240)))
    c.restore()
    if a < 0.99: c.restore()


# ------------------------------------------------------------------ promise
def promise(c, t):
    k = 'promise'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'By the end', t, t0 - 1)
    tf = we(k, 'four', d=-0.15)
    rows = (('the four levels of EMS', tf, c1), ('what each level adds', c1, c2), ('what an EMT is responsible for', c2, c3), ('who gives permission', c3, Bt[k]['t1'] + 9))
    for i, (s, ts, te) in enumerate(rows):
        y = 370 + i * 150
        lightbar(c, t, y, ts, te, 110, 1090, 112)
        u = ua(t, ts - 0.05, 0.3)
        if u > 0: c.drawCircle(152, y - 20, 11 * u, P(COURSE))
        hw(c, s, 190, y, 64, CREAM, t, ts, 0.9)
    # the small staircase: it rises as "four levels" is said, each step shows its plus, then the EMT step lights
    sx, sy, sc = 1190, 760, 0.64
    g = [ua(t, tf + 0.22 * i, 0.5) for i in range(4)]
    base_a = ua(t, t0 + 0.2, 0.5)
    staircase(c, sx, sy, sc, lit={1: ua(t, c2 + 0.2, 0.5)}, labels=False, t=t, grow=g, sa=[max(0.0, base_a)] * 4)
    for i in (1, 2, 3):
        tp = c1 + 0.25 + 0.22 * (i - 1); u = ua(t, tp, 0.3)
        if u > 0:
            px, py = step_tread(sx, sy, sc, i)
            text(c, '+', px - 6, py - 22 - 10 * pulse(t, tp, 0.45), 74, AMBER, u, 'xb', 'center')


# ------------------------------------------------------------------ why
def why(c, t):
    k = 'why'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'Why care about this first?', t, t0 - 1)
    cx, cy, R = 470, 560, 250
    a0 = ua(t, t0 + 0.2, 0.5)
    ti = we(k, 'inside', d=-0.2); ur = ua(t, ti, 0.9)
    if ur > 0:                                           # the ring closes round the EMT on "inside"
        c.drawCircle(cx, cy, R, P(COURSE, 26 * ur))
        c.drawArc(skia.Rect(cx - R, cy - R, cx + R, cy + R), -90, 360 * ur, False, SP(COURSE, 11))
        for i in range(3):
            an = t * 0.35 + i * 2 * PI / 3
            c.drawCircle(cx + R * math.cos(an), cy + R * math.sin(an), 9, P((200, 255, 240), 230 * ua(t, ti + 0.9, 0.4)))
    shadow(c, cx, cy + 162, 230, 20, a0)
    icon(emt_bust, c, cx, cy + 4, 1.02, a0, a0)
    tx(c, 'the EMS system', cx, cy + R + 84, 58, COURSE, t, we(k, 'system', d=-0.5), 'xb', 'center')
    # what the system decides
    items = (("what you're allowed to do", we(k, 'allowed', d=-0.5), 400), ('who you answer to', we(k, 'who', d=-0.1), 540))
    for s, ts, y in items:
        u = ua(t, ts, 0.35)
        if u > 0:
            arrow(c, (cx + R + 26, y + 60 if y < 450 else y + 10), (930, y + 36), COURSE, 7, ua(t, ts - 0.1, 0.45), 1.0, -0.08 if y < 450 else 0.08, 22)
            chip(c, s, 950, y, AMBER, 52, u, 0.9 + 0.1 * u + 0.05 * pulse(t, ts, 0.4))
    # the national exam
    te = we(k, 'national', d=-0.15); ue = ua(t, te, 0.4)
    icon(exam_sheet, c, 1070, 800, 0.8, ue, ue)
    tx(c, 'the national exam', 1200, 790, 56, CREAM, t, we(k, 'exam', d=-0.1), 'semi')
    tk = we(k, 'easier', d=-0.2)
    tx(c, 'much easier', 1200, 866, 56, GREEN, t, tk, 'semi')
    uk = ua(t, tk, 0.35)
    if uk > 0:
        c.drawCircle(1130, 872, 36 * (0.8 + 0.2 * uk), P((16, 22, 50), 255 * uk)); c.drawCircle(1130, 872, 31 * (0.8 + 0.2 * uk), P(GREEN, 255 * uk))
        check(c, 1129, 874, 0.62, uk, NAVY)


# ------------------------------------------------------------------ the levels chapter: one board that builds (l1 to l5)
SX, SY = 96, 930                      # where the staircase stands through the whole chapter
RX, RC = 1130, 1480                   # left edge and middle of the details column


def _sub(c, t, abbr, rest, t_ab, t_rest, a):
    """the line under the title: the short name in amber, the long name after it"""
    if a <= 0.01: return
    w1 = K.width(abbr + ',', 56, 'xb'); w2 = K.width(' ' + rest, 56, 'semi'); x = W / 2 - (w1 + w2) / 2
    text(c, abbr + ',', x, 244 + 8 * (1 - ua(t, t_ab, 0.3)), 56, AMBER, ua(t, t_ab, 0.3) * a, 'xb')
    text(c, ' ' + rest, x + w1, 244 + 8 * (1 - ua(t, t_rest, 0.3)), 56, CREAM, ua(t, t_rest, 0.35) * a, 'semi')


def _chips(c, t, rows, x=RX, size=50, col=AMBER, a=1.0):
    for s, ts, y in rows:
        u = ua(t, ts, 0.32)
        if u > 0: chip(c, s, x, y, col, size, u * a, 0.9 + 0.1 * u + 0.05 * pulse(t, ts, 0.4))


def _l1(c, t, a):
    k = 'l1'
    ti = we(k, 'includes', d=-0.2); tm = we(k, 'adds', d=-0.2)
    hw(c, 'everything below it', 1180, 520, 68, CREAM, t, ti, 0.9, a=a)
    hw(c, '+ more', 1180, 640, 84, AMBER, t, tm, 0.5, a=a)
    u = ua(t, ti - 0.2, 0.4) * a
    if u > 0: text(c, 'each level', 1180, 400, 50, INK2, u, 'semi')


def _l2(c, t, a):
    k = 'l2'; t0, c1, c2, c3 = cues(k, 3)
    hw(c, 'often first on scene', RC, 344, 62, CREAM, t, we(k, 'often', d=-0.1), 0.9, 'center', a)
    up = ua(t, we(k, 'police', d=-0.25), 0.4); uf = ua(t, we(k, 'firefighters', d=-0.25), 0.4)
    icon(badge, c, 1320, 468, 0.74, up * a, up); icon(helmet, c, 1640, 474, 0.8, uf * a, uf)
    tb = we(k, 'basic', d=-0.2)
    tx(c, 'basic care', RX + 4, 616, 46, INK2, t, tb, 'semi', a=a)
    ta = we(k, 'a', 0, c3 + 12, -0.2)                     # "A E D"
    _chips(c, t, (('open the airway', we(k, 'opening', d=-0.2), 636), ('stop heavy bleeding', we(k, 'stopping', d=-0.2), 728), ('CPR + AED', we(k, 'starting', d=-0.1), 820)), a=a)
    ud = ua(t, ta, 0.4)
    icon(aed, c, 1650, 886, 0.72, ud * a, ud, shock=pulse(t, we(k, 'shock', d=-0.1), 1.1))


def _l3(c, t, a):
    k = 'l3'; t0, c1, c2, c3 = cues(k, 3)
    um = ua(t, we(k, "it's", d=-0.2), 0.45)
    icon(ambulance, c, RC, 400, 0.94, um * a, um, lights=um * (0.5 + 0.5 * math.sin(t * 5)) * (1 - ua(t, c3, 1.0)))
    tx(c, 'minimum to staff an ambulance', RC, 566, 46, CREAM, t, we(k, 'minimum', d=-0.15), 'semi', 'center', a=a)
    to = we(k, 'oxygen', d=-0.2)
    _chips(c, t, (('assess', we(k, 'assesses', d=-0.2), 606), ('oxygen', to, 698), ('a short list of medications', we(k, 'short', d=-0.2), 790), ('transport', we(k, 'transports', d=-0.2), 882)), a=a)
    uo = ua(t, to, 0.4)
    icon(oxygen, c, 1640, 694, 0.92, uo * a, uo)


def _l4(c, t, a):
    k = 'l4'; t0, c1, c2, c3 = cues(k, 3)
    # cue 2: the idea, big, then it makes room for the skills
    a2 = a * (1 - ua(t, c3 - 0.5, 0.4))
    if a2 > 0.01:
        tx(c, 'everything an EMT does', RC, 470, 56, CREAM, t, we(k, 'everything', d=-0.3), 'semi', 'center', a=a2)
        tp = we(k, 'adds', d=-0.2); u = ua(t, tp, 0.3)
        text(c, '+', RC, 610 - 12 * pulse(t, tp, 0.45), 130, AMBER, u * a2, 'xb', 'center')
        hw(c, 'a few advanced skills', RC, 720, 66, AMBER, t, we(k, 'few', d=-0.2), 0.8, 'center', a2)
    # cue 3: IV into a vein, IO into a bone
    tiv = we(k, 'i', 0, c3, -0.25); tio = we(k, 'i', 1, c3, -0.25); tfl = we(k, 'fluids', d=-0.2)
    fl = ua(t, tfl, 0.5)
    ui = ua(t, tiv, 0.45); uo = ua(t, tio, 0.45)
    icon(arm_iv, c, 1305, 468, 0.88, ui * a, ui, t=t, flow=fl); icon(shin_io, c, 1660, 468, 0.88, uo * a, uo, t=t, flow=fl)
    for s1, s2, x, ts in (('IV', ' = vein', 1305, we(k, 'vein', d=-0.3)), ('IO', ' = bone', 1660, we(k, 'bone', d=-0.3))):
        u = ua(t, ts, 0.3) * a
        if u > 0:
            w1 = K.width(s1, 52, 'xb'); w2 = K.width(s2, 52, 'xb'); x0 = x - (w1 + w2) / 2
            text(c, s1, x0, 624, 52, AMBER, u, 'xb'); text(c, s2, x0 + w1, 624, 52, CREAM, u, 'xb')
    tpl = we(k, 'place', d=-0.2); ud = ua(t, tpl, 0.45)
    icon(airway, c, RC - 70, 700, 0.8, ud * a, ud)
    tmo = we(k, 'several', d=-0.1)
    _chips(c, t, (('advanced airway devices', we(k, 'advanced', 0, tpl, -0.15), 758), ('more medications', tmo, 850)), a=a)
    vials(c, 1650, 890, 4, ua(t, tmo + 0.2, 0.9), 52, 0.95, 3, a)


def _l5(c, t, a):
    k = 'l5'; t0, c1, c2, c3 = cues(k, 3)
    tl_ = we(k, 'like', d=-0.3)
    a2 = a * (1 - ua(t, tl_ - 0.1, 0.4))
    if a2 > 0.01:
        tx(c, 'all the skills of', RC, 440, 56, CREAM, t, we(k, 'all', d=-0.25), 'semi', 'center', a=a2)
        te = we(k, 'e', 0, c2, -0.15); tad = we(k, 'advanced', d=-0.15)
        w1 = K.width('EMT', 54, 'xb') + 44; w2 = K.width('advanced EMT', 54, 'xb') + 44; x0 = RC - (w1 + 24 + w2) / 2
        _chips(c, t, (('EMT', te, 490),), x0, 54, COURSE, a2); _chips(c, t, (('advanced EMT', tad, 490),), x0 + w1 + 24, 54, COURSE, a2)
        tp = we(k, 'top', 1, d=-0.15); u = ua(t, tp, 0.3)
        text(c, '+', RC, 700 - 12 * pulse(t, tp, 0.45), 130, AMBER, u * a2, 'xb', 'center')
        hw(c, 'advanced assessment', RC, 800, 62, AMBER, t, we(k, 'advanced', 1, d=-0.2), 0.8, 'center', a2)
    # the heart tracing, then the two lists of drugs
    um = ua(t, tl_ + 0.25, 0.45) * a; ttr = we(k, 'tracing', d=-0.2)
    ecg_monitor(c, RX, 320, 1830, 590, um, min(1.0, max(0.0, (t - ttr) / 2.0)), t - ttr)
    tch = we(k, 'choosing', d=-0.2); tlg = we(k, 'longer', d=-0.25)
    ua_ = ua(t, tch, 0.35) * a; ub = ua(t, tlg, 0.35) * a
    text(c, 'EMT', RX + 4, 706, 44, INK2, ua_, 'xb'); vials(c, 1410, 690, 3, ua(t, tch + 0.1, 0.6), 44.5, 1.0, 0, a)
    text(c, 'Paramedic', RX + 4, 846, 44, AMBER, ub, 'xb'); vials(c, 1410, 830, 10, ua(t, tlg + 0.05, 1.3), 44.5, 1.0, 0, a)
    if ub > 0.01:
        ul = ua(t, tlg + 0.5, 0.8); c.drawLine(1390, 906, 1390 + 438 * ul, 906, SP(AMBER, 6, 255 * ub))


LEVELS = ('l2', 'l3', 'l4', 'l5')
DETAIL = dict(l1=_l1, l2=_l2, l3=_l3, l4=_l4, l5=_l5)


def levels(c, t):
    board(c, t)
    b1 = Bt['l1']; t1 = b1['t0']; q1, q2 = cue('l1', 1), cue('l1', 2)
    title(c, 'Four national levels', t, t1 - 1)
    un = ua(t, we('l1', 'four', d=-0.2), 0.5)             # underline on "four national levels"
    if un > 0: c.drawLine(W / 2 - 290, 176, W / 2 - 290 + 580 * un, 176, SP(AMBER, 6))
    # the staircase: four low slabs are counted out, then they rise into steps
    tr = we('l1', 'includes', d=-0.5)
    sa = [ua(t, q1 + 0.5 + 0.3 * i, 0.4) for i in range(4)]
    grow = [ua(t, tr + 0.75 * i, 0.9) for i in range(4)]
    ts_ = we('l1', 'four', 1, d=-0.2)                     # "four steps on a staircase": a light runs up the steps
    hi = {i: pulse(t, ts_ + 0.22 * i, 0.7) for i in range(4)}; lit = {i: 0.0 for i in range(4)}; done = {}; lab = [0.0] * 4
    start = [we('l2', 'first', d=-0.15), we('l3', 'second', d=-0.15), we('l4', 'third', d=-0.15), we('l5', 'top', d=-0.15)]
    names = [we('l2', 'e', 0, we('l2', 'or'), -0.1), we('l3', 'e', 0, we('l3', 'technician'), -0.1), we('l4', 'a', 0, we('l4', 'or'), -0.1), we('l5', 'paramedic', d=-0.1)]
    for i in range(4):
        nxt = start[i + 1] if i < 3 else None
        on = ua(t, start[i], 0.45); off = ua(t, nxt - 0.3, 0.5) if nxt else 0.0
        lit[i] = max(lit[i], on * (1 - off)); done[i] = off
        lab[i] = ua(t, names[i], 0.3)
    if t > Bt['l4']['t0']:                                # l4: "everything that an EMT does": the lower steps answer
        te = we('l4', 'everything', d=-0.2)
        for i in (0, 1): hi[i] = max(hi[i], pulse(t, te + 0.25 * i, 0.9))
    if t > Bt['l5']['t0']:                                # l5: the three lower steps glow into the top one
        tq = [we('l5', 'all', d=-0.2), we('l5', 'e', 0, cue('l5', 2), -0.2), we('l5', 'advanced', d=-0.2)]
        for i in range(3): hi[i] = max(hi[i], pulse(t, tq[i], 1.0))
    staircase(c, SX, SY, 1.0, lit=lit, labels=lab, t=t, done=done, grow=grow, sa=sa, hi=hi)
    if t > Bt['l5']['t0']:
        tq = [we('l5', 'all', d=-0.2), we('l5', 'e', 0, cue('l5', 2), -0.2), we('l5', 'advanced', d=-0.2)]
        tx_, ty_ = step_tread(SX, SY, 1.0, 3)
        fade = 1 - ua(t, we('l5', 'like'), 0.6)
        for i in range(3):
            px, py = step_tread(SX, SY, 1.0, i)
            arrow(c, (px - 30, py - 30), (tx_ - 104 + 64 * i, ty_ - 30), COURSE, 7, ua(t, tq[i] + 0.1, 0.7), fade, -0.34 + 0.06 * i, 22)
    # the tag on the EMT step
    ty = we('l3', 'level', d=-0.2); uy = ua(t, ty, 0.3) * (1 - ua(t, Bt['l3']['t1'] + 0.3, 0.4))
    if uy > 0.01:
        px, py = step_tread(SX, SY, 1.0, 1); bob = 5 * math.sin(t * 2.2)
        tag(c, 'you', px - 10, py - 128 + bob, AMBER, uy, 50)
        c.drawPath(poly([(px - 28, py - 94 + bob), (px + 8, py - 94 + bob), (px - 10, py - 62 + bob)]), P(AMBER, 255 * uy))
    # the line under the title, and each level's details in the right column
    subs = (('EMR', 'emergency medical responder', names[0], we('l2', 'emergency', d=-0.2)), ('EMT', 'emergency medical technician', names[1], we('l3', 'emergency', d=-0.2)),
            ('AEMT', 'advanced EMT', names[2], we('l4', 'advanced', d=-0.2)), ('Paramedic', 'highest of the four levels', names[3], we('l5', 'highest', d=-0.2)))
    keys = ('l1',) + LEVELS
    for j, kk in enumerate(keys):
        b = Bt[kk]; end = max(b['t1'] + 0.15, Bt[keys[j + 1]]['t0'] - 0.5) if j < 4 else b['t1'] + 60
        if t < b['t0'] - 0.5 or t > end + 0.5: continue
        a = 1 - ua(t, end, 0.3)
        if a <= 0.01: continue
        if j > 0: _sub(c, t, *subs[j - 1], a)
        DETAIL[kk](c, t, a)


SCENES = dict(promise=promise, why=why, l1=levels, l2=levels, l3=levels, l4=levels, l5=levels)
