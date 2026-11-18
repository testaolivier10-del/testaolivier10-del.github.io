import sys, glob
from PIL import Image
fs = sys.argv[2:]; out = sys.argv[1]
w = 432; h = 768
im = Image.new('RGB', (w * len(fs), h))
for i, f in enumerate(fs): im.paste(Image.open(f).convert('RGB').resize((w, h)), (i * w, 0))
im.save(out, quality=88)
