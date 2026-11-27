"""Teaching boards, part B (the job: j1, j2, j3, j5; behind the scenes: m1, m2, m4; the recap: rc).
The one navy board, never zooms. Everything comes on with its word.
One people badge helper (person) draws the EMT, the physician, the patient and the hospital nurse on every board here."""
import math
import skia
import kit as K
import fin as WD
from kit import P, SP, C, sm, W, H, text, chip, arrow, AMBER, CORAL, TEAL, GREEN, CREAM, INK2, NAVY, BLUE, COURSE
from base import Bt, cue, fin, ua, lightbar, board, check, cross, title, ww, cues, tx, hw, panel, pulse

WHITE = (255, 255, 255)
SHADOW = (6, 8, 22)


def lerp(a, b, u):
    return a + (b - a) * u


def mix(a, b, u):
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def rr(x0, y0, x1, y1, r):
    return skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)


def poly(pts):
    p = skia.Path(); p.addPoly([skia.Point(*q) for q in pts], True); return p


def hwidth(s, size):
    return K.width(s, size, 'hand')


def hwr(c, s, xr, y, size, col, t, t0, d=0.8, a=1.0):
    """handwriting that ends at xr (right aligned)"""
    hw(c, s, xr - hwidth(s, size), y, size, col, t, t0, d, 'left', a)


def layer(c, a, rect=None):
    """open a group that fades as one; returns True when a restore is needed"""
    if a < 0.99:
        c.saveLayerAlpha(rect, int(255 * max(0.0, a))); return True
    return False


# ------------------------------------------------------------------ people badges
ROLE = {  # disc, clothes, clothes shade, skin, skin shade, hair, hair style
    'emt': ((34, 132, 120), (30, 38, 84), (52, 66, 128), (188, 132, 98), (160, 108, 78), (38, 28, 34), 'bun'),
    'hurt': ((186, 78, 78), (30, 38, 84), (52, 66, 128), (188, 132, 98), (160, 108, 78), (38, 28, 34), 'bun'),
    'md': ((70, 88, 176), (243, 244, 249), (212, 218, 233), (232, 190, 160), (208, 164, 134), (176, 180, 192), 'short'),
    'patient': ((120, 96, 150), (214, 168, 108), (234, 196, 140), (236, 198, 170), (212, 172, 144), (190, 192, 200), 'thin'),
    'nurse': ((50, 110, 170), (104, 190, 208), (140, 214, 226), (150, 102, 76), (126, 82, 60), (30, 24, 28), 'long'),
}
_PIC = {}


def _bust(c, kind):
    disc, cl, cl2, sk, sk2, hair, style = ROLE[kind]
    c.drawCircle(0, 9, 98, P(SHADOW, 130, MaskFilter=K.blur(12)))
    c.drawCircle(0, 0, 100, P(disc))
    c.save()
    cp = skia.Path(); cp.addCircle(0, 0, 100); c.clipPath(cp, skia.ClipOp.kIntersect, True)
    c.drawCircle(0, 150, 150, P(WHITE, 22))                       # a soft floor of light, second tone of the disc
    if style == 'bun':
        c.drawCircle(4, -80, 17, P(hair))
    if style == 'long':
        c.drawRRect(rr(-45, -70, 45, 60, 38), P(hair))
    else:
        c.drawOval(skia.Rect(-41, -71, 41, 6), P(hair))
    # shoulders
    sh = skia.Path(); sh.moveTo(-86, 130); sh.lineTo(-86, 86); sh.cubicTo(-86, 58, -62, 47, -30, 42); sh.lineTo(30, 42)
    sh.cubicTo(62, 47, 86, 58, 86, 86); sh.lineTo(86, 130); sh.close()
    c.drawPath(sh, P(cl))
    c.drawRRect(rr(-17, 6, 17, 58, 13), P(sk2))                    # neck
    if kind in ('emt', 'hurt'):
        c.drawPath(poly([(-19, 42), (19, 42), (0, 70)]), P((16, 20, 46)))
        c.drawPath(poly([(-33, 40), (-17, 41), (1, 70), (-19, 86)]), P(cl2)); c.drawPath(poly([(33, 40), (17, 41), (-1, 70), (19, 86)]), P(cl2))
        c.save(); c.rotate(14, 66, 76); c.drawRRect(rr(55, 62, 78, 90, 5), P(COURSE)); c.drawRRect(rr(60, 68, 73, 72, 2), P(WHITE, 200)); c.restore()   # shoulder patch
        c.drawRRect(rr(-58, 70, -34, 80, 4), P(AMBER))                # name bar
        c.drawRRect(rr(26, 52, 42, 76, 5), P((16, 20, 46))); c.drawRRect(rr(29, 56, 39, 64, 2), P((90, 104, 170)))   # the radio microphone clipped at the collar
    elif kind == 'md':
        c.drawPath(poly([(-21, 40), (21, 40), (10, 130), (-10, 130)]), P((63, 176, 156)))
        c.drawPath(poly([(-12, 44), (12, 44), (0, 62)]), P(sk2))
        c.drawPath(poly([(-36, 40), (-19, 41), (-3, 100), (-27, 78)]), P(cl2)); c.drawPath(poly([(36, 40), (19, 41), (3, 100), (27, 78)]), P(cl2))
        tube = SP((46, 52, 80), 6.5)
        p = skia.Path(); p.moveTo(-23, 30); p.cubicTo(-36, 58, -34, 92, -31, 126); c.drawPath(p, tube)
        p = skia.Path(); p.moveTo(23, 30); p.cubicTo(36, 50, 35, 64, 33, 74); c.drawPath(p, tube)
        c.drawCircle(33, 84, 11.5, P((196, 202, 218))); c.drawCircle(33, 84, 6, P((120, 130, 158)))
    elif kind == 'patient':
        c.drawPath(poly([(-17, 42), (17, 42), (0, 68)]), P(sk2))
        c.drawPath(poly([(-34, 40), (-17, 41), (1, 68), (-21, 84)]), P(cl2)); c.drawPath(poly([(34, 40), (17, 41), (-1, 68), (21, 84)]), P(cl2))
        for yb in (80, 100): c.drawCircle(0, yb, 3.2, P(cl2))
    elif kind == 'nurse':
        c.drawPath(poly([(-22, 41), (22, 41), (0, 78)]), P(sk2))
        c.drawPath(poly([(-30, 40), (-22, 41), (0, 78), (22, 41), (30, 40), (0, 90)]), P(cl2))
        c.drawRRect(rr(34, 70, 56, 98, 4), P((243, 244, 249))); c.drawRRect(rr(38, 75, 52, 83, 2), P((70, 88, 176)))
    # head
    c.drawCircle(-37, -19, 8.5, P(sk2)); c.drawCircle(37, -19, 8.5, P(sk2))
    c.drawOval(skia.Rect(-37, -66, 37, 21), P(sk))
    f = skia.Path()
    if style in ('bun', 'long'):
        f.moveTo(-39, -22); f.cubicTo(-42, -62, -12, -72, 8, -67); f.cubicTo(0, -50, -18, -38, -39, -22); f.close()
        f.moveTo(8, -67); f.cubicTo(28, -68, 41, -52, 39, -22); f.cubicTo(32, -42, 20, -56, 8, -67); f.close()
    elif style == 'short':
        f.moveTo(-39, -22); f.cubicTo(-44, -76, 44, -76, 39, -22); f.cubicTo(32, -44, 16, -53, -8, -51); f.cubicTo(-24, -49, -34, -38, -39, -22); f.close()
    else:
        f.moveTo(-39, -18); f.cubicTo(-43, -70, 43, -70, 39, -18); f.cubicTo(35, -44, 22, -59, 0, -59); f.cubicTo(-22, -59, -35, -44, -39, -18); f.close()
    c.drawPath(f, P(hair))
    dark = (44, 32, 40)
    if kind == 'hurt':
        for sx in (-1, 1):
            c.drawLine(sx * 19, -22, sx * 9, -19, SP(dark, 3.4))
        c.drawArc(skia.Rect(-9, -4, 9, 8), 200, 140, False, SP(dark, 3, 200))
        c.save(); c.rotate(-10, 0, -44); c.drawRRect(rr(-40, -52, 40, -37, 3), P((246, 246, 250))); c.drawRRect(rr(6, -52, 22, -37, 2), P((214, 218, 232))); c.restore()
    else:
        c.drawCircle(-14, -22, 4, P(dark)); c.drawCircle(14, -22, 4, P(dark))
        c.drawArc(skia.Rect(-10, -14, 10, 4), 25, 130, False, SP(dark, 3, 190))
        if kind == 'patient':
            c.drawOval(skia.Rect(-15, -10, 15, -1), P(hair))
    c.restore()
    c.drawArc(skia.Rect(-96, -96, 96, 96), 205, 110, False, SP(WHITE, 4, 70))   # soft rim


