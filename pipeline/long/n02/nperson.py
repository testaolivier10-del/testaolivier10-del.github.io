"""People study, step 2: the same guy, redesigned to look better (Olivier: "let's make him look better").
Changes from step 1: warm clothes that stand off the navy board; the sweatshirt body and both sleeves are ONE shape with one shade
and one rim (no puffed shoulder caps); a real stance (weight on one leg, hips tilted, the free knee relaxed, feet turned out);
shaped trouser legs with a crease and a break over proper sneakers; a stronger head (jaw, hair with volume and tapered sides,
larger eyes, lid crease); soft contact shadows where things overlap; the arm folds at the elbow on the way down."""
import sys, math
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import shaded, diffp, tube, op, glow
import bhands as H
from guy import limb, stroke, Pose, track, background
RELAX = dict(curls=(0.3, 0.24, 0.28, 0.34, 0.4), spread=0.16)

SKIN, SKIN_SH, SKIN_HI = (228, 176, 144), (188, 128, 108), (254, 220, 192)
HAIR, HAIR_SH, HAIR_HI = (56, 38, 34), (34, 22, 24), (124, 88, 66)
TOP, TOP_SH, TOP_HI = (228, 112, 80), (178, 72, 66), (255, 176, 138)
TEE = (246, 242, 234)
PANT, PANT_SH, PANT_HI = (228, 216, 198), (176, 164, 160), (255, 250, 240)
SHOE, SHOE_SH, SOLE = (246, 246, 242), (190, 192, 206), (222, 224, 234)
LIGHT = (-0.7, -0.6)
AO = (70, 30, 60)                                            # colour of soft contact shadows


def inter(a, b):
    try: return skia.Op(a, b, skia.PathOp.kIntersect_PathOp) or skia.Path()
    except RuntimeError: return skia.Path()


def rounded(path, r):
    """the same shape with every corner rounded off, so joined pieces read as one piece of cloth"""
    p = skia.Paint(AntiAlias=True, PathEffect=skia.CornerPathEffect.Make(r)); dst = skia.Path()
    return dst if p.getFillPath(path, dst) and not dst.isEmpty() else path


def soft(c, path, clip, a=90, r=10, off=(6, 8)):
    """a soft contact shadow of `path` falling on `clip`"""
    c.save(); c.clipPath(clip, skia.ClipOp.kIntersect, True)
    q = skia.Path(path); q.offset(*off); c.drawPath(q, P(AO, a, MaskFilter=blur(r))); c.restore()


def front_details(c, T, wst, hemc, top, cfg, d):
    """the open front of a jacket or cardigan (the shirt underneath shows), or the closed front of a belted coat"""
    INN = cfg.get('inner', TEE); INN_SH = mix(INN, (90, 80, 120), 0.3)
    if top in ('jacket', 'cardigan'):
        hw = 21 if top == 'jacket' else 30
        pl = skia.Path(); pl.addPoly([skia.Point(*T(-hw + 2, 50)), skia.Point(*T(hw - 2, 50)), skia.Point(hemc[0] + hw + 12, hemc[1] + 10), skia.Point(hemc[0] - hw - 12, hemc[1] + 10)], True)
        c.drawPath(pl, P(INN))
        c.save(); c.clipPath(pl, skia.ClipOp.kIntersect, True)
        a_, b_ = T(-hw + 2, 50), (hemc[0] - hw - 12, hemc[1] + 10)
        c.drawLine(a_[0] + 4, a_[1], b_[0] + 4, b_[1], SP(AO, 16, 85, MaskFilter=blur(5)))                      # the jacket's edge shades the shirt
        c.drawPath(smooth_closed([T(4, 50), T(hw + 6, 50), (hemc[0] + hw + 20, hemc[1] + 12), (hemc[0] + 8, hemc[1] + 12)]), P(INN_SH, 110, MaskFilter=blur(8)))
        for v in (-70, -128): p0 = T(-12, v); p1 = T(0, v - 8); p2 = T(13, v - 2); stroke(c, [p0, p1, p2], 2.4, INN_SH, 150)
        c.restore()
        for sd in (-1, 1):
            a_, b_ = T(sd * (hw - 2), 50), (hemc[0] + sd * (hw + 12), hemc[1] + 10)
            if top == 'cardigan':                            # a ribbed band down each front edge
                c.drawLine(a_[0] + sd * 9, a_[1], b_[0] + sd * 9, b_[1], SP(mix(TOP, TOP_HI, 0.3), 17)); c.drawLine(a_[0] + sd * 18, a_[1], b_[0] + sd * 18, b_[1], SP(TOP_SH, 2.2, 190))
            c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(TOP_SH, 3, 235))
        if top == 'jacket':
            for v in (-36, -92, -148, -204): q_ = T(hw + 12, v); c.drawCircle(q_[0], q_[1], 5.4, P(mix(TOP_HI, (255, 255, 255), 0.2))); c.drawCircle(q_[0] + 1, q_[1] + 1.2, 5.4, SP(TOP_SH, 1.6, 200))
            pk = skia.Path(); pk.addPoly([skia.Point(*T(42, -30)), skia.Point(*T(88, -30)), skia.Point(*T(88, -86)), skia.Point(*T(42, -86))], True); pk = rounded(pk, 6)
            c.drawPath(pk, P(mix(TOP, TOP_SH, 0.16))); c.drawPath(pk, SP(TOP_SH, 2.8, 220))
            fl_ = skia.Path(); fl_.addPoly([skia.Point(*T(40, -28)), skia.Point(*T(90, -28)), skia.Point(*T(90, -48)), skia.Point(*T(40, -48))], True); fl_ = rounded(fl_, 5)
            c.drawPath(fl_, P(mix(TOP, TOP_HI, 0.14))); c.drawPath(fl_, SP(TOP_SH, 2.4, 220)); q_ = T(65, -40); c.drawCircle(q_[0], q_[1], 3.6, P(TOP_HI))
            for sd in (-1, 1):                               # a slanted hand pocket low on each side
                a_, b_ = T(sd * 58, -172), T(sd * 84, -214); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(TOP_SH, 3.4, 220))
        else:
            for v in (-120, -164, -208): q_ = T(-hw - 9, v); c.drawCircle(q_[0], q_[1], 5.5, P(mix(TOP_HI, (255, 255, 255), 0.3))); c.drawCircle(q_[0], q_[1], 5.5, SP(TOP_SH, 1.6, 200))
    else:                                                    # coat: a V of scarf at the neck, the wrap line, two rows of buttons and a belt
        vv = skia.Path(); vv.addPoly([skia.Point(*T(-24, 52)), skia.Point(*T(24, 52)), skia.Point(*T(-4, -60))], True); c.drawPath(vv, P(INN))
        c.save(); c.clipPath(vv, skia.ClipOp.kIntersect, True)
        for v in (30, 8, -14): p0 = T(-22, v); p1 = T(0, v - 9); p2 = T(22, v + 2); stroke(c, [p0, p1, p2], 2.6, INN_SH, 190)
        c.restore()
        a_, b_ = T(-4, -60), (hemc[0] + 14, hemc[1] + 10); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(TOP_SH, 3.4, 235))
        for v in (-96, -150):
            for u in (-30, 34): q_ = T(u, v); c.drawCircle(q_[0], q_[1], 6.4, P(mix(TOP_SH, (30, 20, 40), 0.35))); c.drawCircle(q_[0] - 1.4, q_[1] - 1.6, 2.2, P(TOP_HI, 200))
        BL_ = mix(TOP, TOP_SH, 0.55)
        bl = skia.Path(); bl.addPoly([skia.Point(wst[0] - 130, wst[1] - 30), skia.Point(wst[0] + 130, wst[1] - 34), skia.Point(wst[0] + 130, wst[1] - 4), skia.Point(wst[0] - 130, wst[1])], True)
        c.drawPath(bl, P(AO, 70, MaskFilter=blur(5))); c.drawPath(bl, P(BL_)); c.drawPath(bl, SP(TOP_SH, 2.4, 220))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(wst[0] - 6, wst[1] - 38, wst[0] + 30, wst[1] + 2), 6, 6), SP((226, 196, 120), 5)); c.drawLine(wst[0] + 12, wst[1] - 34, wst[0] + 12, wst[1] - 2, SP((226, 196, 120), 3.4))


def shoe(c, x, y, sx, turn, cols=None):
    """a sneaker on a foot that points outward, so it is seen partly from the side: heel under the ankle, toe out to the side.
    `turn` 0..1 is how far the foot is turned out (longer = more side on)"""
    cb_, cs_, so_ = cols or (SHOE, SHOE_SH, SOLE)
    L = 78 + 30 * turn                                      # how far the toe reaches past the ankle
    c.save(); c.translate(x, y + 4); c.scale(sx, 1)
    sole = skia.Path(); sole.addRoundRect(skia.Rect(-40, -12, L + 6, 6), 8, 8)
    up = smooth_closed([(-36, -8), (-37, -40), (-33, -70), (0, -76), (28, -70), (48, -50), (L - 26, -36), (L - 4, -26), (L + 3, -12), (L, -6), (-34, -6)])
    c.save(); c.clipRect(skia.Rect(-38, -90, L + 4, -10))
    shaded(c, up, cb_, cs_, sh=(sx * 8, 5), rimL=(255, 255, 255), rl=(-sx * 3, -3))
    c.restore()
    c.save(); c.clipPath(up, skia.ClipOp.kIntersect, True)
    stroke(c, [(L - 40, -44), (L - 34, -24), (L - 40, -4)], 3, cs_, 230)                                                          # toe cap seam
    stroke(c, [(-36, -30), (-14, -34), (-10, -74)], 2.6, cs_, 170)                                                                # heel counter
    for j in range(3):
        u = j / 2; px, py = lerp(22, L - 50, u), lerp(-68, -44, u)
        c.drawLine(px - 4, py + 10, px + 12, py - 4, SP((140, 146, 172), 3.4))
    c.restore()
    c.drawPath(sole, P(so_)); c.save(); c.clipPath(sole, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(-60, 0, L + 20, 10), P((168, 172, 196))); c.restore()
    c.restore()


UPPER, FORE = 160.0, 148.0                                   # arm bone lengths in model units


def skel(ps):
    """the shoulders of a pose in MODEL units (the same sums draw() does); screen = (x + px * s * bw, ground + py * s)"""
    sit = getattr(ps, 'sit', False)
    w = max(-1.0, min(1.0, ps.sway / 16.0)); hipc = (ps.sway, -596.0 if not sit else (-470.0 if sit == 'chair' else -116.0))
    la = math.radians(ps.lean - w * 1.6)
    chest = (hipc[0] - ps.sway * 0.55 + 214 * math.sin(la), hipc[1] - 214 * math.cos(la) - 3.0 * ps.breath)
    up = (math.sin(la), -math.cos(la)); rt = (math.cos(la), math.sin(la))
    T = lambda u, v: (chest[0] + rt[0] * u + up[0] * v, chest[1] + rt[1] * u + up[1] * v)
    shr = -w * 5.0
    return dict(r=T(-97, -4 + ps.sh_r - shr), l=T(97, -4 + shr), T=T, hipc=hipc, chest=chest)


def arm_pts(ps, key):
    """elbow, wrist and the hand's frame for one arm of a pose, in MODEL units: dict(sh, el, wr, hw, ang, ts, hs, nar)"""
    side = 1 if key == 'l' else -1; sh = skel(ps)[key]
    a_up, a_fore, a_wr = (ps.l_up, ps.l_fore, ps.l_wrist) if key == 'l' else (ps.r_up, ps.r_fore, ps.r_wrist)
    fz = getattr(ps, key + '_fz', 0.0)
    a1 = math.radians(a_up); d1 = (side * math.sin(a1), math.cos(a1)); el = (sh[0] + d1[0] * UPPER, sh[1] + d1[1] * UPPER)
    a2 = math.radians(a_up + a_fore); d2 = (side * math.sin(a2), math.cos(a2)); FL = FORE * (1 - 0.66 * fz); gz = 1 + 0.2 * fz
    wr = (el[0] + d2[0] * FL, el[1] + d2[1] * FL)
    a3 = math.radians(getattr(ps, key + '_hang', lerp(a_up + a_fore + a_wr, 24, 0.8 * fz))); d3 = (side * math.sin(a3), math.cos(a3))
    ts = side if d3[1] > 0 else -side; ts = getattr(ps, key + '_ts', ts)
    pose = ps.l_hand if key == 'l' else ps.r_hand
    nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (pose['curls'][2] - 0.05) / 0.5)))
    return dict(sh=sh, el=el, wr=wr, hw=(wr[0] + d2[0] * 6, wr[1] + d2[1] * 6), ang=math.atan2(d3[1], d3[0]), ts=ts, hs=1.22 * gz, nar=nar)


def hand_pt(ps, key, u, v):
    """a point given in the hand's own frame (u along the fingers from the wrist, v across toward the thumb), in MODEL units"""
    A = arm_pts(ps, key); ca, sa = math.cos(A['ang']), math.sin(A['ang'])
    return (A['hw'][0] + A['hs'] * (u * ca - v * A['nar'] * A['ts'] * sa), A['hw'][1] + A['hs'] * (u * sa + v * A['nar'] * A['ts'] * ca))


