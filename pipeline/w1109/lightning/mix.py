"""Restrained mix (pattern: w1104 mix.py). Voice leads; composed score about 20 dB under with a 4 dB duck; 4 effects about 10 dB under,
placed in pauses, never on a key word; no whooshes; two pass loudnorm to -14 LUFS, true peak -1.5 dBTP."""
import json, subprocess
import numpy as np, soundfile as sf, librosa
SR = 44100; SFX = '/home/claude/lp/assets'; OUT = '/home/claude/lt/out'; MUS = '/home/claude/lt/snd/lt_a.mp3'
DUR = 40.0; N = int(DUR * SR); t = np.arange(N) / SR
fx = np.zeros(N); USE = {}


def load(path):
    x, _ = librosa.load(path, sr=SR, mono=True); return x / (np.abs(x).max() or 1)


def put(name, t0, g=1.0, maxlen=None, fade_out=0.15, fade_in=0.0):
    USE[name] = USE.get(name, 0) + 1
    x = load(f'{SFX}/{name}.wav')
    if maxlen: x = x[:int(maxlen * SR)]
    i = int(t0 * SR); n = min(len(x), N - i)
    env = np.ones(n); b = max(1, int(fade_out * SR)); env[-min(b, n):] *= np.linspace(1, 0, min(b, n))
    if fade_in: a = int(fade_in * SR); env[:a] *= np.linspace(0, 1, a)
    fx[i:i + n] += g * x[:n] * env


put('thunder_real', 0.12, 1.0, maxlen=4.0, fade_out=1.6)        # the strike
put('thunder_real', 13.6, 0.5, maxlen=2.6, fade_out=1.4)        # lightning flips that
put('thunder_real', 17.78, 0.6, maxlen=2.6, fade_out=1.4)       # heart and breathing stop
put('heartbeat_real', 21.95, 0.55, maxlen=3.9, fade_out=0.8, fade_in=0.2)   # the heart restarts
put('gasp_male_real', 38.62, 0.6, maxlen=1.4, fade_out=0.5)     # he breathes on his own
r_ = load(f'{SFX}/rain_real.wav'); reps = int(np.ceil(N / len(r_))); bed = np.tile(r_, reps)[:N]
fx += 0.16 * bed * np.interp(t, [0, 0.4, 7.2, 7.6, 17.4, 17.8, 30.2, 30.6, 37.5, DUR], [0, 1, 1, 0.45, 0.45, 0.6, 0.6, 1, 0.8, 0.25])

mus, _ = librosa.load(MUS, sr=SR, mono=True); mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load(f'{OUT}/voice.wav', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
shape = np.interp(t, [0, 7.2, 7.6, 17.4, 17.8, 30.2, 34.0, 38.4, DUR], [1.0, 1.0, 0.85, 0.9, 0.7, 0.75, 0.95, 1.3, 1.25])
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15; vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


# level the score section by section first so a quiet section in the take cannot vanish
lev = np.ones(N)
for a, b in ((0, 7.3), (7.3, 13.5), (13.5, 17.6), (17.6, 30.4), (30.4, DUR)):
    m = (t >= a) & (t < b); lev[m] = 10 ** ((-18 - db(mus[m])) / 20)
kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
mus = to(mus * lev * shape * duck, 20, sp)
fx = to(fx, 10)
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.9, 0, 1)
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v + fx + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{OUT}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{OUT}/{name}.wav'], check=True)
sp2 = env > 0.2
print('uses', USE, '| music vs voice in speech', round(db(mus[sp2]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1))
