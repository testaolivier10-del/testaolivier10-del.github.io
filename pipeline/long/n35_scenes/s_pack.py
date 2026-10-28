"""Chapter 8, Packing a wound: junctional areas on the body map, gauze packed into the deep wound block from the
bottom (where it bleeds) up, then pressed; hemostatic gauze needs at least 3 minutes of pressure; gauze laid on top is
only a dressing; never pack the chest or belly; the neck gets an occlusive dressing on one side, never a wrap."""
import sys, math
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from core import smooth, lerp, clamp, cue, end, win, col
import diag as DG
import geo


def k1(c, t):
    DG.body(c)
    for nm, t0 in (('groin_r', cue('k1', 1)), ('groin_l', cue('k1', 1)), ('armpit_r', cue('k1', 2)), ('armpit_l', cue('k1', 2))):
        a = smooth((t - t0) / 0.3)
        p = DG.BODY[nm]
        K.glow(c, p, 70, K.CORAL, a * (0.55 + 0.3 * math.sin(t * 5)))
        K.ring(c, p, 38, K.DRED, a, 6)
    K.chip(c, 'groin', DG.BODY['groin_r'][0] - 260, DG.BODY['groin_r'][1] + 30, K.DRED, smooth((t - cue('k1', 1)) / 0.3), 40, anchor=DG.BODY['groin_r'])
    K.chip(c, 'armpit', DG.BODY['armpit_r'][0] - 300, DG.BODY['armpit_r'][1] - 40, K.DRED, smooth((t - cue('k1', 2)) / 0.3), 40, anchor=DG.BODY['armpit_r'])
    K.text_card(c, [('nothing to wrap a tourniquet around', K.WHITE, smooth((t - cue('k1')) / 0.3)),
                    ('JUNCTIONAL areas:', K.YELLOW, smooth((t - cue('k1', 3)) / 0.3)),
                    ('where a limb meets the body', K.WHITE, smooth((t - cue('k1', 3) - 0.8) / 0.3))], 1110, 600, size=36)


def glove_top(c, k):
    """The painted glove pressing on top of the packed wound."""
    gx, gy = geo.P(565, 236)
    x, y = geo.P(512, 92)
    c.save(); c.translate(x - 6, y - 6 - 200 * (1 - k)); c.scale(0.55, 0.55); c.translate(-gx, -gy)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(clamp(k * 1.5))
    c.drawImage(K.plate_img('l_glove.png'), 0, 0, K.SMP, p)
    c.restore()


