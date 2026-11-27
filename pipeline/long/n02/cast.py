"""The people of yt-nremt-02 (Shorts people standard; ship gates 2 and 3 are checked by gate2s.py and gate3s.py).
Each person is a new design on the one skinned front view body (nperson.py, a copy of lperson.py with a chair seat, a plaid
shirt, overlays and a head hook) with their OWN head built as designed outlines from their head sheet (nhead.py).

WALT, 58, owns the hardware store (ref/walt_sheet.png): heavy build, ruddy light skin, short grey receding hair, thick grey brows,
  a grey moustache, a broad nose, jowls; a red plaid flannel shirt with the sleeves rolled, a green shop apron, tan trousers, brown boots.
PRIYA, about 27, EMT, the main person (ref/priya_sheet.png): slim, warm brown skin, black hair pulled back in a high ponytail,
  arched brows, large dark eyes; a navy EMS uniform shirt, a radio shoulder microphone at her left collar, navy trousers, black boots.
RUIZ, about 40, sheriff's deputy, an EMR (ref/cast_sheet.png, ref/heads_trio.png): stocky, tan skin, a black buzz cut, a goatee;
  a tan uniform shirt with long sleeves, a gold star badge, olive trousers, a black duty belt.
MARCUS, about 32, AEMT: tall and lean, dark brown skin, short curls with a high fade, glasses; the same EMS uniform as Priya.
JOAN, about 45, paramedic: fair freckled skin, an auburn bob with a side part; a red paramedic jacket with silver bands over a
  white shirt, a stethoscope, charcoal trousers.

API: draw(c, who, ps, x, ground, s); idle(t, ph, ...); arm_to(ps, side, target, x, ground, s, who); place(ps, side, (u, v), target,
hand_ang, x, ground, s, who) puts a point of the hand on a screen point; hold(ps, side, kind) wires what a hand holds
('handle' the AED case hanging from the fist, 'bottle', 'mic', 'strap', 'bag' the IV bag hanging from the fist, 'strip').
hands_only(...) draws a bare forearm and hand for close shots. gate_samples() lists every pose the story uses."""
import sys, math
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import skia
import nperson as PN
import nhead as NH
import bhands as H
from guy import Pose, limb, stroke
from lpk import P, SP, blur, lerp, mix, smooth, smooth_closed
from art import shaded, tube, op, diffp

NAVY_U = dict(TOP=(58, 78, 140), TOP_SH=(36, 50, 100), TOP_HI=(112, 134, 196), PANT=(40, 46, 84), PANT_SH=(26, 30, 60), PANT_HI=(84, 94, 140))
BOOT = ((44, 44, 54), (26, 26, 36), (20, 20, 28))


def _ov_priya(c, T, wst, ps, whole):
    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
    q = T(-78, -8); pt = smooth_closed([(q[0] - 15, q[1] - 16), (q[0] + 15, q[1] - 16), (q[0] + 15, q[1] + 8), (q[0], q[1] + 22), (q[0] - 15, q[1] + 8)])      # the shoulder patch
    c.drawPath(pt, P((226, 232, 244))); c.drawCircle(q[0], q[1] - 1, 7, P((63, 194, 169)))
    c.drawRect(skia.Rect(wst[0] - 106, wst[1] + 6, wst[0] + 106, wst[1] + 30), P((24, 24, 34))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wst[0] - 13, wst[1] + 7, wst[0] + 13, wst[1] + 29), 3, 3), P((150, 156, 176)))
    c.restore()
    if getattr(ps, 'mic', True):
        m = T(54, 6); mic_body(c, m, 1.0)
        cord(c, (m[0] + 4, m[1] + 30), (wst[0] + 84, wst[1] + 10))


def mic_body(c, m, k=1.0):
    """the radio shoulder microphone: a black speaker box with a grille and a push to talk bar on its side"""
    b = skia.Path(); b.addRoundRect(skia.Rect(m[0] - 21 * k, m[1] - 30 * k, m[0] + 21 * k, m[1] + 30 * k), 8 * k, 8 * k)
    q = skia.Path(b); q.offset(3, 5); c.drawPath(q, P((20, 10, 40), 90, MaskFilter=blur(4)))
    c.drawPath(b, P((34, 36, 48))); c.drawPath(diffp(b, (3, 3)), P((84, 88, 108), 200))
    for j in range(-2, 3): c.drawLine(m[0] - 12 * k, m[1] - 6 * k + j * 5.4 * k, m[0] + 12 * k, m[1] - 6 * k + j * 5.4 * k, SP((14, 14, 22), 2.4 * k))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(m[0] - 26 * k, m[1] - 14 * k, m[0] - 19 * k, m[1] + 14 * k), 3, 3), P((70, 74, 92)))
    c.drawCircle(m[0] + 11 * k, m[1] + 21 * k, 2.6 * k, P((240, 90, 80)))


