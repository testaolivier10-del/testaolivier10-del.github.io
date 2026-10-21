import sys, json; sys.path.insert(0, "/home/claude/lp")
from studio import skin, vec
import importlib
mod = importlib.import_module(sys.argv[1]); out = sys.argv[2]
bones, parts = mod.build()
rig = skin.build(bones, parts)
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0}}</style></head><body>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs>{vec.defs()}
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2f55"/><stop offset="1" stop-color="#151a33"/></linearGradient></defs>
<rect width="1920" height="1080" fill="url(#bg)"/><rect y="900" width="1920" height="180" fill="#1b2140"/>
<g id="rig"></g></svg>
<script>{open('/home/claude/lp/studio/skin.js').read()}</script>
<script>const rig = new LPRig({json.dumps(rig)}, document.getElementById('rig'), {{}}); window.__seek=(t)=>rig.draw(t); rig.draw(0);</script>
</body></html>"""
open(out, "w").write(html)
