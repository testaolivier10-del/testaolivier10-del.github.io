import json, vec
DEFS = vec.defs()
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0}}</style></head><body>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
<defs>{DEFS}</defs><rect width="1920" height="1080" fill="#e7a58a"/>
<path d="M0 0 H1920 V150 C1400 170 600 140 0 160Z" fill="#c9805f"/>
<path d="M0 160 C600 140 1400 170 1920 150 V300 C1300 320 700 290 0 310Z" fill="#f2d48a" opacity="0.8"/>
<path d="M0 860 C700 840 1300 870 1920 850 V1080 H0Z" fill="#efe3c8"/>
<path d="M0 860 C700 840 1300 870 1920 850 V880 C1300 900 700 870 0 890Z" fill="#d8c7a2"/>
<g id="v" filter="url(#sbRim)"></g>
</svg>
<script>{open('skin.js').read()}</script><script>{open('bodyflow.js').read()}</script>
<script>
const v = new LPVessel(document.getElementById('v'), {json.dumps(dict(x0=-40, x1=1960, cy=560, r0=150, wall=36, bpm=110, cells=190, platelets=70, seed=5,
  press=[[0,0],[4.0,0],[4.8,0.9,'inout'],[20,0.95]], pressX=900, pressW=150, tear=dict(x=900, w=70, start=0.0), plugNeeded=22, speed=300))});
window.__seek = (t) => {{ v.draw(t); }};
</script></body></html>"""
open("/home/claude/lp/out/vessel/index.html","w").write(html)
