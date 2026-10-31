"""Sound for the A&P 02 pilot: a calm scene score under the whole video (no drums), the place's own sounds in the story
scenes (park: breeze and birds, a distant siren at the start; ER: a quiet monitor and room tone), a soft chime on chapter
cards and answers. Voice from out/voice.wav, music ducked under it, loudness -14 LUFS.  python sound.py"""
import json, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter
sys.path.insert(0, '/home/claude/lv')
import tl

SR = 44100
A = '/home/claude/lp/assets/'
OUT = '/home/claude/lv/out'
PARK = {'hook', 'a1', 'm2', 'm4', 'end'}
ER = {'w0', 'w1', 'd2', 'x5', 'a6q', 'a6a', 'q2q', 'q2a'}
WARM = {'end', 'rc'}
TENSE = {'hook'}


def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)


def lp(x, f):
    b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)


def load(n):
    x, sr = sf.read(A + n + '.wav', dtype='float32')
    return x.mean(1) if x.ndim > 1 else x


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def ranges(T, keys):
    """time ranges covered by the scenes of these beats (a beat's scene lasts until the next beat starts)"""
    bs = sorted(T['beats'].values(), key=lambda b: b['t0'])
    out = []
    for i, b in enumerate(bs):
        if b['key'] in keys:
            t1 = bs[i + 1]['t0'] if i + 1 < len(bs) else T['DUR']
            out.append((b['t0'], t1))
    return out


def mask(N, rs, fade=0.8):
    t = np.arange(N) / SR; m = np.zeros(N)
    for a, b in rs:
        m = np.maximum(m, np.clip((t - a + fade) / fade, 0, 1) * np.clip((b - t + fade) / fade, 0, 1))
    return m


def score(T, N, rng):
    """slow chord pads with a sparse plucked line; D major colour in the teaching, a darker colour under the hook,
    warmer and fuller at the end"""
    t = np.arange(N) / SR
    prog = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]]       # D  Bm  G  A
    dark = [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64]]       # Dm Bb C  A
    bar = 60 / 70 * 4
    pad = np.zeros(N); pl = np.zeros(N)
    tense = mask(N, ranges(T, TENSE), 1.5); warm = mask(N, ranges(T, WARM), 2.0)
    nb = int(N / SR / bar) + 1
    for b in range(nb):
        t0 = b * bar; i0 = int(t0 * SR); n = int((bar + 1.2) * SR)
        seg = np.arange(n) / SR
        env = np.clip(seg / 1.2, 0, 1) * np.clip((bar + 1.2 - seg) / 1.2, 0, 1)
        dk = tense[min(i0, N - 1)] > 0.5
        ch = (dark if dk else prog)[b % 4]
        x = np.zeros(n)
        for m_ in ch:
            for det in (-0.7, 0.7):
                f = hz(m_ - 12) + det
                x += np.sin(2 * np.pi * f * seg + rng.uniform(0, 6)) + 0.25 * np.sin(4 * np.pi * f * seg)
        x = lp(x * env, 1800) / len(ch)
        j = min(n, N - i0)
        if j > 0:
            pad[i0:i0 + j] += x[:j]
        # plucks: four per bar, chord tones an octave up, sometimes skipped so it breathes
        for q in range(4):
            if rng.random() < 0.35:
                continue
            at = t0 + q * bar / 4; k = int(at * SR); L = int(0.9 * SR)
            if k + L >= N:
                continue
            s2 = np.arange(L) / SR
            f = hz(ch[(q + b) % 3] + 12 * (1 if rng.random() < 0.7 else 0))
            pl[k:k + L] += (np.sin(2 * np.pi * f * s2) + 0.2 * np.sin(6 * np.pi * f * s2)) * np.exp(-s2 * 5)
    # a low drone in the hook, a sub swell when the arm flips
    drone = lp(sum(np.sin(2 * np.pi * hz(38) * k * t) / k for k in range(1, 5)), 240)
    m = 0.55 * pad + 0.10 * pl * (1 - 0.6 * tense) + 0.22 * drone * tense + 0.18 * pad * warm
    m *= np.clip(t / 2.0, 0, 1) * np.clip((T['DUR'] - t) / 2.5, 0, 1)
    m /= np.abs(m).max()
    w = 0.1 * np.sin(2 * np.pi * 0.07 * t)
    return np.stack([m * (1 + w), m * (1 - w)], 1)


