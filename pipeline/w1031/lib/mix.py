"""Sound for the w1031 Shorts, the music_d.py approach: music that fits the scene and swells into the key moment,
the place's own ambience kept light, a real sound on every visible action, music ducked under the voice,
two pass loudnorm to -14 LUFS / -1.5 dBTP. Writes mix_music.wav and mix_nomusic.wav.
usage: python3 mix.py <id>"""
import sys, json, subprocess, re
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter

SR = 44100
A = '/home/claude/lp/assets'
rng = np.random.default_rng(4)


def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)


def lp(x, f):
    b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)


def load(n):
    x, sr = sf.read(f'{A}/{n}.wav', dtype='float32')
    x = x.mean(1) if x.ndim > 1 else x
    if sr != SR: x = np.interp(np.arange(0, len(x), sr / SR), np.arange(len(x)), x)
    m = np.abs(x).max() or 1
    return x / m


class Mix:
    def __init__(self, dur):
        self.N = int(dur * SR); self.t = np.arange(self.N) / SR; self.dur = dur
        self.amb = np.zeros(self.N); self.fx = np.zeros(self.N)

    def put(self, buf, x, at, g, maxlen=None):
        i = int(at * SR)
        if i >= self.N: return
        if maxlen: x = x[:int(maxlen * SR)]
        n = min(len(x), self.N - i)
        if i < 0: x = x[-i:]; n = min(len(x), self.N); i = 0
        env = np.ones(n); f = min(n, int(0.02 * SR)); env[-f:] = np.linspace(1, 0, f)
        buf[i:i + n] += g * x[:n] * env

    def noise_bed(self, lo, hi, g, mod=None):
        w = bp(rng.normal(0, 1, self.N), lo, hi)
        w = w / np.abs(w).max()
        if mod is not None: w = w * mod
        self.amb += g * w

    def tone(self, buf, at, f, dur, g, decay=6.0, harm=(1,)):
        n = int(dur * SR); tt = np.arange(n) / SR
        x = sum(np.sin(2 * np.pi * f * h * tt) / h for h in harm) * np.exp(-tt * decay)
        self.put(buf, x, at, g)


def score(N, t, chords, swell_at, swell_k=0.7, cutoff=1800, bright=None):
    """chords: [(t0, (freqs...))]; a detuned pad that climbs into swell_at, with a low hit there"""
    pad = np.zeros(N)
    for i, (t0, fs) in enumerate(chords):
        t1 = chords[i + 1][0] if i + 1 < len(chords) else t[-1] + 1
        env = np.clip((t - t0) / 0.8, 0, 1) * np.clip((t1 + 0.7 - t) / 0.7, 0, 1)
        for f in fs:
            for det in (-0.7, 0.7):
                pad += env * np.sin(2 * np.pi * (f + det) * t + rng.uniform(0, 6)) / len(fs)
    pad = lp(pad, cutoff); pad /= np.abs(pad).max()
    m = pad * (0.45 + 0.35 * np.clip((t - 0.3) / max(0.5, swell_at), 0, 1) ** 1.5)
    tt = np.clip(t - swell_at, 0, None)
    m += 0.55 * np.sin(2 * np.pi * (52 * tt + 6 * (1 - np.exp(-tt * 8)))) * np.exp(-tt * 2.4) * (t >= swell_at)
    if bright is not None:
        f0s, t0 = bright
        sh = sum(np.sin(2 * np.pi * f * t) for f in f0s) / len(f0s)
        m += 0.07 * sh * np.clip((t - t0) / 1.5, 0, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t))
    return m


