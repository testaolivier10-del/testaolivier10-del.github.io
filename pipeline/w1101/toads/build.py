"""w1101-04-cane-toads (AP Environmental Science: invasive species). All code (skia), house flat style, knight v3 method.
Art plan:
- Shot A (hook): a Queensland sugar cane field on a bright 1935 morning, cane swaying in layers, hills in haze. A wooden crate
  tips open in the foreground and cane toads (code drawn: warty olive bodies, parotoid glands, golden eyes, folding legs) hop out.
- Shot B: up the cane stalk: a cane beetle sits high on a leaf; below, a toad leaps and falls well short (they are poor climbers).
- Shot C: on the ground the toads snap up other bugs with flicking tongues; a black snake strikes one toad, the toad's glands ooze
  white poison, the snake goes limp and still while the toad hops off (shown simply, no gore).
- Shot D: maps drawn in code: the Americas with the native range (south Texas to the central Amazon) and chips for predators
  and diseases; then Australia, where the range spreads from Gordonvale across the north and down the east coast with a year
  counter (Gulf by the 1960s, NSW border 1978, NT border 1984, WA border 2009, the Kimberley by about 2020; not to Sydney).
- Shot E: a country road at night, headlights sweeping over a road crowded with toads: millions, from one shipment.
Motion list for the accuracy check: beetles high on the cane out of reach; toads eat ground insects; a predator that bites a toad
dies (many do); native range in the Americas; the Australian range grows over decades in the order above.
CTA video (spoken line at the end).
"""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1101/lib']
import numpy as np, skia
from lpk import *
import layout as L

ID = 'w1101-04-cane-toads'
OUT = f'/home/claude/lp/w1101/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(brought=WD.at('brought'), toads=WD.at('toads'), save=WD.at('save'), backfired=WD.at('backfired'), beetles=WD.at('beetles'),
         high=WD.at('high'), reach=WD.at('reach'), so=WD.at('so'), ate=WD.at('ate'), poisonous=WD.at("poisonous"), many=WD.at('many'),
         died=WD.at('died'), back=None, americas=WD.at('americas'), predators=WD.at('predators'), diseases=WD.at('diseases'),
         inaus=None, nothing=WD.at('nothing'), invasive=WD.at('invasive'), now=WD.at('now'), millions=WD.at('millions'),
         first=WD.at('first'), free=WD.at('free'))
T['back'] = [x['t0'] for x in WD.w if x['w'].lower().strip('.,') == 'back'][0]
T['inaus'] = [x['t0'] for x in WD.w if x['w'].lower().strip('.,') == 'in'][3]
END = WD.end()
DUR = END + 1.6
EX = lambda w, n=1: [x['t0'] for x in WD.w if x['w'].lower().strip('.,') == w][n - 1]
CAP = Captions(WD.w, fix={'prep': '', 'dot': '', 'com.': '', 'level': 'levlprep.com'})
for _ch in CAP.chunks:
    _ch[:] = [x for x in _ch if x['d'] != '']
CAP.chunks = [ch for ch in CAP.chunks if ch]
R, Y, Wt, Tl = (255, 107, 107), (255, 210, 63), (255, 255, 255), (46, 230, 214)
SHOT_B = T['beetles'] - 0.35
SHOT_C = T['so'] - 0.3
SHOT_D = T['back'] - 0.3
SHOT_D2 = T['inaus'] - 0.2
SHOT_E = T['now'] - 0.3
TOAD, TOAD_SH, TOAD_DK, BELLY = (150, 124, 72), (110, 88, 50), (96, 76, 44), (230, 214, 170)