def ambience(T, N, rng):
    t = np.arange(N) / SR
    fx = np.zeros(N)
    park = mask(N, ranges(T, PARK), 0.6); er = mask(N, ranges(T, ER), 0.6)
    breeze = bp(rng.normal(0, 1, N), 180, 1100) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * t))
    fx += 0.05 * breeze / np.abs(breeze).max() * park
    birds = load('birds_real'); birds /= np.abs(birds).max()
    for a, b in ranges(T, PARK):
        tt = a + rng.uniform(0.2, 1.5)
        while tt < b - 1.0:
            L = int(rng.uniform(1.0, 2.2) * SR); s0 = int(rng.uniform(0, len(birds) - L))
            seg = birds[s0:s0 + L] * np.hanning(L) * rng.uniform(0.05, 0.1)
            i = int(tt * SR); n = min(L, N - i); fx[i:i + n] += seg[:n]
            tt += rng.uniform(2.5, 5.0)
    # a distant siren under the opening seconds, while the ambulance lights flash
    sir = load('siren_real'); sir = lp(sir / np.abs(sir).max(), 1500) * 0.07
    h = T['beats']['hook']; L = min(len(sir), int(5 * SR)); env = np.clip(np.arange(L) / SR / 0.8, 0, 1) * np.clip((L / SR - np.arange(L) / SR) / 2.0, 0, 1)
    i = int((h['t0'] + 0.3) * SR); fx[i:i + L] += sir[:L] * env
    # ER: room tone and a quiet monitor beep
    room = lp(rng.normal(0, 1, N), 300); fx += 0.025 * room / np.abs(room).max() * er
    beep = load('monitor_beep_real'); beep /= np.abs(beep).max()
    for a, b in ranges(T, ER):
        k = int(a * SR)
        while k < int(b * SR) - len(beep):
            fx[k:k + len(beep)] += 0.03 * beep * er[k:k + len(beep)]
            k += len(beep)
    # a soft chime on each chapter card and on each answer
    sh = load('shimmer'); sh /= np.abs(sh).max()
    hits = [s['t0'] + 0.1 for s in T['segs'] if s['kind'] == 'card'] + [b['t0'] for k, b in T['beats'].items() if k.endswith('a') and k[:-1] + 'q' in T['beats']]
    for at in hits:
        i = int(at * SR); n = min(len(sh), N - i); fx[i:i + n] += 0.12 * sh[:n]
    return fx


def main():
    T = tl.build()
    DUR = T['DUR']; N = int((DUR + 0.5) * SR); tt = np.arange(N) / SR
    rng = np.random.default_rng(11)
    v, sr = sf.read(f'{OUT}/voice.wav', dtype='float32')
    voice = np.zeros(N, np.float32); voice[:min(N, len(v))] = v[:N]
    m = score(T, N, rng)
    fx = ambience(T, N, rng)
    e = np.convolve(np.abs(voice), np.ones(2205) / 2205, 'same')
    duck = np.convolve(np.where(e > 0.01, 10 ** (-8 / 20), 1.0), np.ones(8820) / 8820, 'same')
    st = np.stack([voice + fx, voice + fx], 1) + m * (10 ** (-17 / 20) * duck)[:, None]
    st *= np.clip((DUR - tt) / 1.0, 0, 1)[:, None]
    raw = '/tmp/lv_mix_raw.wav'
    sf.write(raw, st.astype(np.float32), SR)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    p = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={p['input_i']}:measured_TP={p['input_tp']}:"
          f"measured_LRA={p['input_lra']}:measured_thresh={p['input_thresh']}:offset={p['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', af, '-ar', '48000', f'{OUT}/mix.wav'], check=True)
    print('mix ok', round(DUR, 1))


if __name__ == '__main__':
    main()
