"""w1031-03-mirror-mint (organic chemistry; enantiomers and chirality). PREMIUM REBUILD 2026-11-09.
All code (skia), house flat layered style; the cook is ONE skinned body (pipeline/people person.py); molecules from
RDKit 3D coordinates of (R)-carvone (CIP checked) and its exact mirror image.

Story (premises in order, video standard 5d): a cook in a morning kitchen smells a spearmint sprig; a seeded rye loaf
sits in front of him. Mint and rye smell nothing alike, yet both smells are carvone; the two carvones are mirror images
(his left and right hand), can never be stacked (chiral), and the chiral smell receptors in his nose fit each one
differently, so one smells like mint and the other like rye bread.

Art plan and motion list (for the accuracy check):
S1 (0 s) kitchen wide, slow push. The cook raises a spearmint sprig to his nose (hand grips the stem; the stem runs
   behind his fingers), his far hand rests on the worktop. Green scent rises from the leaves, amber from the loaf; on
   "mirror image molecules" each curls into a small carvone, mirrored across a dashed line.
S2 ("Take the spearmint") zoom cut to his face and hand. The leaves stir; on "smell" scent rises; on "carvone" it
   gathers into an (R)-carvone ball and stick beside his face (chip SPEARMINT).
S3 ("And the rye bread's") zoom cut to the loaf: caraway seeds in the crust light on "caraway seeds"; on "full of
   carvone" scent rises from them into the mirror image (S)-carvone.
S4 ("Same atoms") zoom cut: the two molecules large over the blurred kitchen, a glass mirror pane between them. Atoms
   pulse on "atoms", bonds on "bonds"; on "flipped" dotted reflection lines join each atom to its twin through the
   mirror (true mirror images: x -> -x).
S5 ("like his left hand") zoom cut to his own hands from his point of view, palms toward him: the left thumb points
   left, the right thumb right (mirror images). "Lay one on the other": his left hand moves onto his right (his arm
   carries it), thumbs on opposite sides (red). "turns it": he turns the left hand over (back, nails), the thumb now
   on the right but the palm faces the other way; red again on "never lines up".
S6 ("Chemists call that") zoom cut: the spearmint molecule slides onto the caraway one and turns to the best fit:
   the rings line up but at the stereocentre the H and the side group are on opposite sides (red): CHIRAL.
S7 ("So how does his nose") zoom cut to his face, push toward the nose.
S8 ("The smell receptors") a round lens opens from his nose into the olfactory epithelium (his face stays in a round
   inset): mucus, cilia, two different receptor proteins; on "kyral too" their pockets light; on "each version" the
   spearmint form docks into the first and fires a green signal, the caraway form docks into the second (amber).
S9 ("One smells like mint") the inset grows back into the kitchen: green glow at the sprig; on "its mirror image" he
   lowers the mint, his far hand takes a slice of rye from the worktop and lifts it to his nose (amber).
S10 ("Free practice") pull back to the wide kitchen; end line.
Sources: LibreTexts "Stereoisomerism and Smell"; Wikipedia "Carvone" ((R) spearmint, (S) caraway with notes of rye);
PMC11107518 (enantiomer selective olfactory receptors)."""
import sys, math
sys.path[:0] = ['/home/claude/lp/w1031r/mint', '/home/claude/short']
import numpy as np, skia
from scipy.spatial.transform import Rotation as Rot, Slerp
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, lgrad, ease_io, Wt, Y, R, TL, W, H, OR
import layout as L
import art as A, mol as M, hands as HD, nose as N

ID = 'w1031-03-mirror-mint'
OUT = f'/home/claude/lp/w1031r/out/{ID}'
WD = kit.Words(f'{OUT}/words.json')
at = WD.at
G, AMB = A.G, A.AMB
GT, AT = (120, 230, 140), (255, 190, 110)

