"""w1101-04-cane-toads, premium pass 2 (fresh eyes review 6/10 on build3). Fixes:
1 every place change is an accelerating push plus zoom cut (small zoom aimed near frame centre so chips stay whole); titles
  hold until the cut and the next one starts on it, so no beat is titleless;
2 labels stay inside the frame (gentler pushes, GORDONVALE fades in after the settle);
3 per scene grade: more contrast and saturation in the beetle close up and on the night road; sun shafts that read as light
  (plus blending); real headlights at the bottom of the frame with bloom and beams that fall off with distance;
4 "the toads were supposed to eat the beetles" now shows the plan: toads out in the cane looking up, one lunging at a beetle;
5 toads leaving the crate stay on the ground plane;
6 the poison is milky ooze from the parotoid gland; the snake bites the toad's back by the gland; on "died" it rolls belly up
  and goes still;
7 the bony ridges are low ridges hugging the top of the eyes;
8 the map toads sit on land, clear of the watermark; a heron catching a toad appears beside PREDATORS;
9 "almost everything else": a beetle, a snail, a small frog and a mouse are eaten;
10 the night road crowd stays above y 1300, clear of captions and watermark."""
import sys, math
sys.path[:0] = ['/home/claude/toads2', '/home/claude/lp/w1101/lib']
import numpy as np, skia, cv2
import build3 as P3
from build3 import B0, old, blur_layer, near_leaves, dust, lerp, ease_out_
from lpk import *
import layout as L

smooth_closed, flat = B0.smooth_closed, B0.flat
T = B0.T
Y, R, Wt, Tl = B0.Y, B0.R, B0.Wt, B0.Tl
TOAD, TOAD_SH, TOAD_DK, BELLY = P3.TOAD, P3.TOAD_SH, P3.TOAD_DK, P3.BELLY


