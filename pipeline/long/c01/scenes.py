"""Every beat of AP Chem 01 drawn in code. Each function draws the whole frame for global time t.
Bt is the timeline's beat table; cue(k, n) is the global time of cue n of beat k; wt(k, word) the time a word starts."""
import math
import numpy as np
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, hand, chip, pill, arrow, glow, label, CREAM, AMBER, CORAL, TEAL, YELLOW, BLUE, GREEN, NAVY, INK2, LILAC
import mk as M
from mk import mdraw, mw, qty, frac, row, strike, UNIT
import world as WD
import cast as CA
from airman2 import L_UARM, L_FARM

Bt = {}
CHEM = K.COURSE


class _D:
    T = 0.0


D = _D()


def cue(k, n=0):
    b = Bt[k]
    if n == 0:
        return b['t0']
    return b['cues'].get(n, b['cues'].get(str(n), b['t0']))


def wt(k, w, nth=0, after=None):
    """global start time of the nth word in beat k that starts with w (case blind); after: only words after that time"""
    n = 0
    for word, a, b in Bt[k]['words']:
        if after is not None and a < after:
            continue
        if word.lower().strip('.,?!:;"\'').startswith(w.lower()):
            if n == nth:
                return a
            n += 1
    return Bt[k]['t0']


def fin(k):
    return Bt[k]['t1']


def ua(t, t0, d=0.5):
    return sm((t - t0) / d)


def talking(t, k, t0=None, t1=None):
    """mouth opening from the narration's word times (a speaker's line)"""
    for w, a, b in Bt[k]['words']:
        if (t0 is None or a >= t0) and (t1 is None or a <= t1) and a <= t <= b:
            return 0.35 + 0.35 * abs(math.sin((t - a) * 18))
    return 0.0


def practice_tag(c, t, t0, s='YOUR TURN'):
    pill(c, s, 190, 90, AMBER, 30, sm((t - t0) / 0.3), kind='xb')


def answer_tag(c, t, t0):
    pill(c, 'ANSWER', 170, 90, GREEN, 30, sm((t - t0) / 0.3), kind='xb')


def title(c, s, t, t0, y=150, col=CREAM, size=54):
    text(c, s, W / 2, y, size, col, sm((t - t0) / 0.4), 'xb', 'center')


def check(c, x, y, s=1.0, a=1.0, col=GREEN):
    p = skia.Path(); p.moveTo(x - 30 * s, y); p.lineTo(x - 8 * s, y + 22 * s); p.lineTo(x + 34 * s, y - 26 * s)
    c.drawPath(p, SP(col, 11 * s, 255 * a))


def cross(c, x, y, s=1.0, a=1.0, col=CORAL):
    if a > 0.01:
        c.drawLine(x - 26 * s, y - 26 * s, x + 26 * s, y + 26 * s, SP(col, 11 * s, 255 * a))
        c.drawLine(x + 26 * s, y - 26 * s, x - 26 * s, y + 26 * s, SP(col, 11 * s, 255 * a))


def lightbar(c, t, y, t_on, t_off, x0=200, x1=1720, h=118):
    """a soft amber band behind the line being talked about (moves the eye with the narration)"""
    a = ua(t, t_on - 0.1, 0.35) * (1 - ua(t, t_off - 0.2, 0.4))
    if a > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y - h * 0.7, x1, y + h * 0.3), 22, 22), P(AMBER, 30 * a))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y - h * 0.7, x0 + 10, y + h * 0.3), 5, 5), P(AMBER, 200 * a))


def board(c, t):
    """the calm teaching background with the same grade and grain as the story (premium standard)"""
    K.calm_bg(c, t)
    WD.finish(c, t, vig=0.12)


def push(c, t, t0, amt=0.03, dur=20.0, cx=W / 2, cy=H / 2):
    z = 1 + amt * sm((t - t0) / dur)
    c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy)


# ================================================================ people helpers
def ik_pose(person, ps, target, side='n', bend=1):
    """set the arm angles of a pose so the wrist reaches a canvas point (2 bone IK in pose space)"""
    J = person.joints(ps)
    sh = J['uarm_' + side][0]
    k = ps.s * person.k
    tx = (target[0] - ps.x) / (k * ps.face); ty = (target[1] - ps.ground) / k
    dx, dy = tx - sh[0], ty - sh[1]
    d = max(1e-3, min(math.hypot(dx, dy), L_UARM + L_FARM - 1))
    a1, a2 = L_UARM, L_FARM
    cosE = (a1 * a1 + a2 * a2 - d * d) / (2 * a1 * a2)
    E = math.pi - math.acos(max(-1, min(1, cosE)))          # elbow bend
    th = math.degrees(math.atan2(dx, dy))                     # direction from straight down, + forward
    alpha = math.degrees(math.acos(max(-1, min(1, (a1 * a1 + d * d - a2 * a2) / (2 * a1 * d)))))
    if side == 'n':
        ps.uarm_n = th - alpha * bend; ps.elbow_n = math.degrees(E) * bend
    else:
        ps.uarm_f = th - alpha * bend; ps.elbow_f = math.degrees(E) * bend
    return ps


def draw_turn(c, person, ps, u):
    """draw a person turning around: u 0 -> 1 flips the facing direction through a quick squash at the middle"""
    if u <= 0.0 or u >= 1.0:
        if u >= 1.0:
            ps.face = -ps.face
        person.draw(c, ps)
        if u >= 1.0:
            ps.face = -ps.face
        return
    sx = abs(math.cos(math.pi * u))
    f0 = ps.face
    ps.face = f0 if u < 0.5 else -f0
    c.save(); c.translate(ps.x, 0); c.scale(max(0.18, sx), 1); c.translate(-ps.x, 0)
    person.draw(c, ps)
    c.restore()
    ps.face = f0


def breath(t, k=0.0):
    return 0.6 * math.sin(t * 1.4 + k)


def maya_seated(t, write=0.0, face=-1, neck=6, mouth=0.0, look=0.0, x=1700):
    M_ = CA.maya()
    ps = CA.Pose(x=x, ground=1006, face=face, thigh_n=88, knee_n=-88, thigh_f=84, knee_f=-84, lean=4 + breath(t), neck=neck,
                 uarm_n=30, elbow_n=70, hand_n='grip', uarm_f=24, elbow_f=74, hand_f='flat', mouth=mouth, look=look,
                 blink=(t % 4.1) < 0.12)
    if write > 0:
        ps.uarm_n += 3 * math.sin(t * 7) * write; ps.elbow_n += 4 * math.sin(t * 9 + 1) * write
    return M_, ps


def pencil(c, person, ps):
    J = person.joints(ps)
    o, d = J['hand_n']
    tip = person.canvas_pt(ps, person.frame(o, d)(30, 120))
    base = person.canvas_pt(ps, person.frame(o, d)(10, 20))
    c.drawLine(*base, *tip, SP((214, 172, 60), 5))
    c.drawCircle(*tip, 2.5, P((60, 50, 40)))


def theo_stool(t, face=1, neck=8, mouth=0.0, look=0.0, x=760, arm=0.0):
    T_ = CA.theo()
    ps = CA.Pose(x=x, ground=912, face=face, lean=2 + breath(t, 1), neck=neck, uarm_n=8 + 30 * arm, elbow_n=26 + 40 * arm,
                 uarm_f=-6, elbow_f=20, mouth=mouth, look=look, blink=(t % 3.7) < 0.12, hand_n='relaxed', hand_f='relaxed')
    return T_, ps


# ================================================================ intro
def hook(c, t):
    k = 'hook'
    t0, c2, c3, c4 = cue(k), cue(k, 2), cue(k, 3), cue(k, 4)
    q = wt(k, 'how', 0, after=c4)
    # one continuous move: close on the drop, pull out to the room as Maya and Theo are named, then a slow push
    u = sm((t - (c2 + 0.2)) / 3.6)
    z = 2.5 + (1.0 - 2.5) * u
    fx = 888 + (1230 - 888) * u; fy = 600 + (560 - 600) * u
    z *= 1 + 0.16 * sm((t - c3) / 9)
    fx += 60 * sm((t - c3) / 10)
    turn = ua(t, q - 0.4, 0.35)

    def cast_(c):
        WD.stool(c, 760)
        dp, _ = WD.drop_phase(t)
        nk = 8 + 6 * (sm((dp - 0.72) / 0.28) if dp > 0.72 else 0)
        T_, tp = theo_stool(t, neck=nk * (1 - turn) + 14 * turn, look=0.8 * turn)
        tp.mouth = talking(t, k, q) * 0.8
        T_.draw(c, tp)
        M_, mp = maya_seated(t, write=1.0 - ua(t, q - 0.2, 0.3), neck=6 + 8 * ua(t, q, 0.5), look=ua(t, q, 0.4))
        M_.draw(c, mp)
        pencil(c, M_, mp)
    c.save(); WD.camera(c, z, fx, fy)
    WD.kitchen(c, t, cast=cast_)
    c.restore()
    # the question, hanging over the drop
    pill(c, 'how many water molecules in ONE drop?', W / 2, 980, AMBER, 46, ua(t, q + 0.6, 0.5))
    a = ua(t, q + 1.2, 0.5)
    if a > 0:
        c.save(); WD.camera(c, z, fx, fy)
        text(c, '?', 900, 470, 90, YELLOW, a, 'xb', 'center')
        c.restore()
    WD.finish(c, t)


def molecule(c, x, y, s, ang=0.0, a=1.0, hl=0.0):
    """one water molecule: red oxygen with two white hydrogens at 104.5 degrees (a drawing convention for colour)"""
    c.save(); c.translate(x, y); c.rotate(ang)
    for sgn in (-1, 1):
        aa = math.radians(90 + sgn * 52.25)
        hx, hy = math.cos(aa) * 26 * s, math.sin(aa) * 26 * s
        c.drawCircle(hx, hy, 12 * s, P((222, 226, 236), 255 * a))
        c.drawCircle(hx - 3 * s, hy - 3 * s, 4 * s, P((255, 255, 255), 200 * a))
    c.drawCircle(0, 0, 19 * s, P((224, 72, 64), 255 * a))
    c.drawCircle(-5 * s, -6 * s, 6 * s, P((255, 150, 140), 200 * a))
    if hl > 0.01:
        c.drawCircle(0, 6 * s, 42 * s, SP(AMBER, 4, 255 * hl * a))
    c.restore()


