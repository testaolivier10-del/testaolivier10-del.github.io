"""w1031-01-cold-heart, premium rebuild (2026-11-09). NREMT, EMT traps #2. All code (skia), house flat style.

Story (premises first): a man went through the ice of a frozen lake at night and has been in the water too long. Two
ice rescuers reach him; one kneels on a rescue sled at the hole and starts to haul him up by the chest (the rough lift,
the wrong move). A lens from his chest shows the cold heart: slow, with an extra twitchy beat; labelled IF JOLTED, the
heart quivers in ventricular fibrillation and stops pumping. Back at the hole, the haul turns into a hard yank; the
second rescuer walks up and puts her hand on his shoulder, and he eases the man back down. Zoom cut: the man lies flat,
wrapped, strapped on the sled, and the rescuers slide him slowly to shore; the lens returns: slow, steady beat.

Art plan (all code, house flat layered style; no Gemini images):
- Night lake: gradient sky with stars and drifting cloud bands, moon with glow, two hazy layers of snowy pines on the
  far shore that sway, an ambulance on the far shore with its light bar flashing and spilling light on the snow,
  snow falling in two depths (near flakes blurred), ice with wind streaks and a moon path.
- The hole (where the story lives): a jagged broken edge with the ice thickness showing as a lit blue lip, broken
  slabs tilted in the water, dark water with moon glints and rings from his body, cracks running out in the ice
  plane only, frost and snow drifts at the rim.
- People: ONE skinned body each (people kit person.py + airman2.py, cast.py adds IK, kneeling and hats as props):
  RED rescuer (red dry suit, white helmet with headlamp), ORANGE rescuer (orange suit, yellow helmet), the PATIENT
  (navy parka, beanie, pale skin). Headlamp beams are additive light; breath vapour from mouths.
- Heart lens: the code heart (pipeline/w1031/lib/heart.py: anterior view, coronaries, VF = fine uneven ripple with no
  squeeze) inside a round lens tied to his chest by a soft cone, with an ECG strip (slow, regular with a small hump
  after each QRS; VF chaos with no QRS while IF JOLTED shows).
Motion list (hands and causes):
- 0 to 4.8 s: RED kneels on the sled board at the rim; both gloved hands grip the front of the patient's parka at the
  chest (wrist solved onto that point every frame). The patient rises only as RED leans back and straightens (the
  lift drives both). Two rough yanks (0.9 s, 2.6 s). The patient's near hand rests on the ice rim until it is out of
  reach, then his arm hangs.
- 4.8 to 9.3 s: hold; RED keeps his grip; breathing, breath vapour, headlamp beams; camera pushes slowly.
- 9.3 to 18.7 s: the lens opens from his chest (scene still visible below): slow cold beat, an early extra beat on
  "twitchy"; on "jolt" the IF JOLTED chip, then VF (ripple, no squeeze, chaotic trace); "stops pumping": the blood
  glow in the vessels fades. Lens closes back into his chest.
- 18.7 to 25.2 s: RED yanks hard (the patient rises with his hands); ORANGE walks two planted steps up (feet locked,
  IK legs) and her near hand lands on RED's shoulder and stays there; RED eases the patient back down.
- 25.25 s zoom cut: the sled shot. The patient lies flat, wrapped in an insulated blanket with the hood up, strapped.
  RED walks ahead to the left with the tow rope in his near hand (the rope ends in his hand every frame); ORANGE
  walks behind the sled with her near hand on its tail rail (solved onto the rail every frame). The sled moves only
  at their walking speed, smoothly. Feet are planted while in stance (foot locked gait). The hole slides off right.
- 33.1 s to end: the lens opens from his chest on the sled: slow steady beat, regular slow trace.
"""
import sys, math, json
sys.path[:0] = ['/home/claude/lp/w1031r/cold', '/home/claude/lp/w1031/lib']
import numpy as np, skia
import kit as K
from kit import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed, lgrad, ridge, jag, ease_io
import layout as L
import cast
from cast import Pose
import heart as HT
from airman2 import _hp as _hp_

ID = 'w1031-01-cold-heart'
OUT = f'/home/claude/lp/w1031r/out/{ID}'
WD = K.Words(f'{OUT}/words.json')
at = WD.at
T_HE = at("he")                      # He went through the ice
T_A = at('a')                        # A heart this cold
T_TW = at('twitchy')
T_ONE = at('one')
T_JOLT = at('jolt')
T_VENT = at('ventricular')
T_THATS = at("that's")
T_STOPS = at('stops')
T_QUIV = at('quivers')
T_AND = at('and', 3)                 # And the scary part?
T_ROUGH = at('rough')
T_KIND = at('kind')
T_COULD = at('could', 2)
T_SO = at('so', 2)                   # So instead
T_FLAT = at('flat')
T_SLIDE = at('slide')
T_THEY = at('they')
T_GLASS = at('glass')
T_AND5 = at('and', 5)                # And handled that gently
T_HIS = at('his', 2)
T_SLOW = at('slow')
T_END = WD.end()
DUR = round(T_END + 1.7, 2)
T_CUT = T_SO - 0.15
T_U0 = T_HE - 0.1                    # zoom cut under the ice
T_U1 = T_A - 0.5                     # zoom cut back up to him
T_SHORE = T_SLOW + 1.45              # zoom cut to the shore

RK, OK_, PK = cast.make(0.41)
MOON = (236, 240, 255)
RIMC = (200, 216, 255)
LIGHT = (0.7, -0.62)          # moon high on the left

# ------------------------------------------------------------------ world A: the hole
HX, HY = 600, 1330            # hole centre on the ice; HY is the waterline
HRX, HRY = 205, 46
BOARD = (210, 520)            # the rescue sled under RED's knees, x span, on the ice at the left rim
NECK_ADD = 25
RX = 352                      # RED's hip x


def sky(c, t, x0=-900, x1=2600):
    lgrad(c, skia.Rect(x0, -800, x1, 1000), -400, 960, [(8, 12, 34), (20, 30, 70), (54, 66, 116)], [0, 0.55, 1])
    rs = np.random.default_rng(2)
    for k in range(140):
        x, y = rs.uniform(x0, x1), rs.uniform(-600, 760)
        tw = 0.6 + 0.4 * math.sin(t * rs.uniform(1.5, 3.5) + k)
        c.drawCircle(x, y, rs.uniform(0.8, 2.2), P((230, 236, 255), 200 * tw))
    for k in range(4):         # thin cloud bands drifting
        cx = (x0 + ((k * 640 + t * 9 * (1 + k * 0.3)) % (x1 - x0)))
        cy = 300 + k * 110
        c.drawOval(skia.Rect(cx - 420, cy - 26, cx + 420, cy + 26), P((90, 104, 160), 50, MaskFilter=blur(22)))


def moon(c, x, y):
    c.drawCircle(x, y, 230, P((170, 190, 255), 50, MaskFilter=blur(90)))
    c.drawCircle(x, y, 50, P(MOON))
    for dx, dy, r in ((-12, -8, 9), (16, 12, 7), (4, -22, 5), (-20, 16, 5)):
        c.drawCircle(x + dx, y + dy, r, P((212, 218, 240)))
    q = skia.Path(); q.addCircle(x, y, 50); r_ = skia.Path(); r_.addCircle(x - 8, y - 7, 50)
    d = skia.Op(q, r_, skia.PathOp.kDifference_PathOp)
    if d is not None: c.drawPath(d, P((198, 208, 236)))


def pines(c, t, y0, n, h0, h1, col, snow, seed, x0=-900, step=30):
    rs = np.random.default_rng(seed)
    for k in range(n):
        x = x0 + k * step + rs.uniform(-8, 8); h = rs.uniform(h0, h1); y = y0 + rs.uniform(-8, 10)
        sw = 2.2 * math.sin(t * 0.8 + k * 0.6) * (h / h1)
        c.drawPath(poly([(x + sw, y - h), (x + h * 0.24, y), (x - h * 0.24, y)]), P(col))
        for j in range(3):
            yy = y - h * (0.25 + 0.25 * j); w = h * 0.24 * (1 - (0.25 + 0.25 * j))
            c.drawPath(poly([(x - w, yy + 6), (x + sw * (0.75 - 0.25 * j), yy - 8), (x - w * 0.1, yy + 3)]), P(snow))


def shore(c, t, y=880, x0=-900, x1=2600):
    n = int((x1 - x0) / 30)
    c.drawPath(ridge(jag([(x0, y - 50), (0, y - 76), (400, y - 58), (800, y - 84), (1300, y - 60), (1800, y - 80), (x1, y - 64)], 4, 5)), P((40, 52, 92)))
    pines(c, t, y - 60, n, 50, 110, (30, 40, 76), (110, 126, 176), 1, x0=x0)
    c.drawPath(ridge(jag([(x0, y + 6), (300, y - 6), (700, y + 8), (1200, y - 4), (1700, y + 6), (x1, y)], 5, 4)), P((54, 68, 112)))
    pines(c, t, y + 10, int(n * 0.95), 70, 150, (22, 32, 62), (150, 168, 214), 2, x0=x0, step=32)
    c.drawPath(ridge(jag([(x0, y + 50), (200, y + 40), (600, y + 54), (1000, y + 42), (1500, y + 52), (x1, y + 46)], 6, 3)), P((150, 166, 214)))


