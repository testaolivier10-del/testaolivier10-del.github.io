"""w1109-03-lightning-triage (NREMT): lightning hits two hikers; reverse triage. 1080x1920, 30 fps, all code.
People are the 2026-11-09 people standard (pipeline/people/v4/guy13.py, here person.py): one model, recoloured per person.
Shots: wide ridge, the strike (0-2.3) / the two hikers, pan from the screaming one to the silent one (2.3-5.3) / the EMT's face, who first? (5.3-7.3) /
triage tags in normal order, not breathing waits (7.3-13.5) / lightning flips it: the black tag jumps to first (13.5-17.6) / looking down at the silent
hiker with his heart and lungs showing: both stop, the heart restarts, the breathing does not, air brings it back (17.6-30.4) / the screaming one is
breathing, he can wait (30.4-34.0) / the EMT's hands, mask and bag: he breathes for him, the hiker's eyes open (34.0-40.0).
Facts shown: lightning can stop the heart and the breathing together; the heart often restarts by itself while breathing may stay stopped; with more
than one lightning patient the ones who look dead are treated first (reverse triage). No burns or gore drawn."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/guy', '/home/claude/lt']
import numpy as np, skia
import person as PN, hands as H, kit
from guy import Pose
from kit import Words, Short, Wt, Y, R, TL
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed

WD = Words('/home/claude/lt/out/words.json')
DUR, T_END = 40.0, 38.6
T2, T3, T4, T5, T6, T7, T8, T9, T10 = 2.3, 5.3, 7.3, 13.5, 17.62, 21.7, 26.0, 30.4, 34.05
STRIKES = (0.1, 0.42, 5.5, 13.55, 17.75, 30.6, 34.3)
MONT = skia.Typeface.MakeFromFile('/tmp/m/pipeline/thumbpro/fonts/Montserrat.ttf')
_R = np.random.default_rng(7)
RAIN = [(_R.uniform(-200, 1280), _R.uniform(0, 1), _R.uniform(0.6, 1.4), _R.uniform(0.5, 1.0)) for _ in range(150)]
CLOUDS = [(_R.uniform(-200, 1280), _R.uniform(60, 760), _R.uniform(220, 460), _R.uniform(80, 170), _R.uniform(0.3, 1.0)) for _ in range(22)]
TUFTS = [(_R.uniform(0, 1080), _R.uniform(0, 1920), _R.uniform(0.6, 1.3), _R.uniform(0, 6.28)) for _ in range(90)]
PEB = [(_R.uniform(0, 1080), _R.uniform(0, 1920), _R.uniform(8, 30), _R.uniform(0.5, 1.0)) for _ in range(40)]

# Three different people, each designed for who they are (Olivier 2026-11-09: the guy model is the quality standard, not a template to recolour).
LOOKS = dict(
    # the EMT: sturdy, cropped dark hair and stubble, navy uniform shirt under a lime hi vis vest with reflective bands and a radio mic, dark cargo trousers, black boots
    emt=dict(TOP=(58, 84, 150), TOP_SH=(36, 52, 104), TOP_HI=(120, 150, 214), PANT=(48, 54, 80), PANT_SH=(30, 34, 56), PANT_HI=(92, 102, 140), SKIN=(206, 150, 112), SKIN_SH=(160, 104, 84), SKIN_HI=(240, 196, 160),
             HAIR=(36, 28, 30), HAIR_SH=(20, 14, 18), HAIR_HI=(96, 80, 84),
             cfg=dict(bw=1.07, top='uniform', vest=(206, 230, 60), bottom='cargo', hair='buzz', beard='stubble', fw=1.04, fl=0.98, shoe=((44, 44, 54), (24, 24, 34), (70, 72, 86)))),
    # the hiker who is screaming: young and lanky, ginger curls, pale, red rain shell with a hood, hiking shorts, wool socks, brown boots, a pack on his back
    red=dict(TOP=(218, 66, 62), TOP_SH=(150, 38, 58), TOP_HI=(255, 150, 126), PANT=(92, 98, 84), PANT_SH=(60, 66, 62), PANT_HI=(150, 156, 136), SKIN=(244, 204, 174), SKIN_SH=(206, 150, 132), SKIN_HI=(255, 236, 214),
             HAIR=(190, 96, 44), HAIR_SH=(132, 60, 34), HAIR_HI=(244, 160, 90),
             cfg=dict(bw=0.93, top='rain', bottom='shorts', hair='curly', fw=0.95, fl=1.05, head=1.02, straps=(60, 64, 84), sock=(214, 204, 190), shoe=((150, 104, 70), (104, 68, 50), (58, 48, 46)))),
    # the hiker who is silent: older and broad, full dark beard, mustard beanie, teal rain shell, grey trousers, tan boots, a pack on his back
    teal=dict(TOP=(46, 164, 170), TOP_SH=(28, 104, 126), TOP_HI=(146, 234, 226), PANT=(98, 96, 104), PANT_SH=(64, 62, 74), PANT_HI=(150, 148, 158), SKIN=(168, 112, 86), SKIN_SH=(124, 76, 64), SKIN_HI=(212, 160, 130),
              HAIR=(30, 24, 26), HAIR_SH=(14, 10, 14), HAIR_HI=(84, 74, 80),
              cfg=dict(bw=1.1, top='rain', bottom='chinos', hair='beanie', hat=(232, 172, 56), beard='full', fw=1.06, fl=0.97, straps=(200, 110, 50), shoe=((176, 136, 92), (124, 90, 64), (60, 50, 48)))))


def person(c, who, ps, x, ground, s, rot=0.0):
    for k, v in LOOKS[who].items():
        if k != 'cfg': setattr(PN, k, v)
    ps.cfg = LOOKS[who]['cfg']
    c.save(); c.translate(x, ground); c.rotate(rot); PN.draw(c, ps, x=0, ground=0, s=s); c.restore()


def FL(t):
    return min(1.0, sum(math.exp(-(t - s) / 0.16) * (0.75 + 0.25 * math.sin((t - s) * 70)) for s in STRIKES if t >= s))


def label(c, txt, x, y, size, col, a=255):
    f = skia.Font(MONT, size); f.setEmbolden(True); w = f.measureText(txt); c.drawString(txt, x - w / 2, y, f, P(col, a))


def sky(c, t, dark=0.0):
    f = FL(t)
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 1250)],
               [C((22, 18, 54)), C((64, 38, 96)), C((150, 70, 104)), C((240, 132, 86))], [0, 0.5, 0.82, 1.0])))
    c.drawOval(skia.Rect(140, 1020, 940, 1380), P((255, 170, 96), 120, MaskFilter=blur(70)))                    # the last light under the storm
    for (x, y, w, h, k) in CLOUDS:
        xx = (x + t * 9 * k + 300) % 1500 - 300
        col = mix(mix((34, 26, 62), (86, 50, 100), y / 760), (232, 222, 255), 0.55 * f)
        c.drawOval(skia.Rect(xx - w, y - h, xx + w, y + h), P(col, 215, MaskFilter=blur(26)))
        c.drawOval(skia.Rect(xx - w * 0.8, y + h * 0.2, xx + w * 0.8, y + h * 1.0), P(mix((20, 16, 44), (150, 130, 200), 0.5 * f), 150, MaskFilter=blur(30)))
    if f > 0.02: c.drawRect(skia.Rect(0, 0, 1080, 1920), P((214, 204, 255), 120 * f))
    if dark: c.drawRect(skia.Rect(0, 0, 1080, 1920), P((10, 8, 34), 255 * dark))


def bolt(c, t, t0, x0, x1, y1, seed=3):
    a = math.exp(-(t - t0) / 0.2) if t >= t0 else 0.0
    if a < 0.02: return
    r = np.random.default_rng(seed); pts = [(x0, -20)]; n = 14
    for i in range(1, n + 1):
        u = i / n; pts.append((lerp(x0, x1, u) + r.uniform(-50, 50) * (1 - u * 0.5), lerp(-20, y1, u)))
    pa = skia.Path(); pa.moveTo(*pts[0])
    for p_ in pts[1:]: pa.lineTo(*p_)
    for j in (4, 8):
        bx, by = pts[j]; pa.moveTo(bx, by)
        for k in range(1, 5): bx += r.uniform(30, 70) * (1 if j == 4 else -1); by += r.uniform(40, 80); pa.lineTo(bx, by)
    c.drawPath(pa, SP((170, 150, 255), 46, 150 * a, MaskFilter=blur(24))); c.drawPath(pa, SP((226, 216, 255), 16, 230 * a, MaskFilter=blur(6))); c.drawPath(pa, SP((255, 255, 255), 6, 255 * a))
    c.drawCircle(x1, y1, 120, P((255, 240, 255), 200 * a, MaskFilter=blur(50)))


def hills(c, t, base=1250):
    f = FL(t)
    for i, (yy, col) in enumerate(((base - 150, (74, 50, 96)), (base - 70, (50, 38, 78)))):
        pts = [(0, 1920), (0, yy + 40)] + [(x, yy + 60 * math.sin(x * 0.006 + i * 2) + 26 * math.sin(x * 0.017 + i)) for x in range(0, 1081, 90)] + [(1080, 1920)]
        pa = skia.Path(); pa.addPoly([skia.Point(*p_) for p_ in pts], True); c.drawPath(pa, P(mix(col, (150, 140, 200), 0.3 * f)))


def ground(c, t, y, col=(34, 44, 58)):
    f = FL(t)
    pts = [(0, 1920), (0, y + 16)] + [(x, y + 14 * math.sin(x * 0.011) + 8 * math.sin(x * 0.031 + 1)) for x in range(0, 1081, 60)] + [(1080, 1920)]
    pa = skia.Path(); pa.addPoly([skia.Point(*p_) for p_ in pts], True)
    c.drawPath(pa, P(mix(col, (120, 130, 170), 0.35 * f)))
    c.save(); c.clipPath(pa, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(0, y - 20, 1080, y + 60), P((255, 170, 110), 50, MaskFilter=blur(20)))                   # wet rim light along the crest
    for (x, yy, k, ph) in TUFTS[:40]:
        gy = y + 30 + (yy % 300)
        for d_ in (-10, 0, 10): c.drawLine(x, gy, x + d_ * k + 4 * math.sin(t * 2 + ph), gy - 26 * k, SP((60, 84, 80), 3.4, 200))
    c.restore()


def rain(c, t, a=1.0):
    for (x, ph, k, al) in RAIN:
        yy = ((ph + t * 1.5 * k) % 1.0) * 2100 - 90
        c.drawLine(x - 0.2 * yy * 0.2, yy, x - 0.2 * yy * 0.2 - 12 * k, yy + 60 * k, SP((190, 200, 240), 2.4 * k, 90 * al * a))


def topdown(c, t):
    """the wet ground seen from straight above"""
    f = FL(t)
    c.drawRect(skia.Rect(0, 0, 1080, 1920), P(mix((36, 50, 62), (120, 130, 170), 0.3 * f)))
    c.drawOval(skia.Rect(-200, 300, 1280, 1700), P((60, 84, 92), 120, MaskFilter=blur(120)))
    for (x, y, r_, al) in PEB: c.drawOval(skia.Rect(x - r_, y - r_ * 0.8, x + r_, y + r_ * 0.8), P((70, 80, 96), 150 * al)); c.drawOval(skia.Rect(x - r_ * 0.7, y - r_ * 0.7, x + r_ * 0.3, y - r_ * 0.1), P((110, 122, 140), 110 * al))
    for (x, y, k, ph) in TUFTS:
        for d_ in (-12, 0, 12): c.drawLine(x, y, x + d_ * k, y - 30 * k, SP((62, 96, 84), 4, 190))


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def screamer_pose(t):
    sh = math.sin(t * 9)
    return pose(r_up=14, r_fore=-104 + 3 * sh, r_wrist=10, l_up=20, l_fore=30, lean=-4 + 1.2 * sh, head_tilt=-7 + 2 * sh, scream=0.8 + 0.2 * math.sin(t * 5), worry=1.0, lid=0.3, smile=0.0, breath=0.5 + 0.5 * math.sin(t * 7),
                r_hand=dict(curls=(0.5, 0.6, 0.64, 0.7, 0.74), spread=0.1), head_yaw=0.15)


def silent_pose(t, lid=0.04, breath=0.0, smile=0.0):
    return pose(lid=lid, breath=breath, smile=smile, r_up=4, r_fore=3, l_up=5, l_fore=4, head_tilt=4, head_yaw=0.1, worry=0.0)


def seat_shadow(c, x, y, s):
    c.drawOval(skia.Rect(x - 230 * s, y - 40 * s, x + 230 * s, y + 46 * s), P((4, 6, 22), 170, MaskFilter=blur(16 * s)))


def lying_side(c, x, y, s, t):
    """the silent hiker flat on his back, seen from the side (for the wide shot): boots, legs, chest, pack, head with his beanie"""
    LK = LOOKS['teal']; boot = LK['cfg']['shoe'][0]
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect(-30, -22, 560, 34), P((4, 6, 22), 190, MaskFilter=blur(12)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(250, -52, 380, 6), 22, 22), P(LK['cfg']['straps']))                      # the pack under his shoulders
    for bx in (0, 14): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx, -74, bx + 34, 0), 10, 10), P(boot)); c.drawRect(skia.Rect(bx - 3, -74, bx + 8, 0), P((60, 50, 48)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(30, -46, 250, 0), 20, 20), P(LK['PANT'])); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(30, -18, 250, 0), 10, 10), P(LK['PANT_SH']))
    chest = smooth_closed([(232, 0), (236, -52), (290, -78), (360, -74), (412, -50), (416, 0)])
    c.drawPath(chest, P(LK['TOP'])); c.save(); c.clipPath(chest, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(220, -22, 420, 4), P(LK['TOP_SH'])); c.drawRect(skia.Rect(220, -84, 420, -70), P(LK['TOP_HI'], 160)); c.restore()
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(250, -34, 380, -8), 13, 13), P(mix(LK['TOP'], LK['TOP_SH'], 0.4)))       # his arm along his side
    c.drawOval(skia.Rect(232, -34, 262, -8), P(LK['SKIN']))
    c.drawCircle(446, -34, 33, P(LK['SKIN'])); c.drawOval(skia.Rect(420, -30, 462, 2), P(LK['HAIR']))                    # head, beard along the jaw
    hat = smooth_closed([(440, -70), (476, -62), (492, -30), (480, 0), (458, -6), (462, -34), (446, -52)]); c.drawPath(hat, P(LK['cfg']['hat']))
    c.restore()


def sit_view(c, t, zoom=1.0):
    sky(c, t); hills(c, t, 1000); ground(c, t, 1060)
    ps = screamer_pose(t); ps.sit = True
    seat_shadow(c, 540, 1420, 1.25 * zoom); person(c, 'red', ps, 540, 1420, 1.25 * zoom)


def wide(c, t):
    c.save(); z = 1.0 + 0.05 * t; c.translate(540, 1150); c.scale(z, z); c.translate(-540, -1150)
    sky(c, t); bolt(c, t, 0.1, 700, 610, 1235, seed=5); bolt(c, t, 0.42, 420, 300, 1180, seed=9); hills(c, t)
    ground(c, t, 1230)
    ps = screamer_pose(t); ps.sit = True
    seat_shadow(c, 230, 1400, 0.46); person(c, 'red', ps, 230, 1400, 0.46)
    lying_side(c, 400, 1420, 0.86, t)
    person(c, 'emt', pose(head_yaw=-0.35, worry=0.6, r_up=12, l_up=12, look=(-0.6, 0.2)), 930, 1720, 0.6)
    c.restore(); rain(c, t)


def pair(c, t):
    if t < 3.5:
        sit_view(c, t); rain(c, t); return
    topdown(c, t)
    z = 1.0 + 0.05 * smooth((t - 3.5) / 1.8)
    c.save(); c.translate(540, 760); c.scale(z, z); c.translate(-540, -760); silent_top(c, t); c.restore()
    f = FL(t); c.drawRect(skia.Rect(0, 0, 1080, 1920), P((230, 222, 255), 150 * f)); rain(c, t, 0.6)


def emt_close(c, t):
    sky(c, t, dark=0.25)
    yaw = lerp(-0.75, 0.75, smooth((t - 5.9) / 0.5)) if t < 6.7 else lerp(0.75, -0.2, smooth((t - 6.75) / 0.4))
    ps = pose(head_yaw=yaw, worry=0.9, brow=0.3, look=(yaw * 0.9, 0.5), r_up=10, l_up=10, lid=1.0 if abs(t - 6.3) > 0.07 else 0.1, breath=0.5 + 0.5 * math.sin(t * 5), head_tilt=yaw * 3)
    person(c, 'emt', ps, 540, 2580, 1.75)
    f = FL(t); c.drawRect(skia.Rect(0, 0, 1080, 1920), P((200, 190, 255), 60 * f)); rain(c, t)


TAGS = (('NOW', (226, 70, 70)), ('SOON', (240, 196, 60)), ('LATER', (70, 190, 110)), ('NOT BREATHING', (40, 42, 58)))


def tag(c, x, y, lab, col, num, hot=0.0, s=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    if hot: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-112, -182, 112, 182), 30, 30), P((255, 240, 160), 200 * hot, MaskFilter=blur(22)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-100, -164, 100, 174), 24, 24), P((0, 0, 0), 110, MaskFilter=blur(10)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-100, -170, 100, 170), 24, 24), P(col)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-100, -170, 100, 170), 24, 24), SP((255, 255, 255), 5, 230))
    c.drawCircle(0, -128, 14, P((16, 14, 40))); c.drawCircle(0, -128, 14, SP((255, 255, 255), 4))
    dark = sum(col) > 380; ink = (20, 18, 44) if dark else (255, 255, 255)
    c.drawCircle(0, -46, 30, P(ink)); c.drawPath(smooth_closed([(-52, 60), (-44, 6), (0, -8), (44, 6), (52, 60)]), P(ink))          # a little person
    if lab == 'NOT BREATHING': label(c, 'NOT', 0, 104, 32, ink); label(c, 'BREATHING', 0, 140, 28, ink)
    else: label(c, lab, 0, 128, 40, ink)
    c.drawCircle(0, 236, 44, P((255, 255, 255))); label(c, num, 0, 254, 50, (20, 18, 44))
    c.restore()


def triage(c, t):
    sky(c, t, dark=0.55)
    ps = pose(head_yaw=-0.1, worry=0.6, look=(0.0, -0.8), brow=0.5, breath=0.5 + 0.5 * math.sin(t * 4), head_tilt=-2)
    person(c, 'emt', ps, 540, 2400, 1.25)
    c.drawRect(skia.Rect(0, 0, 1080, 1920), P((10, 8, 34), 70))
    flip = smooth((t - 13.9) / 0.7); xs = (165, 415, 665, 915)
    for i, (lab, col) in enumerate(TAGS):
        a = smooth((t - (7.5 + i * 0.55)) / 0.35)
        if a <= 0: continue
        if i < 3: x = lerp(xs[i], xs[i + 1], flip); num = str(i + 1) if flip < 0.5 else str(i + 2); y = 640; hot = 0; s = 1.0
        else:
            x = lerp(xs[3], xs[0], flip); y = 640 - 150 * math.sin(math.pi * flip); num = ('4' if flip < 0.5 else '1')
            hot = max(smooth((t - 10.7) / 0.4) * (1 - smooth((t - 13.3) / 0.3)) * 0.7, flip); s = 1.0 + 0.1 * flip + 0.06 * math.sin(math.pi * flip)
        c.save(); c.translate(0, (1 - a) * -60); tag(c, x, y, lab, col, num, hot, s); c.restore()
    w = smooth((t - 11.2) / 0.3) * (1 - smooth((t - 13.4) / 0.2))
    if w > 0: chip(c, 'WAITS', xs[3] - 30, 1030, (240, 196, 60), w, ink=(20, 18, 44))
    f1 = smooth((t - 14.7) / 0.3)
    if f1 > 0: chip(c, 'FIRST', xs[0] + 20, 1030, (240, 196, 60), f1, ink=(20, 18, 44))
    f = FL(t); c.drawRect(skia.Rect(0, 0, 1080, 1920), P((214, 204, 255), 130 * f))


def heart_path(cx, cy, r):
    return smooth_closed([(cx, cy + r), (cx - r * 0.95, cy + r * 0.1), (cx - r * 0.9, cy - r * 0.6), (cx - r * 0.4, cy - r * 0.85), (cx, cy - r * 0.45), (cx + r * 0.4, cy - r * 0.85), (cx + r * 0.9, cy - r * 0.6), (cx + r * 0.95, cy + r * 0.1)])


def lung(cx, cy, sx, k):
    return smooth_closed([(cx + sx * 14, cy - 96), (cx + sx * 52 * k, cy - 84), (cx + sx * 84 * k, cy - 10), (cx + sx * 88 * k, cy + 70 * k), (cx + sx * 50 * k, cy + 96 * k), (cx + sx * 16, cy + 64), (cx + sx * 10, cy - 20)])


def trace(c, x, y, w, t, beats, col, a=255):
    """a monitor line: flat, or with a bump for every beat time"""
    pa = skia.Path(); n = 60
    for i in range(n + 1):
        u = i / n; tt = t - (1 - u) * 2.4; v = 0.0
        for b in beats: v += math.exp(-((tt - b) / 0.05) ** 2)
        (pa.lineTo if i else pa.moveTo)(x + u * w, y - 34 * v)
    c.drawPath(pa, SP(col, 5, a)); c.drawPath(pa, SP(col, 12, a * 0.3, MaskFilter=blur(6)))


def silent_top(c, t, lid=0.04, breath=0.0, smile=0.0):
    # seen from straight above: his shadow on the wet ground under him, so he is lying ON it
    for (x0, y0, x1, y1) in ((250, 620, 850, 1180), (330, 1100, 770, 2060), (420, 400, 680, 700)):
        c.drawOval(skia.Rect(x0 + 14, y0 + 22, x1 + 14, y1 + 22), P((4, 8, 20), 175, MaskFilter=blur(34)))
    for (x, y, k, ph) in TUFTS[::3]:                         # grass pressed flat around him
        if 200 < x < 880 and 380 < y < 1900 and not (330 < x < 750): c.drawLine(x, y, x + (26 if x > 540 else -26) * k, y - 8 * k, SP((84, 120, 100), 4, 200))
    person(c, 'teal', silent_pose(t, lid, breath, smile), 540, 2010, 1.5)


def body(c, t):
    topdown(c, t)
    hb = [21.95 + 0.62 * i for i in range(30)]                # heart beats again from 21.95
    puffs = [26.5, 27.9, 29.3]                                # breaths given
    infl = max([math.exp(-((t - p - 0.35) / 0.4) ** 2) for p in puffs] + [0.0])
    silent_top(c, t, breath=3.0 * infl)
    c.drawRect(skia.Rect(0, 0, 1080, 1920), P((10, 10, 36), 110))
    cx, cy = 540, 905
    stopped = t >= 17.75
    c.drawOval(skia.Rect(cx - 190, cy - 170, cx + 190, cy + 170), P((20, 30, 60), 150, MaskFilter=blur(24)))                       # the window into his chest
    alive_l = 1.0 if not stopped else smooth((t - 26.5) / 1.2)
    lk = 1.0 + 0.1 * infl + (0.05 * math.sin(t * 3) if not stopped else 0.0)
    for sx in (-1, 1):
        lp = lung(cx, cy, sx, lk); col = mix((120, 126, 150), (255, 150, 170), alive_l)
        c.drawPath(lp, P(col, 235)); c.drawPath(lp, SP(mix((170, 176, 200), (255, 214, 224), alive_l), 4))
    beat = max([math.exp(-((t - b) / 0.08) ** 2) for b in hb if b <= t + 0.2] + [0.0]) if t >= 21.9 else (0.5 + 0.5 * math.sin(t * 9) if not stopped else 0.0)
    alive_h = 1.0 if not stopped else smooth((t - 21.9) / 0.5)
    hp = heart_path(cx + 22, cy + 6, 46 * (1 + 0.16 * beat))
    c.drawPath(hp, P(mix((110, 110, 132), (236, 60, 76), alive_h))); c.drawPath(hp, SP((255, 255, 255), 4, 200))
    if alive_h > 0.3: c.drawPath(hp, P((255, 120, 130), 120 * beat, MaskFilter=blur(14)))
    for p in puffs:                                           # air going in
        u = (t - p) / 0.7
        if 0 < u < 1:
            for sx in (-1, 1): c.drawCircle(cx + sx * 40 * u, lerp(cy - 190, cy - 20, u), 16 * (1 - 0.4 * u), P((150, 220, 255), 230 * (1 - u), MaskFilter=blur(3)))
    # two monitor lines
    for i, (nm, col) in enumerate((('HEART', (255, 96, 110)), ('BREATHING', (130, 210, 255)))):
        y = 1230 + i * 110; c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(150, y - 62, 930, y + 34), 18, 18), P((10, 12, 40), 215))
        label(c, nm, 290, y + 4, 34, col)
        beats = hb if i == 0 else [p + 0.35 for p in puffs]
        if not stopped: beats = [17.2, 17.6] if i == 0 else [17.4]
        trace(c, 470, y - 6, 420, t, beats, col)
    f = FL(t); c.drawRect(skia.Rect(0, 0, 1080, 1920), P((230, 222, 255), 220 * f)); rain(c, t, 0.5)


def chip(c, txt, x, y, col, a, ink=(255, 255, 255)):
    f = skia.Font(MONT, 46); f.setEmbolden(True); w = f.measureText(txt)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 30, y - 50, x + w / 2 + 30, y + 26), 38, 38), P(col, 255 * a)); c.drawString(txt, x - w / 2, y + 6, f, P(ink, 255 * a))


def screamer(c, t):
    sit_view(c, t)
    for i in range(4):                                        # his breath shows in the cold rain
        u = ((t * 1.3 + i * 0.25) % 1.0)
        c.drawCircle(600 + 120 * u, 850 - 90 * u, 14 + 34 * u, P((230, 236, 255), 110 * (1 - u), MaskFilter=blur(8)))
    chip(c, 'BREATHING', 800, 520, (40, 170, 110), smooth((t - 31.7) / 0.3) * (1 - smooth((t - 32.6) / 0.25)))
    chip(c, 'CAN WAIT', 800, 520, (240, 196, 60), smooth((t - 32.8) / 0.3), ink=(20, 18, 44))
    rain(c, t)


def rescue(c, t):
    topdown(c, t)
    sq = [35.2, 36.75, 38.0]
    squeeze = max([math.exp(-((t - s) / 0.22) ** 2) for s in sq] + [0.0])
    infl = max([math.exp(-((t - s - 0.25) / 0.35) ** 2) for s in sq] + [0.0])
    wake = smooth((t - 38.55) / 0.5); own = 0.5 + 0.5 * math.sin((t - 38.6) * 3.2) if t > 38.6 else 0.0
    z = 1.0 + 0.04 * smooth((t - 34.0) / 5.0)
    c.save(); c.translate(540, 760); c.scale(z, z); c.translate(-540, -760)
    silent_top(c, t, lid=0.04 + 0.96 * wake, breath=3.2 * infl + 2.4 * own * wake, smile=0.3 * wake)
    arrive = smooth((t - 34.15) / 0.55); off = (1 - arrive) * 700; lift = wake * 190
    LK = LOOKS['emt']; mx, my = 546, 618 - off * 0.2
    sx_ = -off - lift                                         # the kit slides in from the left, and lifts away when he breathes on his own
    bag = skia.Path(); bag.addOval(skia.Rect(mx - 330 + sx_, my - 58 + 15 * squeeze, mx - 104 + sx_, my + 58 - 15 * squeeze))
    c.drawOval(skia.Rect(mx - 330 + sx_, my + 36, mx - 100 + sx_, my + 96), P((0, 0, 0), 70, MaskFilter=blur(14)))
    c.drawPath(bag, P((70, 150, 220))); c.drawPath(bag, SP((190, 230, 255), 5)); c.drawOval(skia.Rect(mx - 300 + sx_, my - 42 + 13 * squeeze, mx - 190 + sx_, my - 14 + 8 * squeeze), P((170, 220, 255), 150))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(mx - 112 + sx_, my - 18, mx - 44 + sx_, my + 18), 10, 10), P((210, 220, 236)))
    mk = lambda px, py: (mx + sx_ + px * 0.8, my + py * 0.8)
    mask = smooth_closed([mk(-4, -62), mk(44, -30), mk(56, 24), mk(30, 62), mk(-30, 62), mk(-56, 24), mk(-44, -30)])
    c.drawPath(mask, P((220, 236, 250), 150)); c.drawPath(mask, SP((255, 255, 255), 6, 235)); c.drawPath(mask, SP((120, 150, 190), 2, 200))
    hands_ = (((mx - 372 + sx_, my + 6), 0.0, 1, dict(curls=(0.4, 0.5 + 0.2 * squeeze, 0.54 + 0.2 * squeeze, 0.58 + 0.2 * squeeze, 0.6 + 0.2 * squeeze), spread=0.2)),
              ((mx + 150 + off + lift, my + 40), math.radians(186), 1, dict(curls=(0.34, 0.4, 0.44, 0.48, 0.54), spread=0.22)))
    for ((wx, wy), ang, side, pz) in hands_:
        ex, ey = wx - math.cos(ang) * 620, wy - math.sin(ang) * 620
        sl = PN.limb((ex, ey), (wx - math.cos(ang) * 30, wy - math.sin(ang) * 30), 124, 92)
        c.drawPath(sl, P(LK['TOP'])); c.drawPath(PN.diffp(sl, (-6, -9)), P(LK['TOP_SH']))
        cf = PN.limb((wx - math.cos(ang) * 60, wy - math.sin(ang) * 60), (wx - math.cos(ang) * 18, wy - math.sin(ang) * 18), 88, 84); c.drawPath(cf, P(LK['TOP_SH']))
        H.hand(c, (wx, wy), ang, side, 1.55, skin=LK['SKIN'], shade=LK['SKIN_SH'], hi=LK['SKIN_HI'], light=PN.LIGHT, **pz)
    if wake > 0:                                              # his own breath
        for i in range(3):
            u = ((t * 0.9 + i * 0.33) % 1.0); c.drawCircle(600 + 110 * u, 600 - 130 * u, 16 + 40 * u, P((236, 242, 255), 120 * (1 - u) * wake, MaskFilter=blur(9)))
    c.restore()
    warm = smooth((t - 37.6) / 2.0)                          # the storm passes: warm light comes across
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(1080, 1920)], [C((255, 200, 130), int(90 * warm)), C((255, 200, 130), 0)])))
    f = FL(t); c.drawRect(skia.Rect(0, 0, 1080, 1920), P((230, 222, 255), 150 * f)); rain(c, t, 0.6 * (1 - 0.8 * warm))


def scene(c, t):
    if t < T2: wide(c, t)
    elif t < T3: pair(c, t)
    elif t < T4: emt_close(c, t)
    elif t < T6: triage(c, t)
    elif t < T9: body(c, t)
    elif t < T10: screamer(c, t)
    else: rescue(c, t)


BL = (130, 210, 255)
TITLES = [
    (0.0, [[('LIGHTNING STRIKE', Wt)], [('WHO DO YOU ', Wt), ('TREAT FIRST?', Y)]]),
    (T2, [[('ONE IS ', Wt), ('SCREAMING', R)]]),
    (3.52, [[('ONE ', Wt), ("ISN'T BREATHING", BL)]]),
    (T3, [[('WHO DOES HE', Wt)], [('TREAT ', Wt), ('FIRST?', Y)]]),
    (T4, [[('NORMAL TRIAGE', Wt)], [('NOT BREATHING ', Wt), ('WAITS', Y)]]),
    (T5, [[('LIGHTNING', Wt)], [('FLIPS ', Y), ('THAT', Wt)]]),
    (15.28, [[('REVERSE', Y)], [('TRIAGE', Y)]]),
    (T6, [[('HEART AND BREATHING', Wt)], [('CAN ', Wt), ('STOP TOGETHER', R)]]),
    (T7, [[('THE HEART OFTEN', Wt)], [('RESTARTS ', TL), ('BY ITSELF', Wt)]]),
    (24.24, [[('THE BREATHING', Wt)], [('MAY NOT', R)]]),
    (T8, [[('BREATHE', BL)], [('FOR THEM', Wt)]]),
    (T9, [[('SCREAMING MEANS', Wt)], [('BREATHING', TL)]]),
    (T10, [[('THE SILENT ONE', Wt)], [('FIRST', Y)]]),
    (36.48, [[('HE BREATHES', BL)], [('FOR HIM', Wt)]]),
]

SHORT = Short(WD, 'NREMT', TITLES, scene, DUR, T_END, lift=lambda t: 1.04)

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/lt/out/stills')
