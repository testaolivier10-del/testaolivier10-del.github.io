"""The airman as ONE skinned body (the way Toon Boom deformation rigs, Spine meshes and Pose Animator do it).

The body is drawn once, in a rest pose, as continuous artwork (coverall, neck, collar, sleeves, forearms, legs, boots
and the details printed on them). Every outline is sampled into dense points, and each point is bound to the nearby
bones with smooth weights (linear blend skinning): v' = sum_i w_i * M_i * v, with M_i = bone_now * bone_rest^-1.
Near a joint a point is pulled by both bones, so cloth and skin BEND across the elbow, knee, hip, shoulder and neck
instead of two rigid pieces meeting at a seam. Only the extremities stay rigid swap drawings, as in cut-out rigs:
the head (which the neck skin flows into) and the hands (fist, point, flat, grip).

Shading comes after deformation, from the deformed silhouette: one shade band away from the light and one amber rim
around the whole near figure, so light reads across him as one body."""
import math
import numpy as np
import skia
import airman2 as A
A.LIM['ankle'] = (-110, 110); A.LIM['neck'] = (-40, 40)
from airman2 import (HAIR_SH, CAP_SH, P, SP, C, mix, curve, union, inter, diff, circ, SKIN, SKIN_SH, OL, OL_SH, OL_HI, CUFF, BELT, BELT_SH,
                     BOOT_C, BOOT_SH, SOLE, HAIR, CAP, RIM, TORSO, THIGH, SHIN, CUFFB, BOOT, UARM, SLEEVE_ROLL, FARM,
                     L_SPINE, L_UARM, L_FARM, L_THIGH, L_SHIN, hand_shape, Pose, HEAD_SHAPES, _hp)

SHADE = {SKIN: SKIN_SH, OL: OL_SH, CUFF: OL_SH, BOOT_C: BOOT_SH, BELT: BELT_SH}
STEP = 4.0


def _affine(f):
    o = f(0, 0); ex = f(1, 0); ey = f(0, 1)
    return np.array([[ex[0] - o[0], ey[0] - o[0], o[0]], [ex[1] - o[1], ey[1] - o[1], o[1]], [0, 0, 1.0]])


def _seg_dist(p, a, b):
    a = np.asarray(a, float); b = np.asarray(b, float)
    ab = b - a; t = np.clip(((p - a) @ ab) / max(ab @ ab, 1e-9), 0, 1)
    q = a + t[:, None] * ab
    return np.hypot(*(p - q).T)


def _sample(path):
    """a skia path -> list of dense closed point rings"""
    rings = []
    pm = skia.PathMeasure(path, False, 1.0)
    while True:
        L = pm.getLength()
        if L > 1:
            n = max(8, int(L / STEP)); pts = []
            for i in range(n):
                pos, _ = pm.getPosTan(L * i / n)
                pts.append((pos.x(), pos.y()))
            rings.append((np.array(pts), pm.isClosed()))
        if not pm.nextContour(): break
    return rings


def _rebuild(rings):
    p = skia.Path()
    for pts, closed in rings:
        n = len(pts)
        if n < 3: continue
        if closed:
            m = (pts + np.roll(pts, -1, axis=0)) / 2
            p.moveTo(*m[-1])
            for i in range(n):
                p.quadTo(*pts[i], *m[i])
            p.close()
        else:
            p.moveTo(*pts[0])
            for i in range(1, n): p.lineTo(*pts[i])
    return p


