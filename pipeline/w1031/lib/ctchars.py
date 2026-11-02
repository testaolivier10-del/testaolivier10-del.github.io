"""The w1031 people built in code with the cperson kit (replaces the traced tchars.py; same public API, same reference
coordinate frames, so the builds only change their import). The reference sheets in ref/ are model sheets only (cast,
colours, proportions, poses); nothing from them is traced or pasted.

Casts (each from its own story's sheet):
- Phineas Gage 1848 (ref/gage_tamp.png, gage_sit.png, dusk_group2.png): lean, brown brimmed hat, dark side parted
  hair, cream shirt with rolled sleeves, brown vest, suspenders, grey blue trousers, brown boots; the healed scar
  under his LEFT cheek in the dusk scene (the iron went in there).
- Two railroad workers (ref/workers_kneel.png, dusk_group2.png): a stout red bearded man in a grey flat cap and red
  shirt with brown trousers; a lean dark haired man in a black brimmed hat, blue shirt, grey vest, tan trousers.
- Ice rescue (ref/ice_hole3.png, sled.png): the patient (navy puffer jacket and navy beanie, pale, eyes half shut);
  a broad rescuer in a red drysuit with a white helmet and lamp; a smaller rescuer in an orange drysuit with a
  yellow helmet, headlamp and a low ponytail.
"""
import math
import numpy as np, skia
from cperson import (Spec, Pose, Person, Light, V, P, C, union, inter, diff, poly, smooth_closed, circle, hull2, tube,
                     plate, rim_path, mix, dark, smooth, blink_at, ik2, Head)
from walk import Gait


def _clip_poly(pts):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p


def rot_about(px, py, deg):
    m = skia.Matrix(); m.setRotate(deg, px, py); return m


def _light_from(rim, default_sd, rim_col=(255, 206, 120), rim_a=200):
    """tchars took rim=((r, g, b), (dx, dy), alpha): the rim offset points away from the light"""
    if rim is not None:
        col, off, a = rim
        return Light(sd=(-off[0], -off[1]), rim=col, rim_a=a)
    return Light(sd=default_sd, rim=rim_col, rim_a=rim_a)


# ===================================================================== the casts
GAGE = Spec(name='Phineas Gage', height=1.0, build=1.04, legs=0.8, torso=1.42, shoulders=1.02, head=1.0, jaw=1.08, chin=0.25, nose='straight', nose_size=0.62,
            ear_back=0.16, cheek_tone=0.0, jaw_shadow=0.0, sideburn=False,
            eye=0.95, brow=1.15, skin=(240, 174, 132), skin_sh=(212, 132, 100), hair=(64, 38, 28), hair_sh=(46, 26, 20),
            hair_style='side_part',
            top=dict(kind='shirt', col=(248, 236, 206), sh=(224, 204, 168), sleeves='rolled', collar=False),
            vest=dict(col=(104, 70, 46), sh=(78, 50, 34), buttons=(60, 40, 28), v=0.86), suspenders=(66, 42, 30),
            trousers=dict(col=(86, 102, 118), sh=(60, 74, 88), loose=1.1),
            boots=dict(col=(140, 80, 46), sh=(104, 58, 36), sole=(70, 42, 30), kind='boot', size=1.14),
            hat=dict(kind='brim', col=(134, 88, 54), sh=(104, 66, 40), band=(76, 48, 32), y=0.4, w=1.6, h=0.72))
GAGE_SCAR = Spec(**{**GAGE.__dict__, 'scar': True})

RED = Spec(name='red bearded worker', height=0.96, build=1.22, belly=0.85, shoulders=1.08, head=1.08, jaw=1.15, chin=0.0, nose='round', nose_size=1.1,
           eye=0.9, brow=1.3, skin=(240, 172, 136), skin_sh=(210, 128, 104), hair=(196, 92, 40), hair_sh=(160, 70, 32),
           brow_col=(176, 78, 34), beard='full', beard_col=(204, 96, 40), hair_style='cropped',
           top=dict(kind='shirt', col=(184, 66, 44), sh=(146, 46, 34), sleeves='long', collar=True),
           trousers=dict(col=(120, 82, 50), sh=(92, 60, 36), loose=1.2),
           boots=dict(col=(82, 50, 38), sh=(62, 36, 28), sole=(46, 30, 24), kind='boot', size=1.12),
           hat=dict(kind='flatcap', col=(118, 120, 116), sh=(92, 94, 92)))

DARK = Spec(name='black hat worker', height=1.04, build=0.88, shoulders=0.98, head=0.98, jaw=0.9, chin=0.4, nose='hook', nose_size=1.1,
            eye=0.95, brow=1.0, skin=(236, 176, 138), skin_sh=(206, 134, 104), hair=(34, 28, 30), hair_sh=(22, 18, 20),
            hair_style='short',
            top=dict(kind='shirt', col=(74, 122, 178), sh=(54, 94, 146), sleeves='rolled', collar=True),
            vest=dict(col=(120, 122, 116), sh=(94, 96, 92), buttons=(70, 70, 70), v=0.62),
            trousers=dict(col=(196, 158, 108), sh=(162, 126, 82), loose=1.0),
            boots=dict(col=(70, 44, 36), sh=(52, 32, 26), sole=(36, 24, 20), kind='boot', size=1.1),
            hat=dict(kind='brim', col=(40, 40, 46), sh=(26, 26, 32), band=(70, 70, 78), y=0.42, w=1.65, h=0.8))
DARK_DUSK = Spec(**{**DARK.__dict__, 'trousers': dict(col=(48, 50, 56), sh=(34, 36, 42), loose=1.0),
                    'boots': dict(col=(30, 30, 34), sh=(20, 20, 24), sole=(16, 16, 18), kind='shoe', size=1.1)})
RED_DUSK = Spec(**{**RED.__dict__, 'trousers': dict(col=(84, 76, 66), sh=(62, 56, 48), loose=1.2),
                   'boots': dict(col=(120, 70, 44), sh=(90, 50, 32), sole=(60, 36, 26), kind='boot', size=1.12)})