def person(c, kind, x, y, r, a=1.0, s=1.0):
    """a head and shoulders badge of radius r (s is an extra pop scale)"""
    if a <= 0.01: return
    if kind not in _PIC:
        rec = skia.PictureRecorder(); _bust(rec.beginRecording(skia.Rect(-130, -130, 130, 140)), kind); _PIC[kind] = rec.finishRecordingAsPicture()
    c.save(); c.translate(x, y); k = r / 100 * s; c.scale(k, k)
    lay = layer(c, a, skia.Rect(-130, -130, 130, 140))
    c.drawPicture(_PIC[kind])
    if lay: c.restore()
    c.restore()


# ------------------------------------------------------------------ pages
def _sheet(c, w, h):
    c.drawRRect(rr(-w / 2 + 4, -h / 2 + 10, w / 2 + 4, h / 2 + 12, 12), P(SHADOW, 120, MaskFilter=K.blur(10)))


def protocol_page(c, x, y, s=1.0, a=1.0, u=1.0, lit=0.0):
    """a written protocol: a page with a mint header band, a folded corner and numbered steps written on as u goes 0 -> 1"""
    if a <= 0.01: return
    w, h = 150, 190
    c.save(); c.translate(x, y); c.scale(s, s)
    lay = layer(c, a, skia.Rect(-110, -130, 110, 140))
    _sheet(c, w, h)
    pg = skia.Path(); pg.moveTo(-w / 2 + 10, -h / 2); pg.lineTo(w / 2 - 34, -h / 2); pg.lineTo(w / 2, -h / 2 + 34); pg.lineTo(w / 2, h / 2 - 10)
    pg.quadTo(w / 2, h / 2, w / 2 - 10, h / 2); pg.lineTo(-w / 2 + 10, h / 2); pg.quadTo(-w / 2, h / 2, -w / 2, h / 2 - 10); pg.lineTo(-w / 2, -h / 2 + 10); pg.quadTo(-w / 2, -h / 2, -w / 2 + 10, -h / 2); pg.close()
    c.drawPath(pg, P(mix((244, 240, 230), (255, 240, 200), lit)))
    c.drawPath(poly([(w / 2 - 34, -h / 2), (w / 2, -h / 2 + 34), (w / 2 - 34, -h / 2 + 34)]), P((206, 200, 188)))
    c.drawRRect(rr(-w / 2 + 16, -h / 2 + 18, w / 2 - 46, -h / 2 + 40, 6), P(COURSE))
    for i in range(3):
        yy = -h / 2 + 76 + i * 38; ui = sm(u * 3 - i)
        if ui <= 0.01: continue
        c.drawCircle(-w / 2 + 28, yy, 11, P((44, 56, 118), 255 * ui))
        c.drawRRect(rr(-w / 2 + 48, yy - 12, -w / 2 + 48 + (w - 68) * ui, yy - 3, 4), P((120, 130, 164)))
        c.drawRRect(rr(-w / 2 + 48, yy + 4, -w / 2 + 48 + (w - 68) * (0.62, 0.8, 0.5)[i] * ui, yy + 12, 4), P((176, 182, 204)))
    if lay: c.restore()
    c.restore()


def report_page(c, x, y, s=1.0, a=1.0, u=1.0, mark=0.0, fixed=0.0):
    """a patient care report on a clipboard: form lines written on as u goes 0 -> 1; mark: a problem flagged; fixed: it turns into a check"""
    if a <= 0.01: return
    w, h = 150, 190
    c.save(); c.translate(x, y); c.scale(s, s)
    lay = layer(c, a, skia.Rect(-110, -130, 110, 140))
    _sheet(c, w, h)
    c.drawRRect(rr(-w / 2, -h / 2, w / 2, h / 2, 14), P((150, 106, 72)))
    c.drawRRect(rr(-w / 2, h / 2 - 22, w / 2, h / 2, 14), P((124, 86, 58))); c.drawRect(skia.Rect(-w / 2, h / 2 - 22, w / 2, h / 2 - 12), P((150, 106, 72)))
    c.drawRRect(rr(-w / 2 + 11, -h / 2 + 20, w / 2 - 11, h / 2 - 12, 6), P((246, 243, 234)))
    c.drawRRect(rr(-30, -h / 2 - 10, 30, -h / 2 + 30, 8), P((150, 158, 180))); c.drawRRect(rr(-18, -h / 2 - 10, 18, -h / 2 + 4, 6), P((196, 202, 218)))
    rows = ((0.86, True), (0.62, False), (0.8, True), (0.5, False))
    for i, (ln, box) in enumerate(rows):
        yy = -h / 2 + 58 + i * 26; ui = sm(u * 4 - i)
        if ui <= 0.01: continue
        x0 = -w / 2 + 24
        if box:
            c.drawRRect(rr(x0, yy - 7, x0 + 14, yy + 7, 3), P((63, 176, 156), 255 * ui)); x0 += 22
        hot = (i == 2)
        col = mix((132, 140, 170), mix(CORAL, (76, 170, 100), fixed), mark) if hot else (132, 140, 170)
        c.drawRRect(rr(x0, yy - 5, x0 + (w / 2 - 24 - x0) * ln * ui, yy + 5, 4), P(col))
    us = sm(u * 4 - 3.2)
    if us > 0.01:                                             # the signature
        p = skia.Path(); p.moveTo(-40, 62); p.cubicTo(-30, 40, -22, 76, -12, 58); p.cubicTo(-4, 44, 4, 74, 14, 56); p.cubicTo(20, 48, 30, 62, 42, 54)
        m = skia.PathMeasure(p, False); seg = skia.Path(); m.getSegment(0, m.getLength() * us, seg, True); c.drawPath(seg, SP((44, 56, 118), 4))
    if lay: c.restore()
    if mark > 0.01:
        bx, by = w / 2 - 4, -h / 2 + 58 + 2 * 26
        c.drawCircle(bx, by, 24 * (0.6 + 0.4 * mark), P(mix(CORAL, (76, 170, 100), fixed), 255 * mark * a))
        if fixed < 0.5:
            text(c, '!', bx, by + 13, 36, WHITE, mark * a * (1 - 2 * fixed), 'xb', 'center')
        else:
            pth = skia.Path(); pth.moveTo(bx - 11, by + 1); pth.lineTo(bx - 3, by + 9); pth.lineTo(bx + 12, by - 9); c.drawPath(pth, SP(WHITE, 5.5, 255 * a * (2 * fixed - 1)))
    c.restore()