# ------------------------------------------------------------------ the cane toad (side view, faces +x)
def toad(c, x, y, s, t, hop=0.0, face=1, gulp=0.0, ooze=0.0, tongue=0.0, ph=0.0, shadow=True):
    """hop 0..1 through one leap (legs stretch mid air); y is the ground under the toad"""
    c.save(); c.translate(x, y); c.scale(s * face, s)
    lift = 4 * hop * (1 - hop)
    br = 1 + 0.03 * math.sin(t * 5 + ph)       # throat pumping
    if shadow: c.drawOval(skia.Rect(-46, -4, 46, 8), P((40, 30, 20), 90 * (1 - lift * 0.6), MaskFilter=blur(5)))
    c.translate(0, -lift * 90)
    c.rotate(-18 * math.sin(math.pi * hop))
    st = math.sin(math.pi * hop)
    # far legs
    c.drawPath(smooth_closed([(-30, -10), (-48 - 30 * st, 2 + 6 * st), (-30 - 40 * st, 8 + 10 * st), (-14, -2)]), P(TOAD_DK))
    # body
    body = smooth_closed([(-44, -14), (-36, -40), (-6, -52), (24, -46), (42, -30), (50, -16), (40, -4), (0, 2 * br), (-34, -2)])
    flat(c, body, TOAD, TOAD_SH, sh_off=(0, 9), rim=(255, 214, 140), rim_d=(0, -3), rim_a=180)
    belly = smooth_closed([(-30, -6), (0, -4), (38, -10), (42, -4), (0, 3 * br), (-30, 0)])
    c.drawPath(belly, P(BELLY))
    # warts
    rs = np.random.default_rng(3)
    for k in range(16):
        wx, wy = rs.uniform(-36, 30), rs.uniform(-46, -18)
        c.drawCircle(wx, wy, rs.uniform(2.2, 4.0), P(TOAD_DK))
        c.drawCircle(wx - 0.8, wy - 0.8, 1.2, P((196, 168, 110)))
    # parotoid gland behind the eye, oozing when attacked
    c.drawOval(skia.Rect(4, -50, 26, -38), P((176, 146, 86)))
    if ooze > 0.01:
        for k in range(3):
            c.drawPath(smooth_closed([(10 + k * 6, -40), (14 + k * 6, -40), (13 + k * 6, -40 + 16 * ooze + k * 3), (11 + k * 6, -40 + 16 * ooze + k * 3)]), P((248, 244, 230), 255 * ooze))
            c.drawCircle(12 + k * 6, -40 + 16 * ooze + k * 3, 3, P((248, 244, 230), 255 * ooze))
    # eye
    c.drawCircle(30, -44, 9, P((70, 56, 30)))
    c.drawCircle(31, -45, 6.5, P((214, 170, 60)))
    c.drawOval(skia.Rect(26, -47, 36, -43), P((20, 16, 12)))
    c.drawCircle(33, -48, 1.8, P((255, 250, 230)))
    # mouth line and tongue
    if tongue > 0.01:
        L_ = 70 * tongue
        c.drawLine(48, -20, 48 + L_, -26 - 10 * tongue, SP((226, 120, 130), 6))
        c.drawCircle(48 + L_, -26 - 10 * tongue, 6, P((236, 130, 140)))
    # near front leg and back leg (fold and stretch with the hop)
    # front leg: upper arm, forearm and a hand with three toes
    fx, fy = 36 + 12 * st, 2 + 4 * st
    arm = smooth_closed([(18, -22), (30, -20), (fx + 4, fy - 4), (fx - 6, fy), (20, -8)])
    flat(c, arm, TOAD, TOAD_SH, sh_off=(3, 0), rim=(255, 214, 140), rim_d=(-1.5, 0), rim_a=150)
    for k in range(3):
        c.drawLine(fx - 2, fy, fx + 4 + k * 6, fy + 3 - k * 0.5, SP(TOAD_SH, 4.5))
    # hind leg: a thick thigh along the side, the shin folded under it, a long webbed foot
    thigh = smooth_closed([(-44, -22), (-26, -30), (-8, -16), (-14, -4), (-36, -6)])
    flat(c, thigh, TOAD, TOAD_SH, sh_off=(0, 5), rim=(255, 214, 140), rim_d=(0, -2), rim_a=170)
    kx, ky = -10 - 40 * st, -4 + 16 * st
    ax_, ay_ = -40 - 60 * st, 4 + 16 * st
    shin = smooth_closed([(-14, -10), (kx + 4, ky - 4), (ax_, ay_ - 4), (ax_ - 2, ay_ + 4), (kx - 4, ky + 6), (-22, -2)])
    flat(c, shin, TOAD, TOAD_SH, sh_off=(0, 4), rim=(255, 214, 140), rim_d=(0, -2), rim_a=150)
    foot = smooth_closed([(ax_, ay_ - 3), (ax_ + 30 - 50 * st, ay_ - 1 + 6 * st), (ax_ + 34 - 56 * st, ay_ + 5 + 6 * st), (ax_, ay_ + 6)])
    c.drawPath(foot, P(TOAD_SH))
    # wide mouth line
    mp = skia.Path(); mp.moveTo(45, -21); mp.quadTo(36, -17, 26, -23)
    c.drawPath(mp, SP((80, 60, 34), 3))
    c.restore()


def hop_cycle(t, period, air, ph=0.0):
    """returns (cycles completed, hop phase 0..1 while airborne, else 0)"""
    u = (t + ph) / period
    n = math.floor(u); f = u - n
    return n, (f / air if f < air else 0.0)


