"""w1118 diamond: the two people and their props (all code, people v5 copy in person.py).
Lost man (the hiker): thin and tall, sunburned, sandy hair under a navy cap pushed back, stubble, a faded teal zip sun shirt with its hood
down, a rust neck cloth, khaki cargo trousers, brown boots, a canteen on a strap at his hip, dust on his clothes, dry cracked lips.
Stranger (the seller): heavy and older, darker skin, grey hair and a full grey beard, a wide brimmed straw hat with a dark band, a denim
collared shirt under a brown leather waistcoat, dark jeans, black boots."""
import sys, math
sys.path[:0] = ['/home/claude/w1118/diamond', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import person as PN, hands as H
from guy import Pose
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed
from art import shaded, diffp, op

LOOKS = dict(
    lost=dict(TOP=(84, 150, 160), TOP_SH=(52, 104, 120), TOP_HI=(170, 222, 214), PANT=(184, 158, 116), PANT_SH=(138, 112, 84), PANT_HI=(226, 204, 162),
              SKIN=(226, 162, 126), SKIN_SH=(184, 116, 94), SKIN_HI=(252, 206, 170), HAIR=(150, 108, 64), HAIR_SH=(104, 72, 46), HAIR_HI=(214, 172, 110),
              cfg=dict(bw=0.9, fl=1.06, fw=0.95, top='rain', bottom='cargo', hair='cap', hat=(58, 72, 112), beard='stubble', neck=(196, 98, 62), canteen=True,
                       sunburn=1.0, dry=True, dust=0.8, dustcl=1.0, shoe=((132, 92, 62), (92, 62, 46), (60, 48, 44)))),
    seller=dict(TOP=(72, 100, 150), TOP_SH=(46, 64, 108), TOP_HI=(132, 160, 210), PANT=(54, 60, 80), PANT_SH=(34, 38, 56), PANT_HI=(96, 104, 134),
                SKIN=(156, 102, 74), SKIN_SH=(116, 70, 56), SKIN_HI=(200, 148, 116), HAIR=(178, 172, 164), HAIR_SH=(130, 124, 120), HAIR_HI=(226, 222, 214),
                cfg=dict(bw=1.17, fw=1.08, fl=0.98, head=1.03, top='uniform', bottom='chinos', hair='brim', hat=(222, 186, 118), band=(84, 46, 38), beard='full',
                         waist=(122, 76, 48), shoe=((44, 40, 44), (24, 22, 28), (64, 60, 66)))))


def person(c, who, ps, x, ground, s):
    for k, v in LOOKS[who].items():
        if k != 'cfg': setattr(PN, k, v)
    ps.cfg = LOOKS[who]['cfg']
    PN.draw(c, ps, x=x, ground=ground, s=s)
    if who == 'lost' and PN.CANT[0] is not None: canteen(c, PN.CANT[0].x(), PN.CANT[0].y(), s)


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def canteen(c, x, y, s):
    """an empty dented metal canteen at his hip, its cap hanging open on its chain"""
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-8)
    c.drawOval(skia.Rect(-44, -46, 52, 64), P((40, 30, 30), 70, MaskFilter=blur(8)))
    body = smooth_closed([(-40, -30), (0, -44), (40, -30), (46, 14), (30, 52), (0, 60), (-30, 52), (-46, 14)])
    shaded(c, body, (150, 158, 150), (104, 110, 108), sh=(10, 6), rimL=(226, 230, 220), rl=(-3, -3))
    c.drawLine(-44, 8, 44, 8, SP((104, 110, 108), 3, 160)); c.drawPath(smooth_closed([(16, 20), (26, 26), (22, 38), (12, 32)]), P((120, 126, 124), 200))  # a dent
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-12, -58, 12, -40), 4, 4), P((120, 126, 120)))
    stroke = skia.Path(); stroke.moveTo(10, -54); stroke.quadTo(30, -40, 26, -24); c.drawPath(stroke, SP((90, 90, 90), 2))
    c.drawOval(skia.Rect(16, -26, 36, -14), P((120, 126, 120)))                                       # the cap hangs open: it is empty
    c.restore()


# ------------------------------------------------------------------ props
def bottle_path(s):
    h, w = 64 * s, 18 * s                                          # half height, half width (a half litre bottle, a little longer than a hand)
    return smooth_closed([(-w * 0.42, -h * 1.0), (w * 0.42, -h * 1.0), (w * 0.5, -h * 0.84), (w, -h * 0.58), (w, h * 0.92), (w * 0.8, h), (-w * 0.8, h), (-w, h * 0.92), (-w, -h * 0.58), (-w * 0.5, -h * 0.84)]), h, w


