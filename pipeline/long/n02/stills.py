"""stills: python3 stills.py <outdir> key[:n] ...  (n stills spread over the beat, default 2) or t=<seconds>"""
import sys
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import render as R, os
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
for a in sys.argv[2:]:
    if a.startswith('t='):
        R.still(float(a[2:]), f'{out}/t{a[2:]}.png'); continue
    k, _, n = a.partition(':'); n = int(n or 2); b = R.BB.Bt[k]
    for i in range(n):
        t = b['t0'] + (b['t1'] - b['t0']) * ((i + 0.85) / n) if n > 1 else b['t1'] - 0.2
        R.still(t, f'{out}/{k}_{i}.png')