# ------------------------------------------------------------------ the cane field
def sky_day(c, sun=True):
    lgrad(c, skia.Rect(-200, -200, 1300, 1300), 0, 1150, [(88, 160, 220), (150, 200, 236), (236, 236, 214)], [0, 0.6, 1])
    if not sun: return
    c.drawCircle(860, 600, 220, P((255, 246, 200), 120, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(860, 600, 46, P((255, 252, 236)))


def cane_row(c, t, y0, h, n, col, leaf, shade, sway_k, seed, x0=-80, step=40):
    rs = np.random.default_rng(seed)
    for k in range(n):
        x = x0 + k * step + rs.uniform(-8, 8); hh = h * rs.uniform(0.85, 1.1)
        sw = sway_k * math.sin(t * 1.4 + k * 0.5 + seed)
        top = (x + sw, y0 - hh)
        c.drawLine(x, y0, top[0], top[1], SP(col, 8 * (h / 500) + 3))
        for j in range(1, 5):
            f = j / 5; jy = y0 - hh * f; jx = x + sw * f
            c.drawLine(jx - 5, jy, jx + 5, jy, SP(shade, 3))
        for j in range(4):
            f = 0.55 + j * 0.13; lx = x + sw * f; ly = y0 - hh * f
            d = 1 if (j + k) % 2 else -1
            pth = skia.Path(); pth.moveTo(lx, ly)
            pth.quadTo(lx + d * 70 * (h / 500) + sw, ly - 60 * (h / 500), lx + d * 130 * (h / 500) + sw * 1.6, ly + 30 * (h / 500))
            c.drawPath(pth, SP(leaf, 7 * (h / 500) + 2))


def field(c, t, tilt=0.0, sun=True):
    c.save(); c.translate(0, tilt)
    sky_day(c, sun)
    pts = jag([(-200, 980), (200, 930), (500, 960), (900, 910), (1300, 950)], 2, 5)
    pth = ridge(pts); c.drawPath(pth, P((120, 150, 150)))
    c.save(); c.clipPath(pth, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(-200, 900, 1300, 1030), 900, 1030, [(200, 214, 210, 0), (210, 220, 210, 200)]); c.restore()
    cane_row(c, t, 1040, 140, 34, (150, 170, 90), (130, 168, 96), (110, 130, 70), 3, 1, step=36)
    c.drawRect(skia.Rect(-100, 1030, 1200, 1060), P((220, 226, 200), 120, MaskFilter=blur(10)))
    cane_row(c, t, 1120, 300, 22, (120, 150, 66), (100, 150, 74), (90, 110, 50), 6, 2, step=56)
    c.drawRect(skia.Rect(-100, 1110, 1200, 2000), P((132, 96, 64)))
    lgrad(c, skia.Rect(-100, 1110, 1200, 1250), 1110, 1250, [(170, 130, 90, 220), (132, 96, 64, 0)])
    rs = np.random.default_rng(6)
    for k in range(120):
        x, y = rs.uniform(-50, 1130), rs.uniform(1130, 1900)
        c.drawOval(skia.Rect(x - 8, y - 3, x + 8, y + 3), P((112, 80, 52)))
    c.restore()


def crate(c, x, y, t, lid):
    wood, wsh = (176, 132, 80), (136, 98, 58)
    box = skia.Path(); box.addRect(skia.Rect(x - 130, y - 150, x + 130, y))
    flat(c, box, wood, wsh, sh_off=(10, 0), rim=(255, 214, 150), rim_d=(-3, 0), rim_a=170)
    for k in range(4): c.drawLine(x - 130, y - 150 + k * 38 + 30, x + 130, y - 150 + k * 38 + 30, SP(wsh, 4))
    c.drawRect(skia.Rect(x - 130, y - 150, x + 130, y - 120), P((60, 40, 26)))   # open top shows the dark inside
    c.save(); c.translate(x + 130, y - 150); c.rotate(-110 * lid)
    lidp = skia.Path(); lidp.addRect(skia.Rect(-260, -14, 0, 0))
    flat(c, lidp, wood, wsh, sh_off=(0, 5), rim=(255, 214, 150), rim_d=(0, -2), rim_a=170)
    c.restore()
    f = skia.Font(L.XBOLD, 26); c.drawString('QUEENSLAND 1935', x - 112, y - 30, f, P((90, 60, 34)))


def shot_a(c, t):
    z = 2.25 + 0.12 * smooth(t / 5.5)
    c.save(); c.translate(540, 1060); c.scale(z, z); c.translate(-520, -1270)
    field(c, t, sun=False)
    lid = smooth(t / 0.3)
    crate(c, 470, 1330, t, lid)
    if t < 1.2:
        for k in range(6):
            r = 20 + 60 * t + k * 5
            c.drawCircle(470 - 120 + k * 50, 1180 - 30 * t, r, P((226, 206, 170), 150 * (1 - t / 1.2), MaskFilter=blur(10)))
    # toads hop out of the crate one after another, spreading into the field
    for i in range(12):
        t0 = 0.0 + i * 0.42
        if t < t0: continue
        u = t - t0
        n, hp = hop_cycle(u, 0.9, 0.55, 0)
        prog = n + (hp if hp > 0 else 1.0) if True else 0
        dirx = [1, 1, -1, 1, -1, 1, 1, -1, 1, 1, -1, 1][i]
        x = 470 + dirx * (190 + min(prog, 4) * 40) + (i % 6) * 10 * dirx
        y = 1330 + (i % 6) * 12 + min(prog, 4) * 4
        if prog < 1:      # the first leap out of the crate, from the rim
            y = 1190 + (1330 + (i % 6) * 12 - 1190) * prog - 120 * math.sin(math.pi * prog)
        toad(c, x, y, 1.0 - i * 0.03, t, hop=hp, face=dirx, ph=i, shadow=prog >= 1)
    c.restore()


def beetle(c, x, y, s, t):
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-20 + 4 * math.sin(t * 3))
    for k in range(3):
        a = -0.6 + k * 0.6
        c.drawLine(-6 + k * 10, 6, -16 + k * 14, 22 + 3 * math.sin(t * 6 + k), SP((40, 30, 24), 4))
    shell = smooth_closed([(-30, 0), (-24, -18), (0, -24), (24, -16), (30, 0), (0, 10)])
    flat(c, shell, (90, 62, 40), (60, 40, 26), sh_off=(0, 5), rim=(255, 220, 160), rim_d=(0, -2), rim_a=200)
    c.drawLine(0, -24, 0, 8, SP((50, 34, 22), 2.5))
    c.drawCircle(32, -4, 9, P((60, 40, 26)))
    c.restore()


def shot_b(c, t):
    tb = t - SHOT_B
    tilt = -60 * smooth(tb / 5)
    c.save(); c.translate(0, tilt)
    sky_day(c)
    c.drawRect(skia.Rect(-100, 1300, 1200, 2400), P((132, 96, 64)))
    cane_row(c, t, 1180, 200, 30, (140, 166, 90), (120, 160, 90), (100, 120, 60), 4, 11, step=38)
    c.drawRect(skia.Rect(-100, 1170, 1200, 1300), P((150, 140, 96)))
    rs_ = np.random.default_rng(13)
    for k in range(60):
        x = rs_.uniform(-50, 1130); h = rs_.uniform(14, 34); sw = 4 * math.sin(t * 2 + k)
        c.drawPath(poly([(x - 6, 1305), (x + sw, 1305 - h), (x + 6, 1305)]), P((110, 140, 70)))
    cane_row(c, t, 1320, 520, 9, (130, 158, 70), (110, 160, 80), (90, 110, 50), 7, 5, x0=-40, step=140)
    # the hero stalk with the beetle high up
    sx = 640; sw = 8 * math.sin(t * 1.3)
    c.drawLine(sx, 1340, sx + sw, 560, SP((150, 176, 80), 26))
    for j in range(1, 9):
        f = j / 9; c.drawLine(sx + sw * f - 14, 1340 - 780 * f, sx + sw * f + 14, 1340 - 780 * f, SP((110, 130, 60), 6))
    pth = skia.Path(); pth.moveTo(sx + sw * 0.8, 700); pth.quadTo(sx + 160, 600 + 6 * math.sin(t * 2), sx + 300, 670)
    c.drawPath(pth, SP((120, 170, 86), 22))
    beetle(c, sx + 150 + sw, 632, 1.5, t)
    # a toad below leaps and falls far short
    u = t - (T['high'] - 0.2)
    hp = 0.0
    if 0 <= u < 1.0: hp = u / 1.0
    toad(c, 470, 1320, 1.9, t, hop=hp, face=1)
    toad(c, 860, 1345, 1.6, t, hop=0.0, face=-1, ph=2)
    c.restore()
    if t > T['high']:
        L.chip(c, 'CANE BEETLE', 820, 560 + tilt, Y, 34, smooth((t - T['high']) / 0.3) * (1 - smooth((t - SHOT_C + 0.4) / 0.3)), anchor=(790, 612 + tilt))
    if t > T['reach'] - 0.2:
        L.chip(c, 'OUT OF REACH', 360, 980, R, 40, smooth((t - T['reach'] + 0.2) / 0.3))


def snake(c, t, x0, y0, strike, limp):
    pts = []
    for k in range(40):
        f = k / 39
        amp = 26 * (1 - limp) * (1 - f * 0.3)
        x = x0 + f * 420 - strike * 120 * (1 - f) ** 2
        y = y0 + amp * math.sin(f * 9 - t * 3 * (1 - limp)) + f * 10
        pts.append((x, y))
    for k in range(len(pts) - 1):
        w = 26 - 18 * (k / 39) ** 1.5
        c.drawLine(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], SP((30, 28, 34), w))
    bel = skia.Path(); bel.moveTo(pts[1][0], pts[1][1] + 8)
    for k in range(2, len(pts)): bel.lineTo(pts[k][0], pts[k][1] + (26 - 18 * (k / 39) ** 1.5) * 0.32)
    c.drawPath(bel, skia.Paint(AntiAlias=True, Color=C((196, 60, 54)), Style=skia.Paint.kStroke_Style, StrokeWidth=7, StrokeCap=skia.Paint.kButt_Cap, StrokeJoin=skia.Paint.kRound_Join))
    top = skia.Path(); top.moveTo(pts[1][0], pts[1][1] - 6)
    for k in range(2, len(pts)): top.lineTo(pts[k][0], pts[k][1] - (26 - 18 * (k / 39) ** 1.5) * 0.3)
    c.drawPath(top, skia.Paint(AntiAlias=True, Color=C((90, 86, 110), 160), Style=skia.Paint.kStroke_Style, StrokeWidth=3))
    hx, hy = pts[0]
    head = smooth_closed([(hx - 30, hy), (hx - 10, hy - 14), (hx + 10, hy - 10), (hx + 14, hy + 4), (hx - 10, hy + 12)])
    c.drawPath(head, P((24, 22, 28)))
    if limp < 0.5:
        c.drawCircle(hx - 14, hy - 4, 3, P((255, 220, 120)))
    else:
        c.drawLine(hx - 18, hy - 6, hx - 10, hy - 2, SP((200, 190, 180), 2.5))