# ------------------------------------------------------------------ radio and phone
def radio(c, x, y, s=1.0, a=1.0, lit=0.0):
    """a portable two way radio: antenna, knob, small display, speaker slots, the talk button on the side"""
    if a <= 0.01: return
    c.save(); c.translate(x, y); c.scale(s, s)
    lay = layer(c, a, skia.Rect(-70, -140, 70, 110))
    c.drawRRect(rr(-30, -46, 38, 92, 12), P(SHADOW, 120, MaskFilter=K.blur(10)))
    c.drawRRect(rr(-25, -122, -11, -50, 6), P((104, 114, 156)))             # antenna
    c.drawRRect(rr(10, -74, 26, -52, 4), P((90, 100, 136)))               # knob
    c.drawRRect(rr(-39, -34, -30, 6, 4), P(AMBER))                        # talk button
    c.drawRRect(rr(-34, -60, 34, 84, 13), P((52, 60, 92)))
    c.drawRRect(rr(-34, -60, 34, -6, 13), P((74, 84, 124))); c.drawRect(skia.Rect(-34, -20, 34, -6), P((74, 84, 124)))
    c.drawRRect(rr(-22, -48, 22, -22, 5), P(mix((150, 222, 204), (255, 232, 160), lit)))
    c.drawRRect(rr(-15, -40, 5, -34, 3), P((40, 110, 100)))
    for i in range(4):
        c.drawRRect(rr(-20, 8 + i * 17, 20, 15 + i * 17, 3.5), P((30, 36, 60)))
    if lay: c.restore()
    c.restore()


def phone(c, x, y, s=1.0, a=1.0, lit=0.0):
    """a phone on a call: dark body, a lit screen, the green call button with a white handset"""
    if a <= 0.01: return
    c.save(); c.translate(x, y); c.scale(s, s)
    lay = layer(c, a, skia.Rect(-60, -90, 60, 100))
    c.drawRRect(rr(-32, -60, 40, 78, 14), P(SHADOW, 120, MaskFilter=K.blur(10)))
    c.drawRRect(rr(-37, -70, 37, 70, 15), P((30, 34, 58)))
    c.drawRRect(rr(-31, -62, 31, 62, 10), P(mix((84, 104, 190), (120, 140, 220), lit)))
    c.drawRRect(rr(-11, -66, 11, -60, 3), P((30, 34, 58)))
    c.drawCircle(0, -26, 15, P(WHITE, 60)); c.drawRRect(rr(-19, -4, 19, 4, 4), P(WHITE, 90)); c.drawRRect(rr(-12, 10, 12, 16, 3), P(WHITE, 60))
    c.drawCircle(0, 40, 16, P((92, 200, 120)))
    c.save(); c.translate(0, 41); c.rotate(-45)
    c.drawArc(skia.Rect(-9, -5, 9, 13), 200, 140, False, SP(WHITE, 4.4))
    c.restore()
    if lay: c.restore()
    c.restore()


def waves(c, x, y, t, a=1.0, col=AMBER, n=3, r0=22, side=1):
    """signal arcs leaving a device"""
    if a <= 0.01: return
    for i in range(n):
        ph = ((t * 1.1 + i / n) % 1.0)
        r = r0 + 34 * (i + ph)
        al = a * (1 - (i + ph) / n)
        c.drawArc(skia.Rect(x - r, y - r, x + r, y + r), -38 if side > 0 else 142, 76, False, SP(col, 5, 230 * al))


# ------------------------------------------------------------------ small icons
def hospital(c, x, y, s=1.0, a=1.0):
    """a hospital: main block with windows, a side wing, the blue H sign on the roof, a canopy over glass doors (x, y = middle of the ground line)"""
    if a <= 0.01: return
    c.save(); c.translate(x, y); c.scale(s, s)
    lay = layer(c, a, skia.Rect(-170, -230, 170, 30))
    c.drawOval(skia.Rect(-150, -10, 150, 16), P(SHADOW, 130, MaskFilter=K.blur(9)))
    c.drawRect(skia.Rect(-140, -96, -52, 0), P((200, 206, 224)))              # wing
    c.drawRect(skia.Rect(52, -96, 140, 0), P((200, 206, 224)))
    c.drawRRect(rr(-62, -168, 62, 0, 6), P((236, 238, 246))); c.drawRect(skia.Rect(-62, -20, 62, 0), P((236, 238, 246)))
    c.drawRect(skia.Rect(-140, -104, -52, -92), P((170, 178, 204))); c.drawRect(skia.Rect(52, -104, 140, -92), P((170, 178, 204)))
    for wx in (-122, -92):
        for wy in (-78, -44):
            c.drawRRect(rr(wx, wy, wx + 22, wy + 22, 3), P((112, 146, 214))); c.drawRRect(rr(-wx - 22, wy, -wx, wy + 22, 3), P((112, 146, 214)))
    for wx in (-44, -11, 22):
        c.drawRRect(rr(wx, -112, wx + 22, -88, 3), P((112, 146, 214)))
    c.drawRRect(rr(-25, -206, 25, -156, 7), P((52, 106, 226)))
    text(c, 'H', 0, -165, 40, WHITE, 1.0, 'xb', 'center')
    c.drawRRect(rr(-30, -52, 30, 0, 3), P((70, 96, 160))); c.drawRect(skia.Rect(-1.5, -52, 1.5, 0), P((236, 238, 246)))
    c.drawRRect(rr(-44, -66, 44, -52, 4), P(CORAL))
    c.drawRect(skia.Rect(-150, 0, 150, 6), P((120, 130, 164)))
    if lay: c.restore()
    c.restore()


def weight(c, x, y, s=1.0, a=1.0, lift=0.0):
    """a heavy test weight with a grip (x, y = middle of the floor line); lift raises it off the floor"""
    if a <= 0.01: return
    c.save(); c.translate(x, y); c.scale(s, s)
    lay = layer(c, a, skia.Rect(-190, -330, 190, 40))
    sw = 150 * (1 - 0.3 * lift)
    c.drawOval(skia.Rect(-sw, -12, sw, 18), P(SHADOW, 150 - 60 * lift, MaskFilter=K.blur(10 + 8 * lift)))
    c.translate(0, -70 * lift)
    c.drawArc(skia.Rect(-56, -252, 56, -140), 180, 180, False, SP((70, 80, 126), 30))
    c.drawLine(-56, -196, -56, -170, SP((70, 80, 126), 30)); c.drawLine(56, -196, 56, -170, SP((70, 80, 126), 30))
    b = skia.Path(); b.moveTo(-96, -176); b.lineTo(96, -176); b.quadTo(114, -176, 118, -158); b.lineTo(146, -22); b.quadTo(150, 0, 128, 0)
    b.lineTo(-128, 0); b.quadTo(-150, 0, -146, -22); b.lineTo(-118, -158); b.quadTo(-114, -176, -96, -176); b.close()
    c.drawPath(b, P((98, 112, 170)))
    c.save(); c.clipPath(b, skia.ClipOp.kIntersect, True)
    c.drawRect(skia.Rect(-160, -40, 160, 0), P((74, 86, 138)))
    c.drawRRect(rr(-100, -168, 100, -158, 5), P(WHITE, 60))
    c.restore()
    if lay: c.restore()
    c.restore()