def ambulance(c, t, x, y, s=0.62):
    ph = (t * 2.4) % 1.0; red = ph < 0.5
    col = (255, 60, 70) if red else (70, 120, 255)
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-100, -8, 100, 8), P((20, 26, 50), 150, MaskFilter=blur(5)))
    body = skia.Path(); body.addRRect(skia.RRect.MakeRectXY(skia.Rect(-26, -92, 92, -14), 6, 6))
    cab = smooth_closed([(-26, -70), (-50, -70), (-66, -56), (-86, -40), (-90, -24), (-90, -14), (-26, -14)])
    WH, WSH = (226, 232, 246), (176, 186, 214)
    for p_ in (cab, body):
        K.flat(c, p_, WH, WSH, sh_off=(-10, -6), rim=RIMC, rim_d=(3, 3), rim_a=200)
    c.drawRect(skia.Rect(-90, -42, 92, -34), P((214, 52, 62)))
    c.drawPath(poly([(-48, -64), (-30, -64), (-30, -46), (-68, -46), (-60, -56)]), P((40, 56, 96)))
    c.drawRect(skia.Rect(-10, -80, 14, -60), P((40, 56, 96)))
    c.save(); c.translate(68, -64)
    for ang in (0, 60, 120):
        c.save(); c.rotate(ang); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-4.5, -13, 4.5, 13), 2, 2), P((40, 96, 206))); c.restore()
    c.restore()
    for wx in (-58, 58):
        c.drawCircle(wx, -12, 17, P((20, 24, 40))); c.drawCircle(wx, -10, 6, P((130, 136, 156)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-50, -78, -22, -70), 3, 3), P((60, 64, 80)))
    c.drawRect(skia.Rect(-48, -77, -37, -71), P((255, 70, 80) if red else (110, 40, 50)))
    c.drawRect(skia.Rect(-35, -77, -24, -71), P((80, 130, 255) if not red else (40, 50, 110)))
    c.drawOval(skia.Rect(-92, -36, -84, -28), P((255, 244, 200)))
    c.restore()
    c.drawCircle(x + (-42 if red else -30) * s, y - 74 * s, 70, P(col, 70, MaskFilter=blur(24), BlendMode=skia.BlendMode.kScreen))
    c.drawOval(skia.Rect(x - 170, y - 10, x + 170, y + 36), P(col, 46, MaskFilter=blur(26), BlendMode=skia.BlendMode.kScreen))
    hb = poly([(x - 90 * s, y - 32 * s), (x - 300, y + 8), (x - 260, y + 36)])
    c.drawPath(hb, P((255, 246, 210), 46, MaskFilter=blur(10), BlendMode=skia.BlendMode.kScreen))


def ice_plain(c, t, y0=925, x0=-900, x1=2600, moon_x=200):
    lgrad(c, skia.Rect(x0, y0, x1, 3400), y0, 1900, [(118, 138, 194), (86, 104, 160), (58, 72, 122)])
    c.drawOval(skia.Rect(moon_x - 120, y0 + 10, moon_x + 120, y0 + 900), P((200, 214, 255), 50, MaskFilter=blur(44), BlendMode=skia.BlendMode.kScreen))
    rs = np.random.default_rng(8)
    for k in range(70):
        x = rs.uniform(x0, x1); y = rs.uniform(y0 + 20, 1900); w = rs.uniform(40, 220) * (y - y0 + 40) / 600
        c.drawLine(x, y, x + w, y + 2, SP((150, 172, 228), 2.5 * (y - y0 + 40) / 600, 110))
    for k in range(18):       # snow drifts with a lit top
        x = rs.uniform(x0, x1); y = rs.uniform(y0 + 60, 1900); w = rs.uniform(60, 160) * (y - y0 + 60) / 500
        d = smooth_closed([(x - w, y), (x - w * 0.4, y - w * 0.14), (x + w * 0.3, y - w * 0.1), (x + w, y), (x, y + w * 0.05)])
        c.drawPath(d, P((150, 168, 220)))
        c.drawPath(smooth_closed([(x - w * 0.8, y - 2), (x - w * 0.4, y - w * 0.13), (x, y - w * 0.11), (x - w * 0.2, y - w * 0.04)]), P((196, 210, 248)))


def _crack(seed, cx, cy, rx, ry, angs):
    rs = np.random.default_rng(seed); out = []
    for a_deg in angs:
        a = math.radians(a_deg + rs.uniform(-6, 6)); L_ = 180 + rs.uniform(0, 220)
        pts = [(cx + rx * math.cos(a), cy + ry * math.sin(a))]
        for _ in range(5):
            aa = a + rs.uniform(-0.4, 0.4)
            pts.append((pts[-1][0] + L_ / 5 * math.cos(aa), pts[-1][1] + L_ / 5 * 0.36 * math.sin(aa)))
        out.append(pts)
        b0 = pts[2]; ab = a + rs.choice([-0.9, 0.9])
        out.append([b0, (b0[0] + 0.3 * L_ * math.cos(ab), b0[1] + 0.3 * L_ * 0.36 * math.sin(ab))])
    return out


HOLE_EDGE = None


def hole_paths():
    global HOLE_EDGE
    if HOLE_EDGE is None:
        rs = np.random.default_rng(11); pts = []
        for i in range(30):
            a = 2 * math.pi * i / 30
            r = 1 + rs.uniform(-0.07, 0.07)
            pts.append((HX + HRX * r * math.cos(a), HY + HRY * r * math.sin(a)))
        HOLE_EDGE = pts
    return poly(HOLE_EDGE)


def hole_back(c, t):
    """everything of the hole that sits behind the patient: the cracks, the snow rim, the water, the far lip"""
    for pts in _crack(3, HX, HY, HRX * 1.05, HRY * 1.05, (-15, 22, 160, 196, 60, 120)):
        p = skia.Path(); p.moveTo(*pts[0])
        for q in pts[1:]: p.lineTo(*q)
        c.drawPath(p, SP((232, 242, 255), 3, 190)); c.drawPath(p, SP((52, 68, 124), 1.3, 220))
        g_ = (t - T_HE) / 1.1
        if 0 < g_ < 1:              # light runs out along the cracks: this is where the ice broke under him
            pm = skia.PathMeasure(p, False); Lp = pm.getLength()
            pos, _ = pm.getPosTan(Lp * ease_io(g_))
            c.drawCircle(pos.x(), pos.y(), 14, P((220, 236, 255), 200 * (1 - g_), MaskFilter=blur(8), BlendMode=skia.BlendMode.kScreen))
    rim = hole_paths()
    out = skia.Path(rim); m = skia.Matrix(); m.setScale(1.18, 1.32, HX, HY); out.transform(m)
    c.drawPath(out, P((196, 214, 252)))                       # snowy, lit rim around the break
    c.drawPath(rim, P((12, 20, 44)))                          # black water
    # the far lip: ice thickness lit by the moon, seen across the water
    c.save(); c.clipPath(rim, skia.ClipOp.kIntersect, True)
    c.drawOval(skia.Rect(HX - HRX - 10, HY - HRY - 6, HX + HRX + 10, HY - HRY + 22), P((96, 150, 214)))
    c.drawOval(skia.Rect(HX - HRX, HY - HRY + 8, HX + HRX, HY - HRY + 30), P((12, 20, 44)))
    # moon glints on the water
    for k in range(6):
        x = HX - 120 + k * 46 + 8 * math.sin(t * 1.3 + k); y = HY + 8 + 6 * math.sin(t * 0.9 + k * 2)
        c.drawLine(x, y, x + 22, y, SP((170, 196, 255), 2.5, 120 + 60 * math.sin(t * 2 + k)))
    c.restore()


