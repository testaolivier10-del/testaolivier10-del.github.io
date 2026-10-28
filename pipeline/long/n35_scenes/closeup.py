"""The forearm close up (g_arm.png, the same garage out of focus): his right forearm, hand on the left. Code adds the
wound, the liquids (studio liquid.py frames), the stain growing in the gauze, the tourniquet, the bandage and the time tag,
all in the flat style (two tones, rim light from the lamp, upper left)."""
import sys, math, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, col
import geo

P = geo.P
TOP = [P(400, 252), P(470, 248), P(540, 243), P(620, 235), P(700, 223), P(760, 219)]
BOT = [P(400, 360), P(460, 362), P(540, 371), P(620, 380), P(700, 387), P(760, 389)]
WOUND = np.array(P(548, 241))
TQX = geo.X(662)          # tourniquet centre: about 2.5 inches (7 cm) toward the elbow from the wound
TQX2 = geo.X(738)         # a second tourniquet, right above the first (toward the heart)
WRIST = np.array(P(398, 300))
ELBOW_X = geo.X(780)


def edge_y(pts, x):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return float(np.interp(x, xs, ys))


def arm_angle():
    return math.atan2(edge_y(TOP, 1300) - edge_y(TOP, 900), 400)


def wound(c, a=1.0, open_k=1.0):
    """A gash across the top of the forearm seen from the side: a dark notch with a red inside and a darker lip."""
    if a <= 0.01:
        return
    x, y = WOUND
    ang = math.degrees(arm_angle())
    c.save(); c.translate(x, y + 3); c.rotate(ang)
    w, h = 64, 15 * open_k
    c.drawOval(skia.Rect(-w / 2 - 6, -h / 2 - 3, w / 2 + 6, h / 2 + 7), skia.Paint(AntiAlias=True, Color=col((150, 70, 48), 255 * a)))
    c.drawOval(skia.Rect(-w / 2, -h / 2, w / 2, h / 2 + 2), skia.Paint(AntiAlias=True, Color=col((110, 10, 24), 255 * a)))
    c.drawOval(skia.Rect(-w / 2 + 10, -h / 2 + 3, w / 2 - 10, h / 2 - 2), skia.Paint(AntiAlias=True, Color=col((196, 22, 40), 255 * a)))
    c.restore()


def scrape(c, a=1.0):
    """A shallow scrape on the side of the forearm (capillary ooze): fine light red streaks."""
    if a <= 0.01:
        return
    x0, y0 = P(452, 268)
    rng = np.random.default_rng(5)
    for i in range(9):
        yy = y0 + i * 9 + rng.uniform(-2, 2)
        xx = x0 + rng.uniform(-10, 10)
        L_ = rng.uniform(120, 220)
        c.drawLine(xx, yy, xx + L_, yy - L_ * 0.05, skia.Paint(AntiAlias=True, Color=col((210, 92, 84), 200 * a), StrokeWidth=4.5,
                                                         StrokeCap=skia.Paint.kRound_Cap))


@functools.lru_cache(maxsize=None)
def layer(name):
    return K.plate_img(name)


def stain_path(cx, cy, r, seed=3):
    rng = np.random.default_rng(seed)
    ph = rng.uniform(0, 6.28, 4); amp = rng.uniform(0.05, 0.14, 4)
    p = skia.Path()
    for i in range(73):
        th = i / 72 * 2 * math.pi
        rr = r * (1 + sum(amp[k] * math.sin((k + 2) * th + ph[k]) for k in range(4)))
        x, y = cx + rr * math.cos(th) * 1.25, cy + rr * math.sin(th) * 0.8
        (p.moveTo if i == 0 else p.lineTo)(x, y)
    p.close()
    return p


GAUZE_Q = [P(474, 298), P(477, 231), P(545, 225), P(600, 232), P(597, 304), P(536, 313)]


def gauze_path(dx=0.0, dy=0.0):
    p = skia.Path()
    pts = [(x + dx, y + dy) for x, y in GAUZE_Q]
    n = len(pts)
    for i in range(n):
        a, b = np.array(pts[i]), np.array(pts[(i + 1) % n])
        m = (a + b) / 2
        if i == 0:
            p.moveTo(*m)
        else:
            p.quadTo(*a, *m)
    a = np.array(pts[0]); m = (np.array(pts[-1]) + a) / 2
    p.quadTo(*a, *((a + np.array(pts[1])) / 2))
    p.close()
    return p