def cord(c, a, b, n=9):
    """a coiled cord from a to b"""
    p = skia.Path(); p.moveTo(*a)
    for i in range(1, n * 2 + 1):
        u = i / (n * 2); x = lerp(a[0], b[0], u) + (9 if i % 2 else -9); y = lerp(a[1], b[1], u) + 8 * math.sin(u * math.pi); p.lineTo(x, y)
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(26, 26, 36), Style=skia.Paint.kStroke_Style, StrokeWidth=5, StrokeJoin=skia.Paint.kRound_Join, StrokeCap=skia.Paint.kRound_Cap))


def _ov_marcus(c, T, wst, ps, whole):
    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
    q = T(-78, -8); pt = smooth_closed([(q[0] - 15, q[1] - 16), (q[0] + 15, q[1] - 16), (q[0] + 15, q[1] + 8), (q[0], q[1] + 22), (q[0] - 15, q[1] + 8)])
    c.drawPath(pt, P((226, 232, 244))); c.drawCircle(q[0], q[1] - 1, 7, P((63, 194, 169)))
    c.drawRect(skia.Rect(wst[0] - 106, wst[1] + 6, wst[0] + 106, wst[1] + 30), P((24, 24, 34))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wst[0] - 13, wst[1] + 7, wst[0] + 13, wst[1] + 29), 3, 3), P((150, 156, 176)))
    c.restore()


def _ov_ruiz(c, T, wst, ps, whole):
    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
    b = T(57, -4); st = skia.Path()                                                         # the gold star badge above his left pocket
    for i in range(10):
        r = 21 if i % 2 == 0 else 9.5; a = -math.pi / 2 + i * math.pi / 5; (st.moveTo if i == 0 else st.lineTo)(b[0] + r * math.cos(a), b[1] + r * math.sin(a))
    st.close(); q = skia.Path(st); q.offset(2, 3); c.drawPath(q, P((60, 40, 30), 120)); c.drawPath(st, P((240, 190, 70))); c.drawPath(diffp(st, (2, 2)), P((255, 232, 150))); c.drawCircle(b[0], b[1], 5, P((200, 140, 50)))
    for sd in (-1, 1):                                                                       # dark epaulettes and pocket flaps
        e = skia.Path(); e.addPoly([skia.Point(*T(sd * 52, 50)), skia.Point(*T(sd * 104, 28)), skia.Point(*T(sd * 108, 12)), skia.Point(*T(sd * 56, 34))], True); c.drawPath(e, P((96, 76, 56)))
        a_, b_, m_ = T(sd * 30, -20), T(sd * 82, -20), T(sd * 56, -42); fl_ = skia.Path(); fl_.addPoly([skia.Point(*a_), skia.Point(*b_), skia.Point(*m_)], True); c.drawPath(fl_, P((110, 88, 62)))
    c.drawRect(skia.Rect(wst[0] - 108, wst[1] - 2, wst[0] + 108, wst[1] + 30), P((26, 24, 30)))                                         # the duty belt, with a buckle, a radio pouch and a holster flap
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wst[0] - 15, wst[1] - 1, wst[0] + 15, wst[1] + 29), 3, 3), P((196, 170, 96)))
    for xx in (-84, 58): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wst[0] + xx, wst[1] - 8, wst[0] + xx + 30, wst[1] + 34), 5, 5), P((40, 38, 46)))
    c.restore()


def _ov_joan(c, T, wst, ps, whole):
    SV, SVD = (226, 232, 242), (150, 160, 184)
    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
    for v in (-96,):                                                                         # a silver band across the chest and one on each sleeve
        for sd in (-1, 1):
            bd = skia.Path(); bd.addPoly([skia.Point(*T(sd * 24, v)), skia.Point(*T(sd * 104, v)), skia.Point(*T(sd * 104, v - 26)), skia.Point(*T(sd * 24, v - 26))], True); c.drawPath(bd, P(SV)); c.drawPath(bd, SP(SVD, 2))
    bd = skia.Path(); bd.addRect(skia.Rect(wst[0] - 108, wst[1] - 6, wst[0] + 108, wst[1] + 16)); c.drawPath(bd, P(SV)); c.drawPath(bd, SP(SVD, 2))
    c.restore()
    p = skia.Path(); a_, b_ = T(-34, 44), T(34, 44); m_ = T(0, -66)                         # the stethoscope hangs round her neck
    p.moveTo(*a_); p.cubicTo(*T(-44, -20), *T(-16, -50), *m_); p.moveTo(*b_); p.cubicTo(*T(44, -20), *T(16, -50), *m_)
    c.drawPath(p, SP((24, 26, 36), 6.5)); q = T(0, -92); c.drawLine(m_[0], m_[1], q[0], q[1], SP((24, 26, 36), 6.5))
    c.drawCircle(q[0], q[1] - 4, 15, P((150, 158, 180))); c.drawCircle(q[0] - 2, q[1] - 6, 10, P((226, 232, 242)))


