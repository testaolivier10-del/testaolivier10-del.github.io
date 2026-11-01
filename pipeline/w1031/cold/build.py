"""w1031-01-cold-heart (NREMT, EMT traps #2). All code (skia), house flat style, knight v3 method.
Art plan:
- Scene: a frozen lake at night under a high moon, snowy pine shore in hazy layers, light snow falling, an ice hole
  with black water near the middle, an ambulance on the far shore with its light bar flashing red and blue (scene life),
  two ice rescuers in red dry suits with helmets and headlamps (beams in the cold air), the patient in a dark jacket and
  beanie. Why it fits: cold water ice rescue is where severe hypothermia and the handle gently rule meet.
- People built from parts in code (figure.Person), seen side on; breath vapour; headlamp beams.
- Motion list (checked with the fact check): rescuers grab his arms and start to yank him up out of the hole (the rough
  lift, shown as the wrong move); a round lens opens from his chest: a cold heart beating slowly, ECG slow and regular
  with a small J wave, an occasional early beat on "twitchy"; on "jolt" the frame jolts and the heart quivers while the
  trace turns to chaotic ventricular fibrillation (shown as what CAN happen, red); the lens closes and time runs on with
  the careful version: he is laid FLAT on a rescue sled and slid slowly across the ice to shore; the lens returns with a
  slow steady beat to the end.
"""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1031/lib']
import numpy as np, skia
from lpk import *
from figure import Person
import layout as L

ID = 'w1031-01-cold-heart'
OUT = f'/home/claude/lp/w1031/out/{ID}'
WD = Words(f'{OUT}/words_fast.json')
T = dict(hyp=WD.at('hypothermia'), stop=WD.at('stop'), hes=WD.at("he's"), twitchy=WD.at('twitchy'), one=WD.at('one', 1),
         jolt=WD.at('jolt'), vent=WD.at('ventricular'), thats=WD.at("that's"), quivers=WD.at('quivers'), pumping=WD.at('pumping'),
         and2=WD.at('and', 3), scary=WD.at('scary'), so=WD.at('so'), flat=WD.at('flat'), slide=WD.at('slide'), glass=WD.at('glass'),
         and3=WD.at('and', 5), careful=WD.at('careful'), slow2=WD.at('slow', 2), steady=WD.at('steady'))
END = WD.end()
DUR = END + 1.6
CAP = Captions(WD.w)
MOON = (236, 240, 255)
RIM = (196, 214, 255)
AMB_X, AMB_Y = 860, 905


def sky(c):
    lgrad(c, skia.Rect(-600, -400, 1700, 1000), -400, 950, [(10, 14, 38), (24, 34, 74), (52, 64, 112)], [0, 0.6, 1])
    rs = np.random.default_rng(2)
    for k in range(90):
        x, y = rs.uniform(-200, 1300), rs.uniform(-300, 700)
        c.drawCircle(x, y, rs.uniform(0.8, 2.0), P((230, 236, 255), 150 + 90 * math.sin(k * 1.3)))


