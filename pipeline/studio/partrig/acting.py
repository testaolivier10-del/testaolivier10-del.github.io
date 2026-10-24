"""Shared acting script for the rig comparison (2026-10-24).

Every rig gets the SAME absolute performance (world angles and IK targets scaled by its own leg length),
so differences in the result come only from how the art was prepared.

Craft rules built in (Kurzgesagt Skillshare defaults and cutout animation practice):
  - 60 fps; standard moves about 50 frames, quick moves 10 to 30; every key eased, never linear
  - anticipation before the point, overshoot settle (ease out back), follow through on forearm, hand and head
    from damped springs (children lag their parents by a few frames)
  - idle never freezes: breathing and a slow sway
  - walk: feet planted on the ground (2 bone IK, no stretch), heel strike and toe roll, body bob twice a cycle,
    arms counter swing the legs
"""
import math
import numpy as np
from partrig import Track, ease_io

PI = math.pi
FPS = 60


class Performer:
    def __init__(self, rig, spec):
        """spec: spine, head (or None), arms {near, far: (up, lo, hand)}, legs {near, far: (th, sh, ft)},
        facing (+1 art faces +x, -1 faces -x), ankle_h (ankle above sole, char px), foot_len (ankle to toe)."""
        self.r, self.s = rig, spec
        self.f = spec["facing"]
        th, sh = spec["legs"]["near"][:2]
        self.L = rig.b[th]["len"] + rig.b[sh]["len"]
        self.hip0 = rig.b[th]["head"].copy()
        self.ground = self.hip0[1] + spec.get("stand_k", 0.965) * self.L   # ankle line while standing
        sp = rig.b[spec["spine"]]
        self.spine_len = sp["len"]
        # standing feet: near foot a touch forward
        self.stand = {"near": self.f * 0.10 * self.L, "far": -self.f * 0.06 * self.L}
        self.foot = {k: np.array([self.hip0[0] + v, self.ground]) for k, v in self.stand.items()}
        self.state = {k: dict(mode="stand", start=self.foot[k].copy()) for k in self.foot}
        self.x = 0.0
        self.p = 0.62
        self.prev_u = {}
        self.t = 0.0
        for n, fr, dm in spec.get("springs", []):
            rig.springs[n] = dict(freq=fr, damp=dm)

    # angle helpers (motion authored facing +x)
    def down(self, fwd):
        """World angle of a limb hanging down, swung forward by fwd rad."""
        return PI / 2 - self.f * fwd

    def up(self, fwd):
        return -PI / 2 + self.f * fwd

    def pose(self, t, script):
        dt = 1.0 / FPS
        c = script(t, self)
        rig, s, L = self.r, self.s, self.L
        # ---- walk state
        ww = c.get("walk", 0.0)
        v = 1.05 * L * ww                                                   # char px per second
        freq = 0.95 * (0.35 + 0.65 * ww) if ww > 0 else 0.0
        self.x += self.f * v * dt
        self.p += freq * dt
        beta = 0.60
        bob = 0.0
        hipx = self.hip0[0] + self.x
        tilt = {}
        for k, off in (("near", 0.0), ("far", 0.5)):
            u = (self.p + off) % 1.0
            st = self.state[k]
            if ww <= 0.001 and st["mode"] != "swing":
                st["mode"] = "stand"
                tilt[k] = c.get(k + "_heel", 0.0)          # heel raise on the spot (calf push)
                continue
            pu = self.prev_u.get(k, u)
            if st["mode"] in ("stand", "stance") and u >= beta and pu < beta:
                st["mode"] = "swing"; st["start"] = self.foot[k].copy()
            if st["mode"] == "swing" and (u < pu):                       # wrapped: heel strike
                st["mode"] = "stance"
                tgt = st.get("tgt", self.foot[k])
                self.foot[k] = tgt.copy()
            if st["mode"] == "swing":
                sw = (u - beta) / (1 - beta)
                vfull = 1.05 * L * max(ww, 0.3)
                remain = (1 - u) / max(freq, 1e-3)
                tgt = np.array([hipx + self.f * (vfull * remain + beta * vfull / (2 * max(freq, 1e-3))),
                                self.ground])
                st["tgt"] = tgt
                e = ease_io(sw)
                self.foot[k] = np.array([st["start"][0] + (tgt[0] - st["start"][0]) * e,
                                         self.ground - 0.11 * L * math.sin(PI * sw) ** 1.3])
                tilt[k] = -0.35 * math.sin(PI * min(1, sw * 1.25)) + 0.30 * max(0, sw - 0.7) / 0.3 * -1
            else:
                tilt[k] = 0.0
                if st["mode"] == "stance":
                    if u < 0.09:
                        tilt[k] = -0.30 * (1 - u / 0.09)                    # toe still up after heel strike
                    elif u > beta - 0.14:
                        tilt[k] = 0.55 * ((u - (beta - 0.14)) / 0.14) ** 1.5  # heel peels off, toe stays
            self.prev_u[k] = u
        if ww > 0:
            ph = (self.p % 0.5) / 0.5
            bob = ww * 0.022 * L * (math.cos(2 * PI * ph))                 # high at passing, low at contact
        # ---- root (spine)
        sp = rig.b[s["spine"]]
        breathe = math.sin(2 * PI * t / 3.6)
        lean = c.get("lean", 0.0) + 0.006 * breathe
        target_spine = -PI / 2 + self.f * lean
        pose = {"delta": {}, "world": {},
                "root": (self.x, bob + c.get("dy", 0.0) * L - 0.004 * L * breathe),
                "root_rot": target_spine - sp["a0"]}
        if s.get("head"):
            pose["world"][s["head"]] = -PI / 2 + self.f * c.get("head", 0.0)
        for side in ("near", "far"):
            up, lo, hand = s["arms"][side]
            a = c.get(side + "_arm", (0.0, 0.15))
            A1 = self.down(a[0])
            A2 = A1 - self.f * a[1]
            pose["world"][up] = A1
            pose["world"][lo] = A2
            if hand:
                pose["world"][hand] = A2 - self.f * (a[2] if len(a) > 2 else 0.0)
        W0 = rig.fk(pose)
        for side in ("near", "far"):
            th, sh, ft = s["legs"][side]
            tl = tilt.get(side, 0.0)
            ank = self.foot[side].copy()
            if tl > 0:                                                      # heel off: pivot at the toe
                fl = s["foot_len"]
                toe = ank + self.f * np.array([fl, 0.0]) + np.array([0, s["ankle_h"] * 0.0])
                ank = toe - fl * np.array([self.f * math.cos(tl), -math.sin(tl)])
            rig.ik2(W0, pose, th, sh, ank, bend=self.f)
            pose["world"][ft] = (0.0 if self.f > 0 else PI) + self.f * tl + s.get("foot_rest", {}).get(side, 0.0)
        W = rig.fk(pose, dt)
        self.t = t
        return W


