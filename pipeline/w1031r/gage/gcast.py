"""The Gage cast as ONE skinned body each (pipeline/people kit, local gperson.py adds the 1840s felt hat, brows, the healed
entry scar and the lost left eye). Gage from his model sheet ref/gage_tamp.png: brown felt hat, brown waistcoat, cream shirt
with rolled sleeves, grey blue trousers, brown boots. Helpers solve an arm per frame so a hand sits exactly on a target."""
import math
import gperson as PP, airman2 as A

def mk(k, vest, vest_sh, shirt, trouser, hat=None, hat_col=(112, 78, 52), skin=None, hair=None, scar=False, eye_shut=False):
    pal = {A.OL: vest, A.OL_SH: vest_sh, A.OL_HI: vest, A.CUFF: shirt, A.BELT: (64, 50, 42), A.BELT_SH: (48, 38, 32),
           A.BOOT_C: (110, 70, 44), A.BOOT_SH: (82, 50, 32), A.SOLE: (52, 36, 26), (150, 120, 80): (180, 150, 90)}
    if skin: pal[A.SKIN], pal[A.SKIN_SH] = skin
    if hair: pal[A.HAIR], pal[A.HAIR_SH] = hair
    p = PP.Person(k, palette=pal, cap=False, hat=hat, sleeve=shirt, trouser=trouser, collar=shirt)
    p.hat_col = hat_col; p.hat_sh = tuple(int(v * 0.74) for v in hat_col); p.scar = scar; p.eye_shut = eye_shut
    return p

def gage(k, hat='felt', after=False):
    return mk(k, (98, 66, 46), (72, 48, 34), (236, 224, 198), (80, 94, 112), hat=hat, scar=after, eye_shut=after)

def worker_a(k, hat='felt'):     # red flannel shirt, dark trousers, grey hat
    return mk(k, (150, 58, 46), (112, 40, 34), (150, 58, 46), (66, 62, 70), hat=hat, hat_col=(92, 90, 96),
              skin=((214, 160, 122), (190, 138, 104)), hair=((90, 62, 40), (66, 44, 30)))

def worker_b(k, hat='felt'):     # blue shirt, tan trousers, black hat
    return mk(k, (70, 92, 128), (50, 66, 96), (70, 92, 128), (150, 126, 92), hat=hat, hat_col=(44, 40, 44),
              skin=((176, 118, 84), (150, 98, 70)), hair=((40, 30, 26), (28, 20, 18)))

def boss(k):                     # the contractor: dark coat over a white shirt, dark hat
    return mk(k, (46, 50, 62), (32, 34, 44), (46, 50, 62), (52, 54, 64), hat='felt', hat_col=(40, 38, 42),
              skin=((228, 176, 140), (204, 152, 120)), hair=((150, 140, 130), (120, 110, 100)))

_C = {}
def arm_to(who, kw, side, target, ground, key=None, ua_rng=(-60, 181), el_rng=(0, 151), step=4, gd=44):
    """grid search shoulder and elbow so the wrist of arm side lands on target (canvas coords); refine once"""
    ck = (id(who), key, side) if key is not None else None
    if ck in _C: return _C[ck]
    def err(ua, el):
        k2 = dict(kw); k2['uarm_' + side] = ua; k2['elbow_' + side] = el
        ps = A.Pose(ground=ground, **k2); J = who.joints(ps)
        o, deg = J['hand_' + side]; f = who.frame(o, deg)
        hx, hy = who.canvas_pt(ps, f(4, gd) if gd else o)
        return (hx - target[0]) ** 2 + (hy - target[1]) ** 2
    best = min(((err(u, e), u, e) for u in range(ua_rng[0], ua_rng[1], step * 3) for e in range(el_rng[0], el_rng[1], step * 3)))
    _, u0, e0 = best
    best = min(((err(u, e), u, e) for u in range(u0 - 12, u0 + 13, 1) for e in range(max(0, e0 - 12), min(150, e0 + 13), 1)))
    r = (best[1], best[2], best[0] ** 0.5)
    if ck is not None: _C[ck] = r
    return r

def hand_pt(who, ps, side):
    J = who.joints(ps); return who.canvas_pt(ps, J['hand_' + side][0])

def grip_pt(who, ps, side, d=46):
    """the middle of the gripping hand (a bit past the wrist along the hand), canvas coords"""
    J = who.joints(ps); o, deg = J['hand_' + side]; f = who.frame(o, deg)
    return who.canvas_pt(ps, f(4, d))