def bug(c, x, y, t, k):
    c.save(); c.translate(x, y); c.scale(1.8, 1.8); c.translate(-x, -y)
    c.drawOval(skia.Rect(x - 10, y - 5, x + 10, y + 5), P((60, 70, 40)))
    c.drawLine(x - 4, y + 3, x - 10, y + 10, SP((40, 40, 30), 2)); c.drawLine(x + 4, y + 3, x + 10, y + 10, SP((40, 40, 30), 2))
    c.drawLine(x + 8, y - 2, x + 18, y - 10 - 3 * math.sin(t * 9 + k), SP((40, 40, 30), 2))
    c.restore()


def shot_c(c, t):
    tc = t - SHOT_C
    k2 = smooth((t - T['poisonous'] + 1.2) / 0.9)
    z = 2.6 + 0.0 * k2
    fx_, fy_ = 450 + 230 * k2, 1250 + 130 * k2
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-fx_, -fy_)
    field(c, t, tilt=0, sun=False)
    # toads eat everything else: tongues flick at bugs on the ground
    for i, (x, y) in enumerate(((220, 1250), (440, 1290), (690, 1240))):
        tf = T['ate'] + i * 0.45
        tg = math.exp(-((t - tf) / 0.12) ** 2)
        if t < tf: bug(c, x + 110 + 4 * math.sin(t * 4 + i), y - 30, t, i)
        if k2 < 0.5: toad(c, x, y, 1.0, t, tongue=tg, ph=i)
    # the snake and the poison
    st = T['many'] - 0.4
    strike = smooth((t - st) / 0.25)
    limp = smooth((t - T['died'] + 0.3) / 0.8)
    ooze = smooth((t - st - 0.3) / 0.4)
    if t > T['poisonous'] - 1.0:
        sx = 1180 - 420 * smooth((t - T['poisonous'] + 1.0) / 1.2)
        thp = 0.0
        if t > T['died'] + 0.3:
            n, thp = hop_cycle(t - T['died'] - 0.3, 0.8, 0.5)
            dx = -90 * (n + (thp if thp > 0 else 1))
        else:
            dx = 0
        toad(c, 640 + dx, 1400, 1.25, t, hop=thp, face=1 if dx == 0 else -1, ooze=ooze * (1 - smooth((t - T['died'] - 1.2) / 0.6)))
        snake(c, t, sx, 1370, strike, limp)
    c.restore()
    if t > T['poisonous']:
        k2 = 1.0; z = 2.5; fx_, fy_ = 680, 1380
        L.chip(c, 'POISON GLANDS', 420, 760, Y, 42, smooth((t - T['poisonous']) / 0.3) * (1 - smooth((t - SHOT_D + 0.3) / 0.3)), anchor=(540 + (655 - fx_) * z, 1000 + (1400 - 52 * 1.25 - fy_) * z))