def eye(c, x, y, s=1.0, a=1.0, iris=COURSE):
    if a <= 0.01: return
    c.save(); c.translate(x, y); c.scale(s, s)
    lay = layer(c, a, skia.Rect(-130, -90, 130, 100))
    al = skia.Path(); al.moveTo(-112, 0); al.cubicTo(-60, -74, 60, -74, 112, 0); al.cubicTo(60, 74, -60, 74, -112, 0); al.close()
    sh = skia.Path(al); sh.offset(0, 9); c.drawPath(sh, P(SHADOW, 130, MaskFilter=K.blur(9)))
    c.drawPath(al, P((246, 246, 250)))
    c.save(); c.clipPath(al, skia.ClipOp.kIntersect, True)
    c.drawCircle(0, 0, 50, P(tuple(v * 0.72 for v in iris))); c.drawCircle(0, 0, 40, P(iris))
    c.drawCircle(0, 0, 21, P((20, 24, 50))); c.drawCircle(-13, -14, 9, P(WHITE, 235))
    lid = skia.Path(); lid.moveTo(-112, 0); lid.cubicTo(-60, -74, 60, -74, 112, 0); lid.cubicTo(60, -52, -60, -52, -112, 0); lid.close()
    c.drawPath(lid, P((196, 202, 224)))
    c.restore()
    if lay: c.restore()
    c.restore()


def lips(c, x, y, w, skin, lip, lip2, a=1.0):
    """a square swatch of skin with a mouth, for the colours an EMT watches for"""
    if a <= 0.01: return
    c.save(); c.translate(x, y); k = w / 140; c.scale(k, k)
    lay = layer(c, a, skia.Rect(-90, -90, 90, 100))
    c.drawRRect(rr(-66, -60, 74, 80, 20), P(SHADOW, 120, MaskFilter=K.blur(9)))
    c.drawRRect(rr(-70, -70, 70, 70, 22), P(skin))
    c.drawRRect(rr(-70, 30, 70, 70, 22), P(tuple(v * 0.93 for v in skin))); c.drawRect(skia.Rect(-70, 30, 70, 46), P(tuple(v * 0.93 for v in skin)))
    up = skia.Path(); up.moveTo(-46, 2); up.cubicTo(-30, -14, -14, -24, -6, -16); up.quadTo(0, -11, 6, -16); up.cubicTo(14, -24, 30, -14, 46, 2)
    up.cubicTo(24, 6, -24, 6, -46, 2); up.close()
    lo = skia.Path(); lo.moveTo(-46, 2); lo.cubicTo(-24, 6, 24, 6, 46, 2); lo.cubicTo(30, 28, -30, 28, -46, 2); lo.close()
    c.drawPath(lo, P(lip2)); c.drawPath(up, P(lip))
    if lay: c.restore()
    c.restore()


def num(c, n, x, y, a, on=1.0, r=30):
    """a list number: a quiet ring that fills with the course colour when its line is written"""
    if a <= 0.01: return
    c.drawCircle(x, y, r, P((44, 56, 118), 255 * a))
    if on > 0.01: c.drawCircle(x, y, r * (0.6 + 0.4 * on), P(COURSE, 255 * a * on))
    text(c, str(n), x, y + r * 0.42, r * 1.2, mix(INK2, NAVY, on), a, 'xb', 'center')


def bubble(c, x, y, s=1.0, a=1.0, t=0.0, col=AMBER):
    """a speech bubble with three dots (speaking up)"""
    if a <= 0.01: return
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawRRect(rr(-50, -34, 50, 30, 24), P(col, 255 * a))
    c.drawPath(poly([(-34, 22), (-52, 52), (-8, 28)]), P(col, 255 * a))
    for i in range(3):
        c.drawCircle(-22 + i * 22, -2 - 5 * max(0, math.sin(t * 5 - i * 0.9)), 6.5, P(NAVY, 255 * a))
    c.restore()


def cubic(p0, p1, p2, p3):
    p = skia.Path(); p.moveTo(*p0); p.cubicTo(*p1, *p2, *p3); return p


def trace(c, path, u, col, w, a=1.0, head=0, dot=None, dcol=AMBER):
    """draw a path on as u goes 0 -> 1, with an arrow head at the tip; dot: 0..1 position of a travelling bead"""
    if u <= 0.01 or a <= 0.01: return
    m = skia.PathMeasure(path, False); L = m.getLength()
    seg = skia.Path(); m.getSegment(0, L * min(1, u), seg, True); c.drawPath(seg, SP(col, w, 255 * a))
    if head:
        pos, tan = m.getPosTan(L * min(1, u)); x, y, tx_, ty_ = pos.x(), pos.y(), tan.x(), tan.y()
        hp = skia.Path(); hp.moveTo(x + tx_ * head * 0.5, y + ty_ * head * 0.5)
        hp.lineTo(x - tx_ * head * 0.7 - ty_ * head * 0.6, y - ty_ * head * 0.7 + tx_ * head * 0.6)
        hp.lineTo(x - tx_ * head * 0.7 + ty_ * head * 0.6, y - ty_ * head * 0.7 - tx_ * head * 0.6); hp.close()
        c.drawPath(hp, P(col, 255 * a))
    if dot is not None and 0 < dot < 1:
        pos, _ = m.getPosTan(L * dot)
        WD.glow(c, pos.x(), pos.y(), 34, dcol, 0.7 * a); c.drawCircle(pos.x(), pos.y(), 13, P(dcol, 255 * a)); c.drawCircle(pos.x() - 3, pos.y() - 3, 5, P(WHITE, 150 * a))


def two(c, s1, col1, s2, col2, x, y, size, a, kind='xb', align='left'):
    """two words on one line in two colours"""
    if a <= 0.01: return
    w1 = K.width(s1, size, kind); w2 = K.width(s2, size, kind)
    if align == 'right': x -= w1 + w2
    elif align == 'center': x -= (w1 + w2) / 2
    text(c, s1, x, y, size, col1, a, kind); text(c, s2, x + w1, y, size, col2, a, kind)


# ================================================================== j1 + j2: one board
LISTY = (350, 500, 650, 800)
RX = 840


