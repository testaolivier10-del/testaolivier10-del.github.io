"""The story beats of AP Physics 1 01, at the school track (world.py). Staging (2026-11-05 rule, nobody turns on screen):
the track runs left to right and Leo always RUNS to the right. At the finish, Ana stands on the infield edge left of the
gate and always faces right; after a run Leo slows down out of frame to the right and walks back in facing left, so in
every two shot Ana (left) and Leo (right) already face each other. At the start Leo faces right, toward the gates."""
import math
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, pill, chip, AMBER, CORAL, TEAL, YELLOW, GREEN, CREAM, INK2, NAVY
import mk as M
from mk import mdraw, mw
import world as WD
import cast as CA
import people as PE
from base import cue, wt, fin, ua, talking, check, cross
import base as B

FIN = WD.FINISH
CAMF = FIN + 300                 # the finish two shot: gate at screen 660
ANA_X, ANA_G, ANA_S = FIN - 420, 762, 0.92
LEO_X = FIN + 760                # where Leo stands after walking back
DISP_X, DISP_Y = FIN + 250, 470


def sx_f(X, camx=CAMF):
    return X - camx + W / 2


# ------------------------------------------------------------------ small drawing helpers
def panel(c, x0, y0, x1, y1, a=1.0, col=(16, 18, 38)):
    if a > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 26, 26), P(col, 246 * a))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), 26, 26), SP((90, 100, 160), 3, 200 * a))


def calc_small(c, x, y, s=1.0, a=1.0, ang=0.0):
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-26, -40, 26, 40), 7, 7), P((52, 58, 86), 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-20, -34, 20, -16), 3, 3), P((190, 214, 178), 255 * a))
    for i in range(9):
        c.drawCircle(-14 + (i % 3) * 14, -4 + (i // 3) * 13, 4.5, P((140, 148, 180), 255 * a))
    c.restore()


def phone_screen(c, cx, cy, s, a, val='30', unit='km/h', top='TOP SPEED'):
    """the running app on Leo's phone, big enough to read"""
    if a <= 0.01:
        return
    c.save(); c.translate(cx, cy); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-150, -270, 150, 270), 38, 38), P((24, 26, 34), 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-134, -252, 134, 252), 28, 28), P((22, 40, 72), 255 * a))
    c.drawArc(skia.Rect(-100, -150, 100, 50), 150, 240, False, SP((60, 80, 120), 18, 255 * a))
    u = min(1.0, float(val) / 30.0) if val.replace('.', '').isdigit() else 1.0
    c.drawArc(skia.Rect(-100, -150, 100, 50), 150, 240 * u, False, SP((255, 150, 60), 18, 255 * a))
    text(c, top, 0, -190, 26, INK2, a, 'semi', 'center')
    text(c, val, 0, -24, 96, CREAM, a, 'xb', 'center')
    text(c, unit, 0, 30, 38, (255, 170, 90), a, 'bold', 'center')
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-100, 110, 100, 170), 30, 30), P((255, 150, 60), 255 * a))
    text(c, 'NEW BEST', 0, 152, 28, NAVY, a, 'xb', 'center')
    c.restore()


def leo_phone_pose(t, x, raise_=1.0, mouth=0.0, smile=0.7, s=1.0):
    L, ps = PE.leo_stand(t, x, s=s, mouth=mouth, smile=smile, face=-1)
    if raise_ > 0:
        J = L.joints(ps)
        rest = L.canvas_pt(ps, J['hand_n'][0])
        tgt = (x - 130 * s, PE.GROUND - 470 * s)
        PE.ik(L, ps, (rest[0] + (tgt[0] - rest[0]) * raise_, rest[1] + (tgt[1] - rest[1]) * raise_))
        ps.hand_n = 'grip'
    return L, ps


def draw_phone_in_hand(c, L, ps, s=1.0, ang=-12):
    hx, hy = PE.hand_pt(L, ps, 'n', (10, 60))
    WD.phone(c, hx, hy - 10 * s, 1.15 * s, 1.0, ang)


