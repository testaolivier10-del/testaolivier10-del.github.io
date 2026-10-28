"""Chapter 3, Direct pressure step by step: cross section (push toward the bone), the close up (hand on it NOW, hold,
the bandage, never peel it off, press harder), the tall gauze stack that cushions, and what "more" means."""
import sys, math, functools
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, col
import closeup as CU, diag as DG
import geo

LIQ = '/home/claude/n35/liq/'
_l = {}


def liq(name, t0):
    if (name, t0) not in _l:
        _l[(name, t0)] = K.Liq(LIQ + name, t0)
    return _l[(name, t0)]


def step_badge(c, n, title, a):
    if a <= 0.01:
        return
    K.card(c, 1260, 120, 600, 96, a, r=48, border=K.YELLOW)
    K.text(c, f'STEP {n}', 1300, 184, 40, K.YELLOW, a)
    K.text(c, title, 1490, 184, 40, K.WHITE, a, face=K.XB)


def glove_at(c, x, y, sc, rot=0.0, a=1.0):
    """The painted glove, palm point at (x, y)."""
    gx, gy = geo.P(565, 236)
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.translate(-gx, -gy)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(clamp(a))
    c.drawImage(K.plate_img('l_glove.png'), 0, 0, K.SMP, p)
    c.restore()


CR_TOP = DG.cross_pt(geo.P(300, 48))      # skin at the top of the cross section, above the artery
CR_BONE = DG.cross_pt(DG.CR_BONE)


def gauze_stack(c, x, ybot, n, red, a=1.0):
    """n folded gauze pads stacked on the skin (flat, two tones); red 0..1 soaks from the bottom up."""
    for i in range(n):
        y = ybot - i * 26
        r = skia.RRect.MakeRectXY(skia.Rect(x - 120, y - 24, x + 120, y), 6, 6)
        soak = clamp(red * n - i)
        base = (lerp(246, 182, soak), lerp(247, 24, soak), lerp(250, 42, soak))
        c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col(base, 255 * a)))
        c.drawRect(skia.Rect(x - 120, y - 8, x + 120, y), skia.Paint(Color=col((lerp(208, 140, soak), lerp(214, 14, soak), lerp(228, 30, soak)), 255 * a)))


def gauze_stack_one(c, x, y, a):
    r = skia.RRect.MakeRectXY(skia.Rect(x - 120, y - 24, x + 120, y), 6, 6)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col((246, 247, 250), 255 * a)))
    c.drawRect(skia.Rect(x - 120, y - 8, x + 120, y), skia.Paint(Color=col((208, 214, 228), 255 * a)))


def s1_cross(c, t):
    p = smooth((t - cue('s1', 2) - 0.3) / 1.2)
    DG.cross(c, t, squash=0.92 * p, push=0.55 * p)
    land = smooth((t - cue('s1', 1) + 0.6) / 0.7)
    x, y = CR_TOP
    glove_at(c, x + 20, y + 8 * p - 160 * (1 - land), 0.5, 0, land)
    step_badge(c, 1, 'Press hard', smooth((t - cue('s1') + 0.2) / 0.3))
    la = smooth((t - cue('s1') - 0.4) / 0.4)
    rb = DG.cross_pt(DG.CR_BONE); ub = DG.cross_pt(DG.CR_ULNA)
    K.chip(c, 'radius', rb[0] - 330, rb[1] + 20, K.DINK, la, 34, anchor=(rb[0] - 40, rb[1]))
    K.chip(c, 'ulna', ub[0] - 330, ub[1], K.DINK, la, 34, anchor=(ub[0] - 40, ub[1]))
    ap = DG.cross_pt(DG.CR_ART[0])
    K.chip(c, 'artery', ap[0] - 330, ap[1] - 30, K.DRED, la, 34, anchor=(ap[0] - 28, ap[1]))
    K.text_card(c, [('big wound: your palm', K.WHITE, win(t, cue('s1', 1), cue('s1', 3))),
                    ('small wound: your fingers', K.WHITE, win(t, cue('s1', 1) + 1.2, cue('s1', 3)))], 1260, 300)
    a2 = win(t, cue('s1', 2), cue('s1', 3))
    if a2 > 0.01:
        K.arrow(c, (x + 70, y - 30), (CR_BONE[0] + 70, CR_BONE[1] - 30), K.YELLOW, 12, 36, a2, grow=smooth((t - cue('s1', 2)) / 0.8))
        K.text_card(c, [('push toward the bone', K.YELLOW, a2), ('so the artery gets squeezed', K.WHITE, smooth((t - cue('s1', 2) - 1.6) / 0.3) * a2)], 1260, 520)


