"""Story beats for AP Calc AB 01: Marco's bakery at night (bakery.py), Marco on the v5 model (marco.py).
Staging: front view across the workbench; Marco stands behind it at the left of centre and looks right toward the jar.
Nobody turns or walks. Close shots are camera moves on the same set (jar, chart, face)."""
import math
import skia
import kit as K
import gr as G
import bakery as B
import marco as MC
import world as WD
from kit import P, SP, sm, W, H, text, pill, chip, arrow, label, AMBER, CORAL, TEAL, YELLOW, GREEN, CREAM, INK2, NAVY
from base import Bt, cue, fin, ua

INKC = (52, 46, 70)
BLUEPEN = (54, 92, 180)
REDPEN = (196, 64, 54)


def ww(k, w, nth=0, after=None):
    from base import wt
    try:
        return wt(k, w, nth, after)
    except KeyError:
        print('WORD MISSING', k, w, nth)
        return after if after is not None else Bt[k]['t0']


def level(h):
    """starter height (cm) at clock hour h (21 = 9 pm, 23 = 11 pm, 25 = 1 am): the old batch before the feeding, his
    rough doubling rule after it"""
    if h < 21:
        return 9.0 - 2.0 * ((21 - h) / 1.0) ** 1.2 if h > 20 else 7.0
    return 4.0 * 2 ** ((h - 21) / 4.0)


def mpose(t, look=(0.75, 0.35), smile=0.15, worry=0.0, brow=0.0, yaw=0.18, tilt=0.0, blink_ph=0.0, **kw):
    """Marco's idle: slow breathing, a little weight shift, blinks every few seconds, eyes leading the head"""
    br = 0.5 + 0.5 * math.sin(t * 1.4)
    bl = (t * 0.27 + blink_ph) % 1.0
    lid = 0.08 if bl < 0.035 else 1.0
    ps = MC.pose(breath=br, sway=-6 + 4 * math.sin(t * 0.31), lean=0.6 * math.sin(t * 0.23), look=look, smile=smile, worry=worry, brow=brow,
                 head_yaw=yaw, head_tilt=tilt + 1.2 * math.sin(t * 0.37), lid=lid)
    for k_, v in kw.items():
        setattr(ps, k_, v)
    return ps


def jar_marks(*ms):
    return tuple(ms)


def backed(c, s, x, y, size, col=CREAM, a=1.0, align='center'):
    """light text on a story scene sits on a dark backing"""
    if a <= 0.01:
        return
    w = K.width(s, size, 'semi'); x0 = x - (w / 2 if align == 'center' else 0)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 18, y - size * 1.05, x0 + w + 18, y + size * 0.45), 14, 14), P((22, 18, 40), 225 * a))
    K.text(c, s, x, y, size, col, a, 'semi', align)


def mathcard(c, toks, x, y, size, u, a=1.0, col=CREAM):
    """an opaque, content sized card with handwritten math (for story scenes)"""
    if a <= 0.01:
        return
    xl, w = G.eq(c, toks, x, y, size, 0.0, col, 0.0, 'center')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(xl - 34, y - size * 1.5, xl + w + 34, y + size * 0.8), 22, 22), P((22, 18, 40), 236 * a))
    G.eq(c, toks, x, y, size, u, col, a, 'center')


# ------------------------------------------------------------------ chart on the wall (drawn in world coordinates)
def chart_ax(h0=20, h1=23.5, ymax=10):
    x0, y0, x1, y1 = B.CHART
    return G.Ax(x0 + 34, y0 + 24, x1 - 14, y1 - 30, h0, h1, 0, ymax)


def pen_curve(c, ax, f, a, b, u, col, w=3.2):
    G.curve(c, ax, f, a, b, u, col, w, 1.0, 200, clipy=False)


def chart_ticks(c, ax, hours, labels):
    x0, y0, x1, y1 = ax.b
    c.drawLine(x0, y1, x1, y1, SP(INKC, 2.2)); c.drawLine(x0, y0, x0, y1, SP(INKC, 2.2))
    f = K.font('hand', 11)
    for h, s in zip(hours, labels):
        X = ax.X(h); c.drawLine(X, y1 - 3, X, y1 + 3, SP(INKC, 1.6)); c.drawString(s, X - f.measureText(s) / 2, y1 + 14, f, P(INKC))
    for v in (4, 8):
        Y = ax.Y(v); c.drawLine(x0 - 3, Y, x0 + 3, Y, SP(INKC, 1.6)); c.drawString(str(v), x0 - 14, Y + 4, f, P(INKC))
    c.drawString('cm', x0 - 22, y0 - 4, f, P(INKC))


