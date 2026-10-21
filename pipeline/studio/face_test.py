"""Face rig test: a talking head speaking a real narration clip with Rhubarb lip sync, blinks, eye darts,
expression changes (concerned -> focused -> warm) and small head motion. Placeholder head to judge MOTION."""
import json
OUT = "/home/claude/lp/out/facetest"
mouth = json.load(open(f"{OUT}/mouth.json"))["mouthCues"]
tl = dict(id="f1", seed=5, mouth=mouth, expr=[[0, "concerned", 0.1], [4.6, "focused", 0.5], [10.2, "warm", 0.6]],
          look=[[0, 0, 0], [2.4, -1.2, 0.6], [3.4, 0, 0], [7.0, 1.0, -0.4], [8.2, 0, 0]])
SK, SKD, HAIR = "#cf9068", "#b07452", "#2a1d1a"
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:#0d1426}}</style></head><body>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#2a3d6e"/><stop offset="1" stop-color="#121a33"/></radialGradient></defs>
<rect width="1920" height="1080" fill="url(#bg)"/>
<path d="M 700 1080 C 720 900 820 840 960 840 C 1100 840 1200 900 1220 1080 Z" fill="#26386f"/>
<path d="M 920 760 L 1000 760 L 1006 860 C 980 880 940 880 914 860 Z" fill="{SKD}"/>
<g id="head">
  <path d="M 960 330 C 1080 330 1130 430 1125 540 C 1120 660 1050 760 960 765 C 870 760 800 660 795 540 C 790 430 840 330 960 330 Z" fill="{SK}"/>
  <path d="M 1110 520 C 1140 510 1150 560 1125 590 C 1115 600 1108 560 1110 520 Z" fill="{SKD}"/>
  <path d="M 810 520 C 780 510 770 560 795 590 C 805 600 812 560 810 520 Z" fill="{SKD}"/>
  <path d="M 960 548 C 952 590 944 610 950 622 C 958 628 966 628 974 622" fill="none" stroke="{SKD}" stroke-width="5" stroke-linecap="round"/>
  <g id="face" transform="translate(960 520)"></g>
  <path d="M 795 520 C 780 380 860 300 965 300 C 1075 300 1145 380 1125 520 C 1110 450 1070 410 1020 400 C 960 440 880 440 830 430 C 810 455 800 480 795 520 Z" fill="{HAIR}"/>
  <path d="M 1050 330 C 1150 330 1180 420 1170 470 C 1150 430 1120 400 1080 390 Z" fill="#f2a650" opacity="0.5"/>
</g>
</svg>
<script>{open('/home/claude/lp/studio/face.js').read()}</script>
<script>
const face = new LPFace(document.getElementById('face'), {{skin:'{SK}', lid:'{SK}'}}, {json.dumps(tl)});
const head = document.getElementById('head');
window.__seek = (t) => {{
  const e = face.draw(t);
  // head follows the eyes a little later; small nods on stressed words, tilt with the expression
  const nod = Math.sin(t * 2.1) * 1.2 + Math.sin(t * 0.7 + 1) * 1.6;
  const tilt = -3 * e.bt + 2 * e.sm + Math.sin(t * 0.45) * 1.5;
  head.setAttribute('transform', `rotate(${{tilt.toFixed(2)}} 960 765) translate(0 ${{nod.toFixed(2)}})`);
}};
window.__seek(0);
</script></body></html>"""
open(f"{OUT}/index.html", "w").write(html); print("ok")
