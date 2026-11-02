"""walk.py: walks with real foot locking for cperson people (Olivier 2026-11-01: "make sure characters' legs are
walking forwards if they are walking forwards").

Method (Williams' contact, down, passing, up; foot locks as in a mocap foot planter):
- The body travels at speed v along dir (+1 right, -1 left). One cycle (two steps) lasts T; the step length is tied to
  the speed and the leg length, and T = 2 * step / v, so the feet never skate.
- Each foot has a phase u = t / T + offset (near 0, far 0.5). For u < stance it is PLANTED: its plant point P(n) is
  fixed in WORLD space (so relative to the hips it moves backward at exactly the travel speed). It rolls heel first
  (heel pivot, toes coming down), flat, then toe off (pivot on the toe while the heel rises), each pivot point fixed.
- For u >= stance it SWINGS: it lifts (a sine arch) and moves FORWARD from P(n) to P(n + 1) with a monotonic ease, so
  a lifted foot can never move backward (the moonwalk bug of the first cold heart sled pullers: foot_x = sin(ph),
  lift = max(0, sin(ph + 1.6)) lifted the foot on its backward half).
- The hips: lowest just after contact, highest at passing (a cosine bob at twice the step rate), never higher than
  both legs can reach (IK clamp); the torso leans into the travel; hips and shoulders counter rotate a little; arms
  swing opposite the legs with the elbow bending more on the forward swing; the head bobs with the hips.
- gait_check(frames, dir, ground) verifies any recorded foot motion: a lifted foot (both heel and toe above the
  ground) must not move against dir; a foot point on the ground must not slide more than slide_tol px between frames.
"""
import math
import numpy as np


def _ease(w):
    w = min(1.0, max(0.0, w)); return w * w * (3 - 2 * w)


class Gait:
    STYLES = dict(walk=dict(stance=0.60, lift=0.12, bob=0.022, lean=4.0, arm=20.0, knee=0.985, step_k=1.0),
                  slow=dict(stance=0.64, lift=0.09, bob=0.016, lean=3.0, arm=11.0, knee=0.985, step_k=0.85),
                  trudge=dict(stance=0.68, lift=0.08, bob=0.014, lean=16.0, arm=8.0, knee=0.955, step_k=0.7),
                  pull=dict(stance=0.70, lift=0.07, bob=0.012, lean=24.0, arm=0.0, knee=0.94, step_k=0.62))

    def __init__(self, person, s, x0, ground, dir=1, v=None, style='walk', yaw=0.08, t0=0.0, x_stop=None, step_scale=1.0):
        self.P = person; self.s = s; self.x0 = x0; self.g = ground; self.dir = 1 if dir >= 0 else -1
        self.st = dict(self.STYLES[style]); self.style = style; self.yaw = yaw; self.t0 = t0
        sp = person.sp; u = s * sp.height
        self.u = u
        self.Lth = person.THIGH * u * sp.legs; self.Lsh = person.SHIN * u * sp.legs
        self.leg = self.Lth + self.Lsh
        bs = (sp.boots or {}).get('size', 1.12); sq = 1 - 0.72 * yaw
        # foot points relative to the ankle (screen, facing +1, pitch 0): heel and toe on the sole line
        self.heel = np.array([-38.0 * sq * u * bs, 60.0 * u * bs]); self.toe = np.array([132.0 * sq * u * bs, 60.0 * u * bs])
        self.flen = self.toe[0] - self.heel[0]
        if v is None: v = 0.9 * self.leg
        self.v = v
        step = self.leg * (0.34 + 0.32 * min(1.0, v / (1.1 * self.leg))) * self.st['step_k'] * step_scale
        self.step = step
        self.T = 2 * step / v

    # -- foot frame helpers
    def _rot(self, p, pitch):
        r = math.radians(pitch); x, y = p
        return np.array([self.dir * (x * math.cos(r) - y * math.sin(r)), x * math.sin(r) + y * math.cos(r)])

    def plant(self, n, off):
        """heel position of plant n for a foot with phase offset off (world x)"""
        s = self.st['stance']
        tm = (n - off + s * 0.5) * self.T          # middle of that stance, the hip passes over the foot's middle
        hip_x = self.x0 + self.dir * self.v * tm
        return hip_x - self.dir * (self.flen * 0.5 + self.heel[0] * 0) + 0.0

    def foot(self, t, off):
        """ankle position, foot pitch, heel and toe world points, planted flag"""
        s = self.st['stance']
        cyc = (t - self.t0) / self.T + off
        n = math.floor(cyc); w = cyc - n
        H0 = np.array([self.plant(n, off), self.g])                 # heel point on the ground for this stance
        if w < s:
            q = w / s
            if q < 0.16:                                             # heel strike, toes come down: heel pivot
                pitch = -16 * (1 - _ease(q / 0.16))
                an = H0 - self._rot(self.heel, pitch)
            elif q < 0.68:
                pitch = 0.0; an = H0 - self._rot(self.heel, 0.0)
            else:                                                    # heel off: pivot on the toe
                pitch = 34 * _ease((q - 0.68) / 0.32)
                T0 = H0 + np.array([self.dir * self.flen, 0.0])
                an = T0 - self._rot(self.toe, pitch)
            planted = True
        else:
            q = (w - s) / (1 - s)
            T0 = H0 + np.array([self.dir * self.flen, 0.0])
            a0 = T0 - self._rot(self.toe, 34.0)                      # where toe off left the ankle
            H1 = np.array([self.plant(n + 1, off), self.g])
            a1 = H1 - self._rot(self.heel, -16.0)                    # where the next heel strike puts it
            e = _ease(q)
            an = a0 + (a1 - a0) * e
            an[1] -= self.st['lift'] * self.leg * math.sin(math.pi * q) ** 0.9
            pitch = 34 + (-16 - 34) * _ease(q * 1.15)
            planted = False
        heel = an + self._rot(self.heel, pitch); toe = an + self._rot(self.toe, pitch)
        return an, pitch, heel, toe, planted

    def state_at(self, d):
        """the state after the body has travelled d px (phase tied to distance, so the planted feet stay locked even
        when the travel speed changes, e.g. a sled that eases in and out)"""
        return self.state(self.t0 + d / self.v)

    def state(self, t, stop=None):
        """the pose fields for time t: x, y (pelvis), leg targets, foot pitches, arms, lean; plus foot points"""
        st = self.st
        fn = self.foot(t, 0.0); ff = self.foot(t, 0.5)
        hip_x = self.x0 + self.dir * self.v * (t - self.t0)
        cyc = (t - self.t0) / self.T
        stand_h = self.P.standing_hip(type('p', (), dict(s=self.s))())
        base = self.g - stand_h * st['knee']
        y = base + st['bob'] * self.leg * (0.5 + 0.5 * math.cos(4 * math.pi * (cyc - 0.05)))
        lean = st['lean']
        # the hips sit a little behind the lean so the chest is over the feet
        hn = np.array([hip_x, y]); Lmax = (self.Lth + self.Lsh) * 0.995
        for an in (fn[0], ff[0]):
            dx = an[0] - hip_x
            if abs(dx) < Lmax:
                y = max(y, an[1] - math.sqrt(Lmax * Lmax - dx * dx))
        sw = math.cos(2 * math.pi * cyc)          # +1 when the near leg is forward (its heel strike)
        a = st['arm']
        arm_n = ('ang', -a * sw + 2, 12 + 14 * max(0.0, -sw))
        arm_f = ('ang', a * sw + 2, 12 + 14 * max(0.0, sw))
        return dict(x=hip_x, y=y, lean=lean + 1.5 * math.sin(4 * math.pi * cyc), face=self.dir,
                    leg_n=('ik', tuple(fn[0]), (self.dir, -0.25)), leg_f=('ik', tuple(ff[0]), (self.dir, -0.25)),
                    foot_n=fn[1], foot_f=ff[1], arm_n=arm_n, arm_f=arm_f, nod=2.0 + 1.5 * math.sin(4 * math.pi * cyc)), \
            dict(n=(fn[2], fn[3], fn[4]), f=(ff[2], ff[3], ff[4]))


