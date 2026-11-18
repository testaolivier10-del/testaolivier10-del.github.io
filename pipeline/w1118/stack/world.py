"""Library at night: back wall of shelves, a moonlit arched window, a brass desk lamp, the reading table, the four hardbacks
and the ghost stack. World coords = screen coords at zoom 1. House flat layered style: flat fills, one shade, a rim."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/guy']
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import shaded, diffp, tube, op, glow, SCREEN, PLUS

E, L, T = 640.0, 340.0, 52.0                 # table edge x, book length, book thickness (a 24 cm hardback)
YTT = 1260.0                                  # table top, front line (the books' front faces sit on it)
DV = (-24.0, -26.0)                            # a book's depth (cover width) seen from the camera
TV = (-130.0, -128.0)                          # the table's depth
YF = YTT + 2.2 * L                            # floor, front line
LAMP = (310.0, 520.0)                         # centre of the hanging lamp shade's open mouth
WARM = (255, 196, 120)
_R = np.random.default_rng(11)
SPINES = []                                   # background shelf books: (shelf, x, w, h, colour index, lean)
for sh in range(-6, 12):
    x = -420.0
    while x < 1700:
        w = _R.uniform(16, 34); h = _R.uniform(0.62, 0.9); SPINES.append((sh, x, w, h, int(_R.integers(0, 6)), _R.uniform(-1, 1) if _R.random() < 0.06 else 0.0))
        x += w + (_R.uniform(30, 90) if _R.random() < 0.05 else 1.5)
SPC = [(38, 52, 92), (54, 46, 86), (30, 64, 84), (66, 50, 66), (44, 58, 70), (72, 64, 92)]
MOTES = [(_R.uniform(0, 1), _R.uniform(0, 1), _R.uniform(0.6, 1.5), _R.uniform(0, 6.28), _R.uniform(0.4, 1.0)) for _ in range(70)]

# the four hardbacks: base, shade, light colour; label colour
BOOKS = [((150, 46, 52), (104, 28, 40), (206, 96, 86)),       # top: oxblood
         ((40, 66, 128), (26, 42, 88), (96, 128, 196)),       # navy
         ((40, 104, 78), (24, 70, 56), (100, 166, 126)),      # forest green
         ((64, 108, 122), (40, 72, 88), (128, 172, 182)),     # slate teal
         ((112, 62, 104), (78, 40, 76), (168, 112, 160)),     # plum (the imagined extra books)
         ((176, 128, 60), (128, 88, 40), (224, 180, 110)),    # ochre
         ((88, 92, 110), (58, 60, 78), (140, 144, 166))]      # slate
GOLD, GOLD_SH = (232, 190, 104), (170, 126, 60)
PAGE, PAGE_SH = (244, 230, 200), (206, 186, 150)


def H(n):
    return sum(1.0 / k for k in range(1, n + 1))


# ------------------------------------------------------------------------------------------------ the room
def wall(c, t, cam_dx=0.0):
    """the far wall of shelves (drawn with its own slower parallax by the caller)"""
    c.drawRect(skia.Rect(-2000, -3000, 3200, 4000), skia.Paint(Shader=skia.GradientShader.MakeLinear(
        [skia.Point(0, -600), skia.Point(0, 2100)], [C((12, 14, 36)), C((22, 28, 62)), C((16, 18, 42)), C((10, 10, 26))], [0, 0.42, 0.7, 1])))
    # the arched window, moonlight, behind her (upper left)
    win = skia.Path(); win.addRRect(skia.RRect.MakeRectXY(skia.Rect(-150, 180, 230, 1180), 190, 190))
    c.drawPath(win, P((30, 44, 92)))
    c.save(); c.clipPath(win, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-150, 180, 230, 1180), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 180), skia.Point(0, 1180)], [C((70, 100, 170)), C((40, 58, 116))])))
    c.drawCircle(120, 360, 46, P((214, 226, 255), 230)); c.drawCircle(120, 360, 120, P((150, 180, 255), 60, MaskFilter=blur(40)))
    for i in range(3):                                                    # thin clouds drift past the moon
        x = (t * 6 + i * 170) % 520 - 160; c.drawOval(skia.Rect(x - 90, 400 + i * 120, x + 90, 428 + i * 120), P((120, 140, 200), 90, MaskFilter=blur(10)))
    for x in (40,): c.drawRect(skia.Rect(x - 7, 180, x + 7, 1180), P((22, 28, 60)))
    for y in (520, 860): c.drawRect(skia.Rect(-150, y - 6, 230, y + 6), P((22, 28, 60)))
    c.restore()
    c.drawPath(win, SP((24, 30, 62), 18))
    glow(c, 60, 700, 520, (90, 120, 220), 70)
    # shelving to the right of the window: uprights, boards, rows of spines
    for sh in range(-6, 12):
        y1 = 230 + sh * 150
        for (s_, x, w, h, ci, ln) in SPINES:
            if s_ != sh or x < 250 or x > 1700: continue
            col = SPC[ci]
            hh = 128 * h; p = skia.Path(); p.addRect(skia.Rect(x, y1 - hh, x + w, y1))
            if ln:
                c.save(); c.translate(x, y1); c.rotate(ln * 9); c.translate(-x, -y1)
            c.drawPath(p, P(col)); c.drawRect(skia.Rect(x, y1 - hh, x + w * 0.3, y1), P(mix(col, (8, 8, 24), 0.35)))
            c.drawRect(skia.Rect(x + 2, y1 - hh * 0.72, x + w - 2, y1 - hh * 0.64), P(mix(col, (120, 110, 150), 0.35)))
            if ln: c.restore()
        c.drawRect(skia.Rect(250, y1, 1800, y1 + 16), P((30, 26, 52))); c.drawRect(skia.Rect(250, y1, 1800, y1 + 4), P((60, 56, 96)))
    for x in (250, 760, 1270):
        c.drawRect(skia.Rect(x - 18, -800, x + 18, 2000), P((26, 24, 48))); c.drawRect(skia.Rect(x + 10, -800, x + 18, 2000), P((54, 52, 90)))
    # the lamp's warm light falls on the shelves behind
    glow(c, LAMP[0] + 150, LAMP[1] + 300, 700, WARM, 46)
    c.drawRect(skia.Rect(-2000, 1180, 3200, 4000), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 1160), skia.Point(0, 1500)], [C((10, 10, 28), 0), C((10, 10, 28), 220)])))


def floor(c, t):
    """the floor beyond the table, far below the edge"""
    fl = poly([(-2000, YF), (3200, YF), (3200 + TV[0] * 6, YF + TV[1] * 6), (-2000 + TV[0] * 6, YF + TV[1] * 6)])
    c.drawPath(fl, P((26, 22, 40)))
    c.save(); c.clipPath(fl, skia.ClipOp.kIntersect, True)
    for i in range(14):                                                   # floorboards running away from the camera
        x = -2000 + i * 260; c.drawLine(x, YF, x + TV[0] * 6, YF + TV[1] * 6, SP((18, 16, 32), 4))
    c.drawOval(skia.Rect(E - 300, YF - 160, E + 600, YF + 40), P(WARM, 26, MaskFilter=blur(60)))
    c.restore()
    c.drawRect(skia.Rect(-2000, YF, 3200, YF + 2000), P((20, 17, 32)))


def table(c, t):
    """the reading table: lit top, thick front edge, the end face at the edge, one leg"""
    WOOD, WOOD_SH, WOOD_HI, WOOD_D = (156, 98, 62), (108, 64, 44), (214, 156, 104), (70, 42, 36)
    # legs (back leg first)
    for (lx, ly, col) in ((E - 40 + TV[0], YTT + 46 + TV[1], WOOD_D), (E - 40, YTT + 46, WOOD_SH)):
        lg = poly([(lx - 26, ly), (lx + 26, ly), (lx + 22, YF + (ly - YTT - 46)), (lx - 22, YF + (ly - YTT - 46))])
        c.drawPath(lg, P(col)); c.drawRect(skia.Rect(lx + 10, ly, lx + 22, YF + (ly - YTT - 46)), P(mix(col, WOOD_HI, 0.25)))
    c.drawOval(skia.Rect(E - 130, YF - 14, E + 20, YF + 14), P((6, 4, 14), 160, MaskFilter=blur(10)))
    top = poly([(-1400, YTT), (E, YTT), (E + TV[0], YTT + TV[1]), (-1400 + TV[0], YTT + TV[1])])
    c.drawPath(top, P(WOOD))
    c.save(); c.clipPath(top, skia.ClipOp.kIntersect, True)
    for i in range(9):                                                    # grain along the length
        y = YTT + TV[1] * (i + 0.5) / 9; c.drawLine(-1400 + TV[0] * (i + 0.5) / 9, y, E + TV[0] * (i + 0.5) / 9, y + 2 * math.sin(i), SP(WOOD_SH, 2, 70))
    c.drawOval(skia.Rect(LAMP[0] - 320, YTT - 150, LAMP[0] + 560, YTT + 40), P(WARM, 120, MaskFilter=blur(60)))    # the lamp's pool of light
    c.drawRect(skia.Rect(-1400, YTT - 8, E + 200, YTT), P(WOOD_HI, 200))
    c.restore()
    front = poly([(-1400, YTT), (E, YTT), (E, YTT + 46), (-1400, YTT + 46)])
    c.drawPath(front, P(WOOD_SH)); c.drawRect(skia.Rect(-1400, YTT + 38, E, YTT + 46), P(WOOD_D))
    c.drawLine(E, YTT, E + TV[0], YTT + TV[1], SP(WOOD_HI, 3, 220))
    # a library reading desk: a closed front panel down to the floor, with raised panels; lit warm at the top, dark below
    PANEL, PANEL_SH = (118, 72, 48), (82, 48, 38)
    pn = skia.Rect(-1400, YTT + 46, E - 6, YF)
    c.drawRect(pn, skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, YTT + 46), skia.Point(0, YF)], [C(PANEL), C(mix(PANEL_SH, (20, 12, 26), 0.5))])))
    c.drawRect(skia.Rect(-1400, YTT + 46, E - 6, YTT + 66), P((10, 6, 18), 120, MaskFilter=blur(8)))
    for k in range(-5, 3):
        x0 = E - 70 - 330 * (k + 1) - 260; x1 = x0 + 260
        rp = skia.Rect(x0, YTT + 110, x1, YF - 90)
        c.drawRect(rp, P((0, 0, 0), 50)); c.drawRect(skia.Rect(x0, YTT + 110, x1, YTT + 118), P((10, 6, 18), 120))
        c.drawRect(skia.Rect(x0, YF - 98, x1, YF - 90), P(WOOD_HI, 60)); c.drawRect(skia.Rect(x1 - 8, YTT + 110, x1, YF - 90), P(WOOD_HI, 50))
    c.drawRect(skia.Rect(E - 66, YTT + 46, E - 6, YF), P(mix(PANEL, WOOD_HI, 0.15)))                      # the end stile at the edge
    c.drawRect(skia.Rect(E - 18, YTT + 46, E - 6, YF), P(WOOD_HI, 90))
    c.drawRect(skia.Rect(-1400, YF - 30, E - 6, YF), P(PANEL_SH))                                        # plinth
    c.drawOval(skia.Rect(LAMP[0] - 300, YTT + 30, LAMP[0] + 500, YTT + 260), P(WARM, 40, MaskFilter=blur(50)))
    # a couple of other books lying on the table to the left
    for (x, w, h, col, d) in ((-380, 230, 40, (90, 70, 120), 0), (-350, 190, 34, (150, 110, 70), 40)):
        y = YTT - 8 - d * 0.0 - (40 if d else 0)
        b = poly([(x, y), (x + w, y), (x + w + 60, y - 52), (x + 60, y - 52)]); c.drawPath(b, P(mix(col, WARM, 0.2)))
        c.drawRect(skia.Rect(x, y, x + w, y + h), P(col)); c.drawRect(skia.Rect(x + w - 10, y, x + w, y + h), P(PAGE_SH))


def lamp(c, t):
    """a brass pendant lamp hanging over the reading table on a chain: a dome shade, open underneath"""
    BR, BR_SH, BR_HI = (198, 150, 74), (128, 86, 40), (255, 222, 150)
    sx, sy = LAMP; sw = 1.5 * math.sin(t * 0.7)
    c.drawLine(sx, sy - 3000, sx + sw, sy - 74, SP((60, 50, 40), 5)); c.drawLine(sx + 2, sy - 3000, sx + 2 + sw, sy - 74, SP((120, 96, 60), 2))
    c.save(); c.translate(sx, sy - 74); c.rotate(sw * 0.4); c.translate(-sx, -(sy - 74))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(sx - 12, sy - 96, sx + 12, sy - 66), 5, 5), P(BR_SH))
    dome = smooth_closed([(sx - 92, sy), (sx - 80, sy - 40), (sx - 40, sy - 70), (sx, sy - 76), (sx + 40, sy - 70), (sx + 80, sy - 40), (sx + 92, sy)])
    shaded(c, dome, BR, BR_SH, sh=(-14, 0), rimL=BR_HI, rl=(5, 3))
    c.save(); c.clipPath(dome, skia.ClipOp.kIntersect, True); c.drawOval(skia.Rect(sx + 10, sy - 70, sx + 70, sy - 40), P(BR_HI, 150, MaskFilter=blur(8))); c.restore()
    c.drawOval(skia.Rect(sx - 92, sy - 12, sx + 92, sy + 12), P((255, 236, 190)))
    c.drawOval(skia.Rect(sx - 78, sy - 8, sx + 78, sy + 10), P((255, 250, 230)))
    c.restore()
    glow(c, sx, sy + 10, 150, (255, 214, 150), 120)


def beam(c, t, a=1.0):
    """the cone of light under the shade, with dust drifting in it"""
    sx, sy = LAMP; fl = 0.97 + 0.03 * math.sin(t * 23) * math.sin(t * 7.3)
    cone = poly([(sx - 86, sy + 6), (sx + 86, sy + 6), (sx + 420, YTT - 10), (sx - 300, YTT - 10)])
    sh = skia.GradientShader.MakeLinear([skia.Point(0, sy), skia.Point(0, YTT)], [C(WARM, int(70 * a * fl)), C(WARM, 0)])
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(18, 18)))
    c.drawPath(cone, skia.Paint(Shader=sh, BlendMode=SCREEN, AntiAlias=True)); c.restore()
    for (u, v, k, ph, al) in MOTES:
        yy = sy + 30 + ((v + t * 0.025 * k) % 1.0) * (YTT - sy - 60)
        w = lerp(80, 320, (yy - sy) / (YTT - sy))
        xx = sx + (u * 2 - 1) * w * 0.9 + 14 * math.sin(t * 0.5 * k + ph)
        c.drawCircle(xx, yy, 2.2 * k, skia.Paint(AntiAlias=True, Color=C((255, 236, 200), int(150 * al * a * (0.6 + 0.4 * math.sin(t * 1.3 + ph)))), BlendMode=SCREEN))


# ------------------------------------------------------------------------------------------------ books
def book(c, x, yb, i, a=1.0, ghost=0.0, lit=1.0, haze=0.0):
    """a hardback lying flat, spine toward the camera. x: left end of the spine, yb: bottom. i: which of the four (colour)."""
    base, sh, hi = BOOKS[i % len(BOOKS)]
    if haze > 0: HZ = (70, 82, 130); base, sh, hi = mix(base, HZ, haze), mix(sh, HZ, haze), mix(hi, HZ, haze)
    dx, dy = DV
    top = poly([(x, yb - T), (x + L, yb - T), (x + L + dx, yb - T + dy), (x + dx, yb - T + dy)])
    end = poly([(x, yb - T), (x + dx, yb - T + dy), (x + dx, yb + dy), (x, yb)])                 # the back (left) end: page block
    front = skia.Path(); front.addRRect(skia.RRect.MakeRectXY(skia.Rect(x, yb - T, x + L, yb), 9, 9))
    if ghost > 0.99:
        for pth in (top, end, front): c.drawPath(pth, P((200, 220, 255), 34 * a)); c.drawPath(pth, SP((214, 228, 255), 2.4, 150 * a))
        return
    al = 255 * a
    c.drawPath(end, P(mix(PAGE, PAGE_SH, 0.25), al))
    c.save(); c.clipPath(end, skia.ClipOp.kIntersect, True)
    for j in range(1, 9):
        yy = yb - T + 8 + j * (T - 16) / 9; c.drawLine(x, yy, x + dx, yy + dy, SP(PAGE_SH, 1.3, 170 * a))
    c.drawPath(poly([(x, yb - T), (x + dx, yb - T + dy), (x + dx, yb - T + dy + 7), (x, yb - T + 7)]), P(sh, al))
    c.drawPath(poly([(x, yb - 7), (x + dx, yb - 7 + dy), (x + dx, yb + dy), (x, yb)]), P(sh, al))
    c.restore()
    # top board, lit by the lamp
    c.drawPath(top, P(mix(hi, WARM, 0.18 * lit), al))
    c.drawPath(diffp(top, (0, -4)), P(mix(base, sh, 0.2), al))
    # the spine: rounded, so it is lit along its upper half and falls into shade underneath
    c.drawPath(front, P(base, al))
    c.save(); c.clipPath(front, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(x - 2, yb - T * 0.36, x + L + 2, yb + 2), P(sh, al))
    c.drawRect(skia.Rect(x - 2, yb - T * 0.86, x + L + 2, yb - T * 0.74), P(mix(base, hi, 0.55), 200 * a))
    for xx in (x + 16, x + L - 16):                                       # headband and tailband ends
        c.drawRect(skia.Rect(xx - 3, yb - T, xx + 3, yb), P(sh, al))
    for xx in (x + 0.2 * L, x + 0.27 * L, x + 0.73 * L, x + 0.8 * L):     # raised bands across the spine
        c.drawRect(skia.Rect(xx - 4, yb - T, xx + 4, yb), P(mix(base, hi, 0.35), al)); c.drawRect(skia.Rect(xx + 1, yb - T, xx + 4, yb), P(sh, al))
    lx0, lx1 = x + 0.34 * L + (i % 2) * 8, x + 0.66 * L - (i % 3) * 6       # the title panel, gold tooled
    lab = skia.Path(); lab.addRRect(skia.RRect.MakeRectXY(skia.Rect(lx0, yb - T * 0.78, lx1, yb - T * 0.24), 4, 4))
    c.drawPath(lab, P(mix(base, (20, 14, 20), 0.45), al)); c.drawPath(lab, SP(GOLD, 2.4, 230 * a))
    for k_ in range(2):
        yy = yb - T * (0.6 - k_ * 0.2); w_ = (lx1 - lx0) * (0.62 if k_ == 0 else 0.4)
        c.drawLine((lx0 + lx1) / 2 - w_ / 2, yy, (lx0 + lx1) / 2 + w_ / 2, yy, SP(GOLD, 3.2, 220 * a))
    c.drawCircle(x + 0.88 * L, yb - T * 0.5, 5, P(GOLD, 200 * a))
    c.restore()
    c.drawPath(diffp(front, (0, 3)), P(mix(hi, WARM, 0.3 * lit), 210 * a))        # rim along the top edge, from the lamp
    c.drawLine(x + 8, yb, x + L - 8, yb, SP((10, 6, 16), 3, 150 * a))


def stack_x(o):
    """left ends of the four books (top first) from their offsets o = (o1, o2, o3, o4): o1 top over book 2 ... o4 bottom past flush"""
    x4 = E - L + o[3]; x3 = x4 + o[2]; x2 = x3 + o[1]; x1 = x2 + o[0]
    return [x1, x2, x3, x4]


def draw_stack(c, xs, ybase=YTT, a=1.0, ghost=0.0, wob=None):
    """bottom book first. wob = (k, angle): the books from the top down to index k rock by `angle` degrees about the
    supporting edge under book k (they settle after the hand lets go)"""
    for j in (3, 2, 1, 0):
        yb = ybase - (3 - j) * T
        if wob and j <= wob[0] and abs(wob[1]) > 1e-3:
            k = wob[0]; px = (xs[k + 1] + L) if k < 3 else E; py = ybase - (3 - k) * T
            c.save(); c.translate(px, py); c.rotate(wob[1]); c.translate(-px, -py); book(c, xs[j], yb, j, a, ghost); c.restore()
        else:
            book(c, xs[j], yb, j, a, ghost)


def tall_state(n):
    """left ends, top first, of an n book stack built the classic way: book k from the top sticks out L/(2k) past the one below"""
    xs = []
    for k in range(1, n + 1):
        right = E + 0.5 * L * (H(n) - H(k - 1)); xs.append(right - L)
    return xs


def label(c, txt, x, y, size, col, a=255, face=None, bold=True):
    import layout as LY
    f = skia.Font(face or LY.XBOLD, size); w = f.measureText(txt); c.drawString(txt, x - w / 2, y, f, P(col, a))
    return w


def frac(c, num, den, x, y, size, col, a=255):
    """a stacked fraction centred on x; y is the top of the numerator"""
    import layout as LY
    f = skia.Font(LY.BLACK, size); wn = f.measureText(num); wd = f.measureText(den); w = max(wn, wd) + size * 0.25
    c.drawString(num, x - wn / 2, y + size * 0.8, f, P(col, a))
    c.drawLine(x - w / 2, y + size * 1.0, x + w / 2, y + size * 1.0, SP(col, max(2.5, size * 0.08), a))
    c.drawString(den, x - wd / 2, y + size * 1.95, f, P(col, a))
    return w
