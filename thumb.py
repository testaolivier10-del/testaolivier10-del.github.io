import sys, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter
badge, hook, out = sys.argv[1].upper(), sys.argv[2].upper(), sys.argv[3]
W, H = 1080, 1920
B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F = lambda s: ImageFont.truetype(B, s)
im = Image.new("RGB", (W, H), (8, 18, 38))
g = Image.new("L", (W, H), 0); ImageDraw.Draw(g).ellipse((60, 520, 1020, 1480), fill=255)
g = g.filter(ImageFilter.GaussianBlur(190))
im = Image.composite(Image.new("RGB", (W, H), (22, 120, 125)), im, g.point(lambda v: int(v * .75)))
d = ImageDraw.Draw(im)
w = d.textlength(badge, font=F(46))
d.rounded_rectangle((540-w/2-42, 120, 540+w/2+42, 210), radius=46, fill=(14, 60, 74), outline=(45, 225, 208), width=4)
d.text((540, 165), badge, font=F(46), fill=(45, 225, 208), anchor="mm")
for size in range(190, 70, -6):
    chars = max(6, int(960 / (size * 0.68)))
    lines = textwrap.wrap(hook, chars)
    if len(lines) <= 5 and all(d.textlength(l, font=F(size)) <= 980 for l in lines): break
lh = int(size * 1.18); y0 = 300 + (1180 - lh * len(lines)) // 2
cols = [(255, 214, 56), (255, 255, 255)]
for i, l in enumerate(lines):
    d.text((540, y0 + i*lh + lh//2), l, font=F(size), fill=cols[i % 2], anchor="mm", stroke_width=10, stroke_fill=(6, 12, 28))
d.text((540, 1650), "CAN YOU GET IT?", font=F(54), fill=(255, 176, 64), anchor="mm", stroke_width=6, stroke_fill=(6, 12, 28))
d.text((540, 1790), "levlprep.com", font=F(64), fill=(45, 225, 208), anchor="mm")
im.save(out, optimize=True)