# ------------------------------------------------------------------ shots
def wide(c, t, hours, dawn=0.0, ps=None, lv=None, marks=(), chart=None, push=(1.06, 1.12), fx=900, fy=520, t0=0.0, dur=14.0, heat=0.6, front=None):
    B.room(c, t, hours, dawn, ps if ps is not None else mpose(t), lv if lv is not None else level(hours), marks, chart, heat, push, fx, fy, dur, t0, front=front)


def jar_close(c, t, hours, t0, marks=(), lv=None, z=(2.5, 2.62), dur=10.0, extra=None, fx=None, ls=1.0):
    B.LS = ls
    wide(c, t, hours, 0.0, mpose(t), lv, marks, None, z, fx if fx is not None else B.JAR_X, 600, t0, dur, front=extra)


def face_close(c, t, hours, t0, ps, z=(3.0, 3.12), dur=8.0, dawn=0.0):
    wide(c, t, hours, dawn, ps, None, (), None, z, B.MX + 30, 400, t0, dur)


def chart_close(c, t, hours, t0, chart, z=(3.6, 3.7), dur=12.0):
    x0, y0, x1, y1 = B.CHART
    wide(c, t, hours, 0.0, mpose(t), None, (), chart, z, (x0 + x1) / 2 + 70, (y0 + y1) / 2 + 6, t0, dur)


def mk_fed(cm=4.0, lab='9 pm: 4 cm'):
    return (cm, lab, (40, 90, 190))


# ------------------------------------------------------------------ beats
def hook(c, t):
    k = 'hook'; t0, c1, c2, c3, c4 = [cue(k, i) for i in range(5)]
    look_jar = (0.8, 0.35)
    if t < c2 - 0.2:
        # wide: the bakery at eleven, a slow push in toward Marco and the jar
        wide(c, t, 23.0, ps=mpose(t, look_jar if t > c1 + 1.0 else (0.1, 0.0), yaw=0.18 if t > c1 + 1.0 else 0.0), marks=(), push=(1.16, 1.3), fy=440, t0=t0, dur=c2 - t0)
        a = ua(t, t0 + 0.4, 0.5) * (1 - ua(t, c2 - 0.6, 0.3))
        backed(c, '11:00 p.m.', 280, 120, 48, AMBER, a)
    elif t < c4 - 0.2:
        band = ua(t, ww(k, 'band') - 0.1, 0.4)
        ms = [mk_fed()] + ([(8.0, '8 cm: double', (196, 64, 54))] if band > 0.5 else [])
        jar_close(c, t, 23.0, c2 - 0.2, tuple(ms))
        a = ua(t, ww(k, 'doubles') - 0.2, 0.4)
        if a > 0:
            pill(c, 'his notes: doubles about every 4 hours', W / 2, 990, AMBER, 42, a)
    else:
        face_close(c, t, 23.0, c4 - 0.2, mpose(t, (0.85, 0.35), smile=0.25, yaw=0.3, tilt=-5, blink_ph=0.5))
        a = ua(t, ww(k, 'two', 0, c4), 0.4)
        backed(c, '9 pm  →  11 pm: 2 hours', 1340, 220, 46, AMBER, a)
        q = ua(t, ww(k, 'tall', 0, c4), 0.4)
        if q > 0:
            pill(c, 'how tall now?', 1360, 360, YELLOW, 54, q)
        h = ua(t, ww(k, 'halfway', 0, c4), 0.4)
        if h > 0:
            backed(c, 'halfway: 6 cm?', 1360, 520, 50, CREAM, h)
        n = ua(t, ww(k, 'quite', 0, c4) - 0.1, 0.3)
        if n > 0:
            G.strike(c, 1180, 1540, 500, n, 1.0, CORAL, 7)


