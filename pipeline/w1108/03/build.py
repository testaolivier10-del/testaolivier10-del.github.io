"""w1108-03-hyperinflation (AP Macroeconomics, CED 5.3 money growth and inflation). Premium standard, all code (skia).
Cast (cast.py): the worker, his wife, the baker and the pressman, each ONE skinned body from the people kit.

Art plan and motion list (for the accuracy check):
- A (hook, 0 to "It's"): a 1923 factory gate at midday, brick wall, iron gate, a pay window marked LOHN (wages), the
  chimney smoking, a clock at noon. Frame zero: the worker holds a thick brick of banknotes in both hands and is
  already lowering it into the basket his wife holds out; the bundle stays between his two hands until it is inside
  the basket, then he lets go and pulls his hands back. She pulls the basket in against her body.
- B ("It's Germany" to "less"): a 1923 street: cobbles, tram wires, a bakery (BAECKEREI) with a price board on an easel
  and a street clock. She walks quickly (feet planted) to the bakery and goes in. On "Wait until afternoon" the clock
  hands sweep from 12 to 4 and the light turns low and warm (time passing); the baker, standing at the board, writes
  the new price: the new digits appear only under his moving chalk hand (4.000.000 M crossed, 5.000.000 M written).
- C ("A loaf" to "BILLION"): a loaf on the counter; a chart column of banknotes labelled "price of one loaf" rises
  from beside it (a chart, said by its label); January: "a few hundred marks"; the counter spins (blurred digits, no
  invented monthly values) as the camera pulls back over the rooftops; November: 200,000,000,000 marks.
- D ("So what happened" to "bills"): the printing works: a rotary press, rollers turning, the pressman's hands feed
  each sheet to the rollers (the sheet moves with his hands, then the rollers pull it), printed sheets drop onto a
  stack that grows; a wall ledger "WAR DEBTS" lights on "war debts"; the press runs faster on "more and more".
- E ("But the country" to "less"): the bakery counter: the shelf holds the same three loaves; the wife lifts her full
  basket onto the counter (hands on its handles) and the baker hands her one loaf (his hand on it until hers closes on
  it). Inset: money stack growing beside the same loaves; then one mark note and the bread it buys shrinking from a
  slice to a crumb.
- F (CTA): she walks out with one loaf, the basket empty; levlprep.com line.
Sources: Weimar hyperinflation (Wikipedia, Alpha History: wives met husbands at the factory on payday to spend wages
at once; bread about 160 to 500 marks at the start of 1923, about 200 billion by November); quantity theory of money,
AP Macroeconomics CED 5.3."""
import sys, math
sys.path[:0] = ['/home/claude/w1108/03']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad, ease_io, Wt, Y, R, TL, W, H, OR
import airman2 as A
import cast

OUT = '/home/claude/w1108/out/w1108-03-hyperinflation'
WD = kit.Words(f'{OUT}/words.json')
at = WD.at
T_HYP = at('hyperinflation'); T_WIFE = at('wife'); T_ITS = at("it's"); T_WAIT = at('wait'); T_AFT = at('afternoon')
T_LESS1 = at('less'); T_LOAF = at('loaf'); T_FEW = at('few'); T_BY = at('by'); T_NOV = at('november...'.strip('.'))
T_BIL = at('billion'); T_SO = at('so'); T_GOV = at('government'); T_WAR = at('war'); T_PRINT = at('printed')
T_MORE = at('more'); T_BUT = at('but'); T_SAME = at('same'); T_MORE3 = at('more', 4); T_EACH = at('each')
T_MARK = at('mark'); T_LESS2 = at('less', 2); T_FREE = at('free')
T_END = WD.end() + 0.45
DUR = round(T_END + 1.6, 2)
T_B = at('his') - 0.15
T_C = at('a') - 0.15
T_D = T_SO - 0.15
T_E = T_BUT - 0.2
T_F = T_FREE - 0.2

MAC = (190, 222, 120)
TITLES = [
    (-0.3, [[('HYPERINFLATION', Y)], [('SPEND IT ', Wt), ('NOW', R)]]),
    (T_ITS - 0.15, [[('GERMANY, ', Wt), ('1923', Y)]]),
    (T_WAIT - 0.1, [[('BY AFTERNOON,', Wt)], [('IT BUYS ', Wt), ('LESS', R)]]),
    (T_C, [[('ONE LOAF', Y)], [('OF BREAD', Wt)]]),
    (T_BY - 0.1, [[('BY ', Wt), ('NOVEMBER', Y), ('...', Wt)]]),
    (T_BIL - 0.15, [[('200 BILLION', OR)], [('MARKS', Wt)]]),
    (T_D, [[('SO WHAT', Wt)], [('HAPPENED?', Y)]]),
    (T_WAR - 0.15, [[('WAR', Wt)], [('REPARATIONS', R)]]),
    (T_PRINT - 0.15, [[('PRINT MORE', Wt)], [('AND MORE', Y), (' MONEY', Wt)]]),
    (T_E, [[('SAME ', Wt), ('BREAD', Y)]]),
    (T_MORE3 - 0.15, [[('MORE MONEY,', Y)], [('SAME BREAD', Wt)]]),
    (T_EACH - 0.15, [[('EACH MARK', Wt)], [('BUYS ', Wt), ('LESS', R)]]),
    (T_FREE - 0.1, [[('FREE PRACTICE', TL)], [('LEVLPREP.COM', Wt)]]),
]
kit.MERGE[:] = [(['nineteen', 'twenty', 'three.'], '1923.'), (['levlprep', 'dot', 'com.'], 'levlprep.com.')]
_mw = kit.merge_words


def _merge(ws):
    out = _mw(ws)
    for w in out:
        w['w'] = w['w'].replace('BILLION', 'billion').replace('MORE', 'more')
    return out


kit.merge_words = _merge

S = 0.5
Q1 = cast.Woman(S * 0.93, skirt=(90, 74, 60), skirt_sh=(70, 56, 46), palette={A.OL: (70, 90, 80), A.OL_SH: (52, 68, 60), A.OL_HI: (96, 116, 104), A.CUFF: (70, 90, 80), A.BELT: (90, 74, 60), A.BELT_SH: (70, 56, 46), (150, 120, 80): (70, 90, 80), A.SKIN: (226, 178, 146), A.SKIN_SH: (200, 154, 124), A.HAIR: (60, 62, 80), A.HAIR_SH: (44, 46, 60), A.BOOT_C: (46, 36, 32), A.BOOT_SH: (34, 26, 24)}, trouser=(46, 40, 44), collar=(220, 214, 200))
Q2 = cast.pressman(S * 0.98)
WORKER = cast.worker(S); WIFE = cast.wife(S * 0.95); BAKER = cast.baker(S); PRESS = cast.pressman(S)
_rs = np.random.default_rng(5)

# ------------------------------------------------------------------ props
NOTE, NOTE_SH, NOTE_HI, NOTE_INK = (196, 206, 178), (160, 172, 146), (226, 232, 210), (110, 96, 120)


def bundle(c, x, y, s=1.0, ang=0.0):
    """a thick brick of banknotes tied with string; (x, y) its centre"""
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s)
    for k in range(7):
        oy = 34 - k * 10
        r = skia.Rect(-82 + (k % 2) * 3, oy - 18, 82 + (k % 2) * 3, oy + 8)
        c.drawRRect(skia.RRect.MakeRectXY(r, 3, 3), P(NOTE_SH if k % 2 else NOTE))
    top = skia.Rect(-82, -52, 82, -28)
    c.drawRRect(skia.RRect.MakeRectXY(top, 3, 3), P(NOTE_HI))
    c.drawRect(skia.Rect(-66, -46, -30, -34), P(NOTE_INK, 150))
    c.drawCircle(40, -40, 7, SP(NOTE_INK, 2, 160))
    c.drawLine(0, -52, 0, 46, SP((150, 110, 70), 4))
    c.drawLine(-82, -4, 82, -4, SP((150, 110, 70), 4))
    c.restore()