LOOKS = dict(
    walt=dict(TOP=(196, 62, 58), TOP_SH=(140, 38, 48), TOP_HI=(244, 132, 110), PANT=(200, 164, 110), PANT_SH=(150, 116, 86), PANT_HI=(240, 214, 160),
              SKIN=(238, 164, 138), SKIN_SH=(206, 122, 108), SKIN_HI=(255, 210, 186), HAIR=(160, 160, 164), HAIR_SH=(112, 112, 124), HAIR_HI=(214, 214, 220),
              cfg=dict(bw=1.2, top='uniform', rolled=True, plaid=(120, 30, 44), apron=(92, 150, 92), inner=(244, 238, 226), bottom='chinos', fw=1.12, fl=1.0, head=1.04, armw=1.14, wristw=1.1,
                       shoe=((134, 84, 54), (92, 54, 42), (60, 42, 40)), headfn=NH.head, hd='walt'), hs=1.0),
    priya=dict(SKIN=(198, 130, 86), SKIN_SH=(158, 94, 68), SKIN_HI=(240, 180, 132), HAIR=(26, 22, 30), HAIR_SH=(12, 10, 18), HAIR_HI=(84, 78, 104), **NAVY_U,
               cfg=dict(bw=0.9, top='uniform', rolled=True, inner=(40, 52, 100), bottom='cargo', fem=True, fw=1.0, fl=0.95, head=1.1, armw=0.88, wristw=0.92, shoe=BOOT, headfn=NH.head, hd='priya', overlay=_ov_priya), hs=0.97),
    ruiz=dict(TOP=(200, 180, 132), TOP_SH=(152, 130, 96), TOP_HI=(240, 226, 184), PANT=(84, 92, 68), PANT_SH=(56, 62, 50), PANT_HI=(132, 142, 110),
              SKIN=(194, 132, 90), SKIN_SH=(152, 96, 70), SKIN_HI=(236, 182, 134), HAIR=(26, 22, 26), HAIR_SH=(12, 10, 14), HAIR_HI=(80, 72, 84),
              cfg=dict(bw=1.14, top='uniform', inner=(244, 240, 232), bottom='chinos', fw=1.08, fl=0.98, head=1.0, armw=1.1, wristw=1.06, shoe=BOOT, headfn=NH.head, hd='ruiz', overlay=_ov_ruiz), hs=1.0),
    marcus=dict(SKIN=(116, 74, 56), SKIN_SH=(80, 50, 42), SKIN_HI=(168, 118, 90), HAIR=(22, 18, 22), HAIR_SH=(8, 6, 10), HAIR_HI=(76, 68, 80), **NAVY_U,
                cfg=dict(bw=0.92, top='uniform', rolled=True, inner=(240, 240, 240), bottom='cargo', fw=0.96, fl=1.08, head=0.95, armw=0.94, shoe=BOOT, headfn=NH.head, hd='marcus', overlay=_ov_marcus), hs=1.07),
    walt_cot=None,
    joan=dict(TOP=(216, 52, 52), TOP_SH=(158, 30, 46), TOP_HI=(255, 130, 110), PANT=(70, 74, 88), PANT_SH=(44, 46, 62), PANT_HI=(122, 128, 150),
              SKIN=(246, 206, 182), SKIN_SH=(214, 160, 140), SKIN_HI=(255, 236, 220), HAIR=(178, 72, 42), HAIR_SH=(128, 44, 36), HAIR_HI=(232, 128, 76),
              cfg=dict(bw=0.98, top='jacket', inner=(246, 246, 248), bottom='chinos', fem=True, fw=1.02, fl=0.98, head=1.05, shoe=BOOT, headfn=NH.head, hd='joan', overlay=_ov_joan), hs=0.99),
)