PATIENT = Spec(name='ice patient', height=1.0, build=1.0, head=1.06, jaw=1.0, chin=0.0, nose='button', nose_size=1.0, eye=1.0, brow=0.9,
               skin=(236, 198, 178), skin_sh=(178, 162, 186), cold=1.0, hair=(92, 60, 44), hair_sh=(70, 44, 34), hair_style='short',
               top=dict(kind='puffer', col=(46, 60, 120), sh=(32, 42, 92)), mouth_col=(132, 116, 168),
               trousers=dict(col=(40, 48, 86), sh=(28, 34, 64), loose=1.15),
               boots=dict(col=(34, 36, 50), sh=(24, 26, 36), sole=(18, 18, 24), kind='boot', size=1.1),
               gloves=((34, 40, 74), (24, 28, 56)),
               hat=dict(kind='beanie', col=(40, 52, 106), sh=(30, 38, 84), y=0.42))

RESC_RED = Spec(name='rescuer red', height=1.02, build=1.12, shoulders=1.1, head=1.12, jaw=1.08, chin=0.3, nose='straight', nose_size=1.0, eye=0.95,
                brow=1.05, skin=(238, 166, 128), skin_sh=(206, 122, 96), hair=(92, 56, 38), hair_sh=(70, 40, 28), hair_style='short',
                top=dict(kind='suit', col=(222, 44, 50), sh=(170, 26, 46), collar=True),
                trousers=dict(col=(222, 44, 50), sh=(170, 26, 46), loose=1.4, pocket=True),
                boots=dict(col=(40, 42, 64), sh=(28, 30, 48), sole=(20, 20, 30), kind='tall', size=1.12),
                gloves=((40, 46, 82), (28, 32, 62)), stripes=(196, 204, 220), patch=(186, 30, 44),
                hat=dict(kind='helmet', col=(244, 246, 250), sh=(206, 212, 226), band=(44, 54, 100), lamp=True))

RESC_ORANGE = Spec(name='rescuer orange', height=0.94, build=0.92, shoulders=0.94, head=1.12, jaw=0.85, chin=0.0, nose='button', nose_size=0.95, eye=1.05,
                   brow=0.85, skin=(196, 120, 88), skin_sh=(160, 88, 66), hair=(84, 42, 32), hair_sh=(62, 30, 24), hair_style='ponytail', lips=True, blush=0.6,
                   top=dict(kind='suit', col=(240, 128, 36), sh=(200, 90, 28), collar=True),
                   trousers=dict(col=(240, 128, 36), sh=(200, 90, 28), loose=1.4, pocket=True),
                   boots=dict(col=(40, 42, 64), sh=(28, 30, 48), sole=(20, 20, 30), kind='tall', size=1.08),
                   gloves=((40, 46, 82), (28, 32, 62)), stripes=None, patch=(250, 200, 70),
                   hat=dict(kind='helmet', col=(250, 186, 40), sh=(220, 146, 30), band=(44, 54, 100), lamp=True))

P_GAGE, P_GAGE_SCAR = Person(GAGE), Person(GAGE_SCAR)
P_RED, P_DARK, P_RED_D, P_DARK_D = Person(RED), Person(DARK), Person(RED_DUSK), Person(DARK_DUSK)
P_PAT, P_RR, P_RO = Person(PATIENT), Person(RESC_RED), Person(RESC_ORANGE)
P_PAT_WARM = Person(Spec(**{**PATIENT.__dict__, 'cold': 0.0}))
P_PAT_SLED = Person(Spec(**{**PATIENT.__dict__, 'cold': 0.0, 'hair_style': 'none', 'hat': dict(kind='beanie', col=(40, 52, 106), sh=(30, 38, 84), y=0.36)}))     # wrapped on the sled, warming


def plant(per, pose, side, pt, finger_dir=(-1.0, 0.0), prefer=(0.3, 1.0), kind='flat', back=34.0):
    """set an arm so the palm rests on the point pt (a surface: ground, knee, thigh, rim) with the fingers along finger_dir"""
    pt = V(pt); fd = V(finger_dir) / (np.hypot(*finger_dir) + 1e-9)
    J = per.skeleton(pose); u = J['R'] / (per.HEAD_R * per.sp.head)
    tgt = pt - fd * back * u
    for _ in range(3):
        setattr(pose, 'arm_' + side, ('ik', tuple(tgt), prefer))
        J = per.skeleton(pose)
        d = J['wr_' + side] - J['el_' + side]; d = d / (np.hypot(*d) + 1e-9)
        tgt = pt - (d * 0.5 + fd * 0.5) * back * u
    setattr(pose, 'arm_' + side, ('ik', tuple(tgt), prefer))
    J = per.skeleton(pose)
    d = J['wr_' + side] - J['el_' + side]
    rot = math.degrees(math.atan2(fd[1], fd[0]) - math.atan2(d[1], d[0]))
    rot = (rot + 180) % 360 - 180
    setattr(pose, 'hand_' + side, kind); setattr(pose, 'hand_rot_' + side, max(-70.0, min(70.0, rot)))
    return pose


def _in_ref(c, x0, y0, s, fn, flip=False):
    c.save(); c.translate(x0, y0); c.scale(-s if flip else s, s)
    r = fn(c)
    c.restore(); return r


# ===================================================================== Phineas Gage tamping (ref/gage_tamp.png frame)
TAMP_PIVOT = (470.0, 610.0)                                 # hip
TAMP_GRIP = (295.0, 480.0)
ROD_TOP, ROD_BOT = (305.0, 315.0), (265.0, 1150.0)
CHEEK = (430.0, 268.0)
TAMP_S = 1.02


def tamp_upper_matrix(lift, br):
    """upper body: tilts up a little as he raises the iron (lift 1) and presses down (lift 0); breathing"""
    m = rot_about(*TAMP_PIVOT, 11.0 * lift - 3.0 + 0.4 * br)
    m.postTranslate(0, 26 * (1 - lift))
    return m


def _rod_x(y):
    return ROD_BOT[0] + (y - ROD_BOT[1]) * (ROD_TOP[0] - ROD_BOT[0]) / (ROD_TOP[1] - ROD_BOT[1])


