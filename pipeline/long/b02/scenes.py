"""Every beat of AP Bio 02 drawn in code. Each function draws the whole frame for global time t.
Bt is the timeline's beat table; cue(k, n) is the global time of cue n of beat k."""
import math
import numpy as np
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, hand, chip, pill, arrow, glow, label, CREAM, AMBER, CORAL, TEAL, YELLOW, BLUE, GREEN, NAVY, INK2, LILAC
import dia as D
import world as WD
import people as PP

Bt = {}
BIO = K.COURSE


def cue(k, n=0):
    b = Bt[k]
    if n == 0:
        return b['t0']
    return b['cues'].get(n, b['cues'].get(str(n), b['t0']))


def u(t, k, n=0, d=0.5, lead=0.1):
    return sm((t - cue(k, n) + lead) / d)


def fin(k):
    return Bt[k]['t1']


def board_title(c, s, t, t0, col=CREAM, y=130):
    text(c, s, W / 2, y, 56, col, sm((t - t0) / 0.4), 'xb', 'center')


def practice_tag(c, t, t0, s='YOUR TURN'):
    pill(c, s, 190, 90, AMBER, 30, sm((t - t0) / 0.3), kind='xb')


def answer_tag(c, t, t0):
    pill(c, 'ANSWER', 170, 90, GREEN, 30, sm((t - t0) / 0.3), kind='xb')


def check(c, x, y, s=1.0, a=1.0, col=GREEN):
    p = skia.Path(); p.moveTo(x - 30 * s, y); p.lineTo(x - 8 * s, y + 22 * s); p.lineTo(x + 34 * s, y - 26 * s)
    c.drawPath(p, SP(col, 11 * s, 255 * a))


def cross(c, x, y, s=1.0, a=1.0, col=CORAL):
    c.drawLine(x - 26 * s, y - 26 * s, x + 26 * s, y + 26 * s, SP(col, 11 * s, 255 * a))
    c.drawLine(x + 26 * s, y - 26 * s, x - 26 * s, y + 26 * s, SP(col, 11 * s, 255 * a))


def cam_push(c, t, t0, amt=0.04, cx=W / 2, cy=H / 2, dur=14.0):
    z = 1 + amt * sm((t - t0) / dur)
    c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy)


def dim(c, a):
    if a > 0:
        c.drawRect(skia.Rect(0, 0, W, H), P((16, 20, 40), 200 * a))


def tint(c, col, a):
    if a > 0:
        c.drawRect(skia.Rect(0, 0, W, H), P(col, 255 * a))


# ================================================================ intro
TABLE = (760, 735)
SCALE_TOP = (760, 700)


def hook(c, t):
    k = 'hook'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    c.save(); cam_push(c, t, t0, 0.035, 900, 700, 22)
    WD.patio_bg(c, t)
    jx = 1150
    if t < c2 - 0.15:
        # eight weeks ago: the pot of dry soil on the scale, Jay presses the seed in
        WD.table(c, *TABLE)
        fill = sm((t - t0) / 3.0)
        WD.scale_(c, *SCALE_TOP, 0.9, f'{int(1250 * fill):,} g', hl=sm((t - t0 - 3.0) / 0.4))
        WD.pot(c, SCALE_TOP[0], SCALE_TOP[1] - 6, 0.62, soil=fill > 0.3)
        pour = 1 - sm((t - t0 - 2.8) / 0.4)
        if pour > 0.01:
            rs = np.random.default_rng(int(t * 30))
            for i in range(26):
                yy = (i * 9 + t * 260) % 120
                c.drawCircle(SCALE_TOP[0] + 12 + rs.uniform(-10, 10), SCALE_TOP[1] - 230 + yy, 4, P((92, 66, 50), 255 * pour))
        seed = sm((t - t0 - 3.4) / 0.6)
        WD.tomato_plant(c, SCALE_TOP[0], SCALE_TOP[1] - 6 - 0.62 * 132 - 30 * (1 - seed), 0.0, t)
        press = 0.5 + 0.5 * math.sin((t - t0) * 3.2)
        hand_y = -560 + 120 * seed if pour > 0.01 else -430 + 18 * press
        PP.jay.draw(c, jx - 120, 1010, 0.95, t, pose=dict(hands={'R': (-330, hand_y), 'L': (60, -300)}, look=-0.8, tilt=-5))
        tint(c, (255, 190, 110), 0.16)
        pill(c, '8 weeks ago', 260, 110, AMBER, 34, sm((t - t0) / 0.4))
        a = sm((t - t0 - 3.0) / 0.4)
        label(c, 'dry soil: 1,250 g', 420, 560, CREAM, 34, a, dot=(700, 690))
    elif t < c3 - 0.15:
        # weeks pass: the plant grows past his knee
        WD.table(c, *TABLE)
        WD.scale_(c, *SCALE_TOP, 0.9, None)
        px, py = 990, 1000
        WD.pot(c, px, py, 0.75)
        g = sm((t - c2) / 2.6)
        WD.tomato_plant(c, px, py - 0.75 * 132, g, t, s=0.8)
        PP.jay.draw(c, jx + 40, 1015, 0.98, t, pose=dict(look=-0.7, arms={'R': (8, 10, 0), 'L': (14, 30, 0)}))
        days = int(56 * g)
        pill(c, f'day {days}', 260, 110, AMBER, 34, 1.0)
        kn = 1015 - 150 * 0.98
        a = sm((t - c2 - 2.4) / 0.4)
        c.drawLine(px - 120, kn, jx + 120, kn, SP(CREAM, 3, 160 * a))
        text(c, 'knee', jx + 140, kn + 12, 32, CREAM, a, 'semi')
    else:
        # he pulls it out, dries the soil, weighs it again
        WD.table(c, *TABLE)
        rd = sm((t - c4 + 0.2) / 0.6)
        val = 1250 - int(round(3 * rd))
        WD.scale_(c, *SCALE_TOP, 0.9, f'{val:,} g', hl=sm((t - c4) / 0.4))
        WD.pot(c, SCALE_TOP[0], SCALE_TOP[1] - 6, 0.62)
        lift = sm((t - c3) / 0.8)
        J = PP.jay.draw(c, jx, 1015, 0.98, t, pose=dict(hands={'R': (-200, -330 - 60 * lift), 'L': (40, -260)}, look=-0.6, tilt=-4, elbow_out=False))
        hx, hy = J['hdR']
        WD.tomato_plant(c, hx - 4, hy + 24, 1.0, t, s=0.85, roots=1.0)
        a = sm((t - c4 - 0.5) / 0.4)
        label(c, 'only 3 g lighter', 330, 560, AMBER, 38, a, dot=(700, 690))
        q = sm((t - c4 - 3.0) / 0.5)
        if q > 0:
            text(c, '?', 1460, 420, 180, AMBER, q, 'xb', 'center')
    c.restore()
    K.vignette(c)


