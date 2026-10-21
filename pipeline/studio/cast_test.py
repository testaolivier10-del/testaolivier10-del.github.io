"""Paramedic cast test: idle breathing, looks down at the patient, leans in and presses, blinks and reacts."""
import sys, json; sys.path.insert(0, "/home/claude/lp")
from studio import skin, vec, cast_paramedic as C
bones, parts = C.build(); rig = skin.build(bones, parts)
T = (1012, 690)
clip = dict(
    bones=dict(spine=[[0, 0], [1.2, 0], [2.3, 10, "inout"], [6, 10]], chest=[[0, 0], [1.3, 0], [2.4, 8, "inout"], [6, 8]],
               neck=[[0, 0], [0.5, 0], [1.0, 6, "inout"], [6, 6]], head=[[0, 0], [0.4, 0], [0.9, 10, "out"], [2.5, 14, "inout"], [6, 14]]),
    root=[[0, 0, 0], [1.2, 0, 0], [2.3, 14, 4, "inout"], [6, 14, 4]],
    ik=[dict(upper="uarm", lower="farm", end="hand", bend=-1,
             target=[[0, 922, 640], [1.3, 922, 640], [2.4, T[0] - 52, T[1] - 10, "inout"], [2.7, T[0] - 52, T[1] - 2, "out"],
                     [3.0, T[0] - 52, T[1] - 6, "inout"], [3.3, T[0] - 52, T[1], "out"], [6, T[0] - 52, T[1] - 2]],
             weight=[[0, 0], [1.2, 0], [1.6, 1, "inout"], [6, 1]], endAngle=[[0, 28], [1.4, 28], [2.4, 12, "inout"], [6, 12]]),
        dict(upper="uarmF", lower="farmF", end="handF", bend=-1,
             target=[[0, 896, 622], [1.4, 896, 622], [2.5, T[0] - 30, T[1] - 18, "inout"], [2.75, T[0] - 30, T[1] - 10, "out"],
                     [3.05, T[0] - 30, T[1] - 14, "inout"], [3.35, T[0] - 30, T[1] - 8, "out"], [6, T[0] - 30, T[1] - 10]],
             weight=[[0, 0], [1.3, 0], [1.7, 1, "inout"], [6, 1]], endAngle=[[0, 22], [1.5, 22], [2.5, 10, "inout"], [6, 10]])],
    springs=[dict(bone="bun", k=60, c=7, grav=20)],
    procedural=dict(breathe=[dict(bone="chest", amp=1.3, period=3.6)], noise=[dict(bone="pelvis", amp=0.4, freq=0.2, seed=3)]),
)
tl = dict(id="pm", seed=4, mouth=[], expr=[[0, "neutral", 0.1], [0.5, "concerned", 0.4], [2.2, "focused", 0.5]],
          look=[[0, 0, 0], [0.35, 1.0, 1.0], [2.0, 1.2, 1.3]], blinkEvery=3.4)
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0}}</style></head><body>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs>{vec.defs()}
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2f55"/><stop offset="1" stop-color="#151a33"/></linearGradient></defs>
<rect width="1920" height="1080" fill="url(#bg)"/><rect y="900" width="1920" height="180" fill="#1b2140"/>
<path d="M 980 702 C 1100 690 1260 692 1420 700 L 1420 744 C 1260 740 1100 738 980 744 Z" fill="#cf8d69" filter="url(#sbRim)"/>
<rect x="985" y="688" width="70" height="20" rx="4" fill="#f4f1ea"/>
<g id="rig"></g><g id="faceg"><g id="face" transform="translate({C.FACE_AT[0]} {C.FACE_AT[1]})"></g></g></svg>
<script>{open('skin.js').read()}</script><script>{open('face.js').read()}</script>
<script>
const rig = new LPRig({json.dumps(rig)}, document.getElementById('rig'), {json.dumps(clip)});
const face = new LPFace(document.getElementById('face'), {json.dumps(C.FACE)}, {json.dumps(tl)});
window.__seek = (t) => {{ const W = rig.draw(t); const m = rig.skinMatrix('head', W);
  document.getElementById('faceg').setAttribute('transform', `matrix(${{m.map(v=>v.toFixed(4)).join(' ')}})`); face.draw(t); }};
window.__seek(0);
</script></body></html>"""
open("/home/claude/lp/out/cast_test.html", "w").write(html); print("ok")
