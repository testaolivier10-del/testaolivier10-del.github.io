"""Sound: hot parade ground (crowd, flags, birds), the clock, the x-ray heart, the pump squelches and valve clicks, the
heart slowing and a ringing as his vision closes, the fall and the thud, then the pump running again."""
import sys
sys.path[:0] = ['/home/claude/guard2', '/home/claude/plane']
import numpy as np
from mix import Mix, load, score, finish, drone, lp, bp, SR
import build as B

DUR = B.DUR
M = Mix(DUR); t = M.t
at = B.at


def win(a, b, fade=0.3):
    return np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)


out_scene = win(0, B.T_C) + win(B.T_G, DUR)
# the parade ground: a soft wind, distant crowd murmur and birds, flags
M.noise_bed(200, 1400, 0.30, np.clip(out_scene, 0, 1))
M.put(M.amb, load('birds_real'), 0.2, 0.12, maxlen=B.T_C - 0.3)
M.put(M.amb, load('birds_real'), B.T_G + 0.2, 0.12, maxlen=DUR - B.T_G)
for k in range(3): M.put(M.amb, load('cloth_real'), 0.6 + k * 1.9, 0.08)
# the clock ticking behind him (time passing)
for k in range(int((B.T_C - B.T_B) / 0.5)): M.put(M.fx, load('pop'), B.T_B + 0.2 + k * 0.5, 0.05)
# x-ray: a whoosh in, the room goes quiet and close, his heartbeat
M.put(M.fx, load('whoosh_real'), B.T_C - 0.25, 0.45)
M.noise_bed(60, 260, 0.30, win(B.T_C, B.T_G))
for k in range(int((B.T_G - B.T_C) / 0.9)):
    tt = B.T_C + 0.3 + k * 0.9 * (1 + 0.25 * max(0, (B.T_C + k * 0.9 - B.T_F) / 6))
    if tt < B.T_G: M.put(M.fx, load('heartbeat_real'), tt, 0.22, maxlen=0.6)
M.put(M.fx, load('bubbling_real'), at('climb'), 0.14, maxlen=2.4)
M.put(M.fx, load('swish'), at('gravity'), 0.35)
M.put(M.fx, load('swish'), at("can't") + 0.1, 0.25)
# the lens: each squeeze a soft squelch, each valve shutting a small click
M.put(M.fx, load('whoosh_real'), B.T_D, 0.3)
for tp in B.pump(0) and B.PULSES:
    if B.T_D < tp < B.T_E or tp > at('flex') - 0.2:
        M.put(M.fx, load('water_pour_real'), tp, 0.10, maxlen=0.45)
        M.put(M.fx, load('pop'), tp + 0.5, 0.12)
# blood pools, less to the brain: a thin high ring rises as the vision closes
ring = np.sin(2 * np.pi * 3600 * t) * np.clip((t - at('brain')) / 1.0, 0, 1) * (t < B.FALL + 0.4)
M.fx += 0.018 * ring
# the fall: cloth, the thud on the gravel, a gasp from the crowd
M.put(M.fx, load('cloth_real'), B.FALL, 0.4)
M.put(M.fx, load('bagdrop_real'), B.FALL + 0.6, 0.9, maxlen=0.6)
M.put(M.fx, load('thunder_real'), B.FALL + 0.58, 0.25, maxlen=0.5)
M.put(M.fx, load('gasp_male_real'), B.FALL + 0.75, 0.25)
M.put(M.fx, load('whoosh_real'), B.T_H - 0.25, 0.35)
# the neighbour: boot leather creaks with each wiggle
for k in range(4): M.put(M.fx, load('cloth_real'), at('wiggle') + k * 0.4, 0.12, maxlen=0.25)
M.put(M.fx, load('shimmer'), at('running'), 0.3)

chords = [(0.0, (73.42, 110.0, 146.83, 174.61)), (B.T_C, (65.41, 98.0, 130.81, 164.81)), (B.T_E, (58.27, 87.31, 116.54, 146.83)),
          (B.T_F, (55.0, 82.41, 110.0, 130.81)), (B.T_H, (73.42, 110.0, 146.83, 185.0, 220.0))]
music = score(M.N, t, chords, at('running'), cutoff=1500, bright=((587.3, 740.0, 880.0), at('running')))
finish(M, '/home/claude/guard2/vo/vo.wav', music, '/home/claude/guard2/out', music_gain=0.28)