def promise(c, t):
    k = 'promise'
    K.calm_bg(c, t)
    board_title(c, 'By the end of this video', t, cue(k))
    a1 = u(t, k, 1)
    for i, el in enumerate('CHONPS'):
        D.tile(c, el, 330 + (i % 3) * 105, 370 + (i // 3) * 120, 86, a1 * sm((t - cue(k, 1) - i * 0.08) / 0.3), name=False)
    text(c, '6 elements', 435, 640, 46, CREAM, a1, 'xb', 'center')
    a2 = u(t, k, 2)
    D.bread_icon(c, 860, 370, 0.7, a2); D.butter_icon(c, 1060, 380, 0.7, a2)
    D.cheese_icon(c, 860, 520, 0.7, a2); D.dna_icon(c, 1060, 520, 0.55, a2, t)
    text(c, '4 families', 960, 640, 46, CREAM, a2, 'xb', 'center')
    a3 = u(t, k, 3)
    if a3 > 0.01:
        j = sm((t - cue(k, 3) - 0.6) / 0.8)
        D.string(c, (1444 + 30 * j, 450), (1576 - 30 * j, 450), a3 * j)
        D.bead(c, 1400 + 30 * j, 450, 44, AMBER, a3)
        D.bead(c, 1620 - 30 * j, 450, 44, GREEN, a3)
        D.h2o(c, 1510, 380 - 60 * j, 0.8, a3 * j * (1 - sm((t - cue(k, 3) - 2.2) / 0.6)))
        text(c, 'build and break', 1510, 640, 46, CREAM, a3, 'xb', 'center')


def why(c, t):
    k = 'why'
    K.calm_bg(c, t)
    PP.jay.draw(c, W / 2, 1000, 1.05, t, pose=dict(arms={'R': (10, 12, 0), 'L': (10, 12, 0)}))
    a = u(t, k, 1, 0.6)
    rs = np.random.default_rng(2)
    for i in range(60):
        el = 'CHONPS'[i % 6] if i % 3 else 'C'
        sx, sy = rs.uniform(0, W), rs.uniform(-100, H + 100)
        if abs(sx - W / 2) < 300:
            sx += 700 * (1 if sx > W / 2 else -1)
        tx, ty = W / 2 + rs.uniform(-60, 60), rs.uniform(450, 900)
        f = sm((t - cue(k, 1) - i * 0.03) / 2.2)
        x, y = sx + (tx - sx) * f, sy + (ty - sy) * f
        D.ball(c, x, y, 13, el, a * (1 - 0.7 * f), False)
    hand(c, 'every atom came from somewhere else', W / 2, 170, 58, AMBER, u(t, k, 1, 1.2), 'center')
    a2 = u(t, k, 2)
    if a2 > 0:
        D.co2(c, 400, 620, 1.0, a2, t * 10)
        D.h2o(c, 1520, 620, 1.1, a2)
        pill(c, 'how they snap together', W / 2, 260, BIO, 34, a2)


# ================================================================ atoms come from somewhere
def e1(c, t):
    k = 'e1'
    K.calm_bg(c, t)
    board_title(c, 'an element = one kind of atom', t, cue(k))
    a3 = u(t, k, 3)
    if a3 < 0.99:
        a = 1 - a3
        D.atom(c, W / 2, 580, 2.0, 6, 6, 6 if t > cue(k, 2) else 0, a, t, pu=u(t, k, 1), nu=1.0, eu=u(t, k, 2))
        label(c, '6 protons = carbon', 620, 450, CORAL, 38, u(t, k, 1) * a, dot=(W / 2 - 20, 560))
        label(c, 'neutrons', 600, 720, INK2, 34, u(t, k, 1) * a, dot=(W / 2 + 10, 600))
        label(c, '6 electrons', 1320, 360, (120, 200, 255), 38, u(t, k, 2) * a, dot=(1180, 520))
        hand(c, 'atoms bond by sharing or trading electrons', W / 2, 990, 46, CREAM, u(t, k, 2, 1.2, -1.2) * a, 'center')
    if a3 > 0.01:
        rows = ((6, 'carbon-12', 'most'), (7, 'carbon-13', 'a little'), (8, 'carbon-14', 'a tiny trace'))
        for i, (n, nm, amt) in enumerate(rows):
            x = 420 + i * 540
            ai = a3 * sm((t - cue(k, 3) - i * 0.4) / 0.4)
            D.atom(c, x, 500, 1.6, 6, n, 0, ai, t, seed=3 + i)
            text(c, f'6 protons + {n} neutrons', x, 680, 40, CREAM, ai, 'semi', 'center')
            text(c, amt, x, 745, 42, AMBER, ai, 'xb', 'center')
            text(c, nm, x, 850, 50, CREAM, ai * u(t, k, 4), 'xb', 'center')
        hand(c, 'isotopes', W / 2, 990, 80, AMBER, u(t, k, 4, 0.8), 'center')


def e2(c, t):
    k = 'e2'
    K.calm_bg(c, t)
    a1 = u(t, k, 1)
    if t < cue(k, 2) - 0.3:
        D.atom(c, 600, 500, 1.3, 15, 17, 15 if a1 > 0 else 0, 1.0, t, eu=a1, radiate=1.0, seed=9)
        text(c, 'phosphorus-32', 600, 900, 46, YELLOW, 1.0, 'xb', 'center')
        text(c, 'radioactive', 600, 960, 36, CORAL, sm((t - cue(k)) / 0.5), 'semi', 'center')
        if a1 > 0.01:
            D.atom(c, 1320, 500, 1.3, 15, 16, 15, a1, t, seed=10)
            text(c, 'phosphorus-31', 1320, 900, 46, CREAM, a1, 'xb', 'center')
            text(c, 'normal', 1320, 960, 36, INK2, a1, 'semi', 'center')
            pill(c, 'same electrons, same chemistry', W / 2, 110, BIO, 36, sm((t - cue(k, 1) - 1.0) / 0.4))
    else:
        a2 = u(t, k, 2)
        D.cell_icon(c, W / 2 + 120, 560, 2.4, a2, t)
        rs = np.random.default_rng(4)
        for i in range(14):
            sx, sy = 200 + rs.uniform(-60, 60), 300 + i * 40
            tx, ty = W / 2 + 120 + rs.uniform(-160, 160), 560 + rs.uniform(-130, 130)
            f = sm((t - cue(k, 2) - 0.4 - i * 0.12) / 1.4)
            x, y = sx + (tx - sx) * f, sy + (ty - sy) * f
            gl = u(t, k, 3)
            D.ball(c, x, y, 12, 'P', a2, False, glow=0.5 + 0.5 * gl)
        text(c, 'radioactive P goes in', 300, 220, 38, CREAM, a2, 'semi', 'center')
        hand(c, 'a tracer: we can see where it ends up', W / 2, 1000, 54, AMBER, u(t, k, 3, 1.0), 'center')


def loop_diagram(c, t, a=1.0, ps=1.0, rs_=1.0, prod=1.0, atoms_u=0.0, energy=0.0, heat=0.0, y0=0):
    """photosynthesis (left, leaf) and respiration (right, cell) as one loop of atoms"""
    lx, rx, cy = 520, 1400, 560 + y0
    D.sun_icon(c, lx - 250, cy - 300, 46, a * ps * (0.6 + 0.4 * energy), t)
    D.leaf_icon(c, lx, cy, 1.4, a * ps)
    D.cell_icon(c, rx, cy, 1.4, a * rs_, t)
    text(c, 'photosynthesis', lx, cy + 170, 42, GREEN, a * ps, 'xb', 'center')
    text(c, 'cellular respiration', rx, cy + 170, 42, LILAC, a * rs_, 'xb', 'center')
    arrow(c, (lx + 140, cy - 140), (rx - 140, cy - 140), GREEN, 8, a * ps, a, bend=-0.12)
    arrow(c, (rx - 140, cy + 110), (lx + 140, cy + 110), LILAC, 8, a * rs_ * prod, a, bend=-0.12)
    if ps > 0.01:
        D.formula(c, 'sugar + O2', W / 2, cy - 230, 40, CREAM, a * ps)
        D.formula(c, 'CO2 + H2O', lx - 60, cy - 150, 34, CREAM, a * ps)
    if prod > 0.01:
        D.formula(c, 'CO2 + H2O', W / 2, cy + 240, 40, CREAM, a * prod)
        pill(c, 'ATP', rx + 210, cy - 120, YELLOW, 34, a * prod)
    if atoms_u > 0:
        for i in range(10):
            f = (t * 0.12 + i / 10) % 1
            ang = f * 2 * math.pi
            x = W / 2 + 470 * math.cos(ang); y = cy - 15 + 175 * math.sin(ang)
            D.ball(c, x, y, 13, 'COHCOH'[i % 6], a * atoms_u, False)
    if heat > 0:
        D.heat_waves(c, rx + 130, cy + 330, a * heat, t)
        text(c, 'heat', rx + 170, cy + 390, 38, CORAL, a * heat, 'xb', 'center')


def e3(c, t):
    k = 'e3'
    K.calm_bg(c, t)
    hand(c, "living things can't make atoms", W / 2, 140, 60, AMBER, u(t, k, 0, 1.0), 'center')
    loop_diagram(c, t, 1.0, ps=u(t, k, 2), rs_=u(t, k, 3), prod=u(t, k, 4), energy=u(t, k, 2))


def e4(c, t):
    k = 'e4'
    K.calm_bg(c, t)
    loop_diagram(c, t, 1.0, 1.0, 1.0, 1.0, atoms_u=u(t, k, 0, 0.8), energy=u(t, k, 1), heat=u(t, k, 2))
    pill(c, 'energy: light in, stored in bonds', W / 2, 120, YELLOW, 34, u(t, k, 1))
    hand(c, 'matter cycles, energy flows through', W / 2, 1010, 56, AMBER, u(t, k, 2, 1.2, -2.0), 'center')


def e5(c, t):
    k = 'e5'
    c.save(); cam_push(c, t, cue(k), 0.04, 980, 700, 14)
    WD.patio_bg(c, t)
    WD.table(c, *TABLE)
    WD.scale_(c, *SCALE_TOP, 0.9, '1,247 g')
    px, py = 1060, 1010
    WD.pot(c, px, py, 0.95, cut=max(u(t, k, 3), u(t, k, 2)), roots=1.0, t=t)
    WD.tomato_plant(c, px, py - 0.95 * 132, 1.0, t, s=0.85)
    PP.jay.draw(c, 1420, 1020, 0.98, t, pose=dict(look=-0.8, arms={'R': (10, 40, 0), 'L': (10, 12, 0)}))
    c.restore()
    dim(c, 0.12 * u(t, k, 1))
    a2 = u(t, k, 2)
    if a2 > 0:
        for i in range(7):
            f = ((t - cue(k, 2)) * 0.25 + i / 7) % 1
            x = 400 + 600 * f + 40 * math.sin(i)
            y = 300 + 90 * math.sin(i * 1.7) + 220 * f
            D.co2(c, x, y, 0.6, a2 * sm(f * 5) * (1 - sm((f - 0.85) / 0.15)), 20 * i)
        label(c, 'CO₂ from the air', 260, 200, CREAM, 38, a2)
        for i in range(5):
            f = ((t - cue(k, 2)) * 0.4 + i / 5) % 1
            c.drawCircle(1060 + 10 * math.sin(i), 990 - 330 * f, 9, P((120, 190, 255), 230 * a2 * (1 - f)))
        label(c, 'water up from the roots', 1260, 300, (140, 200, 255), 36, a2, dot=(1065, 700))
    a3 = u(t, k, 3)
    if a3 > 0:
        for i in range(10):
            ang = i * 0.63 + t
            c.drawCircle(1060 + 30 * math.cos(ang), 940 + 20 * math.sin(ang), 4, P(YELLOW, 255 * a3))
        label(c, 'minerals: the few grams', 1300, 880, YELLOW, 36, a3, dot=(1080, 940))
    K.vignette(c)


def p1q(c, t):
    k = 'p1q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    a = u(t, k, 1)
    text(c, 'glucose', W / 2, 330, 50, BIO, a, 'xb', 'center')
    D.formula(c, 'C6H12O6', W / 2, 520, 180, CREAM, a)
    hand(c, 'the small numbers count the atoms', W / 2, 660, 46, AMBER, u(t, k, 1, 0.8, -1.8), 'center')
    a3 = u(t, k, 2)
    text(c, 'how many atoms in one molecule?', W / 2, 820, 46, CREAM, a3, 'semi', 'center')
    text(c, 'where do the C and the H come from?', W / 2, 890, 46, CREAM, a3, 'semi', 'center')


def p1a(c, t):
    k = 'p1a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    for i, (el, n) in enumerate((('C', 6), ('H', 12), ('O', 6))):
        ai = sm((t - cue(k) - i * 0.3) / 0.4)
        D.tile(c, el, 520 + i * 260, 330, 120, ai, name=False)
        text(c, f'x {n}', 520 + i * 260, 470, 56, CREAM, ai, 'xb', 'center')
    text(c, '= 24 atoms', 1300, 350, 64, AMBER, sm((t - cue(k) - 1.6) / 0.4), 'xb', 'left')
    a1 = u(t, k, 1)
    D.co2(c, 600, 690, 1.0, a1)
    arrow(c, (600, 750), (600, 880), (220, 214, 200), 7, a1, a1)
    text(c, 'C comes from CO₂ in the air', 600, 950, 40, CREAM, a1, 'semi', 'center')
    a2 = u(t, k, 2)
    D.h2o(c, 1300, 680, 1.2, a2)
    arrow(c, (1300, 750), (1300, 880), (220, 214, 200), 7, a2, a2)
    text(c, 'H comes from water', 1300, 950, 40, CREAM, a2, 'semi', 'center')


# ================================================================ CHONPS
def c1(c, t):
    k = 'c1'
    K.calm_bg(c, t)
    board_title(c, 'about 25 elements in living things', t, cue(k), INK2)
    many = 'C H O N P S Ca K Na Cl Mg Fe Zn Cu I Mn Co Se Mo F B Cr Si V Sn'.split()
    fade = 1 - u(t, k, 1, 0.6)
    for i, sy in enumerate(many):
        if fade <= 0.01:
            break
        x = 260 + (i % 9) * 175; y = 330 + (i // 9) * 170
        ai = fade * sm((t - cue(k) - i * 0.04) / 0.3) * (0.35 if sy not in 'CHONPS' else 1.0)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 60, y - 60, x + 60, y + 60), 16, 16), P((70, 76, 120), 255 * ai))
        text(c, sy, x, y + 20, 56, CREAM, ai, 'xb', 'center')
    for i, el in enumerate('CHONPS'):
        ai = sm((t - cue(k, 1) - i * 0.25) / 0.35)
        D.tile(c, el, 335 + i * 250, 470, 170, ai, sc=0.8 + 0.2 * ai)
    pill(c, 'about 98% of a cell\'s mass', W / 2, 760, BIO, 40, u(t, k, 1, 0.5, -1.8))
    hand(c, 'CHONPS', W / 2, 950, 110, AMBER, u(t, k, 2, 0.8), 'center')


