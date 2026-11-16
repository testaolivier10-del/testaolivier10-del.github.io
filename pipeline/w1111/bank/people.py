"""The people of w1111-03-bank-run. Every person is a new design built from the v5 people model (a copy in this folder with new options:
a forearm held in front of the body with a thing in the hand, a work jacket, a belted coat, a cardigan, a skirt, long hair, a bob,
a bald head, a moustache, glasses, women's faces)."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/bank', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import bperson as PN, bhands as H
from guy import Pose
from lpk import P, SP, C, blur, smooth, lerp, mix, smooth_closed

LOOKS = dict(
    # RAY, the main man: a line cook in his thirties on his way to the morning shift. Black quiff, stubble, a teal canvas work jacket open over a cream tee, charcoal trousers, tan work boots.
    ray=dict(TOP=(40, 128, 142), TOP_SH=(24, 84, 108), TOP_HI=(120, 206, 204), PANT=(66, 68, 84), PANT_SH=(42, 44, 62), PANT_HI=(112, 116, 138), SKIN=(204, 146, 108), SKIN_SH=(158, 102, 82), SKIN_HI=(240, 194, 158),
             HAIR=(34, 26, 28), HAIR_SH=(18, 12, 16), HAIR_HI=(96, 78, 80),
             cfg=dict(bw=1.0, top='jacket', inner=(244, 236, 220), bottom='chinos', hair='quiff', beard='stubble', fw=1.0, fl=1.0, shoe=((186, 140, 92), (130, 92, 64), (70, 56, 50)))),
    # MARISOL, a nurse coming off a night shift: long dark brown hair, a camel belted coat with a rust scarf, slim navy trousers, white trainers.
    marisol=dict(TOP=(214, 164, 104), TOP_SH=(160, 112, 76), TOP_HI=(250, 220, 170), PANT=(50, 60, 100), PANT_SH=(32, 38, 72), PANT_HI=(98, 110, 160), SKIN=(232, 180, 142), SKIN_SH=(190, 130, 108), SKIN_HI=(255, 224, 196),
                 HAIR=(74, 44, 34), HAIR_SH=(46, 26, 26), HAIR_HI=(150, 100, 70),
                 cfg=dict(bw=0.9, top='coat', inner=(206, 96, 62), bottom='chinos', hair='long', fem=True, fw=0.95, fl=1.0, head=1.0, lip=(196, 88, 92), shoe=((244, 244, 240), (190, 192, 206), (222, 224, 234)))),
    # WALTER, a retired bus driver: broad, bald with white hair at the sides and a white moustache, glasses, a sage shirt with chest pockets, brown trousers, dark shoes.
    walter=dict(TOP=(150, 178, 136), TOP_SH=(100, 128, 100), TOP_HI=(214, 232, 196), PANT=(120, 88, 70), PANT_SH=(84, 58, 52), PANT_HI=(170, 136, 112), SKIN=(238, 190, 160), SKIN_SH=(200, 140, 122), SKIN_HI=(255, 230, 208),
                HAIR=(226, 224, 220), HAIR_SH=(170, 170, 182), HAIR_HI=(255, 255, 255),
                cfg=dict(bw=1.12, top='uniform', bottom='chinos', hair='bald', beard='moustache', glasses=(70, 60, 70), fw=1.06, fl=0.97, shoe=((70, 54, 52), (44, 34, 38), (30, 26, 32)))),
    # JUNE, who runs a flower stall: sixties, a silver bob with a fringe, round red glasses, a plum cardigan over a cream blouse, a long navy skirt, grey tights, ankle boots.
    june=dict(TOP=(150, 84, 140), TOP_SH=(104, 54, 108), TOP_HI=(214, 150, 200), PANT=(52, 66, 110), PANT_SH=(34, 42, 80), PANT_HI=(104, 120, 170), SKIN=(244, 204, 176), SKIN_SH=(206, 152, 134), SKIN_HI=(255, 236, 216),
              HAIR=(196, 196, 204), HAIR_SH=(140, 142, 160), HAIR_HI=(246, 246, 250),
              cfg=dict(bw=0.97, top='cardigan', inner=(246, 238, 224), bottom='skirt', tights=(96, 96, 112), hair='bob', fem=True, glasses=(196, 60, 60), fw=1.0, fl=0.96, lip=(186, 92, 100), shoe=((84, 60, 54), (54, 38, 40), (36, 30, 34)))),
    # DEV, a student with a backpack: tall and slim, dark curls, a yellow hooded shell, grey shorts, white socks, blue trainers.
    dev=dict(TOP=(240, 190, 60), TOP_SH=(190, 132, 44), TOP_HI=(255, 232, 150), PANT=(120, 126, 140), PANT_SH=(84, 88, 106), PANT_HI=(170, 176, 190), SKIN=(150, 100, 76), SKIN_SH=(108, 68, 58), SKIN_HI=(196, 146, 116),
             HAIR=(30, 24, 28), HAIR_SH=(14, 10, 16), HAIR_HI=(90, 78, 86),
             cfg=dict(bw=0.92, top='rain', bottom='shorts', hair='curly', fw=0.94, fl=1.04, straps=(70, 80, 120), sock=(240, 238, 232), shoe=((70, 110, 190), (44, 72, 140), (230, 232, 240)))),
)
# the far end of the line: smaller figures, each still its own mix of build, hair, top and colours (nobody shares a hair and top pair)
_FAR = [('buzz', 'sweat', 'chinos', None), ('bob', 'coat', 'chinos', True), ('beanie', 'jacket', 'cargo', None), ('long', 'cardigan', 'skirt', True), ('quiff', 'uniform', 'chinos', None), ('curly', 'coat', 'chinos', True),
        ('bald', 'sweat', 'cargo', None), ('long', 'rain', 'chinos', True), ('buzz', 'jacket', 'chinos', None), ('bob', 'sweat', 'skirt', True), ('beanie', 'rain', 'cargo', None), ('quiff', 'cardigan', 'chinos', None),
        ('curly', 'sweat', 'chinos', None), ('bald', 'jacket', 'chinos', None), ('buzz', 'uniform', 'cargo', None), ('bob', 'rain', 'chinos', True), ('beanie', 'cardigan', 'chinos', None), ('long', 'jacket', 'skirt', True)]
_TOPC = [(196, 90, 70), (70, 100, 160), (120, 80, 60), (100, 160, 130), (226, 226, 216), (160, 60, 80), (90, 110, 80), (230, 120, 60), (60, 70, 90), (210, 150, 170), (50, 130, 120), (140, 120, 180)]
_SKINC = [((228, 176, 144), (188, 128, 108), (254, 220, 192)), ((168, 112, 86), (124, 76, 64), (212, 160, 130)), ((244, 204, 176), (206, 152, 134), (255, 236, 216)), ((120, 80, 62), (86, 54, 48), (166, 122, 98))]
_HAIRC = [((56, 38, 34), (34, 22, 24), (124, 88, 66)), ((30, 24, 26), (14, 10, 14), (84, 74, 80)), ((150, 96, 50), (104, 62, 36), (214, 160, 100)), ((200, 198, 200), (150, 150, 164), (250, 250, 250)), ((226, 190, 120), (170, 132, 84), (255, 234, 180))]
_PANTC = [(60, 70, 100), (90, 84, 78), (160, 150, 130), (50, 54, 66), (110, 90, 70), (70, 90, 80)]
for i, (hair, top, bottom, fem) in enumerate(_FAR):
    tc = _TOPC[i] if i < 12 else _TOPC[(i * 5 + 3) % 12]; sk = _SKINC[(i * 3 + 1) % 4]; hc = _HAIRC[(i * 2 + 1) % 5] if i < 12 else _HAIRC[(i + 2) % 5]; pc = _PANTC[i % 6] if i < 12 else _PANTC[(i + 3) % 6]
    cfg = dict(bw=(0.9, 1.06, 0.98, 1.12, 0.94)[i % 5], top=top, bottom=bottom, hair=hair, fw=(0.96, 1.04, 1.0)[i % 3], fl=(1.0, 0.97, 1.04)[i % 3], inner=(240, 234, 222), hat=_TOPC[(i + 5) % 12] if i < 12 else _TOPC[(i + 8) % 12],
               shoe=(((60, 56, 64), (36, 34, 44), (30, 28, 36)), ((240, 240, 236), (190, 192, 206), (220, 222, 232)))[i % 2])
    if fem: cfg['fem'] = True
    if i % 4 == 2: cfg['beard'] = 'full'
    LOOKS[f'far{i}'] = dict(TOP=tc, TOP_SH=mix(tc, (30, 20, 60), 0.35), TOP_HI=mix(tc, (255, 255, 255), 0.45), PANT=pc, PANT_SH=mix(pc, (20, 16, 40), 0.35), PANT_HI=mix(pc, (255, 255, 255), 0.3),
                            SKIN=sk[0], SKIN_SH=sk[1], SKIN_HI=sk[2], HAIR=hc[0], HAIR_SH=hc[1], HAIR_HI=hc[2], cfg=cfg)


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def person(c, who, ps, x, ground, s):
    for k, v in LOOKS[who].items():
        if k != 'cfg': setattr(PN, k, v)
    ps.cfg = LOOKS[who]['cfg']
    PN.draw(c, ps, x=x, ground=ground, s=s)


if __name__ == '__main__':
    names = ['ray', 'marisol', 'walter', 'june', 'dev']
    s = skia.Surface(2600, 1500); c = s.getCanvas(); c.drawRect(skia.Rect(0, 0, 2600, 1500), P((214, 204, 186)))
    for i, n in enumerate(names):
        person(c, n, pose(worry=0.5 if i else 0.0, head_yaw=(-0.2, 0.2, 0, -0.3, 0.3)[i], sway=(-10, 8, 0, -8, 10)[i]), 280 + i * 510, 1400, 1.25)
    s.makeImageSnapshot().save('t/lineup.png')
    s = skia.Surface(2600, 800); c = s.getCanvas(); c.drawRect(skia.Rect(0, 0, 2600, 800), P((214, 204, 186)))
    for i in range(12): person(c, f'far{i}', pose(), 120 + i * 214, 760, 0.7)
    s.makeImageSnapshot().save('t/far.png')