# ------------------------------------------------------------------ the toad: low bony ridges over the eyes (no hook)
def toad(c, x, y, s, t, hop=0.0, face=1, gulp=0.0, ooze=0.0, tongue=0.0, ph=0.0, shadow=True, look_up=0.0):
    c.save(); c.translate(x, y); c.scale(s * face, s)
    lift = 4 * hop * (1 - hop)
    br = 1 + 0.03 * math.sin(t * 5 + ph)
    if shadow: c.drawOval(skia.Rect(-46, -4, 46, 8), P((40, 30, 20), 90 * (1 - lift * 0.6), MaskFilter=blur(5)))
    c.translate(0, -lift * 90)
    c.rotate(-18 * math.sin(math.pi * hop) - 16 * look_up)
    st = math.sin(math.pi * hop)
    c.drawPath(smooth_closed([(-30, -10), (-48 - 30 * st, 2 + 6 * st), (-30 - 40 * st, 8 + 10 * st), (-14, -2)]), P(TOAD_DK))
    body = smooth_closed([(-44, -14), (-38, -38), (-8, -50), (22, -46), (40, -32), (50, -17), (40, -4), (0, 2 * br), (-34, -2)])
    flat(c, body, TOAD, TOAD_SH, sh_off=(0, 9), rim=(255, 214, 140), rim_d=(0, -3), rim_a=180)
    c.drawPath(smooth_closed([(-30, -6), (0, -4), (38, -10), (42, -4), (0, 3 * br), (-30, 0)]), P(BELLY))
    rs = np.random.default_rng(3)
    for k in range(24):
        wx, wy = rs.uniform(-38, 28), rs.uniform(-46, -14)
        r = rs.uniform(2.0, 4.2)
        c.drawCircle(wx, wy, r, P(TOAD_DK)); c.drawCircle(wx - 0.9, wy - 0.9, r * 0.45, P((196, 168, 112)))
    # the parotoid gland behind the eye
    c.drawPath(smooth_closed([(2, -44), (14, -52), (30, -46), (26, -36), (8, -34)]), P((176, 144, 84)))
    c.drawPath(smooth_closed([(6, -42), (14, -48), (24, -44), (20, -38), (10, -37)]), P((190, 158, 96)))
    for k in range(6): c.drawCircle(8 + k * 3.5, -41 + (k % 2) * 3, 1.3, P((120, 96, 56)))
    if ooze > 0.01:      # milky toxin welling out of the gland and running down the side
        for k, (ox, oy, rr) in enumerate([(12, -42, 7), (20, -40, 6), (16, -37, 5)]):
            g = min(1.0, ooze * 1.4 - k * 0.15)
            if g <= 0: continue
            c.drawCircle(ox, oy, rr * g, P((246, 242, 226), 215 * g, MaskFilter=blur(1.2)))
        drip = max(0.0, ooze - 0.35) / 0.65
        if drip > 0:
            c.drawPath(smooth_closed([(15, -38), (21, -38), (20, -36 + 18 * drip), (18, -32 + 20 * drip), (16, -36 + 18 * drip)]), P((246, 242, 226), 200))
    # eye, horizontal pupil, and a low bony ridge hugging the top of the eye toward the snout
    c.drawCircle(32, -45, 9, P((70, 56, 30)))
    c.drawCircle(33, -46, 6.8, P((206, 160, 58)))
    c.drawOval(skia.Rect(27, -48, 39, -44), P((18, 14, 10)))
    c.drawCircle(35, -49, 1.8, P((255, 250, 230)))
    ridge_ = skia.Path(); ridge_.moveTo(24, -52.5); ridge_.quadTo(33, -56.5, 42, -52); ridge_.lineTo(47, -46)
    c.drawPath(ridge_, SP((120, 96, 56), 3.4))
    if tongue > 0.01:
        L_ = 70 * tongue
        c.drawLine(48, -20, 48 + L_, -26 - 10 * tongue, SP((226, 120, 130), 6))
        c.drawCircle(48 + L_, -26 - 10 * tongue, 6, P((236, 130, 140)))
    fx, fy = 36 + 12 * st, 2 + 4 * st
    flat(c, smooth_closed([(18, -22), (30, -20), (fx + 4, fy - 4), (fx - 6, fy), (20, -8)]), TOAD, TOAD_SH, sh_off=(3, 0), rim=(255, 214, 140), rim_d=(-1.5, 0), rim_a=150)
    for k in range(3): c.drawLine(fx - 2, fy, fx + 4 + k * 6, fy + 3 - k * 0.5, SP(TOAD_SH, 4.5))
    flat(c, smooth_closed([(-44, -22), (-26, -30), (-8, -16), (-14, -4), (-36, -6)]), TOAD, TOAD_SH, sh_off=(0, 5), rim=(255, 214, 140), rim_d=(0, -2), rim_a=170)
    kx, ky = -10 - 40 * st, -4 + 16 * st
    ax_, ay_ = -40 - 60 * st, 4 + 16 * st
    flat(c, smooth_closed([(-14, -10), (kx + 4, ky - 4), (ax_, ay_ - 4), (ax_ - 2, ay_ + 4), (kx - 4, ky + 6), (-22, -2)]), TOAD, TOAD_SH, sh_off=(0, 4), rim=(255, 214, 140), rim_d=(0, -2), rim_a=150)
    c.drawPath(smooth_closed([(ax_, ay_ - 3), (ax_ + 30 - 50 * st, ay_ - 1 + 6 * st), (ax_ + 34 - 56 * st, ay_ + 5 + 6 * st), (ax_, ay_ + 6)]), P(TOAD_SH))
    mp = skia.Path(); mp.moveTo(46, -20); mp.quadTo(36, -16, 24, -23)
    c.drawPath(mp, SP((80, 60, 34), 3))
    c.restore()


old.toad = toad; B0.toad = toad; P3.toad = toad


