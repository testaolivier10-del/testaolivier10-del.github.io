"""Restrained mix (pattern: /home/claude/lt/mix.py). Voice leads; composed score (take B) about 20 dB under with a 4 dB duck; birdsong
ambience of the fields about 26 dB under; four effects about 10 dB under: the milk pour (real, slowed to cover the pour), cloth as he
swings the churn upright (real), two soft seed scatters (synthesized: a short burst of tiny grain ticks over a breathy rustle).
No whooshes. Two pass loudnorm to -14 LUFS, true peak -1.5 dBTP."""
import json, subprocess
import numpy as np, soundfile as sf, librosa
import sys, json as _j
sys.path[:0] = ['/home/claude/w1118/thunen']
_TM = _j.load(open('/home/claude/w1118/thunen/out/timemap.json'))
_O = np.array([0.0] + _TM['old'] + [45.0]); _N = np.array([0.0] + _TM['new'] + [_TM['new'][-1] + (45.0 - _TM['old'][-1])])
def M(x): return float(np.interp(x, _O, _N))
SR = 44100; SFX = '/home/claude/lp/assets'; OUT = '/home/claude/w1118/thunen/out'; MUS = '/home/claude/w1118/thunen/snd/th_b.mp3'
_W = _j.load(open('/home/claude/w1118/thunen/out/words.json')); DUR = round(_W[-1]['t1'] + 0.15 + 0.7, 2); N = int(DUR * SR); t = np.arange(N) / SR
fx = np.zeros(N); amb = np.zeros(N); USE = {}


def load(path):
    x, _ = librosa.load(path, sr=SR, mono=True); return x / (np.abs(x).max() or 1)


def put(x, t0, g=1.0, fade_out=0.15, fade_in=0.0, name=None, buf=None):
    buf = fx if buf is None else buf
    if name: USE[name] = USE.get(name, 0) + 1
    i = int(t0 * SR); n = min(len(x), N - i)
    env = np.ones(n); b = max(1, int(fade_out * SR)); env[-min(b, n):] *= np.linspace(1, 0, min(b, n))
    if fade_in: a = int(fade_in * SR); env[:a] *= np.linspace(0, 1, a)
    buf[i:i + n] += g * x[:n] * env


pour = librosa.effects.time_stretch(load(f'{SFX}/water_pour_real.wav'), rate=0.85)
put(pour, M(0.0), 0.9, fade_out=0.3, name='water_pour_real')                       # the soured milk pouring into the ditch
put(pour[int(0.4 * SR):], M(3.0), 0.8, fade_in=0.25, fade_out=0.9, name='water_pour_real')
put(load(f'{SFX}/cloth_real.wav'), M(5.62), 0.55, fade_out=0.3, name='cloth_real')    # he swings the churn upright


def seed_scatter(seed):
    r = np.random.default_rng(seed); n = int(0.75 * SR); x = np.zeros(n)
    hiss = r.normal(0, 1, n); hiss = np.convolve(hiss, [1, -0.95], 'same'); env = np.exp(-np.linspace(0, 6, n)) * np.minimum(1, np.linspace(0, 30, n))
    x += 0.12 * hiss * env
    for _ in range(140):                                                          # each grain a tiny tick, landing spread over half a second
        k = int(r.uniform(0.05, 0.7) * SR); L = 90; tick = r.normal(0, 1, L) * np.exp(-np.linspace(0, 8, L))
        if k + L < n: x[k:k + L] += r.uniform(0.15, 0.5) * tick
    return x / np.abs(x).max()


put(seed_scatter(1), M(40.6), 0.7, fade_out=0.2, name='seed_scatter_synth')
put(load(f'{SFX}/glass_clink_real.wav')[:int(0.5 * SR)], M(39.27), 0.45, fade_out=0.2, name='glass_clink_real')   # the coins landing in his palm
b_ = load(f'{SFX}/birds_real.wav'); bed = np.tile(b_, int(np.ceil(N / len(b_))))[:N]
amb += bed * np.interp(t, [0, 0.3, M(9.0), M(9.1), M(13.6), M(13.8), M(38.5), M(38.7), DUR], [1, 1, 1, 0.25, 0.25, 0.35, 0.35, 1, 0.8])

mus, _ = librosa.load(MUS, sr=SR, mono=True); mus = librosa.effects.time_stretch(mus, rate=45.0 / (DUR + 0.2)); mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load(f'{OUT}/voice.wav', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
shape = np.interp(t, [0, M(9.0), M(13.7), M(23.6), M(35.9), M(38.6), M(41.3), DUR], [1.0, 0.9, 0.95, 1.05, 0.8, 1.15, 1.25, 1.25])
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15; vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


lev = np.ones(N)                                     # level the score section by section so no section vanishes
for a, b in ((0, M(9.07)), (M(9.07), M(13.71)), (M(13.71), M(23.62)), (M(23.62), M(35.63)), (M(35.63), M(38.63)), (M(38.63), DUR)):
    m = (t >= a) & (t < b); lev[m] = 10 ** ((-18 - db(mus[m])) / 20)
kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
mus = to(mus * lev * shape * duck, 20, sp)
fx = to(fx, 10); amb = to(amb, 26, sp)
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.9, 0, 1)
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v + fx + amb + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{OUT}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{OUT}/{name}.wav'], check=True)
sp2 = env > 0.2
print('uses', USE, '| music vs voice in speech', round(db(mus[sp2]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1), '| amb', round(db(amb[sp2]) - vref, 1))
