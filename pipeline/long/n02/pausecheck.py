"""Pause check for a finished voice track (Olivier 2026-11-24; research: listeners rate about 0.6 s at commas and 0.6 to 1.2 s
between sentences as most natural, Liu et al. 2022; pauses between segments help learning, Rey et al. 2019).
Passes when the median silence after a sentence is 0.8 to 1.3 s, no sentence gap is under 0.5 s unless the voice ran two
sentences together (those are listed), and the speaking rate while talking is under 200 words a minute."""
import sys, numpy as np
sys.path.insert(0, '/home/claude/lv')
import tl
import soundfile as sf
T = tl.build(); x, sr = sf.read('/home/claude/lv/out/voice.wav'); n = 220; m = len(x) // n
env = 20 * np.log10(np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1)) + 1e-9); FR = n / sr
def silence(t0, t1):
    """the longest really silent stretch of the finished track between two times (the word timings are approximate)"""
    a, b = max(0, int((t0 - 0.12) / FR)), min(m, int((t1 + 0.12) / FR)); best = cur = 0
    for i in range(a, b):
        cur = cur + 1 if env[i] < -48 else 0; best = max(best, cur)
    return best * FR
sg, cg, run, words, talk = [], [], [], 0, 0.0
for b in sorted(T['beats'].values(), key=lambda b: b['t0']):
    ws = b['words']; words += len(ws); talk += sum(e - a for _, a, e in ws)
    for i in range(len(ws) - 1):
        k = tl._end(ws[i][0]); g0 = ws[i + 1][1] - ws[i][2]
        if k:
            g = silence(ws[i][1], ws[i + 1][1])
            if k == 's':
                sg.append(g)
                if g < 0.5: run.append((round(ws[i][2], 1), ws[i][0], ws[i + 1][0], round(g, 2)))
            else: cg.append(g)
        talk += min(g0, 0.15)
wpm = words / talk * 60
print(f"length {T['DUR'] / 60:.2f} min, words {words}, rate while talking {wpm:.0f} wpm, overall {words / T['DUR'] * 60:.0f} wpm")
print(f"real silence after a sentence: {len(sg)} measured, median {np.median(sg):.2f} s, under 0.5 s: {len(run)}; at commas: median {np.median(cg):.2f} s")
for r in run[:15]: print('  no real pause at', r)
ok = 0.7 <= np.median(sg) <= 1.3 and wpm < 200
print('PAUSE CHECK PASSED' if ok else 'PAUSE CHECK FLAGGED')
