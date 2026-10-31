import sys, numpy as np, skia
sys.path.insert(0, '/home/claude/lv')
import kit as K, props as PR, park as PK, body as Bd
from kit import *
from PIL import Image
def save(s, name):
    a = s.makeImageSnapshot().toarray()[:, :, :3][:, :, ::-1]
    Image.fromarray(np.ascontiguousarray(a)).resize((1280, 720), Image.LANCZOS).save(f'out/thumb_{name}.png')
def big(c, s, x, y, size, col, align='left'):
    f = K.font('xb', size); w = f.measureText(s)
    if align == 'center': x -= w / 2
    c.drawString(s, x + 6, y + 8, f, K.P((0, 0, 0), 170))
    c.drawString(s, x, y, f, K.P(col))
# A: the arm that flips
s = skia.Surface(1920, 1080); c = s.getCanvas()
PK.background(c, 3.0); c.drawRect(skia.Rect(0, 0, 1920, 1080), K.P((16, 20, 40), 110))
c.save(); c.translate(-330, 260); g = PR.arm_closeup(c, 3.0, lift=1.0); c.restore()
wr = g['wr'] + np.array([-330, 260])
K.arrow(c, (wr[0] - 140, wr[1] + 120), (wr[0] - 140, wr[1] - 160), K.AMBER, 22, 1, 1, head=56)
big(c, 'ABOVE', 880, 380, 210, K.CREAM)
big(c, 'THE WRIST?', 880, 580, 140, K.AMBER)
K.pill(c, 'A&P  ·  Directional terms', 1400, 760, K.COURSE, 46, 1, kind='xb')
K.vignette(c); save(s, 'A')
# B: decode
s = skia.Surface(1920, 1080); c = s.getCanvas()
K.calm_bg(c, 4.0)
x = (1920 - sum(K.width(q, 150, 'xb') + 44 for q in ('hepat', 'o', 'megaly')) - 80) / 2; x0 = x
for p, col in (('hepat', K.ROOT), ('o', K.VOWEL), ('megaly', K.SUFFIX)):
    x += K.chip(c, p, x, 420, col, 150) + 40
for xx, m, col in ((x0 + 160, 'liver', K.ROOT), (x - 260, 'enlarged', K.SUFFIX)):
    K.hand(c, m, xx, 780, 110, col, 1, 'center')
big(c, 'DECODE ANY TERM', 960, 260, 130, K.CREAM, 'center')
K.pill(c, 'A&P word parts', 960, 940, K.COURSE, 52, 1, kind='xb')
save(s, 'B')
# C: one body, every direction
s = skia.Surface(1920, 1080); c = s.getCanvas()
K.calm_bg(c, 5.0)
p = Bd.Person(); p.draw(c, 520, 1050, 1.4, 0)
K.arrow(c, (900, 540), (900, 120), K.CORAL, 16, 1, 1, head=44); K.arrow(c, (900, 600), (900, 1000), K.BLUE, 16, 1, 1, head=44)
K.arrow(c, (560, 620), (830, 620), K.TEAL, 16, 1, 1, head=44)
big(c, 'LEFT OR', 1000, 420, 170, K.CREAM)
big(c, 'RIGHT?', 1000, 610, 190, K.AMBER)
K.pill(c, 'Directional terms, made simple', 1420, 780, K.COURSE, 44, 1, kind='xb')
save(s, 'C')