def basket(c, x, y, s=1.0, fill=0.0, n_bundles=0, bs=0.8):
    """a wicker basket, hand at its handle top (x, y)"""
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawArc(skia.Rect(-80, -10, 80, 150), 180, 180, False, SP((150, 110, 66), 9))
    body = smooth_closed([(-110, 70), (110, 70), (92, 190), (-92, 190)])
    if n_bundles:
        for k in range(n_bundles):
            bundle(c, -10 + k * 30, 76 - k * 10, bs / s, -3 + k * 9)
    flat(c, body, (176, 132, 80), (146, 106, 62), sh_off=(10, 0), rim=(214, 172, 112), rim_d=(-3, 2), rim_a=200)
    for k in range(5):
        c.drawLine(-100 + k * 2, 90 + k * 22, 100 - k * 2, 90 + k * 22, SP((140, 100, 58), 3, 200))
    for k in range(9):
        c.drawLine(-90 + k * 22, 74, -80 + k * 20, 188, SP((150, 110, 66), 2, 150))
    c.restore()


def bread_slice(c, x, y, u):
    """u = 1: a full slice (front view: crust, crumb with holes); u -> 0: a ragged crumb with a bit of crust"""
    crust, crust_sh, crumb, hole = (176, 110, 52), (140, 82, 36), (246, 222, 170), (214, 186, 130)
    if u > 0.15:
        s = 0.35 + 0.65 * u
        c.save(); c.translate(x, y); c.scale(s, s)
        outer = smooth_closed([(-44, 40), (-46, -10), (-52, -34), (-34, -54), (-8, -50), (0, -58), (10, -50), (36, -56), (54, -34), (46, -8), (44, 40)])
        c.drawPath(outer, P(crust))
        inner = smooth_closed([(-36, 32), (-38, -10), (-42, -30), (-30, -44), (-6, -40), (0, -46), (8, -40), (32, -46), (44, -30), (38, -8), (36, 32)])
        c.drawPath(inner, P(crumb))
        for hx, hy, hr in ((-18, -20, 4), (10, -26, 3), (20, 4, 5), (-12, 14, 3), (2, -4, 2.5), (-26, 0, 2.5), (24, -14, 2.5), (6, 22, 3)):
            c.drawOval(skia.Rect(hx - hr, hy - hr * 0.7, hx + hr, hy + hr * 0.7), P(hole))
        c.drawPath(outer, SP(crust_sh, 3))
        c.restore()
    else:
        k = 0.6 + u * 2
        c.save(); c.translate(x, y); c.scale(k, k)
        c.drawPath(smooth_closed([(-9, 6), (-11, -3), (-4, -9), (6, -8), (10, 0), (5, 8)]), P(crumb))
        c.drawPath(smooth_closed([(4, -8), (10, -6), (11, 1), (7, 2)]), P(crust))
        c.drawCircle(-3, 0, 1.6, P(hole)); c.drawCircle(3, 3, 1.3, P(hole))
        c.restore()


def loaf(c, x, y, s=1.0, a=255):
    c.save(); c.translate(x, y); c.scale(s, s)
    body = smooth_closed([(-70, 20), (-64, -20), (-30, -40), (30, -40), (66, -18), (70, 20)])
    flat(c, body, (196, 132, 70), (164, 104, 52), sh_off=(8, 4), rim=(232, 176, 108), rim_d=(-3, -3), rim_a=int(a))
    for k in range(3):
        c.drawLine(-36 + k * 30, -30, -24 + k * 30, -10, SP((236, 196, 140), 6, a))
    c.restore()


def arm_to(who, base_kw, side, target, ground, cache={}):
    """grid search shoulder and elbow so the wrist of arm side ('n' or 'f') reaches target (pose x = 0)"""
    key = (id(who), side, tuple(sorted((k, v if not isinstance(v, float) else round(v, 1)) for k, v in base_kw.items())),
           round(target[0] / 3), round(target[1] / 3), ground)
    if key in cache: return cache[key]
    best = None
    for ua in range(-20, 181, 4):
        for el in range(0, 151, 4):
            kw = dict(base_kw); kw['uarm_' + side] = ua; kw['elbow_' + side] = el
            ps = A.Pose(x=0, ground=ground, **kw); J = who.joints(ps)
            hx, hy = who.canvas_pt(ps, J['hand_' + side][0])
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if best is None or d < best[0]: best = (d, ua, el)
    _, ua0, el0 = best
    for ua in [ua0 + 0.5 * k for k in range(-8, 9)]:      # refine to half a degree so the hand lands on its target
        for el in [el0 + 0.5 * k for k in range(-8, 9)]:
            if el < 0: continue
            kw = dict(base_kw); kw['uarm_' + side] = ua; kw['elbow_' + side] = el
            ps = A.Pose(x=0, ground=ground, **kw); J = who.joints(ps)
            hx, hy = who.canvas_pt(ps, J['hand_' + side][0])
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if d < best[0]: best = (d, ua, el)
    cache[key] = (best[1], best[2]); return cache[key]


def hand_pt(who, x, kw, side, ground):
    ps = A.Pose(x=x, ground=ground, **kw); J = who.joints(ps)
    return who.canvas_pt(ps, J['hand_' + side][0])


def draw(c, who, x, ground, light=(0.75, -0.65), **kw):
    ps = A.Pose(x=x, ground=ground, **kw); who.draw(c, ps, light=light); return ps


# ------------------------------------------------------------------ shot A: the factory gate at noon
GA = 1330


def bricks(c, rect, base=(150, 82, 62), mort=(120, 64, 50), t=0.0):
    c.drawRect(rect, P(base))
    y = rect.top()
    row = 0
    while y < rect.bottom():
        c.drawLine(rect.left(), y, rect.right(), y, SP(mort, 3))
        off = 30 if row % 2 else 0
        x = rect.left() - off
        while x < rect.right():
            c.drawLine(x, y, x, y + 34, SP(mort, 3))
            x += 60
        y += 34; row += 1


def clock(c, x, y, r, hrs):
    c.drawCircle(x, y, r + 10, P((60, 52, 48)))
    c.drawCircle(x, y, r, P((240, 234, 214)))
    for k in range(12):
        a = k / 12 * 2 * math.pi
        c.drawLine(x + math.sin(a) * r * 0.8, y - math.cos(a) * r * 0.8, x + math.sin(a) * r * 0.92, y - math.cos(a) * r * 0.92, SP((60, 52, 48), 4))
    ah = (hrs % 12) / 12 * 2 * math.pi; am = (hrs % 1) * 2 * math.pi
    c.drawLine(x, y, x + math.sin(ah) * r * 0.5, y - math.cos(ah) * r * 0.5, SP((40, 34, 30), 8))
    c.drawLine(x, y, x + math.sin(am) * r * 0.78, y - math.cos(am) * r * 0.78, SP((40, 34, 30), 5))
    c.drawCircle(x, y, 7, P((40, 34, 30)))


def smoke(c, x, y, t, s=1.0, col=(214, 210, 204)):
    for k in range(10):
        g = ((t * 0.18 + k * 0.1) % 1.0)
        c.drawCircle(x + 120 * g * s + 20 * math.sin(k + t * 0.6), y - 420 * g * s, (30 + 80 * g) * s, P(col, 170 * (1 - g), MaskFilter=blur(10)))


