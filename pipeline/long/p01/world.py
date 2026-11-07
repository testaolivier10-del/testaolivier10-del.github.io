"""The school track at golden hour, built in code from the Gemini reference ref/track.png (layout, palette and light only;
nothing traced). Pure side view: the straight runs left to right across the frame, so the camera can follow a runner and
every layer scrolls with its own parallax. World x is in pixels along the track at zoom 1 (PXM pixels per meter): the start
gate is at x = 0 and the finish gate at x = 100 m. Scene life: the sun glows and breathes, clouds drift, tree crowns sway,
the fence and poles scroll with depth, grass tufts and lane ticks pass under a runner."""
import math
import numpy as np
import skia
from kit import C, P, SP, sm, W, H, blur, text, CREAM, AMBER

PXM = 312.0                    # pixels per meter at zoom 1 (a 1.75 m teen is about 546 px)
FINISH = 100 * PXM
GROUND = 868                   # feet of the people in the running lane
SKY0, SKY1, SKY2 = (243, 190, 150), (252, 214, 168), (255, 232, 186)
TREE_F, TREE_M, TREE_N = (168, 186, 178), (128, 160, 160), (92, 132, 136)
RIMC = (232, 206, 150)
TRACK, TRACK_D, TRACK_L = (198, 92, 70), (170, 74, 58), (214, 112, 86)
GRASS, GRASS_D, GRASS_L = (104, 152, 78), (86, 132, 66), (128, 172, 92)
METAL, METAL_D, METAL_L = (172, 178, 188), (128, 134, 148), (214, 218, 226)
LASER = (255, 52, 52)


def rr(x0, y0, x1, y1, r):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def _blob(c, x, y, r, col, a=255, rim=None, rng=None, t=0.0, sway=0.0):
    """a tree crown: overlapping circles, a lit rim on the sun side (right)"""
    rs = np.random.default_rng(int(abs(x) * 7 + y) % 9999)
    pts = [(x + rs.uniform(-0.9, 0.9) * r, y + rs.uniform(-0.6, 0.5) * r, r * rs.uniform(0.45, 0.75)) for _ in range(9)]
    pts.append((x, y - 0.55 * r, r * 0.6))
    sw = sway * math.sin(t * 0.7 + x * 0.01)
    path = skia.Path()
    for px, py, pr in pts:
        path.addCircle(px + sw * (y - py) / r, py, pr)
    if rim:
        q = skia.Path(path); q.offset(5, -3)
        c.drawPath(q, P(rim, a * 0.85))
    c.drawPath(path, P(col, a))


def sky(c, t):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 700)], [C(SKY0), C(SKY1), C(SKY2)], [0, 0.6, 1])
    c.drawRect(skia.Rect(-400, -400, W + 400, 760), skia.Paint(Shader=sh))
    br = 1 + 0.04 * math.sin(t * 0.8)
    sx, sy = 1560, 560
    c.drawCircle(sx, sy, 420 * br, P((255, 236, 190), 70, MaskFilter=blur(140)))
    c.drawCircle(sx, sy, 150 * br, P((255, 244, 214), 160, MaskFilter=blur(50)))
    c.drawCircle(sx, sy, 62, P((255, 250, 230), 255))
    for k, (y, w, sp) in enumerate(((200, 520, 6), (290, 380, 9), (150, 300, 4))):
        x = (1300 + k * 600 + t * sp) % (W + 900) - 450
        c.drawRRect(rr(x, y, x + w, y + 26, 13), P((255, 238, 214), 110, MaskFilter=blur(6)))


def far_layers(c, t, camx):
    # hazy far trees (parallax 0.12) and mid trees (0.25)
    for par, col, rim, base, r0, step, a in ((0.10, TREE_F, None, 600, 120, 230, 230), (0.22, TREE_M, RIMC, 560, 150, 420, 255)):
        off = -camx * par
        k0 = int(math.floor((-off - 400) / step))
        for k in range(k0, k0 + int(W / step) + 4):
            x = k * step + off + 80 * math.sin(k * 1.7)
            rs = np.random.default_rng(abs(k * 13 + int(par * 100)))
            r = r0 * rs.uniform(0.75, 1.2)
            if par > 0.2:
                c.drawLine(x, base + 20, x, base + r * 1.1, SP((84, 104, 104), 14))
            _blob(c, x, base - rs.uniform(0, 60), r, col, a, rim, t=t, sway=6 if par > 0.2 else 0)
    # a soft haze band over the tree line, warm toward the sun
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 520), skia.Point(0, 700)], [C((255, 226, 180), 0), C((255, 226, 186), 80)], [0, 1])
    c.drawRect(skia.Rect(-400, 520, W + 400, 700), skia.Paint(Shader=sh))


