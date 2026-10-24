"""LevlPrep Short: why bent knees make a landing soft (AP Physics 1, impulse and momentum). Vertical 1080x1920, 30 fps.

Story: a sunny school courtyard. The girl (traced turnaround, code drawn: front and three quarter views as posed models,
side view as the motion capture rig) faces us, turns, and jumps (CMU 13_11). The first landing is keyed with the knees
locked (labelled, illustrative): the hips stop dead, a jolt, a force meter slams into the red, a red X. Rewind. The
same jump lands for real (recorded), knees bending, and the meter stays far lower. A slow motion replay shows the
momentum arrow (vertical part, 2.3 m/s down) shrinking to zero as she stops. Card: change in momentum = net force x
time. Replays of both landings with a stopwatch and a live force time graph: locked (illustrative spike, about 30 ms
to the peak) and bent (computed from the recorded motion, F = m(g + a) from the low pass filtered centre of mass).
Same shaded area above the mg line, way smaller peak. She turns back to us for the water balloon question.

MOTIONS (for the accuracy check):
1 Jump: recorded human forward jump; flight about 0.5 s; vertical speed at touchdown about 2.3 m/s.
2 Locked landing (keyed): from touchdown the hips are stopped over about 60 ms (a few cm), legs stay straight, the
  body jolts; the force curve for it is labelled illustrative, its area above mg equals the recorded one.
3 Bent landing (recorded): the centre of mass stops about 0.19 s after touchdown with the knees deeply bent, peak
  ground force about 2.7 x body weight; then she stands back up.
4 Force arrow at the feet = ground force F = m(g + a), a from the filtered CoM; weight mg at the CoM; momentum arrow
  is the vertical part of the CoM velocity.
"""
import sys, math, json, subprocess, os
import numpy as np, skia
from PIL import Image
sys.path.insert(0, '/home/claude/runner'); sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig')
sys.path.insert(0, '/home/claude/short'); sys.path.insert(0, '/home/claude/jump'); sys.path.insert(0, '/home/claude/jump/side')
import model, partrig, perf, phys
import mocap_perf as MP
import layout as L
from layout import smooth, col, TEAL, YELLOW, CORAL, WHITE, GREEN
import world as WLD, views, timing
from scipy.signal import butter, filtfilt

FPS = 30
W_, H_ = 1080, 1920
CS = 0.2                     # rig px -> world px
X0 = 405.0                   # world x of the rig origin
GREY = (210, 214, 226)
OUT = '/home/claude/jump/out'
HZ = 60
PK_STIFF = 9.0               # illustrative locked knee peak (x mg)


def lerp(a, b, u):
    return a + (b - a) * u


# ------------------------------------------------------------------ drawing helpers (house style, as in the sprint Short)
def arrow(c, p0, p1, color, w=15, head=42, a=1.0):
    p0, p1 = np.array(p0, float), np.array(p1, float)
    d = p1 - p0; Ln = np.linalg.norm(d)
    if a <= 0.01 or Ln < 3:
        return
    u = d / Ln; n = np.array([-u[1], u[0]])
    hd = min(head, Ln * 0.6)
    base = p1 - u * hd
    path = skia.Path(); path.moveTo(*p1); path.lineTo(*(base + n * hd * 0.62)); path.lineTo(*(base - n * hd * 0.62)); path.close()
    for widen, colr, al in ((7, (8, 10, 24), 0.55), (0, color, 1.0)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=w + widen, StrokeCap=skia.Paint.kRound_Cap, Style=skia.Paint.kStroke_Style)
        c.drawLine(*p0, *(base + u * 4), pa)
        pf = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al))
        if widen:
            pf.setStyle(skia.Paint.kStrokeAndFill_Style); pf.setStrokeWidth(widen); pf.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawPath(path, pf)


def text(c, s, x, y, size, color, a=1.0, center=False, font=None):
    if a <= 0.01:
        return
    f = skia.Font(font or L.BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias)
    if center:
        x -= f.measureText(s) / 2
    c.drawString(s, x, y, f, skia.Paint(AntiAlias=True, Color=col(color, 255 * a)))


def tw(s, size):
    return skia.Font(L.BLACK, size).measureText(s)


def card(c, x, y, w, h, a, r=26):
    rr = skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), r, r)
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(212 * a))))
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(28 * a)), Style=skia.Paint.kStroke_Style, StrokeWidth=2))


def rewind_fx(c, t, a):
    if a <= 0.01:
        return
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=skia.Color(20, 30, 70, int(70 * a))))
    rng = np.random.default_rng(int(t * 60))
    for y in range(0, H_, 6):
        c.drawRect(skia.Rect(0, y, W_, y + 2), skia.Paint(Color=skia.Color(255, 255, 255, int(14 * a))))
    for _ in range(3):
        y = rng.uniform(300, 1700)
        c.drawRect(skia.Rect(0, y, W_, y + rng.uniform(4, 16)), skia.Paint(Color=skia.Color(255, 255, 255, int(55 * a))))
    p = skia.Path(); x0, y0 = 70, 590
    for k in range(2):
        p.moveTo(x0 + 46 + k * 46, y0); p.lineTo(x0 + k * 46, y0 + 30); p.lineTo(x0 + 46 + k * 46, y0 + 60); p.close()
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(235 * a))))
    text(c, 'REWIND', 70, 690, 40, WHITE, a)


def x_stamp(c, x, y, s, a):
    if a <= 0.01:
        return
    for widen, colr in ((12, (20, 6, 10)), (0, CORAL)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=30 + widen, StrokeCap=skia.Paint.kRound_Cap, Style=skia.Paint.kStroke_Style)
        c.drawLine(x - 80 * s, y - 80 * s, x + 80 * s, y + 80 * s, pa)
        c.drawLine(x - 80 * s, y + 80 * s, x + 80 * s, y - 80 * s, pa)


def pill(c, txt, x, y, color, size, a):
    """Small status pill at the top left (SLOW MOTION, REPLAY...)."""
    if a <= 0.01:
        return
    w = tw(txt, size)
    r = skia.RRect.MakeRectXY(skia.Rect(x, y, x + w + 52, y + size * 2), size, size)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(200 * a))))
    text(c, txt, x + 26, y + size * 1.38, size, color, a)


