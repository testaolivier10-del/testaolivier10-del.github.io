"""w1021-02 ball at the top (AP Physics 1, memory trick, AP exam traps #1, spoken CTA).

ART PLAN (all full screen 1080x1920)
- Park: Gemini (Nano Banana Pro) painted scene, style B reference garage_cut.png: sunny park from low on the grass,
  open sky, tree on the right. The tennis ball was painted IN the scene and cut out; the sky behind it filled from
  the surrounding gradient (v2_park_bg.png, ball.png).
- Student: Gemini painted him INTO the same scene (same light, rim light), seen from behind, looking up, right arm
  raised. A second Gemini edit of the same painting removed the arm. Body = no-arm painting minus the empty park
  (difference mask); arm = painting minus no-arm painting. Both scaled 0.68 about his feet so the throw has room.
  The arm is a painted part skinned on two bones (upper arm, forearm + hand) with studio paintskin (WebGL mesh),
  so the elbow bends smoothly for the toss; body breathes (tiny scale about the feet, arm root follows).
- Code (same palette, gradients, soft shadows): velocity arrow (yellow), acceleration arrow (coral), value pills,
  strobe ghosts of the painted ball, v-t graph panel, chips.

MOTION LIST (checked in Gate A)
1. Each throw: wind up (forearm folds 45 degrees, 0.55 s), push up, release at the open palm at full extension;
   the ball then flies straight up and down: y(tau) = palm - k (v0 tau - g tau^2 / 2), v0 = 4.9 m/s, g = 9.8 m/s^2
   (no air resistance), top at tau = 0.5 s (1.23 m up, k = 318 px/m), back at the palm at tau = 1 s, caught (small
   dip). Five throws: hook, B (up), B2 (rises on "acceleration's still", turns on "turns it around"), C (trick), D (ask). Playback time tau(t) is
   monotonic within each throw; slow motion is labelled "slow motion". While the ball is in his hand no arrows show.
2. Velocity arrow length proportional to v (up while rising, zero at the top, down while falling); pill v = +/-.
3. Acceleration arrow: constant 9.8 m/s^2 down for the whole flight, same length always.
4. Strobe ghosts every 0.0625 s of tau: spacing shrinks going up and grows coming down, mirror symmetric.
5. v-t graph: straight line v = 4.9 - 9.8 tau, crossing zero at 0.5 s; slope label -9.8 m/s^2 = a. Fades before the
   question so the answer is not on screen while it is asked.
6. Chips: t = 0 s: v = 4.9 m/s at release, t = 0.5 s: v = 0 at the top (drops 4.9 m/s in half a second).
7. The acceleration arrow and pill never pulse or dim in flight; they fade only within 0.08 s of tau of the hand.
"""
import json, math, shutil, sys
import lpx, beats_w1021 as B
from lpx import wt, chip
sys.path.insert(0, "/home/claude/lp")
from studio import skin, engine as S

ID = "w1021-02-ball-top"
OUT = f"/home/claude/lp/out/{ID}"
ART = "/home/claude/w1021/art"
PALM = (468.2, 1174.4); PXM = 318.0; V0 = 4.9; G = 9.8; BALL = 38
SJ, EJ, TIP = (418.6, 1366.2), (450.5, 1283.9), (476.4, 1163.5)
BODY = (278.5, 1262.8, 189, 557); ARM = (382.5, 1156.0)
FOLD = -45

ARROWS = '''
<linearGradient id="gV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff0a0"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#e2a400"/></linearGradient>
<linearGradient id="gA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffc0b4"/><stop offset=".55" stop-color="#ff6b5b"/><stop offset="1" stop-color="#d23f3a"/></linearGradient>
<filter id="aSh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#0b1a3a" flood-opacity=".45"/></filter>
<linearGradient id="gPanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14254f" stop-opacity=".92"/><stop offset="1" stop-color="#0b1633" stop-opacity=".92"/></linearGradient>
'''