def poles(c, t, camx):
    par = 0.35; off = -camx * par; step = 1100
    k0 = int(math.floor((-off - 200) / step))
    for k in range(k0, k0 + 4):
        x = k * step + off + 300
        c.drawRect(skia.Rect(x - 6, 120, x + 6, 690), P(METAL_D))
        c.drawRect(skia.Rect(x - 6, 120, x - 1, 690), P(METAL_L, 180))
        c.drawRect(skia.Rect(x - 46, 108, x + 46, 116), P(METAL_D))
        for j in range(4):
            c.drawCircle(x - 36 + j * 24, 102, 11, P((246, 244, 232)))


def fence_bleachers(c, t, camx):
    par = 0.55; off = -camx * par
    # bleachers every 1500 px
    step = 1500
    k0 = int(math.floor((-off - 1000) / step))
    for k in range(k0, k0 + 4):
        x = k * step + off + 200
        for j in range(5):
            y = 640 + j * 15; x0 = x - j * 16; x1 = x + 720 + j * 10
            c.drawRect(skia.Rect(x0, y, x1, y + 6), P(METAL_L))
            c.drawRect(skia.Rect(x0, y + 6, x1, y + 9), P(METAL_D))
        for j in range(5):
            xx = x + j * 170
            c.drawLine(xx, 640, xx - 40, 716, SP(METAL_D, 4))
    # chain link fence from 610 to 712
    c.drawRect(skia.Rect(-10, 606, W + 10, 610), P(METAL))
    p = skia.Path()
    s0 = off % 28
    for k in range(-2, int(W / 28) + 3):
        x = k * 28 + s0
        p.moveTo(x, 610); p.lineTo(x + 100, 712)
        p.moveTo(x + 100, 610); p.lineTo(x, 712)
    c.drawPath(p, SP((150, 156, 160), 1.6, 90))
    s1 = off % 240
    for k in range(-1, int(W / 240) + 2):
        x = k * 240 + s1
        c.drawRect(skia.Rect(x - 3, 600, x + 3, 714), P(METAL_D))


def ground(c, t, camx):
    # grass strip behind the track, the track, the infield in front
    c.drawRect(skia.Rect(-400, 708, W + 400, 760), P(GRASS_D))
    c.drawRect(skia.Rect(-400, 756, W + 400, 920), P(TRACK))
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 756), skia.Point(0, 920)], [C(TRACK_D), C(TRACK), C(TRACK_L)], [0, 0.5, 1])
    c.drawRect(skia.Rect(-400, 756, W + 400, 920), skia.Paint(Shader=sh))
    for y, w in ((770, 3), (800, 3.5), (838, 4), (884, 5)):
        c.drawLine(-400, y, W + 400, y, SP((246, 236, 226), w, 210))
    # lane ticks every meter and a few rubber specks, scrolling at ground speed
    off = -camx
    s0 = off % PXM
    for k in range(-1, int(W / PXM) + 2):
        x = k * PXM + s0
        c.drawLine(x, 884, x - 10, 902, SP((246, 236, 226), 4, 150))
    rs = np.random.default_rng(3)
    xs = rs.uniform(0, 3000, 120); ys = rs.uniform(760, 918, 120)
    for x, y in zip(xs, ys):
        X = (x + off) % 3000 - 500
        if -20 < X < W + 20:
            c.drawCircle(X, y, 2.2, P(TRACK_D, 160))
    c.drawRect(skia.Rect(-400, 918, W + 400, H + 400), P(GRASS))
    # mowing stripes and tufts in front (parallax 1.25)
    off2 = -camx * 1.25
    s2 = off2 % 360
    for k in range(-2, int(W / 360) + 3):
        x = k * 360 + s2
        q = skia.Path(); q.moveTo(x, 918); q.lineTo(x + 180, 918); q.lineTo(x + 120, H + 10); q.lineTo(x - 60, H + 10); q.close()
        c.drawPath(q, P(GRASS_L, 70))
    rs = np.random.default_rng(9)
    for k in range(40):
        x0 = rs.uniform(0, 2600); y = rs.uniform(935, 1070)
        X = (x0 + off2) % 2600 - 340
        for j in range(3):
            c.drawLine(X + j * 6, y, X + j * 6 + 4 * math.sin(t * 2 + k + j), y - 16 - 4 * j, SP(GRASS_D, 3))