def draw(c, ps, x=540, ground=1670, s=1.1, t=0.0, cl=None):
    cfg = getattr(ps, 'cfg', {}); bw = cfg.get('bw', 1.0); top = cfg.get('top', 'sweat'); bottom = cfg.get('bottom', 'chinos'); sit = getattr(ps, 'sit', False)
    G_TOP = (globals()['TOP'], globals()['TOP_SH'], globals()['TOP_HI'])
    TOP, TOP_SH, TOP_HI = (SKIN, SKIN_SH, SKIN_HI) if top == 'tank' else G_TOP
    AW = cfg.get('armw', 1.0); WA = cfg.get('wristw', 1.0); ROLL = bool(cfg.get('rolled'))
    cl = cl or dict(lift=smooth((ps.r_up - 12) / 68.0), swing_u=0.0, swing_f=0.0, slide=0.0, hemdx=0.0)
    c.save(); c.translate(x, ground); c.scale(s * bw, s)
    d = (LIGHT[0] * 9, LIGHT[1] * 9)
    br = 3.0 * ps.breath
    # ---------------- skeleton. Weight: sway < 0 puts the weight on his right leg (screen left)
    w = max(-1.0, min(1.0, ps.sway / 16.0))                 # -1 weight on screen left leg, +1 on screen right leg
    chair = sit == 'chair'
    hipc = (ps.sway, -596.0 if not sit else (-470.0 if chair else -116.0))             # sitting on the ground: the hips are down, the knees come up in front
    tilt = -w * 7.0                                         # hips tilt: the weighted side sits higher
    hips = {'r': (hipc[0] - 47, hipc[1] + 8 - tilt), 'l': (hipc[0] + 47, hipc[1] + 8 + tilt)}
    la = math.radians(ps.lean - w * 1.6)                    # the chest counters the hips a little
    chest = (hipc[0] - ps.sway * 0.55 + 214 * math.sin(la), hipc[1] - 214 * math.cos(la) - br)
    up = (math.sin(la), -math.cos(la)); rt = (math.cos(la), math.sin(la))
    T = lambda u, v: (chest[0] + rt[0] * u + up[0] * v, chest[1] + rt[1] * u + up[1] * v)
    shr = -w * 5.0                                          # shoulders tilt the other way from the hips
    sh_r = T(-97, -4 + ps.sh_r - shr); sh_l = T(97, -4 + shr)
    neck0 = T(0, 46)
    feet = {'r': (-62.0, 0.0), 'l': (62.0, 0.0)} if not sit else ({'r': (-80.0, 0.0), 'l': (80.0, 0.0)} if chair else {'r': (-92.0, 0.0), 'l': (92.0, 0.0)})
    c.drawOval(skia.Rect(-250, -14, 250, 30), P((6, 8, 28), 110, MaskFilter=blur(16)))
    for fx_, sx_ in ((-62, -1), (62, 1)): c.drawOval(skia.Rect(fx_ - 52 + sx_ * 30, -4, fx_ + 52 + sx_ * 30, 16), P((4, 6, 22), 150, MaskFilter=blur(5)))   # tight contact shadow under each shoe
    def draw_legs():
        # ---------------- shoes, turned out; the free foot turns a little more
        if chair:
            for k_, sx_ in (('r', -1), ('l', 1)):
                hp_ = hips[k_]; sh_ = limb((hp_[0] + sx_ * 36, hp_[1] + 140), (feet[k_][0], feet[k_][1] - 82), 90, 66, bulge=9, bu=0.32, side=sx_); hm_ = skia.Path(); hm_.addRoundRect(skia.Rect(feet[k_][0] - 35, -104, feet[k_][0] + 35, -60), 6, 6)
                shaded(c, rounded(op(sh_, hm_), 8), mix(PANT, PANT_SH, 0.35), PANT_SH, sh=(-d[0] * 1.4, -d[1] * 0.4))
        shoe(c, feet['r'][0], feet['r'][1], -1, 0.35 + 0.5 * max(0.0, w), cfg.get('shoe')); shoe(c, feet['l'][0], feet['l'][1], 1, 0.35 + 0.5 * max(0.0, -w), cfg.get('shoe'))
        # ---------------- trousers: hips and both legs as ONE shape; the free knee relaxes outward
        legs = None; knees = {}; ank = {}; ths = []
        for k, sx in (('r', -1), ('l', 1)):
            free = max(0.0, w) if k == 'r' else max(0.0, -w)
            hp = hips[k]; ft = (feet[k][0], feet[k][1] - 74)
            kx = lerp(hp[0], ft[0], 0.5) + sx * (3 + 17 * free); ky = lerp(hp[1], ft[1], 0.5) - 8 + 9 * free
            if sit: kx, ky = hp[0] + sx * 58, hp[1] - 226
            if chair: kx, ky = hp[0] + sx * 36, hp[1] + 140
            knees[k] = (kx, ky); ank[k] = ft
            th = limb(hp, (kx, ky), 104, 86, bulge=6, bu=0.3, side=-sx) if not chair else limb((hp[0], hp[1] - 6), (kx, ky), 116, 104, bulge=2, bu=0.3, side=-sx)
            shin = limb((kx, ky), (ft[0], ft[1] - 8), 86, 66, bulge=9, bu=0.32, side=sx)
            kc = skia.Path(); kc.addCircle(kx, ky, 42 if not chair else 50)
            hem = skia.Path(); hem.addRoundRect(skia.Rect(ft[0] - 35, ft[1] - 30, ft[0] + 35, ft[1] + 14), 6, 6)
            part = op(op(op(th, shin), kc), hem); ths.append(op(th, kc))
            legs = part if legs is None else op(legs, part)
        pelvis = smooth_closed([(hipc[0] - 84, hipc[1] - 10), (hipc[0] + 84, hipc[1] - 10), (hipc[0] + 94, hipc[1] + 44), (hipc[0] + 50, hipc[1] + 96), (hipc[0], hipc[1] + 72),
                                (hipc[0] - 50, hipc[1] + 96), (hipc[0] - 94, hipc[1] + 44)])
        legs = rounded(op(legs, pelvis) if not sit else legs, 10)
        if bottom == 'shorts':                                   # bare legs, hiking shorts to above the knee, thick socks
            shaded(c, legs, SKIN, SKIN_SH, sh=(-d[0] * 1.2, -d[1] * 0.4), rimL=SKIN_HI, rl=(d[0] * 0.4, d[1] * 0.4))
            ky_ = min(knees['r'][1], knees['l'][1]) - 44
            c.save()
            if sit: c.clipPath(op(ths[0], ths[1]), skia.ClipOp.kIntersect, True)
            else: c.clipRect(skia.Rect(-400, -900, 400, ky_))
            shaded(c, legs, PANT, PANT_SH, sh=(-d[0] * 1.4, -d[1] * 0.4), rimL=PANT_HI, rl=(d[0] * 0.45, d[1] * 0.45)); c.restore()
            c.save(); c.clipPath(legs, skia.ClipOp.kIntersect, True); 
            if not sit: c.drawRect(skia.Rect(-400, ky_ - 12, 400, ky_), P(PANT_SH)); c.drawRect(skia.Rect(-400, ky_, 400, ky_ + 14), P(AO, 70, MaskFilter=blur(5)))
            sk_ = cfg.get('sock', (228, 226, 220))
            if sit: c.clipPath(op(ths[0], ths[1]), skia.ClipOp.kDifference, True)
            SKH = cfg.get('sock_h', 128); c.drawRect(skia.Rect(-400, -SKH, 400, 0), P(sk_)); c.drawRect(skia.Rect(-400, -SKH, 400, -SKH + 8), P(mix(sk_, (60, 60, 80), 0.3)))
            for k, sx in (('r', -1), ('l', 1)): kx, ky = knees[k]; stroke(c, [(kx - 20, ky + 4), (kx, ky + 12), (kx + 20, ky + 4)], 3, SKIN_SH, 170)
            c.restore()
        elif bottom == 'skirt':                                  # legs in tights under a skirt
            TG = cfg.get('tights', (70, 60, 84)); shaded(c, legs, TG, mix(TG, (20, 16, 40), 0.4), sh=(-d[0] * 1.2, -d[1] * 0.4), rimL=mix(TG, (255, 255, 255), 0.3), rl=(d[0] * 0.4, d[1] * 0.4))
        else:
            shaded(c, legs, PANT, PANT_SH, sh=(-d[0] * 1.4, -d[1] * 0.4), rimL=PANT_HI, rl=(d[0] * 0.45, d[1] * 0.45))
        c.save(); c.clipPath(legs, skia.ClipOp.kIntersect, True)
        L0 = min(1.0, max(0.0, cl['lift'])); hs_ = skia.Path(); hs_.addPoly([skia.Point(hipc[0] - 130, hipc[1] - 60), skia.Point(hipc[0] + 130, hipc[1] - 60), skia.Point(hipc[0] + 130, hipc[1] + 52 - 4 * L0), skia.Point(hipc[0], hipc[1] + 56 - 15 * L0), skia.Point(hipc[0] - 130, hipc[1] + 52 - 30 * L0)], True)
        if not sit: c.drawPath(hs_, P(AO, 80, MaskFilter=blur(8)))                       # the sweatshirt's shadow on the trousers
        if not sit and bottom != 'skirt': stroke(c, [(hipc[0], hipc[1] + 24), (hipc[0] + 2, hipc[1] + 62), (hipc[0], hipc[1] + 100)], 3.6, PANT_SH, 210)
        for k, sx in ((('r', -1), ('l', 1)) if bottom not in ('shorts', 'skirt') else ()):
            kx, ky = knees[k]; hp = hips[k]; ft = ank[k]
            if bottom == 'cargo':
                cg = skia.Path(); cg.addRoundRect(skia.Rect(kx + sx * 4 - 30, ky - 96, kx + sx * 4 + 30, ky - 30), 5, 5); c.drawPath(cg, P(mix(PANT, PANT_SH, 0.25))); c.drawPath(cg, SP(PANT_SH, 3, 230)); c.drawLine(kx + sx * 4 - 30, ky - 78, kx + sx * 4 + 30, ky - 78, SP(PANT_SH, 3, 230))
            if chair:
                c.drawPath(smooth_closed([(hp[0] - 40, hp[1] + 6), (hp[0] + 40, hp[1] + 6), (kx + 44, ky - 22), (kx - 44, ky - 22)]), P(PANT_HI, 70, MaskFilter=blur(10))); stroke(c, [(kx - 40, ky + 34), (kx, ky + 46), (kx + 40, ky + 34)], 4, PANT_SH, 170); stroke(c, [(ft[0] - 30, ft[1] - 30), (ft[0] - 4, ft[1] - 20), (ft[0] + 28, ft[1] - 34)], 3, PANT_SH, 150)
                continue
            stroke(c, [(hp[0] + sx * 4, hp[1] + 70), (kx + sx * 2, ky), (ft[0] + sx * 2, ft[1] - 10)], 2.2, PANT_SH, 70)                          # the pressed crease
            stroke(c, [(kx - 30, ky - 6), (kx - 4, ky + 6), (kx + 26, ky - 8)], 3.6, PANT_SH, 150)
            stroke(c, [(hp[0] + sx * 50, hp[1] + 14), (hp[0] + sx * 14, hp[1] + 46), (hp[0] - sx * 26, hp[1] + 40)], 3.6, PANT_SH, 130)
            stroke(c, [(ft[0] - 30, ft[1] - 30), (ft[0] - 4, ft[1] - 20), (ft[0] + 28, ft[1] - 34)], 3, PANT_SH, 150)                          # the break over the shoe
            stroke(c, [(ft[0] - 26, ft[1] - 52), (ft[0], ft[1] - 44), (ft[0] + 22, ft[1] - 54)], 2.6, PANT_SH, 100)
            stroke(c, [(hp[0] + sx * 24, hp[1] + 20), (hp[0] + sx * 44, hp[1] + 30), (hp[0] + sx * 50, hp[1] + 52)], 3, PANT_SH, 170)               # slanted pocket
            stroke(c, [(hipc[0] + sx * 6, hipc[1] + 78), (hipc[0] + sx * 26, hipc[1] + 70), (hipc[0] + sx * 44, hipc[1] + 74)], 2.6, PANT_SH, 120)      # pull lines at the crotch
            cuffb = skia.Path(); cuffb.addRoundRect(skia.Rect(ft[0] - 37, ft[1] - 6, ft[0] + 37, ft[1] + 15), 5, 5)                                # the turned up cuff
            c.drawPath(cuffb, P(mix(PANT, PANT_SH, 0.2))); c.drawLine(ft[0] - 33, ft[1] - 6, ft[0] + 33, ft[1] - 6, SP(PANT_SH, 2.6, 220)); c.drawLine(ft[0] - 30, ft[1] + 13, ft[0] + 30, ft[1] + 13, SP(PANT_SH, 2, 130))
        c.restore()
    if not sit: draw_legs()
    # ---------------- arm geometry (forward kinematics)
    def arm_geo(sh, side, a_up, a_fore, a_wrist, swing_u=0.0, swing_f=0.0, slide=0.0, fz=0.0):
        a1 = math.radians(a_up); d1 = (side * math.sin(a1), math.cos(a1))
        el = (sh[0] + d1[0] * 160, sh[1] + d1[1] * 160)
        a2 = math.radians(a_up + a_fore); d2 = (side * math.sin(a2), math.cos(a2))
        FL = 148 * (1 - 0.66 * fz); gz = 1 + 0.2 * fz          # forearm length on screen, and how much nearer (bigger) it looks
        wr = (el[0] + d2[0] * FL, el[1] + d2[1] * FL)
        a3 = math.radians(getattr(ps, ('l' if side > 0 else 'r') + '_hang', lerp(a_up + a_fore + a_wrist, 24, 0.8 * fz))); d3 = (side * math.sin(a3), math.cos(a3))   # with the forearm coming forward the hand hangs from a loose wrist
        se = (wr[0] - d2[0] * 20 * slide, wr[1] - d2[1] * 20 * slide)                       # the sleeve's end: it slips toward the elbow when the forearm points up
        upa = limb((sh[0] - side * 4, sh[1] + 12), el, 78 * AW, 62 * AW, bulge=6, bu=0.3, side=side)
        fore = limb(el, (se[0] - d2[0] * 14 * (1 - fz), se[1] - d2[1] * 14 * (1 - fz)), (64 + 5 * slide) * (1 + 0.06 * fz) * AW, (56 + 3 * slide) * gz * AW, bulge=6, bu=0.25, side=-side) if (top != 'tank' and not ROLL) else limb(el, (wr[0] + d2[0] * 4, wr[1] + d2[1] * 4), 60 * AW, 44 * WA * gz, bulge=5, bu=0.3, side=-side)
        ec = skia.Path(); ec.addCircle(el[0], el[1], (30 + 3 * slide) * AW)
        k = smooth((a_up - 12) / 68.0)                       # how far the arm is lifted away from the body
        n = (-d1[1], d1[0])
        if n[0] * -side + n[1] < 0: n = (-n[0], -n[1])       # the underside of the upper arm, facing the body
        path = op(op(upa, fore), ec); upath = op(upa, ec); fpath = op(fore, ec)
        # loose cloth: it hangs below the arm by its own weight, and it trails the arm when the arm moves fast
        bu_ = max(0.0, 20 * max(0.0, n[1]) + max(-12.0, min(20.0, -swing_u * 0.6)))
        if bu_ > 1:
            b0 = (sh[0] + d1[0] * 44 + n[0] * 30, sh[1] + d1[1] * 44 + n[1] * 30); b1 = (el[0] + n[0] * 26, el[1] + n[1] * 26)
            ct = ((b0[0] + b1[0]) / 2 + n[0] * bu_ * 1.2 + d1[0] * 14, (b0[1] + b1[1]) / 2 + n[1] * bu_ * 1.2 + bu_ * 0.8 + d1[1] * 14)
            g = skia.Path(); g.moveTo(*b0); g.quadTo(ct[0], ct[1], b1[0], b1[1]); g.lineTo(*el); g.lineTo(sh[0] + d1[0] * 44, sh[1] + d1[1] * 44); g.close(); path = op(path, g); upath = op(upath, g)
        n2 = (-d2[1], d2[0])
        if n2[1] < 0: n2 = (-n2[0], -n2[1])                  # the forearm's lower side
        bf = max(0.0, 13 * n2[1] + max(-10.0, min(16.0, -swing_f * 0.5)))
        if bf > 1:
            bf *= (1 - fz)
        if bf > 1:
            f0 = (el[0] + d2[0] * 16 + n2[0] * 26, el[1] + d2[1] * 16 + n2[1] * 26); f1 = (se[0] - d2[0] * 30 + n2[0] * 22, se[1] - d2[1] * 30 + n2[1] * 22)
            ct = ((f0[0] + f1[0]) / 2 + n2[0] * bf * 1.2 + d2[0] * 10, (f0[1] + f1[1]) / 2 + n2[1] * bf * 1.2 + bf * 0.8 + d2[1] * 10)
            g = skia.Path(); g.moveTo(*f0); g.quadTo(ct[0], ct[1], f1[0], f1[1]); g.lineTo(se[0] - d2[0] * 30, se[1] - d2[1] * 30); g.lineTo(el[0] + d2[0] * 16, el[1] + d2[1] * 16); g.close(); path = op(path, g); fpath = op(fpath, g)
        return dict(el=el, wr=wr, se=se, d1=d1, n=n, k=k, sh=sh, d2=d2, d3=d3, path=path, upath=upath, fpath=fpath, side=side, bend=abs(a_fore), slide=slide, gz=gz, fz=fz)
    AR = arm_geo(sh_r, -1, ps.r_up, ps.r_fore, ps.r_wrist, cl['swing_u'], cl['swing_f'], cl['slide'], getattr(ps, 'r_fz', 0.0)); AL = arm_geo(sh_l, 1, ps.l_up, ps.l_fore, ps.l_wrist, fz=getattr(ps, 'l_fz', 0.0))
    ps._dbg = {'l': (AL['el'], AL['wr']), 'r': (AR['el'], AR['wr'])}   # what was drawn, for the gate checks
    front = getattr(ps, 'front', ())                        # arms whose forearm is held IN FRONT of the body (drawn over the chest, with the hand and what it holds)
    AL['front'] = 'l' in front; AR['front'] = 'r' in front; AL['key'] = 'l'; AR['key'] = 'r'
    for A_ in (AL, AR):
        if A_['front'] or ROLL: A_['path'] = A_['upath']
    ps._T = T; ps._hips = hips
    def wrist_skin(A_):
        wr, d2 = A_['wr'], A_['d2']
        if ROLL:                                             # a bare forearm from the rolled sleeve to the wrist, one shape with the wrist
            fp_ = rounded(A_['fpath'], 12)
            shaded(c, fp_, SKIN, SKIN_SH, sh=(-d[0] * 0.9, -d[1] * 0.4), rimL=SKIN_HI, rl=(d[0] * 0.4, d[1] * 0.4)); return
        fa = limb((wr[0] - d2[0] * 46 * (1 - A_['fz']), wr[1] - d2[1] * 46 * (1 - A_['fz'])), (wr[0] + d2[0] * 6, wr[1] + d2[1] * 6), 46 * A_['gz'] * WA, 42 * A_['gz'] * WA)
        shaded(c, fa, SKIN, SKIN_SH, sh=(-d[0] * 0.8, -d[1] * 0.4), rimL=SKIN_HI, rl=(d[0] * 0.4, d[1] * 0.4))
    def draw_hand(A_, pose, palm):
        ang = math.atan2(A_['d3'][1], A_['d3'][0]); hw = (A_['wr'][0] + A_['d2'][0] * 6, A_['wr'][1] + A_['d2'][1] * 6)
        ts = A_['side'] if A_['d3'][1] > 0 else -A_['side']
        ts = getattr(ps, A_['key'] + '_ts', ts)
        nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (pose['curls'][2] - 0.05) / 0.5)))
        item = getattr(ps, A_['key'] + '_item', None)
        if item: item(c, hw, ang, ts, 1.22 * A_['gz'], nar)    # what the hand holds is drawn first: the fingers lie over it
        H.hand(c, hw, ang, ts, 1.22 * A_['gz'], skin=SKIN, shade=SKIN_SH, hi=SKIN_HI, light=LIGHT, palm=palm, narrow=nar, **pose)
        over = getattr(ps, A_['key'] + '_item_over', None)     # the part of a held thing that lies on top of the hand (a pencil's shaft over the web of the thumb)
        if over: over(c, hw, ang, ts, 1.22 * A_['gz'], nar)
    if not sit and bottom == 'skirt':                        # an A line skirt to just below the knee
        wx, wy = hipc[0], hipc[1] + 6; SL = cfg.get('skirt_len', 300)
        sk = skia.Path(); sk.moveTo(wx - 96, wy - 6); sk.lineTo(wx + 96, wy - 6); sk.lineTo(wx + 124, wy + SL - 4); sk.quadTo(wx, wy + SL + 16, wx - 124, wy + SL - 4); sk.close(); sk = rounded(sk, 10)
        q_ = skia.Path(sk); q_.offset(0, 9); c.drawPath(q_, P(AO, 80, MaskFilter=blur(6)))
        shaded(c, sk, PANT, PANT_SH, sh=(-d[0] * 1.6, -d[1] * 0.3), rimL=PANT_HI, rl=(d[0] * 0.45, d[1] * 0.3))
        c.save(); c.clipPath(sk, skia.ClipOp.kIntersect, True)
        for xx in (-62, -18, 30, 70): stroke(c, [(wx + xx * 0.7, wy + 40), (wx + xx * 0.9, wy + 160), (wx + xx * 1.1, wy + SL + 6)], 3, PANT_SH, 130)
        c.drawPath(smooth_closed([(wx + 30, wy), (wx + 110, wy), (wx + 140, wy + SL + 20), (wx + 44, wy + SL + 20)]), P(PANT_SH, 70, MaskFilter=blur(14)))
        c.restore()
    if not sit and top == 'coat':                            # the skirt of a long coat, down to the knee; the body of the coat is drawn with the torso
        wx, wy = hipc[0], hipc[1] + 6; CLN = cfg.get('coat_len', 236)
        sk = skia.Path(); sk.moveTo(wx - 98, wy - 30); sk.lineTo(wx + 98, wy - 30); sk.lineTo(wx + 116, wy + CLN - 4); sk.quadTo(wx, wy + CLN + 12, wx - 116, wy + CLN - 4); sk.close(); sk = rounded(sk, 10)
        q_ = skia.Path(sk); q_.offset(0, 9); c.drawPath(q_, P(AO, 90, MaskFilter=blur(6)))
        shaded(c, sk, TOP, TOP_SH, sh=(-d[0] * 1.6, -d[1] * 0.3), rimL=TOP_HI, rl=(d[0] * 0.5, d[1] * 0.3))
        c.save(); c.clipPath(sk, skia.ClipOp.kIntersect, True)
        c.drawPath(smooth_closed([(wx + 34, wy - 30), (wx + 110, wy - 30), (wx + 130, wy + CLN + 20), (wx + 44, wy + CLN + 20)]), P(TOP_SH, 78, MaskFilter=blur(16)))
        stroke(c, [(wx + 14, wy - 20), (wx + 16, wy + 110), (wx + 20, wy + CLN + 6)], 3.4, TOP_SH, 230)          # the front edge of the wrap
        stroke(c, [(wx - 60, wy + 50), (wx - 66, wy + 150), (wx - 74, wy + CLN)], 3, TOP_SH, 110); stroke(c, [(wx + 66, wy + 60), (wx + 72, wy + 150), (wx + 80, wy + CLN)], 3, TOP_SH, 110)
        c.restore()
    for A_ in (AL, AR):
        if not A_['front']: wrist_skin(A_)
    for A_, pose, palm in ((AL, ps.l_hand, getattr(ps, 'l_palm', False)), (AR, ps.r_hand, ps.r_palm)):
        if not A_['front']: draw_hand(A_, pose, palm)
    # ---------------- neck and the tee collar
    head_c = (neck0[0] + ps.head_x + up[0] * 96, neck0[1] + up[1] * 96)
    if top == 'rain':
        hood = smooth_closed([T(-84, 36), T(-78, 92), T(-44, 122), T(0, 130), T(44, 122), T(78, 92), T(84, 36), T(0, 14)])
        shaded(c, hood, mix(TOP, TOP_SH, 0.55), TOP_SH, sh=(-d[0] * 1.2, -d[1] * 0.5), rimL=TOP_HI, rl=(d[0] * 0.4, d[1] * 0.4))
    nk = smooth_closed([T(-34, 22), T(-29, 80), (head_c[0] - 28, head_c[1] + 44), (head_c[0] + 28, head_c[1] + 44), T(29, 80), T(34, 22), T(0, 12)])
    shaded(c, nk, mix(SKIN, SKIN_SH, 0.22), SKIN_SH, sh=(-d[0] * 1.5, 0))
    c.save(); c.clipPath(nk, skia.ClipOp.kIntersect, True)
    c.drawOval(skia.Rect(head_c[0] - 54, head_c[1] + 34, head_c[0] + 54, head_c[1] + 92), P(AO, 110, MaskFilter=blur(9)))               # the jaw's shadow on the neck
    c.restore()
    c.drawPath(smooth_closed([T(-40, 44), T(0, 30), T(40, 44), T(34, 22), T(0, 8), T(-34, 22)]), P(cfg.get('inner', TEE)))
    # ---------------- sweatshirt: body and both sleeves as ONE silhouette
    wst = (hipc[0], hipc[1] + 6)
    dr = ps.sh_r - shr; dl = shr
    kr, kl = AR['k'], AL['k']
    # When an arm lifts, the shoulder of the shirt goes with it: the body's own shoulder bump tucks in to the chest,
    # the cloth pulls tight from the sleeve's underside down to the side seam, and the hem rides up a little on that side.
    def shp(side, k, dv):
        SHW = 0.9 if top == 'tank' else 1.0; a = T(side * lerp(128, 98, k) * SHW, 2 + dv + 8 * k); b = T(side * lerp(134, 92, k) * SHW, lerp(-30, -58, k) + dv * 0.5)
        return a, b
    ar_a, ar_b = shp(-1, kr, dr); al_a, al_b = shp(1, kl, dl)
    L = cl['lift']; hx = max(-10.0, min(10.0, cl['hemdx']))
    hr, hc, hl = -30 * L, -15 * L, -4 * L                    # the hem rides up on the lifted side, a beat behind the arm
    torso = smooth_closed([T(-44, 54), T(-74, 46 + dr * 0.5), T(-104, 28 + dr), ar_a, ar_b, T(-94, -92), (wst[0] - 91 + hx * 0.3, wst[1] - 92 + hr * 0.5), (wst[0] - 98 + hx * 0.7, wst[1] - 34 + hr),
                           (wst[0] - 106 + hx, wst[1] - 6 + hr), (wst[0] - 101 + hx, wst[1] + 6 + hr), (wst[0] - 101 + hx, wst[1] + 32 + hr), (wst[0] + hx, wst[1] + 37 + hc), (wst[0] + 101 + hx, wst[1] + 32 + hl), (wst[0] + 101 + hx, wst[1] + 6 + hl),
                           (wst[0] + 106 + hx + 5 * L, wst[1] - 6 + hl), (wst[0] + 98 + hx * 0.7 + 4 * L, wst[1] - 34 + hl), (wst[0] + 91 + hx * 0.3, wst[1] - 92 + hl * 0.3), T(94, -92), al_b, al_a, T(104, 28 + dl), T(74, 46 + dl * 0.5),
                           T(44, 54), T(0, 34)])
    gussets = []
    for A_ in (AL, AR):
        k = A_['k']
        if k < 0.03: continue
        sd, sh, d1, n = A_['side'], A_['sh'], A_['d1'], A_['n']
        reach = 26 + 78 * k
        a = (sh[0] + d1[0] * reach + n[0] * 32, sh[1] + d1[1] * reach + n[1] * 32)                # on the sleeve's underside
        dpt = T(sd * 92, -96 - 62 * k)                                                             # on the side seam
        inner = T(sd * 70, -30)
        ctl = (lerp((a[0] + dpt[0]) / 2, inner[0], 0.42), lerp((a[1] + dpt[1]) / 2, inner[1], 0.42))
        g = skia.Path(); g.moveTo(*a); g.quadTo(ctl[0], ctl[1], dpt[0], dpt[1]); g.lineTo(*T(sd * 60, -96 - 62 * k)); g.lineTo(*inner); g.lineTo(sh[0], sh[1]); g.close()
        gussets.append(g)
    whole = op(op(torso, AL['path']), AR['path'])
    for A_ in (AL, AR):                                     # a yoke from the neck to the top of each sleeve, so the shoulder line is one clean slope
        sd, sh, d1, n = A_['side'], A_['sh'], A_['d1'], A_['n']
        y = skia.Path(); y.addPoly([skia.Point(*T(sd * 42, 52)), skia.Point(sh[0] - n[0] * 37 * AW + d1[0] * 8, sh[1] - n[1] * 37 * AW + d1[1] * 8), skia.Point(sh[0] - n[0] * 34 * AW + d1[0] * 70, sh[1] - n[1] * 34 * AW + d1[1] * 70),
                                    skia.Point(sh[0] + d1[0] * 70, sh[1] + d1[1] * 70), skia.Point(*T(sd * 40, 0))], True)
        whole = op(whole, y)
    for g in gussets: whole = op(whole, g)
    whole = rounded(whole, 22)
    if top == 'tank': whole = rounded(whole, 40)
    shaded(c, whole, TOP, TOP_SH, sh=((-d[0] * 1.6, -d[1] * 0.6) if top != 'tank' else (-d[0] * 0.75, -d[1] * 0.3)), rimL=TOP_HI, rl=(d[0] * 0.5, d[1] * 0.5))
    if cfg.get('plaid'):
        c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True); PL = cfg['plaid']
        for j in range(-9, 10):
            a_, b_ = T(j * 34, 90), T(j * 34, -420); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(PL, 15, 120))
        for j in range(-12, 4):
            a_, b_ = T(-330, j * 34), T(330, j * 34); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(PL, 15, 120))
        c.restore()
    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)   # soft form on top of the flat shading: the chest turns away from the light, the near shoulder catches it
    c.drawPath(smooth_closed([T(34, 44), T(126, 16), (wst[0] + 118, wst[1] + 44), (wst[0] + 34, wst[1] + 44), T(52, -96)]), P(TOP_SH, 78, MaskFilter=blur(16)))
    c.drawOval(skia.Rect(T(-58, 0)[0] - 56, T(-58, 0)[1] - 34, T(-58, 0)[0] + 56, T(-58, 0)[1] + 90), P(TOP_HI, 44, MaskFilter=blur(22)))
    c.drawOval(skia.Rect(neck0[0] - 62, neck0[1] - 6, neck0[0] + 62, neck0[1] + 46), P(AO, 60, MaskFilter=blur(10)))                # the head's shadow on the chest
    for A_ in (AL, AR):                                     # the underside of each sleeve sits in shadow
        q = skia.Path(A_['path']); q.offset(-A_['n'][0] * 22, -A_['n'][1] * 22)
        c.save(); c.clipPath(A_['path'], skia.ClipOp.kIntersect, True); c.drawPath(diffp(A_['path'], (-A_['n'][0] * 16, -A_['n'][1] * 16)), P(TOP_SH, 70, MaskFilter=blur(7))); c.restore()
    c.restore()
    if cfg.get('vest'):                                      # a hi vis vest over the uniform, reflective bands, a radio mic on one strap
        VC = cfg['vest']; VS = mix(VC, (60, 70, 20), 0.35); SV, SVD = (226, 232, 242), (150, 160, 184)
        vest = skia.Path(); vest.addPoly([skia.Point(*T(-98, 44)), skia.Point(*T(-46, 62)), skia.Point(*T(0, -40)), skia.Point(*T(46, 62)), skia.Point(*T(98, 44)), skia.Point(*T(118, -70)), skia.Point(wst[0] + 130, wst[1] + 60),
                                          skia.Point(wst[0] - 130, wst[1] + 60), skia.Point(*T(-118, -70))], True)
        c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True); c.clipPath(vest, skia.ClipOp.kIntersect, True)
        c.drawPaint(P(VC)); c.drawPath(smooth_closed([T(40, 60), T(130, 20), (wst[0] + 130, wst[1] + 60), (wst[0] + 40, wst[1] + 60), T(56, -90)]), P(VS, 150, MaskFilter=blur(14)))
        for sd in (-1, 1):
            st_ = skia.Path(); st_.addPoly([skia.Point(*T(sd * 56, 60)), skia.Point(*T(sd * 82, 52)), skia.Point(*T(sd * 78, -130)), skia.Point(*T(sd * 52, -130))], True); c.drawPath(st_, P(SV)); c.drawPath(st_, SP(SVD, 2.5))
        bd = skia.Path(); bd.addPoly([skia.Point(*T(-150, -130)), skia.Point(*T(150, -130)), skia.Point(*T(150, -160)), skia.Point(*T(-150, -160))], True); c.drawPath(bd, P(SV)); c.drawPath(bd, SP(SVD, 2.5))
        p0 = T(0, -40); c.drawLine(p0[0], p0[1], wst[0] + hx, wst[1] + 40, SP(VS, 4))
        q_ = T(66, 4); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(q_[0] - 14, q_[1] - 4, q_[0] + 14, q_[1] + 40), 6, 6), P((30, 32, 46))); c.drawCircle(q_[0], q_[1] + 12, 6, P((90, 96, 120)))
        c.restore()
        c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True); c.drawPath(vest, SP(VS, 4)); c.restore()
    # the arms hang BESIDE the body, so the only mark where a sleeve meets it is a short crease running down from the armpit
    for A_ in (AL, AR):
        sd = A_['side']; sh = sh_l if sd > 0 else sh_r
        c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True)
        c.clipRect(skia.Rect(sh[0] - 400, sh[1] + 78, sh[0] + 400, sh[1] + 172))
        c.drawPath(A_['path'], SP(mix(TOP, TOP_SH, 0.8), 2.8, 200))
        c.restore()
    if top == 'tank':
        tk_ = smooth_closed([T(-64, 56), T(-36, 56), T(-22, 20), T(0, 2), T(22, 20), T(36, 56), T(64, 56), T(76, 6), T(82, -44), T(102, -96), (wst[0] + 140, wst[1] - 40), (wst[0] + 140, wst[1] + 70), (wst[0] - 140, wst[1] + 70), (wst[0] - 140, wst[1] - 40), T(-102, -96), T(-82, -44), T(-76, 6)])
        tank = rounded(inter(torso, tk_), 6)
        q_ = skia.Path(tank); q_.offset(0, 5); c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True); c.drawPath(q_, P(AO, 60, MaskFilter=blur(4))); c.restore()
        shaded(c, tank, G_TOP[0], G_TOP[1], sh=(-d[0] * 1.6, -d[1] * 0.6), rimL=G_TOP[2], rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(tank, skia.ClipOp.kIntersect, True)
        c.drawPath(smooth_closed([T(34, 44), T(126, 16), (wst[0] + 118, wst[1] + 44), (wst[0] + 34, wst[1] + 44), T(52, -96)]), P(G_TOP[1], 90, MaskFilter=blur(16)))
        stroke(c, [T(-36, 54), T(-22, 20), T(0, 2), T(22, 20), T(36, 54)], 4, G_TOP[1], 210)
        for sd in (-1, 1): stroke(c, [T(sd * 64, 54), T(sd * 76, 6), T(sd * 82, -44), T(sd * 100, -92)], 3.6, G_TOP[1], 200)
        stroke(c, [(wst[0] - 60, wst[1] - 50), (wst[0] - 20, wst[1] - 38), (wst[0] + 30, wst[1] - 46)], 3, G_TOP[1], 120); stroke(c, [(wst[0] - 100, wst[1] + 24), (wst[0], wst[1] + 29), (wst[0] + 100, wst[1] + 24)], 3, G_TOP[1], 170)
        c.restore()
    if cfg.get('whistle') and not getattr(ps, 'whistle_mouth', False):
        WY, WY_SH, MET, MET_SH = (250, 204, 70), (196, 140, 50), (226, 232, 240), (150, 160, 186)
        wp = T(0, -66 if top == 'tank' else -60)
        for sd in (-1, 1):
            a_ = T(sd * 33, 50); stroke(c, [a_, ((a_[0] + wp[0]) / 2 + sd * 6, (a_[1] + wp[1]) / 2), wp], 5, WY_SH); stroke(c, [a_, ((a_[0] + wp[0]) / 2 + sd * 6, (a_[1] + wp[1]) / 2), wp], 2.8, WY)
        wb = skia.Path(); wb.addRoundRect(skia.Rect(wp[0] - 10, wp[1] - 2, wp[0] + 10, wp[1] + 30), 7, 7)
        c.drawPath(wb, P(AO, 90, MaskFilter=blur(4))); c.drawPath(wb, P(MET)); c.drawPath(diffp(wb, (-3, -3)), P(MET_SH)); c.drawRect(skia.Rect(wp[0] - 5, wp[1] + 6, wp[0] + 5, wp[1] + 12), P((40, 44, 70)))
    c.save(); c.clipPath(inter(torso, whole), skia.ClipOp.kIntersect, True)
    zc = mix(TOP_SH, (16, 16, 40), 0.45); hemc = (wst[0] + hx, wst[1] + 36 + hc)
    if top == 'rain':                                        # zip, storm flap and two zipped pockets
        p0 = T(0, 30); c.drawLine(p0[0] - 7, p0[1], hemc[0] - 7, hemc[1], SP(TOP_HI, 3, 130)); c.drawLine(p0[0], p0[1], hemc[0], hemc[1], SP(zc, 5))
        for sd in (-1, 1):
            a_, b_ = T(sd * 30, -150), T(sd * 62, -196); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(zc, 4.5)); c.drawLine(a_[0] + 4, a_[1] + 3, b_[0] + 4, b_[1] + 3, SP(TOP_HI, 2, 120))
    elif top == 'uniform':                                   # button placket and two chest pockets with flaps
        p0 = T(0, 30); c.drawLine(p0[0], p0[1], hemc[0], hemc[1], SP(TOP_SH, 3.5, 230)); c.drawLine(p0[0] + 12, p0[1], hemc[0] + 12, hemc[1], SP(TOP_SH, 2, 130))
        for v in (0, -44, -88, -132, -176): q_ = T(6, v); c.drawCircle(q_[0], q_[1], 4, P(TOP_HI, 230))
        for sd in (-1, 1):
            pk = skia.Path(); pk.addPoly([skia.Point(*T(sd * 30, -20)), skia.Point(*T(sd * 82, -20)), skia.Point(*T(sd * 82, -78)), skia.Point(*T(sd * 30, -78))], True); c.drawPath(pk, SP(TOP_SH, 3, 220))
            a_, b_, m_ = T(sd * 30, -20), T(sd * 82, -20), T(sd * 56, -40); fl_ = skia.Path(); fl_.addPoly([skia.Point(*a_), skia.Point(*b_), skia.Point(*m_)], True); c.drawPath(fl_, P(mix(TOP, TOP_SH, 0.4)))
    elif top in ('jacket', 'cardigan', 'coat'): front_details(c, T, wst, hemc, top, cfg, d)
    if cfg.get('straps'):                                    # a backpack: two shoulder straps and a chest strap
        SC = cfg['straps']; SCD = mix(SC, (10, 10, 30), 0.4)
        for sd in (-1, 1):
            st_ = skia.Path(); st_.addPoly([skia.Point(*T(sd * 58, 62)), skia.Point(*T(sd * 88, 52)), skia.Point(*T(sd * 92, -120)), skia.Point(*T(sd * 64, -120))], True); c.drawPath(st_, P(SC)); c.drawPath(st_, SP(SCD, 3))
        a_, b_ = T(-66, -50), T(66, -50); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(SCD, 9)); q_ = T(0, -50); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(q_[0] - 12, q_[1] - 9, q_[0] + 12, q_[1] + 9), 3, 3), P((30, 30, 44)))
    c.restore()
    c.save(); c.clipPath(whole, skia.ClipOp.kIntersect, True)
    c.save(); c.clipPath(torso, skia.ClipOp.kIntersect, True)
    hb = [(wst[0] - 107 + hx, wst[1] + 34 + hr), (wst[0] + hx, wst[1] + 39 + hc), (wst[0] + 107 + hx, wst[1] + 34 + hl)]
    def hem_at(u):
        a, b = (hb[0], hb[1]) if u < 0.5 else (hb[1], hb[2]); v = u * 2 if u < 0.5 else u * 2 - 2 + 1
        v = u * 2 if u < 0.5 else (u - 0.5) * 2
        return (lerp(a[0], b[0], v), lerp(a[1], b[1], v))
    if top in ('sweat', 'cardigan'):
        band = skia.Path(); band.moveTo(hb[0][0], hb[0][1] - 30)
        for u in (0.5, 1.0): p_ = hem_at(u); band.lineTo(p_[0], p_[1] - 30 - (3 if u == 0.5 else 0))
        for u in (1.0, 0.5, 0.0): p_ = hem_at(u); band.lineTo(p_[0], p_[1] + 8)
        band.close(); c.drawPath(band, P(TOP_SH, 110))
        for j in range(19):
            p_ = hem_at(j / 18); c.drawLine(p_[0], p_[1] - 27, p_[0], p_[1] + 6, SP(TOP_SH, 2.2, 150))
        stroke(c, [(hb[0][0] + 6, hb[0][1] - 36), (hb[1][0], hb[1][1] - 34), (hb[2][0] - 6, hb[2][1] - 36)], 5, TOP_SH, 90)
    else:                                                    # a plain hem with one line of stitching
        stroke(c, [(hb[0][0] + 6, hb[0][1] - 12), (hb[1][0], hb[1][1] - 10), (hb[2][0] - 6, hb[2][1] - 12)], 3, TOP_SH, 170)
    relax = 1 - 0.8 * min(1.0, max(0.0, L))                  # the slack folds at the waist pull flat when the cloth is stretched
    stroke(c, [(wst[0] - 80 + hx, wst[1] - 44 + hr), (wst[0] - 54 + hx, wst[1] - 24 + hr * 0.9), (wst[0] - 26 + hx, wst[1] - 30 + hr * 0.7)], 4, TOP_SH, 120 * relax)
    stroke(c, [(wst[0] + 82 + hx, wst[1] - 62 + hl), (wst[0] + 54 + hx, wst[1] - 40 + hl), (wst[0] + 30 + hx, wst[1] - 46 + hl)], 4, TOP_SH, 110)
    stroke(c, [(wst[0] - 74 + hx, wst[1] - 78 + hr), (wst[0] - 52 + hx, wst[1] - 62 + hr), (wst[0] - 34 + hx, wst[1] - 66 + hr * 0.8)], 3.2, TOP_SH, 80 * relax)
    Lc = min(1.0, max(0.0, L))
    if Lc > 0.02:                                           # long pull lines from the lifted armpit toward the far hip
        stroke(c, [T(-78, -70), (lerp(T(-78, -70)[0], wst[0] + 30, 0.5) - 14, lerp(T(-78, -70)[1], wst[1] - 40, 0.5) + 6), (wst[0] + 34 + hx, wst[1] - 44 + hl)], 3.4, TOP_SH, 105 * Lc)
        stroke(c, [T(-84, -112), (lerp(T(-84, -112)[0], wst[0], 0.5) - 14, lerp(T(-84, -112)[1], wst[1] - 16, 0.5) + 4), (wst[0] - 4 + hx, wst[1] - 22 + hc)], 3.2, TOP_SH, 90 * Lc)
        stroke(c, [T(-66, -30), T(-30, -62), T(8, -84)], 3, TOP_SH, 70 * Lc)
    if kr > 0.02:                                           # the cloth bunches on top of the lifted shoulder, beside the neck
        stroke(c, [T(-88, 34 + dr), T(-74, 22 + dr), T(-82, 4 + dr)], 3.2, TOP_SH, 150 * kr); stroke(c, [T(-66, 42 + dr), T(-56, 28 + dr), T(-62, 12 + dr)], 3, TOP_SH, 110 * kr)
    c.restore()
    c.restore(); c.save()                                   # the apron is drawn outside the shirt's clip (its skirt hangs below the hem)
    if chair: draw_legs()
    if cfg.get('apron'):                                     # a baker's apron: a bib on the chest, a neck strap, ties at the waist and a skirt to above the knees
        AC = cfg['apron']; AS = mix(AC, (80, 60, 70), 0.28); AH = mix(AC, (255, 255, 255), 0.4); AD = mix(AC, (40, 30, 50), 0.5)
        bt = -34                                             # top of the bib, below the collar
        skirt_y = wst[1] + (250 if not chair else 14)
        ap = smooth_closed([T(-50, bt), T(50, bt), T(64, bt - 20), T(70, -120), (wst[0] + 96 + hx * 0.3, wst[1] - 8), (wst[0] + 104 + hx * 0.6, skirt_y - 40),
                            (wst[0] + 98 + hx, skirt_y), (wst[0] + hx, skirt_y + 8), (wst[0] - 98 + hx, skirt_y), (wst[0] - 104 + hx * 0.6, skirt_y - 40),
                            (wst[0] - 96 + hx * 0.3, wst[1] - 8), T(-70, -120), T(-64, bt - 20)])
        for sd in (-1, 1):                                   # the neck strap: up from each top corner, round behind the neck
            a_, b_ = T(sd * 46, bt - 4), T(sd * 30, 46); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(AS, 11)); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(AC, 6))
        c.drawPath(ap, P((0, 0, 0), 60, MaskFilter=blur(8)))
        shaded(c, ap, AC, AS, sh=(-d[0] * 1.4, -d[1] * 0.4), rimL=AH, rl=(d[0] * 0.4, d[1] * 0.4))
        c.save(); c.clipPath(ap, skia.ClipOp.kIntersect, True)
        c.drawPath(smooth_closed([T(30, bt), T(80, bt), (wst[0] + 120, skirt_y + 20), (wst[0] + 30, skirt_y + 20), (wst[0] + 36, wst[1])]), P(AS, 70, MaskFilter=blur(18)))   # form shadow on the side away from the light
        for j, xx in enumerate((-46, 4, 52)):                # soft vertical folds in the skirt, from the waist down
            stroke(c, [(wst[0] + xx + hx * 0.6, wst[1] + 40), (wst[0] + xx * 1.08 + hx * 0.8, wst[1] + 150), (wst[0] + xx * 1.15 + hx, skirt_y - 4)], 3, AS, 120)
        pk = skia.Path(); pk.addRRect(skia.RRect.MakeRectXY(skia.Rect(wst[0] - 64 + hx * 0.6, wst[1] + 58, wst[0] + 64 + hx * 0.6, wst[1] + 136), 10, 10))
        if not chair: c.drawPath(pk, P(mix(AC, AS, 0.35))); c.drawPath(pk, SP(AS, 3, 200)); c.drawLine(wst[0] + hx * 0.6, wst[1] + 60, wst[0] + hx * 0.6, wst[1] + 134, SP(AS, 2.5, 200))
        stroke(c, [(wst[0] - 100 + hx * 0.4, wst[1] - 6), (wst[0] + hx * 0.5, wst[1] - 2), (wst[0] + 100 + hx * 0.4, wst[1] - 6)], 7, AS, 160)  # the waist tie runs across
        if cfg.get('flour'):                                 # flour dusted on the front
            rs = np.random.default_rng(3)
            for _ in range(26):
                fx_, fy_ = wst[0] + rs.uniform(-80, 80), wst[1] + rs.uniform(-60, 220)
                c.drawCircle(fx_, fy_, rs.uniform(3, 9), P((255, 255, 255), 70, MaskFilter=blur(3)))
        c.restore()
        for sd in (-1, 1):                                   # the tie loops out at the hips
            p0 = (wst[0] + sd * 100 + hx * 0.4, wst[1] - 4)
            stroke(c, [p0, (p0[0] + sd * 18, p0[1] + 18), (p0[0] + sd * 12, p0[1] + 56)], 6, AS, 230)
    for A_ in (AL, AR):                                     # shoulder seams and elbow folds
        sd = A_['side']; sh = sh_l if sd > 0 else sh_r
        el, d2 = A_['el'], A_['d2']; n2 = (-d2[1], d2[0])
        c.save(); c.clipPath(A_['path'], skia.ClipOp.kIntersect, True)
        for j in (0, 1):
            o = 8 + j * 13
            stroke(c, [(el[0] - n2[0] * 27 + d2[0] * o, el[1] - n2[1] * 27 + d2[1] * o), (el[0] + d2[0] * (o + 7), el[1] + d2[1] * (o + 7)), (el[0] + n2[0] * 27 + d2[0] * o, el[1] + n2[1] * 27 + d2[1] * o)],
                   3.2, TOP_SH, min(210, 60 + A_['bend'] * 1.6) * (1 if j == 0 else 0.6))
        c.restore()
    c.restore()
    def roll(A_):
        """the rolled up sleeve: a soft band round the arm just below the elbow"""
        el, d2 = A_['el'], A_['d2']
        rk = 1 - 0.66 * A_['fz']
        c.save(); c.translate(el[0] + d2[0] * 30 * rk, el[1] + d2[1] * 30 * rk); c.rotate(math.degrees(math.atan2(d2[1], d2[0])))
        hw_ = 37 * AW
        band = skia.Path(); band.addRoundRect(skia.Rect(-17, -hw_, 15, hw_), 12, 12)
        c.drawPath(band, P(AO, 70, MaskFilter=blur(4))); c.drawPath(band, P(mix(TOP, TOP_HI, 0.22)))
        c.save(); c.clipPath(band, skia.ClipOp.kIntersect, True)
        ld = (d[0] * d2[0] + d[1] * d2[1], -d[0] * d2[1] + d[1] * d2[0])
        c.drawPath(diffp(band, (-ld[0] * 0.9, -ld[1] * 0.9)), P(TOP_SH, 210)); c.drawLine(-3, -hw_, -3, hw_, SP(TOP_SH, 2.4, 150)); c.drawLine(12, -hw_, 12, hw_, SP(TOP_SH, 3, 120))
        c.restore(); c.restore()
    def cuff(A_):
        if ROLL: return roll(A_)
        se, d2 = A_['se'], A_['d2']
        c.save(); c.translate(se[0], se[1]); c.rotate(math.degrees(math.atan2(d2[1], d2[0]))); c.scale(1 - 0.35 * A_['fz'], A_['gz'])
        band = skia.Path(); band.addRoundRect(skia.Rect(-24, -24, 5, 24), 9, 9)
        ld = (d[0] * d2[0] + d[1] * d2[1], -d[0] * d2[1] + d[1] * d2[0])      # the light's direction, turned into the cuff's own frame
        c.drawPath(band, P(mix(TOP, TOP_SH, 0.42)))
        c.save(); c.clipPath(band, skia.ClipOp.kIntersect, True)
        q = skia.Path(band); q.offset(ld[0] * 0.8, ld[1] * 0.8); c.drawPath(diffp(band, (-ld[0] * 0.8, -ld[1] * 0.8)), P(TOP_SH))
        for j in (range(-3, 4) if top in ('sweat', 'cardigan') else ()): c.drawLine(-22, j * 6.4, 4, j * 6.4, SP(TOP_SH, 1.8, 150))
        if top == 'rain': c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-20, -9, 3, 11), 4, 4), P(mix(TOP, TOP_HI, 0.5)))
        c.restore()
        gather = skia.Path(); gather.addRoundRect(skia.Rect(-34, -29, -20, 29), 8, 8)          # the sleeve puffs slightly where it meets the band
        c.save(); c.clipPath(gather, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(-26, -30, -20, 30), P(TOP_SH, 120, MaskFilter=blur(2.5))); c.restore()
        c.restore()
    for A_ in (AL, AR):
        if not A_['front'] and top != 'tank': cuff(A_)
    if top == 'sweat':
        col = smooth_closed([T(-52, 54), T(-32, 38), T(0, 30), T(32, 38), T(52, 54), T(46, 28), T(0, 10), T(-46, 28)])
        c.drawPath(col, P(mix(TOP, TOP_SH, 0.3))); c.drawPath(diffp(col, (0, -6)), P(TOP_SH)); c.drawPath(diffp(col, (0, 5)), P(TOP_HI, 200))
        c.save(); c.clipPath(col, skia.ClipOp.kIntersect, True)
        for j in range(-6, 7):
            p0 = T(j * 8.2, 50 - abs(j) * 0.4); p1 = T(j * 7.0, 8); c.drawLine(p0[0], p0[1], p1[0], p1[1], SP(TOP_SH, 1.8, 120))
        c.restore()
    elif top == 'rain':                                      # a stand collar, zipped to the chin
        col = smooth_closed([T(-50, 54), T(-40, 74), T(0, 66), T(40, 74), T(50, 54), T(44, 26), T(0, 14), T(-44, 26)])
        c.drawPath(col, P(mix(TOP, TOP_SH, 0.2))); c.drawPath(diffp(col, (0, -7)), P(TOP_SH)); c.drawPath(col, SP(TOP_SH, 2.5, 200))
        p0, p1 = T(0, 68), T(0, 14); c.drawLine(p0[0], p0[1], p1[0], p1[1], SP(mix(TOP_SH, (20, 20, 40), 0.4), 4)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(p1[0] - 5, p1[1] - 2, p1[0] + 5, p1[1] + 16), 3, 3), P((226, 232, 242)))
    elif top == 'uniform':                                   # a shirt collar: two points
        for sd in (-1, 1):
            cp = skia.Path(); cp.addPoly([skia.Point(*T(sd * 46, 58)), skia.Point(*T(sd * 6, 30)), skia.Point(*T(sd * 30, -4)), skia.Point(*T(sd * 54, 34))], True)
            c.drawPath(cp, P(mix(TOP, TOP_HI, 0.12))); c.drawPath(cp, SP(TOP_SH, 3, 230))
    elif top == 'jacket':                                    # a work jacket's flat collar, lying open
        for sd in (-1, 1):
            cp = skia.Path(); cp.addPoly([skia.Point(*T(sd * 50, 62)), skia.Point(*T(sd * 15, 44)), skia.Point(*T(sd * 22, -22)), skia.Point(*T(sd * 68, 26))], True); cp = rounded(cp, 7)
            c.drawPath(cp, P(AO, 70, MaskFilter=blur(5))); c.drawPath(cp, P(mix(TOP, TOP_HI, 0.16))); c.drawPath(diffp(cp, (-3, -3)), P(TOP_SH, 200)); c.drawPath(cp, SP(TOP_SH, 2.6, 220))
    elif top == 'coat':                                      # wide lapels that cross low on the chest
        for sd in (1, -1):
            cp = skia.Path(); cp.addPoly([skia.Point(*T(sd * 50, 64)), skia.Point(*T(sd * 20, 46)), skia.Point(*T(-sd * 6, -66)), skia.Point(*T(sd * 46, -22)), skia.Point(*T(sd * 58, -4)), skia.Point(*T(sd * 80, 22))], True); cp = rounded(cp, 8)
            c.drawPath(cp, P(AO, 70, MaskFilter=blur(5))); c.drawPath(cp, P(mix(TOP, TOP_HI, 0.18))); c.drawPath(diffp(cp, (-3, -3)), P(TOP_SH, 190)); c.drawPath(cp, SP(TOP_SH, 2.6, 220))
    if cfg.get('scarf'):
        SCF = cfg['scarf']; SCF_SH = mix(SCF, (40, 20, 70), 0.4); SCF_HI = mix(SCF, (255, 255, 255), 0.4)
        end = smooth_closed([T(-46, 40), T(-12, 34), T(-10, -40), T(-14, -96), T(-52, -92), T(-50, -30)])
        q_ = skia.Path(end); q_.offset(5, 7); c.drawPath(q_, P(AO, 80, MaskFilter=blur(6)))
        shaded(c, end, mix(SCF, SCF_SH, 0.15), SCF_SH, sh=(-d[0] * 1.0, -d[1] * 0.4), rimL=SCF_HI, rl=(d[0] * 0.4, d[1] * 0.4))
        for v in (-78, -86): a_, b_ = T(-50, v), T(-14, v - 2); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(SCF_SH, 2.4, 170))
        wrap = smooth_closed([T(-56, 62), T(-30, 80), T(0, 74), T(30, 80), T(56, 62), T(52, 30), T(24, 18), T(0, 12), T(-24, 18), T(-52, 30)])
        q_ = skia.Path(wrap); q_.offset(0, 8); c.drawPath(q_, P(AO, 80, MaskFilter=blur(6)))
        shaded(c, wrap, SCF, SCF_SH, sh=(-d[0] * 1.0, -d[1] * 0.6), rimL=SCF_HI, rl=(d[0] * 0.4, d[1] * 0.4))
        c.save(); c.clipPath(wrap, skia.ClipOp.kIntersect, True)
        stroke(c, [T(-50, 52), T(-10, 40), T(40, 56)], 3, SCF_SH, 170); stroke(c, [T(-40, 36), T(0, 26), T(46, 40)], 2.6, SCF_SH, 130)
        c.restore()
    if cfg.get('overlay'): cfg['overlay'](c, T, wst, ps, whole)
    if getattr(ps, 'mid', None): ps.mid(c)
    for A_, pose_, palm_ in ((AL, ps.l_hand, getattr(ps, 'l_palm', False)), (AR, ps.r_hand, ps.r_palm)):      # a forearm held in front of the body: its shadow on the chest, the wrist, what it holds, the hand, the sleeve, the cuff
        if not A_['front']: continue
        fp = rounded(A_['fpath'], 14)
        soft(c, fp, whole, a=120, r=12, off=(5, 13))
        tk_ = getattr(ps, 'tuck', None)                     # the hand and what it holds can slip under the open front of the jacket
        wrist_skin(A_)
        if tk_ is not None: c.save(); c.clipPath(tk_(T), skia.ClipOp.kDifference, True)
        draw_hand(A_, pose_, palm_)
        if tk_ is not None: c.restore()
        el, d2 = A_['el'], A_['d2']; n2 = (-d2[1], d2[0])
        if ROLL:                                             # the sleeve's elbow sits over the top of the bare forearm
            ecp = skia.Path(); ecp.addCircle(el[0], el[1], 30 * AW); c.drawPath(ecp, P(TOP))                 # flat, so the bent elbow stays one piece with the sleeve
            if cfg.get('plaid'):
                c.save(); c.clipPath(ecp, skia.ClipOp.kIntersect, True)
                for j in range(-9, 10): a_, b_ = T(j * 34, 90), T(j * 34, -420); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(cfg['plaid'], 15, 120))
                for j in range(-12, 4): a_, b_ = T(-330, j * 34), T(330, j * 34); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(cfg['plaid'], 15, 120))
                c.restore()
        else:
            shaded(c, fp, TOP, TOP_SH, sh=(-d[0] * 1.3, -d[1] * 0.9), rimL=TOP_HI, rl=(d[0] * 0.45, d[1] * 0.45))
            c.save(); c.clipPath(fp, skia.ClipOp.kIntersect, True)
            for j in (0, 1):
                o = 8 + j * 13
                stroke(c, [(el[0] - n2[0] * 27 + d2[0] * o, el[1] - n2[1] * 27 + d2[1] * o), (el[0] + d2[0] * (o + 7), el[1] + d2[1] * (o + 7)), (el[0] + n2[0] * 27 + d2[0] * o, el[1] + n2[1] * 27 + d2[1] * o)], 3.2, TOP_SH, 200 * (1 if j == 0 else 0.6))
            c.restore()
        cuff(A_)
        top_ = getattr(ps, A_['key'] + '_item_top', None)     # something worn on the wrist (a watch) sits over the cuff's edge
        if top_: top_(c, (A_['wr'][0] + A_['d2'][0] * 6, A_['wr'][1] + A_['d2'][1] * 6), math.atan2(A_['d3'][1], A_['d3'][0]), getattr(ps, A_['key'] + '_ts', 1), 1.22 * A_['gz'])
    if sit and not chair: draw_legs()
    # ---------------- head: a turning form. The features slide across it with the turn, the far eye narrows, the near ear shows more
    yaw = max(-1.0, min(1.0, getattr(ps, 'head_yaw', 0.0)))   # positive = turned toward screen right
    c.save(); c.translate(*head_c); c.rotate(ps.head_tilt); c.scale(0.86 * cfg.get('head', 1.0) * cfg.get('fw', 1.0) / bw, 0.86 * cfg.get('head', 1.0) * cfg.get('fl', 1.0))
    if cfg.get('headfn'):
        cfg['headfn'](c, ps, cfg, yaw, d, dict(SKIN=SKIN, SKIN_SH=SKIN_SH, SKIN_HI=SKIN_HI, HAIR=HAIR, HAIR_SH=HAIR_SH, HAIR_HI=HAIR_HI))
        c.restore(); c.restore(); return
    fx = yaw * 14
    hs0 = yaw * 5; hst0 = cfg.get('hair', 'quiff')
    if hst0 in ('pony', 'bun'):
        sw_ = getattr(ps, 'pony_sway', 0.0)
        bun = smooth_closed([(-40 + hs0 * 2, -128), (-34 + hs0 * 2, -168), (0 + hs0 * 2, -186), (36 + hs0 * 2, -170), (42 + hs0 * 2, -128), (0 + hs0 * 2, -112)])
        shaded(c, bun, mix(HAIR, HAIR_SH, 0.2), HAIR_SH, sh=(-d[0] * 1.2, -d[1] * 0.6), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-22 + hs0 * 2, -136, 24 + hs0 * 2, -126), 4, 4), P(cfg.get('tie', (63, 194, 169))))
        if hst0 == 'pony':
            tail = smooth_closed([(34, -30), (66, -24), (84 + sw_ * 0.4, 30), (92 + sw_, 96), (80 + sw_ * 1.2, 150), (62 + sw_ * 1.1, 164), (56 + sw_ * 0.8, 110), (52 + sw_ * 0.3, 50), (40, 10)])
            q_ = skia.Path(tail); q_.offset(4, 6); c.drawPath(q_, P(AO, 70, MaskFilter=blur(6)))
            shaded(c, tail, mix(HAIR, HAIR_SH, 0.35), HAIR_SH, sh=(-d[0] * 1.2, -d[1] * 0.3), rimL=HAIR_HI, rl=(d[0] * 0.3, d[1] * 0.3))
            c.save(); c.clipPath(tail, skia.ClipOp.kIntersect, True)
            for j, xx in enumerate((62, 72)): stroke(c, [(xx, -10), (xx + 10 + sw_ * 0.5, 70), (xx + 4 + sw_, 150)], 3, HAIR_SH, 120)
            c.restore()
    if hst0 == 'lowbun':                                     # a low bun at the nape, seen past the jaw on one side, and the bandana's knot above it
        bx, by_ = -66 - yaw * 16, 44
        bun = smooth_closed([(bx - 30, by_ - 4), (bx - 22, by_ - 30), (bx + 6, by_ - 36), (bx + 28, by_ - 18), (bx + 30, by_ + 12), (bx + 10, by_ + 32), (bx - 18, by_ + 26)])
        q_ = skia.Path(bun); q_.offset(4, 6); c.drawPath(q_, P(AO, 70, MaskFilter=blur(6)))
        shaded(c, bun, mix(HAIR, HAIR_SH, 0.25), HAIR_SH, sh=(-d[0] * 1.1, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.45, d[1] * 0.45))
        c.save(); c.clipPath(bun, skia.ClipOp.kIntersect, True)
        stroke(c, [(bx - 20, by_ - 14), (bx + 2, by_ - 4), (bx + 4, by_ + 22)], 3, HAIR_SH, 170); stroke(c, [(bx - 6, by_ - 28), (bx + 16, by_ - 12), (bx + 18, by_ + 12)], 2.6, HAIR_HI, 120)
        c.restore()
        BN = cfg.get('bandana', (42, 132, 130)); BN_SH = mix(BN, (20, 30, 70), 0.4); BN_HI = mix(BN, (255, 255, 255), 0.35)
        kx, ky = -72 - yaw * 12, -22
        for (ax, ay, bx2, by2, w0) in ((kx, ky, kx - 44, ky + 10, 22), (kx, ky, kx - 30, ky + 34, 20)):
            tl_ = tube((ax, ay), (bx2, by2), 14, w0); shaded(c, tl_, BN, BN_SH, sh=(-d[0] * 0.8, -d[1] * 0.5), rimL=BN_HI, rl=(d[0] * 0.4, d[1] * 0.4))
        c.drawCircle(kx, ky, 11, P(mix(BN, BN_SH, 0.3))); c.drawCircle(kx, ky, 11, SP(BN_SH, 2.2, 200))
    if hst0 in ('long', 'bob'):                              # the hair that hangs behind the face and beside the neck
        if hst0 == 'long': pts_ = [(-70 + hs0, -120), (-22 + hs0, -150), (28 + hs0, -150), (72 + hs0, -118), (86, -56), (90, 24), (98, 112), (96, 186), (70, 216), (46, 196), (48, 110), (46, 56), (0, 36), (-46, 56), (-48, 110), (-46, 196), (-70, 216), (-96, 186), (-98, 112), (-90, 24), (-86, -56)]
        else: pts_ = [(-70 + hs0, -120), (-22 + hs0, -150), (28 + hs0, -150), (72 + hs0, -118), (88, -52), (92, 26), (84, 82), (62, 96), (46, 84), (47, 50), (0, 34), (-47, 50), (-46, 84), (-62, 96), (-84, 82), (-92, 26), (-88, -52)]
        hb_ = smooth_closed(pts_)
        q_ = skia.Path(hb_); q_.offset(5, 8); c.drawPath(q_, P(AO, 80, MaskFilter=blur(7)))
        shaded(c, hb_, mix(HAIR, HAIR_SH, 0.35), HAIR_SH, sh=(-d[0] * 1.3, -d[1] * 0.4), rimL=HAIR_HI, rl=(d[0] * 0.4, d[1] * 0.3))
        c.save(); c.clipPath(hb_, skia.ClipOp.kIntersect, True)
        for sx in (-1, 1):
            for j, xx in enumerate((62, 76, 88)): stroke(c, [(sx * xx, -20), (sx * (xx + 6), 70), (sx * (xx - 4 + j * 2), 200 if hst0 == 'long' else 90)], 3, HAIR_HI if sx < 0 else HAIR_SH, 90)
        c.restore()
    for sx in (-1, 1):
        e0 = sx * (61 - 10 * yaw * sx)
        e = smooth_closed([(e0 - sx * 6, -28), (e0 + sx * 12, -38), (e0 + sx * 22, -12), (e0 + sx * 14, 18), (e0 - sx * 4, 14)])
        shaded(c, e, mix(SKIN, SKIN_SH, 0.12), SKIN_SH, sh=(-d[0] * 0.5, -d[1] * 0.4))
        c.drawPath(smooth_closed([(e0 + sx * 4, -24), (e0 + sx * 14, -12), (e0 + sx * 7, 8), (e0 + sx * 3, -6)]), P(SKIN_SH, 210))
    CK = cfg.get('cheek', 0.0)
    face = smooth_closed([(-57, -66), (-62, -22), (-60 - CK, 16), (-51 - CK * 1.6 + fx * 0.3, 46), (-31 - CK * 1.5 + fx * 0.6, 73 - CK * 0.4), (-12 + fx * 0.8, 85 - CK * 0.7), (12 + fx * 0.8, 85 - CK * 0.7), (31 + CK * 1.5 + fx * 0.6, 73 - CK * 0.4), (51 + CK * 1.6 + fx * 0.3, 46), (60 + CK, 16), (62, -22), (57, -66),
                          (40, -97), (0, -105), (-40, -97)])
    c.drawPath(face, P(SKIN))
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True)
    # one shaped form shadow down the side away from the light: temple, cheekbone, jaw
    c.drawPath(smooth_closed([(72, -100), (48 + fx, -78), (41 + fx, -36), (47 + fx, -6), (40 + fx, 30), (22 + fx, 62), (4 + fx, 80), (0 + fx, 100), (80, 100)]), P(SKIN_SH, cfg.get('formsh', 165)))
    q2 = skia.Path(face); q2.offset(5, 3)
    try: d2_ = skia.Op(face, q2, skia.PathOp.kDifference_PathOp)
    except RuntimeError: d2_ = None
    if d2_ is not None: c.drawPath(d2_, P(SKIN_HI, 235))
    c.drawRect(skia.Rect(-70, -104, 70, -62), P(AO, 80, MaskFilter=blur(9)))                                                          # the hair's shadow on the forehead
    for sx in (-1, 1): c.drawOval(skia.Rect(fx + sx * 37 - 18, 16 - 5 * ps.smile, fx + sx * 37 + 18, 38 - 5 * ps.smile), P((240, 130, 120), 40 + 50 * ps.smile + cfg.get('blush', 0), MaskFilter=blur(7)))
    c.drawPath(smooth_closed([(-40 + fx, 70), (fx, 82), (40 + fx, 70), (28 + fx, 92), (fx, 98), (-28 + fx, 92)]), P(SKIN_SH, 60))      # under the lower lip and chin
    c.restore()
    pit = getattr(ps, 'head_pitch', 0.0)                     # looking down: the features sit lower on the face
    c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True); c.translate(0, 9 * pit)
    if cfg.get('beard') in ('full', 'stubble'):
        bp = smooth_closed([(-62, 0), (-52 + fx * 0.3, 50), (-31 + fx * 0.6, 77), (fx * 0.8, 89), (31 + fx * 0.6, 77), (52 + fx * 0.3, 50), (62, 0), (46 + fx, 32), (30 + fx, 46), (fx * 1.1, 41), (-30 + fx, 46), (-46 + fx, 32)])
        c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True); c.drawPath(bp, P(HAIR, 240 if cfg['beard'] == 'full' else 80)); c.drawPath(diffp(bp, (-9, -3)), P(HAIR_SH, 150 if cfg['beard'] == 'full' else 40)); c.restore()
    ey = -12
    for sx in (-1, 1):
        w_ = 1 - 0.26 * max(0.0, sx * yaw); ex = fx * 1.05 + sx * 27 * (1 - 0.1 * max(0.0, sx * yaw))
        op_ = max(0.04, ps.lid) * (1 - 0.2 * ps.smile); h = 11.8 * op_ * cfg.get('eye', 1.0)
        eye = smooth_closed([(ex - 18 * w_, ey + 2), (ex - 8 * w_, ey - h), (ex + 7 * w_, ey - h * 1.04), (ex + 18 * w_, ey - 1), (ex + 8 * w_, ey + h * 0.76), (ex - 7 * w_, ey + h * 0.8)])
        c.drawPath(eye, P((253, 251, 247)))
        c.save(); c.clipPath(eye, skia.ClipOp.kIntersect, True)
        ix, iy = ex + ps.look[0] * 6 * w_, ey + ps.look[1] * 3 + 0.5
        c.drawCircle(ix, iy, 9.4, P((104, 66, 44))); c.drawCircle(ix, iy, 9.4, SP((58, 34, 28), 1.8)); c.drawCircle(ix, iy + 2, 6.5, P((132, 88, 56), 150))
        c.drawCircle(ix, iy, 4.8, P((26, 16, 18))); c.drawCircle(ix - 3.2, iy - 3.4, 2.7, P((255, 255, 255))); c.drawCircle(ix + 3, iy + 3.2, 1.2, P((255, 255, 255), 170))
        c.drawRect(skia.Rect(ex - 20, ey - h - 2, ex + 20, ey - h + 3), P((120, 80, 86), 100))                                         # the lid's shadow on the eye
        c.restore()
        lash = skia.Path(); lash.moveTo(ex - 19 * w_, ey + 2.5); lash.quadTo(ex - 6 * w_, ey - h - 5.5, ex + 8 * w_, ey - h * 1.04 - 2); lash.quadTo(ex + 15 * w_, ey - h * 0.7, ex + 20.5 * w_ * (1 if sx > 0 else 0.96), ey - 2.5 + (0 if sx < 0 else 0))
        c.drawPath(lash, SP((44, 28, 28), 4.2))
        stroke(c, [(ex - 15 * w_, ey - h - 8), (ex, ey - h - 12), (ex + 15 * w_, ey - h - 7)], 2, SKIN_SH, 170 * min(1.0, ps.lid))            # lid crease
        stroke(c, [(ex - 11 * w_, ey + h * 0.8 + 2.5), (ex + 1, ey + h * 0.8 + 4), (ex + 12 * w_, ey + h * 0.76 + 2)], 1.8, SKIN_SH, 120 + 80 * ps.smile)
        by = ey - 27 - 6 * ps.brow
        wy = getattr(ps, 'worry', 0.0)                      # worried brows: the inner ends lift, the outer ends drop
        br_ = smooth_closed([(ex - sx * 18 * w_, by + 6 - ps.brow - 9 * wy), (ex - sx * 15 * w_, by - 3 - ps.brow - 10 * wy), (ex + sx * 3 * w_, by - 10 - 2 * ps.brow - 3 * wy), (ex + sx * 23 * w_, by - 2 + 5 * wy), (ex + sx * 22 * w_, by + 3 + 5 * wy), (ex + sx * 3 * w_, by - 2.5 - ps.brow - 2 * wy)])
        if cfg.get('fem'): stroke(c, [(ex - sx * 17 * w_, by + 3 - ps.brow - 8 * wy), (ex + sx * 2 * w_, by - 7 - 2 * ps.brow - 3 * wy), (ex + sx * 22 * w_, by - 1 + 4 * wy)], 4.2, mix(HAIR, SKIN_SH, 0.15))
        else: c.drawPath(br_, P(HAIR))
        if cfg.get('fem'): stroke(c, [(ex + sx * 15 * w_, ey - h * 0.55), (ex + sx * 20 * w_, ey - h * 0.6 - 1), (ex + sx * 23.5 * w_, ey - h * 0.6 - 4.5)], 3.2, (44, 28, 28))
    # nose: the bridge is only a plane on the shadow side, then the tip and a soft shadow under it
    nx = fx * 1.25 + yaw * 6
    stroke(c, [(nx + 6, -6), (nx + 9, 14), (nx + 11, 28)], 3, SKIN_SH, 190)
    c.drawPath(smooth_closed([(nx - 12, 31), (nx - 4, 37), (nx + 6, 37), (nx + 14, 30), (nx + 9, 41), (nx, 44), (nx - 8, 41)]), P(SKIN_SH, 185))
    c.drawCircle(nx - 1, 27, 5.5, P(SKIN_HI, 120, MaskFilter=blur(2)))
    if cfg.get('beard') == 'moustache':
        mo = smooth_closed([(nx - 30, 56), (nx - 22, 46), (nx - 6, 42), (nx, 45), (nx + 6, 42), (nx + 22, 46), (nx + 30, 56), (nx + 18, 55), (nx, 51), (nx - 18, 55)])
        c.drawPath(mo, P(HAIR)); c.drawPath(diffp(mo, (-4, -3)), P(HAIR_SH, 170)); c.drawPath(diffp(mo, (2, 2)), P(HAIR_HI, 200))
    if cfg.get('glasses'):
        GC = cfg['glasses']
        for sx in (-1, 1):
            gx = fx * 1.05 + sx * 27
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(gx - 21, -29, gx + 21, 7), 13, 13), P((255, 255, 255), 34)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(gx - 21, -29, gx + 21, 7), 13, 13), SP(GC, 3.6))
            c.drawLine(gx + sx * 21, -14, sx * 60, -18, SP(GC, 3.2))
        c.drawLine(fx * 1.05 - 6, -13, fx * 1.05 + 6, -13, SP(GC, 3.4))
    mx = fx * 1.1; mw = 20 + 10 * ps.smile; cv = 2 + 10 * ps.smile; my = 58
    sc = getattr(ps, 'scream', 0.0)
    if sc > 0.2:                                            # a wide open shout
        m = smooth_closed([(mx - 17, my - 4), (mx, my - 8), (mx + 17, my - 4), (mx + 15, my + 8 + 16 * sc), (mx, my + 14 + 18 * sc), (mx - 15, my + 8 + 16 * sc)])
        c.drawPath(m, P((96, 30, 42)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(mx - 20, my - 10, mx + 20, my + 1), P((255, 252, 246))); c.drawOval(skia.Rect(mx - 11, my + 8 + 10 * sc, mx + 11, my + 26 + 18 * sc), P((226, 110, 116)))
        c.restore(); c.drawPath(m, SP((150, 70, 72), 2.4))
    elif getattr(ps, 'talk', 0.0) > 0.08:
        tk = ps.talk
        m = smooth_closed([(mx - 13 - 3 * ps.smile, my - 2), (mx, my - 4), (mx + 13 + 3 * ps.smile, my - 2), (mx + 9, my + 3 + 10 * tk), (mx, my + 5 + 12 * tk), (mx - 9, my + 3 + 10 * tk)])
        c.drawPath(m, P((112, 40, 52)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(mx - 16, my - 8, mx + 16, my + 0.5), P((255, 252, 246))); c.restore()
        c.drawPath(m, SP(cfg.get('lip', (150, 70, 72)), 3))
    elif ps.smile > 0.55:
        m = smooth_closed([(mx - mw, my - cv * 0.5), (mx, my - 1), (mx + mw, my - cv * 0.5), (mx + mw * 0.62, my + cv * 0.9 + 4), (mx, my + cv * 1.25 + 5), (mx - mw * 0.62, my + cv * 0.9 + 4)])
        c.drawPath(m, P((116, 40, 50)))
        c.save(); c.clipPath(m, skia.ClipOp.kIntersect, True)
        c.drawRect(skia.Rect(mx - mw, my - 8, mx + mw, my + 5), P((255, 252, 246))); c.drawOval(skia.Rect(mx - mw * 0.5, my + cv * 0.8 + 2, mx + mw * 0.5, my + cv * 2 + 8), P((226, 110, 116)))
        c.restore(); c.drawPath(m, SP((150, 70, 72), 2.4))
        for sx in (-1, 1): stroke(c, [(mx + sx * (mw + 4), my - cv * 0.7 - 5), (mx + sx * (mw + 8), my - cv * 0.2), (mx + sx * (mw + 4), my + 6)], 2.4, SKIN_SH, 200)
    else:
        stroke(c, [(mx - mw, my - cv * 0.5), (mx - mw * 0.4, my + cv * 0.55), (mx + mw * 0.4, my + cv * 0.55), (mx + mw, my - cv * 0.5)], 4, (150, 74, 78))
        stroke(c, [(mx - mw * 0.5, my + 1.5), (mx, my - 1.5 + cv * 0.4), (mx + mw * 0.5, my + 1.5)], 2, (190, 110, 104), 140)
    stroke(c, [(mx - 11, my + 17 + cv * 0.5), (mx, my + 20.5 + cv * 0.5), (mx + 11, my + 17 + cv * 0.5)], 2.6, SKIN_SH, 170)                  # under the lower lip
    if cfg.get('fem') and sc <= 0.2 and ps.smile <= 0.55 and getattr(ps, 'talk', 0.0) <= 0.08:   # fuller lips
        LIPC = cfg.get('lip', (190, 84, 92))
        lp_ = smooth_closed([(mx - mw, my - cv * 0.5), (mx - 7, my - 5 - cv * 0.1), (mx, my - 2.5), (mx + 7, my - 5 - cv * 0.1), (mx + mw, my - cv * 0.5), (mx + mw * 0.5, my + 6 + cv * 0.5), (mx, my + 8 + cv * 0.6), (mx - mw * 0.5, my + 6 + cv * 0.5)])
        c.drawPath(lp_, P(LIPC)); stroke(c, [(mx - mw, my - cv * 0.5), (mx, my + 1 + cv * 0.5), (mx + mw, my - cv * 0.5)], 2, mix(LIPC, (60, 20, 40), 0.5), 220); c.drawOval(skia.Rect(mx - 7, my + 2 + cv * 0.4, mx + 5, my + 6 + cv * 0.5), P((255, 255, 255), 70))
    c.restore()
    hs = yaw * 5; hstyle = cfg.get('hair', 'quiff')
    if hstyle in ('pony', 'bun'):
        top_ = smooth_closed([(-63, -6), (-73, -54), (-66 + hs, -112), (-26 + hs, -143), (26 + hs, -145), (68 + hs, -114), (75, -54), (65, -6), (59, -40), (50 + hs, -72), (16 + hs, -95), (-22 + hs, -84), (-52, -50)])
        shaded(c, top_, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(top_, skia.ClipOp.kIntersect, True)
        for (x0, y0, x1, y1, x2, y2, a_) in ((14, -100, -30, -112, -64, -60, 150), (16, -116, -40, -130, -70, -84, 120), (20, -98, 50, -100, 68, -50, 90), (22, -118, 54, -122, 72, -76, 80), (-10, -132, 4, -140, 20, -136, 110)):
            stroke(c, [(x0 + hs, y0), (x1 + hs, y1), (x2, y2)], 3.4, HAIR_HI if x1 < 0 else HAIR_SH, a_)
        c.restore()
        if hstyle == 'pony':                                 # loose strands in front of each ear
            for sx in (-1, 1): stroke(c, [(sx * 60, -30), (sx * 64, -4), (sx * 60, 20)], 5, HAIR); stroke(c, [(sx * 62, -24), (sx * 65, -2), (sx * 62, 14)], 2, HAIR_HI if sx < 0 else HAIR_SH, 150)
    elif hstyle == 'lowbun':                                 # hair swept back off the forehead under a rolled bandana
        top_ = smooth_closed([(-62, -4), (-72, -54), (-66 + hs, -114), (-26 + hs, -145), (26 + hs, -147), (68 + hs, -116), (74, -54), (64, -4), (59, -34), (54, -60), (0 + hs, -70), (-54, -60), (-59, -34)])
        shaded(c, top_, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(top_, skia.ClipOp.kIntersect, True)
        for (x0, y0, x1, y1, x2, y2, a_) in ((-50, -116, -20, -136, 16, -140, 140), (-30, -118, 0, -134, 40, -134, 110), (30, -120, 50, -124, 66, -108, 90), (-64, -50, -66, -30, -62, -10, 120), (64, -50, 67, -30, 63, -10, 110)):
            stroke(c, [(x0 + hs, y0), (x1 + hs, y1), (x2 + hs, y2)], 3.2, HAIR_HI if x1 < 0 else HAIR_SH, a_)
        c.restore()
        BN = cfg.get('bandana', (42, 132, 130)); BN_SH = mix(BN, (20, 30, 70), 0.4); BN_HI = mix(BN, (255, 255, 255), 0.35)
        band = smooth_closed([(-75, -62), (-75, -94), (-58 + hs, -114), (-24 + hs, -124), (24 + hs, -125), (60 + hs, -115), (77, -94), (77, -62), (60, -66), (30 + hs, -72), (hs, -74), (-30 + hs, -72), (-60, -66)])
        q_ = skia.Path(band); q_.offset(0, 6); c.drawPath(q_, P(AO, 80, MaskFilter=blur(5)))
        shaded(c, band, BN, BN_SH, sh=(-d[0] * 1.1, -d[1] * 0.5), rimL=BN_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(band, skia.ClipOp.kIntersect, True)
        stroke(c, [(-70, -84), (-30 + hs, -100), (10 + hs, -102)], 2.6, BN_SH, 170); stroke(c, [(-10 + hs, -90), (30 + hs, -94), (72, -80)], 2.6, BN_SH, 150); stroke(c, [(-66, -70), (-20 + hs, -80), (30 + hs, -80)], 2.2, BN_HI, 110)
        c.restore()
    elif hstyle == 'quiff':
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 55, -74), (sx * 67, -66), (sx * 66, -22), (sx * 60, -28), (sx * 57, -50)]), P(mix(HAIR, SKIN_SH, 0.32)))
        hair = smooth_closed([(-64, -54), (-73, -88), (-60 + hs, -128), (-22 + hs, -150), (28 + hs, -153), (64 + hs, -130), (76, -88), (66, -54), (59, -76), (42 + hs, -95), (10 + hs, -86), (-22 + hs, -92), (-46 + hs, -86), (-58, -68)])
        shaded(c, hair, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(hair, skia.ClipOp.kIntersect, True)
        c.drawPath(smooth_closed([(-70, -60), (-50 + hs, -84), (-20 + hs, -92), (12 + hs, -84), (44 + hs, -96), (70, -60), (70, -40), (-70, -40)]), P(HAIR_SH, 150, MaskFilter=blur(4)))   # depth along the hairline
        c.drawPath(smooth_closed([(-58 + hs, -100), (-40 + hs, -134), (-4 + hs, -150), (30 + hs, -146), (10 + hs, -124), (-18 + hs, -104), (-40 + hs, -92)]), P(mix(HAIR, HAIR_HI, 0.3)))      # the lit top plane of the quiff
        for (x0, y0, x1, y1, x2, y2, w_h, col_, a_) in ((-50, -94, -26, -128, 6, -146, 5, HAIR_HI, 150), (-30, -96, -4, -126, 30, -146, 4.4, HAIR_HI, 130), (-6, -90, 18, -120, 50, -140, 4, HAIR_HI, 105),
                                                         (20, -96, 40, -118, 64, -130, 3.6, HAIR_HI, 80), (-40, -92, -16, -116, 16, -138, 3, HAIR_SH, 210), (2, -88, 26, -112, 54, -134, 3, HAIR_SH, 200),
                                                         (-58, -84, -50, -110, -34, -132, 3, HAIR_SH, 180)):
            stroke(c, [(x0 + hs, y0), (x1 + hs, y1), (x2 + hs, y2)], w_h, col_, a_)
        c.restore()
    elif hstyle == 'curly':                                  # a mop of loose curls
        rr = np.random.default_rng(4); cur = []
        for i in range(15):
            a_ = math.radians(lerp(196, 344, i / 14)); cur.append((74 * math.cos(a_) + hs, -58 + 78 * math.sin(a_), 26 + 6 * rr.random()))
        for i in range(9):
            a_ = math.radians(lerp(205, 335, i / 8)); cur.append((46 * math.cos(a_) + hs, -64 + 40 * math.sin(a_), 25 + 5 * rr.random()))
        for (px, py, r_) in cur: c.drawCircle(px + 4, py + 5, r_, P(HAIR_SH))
        for (px, py, r_) in cur: c.drawCircle(px, py, r_, P(HAIR))
        for (px, py, r_) in cur[::2]: c.drawArc(skia.Rect(px - r_ * 0.6, py - r_ * 0.6, px + r_ * 0.6, py + r_ * 0.6), 190, 120, False, SP(HAIR_HI, 3.4, 200))
    elif hstyle == 'buzz':                                   # cropped close to the skull
        cap = smooth_closed([(-63, -50), (-68, -90), (-50 + hs, -122), (hs, -132), (50 + hs, -122), (68, -90), (63, -50), (55, -78), (30 + hs, -92), (hs, -95), (-30 + hs, -92), (-55, -78)])
        shaded(c, cap, mix(HAIR, SKIN_SH, 0.18), HAIR_SH, sh=(-d[0] * 0.8, -d[1] * 0.4), rimL=HAIR_HI, rl=(d[0] * 0.4, d[1] * 0.4))
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 56, -74), (sx * 66, -66), (sx * 65, -30), (sx * 60, -36)]), P(mix(HAIR, SKIN_SH, 0.45)))
    elif hstyle == 'beanie':                                 # a knitted hat pulled down over the ears' tops
        HAT = cfg.get('hat', (226, 168, 60)); HAT_SH = mix(HAT, (40, 20, 40), 0.35); HAT_HI = mix(HAT, (255, 255, 255), 0.4)
        for sx in (-1, 1): c.drawPath(smooth_closed([(sx * 56, -60), (sx * 66, -56), (sx * 65, -26), (sx * 60, -32)]), P(HAIR))
        dome = smooth_closed([(-72, -70), (-74, -104), (-52 + hs, -146), (hs, -162), (52 + hs, -146), (74, -104), (72, -70), (0, -80)])
        shaded(c, dome, HAT, HAT_SH, sh=(-d[0] * 1.2, -d[1] * 0.6), rimL=HAT_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        bnd = smooth_closed([(-76, -100), (0, -112), (76, -100), (75, -58), (0, -70), (-75, -58)])
        c.drawPath(bnd, P(mix(HAT, HAT_SH, 0.35))); c.save(); c.clipPath(bnd, skia.ClipOp.kIntersect, True)
        for j in range(-9, 10): c.drawLine(j * 8.4, -116, j * 8.4, -52, SP(HAT_SH, 2.2, 190))
        c.restore(); c.drawPath(bnd, SP(HAT_SH, 2.5, 200))
    elif hstyle == 'long':                                   # long hair with a centre parting, swept behind the shoulders
        top_ = smooth_closed([(-64, 22), (-74, -54), (-66 + hs, -116), (-26 + hs, -150), (26 + hs, -152), (68 + hs, -118), (76, -54), (66, 22), (59, -22), (47 + hs, -64), (8 + hs, -90), (-30 + hs, -70), (-55, -30)])
        shaded(c, top_, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(top_, skia.ClipOp.kIntersect, True)
        for (x0, y0, x1, y1, x2, y2, a_) in ((4, -110, -40, -112, -64, -50, 150), (2, -122, -50, -128, -72, -70, 120), (12, -108, 46, -104, 66, -40, 90), (10, -124, 52, -124, 72, -66, 80)):
            stroke(c, [(x0 + hs, y0), (x1 + hs, y1), (x2, y2)], 3.6, HAIR_HI if x1 < 0 else HAIR_SH, a_)
        c.restore()
    elif hstyle == 'bob':                                    # a chin length bob with a full fringe
        top_ = smooth_closed([(-66, 30), (-78, -50), (-66 + hs, -120), (-24 + hs, -152), (26 + hs, -152), (66 + hs, -120), (78, -50), (66, 30), (58, -20), (56, -58), (20 + hs, -64), (-20 + hs, -62), (-56, -58), (-58, -20)])
        shaded(c, top_, HAIR, HAIR_SH, sh=(-d[0] * 0.9, -d[1] * 0.5), rimL=HAIR_HI, rl=(d[0] * 0.5, d[1] * 0.5))
        c.save(); c.clipPath(top_, skia.ClipOp.kIntersect, True)
        for j in (-4, -2, 1, 3): stroke(c, [(j * 13 + hs, -64), (j * 14 + hs, -100), (j * 9 + hs, -140)], 3, HAIR_HI if j < 0 else HAIR_SH, 70)
        c.drawRect(skia.Rect(-70, -70, 70, -58), P(HAIR_SH, 120, MaskFilter=blur(3)))
        c.restore()
    elif hstyle == 'bald':                                   # a bare crown with short hair left at the sides
        for sx in (-1, 1):
            sd_ = smooth_closed([(sx * 52, -84), (sx * 66, -70), (sx * 67, -24), (sx * 60, -28), (sx * 56, -56)]); c.drawPath(sd_, P(HAIR)); c.drawPath(diffp(sd_, (-3, -2)), P(HAIR_SH, 150))
        c.drawOval(skia.Rect(-40 + hs, -98, 4 + hs, -78), P(SKIN_HI, 150, MaskFilter=blur(6)))
    if cfg.get('goggles'):                                   # round welding goggles: up on the forehead (ps.goggles 0) or down over the eyes (1)
        g_ = smooth(getattr(ps, 'goggles', 0.0)); GM = cfg['goggles']; GM_SH = mix(GM, (20, 20, 50), 0.45); GM_HI = mix(GM, (255, 255, 255), 0.5)
        gy = lerp(-93, -12 + 9 * getattr(ps, 'head_pitch', 0.0), g_); gxo = lerp(hs, fx * 1.05, g_); rr_ = lerp(20.5, 24.5, g_); sep = lerp(25, 27.5, g_)
        ref = getattr(ps, 'gog_ref', None)                   # (colour, 0..1): what the dark lenses reflect (the flame)
        sy = lerp(-88, -22, g_)
        for sx in (-1, 1):                                   # the strap runs back round the head from each cup
            stroke(c, [(gxo + sx * (sep + rr_ - 4), gy), (sx * 62, lerp(gy, sy, 0.6)), (sx * 76, sy)], 9, (38, 36, 44)); stroke(c, [(gxo + sx * (sep + rr_ - 4), gy - 2), (sx * 62, lerp(gy, sy, 0.6) - 2), (sx * 76, sy - 2)], 2.4, (96, 94, 108), 200)
        c.drawLine(gxo - sep + rr_ - 6, gy, gxo + sep - rr_ + 6, gy, SP(GM_SH, 8)); c.drawLine(gxo - sep + rr_ - 6, gy - 2, gxo + sep - rr_ + 6, gy - 2, SP(GM, 3))
        for sx in (-1, 1):
            cx_ = gxo + sx * sep
            c.drawCircle(cx_ + 2, gy + 4, rr_ + 1, P(AO, 90, MaskFilter=blur(4)))
            c.drawCircle(cx_, gy, rr_, P(GM)); c.drawCircle(cx_ + 1.5, gy + 1.5, rr_ - 1, SP(GM_SH, 3, 200)); c.drawCircle(cx_ - 1, gy - 1, rr_ - 1, SP(GM_HI, 1.8, 170))
            ln = skia.Path(); ln.addCircle(cx_, gy, rr_ - 6.5)
            c.drawPath(ln, P((24, 30, 40)))
            c.save(); c.clipPath(ln, skia.ClipOp.kIntersect, True)
            c.drawOval(skia.Rect(cx_ - rr_, gy - rr_ - 6, cx_ + rr_ * 0.3, gy - 2), P((120, 150, 170), 70, MaskFilter=blur(4)))        # the sky of the room in the glass
            if ref and ref[1] > 0.01:
                c.drawCircle(cx_ + 5, gy + 3, (rr_ - 6.5) * (0.5 + 0.35 * ref[1]), P(ref[0], 235 * ref[1], MaskFilter=blur(3.5))); c.drawCircle(cx_ + 5, gy + 3, (rr_ - 6.5) * 0.22, P((255, 255, 255), 230 * ref[1], MaskFilter=blur(1.5)))
            c.restore()
            c.drawPath(ln, SP((10, 12, 20), 2, 220))
    c.restore()
    if cfg.get('whistle'):
        WY, WY_SH, MET, MET_SH = (250, 204, 70), (196, 140, 50), (226, 232, 240), (150, 160, 186)
        if getattr(ps, 'whistle_mouth', False):
            mp = (head_c[0] + yaw * 14 * 1.1 * 0.86, head_c[1] + 62 * 0.86 * cfg.get('head', 1.0) * cfg.get('fl', 1.0))
            for sd in (-1, 1):
                a_ = T(sd * 31, 50); stroke(c, [a_, ((a_[0] + mp[0]) / 2 + sd * 10, (a_[1] + mp[1]) / 2 + 26), (mp[0] + sd * 5, mp[1] + 16)], 4.6, WY_SH); stroke(c, [a_, ((a_[0] + mp[0]) / 2 + sd * 10, (a_[1] + mp[1]) / 2 + 26), (mp[0] + sd * 5, mp[1] + 16)], 2.6, WY)
            wb = skia.Path(); wb.addRoundRect(skia.Rect(mp[0] - 13, mp[1] - 4, mp[0] + 13, mp[1] + 22), 7, 7)
            c.drawPath(wb, P(MET)); c.drawPath(diffp(wb, (-3, -3)), P(MET_SH)); c.drawRect(skia.Rect(mp[0] - 7, mp[1] + 4, mp[0] + 7, mp[1] + 9), P((40, 44, 70)))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(mp[0] - 9, mp[1] - 10, mp[0] + 9, mp[1] - 2), 3, 3), P(MET_SH))
    c.restore()


