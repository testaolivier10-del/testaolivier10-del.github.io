"""Restrained mix (pattern: /home/claude/lt/mix.py). Voice leads; composed score about 20 dB under with a 4 dB duck; the place's ambience about
26 dB under (a quiet town morning with birds on the street, a low room tone in the vault); 4 effects about 10 dB under on the actions that
matter (the vault door opening, the packs of notes being grabbed in the run, the vault door shutting, a soft chime when INSURED lands);
no whooshes or risers; two pass loudnorm to -14 LUFS, true peak -1.5 dBTP."""
import sys, json, subprocess
sys.path[:0] = ['/home/claude/w1111/bank']
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt
import build as B
SR = 44100; SFX = '/home/claude/lp/assets'; OUT = '/home/claude/w1111/bank/out'; MUS = '/home/claude/w1111/bank/snd/bank_b.mp3'
DUR = B.DUR; N = int(DUR * SR); t = np.arange(N) / SR
fx = np.zeros(N); USE = []
rng = np.random.default_rng(3)


def load(name):
    x, _ = librosa.load(f'{SFX}/{name}.wav', sr=SR, mono=True); return x / (np.abs(x).max() or 1)


def put(x, t0, g=1.0, fade_out=0.15, name=None):
    i = int(max(0, t0) * SR); n = min(len(x), N - i); env = np.ones(n); b = max(1, min(n, int(fade_out * SR))); env[-b:] *= np.linspace(1, 0, b)
    fx[i:i + n] += g * x[:n] * env
    if name: USE.append((name, round(t0, 2)))


door = load('door_close_real'); flip = load('page_flip_real')
t_open = B.T3 + 1.3; t_shut = B.TE + 0.8
put(door, t_open - 0.33, 0.7, name='vault door opens (door_close_real)')
grabs = [a['t0'] + a['d'] * 0.45 for a in B.ACTS if a['kind'] == 'take' and a['t0'] > B.T7]
for k, g in enumerate(grabs):                                # paper: each pack leaving the shelf in the run
    x = librosa.resample(flip, orig_sr=SR, target_sr=int(SR * (0.9 + 0.2 * rng.random())))
    put(x[int(0.3 * SR):int(0.95 * SR)], g - 0.24, 0.5 + 0.06 * k, fade_out=0.2, name='packs grabbed (page_flip_real)' if k in (0, len(grabs) - 1) else None)
put(door, t_shut - 0.33, 1.0, name='vault door shuts (door_close_real)')
tc = np.arange(int(1.6 * SR)) / SR                           # a soft chime, synthesized: two bell notes a fifth apart
chime = (np.sin(2 * np.pi * 880 * tc) * np.exp(-tc / 0.45) + 0.5 * np.sin(2 * np.pi * 1760 * tc) * np.exp(-tc / 0.25) + 0.7 * np.sin(2 * np.pi * 1318.5 * (tc - 0.09)) * np.exp(-np.clip(tc - 0.09, 0, None) / 0.5) * (tc > 0.09)) * np.clip(tc / 0.004, 0, 1)
put(chime / np.abs(chime).max(), B.T_INS - 0.3 + 0.42, 0.75, fade_out=0.4, name='soft chime as INSURED lands (synthesized)')

# ambience
birds = load('birds_real'); xf = int(0.5 * SR); L_ = len(birds) - xf; bed = np.zeros(N + len(birds))
i = 0
while i < N:
    w = np.ones(len(birds)); w[:xf] = np.linspace(0, 1, xf); w[-xf:] = np.linspace(1, 0, xf); bed[i:i + len(birds)] += birds * w; i += L_
bed = bed[:N]
air = sosfilt(butter(2, [200, 1800], 'bandpass', fs=SR, output='sos'), rng.normal(0, 1, N)); air /= np.abs(air).max()
room = sosfilt(butter(2, 160, 'lowpass', fs=SR, output='sos'), rng.normal(0, 1, N)); room /= np.abs(room).max()
street = np.interp(t, [0, 0.3, B.T3 + 0.9, B.T3 + 1.6, B.TE + 0.9, B.TE + 1.6, DUR - 1.0, DUR], [0, 1, 1, 0, 0, 1, 0.8, 0.3])
amb = (0.5 * bed + 0.22 * air) * street + 0.9 * room * (1 - street) * np.clip(t / 0.3, 0, 1)

mus, _ = librosa.load(MUS, sr=SR, mono=True); mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load(f'{OUT}/voice.wav', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
shape = np.interp(t, [0, B.T3, B.T3 + 1.5, B.T7, B.T_DRY, B.T_DRY + 0.4, B.T8, B.T_INS - 0.3, B.T_INS + 0.3, B.T_CTA, DUR], [1.0, 1.0, 0.85, 0.9, 1.1, 0.7, 0.8, 0.85, 1.15, 1.1, 1.2])
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15; vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


lev = np.ones(N)                                             # level the score section by section so a quiet section cannot vanish
for a, b in ((0, 8.2), (8.2, 20.9), (20.9, 25.4), (25.4, 31.2), (31.2, 37.7), (37.7, DUR)):
    m = (t >= a) & (t < b); lev[m] = 10 ** ((-18 - db(mus[m])) / 20)
kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
mus = to(mus * lev * shape * duck, 20, sp)
fx = to(fx, 10); amb = to(amb, 26, np.ones(N, bool))
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.9, 0, 1)
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v + fx + amb + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{OUT}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-2.6:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-2.6:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{OUT}/{name}.wav'], check=True)
sp2 = env > 0.2
print('effects', USE)
print('music vs voice in speech', round(db(mus[sp2]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1), '| ambience', round(db(amb) - vref, 1))
