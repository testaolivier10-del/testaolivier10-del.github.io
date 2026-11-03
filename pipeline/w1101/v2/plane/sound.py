"""Sound for the survivorship bias rebuild: music that follows the story and swells into the fix, each place's own
ambience (dawn airfield, a hollow fuselage, a quiet office at night, wind at altitude), a real sound on every action."""
import sys
sys.path.insert(0, '/home/claude/plane')
import numpy as np
from mix import Mix, load, score, finish, drone, lp, bp, SR
import build as B

DUR = B.DUR
M = Mix(DUR); t = M.t
at = B.at
S2, S3, S4, S4B, S5, S6, S7 = B.T_S2, B.T_S3, B.T_S4, B.T_S4B, B.T_S5, B.T_S6, B.T_S7


def win(a, b, fade=0.25):
    return np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)


# S1 dawn airfield: soft wind, birds, the bomber's engines throttling down, tyres on touchdown
M.noise_bed(150, 900, 0.40, win(0, S2) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * t)))
M.put(M.amb, load('birds_real'), 0.2, 0.18, maxlen=S2 - 0.2)
eng = np.zeros(M.N); drone(M, 0, S2 + 0.3, 38, 0.55, eng)
M.fx += eng * np.clip(1 - (t - 1.3) / 2.0, 0.35, 1)
M.put(M.fx, load('sizzle_real'), 1.15, 0.30, maxlen=0.6)
M.put(M.fx, load('bagdrop_real'), 1.2, 0.55, maxlen=0.4)
M.put(M.fx, load('cloth_real'), 0.7, 0.25)                                   # crewman lifts his hand
# S2 inside the fuselage: hollow room tone, metal ticks as it cools, footsteps, a hand on metal
M.noise_bed(60, 300, 0.55, win(S2, S3))
for k in range(5): M.put(M.fx, load('glass_clink_real'), S2 + 0.4 + k * 0.8, 0.07, maxlen=0.15)
for k in range(3): M.put(M.fx, load('bagdrop_real'), S2 + 0.6 + k * 0.42, 0.18, maxlen=0.2)
M.put(M.fx, load('cloth_real'), S2 + 1.9, 0.3)
M.put(M.fx, load('whoosh_real'), S3 - 0.25, 0.45)
# S3 hangar: a big room tone, the red marks tick on as named, plates clank down on "more armor right there"
M.noise_bed(80, 600, 0.35, win(S3, S4))
for w in ('wings', 'tail', 'body'):
    for k in range(5): M.put(M.fx, load('pop'), at(w) + k * 0.09, 0.16)
for k, d in enumerate((0.05, 0.2, 0.35)):
    M.put(M.fx, load('clank'), at('armor', 2) + d + 0.35, 0.55)
# S4a office at night: quiet room, clock like ticks, the lamp hum; S4b pencil on paper for the circles
M.noise_bed(100, 400, 0.18, win(S4, S5))
M.noise_bed(118, 122, 0.05, win(S4, S5))
for k in range(int((S5 - S4) / 0.5)): M.put(M.fx, load('pop'), S4 + 0.3 + k * 0.5, 0.025)
M.put(M.fx, load('page_flip_real'), S4 + 0.5, 0.3)
M.put(M.fx, load('pencil'), at('missing'), 0.35); M.put(M.fx, load('pencil'), at('missing') + 0.5, 0.3)
M.put(M.fx, load('whoosh_real'), S5 - 0.25, 0.5)
# S5 altitude: wind, the formation's drone, flak, the engine hit on the word, the dive
M.noise_bed(300, 2000, 0.28, win(S5, S6))
drone(M, S5, S6, 31, 0.32, M.amb)
for f0 in (S5 + 0.3, S5 + 1.0, S5 + 2.4, S5 + 3.3):
    M.put(M.fx, load('thunder_real'), f0, 0.32, maxlen=1.0)
hit = at('engines')
M.put(M.fx, load('thunder_real'), hit - 0.06, 0.9, maxlen=2.2)
M.put(M.fx, load('fire_real'), hit, 0.25, maxlen=2.5)
dive = np.sin(2 * np.pi * (300 * (t - hit) - 50 * (t - hit) ** 2)) * ((t > hit + 0.3) & (t < hit + 3.0)) * np.exp(-np.clip(t - hit - 0.3, 0, None) * 0.9)
M.fx += 0.10 * dive
# S6 the field again: wind, birds, footsteps of the two counting
M.noise_bed(150, 900, 0.35, win(S6, S7))
M.put(M.amb, load('birds_real'), S6 + 0.1, 0.14, maxlen=S7 - S6)
for k in range(6): M.put(M.fx, load('bagdrop_real'), S6 + 0.2 + k * 0.45, 0.12, maxlen=0.15)
M.put(M.fx, load('whoosh_real'), S7 - 0.25, 0.45)
# S7 the fix: plates lift, land on the engines and cockpit, the rings ring out; engines start for the loop
M.noise_bed(80, 600, 0.30, win(S7, DUR))
M.put(M.fx, load('swish'), S7 + 0.05, 0.35)
for k in range(5): M.put(M.fx, load('clank'), at('armor', 3) + 0.4 + k * 0.06, 0.45)
M.put(M.fx, load('shimmer'), at("aren't") + 0.05, 0.45)
eng2 = np.zeros(M.N); drone(M, B.T_END - 0.3, DUR, 38, 0.35, eng2); M.fx += eng2 * np.clip((t - B.T_END + 0.3) / 1.0, 0, 1)

# music: low D minor pad under the damage, darker under the planners, a lift on Wald's question, tension in the sky,
# then resolving to D major and swelling into the armor landing on the engines
chords = [(0.0, (73.42, 110.0, 146.83, 174.61)), (S3, (65.41, 98.0, 130.81, 155.56)), (S4, (58.27, 87.31, 116.54, 146.83, 174.61)),
          (S5, (69.30, 103.83, 138.59, 164.81)), (S6, (65.41, 98.0, 130.81, 164.81)), (S7, (73.42, 110.0, 146.83, 185.0, 220.0))]
music = score(M.N, t, chords, at('armor', 3) + 0.4, cutoff=1500, bright=((587.3, 740.0, 880.0), at('armor', 3)))
finish(M, '/home/claude/plane/vo/vo.wav', music, '/home/claude/plane/out', music_gain=0.30)