def gate_scene(c, t):
    lgrad(c, skia.Rect(-400, -400, 1500, 900), -300, 900, [(150, 176, 196), (214, 214, 204)])
    # far: rooftops and chimneys (haze)
    far = (176, 170, 168)
    c.drawPath(kit.poly([(-400, 640), (-200, 600), (-80, 600), (0, 560), (160, 560), (220, 610), (420, 610), (480, 560),
                         (700, 560), (760, 600), (1500, 600), (1500, 900), (-400, 900)]), P(far))
    for cx_ in (60, 640, 980):
        c.drawRect(skia.Rect(cx_, 380, cx_ + 44, 600), P(mix(far, (60, 60, 60), 0.15)))
        smoke(c, cx_ + 22, 380, t + cx_, 0.8, (226, 224, 220))
    # factory wall (brick), the gate, the pay window
    bricks(c, skia.Rect(-400, 640, 1500, GA + 10))
    c.drawRect(skia.Rect(-400, 640, 1500, 664), P((120, 64, 50)))
    # factory clock above the gate
    clock(c, 545, 720, 56, 12.0 + t / 3600)
    # iron gate (right), open
    c.drawRect(skia.Rect(720, 860, 1000, GA), P((52, 46, 44)))
    for k in range(8):
        c.drawLine(730 + k * 36, 870, 730 + k * 36, GA, SP((30, 28, 28), 8))
    c.drawRect(skia.Rect(720, 860, 1000, 880), P((30, 28, 28)))
    # pay window with a sign
    c.drawRect(skia.Rect(120, 860, 380, 1010), P((60, 50, 44)))
    c.drawRect(skia.Rect(132, 872, 368, 998), P((236, 214, 160)))
    for k in range(4):
        bundle(c, 180 + k * 54, 980 - (k % 2) * 10, 0.35, -4 + 3 * k)
    c.drawRect(skia.Rect(110, 1006, 390, 1024), P((90, 74, 64)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(180, 812, 320, 852), 6, 6), P((40, 44, 52)))
    f = skia.Font(kit.L.BLACK, 30); w = f.measureText('LOHN')
    c.drawString('LOHN', 250 - w / 2, 843, f, P((236, 226, 196)))
    # cobbled yard
    c.drawRect(skia.Rect(-400, GA, 1500, 2400), P((126, 118, 110)))
    for k in range(14):
        for j in range(8):
            ox = (j % 2) * 40
            c.drawOval(skia.Rect(-300 + k * 90 + ox, GA + 14 + j * 46, -230 + k * 90 + ox, GA + 44 + j * 46), P((140, 132, 122)))


def stack(c, x, y, s=0.62, n=4, t=0.0):
    """a tall stack of n note bricks; (x, y) the centre of the bottom brick"""
    for k in range(n):
        bundle(c, x + 6 * math.sin(k * 1.7), y - k * 64 * s / 0.62 * 0.9, s, -3 + 5 * math.sin(k * 2.3))


def grip(c, x, y, skin, s=1.0):
    """a fist closed around a handle at (x, y), drawn over the handle so the hand reads as holding it"""
    sh = mix(skin, (0, 0, 0), 0.18)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 15 * s, y - 14 * s, x + 15 * s, y + 16 * s), 10 * s, 10 * s), P(skin))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 15 * s, y + 4 * s, x + 15 * s, y + 16 * s), 6 * s, 6 * s), P(sh))
    for k in range(3): c.drawLine(x - 9 * s + k * 8 * s, y - 2 * s, x - 9 * s + k * 8 * s, y + 8 * s, SP(sh, 2.2 * s))


def shot_a(c, t, loop=False):
    """the gate at noon. t < 0 is the pre roll used for the ending: he walks out of the gate carrying his pay to her,
    arriving exactly in the pose of frame zero, so the last frame loops into the first"""
    u = (t - 0) / T_B if not loop else 1 - smooth((t + 4.4) / 4.4) * 0.0
    c.save()
    if loop: kit.push(c, ease_io(max(0.0, min(1.0, (t + (DUR - T_F)) / (DUR - T_F)))), 540, 960, 1.26, 1.32, 580, 1050, 560, 1050)
    else: kit.push(c, ease_io(u), 540, 960, 1.32, 1.4, 560, 1050, 570, 1080)
    gate_scene(c, t)
    wx, mx = 360, 720
    k1 = smooth(t / 0.75)                 # the stack travels from his chest out over the basket
    k2 = smooth((t - 0.7) / 0.3)          # it settles into the basket
    rel = t > 1.0                         # he lets go
    k3 = smooth((t - 1.3) / 0.8)          # she pulls the basket in
    bh = (lerp(wx + 200, wx + 150, k3), lerp(GA - 330, GA - 350, k3))      # her hand on the basket handle
    bkw = dict(face=1, lean=lerp(6, 2, k3), neck=0, thigh_n=6, knee_n=-4, thigh_f=-6, knee_f=-2, hand_n='grip', hand_f='grip',
               br=0.5 + 0.5 * math.sin(t * 2.2))
    ua, el = arm_to(WIFE, bkw, 'n', (bh[0] - wx, bh[1]), GA); bkw.update(uarm_n=ua, elbow_n=el)
    ua2, el2 = arm_to(WIFE, bkw, 'f', (bh[0] - wx - 30, bh[1] + 60), GA); bkw.update(uarm_f=ua2, elbow_f=el2)
    BX, BY = hand_pt(WIFE, wx, bkw, 'n', GA)
    b_end = (BX, BY + 60)
    # where he is and where the stack is (between his hands until it rests in the basket)
    if t < 0:      # pre roll: walk from the gate, then stand
        walk_end = -0.5
        T0 = -(DUR - T_F)                                  # start of the loop shot
        g = max(0.0, min(1.0, (t - T0) / (walk_end - T0)))
        dist = 170 * g                                     # steady walk, no easing, so the planted foot never slides
        xw = 890 - dist
        d = dist
        st = smooth((t - (walk_end - 0.4)) / 0.4)
        wk = cast.walk_kw(d, -1, amp=10, arms=0, k=WORKER.k)
        mkw = dict(face=-1, lean=4, neck=10, hand_n='flat', hand_f='flat', br=0.5 + 0.5 * math.sin(t * 2 + 1))
        for kk, v0 in (('thigh_n', -4), ('knee_n', -6), ('thigh_f', 10), ('knee_f', -4)):
            mkw[kk] = lerp(wk[kk], v0, st)
        bpos = (xw - 170, GA - 370)
    else:
        xw = mx
        mkw = dict(face=-1, lean=lerp(4, 16, k1) if not rel else lerp(16, 3, smooth((t - 1.0) / 0.7)), neck=10,
                   thigh_n=-4, knee_n=-6, thigh_f=10, knee_f=-4, hand_n='flat', hand_f='flat', br=0.5 + 0.5 * math.sin(t * 2 + 1))
        b_start = (mx - 170, GA - 370)
        bpos = b_end if rel else (lerp(b_start[0], b_end[0], k1 * 0.9 + 0.1 * k2), lerp(b_start[1], b_end[1] - 30, k1) + 30 * k2)
    # his hands on the two sides of the stack, at the second brick
    hy = bpos[1] - 40
    tn = (bpos[0] - xw + 52, hy); tf = (bpos[0] - xw - 50, hy - 8)
    ua, el = arm_to(WORKER, mkw, 'n', tn, GA); ua2, el2 = arm_to(WORKER, mkw, 'f', tf, GA)
    if rel and t >= 0:      # he lets go and lowers his arms to his sides
        r = smooth((t - 1.0) / 0.7)
        ua, el, ua2, el2 = lerp(ua, -3, r), lerp(el, 20, r), lerp(ua2, -2, r), lerp(el2, 22, r)
        if r >= 1: mkw.update(hand_n='relaxed', hand_f='relaxed')
    mkw.update(uarm_n=ua, elbow_n=el, uarm_f=ua2, elbow_f=el2)
    draw(c, WIFE, wx, GA, **bkw)
    if not rel or t < 0:
        stack(c, bpos[0], bpos[1], 0.58, 4)
        draw(c, WORKER, xw, GA, light=(-0.75, -0.65), **mkw)
        basket(c, BX, BY, 0.8, n_bundles=0)
    else:
        draw(c, WORKER, xw, GA, light=(-0.75, -0.65), **mkw)
        stack(c, b_end[0], b_end[1], 0.58, 4)      # the basket overflows with his pay
        basket(c, BX, BY, 0.8, n_bundles=0)
        # loose notes slip off the top of the pile and fall (gravity) to the cobbles, where they stay
        for i in range(7):
            rs = np.random.default_rng(40 + i)
            t0 = 1.0 + i * 0.22; a_ = max(0.0, t - t0)
            x0, y0 = b_end[0] + rs.uniform(-50, 60), b_end[1] - 190 + rs.uniform(-20, 20)
            gx = x0 + rs.uniform(-90, 90); gy = GA + rs.uniform(4, 40)
            fall = min(1.0, a_ / 0.9)
            px = lerp(x0, gx, fall) + 14 * math.sin(a_ * 9 + i) * (1 - fall)
            py = y0 + (gy - y0) * fall ** 1.6
            ang = rs.uniform(-30, 30) + 160 * fall * (1 if i % 2 else -1)
            c.save(); c.translate(px, py); c.rotate(ang)
            c.drawRect(skia.Rect(-34, -15, 34, 15), P(NOTE_HI if i % 2 else NOTE)); c.drawRect(skia.Rect(-28, -9, -10, 1), P(NOTE_INK, 150))
            c.restore()
    grip(c, BX, BY + 2, (234, 188, 156), 1.0)
    c.restore()


