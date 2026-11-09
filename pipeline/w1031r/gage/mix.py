"""Restrained mix for the w1104 Shorts (pattern: w1101 plane sound5.py). The voice leads; the composed music_v1 score
about 20 dB under the voice with a 4 dB smooth duck; ambience about 26 dB under; 3 to 5 effects about 10 dB under,
just before key words, never on them; no whooshes; two pass loudnorm to -14 LUFS, true peak -1.5 dBTP.
usage: mix.py (the Gage Short)"""
import sys, json, subprocess, importlib
import numpy as np, soundfile as sf, librosa

ID = 'w1031-02-phineas-gage'
SR = 44100
SFX = '/home/claude/lp/assets'
OUT = f'/home/claude/lp/w1031r/out/{ID}'
sys.path[:0] = ['/home/claude/lp/w1031r/gage']
B = importlib.import_module('build')
DUR = B.DUR; N = int(DUR * SR); t = np.arange(N) / SR
at = B.at
amb = np.zeros(N); fx = np.zeros(N); USE = {}


def load(path):
    x, _ = librosa.load(path, sr=SR, mono=True)
    return x / (np.abs(x).max() or 1)


def put(buf, name, t0, g=1.0, maxlen=None, fade_out=0.1):
    USE[name] = USE.get(name, 0) + 1
    x = load(f'{SFX}/{name}.wav')
    if maxlen: x = x[:int(maxlen * SR)]
    i = int(t0 * SR); n = min(len(x), N - i)
    if n <= 0: return
    env = np.ones(n); b = max(1, int(fade_out * SR)); env[-min(b, n):] *= np.linspace(1, 0, min(b, n))
    buf[i:i + n] += g * x[:n] * env


def bed(name, a, b, g=1.0, xf=0.4):
    USE[name] = USE.get(name, 0) + 1
    x = load(f'{SFX}/{name}.wav'); L = len(x); k = int(xf * SR)
    seg = np.zeros(int((b - a + 2 * xf) * SR)); pos = 0
    while pos < len(seg):
        n = min(L, len(seg) - pos)
        w = np.ones(n); w[:min(k, n)] = np.linspace(0, 1, min(k, n)); w[-min(k, n):] *= np.linspace(1, 0, min(k, n))
        seg[pos:pos + n] += x[:n] * w; pos += max(1, L - k)
    i = int((a - xf) * SR); j = max(0, -i); i = max(0, i); n = min(len(seg) - j, N - i)
    amb[i:i + n] += g * seg[j:j + n]


MUS = '/home/claude/lp/w1031r/gage/snd/gage_b.mp3'
bed('birds_real', 0, B.C_E + 0.3, 1.0)                        # the rock cut on a September day (only where the place matters)
bed('birds_real', B.C_G, DUR, 0.5)                             # evening at the camp, quieter
put(fx, 'thunder_real', B.C_B - 0.06, 1.0, maxlen=2.6, fade_out=0.9)   # the powder goes off
put(fx, 'bagdrop_real', B.LAND - 0.04, 0.8)                     # the iron slams into the ground
put(fx, 'run_steps_real', B.T_LIVED - 0.45, 0.5, maxlen=1.5, fade_out=0.4)   # the workers run in
put(fx, 'page_flip_real', B.T_DROP + 0.05, 0.6, maxlen=0.9, fade_out=0.3)    # the plan drops
shape_pts = [0, B.C_B - 0.2, B.C_B + 0.2, B.C_E, B.C_E + 0.5, B.C_F1, B.C_F2, B.C_G, B.END, B.END + 0.4, DUR], [1.0, 1.0, 1.1, 1.0, 0.8, 0.8, 1.0, 1.0, 1.0, 1.9, 1.9]

mus, _ = librosa.load(MUS, sr=SR, mono=True)
# the take resolves at about 38.5 s, before the end line: let its last phrase breathe to the end of the picture by gently
# stretching only the final soft chord (from the start of the last section), so the score fades with the end line
cut = int(B.C_G * SR); end_src = int(38.9 * SR); want = int((DUR - 0.2) * SR) - cut
tail = librosa.effects.time_stretch(mus[cut:end_src], rate=(end_src - cut) / want)
mus = np.concatenate([mus[:cut], tail])
mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load(f'{OUT}/voice.wav', sr=SR, mono=True)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1)
k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')
shape = np.interp(t, *shape_pts)
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15
vref = db(v[sp])


def to(x, under, mask=None):
    m = mask if mask is not None else (np.abs(x) > 1e-4)
    return x * 10 ** ((vref - under - db(x[m])) / 20) if m.any() else x


mus = to(mus * shape * duck, 23, sp)
if np.abs(amb).max() > 0: amb = to(amb, 26)
if np.abs(fx).max() > 0: fx = to(fx, 10)
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.8, 0, 1)
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
print(ID, 'uses', USE, '| music vs voice in speech', round(db(mus[sp2]) - vref, 1), '| fx', round(db(fx[np.abs(fx) > 1e-4]) - vref, 1) if np.abs(fx).max() > 0 else '-',
      '| amb', round(db(amb[np.abs(amb) > 1e-4]) - vref, 1) if np.abs(amb).max() > 0 else '-')
