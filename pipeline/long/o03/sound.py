"""Sound for Organic Chemistry 03 (Olivier 2026-11-05: NO music in long videos): the voice leads; morning birds about 26 dB
under the voice in the town square only; a few effects about 10 dB under on the story's physical moments (the pencil, the
diamond on steel, the torch lighting and cutting, the cloth). Then loudnorm, and the limiter pass in finish.sh.  python3 sound.py"""
import json, subprocess, sys, math
import numpy as np, soundfile as sf
sys.path.insert(0, '/home/claude/lv')
import tl

SR = 44100
OUT = '/home/claude/lv/out'
T = tl.build()
DUR = T['DUR']
N = int((DUR + 1) * SR)
B = T['beats']


def load(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def db(x):
    return 20 * math.log10(max(1e-9, x))


def rms(x):
    return float(np.sqrt(np.mean(x ** 2) + 1e-12))


def place(track, x, t, gain=1.0, fade_in=0.0, fade_out=0.0, until=None):
    a = int(round(t * SR))
    if until is not None:
        x = x[:max(0, int((until - t) * SR))]
    x = x.copy()
    if fade_in > 0:
        n = min(len(x), int(fade_in * SR)); x[:n] *= np.linspace(0, 1, n)
    if fade_out > 0:
        n = min(len(x), int(fade_out * SR)); x[len(x) - n:] *= np.linspace(1, 0, n)
    if a < 0:
        x = x[-a:]; a = 0
    m = min(len(x), len(track) - a)
    if m > 0:
        track[a:a + m] += gain * x[:m]


def span(keys):
    bs = sorted(B.values(), key=lambda b: b['t0'])
    order = [b['key'] for b in bs]
    a = B[keys[0]]['t0']
    j = order.index(keys[-1])
    e = bs[j + 1]['t0'] if j + 1 < len(bs) else DUR
    return a, e


voice, _ = sf.read(f'{OUT}/voice.wav', dtype='float32')
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
frame = int(0.05 * SR)
act = np.repeat([float(np.abs(voice[i:i + frame]).max() > 0.02) for i in range(0, N, frame)], frame)[:N]
k = int(0.6 * SR); ker = np.hanning(k); ker /= ker.sum()
act = np.convolve(act, ker, 'same').astype(np.float32)
speech_rms = rms(voice[act > 0.5])

import base as BB
BB.Bt.update(B); BB.Bt['__DUR'] = DUR
from base import wt, cue, ww
from scipy.signal import butter, sosfilt
amb = np.zeros(N, np.float32)
birds = load(f'{OUT}/sfx/birds_real.wav'); birds /= rms(birds) + 1e-9      # the square's own sound: morning birds
birdsL = np.tile(birds, int(DUR / (len(birds) / SR)) + 3)
a, e = B['end']['t0'] - 0.3, DUR
place(amb, birdsL[:int((e - a) * SR)], a, speech_rms * 10 ** (-26 / 20), 1.0, 1.5, until=e)
fx = np.zeros(N, np.float32)
peak = float(np.percentile(np.abs(voice[act > 0.5]), 99.5))
fxg = peak * 10 ** (-10 / 20)
def norm(x): return x / (np.abs(x).max() + 1e-9)
pen = norm(load(f'{OUT}/sfx/pen_scratch_real.wav'))
scr = norm(sosfilt(butter(4, 2600, 'hp', fs=SR, output='sos'), np.tile(pen, 3)).astype(np.float32))      # the diamond on steel: the same scratch, thin and high
ign = norm(load(f'{OUT}/sfx/ignite_real.wav')); siz = norm(load(f'{OUT}/sfx/sizzle_real.wav')); clo = norm(load(f'{OUT}/sfx/cloth_real.wav'))
place(fx, pen[:int(2.4 * SR)], 0.15, fxg * 0.45, 0.05, 0.6)                                   # the first pencil line
place(fx, scr[:int(3.2 * SR)], ww('hook', 'scratches') - 0.1, fxg * 0.4, 0.05, 0.8)           # the scribe on the plate
place(fx, scr[:int(2.6 * SR)], ww('c7', 'bites') - 0.2, fxg * 0.4, 0.05, 0.8)                 # the diamond bites
place(fx, pen[:int(3.0 * SR)], ww('d5', 'drags') - 0.1, fxg * 0.45, 0.05, 0.8)                # the tip drags, flakes stay
place(fx, ign[:int(1.6 * SR)], ww('e6', 'lights') + 0.3, fxg * 0.5, 0.02, 0.6)                # the torch lights
sz = np.tile(siz, int(8 * SR / len(siz)) + 1)
place(fx, sz[:int(6.4 * SR)], ww('e6', 'That', 1) - 0.2, fxg * 0.35, 0.3, 1.2)                # the cut
place(fx, clo[:int(2.0 * SR)], ww('end', 'pulls') - 0.1, fxg * 0.5, 0.02, 0.6)                # the cover comes off
# NO MUSIC IN LONG VIDEOS (Olivier, 2026-11-05): voice, the pool's quiet evening birds and four effects only
mix = voice + amb + fx
sf.write(f'{OUT}/mix_raw.wav', mix, SR)
print('ambience dB', round(db(rms(amb[amb != 0])) - db(speech_rms), 1))
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{OUT}/mix_raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/mix_raw.wav', '-af', af, '-ar', str(SR), f'{OUT}/mix.wav'], check=True)
print('mix ok')