def track(c, t, camx=0.0, cast=None, front=None, props=None):
    """the whole place for camera position camx (world x at the screen centre); cast(c, sx) draws the people with
    sx(world_x) -> screen x; props likewise, drawn behind the people"""
    sx = lambda X: X - camx + W / 2
    # a slow continuous push and drift on every story shot (premium standard camera work)
    z = 1.045 + 0.03 * math.sin(2 * math.pi * t / 47.0)
    c.save(); c.translate(W / 2, 600); c.scale(z, z); c.translate(-W / 2 + 6 * math.sin(t / 9.0), -600)
    sky(c, t)
    far_layers(c, t, camx)
    poles(c, t, camx)
    fence_bleachers(c, t, camx)
    ground(c, t, camx)
    if props:
        props(c, sx)
    if cast:
        cast(c, sx)
    if front:
        front(c, sx)
    # the low sun washes everything warm from the right
    g = skia.GradientShader.MakeRadial(skia.Point(1560, 560), 1500, [C((255, 210, 150), 34), C((255, 200, 150), 0)], [0, 1])
    c.drawRect(skia.Rect(-400, -400, W + 400, H + 400), skia.Paint(Shader=g, BlendMode=skia.BlendMode.kScreen))
    c.restore()


# ------------------------------------------------------------------ props
def tripod(c, x, y, h=230, s=1.0, a=1.0):
    """a timing gate on a tripod: three legs, a post, a sensor head with a red lens; y is the ground"""
    for dx in (-60, 0, 60):
        c.drawLine(x, y - h * 0.45 * s, x + dx * s, y, SP(METAL_D, 6 * s, 255 * a))
    c.drawLine(x, y - h * 0.45 * s, x, y - h * s, SP(METAL_D, 9 * s, 255 * a))
    c.drawRRect(rr(x - 24 * s, y - h * s - 34 * s, x + 24 * s, y - h * s + 10 * s, 8 * s), P((40, 44, 56), 255 * a))
    c.drawCircle(x, y - h * s - 12 * s, 9 * s, P((255, 80, 70), 255 * a))


def gate(c, x, t, broken=0.0, a=1.0, far_y=770, near_y=916):
    """two tripods on either side of the lane and the laser beam between them; broken flashes the beam white"""
    hf, hn = 170, 236
    tripod(c, x + 70, far_y, hf, 0.8, a)
    bx0, by0 = x + 70, far_y - hf * 0.8 - 12 * 0.8
    bx1, by1 = x - 30, near_y - hn - 12
    fl = broken
    col = tuple(int(LASER[i] + (255 - LASER[i]) * fl) for i in range(3))
    c.drawLine(bx0, by0, bx1, by1, SP(col, 10, 70 * a))
    c.drawLine(bx0, by0, bx1, by1, SP(col, 3.5, 255 * a))
    if fl > 0.01:
        c.drawCircle((bx0 + bx1) / 2, (by0 + by1) / 2, 60, P((255, 220, 210), 160 * fl * a, MaskFilter=blur(24)))
    return (bx0, by0, bx1, by1)


def gate_near(c, x, a=1.0, near_y=916):
    tripod(c, x - 30, near_y, 236, 1.0, a)