T_MIRROR = at('mirror'); T_TAKE = at('take'); T_SMELL2 = at('smell', 2); T_CARV1 = at('carvone')
T_AND2 = at('and', 2); T_CARAWAY = at('caraway'); T_FULL = at('full'); T_CARV2 = at('carvone', 2)
T_SAME = at('same'); T_ATOMS = at('atoms'); T_BONDS = at('bonds'); T_BUT = at('but'); T_FLIP = at('flipped')
T_LIKE = at('like'); T_LEFT = at('left'); T_RIGHT = at('right'); T_LAY = at('lay'); T_OTHER = at('other')
T_TURNS = at('turns'); T_NEVER = at('never'); T_CHEM = at('chemists'); T_KY1 = at('kyral')
T_SO = at('so'); T_NOSE = at('nose'); T_REC = at('receptors'); T_KY2 = at('kyral', 2); T_EACH = at('each')
T_FITS = at('fits'); T_ONE3 = at('one', 3); T_MINT2 = at('mint', 2); T_ITS2 = at('its', 2); T_RYE3 = at('rye', 3)
T_FREE = at('free')
T_END = WD.end() + 0.45
DUR = round(T_END + 1.5, 2)

C1 = T_TAKE - 0.06; C2 = T_AND2 - 0.06; C3 = T_SAME - 0.06; C4 = T_LIKE - 0.06; C5 = T_CHEM - 0.06; C6 = T_SO - 0.06
LENS0 = T_REC - 0.45; LENS1 = T_ONE3 - 0.12
CUTS = [C1, C2, C3, C4, C5, C6]

TITLES = [
    (-0.5, [[('MIRROR IMAGE', Y)], [('MOLECULES', Wt)]]),
    (C1, [[('SPEARMINT', GT)]]),
    (T_CARV1 - 0.1, [[('SPEARMINT', GT)], [('= CARVONE', Wt)]]),
    (C2, [[('RYE BREAD', AT)]]),
    (T_CARAWAY - 0.1, [[('CARAWAY', AT), (' SEEDS', Wt)]]),
    (T_FULL - 0.1, [[('CARVONE', Y), (' TOO', Wt)]]),
    (C3, [[('SAME ATOMS', Wt)], [('SAME BONDS', Wt)]]),
    (T_BUT - 0.1, [[('ONE IS', Wt)], [('FLIPPED', Y)]]),
    (C4, [[('LEFT HAND', Wt)], [('RIGHT HAND', Wt)]]),
    (T_LAY - 0.1, [[('LAY ONE', Wt)], [('ON THE OTHER', Wt)]]),
    (T_NEVER - 0.1, [[('NEVER', R), (' LINES UP', Wt)]]),
    (C5, [[('CHIRAL', Y)]]),
    (C6, [[('HOW DOES HIS', Wt)], [('NOSE', Y), (' TELL?', Wt)]]),
    (LENS0 + 0.2, [[('CHIRAL', Y)], [('RECEPTORS', Wt)]]),
    (T_EACH - 0.1, [[('EACH FITS', Wt)], [('DIFFERENTLY', Y)]]),
    (LENS1, [[('MINT', GT)]]),
    (T_ITS2 - 0.1, [[('MINT', GT), (' OR ', Wt), ('RYE', AT)]]),
    (T_FREE - 0.1, [[('FREE PRACTICE', TL)], [('LEVLPREP.COM', Wt)]]),
]

# ------------------------------------------------------------------ molecules: base view, mirror, best fit
VIEW = M.rot(0.35, 0.35, 2.0)
BASE = M.XYZ @ VIEW.T                         # (R) in view space
MIRR = BASE * np.array([-1.0, 1.0, 1.0])      # (S): its exact mirror image
from rdkit import Chem
_m = Chem.MolFromSmiles(M.D['smiles'])
assert len(BASE) - 1 == _m.GetNumAtoms() and M.EL[-1] == 'H'
_ring_idx = [i for i in range(_m.GetNumAtoms()) if _m.GetAtomWithIdx(i).IsInRing()]
_a = BASE[_ring_idx] - BASE[_ring_idx].mean(0); _b = MIRR[_ring_idx] - MIRR[_ring_idx].mean(0)
_ring_idx = list(range(8))                     # ring, methyl and C=O: the part that CAN be stacked
_a = BASE[_ring_idx] - BASE[_ring_idx].mean(0); _b = MIRR[_ring_idx] - MIRR[_ring_idx].mean(0)
_q, _ = Rot.align_vectors(_b, _a)              # proper rotation that best stacks R onto S
FIT = Slerp([0, 1], Rot.concatenate([Rot.identity(), _q]))
RC_R, RC_S = BASE[_ring_idx].mean(0), MIRR[_ring_idx].mean(0)