def drop_shape(cx, cy, r):
    p = skia.Path()
    p.moveTo(cx, cy - r * 1.55)
    p.cubicTo(cx + r * 0.45, cy - r * 0.75, cx + r, cy - r * 0.25, cx + r, cy + r * 0.2)
    p.cubicTo(cx + r, cy + r * 0.78, cx + r * 0.55, cy + r, cx, cy + r)
    p.cubicTo(cx - r * 0.55, cy + r, cx - r, cy + r * 0.78, cx - r, cy + r * 0.2)
    p.cubicTo(cx - r, cy - r * 0.25, cx - r * 0.45, cy - r * 0.75, cx, cy - r * 1.55)
    return p


def big_drop(c, t, cx, cy, r, a=1.0, mol=1.0, n=46, glow_=0.0):
    """a giant drop with its molecules jiggling inside"""
    if a <= 0.01:
        return
    p = drop_shape(cx, cy, r)
    g = skia.GradientShader.MakeRadial(skia.Point(cx - r * 0.3, cy - r * 0.2), r * 1.6, [C((120, 176, 236), int(235 * a)), C((44, 92, 170), int(235 * a))], [0, 1])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=g))
    if glow_ > 0.01:
        c.drawPath(p, P((160, 210, 255), 90 * glow_, MaskFilter=K.blur(40), BlendMode=skia.BlendMode.kScreen))
    c.save(); c.clipPath(p, skia.ClipOp.kIntersect, True)
    rs = np.random.default_rng(4)
    inner = drop_shape(cx, cy + r * 0.05, r * 0.8)
    for i in range(int(n * 1.6)):
        x = cx + rs.uniform(-r, r); y = cy + rs.uniform(-r * 1.3, r)
        sp1, sp2 = rs.uniform(2, 4), rs.uniform(2, 4)
        if not inner.contains(x, y):
            continue
        x += 6 * math.sin(t * sp1 + i); y += 6 * math.cos(t * sp2 + i * 1.3)
        molecule(c, x, y, r / 330 * 0.9, ang=t * rs.uniform(-40, 40) + i * 40, a=a * mol)
    c.restore()
    c.drawPath(p, SP((200, 230, 255), 5, 160 * a))
    hl = skia.Path(); hl.addOval(skia.Rect(cx - r * 0.62, cy - r * 0.6, cx - r * 0.3, cy - r * 0.1))
    c.drawPath(hl, P((255, 255, 255), 70 * a))


def promise(c, t):
    k = 'promise'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    c.save(); push(c, t, t0, 0.03, 20)
    sh = 1 - 0.18 * ua(t, c2 - 0.3, 0.8)
    big_drop(c, t, 760, 520 - 40 * (1 - sh), 300 * sh, ua(t, t0 - 0.3, 0.6))
    # the close-up molecule: one oxygen (red) and two hydrogens
    a = ua(t, wt(k, 'oxygen'), 0.4) * (1 - ua(t, c2, 0.5))
    if a > 0:
        molecule(c, 1420, 470, 3.2, ang=0, a=a)
        label(c, 'oxygen (O)', 1480, 380, CREAM, 42, a * ua(t, wt(k, 'oxygen'), 0.4), dot=(1420, 450))
        label(c, 'hydrogen (H)', 1150, 690, CREAM, 42, a * ua(t, wt(k, 'hydrogens'), 0.4), dot=(1365, 545))
        label(c, 'hydrogen (H)', 1500, 690, CREAM, 42, a * ua(t, wt(k, 'hydrogens'), 0.4), dot=(1478, 545))
    a = ua(t, c1, 0.4) * (1 - ua(t, c2, 0.4))
    text(c, 'how many in one drop?', 1430, 860, 46, YELLOW, a, 'semi', 'center')
    c.restore()
    for i, (s, cc, col) in enumerate((('units', c2, CHEM), ('powers of ten', c3, TEAL), ('scientific notation', c4, AMBER))):
        u = ua(t, cc - 0.1, 0.35)
        if u > 0:
            w = K.width(s, 52, 'xb') + 44
            x = 1400 - w / 2
            chip(c, s, x, 290 + i * 150, col, 52, u, 0.85 + 0.15 * u)


def why(c, t):
    k = 'why'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    title(c, 'where points go', t, t0, 170, INK2, 52)
    mdraw(c, 'the "boring" part?', W / 2, 560, 110, CREAM, ua(t, t0 + 0.3, 1.0), a=1 - ua(t, wt(k, 'leaving') - 0.6, 0.5), align='center')
    items = [(wt(k, 'leaving'), '12.6', None), (wt(k, 'mixing'), '350 J', '350 kJ'), (wt(k, 'forgetting'), '25 °C', '298 K')]
    for i, (tt, a_, b_) in enumerate(items):
        y = 340 + i * 170
        u = ua(t, tt - 0.1, 0.5)
        mdraw(c, a_, 560, y, 84, CREAM, u)
        if i == 0:
            mdraw(c, '?', 760, y, 84, CORAL, ua(t, tt + 0.6, 0.3))
            text(c, 'no unit', 900, y - 20, 48, INK2, ua(t, tt + 0.6, 0.4), 'semi')
        elif i == 1:
            mdraw(c, '≠', 830, y, 84, CORAL, ua(t, tt + 0.8, 0.3))
            mdraw(c, b_, 930, y, 84, CREAM, ua(t, tt + 1.0, 0.5))
        else:
            text(c, 'left in °C, never changed to K', 860, y - 20, 48, INK2, ua(t, tt + 0.6, 0.4), 'semi')
        cross(c, 470, y - 28, 0.9, ua(t, tt + 0.5, 0.3))
    a = ua(t, c2, 0.5)
    if a > 0:
        M.boxed(c, 400, 820, 1520, 950, a)
        text(c, 'right chemistry', 460, 902, 50, CREAM, a, 'semi'); check(c, 880, 880, 0.8, a)
        text(c, 'wrong answer', 1000, 902, 50, CREAM, ua(t, c2 + 1.0, 0.4), 'semi'); cross(c, 1440, 884, 0.6, ua(t, c2 + 1.0, 0.4))


# ================================================================ units
def u1(c, t):
    k = 'u1'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    title(c, 'a number needs its unit', t, t0, 150, INK2, 52)
    big = 1 - ua(t, c3, 0.6)
    gq = ua(t, wt(k, 'grams', 1) - 0.1, 0.5)
    mdraw(c, '12.6', W / 2 - 60, 520, 150, CREAM, ua(t, t0 + 0.6, 0.6), a=1 - gq, align='center')
    a = ua(t, t0 + 1.4, 0.3) * big
    mdraw(c, '?', W / 2 + 160, 520, 150, CORAL, a)
    for i, (s, w) in enumerate((('g', 'grams'), ('mL', 'milliliters'), ('°C', 'degrees'))):
        tt = wt(k, w)
        u = ua(t, tt - 0.1, 0.3) * big
        chip(c, s, 640 + i * 230, 650, UNIT, 64, u, 0.9 + 0.1 * u)
    u = ua(t, wt(k, 'grams', 1) - 0.1, 0.5)
    if u > 0:
        qty(c, '12.6', 'g', W / 2 - 230, 520, 150, 1.0, a=u)
        check(c, W / 2 + 280, 470, 1.2, u)
        text(c, 'now it means something', W / 2, 720, 50, CREAM, u, 'semi', 'center')
    a = ua(t, wt(k, 'keep'), 0.4)
    text(c, 'keep the unit on every line', W / 2, 860, 44, YELLOW, a, 'semi', 'center')


def u2(c, t):
    k = 'u2'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    title(c, 'metric prefixes', t, t0, 140, INK2, 52)
    rows = [('kilo', 'k', '1000 ×', '1 kg = 1000 g', c1), ('milli', 'm', '1/1000', '1000 mL = 1 L', c2),
            ('micro', 'µ', '1/1,000,000', '', c3), ('nano', 'n', '1/1,000,000,000', '', wt(k, 'nano'))]
    for i, (nm, sym, val, ex, tt) in enumerate(rows):
        y = 300 + i * 130
        u = 0.28 * ua(t, t0 + 0.3 + i * 0.25, 0.4) + 0.72 * ua(t, tt - 0.1, 0.4)
        lit = ua(t, tt - 0.1, 0.3) * (1 - ua(t, tt + 4.0, 0.6))
        if lit > 0.01:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(270, y - 80, 1700, y + 34), 20, 20), P(AMBER, 34 * lit))
        chip(c, sym, 300, y - 62, CHEM if i == 0 else TEAL, 56, u)
        text(c, nm, 420, y, 56, CREAM, u, 'xb')
        mdraw(c, val, 700, y, 64, CREAM, max(ua(t, t0 + 0.6 + i * 0.25, 0.6), ua(t, tt + 0.3, 0.6)), a=u)
        if ex:
            mdraw(c, ex, 1180, y, 60, YELLOW, ua(t, wt(k, 'kilogram' if i == 0 else 'liter') - 0.2, 0.7))
    a = ua(t, c4, 0.5)
    if a > 0:
        M.boxed(c, 300, 840, 1620, 990, a)
        mdraw(c, 'mL', 360, 935, 70, UNIT, a)
        text(c, '= milli + liter', 520, 925, 44, CREAM, a, 'semi')
        mdraw(c, 'm', 980, 935, 70, UNIT, ua(t, wt(k, 'own') - 0.3, 0.4))
        text(c, '= meters', 1060, 925, 44, CREAM, ua(t, wt(k, 'own') - 0.3, 0.4), 'semi')
        pill(c, 'on the AP equation sheet', 1450, 905, AMBER, 26, ua(t, wt(k, 'sheet'), 0.4))


