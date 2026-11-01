"""Three thumbnail concepts from the video's own art (video standard section 9): course pill, two line title,
one yellow handwritten scope line, levlprep.com, bottom right corner clear."""
import sys, math, numpy as np, skia
sys.path.insert(0, '/home/claude/lv')
import kit as K, world as WD, people as PP, dia as D
from PIL import Image


def save(s, name):
    a = s.makeImageSnapshot().toarray()[:, :, :3][:, :, ::-1]
    Image.fromarray(np.ascontiguousarray(a)).resize((1280, 720), Image.LANCZOS).save(f'/home/claude/lv/out/thumb_{name}.png')


def big(c, s, x, y, size, col, align='left'):
    f = K.font('xb', size); w = f.measureText(s)
    if align == 'center':
        x -= w / 2
    c.drawString(s, x + 7, y + 9, f, K.P((0, 0, 0), 180))
    c.drawString(s, x, y, f, K.P(col))


def site(c):
    K.text(c, 'levlprep.com', 70, 1030, 44, K.CREAM, 0.95, 'xb')


# A: the plant built from air
s = skia.Surface(1920, 1080); c = s.getCanvas()
c.save(); c.translate(-520, -60); c.scale(1.15, 1.15)
WD.patio_bg(c, 3.0)
c.restore()
c.drawRect(skia.Rect(0, 0, 1920, 1080), K.P((16, 20, 40), 120))
J = PP.jay.draw(c, 1500, 1160, 1.35, 3.0, pose=dict(hands={'R': (-230, -360), 'L': (40, -270)}, look=-0.6, tilt=-4, elbow_out=False))
hx, hy = J['hdR']
WD.tomato_plant(c, hx, hy + 30, 1.0, 3.0, s=0.95, roots=1.0)
for i in range(6):
    D.co2(c, 1000 + 110 * math.cos(i * 1.1), 300 + 90 * math.sin(i * 1.7), 0.9, 1.0, 25 * i)
big(c, 'BUILT FROM', 80, 360, 150, K.CREAM)
big(c, 'THIN AIR?', 80, 540, 180, K.AMBER)
K.hand(c, 'where your atoms come from', 90, 680, 70, K.YELLOW, 1.0)
K.pill(c, 'AP Bio  ·  Unit 1', 300, 110, K.COURSE, 46, 1, kind='xb')
site(c); save(s, 'A')

# B: the six elements
s = skia.Surface(1920, 1080); c = s.getCanvas()
K.calm_bg(c, 4.0)
for i, el in enumerate('CHONPS'):
    D.tile(c, el, 230 + i * 290, 560, 230, 1.0, name=False)
big(c, '6 ELEMENTS', 960, 310, 170, K.CREAM, 'center')
K.hand(c, 'make up almost all of you', 960, 820, 80, K.YELLOW, 1.0, 'center')
K.pill(c, 'AP Bio  ·  Elements of life', 960, 110, K.COURSE, 46, 1, kind='xb')
site(c); save(s, 'B')

# C: water out, molecule built
s = skia.Surface(1920, 1080); c = s.getCanvas()
K.calm_bg(c, 5.0)
pts = D.chain(c, 260, 640, 5, 190, 70, 1.0, cols=[K.AMBER, K.GREEN, K.CORAL, K.BLUE])
for i in range(4):
    D.h2o(c, (pts[i][0] + pts[i + 1][0]) / 2, 470 - 40 * (i % 2), 1.5, 1.0, 15 * i)
big(c, 'WATER OUT,', 80, 260, 150, K.CREAM)
big(c, 'MOLECULE BUILT', 80, 900, 130, K.AMBER)
K.hand(c, 'monomers to polymers', 1100, 990, 66, K.YELLOW, 1.0, 'center')
K.pill(c, 'AP Bio  ·  Macromolecules', 1520, 110, K.COURSE, 44, 1, kind='xb')
K.text(c, 'levlprep.com', 1500, 280, 44, K.CREAM, 0.95, 'xb')
save(s, 'C')
print('thumbs ok')
