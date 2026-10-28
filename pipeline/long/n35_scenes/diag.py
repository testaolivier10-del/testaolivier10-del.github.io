"""Teaching diagrams for n35, painted flat by Gemini, with the moving parts drawn in code in the same flat style:
 - long(): the forearm cut open lengthwise (g_long_clean): artery and vein as code tubes that pinch under pressure or a
   strap, red cells flowing (artery toward the hand, vein back toward the heart), a tear near the wrist, platelets, clot,
   swelling of the part below a loose strap.
 - cross(): the forearm cross section (g_cross_clean): artery and vein as code circles that flatten against the bone.
 - cavity(): the deep wound block (g_cavity): the channel, blood filling it, gauze packed in from the bottom up.
 - body(): the front view body map (g_body) with landmark points."""
import sys, math, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia, cv2
import core as K
from core import smooth, lerp, clamp, col
import geo

P = geo.P
ART = (214, 32, 44); ART_D = (150, 14, 30); ART_L = (255, 118, 104)
VEIN = (120, 18, 40); VEIN_D = (78, 8, 26); VEIN_L = (178, 70, 84)
RBC = (232, 40, 52); RBC_D = (160, 16, 32); RBC_V = (122, 16, 34)
PLT = (196, 160, 236); PLT_D = (142, 102, 196)
MUSCLE = (226, 128, 120)

# ------------------------------------------------------------------ lengthwise forearm
LX0, LX1 = geo.X(420), geo.X(892)
ART_Y, ART_R = geo.Y(271), 21.0
VEIN_Y, VEIN_R = geo.Y(292), 13.0
TEAR_X = geo.X(470)
SKIN_TOP = lambda x: float(np.interp(x, [geo.X(420), geo.X(892)], [geo.Y(243), geo.Y(214)]))
STRAP_X = geo.X(700)
WRIST_L = P(402, 262)
CAM_LONG = (geo.X(640), geo.Y(290), 1.62)


def tube(c, x0, x1, y, rfun, wall, dark, light, lumen, a=1.0, n=90):
    """A horizontal vessel whose radius at x is rfun(x): wall colour with a dark lower edge and a lit top edge."""
    xs = np.linspace(x0, x1, n)
    rs = np.array([max(rfun(x), 0.0) for x in xs])
    top = [(x, y - r) for x, r in zip(xs, rs)]; bot = [(x, y + r) for x, r in zip(xs, rs)]
    p = skia.Path(); p.moveTo(*top[0])
    for q in top[1:]:
        p.lineTo(*q)
    for q in bot[::-1]:
        p.lineTo(*q)
    p.close()
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(wall, 255 * a)))
    c.save(); c.clipPath(p, True)
    # lumen: inner 62%
    pl = skia.Path(); pl.moveTo(xs[0], y - rs[0] * 0.62)
    for x, r in zip(xs, rs):
        pl.lineTo(x, y - r * 0.62)
    for x, r in zip(xs[::-1], rs[::-1]):
        pl.lineTo(x, y + r * 0.62)
    pl.close()
    c.drawPath(pl, skia.Paint(AntiAlias=True, Color=col(lumen, 255 * a)))
    sh = skia.Path(); sh.moveTo(xs[0], y + rs[0] * 0.55)
    for x, r in zip(xs, rs):
        sh.lineTo(x, y + r * 0.55)
    for x, r in zip(xs[::-1], rs[::-1]):
        sh.lineTo(x, y + r + 2)
    sh.close()
    c.drawPath(sh, skia.Paint(AntiAlias=True, Color=col(dark, 255 * a)))
    hl = skia.Path(); hl.moveTo(xs[0], y - rs[0] - 2)
    for x, r in zip(xs, rs):
        hl.lineTo(x, y - r - 2)
    for x, r in zip(xs[::-1], rs[::-1]):
        hl.lineTo(x, y - r * 0.82)
    hl.close()
    c.drawPath(hl, skia.Paint(AntiAlias=True, Color=col(light, 255 * a)))
    c.restore()
    return p


def bump(x, x0, w):
    return math.exp(-((x - x0) / w) ** 2)