def dollar(c, x, y, s, a):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 120 * s, y - 56 * s, x + 120 * s, y + 56 * s), 10, 10), P((122, 176, 110), 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 104 * s, y - 42 * s, x + 104 * s, y + 42 * s), 8, 8), SP((86, 136, 80), 4, 255 * a))
    c.drawCircle(x, y, 30 * s, P((176, 212, 160), 255 * a))
    text(c, '1', x, y + 16 * s, 46 * s, (60, 100, 60), a, 'xb', 'center')


def coins(c, x, y, n, a, t):
    for i in range(n):
        yy = y - i * 9
        c.drawOval(skia.Rect(x - 46, yy - 14, x + 46, yy + 14), P((196, 120, 70), 255 * a))
        c.drawOval(skia.Rect(x - 46, yy - 18, x + 46, yy + 10), P((226, 152, 96), 255 * a))


def u3(c, t):
    k = 'u3'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    a1 = 1 - ua(t, c2, 0.5)
    if a1 > 0:
        dollar(c, 560, 420, 1.3, ua(t, wt(k, 'dollar') - 0.2, 0.4) * a1)
        mdraw(c, '=', 830, 440, 90, CREAM, ua(t, wt(k, 'hundred') - 0.2, 0.3) * a1)
        coins(c, 1010, 470, int(1 + 11 * ua(t, wt(k, 'hundred'), 0.8)), ua(t, wt(k, 'hundred') - 0.2, 0.3) * a1, t)
        text(c, '100 cents', 1010, 560, 44, CREAM, ua(t, wt(k, 'cents'), 0.4) * a1, 'semi', 'center')
        u = ua(t, wt(k, 'divided'), 0.6) * a1
        frac(c, ('100', 'cents'), ('1', 'dollar'), 690, 760, 70, u, a=a1)
        mdraw(c, '= 1', 1120, 790, 90, YELLOW, ua(t, wt(k, 'one', after=wt(k, 'divided')) - 0.1, 0.4) * a1)
    a2 = ua(t, c2, 0.5)
    if a2 > 0:
        title(c, 'a conversion factor', t, c2, 200, INK2, 52)
        frac(c, ('1000', 'm'), ('1', 'km'), 700, 520, 96, ua(t, c2 + 0.4, 0.8), a=a2)
        mdraw(c, '= 1', 1140, 560, 110, YELLOW, ua(t, wt(k, 'one', after=c2 + 0.5) - 0.1, 0.4) * a2)
        a3 = ua(t, c3, 0.5)
        text(c, 'same amount, new number and unit', W / 2, 860, 46, CREAM, a3, 'semi', 'center')


def u4(c, t):
    k = 'u4'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    title(c, 'dimensional analysis', t, t0, 150, YELLOW, 52)
    a = ua(t, c1, 0.4) * (1 - ua(t, c3 - 0.5, 0.5))
    if a > 0:
        mdraw(c, 'units cancel like numbers', W / 2, 330, 58, CREAM, a, align='center')
        frac(c, ('3', 'km'), ('1', 'km'), 860, 520, 80, ua(t, c1 + 0.6, 0.6), sn=ua(t, c1 + 2.4, 0.4), sd=ua(t, c1 + 2.6, 0.4), a=a)
    a = ua(t, c2, 0.4) * (1 - ua(t, c3 - 0.5, 0.5))
    if a > 0:
        text(c, 'have  →  bottom', 640, 760, 54, CORAL, ua(t, wt(k, 'have'), 0.4) * a, 'xb')
        text(c, 'want  →  top', 1120, 760, 54, TEAL, ua(t, wt(k, 'want'), 0.4) * a, 'xb')
    if t > c3 - 0.3:
        km = wt(k, 'kilometers', after=c3 + 2)
        items = [dict(q=('2.45', 'km'), t0=c3, s=km), dict(m='×', t0=wt(k, 'times', after=c3)),
                 dict(f=(('1000', 'm'), ('1', 'km')), t0=wt(k, 'times', after=c3) + 0.2, sd=km + 0.2), dict(m='=', t0=c4 - 0.2),
                 dict(q=('2450', 'm'), t0=c4, col=YELLOW)]
        row(c, items, W / 2, 560, 92, t, 'center')
        a = ua(t, c4 + 1.0, 0.5)
        text(c, 'the unit you have on the bottom, so it cancels', W / 2, 860, 42, INK2, a, 'semi', 'center')


def u5(c, t):
    k = 'u5'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    title(c, 'check the size', t, t0, 150, INK2, 52)
    # one long bar (a kilometer) and many little meter ticks filling it
    x0, x1, y = 360, 1560, 420
    a = ua(t, t0 + 0.3, 0.5)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y - 26, x1, y + 26), 14, 14), P(CHEM, 220 * a))
    text(c, '1 km', x1 + 40, y + 14, 46, CREAM, a, 'xb')
    n = int(100 * ua(t, c1, 3.0))
    for i in range(n):
        xx = x0 + (x1 - x0) * i / 100
        c.drawLine(xx, y + 44, xx, y + 70, SP(TEAL, 3, 230))
    text(c, '1000 m: many more of a smaller unit', W / 2, y + 140, 46, TEAL, ua(t, c1 + 1.0, 0.4), 'semi', 'center')
    check(c, 1500, y + 120, 0.9, ua(t, c1 + 2.5, 0.3))
    a2 = ua(t, c2, 0.4)
    if a2 > 0:
        M.boxed(c, 160, 700, 1760, 1010, a2)
        qty(c, '2.45', 'km', 260, 850, 70, a2)
        mdraw(c, '×', 520, 850, 70, CREAM, a2)
        frac(c, ('1', 'km'), ('1000', 'm'), 600, 830, 62, a2, hl=a2)
        mdraw(c, '= 0.00245 km^2/m', 880, 850, 62, CORAL, ua(t, c2 + 1.2, 0.5))
        text(c, 'got smaller, and the units make no sense', 960, 960, 44, CORAL, ua(t, c2 + 2.0, 0.4), 'semi', 'center')


def u6(c, t):
    k = 'u6'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    title(c, 'chain the factors', t, t0, 150, INK2, 52)
    mg = wt(k, 'milligrams', 1)
    g1 = wt(k, 'grams', after=c2 + 0.5)
    items = [dict(q=('4250', 'mg'), t0=c1, s=mg + 0.2), dict(m='×', t0=c2),
             dict(f=(('1', 'g'), ('1000', 'mg')), t0=c2 + 0.2, sd=mg + 0.4, sn=c4), dict(m='×', t0=c3),
             dict(f=(('1', 'kg'), ('1000', 'g')), t0=c3 + 0.2, sd=c4 + 0.3), dict(m='=', t0=wt(k, 'get') - 0.2),
             dict(q=('0.00425', 'kg'), t0=wt(k, 'get'), col=YELLOW)]
    row(c, items, W / 2, 520, 74, t, 'center')
    a = ua(t, c2 + 1.2, 0.4) * (1 - ua(t, c4, 0.4))
    text(c, '= 4.25 g so far', 740, 730, 46, TEAL, a, 'semi', 'center')
    a = ua(t, c4 + 0.8, 0.5)
    text(c, 'mg cancels, then g cancels', W / 2, 760, 46, CREAM, a, 'semi', 'center')


def beaker(c, x, y, s, a, fill=0.7, t=0.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    body = skia.Path(); body.moveTo(-70, -150); body.lineTo(-70, 0); body.quadTo(-70, 20, -50, 20); body.lineTo(50, 20); body.quadTo(70, 20, 70, 0); body.lineTo(70, -150)
    lvl = -150 * fill
    wv = skia.Path(); wv.moveTo(-70, lvl)
    for i in range(15):
        wv.lineTo(-70 + i * 10, lvl + 3 * math.sin(t * 2 + i * 0.7))
    wv.lineTo(70, lvl); wv.lineTo(70, 0); wv.quadTo(70, 20, 50, 20); wv.lineTo(-50, 20); wv.quadTo(-70, 20, -70, 0); wv.close()
    c.drawPath(wv, P((120, 176, 236), 210 * a))
    c.drawPath(body, SP((220, 232, 245), 5, 230 * a))
    c.restore()


def thermometer(c, x, y, a, lvl):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 18, y - 300, x + 18, y + 10), 18, 18), P((230, 236, 245), 230 * a))
    c.drawCircle(x, y + 30, 34, P(CORAL, 255 * a))
    c.drawRect(skia.Rect(x - 8, y - 300 * lvl, x + 8, y + 20), P(CORAL, 255 * a))


def u7(c, t):
    k = 'u7'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    a = 1 - ua(t, c3 - 0.3, 0.5)
    if a > 0:
        text(c, 'per = a conversion factor', W / 2, 180, 52, YELLOW, ua(t, wt(k, 'per') - 0.1, 0.4) * a, 'xb', 'center')
        mdraw(c, 'density = mass / volume', W / 2, 380, 78, CREAM, ua(t, c1 - 0.1, 0.8) * a, align='center')
        beaker(c, 620, 760, 1.4, ua(t, c1 + 1.5, 0.4) * a, 0.7, t)
        qty(c, '≈ 1', 'g/mL', 900, 660, 84, ua(t, wt(k, 'gram') - 0.2, 0.6), a=a)
        text(c, 'water', 620, 870, 40, INK2, ua(t, c1 + 1.5, 0.4) * a, 'semi', 'center')
        text(c, 'volume of water  →  mass', 1050, 800, 44, TEAL, ua(t, c2, 0.5) * a, 'semi')
    a2 = ua(t, c3, 0.5)
    if a2 > 0:
        title(c, 'temperature: add, don\'t multiply', t, c3, 170, YELLOW, 48)
        lv = 0.25 + 0.45 * ua(t, wt(k, 'twenty', after=c3), 1.2)
        thermometer(c, 520, 760, a2, lv)
        kt = wt(k, 'kelvin', after=c3)
        text(c, 'K, no degree sign', 820, 400, 46, UNIT, ua(t, kt, 0.4), 'semi')
        text(c, '0 K = the coldest possible', 820, 470, 40, INK2, ua(t, wt(k, 'coldest'), 0.4), 'semi')
        mdraw(c, 'K = °C + 273.15', 820, 620, 84, CREAM, ua(t, wt(k, 'celsius', after=c3 + 3) - 0.1, 0.8))
        mdraw(c, '25 °C ≈ 298 K', 820, 780, 84, YELLOW, ua(t, wt(k, 'twenty', after=c3) - 0.1, 0.8))