def bottle(c, cx, cy, ang, s, level=0.86, t=0.0, wet=1.0, glint=0.0, tip=0.0, cap=True):
    """a clear plastic water bottle: ribbed body, blue label, white cap, water inside that stays level (tip = how far the bottle is turned
    from upright, so the surface counter-rotates), cold drops on the outside. ang: the bottle's axis angle in degrees (0 = cap up)."""
    c.save(); c.translate(cx, cy); c.rotate(ang)
    body, h, w = bottle_path(s)
    c.drawPath(body, P((210, 236, 246), 120))
    # water: a level surface in world terms
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    wl = h - level * 2 * h
    c.save(); c.rotate(-ang + tip * 0)
    q = skia.Path(); q.addRect(skia.Rect(-3 * h, wl + 4 * math.sin(t * 3), 3 * h, 3 * h))
    c.restore()
    c.save(); c.rotate(-ang); c.translate(0, 0)
    surf = wl * math.cos(math.radians(ang))
    c.drawRect(skia.Rect(-4 * h, surf + 3 * math.sin(t * 2.6), 4 * h, 4 * h), P((74, 168, 226), 215))
    c.drawRect(skia.Rect(-4 * h, surf + 3 * math.sin(t * 2.6), 4 * h, surf + 3 * math.sin(t * 2.6) + 5 * s), P((200, 240, 255), 220))
    c.restore()
    c.drawRect(skia.Rect(-w * 0.2, -h, w * 0.45, h), P((255, 255, 255), 50))                      # light through the water
    c.drawRect(skia.Rect(-w, -h, -w * 0.55, h), P((20, 70, 120), 60))
    for j in range(5):                                                                               # ribs
        yy = -h * 0.42 + j * h * 0.13; c.drawLine(-w, yy, w, yy, SP((255, 255, 255), 1.6 * s, 110))
    c.restore()
    lab = skia.Rect(-w - 0.5, h * 0.14, w + 0.5, h * 0.62)
    c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
    c.drawRect(lab, P((40, 116, 200))); c.drawRect(skia.Rect(lab.left(), lab.top(), lab.right(), lab.top() + 4 * s), P((150, 210, 255)))
    c.drawPath(smooth_closed([(-w * 0.6, h * 0.42), (-w * 0.2, h * 0.28), (w * 0.3, h * 0.36), (w * 0.6, h * 0.3), (w * 0.5, h * 0.46), (-w * 0.5, h * 0.5)]), P((255, 255, 255), 200))   # a wave mark
    c.drawRect(skia.Rect(w * 0.4, -h, w, h), P((10, 40, 80), 70))                                  # shade side
    c.restore()
    c.drawPath(body, SP((240, 252, 255), 2.2 * s, 200))
    if cap:
        cp = skia.Rect(-w * 0.46, -h * 1.17, w * 0.46, -h * 0.98)
        c.drawRRect(skia.RRect.MakeRectXY(cp, 3 * s, 3 * s), P((236, 240, 246))); c.drawRect(skia.Rect(w * 0.1, cp.top(), cp.right(), cp.bottom()), P((180, 192, 210)))
        for j in range(5): xx = lerp(cp.left() + 2 * s, cp.right() - 2 * s, j / 4); c.drawLine(xx, cp.top() + 2 * s, xx, cp.bottom() - 2 * s, SP((170, 180, 200), 1.2 * s))
    if wet > 0:                                                                                       # cold drops on the outside
        rs = np.random.default_rng(3)
        for _ in range(16):
            dx, dy = rs.uniform(-w * 0.85, w * 0.85), rs.uniform(-h * 0.5, h * 0.9)
            dy += (t * 6 * rs.uniform(0.2, 1.0)) % (h * 0.4) if rs.random() < 0.3 else 0
            r_ = rs.uniform(1.2, 2.6) * s
            c.drawCircle(dx, dy, r_, P((230, 250, 255), 150 * wet)); c.drawCircle(dx - r_ * 0.3, dy - r_ * 0.3, r_ * 0.4, P((255, 255, 255), 230 * wet))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w * 0.72, -h * 0.5, -w * 0.5, h * 0.1), 3 * s, 3 * s), P((255, 255, 255), 170))   # highlight strip
    if glint > 0:
        g = (-w * 0.6, -h * 0.4)
        c.drawCircle(*g, 20 * s * glint, P((255, 250, 220), 160 * glint, MaskFilter=blur(8 * s)))
        for a_ in (0, 90):
            c.save(); c.translate(*g); c.rotate(a_ + 20); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-26 * s * glint, -1.2 * s, 26 * s * glint, 1.2 * s), s, s), P((255, 255, 240), 230 * glint)); c.restore()
    c.restore()


