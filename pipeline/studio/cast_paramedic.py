"""Cast: the paramedic from the approved t1018 pulse Short, hand built as rig ready vector parts in style B.
Rest pose: kneeling on her left knee, right knee up, facing right, leaning in slightly (the pose EMT scenes use).
build() -> (bones, parts) for skin.build. Face features are drawn by face.js (profile mode) on the head bone."""
import sys
sys.path.insert(0, "/home/claude/lp")
from studio.vec import blob, limb, line

NAVY, NAVY_L, NAVY_D, NAVY_DD = "#22346f", "#2f4a94", "#172350", "#10183a"
SKIN, SKIN_D, SKIN_L = "#b97858", "#8f5641", "#cf8d69"
HAIR, HAIR_L = "#1c1413", "#3a2722"
GLOVE, GLOVE_D = "#4aa2dc", "#2f78ae"
BOOT, BOOT_L = "#15151c", "#2a2a35"
BELT = "#0e1430"
PATCH, PATCH_D = "#8fa3c8", "#5f7299"
RIM = "url(#sbRim)"

BONES = [
    dict(id="pelvis", parent=None, head=(752, 700), tail=(762, 600)),
    dict(id="spine", parent="pelvis", head=(762, 600), tail=(782, 515)),
    dict(id="chest", parent="spine", head=(782, 515), tail=(808, 432)),
    dict(id="neck", parent="chest", head=(808, 432), tail=(828, 392)),
    dict(id="head", parent="neck", head=(828, 392), tail=(855, 300)),
    dict(id="bun", parent="head", head=(782, 338), tail=(756, 352)),
    # far (left) arm, behind the body
    dict(id="uarmF", parent="chest", head=(792, 452), tail=(828, 556)),
    dict(id="farmF", parent="uarmF", head=(828, 556), tail=(896, 622)),
    dict(id="handF", parent="farmF", head=(896, 622), tail=(940, 646)),
    # near (right) arm
    dict(id="uarm", parent="chest", head=(806, 452), tail=(850, 566)),
    dict(id="farm", parent="uarm", head=(850, 566), tail=(922, 640)),
    dict(id="hand", parent="farm", head=(922, 640), tail=(972, 668)),
    # far leg: knee on the floor, shin back along the floor
    dict(id="thighL", parent="pelvis", head=(745, 700), tail=(772, 872)),
    dict(id="shinL", parent="thighL", head=(772, 872), tail=(610, 880)),
    dict(id="footL", parent="shinL", head=(610, 880), tail=(578, 862)),
    # near leg: knee up, foot planted forward
    dict(id="thighR", parent="pelvis", head=(768, 690), tail=(905, 700)),
    dict(id="shinR", parent="thighR", head=(905, 700), tail=(912, 872)),
    dict(id="footR", parent="shinR", head=(912, 872), tail=(985, 892)),
]

TORSO = ["pelvis", "spine", "chest", "neck"]


