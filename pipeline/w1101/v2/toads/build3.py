"""w1101-04-cane-toads, premium pass (Olivier 2026-11-02, after the bomber Short's upgrade: "same for the other shorts").
Same script, voice and shots as build.py; on top of them, video standard section 0a:
- film finish on the scene (bloom on the sun and headlights, one grade with no grey veil, a midtone lift only for the night
  road, light vignette, fine grain), final encode about 10 Mbps;
- no dips to black: inside the cane field the camera moves continuously (a push into the cane leaf, a tilt up the stalk), and
  between places an accelerating push into the subject zoom cuts into the next shot, which settles (field to the Americas map,
  the Americas to Australia, Australia to the night road);
- depth: near cane leaves sweep past out of focus in the field shots, haze in the far rows, sun rays through the cane and
  headlight beams that read as light (screen and plus blending);
- secondary motion: soft ragged dust where each toad lands, out of the crate and after the failed leap;
- the cane toad drawn closer to life: bony crests over the eyes, larger parotoid glands, horizontal pupils, warty olive brown."""
import sys, math
sys.path[:0] = ['/home/claude/toads2', '/home/claude/lp/w1101/lib']
import numpy as np, skia, cv2
import build as B0
from lpk import *
import layout as L

old = B0.old
TOAD, TOAD_SH, TOAD_DK, BELLY = (146, 118, 70), (108, 86, 50), (90, 70, 42), (226, 208, 166)
smooth_closed, flat = B0.smooth_closed, B0.flat


