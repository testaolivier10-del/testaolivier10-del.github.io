"""Chapters 9 to 11: Recap in one picture, Practice problems, Next video."""
import sys, math, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, col
import closeup as CU, diag as DG, wide as WD
import geo

WD.TQ_ON.append((cue('end') - 1.0, K.TOT + 1)); WD.GAUZE.append((cue('end') - 1.0, K.TOT + 1))


@functools.lru_cache(maxsize=None)
def still(kind):
    def fn(c):
        if kind == 'wrap':
            K.draw_plate(c, 'g_arm.png'); CU.gauze_and_stain(c, 0); CU.bandage(c, 1.0)
        elif kind == 'soaked':
            K.draw_plate(c, 'g_arm.png'); K.push_cam(c, (960, 540, 1.0)); CU.gauze_and_stain(c, 100)
            c.save(); c.translate(-14, -14); c.rotate(-3); CU.gauze_and_stain(c, 0); c.restore(); CU.glove(c, dy=-4); c.restore()
        elif kind == 'tq':
            K.draw_plate(c, 'g_arm.png'); CU.gauze_and_stain(c, 60); CU.tourniquet(c, CU.TQX, twist=1.0, tag_text='6:42 PM', t=1, t_tag=0, rod_angle=3.4)
        elif kind == 'pack':
            DG.cavity(c, 0.0, pack=1.0)
        elif kind == 'nose':
            import s_nose as N
            N.scene(c, N.PINCH + 2.5, N.cam_at(N.PINCH + 1.0))
        elif kind == 'thigh':
            DG.body(c)
            k = DG.BODY['knee_l']
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(k[0] - 60, k[1] - 140, k[0] + 56, k[1] - 108), 6, 6), skia.Paint(AntiAlias=True, Color=col((38, 41, 50))))
            c.drawRect(skia.Rect(k[0] - 60, k[1] - 120, k[0] + 56, k[1] - 108), skia.Paint(Color=col((22, 24, 30))))
            K.ring(c, DG.BODY['foot_l'], 26, K.TEAL, 1.0, 5)
        elif kind == 'groin':
            DG.body(c)
            g = DG.BODY['groin_r']
            c.drawOval(skia.Rect(g[0] - 16, g[1] + 10, g[0] + 8, g[1] + 22), skia.Paint(AntiAlias=True, Color=col((150, 10, 26))))
            K.ring(c, (g[0] - 4, g[1] + 16), 34, K.DRED, 1.0, 5)
        elif kind == 'narrow':
            L = DG.Long(t0=0.0)
            L.v_fn = lambda tt: 0.0
            L.draw(c, 3.0, strap=0.5, strap_on=1.0, tear=1.0, leak=1.0, swell=1.0)
    return K.offscreen(fn)


ROWS = [('wrap', (geo.X(560), geo.Y(285), 900), 'Small or slow: press, hold, wrap', K.TEAL),
        ('soaked', (geo.X(560), geo.Y(270), 760), 'Soaks through: leave it, do more', K.YELLOW),
        ('tq', (geo.X(600), geo.Y(285), 900), 'Arm or leg, bad enough to kill: TOURNIQUET first', K.CORAL),
        ('pack', (geo.X(512), geo.Y(270), 1100), 'Groin or armpit: pack it, press', K.LILAC),
        ('nose', None, 'Nosebleed: lean forward, pinch', K.GREEN)]


def recap(c, t):
    c.drawImage(K.calm_bg(), 0, 0)
    K.chip(c, 'RECAP', 960, 130, K.YELLOW, smooth((t - cue('rc') + 0.2) / 0.3), 40)
    for i, (kind, src, s, colr) in enumerate(ROWS):
        t0 = cue('rc', i + 1)
        a = smooth((t - t0 + 0.2) / 0.35)
        if a <= 0.01:
            continue
        y = 200 + i * 168
        if src is None:
            src = (960, 540, 1500)
        K.pic(c, None, src, 160, y, 250, 140, a, r=18, img=still(kind), border=colr)
        K.hw(c, s, 450, y + 92, 52, colr if i == 2 else K.WHITE, t, t0, 1.2)
        if i == 2:
            K.hw(c, '2 to 3 in above, never a joint, tight until bleeding stops + pulse gone', 450, y + 146, 34, K.WHITE, t, t0 + 2.5, 12.0)
            K.ring(c, (160 + 125, y + 70), 95, colr, win(t, t0 + 2.0, cue('rc', 4) - 0.2) * (0.6 + 0.4 * math.sin(t * 4)), 5)


