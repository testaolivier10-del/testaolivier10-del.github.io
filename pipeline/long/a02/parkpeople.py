"""The cyclist and the paramedic traced from ref/park.png into vector shapes (GrabCut picks them out of the scene,
then trace.py turns colour areas into skia paths). Drawn in the park's reference coordinates (crop origin 600, 320)."""
import colorsys
import numpy as np, cv2, skia
from PIL import Image
import trace as TR

REF = '/home/claude/lv/ref/park.png'
BOX = (600, 320, 1040, 690)
_C = {}


def mask():
    im = np.array(Image.open(REF).convert('RGB'))
    x0, y0, x1, y1 = BOX
    crop = np.ascontiguousarray(im[y0:y1, x0:x1])
    m = np.zeros(crop.shape[:2], np.uint8)
    bgd = np.zeros((1, 65)); fgd = np.zeros((1, 65))
    cv2.grabCut(crop[:, :, ::-1].copy(), m, (25, 15, 410, 355), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    m = np.where((m == 1) | (m == 3), 1, 0).astype(np.uint8)
    # drop grass (green), the road and the ambulance behind her hair
    hls = cv2.cvtColor(crop, cv2.COLOR_RGB2HLS).astype(np.float32)
    h, l, s = hls[:, :, 0] * 2, hls[:, :, 1] / 255, hls[:, :, 2] / 255
    green = (h > 60) & (h < 170) & (s > 0.2)
    m[green] = 0
    m[:95, 335:] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, cc, st, _ = cv2.connectedComponentsWithStats(m)
    big = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 800]
    m = np.isin(cc, big).astype(np.uint8)
    return m


def layers():
    if 'L' not in _C:
        _C['L'] = TR.trace(REF, BOX, k=18, mask=mask(), up=3)
    return _C['L']


def draw(c, S, t=0.0, talk=0.0, wound=1.0):
    """S is the scene's reference to screen scale"""
    c.save(); c.scale(S, S); c.translate(BOX[0], BOX[1])
    for col, p in layers():
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(*col)))
    # clean round eyes over the traced ones (tiny features trace with a ragged ring)
    for (ex, ey, sk) in ((116.5, 92.5, (246, 168, 128)), (141, 94.5, (246, 168, 128)), (274.5, 66.5, (244, 166, 130)), (296.5, 64.5, (244, 166, 130))):
        c.drawCircle(ex, ey, 4.4, skia.Paint(AntiAlias=True, Color=skia.Color(*sk)))
        c.drawOval(skia.Rect(ex - 2.3, ey - 2.9, ex + 2.3, ey + 2.9), skia.Paint(AntiAlias=True, Color=skia.Color(40, 28, 30)))
    # her mouth moves when she talks into the radio
    if talk > 0:
        o = (0.5 + 0.5 * np.sin(t * 14)) * talk
        c.drawOval(skia.Rect(281, 84.5 - 0.5 * o, 293, 87 + 2.5 * o), skia.Paint(AntiAlias=True, Color=skia.Color(150, 70, 60)))
    # the cut on his left forearm, thumb side, just above the wrist
    if wound > 0:
        c.drawLine(214, 205, 232, 210, skia.Paint(AntiAlias=True, Color=skia.Color(170, 30, 40, int(255 * wound)), StrokeWidth=3,
                                                    Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap))
        c.drawCircle(223, 207, 14, skia.Paint(AntiAlias=True, Color=skia.Color(255, 120, 90, int(80 * wound)),
                                             MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6)))
    c.restore()


CUT = (600 + 223, 320 + 207)        # in reference pixels
