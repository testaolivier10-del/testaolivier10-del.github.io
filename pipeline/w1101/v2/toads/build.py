"""w1101-04-cane-toads REBUILD (Olivier 2026-11-02: story voice, premises first; toads never appear from nowhere; the
QUEENSLAND 1935 label must fit). Every shot shows the line being said.

A  0.0  crate   1935, a cane field: a slatted crate sits at the edge of the field, rattling; golden eyes and a toe poke through
                the slats (the toads are inside from frame 0). Slow push in.            "shipped in about a hundred cane toads"
B1 6.0  leaves  Close on a cane leaf: beetles chew it, bite marks spread across the leaf. "Beetles were eating the crops"
B2 7.9  crate   Back on the crate: the lid swings open and the toads climb over the rim and hop toward the cane. "the plan"
C 10.5  stalk   Up a tall stalk: the beetle high on a leaf; a toad leaps and falls far short.     "where the toads couldn't reach"
D 14.8  ground  Toads snap up other bugs; a snake strikes a toad, the glands ooze, the snake goes limp.  "poisonous... died"
E 22.9  map     The Americas: native range, predators and diseases.                           "kept cane toads in check"
F 27.5  map     Australia: the range spreads from Gordonvale with a year counter 1935 to 2020. "almost nothing did... invasive"
G 33.4  road    A country road at night crowded with toads in the headlights: millions, from that first shipment. CTA.
"""
import sys, math, json, importlib.util
sys.path[:0] = ['/home/claude/lp/w1101/lib']
import numpy as np, skia
from lpk import *
import layout as L

# the old build supplies the drawing kit (toad, field, cane rows, beetle, snake, bug, maps); its shots read its module
# globals T and SHOT_*, which are re-pointed at the new voice timings below
_spec = importlib.util.spec_from_file_location('old', '/home/claude/lp/w1101/toads/build.py')
old = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(old)
toad, field, cane_row, beetle, hop_cycle, flat, smooth_closed = old.toad, old.field, old.cane_row, old.beetle, old.hop_cycle, old.flat, old.smooth_closed

VO = json.load(open('/home/claude/toads2/vo/words.json'))
_W = [x['w'].strip('.,!?') for x in VO]


def at(w, n=1, case=False):
    k = 0
    for i, x in enumerate(_W):
        if (x == w) if case else (x.lower() == w.lower()):
            k += 1
            if k == n: return VO[i]['t0']
    raise KeyError(w)


END = VO[-1]['t1']
DUR = round(END + 1.6, 2)
T = dict(shipped=at('shipped'), toads=at('toads'), save=at('save'), beetles=at('Beetles'), eating=at('eating'), crops=at('crops'),
         plan_toads=at('toads', 2), supposed=at('supposed'), but=at('But'), high=at('high'), reach=at('reach'), so=at('So'), ate=at('ate'),
         poisonous=at('poisonous'), many=at('many'), died=at('died'), back=at('Back'), americas=at('Americas'), predators=at('predators'),
         diseases=at('diseases'), inaus=at('In', 2, case=True), nothing=at('nothing'), invasive=at('invasive'), today=at('Today'),
         millions=at('millions'), first=at('first'), free=at('Free'))
SHOT_B1 = T['beetles'] - 0.25
SHOT_B2 = at('and', 1) - 0.1           # "and the toads were supposed to eat the beetles"
SHOT_C = T['but'] - 0.25
SHOT_D = T['so'] - 0.3
SHOT_E = T['back'] - 0.3
SHOT_F = T['inaus'] - 0.2
SHOT_G = T['today'] - 0.3
# the old shots read these
old.T.update(dict(high=T['high'], reach=T['reach'], ate=T['ate'], poisonous=T['poisonous'], many=T['many'], died=T['died'],
                  americas=T['americas'], predators=T['predators'], diseases=T['diseases'], inaus=T['inaus'], invasive=T['invasive'],
                  first=T['first'], free=T['free'], now=T['today'], millions=T['millions']))
