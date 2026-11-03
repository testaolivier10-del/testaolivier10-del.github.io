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


# ============================================================ per Short plans (w1101)
def W_(W, w, n=1):
    k = 0
    for x in W:
        if x['w'].lower().strip('.,!?') == w:
            k += 1
            if k == n: return x['t0']
    raise KeyError(w)


def drone(M, t0, t1, f0, g, buf=None):
    """a propeller or engine drone: a pulsed low saw, low passed"""
    t = M.t; on = ((t >= t0) & (t < t1)).astype(float)
    x = ((t * f0) % 1.0 - 0.5) + 0.5 * ((t * f0 * 2.01) % 1.0 - 0.5)
    x = lp(x * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t)), 900) * on
    x = x / (np.abs(x).max() or 1)
    (buf if buf is not None else M.amb)[:] += g * x


def bomber(M, W, dur):
    t = M.t
    famous, but, planes, engines, they, so3, armor3 = W_(W, 'famous'), W_(W, 'but'), W_(W, 'planes'), W_(W, 'engines'), W_(W, 'they'), W_(W, 'so', 3), W_(W, 'armor', 3)
    sb = famous - 0.45; sc = planes - 0.35; sd = they - 0.3; se = so3 - 0.25
    outdoor = ((t < sb) | ((t > sd) & True)).astype(float)
    M.noise_bed(150, 900, 0.45, 0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * t))                 # morning wind
    bd = load('birds_real'); M.put(M.amb, bd, 0.3, 0.16, maxlen=sb - 0.3); M.put(M.amb, bd, sd, 0.14, maxlen=dur - sd)
    drone(M, 0, sb + 0.2, 38, 0.5, M.fx)                                                  # the landing bomber's engines
    M.put(M.fx, load('sizzle_real'), 1.1, 0.35, maxlen=0.7)                               # tyres touch down
    M.put(M.fx, load('bagdrop_real'), 1.15, 0.5, maxlen=0.4)
    M.put(M.fx, load('whoosh_real'), sb - 0.3, 0.45)
    for w in ('wings', 'tail', 'body'):
        for k in range(4): M.put(M.fx, load('pop'), W_(W, w) + k * 0.12, 0.18)
    M.put(M.fx, load('swish'), W_(W, 'armor', 2), 0.35)
    M.put(M.fx, load('shimmer'), but + 0.2, 0.3)
    M.put(M.fx, load('whoosh_real'), sc - 0.3, 0.45)
    drone(M, sc, sd, 31, 0.35, M.amb)                                                     # the formation, high up
    M.noise_bed(300, 2000, 0.25, ((t > sc) & (t < sd)).astype(float))                    # wind at altitude
    for f0 in (sc + 0.2, sc + 0.9, sc + 2.0, sc + 3.0):
        M.put(M.fx, load('thunder_real'), f0, 0.35, maxlen=1.2)                          # flak
    M.put(M.fx, load('thunder_real'), engines - 0.08, 0.9, maxlen=2.5)                   # the engine hit
    M.put(M.fx, load('fire_real'), engines, 0.3, maxlen=3.0)
    dive = np.sin(2 * np.pi * (300 * (t - engines) - 60 * (t - engines) ** 2)) * ((t > engines + 0.3) & (t < engines + 3.0)) * np.exp(-np.clip(t - engines - 0.3, 0, None) * 0.8)
    M.fx += 0.12 * dive
    M.put(M.fx, load('whoosh_real'), sd - 0.3, 0.4)
    M.put(M.fx, load('whoosh_real'), se - 0.3, 0.4)
    for k in range(4): M.put(M.fx, load('rim_real'), armor3 - 0.1 + 0.28 + k * 0.07, 0.5, maxlen=0.4)
    M.put(M.fx, load('bagdrop_real'), armor3 + 0.2, 0.5, maxlen=0.4)
    M.put(M.fx, load('shimmer'), armor3 + 0.4, 0.4)
    # music: a low military pad in D minor, a hopeful turn on Wald's question, swells into the armor landing
    chords = [(0.0, (73.42, 110.0, 146.83, 174.61)), (sb, (65.41, 98.0, 130.81, 155.56)), (but, (58.27, 87.31, 116.54, 146.83, 174.61)),
              (sc, (73.42, 110.0, 138.59, 174.61)), (sd, (65.41, 98.0, 130.81, 164.81)), (se, (73.42, 110.0, 146.83, 185.0, 220.0))]
    return score(M.N, t, chords, armor3, cutoff=1500, bright=((587.3, 740.0, 880.0), armor3))


