"""Leo and Ana posed for the track: standing, talking, holding a phone or calculator, walking with the measuring wheel,
and Leo's sprint. Walks and runs plant the stance foot: the body's world x comes from the foot that is on the ground,
so the ground never slides under a foot (2026-11-05 rule)."""
import math
import numpy as np
import cast as CA
from world import PXM as WD_PXM
from airman2 import L_UARM, L_FARM

GROUND = 900


def breath(t, k=0.0):
    return 0.6 * math.sin(t * 1.4 + k)


def blink(t, per=4.1, off=0.0):
    return ((t + off) % per) < 0.12


def ik(person, ps, target, side='n', bend=1):
    """arm angles so the wrist reaches a canvas point (2 bone IK in pose space)"""
    J = person.joints(ps)
    sh = J['uarm_' + side][0]
    k = ps.s * person.k
    tx = (target[0] - ps.x) / (k * ps.face); ty = (target[1] - ps.ground) / k
    dx, dy = tx - sh[0], ty - sh[1]
    d = max(1e-3, min(math.hypot(dx, dy), L_UARM + L_FARM - 1))
    a1, a2 = L_UARM, L_FARM
    cosE = (a1 * a1 + a2 * a2 - d * d) / (2 * a1 * a2)
    E = math.pi - math.acos(max(-1, min(1, cosE)))
    th = math.degrees(math.atan2(dx, dy))
    al = math.degrees(math.acos(max(-1, min(1, (a1 * a1 + d * d - a2 * a2) / (2 * a1 * d)))))
    setattr(ps, 'uarm_' + side, th - al * bend); setattr(ps, 'elbow_' + side, math.degrees(E) * bend)
    return ps


def hand_pt(person, ps, side='n', u=(20, 70)):
    J = person.joints(ps); o, d = J['hand_' + side]
    return person.canvas_pt(ps, person.frame(o, d)(*u))


def leo_stand(t, x, s=1.0, mouth=0.0, smile=0.4, look=0.0, neck=0.0, lean=2.0, brow=0.0, ground=GROUND, face=-1):
    ps = CA.Pose(x=x, ground=ground, s=s, face=face, lean=lean + breath(t), neck=neck, uarm_n=-4, elbow_n=18, uarm_f=-6, elbow_f=16,
                 hand_n='relaxed', hand_f='relaxed', mouth=mouth, smile=smile, look=look, blink=blink(t, 3.7))
    ps.brow = brow
    return CA.leo(), ps


def ana_stand(t, x, s=1.0, mouth=0.0, smile=0.4, look=0.0, neck=0.0, lean=1.0, brow=0.0, ground=GROUND, face=1):
    ps = CA.Pose(x=x, ground=ground, s=s, face=face, lean=lean + breath(t, 1.0), neck=neck, uarm_n=-4, elbow_n=18, uarm_f=-6,
                 elbow_f=16, hand_n='relaxed', hand_f='relaxed', mouth=mouth, smile=smile, look=look, blink=blink(t, 4.3, 1.0))
    ps.brow = brow
    return CA.ana(), ps


# ------------------------------------------------------------------ sprint (leg IK, planted stance feet, flight phases)
_RUN = {}
L1, L2, ANK, LR = 290.0, 250.0, 150.0, 525.0


def leg_ik(dx, dy):
    """hip to ankle offset (pose units, y down) -> (thigh, knee) degrees; the knee bends forward of the line"""
    d = max(1.0, min(math.hypot(dx, dy), L1 + L2 - 0.5))
    th0 = math.degrees(math.atan2(dx, dy))
    al = math.degrees(math.acos(max(-1, min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))))
    E = 180 - math.degrees(math.acos(max(-1, min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2)))))
    return th0 + al, -E