def sun_shafts(c, t, sx=980, sy=220, a=1.0):
    """warm shafts through the cane that read as light on a phone: soft screened fans plus a brighter additive core"""
    for k in range(6):
        ang = math.radians(114 + k * 10 + 2 * math.sin(t * 0.3 + k))
        w = 0.03 + 0.018 * (k % 3)
        p = skia.Path(); p.moveTo(sx, sy)
        for s_ in (-w, w): p.lineTo(sx + 2600 * math.cos(ang + s_), sy + 2600 * math.sin(ang + s_))
        p.close()
        br = (0.8 + 0.2 * math.sin(t * 0.7 + k)) * a
        c.drawPath(p, P((255, 226, 160), 40 * br, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
        c.drawPath(p, P((255, 222, 150), 22 * br, MaskFilter=blur(12), BlendMode=skia.BlendMode.kPlus))
    c.drawCircle(sx, sy, 260, P((255, 236, 180), 70 * a, MaskFilter=blur(90), BlendMode=skia.BlendMode.kScreen))


SHOT_PLAN2 = T['supposed'] - 0.1          # the crate opens, then the plan: toads in the cane after the beetles
SH = dict(A=0.0, B1=B0.SHOT_B1, B2=B0.SHOT_B2, P2=SHOT_PLAN2, C=B0.SHOT_C, D=B0.SHOT_D, E=B0.SHOT_E, F=B0.SHOT_F, G=B0.SHOT_G)


# ------------------------------------------------------------------ A, B1
def shot_a(c, t):
    B0.shot_a(c, t); sun_shafts(c, t, 980, 240, 0.9); near_leaves(c, t)


def shot_b1(c, t):
    B0.shot_b1(c, t); sun_shafts(c, t, 1000, 160, 0.8)


# ------------------------------------------------------------------ B2: the lid comes off and the toads pour out (on the ground)
def shot_b2(c, t):
    tb = t - B0.SHOT_B2
    z = 2.0 - 0.25 * smooth(tb / 1.0)
    c.save(); c.translate(540, 1060); c.scale(z, z); c.translate(-520, -1240)
    old.field(c, t, sun=False)
    c.drawOval(skia.Rect(470 - 170, 1322, 470 + 170, 1342), P((60, 40, 26), 120, MaskFilter=blur(6)))
    lid = smooth((tb + 0.1) / 0.4)
    B0.crate(c, 470, 1330, t, lid, peek=1 - smooth((tb - 0.05) / 0.3))
    for i in range(8):
        u = tb - (0.1 + i * 0.1)
        if u < 0: continue
        dirx = [1, -1, 1, -1, 1, 1, -1, 1][i]
        rx = 470 + dirx * [118, 112, 104, 120, 108, 114, 100, 116][i]
        rim_y = 1160
        if u < 0.2:
            k = u / 0.2
            c.save(); c.clipRect(skia.Rect(320, 0, 620, rim_y + 2))
            toad(c, rx, rim_y + 60 * (1 - k), 0.9, t, face=dirx, ph=i, shadow=False); c.restore()
            continue
        v = u - 0.2
        prog = min(1.0, v / 0.45)
        gy = 1340 + (i % 4) * 10
        if prog < 1:      # a short drop off the rim, low arc, landing on the ground in front of the crate
            x = rx + dirx * 120 * prog
            y = rim_y + (gy - rim_y) * prog ** 1.4 - 26 * math.sin(math.pi * prog)
            toad(c, x, y, 0.95, t, hop=0.5 * prog, face=dirx, ph=i, shadow=False)
        else:
            w = v - 0.45
            n, hp = B0.hop_cycle(w, 0.7, 0.45, 0)
            x = rx + dirx * (120 + (n + (hp if hp > 0 else 1.0)) * 55)
            toad(c, x, gy, 0.95, t, hop=hp, face=dirx, ph=i)
            dust(c, rx + dirx * 120, gy, w, 0.95)
    c.restore()
    sun_shafts(c, t, 980, 240, 0.8); near_leaves(c, t)


# ------------------------------------------------------------------ P2: the plan, toads in the cane going after a beetle
def shot_plan(c, t):
    tp = t - SHOT_PLAN2
    c.save(); c.translate(540, 1000); c.scale(2.3, 2.3); c.translate(-560, -1180)
    old.field(c, t, sun=False)
    c.restore()
    # a near cane stalk with a beetle on a low leaf: the toads are below it, looking up; one lunges
    sx = 600; sw = 6 * math.sin(t * 1.3)
    c.drawLine(sx, 1260, sx + sw, 380, SP((132, 160, 70), 30))
    for j in range(1, 9):
        f = j / 9; c.drawLine(sx + sw * f - 16, 1260 - 880 * f, sx + sw * f + 16, 1260 - 880 * f, SP((100, 120, 52), 7))
    leaf = skia.Path(); leaf.moveTo(sx + sw * 0.5, 820); leaf.quadTo(sx + 170, 740 + 6 * math.sin(t * 2), sx + 330, 820)
    c.drawPath(leaf, SP((116, 166, 84), 26))
    old.beetle(c, sx + 170 + sw * 0.5, 766, 2.2, t)
    for i, (x, s, face) in enumerate([(300, 1.5, 1), (880, 1.45, -1), (470, 1.75, 1)]):
        lunge = 0.0; dx = 0.0
        if i == 2:
            u = tp - 0.55
            if 0 < u < 0.7: lunge = u / 0.7
        y = 1190 + i * 18
        toad(c, x, y, s, t, hop=lunge, face=face, ph=i, look_up=0.0 if lunge > 0 else 1.0, tongue=math.exp(-((tp - 0.85) / 0.1) ** 2) if i == 2 else 0.0)
        if i == 2 and tp > 1.25: dust(c, x, y, tp - 1.25, 1.9)
    sun_shafts(c, t, 1000, 200, 0.9); near_leaves(c, t)


# ------------------------------------------------------------------ C: the stalk (build3), with shafts
shot_c = P3.shot_c


# ------------------------------------------------------------------ D: everything else, then the snake and the poison
def prey(c, kind, x, y, t, s=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    if kind == 'beetle':
        old.beetle(c, 0, -6, 1.0, t)
    elif kind == 'snail':
        c.drawPath(smooth_closed([(-22, 0), (-10, -6), (20, -6), (30, -12), (34, -4), (20, 2)]), P((200, 176, 140)))
        c.drawCircle(-4, -16, 16, P((150, 96, 52))); c.drawCircle(-4, -16, 10, P((176, 120, 66))); c.drawCircle(-4, -16, 4, P((120, 76, 40)))
        c.drawLine(30, -12, 36, -24, SP((180, 156, 120), 2.5)); c.drawLine(26, -12, 28, -24, SP((180, 156, 120), 2.5))
    elif kind == 'frog':
        hop = max(0.0, math.sin(t * 5)) * 4
        c.translate(0, -hop)
        c.drawPath(smooth_closed([(-18, 0), (-12, -14), (6, -18), (18, -10), (20, -2), (0, 2)]), P((110, 160, 80)))
        c.drawCircle(12, -16, 5, P((110, 160, 80))); c.drawCircle(13, -17, 2.5, P((20, 20, 16)))
        c.drawPath(smooth_closed([(-16, -2), (-26, 2), (-14, 4)]), P((90, 136, 64)))
    elif kind == 'mouse':
        c.drawPath(smooth_closed([(-22, 0), (-18, -14), (4, -18), (20, -10), (26, -4), (18, 0)]), P((150, 136, 124)))
        c.drawCircle(10, -18, 6, P((176, 150, 140))); c.drawCircle(21, -9, 2, P((20, 18, 16)))
        tail = skia.Path(); tail.moveTo(-22, -4); tail.quadTo(-40, -2 + 4 * math.sin(t * 6), -52, -10)
        c.drawPath(tail, SP((190, 150, 140), 2.5))
    c.restore()


def snake2(c, t, x0, y0, head, strike, limp, belly_up):
    """a black snake along the ground; its head lifts to bite at `head` on the strike; dead, it rolls belly up and lies still"""
    pts = []
    for k in range(40):
        f = k / 39
        amp = 24 * (1 - limp) * (1 - f * 0.3)
        x = x0 + f * 440
        y = y0 + amp * math.sin(f * 9 - t * 3 * (1 - limp)) + f * 8
        pts.append([x, y])
    # the front of the body rises toward the bite point
    for k in range(10):
        w = (1 - k / 10) ** 1.5 * strike * (1 - limp * 0.9)
        pts[k][0] = lerp(pts[k][0], head[0] + k * 22, w)
        pts[k][1] = lerp(pts[k][1], head[1] + k * 6, w)
    back_col, belly_col = (30, 28, 34), (226, 206, 176)
    for k in range(len(pts) - 1):
        w = 26 - 18 * (k / 39) ** 1.5
        c.drawLine(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], SP(back_col, w))
    stripe = skia.Path(); off = -0.3 if belly_up else 0.32
    stripe.moveTo(pts[1][0], pts[1][1] + (26 * off))
    for k in range(2, len(pts)): stripe.lineTo(pts[k][0], pts[k][1] + (26 - 18 * (k / 39) ** 1.5) * off)
    c.drawPath(stripe, skia.Paint(AntiAlias=True, Color=C((196, 60, 54) if not belly_up else belly_col), Style=skia.Paint.kStroke_Style, StrokeWidth=7 if not belly_up else 11, StrokeCap=skia.Paint.kButt_Cap))
    hx, hy = pts[0]
    c.save(); c.translate(hx, hy); c.scale(1, -1 if belly_up else 1)
    c.drawPath(smooth_closed([(-30, 0), (-10, -14), (10, -10), (14, 4), (-10, 12)]), P((24, 22, 28)))
    if belly_up:
        c.drawLine(-18, -6, -10, 0, SP((200, 190, 180), 2.5)); c.drawLine(-18, 0, -10, -6, SP((200, 190, 180), 2.5))
        c.drawPath(smooth_closed([(-30, 2), (-44, 6), (-30, 6)]), P((200, 70, 80)))          # tongue hanging out
    else:
        c.drawCircle(-14, -4, 3, P((255, 220, 120)))
        if strike > 0.5: c.drawLine(-30, 2, -24, 8, SP((240, 236, 220), 2.5))               # fang
    c.restore()


def shot_d(c, t):
    k2 = smooth((t - T['poisonous'] + 1.2) / 0.9)
    z = 2.6
    fx_, fy_ = 470 + 210 * k2, 1260 + 120 * k2
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-fx_, -fy_)
    old.field(c, t, tilt=0, sun=False)
    # everything else: a beetle, a snail, a small frog and a mouse, each snapped up by a toad's tongue
    meals = [((380, 1262), 'beetle', T['ate']), ((470, 1292), 'snail', T['ate'] + 0.5), ((560, 1262), 'frog', T['ate'] + 1.0), ((470, 1292), 'mouse', T['ate'] + 1.6)]
    if k2 < 0.5:
        for i, (pos, kind, tf) in enumerate(meals):
            px, py = pos[0] + 62, pos[1] - 4
            if kind == 'mouse': px += 16 * math.sin(t * 3)
            if t < tf + 0.05: prey(c, kind, px + (6 * math.sin(t * 4 + i) if kind != 'snail' else 0), py, t, 0.85)
        for i, (x, y) in enumerate(((380, 1262), (470, 1292), (560, 1262))):
            tg = sum(math.exp(-((t - tf) / 0.12) ** 2) for (pos, kind, tf) in meals if pos == (x, y))
            toad(c, x, y, 0.8, t, tongue=min(1.0, tg), ph=i, gulp=0)
    # the snake and the poison
    st = T['many'] - 0.4
    strike = smooth((t - st) / 0.25)
    dead = T['died'] - 0.1
    limp = smooth((t - dead) / 0.6)
    ooze = smooth((t - st - 0.25) / 0.9)
    if t > T['poisonous'] - 1.0:
        sx = 1200 - 420 * smooth((t - T['poisonous'] + 1.0) / 1.2)
        thp = 0.0; dx = 0
        if t > T['died'] + 0.6:
            n, thp = B0.hop_cycle(t - T['died'] - 0.6, 0.8, 0.5)
            dx = -90 * (n + (thp if thp > 0 else 1))
        tx = 640 + dx
        toad(c, tx, 1400, 1.25, t, hop=thp, face=1 if dx == 0 else -1, ooze=ooze * (1 - smooth((t - T['died'] - 1.4) / 0.6)))
        bite = (640 + 18 * 1.25 + 10, 1400 - 50 * 1.25)        # the toad's back, at the gland behind its eye
        roll = smooth((t - dead) / 0.3)
        snake2(c, t, sx, 1380, bite, strike * (1 - roll), limp, roll > 0.5)
    c.restore()
    if t > T['poisonous']:
        z = 2.6; fx_, fy_ = 680, 1380
        gx = 540 + (640 + 16 * 1.25 - fx_) * z; gy = 1000 + (1400 - 46 * 1.25 - fy_) * z
        L.chip(c, 'POISON GLANDS', 420, 760, Y, 42, smooth((t - T['poisonous']) / 0.3) * (1 - smooth((t - dead + 0.2) / 0.3)), anchor=(gx, gy))
    near_leaves(c, t, 0.8)


# ------------------------------------------------------------------ E: the Americas, with a heron catching a toad
def heron(c, x, y, t, s=1.0, k=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    grey, dk = (150, 164, 180), (104, 116, 134)
    c.drawLine(-6, 0, -14, 60, SP((210, 170, 80), 4)); c.drawLine(8, 0, 6, 60, SP((210, 170, 80), 4))
    c.drawPath(smooth_closed([(-40, -10), (-20, -40), (20, -44), (40, -24), (20, 0), (-24, 2)]), P(grey))
    c.drawPath(smooth_closed([(-40, -10), (-30, -26), (-6, -30), (-20, -4)]), P(dk))
    dip = 14 * math.sin(t * 3) * (1 - k)
    neck = skia.Path(); neck.moveTo(30, -34); neck.cubicTo(60, -70, 30, -100 + dip, 54, -118 + dip)
    c.drawPath(neck, SP(grey, 10))
    c.drawCircle(56, -120 + dip, 9, P(grey)); c.drawCircle(59, -123 + dip, 2, P((20, 20, 24)))
    c.drawPath(poly([(62, -124 + dip), (104, -112 + dip), (62, -116 + dip)]), P((220, 180, 80)))
    c.restore()


def shot_e(c, t):
    lon0, lon1, lat0, lat1 = -170, -30, -56, 72
    box = (120, 520, 1000, 1400)
    old.sea(c, t)
    zz = 1.0 + 0.04 * smooth((t - B0.SHOT_E) / 4)
    c.save(); c.translate(560, 920); c.scale(zz, zz); c.translate(-560, -920)
    old.land(c, old.proj(old.AMER, lon0, lon1, lat0, lat1, box))
    nat = old.proj(old.NATIVE, lon0, lon1, lat0, lat1, box)
    a = smooth((t - T['americas'] + 0.2) / 0.5)
    pth = smooth_closed(nat)
    c.drawPath(pth, P((110, 150, 70), 210 * a)); c.drawPath(pth, SP((70, 110, 50), 3, 255 * a))
    tx, ty = old.proj([(-63, -4)], lon0, lon1, lat0, lat1, box)[0]
    toad(c, tx, ty, 0.75, t, ph=1)           # on land, in the native range
    c.restore()
    L.chip(c, 'NATIVE RANGE', 360, 900, Tl, 34, a, anchor=(640, 1010))
    # beside PREDATORS: a round inset of a heron snatching a toad
    g = smooth((t - T['predators'] + 0.1) / 0.35)
    if g > 0:
        cx, cy, r = 330, 1160, 140 * (0.7 + 0.3 * g)
        c.save(); c.saveLayerAlpha(None, int(255 * g))
        clip = skia.Path(); clip.addCircle(cx, cy, r)
        c.drawCircle(cx, cy, r + 6, P((255, 210, 63)))
        c.clipPath(clip, skia.ClipOp.kIntersect, True)
        lgrad(c, skia.Rect(cx - r, cy - r, cx + r, cy + r), cy - r, cy + r, [(150, 190, 120), (90, 130, 70)])
        c.drawRect(skia.Rect(cx - r, cy + 50, cx + r, cy + r), P((96, 120, 70)))
        k = smooth((t - T['predators'] - 0.2) / 0.4)
        heron(c, cx - 30, cy + 40, t, 0.95, k)
        tk = (cx - 30 + 0.95 * 104 * k + (cx + 30) * (1 - k) * 0, cy + 40 - 0.95 * 112 * k)
        toad(c, lerp(cx + 50, cx - 30 + 0.95 * 92, k), lerp(cy + 62, cy + 40 - 0.95 * 112, k), 0.55, t, ph=4, shadow=k < 0.2)
        c.restore(); c.restore()
    L.chip(c, 'PREDATORS', 330, 985, Y, 38, smooth((t - T['predators']) / 0.3))
    L.chip(c, 'DISEASES', 820, 1250, Y, 38, smooth((t - T['diseases']) / 0.3))


# ------------------------------------------------------------------ F: Australia (old map code; toad on land, chips settle first)
def shot_f(c, t):
    keep_toad = old.toad
    old.toad = lambda *a, **k: None          # draw the old map without its toad (it sat in the ocean)
    save = old.SHOT_D2; old.SHOT_D2 = B0.SHOT_F + 0.5          # GORDONVALE fades in once the camera has settled
    old.shot_d2(c, t)
    old.SHOT_D2 = save; old.toad = keep_toad
    lon0, lon1, lat0, lat1 = 110, 156, -46, -8
    box = (40, 560, 1040, 1386)
    tx, ty = old.proj([(143.5, -21.5)], lon0, lon1, lat0, lat1, box)[0]
    toad(c, tx, ty + 20, 0.7, t, face=-1, ph=2)


# ------------------------------------------------------------------ G: the night road, crowd above the captions, real headlights
RNG = np.random.default_rng(21)
_NT = []
for k in range(150):
    d = RNG.uniform(0, 1) ** 1.6
    y = 965 + 335 * d ** 1.2
    hw = 130 + 820 * (y - 960) / 900
    x = 540 + RNG.uniform(-1.45, 1.45) * hw
    _NT.append((x, y, k, RNG.uniform(0, 1)))
_NT.sort(key=lambda q: q[1])


def shot_g(c, t):
    te = t - B0.SHOT_G
    zz = 1.0 + 0.08 * smooth(te / 8)
    c.save(); c.translate(540, 1150); c.scale(zz, zz); c.translate(-540, -1150)
    lgrad(c, skia.Rect(-100, -100, 1200, 1200), 300, 1100, [(8, 12, 34), (26, 32, 70), (46, 44, 84)])
    rs = np.random.default_rng(11)
    for k in range(80):
        c.drawCircle(rs.uniform(0, 1080), rs.uniform(450, 1000), rs.uniform(0.8, 2.2), P((240, 240, 255), 140 + 80 * math.sin(t * 2 + k)))
    c.drawCircle(220, 640, 40, P((240, 240, 252))); c.drawCircle(220, 640, 110, P((200, 210, 255), 40, MaskFilter=blur(40)))
    c.drawPath(ridge(jag([(-100, 960), (300, 900), (700, 940), (1200, 890)], 3, 5)), P((22, 26, 50)))
    old.cane_row(c, t, 960, 200, 30, (36, 54, 46), (32, 50, 42), (26, 40, 34), 4, 7, step=38)
    c.drawRect(skia.Rect(-100, 950, 1200, 2100), P((30, 30, 40)))
    road = poly([(420, 950), (660, 950), (1500, 2100), (-420, 2100)])
    c.drawPath(road, P((50, 48, 58)))
    for k in range(6):
        f = ((k / 6 + te * 0.15) % 1.0)
        y = 950 + 1000 * f * f; w = 6 + 30 * f
        c.drawRect(skia.Rect(540 - w / 2, y, 540 + w / 2, y + 20 + 60 * f), P((222, 212, 172), 220))
    # headlight beams on the road, bright near the car and falling off with distance
    for sgn in (-1, 1):
        lx = 540 + sgn * 300
        beam = poly([(lx - 70, 2000), (lx + 70, 2000), (540 + sgn * 150, 975), (540 + sgn * 40, 975)])
        sh = skia.GradientShader.MakeLinear([skia.Point(0, 2000), skia.Point(0, 975)], [C((255, 236, 186), 150), C((255, 236, 186), 0)])
        c.drawPath(beam, skia.Paint(AntiAlias=True, Shader=sh, BlendMode=skia.BlendMode.kPlus, MaskFilter=blur(24)))
    c.save(); c.clipPath(road, skia.ClipOp.kIntersect, True)
    pool = skia.GradientShader.MakeRadial(skia.Point(540, 1900), 760, [C((255, 230, 170), 110), C((255, 230, 170), 0)], [0, 1])
    c.drawRect(skia.Rect(-400, 1100, 1500, 2100), skia.Paint(Shader=pool, BlendMode=skia.BlendMode.kPlus))
    c.restore()
    cnt = int(70 + 80 * smooth((t - T['millions'] + 0.3) / 2.5))
    for x, y, k, ph in [q for q in _NT if q[2] < cnt]:
        d = (y - 960) / 340
        s = 0.2 + 0.85 * d
        n, hp = B0.hop_cycle(t, 1.4 + ph * 1.2, 0.25, ph * 3)
        drift = ((n % 4) - 1.5) * 10 * s * (1 if k % 2 else -1)
        toad(c, x + drift, y, s, t, hop=hp, face=1 if k % 2 else -1, ph=k)
    c.restore()
    # the car's two headlamps at the bottom edge, the source of the light (bloom comes from the film pass)
    for sgn in (-1, 1):
        hx, hy = 540 + sgn * 300, 1880
        c.drawCircle(hx, hy, 220, P((255, 228, 170), 70, MaskFilter=blur(80), BlendMode=skia.BlendMode.kScreen))
        c.drawCircle(hx, hy, 90, P((255, 240, 200), 200, MaskFilter=blur(20), BlendMode=skia.BlendMode.kPlus))
        c.drawCircle(hx, hy, 46, P((255, 252, 240)))
    L.chip(c, '1935: ABOUT 100', 540, 800, Wt, 44, smooth((t - T['first']) / 0.3))


# ------------------------------------------------------------------ edit: every place change is an accelerating push + zoom cut
SCENES = [('A', shot_a), ('B1', shot_b1), ('B2', shot_b2), ('P2', shot_plan), ('C', shot_c), ('D', shot_d), ('E', shot_e), ('F', shot_f), ('G', shot_g)]
FOCUS = {'B1': (420, 1150), 'B2': (540, 960), 'P2': (560, 980), 'C': (560, 860), 'D': (540, 1000), 'E': (560, 1100), 'F': (600, 980), 'G': (600, 980)}
SETTLE = {'B1': (540, 900), 'B2': (520, 1060), 'P2': (560, 1100), 'C': (560, 1000), 'D': (540, 1000), 'E': (560, 980), 'F': (820, 900), 'G': (540, 1100)}
PRE, POST, ZIN, ZOUT = 0.45, 0.45, 1.22, 1.16


def scene(c, t):
    keys = [k for k, _ in SCENES]
    idx = max(i for i, k in enumerate(keys) if t >= SH[k])
    name, fn = SCENES[idx]
    nxt = keys[idx + 1] if idx + 1 < len(keys) else None
    c.save()
    if nxt and SH[nxt] - PRE < t:
        k = ((t - (SH[nxt] - PRE)) / PRE) ** 2.2
        z = 1 + (ZIN - 1) * k; fx, fy = FOCUS[nxt]
        c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy)
    elif name in SETTLE and t < SH[name] + POST:
        k = 1 - (1 - (t - SH[name]) / POST) ** 2.2
        z = ZOUT - (ZOUT - 1) * k; fx, fy = SETTLE[name]
        c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy)
    fn(c, t)
    c.restore()


