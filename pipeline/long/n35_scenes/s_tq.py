"""Chapters 5 to 7: Tourniquet first, Where it goes and how tight, After it's on.
Garage wide (she presses, the tourniquet goes on), the device part by part on the close up, an improvised narrow
belt on the lengthwise arm (veins shut, artery open: worse), placement (2 to 3 inches above, never a joint, high and
tight on the body map), how tight (bleeding stops AND distal pulse gone), the mechanism inside the arm, the time on
the tag, never covered, never loosened, a second tourniquet above the first."""
import sys, math, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, col
import closeup as CU, diag as DG, wide as WD
import geo

LIQ = '/home/claude/n35/liq/'
_l = {}


def liq(name, t0):
    if (name, t0) not in _l:
        _l[(name, t0)] = K.Liq(LIQ + name, t0)
    return _l[(name, t0)]


T_TQ_WIDE = cue('t1', 3) - 0.1
WD.PRESS.append((cue('t1') - 1.5, cue('t2'))); WD.GAUZE.append((cue('t1') - 1.5, cue('t2')))
WD.TQ_ON.append((T_TQ_WIDE + 0.5, cue('t2')))
WD.TQ_ON.append((cue('w5') - 1.0, end('w5') + 1.0)); WD.GAUZE.append((cue('w5') - 1.0, end('w5') + 1.0))
WD.WINCES.extend([cue('t1', 1), cue('w5') + 0.2, cue('w5', 1) + 0.4, cue('w5', 2)])
TIME = '6:42 PM'
TAG = '6:42'


# ------------------------------------------------------------------ garage
def t1(c, t):
    g = WD.garage()
    t0 = cue('t1') - 0.5
    L = liq('wide', t0 - 14.0)
    wnd = g.wound_now
    u = smooth((t - cue('t1', 1)) / 1.4) * (1 - smooth((t - cue('t1', 2) - 0.4) / 1.2))
    cam = K.cam_lerp((1100.0, 590.0, 1.08), (wnd[0], wnd[1] - 20, 1.7), u)
    g.draw(c, t, (t0, cue('t2') + 0.2), cam, lambda cc, tt, w, lay: L.draw(cc, tt, clip_y=-1e5, below=(lay == 'mid')))
    ws = K.w2s(cam, wnd)
    K.ring(c, ws, 60, K.CORAL, win(t, cue('t1', 1) + 0.6, cue('t1', 2)), 6)
    K.chip(c, 'pushing through the gauze', ws[0] + 380, ws[1] - 230, K.CORAL, win(t, cue('t1', 1) + 0.6, cue('t1', 2)), 40, anchor=ws)
    a2 = win(t, cue('t1', 2), cue('t2') - 0.2)
    K.text_card(c, [('life threatening bleed from a limb', K.WHITE, a2), ('= TOURNIQUET', K.CORAL, a2)], 1150, 230)
    K.chip(c, 'right now', 1460, 470, K.CORAL, win(t, cue('t1', 3), cue('t2') - 0.2), 52)


def wide_w5(c, t):
    g = WD.garage()
    t0 = cue('w5') - 0.6
    L = liq('wide', 0.0)
    pool = L.n - 1

    def ex(cc, tt, w, lay):
        L.draw(cc, pool / 30.0 + 0.0001, clip_y=-1e5, below=(lay == 'mid'))          # the pool and the soaked floor stay; nothing new spurts
    g.draw(c, t, (t0, end('w5') + 0.6), (1100.0, 590.0, 1.12), ex)
    a1 = win(t, cue('w5'), end('w5') + 0.4)
    K.text_card(c, [("it's going to hurt, a lot", K.WHITE, a1), ('tell him before you start', K.YELLOW, smooth((t - cue('w5', 1)) / 0.3) * a1),
                    ("don't loosen it because it hurts", K.CORAL, smooth((t - cue('w5', 2)) / 0.3) * a1)], 1150, 230)


# ------------------------------------------------------------------ the device on the close up
def tq_cu(c, t, cam, twist=0.9, rod=0.0, tag=None, t_tag=1e9, stain=96, hl=None, tq2=0.0, tq_a=1.0, extra=None, pulse=None,
          wound_open=False):
    K.draw_plate(c, 'g_arm.png', cam)
    K.push_cam(c, cam)
    if wound_open:
        CU.wound(c)
    if extra:
        extra(c, t)
    if stain is not None:
        CU.gauze_and_stain(c, stain)
    CU.tourniquet(c, CU.TQX, a=tq_a, twist=twist, tag_text=tag, t=t, t_tag=t_tag, rod_angle=rod, highlight=hl)
    if tq2 > 0.01:
        c.save(); c.translate(0, -60 * (1 - tq2))
        CU.tourniquet(c, CU.TQX2, a=tq2, twist=0.6, rod_angle=0.6)
        c.restore()
    if pulse is not None:
        CU.pulse_ring(c, t, *pulse)
    c.restore()


