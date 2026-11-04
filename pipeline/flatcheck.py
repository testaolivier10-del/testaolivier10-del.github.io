"""Flatness check (video standard section 5): how much does the voice actually move?
usage: python3 flatcheck.py <audio> <words.json> [--long] [--ref flatcheck_ref.json]
       python3 flatcheck.py --calibrate <take_d.mp3> <take_d_words.json> -> writes flatcheck_ref.json
words.json: a list of [word, start, end], or a long video chapter file (list of beats with "words").
Per sentence: median pitch (librosa pyin, semitones) and median loudness (RMS dB) over its voiced frames, plus the
pitch range inside the sentence. FLAT: a window of 3+ sentences (or 15+ s with --long) whose sentence pitch medians
spread under 2 semitones AND loudness under 3 dB AND the pitch
moves less inside those sentences than in take D (mean inner range under take D's median). OVER: a sentence whose inner pitch range or loudness jump is far
beyond take D (ref max x 1.5, or +6 dB over the take's median). Exit 1 when anything is flagged."""
import sys, json, os
import numpy as np, librosa

HERE = os.path.dirname(os.path.abspath(__file__))


def load_words(p):
    d = json.load(open(p))
    if d and isinstance(d[0], dict):
        d = [w for b in d for w in b['words']]
    return [(w, float(a), float(b)) for w, a, b in d if not (w.startswith('[') or w.endswith(']'))]


def sentences(words):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if w[0].rstrip('"\')').endswith(('.', '?', '!')):
            out.append(cur); cur = []
    if cur: out.append(cur)
    return [(s[0][1], s[-1][2], ' '.join(x[0] for x in s)) for s in out]


def analyse(audio, words):
    y, sr = librosa.load(audio, sr=16000, mono=True)
    hop = 160
    f0, vf, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr, frame_length=1024, hop_length=hop)
    rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-6)
    t = np.arange(len(f0)) * hop / sr
    res = []
    for a, b, txt in sentences(words):
        m = (t >= a) & (t <= b)
        v = m & vf & np.isfinite(f0)
        if v.sum() < 5:
            continue
        st = 12 * np.log2(f0[v] / 100.0)
        res.append(dict(a=round(a, 2), b=round(b, 2), text=txt, pitch=float(np.median(st)), prange=float(np.percentile(st, 95) - np.percentile(st, 5)),
                        loud=float(np.median(db[m & (db > db.max() - 40)]))))
    return res


def check(res, ref, long=False):
    flags = []
    n = len(res)
    for i in range(n):
        for j in range(i + 2, n):
            w = res[i:j + 1]
            if long and (w[-1]['b'] - w[0]['a']) < 15 and j - i < 4:
                continue
            ps = max(x['pitch'] for x in w) - min(x['pitch'] for x in w)
            ls = max(x['loud'] for x in w) - min(x['loud'] for x in w)
            inner = float(np.mean([x['prange'] for x in w]))
            if ps < ref['flat_pitch'] and ls < ref['flat_loud'] and inner < ref['median_prange']:
                flags.append(('FLAT', w[0]['a'], w[-1]['b'], round(ps, 2), round(ls, 2), w[0]['text'][:60]))
            else:
                break
    # merge overlapping flat windows
    merged = []
    for f in sorted(flags, key=lambda f: f[1]):
        if merged and f[1] <= merged[-1][2]:
            merged[-1] = (merged[-1][0], merged[-1][1], max(merged[-1][2], f[2]), merged[-1][3], merged[-1][4], merged[-1][5])
        else:
            merged.append(f)
    med = float(np.median([x['loud'] for x in res])) if res else 0
    over = [('OVER', x['a'], x['b'], round(x['prange'], 1), round(x['loud'] - med, 1), x['text'][:60]) for x in res
            if x['prange'] > ref['max_prange'] * 1.5 or x['loud'] - med > 6]
    return merged, over


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[0] == '--calibrate':
        res = analyse(a[1], load_words(a[2]))
        p = [x['pitch'] for x in res]; l = [x['loud'] for x in res]; pr = [x['prange'] for x in res]
        ref = dict(source='take D (grease fire, Jeremy, eleven_v4, voiced 2026-11-04)', sentences=len(res),
                   pitch_spread=round(max(p) - min(p), 2), loud_spread=round(max(l) - min(l), 2), max_prange=round(max(pr), 2),
                   median_prange=round(float(np.median(pr)), 2), flat_pitch=2.0, flat_loud=3.0)
        json.dump(ref, open(os.path.join(HERE, 'flatcheck_ref.json'), 'w'), indent=1)
        print(json.dumps(ref, indent=1)); sys.exit(0)
    long = '--long' in a
    refp = a[a.index('--ref') + 1] if '--ref' in a else os.path.join(HERE, 'flatcheck_ref.json')
    ref = json.load(open(refp))
    res = analyse(a[0], load_words(a[1]))
    flat, over = check(res, ref, long)
    p = [x['pitch'] for x in res]; l = [x['loud'] for x in res]
    print(f"{len(res)} sentences; pitch spread {max(p) - min(p):.1f} st (take D {ref['pitch_spread']}), loudness spread {max(l) - min(l):.1f} dB (take D {ref['loud_spread']})")
    for f in flat + over:
        print(*f)
    print('PASS' if not (flat or over) else 'FLAGGED')
    sys.exit(1 if (flat or over) else 0)