def hole_front(c, t, lift, body_x):
    """drawn over the patient: the water around his body (rings), the near lip with its lit ice thickness, slabs"""
    rim = hole_paths()
    c.save(); c.clipPath(rim, skia.ClipOp.kIntersect, True)
    # water in front of him, with rings spreading from his body
    w = skia.Path(); w.addRect(skia.Rect(HX - HRX - 20, HY - 4, HX + HRX + 20, HY + HRY + 20))
    c.drawPath(w, P((14, 24, 50)))
    for k in range(3):
        u = ((t * 0.55 + k / 3) % 1.0)
        rx = 50 + 170 * u; ry = 8 + 24 * u
        c.drawOval(skia.Rect(body_x - rx, HY - ry * 0.4, body_x + rx, HY + ry), SP((150, 180, 240), 2.4, 150 * (1 - u)))
    c.drawOval(skia.Rect(body_x - 70, HY - 8, body_x + 70, HY + 10), SP((200, 220, 255), 3, 160))
    c.restore()
    # the near lip: the ice thickness, lit blue, in front of the water
    lip = skia.Path()
    pts = HOLE_EDGE[:16]
    lip.moveTo(*pts[0])
    for q in pts[1:]: lip.lineTo(*q)
    for q in reversed(pts): lip.lineTo(q[0], q[1] + 22)
    lip.close()
    c.drawPath(lip, P((110, 170, 232)))
    c.drawPath(lip, P((210, 236, 255), 140, MaskFilter=blur(3)))
    lip2 = skia.Path(); lip2.moveTo(*pts[0])
    for q in pts[1:]: lip2.lineTo(q[0], q[1] + 22)
    c.drawPath(lip2, SP((236, 246, 255), 4))
    # broken slabs tilted in the water at the right side, bobbing
    for (sx, sy, w_, a0, ph) in ((HX + 150, HY + 6, 70, -14, 0.0), (HX + 100, HY + 30, 54, 10, 1.4)):
        a = a0 + 3 * math.sin(t * 1.4 + ph); bob = 3 * math.sin(t * 1.1 + ph)
        c.save(); c.translate(sx, sy + bob); c.rotate(a)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w_ / 2, -16, w_ / 2, 8), 4, 4), P((120, 176, 234)))
        c.drawRect(skia.Rect(-w_ / 2, -16, w_ / 2, -8), P((220, 238, 255)))
        c.restore()


def snow(c, t, n=90, near=False, w=1080, h=1920):
    rs = np.random.default_rng(31 if near else 30)
    for k in range(n):
        x0, y0, sp = rs.uniform(0, w), rs.uniform(0, h), rs.uniform(30, 70) * (2.2 if near else 1)
        x = (x0 + 24 * math.sin(t * 0.6 + k) - t * 12) % w
        y = (y0 + sp * t) % h
        c.drawCircle(x, y, rs.uniform(1.5, 3.0) * (2.6 if near else 1), P((240, 244, 255), 210 if near else 150, MaskFilter=blur(3 if near else 0.5)))


def beam(c, x, y, ang, L_=520, a=60, spread=0.2):
    p = poly([(x, y), (x + L_ * math.cos(ang - spread), y + L_ * math.sin(ang - spread)), (x + L_ * math.cos(ang + spread), y + L_ * math.sin(ang + spread))])
    sh = skia.GradientShader.MakeRadial(skia.Point(x, y), L_, [C((255, 250, 220), a), C((255, 250, 220), 0)])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=sh, BlendMode=skia.BlendMode.kScreen))
    c.drawCircle(x, y, 16, P((255, 250, 220), 120, MaskFilter=blur(8), BlendMode=skia.BlendMode.kScreen))


def breath(c, t, x, y, period, ph, dirx=1, k_=1.0):
    u = ((t + ph) % period) / period
    if u > 0.6: return
    k = u / 0.6
    for j in range(3):
        c.drawCircle(x + dirx * (14 + 50 * k + j * 12) * k_, y - (10 * k + j * 5) * k_, (10 + 22 * k) * k_, P((230, 236, 255), 70 * (1 - k), MaskFilter=blur(7 + 10 * k)))


def throw_bag(c, t, x, y):
    """the throw bag the rescuers carried out, its yellow line coiled on the ice"""
    c.drawOval(skia.Rect(x - 60, y - 6, x + 60, y + 12), P((20, 28, 60), 110, MaskFilter=blur(6)))
    for k in range(4):
        c.drawOval(skia.Rect(x - 50 + k * 4, y - 12 + k * 2, x + 30 - k * 4, y + 6 - k), SP((246, 214, 70), 3.5, 230))
    bag = smooth_closed([(x + 30, y + 4), (x + 34, y - 30), (x + 50, y - 40), (x + 66, y - 30), (x + 70, y + 4)])
    c.drawPath(bag, P((214, 52, 52))); c.drawLine(x + 40, y - 28, x + 64, y - 28, SP((240, 240, 240), 3))


def near_ice(c, t, y, seed=4, x0=-1400, x1=2800):
    """foreground: a wind carved snowbank close to the lens, lightly out of focus, its crest lit by the moon"""
    rs = np.random.default_rng(seed)
    pts = []; x = x0
    while x <= x1:
        pts.append((x, y + 40 * math.sin(x / 210 + seed) + 26 * math.sin(x / 97 + 2 * seed) + rs.uniform(-6, 6))); x += 40
    K.blur_layer(c, 4)
    c.drawPath(ridge(pts, 4000), P((104, 120, 178)))
    crest = skia.Path(); crest.moveTo(*pts[0])
    for q in pts[1:]: crest.lineTo(*q)
    c.drawPath(crest, SP((196, 212, 252), 10))
    lower = [(px, py + 70) for px, py in pts]
    c.drawPath(ridge(lower, 4000), P((86, 100, 158)))
    for k in range(26):         # snow glints on the bank
        gx = rs.uniform(x0, x1); gy = y + rs.uniform(10, 160)
        c.drawCircle(gx, gy, 3, P((236, 244, 255), 120 + 100 * math.sin(t * 2 + k)))
    c.restore()


def sled_board(c, x0, x1, y, flat_only=False):
    """the orange ice rescue sled seen from the side: a long tray with a raised rim and runners"""
    h = 30
    body = smooth_closed([(x0 + 10, y - h), (x1 - 40, y - h), (x1, y - h - 16), (x1 + 6, y - h - 8), (x1 - 20, y), (x0 + 18, y), (x0, y - 12)])
    c.drawOval(skia.Rect(x0 - 10, y - 8, x1 + 10, y + 10), P((20, 28, 60), 120, MaskFilter=blur(8)))
    c.drawPath(body, P((236, 112, 30)))
    c.drawPath(skia.Op(body, _off(body, 0, -10), skia.PathOp.kDifference_PathOp) or skia.Path(), P((176, 70, 20)))
    c.drawLine(x0 + 16, y - h + 4, x1 - 34, y - h + 4, SP((255, 170, 90), 3, 200))
    for k in range(4):        # grab handles along the rim
        hx = x0 + 40 + k * (x1 - x0 - 90) / 3
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hx - 14, y - h + 8, hx + 14, y - h + 16), 4, 4), P((120, 46, 14)))


def _off(p, dx, dy):
    q = skia.Path(p); q.offset(dx, dy); return q


# ------------------------------------------------------------------ the haul (one lift value drives RED and the patient)
YANKS = None


def lift_at(t):
    """one value drives the haul: two hard yanks with slips back in the hook, a hold, a harder yank on 'rough', then
    she stops him and he eases the man back down"""
    u = 40 + 125 * smooth(t / 0.11) - 90 * smooth((t - 0.45) / 0.5) + 125 * smooth((t - 2.3) / 0.1) - 120 * smooth((t - 2.75) / 0.6)
    u += 3 * math.sin(t * 9) * (1 - smooth((t - 3.6) / 0.6))           # straining
    u += 5 * math.sin(t * 0.9) * smooth((t - 4) / 2)                     # he keeps holding him up, sagging a little
    u += 120 * smooth((t - T_ROUGH + 0.15) / 0.1) - 30 * smooth((t - T_ROUGH + 0.05) / 0.5)
    u -= 120 * smooth((t - T_COULD + 0.2) / 1.6)
    return u


def yank_times():
    return (0.0, 2.3, T_ROUGH - 0.15)


def snap(t):
    """his head snaps back on each yank (he is limp), then settles"""
    v = 0.0
    for y in yank_times():
        if t > y: v += math.exp(-(t - y - 0.12) ** 2 / 0.02) if t - y < 0.12 else math.exp(-(t - y - 0.12) / 0.25)
    return min(1.0, v)


def shake(t):
    jx = jy = 0.0
    for y in yank_times():
        if 0 < t - y < 0.6:
            e = math.exp(-(t - y) / 0.16)
            jx += 16 * e * math.sin((t - y) * 55); jy += 11 * e * math.sin((t - y) * 41 + 1)
    return jx, jy