def kitchen_shot(c, t, z, fx, fy, cast_fn, drip_on=True, handle=0.0, cup=True, front=None):
    c.save(); WD.camera(c, z, fx, fy)
    WD.kitchen(c, t, cast=cast_fn, drip_on=drip_on, handle=handle, cup_on_table=cup, front=front)
    c.restore()


def maya_at_sink(t, cup_pt=None, x=1060, neck=-6, mouth=0.0):
    M_ = CA.maya()
    ps = CA.Pose(x=x, ground=1010, face=-1, lean=8 + breath(t), neck=neck, uarm_f=10, elbow_f=40, hand_n='grip', hand_f='relaxed',
                 blink=(t % 4.3) < 0.12, mouth=mouth)
    if cup_pt is not None:
        ik_pose(M_, ps, cup_pt)
    return M_, ps


def u8(c, t):
    k = 'u8'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    cnt = 100 * ua(t, c2 + 0.5, c3 - c2 - 0.3) if t < c3 + 0.2 else 100
    cup_xy = (888, 690)
    z = 1.55 + 0.1 * sm((t - t0) / 16); fx, fy = 960, 640

    def cast_(c):
        WD.stool(c, 760)
        T_, tp = theo_stool(t, neck=10, look=0.5)
        T_.draw(c, tp)

    def front(c):
        M_, mp = maya_at_sink(t, (cup_xy[0] + 30, cup_xy[1] - 24))
        M_.draw(c, mp)
        WD.medicine_cup(c, cup_xy[0], cup_xy[1], cnt / 100, s=1.5, marks=True)
    c.save(); WD.camera(c, z, fx, fy)
    WD.kitchen(c, t, cast=cast_, front=front, cup_on_table=False)
    c.restore()
    WD.finish(c, t)
    a = ua(t, c2, 0.4) * (1 - ua(t, fin(k) + 0.3, 0.3))
    if a > 0:
        M.boxed(c, 60, 60, 600, 200, a)
        text(c, 'drops', 100, 120, 40, INK2, a, 'semi')
        text(c, f'{int(cnt)}', 100, 180, 64, CREAM, a, 'xb')
        text(c, '30 mL', 360, 180, 64, UNIT, ua(t, wt(k, 'thirty'), 0.3) * a, 'xb')
    a = ua(t, c3, 0.4)
    if a > 0:
        M.boxed(c, 1010, 60, 1880, 330, a)
        frac(c, ('30', 'mL'), ('100', 'drops'), 1050, 170, 60, ua(t, wt(k, 'over') - 0.3, 0.6), a=a)
        mdraw(c, '= 0.3 mL per drop', 1330, 200, 56, YELLOW, ua(t, wt(k, 'point') - 0.1, 0.6))
    a = ua(t, c4, 0.4)
    if a > 0:
        M.boxed(c, 60, 860, 560, 1020, a)
        sec = (t - c4) % 1.0
        text(c, f'00:0{int((t - c4) % 10)}', 100, 960, 64, CREAM, a, 'xb')
        c.drawCircle(470, 940, 26, SP(TEAL, 6, 255 * a))
        c.drawLine(470, 940, 470 + 22 * math.sin(sec * 2 * math.pi), 940 - 22 * math.cos(sec * 2 * math.pi), SP(TEAL, 5, 255 * a))
        text(c, '1 drop per second', 310, 1000 - 0, 0, CREAM, 0)


def u9(c, t):
    k = 'u9'
    t0, c1, c2, c3, c4, c5 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4), cue(k, 5)

    def cast_(c):
        WD.stool(c, 760)
        T_, tp = theo_stool(t, neck=4, look=0.3)
        T_.draw(c, tp)
        M_, mp = maya_seated(t, write=1.0, neck=10)
        M_.draw(c, mp); pencil(c, M_, mp)
    kitchen_shot(c, t, 1.08, 1230, 620, cast_)
    WD.finish(c, t)
    M.boxed(c, 50, 120, 1870, 470, ua(t, t0, 0.4))
    s1 = c3 + 0.6
    items = [dict(q=('1 drop', ''), t0=c1 - 0.6), dict(m='/ s', t0=c1 - 0.3, col=UNIT), dict(m='×', t0=c1),
             dict(f=(('0.3', 'mL'), ('1', 'drop')), t0=c1 + 0.2, sd=s1), dict(m='×', t0=c2),
             dict(f=(('60', 's'), ('1', 'min')), t0=c2 + 0.1, sd=s1 + 0.3), dict(m='×', t0=wt(k, 'sixty', 1) - 0.2),
             dict(f=(('60', 'min'), ('1', 'h')), t0=wt(k, 'sixty', 1), sn=s1 + 0.6, sd=s1 + 0.9), dict(m='×', t0=wt(k, 'twenty') - 0.2),
             dict(f=(('24', 'h'), ('1', 'day')), t0=wt(k, 'twenty'), sn=s1 + 1.2)]
    a = ua(t, t0, 0.4)
    row(c, items, W / 2, 300, 56, t, 'center', a)
    # the s under "1 drop / s" and the drop unit get struck too
    it = items[1]
    strike(c, it['_x'] + 20, it['_x'] + it['_w'], 300 - 18, ua(t, s1 + 0.3, 0.35))
    strike(c, items[0]['_x'] + 30, items[0]['_x'] + items[0]['_w'], 300 - 18, ua(t, s1, 0.35))
    res = ua(t, c4 - 0.2, 0.5)
    if res > 0:
        mdraw(c, '≈ 26,000 mL per day', W / 2, 420, 64, YELLOW, res, align='center')
    # a bucket filling: twenty six liters
    a = ua(t, c5 - 0.2, 0.5)
    if a > 0:
        bx, by = 300, 900
        fill = ua(t, c5, 2.5)
        p = skia.Path(); p.moveTo(bx - 110, by - 200); p.lineTo(bx + 110, by - 200); p.lineTo(bx + 84, by); p.lineTo(bx - 84, by); p.close()
        c.drawPath(p, P((196, 92, 70), 255 * a))
        c.save(); c.clipPath(p, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(bx - 120, by - 200 * fill, bx + 120, by), P((120, 176, 236), 230 * a))
        c.restore()
        c.drawPath(p, SP((150, 64, 50), 6, 255 * a))
        c.drawArc(skia.Rect(bx - 110, by - 290, bx + 110, by - 110), 180, 180, False, SP((90, 90, 100), 5, 255 * a))
        pill(c, '26 liters a day', bx, by - 250, AMBER, 34, a)


def car(c, x, y, s, a):
    c.save(); c.translate(x, y); c.scale(s, s)
    body = skia.Path(); body.moveTo(-160, 0); body.lineTo(-160, -50); body.lineTo(-90, -60); body.lineTo(-40, -110); body.lineTo(60, -110)
    body.lineTo(110, -60); body.lineTo(170, -50); body.lineTo(170, 0); body.close()
    c.drawPath(body, P((214, 92, 80), 255 * a))
    c.drawPath(skia.Path().addRect(skia.Rect(-30, -100, 50, -64)), P((180, 214, 240), 255 * a))
    for wx in (-90, 100):
        c.drawCircle(wx, 4, 34, P((40, 40, 48), 255 * a)); c.drawCircle(wx, 4, 14, P((190, 190, 200), 255 * a))
    c.restore()


def p1q(c, t):
    k = 'p1q'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); practice_tag(c, t, t0)
    a = ua(t, c1 - 0.2, 0.4)
    x = 300 + min(1000, (t - c1) * 110) if t > c1 else 300
    car(c, x, 430, 1.0, a)
    c.drawLine(80, 470, 1840, 470, SP((90, 96, 150), 4, 200 * a))
    mdraw(c, '30 m/s  =  ? km/h', W / 2, 650, 96, CREAM, ua(t, c1 + 0.4, 0.8), align='center')
    a2 = ua(t, c2, 0.4)
    if a2 > 0:
        M.boxed(c, 420, 760, 1500, 900, a2)
        mdraw(c, '3600 s = 1 h', 520, 850, 64, TEAL, a2)
        mdraw(c, '1000 m = 1 km', 1000, 850, 64, TEAL, ua(t, wt(k, 'thousand', 1), 0.5))


def p1a(c, t):
    k = 'p1a'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); answer_tag(c, t, t0)
    sec = wt(k, 'seconds', 1); met = wt(k, 'meters', 1)
    items = [dict(q=('30', 'm/s'), t0=t0 + 0.3), dict(m='×', t0=wt(k, 'times')),
             dict(f=(('3600', 's'), ('1', 'h')), t0=wt(k, 'times') + 0.2), dict(m='×', t0=wt(k, 'times', 1)),
             dict(f=(('1', 'km'), ('1000', 'm')), t0=wt(k, 'times', 1) + 0.2, sd=met + 0.2), dict(m='=', t0=wt(k, 'one', 1) - 0.3),
             dict(q=('108', 'km/h'), t0=wt(k, 'one', 1), col=YELLOW)]
    row(c, items, W / 2, 420, 76, t, 'center')
    q0 = items[0]
    w1 = mw('30', 76) + 76 * 0.28
    # strike m in m/s with meters, s with seconds
    strike(c, q0['_x'] + w1, q0['_x'] + w1 + mw('m', 76), 420 - 24, ua(t, met, 0.35))
    strike(c, q0['_x'] + w1 + mw('m/', 76), q0['_x'] + q0['_w'], 420 - 24, ua(t, sec, 0.35))
    f1 = items[2]
    strike(c, f1['_x'] + f1['_w'] * 0.55, f1['_x'] + f1['_w'] * 0.8, 420 - 24 - 76 * 0.58, ua(t, sec + 0.15, 0.35))
    a = ua(t, c2, 0.4)
    if a > 0:
        M.boxed(c, 420, 640, 1500, 790, a)
        mdraw(c, '30 ÷ 3600 ≈ 0.008', 520, 735, 64, CORAL, a)
        cross(c, 1300, 712, 0.8, ua(t, c2 + 0.8, 0.3))
    a = ua(t, wt(k, 'hour', after=c2), 0.5)
    text(c, 'an hour is much longer than a second, so the number grows', W / 2, 900, 42, CREAM, a, 'semi', 'center')