def held_bottle(level=0.86, t=0.0, glint=0.0, du=52.0, dv=0.0, wet=1.0, s_=None, flip=0, cap=True):
    """a prop callback for person.py: the bottle lies across the curled fingers, axis along the knuckle line"""
    def f(c, hw, ang, ts, s):
        ca, sa = math.cos(ang), math.sin(ang)
        px = hw[0] + s * (du * ca - dv * ts * sa); py = hw[1] + s * (du * sa + dv * ts * ca)
        ax = math.degrees(ang) + (0 if ts > 0 else 180) + flip    # axis along the knuckles (across the fingers)
        bottle(c, px, py, ax, (s_ or s) * 1.0, level=level, t=t, glint=glint, wet=wet, cap=cap)
    return f


def diamond(c, x, y, r, a=1.0, sparkle=0.0, t=0.0):
    """a cut diamond seen from the side and a little above: table, crown facets, pavilion point"""
    c.save(); c.translate(x, y)
    crown = [(-r, 0), (-r * 0.62, -r * 0.5), (r * 0.62, -r * 0.5), (r, 0)]
    pav = [(-r, 0), (r, 0), (0, r * 1.1)]
    pa = skia.Path(); pa.addPoly([skia.Point(*p) for p in crown], True); c.drawPath(pa, P((214, 236, 255), 255 * a))
    pb = skia.Path(); pb.addPoly([skia.Point(*p) for p in pav], True); c.drawPath(pb, P((150, 196, 240), 255 * a))
    for (p0, p1, p2, col) in (((-r, 0), (-r * 0.62, -r * 0.5), (-r * 0.2, 0), (240, 250, 255)), ((r * 0.2, 0), (r * 0.62, -r * 0.5), (r, 0), (170, 206, 246)),
                              ((-r, 0), (-r * 0.3, 0), (0, r * 1.1), (196, 226, 255)), ((r * 0.3, 0), (r, 0), (0, r * 1.1), (110, 156, 220))):
        q = skia.Path(); q.addPoly([skia.Point(*p0), skia.Point(*p1), skia.Point(*p2)], True); c.drawPath(q, P(col, 255 * a))
    c.drawLine(-r, 0, r, 0, SP((255, 255, 255), max(1, r * 0.08), 230 * a))
    if sparkle > 0:
        c.drawCircle(-r * 0.3, -r * 0.25, r * 1.6 * sparkle, P((255, 255, 255), 110 * sparkle, MaskFilter=blur(r * 0.5)))
        for a_ in (0, 90):
            c.save(); c.translate(-r * 0.3, -r * 0.25); c.rotate(a_ + 15 + 20 * math.sin(t * 2)); L_ = r * 2.4 * sparkle
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-L_, -r * 0.07, L_, r * 0.07), r * 0.07, r * 0.07), P((255, 255, 255), 240 * sparkle)); c.restore()
    c.restore()


GOLD, GOLD_SH, GOLD_HI = (232, 184, 72), (168, 116, 40), (255, 236, 160)


def ring_loose(c, x, y, r, ang=0.0, sparkle=0.0, t=0.0, a=1.0):
    """the ring on its own (held up, or pinched): a gold band seen at a slant, the stone on top"""
    c.save(); c.translate(x, y); c.rotate(ang)
    c.drawOval(skia.Rect(-r, -r * 0.45, r, r * 0.45), SP(GOLD_SH, r * 0.3, 255 * a))
    c.drawArc(skia.Rect(-r, -r * 0.45, r, r * 0.45), 0, 180, False, SP(GOLD, r * 0.26, 255 * a))
    c.drawArc(skia.Rect(-r, -r * 0.45, r, r * 0.45), 30, 90, False, SP(GOLD_HI, r * 0.08, 255 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-r * 0.3, -r * 0.62, r * 0.3, -r * 0.38), r * 0.1, r * 0.1), P(GOLD, 255 * a))
    diamond(c, 0, -r * 0.82, r * 0.42, a, sparkle, t)
    c.restore()


def ring_on_finger(sparkle=0.0, t=0.0):
    """`over` callback: the ring sits on the ring finger's first segment, drawn across the finger, the stone on the back of the finger"""
    def f(c, Wf, hw, ang, ts, s):
        p0 = Wf(52, -6); p1 = Wf(64, -6)
        a_ = math.degrees(math.atan2(p1[1] - p0[1], p1[0] - p0[0]))
        cx, cy = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
        c.save(); c.translate(cx, cy); c.rotate(a_)
        band = skia.Rect(-3.6 * s, -8.4 * s, 3.6 * s, 8.4 * s)
        c.drawRRect(skia.RRect.MakeRectXY(band, 3 * s, 3 * s), P(GOLD)); c.drawRect(skia.Rect(-3.6 * s, 2 * s, 3.6 * s, 8.4 * s), P(GOLD_SH, 200)); c.drawLine(-2.4 * s, -7 * s, -2.4 * s, 4 * s, SP(GOLD_HI, 1.2 * s, 220))
        c.restore()
        c.save(); c.translate(cx, cy); c.rotate(a_ - 90)
        diamond(c, 0, -1.6 * s, 4.6 * s, 1.0, sparkle, t)
        c.restore()
    return f
