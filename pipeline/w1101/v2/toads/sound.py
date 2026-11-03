"""Sound for the cane toads rebuild: a warm field (wind, insects, birds), the crate rattling with the toads inside, the beetles
chewing, the lid, the hops, the snake, a quiet map room with the years ticking, a night road with frogs and a car; music that
starts curious, sours at the poison and swells into "millions"."""
import sys
sys.path[:0] = ['/home/claude/toads2', '/home/claude/plane']
import numpy as np
from mix import Mix, load, score, finish, drone, SR
import build as B

DUR = B.DUR
M = Mix(DUR); t = M.t; T = B.T


def win(a, b, fade=0.25):
    return np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)


# A field, crate rattling (in the same windows the picture rattles)
M.noise_bed(150, 900, 0.35, win(0, B.SHOT_D) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * t)))
M.noise_bed(3500, 7000, 0.06, win(0, B.SHOT_D) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)))          # insects
M.put(M.amb, load('birds_real'), 0.2, 0.14, maxlen=B.SHOT_B1)
for k in range(4):
    for j in range(5): M.put(M.fx, load('glass_clink_real'), k * 1.6 + 0.03 + j * 0.09, 0.05, maxlen=0.1)
    M.put(M.fx, load('bagdrop_real'), k * 1.6 + 0.05, 0.12, maxlen=0.2)
M.put(M.fx, load('whoosh_real'), B.SHOT_B1 - 0.25, 0.3)
# B1 beetles chewing: dry crunches
for k in range(int((B.SHOT_B2 - B.SHOT_B1) / 0.13)):
    M.put(M.fx, load('pen_scratch_real'), B.SHOT_B1 + 0.1 + k * 0.13, 0.12, maxlen=0.08)
# B2 lid off, toads hop out
b2 = B.SHOT_B2
M.put(M.fx, load('door_close_real'), b2 + 0.15, 0.25, maxlen=0.4)
M.put(M.fx, load('bagdrop_real'), b2 + 0.62, 0.4, maxlen=0.3)
for i in range(10):
    for n in range(4): M.put(M.fx, load('bounce_real'), b2 + 0.8 + i * 0.28 + n * 0.75, 0.06, maxlen=0.15)
# C the failed leap
lp_ = B.old.T['high']
M.put(M.fx, load('swish'), lp_, 0.25); M.put(M.fx, load('bagdrop_real'), lp_ + 0.95, 0.35, maxlen=0.3)
# D tongues, the snake, the poison
for i in range(3): M.put(M.fx, load('pop'), T['ate'] + i * 0.45, 0.3)
hiss = np.random.default_rng(2).normal(0, 1, int(0.8 * SR)) * np.exp(-np.arange(int(0.8 * SR)) / SR * 3)
M.put(M.fx, hiss, T['poisonous'] - 0.6, 0.05)
M.put(M.fx, load('whoosh_real'), T['many'] - 0.45, 0.35)
M.put(M.fx, load('bagdrop_real'), T['many'] - 0.15, 0.3, maxlen=0.3)
M.put(M.fx, load('bubbling_real'), T['many'] + 0.1, 0.12, maxlen=0.9)
# E, F the maps: a calm sea bed; the year ticks as the range spreads
M.noise_bed(80, 500, 0.25, win(B.SHOT_E, B.SHOT_G))
M.put(M.fx, load('whoosh_real'), B.SHOT_E - 0.25, 0.35)
for w in ('predators', 'diseases'): M.put(M.fx, load('pop'), T[w], 0.25)
y0, y1 = T['inaus'] + 0.2, T['invasive'] + 0.8
for k in range(18): M.put(M.fx, load('pop'), y0 + (y1 - y0) * k / 18, 0.06)
M.put(M.fx, load('shimmer'), T['invasive'], 0.25)
M.put(M.fx, load('whoosh_real'), B.SHOT_G - 0.25, 0.4)
# G night road: frogs and crickets, a car idling behind the headlights, toads hopping
M.noise_bed(2500, 6000, 0.08, win(B.SHOT_G, DUR) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * t)))
eng = np.zeros(M.N); drone(M, B.SHOT_G, DUR, 28, 0.25, eng); M.amb += eng
for k in range(24): M.put(M.fx, load('bounce_real'), B.SHOT_G + 0.3 + k * 0.33, 0.05, maxlen=0.15)
M.put(M.fx, load('shimmer'), T['first'], 0.3)

chords = [(0.0, (65.41, 98.0, 130.81, 164.81, 196.0)), (B.SHOT_C, (58.27, 87.31, 116.54, 146.83)), (T['poisonous'], (55.0, 82.41, 110.0, 130.81)),
          (B.SHOT_E, (65.41, 98.0, 130.81, 155.56)), (B.SHOT_F, (49.0, 73.42, 98.0, 116.54)), (B.SHOT_G, (55.0, 82.41, 110.0, 130.81, 164.81))]
music = score(M.N, t, chords, T['millions'], cutoff=1500)
finish(M, '/home/claude/toads2/vo/vo.wav', music, '/home/claude/toads2/out', music_gain=0.30)