# ================================================================ powers of ten
def e1(c, t):
    k = 'e1'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    mdraw(c, '10^4', W / 2, 420, 220, CREAM, ua(t, c1 - 0.4, 0.6), align='center')
    a = ua(t, wt(k, 'base'), 0.4)
    label(c, 'base', 640, 470, CREAM, 40, a, dot=(870, 380))
    label(c, 'exponent', 1240, 260, YELLOW, 40, ua(t, wt(k, 'exponent'), 0.4), dot=(1060, 250))
    mdraw(c, '= 10 × 10 × 10 × 10', W / 2, 650, 86, CREAM, ua(t, c2 - 0.2, 1.4), align='center')
    mdraw(c, '= 10,000', W / 2, 800, 96, YELLOW, ua(t, wt(k, 'thousand') - 0.4, 0.6), align='center')
    a = ua(t, c3, 0.5)
    if a > 0:
        M.boxed(c, 460, 880, 1460, 1000, a)
        mdraw(c, '10^6 = 1,000,000', W / 2, 965, 64, TEAL, a, align='center')
        text(c, 'six zeros', 1380, 935, 40, INK2, a, 'semi')


def tens(c, x, y, n, size, a, cols=None, cancel=None, u=1.0):
    """a row of written tens; cancel: dict index -> strike amount"""
    w = mw('10', size) + 18
    for i in range(n):
        if (i + 0.5) / n > u:
            break
        col = cols[i] if cols else CREAM
        mdraw(c, '10', x + i * w, y, size, col, 1, a)
        if cancel and cancel.get(i, 0) > 0:
            strike(c, x + i * w, x + i * w + w - 18, y - size * 0.3, cancel[i], a)
    return w * n


def e2(c, t):
    k = 'e2'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    a = 1 - ua(t, c3 - 0.3, 0.5) * 0.65
    lightbar(c, t, 260, c1, c1 + 3.0, 240, 1880)
    lightbar(c, t, 430, c1 + 3.0, c3, 240, 1880)
    lightbar(c, t, 640, c3, c3 + 3.5, 240, 1880)
    lightbar(c, t, 820, c3 + 3.5, fin(k) + 0.5, 240, 1880, 170)
    mdraw(c, '10^2 × 10^3', 300, 260, 100, CREAM, ua(t, c1 - 0.2, 0.8) * 1, a=a)
    if t > c1 + 2:
        tens(c, 300, 430, 5, 72, a * ua(t, c1 + 2, 0.4), cols=[TEAL, TEAL, AMBER, AMBER, AMBER], u=ua(t, wt(k, 'two') - 0.2, 2.6))
    mdraw(c, '= 10^5', 1190, 430, 96, YELLOW, ua(t, wt(k, 'fifth') - 0.3, 0.5), a=a)
    pill(c, 'multiply: ADD exponents', 1500, 250, TEAL, 40, ua(t, wt(k, 'add'), 0.4) * a)
    if t > c3 - 0.3:
        mdraw(c, '10^5 ÷ 10^2', 300, 640, 100, CREAM, ua(t, c3, 0.8))
        can = {i: ua(t, c3 + 4.5 + i * 0.15, 0.35) for i in range(2)}
        x = 300
        tens(c, x, 790, 5, 66, 1, u=ua(t, c3 + 2.0, 1.5), cancel=can)
        c.drawLine(x, 820, x + 5 * (mw('10', 66) + 18), 820, SP(CREAM, 4, 220 * ua(t, c3 + 2.0, 0.6)))
        tens(c, x, 900, 2, 66, 1, u=ua(t, c3 + 3.0, 1.0), cancel={i: ua(t, c3 + 4.6 + i * 0.15, 0.35) for i in range(2)})
        mdraw(c, '= 10^3', 1190, 820, 96, YELLOW, ua(t, c4 + 0.6, 0.5))
        pill(c, 'divide: SUBTRACT', 1500, 680, AMBER, 40, ua(t, c4, 0.4))


def e3(c, t):
    k = 'e3'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    mdraw(c, '(10^2)^3', W / 2, 330, 140, CREAM, ua(t, t0 + 0.2, 0.8), align='center')
    pa = ua(t, wt(k, 'parentheses'), 0.4)
    M.circle_mark(c, W / 2 + 10, 280, 270, 135, pa, AMBER)
    mdraw(c, '= 10^2 × 10^2 × 10^2', W / 2, 540, 90, CREAM, ua(t, c1 - 0.2, 1.4), align='center')
    mdraw(c, '= 10^6', W / 2, 700, 110, YELLOW, ua(t, wt(k, 'sixth') - 0.3, 0.5), align='center')
    pill(c, 'power of a power: MULTIPLY', W / 2, 800, TEAL, 40, ua(t, wt(k, 'multiplies'), 0.4))
    a = ua(t, c2, 0.4)
    if a > 0:
        M.boxed(c, 300, 860, 1620, 1010, a)
        mdraw(c, '10^2 × 2^3', 360, 960, 72, CREAM, a)
        text(c, 'different bases: no shortcut', 820, 950, 48, CORAL, ua(t, c2 + 1.0, 0.4), 'semi')


def e4(c, t):
    k = 'e4'
    t0, c1, c2, c3, c4, c5 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4), cue(k, 5)
    board(c, t)
    lightbar(c, t, 240, c1, c3, 200, 1500)
    lightbar(c, t, 440, c3, c4, 200, 1500)
    lightbar(c, t, 660, c4, c5, 200, 1500, 190)
    lightbar(c, t, 860, c5, fin(k) + 0.5, 200, 1720)
    mdraw(c, '10^3 ÷ 10^3 = 10^0', 260, 240, 90, CREAM, ua(t, c1 - 0.2, 1.0))
    mdraw(c, '= 1', 1120, 240, 90, YELLOW, ua(t, c2 + 1.0, 0.5))
    mdraw(c, '10^2 ÷ 10^5 = 10^{-3}', 260, 440, 90, CREAM, ua(t, c3 - 0.2, 1.4))
    if t > c4 - 0.3:
        u = ua(t, c4, 0.6)
        mdraw(c, '1', 380, 600, 80, CREAM, u, align='center')
        c.drawLine(240, 625, 520, 625, SP(CREAM, 4, 230 * u))
        tens(c, 250, 700, 3, 56, u)
        mdraw(c, '= 1/1000', 600, 660, 84, CREAM, ua(t, wt(k, 'thousand') - 0.3, 0.5))
    a = ua(t, c5, 0.5)
    if a > 0:
        chip(c, 'negative exponent = SMALL', 260, 790, CORAL, 52, a)
        mdraw(c, '10^{-3} = 0.001', 1180, 860, 90, YELLOW, ua(t, wt(k, 'point', after=c5) - 0.3, 0.6))


def e5(c, t):
    k = 'e5'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    title(c, 'adding is different', t, t0, 160, CORAL, 50)
    mdraw(c, '10^4 + 10^4', W / 2, 360, 110, CREAM, ua(t, c1 - 0.2, 0.7), align='center')
    mdraw(c, '= 10,000 + 10,000', W / 2, 520, 90, CREAM, ua(t, c1 + 0.8, 1.0), align='center')
    mdraw(c, '= 20,000 = 2 × 10^4', W / 2, 680, 100, YELLOW, ua(t, c2 - 0.2, 1.0), align='center')
    a = ua(t, wt(k, 'eighth') - 0.3, 0.4)
    mdraw(c, '10^8', W / 2, 860, 100, CORAL, a, align='center')
    cross(c, W / 2, 830, 1.3, ua(t, wt(k, 'eighth'), 0.3))


def e6(c, t):
    k = 'e6'
    t0, c1, c2, c3, c4, c5 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4), cue(k, 5)

    def cast_(c):
        M_, mp = maya_seated(t, write=0.0, neck=2 + 4 * math.sin(t * 0.7), look=0.0)
        mp.uarm_n = 40; mp.elbow_n = 40; mp.hand_n = 'point'
        M_.draw(c, mp)
        T_ = CA.theo()
        tp = CA.Pose(x=1440, ground=968, face=1, thigh_n=88, knee_n=-88, thigh_f=84, knee_f=-84, lean=8 + breath(t, 2), neck=10,
                     uarm_n=36 + 5 * math.sin(t * 8) * ua(t, c2, 0.3) * (1 - ua(t, c3, 0.3)), elbow_n=64, hand_n='grip', uarm_f=24, elbow_f=74,
                     hand_f='flat', blink=(t % 3.3) < 0.12, mouth=0.5 * ua(t, c3 + 3, 0.3) * (1 - ua(t, c3 + 5, 0.3)))
        T_.draw(c, tp)
        pencil(c, T_, tp)
    kitchen_shot(c, t, 1.6 + 0.08 * sm((t - t0) / 25), 1570, 690, cast_, cup=False)
    WD.finish(c, t)
    # the paper Theo is filling with zeros, shown large
    a = ua(t, c1 - 0.2, 0.4) * (1 - ua(t, c3 - 0.4, 0.4))
    if a > 0:
        M.boxed(c, 100, 90, 1820, 360, a)
        text(c, 'a 1 followed by about 22 zeros', 160, 175, 54, YELLOW, a, 'semi')
        u = ua(t, c2, 3.0)
        c.drawRect(skia.Rect(160, 225, 160 + 1600 * max(0.05, u), 320), P((244, 240, 230), 255 * a))
        mdraw(c, '1' + '0' * int(22 * u), 180, 300, 70, (50, 52, 70), 1.0, a)
        if u > 0.9:
            text(c, 'running out of room!', 1500, 175, 40, CORAL, a * ua(t, c2 + 3.0, 0.3), 'semi')
    a = ua(t, c3 - 0.3, 0.4)
    if a > 0:
        M.boxed(c, 100, 90, 1820, 380, a)
        mdraw(c, 'a billion = 10^9', 160, 190, 66, CREAM, ua(t, c3 + 0.3, 0.6))
        mdraw(c, '10^9 × 10^9 = 10^{9+9} = 10^{18}', 160, 320, 66, CREAM, ua(t, c4 + 0.6, 1.6))
        mdraw(c, '× 10^4 → 10^{18+4} = 10^{22}', 1130, 320, 66, YELLOW, ua(t, c5 + 0.6, 1.6))
        text(c, 'a billion billion', 900, 180, 44, TEAL, ua(t, c4, 0.4), 'semi')
        text(c, 'ten thousand of those', 1300, 180, 44, TEAL, ua(t, c5, 0.4), 'semi')