def track(keys, t):
    """Smooth path through the keys with no stop at each key (monotone cubic). The old version eased in and out of EVERY key,
    so a move with a key in the middle of it stalled there: the arm went up, paused, and went up again."""
    n = len(keys)
    if t <= keys[0][0]: return keys[0][1]
    if t >= keys[-1][0]: return keys[-1][1]
    xs = [k[0] for k in keys]; ys = [k[1] for k in keys]
    dl = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
    m = [0.0] * n                                            # rest at both ends, and at every turning point or hold
    for i in range(1, n - 1):
        if dl[i - 1] * dl[i] > 0:
            w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]); w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1])
            m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i])
    for i in range(n - 1):
        if xs[i] <= t <= xs[i + 1]:
            h = xs[i + 1] - xs[i]; u = (t - xs[i]) / h
            return ((2 * u ** 3 - 3 * u ** 2 + 1) * ys[i] + (u ** 3 - 2 * u ** 2 + u) * h * m[i] + (-2 * u ** 3 + 3 * u ** 2) * ys[i + 1] + (u ** 3 - u ** 2) * h * m[i + 1])
    return ys[-1]


DUR = 6.0


def pose_at(t):
    ps = Pose()
    ps.breath = 0.5 + 0.5 * math.sin(t * 2 * math.pi / 3.0)
    ps.sway = track([(0, -14), (0.8, -14), (1.3, -16), (3.4, -15), (4.3, 13), (5.4, 13), (6.0, -14)], t)
    ps.lean = track([(0, 0.0), (0.8, 0.0), (1.0, 1.5), (1.5, -2.0), (3.3, -1.8), (4.0, 0.5), (6.0, 0.0)], t)
    ps.sh_r = track([(0, 0), (0.85, 0), (1.0, -5), (1.35, 16), (3.3, 14), (3.9, -2), (4.3, 0)], t)
    # up: the shoulder leads. down: the elbow folds first so the hand comes down close to the body, then the arm settles
    up = track([(0, 7), (0.85, 7), (0.98, 5), (1.12, 22), (1.26, 62), (1.48, 119), (1.7, 114), (3.3, 114), (3.5, 97), (3.75, 48), (3.98, 9), (4.2, 4), (4.45, 7)], t)
    fore = track([(0, 6), (0.88, 6), (1.02, 52), (1.2, 106), (1.46, 84), (1.7, 74), (3.3, 72), (3.46, 84), (3.7, 48), (3.95, 15), (4.15, 3), (4.36, 10), (4.6, 6)], t)
    wv = wl = 0.0
    if 1.62 < t < 3.36:
        k = (t - 1.62); env = smooth(k / 0.25) * (1 - smooth((t - 3.1) / 0.26))
        wv = env * 17 * math.sin(k * 2 * math.pi * 2.25); wl = env * 14 * math.sin((k - 0.09) * 2 * math.pi * 2.25)
    ps.r_up, ps.r_fore = up, fore + wv
    ps.r_fz = max(track([(0, 0), (0.94, 0), (1.1, 1.0), (1.2, 0.9), (1.42, 0), (6, 0)], t), track([(0, 0), (3.42, 0), (3.66, 0.9), (3.84, 1.0), (4.08, 0), (6, 0)], t))
    ps.r_wrist = wl + track([(0, -10), (1.0, -10), (1.2, -34), (1.42, -12), (1.62, 0), (3.3, 0), (3.55, 22), (3.8, 32), (4.05, 12), (4.3, -10)], t)
    openk = smooth((t - 1.27) / 0.2) * (1 - smooth((t - 3.36) / 0.3))
    mv = max(smooth((t - 0.92) / 0.14) * (1 - smooth((t - 1.24) / 0.14)), smooth((t - 3.42) / 0.2) * (1 - smooth((t - 4.0) / 0.3)))   # a hand in motion hangs loose and half closed
    ps.r_hand = H.blend(H.blend(RELAX, dict(curls=(0.46, 0.5, 0.55, 0.6, 0.64), spread=0.1), mv), H.FLAT, openk); ps.r_palm = openk > 0.5
    ps.l_up = track([(0, 7), (1.05, 7), (1.6, 12.5), (3.4, 11.5), (4.25, 5.5), (4.7, 8), (5.2, 7), (6.0, 7)], t) + 1.0 * math.sin(t * 1.3)
    ps.l_fore = track([(0, 8), (1.1, 8), (1.7, 14), (3.4, 13), (4.3, 6), (4.8, 9), (5.3, 8), (6.0, 8)], t) + 1.5 * math.sin(t * 1.1 + 1); ps.l_wrist = -10
    ps.head_tilt = track([(0, 0), (0.9, 0), (1.5, 5.5), (3.3, 5.0), (4.0, -1.5), (4.6, 0)], t) + 0.05 * wv
    ps.head_yaw = track([(0, -0.34), (0.5, -0.34), (0.82, 0.0), (1.2, -0.06), (1.6, -0.3), (3.3, -0.26), (4.0, 0.06), (4.8, 0.0), (5.5, 0.0), (6.0, -0.34)], t)
    ps.head_x = track([(0, 0), (1.0, 0), (1.5, 5), (3.3, 5), (4.0, 0)], t)
    ps.smile = track([(0, 0.4), (0.9, 0.4), (1.5, 1.0), (3.6, 1.0), (4.6, 0.55), (6.0, 0.4)], t)
    ps.brow = track([(0, 0), (0.9, 0), (1.25, 1.0), (1.9, 0.5), (3.4, 0.4), (4.0, 0)], t)
    bl = min(abs(t - 0.62), abs(t - 2.5), abs(t - 4.56)); ps.lid = max(0.05, min(1.0, bl / 0.09))
    ps.look = (track([(0, -0.7), (0.5, -0.7), (0.7, 0.1), (1.0, 0.0), (5.5, 0.0), (6.0, -0.7)], t), 0.0)
    return ps


