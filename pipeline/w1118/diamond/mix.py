"""Restrained mix (pattern: /home/claude/lt/mix.py). Voice leads; composed score (take B) about 20 dB under with a 4 dB duck; desert wind about
26 dB under; 4 effects about 10 dB under on the actions that matter; no whooshes; two pass loudnorm to -14 LUFS, true peak -1.5 dBTP."""
import json, subprocess, sys
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt
SR = 44100; SFX = '/home/claude/lp/assets'; OUT = '/home/claude/w1118/diamond/out'; MUS = '/home/claude/w1118/diamond/snd/take_b.mp3'
sys.path[:0] = ['/home/claude/w1118/diamond', '/home/claude/short', '/home/claude/guy']
import build as B
DUR = B.DUR
N = int(DUR * SR); t = np.arange(N) / SR
fx = np.zeros(N); USE = {}; LOG = []


def load(path):
    x, _ = librosa.load(path, sr=SR, mono=True); return x / (np.abs(x).max() or 1)


def put(name, t0, g=1.0, start=0.0, maxlen=None, fade_out=0.12, fade_in=0.01, rate=1.0, lp=None, why=''):
    USE[name] = USE.get(name, 0) + 1; LOG.append((round(t0, 2), name, why))
    x = load(f'{SFX}/{name}.wav')[int(start * SR):]
    if rate != 1.0: x = librosa.resample(x, orig_sr=SR, target_sr=int(SR / rate))
    if lp: x = sosfilt(butter(4, lp, 'low', fs=SR, output='sos'), x)
    if maxlen: x = x[:int(maxlen * SR)]
    i = int(t0 * SR); n = min(len(x), N - i)
    env = np.ones(n); b = max(1, int(fade_out * SR)); env[-min(b, n):] *= np.linspace(1, 0, min(b, n))
    a = max(1, int(fade_in * SR)); env[:a] *= np.linspace(0, 1, a)
    fx[i:i + n] += g * x[:n] * env


put('water_pour_real', 0.08, 0.55, start=0.25, maxlen=0.55, fade_out=0.25, lp=3000, why='the stranger lifts the bottle: water sloshes')
put('glass_clink_real', B.T8 + 0.44, 0.45, start=0.0, maxlen=0.3, fade_out=0.2, rate=1.7, why="ring tick as the stranger's fingers close on it")
put('water_pour_real', B.T8 + 0.92, 0.7, start=0.3, maxlen=0.5, fade_out=0.25, lp=3000, why='the bottle changes hands: slosh')
put('bubbling_real', B.T9B + 0.3, 0.5, start=0.35, maxlen=1.2, fade_out=0.4, fade_in=0.1, lp=1800, why='he drinks: water glugs in the bottle')
# the cap: a few tiny plastic ratchet clicks while his fingers twist it (synthesized: short filtered noise ticks)
rng0 = np.random.default_rng(9); hp = butter(2, 2500, 'high', fs=SR, output='sos')
for k, tw in enumerate((B.T9 + 0.08, B.T9 + 0.31)):
    for j in range(5):
        i = int((tw + j * 0.03 + rng0.uniform(0, 0.008)) * SR); n = int(0.004 * SR)
        fx[i:i + n] += 0.5 * sosfilt(hp, rng0.normal(0, 1, n)) * np.exp(-np.arange(n) / (0.0012 * SR))
LOG.append((round(B.T9 + 0.08, 2), 'synth cap clicks', 'his fingers twist the cap (two turns)')); USE['cap_clicks_synth'] = 1

# desert wind, richer: a low body with slow random gusts, a faint whistle whose pitch drifts with the gusts, and sand hiss on the strong gusts
rng = np.random.default_rng(4)
def slow(n, hz, seed):
    r = np.random.default_rng(seed); k = max(2, int(len(t) / SR * hz) + 2)
    return np.interp(np.linspace(0, k - 1, n), np.arange(k), r.uniform(0, 1, k))
g = slow(N, 0.35, 1) * 0.6 + slow(N, 1.1, 2) * 0.4; g = np.convolve(g, np.ones(2205) / 2205, 'same')
body = sosfilt(butter(2, [60, 420], 'band', fs=SR, output='sos'), np.cumsum(rng.normal(0, 1, N)) * 0.02 + rng.normal(0, 0.3, N)) * (0.35 + g)
f = 640 + 380 * g; ph = 2 * np.pi * np.cumsum(f) / SR
whistle = np.sin(ph) * (0.5 + 0.5 * np.sin(ph * 1.003)) * np.clip(g - 0.45, 0, 1) ** 1.5 * 0.5
whistle = sosfilt(butter(2, [400, 1600], 'band', fs=SR, output='sos'), whistle + 0.2 * rng.normal(0, 1, N) * np.clip(g - 0.45, 0, 1))
hiss = sosfilt(butter(2, 3500, 'high', fs=SR, output='sos'), rng.normal(0, 1, N)) * np.clip(g - 0.35, 0, 1) ** 2 * 0.6
wind = body / (np.abs(body).max() or 1) + 0.5 * whistle / (np.abs(whistle).max() or 1) + 0.35 * hiss / (np.abs(hiss).max() or 1)
wind *= np.interp(t, [0, 0.3, B.T3, B.T3 + 0.3, B.T4, B.T4 + 0.3, B.T5, B.T5 + 0.3, B.T8, B.T10, DUR], [0.2, 1, 1, 0.8, 0.8, 0.35, 0.35, 1, 1, 0.7, 0.8])  # quieter under the memory of home

mus, _ = librosa.load(MUS, sr=SR, mono=True)
# the score was composed for the untrimmed voice: cut it at the same two places (80 ms crossfades) so its sections land on the cuts again
_parts = []; _last = 0.0
for _a, _b in ((11.05, 11.40), (31.45, 31.70)):
    _parts.append(mus[int(_last * SR):int(_a * SR)]); _last = _b
_parts.append(mus[int(_last * SR):]); _fd = int(0.08 * SR); _m = _parts[0]
for _p in _parts[1:]:
    _m = np.concatenate([_m[:-_fd], _m[-_fd:] * np.linspace(1, 0, _fd) + _p[:_fd] * np.linspace(0, 1, _fd), _p[_fd:]])
mus = _m; mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load(f'{OUT}/voice_t.wav', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
shape = np.interp(t, [0, B.T3, B.T5, B.T5 + 1.9, B.T6A - 1.1, B.T6A, B.T8, B.T10, DUR], [1.0, 0.95, 0.9, 0.7, 0.75, 0.9, 1.0, 1.25, 1.25])
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15; vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


lev = np.ones(N)
for a, b in ((0, B.T3), (B.T3, B.T5), (B.T5, B.T6A), (B.T6A, B.T8), (B.T8, DUR)):
    m = (t >= a) & (t < b); lev[m] = 10 ** ((-18 - db(mus[m])) / 20)
kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
mus = to(mus * lev * shape * duck, 20, sp)
fx = to(fx, 10)
wind = to(wind, 26)
fade = np.clip(t / 0.03, 0, 1) * np.clip((DUR - t) / 0.9, 0, 1)
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v + fx + wind + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{OUT}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-2.2:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{OUT}/{name}.wav'], check=True)
sp2 = env > 0.2
print('uses', USE); print('effects', LOG)
print('music vs voice in speech', round(db(mus[sp2]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1), '| wind', round(db(wind) - vref, 1))