def moon(c):
    c.drawCircle(250, 300, 200, P((180, 200, 255), 60, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(250, 300, 56, P(MOON))
    c.drawCircle(234, 292, 10, P((214, 220, 240))); c.drawCircle(266, 316, 7, P((214, 220, 240)))


SH1 = jag([(-400, 830), (0, 800), (200, 820), (420, 790), (700, 815), (1000, 790), (1500, 805)], 4, 4)
SH2 = jag([(-400, 900), (100, 880), (360, 895), (640, 870), (900, 890), (1500, 880)], 5, 4)


def pines(c, t, y0, n, h0, h1, col, snow, seed, x0=-380, step=30):
    rs = np.random.default_rng(seed)
    for k in range(n):
        x = x0 + k * step + rs.uniform(-8, 8); h = rs.uniform(h0, h1); y = y0 + rs.uniform(-8, 10)
        sw = 1.5 * math.sin(t * 0.9 + k * 0.6)
        c.drawPath(poly([(x + sw, y - h), (x + h * 0.22, y), (x - h * 0.22, y)]), P(col))
        for j in range(3):  # snow on the tiers, moonlit side left
            yy = y - h * (0.25 + 0.25 * j); w = h * 0.22 * (1 - (0.25 + 0.25 * j))
            c.drawPath(poly([(x - w, yy + 6), (x + sw * 0.6, yy - 8), (x - w * 0.1, yy + 3)]), P(snow))


def shore(c, t):
    c.drawPath(ridge(SH1), P((40, 52, 92)))
    pines(c, t, 820, 66, 50, 110, (30, 40, 74), (110, 124, 170), 1)
    c.drawPath(ridge(SH2), P((56, 70, 112)))
    pines(c, t, 892, 60, 70, 140, (22, 32, 60), (150, 166, 210), 2, step=32)
    # snow bank along the near shore
    c.drawPath(ridge(jag([(-400, 930), (200, 918), (600, 932), (1000, 920), (1500, 928)], 6, 3)), P((150, 164, 210)))


def ambulance(c, t, s=1.0):
    x, y = AMB_X, AMB_Y
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawPath(poly([(-70, -40), (40, -40), (40, -64), (70, -64), (70, 0), (-70, 0)]), P((220, 226, 240)))
    c.drawPath(poly([(40, -40), (70, -40), (70, 0), (40, 0)]), P((190, 196, 220)))
    c.drawRect(skia.Rect(-70, -22, 40, -16), P((210, 60, 70)))
    c.drawRect(skia.Rect(46, -58, 64, -42), P((120, 150, 200)))
    for wx in (-44, 46):
        c.drawCircle(wx, 2, 10, P((30, 30, 40)))
    ph = (t * 2.4) % 1.0
    red = ph < 0.5
    col = (255, 60, 70) if red else (70, 120, 255)
    c.drawRect(skia.Rect(-10, -72, 30, -64), P(col))
    c.restore()
    c.drawCircle(x + 10 * s, y - 68 * s, 120, P(col, 70, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    # light spilled on the snow
    c.drawOval(skia.Rect(x - 160, y - 10, x + 180, y + 40), P(col, 50, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))


def ice(c, t):
    lgrad(c, skia.Rect(-900, 925, 2000, 3400), 925, 1900, [(120, 140, 196), (86, 104, 160), (60, 74, 124)])
    # moon path on the ice and wind polished streaks
    c.drawOval(skia.Rect(150, 940, 360, 1700), P((200, 214, 255), 60, MaskFilter=blur(40)))
    rs = np.random.default_rng(8)
    for k in range(40):
        x = rs.uniform(-200, 1300); y = rs.uniform(960, 1900); w = rs.uniform(40, 200) * (y - 900) / 600
        c.drawLine(x, y, x + w, y + 2, SP((150, 170, 226), 2.5 * (y - 900) / 600, 120))
    for k in range(20):
        x = rs.uniform(-200, 1300); y = rs.uniform(1000, 1900)
        c.drawLine(x, y, x + rs.uniform(-80, 80), y + rs.uniform(10, 50), SP((70, 86, 140), 1.6, 160))


HOLE = (520, 1370)


def cracks(c, t):
    x, y = HOLE
    g = smooth(t / 2.2)
    rs = np.random.default_rng(3)
    for k in range(7):
        a = math.radians(-160 + k * 50 + rs.uniform(-10, 10)); L_ = (160 + rs.uniform(0, 140)) * g
        p = skia.Path(); px, py = x + 200 * math.cos(a), y + 60 * math.sin(a); p.moveTo(px, py)
        for j in range(1, 5):
            px += L_ / 4 * math.cos(a + rs.uniform(-0.4, 0.4)); py += L_ / 4 * 0.35 * math.sin(a + rs.uniform(-0.4, 0.4)); p.lineTo(px, py)
        c.drawPath(p, SP((240, 248, 255), 6, 235))
        c.drawPath(p, SP((40, 56, 110), 2.5, 240))


def hole(c, t):
    x, y = HOLE
    rim = smooth_closed([(x - 230, y), (x - 160, y - 54), (x, y - 70), (x + 170, y - 50), (x + 240, y + 4), (x + 150, y + 56), (x - 20, y + 64), (x - 190, y + 46)])
    c.drawPath(rim, P((176, 196, 240)))
    inner = smooth_closed([(x - 190, y + 4), (x - 130, y - 36), (x, y - 48), (x + 140, y - 32), (x + 196, y + 8), (x + 120, y + 40), (x - 20, y + 46), (x - 160, y + 34)])
    c.drawPath(inner, P((14, 20, 40)))
    c.save(); c.clipPath(inner, skia.ClipOp.kIntersect, True)
    for k in range(5):   # ripples
        r = ((t * 30 + k * 40) % 200)
        c.drawOval(skia.Rect(x - r * 1.4, y - r * 0.3 + 8, x + r * 1.4, y + r * 0.3 + 8), SP((80, 100, 160), 2, 120 * (1 - r / 200)))
    c.restore()
    c.drawPath(rim_of(rim, (0, -5)) or rim, P((236, 244, 255), 200))


def snow(c, t, n=80, near=False):
    rs = np.random.default_rng(31 if near else 30)
    for k in range(n):
        x0, y0, sp = rs.uniform(0, 1080), rs.uniform(0, 1920), rs.uniform(30, 70) * (2 if near else 1)
        x = (x0 + 20 * math.sin(t * 0.6 + k)) % 1080
        y = (y0 + sp * t) % 1920
        c.drawCircle(x, y, rs.uniform(1.5, 3.2) * (2 if near else 1), P((240, 244, 255), 200 if near else 150, MaskFilter=blur(1.5 if near else 0.5)))


def beam(c, x, y, ang, L_=520, a=60):
    p = poly([(x, y), (x + L_ * math.cos(ang - 0.18), y + L_ * math.sin(ang - 0.18)), (x + L_ * math.cos(ang + 0.18), y + L_ * math.sin(ang + 0.18))])
    sh = skia.GradientShader.MakeRadial(skia.Point(x, y), L_, [C((255, 250, 220), a), C((255, 250, 220), 0)])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=sh, BlendMode=skia.BlendMode.kScreen))


def breath(c, t, x, y, period, ph, dirx=-1):
    u = ((t + ph) % period) / period
    if u > 0.55: return
    k = u / 0.55
    for j in range(3):
        c.drawCircle(x + dirx * (20 + 60 * k + j * 14), y - 10 * k - j * 6, 10 + 20 * k, P((230, 236, 255), 80 * (1 - k)))


RESC = dict(shirt=(214, 56, 52), vest=(176, 40, 42), pants=(196, 50, 48), skin=(214, 166, 136), hat=(240, 210, 70), boots=(40, 40, 50),
            hair=(60, 44, 36), light=-1, rim=RIM, hat_style='helmet', lamp=True)


def rescuers_pull(c, t, lift, jolt=0.0):
    """two rescuers kneeling at the far rim of the hole, each holding one of his arms; lift 0..1 raises him"""
    s = 1.9
    for k, (x, face) in enumerate(((384, 1), (656, -1))):
        r = Person(s=s, **RESC)
        y = 1330 - 10
        lean = 0.3 * lift
        br = 2.0 * math.sin(t * 1.6 + k * 1.3)
        hip = (x - face * 10 * s, y - 60 * s)
        neck = (hip[0] + face * (14 + 30 * lean) * s, hip[1] - (72 - 18 * lean) * s + 6 * jolt + br)
        head = (neck[0] + face * 12 * s, neck[1] - 24 * s)
        py = HOLE[1] + 215 - 200 * lift + 20 * jolt - 150 * 2.0
        hd = (HOLE[0] - face * 44, py + 46 + 4 * k)
        sh = (neck[0], neck[1] + 10 * s)
        el = ik2(sh, hd, 32 * s, 30 * s, bend=1 if face > 0 else -1)
        J = dict(head=head, neck=neck, hip=hip, shN=sh, elN=el, hdN=hd, shF=sh, elF=el, hdF=(hd[0] - face * 10, hd[1] + 8),
                 knN=(hip[0] + face * 34 * s, y - 6 * s), ftN=(hip[0] - face * 30 * s, y), knF=(hip[0] + face * 30 * s, y - 4 * s), ftF=(hip[0] - face * 34 * s, y + 2))
        r.draw(c, J, face=face, toe=-face)
        beam(c, head[0] + face * 28 * s, head[1] - 20 * s, math.atan2(HOLE[1] - head[1], HOLE[0] - head[0]), 360, 28)
        breath(c, t, head[0] + face * 26 * s, head[1] + 10 * s, 2.6, k * 1.1, dirx=face)


def patient_in_water(c, t, lift, jolt=0.0):
    s = 2.0
    x, y = HOLE[0], HOLE[1] + 215 - 200 * lift + 20 * jolt
    p = Person(s=s, shirt=(52, 60, 82), vest=(40, 46, 66), pants=(40, 44, 60), skin=(196, 178, 176), hat=(80, 90, 140),
               hair=(50, 40, 36), light=-1, rim=RIM, hat_style='beanie')
    c.save()
    clip = skia.Path(); clip.addRect(skia.Rect(-200, -200, 1300, HOLE[1] - 4)); c.clipPath(clip, skia.ClipOp.kIntersect, True)
    neck = (x, y - 150 * s); head = (x + 2 * s, y - 176 * s)
    hip = (x, y - 60 * s)
    hdL = (x - 40 * s, neck[1] + 120 * s); hdR = (x + 40 * s, neck[1] + 120 * s)
    shL = (neck[0] - 18 * s, neck[1] + 10 * s); shR = (neck[0] + 18 * s, neck[1] + 10 * s)
    elL = ik2(shL, hdL, 32 * s, 30 * s, bend=-1); elR = ik2(shR, hdR, 32 * s, 30 * s, bend=1)
    J = dict(head=head, neck=neck, hip=hip, shN=shR, elN=elR, hdN=hdR, shF=shL, elF=elL, hdF=hdL,
             knN=(x + 10, y), ftN=(x + 10, y + 40), knF=(x - 10, y), ftF=(x - 10, y + 40))
    p.draw(c, J, face=1, eye=False, tilt=0.15 * jolt + 0.07 * math.sin(t * 0.9))
    c.restore()
    # water line wobble around his chest
    c.drawOval(skia.Rect(x - 70, HOLE[1] - 4, x + 70, HOLE[1] + 14), SP((120, 150, 210), 3, 160))


def sled_scene(c, t, u):
    """wide: he lies flat on an orange rescue sled; two rescuers walk ahead pulling it slowly by ropes toward shore"""
    s = 1.6
    tr = smooth((t - T['so'] + 0.1) / 2.0)        # he is slid out flat, onto the sled, before they pull
    pull = smooth((t - T['so'] - 1.9) / (DUR - T['so'] - 1.9))
    sx = 600 - 300 * pull          # the sled moves slowly left toward the shore path
    sy = 1330
    hole(c, t) if False else None
    hx_, hy_ = 1000, 1350
    rim_ = smooth_closed([(hx_ - 170, hy_), (hx_ - 110, hy_ - 44), (hx_, hy_ - 56), (hx_ + 130, hy_ - 40), (hx_ + 180, hy_ + 4), (hx_ + 110, hy_ + 44), (hx_ - 20, hy_ + 50), (hx_ - 140, hy_ + 36)])
    c.drawPath(rim_, P((176, 196, 240)))
    c.drawPath(smooth_closed([(hx_ - 140, hy_ + 4), (hx_ - 96, hy_ - 30), (hx_, hy_ - 38), (hx_ + 104, hy_ - 26), (hx_ + 146, hy_ + 6), (hx_ + 90, hy_ + 32), (hx_ - 20, hy_ + 36), (hx_ - 118, hy_ + 26)]), P((14, 20, 40)))
    # sled
    sl = smooth_closed([(sx - 190, sy - 10), (sx + 170, sy - 12), (sx + 200, sy - 30), (sx + 210, sy + 8), (sx + 170, sy + 22), (sx - 190, sy + 22)])
    c.drawOval(skia.Rect(sx - 220, sy + 4, sx + 220, sy + 40), P((30, 40, 80), 110, MaskFilter=blur(8)))
    flat(c, sl, (240, 120, 50), (196, 86, 40), sh_off=(0, 6), rim=RIM, rim_d=(2, -2), rim_a=160)
    c.save(); c.translate(330 * (1 - tr), 10 * (1 - tr))
    # patient lying flat, head toward the direction of travel (left), wrapped in a blanket
    p = Person(s=s, shirt=(52, 60, 82), vest=(40, 46, 66), pants=(40, 44, 60), skin=(196, 178, 176), hat=(80, 90, 140), light=-1, rim=RIM, hat_style='beanie')
    br = 0.6 * math.sin(t * 1.0)
    hip = (sx + 40, sy - 30)
    neck = (sx - 100, sy - 32 + br); head = (sx - 132, sy - 40)
    J = dict(head=head, neck=neck, hip=hip, shN=(neck[0] + 10, neck[1]), elN=(sx - 40, sy - 26), hdN=(sx + 10, sy - 26),
             shF=(neck[0] + 10, neck[1]), elF=(sx - 40, sy - 28), hdF=(sx + 10, sy - 28),
             knN=(sx + 110, sy - 30), ftN=(sx + 180, sy - 34), knF=(sx + 110, sy - 28), ftF=(sx + 180, sy - 30))
    p.draw(c, J, face=-1, eye=False, tilt=-1.45)
    blanket = smooth_closed([(sx - 110, sy - 44 + br), (sx + 60, sy - 50), (sx + 190, sy - 42), (sx + 196, sy - 18), (sx - 110, sy - 16)])
    flat(c, blanket, (200, 206, 220), (150, 156, 180), sh_off=(0, 6), rim=RIM, rim_d=(2, -2), rim_a=120)
    c.restore()
    # two rescuers ahead walking slowly, leaning into the ropes
    for k, off in enumerate((0, 90)):
        x = sx - 300 - off; y = sy + 20 + k * 30
        ph = t * 2.6 + k * 1.3; a = math.sin(ph) * (0.15 + 0.85 * smooth((t - T['so'] - 1.7) / 0.5))
        r = Person(s=s, **RESC)
        hip = (x, y - 100 * s)
        neck = (x - 22 * s, y - 172 * s); head = (neck[0] - 12 * s, neck[1] - 24 * s)
        ftN = (x + 20 * s * a, y - 4 * s - max(0, 8 * s * math.sin(ph + 1.6))); ftF = (x - 20 * s * a, y - 4 * s - max(0, 8 * s * math.sin(ph + 1.6 + math.pi)))
        knN = ik2(hip, ftN, 52 * s, 50 * s, bend=1); knF = ik2(hip, ftF, 52 * s, 50 * s, bend=1)
        sh = (neck[0], neck[1] + 10 * s)
        hd = (sh[0] + 34 * s, sh[1] + 40 * s)
        el = ik2(sh, hd, 32 * s, 30 * s, bend=-1)
        c.drawLine(hd[0], hd[1], sx - 190, sy - 4, SP((240, 210, 70), 3))
        if k == 1: c.drawLine(hip[0], hip[1], -400, hip[1] - 60, SP((240, 210, 70), 3))   # tether back to shore
        c.drawOval(skia.Rect(x - 50, y - 6, x + 50, y + 8), P((30, 40, 80), 100, MaskFilter=blur(6)))
        r.draw(c, dict(head=head, neck=neck, hip=hip, shN=sh, elN=el, hdN=hd, shF=sh, elF=el, hdF=(hd[0] + 4, hd[1] + 6),
                       knN=knN, ftN=ftN, knF=knF, ftF=ftF), face=-1)
        beam(c, head[0] - 28 * s, head[1] - 20 * s, math.radians(165), 420, 55)
        breath(c, t, head[0] - 26 * s, head[1] + 10 * s, 2.4, k, dirx=-1)


# ------------------------------------------------------------------ heart and ECG (the lens)
def heart(c, cx, cy, sc, t, mode, mu):
    """mode 0 slow cold rhythm, 1 fibrillation (quiver, no pumping). mu blends between them."""
    rate = 40 / 60.0
    ph = (t * rate) % 1.0
    beat = math.exp(-((ph - 0.12) / 0.06) ** 2)
    qv = mu
    s = sc * (1 - 0.06 * beat * (1 - qv))
    c.save(); c.translate(cx, cy); c.scale(s, s)
    jit = lambda i: qv * 11 * math.sin(t * 47 + i * 2.3) + qv * 8 * math.sin(t * 31 + i * 5.1)
    outline = [(-58, -66), (-90, -28), (-98, 18), (-80, 62), (-36, 98), (24, 122), (74, 130), (98, 98), (100, 42), (84, -16), (54, -56), (2, -72)]
    pts = [(x + jit(i), y + jit(i + 7)) for i, (x, y) in enumerate(outline)]
    # great vessels behind: superior vena cava, aortic arch, pulmonary trunk (all drawn in dark reds)
    c.drawPath(smooth_closed([(-74, -60), (-76, -140), (-50, -142), (-48, -60)]), P((120, 40, 60)))
    arch = skia.Path(); arch.moveTo(-14, -64); arch.cubicTo(-24, -150, 50, -168, 62, -110); arch.lineTo(66, -40)
    c.drawPath(arch, SP((190, 60, 70), 34)); c.drawPath(arch, SP((226, 110, 110), 6, 160))
    for bx in (6, 24, 42):
        c.drawLine(bx, -140 + abs(bx - 24) * 0.4, bx + 2, -176, SP((190, 60, 70), 9))
    body = smooth_closed(pts)
    flat(c, body, (176, 52, 62), (132, 34, 48), sh_off=(8, 0), rim=(255, 170, 170), rim_d=(-3, 3), rim_a=180)
    # right atrium bulge on the viewer's left, pulmonary trunk in front, coronary groove and the interventricular groove
    c.drawPath(smooth_closed([(-92, -30), (-70, -58), (-40, -40), (-46, 10), (-80, 20)]), P((156, 44, 58)))
    c.drawPath(smooth_closed([(8, -66), (14, -126), (40, -132), (44, -70)]), P((150, 44, 62)))
    g2 = skia.Path(); g2.moveTo(10 + jit(2), -40); g2.cubicTo(30, 20, 50, 70, 70, 120)
    c.drawPath(g2, SP((110, 30, 44), 5))
    # pumping flow: blood out of the aorta on each beat; none while it quivers
    if beat > 0.1 and qv < 0.5:
        for k in range(3):
            c.drawCircle(-8 + k * 6, -150 - 30 * (ph * 6 % 1) - k * 14, 6, P((220, 60, 70), 200 * beat))
    c.restore()


def ecg(c, x0, y0, w, h, t, mu, col):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + w, y0 + h), 18, 18), P((8, 16, 22), 225))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x0 + w, y0 + h), 18, 18), SP(col, 3, 160))
    for gx in range(int(x0) + 20, int(x0 + w), 40):
        c.drawLine(gx, y0 + 8, gx, y0 + h - 8, SP((30, 60, 60), 1))
    span = 4.0
    p = skia.Path(); first = True
    for i in range(0, int(w) - 40, 3):
        tt = t - span + span * i / (w - 40)
        rate = 40 / 60.0; ph = (tt * rate) % 1.0
        v = 0.9 * math.exp(-((ph - 0.12) / 0.012) ** 2) - 0.2 * math.exp(-((ph - 0.10) / 0.01) ** 2)
        v += 0.18 * math.exp(-((ph - 0.15) / 0.015) ** 2)           # J wave (Osborn), a hypothermia sign
        v += 0.2 * math.exp(-((ph - 0.36) / 0.05) ** 2) + 0.1 * math.exp(-((ph - 0.02) / 0.02) ** 2)
        vf = 0.45 * math.sin(tt * 37) + 0.3 * math.sin(tt * 23 + 1) + 0.15 * math.sin(tt * 61)
        m = smooth((mu - (1 - i / (w - 40)) * 0.0))
        yv = (1 - m) * v + m * vf
        X, Y = x0 + 20 + i, y0 + h * 0.62 - yv * h * 0.42
        if first: p.moveTo(X, Y); first = False
        else: p.lineTo(X, Y)
    c.drawPath(p, SP(col, 4))
    c.drawCircle(X, Y, 6, P(col))


