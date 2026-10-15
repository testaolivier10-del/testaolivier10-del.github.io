"""w1014-03 Caffeine blocks a sleep signal (AP Bio cell signaling): a student yawning at 2 a.m. drinks coffee and is
wide awake while his battery stays low -> dive into the brain: adenosine builds up and docks in its receptor, the
wake-promoting neuron's signals slow -> RDKit: caffeine looks like the adenine part of adenosine -> caffeine sits in the
same receptor without switching it on, adenosine bounces off -> competitive antagonist, one site -> sleep pressure keeps
building, caffeine wears off, adenosine floods the receptors, he slumps (loops to the hook)."""
import math, random
import beats_w1014 as B
import lpx, medart, chem
from lpx import wt, cam_to, char, swap, chip

ID = "w1014-03-caffeine-block"
ADEN = "Nc1ncnc2c1ncn2[C@@H]1O[C@H](CO)[C@@H](O)[C@H]1O"
CAFF = "Cn1c(=O)c2c(ncn2C)n(C)c1=O"


def purine(col, edge):
    """Fused six and five ring (the shared core), soft shaded."""
    hexp = " ".join(f"{22*math.cos(math.radians(a)):.1f},{22*math.sin(math.radians(a)):.1f}" for a in range(30, 390, 60))
    pent = " ".join(f"{38+18*math.cos(math.radians(a)):.1f},{18*math.sin(math.radians(a)):.1f}" for a in (180, 252, 324, 36, 108))
    return (f'<polygon points="{hexp}" fill="{col}" stroke="{edge}" stroke-width="4" stroke-linejoin="round"/>'
            f'<polygon points="{pent}" fill="{col}" stroke="{edge}" stroke-width="4" stroke-linejoin="round"/>')


def aden(x, y, cls="ad", rot=0, s=1.0, op=1):
    rib = " ".join(f"{-48+15*math.cos(math.radians(a)):.1f},{20+15*math.sin(math.radians(a)):.1f}" for a in (0, 72, 144, 216, 288))
    return (f'<g class="{cls}" opacity="{op}"><g transform="translate({x:.0f} {y:.0f}) rotate({rot}) scale({s})">'
            f'<path d="M-20 10 L-36 18" stroke="#f0b37a" stroke-width="5"/><polygon points="{rib}" fill="url(#gRib)" stroke="#d98a4a" stroke-width="3"/>'
            f'{purine("url(#gAd)", "#2d8fbf")}</g></g>')


def caff(x, y, cls="cf", rot=0, s=1.0, op=1):
    nubs = "".join(f'<circle cx="{px}" cy="{py}" r="7" fill="#e6c79a" stroke="#a8763a" stroke-width="2"/>' for px, py in ((0, -32), (-30, 18), (58, -22)))
    oxy = "".join(f'<circle cx="{px}" cy="{py}" r="8" fill="#ff8a8a" stroke="#c94a4a" stroke-width="2"/>' for px, py in ((-30, -16), (0, 32)))
    return (f'<g class="{cls}" opacity="{op}"><g transform="translate({x:.0f} {y:.0f}) rotate({rot}) scale({s})">'
            f'{purine("url(#gCf)", "#8a5a2a")}{nubs}{oxy}</g></g>')


def receptor(x, y, rid):
    """A membrane receptor with a pocket shaped for the fused rings; the inner glow shows it is switched on."""
    return f'''<g id="{rid}"><g transform="translate({x} {y}) scale(1.3)">
      <path d="M-70 120 C-80 60 -76 0 -64 -40 C-56 -64 -40 -70 -34 -50 L-30 -18 C-24 -8 44 -8 52 -18 L56 -50 C62 -70 80 -64 86 -40 C98 0 100 60 90 120 Z" fill="url(#gRec)" stroke="#6a4fb0" stroke-width="4"/>
      <path d="M-50 100 C-56 50 -54 10 -46 -20 M70 100 C76 50 74 10 66 -20" stroke="#fff" stroke-width="4" opacity=".25" fill="none"/>
      <g id="{rid}On" opacity="0"><ellipse cx="10" cy="60" rx="54" ry="40" fill="#ffd23f" filter="url(#glow)"/>
        <text x="10" y="72" text-anchor="middle" class="lbl" font-size="34" fill="#4a3a00">ON</text></g>
      <circle id="{rid}Led" cx="10" cy="150" r="14" fill="#3a3550" stroke="#6a4fb0" stroke-width="3"/>
    </g></g>'''