LOOKS['walt_cot'] = dict(LOOKS['walt'], cfg={k: v for k, v in LOOKS['walt']['cfg'].items() if k != 'apron'})

# hand shapes (the one hand model, bhands.py; curls are thumb, index, middle, ring, little)
FIST = dict(curls=(0.72, 0.8, 0.82, 0.82, 0.8), spread=0.04, creases=False)       # closed round a handle, a bottle, a strap
REST = dict(curls=(0.46, 0.12, 0.14, 0.16, 0.2), spread=0.12)                      # lying flat on a counter or a chest
SOFT = dict(curls=(0.48, 0.3, 0.34, 0.38, 0.44), spread=0.1)                       # resting on a knee or a shoulder
OPENP = dict(curls=(0.12, 0.1, 0.1, 0.12, 0.16), spread=0.35)                     # an open palm, offering
CUP = dict(curls=(0.2, 0.3, 0.32, 0.34, 0.38), spread=0.12)                       # a cupped palm, receiving
PRESS = dict(curls=(0.48, 0.24, 0.27, 0.3, 0.34), spread=0.0)                       # a hand pressed flat on the breastbone, fingers together
HOLD = dict(curls=(0.2, 0.5, 0.52, 0.54, 0.56), spread=0.06, creases=False)       # fingers laid over a paper strip
ELBOW_MAX, UP_MIN, UP_MAX = 145.0, -15.0, 150.0
WR_THUMB, WR_LITTLE = 20.0, 35.0


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def blink(t, ph=0.0):
    bl = (t * 0.26 + ph) % 1.0
    return 0.06 if bl < 0.03 else (0.55 if bl < 0.045 else 1.0)


def idle(t, ph=0.0, look=(0.0, 0.0), smile=0.1, yaw=0.0, tilt=0.0, worry=0.0, brow=0.0, lean=0.0, sway=-5.0, **kw):
    """breathing, a slow weight shift, blinks, a head that drifts a little"""
    br = 0.5 + 0.5 * math.sin(t * 1.5 + ph * 5)
    ps = pose(breath=br, sway=sway + 2 * math.sin(t * 0.3 + ph * 3), lean=lean + 0.5 * math.sin(t * 0.22 + ph), look=look, smile=smile, worry=worry, brow=brow,
              head_yaw=yaw + 0.02 * math.sin(t * 0.41 + ph), head_tilt=tilt + 1.0 * math.sin(t * 0.36 + ph * 2), lid=blink(t, ph))
    ps.pony_sway = 5 * math.sin(t * 0.9 + ph)
    for k_, v in kw.items(): setattr(ps, k_, v)
    return ps


def _cfg(ps, who):
    ps.cfg = LOOKS[who]['cfg']; return ps.cfg


def _to_model(ps, pt, x, ground, s):
    k = s * ps.cfg.get('bw', 1.0); return ((pt[0] - x) / k, (pt[1] - ground) / s)


def _to_screen(ps, pt, x, ground, s):
    k = s * ps.cfg.get('bw', 1.0); return (x + pt[0] * k, ground + pt[1] * s)


def _ik_all(sh, tgt, side):
    L1, L2 = PN.UPPER, PN.FORE
    dx, dy = tgt[0] - sh[0], tgt[1] - sh[1]; dist = math.hypot(dx, dy) or 1e-6
    dmin = math.sqrt(L1 * L1 + L2 * L2 - 2 * L1 * L2 * math.cos(math.radians(180 - ELBOW_MAX))); dc = max(dmin, min(L1 + L2 - 0.5, dist))
    ux, uy = dx / dist, dy / dist; tgt = (sh[0] + ux * dc, sh[1] + uy * dc)
    a = (L1 * L1 - L2 * L2 + dc * dc) / (2 * dc); h = math.sqrt(max(0.0, L1 * L1 - a * a)); out = []
    for sg in (-1, 1):
        el = (sh[0] + ux * a - uy * h * sg, sh[1] + uy * a + ux * h * sg)
        a1 = math.degrees(math.atan2(side * (el[0] - sh[0]), el[1] - sh[1])); a2 = math.degrees(math.atan2(side * (tgt[0] - el[0]), tgt[1] - el[1]))
        fo = (a2 - a1 + 180) % 360 - 180
        ok = UP_MIN <= a1 <= UP_MAX and abs(fo) <= ELBOW_MAX + 0.01
        out.append((el[1] + 0.35 * side * el[0] + (0 if ok else -1e4), a1, fo, tgt))
    return sorted(out, reverse=True)