# ------------------------------------------------------------------ maps
AMER = [(-165, 64), (-162, 70), (-140, 70), (-120, 69), (-95, 68), (-82, 66), (-78, 62), (-94, 59), (-92, 57), (-82, 55), (-79, 52), (-65, 60),
        (-60, 55), (-56, 52), (-60, 47), (-66, 44), (-70, 42), (-74, 40), (-76, 35), (-81, 31), (-80, 26), (-82, 25.5), (-82.8, 28), (-85, 30),
        (-89, 30), (-94, 29.5), (-97, 26), (-97.5, 22), (-95, 18.5), (-91, 18.5), (-90, 21.3), (-87, 21.5), (-88, 16), (-84, 15), (-83.5, 11),
        (-79.5, 9), (-77.5, 8.5), (-75, 10.5), (-71.5, 12), (-64, 10.5), (-60, 8.5), (-52, 5), (-50, 1), (-44, -2.5), (-35, -5.5), (-35, -9),
        (-39, -15), (-40, -21), (-45, -23.5), (-48.5, -26), (-53, -34), (-58, -38.5), (-62, -39), (-65, -42), (-67.5, -46.5), (-66, -48),
        (-69, -51), (-68.5, -54.8), (-72, -53.5), (-75, -50), (-74, -44), (-73.5, -37), (-71.5, -30), (-70.5, -18.5), (-75.5, -15), (-80, -7),
        (-81, -4.5), (-80, -1), (-78.5, 1.5), (-77.5, 4), (-77.5, 7), (-80, 7.5), (-83, 8.3), (-86, 11.5), (-88, 13.2), (-91.5, 14), (-94, 16),
        (-97, 16), (-101, 17.5), (-105.5, 20), (-105.5, 23), (-109.5, 23.2), (-112, 28), (-114.5, 31), (-117, 32.5), (-120.5, 34.5), (-124, 40),
        (-124.5, 46), (-123, 48), (-127, 50.5), (-131, 54), (-136, 58), (-140, 59.8), (-148, 60.5), (-152, 58), (-158, 56.5), (-165, 54.5),
        (-162, 58), (-166, 61)]
NATIVE = [(-99, 27.5), (-97, 26), (-97.5, 22), (-95, 18.5), (-91, 18.5), (-90, 21), (-87.5, 21.3), (-88, 16), (-84, 15), (-83.5, 11), (-79.5, 9),
          (-75, 10.5), (-71.5, 12), (-64, 10.5), (-60, 8.5), (-52, 5), (-50, 1), (-46, -2), (-48, -8), (-55, -12), (-63, -13), (-70, -11), (-75, -6),
          (-79, -2), (-79, 2), (-77.5, 7), (-80, 7.5), (-83, 8.3), (-86, 11.5), (-88, 13.2), (-91.5, 14), (-94, 16), (-97, 16), (-101, 17.5),
          (-105, 20), (-104, 24), (-100, 26)]