def build():
    P = []
    add = lambda **k: P.append(k)
    # ---------------- far arm (behind everything)
    add(id="armF", z=0, fill=NAVY_D, filter=RIM, bones=["chest", "uarmF", "farmF"],
        d=limb([(792, 452), (828, 556), (896, 622)], [50, 42, 34], bulge=[6, 3]))
    add(id="handF", z=1, fill=GLOVE_D, bones=["farmF", "handF"],
        d=blob([(890, 612), (918, 624), (944, 640), (946, 652), (930, 656), (904, 646), (886, 632)]))
    # ---------------- far leg
    add(id="legL", z=2, fill=NAVY_D, filter=RIM, bones=["pelvis", "thighL", "shinL"],
        d=limb([(745, 690), (772, 872), (612, 880)], [92, 60, 44], bulge=[8, 4]))
    add(id="bootL", z=3, fill=BOOT, filter=RIM, bones=["shinL", "footL"],
        d=blob([(640, 862), (612, 860), (586, 852), (566, 864), (572, 892), (612, 900), (642, 898)]))
    # ---------------- torso, belt, collar
    add(id="torso", z=4, fill=NAVY, filter=RIM, bones=TORSO,
        d=blob([(700, 712), (694, 640), (706, 556), (728, 488), (758, 440), (790, 420), (832, 418), (852, 446),
                (856, 500), (846, 566), (826, 640), (818, 712), (760, 730)]))
    add(id="torso_lit", z=5, fill=NAVY_L, opacity=0.55, bones=TORSO,
        d=blob([(712, 640), (716, 560), (736, 492), (764, 448), (782, 438), (760, 500), (742, 572), (734, 650)]))
    add(id="belt", z=6, fill=BELT, bones=["pelvis", "spine"],
        d=blob([(697, 660), (822, 660), (820, 684), (698, 686)], 0.2))
    add(id="buckle", z=7, fill="#9aa6c2", bones=["pelvis", "spine"], d=blob([(806, 662), (818, 662), (818, 682), (806, 682)], 0.1))
    add(id="pocket", z=7, fill=NAVY_D, opacity=0.7, bones=["spine", "chest"],
        d=blob([(810, 470), (840, 472), (840, 502), (812, 500)], 0.15))
    add(id="collar", z=8, fill=NAVY_D, bones=["chest", "neck"],
        d=blob([(792, 424), (816, 412), (840, 420), (846, 440), (822, 432), (800, 440)]))
    add(id="neck", z=3, fill=SKIN_D, bones=["chest", "neck", "head"],
        d=blob([(796, 430), (804, 392), (830, 384), (842, 420), (820, 436)]))
    # ---------------- near leg (in front of torso)
    add(id="legR", z=9, fill=NAVY, filter=RIM, bones=["pelvis", "thighR", "shinR"],
        d=limb([(760, 692), (905, 700), (912, 872)], [96, 64, 46], bulge=[10, 4], cap0=0.9))
    add(id="legR_fold", z=10, fill=NAVY_D, opacity=0.65, bones=["thighR", "shinR"],
        d=blob([(870, 724), (900, 716), (918, 734), (902, 760), (884, 744)]))
    add(id="bootR", z=11, fill=BOOT, filter=RIM, bones=["shinR", "footR"],
        d=blob([(892, 852), (930, 852), (950, 870), (992, 882), (996, 900), (940, 904), (892, 902)]))
    add(id="bootR_sole", z=12, fill=BOOT_L, bones=["footR"], d=blob([(892, 896), (996, 896), (994, 904), (892, 906)], 0.1))
    # ---------------- head
    add(id="hairback", z=13, fill=HAIR, bones=["head", "neck"],
        d=blob([(776, 360), (772, 318), (790, 282), (828, 262), (862, 266), (850, 300), (822, 330), (812, 378), (796, 398)]))
    add(id="bunshape", z=13, fill=HAIR, filter=RIM, bones=["head", "bun"],
        d=blob([(784, 330), (768, 322), (752, 330), (746, 350), (754, 370), (774, 374), (788, 360)]))
    add(id="headshape", z=14, fill=SKIN, filter=RIM, bones=["head", "neck"],
        d=blob([(800, 384), (790, 352), (794, 312), (818, 282), (852, 270), (880, 284), (892, 312), (894, 328),
                (906, 344), (898, 352), (896, 364), (894, 376), (884, 390), (862, 396), (836, 396), (816, 398)]))
    add(id="jawshade", z=15, fill=SKIN_D, opacity=0.45, bones=["head"],
        d=blob([(818, 380), (842, 384), (866, 390), (850, 398), (826, 398)]))
    add(id="ear", z=16, fill=SKIN_D, bones=["head"], d=blob([(818, 330), (830, 326), (834, 344), (826, 356), (816, 348)]))
    add(id="earring", z=17, fill="#f2c46a", bones=["head"], d=blob([(822, 358), (828, 358), (828, 364), (822, 364)], 0.9))
    add(id="hairfront", z=18, fill=HAIR, filter=RIM, bones=["head"],
        d=blob([(790, 322), (796, 292), (824, 268), (860, 264), (884, 280), (874, 290), (850, 292), (828, 304),
                (812, 322), (804, 346)]))
    # ---------------- near arm (front)
    add(id="arm", z=19, fill=NAVY, filter=RIM, bones=["chest", "uarm", "farm"],
        d=limb([(806, 450), (850, 566), (922, 640)], [56, 46, 36], bulge=[8, 4]))
    add(id="arm_lit", z=20, fill=NAVY_L, opacity=0.5, bones=["chest", "uarm", "farm"],
        d=limb([(796, 458), (836, 560), (904, 628)], [10, 8, 6]))
    add(id="patch", z=21, fill=PATCH, bones=["uarm"],
        d=blob([(808, 470), (830, 466), (836, 488), (826, 504), (812, 496)]))
    add(id="cuff", z=21, fill=NAVY_D, bones=["farm", "hand"],
        d=blob([(906, 628), (926, 640), (918, 658), (898, 646)], 0.2))
    add(id="hand", z=22, fill=GLOVE, filter=RIM, bones=["farm", "hand"],
        d=blob([(914, 634), (944, 642), (972, 656), (980, 668), (970, 676), (946, 674), (922, 664), (910, 652)]))
    add(id="thumb", z=23, fill=GLOVE_D, bones=["hand"],
        d=blob([(934, 662), (952, 670), (948, 678), (932, 672)]))
    return BONES, P


# profile face design for face.js (placed in head bone space at the eye)
FACE = dict(profile=True, eyeR=[0, 0], eyeW=13, eyeH=8, iris=6.5, pupil=3.2, browY=-17, browW=17, mouthY=34,
            mouthW=8, skin=SKIN, lid=SKIN, lash=HAIR, brow=HAIR, irisC="#3a2116", lip="#8e4a3e", lipD="#5f2a24")
FACE_AT = (872, 322)        # eye centre in the rest pose