# ------------------------------------------------------------------ the cane toad, closer to life (same contract as old.toad)
def toad(c, x, y, s, t, hop=0.0, face=1, gulp=0.0, ooze=0.0, tongue=0.0, ph=0.0, shadow=True):
    c.save(); c.translate(x, y); c.scale(s * face, s)
    lift = 4 * hop * (1 - hop)
    br = 1 + 0.03 * math.sin(t * 5 + ph)
    if shadow: c.drawOval(skia.Rect(-46, -4, 46, 8), P((40, 30, 20), 90 * (1 - lift * 0.6), MaskFilter=blur(5)))
    c.translate(0, -lift * 90)
    c.rotate(-18 * math.sin(math.pi * hop))
    st = math.sin(math.pi * hop)
    c.drawPath(smooth_closed([(-30, -10), (-48 - 30 * st, 2 + 6 * st), (-30 - 40 * st, 8 + 10 * st), (-14, -2)]), P(TOAD_DK))
    body = smooth_closed([(-44, -14), (-38, -38), (-8, -50), (22, -46), (40, -32), (50, -17), (40, -4), (0, 2 * br), (-34, -2)])
    flat(c, body, TOAD, TOAD_SH, sh_off=(0, 9), rim=(255, 214, 140), rim_d=(0, -3), rim_a=180)
    belly = smooth_closed([(-30, -6), (0, -4), (38, -10), (42, -4), (0, 3 * br), (-30, 0)])
    c.drawPath(belly, P(BELLY))
    # dry warty skin: raised warts with a dark tip and a lighter side toward the light
    rs = np.random.default_rng(3)
    for k in range(24):
        wx, wy = rs.uniform(-38, 28), rs.uniform(-46, -14)
        r = rs.uniform(2.0, 4.2)
        c.drawCircle(wx, wy, r, P(TOAD_DK)); c.drawCircle(wx - 0.9, wy - 0.9, r * 0.45, P((196, 168, 112)))
    # the big triangular parotoid gland behind the eye (the poison), oozing white when attacked
    c.drawPath(smooth_closed([(2, -44), (14, -52), (30, -46), (26, -36), (8, -34)]), P((176, 144, 84)))
    c.drawPath(smooth_closed([(6, -42), (14, -48), (24, -44), (20, -38), (10, -37)]), P((190, 158, 96)))
    for k in range(6):
        c.drawCircle(8 + k * 3.5, -41 + (k % 2) * 3, 1.3, P((120, 96, 56)))
    if ooze > 0.01:
        for k in range(3):
            c.drawPath(smooth_closed([(10 + k * 6, -38), (14 + k * 6, -38), (13 + k * 6, -38 + 16 * ooze + k * 3), (11 + k * 6, -38 + 16 * ooze + k * 3)]), P((248, 244, 230), 255 * ooze))
            c.drawCircle(12 + k * 6, -38 + 16 * ooze + k * 3, 3, P((248, 244, 230), 255 * ooze))
    # eye with a horizontal pupil, and the bony crest arching over it toward the snout
    c.drawCircle(32, -45, 9, P((70, 56, 30)))
    c.drawCircle(33, -46, 6.8, P((206, 160, 58)))
    c.drawOval(skia.Rect(27, -48, 39, -44), P((18, 14, 10)))
    c.drawCircle(35, -49, 1.8, P((255, 250, 230)))
    crest = skia.Path(); crest.moveTo(22, -50); crest.quadTo(31, -60, 44, -50); crest.quadTo(48, -44, 50, -36)
    c.drawPath(crest, SP((84, 64, 38), 4.2))
    if tongue > 0.01:
        L_ = 70 * tongue
        c.drawLine(48, -20, 48 + L_, -26 - 10 * tongue, SP((226, 120, 130), 6))
        c.drawCircle(48 + L_, -26 - 10 * tongue, 6, P((236, 130, 140)))
    fx, fy = 36 + 12 * st, 2 + 4 * st
    arm = smooth_closed([(18, -22), (30, -20), (fx + 4, fy - 4), (fx - 6, fy), (20, -8)])
    flat(c, arm, TOAD, TOAD_SH, sh_off=(3, 0), rim=(255, 214, 140), rim_d=(-1.5, 0), rim_a=150)
    for k in range(3):
        c.drawLine(fx - 2, fy, fx + 4 + k * 6, fy + 3 - k * 0.5, SP(TOAD_SH, 4.5))
    thigh = smooth_closed([(-44, -22), (-26, -30), (-8, -16), (-14, -4), (-36, -6)])
    flat(c, thigh, TOAD, TOAD_SH, sh_off=(0, 5), rim=(255, 214, 140), rim_d=(0, -2), rim_a=170)
    kx, ky = -10 - 40 * st, -4 + 16 * st
    ax_, ay_ = -40 - 60 * st, 4 + 16 * st
    shin = smooth_closed([(-14, -10), (kx + 4, ky - 4), (ax_, ay_ - 4), (ax_ - 2, ay_ + 4), (kx - 4, ky + 6), (-22, -2)])
    flat(c, shin, TOAD, TOAD_SH, sh_off=(0, 4), rim=(255, 214, 140), rim_d=(0, -2), rim_a=150)
    foot = smooth_closed([(ax_, ay_ - 3), (ax_ + 30 - 50 * st, ay_ - 1 + 6 * st), (ax_ + 34 - 56 * st, ay_ + 5 + 6 * st), (ax_, ay_ + 6)])
    c.drawPath(foot, P(TOAD_SH))
    mp = skia.Path(); mp.moveTo(46, -20); mp.quadTo(36, -16, 24, -23)
    c.drawPath(mp, SP((80, 60, 34), 3))
    c.restore()


old.toad = toad; B0.toad = toad
SH = dict(A=0.0, B1=B0.SHOT_B1, B2=B0.SHOT_B2, C=B0.SHOT_C, D=B0.SHOT_D, E=B0.SHOT_E, F=B0.SHOT_F, G=B0.SHOT_G)
T = B0.T


# ------------------------------------------------------------------ depth and light helpers
def blur_layer(c, r):
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(r, r)))


def sun_rays(c, t, sx=900, sy=380, a=1.0):
    """warm rays fanning down through the cane from a low sun, screened on, breathing slowly"""
    for k in range(7):
        ang = math.radians(112 + k * 9 + 2 * math.sin(t * 0.3 + k))
        w = 0.035 + 0.02 * (k % 3)
        p = skia.Path(); p.moveTo(sx, sy)
        for s_ in (-w, w):
            p.lineTo(sx + 2600 * math.cos(ang + s_), sy + 2600 * math.sin(ang + s_))
        p.close()
        c.drawPath(p, P((255, 232, 170), (34 + 12 * (k % 2)) * a * (0.8 + 0.2 * math.sin(t * 0.7 + k)), MaskFilter=blur(28), BlendMode=skia.BlendMode.kScreen))