def f6(c, t):
    k = 'f6'; t0, c1, c2, c3, c4 = [cue(k, i) for i in range(5)]
    # the jar on the left of frame, a timeline panel on the right (opaque, sized to its content)
    tl_u = ua(t, c1 + 0.6, 0.6)
    h = 21 + 2 * ua(t, c1 + 1.0, 3.0) if t < c4 else 21 + 2 * ua(t, ww(k, 'two', 0, c4), 1.2) * 1.0
    if t > c3 - 0.2 and t < c4:
        h = 21 + 2 * (1 - ua(t, c3, 0.8))       # slide back to the feeding: t = 0
    jar_close(c, t, 23.0, t0, (mk_fed(),), lv=level(h), z=(2.3, 2.38), dur=fin(k) - t0, fx=1790, ls=0.6)
    # screen space panel on the right
    a = ua(t, c1, 0.4)
    if a <= 0:
        return
    px0, py0, px1, py1 = 1140, 150, 1860, 760
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(px0, py0, px1, py1), 26, 26), P((22, 18, 40), 236 * a))
    K.text(c, 'input: t, hours since feeding', px0 + 40, py0 + 70, 38, CREAM, a, 'semi')
    K.text(c, 'output: s(t), the height', px0 + 40, py0 + 130, 38, AMBER, ua(t, ww(k, 'output'), 0.4), 'semi')
    ax = G.Ax(px0 + 90, py0 + 200, px1 - 50, py1 - 90, -1.2, 4.2, 0, 10)
    G.axes(c, ax, a * tl_u, (0, 1, 2, 3, 4), (4, 8), 't', 'cm', 28)
    if t > c3 - 0.2:
        sh = ua(t, c3, 0.5)
        c.save(); c.clipRect(skia.Rect(ax.X(-1.2), ax.Y(10), ax.X(0), ax.Y(0)))
        for j in range(-4, 14):
            c.drawLine(ax.X(-1.2) + j * 26, ax.Y(0), ax.X(-1.2) + j * 26 + 120, ax.Y(10), SP(CORAL, 3, 120 * sh))
        c.restore()
        K.text(c, 'before 9: no batch', ax.X(-0.6), ax.Y(9.2), 26, CORAL, sh, 'semi', 'center')
    hh = h - 21
    G.curve(c, ax, lambda x: 4 * 2 ** (x / 4) if x >= 0 else None, 0, max(0.001, hh), 1.0 if hh > 0 else 0, AMBER, 6, a * tl_u)
    G.dot(c, ax, 0, 4, True, TEAL, ua(t, c1 + 0.8, 0.3) * a, 11)
    if t > c2 - 0.2 and t < c3:
        one = ua(t, c2, 0.4)
        G.dashed(c, ax.pt(hh, 0), ax.pt(hh, 10), YELLOW, 4, one)
        G.dot(c, ax, hh, 4 * 2 ** (hh / 4), True, YELLOW, one, 12)
        K.text(c, 'one moment, ONE height', (px0 + px1) / 2, py1 - 24, 36, YELLOW, one, 'semi', 'center')
    a4 = ua(t, c4, 0.4)
    if a4 > 0:
        mathcard(c, ['s(0) = 4      s(2) = ?'], (px0 + px1) / 2, 940, 72, ua(t, c4, 0.9), a4, YELLOW)


def chart_tonight(c, t, k, cues_):
    t0, c1, c2, c3, c4 = cues_
    def draw(cv):
        ax = chart_ax(20, 23.5, 10)
        chart_ticks(cv, ax, (20, 21, 22, 23), ('8 pm', '9', '10', '11'))
        pen_curve(cv, ax, lambda h: level(h) if h < 21 else None, 20, 20.999, ua(t, c2 - 0.2, 1.0), BLUEPEN)
        G.dot(cv, ax, 21, 9, False, BLUEPEN, ua(t, ww(k, 'open') - 0.1, 0.3), 5, (252, 248, 236)) if t > c4 - 0.2 else None
        if t > c3 + 1.0:
            G.dashed(cv, ax.pt(21, 9), ax.pt(21, 4), BLUEPEN, 2, ua(t, c3 + 1.0, 0.3), 6, 5)
        G.dot(cv, ax, 21, 4, True, BLUEPEN, ua(t, c3 + 1.0, 0.3), 5)
        pen_curve(cv, ax, lambda h: level(h) if h >= 21 else None, 21, 23, ua(t, c3 + 1.4, 1.4), BLUEPEN)
    return draw


