"""Marco, the baker (people standard 2026-11-09: a new design on the v5 model, not a recolour).
Early thirties, broad build, warm brown skin, short dark curls and a trimmed full beard, a moss green sweatshirt with the
sleeves as they are, a cream baker's apron dusted with flour, charcoal trousers, dark brown work shoes."""
import sys, math
sys.path[:0] = ['/home/claude/short', '/home/claude/guy']
import person as PN
from guy import Pose
LOOK = dict(TOP=(86, 122, 98), TOP_SH=(56, 84, 72), TOP_HI=(148, 184, 150), PANT=(66, 66, 78), PANT_SH=(42, 42, 54), PANT_HI=(112, 112, 128),
            SKIN=(176, 118, 86), SKIN_SH=(132, 82, 66), SKIN_HI=(220, 164, 128), HAIR=(34, 26, 26), HAIR_SH=(18, 12, 14), HAIR_HI=(90, 70, 66),
            TEE=(236, 228, 214),
            cfg=dict(bw=1.08, top='sweat', bottom='chinos', hair='curly', beard='full', fw=1.05, fl=1.0, head=1.0, apron=(238, 228, 206), flour=True,
                     shoe=((82, 56, 44), (54, 36, 30), (40, 34, 34))))


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def draw(c, ps, x, ground, s):
    for k, v in LOOK.items():
        if k != 'cfg': setattr(PN, k, v)
    ps.cfg = LOOK['cfg']
    PN.draw(c, ps, x=x, ground=ground, s=s)