def t2(c, t):
    cam = (CU.TQX - 30, geo.Y(250), 1.55)
    tqa = smooth((t - cue('t2') + 0.6) / 0.6)
    hl = None
    for kind, t0, t1_ in (('strap', cue('t2', 1), cue('t2', 2)), ('rod', cue('t2', 2), cue('t2', 3)), ('clip', cue('t2', 3), end('t2') + 0.4)):
        if t0 <= t < t1_:
            hl = (kind, smooth((t - t0) / 0.3))
    rod = 0.0
    if cue('t2', 2) + 0.5 <= t < cue('t2', 3):
        rod = 2.2 * smooth((t - cue('t2', 2) - 0.5) / 2.4)
    elif t >= cue('t2', 3):
        rod = 2.2
    tq_cu(c, t, cam, twist=0.5 + 0.3 * smooth((t - cue('t2', 2) - 0.5) / 2.4), rod=rod, hl=hl, tq_a=tqa, stain=55)
    K.chip(c, 'commercial windlass tourniquet', 960, 200, K.YELLOW, win(t, cue('t2') + 0.2, cue('t2', 1)), 44)
    labels = [('wide strap: goes around the limb', cue('t2', 1), cue('t2', 2)), ('windlass: you twist it to tighten', cue('t2', 2), cue('t2', 3)),
              ("clip: locks the rod so it can't unwind", cue('t2', 3), end('t2') + 0.4)]
    for s, t0, t1_ in labels:
        K.text_card(c, [(s, K.WHITE, win(t, t0, t1_))], 120, 880, size=46)


def t3(c, t):
    LG = t3.L if hasattr(t3, 'L') else DG.Long(t0=cue('t3') - 0.5)
    t3.L = LG
    ts = cue('t3', 2)
    st = 0.5 * smooth((t - ts) / 2.0)                 # a narrow belt: the vein shuts, the artery stays open
    sw = smooth((t - ts - 2.4) / 4.0)
    LG.v_fn = lambda tt: 55.0 * (1 - smooth((tt - ts - 0.8) / 1.0))
    LG.draw(c, t, strap=st, strap_on=smooth((t - cue('t3') - 0.3) / 0.4), tear=1.0, leak=0.5 + 0.5 * sw, swell=sw, show_strap_narrow=True)
    K.vignette(c, 0.2)
    sp = K.w2s(DG.CAM_LONG, (DG.STRAP_X, DG.SKIN_TOP(DG.STRAP_X)))
    K.chip(c, 'improvised: belt, shirt and a stick', sp[0], sp[1] - 80, K.DRED, win(t, cue('t3', 1), end('t3') + 0.3), 38)
    a2 = win(t, ts, end('t3') + 0.3)
    K.text_card(c, [('too narrow: the veins shut', K.WHITE, a2), ('the artery stays open', K.CORAL, smooth((t - ts - 2.0) / 0.3) * a2),
                    ('bleeding gets WORSE', K.CORAL, smooth((t - ts - 7.0) / 0.3) * a2)], 1260, 760)
    K.text_card(c, [('only if you have nothing else', K.YELLOW, win(t, cue('t3', 3) + 1.5, end('t3') + 0.3))], 120, 860)


