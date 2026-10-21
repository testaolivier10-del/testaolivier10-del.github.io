"""Studio showcase (2026-10-21): the 'why does direct pressure work' section of NREMT 35 (bleeding control),
rebuilt on the studio systems with its real narration (152.1 s to 189.5 s of the held video).

Shot list (local seconds):
 s1 0.0-3.4   wide garage: the EMT presses gauze on his forearm, breathing, blinking, he winces; slow seep, soaked gauze, puddle
 s2 3.4-4.6   push in on the wound, a lens opens from it into the cutaway
 s3 4.6-17.6  cutaway: torn artery leaking on each heartbeat; her gloved hand presses the skin, the tissue dents, the artery
              is pinched flat against the bone, flow and leak drop (flow ~ r^4)
 s4 17.6-27.7 zoom to the tear: platelets activate (spiky), stick to the torn edge, fibrin strands, a clot builds
 s5 27.7-31.4 pressure eases: blood blasts through, the unfinished clot is torn off
 s6 31.4-35.1 pressure back: flow slows, the clot finishes and seals the tear
 s7 35.1-37.4 the lens closes back to the wound, wide again, bleeding stopped
"""
import sys, json, os, shutil
sys.path.insert(0, "/home/claude/lp")
from studio import skin, vec, set_garage, cast_paramedic as PM, cast_patient as PT

OUT = "/home/claude/lp/out/showcase"
TOT = 37.4
W = PT.WOUND
DX = 150
pb, pp = PM.build(); prig = skin.build(pb, pp, prefix="pm")
qb, qp = PT.build(); qrig = skin.build(qb, qp, prefix="pt")

# EMT: pressing the whole time, pushes a little harder on the words, eases off during "can't hold", back on after
press_y = [[0, 0], [5.9, 0], [6.3, 6, "out"], [10.4, 9, "inout"], [27.6, 9], [28.2, 0, "inout"], [31.4, 0], [31.9, 9, "out"], [TOT, 9]]
def tgt(dx, dy):
    return [[t, W[0] + dx, W[1] + dy + v, e[0] if e else "inout"] for t, v, *e in press_y]
pclip = dict(root=[[0, DX + 10, 8]],
             bones=dict(spine=[[0, 12], [27.6, 12], [28.2, 9, "inout"], [31.4, 9], [31.9, 13, "out"], [TOT, 13]],
                        chest=[[0, 10]], neck=[[0, 6]], head=[[0, 15], [2.0, 17, "inout"], [6.0, 15, "inout"], [TOT, 16]]),
             ik=[dict(upper="uarm", lower="farm", end="hand", bend=-1, target=tgt(-30, -16), weight=[[0, 1]], endAngle=[[0, 2]]),
                 dict(upper="uarmF", lower="farmF", end="handF", bend=-1, target=tgt(-14, -26), weight=[[0, 1]], endAngle=[[0, 0]])],
             springs=[dict(bone="bun", k=60, c=7, grav=20)],
             procedural=dict(breathe=[dict(bone="chest", amp=1.3, period=3.4)], noise=[dict(bone="pelvis", amp=0.35, freq=0.2, seed=3)]))
qclip = dict(procedural=dict(breathe=[dict(bone="spine", amp=2.2, period=1.8)], noise=[dict(bone="head", amp=1.6, freq=0.45, seed=5)]),
             bones=dict(head=[[0, -6], [0.6, -12, "out"], [1.5, -8, "inout"], [2.4, -11, "out"], [3.2, -7, "inout"], [35.6, -6], [36.6, -2, "inout"], [TOT, -2]],
                        spine=[[0, 0], [35.6, 0], [36.8, -3, "inout"], [TOT, -3]]))
pface = dict(id="pmf", seed=4, mouth=[], expr=[[0, "focused", 0.1]], look=[[0, 1.2, 1.3]], blinkEvery=3.6)
qface = dict(id="ptf", seed=8, mouth=[], expr=[[0, "wince", 0.1], [2.4, "worried", 0.6], [36.0, "relieved", 0.8]],
             look=[[0, 1.0, 1.0], [2.4, 0.6, 0.4]], blinkEvery=2.4)