def ana_pose(t, mouth=0.0, smile=0.4, brow=0.0, hold=None, look=0.3, neck=0.0):
    """Ana on the infield edge, facing right; hold: None, 'calc' (calculator up at chest), 'phone' (photo), 'pad'"""
    A, ps = PE.ana_stand(t, sx_f(ANA_X), s=ANA_S, ground=ANA_G, mouth=mouth, smile=smile, look=look, neck=neck, face=1)
    ps.brow = brow
    if hold in ('calc', 'pad'):
        tgt = (sx_f(ANA_X) + 70 * ANA_S, ANA_G - 300 * ANA_S)
        PE.ik(A, ps, tgt); ps.hand_n = 'grip'
        PE.ik(A, ps, (tgt[0] - 10, tgt[1] + 30), 'f'); ps.hand_f = 'flat'
        ps.neck = -10
    elif hold == 'phone':
        tgt = (sx_f(ANA_X) + 120 * ANA_S, ANA_G - 430 * ANA_S)
        PE.ik(A, ps, tgt); ps.hand_n = 'grip'
    return A, ps


def draw_ana(c, A, ps, hold=None, pu=1.0):
    A.draw(c, ps, world=True)
    if hold == 'calc':
        hx, hy = PE.hand_pt(A, ps, 'n', (0, 70))
        calc_small(c, hx, hy - 20, 1.3, 1.0, 15)
    elif hold == 'pad':
        hx, hy = PE.hand_pt(A, ps, 'n', (0, 70))
        c.save(); c.translate(hx, hy - 20); c.rotate(14)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-34, -48, 34, 48), 5, 5), P((250, 244, 220)))
        for j in range(5):
            c.drawLine(-24, -30 + j * 15, 24, -30 + j * 15, SP((150, 170, 210), 2))
        c.drawRect(skia.Rect(-34, -48, 34, -38), P((220, 80, 70)))
        c.restore()
    elif hold == 'phone':
        hx, hy = PE.hand_pt(A, ps, 'n', (10, 60))
        WD.phone(c, hx, hy - 6, 1.2, 1.0, 90 - 10)


def display_val(t, t_cross, final, t_go=None):
    """the timing display: counts while he runs, holds the final time once he breaks the finish beam"""
    if t_go is not None and t < t_go:
        return '0.000'
    if t >= t_cross:
        return f'{final:.3f}'
    v = max(0.0, final - (t_cross - t))
    return f'{v:.3f}'


def finish_scene(c, t, camx, cast_fn, gate_flash=0.0, disp='', disp_glow=0.0, gates=True):
    def props(c, sx):
        if gates:
            WD.gate(c, sx(FIN), t, gate_flash)
            if disp:
                WD.display(c, sx(DISP_X), DISP_Y, 0.9, disp, glow_=disp_glow)
                c.drawLine(sx(DISP_X), DISP_Y + 63, sx(DISP_X), 712, SP(WD.METAL_D, 10))
        WD.sign(c, sx(FIN) - 170, 'FINISH')
        # the white finish line across the lanes
        x = sx(FIN)
        c.drawLine(x + 34, 758, x - 26, 918, SP((250, 246, 240), 9, 230))

    def front(c, sx):
        if gates:
            WD.gate_near(c, sx(FIN))
    WD.track(c, t, camx, cast=cast_fn, front=front, props=props)


# ------------------------------------------------------------------ Leo's runs (shared by the first and second run)
def _vfun(t_go, ramp=1.2, top=8.0):
    return lambda t: 0.0 if t < t_go else top * min(1.0, (t - t_go) / ramp) ** 0.8


_SPR = {}


def sprint(key, t0, x0, vfun, t1, s=1.0):
    if key not in _SPR:
        _SPR[key] = PE.Sprint(CA.leo(), s, t0, x0, vfun, t1)
    return _SPR[key]