def lens(c, t, cx, cy, r, mu, col, a=1.0):
    if r < 2: return
    cp = skia.Path(); cp.addCircle(cx, cy, r)
    c.save(); c.clipPath(cp, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(cx - r, cy - r, cx + r, cy + r), cy - r, cy + r, [(40, 30, 50), (70, 40, 60)])
    for k in range(6):
        c.drawCircle(cx - r + k * r / 3, cy + 30 * math.sin(t * 0.7 + k), r * 0.25, P((110, 60, 80), 60, MaskFilter=blur(20)))
    heart(c, cx, cy + r * 0.08, r / 175, t, 0, mu)
    c.restore()
    c.drawCircle(cx, cy, r, SP((236, 244, 255), 7, 230 * a))


# ------------------------------------------------------------------ frames
def titles(c, t):
    R, Y, Wt, Tl = (255, 107, 107), (255, 210, 63), (255, 255, 255), (46, 230, 214)
    L.title(c, [[('HYPOTHERMIA ', Y), ('RESCUE', Y)], [('ONE ROUGH LIFT', Wt)]], t, -0.5, T['hes'] - 0.1)
    L.title(c, [[('A COLD HEART', Wt)], [('GETS ', Wt), ('TWITCHY', Y)]], t, T['hes'], T['one'] - 0.1)
    L.title(c, [[('ONE HARD ', Wt), ('JOLT', R)]], t, T['one'], T['thats'] - 0.1)
    L.title(c, [[('IT ', Wt), ('QUIVERS', R)], [('INSTEAD OF PUMPING', Wt)]], t, T['thats'], T['and2'] - 0.1)
    L.title(c, [[('THEY MEAN', Wt)], [('TO ', Wt), ('HELP', Y)]], t, T['and2'], T['so'] - 0.1)
    L.title(c, [[('KEEP HIM ', Wt), ('FLAT', Tl)], [('MOVE HIM ', Wt), ('SLOWLY', Tl)]], t, T['so'], T['and3'] - 0.1)
    L.title(c, [[('SLOW, ', Wt), ('STEADY', Tl)], [('BEAT', Wt)]], t, T['and3'], None)