def splash(c, t, t0, x, y, n=34, seed=0):
    """water thrown up from the waterline as he is yanked: drops on real ballistic paths, a sheet off his parka, a ring"""
    u = t - t0
    if u < 0 or u > 1.1: return
    rs = np.random.default_rng(seed)
    for k in range(n):
        vx = rs.uniform(-340, 340); vy = rs.uniform(-820, -360); r0 = rs.uniform(5, 11)
        px = x + rs.uniform(-60, 60) + vx * u; py = y + vy * u + 1100 * u * u
        if py > y + 8: continue
        a = 230 * (1 - u / 1.1)
        c.drawOval(skia.Rect(px - r0 * 0.7, py - r0 * 1.4, px + r0 * 0.7, py + r0 * 1.4), P((190, 220, 255), a))
        c.drawCircle(px - r0 * 0.2, py - r0 * 0.5, r0 * 0.3, P((255, 255, 255), a))
    k = min(1, u / 0.5)
    c.drawOval(skia.Rect(x - 90 - 160 * k, y - 10 - 10 * k, x + 90 + 160 * k, y + 14 + 18 * k), SP((220, 236, 255), 4, 220 * (1 - k)))
    sheet = poly([(x - 70, y), (x - 50, y - 70 * (1 - k)), (x + 50, y - 70 * (1 - k)), (x + 70, y)])
    c.drawPath(sheet, P((170, 206, 250), 120 * (1 - k), MaskFilter=blur(3)))


_PREST = PK.joints(Pose())
_CHEST_Y = _PREST['torso_f'](0, 230)[1]


def patient_pose(t, lift):
    k = PK.k
    g = HY - lift - _CHEST_Y * k
    br = math.sin(t * 2.0)
    ps = Pose(x=HX + 20, ground=g, face=-1, lean=10 + 6 * min(1, lift / 100), neck=18 + 16 * smooth((t - T_HE) / 3.5) * (1 - smooth((t - T_AND) / 1.0)) + 4 * math.sin(t * 0.7) - 46 * snap(t), br=br, blink=True, hand_n='flat', hand_f='flat',
              uarm_f=10, elbow_f=20, thigh_n=6, knee_n=-10, thigh_f=-4, knee_f=-6)
    # near hand on the ice in front of him until it is out of reach, then the arm hangs
    tgt = (HX - HRX - 30, HY - 18)
    sh = PK.canvas_pt(ps, PK.joints(ps)['sh'])
    reach = (A_UARM + A_FARM) * k * 0.98
    dist = math.hypot(tgt[0] - sh[0], tgt[1] - sh[1])
    hang = smooth((dist - reach * 0.9) / (reach * 0.25))
    if hang < 1:
        tp = PK.wpt(ps, tgt)
        hp = PK.wpt(ps, (sh[0] - 30, sh[1] + 300 * k * 1.3))
        ps.hand_tn = (lerp(tp[0], hp[0], hang), lerp(tp[1], hp[1], hang))
    else:
        ps.uarm_n, ps.elbow_n = 12, 26
    return ps


A_UARM, A_FARM = 215, 200


def chest_pt(ps):
    J = PK.joints(ps)
    return PK.canvas_pt(ps, J['torso_f'](70, 250))


def grip_pt(ps, s='n'):
    """the front of his parka at the chest, under the arms: where RED's gloves hold"""
    J = PK.joints(ps)
    return PK.canvas_pt(ps, J['torso_f'](100 if s == 'n' else 92, 300 if s == 'n' else 316))


def red_pose(t, lift, pat):
    """RED kneels at the rim and holds the man's parka at the chest. His lean follows the lift (bent far over while
    the man is low, straighter as he hauls), and his hip height is solved every frame so his shoulder sits at a
    natural reach from the grip; the wrists are then solved onto the grip (IK)."""
    u = max(0.0, min(1.0, lift / 200))
    g = HY - 6
    tgt = grip_pt(pat, 'n')
    reach = (A_UARM + A_FARM) * RK.k
    def mk(lean, hip):
        return Pose(x=RX, ground=g, face=1, lean=lean, neck=lean + lerp(10, 0, u) + NECK_ADD, hip_h=hip,
                    foot_tn=(30, -140), foot_tf=(-300, -64), ank_f=-78, free_ank=True, hand_n='grip', hand_f='grip', br=math.sin(t * 2.6))
    lean = lerp(60, 18, u)
    def dist(hip):
        ps = mk(lean, hip); sh = RK.canvas_pt(ps, RK.joints(ps)['sh'])
        return math.hypot(tgt[0] - sh[0], tgt[1] - sh[1]), sh[1] < tgt[1]
    # the shoulder stays above the grip: on that branch the reach grows with the hip height, so bisect there
    for _ in range(12):
        lo, hi = 250.0, 720.0
        for _ in range(26):
            mid = (lo + hi) / 2; d, above = dist(mid)
            if not above or d < 0.9 * reach: lo = mid
            else: hi = mid
        if dist(lo)[0] < 0.97 * reach: break
        lean += 2.5                       # he bends further over to reach him low in the water
    ps = mk(lean, (lo + hi) / 2)
    ps.hand_tn = RK.wpt(ps, grip_pt(pat, 'n'))
    ps.hand_tf = RK.wpt(ps, grip_pt(pat, 'f'))
    return ps


T_HAND = None


def pat_shoulder(pat):
    """the back of the man's shoulder (he faces left; his back is to the right): where TEAL's hand rests"""
    J = PK.joints(pat)
    return PK.canvas_pt(pat, J['torso_f'](-92, 318))


def orange_pose(t):
    """TEAL walks in from the right on the near side of the hole (planted steps), crouches at the right rim, and her
    near hand comes to rest on the back of the man's shoulder (from T_KIND + 1.4); she never overlaps RED"""
    g = HY + 64
    x0, x1 = 1180, 868
    ws, we = T_KIND - 0.8, T_KIND + 0.45
    u = smooth((t - ws) / (we - ws))
    d = (x0 - x1) * u
    ps = walker_pose(OK_, x0 - d, g, d, -1, stride=80, moving=0 < u < 1)
    k = smooth((t - we + 0.05) / 0.9)
    ps.lean = lerp(6, 34, k); ps.hip_h = lerp(ps.hip_h, 560, k); ps.neck = lerp(4, 34, k)
    return ps, g


def walker_pose(who, x, g, d, face, stride=80, moving=True, lean=6):
    """foot locked walk: d is the distance walked; each foot is planted (fixed in the world) during its stance and
    swings forward to its next plant; the hip moves at the body's speed"""
    k = who.k
    SL = stride            # world px per step
    ps = Pose(x=x, ground=g, face=face, lean=lean, neck=4, hip_h=lerp(700, 690, abs(math.sin(d / SL * math.pi))), free_ank=True)
    for s, off in (('n', 0.0), ('f', 0.5)):
        p = d / (2 * SL) + off
        n = math.floor(p); f = p - n
        plant = lambda m: (m + 0.3 - off) * 2 * SL
        if f < 0.6 or not moving:
            D = plant(n); lift_ = 0.0
            if not moving: D = d + (0.25 if s == 'n' else -0.25) * SL * 0.6
        else:
            v = (f - 0.6) / 0.4; v2 = ease_io(v)
            D = lerp(plant(n), plant(n + 1), v2); lift_ = 40 * math.sin(math.pi * v)
        fx = (D - d) / k
        setattr(ps, 'foot_t' + s, (fx, -140 - lift_ / k))
        setattr(ps, 'ank_' + s, 0)
    return ps


def bend_to(op, target):
    """she bends lower (lean, hip) until her hand can rest on the target"""
    reach = (A_UARM + A_FARM) * OK_.k
    for _ in range(26):
        sh = OK_.canvas_pt(op, OK_.joints(op)['sh'])
        if math.hypot(target[0] - sh[0], target[1] - sh[1]) < 0.95 * reach or op.lean > 62: break
        op.lean += 2.5; op.hip_h -= 8; op.neck += 2.5


def red_shoulder(ps):
    J = RK.joints(ps)
    return RK.canvas_pt(ps, (J['sh'][0] + 10, J['sh'][1] - 20))


def red_harness(ps):
    J = RK.joints(ps)
    return RK.canvas_pt(ps, J['torso_f'](-60, 30))


# ------------------------------------------------------------------ heart lens
def ecg_v(tt, t0, period=1.5):
    u = ((tt - t0) % period)
    def g(c_, w):
        d = ((u - c_ + period / 2) % period) - period / 2
        return math.exp(-(d / w) ** 2)
    return 0.12 * g(-0.17, 0.035) - 0.10 * g(-0.022, 0.008) + 1.0 * g(0.0, 0.011) - 0.30 * g(0.026, 0.010) \
        + 0.30 * g(0.058, 0.026) + 0.22 * g(0.40, 0.07)


def ecg_vf(tt):
    a = 0.55 + 0.45 * abs(math.sin(tt * 1.3 + math.sin(tt * 0.7)))
    return a * (0.34 * math.sin(tt * 29 + 3 * math.sin(tt * 2.3)) + 0.26 * math.sin(tt * 43 + 2.2 * math.sin(tt * 3.7) + 1)
                + 0.18 * math.sin(tt * 17 + 1.5 * math.sin(tt * 5.1) + 2) + 0.1 * math.sin(tt * 67 + 0.7))


BEAT0 = T_A + 0.1


