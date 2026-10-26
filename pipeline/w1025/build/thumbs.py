"""Two thumbnail concepts per Short from its own rendered stills (art zone only, no captions), house fonts."""
import sys, json
sys.path.insert(0, '/home/claude/w1025'); sys.path.insert(0, '/home/claude/short')
import numpy as np, skia
from PIL import Image
import kit as K, layout as L
from layout import col, TEAL, YELLOW, CORAL, WHITE, GREEN
OUT = '/home/claude/w1025/out'
C = {
 'w1025-01-power-lift': [(1.5, 0.55, ['THIS WRECKS', 'EMT BACKS'], CORAL, 'x'), (12.5, 0.5, ['YOUR BACK', 'IS A LEVER'], YELLOW, None)],
 'w1025-02-free-throw': [(0.5, 0.5, ['5 MISSES.', 'NEXT ONE DUE?'], CORAL, None), (21.0, 0.5, ['THE BALL HAS', 'NO MEMORY'], TEAL, None)],
 'w1025-03-dead-zone': [(3.0, 0.45, ['FERTILIZER', '+ A STORM'], CORAL, None), (19.0, 0.5, ['HOW A LAKE', 'DIES'], CORAL, None)],
 'w1025-04-head-rush': [(1.0, 0.45, ['STOOD UP', 'TOO FAST?'], CORAL, None), (8.0, 0.5, ['WHERE YOUR', 'BLOOD GOES'], CORAL, None)],
}
import subprocess
def still(vid, t):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{t}', '-i', f'{OUT}/{vid}/silent.mp4', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(1920, 1080, 3)
ONLY = sys.argv[1:]
for vid, cons in C.items():
    if ONLY and vid not in ONLY:
        continue
    for n, (t, fx, lines, acc, stamp) in enumerate(cons):
        a = still(vid, t)[430:1400]
        h = 1920; s = h / a.shape[0]; w = int(a.shape[1] * s)
        im = np.array(Image.fromarray(a).resize((w, h), Image.LANCZOS))
        x0 = int(np.clip(fx * w - 540, 0, w - 1080)); im = im[:, x0:x0 + 1080]
        surf = skia.Surface(1080, 1920); c = surf.getCanvas()
        c.drawImage(K.skimg(np.ascontiguousarray(im)), 0, 0)
        sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 760)], [skia.Color(5, 12, 26, 235), skia.Color(5, 12, 26, 0)])
        c.drawRect(skia.Rect(0, 0, 1080, 760), skia.Paint(Shader=sh))
        for i, (ln, cl) in enumerate(zip(lines, (WHITE, acc))):
            f = skia.Font(L.BLACK, 120); wd = f.measureText(ln)
            sz = min(120, 120 * 980 / wd)
            K.text(c, ln, 540, 330 + i * 150, sz, (5, 12, 26), 0.6, center=True)
            K.text(c, ln, 536, 324 + i * 150, sz, cl, 1.0, center=True)
        if stamp == 'x':
            K.x_stamp(c, 820, 900, 0.9, 1.0)
        surf.makeImageSnapshot().save(f'{OUT}/{vid}/thumb_{"ab"[n]}.png', skia.kPNG)
    print('thumbs', vid)