def proj(P3, cx, cy, sc, tilt=0.0):
    if tilt: P3 = P3 @ M.rot(tilt, 0.0).T
    f = 1 + P3[:, 2] * 0.07
    return np.c_[cx + P3[:, 0] * sc * f, cy - P3[:, 1] * sc * f, P3[:, 2]]


def pair(c, cx, cy, sc, mx, t, a=1.0, ga=1.0, pa=0.0, pb=0.0, roll=0.0, tilt=0.0):
    """the (R) molecule left of the mirror line mx, its exact mirror image (S) on the right"""
    R3 = BASE @ M.rot(0.0, roll).T
    pr = proj(R3, cx, cy, sc, tilt)
    ps = pr.copy(); ps[:, 0] = 2 * mx - ps[:, 0]
    M.draw(c, pr, sc, a, G, ga, pa, pb)
    M.draw(c, ps, sc, a, AMB, ga, pa, pb)
    return pr, ps


def wisp(c, t, x0, y0, x1, y1, u, col, seed, n=14, r0=26):
    rs = np.random.default_rng(seed)
    ph = rs.uniform(0, 6, n)
    for k in range(n):
        f = u * 1.25 - k * 0.025
        if f <= 0: continue
        f = min(f, 1.0)
        x = lerp(x0, x1, f) + 34 * math.sin(f * 7 + ph[k] + t * 1.2) * (1 - f)
        y = lerp(y0, y1, smooth(f)) + 12 * math.sin(t * 1.3 + k)
        r = r0 * (1 + 0.6 * math.sin(k * 1.7) ** 2) * (1.2 - 0.5 * f)
        c.drawCircle(x, y, r, P(col, 60 * (1 - 0.7 * f), MaskFilter=blur(r * 0.6), BlendMode=skia.BlendMode.kScreen))


def rising(c, t, x, y, col, seed, h=260, a=1.0):
    """continuous soft scent rising from a source"""
    for k in range(6):
        u = ((t * 0.32 + k / 6 + seed * 0.13) % 1.0)
        xx = x + 26 * math.sin(t * 1.1 + k * 2 + seed) * u
        rr = 14 + 30 * u
        c.drawCircle(xx, y - h * u, rr, P(col, 55 * a * math.sin(math.pi * u), MaskFilter=blur(rr * 0.7), BlendMode=skia.BlendMode.kScreen))


# ------------------------------------------------------------------ the cook over time (one body, actions that connect)
def cook_state(t):
    m = 0.18 + 0.82 * ease_io(t / 0.75)
    m = lerp(m, 0.15, ease_io((t - T_ITS2) / 0.6))
    rest = (470, 1236)
    sl = A.SLICE_W
    nose = A.nose_pt(dict(A.BASE))
    lift = (nose[0] + 70, nose[1] + 140)
    r0 = T_ITS2 + 0.05; g0 = r0 + 0.42; l1 = T_RYE3 - 0.05
    if t < r0: far = rest; phase = 'rest'
    elif t < g0: far = (lerp(rest[0], sl[0], ease_io((t - r0) / (g0 - r0))), lerp(rest[1], sl[1] - 6, ease_io((t - r0) / (g0 - r0)))); phase = 'reach'
    else:
        u = ease_io((t - g0) / (l1 - g0)); far = (lerp(sl[0], lift[0], u), lerp(sl[1] - 6, lift[1], u)); phase = 'lift'
    kw = A.cook_pose(t, m, far)
    kw['hand_f'] = 'grip' if phase == 'lift' else ('flat' if phase == 'rest' else 'grip')
    return kw, phase, far, m