def feed(c, t, k, a):
    """A gauze roll feeding into the wound opening from the upper right."""
    if a <= 0.01:
        return
    top = geo.P(512, 84)
    p0 = (top[0] + 330, top[1] - 160)
    path = skia.Path(); path.moveTo(*p0); path.quadTo(top[0] + 150, top[1] - 120, top[0], top[1] + 20)
    c.drawPath(path, skia.Paint(AntiAlias=True, Color=col((246, 247, 251), 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=26))
    c.drawPath(path, skia.Paint(AntiAlias=True, Color=col((214, 222, 236), 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=6,
                                PathEffect=skia.DashPathEffect.Make([18, 14], -t * 140)))
    c.drawCircle(p0[0] + 40, p0[1] - 20, 52, skia.Paint(AntiAlias=True, Color=col((244, 246, 250), 255 * a)))
    c.drawCircle(p0[0] + 40, p0[1] - 20, 20, skia.Paint(AntiAlias=True, Color=col((214, 222, 236), 255 * a)))


def k2k3(c, t):
    c1, c2, c3 = cue('k2', 1), cue('k2', 2), cue('k2', 3)
    pack = 0.25 * smooth((t - c1) / 2.5) + 0.75 * smooth((t - c3) / 2.8)
    blood = 0.75 * (1 - pack)
    laid_mode = t >= cue('k3', 3) - 0.2
    if laid_mode:
        DG.cavity(c, t, blood=0.8, laid=1.0, leak=1.0)
    else:
        DG.cavity(c, t, blood=blood, pack=pack, leak=1 - smooth((t - c3 - 2.0) / 1.5),
                  clot=smooth((t - cue('k3', 1) - 2.0) / 9.0) * (1 - smooth((t - cue('k3', 3) + 0.4) / 0.3)))
    feed(c, t, pack, win(t, c1 - 0.2, cue('k3') + 0.2))
    press = smooth((t - cue('k3') - 0.2) / 0.6)
    if not laid_mode and press > 0.01:
        glove_top(c, press)
    if laid_mode:
        glove_top(c, 1.0)
    tear = DG.CAV_TEAR
    K.chip(c, 'where the blood is coming from', tear[0] + 330, tear[1] + 70, K.DRED, win(t, c2, c3 + 1.5), 36, anchor=tear)
    K.text_card(c, [('push gauze INTO the wound', K.WHITE, win(t, c1, cue('k3'))), ('plain or hemostatic', K.INK, win(t, c1 + 1.4, cue('k3'))),
                    ('keep feeding it in until packed tight', K.YELLOW, win(t, c3, cue('k3')))], 80, 160)
    # pressing, the timer
    k3a = win(t, cue('k3'), cue('k3', 3) - 0.2)
    K.text_card(c, [('then press hard on top', K.WHITE, k3a)], 80, 160)
    ha = win(t, cue('k3', 1), cue('k3', 2))
    if ha > 0.01:
        K.clock(c, 1700, 300, 90, clamp((t - cue('k3', 1)) / 9.0), K.YELLOW, ha)
        K.chip(c, 'at least 3 min', 1700, 450, K.YELLOW, ha, 34)
        K.text_card(c, [('hemostatic gauze: helps it clot', K.WHITE, ha), ('only where it touches the bleeding', K.YELLOW, smooth((t - cue('k3', 1) - 2.5) / 0.3) * ha)], 80, 820)
        K.glow(c, (tear[0], tear[1] - 30), 90, K.YELLOW, ha * smooth((t - cue('k3', 1) - 2.5) / 0.5) * (0.5 + 0.3 * math.sin(t * 4)))
    pa = win(t, cue('k3', 2), cue('k3', 3) - 0.2)
    K.text_card(c, [('plain gauze: keep pressing', K.WHITE, pa), ('until it is controlled, or you hand off', K.WHITE, pa)], 80, 820)
    la = smooth((t - cue('k3', 3)) / 0.3)
    if laid_mode:
        K.text_card(c, [('gauze just laid on top = a dressing', K.WHITE, la), ("it won't stop a bleed like this", K.CORAL, smooth((t - cue('k3', 3) - 1.5) / 0.3))], 80, 820)
        K.x_mark(c, 1640, 300, 0.9, la)


def k4(c, t):
    c1, c2, c3, c4 = (cue('k4', i) for i in range(1, 5))
    upper = smooth((t - c2 + 0.6) / 1.2)
    cam = K.cam_lerp(DG.CAM_BODY, (geo.X(512), geo.Y(170), 1.9), upper)
    K.draw_plate(c, 'g_body.png', cam)
    a0 = smooth((t - cue('k4') - 0.3) / 0.3) * (1 - upper)
    for nm in ('chest', 'belly'):
        p = K.w2s(cam, DG.BODY[nm])
        K.ring(c, p, 48, K.DRED, a0, 6)
        K.x_mark(c, p[0], p[1], 0.4, a0 * smooth((t - cue('k4') - 1.0) / 0.3))
    K.text_card(c, [('never pack the chest or the belly', K.CORAL, smooth((t - cue('k4') - 0.3) / 0.3)),
                    ('nothing solid to pack against', K.WHITE, smooth((t - c1) / 0.3)),
                    ("gauze can end up where you can't control it", K.WHITE, smooth((t - c1 - 2.5) / 0.3)),
                    ("and you can't press on what's bleeding inside", K.WHITE, smooth((t - c1 - 5.0) / 0.3))], 1060, 520, size=36,
                a=1 - smooth((t - c2 + 0.6) / 0.4))
    nk = K.w2s(cam, DG.BODY['neck'])
    side = K.w2s(cam, geo.P(494, 114))
    a2 = smooth((t - c2) / 0.4)
    if a2 > 0.01:
        K.glow(c, side, 60, K.LILAC, a2 * (1 - smooth((t - c3) / 0.5)) * (0.6 + 0.3 * math.sin(t * 5)))
    a3 = smooth((t - c3) / 0.5)
    if a3 > 0.01:
        r = skia.RRect.MakeRectXY(skia.Rect(side[0] - 38, side[1] - 34, side[0] + 30, side[1] + 34), 8, 8)
        c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col((214, 236, 255), 150 * a3)))
        c.drawRRect(r, skia.Paint(AntiAlias=True, Color=col((248, 252, 255), 255 * a3), Style=skia.Paint.kStroke_Style, StrokeWidth=5))
    a4 = smooth((t - c4) / 0.4)
    if a4 > 0.01:
        c.drawOval(skia.Rect(nk[0] - 70, nk[1] - 18, nk[0] + 70, nk[1] + 26), skia.Paint(AntiAlias=True, Color=col(K.CORAL, 220 * a4),
                                                                                       Style=skia.Paint.kStroke_Style, StrokeWidth=9,
                                                                                       PathEffect=skia.DashPathEffect.Make([18, 10], 0)))
        K.x_mark(c, nk[0] + 130, nk[1] - 20, 0.5, a4)
    K.text_card(c, [('the neck is different', K.YELLOW, win(t, c2, 1e9)), ('a torn vein can suck in air', K.WHITE, win(t, c2 + 1.2, 1e9)),
                    ('cover it: OCCLUSIVE dressing (seals air out)', K.WHITE, smooth((t - c3) / 0.3)),
                    ('press on that one side', K.WHITE, smooth((t - c3 - 3.0) / 0.3)),
                    ('never wrap anything around the neck', K.CORAL, smooth((t - c4) / 0.3))], 80, 560, size=38) if t > c2 - 0.3 else None


def sounds():
    K.snd('pat', cue('k1', 1), 0.35); K.snd('pat', cue('k1', 2), 0.35)
    K.snd('cloth_real', cue('k2', 1), 0.4); K.snd('cloth_real', cue('k2', 3), 0.4)
    K.snd('pat', cue('k3') + 0.6, 0.45)
    K.snd('wrong', cue('k3', 3) + 1.5, 0.3)
    K.snd('wrong', cue('k4') + 1.0, 0.3)
    K.snd('wrong', cue('k4', 4), 0.3)


SHOTS = [dict(t0=cue('k1') - 0.4, t1=end('k1') + 0.45, fn=k1, fin=0.4),
         dict(t0=cue('k2') - 0.2, t1=end('k3') + 0.45, fn=k2k3, fin=0.4),
         dict(t0=cue('k4') - 0.2, t1=end('k4') + 1.0, fn=k4, fin=0.4)]
