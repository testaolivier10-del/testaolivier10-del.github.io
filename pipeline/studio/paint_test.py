"""Painted part skinning test: every part of the vector paramedic is first flattened to a PNG (standing in for an
AI painted part), then those PNGs are bent by the same skeleton and motion as cast_test.py."""
import sys, json, os, subprocess
sys.path.insert(0, "/home/claude/lp")
import numpy as np
from PIL import Image
from studio import skin, vec, cast_paramedic as C
OUT = "/home/claude/lp/out/painttest"; os.makedirs(OUT, exist_ok=True)
bones, parts = C.build()
vrig = skin.build(bones, parts)
pp = []
for k, p in enumerate(sorted(parts, key=lambda q: q.get("z", 0))):
    one = dict(vrig); one = json.loads(json.dumps(vrig)); one["parts"] = [x for x in vrig["parts"] if x["id"] == p["id"]]
    html = f"""<!doctype html><html><body style="margin:0;background:transparent"><svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg"><defs>{vec.defs()}</defs><g id="r"></g></svg>
<script>{open('skin.js').read()}</script><script>const r=new LPRig({json.dumps(one)},document.getElementById('r'),{{}});r.draw(0);</script></body></html>"""
    open(f"{OUT}/p.html", "w").write(html)
    subprocess.run(["node", "snap.js", f"{OUT}/p.html", f"{OUT}/full_{p['id']}.png"], check=True, env=dict(os.environ, SNAP_ALPHA="1"))
    im = Image.open(f"{OUT}/full_{p['id']}.png"); bb = im.getbbox()
    if not bb: continue
    x0, y0 = max(0, bb[0] - 4), max(0, bb[1] - 4)
    im.crop((x0, y0, bb[2] + 4, bb[3] + 4)).save(f"{OUT}/{p['id']}.png")
    pp.append(dict(id=p["id"], img=f"{OUT}/{p['id']}.png", src=f"{p['id']}.png", x=x0, y=y0, bones=p.get("bones"), z=k))
paint = skin.build_paint(bones, pp)
exec(open("cast_test.py").read().split("tl = dict(")[0].split("bones, parts = C.build(); rig = skin.build(bones, parts)")[1])
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0}} canvas{{position:absolute;left:0;top:0}} svg{{position:absolute;left:0;top:0}}</style></head><body>
<svg width="1920" height="1080"><defs>{vec.defs()}<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2f55"/><stop offset="1" stop-color="#151a33"/></linearGradient></defs>
<rect width="1920" height="1080" fill="url(#bg)"/><rect y="900" width="1920" height="180" fill="#1b2140"/>
<path d="M 980 702 C 1100 690 1260 692 1420 700 L 1420 744 C 1260 740 1100 738 980 744 Z" fill="#cf8d69" filter="url(#sbRim)"/>
<rect x="985" y="688" width="70" height="20" rx="4" fill="#f4f1ea"/></svg>
<canvas id="cv" width="1920" height="1080"></canvas>
<script>{open('skin.js').read()}</script><script>{open('paintskin.js').read()}</script>
<script>
const pr = new LPPaint({json.dumps(vrig)}, {json.dumps(paint)}, document.getElementById('cv'), {json.dumps(clip)}, '');
window.__seek = async (t) => {{ await pr.ready; pr.draw(t); }};
</script></body></html>"""
open(f"{OUT}/index.html", "w").write(html)
print("parts", len(pp), "triangles", sum(len(p["t"]) // 3 for p in paint["parts"]))
