"""w1021-03 speedometer (AP Calc AB, why explainer, poll post: next topic).

ART PLAN (full screen 1080x1920)
- Dashboard at dusk: Gemini (Nano Banana Pro) painted scene, style B reference garage_cut.png, driver's view.
  A second Gemini edit of the SAME painting removed the needle and the centre lane dashes; the needle was cut out of
  the first painting (difference + red mask) so the painted needle turns on the painted dial. The scene is lifted
  300 px so the odometer sits above the captions; the extra bottom is the dark panel continued.
- Code in the same palette: odometer digits rolling in the painted digit boxes, centre lane dashes streaming in
  perspective, the odometer graph panel, secant/tangent lines, readouts, answer chips.

MOTION LIST (checked in Gate A)
1. Trip clock m (minutes). Speed v(m) = 48 + 18 sin(2 pi (m - 15) / 50) mph; odometer = 4192.0 + s(m), s(m) = integral
   of v (miles), so the odometer always matches the speed. In scene A the trip runs in real time around m = 30.
2. Needle angle = 150 deg + v / 140 * 239 deg (painted dial ticks span 239 deg); lane dashes stream at a rate
   proportional to v.
3. Graph: odometer reading (miles driven since the start) against time (minutes, 0 to 60); curve = s(m).
   "Whole hour": secant from m = 0 to 60, slope readout = s(60) / 1 h in mph.
4. "Shrink the window": secant from m = 30 to 30 + w, w = 60 -> 1 min -> 1 s -> 0; readout = (s(30+w) - s(30)) / w * 60.
   It settles on v(30), the needle's reading.
5. Tangent at the moving point m = 30 -> 48: slope readout = v(m), needle in the inset follows v(m).
"""
import json, shutil
import lpx, beats_w1021 as B
from lpx import wt, chip

ID = "w1021-03-speedometer"
OUT = f"/home/claude/lp/out/{ID}"
ART = "/home/claude/w1021/art"
PIV = (543.5, 1168.5)          # needle pivot in the lifted painting (1080x1920 space, image is 1088 wide at x=-4)
NEEDLE = (574, 1357 - 300, 264, 114, -20.588)
DIGX = [422, 472, 521, 571, 620, 670]; DIGY = 1369