def s1_cu(c, t):
    t0 = cue('s1', 3) - 0.3
    cam = (geo.X(540), geo.Y(285), 1.08)
    K.draw_plate(c, 'g_arm.png', cam)
    K.push_cam(c, cam)
    CU.wound(c)
    liq('s1_slap', t0).draw(c, t)
    land = smooth((t - (t0 + 3.1) + 0.25) / 0.25)
    b = CU.beat(t, 118)
    if land > 0.01:
        CU.glove(c, dy=-260 * (1 - land) + 3 * b * land + 12, dx=-170, a=land)
    c.restore()
    K.chip(c, 'no time for gauze', 1420, 230, K.CORAL, win(t, cue('s1', 3), cue('s1', 4)), 44)
    a = win(t, cue('s1', 4), end('s1') + 0.4)
    K.text_card(c, [('gloved hand on it NOW', K.WHITE, a), ('keep pressing while the tourniquet comes out', K.YELLOW,
                                                            smooth((t - cue('s1', 4) - 1.6) / 0.3) * a)], 120, 860)


def press_cu(c, t, stain=40, extra=None, band=0.0, hand=1.0, lift=0.0, second=0.0, harder=0.0, cam=None, tq=0.0):
    cam = cam or (geo.X(560), geo.Y(275), 1.06)
    K.draw_plate(c, 'g_arm.png', cam)
    K.push_cam(c, cam)
    b = CU.beat(t, 118)
    if extra:
        extra(c, t)
    CU.gauze_and_stain(c, stain, dy=2 * b * hand, lift=lift)
    if second > 0.01:
        c.save(); c.translate(-14, -14 - 120 * (1 - second)); c.rotate(-3)
        CU.gauze_and_stain(c, 0, a=second)
        c.restore()
    CU.bandage(c, band)
    if tq > 0.01:
        c.save(); c.translate(0, -40 * (1 - tq))
        CU.tourniquet(c, CU.TQX, a=tq, twist=0.7)
        c.restore()
    if hand > 0.01:
        CU.glove(c, dy=2 * b * hand - 280 * (1 - hand) + 10 * harder - 14 * second, a=hand)
    c.restore()


def s2(c, t):
    press_cu(c, t, stain=70)
    step_badge(c, 2, 'Hold it', smooth((t - cue('s2') + 0.2) / 0.3))
    a1 = win(t, cue('s2', 1), cue('s2', 2))
    K.text_card(c, [('massive bleeding:', K.CORAL, a1), ('keep pressure on all the way to the hospital', K.WHITE, a1)], 120, 820)
    a2 = win(t, cue('s2', 2), end('s2') + 0.4)
    K.text_card(c, [('smaller bleed:', K.YELLOW, a2), ('hold it steady, no peeking, until it stops', K.WHITE, a2)], 120, 820)
    K.clock(c, 1640, 820, 80, ((t - cue('s2', 2)) / 6.0) % 1.0, K.YELLOW, a2)


def s3(c, t):
    t0 = cue('s3', 1) - 0.4
    nf = clamp((t - t0) / 0.35, 0, 6)
    n = int(nf)
    red = 0.35 * smooth((t - t0 - 2.4) / 2.6) + 0.45 * smooth((t - t0 - 5.0) / 9.0)
    DG.cross(c, t, squash=0.12, push=0.05)
    x, y = CR_TOP
    gauze_stack(c, x + 20, y + 22, n, red)
    if n < 6 and nf > n:
        # the next pad drops onto the stack
        u = smooth(nf - n)
        c.save(); c.translate(0, -120 * (1 - u))
        gauze_stack_one(c, x + 20, y + 22 - 26 * n, u)
        c.restore()
    glove_at(c, x + 20, y + 20 - 26 * nf, 0.5, 0, 1.0)
    step_badge(c, 3, 'Skip the big stack', smooth((t - cue('s3') + 0.2) / 0.3))
    a2 = win(t, cue('s3', 2), end('s3') + 0.4)
    K.text_card(c, [('a tall stack soaks up blood', K.WHITE, smooth((t - t0 - 2.4) / 0.4)),
                    ('and cushions your hand:', K.WHITE, a2), ('you press LESS', K.CORAL, a2)], 1260, 300)
    if a2 > 0.01:
        K.meter(c, 1700, 560, 160, 380, 0.22, a2, 'pressure', K.CORAL, K.GREEN)
        K.x_mark(c, 1430, 760, 0.8, a2)


def s4(c, t):
    u = smooth((t - cue('s4', 1)) / 3.4)
    hand = 1 - smooth((t - cue('s4', 1) - 3.7) / 0.8)
    press_cu(c, t, stain=60, band=u, hand=hand)
    step_badge(c, 4, 'Pressure dressing', smooth((t - cue('s4') + 0.2) / 0.3))
    a = win(t, cue('s4', 1) + 3.6, end('s4') + 0.4)
    K.text_card(c, [('wrapped firm: pressure stays on', K.WHITE, a), ('without your hands', K.GREEN, a)], 120, 840)