# ------------------------------------------------------------------ shot B: the street and the bakery
GB = 1330


def street(c, t, eve=0.0):
    sky0 = mix((150, 180, 206), (226, 156, 104), eve); sky1 = mix((220, 220, 210), (246, 196, 140), eve)
    lgrad(c, skia.Rect(-400, -400, 1500, 900), -300, 900, [sky0, sky1])
    # far facades (haze)
    far = mix((178, 174, 170), (196, 150, 120), eve)
    for k in range(7):
        x0 = -300 + k * 240; h = 340 + (k * 73) % 160
        c.drawRect(skia.Rect(x0, 900 - h, x0 + 230, 900), P(far))
        for j in range(3):
            for i in range(3):
                c.drawRect(skia.Rect(x0 + 30 + i * 64, 920 - h + j * 90, x0 + 62 + i * 64, 970 - h + j * 90), P(mix(far, (90, 90, 100), 0.3)))
    # tram wires
    for k in range(2):
        c.drawLine(-400, 600 + k * 24, 1500, 640 + k * 24, SP((50, 46, 46), 3))
    # near facade (left): a plastered house with a window and a doorway
    hw = mix((168, 170, 166), (206, 160, 120), eve)
    # the cross street between the houses: far pavement in haze (the tram and people pass there)
    c.drawRect(skia.Rect(-120, 900, 420, GB), P(mix(far, (150, 142, 132), 0.5)))
    c.drawRect(skia.Rect(-120, 900, 420, 912), P(mix(far, (90, 86, 84), 0.5)))
    c.drawRect(skia.Rect(-400, 520, -120, GB), P(hw))
    c.drawRect(skia.Rect(-400, 940, -120, 960), P(mix(hw, (0, 0, 0), 0.12)))
    for x0 in (-300,):
        c.drawRect(skia.Rect(x0, 640, x0 + 150, 860), P((70, 62, 58))); c.drawRect(skia.Rect(x0 + 10, 650, x0 + 140, 850), P(mix((120, 150, 160), (200, 140, 100), eve)))
        c.drawLine(x0 + 75, 650, x0 + 75, 850, SP((70, 62, 58), 6))
    # a tram crossing far back under its wires, people on the far pavement
    tx = -500 + (t - 3.0) * 110
    tram = mix((150, 60, 50), (190, 110, 80), eve)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx, 800, tx + 420, 940), 14, 14), P(tram))
    for k in range(6): c.drawRect(skia.Rect(tx + 20 + k * 66, 820, tx + 70 + k * 66, 830), P(mix((200, 210, 210), (240, 190, 140), eve)))
    c.drawRect(skia.Rect(tx, 910, tx + 420, 940), P(mix(tram, (0, 0, 0), 0.25)))
    c.drawLine(tx + 200, 800, tx + 260, 640, SP((40, 38, 38), 4))
    for k in range(5):
        px = (k * 260 + (t * (40 if k % 2 else -34))) % 1600 - 300
        sc = 0.5 + 0.05 * k
        bob = 3 * abs(math.sin(t * 5 + k))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(px - 12 * sc, 950 - 90 * sc - bob, px + 12 * sc, 990 - bob), 8, 8), P(mix((70, 66, 70), far, 0.3)))
        c.drawCircle(px, 950 - 100 * sc - bob, 11 * sc, P(mix((70, 66, 70), far, 0.3)))
    # near facade: the bakery (right)
    wall = mix((206, 186, 150), (220, 160, 110), eve)
    c.drawRect(skia.Rect(420, 520, 1500, GB), P(wall))
    c.drawRect(skia.Rect(420, 520, 432, GB), P(mix(wall, (0, 0, 0), 0.15)))
    c.drawRect(skia.Rect(372, 790, 562, 840), P((70, 56, 46)))
    f = skia.Font(kit.L.BLACK, 32)
    c.drawString('BÄCKEREI', 467 - f.measureText('BÄCKEREI') / 2, 827, f, P((236, 210, 150)))
    # shop window with loaves, the door
    c.drawRect(skia.Rect(480, 860, 760, 1180), P((70, 56, 46)))
    c.drawRect(skia.Rect(494, 874, 746, 1166), P(mix((120, 150, 160), (200, 140, 100), eve)))
    for k in range(3): loaf(c, 540 + k * 74, 1120, 0.55)
    c.drawRect(skia.Rect(800, 860, 980, GB), P((86, 62, 46)))
    c.drawRect(skia.Rect(816, 880, 964, 1300), P((110, 80, 58)))
    c.drawCircle(940, 1100, 8, P((214, 180, 90)))
    # street clock on a post (left)
    c.drawRect(skia.Rect(207, 730, 223, GB), P((48, 50, 54)))
    # sidewalk and cobbles
    c.drawRect(skia.Rect(-400, GB, 1500, 2400), P(mix((150, 142, 132), (170, 130, 100), eve)))
    c.drawRect(skia.Rect(-400, GB, 1500, GB + 14), P((110, 102, 96)))
    cob = mix((132, 124, 116), (160, 120, 92), eve)
    for j in range(9):
        for k in range(16):
            ox = (j % 2) * 40
            c.drawOval(skia.Rect(-360 + k * 100 + ox, GB + 120 + j * 50, -290 + k * 100 + ox, GB + 150 + j * 50), P(cob))
    for ry in (GB + 260, GB + 330): c.drawRect(skia.Rect(-400, ry, 1500, ry + 8), P((90, 86, 84)))
    # long evening shadow under everything
    if eve > 0: c.drawRect(skia.Rect(-400, 0, 1500, 2400), P((255, 150, 80), 40 * eve, BlendMode=skia.BlendMode.kScreen))


def board(c, x, y, t, eve):
    """the price board on an easel; the new price is written under the baker's chalk hand"""
    c.drawLine(x - 90, GB, x - 40, y - 10, SP((110, 80, 58), 10))
    c.drawLine(x + 90, GB, x + 40, y - 10, SP((110, 80, 58), 10))
    c.drawLine(x - 78, GB - 70, x + 78, GB - 70, SP((110, 80, 58), 7))
    c.drawRect(skia.Rect(x - 120, y - 20, x + 120, y + 200), P((40, 44, 40)))
    c.drawRect(skia.Rect(x - 120, y - 20, x + 120, y + 200), SP((120, 90, 60), 8))
    f = skia.Font(kit.L.BLACK, 32); f2 = skia.Font(kit.L.BLACK, 28)
    c.drawString('1 BROT', x - 56, y + 30, f, P((236, 236, 226)))
    old = '4 Mio. M'; new = '5 Mio. M'
    wo = f2.measureText(old)
    c.drawString(old, x - wo / 2, y + 90, f2, P((236, 236, 226)))
    return x - wo / 2, y + 90, wo, f2, new