def room_svg(c):
    return f'''
  <g id="rFar">
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gDorm)"/>
    <g filter="url(#blur3)">
      <rect x="660" y="60" width="300" height="260" rx="10" fill="url(#gNight)" stroke="#4a4560" stroke-width="12"/>
      <circle cx="900" cy="110" r="22" fill="#f4f1de" opacity=".85"/>
      {"".join(f'<circle cx="{x}" cy="{y}" r="2.5" fill="#fff" opacity=".7"/>' for x, y in ((700, 100), (760, 150), (820, 90), (880, 200), (720, 230)))}
      <rect x="60" y="80" width="200" height="16" rx="4" fill="#5a4a3a"/>
      {"".join(f'<rect x="{70+i*30}" y="{30+(i%3)*6}" width="24" height="{50-(i%3)*6}" rx="3" fill="{col}"/>' for i, col in enumerate(("#c24a5a", "#3d6fb8", "#e0b84a", "#4aa37a", "#9b7bff", "#d9d4ca")))}
      <circle cx="420" cy="110" r="52" fill="#f4efe6" stroke="#4a4560" stroke-width="8"/>
      <path d="M420 110 L420 76 M420 110 L446 116" stroke="#2a2a3a" stroke-width="6" stroke-linecap="round"/>
    </g>
    <path id="lampCone" d="M790 350 L860 350 L1100 900 L560 900 Z" fill="url(#gCone)" opacity=".5"/>
    <path d="M840 350 L880 250 L820 220" stroke="#3a3a4a" stroke-width="8" fill="none"/><path d="M780 340 L880 340 L850 300 L800 300 Z" fill="#2ee6d6"/>
  </g>
  <g id="stuW">
    {char(c, "student-yawn", 150, 220, 680, "sY")}
    {char(c, "student-sip", 160, 220, 680, "sS", opacity=0)}
    {char(c, "student-alert", 160, 220, 680, "sA", opacity=0)}
    <g id="zzz">{"".join(f'<text class="z" x="{x}" y="{y}" font-size="{fs}" font-weight="900" fill="#bfe9ff" opacity="0">z</text>' for x, y, fs in ((420, 240, 44), (450, 200, 56), (488, 150, 70)))}</g>
  </g>
  <g id="deskW">
    <rect x="520" y="600" width="700" height="30" rx="8" fill="url(#gWood)"/>
    <rect x="540" y="628" width="660" height="40" fill="#4c3324"/><rect x="560" y="668" width="30" height="300" fill="#3c281c"/>
    <path d="M640 600 L700 470 L900 470 L860 600 Z" fill="#2a2f3a"/><path d="M652 592 L706 480 L890 480 L852 592 Z" fill="url(#gScreen)" id="screen"/>
    <rect x="600" y="596" width="300" height="10" rx="4" fill="#3a404d"/>
    <rect x="930" y="560" width="120" height="40" rx="6" fill="#3d6fb8"/><rect x="938" y="530" width="110" height="32" rx="6" fill="#c24a5a"/>
    <g id="cupD"><path d="M560 540 L600 540 L596 600 L564 600 Z" fill="#f4f1ea"/><rect x="556" y="532" width="48" height="12" rx="4" fill="#e9e2d6"/>
      <rect x="562" y="560" width="36" height="18" fill="#a8763a"/></g>
    {"".join(f'<path class="stm" d="M{x} 520 C{x-10} 500 {x+10} 480 {x} 460" stroke="#fff" stroke-width="5" fill="none" opacity="0" stroke-linecap="round"/>' for x in (572, 588))}
  </g>
  <g id="battW" opacity="0" transform="translate(-1020 -120) scale(1.3)"><rect x="830" y="150" width="180" height="90" rx="16" fill="#081428" stroke="#e3ebf7" stroke-width="6"/>
    <rect x="1010" y="176" width="16" height="38" rx="4" fill="#e3ebf7"/>
    <rect id="battFill" x="844" y="164" width="30" height="62" rx="8" fill="#ff6b6b"/>
    <text x="920" y="132" text-anchor="middle" class="lbl" font-size="34" fill="#ff8a8a">energy</text></g>
  <g id="sigW" opacity="0" transform="translate(-210 40) scale(1.3)"><rect x="560" y="60" width="240" height="70" rx="35" fill="#081428" stroke="#9b7bff" stroke-width="4"/>
    <path d="M590 95 C610 70 630 120 650 95 S690 70 710 95 S750 120 770 95" stroke="#c9b6ff" stroke-width="6" fill="none"/>
    <g id="sigX" opacity="0"><circle cx="680" cy="95" r="48" fill="none" stroke="#ff4f6b" stroke-width="9"/><path d="M646 61 L714 129" stroke="#ff4f6b" stroke-width="9"/></g>
    <text x="680" y="170" text-anchor="middle" class="lbl" font-size="32" fill="#c9b6ff">sleep signal</text></g>
'''


