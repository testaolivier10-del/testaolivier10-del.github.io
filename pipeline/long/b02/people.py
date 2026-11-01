"""Jay and his grandma, built from parts in code (no tracing) from the Gemini model sheets ref/jay_sheet.png and
ref/nana_sheet.png (proportions, colours, faces, clothing plates, shade tone and amber rim). Front three quarter view.
Units: feet at y=0, head top near -560, x=0 the body centre; the figure's own right arm is side 'R' (viewer's left).
Pose fields: arms {'L'|'R': (shoulder deg out from hanging, elbow bend deg, forward 0..1)} or hands {'L'|'R': (x, y)}
targets (IK), lean deg, head tilt deg, look -1..1, blink 0..1, legs True/False (False: upper body only, e.g. at a table),
kneel 0..1 (Nana planting). Light from the upper left: shade on the right edges, rim on the left and top edges."""
import math
import skia
from gk import P, SP, C, poly, smooth_closed, flat, ik2, blur

RIM = (255, 214, 140)


def dk(c, f=0.78):
    return tuple(v * f for v in c)


def tube(a, b, w0, w1):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d
    p = poly([(ax + nx * w0 / 2, ay + ny * w0 / 2), (bx + nx * w1 / 2, by + ny * w1 / 2), (bx - nx * w1 / 2, by - ny * w1 / 2), (ax - nx * w0 / 2, ay - ny * w0 / 2)])
    q = skia.Path(); q.addCircle(ax, ay, w0 / 2); q.addCircle(bx, by, w1 / 2)
    return skia.Op(p, q, skia.PathOp.kUnion_PathOp) or p


def part(c, path, base, shade=None, rim_a=150, sh=7):
    flat(c, path, base, shade if shade is not None else dk(base), sh_off=(-sh, 0), rim=RIM, rim_d=(2.6, 2.2), rim_a=rim_a)


JAY = dict(kind='jay', skin=(184, 98, 60), hair=(26, 22, 30), shirt=(236, 172, 50), shirt_sh=(200, 128, 38),
           pants=(30, 88, 100), pants_sh=(20, 62, 74), cuff=(48, 110, 124), shoe=(248, 248, 250), stripe=(52, 60, 110),
           sole=(214, 214, 222), h=1.0)
NANA = dict(kind='nana', skin=(150, 80, 48), hair=(184, 182, 178), shirt=(132, 154, 112), shirt_sh=(100, 122, 88),
            apron=(192, 84, 44), apron_sh=(154, 64, 34), blouse=(242, 228, 192), pants=(80, 58, 44), pants_sh=(58, 42, 32),
            shoe=(116, 70, 40), glasses=(100, 66, 48), h=0.93)