def compose(c):
    for f, d in (("v2_park_bg.png", "bg.png"), ("ball.png", "ball.png"), ("stu_body.png", "stu_body.png"), ("end_v2.png", "endbg.png")):
        shutil.copy(f"{ART}/{f}", f"{OUT}/{d}")
    T, C, g = c.T, c.C, c.g
    k = lambda key, w, n=1: wt(c, key, w, n)
    trB = T["up"] + 0.65; trC = T["trick"] + 0.6; trD = T["ask"] + 0.6
    trB2 = 16.2
    throws = [
        dict(tr=-1, K=[(0.0, 0.2), (k("hook", "stops") - 0.05, 0.5), (k("hook", "so"), 0.53), (k("hook", "nope") + 0.25, 1.0)]),
        dict(tr=trB, K=[(trB, 0.0), (k("up", "every"), 0.43), (k("top", "top"), 0.5), (k("top", "for"), 0.53), (15.0, 1.0)]),
        dict(tr=trB2, K=[(trB2, 0.0), (k("top", "down"), 0.5), (k("top", "around") + 0.0, 1.0)]),
        dict(tr=trC, K=[(trC, 0.0), (k("trick", "flips"), 0.5), (k("trick", "never") + 0.3, 1.0)]),
        dict(tr=trD, K=[(trD, 0.0), (k("ask", "down") - 0.35, 0.5), (k("ask", "same") + 0.2, 0.93), (T["cta"] - 0.15, 1.0)]),
    ]
    slow = []
    for th in throws:
        for a, b in zip(th["K"][:-1], th["K"][1:]):
            if (b[1] - a[1]) / max(1e-6, b[0] - a[0]) < 0.85: slow.append((a[0], b[0]))
    up, fore = [[0, 0, "inout"]], [[0, 0, "inout"]]
    for th in throws[1:]:
        tr = th["tr"]; tw = tr - 0.55
        up += [[tw, 0, "inout"], [tw + 0.3, -10, "inout"], [tr, 2, "out"], [tr + 0.14, 4, "inout"], [tr + 0.55, 0, "inout"]]
        fore += [[tw, 0, "inout"], [tw + 0.32, FOLD, "inout"], [tw + 0.38, FOLD, "in"], [tr, 0, "out"], [tr + 0.14, -7, "inout"], [tr + 0.55, 0, "inout"]]
    for th in throws:
        tc = th["K"][-1][0]
        fore += [[tc - 0.02, 0, "inout"], [tc + 0.12, 14, "out"], [tc + 0.42, 0, "inout"]]
    fore.sort(key=lambda r: r[0]); up.sort(key=lambda r: r[0])
    breath = [[i * 0.25, 0, -1.7 * (0.5 - 0.5 * math.cos(2 * math.pi * i * 0.25 / 4.0)), "inout"] for i in range(int(c.TOTAL / 0.25) + 2)]
    clip = dict(bones=dict(up=up, fore=fore), root=breath)
    bones = [dict(id="up", parent=None, head=SJ, tail=EJ), dict(id="fore", parent="up", head=EJ, tail=TIP)]
    rig = skin.build(bones, [])
    paint = skin.build_paint(bones, [dict(id="arm", img=f"{ART}/stu_arm.png", src="arm.png", x=ARM[0], y=ARM[1], bones=["up", "fore"], z=1)], cell=8)
    arm_canvas = S.paint(c, rig, paint, clip, "armCv", 1080, 1920, t0=0.0, style="position:absolute;left:0;top:0")

    cfg = dict(throws=throws, PALM=PALM, PXM=PXM, V0=V0, G=G, slow=slow, BALL=BALL,
               strobe=[trC - 0.05, k("trick", "never") + 0.3], graph=[trC - 0.05, T["ask"] - 0.1],
               pillOff=[[T["trick"] - 0.1, T["ask"] + 0.2], [k("ask", "down") - 0.4, 99]], aOn=k("hook", "nope") - 0.05, gp=[k("top", "acceleration's") - 0.2, k("top", "that's")])
    g("const CFG=" + json.dumps(cfg) + ";")
    g(r'''
const NSb="http://www.w3.org/2000/svg";
function lerpK(K,t){if(t<=K[0][0])return K[0][1];for(let i=1;i<K.length;i++){if(t<=K[i][0]){const a=K[i-1],b=K[i];const u=(t-a[0])/Math.max(1e-6,b[0]-a[0]);
 const s=u*u*(3-2*u)*0.35+u*0.65; return a[1]+(b[1]-a[1])*s;}}return K[K.length-1][1];}
function state(t){ /* tau 0..1: release to catch */
 let cur=null; for(const th of CFG.throws){ if(t>=th.K[0][0]-0.0001 || th.tr<0) cur=th; }
 if(!cur) return {fly:false,tau:1};
 const end=cur.K[cur.K.length-1][0];
 if(t>end) return {fly:false,tau:1};
 return {fly:true,tau:lerpK(cur.K,t)};
}
function yAt(tau){return CFG.PALM[1]-CFG.PXM*(CFG.V0*tau-0.5*CFG.G*tau*tau);}
function arrowD(x,y0,y1,w){const L=y1-y0, s=Math.sign(L)||1, h=Math.min(Math.abs(L),30)*s, hw=w*1.9;
 if(Math.abs(L)<2) return "";
 return `M${x-w/2} ${y0} L${x-w/2} ${y1-h} L${x-hw} ${y1-h} L${x} ${y1} L${x+hw} ${y1-h} L${x+w/2} ${y1-h} L${x+w/2} ${y0} Z`;}
const ghosts=[];for(let i=0;i<17;i++){const im=document.createElementNS(NSb,"image");im.setAttribute("href","ball.png");im.setAttribute("width",CFG.BALL);im.setAttribute("height",CFG.BALL);im.setAttribute("opacity",0);document.getElementById("ghosts").appendChild(im);ghosts.push(im);}
window.__studioHooks.push(async function(t){
 const st=state(t); let bx=CFG.PALM[0]-4, by, tau=st.tau;
 if(st.fly){by=yAt(tau);} else { const r=window.__rig_armCv; const p=r? r.attach("fore",CFG.PALM[0],CFG.PALM[1],t):CFG.PALM; bx=p[0]-4; by=p[1]; }
 const v=CFG.V0-CFG.G*tau, R=CFG.BALL/2;
 document.getElementById("ballG").setAttribute("transform",`translate(${bx.toFixed(2)} ${(by-R*0.55).toFixed(2)}) rotate(${(tau*220+t*35).toFixed(1)})`);
 const on=(r)=>t>=r[0]&&t<=r[1]; const fly=st.fly; const fo=fly?Math.max(0,Math.min(1,(1-tau)/0.12)):0; const aShow=fly&&t>=CFG.aOn;
 document.getElementById("vArr").setAttribute("opacity",(fo*Math.min(1,tau/0.03)).toFixed(2)); const fa=fly?Math.max(0,Math.min(1,tau/0.03,(1-tau)/0.08)):0; document.getElementById("aArr").setAttribute("opacity",fa.toFixed(2));
 const vstart=by+(v>0?-R-6:R+6); const vy=v>0?-v*30:Math.max(0,Math.min(-v*30,CFG.PALM[1]-20-vstart));
 document.getElementById("vArr").setAttribute("d", (fly&&Math.abs(v)>0.8&&Math.abs(vy)>24)?arrowD(bx,vstart,vstart+vy,15):"");
 const vp=document.getElementById("vPill"); vp.setAttribute("transform",`translate(${bx-190} ${(by).toFixed(1)})`); let pf=0; for(const r of CFG.pillOff){pf=Math.max(pf,Math.min(1,Math.max(0,(t-r[0])/0.3))*Math.min(1,Math.max(0,(r[1]-t)/0.3)));} vp.setAttribute("opacity",fly?((1-pf)*fo).toFixed(2):0);
 document.getElementById("vTxt").textContent="v = "+(Math.abs(v)<0.3?"0":(v>0?"+":"−")+Math.abs(v).toFixed(1))+" m/s";
 const ax=bx+85; document.getElementById("aArr").setAttribute("d", aShow?arrowD(ax,by-40,by-40+130,15):"");
 const ap=document.getElementById("aPill"); ap.setAttribute("transform",`translate(${ax+34} ${(by+4).toFixed(1)})`); ap.setAttribute("opacity",aShow?((1-pf)*fa).toFixed(2):0);
 let sl=0;for(const r of CFG.slow) sl=Math.max(sl,Math.max(0,Math.min(1,(t-r[0])/0.25,(r[1]-t)/0.25))); document.getElementById("slowTag").setAttribute("opacity",sl);
 const sOn=on(CFG.strobe)&&(fly||t>CFG.strobe[0]+0.2); const sFade=Math.min(1,Math.max(0,(CFG.strobe[1]-t)/0.4));
 ghosts.forEach((im,i)=>{const tk=i*0.0625; if(sOn&&tk<tau-0.015&&tk<=1){const yy=yAt(tk); im.setAttribute("x",CFG.PALM[0]-4-R); im.setAttribute("y",yy-R-R*0.55); im.setAttribute("opacity",(0.5*sFade).toFixed(3));} else im.setAttribute("opacity",0);});
 const tt=fly?Math.min(Math.max(tau,0),1):(t<CFG.graph[0]+0.3?0:1);
 const gx=(s)=>710+s*320, gy=(vv)=>770-vv*30.6;
 if(on(CFG.graph)){const n=Math.max(2,Math.round(tt*40)); let d=""; for(let i=0;i<=n;i++){const s=tt*i/n; d+=(i?"L":"M")+gx(s).toFixed(1)+" "+gy(CFG.V0-CFG.G*s).toFixed(1);} document.getElementById("vLine").setAttribute("d",d);
  document.getElementById("vDot").setAttribute("cx",gx(tt)); document.getElementById("vDot").setAttribute("cy",gy(CFG.V0-CFG.G*tt));}
});
''')
    svg = f'''<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible"><defs>{lpx.DEFS}{ARROWS}</defs>
    <g id="ghosts"></g>
    <path id="aArr" fill="url(#gA)" filter="url(#aSh)"/>
    <path id="vArr" fill="url(#gV)" filter="url(#aSh)"/>
    <g id="vPill" opacity="0"><rect x="-140" y="-32" width="280" height="64" rx="32" fill="#0b1633" fill-opacity=".9" stroke="#ffd23f" stroke-width="4"/>
      <text id="vTxt" x="0" y="12" text-anchor="middle" class="lbl" font-size="34" fill="#ffd23f"></text></g>
    <g id="aPill" opacity="0"><rect x="-10" y="-32" width="310" height="64" rx="32" fill="#0b1633" fill-opacity=".9" stroke="#ff7a6b" stroke-width="4"/>
      <text x="145" y="12" text-anchor="middle" class="lbl" font-size="33" fill="#ff8a7d">a = 9.8 m/s² ↓</text></g>
    <g id="slowTag" opacity="0"><rect x="20" y="525" width="236" height="52" rx="26" fill="#0b1633" fill-opacity=".75"/>
      <circle cx="50" cy="551" r="9" fill="#ff6b5b"/><text x="148" y="562" text-anchor="middle" class="lbl" font-size="28" fill="#e6ecf8">slow motion</text></g>
    <g id="graphW" opacity="0"><g transform="translate(-25 0)"><rect x="620" y="560" width="445" height="430" rx="30" fill="url(#gPanel)" stroke="#e8b25a" stroke-opacity=".6" stroke-width="3" filter="url(#aSh)"/>
      <text x="842" y="604" text-anchor="middle" class="lbl" font-size="32" fill="#e6ecf8">v (m/s) vs t (s)</text>
      <rect x="708" y="616" width="5" height="310" rx="2" fill="#c9d6f2"/><rect x="708" y="768" width="338" height="4" rx="2" fill="#c9d6f2"/>
      <rect x="868" y="758" width="4" height="24" fill="#c9d6f2"/><rect x="1028" y="758" width="4" height="24" fill="#c9d6f2"/>
      <text x="698" y="640" text-anchor="end" class="lbl" font-size="30" fill="#c9d6f2">+4.9</text><text x="698" y="930" text-anchor="end" class="lbl" font-size="30" fill="#c9d6f2">−4.9</text>
      <text x="1052" y="744" text-anchor="end" class="lbl" font-size="32" fill="#c9d6f2">1 s</text><text x="880" y="744" text-anchor="start" class="lbl" font-size="32" fill="#c9d6f2">0.5 s</text>
      <path id="vLine" d="" stroke="#ffd23f" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle id="vDot" r="12" fill="#fff4b8" stroke="#ffd23f" stroke-width="4" cx="-50" cy="-50"/>
      <g id="zeroLbl" opacity="0"><text x="858" y="816" text-anchor="end" class="lbl" font-size="32" fill="#ffffff">v = 0</text></g>
      <g id="slopeLbl" opacity="0"><rect x="640" y="940" width="400" height="56" rx="28" fill="#0b1633" stroke="#ff7a6b" stroke-width="4"/>
        <text x="840" y="979" text-anchor="middle" class="lbl" font-size="32" fill="#ff8a7d">slope = −9.8 m/s² = a</text></g>
    </g></g>
    {chip("c98", 680, 1240, "t = 0 s:  v = 4.9 m/s", "#ffd23f", 34)}
    {chip("c0", 680, 1325, "t = 0.5 s:  v = 0", "#ffd23f", 34)}
    {chip("aQ", 220, 610, "a = 0 ?", "#ff8a7d", 44)}<path id="aQx" d="M115 647 L325 647" stroke="#ff4f6b" stroke-width="7" stroke-linecap="round" opacity="0"/>
    {chip("aSame", 225, 1000, "a never changes", "#ff8a7d", 38)}
    {chip("chB", 740, 660, "bigger", "#9fd0ff", 46)}
    {chip("chS", 740, 770, "smaller", "#9fd0ff", 46)}
    {chip("chE", 740, 880, "the same", "#9fd0ff", 46)}
    <g id="ballG"><circle r="{BALL * 0.95:.0f}" fill="#fffbe0" opacity=".45" filter="url(#glowS)"/><circle r="{BALL / 2 + 3:.0f}" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="3"/><image href="ball.png" x="{-BALL / 2}" y="{-BALL / 2}" width="{BALL}" height="{BALL}"/></g>
    </svg>'''

    c.title('Acceleration at the top:<br><span class="y">zero?</span>', 0, out=T["up"] - 0.35, size=80)
    c.title('Velocity drops <span class="y">9.8 m/s</span><br>every second', T["up"], out=T["top"] - 0.35, size=86)
    c.title('At the top: <span class="y">v = 0</span><br><span class="r">a = 9.8 m/s² ↓</span>', T["top"], out=T["trick"] - 0.35, size=84)
    c.title('<span class="y">Velocity</span> flips.<br><span class="r">Acceleration</span> doesn&#39;t.', T["trick"], out=T["ask"] - 0.35, size=86)
    c.title('Way down: <span class="t">bigger</span>,<br><span class="t">smaller</span>, or <span class="t">same</span>?', T["ask"], out=T["cta"] - 0.35, size=84)

    c.sound("series_ap_exam_traps", 0.0, 0.7)
    ta0 = k("hook", "acceleration's")
    c.pop("#aQ", ta0 - 0.05); c.sound("pop", ta0, 0.5)
    g(f'tl.to("#aQ rect",{{stroke:"#ff4f6b",duration:0.15}},{k("hook", "nope"):.2f}); tl.fromTo("#aQ",{{x:0}},{{x:-24,duration:0.06,yoyo:true,repeat:5,immediateRender:false}},{k("hook", "nope"):.2f});')
    c.sound("wrong", k("hook", "nope"), 0.5); c.fade_out("#aQ, #aQx", k("hook", "nope") + 0.8, 0.25)
    g(f'tl.fromTo("#aQx",{{opacity:0,scaleX:0,transformOrigin:"115px 647px"}},{{opacity:1,scaleX:1,duration:0.2,immediateRender:false}},{k("hook", "nope"):.2f});'); c.sound("punch", k("hook", "nope"), 0.5)
    for th in throws:
        tc = th["K"][-1][0]; c.sound("cloth_real", tc, 0.35)
        if th["tr"] > 0: c.sound("whoosh_real", th["tr"] - 0.15, 0.3); c.sound("cloth_real", th["tr"] - 0.5, 0.25)
    c.pop("#c98", trB); c.sound("tick", trB, 0.5)
    c.pop("#c0", k("top", "top") - 0.5); c.sound("tick", k("top", "top"), 0.6)
    c.fade_out("#c98, #c0", k("top", "for") + 1.2, 0.3)
    ta = k("top", "acceleration's")
    g(f'tl.fromTo("#aPill",{{scale:1}},{{scale:1.18,transformOrigin:"50% 50%",duration:0.25,yoyo:true,repeat:3,immediateRender:false}},{ta:.2f});')
    c.sound("ding", ta, 0.5)
    c.sound("swish", k("top", "that's"), 0.4)
    c.fade_in("#graphW", T["trick"] + 0.1, 0.35, 20); c.sound("swish", T["trick"] + 0.1, 0.5)
    for w in ("shrinks", "flips", "grows"):
        c.sound("tick", k("trick", w), 0.55)
    c.fade_in("#zeroLbl", k("trick", "flips"), 0.25, 8)
    c.pop("#slopeLbl", k("trick", "grows") + 0.3); c.sound("ding", k("trick", "grows") + 0.3, 0.5)
    c.pop("#aSame", C["trick"][4]); c.sound("ding", C["trick"][4], 0.45); c.fade_out("#aSame", min(k("trick", "changes") + 0.6, T["ask"] - 0.35), 0.25)
    c.fade_out("#graphW", T["ask"] - 0.45, 0.3)
    for sel, w in (("#chB", "bigger"), ("#chS", "smaller"), ("#chE", "same")):
        c.pop(sel, k("ask", w)); c.sound("pop", k("ask", w), 0.5)
    c.music_auto += [(0, 1.0, 0.35)]
    g(f'tl.fromTo(".ec",{{scale:0.3,opacity:0}},{{scale:1,opacity:1,duration:0.35,stagger:0.15,ease:"back.out(2.2)",immediateRender:false}},{T["cta"] + 0.7:.2f});')
    bx, by, bw, bh = BODY
    g(f'tl.fromTo("#stuBody",{{scaleY:1}},{{scaleY:1.004,transformOrigin:"112px 537px",duration:2.0,yoyo:true,repeat:{int(c.TOTAL / 2) + 1},ease:"sine.inOut"}},0);')
    return f'''<div style="position:absolute;left:0;top:-440px;width:1080px;height:1920px;overflow:hidden">
<img src="bg.png" style="position:absolute;left:-4px;top:0;width:1088px;height:1920px">
<img id="stuBody" src="stu_body.png" style="position:absolute;left:{bx - 4:.1f}px;top:{by:.1f}px;width:{bw}px;height:{bh}px">
<div style="position:absolute;left:-4px;top:0;width:1080px;height:1920px">{arm_canvas}</div>
{svg}</div>'''


