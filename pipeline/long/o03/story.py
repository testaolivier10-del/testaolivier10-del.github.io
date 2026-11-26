"""Story beats of yt-orgo-03 (Ines the sculptor): hook, c7 (inside the diamond), d5 (inside the pencil), e6 (the torch), end.
Shot list (director: every shot has a reason; hands only appear in poses the cast passed through gates 2 and 3; tool contact is
shown in macro inserts where the tool enters from a frame edge):
 hook  A medium, slow push: Ines sketches the heron on the paper (pencil in her left hand).  B macro: the pencil tip leaves its line.
       C medium: she holds the scribe up, eyes on its diamond point.  D macro: the diamond scratches the steel.
       E wide: the workshop at night, the plate part marked, the torch cart waiting.  F macro pair: both tips, "pure carbon" twice.
       G close: her face, curious, eyes going from one tool to the other.
 c7    macro scribe with an inset that opens from the diamond point: the lattice grows; then the tip bites on.
 d5    macro pencil with an inset: one sheet, the p cloud, three sheets, the top one slides; then the tip drags and sheds flakes.
 e6    A wide push toward the cart beside the plate.  B the tanks with the acetylene inset (count, straight line).
       C medium: goggles down, she lights the torch (yellow, then the blue cone).  D macro: the cut along the scratched line.
 end   A wide square: she pulls the cover off.  B the steel heron in the first sun.  C close: Ines smiles.
       D wide, calm, for the end screen: levlprep.com handwritten in the top third."""
import math
import numpy as np
import cv2
import skia
import kit as K
import orb as O
import shop as S
import cast as CA
import lattice as LT
from kit import P, SP, sm, W, H, text, pill, AMBER, CREAM, INK2, NAVY
from base import Bt, cue, fin, ua, ww, cues, tx, hw
from places import finish

IX = 745                                     # Ines's place behind the bench (a little left of shop.STAND so the paper is under her pencil)
IG, IS_ = S.STAND['ground'], S.STAND['s']
INSET = (1380, 540)


def lerp(a, b, u): return a + (b - a) * u


def ease(t, t0, t1): return sm((t - t0) / max(1e-6, t1 - t0))


_SF = {}


def _arms_layer(c, cam, person):
    """her forearms, hands and tool again, OVER the bench top (she stands behind the bench but works on top of it): the figure is
    drawn twice off screen, once as posed and once with the arms lifted away; what differs below the bench's back edge is the arms."""
    if 'a' not in _SF: _SF['a'] = skia.Surface(W, H); _SF['b'] = skia.Surface(W, H)
    arr = []
    for key, arms in (('a', True), ('b', False)):
        cc = _SF[key].getCanvas(); cc.clear(0); cc.save(); S.cam_apply(cc, cam, 0.9); person(cc, arms); cc.restore()
        arr.append(np.frombuffer(_SF[key].makeImageSnapshot().tobytes(), np.uint8).reshape(H, W, 4))
    A, B = arr; D = A.astype(np.int16) - B.astype(np.int16)
    m = (np.abs(D).max(2) > 3)
    m &= ~((B[:, :, 3] > 250) & (D[:, :, :3].max(2) <= 3))          # a pure darkening of the body is only the arm's shadow on her: leave it
    m = m.astype(np.uint8)
    y0 = int(S.cam_point((0, S.BENCH_Y - 4), cam, 0.9)[1]); m[:max(0, y0)] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros(n, np.uint8); keep[1:] = st[1:, cv2.CC_STAT_AREA] > 1500; m = keep[lab]
    m = cv2.GaussianBlur(cv2.dilate(m * 255, np.ones((7, 7), np.uint8)), (7, 7), 0).astype(np.float32) / 255.0
    m[:max(0, y0)] = 0
    out = np.ascontiguousarray((A * m[:, :, None]).astype(np.uint8))
    sh = cv2.GaussianBlur(np.roll(np.roll(out[:, :, 3], 9, 0), 7, 1), (25, 25), 0).astype(np.float32) * 0.42
    sh[:max(0, y0) + 6] = 0; z = np.zeros((H, W, 4), np.uint8); z[:, :, 3] = sh.astype(np.uint8); z[:, :, 0] = (40 * sh / 255).astype(np.uint8); z[:, :, 2] = (20 * sh / 255).astype(np.uint8)
    c.drawImage(skia.Image.fromarray(z, colorType=skia.kBGRA_8888_ColorType, alphaType=skia.kPremul_AlphaType), 0, 0)
    c.drawImage(skia.Image.fromarray(out, colorType=skia.kBGRA_8888_ColorType, alphaType=skia.kPremul_AlphaType), 0, 0)