def finish(M, voice_path, music, out_dir, music_gain=0.32, amb_gain=1.0):
    v, sr = sf.read(voice_path, dtype='float32'); v = v.mean(1) if v.ndim > 1 else v
    v = np.pad(v, (0, max(0, M.N - len(v))))[:M.N]
    # duck the music under the voice (envelope follower)
    env = np.abs(v); k = int(0.25 * SR)
    env = np.convolve(env, np.ones(k) / k, 'same'); env = env / (env.max() or 1)
    duck = 1 - 0.55 * np.clip(env * 3, 0, 1)
    fade = np.clip(M.t / 0.15, 0, 1) * np.clip((M.dur - M.t) / 0.6, 0, 1)
    vmax = np.abs(v).max() or 1
    v = v / vmax * 0.8
    fxm = M.fx; ambm = M.amb
    for name, mus in (('mix_music', music), ('mix_nomusic', None)):
        out = v + 0.5 * fxm + 0.35 * amb_gain * ambm
        if mus is not None:
            out = out + music_gain * mus * duck
        out = out * fade
        st = np.stack([out, out], 1).astype(np.float32)
        tmp = f'{out_dir}/{name}_raw.wav'; sf.write(tmp, st / (np.abs(st).max() or 1) * 0.9, SR)
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
        js = json.loads(r.stderr[r.stderr.rindex('{'):])
        af = (f"loudnorm=I=-14:TP=-2.0:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
              f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100', f'{out_dir}/{name}.wav'], check=True)
    print('mixed', out_dir)


def words(path):
    return json.load(open(path))


def at(W, w, n=1):
    k = 0
    for x in W:
        if x['w'].lower().strip('.,!?').startswith(w.lower()):
            k += 1
            if k == n: return x['t0']
    raise KeyError(w)


# ============================================================ per Short plans
def gage(M, W, dur):
    t = M.t
    sp, off, landed, feet, somehow, and2, all_, spark2 = (at(W, 'spark'), at(W, 'off'), at(W, 'landed'), at(W, 'feet'),
                                                          at(W, 'somehow'), at(W, 'and', 5), at(W, 'all'), at(W, 'spark', 2))
    went, but = at(W, 'went'), at(W, 'but')
    outdoor = ((t < went - 0.3) | ((t > landed - 0.5) & (t < but)) | (t > and2 - 0.3)).astype(float)
    M.noise_bed(200, 1100, 0.35, (0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * t)) * outdoor)          # light wind in the cut
    bd = load('birds_real'); M.put(M.amb, bd, 0.2, 0.18, maxlen=min(len(bd) / SR, went - 0.4))
    # tamp strikes: iron on rock, every second until the spark
    for k in range(int(sp / 0.7)):
        M.tone(M.fx, k * 0.7, 1180, 0.25, 0.35, decay=18, harm=(1, 2.7, 5.1))
        M.put(M.fx, load('rim_real'), k * 0.7, 0.12, maxlen=0.2)
    # far workers' picks
    for k in range(8):
        M.tone(M.amb, 0.6 + k * 0.9, 2300, 0.12, 0.08, decay=30, harm=(1, 3.2))
    M.tone(M.fx, sp + 0.05, 1400, 0.3, 0.5, decay=14, harm=(1, 2.7, 5.1))
    M.put(M.fx, load('ignite_real'), sp + 0.05, 0.6, maxlen=0.8)
    M.put(M.fx, load('thunder_real'), off - 0.02, 1.0, maxlen=3.5)
    M.put(M.fx, load('whoosh_real'), off + 0.1, 0.7)
    M.put(M.fx, load('whoosh_real'), went - 0.4, 0.45)                     # into the head view
    M.put(M.fx, load('whoosh_real')[::-1].copy(), feet - 0.6, 0.35)
    M.put(M.fx, load('bagdrop_real'), feet, 0.8, maxlen=0.6)               # the iron lands point first
    M.put(M.fx, load('run_steps_real'), somehow + 0.3, 0.45, maxlen=2.6)
    M.put(M.fx, load('gasp_male_real'), somehow + 0.5, 0.25, maxlen=1.2)
    M.put(M.fx, load('whoosh_real'), but - 0.3, 0.4)
    M.put(M.fx, load('shimmer'), at(W, 'frontal'), 0.35)
    for w in ('plans', 'keeps'):
        M.put(M.fx, load('pop'), at(W, w), 0.3)
    # dusk: crickets
    cr = (np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 18 * t) > 0.6) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * t)))
    M.amb += 0.08 * cr * (t > and2 - 0.3) * (t < all_ - 0.3)
    M.tone(M.fx, spark2 + 0.05, 1400, 0.3, 0.5, decay=14, harm=(1, 2.7, 5.1))
    M.put(M.fx, load('ignite_real'), spark2 + 0.05, 0.5, maxlen=0.6)
    # music: tense minor pad in D, swells into the blast, a held low note in the head view, a sad turn at dusk
    chords = [(0.0, (73.42, 110.0, 146.83, 174.61)), (2.6, (65.41, 98.0, 130.81, 155.56)), (off - 0.1, (73.42, 110.0, 146.83, 174.61, 220.0)),
              (went, (58.27, 87.31, 116.54, 146.83)), (but, (61.74, 92.5, 123.47, 146.83)), (and2, (55.0, 82.41, 110.0, 130.81, 164.81)),
              (all_, (73.42, 110.0, 146.83, 174.61))]
    return score(M.N, t, chords, off, cutoff=1600)


