"""Gate C/D package: stills every 2 s and at every cue, hand crops at 4 fps through every action, sheets for review."""
import sys, os, subprocess, json
sys.argv = ['x']
import build as B
from PIL import Image
D = B.OUT + '/review/pack'; os.makedirs(D, exist_ok=True)
V = B.OUT + '/final_nomusic.mp4'
def grab(t, path):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', V, '-frames:v', '1', path], check=True)
def sheet(paths, out, cols=5, size=(360, 640), labels=None):
    from PIL import ImageDraw
    ims = [Image.open(p).convert('RGB').resize(size) for p in paths]
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (size[0] * cols, size[1] * rows), (0, 0, 0))
    dr = ImageDraw.Draw(S)
    for i, im in enumerate(ims):
        x, y = (i % cols) * size[0], (i // cols) * size[1]; S.paste(im, (x, y))
        if labels: dr.rectangle([x, y, x + 70, y + 22], fill=(0, 0, 0)); dr.text((x + 4, y + 4), labels[i], fill=(255, 255, 0))
    S.save(out)
# stills every 2 s and at the cues
cues = sorted(set([0.0] + [round(x * 2.0, 2) for x in range(int(B.DUR / 2) + 1)] +
                  [round(v, 2) for v in (B.T_HE, B.T_A, B.T_TW, B.T_ONE, B.T_JOLT, B.T_VENT, B.T_THATS, B.T_QUIV, B.T_AND, B.T_ROUGH,
                                         B.T_KIND, B.T_COULD, B.T_CUT - 0.05, B.T_CUT + 0.05, B.T_SO, B.T_SLIDE, B.T_THEY, B.T_AND5, B.T_SLOW, B.DUR - 0.1)]))
cues = [c for c in cues if c < B.DUR]
ps = []
for t in cues:
    p = f'{D}/st_{t:06.2f}.png'; grab(t, p); ps.append(p)
for i in range(0, len(ps), 15):
    sheet(ps[i:i + 15], f'{D}/sheet_stills_{i // 15 + 1}.png', labels=[os.path.basename(p)[3:9] for p in ps[i:i + 15]])
# hand crops at 4 fps through every action (crop boxes in screen space)
def crops(a, b, box, name):
    out = []; t = a
    while t < min(b, B.DUR - 0.15):
        p = f'{D}/crop_{name}_{t:06.2f}.png'
        grab(t, p); Image.open(p).crop(box).save(p); out.append(p); t += 0.25
    for i in range(0, len(out), 20):
        sheet(out[i:i + 20], f'{D}/sheet_hands_{name}_{i // 20 + 1}.png', cols=5, size=(300, 300), labels=[os.path.basename(p)[-10:-4] for p in out[i:i + 20]])
crops(0.0, 5.0, (200, 700, 900, 1400), 'haul')
crops(B.T_AND, B.T_CUT, (100, 450, 900, 1250), 'yank_shoulder')
crops(B.T_CUT + 0.4, B.DUR, (0, 700, 1080, 1500), 'sled')
print('pack', len(ps), 'stills')