def guard(M, W, dur):
    t = M.t
    tighten, but, frozen, less, down, thats, tense = W_(W, 'tighten,'.strip(',')), W_(W, 'but'), W_(W, 'frozen'), W_(W, 'less'), W_(W, 'down', 2), W_(W, "that's"), W_(W, 'tense')
    M.noise_bed(150, 800, 0.35, 0.7 + 0.3 * np.sin(2 * np.pi * 0.08 * t))                 # light summer breeze
    cr = load('crowd_cheer_real'); M.put(M.amb, lp(cr, 700), 0.0, 0.12, maxlen=dur)          # a far crowd, murmuring
    bd = load('birds_real'); M.put(M.amb, bd, 0.0, 0.14, maxlen=dur)
    # flags flapping
    fl = bp(rng.normal(0, 1, M.N), 400, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 5 * t)) ** 2
    M.amb += 0.05 * fl / np.abs(fl).max()
    lens_on = W_(W, 'veins') - 0.2
    M.put(M.fx, load('whoosh_real'), lens_on, 0.35)
    # pump squeezes: a soft squelch and thump on every contraction, valve clicks
    for base, end, per in ((tighten - 0.1, but + 0.2, 1.55), (tense - 0.05, dur, 1.3)):
        k = 0
        while base + k * per < end:
            tp = base + k * per
            M.tone(M.fx, tp, 62, 0.4, 0.5, decay=7, harm=(1, 2))
            M.put(M.fx, load('water_pour_real'), tp, 0.12, maxlen=0.35)
            M.put(M.fx, load('tick'), tp + 0.45, 0.14)
            k += 1
    # frozen: a low held hum, the heartbeat getting faint, then the fall
    M.put(M.fx, load('heartbeat_real'), less, 0.35, maxlen=0.6); M.put(M.fx, load('heartbeat_real'), less + 1.3, 0.25, maxlen=0.6)
    M.put(M.fx, load('heartbeat_real'), less + 2.8, 0.15, maxlen=0.6)
    ring = np.sin(2 * np.pi * 3100 * t) * np.clip((t - less) / 2.5, 0, 1) * (t < down + 0.7)
    M.fx += 0.03 * ring
    M.put(M.fx, load('cloth_real'), down, 0.4, maxlen=0.6)
    M.put(M.fx, load('bagdrop_real'), down + 0.6, 0.9, maxlen=0.6)
    M.put(M.fx, load('punch'), down + 0.6, 0.4)
    M.put(M.fx, load('gasp_female_real'), down + 0.9, 0.25, maxlen=1.2)
    M.put(M.fx, load('whoosh_real'), thats - 0.35, 0.35)
    for k in range(6): M.put(M.fx, load('cloth_real'), W_(W, 'wiggle') + k * 0.22, 0.12, maxlen=0.15)
    # music: warm brass like pad in C, tension on "frozen", a dark drop at the fall, back to steady at the end
    chords = [(0.0, (65.41, 98.0, 130.81, 164.81)), (tighten - 0.2, (73.42, 110.0, 146.83, 185.0)), (but, (69.3, 103.83, 138.59, 164.81)),
              (less, (61.74, 92.5, 123.47, 146.83)), (thats, (65.41, 98.0, 130.81, 164.81, 196.0))]
    return score(M.N, t, chords, down + 0.6, cutoff=1500, bright=((523.3, 659.3, 784.0), thats))


