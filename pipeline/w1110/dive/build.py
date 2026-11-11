"""w1110-01-dive-reflex (A&P): a freediver a hundred feet down on one breath; the mammalian dive reflex. 1080x1920, 30 fps, all code drawn.
Logline: a woman sinks into the deep on a single breath, and her own body quietly rearranges itself to keep her alive.
Idea (one): the dive reflex is an automatic (autonomic) reflex: cold water on the face -> face nerves (trigeminal) -> brainstem -> vagus nerve slows
the heart, and vessels in the limbs tighten so the oxygen left goes to the heart and brain. Seals and whales have it too.
Sources checked 2026-11-10: Wikipedia "Diving reflex" (trigeminal in, vagus out, bradycardia, peripheral vasoconstriction, all mammals), GVSU
physiology lab note (89 to 39 bpm in 10 s in one subject), Breatheology (10 to 30 percent in most people, 50 percent or more in trained divers).
The on screen 72 -> 36 beats a minute is an illustration of "about half" for a trained diver.

Colour script: deep blue with pale shafts (the deep) / bright turquoise under the surface (the flashback plunge) / dimmed blue with warm yellow
nerve light and red heart (inside her) / the same deep blue (face, seal) / brightening toward white turquoise (the swim up). Light always from above.
Shots (word timed):
 1  0.00- 6.36 wide, slow push: she sinks head first beside the dive line, arms at her sides, ponytail and snow streaming up. Her pulse glows in her chest.
 2  6.36- 9.62 low angle under the surface, flashback: she pikes down through the bright surface; bubbles; cold shimmer on her face.
 3  9.62-15.24 close profile, look inside: face nerves light from the skin, run to the brainstem; the brainstem lights; a signal runs down to the heart.
 4 15.24-19.24 same shot, camera settles on the chest: the heartbeat spaces out, the counter falls from 72 to 36.
 5 19.24-25.50 full figure head down, look inside: arteries of the arm and leg thin and dim; the loop heart <-> brain stays bright.
 6 25.50-28.66 close on her face, front: eyes closed, calm. "Did she choose any of this? No."
 7 28.66-33.20 wide at the bottom plate, her hand on the line: a seal glides past, a whale hangs in the haze.
 8 33.20-35.95 close on her face: her eyes open and look up; the light on her face grows.
 9 35.95-39.30 low angle: she kicks up the line toward the light, the water brightens, her pulse quickens. Loops back to the deep.
Peak moment: shot 9, light + kick + score lift together. Sound: restrained mix (see mix.py)."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/mh', '/home/claude/dv']
import numpy as np, skia
import kit, hands as H
from kit import Words, Short, Wt, Y, R, TL
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
import diver as DV, world as WO
import layout as L
from diver import Diver, Pose

WD = Words('/home/claude/dv/out/words.json')
DUR, T_END = 39.3, 37.75
T2, T3, T4, T5, T6, T7, T8, T9 = 6.36, 9.62, 15.24, 19.24, 25.5, 28.66, 33.2, 35.95
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
BL = (130, 214, 255)


# ------------------------------------------------------------------ her heartbeat through the whole film
def _beats():
    def period(t):
        if t < T2: return 1.5                                     # a hundred feet down: already slow, about 40 a minute
        if t < T3: return 0.80                                    # flashback at the surface: resting pace, about 72 a minute (drawn 75)
        if t < 14.2: return 0.833                                 # 72 a minute
        if t < 17.6: return lerp(0.833, 1.667, smooth((t - 14.2) / 3.4))   # told to slow: 72 -> 36
        if t < T9: return 1.667                                   # 36 a minute
        return lerp(1.5, 0.9, smooth((t - T9) / 3.0))             # working again on the way up
    out = []; t = 0.12
    while t < DUR + 2:
        out.append(t); t += period(t)
    return out


BEATS = _beats()


def beat(t):
    v = 0.0
    for b in BEATS:
        if b > t + 0.3: break
        if t - b < 0.8: v = max(v, math.exp(-((t - b) / 0.075) ** 2), 0.55 * math.exp(-((t - b - 0.24) / 0.085) ** 2))
    return v


def bpm(t):
    if t < 14.2: return 72
    return int(round(lerp(72, 36, smooth((t - 14.2) / 3.4))))


def label(c, txt, x, y, size, col, a=255, bold=True):
    f = skia.Font(L.BLACK if bold else L.XBOLD, size); w = f.measureText(txt); c.drawString(txt, x - w / 2, y, f, P(col, a))


def chip(c, txt, x, y, col, a, ink=(255, 255, 255), size=44):
    if a <= 0.01: return
    f = skia.Font(L.BLACK, size); w = f.measureText(txt)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 28, y - size - 4, x + w / 2 + 28, y + size * 0.52), 34, 34), P(col, 255 * a)); c.drawString(txt, x - w / 2, y + 4, f, P(ink, 255 * a))


def chest_pulse(c, D, t, k=1.0):
    """her pulse seen as a soft light in her chest in the wide shots"""
    b = beat(t); hc = D.T(WO.heart_at(D)); r = (70 + 50 * b) * D.s * 1.4 * k
    c.drawCircle(hc[0], hc[1], r, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeRadial(hc, r, [C((255, 110, 110), int(60 + 170 * b)), C((255, 90, 100), 0)]), BlendMode=skia.BlendMode.kScreen))


# ------------------------------------------------------------------ shot 1: the deep
def s1(c, t):
    u = t / T2; sc = 190 * t
    e = smooth(u); z = lerp(1.9, 1.12, e)                      # open close on her face and chest, then ease back to show how alone she is down here
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-lerp(615, 560, e), -lerp(1185, 1010, e))
    WO.water(c, t, depth=lerp(0.72, 0.95, u), sunx=640, scroll=sc)
    WO.fish(c, t, 250 - 6 * t, 1420 - sc * 0.22, s=0.7, a=0.5, col=(14, 64, 124))
    WO.snow(c, t, sc, zmax=1.1)
    WO.rope(c, t, 372, scroll=sc)
    sway = math.sin(t * 0.8) * 1.6; und = math.sin(t * 1.5)
    D = Diver(600, 990 + 6 * math.sin(t * 0.7), 0.7, rot=183 + sway, face=1)
    ps = Pose(arm=(2 + sway * 0.5, -3), elbow=(5, 4), hip=(2 + 1.6 * und, -2 - 1.6 * und), knee=(3 + 2.5 * max(0, und), 3 + 2.5 * max(0, -und)),
              fin=(8 + 7 * math.sin(t * 1.5 - 0.8), -6 - 7 * math.sin(t * 1.5 - 0.8)), bend=1.6 * math.sin(t * 0.75), flow=(0.04 * math.sin(t), -1.0), head=6, t=t, lid=0.2)
    D.draw(c, ps, tint=(12, 56, 112), hand=dict(curls=(0.5, 0.56, 0.62, 0.68, 0.72), spread=0.04))
    chest_pulse(c, D, t, k=0.75)
    WO.snow(c, t, sc, zmin=1.1)
    c.restore()
    # her depth, counting to a hundred feet as it is said
    a_ = smooth((t - 0.15) / 0.3) * (1 - smooth((t - T2 + 0.35) / 0.25))
    if a_ > 0:
        x0, y0 = 880, 1150; ft = int(round(lerp(86, 100, smooth(t / 4.3))))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 150, y0 - 110, x0 + 150, y0 + 96), 30, 30), P((6, 14, 44), 205 * a_))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 150, y0 - 110, x0 + 150, y0 + 96), 30, 30), SP(BL, 4, 200 * a_))
        label(c, 'DEPTH', x0, y0 - 62, 34, BL, 255 * a_)
        f = skia.Font(L.BLACK, 96); txt = str(ft); w = f.measureText(txt); f2 = skia.Font(L.BLACK, 44); w2 = f2.measureText(' FT')
        c.drawString(txt, x0 - (w + w2) / 2, y0 + 50, f, P(mix((255, 255, 255), Y, smooth((t - 4.0) / 0.4)), 255 * a_)); c.drawString(' FT', x0 - (w + w2) / 2 + w, y0 + 50, f2, P((214, 226, 246), 255 * a_))


# ------------------------------------------------------------------ shot 2: the plunge (flashback)
def s2(c, t):
    SURF = 560; u = (t - T2) / (T3 - T2)
    c.save(); z = 1.0 + 0.06 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    WO.water(c, t, depth=0.05, sunx=520, rays=1.2, sun_y=SURF - 200)
    WO.surface(c, t, SURF)
    # the float and the line she will follow down
    c.drawOval(skia.Rect(700, SURF - 26, 900, SURF + 40), P((255, 118, 92))); c.drawOval(skia.Rect(700, SURF + 6, 900, SURF + 40), P((196, 72, 78)))
    WO.rope(c, t, 800, y0=SURF + 30)
    TE = 7.22                                                   # her face meets the water on "the moment"
    hy = 60 + 330 * (t - TE) if t < TE else 60 + 330 * (t - TE) * (1 - 0.11 * (t - TE))
    rot = 180 + lerp(-16, 4, smooth((t - TE + 0.5) / 1.6))
    D = Diver(430, hy, 1.0, rot=rot, face=1)
    ps = Pose(arm=(172, 167), elbow=(5, 8), hip=(4, -3), knee=(4, 3), fin=(6, -6), flow=(0.05, -1.0), head=lerp(-6, 4, smooth((t - TE) / 1.2)), t=t, lid=0.15)
    c.save(); c.clipRect(skia.Rect(0, SURF - 6 + 10 * math.sin(t * 2), 1080, 1920))
    D.draw(c, ps, tint=(40, 120, 170), hand=dict(curls=(0.1, 0.03, 0.03, 0.04, 0.06), spread=0.08))
    c.restore()
    # her dark shape still above the water, broken up by the surface
    c.save(); c.clipRect(skia.Rect(0, 0, 1080, SURF - 4)); hd = D.T(D.J['chest'])
    c.drawOval(skia.Rect(hd[0] - 170, min(hd[1], SURF) - 420, hd[0] + 170, SURF + 30), P((30, 70, 110), 120, MaskFilter=blur(34))); c.restore()
    if t >= TE - 0.05:
        hp = D.T(D.J['hd'])
        WO.bubbles(c, t, (430, SURF + 10), TE - 0.6, n=60, dur=2.2, spread=130, rise=120, seed=3, size=1.0)
        k = math.exp(-((t - TE - 0.25) / 0.5) ** 2)             # the cold on her face
        fx, fy = D.Hh(46, 4)
        c.drawCircle(fx, fy, 120 + 120 * (t - TE), SP((200, 250, 255), 10, 220 * k, MaskFilter=blur(5)))
        c.drawCircle(fx, fy, 84, P((170, 240, 255), 150 * k, MaskFilter=blur(26)))
        ring = math.exp(-((t - TE) / 0.9) ** 2)
        c.drawOval(skia.Rect(430 - 260 * (1.2 - ring), SURF - 18, 430 + 260 * (1.2 - ring), SURF + 18), SP((255, 255, 255), 6, 200 * ring))
    WO.snow(c, t, 0, a=0.6)
    c.restore()


# ------------------------------------------------------------------ shots 3 and 4: inside her head and chest
def s34(c, t):
    S = 2.25
    a_ = smooth((t - 13.0) / 1.6)                               # the camera follows the signal down from her head to her chest
    b_ = smooth((t - T4) / 2.0)
    z = lerp(1.0, 1.1, b_) * (1.0 + 0.04 * smooth((t - T3) / 3.4))
    c.save(); c.translate(540, 640); c.scale(z, z); c.translate(-540, -640)
    sc = 150 * t
    WO.water(c, t, depth=0.86, sunx=500, rays=0.7, scroll=sc)
    WO.snow(c, t, -sc * 0.5, zmax=1.0, a=0.7)
    c.drawCircle(600, 900, 760, skia.Paint(Shader=skia.GradientShader.MakeRadial((600, 900), 760, [C((70, 150, 210), 120), C((70, 150, 210), 0)])))
    D = Diver(440, 1650, S, rot=-3 + math.sin(t * 0.7), face=1)
    ps = Pose(arm=(8, -4), elbow=(8, 5), flow=(-0.35, 1.0), head=3, t=t, lid=lerp(0.2, 0.92, smooth((t - 12.0) / 1.5)))
    D.draw(c, ps, tint=(12, 56, 112), hand=dict(curls=(0.16, 0.14, 0.2, 0.26, 0.32), spread=0.7))
    c.drawRect(skia.Rect(-200, -400, 1400, 2400), P((6, 14, 44), 48))         # a light dim so the inside reads and her skin keeps its colour
    # --- brain and brainstem
    stem_hot = max(smooth((t - 11.3) / 0.35) * (1 - 0.55 * smooth((t - 12.3) / 0.4)), smooth((t - 12.55) / 0.3) * (1 - 0.5 * smooth((t - 14.4) / 0.6)))
    WO.brain(c, D, a=smooth((t - T3) / 0.35), stem_hot=stem_hot)
    # --- face nerves: lit from the skin inward
    br, root, twigs = WO.face_nerves(D)
    g = smooth((t - 9.68) / 0.5)                                 # "Nerves in her skin"
    for tw in twigs: WO.glowline(c, tw, WO.NERVE, 3.4 * S ** 0.5, 255 * g)
    for i, p_ in enumerate(br):
        WO.glowline(c, p_, mix(WO.NERVE, (120, 110, 90), 0.45), 4.2 * S ** 0.5, 150 * g, glow=False)
        go = (t - (10.3 + i * 0.12)) / 0.95                      # "signaled her brainstem": the light runs in
        if go > 0:
            WO.glowline(c, WO.part(p_, 0, min(1, go)), WO.NERVE_HI, 5.2 * S ** 0.5, 255)
            for rep in range(3):
                uu = ((t - 10.3 - i * 0.12) / 0.95 - rep * 0.5)
                if 0 < uu < 1 and t < 12.6: WO.pulse_dot(c, p_, uu, WO.NERVE, 7 * S ** 0.5)
    if t > 11.15:
        WO.glowline(c, root, WO.NERVE_HI, 6 * S ** 0.5, 255 * smooth((t - 11.15) / 0.25))
    for k_, (px, py) in enumerate(((50, -56), (58, 20), (52, 60))):   # the cold at the skin
        sx, sy = D.Hh(px + 8, py); tw_ = 0.5 + 0.5 * math.sin(t * 6 + k_ * 2)
        c.drawCircle(sx, sy, (16 + 10 * tw_), P((170, 240, 255), 190 * g * (1 - 0.6 * smooth((t - 12.4) / 0.6)), MaskFilter=blur(8)))
    # --- the nerve down to the heart, and the heart
    vg = WO.vagus(D)
    WO.glowline(c, vg, mix(WO.NERVE, (120, 110, 90), 0.45), 4.4 * S ** 0.5, 150 * smooth((t - T3) / 0.4), glow=False)
    go = (t - 13.0) / 0.8                                        # "told her heart"
    if go > 0:
        WO.glowline(c, WO.part(vg, 0, min(1, go)), WO.NERVE_HI, 5.4 * S ** 0.5, 255)
        for rep in range(8):
            uu = (t - 13.0 - rep * 0.62) / 0.8
            if 0 < uu < 1: WO.pulse_dot(c, vg, uu, WO.NERVE, 8 * S ** 0.5)
    WO.heart(c, D, beat=beat(t), a=smooth((t - T3) / 0.35), glow=0.25 + 0.75 * beat(t), k=0.64)
    c.restore()
    # --- the counter beside her chest (shot 4)
    ca = smooth((t - 13.45) / 0.3)
    if ca > 0:
        x0, y0 = 810, 1090
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 190, y0 - 150, x0 + 190, y0 + 150), 34, 34), P((6, 14, 44), 215 * ca))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 190, y0 - 150, x0 + 190, y0 + 150), 34, 34), SP((255, 110, 120), 4, 200 * ca))
        label(c, 'HEART RATE', x0, y0 - 92, 36, (255, 170, 176), 255 * ca)
        f = skia.Font(L.BLACK, 150); txt = str(bpm(t)); w = f.measureText(txt)
        col = mix((255, 255, 255), Y, smooth((t - 17.3) / 0.4))
        c.drawString(txt, x0 - w / 2, y0 + 56, f, P(col, 255 * ca)); label(c, 'beats a minute', x0, y0 + 112, 30, (214, 226, 246), 255 * ca, bold=False)
        # a moving trace of her beats
        pa = skia.Path(); n = 70
        for i in range(n + 1):
            uu = i / n; tt = t - (1 - uu) * 3.2
            (pa.lineTo if i else pa.moveTo)(x0 - 170 + uu * 340, y0 + 215 - 54 * beat(tt))
        c.drawPath(pa, SP((255, 110, 120), 5, 255 * ca)); c.drawPath(pa, SP((255, 110, 120), 14, 80 * ca, MaskFilter=blur(6)))


# ------------------------------------------------------------------ shot 5: where the blood goes
def leader(c, a, b, al):
    c.drawLine(a[0], a[1], b[0], b[1], SP((236, 244, 255), 3.5, 210 * al)); c.drawCircle(b[0], b[1], 8, P((236, 244, 255), 255 * al))


def s5(c, t):
    u = (t - T5) / (T6 - T5); sc = 170 * t
    c.save(); z = 1.0 + 0.06 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    WO.water(c, t, depth=0.92, sunx=600, rays=0.7, scroll=sc)
    WO.snow(c, t, sc * 0.8, zmax=1.1, a=0.7, drift=-sc * 0.45)
    sway = math.sin(t * 0.8) * 1.4
    c.drawCircle(480, 900, 800, skia.Paint(Shader=skia.GradientShader.MakeRadial((480, 900), 800, [C((70, 150, 210), 120), C((70, 150, 210), 0)])))
    D = Diver(425, 930, 1.06, rot=140 + sway, face=1)          # the camera has rolled: she still falls head first, drawn on the diagonal so her whole body fits
    ps = Pose(arm=(26, -16), elbow=(12, 10), hip=(10, -10), knee=(5, 4), fin=(8, -6), flow=(-0.64, -0.77), head=6, t=t, lid=0.9)
    D.draw(c, ps, tint=(12, 56, 112), hand=dict(curls=(0.16, 0.14, 0.2, 0.26, 0.32), spread=0.6))
    c.drawRect(skia.Rect(-200, -400, 1400, 2400), P((6, 14, 44), 48))
    car, arm, trunk, leg = WO.vessels(D)
    tg = smooth((t - 21.32) / 0.9)                               # "tighten"
    ah = math.exp(-((t - 20.56) / 0.28) ** 2); lh = math.exp(-((t - 21.1) / 0.28) ** 2)      # "arms", "legs": each named part flashes
    core = smooth((t - 23.6) / 0.9)                              # "goes to her heart and her brain"
    b = beat(t)
    for pth, hot in ((arm, ah), (trunk, 0.0), (leg, lh)):
        isl = pth is not trunk
        w = lerp(15, 4.5 if isl else 11, tg) * (1 + 0.4 * hot)
        col = mix(WO.BLOOD, (92, 104, 156) if isl else WO.BLOOD_DIM, tg * (0.92 if isl else 0.3))
        WO.flow(c, pth, t, w, col, a=lerp(255, 170 if isl else 225, tg), speed=lerp(150, 30 if isl else 110, tg), bright=lerp(1.0, 0.08 if isl else 0.8, tg))
        if hot > 0.02: c.drawPath(pth, SP((255, 230, 200), w * 2.4, 140 * hot, MaskFilter=blur(8)))
    WO.brain(c, D, a=1.0, warm=core * (0.6 + 0.4 * b))
    WO.flow(c, car, t, lerp(12, 17, max(tg * 0.6, core)), mix(WO.BLOOD, (255, 120, 110), core), speed=170, bright=1.0)
    WO.heart(c, D, beat=b, glow=0.3 + 0.7 * max(b, core * 0.7), k=0.8)
    kn = D.T(DV._lerp2(D.J['hip'], D.J['knee_n'], 0.75)); el = D.T(D.J['elb_n']); nk = D.T(D.J['neck'])
    c.restore()
    Z = lambda p: (540 + (p[0] - 540) * z, 900 + (p[1] - 900) * z)
    a1 = smooth((t - 21.5) / 0.35) * (1 - smooth((t - 25.2) / 0.3))
    if a1 > 0:
        leader(c, (810, 700), Z(kn), a1); leader(c, (810, 700), Z(el), a1)
        chip(c, 'LESS BLOOD', 810, 700, (60, 70, 130), a1, size=40)
    a2 = smooth((t - 23.9) / 0.35) * (1 - smooth((t - 25.2) / 0.3))
    if a2 > 0:
        leader(c, (300, 1290), Z(nk), a2)
        chip(c, 'KEPT OPEN', 300, 1290, (214, 60, 84), a2, size=40)


# ------------------------------------------------------------------ shots 6 and 8: her face
def head_close(c, t, lid, head, look, bright, depth, flowy, S=3.0, target=(500, 930)):
    """close on her head in profile (the same drawing as every other shot of her): her eye, lashes and brow show through the clear skirt of her mask"""
    WO.water(c, t, depth=depth, sunx=620, rays=0.8 + 0.5 * bright, scroll=0)
    WO.snow(c, t, -70 * t * flowy, zmax=1.0, a=0.8)
    ps = Pose(arm=(8, -4), elbow=(8, 5), flow=(-0.3, flowy), head=head, t=t, lid=lid, look=look)
    D = DV.place(ps, S, -2 + math.sin(t * 0.7), 1, 'hd', target)
    D.draw(c, ps, tint=(12, 56, 112), hand=H.REST)
    hx, hy = D.Hh(20, -10)
    for k_ in range(5):                                          # light from the surface moving over her
        yy = hy - 420 + ((k_ * 210 + t * 60) % 1050)
        c.drawOval(skia.Rect(hx - 420, yy - 16, hx + 420, yy + 16), skia.Paint(AntiAlias=True, Color=C((190, 246, 255), int(14 + 34 * bright)), BlendMode=skia.BlendMode.kScreen, MaskFilter=blur(22)))
    if bright > 0:
        c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=skia.GradientShader.MakeRadial((hx + 200, hy - 700), 1300, [C((210, 252, 255), int(150 * bright)), C((210, 252, 255), 0)]), BlendMode=skia.BlendMode.kScreen))
    WO.snow(c, t, -70 * t * flowy, zmin=1.0, a=0.8)
    return D


def s6(c, t):
    u = (t - T6) / (T7 - T6)
    c.save(); z = 1.0 + 0.07 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    head_close(c, t, lid=1.0, head=4 + 1.5 * math.sin(t * 0.8), look=(0, 0), bright=0.0, depth=0.93, flowy=1.0)
    c.restore()


T8B = 34.55


def s8(c, t):
    if t < T8B:
        u = (t - T8) / (T8B - T8)
        c.save(); z = 1.02 + 0.06 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
        op_ = smooth((t - 33.45) / 0.35)                         # her eye opens
        up = smooth((t - 33.85) / 0.6)                           # then she lifts her chin and finds the light
        head_close(c, t, lid=1 - op_, head=lerp(4, -17, up), look=(0.4 * up, -1.0 * up), bright=0.15 + 0.85 * up, depth=lerp(0.93, 0.78, up), flowy=0.3)
        c.restore(); return
    # the turn: one hand stays closed on the line while she tucks and swings her body round it, head down to head up
    u = smooth((t - 34.62) / 1.2); tuck = math.sin(math.pi * u)
    c.save(); z = 1.0 + 0.05 * (t - T8B); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    WO.water(c, t, depth=0.88, sunx=640, rays=1.0)
    WO.whale(c, t, 800 - 30 * (T8 - T7) - 20 * (t - T8), 1500, s=0.62, col=(24, 84, 146), a=200)
    WO.snow(c, t, 0, zmax=1.0, a=0.8)
    WO.rope(c, 0.0, 640, plate_y=1560, s=1.0)
    ps = Pose(arm=(lerp(34, 148, u), lerp(4, 126, u)), elbow=(22 + 34 * tuck, 10 + 30 * tuck), hip=(6 + 62 * tuck, -4 + 50 * tuck), knee=(8 + 78 * tuck, 4 + 66 * tuck),
              fin=(6 + 22 * tuck, -8 + 22 * tuck), bend=16 * tuck, flow=(-0.7 * tuck, lerp(-1.0, 1.0, u)), head=8 - 12 * u, t=t, lid=0.1, look=(0.3, -0.8))
    D = DV.place(ps, 0.72, lerp(172, 8, u), -1, 'wri_n', (640 - 8, 900))
    D.draw(c, ps, tint=(12, 56, 112), hand=H.GRIP)
    chest_pulse(c, D, t, k=1.1)
    WO.snow(c, t, 0, zmin=1.0, a=0.8)
    c.restore()


# ------------------------------------------------------------------ shot 7: she is not the only one
def s7(c, t):
    u = (t - T7) / (T8 - T7)
    c.save(); z = 1.0 + 0.06 * u; c.translate(540, 1000); c.scale(z, z); c.translate(-540, -1000)
    WO.water(c, t, depth=0.9, sunx=640, rays=0.9)
    WO.whale(c, t, 800 - 30 * (t - T7), 1010 + 10 * math.sin(t * 0.5), s=0.62, col=mix((24, 84, 150), (64, 140, 200), 0.4 + 0.6 * smooth((t - 31.5) / 0.5)), a=255 * smooth((t - T7 - 0.2) / 1.0))
    WO.fish(c, t, 860, 620, s=0.6, a=0.5, col=(14, 64, 124), dirx=-1)
    WO.snow(c, t, 0, zmax=1.0, a=0.8)
    # the seal comes through behind her on "seals"
    k = min(1.2, max(0.0, (t - 29.2) / 3.6)); e_ = k ** 0.8
    sx = lerp(1330, 700, e_); sy = lerp(1010, 560, e_ ** 1.4); far = smooth((k - 0.45) / 0.6)
    WO.seal(c, t, sx, sy, s=lerp(0.62, 0.3, far), ang=lerp(0.1, 0.62, e_), face=-1, tint=(16, 72, 136), tk=0.2 + 0.5 * far)
    # she hangs head down at the end of the line, one hand closed round the rope
    D = Diver(360, 800, 0.5, rot=180 - 8 + 1.2 * math.sin(t * 0.8), face=-1)
    lg = math.sin(t * 1.1)
    ps = Pose(arm=(34, 4 + 3 * lg), elbow=(22, 6), hip=(6 + 5 * lg, -4 - 5 * lg), knee=(8 + 4 * max(0, lg), 4 + 4 * max(0, -lg)), fin=(6 + 8 * math.sin(t * 1.1 - 0.8), -8 - 8 * math.sin(t * 1.1 - 0.8)), bend=2 * math.sin(t * 0.8), flow=(0.08 * lg, -1.0), head=8, t=t, lid=1.0)
    J = DV.skeleton(ps); wr = D.T(J['wri_n']); dv = D.TV(J['adir_n']); rx = wr[0] + dv[0] * 20 * 0.5
    WO.rope(c, t * 0.0 + 0.0, rx, plate_y=1240, s=0.8)
    D.draw(c, ps, tint=(12, 56, 112), hand=H.GRIP)
    chest_pulse(c, D, t, k=1.2)
    WO.snow(c, t, 0, zmin=1.0, a=0.8)
    c.restore()


# ------------------------------------------------------------------ shot 9: back up to the light
def s9(c, t):
    u = (t - T9) / (DUR - T9); k = t - T9
    rise = 340 * k + 60 * k * k * 0.2                            # how far she has climbed (px of water)
    c.save(); z = 1.0 + 0.05 * u; c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    dep = lerp(0.66, 0.3, smooth(u * 1.05))
    WO.water(c, t, depth=dep, sunx=560, rays=1.3)
    lr = lerp(190, 400, smooth(u * 1.1)); ly_ = lerp(470, 560, u)        # the bright window of the surface, growing as she climbs
    c.drawCircle(560, ly_, lr * 2.2, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeRadial((560, ly_), lr * 2.2, [C((230, 254, 255), 235), C((150, 236, 252), 150), C((90, 200, 240), 0)], [0, 0.35, 1.0]), BlendMode=skia.BlendMode.kScreen))
    for i in range(9):
        aa = math.radians(22 + i * 17 + 4 * math.sin(t * 0.7 + i)); ww = 0.05 + 0.02 * (i % 3)
        pth = skia.Path(); pth.addPoly([skia.Point(560, ly_), skia.Point(560 + 2400 * math.cos(aa - ww), ly_ + 2400 * math.sin(aa - ww)), skia.Point(560 + 2400 * math.cos(aa + ww), ly_ + 2400 * math.sin(aa + ww))], True)
        c.drawPath(pth, skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeRadial((560, ly_), 1500, [C((210, 250, 255), int(60 + 30 * u)), C((210, 250, 255), 0)]), BlendMode=skia.BlendMode.kScreen, MaskFilter=blur(14)))
    sy = lerp(-700, 150, smooth((u - 0.25) / 0.75))
    WO.snow(c, t, -rise * 1.5, zmax=1.1)
    WO.rope(c, t, 700, scroll=-rise * 1.5)
    WO.fish(c, t, 240, 700 + rise * 0.5, s=0.7, a=0.45, col=(30, 110, 170))
    w_ = 2 * math.pi * 1.35; ph = w_ * k                         # a steady flutter kick, about 1.3 kicks a second
    kk = math.sin(ph); k2 = math.sin(ph - 0.9); k3 = math.sin(ph - 1.7)
    y = lerp(1400, 930, smooth(u * 1.1)) + 8 * math.sin(ph * 2)
    D = Diver(500, y, 0.7, rot=7 + 2.2 * math.sin(ph), face=1)
    ps = Pose(arm=(174 + 2 * kk, 170 - 2 * kk), elbow=(5, 8), hip=(13 * kk, -13 * kk), knee=(max(0.0, 20 * k2) + 5, max(0.0, -20 * k2) + 5), fin=(34 * k3, -34 * k3), bend=-3 + 2.5 * math.sin(ph + 0.6), flow=(-0.12, 1.0), head=-6, t=t, lid=0.1)
    D.draw(c, ps, tint=(16, 66, 122), hand=dict(curls=(0.1, 0.03, 0.03, 0.04, 0.06), spread=0.08))
    chest_pulse(c, D, t)
    for i in (0, 1):                                             # little streams of bubbles shaken out of her suit and fins by the kick
        f = D.T(D.J['pock_n' if i == 0 else 'pock_f'])
        for j in range(5):
            uu = ((k * 1.2 + j * 0.2 + i * 0.1) % 1.0)
            WO.bubble(c, f[0] + 16 * math.sin(j * 2.1 + k * 3), f[1] + 60 + 260 * uu, 3 + 5 * (1 - uu), a=0.7 * (1 - uu))
    WO.snow(c, t, -rise * 1.5, zmin=1.1)
    fl_ = smooth((t - 37.9) / 1.3)
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=skia.GradientShader.MakeRadial((560, 300), 1700, [C((236, 254, 255), int(175 * fl_)), C((200, 246, 255), int(60 * fl_)), C((200, 246, 255), 0)], [0, 0.5, 1.0]), BlendMode=skia.BlendMode.kScreen))
    c.restore()


def scene(c, t):
    if t < T2: s1(c, t)
    elif t < T3: s2(c, t)
    elif t < T5: s34(c, t)
    elif t < T6: s5(c, t)
    elif t < T7: s6(c, t)
    elif t < T8: s7(c, t)
    elif t < T9: s8(c, t)
    else: s9(c, t)


TITLES = [
    (0.0, [[('DIVE REFLEX', Y)], [('100 FEET DOWN, ', Wt), ('ONE BREATH', BL)]]),
    (T2, [[('IT STARTS WITH', Wt)], [('COLD WATER ', BL), ('ON HER FACE', Wt)]]),
    (T3, [[('NERVES IN HER FACE', Y)], [('SIGNAL THE ', Wt), ('BRAINSTEM', Wt)]]),
    (12.24, [[('THE BRAINSTEM TELLS', Wt)], [('HER HEART: ', Wt), ('SLOW DOWN', R)]]),
    (T4, [[('HER HEART RATE', Wt)], [('FALLS TO ', Wt), ('ABOUT HALF', Y)]]),
    (T5, [[('ARMS AND LEGS:', Wt)], [('VESSELS ', Wt), ('TIGHTEN', BL)]]),
    (21.92, [[('THE OXYGEN GOES TO', Wt)], [('HEART ', R), ('AND ', Wt), ('BRAIN', R)]]),
    (T6, [[('DID SHE ', Wt), ('CHOOSE', Y)], [('ANY OF THIS?', Wt)]]),
    (27.92, [[('NO.', R)], [("IT'S AUTOMATIC", Wt)]]),
    (30.4, [[('SEALS AND WHALES', TL)], [('HAVE IT TOO', Wt)]]),
    (T8, [[('ENOUGH TIME', Wt)], [('TO ', Wt), ('TURN AROUND', Y)]]),
    (T9, [[('BACK UP', Wt)], [('TO THE ', Wt), ('LIGHT', Y)]]),
]

SHORT = Short(WD, 'A&P', TITLES, scene, DUR, T_END, lift=lambda t: 1.05, cuts=(T2, T3, T5, T6, T7, T8, T8B, T9))

# the top shade behind the titles eases off over the last shot, so the light at the surface is not capped by a dark band
_fades0 = L.fades
_NOW = [0.0]


def _fades(c):
    g = 1 - 0.75 * smooth((_NOW[0] - 36.6) / 1.2)
    if g >= 0.999: return _fades0(c)
    stops = [(0, .78 * g), (280, .5 * g), (420, .12 * g), (500, 0), (1320, 0), (1440, .32), (1600, .42), (1920, .55)]
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 1920)], [skia.Color(5, 8, 22, int(255 * a)) for _, a in stops], [p / 1920 for p, _ in stops])
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=sh))


L.fades = _fades
_frame0 = SHORT.frame


def _frame(t):
    _NOW[0] = t; return _frame0(t)


SHORT.frame = _frame

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/dv/out/stills')