def stopwatch(c, x, y, R, secs, running, colr, a, label=None):
    """Dial + hand (one turn = 0.4 s) + the time in seconds."""
    if a <= 0.01:
        return
    card(c, x - R - 30, y - R - 70, 2 * R + 60, 2 * R + 160, a, r=30)
    c.drawCircle(x, y, R, skia.Paint(AntiAlias=True, Color=col(WHITE, 235 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=7))
    for k in range(8):
        ang = k / 8 * 2 * math.pi
        c.drawLine(x + math.sin(ang) * R * 0.78, y - math.cos(ang) * R * 0.78, x + math.sin(ang) * R * 0.9, y - math.cos(ang) * R * 0.9,
                   skia.Paint(AntiAlias=True, Color=col(WHITE, 180 * a), StrokeWidth=4))
    sweep = secs / 0.4 * 360
    if sweep > 0.5:
        p = skia.Path(); p.moveTo(x, y); p.arcTo(skia.Rect(x - R * 0.72, y - R * 0.72, x + R * 0.72, y + R * 0.72), -90, sweep, False); p.close()
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(colr, 150 * a)))
    ang = secs / 0.4 * 2 * math.pi
    c.drawLine(x, y, x + math.sin(ang) * R * 0.8, y - math.cos(ang) * R * 0.8, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=7, StrokeCap=skia.Paint.kRound_Cap))
    c.drawCircle(x, y, 9, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a)))
    text(c, f'{secs:.2f} s', x, y + R + 62, 44, colr if not running else WHITE, a, center=True)
    if label:
        text(c, label, x, y - R - 26, 26, colr, a, center=True)


