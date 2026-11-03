"""Restrained sound for the guard faint Short (the bomber Short's approved balance, video standard section 6): no transition
or synthesized sounds; a composed score (ElevenLabs music_v1 take C: A minor stillness, a steady pulse under the pump, darker as
his vision closes, one low hit at the fall, a warm turn to A major when the neighbour keeps his pump running) about 20 dB under
the voice; the parade ground air only in the outdoor shots, about 26 dB under; four effects in the whole Short."""
import sys, json, subprocess
sys.path[:0] = ['/home/claude/guard2', '/home/claude/short']
import numpy as np, soundfile as sf, librosa
import build4 as B

SR = 44100
D = '/home/claude/guard2/snd'
DUR = B.DUR
N = int(DUR * SR); t = np.arange(N) / SR
at = B.at
amb = np.zeros(N); fx = np.zeros(N); USE = {}


def load(n):
    x, _ = librosa.load(f'{D}/{n}.mp3', sr=SR, mono=True)
    return x / (np.abs(x).max() or 1)


def put(buf, name, t0, g=1.0, maxlen=None):
    USE[name] = USE.get(name, 0) + 1
    x = load(name)
    if maxlen: x = x[:int(maxlen * SR)]
    i = int(t0 * SR); n = min(len(x), N - i)
    if n <= 0: return
    env = np.ones(n); b = max(1, int(0.08 * SR)); env[-b:] *= np.linspace(1, 0, min(b, n))
    buf[i:i + n] += g * x[:n] * env


def bed(name, a, b, g=1.0, xf=0.4):
    USE[name] = USE.get(name, 0) + 1
    x = load(name); L = len(x); k = int(xf * SR)
    seg = np.zeros(int((b - a + 2 * xf) * SR)); pos = 0
    while pos < len(seg):
        n = min(L, len(seg) - pos); w = np.ones(n)
        w[:min(k, n)] = np.linspace(0, 1, min(k, n)); w[-min(k, n):] *= np.linspace(1, 0, min(k, n))
        seg[pos:pos + n] += x[:n] * w; pos += L - k
    i = int((a - xf) * SR); j = max(0, -i); i = max(0, i); n = min(len(seg) - j, N - i)
    amb[i:i + n] += g * seg[j:j + n]


# the parade ground air and a far crowd, only while we are outside his body
bed('parade_amb', 0, B.T_C)
bed('parade_amb', B.T_G, DUR)
# four effects, each just before its key word
put(fx, 'heartbeat', at('brain') - 1.1)                 # two slow thuds as less reaches his brain
put(fx, 'gravel_fall2', B.land_t() - 0.06)                  # he hits the gravel
put(fx, 'boot_creak', at('wiggle') - 0.3, maxlen=2.0)   # the neighbour flexes in his boots

mus, _ = librosa.load(f'{D}/music_c.mp3', sr=SR, mono=True)
mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]
v, _ = librosa.load('/home/claude/guard2/vo/vo.wav', sr=SR, mono=True)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = np.abs(v); k = int(0.3 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env /= env.max() or 1
speech = np.convolve(np.clip(env * 4, 0, 1), np.ones(int(0.4 * SR)) / int(0.4 * SR), 'same')
# level by section: a hush when the pump stops, a little lift into the faint, warm under the neighbour
shape = np.interp(t, [0, B.T_E - 0.3, B.T_E + 0.6, B.T_F - 0.2, B.T_F + 0.6, B.land_t() - 0.1, B.land_t() + 0.6, B.T_H + 0.5, DUR],
                     [1.0, 1.0, 0.55, 0.55, 1.0, 1.2, 0.7, 1.1, 1.0])
duck = 10 ** (-4 / 20) + (1 - 10 ** (-4 / 20)) * (1 - speech)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-9)
sp = env > 0.15; vref = db(v[sp])
to = lambda x, under, m: x * 10 ** ((vref - under - db(x[m])) / 20)
mus = to(mus * shape * duck, 20, sp)
amb = to(amb, 26, np.abs(amb) > 1e-4)
fx = to(fx, 10, np.abs(fx) > 1e-4)
fade = np.clip(t / 0.1, 0, 1) * np.clip((DUR - t) / 0.8, 0, 1)
v = v / (np.abs(v).max() or 1) * 0.8
out_dir = '/home/claude/guard2/out4'
for name, mg in (('mix_music', 1.0), ('mix_nomusic', 0.0)):
    out = (v * 0 + v + fx + amb + mg * mus) * fade
    st = np.stack([out, out], 1).astype(np.float32)
    tmp = f'{out_dir}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{out_dir}/{name}.wav'], check=True)
print('uses', USE, '| music vs voice in speech', round(db(mus[sp]) - vref, 1))
