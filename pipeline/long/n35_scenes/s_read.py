"""Chapter 1, Read the bleed: arterial, venous and capillary bleeding on the forearm close up (liquid sims), the blood
volumes as containers, the four signs of a life threatening bleed back in the garage, quick check 1."""
import sys, math
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, ease, col
import closeup as CU, wide as WD
import geo

LIQ = '/home/claude/n35/liq/'
_l = {}


def liq(name, t0):
    if (name, t0) not in _l:
        _l[(name, t0)] = K.Liq(LIQ + name, t0)
    return _l[(name, t0)]


T_VEN = cue('r2', 1) - 0.25
T_CAP = cue('r2', 3) - 0.25


def bare_arm(c, t, cam, sim, t0, wound=True, scr=False):
    K.draw_plate(c, 'g_arm.png', cam)
    K.push_cam(c, cam)
    if wound:
        CU.wound(c)
    if scr:
        CU.scrape(c)
    liq(sim, t0).draw(c, t)
    c.restore()


def r1(c, t):
    cam = (geo.X(540), geo.Y(285), 1.08 + 0.05 * smooth((t - cue('r1')) / 18))
    bare_arm(c, t, cam, 'r1_art', cue('r1') - 0.6)
    wp = K.w2s(cam, CU.WOUND)
    t1, t2, t3 = cue('r1', 1), cue('r1', 2), cue('r1', 3)
    K.chip(c, 'ARTERY', 260, 790, K.CORAL, win(t, t1 - 0.2, T_VEN - 0.3), 44, t=t, t0=t1 - 0.2)
    a1 = win(t, t1, T_VEN - 0.3); a2 = win(t, t2, T_VEN - 0.3)
    K.text_card(c, [('bright red: full of oxygen', K.WHITE, a1), ('spurts with every heartbeat', K.WHITE, a2)], 150, 840)
    if a2 > 0.01:
        b = CU.beat(t - (cue('r1') - 0.6), 110)
        K.glow(c, (880, 942), 40 + 22 * b, K.CORAL, a2)
        heart(c, 880, 944, 0.9 + 0.25 * b, a2)
    K.chip(c, 'high pressure: kills fast', 1420, 980, K.CORAL, win(t, t3, T_VEN - 0.3), 44, t=t, t0=t3)


def heart(c, x, y, s, a):
    p = skia.Path()
    p.moveTo(x, y + 18 * s)
    p.cubicTo(x - 34 * s, y - 6 * s, x - 18 * s, y - 30 * s, x, y - 14 * s)
    p.cubicTo(x + 18 * s, y - 30 * s, x + 34 * s, y - 6 * s, x, y + 18 * s)
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(K.CORAL, 255 * a)))


def r2_ven(c, t):
    cam = (geo.X(540), geo.Y(285), 1.08)
    bare_arm(c, t, cam, 'r2_ven', T_VEN)
    t1, t2 = cue('r2', 1), cue('r2', 2)
    K.chip(c, 'VEIN', 260, 210, K.LILAC, win(t, t1, T_CAP - 0.3), 44, t=t, t0=t1)
    K.text_card(c, [('darker red, flows steadily', K.WHITE, win(t, t1 + 0.3, T_CAP - 0.3)),
                    ('not much pressure behind it', K.INK, win(t, t1 + 1.2, T_CAP - 0.3))], 150, 260)
    K.chip(c, 'a big vein can still bleed heavily', 1360, 980, K.LILAC, win(t, t2, T_CAP - 0.3), 40, t=t, t0=t2)


def r2_cap(c, t):
    cam = (geo.X(470), geo.Y(285), 1.25)
    bare_arm(c, t, cam, 'r2_cap', T_CAP, wound=False, scr=True)
    t3, t4 = cue('r2', 3), cue('r2', 4)
    K.chip(c, 'CAPILLARY', 300, 210, K.YELLOW, win(t, t3, end('r2') + 0.2), 44, t=t, t0=t3)
    a4 = win(t, t4, end('r2') + 0.2)
    K.text_card(c, [('slow, dark ooze from a scrape', K.WHITE, win(t, t3 + 0.3, end('r2') + 0.2)),
                    ('usually stops on its own', K.GREEN, a4)], 150, 840)