def balloon(c, x, y, s, a):
    """A water balloon icon: a blue drop with a knot and a highlight."""
    if a <= 0.01:
        return
    p = skia.Path()
    p.moveTo(x, y - 46 * s)
    p.cubicTo(x + 42 * s, y - 46 * s, x + 44 * s, y + 10 * s, x + 6 * s, y + 38 * s)
    p.lineTo(x - 6 * s, y + 38 * s)
    p.cubicTo(x - 44 * s, y + 10 * s, x - 42 * s, y - 46 * s, x, y - 46 * s); p.close()
    sh = skia.GradientShader.MakeLinear([skia.Point(x - 40 * s, y - 40 * s), skia.Point(x + 40 * s, y + 40 * s)], [col((120, 200, 255), 255 * a), col((40, 110, 220), 255 * a)])
    c.drawPath(p, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawCircle(x, y + 44 * s, 7 * s, skia.Paint(AntiAlias=True, Color=col((40, 110, 220), 255 * a)))
    c.drawOval(skia.Rect(x - 26 * s, y - 34 * s, x - 10 * s, y - 8 * s), skia.Paint(AntiAlias=True, Color=col(WHITE, 150 * a)))


# ------------------------------------------------------------------ the force curves
class Curves:
    """Recorded (bent) ground force from the motion, and the illustrative locked knee pulse with the same area above mg."""
    def __init__(self, ref, TD, pxm):
        tau, cy = ref['tau'], ref['cy']
        b, a = butter(2, 8 / (120 / 2))
        yf = filtfilt(b, a, cy)
        v = np.gradient(yf, 1 / 120); acc = np.gradient(v, 1 / 120)          # rig y is down
        g = 9.81 * pxm
        self.tau = tau
        self.F = np.maximum(0.0, 1 - acc / g)                                 # F / mg = 1 + a_up / g
        self.vy = v / pxm                                                    # m/s, down +
        # the stop: vertical CoM velocity reaches 0 after touchdown
        i_td = int(np.searchsorted(tau, TD))
        i_st = i_td + int(np.argmax(self.vy[i_td:] <= 0))
        self.TD, self.STOP = TD, float(tau[i_st])
        i_a = int(np.argmin(cy))
        self.T0 = float(tau[i_a + int(np.argmax(self.F[i_a:] > 0.25))])     # force starts rising (graph and stopwatch zero)
        # area above mg from the first crossing above mg to the stop = v at that crossing / g
        i_c = i_td - 20 + int(np.argmax(self.F[i_td - 20:] > 1))
        self.C = float(tau[i_c])
        self.area = float(np.trapezoid(self.F[i_c:i_st + 1] - 1, tau[i_c:i_st + 1]))
        self.v_td = float(self.vy[i_c])
        self.peak = float(self.F[i_c:i_st + 30].max())
        self.D = 2 * self.area / (PK_STIFF - 1)
        print('contact (force rising) at', round(self.T0, 3))                               # sin^2 pulse with the same area
        print(f'touchdown {TD:.3f} stop {self.STOP:.3f} ({self.STOP - TD:.3f} s)  v_td {self.v_td:.2f} m/s  peak {self.peak:.2f} mg  '
              f'area {self.area:.3f} (v/g {self.v_td / 9.81:.3f})  stiff pulse {self.D * 1000:.0f} ms')

    def bent(self, s):
        """F/mg at s seconds after contact (recorded); 0 before contact."""
        return float(np.interp(self.T0 + s, self.tau, self.F)) if s >= 0 else 0.0

    def stiff(self, s):
        if s < 0:
            return 0.0
        if s < self.D:
            return 1 + (PK_STIFF - 1) * math.sin(math.pi * s / self.D) ** 2
        return 1.0

    def bent_vy(self, s):
        return float(np.interp(self.TD + s, self.tau, self.vy))

    def stop_s(self):
        return self.STOP - self.T0


# ------------------------------------------------------------------ build
def build(tl, out=None, stills=(), sim_only=False):
    k = tl.k
    TK = MP.Take('13_11', near='Left'); print('repaired', perf.repair(TK))
    rig, spec, joints, radius = model.build()
    rig.springs = {'n_hand': dict(freq=5, damp=0.7), 'f_hand': dict(freq=5, damp=0.7)}
    clk = {'tau': 1.0, 'stiff': False}
    TAU_END = TK.nf / TK.fps - 0.05

    def performer():
        P = MP.MocapPerformer(rig, spec, lambda t: [('a', TK, clk['tau'], 1.0)], ground_take=TK)
        P.extra = lambda t: extra(clk['tau'])
        return P

    # ---------------- reference pass (real time, bent landing) at 120 Hz: CoM, root, trunk angle per tau
    ref = dict(tau=[], cy=[], cx=[], rx=[], ry=[], ang=[], lock=[])
    extra = lambda tau: {}
    clk['stiff'] = False
    P = performer()
    for j in range(int((TAU_END - 0.7) * 120)):
        tau = 0.7 + j / 120
        clk['tau'] = tau
        W = P.pose(j / 120)
        cm = phys.com(rig, W)
        ref['tau'].append(tau); ref['cy'].append(cm[1]); ref['cx'].append(cm[0])
        ref['rx'].append(P.root[0]); ref['ry'].append(P.root[1]); ref['ang'].append(rig.world_angle(W, 'body'))
        ref['lock'].append(max(P.lock_w['near'], P.lock_w['far']))
    ref = {kk: np.array(v) for kk, v in ref.items()}
    SOLE = P.ground + model.ANKLE_H
    # flight: both feet off; touchdown = first contact after the apex
    apex = int(np.argmin(ref['cy']))
    TD = float(ref['tau'][apex + int(np.argmax(ref['lock'][apex:] > 0.3))])
    takeoff = float(ref['tau'][apex - int(np.argmax(ref['lock'][apex::-1] > 0.3))])
    fl = (ref['tau'] > takeoff + 0.04) & (ref['tau'] < TD - 0.04)
    g_px = 2 * np.polyfit(ref['tau'][fl], ref['cy'][fl], 2)[0]
    pxm = g_px / 9.81
    print('takeoff', round(takeoff, 3), 'apex', round(float(ref['tau'][apex]), 3), 'touchdown', round(TD, 3), 'px per m', round(pxm))
    CV = Curves(ref, TD, pxm)
    STAND = float(ref['tau'][apex + int(np.argmax((ref['tau'][apex:] > CV.STOP) & (np.abs(np.gradient(ref['cy'])[apex:]) < 0.02)))])
    STAND = min(max(STAND, CV.STOP + 0.6), TAU_END - 0.1)
    print('standing again at tau', round(STAND, 2), 'take ends', round(TAU_END, 2))

    def R(name, tau):
        return float(np.interp(tau, ref['tau'], ref[name]))

    # locked knee landing: keep the hips where they were at touchdown (a few cm of give over the pulse), trunk upright
    def extra_stiff(tau):
        if not clk['stiff'] or tau <= TD:
            return {}
        s = tau - TD
        give = 0.035 * pxm * smooth(s / CV.D)                                # ~3.5 cm of give
        jolt = 7.0 * math.exp(-s * 18) * math.sin(s * 70) * smooth(s / 0.02)
        dy = (R('ry', TD) + give + jolt) - R('ry', tau)
        dx = (R('rx', TD) + 0.02 * pxm * smooth(s / CV.D)) - R('rx', tau)
        sp = -(R('ang', tau) - R('ang', TD)) / P.f
        return dict(dx=dx, dy=dy, spine=sp, head=-0.6 * sp)

    def extra_idle(tau):
        return {}
    extra = lambda tau: extra_stiff(tau)


    # ---------------- ponytail: damped spring about the tie, driven by the felt gravity at the head, per tau (real time)
    def pony_track(stiff):
        clk['stiff'] = stiff
        Pp = performer(); hs = []
        for j in range(int((TAU_END - 0.7) * 120)):
            clk['tau'] = 0.7 + j / 120; Wp = Pp.pose(j / 120); hs.append(rig.joint(Wp, 'head'))
        hs = np.array(hs)
        bb, aa = butter(2, 12 / 60)
        hy = filtfilt(bb, aa, hs[:, 1]); hx = filtfilt(bb, aa, hs[:, 0])
        ay = np.gradient(np.gradient(hy, 1 / 120), 1 / 120); ax_ = np.gradient(np.gradient(hx, 1 / 120), 1 / 120)
        geff = np.clip(1 - ay / g_px, -0.5, 3.5)                       # 1 standing, 0 in flight, >1 on landing
        th, w, out_ = 0.0, 0.0, []
        wn, zeta = 2 * math.pi * 2.0, 0.28
        for j in range(len(hs)):
            target = float(np.clip(0.30 * (1 - geff[j]) - 0.10 * ax_[j] / g_px, -0.5, 0.6))
            w += (-(wn ** 2) * (th - target) - 2 * zeta * wn * w) / 120; th += w / 120
            out_.append(th)
        clk['stiff'] = False
        return np.array(out_)
    PONY = dict(tau=0.7 + np.arange(int((TAU_END - 0.7) * 120)) / 120)
    PONY['bent'] = pony_track(False); PONY['stiff'] = pony_track(True)

    # ---------------- times
    T = {}
    T['turn0'] = 0.38; T['turn1'] = 0.56                                   # front -> 3q -> side
    T['go'] = T['turn1']
    TAU_GO = 1.05
    T['td1'] = T['go'] + (TD - TAU_GO)                                      # locked landing (real time)
    T['hit'] = k('hook', 'hit')
    T['rw0'] = max(T['td1'] + 1.25, tl.beat_span('hook')[1] + 0.05)
    T['rw1'] = T['rw0'] + 0.55
    TAU_B = 1.5
    T['b0'] = max(T['rw1'], k('why', 'same') - (TD - TAU_B))                # bent landing, real time
    T['td2'] = T['b0'] + (TD - TAU_B)
    # slow motion replay with the momentum arrow
    T['c0'] = tl.beat_span('same')[0] - 0.15
    T['c_td'] = k('same', 'ground')
    T['c_st'] = k('same', 'you', end=True) + 0.1
    T['c1'] = k('same', 'same') + 0.9
    T['dp'] = k('same', 'same')
    T['imp0'] = tl.beat_span('impulse')[0] - 0.1
    T['F'] = k('impulse', 'force'); T['dt'] = k('impulse', 'time')
    # replays on the graph: locked, then bent
    T['g0'] = tl.beat_span('stiff')[0] - 0.2
    T['d_td'] = k('stiff', 'instantly')
    T['spike'] = k('stiff', 'spikes')
    T['e0'] = tl.beat_span('bent')[0] - 0.15
    T['e_td'] = k('bent', 'stretches')
    T['e_st'] = k('bent', 'out', end=True) + 0.15
    T['peak'] = k('bent', 'peak')
    T['area'] = k('graph', 'same'); T['small'] = k('graph', 'smaller')
    T['ask0'] = tl.beat_span('ask')[0] - 0.1
    T['bal'] = k('ask', 'balloon')
    T['back'] = k('ask', 'back'); T['still'] = k('ask', 'still')
    T['end'] = tl.end + 0.4
    DUR = T['end'] + 1.8

    # ---------------- mocap clock per segment: (tau, stiff, track id)
    def slowmo(t, t0, tau0, t_td, t_st, t1, tau1):
        """tau(t): ease from tau0 to touchdown at t_td, touchdown to the stop at t_st, then on to tau1 at t1."""
        if t < t_td:
            u = (t - t0) / (t_td - t0); return lerp(tau0, TD, u)
        if t < t_st:
            u = (t - t_td) / (t_st - t_td); return lerp(TD, CV.STOP, u)
        u = min((t - t_st) / max(t1 - t_st, 1e-3), 1.0); return lerp(CV.STOP, tau1, 1 - (1 - u) ** 2)

    def clock(t):
        if t < T['go']:
            return None
        if t < T['rw0']:
            return min(TAU_GO + (t - T['go']), TAU_END), True, 'A'
        if t < T['rw1']:
            return 'rewind'
        if t < T['c0']:
            return min(TAU_B + max(0.0, t - T['b0']), STAND), False, 'B'
        if t < T['imp0']:
            return min(slowmo(t, T['c0'], TD - 0.2, T['c_td'], T['c_st'], T['c1'], STAND), STAND), False, 'C'
        if t < T['g0']:
            return STAND, False, 'C'
        if t < T['e0']:
            # locked: slow toward touchdown, very slow through the pulse so the spike can be seen forming, then on
            if t < T['d_td']:
                tau = lerp(TD - 0.16, TD, (t - T['g0']) / (T['d_td'] - T['g0']))
            elif t < T['d_td'] + 0.75:
                tau = TD + CV.D * (t - T['d_td']) / 0.75
            else:
                tau = TD + CV.D + 0.15 * (t - T['d_td'] - 0.75)
            return min(tau, TD + 0.5), True, 'D'
        if t < T['ask0']:
            return min(slowmo(t, T['e0'], TD - 0.16, T['e_td'], T['e_st'], T['ask0'] - 0.5, STAND), STAND), False, 'E'
        return STAND, False, 'E'

    # ---------------- pass 1: simulate every 1/60 s
    sim = []
    perfs = {}
    n60 = int(DUR * HZ) + 2
    seg_frames = {}
    for i in range(n60):
        t = i / HZ
        ck = clock(t)
        if ck is None or (t >= T['ask0'] + 0.62):
            sim.append(dict(mode='view', t=t)); continue
        if ck == 'rewind':
            # play the locked landing back to the crouch
            src = seg_frames['A']
            u = (t - T['rw0']) / (T['rw1'] - T['rw0'])
            j_end = len(src) - 1
            j_beg = next(j for j, s_ in enumerate(src) if s_['tau'] >= TAU_B)
            j = int(round(lerp(j_end, j_beg, smooth(u) * 0.3 + 0.7 * u)))
            s_ = dict(src[j]); s_['mode'] = 'rew'
            sim.append(s_); continue
        tau, stiff, seg = ck
        if seg not in perfs:
            clk['stiff'] = stiff
            perfs[seg] = performer()
            pre0 = 0.7                                       # pre roll unseen from the reference start (same root path, settled locks)
            for j in range(int((tau - pre0) * 120)):
                clk['tau'] = pre0 + j / 120; perfs[seg].pose(j / 120)
        P = perfs[seg]
        clk['tau'] = tau; clk['stiff'] = stiff
        W = P.pose(t)
        com = phys.com(rig, W)
        pony_th = float(np.interp(tau, PONY['tau'], PONY['stiff' if stiff else 'bent']))
        s_ = dict(mode='mocap', W=W, x=P.x, tau=tau, stiff=stiff, seg=seg, com=com, pony=pony_th, locks=dict(P.lock_w))
        sim.append(s_)
        seg_frames.setdefault(seg, []).append(s_)

    # ---------------- camera (world px): targets per part, eased; cuts snap
    def to_world(p):
        return np.array([X0 + CS * p[0], WLD.FEET_Y + CS * (p[1] - SOLE)])

    ROOT_REST = to_world((R('rx', TAU_GO), 0))[0]
    VIEW_X1 = ROOT_REST                                              # front view stands where the rig stands
    VIEW_X2 = to_world((R('rx', STAND), 0))[0]

    def cam_target(t, s):
        hipx = to_world(s['W']['body'][2])[0] if s['mode'] in ('mocap', 'rew') else (VIEW_X1 if t < 1 else VIEW_X2)
        if t < T['c0']:
            z = 4.4; cx = lerp(470, hipx, 0.4); feet_scr = 1385
        elif t < T['imp0']:
            z = 4.9; cx = hipx - 25; feet_scr = 1380
        elif t < T['g0']:
            z = 3.3; cx = hipx; feet_scr = 1400
        elif t < T['ask0'] + 0.3:
            z = 3.0; cx = hipx - 10; feet_scr = 1395
        else:
            z = 4.2; cx = hipx; feet_scr = 1385
        cy = WLD.FEET_Y - (feet_scr - 960) / z
        return np.array([cx, cy, z])

    cams = []
    cam = None
    cut_times = [T['c0'], T['g0'], T['e0']]
    for i, s in enumerate(sim):
        t = i / HZ
        want = cam_target(t, s)
        if cam is None or any(abs(t - ct) < 0.5 / HZ for ct in cut_times):
            cam = want.copy()
        else:
            cam = cam + (want - cam) * np.array([0.07, 0.06, 0.06])
        cams.append(cam.copy())
    # camera shake on the locked landing
    for i in range(len(cams)):
        t = i / HZ
        for t_hit, amp in ((T['td1'], 2.2), ):
            if 0 <= t - t_hit < 0.6:
                e = math.exp(-(t - t_hit) * 9) * amp
                cams[i] = cams[i] + np.array([e * math.sin(t * 95), e * math.cos(t * 77), 0])

    if sim_only:
        return dict(T=T, DUR=DUR, CV=CV, sim=sim, cams=cams)

    # ---------------- pass 2: render at 30 fps
    Wd = WLD.World()
    VF, VQ = views.View('front'), views.View('q3')
    proc = None
    if out:
        proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W_}x{H_}',
                                 '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16',
                                 '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    frames = int(DUR * FPS)
    chunks = tl.chunks(3)
    titles = [
        (0.0, T['rw0'], [[('Land with', WHITE)], [('LOCKED KNEES?', CORAL)]]),
        (T['rw1'], T['c0'] + 0.2, [[('Bend your knees:', WHITE)], [('SOFT LANDING', TEAL)]]),
        (T['c0'] + 0.2, T['imp0'], [[('The ground has to', WHITE)], [('STOP YOU', YELLOW)]]),
        (T['imp0'], T['g0'], [[('Change in momentum', WHITE)], [('= FORCE × TIME', YELLOW)]]),
        (T['g0'], T['e0'], [[('Locked: tiny time,', WHITE)], [('HUGE FORCE', CORAL)]]),
        (T['e0'], T['area'] - 0.1, [[('Bent: more time,', WHITE)], [('SMALLER FORCE', TEAL)]]),
        (T['area'] - 0.1, T['ask0'], [[('Same area.', WHITE)], [('WAY SMALLER PEAK', TEAL)]]),
        (T['ask0'], T['end'], [[('Catching a', WHITE), (' water balloon?', WHITE)]]),
    ]
    blinks = (1.4, 4.9, 9.1, 13.4, 19.8, 24.2, 26.6)
    sounds = []

    def snd(name, t, gain):
        sounds.append((name, round(t, 3), gain))
    snd('swish', T['turn0'], 0.35); snd('swish', T['go'] + (takeoff - TAU_GO) - 0.05, 0.5)
    snd('thud', T['td1'], 0.9); snd('wrong', T['td1'] + 0.35, 0.4)
    snd('rewind', T['rw0'], 0.6)
    snd('swish', T['b0'] + (takeoff - TAU_B) - 0.05, 0.45); snd('soft', T['td2'], 0.7)
    snd('swish', T['c0'], 0.35); snd('soft_slow', T['c_td'], 0.6); snd('check', T['dp'], 0.45)
    snd('shimmer', T['F'], 0.4)
    snd('swish', T['g0'], 0.35); snd('thud_slow', T['d_td'], 0.7); snd('pat', T['spike'], 0.4)
    snd('swish', T['e0'], 0.35); snd('soft_slow', T['e_td'], 0.6); snd('check', T['e_st'], 0.4)
    snd('shimmer', T['area'], 0.45); snd('pat', T['small'], 0.4)
    snd('swish', T['ask0'], 0.35); snd('pat', T['back'], 0.5); snd('pat', T['still'], 0.5)

    # graph geometry (screen)
    GX0, GY0, GW, GH = 150, 500, 840, 300           # plot box (axes origin at bottom left)
    S_MAX = 0.40                                      # seconds after touchdown on the axis
    F_MAX = 10.0

    def gpt(s, f):
        return np.array([GX0 + (s + 0.04) / (S_MAX + 0.04) * GW, GY0 + GH - min(f, F_MAX) / F_MAX * GH])

    def curve_path(fn, s0, s1, closed_to_mg=False, n=160):
        p = skia.Path()
        ss = np.linspace(s0, s1, n)
        for j, s in enumerate(ss):
            q = gpt(s, fn(s))
            (p.moveTo if j == 0 else p.lineTo)(*q)
        return p

    def area_path(fn, s0, s1, n=160):
        p = skia.Path(); ss = np.linspace(s0, s1, n)
        p.moveTo(*gpt(s0, 1.0))
        for s in ss:
            p.lineTo(*gpt(s, max(fn(s), 1.0)))
        p.lineTo(*gpt(s1, 1.0)); p.close()
        return p

    C_S0 = CV.C - TD                                  # bent: first time above mg
    last_frame = None
    gaps = 0
    peak_hold = {'v': 0.0}
    for fi in range(frames):
        t = fi / FPS
        if stills and not out and fi not in stills and not (t >= T['end'] and last_frame is None):
            continue
        i = min(int(round(t * HZ)), len(sim) - 1)
        s = sim[i]
        cx, cy, z = cams[i]
        cam = (cx, cy, z)
        surf = skia.Surface(W_, H_); cv = surf.getCanvas()
        Wd.draw(cv, t, cam, ref_cx=480)
        a_px = z * CS
        # ---- the girl
        frozen = False
        rig.blink = 1.0 if (any(b <= t < b + 0.12 for b in blinks) and not frozen) else 0.0
        com_s = feet_s = None
        if s['mode'] == 'view' or (T['ask0'] <= t < T['ask0'] + 0.62 and s['mode'] != 'view'):
            pass
        if s['mode'] == 'view':
            front_time = t < T['turn0'] or t >= T['ask0'] + 0.62
            vx = VIEW_X1 if t < 1 else VIEW_X2
            p = WLD.World.to_screen(cam, (vx, WLD.FEET_Y))
            cv.drawOval(skia.Rect(p[0] - 120 * a_px / 0.8, p[1] - 12, p[0] + 120 * a_px / 0.8, p[1] + 12),
                        skia.Paint(AntiAlias=True, Color=skia.Color(60, 40, 20, 80), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9)))
            act = dict(breath=math.sin(t * 2.4), sway=0.012 * math.sin(t * 0.9), head=0.03 * math.sin(t * 0.7 + 1),
                       arm_l=0.03 * math.sin(t * 1.1), arm_r=-0.03 * math.sin(t * 1.1 + 0.4))
            if t >= T['ask0']:
                act['head'] = 0.06 * smooth((t - T['bal']) / 0.4) * (1 - 0.5 * smooth((t - T['back']) / 0.4))
            v = VF if front_time else VQ
            v.blink = rig.blink
            if t < T['turn0']:
                pass
            elif t < T['turn1']:
                v = VQ
            elif T['ask0'] <= t < T['ask0'] + 0.62:
                v = VQ
            v.blink = rig.blink
            v.draw(cv, p[0], p[1], a_px, t, act)
        else:
            W = s['W']
            rig.pony = s['pony']
            xf = np.array([[a_px, 0, z * (X0 - cx) + W_ / 2], [0, a_px, z * (WLD.FEET_Y - CS * SOLE - cy) + H_ / 2], [0, 0, 1.0]])
            hip_s = xf @ np.array([*W['body'][2], 1.0])
            gy = xf[1, 2] + xf[1, 1] * SOLE
            com_w = s['com']
            air = smooth((SOLE - 60 - (com_w[1] + 0)) / 300) * 0
            height = max(0.0, (R('cy', s['tau']) - R('cy', TD)) * -1) if s['tau'] < TD + 0.05 else 0.0
            sha = 1 - min(height / 260, 0.7)
            cv.drawOval(skia.Rect(hip_s[0] - 105 * a_px / 0.8 * sha, gy - 11, hip_s[0] + 105 * a_px / 0.8 * sha, gy + 11),
                        skia.Paint(AntiAlias=True, Color=skia.Color(60, 40, 20, int(85 * sha)), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9)))
            if T['ask0'] <= t < T['ask0'] + 0.62 and t >= T['ask0'] + 0.25:
                # turning back to us: 3q view at the rig's spot
                VQ.blink = 0; VQ.draw(cv, hip_s[0], gy, a_px, t, dict(breath=math.sin(t * 2.4)))
            else:
                rig.draw(cv, W, xf)
            com_s = xf @ np.array([*com_w, 1.0])
            feet_s = np.array([hip_s[0] + 10 * a_px, gy])
            # stiff landing: red flash at the knees
            if s['stiff'] and s['tau'] > TD:
                fl_a = math.exp(-(s['tau'] - TD) * (6 if s['seg'] == 'A' else 3)) + (0.6 * math.exp(-max(0, t - T['hit']) * 4) if s['seg'] == 'A' and t > T['hit'] else 0)
                for sd in ('n', 'f'):
                    kn = xf @ np.array([*rig.joint(W, sd + '_sh'), 1.0])
                    an = xf @ np.array([*rig.joint(W, sd + '_ft'), 1.0])
                    for q, r in ((kn, 38), (an, 26)):
                        cv.drawCircle(q[0], q[1], r * (1 + 0.6 * (1 - min(fl_a, 1))), skia.Paint(AntiAlias=True, Color=col(CORAL, 150 * min(fl_a, 1)),
                                                                                    MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14)))
                # impact lines
                ia = math.exp(-(s['tau'] - TD) * (9 if s['seg'] == 'A' else 3))
                if ia > 0.02:
                    for kk in range(7):
                        ang = math.radians(-180 + kk * 30)
                        r0, r1 = 70, 70 + 90 * (1 - ia) + 40
                        cv.drawLine(feet_s[0] + math.cos(ang) * r0 * 1.6, gy + math.sin(ang) * r0 * 0.5,
                                    feet_s[0] + math.cos(ang) * r1 * 1.6, gy + math.sin(ang) * r1 * 0.5,
                                    skia.Paint(AntiAlias=True, Color=col(WHITE, 220 * ia), StrokeWidth=7, StrokeCap=skia.Paint.kRound_Cap))
        Wd.front(cv, t, cam)
        if t >= T['end'] and last_frame is None:
            last_frame = surf.makeImageSnapshot()

        # ---- hook / why: force meter (x body weight)
        m_a = smooth((t - 0.9) / 0.3) * (1 - smooth((t - T['c0'] + 0.15) / 0.25))
        if m_a > 0.01:
            if s['mode'] == 'mocap':
                sd_ = s['tau'] - TD
                fval = CV.stiff(sd_) if (s['stiff'] and sd_ > 0) else float(np.interp(s['tau'], CV.tau, CV.F))
            else:
                fval = 1.0
            if s['mode'] != 'mocap' or s['tau'] < TD - 0.05:
                peak_hold['v'] = fval                                   # live while she pushes off and flies
            else:
                peak_hold['v'] = max(fval, peak_hold['v'] * 0.997)      # hold the landing peak
            mx, my0, mh = 930, 1150, 480
            card(cv, mx - 70, my0 - mh - 110, 140, mh + 238, m_a)
            text(cv, 'FORCE', mx, my0 - mh - 70, 28, WHITE, m_a, center=True)
            text(cv, 'on legs', mx, my0 - mh - 38, 24, (200, 210, 230), m_a, center=True)
            cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(mx - 24, my0 - mh, mx + 24, my0), 14, 14), skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(40 * m_a))))
            hv = min(peak_hold['v'], F_MAX) / F_MAX * mh
            colr = CORAL if peak_hold['v'] > 5 else (YELLOW if peak_hold['v'] > 4 else TEAL)
            cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(mx - 24, my0 - hv, mx + 24, my0), 14, 14), skia.Paint(AntiAlias=True, Color=col(colr, 255 * m_a)))
            # body weight tick
            yb = my0 - 1 / F_MAX * mh
            cv.drawLine(mx - 34, yb, mx + 34, yb, skia.Paint(AntiAlias=True, Color=col(WHITE, 200 * m_a), StrokeWidth=3))
            text(cv, '1×', mx - 62, yb + 9, 24, WHITE, m_a * 0.8, center=True)
            text(cv, f'{peak_hold["v"]:.1f}×', mx, my0 + 50, 34, colr, m_a, center=True)
            # the locked peak stays marked once the bent landing plays
            if t > T['rw1']:
                yl = my0 - PK_STIFF / F_MAX * mh
                cv.drawLine(mx - 34, yl, mx + 34, yl, skia.Paint(AntiAlias=True, Color=col(CORAL, 230 * m_a), StrokeWidth=5,
                                                             PathEffect=skia.DashPathEffect.Make([10, 7], 0)))
                text(cv, 'locked', mx - 92, yl + 9, 24, CORAL, m_a, center=True)
            text(cv, '× body', mx, my0 + 82, 22, (200, 210, 230), m_a, center=True)
            text(cv, 'weight', mx, my0 + 106, 22, (200, 210, 230), m_a, center=True)
        # 'keyed' tag on the locked landing, red X
        if s['mode'] == 'mocap' and s['seg'] == 'A':
            L.chip(cv, 'locked knees (acted out)', 540, 590, GREY, 30, smooth((t - T['go']) / 0.3) * (1 - smooth((t - T['rw0'] + 0.1) / 0.2)))
            x_a = smooth((t - T['td1'] - 0.3) / 0.12) * (1 - smooth((t - T['rw0']) / 0.12))
            x_stamp(cv, 300, 760, 0.8 + 0.25 * math.exp(-max(0, t - T['td1'] - 0.3) * 9), x_a)
        if s['mode'] == 'mocap' and s['seg'] == 'B':
            L.chip(cv, 'real motion capture', 540, 590, GREY, 30, smooth((t - T['b0']) / 0.3) * (1 - smooth((t - T['c0'] + 0.1) / 0.2)))

        # ---- slow motion replay: momentum arrow shrinking to zero as she stops
        if T['c0'] <= t < T['imp0'] and s['mode'] == 'mocap':
            pill(cv, 'SLOW MOTION', 56, 560, YELLOW, 30, smooth((t - T['c0']) / 0.15) * (1 - smooth((t - T['c1']) / 0.3)))
            sd_ = s['tau'] - TD
            vy = CV.bent_vy(sd_) if s['tau'] > TD - 0.25 else 0.0
            pa = smooth((t - T['c0'] - 0.15) / 0.3) * (1 - smooth((t - T['imp0'] + 0.3) / 0.3))
            if s['tau'] > CV.STOP:
                vy = 0.0
            Lp = max(vy, 0.0) / 2.4 * 300 * z / 4.7
            cs = com_s[:2]
            if pa > 0.01:
                cv.drawCircle(*cs, 15, skia.Paint(AntiAlias=True, Color=col((8, 10, 24), 210 * pa)))
                cv.drawCircle(*cs, 10, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * pa)))
                arrow(cv, cs, cs + np.array([0, Lp]), YELLOW, w=16, head=44, a=pa)
                text(cv, f'{max(vy, 0):.1f} m/s', cs[0] - 60 - tw(f'{max(vy, 0):.1f} m/s', 46), cs[1] + 40, 46, YELLOW, pa)
                text(cv, 'momentum (vertical)', cs[0] - 60 - tw('momentum (vertical)', 30), cs[1] - 6, 30, WHITE, pa)
            a0_ = smooth((t - T['c_st']) / 0.2) * (1 - smooth((t - T['imp0'] + 0.2) / 0.2))
            L.chip(cv, 'stopped: p = 0', 540, 1120 + 0 * a0_, YELLOW, 40, a0_ * (1 - smooth((t - T['dp']) / 0.2)))
            ad = smooth((t - T['dp']) / 0.2) * (1 - smooth((t - T['imp0'] + 0.15) / 0.2))
            L.chip(cv, 'Δp: same for both landings', 540, 1120, YELLOW, 42, ad, scale=0.85 + 0.15 * smooth((t - T['dp']) / 0.2))

        # ---- the impulse card
        ia = smooth((t - T['imp0'] - 0.1) / 0.25) * (1 - smooth((t - T['g0'] + 0.1) / 0.25))
        if ia > 0.01:
            card(cv, 120, 470, 840, 290, ia, r=34)
            parts = [('Δp', YELLOW), (' = ', WHITE), ('F', CORAL if t >= T['F'] else WHITE), (' × ', WHITE), ('Δt', TEAL if t >= T['dt'] else WHITE)]
            L.rich_line(cv, parts, 540, 645, 120, ia, shadow=False)
            text(cv, 'F = net force (ground push minus weight)', 540, 722, 30, (200, 210, 230), ia, center=True)

        # ---- graph (locked, bent, then both with areas)
        ga = smooth((t - T['g0']) / 0.3) * (1 - smooth((t - T['ask0']) / 0.3))
        if ga > 0.01:
            card(cv, GX0 - 110, GY0 - 66, GW + 160, GH + 162, ga)
            ax = skia.Paint(AntiAlias=True, Color=col(WHITE, 220 * ga), StrokeWidth=4, StrokeCap=skia.Paint.kRound_Cap)
            cv.drawLine(GX0, GY0 - 10, GX0, GY0 + GH, ax); cv.drawLine(GX0, GY0 + GH, GX0 + GW, GY0 + GH, ax)
            text(cv, 'force (× mg)', GX0 - 60, GY0 - 26, 26, WHITE, ga)
            text(cv, 'time after touchdown', GX0 + GW - tw('time after touchdown', 26), GY0 + GH + 40, 26, WHITE, ga)
            for sv in (0.0, 0.1, 0.2, 0.3):
                q = gpt(sv, 0)
                cv.drawLine(q[0], q[1], q[0], q[1] + 10, ax)
                text(cv, f'{sv:.1f} s', q[0], q[1] + 40, 22, (200, 210, 230), ga, center=True)
            for fv in (5, 10):
                q = gpt(-0.04, fv)
                text(cv, f'{fv}', q[0] - 26, q[1] + 8, 22, (200, 210, 230), ga, center=True)
            # mg line
            q0, q1 = gpt(-0.04, 1), gpt(S_MAX, 1)
            cv.drawLine(q0[0], q0[1], q1[0], q1[1], skia.Paint(AntiAlias=True, Color=col(GREY, 230 * ga), StrokeWidth=4, PathEffect=skia.DashPathEffect.Make([14, 9], 0)))
            text(cv, 'mg', q1[0] + 10, q1[1] + 9, 26, GREY, ga)
            # how far each curve has drawn (follows the replay's mocap time)
            def drawn(seg_name, t_from):
                if s['mode'] == 'mocap' and s['seg'] == seg_name:
                    return s['tau'] - (TD if seg_name == 'D' else CV.T0)      # each curve starts at its own contact
                return S_MAX if t > t_from else -1
            sl = drawn('D', T['e0']); sb = drawn('E', T['ask0'])
            # shaded areas above mg (after both are drawn)
            sa = smooth((t - T['area']) / 0.35) * ga
            if sa > 0.01:
                cv.drawPath(area_path(CV.stiff, 0, CV.D), skia.Paint(AntiAlias=True, Color=col(CORAL, 110 * sa)))
                cv.drawPath(area_path(CV.bent, 0, CV.stop_s()), skia.Paint(AntiAlias=True, Color=col(TEAL, 110 * sa)))
                L.chip(cv, 'same area above mg', 760, GY0 + 95, YELLOW, 32, sa)
                L.chip(cv, '= same Δp', 760, GY0 + 160, YELLOW, 32, sa)
            if sl > -0.04:
                p = curve_path(CV.stiff, -0.04, min(sl, S_MAX), n=400)
                cv.drawPath(p, skia.Paint(AntiAlias=True, Color=col(CORAL, 255 * ga), StrokeWidth=7, Style=skia.Paint.kStroke_Style, StrokeJoin=skia.Paint.kRound_Join))
                if sl > CV.D * 0.5:
                    pk = gpt(CV.D / 2, PK_STIFF)
                    text(cv, f'locked ≈ {PK_STIFF:.0f}× mg', pk[0] + 30, pk[1] + 20, 30, CORAL, ga)
                    text(cv, 'illustrative', pk[0] + 30, pk[1] + 52, 24, (255, 190, 190), ga)
            if sb > -0.04:
                p = curve_path(CV.bent, -0.04, min(sb, S_MAX), n=200)
                cv.drawPath(p, skia.Paint(AntiAlias=True, Color=col(TEAL, 255 * ga), StrokeWidth=7, Style=skia.Paint.kStroke_Style, StrokeJoin=skia.Paint.kRound_Join))
                if t > T['peak'] - 0.1:
                    ss = np.linspace(0, 0.2, 200); spk = ss[int(np.argmax([CV.bent(v) for v in ss]))]
                    pk = gpt(spk, CV.peak)
                    pa_ = smooth((t - T['peak'] + 0.1) / 0.25) * ga
                    text(cv, f'bent ≈ {CV.peak:.1f}× mg', pk[0] + 40, pk[1] - 14, 30, TEAL, pa_)
                    text(cv, 'from the motion capture', pk[0] + 40, pk[1] + 16, 22, (180, 240, 235), pa_)
            # pulsing peaks on 'smaller'
            pp = smooth((t - T['small']) / 0.2) * ga * (1 - smooth((t - T['ask0'] + 0.3) / 0.3))
            if pp > 0.01:
                q1_ = gpt(CV.D / 2, PK_STIFF); ss = np.linspace(0, 0.2, 200); spk = ss[int(np.argmax([CV.bent(v) for v in ss]))]
                q2_ = gpt(spk, CV.peak)
                arrow(cv, (q1_[0] + 120, q1_[1] + 30), (q2_[0] + 10, q2_[1] - 30), YELLOW, w=9, head=30, a=pp)

        # ---- replays under the graph: stopwatch, ground force arrow, weight
        if s['mode'] == 'mocap' and s['seg'] in ('D', 'E') and t < T['ask0']:
            stiff = s['seg'] == 'D'
            sd_ = s['tau'] - (TD if stiff else CV.T0)
            stop_s = CV.D if stiff else CV.stop_s()
            secs = min(max(sd_, 0.0), stop_s)
            running = 0 < sd_ < stop_s
            seg_t0 = T['g0'] if stiff else T['e0']
            sw_a = smooth((t - seg_t0 - 0.2) / 0.25) * (1 - smooth((t - (T['e0'] if stiff else T['ask0']) + 0.15) / 0.2))
            colr = CORAL if stiff else TEAL
            stopwatch(cv, 880, 1150, 70, secs, running, colr, sw_a, label='stop time')
            fv = CV.stiff(sd_) if stiff else (CV.bent(sd_) if sd_ > -0.1 else 0.0)
            if sd_ < -0.06:
                fv = 0.0
            fa = sw_a
            if fa > 0.01 and feet_s is not None:
                Lf = fv * 62 * z / 3.0
                base = feet_s + np.array([-6, 0])
                arrow(cv, base, base + np.array([0, -min(Lf, 680)]), colr, w=16, head=44, a=fa * smooth(fv / 0.4))
                if fv > 0.4:
                    text(cv, 'ground force', base[0] + 34, base[1] - 70, 30, colr, fa)
                    text(cv, f'{fv:.1f}× mg', base[0] + 34, base[1] - 30, 38, colr, fa)
                # weight at the CoM
                cs = com_s[:2]
                arrow(cv, cs, cs + np.array([0, 62 * z / 3.0]), GREY, w=10, head=28, a=fa * 0.9)
                cv.drawCircle(*cs, 10, skia.Paint(AntiAlias=True, Color=col(YELLOW, 255 * fa)))
                text(cv, 'mg', cs[0] + 20, cs[1] + 58, 28, GREY, fa)
            if stiff:
                L.chip(cv, 'locked knees (acted out)', 880, 1330, GREY, 24, sw_a)

        # ---- question chips
        for txt, t0, yy, colr in (('PULL HANDS BACK?', T['back'] - 0.05, 470, TEAL), ('HOLD STILL?', T['still'] - 0.05, 575, CORAL)):
            a = smooth((t - t0) / 0.2) * (1 - smooth((t - T['end']) / 0.2))
            if a > 0:
                L.chip(cv, txt, 590, yy, colr, 48, a, scale=0.85 + 0.15 * smooth((t - t0) / 0.18))
        ba = smooth((t - T['bal']) / 0.25) * (1 - smooth((t - T['end']) / 0.2))
        balloon(cv, 125, 520 + 8 * math.sin(t * 3), 1.3 + 0.2 * math.exp(-max(0, t - T['bal']) * 6), ba)

        # ---- rewind look
        rw_a = smooth((t - T['rw0']) / 0.08) * (1 - smooth((t - T['rw1']) / 0.1))
        rewind_fx(cv, t, rw_a)
        # ---- house layout
        L.fades(cv)
        L.progress(cv, t / DUR)
        L.badge(cv, 'AP PHYSICS 1  ·  IMPULSE & MOMENTUM')
        for t_in, t_out, lines in titles:
            if T['g0'] <= t < T['ask0'] and t_in >= T['g0']:
                pass
            L.title(cv, lines, t, t_in, t_out, size=86 if T['g0'] <= t < T['ask0'] else 96)
        L.watermark(cv)
        cur_chunk, cur_word = None, -1
        for ch in chunks:
            if tl.words[ch[0]][1] - 0.05 <= t <= tl.words[ch[-1]][2] + 0.25:
                cur_chunk = ch
        if cur_chunk and t < T['end']:
            ws = [tl.words[j][0] for j in cur_chunk]
            for n_, j in enumerate(cur_chunk):
                if tl.words[j][1] - 0.02 <= t:
                    cur_word = n_
            L.caption(cv, ws, cur_word)
        if t >= T['end']:
            L.end_card(cv, last_frame, t - T['end'], [[('Water balloon: ', WHITE)], [('pull back', TEAL), (' or ', WHITE), ('hold still?', CORAL)]])
        if s['mode'] == 'mocap':
            g = partrig.gap_check(rig, s['W'], np.array([[0.5, 0, 540 - 0.5 * s['x']], [0, 0.5, 900], [0, 0, 1.0]]), (W_, H_), joints, radius, down=1.0)
            if max(g[j] for j in joints) > 0.02 or g['components'] > 1:
                gaps += 1
        frame = surf.makeImageSnapshot().toarray()
        if fi in stills:
            Image.fromarray(frame[..., [2, 1, 0]]).save(f'{OUT}/st_{fi:04d}.png')
        if proc:
            proc.stdin.write(frame.tobytes())
    if proc:
        proc.stdin.close(); proc.wait()
    json.dump(dict(T=T, DUR=DUR, sounds=sounds, curves=dict(td=TD, stop=CV.STOP, v_td=CV.v_td, peak=CV.peak, D=CV.D, area=CV.area)),
              open(f'{OUT}/build.json', 'w'), indent=1)
    return dict(frames=frames, dur=DUR, gaps=gaps, T=T)


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--words', default=None)
    ap.add_argument('--out', default=None)
    ap.add_argument('--stills', default='')
    ap.add_argument('--sim', action='store_true')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    tl = timing.load(a.words)
    st = [int(float(v) * FPS) for v in a.stills.split(',') if v]
    if a.sim:
        r = build(tl, sim_only=True)
        print({k: round(v, 2) for k, v in r['T'].items()}, 'DUR', round(r['DUR'], 2))
    else:
        r = build(tl, a.out, stills=st)
        print({k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items() if k != 'T'})
        print({k: round(v, 2) for k, v in r['T'].items()})