def shot_b(c, t):
    u = (t - T_B) / (T_C - T_B)
    eve = smooth((t - T_WAIT) / 1.2)
    c.save(); kit.push(c, ease_io(u), 540, 960, 1.22, 1.3, 540, 1020, 520, 1030)
    street(c, t, eve)
    # street clock face: noon, then the hands sweep to four o'clock
    hrs = 12.08 + 3.92 * smooth((t - T_WAIT) / 1.2)
    clock(c, 215, 730, 76, hrs)
    tc = '12:00' if t < T_WAIT + 1.2 else '16:00'
    kit.L.chip(c, tc, 215, 852, Y if tc == '16:00' else Wt, size=40)
    # the baker at his board (right of her), facing left: his chalk hand writes the new price on "less"
    bx0, by0 = 432, 900
    ox, oy, wo, f2, new = board(c, bx0, by0, t, eve)
    wr = smooth((t - (T_LESS1 - 1.35)) / 0.85)
    st = smooth((t - (T_LESS1 - 1.9)) / 0.35)
    bkw = dict(face=1, lean=4, neck=-4, thigh_n=4, knee_n=-4, thigh_f=-4, knee_f=-2, hand_n='grip', hand_f='relaxed', br=0.5 + 0.5 * math.sin(t * 2))
    BXp = 300
    if st > 0:
        c.drawLine(ox - 4, oy - 12, ox - 4 + wo * st, oy - 12, SP((230, 80, 70), 5))
    # the chalk tip (18, 22 from the wrist) follows the strike line, then moves along the new digits as they appear
    mv = smooth((t - (T_LESS1 - 1.55)) / 0.2)            # the chalk travels from the end of the strike to the new line
    if wr > 0: tip = (ox + wo * wr, oy + 50)
    elif mv > 0: tip = (lerp(ox - 4 + wo, ox, mv), lerp(oy - 12, oy + 50, mv))
    else: tip = (ox - 4 + wo * st, oy - 12)
    tgt = (tip[0] - 18 - BXp, tip[1] - 22)
    rest = (60, GB - 330)
    k_up = smooth((t - (T_LESS1 - 2.3)) / 0.4) * (1 - smooth((t - (T_LESS1 - 0.45)) / 0.4))   # up to the board, then down
    tgt = (lerp(rest[0], tgt[0], k_up), lerp(rest[1], tgt[1], k_up))
    bkw['lean'] = lerp(4, 16, k_up)
    ua, el = arm_to(BAKER, bkw, 'n', tgt, GB); bkw.update(uarm_n=ua, elbow_n=el)
    if wr > 0:
        hl = smooth((t - (T_LESS1 - 0.4)) / 0.3)          # once written and his arm is down: a soft highlight
        if hl > 0:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(ox - 14, oy + 26, ox + wo + 14, oy + 80), 10, 10), P((255, 210, 80), 70 * hl, MaskFilter=blur(8), BlendMode=skia.BlendMode.kScreen))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(ox - 12, oy + 28, ox + wo + 12, oy + 78), 10, 10), SP((255, 214, 90), 3, 200 * hl))
        c.save(); c.clipRect(skia.Rect(ox - 10, oy + 20, ox + wo * wr, oy + 84))
        c.drawString(new, ox, oy + 66, f2, P((255, 226, 120)))
        c.restore()
    draw(c, BAKER, BXp, GB, **bkw)
    hp = hand_pt(BAKER, BXp, bkw, 'n', GB)
    c.drawLine(hp[0] + 6, hp[1] + 10, hp[0] + 18, hp[1] + 22, SP((246, 246, 240), 7))      # the chalk in his hand
    # a queue for bread: two customers wait in front of her, shuffling and breathing (why she has to wait)
    for qx, who, ph in ((650, Q1, 0.0), (740, Q2, 1.3)):
        sw = 2 * math.sin(t * 1.1 + ph)
        draw(c, who, qx + sw, GB, light=(-0.75, -0.65), face=-1, lean=3, neck=-2 + 3 * math.sin(t * 0.7 + ph), thigh_n=4, knee_n=-4, thigh_f=-4,
             knee_f=-2, uarm_n=6, elbow_n=30, uarm_f=4, elbow_f=26, hand_n='relaxed', hand_f='relaxed', br=0.5 + 0.5 * math.sin(t * 2.1 + ph))
    # the wife hurries along the street, joins the end of the queue and watches the price change
    walk_t = t - T_B
    d = 190 * smooth(min(1.0, walk_t / 2.0)) if walk_t < 2.0 else 190
    x = 1060 - d
    stop = smooth((walk_t - 2.0) / 0.4)
    kw = cast.walk_kw(d, -1, amp=11, arms=0, k=WIFE.k)
    for kk, v0 in (('thigh_n', 6), ('knee_n', -4), ('thigh_f', -6), ('knee_f', -2)): kw[kk] = lerp(kw[kk], v0, stop)
    react = smooth((t - (T_LESS1 - 0.3)) / 0.5)
    kw.update(hand_n='grip', hand_f='grip', lean=lerp(5, -3, react), neck=lerp(0, -6, react), br=0.5 + 0.5 * math.sin(t * 2.4))
    ua, el = arm_to(WIFE, kw, 'n', (-95, GB - 340), GB); kw.update(uarm_n=ua, elbow_n=el)
    ua, el = arm_to(WIFE, kw, 'f', (-70, GB - 290), GB); kw.update(uarm_f=ua, elbow_f=el)
    hx, hy = hand_pt(WIFE, x, kw, 'n', GB)
    draw(c, WIFE, x, GB, light=(-0.75, -0.65), **kw)
    stack(c, hx, hy + 52, 0.48, 4)
    basket(c, hx, hy, 0.66, n_bundles=0)
    grip(c, hx, hy + 2, (234, 188, 156), 0.85)
    c.restore()


# ------------------------------------------------------------------ shot C: one loaf and its price
def digits(t, final):
    if t >= 1: return final
    s = ''.join(str(_rs.integers(0, 10)) for _ in range(12))
    return s[:3] + ',' + s[3:6] + ',' + s[6:9] + ',' + s[9:12]


MONTHS = ['February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October']


