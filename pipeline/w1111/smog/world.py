"""w1111-02 great smog: the world. Fog and smoke (texture and sprite based), the 1950s double decker seen from the front, gas lamps,
the street in the smog, the terrace with its coal fires and chimney pots, the air above the city as a cutaway (normal night, then the warm lid).
House flat style, all drawn in code. City world coordinates = screen coordinates in the diagram view (zoom 1)."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/smog']
sys.path += ['/home/claude/short', '/home/claude/guy']
import numpy as np, skia, cv2
import person as PN
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import shaded, diffp, op
import layout as L

W, H = 1080, 1920
SCREEN, PLUS = skia.BlendMode.kScreen, skia.BlendMode.kPlus
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
SMOG = (176, 158, 84)            # sulphur yellow
SMOG_D = (96, 86, 50)
SAMP = skia.SamplingOptions(skia.FilterMode.kLinear)


# ------------------------------------------------------------------ fog texture and puff sprite
def _fog_tile(seed, n=768):
    r = np.random.default_rng(seed); acc = np.zeros((n, n), np.float32)
    for sig, wgt in ((90, 1.0), (40, 0.55), (16, 0.28), (6, 0.12)):
        x = r.normal(0, 1, (n, n)).astype(np.float32)
        pd = int(sig * 3); x = cv2.GaussianBlur(np.pad(x, pd, mode='wrap'), (0, 0), sig)[pd:-pd, pd:-pd]; acc += wgt * x / x.std()
    acc = (acc - acc.min()) / (acc.max() - acc.min()); acc = np.clip((acc - 0.28) / 0.6, 0, 1) ** 1.3
    a = (acc * 255).astype(np.uint8); img = np.dstack([a, a, a, a])
    return skia.Image.fromarray(np.ascontiguousarray(img), colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kPremul_AlphaType)


_FOG = {}


def fog(c, t, col, a, scale=2.0, vx=12.0, vy=0.0, seed=1, rect=None, ox=0.0, oy=0.0):
    """a layer of drifting murk: a tileable cloud texture tinted col"""
    if a <= 0.004: return
    if seed not in _FOG: _FOG[seed] = _fog_tile(seed)
    m = skia.Matrix(); m.setScale(scale, scale); m.postTranslate(ox + t * vx, oy + t * vy)
    sh = _FOG[seed].makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, SAMP, m)
    pa = skia.Paint(Shader=sh, ColorFilter=skia.ColorFilters.Blend(C(col), skia.BlendMode.kSrcIn), AntiAlias=True); pa.setAlphaf(min(1.0, a))
    c.drawRect(rect or skia.Rect(-400, -400, 1480, 2400), pa)


def _puff_sprite(n=128):
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32); r = np.random.default_rng(5); acc = np.zeros((n, n), np.float32)
    for (cx, cy, rr) in [(64, 64, 44)] + [(64 + r.uniform(-22, 22), 64 + r.uniform(-22, 22), r.uniform(18, 30)) for _ in range(7)]:
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rr; acc = np.maximum(acc, np.clip(1 - d, 0, 1) ** 0.8)
    acc = cv2.GaussianBlur(acc, (0, 0), 7); acc /= acc.max(); a = (acc * 255).astype(np.uint8)
    return skia.Image.fromarray(np.ascontiguousarray(np.dstack([a, a, a, a])), colorType=skia.kRGBA_8888_ColorType, alphaType=skia.kPremul_AlphaType)


_PUFF = None


def puff(c, x, y, r, col, a, rot=0.0, sq=1.0):
    global _PUFF
    if a <= 0.01 or r <= 0.5: return
    if _PUFF is None: _PUFF = _puff_sprite()
    pa = skia.Paint(ColorFilter=skia.ColorFilters.Blend(C(col), skia.BlendMode.kSrcIn), AntiAlias=True); pa.setAlphaf(min(1.0, a))
    c.save(); c.translate(x, y); c.scale(1, sq); c.rotate(rot)
    c.drawImageRect(_PUFF, skia.Rect(0, 0, 128, 128), skia.Rect(-r * 1.45, -r * 1.45, r * 1.45, r * 1.45), SAMP, pa); c.restore()


def glow(c, x, y, r, col, a=255, mode=SCREEN):
    sh = skia.GradientShader.MakeRadial((x, y), r, [C(col, a), C(col, a * 0.35), C(col, 0)], [0, 0.4, 1])
    c.drawCircle(x, y, r, skia.Paint(Shader=sh, BlendMode=mode, AntiAlias=True))


def label(c, txt, x, y, size, col, a=255, shadow=True, face=None, anchor=0.5):
    f = skia.Font(face or L.BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias); w = f.measureText(txt)
    if shadow: c.drawString(txt, x - w * anchor, y + 3, f, P((0, 0, 0), a * 0.8, MaskFilter=blur(6))); c.drawString(txt, x - w * anchor, y + 4, f, P((0, 0, 0), a * 0.4))
    c.drawString(txt, x - w * anchor, y, f, P(col, a)); return w


_RS = np.random.default_rng(1952)
FLECK = [(_RS.uniform(0, 1), _RS.uniform(0, 1), _RS.uniform(1.6, 4.6), _RS.uniform(0.3, 1.0), _RS.uniform(0, 6.28)) for _ in range(70)]


def flecks(c, t, a=1.0, col=(26, 24, 20), n=60):
    """soot flecks drifting down and sideways through the still air"""
    for (u, v, r, al, ph) in FLECK[:n]:
        x = ((u + t * 0.012 * (0.5 + al) + 0.02 * math.sin(t * 0.7 + ph)) % 1.0) * 1160 - 40
        y = ((v + t * 0.022 * (0.4 + al)) % 1.0) * 2000 - 40
        c.drawOval(skia.Rect(x - r, y - r * 0.8, x + r, y + r * 0.8), P(col, 200 * al * a))
        if r > 3.4: c.drawCircle(x - r * 0.3, y - r * 0.3, r * 0.35, P(mix(col, SMOG, 0.6), 120 * al * a))


# ------------------------------------------------------------------ the flare
def flick(t):
    return 0.84 + 0.1 * math.sin(t * 41) * math.sin(t * 17 + 1) + 0.06 * math.sin(t * 73 + 2)


SPARK = [(_RS.uniform(0, 1), _RS.uniform(-1, 1), _RS.uniform(0.3, 1.0), _RS.uniform(0.5, 1.0)) for _ in range(34)]


def flare_fx(c, t, pt, s):
    """the burning tip: a hard orange white light, falling sparks, and its own pale smoke climbing away. pt = screen point of the tip, s = size"""
    if pt is None: return
    x, y = pt; f = flick(t)
    for i in range(9):                                       # its own smoke, climbing and leaning
        u = ((t * 0.34 + i / 9) % 1.0)
        puff(c, x + (26 + 60 * u) * math.sin(u * 3.0 + i * 1.7 + t * 0.4) * s * 0.5 + 40 * u * u * s, y - (30 + 620 * u) * s * 0.55, (16 + 86 * u) * s * 0.55, mix((255, 196, 150), (150, 132, 96), min(1, u * 1.6)), 0.5 * (1 - u) ** 1.2 * min(1, u * 8), rot=i * 50 + t * 12)
    glow(c, x, y, 640 * s ** 0.5 * f, (255, 140, 50), 150); glow(c, x, y, 280 * s ** 0.5 * f, (255, 186, 100), 190); glow(c, x, y, 110 * s * f, (255, 226, 180), 255, PLUS)
    for (cf, k_, bl_) in (((255, 120, 40), 1.0, 7), ((255, 200, 110), 0.7, 4), ((255, 250, 232), 0.42, 2)):          # the flame: a fierce hissing jet, three tones, never the same twice
        h_ = (96 + 22 * math.sin(t * 37 + k_ * 3) + 12 * math.sin(t * 61)) * s * k_; w_ = 30 * s * k_; ln = 7 * s * math.sin(t * 23 + k_)
        c.drawPath(smooth_closed([(x - w_, y + 6 * s), (x - w_ * 0.9, y - h_ * 0.35), (x - w_ * 0.3 + ln, y - h_ * 0.8), (x + ln * 1.6, y - h_), (x + w_ * 0.4 + ln, y - h_ * 0.75), (x + w_ * 0.95, y - h_ * 0.3), (x + w_, y + 6 * s), (x, y + 16 * s * k_)]),
                   P(cf, 255, MaskFilter=blur(bl_ * s)))
    glow(c, x, y - 30 * s, 70 * s * f, (255, 244, 220), 255, PLUS)
    for (ph, dx, sp_, al) in SPARK:                           # sparks: thrown out, then falling
        u = (t * (0.9 + 0.5 * sp_) + ph) % 1.0; a_ = u * 0.8
        px = x + dx * 150 * s * a_ * (1.4 - u * 0.4) + 14 * s * math.sin(ph * 40); py = y - 70 * s * sp_ * a_ * 2.2 + 520 * s * a_ * a_
        vx = dx * 150 * s; vy = -70 * s * sp_ * 2.2 + 1040 * s * a_; n_ = math.hypot(vx, vy) or 1; tl = 12 * s * (1 - u) + 3
        c.drawLine(px, py, px - vx / n_ * tl * 1.7, py - vy / n_ * tl * 1.7, SP(mix((255, 236, 180), (255, 120, 40), u), 4.2 * s * (1 - 0.6 * u) + 1.0, 255 * al * (1 - u) ** 0.7 * smooth((u - 0.06) / 0.12)))


# ------------------------------------------------------------------ gas lamp
def lamp(c, x, y, s, t, on=1.0, halo=1.0, ph=0.0, post=(22, 22, 22)):
    """a cast iron gas lamp, base at (x, y); s = scale (post about 340 units tall)"""
    c.save(); c.translate(x, y); c.scale(s, s)
    f = (0.92 + 0.08 * math.sin(t * 9 + ph) * math.sin(t * 5.3 + ph * 2)) * on
    glow(c, 0, -372, 300 * halo, (214, 190, 90), 86 * f); glow(c, 0, -372, 120 * halo, (240, 220, 130), 150 * f)
    c.drawPath(smooth_closed([(-22, 0), (-16, -30), (-9, -44), (-7, -300), (7, -300), (9, -44), (16, -30), (22, 0)]), P(post))
    c.drawRect(skia.Rect(-12, -90, 12, -80), P(post)); c.drawRect(skia.Rect(-30, -306, 30, -298), P(post)); c.drawCircle(-30, -302, 5, P(post)); c.drawCircle(30, -302, 5, P(post))
    c.drawLine(-4, -296, -4, -50, SP(mix(post, (255, 200, 110), 0.35), 2.4, 200 * on))
    lan = poly([(-20, -318), (20, -318), (32, -404), (-32, -404)])
    c.drawPath(lan, P(mix((60, 54, 30), (255, 236, 160), 0.8 * f))); c.drawPath(lan, SP(post, 5)); c.drawLine(0, -318, 0, -404, SP(post, 3.4))
    c.drawPath(poly([(-38, -404), (38, -404), (16, -436), (-16, -436)]), P(post)); c.drawRect(skia.Rect(-5, -452, 5, -436), P(post)); c.drawCircle(0, -456, 7, P(post))
    c.drawRect(skia.Rect(-12, -322, 12, -312), P(post))
    c.drawOval(skia.Rect(-7, -384, 7, -342), P((255, 250, 220), 255 * f, MaskFilter=blur(4))); glow(c, 0, -362, 46, (255, 246, 200), 230 * f, PLUS)
    c.restore()


# ------------------------------------------------------------------ the bus, seen from the front
RED, RED_SH, RED_HI = (132, 34, 30), (78, 18, 24), (196, 70, 50)
CREAM = (186, 160, 112)


def bus(c, x, y, s, t, beams=1.0, dim=0.0, plate=True, blind=1.0):
    """a 1950s London double decker from the front: half cab on the left of the picture, radiator and bonnet on the right, round headlamps,
    a destination blind between the decks. Invented route, no operator name. Base centre at (x, y), about 420 units wide and 790 tall."""
    c.save(); c.translate(x + 0.7 * math.sin(t * 75), y + 0.6 * math.sin(t * 61 + 1)); c.scale(s, s)       # the diesel idling shakes it a little
    c.drawOval(skia.Rect(-250, -26, 250, 34), P((6, 6, 8), 200, MaskFilter=blur(16)))
    for sx in (-1, 1):                                       # tyres
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(sx * 166 - 29, -96, sx * 166 + 29, 4), 13, 13), P((12, 12, 14)))
        for j in range(5): c.drawLine(sx * 166 - 25, -80 + j * 18, sx * 166 + 25, -76 + j * 18, SP((30, 30, 34), 3.4))
    body = smooth_closed([(-206, -70), (-210, -420), (-206, -700), (-190, -770), (-120, -792), (120, -792), (190, -770), (206, -700), (210, -420), (206, -70), (0, -62)])
    shaded(c, body, RED, RED_SH, sh=(-16, 0), rimL=RED_HI, rl=(5, 4))
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-220, -800, 220, -742), P((92, 92, 96))); c.drawRect(skia.Rect(-220, -748, 220, -742), P((50, 50, 56)))                  # the roof
    c.drawRect(skia.Rect(-220, -470, 220, -448), P(CREAM)); c.drawRect(skia.Rect(-220, -452, 220, -448), P(mix(CREAM, (40, 30, 30), 0.5)))           # the cream band between the decks
    c.drawRect(skia.Rect(60, -800, 220, -60), P(RED_SH, 90, MaskFilter=blur(30)))
    c.restore()
    wl = mix((34, 34, 30), (214, 188, 110), 0.5 + 0.04 * math.sin(t * 3))                         # dim saloon lights behind the glass
    for (x0, x1) in ((-184, -10), (10, 184)):               # upper deck front windows
        w_ = skia.Path(); w_.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0, -716, x1, -604), 16, 16)); c.drawPath(w_, P(wl)); c.drawPath(w_, SP((40, 14, 16), 7))
        c.save(); c.clipPath(w_, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(x0, -716, x1, -690), P((255, 240, 180), 60)); c.drawRect(skia.Rect(x0, -640, x1, -600), P((60, 36, 30), 190))
        for hx_ in (x0 + 40, x0 + 100, x0 + 140): c.drawCircle(hx_, -640, 18, P((40, 30, 28)))                      # a few heads of passengers
        c.restore()
    bx = skia.Path(); bx.addRRect(skia.RRect.MakeRectXY(skia.Rect(-150, -592, 150, -486), 10, 10)); c.drawPath(bx, P((12, 12, 14))); c.drawPath(bx, SP((60, 22, 22), 5))       # the destination blind
    c.drawRect(skia.Rect(-140, -582, -50, -496), P((30, 30, 30))); c.drawRect(skia.Rect(-40, -582, 140, -496), P((30, 30, 30)))
    f1 = skia.Font(L.BLACK, 62); f2 = skia.Font(L.BLACK, 40); bl = mix((34, 33, 30), (150, 140, 106), blind)
    w1 = f1.measureText('7X'); c.drawString('7X', -95 - w1 / 2, -516, f1, P(bl)); w2 = f2.measureText('DEPOT'); c.drawString('DEPOT', 50 - w2 / 2, -524, f2, P(bl))
    glow(c, 0, -540, 170, (230, 214, 150), 22)
    cab = skia.Path(); cab.addRRect(skia.RRect.MakeRectXY(skia.Rect(-192, -434, -22, -292), 14, 14))                           # the driver's cab windscreen
    c.drawPath(cab, P((30, 34, 34))); c.save(); c.clipPath(cab, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-192, -434, -22, -292), P((120, 108, 60), 60))
    dv = smooth_closed([(-160, -280), (-152, -340), (-128, -356), (-124, -384), (-106, -400), (-88, -384), (-84, -356), (-60, -340), (-52, -280)])       # the driver: a dim shape leaning to the glass
    c.save(); c.translate(1.5 * math.sin(t * 0.9), 0); c.drawPath(dv, P((10, 12, 14))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-130, -404, -82, -390), 6, 6), P((10, 12, 14))); c.restore()
    c.drawOval(skia.Rect(-150, -318, -62, -250), SP((8, 8, 10), 9))                                                             # the steering wheel
    c.drawLine(-190, -300, -40, -440, SP((255, 255, 255), 30, 26)); c.restore(); c.drawPath(cab, SP((40, 14, 16), 8))
    c.drawRect(skia.Rect(-200, -450, -14, -438), P(RED_SH))                                                                    # canopy edge over the cab
    bon = smooth_closed([(0, -270), (4, -400), (30, -428), (150, -428), (180, -400), (184, -270)]); shaded(c, bon, mix(RED, RED_SH, 0.3), RED_SH, sh=(-10, -4), rimL=RED_HI, rl=(4, 4))   # bonnet
    rad = skia.Path(); rad.addRRect(skia.RRect.MakeRectXY(skia.Rect(26, -400, 160, -150), 20, 20)); c.drawPath(rad, P((18, 18, 20))); c.drawPath(rad, SP((150, 150, 156), 7)); c.drawPath(rad, SP((230, 226, 214), 2.4, 200))
    c.save(); c.clipPath(rad, skia.ClipOp.kIntersect, True)
    for j in range(9): c.drawLine(38 + j * 14, -396, 38 + j * 14, -154, SP((70, 70, 76), 4))
    c.restore(); c.drawPath(poly([(78, -398), (108, -398), (93, -372)]), P((170, 170, 176)))
    c.drawRect(skia.Rect(-206, -150, 206, -132), P((16, 16, 18)))                                                              # the dark skirt and the wings over the wheels
    for sx in (-1, 1):
        wg = smooth_closed([(sx * 212, -84), (sx * 213, -140), (sx * 196, -166), (sx * 162, -174), (sx * 130, -164), (sx * 118, -138), (sx * 120, -84), (sx * 166, -100)])
        c.drawPath(wg, P((22, 22, 26))); c.drawPath(diffp(wg, (2, 3)), P((92, 80, 60), 200))
    pl = skia.Rect(-66, -124, 66, -86)
    if plate: c.drawRect(pl, P((10, 10, 10))); f3 = skia.Font(L.BLACK, 30); w3 = f3.measureText('KXW 219')
    if plate: c.drawRect(pl, SP((120, 120, 120), 2.5)); c.drawString('KXW 219', -w3 / 2, -94, f3, P((214, 214, 204)))
    if dim: c.drawPath(body, P((34, 30, 22), 255 * dim)); c.drawPath(body, P(SMOG_D, 90 * dim))
    for sx in (-1, 1):                                       # round headlamps and their beams hanging in the murk
        hx_, hy_ = sx * 152, -214; f = (0.95 + 0.05 * math.sin(t * 13 + sx)) * beams
        c.drawCircle(hx_, hy_, 40, P((16, 16, 18))); c.drawCircle(hx_, hy_, 34, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeRadial((hx_ - 4, hy_ - 4), 36, [C((255, 252, 232)), C(mix((80, 74, 50), (250, 226, 150), min(1, f))), C(mix((60, 54, 40), (214, 176, 96), min(1, f)))], [0, 0.55, 1.0])))
        c.drawCircle(hx_, hy_, 37, SP((120, 116, 110), 4)); c.drawLine(hx_ - 26, hy_, hx_ + 26, hy_, SP((120, 110, 80), 2, 90)); c.drawLine(hx_, hy_ - 26, hx_, hy_ + 26, SP((120, 110, 80), 2, 90))
        glow(c, hx_, hy_, 300, (226, 200, 104), 74 * f); glow(c, hx_, hy_, 110, (255, 232, 160), 130 * f); glow(c, hx_, hy_, 22, (255, 252, 236), 230 * f, PLUS)
        c.drawOval(skia.Rect(hx_ - 190, 0, hx_ + 190, 60), P((226, 200, 104), 46 * f, MaskFilter=blur(26)))              # light pooled on the wet road
    c.restore()


# ------------------------------------------------------------------ the street in the smog (conductor shots)
def street_back(c, t, horizon=1180, thick=0.0):
    c.drawRect(skia.Rect(-400, -400, 1480, 2400), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 1920)],
               [C((22, 21, 16)), C((62, 56, 30)), C((98, 88, 44)), C((44, 40, 24)), C((16, 15, 12))], [0, 0.34, 0.6, 0.72, 1.0])))
    fog(c, t, SMOG, 0.3 + 0.2 * thick, 2.6, 7, 1.5, seed=1)
    for sd in (-1, 1):                                       # the terraces on both sides, only darker shapes in the murk, a window or two alight
        x0 = 540 + sd * 250; x1 = 540 + sd * 1100
        ter = poly([(x0, horizon - 330), (x0 + sd * 90, horizon - 430), (x0 + sd * 100, horizon - 500), (x0 + sd * 150, horizon - 500), (x0 + sd * 160, horizon - 440), (x1, horizon - 720), (x1, horizon + 30), (x0, horizon + 4)])
        c.drawPath(ter, P((34, 31, 20), 215))
        for j in range(3):
            wx = x0 + sd * (70 + j * 110); wy = horizon - 250 - j * 54; ww = 26 + j * 9
            c.drawRect(skia.Rect(wx - ww / 2, wy, wx + ww / 2, wy + ww * 1.7), P((228, 170, 70), (150 - j * 20) * (0.9 + 0.1 * math.sin(t * 3 + j + sd)))); glow(c, wx, wy + ww * 0.8, 70 + j * 16, (228, 170, 70), 50)
    lamp(c, 176, horizon + 26, 1.0, t, ph=1.0, post=(26, 24, 18)); lamp(c, 842, horizon - 24, 0.62, t, ph=2.4, on=0.8, post=(40, 37, 24))
    fog(c, t, SMOG, 0.32 + 0.2 * thick, 3.4, -9, 1.0, seed=2, oy=300)


def street_ground(c, t, horizon=1180, lights=()):
    """wet setts running back into the murk; lights = [(x, col, strength)] reflected as soft streaks"""
    g = skia.Rect(-400, horizon, 1480, 2500)
    c.drawRect(g, skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, horizon), skia.Point(0, horizon + 620)], [C((84, 76, 40)), C((40, 37, 24)), C((18, 17, 14))], [0, 0.3, 1.0])))
    c.save(); c.clipRect(g)
    for j in range(1, 15):                                   # rows of setts, closer together toward the horizon
        yy = horizon + 5.2 * j * j; c.drawLine(-400, yy, 1480, yy, SP((14, 13, 10), 1.5 + j * 0.24, 80 + j * 5))
    for k in range(-9, 10):
        c.drawLine(540 + k * 44, horizon, 540 + k * 400, horizon + 1000, SP((14, 13, 10), 2.6, 60))
    for (lx, col, st) in lights:
        c.drawOval(skia.Rect(lx - 110, horizon + 30, lx + 110, horizon + 560), P(col, 54 * st, MaskFilter=blur(42))); c.drawOval(skia.Rect(lx - 34, horizon + 50, lx + 34, horizon + 420), P(col, 60 * st, MaskFilter=blur(18)))
    c.restore()
    c.drawRect(skia.Rect(-400, horizon - 44, 1480, horizon + 60), P(SMOG, 96, MaskFilter=blur(26)))                      # the murk swallows the far road


# ------------------------------------------------------------------ the city: terrace, roofs, chimneys
BRICK, BRICK_D, BRICK_L = (88, 52, 44), (52, 32, 34), (126, 78, 60)
SLATE, SLATE_D = (44, 50, 66), (26, 30, 44)
POT = (150, 84, 56)
STACKS = [135, 405, 675, 945]            # front row chimney stacks (world x); pots at y = 1232
POT_Y = 1232
_BR = None


def _brick_shader():
    global _BR
    if _BR is None:
        k = 4; s = skia.Surface(48 * k, 24 * k); cc = s.getCanvas(); cc.scale(k, k); cc.clear(C(BRICK)); r = np.random.default_rng(3)
        for row in range(2):
            for col_ in range(-1, 3):
                x0 = col_ * 24 + (12 if row else 0); tone = r.uniform(-1, 1)
                cc.drawRect(skia.Rect(x0 + 1, row * 12 + 1, x0 + 23, row * 12 + 11), P(mix(BRICK, BRICK_L if tone > 0 else BRICK_D, abs(tone) * 0.45)))
                cc.drawRect(skia.Rect(x0 + 1, row * 12 + 1, x0 + 23, row * 12 + 3), P(BRICK_L, 40))
        cc.drawRect(skia.Rect(0, 0, 48, 1), P(BRICK_D)); cc.drawRect(skia.Rect(0, 12, 48, 13), P(BRICK_D))
        m = skia.Matrix(); m.setScale(1 / k, 1 / k)
        _BR = s.makeImageSnapshot().makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear), m)
    return _BR


def sash(c, x0, y0, x1, y1, t, glow_=0.8, kind='curtain', ph=0.0):
    """a sash window with a stone lintel and sill; kind: curtain (lit through drawn curtains), dark, fire (the room and its coal fire seen through the glass)"""
    c.drawRect(skia.Rect(x0 - 10, y0 - 22, x1 + 10, y0 - 2), P((150, 136, 110))); c.drawRect(skia.Rect(x0 - 10, y0 - 8, x1 + 10, y0 - 2), P((96, 84, 72)))
    c.drawRect(skia.Rect(x0 - 12, y1, x1 + 12, y1 + 12), P((150, 136, 110))); c.drawRect(skia.Rect(x0 - 12, y1 + 8, x1 + 12, y1 + 14), P((70, 60, 54)))
    w = skia.Rect(x0, y0, x1, y1); c.save(); c.clipRect(w)
    fl = 0.9 + 0.1 * math.sin(t * 7 + ph) * math.sin(t * 3.1 + ph)
    if kind == 'dark':
        c.drawRect(w, P((18, 20, 26))); c.drawLine(x0, y1, x1, y0, SP((90, 96, 110), 14, 40))
    elif kind == 'curtain':
        c.drawRect(w, P(mix((40, 30, 24), (236, 168, 76), glow_ * fl)))
        for j in range(7): xx = lerp(x0, x1, j / 6); c.drawLine(xx, y0, xx + 3, y1, SP((150, 90, 44), 3, 110))
        c.drawRect(skia.Rect(x0, y0, x1, y0 + 16), P((120, 66, 40), 200))
    else:
        cx = (x0 + x1) / 2
        c.drawRect(w, P((74, 44, 30))); c.drawRect(skia.Rect(x0, y1 - 26, x1, y1), P((48, 30, 26)))                                   # the back wall and the floor
        c.drawRect(skia.Rect(cx - 34, y0 + 34, cx + 34, y1 - 22), P((34, 26, 28))); c.drawRect(skia.Rect(cx - 42, y0 + 26, cx + 42, y0 + 38), P((150, 130, 110)))   # chimney breast opening and the mantel shelf
        c.drawRect(skia.Rect(cx - 7, y0 + 12, cx + 7, y0 + 26), P((190, 170, 120))); c.drawCircle(cx, y0 + 19, 4, P((40, 34, 30)))                              # a clock on the mantel
        glow(c, cx, y1 - 36, 74, (255, 150, 50), 230 * fl); c.drawRect(skia.Rect(cx - 24, y1 - 40, cx + 24, y1 - 24), P((255, 190, 80)))
        for (col_f, k_, hh) in (((255, 120, 40), 1.0, 1.0), ((255, 196, 80), 0.72, 0.8), ((255, 240, 180), 0.42, 0.55)):       # flames over the coals: three tongues, three tones
            for j, fx_ in enumerate((cx - 15, cx + 1, cx + 16)):
                fh = (26 + 12 * math.sin(t * 7.3 + j * 2.1 + k_) + 6 * math.sin(t * 13 + j)) * hh; w2 = 11 * k_; lean_ = 3 * math.sin(t * 5 + j * 1.7)
                c.drawPath(smooth_closed([(fx_ - w2, y1 - 31), (fx_ - w2 * 0.8, y1 - 31 - fh * 0.45), (fx_ + lean_, y1 - 31 - fh), (fx_ + w2 * 0.8, y1 - 31 - fh * 0.4), (fx_ + w2, y1 - 31)]), P(col_f))
        for j in range(6): c.drawCircle(cx - 20 + j * 8, y1 - 27 + (j % 2) * 2, 5.5, P(mix((120, 30, 24), (255, 130, 50), 0.5 + 0.5 * math.sin(t * 3 + j * 2.3))))       # the coals glow and dull
        for j in range(4): c.drawLine(cx - 22 + j * 15, y1 - 42, cx - 22 + j * 15, y1 - 22, SP((20, 16, 18), 3))                      # the grate bars
        c.drawRect(skia.Rect(cx - 30, y1 - 24, cx + 30, y1 - 20), P((20, 16, 18)))
        for sd in (-1, 1): c.drawPath(smooth_closed([(cx + sd * 56, y0), (cx + sd * 40, y0), (cx + sd * 46, y0 + 60), (cx + sd * 50, y1), (cx + sd * 56, y1)]), P((110, 40, 38)))   # curtains drawn back
        c.drawRect(w, P((255, 170, 70), 30 * fl))
    c.restore()
    c.drawRect(w, SP((226, 220, 204), 5)); c.drawLine(x0, (y0 + y1) / 2, x1, (y0 + y1) / 2, SP((226, 220, 204), 5)); c.drawLine((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, SP((226, 220, 204), 2.6))
    if kind != 'dark': glow(c, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 1.5, (236, 168, 76), 60 * glow_ * fl)


def stack(c, x, y, s=1.0, t=0.0, lit=0.0):
    """a brick chimney stack with four clay pots; (x, y) = centre of the base on the ridge. Pot tops at y - 98*s"""
    c.save(); c.translate(x, y); c.scale(s, s)
    st = skia.Rect(-46, -70, 46, 6); c.drawRect(st, skia.Paint(Shader=_brick_shader())); c.drawRect(st, P((20, 16, 30), 110)); c.drawRect(skia.Rect(10, -70, 46, 6), P((14, 10, 24), 90))
    c.drawRect(skia.Rect(-52, -80, 52, -68), P((120, 110, 100))); c.drawRect(skia.Rect(-52, -72, 52, -68), P((60, 54, 56)))
    for px in (-33, -11, 11, 33):
        pot = poly([(px - 9, -80), (px + 9, -80), (px + 7.5, -106), (px - 7.5, -106)]); c.drawPath(pot, P(POT)); c.drawRect(skia.Rect(px + 2, -106, px + 9, -80), P((96, 50, 44), 200))
        c.drawRect(skia.Rect(px - 9.5, -110, px + 9.5, -104), P(mix(POT, (255, 200, 150), 0.25))); c.drawOval(skia.Rect(px - 7, -112, px + 7, -106), P((20, 14, 16)))
        if lit: glow(c, px, -108, 16, (255, 150, 60), 150 * lit)
    c.restore()


def roof_row(c, y_eaves, rise, col, col_d, x_off=0.0, pitch=270.0, stack_s=1.0, t=0.0, a=255, stacks=True):
    """one terrace roof seen from the front: slates up to a ridge, party walls, a chimney stack on each party wall"""
    r = skia.Rect(-400, y_eaves - rise, 1480, y_eaves + 6); c.drawRect(r, P(col, a))
    c.save(); c.clipRect(r)
    for j in range(1, int(rise / 11) + 1): c.drawLine(-400, y_eaves - rise + j * 11, 1480, y_eaves - rise + j * 11, SP(col_d, 1.6, 150 * a / 255))
    c.drawRect(skia.Rect(-400, y_eaves - rise, 1480, y_eaves - rise + 7), P(mix(col, (150, 160, 190), 0.3), a))
    c.restore()
    c.drawRect(skia.Rect(-400, y_eaves, 1480, y_eaves + 9), P((18, 18, 24), a))
    if stacks:
        x = x_off - pitch * 3
        while x < 1480:
            stack(c, x, y_eaves - rise, stack_s, t); x += pitch


def facade(c, t, flare=0.0):
    """the front terrace: brick fronts from the eaves (y 1420) down to the pavement (y 1900)"""
    r = skia.Rect(-400, 1420, 1480, 1900); c.drawRect(r, skia.Paint(Shader=_brick_shader()))
    c.drawRect(r, skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 1420), skia.Point(0, 1900)], [C((16, 14, 30), 150), C((20, 16, 26), 60)])))
    if flare:                                                 # the flare's light, down the street to the left, reaches the lower bricks
        f = flick(t) * flare; c.save(); c.clipRect(skia.Rect(-400, 1420, 1480, 1960)); glow(c, -20, 1830, 620, (255, 150, 60), 150 * f, PLUS); c.restore()
    x = -405.0; i = 0
    while x < 1480:
        c.drawRect(skia.Rect(x - 5, 1420, x + 5, 1900), P((40, 26, 30)))                                              # party wall line / downpipe
        kinds = (('curtain', 'dark'), ('fire', 'curtain'), ('dark', 'curtain'), ('curtain', 'curtain'), ('dark', 'dark'))[(i + 4) % 5]
        up = (('dark', 'curtain'), ('curtain', 'dark'), ('dark', 'dark'), ('curtain', 'curtain'), ('curtain', 'dark'))[i % 5]
        var = (i + 4) % 5
        if var in (0, 2):                                    # a rendered ground floor on two of the houses
            rc = (150, 140, 112) if var == 0 else (112, 122, 118)
            c.drawRect(skia.Rect(x + 5, 1646, x + 265, 1900), P(rc)); c.drawRect(skia.Rect(x + 5, 1646, x + 265, 1900), P((16, 14, 30), 120))
            for yy in range(1690, 1900, 44): c.drawLine(x + 5, yy, x + 265, yy, SP((30, 26, 34), 2, 90))
        if var == 3:                                         # the tall house: a brick gable with an attic window breaking the roof line
            gb = poly([(x + 66, 1424), (x + 66, 1318), (x + 135, 1262), (x + 204, 1318), (x + 204, 1424)])
            c.drawPath(gb, skia.Paint(Shader=_brick_shader(), AntiAlias=True)); c.drawPath(gb, P((16, 14, 30), 130))
            c.drawPath(poly([(x + 54, 1322), (x + 135, 1252), (x + 216, 1322), (x + 216, 1334), (x + 135, 1268), (x + 54, 1334)]), P((30, 32, 44)))
            sash(c, x + 106, 1340, x + 164, 1404, t, 0.8, 'curtain', ph=i * 3.0)
        for j, xx in enumerate((x + 40, x + 152)): sash(c, xx, 1474, xx + 78, 1612, t, 0.7, up[j], ph=i + j)
        # the door: steps, panels, a fanlight
        dx = x + 34; c.drawRect(skia.Rect(dx - 12, 1676, dx + 84, 1900), P((150, 136, 110))); c.drawRect(skia.Rect(dx - 12, 1676, dx + 84, 1690), P((190, 176, 150)))
        dcol = ((24, 44, 40), (48, 22, 24), (22, 28, 48), (30, 30, 30), (40, 34, 20))[i % 5]
        c.drawRect(skia.Rect(dx, 1734, dx + 72, 1900), P(dcol)); c.drawRect(skia.Rect(dx + 50, 1734, dx + 72, 1900), P((0, 0, 0), 60))
        for (px0, py0, px1, py1) in ((8, 1746, 32, 1806), (40, 1746, 64, 1806), (8, 1818, 32, 1886), (40, 1818, 64, 1886)): c.drawRect(skia.Rect(dx + px0, py0, dx + px1, py1), SP(mix(dcol, (0, 0, 0), 0.5), 2.6))
        c.drawCircle(dx + 60, 1812, 4.5, P((214, 168, 84))); c.drawRect(skia.Rect(dx + 26, 1806, dx + 46, 1814), P((214, 168, 84)))
        fan = skia.Rect(dx, 1694, dx + 72, 1730); lit = kinds[0] != 'dark'
        c.drawRect(fan, P(mix((20, 20, 26), (236, 168, 76), 0.8 if lit else 0.0))); c.drawRect(fan, SP((226, 220, 204), 4)); c.drawLine(dx + 36, 1694, dx + 36, 1730, SP((226, 220, 204), 3))
        if lit: glow(c, dx + 36, 1712, 70, (236, 168, 76), 60)
        c.drawRect(skia.Rect(dx - 16, 1888, dx + 88, 1904), P((130, 120, 104))); c.drawRect(skia.Rect(dx - 16, 1898, dx + 88, 1904), P((64, 58, 56)))
        sash(c, x + 140, 1716, x + 236, 1862, t, 0.85, kinds[0] if kinds[0] == 'fire' else kinds[1], ph=i * 2.0)
        x += 270; i += 1
    c.drawRect(skia.Rect(-400, 1636, 1480, 1646), P((140, 126, 104), 200)); c.drawRect(skia.Rect(-400, 1642, 1480, 1646), P((60, 52, 50), 200))               # a stone string course
    c.drawRect(skia.Rect(-400, 1900, 1480, 1972), P((70, 66, 56))); c.drawRect(skia.Rect(-400, 1900, 1480, 1906), P((120, 112, 92)))                            # pavement
    for xx in range(-400, 1480, 64): c.drawLine(xx, 1906, xx - 10, 1972, SP((44, 42, 38), 2))
    c.drawRect(skia.Rect(-400, 1972, 1480, 1990), P((110, 104, 90))); c.drawRect(skia.Rect(-400, 1984, 1480, 1990), P((40, 38, 36)))                            # kerb
    c.drawRect(skia.Rect(-400, 1990, 1480, 2500), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 1990), skia.Point(0, 2300)], [C((44, 40, 30)), C((16, 15, 14))])))
    for j in range(8): c.drawLine(-400, 2000 + j * j * 5 + j * 12, 1480, 2000 + j * j * 5 + j * 12, SP((12, 12, 12), 2, 120))


def skyline(c, col, a=255):
    """far London in silhouette: roofs, a dome and a clock tower (generic shapes)"""
    pts = [(-400, 1260), (-400, 1150)]; r = np.random.default_rng(8); x = -400
    while x < 1480:
        w_ = r.uniform(40, 110); h_ = r.uniform(0, 46); pts += [(x, 1150 - h_), (x + w_, 1150 - h_)]; x += w_
    pts += [(1480, 1260)]; c.drawPath(poly(pts), P(col, a))
    c.drawPath(smooth_closed([(250, 1150), (250, 1090), (262, 1056), (290, 1034), (318, 1056), (330, 1090), (330, 1150)]), P(col, a)); c.drawRect(skia.Rect(284, 1004, 296, 1040), P(col, a)); c.drawRect(skia.Rect(226, 1100, 354, 1150), P(col, a))   # a dome
    c.drawRect(skia.Rect(806, 1010, 846, 1150), P(col, a)); c.drawPath(poly([(800, 1010), (852, 1010), (826, 944)]), P(col, a)); c.drawCircle(826, 1040, 11, P(mix(col, (240, 220, 150), 0.5), a))                                # a clock tower


STARS = [(_RS.uniform(0, 1080), _RS.uniform(380, 1080), _RS.uniform(1.2, 3.0), _RS.uniform(0, 6.28)) for _ in range(70)]
SRC = [(x, 1228, 1.0, i) for i, x in enumerate(STACKS)] + [(x, 1198, 0.62, 10 + i) for i, x in enumerate((20, 282.5, 545, 807.5, 1070))] + [(x, 1158, 0.4, 20 + i) for i, x in enumerate((110, 290, 470, 650, 830, 1010))]
_PR = np.random.default_rng(21); PRND = _PR.uniform(0, 1, (40, 400, 4))


def smoke(c, t, ceil_y, depth, clear, t0=0.0, col_hot=(244, 204, 160), col=(150, 144, 136), only=None):
    """coal smoke from every chimney. Free air: each puff rises, leans with the height and thins away.
    Under a ceiling at ceil_y: it rises, stops under it, slides sideways and beds down into a layer `depth` thick. clear 0..1 fades the free columns high up."""
    DT = 0.2
    for (x0, y0, s, sid) in SRC:
        if only is not None and abs(s - only) > 0.01: continue
        v = 150 * (0.7 + 0.3 * s); life = 7.0 + 2.5 * (1 - clear)
        n0 = int((t - life) / DT); n1 = int(t / DT)
        for n in range(max(n0, int(t0 / DT)), n1 + 1):
            a = t - n * DT
            if a < 0: continue
            r1, r2, r3, r4 = PRND[sid % 40, n % 400]
            rise = v * a * (1 - 0.018 * a)
            yf = y0 - rise; lean = 0.00046 * rise * rise * (0.7 + 0.6 * r4)
            xf = x0 + (r1 - 0.5) * 12 * s + 13 * s * math.sin(a * 1.6 + n * 0.9 + sid) * min(1, a) + lean
            rad = (12 + 17 * a * (0.6 + 0.6 * r2)) * s ** 0.8
            al = 0.7 * min(1, a * 5) * max(0.0, 1 - a / life) ** (0.12 + 0.68 * clear); sq = 1.0
            if yf > ceil_y + 4 + rad * 0.3:
                x, y = xf, yf; al *= (1 - 0.92 * clear * smooth((rise - 330) / 400))
                cc = mix(col_hot, col, min(1, a / 1.8))
            else:                                             # it has met the lid: it cannot rise, so it slides along under it and beds down
                ac = min(a, max(0.0, (y0 - ceil_y)) / v); b = max(0.0, a - ac)
                sd = 1 if (n + sid) % 2 else -1
                x = x0 + 0.00046 * (y0 - ceil_y) ** 2 * 0.5 + sd * (30 + 250 * r3) * (1 - math.exp(-b / 1.8)) * (0.6 + 0.4 * s)
                sq = lerp(1.0, 0.5, smooth(b / 0.8))
                y = ceil_y + 5 + rad * 0.36 * sq + depth * r2 * smooth(b / 2.5)
                rad = (12 + 17 * ac * (0.6 + 0.6 * r2)) * s ** 0.8 * (1.0 + 0.5 * smooth(b / 1.5)); al = 0.74 * max(0.0, 1 - a / life) ** 0.45
                cc = mix(col, SMOG, 0.55 * smooth((b - 1.2) / 4))
            puff(c, x, y, rad, cc, al, rot=(n * 47 + a * 14) * (1 if sq > 0.99 else 0.15), sq=sq)


def cam_layer(c, cam, p):
    """camera for a layer at parallax p (1 = the front terrace, 0 = infinitely far)"""
    z, cx, cy = cam; zz = 1 + (z - 1) * p
    c.translate(540, 960); c.scale(zz, zz); c.translate(-lerp(540, cx, p), -lerp(960, cy, p))


def flare_glow_low(c, t, k):
    """shot 3 starts at street level: the flare is down the street to the left, its glow and a few sparks still in view"""
    if k <= 0.01: return
    f = flick(t) * k
    glow(c, 96, 1880, 420, (255, 150, 60), 130 * f); glow(c, 96, 1880, 150, (255, 210, 140), 160 * f)


# ------------------------------------------------------------------ round 2: the street moves. One simple camera model for the conductor shots:
# the camera backs away at the conductor's pace, so he holds his place in frame while the road, the kerbs and the lamps slide away behind him
# and the bus, a little faster than he is, gains on him. A ground point at depth z metres sits at y = h + K / z; F = pixels per metre times depth.
F_CAM = 1976.0
_GR = np.random.default_rng(52)
MARKS = [(_GR.uniform(-3.0, 3.0), _GR.uniform(0, 12.0), _GR.uniform(0.12, 0.4), _GR.uniform(0.3, 1.0), _GR.integers(0, 3)) for _ in range(46)]


def proj(h, K, xw, z):
    return 540 + F_CAM * xw / z, h + K / z


def street_ground2(c, t, h, K, dist, lights=(), wash=None):
    """wet setts in true perspective; dist = metres the camera has backed away so far, so every joint and glint slides off toward the murk.
    wash = (x, strength): the headlamps' light lying along the wet road toward us, so legs and boots stand dark against it"""
    g = skia.Rect(-400, h, 1480, 2600)
    c.drawRect(g, skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, h), skia.Point(0, h + 700)], [C((92, 84, 44)), C((58, 53, 32)), C((26, 24, 18))], [0, 0.35, 1.0])))
    c.save(); c.clipRect(g)
    if wash:
        c.drawOval(skia.Rect(wash[0] - 520, h + 10, wash[0] + 520, h + 760), P((214, 190, 104), 120 * wash[1], MaskFilter=blur(70)))
        c.drawOval(skia.Rect(wash[0] - 250, h + 60, wash[0] + 250, h + 560), P((240, 220, 140), 90 * wash[1], MaskFilter=blur(46)))
    for sd in (-1, 1):                                       # pavements beyond the kerbs
        x0n, y0n = proj(h, K, sd * 2.7, 0.7); pav = poly([(540, h), (x0n, y0n), (540 + sd * 3000, y0n), (540 + sd * 3000, h)])
        c.drawPath(pav, P((70, 64, 44), 150))
    off = dist % 0.5
    for k in range(0, 60):                                   # rows of setts: each row is a real line on the road, 0.5 m apart, carried away as we back off
        z = 0.75 + k * 0.5 + off; y = h + K / z
        if y > 2500: continue
        a_ = min(1.0, 2.6 / z) ; c.drawLine(-400, y, 1480, y, SP((10, 9, 8), max(1.2, 6.0 / z), 190 * a_ + 24)); c.drawLine(-400, y + max(1.2, 6.0 / z), 1480, y + max(1.2, 6.0 / z), SP((150, 134, 76), max(1.0, 2.4 / z), 60 * a_))
        for j in range(-8, 9):                                # the joints between setts in this row, staggered row by row
            xw = (j + (0.5 if (k + int(dist // 0.5)) % 2 else 0.0)) * 0.42
            if abs(xw) > 2.7 or z > 6: continue
            x0, _ = proj(h, K, xw, z); x1, y1 = proj(h, K, xw, z - 0.5 if z > 1.25 else 0.75)
            c.drawLine(x0, y, x1, min(2500, y1), SP((12, 11, 9), max(1.0, 3.4 / z), 110 * a_))
    for (xw, zw, r_, al, kind) in MARKS:                     # worn setts, tar patches and wet glints: fixed to the road, so they show it sliding
        z = 0.8 + (zw + dist) % 12.0; x, y = proj(h, K, xw, z); rr = F_CAM * r_ / z; fade = min(1.0, (z - 0.8) / 0.4) * min(1.0, 5.0 / z)
        if kind == 0: c.drawOval(skia.Rect(x - rr, y - rr * 0.16, x + rr, y + rr * 0.16), P((10, 10, 9), 120 * al * fade))
        elif kind == 1: c.drawOval(skia.Rect(x - rr * 0.8, y - rr * 0.1, x + rr * 0.8, y + rr * 0.1), P((214, 192, 110), 150 * al * fade))
        else: c.drawLine(x - rr, y, x + rr, y + rr * 0.05, SP((120, 108, 64), max(1.2, 6 / z), 110 * al * fade))
    for sd in (-1, 1):                                       # kerbs, with their stone joints sliding too
        pts_t = [proj(h, K, sd * 2.7, z) for z in (40, 0.7)]; pts_b = [proj(h, K * 1.0, sd * 2.7, z) for z in (40, 0.7)]
        c.drawLine(pts_t[0][0], pts_t[0][1], pts_t[1][0], pts_t[1][1], SP((128, 118, 84), 7, 220)); c.drawLine(pts_t[0][0], pts_t[0][1] + 5, pts_t[1][0] - sd * 6, pts_t[1][1] + 8, SP((16, 15, 12), 5, 200))
        for k in range(0, 30):
            z = 0.8 + k * 1.0 + dist % 1.0; x, y = proj(h, K, sd * 2.7, z); x2, y2 = proj(h, K, sd * 2.9, z)
            c.drawLine(x, y, x2, y2, SP((20, 18, 14), max(1.2, 5 / z), 200 * min(1.0, 3 / z)))
    for (lx, col, st) in lights:
        c.drawOval(skia.Rect(lx - 110, h + 30, lx + 110, h + 560), P(col, 54 * st, MaskFilter=blur(42))); c.drawOval(skia.Rect(lx - 34, h + 50, lx + 34, h + 420), P(col, 60 * st, MaskFilter=blur(18)))
    c.restore()
    c.drawRect(skia.Rect(-400, h - 44, 1480, h + 70), P(SMOG, 104, MaskFilter=blur(26)))                      # the murk swallows the far road


def street_back2(c, t, h, K, dist, thick=0.0, lamps=((-2.95, 8.5, 1.0), (3.0, 15.0, 2.4), (-2.95, 23.0, 0.3))):
    c.drawRect(skia.Rect(-400, -400, 1480, 2600), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, h - 1150), skia.Point(0, h + 770)],
               [C((22, 21, 16)), C((62, 56, 30)), C((98, 88, 44)), C((44, 40, 24)), C((16, 15, 12))], [0, 0.34, 0.6, 0.72, 1.0])))
    fog(c, t, SMOG, 0.3 + 0.2 * thick, 2.6, 7, 1.5, seed=1)
    for sd in (-1, 1):                                       # the terraces on both sides, only darker shapes in the murk, a window or two alight; they fall back slowly
        k_ = 1 - 0.012 * dist; x0 = 540 + sd * 250 * k_; x1 = 540 + sd * 1100
        ter = poly([(x0, h - 330 * k_), (x0 + sd * 90, h - 430 * k_), (x0 + sd * 100, h - 500 * k_), (x0 + sd * 150, h - 500 * k_), (x0 + sd * 160, h - 440 * k_), (x1, h - 720), (x1, h + 30), (x0, h + 4)])
        c.drawPath(ter, P((34, 31, 20), 215))
        for j in range(3):
            wx = x0 + sd * (70 + j * 110); wy = h - (250 + j * 54) * k_; ww = 26 + j * 9
            c.drawRect(skia.Rect(wx - ww / 2, wy, wx + ww / 2, wy + ww * 1.7), P((228, 170, 70), (150 - j * 20) * (0.9 + 0.1 * math.sin(t * 3 + j + sd)))); glow(c, wx, wy + ww * 0.8, 70 + j * 16, (228, 170, 70), 50)
    for (xw, z0_, ph) in sorted(lamps, key=lambda q: -q[1]):  # gas lamps standing on the kerbs: fixed to the street, so they shrink away
        z = z0_ + dist; x, y = proj(h, K, xw, z); sc = F_CAM / z / 150.0
        a_ = max(0.0, min(1.0, (30 - z) / 10))
        if a_ > 0.02:
            c.saveLayer(None, skia.Paint(Alphaf=a_)); lamp(c, x, y, sc, t, ph=ph, post=(26, 24, 18), on=min(1.0, 9 / z + 0.3)); c.restore()
        fog(c, t, SMOG, 0.07, 3.0 + z * 0.05, -5, 0.6, seed=2, oy=z * 30)
    fog(c, t, SMOG, 0.26 + 0.2 * thick, 3.4, -9, 1.0, seed=2, oy=300)
