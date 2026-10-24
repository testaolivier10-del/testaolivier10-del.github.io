"""Sound for the landing Short: voice (when there is one), a light outdoor air bed, synthesized impact thuds for the
locked landing, cloth and soft pats for the bent landing, UI sounds, rewind, and the house music bed ducked under the
voice. Writes out/mix_music.wav and out/mix_nomusic.wav at -14 LUFS, true peak below -1.5 dBTP.
usage: python3 mix.py [voice.wav]"""
import sys, json, subprocess
import numpy as np, soundfile as sf
sys.path.insert(0, '/tmp/m/pipeline')
import music
from scipy.signal import butter, lfilter

SR = 44100
A = '/home/claude/lp/assets/'
OUT = '/home/claude/jump/out/'
b = json.load(open(OUT + 'build.json'))
DUR, T = b['DUR'], b['T']
N = int((DUR + 0.2) * SR)
rng = np.random.default_rng(7)


def load(name):
    x, sr = sf.read(A + name + '.wav', dtype='float32')
    if x.ndim > 1:
        x = x.mean(1)
    if sr != SR:
        idx = np.arange(0, len(x), sr / SR); x = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    return x / max(np.abs(x).max(), 1e-6) * 0.8


def stretch(x, k):
    """Resample by k (k > 1 slower and lower)."""
    idx = np.arange(0, len(x) - 1, 1 / k)
    return np.interp(idx, np.arange(len(x)), x).astype(np.float32)


def db(g):
    return 10 ** (g / 20)


def thud(slow=1.0):
    n = int(0.6 * slow * SR); t = np.arange(n) / SR
    f = 95 * np.exp(-t / (0.08 * slow)) + 42
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.11 * slow))
    bb, aa = butter(2, 2500 / (SR / 2))
    click = lfilter(bb, aa, rng.standard_normal(n)) * np.exp(-t / (0.012 * slow)) * 0.5
    x = body + click
    return (x / np.abs(x).max() * 0.9).astype(np.float32)


fx = np.zeros(N, np.float32)


def put(x, t, gain):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    n = min(len(x), N - i)
    fx[i:i + n] += x[:n] * gain


# outdoor air: pink-ish noise, very low, slow swells
bb, aa = butter(1, 600 / (SR / 2))
air = lfilter(bb, aa, rng.standard_normal(N)).astype(np.float32)
air = air / np.abs(air).max()
tt = np.arange(N) / SR
fx += air * db(-38) * (1 + 0.3 * np.sin(tt * 0.4))

swish, pat, cloth, check, shimmer, wrong = load('swish'), load('pat'), load('cloth'), load('check'), load('shimmer'), load('wrong')
for name, t, gain in b['sounds']:
    if name == 'thud':
        put(thud(1.0), t, gain); put(stretch(pat, 0.9), t, gain * 0.5)
    elif name == 'thud_slow':
        put(thud(3.0), t, gain)
    elif name == 'soft':
        put(stretch(pat, 1.3), t, gain * 0.55); put(cloth, t + 0.02, gain * 0.5)
    elif name == 'soft_slow':
        put(stretch(cloth, 2.0), t, gain * 0.6); put(stretch(pat, 2.2), t, gain * 0.35)
    elif name == 'rewind':
        rw = np.concatenate([swish[::-1], swish[::-1]])
        k = np.linspace(1.0, 2.2, len(rw)).cumsum(); k = k[k < len(rw)]
        put(np.interp(k, np.arange(len(rw)), rw).astype(np.float32), t, gain)
    else:
        put({'swish': swish, 'pat': pat, 'check': check, 'shimmer': shimmer, 'wrong': wrong}[name], t, gain * 0.55)

voice = np.zeros(N, np.float32)
if len(sys.argv) > 1:
    v, sr = sf.read(sys.argv[1], dtype='float32')
    if v.ndim > 1:
        v = v.mean(1)
    if sr != SR:
        idx = np.arange(0, len(v), sr / SR); v = np.interp(idx, np.arange(len(v)), v).astype(np.float32)
    voice[:min(N, len(v))] = v[:N]

music.make_music(DUR + 1, '/tmp/jump_music.wav', bpm=100, key=5, seed=11)
m, _ = sf.read('/tmp/jump_music.wav', dtype='float32')
m = m[:N] if len(m) >= N else np.pad(m, ((0, N - len(m)), (0, 0)))
if np.abs(voice).max() > 0:
    e = np.convolve(np.abs(voice), np.ones(2205) / 2205, 'same')
    duck = np.where(e > 0.01, db(-8), 1.0)
    duck = np.convolve(duck, np.ones(4410) / 4410, 'same')
else:
    duck = np.full(N, db(-6))
fade = np.clip(tt / 0.4, 0, 1) * np.clip((DUR - tt) / 0.6, 0, 1)
# music dips under the rewind
dip = 1 - 0.7 * np.clip(1 - np.abs(tt - (T['rw0'] + 0.27)) / 0.4, 0, 1)
m = m * (db(-17) * duck * fade * dip)[:, None]

for name, with_music in (('mix_music', True), ('mix_nomusic', False)):
    st = np.stack([voice + fx, voice + fx], 1)
    if with_music:
        st = st + m
    sf.write('/tmp/' + name + '_raw.wav', st.astype(np.float32), SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', '/tmp/' + name + '_raw.wav', '-af',
                        'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    p = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={p['input_i']}:measured_TP={p['input_tp']}:"
          f"measured_LRA={p['input_lra']}:measured_thresh={p['input_thresh']}:offset={p['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', '/tmp/' + name + '_raw.wav', '-af', af, '-ar', '44100', OUT + name + '.wav'], check=True)
    print(name, 'written')