def tamp_pose(t, lift, br, knock=0.0, wound=0.0):
    m = tamp_upper_matrix(lift, br)
    rot = 11.0 * lift - 3.0 + 0.4 * br
    hp = m.mapXY(*TAMP_PIVOT)
    g1 = m.mapXY(*TAMP_GRIP); ox, oy = g1.x() - TAMP_GRIP[0], g1.y() - TAMP_GRIP[1]
    u = TAMP_S
    gf = V(_rod_x(418) + ox, 418 + oy); gn = V(_rod_x(462) + ox, 462 + oy)      # fists stacked at chest height
    # tamping: square over the iron, feet flat about shoulder width (turned a little toward us so the stance reads as
    # width, not a stride), knees soft, chest leaning over his hands, looking down at the hole
    pose = Pose(x=hp.x() + 44, y=1150 - P_GAGE.standing_hip(Pose(s=TAMP_S)) * 0.95 + 16 * (1 - lift), s=TAMP_S, face=-1, yaw=0.24, hips_yaw=0.4,
                lean=9 - 0.6 * rot, hunch=-2, br=br, nod=20 - 0.4 * rot, neck_lean=-6, ground=1150,
                leg_f=('ik', (470, 1150 - 70), (-1, -0.15)), leg_n=('ik', (560, 1150 - 70), (-1, -0.15)), foot_f=0.0, foot_n=0.0,
                hand_n='grip', hand_f='grip', mouth='closed', brow_ang=0.0, brow_up=0.0, eyes='open', look=(0.0, 0.9), blink=blink_at(t, 0.3), t=t, wound=wound)
    J = P_GAGE.skeleton(pose)
    for side, g in (('n', gn), ('f', gf)):
        d = g - J['sh_' + side]; d = d / (np.hypot(*d) + 1e-9)
        w = g - d * 40 * u
        setattr(pose, 'arm_' + side, ('ik', tuple(w), (1.0, 0.35)))       # elbows bent back and out: pushing down
    if knock > 0:
        k = smooth(knock); ka = smooth(knock * 2.4)       # the arms are thrown faster than the body tips
        pose.nod = pose.nod - 8 * k; pose.lean = pose.lean - 12 * k; pose.neck_lean = pose.neck_lean + 6 * k
        Jk = P_GAGE.skeleton(pose)
        # the blast throws both arms back and up behind his shoulders, hands open
        for side, (dx, dy) in (('n', (175, -10)), ('f', (150, -55))):
            sp = V(getattr(pose, 'arm_' + side)[1]); sh = Jk['sh_' + side]
            tgt = sh + V(dx, dy) * TAMP_S
            # swing the hand round the shoulder, down past the hip and up behind (a long straight arm, never folded
            # across the chest): interpolate angle and reach about the shoulder
            v0 = sp - sh; v1 = tgt - sh
            a0 = math.atan2(v0[1], v0[0]); a1 = math.atan2(v1[1], v1[0])
            while a1 > a0: a1 -= 2 * math.pi           # turn the way through straight down (facing left: decreasing angle)
            r0, r1 = float(np.hypot(*v0)), float(np.hypot(*v1))
            reach = (P_GAGE.UPPER + P_GAGE.FORE) * TAMP_S * 0.97
            rr = r0 + (r1 - r0) * ka + (reach - max(r0, r1)) * math.sin(math.pi * ka)
            aa = a0 + (a1 - a0) * ka
            w = sh + V(math.cos(aa), math.sin(aa)) * rr
            setattr(pose, 'arm_' + side, ('ik', tuple(w), (0.3, 1.0)))
        pose.hand_n = pose.hand_f = 'open' if ka > 0.25 else 'grip'
        pose.hand_rot_n = pose.hand_rot_f = 0.0
        pose.eyes = 'closed' if k > 0.1 else 'open'; pose.mouth = 'wince' if k > 0.1 else 'closed'; pose.brow_ang = 0.8 * k
    return pose


def _cheek_rest():
    """the point under his left (near) cheekbone in the held pose at the blast, mapped back to rest coordinates"""
    pose = tamp_pose(0.0, 0.0, 0.0)
    J = P_GAGE.skeleton(pose)
    q, _ = P_GAGE.head_model(pose, J).p(0.45, -0.5, 0.8)
    inv = skia.Matrix(); tamp_upper_matrix(0.0, 0.0).invert(inv)
    r = inv.mapXY(float(q[0]), float(q[1]))
    return (r.x(), r.y())


TAMP_FEET = []     # [(x_left, x_right, ground_y)] in screen px per boot, set by draw_tamp (unrotated), for contact shadows


def draw_tamp(c, t, x0, y0, s, lift, br, knock=0.0, heel=None, hat_fly=0.0, wound=0.0):
    """knock: 0..1, thrown backward (to the right, away from the blast) about the heel; hat_fly: 0..1 the hat flies off;
    wound: 0..1 the entry wound under his left cheekbone (the scene sets it from the moment of impact)"""
    pose = tamp_pose(t, lift, br, knock, wound)
    lt = Light(sd=(0.75, -0.66), rim=(255, 206, 120), rim_a=210)
    c.save()
    if heel is None:           # he tips back about his back heel, so his whole body (boots included) stays joined
        Jh = P_GAGE.skeleton(tamp_pose(t, lift, br, 0.0))
        heel = (float(Jh['an_n'][0]) + 30.0, 1150.0)
    if knock > 0:
        c.translate(x0 + heel[0] * s, y0 + heel[1] * s); c.rotate(24 * knock); c.translate(-(x0 + heel[0] * s), -(y0 + heel[1] * s))
    c.save(); c.translate(x0, y0); c.scale(s, s)
    if hat_fly > 0:
        J = P_GAGE.skeleton(pose)
        hc = J['head'] - V(0, J['R'] * 0.9)
        d = (260 * hat_fly, -420 * hat_fly + 300 * hat_fly * hat_fly)
        hm = rot_about(hc[0] + d[0], hc[1] + d[1], 220 * hat_fly); hm.preTranslate(*d)
        pose.hat_m = hm
    J = P_GAGE.draw(c, pose, lt, t)
    TAMP_FEET[:] = [(x0 + float(J['an_' + k][0] - 40 * TAMP_S) * s, x0 + float(J['an_' + k][0] + 150 * TAMP_S) * s, y0 + 1150 * s) for k in ('n', 'f')]
    if hat_fly > 0:
        # the hat is drawn last, in flight, with its own rim
        H = P_GAGE.head_model(pose, J)
        P_GAGE.draw_hat(c, lt, pose, H, J['u'], t)
        hu = union([p for p, *_ in P_GAGE.hat_paths(pose, H, t)]); hu.transform(pose.hat_m)
        rim_path(c, lt, hu)
    c.restore()
    c.restore()