def gauze_and_stain(c, stain_r, dy=0.0, lift=0.0, a=1.0):
    """A folded gauze pad on the forearm (flat, two tones, a fold line), the blood stain soaking into it."""
    c.save(); c.translate(0, dy)
    if lift:
        px, py = P(600, 300)
        c.translate(px, py); c.rotate(-lift); c.translate(-px, -py)
    gp = gauze_path()
    c.saveLayer(None, skia.Paint(Color=skia.Color(0, 0, 0, int(255 * clamp(a)))))
    c.drawPath(gp, skia.Paint(AntiAlias=True, Color=skia.Color(244, 247, 252)))
    c.save(); c.clipPath(gp, True)
    y0 = P(0, 290)[1]
    c.drawRect(skia.Rect(0, y0, 1920, 1080), skia.Paint(Color=skia.Color(214, 224, 238)))
    x0 = P(536, 0)[0]
    c.drawLine(x0, P(0, 220)[1], x0 + 6, P(0, 320)[1], skia.Paint(AntiAlias=True, Color=skia.Color(206, 216, 232), StrokeWidth=5))
    c.drawLine(P(476, 0)[0], P(0, 238)[1], P(598, 0)[0], P(0, 240)[1], skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255), StrokeWidth=6))
    if stain_r > 2:
        cx, cy = P(538, 288)
        c.drawPath(stain_path(cx, cy, stain_r * 1.06), skia.Paint(AntiAlias=True, Color=skia.Color(96, 7, 20)))
        c.drawPath(stain_path(cx, cy, stain_r), skia.Paint(AntiAlias=True, Color=skia.Color(160, 16, 32)))
        c.drawPath(stain_path(cx - 0.12 * stain_r, cy - 0.12 * stain_r, stain_r * 0.55, 9), skia.Paint(AntiAlias=True, Color=skia.Color(196, 28, 46)))
    c.restore()
    c.restore()
    c.restore()


def glove(c, dy=0.0, dx=0.0, a=1.0):
    p = skia.Paint(AntiAlias=True); p.setAlphaf(max(a, 0))
    c.drawImage(layer('l_glove.png'), dx, dy, K.SMP, p)


def beat(t, bpm=118):
    ph = (t * bpm / 60.0) % 1.0
    return math.sin(ph / 0.12 * math.pi / 2) ** 2 if ph < 0.12 else (0.5 + 0.5 * math.cos((ph - 0.12) / 0.33 * math.pi) if ph < 0.45 else 0.0)


def band_path(x, w, bulge=10.0, extra=10.0):
    """The strap around the forearm at x: left and right edges bow out (the strap wraps a cylinder)."""
    yt = edge_y(TOP, x) - extra; yb = edge_y(BOT, x) + extra
    p = skia.Path()
    p.moveTo(x - w / 2, yt)
    p.lineTo(x + w / 2, yt)
    p.quadTo(x + w / 2 + bulge, (yt + yb) / 2, x + w / 2, yb)
    p.lineTo(x - w / 2, yb)
    p.quadTo(x - w / 2 + bulge, (yt + yb) / 2, x - w / 2, yt)
    p.close()
    return p, yt, yb


