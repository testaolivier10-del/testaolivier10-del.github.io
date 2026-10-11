"""Original synthesized sound effects for LevlPrep videos (numpy only, royalty free, no downloads).
python3 sfx.py  -> writes assets/<name>.wav for every effect below."""
import numpy as np, soundfile as sf

SR = 44100
rng = np.random.default_rng(7)


def t_(d): return np.arange(int(d * SR)) / SR


def noise(d, color="white"):
    n = rng.standard_normal(int(d * SR))
    if color == "pink":
        f = np.fft.rfft(n); k = np.arange(len(f)); k[0] = 1; n = np.fft.irfft(f / np.sqrt(k), len(n))
    if color == "brown":
        n = np.cumsum(n); n -= np.convolve(n, np.ones(2000) / 2000, "same")
    return n / (np.abs(n).max() + 1e-9)


def lp(x, fc):
    """One pole lowpass; fc may be an array (sweep)."""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); p = 0.0
    for i in range(len(x)):
        p += a[i] * (x[i] - p); y[i] = p
    return y


def hp(x, fc): return x - lp(x, fc)


def bp(x, lo, hi): return hp(lp(x, hi), lo)


def env(d, a=0.005, r=0.1, curve=1.0):
    n = int(d * SR); e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e


def norm(x, peak=0.9): return x / (np.abs(x).max() + 1e-9) * peak


def save(name, x, stereo_width=0.0):
    x = norm(x)
    if False and stereo_width:
        d = int(stereo_width * SR / 1000); x = np.stack([x, np.roll(x, d)], 1)
    sf.write(f"/home/claude/lp/assets/{name}.wav", x.astype(np.float32), SR)


def crackle_clicks(d, rate, amp=1.0, hi=True):
    out = np.zeros(int(d * SR)); n = int(d * rate)
    for _ in range(n):
        i = rng.integers(0, len(out) - 400); L = rng.integers(40, 260)
        c = rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(0.3, 1.0)
        out[i:i + L] += c
    return hp(out, 1500) * amp if hi else out * amp


# fire catching: a low whoomp with a rising roar
d = 0.9; t = t_(d)
roar = lp(noise(d, "pink"), np.linspace(300, 3500, len(t))) * env(d, 0.02, 0.5, 2)
thump = np.sin(2 * np.pi * (50 + 60 * np.exp(-t * 18)) * t) * np.exp(-t * 7)
save("ignite", roar * 1.0 + thump * 0.8 + crackle_clicks(d, 30, 0.35), 0.4)

# fire bed: roar plus crackle, steady
d = 2.4
bed = lp(noise(d, "brown"), 900) * 0.7 + bp(noise(d), 800, 3000) * 0.12 + crackle_clicks(d, 45, 0.6)
bed *= (1 + 0.25 * np.sin(2 * np.pi * 3.1 * t_(d))) * env(d, 0.05, 0.4)
save("fire", bed, 0.6)

# sizzle on skin
d = 0.9; t = t_(d)
sz = hp(noise(d), 4000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t))) * env(d, 0.01, 0.5, 1.5)
save("sizzle", sz + crackle_clicks(d, 60, 0.4), 0.3)

# flinch: body jolt (punchy low thud plus a cloth snap)
d = 0.45; t = t_(d)
th = np.sin(2 * np.pi * (60 + 120 * np.exp(-t * 35)) * t) * np.exp(-t * 14)
snap = bp(noise(d), 1500, 6000) * np.exp(-t * 40)
save("flinch", th + snap * 0.6)

# steam hiss as the flame goes out
d = 1.2; t = t_(d)
save("hiss", hp(noise(d, "pink"), 2500) * env(d, 0.02, 0.9, 2) * (1 - 0.3 * t / d), 0.5)

# cinematic dive whoosh: band sweeps down, ends in a soft low boom
d = 1.0; t = t_(d)
sw = bp(noise(d, "pink"), 200, np.linspace(6000, 300, len(t)).mean()) * 0 + lp(noise(d, "pink"), np.linspace(7000, 250, len(t)))
sw *= np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
boom = np.sin(2 * np.pi * (45 + 30 * np.exp(-(t - 0.7).clip(0) * 10)) * t) * np.exp(-(t - 0.7).clip(0) * 6) * (t > 0.7)
save("dive", sw + boom * 0.9, 0.5)

