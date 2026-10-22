"""w1021-01 pure water IV (AP Bio tonicity, scenario / cost of inaction). Strongest hook: posts first.

ART PLAN (full screen 1080x1920)
- Hospital room at night (IV bag on a pole, drip chamber, tubing to the patient's forearm): Gemini (Nano Banana Pro)
  painted scene, style B reference garage_cut.png. Extended upward (the wall and window rows stretched) and
  downward (blanket) so the camera can follow the tubing from the bag to the catheter. The painted drop in the drip
  chamber was removed so a code drop can form, fall and merge into the chamber pool.
- Inside the vein: Gemini painting with red blood cells, plus a second Gemini edit of the same painting with the
  cells removed; the cells were cut out (red mask x difference, convex hull) so they drift on the empty vein.
- Close up of one red blood cell: three Gemini edits of one painting: normal biconcave disc, swollen sphere, burst
  (pale ghost membrane, hemoglobin cloud). The swelling is a crossfade with a slight scale; the hemoglobin cloud is
  revealed outward from the leak and stays.
- Code in the same palette: label text on the painted bag label, drops, water molecules (bent H2O: one O, two H),
  inward arrows, chips, the isotonic inset arrows.

MOTION LIST (checked in Gate A)
1. Drops form at the drip chamber nozzle, fall and merge into the pool, one every 1.1 s.
2. Camera follows the tubing down from the bag to the catheter on the inner forearm; a round lens opens there into
   the vein.
3. Cells drift slowly toward the viewer along the vein; water molecules stream in from the IV side.
4. Close up: water molecules move from the plasma INTO the cell (they pass behind the membrane and are hidden):
   net movement inward. The cell swells into a sphere (dimple gone), then hemoglobin leaks out as a cloud that
   spreads and stays, leaving a pale ghost (hemolysis).
5. Back in the room the bag label reads 0.9% SALINE; inset: the cell keeps its biconcave shape with equal arrows
   in and out (isotonic, no net movement). Then the label reads 3% SALINE for the question.
"""
import json, shutil
import lpx, beats_w1021 as B
from lpx import wt, chip

ID = "w1021-01-iv-water"
OUT = f"/home/claude/lp/out/{ID}"
ART = "/home/claude/w1021/art"
PAN = -650                       # room layer y at the catheter
CATH = (906, 1752 + PAN)         # catheter on screen after the pan
VP = (694, 553)                  # vein vanishing point
CELL_C = (548, 975)              # close up cell centre