def _noarms(ps, sides='lr'):
    if 'l' in sides: ps.l_up = 178.0; ps.l_fore = 0.0; ps.l_tool = None
    if 'r' in sides: ps.r_up = 178.0; ps.r_fore = 0.0; ps.r_tool = None
    ps.front = ()
    return ps


def shop_scene(c, t, cam, person=None, sketch=1.0, scribed=0.0, cut=0.0, glow=0.0, lamp=1.0, flame=None, front=None, plate_y=None, work=None):
    """the workshop with one camera; person(c) draws Ines in scene coordinates behind the bench; work(c, arms) is the same for a
    shot where her hands work ON the bench top; front(c) draws her in front of everything"""
    S.workshop_back(c, t, cam, lamp, glow)
    if person or work:
        c.save(); S.cam_apply(c, cam, 0.9); (person(c) if person else work(c, True)); c.restore()
    S.workshop_front(c, t, cam, sketch)
    if work: _arms_layer(c, cam, work)
    c.save(); S.cam_apply(c, cam, 0.9)
    S.plate(c, t, y=plate_y or S.PLATE['y'], scribed=scribed, cut=cut); S.cart(c, t)
    if front: front(c)
    if flame: flame(c)
    c.restore()


def close_face(c, t, who, mood, look, back, smile=None, goggles=0.0, ref=None, s=2.3, x=960, tilt=0.0):
    """a close shot: the place behind her pushed in and dimmed a little, her head and shoulders filling the frame"""
    back(c)
    c.drawRect(skia.Rect(0, 0, W, H), P((10, 10, 30), 70))
    ps = CA.idle(t, 0.4, look=look); ps.cfg = CA.LOOKS[who]['cfg']; CA.face(ps, mood); ps.look = look
    if smile is not None: ps.smile = smile
    ps.goggles = goggles
    if ref: ps.gog_ref = ref
    ps.head_tilt = tilt + 1.5 * math.sin(t * 0.5); ps.sway = 0; ps.head_yaw = 0.25 * look[0]
    if mood == 'curious': ps.brow = 1.0; ps.lid = 1.0
    CA.draw(c, who, ps, x, 150 + 1050 * s, s)


def inset_ring(c, src, a, R):
    """the 'look inside' link: a thin cone of light from the contact point to the inset"""
    if a <= 0.01: return
    x, y = INSET; dx, dy = x - src[0], y - src[1]; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    p = skia.Path(); p.moveTo(*src); p.lineTo(x + nx * R, y + ny * R); p.lineTo(x - nx * R, y - ny * R); p.close()
    c.drawPath(p, P((255, 240, 200), 26 * a))
    c.drawCircle(src[0], src[1], 16, SP(AMBER, 4, 255 * a))


def cap(c, s, t, t0, y=1000, x=None, size=46, col=CREAM):
    """a caption on a dark pill (light text never sits bare on a light scene)"""
    a = ua(t, t0, 0.35)
    if a > 0.01: pill(c, s, x or INSET[0], y, col, size, a, fill=(14, 18, 44), kind='xb')