def job(c, t):
    board(c, t)
    t0, a1, a2, a3 = cues('j1', 3)
    s0, b1, b2, b3 = cues('j2', 3)
    e1, e2 = fin('j1'), fin('j2')
    title(c, "An EMT's responsibilities, in order", t, t0)
    tcrew = ww('j1', 'crew') - 0.15; tpat = ww('j1', 'patient', 0, a3) - 0.15; tby = ww('j1', 'bystanders') - 0.35
    rows = (('your own safety', a2 - 0.1, tcrew), ('your crew', tcrew, tpat), ('the patient', tpat, tby), ('bystanders', tby, s0))
    dim = 1 - 0.3 * ua(t, s0 + 0.2, 0.6)
    tsafe = ww('j2', 'safe') - 0.1
    for i, (s, ton, toff) in enumerate(rows):
        y = LISTY[i]
        lightbar(c, t, y, ton, toff, 110, 796, 120)
        ul = ua(t, a1 + i * 0.22, 0.4)
        if ul > 0.01:
            c.drawRRect(rr(232, y + 24, 232 + 470 * ul, y + 29, 2.5), P(INK2, 70 * dim))
        num(c, i + 1, 168, y - 20, ul * dim, ua(t, ton, 0.35))
        hw(c, s, 232, y, 68, CREAM, t, ton, 0.7, a=dim)
    check(c, 760, LISTY[0] - 22, 0.7, ua(t, tsafe, 0.3) * dim)

    # ---- j1: why your own safety is first (an injured EMT is a second patient)
    out = 1 - ua(t, s0 - 0.1, 0.45)
    if out > 0.01 and t > a2 - 0.3:
        tin = ww('j1', 'injured') - 0.1; tno = ww('j1', "can't") - 0.1; ttwo = ww('j1', 'TWO') - 0.15
        ex, px, cy, r = 1110, 1520, 500, 125
        ue = ua(t, a2 + 0.2, 0.45); up = ua(t, tin - 0.9, 0.45); uh = ua(t, tin, 0.5)
        person(c, 'patient', px, cy, r, up * out, 0.9 + 0.1 * up)
        person(c, 'emt', ex, cy, r, ue * (1 - uh) * out, 0.9 + 0.1 * ue)
        if uh > 0.01:
            c.save(); c.rotate(-7 * uh, ex, cy + r); person(c, 'hurt', ex, cy, r, uh * out); c.restore()
        # the help that can no longer happen
        uar = ua(t, tin - 0.6, 0.5); gone = ua(t, tno, 0.4)
        arrow(c, (ex + r + 26, cy), (px - r - 26, cy), mix(COURSE, INK2, gone), 9, uar, out * (1 - 0.55 * gone))
        cross(c, (ex + px) / 2, cy, 0.85, ua(t, tno + 0.1, 0.25) * out)
        hw(c, '2 patients', (ex + px) / 2, 770, 92, AMBER, t, ttwo, 0.7, 'center', out)
        if t > ttwo:
            for xx in (ex, px):
                WD.glow(c, xx, cy, r * 1.25, AMBER, 0.28 * pulse(t, ttwo + (0.0 if xx == ex else 0.3), 0.7) * out)

    # ---- j2: the order of the call
    if t > s0 - 0.2:
        tass = ww('j2', 'assessment') - 0.15; tbef = ww('j2', 'before') - 0.1; tcare = ww('j2', 'care') - 0.1
        tlift = ww('j2', 'lift') - 0.15; ttr = ww('j2', 'transport') - 0.15; txf = ww('j2', 'transfer') - 0.15
        thos = ww('j2', 'hospital') - 0.2; thand = ww('j2', 'handoff') - 0.2; tdone = ww('j2', 'complete') - 0.05
        tspk = ww('j2', 'speak') - 0.2; tadv = ww('j2', "patient's") - 0.25
        Y1, Y2, Y3 = 262, 440, 618
        lightbar(c, t, Y1 + 64, tass, b2, RX - 30, 1830, 130)
        lightbar(c, t, Y2 + 64, b2, txf, RX - 30, 1830, 130)
        lightbar(c, t, Y3 + 64, txf, b3, RX - 30, 1830, 130)
        # row 1: assessment before care
        u = ua(t, tass, 0.35)
        w1 = chip(c, 'assessment', RX, Y1, TEAL, 56, u, 0.9 + 0.1 * u + 0.06 * pulse(t, tass, 0.4))
        w1 = w1 or K.width('assessment', 56, 'xb') + 44
        tx(c, 'before', RX + w1 + 34, Y1 + 58, 60, AMBER, t, tbef, 'xb')
        wb = K.width('before', 60, 'xb')
        u = ua(t, tcare, 0.35)
        chip(c, 'care', RX + w1 + wb + 68, Y1, GREEN, 56, u, 0.9 + 0.1 * u + 0.06 * pulse(t, tcare, 0.4))
        # row 2: lift and move, transport
        u = ua(t, tlift, 0.35)
        w2 = chip(c, 'lift and move', RX, Y2, BLUE, 52, u, 0.9 + 0.1 * u) or K.width('lift and move', 52, 'xb') + 44
        arrow(c, (RX + w2 + 22, Y2 + 38), (RX + w2 + 98, Y2 + 38), INK2, 8, ua(t, ttr - 0.35, 0.35))
        u = ua(t, ttr, 0.35)
        w3 = chip(c, 'transport', RX + w2 + 124, Y2, BLUE, 52, u, 0.9 + 0.1 * u) or K.width('transport', 52, 'xb') + 44
        # row 3: transfer of care at the hospital
        xe = RX + w2 + 124 + w3 / 2
        arrow(c, (xe - 40, Y2 + 100), (RX + 400, Y3 - 14), INK2, 8, ua(t, txf - 0.4, 0.4), bend=-0.22)
        u = ua(t, txf, 0.35)
        w4 = chip(c, 'transfer of care', RX, Y3, BLUE, 52, u, 0.9 + 0.1 * u) or K.width('transfer of care', 52, 'xb') + 44
        arrow(c, (RX + w4 + 22, Y3 + 38), (RX + w4 + 98, Y3 + 38), INK2, 8, ua(t, thos - 0.3, 0.35))
        hx = 1640
        u = ua(t, thos, 0.45)
        hospital(c, hx, Y3 + 172, 1.2, u)
        uh = ua(t, thand, 0.4)
        person(c, 'emt', hx - 124, Y3 + 122, 46, uh, 0.85 + 0.15 * uh)
        person(c, 'nurse', hx + 124, Y3 + 122, 46, ua(t, thand + 0.25, 0.4))
        if t > tdone:
            ud = ua(t, tdone, 0.3)
            c.drawCircle(hx, Y3 + 122, 32 * (0.7 + 0.3 * ud), P(GREEN, 255 * ud));
            pth = skia.Path(); pth.moveTo(hx - 14, Y3 + 123); pth.lineTo(hx - 4, Y3 + 133); pth.lineTo(hx + 15, Y3 + 110); c.drawPath(pth, SP(NAVY, 7, 255 * ud))
        # row 4: through all of it, the patient's advocate
        ul = ua(t, b3, 1.1)
        if ul > 0.01:
            c.drawRRect(rr(RX, 826, RX + (1830 - RX) * ul, 834, 4), P(AMBER, 255))
        ue = ua(t, tspk - 0.5, 0.4)
        person(c, 'emt', RX + 56, 918, 54, ue, 0.9 + 0.1 * ue)
        bubble(c, RX + 172, 893, 0.82, ua(t, tspk, 0.3), t)
        hw(c, "the patient's advocate", RX + 250, 941, 72, AMBER, t, tadv, 0.9)


# ================================================================== j3
def mini_list(c, x, y, a):
    """the list from the last board, small: four numbered rows on a card"""
    if a <= 0.01: return
    lay = layer(c, a, skia.Rect(x - 30, y - 30, x + 400, y + 420))
    c.drawRRect(rr(x + 6, y + 12, x + 366, y + 392, 26), P(SHADOW, 120, MaskFilter=K.blur(12)))
    c.drawRRect(rr(x, y, x + 360, y + 380, 26), P((30, 40, 92)))
    c.drawRRect(rr(x, y, x + 360, y + 380, 26), SP((90, 104, 170), 2.5, 190))
    for i in range(4):
        yy = y + 62 + i * 86
        c.drawCircle(x + 58, yy, 25, P(COURSE)); text(c, str(i + 1), x + 58, yy + 11, 30, NAVY, 1, 'xb', 'center')
        c.drawRRect(rr(x + 104, yy - 9, x + 104 + (210, 150, 180, 196)[i], yy + 9, 9), P((150, 160, 206)))
    if lay: c.restore()