ROLES = [('C', 'the skeleton of every carbon based molecule'), ('H', 'in nearly all of them, and in water'), ('O', 'in nearly all of them, and in water'),
         ('N', 'every protein, and DNA'), ('P', 'DNA, ATP, membrane phospholipids'), ('S', 'a couple of protein building blocks')]


def c3(c, t):
    k = 'c3'
    K.calm_bg(c, t)
    board_title(c, 'each one has a job', t, cue(k))
    cues = [1, 2, 2, 3, 4, 5]
    for i, (el, role) in enumerate(ROLES):
        y = 250 + i * 135
        ai = sm((t - cue(k, cues[i]) + 0.1) / 0.4)
        D.tile(c, el, 380, y, 96, 0.35 + 0.65 * ai, name=False, glow=ai * (1 - sm((t - cue(k, cues[i]) - 1.2) / 0.5)))
        text(c, role, 470, y + 16, 44, CREAM, ai, 'semi')
    # small icons on the right
    D.dna_icon(c, 1640, 640, 0.6, u(t, k, 3), t)


def c4(c, t):
    k = 'c4'
    c.save(); cam_push(c, t, cue(k), 0.05, 1350, 700, 20)
    WD.patio_bg(c, t)
    bx, by = 1450, 795
    WD.tomato_plant(c, bx, by, 1.0, t, s=0.8)
    pour = u(t, k, 1) * (1 - u(t, k, 2, 0.5, -1.0))
    J = PP.nana.draw(c, 1180, 1030, 1.05, t, pose=dict(hands={'L': (210, -470 + 20 * math.sin(t * 2) * pour), 'R': (-60, -330)}, look=0.8, tilt=4))
    WD.scoop(c, J['hdL'][0] - 10, J['hdL'][1] - 6, 0.4 * pour, pour, t)
    WD.plant_food(c, J['hdR'][0] + 10, J['hdR'][1] + 30, 0.9, -8)
    PP.jay.draw(c, 780, 1035, 1.0, t, pose=dict(look=0.8, arms={'R': (8, 12, 0), 'L': (8, 40, 0)}))
    c.restore()
    a2 = u(t, k, 2)
    if a2 > 0:
        dim(c, 0.35 * a2)
        WD.plant_food(c, 1760, 250, 1.3 * a2, 0, a2)
        for i, (el, nm) in enumerate((('N', 'nitrogen'), ('P', 'phosphorus'), ('K', 'potassium'))):
            ai = sm((t - cue(k, 2) - 0.6 - i * 0.4) / 0.4)
            D.tile(c, el, 1290, 120 + i * 115, 90, ai, name=False, glow=0.5 * (0.5 + 0.5 * math.sin(t * 2 + i)) * ai)
            text(c, nm, 1360, 138 + i * 115, 46, CREAM, ai, 'xb')
    a3 = u(t, k, 3)
    if a3 > 0:
        for i in range(4):
            x = 1150 + i * 150 + 20 * math.sin(t + i); y = 900 + 30 * math.cos(t * 0.8 + i)
            D.mol(c, [('N', -24, 0), ('N', 24, 0)], [(0, 1, 3)], x, y, 0.9, a3)
        pill(c, 'nitrogen gas: a tomato can\'t use it', 1380, 1010, CORAL, 36, a3)


def p2q(c, t):
    k = 'p2q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    a = u(t, k)
    WD.pot(c, 420, 900, 1.2)
    WD.tomato_plant(c, 420, 900 - 1.2 * 132, 1.0, t, s=1.0)
    pill(c, 'soil: almost no N', 420, 960, CORAL, 34, u(t, k, 1))
    a2 = u(t, k, 2)
    text(c, 'sugar contains N?', 1250, 380, 54, CREAM, a2, 'xb', 'center')
    text(c, 'protein contains N?', 1250, 520, 54, CREAM, sm((t - cue(k, 2) - 1.2) / 0.4), 'xb', 'center')
    text(c, 'which is it going to struggle to build?', 1250, 720, 44, AMBER, u(t, k, 3), 'semi', 'center')


def p2a(c, t):
    k = 'p2a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    a = u(t, k)
    text(c, 'sugar', 420, 260, 56, CREAM, a, 'xb', 'center')
    for i, el in enumerate('CHO'):
        D.tile(c, el, 300 + i * 120, 380, 90, a, name=False)
    check(c, 420, 520, 1.4, a)
    a0 = sm((t - cue(k) - 1.4) / 0.4)
    text(c, 'protein', 1000, 260, 56, CREAM, a0, 'xb', 'center')
    for i, el in enumerate('CHON'):
        D.tile(c, el, 820 + i * 120, 380, 90, a0, name=False, glow=a0 if el == 'N' else 0)
    cross(c, 1000, 520, 1.4, a0)
    a1 = u(t, k, 1)
    text(c, 'photosynthesis needs proteins', 700, 680, 42, CREAM, a1, 'semi', 'center')
    text(c, 'and chlorophyll: both need N', 700, 740, 42, CREAM, a1, 'semi', 'center')
    a2 = u(t, k, 2)
    WD.pot(c, 1560, 1030, 0.9)
    WD.tomato_plant(c, 1560, 1030 - 0.9 * 132, 1.0 - 0.25 * a2, t, s=0.75, yellow=a2)
    text(c, 'yellow, slow, small', 1560, 560, 42, YELLOW, a2, 'xb', 'center')


# ================================================================ carbon
def zig(n, x0=0, y0=0, dx=70, dy=40):
    return [(x0 + i * dx, y0 + (dy if i % 2 else 0)) for i in range(n)]


def k1(c, t):
    k = 'k1'
    K.calm_bg(c, t)
    a0 = u(t, k) * (1 - u(t, k, 2, 0.5))
    if a0 > 0.01:
        text(c, 'organic', 560, 230, 60, BIO, a0, 'xb', 'center')
        pts = zig(4, 0, 0)
        atoms = [('C', x, y) for x, y in pts] + [('H', pts[0][0] - 40, -40), ('H', pts[3][0] + 40, 80), ('H', pts[1][0], 100), ('H', pts[2][0], -60)]
        D.mol(c, atoms, [(0, 1, 1), (1, 2, 1), (2, 3, 1), (0, 4, 1), (3, 5, 1), (1, 6, 1), (2, 7, 1)], 460, 480, 1.3, a0)
        text(c, 'a carbon skeleton, with H', 560, 750, 38, CREAM, a0, 'semi', 'center')
        a1 = u(t, k, 1) * a0
        text(c, 'inorganic', 1360, 230, 60, INK2, a1, 'xb', 'center')
        D.h2o(c, 1220, 470, 1.2, a1); D.co2(c, 1480, 470, 1.1, a1)
        D.ball(c, 1300, 650, 30, 'C', 0, False)
        text(c, 'water, salts, CO2', 1360, 750, 38, CREAM, a1, 'semi', 'center')
    a2 = u(t, k, 2)
    if a2 > 0.01:
        a2b = a2 * (1 - u(t, k, 3, 0.5))
        # one carbon with four bonds; a shared pair of electrons
        cx, cy = W / 2, 520
        for i in range(4):
            ang = math.radians(45 + 90 * i)
            D.bond(c, (cx, cy), (cx + 200 * math.cos(ang), cy + 200 * math.sin(ang)), 1, a2b, sm((t - cue(k, 2) - i * 0.2) / 0.4), w=11)
            D.ball(c, cx + 200 * math.cos(ang), cy + 200 * math.sin(ang), 32, 'H', a2b * sm((t - cue(k, 2) - i * 0.2) / 0.4))
            ex, ey = cx + 100 * math.cos(ang), cy + 100 * math.sin(ang)
            for s_ in (-1, 1):
                c.drawCircle(ex + s_ * 10 * math.sin(ang), ey - s_ * 10 * math.cos(ang), 7, P((120, 200, 255), 255 * a2b * u(t, k, 2, 0.6, -1.5)))
        D.ball(c, cx, cy, 54, 'C', a2b)
        text(c, '4 covalent bonds', cx, 820, 50, CREAM, a2b, 'xb', 'center')
        hand(c, 'covalent bond = two atoms sharing a pair of electrons', cx, 900, 46, (120, 200, 255), a2b * u(t, k, 2, 1.0, -1.5), 'center')
    a3 = u(t, k, 3)
    if a3 > 0.01:
        board_title(c, 'the carbon skeleton', t, cue(k, 3), AMBER, 120)
        shapes = []
        # chain
        ach = u(t, k, 3)
        D.mol(c, [('C', x, y) for x, y in zig(5)], [(i, i + 1, 1) for i in range(4)], 120, 330, 1.35, ach, u=sm((t - cue(k, 3)) / 1.0))
        text(c, 'chain', 310, 480, 44, CREAM, ach, 'semi', 'center')
        ab = u(t, k, 4)
        D.mol(c, [('C', x, y) for x, y in zig(4)] + [('C', 70, 140), ('C', 210, -100)], [(0, 1, 1), (1, 2, 1), (2, 3, 1), (1, 4, 1), (3, 5, 1)], 1060, 320, 1.35, ab, u=sm((t - cue(k, 4)) / 1.0))
        text(c, 'branched', 1220, 560, 44, CREAM, ab, 'semi', 'center')
        ar = u(t, k, 5)
        ring = [('C', 80 * math.cos(math.radians(30 + 60 * i)), 80 * math.sin(math.radians(30 + 60 * i))) for i in range(6)]
        D.mol(c, ring, [(i, (i + 1) % 6, 1) for i in range(6)], 380, 770, 1.3, ar, u=sm((t - cue(k, 5)) / 1.0))
        text(c, 'ring', 380, 960, 44, CREAM, ar, 'semi', 'center')
        ad = u(t, k, 6)
        D.mol(c, [('C', 0, 0), ('C', 110, 0), ('C', 200, 50)], [(0, 1, 2), (1, 2, 1)], 1020, 770, 1.4, ad, u=sm((t - cue(k, 6)) / 1.0))
        text(c, 'double bond: two shared pairs', 1180, 960, 44, CREAM, ad, 'semi', 'center')