def calc(M, W, dur):
    t = M.t
    these, her, so2, they, eight, exactly, fair = W_(W, 'these'), W_(W, 'her'), W_(W, 'so', 2), W_(W, 'they'), W_(W, 'eight'), W_(W, 'exactly'), W_(W, 'fair')
    sb = these - 0.3; sd = her - 0.25; se = so2 - 0.25
    road = ((t < sb) | (t > se)).astype(float)
    drone(M, 0, dur, 46, 0.25, M.amb)
    M.amb[:] *= (0.4 + 0.6 * road)
    M.noise_bed(200, 1600, 0.45, road * (0.8 + 0.2 * np.sin(2 * np.pi * 0.6 * t)))         # tyre and road roar
    M.noise_bed(150, 600, 0.25, (1 - road) * 0.8)                                           # wind over the fields
    for t0 in (0.0, se + 0.2):
        sq = np.sin(2 * np.pi * (1900 + 200 * np.sin(2 * np.pi * 9 * (t - t0))) * t) * ((t > t0) & (t < t0 + 0.7)) * np.exp(-np.clip(t - t0, 0, None) * 2.5)
        M.fx += 0.06 * sq
        M.put(M.fx, load('whoosh_real'), t0 + 0.9, 0.35)                                 # passing under the gantry
        M.put(M.fx, load('monitor_beep_real'), t0 + 1.0, 0.3, maxlen=0.3)                 # the camera reads the plate
    M.put(M.fx, load('whoosh_real'), sb - 0.3, 0.4)
    k = 0
    while they - 0.2 + k * 0.5 < eight + 0.4:
        M.put(M.fx, load('tick'), they - 0.2 + k * 0.5, 0.12); k += 1
    M.put(M.fx, load('ding'), eight + 0.4, 0.35)
    for w in ('average', 'sixty'):
        M.put(M.fx, load('pop'), W_(W, w), 0.3)
    M.put(M.fx, load('whoosh_real'), sd - 0.3, 0.4)
    M.put(M.fx, load('pen_scratch_real'), her, 0.18, maxlen=2.4)                          # the curve drawing
    M.put(M.fx, load('check'), exactly + 0.05, 0.4)
    M.put(M.fx, load('shimmer'), exactly + 0.1, 0.35)
    M.put(M.fx, load('whoosh_real'), se - 0.3, 0.4)
    M.put(M.fx, load('page_flip_real'), fair, 0.3, maxlen=0.6)
    # music: driving pulse in A minor, lifts to major on "exactly"
    chords = [(0.0, (55.0, 82.41, 110.0, 130.81)), (sb, (65.41, 98.0, 130.81, 164.81)), (sd, (58.27, 87.31, 116.54, 146.83)),
              (exactly, (55.0, 82.41, 110.0, 138.59, 164.81)), (se, (55.0, 82.41, 110.0, 130.81))]
    m = score(M.N, t, chords, exactly, cutoff=1800, bright=((659.3, 880.0, 1108.7), exactly))
    pulse = np.sin(2 * np.pi * 110 * t) * (np.sin(2 * np.pi * 2.0 * t) > 0.7) * 0.15
    return m + lp(pulse, 600)