def tourniquet(c, x, a=1.0, twist=1.0, tag_text=None, t=0.0, t_tag=1e9, clip=True, rod_angle=None, highlight=None):
    """Commercial windlass tourniquet on the forearm at x (side view): a wide dark strap around the limb, the windlass
    rod on top, the clip holding it, the white time tag on the strap. twist 0..1 squeezes the strap (narrower, darker)."""
    if a <= 0.01:
        return
    w = 108 - 12 * twist
    c.saveLayer(None, skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, int(255 * a))))
    path, yt, yb = band_path(x, w, extra=6 - 4 * twist)
    c.drawPath(path, skia.Paint(AntiAlias=True, Color=skia.Color(38, 41, 50)))
    # lower third in shadow, a rim light on the top left edge (lamp upper left)
    c.save(); c.clipPath(path, True)
    c.drawRect(skia.Rect(x - w, yt + (yb - yt) * 0.62, x + w, yb + 20), skia.Paint(Color=skia.Color(26, 28, 35)))
    c.drawRect(skia.Rect(x - w / 2 - 4, yt - 4, x - w / 2 + 7, yb), skia.Paint(Color=skia.Color(255, 196, 140, 120)))
    # stitched edge lines of the strap
    for yy in (yt + 10, yb - 10):
        c.drawLine(x - w / 2 + 6, yy, x + w / 2 - 6, yy, skia.Paint(AntiAlias=True, Color=skia.Color(70, 75, 90), StrokeWidth=3,
                                                                PathEffect=skia.DashPathEffect.Make([10, 7], 0)))
    c.restore()
    # time tag: a white strip on the strap, the time written on it by hand
    tx0, ty0 = x - w / 2 + 14, yt + (yb - yt) * 0.38
    tag = skia.RRect.MakeRectXY(skia.Rect(tx0, ty0, x + w / 2 - 14, ty0 + 70), 8, 8)
    c.drawRRect(tag, skia.Paint(AntiAlias=True, Color=skia.Color(240, 242, 246)))
    c.drawRect(skia.Rect(tx0, ty0 + 52, x + w / 2 - 14, ty0 + 70), skia.Paint(AntiAlias=True, Color=skia.Color(206, 212, 224)))
    if tag_text and t >= t_tag:
        K.hw(c, tag_text, x, ty0 + 44, 28, (28, 34, 52), t, t_tag, 0.9, align='center', shadow=False)
    # windlass rod on top of the strap: foreshortened as it turns (twist turns it)
    ang = rod_angle if rod_angle is not None else 0.0
    L_ = 150 * abs(math.cos(ang)) + 26
    ry = yt - 12
    rod = skia.RRect.MakeRectXY(skia.Rect(x - L_ / 2, ry - 14, x + L_ / 2, ry + 14), 13, 13)
    c.drawRRect(rod, skia.Paint(AntiAlias=True, Color=skia.Color(58, 63, 76)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - L_ / 2 + 6, ry - 11, x + L_ / 2 - 6, ry - 3), 4, 4),
                skia.Paint(AntiAlias=True, Color=skia.Color(110, 118, 136)))
    # the windlass clip (a C shaped clip on the strap that the rod snaps into)
    if clip:
        cx_ = x + 64
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx_ - 14, ry - 30, cx_ + 14, yt + 16), 6, 6),
                    skia.Paint(AntiAlias=True, Color=skia.Color(70, 78, 96)))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx_ - 8, ry - 24, cx_ + 8, yt + 8), 4, 4),
                    skia.Paint(AntiAlias=True, Color=skia.Color(44, 50, 64)))
    c.restore()
    if highlight:
        kind, ha = highlight
        if kind == 'strap':
            K.ring(c, (x, (yt + yb) / 2), (yb - yt) * 0.62, K.YELLOW, ha, 6)
        elif kind == 'rod':
            K.ring(c, (x, ry), 95, K.YELLOW, ha, 6)
        elif kind == 'clip':
            K.ring(c, (x + 64, ry), 44, K.YELLOW, ha, 6)


def bandage(c, u, a=1.0):
    """A firm roller bandage wrapped over the gauze: u 0..1 reveals the turns one by one."""
    if a <= 0.01 or u <= 0:
        return
    x0, x1 = geo.X(462), geo.X(600)
    n = 5
    for i in range(n):
        k = clamp(u * n - i)
        if k <= 0:
            continue
        xa = lerp(x0, x1, i / n) - 6; xb = lerp(x0, x1, (i + 1) / n) + 16
        yt0, yt1 = edge_y(TOP, xa) - 8, edge_y(TOP, xb) - 8
        yb0, yb1 = edge_y(BOT, xa) + 8, edge_y(BOT, xb) + 8
        # each turn crosses the arm on a slant
        p = skia.Path()
        p.moveTo(xa + 26, yt0); p.lineTo(xb + 26, yt1)
        p.lineTo(lerp(xb - 10, xb + 26, 1 - k), lerp(yt1, yb1, k)); p.lineTo(lerp(xa - 10, xa + 26, 1 - k), lerp(yt0, yb0, k))
        p.close()
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=col((246, 238, 222), 255 * a)))
        c.save(); c.clipPath(p, True)
        c.drawRect(skia.Rect(xa - 40, lerp(yt0, yb0, 0.62), xb + 40, yb1 + 20), skia.Paint(Color=col((218, 204, 180), 255 * a)))
        c.drawLine(xb + 26, yt1, xb - 10, yb1, skia.Paint(AntiAlias=True, Color=col((196, 180, 152), 255 * a), StrokeWidth=4))
        c.restore()


def pulse_ring(c, t, a=1.0, alive=1.0, bpm=110):
    """The distal pulse at the wrist (thumb side): rings that beat with the heart while alive > 0."""
    if a <= 0.01:
        return
    p = np.array(P(415, 262))
    if alive > 0.02:
        ph = (t * bpm / 60.0) % 1.0
        K.ring(c, p, 26 + 46 * ph, K.TEAL, a * alive * (1 - ph), 6)
        K.glow(c, p, 46 * (1 + 0.3 * beat(t, bpm)), K.TEAL, a * alive * 0.6)
    K.ring(c, p, 22, K.TEAL if alive > 0.5 else K.INK, a, 5)