def extra(tt):
    """one early (extra) beat just after 'twitchy'"""
    e = T_TW + 0.25
    return math.exp(-((tt - e) / 0.011) ** 2) * 0.85 - 0.25 * math.exp(-((tt - e - 0.03) / 0.012) ** 2)


T_VF = T_JOLT + 0.35
T_VF_END = T_AND - 0.2


def vf_amt(t):
    return smooth((t - T_VF) / 0.25) * (1 - smooth((t - T_VF_END) / 0.4))


def beat_amt(t, t0):
    b = HT.beat_at(t, t0)
    e = T_TW + 0.25
    if 0 < t - e < 0.6: b = max(b, 0.8 * math.exp(-((t - e - 0.16) / 0.1) ** 2))
    return b * (1 - vf_amt(t))


def lens(c, t, cx, cy, r, chest, t0, mode):
    """mode 'cold' (first lens) or 'steady' (the last)"""
    if r < 2: return
    if chest is not None:
        ax, ay = chest; d = math.hypot(ax - cx, ay - cy) or 1; ux, uy = (ax - cx) / d, (ay - cy) / d
        nx, ny = -uy, ux; w_ = r * 0.4
        a = min(1, r / 160)
        cone = poly([(cx + nx * w_ + ux * r * 0.8, cy + ny * w_ + uy * r * 0.8), (ax, ay), (cx - nx * w_ + ux * r * 0.8, cy - ny * w_ + uy * r * 0.8)])
        c.drawPath(cone, P((220, 236, 255), 40 * a, MaskFilter=blur(4), BlendMode=skia.BlendMode.kScreen))
        c.drawCircle(ax, ay, 30, P((236, 244, 255), 110 * a, MaskFilter=blur(14), BlendMode=skia.BlendMode.kScreen))
    cp = skia.Path(); cp.addCircle(cx, cy, r)
    c.drawCircle(cx, cy + 10, r + 6, P((0, 0, 10), 120, MaskFilter=blur(18)))
    c.save(); c.clipPath(cp, skia.ClipOp.kIntersect, True)
    vf = vf_amt(t) if mode == 'cold' else 0.0
    bg0 = mix((40, 34, 66), (80, 24, 40), vf)
    lgrad(c, skia.Rect(cx - r, cy - r, cx + r, cy + r), cy - r, cy + r, [bg0, mix(bg0, (14, 12, 30), 0.6)])
    for k in range(7):        # soft tissue shapes breathing behind
        c.drawCircle(cx - r + k * r / 3, cy - 40 + 40 * math.sin(t * 0.6 + k), r * 0.28, P((120, 70, 96), 40, MaskFilter=blur(24)))
    # frost creeping at the rim of the lens: it is a cold heart
    for k in range(18):
        a = k / 18 * 2 * math.pi + 0.2
        c.drawCircle(cx + (r - 8) * math.cos(a), cy + (r - 8) * math.sin(a), 22 + 8 * math.sin(k * 1.7), P((190, 220, 255), 60, MaskFilter=blur(10)))
    hs = r / 250 * 0.8
    beat = beat_amt(t, t0)
    zoom = 1 + 0.04 * smooth((t - (T_A if mode == 'cold' else T_AND5)) / 8)
    c.save(); c.translate(cx, cy - r * 0.12); c.scale(zoom, zoom); c.translate(-cx, -(cy - r * 0.12))
    if vf > 0:                  # it quivers: a fast, uneven shiver of the whole heart, no squeeze
        c.translate(vf * hs * (5 * math.sin(t * 61) + 3 * math.sin(t * 37 + 1)), vf * hs * (4 * math.sin(t * 47 + 2) + 2 * math.sin(t * 29)))
        c.rotate(vf * 1.6 * math.sin(t * 53))
    HT.draw_heart(c, cx - 8 * hs, cy + r * 0.02, hs, t, beat, vf)
    c.restore()
    # the ECG strip across the lower part of the lens
    y0 = cy + r * 0.36
    c.drawRect(skia.Rect(cx - r, y0 - 6, cx + r, cy + r), P((6, 14, 20), 230))
    col = mix((90, 240, 160), (255, 80, 80), vf)
    x0, x1 = cx - r * 0.86, cx + r * 0.86
    span = 3.0; n = 220
    p = skia.Path()
    base, amp = y0 + r * 0.38, r * 0.27
    for i in range(n + 1):
        tt = t - span + span * i / n
        m = vf_amt(tt) if mode == 'cold' else 0.0
        yv = (1 - m) * (ecg_v(tt, t0) + (extra(tt) if mode == 'cold' else 0)) + m * ecg_vf(tt)
        X, Y = lerp(x0, x1, i / n), base - yv * amp
        p.moveTo(X, Y) if i == 0 else p.lineTo(X, Y)
    c.drawPath(p, SP(col, 5))
    c.drawPath(p, SP(col, 14, 50, MaskFilter=blur(6)))
    c.drawCircle(X, Y, 7, P(col)); c.drawCircle(X, Y, 18, P(col, 90, MaskFilter=blur(8), BlendMode=skia.BlendMode.kScreen))
    c.restore()
    c.drawCircle(cx, cy, r, SP((232, 242, 255), 7, 235))


def vf_label(c, cx, cy, r, a):
    """the rhythm's name on the lens, just above its trace"""
    f = skia.Font(L.XBOLD, 36); txt = 'VENTRICULAR FIBRILLATION'; w = f.measureText(txt)
    y = cy + r * 0.3
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - w / 2 - 16, y - 40, cx + w / 2 + 16, y + 10), 12, 12), P((40, 6, 12), 220 * a))
    c.drawString(txt, cx - w / 2, y, f, P((255, 140, 140), 255 * a))


def chip(c, text, x, y, col, a=1.0, size=34, fg=(10, 16, 30)):
    if a <= 0.01: return
    f = skia.Font(L.XBOLD, size); w = f.measureText(text)
    x = max(48, min(1032 - w - 40, x - (w + 40) / 2))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + w + 40, y + size + 22), 22, 22), P(col, 240 * a))
    c.drawString(text, x + 20, y + size + 4, f, P(fg, 255 * a))


# ------------------------------------------------------------------ shot A: the hole
def cam_A(t):
    """a push on the haul (then a zoom cut under the ice), the close shot on him while the big lens is open (slow
    pushes, a punch on the jolt), a pull back out for the hard yank, then a push to her hand on his shoulder"""
    if t < T_U0:
        u = ease_io(t / T_U0); z, x, y = lerp(1.24, 1.36, u), lerp(430, 470, u), lerp(1050, 1075, u)
    elif t < T_A:
        u = ease_io((t - T_U1) / (T_A - T_U1)); z, x, y = lerp(1.74, 1.8, u), 560, lerp(1045, 1035, u)
    elif t < T_ONE:
        u = ease_io((t - T_A) / (T_ONE - T_A)); z, x, y = lerp(1.8, 1.9, u), lerp(560, 578, u), lerp(1035, 1028, u)
    elif t < T_AND:
        u = ease_io((t - T_ONE) / (T_AND - T_ONE)); z, x, y = lerp(1.9, 2.02, u), lerp(578, 545, u), lerp(1028, 1038, u)
        if t > T_VF: z += 0.06 * math.exp(-(t - T_VF) / 0.35)
    elif t < T_KIND + 0.6:
        u = ease_io((t - T_AND) / (T_KIND + 0.6 - T_AND)); z, x, y = lerp(2.02, 1.3, u), lerp(545, 430, u), lerp(1038, 1080, u)
    else:
        u = ease_io((t - T_KIND - 0.6) / (T_CUT - T_KIND - 0.6)); z, x, y = lerp(1.3, 1.42, u), lerp(430, 600, u), lerp(1080, 1110, u)
    return z, x, y


LENS_A = (520, 702)


def frost(c, t, pat):
    """he has been in the water too long: frost creeps over his beanie, brows and shoulders"""
    f = smooth((t - T_HE) / 3.5)
    if f <= 0.01: return
    J = PK.joints(pat); h = PK._hf(J)
    rs = np.random.default_rng(5)
    for k in range(46):
        if k < 24: p = PK.canvas_pt(pat, h(*_hp_((rs.uniform(80, 240), rs.uniform(40, 120)))))
        else: p = PK.canvas_pt(pat, J['torso_f'](rs.uniform(-90, 90), rs.uniform(330, 372)))
        r0 = rs.uniform(1.5, 3.6)
        if k / 46 > f: continue
        c.drawCircle(p[0], p[1], r0, P((240, 248, 255), 210))


def lens_r(t, a, b, rmax=255):
    return rmax * ease_io((t - a) / 0.45) * (1 - ease_io((t - b) / 0.4))