def e7(c, t):
    k = 'e7'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    # one molecule, huge, with a width bar
    a = ua(t, t0, 0.5) * (1 - ua(t, c3 - 0.3, 0.6) * 0.0)
    sc = 6.0 - 3.6 * ua(t, c3 - 0.3, 1.0)
    mx = W / 2 - 640 * ua(t, c3 - 0.3, 1.0)
    my = 420 - 120 * ua(t, c3 - 0.3, 1.0)
    molecule(c, mx, my, sc, ang=6 * math.sin(t * 0.8), a=a)
    w = 52 * sc
    c.drawLine(mx - w, my + 26 * sc + 30, mx + w, my + 26 * sc + 30, SP(AMBER, 5, 255 * ua(t, c2 - 0.2, 0.4)))
    mdraw(c, '≈ 3 × 10^{-10} m', mx, my + 26 * sc + 100, 70, YELLOW, ua(t, c2 - 0.2, 0.6), align='center')
    if t > c3 - 0.2:
        # to scale: a 3 mm row of molecules (about 217 px) next to the drop, about 8.3 mm across (600 px)
        u = ua(t, c3, 1.4)
        y = 860; x0 = 200; L = 217
        n = int(18 * u)
        for i in range(n):
            molecule(c, x0 + 6 + i * (L - 12) / 17, y, 0.32, ang=i * 30, a=1)
        c.drawLine(x0, y + 40, x0 + L * u, y + 40, SP(AMBER, 5, 255 * u))
        text(c, '10 million in a row ≈ 3 mm', x0, y + 100, 44, CREAM, u, 'semi')
        mdraw(c, '3 × 10^{-10} × 10^7 = 3 × 10^{-3} m', 160, 620, 60, YELLOW, ua(t, wt(k, 'exponents') - 0.2, 1.2))
        a3 = ua(t, wt(k, 'half') - 0.6, 0.5)
        big_drop(c, t, 1440, 600, 300, a3, mol=0.0)
        c.drawLine(1140, 980, 1740, 980, SP(TEAL, 5, 255 * a3))
        text(c, 'the drop ≈ 8 mm across', 1440, 1040, 44, TEAL, a3, 'semi', 'center')
        text(c, '(drawn to the same scale)', x0, y + 150, 40, INK2, a3, 'semi')


def p2q(c, t):
    k = 'p2q'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); practice_tag(c, t, t0)
    mdraw(c, '(10^6 × 10^{-9}) ÷ 10^{-2} = ?', W / 2, 460, 100, CREAM, ua(t, c1 - 0.2, 1.4), align='center')
    mdraw(c, '10^3 + 10^3 = ?', W / 2, 760, 100, CREAM, ua(t, c2 - 0.2, 0.8), align='center')


def p2a(c, t):
    k = 'p2a'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t); answer_tag(c, t, t0)
    lightbar(c, t, 260, t0 + 0.3, c1, 220, 1300)
    lightbar(c, t, 420, c1, c2, 220, 1600)
    lightbar(c, t, 580, c2, c3, 220, 1300)
    mdraw(c, '6 + (−9) = −3   →   10^{-3}', 260, 260, 76, CREAM, ua(t, t0 + 0.3, 1.4))
    mdraw(c, '−3 − (−2) = −1', 260, 420, 76, CREAM, ua(t, c1 - 0.1, 1.2))
    text(c, 'subtracting a negative adds', 1000, 400, 40, TEAL, ua(t, wt(k, 'adds'), 0.4), 'semi')
    mdraw(c, '= 10^{-1} = 0.1', 260, 580, 90, YELLOW, ua(t, c2 - 0.1, 0.8))
    a = ua(t, c3 - 0.1, 0.4)
    if a > 0:
        M.boxed(c, 240, 700, 1680, 960, a)
        mdraw(c, '1000 + 1000 = 2000 = 2 × 10^3', 300, 820, 76, CREAM, ua(t, c3, 1.4))
        mdraw(c, 'not 10^6', 300, 930, 76, CORAL, ua(t, wt(k, 'sixth') - 0.3, 0.4))
        cross(c, 640, 905, 0.9, ua(t, wt(k, 'sixth'), 0.3))


# ================================================================ scientific notation
def glass(c, x, y, s, a, t):
    c.save(); c.translate(x, y); c.scale(s, s)
    p = skia.Path(); p.moveTo(-80, -240); p.lineTo(80, -240); p.lineTo(64, 0); p.lineTo(-64, 0); p.close()
    q = skia.Path(); q.moveTo(-74, -180); q.lineTo(74, -180); q.lineTo(64, 0); q.lineTo(-64, 0); q.close()
    c.drawPath(q, P((120, 176, 236), 210 * a))
    c.drawPath(p, SP((220, 232, 245), 5, 230 * a))
    c.drawLine(-74, -180, 74, -180, SP((220, 240, 255), 3, 230 * a))
    c.restore()


def s1(c, t):
    k = 's1'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    glass(c, 260, 520, 1.3, ua(t, t0, 0.4), t)
    mdraw(c, '≈ 8 × 10^{24} molecules', 450, 300, 70, CREAM, ua(t, t0 + 0.6, 1.0))
    a = 1 - ua(t, c2 + 1.0, 0.5)
    mdraw(c, '8,000,000,000,000,000,000,000,000', 450, 450, 50, CREAM, ua(t, c1 - 0.1, 1.6) * a)
    if t > c2:
        a2 = ua(t, c2, 0.5)
        mdraw(c, '8', 700, 760, 200, YELLOW, a2)
        mdraw(c, '× 10^{24}', 860, 760, 140, CREAM, a2)
        label(c, 'coefficient: 1 up to just under 10', 480, 930, YELLOW, 40, ua(t, c3, 0.4), dot=(750, 790))
        label(c, 'power of ten: how far the point moved', 1060, 560, CREAM, 40, ua(t, c4, 0.4), dot=(1020, 650))


def hop_number(c, digits, p0, p1, x, y, size, u, col=CREAM, a=1.0, lead_zeros=0):
    """digits drawn with a decimal point that hops from slot p0 to slot p1 (slot i = after digit i-1); arcs mark each hop"""
    f = K.font('hand', size)
    xs = [x]
    for ch in digits:
        xs.append(xs[-1] + f.measureText(ch) + size * 0.08)
    for i, ch in enumerate(digits):
        c.drawString(ch, xs[i], y, f, P(col, 255 * a))
    n = abs(p1 - p0)
    pos = p0 + (p1 - p0) * u
    i0 = int(math.floor(pos)); fr = pos - i0
    i0 = max(0, min(len(xs) - 1, i0)); i1 = max(0, min(len(xs) - 1, i0 + 1))
    px = xs[i0] + (xs[i1] - xs[i0]) * fr - size * 0.04
    hop = abs(math.sin(math.pi * fr)) * size * 0.4
    c.drawCircle(px, y - hop + size * 0.02, size * 0.1, P(AMBER, 255 * a))
    done = int(abs(pos - p0) + 1e-6)
    for j in range(done):
        a0 = p0 + (j if p1 > p0 else -j); a1 = a0 + (1 if p1 > p0 else -1)
        xa, xb = xs[max(0, min(len(xs) - 1, a0))], xs[max(0, min(len(xs) - 1, a1))]
        r = skia.Rect(min(xa, xb), y - size * 1.25, max(xa, xb), y - size * 0.75)
        c.drawArc(r, 180, 180, False, SP(AMBER, 4, 220 * a))
        text(c, str(j + 1), (xa + xb) / 2, y - size * 1.3, size * 0.32, AMBER, a, 'xb', 'center')
    return xs


def s2(c, t):
    k = 's2'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    # sun and earth with the distance between them
    a = ua(t, c1 - 0.3, 0.6)
    glow(c, 260, 300, 160, (255, 200, 90), a)
    c.drawCircle(260, 300, 110, P((255, 196, 80), 255 * a))
    c.drawCircle(1680, 300, 46, P((90, 150, 230), 255 * a))
    c.drawCircle(1666, 286, 18, P((120, 200, 130), 255 * a))
    c.drawLine(390, 300, 1610, 300, SP(INK2, 3, 200 * a))
    text(c, '149,600,000 km', W / 2, 270, 50, CREAM, ua(t, c1 + 0.5, 0.5), 'semi', 'center')
    text(c, 'move the point LEFT until one digit (not zero) is in front', W / 2, 160, 46, INK2, ua(t, t0, 0.4), 'semi', 'center')
    u = ua(t, c2, 2.4)
    if t > c1 + 0.6:
        hop_number(c, '149600000', 9, 1, 560, 620, 110, u, a=ua(t, c1 + 0.6, 0.5))
    mdraw(c, '= 1.496 × 10^8 km', W / 2, 860, 100, YELLOW, ua(t, wt(k, 'four', after=c2) - 0.2, 1.0), align='center')
    pill(c, 'big number: left, positive exponent', W / 2, 960, TEAL, 40, ua(t, c3, 0.4))


