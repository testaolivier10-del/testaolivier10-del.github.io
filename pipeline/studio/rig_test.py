"""Rig engine test: a kneeling EMT leans in and presses gauze on a wound. Tests bending meshes (elbow, waist),
two bone IK with the hand planted on the target, springs (ponytail), breathing and idle sway.
The art here is a quick placeholder to judge MOTION only; final characters come from the art kit."""
import json, os, sys, subprocess
sys.path.insert(0, "/home/claude/lp")
from studio import skin

OUT = "/home/claude/lp/out/rigtest"; os.makedirs(OUT, exist_ok=True)
NAVY, NAVY_D, RIM, SKIN, SKIN_D, HAIR, GLOVE = "#26386f", "#1a2752", "#f2a650", "#cf9068", "#a96d4c", "#2a1d1a", "#5aaee0"

bones = [
    dict(id="pelvis", parent=None, head=(880, 760), tail=(880, 640)),
    dict(id="spine", parent="pelvis", head=(880, 640), tail=(885, 520)),
    dict(id="chest", parent="spine", head=(885, 520), tail=(890, 432)),
    dict(id="neck", parent="chest", head=(890, 432), tail=(898, 398)),
    dict(id="head", parent="neck", head=(898, 398), tail=(915, 318)),
    dict(id="pt1", parent="head", head=(868, 342), tail=(832, 372)),
    dict(id="pt2", parent="pt1", head=(832, 372), tail=(812, 418)),
    dict(id="pt3", parent="pt2", head=(812, 418), tail=(806, 466)),
    dict(id="uarm", parent="chest", head=(900, 452), tail=(985, 562)),
    dict(id="farm", parent="uarm", head=(985, 562), tail=(1080, 640)),
    dict(id="hand", parent="farm", head=(1080, 640), tail=(1146, 674)),
]
TORSO = ["pelvis", "spine", "chest", "neck"]
ARM = ["chest", "uarm", "farm", "hand"]
parts = [
    dict(id="torso", z=1, fill=NAVY, bones=TORSO,
         d="M 860 430 C 838 470 834 560 840 650 L 846 762 L 932 762 C 936 680 936 600 930 520 C 927 470 914 440 904 430 Z"),
    dict(id="torso_shade", z=2, fill=NAVY_D, opacity=0.6, bones=TORSO,
         d="M 904 432 C 914 444 926 470 929 520 C 934 600 934 680 930 760 L 912 760 C 914 690 914 600 910 530 C 908 480 900 452 896 440 Z"),
    dict(id="torso_rim", z=3, fill=RIM, bones=TORSO,
         d="M 860 432 C 842 470 837 560 843 650 L 848 760 L 856 760 L 852 650 C 847 560 852 474 868 437 Z"),
    dict(id="neck", z=0, fill=SKIN_D, bones=["chest", "neck", "head"], d="M 886 440 L 888 410 L 912 404 L 914 440 Z"),
    dict(id="pony", z=4, fill=HAIR, bones=["head", "pt1", "pt2", "pt3"],
         d="M 874 330 C 850 340 830 358 820 388 C 810 420 805 446 806 470 C 818 462 826 432 832 406 C 840 380 860 362 882 352 Z"),
    dict(id="headshape", z=5, fill=SKIN, bones=["head", "neck"],
         d="M 880 332 C 880 302 905 286 930 296 C 951 306 956 336 949 361 C 943 386 926 401 906 399 C 886 396 878 362 880 332 Z"),
    dict(id="ear", z=6, fill=SKIN_D, bones=["head"], d="M 892 348 C 884 346 882 360 890 366 C 896 368 898 352 892 348 Z"),
    dict(id="hair", z=7, fill=HAIR, bones=["head"],
         d="M 877 338 C 873 302 899 282 928 290 C 942 294 948 306 946 318 C 926 312 902 316 890 344 Z"),
    dict(id="arm", z=8, fill=NAVY, bones=ARM,
         d="M 893 438 C 930 470 965 525 992 552 C 1025 585 1055 610 1080 628 L 1076 662 C 1050 645 1015 615 978 578 C 950 548 915 505 884 470 Z"),
    dict(id="arm_rim", z=9, fill=RIM, bones=ARM,
         d="M 893 438 C 930 470 965 525 992 552 C 1025 585 1055 610 1079 627 L 1077 634 C 1052 617 1020 592 987 559 C 959 532 925 477 888 444 Z"),
    dict(id="cuff", z=10, fill=NAVY_D, bones=["farm", "hand"], d="M 1066 620 L 1084 628 L 1080 664 L 1062 654 Z"),
    dict(id="glove", z=11, fill=GLOVE, bones=["farm", "hand"],
         d="M 1080 628 C 1105 640 1130 652 1148 664 C 1157 670 1151 683 1140 685 C 1120 687 1095 677 1076 662 Z"),
]
rig = skin.build(bones, parts)

