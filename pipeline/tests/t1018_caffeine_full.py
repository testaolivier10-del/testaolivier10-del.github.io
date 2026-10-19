"""t1018 caffeine remake in style B, same script as w1014-03 so the two can be compared.
AI acting shots (Wan 2.2 on Modal): a student at 2 a.m. sips coffee and perks up; at the end he slumps.
AI stills (Qwen-Image-Edit, style B): brain, synapse background, receptor protein.
Code pieces drawn in that style: adenosine and caffeine molecules (gradients, rim light, soft shadow), receptor ON glow,
wake neuron signals, chips. Everything moves; the science matches the original."""
import math, random, json, shutil, os
import beats_w1014 as B
import lpx, chem
from lpx import wt, cam_to, chip

ID = "t1018-caffeine-full"
import fullbleed
OUT = f"/home/claude/lp/out/{ID}"
ART = "/tmp/m/characters/style_b"
ADEN = "Nc1ncnc2c1ncn2[C@@H]1O[C@H](CO)[C@@H](O)[C@H]1O"
CAFF = "Cn1c(=O)c2c(ncn2C)n(C)c1=O"

HEAD = (620, 400)                     # his head in the dorm shot (stage px)
REC_W = 220; REC_S = REC_W / 516; REC_H = 530 * REC_S
REC_BASE = 690                        # receptors stand in the membrane
REC_X = (250, 540, 830)
POCKET_Y = REC_BASE - REC_H + (74 + 348) / 2 * REC_S


def purine(fill, edge, rim):
    hexp = " ".join(f"{22*math.cos(math.radians(a)):.1f},{22*math.sin(math.radians(a)):.1f}" for a in range(30, 390, 60))
    pent = " ".join(f"{38+18*math.cos(math.radians(a)):.1f},{18*math.sin(math.radians(a)):.1f}" for a in (180, 252, 324, 36, 108))
    return (f'<g filter="url(#mShadow)"><polygon points="{hexp}" fill="{fill}" stroke="{edge}" stroke-width="3.5" stroke-linejoin="round"/>'
            f'<polygon points="{pent}" fill="{fill}" stroke="{edge}" stroke-width="3.5" stroke-linejoin="round"/></g>'
            f'<path d="M-19 -11 L0 -22 L19 -11" stroke="{rim}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>'
            f'<path d="M26 -10 L38 -18 L50 -10" stroke="{rim}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>')


def aden(x, y, cls="ad", rot=0, s=1.0, op=1):
    rib = " ".join(f"{-48+15*math.cos(math.radians(a)):.1f},{20+15*math.sin(math.radians(a)):.1f}" for a in (0, 72, 144, 216, 288))
    return (f'<g class="{cls}" opacity="{op}"><g transform="translate({x:.0f} {y:.0f}) rotate({rot}) scale({s})">'
            f'<path d="M-20 10 L-36 18" stroke="#f3b27a" stroke-width="5" stroke-linecap="round"/>'
            f'<polygon points="{rib}" fill="url(#gRib)" stroke="#c97a3c" stroke-width="3" stroke-linejoin="round" filter="url(#mShadow)"/>'
            f'<path d="M-60 12 L-48 5 L-36 12" stroke="#fff1d6" stroke-width="2.5" fill="none" opacity=".85" stroke-linecap="round"/>'
            f'{purine("url(#gAd)", "#1f6f99", "#d9f4ff")}</g></g>')


def caff(x, y, cls="cf", rot=0, s=1.0, op=1):
    nubs = "".join(f'<circle cx="{px}" cy="{py}" r="7" fill="url(#gNub)" stroke="#8a5a2a" stroke-width="2"/>' for px, py in ((0, -32), (-30, 18), (58, -22)))
    oxy = "".join(f'<circle cx="{px}" cy="{py}" r="8" fill="url(#gOx)" stroke="#b03a3a" stroke-width="2"/>' for px, py in ((-30, -16), (0, 32)))
    return (f'<g class="{cls}" opacity="{op}"><g transform="translate({x:.0f} {y:.0f}) rotate({rot}) scale({s})">'
            f'{purine("url(#gCf)", "#7a4a1e", "#fff0d6")}{nubs}{oxy}</g></g>')


