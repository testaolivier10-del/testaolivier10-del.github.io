"""Restrained mix for the dive reflex Short (pattern: w1109 lightning mix.py). The voice leads. Under it: the underwater ambience of the place
(about 26 dB under), her heartbeat following the SAME beat times as the picture, so you hear it slow and then pick up (about 14 dB under),
three effects on the moments that matter (the plunge, the bubbles after it, her first kick up), about 10 dB under, and the composed score about
20 dB under with a 4 dB duck when one is given. No whooshes. Two pass loudnorm to -14 LUFS, true peak -1.5 dBTP.
usage: python3 mix.py [music.mp3]"""
import sys, json, subprocess
sys.path[:0] = ['/home/claude/short', '/home/claude/mh', '/home/claude/dv']
import numpy as np, soundfile as sf, librosa
import build as B
SR = 44100; SFX = '/home/claude/lp/assets'; OUT = '/home/claude/dv/out'
MUS = sys.argv[1] if len(sys.argv) > 1 else None
DUR = B.DUR; N = int(DUR * SR); t = np.arange(N) / SR


def load(path):
    x, _ = librosa.load(path, sr=SR, mono=True); return x / (np.abs(x).max() or 1)


def put(buf, x, t0, g=1.0, maxlen=None, fade_out=0.15, fade_in=0.0):
    if maxlen: x = x[:int(maxlen * SR)]
    i = int(t0 * SR); n = min(len(x), N - i)
    if n <= 0: return
    env = np.ones(n); b = max(1, min(n, int(fade_out * SR))); env[-b:] *= np.linspace(1, 0, b)
    if fade_in: a = min(n, int(fade_in * SR)); env[:a] *= np.linspace(0, 1, a)
    buf[i:i + n] += g * x[:n] * env


db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
v, _ = librosa.load(f'{OUT}/voice.mp3', sr=SR, mono=True); v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
sp = env > 0.15; vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


# ambience: the muffled water of the place, a little brighter under the surface (shot 2) and on the way up
amb = load(f'{SFX}/underwater_real.wav'); xf = int(1.0 * SR); loop = amb.copy(); loop[:xf] = loop[:xf] * np.linspace(0, 1, xf) + amb[-xf:] * np.linspace(1, 0, xf); loop = loop[:-xf]
bed = np.tile(loop, int(np.ceil(N / len(loop))))[:N]
bed *= np.interp(t, [0, 0.5, B.T2, B.T2 + 0.3, B.T3, B.T3 + 0.4, B.T9, DUR - 1.0, DUR], [0, 1, 1, 1.25, 1.25, 0.8, 0.9, 1.3, 0.9])
bed = to(bed, 26)
# heartbeat: one beat cut from the real recording, laid on every beat of the picture
hb = load(f'{SFX}/heartbeat_real.wav'); e = np.abs(hb); pk = int(np.argmax(e[:int(1.2 * SR)])); one = hb[max(0, pk - int(0.05 * SR)):pk + int(0.42 * SR)].copy()
one *= np.hanning(2 * len(one))[len(one):] ** 0.5
hbuf = np.zeros(N)
for b in B.BEATS:
    if b < DUR - 0.3: put(hbuf, one, max(0.0, b - 0.05), 1.0, fade_out=0.08)
hgain = np.interp(t, [0, B.T2, B.T2 + 0.2, B.T3 - 0.2, B.T3, B.T4, B.T5, B.T5 + 0.5, B.T6, B.T6 + 0.3, B.T7, B.T7 + 0.3, B.T9, DUR - 0.8, DUR], [0.8, 0.8, 0.35, 0.35, 0.9, 1.25, 1.25, 0.8, 0.8, 1.0, 1.0, 0.6, 0.9, 1.0, 0.5])
hbuf = to(hbuf, 14) * hgain
# three effects
fx = np.zeros(N)
put(fx, load(f'{SFX}/splash_real.wav'), 6.5, 1.0, maxlen=1.7, fade_out=0.7)                     # her face meets the water
put(fx, load(f'{SFX}/bubbling_real.wav'), 6.95, 0.5, maxlen=2.2, fade_out=1.2, fade_in=0.15)     # the bubbles after the plunge
put(fx, load(f'{SFX}/bubbling_real.wav')[int(3 * SR):], B.T9 + 0.05, 0.4, maxlen=1.8, fade_out=1.2, fade_in=0.2)   # her first kicks up
# keep effects off the brightest speech band a little so words stay clear
fx = to(fx, 10)
mus = np.zeros(N)
if MUS:
    m_, _ = librosa.load(MUS, sr=SR, mono=True); m_ = np.pad(m_, (0, max(0, N - len(m_))))[:N]
    speech = np.clip(env * 4, 0, 1); k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
    duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
    lev = np.ones(N)
    for a, b in ((0, B.T2), (B.T2, B.T3), (B.T3, B.T5), (B.T5, B.T7), (B.T7, B.T9), (B.T9, DUR)):
        mk = (t >= a) & (t < b); lev[mk] = 10 ** ((-18 - db(m_[mk])) / 20)
    kk = int(0.6 * SR); lev = np.convolve(np.pad(lev, kk, mode='edge'), np.ones(kk) / kk, 'same')[kk:-kk]
    shape = np.interp(t, [0, B.T2, B.T3, B.T5, B.T7, B.T9, B.T9 + 1.0, DUR], [1.0, 1.0, 0.85, 0.85, 0.95, 1.1, 1.35, 1.3])
    mus = to(m_ * lev * shape * duck, 20, sp)
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.9, 0, 1)
for name, mg in ((('mix_music', 1.0),) if MUS else ()) + (('mix_nomusic', 0.0),):
    out = (v + bed + hbuf + fx + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{OUT}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{OUT}/{name}.wav'], check=True)
sp2 = env > 0.2
print('bed', round(db(bed[sp2]) - vref, 1), '| heart', round(db(hbuf[np.abs(hbuf) > 1e-4]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1), '| music', round(db(mus[sp2]) - vref, 1) if MUS else None)
