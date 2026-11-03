"""Premium sound pass for the bomber Short (Olivier 2026-11-02: the recurring "psshh" cut whoosh is an AI giveaway, and the
music could not be heard). Changes from sound3:
- NO stock cut whoosh and no synthesized swish, pop or shimmer: cuts land clean, on the music.
- A real composed score (ElevenLabs music_v1, composition plan timed to the edit: section changes on the cuts, the resolution
  accent on "put the armor"), clearly audible, with a melody in the range a phone plays, ducked only a little under the voice.
- Real ambience for every place (altitude drone and wind, dawn airfield, hangar room tone, a night office, a field at dusk),
  generated once for this video, crossfaded at the cuts.
- Every action has its own sound and no sound file is used more than twice."""
import sys, json, subprocess
sys.path.insert(0, '/home/claude/plane')
import numpy as np, soundfile as sf, librosa
import build3 as B

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


# A the formation in flak: altitude drone, bursts, three planes going down
bed('amb_altitude', 0, TB, 0.55)
put(fx, 'flak_far', 0.15, 0.45)
put(fx, 'hit_engine', 0.55, 0.55)
put(fx, 'flak_close', at('never') - 0.1, 0.6)
put(fx, 'down_far', at('never') + 0.2, 0.4)
put(fx, 'flak_far', at('back') - 0.2, 0.35)
# B dawn landing
bed('field_dusk', TB, TC, 0.35)
put(fx, 'landing', TB + 0.05, 0.75)
# C, D, E the hangar
bed('hangar_room', TC, TF, 0.5)
put(fx, 'marks', at('wings') - 0.05, 0.4)
put(fx, 'marks', at('body') - 0.1, 0.35)
put(fx, 'chains_plate', TD, 0.8)
put(fx, 'plates_drop', at('armor', 2) + 0.3, 0.75)
# F the office at night, G the paper
bed('office_night', TF, TH, 0.45)
put(fx, 'page', TF + 0.3, 0.5)
put(fx, 'pencil', at('everywhere') - 0.5, 0.55)
# H the engine hit
bed('amb_altitude', TH, TI, 0.5)
put(fx, 'flak_close', TH + 0.4, 0.4)
put(fx, 'hit_engine', at('engines', 2) - 0.08, 0.8)
# I the hangar again: the plates come off and go onto the engines
bed('hangar_room', TI, TJ, 0.45)
put(fx, 'plates_move', TI + 0.1, 0.55, maxlen=1.6)
put(fx, 'plates_move', at('armor', 3) + 0.2, 0.7)
# J the field of survivors, engines start for the loop
bed('field_dusk', TJ, DUR, 0.4)
put(fx, 'engines_start', B.T_END - 0.4, 0.45)

# the score, ducked a little under the voice and up in the gaps
mus, _ = librosa.load(f'{D}/music_a.mp3', sr=SR, mono=True)
mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
mus = mus / (np.abs(mus).max() or 1)
v, _ = librosa.load('/home/claude/plane/vo3/vo.wav', sr=SR, mono=True)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
duck = 1 - 0.38 * np.clip(env * 4, 0, 1)
fade = np.clip(t / 0.1, 0, 1) * np.clip((DUR - t) / 0.8, 0, 1)
v = v / (np.abs(v).max() or 1) * 0.8
out_dir = '/home/claude/plane/out4'
for name, mg in (('mix_music', 0.42), ('mix_nomusic', 0.0)):
    out = (v + 0.42 * fx + 0.22 * amb + mg * mus * duck) * fade
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
print('music under speech vs voice dB:', round(db(0.42 * mus[sp] * duck[sp]) - db(v[sp]), 1), ' music in gaps vs voice:', round(db(0.42 * mus[~sp] * duck[~sp]) - db(v[sp]), 1))
