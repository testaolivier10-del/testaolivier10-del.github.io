"""Sound for the sprint lean Short: voice (when there is one), fire ambience, foot falls, UI sounds, a rewind
sound and the house music bed (ducked under the voice). Writes out/mix_music.wav and out/mix_nomusic.wav at
-14 LUFS integrated, true peak below -1.5 dBTP.
usage: python3 mix.py [voice.wav]"""
import sys, json, subprocess
import numpy as np, soundfile as sf
sys.path.insert(0, '/tmp/m/pipeline')
import music

SR = 44100
A = '/home/claude/lp/assets/'
OUT = '/home/claude/runner/out/'
b = json.load(open(OUT + 'build.json'))
DUR, T = b['DUR'], b['T']
N = int((DUR + 0.2) * SR)


def load(name):
    x, sr = sf.read(A + name + '.wav', dtype='float32')
    if x.ndim > 1:
        x = x.mean(1)
    if sr != SR:
        idx = np.arange(0, len(x), sr / SR); x = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    return x


def db(g):
    return 10 ** (g / 20)


fx = np.zeros(N, np.float32)


def put(x, t, gain):
    i = int(t * SR)
    if i >= N:
        return
    n = min(len(x), N - i)
    fx[i:i + n] += x[:n] * gain


# fire ambience: loudest in front of the building, fading as he runs away
fire = load('fire_real')
bed = np.tile(fire, int(N / len(fire)) + 2)[:N]
tt = np.arange(N) / SR
env = db(-25) * (1 - 0.65 * np.clip((tt - T['unf']) / 4.0, 0, 1))
fx += bed * env
for name, t, gain in b['sounds']:
    if name in ('swish', 'pat', 'check', 'shimmer', 'wrong'):
        put(load(name), t, gain * 0.55)
    else:
        put(load(name), t, gain * 0.7)
# rewind: a reversed whoosh that speeds up
w = load('swish')
rw = np.concatenate([w[::-1], w[::-1]])
k = np.linspace(1.0, 2.2, len(rw)).cumsum(); k = k[k < len(rw)]
rw = np.interp(k, np.arange(len(rw)), rw).astype(np.float32)
put(rw * 0.5, T['rw0'], 0.6)

voice = np.zeros(N, np.float32)
if len(sys.argv) > 1:
    v, sr = sf.read(sys.argv[1], dtype='float32')
    if v.ndim > 1:
        v = v.mean(1)
    if sr != SR:
        idx = np.arange(0, len(v), sr / SR); v = np.interp(idx, np.arange(len(v)), v).astype(np.float32)
    voice[:min(N, len(v))] = v[:N]

music.make_music(DUR + 1, '/tmp/sprint_music.wav', bpm=96, key=2, seed=4)
m, _ = sf.read('/tmp/sprint_music.wav', dtype='float32')
m = m[:N] if len(m) >= N else np.pad(m, ((0, N - len(m)), (0, 0)))
# duck under the voice
if np.abs(voice).max() > 0:
    e = np.convolve(np.abs(voice), np.ones(2205) / 2205, 'same')
    duck = np.where(e > 0.01, db(-8), 1.0)
    duck = np.convolve(duck, np.ones(4410) / 4410, 'same')
else:
    duck = np.full(N, db(-6))
fade = np.clip(tt / 0.4, 0, 1) * np.clip((DUR - tt) / 0.6, 0, 1)
m = m * (db(-17) * duck * fade)[:, None]

for name, with_music in (('mix_music', True), ('mix_nomusic', False)):
    st = np.stack([voice + fx, voice + fx], 1)
    if with_music:
        st = st + m
    sf.write('/tmp/' + name + '_raw.wav', st.astype(np.float32), SR)
    # two pass loudness normalisation to -14 LUFS, -1.5 dBTP
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', '/tmp/' + name + '_raw.wav', '-af',
                        'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1]
    p = json.loads(js)
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={p['input_i']}:measured_TP={p['input_tp']}:"
          f"measured_LRA={p['input_lra']}:measured_thresh={p['input_thresh']}:offset={p['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', '/tmp/' + name + '_raw.wav', '-af', af, '-ar', '44100', OUT + name + '.wav'], check=True)
    print(name, 'written')
