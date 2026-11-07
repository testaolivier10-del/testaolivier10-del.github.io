"""Flatness check (video standard section 5): pitch (librosa pyin) and loudness (RMS) per sentence from the word timings.
Flags any window of 3+ sentences whose median pitch spread is under 2 semitones AND loudness spread under 3 dB (flat),
and any sentence whose pitch range is over 14 semitones (over acted). usage: flatcheck.py voice.(mp3|wav) words.json"""
import sys, json, numpy as np, librosa
au, wj = sys.argv[1], sys.argv[2]
y, sr = librosa.load(au, sr=22050, mono=True)
W = json.load(open(wj))
sents, cur = [], []
for w in W:
    cur.append(w)
    if w['w'].rstrip('"').endswith(('.', '?', '!')): sents.append(cur); cur = []
if cur: sents.append(cur)
rows = []
for s in sents:
    a, b = int(s[0]['t0'] * sr), int(s[-1]['t1'] * sr)
    seg = y[a:b]
    if len(seg) < sr * 0.3: continue
    f0, vf, _ = librosa.pyin(seg, fmin=60, fmax=400, sr=sr)
    f0 = f0[vf & ~np.isnan(f0)]
    if len(f0) < 5: continue
    st = 12 * np.log2(f0 / 100.0)
    m0 = np.median(st); st = np.where(st - m0 > 9, st - 12, np.where(m0 - st > 9, st + 12, st))   # fold pyin octave errors
    rms = librosa.feature.rms(y=seg)[0]; rms = rms[rms > rms.max() * 0.1]
    rows.append(dict(text=' '.join(x['w'] for x in s)[:50], med=float(np.median(st)), rng=float(np.percentile(st, 90) - np.percentile(st, 10)),
                     db=float(20 * np.log10(np.mean(rms) + 1e-9))))
flags = []
for i in range(len(rows) - 2):
    w3 = rows[i:i + 3]
    ps = max(r['med'] for r in w3) - min(r['med'] for r in w3); ls = max(r['db'] for r in w3) - min(r['db'] for r in w3)
    if ps < 2 and ls < 3: flags.append(f"FLAT sentences {i+1}-{i+3}: pitch spread {ps:.1f} st, loudness spread {ls:.1f} dB")
for i, r in enumerate(rows):
    if r['rng'] > 14: flags.append(f"OVER sentence {i+1}: range {r['rng']:.1f} st ({r['text']})")
meds = [r['med'] for r in rows]; dbs = [r['db'] for r in rows]
print(f"sentences {len(rows)}, median pitch spread {max(meds)-min(meds):.1f} st, loudness spread {max(dbs)-min(dbs):.1f} dB, mean in-sentence range {np.mean([r['rng'] for r in rows]):.1f} st")
for f in flags: print(f)
print('FLATNESS CHECK PASSED' if not flags else 'FLATNESS CHECK FLAGGED')