def finish_run(c, t, t_enter, t_cross_want, final, walk_back_t, back_from, leo_mouth=None, ana_kw=None, panel_fn=None):
    """the finish shot of a run: Leo flies in from the left at 8 m/s, breaks the beam at t_cross_want, runs out right;
    later walks back in facing left and stops at LEO_X. Ana watches from the left."""
    key = ('fin', round(t_cross_want, 3))
    # place the run so he reaches the finish line exactly at t_cross_want
    x_enter = FIN - 8.0 * WD.PXM * (t_cross_want - t_enter)
    sp = sprint(key, t_enter - 3.0, x_enter - 8.0 * WD.PXM * 3.0, lambda tt: 8.0, t_enter + 6.0)
    X = sp._at(sp.X, t)
    camx = min(CAMF, X + 200) if t < t_cross_want + 3 else CAMF
    flash = ua(t, t_cross_want - 0.05, 0.06) * (1 - ua(t, t_cross_want + 0.15, 0.35))
    disp = display_val(t, t_cross_want, final)
    glow_ = ua(t, t_cross_want, 0.1) * (1 - ua(t, t_cross_want + 2.0, 1.0)) + 0.3

    def cast_fn(c, sx):
        akw = dict(ana_kw or {})
        hold = akw.pop('hold', None)
        A, aps = ana_pose(t, hold=hold, **akw)
        aps.x = sx(ANA_X)
        # Leo
        if t < walk_back_t:
            if X < camx + W / 2 + 300:
                ps, _ = sp.pose(t)
                ps.x = sx(ps.x)
                CA.leo().draw(c, ps, world=True)
        else:
            Lw = CA.leo()
            dur = 2.6
            u = min(1.0, (t - walk_back_t) / dur)
            if u < 1.0:
                ph = (t - walk_back_t) * 1.15
                x0 = back_from
                ps, x = PE.walk_pose(Lw, 1.0, ph, x0, face=-1)
                # ease into the stop: blend to standing over the last 0.5 s
                if x <= LEO_X:
                    ps, x = None, LEO_X
            else:
                ps = None
            if ps is None:
                Lw, ps = PE.leo_stand(t, sx(LEO_X), mouth=leo_mouth(t) if leo_mouth else 0.0, face=-1, lean=4)
            else:
                ps.x = sx(ps.x)
            Lw.draw(c, ps, world=True)
        draw_ana(c, A, aps, hold)

    finish_scene(c, t, camx, cast_fn, flash, disp, glow_)
    return camx


def walkback_start(t_cross):
    """walk back begins 2.2 s after the crossing from just off the right edge; returns (t, world x)"""
    return t_cross + 2.4, CAMF + W / 2 + 140


def leo_back_x_time(walk_back_t, back_from):
    """when the walk back reaches LEO_X (for planning)"""
    return walk_back_t + (back_from - LEO_X) / (PE.walk_pose(CA.leo(), 1.0, 1.0, 0, face=1)[1] * 1.15)


# ================================================================== beats
def hook(c, t):
    k = 'hook'
    c2, c3, c4 = cue(k, 2), cue(k, 3), cue(k, 4)
    tag = wt(k, 'says')
    # one move: close on the phone in Leo's raised hand, pull out to the two shot, then a slow push
    u = sm((t - 2.6) / 2.6)
    z = 2.3 + (1.0 - 2.3) * u
    z *= 1 + 0.05 * sm((t - c3) / 10)
    Lx = sx_f(LEO_X)
    fx = (Lx - 160) + (W / 2 - 40 - (Lx - 160)) * u; fy = 470 + (560 - 470) * u
    talk_l = talking(t, k, wt(k, 'so'), None) * 0 + 0.0

    def cast_fn(c, sx):
        A, aps = ana_pose(t, smile=0.35 - 0.25 * ua(t, c3, 0.4) + 0.7 * ua(t, wt(k, 'admit'), 0.4),
                          brow=ua(t, c3, 0.4) * (1 - ua(t, c4 + 1.5, 0.6)), look=0.4)
        # the measuring wheel rests by Ana's far hand
        hp = PE.hand_pt(A, aps, 'f', (0, 60))
        WD.wheel(c, sx(ANA_X) + 120, ANA_G, 0.0, 1.0, (hp[0] + 6, hp[1] + 6), 'x')
        draw_ana(c, A, aps)
        r = 1.0 - ua(t, c3 + 0.4, 0.7) * 0.6
        L, ps = leo_phone_pose(t, sx(LEO_X), raise_=r, smile=0.9 - 0.4 * ua(t, c3, 0.5) + 0.5 * ua(t, wt(k, 'really'), 0.4))
        ps.look = 0.4
        L.draw(c, ps, world=True)
        draw_phone_in_hand(c, L, ps)

    c.save(); WD.camera(c, z, fx, fy)
    finish_scene(c, t, CAMF, cast_fn, gates=False)
    c.restore()
    WD.finish(c, t)
    # the app screen: big first (the key object), then it shrinks to a bubble by Leo while the camera pulls out
    a = 1.0 - ua(t, c3 + 0.5, 0.5)
    if a > 0.01:
        v = min(30.0, 30.0 * sm((t - 0.3) / 1.6))
        val = f'{v:.0f}'
        s_ = 1.25 - 0.62 * u
        cx = W / 2 + (1170 - W / 2) * u
        cy = H / 2 + (330 - H / 2) * u
        phone_screen(c, cx, cy, s_, a, val)
    for i, (w_, s_, col) in enumerate((('one', 'one run', TEAL), ('measuring', 'a measuring wheel', AMBER),
                                       ('timer', 'a laser timer', CORAL))):
        tt = wt(k, w_, after=c4)
        a = ua(t, tt - 0.1, 0.35)
        if a > 0:
            wdt = K.width(s_, 46, 'xb') + 44
            chip(c, s_, 300 + i * 0 - wdt / 2 + 660 * i - 120 * i, 90, col, 46, a, 0.85 + 0.15 * a)
    pill(c, 'deal?', W / 2, 250, YELLOW, 40, ua(t, wt(k, 'deal'), 0.3) * (1 - ua(t, wt(k, 'one', after=c4) - 0.2, 0.3)))