AUS = [(113.5, -22), (113.4, -24.5), (114, -26.5), (114.9, -29), (115.0, -31.5), (115.6, -33.5), (115, -34.3), (117.5, -35), (119.5, -34.4),
       (123.5, -33.9), (126, -32.3), (129, -31.6), (131.2, -31.5), (133.8, -32.1), (135.2, -34.6), (136.4, -34.0), (137.8, -32.8), (137.6, -35.2),
       (138.6, -34.8), (139.6, -36.9), (140.6, -38.0), (143.5, -38.8), (146.3, -39.1), (147.9, -37.9), (149.9, -37.5), (150.2, -35.8), (151.2, -33.9),
       (152.5, -32.4), (153.1, -30.3), (153.6, -28.6), (153.1, -26.0), (152.4, -24.7), (150.8, -22.6), (149.4, -21.0), (147.4, -19.4), (146.2, -18.6),
       (145.4, -16.5), (145.3, -15.0), (143.8, -14.1), (143.5, -12.5), (142.5, -10.7), (141.6, -12.6), (141.5, -15), (141.4, -16.8), (140.8, -17.5),
       (139.5, -17.5), (138, -16.8), (136.8, -15.9), (135.5, -15), (135.9, -13.3), (136.6, -12.2), (135, -12.1), (132.6, -11.5), (131.0, -12.2),
       (130.2, -13.1), (129.4, -14.9), (128.1, -15.2), (127.0, -14.0), (125.2, -14.5), (124.0, -16.3), (122.9, -16.4), (122.2, -18.0), (121.1, -19.5),
       (119.0, -20.2), (116.7, -20.6), (114.6, -21.8)]
TAS = [(144.6, -40.7), (148.3, -40.9), (148, -43.2), (146, -43.6), (145, -42)]
RANGE = [(122.3, -17.5), (123.8, -16.2), (125.2, -14.5), (127, -14), (128.1, -15.2), (129.4, -14.9), (130.2, -13.1), (131, -12.2), (132.6, -11.5),
         (135, -12.1), (136.6, -12.2), (135.9, -13.3), (135.5, -15), (136.8, -15.9), (138, -16.8), (139.5, -17.5), (140.8, -17.5), (141.4, -16.8),
         (141.5, -15), (141.6, -12.6), (142.5, -10.7), (143.5, -12.5), (143.8, -14.1), (145.3, -15), (145.4, -16.5), (146.2, -18.6), (147.4, -19.4),
         (149.4, -21), (150.8, -22.6), (152.4, -24.7), (153.1, -26), (153.6, -28.6), (153.1, -30.3), (152.2, -30.5), (150.5, -29.5), (148.5, -28.2),
         (147, -26.8), (145.5, -25.0), (143.5, -23.2), (141, -22.0), (138.5, -21.0), (136, -20.4), (133, -19.6), (129, -19.4), (126, -19.6), (123.5, -19.2)]
BORDERS = [((138, -16.8), (138, -26), 1984), ((129, -14.9), (129, -31.6), 2009), ((141, -26), (141, -29), 1978), ((141, -29), (153.6, -28.2), 1978),
           ((129, -26), (141, -26), 0), ((141, -17.5), (141, -26), 0), ((141, -29), (141, -38), 0)]
GORDONVALE = (145.8, -17.1)


def proj(pts, lon0, lon1, lat0, lat1, box):
    x0, y0, x1, y1 = box
    return [(x0 + (lo - lon0) / (lon1 - lon0) * (x1 - x0), y0 + (lat1 - la) / (lat1 - lat0) * (y1 - y0)) for lo, la in pts]


def sea(c, t):
    lgrad(c, skia.Rect(-100, -100, 1200, 2100), 400, 1500, [(30, 70, 120), (20, 46, 90)])
    for k in range(8):
        y = 560 + k * 110 + 6 * math.sin(t + k)
        pth = skia.Path(); pth.moveTo(-50, y)
        for x in range(-50, 1150, 60): pth.lineTo(x, y + 8 * math.sin(x * 0.02 + t * 1.2 + k))
        c.drawPath(pth, SP((70, 120, 170), 3, 70))


def land(c, pts, a=255):
    pth = smooth_closed(pts) if len(pts) > 6 else poly(pts)
    c.drawPath(pth, P((0, 0, 0), 70, MaskFilter=blur(12)))
    flat(c, pth, (204, 180, 120), (180, 154, 100), sh_off=(8, 8), rim=(255, 226, 170), rim_d=(-3, -3), rim_a=60, a=a)
    return pth


def shot_d1(c, t):
    box = (330, 470, 1010, 1380)   # lon -170..-30, lat 72..-56 -> keep aspect roughly
    lon0, lon1, lat0, lat1 = -170, -30, -56, 72
    sea(c, t)
    z = 1.0 + 0.04 * smooth((t - SHOT_D) / 4)
    c.save(); c.translate(560, 920); c.scale(z, z); c.translate(-560, -920)
    pa = proj(AMER, lon0, lon1, lat0, lat1, (120, 520, 1000, 1400))
    land(c, pa)
    nat = proj(NATIVE, lon0, lon1, lat0, lat1, (120, 520, 1000, 1400))
    a = smooth((t - T['americas'] + 0.2) / 0.5)
    pth = smooth_closed(nat)
    c.drawPath(pth, P((110, 150, 70), 210 * a))
    c.drawPath(pth, SP((70, 110, 50), 3, 255 * a))
    c.restore()
    toad(c, 180, 1320, 2.0, t, ph=1)
    L.chip(c, 'NATIVE RANGE', 700, 980, Tl, 34, a)
    L.chip(c, 'PREDATORS', 650, 1080, Y, 40, smooth((t - T['predators']) / 0.3))
    L.chip(c, 'DISEASES', 700, 1150, Y, 40, smooth((t - T['diseases']) / 0.3))


