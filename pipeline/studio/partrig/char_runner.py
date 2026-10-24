"""Control A: the old method. The fire scene runner, cut out of ONE finished painting (bent mid run pose),
hidden areas inpainted, limbs bent by skinning. Same engine and same performance as the part sheet character."""
import numpy as np
from PIL import Image
from partrig import Rig

ART = "/tmp/m/pipeline/studio/sci/art/fire/"

BONES = {
    "body": [[250, 560], [300, 262]],
    "n_up": [[252, 296], [156, 342]], "n_lo": [[156, 342], [150, 468]], "n_hand": [[150, 468], [148, 522]],
    "f_up": [[306, 300], [360, 440]], "f_lo": [[360, 440], [450, 428]], "f_hand": [[450, 428], [494, 412]],
    "n_th": [[268, 560], [368, 714]], "n_sh": [[368, 714], [410, 886]], "n_ft": [[410, 886], [520, 912]],
    "f_th": [[240, 565], [196, 724]], "f_sh": [[196, 724], [108, 864]], "f_ft": [[108, 864], [165, 945]],
}
PARENT = {"body": None, "n_up": "body", "n_lo": "n_up", "n_hand": "n_lo", "f_up": "body", "f_lo": "f_up",
          "f_hand": "f_lo", "n_th": "body", "n_sh": "n_th", "n_ft": "n_sh", "f_th": "body", "f_sh": "f_th",
          "f_ft": "f_sh"}


def build():
    rig = Rig([dict(name=k, parent=PARENT[k], head=v[0], tail=v[1]) for k, v in BONES.items()])
    L = lambda n: np.array(Image.open(ART + n + ".png").convert("RGBA"))
    # the painting: "near" (screen) arm is the dark far arm in front... keep the original layer order
    rig.add_part("fararm", L("L_fararm"), (0, 0), ["f_up", "f_lo", "f_hand"], "skin", z=0)
    rig.add_part("farleg", L("L_farleg"), (0, 0), ["f_th", "f_sh", "f_ft"], "skin", z=1)
    rig.add_part("nearleg", L("L_nearleg"), (0, 0), ["n_th", "n_sh", "n_ft"], "skin", z=2)
    rig.add_part("body", L("L_body"), (0, 0), ["body"], "rigid", z=3)
    rig.add_part("neararm", L("L_neararm"), (0, 0), ["n_up", "n_lo", "n_hand"], "skin", z=4)
    spec = dict(spine="body", head=None, facing=1,
                arms={"near": ("n_up", "n_lo", "n_hand"), "far": ("f_up", "f_lo", "f_hand")},
                legs={"near": ("n_th", "n_sh", "n_ft"), "far": ("f_th", "f_sh", "f_ft")},
                ankle_h=30, foot_len=110,
                foot_rest={"near": 0.23, "far": 0.42},   # foot bone angle that puts the painted sole flat
                springs=[("f_lo", 3.2, 0.55), ("f_hand", 4.0, 0.5), ("n_lo", 3.2, 0.55), ("n_hand", 4.0, 0.5)])
    joints = ["f_lo", "f_hand", "n_lo", "n_hand", "n_sh", "n_ft", "f_sh", "f_ft", "f_up", "n_up", "n_th", "f_th"]
    radius = {j: 16 for j in joints}
    return rig, spec, joints, radius