old.SHOT_B, old.SHOT_C, old.SHOT_D, old.SHOT_D2, old.SHOT_E = SHOT_C, SHOT_D, SHOT_E, SHOT_F, SHOT_G
old.T['high'] = at("couldn't") - 0.45       # the toad's failed leap lands on "couldn't reach"
old.SHOT_D = T['died'] + 0.5                 # the POISON GLANDS chip leaves once the snake has died

CAP = Captions(VO, fix={'prep': '', 'dot': '', 'com.': '', 'level': 'levlprep.com'})
for _ch in CAP.chunks:
    _ch[:] = [x for x in _ch if x['d'] != '']
CAP.chunks = [ch for ch in CAP.chunks if ch]
R, Y, Wt, Tl = (255, 107, 107), (255, 210, 63), (255, 255, 255), (46, 230, 214)


# ------------------------------------------------------------------ the crate, with a label that is measured to fit
def crate(c, x, y, t, lid, rattle=0.0, peek=1.0):
    wood, wsh, gap = (176, 132, 80), (136, 98, 58), (40, 26, 16)
    c.save(); c.translate(x, y); c.rotate(rattle); c.translate(-x, -y)
    box = skia.Path(); box.addRect(skia.Rect(x - 150, y - 170, x + 150, y))
    flat(c, box, wood, wsh, sh_off=(10, 0), rim=(255, 214, 150), rim_d=(-3, 0), rim_a=170)
    # slats with dark gaps; toads inside show through them
    for k in range(3):
        gy = y - 170 + 36 + k * 44
        c.drawRect(skia.Rect(x - 150, gy, x + 150, gy + 20), P(gap))
    # toad faces pressed to the gaps: olive skin, warts, golden eyes that blink and shift
    for k, (ex, row, ph) in enumerate([(-90, 0, 0.0), (-20, 1, 1.3), (60, 0, 2.1), (110, 1, 0.7), (-110, 1, 2.6), (20, 2, 1.9)]):
        gy = y - 170 + 36 + row * 44 + 10
        sh = 4 * math.sin(t * 1.3 + ph * 2)
        a = 255 * peek
        c.save(); c.clipRect(skia.Rect(x - 150, gy - 10, x + 150, gy + 10))
        c.drawOval(skia.Rect(x + ex + sh - 30, gy - 16, x + ex + sh + 30, gy + 22), P((130, 106, 60), a))
        for wx in (-20, 16, 2): c.drawCircle(x + ex + sh + wx, gy + 6, 3, P((96, 76, 44), a))
        blink = 0.2 if math.sin(t * 1.7 + ph * 3) > 0.93 else 1.0
        for dx in (-11, 11):
            c.drawOval(skia.Rect(x + ex + sh + dx - 8, gy - 6 * blink, x + ex + sh + dx + 8, gy + 6 * blink), P((214, 170, 60), a))
            c.drawOval(skia.Rect(x + ex + sh + dx - 4, gy - 2 * blink, x + ex + sh + dx + 4, gy + 2 * blink), P((20, 16, 12), a))
        c.restore()
    # a toe pokes out of the lower gap and wiggles
    tx = x - 60 + 6 * math.sin(t * 5)
    c.drawPath(smooth_closed([(tx - 10, y - 170 + 124), (tx + 10, y - 170 + 124), (tx + 14, y - 170 + 142 + 4 * math.sin(t * 4)), (tx - 8, y - 170 + 140)]), P((150, 124, 72), 255 * peek))
    # the stencilled label: font sized from its measured width so it always fits the crate face with padding
    txt = 'QUEENSLAND 1935'
    f = skia.Font(L.XBOLD, 30); w = f.measureText(txt)
    size = 30 * min(1.0, (300 - 2 * 26) / w); f = skia.Font(L.XBOLD, size); w = f.measureText(txt)
    lb = skia.Rect(x - w / 2 - 14, y - 34 - size, x + w / 2 + 14, y - 22)
    c.drawRoundRect(lb, 6, 6, P((214, 178, 120)))
    c.drawString(txt, x - w / 2, y - 30, f, P((90, 60, 34)))
    c.restore()
    # the lid, hinged on the right top edge
    c.save(); c.translate(x + 900 * lid ** 1.6, y - 170 - 420 * lid); c.rotate(24 * lid)
    lidp = skia.Path(); lidp.addRect(skia.Rect(-150, -16, 150, 0))
    flat(c, lidp, wood, wsh, sh_off=(0, 5), rim=(255, 214, 150), rim_d=(0, -2), rim_a=170)
    c.restore()


