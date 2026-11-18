"""Splice the re-voiced first three sentences (respelled von Too-nen, sped 5 percent like the rest) onto the old take from 'Land',
then shorten long pauses. Writes out/voice.wav (new), out/words.json (new) and out/timemap.json (old word starts -> new word starts)."""
import json, subprocess, numpy as np, soundfile as sf
O = '/home/claude/w1118/thunen/out'; SR = 44100
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{O}/v2/voice.mp3', '-af', 'atempo=1.05', '-ar', '44100', '-ac', '1', f'{O}/v2/head.wav'], check=True)
head, _ = sf.read(f'{O}/v2/head.wav'); old, _ = sf.read(f'{O}/voice_v1.wav')
hw = json.load(open(f'{O}/v2/words.json')); hw = [dict(w, t0=w['t0'] / 1.05, t1=w['t1'] / 1.05) for w in hw if not w['w'].startswith('[')]
ow = json.load(open(f'{O}/words_v1.json'))
iL = [i for i, w in enumerate(ow) if w['w'] == 'Land'][0]
assert len(hw) == iL, (len(hw), iL)
cut_old = ow[iL]['t0'] - 0.12
# end of the head take: last sample above the noise floor after 'why.'
env = np.abs(head); thr = 0.02 * env.max(); last = np.nonzero(env > thr)[0][-1] / SR
hend = last + 0.06
comb = np.concatenate([head[:int(hend * SR)], np.zeros(int(0.4 * SR)), old[int(cut_old * SR):]])
shift = hend + 0.4 - cut_old
cw = [dict(w) for w in hw] + [dict(w, t0=w['t0'] + shift, t1=w['t1'] + shift) for w in ow[iL:]]
# shorten silences: find runs quieter than -38 dB under the peak longer than 0.5 s, keep 0.36 s of each (0.5 s for the 'edge...' pause)
fr = int(0.01 * SR); n = len(comb) // fr
rms = np.sqrt(np.mean(comb[:n * fr].reshape(n, fr) ** 2, 1)); db = 20 * np.log10(rms + 1e-9) - 20 * np.log10(rms.max())
quiet = db < -30
runs = []; i = 0
while i < n:
    if quiet[i]:
        j = i
        while j < n and quiet[j]: j += 1
        runs.append((i * 0.01, j * 0.01)); i = j
    else: i += 1
edge_t = [w['t1'] for w in cw if w['w'].startswith('edge')][0]
cuts = []
for a, b in runs:
    if a < 0.2 or b > len(comb) / SR - 0.1: continue
    keep = 0.5 if abs(a - edge_t) < 0.6 else 0.32
    if b - a > keep + 0.08: cuts.append((a + keep / 2, b - keep / 2))
out = []; pos = 0.0
for a, b in cuts: out.append(comb[int(pos * SR):int(a * SR)]); pos = b
out.append(comb[int(pos * SR):]); final = np.concatenate(out)
def remap(t):
    s = 0.0
    for a, b in cuts:
        if t >= b: s += b - a
        elif t > a: s += t - a
    return t - s
nw = [dict(w, t0=round(remap(w['t0']), 3), t1=round(remap(w['t1']), 3)) for w in cw]
for w in nw: w['w'] = w['w'].replace('Too-nen', 'Thunen')
sf.write(f'{O}/voice.wav', final, SR)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{O}/voice.wav', '-b:a', '192k', f'{O}/voice.mp3'], check=True)
json.dump(nw, open(f'{O}/words.json', 'w'), indent=0)
json.dump({'old': [w['t0'] for w in ow] + [ow[-1]['t1']], 'new': [w['t0'] for w in nw] + [nw[-1]['t1']]}, open(f'{O}/timemap.json', 'w'))
print('cuts', len(cuts), 'saved', round(sum(b - a for a, b in cuts), 2), 'new end', nw[-1]['t1'], 'old end', ow[-1]['t1'], 'len', round(len(final) / SR, 2))
print(' '.join(f"{w['w']}@{w['t0']:.2f}" for w in nw))
