"""n35 build: python3 build.py stills t1,t2,...  |  python3 build.py seg f0 f1 out.mp4"""
import sys, os, json, importlib
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
import core as K
from PIL import Image

MODS = [m for m in os.environ.get('N35_MODS', 's_intro,s_read,s_press,s_steps,s_nose,s_tq,s_pack,s_end').split(',') if m]
SHOTS = []
for m in MODS:
    try:
        mod = importlib.import_module(m)
    except ModuleNotFoundError as e:
        if e.name == m:
            continue
        raise
    SHOTS += mod.SHOTS
SHOTS.sort(key=lambda s: s['t0'])


def frame(t):
    surf = skia.Surface(K.W, K.H); c = surf.getCanvas()
    c.clear(skia.Color(8, 20, 40))
    act = [s for s in SHOTS if s['t0'] - s.get('fin', 0.4) <= t < s['t1']]
    for s in act:
        fin = s.get('fin', 0.4)
        a = 1.0 if fin <= 0 else K.smooth((t - (s['t0'] - fin)) / fin)
        if a >= 0.999 or s is act[0]:
            s['fn'](c, t)
        else:
            c.saveLayerAlpha(None, int(255 * a))
            s['fn'](c, t)
            c.restore()
    K.header(c, t)
    K.chapter_card(c, t)
    K.pause_pill(c, t)
    return surf


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'stills':
        os.makedirs('/home/claude/n35/stills', exist_ok=True)
        for v in sys.argv[2].split(','):
            t = float(v)
            im = frame(t).makeImageSnapshot().toarray()[..., [2, 1, 0]]
            Image.fromarray(im).save(f'/home/claude/n35/stills/s_{t:07.2f}.jpg', quality=88)
            print('still', t, flush=True)
    elif mode == 'seg':
        import subprocess
        f0, f1, out = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1920x1080', '-r', '30',
                              '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        for fi in range(f0, f1):
            p.stdin.write(frame(fi / 30).makeImageSnapshot().toarray().tobytes())
            if fi % 300 == 0:
                print('frame', fi, flush=True)
        p.stdin.close(); p.wait()
        json.dump(K.SOUNDS, open(out + '.sounds.json', 'w'))
