"""Restrained mix for the great smog Short (pattern: w1109 lightning and w1110 dive mix.py). The voice leads. Under it: a low city hush
(about 26 dB under), four effects on what matters, about 10 dB under at their loudest and placed around the words: the flare's hiss (shots 1, 2, 9),
the bus's diesel idle (shots 1 and 9), one low tone when the lid settles, one cough far off in the five days. The composed score about 20 dB
under with a 4 dB duck. No whooshes, no risers. Two pass loudnorm to -14 LUFS, true peak -1.5 dBTP.   usage: python3 mix.py music.mp3"""
import sys, json, subprocess
sys.path[:0] = ['/home/claude/w1111/smog']
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, sosfilt
import build as B
SR = 44100; SFX = '/home/claude/lp/assets'; OUT = '/home/claude/w1111/smog/out'
MUS = sys.argv[1]
DUR = B.DUR; N = int(DUR * SR); t = np.arange(N) / SR
rng = np.random.default_rng(1952)


def load(path):
    x, _ = librosa.load(path, sr=SR, mono=True); return x / (np.abs(x).max() or 1)


def filt(x, lo=None, hi=None, order=2):
    if lo and hi: sos = butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    elif lo: sos = butter(order, lo, 'highpass', fs=SR, output='sos')
    else: sos = butter(order, hi, 'lowpass', fs=SR, output='sos')
    return sosfilt(sos, x)


def looped(x, n, xf=0.5):
    k = int(xf * SR); lp = x.copy(); lp[:k] = lp[:k] * np.linspace(0, 1, k) + x[-k:] * np.linspace(1, 0, k); lp = lp[:-k]
    return np.tile(lp, int(np.ceil(n / len(lp))))[:n]