def u6(c, t):
    k = 'u6'
    c1, c2, c3, c4 = cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    A = CA.ana()
    if t < c3 - 0.05:
        # shot A: Ana walks the straight pushing the measuring wheel; the counter clicks up to 100.0 m (time lapse)
        t0 = c1 - 0.4
        ph = max(0.0, t - t0) * 1.0
        ps, X = PE.walk_pose(A, 1.0, ph, 200.0, face=1)
        camx = X + 220
        dist = 100.0 * sm((t - (c1 + 1.5)) / (wt(k, 'meters') - (c1 + 1.5))) ** 1.3

        def cast_fn(c, sx):
            ps.x = sx(X)
            J = A.joints(ps)
            wx = sx(X) + 300
            hp = (sx(X) + 150, PE.GROUND - 300)
            PE.ik(A, ps, hp); ps.hand_n = 'grip'
            ps.uarm_f = 12; ps.elbow_f = 70; ps.hand_f = 'relaxed'
            ang = (X / 64.0)
            A.draw(c, ps, world=True)
            hpt = PE.hand_pt(A, ps, 'n', (0, 50))
            WD.wheel(c, wx, PE.GROUND, ang, 1.0, hpt, 'x')
        def props(c, sx):
            # the start line where she began, and the white finish line once she gets there
            for xx in (0.0,):
                X0 = sx(xx); c.drawLine(X0 + 34, 758, X0 - 26, 918, SP((250, 246, 240), 9, 230))
        WD.track(c, t, camx, cast=cast_fn, props=props)
        WD.finish(c, t)
        a = ua(t, c1 + 1.0, 0.4)
        if a > 0:
            panel(c, 1380, 60, 1840, 260, a)
            text(c, 'measuring wheel', 1610, 118, 40, INK2, a, 'semi', 'center')
            text(c, f'{dist:5.1f} m', 1610, 220, 84, YELLOW if dist >= 99.95 else CREAM, a, 'xb', 'center')
    else:
        # shot B: the start gate, the plan of the run across the top
        camx = 0.0

        def props(c, sx):
            on = ua(t, wt(k, 'start', after=c3), 0.4)
            WD.gate(c, sx(0.0), t, 0.0, a=ua(t, wt(k, 'laser') - 0.2, 0.5))
            WD.sign(c, sx(0.0) - 170, 'START')
            if on < 1:
                pass
            X0 = sx(0.0); c.drawLine(X0 + 34, 758, X0 - 26, 918, SP((250, 246, 240), 9, 230))

        def cast_fn(c, sx):
            L, ps = PE.leo_stand(t, sx(-700.0), face=1, lean=6, mouth=0.0, smile=0.6)
            L.draw(c, ps, world=True)

        def front(c, sx):
            WD.gate_near(c, sx(0.0), a=ua(t, wt(k, 'laser') - 0.2, 0.5))
        WD.track(c, t, camx, cast=cast_fn, front=front, props=props)
        WD.finish(c, t)
        # the plan: a strip map of the straight with both gates
        a = ua(t, wt(k, 'one', after=c3) - 0.2, 0.4)
        if a > 0:
            panel(c, 600, 40, 1880, 290, a)
            y = 190
            c.drawLine(720, y, 1760, y, SP((198, 92, 70), 22, 255 * a))
            for xx, lab, tt in ((740, 'START', wt(k, 'start', after=c3)), (1740, 'FINISH', wt(k, 'finish'))):
                aa = ua(t, tt - 0.1, 0.3) * a
                c.drawLine(xx, y - 40, xx, y + 40, SP(WD.LASER, 6, 255 * aa))
                text(c, lab, xx, y - 56, 36, CREAM, aa, 'xb', 'center')
            text(c, '100.0 m', 1240, y - 30, 38, YELLOW, a, 'xb', 'center')
            # what the clock does
            s1 = ua(t, wt(k, 'starts') - 0.1, 0.3); s2 = ua(t, wt(k, 'stops') - 0.1, 0.3)
            text(c, 'clock starts', 780, y + 84, 40, GREEN, s1 * a, 'bold', 'center')
            text(c, 'clock stops', 1700, y + 84, 40, CORAL, s2 * a, 'bold', 'center')
            if s1 > 0 and s2 < 1:
                xx = 740 + (1740 - 740) * sm((t - wt(k, 'starts')) / (wt(k, 'stops') - wt(k, 'starts')))
                c.drawCircle(xx, y, 14, P((47, 99, 200), 255 * a))
        if t > c4 - 0.2:
            v = '0.000'
            WD.display(c, 1240, 420, 0.8, v, ua(t, c4 - 0.2, 0.4), glow_=0.4, pole=False)