def shot_A(c, t):
    z, cx, cy = cam_A(t)
    lift = lift_at(t)
    jx, jy = shake(t)                                            # the camera feels each yank
    c.save(); c.translate(540 + jx, 960 + jy); c.scale(z, z); c.translate(-cx, -cy)
    # far world (slight parallax: drawn with a smaller zoom offset)
    c.save(); par = 0.55; c.translate(cx * (1 - par) - 240 * (1 - par), cy * (1 - par) - 960 * (1 - par)) if False else None
    sky(c, t); moon(c, 150, 748); shore(c, t); ambulance(c, t, 840, 932, 0.6); ice_plain(c, t, moon_x=180)
    c.restore()
    hole_back(c, t)
    throw_bag(c, t, 160, 1440)
    pat = patient_pose(t, lift)
    rp = red_pose(t, lift, pat)
    op, og = orange_pose(t)
    # TEAL comes in on the near side, right of the hole: her near hand moves to the back of his shoulder
    if t >= T_KIND - 0.8:
        tg = pat_shoulder(pat)
        bend_to(op, tg)
        k = smooth((t - T_KIND - 0.55) / 0.85)
        rest = (op.x - 40, og - 300)
        op.hand_tn = OK_.wpt(op, (lerp(rest[0], tg[0], k), lerp(rest[1], tg[1], k)))
        op.hand_n = 'flat' if k > 0.85 else 'grip'; op.uarm_f, op.elbow_f = 4, 24
    # the patient, cut at the waterline, then the water and the near lip over him
    c.save(); c.clipRect(skia.Rect(-2000, -2000, 4000, HY + 2)); PK.draw(c, pat, light=LIGHT, rim=RIMC, world=True, shadow=False); c.restore()
    frost(c, t, pat)
    hole_front(c, t, lift, HX + 10)
    for i, y in enumerate(yank_times()): splash(c, t, y, HX + 4, HY, seed=i)
    # RED on the sled board at the rim
    sled_board(c, BOARD[0] - 60, BOARD[1] - 30, HY + 4)
    RK.draw(c, rp, light=LIGHT, rim=RIMC, world=True, shadow=False)
    beam(c, *RK.lamp_world(rp), math.radians(lerp(30, 8, min(1, lift / 100))), 380, 60)
    breath(c, t, *RK.mouth_world(rp), 2.4, 0.0, dirx=1)
    breath(c, t, *PK.mouth_world(pat), 3.6, 0.8, dirx=-1, k_=0.7)
    # TEAL, nearest to us: her hand lies on top of his shoulder
    if t >= T_KIND - 0.8:
        OK_.draw(c, op, light=LIGHT, rim=RIMC, world=True)
        beam(c, *OK_.lamp_world(op), math.radians(160), 420, 46)
        breath(c, t, *OK_.mouth_world(op), 2.9, 1.2, dirx=-1)
    near_ice(c, t, 1560)
    c.restore()
    snow(c, t, 80)
    K.blur_layer(c, 3); snow(c, t, 14, near=True); c.restore()
    # the cold heart lens
    ch = chest_pt(pat)
    chs = (540 + jx + (ch[0] - cx) * z, 960 + jy + (ch[1] - cy) * z)
    wp = math.exp(-((t - 2.85) / 0.35) ** 2) + 0.6 * math.exp(-((t - 3.75) / 0.3) ** 2)     # the warning: his heart, at risk
    if wp > 0.02:
        c.drawCircle(*chs, 120, P((255, 60, 60), 120 * wp, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
        c.drawCircle(*chs, 40 + 60 * (1 - wp), SP((255, 110, 110), 5, 220 * wp))
    r = lens_r(t, T_A - 0.15, T_AND - 0.3, 262)
    if r > 1:
        # the lens grows out of his chest and rises to its place above him (and sinks back into his chest)
        g = ease_io((t - T_A + 0.15) / 0.6) * (1 - ease_io((t - T_AND + 0.3) / 0.45))
        lens(c, t, lerp(chs[0], LENS_A[0], g), lerp(chs[1], LENS_A[1], g), r, chs, BEAT0, 'cold')
    if r > 100:
        a = min(1, (r - 100) / 80)
        if t < T_ONE:
            chip(c, 'SLOW, COLD BEAT', LENS_A[0], 446, (120, 236, 180), a * smooth((t - T_A - 0.3) / 0.3), size=48)
        elif t < T_VENT:
            chip(c, 'IF JOLTED', LENS_A[0], 446, (255, 96, 96), a * smooth((t - T_ONE) / 0.2), size=48)
        else:
            chip(c, 'IF JOLTED', LENS_A[0], 446, (255, 96, 96), a, size=48)
            vf_label(c, LENS_A[0], LENS_A[1], r, a)
    if T_VF < t < T_VF + 1.2:          # the jolt lands (in the IF): a red flash at the frame edges
        e = math.exp(-(t - T_VF) / 0.4)
        sh_ = skia.GradientShader.MakeRadial(skia.Point(540, 960), 1150, [C((255, 40, 40), 0), C((255, 40, 40), int(150 * e))], [0.45, 1.0])
        c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=sh_))


# ------------------------------------------------------------------ shot B: the sled
SG = 1370                 # the ice line under the sled
SPEED = 26.0              # px per second, slow and smooth
SLED_L = 610


def sled_x(t):
    """the sled's tail x: it moves only because they walk (same distance as their walking)"""
    return 1180 - walk_d(t)


def walk_d(t):
    u = t - T_CUT - 1.0          # they have just slid him out onto the sled at the hole: a beat, then they set off
    return SPEED * max(0.0, u) - SPEED * 0.6 * (1 - math.exp(-max(0.0, u) / 0.6))       # eases up to speed, never jerks


def lying_patient(c, t, x_head, y_back):
    """he lies flat on his back on the sled, head to the left (toward shore), wrapped and strapped"""
    k = PK.k
    c.save(); c.translate(x_head + 1365 * k * 0.98, y_back); c.rotate(-90)
    PK.draw(c, Pose(x=0, ground=0, face=1, blink=True, neck=6, uarm_n=0, elbow_n=4, uarm_f=0, elbow_f=4, br=math.sin(t * 1.6)),
            light=(-LIGHT[1], LIGHT[0]), rim=RIMC, shadow=False)
    c.restore()


def blanket(c, t, x0, x1, y_top, y_back):
    """the insulated wrap over him from the shoulders to the feet, with a hood edge round his head, and two straps"""
    br = 2.5 * math.sin(t * 1.6)
    w = smooth_closed([(x0, y_back - 6), (x0 + 30, y_top - 14 - br), (x0 + 200, y_top - 30 - br), (x0 + 330, y_top - 18),
                       (x1 - 30, y_top - 30), (x1, y_back - 20), (x1 - 10, y_back + 2), (x0 + 10, y_back + 4)])
    c.drawPath(w, P((70, 110, 190)))
    c.drawPath(skia.Op(w, _off(w, 6, 10), skia.PathOp.kDifference_PathOp) or skia.Path(), P((150, 190, 246)))
    for k in range(5):        # quilting lines
        x = x0 + 70 + k * (x1 - x0 - 120) / 4
        c.drawLine(x, y_top - 10, x + 6, y_back - 6, SP((50, 84, 156), 3, 180))
    for sx in (x0 + 150, x0 + 340):
        c.drawRect(skia.Rect(sx, y_top - 30, sx + 22, y_back + 4), P((36, 40, 50)))
        c.drawRect(skia.Rect(sx + 2, y_top - 22, sx + 20, y_top - 12), P((160, 164, 176)))