def gait_check(frames, travel_dir, ground, slide_tol=2.0, ground_tol=1.0):
    """frames: list of {side: (heel(x, y), toe(x, y))} in world px per frame. Fails if a lifted foot moves against the
    travel direction, or a foot point on the ground slides more than slide_tol px between frames."""
    d = 1 if travel_dir >= 0 else -1
    worst_slide, worst_back = 0.0, 0.0
    issues = []
    for i in range(1, len(frames)):
        for side in frames[i]:
            h0, t0 = (np.array(p) for p in frames[i - 1][side][:2]); h1, t1 = (np.array(p) for p in frames[i][side][:2])
            on0 = [abs(h0[1] - ground) <= ground_tol, abs(t0[1] - ground) <= ground_tol]
            on1 = [abs(h1[1] - ground) <= ground_tol, abs(t1[1] - ground) <= ground_tol]
            for k, (a, b) in enumerate(((h0, h1), (t0, t1))):
                if on0[k] and on1[k]:
                    sl = float(np.hypot(*(b - a))); worst_slide = max(worst_slide, sl)
                    if sl > slide_tol: issues.append((i, side, 'slide', round(sl, 2)))
            if not any(on0) and not any(on1):
                m0 = (h0 + t0) / 2; m1 = (h1 + t1) / 2
                back = -(m1[0] - m0[0]) * d; worst_back = max(worst_back, back)
                if back > 0.5: issues.append((i, side, 'backward while lifted', round(back, 2)))
    return dict(ok=not issues, frames=len(frames), max_slide=round(worst_slide, 3), max_backward=round(worst_back, 3), issues=issues[:12])


def record(gait, t0, t1, fps=30):
    out = []
    for i in range(int((t1 - t0) * fps) + 1):
        _, feet = gait.state(t0 + i / fps)
        out.append({k: (tuple(v[0]), tuple(v[1])) for k, v in feet.items()})
    return out


def moonwalk_bug(t0, t1, x0, ground, v, dir=1, fps=30):
    """the old sled pullers' feet, for the check to catch: foot_x = sin(ph), lift = max(0, sin(ph + 1.6))"""
    out = []
    for i in range(int((t1 - t0) * fps) + 1):
        t = t0 + i / fps; hx = x0 + dir * v * t; fr = {}
        for side, o in (('n', 0.0), ('f', math.pi)):
            ph = t * 5 + o
            fx = hx + dir * 40 * math.sin(ph); lift = 20 * max(0.0, math.sin(ph + 1.6))
            fr[side] = ((fx - 20, ground - lift), (fx + 60, ground - lift))
        out.append(fr)
    return out
