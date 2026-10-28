"""n35 sound mix: voice (per beat at its planned time), sound design from every chapter module, chapter card swishes,
pause timer checks, a low music bed under the story scenes only (ducked under the voice), -14 LUFS, true peak -1.5."""
import sys, os, json, subprocess, importlib
sys.path[:0] = ['/home/claude/n35', '/tmp/m/pipeline']
import numpy as np, soundfile as sf
import core as K

SR = 44100
A = '/home/claude/lp/assets/'
OUT = K.OUT
N = int((K.TOT + 0.5) * SR)


def load(path):
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(1)
    if sr != SR:
        idx = np.arange(0, len(x), sr / SR); x = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    return x


def put(buf, x, t, g):
    i = int(max(t, 0) * SR)
    if i >= N:
        return
    n = min(len(x), N - i)
    buf[i:i + n] += x[:n] * g


for m in ['s_intro', 's_read', 's_press', 's_steps', 's_nose', 's_tq', 's_pack', 's_end']:
    importlib.import_module(m).sounds()
for ch in K.CH:
    if ch['card']:
        K.snd('swish', ch['t'], 0.6)
for s, p in K.PAUSES:
    K.snd('check', s, 0.4)
import wide as WD
for tw in sorted(set(WD.WINCES))[:10]:
    K.snd('gasp_male_real', tw, 0.25)
K.snd('heartbeat_real', 0.0, 0.35)
K.snd('pen_scratch_real', K.cue('f1') + 1.0, 0.5)

voice = np.zeros(N, np.float32)
for chp in __import__('n35_script').CHAPTERS if False else []:
    pass
sys.path.insert(0, '/home/claude/lp/long')
import n35_script as S
for ch in S.CHAPTERS:
    for b in ch['beats']:
        put(voice, load(f"{OUT}/{b['key']}.wav"), K.T[b['key']], 1.0)
fx = np.zeros(N, np.float32)
for name, t, g in K.SOUNDS:
    if g <= 0:
        continue
    p = A + name + '.wav'
    if not os.path.exists(p):
        print('missing sound', name); continue
    put(fx, load(p), t, 0.22 * g * 2.2)

# music bed: story scenes only
import music
STORY = [(0.0, 59.0), (K.cue('r4') - 0.3, K.end('r4') + 0.4), (K.cue('n1') - 0.5, K.end('n2') + 0.4),
         (K.cue('t1') - 0.5, K.cue('t2')), (K.cue('w5') - 0.2, K.end('w5') + 0.4), (K.cue('end') - 0.4, K.TOT)]
music.make_music(K.TOT + 1, '/tmp/n35_music.wav', bpm=78, key=2, seed=6)
mu, sr = sf.read('/tmp/n35_music.wav', dtype='float32')
mu = mu.mean(1) if mu.ndim > 1 else mu
mu = mu[:N] if len(mu) >= N else np.pad(mu, (0, N - len(mu)))
tt = np.arange(N) / SR
env = np.zeros(N, np.float32)
for a, b in STORY:
    env = np.maximum(env, np.clip((tt - a) / 1.0, 0, 1) * np.clip((b - tt) / 1.2, 0, 1))
e = np.convolve(np.abs(voice), np.ones(2205) / 2205, 'same')
duck = np.convolve(np.where(e > 0.01, 10 ** (-9 / 20), 1.0), np.ones(4410) / 4410, 'same')
mus = mu * env * duck * 10 ** (-19 / 20)
# effects never louder than the voice where it speaks
fx = fx * np.where(e > 0.01, 0.8, 1.0)
mixd = voice + fx + mus
st = np.stack([mixd, mixd], 1).astype(np.float32)
raw = '/tmp/n35_raw.wav'
sf.write(raw, st, SR)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', af, '-ar', '48000', f'{OUT}/n35_mix.wav'], check=True)
print('mix done', K.TOT, len(K.SOUNDS), 'sounds')