def kitchen(c, t, z, tx, ty, mol_small=0.0, glow_g=0.0, glow_a=0.0, seed_hl=0.0, wisps=True):
    c.save(); c.translate(540, 960); c.scale(z, z); c.translate(-tx, -ty)
    A.room(c, t); A.teapot(c, t)
    kw, phase, far, m = cook_state(t)
    ps = A.draw_cook(c, kw)
    A.counter(c, t)
    A.loaf(c, t, hl=seed_hl)
    A.knife(c); A.mint_glass(c, t)
    # the slice: lying on the worktop until his far hand grips it, then carried by the hand (face toward us)
    if phase == 'lift':
        p, d = A.held(kw, 'f')
        u = smooth((t - (T_ITS2 + 0.47)) / 0.5)
        A.slice_(c, p[0] + 6, p[1] + lerp(8, -12, u), lerp(0, -8, u), lerp(0.9, 0.72, u), hl=glow_a * 0.6, lying=u < 0.25)   # its bottom edge pinched in the fist
        A.hand_over(c, ps, 'f')
    else:
        A.slice_(c, *A.SLICE_W, 0.0, 0.9)
        if phase == 'reach': A.hand_over(c, ps, 'f')
    # the sprig in his near hand: the stem passes behind his fingers
    p, d = A.held(kw, 'n')
    ang = lerp(-15, 18, smooth((0.6 - m) / 0.4)) if m < 0.6 else -15
    A.sprig(c, p[0], p[1], ang, t, 0.85, glow=glow_g)
    A.hand_over(c, ps, 'n')
    if wisps:
        sp = A.held(kw, 'n')[0]
        rising(c, t, sp[0] - 20, sp[1] - 120, G, 1, 200, 0.9)
        rising(c, t, A.LOAF[0] + 40, A.LOAF[1] - 70, AMB, 2, 220, 0.9)
    if glow_a > 0.01 and phase == 'lift':
        q = A.held(kw, 'f')[0]
        c.drawCircle(q[0], q[1] - 40, 110, P(AMB, 90 * glow_a, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
    c.restore()
    return kw


def blurred_kitchen(c, t, r=22, dark=0.35, z=1.25):
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(r, r)))
    kitchen(c, t, z, 600, 980, wisps=False)
    c.restore()
    c.drawRect(skia.Rect(0, 0, W, H), P((24, 18, 30), 255 * dark))


def to_screen(z, tx, ty, x, y):
    return (540 + (x - tx) * z, 960 + (y - ty) * z)


# ------------------------------------------------------------------ shots
def shot1(c, t):
    u = t / C1
    z = lerp(1.06, 1.14, ease_io(u)); tx, ty = lerp(560, 600, u), lerp(1000, 980, u)
    kitchen(c, t, z, tx, ty)
    # scent curls into two small mirror image molecules across a dashed line on "mirror image molecules"
    k = smooth((t - (T_MIRROR - 0.5)) / 1.1)
    mx = 760
    gx, gy = to_screen(z, tx, ty, 690, 830); ax, ay = to_screen(z, tx, ty, 930, 830)
    sp = to_screen(z, tx, ty, 560, 700); lf = to_screen(z, tx, ty, A.LOAF[0] + 40, A.LOAF[1] - 80)
    wisp(c, t, sp[0], sp[1], gx, gy, k, G, 3)
    wisp(c, t, lf[0], lf[1], ax, ay, k, AMB, 4)
    ma = smooth((t - T_MIRROR - 0.25) / 0.5)
    if ma > 0.01:
        sc = 40 * z * (0.7 + 0.3 * ma)
        pair(c, gx, gy, sc, (gx + ax) / 2, t, ma, ma, roll=0.2 * math.sin(t * 0.8))
        sx = (gx + ax) / 2
        for j in range(9):
            y = gy - 150 + j * 34
            c.drawLine(sx, y, sx, y + 18, SP((255, 255, 255), 4, 170 * ma))