# inside the body: muffled heartbeat (lub dub)
d = 0.9; t = t_(d)
def thump_at(t0, f=55, k=16):
    tt = (t - t0).clip(0); return np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) * (t >= t0)
save("heartbeat", lp(thump_at(0.0) + 0.7 * thump_at(0.22, 48), 300))

# nerve pain signal: electric zap
d = 0.32; t = t_(d)
z = np.sign(np.sin(2 * np.pi * (220 + 90 * np.sin(2 * np.pi * 37 * t)) * t)) * 0.5 + bp(noise(d), 2000, 7000) * 0.4
save("zap", lp(z, 5000) * env(d, 0.003, 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 61 * t) ** 2))

# numb: pitch falls away into nothing
d = 1.1; t = t_(d)
f = 420 * np.exp(-t * 2.2) + 60
ph = 2 * np.pi * np.cumsum(f) / SR
save("numb", lp(np.sin(ph) + 0.3 * np.sin(2 * ph), 1800) * env(d, 0.01, 0.8, 2) * np.exp(-t * 1.5), 0.8)

# tension riser into the treatment section
d = 1.0; t = t_(d)
ri = lp(noise(d, "pink"), np.linspace(400, 8000, len(t))) * (t / d) ** 2 + np.sin(2 * np.pi * np.cumsum(np.linspace(180, 520, len(t))) / SR) * (t / d) ** 2 * 0.4
save("riser", ri * env(d, 0.01, 0.03), 0.4)

# running water from a tap
d = 2.6; t = t_(d)
w = bp(noise(d, "pink"), 300, 5000) * 0.6
bub = np.zeros_like(t)
for _ in range(70):
    t0 = rng.uniform(0, d - 0.06); L = int(rng.uniform(0.02, 0.05) * SR); i = int(t0 * SR)
    ff = rng.uniform(500, 1600); tt = np.arange(L) / SR
    bub[i:i + L] += np.sin(2 * np.pi * (ff + ff * 3 * tt / tt[-1]) * tt) * np.exp(-tt * 60) * rng.uniform(0.2, 0.6)
save("water", (w + bub) * env(d, 0.12, 0.4), 0.7)

# metal clink (watch clasp, ring)
d = 0.6; t = t_(d)
cl = sum(np.sin(2 * np.pi * f0 * t + p) * np.exp(-t * k) for f0, k, p in ((2350, 9, 0), (3720, 12, 1), (5210, 16, 2), (6930, 20, .5)))
save("clink", cl * env(d, 0.001, 0.2), 0.3)

# wrong / not allowed: two short low buzzes
d = 0.5; t = t_(d)
bz = np.sign(np.sin(2 * np.pi * 140 * t)) * (((t > 0.0) & (t < 0.17)) | ((t > 0.24) & (t < 0.41)))
save("wrong", lp(bz, 1600) * 0.8)

# gauze landing: soft padded pat
d = 0.3; t = t_(d)
save("pat", lp(noise(d, "pink"), 900) * np.exp(-t * 25) + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30) * 0.6)

# blanket: long cloth swoosh with fabric texture
d = 1.0; t = t_(d)
cloth = bp(noise(d, "pink"), 400, 3500) * np.sin(np.pi * t / d) ** 1.2 * (0.7 + 0.3 * np.abs(np.sin(2 * np.pi * 9 * t)))
save("cloth", cloth, 0.6)

# checklist tick (softer, warmer than the old tick)
d = 0.12; t = t_(d)
save("check", np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 55) + np.sin(2 * np.pi * 1950 * t) * np.exp(-t * 70) * 0.5)

# magnifier: glassy shimmer
d = 0.7; t = t_(d)
sh = sum(np.sin(2 * np.pi * f0 * t) * np.exp(-t * 5) * np.exp(-((t - dt).clip(0) * 0)) * (t >= dt) for f0, dt in ((1760, 0), (2217, .05), (2637, .1), (3520, .15)))
save("shimmer", sh * env(d, 0.002, 0.3), 0.5)

# step whoosh (short, bright) for the numbered steps
d = 0.35; t = t_(d)
save("swish", hp(noise(d, "pink"), 1200) * np.sin(np.pi * t / d) ** 2, 0.3)
print("sfx written")