def c7(c, t):
    k = 'c7'
    c1, c2, c3, c4, c5 = (cue(k, i) for i in range(1, 6))
    if t < c3 - 0.1:
        # the start: Leo backs way up, then takes off and breaks the first beam already flying
        L = CA.leo()
        t_go = wt(k, 'off') - 0.25
        t_beam = wt(k, 'beam') - 0.3
        # back up: walking backwards from -700 to -1700 px before the take off
        sp = sprint(('start1',), t_go, 0.0, _vfun(t_go), t_go + 6)
        x_at_beam = sp._at(sp.X, t_beam)
        x_start = -x_at_beam              # so that he reaches the gate (x = 0) at t_beam
        if t < t_go:
            ph = -max(0.0, min(t, c1 + 3.4) - (c1 + 0.2)) * 1.0
            ps, X = PE.walk_pose(L, 1.0, ph, x_start + 1000 * 0.0 + 0, face=1)
            # walk_pose moves backward for negative phase; it ends at x_start
            X_end = PE.walk_pose(L, 1.0, -3.2, 0, face=1)[1]
            ps, X = PE.walk_pose(L, 1.0, ph, x_start - X_end, face=1)
            ps.lean = 3; ps.mouth = 0.0
        else:
            ps, X = sp.pose(t)
            ps.x = X = X + x_start
        camx = X + 260
        fl = ua(t, t_beam - 0.05, 0.06) * (1 - ua(t, t_beam + 0.15, 0.35))

        def props(c, sx):
            WD.gate(c, sx(0.0), t, fl)
            WD.sign(c, sx(0.0) - 170, 'START')
            X0 = sx(0.0); c.drawLine(X0 + 34, 758, X0 - 26, 918, SP((250, 246, 240), 9, 230))

        def cast_fn(c, sx):
            ps.x = sx(X)
            L.draw(c, ps, world=True)

        def front(c, sx):
            WD.gate_near(c, sx(0.0))
        WD.track(c, t, camx, cast=cast_fn, front=front, props=props)
        WD.finish(c, t)
        a = ua(t, wt(k, 'running') - 0.1, 0.4) * (1 - ua(t, t_go, 0.4))
        pill(c, 'running start', W / 2, 140, AMBER, 40, a)
        WD.display(c, 1700, 120, 0.6, display_val(t, 1e9, 12.431, t_beam) if t >= t_beam else '0.000', ua(t, t_beam - 1.5, 0.4), glow_=0.3, pole=False)
    else:
        t_cross = wt(k, 'second') + 0.15
        wb, bx = walkback_start(t_cross)

        def mouth(tt):
            return 0.0
        finish_run(c, t, c3 - 0.1, t_cross, 12.431, wb, bx, ana_kw=dict(hold='calc' if t > c4 - 0.5 else None,
                                                                          smile=0.5, look=0.3))
        WD.finish(c, t)
        a = ua(t, wt(k, 'divides') - 0.4, 0.4)
        if a > 0:
            panel(c, 330, 30, 1290, 270, a)
            text(c, 'speed = distance ÷ time', 810, 90, 34, INK2, a, 'semi', 'center')
            M.row(c, [dict(q=('100.0', 'm'), t0=wt(k, 'divides') + 0.1), dict(m='÷', t0=wt(k, 'by', after=c4)),
                      dict(q=('12.431', 's'), t0=wt(k, 'twelve', after=c4)), dict(m='=', t0=c5 - 0.3),
                      dict(q=('8.044', 'm/s'), t0=c5, col=YELLOW)], 810, 200, 66, t, 'center')
            pill(c, 'his AVERAGE speed between the gates', 810, 320, TEAL, 32, ua(t, wt(k, 'average'), 0.4))