def shot2(c, t):
    u = (t - C1) / (C2 - C1)
    z = lerp(2.3, 2.55, ease_io(u)); tx, ty = lerp(470, 490, u), lerp(770, 760, u)
    kitchen(c, t, z, tx, ty, glow_g=smooth((t - T_SMELL2) / 0.6) * 0.7, wisps=False)
    kw, _, _, _ = cook_state(t)
    sp = A.held(kw, 'n')[0]
    s0 = to_screen(z, tx, ty, sp[0] - 10, sp[1] - 150)
    tgt = (800, 560)
    k = smooth((t - T_SMELL2 + 0.2) / 1.6)
    wisp(c, t, s0[0], s0[1], tgt[0], tgt[1], k, G, 5, r0=40)
    rising(c, t, s0[0], s0[1], G, 3, 260)
    ma = smooth((t - T_CARV1 + 0.35) / 0.5)
    if ma > 0.01:
        pr = proj(BASE @ M.rot(0.0, 0.25 * math.sin(t * 0.9)).T, tgt[0], tgt[1] + 8 * math.sin(t * 1.3), 62 * (0.8 + 0.2 * ma))
        M.draw(c, pr, 62, ma, G, ma)
        L.chip(c, 'SPEARMINT', tgt[0], tgt[1] + 210, G, 40, ma)


def shot3(c, t):
    u = (t - C2) / (C3 - C2)
    z = lerp(2.45, 2.8, ease_io(u)); tx, ty = lerp(760, 750, u), lerp(1200, 1215, u)
    hl = smooth((t - T_CARAWAY) / 0.5)
    kitchen(c, t, z, tx, ty, seed_hl=hl * 0.85, wisps=False)
    src = to_screen(z, tx, ty, A.LOAF[0], A.LOAF[1] - 60)
    tgt = (560, 640)
    rising(c, t, src[0], src[1], AMB, 4, 300, 0.5 + 0.5 * hl)
    if hl > 0.01:
        L.chip(c, 'CARAWAY SEEDS', 540, 1290, AMB, 40, hl * (1 - smooth((t - T_FULL) / 0.4)))
    k = smooth((t - T_FULL + 0.2) / 1.2)
    wisp(c, t, src[0], src[1], tgt[0], tgt[1], k, AMB, 6, r0=42)
    ma = smooth((t - T_CARV2 + 0.3) / 0.5)
    if ma > 0.01:
        ps = proj(MIRR @ M.rot(0.0, -0.25 * math.sin(t * 0.9)).T, tgt[0], tgt[1] + 8 * math.sin(t * 1.3), 62 * (0.8 + 0.2 * ma))
        M.draw(c, ps, 62, ma, AMB, ma)
        L.chip(c, 'CARVONE', tgt[0], tgt[1] + 210, AMB, 40, ma)


def mirror_pane(c, mx, y0, y1, t, a=1.0, sweep=0.0):
    w = 26
    c.drawRect(skia.Rect(mx - w, y0, mx + w, y1), P((200, 230, 240), 40 * a))
    c.drawRect(skia.Rect(mx - w, y0, mx + w, y1), SP((235, 250, 255), 3, 160 * a))
    if sweep > 0.0:
        yy = lerp(y0 - 200, y1 + 200, sweep)
        g = skia.GradientShader.MakeLinear([skia.Point(0, yy - 120), skia.Point(0, yy + 120)], [skia.Color4f(1, 1, 1, 0).toColor(), skia.Color4f(1, 1, 1, 0.8 * a).toColor(), skia.Color4f(1, 1, 1, 0).toColor()])
        c.save(); c.clipRect(skia.Rect(mx - w, y0, mx + w, y1)); c.drawPaint(skia.Paint(Shader=g)); c.restore()