class Person:
    def __init__(self, cfg):
        self.k = dict(cfg)

    # ---------------------------------------------------------------- pieces
    def leg(self, c, hip, knee, ft, side):
        k = self.k
        lg = skia.Op(tube(hip, knee, 50, 42), tube(knee, (ft[0], ft[1] - 10), 42, 36), skia.PathOp.kUnion_PathOp)
        part(c, lg, k['pants'], k['pants_sh'])
        fx, fy = ft
        if k['kind'] == 'jay':
            c.drawPath(poly([(fx - 20, fy - 24), (fx + 20, fy - 24), (fx + 21, fy - 8), (fx - 21, fy - 8)]), P(k['cuff']))
            shoe = smooth_closed([(fx - 24, fy - 10), (fx + 2, fy - 16), (fx + 22 + 10 * side * 0, fy - 8), (fx + 30, fy + 6), (fx - 28, fy + 6)])
            part(c, shoe, k['shoe'], (206, 206, 216), rim_a=60)
            c.drawPath(poly([(fx - 22, fy + 2), (fx + 30, fy + 2), (fx + 30, fy + 8), (fx - 26, fy + 8)]), P(k['sole']))
            c.drawLine(fx - 10, fy - 6, fx + 12, fy - 10, SP(k['stripe'], 4))
            c.drawLine(fx - 8, fy - 1, fx + 16, fy - 4, SP(k['stripe'], 4))
        else:
            shoe = smooth_closed([(fx - 22, fy - 10), (fx + 4, fy - 14), (fx + 24, fy - 6), (fx + 28, fy + 6), (fx - 26, fy + 6)])
            part(c, shoe, k['shoe'], dk(k['shoe']), rim_a=90)

    def arm(self, c, sh, el, hd, side):
        k = self.k
        if k['kind'] == 'jay':
            part(c, skia.Op(tube(sh, el, 34, 28), tube(el, hd, 28, 22), skia.PathOp.kUnion_PathOp), k['skin'])
            # short sleeve over the top of the upper arm
            mx, my = sh[0] + (el[0] - sh[0]) * 0.45, sh[1] + (el[1] - sh[1]) * 0.45
            part(c, tube((sh[0], sh[1] + 2), (mx, my), 42, 40), k['shirt'], k['shirt_sh'], sh=5)
        else:
            part(c, skia.Op(tube(sh, el, 40, 34), tube(el, hd, 34, 28), skia.PathOp.kUnion_PathOp), k['shirt'], k['shirt_sh'])
            # cuff
            dx, dy = hd[0] - el[0], hd[1] - el[1]; d = math.hypot(dx, dy) or 1
            cx, cy = hd[0] - dx / d * 12, hd[1] - dy / d * 12
            part(c, tube((cx, cy), (hd[0] - dx / d * 4, hd[1] - dy / d * 4), 32, 30), dk(k['shirt'], 0.9), dk(k['shirt'], 0.7))
        # hand: palm and a thumb
        hx, hy = hd
        dx, dy = hd[0] - el[0], hd[1] - el[1]; d = math.hypot(dx, dy) or 1
        ux, uy = dx / d, dy / d
        palm = smooth_closed([(hx - uy * 13 - ux * 4, hy + ux * 13 - uy * 4), (hx + ux * 22 - uy * 10, hy + uy * 22 + ux * 10),
                              (hx + ux * 26 + uy * 6, hy + uy * 26 - ux * 6), (hx + uy * 13, hy - ux * 13)])
        part(c, palm, k['skin'], rim_a=110, sh=5)
        th = side * -1
        part(c, tube((hx + uy * 11 * th, hy - ux * 11 * th), (hx + ux * 12 + uy * 16 * th, hy + uy * 12 - ux * 16 * th), 11, 9), k['skin'], rim_a=90, sh=4)

    def torso(self, c, neck, hip, t):
        k = self.k
        nx, ny = neck; hx, hy = hip
        br = 1 + 0.012 * math.sin(t * 1.6)
        wS, wH = 62 * br, 52
        body = smooth_closed([(nx - wS, ny + 6), (nx - wS + 4, ny - 8), (nx - 20, ny - 18), (nx + 20, ny - 18), (nx + wS - 4, ny - 8), (nx + wS, ny + 6),
                              (nx + wS - 6, (ny + hy) / 2), (hx + wH, hy + 4), (hx + wH - 4, hy + 16), (hx - wH + 4, hy + 16), (hx - wH, hy + 4), (nx - wS + 6, (ny + hy) / 2)])
        part(c, body, k['shirt'], k['shirt_sh'], sh=12)
        c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
        # collar / neckline
        if k['kind'] == 'jay':
            c.drawOval(skia.Rect(nx - 24, ny - 26, nx + 24, ny - 2), P(dk(k['shirt'], 0.85)))
            c.drawOval(skia.Rect(nx - 19, ny - 26, nx + 19, ny - 8), P(dk(k['skin'], 0.86)))
            # a soft fold
            c.drawPath(poly([(nx + 18, ny + 70), (nx + 30, ny + 64), (nx + 22, ny + 110), (nx + 14, ny + 108)]), P(dk(k['shirt'], 0.92)))
        else:
            v = poly([(nx - 26, ny - 20), (nx + 26, ny - 20), (nx, ny + 60)])
            c.drawPath(v, P(k['blouse']))
            c.drawPath(poly([(nx - 26, ny - 20), (nx - 10, ny - 20), (nx, ny + 60)]), P(dk(k['blouse'], 0.9)))
        c.restore()
        if k['kind'] == 'nana':
            # apron: bib, straps, skirt to the knee and a pocket
            ap = smooth_closed([(nx - 28, ny + 4), (nx + 28, ny + 4), (nx + 30, hy - 60), (hx + 50, hy - 6), (hx + 52, hy + 140), (hx - 52, hy + 140),
                                (hx - 50, hy - 6), (nx - 30, hy - 60)])
            part(c, ap, k['apron'], k['apron_sh'], sh=9)
            c.drawLine(nx - 30, ny + 4, nx - 22, ny - 18, SP(k['apron_sh'], 8))
            c.drawLine(nx + 30, ny + 4, nx + 22, ny - 18, SP(k['apron_sh'], 8))
            c.drawLine(nx - 26, ny + 52, nx + 26, ny + 52, SP(k['apron_sh'], 3))
            pk = skia.RRect.MakeRectXY(skia.Rect(hx - 34, hy + 34, hx + 34, hy + 86), 10, 10)
            c.drawRRect(pk, P(k['apron_sh']))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(hx - 32, hy + 32, hx + 32, hy + 40), 4, 4), P(dk(k['apron'], 0.9)))
        else:
            # waistband of the jeans peeks under the hem
            c.drawPath(poly([(hx - wH + 6, hy + 12), (hx + wH - 6, hy + 12), (hx + wH - 8, hy + 24), (hx - wH + 8, hy + 24)]), P(k['pants']))

    def head(self, c, hc, t, tilt=0.0, look=0.0, blink=0.0):
        k = self.k
        x, y = hc
        c.save(); c.translate(x, y); c.rotate(tilt)
        lx = look * 7
        if k['kind'] == 'jay':
            # back hair mass behind the head
            hb = skia.Path()
            for dx, dy, r in ((-36, -26, 22), (-18, -44, 24), (4, -50, 24), (26, -42, 23), (40, -24, 20), (-42, -6, 16), (44, -4, 15)):
                hb.addCircle(dx, dy, r)
            hb = skia.Op(hb, hb, skia.PathOp.kUnion_PathOp) or hb
            part(c, hb, k['hair'], (12, 10, 16), rim_a=90, sh=6)
        else:
            hb = skia.Path()
            for dx, dy, r in ((-40, -18, 22), (-26, -40, 24), (0, -50, 26), (26, -40, 24), (42, -18, 22), (-46, 4, 16), (47, 4, 16)):
                hb.addCircle(dx, dy, r)
            hb = skia.Op(hb, hb, skia.PathOp.kUnion_PathOp) or hb
            part(c, hb, k['hair'], dk(k['hair'], 0.8), rim_a=120, sh=6)
        # ears
        for sx in (-1, 1):
            e = skia.Path(); e.addOval(skia.Rect(sx * 40 - 9 + lx * 0.3, -6, sx * 40 + 9 + lx * 0.3, 18))
            part(c, e, k['skin'], rim_a=80, sh=4)
        face = smooth_closed([(-38, -16), (-30, -40), (0, -46), (30, -40), (38, -16), (36, 14), (22, 38), (0, 46), (-22, 38), (-36, 14)])
        part(c, face, k['skin'], dk(k['skin'], 0.86), rim_a=120, sh=8)
        # fringe of hair on the forehead
        if k['kind'] == 'jay':
            fr = skia.Path()
            for dx, dy, r in ((-28, -36, 14), (-12, -42, 15), (6, -43, 15), (22, -38, 14), (33, -26, 11), (-35, -24, 11)):
                fr.addCircle(dx, dy, r)
            fr = skia.Op(fr, fr, skia.PathOp.kUnion_PathOp) or fr
            part(c, fr, k['hair'], (12, 10, 16), rim_a=80, sh=4)
        else:
            fr = skia.Path()
            for dx, dy, r in ((-30, -34, 15), (-12, -42, 16), (8, -42, 16), (26, -34, 15), (38, -16, 12), (-38, -16, 12)):
                fr.addCircle(dx, dy, r)
            fr = skia.Op(fr, fr, skia.PathOp.kUnion_PathOp) or fr
            part(c, fr, k['hair'], dk(k['hair'], 0.8), rim_a=110, sh=4)
        ink = (40, 26, 22)
        # eyes (blink squashes them), brows, nose shade, smile
        ey = -4
        for sx in (-1, 1):
            ex = sx * 14 + lx
            h = max(0.6, 5.2 * (1 - blink))
            c.drawOval(skia.Rect(ex - 4.6, ey - h, ex + 4.6, ey + h), P(ink))
            c.drawLine(ex - 8, ey - 13 - (1 if sx < 0 else 0), ex + 8, ey - 14, SP(dk(k['hair'], 0.5) if k['kind'] == 'jay' else (110, 106, 100), 3.4))
        c.drawPath(smooth_closed([(lx + 2, 2), (lx + 7, 12), (lx + 1, 15), (lx - 3, 13)]), P(dk(k['skin'], 0.82)))
        sm = skia.Path(); sm.moveTo(lx - 10, 24); sm.quadTo(lx, 31, lx + 10, 24)
        c.drawPath(sm, SP(dk(k['skin'], 0.55), 3.2))
        if k['kind'] == 'nana':
            for sx in (-1, 1):
                ex = sx * 15 + lx
                c.drawCircle(ex, ey, 11, SP(k['glasses'], 3.2))
            c.drawLine(lx - 4, ey - 1, lx + 4, ey - 1, SP(k['glasses'], 3))
            c.drawLine(-26 + lx, ey - 2, -38, ey - 4, SP(k['glasses'], 2.6)); c.drawLine(26 + lx, ey - 2, 38, ey - 4, SP(k['glasses'], 2.6))
        c.restore()

    # ---------------------------------------------------------------- whole figure
    def joints(self, pose, t):
        """returns joint points in units"""
        lean = math.radians(pose.get('lean', 0.0))
        kneel = pose.get('kneel', 0.0)
        bob = 2.0 * math.sin(t * 1.6)
        hipy = -290 + 120 * kneel
        hip = (0.0, hipy)

        def rot(p):
            x, y = p[0] - hip[0], p[1] - hip[1]
            return (hip[0] + x * math.cos(lean) - y * math.sin(lean), hip[1] + x * math.sin(lean) + y * math.cos(lean))
        neck = rot((0, hipy - 145 + bob * 0.4))
        head = rot((0, hipy - 215 + bob * 0.6))
        J = dict(hip=hip, neck=neck, head=head)
        for side, sx in (('R', -1), ('L', 1)):
            sh = rot((sx * 64, hipy - 130 + bob * 0.5))
            hand_t = pose.get('hands', {}).get(side)
            if hand_t is not None:
                el = ik2(sh, hand_t, 112, 108, bend=-sx if pose.get('elbow_out', True) else sx)
                hd = hand_t
                d = math.hypot(hd[0] - sh[0], hd[1] - sh[1])
                if d > 219:
                    a = math.atan2(hd[1] - sh[1], hd[0] - sh[0]); hd = (sh[0] + 219 * math.cos(a), sh[1] + 219 * math.sin(a))
                    el = (sh[0] + 112 * math.cos(a), sh[1] + 112 * math.sin(a))
            else:
                a_out, bend, fwd = pose.get('arms', {}).get(side, (6, 8, 0))
                a = math.radians(90 + sx * a_out) + lean
                a += 0.02 * math.sin(t * 1.3 + sx)
                el = (sh[0] + 112 * math.cos(a), sh[1] + 112 * math.sin(a) * (1 - 0.35 * fwd))
                a2 = a + math.radians(sx * -bend)
                hd = (el[0] + 108 * math.cos(a2), el[1] + 108 * math.sin(a2) * (1 - 0.35 * fwd))
            J['sh' + side], J['el' + side], J['hd' + side] = sh, el, hd
            hx = sx * 26
            if kneel > 0:
                J['kn' + side] = (hx + sx * 10, hipy + 60 + (40 if side == 'R' else 0) * kneel)
                J['ft' + side] = (hx + sx * 30 - 70 * kneel * (side == 'R'), -6)
            else:
                J['kn' + side] = (hx + sx * 2, -150)
                J['ft' + side] = (hx + sx * 4, -16)
        return J

    def draw(self, c, x, y, s, t=0.0, pose=None, front_arms=(), shadow=True):
        """front_arms: sides whose arm is drawn in front of the torso (reaching forward)"""
        pose = pose or {}
        k = self.k
        s *= k['h']
        J = self.joints(pose, t)
        c.save(); c.translate(x, y); c.scale(s, s)
        if shadow and pose.get('legs', True):
            c.drawOval(skia.Rect(-120, -14, 120, 14), P((40, 40, 60), 60, MaskFilter=blur(6)))
        if pose.get('legs', True):
            for side, sx in (('R', -1), ('L', 1)):
                self.leg(c, (sx * 26, J['hip'][1]), J['kn' + side], J['ft' + side], sx)
        nk = tube((J['neck'][0], J['neck'][1] + 10), (J['head'][0], J['head'][1] + 20), 34, 32)
        part(c, nk, k['skin'], dk(k['skin'], 0.8))
        for side in ('R', 'L'):
            if side in pose.get('behind', ()):
                self.arm(c, J['sh' + side], J['el' + side], J['hd' + side], -1 if side == 'R' else 1)
        self.torso(c, J['neck'], J['hip'], t)
        blink = pose.get('blink', None)
        if blink is None:
            ph = (t + (0.7 if k['kind'] == 'nana' else 0)) % 4.1
            blink = 1.0 if ph < 0.12 else 0.0
        self.head(c, J['head'], t, tilt=pose.get('tilt', 0.0), look=pose.get('look', 0.0), blink=blink)
        for side in ('R', 'L'):
            if side not in pose.get('behind', ()):
                self.arm(c, J['sh' + side], J['el' + side], J['hd' + side], -1 if side == 'R' else 1)
        c.restore()
        # world positions of the hands for props
        return {key: (x + v[0] * s, y + v[1] * s) for key, v in J.items()}


jay = Person(JAY)
nana = Person(NANA)