# ------------------------------------------------------------------ hook
def hook(c, t):
    k = 'hook'; t0, c1, c2, c3, c4 = cues(k, 4)
    tB = ww(k, 'tonight') + 0.4; tC = ww(k, 'so') - 0.2; tD = c2 - 0.1; tE = ww(k, 'scratches') - 0.2; tF = ww(k, 'She') - 0.3; tG = c3 - 0.1; tH = c4 - 0.1
    if t < tB:                                                   # A: the pencil point is already drawing
        S.macro_pencil(c, t, lerp(0.03, 0.3, ease(t, -0.5, tB + 0.3)), flakes=0.2)
    elif t < tC:                                                 # B: Ines at her bench, sketching the heron
        g = (t - tB) / (tC - tB); u = lerp(0.1, 0.2, sm(g)); cam = (0, lerp(-10, -26, g), lerp(1.12, 1.18, g))
        tip = S.sketch_point(u)
        def work(c_, arms):
            ps = CA.pose_sketch(t, tip, IX, IG, IS_)
            ps.r_up, ps.r_fore, ps.r_wrist = 7.0, 6.0, -10.0; ps.r_hand = CA.PN.RELAX; ps.r_palm = False       # her other arm hangs at her side, behind the bench
            ps.look = (0.25, 1.0); ps.lid = min(getattr(ps, 'lid', 1.0), 0.62); ps.head_tilt = 5.0; ps.lean = 3.0
            CA.draw(c_, 'ines', ps if arms else _noarms(ps, 'l'), IX, IG, IS_)
        shop_scene(c, t, cam, work=work, sketch=u)
    elif t < tD:                                                 # C: the tip leaves a soft gray line
        S.macro_pencil(c, t, lerp(0.3, 0.92, ease(t, tC - 0.3, tD - 0.3)), flakes=0.3)
    elif t < tE:                                                 # D: the diamond point comes down on the steel
        S.macro_scribe(c, t, 0.05, bite=0.5 * ease(t, tE - 0.9, tE - 0.2), lift=1 - ease(t, ww(k, 'diamond') + 0.3, tE - 0.2))
    elif t < tF:                                                 # E: and scratches
        S.macro_scribe(c, t, lerp(0.05, 0.9, ease(t, tE, tF - 0.2)), bite=0.5)
    elif t < tG:                                                 # F: one night: the moon, her sketch, the marked plate, the torch waiting
        g = ease(t, tF - 0.5, tG + 0.5); cam = (lerp(-230, 330, g), 20, 1.22)
        shop_scene(c, t, cam, None, sketch=1.0, scribed=0.42)
    elif t < tH:                                                 # G: both tips are pure carbon
        r = S.macro_pair(c, t)
        px, dx = r['pencil'][0], r['diamond'][0]
        cap(c, 'graphite', t, ww(k, 'graphite') - 0.1, 110, px, 72); cap(c, 'pure carbon', t, ww(k, 'pure') - 0.1, 218, px, 60, AMBER)
        cap(c, 'diamond', t, ww(k, 'diamond', 1) - 0.1, 110, dx, 72); cap(c, 'pure carbon', t, ww(k, 'pure', 1) - 0.1, 218, dx, 60, AMBER)
    else:                                                        # H: her face, the question
        tl_, tr_ = ww(k, 'soft') - 0.2, ww(k, 'hard', 0, c4) - 0.2
        lx = lerp(0.0, -0.8, ease(t, tl_, tl_ + 0.5)); lx = lerp(lx, 0.8, ease(t, tr_, tr_ + 0.5))
        z = lerp(1.7, 1.78, (t - tH) / 7)
        close_face(c, t, 'ines', 'curious', (lx, -0.05), lambda c_: S.workshop_back(c_, t, (-420, -120, z)), smile=0.18, tilt=5.0 * (lx))
    finish(c, t)


# ------------------------------------------------------------------ c7: inside the diamond
def c7(c, t):
    k = 'c7'; t0, c1, c2, c3, c4 = cues(k, 4)
    tb = c4 - 0.2
    u = lerp(0.5, 0.56, ease(t, t0, tb)) if t < tb else lerp(0.56, 0.92, ease(t, tb + 0.4, fin(k)))
    src = S.macro_scribe(c, t, u, bite=ease(t, tb, tb + 0.8))
    a = ease(t, t0 + 0.6, t0 + 1.6) * (1 - ease(t, tb - 0.2, tb + 0.5))
    if a > 0.01:
        R = 420 * (0.55 + 0.45 * ease(t, t0 + 0.6, t0 + 1.8))
        g = lerp(0.04, 0.2, ease(t, t0 + 1.2, c2)); g = lerp(g, 0.42, ease(t, c2, c2 + 3.6)); g = lerp(g, 0.7, ease(t, c2 + 4.2, c3)); g = lerp(g, 1.0, ease(t, c3, c3 + 4.5))
        inset_ring(c, src, a, R)
        LT.diamond(c, t, INSET[0], INSET[1], R, a, g)
        O.hyb_chip(c, 'sp3', INSET[0] - 330, 150, 76, a * ua(t, t0 + 6.0, 0.4))
        cap(c, 'every carbon bonds to 4 more', t, c2 + 0.3, 1010) if t < c3 - 0.2 else cap(c, 'strong bonds in every direction', t, c3 + 0.2, 1010)
    finish(c, t)


