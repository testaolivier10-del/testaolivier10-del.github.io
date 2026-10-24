"""The runner's performance in mocap time M (seconds of real motion), all real CMU motion capture:
   104_55 StartRun (standing, then the leaning launch) -> phase matched crossfade into 09_01 (steady run)
   -> 09_01 looped on a matched stride (period 0.74 s). Screen time maps to M through a speed curve
   (slow motion and freezes), see clock()."""
import sys
sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig'); sys.path.insert(0, '/home/claude/runner')
import numpy as np
import mocap_perf as MP
from mocap_perf import xfade



def repair(T, thresh=0.3, pad=3):
    """Mocap clean up: marker swaps in the raw capture show as one or two frame spikes in a joint's acceleration.
    For each leg, frames around a spike are rebuilt by a cubic fitted to the clean frames on both sides
    (the whole chain knee, ankle, toe together, so the leg stays rigid)."""
    ix = T.b.ix; S = T.S; nf = len(S); fixed = []
    for sd in ('Left', 'Right'):
        chain = [ix[sd + j] for j in ('Leg', 'Foot', 'ToeBase')]
        acc = np.max([np.linalg.norm(np.diff(S[:, j], 2, axis=0), axis=1) for j in chain], axis=0)
        bad = np.zeros(nf, bool); bad[1:-1] = acc > thresh; bad[:6] = False
        i = 0
        while i < nf:
            if not bad[i]:
                i += 1; continue
            a = i
            while i < nf and (bad[i] or bad[min(i + 1, nf - 1)] or bad[min(i + 2, nf - 1)]):
                i += 1
            a0, b0 = max(a - pad, 6), min(i + pad, nf - 4)
            ctx = np.r_[np.arange(a0 - 4, a0), np.arange(b0 + 1, b0 + 5)]
            for j in chain:
                for k in range(2):
                    c = np.polyfit(ctx, S[ctx, j, k], 3)
                    S[a0:b0 + 1, j, k] = np.polyval(c, np.arange(a0, b0 + 1))
            fixed.append((sd, round(a0 / T.fps, 3), round(b0 / T.fps, 3)))
    # the foot: its angle to the shin must stay anatomical (plantar flexion up to about 55 degrees, dorsi flexion
    # about 30); frames where the side view foot collapses (out of plane) or flips are rebuilt from the clean
    # frames around them, with the toe at the foot's usual length
    for sd in ('Left', 'Right'):
        kn, an, to = ix[sd + 'Leg'], ix[sd + 'Foot'], ix[sd + 'ToeBase']
        v = S[:, to] - S[:, an]; k = S[:, an] - S[:, kn]
        L = np.linalg.norm(v, axis=1); Lm = float(np.median(L[6:]))
        fa = np.arctan2(v[:, 1], v[:, 0]); sa = np.arctan2(k[:, 1], k[:, 0])
        rel = (fa - sa + np.pi) % (2 * np.pi) - np.pi
        ok = (L > 0.6 * Lm) & (rel > np.radians(-125)) & (rel < np.radians(-35))
        ok[:6] = True
        if (~ok[6:]).any():
            good = np.where(ok)[0]
            r2 = np.interp(np.arange(nf), good, np.unwrap(rel[good]))
            for f in np.where(~ok)[0]:
                a_ = sa[f] + r2[f]
                S[f, to] = S[f, an] + Lm * np.array([np.cos(a_), np.sin(a_)])
            fixed.append((sd + ' foot', int((~ok[6:]).sum())))
    return fixed


START = MP.Take('104_55', near='Left')
RUN = MP.Take('09_01', near='Left')
FIXED = repair(START) + repair(RUN)
TAU0 = 1.25                 # standing still, just before the launch
MX = 2.86 - TAU0            # crossfade centre (104_55 at 2.86 matches 09_01 at 0.365)
B_IN, B_LOOP0, B_LOOP1 = 0.365, 0.305, 1.045
PER = B_LOOP1 - B_LOOP0
XW, LW = 0.10, 0.05
import math
LEAN_CARRY = math.radians(20.0)   # the launch lean, eased out after the switch to the steady run
RUN_CAL = math.radians(4.0)       # 09_01's rest posture was measured while running: put back a runner's slight forward lean


def plan_m(M):
    out = []
    wa = 1 - xfade(M, MX - XW, MX + XW)
    if wa > 1e-4:
        out.append(('start', START, TAU0 + M, wa))
    if M > MX - XW:
        k = 0; m0 = MX; b0 = B_IN
        layers = []
        while True:
            mk_end = m0 + (B_LOOP1 - b0)           # where this layer reaches the loop point
            layers.append((k, m0, b0, mk_end))
            if M < mk_end - LW:
                break
            k += 1; m0 = mk_end; b0 = B_LOOP0
        for k, m0, b0, mend in layers:
            w_in = xfade(M, MX - XW, MX + XW) if k == 0 else xfade(M, m0 - LW, m0 + LW)
            w_out = 1 - xfade(M, mend - LW, mend + LW)
            w = w_in * w_out
            if w > 1e-4:
                out.append((f'run{k}', RUN, b0 + (M - m0), w))
    return out


def smooth(u):
    u = min(max(u, 0.0), 1.0); return u * u * (3 - 2 * u)


def extra_m(M):
    """Procedural layer on top of the recording (radians of forward trunk lean)."""
    w = xfade(M, MX - XW, MX + XW)
    return dict(spine=w * (RUN_CAL + LEAN_CARRY * (1 - smooth((M - MX + XW) / 0.85))))