CHEEK = _cheek_rest()


def head_clip_screen(x0, y0, s, lift=0.0, br=0.0):
    """his head (below the hat brim) in screen space, to hide the part of the iron that is inside it"""
    p = _clip_poly([(395, 205), (520, 205), (530, 300), (470, 330), (405, 300)])
    p.transform(tamp_upper_matrix(lift, br))
    m = skia.Matrix(); m.setScaleTranslate(s, s, x0, y0); p.transform(m)
    return p


def grip_screen(x0, y0, s, lift, br):
    m = tamp_upper_matrix(lift, br)
    p = m.mapXY(*TAMP_GRIP)
    return (x0 + p.x() * s, y0 + p.y() * s), (x0 + TAMP_GRIP[0] * s, y0 + TAMP_GRIP[1] * s)


# ===================================================================== Gage sitting, talking (ref/gage_sit.png frame)
def sit_pose(t, talk, daze, wound=1.0):
    br = math.sin(t * 1.5)
    nod = (2.5 * math.sin(t * 5.5) * talk) + (-3 * daze * (0.5 + 0.5 * math.sin(t * 0.9)))
    wave = 7 * math.sin(t * 4.2) * talk - 10 * (1 - talk)
    hx, hy = 640 + 10 * math.sin(t * 4.2) * talk, 330 + 30 * (1 - talk) + 6 * math.cos(t * 4.2) * talk
    return Pose(x=780, y=640 - 2 * br, s=1.12, face=-1, yaw=0.3, hat_off=True, lean=-17, hunch=-2, br=br, head_face=1, head_yaw=0.5, nod=4 + nod, roll=3,
                leg_f=('ik', (160, 700), (-1, -1)), foot_f=-82, leg_n=('ik', (395, 676), (0, -1)), foot_n='auto',
                arm_f=('ik', (1020, 690), (1, -0.4)), hand_f='flat', hand_rot_f=0,
                arm_n=('ik', (hx, hy), (0.4, 1.0)), hand_n='gesture', hand_rot_n=wave - 30,
                mouth='talk' if talk > 0.05 else 'closed', talk=0.5 + 0.5 * math.sin(t * 11) if talk > 0.05 else 0.0,
                brow_up=0.05 * daze, brow_ang=0.4 * daze + 0.25, eyes='half' if daze > 0.6 else 'open', blink=blink_at(t, 1.1),
                look=(0.3, 0.0), ground=735, far_leg_front=False, t=t, wound=wound)


def draw_sit(c, t, x0, y0, s, talk=0.0, daze=1.0, wound=1.0):
    pose = sit_pose(t, talk, daze, wound)
    plant(P_GAGE, pose, 'f', (1018, 733), finger_dir=(1, 0.05), prefer=(1, -0.4))
    lt = Light(sd=(0.75, -0.66), rim=(255, 206, 120), rim_a=200)
    _in_ref(c, x0, y0, s, lambda cv: P_GAGE.draw(cv, pose, lt, t))


# ===================================================================== two kneeling workers (ref/workers_kneel.png frame)
def workers_poses(t):
    br = math.sin(t * 1.3)
    g = 722
    red = Pose(x=598, y=P_RED.kneel_hip_y(0.98, g, 12), s=0.98, face=-1, yaw=0.36, lean=26, hunch=10, br=br, nod=6 + 2.0 * math.sin(t * 1.3), head_yaw=0.42,
               neck_lean=-10,
               leg_f=('ik', (432, g - 66), (-1, -1)), foot_f='auto', leg_n=('fk2', 12, -74), foot_n='auto',
               arm_f=('ik', (330 + 8 * math.sin(t * 1.7), 540 + 10 * math.sin(t * 1.7)), (0.2, 1)), hand_f='open', hand_rot_f=-20,
               arm_n=('ik', (650, 530), (1, 0.2)), hand_n='relaxed', brow_ang=0.7, brow_up=0.03, mouth='sad', look=(-0.5, -0.3),
               blink=blink_at(t, 0.5), ground=g, t=t)
    dark_ = Pose(x=915, y=P_DARK.kneel_hip_y(0.98, g, 8), s=0.98, face=-1, yaw=0.32, lean=14, hunch=6, br=math.sin(t * 1.1 + 1), nod=8 + 1.5 * math.sin(t * 1.1 + 1), head_yaw=0.42,
                 leg_f=('ik', (772, g - 66), (-1, -1)), foot_f='auto', leg_n=('fk2', 8, -74), foot_n='auto',
                 arm_f=('ik', (835, 505), (1, 0.4)), hand_f='relaxed', hand_rot_f=10, far_arm_front=True,
                 arm_n=('ik', (1000, 470), (1, 0.5)), hand_n='relaxed', brow_ang=0.8, brow_up=0.03, mouth='sad', look=(-0.8, 0.1),
                 blink=blink_at(t, 1.9), ground=g, t=t)
    # hands on surfaces: the red man reaches to the ground toward Gage and steadies himself on his front knee; the dark
    # man rests a forearm on his front knee and sets his other hand on his hip
    Jr = P_RED.skeleton(red); Jd = P_DARK.skeleton(dark_)
    # the red man reaches toward Gage, hand open and low, palm down (about to steady him)
    red.arm_f = ('ik', (268 + 6 * math.sin(t * 1.7), 548 + 4 * math.sin(t * 1.3)), (0.3, 1.0)); red.hand_f = 'gesture'; red.hand_rot_f = 20
    plant(P_DARK, dark_, 'n', Jd['pelvis'] + V(26, -10), finger_dir=(-0.3, 1), prefer=(1, 0.2), kind='relaxed')
    plant(P_RED, red, 'n', Jr['kn_f'] + V(10, -36), finger_dir=(-1, 0.5), prefer=(1, 0.3), kind='relaxed')
    plant(P_DARK, dark_, 'f', Jd['kn_f'] + V(-6, -40), finger_dir=(-1, 0.7), prefer=(1, 0.4), kind='relaxed')
    return red, dark_


def draw_workers(c, t, x0, y0, s):
    red, dk = workers_poses(t)
    lt = Light(sd=(0.75, -0.66), rim=(255, 206, 120), rim_a=200)
    def fn(cv):
        P_DARK.draw(cv, dk, lt, t)
        P_RED.draw(cv, red, lt, t)
    _in_ref(c, x0, y0, s, fn)