class Flow:
    """Red cells travelling along a vessel. speed(x, t) in px/s (sign = direction); positions are integrated from t0
    so they never jump; cells crowd and slow where the vessel narrows."""

    def __init__(self, x0, x1, n, seed, dark=False):
        rng = np.random.default_rng(seed)
        self.x0, self.x1 = x0, x1
        self.u = rng.uniform(0, 1, n)
        self.lane = rng.uniform(-0.55, 0.55, n)
        self.size = rng.uniform(0.75, 1.05, n)
        self.rot = rng.uniform(0, 3.1, n)
        self.dark = dark

    def draw(self, c, t, y, rfun, speed, t0=0.0, a=1.0, plt_frac=0.0, sat=1.0):
        L_ = self.x1 - self.x0
        # integrate position: x = x_start + integral of speed (speed sampled at the vessel mid point)
        if not hasattr(self, '_cache'):
            self._cache = {}
        # closed form for piecewise speeds is messy: integrate on a 1/60 grid and memo by time
        key = round(t * 60)
        if key not in self._cache:
            prev = self._cache.get(key - 1)
            if prev is None:
                pos = 0.0; tt = t0
                while tt < key / 60:
                    pos += speed(tt) / 60; tt += 1 / 60
            else:
                pos = prev + speed(key / 60) / 60
            self._cache[key] = pos
        pos = self._cache[key]
        for i, u in enumerate(self.u):
            x = self.x0 + ((u * L_ + pos) % L_)
            r = rfun(x)
            if r < 6:
                continue
            yy = y + self.lane[i] * r * 0.9
            rr = 9.5 * self.size[i] * (r / 21) ** 0.4
            is_p = (i / len(self.u)) < plt_frac
            colr = PLT if is_p else (RBC_V if self.dark else RBC)
            cd = PLT_D if is_p else RBC_D
            sc = 0.55 if is_p else 1.0
            c.save(); c.translate(x, yy); c.rotate(math.degrees(self.rot[i] + 0.3 * math.sin(t + i)))
            c.drawOval(skia.Rect(-rr * sc, -rr * 0.62 * sc, rr * sc, rr * 0.62 * sc), skia.Paint(AntiAlias=True, Color=col(cd, 255 * a)))
            c.drawOval(skia.Rect(-rr * 0.86 * sc, -rr * 0.6 * sc, rr * 0.86 * sc, rr * 0.4 * sc), skia.Paint(AntiAlias=True, Color=col(colr, 255 * a)))
            if not is_p:
                c.drawOval(skia.Rect(-rr * 0.4, -rr * 0.22, rr * 0.4, rr * 0.18), skia.Paint(AntiAlias=True, Color=col(cd, 150 * a)))
            c.restore()