SPEC = dict(
    id=ID, badge="AP® PHYSICS 1 &nbsp;·&nbsp; AP EXAM TRAPS #1", tail=0.4, bpm=96, key=2, seed=31,
    vars="--glow:#12306a;--acc1:#ffd23f;--acc2:#ff7a6b",
    css="#end{background:linear-gradient(rgba(10,8,26,.2),rgba(10,8,26,.45)),url(endbg.png) center/cover!important} #end-l1{font-size:78px;letter-spacing:-1.5px} #badge span{color:#ffd59a;border-color:#eba532} .cap .w.on{color:#ffd23f} .tt .r{color:#ff8a7d} #wm{color:#ffffff;background:rgba(8,20,40,.62);padding:4px 14px;border-radius:14px;left:24px!important;top:1240px!important} #end{justify-content:flex-start!important;padding-top:640px;box-sizing:border-box} #end::after{content:'New episode every week';position:absolute;bottom:560px;left:0;right:0;text-align:center;font-size:42px;color:#ffd59a;font-weight:800}",
    end_line='Acceleration <span style="color:#ff8a7d">never</span><br>takes a break<div style="font-size:52px;color:#ffffff;margin-top:30px;font-weight:800">Comment your answer</div><div style="margin-top:18px;display:flex;gap:18px;justify-content:center"><span class="ec" style="display:inline-block;font-size:54px;font-weight:900;color:#9fd0ff;background:#081428;border:5px solid #9fd0ff;border-radius:46px;padding:8px 30px">bigger</span><span class="ec" style="display:inline-block;font-size:54px;font-weight:900;color:#9fd0ff;background:#081428;border:5px solid #9fd0ff;border-radius:46px;padding:8px 30px">smaller</span><span class="ec" style="display:inline-block;font-size:54px;font-weight:900;color:#9fd0ff;background:#081428;border:5px solid #9fd0ff;border-radius:46px;padding:8px 30px">the same</span></div><div style="font-size:56px;color:#bff8f2;margin-top:18px;font-weight:800">Free practice for this on</div>',
    beats=[dict(b) for b in B.BALL], compose=compose,
)
lpx.apply_gaps(SPEC)