def wax(c, x, y, s, a, t=0.0):
    pts = zig(6, 0, 0, 96, 46)
    atoms = [('C', px, py) for px, py in pts]
    bonds = [(i, i + 1, 1) for i in range(5)]
    for i, (px, py) in enumerate(pts):
        up = -1 if i % 2 == 0 else 1
        atoms.append(('H', px - 30, py + up * 66)); bonds.append((i, len(atoms) - 1, 1))
        atoms.append(('H', px + 30, py + up * 66)); bonds.append((i, len(atoms) - 1, 1))
    return D.mol(c, atoms, bonds, x, y, s, a, r=None)


def k2(c, t):
    k = 'k2'
    K.calm_bg(c, t)
    a = u(t, k) * (1 - u(t, k, 1, 0.5))
    if a > 0.01:
        text(c, 'hydrocarbon: only C and H', W / 2, 160, 54, CREAM, a, 'xb', 'center')
        # candle
        cx = 300
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 50, 560, cx + 50, 900), 10, 10), P((246, 238, 220), 255 * a))
        fl = 1 + 0.08 * math.sin(t * 9)
        K.glow(c, cx, 520, 70 * fl, YELLOW, a)
        c.drawPath(D.smooth_closed([(cx, 470 - 10 * fl), (cx + 16, 520), (cx, 545), (cx - 16, 520)]), P((255, 210, 100), 255 * a))
        text(c, 'candle wax', cx, 960, 38, CREAM, a, 'semi', 'center')
        wax(c, 620, 520, 1.15, a, t)
    a1 = u(t, k, 1)
    if a1 > 0.01:
        a1b = a1 * (1 - u(t, k, 3, 0.5))
        text(c, 'uneven sharing = a polar bond', W / 2, 160, 54, CREAM, a1b, 'xb', 'center')
        D.mol(c, [('O', 0, 0), ('H', 130, 0)], [(0, 1, 1)], 420, 480, 2.4, a1b)
        text(c, 'slightly -', 420, 360, 46, (150, 200, 255), a1b, 'xb', 'center')
        text(c, 'slightly +', 732, 360, 46, CORAL, a1b, 'xb', 'center')
        a2 = u(t, k, 2) * a1b
        if a2 > 0.01:
            pos = [(1150, 450, 0), (1400, 380, 40), (1330, 640, -30), (1580, 560, 15)]
            for i, (x, y, r) in enumerate(pos):
                D.h2o(c, x, y, 1.0, a2, r)
            for (x0, y0), (x1, y1) in (((1180, 480), (1380, 390)), ((1180, 480), (1320, 610)), ((1420, 410), (1560, 540))):
                p = skia.Path(); p.moveTo(x0, y0); p.lineTo(x1, y1)
                c.drawPath(p, skia.Paint(AntiAlias=True, Color=C(AMBER, 255 * a2), Style=skia.Paint.kStroke_Style, StrokeWidth=4,
                                         PathEffect=skia.DashPathEffect.Make([10, 10], 0)))
            text(c, 'water clings by hydrogen bonds', 1370, 800, 40, AMBER, a2, 'semi', 'center')
    a3 = u(t, k, 3)
    if a3 > 0.01:
        text(c, 'C and H share almost evenly: nonpolar', W / 2, 160, 50, CREAM, a3, 'xb', 'center')
        pts = wax(c, 520, 520, 1.1, a3, t)
        for i in range(6):
            f = ((t - cue(k, 3)) * 0.35 + i / 6) % 1
            x = 560 + i * 110; y = 300 + 0 * f
            D.h2o(c, x, 330 - 30 * math.sin(f * math.pi), 0.8, a3 * 0.9, 20 * math.sin(t + i))
        pill(c, "doesn't mix with water", W / 2, 850, BIO, 40, a3)


def ring_mol(n_ring, subs, x, y, c, s, a, u_=1.0):
    """n_ring: list of ring atom symbols; subs: list of (ring index, symbol, direction deg)"""
    m = len(n_ring)
    R = 90
    atoms = [(el, R * math.cos(math.radians(-90 + 360 * i / m)), R * math.sin(math.radians(-90 + 360 * i / m))) for i, el in enumerate(n_ring)]
    bonds = [(i, (i + 1) % m, 1) for i in range(m)]
    for ri, el, deg in subs:
        rx, ry = atoms[ri][1], atoms[ri][2]
        L = 74 if el != 'H' else 60
        atoms.append((el, rx + L * math.cos(math.radians(deg)), ry + L * math.sin(math.radians(deg))))
        bonds.append((ri, len(atoms) - 1, 1))
    return D.mol(c, atoms, bonds, x, y, s, a, u=u_)


def glucose(c, x, y, s, a, u_=1.0):
    return ring_mol(['O', 'C', 'C', 'C', 'C', 'C'], [(1, 'O', -30), (2, 'O', 30), (3, 'O', 90), (4, 'O', 150), (5, 'C', -150)], x, y, c, s, a, u_)


def fructose(c, x, y, s, a, u_=1.0):
    return ring_mol(['O', 'C', 'C', 'C', 'C'], [(1, 'O', -40), (1, 'C', 30), (2, 'O', 60), (3, 'O', 120), (4, 'C', -140)], x, y, c, s, a, u_)


def k3(c, t):
    k = 'k3'
    K.calm_bg(c, t)
    board_title(c, 'same atoms, different arrangement', t, cue(k))
    a1 = u(t, k, 1)
    glucose(c, 560, 480, 1.3, a1, sm((t - cue(k, 1)) / 1.2))
    fructose(c, 1360, 480, 1.3, a1, sm((t - cue(k, 1)) / 1.2))
    text(c, 'glucose', 560, 790, 46, CREAM, a1, 'xb', 'center')
    text(c, 'fructose', 1360, 790, 46, CREAM, a1, 'xb', 'center')
    D.formula(c, 'C6H12O6', 560, 870, 54, AMBER, a1)
    D.formula(c, 'C6H12O6', 1360, 870, 54, AMBER, a1)
    text(c, 'H atoms not drawn', W / 2, 1050, 32, INK2, a1, 'semi', 'center')
    pill(c, 'tastes sweeter', 1360, 260, CORAL, 34, u(t, k, 3))
    hand(c, 'isomers', W / 2, 990, 80, AMBER, u(t, k, 4, 0.8), 'center')


ETHANOL = ([('C', 0, 0), ('C', 90, -40), ('O', 180, 0), ('H', 250, -30), ('H', -40, -60), ('H', -60, 30), ('H', 10, 70),
            ('H', 80, -120), ('H', 110, 40)], [(0, 1, 1), (1, 2, 1), (2, 3, 1), (0, 4, 1), (0, 5, 1), (0, 6, 1), (1, 7, 1), (1, 8, 1)])
ETHER = ([('C', 0, 0), ('O', 90, -40), ('C', 180, 0), ('H', -40, -60), ('H', -60, 30), ('H', 10, 70), ('H', 220, -60),
          ('H', 240, 30), ('H', 170, 70)], [(0, 1, 1), (1, 2, 1), (0, 3, 1), (0, 4, 1), (0, 5, 1), (2, 6, 1), (2, 7, 1), (2, 8, 1)])


def p3q(c, t):
    k = 'p3q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    a = u(t, k, 1)
    D.formula(c, 'C2H6O', 520, 300, 70, AMBER, a); D.formula(c, 'C2H6O', 1400, 300, 70, AMBER, a)
    a2 = u(t, k, 2)
    D.mol(c, *ETHANOL, 420, 560, 1.3, a2)
    D.mol(c, *ETHER, 1290, 560, 1.3, a2)
    text(c, 'ethanol, in drinks', 520, 790, 42, CREAM, a2, 'semi', 'center')
    text(c, 'a gas in spray cans', 1400, 790, 42, CREAM, a2, 'semi', 'center')
    text(c, 'how can they be different? the word?', W / 2, 960, 46, CREAM, u(t, k, 3), 'semi', 'center')