def s3(c, t):
    k = 's3'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    # a smoke particle: a soft grey clump
    a = ua(t, c1 - 0.3, 0.5)
    for i, (dx, dy, r) in enumerate(((0, 0, 60), (40, -20, 44), (-40, 10, 40), (10, 40, 38), (-20, -40, 34))):
        c.drawCircle(1600 + dx + 4 * math.sin(t + i), 250 + dy, r, P((150, 152, 166), 230 * a))
    text(c, 'smoke particle', 1600, 385, 44, INK2, a, 'semi', 'center')
    text(c, '650 billionths of a meter', 600, 230, 50, CREAM, ua(t, c1 + 0.4, 0.5), 'semi', 'center')
    if t > c1 + 0.8:
        hop_number(c, '0000000650', 1, 8, 420, 560, 100, ua(t, c2, 2.4), a=ua(t, c1 + 0.8, 0.5))
    mdraw(c, '= 6.50 × 10^{-7} m', W / 2, 820, 100, YELLOW, ua(t, c3 - 0.2, 1.0), align='center')
    pill(c, 'small number: right, negative exponent', W / 2, 950, CORAL, 40, ua(t, wt(k, 'small', after=c3 + 1), 0.4))


def s4(c, t):
    k = 's4'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    board(c, t)
    lightbar(c, t, 300, c1, c2, 260, 1660)
    lightbar(c, t, 500, c2, c3, 300, 1000)
    lightbar(c, t, 500, c3, c4, 1020, 1700)
    lightbar(c, t, 740, c4, fin(k) + 0.5, 420, 1500, 140)
    mdraw(c, '(3.0 × 10^4) × (2.0 × 10^{-6})', W / 2, 300, 96, CREAM, ua(t, c1 - 0.2, 1.6), align='center')
    a = ua(t, c2 - 0.2, 0.5)
    mdraw(c, '3.0 × 2.0 = 6.0', 360, 500, 80, TEAL, a)
    text(c, 'front numbers: multiply', 360, 570, 44, TEAL, a, 'semi')
    a = ua(t, c3 - 0.2, 0.5)
    mdraw(c, '10^{4 + (−6)} = 10^{-2}', 1080, 500, 80, AMBER, a)
    text(c, 'exponents: add', 1080, 570, 44, AMBER, a, 'semi')
    mdraw(c, '= 6.0 × 10^{-2}', W / 2, 740, 110, YELLOW, ua(t, c4 - 0.2, 0.8), align='center')
    a = ua(t, wt(k, 'dividing'), 0.4)
    if a > 0:
        M.boxed(c, 460, 840, 1460, 970, a)
        text(c, 'dividing: divide the front numbers, subtract the exponents', W / 2, 920, 36, CREAM, a, 'semi', 'center')


def s5(c, t):
    k = 's5'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    mdraw(c, '52 × 10^5', W / 2, 320, 120, CREAM, ua(t, t0 + 1.5, 0.8), align='center')
    M.circle_mark(c, W / 2 - 130, 280, 90, 70, ua(t, t0 + 2.5, 0.5), CORAL)
    text(c, 'too big for the front', W / 2 - 130, 420, 36, CORAL, ua(t, t0 + 2.5, 0.4), 'semi', 'center')
    mdraw(c, '52 = 5.2 × 10^1', W / 2, 560, 90, TEAL, ua(t, c1 - 0.2, 0.9), align='center')
    mdraw(c, '5.2 × 10^1 × 10^5', W / 2, 720, 90, CREAM, ua(t, c2 - 0.2, 0.9), align='center')
    mdraw(c, '= 5.2 × 10^6', W / 2, 890, 120, YELLOW, ua(t, c3 - 0.2, 0.8), align='center')


def calculator(c, x, y, s, a, t, keys=None, disp='', warn=0.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-200, -330, 200, 330), 34, 34), P((52, 58, 86), 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-170, -300, 170, -180), 14, 14), P((190, 214, 178), 255 * a))
    text(c, disp, 150, -220, 52, (40, 56, 40), a, 'xb', 'right')
    labels = ['7', '8', '9', 'EE', '4', '5', '6', '(−)', '1', '2', '3', '−', '0', '.', '×', '=']
    for i, lb in enumerate(labels):
        cx = -135 + (i % 4) * 90; cy = -110 + (i // 4) * 100
        hl = (keys or {}).get(lb, 0.0)
        col = (96, 104, 140) if lb not in ('EE', '(−)') else (90, 120, 200)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 38, cy - 36, cx + 38, cy + 36), 12, 12), P(col, 255 * a))
        if hl > 0.01:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 42, cy - 40, cx + 42, cy + 40), 14, 14), SP(AMBER, 6, 255 * hl * a))
        text(c, lb, cx, cy + 13, 34 if len(lb) < 3 else 26, CREAM, a, 'xb', 'center')
    c.restore()


def s7(c, t):
    k = 's7'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t)
    seq = [('3', wt(k, 'three', after=c1)), ('.', wt(k, 'point', after=c1)), ('2', wt(k, 'two', after=c1)), ('EE', wt(k, 'e', 2, after=c1)),
           ('(−)', wt(k, 'negative', after=c1 + 2)), ('5', wt(k, 'five', after=c1 + 2))]
    keys = {}; disp = ''
    for kk, tt in seq:
        if t >= tt:
            keys[kk] = 1 - ua(t, tt + 0.4, 0.3)
            disp = {'3': '3', '.': '3.', '2': '3.2', 'EE': '3.2E', '(−)': '3.2E−', '5': '3.2E−5'}[kk]
    keys['EE'] = max(keys.get('EE', 0), ua(t, wt(k, 'e'), 0.3) * (1 - ua(t, c1, 0.4)))
    calculator(c, 520, 560, 1.15, ua(t, t0, 0.4), t, keys, disp)
    mdraw(c, 'EE = × 10^{ }', 1000, 300, 90, YELLOW, ua(t, wt(k, 'times') - 0.2, 0.6))
    mdraw(c, '3.2 × 10^{-5}', 1000, 480, 90, CREAM, ua(t, c1 - 0.1, 0.7))
    text(c, 'use the negative key (−), not minus', 1000, 580, 38, TEAL, ua(t, wt(k, 'negative', after=c1), 0.4), 'semi')
    a = ua(t, c2, 0.4)
    if a > 0:
        M.boxed(c, 960, 680, 1840, 920, a, col=(60, 24, 30))
        mdraw(c, '3.2 × 10 EE −5', 1010, 780, 64, CORAL, a)
        text(c, '= 10 times too big', 1010, 870, 44, CORAL, ua(t, wt(k, 'big', after=c2), 0.4), 'semi')
        cross(c, 1750, 780, 0.8, ua(t, wt(k, 'big', after=c2), 0.3))


def s8(c, t):
    k = 's8'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)

    def cast_(c):
        WD.stool(c, 760)
        T_, tp = theo_stool(t, neck=6, look=0.6, face=1)
        T_.draw(c, tp)
        M_, mp = maya_seated(t, write=1.0, neck=12)
        M_.draw(c, mp); pencil(c, M_, mp)
    kitchen_shot(c, t, 1.2 + 0.05 * sm((t - t0) / 20), 1230, 560, cast_)
    WD.finish(c, t)
    a = ua(t, t0 + 1.0, 0.4)
    M.boxed(c, 60, 50, 1860, 360 if t > c2 - 0.3 else 210, a)
    if a > 0:
        text(c, '1 gram of water ≈', 110, 140, 44, INK2, a, 'semi')
        mdraw(c, '3.34 × 10^{22} molecules', 510, 150, 64, YELLOW, ua(t, wt(k, 'three') - 0.2, 1.0))
        text(c, 'the moles video shows how', 1300, 140, 40, INK2, ua(t, wt(k, 'moles') - 0.4, 0.4), 'semi')
    if t > c2 - 0.3:
        a2 = ua(t, c2 - 0.3, 0.4)
        mlc = wt(k, 'milliliters', after=c4); gr = wt(k, 'grams', after=c4)
        items = [dict(f=(('0.3', 'mL'), ('1', 'drop')), t0=c2, sn=mlc), dict(m='×', t0=wt(k, 'one', after=c2) - 0.2),
                 dict(f=(('1', 'g'), ('1', 'mL')), t0=wt(k, 'one', after=c2), sd=mlc + 0.2, sn=gr), dict(m='×', t0=c3),
                 dict(f=(('3.34 × 10^{22}', 'molecules'), ('1', 'g')), t0=c3 + 0.4, sd=gr + 0.2)]
        row(c, items, W / 2, 300, 50, t, 'center', a2)