# ------------------------------------------------------------------ volumes as containers
def jug(c, x, base, w, h, level, a=1.0, t=0.0, label=None, sub=None, ring_a=0.0):
    """A clear flat jug with blood at level 0..1 (a gentle surface sway)."""
    if a <= 0.01:
        return
    r = skia.RRect.MakeRectXY(skia.Rect(x - w / 2, base - h, x + w / 2, base), 26, 26)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col((214, 232, 255), 60 * a)))
    if level > 0.003:
        top = base - h * level
        sw = (11 * math.sin(t * 1.7) + 4 * math.sin(t * 3.1 + x)) * min(1, w / 200)
        c.save(); c.clipRRect(r, True)
        p = skia.Path(); p.moveTo(x - w / 2 - 4, top + sw); p.quadTo(x, top - sw * 0.6, x + w / 2 + 4, top - sw)
        p.lineTo(x + w / 2 + 4, base + 4); p.lineTo(x - w / 2 - 4, base + 4); p.close()
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=col((176, 16, 34), 255 * a)))
        c.drawRect(skia.Rect(x + w * 0.18, top, x + w / 2 + 4, base + 4), skia.Paint(Color=col((128, 8, 26), 255 * a)))
        c.drawLine(x - w / 2, top + sw + 3, x + w / 2, top - sw + 3, skia.Paint(AntiAlias=True, Color=col((236, 70, 80), 255 * a), StrokeWidth=5))
        c.restore()
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col((236, 244, 255), 230 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=6))
    c.drawLine(x - w / 2 + 16, base - h + 22, x - w / 2 + 16, base - 22, skia.Paint(AntiAlias=True, Color=col(K.WHITE, 120 * a), StrokeWidth=7,
                                                                                StrokeCap=skia.Paint.kRound_Cap))
    if label:
        K.text(c, label, x, base + 62, 44, K.WHITE, a, align='center')
    if sub:
        K.text(c, sub, x, base + 112, 34, K.INK, a, align='center', face=K.XB)
    if ring_a > 0.01:
        K.ring(c, (x, base - h / 2), max(w, h) * 0.72, K.CORAL, ring_a, 7)


def puddle(c, x, y, s, a):
    if a <= 0.01:
        return
    p = CU.stain_path(x, y, 38 * s, 7)
    c.save(); c.translate(x, y); c.scale(1.0, 0.45); c.translate(-x, -y)
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=col((120, 8, 24), 255 * a)))
    c.drawPath(CU.stain_path(x - 6, y - 4, 30 * s, 7), skia.Paint(AntiAlias=True, Color=col((176, 16, 34), 255 * a)))
    c.restore()


def r3(c, t):
    c.drawImage(K.calm_bg(), 0, 0)
    t1, t2, t3, t4, t5 = (cue('r3', i) for i in range(1, 6))
    a1 = smooth((t - t1 + 0.3) / 0.4)
    fill = lambda t0: smooth((t - t0 + 0.2) / 1.2)
    drain = smooth((t - t2 - 0.3) / 2.2)
    jug(c, 420, 760, 260, 420, (1.0 - 0.2 * drain) * fill(t1), a1, t, 'Adult', 'about 5 L')
    # the liter that leaves: a stream into a small beaker
    if drain > 0.01 and drain < 0.999:
        c.drawLine(560, 760 - 420 * (1 - 0.2 * drain) + 20, 600, 690, skia.Paint(AntiAlias=True, Color=col((176, 16, 34)), StrokeWidth=12,
                                                                                StrokeCap=skia.Paint.kRound_Cap))
    a2 = smooth((t - t2) / 0.4)
    jug(c, 640, 760, 120, 150, 0.95 * drain, a2, t, None, None)
    K.text(c, '1 L lost', 640, 822, 38, K.CORAL, a2, align='center')
    K.hw(c, 'a fifth: serious', 520, 300, 52, K.CORAL, t, t2 + 1.4, 1.0)
    a3 = smooth((t - t3) / 0.4)
    jug(c, 1060, 760, 170, 260, 0.9 * fill(t3), a3, t, 'Child', 'a lot less')
    K.hw(c, 'about 500 mL lost: serious', 920, 400, 46, K.CORAL, t, t3 + 1.6, 1.2)
    a4 = smooth((t - t4) / 0.4)
    jug(c, 1500, 760, 110, 130, 0.9 * fill(t4), a4, t, 'Infant', None)
    K.hw(c, '100 to 200 mL lost: serious', 1350, 520, 44, K.CORAL, t, t4 + 0.8, 1.2)
    a5 = smooth((t - t5) / 0.4)
    for x in (420, 1060, 1500):
        puddle(c, x + 10, 960, 1.6, a5)
    if a5 > 0.01:
        K.ring(c, (1500, 700), 150, K.CORAL, a5 * (0.7 + 0.3 * math.sin(t * 5)), 7)
        K.hw(c, 'same puddle, very different problem', 960, 1050, 50, K.YELLOW, t, t5 + 0.6, 1.4, align='center')