def arm_to(ps, side, target, x, ground, s, who, bend=None):
    """puts the WRIST of arm `side` ('l' = the person's left arm, at screen right) on the screen point `target`; returns the point reached"""
    _cfg(ps, who); sd = 1 if side == 'l' else -1
    sols = _ik_all(PN.skel(ps)[side], _to_model(ps, target, x, ground, s), sd)
    if bend is not None: sols = sorted(sols, key=lambda q: (q[0] < -5e3, -bend * q[2]))
    _, up, fo, got = sols[0]
    if side == 'l': ps.l_up, ps.l_fore = up, fo
    else: ps.r_up, ps.r_fore = up, fo
    return _to_screen(ps, got, x, ground, s)


def _aim_hand(ps, side, ang, free=False):
    up, fo = (ps.l_up, ps.l_fore) if side == 'l' else (ps.r_up, ps.r_fore)
    want = (ang - up - fo + 180) % 360 - 180
    got = want if free else max(-WR_THUMB, min(WR_LITTLE, want))
    if side == 'l': ps.l_wrist = got
    else: ps.r_wrist = got
    return want - got


def place(ps, side, pt_hand, target, hand_ang, x, ground, s, who, iters=30, bend=None, wr=(-60.0, 70.0)):
    """IK so that the point pt_hand = (u, v) of the hand's frame lands on the screen point target. hand_ang: the direction the
    fingers point, degrees from straight down, + = out to that arm's side; None keeps the hand in line with the forearm.
    The wrist bends at most wr = (back, forward) degrees from the forearm's line. Returns the screen point reached."""
    _cfg(ps, who); tg = _to_model(ps, target, x, ground, s); sd = 1 if side == 'l' else -1; res = []
    for pick in ((0, 1) if bend is None else (0,)):
        w_ = tg
        for _ in range(iters):
            sols = _ik_all(PN.skel(ps)[side], w_, sd)
            if bend is not None: sols = sorted(sols, key=lambda q: (q[0] < -5e3, -bend * q[2]))
            sc, up, fo, got = sols[min(pick, len(sols) - 1)]
            if side == 'l': ps.l_up, ps.l_fore = up, fo
            else: ps.r_up, ps.r_fore = up, fo
            if hand_ang is None: setattr(ps, side + '_wrist', 0.0)
            else:
                want = (hand_ang - up - fo + 180) % 360 - 180; setattr(ps, side + '_wrist', max(wr[0], min(wr[1], want)))
            A = PN.arm_pts(ps, side); p = PN.hand_pt(ps, side, *pt_hand)
            w_ = (A['wr'][0] + 0.7 * (tg[0] - p[0]), A['wr'][1] + 0.7 * (tg[1] - p[1]))
        miss = math.hypot(p[0] - tg[0], p[1] - tg[1])
        res.append((sc < -5e3, miss > 0.5, pick, (getattr(ps, side + '_up'), getattr(ps, side + '_fore'), getattr(ps, side + '_wrist'))))
        if not res[-1][0] and not res[-1][1]: break
    best = min(res)
    setattr(ps, side + '_up', best[3][0]); setattr(ps, side + '_fore', best[3][1]); setattr(ps, side + '_wrist', best[3][2])
    fr = set(getattr(ps, 'front', ())); fr.add(side); ps.front = tuple(sorted(fr))
    return _to_screen(ps, PN.hand_pt(ps, side, *pt_hand), x, ground, s)


# ------------------------------------------------------------------------------------------------ what a hand holds
def _frame(hw, ang, ts, hs, nar):
    ca, sa = math.cos(ang), math.sin(ang)
    return lambda u, v: (hw[0] + hs * (u * ca - v * nar * ts * sa), hw[1] + hs * (u * sa + v * nar * ts * ca))


def _rod(c, a, b, w, col, sh, hi):
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1; nx, ny = -dy / L, dx / L
    if ny < 0: nx, ny = -nx, -ny
    mk = lambda col_, w_, a_=255: skia.Paint(AntiAlias=True, Color=skia.Color(int(col_[0]), int(col_[1]), int(col_[2]), a_), Style=skia.Paint.kStroke_Style, StrokeWidth=w_, StrokeCap=skia.Paint.kRound_Cap)
    c.drawLine(a[0], a[1], b[0], b[1], mk(col, w))
    c.drawLine(a[0] + nx * w * 0.3, a[1] + ny * w * 0.3, b[0] + nx * w * 0.3, b[1] + ny * w * 0.3, mk(sh, w * 0.34, 220))
    c.drawLine(a[0] - nx * w * 0.24, a[1] - ny * w * 0.24, b[0] - nx * w * 0.24, b[1] - ny * w * 0.24, mk(hi, w * 0.18, 200))