def cold(M, W, dur):
    t = M.t
    so, jolt, vent, and2, and3, hes, stop = at(W, 'so'), at(W, 'jolt'), at(W, 'ventricular'), at(W, 'and', 3), at(W, 'and', 5), at(W, "he's"), at(W, 'stop')
    M.noise_bed(150, 900, 0.5, 0.7 + 0.3 * np.sin(2 * np.pi * 0.09 * t))              # wind over the ice
    M.noise_bed(1800, 5000, 0.08, 0.5 + 0.5 * np.sin(2 * np.pi * 0.21 * t))           # snow hiss
    M.put(M.fx, load('series_emt_traps'), 0.0, 0.35)
    # water lapping in the hole while he is in it
    uw = load('water_pour_real'); M.put(M.amb, lp(uw, 900), 0.0, 0.25, maxlen=so - 0.4)
    M.put(M.fx, load('splash_real'), 0.25, 0.35, maxlen=1.0)
    M.put(M.fx, load('cloth_real'), 0.2, 0.4, maxlen=1.2)
    M.put(M.fx, load('gasp_male_real'), 0.9, 0.18, maxlen=1.0)
    # heart lens: slow beats with a monitor beep, then VF
    lens_on = hes + 0.6
    k = 0
    while True:
        tb = lens_on + k * 1.5
        if tb > and2: break
        if tb < jolt + 0.52:
            M.put(M.fx, load('heartbeat_real'), tb, 0.55, maxlen=0.6)
            M.put(M.fx, load('monitor_beep_real'), tb + 0.08, 0.25, maxlen=0.3)
        k += 1
    M.put(M.fx, load('cloth_real'), jolt, 0.5, maxlen=0.4)
    M.put(M.fx, load('splash_real'), jolt + 0.05, 0.3, maxlen=0.6)
    M.put(M.fx, load('punch'), jolt + 0.52, 0.7)
    M.put(M.fx, load('bagdrop_real'), jolt + 0.54, 0.6, maxlen=0.4)
    # VF alarm: two tone alarm and a fluttering heart
    for k in range(int((and2 - jolt - 0.3) / 0.5)):
        M.tone(M.fx, jolt + 0.57 + k * 0.5, 960 if k % 2 == 0 else 760, 0.22, 0.18, decay=4)
    fl = np.sin(2 * np.pi * 7 * t) * ((t > jolt + 0.52) & (t < and2)) * lp(rng.normal(0, 1, M.N), 120)
    M.fx += 0.4 * fl / (np.abs(fl).max() or 1)
    M.put(M.fx, load('whoosh_real'), and2 - 0.2, 0.35)
    # the sled: slow scrape over ice and boots on snow
    scr = bp(rng.normal(0, 1, M.N), 400, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.8 * t)) * (t > so)
    M.fx += 0.12 * scr / np.abs(scr).max()
    st = load('run_steps_real'); st = np.interp(np.arange(0, len(st), 0.6), np.arange(len(st)), st)
    M.put(M.fx, lp(st, 2500), so + 0.2, 0.25, maxlen=8)
    for k in range(int((dur - and3) / 1.5) + 1):
        tb = and3 + 0.5 + k * 1.5
        M.put(M.fx, load('heartbeat_real'), tb, 0.5, maxlen=0.6)
        M.put(M.fx, load('monitor_beep_real'), tb + 0.08, 0.22, maxlen=0.3)
    # music: cold, tense pad (E minor), swells into the jolt, resolves to a warm major at the careful lift
    chords = [(0.0, (82.41, 123.47, 164.81, 196.0)), (hes, (73.42, 110.0, 146.83, 174.61)), (jolt - 0.1, (77.78, 116.54, 155.56, 185.0, 233.08)),
              (and2, (65.41, 98.0, 130.81, 164.81)), (so, (73.42, 110.0, 146.83, 185.0)), (and3, (82.41, 123.47, 164.81, 207.65, 246.94))]
    return score(M.N, t, chords, jolt, cutoff=1500, bright=((659.3, 830.6, 987.8), and3))