def s5(c, t):
    t1, t2, t3, t4 = (cue('s5', i) for i in range(1, 5))
    hand_off = smooth((t - t1 + 0.3) / 0.5) * (1 - smooth((t - t3 + 0.4) / 0.5))
    lift = 14 * smooth((t - t1 - 0.4) / 0.7) * (1 - smooth((t - t2 - 2.5) / 0.6))
    second = smooth((t - t3) / 0.6)
    harder = smooth((t - t3 - 1.6) / 0.4)
    stain = 60 + 50 * smooth((t - t2 - 2.0) / 3.0)

    def ex(cc, tt):
        liq('peel', t1).draw(cc, tt)
    press_cu(c, t, stain=stain, extra=ex, hand=1 - hand_off, lift=lift, second=second, harder=harder)
    step_badge(c, 5, "Don't peel it off", smooth((t - cue('s5') + 0.2) / 0.3))
    a1 = win(t, t1, t3)
    K.x_mark(c, 1600, 400, 0.9, a1)
    K.text_card(c, [('the clot is forming in that gauze', K.WHITE, win(t, t2, t3)), ('peel it off: it tears right open', K.CORAL, win(t, t2 + 1.2, t3))], 120, 840)
    a3 = win(t, t3, end('s5') + 0.4)
    K.text_card(c, [('soaked through? leave it there', K.WHITE, a3), ('add more, press harder', K.YELLOW, smooth((t - t3 - 1.5) / 0.3) * a3)], 120, 840)
    if harder > 0.01:
        gp = (geo.X(580) - (geo.X(560) - 960) * 0, 0)
        K.arrow(c, (1180, 150), (1180, 270), K.YELLOW, 14, 40, a3 * harder)
    K.chip(c, 'you need to do more', 1500, 840, K.YELLOW, win(t, t4, end('s5') + 0.4), 42)


def s6(c, t):
    t1, t2, t3 = cue('s6', 1), cue('s6', 2), cue('s6', 3)
    if t < t2 - 0.3 or t >= t3 - 0.3:
        tq = smooth((t - t1 - 0.6) / 0.8) if t < t3 - 0.3 else 1.0
        press_cu(c, t, stain=90, tq=tq)
        a = win(t, t1, t2 - 0.3)
        K.text_card(c, [('arm or leg, pressure not stopping it:', K.WHITE, a), ('TOURNIQUET', K.CORAL, a)], 120, 840)
        a3 = smooth((t - t3) / 0.3)
        K.text_card(c, [("a life threatening limb bleed", K.WHITE, a3), ("doesn't wait for pressure to fail", K.CORAL, a3)], 120, 840)
    else:
        DG.body(c)
        k = smooth((t - t2) / 0.4)
        for nm in ('groin_r', 'groin_l', 'armpit_r', 'armpit_l'):
            p = DG.BODY[nm]
            K.glow(c, p, 70, K.CORAL, k * (0.6 + 0.3 * math.sin(t * 5)))
            K.ring(c, p, 40, K.DRED, k, 6)
        K.text_card(c, [("where a tourniquet can't go:", K.WHITE, k), ('pack the wound', K.YELLOW, k),
                        ('plain gauze, or hemostatic gauze', K.WHITE, smooth((t - t2 - 2.5) / 0.3)),
                        ('(gauze that helps blood clot)', K.INK, smooth((t - t2 - 4.5) / 0.3))], 80, 640)


def sounds():
    K.snd('pat', cue('s1', 1) - 0.1, 0.4)
    K.snd('pat', cue('s1', 3) - 0.3 + 3.1, 0.6)
    for k in ('s2', 's3', 's4', 's5'):
        K.snd('swish', cue(k), 0.35)
    K.snd('wrong', cue('s3', 2), 0.3)
    K.snd('cloth_real', cue('s4', 1), 0.4)
    K.snd('wrong', cue('s5', 1), 0.35)
    K.snd('pat', cue('s5', 3) + 1.6, 0.45)
    K.snd('swish', cue('s6', 2) - 0.3, 0.35); K.snd('swish', cue('s6', 3) - 0.3, 0.35)


SHOTS = [dict(t0=cue('s1') - 0.4, t1=cue('s1', 3) - 0.3, fn=s1_cross, fin=0.4),
         dict(t0=cue('s1', 3) - 0.3, t1=end('s1') + 0.45, fn=s1_cu, fin=0.35),
         dict(t0=cue('s2') - 0.2, t1=end('s2') + 0.45, fn=s2, fin=0.35),
         dict(t0=cue('s3') - 0.2, t1=end('s3') + 0.45, fn=s3, fin=0.35),
         dict(t0=cue('s4') - 0.2, t1=end('s4') + 0.45, fn=s4, fin=0.35),
         dict(t0=cue('s5') - 0.2, t1=end('s5') + 0.45, fn=s5, fin=0.35),
         dict(t0=cue('s6') - 0.2, t1=end('s6') + 1.2, fn=s6, fin=0.35)]