def shot4(c, t):
    u = (t - C3) / (C4 - C3)
    blurred_kitchen(c, t, z=lerp(1.25, 1.3, u))
    z = lerp(1.0, 1.06, ease_io(u))
    c.save(); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    pa = math.exp(-((t - T_ATOMS - 0.15) / 0.35) ** 2); pb = math.exp(-((t - T_BONDS - 0.15) / 0.35) ** 2)
    fl = smooth((t - T_FLIP + 0.1) / 0.5)
    mirror_pane(c, 540, 560, 1300, t, 1.0, smooth((t - T_FLIP) / 0.9) if t > T_FLIP else 0.0)
    pr, ps = pair(c, 290, 920, 96, 540, t, 1.0, 1.0, pa, pb, roll=0.12 * math.sin(t * 0.7))
    if fl > 0.01:
        for i in range(len(pr)):
            if abs(pr[i, 0] - 540) < 8: continue
            x0, y0 = pr[i, :2]; x1, y1 = ps[i, :2]
            n = int(abs(x1 - x0) / 24)
            for j in range(n):
                if (j % 2): continue
                xa = lerp(x0, x1, j / n); xb = lerp(x0, x1, (j + 0.6) / n)
                if abs((xa + xb) / 2 - 540) > 540 * fl: continue
                c.drawLine(xa, y0, xb, y1 if False else y0, SP((255, 240, 180), 3, 150 * fl))
    L.chip(c, 'SPEARMINT', 290, 1225, G, 38, 1.0)
    L.chip(c, 'CARAWAY', 790, 1225, AMB, 38, 1.0)
    c.restore()


def shot5(c, t):
    u = (t - C4) / (C5 - C4)
    blurred_kitchen(c, t, r=20, dark=0.3, z=lerp(1.4, 1.45, u))
    z = lerp(1.0, 1.05, ease_io(u))
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-540, -1000)
    br = 6 * math.sin(t * 1.4)
    RX, RY = 760, 900 + br
    lay = ease_io((t - T_LAY) / 0.95)
    lx = lerp(320, RX - 8, lay); ly = lerp(900 - br, RY - 14, lay)
    flip = 1.0 - 2.0 * ease_io((t - T_TURNS + 0.05) / 0.7)
    lift = 30 * math.sin(math.pi * ease_io((t - T_TURNS + 0.05) / 0.7))
    hl1 = smooth((t - T_OTHER - 0.1) / 0.25) * (1 - smooth((t - T_TURNS + 0.1) / 0.3))
    hl2 = smooth((t - T_NEVER) / 0.25)
    pl = smooth((t - T_LEFT + 0.1) / 0.3) * (1 - smooth((t - T_LAY) / 0.3))
    pr_ = smooth((t - T_RIGHT + 0.1) / 0.3) * (1 - smooth((t - T_LAY) / 0.3))
    if lay < 0.02:
        for j in range(18):
            y = 420 + j * 40
            c.drawLine(540, y, 540, y + 22, SP((255, 255, 255), 4, 150))
    HD.draw_hand(c, RX, RY, 1, 1.0, 8, 1.45, hl=max(hl1, hl2) * 0.9, forearm_to=(900, 2100))
    HD.draw_hand(c, lx, ly - lift, -1, flip, lerp(-8, 6, lay), 1.45, hl=max(hl1, hl2) * 0.9, forearm_to=(lerp(180, 420, lay), 2100))
    if pl > 0.01: L.chip(c, 'LEFT', 320, 1240, Wt, 44, pl)
    if pr_ > 0.01: L.chip(c, 'RIGHT', 760, 1240, Wt, 44, pr_)
    if hl1 > 0.01: L.chip(c, 'THUMBS DON\'T MATCH', 540, 1250, R, 40, hl1)
    if hl2 > 0.01: L.chip(c, 'PALM FACES AWAY', 540, 1250, R, 40, hl2)
    c.restore()


