"""Restrained sound for the cane toads Short (video standard section 6): no transition or synthesized sounds; a composed
score (ElevenLabs music_v1 take B: curious major morning and plan, a minor turn as the plan backfires, darkest under the
poison, steady over the maps, the biggest swell at the millions, settling under the CTA) about 20 dB under the voice;
ambience only in the cane field and on the night road, about 26 dB under; four effects on the big moments."""
import sys, json, subprocess
sys.path[:0] = ['/home/claude/toads2', '/home/claude/lp/w1101/lib']
import numpy as np, soundfile as sf, librosa
import build as B

SR = 44100
D = '/home/claude/toads2/snd'
DUR = B.DUR
N = int(DUR * SR); t = np.arange(N) / SR
T = B.T
amb = np.zeros(N); fx = np.zeros(N)
USE = {}
def load(n):
    x, _ = librosa.load(f'{D}/{n}.mp3', sr=SR, mono=True)
    return x / (np.abs(x).max() or 1)


def put(buf, name, t0, g, maxlen=None, fade_in=0.01, fade_out=0.08):
    USE[name] = USE.get(name, 0) + 1
    x = load(name)
    if maxlen: x = x[:int(maxlen * SR)]
    i = int(t0 * SR)
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), N - i)
    if n <= 0: return
    env = np.ones(n); a = max(1, int(fade_in * SR)); b = max(1, int(fade_out * SR))
    env[:a] = np.linspace(0, 1, min(a, n)) if a <= n else env[:a]; env[-b:] *= np.linspace(1, 0, min(b, n))
    buf[i:i + n] += g * x[:n] * env


def bed(name, a, b, g, xf=0.35):
    """a place's ambience from a to b, looped with crossfades, faded in and out across the cut"""
    USE[name] = USE.get(name, 0) + 1
    x = load(name); L = len(x); k = int(xf * SR)
    seg = np.zeros(int((b - a + 2 * xf) * SR))
    pos = 0
    while pos < len(seg):
        n = min(L, len(seg) - pos)
        w = np.ones(n); w[:min(k, n)] = np.linspace(0, 1, min(k, n)); w[-min(k, n):] *= np.linspace(1, 0, min(k, n))
        seg[pos:pos + n] += x[:n] * w
        pos += L - k
    i = int((a - xf) * SR); j = max(0, -i)
    i = max(0, i); n = min(len(seg) - j, N - i)
    amb[i:i + n] += g * seg[j:j + n]


# ambience only where the place matters
bed('amb_cane', 0, B.SHOT_E, 1.0)
bed('amb_night', B.SHOT_G, DUR, 1.0)
# four effects
put(fx, 'crate_out', B.SHOT_B2 + 0.1, 1.0)                        # the lid comes off and the toads plop out
put(fx, 'tongue', T['ate'] + 0.4, 1.0, maxlen=1.2)                 # a tongue snaps up a bug, just after "ate"
put(fx, 'snake', T['many'] - 0.5, 1.0, maxlen=1.6)                  # the snake strikes
put(fx, 'car_pass', B.SHOT_G + 0.3, 1.0)                           # the car behind the headlights

# the score (take B), level shaped by section, well under the voice
mus, _ = librosa.load(f'{D}/music_b.mp3', sr=SR, mono=True)
mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load('/home/claude/toads2/vo/vo.wav', sr=SR, mono=True)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1)
k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')          # smooth so it never pumps
shape = np.interp(t, [0, B.SHOT_E - 0.3, B.SHOT_E + 0.4, B.SHOT_G - 0.3, T['millions'], T['free'] - 0.3, T['free'] + 0.5, DUR],
                     [1.0, 1.0, 0.85, 0.9, 1.3, 1.2, 0.8, 0.8])          # steady under the maps, a lift into the millions, down for the CTA
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)                        # 4 dB extra dip while he talks
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15
vref = db(v[sp])
def to(x, target_db_under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - target_db_under - db(x[m])) / 20) if m.any() else x
mus = to(mus * shape * duck, 20, sp)                     # music about 20 dB under the voice while he talks
amb = to(amb, 26)                                         # the sky drone about 26 dB under
fx = to(fx, 10)                                           # effects about 10 dB under the voice (short, so they still read)
fade = np.clip(t / 0.1, 0, 1) * np.clip((DUR - t) / 0.8, 0, 1)
out_dir = '/home/claude/toads2/out3'
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v + fx + amb + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{out_dir}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{out_dir}/{name}.wav'], check=True)
print('uses', USE)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
sp = env > 0.2
print('music vs voice during speech', round(db(mus[sp]) - vref, 1), 'in gaps', round(db(mus[~sp]) - vref, 1), '| amb', round(db(amb[np.abs(amb)>1e-4]) - vref, 1), '| fx', round(db(fx[np.abs(fx)>1e-4]) - vref, 1))