def shot_B(c, t):
    u = t - T_CUT
    sx = sled_x(t)
    # the camera opens on the hole they slid him out of and pans with the sled; on 'They handle him' it pushes in to
    # his face; after the payoff it pulls back wide over the lake toward the shore and the ambulance
    rv = 1 - ease_io(u / 3.2)
    z = 0.99 + 0.04 * ease_io(u / 6) - 0.08 * rv
    cx = sx + 300 + 260 * rv; cy = 1080
    pz = ease_io((t - T_THEY + 0.25) / 1.9)
    z, cx, cy = lerp(z, 1.72, pz), lerp(cx, sx + 235, pz), lerp(cy, 1205, pz)
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    c.save(); c.translate((cx - 1450) * 0.7, 0)          # parallax: the far shore drifts slower than the ice
    sky(c, t, x0=-1400, x1=2600); moon(c, 1120, 690); shore(c, t, y=900, x0=-1400, x1=2600)
    c.restore()
    ice_plain(c, t, y0=945, x0=-1400, x1=2600, moon_x=cx - 360)
    # the hole they pulled him from, fixed in the world right of where the sled started
    hx, hy = 1180 + SLED_L + 300, 1404
    c.drawOval(skia.Rect(hx - 200, hy - 42, hx + 200, hy + 42), P((196, 214, 252)))
    c.drawOval(skia.Rect(hx - 160, hy - 30, hx + 160, hy + 30), P((12, 20, 44)))
    c.drawArc(skia.Rect(hx - 160, hy - 30, hx + 160, hy + 30), 10, 160, False, SP((150, 200, 246), 6))
    for k in range(3):
        uu = ((t * 0.5 + k / 3) % 1.0)
        c.drawOval(skia.Rect(hx - 40 - 110 * uu, hy - 6 - 18 * uu, hx + 40 + 110 * uu, hy + 6 + 18 * uu), SP((150, 180, 240), 2.4, 140 * (1 - uu)))
    # the wet track from the hole to the sled: they slid him out flat, straight onto it
    tr = skia.Path(); tr.moveTo(sx + SLED_L - 10, SG - 2); tr.lineTo(hx - 150, hy - 4)
    c.drawPath(tr, SP((70, 92, 150), 30, 120))
    c.drawPath(tr, SP((170, 200, 250), 5, 150))
    # ORANGE walks behind the sled holding its tail line, so it never runs ahead or jerks: the line ends in her hands
    d = walk_d(t)
    og = SG - 26
    tail = (sx + SLED_L - 8, SG - 40)
    ox = tail[0] + 160
    op = walker_pose(OK_, ox, og, d, -1, stride=70, moving=d > 1, lean=2)
    hn = (ox - 70, og - 262); hf = (ox - 48, og - 250)
    op.hand_tn = OK_.wpt(op, hn); op.hand_tf = OK_.wpt(op, hf); op.hand_n = op.hand_f = 'grip'
    OK_.draw(c, op, light=LIGHT, rim=RIMC, world=True)
    hw = OK_.hand_world(op, 'n')
    line = skia.Path(); line.moveTo(*tail); line.quadTo((tail[0] + hw[0]) / 2, max(tail[1], hw[1]) + 30, *hw)
    c.drawPath(line, SP((246, 214, 70), 4.5))
    beam(c, *OK_.lamp_world(op), math.radians(165), 380, 40)
    breath(c, t, *OK_.mouth_world(op), 2.8, 0.5, dirx=-1)
    # the sled with him on it
    y_back = SG - 40
    lying_patient(c, t, sx + 30, y_back)
    blanket(c, t, sx + 112, sx + SLED_L - 14, y_back - 60, y_back)
    sled_board(c, sx, sx + SLED_L, SG)
    # lake water still running off the sled's tail
    for k in range(5):
        v = ((t * 1.7 + k / 5) % 1.0); dd = max(0.0, 1 - (t - T_CUT) / 3.0)
        c.drawOval(skia.Rect(sx + SLED_L - 30 + k * 6 - 3, SG - 30 + 40 * v - 5, sx + SLED_L - 30 + k * 6 + 3, SG - 30 + 40 * v + 5), P((180, 214, 255), 200 * dd * (1 - v)))
    # snow spray at the runners while they move
    for k in range(6):
        v = ((t * 1.4 + k / 6) % 1.0)
        c.drawCircle(sx + 10 - 30 * v, SG - 4 - 12 * v, 5 + 8 * v, P((236, 244, 255), 110 * (1 - v) * min(1, d / 10)))
    # RED walking ahead to the left, the tow rope in his near hand
    rg = SG + 18
    rx = sx - 95
    rp = walker_pose(RK, rx, rg, d, -1, stride=72, moving=d > 1, lean=14)
    hand_t = (rx + 66, rg - 300)
    rp.hand_tn = RK.wpt(rp, hand_t); rp.hand_n = 'grip'
    rp.uarm_f, rp.elbow_f = 8 * math.sin(d / 72 * math.pi), 26
    nose = (sx + 18, SG - 30)
    hw = RK.hand_world(rp, 'n')
    rope = skia.Path(); rope.moveTo(*nose); rope.quadTo((nose[0] + hw[0]) / 2, max(nose[1], hw[1]) + 22, *hw)
    c.drawPath(rope, SP((246, 214, 70), 4.5))
    RK.draw(c, rp, light=LIGHT, rim=RIMC, world=True)
    beam(c, *RK.lamp_world(rp), math.radians(170), 420, 46)
    breath(c, t, *RK.mouth_world(rp), 2.5, 0.0, dirx=-1)
    near_ice(c, t, 1600, seed=5)
    c.restore()
    snow(c, t, 80)
    K.blur_layer(c, 3); snow(c, t + 7, 14, near=True); c.restore()
    ch = (540 + (sx + 30 + 1365 * PK.k * 0.98 - 1365 * PK.k * 0.68 - cx) * z, 960 + (y_back - 50 - cy) * z)
    r = lens_r(t, T_AND5 + 0.1, T_SLOW + 1.0, 262)
    if r > 1:
        g = ease_io((t - T_AND5) / 0.6) * (1 - ease_io((t - T_SLOW - 1.0) / 0.4))
        lens(c, t, lerp(ch[0], 540, g), lerp(ch[1], 702, g), r, ch, T_AND5 + 0.2, 'steady')
    if r > 100:
        chip(c, 'SLOW, STEADY BEAT', 540, 446, (120, 236, 180), min(1, (r - 100) / 80) * smooth((t - T_HIS) / 0.3), size=48)


# ------------------------------------------------------------------ shot U: under the ice ("He went through the ice")
UW = 640                       # the water surface in the hole, seen from below


def shot_U(c, t):
    """the camera is under the ice: the ice is a pale ceiling with the dark hole he fell through, moonlight falls through
    it in shafts, and he hangs in black water from the chest down, legs slowly treading, coat heavy, bubbles rising"""
    u = (t - T_U0) / (T_U1 - T_U0)
    lift = lift_at(t)
    z = lerp(1.75, 1.9, ease_io(u)); cx = lerp(640, 630, u); cy = lerp(UW + 240, UW + 330, ease_io(u))     # a slow tilt down his body
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    lgrad(c, skia.Rect(-600, UW - 400, 1800, 2900), UW, 2200, [(30, 64, 112), (12, 28, 60), (3, 8, 20)])
    hx0, hx1 = HX - 190, HX + 190
    # moonlight through the hole: soft shafts that sway, and caustics on the underside of the ice
    for k in range(5):
        a = 0.12 * math.sin(t * 0.8 + k * 1.7)
        x0 = hx0 + 40 + k * 70
        sh = poly([(x0, UW + 60), (x0 + 50, UW + 60), (x0 + 120 + 600 * a, UW + 1500), (x0 - 80 + 600 * a, UW + 1500)])
        g_ = skia.GradientShader.MakeLinear([skia.Point(0, UW + 60), skia.Point(0, UW + 1000)], [C((170, 210, 255), 34), C((170, 210, 255), 0)])
        c.drawPath(sh, skia.Paint(AntiAlias=True, Shader=g_, BlendMode=skia.BlendMode.kScreen, MaskFilter=blur(30)))
    # the ice ceiling with its thickness, cracks and caustic light
    ice = skia.Path(); ice.addRect(skia.Rect(-600, UW - 400, 1800, UW + 70))
    hole = skia.Path(); hole.addRRect(skia.RRect.MakeRectXY(skia.Rect(hx0, UW - 400, hx1, UW + 70), 30, 30))
    slab = skia.Op(ice, hole, skia.PathOp.kDifference_PathOp)
    c.drawPath(slab, P((126, 168, 220)))
    c.save(); c.clipPath(slab, skia.ClipOp.kIntersect, True)
    lgrad(c, skia.Rect(-600, UW - 10, 1800, UW + 70), UW - 10, UW + 70, [(170, 206, 246), (96, 140, 200)])
    rs = np.random.default_rng(12)
    for k in range(40):
        x = rs.uniform(-600, 1800); y = UW + rs.uniform(10, 66)
        c.drawOval(skia.Rect(x - 30, y - 5, x + 30 + 10 * math.sin(t + k), y + 5), P((220, 240, 255), 60 + 50 * math.sin(t * 1.5 + k)))
    for k in range(12):
        x = rs.uniform(-600, 1800)
        c.drawLine(x, UW + 20, x + rs.uniform(-60, 60), UW + 70, SP((70, 110, 170), 2, 180))
    c.restore()
    lgrad(c, skia.Rect(hx0, UW - 400, hx1, UW), UW - 400, UW, [(14, 22, 52), (56, 84, 140)])       # the night above, through the hole
    c.drawRect(skia.Rect(hx0, UW - 8, hx1, UW + 4), P((190, 222, 255)))     # the surface seen from below, bright
    # him: the part under the surface, tinted by the water; legs tread slowly, too cold to kick
    k = PK.k
    g = UW - lift - _CHEST_Y * k
    sw = math.sin(t * 1.3)
    ps = Pose(x=HX + 20, ground=g, face=-1, lean=8, neck=10, blink=True, hand_n='flat', hand_f='flat', uarm_n=40, elbow_n=60, uarm_f=30, elbow_f=60,
              thigh_n=8 + 7 * sw, knee_n=-10 - 8 * max(0, sw), thigh_f=-4 - 7 * sw, knee_f=-12 - 8 * max(0, -sw), ank_n=10, ank_f=12, br=math.sin(t * 2))
    c.save(); c.clipRect(skia.Rect(-2000, UW + 2, 4000, 4000))
    PK.draw(c, ps, light=(0.0, -1.0), rim=(150, 200, 255), world=True, shadow=False, tint=(10, 40, 90, 120))
    c.restore()
    # bubbles from his collar and sleeves, rising and wobbling up to the hole
    rs = np.random.default_rng(4)
    for k in range(22):
        ph = rs.uniform(0, 1); sp = rs.uniform(0.35, 0.7); x0 = HX + rs.uniform(-60, 60)
        v = (t * sp + ph) % 1.0
        y = lerp(UW + 380, UW + 6, v); x = x0 + 10 * math.sin(t * 3 + k)
        r0 = rs.uniform(3, 8)
        c.drawCircle(x, y, r0, SP((200, 230, 255), 2, 200)); c.drawCircle(x - r0 * 0.3, y - r0 * 0.3, r0 * 0.3, P((255, 255, 255), 200))
    # silt drifting in the dark
    for k in range(60):
        x = (rs.uniform(-400, 1600) + t * 8) % 2000 - 400; y = rs.uniform(UW + 100, UW + 1600) + 6 * math.sin(t + k)
        c.drawCircle(x, y, rs.uniform(1, 2.6), P((140, 180, 230), 90))
    c.restore()
    # cold, deep: a dark vignette pressing in
    vg = skia.GradientShader.MakeRadial(skia.Point(540, 860), 1200, [C((0, 0, 10), 0), C((0, 0, 10), 200)], [0.45, 1.0])
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=vg))