# cutaway geometry
CY, R0, WALL = 600, 140, 36
TEARX = 960
vessel = dict(x0=-80, x1=2000, cy=CY, r0=R0, wall=WALL, bpm=112, cells=230, platelets=110, seed=5, speed=300,
              press=[[0, 0], [6.1, 0], [8.0, 0.5, "inout"], [10.6, 0.95, "inout"], [27.6, 0.95], [27.95, 0.0, "inout"],
                     [31.5, 0.0], [32.5, 0.95, "inout"], [TOT, 0.95]],
              pressX=TEARX, pressW=230, flat=True, tear=dict(x=TEARX, w=74, start=0.0), plugNeeded=44, recruitSpeed=95, squeeze=0.99, leakGain=12.0,
              recruitTrack=[[0, 95], [31.5, 95], [31.6, 260], [40, 260]],
              plugCap=[[0, 0], [18.0, 0], [27.6, 0.75, 'linear'], [31.5, 0.75], [33.6, 1.0, 'linear'], [40, 1.0]], washout=0.3, recruit=520, trapMax=14,
              clotStart=18.0, channel=46,
              dent=int(2 * R0 * 0.99 * 0.95), layers=[dict(y0=96, y1=176, fill="#cf8763"), dict(y0=176, y1=300, fill="#f2d48a"),
                                              dict(y0=300, y1=CY - R0 - WALL + 2, fill="#e6a088")])
# platelet activity only makes sense once the narration reaches it: hold the tear's pull until 17.6 s
vessel["recruit"] = 300

DEFS = (vec.defs(fid="sbRim", rim_dx=-2.6, rim_dy=2.2, shade_dx=16, shade_dy=-6) +
        vec.defs(fid="sbRimR", rim_dx=-2.6, rim_dy=2.2, shade_dx=16, shade_dy=-6) +
        vec.defs(fid="sbRimC", rim_dx=1.8, rim_dy=2.4, shade_dx=-10, shade_dy=-8, rim="#fff0d6", rim_op=0.55))

GLOVE = vec.blob([(-232, -12), (-238, -40), (-204, -64), (-60, -80), (40, -94), (74, -124), (92, -260), (100, -420),
                  (232, -420), (226, -250), (208, -96), (176, -24), (120, 0), (-120, 3), (-222, 2)], 0.4)
FINGERS = (f'<path d="{vec.line([(-226, -36), (-110, -52), (10, -66)])}" fill="none" stroke="#2f78ae" stroke-width="5" stroke-linecap="round"/>'
           f'<path d="{vec.line([(-224, -20), (-100, -30), (20, -40)])}" fill="none" stroke="#2f78ae" stroke-width="4" stroke-linecap="round" opacity="0.7"/>'
           f'<path d="{vec.blob([(40, -94), (110, -110), (170, -60), (130, -30), (60, -50)])}" fill="#3a8ccb" opacity="0.8"/>'
           f'<path d="{vec.blob([(96, -420), (236, -420), (232, -372), (98, -372)], 0.2)}" fill="#26386f"/>')
GAUZE_W = 380

def chip(cid, x, y, text, tx=None, ty=None):
    line = (f'<path d="M0 0 L{tx - x} {ty - y}" stroke="#141c38" stroke-width="4" opacity="0.85"/><circle cx="{tx - x}" cy="{ty - y}" r="9" fill="#141c38"/>'
            f'<circle cx="{tx - x}" cy="{ty - y}" r="4" fill="#ffffff"/>') if tx is not None else ""
    return (f'<g id="{cid}" opacity="0" transform="translate({x} {y})">{line}<rect x="-{len(text)*13+30}" y="-34" width="{len(text)*26+60}" height="68" rx="34" fill="#141c38" opacity="0.92"/>'
            f'<text x="0" y="12" text-anchor="middle" font-family="Inter,Arial" font-weight="800" font-size="36" fill="#ffffff">{text}</text></g>')

