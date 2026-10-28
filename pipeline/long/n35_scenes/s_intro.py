"""Chapter 0 (hook, promise, why): close up of the cut forearm under her hand, the garage wide, the lens into the arm."""
import sys, math
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, ease
import closeup as CU, diag as DG, wide as WD
import geo

LIQ = '/home/claude/n35/liq/'
T_CUT = cue('hook', 3) - 0.35          # close up -> wide
T_LENS = cue('why', 1) - 2.6           # lens opens a beat before "used to be the last resort"
T_LCLOSE = cue('why', 4) - 0.2
T_END = 59.0

WD.PRESS.append((0.0, 62.0)); WD.GAUZE.append((0.0, 62.0))
WD.WINCES.extend([0.9, 4.2, 11.9, 16.2, 24.6, 31.0, 44.0, 52.0])

_liq = {}


def liq(name, t0):
    if name not in _liq:
        _liq[name] = K.Liq(LIQ + name, t0)
    return _liq[name]


def hook_cu(c, t):
    """Frame zero: arterial blood forced out past both edges of the gauze on every beat; the stain grows."""
    z = 1.0 + 0.06 * smooth(t / 11.0)
    cam = (geo.X(560), geo.Y(270), z)
    K.draw_plate(c, 'g_arm.png', cam)
    K.push_cam(c, cam)
    b = CU.beat(t, 118)
    liq('hook_cu', 0.0).draw(c, t)
    beats = t * 118 / 60
    CU.gauze_and_stain(c, 34 + 62 * clamp(beats / 18) + 4 * b, dy=3 * b)
    CU.glove(c, dy=3 * b)
    c.restore()
    K.chip(c, 'bright red, pumping', 560, 220, K.CORAL, win(t, cue('hook', 2) + 0.2, T_CUT - 0.3), 40, anchor=tuple(K.w2s(cam, geo.P(470, 246))), t=t, t0=cue('hook', 2) + 0.2)


def wide_extra(t0):
    L = liq('wide', t0)

    def ex(c, t, wnd, layer):
        L.draw(c, t, clip_y=-1e5, below=(layer == 'mid'))
    return ex


def cam_wide(t):
    wnd = WD.garage().wound_now
    base = (1020.0, 590.0, 1.06)
    near = (wnd[0] + 40, wnd[1] - 20, 1.45)
    hands = (wnd[0] - 10, wnd[1] - 10, 1.85)
    u = smooth((t - T_CUT) / 1.8)               # pull back from the close up framing
    cam = K.cam_lerp(near, base, u)
    v = smooth((t - cue('hook', 4)) / 1.6) * (1 - smooth((t - cue('promise') + 0.2) / 1.4))
    cam = K.cam_lerp(cam, hands, v)
    w = smooth((t - cue('promise') - 0.3) / 1.5) * (1 - smooth((t - cue('why') - 1.0) / 1.5))
    cam = K.cam_lerp(cam, (1270.0, 600.0, 1.12), w)      # the pair on the left, the promise on the right
    return cam


def wide_scene(t):
    def fn(c):
        WD.garage().draw(c, t, (T_CUT - 0.5, T_END + 0.5), cam_wide(t), wide_extra(T_CUT - 0.4))
    return fn


PROMISES = [('Press', 'hook', None, 'promise', 0), ('Tourniquet right away', 'promise', 1, None, 0),
            ('Where it goes, how tight', 'promise', 2, None, 0), ('When you pack a wound', 'promise', 3, None, 0)]


def promise_chips(c, t):
    t_out = cue('why') + 0.4
    starts = [cue('promise') + 1.0, cue('promise', 1), cue('promise', 2), cue('promise', 3)]
    cols = [K.TEAL, K.CORAL, K.YELLOW, K.LILAC]
    for i, (s, t0) in enumerate(zip(['Which bleeds you just press', 'Which get a tourniquet right away', 'Where it goes, how tight',
                                      'When you pack a wound'], starts)):
        a = smooth((t - t0) / 0.3) * (1 - smooth((t - t_out - i * 0.06) / 0.3))
        if a <= 0.01:
            continue
        y = 300 + i * 120
        K.card(c, 1150, y - 62, 700, 96, a, r=48, border=cols[i])
        K.text(c, f'{i + 1}', 1196, y + 4, 42, cols[i], a)
        K.text(c, s, 1240, y + 2, 38, K.WHITE, a, face=K.XB)