def compose(c):
    files = ["end_v1.png", "v1_room_ext.png", "v1_vein_bg.png", "v1_cell_a.png", "v1_cell_swollen.png", "v1_cell_burst.png"] + [f"cell{i}.png" for i in range(10)]
    for f in files: shutil.copy(f"{ART}/{f}", f"{OUT}/{f}")
    shutil.copy(f"{ART}/end_v1.png", f"{OUT}/endbg.png")
    cells = [d for d in json.load(open(f"{ART}/cells.json")) if d["f"] != "cell6.png"]
    T, C, g = c.T, c.C, c.g
    k = lambda key, w, n=1: wt(c, key, w, n)
    t_pan = k("hook", "here") + 0.35; t_lens = T["why"] - 0.05
    t_dive = k("why", "sounds") - 0.1
    tp0 = k("swell", "pops") - 0.05
    t_back = max(T["fix"] - 0.05, tp0 + 1.9)
    cfg = dict(VP=VP, CELL=CELL_C, cells=cells, wOn=[k("why", "hypotonic") - 0.2, t_dive + 0.6],
               inOn=[t_dive + 0.4, k("swell", "swells") + 0.6], dive=t_dive, isoOn=[k("fix", "as") - 0.3, T["ask"] + 0.2])
    g("const CV=" + json.dumps(cfg) + ";")
    g(r'''
const NS1="http://www.w3.org/2000/svg";
function rnd(i){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function h2o(par){const g=document.createElementNS(NS1,"g");
 g.innerHTML='<circle cx="0" cy="0" r="11" fill="url(#gO)"/><circle cx="-11" cy="8" r="6.5" fill="url(#gH)"/><circle cx="11" cy="8" r="6.5" fill="url(#gH)"/>';
 par.appendChild(g); return g;}
const WV=[],WC=[];
for(let i=0;i<30;i++) WV.push(h2o(document.getElementById("wVein")));
for(let i=0;i<40;i++) WC.push(h2o(document.getElementById("wCell")));
const cellEls=[...document.querySelectorAll(".vc")];
window.__studioHooks=window.__studioHooks||[];
window.__studioHooks.push(function(t){
 // drip: period 1.1 s; drop grows at the nozzle (0..0.55), falls (0.55..0.75), merges with a ripple
 const ph=((t+0.4)%1.1)/1.1, d=document.getElementById("drop"), rp=document.getElementById("ripple");
 let dy=0,dr=3+7*Math.min(1,ph/0.5),st=1;
 if(ph>0.5){const u=Math.min(1,(ph-0.5)/0.18); dy=u*u*46; st=1+0.5*u;}
 if(ph>0.68){d.setAttribute("opacity",0);} else {d.setAttribute("opacity",1);}
 d.setAttribute("transform",`translate(552 ${968+dy}) scale(${(dr/10).toFixed(3)} ${(dr/10*st).toFixed(3)})`);
 const rr=ph>0.68?(ph-0.68)/0.32:0; rp.setAttribute("rx",(4+22*rr).toFixed(1)); rp.setAttribute("opacity",(ph>0.68?0.8*(1-rr):0).toFixed(2));
 // vein cells drift toward the viewer
 const tv=Math.max(0,t-CV.wOn[0]), f=1+0.011*tv;
 cellEls.forEach((e,i)=>{const c=CV.cells[i]; const cx=c.x+c.w/2, cy=c.y+c.h/2; const nx=CV.VP[0]+(cx-CV.VP[0])*f, ny=CV.VP[1]+(cy-CV.VP[1])*f;
   e.setAttribute("transform",`translate(${(nx-c.w*f/2).toFixed(1)} ${(ny-c.h*f/2).toFixed(1)}) scale(${f.toFixed(4)})`);});
 // water molecules streaming out of the vein's far end
 const on=(r)=>t>=r[0]&&t<=r[1];
 WV.forEach((m,i)=>{ if(!on(CV.wOn)){m.setAttribute("opacity",0);return;}
   const life=3.2, s=((t-CV.wOn[0])/life+rnd(i))%1; const a=0.35+rnd(i+50)*2.45, R=40+s*s*430;
   const x=CV.VP[0]+Math.cos(a)*R*0.95, y=CV.VP[1]+60+Math.sin(a)*R*1.2; const sc=(0.5+s*1.1)*1.4;
   const op=Math.min(1,(t-CV.wOn[0])*2)*Math.min(1,s*5)*(s>0.92?(1-s)/0.08:1);
   m.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(rnd(i+9)*360+t*40).toFixed(0)}) scale(${sc.toFixed(3)})`); m.setAttribute("opacity",op.toFixed(2));});
 // close up: water moves into the cell (passes behind the membrane)
 WC.forEach((m,i)=>{ if(!on(CV.inOn)){m.setAttribute("opacity",0);return;}
   const life=2.0, s=((t-CV.inOn[0])/life+rnd(i+200))%1; const a=rnd(i+300)*6.283; const R=620-s*330;
   const x=CV.CELL[0]+Math.cos(a)*R, y=CV.CELL[1]+Math.sin(a)*R*0.95;
   const op=Math.min(1,(t-CV.inOn[0])*2)*Math.min(1,s*6)*Math.max(0,1-Math.max(0,t-CV.inOn[1]+0.5)*2);
   m.setAttribute("transform",`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(rnd(i+19)*360).toFixed(0)}) scale(1.25)`); m.setAttribute("opacity",op.toFixed(2));});
 // isotonic inset: equal flow in and out
 const iso=document.getElementById("isoMol"); if(iso){ [...iso.children].forEach((m,i)=>{const dir=i%2?1:-1; const s=((t*0.6)+rnd(i+400))%1; const a=rnd(i+500)*6.283;
   const R=dir>0? 200-s*80 : 120+s*80; m.setAttribute("transform",`translate(${(270+Math.cos(a)*R).toFixed(1)} ${(1150+Math.sin(a)*R).toFixed(1)}) scale(1.0)`);
   m.setAttribute("opacity",(on(CV.isoOn)?Math.min(1,s*5)*Math.min(1,(1-s)*5):0).toFixed(2));}); }
});
''')
    mol_defs = ('<radialGradient id="gO" cx=".35" cy=".3"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#9ed8ff"/><stop offset="1" stop-color="#3f86c9"/></radialGradient>'
                '<radialGradient id="gH" cx=".35" cy=".3"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe2f2"/></radialGradient>'
                '<radialGradient id="gDrop" cx=".35" cy=".35"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#d8ecff" stop-opacity=".9"/><stop offset="1" stop-color="#9fc4e6" stop-opacity=".85"/></radialGradient>'
                '<filter id="mS" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3a0d0d" flood-opacity=".35"/></filter>'
                '<linearGradient id="gArr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6f6ff"/><stop offset="1" stop-color="#7cc4ff"/></linearGradient>')
    ROOM_H = 2570
    room = f'''<div id="roomW" style="position:absolute;left:-4px;top:0;width:1088px;height:{ROOM_H}px">
 <img src="v1_room_ext.png" style="position:absolute;left:0;top:0;width:1088px;height:{ROOM_H}px">
 <svg viewBox="0 0 1088 {ROOM_H}" style="position:absolute;left:0;top:0;width:1088px;height:{ROOM_H}px;overflow:visible"><defs>{mol_defs}</defs>
  <path id="drop" d="M0 -10 C 6 -4 10 2 10 6 A 10 10 0 1 1 -10 6 C -10 2 -6 -4 0 -10 Z" fill="url(#gDrop)"/>
  <ellipse id="ripple" cx="553" cy="1013" rx="4" ry="3" fill="none" stroke="#eef7ff" stroke-width="2.5" opacity="0"/>
  <g id="lbl1" font-family="Inter" font-weight="900" text-anchor="middle" fill="#2c3e57">
    <text x="553" y="628" font-size="36" letter-spacing="1">PURE</text><text x="553" y="672" font-size="36" letter-spacing="1">WATER</text>
    <text x="553" y="706" font-size="18" fill="#6b7d96">for injection</text></g>
  <g id="lbl2" font-family="Inter" font-weight="900" text-anchor="middle" fill="#1d4f7a" opacity="0">
    <text x="553" y="624" font-size="44">0.9%</text><text x="553" y="664" font-size="28" letter-spacing="1">SALINE</text></g>
  <g id="lbl3" font-family="Inter" font-weight="900" text-anchor="middle" fill="#8a2f2f" opacity="0">
    <text x="553" y="624" font-size="48">3%</text><text x="553" y="664" font-size="28" letter-spacing="1">SALINE</text></g>
  <rect id="lblGlow" x="480" y="543" width="146" height="198" rx="10" fill="none" stroke="#ffd23f" stroke-width="6" opacity="0"/>
  <path id="warnGlow" d="M906 1690 C 860 1700, 800 1730, 760 1740" stroke="#ff5a4f" stroke-width="0" fill="none" opacity="0"/>
  <filter id="wgBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
  <circle cx="906" cy="1752" r="100" fill="none" stroke="#ff4a3d" stroke-width="30" opacity="0" class="wg" filter="url(#wgBlur)"/>
  <linearGradient id="blkV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1626" stop-opacity="0"/><stop offset="1" stop-color="#0b1626" stop-opacity=".55"/></linearGradient>
  <rect x="0" y="1790" width="1088" height="780" fill="url(#blkV)"/>
 </svg></div>'''
    vcells = "".join(f'<g class="vc"><image href="{d["f"]}" x="0" y="0" width="{d["w"]}" height="{d["h"]}"/></g>' for d in cells)
    vein = f'''<div id="veinW" style="position:absolute;inset:0">
 <img src="v1_vein_bg.png" style="position:absolute;left:-4px;top:0;width:1088px;height:1920px">
 <svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible"><defs>{mol_defs}{lpx.DEFS}</defs>
  <g id="wVein"></g>{vcells}
  <circle id="cellRing" cx="361" cy="1182" r="150" fill="none" stroke="#ffe27a" stroke-width="6" opacity="0" filter="url(#glowS)"/>
 </svg></div>'''
    closeup = f'''<div id="cellW" style="position:absolute;inset:0;opacity:0">
 <svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible"><defs>{mol_defs}
  <radialGradient id="gCloud"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
  <mask id="mCloud"><circle id="cloudR" cx="690" cy="1110" r="0" fill="url(#gCloud)"/></mask>
  <mask id="mGhost"><ellipse cx="548" cy="960" rx="400" ry="390" fill="#fff"/></mask></defs>
  <image href="v1_cell_a.png" x="-4" y="0" width="1088" height="1920"/>
  <g id="wCell"></g>
  <g id="cellA"><image href="v1_cell_a.png" x="-4" y="0" width="1088" height="1920" mask="url(#mGhost)"/></g>
  <g id="cellS" opacity="0"><image href="v1_cell_swollen.png" x="-4" y="0" width="1088" height="1920"/></g>
  <g id="cellB" opacity="0"><image href="v1_cell_burst.png" x="-4" y="0" width="1088" height="1920" mask="url(#mGhost)"/></g>
  <g id="cloud"><image href="v1_cell_burst.png" x="-4" y="0" width="1088" height="1920" mask="url(#mCloud)"/></g>
  <g id="inArrows" opacity="0">{"".join(f'<g transform="rotate({a} 548 975)"><path d="M548 470 L548 540 L532 540 L548 570 L564 540 L548 540" fill="url(#gArr)" stroke="#e6f6ff" stroke-width="10" stroke-linejoin="round" filter="url(#mS)"/></g>' for a in (30, 150, 210, 330))}{"".join(f'<g transform="rotate({a} 548 975)"><path d="M548 565 L548 527 L536 527 L548 510 L560 527 L548 527" fill="#ffd36a" stroke="#ffe9a8" stroke-width="7" stroke-linejoin="round"/></g>' for a in (90, 270))}</g>
 </svg></div>'''
    overlay = f'''<svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible"><defs>{mol_defs}{lpx.DEFS}
  <clipPath id="isoClip"><circle cx="270" cy="1150" r="205"/></clipPath>
  <radialGradient id="isoEdge"><stop offset=".86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0710" stop-opacity=".55"/></radialGradient></defs>
  <g id="isoW" opacity="0"><g transform="translate(50 0)">
   <circle cx="270" cy="1150" r="213" fill="#120a14" opacity=".55"/>
   <g clip-path="url(#isoClip)"><image href="v1_cell_a.png" x="{270 - 548 * 0.5 - 2:.0f}" y="{1150 - 975 * 0.5:.0f}" width="{1088 * 0.5:.0f}" height="{1920 * 0.5:.0f}"/>
     <g id="isoMol">{"".join('<g><circle cx="0" cy="0" r="11" fill="url(#gO)"/><circle cx="-11" cy="8" r="6.5" fill="url(#gH)"/><circle cx="11" cy="8" r="6.5" fill="url(#gH)"/></g>' for _ in range(16))}</g></g>
   <circle cx="270" cy="1150" r="205" fill="url(#isoEdge)"/>
   {"".join(f'<g transform="rotate({a} 270 1150)"><path d="M252 960 L252 1010 L236 1010 L252 1040 L268 1010 L252 1010" fill="#cfeeff" stroke="#e6f6ff" stroke-width="7" stroke-linejoin="round"/><path d="M290 1040 L290 990 L274 990 L290 960 L306 990 L290 990" fill="#ffd36a" stroke="#ffe9a8" stroke-width="7" stroke-linejoin="round"/></g>' for a in (0, 120, 240))}</g>
  </g>
  {chip("tagHypo", 540, 650, "hypotonic to your cells", "#9ed8ff", 38)}
  {chip("tagIn", 361, 960, "inside: salts + proteins", "#ffd23f", 34)}
  {chip("tagOut", 540, 800, "IV water: almost nothing dissolved", "#9ed8ff", 32)}
  {chip("tagWater", 548, 540, "net flow: IN", "#9ed8ff", 38)}
  {chip("tagOsm", 540, 600, "osmosis", "#ffd23f", 46)}
  {chip("tagHemo", 540, 545, "hemolysis: the cell bursts", "#ff8a7d", 40)}
  {chip("tagIso", 320, 880, "isotonic: no net flow", "#8cc86e", 34)}
  {chip("chIn", 260, 1080, "into his cells", "#9ed8ff", 44)}
  {chip("chOut", 260, 1190, "out of his cells", "#9ed8ff", 44)}
 </svg>'''

    # titles
    c.title('Pure water<br>in an <span class="y">IV</span>?', 0, out=T["why"] - 0.35, size=96)
    c.title('Pure water is<br><span class="t">hypotonic</span>', T["why"] + 0.4, out=C["why"][3] - 0.35, size=92)
    c.title('Water moves toward<br><span class="y">more dissolved</span>', C["why"][3], out=T["swell"] - 0.35, size=84)
    c.title('It swells, then<br><span class="r">bursts</span>', T["swell"], out=t_back - 0.05, size=92)
    c.title('IV fluid is <span class="t">never</span><br>plain water', t_back + 0.1, out=C["fix"][1] - 0.35, size=88)
    c.title('<span class="t">0.9% saline</span><br>is isotonic', C["fix"][1], out=T["ask"] - 0.35, size=88)
    c.title('<span class="y">3% saline</span>:<br>water in or out?', T["ask"], out=c.TOTAL, size=88)

    # hook: pan down the tubing to the catheter
    c.sound("monitor_beep_real", 0.05, 0.25); c.sound("water_pour_real", 0.3, 0.12); c.music_auto += [(0, 1.0, 0.3)]
    g(f'tl.fromTo("#lblGlow",{{opacity:0}},{{opacity:1,duration:0.25,yoyo:true,repeat:3,immediateRender:false}},{k("hook", "pure"):.2f});')
    g(f'tl.fromTo("#roomW",{{y:0}},{{y:{PAN},duration:{T["why"] - t_pan - 0.1:.2f},ease:"power2.inOut",immediateRender:false}},{t_pan:.2f});')
    c.sound("whoosh", t_pan, 0.4)
    g(f'tl.fromTo("#camA",{{scale:1}},{{scale:1.06,transformOrigin:"553px 640px",duration:{t_pan:.2f},ease:"sine.inOut",immediateRender:false}},0); tl.to("#camA",{{scale:1,duration:0.8,ease:"sine.inOut"}},{t_pan:.2f});')
    g(f'tl.fromTo("#camB",{{scale:1}},{{scale:1.15,transformOrigin:"{CATH[0]}px {CATH[1]}px",duration:{t_lens + 0.75 - t_pan - 0.3:.2f},ease:"sine.in",immediateRender:false}},{t_pan + 0.3:.2f}); tl.set("#camB",{{scale:1}},{t_lens + 0.8:.2f});')
    g(f'tl.to("#lbl1",{{opacity:0,duration:0.3}},{t_pan + 1.3:.2f}); tl.to("#lbl1",{{opacity:1,duration:0.3}},{t_back + 0.9:.2f});')
    g(f'tl.fromTo(".wg",{{opacity:0}},{{opacity:0.9,duration:0.35,yoyo:true,repeat:3,immediateRender:false}},{k("hook", "bursting") - 0.1:.2f});')
    # lens into the vein at the catheter
    g(f'tl.fromTo("#lensW",{{clipPath:"circle(0px at {CATH[0]}px {CATH[1]}px)"}},{{clipPath:"circle(2000px at {CATH[0]}px {CATH[1]}px)",duration:0.75,ease:"power3.in",immediateRender:false}},{t_lens:.2f});')
    g(f'tl.fromTo("#veinW",{{scale:0.5,transformOrigin:"{CATH[0]}px {CATH[1]}px"}},{{scale:1,duration:0.9,ease:"power2.out",immediateRender:false}},{t_lens:.2f});')
    c.sound("dive", t_lens, 0.9)
    c.fade_in("#tagHypo", k("why", "hypotonic"), 0.3, 10); c.sound("pop", k("why", "hypotonic"), 0.5)
    c.fade_out("#tagHypo", k("why", "your") - 0.2, 0.25)
    g(f'tl.fromTo("#cellRing",{{opacity:0,scale:0.8,transformOrigin:"361px 1182px"}},{{opacity:1,scale:1,duration:0.35,ease:"back.out(2)",immediateRender:false}},{k("why", "cells"):.2f});')
    c.fade_in("#tagIn", k("why", "tons"), 0.3, 10); c.sound("tick", k("why", "salts"), 0.5); c.sound("tick", k("why", "proteins"), 0.5)
    c.fade_in("#tagOut", k("why", "pure"), 0.3, 10); c.sound("tick", k("why", "none"), 0.5)
    c.fade_out("#tagIn, #tagOut, #cellRing", t_dive - 0.1, 0.25)
    # dive into one cell
    g(f'tl.to("#veinW",{{scale:2.2,transformOrigin:"361px 1182px",duration:0.8,ease:"power3.in"}},{t_dive:.2f});')
    g(f'tl.set("#cellW",{{opacity:1}},{t_dive + 0.3:.2f}); tl.fromTo("#cellW",{{clipPath:"circle(0px at 548px 975px)"}},{{clipPath:"circle(1300px at 548px 975px)",duration:0.65,ease:"power3.in",immediateRender:false}},{t_dive + 0.3:.2f});')
    g(f'tl.fromTo("#cellW",{{scale:1.25,transformOrigin:"548px 975px"}},{{scale:1,duration:0.9,ease:"power2.out",immediateRender:false}},{t_dive + 0.3:.2f});')
    c.sound("whoosh", t_dive, 0.6)
    tw = k("why", "toward")
    c.fade_in("#tagWater", tw, 0.3, 10); c.sound("pop", tw, 0.5)
    g(f'tl.fromTo("#inArrows",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{tw:.2f}); tl.fromTo("#inArrows",{{scale:1.06,transformOrigin:"548px 975px"}},{{scale:0.94,duration:0.45,yoyo:true,repeat:7,ease:"sine.inOut",immediateRender:false}},{tw:.2f});')
    c.sound("bubbling_real", k("why", "rushes"), 0.3)
    g(f'tl.fromTo("#cellA",{{scale:1}},{{scale:1.03,transformOrigin:"548px 975px",duration:{k("swell", "swells") - k("why", "rushes"):.2f},ease:"sine.in",immediateRender:false}},{k("why", "rushes"):.2f});')
    c.set("#tagWater", k("why", "osmosis") - 0.05, "opacity:0"); c.pop("#tagOsm", k("why", "osmosis")); c.sound("ding", k("why", "osmosis"), 0.5)
    # swell, then burst
    ts = k("swell", "swells")
    c.fade_out("#tagOsm, #inArrows", ts - 0.1, 0.25)
    g(f'tl.to("#cellS",{{opacity:1,duration:{k("swell", "round") - ts + 0.2:.2f},ease:"sine.inOut"}},{ts:.2f}); tl.to("#cellA",{{opacity:0,duration:0.3}},{k("swell", "round") + 0.1:.2f});')
    g(f'tl.fromTo("#cellS",{{scale:0.94,transformOrigin:"548px 975px"}},{{scale:1.02,duration:{k("swell", "pops") - ts:.2f},ease:"sine.inOut",immediateRender:false}},{ts:.2f});')
    c.sound("riser", ts, 0.35)
    tp = k("swell", "pops") - 0.05
    g(f'tl.to("#cellB",{{opacity:1,duration:0.18}},{tp:.2f}); tl.to("#cellS",{{opacity:0,duration:0.22}},{tp + 0.02:.2f});')
    g(f'tl.fromTo("#cellB",{{scale:1.03,transformOrigin:"548px 975px"}},{{scale:1,duration:0.4,ease:"back.out(2)",immediateRender:false}},{tp:.2f});')
    g(f'tl.fromTo("#cloudR",{{attr:{{r:0}}}},{{attr:{{r:900}},duration:2.6,ease:"power2.out",immediateRender:false}},{tp:.2f});')
    c.sound("splash_real", tp, 0.5); c.sound("punch", tp, 0.5)
    c.pop("#tagHemo", tp + 0.15)
    # back to the room: label 0.9% saline, isotonic inset
    c.fade_out("#tagHemo", t_back - 0.1, 0.2)
    g(f'tl.to("#lensW",{{clipPath:"circle(0px at {CATH[0]}px {CATH[1]}px)",duration:0.6,ease:"power3.inOut"}},{t_back:.2f});')
    g(f'tl.to("#roomW",{{y:0,duration:1.1,ease:"power2.inOut"}},{t_back + 0.45:.2f});')
    c.sound("swish", t_back, 0.5); c.sound("whoosh", t_back + 0.45, 0.35)
    tn = max(k("fix", "point"), t_back + 1.6)
    g(f'tl.fromTo("#roomW",{{scale:1}},{{scale:1.22,transformOrigin:"557px 640px",duration:{c.TOTAL - t_back - 1.6:.2f},ease:"sine.inOut",immediateRender:false}},{t_back + 1.6:.2f});')
    g(f'tl.to("#lbl1",{{opacity:0,duration:0.2}},{tn:.2f}); tl.to("#lbl2",{{opacity:1,duration:0.25}},{tn + 0.1:.2f});')
    g(f'tl.fromTo("#lblGlow",{{opacity:0}},{{opacity:1,duration:0.25,yoyo:true,repeat:3,immediateRender:false}},{tn:.2f});')
    c.sound("ding", tn + 0.1, 0.5)
    ti = k("fix", "as") - 0.3
    g(f'tl.fromTo("#isoW",{{opacity:0,scale:0.4,transformOrigin:"320px 1150px"}},{{opacity:1,scale:1,duration:0.45,ease:"back.out(1.8)",immediateRender:false}},{ti:.2f});')
    c.sound("pop", ti, 0.5); c.fade_in("#tagIso", ti + 0.1, 0.3, 10)
    c.fade_out("#isoW, #tagIso", T["ask"] - 0.5, 0.25)
    t3 = T["ask"]
    g(f'tl.to("#lbl2",{{opacity:0,duration:0.2}},{t3:.2f}); tl.to("#lbl3",{{opacity:1,duration:0.25}},{t3 + 0.1:.2f});')
    g(f'tl.fromTo("#lblGlow",{{opacity:0}},{{opacity:1,duration:0.25,yoyo:true,repeat:3,immediateRender:false}},{t3:.2f});')
    c.sound("ding", t3 + 0.1, 0.5)
    g(f'tl.fromTo("#lbl3",{{scale:1.15,transformOrigin:"553px 640px"}},{{scale:1,duration:0.35,ease:"back.out(2)",immediateRender:false}},{t3 + 0.1:.2f});')
    c.pop("#chIn", k("ask", "into")); c.sound("pop", k("ask", "into"), 0.5)
    c.pop("#chOut", k("ask", "out")); c.sound("pop", k("ask", "out"), 0.5)

    return f'''<div style="position:absolute;left:0;top:-440px;width:1080px;height:1920px;overflow:hidden">
<div id="camA" style="position:absolute;inset:0"><div id="camB" style="position:absolute;inset:0">{room}</div></div>
<div id="lensW" style="position:absolute;inset:0;background:#3a0d12;clip-path:circle(0px at {CATH[0]}px {CATH[1]}px)">{vein}{closeup}</div>
{overlay}</div>'''


SPEC = dict(
    id=ID, badge="AP BIOLOGY &nbsp;·&nbsp; TONICITY", tail=3.3, end_pad=1.1, bpm=86, key=4, seed=17,
    vars="--glow:#16314a;--acc1:#8cc86e;--acc2:#9ed8ff",
    css="#end{background:linear-gradient(rgba(10,8,26,.2),rgba(10,8,26,.45)),url(endbg.png) center/cover!important} #end-l1{font-size:78px;letter-spacing:-1.5px} #badge span{color:#c5ecaa;border-color:#8cc86e} .cap .w.on{color:#ffd23f} .tt .r{color:#ff8a7d} #wm{color:#c5ecaa}",
    end_line='Water follows<br>the <span style="color:#ffd23f">dissolved stuff</span><div style="font-size:58px;color:#bff8f2;margin-top:34px;font-weight:800">Free practice on</div>',
    beats=[dict(b) for b in B.IV], compose=compose, end_after_last=True,
)
lpx.apply_gaps(SPEC)