db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
v, _ = librosa.load(f'{OUT}/voice.mp3', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
sp = env > 0.15; vref = db(v[sp])
speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


# the hush of a city with no traffic and no wind: low filtered noise that breathes slowly
bed = filt(rng.normal(0, 1, N), 60, 420) + 0.25 * filt(rng.normal(0, 1, N), 800, 2400)
bed *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
bed *= np.interp(t, [0, 0.4, B.T3, B.T4, B.T5, B.T7, B.T7 + 0.4, B.T9, DUR], [0, 1, 1, 0.6, 0.6, 0.7, 1.15, 1.15, 1.0])
bed = to(bed, 26, sp)
# 1 the flare: a steady fierce hiss (real sizzle, looped) with a little crackle from the real fire under it
hiss = filt(looped(load(f'{SFX}/sizzle_real.wav'), N, 0.4), 1500, None) + 0.35 * filt(looped(load(f'{SFX}/fire_real.wav'), N, 1.0), 500, None)
hiss *= 0.86 + 0.14 * np.sin(2 * np.pi * 7.3 * t) * np.sin(2 * np.pi * 3.1 * t)
g_h = np.interp(t, [0, 0.15, B.T2 - 0.05, B.T2 + 0.1, B.T3 - 0.1, B.T3 + 0.1, B.T3 + 2.4, B.T9 - 0.05, B.T9 + 0.2, B.T9B, DUR - 0.3, DUR], [0, 1.0, 1.0, 0.3, 0.3, 0.7, 0.0, 0.0, 0.8, 1.0, 1.0, 0.6])       # muffled behind the glass in the cab shot
hiss = to(hiss, 13) * g_h * (1 - 0.35 * speech)
# 2 the bus: a diesel idling (made here): low firing pulses with a band of mechanical clatter
f0 = 23.0; ph = 2 * np.pi * f0 * t + 0.4 * np.sin(2 * np.pi * 0.6 * t)
pulse = np.clip(np.sin(ph), 0, 1) ** 3
dies = 0.9 * np.sin(2 * ph) + 0.6 * np.sin(4 * ph + 0.5) + 0.35 * np.sin(6 * ph + 1.1) + 0.2 * np.sin(8 * ph)
dies = dies * (0.55 + 0.45 * pulse) + 0.5 * filt(rng.normal(0, 1, N), 140, 700) * pulse
dies = filt(dies, 55, 900)
g_d = np.interp(t, [0, 0.3, B.T1B, B.T2 - 0.05, B.T2 + 0.1, B.T3 - 0.1, B.T3 + 0.5, B.T9, B.T9 + 0.3, B.T9B, DUR - 0.5, DUR], [0, 0.7, 0.85, 1.0, 1.5, 1.5, 0.0, 0.0, 0.8, 1.0, 1.2, 0.9])       # louder inside the cab
dies = to(dies, 12) * g_d * (1 - 0.3 * speech)
# 3 the lid settles: one low tone
fx = np.zeros(N); i0 = int((B.T_LID - 0.02) * SR); n = int(2.6 * SR); tt = np.arange(n) / SR
tone = (np.sin(2 * np.pi * (58 - 6 * np.minimum(tt, 0.3)) * tt) + 0.5 * np.sin(2 * np.pi * 116 * tt) * np.exp(-tt / 0.5) + 0.25 * np.sin(2 * np.pi * 174 * tt) * np.exp(-tt / 0.25)) * np.exp(-tt / 0.75) * np.clip(tt / 0.012, 0, 1)
tone += 0.5 * filt(rng.normal(0, 1, n), 40, 220) * np.exp(-tt / 0.12)
lid = np.zeros(N); lid[i0:i0 + n] = tone[:N - i0] if i0 + n > N else tone
lid = to(lid, 13.5, np.abs(lid) > 0.05 * np.abs(lid).max())
# 4 one cough, far off down the street (the real recording, dulled and set back)
cg = filt(load(f'{SFX}/cough_real.wav'), 200, 2200); tc = B.WD.end_of('days') + 0.12
cough = np.zeros(N); j0 = int(tc * SR); cough[j0:j0 + len(cg)] += cg
tail = np.zeros(N); d_ = int(0.11 * SR); tail[j0 + d_:j0 + d_ + len(cg)] += 0.35 * cg; d2 = int(0.23 * SR); tail[j0 + d2:j0 + d2 + len(cg)] += 0.16 * filt(cg, None, 1200)
cough = to(cough + tail, 17)
# 5 two careful footfalls on the wet setts in the boots insert (made here): a dull heel knock and a short gritty scuff, placed on the picture's heel strikes
steps_fx = np.zeros(N)
for ts in (B.T_INS + 0.30, B.T_INS + 1.15):
    n_ = int(0.32 * SR); tq = np.arange(n_) / SR
    knock = np.sin(2 * np.pi * (150 - 240 * tq) * tq) * np.exp(-tq / 0.03) + 0.7 * filt(rng.normal(0, 1, n_), 300, 1800) * np.exp(-tq / 0.022)
    scuff = 0.35 * filt(rng.normal(0, 1, n_), 1200, 5000) * np.exp(-((tq - 0.11) / 0.05) ** 2)
    k0 = int(ts * SR); steps_fx[k0:k0 + n_] += knock + scuff
steps_fx = to(steps_fx, 14)
mus_, _ = librosa.load(MUS, sr=SR, mono=True); mus_ = np.pad(mus_, (0, max(0, N - len(mus_))))[:N]
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
lev = np.ones(N)
for a, b in ((0, B.T2), (B.T2, B.T4), (B.T4, B.T5), (B.T5, B.T6), (B.T6, B.T7), (B.T7, B.T9), (B.T9, 42.8)):
    mk = (t >= a) & (t < b); lev[mk] = 10 ** ((-18 - db(mus_[mk])) / 20)
lev[t >= 42.8] = lev[(t >= B.T9) & (t < 42.8)][0]
kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
shape = np.interp(t, [0, B.T2, B.T3, B.T4, B.T5, B.T_LID, B.T6, B.T7, B.T8, B.T9, B.T9B, DUR], [0.8, 0.8, 0.95, 0.95, 0.9, 1.1, 0.9, 0.95, 0.85, 1.0, 1.25, 1.25])
mus = to(mus_ * lev * shape * duck, 20, sp)
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.9, 0, 1)
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v + bed + hiss + dies + lid + cough + steps_fx + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{OUT}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-2.2:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{OUT}/{name}.wav'], check=True)
sp2 = env > 0.2
act = lambda x: x[np.abs(x) > 0.02 * np.abs(x).max()]
print('levels vs voice (dB): bed', round(db(bed[sp2]) - vref, 1), '| hiss shot 1', round(db(hiss[(t > 0.3) & (t < 3)]) - vref, 1), '| diesel shot 1', round(db(dies[(t > 0.3) & (t < 3)]) - vref, 1),
      '| lid tone first 0.6 s', round(db(lid[i0:i0 + int(0.6 * SR)]) - vref, 1), '| cough', round(db(act(cough)) - vref, 1), '| music in speech', round(db(mus[sp2]) - vref, 1))
print('footfalls at', round(B.T_INS + 0.30, 2), round(B.T_INS + 1.15, 2), 'level', round(db(act(steps_fx)) - vref, 1))
print('times: hiss 0.0 to', round(B.T3 + 2.4, 2), 'and', round(B.T9, 2), 'to end | diesel 0.0 to', round(B.T3 + 0.6, 2), 'and', round(B.T9, 2), 'to end | lid tone', round(B.T_LID, 2), '| cough', round(tc, 2))