def j3(c, t):
    k = 'j3'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'The job also takes judgment', t, t0)
    tj = ww(k, 'judgment') - 0.2
    ts = ww(k, 'scene') - 0.2; ta = ww(k, 'assessment') - 0.2; tp = ww(k, 'patient', 0, ta) - 0.2
    tput = ww(k, 'put') - 0.1; td = ww(k, 'decide') - 0.25
    tne = ww(k, 'enough', 0, c3) - 0.3; task = ww(k, 'ask') - 0.15; tex = ww(k, 'examine') - 0.15; tact = ww(k, 'act') - 0.1
    bx, by, br = 1010, 560, 130
    # the list alone is not enough
    gone = ua(t, c2 - 0.1, 0.5)
    mini_list(c, 170, 370, ua(t, t0 + 0.1, 0.5) * (1 - gone))
    upl = ua(t, tj - 0.5, 0.3) * (1 - gone)
    if upl > 0.01:
        c.drawLine(668, 560, 748, 560, SP(CREAM, 12, 255 * upl)); c.drawLine(708, 520, 708, 600, SP(CREAM, 12, 255 * upl))
    ub = ua(t, t0 + 0.3, 0.5)
    WD.glow(c, bx, by, br * 1.5, AMBER, 0.3 * pulse(t, tj, 0.9) + 0.3 * pulse(t, td, 0.9))
    person(c, 'emt', bx, by, br, ub, 0.92 + 0.08 * ub)
    hw(c, 'judgment', bx, by + br + 86, 84, AMBER, t, tj, 0.7, 'center')
    # three sources flow in
    ys = (402, 560, 718)
    for i, (s, ti, col) in enumerate((('the scene', ts, TEAL), ('your assessment', ta, TEAL), ('the patient', tp, TEAL))):
        u = ua(t, ti, 0.35)
        if u <= 0.01: continue
        w = chip(c, s, 130, ys[i] - 42, col, 54, u, 0.9 + 0.1 * u)
        loopback = ua(t, tne + 0.4, 0.4)
        arrow(c, (130 + w + 24, ys[i]), (bx - br - 30, by + (ys[i] - by) * 0.3), INK2, 8, ua(t, ti + 0.15, 0.45), bend=0.0)
        d = ((t - tput) / 1.3 - i * 0.12)
        if 0 < d < 1:
            x0, y0, x1, y1 = 130 + w + 24, ys[i], bx - br - 30, by + (ys[i] - by) * 0.3
            c.drawCircle(lerp(x0, x1, sm(d)), lerp(y0, y1, sm(d)), 12, P(AMBER))
    # decide
    ud = ua(t, td, 0.35); hold = ua(t, tne, 0.4) * (1 - ua(t, tact, 0.4))
    arrow(c, (bx + br + 30, by), (1380, by), mix(AMBER, INK2, hold), 10, ua(t, td - 0.4, 0.4), 1 - 0.5 * hold)
    chip(c, 'decide', 1410, by - 52, AMBER, 72, ud * (1 - 0.55 * hold), 0.9 + 0.1 * ud + 0.06 * pulse(t, td, 0.4) + 0.06 * pulse(t, tact, 0.4))
    # not enough information: go back for more
    ul = ua(t, tne + 0.2, 0.9)
    if ul > 0.01:
        lp = skia.Path(); lp.moveTo(1220, 905); lp.cubicTo(1010, 1000, 560, 990, 440, 812)
        trace(c, lp, ul, AMBER, 9, 1.0, head=28)
    tx(c, 'ask more questions', 1260, 868, 50, CREAM, t, task, 'semi')
    tx(c, 'examine further', 1260, 944, 50, CREAM, t, tex, 'semi')
    hw(c, 'not enough?', 1260, 792, 60, AMBER, t, tne, 0.6)


# ================================================================== j5
def j5(c, t):
    k = 'j5'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'What the job asks from you', t, t0)
    base_a = ua(t, t0, 0.5)
    cols = ((110, 670), (690, 1230), (1250, 1810))
    ons = (t0, c2, c3)
    for (x0, x1), ton in zip(cols, ons):
        panel(c, x0, 240, x1, 968, base_a * (0.4 + 0.6 * ua(t, ton - 0.1, 0.4)))
    # 1 lift and carry
    tl_ = ww(k, 'lift') - 0.2; tab = ww(k, 'about') - 0.15
    lift = ua(t, tl_, 0.7) * (0.85 + 0.15 * math.sin((t - tl_) * 1.6))
    weight(c, 390, 720, 1.0, base_a, lift)
    for sx in (-1, 1):
        ua_ = ua(t, tl_, 0.4)
        arrow(c, (390 + sx * 200, 690), (390 + sx * 200, 560 - 20 * lift), AMBER, 10, ua_, ua_)
    tx(c, 'about 125 lb', 390, 880, 76, CREAM, t, tab, 'xb', 'center')
    # 2 eyesight and colour vision
    te = ww(k, 'eyesight') - 0.3; tc = ww(k, 'color') - 0.1; tlip = ww(k, 'lips') - 0.25; tpale = ww(k, 'pale') - 0.15; tblue = ww(k, 'blue') - 0.15
    ucol = ua(t, tc, 0.3) * (1 - ua(t, tlip, 0.5))
    ph = (t - tc) * 1.6
    iris = mix(COURSE, (AMBER, CORAL, BLUE)[int(ph) % 3] if ucol > 0 else COURSE, ucol)
    ue = ua(t, te, 0.4)
    eye(c, 960, 400, 1.0 * (0.9 + 0.1 * ue), ue, iris)
    hw(c, 'lips or skin', 960, 590, 60, CREAM, t, tlip, 0.7, 'center')
    sw = ((790, (226, 176, 146), (190, 92, 98), (210, 118, 122), tlip + 0.2, None),
          (960, (236, 226, 214), (214, 190, 184), (226, 206, 200), tpale, 'pale'),
          (1130, (178, 184, 206), (104, 104, 168), (128, 128, 190), tblue, 'blue'))
    for x, skin, l1, l2, ti, lab in sw:
        u = ua(t, ti, 0.35)
        lips(c, x, 720, 128 * (0.9 + 0.1 * u), skin, l1, l2, u)
        if lab:
            tx(c, lab, x, 866, 50, AMBER if t < c3 else CREAM, t, ti + 0.05, 'xb', 'center')
    # 3 the person
    tcalm = ww(k, 'calm') - 0.2; tlis = ww(k, 'listens') - 0.2; tfair = ww(k, 'fairly') - 0.3
    up = ua(t, c3, 0.4)
    person(c, 'emt', 1530, 392, 110, up, 0.9 + 0.1 * up)
    for i, (s, ti, col) in enumerate((('calm', tcalm, TEAL), ('listens', tlis, TEAL), ('fair', tfair, TEAL))):
        u = ua(t, ti, 0.35)
        w = K.width(s, 60, 'xb') + 44
        chip(c, s, 1530 - w / 2, 560 + i * 128, col, 60, u, 0.9 + 0.1 * u + 0.08 * pulse(t, ti, 0.4))


# ================================================================== m1 + m2 (one diagram) and m4
MDX, MDY, MDR = 960, 345, 100
EMX, EMY, EMR_ = 960, 838, 90


def branch(side, u):
    """the line of authority; u = 0 one straight line, u = 1 one of the two branches"""
    off = 72 * u; bulge = 360 * u
    p0 = (MDX + side * off, MDY + MDR + 14 - 34 * u); p3 = (EMX + side * (off + 28 * u), EMY - EMR_ - 22 + 30 * u)
    return cubic(p0, (MDX + side * bulge, p0[1] + 50), (EMX + side * bulge, p3[1] - 50), p3)