def shot_c(c, t):
    grow = smooth((t - (T_FEW + 0.6)) / (T_BIL - T_FEW - 0.4))
    pull = smooth((t - (T_FEW + 1.0)) / (T_BIL - T_FEW - 0.6))
    z = lerp(1.25, 0.9, pull)
    h_px = lerp(110, 5200, grow ** 3)
    top_w = 1150 - h_px                                 # world y of the tower top
    # the camera tilts up with the tower once its top would leave the frame (top kept near screen y 640)
    Y0 = max(1100.0, 740 - (top_w - 1100) * z)
    # world: the bakery counter in front of the rooftops; a tower of real note bricks (the price of one loaf, a chart)
    # rises beside the loaf and runs out of the top of the frame
    c.save()
    c.translate(540, Y0); c.scale(z, z); c.translate(-540, -1100)
    lgrad(c, skia.Rect(-4000, -9000, 5000, 1300), -5000, 1300, [(40, 60, 110), (120, 150, 190), (220, 206, 186)])
    for k in range(9):   # rooftops around the bakery
        x0 = -2400 + k * 560; h = 900 + (k * 211) % 700
        c.drawRect(skia.Rect(x0, 1000 - h, x0 + 520, 1300), P((120, 110, 118)))
        c.drawPath(kit.poly([(x0 - 20, 1000 - h), (x0 + 260, 820 - h), (x0 + 540, 1000 - h)]), P((96, 72, 70)))
        for jj in range(5):
            for ii in range(4):
                c.drawRect(skia.Rect(x0 + 50 + ii * 120, 1060 - h + jj * 160, x0 + 100 + ii * 120, 1140 - h + jj * 160), P((236, 210, 150) if (ii + jj + k) % 3 == 0 else (80, 78, 92)))
    for k in range(6):   # clouds drifting
        cx_ = (k * 900 + 40 * t) % 6000 - 3000; cy_ = -300 - k * 800
        c.drawOval(skia.Rect(cx_, cy_, cx_ + 900, cy_ + 200), P((240, 240, 244), 160, MaskFilter=blur(30)))
    c.drawRect(skia.Rect(-6000, 1180, 7000, 30000), P((120, 80, 52)))
    c.drawRect(skia.Rect(-6000, 1180, 7000, 1206), P((160, 112, 74)))
    for k in range(4): c.drawLine(-6000, 1300 + k * 120, 7000, 1300 + k * 120, SP((100, 66, 42), 6))
    loaf(c, 300, 1140, 1.3)
    n = max(1, int(h_px / 66)) + 2
    c.save(); c.clipRect(skia.Rect(-2000, 1150 - h_px - 46, 3000, 3000))     # the tower rises smoothly, no brick pops in
    for k in range(n):
        bundle(c, 560 + 8 * math.sin(k * 1.3), 1150 - k * 66, 1.2, -2 + 3 * math.sin(k * 2.1))
    c.restore()
    c.restore()
    # labels (screen space): only the two real values are readable; months tick by in between
    tx = 540 + (560 - 540) * z + 100 * z + 140
    kit.L.chip(c, 'price of one loaf', min(tx, 1080 - 60 - 150), 1120, Y, size=34, a=smooth((t - T_FEW) / 0.3))
    # once the tower has left the rooftops, a corner lens keeps the loaf it is the price of in view
    li = smooth((t - (T_BY + 0.6)) / 0.4)
    if li > 0 and pull > 0.2:
        cx_, cy_, r_ = 230, 1190, 120 * li
        c.drawCircle(cx_, cy_, r_ + 8, P(Y, 230))
        p = skia.Path(); p.addCircle(cx_, cy_, r_)
        c.save(); c.clipPath(p, doAntiAlias=True)
        c.drawRect(skia.Rect(cx_ - r_, cy_ - r_, cx_ + r_, cy_ + r_), P((214, 196, 172)))
        c.drawRect(skia.Rect(cx_ - r_, cy_ + 20, cx_ + r_, cy_ + r_), P((120, 80, 52)))
        c.drawRect(skia.Rect(cx_ - r_, cy_ + 20, cx_ + r_, cy_ + 30), P((160, 112, 74)))
        loaf(c, cx_ - 30, cy_ - 4, 1.0)
        for k in range(3): bundle(c, cx_ + 62, cy_ + 2 - k * 40, 0.42, -3 + 4 * k)
        c.restore()
        kit.L.chip(c, 'one loaf', cx_, cy_ - 150 * li, Wt, size=32, a=li)
    a0 = smooth((t - T_FEW + 0.2) / 0.3) if t < T_BY else 0.0
    if a0 > 0:
        kit.L.chip(c, 'January: a few hundred marks', 540, 610, Wt, size=46, a=a0)
    if T_BY <= t < T_BIL - 0.1:
        k = (t - T_BY) / (T_BIL - 0.1 - T_BY)
        m = MONTHS[min(len(MONTHS) - 1, int(k * len(MONTHS)))]
        kit.L.chip(c, m, 540, 610, Wt, size=46, a=1.0)
    if t >= T_BIL - 0.1:
        kit.L.chip(c, 'November: 200,000,000,000', 540, 610, OR, size=42, a=smooth((t - T_BIL + 0.1) / 0.15))


# ------------------------------------------------------------------ shot D: the printing works
GD = 1330


TY = 1050          # table height in the press room


def press_body(c, x, ang, s=1.0, dark=0.0):
    """a flatbed-fed cylinder press seen from the side: cast iron frame, two inking/impression cylinders meeting at the
    table (the nip at (x, TY)), a flywheel turning with them"""
    tone = lambda col: mix(col, (30, 34, 40), dark)
    c.save(); c.translate(x, TY); c.scale(s, s)
    frame = kit.poly([(-150, -260), (150, -260), (180, 280), (-180, 280)])
    flat(c, frame, tone((58, 72, 66)), tone((44, 56, 50)), sh_off=(14, 0), rim=tone((96, 112, 104)), rim_d=(-3, 2), rim_a=200)
    for cy_, r in ((-84, 84), (84, 84)):
        c.drawCircle(0, cy_, r + 8, P(tone((40, 46, 44))))
        c.drawCircle(0, cy_, r, P(tone((170, 174, 172)))); c.drawCircle(0, cy_, r * 0.82, P(tone((140, 144, 142))))
        a0 = ang if cy_ < 0 else -ang
        for j in range(6):
            a = a0 + j * math.pi / 3
            c.drawLine(math.cos(a) * r * 0.3, cy_ + math.sin(a) * r * 0.3, math.cos(a) * r * 0.8, cy_ + math.sin(a) * r * 0.8, SP(tone((110, 114, 112)), 6))
        c.drawCircle(0, cy_, 14, P(tone((60, 62, 64))))
    # flywheel behind and above, belt to the top cylinder
    fx, fy, fr = 250, -260, 120
    c.drawLine(0, -84 - 84, fx, fy - fr, SP(tone((50, 40, 34)), 8)); c.drawLine(0, -84 + 84, fx, fy + fr, SP(tone((50, 40, 34)), 8))
    c.drawCircle(fx, fy, fr, SP(tone((50, 56, 54)), 16))
    for j in range(5):
        a = ang * 0.7 + j * 2 * math.pi / 5
        c.drawLine(fx, fy, fx + math.cos(a) * fr, fy + math.sin(a) * fr, SP(tone((60, 66, 64)), 8))
    c.drawCircle(fx, fy, 18, P(tone((40, 44, 44))))
    c.restore()


def sheet(c, x0, x1, y, printed=0.0, a=255):
    c.drawRect(skia.Rect(x0, y - 7, x1, y + 1), P((240, 236, 224), a))
    if printed > 0:
        c.save(); c.clipRect(skia.Rect(x0, y - 9, x0 + (x1 - x0) * printed, y + 3))
        c.drawRect(skia.Rect(x0, y - 7, x1, y + 1), P(NOTE, a))
        for k in range(int((x1 - x0) / 30)): c.drawRect(skia.Rect(x0 + 6 + k * 30, y - 6, x0 + 18 + k * 30, y), P(NOTE_INK, a * 0.6))
        c.restore()


