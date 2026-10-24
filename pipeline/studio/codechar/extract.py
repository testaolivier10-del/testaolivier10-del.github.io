"""Cut the approved paramedic painting (source_painting.png) into design parts for tracing.
Coordinates are painting pixels (1088x960). Output: parts/<name>.png (RGBA, same frame as the painting)."""
import numpy as np, cv2, os
from PIL import Image
from scipy import ndimage

a = np.array(Image.open('src.png').convert('RGB')).astype(np.int16)
H, W = a.shape[:2]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
fg = np.load('fg.npy')
Y, X = np.mgrid[:H, :W]


def near(hexc, tol):
    c = np.array([int(hexc[i:i + 2], 16) for i in (1, 3, 5)])
    return (np.abs(a - c).sum(-1) < tol) & fg


def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m > 0


navy = fg & (b > r + 18) & (b >= g)
glove = fg & (b > 170) & (r < 160)
patch = near('#8f9fbb', 70) & poly([(555, 340), (612, 340), (612, 410), (555, 410)])
dark = fg & (a.sum(-1) < 150) & ~((b > r + 25))

parts = {}
parts['head'] = fg & ~navy & ~glove & (Y < 312) & (X > 505)
parts['glove'] = glove & (X > 735)
parts['patch'] = ndimage.binary_closing(patch, iterations=2)
belt_zone = poly([(370, 470), (540, 520), (540, 560), (370, 510)])
parts['belt'] = fg & belt_zone & (a.sum(-1) < 120)
parts['boot'] = fg & ~navy & (Y > 745) & (X > 595) & (X < 770)
collar_zone = poly([(553, 248), (600, 262), (640, 292), (632, 340), (598, 300), (556, 268)])
parts['collar'] = near('#18234b', 45) & collar_zone
crease_zone = poly([(545, 296), (600, 296), (600, 322), (545, 322)])
parts['crease'] = near('#18234b', 40) & crease_zone
pocket_zone = poly([(455, 520), (535, 520), (535, 615), (455, 615)])
parts['pocket'] = near('#18234b', 40) & pocket_zone
torso_cut = poly([(540, 236), (652, 282), (650, 466), (606, 500), (527, 556), (372, 506), (352, 470),
                  (400, 372), (500, 270)])
parts['torso'] = fg & torso_cut

os.makedirs('parts', exist_ok=True)
for k, m in parts.items():
    m = ndimage.binary_opening(m, iterations=1) if k not in ('crease', 'pocket') else m
    rgba = np.dstack([a.clip(0, 255).astype(np.uint8), (m * 255).astype(np.uint8)])
    if k == 'torso':  # flat base, details come from their own parts
        rgba[m, :3] = (0x25, 0x34, 0x66)
    Image.fromarray(rgba, 'RGBA').save(f'parts/{k}.png')
    ys, xs = np.nonzero(m)
    print(k, int(m.sum()), (xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) else None)