def display(c, x, y, s, digits, a=1.0, glow_=0.0, pole=True):
    """the timing display on its stand: black face, red LED digits"""
    if a <= 0.01:
        return
    if pole:
        c.drawLine(x, y, x, y + 240 * s, SP(METAL_D, 10 * s, 255 * a))
    c.drawRRect(rr(x - 170 * s, y - 70 * s, x + 170 * s, y + 70 * s, 16 * s), P((30, 32, 40), 255 * a))
    c.drawRRect(rr(x - 150 * s, y - 50 * s, x + 150 * s, y + 50 * s, 8 * s), P((14, 10, 12), 255 * a))
    f = skia.Font(skia.Typeface.MakeFromFile('/usr/share/fonts/opentype/inter/Inter-Bold.otf'), 66 * s)
    w = f.measureText(digits)
    if glow_ > 0:
        c.drawString(digits, x - w / 2, y + 24 * s, f, P((255, 80, 60), 160 * a * glow_, MaskFilter=blur(10 * s)))
    c.drawString(digits, x - w / 2, y + 24 * s, f, P((255, 70, 56), 255 * a))


def wheel(c, x, y, ang, s=1.0, hand_pt=None, counter='', a=1.0):
    """a measuring wheel rolling on the ground at (x, y): spoked wheel, a handle up to the hand, a counter box"""
    r = 64 * s
    cx, cy = x, y - r
    if hand_pt is not None:
        c.drawLine(cx, cy, *hand_pt, SP((60, 64, 76), 9 * s, 255 * a))
    c.drawCircle(cx, cy, r, P((242, 200, 60), 255 * a))
    c.drawCircle(cx, cy, r - 9 * s, P((60, 62, 70), 255 * a))
    for k in range(5):
        aa = ang + k * 2 * math.pi / 5
        c.drawLine(cx, cy, cx + (r - 12 * s) * math.cos(aa), cy + (r - 12 * s) * math.sin(aa), SP((242, 200, 60), 6 * s, 255 * a))
    c.drawCircle(cx, cy, 10 * s, P((242, 200, 60), 255 * a))
    if counter and hand_pt is not None:
        mx, my = cx + (hand_pt[0] - cx) * 0.7, cy + (hand_pt[1] - cy) * 0.7
        c.drawRRect(rr(mx - 34 * s, my - 18 * s, mx + 34 * s, my + 18 * s, 6 * s), P((40, 44, 56), 255 * a))


def phone(c, x, y, s, a=1.0, ang=0.0):
    c.save(); c.translate(x, y); c.rotate(ang)
    c.drawRRect(rr(-22 * s, -40 * s, 22 * s, 40 * s, 8 * s), P((30, 32, 40), 255 * a))
    c.drawRRect(rr(-18 * s, -35 * s, 18 * s, 35 * s, 5 * s), P((120, 200, 255), 255 * a))
    c.restore()


def camera(c, z, fx, fy, ox=W / 2, oy=H / 2):
    """zoom z about screen point (fx, fy), which lands at (ox, oy)"""
    c.translate(ox, oy); c.scale(z, z); c.translate(-fx, -fy)



def finish(c, t, dark=False, vig=0.14, grain=True):
    """film finish (premium standard 0a): soft bloom on highlights is approximated by the additive light already drawn;
    here a gentle warm grade, a light vignette and fine moving grain"""
    c.drawRect(skia.Rect(0, 0, W, H), P((255, 200, 150), 10, BlendMode=skia.BlendMode.kSoftLight))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * 0.7, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((6, 8, 20), int(255 * vig * 1.6))], [0, 0.55, 1])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    if grain:
        grain_layer(c, t)


_GR = None


def grain_layer(c, t):
    global _GR
    if _GR is None:
        rs = np.random.default_rng(7)
        _GR = []
        for k in range(6):
            a = (rs.normal(128, 40, (H // 2, W // 2))).clip(0, 255).astype(np.uint8)
            rgba = np.dstack([a, a, a, np.full_like(a, 9)])
            _GR.append(skia.Image.fromarray(np.ascontiguousarray(rgba), colorType=skia.kRGBA_8888_ColorType))
    img = _GR[int(t * 24) % len(_GR)]
    c.drawImageRect(img, skia.Rect(0, 0, W, H), skia.SamplingOptions(), skia.Paint(BlendMode=skia.BlendMode.kOverlay))