GRIP = (38.0, 0.0)                                          # the middle of a closed fist, in the hand's frame


def aed_case(c, top, k=1.0, ang=0.0):
    """the AED: a small bright case hanging from its handle. top = the middle of the handle bar (screen); k = scale"""
    c.save(); c.translate(*top); c.rotate(ang); c.scale(k, k)
    body = skia.Path(); body.addRoundRect(skia.Rect(-92, 34, 92, 200), 20, 20)
    q = skia.Path(body); q.offset(5, 8); c.drawPath(q, P((20, 10, 40), 80, MaskFilter=blur(7)))
    for sx in (-1, 1): c.drawLine(sx * 46, 0, sx * 52, 40, SP((40, 42, 56), 13))            # the handle's two posts
    shaded(c, body, (236, 78, 60), (180, 46, 52), sh=(6, 5), rimL=(255, 160, 130), rl=(-3, -3))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-70, 56, 70, 178), 12, 12), P((246, 240, 228)))
    hp = skia.Path(); hp.moveTo(0, 150); hp.cubicTo(-52, 112, -30, 74, 0, 100); hp.cubicTo(30, 74, 52, 112, 0, 150); c.drawPath(hp, P((236, 78, 60)))   # a heart with a bolt
    bl = skia.Path(); bl.addPoly([skia.Point(6, 92), skia.Point(-12, 124), skia.Point(0, 124), skia.Point(-7, 150), (skia.Point(14, 114)), skia.Point(2, 114)], True); c.drawPath(bl, P((255, 226, 110)))
    c.drawCircle(52, 162, 9, P((92, 190, 110))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-92, 110, -84, 140), 3, 3), P((60, 62, 76)))
    c.restore()


def _handle(c, hw, ang, ts, hs, nar, k=1.0):
    """the AED case's handle bar through the fist; the case hangs straight down from it"""
    W = _frame(hw, ang, ts, hs, nar); a_, b_ = W(GRIP[0], -58), W(GRIP[0], 58); m = W(*GRIP)
    aed_case(c, (m[0], m[1]), k * 0.9)
    _rod(c, (m[0] - 44 * k, m[1]), (m[0] + 44 * k, m[1]), 14 * k, (44, 46, 60), (24, 24, 36), (110, 116, 140))


def bottle(c, m, k=1.0, ang=0.0, kind='aspirin'):
    """a small medicine bottle, upright at m (its middle). aspirin: white with a mint label and a white cap; nitro: a tiny amber glass bottle"""
    c.save(); c.translate(*m); c.rotate(ang); c.scale(k, k)
    if kind == 'aspirin':
        b = skia.Path(); b.addRoundRect(skia.Rect(-25, -34, 25, 50), 8, 8); q = skia.Path(b); q.offset(3, 5); c.drawPath(q, P((20, 10, 40), 80, MaskFilter=blur(4)))
        shaded(c, b, (248, 246, 240), (198, 198, 214), sh=(5, 3)); c.drawRect(skia.Rect(-25, -14, 25, 30), P((63, 194, 169))); c.drawRect(skia.Rect(13, -14, 25, 30), P((40, 150, 136)))
        c.drawCircle(-4, 8, 11, P((250, 250, 246))); c.drawLine(-11, 8, 3, 8, SP((63, 194, 169), 3))
        cp = skia.Path(); cp.addRoundRect(skia.Rect(-23, -60, 23, -32), 6, 6); shaded(c, cp, (236, 238, 244), (176, 180, 200), sh=(5, 3))
        for j in range(-3, 4): c.drawLine(j * 6, -57, j * 6, -36, SP((190, 194, 212), 1.6))
    else:
        b = skia.Path(); b.addRoundRect(skia.Rect(-13, -20, 13, 30), 5, 5); q = skia.Path(b); q.offset(2, 4); c.drawPath(q, P((20, 10, 40), 80, MaskFilter=blur(3)))
        shaded(c, b, (176, 96, 40), (120, 60, 36), sh=(4, 2)); c.drawRect(skia.Rect(-13, -6, 13, 16), P((246, 240, 226))); c.drawLine(-8, 2, 6, 2, SP((120, 60, 36), 2)); c.drawLine(-8, 9, 2, 9, SP((120, 60, 36), 2))
        c.drawLine(-9, -16, -9, 26, SP((240, 170, 100), 2, 150))
        cp = skia.Path(); cp.addRoundRect(skia.Rect(-11, -36, 11, -19), 4, 4); shaded(c, cp, (244, 244, 240), (186, 186, 200), sh=(3, 2))
    c.restore()


