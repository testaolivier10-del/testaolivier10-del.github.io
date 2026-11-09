"""Inside his nose: the olfactory epithelium, house style, all code.
Mucus on top, the hair like cilia of smell neurons reaching up into it, and on their membrane two DIFFERENT smell
receptor proteins (both chiral, made of the same handed amino acids; never drawn as mirror images of each other).
Each carvone docks into a pocket: the spearmint form fits the first receptor snugly and fires it (green signal down
its nerve), the caraway form fits the second (amber signal). Accuracy note: real carvone smell comes from a pattern of
several receptors responding more or less strongly to each form (LibreTexts; Wikipedia Carvone); two receptors stand
for that pattern."""
import math
import numpy as np, skia
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, flat, lgrad

G, AMB = (110, 214, 130), (255, 178, 92)
MEM = 960
REC = [dict(x=320, col=(150, 120, 206), sh=(116, 88, 170), pocket=[(-70, -40), (-46, -96), (-6, -120), (24, -70), (52, -110), (86, -60)]),
       dict(x=760, col=(96, 162, 196), sh=(70, 128, 162), pocket=[(-84, -60), (-50, -112), (-10, -70), (20, -122), (60, -100), (74, -40)])]
_rs = np.random.default_rng(9)
BUB = _rs.uniform(0, 1, (40, 3))


def receptor(c, i, t, glow=0.0, open_hl=0.0):
    r = REC[i]; x = r['x']
    c.save(); c.translate(x, MEM); c.scale(1.2, 1.2); c.translate(-x, -MEM)
    # seven helices crossing the membrane, joined into one protein with a pocket on top
    pts = [(-120, 170), (-130, 40), (-110, -40)] + [(px * 1.0, py) for px, py in r['pocket']] + [(116, -30), (128, 60), (118, 170)]
    body = smooth_closed([(x + px, MEM + py) for px, py in pts])
    flat(c, body, r['col'], r['sh'], sh_off=(-14, 4), rim=(236, 222, 255), rim_d=(3, -3), rim_a=170)
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawCircle(x + 50, MEM - 60, 120, P((255, 255, 255), 50, MaskFilter=blur(40)))
    c.restore()
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    for k in range(7):
        hx = x - 105 + k * 35
        c.drawRoundRect(skia.Rect(hx - 13, MEM - 60, hx + 13, MEM + 170), 13, 13, P(mix(r['col'], (255, 255, 255), 0.12 if k % 2 else 0.0)))
        for j in range(8):
            yy = MEM - 50 + j * 28
            c.drawLine(hx - 12, yy, hx + 12, yy + 10, SP(r['sh'], 2.4, 160))
    c.restore()
    if open_hl > 0.01:
        pk = skia.Path(); pp = [(x + px, MEM + py) for px, py in r['pocket']]
        pk.moveTo(*pp[0])
        for q in pp[1:]: pk.lineTo(*q)
        c.drawPath(pk, SP((255, 240, 160), 7, 230 * open_hl))
    if glow > 0.01:
        gc = G if i == 0 else AMB
        c.drawPath(body, SP(gc, 9, 255 * glow))
        c.drawCircle(x, MEM, 170, P(gc, 70 * glow, MaskFilter=blur(50), BlendMode=skia.BlendMode.kScreen))
    c.restore()


def scene(c, t, glow=(0.0, 0.0), open_hl=0.0):
    lgrad(c, skia.Rect(-300, -300, 1400, 2300), -300, 2300, [(70, 40, 70), (150, 70, 96), (214, 116, 120), (120, 56, 80)], [0, 0.35, 0.55, 1])
    # mucus: a glossy layer with slow bubbles
    mp = skia.Path(); mp.moveTo(-300, 560)
    for k in range(0, 1500, 60): mp.lineTo(-300 + k, 560 + 16 * math.sin(k * 0.01 + t * 0.6))
    mp.lineTo(1400, MEM); mp.lineTo(-300, MEM); mp.close()
    c.drawPath(mp, P((236, 190, 196), 90))
    for k in range(40):
        bx, by, br = BUB[k]
        x = bx * 1180 - 50; y = 600 + ((by * 340 - t * 14 * (0.5 + br)) % 340)
        c.drawCircle(x, y, 4 + 8 * br, SP((255, 236, 240), 2, 110))
    # cilia: long wavy hairs of the smell neurons in the mucus
    for k in range(26):
        x0 = -20 + k * 44
        p = skia.Path(); p.moveTo(x0, MEM - 20)
        for j in range(1, 9):
            y = MEM - 20 - j * 46
            p.lineTo(x0 + 22 * math.sin(t * 1.6 + k * 0.7 + j * 0.6) * (j / 8), y)
        c.drawPath(p, SP((246, 180, 186), 6, 200))
    # membrane bilayer
    c.drawRect(skia.Rect(-300, MEM - 26, 1400, MEM + 26), P((242, 196, 170)))
    for k in range(0, 1400, 22):
        c.drawCircle(k - 300, MEM - 20, 9, P((252, 214, 184))); c.drawCircle(k - 289, MEM + 20, 9, P((252, 214, 184)))
    c.drawRect(skia.Rect(-300, MEM - 8, 1400, MEM + 8), P((214, 150, 140)))
    # cell below with the nerve fibres the signals travel along
    lgrad(c, skia.Rect(-300, MEM + 26, 1400, 2300), MEM + 26, 1800, [(196, 100, 116), (150, 70, 96)])
    for i, r in enumerate(REC):
        x = r['x']
        c.drawPath(_nerve(x), SP((226, 140, 150), 26))
        c.drawPath(_nerve(x), SP((236, 164, 170), 10))
        if glow[i] > 0.01:
            gc = G if i == 0 else AMB
            pm = skia.PathMeasure(_nerve(x), False); Ln = pm.getLength()
            for k in range(3):
                u = ((t * 0.9 + k / 3) % 1.0)
                pos, _ = pm.getPosTan(Ln * u)
                c.drawCircle(pos.x(), pos.y(), 26 * (1 - 0.4 * u), P(gc, 230 * glow[i] * (1 - u), MaskFilter=blur(8)))
    for i in range(2): receptor(c, i, t, glow[i], open_hl)
    # out of focus cilia in the foreground for depth
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(10, 10)))
    for k, x0 in enumerate((-30, 40, 1010, 1080)):
        p = skia.Path(); p.moveTo(x0, 1500)
        for j in range(1, 12):
            p.lineTo(x0 + 40 * math.sin(t * 1.2 + k + j * 0.5) * (j / 11) + (30 if x0 < 540 else -30) * j / 11, 1500 - j * 90)
        c.drawPath(p, SP((250, 196, 200), 22, 150))
    c.restore()


def _nerve(x):
    p = skia.Path(); p.moveTo(x, MEM + 150); p.cubicTo(x, MEM + 300, x + (60 if x < 540 else -60), MEM + 420, 540 + (x - 540) * 0.4, 2000)
    return p


def dock_pt(i):
    """centre of the docked molecule in its pocket"""
    return (REC[i]['x'] + 4, MEM - 150)