def toads(M, W, dur):
    t = M.t
    beetles, so, poison, many, died, back, inaus, now, millions = (W_(W, 'beetles'), W_(W, 'so'), W_(W, "they're"), W_(W, 'many'), W_(W, 'died.'.strip('.')),
                                                                  W_(W, 'back'), W_(W, 'in', 4), W_(W, 'now'), W_(W, 'millions'))
    sb, sc, sd, sd2, se = beetles - 0.35, so - 0.3, back - 0.3, inaus - 0.2, now - 0.3
    day = (t < sd).astype(float); night = (t > se).astype(float)
    M.noise_bed(200, 900, 0.35, day * (0.7 + 0.3 * np.sin(2 * np.pi * 0.12 * t)))          # wind through the cane
    M.noise_bed(1500, 4000, 0.1, day * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t)))          # cane rustle
    bd = load('birds_real'); M.put(M.amb, bd, 0.0, 0.16, maxlen=sd - 0.2)
    M.put(M.fx, load('door_close_real'), 0.05, 0.5, maxlen=0.6)                           # the crate lid falls open
    for k in range(7): M.put(M.fx, load('pat'), 0.05 + k * 0.55 + 0.5, 0.25)               # toads land
    # cane toad trills (a long pulsed trill)
    def trill(at, n, g, f=620):
        x = np.arange(int(n * SR)) / SR
        y = np.sin(2 * np.pi * f * x) * (np.sin(2 * np.pi * 28 * x) > 0) * np.clip(x / 0.05, 0, 1) * np.clip((n - x) / 0.1, 0, 1)
        M.put(M.amb, y, at, g)
    trill(1.2, 1.4, 0.10); trill(3.6, 1.0, 0.08, 580)
    M.put(M.fx, load('whoosh_real'), sb - 0.3, 0.35)
    M.put(M.fx, load('pat'), W_(W, 'high') + 0.75, 0.35)                                 # the toad falls back short
    for i in range(3): M.put(M.fx, load('pop'), W_(W, 'ate') + i * 0.45, 0.3)               # tongue snaps
    M.put(M.fx, load('hiss'), many - 0.8, 0.35)
    M.put(M.fx, load('punch'), many - 0.4, 0.4)
    M.put(M.fx, load('sizzle'), many - 0.1, 0.12)
    M.put(M.fx, load('wrong'), died, 0.25)
    M.put(M.fx, load('whoosh_real'), sd - 0.3, 0.4)
    M.noise_bed(100, 500, 0.25, ((t > sd) & (t < se)).astype(float))                       # sea under the maps
    k = 0
    while inaus + 0.2 + k * 0.45 < W_(W, 'invasive') + 0.8:
        M.put(M.fx, load('tick'), inaus + 0.2 + k * 0.45, 0.12); k += 1
    M.put(M.fx, load('shimmer'), W_(W, 'invasive'), 0.35)
    M.put(M.fx, load('whoosh_real'), se - 0.3, 0.4)
    cr = (np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 18 * t) > 0.6) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * t)))
    M.amb += 0.07 * cr * night
    for k in range(10): trill(se + 0.3 + k * 0.6, 0.9, 0.05 + 0.03 * (k % 3), 560 + 40 * (k % 4))
    # music: sunny and light at first, uneasy from "backfired", a spreading pulse on the map, heavy at night
    chords = [(0.0, (98.0, 146.83, 196.0, 246.94)), (W_(W, 'backfired'), (92.5, 138.59, 185.0, 220.0)), (sc, (87.31, 130.81, 174.61, 207.65)),
              (sd, (73.42, 110.0, 146.83, 174.61)), (sd2, (69.3, 103.83, 138.59, 164.81)), (se, (65.41, 98.0, 130.81, 155.56))]
    return score(M.N, t, chords, millions, cutoff=1600)


if __name__ == '__main__':
    k = sys.argv[1]
    d = f'/home/claude/lp/w1101/out/{k}'
    W = words(f'{d}/words_fast.json')
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{d}/silent.mp4']).decode())
    M = Mix(dur)
    fn = {'w1101-01-bomber-holes': bomber, 'w1101-02-guard-faint': guard, 'w1101-03-speed-camera': calc, 'w1101-04-cane-toads': toads}[k]
    music = fn(M, W, dur)
    music = music / (np.abs(music).max() or 1)
    finish(M, f'{d}/voice_fast.wav', music, d)