def receptor(x, rid):
    top = REC_BASE - REC_H
    return (f'<g id="{rid}">'
            f'<image href="rec.png" x="{x - REC_W / 2:.1f}" y="{top:.1f}" width="{REC_W}" height="{REC_H:.1f}"/>'
            f'<g id="{rid}On" opacity="0"><ellipse cx="{x}" cy="{POCKET_Y + 40:.0f}" rx="70" ry="54" fill="url(#gOn)"/></g>'
            f'<circle id="{rid}Led" cx="{x}" cy="{REC_BASE + 46}" r="13" fill="#2a2347" stroke="#9b7bff" stroke-width="3"/>'
            f'</g>')


def copy_assets():
    shutil.copy("/tmp/m/characters/style_b/syn_fb.png", f"{OUT}/bg_syn.png"); shutil.copy("/tmp/m/characters/style_b/brain_fb.png", f"{OUT}/brain.png")
    shutil.copy(f"{ART}/rec.png", f"{OUT}/rec.png")


def compose(c):
    copy_assets()
    T, C, g = c.T, c.C, c.g
    TOT = c.TOTAL
    k = lambda key, w, n=1: wt(c, key, w, n)
    meta = json.load(open(f"{OUT}/clips.json"))
    rnd = random.Random(8)
    rg = lambda i, a, b: f'<radialGradient id="g{i}" cx=".35" cy=".3"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient>'
    defs = (f'{lpx.DEFS}{rg("Ad", "#b8ecff", "#2a8cc0")}{rg("Rib", "#ffe6c4", "#ee9f5c")}{rg("Cf", "#f7e2bd", "#b07a3e")}'
            f'{rg("Nub", "#f6e3c2", "#c9935a")}{rg("Ox", "#ffb0a8", "#d84a4a")}'
            '<radialGradient id="gOn"><stop offset="0" stop-color="#ffe27a" stop-opacity=".95"/><stop offset=".6" stop-color="#ffc83f" stop-opacity=".45"/><stop offset="1" stop-color="#ffc83f" stop-opacity="0"/></radialGradient>'
            '<filter id="mShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0a0620" flood-opacity=".55"/></filter>')

    # ---------- molecules and receptors over the AI synapse ----------
    ad_free = "".join(aden(120 + i * 105 + rnd.randint(-20, 20), (372 if i % 2 else 418) + rnd.randint(-8, 8), "adf", rnd.randint(-35, 35), 1.05, 0) for i in range(9))
    signals = "".join('<circle class="sig" cx="0" cy="0" r="11" fill="#ffd23f" filter="url(#glowS)"/>' for _ in range(5))
    py = POCKET_Y
    syn_svg = f'''<svg viewBox="0 0 1080 960" width="1080" height="960" style="position:absolute;left:0;top:0;overflow:visible"><defs>{defs}</defs>
    {receptor(REC_X[0], "r1")}{receptor(REC_X[1], "r2")}{receptor(REC_X[2], "r3")}
    <path id="axon" d="M-100 790 C200 760 400 820 700 780 S1100 760 1300 790" stroke="#ffd23f" stroke-width="5" fill="none" opacity=".22"/>
    <g id="sigs">{signals}</g>
    <g id="rateW"><rect x="40" y="700" width="290" height="66" rx="33" fill="#081428" fill-opacity=".9" stroke="#ffd23f" stroke-width="4"/>
      <circle id="rateLed" cx="72" cy="733" r="15" fill="#ffd23f" filter="url(#glowS)"/>
      <text x="212" y="745" text-anchor="middle" class="lbl" font-size="31" fill="#ffd23f">wake neuron</text></g>
    {ad_free}
    {aden(REC_X[0] - 12, py, "adDock1", s=1.5)}{aden(REC_X[1] - 12, py, "adDock2", s=1.5, op=0)}{aden(REC_X[2] - 12, py, "adDock3", s=1.5, op=0)}
    {caff(REC_X[1] - 26, py, "cfDock2", s=1.5, op=0)}{caff(REC_X[2] - 26, py, "cfDock3", s=1.5, op=0)}
    {aden(REC_X[1] - 12, py - 160, "adBounce", s=1.5, op=0)}
    <g id="presW"><rect x="760" y="700" width="280" height="66" rx="33" fill="#081428" fill-opacity=".9" stroke="#2ee6d6" stroke-width="4"/>
      <rect id="presFill" x="776" y="716" width="20" height="34" rx="17" fill="#2ee6d6"/>
      <text x="900" y="676" text-anchor="middle" class="lbl" font-size="30" fill="#2ee6d6">adenosine</text></g>
    {chip("dockTag", 540, 820, "fits its receptor", "#2ee6d6", 40)}
    {chip("slowTag", 540, 820, "wake neuron slows down", "#ffd23f", 40)}
    {chip("offTag", 540, 820, "never switches it on", "#ff8a8a", 40)}
    {chip("blockTag", 540, 820, "it just blocks it", "#e6c79a", 40)}
    {chip("siteTag", 540, 820, "one binding site", "#ffd23f", 42)}
    {chip("wearTag", 540, 820, "caffeine wears off", "#e6c79a", 40)}
    <g id="molCard" opacity="0"><rect x="30" y="40" width="1020" height="420" rx="30" fill="#0b0f2a" fill-opacity=".95" stroke="#4a3d8e" stroke-width="4"/>
      <rect x="34" y="44" width="1012" height="6" rx="3" fill="#ff9a4d" opacity=".55"/>
      {chem.mol2d(ADEN, OUT, "ad", 50, 70, 480, 330, bond_px=7)}
      <g id="adHL" opacity="0">{chem.mol2d(ADEN, OUT, "adh", 50, 70, 480, 330, highlight=list(range(1, 10)), bond_px=7)}</g>
      {chem.mol2d(CAFF, OUT, "cf", 560, 80, 460, 310, bond_px=7)}
      <g id="cfHL" opacity="0">{chem.mol2d(CAFF, OUT, "cfh", 560, 80, 460, 310, highlight=[1, 2, 4, 5, 6, 7, 8, 10, 12], bond_px=7)}</g>
      <text x="290" y="436" text-anchor="middle" class="lbl" font-size="40" fill="#7fd1ff">adenosine</text>
      <text x="790" y="436" text-anchor="middle" class="lbl" font-size="40" fill="#e6c79a">caffeine</text>
      <g id="ribTag" opacity="0"><path d="M300 330 C330 360 360 370 400 360" stroke="#f0b37a" stroke-width="4" fill="none" stroke-dasharray="8 6"/>
        <text x="300" y="400" class="lbl" font-size="38" fill="#f0b37a">sugar</text></g></g>
    {chip("adnTag", 540, 470, "same adenine like core", "#ffd23f", 40)}
    </svg>'''

    # overlays on the dorm shot (house chips)
    dorm_svg = f'''<svg viewBox="0 0 1080 960" width="1080" height="960" style="position:absolute;left:0;top:0;overflow:visible"><defs>{defs}</defs>
    <g id="battW" opacity="0" transform="translate(400 200)"><rect x="0" y="0" width="190" height="92" rx="18" fill="#081428" fill-opacity=".92" stroke="#e3ebf7" stroke-width="5"/>
      <rect x="190" y="28" width="14" height="36" rx="4" fill="#e3ebf7"/>
      <rect id="battFill" x="14" y="14" width="34" height="64" rx="9" fill="#ff6b6b"/>
      <text x="95" y="-16" text-anchor="middle" class="lbl" font-size="34" fill="#ff8a8a">energy</text></g>
    <g id="sigW" opacity="0" transform="translate(690 192)"><rect x="0" y="0" width="250" height="74" rx="37" fill="#081428" fill-opacity=".92" stroke="#9b7bff" stroke-width="4"/>
      <path d="M30 37 C50 12 70 62 90 37 S130 12 150 37 S190 62 220 37" stroke="#c9b6ff" stroke-width="6" fill="none"/>
      <g id="sigX" opacity="0"><circle cx="125" cy="37" r="50" fill="none" stroke="#ff4f6b" stroke-width="9"/><path d="M90 2 L160 72" stroke="#ff4f6b" stroke-width="9"/></g>
      <text x="125" y="112" text-anchor="middle" class="lbl" font-size="32" fill="#c9b6ff">sleep signal</text></g>
    <circle id="lensRing" cx="{HEAD[0]}" cy="{HEAD[1]}" r="0" fill="none" stroke="#ffc583" stroke-width="6" opacity="0"/>
    </svg>'''

    def clip_img(cid, d, op=0):
        return (f'<img id="{cid}" class="mclip" data-dir="{d["dir"]}" data-start="{d["start"]:.3f}" data-n="{d["n"]}" data-fps="30" data-hold="manual" '
                f'style="position:absolute;left:0;top:-440px;width:1080px;height:1920px;opacity:{op}" src="{d["dir"]}/0000.png">')

    # ---------- always moving ----------
    g(f'tl.fromTo(".adf",{{x:0,y:0}},{{x:(i)=>((i%2)?40:-40),y:(i)=>((i%3)-1)*14,rotation:(i)=>((i%2)?25:-25),transformOrigin:"50% 50%",duration:2.2,yoyo:true,repeat:{int(TOT/2.2)},ease:"sine.inOut"}},0);')
    g('const AX=document.getElementById("axon"); const AL=AX.getTotalLength(); const SG={v:0};'
      'function sgu(){document.querySelectorAll(".sig").forEach((e,i)=>{const p=AX.getPointAtLength(((SG.v*AL)+(i*AL/5))%AL); e.setAttribute("cx",p.x); e.setAttribute("cy",p.y);});} sgu();')
    g(f'tl.fromTo("#synBg",{{scale:1.0,transformOrigin:"540px 480px"}},{{scale:1.05,duration:{TOT:.2f},ease:"none"}},0);')

    # ---------- titles ----------
    c.title('Caffeine doesn&#39;t give<br>you <span class="y">energy</span>', 0, out=T["dive"] - 0.15, size=92)
    c.title('<span class="t">Adenosine</span> builds up', T["dive"], out=C["dive"][2] - 0.1, size=96)
    c.title('Wake neuron <span class="y">slows</span>', C["dive"][2], out=T["block"] - 0.12, size=96)
    c.title('<span style="color:#e6c79a">Caffeine</span> looks alike', T["block"], out=C["block"][1] - 0.1, size=96)
    c.title('Same receptor,<br><span class="r">never switched on</span>', C["block"][1], out=T["trap"] - 0.12, size=86)
    c.title('<span style="color:#c9b6ff">AP Bio</span>: competitive<br>antagonist', T["trap"], out=C["trap"][2] - 0.1, size=86)
    c.title('<span class="t">Sleep pressure</span> keeps building', C["trap"][2], out=T["cta"] - 0.12, size=84)

    # ---------- A: the acting shot, then battery stays low, sleep signal blocked ----------
    c.set("#clipA", 0, "opacity:1")
    c.sound("page_flip_real", 0.02, 0.5); c.music_auto += [(0, 1.2, 0.3)]
    c.sound("water_pour_real", k("hook", "give") - 0.15, 0.3)
    c.fade_in("#battW", k("hook", "energy") - 0.2, 0.3, 10); c.sound("tick", k("hook", "energy"), 0.5)
    g(f'tl.fromTo("#battFill",{{opacity:1}},{{opacity:0.3,duration:0.2,yoyo:true,repeat:5,immediateRender:false}},{k("hook", "energy"):.2f});')
    c.fade_in("#sigW", k("hook", "blocks") - 0.1, 0.3, 10)
    c.pop("#sigX", k("hook", "blocks") + 0.15, 0.35); c.sound("wrong", k("hook", "blocks") + 0.15, 0.5)

    # ---------- dive: a lens opens on his head, the brain, then into one synapse ----------
    t = T["dive"] - 0.15
    c.fade_out("#battW, #sigW", t - 0.1, 0.2)
    g(f'tl.fromTo("#lensW",{{clipPath:"circle(0px at {HEAD[0]}px {HEAD[1] + 440}px)"}},{{clipPath:"circle(1700px at {HEAD[0]}px {HEAD[1] + 440}px)",duration:0.75,ease:"power3.in"}},{t:.2f});')
    g(f'tl.fromTo("#lensRing",{{attr:{{r:0}},opacity:1}},{{attr:{{r:900}},opacity:0,duration:0.75,ease:"power3.in"}},{t:.2f});')
    g(f'tl.fromTo("#brainW",{{scale:0.55,transformOrigin:"540px 470px"}},{{scale:1.0,duration:0.9,ease:"power2.out"}},{t:.2f});')
    c.sound("dive", t, 1.0)
    c.set("#clipA", t + 0.8, "opacity:0")
    tsy = k("dive", "builds") - 0.1
    g(f'tl.fromTo("#brSpot",{{opacity:0}},{{opacity:0.95,duration:0.25,yoyo:true,repeat:1,immediateRender:false}},{t + 0.75:.2f});')
    g(f'tl.to("#brainW",{{scale:6,transformOrigin:"600px 400px",opacity:0,duration:0.6,ease:"power3.in"}},{tsy - 0.55:.2f});')
    c.sound("whoosh", tsy - 0.55, 0.7)
    g(f'tl.fromTo("#synW",{{opacity:0,scale:1.6,transformOrigin:"540px 480px"}},{{opacity:1,scale:1.0,duration:0.75,ease:"power3.out"}},{tsy - 0.15:.2f});')
    # adenosine builds up while he is awake
    g(f'tl.to(".adf",{{opacity:1,duration:0.3,stagger:0.12}},{tsy:.2f});')
    g(f'tl.to("#presFill",{{attr:{{width:220}},duration:{C["trap"][2] - tsy:.2f},ease:"none"}},{tsy:.2f});')
    for i in range(5): c.sound("pop", tsy + 0.1 + i * 0.3, 0.3)
    g(f'tl.to(SG,{{v:4,duration:{k("dive", "neurons"):.2f},ease:"none",onUpdate:sgu}},0);')
    g(f'tl.fromTo("#rateLed",{{opacity:1}},{{opacity:0.2,duration:0.15,yoyo:true,repeat:{int(k("dive", "neurons") / 0.15)},ease:"none"}},0);')
    tf = C["dive"][1]
    g(f'tl.fromTo(".adDock1",{{x:-120,y:-200,rotation:-40,transformOrigin:"50% 50%"}},{{x:0,y:0,rotation:0,duration:0.6,ease:"back.out(1.4)",immediateRender:false}},{tf:.2f});')
    g(f'tl.to("#r1On",{{opacity:1,duration:0.3}},{k("dive", "receptor"):.2f}); tl.to("#r1Led",{{fill:"#ffd23f",duration:0.2}},{k("dive", "receptor"):.2f});')
    c.fade_in("#dockTag", tf, 0.3, 10); c.sound("glass_clink_real", k("dive", "receptor"), 0.6)
    g(f'tl.to(".adDock2, .adDock3",{{opacity:1,duration:0.4,stagger:0.2}},{k("dive", "receptor") + 0.3:.2f});')
    g(f'tl.to("#r2On, #r3On",{{opacity:1,duration:0.3,stagger:0.2}},{k("dive", "receptor") + 0.5:.2f}); tl.to("#r2Led, #r3Led",{{fill:"#ffd23f",duration:0.2,stagger:0.2}},{k("dive", "receptor") + 0.5:.2f});')
    tn = C["dive"][2]
    c.fade_out("#dockTag", tn - 0.1, 0.2); c.fade_in("#slowTag", tn, 0.3, 10)
    g(f'tl.to(SG,{{v:4.6,duration:{T["block"] - tn:.2f},ease:"power2.out",onUpdate:sgu}},{tn:.2f});')
    g(f'tl.to(".sig",{{opacity:0.35,duration:0.8}},{k("dive", "slow"):.2f}); tl.to("#rateLed",{{opacity:0.25,duration:0.6}},{k("dive", "slow"):.2f});')
    cam_to(c, tn, 452, 560, 1.2, 0.7)
    c.sound("numb", k("dive", "slow"), 0.8); c.music_auto += [(k("dive", "slow"), T["block"] - 0.2, 0.3)]

    # ---------- block ----------
    t = T["block"]
    c.cam(t - 0.1, 1.0, 0, 0, 0.5)
    c.fade_out("#slowTag", t - 0.1, 0.2)
    g(f'tl.fromTo("#molCard",{{opacity:0,y:40}},{{opacity:1,y:0,duration:0.35,ease:"power3.out",immediateRender:false}},{t:.2f});')
    c.sound("swish", t - 0.05, 0.7); c.sound("riser", t - 0.6, 0.4)
    tad = k("block", "adenine")
    g(f'tl.to("#adHL, #cfHL",{{opacity:1,duration:0.35}},{tad:.2f}); tl.fromTo("#adnTag",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{tad + 0.1:.2f});')
    c.sound("shimmer", tad, 0.7)
    g(f'tl.fromTo("#ribTag",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{k("block", "adenosine"):.2f});')
    tfit = C["block"][1]
    c.fade_out("#molCard, #adnTag", tfit - 0.15, 0.25)
    g(f'tl.to(".adDock2",{{y:-260,x:-80,rotation:-50,transformOrigin:"50% 50%",opacity:0,duration:0.5,ease:"power2.in"}},{tfit - 0.1:.2f}); tl.to("#r2On",{{opacity:0,duration:0.3}},{tfit - 0.1:.2f}); tl.to("#r2Led",{{fill:"#2a2347",duration:0.2}},{tfit - 0.1:.2f});')
    g(f'tl.fromTo(".cfDock2",{{opacity:0,x:140,y:-240,rotation:40,transformOrigin:"50% 50%"}},{{opacity:1,x:0,y:0,rotation:0,duration:0.6,ease:"back.out(1.4)",immediateRender:false}},{tfit + 0.1:.2f});')
    c.sound("glass_clink_real", tfit + 0.6, 0.6)
    cam_to(c, tfit, 540, 520, 1.15, 0.6)
    toff = C["block"][2]
    c.fade_in("#offTag", toff, 0.3, 10)
    g(f'tl.fromTo("#r2Led",{{scale:1}},{{scale:1.3,transformOrigin:"50% 50%",duration:0.15,yoyo:true,repeat:3,immediateRender:false}},{toff + 0.2:.2f});')
    c.sound("wrong", toff + 0.3, 0.4)
    tbl = C["block"][3]
    c.fade_out("#offTag", tbl - 0.1, 0.2); c.fade_in("#blockTag", tbl, 0.3, 10)
    g(f'tl.fromTo(".adBounce",{{opacity:1,y:-160}},{{y:-30,duration:0.35,ease:"power2.in",immediateRender:false}},{tbl:.2f}); tl.to(".adBounce",{{y:-240,x:180,rotation:120,transformOrigin:"50% 50%",opacity:0,duration:0.6,ease:"power2.out"}},{tbl + 0.35:.2f});')
    c.sound("punch", tbl + 0.35, 0.6)

    # ---------- trap ----------
    t = T["trap"]
    c.cam(t, 1.0, 0, 0, 0.5)
    c.fade_out("#blockTag", t - 0.1, 0.2)
    ta = k("trap", "competitive")
    c.sound("pop", ta, 0.6)
    g(f'tl.to(".cfDock3",{{opacity:1,duration:0.01}},{ta:.2f}); tl.fromTo(".cfDock3",{{x:120,y:-220}},{{x:0,y:0,duration:0.5,ease:"back.out(1.4)",immediateRender:false}},{ta:.2f});')
    g(f'tl.to(".adDock3",{{y:-140,x:-60,duration:0.5,ease:"power2.out"}},{ta:.2f}); tl.to("#r3On",{{opacity:0,duration:0.3}},{ta:.2f}); tl.to("#r3Led",{{fill:"#2a2347",duration:0.2}},{ta:.2f});')
    ttw = C["trap"][1]
    cam_to(c, ta - 0.1, 680, 520, 1.35, 0.6)
    c.fade_out("#rateW, #presW", ta - 0.1, 0.25)
    g(f'tl.to(".adDock3",{{y:-80,x:-30,duration:0.25,yoyo:true,repeat:5,ease:"sine.inOut"}},{ttw:.2f}); tl.to(".cfDock3",{{y:-14,duration:0.25,yoyo:true,repeat:5,ease:"sine.inOut"}},{ttw + 0.12:.2f});')
    c.fade_in("#siteTag", k("trap", "one"), 0.3, 10)
    g(f'tl.fromTo("#r3",{{filter:"brightness(1)"}},{{filter:"brightness(1.5)",duration:0.2,yoyo:true,repeat:3,immediateRender:false}},{k("trap", "site"):.2f});')
    c.sound("tick", ttw + 0.2, 0.5); c.sound("tick", ttw + 0.7, 0.5)
    tsp = C["trap"][2]
    c.cam(tsp, 1.0, 0, 0, 0.6)
    c.fade_out("#siteTag", tsp - 0.1, 0.2)
    c.fade_in("#rateW, #presW", tsp + 0.3, 0.3, 0)
    g(f'tl.to("#presFill",{{attr:{{width:248}},fill:"#ff9a3d",duration:1.4,ease:"power1.in"}},{tsp:.2f});')
    g(f'tl.to(".adf",{{scale:1.15,transformOrigin:"50% 50%",duration:0.4,stagger:0.05}},{tsp:.2f});')
    c.sound("heartbeat_real", tsp, 0.35); c.sound("riser", tsp + 0.4, 0.5)
    two = C["trap"][3]
    c.fade_in("#wearTag", two, 0.3, 10)
    g(f'tl.to(".cfDock2, .cfDock3",{{y:-300,opacity:0,rotation:60,transformOrigin:"50% 50%",duration:0.6,stagger:0.1,ease:"power2.in"}},{k("trap", "wears"):.2f});')
    th = k("trap", "hits") - 0.15
    g(f'tl.to(".adDock2, .adDock3",{{opacity:1,x:0,y:0,rotation:0,duration:0.35,ease:"power3.in"}},{th - 0.35:.2f});')
    g(f'tl.to("#r1On, #r2On, #r3On",{{opacity:1,duration:0.2}},{th:.2f}); tl.to("#r1Led, #r2Led, #r3Led",{{fill:"#ffd23f",duration:0.2}},{th:.2f});')
    g(f'tl.to("#cam",{{y:16,duration:0.08,yoyo:true,repeat:3,ease:"none"}},{th:.2f});')
    c.sound("punch", th, 0.9); c.sound("numb", th + 0.1, 0.7)
    # back out to him: the synapse closes like a lens onto his head and the second shot (he slumps) plays
    tb2 = th + 0.45
    c.set("#clipB", tb2 - 0.01, "opacity:1")
    c.fade_out("#wearTag", tb2 - 0.1, 0.2)
    g(f'tl.to("#lensW",{{clipPath:"circle(0px at {HEAD[0]}px {HEAD[1] + 440}px)",duration:0.6,ease:"power3.inOut"}},{tb2:.2f});')
    c.sound("swish", tb2 - 0.05, 0.6); c.sound("gasp_male_real", tb2 + 0.4, 0.4)

    return fullbleed.wrap(f'''
<div id="sceneA" style="position:absolute;inset:0">{clip_img("clipA", meta["A"])}{clip_img("clipB", meta["B"])}{dorm_svg}</div>
<div id="lensW" style="position:absolute;left:0;top:-440px;width:1080px;height:1920px;background:#070a1e;clip-path:circle(0px at {HEAD[0]}px {HEAD[1] + 440}px)">
 <div style="position:absolute;left:0;top:440px;width:1080px;height:960px">
  <div id="brainW" style="position:absolute;inset:0"><img src="brain.png" style="position:absolute;left:-4px;top:-440px;width:1088px;height:1920px">
    <svg viewBox="0 0 1080 960" width="1080" height="960" style="position:absolute;left:0;top:0"><defs>{lpx.DEFS}</defs><circle id="brSpot" cx="600" cy="400" r="34" fill="#ffd23f" opacity="0" filter="url(#glow)"/></svg></div>
  <div id="synW" style="position:absolute;inset:0;opacity:0"><img id="synBg" src="bg_syn.png" style="position:absolute;left:-4px;top:-440px;width:1088px;height:1920px">{syn_svg}</div>
 </div>
</div>''')


SPEC = dict(
    id=ID, badge="AP BIO  CELL SIGNALING", tail=0.4, bpm=92, key=5, seed=23,
    vars="--glow:#2a1a5e;--acc1:#9b7bff;--acc2:#2ee6d6",
    css="#end-l1{font-size:80px;letter-spacing:-1.5px} #badge span{color:#c9b6ff;border-color:#c9b6ff} .cap .w.on{color:#ffd23f} .cap span.box{background:rgba(22,12,52,.9);border-color:rgba(201,182,255,.3)} .tt .t{color:#7fe0d0} #wm{color:#c9b6ff}" + fullbleed.CSS,
    end_line='Caffeine <span style="color:#ffd23f">blocks</span><br>the sleep signal<div style="font-size:58px;color:#bff8f2;margin-top:34px;font-weight:800">Free practice on</div>',
    beats=[dict(b) for b in B.CAFF], compose=compose,
)
lpx.apply_gaps(SPEC)
SPEC['beats'][3]['gap'] = 1.35