class Long:
    def __init__(self, a_fn=None, v_fn=None, t0=0.0):
        self.fa = Flow(LX0, LX1, 46, 1)
        self.fv = Flow(LX0, LX1, 30, 2, dark=True)
        self.a_fn = a_fn or (lambda t: -120 * (0.55 + 0.9 * beat_(t)))
        self.v_fn = v_fn or (lambda t: 55.0)
        self.t0 = t0

    def draw(self, c, t, cam=CAM_LONG, strap=0.0, strap_on=0.0, press=0.0, press_x=None, tear=0.0, leak=0.0,
             swell=0.0, a_speed=1.0, v_speed=1.0, plt_frac=0.0, clot=0.0, clot_x=None, show_strap_narrow=False, pulse=None,
             strap_w=78.0):
        """strap: 0 loose .. 1 tight (vein shuts by 0.45, artery by 0.9); press: a hand pressing over press_x (pinches
        both, mostly); tear: the torn spot in the artery near the wrist; leak: 0..1 how much escapes there;
        swell: the part below the strap fills up (veins wider, tissue darker)."""
        K.draw_plate(c, 'g_long_clean.png', cam)
        K.push_cam(c, cam)
        sx = STRAP_X
        v_close = clamp(strap / 0.45)
        a_close = clamp((strap - 0.45) / 0.45)
        px = press_x if press_x is not None else TEAR_X + 40

        bt = beat_(t)

        def ra(x):
            r = ART_R * (1 + 0.06 * bt) * (1 - 0.92 * a_close * bump(x, sx, 30))
            if x > sx:
                r *= 1 + 0.07 * bt * a_close          # the pulse still beats up to the closed strap
            r *= (1 - 0.6 * press * bump(x, px, 70))
            if x < sx:
                r *= (1 + 0.15 * swell)
            return r

        def rv(x):
            r = VEIN_R * (1 - 0.98 * v_close * bump(x, sx, 34))
            r *= (1 - 0.75 * press * bump(x, px, 70))
            if x < sx:
                r *= (1 + 0.55 * swell)
            return r
        # swelling: the tissue below the strap darkens (blood trapped in it)
        if swell > 0.01:
            pth = skia.Path(); pth.addRect(skia.Rect(LX0, SKIN_TOP(LX0) + 18, sx - 36, geo.Y(346)))
            c.drawPath(pth, skia.Paint(AntiAlias=True, Color=skia.Color(110, 20, 60, int(70 * swell))))
        tube(c, LX0, LX1, VEIN_Y, rv, VEIN, VEIN_D, VEIN_L, (96, 12, 32))
        self.fv.draw(c, t, VEIN_Y, rv, self.v_fn, t0=self.t0)
        tube(c, LX0, LX1, ART_Y, ra, ART, ART_D, ART_L, (236, 60, 64))
        self.fa.draw(c, t, ART_Y, ra, self.a_fn, t0=self.t0, plt_frac=plt_frac)
        # the tear: a slit from the artery up through the tissue to the skin, blood escaping on every beat
        if tear > 0.01:
            y_sk = SKIN_TOP(TEAR_X)
            ch = skia.Path(); ch.moveTo(TEAR_X - 9, ART_Y - ART_R + 2); ch.lineTo(TEAR_X - 4, y_sk); ch.lineTo(TEAR_X + 6, y_sk)
            ch.lineTo(TEAR_X + 10, ART_Y - ART_R + 2); ch.close()
            c.drawPath(ch, skia.Paint(AntiAlias=True, Color=col((120, 10, 26), 255 * tear)))
            if leak > 0.01:
                b = beat_(t)
                for k in range(7):
                    ph = ((t * 1.9 + k / 7) % 1.0)
                    yy = lerp(ART_Y - ART_R, y_sk - 70 * leak * (0.6 + 0.4 * b), ph)
                    xx = TEAR_X + 6 * math.sin(k * 2.1 + t * 3)
                    rr = (7 + 5 * leak) * (1 - 0.5 * ph)
                    c.drawCircle(xx, yy, rr, skia.Paint(AntiAlias=True, Color=col(RBC, 235 * leak * (1 - ph * 0.6))))
                # blood out on the skin surface: a growing bead that runs down
                rr = 14 * leak * (0.8 + 0.3 * b)
                c.drawOval(skia.Rect(TEAR_X - rr * 1.6, y_sk - rr, TEAR_X + rr * 1.6, y_sk + rr * 0.4),
                           skia.Paint(AntiAlias=True, Color=col(RBC, 240 * leak)))
        if clot > 0.01:
            cx = clot_x if clot_x is not None else TEAR_X
            rng = np.random.default_rng(11)
            pts = rng.uniform(-1, 1, (40, 2))
            for k in range(int(40 * clot)):
                rr = 5.5 + 2.5 * abs(pts[k, 1])
                x = cx + 15 * pts[k, 0]; y = ART_Y - ART_R + 4 - 26 * clot * (0.5 + 0.5 * pts[k, 1])
                c.drawCircle(x, y, rr + 1.5, skia.Paint(AntiAlias=True, Color=col(PLT_D, 255)))
                c.drawCircle(x - 1, y - 1, rr, skia.Paint(AntiAlias=True, Color=col(PLT if k % 4 else (178, 34, 52), 255)))
            if clot > 0.5:
                mesh = skia.Paint(AntiAlias=True, Color=col((250, 236, 220), 180 * (clot - 0.5) * 2), StrokeWidth=2.2,
                                  Style=skia.Paint.kStroke_Style)
                for k in range(6):
                    c.drawLine(cx - 22 + 7 * k, ART_Y - ART_R - 20, cx - 8 + 5 * k, ART_Y - ART_R + 4, mesh)
        if strap_on > 0.01:
            w = strap_w * (0.55 if show_strap_narrow else 1.0) - 10 * strap
            yt = SKIN_TOP(sx) - 10; yb = geo.Y(352)
            p = skia.Path(); p.moveTo(sx - w / 2, yt); p.lineTo(sx + w / 2, yt)
            p.quadTo(sx + w / 2 + 10, (yt + yb) / 2, sx + w / 2, yb); p.lineTo(sx - w / 2, yb)
            p.quadTo(sx - w / 2 + 10, (yt + yb) / 2, sx - w / 2, yt); p.close()
            colr = (38, 41, 50) if not show_strap_narrow else (120, 74, 40)
            c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(colr, 235 * strap_on)))
            c.save(); c.clipPath(p, True)
            c.drawRect(skia.Rect(sx - w, yt + (yb - yt) * 0.62, sx + w, yb + 10), skia.Paint(Color=col((0, 0, 0), 60 * strap_on)))
            c.restore()
        if pulse is not None:
            alive, pa = pulse
            p0 = np.array(WRIST_L)
            ph = (t * 110 / 60.0) % 1.0
            K.ring(c, p0, 18 + 30 * ph, K.TEAL, pa * alive * (1 - ph), 5)
            K.ring(c, p0, 16, K.TEAL if alive > 0.5 else K.INK, pa, 4)
        c.restore()