def p3a(c, t):
    k = 'p3a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    a = 1.0
    D.formula(c, 'C2H6O', 520, 300, 70, AMBER, a); D.formula(c, 'C2H6O', 1400, 300, 70, AMBER, a)
    gl = u(t, k, 1)
    D.mol(c, *ETHANOL, 420, 560, 1.3, a, glow={2: gl})
    D.mol(c, *ETHER, 1290, 560, 1.3, a, glow={1: gl})
    hand(c, 'isomers', W / 2, 180, 90, AMBER, u(t, k, 0, 0.8), 'center')
    text(c, 'the O sits in a different place', W / 2, 840, 44, CREAM, gl, 'semi', 'center')
    pill(c, 'different shape, different behavior', W / 2, 960, BIO, 38, u(t, k, 2))


# ================================================================ functional groups
GROUPS = dict(
    hydroxyl=([('O', 0, 0), ('H', 60, -30)], [(0, 1, 1)], 'OH'),
    carbonyl=([('C', 0, 0), ('O', 0, -80)], [(0, 1, 2)], 'C=O'),
    carboxyl=([('C', 0, 0), ('O', 0, -80), ('O', 70, 40), ('H', 130, 20)], [(0, 1, 2), (0, 2, 1), (2, 3, 1)], 'COOH'),
    amino=([('N', 0, 0), ('H', 50, -45), ('H', 50, 45)], [(0, 1, 1), (0, 2, 1)], 'NH2'),
    phosphate=([('P', 0, 0), ('O', 0, -76), ('O', 76, 0), ('O', 0, 76), ('O', -76, 0)], [(0, 1, 2), (0, 2, 1), (0, 3, 1), (0, 4, 1)], 'PO4'),
    sulfhydryl=([('S', 0, 0), ('H', 60, -30)], [(0, 1, 1)], 'SH'),
    methyl=([('C', 0, 0), ('H', 50, -45), ('H', 60, 10), ('H', 30, 55)], [(0, 1, 1), (0, 2, 1), (0, 3, 1)], 'CH3'),
)
GCOL = dict(hydroxyl=CORAL, carbonyl=CORAL, carboxyl=AMBER, amino=BLUE, phosphate=(250, 150, 60), sulfhydryl=YELLOW, methyl=(200, 206, 236))


def group(c, name, x, y, s=1.0, a=1.0, title=True, ty=None):
    atoms, bonds, _ = GROUPS[name]
    if title:
        text(c, name, x + 20 * s, (ty if ty is not None else y + 150 * s), 44 * s, GCOL[name], a, 'xb', 'center')
    return D.mol(c, atoms, bonds, x, y, s, a)


def skeleton(c, x, y, s, a, n=6):
    pts = zig(n, 0, 0, 80, 44)
    D.mol(c, [('C', px, py) for px, py in pts], [(i, i + 1, 1) for i in range(n - 1)], x, y, s, a)
    return [(x + px * s, y + py * s) for px, py in pts]


def f1(c, t):
    k = 'f1'
    K.calm_bg(c, t)
    pts = skeleton(c, 620, 520, 1.6, 1.0)
    text(c, 'a bare skeleton', W / 2, 220, 50, INK2, 1 - u(t, k, 1), 'xb', 'center')
    for i, (name, ci, dy) in enumerate((('hydroxyl', 0, -1), ('amino', 3, 1), ('carboxyl', 5, -1))):
        ai = sm((t - cue(k, 1) - i * 0.5) / 0.4)
        if ai > 0.01:
            px, py = pts[ci]
            D.bond(c, (px, py), (px, py + dy * 100), 1, ai, w=8)
            atoms, bonds, _ = GROUPS[name]
            D.mol(c, atoms, bonds, px, py + dy * 130, 1.1, ai)
            K.glow(c, px, py + dy * 120, 80, GCOL[name], ai * (1 - sm((t - cue(k, 1) - i * 0.5 - 0.8) / 0.6)))
    hand(c, 'functional groups', W / 2, 960, 80, AMBER, u(t, k, 2, 0.8), 'center')
    text(c, 'each acts about the same on any molecule', W / 2, 1040, 34, CREAM, u(t, k, 2, 0.6, -1.4), 'semi', 'center')


def f2(c, t):
    k = 'f2'
    K.calm_bg(c, t)
    a = u(t, k)
    group(c, 'hydroxyl', 360, 470, 2.0, a, ty=700)
    for i, (x, y, r) in enumerate(((560, 360, 30), (600, 560, -20))):
        D.h2o(c, x, y, 1.0, a * sm((t - cue(k) - 1.0 - i * 0.3) / 0.4), r)
    text(c, 'polar: helps a molecule dissolve', 400, 770, 34, CREAM, a, 'semi', 'center')
    a1 = u(t, k, 1)
    group(c, 'carbonyl', 960, 540, 2.0, a1, ty=700)
    text(c, 'polar too', 980, 770, 34, CREAM, a1, 'semi', 'center')
    a2 = u(t, k, 2)
    pts = glucose(c, 1520, 470, 1.1, a2)
    if a2 > 0:
        for i in (6, 7, 8, 9):
            K.glow(c, *pts[i], 60, CORAL, a2 * 0.8)
        text(c, 'all over sugars', 1520, 770, 40, CREAM, a2, 'semi', 'center')


def hplus(c, x, y, a):
    D.ball(c, x, y, 18, 'H', a, False)
    text(c, '+', x + 22, y - 14, 34, CORAL, a, 'xb', 'center')


def f3(c, t):
    k = 'f3'
    K.calm_bg(c, t)
    a = u(t, k)
    # carboxyl gives off H+
    f = sm((t - cue(k) - 1.6) / 1.2)
    D.mol(c, [('C', 0, 0), ('O', 0, -80), ('O', 70, 40)], [(0, 1, 2), (0, 2, 1)], 260, 420, 1.2, a)
    if f < 0.02:
        D.bond(c, (260 + 84, 468), (260 + 156, 444), 1, a, w=8)
    hplus(c, 260 + 156 + 140 * f, 444 - 120 * f, a)
    text(c, '-', 260 + 100, 500, 50, (150, 200, 255), a * f, 'xb', 'center')
    text(c, 'carboxyl', 320, 640, 46, AMBER, a, 'xb', 'center')
    text(c, 'acid: gives off H+', 320, 700, 36, CREAM, a, 'semi', 'center')
    # amino picks one up
    a1 = u(t, k, 1)
    g = sm((t - cue(k, 1) - 1.0) / 1.2)
    D.mol(c, [('N', 0, 0), ('H', 50, -45), ('H', 50, 45)], [(0, 1, 1), (0, 2, 1)], 800, 440, 1.2, a1)
    hplus(c, 800 - 60 - 140 * (1 - g), 440 - 60 * g - 100 * (1 - g), a1)
    text(c, '+', 800 + 10, 360, 50, CORAL, a1 * g, 'xb', 'center')
    text(c, 'amino', 830, 640, 46, BLUE, a1, 'xb', 'center')
    text(c, 'base: picks up H+', 830, 700, 36, CREAM, a1, 'semi', 'center')
    a2 = u(t, k, 2)
    if a2 > 0:
        # an amino acid backbone with both groups
        D.mol(c, [('N', 0, 0), ('C', 90, 30), ('C', 180, 0), ('O', 180, -80), ('O', 260, 40), ('H', -50, -40), ('H', -50, 40), ('H', 320, 20), ('C', 90, 120)],
              [(0, 1, 1), (1, 2, 1), (2, 3, 2), (2, 4, 1), (0, 5, 1), (0, 6, 1), (4, 7, 1), (1, 8, 1)], 1060, 880, 0.95, a2)
        text(c, 'every amino acid has both', 640, 900, 40, CREAM, a2, 'semi', 'center')
    a3 = u(t, k, 3)
    group(c, 'phosphate', 1480, 440, 1.2, a3, ty=640)
    for (dx, dy) in ((92, 0), (0, 92)):
        text(c, '-', 1480 + dx + 30, 440 + dy + 10, 56, (150, 200, 255), a3, 'xb', 'center')
    text(c, 'negative, in DNA and ATP', 1480, 700, 36, CREAM, a3, 'semi', 'center')


def f4(c, t):
    k = 'f4'
    K.calm_bg(c, t)
    a = u(t, k)
    # a protein chain folded back on itself; two SH groups meet and link
    j = sm((t - cue(k, 1)) / 1.2)
    p = skia.Path(); p.moveTo(200, 380); p.cubicTo(500, 300, 700, 300, 800, 420); p.cubicTo(860, 520, 700, 640, 500, 640); p.cubicTo(320, 640, 240, 760, 300, 860)
    c.drawPath(p, SP((150, 160, 220), 22, 255 * a))
    text(c, 'part of a protein', 300, 300, 38, CREAM, a, 'semi', 'center')
    s1 = (640, 360 + 70 * j * 0.5); s2 = (620, 640 - 70 * j * 0.5)
    c.drawLine(640, 330, *s1, SP((150, 160, 220), 10, 255 * a)); c.drawLine(620, 660, *s2, SP((150, 160, 220), 10, 255 * a))
    if j < 0.6:
        D.ball(c, *s1, 26, 'S', a); D.ball(c, s1[0] + 40, s1[1] + 30, 15, 'H', a * (1 - j / 0.6), False)
        D.ball(c, *s2, 26, 'S', a); D.ball(c, s2[0] + 40, s2[1] - 30, 15, 'H', a * (1 - j / 0.6), False)
    else:
        D.bond(c, s1, s2, 1, a, w=9)
        D.ball(c, *s1, 26, 'S', a, glow=0.5); D.ball(c, *s2, 26, 'S', a, glow=0.5)
    text(c, 'sulfhydryl: SH', 640, 820, 46, YELLOW, a, 'xb', 'center')
    text(c, 'two link the protein together', 640, 880, 36, CREAM, j, 'semi', 'center')
    a2 = u(t, k, 2)
    group(c, 'methyl', 1380, 330, 1.3, a2, ty=480)
    text(c, 'nonpolar', 1400, 530, 36, CREAM, a2, 'semi', 'center')
    a3 = u(t, k, 3)
    D.dna_icon(c, 1400, 790, 1.1, a3, t)
    if a3 > 0:
        D.ball(c, 1400 + 60, 760, 16, 'C', a3, False, glow=0.6)
        text(c, 'on DNA: changes how a gene is read', 1400, 1020, 40, CREAM, a3, 'semi', 'center')


