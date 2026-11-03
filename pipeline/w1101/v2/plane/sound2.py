"""Sound for the script rebuild: each place has its own ambience (altitude wind and engines, dawn airfield, a hangar,
a quiet office at night), a real sound on every action, music that darkens under the losses and resolves into the fix."""
import sys
sys.path.insert(0, '/home/claude/plane')
import numpy as np
from mix import Mix, load, score, finish, drone, lp, bp, SR
import build2 as B

DUR = B.DUR
M = Mix(DUR); t = M.t
at, atc = B.at, B.atc
TB, TC, TD, TE, TF, TG, TH, TI, TJ = B.T_B, B.T_C, B.T_D, B.T_E, B.T_F, B.T_G, B.T_H, B.T_I, B.T_J


def win(a, b, fade=0.25):
    return np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)


def sky_sounds(a, b, flak, hits):
    M.noise_bed(300, 2000, 0.28, win(a, b))
    drone(M, a, b, 31, 0.32, M.amb)
    for f0 in flak: M.put(M.fx, load('thunder_real'), f0, 0.30, maxlen=1.0)
    for h in hits:
        M.put(M.fx, load('thunder_real'), h - 0.06, 0.8, maxlen=2.0)
        M.put(M.fx, load('fire_real'), h, 0.22, maxlen=2.0)
        dive = np.sin(2 * np.pi * (300 * (t - h) - 50 * (t - h) ** 2)) * ((t > h + 0.3) & (t < min(b, h + 3.0))) * np.exp(-np.clip(t - h - 0.3, 0, None) * 0.9)
        M.fx += 0.08 * dive


# A the formation in flak; three go down
sky_sounds(0, TB, [0.25, 0.7, 2.0, 3.0], [1.2, at('never') - 0.05, at('back') - 0.1])
M.put(M.fx, load('whoosh_real'), TB - 0.25, 0.4)
# B dawn landing: wind, birds, engines throttling down, tyres, the airman's sleeve
M.noise_bed(150, 900, 0.40, win(TB, TC))
M.put(M.amb, load('birds_real'), TB + 0.1, 0.18, maxlen=TC - TB - 0.2)
eng = np.zeros(M.N); drone(M, TB, TC + 0.3, 38, 0.55, eng)
M.fx += eng * np.clip(1 - (t - TB - 1.3) / 2.0, 0.35, 1)
M.put(M.fx, load('sizzle_real'), TB + 1.15, 0.30, maxlen=0.6)
M.put(M.fx, load('bagdrop_real'), TB + 1.2, 0.55, maxlen=0.4)
M.put(M.fx, load('cloth_real'), TB + 0.7, 0.25)
M.put(M.fx, load('whoosh_real'), TC - 0.25, 0.4)
# C, D, E, I the hangar: big room tone throughout
M.noise_bed(80, 600, 0.35, win(TC, TF))
M.noise_bed(80, 600, 0.35, win(TI, TJ))
for w in ('wings', 'tail', 'body'):
    for k in range(5): M.put(M.fx, load('pop'), at(w) + k * 0.09, 0.16)
# D the plate on chains: rattle as it drops, a heavy clank as it settles
for k in range(8): M.put(M.fx, load('glass_clink_real'), TD + 0.02 + k * 0.05, 0.12, maxlen=0.12)
M.put(M.fx, load('clank'), TD + 0.32, 0.9)
M.put(M.fx, load('thunder_real'), TD + 0.30, 0.25, maxlen=0.5)
for k in range(3): M.put(M.fx, load('glass_clink_real'), TD + 0.7 + k * 0.6, 0.06, maxlen=0.12)
M.put(M.fx, load('swish'), TE - 0.15, 0.3)
# E plates drop onto wings, tail, body
p = at('put')
for d in (0.0, 0.18, 0.36): M.put(M.fx, load('clank'), p + d + 0.35, 0.5)
M.put(M.fx, load('whoosh_real'), TF - 0.25, 0.45)
# F the office at night: quiet room, lamp hum, a clock, a page turning
M.noise_bed(100, 400, 0.18, win(TF, TH))
M.noise_bed(118, 122, 0.05, win(TF, TH))
for k in range(int((TH - TF) / 0.5)): M.put(M.fx, load('pop'), TF + 0.3 + k * 0.5, 0.025)
M.put(M.fx, load('page_flip_real'), TF + 0.4, 0.3)
# G the pencil: quick dabs as the dots sweep, then the circles round the engines
e = at('everywhere')
for k in range(10): M.put(M.fx, load('pencil'), e - 0.4 + k * 0.14, 0.12)
M.put(M.fx, load('pencil'), at('engines'), 0.35); M.put(M.fx, load('pencil'), at('engines') + 0.45, 0.3)
M.put(M.fx, load('whoosh_real'), TH - 0.25, 0.5)
# H the engine hit
sky_sounds(TH, TI, [TH + 0.3, TH + 0.9, TH + 3.3], [at('engines', 2)])
M.put(M.fx, load('whoosh_real'), TI - 0.25, 0.45)
# I the reframe and the fix
M.put(M.fx, load('shimmer'), at('show'), 0.25)
M.put(M.fx, load('swish'), atc('So') + 0.05, 0.35)
for k in range(4): M.put(M.fx, load('clank'), at('armor', 2) + 0.4 + k * 0.06, 0.45)
M.put(M.fx, load('shimmer'), at("aren't") + 0.05, 0.45)
M.put(M.fx, load('whoosh_real'), TJ - 0.25, 0.4)
# J the field of survivors; the name; engines start for the loop
M.noise_bed(150, 900, 0.35, win(TJ, DUR))
M.put(M.amb, load('birds_real'), TJ + 0.1, 0.14, maxlen=DUR - TJ)
for k in range(8): M.put(M.fx, load('bagdrop_real'), TJ + 0.2 + k * 0.45, 0.10, maxlen=0.15)
M.put(M.fx, load('shimmer'), at('survivorship') + 0.05, 0.35)
eng2 = np.zeros(M.N); drone(M, B.T_END - 0.3, DUR, 38, 0.35, eng2); M.fx += eng2 * np.clip((t - B.T_END + 0.3) / 1.0, 0, 1)

# music: D minor under the losses, darker under the obvious plan, a lift on Wald, tension at the engine hit,
# then D major swelling into the armor moving to the engines; it settles under the name
chords = [(0.0, (73.42, 110.0, 146.83, 174.61)), (TC, (65.41, 98.0, 130.81, 155.56)), (TF, (58.27, 87.31, 116.54, 146.83, 174.61)),
          (TH, (69.30, 103.83, 138.59, 164.81)), (TI, (65.41, 98.0, 130.81, 164.81)), (atc('So'), (73.42, 110.0, 146.83, 185.0, 220.0))]
music = score(M.N, t, chords, at('armor', 2) + 0.4, cutoff=1500, bright=((587.3, 740.0, 880.0), at('armor', 2)))
finish(M, '/home/claude/plane/vo2/vo.wav', music, '/home/claude/plane/out2', music_gain=0.30)
