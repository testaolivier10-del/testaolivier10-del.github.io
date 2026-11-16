"""The conductor: the one designed person of w1111-02. A lean man of about fifty, long face, greying moustache and temples, tired narrowed eyes.
Navy double breasted uniform greatcoat with brass buttons, peaked cap with a badge plate, a dark red wool scarf pulled down off his mouth,
crossed leather straps with the ticket machine and the cash bag, dark trousers, black boots. Lit by the flare in his right hand (screen left)."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/smog']
sys.path += ['/home/claude/short', '/home/claude/guy']
import skia
import person as PN, hands as H
from guy import Pose
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed

LOOK = dict(TOP=(40, 48, 78), TOP_SH=(18, 20, 40), TOP_HI=(250, 160, 84), PANT=(30, 32, 50), PANT_SH=(14, 14, 28), PANT_HI=(196, 120, 70),
            SKIN=(226, 164, 120), SKIN_SH=(150, 88, 74), SKIN_HI=(255, 228, 176), HAIR=(112, 104, 104), HAIR_SH=(60, 54, 62), HAIR_HI=(226, 200, 170),
            TEE=(150, 44, 40), AO=(20, 10, 24),
            cfg=dict(bw=0.96, smooth_edges=True, top='coat', bottom='chinos', hair='cap', beard='moustache', age=1.0, fw=0.97, fl=1.07, head=1.0, scarf=(156, 46, 42),
                     shoe=((34, 32, 40), (12, 12, 20), (60, 48, 44))))
FLAME = [None, 0.0]                      # screen point of the flare's burning tip (set while he is drawn), and its scale


def flare_prop(c, hw, ang, ts, s, nar):
    """the flare: a waxed card tube with a wooden grip, held in the fist; drawn before the hand so the fingers close over it. It shows above and below the fist."""
    ca, sa = math.cos(ang), math.sin(ang)
    Wp = lambda u, v: (hw[0] + s * (u * ca - v * nar * ts * sa), hw[1] + s * (u * sa + v * nar * ts * ca))
    a, b = Wp(49, -1), Wp(49, 1); up = -1 if a[1] < b[1] else 1         # which way along the knuckle line is up on screen
    lo, g0, top = Wp(47, -up * 44), Wp(49, up * 30), Wp(53, up * 150)
    c.drawLine(lo[0], lo[1], g0[0], g0[1], SP((96, 62, 40), 15 * s)); c.drawLine(lo[0] - 2, lo[1], g0[0] - 2, g0[1], SP((170, 118, 70), 4 * s, 160))        # wooden grip
    c.drawLine(g0[0], g0[1], top[0], top[1], SP((120, 28, 30), 19 * s)); c.drawLine(g0[0], g0[1], top[0], top[1], SP((186, 52, 44), 14 * s))                   # red card tube
    c.drawLine(g0[0] - 3 * s, g0[1], top[0] - 3 * s, top[1], SP((255, 170, 110), 3.4 * s, 200))
    m_ = (lerp(g0[0], top[0], 0.2), lerp(g0[1], top[1], 0.2)); m2 = (lerp(g0[0], top[0], 0.3), lerp(g0[1], top[1], 0.3)); c.drawLine(m_[0], m_[1], m2[0], m2[1], SP((236, 226, 200), 19 * s))   # a paper band
    c.drawCircle(top[0], top[1], 9 * s, P((255, 236, 190)))
    FLAME[0] = c.getTotalMatrix().mapXY(top[0], top[1]); FLAME[1] = s * math.hypot(c.getTotalMatrix().getScaleX(), c.getTotalMatrix().getSkewY())


GRIP = dict(curls=(0.72, 0.8, 0.82, 0.82, 0.8), spread=0.04)


STEP_T = 1.5                         # one full cycle (two careful steps)


def _foot(p, A, lift):
    """one foot through the cycle: planted and carried back with the road for 60 percent, then lifted, brought forward and set down"""
    p = p % 1.0
    if p < 0.6: return (0.0, A - 2 * A * (p / 0.6), 0.0)
    u = (p - 0.6) / 0.4; e = u * u * (3 - 2 * u)
    return (0.0, -A + 2 * A * e, lift * math.sin(math.pi * u) ** 0.8)


def pose(t, beckon=1.0, yaw=0.0, worry=0.8, lid=0.62, look=(0.0, 0.0), flare=True, walk=0.0, step_a=19.0, **kw):
    """standing, the flare held out and up in his right hand, the left arm beckoning the bus on: the forearm swings from upright beside his head
    toward the camera and back, the fingers curling in as it comes. One beckon every 1.25 s, a continuous swing (no stop at the ends)."""
    ps = Pose(); ps.cfg = LOOK['cfg']
    ps.breath = 0.5 + 0.5 * math.sin(t * 2.2); ps.sway = -8 + 1.5 * math.sin(t * 0.9); ps.lean = 0.6 * math.sin(t * 0.8 + 1)
    fl = 1.0 if flare else 0.0
    ps.r_up = lerp(8, 74 + 2.0 * math.sin(t * 1.7), fl); ps.r_fore = lerp(6, 62 + 2.5 * math.sin(t * 1.3 + 2), fl); ps.r_wrist = lerp(-10, -40, fl); ps.sh_r = 10 * fl
    ps.r_hand = GRIP if flare else PN.RELAX; ps.r_prop = flare_prop if flare else None
    ph = (t / 1.25) % 1.0; k = 0.5 - 0.5 * math.cos(2 * math.pi * ph)            # 0 = forearm up beside the head, 1 = forearm reaching toward the camera
    k2 = 0.5 - 0.5 * math.cos(2 * math.pi * ((t - 0.1) / 1.25 % 1.0))             # the hand follows a beat late
    b = beckon
    ps.l_up = lerp(8, 56 - 14 * k, b); ps.l_fore = lerp(8, 110 - 16 * k, b); ps.l_fz = b * (0.02 + 0.74 * k); ps.l_hang = 0.12; ps.l_wrist = lerp(-10, 2 + 22 * k2, b)       # a big clear beckon: the hand up beside his head, then swept toward us
    ps.l_hand = H.blend(PN.RELAX, H.blend(dict(curls=(0.12, 0.06, 0.06, 0.08, 0.12), spread=0.3), dict(curls=(0.5, 0.8, 0.84, 0.86, 0.86), spread=0.06), k2), b)
    ps.head_yaw = yaw; ps.head_tilt = -1.5 + 2.5 * yaw + 0.6 * math.sin(t * 1.1); ps.worry = worry; ps.lid = lid; ps.look = look; ps.brow = -0.2; ps.smile = 0.0
    if walk > 0:                                              # small careful steps toward the camera: weight over the planted leg, the body rises over it, the hem follows late
        p = (t / STEP_T) % 1.0
        ps.foot_l = tuple(walk * v for v in _foot(p, step_a, 26.0)); ps.foot_r = tuple(walk * v for v in _foot(p + 0.5, step_a, 26.0))
        ps.sway = walk * 10.0 * math.sin(2 * math.pi * (p - 0.05)); ps.bob = walk * (-4.5 * math.cos(4 * math.pi * (p - 0.3)) + 2.0)
        ps.lean = walk * 0.9 * math.sin(2 * math.pi * (p - 0.12)); ps.skirt_dx = walk * 9.0 * math.sin(2 * math.pi * (p - 0.05 - 0.14))
        ps.skirt_knee = (7.0 * ps.foot_r[2] / 26.0, 7.0 * ps.foot_l[2] / 26.0); ps.head_tilt += -0.12 * ps.sway
    for k_, v in kw.items(): setattr(ps, k_, v)
    return ps


def draw(c, ps, x, ground, s):
    for k, v in LOOK.items():
        if k != 'cfg': setattr(PN, k, v)
    PN.LIGHT = (0.7, 0.6)        # the model puts its bright rim on the side LIGHT points away from; this puts the rim on the flare's side (screen left, above)
    PN.draw(c, ps, x=x, ground=ground, s=s)


if __name__ == '__main__':
    import os; os.makedirs('out/test', exist_ok=True)
    s = skia.Surface(2700, 1500); c = s.getCanvas(); c.clear(C((58, 54, 40)))
    for i, (tt, kw) in enumerate(((0.0, dict(beckon=0.0, flare=False)), (0.0, {}), (0.31, {}), (0.62, dict(yaw=0.5)))):
        draw(c, pose(tt, **kw), 300 + i * 700, 1400, 1.05)
    s.makeImageSnapshot().save('out/test/sheet.png')
    s = skia.Surface(2700, 800); c = s.getCanvas(); c.clear(C((58, 54, 40)))
    for i in range(6):
        c.save(); c.clipRect(skia.Rect(i * 450, 0, i * 450 + 450, 800)); draw(c, pose(i * 1.25 / 6), i * 450 + 80, 1900, 1.5); c.restore()
    s.makeImageSnapshot().save('out/test/beckon.png')
    s = skia.Surface(1500, 1200); c = s.getCanvas(); c.clear(C((58, 54, 40)))
    draw(c, pose(0.3, yaw=-0.3, look=(-0.5, 0.0)), 900, 2700, 2.0); s.makeImageSnapshot().save('out/test/face.png')
