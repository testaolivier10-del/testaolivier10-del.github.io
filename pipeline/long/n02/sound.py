"""Sound for NREMT 02 (Olivier 2026-11-05: NO music in long videos): the voice leads; no ambience; four quiet effects about
10 dB or more under the voice on the story's physical moments (the store door, the AED case set down, the ambulance
arriving, the monitor). Then loudnorm, and the limiter pass in finish.sh.  python3 sound.py"""
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
amb = np.zeros(N, np.float32)      # no ambience: a quiet store and an ambulance cabin need none
fx = np.zeros(N, np.float32)
peak = float(np.percentile(np.abs(voice[act > 0.5]), 99.5))
fxg = peak * 10 ** (-10 / 20)
def norm(x): return x / (np.abs(x).max() + 1e-9)
door = norm(load(f'{OUT}/sfx/door_close_real.wav')); sir = norm(load(f'{OUT}/sfx/siren_real.wav'))
bag = norm(load(f'{OUT}/sfx/bagdrop_real.wav')); mon = norm(load(f'{OUT}/sfx/monitor_beep_real.wav'))
place(fx, door[:int(1.2 * SR)], cue('l6', 1) + 0.25, fxg * 0.45, 0.02, 0.5)                    # the store door as Deputy Ruiz comes in
place(fx, bag[:int(1.2 * SR)], ww('l6', 'sets') + 0.25, fxg * 0.45, 0.02, 0.5)                 # the AED case on the counter
place(fx, sir[:int(3.2 * SR)], cue('l6', 2) - 0.2, fxg * 0.22, 0.4, 1.6)                       # the ambulance pulls up outside
monL = np.tile(mon, 3)
place(fx, monL[:int(7.0 * SR)], cue('end', 1) + 0.2, fxg * 0.2, 0.3, 2.0)                      # the monitor in the ambulance
mix = voice + amb + fx
sf.write(f'{OUT}/mix_raw.wav', mix, SR)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{OUT}/mix_raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/mix_raw.wav', '-af', af, '-ar', str(SR), f'{OUT}/mix.wav'], check=True)
print('mix ok')