class Sprint:
    """a run from t0 at world x x0 (canvas px at zoom 1), speed profile v(t) in m/s, stride frequency f(v).
    The stance foot is planted in world space; between stances both feet are off the ground (flight)."""

    def __init__(self, person, s, t0, x0, vfun, t1, ground=GROUND, ds=0.24):
        self.p, self.s, self.t0, self.x0, self.g, self.ds = person, s, t0, x0, ground, ds
        self.k = s * person.k
        dt = 1 / 240.0
        n = int((t1 - t0) / dt) + 2
        ts = t0 + np.arange(n) * dt
        v = np.array([max(0.0, vfun(t)) for t in ts])
        f = np.where(v > 0.05, 1.05 + 0.16 * v, 0.0)          # strides per second: about 2.3 at 8 m/s
        self.ts, self.v = ts, v
        self.X = x0 + np.concatenate([[0], np.cumsum(v[:-1] * dt)]) * WD_PXM * s
        self.F = np.concatenate([[0], np.cumsum(f[:-1] * dt)])
        self.dt = dt

    def _at(self, arr, t):
        i = (t - self.t0) / self.dt
        i = max(0.0, min(len(arr) - 1.001, i)); i0 = int(i); fr = i - i0
        return arr[i0] + (arr[i0 + 1] - arr[i0]) * fr

    def _time_of_phase(self, ph):
        i = int(np.searchsorted(self.F, ph))
        i = max(1, min(len(self.F) - 1, i))
        a, b = self.F[i - 1], self.F[i]
        fr = 0 if b == a else (ph - a) / (b - a)
        return self.ts[i - 1] + fr * self.dt

    def foot(self, t, side):
        """world (x, y) of an ankle and whether it is planted"""
        ph = self._at(self.F, t) + (0.0 if side == 'n' else 0.5)
        k = math.floor(ph + 0.5); r = ph - k                      # stance centred on whole phases
        ds = self.ds
        un = self.k
        gy = self.g - ANK * un
        if abs(r) <= ds / 2 or self._at(self.v, t) < 0.05:
            xc = self._at(self.X, self._time_of_phase(k - (0.0 if side == 'n' else 0.5)))
            return xc, gy, True
        # swing, drawn relative to the hip: the heel kicks up behind, the knee drives forward, the foot comes down ahead
        u = (r - ds / 2) / (1 - ds) if r > 0 else (r + 1 - ds / 2) / (1 - ds)
        hx = self._at(self.X, t); sp = self._at(self.v, t)
        f_ = max(0.5, 1.05 + 0.16 * sp)
        hs = sp * ds / (2 * f_) * WD_PXM * self.s
        Lg = 540 * un; Hh = (0.25 + 0.06 * sp) * Lg
        P_ = [(-hs, 0.0), (-hs - 0.35 * Lg, -0.9 * Hh), (0.1 * Lg, -1.25 * Hh), (0.55 * Lg, -0.55 * Hh), (hs, 0.0)]
        while len(P_) > 1:
            P_ = [(p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u) for p0, p1 in zip(P_[:-1], P_[1:])]
        return hx + P_[0][0], gy + P_[0][1], False

    def pose(self, t, mouth=0.25):
        x = self._at(self.X, t); sp = self._at(self.v, t); un = self.k
        ph = self._at(self.F, t)
        r = ph - math.floor(ph * 2 + 0.5) / 2
        ds = self.ds
        # hip height: an inverted pendulum over the planted foot, a small hop in flight
        def stance_h(dxu):
            return ANK + math.sqrt(max(0.0, LR * LR - dxu * dxu))
        half = ds / 2
        fn = self.foot(t, 'n'); ff = self.foot(t, 'f')
        if fn[2] or ff[2]:
            fx = fn[0] if fn[2] else ff[0]
            hy = stance_h((fx - x) / un)
        else:
            # flight: blend between the take off height and the landing height with a lift
            tl = abs(r) - half
            w = max(0.0, min(1.0, tl / max(1e-3, 0.5 - ds)))
            edge = stance_h(min(LR - 1, sp * 0.5 * ds / max(0.5, 1.05 + 0.16 * sp) * WD_PXM / self.p.k))
            hy = edge + (14 + 3 * sp) * math.sin(math.pi * w)
        hy = min(hy, 690.0)
        hipc = (x, self.g - hy * un)
        lean = 10 + 2.6 * sp
        ps = CA.Pose(x=x, ground=0, s=self.s, face=1, lean=lean, neck=lean * 0.8)
        for side, fo in (('n', fn), ('f', ff)):
            dx = (fo[0] - hipc[0]) / un; dy = (fo[1] - hipc[1]) / un
            th, kn = leg_ik(dx, dy)
            setattr(ps, 'thigh_' + side, th); setattr(ps, 'knee_' + side, kn)
            setattr(ps, 'ank_' + side, 0.0 if fo[2] else -20.0)
        J = self.p.joints(ps)
        ps.ground = hipc[1] - J['hip'][1] * un
        arm = math.sin(2 * math.pi * ph) * min(1.0, sp / 4)
        ps.uarm_n = -50 * arm - 6; ps.elbow_n = 84 + 10 * arm; ps.uarm_f = 50 * arm - 6; ps.elbow_f = 84 - 10 * arm
        ps.hand_n = ps.hand_f = 'fist'
        ps.brow = 0.0; ps.mouth = mouth; ps.blink = False; ps.smile = 0.2
        return ps, x


def walk_pose(person, s, phase, x0, ground=GROUND, face=1, arm_n=None):
    """an ordinary walk: the swing leg bends its knee, the stance leg stays straight; planted like the run"""
    key = ('walk', id(person), s)
    def ang(p):
        sw = math.sin(2 * math.pi * p)
        return dict(thigh_n=22 * sw, knee_n=-30 * max(0, math.cos(2 * math.pi * p)) - 3, thigh_f=-22 * sw,
                    knee_f=-30 * max(0, -math.cos(2 * math.pi * p)) - 3, uarm_n=-14 * sw, elbow_n=20, uarm_f=14 * sw, elbow_f=20, lean=3)
    if key not in _RUN:
        N = 240; fx = []; fy = []
        for i in range(N + 1):
            ps = CA.Pose(x=0, ground=0, s=s, face=1, **ang(i / N)); J = person.joints(ps)
            pts = [person.canvas_pt(ps, J['boot_' + sd][0]) for sd in 'nf']
            st = 0 if pts[0][1] >= pts[1][1] else 1
            fx.append((pts[0][0], pts[1][0], st)); fy.append(max(pts[0][1], pts[1][1]))
        X = [0.0]
        for i in range(1, N + 1):
            X.append(X[-1] - (fx[i][fx[i][2]] - fx[i - 1][fx[i][2]]))
        _RUN[key] = (np.array(X), np.array(fy), N, ang)
    X, FY, N, ang = _RUN[key]
    n = math.floor(phase); f = phase - n
    i = f * N; i0 = int(i); fr = i - i0
    xi = X[i0] + (X[min(N, i0 + 1)] - X[i0]) * fr; yi = FY[i0] + (FY[min(N, i0 + 1)] - FY[i0]) * fr
    x = x0 + face * (n * X[N] + xi)
    ps = CA.Pose(x=x, ground=ground - yi, s=s, face=face, **ang(f))
    ps.brow = 0.0; ps.blink = False
    return ps, x