# ------------------------------------------------------------------ shot C: the shore and the ambulance
def shore_ambulance(c, t, x, y, s):
    """the ambulance parked on the shore, rear doors open, warm light inside spilling onto the snow"""
    ambulance(c, t, x, y, s)
    rx = x + 92 * s
    warm = (255, 196, 120)
    c.drawRect(skia.Rect(rx - 6 * s, y - 88 * s, rx + 2 * s, y - 16 * s), P((255, 214, 150)))              # lit doorway edge
    door = poly([(rx, y - 90 * s), (rx + 40 * s, y - 84 * s), (rx + 40 * s, y - 20 * s), (rx, y - 14 * s)])
    c.drawPath(door, P((214, 222, 240))); c.drawPath(poly([(rx + 8 * s, y - 80 * s), (rx + 32 * s, y - 77 * s), (rx + 32 * s, y - 60 * s), (rx + 8 * s, y - 62 * s)]), P((60, 76, 112)))
    c.drawCircle(rx + 10 * s, y - 50 * s, 120, P(warm, 170, MaskFilter=blur(50), BlendMode=skia.BlendMode.kScreen))
    c.drawOval(skia.Rect(rx - 40, y - 40, rx + 560, y + 160), P(warm, 120, MaskFilter=blur(50), BlendMode=skia.BlendMode.kScreen))


def shot_C(c, t):
    u = t - T_SHORE
    m = 150 * ease_io(u / 2.7)                 # they walk the last steps and stop: the sled moves only with them
    sx = 540 + 150 - m
    z = lerp(0.95, 1.02, ease_io(u / 3)); cx = lerp(600, 585, ease_io(u / 3)); cy = 1110
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)
    sky(c, t, x0=-600, x1=1800); moon(c, 930, 700)
    c.save(); c.translate(540, 1000); c.scale(1.5, 1.5); c.translate(-540, -1000); shore(c, t, y=1000, x0=-600, x1=1800); c.restore()
    lgrad(c, skia.Rect(-600, 1080, 1800, 3000), 1080, 1900, [(176, 192, 236), (128, 146, 200), (96, 112, 170)])     # snow on the shore
    lake = poly([(820, 1250), (1800, 1180), (1800, 3000), (1100, 3000)])                                         # the lake ice behind them
    c.drawPath(lake, P((100, 120, 182))); c.drawLine(820, 1250, 1100, 3000, SP((200, 220, 255), 6, 200))
    tr = skia.Path(); tr.moveTo(sx + SLED_L, SG - 2); tr.lineTo(1800, SG - 30)                                     # their track off the lake
    c.drawPath(tr, SP((150, 170, 226), 24, 110))
    shore_ambulance(c, t, 250, 1300, 2.3)
    d = m
    # TEAL walks on the far side of the sled, bent, her near hand on its rail
    og = SG - 30
    rail = (sx + SLED_L - 140, SG - 44)
    op = walker_pose(OK_, rail[0] + 70, og, d, -1, stride=70, moving=0 < u < 2.7, lean=20)
    bend_to(op, rail)
    op.hand_tn = OK_.wpt(op, rail); op.hand_n = 'flat'
    op.uarm_f, op.elbow_f = 10, 30
    OK_.draw(c, op, light=LIGHT, rim=RIMC, world=True)
    y_back = SG - 40
    lying_patient(c, t, sx + 30, y_back)
    blanket(c, t, sx + 112, sx + SLED_L - 14, y_back - 60, y_back)
    sled_board(c, sx, sx + SLED_L, SG)
    rg = SG + 18; rx = sx - 95
    rp = walker_pose(RK, rx, rg, d, -1, stride=72, moving=0 < u < 2.7, lean=12)
    rp.hand_tn = RK.wpt(rp, (rx + 66, rg - 300)); rp.hand_n = 'grip'
    rp.uarm_f, rp.elbow_f = 6, 26
    nose = (sx + 18, SG - 30); hw = RK.hand_world(rp, 'n')
    rope = skia.Path(); rope.moveTo(*nose); rope.quadTo((nose[0] + hw[0]) / 2, max(nose[1], hw[1]) + 22, *hw)
    c.drawPath(rope, SP((246, 214, 70), 4.5))
    RK.draw(c, rp, light=LIGHT, rim=RIMC, world=True)
    breath(c, t, *RK.mouth_world(rp), 2.5, 0.0, dirx=-1)
    breath(c, t, *OK_.mouth_world(op), 2.8, 0.5, dirx=-1)
    # the warm light from the open doors falls across him as they stop
    c.drawOval(skia.Rect(sx - 40, y_back - 160, sx + 360, y_back + 40), P((255, 196, 120), 110 * ease_io(u / 2.5), MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    near_ice(c, t, 1640, seed=7)
    c.restore()
    snow(c, t, 70)
    K.blur_layer(c, 3); snow(c, t + 3, 12, near=True); c.restore()


def scene(c, t):
    if t < T_U0: shot_A(c, t)
    elif t < T_U1: shot_U(c, t)
    elif t < T_CUT: shot_A(c, t)
    elif t < T_SHORE: shot_B(c, t)
    else: shot_C(c, t)


Wt, Y, R, TL = K.Wt, K.Y, K.R, K.TL
TITLES = [
    (-0.3, [[('HYPOTHERMIA ', Y), ('RESCUE', Y)], [('ONE ROUGH LIFT', Wt)]]),
    (T_HE - 0.05, [[('THROUGH THE ', Wt), ('ICE', TL)], [('WAY TOO LONG', Wt)]]),
    (T_A - 0.05, [[('A COLD HEART', Wt)], [('GETS ', Wt), ('TWITCHY', Y)]]),
    (T_ONE - 0.05, [[('ONE HARD ', Wt), ('JOLT', R)]]),
    (T_THATS - 0.05, [[('IT STOPS ', Wt), ('PUMPING', R)], [('IT JUST ', Wt), ('QUIVERS', R)]]),
    (T_AND - 0.05, [[('A FAST, ', Wt), ('ROUGH ', R), ('PULL', Wt)], [('COULD BE THAT JOLT', Wt)]]),
    (T_CUT, [[('KEEP HIM ', Wt), ('FLAT', TL)], [('SLIDE HIM ', Wt), ('SLOWLY', TL)]]),
    (T_THEY - 0.05, [[('LIKE HE\'S MADE', Wt)], [('OF ', Wt), ('GLASS', TL)]]),
    (T_AND5 - 0.05, [[('HANDLED ', Wt), ('GENTLY', TL)]]),
    (T_SLOW - 0.05, [[('SLOW BUT ', Wt), ('STEADY', TL)], [('ALL THE WAY TO SHORE', Wt)]]),
]

SHORT = K.Short(WD, 'NREMT', TITLES, scene, DUR, T_END + 0.2, series='EMT TRAPS #2', cuts=(T_U0, T_U1, T_CUT, T_SHORE), fix={'WAY': 'way', 'ONE': 'one'})

if __name__ == '__main__':
    out, stills = K.args()
    import os
    os.makedirs(OUT, exist_ok=True)
    if stills:
        os.makedirs(f'{OUT}/stills', exist_ok=True)
    K.render(SHORT, out, stills, outdir=f'{OUT}/stills')