def _bottle(c, hw, ang, ts, hs, nar):
    """the aspirin bottle upright in a fist: the cap shows above the index finger, the base below the little finger"""
    W = _frame(hw, ang, ts, hs, nar); m = W(GRIP[0] + 2, 0); a = math.degrees(ang)
    if math.cos(math.radians(a)) < 0: a += 180
    bottle(c, m, hs / 1.22, a)


def _nitro(c, hw, ang, ts, hs, nar):
    """Walt's small amber bottle upright in his fist: the cap above the index finger, the base below the little finger, the thumb in front"""
    W = _frame(hw, ang, ts, hs, nar); m = W(GRIP[0] + 2, 0); a = math.degrees(ang)
    if math.cos(math.radians(a)) < 0: a += 180
    bottle(c, (m[0], m[1]), hs / 1.22 * 1.9, a, 'nitro')


def _mic(c, hw, ang, ts, hs, nar):
    W = _frame(hw, ang, ts, hs, nar); m = W(GRIP[0] + 20, 2); mic_body(c, m, 1.04)


def _strap(col=(232, 120, 50)):
    """a wide bag strap running through the fist, down the chest from the shoulder"""
    def f(c, hw, ang, ts, hs, nar):
        pass                                                 # the strap itself is drawn by the scene under the hand (it runs from the shoulder to the bag)
    return f


def iv_bag(c, top, k=1.0, sway=0.0, drip=0.0):
    """a 500 mL IV bag hanging from the point `top`: a clear soft bag with fluid, a printed label, the port and a drip chamber"""
    c.save(); c.translate(*top); c.rotate(sway); c.scale(k, k)
    c.drawLine(0, 0, 0, 16, SP((200, 206, 220), 4))
    b = smooth_closed([(-34, 16), (34, 16), (40, 40), (40, 130), (22, 152), (-22, 152), (-40, 130), (-40, 40)])
    c.drawPath(b, P((226, 240, 250), 235)); fl = smooth_closed([(-39, 50), (39, 50), (40, 130), (22, 152), (-22, 152), (-40, 130)]); c.drawPath(fl, P((170, 214, 240), 240))
    c.drawPath(diffp(b, (5, 3)), P((140, 180, 214), 200)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-24, 62, 24, 112), 4, 4), P((250, 250, 250), 235))
    for j, w_ in enumerate((34, 26, 30)): c.drawLine(-17, 74 + j * 12, -17 + w_, 74 + j * 12, SP((90, 120, 170), 3))
    c.drawCircle(0, 9, 5, P((30, 40, 70)))
    c.drawRect(skia.Rect(-5, 152, 5, 166), P((200, 206, 220))); ch = skia.Path(); ch.addRoundRect(skia.Rect(-9, 166, 9, 204), 6, 6); c.drawPath(ch, P((236, 244, 250), 230)); c.drawRect(skia.Rect(-9, 190, 9, 204), P((170, 214, 240)))
    if drip > 0: c.drawCircle(0, 170 + 16 * drip, 2.6, P((150, 200, 236)))
    c.restore()
    a = math.radians(sway); return (top[0] - 204 * k * math.sin(a), top[1] + 204 * k * math.cos(a))


def _bag(ps):
    def f(c, hw, ang, ts, hs, nar):
        W = _frame(hw, ang, ts, hs, nar); m = W(*GRIP)
        ps.bag_out = iv_bag(c, (m[0], m[1] + 14), 1.15, getattr(ps, 'bag_sway', 0.0), getattr(ps, 'drip', 0.0))
        c.drawOval(skia.Rect(m[0] - 13, m[1] - 24, m[0] + 13, m[1] + 30), SP((200, 206, 220), 6))                 # the bag's hanger loop runs through the fist
    return f