def behind(c, t):
    board(c, t)
    t0, a1, a2, a3 = cues('m1', 3)
    s0, b1, b2, b3 = cues('m2', 3)
    tmd = ww('m2', 'medical') - 0.3
    ut = ua(t, tmd, 0.4)
    text(c, 'Who says Priya can?', W / 2, 150, 54, CREAM, sm((t - t0) / 0.4) * (1 - ut), 'xb', 'center')
    two(c, 'Medical ', CREAM, 'direction', CREAM, W / 2, 150, 54, ut, 'xb', 'center')
    twho = ww('m1', 'Who') - 0.2; tpri = ww('m1', 'Priya') - 0.15
    tname = ww('m1', 'Medical') - 0.25; tfinal = ww('m1', 'final') - 0.2
    tw = ww('m1', 'writes') - 0.2; tov = ww('m1', 'oversees') - 0.2; thp = ww('m1', 'helps') - 0.2
    temt = ww('m1', 'E', 0, a3) - 0.15; tau = ww('m1', 'authority', 0, a3) - 0.5
    m1a = 1 - ua(t, s0 + 0.2, 0.5)                       # things that belong to m1 only
    # the two branches (m2)
    tsplit = ww('m2', 'two') - 0.3
    us = ua(t, tsplit, 1.0)
    tline = a3 + 0.1; ul = ua(t, tline, 1.1)
    toff = ww('m2', 'OFF') - 0.25; tso = ww('m2', 'standing') - 0.2; twr = ww('m2', 'written') - 0.2; tact = ww('m2', 'act') - 0.2
    ton = ww('m2', 'ON') - 0.25; tgiv = ww('m2', 'gives') - 0.2; trt = ww('m2', 'real') - 0.3; tph = ww('m2', 'phone') - 0.15; trd = ww('m2', 'radio') - 0.15
    e2 = fin('m2')
    lightbar(c, t, 652, toff, b3, 104, 584, 210)
    lightbar(c, t, 652, ton, e2 + 3, 1376, 1822, 210)
    if ul > 0.01:
        if us < 0.01:
            trace(c, branch(1, 0), ul, COURSE, 10, 1.0, head=30)
        else:
            dl = (t - tact) / 1.3; dr = (t - (tgiv + 0.5)) / 1.3
            trace(c, branch(-1, us), 1, COURSE, 10, 1.0, head=30, dot=dl if 0 < dl < 1 else None)
            trace(c, branch(1, us), 1, COURSE, 10, 1.0, head=30, dot=dr if 0 < dr < 1 else None)
    hw(c, 'authority', MDX + 34, 610, 64, AMBER, t, tau, 0.7, a=m1a)
    # the question, then the physician
    uq = ua(t, twho, 0.35) * (1 - ua(t, a1 - 0.1, 0.4))
    if uq > 0.01:
        c.drawCircle(MDX, MDY, MDR, P((44, 56, 118), 200 * uq)); c.drawCircle(MDX, MDY, MDR, SP(AMBER, 5, 255 * uq))
        text(c, '?', MDX, MDY + 52, 150, AMBER, uq, 'xb', 'center')
    um = ua(t, a1, 0.5)
    WD.glow(c, MDX, MDY, MDR * 1.5, AMBER, 0.35 * pulse(t, tname, 1.0))
    person(c, 'md', MDX, MDY, MDR, um, 0.88 + 0.12 * um)
    tx(c, 'Medical Director', MDX - MDR - 40, MDY + 6, 62, CREAM, t, tname, 'xb', 'right')
    tx(c, 'final responsibility', MDX - MDR - 40, MDY + 72, 46, INK2, t, tfinal, 'semi', 'right', a=m1a)
    for i, (s, ti) in enumerate((('writes the protocols', tw), ('oversees the training', tov), ('helps review the care', thp))):
        hw(c, s, MDX + MDR + 50, 290 + i * 80, 58, CREAM, t, ti, 0.8, a=m1a)
    # the EMT
    ue = ua(t, t0 + 0.1, 0.5)
    person(c, 'emt', EMX, EMY, EMR_, ue, 0.9 + 0.1 * ue)
    uemt = ua(t, temt, 0.3)
    tx(c, 'Priya', EMX + EMR_ + 34, EMY + 18, 54, CREAM, t, tpri, 'semi', a=1 - uemt)
    tx(c, 'EMT', EMX + EMR_ + 34, EMY + 18, 54, CREAM, t, temt, 'xb')
    # OFF line: standing orders
    uo = ua(t, toff, 0.4)
    protocol_page(c, MDX - 270, 600, 0.9 * (0.9 + 0.1 * uo), uo, 0.25 + 0.75 * ua(t, twr, 1.2), 0.0)
    two(c, 'OFF', COURSE, ' line', CREAM, 560, 592, 80, uo, 'xb', 'right')
    hwr(c, 'standing orders', 560, 682, 62, CREAM, t, tso, 0.8)
    # ON line: a real time order
    un = ua(t, ton, 0.4)
    radio(c, MDX + 268, 618, 0.86 * (0.9 + 0.1 * un) * (1 + 0.08 * pulse(t, trd, 0.5)), un, pulse(t, trd, 0.8))
    phone(c, MDX + 356, 610, 0.86 * (0.9 + 0.1 * ua(t, ton + 0.15, 0.4)) * (1 + 0.08 * pulse(t, tph, 0.5)), ua(t, ton + 0.15, 0.4), pulse(t, tph, 0.8))
    two(c, 'ON', COURSE, ' line', CREAM, 1400, 592, 80, un, 'xb')
    hw(c, 'real time order', 1400, 682, 62, CREAM, t, trt, 0.8)


def m4(c, t):
    k = 'm4'; t0, c1, c2 = cues(k, 2)
    board(c, t)
    title(c, 'The Medical Director checks the care', t, t0)
    twr = ww(k, 'writes') - 0.2; trep = ww(k, 'report') - 0.2; trev = ww(k, 'reviews') - 0.25
    tfind = ww(k, 'problems') - 0.25; tfix = ww(k, 'fix') - 0.15
    tbef = ww(k, 'before') - 0.2; tpro = ww(k, 'protocols') - 0.25; taft = ww(k, 'after', 0, c2) - 0.2; tcall = ww(k, 'call', 0, c2) - 0.2
    trv2 = ww(k, 'review', 0, c2) - 0.35; temt = ww(k, 'E') - 0.2
    ey = 800
    u2 = ua(t, c2, 0.6)
    # the line of authority, then the two links of the timeline
    ua0 = ua(t, t0 + 0.1, 0.5)
    trace(c, cubic((MDX, MDY + MDR + 14), (MDX, MDY + 200), (EMX, ey - 220), (EMX, ey - 112)), 1, COURSE, 10, ua0 * (1 - u2) * 0.9, head=30)
    L = (450, 580); R = (1470, 580)
    trace(c, cubic((MDX - 96, MDY + 44), (700, 400), (L[0] + 30, 380), (L[0], L[1] - 122)), ua(t, tbef, 0.8), COURSE, 9, 1.0, head=28)
    trace(c, cubic((MDX + 96, MDY + 44), (1220, 400), (R[0] - 30, 380), (R[0], R[1] - 122)), ua(t, taft, 0.8), COURSE, 9, 1.0, head=28)
    # the time line
    utl = ua(t, c2 + 0.1, 1.0)
    if utl > 0.01:
        arrow(c, (190, ey), (190 + 1540 * utl, ey), INK2, 7, 1.0, 1.0, head=30)
        for xx, ti in ((L[0], tbef), (R[0], taft)):
            ud = ua(t, ti, 0.3)
            c.drawCircle(xx, ey, 17 * ud, P(NAVY, 255 * ud)); c.drawCircle(xx, ey, 12 * ud, P(AMBER, 255 * ud))
    tx(c, 'before the call', L[0], 900, 54, CREAM, t, tbef, 'xb', 'center')
    tx(c, 'after the call', R[0], 900, 54, CREAM, t, taft, 'xb', 'center')
    # people
    person(c, 'md', MDX, MDY, MDR, ua0)
    tx(c, 'Medical Director', MDX - MDR - 40, MDY + 6, 62, CREAM, t, t0 + 0.1, 'xb', 'right')
    person(c, 'emt', EMX, ey, 88, ua0)
    tx(c, 'EMT', EMX - 88 - 34, ey + 18, 54, CREAM, t, temt, 'xb', 'right', a=1 - u2)
    tx(c, 'the call', EMX, 950, 50, INK2, t, tcall, 'semi', 'center')
    # the report: written by the EMT, sent up for review, then it sits after the call
    ur = ua(t, twr, 0.4)
    if ur > 0.01:
        A = (EMX + 230, ey - 30); B = (MDX + 250, MDY + 10)
        g1 = sm((t - trev) / 1.3); g2 = sm((t - taft) / 1.0)
        m = skia.PathMeasure(cubic(A, (A[0] + 170, A[1] - 150), (B[0] + 170, B[1] + 150), B), False)
        pos, _ = m.getPosTan(m.getLength() * g1)
        px, py = pos.x(), pos.y(); sc = lerp(0.84, 0.72, g1)
        if g2 > 0:
            px = lerp(B[0], R[0], g2); py = lerp(B[1], R[1], g2) - 60 * math.sin(math.pi * g2); sc = lerp(0.72, 0.95, g2)
        WD.glow(c, px, py, 150, AMBER, 0.3 * pulse(t, tfind, 0.8) + 0.3 * pulse(t, trv2, 0.9))
        report_page(c, px, py, sc * (0.9 + 0.1 * ur), ur, ua(t, twr, 1.4), ua(t, tfind, 0.3), ua(t, tfix, 0.4))
        hw(c, 'report', A[0] + 96, A[1] + 22, 62, CREAM, t, trep, 0.5, a=1 - ua(t, trev - 0.1, 0.3))
        hw(c, 'review', B[0] + 92, B[1] + 22, 62, AMBER, t, trev + 1.1, 0.5, a=1 - ua(t, c2 - 0.1, 0.3))
    up = ua(t, tpro, 0.4)
    WD.glow(c, L[0], L[1], 150, AMBER, 0.3 * pulse(t, tpro, 0.9))
    protocol_page(c, L[0], L[1], 0.95 * (0.9 + 0.1 * up), up, ua(t, tpro, 1.0))
    hw(c, 'protocols', L[0] + 100, L[1] + 20, 62, CREAM, t, tpro + 0.1, 0.6)
    hw(c, 'review', R[0] + 122, R[1] + 20, 62, CREAM, t, trv2, 0.6)


