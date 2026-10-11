"""Original royalty-free lo-fi style bed, synthesized with numpy (no samples, no licensing issues)."""
import numpy as np, soundfile as sf

SR = 44100

def _env(n, a, r):
    e = np.ones(n); na = int(a * SR); nr = int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e

def _note(freq, dur, kind="pad"):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == "pad":
        w = sum(np.sin(2 * np.pi * freq * k * t + k) / k ** 1.6 for k in (1, 2, 3))
        w += 0.5 * np.sin(2 * np.pi * freq * 1.004 * t)
        return w * _env(n, 0.25, 0.4) * 0.18
    if kind == "pluck":
        w = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
        return w * np.exp(-t * 7) * 0.22
    if kind == "bass":
        w = np.sin(2 * np.pi * freq * t)
        return w * _env(n, 0.01, 0.15) * 0.5

def _noise_hit(dur, hp, decay, gain, rng):
    n = int(dur * SR); x = rng.standard_normal(n)
    y = np.zeros(n); a = np.exp(-2 * np.pi * hp / SR); p = 0
    for i in range(n):
        y[i] = a * (y[i - 1] + x[i] - p) if i else x[i]; p = x[i]
    return y * np.exp(-np.arange(n) / SR * decay) * gain

def _kick(dur=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 13) * 0.75

def make_music(total, path, bpm=88, key=0, seed=1):
    rng = np.random.default_rng(seed)
    total = total + 2
    out = np.zeros(int(total * SR) + SR * 3)
    beat = 60 / bpm; bar = beat * 4
    def hz(m): return 440 * 2 ** ((m - 69 + key) / 12)
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
    nb = int(total / bar) + 2
    kick = _kick(); hat = _noise_hit(0.06, 6000, 70, 0.10, rng); snare = _noise_hit(0.18, 1500, 22, 0.16, rng)
    def put(x, at):
        i = int(at * SR)
        if i < len(out): out[i:i + len(x)] += x[:len(out) - i]
    for b in range(nb):
        ch = chords[b % 4]; t0 = b * bar
        for m in ch: put(_note(hz(m), bar * 1.05, "pad"), t0)
        put(_note(hz(ch[0] - 12), beat * 1.8, "bass"), t0)
        put(_note(hz(ch[0] - 12), beat * 1.2, "bass"), t0 + 2.5 * beat)
        for k, m in enumerate([ch[1], ch[2], ch[3], ch[2], ch[1], ch[3]]):
            put(_note(hz(m + 12), beat, "pluck"), t0 + k * beat * 0.75 + (0.04 * rng.random()))
        put(kick, t0); put(kick, t0 + 2 * beat + 0.5 * beat * 0.5)
        put(snare, t0 + beat); put(snare, t0 + 3 * beat)
        for h in range(8): put(hat * (1.0 if h % 2 else 0.6), t0 + h * beat / 2)
    out = out[:int(total * SR)]
    a = 0.22; y = np.zeros_like(out); prev = 0.0
    for i in range(len(out)):
        prev += a * (out[i] - prev); y[i] = prev
    y *= 1 + 0.03 * np.sin(2 * np.pi * 0.3 * np.arange(len(y)) / SR)
    y = y / (np.abs(y).max() + 1e-9) * 0.6
    y = np.stack([y, np.roll(y, 60)], axis=1)
    sf.write(path, y.astype(np.float32), SR)
    return path
