"""Flatness check, long video rule (video standard section 5): flag any stretch of 15 s or more whose sentence median
pitch spread is under 2 semitones AND loudness spread under 3 dB. Also prints the in-sentence pitch range (liveliness)."""
import sys, json, numpy as np, librosa
au, wj = sys.argv[1], sys.argv[2]
y, sr = librosa.load(au, sr=22050, mono=True); W = json.load(open(wj))
sents, cur = [], []
for w in W:
    cur.append(w)
    if w['w'].rstrip('"').endswith(('.', '?', '!')): sents.append(cur); cur = []
if cur: sents.append(cur)
rows = []
for s in sents:
    seg = y[int(s[0]['t0'] * sr):int(s[-1]['t1'] * sr)]
    if len(seg) < sr * 0.3: continue
    f0, vf, _ = librosa.pyin(seg, fmin=60, fmax=400, sr=sr); f0 = f0[vf & ~np.isnan(f0)]
    if len(f0) < 5: continue
    st = 12 * np.log2(f0 / 100.0); m0 = np.median(st); st = np.where(st - m0 > 9, st - 12, np.where(m0 - st > 9, st + 12, st))
    rms = librosa.feature.rms(y=seg)[0]; rms = rms[rms > rms.max() * 0.1]
    rows.append(dict(t0=s[0]['t0'], t1=s[-1]['t1'], med=float(np.median(st)), rng=float(np.percentile(st, 90) - np.percentile(st, 10)), db=float(20 * np.log10(np.mean(rms) + 1e-9)), text=' '.join(x['w'] for x in s)[:40]))
flags = []
for i in range(len(rows)):
    j = i
    while j + 1 < len(rows):
        w = rows[i:j + 2]
        if max(r['med'] for r in w) - min(r['med'] for r in w) < 2 and max(r['db'] for r in w) - min(r['db'] for r in w) < 3: j += 1
        else: break
    if rows[j]['t1'] - rows[i]['t0'] >= 15 and j > i: flags.append((rows[i]['t0'], rows[j]['t1'], rows[i]['text']))
over = [r for r in rows if r['rng'] > 14]
print(f"sentences {len(rows)}, mean in sentence range {np.mean([r['rng'] for r in rows]):.1f} st, flat stretches of 15 s or more: {len(flags)}, over acted: {len(over)}")
for a, b, s in flags: print(f"  FLAT {a:.1f}-{b:.1f} s: {s}")