class Person(A.Airman):
    def __init__(self, scale=1.0, palette=None, cap=True, glasses=False, collar=None, tie=None, sleeve=None, hat=None, forearm=None,
                 trouser=None, glove=None, stripe=None, buttons=None):
        self.hat, self.forearm, self.trouser, self.glove, self.stripe, self.buttons = hat, forearm, trouser, glove, stripe, buttons
        if hat: cap = False
        self.sleeve = sleeve
        super().__init__(scale)
        self.pal = {tuple(k): v for k, v in (palette or {}).items()}
        self.cap, self.glasses, self.collar_col, self.tie = cap, glasses, collar, tie
        self.rest = Pose()
        self.J0 = self.joints(self.rest)
        self.bones0 = self._bones(self.J0)
        self.layers = self._build_rest()

    # ---------------------------------------------------------- skeleton as bones (affine frames + segments)
    def _bones(self, J):
        B = {}
        B['spine'] = (_affine(J['torso_f']), J['hip'], J['torso_f'](0, L_SPINE - 30))
        B['neck'] = (_affine(J['neck_f']), J['neck0'], J['head_piv'])
        h = self._hf(J)
        B['head'] = (_affine(h), J['head_piv'], h(*_hp((190, 150))))
        for s in 'nf':
            for key, L in (('uarm_', L_UARM), ('farm_', L_FARM), ('thigh_', L_THIGH), ('shin_', L_SHIN)):
                o, d = J[key + s]; f = self.frame(o, d)
                B[key + s] = (_affine(f), o, f(0, L))
            o, d = J['hand_' + s]; f = self.frame(o, d)
            B['hand_' + s] = (_affine(f), o, f(0, 80))
            o, an = J['boot_' + s]; a = math.radians(an); ca, sa = math.cos(a), math.sin(a)
            fb = lambda px, py, o=o, ca=ca, sa=sa: (o[0] + px * ca - py * sa, o[1] + px * sa + py * ca)
            B['boot_' + s] = (_affine(fb), o, fb(60, 110))
        return B

    # ---------------------------------------------------------- rest-pose artwork, bound to bones
    def _bind(self, path, bones, sigma):
        out = []
        for pts, closed in _sample(path):
            D = np.stack([_seg_dist(pts, self.bones0[b][1], self.bones0[b][2]) for b in bones], 1)
            W = np.exp(-(D - D.min(1, keepdims=True)) / sigma)
            W /= W.sum(1, keepdims=True)
            out.append((pts, closed, W))
        return out

    def _build_rest(self):
        J = self.J0; L = []
        add = lambda grp, path, col, bones, kind='base', sigma=10.0, a=255: L.append(dict(
            grp=grp, col=col, kind=kind, a=a, bones=bones, rings=self._bind(path, bones, sigma),
            limb='arm' if any(b.startswith('uarm') for b in bones) else ('leg' if any(b.startswith(('thigh', 'shin')) for b in bones) else '')))
        stroke = lambda path, w: (lambda d: (SP((0, 0, 0), w).getFillPath(path, d), d)[1])(skia.Path())
        line = lambda a, b, w: stroke(self._seg(a, b), w)
        T = J['torso_f']
        for s in 'fn':
            g = 'far' if s == 'f' else 'leg'
            legb = ['spine', 'thigh_' + s, 'shin_' + s]
            o, an = J['boot_' + s]; a = math.radians(an); ca, sa = math.cos(a), math.sin(a)
            fb = lambda px, py: (o[0] + px * ca - py * sa, o[1] + px * sa + py * ca)
            add(g, curve([fb(*p) for p in BOOT]), BOOT_C, ['boot_' + s])
            add(g, curve([fb(*p) for p in [(-72, 116), (124, 116), (124, 138), (-72, 138)]]), SOLE, ['boot_' + s], 'detail')
            for k in range(4):
                add(g, line((o[0] + (10 + k * 14) * ca, o[1] - 10 + k * 14), (o[0] + (36 + k * 14) * ca, o[1] - 2 + k * 14), 4), BOOT_SH, ['boot_' + s], 'detail')
            add(g, self._leg_path(J, s), OL, legb, sigma=14)
            add(g, self.part(J, 'shin_' + s, CUFFB), CUFF, ['shin_' + s])
            tf = self.frame(*J['thigh_' + s]); sf = self.frame(*J['shin_' + s])
            add(g, line(tf(30, 120), tf(24, 250), 4), OL_SH, legb, 'detail', a=150)
            add(g, line(sf(-50, 120), sf(-30, 180), 4), OL_SH, legb, 'detail', a=140)
            if self.stripe is not None:
                add(g, line(tf(4, 20), tf(4, 290), 9), self.stripe, legb, 'detail', sigma=14)
                add(g, line(sf(2, -10), sf(2, 200), 9), self.stripe, legb, 'detail', sigma=14)
        for s in 'fn':
            g = 'far' if s == 'f' else 'arm'
            armb = ['uarm_' + s, 'farm_' + s]
            o, _ = J['farm_' + s]
            fa = union([self.part(J, 'farm_' + s, FARM), circ(o[0], o[1], 38)])
            add(g, fa, SKIN, ['uarm_' + s, 'farm_' + s, 'hand_' + s], sigma=10)
            f = self.frame(*J['farm_' + s])
            add(g, line(f(20, 30), f(10, 110), 4), SKIN_SH, ['farm_' + s], 'detail', a=150)
            add(g, self.part(J, 'uarm_' + s, UARM), OL, armb, sigma=12)
            if not self.hat:      # the airman's rolled sleeve; a ceremonial tunic sleeve runs straight to the cuff
                add(g, self.part(J, 'uarm_' + s, SLEEVE_ROLL), CUFF, ['uarm_' + s])
                uf = self.frame(*J['uarm_' + s])
                add(g, line(uf(-60, 186), uf(62, 186), 3), OL_SH, ['uarm_' + s], 'detail', a=160)
        # neck: one shape from inside the skull (head frame) down into the collar (chest frame), weighted across both
        add('neck', self._neck_path(J), SKIN, ['spine', 'neck', 'head'], sigma=24)
        hf = self._hf(J)
        jaw = inter(curve([hf(*_hp(p)) for p in HEAD_SHAPES['jawshadow']]), self._neck_path(J))
        add('neck', jaw, SKIN_SH, ['spine', 'neck', 'head'], 'detail', sigma=24)
        # torso and everything printed on it
        torso = curve([T(px, py) for px, py in TORSO])
        add('torso', torso, OL, ['spine'])
        bl = skia.Path(); bl.moveTo(*T(-140, 6)); bl.lineTo(*T(140, 6)); bl.lineTo(*T(140, 46)); bl.lineTo(*T(-140, 46)); bl.close()
        add('torso', inter(bl, torso), BELT, ['spine'])
        add('torso', curve([T(px, py) for px, py in [(60, 12), (92, 12), (92, 40), (60, 40)]]), (150, 120, 80), ['spine'], 'detail')
        add('torso', stroke(curve([T(px, py) for px, py in [(36, 230), (90, 232), (88, 290), (40, 292)]]), 4), OL_SH, ['spine'], 'detail')
        add('torso', circ(*T(64, 266), 5), OL_HI, ['spine'], 'detail')
        if self.buttons is not None:
            for k in range(6): add('torso', circ(*T(94, 90 + k * 48), 8), self.buttons, ['spine'], 'detail')
        add('torso', inter(line(T(98, 60), T(104, 330), 4), torso), OL_SH, ['spine'], 'detail')
        collar = curve([T(px, py) for px, py in [(-58, 360), (-44, 396), (-8, 404), (30, 396), (66, 360), (84, 322), (60, 318), (36, 352), (0, 372), (-38, 366)]])
        add('collar', collar, OL, ['spine', 'neck'], sigma=30)
        add('collar', curve([T(px, py) for px, py in [(36, 352), (60, 318), (84, 322), (70, 300), (46, 330)]]), OL_SH, ['spine'], 'detail')
        return L

    @staticmethod
    def _seg(a, b):
        p = skia.Path(); p.moveTo(*a); p.lineTo(*b); return p

    # ---------------------------------------------------------- skinning
    def _deform(self, layer, Ms):
        rings = []
        for pts, closed, W in layer['rings']:
            H = np.c_[pts, np.ones(len(pts))]
            out = np.zeros((len(pts), 2))
            for j, b in enumerate(layer['bones']):
                out += W[:, j:j + 1] * (H @ Ms[b].T)[:, :2]
            rings.append((out, closed))
        return _rebuild(rings)

    def _hand(self, J, s, ps):
        hk = ps.hand_n if s == 'n' else ps.hand_f
        hp, thumbs = hand_shape(hk)
        ho, hd = J['hand_' + s]; hf = self.frame(ho, hd)
        hand = curve([hf(*p) for p in hp])
        thumb = union([circ(*hf(*t0), r) for (t0, t1, r) in thumbs] + [self._cap2(hf(*t0), hf(*t1), r) for (t0, t1, r) in thumbs])
        lines = []
        if hk in ('fist', 'grip'):
            lines = [(hf(6 + k * 8, 56 + k * 9), hf(30, 52 + k * 9)) for k in range(3)]
        if hk == 'point':
            lines = [(hf(6, 70), hf(14, 88))]
        return union([hand, thumb]), lines

    def pc(self, col, grp=None, shade=False):
        col = tuple(col)
        if grp == 'collar' and self.collar_col is not None and col in (OL, OL_SH):
            return self.collar_col if (col == OL and not shade) else mix(self.collar_col, (0, 0, 0), 0.18)
        if grp == 'sleeve' and self.forearm is not None and col in (SKIN, SKIN_SH):
            return self.forearm if (col == SKIN and not shade) else mix(self.forearm, (0, 0, 0), 0.25)
        if grp == 'trouser' and self.trouser is not None and col in (OL, OL_SH, CUFF):
            return self.trouser if (col != OL_SH and not shade) else mix(self.trouser, (0, 0, 0), 0.3)
        if grp == 'sleeve' and self.sleeve is not None and col in (OL, OL_SH, CUFF):
            return self.sleeve if (col != OL_SH and not shade) else mix(self.sleeve, (60, 60, 80), 0.2)
        return self.pal.get(col, col)

    def _head(self, c, J, ps, l):
        """the rigid head, in this person's palette; with a cap (the airman) or bare headed with hair over the crown"""
        h = self._hf(J); pc = self.pc
        S = lambda pts: curve([h(*_hp(p)) for p in pts])
        head = S(HEAD_SHAPES['skin'])
        c.drawPath(head, P(pc(SKIN))); self._shade(c, head, pc(SKIN_SH), l, 14)
        c.save(); c.clipPath(head, skia.ClipOp.kIntersect, True)
        c.drawPath(S(HEAD_SHAPES['cheek']), P(pc(SKIN_SH))); c.restore()
        hair = S(HEAD_SHAPES['hair'])
        if not self.cap and self.hat in (None, 'felt'): hair = union([hair, S(HEAD_SHAPES['hairtop'])])
        c.drawPath(hair, P(pc(HAIR))); self._shade(c, hair, pc(HAIR_SH), l, 8)
        ear = S(HEAD_SHAPES['ear'])
        c.drawPath(ear, P(pc(SKIN))); self._shade(c, ear, pc(SKIN_SH), l, 6)
        c.drawPath(S([(130, 150), (144, 148), (145, 172), (135, 178), (132, 164)]), P(pc(SKIN_SH)))
        bw = getattr(ps, 'brow', 0.0)
        c.drawPath(S([(208, 136 - 4 * bw), (228, 128 + 2 * bw), (250, 128 + 9 * bw), (250, 134 + 9 * bw), (228, 134 + 2 * bw), (210, 141 - 4 * bw)]), P(pc(HAIR)))
        if getattr(self, 'scar', False):
            # the healed entry wound under the left cheekbone (he faces left, so this is his left side) and the lost left eye
            c.drawPath(S([(214, 186), (226, 180), (236, 186), (226, 192)]), P(mix(pc(SKIN_SH), (170, 70, 70), 0.45)))
        if ps.blink or getattr(self, 'eye_shut', False):
            c.drawLine(*h(*_hp((216, 149))), *h(*_hp((240, 149))), SP((52, 34, 24), 3))
        else:
            c.drawPath(S([(216, 149), (228, 141), (242, 144), (238, 154), (224, 155)]), P((250, 246, 238)))
            c.drawCircle(*h(*_hp((232 + 3 * ps.look, 148))), 4.6, P((48, 30, 22)))
            ep = skia.Path(); ep.moveTo(*h(*_hp((215, 148)))); ep.quadTo(*h(*_hp((228, 139))), *h(*_hp((243, 143))))
            c.drawPath(ep, SP((60, 36, 28), 2.6))
        if self.glasses:
            c.drawCircle(*h(*_hp((232, 148))), 15 * 1.25, SP((40, 34, 30), 3.2))
            c.drawLine(*h(*_hp((217, 145))), *h(*_hp((146, 146))), SP((40, 34, 30), 3))
        c.drawPath(S([(250, 183), (266, 184), (260, 189), (250, 188)]), P(pc(SKIN_SH)))
        sm = ps.smile
        mp = skia.Path(); mp.moveTo(*h(*_hp((236, 206 + 2 * sm)))); mp.quadTo(*h(*_hp((244, 210 + 2 * sm))), *h(*_hp((254, 204))))
        c.drawPath(mp, SP((150, 80, 66), 3))
        if ps.mouth > 0.05:
            c.drawPath(S([(238, 205), (252, 203), (250, 203 + 12 * ps.mouth), (240, 205 + 10 * ps.mouth)]), P((100, 46, 44)))
        if self.hat == 'bearskin':
            bs = S(HEAD_SHAPES['bearskin'])
            # gold chin strap from the cap edge down along the jaw to under the chin
            st = skia.Path(); st.moveTo(*h(*_hp((158, 120)))); st.quadTo(*h(*_hp((178, 200))), *h(*_hp((236, 240))))
            c.drawPath(st, SP((214, 172, 70), 4.2))
            c.drawPath(bs, P((30, 28, 34))); self._shade(c, bs, (16, 15, 20), l, 16)
            # fur: soft tufts along the outline and a few strands inside
            rs = __import__('numpy').random.default_rng(3)
            for k in range(40):
                u = k / 40; pts = HEAD_SHAPES['bearskin']; i = int(u * (len(pts) - 1))
                x, y = pts[i]; x2, y2 = pts[i + 1]; f = u * (len(pts) - 1) - i
                px, py = x + (x2 - x) * f, y + (y2 - y) * f
                c.drawCircle(*h(*_hp((px, py))), 5, P((36, 34, 42)))
            for k in range(24):
                x, y = rs.uniform(110, 245), rs.uniform(-130, 80)
                q = skia.Path(); q.moveTo(*h(*_hp((x, y)))); q.quadTo(*h(*_hp((x + 6, y + 14))), *h(*_hp((x + 2, y + 30))))
                c.drawPath(q, SP((48, 46, 56), 3, 200))
        if self.hat == 'felt':
            cr = S(HEAD_SHAPES['felt_crown']); br = S(HEAD_SHAPES['felt_brim'])
            FH, FS = getattr(self, 'hat_col', (112, 78, 52)), getattr(self, 'hat_sh', (84, 56, 38))
            c.drawPath(cr, P(FH)); self._shade(c, cr, FS, l, 12)
            c.save(); c.clipPath(cr, skia.ClipOp.kIntersect, True)
            c.drawPath(S(HEAD_SHAPES['felt_band']), P(mix(FS, (30, 20, 16), 0.5))); c.restore()
            dent = skia.Path(); dent.moveTo(*h(*_hp((150, 18)))); dent.quadTo(*h(*_hp((168, 34))), *h(*_hp((196, 20))))
            c.drawPath(dent, SP(FS, 4, 200))
            c.drawPath(br, P(mix(FH, (0, 0, 0), 0.05))); self._shade(c, br, FS, l, 6)
        if self.cap:
            cap = S(HEAD_SHAPES['cap'])
            c.drawPath(cap, P(pc(CAP))); self._shade(c, cap, pc(CAP_SH), l, 10)
            c.drawPath(S(HEAD_SHAPES['visor']), P(mix(pc(CAP), (255, 240, 200), 0.12)))
            c.drawPath(S([(72, 112), (88, 108), (88, 132), (72, 136)]), P((60, 46, 36)))

    def canvas_pt(self, ps, p):
        """a pose-space point (e.g. a joint) to canvas space, for props held in a hand"""
        return (ps.x + p[0] * ps.s * self.k * ps.face, ps.ground + p[1] * ps.s * self.k)

    # ---------------------------------------------------------- draw
    def draw(self, c, ps, light=(0.75, -0.65), rim=RIM, far_dim=0.82, tint=None, shadow=True, world=False):
        J = self.joints(ps)
        bn = self._bones(J)
        Ms = {b: bn[b][0] @ np.linalg.inv(self.bones0[b][0]) for b in bn}
        lx = light[0] * (ps.face if world else 1); ly = light[1]; l = (lx, ly)
        c.save()
        c.translate(ps.x, ps.ground); c.scale(ps.s * self.k * ps.face, ps.s * self.k)
        if shadow:
            c.drawOval(skia.Rect(-170, -14, 220, 14), P((20, 20, 24), 70, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8)))
        D = [(ly_, self._deform(ly_, Ms)) for ly_ in self.layers]
        dim = lambda col: mix(col, (24, 26, 34), 1 - far_dim)

        def band(paths, d):
            S = union(paths); q = skia.Path(S); q.offset(-lx * d, -ly * d); return S, diff(S, q)

        def paint_group(items, tone, Bd):
            for L_, p in items:
                g_ = 'sleeve' if L_['limb'] == 'arm' else ('trouser' if L_['limb'] == 'leg' else L_['grp'])
                c.drawPath(p, P(tone(self.pc(L_['col'], g_)), L_['a']))
                if L_['kind'] == 'base' and L_['col'] in SHADE and Bd is not None:
                    c.drawPath(inter(p, Bd), P(tone(self.pc(SHADE[L_['col']], g_, True)), L_['a']))

        grp = lambda g: [(L_, p) for L_, p in D if L_['grp'] == g]
        # far side, darker, its own volume
        far = grp('far'); fh, flines = self._hand(J, 'f', ps)
        _, fB = band([p for L_, p in far if L_['kind'] == 'base'] + [fh], 14)
        paint_group([x for x in far if x[0]['col'] not in (SKIN,) or x[0]['kind'] == 'detail'][:0], dim, fB)
        # far leg first, then far arm with its hand
        farleg = [x for x in far if 'boot_f' in x[0]['bones'] or 'thigh_f' in x[0]['bones'] or 'shin_f' in x[0]['bones']]
        fararm = [x for x in far if not any(x is y for y in farleg)]
        paint_group(farleg, dim, fB)
        fskin = [x for x in fararm if x[0]['col'] in (SKIN, SKIN_SH)]
        paint_group(fskin, dim, fB)
        gl = self.glove or self.pc(SKIN); gls = mix(gl, (0, 0, 0), 0.18) if self.glove else self.pc(SKIN_SH)
        c.drawPath(fh, P(dim(gl))); c.drawPath(inter(fh, fB), P(dim(gls)))
        for a, b in flines: c.drawLine(*a, *b, SP(dim(gls), 3.5, 200))
        paint_group([x for x in fararm if not any(x is y for y in fskin)], dim, fB)
        # the one near silhouette: neck, near leg, torso, collar, head, near arm and hand
        nh, nlines = self._hand(J, 'n', ps)
        hd = self._hf(J); HS = lambda k: curve([hd(*_hp(p)) for p in HEAD_SHAPES[k]])
        base = [p for L_, p in D if L_['grp'] != 'far' and L_['kind'] == 'base']
        S, Bd = band(base + [HS('skin'), HS('hair')] + ([HS('cap'), HS('visor')] if self.cap else ([HS('bearskin')] if self.hat == 'bearskin' else ([HS('felt_crown'), HS('felt_brim'), HS('hairtop')] if self.hat == 'felt' else [HS('hairtop')]))) + [nh], 16)
        same = lambda x: x
        paint_group(grp('neck'), same, Bd)
        paint_group(grp('leg'), same, Bd)
        paint_group(grp('torso'), same, Bd)
        self._B = Bd
        self._head(c, J, ps, l)
        paint_group(grp('collar'), same, Bd)
        if self.tie is not None:
            T = J['torso_f']
            tie = curve([T(*p) for p in [(66, 352), (84, 350), (92, 300), (100, 210), (84, 196), (70, 230), (68, 300)]])
            c.save(); c.clipPath(union([p for L_, p in grp('torso')]), skia.ClipOp.kIntersect, True)
            c.drawPath(tie, P(self.tie)); c.restore()
        # near arm sits in front of the chest: a soft contact shadow, then its own volume shading
        arm = grp('arm')
        armS, aB = band([p for L_, p in arm if L_['kind'] == 'base'] + [nh], 10)
        q = skia.Path(armS); q.offset(-lx * 10, -ly * 10)
        c.save(); c.clipPath(union([p for L_, p in grp('torso')]), skia.ClipOp.kIntersect, True)
        c.drawPath(q, P((0, 0, 0), 45, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8))); c.restore()
        askin = [x for x in arm if x[0]['col'] in (SKIN, SKIN_SH)]
        paint_group(askin, same, aB)
        gl = self.glove or self.pc(SKIN); gls = mix(gl, (0, 0, 0), 0.18) if self.glove else self.pc(SKIN_SH)
        c.drawPath(nh, P(gl)); c.drawPath(inter(nh, aB), P(gls))
        for a, b in nlines: c.drawLine(*a, *b, SP(gls, 3.5, 200))
        paint_group([x for x in arm if not any(x is y for y in askin)], same, aB)
        # one rim around the one figure
        self._B = None
        self._rim(c, S, l, rim, force=True)
        if tint is not None:
            c.save(); c.clipPath(union([S, union([p for L_, p in far])]), skia.ClipOp.kIntersect, True)
            c.drawPaint(P(tint[:3], tint[3])); c.restore()
        c.restore()
        return J