W = (1140, 754)   # top of the gauze on the wound
clip = dict(
    bones=dict(spine=[[0, 0], [0.8, 0], [1.7, 12, "inout"], [5, 12]],
               chest=[[0, 0], [0.9, 0], [1.8, 9, "inout"], [2.3, 11, "inout"], [5, 11]],
               neck=[[0, 0], [1.0, 0], [1.9, 8, "inout"], [5, 8]],
               head=[[0, 0], [1.1, 0], [2.0, 16, "out"], [3.6, 14, "inout"], [4.2, 18, "inout"], [5, 18]]),
    root=[[0, 0, 0], [0.8, 0, 0], [1.7, 10, 6, "inout"], [5, 10, 6]],
    ik=[dict(upper="uarm", lower="farm", end="hand", bend=-1,
             target=[[0, 1080, 640], [0.9, 1080, 640], [1.9, W[0] - 40, W[1] - 4, "inout"],
                     [2.25, W[0] - 40, W[1] + 6, "out"], [2.6, W[0] - 40, W[1] + 2, "inout"],
                     [2.95, W[0] - 40, W[1] + 8, "out"], [3.3, W[0] - 40, W[1] + 4, "inout"], [5, W[0] - 40, W[1] + 6]],
             weight=[[0, 0], [0.8, 0], [1.2, 1, "inout"], [5, 1]],
             endAngle=[[0, 27], [1.0, 27], [1.9, 8, "inout"], [5, 8]])],
    springs=[dict(bone="pt1", k=40, c=6, grav=45), dict(bone="pt2", k=30, c=5, grav=60), dict(bone="pt3", k=22, c=4, grav=70)],
    procedural=dict(breathe=[dict(bone="chest", amp=1.4, period=3.4)], noise=[dict(bone="pelvis", amp=0.5, freq=0.25, seed=2)]),
)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:#0d1426}}</style></head><body>
<svg id="s" width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2b4f"/><stop offset="1" stop-color="#121a33"/></linearGradient></defs>
<rect width="1920" height="1080" fill="url(#bg)"/>
<rect y="790" width="1920" height="290" fill="#18223f"/>
<path d="M 1060 760 C 1200 742 1360 746 1520 760 L 1520 806 C 1360 800 1200 798 1060 806 Z" fill="#d9a07c"/>
<path d="M 1060 762 C 1200 744 1360 748 1520 762 L 1520 770 C 1360 756 1200 752 1060 770 Z" fill="#f6c48f"/>
<rect x="1100" y="744" width="80" height="22" rx="4" fill="#f4f1ea"/>
<g id="rig"></g>
<path d="M 760 760 C 790 740 860 742 940 760 L 960 790 L 740 790 Z" fill="#1a2752"/>
</svg>
<script>{open('/home/claude/lp/studio/skin.js').read()}</script>
<script>
const RIG = {json.dumps(rig)};
const CLIP = {json.dumps(clip)};
const rig = new LPRig(RIG, document.getElementById('rig'), CLIP);
window.__seek = (t) => {{ rig.draw(t); }};
window.__seek(0);
</script></body></html>"""
open(f"{OUT}/index.html", "w").write(html)
print("ok", sum(len(p["pts"]) // 2 for p in rig["parts"]), "points")
