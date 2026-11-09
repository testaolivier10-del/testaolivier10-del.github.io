"""Foot locked walk for the people kit (video standard section 3: the planted foot stays on its spot and moves backward
relative to the hips at exactly the body's travel speed; the lifted foot swings forward in the direction of travel).

The walk is driven by DISTANCE travelled (hip x in pose units), so any time remap (slow motion) keeps the feet locked.
Plants alternate every S pose units; each foot is planted for one step (S of travel) and swings for one step.
Legs are solved with two bone IK (hip to ankle), knee forward. Hip height comes from the deeper (planted) leg, so the
body rises over the planted foot and dips at the hand over, as a real walk does."""
import math
from airman2 import L_THIGH as LT, L_SHIN as LS

S = 520.0          # step length in pose units (about 0.72 m on a 1.8 m man)
HS = (LT + LS) * 0.975   # stance hip to ankle height
LIFT = 70.0


def leg_ik(dx, dy):
    """hip to ankle offset (dx forward, dy down) -> thigh angle, knee angle (degrees, the kit's convention)"""
    d = min(math.hypot(dx, dy), LT + LS - 0.5)
    phi = math.atan2(dx, dy)
    al = math.acos(max(-1, min(1, (LT * LT + d * d - LS * LS) / (2 * LT * d))))
    be = math.acos(max(-1, min(1, (LS * LS + d * d - LT * LT) / (2 * LS * d))))
    a1 = phi + al; a2 = phi - be
    return math.degrees(a1), math.degrees(a2 - a1)


def foot(dist, side):
    """ankle x (in travel units, same frame as dist) and lift for one foot. side 0 = near, 1 = far."""
    # foot `side` is planted on [ (2k+side) S - S/2 , (2k+side) S + S/2 ] of hip travel, at ankle x = (2k+side) S + S/2 ...
    u = (dist - side * S) / (2 * S)          # one full cycle of this foot = 2 S of travel
    k = math.floor(u); f = u - k            # f in [0,1): first half planted, second half swinging
    plant = (2 * k + side) * S + S / 2      # where this foot is planted during the first half (centred under hip mid stance)
    if f < 0.5:
        return plant, 0.0, 0.0
    g = (f - 0.5) / 0.5                     # swing progress 0..1
    nxt = plant + 2 * S
    e = g * g * (3 - 2 * g)
    return plant + (nxt - plant) * e, LIFT * math.sin(math.pi * g), g


def legs(dist, scale_stop=1.0):
    """pose kwargs for both legs at travel `dist`. scale_stop < 1 blends to standing (feet together under the hip)."""
    out = {}
    for side, s in ((0, 'n'), (1, 'f')):
        ax, lift, g = foot(dist, side)
        dx = (ax - dist) * scale_stop
        th, kn = leg_ik(dx, HS - 22 * (dx / (S / 2)) ** 2 - lift * scale_stop)
        out['thigh_' + s] = th; out['knee_' + s] = min(0.0, kn)
        out['ank_' + s] = (-12 * math.sin(math.pi * g) if g > 0 else 0.0) * scale_stop
    return out


def arms(dist, scale_stop=1.0):
    """arms swing against the legs (near arm forward when the far leg is forward)"""
    ph = math.pi * dist / S
    sw = 16 * math.sin(ph) * scale_stop
    return dict(uarm_n=-2 - sw, elbow_n=18, uarm_f=-2 + sw, elbow_f=18, hand_n='flat', hand_f='flat')


def gait_check(dists, scale):
    """planted ankle world x drift (px) while planted; must stay ~0"""
    worst = 0.0
    for side in (0, 1):
        prev = None
        for d in dists:
            ax, lift, g = foot(d, side)
            if g == 0.0:
                if prev is not None and prev[0] == 0.0: worst = max(worst, abs(ax - prev[1]) * scale)
                prev = (0.0, ax)
            else:
                prev = (g, ax)
    return worst