CYS = ([('S', 0, 0), ('H', -60, -30), ('C', 90, 30), ('C', 180, 0), ('N', 180, -90), ('H', 140, -140), ('H', 230, -140),
        ('C', 270, 30), ('O', 270, 120), ('O', 350, -10), ('H', 410, 20)],
       [(0, 1, 1), (0, 2, 1), (2, 3, 1), (3, 4, 1), (4, 5, 1), (4, 6, 1), (3, 7, 1), (7, 8, 2), (7, 9, 1), (9, 10, 1)])


def p4q(c, t):
    k = 'p4q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    a = u(t, k, 1)
    D.mol(c, *CYS, 660, 560, 1.5, a)
    text(c, 'cysteine', W / 2, 220, 60, BIO, a, 'xb', 'center')
    text(c, 'three functional groups? which elements?', W / 2, 960, 46, CREAM, u(t, k, 2), 'semi', 'center')


def ring_hl(c, x, y, r, col, a, name, lx, ly):
    if a <= 0.01:
        return
    c.drawCircle(x, y, r, SP(col, 6, 255 * a))
    text(c, name, lx, ly, 44, col, a, 'xb', 'center')


def p4a(c, t):
    k = 'p4a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    D.mol(c, *CYS, 660, 560, 1.5, 1.0)
    ring_hl(c, 620, 565, 110, YELLOW, u(t, k), 'sulfhydryl SH', 520, 760)
    ring_hl(c, 930, 400, 110, BLUE, u(t, k, 1), 'amino NH2', 930, 220)
    ring_hl(c, 1150, 590, 150, AMBER, u(t, k, 2), 'carboxyl COOH', 1300, 820)
    a3 = u(t, k, 3)
    for i, el in enumerate('CHONS'):
        D.tile(c, el, 640 + i * 160, 960, 90, a3 * sm((t - cue(k, 3) - i * 0.15) / 0.3), name=False, glow=a3 if el == 'S' else 0)


# ================================================================ four families
def kitchen(c, t, eat=0.0, talk_nana=0.0, hl=None, cam0=None):
    c.save()
    if cam0 is not None:
        cam_push(c, t, cam0, 0.04, W / 2, 700, 16)
    WD.kitchen_bg(c, t)
    WD.chair(c, 40); WD.chair(c, 1650)
    bite = math.sin(min(1, eat) * math.pi)
    PP.jay.draw(c, 560, 1120, 1.05, t, pose=dict(legs=False, look=0.5, hands={'L': (95, -245), 'R': (-80 + 60 * bite, -245 - 230 * bite)}))
    if bite > 0.05:
        jx, jy = 560 + (-80 + 60 * bite) * 1.05, 1120 + (-245 - 230 * bite) * 1.05
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(jx - 22, jy - 30, jx + 22, jy + 6), 8, 8), P((236, 210, 160)))
    nod = 3 * math.sin(t * 2.2) * talk_nana
    PP.nana.draw(c, 1360, 1140, 1.05, t, pose=dict(legs=False, look=-0.7, tilt=-4 + nod, hands={'L': (95, -235), 'R': (-100 - 60 * talk_nana, -235 - 120 * talk_nana)}))
    pos = WD.kitchen_table(c, t, 1.0, hl=hl)
    c.restore()
    return pos


def m0(c, t):
    k = 'm0'
    kitchen(c, t, talk_nana=u(t, k, 1) * (1 - u(t, k, 2)), cam0=cue(k))
    a = u(t, k, 2)
    pos = {'bread': (480, 1150), 'butter': (865, 1150), 'cheese': (1040, 1150), 'tomato': (1300, 1150)}
    for i, (nm, lab) in enumerate((('bread', 'bread'), ('butter', 'butter'), ('cheese', 'cheese'), ('tomato', 'tomatoes'))):
        ai = sm((t - cue(k, 2) - i * 0.35) / 0.3)
        x, y = pos[nm]
        pill(c, lab, x, y - 150, CREAM if i % 2 else AMBER, 38, ai)
    K.vignette(c)


FAM = [('carbohydrates', 'CHO', 'bread', GREEN), ('lipids', 'CHO', 'butter', YELLOW), ('proteins', 'CHON', 'cheese', BLUE), ('nucleic acids', 'CHONP', 'dna', LILAC)]


def fam_card(c, i, x, y, a, t, sub=None, els=None, hl=0.0, sc=1.0):
    if a <= 0.01:
        return
    c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y)
    name, el, icon, col = FAM[i]
    els = els or el
    r = skia.RRect.MakeRectXY(skia.Rect(x - 200, y - 260, x + 200, y + 260), 26, 26)
    c.drawRRect(r, P((30, 34, 70), 230 * a))
    c.drawRRect(r, SP(col, 4 + 4 * hl, 255 * a))
    if hl > 0:
        K.glow(c, x, y, 260, col, hl * a * 0.6)
    {'bread': D.bread_icon, 'butter': D.butter_icon, 'cheese': D.cheese_icon}.get(icon, lambda c_, x_, y_, s_, a_: D.dna_icon(c_, x_, y_, 0.7, a_, t))(c, x, y - 120, 0.9, a)
    text(c, name, x, y + 50, 40, col, a, 'xb', 'center')
    for j, e in enumerate(els):
        D.tile(c, e, x - (len(els) - 1) * 34 + j * 68, y + 130, 54, a, name=False)
    if sub:
        text(c, sub, x, y + 225, 32, CREAM, a, 'semi', 'center')
    c.restore()


def m1(c, t):
    k = 'm1'
    K.calm_bg(c, t)
    board_title(c, 'four families of molecules', t, cue(k))
    xs = [300, 740, 1180, 1620]
    fam_card(c, 0, xs[0], 600, u(t, k, 1), t, 'like the starch in bread')
    fam_card(c, 1, xs[1], 600, u(t, k, 2), t, 'mostly C-H, like wax', els='CHO')
    for i in (2, 3):
        fam_card(c, i, xs[i], 600, 0.22, t)
    if u(t, k, 1) < 0.99:
        fam_card(c, 0, xs[0], 600, 0.22, t)
    if u(t, k, 2) < 0.99:
        fam_card(c, 1, xs[1], 600, 0.22, t)
    a3 = u(t, k, 2, 0.5, -3.5)
    if a3 > 0:
        pill(c, 'membrane phospholipids also carry P', 960, 960, (250, 150, 60), 34, a3)


def m2(c, t):
    k = 'm2'
    K.calm_bg(c, t)
    board_title(c, 'four families of molecules', t, cue(k))
    xs = [300, 740, 1180, 1620]
    fam_card(c, 0, xs[0], 600, 1.0, t)
    fam_card(c, 1, xs[1], 600, 1.0, t)
    fam_card(c, 2, xs[2], 600, u(t, k), t, 'some contain S', els='CHON')
    fam_card(c, 3, xs[3], 600, u(t, k, 2), t, 'store gene information')
    a3 = u(t, k, 3)
    if a3 > 0:
        dim(c, 0.4 * a3)
        pill(c, 'wheat, tomato, cow: DNA in almost every cell', W / 2, 960, LILAC, 36, a3)


def p5q(c, t):
    k = 'p5q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    a = u(t, k, 1)
    D.atom(c, 250, 520, 1.0, 16, 19, 0, a, t, radiate=0.7, seed=11)
    text(c, 'sulfur-35', 250, 760, 46, YELLOW, a, 'xb', 'center')
    xs = [640, 980, 1320, 1660]
    for i in range(4):
        fam_card(c, i, xs[i], 520, u(t, k, 2), t, sc=0.8)
    for i in range(4):
        pass
    text(c, 'where does most of it show up?', 1210, 940, 44, CREAM, u(t, k, 2), 'semi', 'center')


def p5a(c, t):
    k = 'p5a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    xs = [640, 980, 1320, 1660]
    f = u(t, k, 0, 1.0)
    for i in range(4):
        fam_card(c, i, xs[i], 560, 1.0 if i == 2 else 1 - 0.5 * u(t, k, 2), t, hl=f if i == 2 else 0, sc=0.8)
    D.atom(c, 250, 520, 1.0, 16, 19, 0, 1.0, t, radiate=0.7, seed=11)
    text(c, 'proteins', 1320, 160, 60, BLUE, f, 'xb', 'center')
    text(c, 'S is in a couple of amino acids', 1210, 900, 40, CREAM, u(t, k, 1), 'semi', 'center')
    text(c, 'DNA, simple sugars and fats: none', 1210, 960, 36, INK2, u(t, k, 2), 'semi', 'center')
    for i in (0, 1, 3):
        text(c, 'no S', xs[i], 770, 40, CORAL, u(t, k, 2), 'xb', 'center')


# ================================================================ building big molecules
def lipid_icon(c, x, y, s, a):
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-70, -40, 70, 0), 14, 14), P(YELLOW, 255 * a))
    for i in range(3):
        p = skia.Path(); xx = -45 + i * 45
        p.moveTo(xx, 0)
        for j in range(6):
            p.lineTo(xx + (10 if j % 2 else -10), 26 + j * 26)
        c.drawPath(p, SP((240, 220, 160), 8, 255 * a))
    c.restore()


def necklace(c, cx, cy, R, n, a, t, cols=None):
    pts = [(cx + R * math.cos(2 * math.pi * i / n + t * 0.1), cy + R * 0.75 * math.sin(2 * math.pi * i / n + t * 0.1)) for i in range(n)]
    for i in range(n):
        D.string(c, pts[i], pts[(i + 1) % n], a)
    for i, p in enumerate(pts):
        D.bead(c, *p, 24, (cols[i % len(cols)] if cols else AMBER), a)
    return pts