def g4(c, t):
    k = 'g4'; cs = [cue(k, i) for i in range(5)]
    t0, c1, c2, c3, c4 = cs
    if t < c3 - 0.2 or t > c3 + 3.0:
        chart_close(c, t, 23.0, t0, chart_tonight(c, t, k, cs), z=(3.5, 3.62), dur=fin(k) - t0)
        if t > c4 - 0.2:
            ax = chart_ax()
            a = ua(t, ww(k, 'open') - 0.1, 0.4)
            label(c, 'open circle: the old height, 9 cm', 1180, 300, CORAL, 40, a)
            label(c, 'filled dot: at 9 o\'clock it is 4 cm', 1180, 860, TEAL, 40, ua(t, ww(k, 'filled'), 0.4))
        a0 = ua(t, c1, 0.4) * (1 - ua(t, c3 - 0.4, 0.3))
        backed(c, 'his chart: height vs clock time', W / 2, 1010, 44, CREAM, a0)
    else:
        # the feeding, in the jar: most of the old starter goes, fresh flour and water come in
        u = ua(t, c3 + 0.2, 1.6)
        lv = 9.0 - 6.0 * sm(min(1, u * 1.6)) + 1.0 * sm(max(0, (u - 0.6) / 0.4))
        def pour(cv):
            if 0.45 < u < 0.98:
                x = B.JAR_X; top = B.JAR_BASE - 12.5 * B.PX_CM - 60
                for j in range(14):
                    yy = top + ((t * 300 + j * 37) % 200)
                    cv.drawCircle(x - 20 + (j * 13) % 40, yy, 5, P((250, 246, 236), 220))
        jar_close(c, t, 21.0, c3 - 0.2, ((9.0, 'old: 9 cm', (120, 110, 130)), mk_fed()) if u > 0.9 else ((9.0, 'old: 9 cm', (120, 110, 130)),), lv=lv, extra=pour)
        backed(c, '9:00 p.m.  the feeding', W / 2, 1000, 46, AMBER, ua(t, c3, 0.4))


def l6(c, t):
    k = 'l6'; t0, c1, c2, c3 = [cue(k, i) for i in range(4)]
    m = ua(t, c2 - 0.1, 1.6)
    def draw(cv):
        ax = chart_ax(20.5, 26.5, 10)
        chart_ticks(cv, ax, (21, 22, 23, 24, 25, 26), ('9 pm', '10', '11', '12', '1', '2'))
        pen_curve(cv, ax, lambda h: level(h) if 21 <= h <= 25 else None, 21, 25, 1.0, BLUEPEN)
        G.dot(cv, ax, 21, 4, True, BLUEPEN, 1.0, 5)
        if t > c1 - 0.2:
            sh = 2 * m
            pen_curve(cv, ax, lambda h: level(h - sh) if 21 + sh <= h <= 25 + sh else None, 21, 26.5, ua(t, c1, 0.6), REDPEN)
            G.dot(cv, ax, 21 + sh, 4, True, REDPEN, ua(t, c1, 0.4), 5)
    chart_close(c, t, 23.0, t0, draw, z=(3.4, 3.5), dur=fin(k) - t0)
    backed(c, 'fed at 9 pm', 520, 200, 44, (120, 160, 255), ua(t, t0 + 0.3, 0.4))
    backed(c, 'fed at 11 pm', 520, 290, 44, (255, 140, 120), ua(t, c1, 0.4))
    a2 = ua(t, c2 + 0.4, 0.4)
    if a2 > 0:
        pill(c, 'the whole curve slides RIGHT 2', W / 2, 980, YELLOW, 46, a2)
    a3 = ua(t, c3, 0.4)
    if a3 > 0:
        mathcard(c, ['new(t) = old(t − 2)'], 1520, 230, 64, ua(t, c3, 0.9), a3, YELLOW)