def shot6(c, t):
    u = (t - C5) / (C6 - C5)
    blurred_kitchen(c, t, z=1.3)
    z = lerp(1.0, 1.05, ease_io(u))
    c.save(); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
    mx, cy, sc = 540, 980, 112
    tilt = 0.15 * ease_io(u)
    k = ease_io((t - C5 - 0.05) / 1.1)
    # caraway (S) stays; spearmint (R) slides over it and turns to the best possible fit
    ps3 = MIRR - RC_S
    S_c = (mx + 250, cy)
    pS = proj(ps3, *S_c, sc, tilt)
    rot = FIT(k)
    pr3 = rot.apply(BASE - RC_R)
    R_c = (lerp(mx - 250, S_c[0], k), cy - 10 * math.sin(math.pi * k))
    pR = proj(pr3, *R_c, sc, tilt)
    # centre the pair in the frame as they come together
    off = lerp(0, -250, k)
    pS[:, 0] += off; pR[:, 0] += off
    miss = smooth((t - C5 - 1.0) / 0.35)
    M.draw(c, pS, sc, 1.0, AMB, 0.8, hl_st=miss, hl_set=(8, 9, 10), tint=AMB, tint_a=0.35, hl_col=AMB)
    M.draw(c, pR, sc, 0.62, G, 0.6, hl_st=miss, ghost=True, hl_set=(8, 9, 10), tint=G, tint_a=0.5, hl_col=G)
    if miss > 0.01:     # an arrow from each side group's label to its group: two different places
        for P3, col, lab, dx in ((pR, G, 'SPEARMINT', -1), (pS, AMB, 'CARAWAY', 1)):
            gx, gy = P3[[8, 9, 10], 0].mean(), P3[[8, 9, 10], 1].mean()
            lx, ly = 540 + dx * 290, max(600, gy - 150)
            c.drawLine(lx, ly + 26, gx - dx * 40, gy - 30, SP(col, 6, 230 * miss))
            L.chip(c, lab, lx, ly, col, 34, miss)
    la = 1 - smooth((k - 0.2) / 0.15)
    if la > 0.01:
        L.chip(c, 'SPEARMINT', R_c[0] + off, 1230, G, 38, la)
        L.chip(c, 'CARAWAY', S_c[0] + off, 1230, AMB, 38, la)
    if miss > 0.01:
        L.chip(c, "SIDE GROUP DOESN'T MATCH", 540, 1240, R, 38, miss)
    c.restore()


def shot7(c, t):
    u = (t - C6) / (LENS0 - C6)
    z = lerp(2.6, 3.1, ease_io(u)); tx, ty = lerp(425, 415, u), lerp(800, 790, u)
    kitchen(c, t, z, tx, ty, wisps=False, glow_g=0.4)
    kw, _, _, _ = cook_state(t)
    sp = A.held(kw, 'n')[0]
    s0 = to_screen(z, tx, ty, sp[0] - 10, sp[1] - 130)
    rising(c, t, s0[0], s0[1], G, 7, 200)
    return z, tx, ty


def nose_screen(t):
    z, tx, ty = 3.1, 415, 790
    n = A.nose_pt(dict(A.BASE))
    return to_screen(z, tx, ty, *n)


INSET = (955, 1250, 100)


def receptor_shot(c, t):
    N.scene(c, t, glow=(smooth((t - T_EACH - 0.75) / 0.3), smooth((t - T_FITS - 0.2) / 0.3)),
            open_hl=smooth((t - T_KY2) / 0.3) * (1 - smooth((t - T_EACH) / 0.4)))
    # the two carvones drift in the mucus, then each docks into its own receptor
    for i, (base, col, dk0, x0) in enumerate(((BASE, G, T_EACH, 250), (MIRR, AMB, T_EACH + 0.4, 690))):
        d = ease_io((t - dk0) / 0.75)
        fx, fy = x0 + 40 * math.sin(t * 0.8 + i * 2), 660 + 30 * math.sin(t * 1.1 + i)
        dx, dy = N.dock_pt(i)
        x, y = lerp(fx, dx, d), lerp(fy, dy, d)
        roll = (1 - d) * 0.6 * math.sin(t * 0.9 + i * 1.7) + (0.3 if i == 0 else -0.3)
        pp = proj(base @ M.rot(0.0, roll).T, x, y, 50)
        M.draw(c, pp, 50, smooth((t - LENS0 - 0.3) / 0.4), col, 0.8)
        L.chip(c, 'SPEARMINT' if i == 0 else 'CARAWAY', x, y - 150, col, 34, smooth((t - LENS0 - 0.4) / 0.3) * (1 - 0.0 * d))
    L.chip(c, 'SMELL RECEPTORS', 540, 1290, (200, 180, 255), 38, smooth((t - T_REC) / 0.3))