WD.PRESS.append((cue('r4') - 1.5, end('r4') + 1.0)); WD.GAUZE.append((cue('r4') - 1.5, end('r4') + 1.0))


def r4(c, t):
    g = WD.garage()
    t0 = cue('r4') - 0.5
    L = liq('wide', t0 - 9.0)
    cam = (1150.0, 600.0, 1.12)
    g.draw(c, t, (t0, end('r4') + 0.6), cam, lambda cc, tt, w, lay: L.draw(cc, tt, clip_y=-1e5, below=(lay == 'mid')))
    items = [('It\'s spurting', cue('r4', 1)), ('It\'s pooling on the floor fast', cue('r4', 2)),
             ('It soaks a dressing in seconds', cue('r4', 3)), ('Part of the limb is gone', cue('r4', 4))]
    for i, (s, t1) in enumerate(items):
        a = smooth((t - t1 + 0.1) / 0.3)
        if a <= 0.01:
            continue
        y = 260 + i * 118
        K.card(c, 1130, y - 60, 720, 94, a, r=47, border=K.CORAL)
        K.text(c, s, 1180, y + 2, 38, K.WHITE, a, face=K.XB)
    a5 = smooth((t - cue('r4', 5)) / 0.3)
    if a5 > 0.01:
        K.card(c, 1130, 760, 720, 100, a5, r=50, fill=(120, 16, 30), fa=0.92, border=K.CORAL)
        K.text(c, 'Any one: think TOURNIQUET', 1180, 826, 42, K.WHITE, a5)
    # the pool and the soaked gauze get pointed at on their words
    wnd = K.w2s(cam, g.wound_now)
    K.ring(c, (wnd[0] - 90, K.w2s(cam, (0, WD.FLOOR))[1] - 6), 70, K.CORAL, win(t, cue('r4', 2), cue('r4', 3)), 6)
    K.ring(c, wnd, 46, K.CORAL, win(t, cue('r4', 3), cue('r4', 4)), 6)


def q1(c, t):
    c.drawImage(K.calm_bg(), 0, 0)
    t0 = cue('q1q')
    K.chip(c, 'QUICK CHECK', 960, 220, K.YELLOW, smooth((t - t0) / 0.3), 40)
    K.hw(c, 'Dark red blood, flowing steadily', 960, 420, 66, K.WHITE, t, cue('q1q', 1), 1.2, align='center')
    K.hw(c, 'from a deep cut on the shin. No spurting.', 960, 510, 58, K.WHITE, t, cue('q1q', 1) + 1.3, 1.3, align='center')
    K.hw(c, 'Which kind of vessel is open?', 960, 640, 62, K.YELLOW, t, cue('q1q', 2), 1.1, align='center')
    ta = cue('q1a')
    a = smooth((t - ta) / 0.3)
    if a > 0.01:
        K.card(c, 610, 720, 700, 120, a, r=60, fill=(40, 10, 40), fa=0.9, border=K.LILAC)
        K.text(c, 'A VEIN', 960, 802, 60, K.WHITE, a, align='center')
    K.hw_rich(c, [('dark + steady = ', K.WHITE), ('vein', K.LILAC)], 960, 930, 52, t, cue('q1a', 1), 1.0, align='center')
    K.hw_rich(c, [('bright + spurting = ', K.WHITE), ('artery', K.CORAL)], 960, 1010, 52, t, cue('q1a', 2), 1.0, align='center')


def sounds():
    K.snd('swish', T_VEN, 0.45); K.snd('swish', T_CAP, 0.45)
    for k in range(1, 6):
        K.snd('pat', cue('r3', k), 0.35)
    for k in range(1, 5):
        K.snd('pat', cue('r4', k), 0.35)
    K.snd('wrong', cue('r4', 5), 0.0)
    K.snd('check', cue('q1a'), 0.4)
    K.snd('check', cue('r2', 4), 0.35)


SHOTS = [dict(t0=cue('r1') - 0.6, t1=T_VEN, fn=r1, fin=0.4),
         dict(t0=T_VEN, t1=T_CAP, fn=r2_ven, fin=0.0),
         dict(t0=T_CAP, t1=end('r2') + 0.45, fn=r2_cap, fin=0.0),
         dict(t0=cue('r3') - 0.2, t1=end('r3') + 0.45, fn=r3, fin=0.4),
         dict(t0=cue('r4') - 0.3, t1=end('r4') + 0.45, fn=r4, fin=0.4),
         dict(t0=cue('q1q') - 0.2, t1=end('q1a') + 1.0, fn=q1, fin=0.4)]