def mint(M, W, dur):
    t = M.t
    both, atoms, bonds, left, right, turn, stack, chem, your, rec, fits, so2, flip, rye = (at(W, 'both'), at(W, 'atoms'), at(W, 'bonds'),
        at(W, 'left'), at(W, 'right'), at(W, 'turn'), at(W, 'stack'), at(W, 'chemists'), at(W, 'your', 3), at(W, 'receptors'),
        at(W, 'fits'), at(W, 'so', 2), at(W, 'flip', 2), at(W, 'rye'))
    inside = ((t > your - 0.3) & (t < so2 - 0.2)).astype(float)
    M.noise_bed(300, 1500, 0.12, (1 - inside))                    # quiet room tone
    bd = load('birds_real'); M.put(M.amb, bd, 0.0, 0.16, maxlen=your - 0.3)
    M.put(M.amb, bd, so2, 0.14, maxlen=dur - so2)
    M.put(M.fx, load('glass_clink_real'), 0.05, 0.25, maxlen=0.6)
    M.put(M.fx, load('shimmer'), both - 0.1, 0.45)
    for w, n in ((atoms, 6), (bonds, 4)):
        for k in range(n): M.put(M.fx, load('pop'), w + 0.2 + k * 0.06, 0.12)
    M.put(M.fx, load('whoosh'), at(W, 'but'), 0.3)
    for w in (left, right): M.put(M.fx, load('cloth_real'), w, 0.35, maxlen=0.5)
    M.put(M.fx, load('swish'), at(W, 'no'), 0.4)
    M.put(M.fx, load('whoosh'), turn, 0.3)
    M.put(M.fx, load('wrong'), stack + 0.3, 0.35)
    M.put(M.fx, load('shimmer'), chem + 0.8, 0.35)
    M.put(M.fx, load('whoosh_real'), your - 0.35, 0.4)
    # inside the nose: soft wet ambience, docking clicks and two different signal tones
    M.noise_bed(80, 400, 0.25, inside)
    M.put(M.fx, load('check'), rec + 0.9, 0.3); M.tone(M.fx, fits, 660, 0.6, 0.25, decay=4)
    M.put(M.fx, load('pop'), at(W, 'each') + 0.9, 0.3); M.tone(M.fx, fits + 0.2, 494, 0.6, 0.25, decay=4)
    M.put(M.fx, load('whoosh_real')[::-1].copy(), so2 - 0.5, 0.35)
    M.put(M.fx, load('whoosh'), flip, 0.4)
    M.put(M.fx, load('shimmer'), rye, 0.45)
    # music: light and curious (G major, plucked), swells on the flip
    chords = [(0.0, (98.0, 146.83, 196.0, 246.94)), (both, (130.81, 196.0, 261.63, 329.63)), (at(W, 'but'), (110.0, 164.81, 220.0, 261.63)),
              (chem, (146.83, 220.0, 293.66, 369.99)), (your, (130.81, 196.0, 246.94, 329.63)), (so2, (98.0, 146.83, 196.0, 246.94, 293.66))]
    m = score(M.N, t, chords, flip, swell_k=0.5, cutoff=2400, bright=((587.3, 784.0, 987.8), flip))
    # a soft pluck arpeggio over the pad
    notes = [392.0, 493.9, 587.3, 784.0, 587.3, 493.9]
    for k in range(int(dur / 0.36)):
        tt = k * 0.36
        f = notes[k % len(notes)] * (0.75 if your - 0.3 < tt < so2 else 1.0)
        M_ = np.zeros(M.N); i = int(tt * SR); n = min(int(0.5 * SR), M.N - i)
        if n <= 0: break
        x = np.arange(n) / SR
        m[i:i + n] += 0.12 * np.sin(2 * np.pi * f * x) * np.exp(-x * 7)
    return m


if __name__ == '__main__':
    k = sys.argv[1]
    d = f'/home/claude/lp/w1031/out/{k}'
    W = words(f'{d}/words_fast.json')
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{d}/silent.mp4']).decode())
    M = Mix(dur)
    fn = {'w1031-02-phineas-gage': gage, 'w1031-01-cold-heart': cold, 'w1031-03-mirror-mint': mint}[k]
    music = fn(M, W, dur)
    music = music / (np.abs(music).max() or 1)
    finish(M, f'{d}/voice_fast.wav', music, d)