def two_shot(c, t, leo_kw=None, ana_kw=None, disp='', leo_extra=None):
    """the finish two shot: Ana left facing right, Leo right facing left, the display between them"""
    def cast_fn(c, sx):
        akw = dict(ana_kw or {})
        hold = akw.pop('hold', None)
        A, aps = ana_pose(t, hold=hold, **akw)
        draw_ana(c, A, aps, hold)
        L, ps = PE.leo_stand(t, sx(LEO_X), face=-1, lean=4, **(leo_kw or {}))
        if leo_extra:
            leo_extra(L, ps)
        L.draw(c, ps, world=True)
    finish_scene(c, t, CAMF, cast_fn, 0.0, disp, 0.3)


def c8(c, t):
    k = 'c8'
    c1, c2, c3, c4 = (cue(k, i) for i in range(1, 5))
    sad = ua(t, c3 + 0.3, 0.6)
    two_shot(c, t, leo_kw=dict(mouth=talking(t, k, wt(k, 'he', after=c3), wt(k, 'run')) * 0, smile=0.4 - 1.3 * sad, neck=10 * sad,
                                brow=-0.6 * sad, look=-0.3),
             ana_kw=dict(hold='calc', smile=0.4, look=0.3), disp='12.431')
    WD.finish(c, t)
    a = ua(t, c1, 0.4) * (1 - ua(t, c4 - 0.3, 0.4))
    if a > 0:
        panel(c, 330, 30, 1290, 290, a)
        M.row(c, [dict(q=('8.044', 'm/s'), t0=c1 + 0.2), dict(m='×', t0=wt(k, 'times')), dict(m='3.6', t0=wt(k, 'three'), col=TEAL),
                  dict(m='=', t0=c2 - 0.2), dict(q=('28.96', 'km/h'), t0=c2 + 0.4, col=YELLOW)], 810, 140, 62, t, 'center')
        aa = ua(t, c3, 0.4) * a
        if aa > 0:
            mdraw(c, '28.96 km/h  <  30 km/h', 810, 250, 60, CORAL, aa, align='center')
    # the calculator showed more digits than she wrote down
    a = ua(t, c4, 0.4)
    if a > 0:
        panel(c, 330, 40, 1290, 330, a)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(380, 80, 1240, 220), 18, 18), P((190, 214, 178), 255 * a))
        f = K.font('xb', 96); s1, s2 = '8.044', '405116'
        w1, w2 = f.measureText(s1), f.measureText(s2)
        x0 = 810 - (w1 + w2) / 2
        c.drawString(s1, x0, 186, f, P((40, 56, 40), 255 * a))
        c.drawString(s2, x0 + w1, 186, f, P((40, 56, 40), 255 * a * (1 - 0.55 * ua(t, wt(k, 'wrote'), 0.4))))
        text(c, 'what she wrote: 8.044', 810, 290, 38, AMBER, ua(t, wt(k, 'wrote'), 0.4), 'semi', 'center')


