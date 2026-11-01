"""Three thumbnail concepts in the owner's reference layout (thumbs/ref/apbio.png, video standard section 9): course pill
top left, title case topic title on two lines (white, then the AP Bio green), one yellow handwritten scope line,
levlprep.com bottom left, art from the video's own drawings on the right half, bottom right corner clear."""
import sys, math, numpy as np, skia
sys.path.insert(0, '/home/claude/lv')
import kit as K, world as WD, people as PP, dia as D
from PIL import Image
ACC, DEEP, MID = (140, 200, 110), (14, 31, 16), (31, 74, 34)


def save(s, name):
    a = s.makeImageSnapshot().toarray()[:, :, :3][:, :, ::-1]
    Image.fromarray(np.ascontiguousarray(a)).resize((1280, 720), Image.LANCZOS).save(f'/home/claude/lv/out/thumb_{name}.png')


def bg(c):
    sh = skia.GradientShader.MakeRadial(skia.Point(1400, 540), 1300, [K.C(MID), K.C((20, 51, 26)), K.C(DEEP)], [0, 0.48, 1])
    c.drawRect(skia.Rect(0, 0, 1920, 1080), skia.Paint(Shader=sh))


def chrome(c, l1, l2, scope, pill='AP BIO  ·  UNIT 1', size=150):
    f = K.font('xb', 30); w = f.measureText(pill)
    r = skia.RRect.MakeRectXY(skia.Rect(66, 66, 66 + w + 56, 126), 30, 30)
    c.drawRRect(r, K.P(DEEP, 220)); c.drawRRect(r, K.SP(ACC, 4.5))
    c.drawString(pill, 94, 107, f, K.P(ACC))
    for i, (s, col) in enumerate(((l1, (255, 255, 255)), (l2, ACC))):
        ft = K.font('xb', size)
        c.drawString(s, 66, 320 + i * (size + 10) + 9, ft, K.P(DEEP))
        c.drawString(s, 66, 320 + i * (size + 10), ft, K.P(col))
    K.hand(c, scope, 70, 640, 66, (255, 210, 63), 1.0)
    K.text(c, 'levlprep.com', 66, 1020, 40, (201, 210, 227), 1.0, 'xb')


# A: elements and molecules
s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c)
for i, el in enumerate('CHONPS'):
    D.tile(c, el, 1360 + (i % 3) * 180, 300 + (i // 3) * 190, 150, 1.0, name=False)
D.chain(c, 1250, 760, 5, 135, 50, 1.0, cols=[K.AMBER, K.GREEN, K.CORAL, K.BLUE])
chrome(c, 'Elements of Life', 'Macromolecules', 'six atoms build everything', size=118)
save(s, 'A')

# B: the plant built from air and water, Jay holding it
s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c)
J = PP.jay.draw(c, 1560, 1250, 1.45, 3.0, pose=dict(hands={'R': (-240, -380), 'L': (40, -270)}, look=-0.6, tilt=-4, elbow_out=False))
hx, hy = J['hdR']
WD.tomato_plant(c, hx, hy + 30, 1.0, 3.0, s=1.0, roots=1.0)
for i in range(2):
    D.co2(c, 1080 + 280 * i, 190 + 60 * i, 1.1, 1.0, 20 * i)
chrome(c, 'Elements', 'of Life', 'where your atoms come from')
save(s, 'B')

# C: monomers to polymers, water out
s = skia.Surface(1920, 1080); c = s.getCanvas(); bg(c)
pts = D.chain(c, 1080, 640, 5, 175, 62, 1.0, cols=[K.AMBER, K.GREEN, K.CORAL, K.BLUE])
for i in range(4):
    D.h2o(c, (pts[i][0] + pts[i + 1][0]) / 2, 460 - 50 * (i % 2), 1.5, 1.0, 15 * i)
chrome(c, 'Monomers and', 'Polymers', 'water out, molecule built')
save(s, 'C')
im = [Image.open(f'/home/claude/lv/out/thumb_{k}.png') for k in 'ABC']
o = Image.new('RGB', (1280, 2160))
for i, x in enumerate(im): o.paste(x, (0, 720 * i))
o.resize((640, 1080)).save('/tmp/thumbs.png')
print('thumbs ok')