# ===================================================================== dusk: Gage, then his two friends
DUSK_GAGE_S = 0.62


def dusk_gage_pose(t, turn, walk_u=None):
    br = math.sin(t * 1.4)
    pose = Pose(x=140, y=690 - P_GAGE_SCAR.standing_hip(Pose(s=DUSK_GAGE_S)) * 0.995, s=DUSK_GAGE_S, face=1, yaw=0.62, lean=2, br=br,
                head_yaw=0.62 - 0.55 * turn, head_face=1 if turn < 0.55 else -1, nod=-3 + 2 * turn, roll=2 * turn,
                arm_n=('ang', 4, 20, 9), arm_f=('ang', 2, 18, 7), leg_n=('ang', 0, 0, 3), leg_f=('ang', 0, 0, 3),
                eyes='open', blink=0.55 if turn < 0.3 else 0.4, mouth='sad', brow_ang=0.6, look=(0, -0.8), ground=690, t=t)
    return pose


DUSK_WALK = dict(t0=None, v=185.0, step_scale=1.0)


def draw_dusk_gage(c, t, x0, y0, s, turn=0.0, tint=None, walk_t0=None):
    """turn: 0 he stands three quarter toward his friends, eyes shut; 1 he turns his head away (the scar on his left
    cheek toward us). walk_t0: from this time he turns and walks slowly away to the left (foot locked walk)."""
    # a little lighter than his friends (half the dusk tint), so the walk away reads
    lt = Light(sd=(-0.78, -0.62), rim=(255, 176, 128), rim_a=210, tint=(tint[0], tint[1] * 0.32) if tint else None)
    pose = dusk_gage_pose(t, turn)
    if walk_t0 is not None and t > walk_t0:
        u = t - walk_t0
        g = dusk_gait()
        TT = 0.3
        st, feet = g.state(max(0.0, u - TT))
        if u < TT:
            # he turns through facing us: yaw opens to front on his own side, then closes on the other side
            f0 = pose.face; yw0 = pose.yaw
            k1 = smooth(u / (TT / 2)); k2 = smooth((u - TT / 2) / (TT / 2))
            if u < TT / 2:
                pose.yaw = yw0 + (0.9 - yw0) * k1
                if hasattr(pose, 'head_yaw') and pose.head_yaw is not None: pose.head_yaw = pose.head_yaw + (0.9 - pose.head_yaw) * k1
            else:
                pose.face = -f0 if f0 == 1 else -1
                pose.yaw = 0.9 + (0.12 - 0.9) * k2; pose.head_face = pose.face; pose.head_yaw = 0.9 + (0.22 - 0.9) * k2
        else:
            for k_, v_ in st.items(): setattr(pose, k_, v_)
            pose.yaw = 0.12; pose.head_face = -1; pose.head_yaw = 0.22; pose.nod = 2 + st['nod']; pose.lean = 2 + 1.0 * math.sin(u * 3); pose.hunch = 0; pose.neck_lean = -4
            pose.hand_n = pose.hand_f = 'relaxed'
            # soft elbows while walking: the gait's swing angle with an extra bend
            pose.arm_n = ('ang', st['arm_n'][1], st['arm_n'][2] + 22); pose.arm_f = ('ang', st['arm_f'][1], st['arm_f'][2] + 22)
    if walk_t0 is None or t <= walk_t0:
        Jg = P_GAGE_SCAR.skeleton(pose); ug = Jg['R'] / (P_GAGE_SCAR.HEAD_R * P_GAGE_SCAR.sp.head)
        for sd in ('n', 'f'):
            sh_ = Jg['sh_' + sd]; o = 1 if sh_[0] > Jg['pelvis'][0] else -1
            L_ = (P_GAGE_SCAR.UPPER + P_GAGE_SCAR.FORE) * ug
            setattr(pose, 'arm_' + sd, ('ik', (sh_[0] + o * 6 * ug + 0.32 * L_, sh_[1] + 0.9 * L_), (-1, 0.2)))
        pose.hand_n = pose.hand_f = 'relaxed'
    _in_ref(c, x0, y0, s, lambda cv: P_GAGE_SCAR.draw(cv, pose, lt, t))


def dusk_gait():
    return Gait(P_GAGE_SCAR, DUSK_GAGE_S, 140, 690, dir=-1, v=DUSK_WALK['v'], style='walk', yaw=0.12, step_scale=DUSK_WALK['step_scale'])


def draw_dusk_friends(c, t, x0, y0, s, lean=0.0, tint=None):
    lt = Light(sd=(-0.78, -0.62), rim=(255, 170, 120), rim_a=190, tint=tint)
    s1, s2 = 0.62, 0.64
    br = math.sin(t * 1.2)
    red = Pose(x=135, y=690 - P_RED_D.standing_hip(Pose(s=s1)) * 0.995, s=s1, face=-1, yaw=0.62, lean=1, br=br,
               nod=8 + 4 * lean + 1.2 * math.sin(t * 1.2), roll=3 * lean, head_yaw=0.66,
               arm_n=('ang', 6, 26, 12), arm_f=('ang', 4, 22, 8), hand_n='relaxed', hand_f='relaxed', leg_n=('ang', 0, 0, 3), leg_f=('ang', 0, 0, 3),
               brow_ang=0.6, brow_up=0.03, mouth='frown', look=(-0.6, 0.0), blink=blink_at(t, 0.4), ground=690, t=t)
    sh_d = 0.0
    dk = Pose(x=350, y=690 - P_DARK_D.standing_hip(Pose(s=s2)) * 0.995, s=s2, face=-1, yaw=0.55, lean=2, br=math.sin(t * 1.0 + 2),
              nod=6 + 3 * lean + 1.0 * math.sin(t * 1.0 + 2), roll=-4 * lean, head_yaw=0.6,
              leg_n=('ang', 0, 0, 3), leg_f=('ang', 0, 0, 3), brow_ang=0.7, brow_up=0.05, mouth='sad', look=(-0.7, 0.0),
              blink=blink_at(t, 2.2), ground=690, t=t, far_arm_front=True)
    J = P_DARK_D.skeleton(dk)
    # arms crossed: each hand rests on the other forearm in front of the chest
    chest = J['at'](0.58)[0]
    dk.arm_n = ('ik', tuple(chest + V(-62, 14)), (0.4, 1)); dk.hand_n = 'fist'
    dk.arm_f = ('ik', tuple(chest + V(36, 0)), (-0.4, 1)); dk.hand_f = 'fist'
    # the red man's arms hang with soft elbows, hands relaxed at the top of the thighs
    Jr = P_RED_D.skeleton(red); ur = Jr['R'] / (P_RED_D.HEAD_R * P_RED_D.sp.head)
    for sd in ('n', 'f'):
        sh_ = Jr['sh_' + sd]; o = 1 if sh_[0] > Jr['pelvis'][0] else -1
        L_ = (P_RED_D.UPPER + P_RED_D.FORE) * ur
        setattr(red, 'arm_' + sd, ('ik', (sh_[0] + o * 0.1 * L_ - 0.12 * L_, sh_[1] + 0.92 * L_), (o, -0.3)))
    red.hand_n = red.hand_f = 'relaxed'
    def fn(cv):
        P_DARK_D.draw(cv, dk, lt, t)
        P_RED_D.draw(cv, red, lt, t)
    _in_ref(c, x0, y0, s, fn)