def shot_a(c, t):
    """1935: the crate at the edge of the cane field, toads inside, rattling; slow push in"""
    z = 2.5 + 0.3 * smooth(t / SHOT_B1)
    c.save(); c.translate(540, 980); c.scale(z, z); c.translate(-470, -1250)
    field(c, t, sun=False)
    c.drawOval(skia.Rect(470 - 170, 1322, 470 + 170, 1342), P((60, 40, 26), 120, MaskFilter=blur(6)))
    rat = 1.6 * math.sin(t * 23) * (0.5 + 0.5 * math.sin(t * 2.1)) if (t % 1.6) < 0.5 else 0.0
    crate(c, 470, 1330, t, 0.0, rattle=rat)
    c.restore()


def leaf_bites(t):
    return 0.35 + 0.65 * smooth((t - SHOT_B1 - 0.2) / 1.6)


def shot_b1(c, t):
    """close on a cane leaf: beetles chew it, notches spread along the edge"""
    u = (t - SHOT_B1) / (SHOT_B2 - SHOT_B1)
    old.sky_day(c, sun=False)
    c.drawRect(skia.Rect(0, 0, W, H), P((80, 120, 60), 120))
    for k in range(5):
        cane_row(c, t, 1500 + k * 10, 900, 6, (110, 140, 60), (100, 150, 70), (80, 100, 46), 6, 30 + k, x0=-60 + k * 40, step=230)
    c.drawRect(skia.Rect(0, 0, W, H), P((40, 60, 30), 70))
    c.save(); c.translate(540, 900); c.rotate(-14 + 4 * u); c.scale(1.0 + 0.06 * u, 1.0 + 0.06 * u)
    # a big leaf blade across the frame, with bite notches cut out of its edges
    leaf = smooth_closed([(-620, 40), (-300, -70), (0, -110), (300, -90), (620, -10), (300, 60), (0, 90), (-300, 80)])
    b = leaf_bites(t)
    bites = skia.Path()
    for k in range(9):
        g = smooth(b * 9 - k)
        if g <= 0: continue
        bx = -420 + k * 100; top = k % 2 == 0
        by = (-84 if top else 70) + (8 if top else -8)
        bites.addCircle(bx, by, 34 * g)
    leaf_cut = old.op(leaf, bites, skia.PathOp.kDifference_PathOp) if hasattr(old, 'op') else skia.Op(leaf, bites, skia.PathOp.kDifference_PathOp)
    flat(c, leaf_cut, (120, 168, 84), (92, 136, 64), sh_off=(0, 10), rim=(255, 236, 170), rim_d=(0, -3), rim_a=150)
    c.drawLine(-600, 0, 600, -12, SP((150, 190, 104), 6))
    # brown chewed edges around the bites
    c.save(); c.clipPath(leaf_cut, skia.ClipOp.kIntersect, True)
    c.drawPath(bites, SP((150, 120, 60), 14, 200)); c.restore()
    # the beetles, nibbling (heads bob), sitting at the newest bites
    for j, k in enumerate((2, 5, 7)):
        bx = -420 + k * 100; top = k % 2 == 0
        by = (-90 if top else 70)
        beetle(c, bx + 30, by - (30 if top else -6) + 3 * math.sin(t * 14 + j), 2.0, t + j)
    c.restore()
    L.chip(c, 'CANE BEETLES', 540, 560, Y, 40, smooth((t - T['beetles']) / 0.3))