def shot_d(c, t):
    u = (t - T_D) / (T_E - T_D)
    fast = smooth((t - T_PRINT) / 0.8)
    c.save(); kit.push(c, ease_io(u), 540, 960, 1.18, 1.3, 520, 980, 560, 990)
    lgrad(c, skia.Rect(-400, -400, 1500, GD), 200, GD, [(56, 60, 70), (96, 96, 98)])
    # tall windows with dusty light falling across the room
    for k in range(4):
        x0 = -100 + k * 340
        c.drawRect(skia.Rect(x0, 520, x0 + 160, 820), P((200, 210, 216)))
        c.drawPath(kit.poly([(x0, 820), (x0 + 160, 820), (x0 + 360, GD), (x0 + 100, GD)]), P((230, 230, 220), 34, BlendMode=skia.BlendMode.kScreen))
    for k in range(18):
        g = (t * 0.05 + k * 0.13) % 1
        c.drawCircle(-60 + (k * 97) % 1100 + 20 * math.sin(t + k), 840 + 420 * g, 3, P((255, 250, 230), 120))
    # wall ledger of debts (SCHULDEN), outlined on "war debts"
    la = smooth((t - T_WAR + 0.1) / 0.3)
    c.drawRect(skia.Rect(292, 630, 484, 776), P((230, 222, 196)))
    f = skia.Font(kit.L.BLACK, 30)
    c.drawString('REPARATIONEN', 300, 666, skia.Font(kit.L.BLACK, 20), P((60, 50, 44)))
    for k in range(4):
        c.drawLine(306, 692 + k * 22, 448, 692 + k * 22, SP((150, 140, 120), 2))
        c.drawLine(310, 686 + k * 22, 340 + k * 26, 686 + k * 22, SP((200, 50, 50), 5))
    if la > 0: c.drawRect(skia.Rect(282, 620, 494, 786), SP(R, 8, 255 * la))
    # floor: worn boards, crates of finished note bricks in the foreground
    c.drawRect(skia.Rect(-400, GD, 1500, 2400), P((96, 84, 72)))
    for k in range(14): c.drawLine(-400 + k * 140, GD, -900 + k * 200, 2400, SP((80, 70, 60), 4))
    ang = (t - T_D) * (1.6 + 5.0 * fast)
    press_body(c, 1020, ang * 0.9, 0.62, dark=0.35)        # a second press further back, running too
    # tables: the feed table (left), the delivery table (right)
    NIP = 560
    c.drawRect(skia.Rect(180, TY, NIP - 60, TY + 18), P((110, 84, 62)))
    c.drawRect(skia.Rect(NIP + 60, TY, 940, TY + 18), P((110, 84, 62)))
    for lx in (200, 470, 640, 920): c.drawRect(skia.Rect(lx, TY + 18, lx + 14, GD), P((80, 62, 48)))
    # printed notes stacking on the delivery table
    period = lerp(1.3, 0.5, fast)
    n_done = int(max(0.0, t - T_D - 0.6) / 1.3) + int(max(0.0, t - T_PRINT) / 0.5 * fast)
    n_lay = min(4 + n_done * 2, 46)
    stack_top = TY - 10 - n_lay * 10
    for k in range(n_lay):          # the stack of printed notes on the delivery table, growing
        y = TY - 10 - k * 10
        c.drawRect(skia.Rect(690 + (k % 3) * 4, y, 900 + (k % 3) * 4, y + 9), P(NOTE if k % 2 else NOTE_SH))
        c.drawRect(skia.Rect(700 + (k % 3) * 4, y + 2, 730 + (k % 3) * 4, y + 6), P(NOTE_INK, 140))
    # blank pile he takes from
    for k in range(12): c.drawRect(skia.Rect(200, TY - 6 - k * 5, 370, TY - k * 5), P((236, 232, 220) if k % 2 else (220, 216, 204)))
    ph = ((t - T_D) % period) / period
    W_ = 170
    # 0..0.45: his hands slide the top sheet from the pile into the nip; 0.45..1: the cylinders pull it through and it
    # drops, printed, onto the stack; his hands go back to the pile
    if ph < 0.45:
        g = smooth(ph / 0.45); front = lerp(372, NIP, g)
        sheet(c, front - W_, front, TY - 60)
        hands = (front - W_ + 30, TY - 64)
    else:
        g = (ph - 0.45) / 0.55; front = NIP + (W_ + 160) * g
        x0 = front - W_; vis0 = max(x0, NIP)
        if x0 < NIP: sheet(c, x0, NIP - 50, TY - 60)
        y = TY - 60 + 30 * g * g - min(n_done, 30) * 0 
        sheet(c, max(vis0, NIP + 50), front, TY - 8 - min(n_done, 30) * 0 if g > 0.85 else TY - 60 + 52 * smooth((g - 0.4) / 0.6), printed=1.0)
        hands = (lerp(NIP - W_ + 30, 330, smooth(g / 0.7)), TY - 64 + 10 * math.sin(g * math.pi))
    press_body(c, NIP, ang)
    # loose notes thrown out of the nip by the turning cylinders, landing on the stack
    rate = lerp(2.5, 9.0, fast)
    t0 = T_D + 0.2
    if t > t0:
        nn = int((t - t0) * rate)
        for i in range(max(0, nn - 8), nn + 1):
            ts = t0 + i / rate; a_ = t - ts
            if a_ < 0 or a_ > 0.8: continue
            rs = np.random.default_rng(i)
            vx = rs.uniform(240, 380); vy = rs.uniform(-900, -700)
            px = NIP + 100 + vx * a_; py = TY - 60 + vy * a_ + 1100 * a_ * a_
            if a_ > 0.5 and py > stack_top - 10: continue          # it has landed on the stack
            c.save(); c.translate(px, py); c.rotate(a_ * rs.uniform(200, 500))
            c.drawRect(skia.Rect(-34, -14, 34, 14), P(NOTE_HI)); c.drawRect(skia.Rect(-28, -8, -10, 2), P(NOTE_INK, 150))
            c.restore()
    pkw = dict(face=1, lean=18, neck=14, thigh_n=12, knee_n=-10, thigh_f=-8, knee_f=-4, hand_n='flat', hand_f='flat', br=0.5 + 0.5 * math.sin(t * 2))
    PX = 150
    ua, el = arm_to(PRESS, pkw, 'n', (hands[0] - PX, hands[1]), GD); pkw.update(uarm_n=ua, elbow_n=el)
    ua, el = arm_to(PRESS, pkw, 'f', (hands[0] - PX + 40, hands[1] - 2), GD); pkw.update(uarm_f=ua, elbow_f=el)
    draw(c, PRESS, PX, GD, **pkw)
    c.restore()


# ------------------------------------------------------------------ shot E and F: the bakery counter, same bread
GE = 1330


def counter_scene(c, t):
    lgrad(c, skia.Rect(-400, -400, 1500, GE), 400, GE, [(170, 132, 96), (214, 176, 130)])
    # shelf with the same three loaves
    c.drawRect(skia.Rect(560, 760, 1040, 780), P((110, 74, 48)))
    for k in range(3):
        if k == 0 and T_E < t and t >= T_MORE3 - 0.6: continue      # the baker has taken this one
        loaf(c, 640 + k * 140, 730, 0.9)
    # tiled floor
    c.drawRect(skia.Rect(-400, GE, 1500, 2400), P((180, 160, 140)))
    for k in range(20):
        c.drawLine(-400 + k * 100, GE, -400 + k * 140 - 300, 2400, SP((160, 140, 122), 3))
    # hanging lamp swaying, light in its beam
    sw = 6 * math.sin(t * 0.9)
    c.drawLine(300, 0, 300 + sw, 560, SP((60, 50, 44), 4))
    c.drawPath(kit.poly([(250 + sw, 560), (350 + sw, 560), (330 + sw, 520), (270 + sw, 520)]), P((70, 74, 60)))
    c.drawPath(kit.poly([(250 + sw, 560), (350 + sw, 560), (520 + sw, 1100), (80 + sw, 1100)]), P((255, 230, 170), 36, BlendMode=skia.BlendMode.kScreen))


def counter_front(c):
    c.drawRect(skia.Rect(420, 1060, 1200, 1340), P((120, 80, 52)))
    c.drawRect(skia.Rect(420, 1046, 1200, 1072), P((160, 112, 74)))
    for k in range(5): c.drawLine(460 + k * 150, 1090, 460 + k * 150, 1320, SP((100, 66, 42), 4))