# ------------------------------------------------------------------ d5: inside the pencil
def d5(c, t):
    k = 'd5'; t0, c1, c2, c3, c4 = cues(k, 4)
    td = ww(k, 'drags') - 0.2
    u = lerp(0.42, 0.46, ease(t, t0, td)) if t < td else lerp(0.46, 0.95, ease(t, td, td + 6.0))
    fl = 0.25 if t < td else lerp(0.25, 1.0, ease(t, td, td + 3.5))
    src = S.macro_pencil(c, t, u, flakes=fl)
    aout = ww(k, 'stay', 1) - 0.1
    a = ease(t, t0 + 0.6, t0 + 1.6) * (1 - ease(t, aout, aout + 0.9))
    if a > 0.01:
        R = 420 * (0.55 + 0.45 * ease(t, t0 + 0.6, t0 + 1.8))
        tp = ww(k, 'leftover') - 0.2; ts = ww(k, 'stack') - 0.6
        inset_ring(c, src, a, R)
        LT.graphite(c, t, INSET[0], INSET[1], R, a, sheets=ease(t, ts, ts + 1.6), p=ease(t, tp, tp + 2.5) * (1 - 0.6 * ease(t, ts - 0.5, ts + 1.0)), slide=ease(t, td, td + 3.2))
        O.hyb_chip(c, 'sp2', INSET[0] - 330, 150, 76, a * ua(t, ww(k, 'every') + 1.0, 0.4))
        tw = ww(k, 'weak') - 0.1
        if t < tp - 0.3: cap(c, '3 neighbors, one flat sheet', t, c2 + 0.4, 1010)
        elif t < c3 - 0.2: cap(c, 'leftover p orbitals overlap sideways', t, tp, 1010)
        elif t < tw - 0.3: cap(c, 'strong bonds stay inside a sheet', t, c3 + 0.2, 1010)
        elif t < td - 0.2: cap(c, 'only weak attractions between sheets', t, tw, 1010)
        else: cap(c, 'a sheet rubs off as a flake', t, td + 0.3, 1010)
    finish(c, t)


# ------------------------------------------------------------------ e6: the torch
def e6(c, t):
    k = 'e6'; t0, c1, c2, c3, c4 = cues(k, 4)
    tB = ww(k, 'One') - 0.3; tC = c4 - 0.2; tC2 = ww(k, 'burns') - 0.6; tD = ww(k, 'That', 1) - 0.3
    if t < tB:                                                   # A: the torch cart stands by the marked steel
        g = ease(t, t0 - 0.5, tB + 0.3); cam = (lerp(60, 400, g), lerp(10, 60, g), lerp(1.12, 1.3, g))
        shop_scene(c, t, cam, None, sketch=1.0, scribed=1.0)
    elif t < tC:                                                 # B: the tanks, and what acetylene is
        cam = (520, 110, 1.42)
        shop_scene(c, t, cam, None, sketch=1.0, scribed=1.0)
        c.drawRect(skia.Rect(0, 0, 1100, H), skia.Paint(Shader=skia.GradientShader.MakeLinear([skia.Point(760, 0), skia.Point(1100, 0)], [K.C((10, 12, 34), 190), K.C((10, 12, 34), 0)])))
        ta = ww(k, 'acetylene') - 0.3; a = ease(t, ta, ta + 0.8)
        if a > 0.01:
            x, y, R = 560, 520, 400
            cnt = lerp(0.0, 0.45, ease(t, ww(k, 'bond', 1) - 0.3, ww(k, 'hydrogen', 1) + 0.4)); cnt = lerp(cnt, 1.0, ease(t, ww(k, 'triple', 1) - 0.3, ww(k, 'makes') + 0.6))
            LT.acetylene(c, t, x, y, R, a, count=cnt if t > c2 else 0.0, line=ease(t, ww(k, 'all') - 0.2, ww(k, 'straight') + 0.6))
            O.hyb_chip(c, 'sp', x + 300, 150, 76, ua(t, ww(k, 'plain') + 0.5, 0.4))
            if t < c2 - 0.2: cap(c, 'acetylene: 2 carbons, a triple bond', t, ta + 0.6, 1000, x, 46)
    elif t < tD:                                                 # C2: the yellow flame tightens to the blue cone
        S.macro_cut(c, t, 0.32, k=(lerp(0.0, 0.3, ease(t, tC + 0.5, tC + 1.1)) if t < tC2 else lerp(0.3, 1.0, ease(t, tC2 + 0.3, ww(k, 'oxygen') + 0.5))) if t < tD - 0.9 else 1.0)
        cap(c, 'over 3,000 °C', t, ww(k, 'three') - 0.1, 170, 1400, 76, AMBER)
    else:                                                        # D: the cut
        S.macro_cut(c, t, lerp(0.32, 0.94, ease(t, tD, fin(k) + 0.6)))
    finish(c, t)