liq_n = len(os.listdir(f"{OUT}/liq")) if os.path.isdir(f"{OUT}/liq") else 0
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:#000}} #root{{position:relative;width:1920px;height:1080px;overflow:hidden}}
#wide,#cutwrap{{position:absolute;left:0;top:0;width:1920px;height:1080px}} #liq{{position:absolute;left:0;top:0;width:1920px;height:1080px}}</style>
<script>{open('/home/claude/lp/node_modules/gsap/dist/gsap.min.js').read()}</script></head><body><div id="root">
<div id="wide"><div id="widecam" style="position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:{W[0]+70}px {W[1]+10}px">
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>
{set_garage.svg()}
<g id="pt"></g>
<g id="ptface" transform=""><g transform="translate({PT.FACE_AT[0]} {PT.FACE_AT[1]}) scale(-1 1)"><g id="ptface_in"></g></g></g>
<rect x="{W[0]-44}" y="{W[1]-18}" width="92" height="26" rx="5" fill="#f4f1ea"/><rect x="{W[0]-44}" y="{W[1]+2}" width="92" height="6" rx="3" fill="#a3101f" opacity="0.9"/>
</svg>
<img id="liq" src="liq/0000.png">
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>
<g id="pm"></g><g id="pmface"><g transform="translate({PM.FACE_AT[0]} {PM.FACE_AT[1]})"><g id="pmface_in"></g></g></g>
</svg></div></div>
<div id="cutwrap" style="clip-path:circle(0px at {W[0]+70}px {W[1]+10}px)">
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><defs>{DEFS}
<linearGradient id="gBone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ecd2"/><stop offset="1" stop-color="#e2cfa6"/></linearGradient></defs>
<g id="cutcam">
<rect x="-400" y="-400" width="2720" height="1880" fill="#e6a088"/>
<rect x="-400" y="-400" width="2720" height="496" fill="#1d2645"/>
<rect x="-400" y="{CY + R0 + WALL}" width="2720" height="600" fill="#e8d9b4"/>
<rect x="-400" y="{CY + R0 + WALL + 34}" width="2720" height="600" fill="url(#gBone)"/>
<rect x="-400" y="{CY + R0 + WALL}" width="2720" height="6" fill="#c9b07c"/>
{''.join(f'<ellipse cx="{x}" cy="{CY + R0 + WALL + 90 + (x * 37) % 60}" rx="{14 + (x % 9)}" ry="{8 + (x % 5)}" fill="#ead8ae" opacity="0.8"/>' for x in range(-200, 2200, 70))}
<g id="vessel" filter="url(#sbRimCOnly)"></g>
<g id="gauze" transform="translate({TEARX} 96)"><path id="gauzeP" d="" fill="#f6f3ec" filter="url(#sbRimCOnly)"/>
<clipPath id="gclip"><path id="gauzeC" d=""/></clipPath><g clip-path="url(#gclip)"><circle id="gstain" cx="0" cy="-10" r="0" fill="#a3101f" opacity="0.92"/></g></g>
<g id="hand" opacity="0" transform="translate({TEARX} -200)"><path d="{GLOVE}" fill="#4aa2dc" filter="url(#sbRimC)"/>{FINGERS}</g>
</g>
{chip("c_tear", TEARX + 360, 330, "torn vessel", TEARX + 30, CY - R0 - 4)}
{chip("c_plt", TEARX + 420, 360, "platelets", TEARX + 40, 600)}
{chip("c_clot", TEARX + 400, 360, "clot", TEARX + 10, 605)}
{chip("c_blast", TEARX - 430, 300, "blasting through", TEARX - 6, 90)}
{chip("c_press", TEARX - 400, 300, "pressure", TEARX - 120, 200)}
</svg></div>
</div>
<script>{open('/home/claude/lp/studio/skin.js').read()}</script><script>{open('/home/claude/lp/studio/face.js').read()}</script><script>{open('/home/claude/lp/studio/bodyflow.js').read()}</script>
<script>
const pt = new LPRig({json.dumps(qrig)}, document.getElementById('pt'), {json.dumps(qclip)});
const pm = new LPRig({json.dumps(prig)}, document.getElementById('pm'), {json.dumps(pclip)});
const pmF = new LPFace(document.getElementById('pmface_in'), {json.dumps(PM.FACE)}, {json.dumps(pface)});
const ptF = new LPFace(document.getElementById('ptface_in'), {json.dumps(PT.FACE)}, {json.dumps(qface)});
const V = new LPVessel(document.getElementById('vessel'), {json.dumps(vessel)});
const tl = gsap.timeline({{paused: true}});
// s2: push in and open the lens from the wound
tl.fromTo('#widecam', {{scale: 1.0}}, {{scale: 1.14, duration: 2.9, ease: 'sine.inOut'}}, 0);
tl.to('#widecam', {{scale: 2.6, duration: 1.4, ease: 'power2.inOut'}}, 2.9);
tl.to('#cutwrap', {{clipPath: 'circle(1400px at {W[0]+70}px {W[1]+10}px)', duration: 1.1, ease: 'power2.in'}}, 3.4);
gsap.set('#cutcam', {{svgOrigin: '{TEARX} 640'}});
tl.fromTo('#cutcam', {{scale: 1.5}}, {{scale: 1.0, duration: 1.6, ease: 'power3.out', immediateRender: false}}, 3.4);
tl.to('#c_tear', {{opacity: 1, duration: 0.35}}, 4.0); tl.to('#c_tear', {{opacity: 0, duration: 0.3}}, 6.4);
// s3: her gloved hand comes down on the skin
tl.to('#hand', {{opacity: 1, duration: 0.4}}, 5.6);