def g7(c, t):
    k = 'g7'
    c1, c2, c3, c4 = (cue(k, i) for i in range(1, 5))
    if t < c3 - 0.1:
        # Ana alone at the finish with her notepad; Leo has gone back to the start
        def cast_fn(c, sx):
            A, aps = ana_pose(t, smile=0.4, hold='pad')
            draw_ana(c, A, aps, 'pad')
        finish_scene(c, t, CAMF, cast_fn, 0.0, '12.431', 0.3)
        WD.finish(c, t)
        a = ua(t, c1 - 0.2, 0.4)
        panel(c, 480, 40, 1440, 330, a, (250, 246, 230))
        if a > 0:
            ink = (40, 44, 70)
            mdraw(c, '100.0 m', 560, 120, 64, ink, ua(t, c1, 0.6), a)
            mdraw(c, '4 sig figs', 1000, 120, 56, (40, 120, 90), ua(t, wt(k, 'four'), 0.5), a)
            mdraw(c, '12.431 s', 560, 200, 64, ink, ua(t, wt(k, 'twelve'), 0.6), a)
            mdraw(c, '5 sig figs', 1000, 200, 56, (40, 120, 90), ua(t, wt(k, 'five'), 0.5), a)
            mdraw(c, '→ 8.044 m/s', 560, 290, 64, (200, 60, 50), ua(t, wt(k, 'eight') - 0.2, 0.6), a)
            mdraw(c, '4 (the fewest)', 1000, 290, 56, (40, 120, 90), ua(t, wt(k, 'four', after=c2), 0.5), a)
    elif t < c4 - 0.1:
        # the start: Leo is back, bouncing on his toes, ready
        def props(c, sx):
            WD.gate(c, sx(0.0), t, 0.0)
            WD.sign(c, sx(0.0) - 170, 'START')
            X0 = sx(0.0); c.drawLine(X0 + 34, 758, X0 - 26, 918, SP((250, 246, 240), 9, 230))

        def cast_fn(c, sx):
            L, ps = PE.leo_stand(t, sx(-900.0), face=1, lean=8, smile=0.8, look=0.3)
            b = abs(math.sin(t * 5.0))
            ps.ground -= 14 * b
            ps.uarm_n = 10 + 12 * b; ps.elbow_n = 70; ps.uarm_f = -10; ps.elbow_f = 70; ps.hand_n = ps.hand_f = 'fist'
            L.draw(c, ps, world=True)

        def front(c, sx):
            WD.gate_near(c, sx(0.0))
        WD.track(c, t, -400.0, cast=cast_fn, front=front, props=props)
        WD.finish(c, t)
        pill(c, 'second run', W / 2, 140, AMBER, 40, ua(t, wt(k, 'start', after=c3), 0.4))
    else:
        t_cross = wt(k, 'beams') + 0.2
        wb, bx = walkback_start(t_cross)
        finish_run(c, t, c4 - 0.1, t_cross, 11.998, wb, bx, ana_kw=dict(smile=0.6, look=0.3))
        WD.finish(c, t)


