"""Cut the girl's side view painting (src.png, 539x963 green screen) into parts for tracing."""
import numpy as np, cv2, os
from PIL import Image
from scipy import ndimage
a = np.array(Image.open('src.png').convert('RGB')).astype(np.int16)
H, W = a.shape[:2]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = g > np.maximum(r, b) + 30
white_bg = a.min(-1) > 235
glow = (r > 190) & (g > 120) & (b < 110) & (r - b > 90)          # orange rim baked into the painting
fg = ~green & ~white_bg & ~glow
fg = ndimage.binary_opening(fg, iterations=1)
Y, X = np.mgrid[:H, :W]
def poly(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 1); return m > 0
def largest(m):
    lab, n = ndimage.label(m)
    if n <= 1: return m
    sz = ndimage.sum(m, lab, range(1, n + 1)); return lab == 1 + int(np.argmax(sz))
teal = fg & (g > r + 25) & (b > r + 15)
navy = fg & (b > r + 20) & (a.sum(-1) < 260)
skin = fg & (r > b + 25) & (r > g + 5) & (r > 90)
hair = fg & (a.sum(-1) < 170) & ~navy
whiteish = fg & (a.min(-1) > 170)
TORSO_P = [(255, 232), (300, 235), (325, 245), (340, 265), (352, 300), (353, 330), (346, 370), (344, 410), (344, 450),
           (343, 472), (300, 476), (265, 476), (228, 470), (224, 430), (222, 390), (222, 350), (228, 300), (240, 262)]
parts = {}
pony = (hair | (fg & (b > r + 10) & (Y < 105))) & poly([(130, 40), (250, 70), (250, 104), (219, 112), (219, 300), (120, 300)])
parts['pony'] = largest(ndimage.binary_closing(pony, iterations=2))
tie = fg & (b > r + 10) & (Y < 108) & (X < 252)
parts['head'] = largest(fg & (Y < 262) & ~tie & ~(teal & (Y > 225)) & poly([(222, 40), (420, 40), (420, 260), (330, 250), (300, 262), (262, 262), (222, 230)]))
back = poly([(222, 330), (250, 330), (250, 470), (226, 470)])
wb = fg & navy & poly([(222, 455), (350, 455), (350, 478), (222, 478)])
tor = ndimage.binary_closing((fg & teal & poly(TORSO_P)) | (back & poly(TORSO_P)) | wb, iterations=6)
parts['torso'] = largest(ndimage.binary_fill_holes(tor)) & poly(TORSO_P)
parts['shoe'] = largest(fg & (Y > 846) & (X > 300) & ~navy & ~skin)
parts['hand'] = largest(fg & skin & (Y > 488) & (X < 216) & (Y < 600))
parts['shirt'] = parts['torso']
os.makedirs('parts', exist_ok=True)
for k, m in parts.items():
    rgba = np.dstack([a.clip(0, 255).astype(np.uint8), (m * 255).astype(np.uint8)])
    Image.fromarray(rgba, 'RGBA').save(f'parts/{k}.png')
    ys, xs = np.nonzero(m); print(k, int(m.sum()), (xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) else None)
prev = np.full((H, W, 3), 60, np.uint8)
cols = {'pony': (255, 0, 255), 'head': (255, 80, 80), 'torso': (40, 40, 160), 'shirt': (0, 255, 255), 'shoe': (80, 160, 255), 'hand': (80, 255, 80)}
for k in ['torso', 'shirt', 'head', 'pony', 'hand', 'shoe']:
    prev[parts[k]] = (0.4 * np.array(cols[k]) + 0.6 * a[parts[k]]).astype(np.uint8)
Image.fromarray(prev).save('/tmp/side_prev.png')
