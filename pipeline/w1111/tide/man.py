"""Walt, the man in the tide video: about sixty, a weekend sea angler. Stocky, weathered skin, short grey beard, an olive bucket hat,
a yellow zip rain jacket, navy trousers tucked into dark green rubber boots."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/tide']
import tperson as PN
sys.path[:0] = ['/home/claude/w1111/tide']
import skia
from guy import Pose
LOOK = dict(TOP=(246, 196, 46), TOP_SH=(196, 132, 34), TOP_HI=(255, 238, 150), PANT=(52, 66, 104), PANT_SH=(32, 42, 74), PANT_HI=(96, 114, 160),
            SKIN=(222, 160, 126), SKIN_SH=(178, 110, 94), SKIN_HI=(250, 206, 172), HAIR=(176, 176, 182), HAIR_SH=(124, 124, 138), HAIR_HI=(232, 232, 236), TEE=(240, 236, 226),
            cfg=dict(bw=1.08, top='rain', bottom='chinos', hair='bucket', hat=(128, 146, 104), band=(74, 64, 60), beard='full', age=True, fw=1.05, fl=0.97,
                     boots=((52, 92, 78), (30, 58, 56), (120, 170, 150)), shoe=((52, 92, 78), (30, 58, 56), (24, 40, 40))))


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def draw(c, ps, x, ground, s, tint=None, back=False, extra=None):
    for k, v in LOOK.items():
        if k != 'cfg': setattr(PN, k, v if tint is None else tint(v))
    cfg = dict(LOOK['cfg'], back=back, **(extra or {}))
    if tint is not None:
        cfg['hat'] = tint(cfg['hat']); cfg['band'] = tint(cfg['band']); cfg['boots'] = tuple(tint(v) for v in cfg['boots']); cfg['shoe'] = tuple(tint(v) for v in cfg['shoe'])
    ps.cfg = cfg
    PN.draw(c, ps, x=x, ground=ground, s=s)


if __name__ == '__main__':
    s = skia.Surface(2160, 1920); c = s.getCanvas(); c.clear(skia.Color(60, 150, 160))
    draw(c, pose(smile=0.5, sway=-10), 300, 1800, 1.3)
    draw(c, pose(head_yaw=0.6, look=(0.8, 0.2), smile=0.7, sway=8), 860, 1800, 1.3)
    draw(c, pose(head_yaw=-0.5, look=(-0.7, 0.3), worry=1.0, lid=1.25, scream=0.3, brow=0.4), 1320, 2900, 2.6)
    draw(c, pose(smile=0.8, look=(0.5, 0.1), head_yaw=0.2, brow=0.3), 1900, 2900, 2.6)
    s.makeImageSnapshot().save('out/test/man.png', skia.kPNG)
