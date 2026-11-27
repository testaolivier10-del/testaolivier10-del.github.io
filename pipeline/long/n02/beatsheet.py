"""Stills of one or more beats for checking: python3 beatsheet.py <key> [key ...]
Writes /tmp/bs/<key>_<i>.png (full size, at each cue + 1.2 s, the middle of the last part and the end) and /tmp/bs/<key>_sheet.png (a grid)."""
import sys, os
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import skia, render as R
os.makedirs('/tmp/bs', exist_ok=True)
for k in sys.argv[1:]:
    b = R.T['beats'][k]; ts = sorted(set([b['t0'] + 0.9] + [v + 1.2 for v in b['cues'].values()] + [b['t1'] - 0.1]))
    extra = [(ts[i] + ts[i + 1]) / 2 for i in range(len(ts) - 1) if ts[i + 1] - ts[i] > 7]
    ts = sorted([t for t in ts + extra if b['t0'] <= t <= b['t1'] + 9])
    n = len(ts); cols = 3 if n > 4 else 2; rows = (n + cols - 1) // cols
    sh = skia.Surface(960 * cols, 540 * rows); sc = sh.getCanvas()
    for i, t in enumerate(ts):
        img = R.frame(t).makeImageSnapshot(); img.save(f'/tmp/bs/{k}_{i}.png', skia.kPNG)
        sc.drawImageRect(img, skia.Rect(960 * (i % cols), 540 * (i // cols), 960 * (i % cols) + 960, 540 * (i // cols) + 540), skia.SamplingOptions(skia.FilterMode.kLinear))
    sh.makeImageSnapshot().save(f'/tmp/bs/{k}_sheet.png', skia.kPNG); print(k, [round(t, 1) for t in ts])
