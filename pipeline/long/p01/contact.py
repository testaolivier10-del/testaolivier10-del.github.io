"""contact sheet: two stills per beat (60% through and just before the end), plus each chapter card"""
import sys, traceback; sys.path.insert(0, '/home/claude/lv')
import render as R, numpy as np, cv2
out = sys.argv[1]; only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
ims = []
for s in R.T['segs']:
    if s['kind'] != 'beat': continue
    k = s['key']
    if only and k not in only: continue
    for u in (0.55, 0.97):
        t = s['t0'] + (s['t1'] - s['t0']) * u
        try:
            R.still(t, '/tmp/_c.png'); im = cv2.resize(cv2.imread('/tmp/_c.png'), (640, 360))
        except Exception as e:
            im = np.zeros((360, 640, 3), np.uint8); print(k, 'ERR', repr(e)[:200]); traceback.print_exc(limit=2)
        cv2.putText(im, f'{k} {t:.1f}', (8, 30), 0, 0.9, (0, 0, 255), 2); ims.append(im)
while len(ims) % 4: ims.append(np.zeros_like(ims[0]))
rows = [np.hstack(ims[i:i + 4]) for i in range(0, len(ims), 4)]
for j in range(0, len(rows), 4):
    cv2.imwrite(f'{out}_{j // 4}.png', np.vstack(rows[j:j + 4]))
print('ok', len(ims))