def script(t, P):
    """The shared performance: idle, point, wave, walk away."""
    c = {}
    sway = math.sin(2 * PI * t / 4.3)
    # near arm: hang -> anticipation -> point (fast, overshoot) -> hold -> return -> raise -> wave -> walk
    tr_s = Track([(0.0, 0.06), (1.2, 0.06), (1.42, -0.28, "io"), (1.62, 1.42, "back"), (3.0, 1.36, "io"),
                  (3.5, 0.10, "io"), (3.8, 0.10), (4.35, 1.95, "back"), (5.9, 1.90), (6.35, 0.0, "io")])
    tr_b = Track([(0.0, 0.18), (1.2, 0.18), (1.42, 0.55, "io"), (1.62, 0.04, "back"), (3.0, 0.08),
                  (3.5, 0.22, "io"), (3.8, 0.22), (4.35, 1.05, "io")])
    s = tr_s(t) + 0.02 * sway
    b = tr_b(t)
    if 4.35 <= t < 5.9:                                                     # wave: forearm swings, hand lags
        k = (t - 4.35) / (5.9 - 4.35)
        env = math.sin(PI * min(1, k * 1.15)) ** 0.6
        b = 1.05 + 0.42 * env * math.sin(2 * PI * 2.2 * (t - 4.35))
    if t >= 5.9:
        b = Track([(5.9, 1.05), (6.35, 0.25, "io")])(t)
    c["near_arm"] = (s, b, 0.0)
    c["far_arm"] = (-0.04 - 0.02 * sway, 0.16, 0.0)
    c["lean"] = Track([(0, 0.02), (1.3, 0.02), (1.62, 0.09, "back"), (3.0, 0.08), (3.5, 0.02, "io"),
                       (4.3, -0.02, "io"), (5.9, -0.02), (6.4, 0.07, "io")])(t)
    c["head"] = Track([(0, 0.0), (1.4, 0.0), (1.7, 0.10, "back"), (3.0, 0.08), (3.6, 0.0, "io"),
                       (4.4, -0.06, "io"), (5.9, -0.04), (6.4, 0.04, "io")])(t) + 0.015 * sway
    ww = Track([(0, 0.0), (6.0, 0.0), (6.9, 1.0, "io")])(t)
    c["walk"] = ww
    if ww > 0:                                                              # arms counter swing the legs
        ph = 2 * PI * P.p
        sw = 0.42 * ww
        ns, nb, _ = c["near_arm"]
        c["near_arm"] = (ns * (1 - ww) + sw * math.cos(ph + PI * 1.0), nb, 0.0)
        fs, fb, _ = c["far_arm"]
        c["far_arm"] = (fs * (1 - ww) + sw * math.cos(ph), 0.16 + 0.2 * ww * max(0, math.cos(ph)), 0.0)
    return c