def near_leaves(c, t, a=1.0):
    """big cane leaves close to the lens, drifting across the frame edges, out of focus"""
    blur_layer(c, 16)
    for k, (x0, y0, sgn) in enumerate([(-60, 520, 1), (1140, 1240, -1), (-80, 1500, 1)]):
        sw = 30 * math.sin(t * 0.6 + k * 1.7)
        p = skia.Path(); p.moveTo(x0, y0 + sw)
        p.quadTo(x0 + sgn * 260, y0 - 160 + sw, x0 + sgn * 520, y0 - 60 + sw * 1.4)
        p.quadTo(x0 + sgn * 280, y0 - 40 + sw, x0, y0 + 60 + sw)
        p.close()
        c.drawPath(p, P((52, 84, 40), 235 * a))
    c.restore()


def haze(c, y0, y1, col=(226, 230, 214), a=110):
    lgrad(c, skia.Rect(-200, y0, 1300, y1), y0, y1, [(col[0], col[1], col[2], 0), (col[0], col[1], col[2], a), (col[0], col[1], col[2], 0)], [0, 0.55, 1])


def dust(c, x, y, k, s=1.0):
    """soft ragged dust puffed out sideways where a toad lands; k is time since landing"""
    if not (0 < k < 1.4): return
    rd = np.random.default_rng(int(x * 7 + y) % 1000)
    for j in range(9):
        side = -1 if j % 2 else 1
        sp = rd.uniform(0.4, 1.0); rr = rd.uniform(6, 13) * s
        r = (14 + 70 * ease_out_(min(1, k / 1.0)) * sp) * s
        c.drawCircle(x + side * r, y - 4 * s - 16 * k * sp * s, rr * (1 + 1.2 * k), P((196, 168, 128), 70 * max(0, 1 - k / 1.4) ** 1.6, MaskFilter=blur(5 + 4 * k)))


def ease_out_(u):
    u = max(0.0, min(1.0, u)); return 1 - (1 - u) ** 3


# ------------------------------------------------------------------ the shots, with depth, light and dust
def shot_a(c, t):
    B0.shot_a(c, t)
    sun_rays(c, t, 980, 260, 0.9)
    near_leaves(c, t)


def shot_b1(c, t):
    B0.shot_b1(c, t)
    sun_rays(c, t, 1000, 200, 0.7)


def shot_b2(c, t):
    B0.shot_b2(c, t)
    # dust where each toad lands (same schedule and positions as B0.shot_b2's leaps)
    tb = t - B0.SHOT_B2
    z = 2.05 - 0.45 * smooth(tb / 2.6)
    c.save(); c.translate(540, 1060); c.scale(z, z); c.translate(-520, -1240)
    for i in range(10):
        t0 = 0.45 + i * 0.28
        u = tb - t0 - 0.35
        if u <= 0: continue
        dirx = [1, -1, 1, -1, 1, 1, -1, 1, -1, 1][i]
        rx = 470 + dirx * [118, 112, 104, 120, 108, 114, 100, 116, 110, 106][i]
        n, hp = B0.hop_cycle(u, 0.75, 0.5, 0)
        # the first landing happens when the leap (half a cycle of air) ends
        land = 0.375
        if u > land:
            dust(c, rx + dirx * 170, 1340 + (i % 5) * 10, u - land, 0.95)
    c.restore()
    sun_rays(c, t, 980, 260, 0.8)
    near_leaves(c, t)


def shot_c(c, t):
    old.shot_b(c, t)
    tilt = -60 * smooth((t - B0.SHOT_C) / 5)
    if t < old.T['high']:
        L.chip(c, 'CANE BEETLE', 820, 560 + tilt, B0.Y, 34, smooth((t - T['high']) / 0.3), anchor=(790, 612 + tilt))
    # dust where the toad lands after its failed leap (the leap starts at high - 0.2 and lasts 1 s)
    k = t - (old.T['high'] + 0.8)
    if 0 < k < 1.4: dust(c, 470, 1320 + tilt, k, 1.9)
    sun_rays(c, t, 960, 160, 0.7)


def shot_d(c, t):
    old.shot_c(c, t)
    near_leaves(c, t, 0.8)