# ------------------------------------------------------------------ placement
def w1(c, t):
    t1_, t2_, t3_ = cue('w1', 1), cue('w1', 2), cue('w1', 3)
    if t2_ - 0.3 <= t < t3_ - 0.3:
        body_joints(c, t, t2_)
        return
    cam = (geo.X(590), geo.Y(270), 1.12)
    tqa = smooth((t - t3_ - 0.4) / 0.7)
    K.draw_plate(c, 'g_arm.png', cam)
    K.push_cam(c, cam)
    CU.wound(c)
    if tqa > 0.01:
        c.save(); c.translate(0, -70 * (1 - tqa)); CU.tourniquet(c, CU.TQX, a=tqa, twist=0.4, rod_angle=0.3); c.restore()
    c.restore()
    a1 = win(t, t1_, t2_ - 0.3) + (smooth((t - t3_) / 0.3) if t > t3_ else 0)
    a1 = clamp(a1)
    if a1 > 0.01:
        w = K.w2s(cam, (CU.WOUND[0], CU.WOUND[1] - 70)); q = K.w2s(cam, (CU.TQX, CU.edge_y(CU.TOP, CU.TQX) - 70))
        K.ring(c, K.w2s(cam, CU.WOUND), 40, K.CORAL, a1, 6)
        K.arrow(c, w, q, K.YELLOW, 10, 30, a1, grow=smooth((t - t1_) / 0.8) if t < t2_ else 1.0)
        K.arrow(c, q, w, K.YELLOW, 10, 30, a1 * smooth((t - t1_ - 0.6) / 0.4) if t < t2_ else a1)
        K.chip(c, '2 to 3 inches', (w[0] + q[0]) / 2, w[1] - 60, K.YELLOW, a1, 40)
        K.chip(c, 'toward the heart', K.w2s(cam, (geo.X(740), 0))[0], 170, K.TEAL, a1, 38)
        K.arrow(c, (q[0] + 120, 240), (q[0] + 300, 240), K.TEAL, 10, 30, a1)
    K.text_card(c, [('between the wound and the heart, on healthy skin', K.WHITE, win(t, t1_ + 1.5, t2_ - 0.3))], 120, 880)
    K.text_card(c, [('his forearm, a few inches toward the elbow', K.WHITE, smooth((t - t3_) / 0.3))], 120, 880)


def body_joints(c, t, t0):
    DG.body(c)
    k = smooth((t - t0) / 0.4)
    for nm in ('elbow_r', 'elbow_l', 'knee_r', 'knee_l'):
        p = DG.BODY[nm]
        K.ring(c, p, 34, K.DRED, k, 6)
        K.x_mark(c, p[0], p[1], 0.32, k * smooth((t - t0 - 0.6) / 0.3))
    K.text_card(c, [('never over a joint', K.CORAL, k), ('bone and tendon shield the artery', K.WHITE, smooth((t - t0 - 1.6) / 0.3)),
                    ('so the strap can\'t squeeze it shut', K.WHITE, smooth((t - t0 - 3.4) / 0.3))], 80, 700)


def band_on_body(c, p, w, a, colr=(38, 41, 50)):
    if a <= 0.01:
        return
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(p[0] - w / 2, p[1] - 10, p[0] + w / 2, p[1] + 10), 5, 5), skia.Paint(AntiAlias=True, Color=col(colr, 255 * a)))
    c.drawRect(skia.Rect(p[0] - w / 2, p[1] + 3, p[0] + w / 2, p[1] + 10), skia.Paint(Color=col((20, 22, 28), 255 * a)))


def w2(c, t):
    DG.body(c)
    rows = [('an amputation', cue('w2')), ('2+ wounds on the same limb', cue('w2', 1)),
            ('too mangled to see the source', cue('w2', 2))]
    K.text_card(c, [(s, K.WHITE, smooth((t - t0) / 0.3)) for s, t0 in rows], 50, 300, size=34)
    a4 = smooth((t - cue('w2', 3)) / 0.4)
    K.text_card(c, [('then: HIGH AND TIGHT', K.YELLOW, a4), ('as high on the limb as you can', K.WHITE, smooth((t - cue('w2', 4)) / 0.3))], 50, 640, size=36)
    g = smooth((t - cue('w2', 4)) / 0.5)
    for nm, w in (('upperarm_r', 46), ('thigh_l', 64)):
        p = DG.BODY[nm]
        band_on_body(c, (p[0], p[1] - 18 * (nm == 'thigh_l')), w, g)
        K.ring(c, p, 50, K.DGOLD, g, 5)