def y1(c, t):
    k = 'y1'
    K.calm_bg(c, t)
    text(c, 'macromolecules: big molecules', W / 2, 140, 50, CREAM, u(t, k), 'xb', 'center')
    hand(c, 'poly = many parts', 520, 300, 66, AMBER, u(t, k, 1, 0.8), 'center')
    hand(c, 'mono = one', 520, 420, 66, BIO, u(t, k, 2, 0.8), 'center')
    a2 = u(t, k, 2)
    if a2 > 0:
        us = [sm((t - cue(k, 2) - i * 0.18) / 0.3) for i in range(8)]
        D.chain(c, 1060, 360, 8, 92, 30, a2, cols=[AMBER], us=us)
    a3 = u(t, k, 3)
    if a3 > 0:
        pts = necklace(c, 960, 760, 300, 14, a3, t, cols=[AMBER])
        label(c, 'bead = monomer', pts[7][0] - 300, pts[7][1] - 60, AMBER, 38, a3, dot=pts[7])
        mx, my = (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2
        label(c, 'string = covalent bond', mx + 80, my - 50, CREAM, 38, sm((t - cue(k, 3) - 1.0) / 0.4), dot=(mx, my))


def y2(c, t):
    k = 'y2'
    K.calm_bg(c, t)
    a = u(t, k)
    D.chain(c, 300, 260, 12, 120, 30, a * (1 - 0.6 * u(t, k, 2)), cols=[AMBER], t=t, wave=0.4)
    text(c, 'one kind, repeated', 300, 190, 36, CREAM, a, 'semi')
    a1 = u(t, k, 1)
    D.chain(c, 300, 480, 12, 120, 30, a1 * (1 - 0.6 * u(t, k, 2)), cols=[CORAL, TEAL, YELLOW, BLUE, CORAL, CORAL, LILAC, TEAL, GREEN, BLUE, YELLOW, CORAL], t=t, wave=0.4)
    text(c, 'many kinds, in an order', 300, 410, 36, CREAM, a1, 'semi')
    a2 = u(t, k, 2)
    for i, (nm, col) in enumerate((('carbohydrates', GREEN), ('proteins', BLUE), ('nucleic acids', LILAC))):
        ai = sm((t - cue(k, 2) - i * 0.3) / 0.4)
        pill(c, nm + ': polymers', 420 + i * 520, 700, col, 34, ai)
    a3 = u(t, k, 3)
    if a3 > 0:
        lipid_icon(c, 960, 860, 1.0, a3)
        pill(c, 'lipids: not true polymers', 960, 1020, YELLOW, 34, a3)
        cross(c, 1110, 870, 0.9, a3)


def b1(c, t):
    k = 'b1'
    K.calm_bg(c, t)
    board_title(c, 'joining two monomers', t, cue(k))
    j = u(t, k, 4, 0.8)
    xl, xr = 720 + 100 * j, 1200 - 100 * j
    y = 560
    ohu = 1 - u(t, k, 3, 0.4)
    D.bead(c, xl, y, 60, AMBER, 1.0, oh=0, hh=0)
    D.bead(c, xr, y, 60, GREEN, 1.0)
    # the OH leaving the left bead, the H leaving the right bead
    lo = u(t, k, 1, 0.6); lh = u(t, k, 2, 0.6)
    w = u(t, k, 3, 0.8)
    ox, oy = xl + 100 + (W / 2 - 20 - xl - 100) * w, y - 160 * w
    hx, hy = xr - 80 + (W / 2 + 30 - xr + 80) * w, y - 160 * w + 20 * w
    if w < 0.98:
        D.bond(c, (xl + 60, y), (ox - 18, oy), 1, (1 - lo * 0.7) * (1 - w), w=6)
        D.bond(c, (xr - 60, y), (hx + 10, hy), 1, (1 - lh * 0.7) * (1 - w), w=6)
    D.ball(c, ox, oy, 26, 'O', 1.0, glow=lo * (1 - w))
    D.ball(c, ox + 50, oy - 24 * (1 - w), 17, 'H', 1.0, False, glow=lo * (1 - w))
    D.ball(c, hx, hy, 17, 'H', 1.0, False, glow=lh * (1 - w))
    text(c, 'OH', ox + 20, oy - 50, 40, CORAL, lo * (1 - w), 'xb', 'center')
    text(c, 'H', hx, hy - 40, 40, CREAM, lh * (1 - w), 'xb', 'center')
    if w > 0.01:
        text(c, 'water released', W / 2, oy - 70, 38, (140, 200, 255), w, 'semi', 'center')
        oy2 = oy - 120 * u(t, k, 4, 2.0)
    if j > 0.01:
        D.bond(c, (xl + 60, y), (xr - 60, y), 1, j, w=10)
        K.glow(c, W / 2, y, 80, AMBER, j * (1 - u(t, k, 5, 0.6)))
        label(c, 'new covalent bond', W / 2, 760, CREAM, 38, j, dot=(W / 2, y + 6))
    a5 = u(t, k, 5)
    hand(c, 'dehydration synthesis', W / 2, 920, 84, AMBER, a5, 'center')
    text(c, 'water out, something built', W / 2, 1010, 38, CREAM, sm((t - cue(k, 5) - 1.2) / 0.4), 'semi', 'center')


def b2(c, t):
    k = 'b2'
    K.calm_bg(c, t)
    n = 1 + int(min(9, (t - cue(k)) / 0.85))
    us = [1.0 if i < n else 0.0 for i in range(10)]
    pts = D.chain(c, 400, 480, 10, 125, 34, 1.0, cols=[AMBER, GREEN, CORAL, BLUE], us=us)
    for i in range(1, n):
        tt = cue(k) + i * 0.85
        f = sm((t - tt) / 1.2)
        x = (pts[i - 1][0] + pts[i][0]) / 2
        if f < 1:
            D.h2o(c, x, 480 - 60 - 180 * f, 0.7, 1 - f)
    a2 = u(t, k, 2)
    text(c, f'{n} monomers', 520, 720, 50, CREAM, 1.0, 'xb', 'center')
    text(c, f'{max(0, n - 1)} waters', 1400, 720, 50, (140, 200, 255), 1.0, 'xb', 'center')
    pill(c, 'n monomers  ->  n - 1 waters', W / 2, 900, AMBER, 44, a2)


def b3(c, t):
    k = 'b3'
    K.calm_bg(c, t)
    board_title(c, 'breaking a polymer: run it backwards', t, cue(k))
    br = u(t, k, 3, 0.8)
    xl, xr = 760 - 100 * br, 1160 + 100 * br
    y = 560
    D.bead(c, xl, y, 60, AMBER); D.bead(c, xr, y, 60, GREEN)
    if br < 0.98:
        D.bond(c, (xl + 60, y), (xr - 60, y), 1, 1 - br, w=10)
    a1 = u(t, k, 1, 1.0)
    sp = u(t, k, 2, 0.8)
    if sp < 0.02:
        D.h2o(c, W / 2, 360 + 140 * a1, 1.4, 1.0)
    else:
        D.ball(c, W / 2 + 60 - 230 * sp - 100 * br, y - 20 + 20 * sp, 17, 'H', 1.0, False, glow=0.4)
        D.ball(c, W / 2 + 30 + 200 * sp + 100 * br, y - 30, 26, 'O', 1.0, glow=0.4)
        D.ball(c, W / 2 + 72 + 200 * sp + 100 * br, y - 50, 17, 'H', 1.0, False, glow=0.4)
        text(c, 'H', xl + 110, 440, 36, CREAM, sp, 'xb', 'center')
        text(c, 'OH', xr - 70, 440, 36, CREAM, sp, 'xb', 'center')
    hand(c, 'hydrolysis', W / 2, 900, 90, AMBER, u(t, k, 3, 0.8, -0.8), 'center')
    text(c, 'hydro = water, lysis = splitting', W / 2, 1000, 38, CREAM, u(t, k, 3, 0.6, -1.6), 'semi', 'center')


def b4(c, t):
    k = 'b4'
    eat = ((t - cue(k)) / 2.2) % 1 if t < cue(k, 1) + 1.5 else 0
    kitchen(c, t, eat=eat)
    a = u(t, k, 1)
    if a > 0:
        dim(c, 0.55 * a)
        # inside: a starch chain cut into sugars (hydrolysis), then rebuilt into Jay's own chain
        cut = u(t, k, 2, 1.2)
        reb = u(t, k, 3, 1.4)
        n = 8
        for i in range(n):
            x0 = 620 + i * 90
            x1 = 700 + i * 120 + 30 * math.sin(t + i)
            y1 = 270 + 40 * math.sin(i * 1.3 + t * 0.7)
            x2, y2 = 640 + i * 110, 330
            x = x0 + (x1 - x0) * cut + (x2 - x1) * reb
            yy = 200 + (y1 - 200) * cut + (y2 - y1) * reb
            if i < n - 1 and cut < 0.98:
                D.string(c, (x0, 200), (x0 + 90, 200), a * (1 - cut))
            D.bead(c, x, yy, 30, GREEN, a)
            if i < n - 1 and reb > 0.98:
                D.string(c, (x, yy), (x + 110, yy), a)
        text(c, 'starch from the bread', 620, 140, 40, CREAM, a * (1 - cut), 'semi', 'left')
        pill(c, 'hydrolysis: cut into sugars', W / 2, 80, AMBER, 38, cut * (1 - reb))
        pill(c, 'dehydration synthesis: his own polymers', W / 2, 80, BIO, 38, reb)
        hand(c, 'the bread becomes part of Jay', W / 2, 1000, 64, AMBER, u(t, k, 4, 0.6, 0.3), 'center')
    K.vignette(c)


def b5(c, t):
    k = 'b5'
    K.calm_bg(c, t)
    a = u(t, k)
    text(c, 'without help: centuries or longer', W / 2, 150, 46, INK2, a * (1 - u(t, k, 1)), 'xb', 'center')
    n = 9
    cutx = 380 + (t - cue(k, 1)) * 320 if t > cue(k, 1) else -100
    pts = [(380 + i * 140, 420) for i in range(n)]
    for i in range(n - 1):
        mid = (pts[i][0] + pts[i + 1][0]) / 2
        if cutx < mid:
            D.string(c, pts[i], pts[i + 1], 1.0)
    for i, p in enumerate(pts):
        off = 40 * sm((cutx - p[0]) / 200) * (1 if i % 2 else -1)
        D.bead(c, p[0], p[1] + off, 32, GREEN)
    a1 = u(t, k, 1)
    if a1 > 0:
        ex = min(cutx, 1600)
        D.enzyme(c, ex, 420, 0.9, a1, 0.5 + 0.5 * math.sin(t * 8))
        text(c, 'enzyme: mostly protein', W / 2, 150, 46, (110, 206, 180), a1 * (1 - u(t, k, 2)), 'xb', 'center')
    a2 = u(t, k, 2)
    if a2 > 0:
        dim(c, 0.3 * a2)
        text(c, 'each shape fits only its own target', W / 2, 150, 46, CREAM, a2, 'xb', 'center')
        D.enzyme(c, 560, 830, 0.8, a2, 0.6)
        D.chain(c, 760, 830, 4, 80, 26, a2, cols=[GREEN])
        check(c, 560, 680, 1.0, a2)
        text(c, 'saliva enzyme + starch', 760, 980, 34, CREAM, a2, 'semi', 'center')
        bounce = 30 * abs(math.sin(t * 3))
        D.enzyme(c, 1240 - bounce, 830, 0.8, a2, 0.6)
        pp = [(1440 + i * 80, 830 + (14 if i % 2 else -14)) for i in range(4)]
        for i in range(3):
            D.string(c, pp[i], pp[i + 1], a2)
        for p in pp:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(p[0] - 26, p[1] - 26, p[0] + 26, p[1] + 26), 6, 6), P(BLUE, 255 * a2))
        cross(c, 1240, 680, 1.0, a2)
        text(c, 'same enzyme + protein', 1460, 980, 34, CREAM, a2, 'semi', 'center')