def s9(c, t):
    k = 's9'
    t0, c1, c2, c3, c4 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4)
    glowu = ua(t, wt(k, 'that\'s') - 0.3, 1.0)

    def cast_(c):
        WD.stool(c, 760)
        amaze = ua(t, wt(k, 'that\'s') + 0.5, 0.4)
        T_, tp = theo_stool(t, neck=6 - 6 * amaze, look=0.6, face=1, mouth=0.6 * amaze)
        T_.draw(c, tp)
        M_, mp = maya_seated(t, write=1.0 - amaze, neck=12)
        M_.draw(c, mp); pencil(c, M_, mp)
    kitchen_shot(c, t, 1.25 + 0.15 * sm((t - wt(k, 'that\'s')) / 6), 1230 - 230 * sm((t - wt(k, 'that\'s')) / 6), 640, cast_)
    # the drop on the spout glows as the number lands
    if glowu > 0:
        c.save(); WD.camera(c, 1.25 + 0.15 * sm((t - wt(k, 'that\'s')) / 6), 1230 - 230 * sm((t - wt(k, 'that\'s')) / 6), 640)
        glow(c, WD.SPOUT[0], WD.SPOUT[1] + 12, 60, (160, 210, 255), glowu)
        c.restore()
    WD.finish(c, t)
    a = ua(t, t0, 0.4)
    M.boxed(c, 60, 70, 1860, 420, a)
    mdraw(c, '0.3 = 3 × 10^{-1}', 110, 160, 60, CREAM, ua(t, t0 + 0.2, 0.9))
    mdraw(c, '3 × 3.34 = 10.02', 110, 250, 60, TEAL, ua(t, c2 - 0.1, 0.9))
    mdraw(c, '−1 + 22 = 21', 700, 250, 60, AMBER, ua(t, wt(k, 'negative') - 0.1, 0.9))
    mdraw(c, '10.02 × 10^{21}', 110, 350, 66, CREAM, ua(t, wt(k, 'so') - 0.1, 0.9))
    M.circle_mark(c, 175, 330, 82, 46, ua(t, c3, 0.5), CORAL)
    mdraw(c, '→  1.002 × 10^{22} molecules', 620, 350, 70, YELLOW, ua(t, c4 - 0.1, 1.2))
    a = ua(t, wt(k, 'ten', after=wt(k, 'that\'s')) - 0.2, 0.5)
    pill(c, 'about 10,000 billion billion, in ONE drop', W / 2, 980, AMBER, 40, a)
    text(c, 'digits to keep: next video', 1560, 250, 44, CREAM, ua(t, c4 + 1.5, 0.5), 'semi', 'center')


def p3q(c, t):
    k = 'p3q'
    t0, c1, c2 = cue(k), cue(k, 1), cue(k, 2)
    board(c, t); practice_tag(c, t, t0)
    mdraw(c, '(4.0 × 10^5) × (6.0 × 10^{-8}) = ?', W / 2, 520, 100, CREAM, ua(t, c1 - 0.2, 1.6), align='center')
    text(c, 'answer in proper scientific notation', W / 2, 700, 52, YELLOW, ua(t, c2, 0.4), 'semi', 'center')


def p3a(c, t):
    k = 'p3a'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t); answer_tag(c, t, t0)
    mdraw(c, '(4.0 × 10^5) × (6.0 × 10^{-8})', W / 2, 230, 70, CREAM, 1.0, a=0.7, align='center')
    lightbar(c, t, 380, t0 + 0.3, c1, 240, 1700)
    lightbar(c, t, 560, c1, c3, 560, 1360)
    lightbar(c, t, 740, c3, fin(k) + 0.5, 520, 1400, 140)
    mdraw(c, '4.0 × 6.0 = 24', 300, 380, 80, TEAL, ua(t, t0 + 0.3, 0.9))
    mdraw(c, '5 + (−8) = −3', 1060, 380, 80, AMBER, ua(t, wt(k, 'five') - 0.1, 0.9))
    mdraw(c, '24 × 10^{-3}', W / 2, 560, 100, CREAM, ua(t, c1 - 0.1, 0.8), align='center')
    M.circle_mark(c, W / 2 - 130, 525, 80, 60, ua(t, c2, 0.5), CORAL)
    mdraw(c, '= 2.4 × 10^{-2}', W / 2, 740, 120, YELLOW, ua(t, c3 - 0.1, 0.8), align='center')
    a = ua(t, wt(k, 'people') - 0.2, 0.4)
    if a > 0:
        M.boxed(c, 300, 820, 1620, 1000, a)
        mdraw(c, '24 × 10^{-3}', 360, 930, 70, CORAL, a)
        text(c, 'right value, but not scientific notation', 800, 915, 44, CREAM, ua(t, wt(k, 'value'), 0.4), 'semi')


# ================================================================ recap and end
def rc(c, t):
    k = 'rc'
    t0, c1, c2, c3 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3)
    board(c, t)
    title(c, 'recap', t, t0, 130, INK2, 52)
    panels = [(c1, 'units', CHEM), (c2, 'powers of ten', TEAL), (c3, 'scientific notation', AMBER)]
    for i, (tt, nm, col) in enumerate(panels):
        x0 = 80 + i * 600
        a = ua(t, tt - 0.2, 0.5)
        if a <= 0:
            continue
        M.boxed(c, x0, 210, x0 + 560, 940, a)
        c.drawRect(skia.Rect(x0, 210, x0 + 560, 222), P(col, 255 * a))
        text(c, nm, x0 + 280, 300, 46, col, a, 'xb', 'center')
        if i == 0:
            qty(c, '12.6', 'g', x0 + 150, 430, 70, a)
            frac(c, ('1000', 'm'), ('1', 'km'), x0 + 180, 600, 64, a, sd=ua(t, tt + 2.0, 0.4), a=a)
            text(c, 'the unit you have', x0 + 280, 810, 42, CREAM, ua(t, wt(k, 'bottom'), 0.4), 'semi', 'center')
            text(c, 'goes on the bottom', x0 + 280, 862, 42, CREAM, ua(t, wt(k, 'bottom'), 0.4), 'semi', 'center')
        elif i == 1:
            mdraw(c, '×  add', x0 + 120, 450, 66, CREAM, ua(t, wt(k, 'add'), 0.5))
            mdraw(c, '÷  subtract', x0 + 120, 590, 66, CREAM, ua(t, wt(k, 'subtract'), 0.5))
            mdraw(c, '10^{-3} = small', x0 + 120, 740, 66, YELLOW, ua(t, wt(k, 'negative', after=tt), 0.5))
        else:
            mdraw(c, 'a × 10^{n}', x0 + 280, 500, 90, CREAM, ua(t, tt, 0.6), align='center')
            mdraw(c, '1 ≤ a < 10', x0 + 280, 660, 70, YELLOW, ua(t, wt(k, 'including') - 0.2, 0.6), align='center')


def end(c, t):
    k = 'end'
    t0, c1, c2, c3, c4, c5 = cue(k), cue(k, 1), cue(k, 2), cue(k, 3), cue(k, 4), cue(k, 5)
    # Theo climbs down and walks out to the left; then a push to the faucet as Maya turns the handle and the drip stops
    walk0 = t0 + 1.2
    tw = max(0.0, t - walk0)
    hop = ua(t, t0 + 0.5, 0.5)
    tx = 760 + 185 * tw if t > walk0 else 760
    off = (t > walk0 + 6)
    turn = ua(t, c2 - 0.6, 0.4)
    handle = ua(t, c2 + 0.6, 1.2)

    def cast_(c):
        WD.stool(c, 760)
        if not off:
            T_ = CA.theo()
            if t <= walk0:
                tp = CA.Pose(x=760 + 40 * hop, ground=912 + 98 * hop, face=1, lean=4, neck=10 - 20 * hop * 0, uarm_n=0, elbow_n=20,
                             blink=(t % 3.1) < 0.12, mouth=talking(t, k, t0, c1 + 1.5) * 0.6)
            else:
                ph = tw * 5.2
                sw = math.sin(ph)
                # the swing leg (thigh moving forward) bends its knee; the stance leg stays straight and moves back
                tp = CA.Pose(x=tx, ground=1010, face=1, lean=4, neck=4, thigh_n=24 * sw, knee_n=-34 * max(0, math.cos(ph)) - 3,
                             thigh_f=-24 * sw, knee_f=-34 * max(0, -math.cos(ph)) - 3, uarm_n=-18 * sw, elbow_n=24, uarm_f=18 * sw, elbow_f=24)
            T_.draw(c, tp)
        M_ = CA.maya()
        mp = CA.Pose(x=1150, ground=1010, face=-1, lean=6 + breath(t), neck=4, uarm_f=10, elbow_f=30, hand_n='grip',
                     blink=(t % 4.0) < 0.12)
        reach = ua(t, c2 - 0.9, 0.7)
        if reach > 0:
            ang = math.radians(-80 * handle)
            tgt = (1004 + 22 * math.sin(ang) + 10, 636 - 22 * math.cos(ang) + 30)
            rest = M_.canvas_pt(mp, M_.joints(mp)['hand_n'][0])
            ik_pose(M_, mp, (rest[0] + (tgt[0] - rest[0]) * reach, rest[1] + (tgt[1] - rest[1]) * reach))
        M_.draw(c, mp)
    z = 1.0 + 0.8 * sm((t - (c2 - 0.6)) / 2.5)
    fx = 1100 - 110 * sm((t - (c2 - 0.6)) / 2.5); fy = 600
    drip_on = t < c3 - 0.1
    c.save(); WD.camera(c, z, fx, fy)
    WD.kitchen(c, t, cast=cast_, drip_on=drip_on, handle=handle)
    if not drip_on:   # the last drop just hangs there
        WD.drop(c, WD.SPOUT[0], WD.SPOUT[1] + 6, 6)
    c.restore()
    WD.finish(c, t)
    # end screen: levlprep.com in the top third, lower two thirds calm
    a = ua(t, min(c4 - 0.3, Bt['__DUR'] - 20.0), 0.5)
    if a > 0:
        c.drawRect(skia.Rect(0, 0, W, 330), P((10, 14, 30), 150 * a))
        text(c, 'levlprep.com', W / 2, 150, 84, CREAM, a, 'xb', 'center')
        text(c, 'free notes and practice for this topic', W / 2, 220, 40, INK2, a, 'semi', 'center')
        pill(c, 'next: significant figures', W / 2, 290, AMBER, 40, ua(t, c5, 0.4))


SCENES = dict(hook=hook, promise=promise, why=why, u1=u1, u2=u2, u3=u3, u4=u4, u5=u5, u6=u6, u7=u7, u8=u8, u9=u9, p1q=p1q, p1a=p1a,
              e1=e1, e2=e2, e3=e3, e4=e4, e5=e5, e6=e6, e7=e7, p2q=p2q, p2a=p2a, s1=s1, s2=s2, s3=s3, s4=s4, s5=s5, s7=s7, s8=s8,
              s9=s9, p3q=p3q, p3a=p3a, rc=rc, end=end)
