"""cut two silent pauses (checked: below -80 dB) and shift the word times: 11.05-11.40 and 31.45-31.70"""
import json, numpy as np, soundfile as sf, librosa
SR = 44100; CUTS = [(11.05, 11.40), (31.45, 31.70)]
y, _ = librosa.load('out/voice.wav', sr=SR, mono=True)
parts = []; last = 0
for a, b in CUTS:
    parts.append(y[int(last * SR):int(a * SR)]); last = b
parts.append(y[int(last * SR):])
fd = int(0.01 * SR)
out = parts[0]
for p in parts[1:]:
    out = np.concatenate([out[:-fd], out[-fd:] * np.linspace(1, 0, fd) + p[:fd] * np.linspace(0, 1, fd), p[fd:]])
sf.write('out/voice_t.wav', out, SR)
def shift(x):
    s = 0
    for a, b in CUTS:
        if x >= b: s += b - a
        elif x > a: s += x - a
    return x - s
w = json.load(open('out/words.json'))
for x in w: x['t0'] = round(shift(x['t0']), 3); x['t1'] = round(shift(x['t1']), 3)
json.dump(w, open('out/words_t.json', 'w'), indent=0)
print('new end', w[-1]['t1'], 'len', len(out) / SR)