def titles(c, t):
    S = SH
    seq = [(-0.5, S['B1'], [[('CANE TOADS', Y)], [('TO SAVE THE CANE', Wt)]]),
           (S['B1'], S['B2'], [[('BEETLES WERE', Wt)], [('EATING THE CANE', R)]]),
           (S['B2'], S['C'], [[('THE PLAN:', Wt)], [('TOADS EAT BEETLES', Tl)]]),
           (S['C'], S['D'], [[('THE BEETLES', Wt)], [('LIVED UP HIGH', Y)]]),
           (S['D'], T['poisonous'] - 0.05, [[('THEY ATE', Wt)], [('EVERYTHING ELSE', Y)]]),
           (T['poisonous'] - 0.05, S['E'], [[('AND THEY WERE', Wt)], [('POISONOUS', R)]]),
           (S['E'], S['F'], [[('BACK HOME,', Wt)], [('KEPT IN CHECK', Tl)]]),
           (S['F'], T['invasive'] - 0.4, [[('IN AUSTRALIA,', Wt)], [('ALMOST NOTHING', R)]]),
           (T['invasive'] - 0.4, S['G'], [[('AN INVASIVE', Wt)], [('SPECIES', Y)]]),
           (S['G'], None, [[('MILLIONS', R)], [('FROM ONE SHIPMENT', Wt)]])]
    for a, b, lines in seq:
        L.title(c, lines, t, a - 0.02, (b + 0.12) if b is not None else None)