# ===================================================================== ice rescue group (ref/ice_hole3.png frame)
PATIENT_X = 660.0
PAT_S = 0.80


def ice_poses(t, lift_px, lean):
    br = math.sin(t * 1.6)
    L = lift_px
    pat = Pose(x=PATIENT_X, y=712 - L, s=PAT_S, face=1, yaw=1.0, lean=0, br=0.6 * br, nod=6 - 6 * min(1, L / 120), roll=2 * math.sin(t * 0.7),
               leg_n=('fk2', -18, 12), leg_f=('fk2', 18, -12), mouth='talk', talk=0.12, eyes='open', blink=0.48, brow_ang=0.75, brow_up=0.08, look=(0.0, -0.3), t=t, far_arm_front=True)
    J = P_PAT.skeleton(pat)
    k = smooth((L - 70) / 110.0)
    # forearms and hands rest on the ice of the far rim at the sides of the hole (above the waterline, never in front of
    # the near lip); when he is lifted his arms hang limp at his sides, hands open
    rim_n = V(PATIENT_X - 252, 612); rim_f = V(PATIENT_X + 252, 612)
    hang_n = J['sh_n'] + V(26, 200); hang_f = J['sh_f'] + V(-26, 200)
    pat.arm_n = ('ik', tuple(rim_n * (1 - k) + hang_n * k), (-0.7 * (1 - k) - 0.3 * k, -0.5 * (1 - k) + 0.2 * k)); pat.hand_n = 'flat' if k < 0.5 else 'relaxed'; pat.hand_rot_n = 0
    pat.arm_f = ('ik', tuple(rim_f * (1 - k) + hang_f * k), (0.7 * (1 - k) + 0.3 * k, -0.5 * (1 - k) + 0.2 * k)); pat.hand_f = 'flat' if k < 0.5 else 'relaxed'; pat.hand_rot_f = 0
    if k < 0.5:
        plant(P_PAT, pat, 'n', rim_n, finger_dir=(-1, 0.0), prefer=(-0.7, -0.5)); plant(P_PAT, pat, 'f', rim_f, finger_dir=(1, 0.0), prefer=(0.7, -0.5))
    J = P_PAT.skeleton(pat)
    # the rescuers' hands go under his armpits, on the jacket
    grip_l = J['sh_n'] + V(-8, 62); grip_r = J['sh_f'] + V(8, 62)
    up = lean
    # kneeling on one knee: back knee on the ice with the shin flat and toes tucked; front foot flat on solid ice
    # outside the rim, the front thigh running from the hip to a knee below the chest
    red = Pose(x=244 + 24 * up, y=P_RR.kneel_hip_y(0.78, 650, 4) - 12 * up, s=0.78, face=1, yaw=0.32, lean=40 - 12 * up, hunch=8 - 4 * up, br=br, nod=14 - 10 * up, head_yaw=0.36,
               leg_f=('fk2', -4 - 10 * up, -100), foot_f=96, leg_n=('ik', (262 + 24 * up, 650 - 62), (1, -0.6)), foot_n='auto', near_leg_front=True,
               hand_n='grip', hand_f='grip', mouth='closed', brow_ang=-0.3, look=(0.5, 0.2), blink=blink_at(t, 0.8), ground=650, t=t)
    org = Pose(x=1070 - 24 * up, y=P_RO.kneel_hip_y(0.72, 650, 4) - 12 * up, s=0.72, face=-1, yaw=0.32, lean=40 - 12 * up, hunch=8 - 4 * up, br=math.sin(t * 1.5 + 1), nod=12 - 8 * up, head_yaw=0.4,
               leg_f=('fk2', -4 - 10 * up, -100), foot_f=96, leg_n=('ik', (1056 - 24 * up, 650 - 58), (-1, -0.6)), foot_n='auto', near_leg_front=True,
               hand_n='grip', hand_f='grip', mouth='closed', brow_ang=-0.2, look=(-0.5, 0.2), blink=blink_at(t, 2.0), ground=650, t=t)
    for p_, per, a, b in ((red, P_RR, grip_l, J['sh_n'] + V(10, -6)), (org, P_RO, grip_r, J['sh_f'] + V(-10, -6))):
        Jr = per.skeleton(p_)
        p_.arm_n = ('ik', tuple(a), (0, 1)); p_.arm_f = ('ik', tuple(b), (0, 1))
    return pat, red, org


def draw_ice(c, t, x0, y0, s, lift_px=0.0, lean=0.0, water_y=636, rim=None):
    pat, red, org = ice_poses(t, lift_px, lean)
    lt = _light_from(rim, (0.75, -0.66), rim_col=(196, 214, 255), rim_a=190)
    def fn(cv):
        clip = skia.Path(); clip.addRect(skia.Rect(-2000, -2000, 4000, water_y + 6))
        P_RO.draw(cv, org, lt, t)
        P_RR.draw(cv, red, lt, t)
        if smooth((lift_px - 70) / 110.0) > 0.4:
            cv.save(); cv.clipPath(clip, skia.ClipOp.kIntersect, True)
            P_PAT.draw(cv, pat, lt, t, clip_body=clip)
            cv.restore()
        else:
            P_PAT.draw(cv, pat, lt, t, clip_body=clip)
        # dripping water off him as he comes up
        if lift_px > 6:
            for k in range(7):
                dx_ = PATIENT_X - 130 + k * 44; dy_ = (t * 260 + k * 37) % 120
                cv.drawCircle(dx_, water_y - lift_px * 0.6 + dy_, 4.5, P((190, 214, 255), 170 * min(1, lift_px / 60)))
    _in_ref(c, x0, y0, s, fn)