def arrival(lon, lat):
    """an organic front from Gordonvale: slow to the west at first, faster along the east coast, then a quicker push west
    across the Top End (Gulf by the 1960s, NSW border 1978, NT border 1984, WA border 2009)"""
    dx, dy = lon - GORDONVALE[0], lat - GORDONVALE[1]
    d = math.hypot(dx, dy) or 1e-6
    w = max(0.0, min(1.0, -dx / d))
    south = 1935 + 3.2 * d
    west = 1935 + 5.6 * d if d <= 5 else (1963 + (d - 5) * 7.5 if d <= 7.8 else 1984 + (d - 7.8) * 2.7)
    noise = 2.5 * math.sin(lon * 1.7 + lat * 2.3) + 1.5 * math.sin(lon * 0.6 - lat * 1.1)
    return w * west + (1 - w) * south + noise


def in_poly(x, y, pts):
    ins = False; n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1): ins = not ins
    return ins


CELLS = [(lo, la, arrival(lo, la)) for lo in np.arange(121.0, 154.5, 0.5) for la in np.arange(-31.5, -10, 0.5) if in_poly(lo, la, RANGE)]


def shot_d2(c, t):
    lon0, lon1, lat0, lat1 = 110, 156, -46, -8
    box = (40, 560, 1040, 1386)
    sea(c, t)
    z = 1.0 + 0.04 * smooth((t - SHOT_D2) / 6)
    c.save(); c.translate(540, 980); c.scale(z, z); c.translate(-540, -980)
    land(c, proj(AUS, lon0, lon1, lat0, lat1, box))
    land(c, proj(TAS, lon0, lon1, lat0, lat1, box))
    # the year runs from 1935 to 2020 while "almost nothing did ... invasive species" plays
    y0, y1 = T['inaus'] + 0.2, T['invasive'] + 0.8
    year = 1935 + 85 * smooth((t - y0) / (y1 - y0))
    sx = (box[2] - box[0]) / (lon1 - lon0); sy = (box[3] - box[1]) / (lat1 - lat0)
    rpath = smooth_closed(proj(RANGE, lon0, lon1, lat0, lat1, box))
    c.save(); c.clipPath(rpath, skia.ClipOp.kIntersect, True)
    c.saveLayer(None, P((255, 255, 255), 225, ImageFilter=skia.ImageFilters.Blur(6, 6)))
    for lo, la, ar in CELLS:
        if ar <= year:
            g = min(1.0, (year - ar) / 3)
            x = box[0] + (lo - lon0) * sx; y = box[1] + (lat1 - la) * sy
            c.drawCircle(x, y, 0.62 * sx * (0.5 + 0.5 * g), P((96, 126, 56)))
    c.restore(); c.restore()
    # state borders, faint; each pulses as the front reaches it
    for (a0, a1, yr) in BORDERS:
        p0, p1 = proj([a0, a1], lon0, lon1, lat0, lat1, box)
        pul = math.exp(-((year - yr) / 3.5) ** 2) if yr else 0.0
        eff = skia.DashPathEffect.Make([10, 8], 0)
        c.drawLine(*p0, *p1, skia.Paint(AntiAlias=True, Color=C((255, 250, 230) if pul < 0.1 else Y, 110 + 145 * pul), Style=skia.Paint.kStroke_Style, StrokeWidth=3 + 5 * pul, PathEffect=eff))
    gx, gy = proj([GORDONVALE], lon0, lon1, lat0, lat1, box)[0]
    c.drawCircle(gx, gy, 10, P(R)); c.drawCircle(gx, gy, 18 + 6 * math.sin(t * 6), SP(R, 3))
    c.restore()
    toad(c, 560, 1335, 1.6, t, face=-1, ph=2)
    L.chip(c, 'GORDONVALE 1935', gx + 20, gy - 70, R, 30, smooth((t - SHOT_D2) / 0.3), anchor=(gx, gy - 10))
    L.chip(c, str(int(year)), 300, 1230, Wt, 56, smooth((t - y0 + 0.3) / 0.3))


# ------------------------------------------------------------------ night road
TOADS_N = [(np.random.default_rng(k).uniform(-60, 1140), np.random.default_rng(k + 99).uniform(980, 1420), k) for k in range(60)]