def synapse_svg(c, out):
    rnd = random.Random(8)
    heads = "".join(f'<circle cx="{x}" cy="{y}" r="11" fill="url(#gHead)"/>' for x in range(-180, 1280, 22) for y in (640, 700))
    tails = "".join(f'<path d="M{x-4} 650 L{x-4} 690 M{x+4} 650 L{x+4} 690" stroke="#e8c27a" stroke-width="3"/>' for x in range(-180, 1280, 22))
    ad_free = "".join(aden(rnd.randint(90, 990), rnd.randint(170, 380), "adf", rnd.randint(-40, 40), 1.3, 0) for _ in range(12))
    signals = "".join(f'<circle class="sig" cx="0" cy="0" r="12" fill="#ffd23f" filter="url(#glowS)"/>' for _ in range(5))
    return f'''
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gSyn)"/>
    <!-- upper neuron terminal (releases nothing here; it is the space where adenosine builds up) -->
    <path d="M-200 -120 L1280 -120 L1280 60 C1000 120 780 70 540 100 C300 130 100 80 -200 110 Z" fill="url(#gTerm)" opacity=".9"/>
    <!-- lower, wake-promoting neuron with its membrane and receptors -->
    <rect x="-200" y="700" width="1480" height="400" fill="url(#gCell)"/>
    {tails}{heads}
    {receptor(250, 520, "r1")}{receptor(540, 520, "r2")}{receptor(830, 520, "r3")}
    <path id="axon" d="M-100 900 C200 860 400 940 700 890 S1100 860 1300 900" stroke="#ffd23f" stroke-width="6" fill="none" opacity=".25"/>
    <g id="sigs">{signals}</g>
    <g id="rateW"><rect x="40" y="790" width="290" height="70" rx="35" fill="#081428" fill-opacity=".9" stroke="#ffd23f" stroke-width="4"/>
      <circle id="rateLed" cx="72" cy="825" r="16" fill="#ffd23f" filter="url(#glowS)"/>
      <text x="212" y="838" text-anchor="middle" class="lbl" font-size="32" fill="#ffd23f">wake neuron</text></g>
    {ad_free}
    {aden(238, 478, "adDock1", s=1.5)}{aden(528, 478, "adDock2", s=1.5, op=0)}{aden(818, 478, "adDock3", s=1.5, op=0)}
    {caff(528, 478, "cfDock2", s=1.5, op=0)}{caff(818, 478, "cfDock3", s=1.5, op=0)}
    {aden(528, 318, "adBounce", s=1.5, op=0)}
    <g id="presW" transform="translate(0 640)"><rect x="760" y="150" width="260" height="70" rx="35" fill="#081428" fill-opacity=".9" stroke="#2ee6d6" stroke-width="4"/>
      <rect id="presFill" x="776" y="166" width="20" height="38" rx="19" fill="#2ee6d6"/>
      <text x="890" y="140" text-anchor="middle" class="lbl" font-size="30" fill="#2ee6d6">adenosine</text></g>
    {chip("dockTag", 540, 40, "fits its receptor", "#2ee6d6", 40)}
    {chip("slowTag", 540, 40, "wake neuron slows down", "#ffd23f", 40)}
    {chip("offTag", 540, 40, "never switches it on", "#ff8a8a", 40)}
    {chip("blockTag", 540, 40, "it just blocks it", "#e6c79a", 40)}
    {chip("antTag", 540, 40, "competitive antagonist", "#c9b6ff", 42)}
    {chip("siteTag", 540, 40, "one binding site", "#ffd23f", 42)}
    {chip("presTag", 540, 40, "sleep pressure keeps building", "#2ee6d6", 40)}
    {chip("wearTag", 540, 40, "caffeine wears off", "#e6c79a", 40)}
    <g id="molCard" opacity="0"><rect x="30" y="40" width="1020" height="420" rx="30" fill="#081428" fill-opacity=".94" stroke="#2a3d5e" stroke-width="4"/>
      {chem.mol2d(ADEN, out, "ad", 50, 70, 480, 330, bond_px=7)}
      <g id="adHL" opacity="0">{chem.mol2d(ADEN, out, "adh", 50, 70, 480, 330, highlight=list(range(1, 10)), bond_px=7)}</g>
      {chem.mol2d(CAFF, out, "cf", 560, 80, 460, 310, bond_px=7)}
      <g id="cfHL" opacity="0">{chem.mol2d(CAFF, out, "cfh", 560, 80, 460, 310, highlight=[1, 2, 4, 5, 6, 7, 8, 10, 12], bond_px=7)}</g>
      <text x="290" y="436" text-anchor="middle" class="lbl" font-size="40" fill="#7fd1ff">adenosine</text>
      <text x="790" y="436" text-anchor="middle" class="lbl" font-size="40" fill="#e6c79a">caffeine</text>
      <g id="ribTag" opacity="0"><path d="M300 330 C330 360 360 370 400 360" stroke="#f0b37a" stroke-width="4" fill="none" stroke-dasharray="8 6"/>
        <text x="300" y="400" class="lbl" font-size="38" fill="#f0b37a">sugar</text></g></g>
    {chip("adnTag", 540, 470, "same adenine-like core", "#ffd23f", 40)}
'''