def beat_(t, bpm=110):
    ph = (t * bpm / 60.0) % 1.0
    return math.sin(ph / 0.12 * math.pi / 2) ** 2 if ph < 0.12 else (0.5 + 0.5 * math.cos((ph - 0.12) / 0.33 * math.pi) if ph < 0.45 else 0.0)


# ------------------------------------------------------------------ cross section
CR_ART = (P(300, 90), 21 * geo.SC)
CR_VEINS = [(P(266, 94), 12 * geo.SC), (P(334, 94), 12 * geo.SC)]
CR_VEIN = CR_VEINS[0]
CR_BONE = P(300, 169)
CR_ULNA = P(304, 386)
CAM_CROSS = (geo.X(330), geo.Y(290), 1.0)


CROSS_FIT = (0.62, geo.X(300) + 470, geo.Y(286) - 150)


def cross_xf():
    img, (x0, y0, s) = K.plate_fit_img('g_cross_rot.png', *CROSS_FIT)
    return img, x0, y0, s


def cross_pt(p):
    _, x0, y0, s = cross_xf()
    return (x0 + p[0] * s, y0 + p[1] * s)


def cross(c, t, cam=CAM_CROSS, squash=0.0, push=0.0):
    """squash 0..1 flattens the artery and vein; push moves them down toward the bone. Drawn in frame px through
    cross_pt (the diagram is shrunk so a hand and a gauze stack fit above it)."""
    img, x0, y0, s = cross_xf()
    c.drawImage(img, 0, 0, K.SMP)
    c.save(); c.translate(x0, y0); c.scale(s, s)
    for (p, r), wall, lum, dark, light, k in ((CR_VEINS[0], VEIN, (96, 12, 32), VEIN_D, VEIN_L, 1.15), (CR_VEINS[1], VEIN, (96, 12, 32), VEIN_D, VEIN_L, 1.15),
                                              (CR_ART, ART, (236, 60, 64), ART_D, ART_L, 1.0)):
        sq = clamp(squash * k)
        pb = 1 + (0.07 if wall == ART else 0.0) * beat_(t) * (1 - sq)
        rx = r * (1 + 0.55 * sq) * pb; ry = r * (1 - 0.82 * sq) * pb
        cx, cy = p[0], p[1] + 22 * geo.SC * push * (1 if wall == ART else 0.6)
        c.drawOval(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry), skia.Paint(AntiAlias=True, Color=col(wall)))
        c.drawOval(skia.Rect(cx - rx, cy, cx + rx, cy + ry), skia.Paint(AntiAlias=True, Color=col(dark)))
        c.drawOval(skia.Rect(cx - rx * 0.92, cy - ry, cx + rx * 0.92, cy + ry * 0.6), skia.Paint(AntiAlias=True, Color=col(wall)))
        lr = 0.48 if wall == ART else 0.72
        c.drawOval(skia.Rect(cx - rx * lr, cy - ry * lr, cx + rx * lr, cy + ry * lr), skia.Paint(AntiAlias=True, Color=col(lum)))
        c.drawArc(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry), 200, 110, False,
                  skia.Paint(AntiAlias=True, Color=col(light), Style=skia.Paint.kStroke_Style, StrokeWidth=5))
    c.restore()


# ------------------------------------------------------------------ deep wound block
@functools.lru_cache(maxsize=1)
def channel_path():
    m = cv2.imread('/home/claude/lp/art/n35/m_channel.png', 0)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnt = max(cs, key=cv2.contourArea)[:, 0, :]
    p = skia.Path()
    for i, (x, y) in enumerate(cnt):
        q = P(x, y)
        (p.moveTo if i == 0 else p.lineTo)(*q)
    p.close()
    return p


CAV_TOP, CAV_BOT = geo.Y(96), geo.Y(418)
CAV_TEAR = P(512, 444)
CAM_CAV = (geo.X(512), geo.Y(290), 1.0)