def shot_e(c, t):
    te = t - SHOT_E
    zz = 1.0 + 0.2 * smooth(te / 7)
    c.save(); c.translate(540, 1150); c.scale(zz, zz); c.translate(-540, -1150)
    lgrad(c, skia.Rect(-100, -100, 1200, 1200), 300, 1100, [(10, 14, 36), (34, 40, 76), (60, 56, 90)])
    rs = np.random.default_rng(11)
    for k in range(70):
        c.drawCircle(rs.uniform(0, 1080), rs.uniform(500, 1000), rs.uniform(0.8, 2), P((240, 240, 255), 120 + 80 * math.sin(t * 2 + k)))
    c.drawCircle(220, 640, 40, P((236, 236, 250)))
    hills_n = ridge(jag([(-100, 960), (300, 900), (700, 940), (1200, 890)], 3, 5)); c.drawPath(hills_n, P((26, 30, 54)))
    cane_row(c, t, 960, 200, 30, (40, 60, 50), (36, 56, 48), (30, 46, 40), 4, 7, step=38)
    c.drawRect(skia.Rect(-100, 950, 1200, 2000), P((40, 40, 52)))
    pth = poly([(420, 950), (660, 950), (1400, 1900), (-320, 1900)])
    c.drawPath(pth, P((62, 60, 70)))
    for k in range(6):
        f = ((k / 6 + te * 0.15) % 1.0)
        y = 950 + 900 * f * f; w = 6 + 30 * f
        c.drawRect(skia.Rect(540 - w / 2, y, 540 + w / 2, y + 20 + 60 * f), P((220, 210, 170), 200))
    # headlight wash from behind the camera
    sweep = smooth((t - T['first'] - 0.3) / 1.5)
    hl = skia.GradientShader.MakeRadial(skia.Point(540 + 300 * math.sin(sweep * 2.2), 1700), 900, [C((255, 236, 180), 60 + 50 * sweep), C((255, 236, 180), 0)], [0, 1])
    c.drawRect(skia.Rect(-100, 1000, 1200, 2000), skia.Paint(Shader=hl, BlendMode=skia.BlendMode.kScreen))
    cone = smooth((t - T['first'] - 0.2) / 0.6)
    bx = 540 + 260 * math.sin((t - T['first']) * 1.2)
    if cone > 0:
        c.drawPath(poly([(bx - 60, 1900), (bx + 60, 1900), (bx + 300, 950), (bx - 300, 950)]), P((255, 240, 190), 60 * cone, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    # toads everywhere, hopping at random; more appear on "millions"
    cnt = int(14 + 30 * smooth((t - SHOT_E) / 3.5) + 16 * smooth((t - T['free'] - 0.2) / 1.2))
    order = sorted(TOADS_N[:cnt], key=lambda q: q[1])
    for x, y, k in order:
        if not (420 - (y - 950) * 0.78 - 60 < x < 660 + (y - 950) * 0.78 + 60): continue
        if y > 1220 and x < 430: continue
        n, hp = hop_cycle(t, 1.6 + (k % 5) * 0.3, 0.22, k * 0.37)
        s = 0.4 + (y - 950) / 450 * 1.0
        toad(c, x + (n % 3) * 20 * (1 if k % 2 else -1), y, s, t, hop=hp, face=1 if k % 2 else -1, ph=k)
    # the late wave: big toads hop toward the camera through the headlights
    for j in range(4):
        t0 = T['free'] - 0.6 + j * 0.45
        if t < t0: continue
        u = min(1.0, (t - t0) / 2.4)
        n, hp = hop_cycle(t - t0, 0.6, 0.4, 0)
        x = [700, 820, 640, 900][j] + 30 * math.sin(j)
        y = 1040 + 300 * u
        toad(c, x, y, 0.8 + 1.2 * u, t, hop=hp, face=-1 if j % 2 else 1, ph=j)
    c.drawRect(skia.Rect(-200, 900, 1300, 2000), P((20, 24, 60), 60))
    c.restore()
    L.chip(c, '1935: ABOUT 100', 540, 800, Wt, 44, smooth((t - T['first']) / 0.3))


def titles(c, t):
    L.title(c, [[('CANE TOADS', Y)], [('TO SAVE THE CANE', Wt)]], t, -0.5, T['backfired'] - 0.1)
    L.title(c, [[('IT ', Wt), ('BACKFIRED', R)]], t, T['backfired'], SHOT_B)
    L.title(c, [[('THE BEETLES', Wt)], [('LIVED UP HIGH', Y)]], t, SHOT_B + 0.1, SHOT_C)
    L.title(c, [[('THEY ATE', Wt)], [('EVERYTHING ELSE', Y)]], t, SHOT_C + 0.1, T['poisonous'] - 0.1)
    L.title(c, [[('AND THEY’RE', Wt)], [('POISONOUS', R)]], t, T['poisonous'], SHOT_D)
    L.title(c, [[('AT HOME,', Wt)], [('KEPT IN CHECK', Tl)]], t, SHOT_D + 0.1, SHOT_D2)
    L.title(c, [[('IN AUSTRALIA,', Wt)], [('ALMOST NOTHING', R)]], t, SHOT_D2 + 0.1, T['invasive'] - 0.1)
    L.title(c, [[('AN INVASIVE', Wt)], [('SPECIES', Y)]], t, T['invasive'], SHOT_E)
    L.title(c, [[('MILLIONS', R)], [('FROM ONE SHIPMENT', Wt)]], t, SHOT_E + 0.1, None)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    if t < SHOT_B: shot_a(c, t)
    elif t < SHOT_C: shot_b(c, t)
    elif t < SHOT_D: shot_c(c, t)
    elif t < SHOT_D2: shot_d1(c, t)
    elif t < SHOT_E: shot_d2(c, t)
    else: shot_e(c, t)
    for tc in (SHOT_B, SHOT_C, SHOT_D, SHOT_D2, SHOT_E):
        d = abs(t - tc)
        if d < 0.14: c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 24), 230 * (1 - d / 0.14)))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((10, 8, 16), 120)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    L.fades(c)
    L.badge(c, 'AP ENVIRONMENTAL SCIENCE')
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