def e2(c, t):
    k = 'e2'; t0, c1, c2, c3 = [cue(k, i) for i in range(4)]
    if t < c3 - 0.2:
        # four jars on the bench in a row, one per stretch of four hours (drawn to scale on a dark card: 4, 8, 16, 32 cm)
        wide(c, t, 23.0, ps=mpose(t, (0.6, 0.6), smile=0.3), push=(1.2, 1.24), fx=700, fy=450, t0=t0, dur=c3 - t0)
        a = ua(t, c1, 0.4)
        if a <= 0:
            return
        x0, y0, x1, y1 = 1040, 110, 1880, 960
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 28, 28), P((22, 18, 40), 240 * a))
        base = 860; s = 12.5
        for i in range(4):
            u = ua(t, c1 + 0.2 + 0.5 * i, 0.5) if i else a
            if u <= 0:
                continue
            x = 1150 + i * 205; hcm = 4 * 2 ** i
            hh = hcm * s * u
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 60, base - hh, x + 60, base), 16, 16), P(B.STARTER, 255 * a))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 60, base - hh, x + 60, base), 16, 16), SP((230, 240, 250), 4, 200 * a))
            K.text(c, ['start', '4 h', '8 h', '12 h'][i], x, base + 60, 40, INK2, u, 'semi', 'center')
            K.text(c, ['1×', '2×', '4×', '8×'][i], x, base - hh - 24, 54, YELLOW, u, 'xb', 'center')
            if i:
                arrow(c, (x - 175, base - 4 * 2 ** (i - 1) * s - 64), (x - 70, base - hh + 20), AMBER, 5, u, a, -0.2)
        m = ua(t, ww(k, 'cubed'), 0.6)
        if m > 0:
            G.eq(c, ['2 · 2 · 2 = 2^{3} = 8'], 1460, 230, 70, m, CREAM, a, 'center')
            K.text(c, 'the exponent counts the doublings', 1460, 300, 36, AMBER, ua(t, ww(k, 'counts'), 0.4), 'semi', 'center')
    else:
        # the honest caveat: his rule vs how a real starter rises
        def draw(cv):
            ax = chart_ax(20.5, 27.5, 12)
            chart_ticks(cv, ax, (21, 23, 25, 27), ('9 pm', '11', '1', '3'))
            pen_curve(cv, ax, lambda h: level(h) if h >= 21 else None, 21, 27.2, ua(t, c3, 0.8), BLUEPEN)
            real = lambda h: 4 + 6.5 / (1 + math.exp(-(h - 24.6) * 1.6)) - 6.5 / (1 + math.exp(24.6 * 1.6 - 21 * 1.6 + 0)) * 0 if h >= 21 else None
            G.curve(cv, ax, lambda h: (4 + 7.0 / (1 + math.exp(-(h - 23.9) * 1.1)) - 7.0 / (1 + math.exp(2.9 * 1.1))) if h >= 21 else None, 21, 27.2, ua(t, c3 + 0.8, 1.2), REDPEN, 3, 1.0, 200, False)
        chart_close(c, t, 23.0, c3 - 0.2, draw, z=(3.3, 3.4), dur=fin(k) - c3 + 1)
        backed(c, 'his rough rule: steady doubling', 560, 180, 42, (120, 160, 255), ua(t, c3, 0.4))
        backed(c, 'a real starter: slow start, levels off near its peak', 1240, 1000, 42, (255, 140, 120), ua(t, ww(k, 'slowly') - 0.1, 0.4))


def e8(c, t):
    k = 'e8'; t0, c1, c2, c3, c4 = [cue(k, i) for i in range(5)]
    if t < c4 - 0.2:
        ms = [mk_fed()]
        if t > c3 - 0.2:
            ms.append((6.0, '6 cm?', (150, 140, 160)))
        if t > ww(k, 'five', 0, c3) - 0.1:
            ms.append((5.66, '≈ 5.7 cm', (30, 140, 90)))
        jar_close(c, t, 23.0, t0, tuple(ms), lv=level(21.0 + 2.0 * ua(t, t0 + 0.3, 3.0)), z=(2.3, 2.38), dur=c4 - t0, fx=1760, ls=0.6)
        # the working, on an opaque card on the left (the jar is on the right of frame)
        a = ua(t, c1, 0.4)
        if a > 0:
            x0, y0, x1, y1 = 1060, 150, 1860, 900
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 26, 26), P((22, 18, 40), 238 * a))
            G.eq(c, ['each 2 h: times r.   r · r = 2'], (x0 + x1) / 2, 280, 52, ua(t, c1 + 0.3, 1.4), CREAM, a, 'center')
            G.eq(c, ['r = ', ('root', '2'), ' = 2^{1/2} ≈ 1.414'], (x0 + x1) / 2, 450, 66, ua(t, c2, 1.0), YELLOW, a, 'center')
            G.eq(c, ['4 × 1.414 ≈ 5.7 cm'], (x0 + x1) / 2, 640, 70, ua(t, ww(k, 'four', 0, c3), 1.0), GREEN, a, 'center')
            hh = ua(t, ww(k, 'halfway', 0, c3), 0.4)
            if hh > 0:
                G.eq(c, ['halfway: 6 cm'], (x0 + x1) / 2, 800, 56, hh, INK2, hh, 'center')
                G.strike(c, 1300, 1620, 785, ua(t, ww(k, 'five', 0, c3), 0.4))
    else:
        face_close(c, t, 23.0, c4 - 0.2, mpose(t, (0.85, 0.45), smile=0.65, yaw=0.25, tilt=2))
        a = ua(t, ww(k, 'halfway', 0, c4), 0.4)
        if a > 0:
            pill(c, 'halfway in TIME ≠ halfway in height', 1300, 900, YELLOW, 46, a)


