"""Drive the traced paramedic with real human motion (CMU motion capture), side view.

Retargeting, the way game and film pipelines do it in 2D:
  - trunk and head: the actor's angles relative to HIS standing posture, applied to HER upright posture
  - arms: the actor's upper arm and forearm world angles; hands continue the forearm with a relaxed curl
    (CMU hand markers are unreliable)
  - root: the actor's hip path scaled by leg length ratio, so stride fits her proportions
  - legs: 2 bone IK to the actor's ankle positions (relative to his hip joints, scaled), knees forward,
    standing leg extension matched to his
  - foot contacts: a planted, still foot is LOCKED where it landed, with short blends in and out
  - several takes blend with eased weights (angles, root and foot targets), each new take continuing from
    where the body is, so idle, wave and walk chain without pops
"""
import math
import numpy as np
import side


def ang(v):
    return math.atan2(v[1], v[0])


def wrapd(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


class Take:
    def __init__(self, code, near='Left', skip=0.0):
        self.code = code
        self.b, self.S, _ = side.side(code, heading_from=(int(skip * 120) + 5, None) if skip else None)
        self.near, self.far = near, ('Right' if near == 'Left' else 'Left')
        self.fps, self.nf = self.b.fps, self.b.nf
        ix = self.b.ix
        S = self.S
        self.leg = float(np.median(np.linalg.norm(S[:, ix['LeftUpLeg']] - S[:, ix['LeftLeg']], axis=-1) +
                                   np.linalg.norm(S[:, ix['LeftLeg']] - S[:, ix['LeftFoot']], axis=-1)))
        self.ground_ankle = float(np.percentile(np.r_[S[:, ix['LeftFoot'], 1], S[:, ix['RightFoot'], 1]], 92))
        a0, a1 = int(skip * self.fps) + 6, int(skip * self.fps) + 6 + int(0.6 * self.fps)   # a standing window

        def med(a, b):
            d = S[a0:a1, ix[b]] - S[a0:a1, ix[a]]; return float(np.median(np.arctan2(d[:, 1], d[:, 0])))
        self.foot_rest = {sd: med(sd + 'Foot', sd + 'ToeBase') for sd in ('Left', 'Right')}
        self.spine_rest, self.head_rest = med('Hips', 'Neck'), med('Neck', 'Head_end')
        ext = np.linalg.norm(S[a0:a1, ix['LeftUpLeg']] - S[a0:a1, ix['LeftFoot']], axis=-1)
        self.ext0 = float(np.median(ext)) / self.leg

    def at(self, tau):
        f = min(max(tau * self.fps, 0), self.nf - 1.001)
        i = int(f); u = f - i
        return self.S[i] * (1 - u) + self.S[i + 1] * u

    def vel(self, tau, j):
        a, b = self.at(tau - 1 / 60)[self.b.ix[j]], self.at(tau + 1 / 60)[self.b.ix[j]]
        return (b - a) * 30


class MocapPerformer:
    """pose(t) -> W. plan(t) returns [(layer_id, take, tau, weight[, mask])], weights >= 0.
    mask 'upper' layers drive only trunk, head and arms (the legs and root keep following the full layers)."""

    def __init__(self, rig, spec, plan, ground_take=None, hand_curl=0.12, head_k=0.8):
        self.r, self.s, self.plan = rig, spec, plan
        self.f = spec['facing']
        th, sh = spec['legs']['near'][:2]
        self.L = rig.b[th]['len'] + rig.b[sh]['len']
        e0 = ground_take.ext0 if ground_take is not None else 0.982
        self.ground = rig.b[th]['head'][1] + e0 * self.L
        self.locks = {'near': None, 'far': None}
        self.lock_w = {'near': 0.0, 'far': 0.0}
        self.anchor = {}            # layer id -> (root at entry, his hip at entry)
        self.root = np.zeros(2)
        self.x = 0.0
        self.hand_curl, self.head_k = hand_curl, head_k

    def layer(self, take, tau):
        ix = take.b.ix
        P = take.at(tau)
        g = lambda a, b: ang(P[ix[b]] - P[ix[a]])
        A = {'spine': -math.pi / 2 + wrapd(g('Hips', 'Neck') - take.spine_rest),
             'head': -math.pi / 2 + self.head_k * wrapd(g('Neck', 'Head_end') - take.head_rest)}
        k = self.L / take.leg
        feet = {}
        for side_, sd in (('near', take.near), ('far', take.far)):
            A[side_ + '_up'] = g(sd + 'Arm', sd + 'ForeArm')
            A[side_ + '_lo'] = g(sd + 'ForeArm', sd + 'Hand')
            A[side_ + '_hand'] = A[side_ + '_lo'] - self.f * self.hand_curl
            A[side_ + '_foot'] = g(sd + 'Foot', sd + 'ToeBase') - take.foot_rest[sd]
            rel = (P[ix[sd + 'Foot']] - P[ix[sd + 'UpLeg']]) * k
            v = take.vel(tau, sd + 'Foot')
            low = (take.ground_ankle - P[ix[sd + 'Foot'], 1]) * k < 0.035 * self.L
            still = abs(v[0]) * k < 0.30 * self.L
            feet[side_] = dict(relx=rel[0], y=self.ground + (P[ix[sd + 'Foot'], 1] - take.ground_ankle) * k,
                               plant=1.0 if (low and still) else 0.0)
        return A, P[ix['Hips']] * k, feet

    def pose(self, t, script=None):
        rig, s = self.r, self.s
        layers = [(e[0], e[1], e[2], e[3], e[4] if len(e) > 4 else 'full') for e in self.plan(t) if e[3] > 1e-4]
        layers.sort(key=lambda e: e[4] != 'full')     # full layers blend first, upper layers override on top
        UPPER = ('spine', 'head', 'near_up', 'near_lo', 'near_hand', 'far_up', 'far_lo', 'far_hand')
        A, root, feet = None, np.zeros(2), {}
        wa, wf = 0.0, 0.0                      # running weights: all angles, full body parts
        for lid, tk, tau, w, mask in layers:
            Ai, hip_i, fi = self.layer(tk, tau)
            if lid not in self.anchor:
                self.anchor[lid] = (self.root.copy(), hip_i.copy())
            r0, h0 = self.anchor[lid]
            ri = r0 + (hip_i - h0)
            if A is None:
                A = dict(Ai); wa = w
            else:
                f_ = w / (wa + w) if mask == 'full' else min(w, 1.0)
                for key in A:
                    if mask == 'full' or key in UPPER:
                        A[key] = A[key] + f_ * wrapd(Ai[key] - A[key])
                wa += w
            if mask == 'full':
                if wf == 0:
                    root, feet = ri.copy(), {sd: dict(fi[sd]) for sd in fi}
                    for sd in feet: feet[sd]['foot'] = Ai[sd + '_foot']
                    wf = w
                else:
                    f_ = w / (wf + w)
                    root = root + f_ * (ri - root)
                    for sd in feet:
                        for kk in ('relx', 'y', 'plant'):
                            feet[sd][kk] = feet[sd][kk] + f_ * (fi[sd][kk] - feet[sd][kk])
                        feet[sd]['foot'] = feet[sd]['foot'] + f_ * wrapd(Ai[sd + '_foot'] - feet[sd]['foot'])
                    wf += w
        for sd in feet:
            A[sd + '_foot'] = feet[sd]['foot']
        live = {lid for lid, *_ in layers}
        self.anchor = {k_: v for k_, v in self.anchor.items() if k_ in live}
        self.root = root
        sp = rig.b[s['spine']]
        pose = {'delta': {}, 'world': {}, 'root': (root[0], root[1]), 'root_rot': A['spine'] - sp['a0']}
        pose['world'][s['head']] = A['head']
        for side_ in ('near', 'far'):
            up, lo, hand = s['arms'][side_]
            pose['world'][up] = A[side_ + '_up']; pose['world'][lo] = A[side_ + '_lo']; pose['world'][hand] = A[side_ + '_hand']
        W0 = rig.fk(pose)
        for side_ in ('near', 'far'):
            thb, shb, ftb = s['legs'][side_]
            hj = rig.joint(W0, thb)
            target = np.array([hj[0] + feet[side_]['relx'], feet[side_]['y']])
            want = 1.0 if feet[side_]['plant'] > 0.5 else 0.0
            if want and self.locks[side_] is None:
                self.locks[side_] = np.array([target[0], self.ground])
            if not want and self.lock_w[side_] < 0.02:
                self.locks[side_] = None
            self.lock_w[side_] += (want - self.lock_w[side_]) * 0.35
            if self.locks[side_] is not None:
                w = self.lock_w[side_]
                target = target * (1 - w) + self.locks[side_] * w
            rig.ik2(W0, pose, thb, shb, target, bend=self.f)
            pose['world'][ftb] = A[side_ + '_foot']
        W = rig.fk(pose, 1 / 60)
        self.x = root[0]
        return W


def xfade(t, a, b):
    """0 before a, 1 after b, eased."""
    u = min(max((t - a) / max(b - a, 1e-6), 0), 1)
    return u * u * (3 - 2 * u)
