"""A house style person built from parts in code (side or three quarter view): shaded plates with a light strip on the
lit side and a subtle rim, limbs that bend (two bone joints), breathing, hat brims, cloth sway.
Pose: dict of joint points in screen space. Light comes from `light` (+1 right, -1 left)."""
import math, skia
from lpk import P, SP, C, poly, smooth_closed, rim_of, flat, blur, mix


def tube(a, b, w0, w1):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay; d = math.hypot(dx, dy) or 1
    nx, ny = -dy / d, dx / d
    p = poly([(ax + nx * w0 / 2, ay + ny * w0 / 2), (bx + nx * w1 / 2, by + ny * w1 / 2), (bx - nx * w1 / 2, by - ny * w1 / 2), (ax - nx * w0 / 2, ay - ny * w0 / 2)])
    q = skia.Path(); q.addCircle(ax, ay, w0 / 2); q.addCircle(bx, by, w1 / 2)
    return skia.Op(p, q, skia.PathOp.kUnion_PathOp) or p


def shade_draw(c, path, base, shade, light, rim, rim_a=200, sh=7):
    flat(c, path, base, shade, sh_off=(sh * light, 0), rim=rim, rim_d=(-2.5 * light, 1.5), rim_a=rim_a)


class Person:
    def __init__(self, s=1.0, shirt=(214, 196, 168), vest=(92, 70, 58), pants=(70, 66, 84), skin=(214, 160, 120),
                 hat=(62, 50, 46), boots=(48, 36, 34), hair=(70, 48, 36), light=1, rim=(255, 206, 140), shade_k=0.72,
                 hatted=True, beard=False, hat_style='brim', lamp=False):
        self.s = s; self.light = light; self.rim = rim; self.hatted = hatted; self.beard = beard; self.hat_style = hat_style; self.lamp = lamp
        k = shade_k
        dk = lambda x, f=k: tuple(v * f for v in x)
        self.cols = dict(shirt=(shirt, dk(shirt)), vest=(vest, dk(vest)), pants=(pants, dk(pants)), skin=(skin, dk(skin)),
                         hat=(hat, dk(hat)), boots=(boots, dk(boots)), hair=(hair, dk(hair)))

    def part(self, c, path, name, far=False, rim_a=200):
        b, sh = self.cols[name]
        if far:
            b, sh = tuple(v * 0.8 for v in b), tuple(v * 0.8 for v in sh)
            rim_a = rim_a * 0.4
        shade_draw(c, path, b, sh, self.light, self.rim, rim_a, sh=7 * self.s)

    def leg(self, c, hip, knee, foot, far, toe=1):
        s = self.s
        self.part(c, tube(hip, knee, 30 * s, 25 * s), 'pants', far)
        self.part(c, tube(knee, foot, 25 * s, 20 * s), 'pants', far)
        fx, fy = foot
        boot = smooth_closed([(fx - 12 * s * toe, fy - 14 * s), (fx + 30 * s * toe, fy - 6 * s), (fx + 34 * s * toe, fy + 6 * s), (fx - 14 * s * toe, fy + 7 * s)])
        self.part(c, boot, 'boots', far)

    def arm(self, c, sh, el, hd, far, sleeve='shirt'):
        s = self.s
        self.part(c, tube(sh, el, 22 * s, 19 * s), sleeve, far)
        self.part(c, tube(el, hd, 18 * s, 14 * s), sleeve, far)
        hx, hy = hd
        hand = skia.Path(); hand.addCircle(hx, hy, 9.5 * s)
        self.part(c, hand, 'skin', far)

    def torso(self, c, neck, hip, lean=0.0, vest=True):
        s = self.s
        nx, ny = neck; hx, hy = hip
        dx, dy = hx - nx, hy - ny; d = math.hypot(dx, dy) or 1
        px, py = -dy / d, dx / d
        w_sh, w_hip = 50 * s, 40 * s
        pts = [(nx + px * w_sh / 2, ny + py * w_sh / 2), (nx + dx * 0.5 + px * (w_sh * 0.55), ny + dy * 0.5 + py * (w_sh * 0.55)),
               (hx + px * w_hip / 2, hy + py * w_hip / 2), (hx - px * w_hip / 2, hy - py * w_hip / 2),
               (nx + dx * 0.5 - px * (w_sh * 0.5), ny + dy * 0.5 - py * (w_sh * 0.5)), (nx - px * w_sh / 2, ny - py * w_sh / 2)]
        body = smooth_closed(pts)
        self.part(c, body, 'shirt')
        if vest:
            c.save(); c.clipPath(body, skia.ClipOp.kIntersect, True)
            # the vest covers the back half and the lower torso; shirt shows at the chest and arms
            vp = poly([(nx - px * 40 * s, ny - py * 40 * s), (nx + px * 6 * s + dx * 0.15, ny + py * 6 * s + dy * 0.15),
                       (hx + px * 8 * s, hy + py * 8 * s), (hx - px * 40 * s, hy - py * 40 * s)])
            self.part(c, vp, 'vest')
            c.restore()
        # belt
        c.drawLine(hx + px * w_hip / 2, hy + py * w_hip / 2, hx - px * w_hip / 2, hy - py * w_hip / 2, SP((40, 30, 26), 7 * s))

    def head(self, c, hc, face=-1, tilt=0.0, eye=True):
        """hc: head centre; face -1 = looking left, +1 = right"""
        s = self.s; x, y = hc
        c.save(); c.translate(x, y); c.rotate(math.degrees(tilt)); c.scale(face, 1)
        # head shape in profile looking +x after the scale; drawn facing right then mirrored
        hd = smooth_closed([(-20 * s, -24 * s), (6 * s, -27 * s), (22 * s, -12 * s), (25 * s, 2 * s), (29 * s, 8 * s), (23 * s, 12 * s),
                            (22 * s, 22 * s), (12 * s, 30 * s), (-6 * s, 28 * s), (-20 * s, 14 * s), (-24 * s, -6 * s)])
        b, sh = self.cols['skin']
        lt = self.light * face
        flat(c, hd, b, sh, sh_off=(7 * s * lt, 0), rim=self.rim, rim_d=(-2.5 * lt, 1.5), rim_a=170)
        # hair at the back, ear, beard line
        hair = smooth_closed([(-24 * s, -10 * s), (-12 * s, -26 * s), (8 * s, -27 * s), (2 * s, -14 * s), (-8 * s, -6 * s), (-12 * s, 12 * s), (-22 * s, 10 * s)])
        c.drawPath(hair, P(self.cols['hair'][0]))
        c.drawOval(skia.Rect(-10 * s, -4 * s, -1 * s, 10 * s), P(sh))
        if self.beard:
            bd = smooth_closed([(-8 * s, 12 * s), (8 * s, 16 * s), (22 * s, 20 * s), (14 * s, 30 * s), (-4 * s, 30 * s), (-12 * s, 20 * s)])
            c.drawPath(bd, P(self.cols['hair'][1]))
        if eye:
            c.drawCircle(14 * s, -4 * s, 2.6 * s, P((40, 30, 30)))
            c.drawLine(9 * s, -10 * s, 19 * s, -11 * s, SP(self.cols['hair'][1], 2.4 * s))
        if self.hatted and self.hat_style in ('helmet', 'beanie'):
            hb, hs = self.cols['hat']
            if self.hat_style == 'helmet':
                dome = smooth_closed([(-27 * s, -2 * s), (-26 * s, -26 * s), (-6 * s, -40 * s), (18 * s, -34 * s), (28 * s, -14 * s), (26 * s, -4 * s)])
            else:
                dome = smooth_closed([(-25 * s, -4 * s), (-22 * s, -28 * s), (-2 * s, -38 * s), (18 * s, -30 * s), (25 * s, -12 * s), (24 * s, -6 * s)])
            flat(c, dome, hb, hs, sh_off=(6 * s * lt, 0), rim=self.rim, rim_d=(-2 * lt, 1.5), rim_a=170)
            if self.hat_style == 'beanie':
                c.drawLine(-25 * s, -8 * s, 24 * s, -10 * s, SP(hs, 6 * s))
            if self.lamp:
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(16 * s, -24 * s, 30 * s, -14 * s), 3 * s, 3 * s), P((40, 40, 46)))
                c.drawCircle(29 * s, -19 * s, 4 * s, P((255, 250, 220)))
        elif self.hatted:
            br = smooth_closed([(-34 * s, -20 * s), (0, -25 * s), (36 * s, -22 * s), (38 * s, -17 * s), (0, -17 * s), (-34 * s, -14 * s)])
            cr = smooth_closed([(-20 * s, -18 * s), (-18 * s, -44 * s), (0, -50 * s), (18 * s, -44 * s), (20 * s, -18 * s)])
            hb, hs = self.cols['hat']
            flat(c, cr, hb, hs, sh_off=(6 * s * lt, 0), rim=self.rim, rim_d=(-2 * lt, 1.5), rim_a=150)
            c.drawPath(poly([(-20 * s, -24 * s), (20 * s, -24 * s), (20 * s, -19 * s), (-20 * s, -19 * s)]), P((40, 30, 28)))
            flat(c, br, hb, hs, sh_off=(0, 3 * s), rim=self.rim, rim_d=(-2 * lt, 1.0), rim_a=150)
        c.restore()
        # neck
        return

    def draw(self, c, J, face=-1, vest=True, eye=True, tilt=0.0, toe=None):
        """J: head, neck, hip, shN, elN, hdN, shF, elF, hdF, knN, ftN, knF, ftF (N near, F far)"""
        self.arm(c, J['shF'], J['elF'], J['hdF'], True)
        self.leg(c, J['hip'], J['knF'], J['ftF'], True, toe=toe if toe is not None else face)
        self.leg(c, J['hip'], J['knN'], J['ftN'], False, toe=toe if toe is not None else face)
        nk = skia.Path(); nk.addCircle(J['neck'][0], J['neck'][1] - 6 * self.s, 11 * self.s)
        self.part(c, nk, 'skin')
        self.torso(c, J['neck'], J['hip'], vest=vest)
        self.head(c, J['head'], face=face, eye=eye, tilt=tilt)
        self.arm(c, J['shN'], J['elN'], J['hdN'], False)