def shot_b2(c, t):
    """the plan: the lid swings open and the toads climb out over the rim and hop off into the cane"""
    tb = t - SHOT_B2
    z = 2.05 - 0.45 * smooth(tb / 2.6)
    c.save(); c.translate(540, 1060); c.scale(z, z); c.translate(-520, -1240)
    field(c, t, sun=False)
    c.drawOval(skia.Rect(470 - 170, 1322, 470 + 170, 1342), P((60, 40, 26), 120, MaskFilter=blur(6)))
    lid = smooth((tb - 0.15) / 0.45)
    crate(c, 470, 1330, t, lid, peek=1 - smooth((tb - 0.2) / 0.4))
    # toads: each climbs up inside to the rim (head and arms over the edge), then leaps out and hops toward the cane
    for i in range(10):
        t0 = 0.45 + i * 0.28
        u = tb - t0
        if u < 0: continue
        dirx = [1, -1, 1, -1, 1, 1, -1, 1, -1, 1][i]
        rx = 470 + dirx * [118, 112, 104, 120, 108, 114, 100, 116, 110, 106][i]
        rim_y = 1160
        if u < 0.35:                       # rising up behind the front slats to peek over the rim
            k = u / 0.35
            c.save(); c.clipRect(skia.Rect(320, 0, 620, rim_y + 2))
            toad(c, rx, rim_y + 60 * (1 - k), 0.9, t, face=dirx, ph=i, shadow=False)
            c.restore()
            continue
        v = u - 0.35
        n, hp = hop_cycle(v, 0.75, 0.5, 0)
        prog = n + (hp if hp > 0 else 1.0)
        if prog < 1:                       # the leap from the rim down to the ground
            x = rx + dirx * 170 * prog ** 0.5
            y = rim_y + (1340 + (i % 5) * 10 - rim_y) * prog - 90 * math.sin(math.pi * prog)
            toad(c, x, y, 0.95, t, hop=hp, face=dirx, ph=i, shadow=False)
        else:
            x = rx + dirx * (170 + min(prog - 1, 5) * 60)
            y = 1340 + (i % 5) * 10 + min(prog - 1, 5) * 6
            toad(c, x, y, 0.95, t, hop=hp, face=dirx, ph=i)
    c.restore()


RNG = np.random.default_rng(21)
_NT = []
for k in range(140):
    d = RNG.uniform(0, 1) ** 1.7                       # depth 0 far .. 1 near: many far, few near
    y = 960 + 900 * d ** 1.35
    hw = 130 + 820 * (y - 960) / 900                   # road half width at that depth, plus the verges
    x = 540 + RNG.uniform(-1.45, 1.45) * hw
    _NT.append((x, y, k, RNG.uniform(0, 1)))
_NT.sort(key=lambda q: q[1])