def cavity(c, t, cam=CAM_CAV, blood=0.0, pack=0.0, press=0.0, laid=0.0, leak=0.0, clot=0.0):
    """blood: fraction of the channel filled with blood (from the bottom); pack: gauze packed in from the bottom up
    (0..1); laid: gauze laid only on top (a dressing); leak: blood coming out of the tear."""
    K.draw_plate(c, 'g_cavity.png', cam)
    K.push_cam(c, cam)
    ch = channel_path()
    c.drawPath(ch, skia.Paint(AntiAlias=True, Color=col((122, 34, 52)), Style=skia.Paint.kStroke_Style, StrokeWidth=7))
    c.save(); c.clipPath(ch, True)
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=col((150, 54, 70))))          # the far wall of the wound
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=col((120, 36, 54)), ImageFilter=None) if False else skia.Paint(Color=col((150, 54, 70))))
    if blood > 0.01:
        yb = lerp(CAV_BOT + 10, CAV_TOP, blood)
        wv = 6 * math.sin(t * 3)
        bp = skia.Path(); bp.moveTo(0, yb + wv); bp.lineTo(W_, yb - wv); bp.lineTo(W_, H_); bp.lineTo(0, H_); bp.close()
        c.drawPath(bp, skia.Paint(AntiAlias=True, Color=col((196, 20, 40))))
        c.drawRect(skia.Rect(0, yb + wv - 4, W_, yb + wv + 6), skia.Paint(Color=col((240, 90, 90))))
    if pack > 0.01:
        # folded gauze: zigzag layers filling the channel from the bottom up
        ytop = lerp(CAV_BOT + 12, CAV_TOP - 10, pack)
        y = CAV_BOT + 12; k = 0
        while y > ytop:
            hh = 13
            c.drawRect(skia.Rect(0, y - hh, W_, y), skia.Paint(Color=col((246, 246, 250) if k % 2 == 0 else (226, 230, 240))))
            c.drawLine(0, y - hh, W_, y - hh, skia.Paint(Color=col((206, 210, 224)), StrokeWidth=2))
            y -= hh; k += 1
        # gauze nearest the bleeding soaks red
        c.drawRect(skia.Rect(0, CAV_BOT - 40, W_, CAV_BOT + 20), skia.Paint(Color=col((190, 28, 46), 150)))
    c.restore()
    if laid > 0.01:
        x0, x1 = geo.X(455), geo.X(570); y0 = geo.Y(92)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0 - 20, x1, y0 + 6), 6, 6), skia.Paint(AntiAlias=True, Color=col((244, 246, 250), 255 * laid)))
        c.drawRect(skia.Rect(x0, y0 - 4, x1, y0 + 6), skia.Paint(Color=col((206, 212, 226), 255 * laid)))
    if clot > 0.01:
        tx, ty = CAV_TEAR
        rng = np.random.default_rng(5)
        pts = rng.uniform(-1, 1, (36, 2))
        for k in range(int(36 * clot)):
            x = tx + 18 * pts[k, 0]; y = ty - 6 - 16 * abs(pts[k, 1])
            c.drawCircle(x, y, 7, skia.Paint(AntiAlias=True, Color=col(PLT_D)))
            c.drawCircle(x - 1, y - 1, 5.5, skia.Paint(AntiAlias=True, Color=col(PLT if k % 4 else (178, 34, 52))))
    if leak > 0.01:
        b = beat_(t)
        tx, ty = CAV_TEAR
        for k in range(6):
            ph = (t * 1.6 + k / 6) % 1.0
            c.drawCircle(tx + 5 * math.sin(k + t * 2), lerp(ty, ty - 60, ph), (8 + 4 * b) * (1 - 0.5 * ph),
                         skia.Paint(AntiAlias=True, Color=col(RBC, 230 * leak * (1 - ph * 0.5))))
    c.restore()


W_, H_ = 1920, 1080

# ------------------------------------------------------------------ body map landmarks (1026 coords -> frame)
BODY = {k: P(*v) for k, v in dict(
    neck=(512, 128), chest=(512, 180), belly=(512, 238), armpit_r=(460, 219), armpit_l=(565, 219),
    groin_r=(492, 338), groin_l=(532, 338), elbow_r=(436, 262), elbow_l=(588, 262), knee_r=(483, 432), knee_l=(543, 432),
    hand_r=(400, 318), upperarm_r=(448, 172), upperarm_l=(576, 172), thigh_r=(488, 392), thigh_l=(538, 392),
    shin_l=(545, 470), foot_l=(552, 540), wrist_r=(415, 300)).items()}
CAM_BODY = (geo.X(512), geo.Y(290), 1.0)


def body(c, cam=CAM_BODY):
    K.draw_plate(c, 'g_body.png', cam)
