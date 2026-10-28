"""Cast loader for n35: the paramedic (trace/model.py) and the hoodie runner (runner/model.py) in one process."""
import sys, importlib.util, math
sys.path[:0] = ['/home/claude/rig', '/home/claude/trace', '/home/claude/mocap', '/home/claude/runner']
import numpy as np


def _load(name, path):
    sp = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(sp); sys.modules[name] = m; sp.loader.exec_module(m)
    return m


PM = _load('para_model', '/home/claude/trace/model.py')
RM = _load('run_model', '/home/claude/runner/model.py')
import mocap_perf as MP
import partrig


class Perf(MP.ClampedPerformer):
    """Mocap performer with procedural arm overrides: arms(t) -> {side: (up, lo, hand, weight)} in world angles,
    and an optional IK hand target: ik(t, W0, pose) is called before the final fk."""
    arms = None
    _t = 0.0

    def layer(self, take, tau):
        A, hip, feet = super().layer(take, tau)
        if self.arms:
            for sd, v in self.arms(self._t).items():
                up, lo, hand, w = v
                if w <= 0:
                    continue
                A[sd + '_up'] += w * MP.wrapd(up - A[sd + '_up'])
                A[sd + '_lo'] += w * MP.wrapd(lo - A[sd + '_lo'])
                A[sd + '_hand'] += w * MP.wrapd(hand - A[sd + '_hand'])
        return A, hip, feet

    def at(self, t):
        self._t = t
        return self.pose(t)

    def anchor_standing(self, lid, take, tau0=0.0):
        """Anchor layer lid as if the take had started standing at tau0 (so a take entered mid way keeps its height)."""
        k = self.L / take.leg
        self.anchor[lid] = (np.zeros(2), take.at(tau0)[take.b.ix['Hips']] * k)


def with_ik(perf, fn):
    """fn(t, W0, pose) may change pose (e.g. rig.ik2) before the final forward kinematics."""
    rig = perf.r
    orig = rig.fk

    def fk(pose, dt=None):
        if dt is not None and fn is not None:
            W0 = orig(pose)
            fn(perf._t, W0, pose)
        return orig(pose, dt)
    rig.fk = fk
    return perf


def pingpong(t, a, b, speed=0.25, phase=0.0):
    """tau wandering back and forth inside [a, b] at a slow speed (holds that still breathe)."""
    L = b - a
    u = ((t * speed + phase) % (2 * L))
    return a + (u if u < L else 2 * L - u)
