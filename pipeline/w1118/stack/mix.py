"""Restrained mix (pattern: /home/claude/lt/mix.py). Voice leads; composed score (take B) about 20 dB under with a 4 dB duck;
a far clock ticking about 26 dB under (the library at night); 5 effects about 10 dB under: four book slides on the pushes and
one soft wood knock as the stack settles past the edge. No whooshes; two pass loudnorm to -14 LUFS, true peak -1.5 dBTP."""
import json, subprocess
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt
SR = 44100; OUT = '/home/claude/w1118/stack/out'; MUS = '/home/claude/w1118/stack/snd/m_b.mp3'
DUR = 41.6; N = int(DUR * SR); t = np.arange(N) / SR
fx = np.zeros(N); amb = np.zeros(N); LOG = []
rng = np.random.default_rng(3)


def bp(x, lo, hi, o=4): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)


def slide(t0, dur, seed):
    """a hardback sliding on a hardback: broadband friction, brighter as it speeds up, a small grab at the start and the stop"""
    r = np.random.default_rng(seed); n = int((dur + 0.15) * SR); tt = np.arange(n) / SR
    v = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 0.8                     # the push speed (ease in and out)
    x = bp(r.normal(0, 1, n), 500, 5200) * (0.45 + 0.55 * v)
    x += 0.5 * bp(r.normal(0, 1, n), 150, 700) * v
    grain = 1 + 0.35 * bp(r.normal(0, 1, n), 8, 40, 2) / 0.05
    x *= np.clip(grain, 0.3, 1.8) * v
    for tg in (0.02, dur):                                                 # tiny grab and stop
        i = int(tg * SR); k = np.exp(-np.arange(int(0.05 * SR)) / (0.008 * SR)); x[i:i + len(k)] += 0.8 * bp(r.normal(0, 1, len(k)), 300, 3000)[:len(x) - i] * k[:len(x) - i]
    i = int(t0 * SR); fx[i:i + n] += 0.9 * x / (np.abs(x).max() + 1e-9); LOG.append(('slide', t0))


def knock(t0, g=1.0):
    n = int(0.5 * SR); tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / 0.07) + 0.5 * np.sin(2 * np.pi * 420 * tt) * np.exp(-tt / 0.04)
         + 0.4 * bp(rng.normal(0, 1, n), 800, 4000) * np.exp(-tt / 0.006))
    i = int(t0 * SR); fx[i:i + n] += g * x / np.abs(x).max(); LOG.append(('knock', t0))


slide(13.75, 1.2, 1); slide(15.95, 0.75, 2); slide(17.15, 0.7, 3); slide(18.35, 0.7, 4)
knock(19.05, 0.9)
# a wall clock far off in the reading room: one soft tick a second, heavily low passed (distance)
for k in range(int(DUR)):
    i = int((0.4 + k) * SR); n = int(0.06 * SR); tt = np.arange(n) / SR
    x = bp(rng.normal(0, 1, n), 1500, 4500) * np.exp(-tt / 0.004) + 0.3 * np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt / 0.01)
    amb[i:i + n] += (0.8 if k % 2 else 0.6) * x[:max(0, min(n, N - i))]
amb = sosfilt(butter(2, 2600, fs=SR, output='sos'), amb)

mus, _ = librosa.load(MUS, sr=SR, mono=True); mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load(f'{OUT}/voice.wav', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
shape = np.interp(t, [0, 8.2, 12.9, 19.5, 20.2, 24.0, 32.1, 36.5, 39.9, DUR], [0.9, 0.85, 0.95, 1.0, 1.25, 1.0, 1.05, 1.15, 1.3, 1.25])
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15; vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


lev = np.ones(N)
for a, b in ((0, 8.25), (8.25, 12.95), (12.95, 19.6), (19.6, 24.0), (24.0, 32.15), (32.15, DUR)):
    m = (t >= a) & (t < b); lev[m] = 10 ** ((-18 - db(mus[m])) / 20)
kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
mus = to(mus * lev * shape * duck, 20, sp)
fx = to(fx, 10)
amb = to(amb, 26, sp) * 0 + amb * 10 ** ((vref - 26 - db(amb[np.abs(amb) > 1e-3])) / 20) * 0.5   # ticks are transient: keep them well under
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
print('fx', LOG, '| music vs voice in speech', round(db(mus[sp2]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1), '| clock', round(db(amb[np.abs(amb) > 1e-3]) - vref, 1))