def g8(c, t):
    k = 'g8'
    c1, c2, c3, c4 = (cue(k, i) for i in range(1, 5))
    t_cross = wt('g7', 'beams') + 0.2
    wb, bx = walkback_start(t_cross)
    win = ua(t, wt(k, 'just') - 0.1, 0.4)
    if t < wb + 3.0:
        finish_run(c, t, cue('g7', 4) - 0.1, t_cross, 11.998, wb, bx, ana_kw=dict(hold='calc', smile=0.4, look=0.3))
    else:
        def arms(L, ps):
            if win > 0:
                ps.uarm_n = -4 + 178 * win; ps.elbow_n = 18 - 12 * win; ps.uarm_f = -6 + 160 * win; ps.elbow_f = 16 - 6 * win
                ps.hand_n = ps.hand_f = 'fist'
                ps.ground -= 26 * abs(math.sin((t - wt(k, 'just')) * 6)) * win * (1 - ua(t, wt(k, 'that') + 0.8, 0.6))
        two_shot(c, t, leo_kw=dict(smile=0.3 + 0.9 * win, mouth=0.5 * win * (1 - ua(t, wt(k, 'coin'), 0.5)), look=-0.2),
                 ana_kw=dict(hold='calc', smile=0.4 + 0.5 * ua(t, c4 + 1.0, 0.5), look=0.3), disp='11.998', leo_extra=arms)
    WD.finish(c, t)
    a = ua(t, c1 + 1.2, 0.4)
    if a > 0:
        panel(c, 330, 24, 1290, 330, a)
        early = ua(t, c3 - 0.2, 0.5)
        y1 = 120
        mdraw(c, '8.33', 380, y1, 62, CREAM, ua(t, wt(k, 'eight') - 0.1, 0.5), a)
        text(c, 'rounded too early', 380, y1 + 50, 40, CORAL, ua(t, wt(k, 'early', after=c1 + 2), 0.4) * a, 'semi')
        mdraw(c, '× 3.6 = 29.99 km/h', 530, y1, 62, CREAM, ua(t, wt(k, 'times') - 0.1, 0.9), a)
        M.strike(c, 370, 1140, y1 - 22, ua(t, c3 - 0.3, 0.35), a)
        if early > 0:
            y2 = 240
            mdraw(c, '100.0 ÷ 11.998 = 8.334722…', 380, y2, 54, CREAM, ua(t, wt(k, 'keep') - 0.1, 0.9), a)
            mdraw(c, '× 3.6 = 30.005… → 30.01 km/h', 380, y2 + 66, 54, YELLOW, ua(t, c4 - 0.1, 1.2), a)
            M.underline(c, 1010, 1270, y2 + 82, ua(t, wt(k, 'thirty', after=c4) + 0.6, 0.5), AMBER, a)
    pill(c, 'photo finish', 810, 390, AMBER, 40, ua(t, wt(k, 'photo'), 0.4) * (1 - ua(t, fin(k) + 0.2, 0.3)))


def end(c, t):
    k = 'end'
    c1, c2, c3, c4 = (cue(k, i) for i in range(1, 5))
    snap = wt(k, 'snaps')
    ph = ua(t, snap - 0.5, 0.5)
    two_shot(c, t, leo_kw=dict(mouth=talking(t, k, c1, wt(k, 'chat') + 0.4) * 0.0, smile=0.9, look=-0.3),
             ana_kw=dict(hold='phone' if ph > 0.5 else None, smile=0.6, look=0.5), disp='11.998')
    fl = ua(t, wt(k, 'photo'), 0.05) * (1 - ua(t, wt(k, 'photo') + 0.1, 0.3))
    if fl > 0:
        c.drawRect(skia.Rect(0, 0, W, H), P((255, 255, 255), 120 * fl))
    WD.finish(c, t)
    # the text she sends, before the end screen time; then it tucks into the corner of the top band
    tb = B.Bt['__DUR'] - 20.0
    a = ua(t, wt(k, 'sends'), 0.3)
    if a > 0:
        u = ua(t, tb - 0.4, 0.6)
        cx = 1260 + (1660 - 1260) * u; cy = 300 + (160 - 300) * u; s_ = 1.0 - 0.35 * u
        a2 = a * (1 - ua(t, c3 + 0.4, 0.4))
        if a2 > 0:
            c.save(); c.translate(cx, cy); c.scale(s_, s_)
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-200, -70, 200, 70), 34, 34), P((60, 130, 250), 255 * a2))
            text(c, '30.01 km/h', 0, 22, 60, (255, 255, 255), a2, 'xb', 'center')
            text(c, 'sent to: team chat', 0, -84, 26, CREAM, a2, 'semi', 'center')
            c.restore()
    a = ua(t, tb, 0.5)
    if a > 0:
        c.drawRect(skia.Rect(0, 0, W, 330), P((10, 14, 30), 170 * a))
        text(c, 'levlprep.com', W / 2, 150, 84, CREAM, a, 'xb', 'center')
        text(c, 'free notes and practice for this topic', W / 2, 220, 40, INK2, a, 'semi', 'center')
        pill(c, 'next: scalars and vectors', W / 2, 290, AMBER, 40, ua(t, c4, 0.4))


STORY = dict(hook=hook, u6=u6, c7=c7, c8=c8, g7=g7, g8=g8, end=end)