def end(c, t):
    k = 'end'; t0, c1, c2, c3, c4 = [cue(k, i) for i in range(5)]
    if t < c2 - 0.2:
        # 1 a.m.: the clock has moved on, the starter reaches the band, he smiles
        hrs = 23.0 + 2.0 * ua(t, t0, 1.6)
        lv = level(hrs)
        glow = ua(t, ww(k, 'band'), 0.4) * (1 - ua(t, c2 - 0.8, 0.5))
        def g_(cv):
            if glow > 0:
                cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(B.JAR_X - 130, B.JAR_BASE - 8 * B.PX_CM - 24, B.JAR_X + 130, B.JAR_BASE - 8 * B.PX_CM + 24), 16, 16), P((255, 200, 120), 160 * glow, MaskFilter=K.blur(16)))
        wide(c, t, hrs, ps=mpose(t, (0.8, 0.4), smile=0.2 + 0.7 * ua(t, ww(k, 'right'), 0.5), yaw=0.2), lv=lv, push=(1.5, 1.58), fx=1050, fy=500, t0=t0, dur=c2 - t0, front=g_)
        backed(c, '1:00 a.m.', 300, 120, 48, AMBER, ua(t, t0, 0.4))
        backed(c, 'mix the dough', 1500, 120, 44, CREAM, ua(t, ww(k, 'mixes'), 0.4))
    else:
        # morning: the window turns pink and gold, loaves on the bench, OPEN in the window. Calm for the end screen.
        dawn = ua(t, c2 - 0.2, 3.0)
        def loaves(cv):
            for i, x in enumerate((520, 680, 840)):
                cv.drawOval(skia.Rect(x - 74, 624, x + 74, 700), P((60, 30, 20), 70, MaskFilter=K.blur(8)))
                cv.drawOval(skia.Rect(x - 70, 600, x + 70, 690), P((196, 122, 64)))
                cv.drawOval(skia.Rect(x - 56, 606, x + 50, 660), P((226, 160, 92)))
                cv.drawLine(x - 30, 630, x + 26, 618, SP((246, 214, 160), 5))
            sg = skia.RRect.MakeRectXY(skia.Rect(210, 300, 420, 370), 10, 10)
            cv.drawRRect(sg, P((240, 236, 226), 255 * dawn)); cv.drawRRect(sg, SP((150, 60, 50), 4, 255 * dawn))
            f = K.font('xb', 44); cv.drawString('OPEN', 315 - f.measureText('OPEN') / 2, 352, f, P((180, 50, 40), 255 * dawn))
            cv.drawLine(260, 300, 315, 250, SP((90, 70, 60), 3, 255 * dawn)); cv.drawLine(370, 300, 315, 250, SP((90, 70, 60), 3, 255 * dawn))
        wide(c, t, 6.5, dawn, mpose(t, (0.2, 0.1), smile=0.8, yaw=0.05), lv=3.0, push=(0.86, 0.88), fx=960, fy=1080, t0=c2 - 0.2, dur=fin(k) - c2 + 2, heat=0.9, front=loaves)
        a = ua(t, c3, 0.5)
        if a > 0:
            c.drawRect(skia.Rect(0, 0, W, 250), P((16, 14, 34), 205 * a))
            K.text(c, 'levlprep.com', W / 2, 110, 76, CREAM, a, 'xb', 'center')
            K.text(c, 'free notes and practice: Functions and Exponent Rules', W / 2, 170, 36, INK2, a, 'semi', 'center')
            nx = ua(t, c4, 0.5)
            K.text(c, 'Next: can change happen at an instant?', W / 2, 222, 36, AMBER, nx, 'semi', 'center')


STORY = dict(hook=hook, f6=f6, g4=g4, l6=l6, e2=e2, e8=e8, end=end)