def w3(c, t):
    t0 = cue('w3') - 0.1
    tw0 = cue('w3', 1)
    stop = t0 + 7.2
    rod = 3.4 * smooth((t - tw0) / (stop - tw0 + 0.3))
    alive = 1 - smooth((t - stop - 0.4) / 0.4)

    def ex(cc, tt):
        liq('w3_tq', t0).draw(cc, tt)
    cam = (geo.X(560), geo.Y(270), 1.1)
    tq_cu(c, t, cam, twist=0.4 + 0.6 * smooth((t - tw0) / (stop - tw0)), rod=rod, stain=None, extra=ex, pulse=(1.0, alive), wound_open=True)
    a = win(t, tw0, cue('w3', 2) + 0.3)
    K.text_card(c, [('twist until:', K.WHITE, a), ('1  the bleeding stops', K.GREEN if t > stop else K.WHITE, a),
                    ('2  the pulse below is gone', K.GREEN if t > stop + 0.8 else K.WHITE, smooth((t - tw0 - 1.4) / 0.3) * a)], 1240, 640)
    K.chip(c, 'distal pulse: at the wrist', K.w2s(cam, CU.P(415, 262))[0] + 40, 170, K.TEAL, win(t, tw0 + 1.6, cue('w3', 2)), 36,
           anchor=K.w2s(cam, CU.P(415, 255)))
    K.chip(c, 'you need both', 960, 960, K.YELLOW, win(t, cue('w3', 2), end('w3') + 0.3), 46)


def w4(c, t):
    LG = w4.L if hasattr(w4, 'L') else DG.Long(t0=cue('w4') - 0.5)
    w4.L = LG
    c1, c2, c3, c4, c5, c6 = (cue('w4', i) for i in range(1, 7))
    st = 0.45 * smooth((t - c2) / 1.6) + 0.55 * smooth((t - c5) / 1.6)
    v_shut = smooth((t - c2 - 0.8) / 0.8)
    a_shut = smooth((t - c5 - 0.8) / 0.8)
    sw = smooth((t - c4) / 3.0) * (1 - 0.3 * a_shut)
    LG.v_fn = lambda tt: 55.0 * (1 - smooth((tt - c2 - 0.8) / 0.8))
    LG.a_fn = lambda tt: -120 * (0.55 + 0.9 * DG.beat_(tt)) * (1 - smooth((tt - c5 - 0.8) / 0.8))
    leak = (0.45 + 0.55 * sw) * (1 - a_shut)
    LG.draw(c, t, strap=st, strap_on=smooth((t - c2 + 0.5) / 0.4), tear=1.0, leak=leak, swell=sw, pulse=(1 - a_shut, 1.0))
    K.vignette(c, 0.2)
    cam = DG.CAM_LONG
    ap = K.w2s(cam, (geo.X(820), DG.ART_Y)); vp = K.w2s(cam, (geo.X(820), DG.VEIN_Y))
    K.chip(c, 'artery: in, pushed by the heart', ap[0] - 60, 200, K.DRED, win(t, cue('w4') + 0.3, c2), 36, anchor=ap)
    K.chip(c, 'veins: back out, low pressure', vp[0] - 60, 900, K.LILAC, win(t, c1, c3), 36, anchor=vp)
    K.text_card(c, [('loose strap: the veins shut first', K.WHITE, win(t, c2, c5)),
                    ('the artery is still pumping blood in', K.CORAL, win(t, c3, c5)),
                    ('in, but not out: the limb fills up', K.CORAL, win(t, c4, c5)),
                    ('and the wound bleeds harder', K.CORAL, win(t, c4 + 2.2, c5))], 110, 160)
    K.text_card(c, [('twist further: the artery closes too', K.WHITE, win(t, c5, end('w4') + 0.3)),
                    ('nothing gets in: bleeding stops', K.GREEN, win(t, c6, end('w4') + 0.3)),
                    ('and the pulse below is gone', K.GREEN, win(t, c6 + 1.6, end('w4') + 0.3))], 110, 160)