# ===================================================================== sled (ref/sled.png frame)
SLED_O, SLED_O_SH, SLED_DK = (244, 122, 34), (214, 90, 24), (180, 66, 20)


def _rr(x0, y0, x1, y1, r):
    p = skia.Path(); p.addRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r)); return p


def _sled_parts():
    body = union([poly([(122, 640), (1144, 640), (1118, 700), (1070, 734), (214, 734), (166, 704)]), _rr(122, 634, 1144, 700, 30)])
    body = inter(body, poly([(100, 636), (1160, 636), (1160, 740), (100, 740)]))
    lip = _rr(112, 624, 1150, 648, 10)
    inner = _rr(140, 600, 1120, 640, 18)
    return body, lip, inner


SLED_LAMP = [(655.0, 210.0), (700.0, 285.0)]      # helmet lamp and mouth (ref coords), for the build's beam and breath


SLED_ROPE_HAND = [(-200.0, 600.0)]   # where the pulling rescuer's rope meets him (ref coords), for the build's rope
SLED_TAG_HAND = [(1200.0, 640.0)]    # the walking rescuer's hand on the tag line


def _sled_walkers(t, travel, br):
    """two rescuers walking left with the sled (foot locked, phase tied to the distance travelled): one beside its
    tail with a hand on the rail, one ahead pulling the rope. Positions are in the sled's frame (ref coords); their
    feet are planted in the world, so in this frame a planted foot slides right by exactly the sled's travel."""
    out = []
    for per, x_rel, style, s_, seed in ((P_RR, 1345.0, 'trudge', 0.84, 0.0), (P_RO, -180.0, 'trudge', 0.8, 0.37)):
        g = Gait(per, s_, x_rel, 735, dir=-1, v=60.0, style=style, yaw=0.18)
        st, feet = g.state_at(travel + seed * g.step * 2)
        off = travel + seed * g.step * 2                     # back to the sled frame (the gait moved him left by this much)
        def sh(p): return (p[0] + off, p[1])
        pose = Pose(s=s_, yaw=0.18, hips_yaw=0.0, br=br, ground=735, t=t, eyes='open', mouth='closed', look=(-0.6, 0.1), blink=blink_at(t, seed * 5))
        for k_, v_ in st.items(): setattr(pose, k_, v_)
        pose.x += off
        pose.leg_n = ('ik', sh(st['leg_n'][1]), st['leg_n'][2]); pose.leg_f = ('ik', sh(st['leg_f'][1]), st['leg_f'][2])
        if per is P_RR:           # stooping beside the tail, near hand on the sled's rail, the other arm swinging
            pose.lean = 24; pose.hunch = 8; pose.neck_lean = -16
            pose.head_yaw = 0.3; pose.nod = 6 + st['nod']; pose.brow_ang = 0.3; pose.look = (-0.6, 0.5)
            plant(per, pose, 'n', (1196, 404), finger_dir=(-1, 0.0), prefer=(1, 0.3), kind='grip')
            plant(per, pose, 'f', (1226, 400), finger_dir=(-1, 0.0), prefer=(1, 0.3), kind='grip')
            J = per.skeleton(pose)
            SLED_TAG_HAND[:] = [tuple(J['wr_n'])]
        else:                     # rope over the shoulder, both hands on it in front of the chest, leaning into it
            J = per.skeleton(pose)
            ch = J['at'](0.75)[0]
            pose.arm_n = ('ik', tuple(ch + V(-30, 40)), (1, 0.6)); pose.arm_f = ('ik', tuple(ch + V(-6, 20)), (1, 0.6))
            pose.hand_n = pose.hand_f = 'grip'; pose.brow_ang = -0.2; pose.head_yaw = 0.25
            J = per.skeleton(pose)
            SLED_ROPE_HAND[:] = [tuple(J['sh_f'] + V(4, -6))]     # the rope runs over his far shoulder, behind him
        out.append((per, pose))
    return out