def compose(c):
    for f, g2 in (("v3_dash_tall.png", "dash.png"), ("needle.png", "needle.png"), ("cap.png", "cap.png"), ("end_v3.png", "endbg.png")):
        shutil.copy(f"{ART}/{f}", f"{OUT}/{g2}")
    T, C, g = c.T, c.C, c.g
    k = lambda key, w, n=1: wt(c, key, w, n)
    tA = T["avg"] - 0.1                     # dashboard shrinks into the inset, graph opens
    tB = k("ask", "odometer") - 0.4         # inset grows back
    cfg = dict(PIV=PIV, NEEDLE=NEEDLE, DIGX=DIGX, DIGY=DIGY, tA=tA, tB=tB,
               hour=[tA + 0.9, k("avg", "but") - 0.1],
               shrink=[T["shrink"], k("shrink", "minute"), k("shrink", "second"), k("shrink", "smaller"), k("shrink", "settles")],
               wK=[[k("shrink", "minute"), 0], [k("shrink", "second") - 0.55, 0], [k("shrink", "second"), -4.0943], [k("shrink", "smaller") - 0.55, -4.0943], [k("shrink", "smaller"), -8.6995], [k("shrink", "smaller") + 0.6, -11.0021]],
               vK=[[k("shrink", "minute"), 4.0943], [k("shrink", "minute") + 0.55, 0], [k("shrink", "second"), 0], [k("shrink", "second") + 0.55, -4.0943], [k("shrink", "smaller"), -4.0943], [k("shrink", "smaller") + 0.5, -8.6995], [k("shrink", "smaller") + 0.6, -8.6995], [k("shrink", "smaller") + 1.15, -11.0021]], lim=k("shrink", "derivative") - 0.1, digOn=k("odo", "odometer") - 0.3,
               slope=[k("slope", "tangent"), T["ask"] - 0.3])
    g("const CF=" + json.dumps(cfg) + ";")
    g(r'''
const NS3="http://www.w3.org/2000/svg";
function vOf(m){return 48+18*Math.sin(2*Math.PI*(m-15)/50);}
const SM=[0];(function(){for(let i=1;i<=7200;i++){const m0=(i-1)/100,m1=i/100;SM.push(SM[i-1]+(vOf(m0)+vOf(m1))/2*(0.01/60));}})();
function sOf(m){m=Math.max(0,Math.min(71.99,m));const i=Math.floor(m*100),f=m*100-i;return SM[i]*(1-f)+SM[i+1]*f;}
function ang(v){return 150+v/140*239;}
const gx=(m)=>120+m*14.5, gy=(s)=>990-s*6.6;
function eio(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
function seg(t,a,b){return Math.max(0,Math.min(1,(t-a)/Math.max(1e-6,b-a)));}
const dashes=[];for(let i=0;i<7;i++){const p=document.createElementNS(NS3,"path");p.setAttribute("fill","#f3ead8");document.getElementById("lane").appendChild(p);dashes.push(p);}
let digs=null;
function nice(n){return n<1.5?"1":(n>=1e6?(n/1e6).toFixed(1)+" million":new Intl.NumberFormat("en-US",{maximumSignificantDigits:2}).format(n));}
function keyL(K,t){if(t<=K[0][0])return K[0][1];for(let i=1;i<K.length;i++){if(t<=K[i][0])return K[i-1][1]+(K[i][1]-K[i-1][1])*eio(seg(t,K[i-1][0],K[i][0]));}return K[K.length-1][1];}
window.__studioHooks=window.__studioHooks||[];
window.__studioHooks.push(function(t){
 // trip clock: scene A real time near m=30; graph scenes use their own m
 let m=29.8+Math.min(t,CF.tA)/60*0.999;
 if(t>=CF.tA) m=30;
 if(t>CF.slope[0]) m=30+18*eio(seg(t,CF.slope[0],CF.slope[1]));
 if(t>CF.tB) m=48+(t-CF.tB)/60;
 let v=vOf(m); if(t<1.6){const u=eio(Math.min(1,t/1.6)); v=40+(v-40)*u+Math.sin(t*40)*0.25*(1-u);}
 document.querySelectorAll(".ndl").forEach(n=>n.setAttribute("transform",`rotate(${(ang(v)-CF.NEEDLE[4]).toFixed(2)} ${CF.PIV[0]} ${CF.PIV[1]})`));
 document.getElementById("mph").textContent=v.toFixed(1)+" mph";
 // odometer digits (5 + tenths), rolling
 const odo=4192+sOf(m), tenths=odo*10;
 if(!digs){digs=[];for(let i=0;i<6;i++){const g=document.getElementById("d"+i);digs.push(g);}}
 for(let i=0;i<6;i++){const place=Math.pow(10,5-i); const val=tenths/place; const d=Math.floor(val)%10; let frac=val-Math.floor(val);
  const fast=(t>CF.slope[0]&&t<CF.tB+0.5);
  let roll=(i==5)?(frac>0.85?(frac-0.85)/0.15:0):(Math.floor(tenths%place)>=place-1? Math.max(0,((tenths%1)-0.87)/0.13):0); if(fast) roll=0;
  const g=digs[i]; g.querySelector(".a").textContent=d; g.querySelector(".b").textContent=(d+1)%10;
  g.setAttribute("transform",`translate(0 ${(-roll*58).toFixed(1)})`);}
 // lane dashes in perspective (vanishing point 544,167)
 const ph=((sOf(m)*1609)/6)%1;
 dashes.forEach((p,i)=>{const z0=(i+ph)/7, z1=z0+0.06; const y0=167+190*Math.pow(z0,2.2), y1=167+190*Math.pow(z1,2.2); const w0=1+16*Math.pow(z0,2.2), w1=1+16*Math.pow(z1,2.2);
   p.setAttribute("d",`M${544-w0/2} ${y0} L${544+w0/2} ${y0} L${544+w1/2} ${y1} L${544-w1/2} ${y1} Z`); p.setAttribute("opacity",Math.min(1,z0*3).toFixed(2));});
 // graph: secant / tangent on a view that zooms in around the point
 let a=0,b=60,show=0,lbl="";
 const H=CF.hour, S=CF.shrink, P=CF.slope;
 if(t>=H[0]&&t<P[0]){show=1;
   if(t>=S[0]){ if(t<S[1]){const p1=eio(seg(t,S[0],S[0]+(S[1]-S[0])*0.45)), p2=eio(seg(t,S[0]+(S[1]-S[0])*0.45,S[1])); a=30*p1; b=60-29*p2;}
     else {a=30; b=30+Math.exp(keyL(CF.wK,t));}
     const w=b-a;
     const sec=w*60; lbl=w>=59.9?"1 hour":(w>=0.999?w.toFixed(w<10?1:0)+" min":(sec>=0.999?sec.toFixed(1)+" s":(sec>=0.00995?sec.toFixed(2)+" s":sec.toFixed(3)+" s")));
   } else { lbl="1 hour"; }
 }
 // view
 let hx=30, mc=30;
 if(show){const wv=(t<S[1])?60:Math.exp(keyL(CF.vK,t)); hx=Math.min(30,Math.max(0.75*wv,1e-9)); const z=hx/30; mc=30*z+(30+Math.min(wv,30)/2)*(1-z);}
 else if(t>=P[0]&&t<CF.tB){const hE=0.75/60000, u=eio(seg(t,P[0],P[0]+0.8)); hx=Math.exp(Math.log(hE)+(Math.log(30)-Math.log(hE))*u); const z=hx/30; mc=30*z+30*(1-z);}
 const z=hx/30, sc=sOf(mc), k6=6.6/z, Yc=(990-6.6*sc)+(795-(990-6.6*sc))*(1-z);
 const X=(mm)=>555+(mm-mc)/hx*435, Y=(sv)=>Yc-(sv-sc)*k6;
 const reveal=60*eio(seg(t,CF.tA+0.5,CF.tA+1.7));
 if(t>=CF.tA+0.4){let d="";const lo=Math.max(0,mc-hx*1.05), hi=Math.min(71.9,Math.min(mc+hx*1.05, z>0.999?reveal:99));
   for(let i=0;i<=120;i++){const mm=lo+(hi-lo)*i/120; d+=(i?"L":"M")+X(mm).toFixed(2)+" "+Y(sOf(mm)).toFixed(2);} document.getElementById("curve").setAttribute("d",hi>lo?d:"");}
 document.querySelectorAll(".tk").forEach(e=>e.setAttribute("opacity",Math.max(0,Math.min(1,(z-0.6)/0.4)).toFixed(2)));
 const zp=document.getElementById("zoomP"); const N=1/z; zp.setAttribute("opacity",(N>=1.5?1:0)); document.getElementById("zoomT").textContent="zoom ×"+nice(N);
 const sec=document.getElementById("sec"), tr=document.getElementById("rate");
 if(show){const sa=sOf(a), sb=sOf(b), w=Math.max(1e-12,b-a); const sl=(sb-sa)/w*60; const slp=(sb-sa)/w;
   const m0=mc-hx*1.2, m1=mc+hx*1.2; sec.setAttribute("d",`M${X(m0)} ${Y(sa+slp*(m0-a))} L${X(m1)} ${Y(sa+slp*(m1-a))}`);
   document.getElementById("pA").setAttribute("cx",X(a));document.getElementById("pA").setAttribute("cy",Y(sa));
   document.getElementById("pB").setAttribute("cx",X(b));document.getElementById("pB").setAttribute("cy",Y(sb));
   const bn=document.getElementById("bigN"); bn.setAttribute("opacity",(t>=S[1]-0.2?Math.max(0,Math.min(1,(t-S[1]+0.2)/0.3,(P[0]-t)/0.3)):0).toFixed(2)); document.getElementById("bigT").textContent=(t>=CF.lim?vOf(30).toFixed(2):sl.toFixed(2))+" mph";
   document.getElementById("rateT").textContent=(t>=CF.lim?`limit = ${vOf(30).toFixed(2)} mph = needle`:(t>=S[1]-0.2?`avg over ${lbl}`:`avg over ${lbl} = ${sl.toFixed(2)} mph`));
   tr.setAttribute("opacity",Math.min(1,(t-H[0])/0.3).toFixed(2)); sec.setAttribute("opacity",Math.min(1,(t-H[0])/0.3).toFixed(2)); sec.setAttribute("stroke","#ffd23f"); sec.setAttribute("stroke-width",5);}
 else if(t>=P[0]&&t<CF.tB){const sa=sOf(m), sl=vOf(m), slp=sl/60; document.getElementById("bigN").setAttribute("opacity",0);
   const hl=Math.min(15,hx*1.2); sec.setAttribute("d",`M${X(m-hl)} ${Y(sa-slp*hl)} L${X(m+hl)} ${Y(sa+slp*hl)}`); sec.setAttribute("opacity",1); sec.setAttribute("stroke",t>=P[0]+0.5?"#ff8a6b":"#ffd23f"); sec.setAttribute("stroke-width",8);
   document.getElementById("pA").setAttribute("cx",X(m));document.getElementById("pA").setAttribute("cy",Y(sa));
   document.getElementById("pB").setAttribute("cx",-99);
   document.getElementById("rateT").textContent=`tangent slope = ${sl.toFixed(1)} mph`; tr.setAttribute("opacity",1);}
 else {sec.setAttribute("opacity",0); tr.setAttribute("opacity",0); document.getElementById("bigN").setAttribute("opacity",0); document.getElementById("pA").setAttribute("cx",-99); document.getElementById("pB").setAttribute("cx",-99);}
 // odometer digits hidden while the dial is small or under the captions
 document.getElementById("digW").setAttribute("opacity",(t<CF.digOn?0.25:Math.min(1,0.25+(t-CF.digOn)/0.4*0.75)).toFixed(2));
});
''')
    # odometer digit columns: each shows digit a and the next digit b below it, clipped to its box
    dig = "".join(
        f'<clipPath id="dc{i}"><rect x="{x - 22}" y="{DIGY - 31}" width="44" height="62" rx="5"/></clipPath>'
        f'<g clip-path="url(#dc{i})"><g id="d{i}"><text class="a lbl" x="{x}" y="{DIGY + 17}" text-anchor="middle" font-size="46" fill="{"#7ff3e4" if i == 5 else "#f4efe6"}">0</text>'
        f'<text class="b lbl" x="{x}" y="{DIGY + 75}" text-anchor="middle" font-size="46" fill="{"#7ff3e4" if i == 5 else "#f4efe6"}">1</text></g></g>'
        for i, x in enumerate(DIGX))
    nx, ny, nw, nh, _ = NEEDLE
    dash_layer = (f'<img src="dash.png" style="position:absolute;left:-4px;top:-300px;width:1088px;height:2220px">'
                  f'<svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible">'
                  f'<defs><filter id="nSh" x="-30%" y="-60%" width="160%" height="220%"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#06101e" flood-opacity=".55"/></filter></defs>'
                  f'<g id="lane"></g>'
                  f'<g class="ndl" filter="url(#nSh)"><image href="needle.png" x="{nx - 4}" y="{ny}" width="{nw}" height="{nh}"/></g>'
                  f'<image href="cap.png" x="491" y="1120" width="96" height="96"/><g id="digW">{dig}</g></svg>')
    graph = f'''<svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible"><defs>{lpx.DEFS}
      <linearGradient id="gP3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a3d" stop-opacity=".93"/><stop offset="1" stop-color="#120f29" stop-opacity=".93"/></linearGradient>
      <filter id="pSh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#05040f" flood-opacity=".6"/></filter></defs>
      <g id="graphW" opacity="0">
        <rect x="40" y="545" width="1000" height="495" rx="34" fill="url(#gP3)" stroke="#e79a55" stroke-opacity=".9" stroke-width="4" filter="url(#pSh)"/><rect x="48" y="553" width="984" height="479" rx="28" fill="none" stroke="#ffb27a" stroke-opacity=".28" stroke-width="3"/>
        <rect x="116" y="590" width="5" height="402" rx="2" fill="#e8e0f4"/><rect x="116" y="988" width="900" height="5" rx="2" fill="#e8e0f4"/>
        <text x="134" y="618" class="lbl" font-size="36" fill="#ffd8a8">miles driven</text>
        <text x="772" y="1030" text-anchor="middle" class="lbl" font-size="30" fill="#e8e0f4">time (min)</text>
                <text class="tk lbl" x="104" y="862" text-anchor="end" font-size="24" fill="#c9bfe0">20</text>
        <text class="tk lbl" x="104" y="730" text-anchor="end" font-size="24" fill="#c9bfe0">40</text>
        <text class="tk lbl" x="120" y="1030" text-anchor="middle" font-size="26" fill="#c9bfe0">0</text>
        <text class="tk lbl" x="555" y="1030" text-anchor="middle" font-size="26" fill="#c9bfe0">30</text>
        <text class="tk lbl" x="990" y="1030" text-anchor="middle" font-size="26" fill="#c9bfe0">60</text>
        <clipPath id="plotClip"><rect x="121" y="588" width="900" height="400"/></clipPath>
        <g clip-path="url(#plotClip)"><path id="curve" d="" stroke="#7ff3e4" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path id="sec" d="" stroke="#ffd23f" stroke-width="6" fill="none" stroke-linecap="round" opacity="0"/>
        <circle id="pA" r="13" cx="-99" cy="0" fill="#fff3c0" stroke="#ffd23f" stroke-width="5"/>
        <circle id="pB" r="13" cx="-99" cy="0" fill="#fff3c0" stroke="#ffd23f" stroke-width="5"/></g>
        <g id="zoomP" opacity="0"><rect x="694" y="915" width="330" height="56" rx="28" fill="#120f29" stroke="#ffd23f" stroke-width="3"/>
          <text id="zoomT" x="859" y="953" text-anchor="middle" class="lbl" font-size="28" fill="#ffd23f">zoom</text></g>
      </g>
      <g id="rate" opacity="0"><rect x="60" y="1070" width="600" height="70" rx="35" fill="#120f29" fill-opacity=".92" stroke="#ffd23f" stroke-width="4" filter="url(#pSh)"/>
        <text id="rateT" x="360" y="1117" text-anchor="middle" class="lbl" font-size="31" fill="#ffd23f"></text></g>
      <g id="mphW" opacity="0"><rect x="820" y="1198" width="200" height="64" rx="32" fill="#0d1b26" fill-opacity=".92" stroke="#7ff3e4" stroke-width="4"/>
        <text id="mph" x="920" y="1242" text-anchor="middle" class="lbl" font-size="34" fill="#7ff3e4">0 mph</text></g>
      <g id="bigN" opacity="0"><text id="bigT" x="360" y="1262" text-anchor="middle" class="lbl" font-size="92" fill="#ffd23f" stroke="#120f29" stroke-width="10" paint-order="stroke">65.12 mph</text></g>
      {chip("qTag", 360, 1165, "45.3 vs 65.1 ?", "#ffd23f", 44)}
      {chip("chD", 300, 600, "derivative", "#ffd23f", 48)}
      {chip("chI", 780, 600, "integral", "#7ff3e4", 48)}
    </svg>'''
    # curve path (static) from the same v(m) in python
    import math
    vo = lambda m: 48 + 18 * math.sin(2 * math.pi * (m - 15) / 50)
    s, pts = 0.0, []
    for i in range(0, 601):
        m = i / 10
        if i: s += (vo(m - 0.1) + vo(m)) / 2 * (0.1 / 60)
        pts.append((120 + m * 14.5, 990 - s * 6.6))
    curve_d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)

    # ---- titles ----
    c.title('Your speedometer<br>does <span class="y">calculus</span>', 0, out=C["hook"][1] - 0.35, size=88)
    c.title('Instantaneous<br><span class="y">rate of change</span>', C["hook"][1], out=T["odo"] - 0.35, size=86)
    c.title('Odometer =<br><span class="t">total distance</span>', T["odo"], out=T["avg"] - 0.35, size=88)
    c.title('Average = <span class="y">miles ÷ hours</span>', T["avg"], out=T["shrink"] - 0.35, size=78)
    c.title('Shrink the window', T["shrink"], out=C["shrink"][5] - 0.35, size=88)
    c.title('That&#39;s the <span class="y">derivative</span>', C["shrink"][5], out=T["slope"] - 0.35, size=88)
    c.title('<span class="y">Slope</span> of the<br>tangent line', T["slope"], out=T["ask"] - 0.35, size=88)
    c.title('Odometer: <span class="y">derivative</span><br>or <span class="t">integral</span>?', T["ask"], out=c.TOTAL, size=82)

    # ---- scene A cues ----
    c.sound("whoosh_real", 0.0, 0.25); c.music_auto += [(0, 1.0, 0.35)]
    c.fade_in("#mphW", k("hook", "needle") - 0.1, 0.3, 10); c.sound("tick", k("hook", "needle"), 0.5)
    g(f'tl.fromTo(".ndl",{{filter:"url(#nSh) brightness(1)"}},{{filter:"url(#nSh) brightness(1.5)",duration:0.25,yoyo:true,repeat:3,immediateRender:false}},{k("hook", "needle"):.2f});')
    g('tl.set("#dashW",{y:150},0);')
    g(f'tl.to("#dashW",{{y:0,scale:1.28,transformOrigin:"546px 1400px",duration:0.9,ease:"power2.inOut"}},{k("odo", "odometer") - 0.3:.2f});')
    g(f'tl.fromTo(".odoGlow",{{opacity:0}},{{opacity:1,duration:0.3,yoyo:true,repeat:3,immediateRender:false}},{k("odo", "miles"):.2f});'); c.sound("tick", k("odo", "miles"), 0.5)
    g(f'tl.to("#dashW",{{scale:1.0,duration:0.8,ease:"power2.inOut"}},{k("odo", "speed") - 0.2:.2f});')
    # ---- dashboard shrinks into a round inset around the dial; graph opens ----
    c.sound("swish", tA, 0.6); c.sound("riser", tA - 0.5, 0.35)
    g(f'tl.fromTo("#dashW",{{clipPath:"circle(1400px at 543px 1168px)"}},{{clipPath:"circle(345px at 543px 1168px)",duration:0.6,ease:"power3.inOut"}},{tA:.2f});')
    g(f'tl.to("#dashW",{{scale:0.5,x:317,y:92,transformOrigin:"543px 1168px",duration:0.7,ease:"power3.inOut"}},{tA + 0.15:.2f});')
    g(f'tl.to("#ring",{{opacity:1,duration:0.3}},{tA + 0.5:.2f}); tl.to("#dimBg",{{opacity:1,duration:0.5}},{tA:.2f});')
    g(f'tl.to("#mphW",{{x:-370,y:112,duration:0.7,ease:"power3.inOut"}},{tA + 0.15:.2f});')
    c.fade_in("#graphW", tA + 0.3, 0.4, 20)
    c.sound("pen_scratch_real", tA + 0.5, 0.35)
    g(f'tl.fromTo("#ring",{{scale:1}},{{scale:1.06,svgOrigin:"860 1260",duration:0.22,yoyo:true,repeat:3,immediateRender:false}},{k("avg", "right"):.2f}); tl.fromTo("#mphW",{{scale:1}},{{scale:1.08,transformOrigin:"50% 50%",duration:0.22,yoyo:true,repeat:3,immediateRender:false}},{k("avg", "right"):.2f});'); c.sound("tick", k("avg", "right"), 0.5)
    c.pop("#qTag", k("avg", "impossible")); c.sound("pop", k("avg", "impossible"), 0.5); c.fade_out("#qTag", T["shrink"] - 0.1, 0.25)
    for w, n in (("minute", 1), ("second", 1), ("smaller", 1)):
        c.sound("tick", k("shrink", w), 0.6)
    c.sound("ding", k("shrink", "derivative"), 0.6)
    g(f'tl.fromTo("#ring",{{scale:1}},{{scale:1.06,svgOrigin:"860 1260",duration:0.22,yoyo:true,repeat:3,immediateRender:false}},{k("shrink", "settles"):.2f}); tl.fromTo("#bigN",{{scale:1}},{{scale:1.08,svgOrigin:"360 1230",duration:0.22,yoyo:true,repeat:3,immediateRender:false}},{k("shrink", "settles"):.2f});')
    g(f'tl.fromTo("#rate",{{scale:1}},{{scale:1.08,transformOrigin:"360px 1105px",duration:0.2,yoyo:true,repeat:3,immediateRender:false}},{k("shrink", "derivative"):.2f});')
    c.sound("swish", k("slope", "tangent"), 0.4)
    g(f'tl.fromTo("#ring",{{scale:1}},{{scale:1.06,svgOrigin:"860 1260",duration:0.25,yoyo:true,repeat:3,immediateRender:false}},{k("slope", "needle"):.2f});')
    # ---- back to the full dashboard, the answer chips ----
    c.fade_out("#graphW", tB - 0.35, 0.3); c.fade_out("#rate, #bigN", tB - 0.35, 0.3)
    g(f'tl.to("#dashW",{{scale:1,x:0,y:0,duration:0.7,ease:"power3.inOut"}},{tB:.2f}); tl.to("#dashW",{{clipPath:"circle(1400px at 543px 1168px)",duration:0.7,ease:"power3.in"}},{tB + 0.1:.2f});')
    g(f'tl.to("#ring",{{attr:{{cx:543,cy:1168,r:345}},duration:0.7,ease:"power3.inOut"}},{tB:.2f}); tl.to("#ring",{{opacity:0,duration:0.3}},{tB + 0.55:.2f}); tl.to("#dimBg",{{opacity:0,duration:0.35}},{tB + 0.55:.2f}); tl.to("#mphW",{{x:0,y:0,duration:0.7}},{tB:.2f});')
    c.sound("swish", tB, 0.5)
    g(f'tl.fromTo(".odoGlow",{{opacity:0}},{{opacity:1,duration:0.3,yoyo:true,repeat:3,immediateRender:false}},{k("ask", "odometer") + 0.3:.2f});')
    c.pop("#chD", k("ask", "derivative")); c.sound("pop", k("ask", "derivative"), 0.5)
    c.pop("#chI", k("ask", "integral")); c.sound("pop", k("ask", "integral"), 0.5)

    ring = ('<svg viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible">'
            '<circle id="ring" cx="860" cy="1260" r="176" fill="none" stroke="#e79a55" stroke-width="6" opacity="0"/>'
            '<defs><filter id="oGl" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="14"/></filter></defs><rect class="odoGlow" x="392" y="1330" width="306" height="80" rx="14" fill="none" stroke="#7ff3e4" stroke-width="16" stroke-opacity=".6" filter="url(#oGl)" opacity="0"/></svg>')
    return f'''<div style="position:absolute;left:0;top:-440px;width:1080px;height:1920px;overflow:hidden">
<div id="dimBg" style="position:absolute;inset:0;opacity:0;background:#120f29"><img src="dash.png" style="position:absolute;left:-4px;top:-300px;width:1088px;height:2220px;filter:blur(14px) brightness(.58) saturate(1.15)"></div>
<div id="dashW" style="position:absolute;inset:0;transform:translateY(150px)">{dash_layer}</div>
{ring}{graph}</div>'''


SPEC = dict(
    id=ID, badge="AP CALCULUS AB &nbsp;·&nbsp; DERIVATIVES", tail=2.4, bpm=90, key=7, seed=41,
    vars="--glow:#3a1f4e;--acc1:#e8507a;--acc2:#7ff3e4",
    css="#end{background:linear-gradient(rgba(10,8,26,.2),rgba(10,8,26,.45)),url(endbg.png) center/cover!important} #end-site{font-size:118px} #end-l1{font-size:78px;letter-spacing:-1.5px} #badge span{color:#ffb3c6;border-color:#e8507a} .cap .w.on{color:#ffd23f} #wm{color:#ffb3c6}",
    end_line='The needle is a<br><span style="color:#ffd23f">derivative</span><div style="font-size:58px;color:#bff8f2;margin-top:34px;font-weight:800">Free practice on</div>',
    beats=[dict(b) for b in B.SPEEDO], compose=compose, end_after_last=True,
)
lpx.apply_gaps(SPEC)