def why_diag(t):
    L = DG.Long(t0=T_LENS) if not hasattr(why_diag, 'L') else why_diag.L
    why_diag.L = L
    t_strap = cue('why', 2) + 0.6
    strap = smooth((t - t_strap) / 1.6)
    L.a_fn = lambda tt: -120 * (0.55 + 0.9 * DG.beat_(tt)) * (1 - smooth((tt - t_strap - 0.9) / 0.8))
    L.v_fn = lambda tt: 55.0 * (1 - smooth((tt - t_strap - 0.2) / 0.6))

    def fn(c):
        leak = 1 - smooth((t - t_strap - 1.0) / 0.8)
        L.draw(c, t, strap=strap, strap_on=smooth((t - t_strap + 0.4) / 0.4), tear=1.0, leak=leak)
        K.vignette(c, 0.25)
        a1 = smooth((t - cue('why', 1)) / 0.3)
        K.hw_rich(c, [('Old thinking: ', K.DINK), ('tourniquet = last resort', K.DRED)], 150, 210, 62, t, cue('why', 1), 1.4)
        K.hw(c, 'because people thought it cost the limb', 150, 290, 44, K.DINK, t, cue('why', 1) + 1.8, 1.4, shadow=False)
        st = smooth((t - cue('why', 2)) / 0.5)
        if st > 0:
            f = K.font(K.KALAM, 62); w = f.measureText('Old thinking: tourniquet = last resort')
            c.drawLine(140, 192, 140 + (w + 20) * st, 196, skia.Paint(AntiAlias=True, Color=K.col(K.DINK, 230), StrokeWidth=7, StrokeCap=skia.Paint.kRound_Cap))
        K.hw_rich(c, [('Now: ', K.DINK), ('on right, ', K.DGREEN), ('limb almost always fine', K.DGREEN)], 470, 900, 60, t,
                  cue('why', 2) + 2.6, 1.6)
        ca = smooth((t - cue('why', 3)) / 0.3)
        if ca > 0.01:
            K.clock(c, 1620, 860, 70, ((t - cue('why', 3)) / 3.0) % 1.0, K.CORAL, ca)
            K.hw(c, 'waiting kills', 1490, 1010, 56, K.DRED, t, cue('why', 3) + 0.2, 0.8, shadow=False)
        # label the strap and the vessels once
        sp = K.w2s(DG.CAM_LONG, (DG.STRAP_X, DG.SKIN_TOP(DG.STRAP_X)))
        K.chip(c, 'tourniquet', sp[0], sp[1] - 70, K.YELLOW, smooth((t - t_strap) / 0.3), 36)
    return fn


def why(c, t):
    k = K.lens(c, t, wide_scene(t), why_diag(t), K.w2s(cam_wide(t), WD.garage().wound_now), T_LENS, T_LCLOSE,
               inset_focus=K.w2s(cam_wide(t), WD.garage().wound_now))
    a = smooth((t - T_LCLOSE - 1.0) / 0.4) * (1 - smooth((t - T_END + 0.4) / 0.3))
    if a > 0.01:
        K.card(c, 330, 860, 1260, 110, a, r=55, border=K.CORAL)
        K.text(c, 'Life threatening arm or leg bleed', 380, 932, 44, K.WHITE, a, face=K.XB)
        K.text(c, 'tourniquet NOW', 1180, 932, 48, K.CORAL, a)


def wide_hook(c, t):
    if t >= T_LENS - 0.1:
        why(c, t)
    else:
        wide_scene(t)(c)
    promise_chips(c, t)


def sounds():
    K.snd('heartbeat_real' if False else 'pat', 0.05, 0.0)
    K.snd('swish', T_CUT, 0.4)
    K.snd('swish', T_LENS, 0.5)
    K.snd('swish', T_LCLOSE, 0.45)
    for i, t0 in enumerate([cue('promise') + 1.0, cue('promise', 1), cue('promise', 2), cue('promise', 3)]):
        K.snd('pat', t0, 0.4)
    K.snd('check', cue('why', 2) + 2.6, 0.35)
    K.snd('pat', T_LCLOSE + 1.0, 0.45)


SHOTS = [dict(t0=0.0, t1=T_CUT + 0.4, fn=hook_cu, fin=0.0),
         dict(t0=T_CUT, t1=T_END, fn=wide_hook, fin=0.4)]
