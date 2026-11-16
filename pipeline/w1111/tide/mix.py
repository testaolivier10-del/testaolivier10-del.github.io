"""Restrained mix (pattern: lt/mix.py). Voice leads; composed score about 20 dB under with a 4 dB duck; a synthesized gentle surf bed about 26 dB under;
5 effects about 10 dB under, in pauses; no whooshes or risers; two pass loudnorm to -14 LUFS, true peak -1.5 dBTP."""
import json, subprocess
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt
SR = 44100; SFX = '/home/claude/lp/assets'; OUT = '/home/claude/w1111/tide/out'; MUS = '/home/claude/w1111/tide/snd/td_b.mp3'
DUR = 39.4; N = int(DUR * SR); t = np.arange(N) / SR
rng = np.random.default_rng(3)
fx = np.zeros(N); USE = []


def band(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)


def load(path):
    x, _ = librosa.load(path, sr=SR, mono=True); return x / (np.abs(x).max() or 1)


def put(x, t0, g, name):
    i = int(t0 * SR); n = min(len(x), N - i); fx[i:i + n] += g * x[:n]; USE.append((name, round(t0, 2), g))


def wash(dur, att, lo=350, hi=3200, seed=0):
    """one small wave sliding up the sand and hissing back: shaped noise, honest and simple"""
    n = int(dur * SR); tt = np.arange(n) / SR; r = np.random.default_rng(seed)
    x = band(r.normal(0, 1, n), lo, hi) + 0.5 * band(r.normal(0, 1, n), 2500, 7000) * np.clip((tt - att) / (dur - att), 0, 1) ** 0.5
    env = np.clip(tt / att, 0, 1) ** 1.6 * np.exp(-np.clip(tt - att, 0, None) / (0.42 * (dur - att)))
    x = x * env; return x / (np.abs(x).max() or 1)


def clip_real(name, maxlen, fade_out=0.3):
    x = load(f'{SFX}/{name}.wav')[:int(maxlen * SR)]; b = int(fade_out * SR); x[-b:] *= np.linspace(1, 0, b); return x


put(wash(2.4, 0.8, seed=1), 0.05, 0.45, 'wave sliding in (synth)')                 # the thin wave at frame zero
put(wash(1.5, 0.45, seed=2), 9.72, 0.5, 'wave round the stick (synth)')            # does he?
rush = wash(3.6, 2.5, lo=250, hi=2600, seed=4)                                    # the sea crossing the flat: swells through hours 3 and 4
put(rush, 28.35, 0.6, 'water rush across the flat (synth)')
put(clip_real('splash_real', 1.5), 31.46, 0.8, 'splash_real at the wheels')
put(clip_real('splash_real', 1.1, 0.5), 35.0, 0.3, 'splash_real, small lap at the car')
# surf bed: low rumble of the sea plus slow breaking swells
low = band(rng.normal(0, 1, N), 90, 900); hiss = band(rng.normal(0, 1, N), 900, 5200)
sw = np.zeros(N)
for k in range(9):
    t0 = -2.0 + k * 5.3 + rng.uniform(-0.8, 0.8); u = t - t0
    sw += np.where(u > 0, np.clip(u / 1.9, 0, 1) ** 1.5 * np.exp(-np.clip(u - 1.9, 0, None) / 1.5), 0)
bed = low / np.abs(low).max() * (0.5 + 0.3 * sw) + hiss / np.abs(hiss).max() * (0.12 + 0.6 * sw)
bed *= np.interp(t, [0, 0.3, 3.9, 9.7, 10.8, 27.9, 31.0, 32.5, 34.8, 38.4, DUR], [0, 1, 1, 0.9, 0.6, 0.6, 1.1, 0.8, 1.0, 1.0, 0.5])

mus, _ = librosa.load(MUS, sr=SR, mono=True); mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load(f'{OUT}/voice.wav', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
shape = np.interp(t, [0, 9.7, 10.8, 27.5, 28.4, 31.5, 32.6, 37.6, 38.4, DUR], [1.0, 1.0, 0.85, 0.9, 1.15, 1.15, 0.95, 1.0, 1.3, 1.25])
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15; vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


lev = np.ones(N)                                              # level the score section by section so a quiet section cannot vanish
for a, b in ((0, 9.7), (9.7, 18.8), (18.8, 27.9), (27.9, 32.5), (32.5, DUR)):
    m = (t >= a) & (t < b); lev[m] = 10 ** ((-18 - db(mus[m])) / 20)
kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
mus = to(mus * lev * shape * duck, 20, sp)
fx = to(fx, 10)
bed = to(bed, 26, sp)
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.9, 0, 1)
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v + fx + bed + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{OUT}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{OUT}/{name}.wav'], check=True)
sp2 = env > 0.2
print('effects', USE)
print('music vs voice in speech', round(db(mus[sp2]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1), '| bed', round(db(bed[sp2]) - vref, 1))
for nm, a, b in (('rush', 29.0, 31.0), ('splash', 31.46, 32.2), ('wave0', 0.3, 2.0)):
    m = (t >= a) & (t < b); print(nm, 'fx vs voice', round(db(fx[m]) - vref, 1))