_CL = None


def cloth(t):
    """The shirt is cloth, so it does not copy the arm exactly: it follows a beat late, overshoots a little and settles.
    Each value is a damped spring chasing what the body is doing, stepped through the whole clip once and then looked up."""
    global _CL
    if _CL is None:
        spec = dict(lift=(2.6, 0.95), up=(3.4, 0.9), fa=(3.8, 0.9), slide=(2.6, 1.0), hem=(2.4, 0.95))   # follows a beat late and settles ONCE: no bounce
        st = {}; _CL = []; dt = 1 / 120
        for i in range(int(DUR * 120) + 1):
            ps = pose_at(i * dt)
            tg = dict(lift=smooth((ps.r_up - 12) / 68.0), up=ps.r_up, fa=ps.r_up + ps.r_fore,
                      slide=max(0.0, -math.cos(math.radians(ps.r_up + ps.r_fore))), hem=ps.sway + 2.5 * ps.lean)
            for k_, (f, z) in spec.items():
                if k_ not in st: st[k_] = [tg[k_], 0.0]
                w = 2 * math.pi * f; x, v = st[k_]
                v += (w * w * (tg[k_] - x) - 2 * z * w * v) * dt; x += v * dt; st[k_] = [x, v]
            _CL.append(dict(lift=st['lift'][0], swing_u=st['up'][0] - tg['up'], swing_f=st['fa'][0] - tg['fa'], slide=max(0.0, st['slide'][0]), hemdx=st['hem'][0] - tg['hem']))
    return _CL[min(len(_CL) - 1, int(round((t % DUR) * 120)))]


def frame(t):
    s = skia.Surface(1080, 1920); c = s.getCanvas()
    background(c, t); draw(c, pose_at(t), t=t, cl=cloth(t))
    return s


if __name__ == '__main__':
    import subprocess
    if len(sys.argv) > 1 and sys.argv[1] == 'stills':
        for tt in (0.3, 1.15, 1.3, 1.8, 3.55, 3.8):
            frame(tt).makeImageSnapshot().save(f'out/u_{tt:.2f}.png')
    else:
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1080x1920', '-r', '30', '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'out/guy_v13.mp4'], stdin=subprocess.PIPE)
        for rep in range(2):
            for fi in range(int(DUR * 30)): ff.stdin.write(frame(fi / 30).makeImageSnapshot().tobytes())
        ff.stdin.close(); ff.wait()
