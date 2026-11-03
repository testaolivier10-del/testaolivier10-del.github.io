"""Restrained sound for the bomber Short (Olivier 2026-11-02): no cut whooshes or synthesized sounds; a real composed score
(ElevenLabs music_v1 take C, timed to the edit: D minor under the losses and the plan, near silence under Wald, turning to
D major on the realization, a lift into "put the armor") kept about 20 dB under the voice; ambience only in the sky shots,
about 26 dB under; five effects in the whole Short on the big moments, kept off the key words."""
import sys, json, subprocess
sys.path.insert(0, '/home/claude/plane')
import numpy as np, soundfile as sf, librosa
import build4 as B

SR = 44100
D = '/home/claude/plane/snd'
DUR = B.DUR
N = int(DUR * SR); t = np.arange(N) / SR
at, atc = B.at, B.atc
TB, TC, TD, TE, TF, TG, TH, TI, TJ = B.T_B, B.T_C, B.T_D, B.T_E, B.T_F, B.T_G, B.T_H, B.T_I, B.T_J
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


# Restraint (Olivier 2026-11-02: "too much sound including the music is like distracting and overwhelming"; research:
# documentary mixes keep music about 18 to 24 dB under the voice, a few effects only on big moments, none on key words).
# Ambience only where the place itself matters (the sky), very low; five effects in the whole Short.
bed('amb_altitude', 0, TB, 1.0)
bed('amb_altitude', TH, TI, 1.0)
put(fx, 'hit_engine', 0.55, 1.0)                                   # the hook: a bomber hit and falling
put(fx, 'landing', TB + 0.05, 1.0)                                 # the survivor touches down
put(fx, 'chains_plate', TD, 1.0)                                   # one heavy plate: weight you can hear
put(fx, 'hit_engine', at('engines', 2) - 0.35, 1.0)                # the engine hit, landing just before the key word
put(fx, 'plates_move', at("weren't") - 0.15, 1.0, maxlen=2.4)     # the armor goes onto the engines

# the score (take C: D minor turning to D major on the realization), level shaped by section, well under the voice
mus, _ = librosa.load(f'{D}/music_c.mp3', sr=SR, mono=True)
mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load('/home/claude/plane/vo3/vo.wav', sr=SR, mono=True)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.clip(env * 4, 0, 1)
k2 = int(0.4 * SR); speech = np.convolve(speech, np.ones(k2) / k2, 'same')          # smooth so it never pumps
shape = np.interp(t, [0, TF - 0.3, TF + 0.5, TH - 0.3, TH + 0.3, at('armor', 3) - 0.5, at('armor', 3) + 0.5, TJ, DUR],
                     [1.0, 1.0, 0.7, 0.7, 1.0, 1.0, 1.4, 1.2, 1.0])                  # quieter under Wald, a lift into the fix
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
out_dir = '/home/claude/plane/out8'
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