def GRADE(t):
    """(saturation, contrast, midtone lift) per scene"""
    if SH['B1'] <= t < SH['B2']: return 1.28, 1.16, 1.0
    if t >= SH['G']: return 1.06, 1.14, 1.0
    if SH['E'] <= t < SH['G']: return 1.08, 1.06, 1.0
    return 1.1, 1.08, 1.0


_GRAIN = np.random.default_rng(3)
_VIG = None


def finish(img, t):
    global _VIG
    sat, con, lift = GRADE(t)
    x = img[:, :, :3].astype(np.float32) / 255.0
    lum = x @ np.array([0.114, 0.587, 0.299], np.float32)
    hi = np.clip((lum - 0.7) / 0.3, 0, 1)[..., None] * x
    small = cv2.resize(hi, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bl = cv2.resize(cv2.GaussianBlur(small, (0, 0), 12), (W, H), interpolation=cv2.INTER_LINEAR)
    x = 1 - (1 - x) * (1 - 0.45 * bl)
    g = lum[..., None]
    x = g + (x - g) * sat
    x = np.power(np.clip(x, 0, 1), 1 / lift)
    x = 0.5 + (x - 0.5) * con
    x = x * (1 + np.array([-0.02, 0.0, 0.03], np.float32) * g)
    if _VIG is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.47) / (H * 0.6)) ** 2
        _VIG = (1 - 0.14 * np.clip(d, 0, 1.4) ** 1.6)[..., None]
    x = x * _VIG
    n = cv2.resize(_GRAIN.normal(0, 0.011, (H // 2, W // 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    x = x + n * (0.5 + 0.5 * (1 - g))
    out = img.copy(); out[:, :, :3] = np.clip(x * 255 + 0.5, 0, 255).astype(np.uint8)
    return out


def frame(t):
    surf = skia.Surface(W, H); c = surf.getCanvas()
    scene(c, t)
    img = finish(surf.makeImageSnapshot().toarray(), t)
    surf = skia.Surface(W, H); c = surf.getCanvas()
    c.drawImage(skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType), 0, 0)
    L.fades(c)
    L.badge(c, 'AP ENVIRONMENTAL SCIENCE')
    titles(c, t)
    if t < B0.END + 0.3: L.watermark(c)
    B0.CAP.draw(c, t)
    end_line(c, t, B0.END + 0.3)
    return surf


DUR = B0.DUR
if __name__ == '__main__':
    out, st = args()
    import lpk
    render(frame, DUR, out, st, '/home/claude/toads2/out4', start=lpk.START)
