import sys
sys.path[:0] = ['/home/claude/n35']
import numpy as np, cv2, skia
from PIL import Image
import core as K, closeup as CU, geo
a = geo.plate('g_arm.png').astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
skin = (r > 150) & (g > 80) & (g < 150) & (b < 110) & (r - b > 85)
sleeve = (np.abs(r - g) < 30) & (np.abs(g - b) < 34) & (r < 140) & (r > 30)
yy, xx = np.mgrid[0:1080, 0:1920]
sleeve &= (xx > geo.X(740))
m = (skin | sleeve).astype(np.uint8)
m[:geo.int(geo.Y(130)) if hasattr(geo, 'int') else int(geo.Y(130)), :] = 0
m[int(geo.Y(420)):, :] = 0
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(m)
big = 1 + np.argmax(st[1:, 4]); m = (lab == big).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
ff = m.copy(); mk = np.zeros((1082, 1922), np.uint8); cv2.floodFill(ff, mk, (0, 0), 1); m = m | (1 - ff)
def fn(c):
    K.draw_plate(c, 'g_arm.png'); CU.wound(c); CU.gauze_and_stain(c, 80)
    CU.tourniquet(c, CU.TQX, twist=1.0, rod_angle=3.4, tag_text='6:42', t=1, t_tag=0)
img = K.offscreen(fn).toarray()[..., [2, 1, 0]]
# include the tourniquet and gauze (they stick out past the arm edge)
ext = np.zeros_like(m)
cv2.rectangle(ext, (int(CU.TQX - 70), int(geo.Y(150))), (int(CU.TQX + 90), int(geo.Y(400))), 1, -1)
diff = (np.abs(img.astype(int) - a).sum(2) > 30).astype(np.uint8) & ext
m = np.maximum(m, diff)
m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.2)
rgba = np.dstack([img, (np.clip(m, 0, 1) * 255).astype(np.uint8)])
ys, xs = np.nonzero(rgba[..., 3] > 10)
rgba = rgba[max(ys.min() - 10, 0):ys.max() + 10, max(xs.min() - 10, 0):xs.max() + 10]
Image.fromarray(rgba).save('/home/claude/n35/thumb_arm_sticker.png')
print(rgba.shape)