def shot_g(c, t):
    B0.shot_g(c, t)
    # headlight beams that read as light, from the car behind the camera, and their glow on the road
    for sgn in (-1, 1):
        p = skia.Path(); p.moveTo(540 + sgn * 120, 2000); p.lineTo(540 + sgn * 40, 960); p.lineTo(540 + sgn * 210, 960); p.lineTo(540 + sgn * 520, 2000); p.close()
        c.drawPath(p, P((255, 236, 186), 26, MaskFilter=blur(40), BlendMode=skia.BlendMode.kPlus))
    c.drawCircle(540, 1880, 520, P((255, 230, 170), 22, MaskFilter=blur(120), BlendMode=skia.BlendMode.kScreen))


SCENES = [('A', shot_a), ('B1', shot_b1), ('B2', shot_b2), ('C', shot_c), ('D', shot_d), ('E', old.shot_d1), ('F', old.shot_d2), ('G', shot_g)]
# transitions: a zoom cut (the outgoing shot pushes in faster and faster on its subject, the next shot starts close and settles)
ZOOM = {'B1': (720, 820), 'C': (560, 620), 'E': (540, 1200), 'F': (420, 980), 'G': (760, 900)}   # focus of the outgoing push
IN_FOCUS = {'B1': (540, 900), 'C': (560, 900), 'E': (420, 980), 'F': (700, 980), 'G': (540, 1150)}
PRE, POST = 0.45, 0.45


def scene(c, t):
    keys = [k for k, _ in SCENES]
    idx = max(i for i, k in enumerate(keys) if t >= SH[k])
    name, fn = SCENES[idx]
    nxt = keys[idx + 1] if idx + 1 < len(keys) else None
    c.save()
    if nxt in ZOOM and SH[nxt] - PRE < t:
        k = ((t - (SH[nxt] - PRE)) / PRE) ** 2.2
        z = 1 + 0.45 * k; fx, fy = ZOOM[nxt]
        c.translate(540, 960); c.scale(z, z); c.translate(-lerp(540, fx, k), -lerp(960, fy, k))
    elif name in IN_FOCUS and t < SH[name] + POST:
        k = 1 - (1 - (t - SH[name]) / POST) ** 2.2
        z = 1.3 - 0.3 * k; fx, fy = IN_FOCUS[name]
        c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy)
    fn(c, t)
    c.restore()


def lerp(a, b, u): return a + (b - a) * u


_GRAIN = np.random.default_rng(3)
_VIG = None


def LIFT(t):
    return 1.14 if t >= B0.SHOT_G else 1.0


def finish(img, t):
    global _VIG
    x = img[:, :, :3].astype(np.float32) / 255.0
    lum = x @ np.array([0.114, 0.587, 0.299], np.float32)
    hi = np.clip((lum - 0.72) / 0.28, 0, 1)[..., None] * x
    small = cv2.resize(hi, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bl = cv2.resize(cv2.GaussianBlur(small, (0, 0), 10), (W, H), interpolation=cv2.INTER_LINEAR)
    x = 1 - (1 - x) * (1 - 0.35 * bl)
    g = lum[..., None]
    x = g + (x - g) * 0.95
    x = np.power(np.clip(x, 0, 1), 1 / LIFT(t))
    x = 0.5 + (x - 0.5) * 1.06
    x = x * (1 + np.array([-0.02, 0.0, 0.03], np.float32) * g)
    if _VIG is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.47) / (H * 0.6)) ** 2
        _VIG = (1 - 0.14 * np.clip(d, 0, 1.4) ** 1.6)[..., None]
    x = x * _VIG
    n = cv2.resize(_GRAIN.normal(0, 0.011, (H // 2, W // 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    x = x + n * (0.5 + 0.5 * (1 - g))
    out = img.copy(); out[:, :, :3] = np.clip(x * 255 + 0.5, 0, 255).astype(np.uint8)
    return out


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    scene(c, t)
    img = finish(surf.makeImageSnapshot().toarray(), t)
    surf = skia.Surface(W, H); c = surf.getCanvas()
    c.drawImage(skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType), 0, 0)
    L.fades(c)
    L.badge(c, 'AP ENVIRONMENTAL SCIENCE')
    B0.titles(c, t)
    if t < B0.END + 0.3: L.watermark(c)
    B0.CAP.draw(c, t)
    end_line(c, t, B0.END + 0.3)
    return surf


DUR = B0.DUR
if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, '/home/claude/toads2/out3', start=lpk.START)
