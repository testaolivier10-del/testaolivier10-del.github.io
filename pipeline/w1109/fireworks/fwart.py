"""Fireworks Short: the art. Night lake, the firework engine with reflections, the atom and energy level diagrams,
the workbench hands shot, the night background for face shots. House flat layered style, all code."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/fw']
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, lgrad
from art import shaded, diffp, tube, op, glow, text, tag, SCREEN, PLUS
import hands as H
import layout as L

HZ = 1180                                                   # horizon
RED, GREEN, YELLOW, BLUE, GOLDW = (255, 70, 80), (90, 240, 130), (255, 214, 70), (70, 150, 255), (255, 226, 170)
_R = np.random.default_rng(21)
STARS = [(_R.uniform(0, 1080), _R.uniform(0, HZ - 120), _R.uniform(0.8, 2.6), _R.uniform(0, 6.28)) for _ in range(150)]
TOWN = [(_R.uniform(60, 1020), _R.uniform(0, 6.28), _R.integers(0, 3)) for _ in range(34)]
FLIES = [(_R.uniform(0, 1080), _R.uniform(1250, 1800), _R.uniform(0, 6.28), _R.uniform(0.4, 1.0)) for _ in range(16)]


def sky(c, t, tint=None, ta=0.0):
    lgrad(c, skia.Rect(-400, -900, 1480, HZ), -300, HZ, [(3, 4, 18), (8, 12, 44), (22, 28, 80), (54, 48, 104)], [0, 0.45, 0.82, 1])
    if tint is not None and ta > 0: c.drawRect(skia.Rect(-400, -900, 1480, HZ), skia.Paint(Color=C(tint, min(78, 50 * ta)), BlendMode=SCREEN))
    for x, y, r, ph in STARS:
        a = 110 + 120 * (0.5 + 0.5 * math.sin(t * 1.3 + ph))
        c.drawCircle(x, y, r, P((230, 236, 255), a * (1 - 0.6 * ta)))
    # far ridges, hazier with distance
    for k, (col, base, amp) in enumerate((((44, 46, 104), HZ - 70, 46), ((26, 28, 74), HZ - 30, 34))):
        pts = [(-400, HZ)] + [(x, base - amp * (0.5 + 0.5 * math.sin(x * 0.006 + k * 2.1) * math.cos(x * 0.0023 + k))) for x in range(-400, 1500, 60)] + [(1480, HZ)]
        c.drawPath(poly(pts), P(col))
    for x, ph, k in TOWN:                                   # lights of a town on the far shore
        a = 150 + 90 * math.sin(t * 2.0 + ph)
        c.drawCircle(x, HZ - 10 - (x * 7) % 14, 2.6, P([(255, 214, 150), (255, 240, 220), (255, 170, 120)][k], a))


def water(c, t, tint=None, ta=0.0):
    lgrad(c, skia.Rect(-400, HZ, 1480, 2400), HZ, 1920, [(44, 44, 104), (16, 20, 60), (6, 8, 28)], [0, 0.3, 1])
    if tint is not None and ta > 0:
        sh = skia.GradientShader.MakeLinear([skia.Point(0, HZ), skia.Point(0, 1700)], [C(tint, min(150, 100 * ta)), C(tint, 0)])
        c.drawRect(skia.Rect(-400, HZ, 1480, 1700), skia.Paint(Shader=sh, BlendMode=SCREEN))
    for x, ph, k in TOWN:
        a = 60 + 40 * math.sin(t * 2.0 + ph)
        c.drawRect(skia.Rect(x - 2, HZ + 4, x + 2, HZ + 60 + 20 * math.sin(t + ph)), skia.Paint(Color=C((255, 214, 150), a), MaskFilter=blur(2)))
    for k in range(46):                                     # ripples catching the light
        y = HZ + 14 + k * k * 0.42 + 6; x0 = (k * 173.3 + 40 * math.sin(t * 0.5 + k)) % 1500 - 200; w = 60 + k * 5
        a = 26 + 22 * math.sin(t * 1.4 + k * 1.7)
        col = mix((150, 160, 230), tint, min(1.0, 0.7 * ta)) if tint is not None else (150, 160, 230)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y, x0 + w, y + 2.4 + k * 0.05), 2, 2), P(col, max(0, a)))


def dock(c, t, glowcol=None, ga=0.0):
    """the dock she stands on, running from the bottom toward the lake, with a rack of mortar tubes"""
    top = [(250, 1560), (900, 1560)]; bot = [(-140, 1960), (1220, 1960)]
    c.drawPath(poly([top[0], top[1], bot[1], bot[0]]), P((70, 52, 60)))
    for k in range(9):
        u0 = k / 9.0
        xa = lerp(top[0][0], top[1][0], u0); xb = lerp(bot[0][0], bot[1][0], u0)
        c.drawLine(xa, 1560, xb, 1960, SP((40, 30, 44), 4))
    c.drawPath(poly([top[0], top[1], (900, 1574), (250, 1574)]), P((120, 96, 100)))
    for px in (270, 880):                                   # posts
        c.drawRect(skia.Rect(px - 14, 1500, px + 14, 1700), P((54, 40, 52))); c.drawRect(skia.Rect(px - 14, 1500, px - 6, 1700), P((110, 90, 100)))
    for i, x in enumerate((700, 760, 820)):                 # mortar tubes
        tb = skia.Path(); tb.addRRect(skia.RRect.MakeRectXY(skia.Rect(x - 24, 1420, x + 24, 1580), 8, 8))
        shaded(c, tb, (64, 70, 96), (38, 42, 66), sh=(-10, 0), rimL=mix((150, 160, 210), glowcol or (150, 160, 210), min(1.0, ga)), rl=(4, 0))
        c.drawOval(skia.Rect(x - 24, 1410, x + 24, 1432), P((20, 20, 34)))
    c.drawRect(skia.Rect(670, 1540, 850, 1558), P((90, 70, 60)))
    if glowcol is not None and ga > 0:
        c.drawPath(poly([top[0], top[1], bot[1], bot[0]]), skia.Paint(Color=C(glowcol, min(110, 60 * ga)), BlendMode=SCREEN))


def reeds(c, t):
    for i in range(22):
        x = -30 + i * 18 if i < 11 else 880 + (i - 11) * 20
        h = 200 + (i * 53) % 160; sw = 16 * math.sin(t * 0.9 + i * 0.6) + 8 * math.sin(t * 2.1 + i)
        p = skia.Path(); p.moveTo(x - 5, 1930); p.quadTo(x + sw * 0.3, 1930 - h * 0.6, x + sw, 1930 - h); p.quadTo(x + sw * 0.3 + 6, 1930 - h * 0.6, x + 5, 1930); p.close()
        c.drawPath(p, P((10, 14, 34)))
        if i % 3 == 0: c.drawOval(skia.Rect(x + sw - 6, 1930 - h - 30, x + sw + 6, 1930 - h + 10), P((24, 22, 40)))


def fireflies(c, t):
    for x, y, ph, sp in FLIES:
        a = max(0.0, math.sin(t * 1.2 * sp + ph)) ** 3
        glow(c, x + 30 * math.sin(t * 0.3 * sp + ph), y + 18 * math.cos(t * 0.4 * sp + ph), 16, (220, 255, 140), 200 * a)


# ------------------------------------------------------------------------------------------------ fireworks
class Burst:
    """a shell burst with depth: an outer sphere of stars with long willow tails, a brighter inner ring, a hard white flash,
    lit smoke that lingers, and glitter that crackles as the stars die"""
    def __init__(self, t0, x, y, col, R=300, n=110, seed=0, life=2.4, col2=None, wash=None):
        self.t0, self.x, self.y, self.col, self.R, self.life, self.wash = t0, x, y, col, R, life, wash
        self.col2 = col2 or mix(col, (255, 255, 255), 0.55)
        r = np.random.default_rng(seed)
        v = r.normal(size=(n, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)
        self.d = v[:, :2] * (0.86 + 0.14 * r.random((n, 1)))
        self.ph = r.uniform(0, 6.28, n); self.z = v[:, 2]
        m = max(14, n // 4); an = np.linspace(0, 2 * np.pi, m, endpoint=False) + r.uniform(0, 1)
        self.d2 = np.c_[np.cos(an), np.sin(an)] * 0.46
        self.gl = r.uniform(-1, 1, (n, 2)); self.gt = r.uniform(0.45, 1.0, n)

    def _pos(self, d, u, grav=70.0):
        k = 1 - math.exp(-3.4 * u)
        return self.x + d[:, 0] * self.R * k, self.y + d[:, 1] * self.R * k + grav * u * u

    def pos(self, u):
        return self._pos(self.d, u)

    def _col(self, t):
        col = self.col
        if self.wash is not None:
            w0, w1 = self.wash; col = mix(col, (236, 240, 255), smooth((t - w0) / (w1 - w0)) * 0.92)
        return col

    def draw(self, c, t, flip=None):
        u = (t - self.t0)
        if u < 0 or u > self.life: return
        a = (1 - u / self.life) ** 1.25
        col = self._col(t)
        tw = 0.55 + 0.45 * np.sin(t * 24 + self.ph)
        pg = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap, BlendMode=SCREEN, MaskFilter=blur(8))
        pl = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap, BlendMode=PLUS)
        ph_ = skia.Paint(AntiAlias=True, BlendMode=PLUS, MaskFilter=blur(2.2))
        sc = self.R / 300.0
        # lit smoke where the shell broke
        if u > 0.15:
            sa = min(1.0, (u - 0.15) / 0.5) * a
            glow(c, self.x + 14 * u, self.y - 10 * u, self.R * (0.55 + 0.12 * u), mix(col, (200, 200, 220), 0.5), 46 * sa)
        # the outer sphere: long tails that droop
        segs = (0.0, 0.10, 0.24, 0.42, 0.66)
        P_ = [self.pos(max(0.0, u - s)) for s in segs]
        for i in range(len(self.ph)):
            dep = 0.62 + 0.38 * (self.z[i] * 0.5 + 0.5)
            for k in range(len(segs) - 1, 0, -1):
                fa = (1 - k / len(segs)) ** 1.6
                pl.setColor(C(col, 150 * a * dep * fa)); pl.setStrokeWidth((4.6 - k * 0.7) * sc ** 0.4)
                c.drawLine(P_[k][0][i], P_[k][1][i], P_[k - 1][0][i], P_[k - 1][1][i], pl)
            pg.setColor(C(col, 170 * a * dep)); pg.setStrokeWidth(15 * sc ** 0.4)
            c.drawLine(P_[1][0][i], P_[1][1][i], P_[0][0][i], P_[0][1][i], pg)
            ph_.setColor(C(mix(col, (255, 255, 255), 0.45), 255 * a * dep * tw[i]))
            c.drawCircle(P_[0][0][i], P_[0][1][i], (5.4 + 1.6 * tw[i]) * sc ** 0.4, ph_)          # the burning star itself
        # the inner ring, brighter and quicker
        if u < self.life * 0.7:
            a2 = (1 - u / (self.life * 0.7)) ** 1.1
            x1, y1 = self._pos(self.d2, u, 50); x0, y0 = self._pos(self.d2, max(0.0, u - 0.12), 50)
            for i in range(len(x1)):
                pg.setColor(C(self.col2, 200 * a2)); pg.setStrokeWidth(14 * sc ** 0.4); c.drawLine(x0[i], y0[i], x1[i], y1[i], pg)
                ph_.setColor(C(self.col2, 255 * a2)); c.drawCircle(x1[i], y1[i], 5.2 * sc ** 0.4, ph_)
        # glitter crackling as the stars die
        if u > self.life * 0.4:
            x1, y1 = P_[0]
            gp = skia.Paint(AntiAlias=True, BlendMode=PLUS)
            for i in range(len(self.ph)):
                on = math.sin(t * 31 + self.ph[i] * 7) > 0.72 and (u / self.life) > self.gt[i] * 0.55
                if on:
                    gx = x1[i] + self.gl[i, 0] * 26 * sc; gy = y1[i] + self.gl[i, 1] * 26 * sc
                    gp.setColor(C(mix(col, (255, 255, 255), 0.7), 235 * min(1.0, a * 2.2)))
                    c.drawCircle(gx, gy, 2.6, gp); c.drawLine(gx - 7, gy, gx + 7, gy, SP(mix(col, (255, 255, 255), 0.7), 1.6, 200 * min(1.0, a * 2.2)))
                    c.drawLine(gx, gy - 7, gx, gy + 7, SP(mix(col, (255, 255, 255), 0.7), 1.6, 200 * min(1.0, a * 2.2)))
        if u < 0.45:                                           # the flash
            f = 1 - u / 0.45
            glow(c, self.x, self.y, self.R * (0.5 + 1.0 * u), mix(col, (255, 255, 255), 0.5), 170 * f * f, PLUS)
            glow(c, self.x, self.y, self.R * 0.2, (255, 255, 255), 230 * f ** 3, PLUS)
        glow(c, self.x, self.y, self.R * 2.0, col, 60 * a)

    def light(self, t):
        u = t - self.t0
        if not (0 <= u <= self.life): return 0.0
        return max(0.0, (1 - u / self.life)) ** 1.1 * (1.0 + 0.9 * max(0.0, 1 - u / 0.4))


def trail(c, t, t0, t1, x0, y0, x1, y1, col=(255, 220, 160)):
    """the shell climbing: a wobbling spark with a tail of sparks"""
    if t < t0 or t > t1: return
    u = (t - t0) / (t1 - t0); e = 1 - (1 - u) ** 2.2
    for k in range(14):
        uu = max(0.0, e - k * 0.016); x = lerp(x0, x1, uu) + 7 * math.sin(uu * 30 + k); y = lerp(y0, y1, uu)
        c.drawCircle(x, y, 6 - k * 0.36, skia.Paint(AntiAlias=True, Color=C(col, 255 * (1 - k / 14) ** 1.5), BlendMode=PLUS, MaskFilter=blur(1.5)))
    glow(c, lerp(x0, x1, e), lerp(y0, y1, e), 60, col, 200)


def with_reflection(c, draw_fn):
    draw_fn(c)
    c.save(); c.clipRect(skia.Rect(-400, HZ, 1480, 2400))
    c.saveLayer(None, skia.Paint(Alphaf=0.62, ImageFilter=skia.ImageFilters.Blur(7, 46)))
    c.translate(0, 2 * HZ); c.scale(1, -1); draw_fn(c)
    c.restore(); c.restore()


# ------------------------------------------------------------------------------------------------ the shell she holds
def shell(c, x, y, r=46, a=0.0):
    c.save(); c.translate(x, y); c.rotate(a)
    b = skia.Path(); b.addCircle(0, 0, r)
    c.drawPath(b, P((6, 6, 20), 110, MaskFilter=blur(8)))
    shaded(c, b, (196, 170, 130), (140, 112, 96), sh=(-10, -6), rimL=(255, 236, 200), rl=(4, 4))
    c.save(); c.clipPath(b, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-r, -r * 0.24, r, r * 0.24), P(BLUE)); c.drawRect(skia.Rect(-r, -r * 0.24, r, -r * 0.12), P((150, 200, 255)))
    c.restore()
    f = skia.Path(); f.moveTo(0, -r); f.quadTo(r * 0.5, -r * 1.5, r * 0.2, -r * 1.9)
    c.drawPath(f, SP((230, 220, 200), r * 0.11))
    c.restore()


# ------------------------------------------------------------------------------------------------ the diagrams
EMB = [(_R.uniform(0, 1080), _R.uniform(0, 1920), _R.uniform(2, 6), _R.uniform(0, 6.28), _R.uniform(0.4, 1.0)) for _ in range(60)]


def ember_bg(c, t, heat=0.0):
    sh = skia.GradientShader.MakeRadial((540, 980), 1200, [C((54, 26, 60)), C((20, 14, 44)), C((8, 8, 26))], [0, 0.55, 1])
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=sh))
    if heat > 0:
        sh2 = skia.GradientShader.MakeLinear([skia.Point(0, 1500), skia.Point(0, 700)], [C((255, 120, 50), 150 * heat), C((255, 120, 50), 0)])
        c.drawRect(skia.Rect(0, 600, 1080, 1920), skia.Paint(Shader=sh2, BlendMode=SCREEN))
    for x, y, r, ph, sp in EMB:
        yy = (y - t * 60 * sp) % 1920; xx = x + 22 * math.sin(t * 0.8 * sp + ph)
        c.drawCircle(xx, yy, r, skia.Paint(AntiAlias=True, Color=C((255, 170, 90), 60 + 90 * (0.5 + 0.5 * math.sin(t * 3 * sp + ph))), BlendMode=SCREEN, MaskFilter=blur(2)))


def wave(c, x0, y0, x1, y1, col, wl, amp, u=1.0, ph=0.0, a=1.0, w=9):
    """a light wave drawn from (x0,y0) toward (x1,y1); wl = wavelength in px (short = blue, long = red)"""
    if u <= 0 or a <= 0: return
    dx, dy = x1 - x0, y1 - y0; Ln = math.hypot(dx, dy); ux, uy = dx / Ln, dy / Ln; nx, ny = -uy, ux
    p = skia.Path(); n = int(Ln * min(1.0, u) / 4)
    for i in range(n + 1):
        s = i * 4; o = amp * math.sin(2 * math.pi * s / wl - ph) * min(1.0, s / 40.0)
        x = x0 + ux * s + nx * o; y = y0 + uy * s + ny * o
        p.moveTo(x, y) if i == 0 else p.lineTo(x, y)
    for ww, bl, al in ((w * 2.6, 10, 130), (w, 0, 255)):
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=C(col, al * a), Style=skia.Paint.kStroke_Style, StrokeWidth=ww, StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join,
                                 MaskFilter=blur(bl) if bl else None, BlendMode=SCREEN if bl else skia.BlendMode.kSrcOver))


def atom(c, t, lvl=0.0, flash=0.0, cx=540, cy=930):
    """a metal atom: nucleus, a lower and a higher energy level, one electron. lvl 0 = lower level, 1 = higher."""
    R0, R1 = 150, 300
    for R, lit in ((R0, 1 - lvl), (R1, lvl)):
        c.drawCircle(cx, cy, R, skia.Paint(AntiAlias=True, Color=C((150, 170, 255), 70 + 150 * lit), Style=skia.Paint.kStroke_Style, StrokeWidth=5 + 4 * lit))
        c.drawCircle(cx, cy, R, skia.Paint(AntiAlias=True, Color=C((150, 170, 255), 90 * lit), Style=skia.Paint.kStroke_Style, StrokeWidth=22, MaskFilter=blur(12), BlendMode=SCREEN))
    glow(c, cx, cy, 150, (255, 150, 90), 160 + 60 * math.sin(t * 3))
    nuc = skia.Path(); nuc.addCircle(cx, cy, 58)
    shaded(c, nuc, (255, 140, 96), (206, 84, 80), sh=(-12, -8), rimL=(255, 214, 170), rl=(5, 5))
    for k in range(7):
        an = k * 0.9 + 0.3; rr = 26 if k else 0
        c.drawCircle(cx + rr * math.cos(an), cy + rr * math.sin(an), 15, P((255, 176, 120) if k % 2 else (236, 110, 100), 230))
    ang = t * 1.5
    R = lerp(R0, R1, lvl)
    ex, ey = cx + R * math.cos(ang), cy + R * math.sin(ang)
    for k in range(1, 9):                                   # the electron's short trail
        aa = ang - k * 0.05; c.drawCircle(cx + R * math.cos(aa), cy + R * math.sin(aa), 15 - k * 1.3, P((120, 230, 255), 120 - k * 13))
    glow(c, ex, ey, 60 + 70 * flash, (120, 230, 255), 230)
    e = skia.Path(); e.addCircle(ex, ey, 21)
    shaded(c, e, (120, 226, 255), (60, 150, 220), sh=(-5, -4), rimL=(236, 252, 255), rl=(3, 3))
    return ex, ey


def ladder(c, t, x, top, drop, u, col, wl, wu, label, la):
    """energy levels as glowing bars: the electron falls `drop` px (u 0..1) and the light it gives off leaves as a wave (wu 0..1)"""
    for y, lit in ((top, 1 - u), (top + drop, u)):
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 190, y - 6, x + 190, y + 6), 6, 6), P((150, 170, 255), 120 + 135 * lit))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 190, y - 14, x + 190, y + 14), 12, 12), skia.Paint(Color=C((150, 170, 255), 90 * lit), MaskFilter=blur(10), BlendMode=SCREEN))
    e = u * u * (3 - 2 * u) if u < 1 else 1.0
    ey = top - 34 + drop * e
    x = x - 90
    if 0 < u < 1: c.drawLine(x, top - 30, x, ey, SP((120, 230, 255), 6, 110))
    glow(c, x, ey, 64, (120, 230, 255), 220)
    el = skia.Path(); el.addCircle(x, ey, 26)
    shaded(c, el, (120, 226, 255), (60, 150, 220), sh=(-5, -4), rimL=(236, 252, 255), rl=(3, 3))
    if wu > 0:
        wave(c, x + 34, top + drop - 40, x + 34 + 150, top + drop - 40 - 420, col, wl, 26, wu, ph=t * 9, w=11)
    tag(c, label, x + 90, top + drop + 120, col, 64, min(1.0, la * 1.0) if la > 0 else 0.0, 1.0 if la > 0 else 0.0)


# ------------------------------------------------------------------------------------------------ the workbench (hands shot)
STARS_BOWL = [(_R.uniform(-78, 78), _R.uniform(-58, 58)) for _ in range(40)]


def bench(c, t):
    lgrad(c, skia.Rect(0, 0, 1080, 1920), 0, 1920, [(96, 66, 58), (70, 46, 48), (40, 26, 36)], [0, 0.6, 1])
    for k in range(9):
        y = 380 + k * 170
        c.drawLine(0, y, 1080, y + 10, SP((44, 28, 36), 5)); c.drawLine(0, y + 6, 1080, y + 16, SP((128, 92, 76), 2, 110))
    sh = skia.GradientShader.MakeRadial((430, 760), 900, [C((255, 206, 140), 120), C((255, 206, 140), 0)])
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=sh, BlendMode=SCREEN))                  # the work lamp


def bowl(c, x, y):
    c.drawOval(skia.Rect(x - 150, y - 100, x + 170, y + 150), P((20, 10, 20), 110, MaskFilter=blur(14)))
    o = skia.Path(); o.addOval(skia.Rect(x - 140, y - 112, x + 140, y + 112))
    shaded(c, o, (210, 214, 226), (150, 152, 176), sh=(-12, -10), rimL=(250, 250, 255), rl=(5, 5))
    c.drawOval(skia.Rect(x - 116, y - 90, x + 116, y + 92), P((60, 70, 96)))
    for i, (dx, dy) in enumerate(STARS_BOWL):
        star_pellet(c, x + dx, y + dy, 17 + (i % 3) * 2)


def star_pellet(c, x, y, r=18):
    p = skia.Path(); p.addCircle(x, y, r)
    shaded(c, p, (70, 196, 190), (36, 128, 140), sh=(-4, -3), rimL=(170, 250, 236), rl=(2.5, 2.5))


def shell_half(c, x, y, placed):
    """an open shell half seen from above: paper wall, burst charge in the middle, the copper stars packed around it"""
    c.drawCircle(x + 12, y + 18, 236, P((20, 10, 20), 120, MaskFilter=blur(16)))
    o = skia.Path(); o.addCircle(x, y, 228)
    shaded(c, o, (206, 180, 140), (150, 120, 100), sh=(-14, -10), rimL=(255, 240, 206), rl=(6, 6))
    c.drawCircle(x, y, 196, P((58, 46, 52)))
    c.drawCircle(x, y, 74, P((30, 26, 34))); c.drawCircle(x, y, 74, SP((90, 80, 90), 4))
    for k in range(26): c.drawCircle(x + 50 * math.cos(k * 2.4) * ((k * 37) % 10) / 10, y + 50 * math.sin(k * 2.4) * ((k * 53) % 10) / 10, 5, P((64, 58, 70)))
    n = 0
    for ring, cnt in ((112, 11), (160, 16)):
        for k in range(cnt):
            if n >= placed: return
            an = -math.pi / 2 + k * 2 * math.pi / cnt + (0.2 if ring == 160 else 0)
            star_pellet(c, x + ring * math.cos(an), y + ring * math.sin(an), 21); n += 1


def slot(n):
    """world position of star number n in the shell half at (430, 800)"""
    k = n; ring, cnt, off = (112, 11, 0.0) if k < 11 else (160, 16, 0.2)
    if k >= 11: k -= 11
    an = -math.pi / 2 + k * 2 * math.pi / cnt + off
    return 430 + ring * math.cos(an), 800 + ring * math.sin(an)


def pinch_hand(c, tip, ang, side, skin, shade, hi, sleeve, sleeve_sh, s=3.0, pinch=1.0, holding=True):
    """a hand seen from above whose thumb and index meet at `tip` (world). The pellet is drawn between them when holding."""
    pose = dict(curls=(lerp(0.2, 0.62, pinch), lerp(0.1, 0.34, pinch), 0.55, 0.62, 0.68), spread=0.2)
    # the index tip sits about 82 units up the hand at this curl; put the wrist so that point lands on `tip`
    ca, sa = math.cos(ang), math.sin(ang); du, dv = 80.0 * s, 16.0 * s * side
    wr = (tip[0] - du * ca + dv * sa, tip[1] - du * sa - dv * ca)
    el = (wr[0] - 520 * ca, wr[1] - 520 * sa)
    sl = tube(el, (wr[0] - 20 * ca, wr[1] - 20 * sa), 250, 160)
    c.drawPath(sl, P((20, 10, 20), 100, MaskFilter=blur(14)))
    shaded(c, sl, sleeve, sleeve_sh, sh=(-16, -10), rimL=mix(sleeve, (255, 255, 255), 0.4), rl=(6, 6))
    cuff = tube((wr[0] - 46 * ca, wr[1] - 46 * sa), (wr[0] - 8 * ca, wr[1] - 8 * sa), 170, 160)
    c.drawPath(cuff, P(mix(sleeve, (255, 255, 255), 0.2))); c.drawPath(diffp(cuff, (-8, -5)), P(sleeve_sh))
    if holding: star_pellet(c, tip[0], tip[1], 21)
    H.hand(c, wr, ang, side, s, skin=skin, shade=shade, hi=hi, nails=True, **pose)


def night_bg(c, t, key=(255, 214, 150), key_side=-1, ka=1.0):
    """behind her in the close shots: the dark shore, trees, a few far lights"""
    lgrad(c, skia.Rect(0, 0, 1080, 1920), 0, 1920, [(8, 10, 34), (20, 26, 70), (10, 12, 36)], [0, 0.55, 1])
    for x, y, r, ph in STARS[:60]: c.drawCircle(x, y * 0.8, r * 1.6, P((230, 236, 255), 90 + 60 * math.sin(t + ph), MaskFilter=blur(1.5)))
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(10, 10)))
    for i in range(12):
        x = -60 + i * 110; h = 420 + (i * 97) % 300
        c.drawPath(poly([(x - 110, 1500), (x, 1500 - h + 6 * math.sin(t * 0.7 + i)), (x + 110, 1500)]), P((8, 12, 30)))
    c.drawRect(skia.Rect(0, 1480, 1080, 1920), P((8, 12, 30)))
    c.restore()
    for i in range(10):
        ph = i * 1.7; x = (i * 211) % 1080; y = 1180 + (i * 67) % 220
        c.drawCircle(x, y, 26 + (i * 13) % 30, skia.Paint(AntiAlias=True, Color=C((255, 200, 140), 30 + 20 * math.sin(t + ph)), BlendMode=SCREEN, MaskFilter=blur(5)))
    glow(c, 540 + key_side * 600, 760, 1000, key, 110 * ka)