def q2(c, t):
    cam = (geo.X(512), geo.Y(405), 1.55)
    K.draw_plate(c, 'g_body.png', cam)
    knee = K.w2s(cam, DG.BODY['knee_l']); wound = K.w2s(cam, (DG.BODY['knee_l'][0] + 2, DG.BODY['knee_l'][1] + 34))
    thigh = K.w2s(cam, DG.BODY['thigh_l'])
    a = smooth((t - cue('q2q') - 0.2) / 0.4)
    c.drawOval(skia.Rect(wound[0] - 22, wound[1] - 8, wound[0] + 22, wound[1] + 8), skia.Paint(AntiAlias=True, Color=col((150, 10, 26), 255 * a)))
    K.ring(c, wound, 40, K.DRED, a * (0.7 + 0.3 * math.sin(t * 6)), 6)
    K.chip(c, 'spurting, just below the knee', wound[0] + 330, wound[1] + 40, K.DRED, win(t, cue('q2q', 1), end('q2a') + 0.3), 36, anchor=wound)
    am = smooth((t - cue('q2q', 2)) / 0.4)
    if am > 0.01:
        K.arrow(c, (wound[0] - 70, wound[1]), (wound[0] - 70, knee[1]), K.DGOLD, 10, 28, am, grow=smooth((t - cue('q2q', 2)) / 1.0))
        K.chip(c, '2 to 3 in', wound[0] - 230, (wound[1] + knee[1]) / 2, K.DGOLD, am, 34)
        K.ring(c, knee, 46, K.DRED, am, 6)
    K.text_card(c, [('So where does the tourniquet go?', K.YELLOW, smooth((t - cue('q2q', 2) - 2.0) / 0.3) * (1 - smooth((t - cue('q2a')) / 0.3)))], 80, 820)
    ga = smooth((t - cue('q2a')) / 0.4)
    if ga > 0.01:
        bx, by = knee[0] - 6, knee[1] - 120
        band_on_body(c, (bx, by), 110, ga)
        K.check_mark(c, bx + 120, by - 10, 0.55, ga)
        K.x_mark(c, knee[0] + 110, knee[1], 0.45, smooth((t - cue('q2a', 1)) / 0.3))
    K.text_card(c, [('on the thigh, above the knee', K.GREEN, ga), ('never on the joint itself', K.CORAL, smooth((t - cue('q2a', 1)) / 0.3)),
                    ('lands on a joint? go above the joint', K.WHITE, smooth((t - cue('q2a', 2)) / 0.3))], 80, 760)


# ------------------------------------------------------------------ after it's on
def f1(c, t):
    cam = (CU.TQX - 40, geo.Y(270), 1.6)
    tq_cu(c, t, cam, twist=1.0, rod=3.4, tag=TAG, t_tag=cue('f1') + 1.0)
    K.text_card(c, [('write the time:', K.WHITE, win(t, cue('f1') + 0.4, end('f1') + 0.4)),
                    ('1  on the tourniquet', K.WHITE, win(t, cue('f1', 1), end('f1') + 0.4)),
                    ('2  in your report', K.WHITE, win(t, cue('f1', 2), end('f1') + 0.4)),
                    ('3  say it out loud at handoff', K.YELLOW, win(t, cue('f1', 3), end('f1') + 0.4))], 120, 640)
    K.chip(c, f'"Tourniquet on at {TIME}"', 1340, 230, K.YELLOW, win(t, cue('f1', 3) + 0.6, end('f1') + 0.4), 40)
    K.chip(c, 'longer on = more risk to the limb', 1340, 330, K.CORAL, win(t, cue('f1', 3) + 2.4, end('f1') + 0.4), 36)


def blanket(c, u, a=1.0):
    """A navy fleece blanket sliding over the forearm from the right."""
    if u <= 0.01:
        return
    x0 = lerp(1980, geo.X(430), u)
    p = skia.Path(); p.moveTo(x0, geo.Y(170)); p.cubicTo(x0 - 60, geo.Y(260), x0 - 40, geo.Y(380), x0 + 20, geo.Y(470))
    p.lineTo(2100, geo.Y(470)); p.lineTo(2100, geo.Y(170)); p.close()
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=col((52, 70, 128), 255 * a)))
    c.save(); c.clipPath(p, True)
    c.drawRect(skia.Rect(x0 - 100, geo.Y(380), 2100, geo.Y(480)), skia.Paint(Color=col((38, 52, 100), 255 * a)))
    for k in range(4):
        c.drawLine(x0 + 60 + k * 90, geo.Y(180), x0 + 30 + k * 90, geo.Y(460), skia.Paint(AntiAlias=True, Color=col((70, 90, 150), 200 * a), StrokeWidth=5))
    c.restore()