def series(c, t):
    series_tag(c, 'EMT TRAPS #2', 1.0)


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    sled = t >= T['so'] - 0.3
    # camera: slow push in the rescue shot; the lens comes from his chest
    if not sled:
        z = 1.22 + 0.06 * smooth(t / T['so'])
        cx, cy = 540, 1250
    else:
        u = (t - T['so'] + 0.3) / (DUR - T['so'] + 0.3)
        pull_ = smooth((t - T['so'] - 1.9) / (DUR - T['so'] - 1.9)); z = 1.12 + 0.03 * u; cx, cy = 560 - 300 * pull_ - 60 * smooth((t - T['so']) / 2.0), 1250
    jolt = 0.0
    if T['jolt'] + 0.5 <= t < T['jolt'] + 1.4:
        jolt = math.exp(-(t - T['jolt'] - 0.5) / 0.3) * math.sin((t - T['jolt'] - 0.5) * 40)
    c.save()
    c.translate(540 + 18 * jolt, 1050); c.scale(z, z); c.translate(-cx, -cy)
    sky(c); moon(c); shore(c, t); ambulance(c, t, 0.9); ice(c, t)
    if not sled:
        # the rough lift starts, then stops when the lens opens (time held still in the story while we look inside)
        lift = 0.3 * smooth(t / 2.4) + 0.03 * math.sin(t * 7.5) * (1 - smooth((t - 2.6) / 1.0))
        if t >= T['jolt']:
            u_ = t - T['jolt']
            lift = 0.3 + 0.55 * smooth(u_ / 0.22) - 0.3 * smooth((u_ - 0.42) / 0.1)
        if t >= T['and2']:
            lift = lift - 0.12 * smooth((t - T['and2']) / 1.5)
        imp = math.exp(-((t - T['jolt'] - 0.54) / 0.14) ** 2)
        hole(c, t)
        cracks(c, t)
        patient_in_water(c, t, lift, jolt)
        rescuers_pull(c, t, lift, jolt)
        breath(c, t, HOLE[0] + 8, HOLE[1] - 200 * lift - 330, 3.4, 0.3, dirx=1)
        if imp > 0.02:   # he hits the ice edge
            c.drawOval(skia.Rect(HOLE[0] - 260, HOLE[1] - 40, HOLE[0] + 260, HOLE[1] + 60), P((255, 240, 230), 120 * imp, MaskFilter=blur(24), BlendMode=skia.BlendMode.kScreen))
    else:
        u = smooth((t - T['so'] + 0.3) / (DUR - T['so']))
        sled_scene(c, t, u)
    snow(c, t, 70)
    c.restore()
    snow(c, t, 18, near=True)
    # the lens: from the chest, twitchy beats, the jolt into VF, back to slow; and again at the end
    mu = 0.0
    if T['jolt'] <= t:
        mu = smooth((t - T['jolt'] - 0.52) / 0.15) * (1 - smooth((t - T['and2']) / 0.6))
    r1 = 180 * smooth((t - T['hes'] - 0.6) / 0.6) * (1 - smooth((t - T['and2'] - 0.2) / 0.5))
    r2 = 180 * smooth((t - T['and3']) / 0.6)
    r = max(r1, r2)
    if r > 2:
        lx, ly = (835, 600)
        col = (255, 90, 90) if mu > 0.5 else (90, 255, 160)
        lens(c, t, lx, ly, r, mu, col)
        if r > 150:
            ecg(c, 160, 1222, 760, 130, t, mu, col)
        if mu > 0.5 and t >= T['vent']:
            L.chip(c, 'VENTRICULAR FIBRILLATION', 540, 1196, (255, 107, 107), 46, smooth((t - T['vent']) / 0.25) * (1 - smooth((t - T['and2']) / 0.3)))
        if r2 > r1 and t >= T['slow2']:
            L.chip(c, 'SLOW AND STEADY', 540, 1196, (90, 255, 160), 46, smooth((t - T['slow2']) / 0.25))
    # red warning pulse on "stop his heart"
    wa = math.exp(-((t - T['stop'] + 0.15) / 0.35) ** 2) + 0.7 * mu * (0.5 + 0.5 * math.sin(t * 12))
    if wa > 0.02:
        vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.7, [C((255, 0, 0), 0), C((255, 0, 0), 0), C((200, 20, 30), 150 * min(1, wa))], [0, 0.55, 1.0])
        c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    vg = skia.GradientShader.MakeRadial(skia.Point(W / 2, H * 0.5), H * 0.72, [C((0, 0, 0), 0), C((0, 0, 0), 0), C((4, 6, 20), 140)], [0, 0.62, 1.0])
    c.drawRect(skia.Rect(0, 0, W, H), skia.Paint(Shader=vg))
    # dip to black at the cut to the sled
    d = abs(t - (T['so'] - 0.3))
    if d < 0.12: c.drawRect(skia.Rect(0, 0, W, H), P((4, 6, 16), 255 * (1 - d / 0.12)))
    L.fades(c)
    L.badge(c, 'NREMT')
    series(c, t)
    titles(c, t)
    if t < END + 0.3: L.watermark(c)
    CAP.draw(c, t)
    end_line(c, t, END + 0.3)
    return surf


if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, OUT, start=lpk.START)