def _handle_side(c, hw, ang, ts, hs, nar):
    """the AED case carried at the side, seen edge on: the handle runs front to back through the fist"""
    W = _frame(hw, ang, ts, hs, nar); m = W(*GRIP)
    c.save(); c.translate(m[0], m[1]); 
    body = skia.Path(); body.addRoundRect(skia.Rect(-34, 30, 34, 176), 12, 12); q = skia.Path(body); q.offset(4, 7); c.drawPath(q, P((20, 10, 40), 80, MaskFilter=blur(6)))
    c.drawLine(0, 0, 0, 34, SP((40, 42, 56), 16))
    shaded(c, body, (236, 78, 60), (180, 46, 52), sh=(5, 4), rimL=(255, 160, 130), rl=(-3, -3)); c.drawRect(skia.Rect(-34, 92, 34, 104), P((150, 36, 46))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-12, 84, 12, 112), 4, 4), P((60, 62, 76)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-15, -10, 15, 10), 9, 9), P((44, 46, 60)))
    c.restore()


ITEMS = dict(handle=_handle, handle_side=_handle_side, bottle=_bottle, mic=_mic, nitro=_nitro)


def hold(ps, side, kind):
    """wires what the hand holds; the model draws it under the fingers"""
    if kind == 'bag': setattr(ps, side + '_item', _bag(ps))
    elif kind in ITEMS: setattr(ps, side + '_item', ITEMS[kind])
    setattr(ps, side + '_hand', FIST)
    fr = set(getattr(ps, 'front', ())); fr.add(side); ps.front = tuple(sorted(fr))


def draw(c, who, ps, x, ground, s):
    L = LOOKS[who]
    for k, v in L.items():
        if k not in ('cfg', 'hs'): setattr(PN, k, v)
    ps.cfg = L['cfg']
    PN.draw(c, ps, x=x, ground=ground, s=s)


def hands_only(c, wrist, ang, s, side=1, who='priya', forearm=300.0, hand=None, sleeve=False, palm=False, item=None, nails=True):
    """a bare forearm and hand alone for a close shot (the same hand model). wrist: screen point; ang: the direction the fingers
    point (radians); side: +1 thumb on the clockwise side. Returns W(u, v), the hand's frame on the screen."""
    L = LOOKS[who]; SK, SH_, HI = L['SKIN'], L['SKIN_SH'], L['SKIN_HI']; hs = 1.22 * s; hp = dict(hand or PN.RELAX)
    nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (hp['curls'][2] - 0.05) / 0.5)))
    d = (math.cos(ang), math.sin(ang)); far = (wrist[0] - d[0] * forearm * s, wrist[1] - d[1] * forearm * s); hw = (wrist[0] + d[0] * 6 * s, wrist[1] + d[1] * 6 * s)
    cfg = L['cfg']; fa = limb(far, (wrist[0] + d[0] * 5 * s, wrist[1] + d[1] * 5 * s), 64 * cfg.get('armw', 1.0) * s, 45 * cfg.get('wristw', 1.0) * s, bulge=5 * s, bu=0.3, side=-side)
    q_ = skia.Path(fa); q_.offset(6 * s, 9 * s); c.drawPath(q_, P((20, 12, 40), 70, MaskFilter=blur(8 * s ** 0.5)))
    shaded(c, fa, SK, SH_, sh=(6 * s, 5 * s), rimL=HI, rl=(-3 * s, -3 * s))
    if sleeve:
        T_, TS, TH = L['TOP'], L['TOP_SH'], L['TOP_HI']
        c.save(); c.translate(far[0] + d[0] * 30 * s, far[1] + d[1] * 30 * s); c.rotate(math.degrees(ang)); c.scale(s, s)
        band = skia.Path(); band.addRoundRect(skia.Rect(-90, -40, 15, 40), 12, 12); c.drawPath(band, P(mix(T_, TH, 0.22))); c.drawLine(12, -36, 12, 36, SP(TS, 3, 150)); c.restore()
    if item: item(c, hw, ang, side, hs, nar)
    H.hand(c, hw, ang, side, hs, skin=SK, shade=SH_, hi=HI, light=PN.LIGHT, narrow=nar, palm=palm, nails=nails and not palm, **hp)
    return _frame(hw, ang, side, hs, nar)


blend = H.blend
blend_hand = H.blend


def place_low(ps, side, pt_hand, target, hand_ang, x, ground, s, who):
    """place(), taking of the two elbow solutions the one with the elbow low, by the person's side"""
    best = None
    for bd in (1, -1):
        got = place(ps, side, pt_hand, target, hand_ang, x, ground, s, who, bend=bd); ey = PN.arm_pts(ps, side)['el'][1]
        if best is None or ey > best[0]: best = (ey, getattr(ps, side + '_up'), getattr(ps, side + '_fore'), getattr(ps, side + '_wrist'), got)
    setattr(ps, side + '_up', best[1]); setattr(ps, side + '_fore', best[2]); setattr(ps, side + '_wrist', best[3])
    return best[4]
