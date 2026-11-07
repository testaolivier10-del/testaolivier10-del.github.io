"""Sound for AP Physics 1 01 at the school track (Olivier 2026-11-05: NO music in long videos): the voice leads; quiet birds
about 26 dB under the voice in the track scenes only; a few effects about 10 dB under (gate beeps, running feet).
Then loudnorm, and the limiter pass in the README for -14 LUFS.  python3 sound.py"""
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
KITCHEN = ['hook', 'u6', 'c7', 'c8', 'g7', 'g8', 'end']


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

amb = np.zeros(N, np.float32)
room = load(f'{OUT}/sfx/birds_real.wav'); room /= rms(room) + 1e-9
roomL = np.tile(room, int(DUR / (len(room) / SR)) + 3)
for k_ in KITCHEN:
    a, e = span([k_])
    place(amb, roomL[int(a * SR):], a, speech_rms * 10 ** (-26 / 20), 1.0, 1.0, until=e)
fx = np.zeros(N, np.float32)
import base as BB
BB.Bt.update(B); BB.Bt['__DUR'] = DUR
from base import wt, cue
beep = load(f'{OUT}/sfx/monitor_beep_real.wav')[:int(0.3 * SR)]; beep /= np.abs(beep).max() + 1e-9
steps = load(f'{OUT}/sfx/run_steps_real.wav'); steps /= np.abs(steps).max() + 1e-9
peak = float(np.percentile(np.abs(voice[act > 0.5]), 99.5))
fxg = peak * 10 ** (-10 / 20)
t_go = wt('c7', 'off') - 0.25; t_beam1 = wt('c7', 'beam') - 0.3
t_cross1 = wt('c7', 'second') + 0.15; t_cross2 = wt('g7', 'beams') + 0.2
# the timing gate beeps when a beam is broken
for tt in (t_beam1, t_cross1, t_cross2):
    place(fx, beep, tt, fxg * 0.8)
# running feet: the take off to the first beam, and both finish passes
stepsL = np.tile(steps, 4)
place(fx, stepsL, t_go, fxg * 0.55, 0.3, 0.4, until=cue('c7', 3) - 0.1)
place(fx, stepsL, cue('c7', 3) - 0.1, fxg * 0.55, 0.05, 0.6, until=t_cross1 + 1.6)
place(fx, stepsL, cue('g7', 4) - 0.1, fxg * 0.55, 0.05, 0.6, until=t_cross2 + 1.6)
# NO MUSIC IN LONG VIDEOS (Olivier, 2026-11-05): voice, the track's quiet birds and a few effects only
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