def shot_g(c, t):
    """the night road: toads spread over the whole road and both verges to the horizon, small and many far away, few and
    big near the camera, all hopping; more keep arriving as he says millions"""
    te = t - SHOT_G
    zz = 1.0 + 0.12 * smooth(te / 8)
    c.save(); c.translate(540, 1150); c.scale(zz, zz); c.translate(-540, -1150)
    lgrad(c, skia.Rect(-100, -100, 1200, 1200), 300, 1100, [(10, 14, 36), (34, 40, 76), (60, 56, 90)])
    rs = np.random.default_rng(11)
    for k in range(70):
        c.drawCircle(rs.uniform(0, 1080), rs.uniform(500, 1000), rs.uniform(0.8, 2), P((240, 240, 255), 120 + 80 * math.sin(t * 2 + k)))
    c.drawCircle(220, 640, 40, P((236, 236, 250)))
    c.drawPath(ridge(jag([(-100, 960), (300, 900), (700, 940), (1200, 890)], 3, 5)), P((26, 30, 54)))
    cane_row(c, t, 960, 200, 30, (40, 60, 50), (36, 56, 48), (30, 46, 40), 4, 7, step=38)
    c.drawRect(skia.Rect(-100, 950, 1200, 2000), P((40, 40, 52)))
    c.drawPath(poly([(420, 950), (660, 950), (1400, 1900), (-320, 1900)]), P((62, 60, 70)))
    for k in range(6):
        f = ((k / 6 + te * 0.15) % 1.0)
        y = 950 + 900 * f * f; w = 6 + 30 * f
        c.drawRect(skia.Rect(540 - w / 2, y, 540 + w / 2, y + 20 + 60 * f), P((220, 210, 170), 200))
    hl = skia.GradientShader.MakeRadial(skia.Point(540, 1750), 950, [C((255, 236, 180), 90), C((255, 236, 180), 0)], [0, 1])
    c.drawRect(skia.Rect(-100, 1000, 1200, 2000), skia.Paint(Shader=hl, BlendMode=skia.BlendMode.kScreen))
    cnt = int(60 + 80 * smooth((t - T['millions'] + 0.3) / 2.5))
    shown = [q for q in _NT if q[2] < cnt]
    for x, y, k, ph in shown:
        d = (y - 960) / 900
        s = 0.22 + 1.25 * d
        n, hp = hop_cycle(t, 1.4 + ph * 1.2, 0.25, ph * 3)
        drift = ((n % 4) - 1.5) * 10 * s * (1 if k % 2 else -1)
        toad(c, x + drift, y, s, t, hop=hp, face=1 if k % 2 else -1, ph=k)
    c.drawRect(skia.Rect(-200, 900, 1300, 2000), P((20, 24, 60), 50))
    c.restore()
    L.chip(c, '1935: ABOUT 100', 540, 800, Wt, 44, smooth((t - T['first']) / 0.3))


def titles(c, t):
    L.title(c, [[('CANE TOADS', Y)], [('TO SAVE THE CANE', Wt)]], t, -0.5, SHOT_B1)
    L.title(c, [[('BEETLES WERE', Wt)], [('EATING THE CANE', R)]], t, SHOT_B1 + 0.05, SHOT_B2)
    L.title(c, [[('THE PLAN:', Wt)], [('TOADS EAT BEETLES', Tl)]], t, SHOT_B2 + 0.05, SHOT_C)
    L.title(c, [[('THE BEETLES', Wt)], [('LIVED UP HIGH', Y)]], t, SHOT_C + 0.1, SHOT_D)
    L.title(c, [[('THEY ATE', Wt)], [('EVERYTHING ELSE', Y)]], t, SHOT_D + 0.1, T['poisonous'] - 0.1)
    L.title(c, [[('AND THEY WERE', Wt)], [('POISONOUS', R)]], t, T['poisonous'], SHOT_E)
    L.title(c, [[('BACK HOME,', Wt)], [('KEPT IN CHECK', Tl)]], t, SHOT_E + 0.1, SHOT_F)
    L.title(c, [[('IN AUSTRALIA,', Wt)], [('ALMOST NOTHING', R)]], t, SHOT_F + 0.1, T['invasive'] - 0.5)
    L.title(c, [[('AN INVASIVE', Wt)], [('SPECIES', Y)]], t, T['invasive'] - 0.4, SHOT_G)
    L.title(c, [[('MILLIONS', R)], [('FROM ONE SHIPMENT', Wt)]], t, SHOT_G + 0.1, None)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    if t < SHOT_B1: shot_a(c, t)
    elif t < SHOT_B2: shot_b1(c, t)
    elif t < SHOT_C: shot_b2(c, t)
    elif t < SHOT_D:
        old.shot_b(c, t)
        tilt = -60 * smooth((t - SHOT_C) / 5)
        if t < old.T['high']:
            L.chip(c, 'CANE BEETLE', 820, 560 + tilt, Y, 34, smooth((t - T['high']) / 0.3), anchor=(790, 612 + tilt))
    elif t < SHOT_E: old.shot_c(c, t)
    elif t < SHOT_F: old.shot_d1(c, t)
    elif t < SHOT_G: old.shot_d2(c, t)
    else: shot_g(c, t)
    for tc in (SHOT_B1, SHOT_B2, SHOT_C, SHOT_D, SHOT_E, SHOT_F, SHOT_G):
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
    render(frame, DUR, out, st, '/home/claude/toads2/out', start=lpk.START)