PROB = {
    'x1': dict(q=['You held pressure on a forearm cut.', 'Blood starts soaking through your gauze.', 'Your partner reaches to peel it off', 'and put on a fresh one. What do you do?'],
               pic='soaked', src=(geo.X(560), geo.Y(270), 760),
               a=('STOP THEM. LEAVE IT ON.', K.GREEN), why=[('peeling it tears the clot that is forming', 1), ('press harder; still bleeding? tourniquet', 2)]),
    'x2': dict(q=['You tightened a tourniquet on a thigh.', 'The bleeding slowed but didn\'t stop,', 'and the foot still has a pulse. What\'s wrong?'],
               pic='thigh', src=(geo.X(530), geo.Y(425), 700),
               a=("IT ISN'T TIGHT ENOUGH", K.CORAL), why=[('veins shut, artery still open: blood keeps coming in', 1),
                                                         ('keep twisting: bleeding stops AND pulse gone', 2), ("won't go tighter? a second one above it", 3)]),
    'x3': dict(q=['A stab wound in the groin, and it\'s pouring.', 'Tourniquet, or pack it?'],
               pic='groin', src=(geo.X(505), geo.Y(330), 420),
               a=('PACK IT', K.LILAC), why=[('the groin is junctional: no limb to wrap', 1), ('gauze in, all the way down, packed tight, press hard', 2),
                                           ('the tourniquet has nowhere to go', 3)], pic2='pack', src2=(geo.X(512), geo.Y(270), 1100)),
}


def live(key, kind, t):
    """The problem picture, moving: the partner's hand reaching for the soaked gauze; the pulse still beating in the
    foot below the thigh tourniquet (it stops once the answer says keep twisting); the groin wound pouring; the gauze
    going in."""
    if key == 'x1':
        ka = cue('x1a')
        reach = 0.5 + 0.5 * math.sin((t - cue('x1q')) * 1.6) if t < ka else 1 - smooth((t - ka) / 0.8)

        def fn(c):
            K.draw_plate(c, 'g_arm.png'); K.push_cam(c, (960, 540, 1.0))
            b = CU.beat(t, 118)
            CU.gauze_and_stain(c, 100, dy=2 * b)
            if t >= cue('x1a', 2):
                c.save(); c.translate(-14, -14 - 100 * (1 - smooth((t - cue('x1a', 2)) / 0.6))); c.rotate(-3); CU.gauze_and_stain(c, 0); c.restore()
            CU.glove(c, dy=2 * b + 6 * smooth((t - cue('x1a', 2) - 0.6) / 0.4))
            # the partner's hand comes in from the left toward the gauze corner
            gx, gy = geo.P(565, 236)
            c.save(); c.translate(geo.X(470) - 260 * (1 - reach), geo.Y(300) + 40); c.scale(-0.8, 0.8); c.rotate(-20); c.translate(-gx, -gy)
            p = skia.Paint(AntiAlias=True); p.setAlphaf(clamp(reach * 1.5))
            c.drawImage(K.plate_img('l_glove.png'), 0, 0, K.SMP, p); c.restore()
            c.restore()
        return K.offscreen(fn)
    if key == 'x2':
        alive = 1 - smooth((t - cue('x2a', 2) - 1.0) / 0.6)

        def fn(c):
            c.drawImage(still('thigh'), 0, 0)
            f = DG.BODY['foot_l']; ph = (t * 110 / 60) % 1
            K.ring(c, f, 26 + 40 * ph, K.TEAL, alive * (1 - ph), 5)
            K.ring(c, f, 22, K.TEAL if alive > 0.5 else K.INK, 1.0, 5)
        return K.offscreen(fn)
    if key == 'x3':
        if kind == 'pack':
            pk = smooth((t - cue('x3a', 2)) / 3.0)
            return K.offscreen(lambda c: DG.cavity(c, t, blood=0.7 * (1 - pk), pack=pk, leak=1 - pk))

        def fn(c):
            c.drawImage(still('groin'), 0, 0)
            g = DG.BODY['groin_r']; b = CU.beat(t, 118)
            K.glow(c, (g[0] - 4, g[1] + 16), 40 + 20 * b, K.CORAL, 0.8)
        return K.offscreen(fn)
    return still(kind)


