"""Sound for AP Chem 01 at the premium standard's restrained levels (video standard 6):
- voice leads (out/voice.wav);
- a composed ElevenLabs music_v1 score: the intro composition under the first chapter, one calm teaching bed looped under the
  teaching, a story cue under the kitchen moments (its warm turn timed to the molecule count reveal), and the ending;
  music sits about 20 dB under the voice with a smooth 4 dB duck under speech;
- the kitchen's own quiet room tone about 26 dB under the voice, only in the kitchen scenes;
- a few effects about 10 dB under the voice: the drip landing in the hook, the faucet handle and the last drop at the end.
  No whooshes, no chimes.
Two pass loudnorm to -14 LUFS, true peak -1.5 dBTP.  python3 sound.py"""
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
KITCHEN = ['hook', 'u8', 'u9', 'e6', 's8', 's9', 'end']


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

music = np.zeros(N, np.float32)
intro = load(f'{OUT}/music/intro_a.mp3'); bed = load(f'{OUT}/music/bed.mp3'); story = load(f'{OUT}/music/story.mp3'); endm = load(f'{OUT}/music/end.mp3')
for x in (intro, bed, story, endm):
    x /= rms(x[: SR * 20]) + 1e-9
units_card = [s for s in T['segs'] if s['kind'] == 'card'][0]['t0']
st = [(span(['u8', 'u9']), None), (span(['e6', 'e7']), None), (span(['s8', 's9']), B['s9']['t0'] + 18.0)]
end0 = B['end']['t0']
cuts = [units_card + 1.0] + [x for (a, e), _ in st for x in (a, e)] + [end0]
bed_spans = [(cuts[i], cuts[i + 1]) for i in range(0, len(cuts), 2)]
place(music, intro, 0.0, 1.0, 0.0, 3.0, until=units_card + 1.0)


def bed_at(a, e, off):
    L = len(bed) / SR
    t = a; o = off
    while t < e:
        place(music, bed[int(o * SR):], t, 1.0, 2.0, 2.0, until=min(e + 1.5, t + (L - o)))
        t += (L - o) - 2.0; o = 0.0


off = 0.0
for a, e in bed_spans:
    bed_at(a - 1.0, e + 1.0, off)
    off = (off + (e - a)) % 60
for (a, e), reveal in st:
    if reveal is None:
        place(music, story, a - 0.5, 1.0, 2.0, 3.0, until=e + 1.0)
    else:
        place(music, story, reveal - 30.0, 1.0, 3.0, 3.0, until=e + 1.0)
place(music, endm, end0 - 0.5, 1.0, 2.0, 4.0)

gain = np.full(N, speech_rms * 10 ** (-20 / 20), np.float32)
gain *= (10 ** (-4 * act / 20)).astype(np.float32)
for s in T['segs']:
    if s['kind'] == 'pause':
        a, b = int(s['t0'] * SR), int(s['t1'] * SR)
        gain[a:b] *= 10 ** (-3 / 20)
music *= gain

amb = np.zeros(N, np.float32)
room = load(f'{OUT}/sfx/room.mp3'); room /= rms(room) + 1e-9
roomL = np.tile(room, int(DUR / (len(room) / SR)) + 3)
for k_ in KITCHEN:
    a, e = span([k_])
    place(amb, roomL[int(a * SR):], a, speech_rms * 10 ** (-26 / 20), 1.0, 1.0, until=e)
fx = np.zeros(N, np.float32)
drip = load(f'{OUT}/sfx/drip.mp3'); drip /= np.abs(drip).max() + 1e-9
handle = load(f'{OUT}/sfx/handle.mp3'); handle /= np.abs(handle).max() + 1e-9
peak = float(np.percentile(np.abs(voice[act > 0.5]), 99.5))
fxg = peak * 10 ** (-10 / 20)
for tt in (1.0, 2.0, 3.0, 4.0):
    place(fx, drip, tt - 0.03, fxg * (1.0 if tt < 3 else 0.7))
c3 = B['end']['cues'][3]; c2 = B['end']['cues'][2]
place(fx, handle, c2 + 0.6, fxg * 0.8)
place(fx, drip, math.floor(c3 - 0.1) - 0.03, fxg * 0.8)
mix = voice + music + amb + fx
sf.write(f'{OUT}/mix_raw.wav', mix, SR)
print('music under speech dB', round(db(rms(music[act > 0.5])) - db(speech_rms), 1),
      'ambience dB', round(db(rms(amb[amb != 0])) - db(speech_rms), 1))
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{OUT}/mix_raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/mix_raw.wav', '-af', af, '-ar', str(SR), f'{OUT}/mix.wav'], check=True)
print('mix ok')
