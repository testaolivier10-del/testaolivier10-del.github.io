import sys, glob
from PIL import Image, ImageDraw
fs = sys.argv[2:]; out = sys.argv[1]
cols = 7; w, h = 270, 480
rows = (len(fs) + cols - 1) // cols
im = Image.new('RGB', (cols * w, rows * (h + 20)), (20, 20, 20)); d = ImageDraw.Draw(im)
for i, f in enumerate(fs):
    a = Image.open(f).convert('RGB').resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 20)
    im.paste(a, (x, y)); d.text((x + 4, y + h + 4), f.split('/')[-1], fill=(255, 255, 255))
im.save(out)