# ------------------------------------------------------------------ end: the square at sunrise
def _shadow(c, x, g, s):
    """a long morning shadow falling to screen left, like the buildings' (the sun is low at screen right)"""
    p = skia.Path(); p.moveTo(x - 60 * s, g + 6 * s); p.lineTo(x + 70 * s, g + 2 * s); p.lineTo(x - 760 * s, g + 150 * s); p.lineTo(x - 900 * s, g + 120 * s); p.close()
    c.drawPath(p, P((60, 44, 86), 70, MaskFilter=K.blur(10 * s + 3)))


def _square(c, t, pull):
    S.square_back(c, t)
    for i, (who, (x, g, s)) in enumerate(zip(('town_a', 'town_b', 'town_c'), S.TOWN)):
        sd = 1 if x < 1100 else -1
        ps = CA.pose_watch(t, 0.2 + 0.31 * i, look=(0.9 * sd, -0.3)); ps.cfg = CA.LOOKS[who]['cfg']; ps.head_yaw = 0.42 * sd + 0.04 * math.sin(t * 0.4 + i)
        ps.sway = (-9, 6, -4)[i] + 1.5 * math.sin(t * 0.3 + i); ps.r_up, ps.l_up = (4, 12, 6)[i], (11, 5, 14)[i]; ps.r_fore, ps.l_fore = (10, 22, 4)[i], (20, 6, 16)[i]
        ps.smile = 0.5 + 0.04 * pull
        _shadow(c, x, g, s); CA.draw(c, who, ps, x, g, s)
    x, g, s = S.INES_SQ['x'], S.INES_SQ['ground'], S.INES_SQ['s']
    _shadow(c, x, g, s)
    S.plinth(c); S.heron_statue(c, t)
    if pull < 0.99:
        hold = S.cover(c, t, pull=pull)
        ps = CA.pose_pull(t, min(1.0, pull / 0.6), x, g, s)
        tgt = hold                                               # her fist stays exactly on the cloth's corner
        for _ in range(4):
            CA.arm_to(ps, 'l', tgt, x, g, s, 'ines_day', bend=1); tip = CA.tool_tip(ps, 'l', x, g, s, 'ines_day')
            tgt = (tgt[0] + hold[0] - tip[0], tgt[1] + hold[1] - tip[1])
        CA.arm_to(ps, 'l', tgt, x, g, s, 'ines_day', bend=1)
    else:
        ps = CA.idle(t, 0.3, look=(0.9, -0.5)); ps.cfg = CA.LOOKS['ines_day']['cfg']; CA.face(ps, 'smile'); ps.look = (0.9, -0.5); ps.head_yaw = 0.45; ps.head_tilt = -3; ps.sway = 8; ps.smile = 0.5
    CA.draw(c, 'ines_day', ps, x, g, s)


def end(c, t):
    k = 'end'; t0, c1, c2, c3, c4 = cues(k, 4)
    tB = c2 - 0.1; tD = ww(k, 'what') - 0.3
    if t < tB:                                                   # A: morning; Ines holds the cover's corner, then pulls it off
        g = ease(t, t0 - 1, tB); z = lerp(1.22, 1.3, g)
        c.save(); c.translate(960, 560); c.scale(z, z); c.translate(-940, -640)
        _square(c, t, 0.97 * ease(t, ww(k, 'pulls') - 0.2, tB + 0.6)); c.restore()
    elif t < tD:                                                 # B: the steel heron in the first sun, a slow rise up its neck
        g = (t - tB) / (tD - tB); z = lerp(1.5, 1.62, g)
        c.save(); c.translate(960, lerp(470, 560, sm(g))); c.scale(z, z); c.translate(-1100, -560)
        S.square_back(c, t); S.plinth(c); S.heron_statue(c, t); c.restore()
        gx = lerp(760, 1300, g)
        c.drawOval(skia.Rect(gx - 60, 80, gx + 60, 1000), P((255, 244, 210), 26, MaskFilter=K.blur(40)))
    else:                                                        # C: calm wide for the end screen
        _square(c, t, 1.0)
        a = ua(t, ww(k, 'levl') - 0.3, 0.4)
        if a > 0.01:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(330, 96, 1010, 250), 40, 40), P((14, 18, 44), 225 * a))
            K.hand(c, 'levlprep.com', 670, 204, 104, CREAM, ua(t, ww(k, 'levl') - 0.2, 1.0), 'center')
        cap(c, 'notes and practice, free', t, ww(k, 'free') - 0.6, 312, 670, 52, AMBER) if t < c4 - 0.2 else cap(c, 'next: hybridization, part 2', t, c4, 312, 670, 52, AMBER)
    finish(c, t)


SCENES = dict(hook=hook, c7=c7, d5=d5, e6=e6, end=end)
