"""Chapter 2, Why pressure works: the arm cut open lengthwise; a gloved hand presses over the torn artery, the vessels
pinch flatter, less blood escapes; platelets stick and a clot builds only while pressure slows the flow; three ways."""
import sys, math, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, col
import closeup as CU, diag as DG
import geo

LG = DG.Long(t0=cue('p1') - 0.5)
CAM1 = (geo.X(540), geo.Y(285), 1.75)


def cam_at(t):
    z = smooth((t - cue('p2') + 0.4) / 1.6) * (1 - smooth((t - cue('p3') + 0.8) / 0.8))
    tear = (DG.TEAR_X + 40, DG.ART_Y - 60, 2.6)
    return K.cam_lerp(CAM1, tear, z)


def press_amt(t):
    on1 = smooth((t - cue('p1', 2)) / 0.6)
    off = smooth((t - cue('p2', 3)) / 0.5) * (1 - smooth((t - cue('p2', 4)) / 0.6))
    return on1 * (1 - off)


def glove_on_diag(c, t, cam, k):
    """The same blue glove (from the painting), palm down on the skin over the tear; k 0..1 lowers it on."""
    if k <= 0.01 and t > cue('p1', 2):
        k = 0.0
    sc = 0.42
    tx = DG.TEAR_X + 6; ty = DG.SKIN_TOP(tx)
    # glove palm point in the close up layer: about (560, 232) in Gemini px
    gx, gy = geo.P(565, 236)
    lift = (1 - k) * 220
    c.save()
    K.push_cam(c, cam)
    # cutaway: the hand presses on the skin surface; below the skin we see inside the arm
    c.clipRect(skia.Rect(-4000, -4000, 8000, DG.SKIN_TOP(tx) + 6))
    c.translate(tx, ty - lift); c.scale(sc, sc); c.translate(-gx, -gy)
    xr = 1.0
    p = skia.Paint(AntiAlias=True); p.setAlphaf(clamp(0.2 + k * 1.2) * xr)
    c.drawImage(K.plate_img('l_glove.png'), 0, 0, K.SMP, p)
    c.restore()
    c.restore()


def p1p2(c, t):
    cam = cam_at(t)
    pr = press_amt(t)
    t_plt = cue('p2', 1)
    clot = smooth((t - t_plt) / 6.0) * 0.55 + smooth((t - cue('p2', 2)) / 1.8) * 0.45
    broken = smooth((t - cue('p2', 3) - 0.3) / 0.6) * (1 - smooth((t - cue('p2', 4) - 0.3) / 1.0))
    clot = clot * (1 - 0.8 * broken)
    leak = 1.0 - 0.7 * pr
    if t > cue('p2', 4):
        leak = leak * (1 - smooth((t - cue('p2', 4) - 1.0) / 2.0))
    LG.a_fn = lambda tt: -120 * (0.55 + 0.9 * DG.beat_(tt)) * (1 - 0.55 * press_amt(tt))
    LG.draw(c, t, cam=cam, press=pr * 0.9, press_x=DG.TEAR_X, tear=1.0, leak=leak,
            plt_frac=0.28 * smooth((t - t_plt + 0.5) / 0.8), clot=clot, clot_x=DG.TEAR_X)
    glove_on_diag(c, t, cam, pr if t > cue('p1', 2) - 0.6 else 0.0)
    K.vignette(c, 0.2)
    tear = K.w2s(cam, (DG.TEAR_X, DG.ART_Y - DG.ART_R))
    K.chip(c, 'torn artery', tear[0] + 230, tear[1] + 160, K.DRED, win(t, cue('p1', 1), cue('p1', 2) + 1.5), 38, anchor=tear)
    a2 = win(t, cue('p1', 2) + 0.3, cue('p2') - 0.2)
    K.hw(c, 'press: the vessel gets pinched flatter', 140, 980, 54, K.DINK, t, cue('p1', 2) + 0.4, 1.4, a=a2, shadow=False)
    K.hw(c, 'less blood gets through, with less force', 140, 1050 - 0, 50, K.DGREEN, t, cue('p1', 3), 1.4, a=win(t, cue('p1', 3), cue('p2') - 0.2), shadow=False)
    # platelets and the clot (zoomed in)
    a3 = win(t, cue('p2', 1), cue('p2', 3))
    K.text_card(c, [('platelets: tiny cell pieces', K.LILAC, a3), ('that help blood clot', K.WHITE, a3)], 110, 160)
    K.chip(c, 'a clot builds', 1450, 220, K.GREEN, win(t, cue('p2', 2), cue('p2', 3)), 42)
    a4 = win(t, cue('p2', 3), cue('p2', 4))
    K.text_card(c, [('no pressure: the flow tears it away', K.CORAL, a4)], 110, 160)
    K.x_mark(c, 1560, 260, 0.8, a4)
    a5 = win(t, cue('p2', 4), end('p2') + 0.4)
    K.text_card(c, [('pressure slows the flow', K.WHITE, a5), ('so the clot can form', K.GREEN, a5)], 110, 160)
    K.check_mark(c, 1560, 260, 0.8, a5)


