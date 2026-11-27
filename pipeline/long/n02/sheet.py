"""contact sheet: two stills per beat -> out/sheet_<n>.png"""
import sys
sys.path.insert(0, '/home/claude/lv')
import skia, render as R
keys = [s for s in R.T['segs'] if s['kind'] == 'beat']
only = sys.argv[1].split(',') if len(sys.argv) > 1 else None
if only:
    keys = [s for s in keys if s['key'] in only]
cols, tw, th = 4, 480, 270
per = 24
for page in range(0, len(keys) * 2, per):
    items = []
    for s in keys:
        for f in (0.35, 0.9):
            items.append((s['key'], s['t0'] + (s['t1'] - s['t0']) * f))
    items = items[page:page + per]
    if not items:
        break
    rows = (len(items) + cols - 1) // cols
    out = skia.Surface(cols * tw, rows * (th + 30))
    oc = out.getCanvas(); oc.clear(skia.Color(0, 0, 0))
    big = skia.Surface(1920, 1080)
    for i, (k, t) in enumerate(items):
        R.frame(t, big)
        img = big.makeImageSnapshot()
        x, y = (i % cols) * tw, (i // cols) * (th + 30)
        oc.drawImageRect(img, skia.Rect(x, y + 30, x + tw, y + 30 + th), skia.SamplingOptions(skia.FilterMode.kLinear))
        oc.drawString(f'{k} {t:.1f}', x + 6, y + 22, skia.Font(None, 20), skia.Paint(Color=skia.ColorWHITE))
    out.makeImageSnapshot().save(f'/home/claude/lv/out/sheet_{page // per}.png', skia.kPNG)
    print('sheet', page // per)