def shot_e(c, t):
    u = (t - T_E) / (T_F - T_E)
    c.save()
    kit.push(c, ease_io(u), 540, 960, 1.22, 1.36, 600, 800, 610, 820)
    counter_scene(c, t)
    BXp = 790; WX0 = 380
    BAS0 = (586, 928); BAS1 = (700, 928)
    meet = (668, 960)
    T_REL = T_MORE3 - 0.6                                 # she lets go of the basket on the counter
    T_TAKE = T_MORE3 + 1.3                                # her hand closes on the loaf
    SHELF = (640, 730)                                    # the left loaf on the shelf
    T_GRAB = T_MORE3 - 0.6
    up = smooth((t - (T_GRAB - 0.5)) / 0.5)               # his hand goes up to the shelf loaf
    give = smooth((t - (T_GRAB + 0.1)) / 1.1)             # he lifts it off and holds it out
    take = t > T_TAKE
    reach = smooth((t - (T_TAKE + 0.5)) / 0.6)            # then he takes the basket by its handle
    pull = smooth((t - (T_TAKE + 1.1)) / 1.1)             # and pulls the money over to his side
    # the baker
    bkw = dict(face=-1, lean=6, neck=-2, thigh_n=4, knee_n=-4, thigh_f=-4, knee_f=-2, hand_n='grip', hand_f='relaxed', br=0.5 + 0.5 * math.sin(t * 2))
    rest_b = (BXp - 90, 1040)
    if t < T_GRAB: hold_b = (lerp(rest_b[0], SHELF[0], up), lerp(rest_b[1], SHELF[1] + 10, up))
    else: hold_b = (lerp(SHELF[0], meet[0] + 20, give), lerp(SHELF[1] + 10, meet[1], give))
    if take:
        r = smooth((t - T_TAKE) / 0.5)
        hold_b = (lerp(meet[0] + 20, BXp - 110, r), lerp(meet[1], 1030, r))
    bas_end = (lerp(BAS0[0], BAS1[0], pull), BAS0[1])
    if reach > 0:
        hold_b = (lerp(hold_b[0], bas_end[0], reach), lerp(hold_b[1], bas_end[1], reach))
    ua, el = arm_to(BAKER, bkw, 'n', (hold_b[0] - BXp, hold_b[1]), GE); bkw.update(uarm_n=ua, elbow_n=el)
    draw(c, BAKER, BXp, GE, light=(-0.75, -0.65), **bkw)
    # the wife: carries the basket up onto the counter, lets go, takes the loaf with the same hand and keeps it
    lift = smooth((t - (T_E + 0.3)) / 0.8)
    wkw = dict(face=1, lean=lerp(4, 10, lift), neck=0, thigh_n=6, knee_n=-4, thigh_f=-6, knee_f=-2, hand_n='grip', hand_f='grip', br=0.5 + 0.5 * math.sin(t * 2.2))
    bas = (lerp(WX0 + 140, BAS0[0], lift), lerp(BAS0[1] - 20, BAS0[1], lift))
    off = smooth((t - T_REL) / 0.4)                       # her hand comes off the handle
    kr = smooth((t - (T_MORE3 + 0.5)) / 0.7)              # it reaches for the loaf he offers
    kb = smooth((t - T_TAKE) / 0.7)                       # and brings it in to her chest
    if t < T_REL:
        nt = bas
    elif not take:
        nt = (lerp(lerp(BAS0[0] - 30, WX0 + 120, off), meet[0], kr), lerp(lerp(BAS0[1], 1000, off), meet[1], kr))
    else:
        nt = (lerp(meet[0], WX0 + 110, kb), lerp(meet[1], 990, kb))
    ua, el = arm_to(WIFE, wkw, 'n', (nt[0] - WX0, nt[1]), GE); wkw.update(uarm_n=ua, elbow_n=el)
    ua, el = arm_to(WIFE, wkw, 'f', (90, 1040), GE); wkw.update(uarm_f=ua, elbow_f=el)
    if take: wkw['lean'] = lerp(10, 3, kb)
    draw(c, WIFE, WX0, GE, **wkw)
    counter_front(c)
    hn = hand_pt(WIFE, WX0, wkw, 'n', GE)
    # the basket: in her hand, then resting on the counter, then in his hand
    if t < T_REL: bp = hn
    elif reach < 1: bp = BAS0
    else: bp = hand_pt(BAKER, BXp, bkw, 'n', GE)
    stack(c, bp[0], bp[1] + 52, 0.48, 4)
    basket(c, bp[0], bp[1], 0.66, n_bundles=0)
    if t < T_REL: grip(c, bp[0], bp[1] + 2, (234, 188, 156), 0.85)
    elif reach >= 1: grip(c, bp[0], bp[1] + 2, (220, 166, 130), 0.85)
    # the loaf: on his palm, then in her hand (her near hand, in front of her, the whole time she has it)
    if t >= T_GRAB and not take:
        loaf(c, hold_b[0], hold_b[1] + 6, lerp(0.9, 0.6, give))
    if take:
        loaf(c, hn[0] + 8, hn[1] + 4, 0.6)
        grip(c, hn[0], hn[1] + 4, (234, 188, 156), 0.85)
    c.restore()
    # the idea, as a diagram inset in the upper art zone (the people stay below)
    a1 = smooth((t - (T_MORE3 - 0.1)) / 0.4) if t < T_F else 0.0
    if a1 > 0:
        c.saveLayerAlpha(None, int(255 * a1))
        r = skia.RRect.MakeRectXY(skia.Rect(90, 530, 990, 800), 30, 30)
        c.drawRRect(r, P((16, 22, 36), 225)); c.drawRRect(r, SP(MAC, 4, 220))
        f = skia.Font(kit.L.BLACK, 44)
        # left: real note bricks piling up (more money)
        mg = smooth((t - T_MORE3) / 1.6)
        for k in range(int(1 + 3 * mg)):
            bundle(c, 230 + 10 * math.sin(k * 1.7), 760 - k * 26, 0.62, -4 + 6 * math.sin(k * 2.3))
        c.drawString('MONEY', 160, 600, f, P(Y))
        ko = 1 - smooth((t - (T_EACH - 0.5)) / 0.35)      # the same loaves fade, then one mark and what it buys
        if ko > 0:
            c.saveLayerAlpha(None, int(255 * ko))
            c.drawString('BREAD', 600, 600, f, P(Wt))
            for k in range(3): loaf(c, 540 + k * 140, 720, 0.9)
            c.restore()
        if t > T_EACH - 0.2:
            k2 = smooth((t - T_EACH + 0.2) / 0.35)
            sh = smooth((t - T_MARK) / 0.9)
            c.saveLayerAlpha(None, int(255 * k2))
            c.drawRect(skia.Rect(400, 620, 600, 720), P(NOTE_HI)); c.drawRect(skia.Rect(400, 620, 600, 720), SP(NOTE_INK, 4))
            c.drawString('1 MARK', 420, 684, skia.Font(kit.L.BLACK, 38), P(NOTE_INK))
            c.drawString('buys', 620, 684, f, P(Wt))
            # one slice of bread (crust, crumb and its holes), shrinking to a crumb
            bread_slice(c, 850, 670, lerp(1.0, 0.0, sh))
            w_ = 0; h_ = 0
            c.restore()
        c.restore()


def scene(c, t):
    if t < T_B: shot_a(c, t)
    elif t < T_C: shot_b(c, t)
    elif t < T_D: shot_c(c, t)
    elif t < T_E: shot_d(c, t)
    elif t < T_F: shot_e(c, t)
    else: shot_a(c, t - DUR, loop=True)      # back to the gate: he walks out with his pay, into frame zero


SHORT = kit.Short(WD, 'AP MACROECONOMICS', TITLES, scene, DUR, T_END, cuts=((T_B, 1300, 0.1), T_C, T_D, (T_E, 900, 0.0), T_F))
SHORT.grow = lambda t: 1.15 if (t < T_B or t >= T_F) else 1.0

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1108/03/stills')
