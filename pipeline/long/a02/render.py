"""Scene engine for the A&P 02 pilot: timeline -> frames. Chapter cards, beat scenes with crossfades, pause timers.
python render.py still <t> [out.png]     one frame
python render.py seg <i> <n> <out.mp4>  render part i of n (silent video)"""
import sys, subprocess, bisect
import numpy as np
import skia
sys.path.insert(0, '/home/claude/lv')
import tl
import kit as K
import scenes as SC

T = tl.build()
SC.Bt = T['beats']
DUR = T['DUR']
W, H, FPS = K.W, K.H, K.FPS
XF = 0.45          # crossfade length

# ordered list of (t0, kind, payload) for lookup
EV = []
for s in T['segs']:
    if s['kind'] == 'card':
        EV.append((s['t0'], 'card', s))
    elif s['kind'] == 'beat':
        EV.append((s['t0'], 'beat', s))
EV.sort(key=lambda e: e[0])
STARTS = [e[0] for e in EV]
PAUSES = [s for s in T['segs'] if s['kind'] == 'pause']
CARD_END = {}
for s in T['segs']:
    if s['kind'] == 'card':
        CARD_END[s['t0']] = s['t1']


def draw_event(c, e, t):
    kind, s = e[1], e[2]
    c.save()
    if kind == 'card':
        K.card(c, t, s['title'], s['n'], (t - s['t0']) / (s['t1'] - s['t0']))
    else:
        f = SC.SCENES.get(s['key'])
        if f is None:
            K.calm_bg(c, t)
        else:
            f(c, t)
    c.restore()


def ev_at(t):
    i = bisect.bisect_right(STARTS, t) - 1
    return max(i, 0)


def frame(t, surf=None):
    surf = surf or skia.Surface(W, H)
    c = surf.getCanvas()
    c.clear(skia.Color(20, 26, 51))
    i = ev_at(t)
    e = EV[i]
    # beats keep drawing their own scene through the gap after them; the first beat of the video is shown from t=0
    nxt = EV[i + 1] if i + 1 < len(EV) else None
    same = lambda a, b: a is not None and b is not None and a[1] == 'beat' and b[1] == 'beat' and SC.SCENES.get(a[2]['key']) is SC.SCENES.get(b[2]['key'])
    if nxt is not None and t > nxt[0] - XF and not same(e, nxt):
        u = K.sm((t - (nxt[0] - XF)) / XF)
        draw_event(c, e, t)
        c.saveLayerAlpha(None, int(255 * u))
        draw_event(c, nxt, t)
        c.restore()
    else:
        draw_event(c, e, t)
    for p in PAUSES:
        if p['t0'] - 0.3 <= t <= p['t1'] + 0.3:
            a = K.win(t, p['t0'] - 0.3, p['t1'], 0.3, 0.3)
            K.timer(c, (t - p['t0']) / (p['t1'] - p['t0']), a=a)
            K.text(c, 'pause and try it', W - 130, 230, 26, K.CREAM, a, 'semi', 'center')
    # fade in from black at the start, out at the very end
    fa = max(1 - t / 0.6, 0, (t - (DUR - 0.8)) / 0.8)
    if fa > 0:
        c.drawRect(skia.Rect(0, 0, W, H), K.P((0, 0, 0), 255 * min(1, fa)))
    return surf


def still(t, out):
    s = frame(t)
    s.makeImageSnapshot().save(out, skia.kPNG)


def seg(i, n, out):
    N = int(DUR * FPS)
    a, b = N * i // n, N * (i + 1) // n
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    surf = skia.Surface(W, H)
    for f in range(a, b):
        frame(f / FPS, surf)
        img = surf.makeImageSnapshot()
        ff.stdin.write(img.tobytes())
        if (f - a) % 900 == 0:
            print(f'part {i}: {f - a}/{b - a}', flush=True)
    ff.stdin.close(); ff.wait()


if __name__ == '__main__':
    if sys.argv[1] == 'still':
        still(float(sys.argv[2]), sys.argv[3] if len(sys.argv) > 3 else '/tmp/still.png')
    elif sys.argv[1] == 'seg':
        seg(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
