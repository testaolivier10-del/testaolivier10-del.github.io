"""Cast: injured man (miter saw cut), seated on the garage floor leaning back on the tool chest, knees up,
his left forearm held out across his knee toward the EMT. Faces LEFT. Hand built vector parts in style B."""
from studio.vec import blob, limb

SKIN, SKIN_D, SKIN_L = "#e3a47f", "#b97a5a", "#f2bd98"
TEE, TEE_D, TEE_L = "#7f8794", "#5d6470", "#a2aab6"
JEANS, JEANS_D, JEANS_L = "#35577f", "#26405f", "#4c72a0"
HAIR, BEARD = "#c9ccd2", "#d8dbe0"
SHOE, SOLE = "#3a2f2a", "#22201f"
RIM = "url(#sbRimR)"

BONES = [
    dict(id="hips", parent=None, head=(1300, 870), tail=(1320, 760)),
    dict(id="spine", parent="hips", head=(1320, 760), tail=(1335, 660)),
    dict(id="neck", parent="spine", head=(1335, 660), tail=(1328, 620)),
    dict(id="head", parent="neck", head=(1328, 620), tail=(1305, 530)),
    dict(id="uarm", parent="spine", head=(1325, 672), tail=(1235, 735)),
    dict(id="farm", parent="uarm", head=(1235, 735), tail=(1010, 702)),
    dict(id="hand", parent="farm", head=(1010, 702), tail=(950, 708)),
    dict(id="uarmB", parent="spine", head=(1340, 680), tail=(1330, 790)),
    dict(id="farmB", parent="uarmB", head=(1330, 790), tail=(1255, 820)),
    dict(id="thigh", parent="hips", head=(1290, 870), tail=(1175, 765)),
    dict(id="shin", parent="thigh", head=(1175, 765), tail=(1080, 890)),
    dict(id="thighB", parent="hips", head=(1305, 885), tail=(1170, 900)),
    dict(id="shinB", parent="thighB", head=(1170, 900), tail=(1010, 915)),
]
TORSO = ["hips", "spine", "neck"]


def build():
    P = []; add = lambda **k: P.append(k)
    add(id="legB", z=0, fill=JEANS_D, filter=RIM, bones=["hips", "thighB", "shinB"],
        d=limb([(1305, 880), (1170, 900), (1012, 912)], [80, 58, 44], bulge=[6, 2], cap0=0.9))
    add(id="shoeB", z=1, fill=SHOE, filter=RIM, bones=["shinB"],
        d=blob([(1030, 892), (1000, 884), (972, 896), (968, 920), (1030, 924)]))
    add(id="armB", z=2, fill=SKIN_D, filter=RIM, bones=["spine", "uarmB", "farmB"],
        d=limb([(1340, 690), (1330, 790), (1255, 820)], [40, 32, 28]))
    add(id="sleeveB", z=3, fill=TEE_D, bones=["spine", "uarmB"], d=limb([(1342, 676), (1334, 735)], [52, 46]))
    add(id="torso", z=4, fill=TEE, filter=RIM, bones=TORSO,
        d=blob([(1268, 880), (1262, 800), (1270, 720), (1290, 670), (1318, 640), (1352, 640), (1378, 668),
                (1388, 740), (1384, 820), (1372, 885), (1320, 900)]))
    add(id="torso_lit", z=5, fill=TEE_L, opacity=0.5, bones=TORSO,
        d=blob([(1352, 652), (1374, 676), (1382, 740), (1378, 820), (1364, 860), (1362, 760), (1356, 690)]))
    add(id="neck", z=3, fill=SKIN_D, bones=["spine", "neck", "head"],
        d=blob([(1316, 650), (1314, 612), (1340, 606), (1352, 646)]))
    add(id="leg", z=6, fill=JEANS, filter=RIM, bones=["hips", "thigh", "shin"],
        d=limb([(1295, 868), (1175, 765), (1082, 888)], [92, 64, 48], bulge=[8, 4], cap0=0.9))
    add(id="leg_lit", z=7, fill=JEANS_L, opacity=0.45, bones=["thigh", "shin"],
        d=limb([(1240, 806), (1180, 752), (1110, 846)], [12, 10, 8]))
    add(id="shoe", z=8, fill=SHOE, filter=RIM, bones=["shin"],
        d=blob([(1102, 872), (1066, 866), (1036, 880), (1030, 904), (1104, 908)]))
    add(id="sole", z=9, fill=SOLE, bones=["shin"], d=blob([(1030, 900), (1106, 902), (1104, 912), (1030, 910)], 0.1))
    # head (profile facing left)
    add(id="headshape", z=10, fill=SKIN, filter=RIM, bones=["head", "neck"],
        d=blob([(1352, 600), (1360, 560), (1350, 524), (1322, 506), (1290, 510), (1272, 532), (1268, 552),
                (1256, 566), (1264, 574), (1264, 588), (1268, 602), (1282, 614), (1306, 618), (1330, 616)]))
    add(id="beard", z=11, fill=BEARD, opacity=0.9, bones=["head"],
        d=blob([(1268, 592), (1272, 606), (1286, 618), (1312, 620), (1334, 612), (1340, 590), (1320, 600), (1296, 604), (1282, 594)]))
    add(id="ear", z=12, fill=SKIN_D, bones=["head"], d=blob([(1324, 560), (1336, 556), (1340, 574), (1330, 584), (1322, 576)]))
    add(id="hair", z=13, fill=HAIR, filter=RIM, bones=["head"],
        d=blob([(1352, 590), (1364, 552), (1356, 516), (1326, 496), (1290, 498), (1270, 516), (1286, 520), (1312, 524),
                (1330, 540), (1340, 566)]))
    # near arm held out across the knee, palm up
    add(id="sleeve", z=14, fill=TEE, filter=RIM, bones=["spine", "uarm"], d=limb([(1330, 668), (1266, 714)], [58, 50]))
    add(id="arm", z=15, fill=SKIN, filter=RIM, bones=["uarm", "farm", "hand"],
        d=limb([(1272, 712), (1235, 735), (1012, 702)], [42, 40, 30], bulge=[2, 4]))
    add(id="arm_lit", z=16, fill=SKIN_L, opacity=0.6, bones=["farm"], d=limb([(1210, 722), (1030, 694)], [8, 6]))
    add(id="hand", z=17, fill=SKIN, filter=RIM, bones=["farm", "hand"],
        d=blob([(1014, 690), (990, 688), (962, 692), (944, 700), (948, 712), (972, 716), (996, 716), (1016, 714)]))
    add(id="fingers", z=18, fill=SKIN_D, opacity=0.6, bones=["hand"],
        d=blob([(962, 700), (948, 704), (952, 710), (966, 708)]))
    return BONES, P


FACE = dict(profile=True, eyeR=[0, 0], eyeW=12, eyeH=7, iris=6, pupil=3, browY=-16, browW=16, mouthY=36, mouthX=13,
            mouthW=8, skin=SKIN, lid=SKIN, lash="#8e8a86", brow="#b9bcc2", irisC="#4b5d6e", lip="#b0675a", lipD="#7d4038")
FACE_AT = (1282, 556)      # eye centre (the face is mirrored to look left)
WOUND = (1060, 700)        # top of the forearm wound under the gauze