// s4: zoom to the tear for the platelets
tl.to('#cutcam', {{scale: 1.9, y: -150, duration: 3.0, ease: 'power2.inOut'}}, 15.7);
tl.to('#c_plt', {{opacity: 1, duration: 0.35}}, 20.7); tl.to('#c_plt', {{opacity: 0, duration: 0.3}}, 25.0);
tl.to('#c_clot', {{opacity: 1, duration: 0.35}}, 26.0); tl.to('#c_clot', {{opacity: 0, duration: 0.3}}, 27.6);
tl.to('#c_blast', {{opacity: 1, duration: 0.3}}, 28.6); tl.to('#c_blast', {{opacity: 0, duration: 0.3}}, 31.2);
tl.to('#c_press', {{opacity: 1, duration: 0.3}}, 31.6); tl.to('#c_press', {{opacity: 0, duration: 0.3}}, 33.4);
tl.to('#c_clot', {{opacity: 1, duration: 0.35}}, 33.6); tl.to('#c_clot', {{opacity: 0, duration: 0.3}}, 35.0);
// s7: back out
tl.to('#cutcam', {{scale: 1.0, y: 0, duration: 0.9, ease: 'power2.inOut'}}, 34.9);
tl.to('#cutwrap', {{clipPath: 'circle(0px at {W[0]+70}px {W[1]+10}px)', duration: 0.9, ease: 'power2.out'}}, 35.4);
tl.to('#widecam', {{scale: 1.0, duration: 1.3, ease: 'power2.inOut'}}, 35.7);
tl.set({{}}, {{}}, {TOT});
const LIQN = {liq_n};
window.__seek = async (t) => {{
  tl.time(t, false);
  const Wp = pt.draw(t), Wm = pm.draw(t);
  const mt = pt.skinMatrix('head', Wp), mm = pm.skinMatrix('head', Wm);
  document.getElementById('ptface').setAttribute('transform', 'matrix(' + mt.join(' ') + ')');
  document.getElementById('pmface').setAttribute('transform', 'matrix(' + mm.join(' ') + ')');
  ptF.draw(t); pmF.draw(t);
  const f = Math.min(Math.floor(t * 30), {int(TOT*30)-1}); const src = 'liq/' + String(f).padStart(4, '0') + '.png';
  const im = document.getElementById('liq'); if (im.getAttribute('src') !== src) {{ im.setAttribute('src', src); try {{ await im.decode(); }} catch (e) {{}} }}
  // the cutaway runs only while it can be seen (it is deterministic, so this is just speed)
  if (t > 3.2 && t < 36.4) {{
    const info = V.draw(t);
    const skin = (x) => {vessel['layers'][0]['y0']} + V.dentAt(x, t, 0);
    let gd = ''; const xs = []; for (let i = 0; i <= 20; i++) xs.push(-{GAUZE_W}/2 + {GAUZE_W} * i / 20);
    gd = 'M' + xs.map((x) => (x).toFixed(1) + ' ' + (skin({TEARX} + x) - 96 - 30).toFixed(1)).join(' L') + ' L' + xs.slice().reverse().map((x) => (x).toFixed(1) + ' ' + (skin({TEARX} + x) - 96).toFixed(1)).join(' L') + 'Z';
    document.getElementById('gauzeP').setAttribute('d', gd); document.getElementById('gauzeC').setAttribute('d', gd);
    const gs = document.getElementById('gstain'); gs.setAttribute('cy', (skin({TEARX}) - 96 - 14).toFixed(1)); gs.setAttribute('r', Math.min(190, 18 + Math.sqrt(info.soaked) * 22).toFixed(1));
    const top = skin({TEARX}) - 30 + 2;
    const p = (LPTrack({json.dumps(vessel['press'])}, t, 1) || [0])[0];
    const lift = p < 0.12 ? -300 * (1 - p / 0.12) : 0;
    document.getElementById('hand').setAttribute('transform', 'translate({TEARX} ' + (top + lift).toFixed(1) + ')');
  }}
}};
window.__seek(0);
</script></body></html>"""
open(f"{OUT}/index.html", "w").write(html)
print("ok", liq_n)