def draw_sled(c, t, x0, y0, s, travel=None):
    """travel: None keeps the rescuer kneeling behind the sled, hands on the patient; a number (ref px the sled has
    moved left in the world so far) draws two rescuers walking with it instead (see P_TO_S.md)"""
    lt = Light(sd=(0.75, -0.66), rim=(255, 236, 200), rim_a=150)
    br = math.sin(t * 1.4)
    body, lip, inner = _sled_parts()
    # he kneels on the ice on the far side of the sled (his knees and shins hidden behind its wall, as they would be),
    # leaning over: one hand on the patient's chest, the other gripping the sled's rim
    g = 708                    # the ice behind the sled sits a little higher in the picture
    resc = Pose(x=800, y=P_RR.kneel_hip_y(0.84, g, 6), s=0.84, face=-1, yaw=0.2, lean=40, hunch=10, br=br, nod=12 + 1.5 * math.sin(t * 0.8) + 0.5 * br,
                head_yaw=0.24, neck_lean=-18, leg_n=('fk2', 6, -88), foot_n=172, leg_f=('fk2', 14, -86), foot_f=172,
                hand_f='flat', hand_rot_f=20, hand_n='grip', hand_rot_n=-60, eyes='open', mouth='closed', brow_ang=0.25, look=(-0.5, -0.3),
                blink=blink_at(t, 1.4), t=t)
    resc.arm_f = ('ik', (600 + 4 * math.sin(t * 1.1), 524 + 3 * math.sin(t * 1.1)), (0.3, 1)); resc.arm_n = ('ik', (760, 616), (1, 0.3))
    if travel is not None:
        walkers = _sled_walkers(t, travel, br)
        def fn2(cv):
            walkers[1][0].draw(cv, walkers[1][1], lt, t)                        # the puller ahead on the rope
            cv.drawPath(inner, P(SLED_DK))
            draw_wrapped_patient(cv, lt, t)
            plate(cv, lt, body, SLED_O, SLED_O_SH, 120, k=0.3)
            cv.drawPath(inter(poly([(100, 690), (1160, 690), (1160, 740), (100, 740)]), body), P(lt.col(SLED_O_SH)))
            plate(cv, lt, lip, (252, 150, 64), SLED_O_SH, 20, k=0.4)
            for x_, w_ in ((150, 64), (380, 92), (790, 96), (1044, 40)):
                cv.drawPath(_rr(x_, 652, x_ + w_, 668, 7), P((150, 150, 160) if x_ in (380, 790) else (200, 84, 26)))
            per, pose = walkers[0]
            J = per.draw(cv, pose, lt, t)                                       # beside the tail, hand on the rail
            # the sled's rear handle bar: from the tail up to the walker's hand height
            hx_, hy_ = SLED_TAG_HAND[0]
            # a T handle: an upright from the sled tail and a crossbar he holds with both hands
            bar = union([tube([V(1146, 640), V(1176, 520), V(hx_ + 22, hy_ + 2)], [9, 8, 8]), hull2(V(hx_ - 34, hy_ + 8), 9, V(hx_ + 66, hy_ + 4), 9)])
            plate(cv, lt, bar, (150, 156, 172), (104, 110, 128), 18, k=0.4)
            H = per.head_model(pose, J)
            SLED_LAMP[:] = [tuple(H.p(0, 0.66, 1.2)[0]), tuple(H.p(0, -0.62, 1.0)[0])]
        _in_ref(c, x0, y0, s, fn2)
        return

    def fn(cv):
        # the rescuer first (behind the sled), then the sled's inside, the patient, the near wall, and his arms on top
        cv.save(); cv.clipRect(skia.Rect(-2000, -2000, 4000, 712))      # nothing of him shows below the ice line behind the sled
        J = P_RR.draw(cv, resc, lt, t, skip=('arm_n', 'arm_f'), rim=True, shadow=False)
        cv.restore()
        cv.drawPath(inner, P(SLED_DK))
        draw_wrapped_patient(cv, lt, t)
        plate(cv, lt, body, SLED_O, SLED_O_SH, 120, k=0.3)
        cv.drawPath(inter(poly([(100, 690), (1160, 690), (1160, 740), (100, 740)]), body), P(lt.col(SLED_O_SH)))
        plate(cv, lt, lip, (252, 150, 64), SLED_O_SH, 20, k=0.4)
        for x_, w_ in ((150, 64), (380, 92), (790, 96), (1044, 40)):
            cv.drawPath(_rr(x_, 652, x_ + w_, 668, 7), P((150, 150, 160) if x_ in (380, 790) else (200, 84, 26)))
        u = J['u']
        a1 = P_RR.draw_arm(cv, lt, resc, J, 'f', u, 0.93)
        a2 = P_RR.draw_arm(cv, lt, resc, J, 'n', u, 1.0)
        rim_path(cv, lt, union([a1, a2]), a=150)
        H = P_RR.head_model(resc, J)
        SLED_LAMP[:] = [tuple(H.p(0, 0.66, 1.2)[0]), tuple(H.p(0, -0.62, 1.0)[0])]
    _in_ref(c, x0, y0, s, fn)


def draw_wrapped_patient(c, lt, t):
    """he lies flat, wrapped in a silver blanket, head to the left on his back, beanie on; breathing lifts the chest"""
    br = 0.5 + 0.5 * math.sin(t * 1.0)
    wrap = smooth_closed([(300, 548), (430, 522 - 6 * br), (560, 520 - 8 * br), (700, 528), (880, 536), (1040, 542), (1092, 572), (1090, 612), (1000, 624),
                          (700, 626), (420, 628), (300, 626), (276, 590)])
    # his boots past the end of the blanket
    for bx, by in ((1096, 600), (1112, 620)):
        boot = smooth_closed([(bx - 10, by - 30), (bx + 24, by - 30), (bx + 32, by + 70), (bx + 18, by + 110), (bx - 6, by + 108), (bx - 12, by + 20)])
        plate(c, lt, boot, (34, 36, 52), (24, 26, 38), 40, k=0.3)
    # head (profile, lying on his back, face up), beanie
    # lying on his back, head to the left, face turned a little toward us (nose up, beanie over the crown), a short
    # neck into the hood of the blanket, which folds round the back of his head
    pose = Pose(x=0, y=0, s=0.76, face=1, yaw=0.0, head_yaw=0.08, roll=-90, eyes='closed', mouth='closed', brow_ang=0.5, t=t)
    Hd = Head(V(206, 574), Person.HEAD_R * 0.76 * PATIENT.head, 1, 0.08, 0.0, -90.0)
    J = dict(head=Hd.c, R=Hd.R, neck=Hd.p(0, -1.2, -0.3)[0])
    hood = smooth_closed([(330, 532), (300, 540), (262, 600), (250, 628), (292, 636), (334, 630), (346, 600)])
    plate(c, lt, hood, (214, 220, 230), (176, 182, 196), 60, k=0.3)
    P_PAT_SLED.draw_head(c, lt, pose, J, 0.76, t)
    plate(c, lt, wrap, (200, 206, 216), (164, 170, 184), 110, k=0.32)
    # the hood's front fold tucks under his jaw
    fold_ = smooth_closed([(330, 540), (314, 552), (308, 596), (322, 626), (346, 620), (344, 570)])
    plate(c, lt, fold_, (214, 220, 230), (176, 182, 196), 30, k=0.3)
    for sx_ in (520, 860):
        st_ = inter(poly([(sx_, 500), (sx_ + 26, 500), (sx_ + 30, 640), (sx_ + 4, 640)]), wrap)
        c.drawPath(st_, P(lt.col((40, 46, 70))))
        c.drawRect(skia.Rect(sx_ + 2, 576, sx_ + 26, 596), P(lt.col((180, 184, 196))))
    c.save(); c.clipPath(wrap, skia.ClipOp.kIntersect, True)
    for pts in ([(430, 540), (520, 600), (600, 620)], [(640, 540), (720, 590), (760, 626)], [(860, 548), (900, 590), (960, 620)], [(330, 560), (380, 600)]):
        c.drawPath(tube([V(p) for p in pts], [5] * len(pts)), P(lt.col((176, 182, 196))))
    c.restore()
    rim_path(c, lt, wrap, a=170)