def f2(c, t):
    c1, c2, c3 = cue('f2', 1), cue('f2', 2), cue('f2', 3)
    cam = (geo.X(560), geo.Y(270), 1.1)
    cover = smooth((t - c1) / 0.9) * (1 - smooth((t - c2 - 0.8) / 0.8))
    loosen = smooth((t - c3 - 0.6) / 1.2)
    rod = 3.4 - 2.6 * loosen

    def ex(cc, tt):
        if tt >= c3 + 1.2:
            liq('s1_slap', c3 + 1.2).draw(cc, tt)
    K.draw_plate(c, 'g_arm.png', cam)
    K.push_cam(c, cam)
    CU.wound(c)
    ex(c, t)
    CU.gauze_and_stain(c, 96)
    CU.tourniquet(c, CU.TQX, twist=1.0 - 0.6 * loosen, tag_text=TAG, t=t, t_tag=0, rod_angle=rod)
    blanket(c, cover)
    c.restore()
    K.x_mark(c, 1650, 300, 0.85, win(t, c1 + 0.8, c2 + 1.2))
    K.text_card(c, [('never cover it', K.CORAL, win(t, c1, c3 - 0.3)), ("the next person shouldn't have to hunt for it", K.WHITE, win(t, c2, c3 - 0.3))], 120, 860)
    K.status = None
    K.chip(c, 'what if: loosened', 380, 200, K.CORAL, win(t, c3 + 0.4, end('f2') + 0.3), 40)
    K.text_card(c, [("don't loosen it or take it off in the field", K.WHITE, win(t, c3, end('f2') + 0.3)),
                    ('loosen it: the bleeding starts again', K.CORAL, win(t, c3 + 2.4, end('f2') + 0.3))], 120, 860)
    K.x_mark(c, 1650, 300, 0.85, win(t, c3 + 2.6, end('f2') + 0.3))


def f3(c, t):
    cam = (geo.X(640), geo.Y(270), 1.25)
    tq2 = smooth((t - cue('f3', 1) - 0.2) / 0.8)
    tq_cu(c, t, cam, twist=1.0, rod=3.4, tag=TAG, t_tag=0, tq2=tq2)
    K.text_card(c, [("as tight as it'll go, still bleeding?", K.WHITE, smooth((t - cue('f3') - 0.3) / 0.3)),
                    ("don't keep cranking", K.CORAL, smooth((t - cue('f3') - 2.6) / 0.3)),
                    ('add a second one, right above the first', K.GREEN, smooth((t - cue('f3', 1)) / 0.3))], 120, 760)
    p = K.w2s(cam, (CU.TQX2, CU.edge_y(CU.TOP, CU.TQX2) - 60))
    K.chip(c, 'closer to the heart', p[0], p[1] - 70, K.TEAL, smooth((t - cue('f3', 1) - 1.4) / 0.3), 38)


def sounds():
    K.snd('whoosh_real' if False else 'swish', T_TQ_WIDE + 0.5, 0.5)
    K.snd('cloth_real', T_TQ_WIDE + 0.6, 0.45)
    for k in (1, 2, 3):
        K.snd('pat', cue('t2', k), 0.35)
    K.snd('wrong', cue('t3', 2) + 7.0, 0.3)
    K.snd('wrong', cue('w1', 2), 0.3)
    K.snd('check', cue('w3') - 0.1 + 7.2, 0.4)
    K.snd('check', cue('q2a'), 0.4)
    K.snd('wrong', cue('f2', 1) + 0.8, 0.3)
    K.snd('cloth_real', cue('f2', 1), 0.35)
    K.snd('cloth_real', cue('f3', 1), 0.4)


SHOTS = [dict(t0=cue('t1') - 0.5, t1=cue('t2') - 0.2, fn=t1, fin=0.4),
         dict(t0=cue('t2') - 0.2, t1=end('t2') + 0.45, fn=t2, fin=0.4),
         dict(t0=cue('t3') - 0.2, t1=end('t3') + 0.45, fn=t3, fin=0.4),
         dict(t0=cue('w1') - 0.4, t1=end('w1') + 0.45, fn=w1, fin=0.4),
         dict(t0=cue('w2') - 0.2, t1=end('w2') + 0.45, fn=w2, fin=0.4),
         dict(t0=cue('w3') - 0.2, t1=end('w3') + 0.45, fn=w3, fin=0.4),
         dict(t0=cue('w4') - 0.2, t1=end('w4') + 0.45, fn=w4, fin=0.4),
         dict(t0=cue('w5') - 0.2, t1=end('w5') + 0.45, fn=wide_w5, fin=0.4),
         dict(t0=cue('q2q') - 0.2, t1=end('q2a') + 1.0, fn=q2, fin=0.4),
         dict(t0=cue('f1') - 0.4, t1=end('f1') + 0.45, fn=f1, fin=0.4),
         dict(t0=cue('f2') - 0.2, t1=end('f2') + 0.45, fn=f2, fin=0.4),
         dict(t0=cue('f3') - 0.2, t1=end('f3') + 1.0, fn=f3, fin=0.4)]