def shot8(c, t):
    """the lens from his nose into the epithelium; his face stays in a round inset"""
    lu = ease_io((t - LENS0) / 0.55)
    z, tx, ty = 3.1, 415, 790
    kitchen(c, t, z, tx, ty, wisps=False, glow_g=0.4)
    nx, ny = nose_screen(t)
    rad = lerp(10, 2300, lu)
    c.save(); p = skia.Path(); p.addCircle(nx, ny, rad); c.clipPath(p, skia.ClipOp.kIntersect, True)
    receptor_shot(c, t)
    c.restore()
    if lu < 1: c.drawCircle(nx, ny, rad, SP((255, 255, 255), 6, 200))
    ia = smooth((t - LENS0 - 0.45) / 0.35)
    if ia > 0.01:
        ix, iy, ir = INSET
        c.save(); q = skia.Path(); q.addCircle(ix, iy, ir * ia); c.clipPath(q, skia.ClipOp.kIntersect, True)
        kitchen(c, t, 1.35, 430 - (ix - 540) / 1.35, 800 - (iy - 960) / 1.35, wisps=False, glow_g=0.4)
        c.restore()
        c.drawCircle(ix, iy, ir * ia, SP((255, 255, 255), 7, 230))


def shot9(c, t):
    """the inset grows back into the kitchen: mint, then the rye slice"""
    g = ease_io((t - LENS1) / 0.6)
    zf, txf, tyf = lerp(1.6, 1.68, ease_io((t - LENS1) / (T_FREE - LENS1))), 560, lerp(950, 960, (t - LENS1) / 4)
    if g < 1:
        receptor_shot(c, t)
        ix, iy, ir = INSET
        r = lerp(ir, 1300, g); cx_, cy_ = lerp(ix, 540, g), lerp(iy, 960, g)
        c.save(); q = skia.Path(); q.addCircle(cx_, cy_, r); c.clipPath(q, skia.ClipOp.kIntersect, True)
        kitchen(c, t, zf, txf, tyf, glow_g=0.8, glow_a=smooth((t - T_RYE3 + 0.3) / 0.5))
        c.restore()
        c.drawCircle(cx_, cy_, r, SP((255, 255, 255), 7, 230 * (1 - g)))
    else:
        kitchen(c, t, zf, txf, tyf, glow_g=0.8 * (1 - 0.5 * smooth((t - T_ITS2) / 0.5)), glow_a=smooth((t - T_RYE3 + 0.3) / 0.5))
    ga = smooth((t - LENS1 - 0.3) / 0.4)
    if ga > 0.01:
        kw, ph, far, m = cook_state(t)
        sp = to_screen(zf, txf, tyf, *A.held(kw, 'n')[0])
        L.chip(c, 'MINT', sp[0] + 40, sp[1] - 300, G, 40, ga * (1 - smooth((t - T_ITS2) / 0.3)))
        ra = smooth((t - T_RYE3 + 0.25) / 0.4)
        if ra > 0.01 and ph == 'lift':
            q = to_screen(zf, txf, tyf, *A.held(kw, 'f')[0])
            L.chip(c, 'RYE BREAD', min(q[0] + 200, 880), q[1] - 40, AMB, 40, ra)


def shot10(c, t):
    u = ease_io((t - T_FREE + 0.3) / 1.8)
    z = lerp(1.68, 1.18, u); tx = 560; ty = lerp(960, 990, u)
    kitchen(c, t, z, tx, ty, glow_g=0.4, glow_a=0.8)


def scene(c, t):
    if t < C1: shot1(c, t)
    elif t < C2: shot2(c, t)
    elif t < C3: shot3(c, t)
    elif t < C4: shot4(c, t)
    elif t < C5: shot5(c, t)
    elif t < C6: shot6(c, t)
    elif t < LENS0: shot7(c, t)
    elif t < LENS1: shot8(c, t)
    elif t < T_FREE - 0.3: shot9(c, t)
    else: shot10(c, t)


FIX = {'kyral.': 'chiral.', 'kyral': 'chiral', 'FLIPPED,': 'flipped,', 'levlprep': 'levlprep'}
SHORT = kit.Short(WD, 'ORGANIC CHEMISTRY', TITLES, scene, DUR, T_END, fix=FIX, cuts=CUTS)

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, st, OUT)
