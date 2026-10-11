"""Green screen key with soft edges and despill. python3 chroma.py in.png out.png [max_width]"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32) / 255.0
r, g, b = a[..., 0], a[..., 1], a[..., 2]
# how much greener than the other channels
gdom = g - np.maximum(r, b)
alpha = 1.0 - np.clip((gdom - 0.12) / (0.35 - 0.12), 0, 1)
# despill: pull green down to the max of red and blue where it exceeds them
g2 = np.where(g > np.maximum(r, b), np.maximum(r, b) * 0.6 + g * 0.4, g)
g2 = np.where(alpha > 0.98, np.minimum(g, np.maximum(g2, g * (1 - np.clip(gdom * 3, 0, 1)))), g2)
out = np.dstack([r, g2, b, alpha])
img = Image.fromarray((out * 255).clip(0, 255).astype(np.uint8), "RGBA")
# tighten and soften the matte edge
al = img.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
img.putalpha(al)
bbox = None if "nocrop" in sys.argv else al.point(lambda v: 255 if v > 8 else 0).getbbox()
img = img.crop(bbox) if bbox else img
if len(sys.argv) > 3 and sys.argv[3].isdigit():
    mw = int(sys.argv[3])
    if img.width > mw:
        img = img.resize((mw, round(img.height * mw / img.width)), Image.LANCZOS)
img.save(dst)
print(dst, img.size, "bbox in source:", bbox)