def p7q(c, t):
    k = 'p7q'
    K.calm_bg(c, t)
    practice_tag(c, t, cue(k))
    a = u(t, k, 1)
    us = [sm((t - cue(k, 1) - i * 0.1) / 0.3) for i in range(10)]
    D.chain(c, 330, 420, 10, 140, 34, a, cols=[GREEN], us=us)
    text(c, '10 sugar monomers, one straight chain', W / 2, 260, 44, CREAM, a, 'semi', 'center')
    text(c, 'how many waters released?', W / 2, 680, 50, CREAM, u(t, k, 2), 'xb', 'center')
    text(c, 'hydrolyzed: monomers heavier or lighter than the chain?', W / 2, 800, 44, AMBER, u(t, k, 3), 'semi', 'center')


def p7a(c, t):
    k = 'p7a'
    K.calm_bg(c, t)
    answer_tag(c, t, cue(k))
    pts = D.chain(c, 330, 380, 10, 140, 34, 1.0, cols=[GREEN])
    for i in range(9):
        ai = sm((t - cue(k) - i * 0.15) / 0.3)
        x = (pts[i][0] + pts[i + 1][0]) / 2
        D.h2o(c, x, 260, 0.6, ai)
    text(c, '9 bonds = 9 waters', W / 2, 560, 54, (140, 200, 255), u(t, k, 0, 0.5, -1.4), 'xb', 'center')
    a1 = u(t, k, 1)
    if a1 > 0:
        # a balance: monomers + 9 waters' atoms on the heavier side
        tilt = 8 * u(t, k, 2, 1.0)
        c.save(); c.translate(W / 2, 800); c.rotate(tilt)
        c.drawRect(skia.Rect(-420, -6, 420, 6), P(CREAM, 255 * a1))
        text(c, 'chain', -330, -30, 40, CREAM, a1, 'xb', 'center')
        text(c, 'monomers', 330, -30, 40, AMBER, a1, 'xb', 'center')
        c.restore()
        c.drawPath(D.poly([(W / 2, 806), (W / 2 - 40, 900), (W / 2 + 40, 900)]), P(INK2, 255 * a1))
        text(c, 'MORE: water added back', W / 2, 1000, 46, AMBER, u(t, k, 2), 'xb', 'center')


# ================================================================ recap and outro
def rc(c, t):
    k = 'rc'
    K.calm_bg(c, t)
    board_title(c, 'the whole picture', t, cue(k), CREAM, 90)
    a1 = u(t, k, 1)
    c.save(); c.translate(20, 40); c.scale(0.56, 0.56)
    loop_diagram(c, t, a1, 1, 1, 1, atoms_u=1.0, energy=1.0, heat=1.0)
    c.restore()
    text(c, 'matter cycles, energy flows', 560, 580, 40, AMBER, a1, 'semi', 'center')
    a2 = u(t, k, 2)
    for i, el in enumerate('CHONPS'):
        D.tile(c, el, 1150 + i * 110, 230, 80, a2 * sm((t - cue(k, 2) - i * 0.1) / 0.3), name=False)
    text(c, 'about 98% of a cell', 1425, 340, 38, CREAM, a2, 'semi', 'center')
    a3 = u(t, k, 3)
    if a3 > 0:
        pts = skeleton(c, 1130, 430, 0.75, a3)
        px, py = pts[2]
        D.bond(c, (px, py), (px, py + 60), 1, a3, w=6)
        D.mol(c, *GROUPS['hydroxyl'][:2], px, py + 85, 0.7, a3)
        text(c, 'skeleton + functional groups', 1425, 640, 38, CREAM, a3, 'semi', 'center')
    a4 = u(t, k, 4)
    for i in range(4):
        fam_card(c, i, 150 + i * 160 + 120, 820, 0, t)
    if a4 > 0:
        for i, (fn) in enumerate((D.bread_icon, D.butter_icon, D.cheese_icon)):
            fn(c, 200 + i * 170, 800, 0.6, a4)
        D.dna_icon(c, 710, 800, 0.45, a4, t)
        text(c, 'four families', 450, 940, 38, CREAM, a4, 'semi', 'center')
    a5 = u(t, k, 5)
    if a5 > 0:
        j = 0.5 + 0.5 * math.sin(t * 1.5)
        D.string(c, (1250 + 20 * j, 820), (1400 - 20 * j, 820), a5 * j)
        D.bead(c, 1250 + 20 * j, 820, 34, AMBER, a5); D.bead(c, 1400 - 20 * j, 820, 34, GREEN, a5)
        text(c, 'dehydration synthesis builds', 1325, 930, 38, BIO, a5, 'semi', 'center')
        text(c, 'hydrolysis breaks', 1325, 985, 38, AMBER, a5, 'semi', 'center')


def end(c, t):
    k = 'end'
    t_es = min(cue(k, 4) - 0.3, Bt['__DUR'] - 20.5) if '__DUR' in Bt else cue(k, 4) - 0.3
    if t < t_es:
        c.save(); cam_push(c, t, cue(k), 0.06, 1350, 640, 12)
        WD.patio_bg(c, t, warm=0.3)
        bx, by = 1470, 800
        WD.tomato_plant(c, bx, by, 1.0, t, s=1.2, glow=u(t, k, 3) * 0.6)
        lean = sm((t - cue(k)) / 1.5)
        PP.jay.draw(c, 1040, 1030, 1.05, t, pose=dict(lean=12 * lean, look=0.9, tilt=8 * lean, arms={'R': (6, 20, 0), 'L': (20, 50, 0)}))
        c.restore()
        a = u(t, k, 1)
        for i in range(6):
            f = ((t - cue(k, 1)) * 0.3 + i / 6) % 1
            x = 1130 + 260 * f; y = 520 + 20 * math.sin(i + t)
            D.co2(c, x, y, 0.45, a * sm(f * 4) * (1 - sm((f - 0.8) / 0.2)), 15 * i)
        label(c, 'his breath: CO₂', 760, 380, CREAM, 36, a)
        pill(c, 'carbon from lunch', 600, 200, AMBER, 34, u(t, k, 2))
        K.vignette(c)
    else:
        K.calm_bg(c, t)
        # top third only: a leaf taking in CO2, then the site line; the lower two thirds stay calm for the end screen
        ia = sm((t - t_es) / 0.6)
        clip = skia.Path(); clip.addRRect(skia.RRect.MakeRectXY(skia.Rect(60, 40, 700, 340), 26, 26))
        c.save(); c.clipPath(clip, skia.ClipOp.kIntersect, True)
        c.saveLayerAlpha(None, int(255 * ia))
        c.translate(60, 40); c.scale(0.42, 0.42); c.translate(-560, -300)
        WD.patio_bg(c, t, warm=0.3)
        WD.tomato_plant(c, 1470, 800, 1.0, t, s=1.2, glow=0.5)
        PP.jay.draw(c, 1040, 1030, 1.05, t, pose=dict(lean=12, look=0.9, tilt=8, arms={'R': (6, 20, 0), 'L': (20, 50, 0)}))
        for i in range(6):
            f = (t * 0.3 + i / 6) % 1
            D.co2(c, 1130 + 260 * f, 520 + 20 * math.sin(i + t), 0.45, sm(f * 4) * (1 - sm((f - 0.8) / 0.2)), 15 * i)
        c.restore(); c.restore()
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(60, 40, 700, 340), 26, 26), SP(GREEN, 4, 255 * ia))
        text(c, 'back into a leaf', 380, 395, 36, GREEN, u(t, k, 3), 'semi', 'center')
        a = u(t, k, 4)
        text(c, 'Free notes and practice', 1250, 140, 38, INK2, a, 'semi', 'center')
        text(c, 'levlprep.com', 1250, 240, 88, K.COURSE, a, 'xb', 'center')
        text(c, 'Next: carbohydrates', 1250, 320, 40, CREAM, u(t, k, 5), 'semi', 'center')


SCENES = dict(hook=hook, promise=promise, why=why, e1=e1, e2=e2, e3=e3, e4=e4, e5=e5, p1q=p1q, p1a=p1a,
              c1=c1, c3=c3, c4=c4, p2q=p2q, p2a=p2a, k1=k1, k2=k2, k3=k3, p3q=p3q, p3a=p3a,
              f1=f1, f2=f2, f3=f3, f4=f4, p4q=p4q, p4a=p4a, m0=m0, m1=m1, m2=m2, p5q=p5q, p5a=p5a,
              y1=y1, y2=y2, b1=b1, b2=b2, b3=b3, b4=b4, b5=b5, p7q=p7q, p7a=p7a, rc=rc, end=end)