@functools.lru_cache(maxsize=4)
def comp(kind):
    def fn(c):
        K.draw_plate(c, 'g_arm.png')
        if kind == 'hand':
            c.drawImage(K.plate_img('l_glove.png'), 0, 0, K.SMP)
        elif kind == 'dressing':
            CU.gauze_and_stain(c, 0)
            c.drawImage(K.plate_img('l_glove.png'), 0, 0, K.SMP)
        else:
            CU.gauze_and_stain(c, 0)
            CU.bandage(c, 1.0)
    return K.offscreen(fn)


def p3(c, t):
    c.drawImage(K.calm_bg(), 0, 0)
    K.hw(c, 'Three ways to put pressure on it', 960, 200, 64, K.YELLOW, t, cue('p3') + 0.1, 1.2, align='center')
    items = [('hand', 'Gloved hand', cue('p3', 1)), ('dressing', 'Hand on a dressing', cue('p3', 2)),
             ('wrap', 'Pressure dressing', cue('p3', 3))]
    for i, (k, lab, t0) in enumerate(items):
        a = smooth((t - t0 + 0.15) / 0.35)
        if a <= 0.01:
            continue
        x = 110 + i * 590
        y = 300 - 30 * (1 - a)
        img = comp(k)
        if k == 'wrap':
            lift = smooth((t - cue('p3', 3) - 1.6) / 1.2)

            def fn(cc, lift=lift):
                K.draw_plate(cc, 'g_arm.png'); CU.gauze_and_stain(cc, 0); CU.bandage(cc, 1.0)
                CU.glove(cc, dy=-260 * lift, a=1 - lift)
            img = K.offscreen(fn)
        else:
            b = CU.beat(t, 118)

            def fn(cc, k=k, b=b):
                K.draw_plate(cc, 'g_arm.png')
                if k == 'dressing':
                    CU.gauze_and_stain(cc, 0, dy=3 * b)
                CU.glove(cc, dy=3 * b)
            img = K.offscreen(fn)
        K.pic(c, None, (geo.X(560), geo.Y(275), 900), x, y, 520, 330, a, img=img)
        K.text(c, f'{i + 1}', x + 30, y + 400, 52, K.YELLOW, a)
        K.text(c, lab, x + 80, y + 398, 44, K.WHITE, a, face=K.XB)
    K.hw(c, 'keeps pressing after you let go', 1290, 830, 42, K.YELLOW, t, cue('p3', 3) + 2.2, 1.6, a=win(t, cue('p3', 3) + 2.2, end('p3') + 1))


def sounds():
    K.snd('pat', cue('p1', 2) + 0.4, 0.5)
    K.snd('pat', cue('p1', 1), 0.35)
    K.snd('shimmer', cue('p2', 2), 0.35)
    K.snd('wrong', cue('p2', 3), 0.35)
    K.snd('pat', cue('p2', 4), 0.45)
    K.snd('check', cue('p2', 4) + 1.0, 0.35)
    for k in (1, 2, 3):
        K.snd('pat', cue('p3', k), 0.4)


SHOTS = [dict(t0=cue('p1') - 0.3, t1=cue('p3') - 0.3, fn=p1p2, fin=0.4),
         dict(t0=cue('p3') - 0.3, t1=end('p3') + 0.6, fn=p3, fin=0.4)]