def problem(c, t, key):
    c.drawImage(K.calm_bg(), 0, 0)
    P = PROB[key]
    kq, ka = key + 'q', key + 'a'
    n = int(key[1])
    K.chip(c, f'PROBLEM {n}', 300, 160, K.YELLOW, smooth((t - cue(kq) + 0.2) / 0.3), 40)
    qa = 1 - smooth((t - cue(ka) - 0.1) / 0.4) * 0.45
    nq = len(P['q'])
    for i, line in enumerate(P['q']):
        t0 = cue(kq, max(C_(kq))) if i == nq - 1 else cue(kq, 1) + 1.6 * i
        K.hw(c, line, 120, 300 + i * 78, 44, K.YELLOW if i == len(P['q']) - 1 else K.WHITE, t, t0, 1.3, a=qa)
    swap = 'pic2' in P and t >= cue(ka, 1)
    kind, src = (P['pic2'], P['src2']) if swap else (P['pic'], P['src'])
    src = (src[0], src[1], 1920 / src[2]) if len(src) == 3 and src[2] < 10 else src
    K.pic(c, None, src, 1180, 220, 620, 400, smooth((t - cue(kq) - 0.3) / 0.4), r=24, img=live(key, kind, t))
    a = smooth((t - cue(ka)) / 0.3)
    if a > 0.01:
        txt, colr = P['a']
        w = K.tw(txt, 54) + 90
        yy = 600 + 40 * (nq > 3)
        K.card(c, 120, yy, w, 110, a, r=55, border=colr)
        K.text(c, txt, 165, yy + 74, 54, K.WHITE, a)
    for s, ci in P['why']:
        K.hw(c, s, 140, 790 + 40 * (nq > 3) + 80 * (ci - 1), 44, K.WHITE, t, cue(ka, ci), 1.4)


def C_(k):
    return K.C[k]


def outro(c, t):
    g = WD.garage()
    t0 = cue('end') - 0.5
    L = K.Liq('/home/claude/n35/liq/wide', 0.0)

    def ex(cc, tt, w, lay):
        L.draw(cc, (L.n - 1) / 30.0 + 0.0001, clip_y=-1e5, below=(lay == 'mid'))
    g.draw(c, t, (t0, K.TOT + 0.5), (1000.0, 600.0, 1.06 + 0.04 * smooth((t - t0) / 16)), ex)
    a = smooth((t - cue('end', 1)) / 0.4)
    K.text_card(c, [('Notes and practice for this topic', K.WHITE, a), ('free on levlprep.com', K.TEAL, a)], 960, 200, size=50)
    b = smooth((t - cue('end', 2)) / 0.4)
    K.text_card(c, [('NEXT VIDEO', K.YELLOW, b), ('Internal bleeding and shock', K.WHITE, b)], 960, 470, size=46)


def sounds():
    for i in range(1, 6):
        K.snd('pat', cue('rc', i), 0.35)
    for k in ('x1', 'x2', 'x3'):
        K.snd('swish', cue(k + 'q'), 0.4); K.snd('ding' if False else 'check', cue(k + 'a'), 0.4)
    K.snd('shimmer', cue('end', 1), 0.35)


SHOTS = [dict(t0=cue('rc') - 0.3, t1=end('rc') + 0.45, fn=recap, fin=0.4),
         dict(t0=cue('x1q') - 0.2, t1=end('x1a') + 0.45, fn=lambda c, t: problem(c, t, 'x1'), fin=0.4),
         dict(t0=cue('x2q') - 0.2, t1=end('x2a') + 0.45, fn=lambda c, t: problem(c, t, 'x2'), fin=0.4),
         dict(t0=cue('x3q') - 0.2, t1=end('x3a') + 0.45, fn=lambda c, t: problem(c, t, 'x3'), fin=0.4),
         dict(t0=cue('end') - 0.4, t1=K.TOT + 0.1, fn=outro, fin=0.4)]