def compose(c):
    out = f"/home/claude/lp/out/{c.spec['id']}"
    T, C, g = c.T, c.C, c.g
    TOT = c.TOTAL
    rg = lambda i, a, b: f'<radialGradient id="g{i}" cx=".35" cy=".3"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient>'
    lg = lambda i, a, b: f'<linearGradient id="g{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'
    brain = medart.inline("brain-1", out, "br", 190, 140, 700)
    svg = f'''<svg viewBox="0 0 1080 960"><defs>{lpx.DEFS}
    {lg("Dorm", "#262a4a", "#14162a")}{lg("Night", "#0f1c3a", "#26355e")}{lg("Wood", "#9a6a44", "#6a452c")}
    <linearGradient id="gCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff8f2" stop-opacity=".45"/><stop offset="1" stop-color="#bff8f2" stop-opacity="0"/></linearGradient>
    {lg("Screen", "#9fe0ff", "#3d6fb8")}{lg("Syn", "#1a1440", "#0c0a24")}{lg("Term", "#6a5ab0", "#3a2f72")}{lg("Cell", "#3a2f72", "#241c4c")}
    {rg("Head", "#ffe6a8", "#e0a84a")}{rg("Rec", "#b9a2ff", "#6a4fb0")}{rg("Ad", "#9fe0ff", "#2d8fbf")}{rg("Rib", "#ffe0b8", "#f0b37a")}{rg("Cf", "#f4dcb4", "#b8844a")}
    <radialGradient id="gBrainHalo"><stop offset="0" stop-color="#9b7bff" stop-opacity=".35"/><stop offset="1" stop-color="#9b7bff" stop-opacity="0"/></radialGradient>
    </defs>
    <g id="scA">{room_svg(c)}</g>
    <g id="scB" opacity="0"><circle cx="540" cy="440" r="420" fill="url(#gBrainHalo)"/><g id="brainG">{brain}</g>
      <circle id="brSpot" cx="560" cy="330" r="30" fill="#ffd23f" opacity="0" filter="url(#glow)"/></g>
    <g id="scS" opacity="0">{synapse_svg(c, out)}</g>
    </svg>'''
    # ---- always moving
    g(f'tl.fromTo(".adf",{{x:0,y:0}},{{x:(i)=>((i%2)?40:-40),y:(i)=>((i%3)-1)*30,rotation:(i)=>((i%2)?25:-25),transformOrigin:"50% 50%",duration:2.2,yoyo:true,repeat:{int(TOT/2.2)},ease:"sine.inOut"}},0);')
    g(f'tl.fromTo("#screen",{{opacity:1}},{{opacity:0.8,duration:0.9,yoyo:true,repeat:{int(TOT/0.9)},ease:"sine.inOut"}},0);')
    g(f'tl.fromTo(".stm",{{opacity:0,y:0}},{{opacity:0.6,y:-40,duration:1.2,stagger:0.5,repeat:{int(TOT/1.2)},ease:"sine.out"}},0);')
    # signals travel along the axon; their speed is the neuron's activity
    g('const AX=document.getElementById("axon"); const AL=AX.getTotalLength(); const SG={v:0};'
      'function sgu(){document.querySelectorAll(".sig").forEach((e,i)=>{const p=AX.getPointAtLength(((SG.v*AL)+(i*AL/5))%AL); e.setAttribute("cx",p.x); e.setAttribute("cy",p.y);});} sgu();')

    # ---- titles
    c.title('Caffeine doesn&#39;t give<br>you <span class="y">energy</span>', 0, out=T["dive"] - 0.15, size=92)
    c.title('<span class="t">Adenosine</span> builds up', T["dive"], out=C["dive"][2] - 0.1, size=96)
    c.title('Wake neuron <span class="y">slows</span>', C["dive"][2], out=T["block"] - 0.12, size=96)
    c.title('<span style="color:#e6c79a">Caffeine</span> looks alike', T["block"], out=C["block"][1] - 0.1, size=96)
    c.title('Same receptor,<br><span class="r">never switched on</span>', C["block"][1], out=T["trap"] - 0.12, size=86)
    c.title('<span style="color:#c9b6ff">AP Bio</span>: competitive<br>antagonist', T["trap"], out=C["trap"][2] - 0.1, size=86)
    c.title('<span class="t">Sleep pressure</span> keeps building', C["trap"][2], out=T["cta"] - 0.12, size=84)

    # ---- A: 2 a.m., yawning, coffee, wide awake but the battery stays low
    g('tl.fromTo("#cam",{scale:1.14,x:40,y:-10},{scale:1.08,x:30,y:-6,duration:1.4,ease:"sine.out"},0);')
    g('tl.fromTo("#sY",{rotation:0,svgOrigin:"330 880"},{rotation:-2.5,duration:0.6,yoyo:true,repeat:1,ease:"sine.inOut"},0);')
    g('tl.fromTo(".z",{opacity:0,y:20},{opacity:0.9,y:-30,duration:0.7,stagger:0.18,ease:"sine.out"},0); tl.to(".z",{opacity:0,duration:0.3},1.0);')
    g('tl.to("#rFar",{x:24,duration:4.2,ease:"sine.inOut"},0); tl.to("#deskW",{x:-18,duration:4.2,ease:"sine.inOut"},0);')
    c.sound("page_flip_real", 0.02, 0.5); c.music_auto += [(0, 1.2, 0.3)]
    tsip = wt(c, "hook", "give") - 0.15
    swap(c, "#sY", "#sS", tsip); c.set("#cupD", tsip, "opacity:0"); c.set(".stm", tsip, "opacity:0")
    c.sound("water_pour_real", tsip, 0.3)
    c.fade_in("#battW", wt(c, "hook", "energy") - 0.2, 0.3, 10); c.sound("tick", wt(c, "hook", "energy"), 0.5)
    g(f'tl.fromTo("#battFill",{{opacity:1}},{{opacity:0.3,duration:0.2,yoyo:true,repeat:5,immediateRender:false}},{wt(c, "hook", "energy"):.2f});')
    tbk = C["hook"][1]
    swap(c, "#sS", "#sA", tbk); c.sound("pop", tbk, 0.6)
    c.fade_in("#sigW", wt(c, "hook", "blocks") - 0.1, 0.3, 10)
    c.pop("#sigX", wt(c, "hook", "blocks") + 0.15, 0.35); c.sound("wrong", wt(c, "hook", "blocks") + 0.15, 0.5)

    # ---- dive into his head -> brain -> synapse
    t = T["dive"]
    c.fade_out("#battW, #sigW", t - 0.1, 0.2)
    cam_to(c, t - 0.1, 360, 330, 4.5, 0.6, "power3.in"); c.sound("dive", t - 0.1, 1.0)
    tb_ = t + 0.45
    c.set("#scA", tb_, "opacity:0"); c.set("#scB", tb_, "opacity:1")
    g(f'tl.set("#cam",{{scale:2.0,x:0,y:0}},{tb_:.2f}); tl.to("#cam",{{scale:1.0,x:0,y:0,duration:0.6,ease:"power3.out"}},{tb_:.2f});')
    g(f'tl.fromTo("#brSpot",{{opacity:0}},{{opacity:0.9,duration:0.25,yoyo:true,repeat:1,immediateRender:false}},{tb_+0.5:.2f});')
    tsy = wt(c, "dive", "builds") - 0.1
    cam_to(c, tsy - 0.55, 560, 330, 6.0, 0.55, "power3.in"); c.sound("whoosh", tsy - 0.55, 0.7)
    c.set("#scB", tsy, "opacity:0"); c.set("#scS", tsy, "opacity:1")
    g(f'tl.set("#cam",{{scale:1.8,x:0,y:0}},{tsy:.2f}); tl.to("#cam",{{scale:1.0,x:0,y:0,duration:0.7,ease:"power3.out"}},{tsy:.2f});')
    # adenosine builds up while awake
    g(f'tl.to(".adf",{{opacity:1,duration:0.3,stagger:0.12}},{tsy:.2f});')
    g(f'tl.to("#presFill",{{attr:{{width:200}},duration:{C["trap"][2]-tsy:.2f},ease:"none"}},{tsy:.2f});')
    for k in range(5): c.sound("pop", tsy + 0.1 + k * 0.3, 0.3)
    # signals run fast while awake
    g(f'tl.to(SG,{{v:4,duration:{wt(c, "dive", "neurons"):.2f},ease:"none",onUpdate:sgu}},0);')
    g(f'tl.fromTo("#rateLed",{{opacity:1}},{{opacity:0.2,duration:0.15,yoyo:true,repeat:{int(wt(c, "dive", "neurons")/0.15)},ease:"none"}},0);')
    # one adenosine fits its receptor
    tf = C["dive"][1]
    g(f'tl.fromTo(".adDock1",{{x:-120,y:-200,rotation:-40,transformOrigin:"50% 50%"}},{{x:0,y:0,rotation:0,duration:0.6,ease:"back.out(1.4)",immediateRender:false}},{tf:.2f});')
    g(f'tl.to("#r1On",{{opacity:0.85,duration:0.3}},{wt(c, "dive", "receptor"):.2f}); tl.to("#r1Led",{{fill:"#ffd23f",duration:0.2}},{wt(c, "dive", "receptor"):.2f});')
    c.fade_in("#dockTag", tf, 0.3, 10); c.sound("glass_clink_real", wt(c, "dive", "receptor"), 0.6)
    g(f'tl.to(".adDock2, .adDock3",{{opacity:1,duration:0.4,stagger:0.2}},{wt(c, "dive", "receptor")+0.3:.2f});')
    g(f'tl.to("#r2On, #r3On",{{opacity:0.85,duration:0.3,stagger:0.2}},{wt(c, "dive", "receptor")+0.5:.2f}); tl.to("#r2Led, #r3Led",{{fill:"#ffd23f",duration:0.2,stagger:0.2}},{wt(c, "dive", "receptor")+0.5:.2f});')
    # the wake neuron slows down
    tn = C["dive"][2]
    c.fade_out("#dockTag", tn - 0.1, 0.2); c.fade_in("#slowTag", tn, 0.3, 10)
    g(f'tl.to(SG,{{v:4.6,duration:{T["block"]-tn:.2f},ease:"power2.out",onUpdate:sgu}},{tn:.2f});')
    g(f'tl.to(".sig",{{opacity:0.35,duration:0.8}},{wt(c, "dive", "slow"):.2f}); tl.to("#rateLed",{{opacity:0.25,duration:0.6}},{wt(c, "dive", "slow"):.2f});')
    cam_to(c, tn, 300, 780, 1.25, 0.7)
    c.sound("numb", wt(c, "dive", "slow"), 0.8); c.music_auto += [(wt(c, "dive", "slow"), T["block"] - 0.2, 0.3)]

    # ---- block: the molecules side by side (RDKit), then caffeine in the receptor
    t = T["block"]
    c.cam(t - 0.1, 1.0, 0, 0, 0.5)
    c.fade_out("#slowTag, #rateW, #presW", t - 0.1, 0.2)
    g(f'tl.fromTo("#molCard",{{opacity:0,y:40}},{{opacity:1,y:0,duration:0.35,ease:"power3.out",immediateRender:false}},{t:.2f});')
    c.sound("swish", t - 0.05, 0.7); c.sound("riser", t - 0.6, 0.4)
    tad = wt(c, "block", "adenine")
    g(f'tl.to("#adHL, #cfHL",{{opacity:1,duration:0.35}},{tad:.2f}); tl.fromTo("#adnTag",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{tad+0.1:.2f});')
    c.sound("shimmer", tad, 0.7)
    g(f'tl.fromTo("#ribTag",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{wt(c, "block", "adenosine"):.2f});')
    # caffeine into the same receptor (the middle one), adenosine out
    tfit = C["block"][1]
    c.fade_out("#molCard, #adnTag", tfit - 0.15, 0.25)
    g(f'tl.to(".adDock2",{{y:-260,x:-80,rotation:-50,transformOrigin:"50% 50%",opacity:0,duration:0.5,ease:"power2.in"}},{tfit-0.1:.2f}); tl.to("#r2On",{{opacity:0,duration:0.3}},{tfit-0.1:.2f}); tl.to("#r2Led",{{fill:"#3a3550",duration:0.2}},{tfit-0.1:.2f});')
    g(f'tl.fromTo(".cfDock2",{{opacity:0,x:140,y:-240,rotation:40,transformOrigin:"50% 50%"}},{{opacity:1,x:0,y:0,rotation:0,duration:0.6,ease:"back.out(1.4)",immediateRender:false}},{tfit+0.1:.2f});')
    c.sound("glass_clink_real", tfit + 0.6, 0.6)
    cam_to(c, tfit, 540, 430, 1.12, 0.6)
    toff = C["block"][2]
    c.fade_in("#offTag", toff, 0.3, 10)
    g(f'tl.fromTo("#r2Led",{{scale:1}},{{scale:1.3,transformOrigin:"50% 50%",duration:0.15,yoyo:true,repeat:3,immediateRender:false}},{toff+0.2:.2f});')
    c.sound("wrong", toff + 0.3, 0.4)
    tbl = C["block"][3]
    c.fade_out("#offTag", tbl - 0.1, 0.2); c.fade_in("#blockTag", tbl, 0.3, 10)
    g(f'tl.fromTo(".adBounce",{{opacity:1,y:-160}},{{y:-40,duration:0.35,ease:"power2.in",immediateRender:false}},{tbl:.2f}); tl.to(".adBounce",{{y:-240,x:180,rotation:120,transformOrigin:"50% 50%",opacity:0,duration:0.6,ease:"power2.out"}},{tbl+0.35:.2f});')
    c.sound("punch", tbl + 0.35, 0.6)

    # ---- trap: competitive antagonist, one site; sleep pressure builds, then it hits
    t = T["trap"]
    c.cam(t, 1.0, 0, 0, 0.5)
    c.fade_out("#blockTag", t - 0.1, 0.2)
    ta = wt(c, "trap", "competitive")
    c.sound("pop", ta, 0.6)
    g(f'tl.to(".cfDock3",{{opacity:1,duration:0.01}},{ta:.2f}); tl.fromTo(".cfDock3",{{x:120,y:-220}},{{x:0,y:0,duration:0.5,ease:"back.out(1.4)",immediateRender:false}},{ta:.2f});')
    g(f'tl.to(".adDock3",{{y:-140,x:-60,duration:0.5,ease:"power2.out"}},{ta:.2f}); tl.to("#r3On",{{opacity:0,duration:0.3}},{ta:.2f}); tl.to("#r3Led",{{fill:"#3a3550",duration:0.2}},{ta:.2f});')
    # tug of war at one site
    ttw = C["trap"][1]
    cam_to(c, ta - 0.1, 830, 470, 1.4, 0.6)
    g(f'tl.to(".adDock3",{{y:-80,x:-30,duration:0.25,yoyo:true,repeat:5,ease:"sine.inOut"}},{ttw:.2f}); tl.to(".cfDock3",{{y:-14,duration:0.25,yoyo:true,repeat:5,ease:"sine.inOut"}},{ttw+0.12:.2f});')
    c.fade_in("#siteTag", wt(c, "trap", "one"), 0.3, 10)
    g(f'tl.fromTo("#r3",{{filter:"brightness(1)"}},{{filter:"brightness(1.6)",duration:0.2,yoyo:true,repeat:3,immediateRender:false}},{wt(c, "trap", "site"):.2f});')
    c.sound("tick", ttw + 0.2, 0.5); c.sound("tick", ttw + 0.7, 0.5)
    # sleep pressure keeps building
    tsp = C["trap"][2]
    c.cam(tsp, 1.0, 0, 0, 0.6)
    c.fade_out("#siteTag", tsp - 0.1, 0.2)
    c.fade_in("#presW, #rateW", tsp, 0.3, 0)
    g(f'tl.to("#presFill",{{attr:{{width:228}},fill:"#ff9a3d",duration:1.4,ease:"power1.in"}},{tsp:.2f});')
    g(f'tl.to(".adf",{{scale:1.15,transformOrigin:"50% 50%",duration:0.4,stagger:0.05}},{tsp:.2f});')
    c.sound("heartbeat_real", tsp, 0.35); c.sound("riser", tsp + 0.4, 0.5)
    # caffeine wears off
    two = C["trap"][3]
    c.fade_in("#wearTag", two, 0.3, 10)
    g(f'tl.to(".cfDock2, .cfDock3",{{y:-300,opacity:0,rotation:60,transformOrigin:"50% 50%",duration:0.6,stagger:0.1,ease:"power2.in"}},{wt(c, "trap", "wears"):.2f});')
    # it hits you: adenosine floods every receptor, then back to him slumping
    th = wt(c, "trap", "hits") - 0.15
    g(f'tl.to(".adDock2, .adDock3",{{opacity:1,x:0,y:0,rotation:0,duration:0.35,ease:"power3.in"}},{th-0.35:.2f});')
    g(f'tl.to("#r1On, #r2On, #r3On",{{opacity:1,duration:0.2}},{th:.2f}); tl.to("#r1Led, #r2Led, #r3Led",{{fill:"#ffd23f",duration:0.2}},{th:.2f});')
    g(f'tl.to("#cam",{{y:16,duration:0.08,yoyo:true,repeat:3,ease:"none"}},{th:.2f});')
    c.sound("punch", th, 0.9); c.sound("numb", th + 0.1, 0.7)
    tb2 = th + 0.45
    c.set("#scS", tb2, "opacity:0"); c.set("#scA", tb2, "opacity:1")
    c.set("#sA", tb2, "opacity:0"); c.set("#sS", tb2, "opacity:0"); c.set("#sY", tb2, "opacity:1")
    g(f'tl.set("#cam",{{scale:1.1,x:30,y:0}},{tb2:.2f}); tl.to("#cam",{{scale:1.6,x:{-(330-540)*1.6:.0f},y:{-(330-480)*1.6:.0f},duration:1.4,ease:"power2.inOut"}},{tb2:.2f});')
    g(f'tl.fromTo("#sY",{{y:0,rotation:0,svgOrigin:"330 880"}},{{y:24,rotation:-5,duration:0.5,ease:"power2.in",immediateRender:false}},{tb2+0.2:.2f});')
    c.sound("gasp_male_real", tb2 + 0.2, 0.4)
    g(f'tl.fromTo(".z",{{opacity:0,y:20}},{{opacity:0.9,y:-30,duration:0.5,stagger:0.12,ease:"sine.out",immediateRender:false}},{tb2+0.1:.2f});')
    c.sound("swish", tb2 - 0.05, 0.6)
    return svg


SPEC = dict(
    id=ID, badge="AP BIO  CELL SIGNALING", tail=0.4, bpm=92, key=5, seed=23,
    vars="--glow:#2a1a5e;--acc1:#9b7bff;--acc2:#2ee6d6",
    css="#end-l1{font-size:80px;letter-spacing:-1.5px} #badge span{color:#c9b6ff;border-color:#c9b6ff} .cap .w.on{color:#ffd23f} .cap span.box{background:rgba(22,12,52,.9);border-color:rgba(201,182,255,.3)} .tt .t{color:#7fe0d0} #wm{color:#c9b6ff}",
    end_line='Caffeine <span style="color:#ffd23f">blocks</span><br>the sleep signal<div style="font-size:58px;color:#bff8f2;margin-top:34px;font-weight:800">Free practice on</div>',
    beats=B.CAFF, compose=compose,
)
lpx.apply_gaps(SPEC)
SPEC['beats'][3]['gap'] = 1.35  # hold the slump before the call to action
