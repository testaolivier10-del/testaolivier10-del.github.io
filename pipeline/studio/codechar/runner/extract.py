"""Cut the approved hoodie runner painting (src.png, 572x1023, green screen) into design parts for tracing.
Coordinates are painting pixels. Output: parts/<name>.png (RGBA, painting frame)."""
import numpy as np, cv2, os
from PIL import Image
from scipy import ndimage

a = np.array(Image.open('src.png').convert('RGB')).astype(np.int16)
H, W = a.shape[:2]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = g > np.maximum(r, b) + 25
glow = (r > 165) & (r - b > 85) & (g > 60)          # the orange fire rim baked into the painting
fg = ~green & ~glow
fg = ndimage.binary_opening(fg, iterations=1)
Y, X = np.mgrid[:H, :W]


def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m > 0


def largest(m):
    lab, n = ndimage.label(m)
    if n <= 1:
        return m
    sz = ndimage.sum(m, lab, range(1, n + 1))
    return lab == 1 + int(np.argmax(sz))


jeans = fg & (b - r > 45) & (g - r > 12)
skin = fg & (r > b + 12) & (r > g + 8)
dark = fg & (a.sum(-1) < 215)
lav = fg & (b > 150) & (r > 120)

TORSO_P = [(248, 206), (285, 207), (318, 220), (335, 232), (352, 246), (366, 262), (373, 280), (375, 300), (374, 350),
           (372, 395), (362, 425), (355, 450), (351, 480), (347, 510), (338, 528), (300, 526), (250, 522), (208, 518),
           (206, 490), (210, 450), (222, 400), (230, 365), (236, 330), (238, 295), (237, 262), (240, 230)]
SLEEVE_P = [(305, 300), (270, 266), (236, 258), (170, 298), (133, 345), (120, 400), (122, 456), (166, 460), (182, 402),
            (198, 370), (236, 348), (276, 333), (310, 322)]

parts = {}
parts['head'] = largest(fg & poly([(280, 80), (460, 80), (460, 250), (402, 262), (372, 270), (366, 300), (326, 300),
                                   (318, 222), (290, 205), (280, 150)]) & ~(poly(TORSO_P) & ~skin & ~dark & (Y > 255)))
parts['fist'] = largest(fg & skin & (Y > 470) & (X < 185) & (Y < 560))
parts['shoe'] = largest(fg & ~jeans & (Y > 878) & (X > 380))
tz = poly(TORSO_P) & ~poly(SLEEVE_P)
parts['tdark'] = ndimage.binary_opening(fg & tz & dark & ~skin & (Y > 230) & (Y < 486) & ~((X > 360) & (Y > 380)), iterations=1)
parts['hem'] = largest(ndimage.binary_closing(fg & poly(TORSO_P) & dark & ~jeans & (Y >= 484), iterations=3)) & poly(TORSO_P)
parts['strings'] = fg & lav & poly([(320, 285), (385, 285), (385, 370), (320, 370)])
parts['torso'] = poly(TORSO_P)

os.makedirs('parts', exist_ok=True)
for k, m in parts.items():
    rgba = np.dstack([a.clip(0, 255).astype(np.uint8), (m * 255).astype(np.uint8)])
    Image.fromarray(rgba, 'RGBA').save(f'parts/{k}.png')
    ys, xs = np.nonzero(m)
    print(k, int(m.sum()), (xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) else None)

# preview: every part over grey
prev = np.full((H, W, 3), 60, np.uint8)
cols = {'head': (255, 80, 80), 'fist': (80, 255, 80), 'shoe': (80, 160, 255), 'tdark': (255, 255, 0),
        'strings': (255, 0, 255), 'torso': (40, 40, 120), 'hem': (0, 255, 255)}
for k in ['torso', 'tdark', 'hem', 'strings', 'head', 'fist', 'shoe']:
    prev[parts[k]] = (0.35 * np.array(cols[k]) + 0.65 * a[parts[k]]).astype(np.uint8)
prev[poly(SLEEVE_P) & ~poly(SLEEVE_P).__invert__()] = prev[poly(SLEEVE_P)]
Image.fromarray(prev).resize((W, H)).save('parts_preview.png')