# ================================================================== rc
def my_stairs(c, x, y, scale, lit=(), labels=True, a=1.0, t=0):
    """fallback staircase: four steps rising to the right (x, y = bottom left corner)"""
    if a <= 0.01: return
    names = ('EMR', 'EMT', 'AEMT', 'Paramedic')
    sw, sh = 225 * scale, 105 * scale
    for i in range(4):
        on = i in lit
        col = mix((52, 66, 128), COURSE, 1.0 if on else 0.0)
        x0 = x + i * sw; y0 = y - (i + 1) * sh
        c.drawRect(skia.Rect(x0, y0, x0 + sw, y), P(tuple(v * 0.8 for v in col), 255 * a))
        c.drawRect(skia.Rect(x0, y0, x0 + sw, y0 + 16 * scale), P(col, 255 * a))
        if labels:
            text(c, names[i], x0 + sw / 2, y0 - 16 * scale, 40, CREAM if on else INK2, a, 'xb', 'center')


def rc(c, t):
    k = 'rc'; t0, c1, c2, c3 = cues(k, 3)
    board(c, t)
    title(c, 'The whole system in one picture', t, t0)
    ba = ua(t, t0, 0.5)
    panel(c, 100, 232, 1130, 968, ba * (0.4 + 0.6 * ua(t, c1 - 0.1, 0.4)))
    panel(c, 1160, 232, 1820, 520, ba * (0.4 + 0.6 * ua(t, c2 - 0.1, 0.4)))
    panel(c, 1160, 548, 1820, 968, ba * (0.4 + 0.6 * ua(t, c3 - 0.1, 0.4)))
    # 1 the four levels, each lit on its name
    tl_ = [ww(k, 'emergency') - 0.2, ww(k, 'E', 0, ww(k, 'responder')) - 0.2, ww(k, 'advanced') - 0.2, ww(k, 'paramedic') - 0.2, ww(k, 'each') - 0.2]
    lit = {i: ua(t, tl_[i], 0.3) * (1 - ua(t, tl_[i + 1], 0.4)) for i in range(4)}
    done = {i: ua(t, tl_[i + 1], 0.4) for i in range(4)}
    stairs(c, t, lit, done, ua(t, c1 - 0.1, 0.5))
    # 2 on a call
    ts = ww(k, 'safety') - 0.3; tas = ww(k, 'assessment') - 0.2; tb = ww(k, 'before') - 0.1; tca = ww(k, 'care') - 0.1
    lightbar(c, t, 340, ts, tas, 1180, 1800, 112); lightbar(c, t, 456, tas, c3, 1180, 1800, 112)
    num(c, 1, 1226, 320, ua(t, c2, 0.3), ua(t, ts, 0.3), 28)
    hw(c, 'your safety first', 1276, 342, 60, CREAM, t, ts, 0.7)
    x = 1200
    for s_, ti, col in (('assessment ', tas, CREAM), ('before ', tb, AMBER), ('care', tca, CREAM)):
        hw(c, s_, x, 458, 52, col, t, ti, 0.45); x += hwidth(s_, 52)
    # 3 the Medical Director behind everything
    tmd = ww(k, 'Medical', 0, c3) - 0.25; tso = ww(k, 'standing') - 0.2; toff = ww(k, 'off') - 0.15; trt = ww(k, 'real') - 0.2; ton = ww(k, 'on', 0, trt) - 0.15
    px, py, pr = 1258, 648, 76
    R1, R2 = 786, 904
    lightbar(c, t, R1 + 20, tso, trt, 1290, 1800, 114); lightbar(c, t, R2 + 20, trt, fin(k) + 4, 1290, 1800, 114)
    trace(c, cubic((px - 34, py + pr - 2), (px - 40, R1 - 30), (px - 20, R1), (1296, R1)), ua(t, tso - 0.3, 0.6), COURSE, 8, 1.0, head=22)
    trace(c, cubic((px - 52, py + pr - 12), (px - 70, R1 + 30), (px - 50, R2), (1296, R2)), ua(t, trt - 0.3, 0.6), COURSE, 8, 1.0, head=22)
    um = ua(t, c3, 0.45)
    person(c, 'md', px, py, pr, um, 0.9 + 0.1 * um)
    tx(c, 'Medical Director', px + pr + 26, py + 16, 46, CREAM, t, tmd, 'xb')
    uo = ua(t, tso, 0.4)
    protocol_page(c, 1362, R1, 0.52, uo)
    hw(c, 'standing orders', 1432, R1 - 8, 48, CREAM, t, tso, 0.7)
    two(c, 'OFF', COURSE, ' line', CREAM, 1432, R1 + 40, 44, ua(t, toff, 0.3), 'xb')
    un = ua(t, trt, 0.4)
    radio(c, 1342, R2 + 8, 0.46, un); phone(c, 1388, R2 + 2, 0.46, un)
    hw(c, 'real time orders', 1432, R2 - 8, 48, CREAM, t, trt, 0.7)
    two(c, 'ON', COURSE, ' line', CREAM, 1432, R2 + 40, 44, ua(t, ton, 0.3), 'xb')


def stairs(c, t, lit, done, a):
    try:
        from boards_a import staircase
    except Exception:
        staircase = None
    if staircase is None:
        my_stairs(c, 180, 880, 1.0, tuple(i for i in range(4) if lit[i] > 0.5 or done[i] > 0.5), True, a, t)
    else:
        staircase(c, 128, 850, 1.0, lit=lit, labels=True, a=a, t=t, done=done)


SCENES = {'j1': job, 'j2': job, 'j3': j3, 'j5': j5, 'm1': behind, 'm2': behind, 'm4': m4, 'rc': rc}
