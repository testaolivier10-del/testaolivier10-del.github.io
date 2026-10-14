"""A&P 01: Intro to Anatomy and Physiology (levels of organization, organ systems). Visual compose for engine_long.
Story frame: Jordan, a runner in the last 200 m of a race (characters jordan-*, Figma AI 2026-10-13), quality v2 scenes,
Servier Medical Art via medart (credit in the description), a 3D water molecule via chem.mol3d(in_svg=True),
real sounds (run steps, crowd, breathing, heartbeat, water) and a low music bed under the story scenes.
"""
import sys, math, random
sys.path.insert(0, "/home/claude/lp"); sys.path.insert(0, "/home/claude/lp/long")
import a01_script as S
import medart, chem
from engine_long import TEAL, GOLD, CORAL, INK, GREEN, VIOLET, WHITE
from n01_spec import W, L, P, card, chip, hideall, chapter_span, qcheck, problem

DIM = "#4d6488"; RED = "#ff5a5a"; BLUE = "#5aa9ff"; WARM = "#ffb35c"; SKIN = "#e9a77f"
CHD = "/home/claude/lp/chars"
OUT = f"/home/claude/lp/out/{S.ID}"
IMGS = {"jordan-sprint": (912, 1226), "jordan-bent": (564, 1153), "jordan-hips": (530, 1275), "jordan-shiver": (327, 1282),
        "jordan-foot": (659, 1293), "jordan-drink": (482, 1293)}
# all poses come from sheets at the same scale: full standing height ~1290 px
def jimg(id, name, x, y, k=0.5, op=0, flip=False):
    """character at bottom-left (x, y), scale k of the keyed pixel size (same scale for every pose)"""
    w0, h0 = IMGS[name]; w, h = w0 * k, h0 * k
    tr = f' transform="translate({2*x + w:.0f} 0) scale(-1 1)"' if flip else ""
    return f'<g id="{id}" opacity="{op}"><g id="{id}_b"><image href="{name}.png" x="{x:.0f}" y="{y - h:.0f}" width="{w:.0f}" height="{h:.0f}"{tr}/></g></g>'

def MI(id, name, x, y, w, op=0, extra=""):
    return f'<g id="{id}" opacity="{op}" {extra}>{medart.image(name, OUT, x, y, w)}</g>'

def MH(name, w):
    r, local = medart._fetch(name); vx, vy, vw, vh = medart._size(open(local, encoding="utf-8").read()); return w * vh / vw

def txt(id, x, y, s, size=40, color=WHITE, anchor="middle", weight=800, op=0, font="Inter"):
    return f'<text id="{id}" x="{x}" y="{y}" font-family="{font}" font-weight="{weight}" font-size="{size}" fill="{color}" text-anchor="{anchor}" opacity="{op}">{s}</text>'

def bob(c, sel, t0, t1, amp=12, per=0.36):
    n = max(1, int((t1 - t0) / per))
    c.g(f'tl.fromTo("{sel}",{{y:0}},{{y:-{amp},duration:{per/2:.2f},yoyo:true,repeat:{2*n-1},ease:"sine.inOut",immediateRender:false}},{t0:.2f});')

def scroll(c, sel, t0, t1, dx=-480, per=0.42):
    n = max(1, int((t1 - t0) / per))
    c.g(f'tl.fromTo("{sel}",{{x:0}},{{x:{dx},duration:{per},ease:"none",repeat:{n-1},immediateRender:false}},{t0:.2f});')

def steps(c, t0, t1, gain=0.5):
    t = t0
    while t < t1 - 0.5:
        c.sound("run_steps_real", t, gain); t += 3.2

def drops(id, x, y, n=4, color="#bfe8ff", op=0, seed=1):
    R = random.Random(seed); s = [f'<g id="{id}" opacity="{op}">']
    for i in range(n):
        xx, yy = x + R.uniform(-40, 40), y + R.uniform(-30, 30)
        s.append(f'<path class="{id}_d" d="M {xx:.0f} {yy-14:.0f} Q {xx+9:.0f} {yy:.0f} {xx:.0f} {yy+6:.0f} Q {xx-9:.0f} {yy:.0f} {xx:.0f} {yy-14:.0f} Z" fill="{color}"/>')
    return "".join(s) + "</g>"

def fall(c, sel, t, d=1.2, dy=70, rep=0):
    c.g(f'tl.fromTo("{sel}",{{y:0,opacity:1}},{{y:{dy},opacity:0,duration:{d},ease:"power1.in",stagger:0.18,repeat:{rep},immediateRender:false}},{t:.2f});')

def heat_waves(id, x, y, color=WARM, op=0, n=3):
    s = [f'<g id="{id}" opacity="{op}">']
    for i in range(n):
        xx = x + i * 34
        s.append(f'<path d="M {xx} {y} q -14 -22 0 -44 q 14 -22 0 -44" fill="none" stroke="{color}" stroke-width="6" stroke-linecap="round"/>')
    return "".join(s) + "</g>"

def rise(c, sel, t, d=1.4, rep=2):
    c.g(f'tl.fromTo("{sel}",{{y:0,opacity:0.9}},{{y:-60,opacity:0,duration:{d},ease:"sine.out",repeat:{rep},immediateRender:false}},{t:.2f});')

def heart_icon(id, x, y, s=1, color=RED, op=0):
    return f'<path id="{id}" d="M {x} {y+18*s} C {x-40*s} {y-14*s}, {x-18*s} {y-44*s}, {x} {y-22*s} C {x+18*s} {y-44*s}, {x+40*s} {y-14*s}, {x} {y+18*s} Z" fill="{color}" opacity="{op}"/>'

def swapnum(c, ids, t0, step=0.45):
    for i, id in enumerate(ids):
        c.set(f"#{id}", t0 + i * step, "opacity:1")
        if i > 0: c.set(f"#{ids[i-1]}", t0 + i * step, "opacity:0")

def tick_box(id, x, y, text, op=0, color=GREEN, size=40):
    return (f'<g id="{id}" opacity="{op}"><rect x="{x}" y="{y-34}" width="44" height="44" rx="10" fill="none" stroke="{color}" stroke-width="5"/>'
            f'<path id="{id}_t" d="M {x+9} {y-12} L {x+20} {y} L {x+38} {y-26}" fill="none" stroke="{color}" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>'
            f'<text x="{x+66}" y="{y}" font-family="Kalam" font-weight="700" font-size="{size}" fill="{WHITE}">{text}</text></g>')

def tick(c, id, t):
    c.fade_in(f"#{id}", t, y=10); c.draw(f"#{id}_t", t + 0.25, d=0.35); c.sound("check", t + 0.25, 0.35)

def arrow(id, x1, y1, x2, y2, color=GOLD, w=7, mk="ah"):
    return f'<path id="{id}" d="M {x1} {y1} L {x2} {y2}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0" marker-end="url(#{mk})"/>'

# ------------------------------------------------------------- scenes
def track(id, op=0):
    """stadium at dusk: blurred stands and lights (far), track with scrolling lane marks (mid), dark foreground"""
    R = random.Random(7)
    far = [f'<g id="{id}_far"><g filter="url(#blur6)">',
           f'<linearGradient id="{id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1640"/><stop offset=".55" stop-color="#5a2f5e"/><stop offset="1" stop-color="#e48a5a"/></linearGradient>',
           f'<rect x="-300" y="-100" width="2520" height="760" fill="url(#{id}_sky)"/>',
           f'<path d="M -300 330 L 2220 300 L 2220 600 L -300 610 Z" fill="#241c38"/>']
    for i in range(520):
        x = R.uniform(-300, 2220); y = R.uniform(330, 590)
        far.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{R.uniform(5,9):.1f}" fill="{R.choice(["#e05a5a","#f2c14e","#4fb3e8","#e8e8f0","#8a6ad0","#3fbf8a","#f08a4b"])}" opacity=".75"/>')
    for x in (160, 760, 1360, 1960):
        far.append(f'<rect x="{x-8}" y="40" width="16" height="300" fill="#151026"/><rect x="{x-70}" y="20" width="140" height="44" rx="6" fill="#fff6d8"/>'
                   f'<ellipse cx="{x}" cy="42" rx="220" ry="120" fill="#fff2c0" opacity=".25"/>')
    far.append('</g></g>')
    lanes = [f'<g id="{id}_mid"><path d="M -300 640 L 2220 620 L 2220 1180 L -300 1180 Z" fill="#b8553c"/>',
             f'<rect x="-300" y="612" width="2520" height="30" fill="#3d8a4a"/>']
    for i, y in enumerate((700, 800, 920, 1060)):
        lanes.append(f'<rect x="-300" y="{y-i*2}" width="2520" height="{5+i*2}" fill="#f4efe6" opacity=".9"/>')
    lanes.append(f'<g id="{id}_dash">' + "".join(f'<rect x="{-300 + k*240}" y="{748 + (k%2)*4}" width="90" height="6" fill="#f4efe6" opacity=".55"/>'
                                                  f'<rect x="{-300 + k*240 + 120}" y="985" width="70" height="10" fill="#f4efe6" opacity=".4"/>' for k in range(16)) + '</g>')
    lanes.append(f'<g id="{id}_mk"><rect x="1560" y="610" width="16" height="70" fill="#ddd"/><rect x="1500" y="560" width="140" height="56" rx="8" fill="#f4f6fb"/>'
                 f'<text x="1570" y="600" text-anchor="middle" font-family="Inter" font-weight="900" font-size="36" fill="#b8553c">200 m</text></g>')
    lanes.append('</g>')
    fg = (f'<g id="{id}_fg"><radialGradient id="{id}_vg" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>'
          f'<rect x="-300" y="-200" width="2520" height="1480" fill="url(#{id}_vg)"/></g>')
    return f'<g id="{id}" opacity="{op}">' + "".join(far) + "".join(lanes), fg + "</g>"

def run_motion(c, id, t0, t1):
    scroll(c, f"#{id}_dash", t0, t1, -480, 0.42)
    c.g(f'tl.fromTo("#{id}_far",{{x:0}},{{x:-120,duration:{t1-t0:.2f},ease:"none",immediateRender:false}},{t0:.2f});')
    c.g(f'tl.fromTo("#{id}_mk",{{x:300}},{{x:-1900,duration:{min(6.0, t1-t0):.2f},ease:"none",immediateRender:false}},{t0:.2f});')

def lab_bg(id, op=0, tint="#0d2348"):
    """soft study-room backdrop for the diagram chapters: blurred shelves far, desk lamp glow, vignette"""
    return (f'<g id="{id}" opacity="{op}"><g filter="url(#blur14)"><rect x="-200" y="-100" width="2320" height="1300" fill="{tint}"/>'
            + "".join(f'<rect x="{-100 + i*260}" y="{120 + (i%3)*30}" width="200" height="{300 + (i%2)*80}" rx="10" fill="#14305e" opacity=".7"/>' for i in range(9))
            + '</g>'
            f'<radialGradient id="{id}_vg" cx="50%" cy="50%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>'
            f'<rect x="-200" y="-200" width="2320" height="1480" fill="url(#{id}_vg)"/></g>')

def drift(c, sel, t0, t1, dx=-60):
    c.g(f'tl.fromTo("{sel}",{{x:0}},{{x:{dx},duration:{max(1,t1-t0):.2f},ease:"none",immediateRender:false}},{t0:.2f});')

# ------------------------------------------------------------- intro
def intro(c):
    T, C = c.T, c.C
    t1 = [ch["t"] for ch in c.CH if ch["id"] == "anatphys"][0]
    far_mid, fg = track("tr", op=1)
    s = ['<g id="g_in">', far_mid]
    run_motion(c, "tr", 0, C["promise"][1]); steps(c, 0, C["promise"][1], 0.55)
    c.sound("crowd_cheer_real", 0.0, 0.35); c.sound("crowd_cheer_real", 4.0, 0.25)
    s.append(jimg("jd", "jordan-sprint", 560, 1010, 0.62, op=1)); bob(c, "#jd_b", 0, C["promise"][1])
    # legs burning: glow on the thigh
    s.append(f'<ellipse id="in_leg" cx="840" cy="760" rx="120" ry="80" fill="{WARM}" opacity="0" filter="url(#blur14)"/>')
    c.to("#in_leg", C["hook"][1], "opacity:.75", d=0.4); c.pulse("#in_leg", C["hook"][1] + 0.4, C["hook"][5], 1.12, 0.5)
    s.append(chip("in_c1", 1500, 860, "legs burning", WARM, 36))
    c.pop("#in_c1", C["hook"][1]); c.sound("sizzle_real", C["hook"][1], 0.2)
    s.append(heart_icon("in_hrt", 820, 470, 1.1, RED)); c.pop("#in_hrt", C["hook"][2]); c.pulse("#in_hrt", C["hook"][2] + 0.4, C["promise"][1], 1.25, 0.34)
    c.sound("heartbeat_real", C["hook"][2], 0.7); c.sound("heartbeat_real", C["hook"][2] + 2.4, 0.5)
    s.append(chip("in_c2", 1500, 520, "heart pounding", RED, 36)); c.pop("#in_c2", C["hook"][2] + 0.1)
    s.append(f'<g id="in_br" opacity="0">' + "".join(f'<circle class="in_puff" cx="{960+i*26}" cy="{318-i*6}" r="{14+i*5}" fill="#e8f2ff" opacity=".55"/>' for i in range(3)) + '</g>')
    c.set("#in_br", C["hook"][3], "opacity:1"); c.g(f'tl.fromTo(".in_puff",{{x:0,opacity:.6}},{{x:60,opacity:0,duration:0.7,stagger:0.12,repeat:4,ease:"sine.out",immediateRender:false}},{C["hook"][3]:.2f});')
    c.sound("breath_female_real", C["hook"][3], 0.6)
    s.append(chip("in_c3", 1500, 620, "gasping for air", TEAL, 36)); c.pop("#in_c3", C["hook"][3] + 0.1)
    s.append(drops("in_sw", 900, 330, 5)); c.set("#in_sw", C["hook"][4], "opacity:1"); fall(c, ".in_sw_d", C["hook"][4], 1.0, 90, 3)
    s.append(chip("in_c4", 1500, 720, "sweat pouring", "#bfe8ff", 36)); c.pop("#in_c4", C["hook"][4] + 0.1)
    s.append(fg)
    s.append(card("in_qbg", 560, 105, 1100, 115, GOLD, op=0)); c.fade_in("#in_qbg", C["hook"][5], y=-10)
    s.append(W(c, "in_q", 1110, 185, "How many parts work together?", C["hook"][5] + 0.2, 64, GOLD, anchor="middle"))
    hideall(c, ["#in_c1", "#in_c2", "#in_c3", "#in_c4", "#in_sw", "#in_br"], c.end("hook") - 0.2)
    # promise: dive into the thigh, then the list
    c.cam(T["promise"] + 0.1, 2.4, -420, -330, d=1.6); c.sound("whoosh_real", T["promise"] + 0.1, 0.6); c.sound("riser", T["promise"], 0.3)
    hideall(c, ["#in_qbg", "#in_q", "#in_hrt", "#in_leg"], T["promise"])
    s.append('</g>')
    # promise list (outside cam group effect is fine: the camera resets at C1)
    s.append(f'<g id="g_pr0" opacity="0">')
    c.cam(C["promise"][1] - 0.4, 1, 0, 0, d=0.6); c.scene("#g_pr0", C["promise"][1] - 0.3)
    c.to("#g_in", C["promise"][1] - 0.3, "opacity:0", d=0.4)
    s.append(lab_bg("pr_bg", op=1))
    s.append(jimg("pr_j", "jordan-hips", 160, 960, 0.6, op=1))
    items = [("6 levels of organization", 1, TEAL), ("11 organ systems", 2, GOLD), ("what makes something alive", 3, GREEN), ("why her temperature barely moves", 4, CORAL)]
    for i, (tx, cue, col) in enumerate(items):
        s.append(f'<circle id="pr_d{i}" cx="700" cy="{280 + i*130}" r="14" fill="{col}" opacity="0"/>'); c.pop(f"#pr_d{i}", C["promise"][cue])
        s.append(W(c, f"pr_t{i}", 740, 296 + i * 130, tx, C["promise"][cue] + 0.1, 60, col)); c.sound("pop", C["promise"][cue], 0.4)
    s.append(chip("pr_frame", 1200, 880, "the frame for the whole course", WHITE, 40)); c.pop("#pr_frame", C["promise"][5])
    # why: the one idea
    tw = T["why"]
    hideall(c, ["#pr_d0", "#pr_d1", "#pr_d2", "#pr_d3", "#pr_t0", "#pr_t1", "#pr_t2", "#pr_t3", "#pr_frame", "#pr_j"], tw - 0.1)
    s.append(txt("wy_vocab", 1100, 300, "a vocabulary list?", 54, INK, weight=900)); c.fade_in("#wy_vocab", tw + 0.2)
    s.append(P(c, "wy_x", "M 820 270 L 1380 300", tw + 1.6, CORAL, 8)); c.sound("wrong", tw + 1.6, 0.3)
    s.append(card("wy_bg", 360, 400, 1200, 200, GOLD, op=0)); c.fade_in("#wy_bg", C["why"][1], y=10)
    s.append(W(c, "wy_1", 960, 525, 'how it\'s <tspan fill="#ffd23f">BUILT</tspan> → what it can <tspan fill="#2ee6d6">DO</tspan>', C["why"][2], 62, anchor="middle"))
    c.sound("ding", C["why"][2], 0.35)
    s.append(chip("wy_an", 660, 700, "anatomy = structure", GOLD, 40)); s.append(chip("wy_ph", 1260, 700, "physiology = function", TEAL, 40))
    c.pop("#wy_an", C["why"][3]); c.pop("#wy_ph", C["why"][3] + 0.3)
    for i in range(6):
        s.append(f'<g id="wy_l{i}" opacity="0"><rect x="760" y="{1000 - (i+1)*42}" width="400" height="34" rx="10" fill="{[TEAL,GREEN,GOLD,WARM,CORAL,VIOLET][i]}"/>'
                 f'<text x="960" y="{1000 - (i+1)*42 + 25}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="22" fill="#081428">{["chemical","cellular","tissue","organ","organ system","organism"][i]}</text></g>')
        c.fade_in(f"#wy_l{i}", C["why"][4] + i * 0.15, y=-20)
    c.sound("tick", C["why"][4], 0.3)
    s.append('</g>')
    c.to("#g_pr0", t1 - 0.4, "opacity:0", d=0.4)
    return "".join(s)

# ------------------------------------------------------------- anatomy vs physiology
def anatphys(c):
    t0, t1 = chapter_span(c, "anatphys")
    T, C = c.T, c.C
    s = ['<g id="g_ap" opacity="0">', lab_bg("ap_bg", op=1)]
    c.scene("#g_ap", t0, t1); drift(c, "#ap_bg", t0, t1, -80)
    # a1 heart: anatomy then physiology
    hh = MH("heart-front", 420)
    s.append(MI("ap_h", "heart-front", 220, 200, 420)); c.fade_in("#ap_h", T["a1"] + 0.3, y=20)
    s.append(MI("ap_hc", "heart-chambers-visible", 220, 200, 420 * 1.0));
    s.append(txt("ap_qa", 1260, 220, "what does it look like?", 48, GOLD, weight=900)); c.fade_in("#ap_qa", C["a1"][1])
    labs = [("fist sized", 330), ("mostly muscle", 420), ("4 chambers", 510)]
    for i, (tx, y) in enumerate(labs):
        s.append(W(c, f"ap_l{i}", 900, y, tx, C["a1"][1] + 0.6 + i * 1.3, 52))
    c.to("#ap_h", C["a1"][1] + 3.2, "opacity:0", d=0.4); c.fade_in("#ap_hc", C["a1"][1] + 3.2, y=0)
    s.append(chip("ap_ta", 430, 900, "ANATOMY", GOLD, 52)); c.pop("#ap_ta", C["a1"][2]); c.sound("ding", C["a1"][2], 0.35)
    hideall(c, ["#ap_qa", "#ap_l0", "#ap_l1", "#ap_l2"], C["a1"][3] - 0.2)
    c.to("#ap_hc", C["a1"][3] - 0.2, "opacity:0", d=0.3); c.to("#ap_h", C["a1"][3] - 0.1, "opacity:1", d=0.3)
    c.pulse("#ap_h", C["a1"][3] + 0.3, c.end("a1"), 1.06, 0.4); c.sound("heartbeat_real", C["a1"][3] + 0.3, 0.5)
    s.append(txt("ap_qp", 1260, 220, "how does it work?", 48, TEAL, weight=900)); c.fade_in("#ap_qp", C["a1"][3])
    nums = ["70", "95", "120", "150", "180"]
    for i, n in enumerate(nums):
        s.append(txt(f"ap_n{i}", 1150, 520, n, 180, RED if i == 4 else WHITE, weight=900))
    s.append(txt("ap_bpm", 1150, 600, "beats per minute", 40, INK)); c.fade_in("#ap_bpm", C["a1"][3] + 0.8)
    swapnum(c, [f"ap_n{i}" for i in range(5)], C["a1"][3] + 1.2, 0.7)
    s.append(chip("ap_tp", 1150, 900, "PHYSIOLOGY", TEAL, 52)); c.pop("#ap_tp", C["a1"][4]); c.sound("ding", C["a1"][4], 0.35)
    hideall(c, ["#ap_h", "#ap_qp", "#ap_n4", "#ap_bpm", "#ap_tp", "#ap_ta"], c.end("a1"))
    # a2 anatomy definition
    s.append(W(c, "a2_t", 220, 230, '<tspan fill="#ffd23f">anatomy</tspan> = the body\'s structures', T["a2"] + 0.2, 70))
    for i, w_ in enumerate(["shape", "size", "parts", "position"]):
        s.append(chip(f"a2_c{i}", 380 + i * 330, 380, w_, GOLD, 40)); c.pop(f"#a2_c{i}", T["a2"] + 1.6 + i * 0.4)
    s.append(W(c, "a2_r", 220, 560, 'Greek <tspan fill="#2ee6d6">anatomē</tspan> = "a cutting up"', C["a2"][1], 60))
    # scalpel
    s.append(f'<g id="a2_sc" opacity="0"><path d="M 1180 760 L 1560 660 L 1600 690 L 1210 790 Z" fill="#cfd8e6"/><rect x="1020" y="770" width="190" height="34" rx="12" fill="#4a5f86" transform="rotate(-15 1115 787)"/></g>')
    c.fade_in("#a2_sc", C["a2"][2], y=-20); c.to("#a2_sc", C["a2"][2] + 0.5, "x:-160,y:40", d=1.2)
    s.append(P(c, "a2_cut", "M 1500 720 L 1300 770", C["a2"][2] + 0.6, CORAL, 5, 1.1))
    s.append(W(c, "a2_d", 220, 760, 'dissection', C["a2"][2] + 0.3, 56, INK))
    hideall(c, ["#a2_t", "#a2_r", "#a2_sc", "#a2_cut", "#a2_d"] + [f"#a2_c{i}" for i in range(4)], c.end("a2"))
    # a3 two ways
    s.append(txt("a3_h1", 520, 200, "BY SCALE", 44, GOLD, weight=900)); c.fade_in("#a3_h1", C["a3"][1] - 0.3)
    s.append(MI("a3_g", "heart-front", 200, 260, 200)); c.fade_in("#a3_g", C["a3"][1])
    s.append(W(c, "a3_gt", 420, 400, "gross: the naked eye", C["a3"][1] + 0.3, 46))
    s.append(f'<g id="a3_m" opacity="0"><circle cx="300" cy="640" r="120" fill="#0b1c3a" stroke="{TEAL}" stroke-width="8"/>'
             f'<clipPath id="a3_cp"><circle cx="300" cy="640" r="112"/></clipPath><g clip-path="url(#a3_cp)">{medart.image("cardiac-muscle-cell", OUT, 140, 560, 330)}</g>'
             f'<rect x="380" y="730" width="34" height="110" rx="10" fill="{TEAL}" transform="rotate(-40 397 785)"/></g>')
    c.fade_in("#a3_m", C["a3"][2], y=10)
    s.append(W(c, "a3_mt", 470, 650, "microscopic: needs a microscope", C["a3"][2] + 0.3, 46))
    hideall(c, ["#a3_h1", "#a3_g", "#a3_gt", "#a3_m", "#a3_mt"], C["a3"][3] - 0.2)
    s.append(txt("a3_h2", 960, 200, "BY APPROACH", 44, TEAL, weight=900)); c.fade_in("#a3_h2", C["a3"][3])
    s.append(MI("a3_hand", "Anterior_view_of_bones_of_right_hand", 180, 260, 520)); c.fade_in("#a3_hand", C["a3"][3])
    s.append(W(c, "a3_rt", 440, 830, "regional: ONE part, everything in it", C["a3"][3] + 0.3, 44, GOLD, anchor="middle"))
    for i, (w_, col) in enumerate([("bone", "#e8dcc0"), ("muscle", RED), ("vessel", CORAL), ("nerve", GOLD)]):
        s.append(chip(f"a3_k{i}", 440 + (i - 1.5) * 200, 920, w_, col, 32)); c.pop(f"#a3_k{i}", C["a3"][3] + 1.6 + i * 0.35)
    s.append(W(c, "a3_st", 1400, 330, "systemic: ONE system,", C["a3"][4], 48, TEAL, anchor="middle"))
    s.append(W(c, "a3_st2", 1400, 400, "through the whole body", C["a3"][4] + 0.9, 48, TEAL, anchor="middle"))
    s.append(jimg("a3_j1", "jordan-hips", 1080, 940, 0.38)); s.append(jimg("a3_j2", "jordan-hips", 1460, 940, 0.38))
    c.fade_in("#a3_j1", C["a3"][4] + 0.4); c.fade_in("#a3_j2", C["a3"][4] + 0.6)
    s.append(chip("a3_b", 1150, 990, "all the bones", "#e8dcc0", 32)); s.append(chip("a3_mu", 1620, 990, "then all the muscles", RED, 32))
    c.pop("#a3_b", C["a3"][4] + 1.6); c.pop("#a3_mu", C["a3"][4] + 2.4)
    s.append(chip("a3_this", 1400, 1055, "how this course works", GREEN, 32)); c.pop("#a3_this", C["a3"][5])
    hideall(c, ["#a3_h2", "#a3_hand", "#a3_rt", "#a3_st", "#a3_st2", "#a3_j1", "#a3_j2", "#a3_b", "#a3_mu", "#a3_this"] + [f"#a3_k{i}" for i in range(4)], c.end("a3"))
    # a4 physiology as mechanism
    s.append(W(c, "a4_t", 220, 230, '<tspan fill="#2ee6d6">physiology</tspan> = how structures work', T["a4"] + 0.2, 70))
    s.append(W(c, "a4_r", 220, 340, 'physio = nature · logy = study of', C["a4"][1], 52, INK))
    s.append(card("a4_bad", 200, 430, 1520, 120, CORAL, op=0)); c.fade_in("#a4_bad", C["a4"][3] - 0.2, y=10)
    s.append(W(c, "a4_b", 240, 510, '"her heart speeds up because it NEEDS oxygen"', C["a4"][3], 50, WHITE))
    s.append(P(c, "a4_x", "M 240 495 L 1680 495", C["a4"][3] + 2.2, CORAL, 8)); c.sound("wrong", C["a4"][3] + 2.2, 0.35)
    s.append(card("a4_good", 200, 620, 1520, 300, GREEN, op=0)); c.fade_in("#a4_good", C["a4"][4] - 0.2, y=10)
    s.append(chip("a4_c1", 520, 720, "nerve signals", GOLD, 40)); c.pop("#a4_c1", C["a4"][4] + 0.4)
    s.append(chip("a4_c2", 520, 830, "+ adrenaline (in blood)", VIOLET, 40)); c.pop("#a4_c2", C["a4"][4] + 1.4)
    s.append(arrow("a4_ar", 830, 775, 1080, 775, GREEN)); c.draw("#a4_ar", C["a4"][4] + 2.6, d=0.5)
    s.append(heart_icon("a4_h", 1200, 790, 1.4, RED)); c.pop("#a4_h", C["a4"][4] + 3.0); c.pulse("#a4_h", C["a4"][4] + 3.4, c.end("a4"), 1.2, 0.3)
    s.append(W(c, "a4_hf", 1290, 800, "faster, harder", C["a4"][4] + 3.2, 50, GREEN))
    s.append(chip("a4_ok", 960, 980, "a chain of causes ✓", GREEN, 40)); c.pop("#a4_ok", C["a4"][5]); c.sound("check", C["a4"][5], 0.4)
    hideall(c, ["#a4_t", "#a4_r", "#a4_bad", "#a4_b", "#a4_x", "#a4_good", "#a4_c1", "#a4_c2", "#a4_ar", "#a4_h", "#a4_hf", "#a4_ok"], c.end("a4"))
    # a5 capillary: structure decides function
    s.append(W(c, "a5_t", 960, 210, 'structure → function', T["a5"] + 0.3, 76, GOLD, anchor="middle"))
    s.append(MI("a5_cap", "capillary", 200, 300, 900)); c.fade_in("#a5_cap", C["a5"][2])
    s.append(txt("a5_cl", 650, 860, "capillary", 48, WHITE, weight=900)); c.fade_in("#a5_cl", C["a5"][2] + 0.3)
    s.append(P(c, "a5_wall", "M 260 330 Q 640 420 1060 600", C["a5"][3], TEAL, 10, 0.9))
    s.append(W(c, "a5_wt", 1140, 400, "ONE layer of thin, flat cells", C["a5"][3] + 0.3, 46, TEAL))
    # muscle block + oxygen dots
    s.append(f'<rect id="a5_mus" x="1180" y="560" width="520" height="220" rx="40" fill="#c4574a" opacity="0"/>')
    s.append(txt("a5_ml", 1440, 690, "leg muscle", 44, WHITE, weight=900)); c.fade_in("#a5_mus", C["a5"][4] - 0.2); c.fade_in("#a5_ml", C["a5"][4])
    s.append('<g id="a5_ox">' + "".join(f'<circle class="a5_o" cx="{560+i*60}" cy="{520+(i%3)*20}" r="14" fill="{GOLD}" opacity="0"/>' for i in range(8)) + '</g>')
    c.g(f'tl.fromTo(".a5_o",{{opacity:1,x:0,y:0}},{{x:720,y:120,opacity:0.9,duration:1.6,stagger:0.15,ease:"power1.inOut",immediateRender:false}},{C["a5"][4]:.2f});')
    s.append(chip("a5_oxl", 820, 470, "oxygen", GOLD, 34)); c.pop("#a5_oxl", C["a5"][4] + 0.2); c.sound("whoosh_real", C["a5"][4], 0.4)
    hideall(c, ["#a5_cap", "#a5_cl", "#a5_wall", "#a5_wt", "#a5_ox", "#a5_oxl", "#a5_mus", "#a5_ml"], C["a5"][5] - 0.2)
    s.append(MI("a5_thick", "vascular-tunic-artery", 520, 300, 260)); c.fade_in("#a5_thick", C["a5"][5])
    s.append(MI("a5_cap2", "capillary", 1120, 360, 520)); c.fade_in("#a5_cap2", C["a5"][5] + 0.8)
    s.append(W(c, "a5_ct", 1380, 720, "1 cell thick: oxygen passes", C["a5"][5] + 1.0, 46, GREEN, anchor="middle"))
    s.append('<g id="a5_ox2">' + "".join(f'<circle class="a5_b" cx="{900+i*70}" cy="{520+(i%2)*60}" r="14" fill="{GOLD}" opacity="0"/>' for i in range(4)) + '</g>')
    c.g(f'tl.fromTo(".a5_b",{{opacity:1,x:0}},{{x:-130,duration:0.5,yoyo:true,repeat:3,stagger:0.1,ease:"power2.in",immediateRender:false}},{C["a5"][5]+0.3:.2f});')
    s.append(W(c, "a5_tt", 650, 1020, "thick wall: no exchange", C["a5"][5] + 0.4, 50, CORAL)); c.sound("wrong", C["a5"][5] + 0.8, 0.3)
    hideall(c, ["#a5_t", "#a5_thick", "#a5_ox2", "#a5_tt", "#a5_cap2", "#a5_ct"], c.end("a5"))
    # quick check 1
    s.append(qcheck(c, "q1", "c1q", ["Measuring how fast blood flows", "through Jordan's arteries:", "anatomy or physiology?"]))
    s.append(W(c, "q1_a", 330, 700, '<tspan fill="#2ee6d6">physiology</tspan>: how it WORKS', T["c1a"] + 0.1, 56))
    s.append(W(c, "q1_b", 330, 800, 'wall thickness would be anatomy', C["c1a"][1], 48, INK)); c.sound("ding", T["c1a"] + 0.1, 0.35)
    hideall(c, ["#q1_g", "#q1_a", "#q1_b"], c.end("c1a") + 0.2)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- six levels
LV = [("organism", VIOLET), ("organ system", CORAL), ("organ", WARM), ("tissue", GOLD), ("cellular", GREEN), ("chemical", TEAL)]
def ladder(c, pfx, show_t, lit):
    """level ladder (top = organism). lit: {level index from bottom (0=chemical): time}"""
    s = [f'<g id="{pfx}" opacity="0">']
    c.fade_in(f"#{pfx}", show_t, y=0)
    for i, (name, col) in enumerate(LV):
        lvl = 5 - i; y = 230 + i * 120
        s.append(f'<rect id="{pfx}_r{lvl}" x="60" y="{y}" width="330" height="92" rx="20" fill="rgba(8,20,40,.75)" stroke="{DIM}" stroke-width="4"/>')
        s.append(f'<text id="{pfx}_t{lvl}" x="225" y="{y+60}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="{DIM}">{name}</text>')
        if lvl in lit:
            t = lit[lvl]
            c.stroke(f"#{pfx}_r{lvl}", t, col); c.glow(f"#{pfx}_t{lvl}", t, col)
            c.g(f'tl.fromTo("#{pfx}_r{lvl}",{{fill:"rgba(8,20,40,.75)"}},{{fill:"{col}33",duration:0.4,immediateRender:false}},{t:.2f});')
            c.sound("tick", t, 0.35)
    s.append('</g>')
    return "".join(s)

def fiber(id, x, y, w=820, h=90, op=0):
    """one skeletal muscle cell (fiber): long cylinder with cross stripes (no nuclei drawn)"""
    stripes = "".join(f'<rect x="{x + 20 + k*22}" y="{y+6}" width="8" height="{h-12}" fill="#9e3b34" opacity=".55"/>' for k in range(int((w-40)/22)))
    return (f'<g id="{id}" opacity="{op}"><g id="{id}_s"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="#d9705f"/>{stripes}'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h*0.35:.0f}" rx="{h*0.2:.0f}" fill="#fff" opacity=".18"/></g></g>')

def levels(c):
    t0, t1 = chapter_span(c, "levels")
    T, C = c.T, c.C
    s = ['<g id="g_lv" opacity="0">']
    c.scene("#g_lv", t0, t1)
    # l1: back to the track, dive into the thigh
    fm, fg = track("tr2", op=1)
    s.append(f'<g id="lv_sc">{fm}')
    run_motion(c, "tr2", t0, C["l1"][2] + 0.5); steps(c, t0, C["l1"][1], 0.4)
    s.append(jimg("lv_j", "jordan-sprint", 560, 1010, 0.62, op=1)); bob(c, "#lv_j_b", t0, C["l1"][2] + 0.5)
    s.append(f'<ellipse id="lv_q" cx="830" cy="770" rx="110" ry="70" fill="none" stroke="{GOLD}" stroke-width="8" opacity="0"/>')
    c.fade_in("#lv_q", C["l1"][1], y=0); c.pulse("#lv_q", C["l1"][1] + 0.4, C["l1"][2], 1.08, 0.5)
    s.append(chip("lv_qc", 1160, 900, "quadriceps: straightens the knee", GOLD, 38)); c.pop("#lv_qc", C["l1"][1] + 0.3)
    s.append(fg + '</g></g>')
    c.cam(C["l1"][2], 2.6, -330, -560, d=1.4); c.sound("whoosh_real", C["l1"][2], 0.6); c.sound("riser", C["l1"][2] - 0.5, 0.3)
    c.to("#lv_sc", C["l1"][2] + 1.1, "opacity:0", d=0.4); c.cam(C["l1"][2] + 1.5, 1, 0, 0, d=0.01)
    s.append(lab_bg("lv_bg", op=0)); c.fade_in("#lv_bg", C["l1"][2] + 1.3, y=0); drift(c, "#lv_bg", C["l1"][2] + 1.3, t1, -100)
    lit = {0: T["l2"] + 0.2, 1: T["l3"] + 1.0, 2: T["l4"] + 0.2, 3: T["l5"] + 0.2, 4: T["l6"] + 0.2, 5: T["l7"] + 0.2}
    s.append(ladder(c, "ld", C["l1"][2] + 1.5, lit))
    s.append(W(c, "l1_r", 1180, 600, "each level can do", C["l1"][3], 60, WHITE, anchor="middle"))
    s.append(W(c, "l1_r2", 1180, 690, "what its parts can't", C["l1"][3] + 1.0, 60, GOLD, anchor="middle"))
    hideall(c, ["#l1_r", "#l1_r2"], c.end("l1"))
    # l2 chemical
    for i, (sym, col) in enumerate([("C", "#9aa6b8"), ("H", "#e8eef8"), ("O", RED), ("N", BLUE)]):
        s.append(f'<g id="l2_a{i}" opacity="0"><circle cx="{620 + i*170}" cy="300" r="62" fill="{col}"/><text x="{620+i*170}" y="322" text-anchor="middle" font-family="Inter" font-weight="900" font-size="60" fill="#0b1c3a">{sym}</text></g>')
        c.pop(f"#l2_a{i}", C["l2"][1] + 0.3 + i * 0.35); c.sound("pop", C["l2"][1] + 0.3 + i * 0.35, 0.3)
    s.append(W(c, "l2_at", 620, 440, "atoms: the smallest unit of an element", C["l2"][1] + 0.2, 44, INK, anchor="start"))
    # 3D water molecule
    s.append(f'<g id="l2_w3" opacity="0">' + chem.mol3d("O", OUT, "h2o", x=1150, y=430, w=520, h=440, start=C["l2"][2], turns=1.5, dur=9.0, zoom=2.6, in_svg=True) + '</g>')
    c.show("#l2_w3", C["l2"][2]); c.show("#h2o", C["l2"][2])
    s.append(W(c, "l2_mt", 1410, 960, 'molecule: water, H₂O', C["l2"][3], 54, TEAL, anchor="middle"))
    s.append(W(c, "l2_hoh", 1410, 1035, '2 hydrogen + 1 oxygen', C["l2"][3] + 1.0, 40, WHITE, anchor="middle"))
    s.append(MI("l2_pr", "actin-myosin", 520, 620, 560)); c.fade_in("#l2_pr", C["l2"][4])
    s.append(W(c, "l2_pt", 800, 880, "protein strands that pull", C["l2"][4] + 0.4, 46, GOLD, anchor="middle"))
    s.append(chip("l2_mw", 1700, 440, "mostly water", TEAL, 36)); c.pop("#l2_mw", C["l2"][4] - 0.2)
    hideall(c, [f"#l2_a{i}" for i in range(4)] + ["#l2_at", "#l2_w3", "#l2_mt", "#l2_hoh", "#l2_pr", "#l2_pt", "#l2_mw"], c.end("l2"))
    # l3 cell
    s.append(f'<g id="l3_pile" opacity="0">' + "".join(f'<circle cx="{700 + random.Random(i).uniform(-120,120):.0f}" cy="{560 + random.Random(i+50).uniform(-80,80):.0f}" r="{random.Random(i+9).uniform(10,22):.0f}" fill="{[TEAL,GOLD,RED,BLUE,"#e8eef8"][i%5]}" opacity=".8"/>' for i in range(26)) + '</g>')
    c.fade_in("#l3_pile", T["l3"] + 0.2); s.append(txt("l3_pl", 700, 740, "a pile of molecules: not alive", 40, DIM)); c.fade_in("#l3_pl", T["l3"] + 0.4)
    c.to("#l3_pile", C["l3"][1], "opacity:0", d=0.4); c.hide("#l3_pl", C["l3"][1])
    s.append(fiber("l3_f", 560, 470, 980, 110)); c.fade_in("#l3_f", C["l3"][1] + 0.2, y=0); c.sound("shimmer", C["l3"][1] + 0.2, 0.3)
    s.append(W(c, "l3_ct", 600, 330, 'cell: smallest unit that can live on its own', C["l3"][1] + 0.4, 46))
    s.append(W(c, "l3_lat", 600, 400, 'Latin cella = small room', C["l3"][1] + 3.0, 40, INK))
    s.append(chip("l3_mf", 1050, 680, "muscle cell = muscle fiber", GREEN, 40)); c.pop("#l3_mf", C["l3"][2])
    c.g(f'tl.fromTo("#l3_f_s",{{scaleX:1}},{{scaleX:0.72,transformOrigin:"50% 50%",duration:0.45,yoyo:true,repeat:3,ease:"power2.inOut",immediateRender:false}},{C["l3"][3]:.2f});')
    s.append(W(c, "l3_sh", 1050, 820, "shortens and pulls", C["l3"][3] + 0.2, 52, GOLD, anchor="middle")); c.sound("cloth_real", C["l3"][3], 0.4)
    hideall(c, ["#l3_f", "#l3_ct", "#l3_lat", "#l3_mf", "#l3_sh"], c.end("l3"))
    # l4 tissue
    s.append(MI("l4_b", "muscle-fiber", 560, 380, 900)); c.fade_in("#l4_b", C["l4"][1] - 0.2)
    s.append(W(c, "l4_t", 600, 290, 'tissue: similar cells + material around them', C["l4"][1] + 0.2, 46))
    s.append(W(c, "l4_w", 600, 860, 'from French: "woven"', C["l4"][2], 48, INK))
    s.append(chip("l4_wr", 1250, 360, "thin wrappings", GOLD, 34)); c.pop("#l4_wr", C["l4"][3] + 1.2)
    c.g(f'tl.fromTo("#l4_b",{{scaleX:1}},{{scaleX:0.9,transformOrigin:"50% 50%",duration:0.4,yoyo:true,repeat:3,ease:"power2.inOut",immediateRender:false}},{C["l4"][4]:.2f});')
    s.append(W(c, "l4_p", 1100, 960, 'pulls as one', C["l4"][4] + 0.2, 52, GOLD, anchor="middle"))
    s.append(chip("l4_h", 1500, 860, "histology = study of tissues", TEAL, 34)); c.pop("#l4_h", C["l4"][5])
    hideall(c, ["#l4_b", "#l4_t", "#l4_w", "#l4_wr", "#l4_p", "#l4_h"], c.end("l4"))
    # l5 organ
    s.append(f'<g id="l5_bone" opacity="0"><rect x="560" y="900" width="980" height="70" rx="35" fill="#efe6cf"/><circle cx="560" cy="935" r="60" fill="#efe6cf"/><circle cx="1540" cy="935" r="60" fill="#efe6cf"/></g>')
    s.append(f'<g id="l5_m" opacity="0"><g transform="rotate(-90 1050 520)">{medart.image("muscle-1", OUT, 960, 140, 190)}</g></g>')
    c.fade_in("#l5_m", C["l5"][2] - 0.4, y=0); c.fade_in("#l5_bone", C["l5"][3])
    s.append(W(c, "l5_t", 600, 290, 'organ: 2+ tissue types, a shape, a job', C["l5"][1], 46))
    s.append(chip("l5_mt", 1050, 400, "muscle tissue: pulls", RED, 34)); c.pop("#l5_mt", C["l5"][3])
    s.append(P(c, "l5_ten", "M 1440 520 Q 1500 700 1500 900", C["l5"][3] + 1.0, "#f4f0e6", 18))
    s.append(chip("l5_tt", 1650, 720, "tendon to bone", "#f4f0e6", 34)); c.pop("#l5_tt", C["l5"][3] + 1.3)
    s.append(chip("l5_ct", 760, 760, "connective tissue", GOLD, 34)); c.pop("#l5_ct", C["l5"][3] + 0.6)
    s.append(P(c, "l5_v", "M 620 620 C 800 560, 1000 650, 1300 560", C["l5"][4], RED, 10))
    s.append(P(c, "l5_n", "M 620 470 C 800 420, 1000 500, 1300 440", C["l5"][4] + 0.8, GOLD, 6))
    s.append(txt("l5_vl", 600, 650, "blood vessel", 32, RED, anchor="end")); s.append(txt("l5_nl", 600, 480, "nerve", 32, GOLD, anchor="end"))
    c.fade_in("#l5_vl", C["l5"][4] + 0.3); c.fade_in("#l5_nl", C["l5"][4] + 1.1)
    s.append(W(c, "l5_g", 1060, 1050, 'Greek organon = tool', C["l5"][5], 46, INK, anchor="middle"))
    hideall(c, ["#l5_bone", "#l5_m", "#l5_t", "#l5_mt", "#l5_ten", "#l5_tt", "#l5_ct", "#l5_v", "#l5_n", "#l5_vl", "#l5_nl", "#l5_g"], c.end("l5"))
    # l6 organ system
    s.append(W(c, "l6_t", 600, 290, 'organ system: organs sharing one job', T["l6"] + 0.2, 46))
    s.append(jimg("l6_j", "jordan-hips", 900, 1040, 0.55)); c.fade_in("#l6_j", C["l6"][1] - 0.2)
    s.append(f'<g id="l6_glow" opacity="0"><ellipse cx="1000" cy="860" rx="90" ry="150" fill="{RED}" opacity=".35" filter="url(#blur14)"/><ellipse cx="1060" cy="560" rx="120" ry="80" fill="{RED}" opacity=".3" filter="url(#blur14)"/></g>')
    c.fade_in("#l6_glow", C["l6"][1], y=0)
    s.append(chip("l6_ms", 1500, 560, "muscular system", CORAL, 44)); c.pop("#l6_ms", C["l6"][1] + 0.2)
    s.append(chip("l6_n", 1500, 700, "600+ muscles", WHITE, 40)); c.pop("#l6_n", C["l6"][2] + 0.6)
    hideall(c, ["#l6_t", "#l6_j", "#l6_glow", "#l6_ms", "#l6_n"], c.end("l6"))
    # l7 organism, ladder sweep
    s.append(jimg("l7_j", "jordan-sprint", 720, 1000, 0.55)); c.fade_in("#l7_j", T["l7"] + 0.1); bob(c, "#l7_j_b", T["l7"], c.end("l7"))
    s.append(W(c, "l7_t", 1300, 300, 'organism: Jordan herself', T["l7"] + 0.3, 56, VIOLET, anchor="middle"))
    for i in range(6):
        c.g(f'tl.fromTo("#ld_r{i}",{{scale:1}},{{scale:1.08,transformOrigin:"50% 50%",duration:0.2,yoyo:true,repeat:1}},{C["l7"][2] + i*0.55:.2f});'); c.sound("tick", C["l7"][2] + i * 0.55, 0.25)
    s.append(chip("l7_six", 1300, 420, "6 levels", GOLD, 52)); c.pop("#l7_six", C["l7"][3]); c.sound("ding", C["l7"][3], 0.35)
    hideall(c, ["#l7_j", "#l7_t", "#l7_six"], c.end("l7"))
    # l8 pattern
    rows = [("1 fiber", "pulls", 1, GREEN), ("1 muscle", "straightens a knee", 2, WARM), ("systems", "run the race", 4, CORAL)]
    for i, (a, b, cue, col) in enumerate(rows):
        y = 350 + i * 200
        s.append(card(f"l8_c{i}", 560, y - 80, 1260, 140, col, op=0)); c.fade_in(f"#l8_c{i}", C["l8"][cue] - 0.1, y=10)
        s.append(W(c, f"l8_a{i}", 600, y + 10, a, C["l8"][cue], 56, col))
        s.append(W(c, f"l8_b{i}", 980, y + 10, "→ " + b, C["l8"][cue] + 0.6, 56))
    s.append(P(c, "l8_x1", "M 1300 345 L 1300 345", C["l8"][1] + 1.5, CORAL, 1)); s.append(txt("l8_n1", 1560, 362, "but can't straighten a knee", 36, CORAL, weight=900)); c.fade_in("#l8_n1", C["l8"][1] + 1.5)
    s.append(chip("l8_k", 1190, 1000, "every level gains abilities its parts DON'T have", GOLD, 38)); c.pop("#l8_k", C["l8"][5]); c.sound("shimmer", C["l8"][5], 0.35)
    hideall(c, [f"#l8_{p}{i}" for p in "cab" for i in range(3)] + ["#l8_x1", "#l8_n1", "#l8_k", "#ld"], c.end("l8"))
    # quick check 2
    s.append(qcheck(c, "q2", "c2q", ["Similar cells + the material around them,", "working on one job.", "Which level?"]))
    s.append(W(c, "q2_a", 330, 700, '<tspan fill="#ffd23f">tissue</tspan>', T["c2a"] + 0.1, 64)); c.sound("ding", T["c2a"] + 0.1, 0.35)
    s.append(card("q2_tc", 300, 780, 1320, 110, CORAL, op=0)); c.fade_in("#q2_tc", C["c2a"][1], y=10); c.sound("wrong", C["c2a"][1], 0.4)
    s.append(W(c, "q2_tr", 340, 852, '<tspan fill="#ff6b6b">trap:</tspan> organ needs 2+ kinds of tissue', C["c2a"][1] + 0.2, 44))
    hideall(c, ["#q2_g", "#q2_a", "#q2_tc", "#q2_tr"], c.end("c2a"))
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- organ systems
SYS = [("integumentary", "skin-normal", TEAL), ("skeletal", None, "#e8dcc0"), ("muscular", "muscle-1", RED), ("nervous", "brain-1", GOLD),
       ("endocrine", None, VIOLET), ("cardiovascular", "heart-front", CORAL), ("lymphatic", "spleen-1", GREEN), ("respiratory", "healthy-lung", BLUE),
       ("digestive", "digestive-system", WARM), ("urinary", "kidney-1", "#7fd1ff"), ("reproductive", None, "#ff9ad5")]

def bone_icon(x, y, s=1, col="#efe6cf"):
    return (f'<g transform="translate({x} {y}) scale({s}) rotate(-35)"><rect x="-60" y="-12" width="120" height="24" rx="10" fill="{col}"/>'
            f'<circle cx="-62" cy="-14" r="16" fill="{col}"/><circle cx="-62" cy="14" r="16" fill="{col}"/><circle cx="62" cy="-14" r="16" fill="{col}"/><circle cx="62" cy="14" r="16" fill="{col}"/></g>')

def gland_icon(x, y, s=1, col=VIOLET):
    return (f'<g transform="translate({x} {y}) scale({s})"><path d="M 0 -60 C 40 -10, 50 20, 0 50 C -50 20, -40 -10, 0 -60 Z" fill="{col}"/>'
            f'<circle cx="0" cy="10" r="16" fill="#fff" opacity=".5"/></g>')

def repro_icon(x, y, s=1, col="#ff9ad5"):
    return (f'<g transform="translate({x} {y}) scale({s})"><circle cx="-20" cy="0" r="44" fill="{col}" opacity=".9"/><circle cx="-20" cy="0" r="16" fill="#fff" opacity=".6"/>'
            f'<ellipse cx="50" cy="-10" rx="14" ry="10" fill="#e8eef8"/><path d="M 62 -8 Q 80 6 96 -4" fill="none" stroke="#e8eef8" stroke-width="4"/></g>')

def sys_icon(i, x, y, w):
    name, art, col = SYS[i]
    if art:
        h = MH(art, w); ww = w if h <= w else w * w / h
        return medart.image(art, OUT, x + (w - ww) / 2, y, ww)
    cx, cy = x + w / 2, y + w / 2
    return bone_icon(cx, cy, w / 170, col) if name == "skeletal" else (gland_icon(cx, cy, w / 140) if name == "endocrine" else repro_icon(cx, cy, w / 150))

def tiles(c, pfx, times):
    """11 small tiles along the top; tile i lights at times[i]"""
    s = [f'<g id="{pfx}">']
    for i, (name, art, col) in enumerate(SYS):
        x = 150 + i * 150; y = 108
        s.append(f'<g id="{pfx}_{i}" opacity=".18"><rect x="{x}" y="{y}" width="136" height="136" rx="20" fill="rgba(8,20,40,.8)" stroke="{col}" stroke-width="4"/>'
                 f'<g transform="translate({x+18} {y+10})">{sys_icon(i, 0, 0, 100)}</g>'
                 f'<text x="{x+68}" y="{y+128}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="15" fill="{col}">{name}</text></g>')
        if i in times: c.to(f"#{pfx}_{i}", times[i], "opacity:1", d=0.3); c.sound("pop", times[i], 0.3)
    s.append('</g>')
    return "".join(s)

def sys_panel(c, pid, i, t_in, t_out, organs, roots=None, job=None, art_w=380):
    """big illustration left, name + organs + roots + job written right"""
    name, art, col = SYS[i]
    s = [f'<g id="{pid}" opacity="0">']
    c.fade_in(f"#{pid}", t_in, y=0); c.sound("swish", t_in, 0.4)
    if art:
        h = MH(art, art_w)
        if h > 620: art_w = art_w * 620 / h; h = 620
        s.append(medart.image(art, OUT, 380 - art_w / 2, 640 - h / 2, art_w))
    elif name == "endocrine":
        s.append(f'<image href="jordan-hips.png" x="250" y="300" width="{530*0.55:.0f}" height="{1275*0.55:.0f}"/>')
        for gx, gy in ((396, 345), (396, 430), (370, 590), (424, 590), (410, 615), (396, 760)):
            s.append(f'<circle cx="{gx}" cy="{gy}" r="13" fill="{VIOLET}" stroke="#fff" stroke-width="3"/>')
    else:
        s.append(sys_icon(i, 180, 440, 400))
    s.append('</g>')
    s.append(txt(f"{pid}_n", 720, 380, name.upper() + " SYSTEM", 56, col, anchor="start", weight=900)); c.fade_in(f"#{pid}_n", t_in + 0.1, y=10)
    s.append(W(c, f"{pid}_o", 720, 470, organs[0], organs[1], 46))
    ids = [pid, f"{pid}_n", f"{pid}_o"]
    if roots:
        s.append(W(c, f"{pid}_r", 720, 550, roots[0], roots[1], 40, INK)); ids.append(f"{pid}_r")
    if job:
        s.append(W(c, f"{pid}_j", 720, 640, job[0], job[1], 44, col)); ids.append(f"{pid}_j")
    hideall(c, ["#" + x for x in ids], t_out)
    return "".join(s), ids

def systems1(c):
    t0, t1 = chapter_span(c, "systems1")
    T, C = c.T, c.C
    s = ['<g id="g_s1" opacity="0">', lab_bg("s1_bg", op=1)]
    c.scene("#g_s1", t0, t1); drift(c, "#s1_bg", t0, t1, -80)
    s.append(tiles(c, "t1", {0: T["s1"] + 0.6, 1: T["s2"] + 0.3, 2: T["s3"] + 0.3, 3: C["s4"][1], 4: T["s5"] + 0.3}))
    s.append(W(c, "s0_t", 960, 520, "11 organ systems", C["s0"][0] if 0 in C["s0"] else T["s0"] + 0.2, 90, GOLD, anchor="middle"))
    s.append(jimg("s0_j", "jordan-sprint", 260, 1040, 0.4)); c.fade_in("#s0_j", C["s0"][1]); bob(c, "#s0_j_b", C["s0"][1], c.end("s0"))
    s.append(W(c, "s0_q", 960, 640, "what is each one doing for her?", C["s0"][1] + 0.3, 50, anchor="middle"))
    s.append(chip("s0_l", 960, 1000, "learn: main organs + main job", TEAL, 38)); c.pop("#s0_l", C["s0"][2])
    hideall(c, ["#s0_t", "#s0_j", "#s0_q", "#s0_l"], c.end("s0"))
    # s1 integumentary
    p, _ = sys_panel(c, "p1", 0, T["s1"], c.end("s1"), ("skin · hair · nails · sweat glands", C["s1"][1]),
                     ('Latin integumentum = covering', C["s1"][2]), ("protects · limits water loss · temperature", C["s1"][3]))
    s.append(p)
    s.append(MI("s1_hair", "hair", 560, 560, 80)); c.fade_in("#s1_hair", C["s1"][1] + 0.5)
    s.append(jimg("s1_j", "jordan-bent", 1250, 1060, 0.3)); c.fade_in("#s1_j", C["s1"][4] - 0.2)
    s.append(drops("s1_sw", 1400, 760, 5)); c.set("#s1_sw", C["s1"][4], "opacity:1"); fall(c, ".s1_sw_d", C["s1"][4], 1.0, 80, 2)
    s.append(heat_waves("s1_hw", 1560, 760)); c.set("#s1_hw", C["s1"][4] + 1.0, "opacity:1"); rise(c, "#s1_hw", C["s1"][4] + 1.0, 1.2, 2)
    s.append(W(c, "s1_ev", 1440, 900, "evaporation carries heat away", C["s1"][4] + 0.8, 36, WARM, anchor="start"))
    hideall(c, ["#s1_hair", "#s1_j", "#s1_sw", "#s1_hw", "#s1_ev"], c.end("s1"))
    # s2 skeletal
    p, _ = sys_panel(c, "p2", 1, T["s2"], c.end("s2"), ("bones · joints", T["s2"] + 0.8))
    s.append(p)
    for i, (tx, cue) in enumerate([("supports her", 1), ("protects brain + heart", 1), ("anchors for muscles", 2), ("stores calcium", 3), ("makes blood cells", 3)]):
        s.append(tick_box(f"s2_k{i}", 740, 580 + i * 80, tx)); tick(c, f"s2_k{i}", C["s2"][cue] + (0.9 if i in (1, 4) else 0))
    hideall(c, [f"#s2_k{i}" for i in range(5)], c.end("s2"))
    # s3 muscular
    p, _ = sys_panel(c, "p3", 2, T["s3"], c.end("s3"), ("muscles attached to bones", T["s3"] + 0.8), None, ("moves her · makes heat", C["s3"][1]), art_w=300)
    s.append(p)
    s.append(heat_waves("s3_hw", 300, 420, n=4)); c.set("#s3_hw", C["s3"][2], "opacity:1"); rise(c, "#s3_hw", C["s3"][2], 1.2, 3)
    s.append(chip("s3_q", 1250, 820, "so why doesn't her temperature shoot up?", CORAL, 38)); c.pop("#s3_q", C["s3"][2] + 1.6)
    hideall(c, ["#s3_hw", "#s3_q"], c.end("s3"))
    # s4 nervous
    p, _ = sys_panel(c, "p4", 3, T["s4"], c.end("s4"), ("brain · spinal cord · nerves", C["s4"][1] + 0.2), None, ("fast electrical signals", C["s4"][2]), art_w=340)
    s.append(p)
    s.append(jimg("s4_j", "jordan-sprint", 1250, 1060, 0.33)); c.fade_in("#s4_j", C["s4"][3] - 0.3)
    s.append(P(c, "s4_path", "M 1440 690 L 1450 850 L 1500 960 L 1470 1030", C["s4"][3], GOLD, 5))
    s.append(f'<circle id="s4_sig" r="12" fill="{GOLD}" opacity="0"><animateMotion dur="1s" path="M 0 0"/></circle>')
    c.g(f'tl.fromTo("#s4_sig",{{opacity:1,attr:{{cx:1440,cy:690}}}},{{keyframes:[{{attr:{{cx:1450,cy:850}},duration:0.3}},{{attr:{{cx:1500,cy:960}},duration:0.3}},{{attr:{{cx:1470,cy:1030}},duration:0.3}}],repeat:3,immediateRender:false}},{C["s4"][3]+0.2:.2f});')
    c.sound("tick", C["s4"][3] + 0.2, 0.3)
    hideall(c, ["#s4_j", "#s4_path", "#s4_sig"], c.end("s4"))
    # s5 endocrine
    p, _ = sys_panel(c, "p5", 4, T["s5"], c.end("s5"), ("glands release hormones into the blood", C["s5"][1] + 1.2), ("endo = within · -crine = secrete", C["s5"][1]))
    s.append(p)
    s.append(W(c, "s5_sl", 720, 740, "slower, longer lasting signals", T["s5"] + 0.6, 40, INK))
    for i, g_ in enumerate(["pituitary", "thyroid", "adrenals", "pancreas", "gonads"]):
        s.append(chip(f"s5_g{i}", 820 + i * 220, 840, g_, VIOLET, 30)); c.pop(f"#s5_g{i}", C["s5"][2] + i * 0.6)
    s.append(chip("s5_gr", 1600, 740, "growth", VIOLET, 34)); c.pop("#s5_gr", C["s5"][3])
    s.append(f'<g id="s5_adr" opacity="0"><path d="M 1240 960 L 1560 960" stroke="{RED}" stroke-width="40" stroke-linecap="round" opacity=".5"/>' +
             "".join(f'<circle class="s5_dot" cx="1260" cy="960" r="9" fill="{VIOLET}"/>' for _ in range(5)) + '</g>')
    s.append(heart_icon("s5_h", 1640, 970, 1.1, RED)); c.fade_in("#s5_adr", C["s5"][4]); c.pop("#s5_h", C["s5"][4])
    c.g(f'tl.fromTo(".s5_dot",{{x:0}},{{x:300,duration:1.2,stagger:0.2,repeat:2,ease:"none",immediateRender:false}},{C["s5"][4]+0.2:.2f});')
    c.pulse("#s5_h", C["s5"][4] + 1.0, c.end("s5"), 1.2, 0.33)
    s.append(txt("s5_al", 1400, 1040, "adrenaline → heart rate up", 32, VIOLET)); c.fade_in("#s5_al", C["s5"][4] + 0.3)
    hideall(c, ["#s5_sl", "#s5_adr", "#s5_h", "#s5_al", "#s5_gr"] + [f"#s5_g{i}" for i in range(5)], c.end("s5"))
    # quick check 3
    c.hide("#t1", T["c3q"] - 0.2)
    s.append(qcheck(c, "q3", "c3q", ["Nervous vs endocrine:", "how are their signals DIFFERENT?"]))
    s.append(W(c, "q3_a", 330, 640, '<tspan fill="#ffd23f">nervous</tspan>: fast electrical signals along nerves', T["c3a"] + 0.1, 48))
    s.append(W(c, "q3_b", 330, 740, '<tspan fill="#9b7bff">endocrine</tspan>: hormones in blood, slower, longer', C["c3a"][1], 48)); c.sound("ding", T["c3a"] + 0.1, 0.35)
    hideall(c, ["#q3_g", "#q3_a", "#q3_b"], c.end("c3a"))
    s.append('</g>')
    return "".join(s)

def systems2(c):
    t0, t1 = chapter_span(c, "systems2")
    T, C = c.T, c.C
    s = ['<g id="g_s2" opacity="0">', lab_bg("s2_bg", op=1)]
    c.scene("#g_s2", t0, t1); drift(c, "#s2_bg", t0, t1, -80)
    lit = {i: t0 for i in range(5)}; lit.update({5: T["s6"] + 0.3, 6: T["s7"] + 0.3, 7: T["s8"] + 0.3, 8: T["s9"] + 0.3, 9: T["s10"] + 0.3, 10: T["s11"] + 0.3})
    s.append(tiles(c, "t2", lit))
    # s6 cardiovascular
    p, _ = sys_panel(c, "p6", 5, T["s6"], c.end("s6"), ("heart · blood vessels · blood", T["s6"] + 0.8), ("cardio = heart · vascular = small vessel", C["s6"][1]),
                     ("carries oxygen, nutrients, wastes, heat", C["s6"][2]))
    s.append(p); c.pulse("#p6", C["s6"][3], c.end("s6"), 1.04, 0.35); c.sound("heartbeat_real", C["s6"][3], 0.5)
    s.append(chip("s6_x", 1200, 820, "sprint: several times more blood per minute", CORAL, 36)); c.pop("#s6_x", C["s6"][3] + 1.5)
    hideall(c, ["#s6_x"], c.end("s6"))
    # s7 lymphatic
    p, _ = sys_panel(c, "p7", 6, T["s7"], c.end("s7"), ("thymus · spleen · vessels · nodes", T["s7"] + 0.8), None, ("houses immune cells", C["s7"][3]), art_w=260)
    s.append(p)
    s.append(f'<g id="s7_d" opacity="0"><rect x="760" y="760" width="560" height="60" rx="30" fill="{RED}" opacity=".7"/><text x="1040" y="800" text-anchor="middle" font-family="Inter" font-weight="900" font-size="28" fill="#fff">capillary</text>'
             f'<rect x="1380" y="900" width="420" height="44" rx="22" fill="{GREEN}" opacity=".7"/><text x="1590" y="932" text-anchor="middle" font-family="Inter" font-weight="900" font-size="26" fill="#08321a">lymphatic vessel</text>'
             + "".join(f'<circle class="s7_f" cx="{860+i*90}" cy="830" r="10" fill="#bfe8ff"/>' for i in range(5)) + '</g>')
    c.fade_in("#s7_d", C["s7"][1] - 0.3, y=0)
    c.g(f'tl.fromTo(".s7_f",{{x:0,y:0}},{{y:60,duration:0.8,stagger:0.15,ease:"power1.out",immediateRender:false}},{C["s7"][1]+0.3:.2f});')
    c.g(f'tl.to(".s7_f",{{keyframes:[{{x:520,y:80,duration:1.0}}],stagger:0.12,ease:"power1.inOut"}},{C["s7"][2]:.2f});')
    s.append(txt("s7_l1", 900, 1010, "blood pressure pushes fluid out", 30, "#bfe8ff")); c.fade_in("#s7_l1", C["s7"][1] + 0.3)
    s.append(txt("s7_l2", 1590, 1010, "brought back to the blood", 30, GREEN)); c.fade_in("#s7_l2", C["s7"][2] + 0.3)
    hideall(c, ["#s7_d", "#s7_l1", "#s7_l2"], c.end("s7"))
    # s8 respiratory
    p, _ = sys_panel(c, "p8", 7, T["s8"], c.end("s8"), ("nose · trachea (windpipe) · lungs", T["s8"] + 0.8), ("re = again · spire = breathe", C["s8"][1]),
                     ("oxygen in · carbon dioxide out", C["s8"][2]), art_w=340)
    s.append(p)
    s.append(arrow("s8_in", 1150, 820, 1350, 820, BLUE)); s.append(arrow("s8_out", 1550, 900, 1350, 900, DIM))
    s.append(txt("s8_il", 1130, 830, "oxygen", 34, BLUE, anchor="end")); s.append(txt("s8_ol", 1570, 910, "carbon dioxide", 34, INK, anchor="start"))
    c.draw("#s8_in", C["s8"][2] + 0.6, 0.5); c.fade_in("#s8_il", C["s8"][2] + 0.6); c.draw("#s8_out", C["s8"][2] + 1.4, 0.5); c.fade_in("#s8_ol", C["s8"][2] + 1.4)
    c.g(f'tl.fromTo("#p8",{{scale:1}},{{scale:1.05,transformOrigin:"20% 60%",duration:0.45,yoyo:true,repeat:7,ease:"sine.inOut",immediateRender:false}},{C["s8"][3]:.2f});')
    c.sound("breath_female_real", C["s8"][3], 0.5)
    s.append(chip("s8_b", 1350, 990, "brain speeds up breathing (later video)", TEAL, 32)); c.pop("#s8_b", C["s8"][3] + 1.6)
    hideall(c, ["#s8_in", "#s8_out", "#s8_il", "#s8_ol", "#s8_b"], c.end("s8"))
    # s9 digestive
    p, _ = sys_panel(c, "p9", 8, T["s9"], c.end("s9"), ("mouth → esophagus → stomach → intestines", T["s9"] + 0.5), ("+ liver · gallbladder · pancreas · appendix", T["s9"] + 3.0),
                     ("breaks food down · absorbs · removes feces", C["s9"][1]), art_w=240)
    s.append(p)
    s.append(chip("s9_f", 1200, 800, "her muscles' fuel came in here", WARM, 38)); c.pop("#s9_f", C["s9"][2])
    hideall(c, ["#s9_f"], c.end("s9"))
    # s10 urinary: custom diagram with two ureters and one urethra
    s.append(txt("u_n", 720, 380, "URINARY SYSTEM", 56, "#7fd1ff", anchor="start", weight=900)); c.fade_in("#u_n", T["s10"] + 0.1)
    s.append(f'<g id="u_d" opacity="0">{medart.image("kidney-1", OUT, 160, 300, 120)}<g transform="translate(720 0) scale(-1 1)">{medart.image("kidney-1", OUT, 160, 300, 120)}</g>'
             f'{medart.image("bladder", OUT, 270, 640, 180)}</g>')
    c.fade_in("#u_d", T["s10"]); c.sound("swish", T["s10"], 0.4)
    s.append(P(c, "u_l", "M 262 440 C 270 560, 300 640, 320 700", C["s10"][3], GOLD, 9)); s.append(P(c, "u_r", "M 458 440 C 450 560, 420 640, 400 700", C["s10"][3] + 0.3, GOLD, 9))
    s.append(P(c, "u_u", "M 360 930 L 360 1040", C["s10"][4], CORAL, 11))
    s.append(W(c, "u_o", 720, 470, "kidneys · 2 ureters · bladder · urethra", T["s10"] + 0.8, 44))
    s.append(W(c, "u_j", 720, 550, "filters blood · urine · water balance", C["s10"][1], 42, "#7fd1ff"))
    s.append(chip("u_w", 1250, 650, "students mix these up!", CORAL, 38)); c.pop("#u_w", C["s10"][2]); c.sound("wrong", C["s10"][2], 0.3)
    s.append(W(c, "u_t1", 720, 780, '<tspan fill="#ffd23f">ureters (2)</tspan>: kidney → bladder', C["s10"][3] + 0.2, 50))
    s.append(W(c, "u_t2", 720, 880, '<tspan fill="#ff6b6b">urethra (1)</tspan>: bladder → outside', C["s10"][4] + 0.2, 50))
    hideall(c, ["#u_n", "#u_d", "#u_l", "#u_r", "#u_u", "#u_o", "#u_j", "#u_w", "#u_t1", "#u_t2"], c.end("s10"))
    # s11 reproductive
    p, _ = sys_panel(c, "p11", 10, T["s11"], c.end("s11"), ("testes · ovaries · uterine tubes · uterus · vagina", T["s11"] + 0.5), None,
                     ("makes sex cells · supports a developing baby", C["s11"][1]))
    s.append(p)
    s.append(chip("s11_n", 1200, 800, "not needed to stay alive", WHITE, 38)); c.pop("#s11_n", C["s11"][2])
    s.append(W(c, "s11_s", 1200, 920, "keeps the species going", C["s11"][3], 46, "#ff9ad5", anchor="middle"))
    hideall(c, ["#s11_n", "#s11_s"], c.end("s11"))
    # s12 two systems
    s.append(MI("s12_p", "pancreas", 220, 470, 520)); c.fade_in("#s12_p", T["s12"] + 0.2)
    s.append(txt("s12_pl", 480, 440, "pancreas", 50, WHITE, weight=900)); c.fade_in("#s12_pl", T["s12"] + 0.3)
    s.append(chip("s12_d", 380, 820, "digestive", WARM, 38)); c.pop("#s12_d", C["s12"][1]); s.append(chip("s12_e", 640, 820, "endocrine", VIOLET, 38)); c.pop("#s12_e", C["s12"][2])
    s.append(f'<g id="s12_g" opacity="0"><ellipse cx="1200" cy="620" rx="70" ry="44" fill="#f2a6c8"/><ellipse cx="1420" cy="620" rx="52" ry="70" fill="#e8b4a0"/>'
             f'<text x="1200" y="710" text-anchor="middle" font-family="Inter" font-weight="800" font-size="28" fill="#fff">ovary</text><text x="1420" y="725" text-anchor="middle" font-family="Inter" font-weight="800" font-size="28" fill="#fff">testis</text></g>'); c.fade_in("#s12_g", C["s12"][3] - 0.2)
    s.append(txt("s12_gl", 1300, 470, "gonads", 50, WHITE, weight=900)); c.fade_in("#s12_gl", C["s12"][3] - 0.1)
    s.append(chip("s12_r", 1160, 820, "reproductive", "#ff9ad5", 38)); s.append(chip("s12_e2", 1460, 820, "endocrine", VIOLET, 38))
    c.pop("#s12_r", C["s12"][3] + 0.6); c.pop("#s12_e2", C["s12"][3] + 1.6)
    s.append(W(c, "s12_t", 960, 990, "some organs belong to TWO systems", T["s12"] + 0.4, 56, GOLD, anchor="middle"))
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- vessels
def vessels(c):
    t0, t1 = chapter_span(c, "vessels")
    T, C = c.T, c.C
    s = ['<g id="g_v" opacity="0">', lab_bg("v_bg", op=1)]
    c.scene("#g_v", t0, t1); drift(c, "#v_bg", t0, t1, -80)
    s.append(MI("v_h", "heart-front", 160, 330, 300)); c.fade_in("#v_h", T["v1"] + 0.3)
    s.append(W(c, "v_rule", 960, 230, "named by DIRECTION, not oxygen", C["v1"][2], 66, GOLD, anchor="middle")); c.sound("ding", C["v1"][2] + 0.5, 0.3)
    # artery (top) and vein (bottom) tubes, neutral colors: gold = away, teal = toward
    s.append(f'<path id="v_art" d="M 470 450 L 1300 450" stroke="#c75a52" stroke-width="64" stroke-linecap="round" opacity="0"/>')
    s.append(f'<path id="v_vein" d="M 1300 700 L 470 700" stroke="#8a5a7a" stroke-width="54" stroke-linecap="round" opacity="0"/>')
    s.append(arrow("v_aa", 560, 450, 1220, 450, GOLD, 10)); s.append(arrow("v_va", 1220, 700, 560, 700, TEAL, 10, "aht"))
    c.fade_in("#v_art", T["v2"], y=0); c.draw("#v_aa", T["v2"] + 0.2, 0.9); c.sound("whoosh_real", T["v2"] + 0.2, 0.4)
    s.append(txt("v_al", 880, 390, "ARTERY: AWAY from the heart", 40, GOLD, weight=900)); c.fade_in("#v_al", T["v2"] + 0.3)
    s.append(MI("v_ax", "vascular-tunic-artery", 1420, 300, 120)); c.fade_in("#v_ax", C["v2"][1])
    s.append(txt("v_at", 1580, 400, "thick, muscular wall", 32, WHITE, anchor="start")); s.append(txt("v_ap", 1580, 445, "high pressure", 32, GOLD, anchor="start"))
    c.fade_in("#v_at", C["v2"][1] + 0.2); c.fade_in("#v_ap", C["v2"][1] + 0.6)
    c.fade_in("#v_vein", C["v2"][2], y=0); c.draw("#v_va", C["v2"][2] + 0.2, 0.9)
    s.append(txt("v_vl", 880, 790, "VEIN: TOWARD the heart", 40, TEAL, weight=900)); c.fade_in("#v_vl", C["v2"][2] + 0.3)
    s.append(MI("v_vx", "vein-crosssection", 1420, 600, 100)); c.fade_in("#v_vx", C["v2"][3])
    s.append(txt("v_vt", 1560, 690, "thinner wall", 32, WHITE, anchor="start")); s.append(txt("v_vp", 1560, 735, "lower pressure", 32, TEAL, anchor="start"))
    c.fade_in("#v_vt", C["v2"][3] + 0.2); c.fade_in("#v_vp", C["v2"][3] + 0.6)
    s.append(W(c, "v_why", 960, 880, "the heart's push is used up in the capillaries", C["v2"][3] + 2.2, 38, INK, anchor="middle"))
    # capillary bed linking them
    s.append(f'<g id="v_cap" opacity="0">' + "".join(f'<path d="M 1300 450 C {1340+i*12} {520+i*10}, {1340-i*8} {620-i*10}, 1300 700" fill="none" stroke="#ff9a9a" stroke-width="9"/>' for i in range(5)) + '</g>')
    c.fade_in("#v_cap", C["v2"][4], y=0); s.append(chip("v_cl", 1590, 580, "capillaries: exchange", GREEN, 32)); c.pop("#v_cl", C["v2"][4] + 0.3)
    hideall(c, ["#v_ax", "#v_at", "#v_ap", "#v_vx", "#v_vt", "#v_vp", "#v_why"], c.end("v2"))
    # v3 slogan + pulmonary arteries trap
    s.append(card("v3_s", 300, 940, 1320, 110, GREEN, op=0)); c.fade_in("#v3_s", T["v3"] + 0.2, y=10)
    s.append(W(c, "v3_st", 960, 1012, "arteries away · veins toward · capillaries exchange", T["v3"] + 0.3, 46, anchor="middle"))
    for x in ("#v_art", "#v_vein", "#v_aa", "#v_va", "#v_al", "#v_vl", "#v_cap", "#v_cl", "#v_rule"): c.hide(x, C["v3"][1] - 0.2)
    c.to("#v_h", C["v3"][1], "x:300,y:-20", d=0.6)
    s.append(MI("v3_lg", "healthy-lung", 1180, 300, 360)); c.fade_in("#v3_lg", C["v3"][2] - 0.2)
    s.append(f'<path id="v3_pa" d="M 620 470 C 800 380, 1000 380, 1200 470" stroke="#7a5aa8" stroke-width="44" stroke-linecap="round" fill="none" opacity="0"/>')
    s.append(arrow("v3_pr", 660, 440, 1150, 450, GOLD, 9)); c.fade_in("#v3_pa", C["v3"][2], y=0); c.draw("#v3_pr", C["v3"][2] + 0.2, 0.9)
    s.append(txt("v3_pl", 910, 330, "pulmonary arteries (pulmo = lung)", 38, WHITE, weight=900)); c.fade_in("#v3_pl", C["v3"][2] + 0.2)
    s.append(chip("v3_low", 910, 560, "LOW-oxygen blood", "#b89be8", 36)); c.pop("#v3_low", C["v3"][2] + 2.2)
    s.append(W(c, "v3_why", 910, 680, "just back from the body, going to pick up more", C["v3"][3], 38, INK, anchor="middle"))
    s.append(chip("v3_art", 910, 800, "still ARTERIES: away from the heart", GOLD, 40)); c.pop("#v3_art", C["v3"][4]); c.sound("ding", C["v3"][4], 0.35)
    hideall(c, ["#v_h", "#v3_lg", "#v3_pa", "#v3_pr", "#v3_pl", "#v3_low", "#v3_why", "#v3_art", "#v3_s", "#v3_st"], C["v3"][5])
    s.append(f'<g id="v3_cells" opacity="0">' + "".join(f'<circle cx="{700+i*130}" cy="{560+(i%2)*60}" r="44" fill="#d9705f" stroke="#f2b0a6" stroke-width="5"/><circle cx="{700+i*130}" cy="{560+(i%2)*60}" r="14" fill="#7a2f2a"/>' for i in range(5)) + '</g>')
    c.fade_in("#v3_cells", C["v3"][5] + 0.1, y=0)
    s.append(W(c, "v3_q", 960, 820, "what makes them ALIVE?", C["v3"][5] + 1.5, 64, GOLD, anchor="middle"))
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- alive
def rock(id, x, y, op=0):
    return f'<g id="{id}" opacity="{op}"><path d="M {x-150} {y} L {x-120} {y-110} L {x-30} {y-160} L {x+90} {y-130} L {x+150} {y-40} L {x+120} {y} Z" fill="#6f7686"/><path d="M {x-120} {y-110} L {x-30} {y-160} L {x+20} {y-90} Z" fill="#8c93a3"/></g>'

def alive(c):
    t0, t1 = chapter_span(c, "alive")
    T, C = c.T, c.C
    s = ['<g id="g_al" opacity="0">', lab_bg("al_bg", op=1)]
    c.scene("#g_al", t0, t1); drift(c, "#al_bg", t0, t1, -80)
    s.append(rock("al_r", 600, 640)); c.fade_in("#al_r", T["al1"] + 0.3)
    s.append(f'<g id="al_c" opacity="0"><circle cx="1320" cy="540" r="150" fill="#d9705f" stroke="#f2b0a6" stroke-width="8"/><circle cx="1320" cy="540" r="50" fill="#7a2f2a"/></g>')
    c.fade_in("#al_c", T["al1"] + 1.2)
    s.append(W(c, "al_b", 960, 800, "both made of atoms", T["al1"] + 2.4, 56, INK, anchor="middle"))
    s.append(txt("al_q", 960, 300, "only one is alive. why?", 60, GOLD, weight=900)); c.fade_in("#al_q", T["al1"] + 4.0)
    s.append(chip("al_7", 960, 950, "7 characteristics of life", GREEN, 46)); c.pop("#al_7", C["al1"][1])
    hideall(c, ["#al_r", "#al_c", "#al_b", "#al_q", "#al_7"], c.end("al1"))
    items = [("organization", T["al2"] + 0.1), ("metabolism (meta = change)", C["al2"][1]), ("responsiveness", C["al2"][2]), ("movement", C["al2"][3]),
             ("growth", T["al3"] + 0.1), ("development", C["al3"][1]), ("reproduction", C["al3"][2])]
    for i, (tx, t) in enumerate(items):
        s.append(tick_box(f"al_k{i}", 200, 270 + i * 100, tx, size=44)); tick(c, f"al_k{i}", t)
    # visuals on the right for each
    s.append(f'<g id="al_lad" opacity="0">' + "".join(f'<rect x="1300" y="{300 + i*58}" width="300" height="46" rx="12" fill="{[VIOLET,CORAL,WARM,GOLD,GREEN,TEAL][i]}" opacity=".85"/>' for i in range(6)) + '</g>')
    c.fade_in("#al_lad", T["al2"] + 0.2); c.hide("#al_lad", C["al2"][1] - 0.1)
    s.append(f'<g id="al_met" opacity="0"><text x="1450" y="420" text-anchor="middle" font-family="Kalam" font-weight="700" font-size="44" fill="{GREEN}">build: uses energy</text>'
             f'<text x="1450" y="520" text-anchor="middle" font-family="Kalam" font-weight="700" font-size="44" fill="{WARM}">break down: releases energy</text></g>')
    c.fade_in("#al_met", C["al2"][1] + 1.0); c.hide("#al_met", C["al2"][2] - 0.1)
    s.append(jimg("al_ft", "jordan-foot", 1200, 980, 0.5)); c.fade_in("#al_ft", C["al2"][2]); c.hide("#al_ft", C["al2"][3] - 0.1)
    s.append(f'<path id="al_rk" d="M 1300 990 L 1330 950 L 1360 990 Z" fill="#8c93a3" opacity="0"/>'); c.fade_in("#al_rk", C["al2"][2], y=0); c.hide("#al_rk", C["al2"][3] - 0.1)
    c.sound("gasp_female_real", C["al2"][2] + 0.8, 0.5)
    s.append(jimg("al_mv", "jordan-sprint", 1150, 960, 0.45)); c.fade_in("#al_mv", C["al2"][3]); bob(c, "#al_mv_b", C["al2"][3], c.end("al2")); c.hide("#al_mv", c.end("al2"))
    s.append(f'<g id="al_gr" opacity="0">' + "".join(f'<circle class="al_gc" cx="{1350+(i%3)*90}" cy="{460+(i//3)*90}" r="36" fill="#d9705f"/>' for i in range(6)) + '</g>')
    c.fade_in("#al_gr", T["al3"] + 0.2); c.g(f'tl.fromTo(".al_gc",{{scale:0,transformOrigin:"50% 50%"}},{{scale:1,duration:0.4,stagger:0.25,immediateRender:false}},{T["al3"]+0.2:.2f});'); c.hide("#al_gr", C["al3"][1] - 0.1)
    s.append(fiber("al_df", 1200, 500, 520, 70)); c.fade_in("#al_df", C["al3"][1]); c.hide("#al_df", C["al3"][2] - 0.1)
    s.append(f'<g id="al_rp" opacity="0"><circle cx="1400" cy="520" r="70" fill="#d9705f"/><circle cx="1560" cy="520" r="70" fill="#d9705f"/></g>')
    c.fade_in("#al_rp", C["al3"][2]); c.g(f'tl.fromTo("#al_rp circle:last-child",{{x:-160}},{{x:0,duration:0.8,ease:"power2.out",immediateRender:false}},{C["al3"][2]+0.2:.2f});')
    s.append(rock("al_r2", 1480, 900)); c.fade_in("#al_r2", C["al3"][3]); s.append(txt("al_none", 1480, 980, "none of this", 40, CORAL, weight=900)); c.fade_in("#al_none", C["al3"][3] + 0.2)
    hideall(c, [f"#al_k{i}" for i in range(7)] + ["#al_rp", "#al_r2", "#al_none"], c.end("al3"))
    # needs
    s.append(W(c, "al_nd", 960, 230, "what her cells need from outside", T["al4"] + 0.2, 60, GOLD, anchor="middle"))
    needs = [("oxygen", C["al4"][1], BLUE), ("nutrients", C["al4"][2], WARM), ("water", C["al4"][3], TEAL), ("narrow temperature", T["al5"] + 0.1, CORAL), ("air pressure", C["al5"][2], VIOLET)]
    for i, (tx, t, col) in enumerate(needs):
        x = 230 + i * 365
        s.append(card(f"al_n{i}", x - 160, 320, 320, 420, col, op=0)); c.fade_in(f"#al_n{i}", t, y=20); c.sound("pop", t, 0.3)
        s.append(txt(f"al_nt{i}", x, 390, tx, 34 if len(tx) < 12 else 28, col, weight=900)); c.fade_in(f"#al_nt{i}", t + 0.1)
    s.append(f'<g id="al_o" opacity="0"><circle cx="230" cy="520" r="60" fill="{BLUE}" opacity=".85"/><text x="230" y="540" text-anchor="middle" font-family="Inter" font-weight="900" font-size="56" fill="#08203f">O₂</text>'
             f'<text x="230" y="650" text-anchor="middle" font-family="Kalam" font-weight="700" font-size="30" fill="#fff">energy from food</text><text x="230" y="700" text-anchor="middle" font-family="Kalam" font-weight="700" font-size="28" fill="{CORAL}">brain fails first</text></g>')
    c.fade_in("#al_o", C["al4"][1] + 0.4)
    s.append(f'<g id="al_nu" opacity="0"><circle cx="595" cy="520" r="54" fill="#e05a4a"/><path d="M 595 466 q 10 -30 30 -36" stroke="#5a3a1a" stroke-width="6" fill="none"/>'
             f'<text x="595" y="650" text-anchor="middle" font-family="Kalam" font-weight="700" font-size="28" fill="#fff">energy · building</text><text x="595" y="695" text-anchor="middle" font-family="Kalam" font-weight="700" font-size="28" fill="#fff">· control</text></g>')
    c.fade_in("#al_nu", C["al4"][2] + 0.4)
    s.append(jimg("al_dr", "jordan-drink", 905, 720, 0.24)); c.fade_in("#al_dr", C["al4"][3] + 0.3); c.sound("water_pour_real", C["al4"][3] + 0.5, 0.35)
    s.append(MI("al_th", "thermometer", 1240, 430, 160)); c.fade_in("#al_th", T["al5"] + 0.4)
    s.append(txt("al_tt", 1325, 700, "too far: shape lost", 26, CORAL, weight=800)); c.fade_in("#al_tt", C["al5"][1])
    s.append(f'<g id="al_mt" opacity="0"><path d="M 1570 700 L 1680 470 L 1790 700 Z" fill="#8c93a3"/><path d="M 1650 530 L 1680 470 L 1710 530 Z" fill="#fff"/>'
             + "".join(f'<circle cx="{1600+i*40}" cy="{650 - (i%2)*30}" r="9" fill="{BLUE}"/>' for i in range(5)) + '</g>')
    c.fade_in("#al_mt", C["al5"][3] - 0.2)
    s.append(txt("al_lp", 1680, 730, "lower pressure", 26, VIOLET, weight=900)); c.fade_in("#al_lp", C["al5"][3])
    s.append(W(c, "al_pr", 960, 880, "breathing muscles lower lung pressure → air flows in", C["al5"][2] + 0.6, 40, INK, anchor="middle"))
    s.append(W(c, "al_mtt", 960, 960, "high mountain: less oxygen per breath", C["al5"][3], 40, VIOLET, anchor="middle"))
    hideall(c, ["#al_nd", "#al_o", "#al_nu", "#al_dr", "#al_th", "#al_tt", "#al_mt", "#al_lp", "#al_pr", "#al_mtt"] + [f"#al_n{i}" for i in range(5)] + [f"#al_nt{i}" for i in range(5)], c.end("al5"))
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- normal ranges and teamwork
def normal(c):
    t0, t1 = chapter_span(c, "normal")
    T, C = c.T, c.C
    s = ['<g id="g_nm" opacity="0">', lab_bg("nm_bg", op=1)]
    c.scene("#g_nm", t0, t1); drift(c, "#nm_bg", t0, t1, -80)
    # n1 thermometer with a normal band
    s.append(f'<g id="n1_th" opacity="0"><rect x="300" y="220" width="90" height="640" rx="45" fill="#0d1d38" stroke="{INK}" stroke-width="6"/>'
             f'<rect id="n1_band" x="270" y="470" width="150" height="120" rx="12" fill="{GREEN}" opacity=".25"/><circle cx="345" cy="880" r="80" fill="{RED}"/>'
             f'<rect id="n1_mer" x="325" y="540" width="40" height="340" fill="{RED}"/></g>')
    c.fade_in("#n1_th", C["n1"][1] - 0.2)
    s.append(chip("n1_b", 650, 860, "before", INK, 34)); c.pop("#n1_b", C["n1"][1])
    c.g(f'tl.fromTo("#n1_mer",{{attr:{{y:540,height:340}}}},{{attr:{{y:505,height:375}},duration:0.9,ease:"power2.out",immediateRender:false}},{C["n1"][2]:.2f});')
    s.append(chip("n1_a", 650, 760, "after: up a little", CORAL, 34)); c.pop("#n1_a", C["n1"][2])
    c.g(f'tl.to("#n1_mer",{{attr:{{y:530,height:350}},duration:2.0,ease:"sine.inOut"}},{C["n1"][2]+1.6:.2f});')
    s.append(txt("n1_37", 470, 548, "37 °C", 44, GREEN, anchor="start", weight=900)); c.fade_in("#n1_37", C["n1"][3])
    s.append(W(c, "n1_nr", 900, 380, "normal range: the band found in healthy people", C["n1"][3] + 0.4, 42, GREEN))
    s.append(W(c, "n1_f", 900, 460, "about 98.6 °F, many run a little lower", C["n1"][3] + 2.5, 40, INK))
    for i, (g_, col, v) in enumerate([("water", TEAL, .55), ("sodium", GOLD, .48), ("oxygen", BLUE, .6)]):
        y = 600 + i * 110
        s.append(f'<g id="n1_g{i}" opacity="0"><text x="1000" y="{y+16}" font-family="Inter" font-weight="900" font-size="34" fill="{col}">{g_}</text>'
                 f'<rect x="1200" y="{y-16}" width="560" height="40" rx="20" fill="#0d1d38" stroke="{DIM}" stroke-width="3"/><rect x="{1200+560*0.38:.0f}" y="{y-16}" width="{560*0.26:.0f}" height="40" fill="{GREEN}" opacity=".25"/>'
                 f'<circle cx="{1200+560*v:.0f}" cy="{y+4}" r="16" fill="{col}"/></g>')
        c.fade_in(f"#n1_g{i}", C["n1"][4] + i * 0.4, y=10); c.sound("tick", C["n1"][4] + i * 0.4, 0.25)
    hideall(c, ["#n1_th", "#n1_b", "#n1_a", "#n1_37", "#n1_nr", "#n1_f"] + [f"#n1_g{i}" for i in range(3)], c.end("n1"))
    # n2 the push back
    s.append(card("n2_c1", 300, 230, 560, 130, GOLD, op=0)); s.append(card("n2_c2", 1060, 230, 560, 130, GREEN, op=0))
    s.append(W(c, "n2_t1", 580, 310, "change detected", C["n2"][1], 48, GOLD, anchor="middle")); c.fade_in("#n2_c1", C["n2"][1] - 0.1, y=10)
    s.append(arrow("n2_ar", 880, 295, 1040, 295, WHITE, 8, "ahw")); c.draw("#n2_ar", C["n2"][1] + 1.0, 0.4)
    s.append(W(c, "n2_t2", 1340, 310, "response pushes it back", C["n2"][1] + 1.3, 44, GREEN, anchor="middle")); c.fade_in("#n2_c2", C["n2"][1] + 1.2, y=10)
    s.append(jimg("n2_j", "jordan-bent", 500, 985, 0.5)); c.fade_in("#n2_j", C["n2"][2] - 0.3)
    s.append(drops("n2_sw", 640, 620, 6)); c.set("#n2_sw", C["n2"][2], "opacity:1"); fall(c, ".n2_sw_d", C["n2"][2], 1.0, 80, 3)
    s.append(heat_waves("n2_hw", 720, 560, n=4)); c.set("#n2_hw", C["n2"][3], "opacity:1"); rise(c, "#n2_hw", C["n2"][3], 1.2, 2)
    s.append(W(c, "n2_ev", 640, 1045, "sweat evaporates → heat leaves", C["n2"][3] + 0.3, 40, WARM, anchor="middle"))
    s.append(f'<rect id="n2_cold" x="1000" y="420" width="840" height="660" rx="30" fill="#2a5a9a" opacity="0"/>'); c.to("#n2_cold", C["n2"][4], "opacity:.35", d=0.4)
    s.append(jimg("n2_sh", "jordan-shiver", 1340, 985, 0.5)); c.fade_in("#n2_sh", C["n2"][4])
    c.g(f'tl.fromTo("#n2_sh_b",{{x:-4}},{{x:4,duration:0.06,yoyo:true,repeat:40,ease:"none",immediateRender:false}},{C["n2"][4]+0.4:.2f});')
    s.append(W(c, "n2_sv", 1420, 1045, "shivering → heat made", C["n2"][4] + 0.5, 40, BLUE, anchor="middle"))
    s.append(chip("n2_fb", 960, 160, "feedback loop: later in Foundations", TEAL, 34)); c.pop("#n2_fb", C["n2"][5] + 2.5)
    s.append(txt("n2_ill", 960, 400, "drifts out of range → often illness", 36, CORAL, weight=800)); c.fade_in("#n2_ill", C["n2"][5])
    hideall(c, ["#n2_c1", "#n2_c2", "#n2_t1", "#n2_t2", "#n2_ar", "#n2_j", "#n2_sw", "#n2_hw", "#n2_ev", "#n2_cold", "#n2_sh", "#n2_sv", "#n2_fb", "#n2_ill"], c.end("n2"))
    # n3 teamwork web around the thigh muscle
    s.append(f'<g id="n3_m" opacity="0"><g transform="rotate(-90 960 560)">{medart.image("muscle-1", OUT, 900, 340, 120)}</g></g>'); c.fade_in("#n3_m", T["n3"] + 0.3)
    s.append(txt("n3_ml", 960, 680, "her thigh muscle", 36, WHITE, weight=900)); c.fade_in("#n3_ml", C["n3"][1])
    s.append(txt("n3_t", 960, 230, "no system works alone", 56, GOLD, weight=900)); c.fade_in("#n3_t", T["n3"] + 0.2)
    web = [("n3_lu", "healthy-lung", 220, 280, 200, "oxygen in", BLUE, 2, (430, 400, 760, 520)), ("n3_he", "heart-front", 220, 640, 180, "delivery", CORAL, 3, (420, 760, 760, 600)),
           ("n3_di", "digestive-system", 1600, 260, 110, "fuel", WARM, 4, (1590, 450, 1160, 530)), ("n3_ki", "kidney-1", 1620, 660, 120, "wastes out", "#7fd1ff", 5, (1170, 600, 1590, 760))]
    for id_, art, x, y, w, lab, col, cue, (ax, ay, bx, by) in web:
        s.append(MI(id_, art, x, y, w)); c.fade_in(f"#{id_}", C["n3"][cue])
        s.append(arrow(f"{id_}_a", ax, ay, bx, by, col, 8)); c.draw(f"#{id_}_a", C["n3"][cue] + 0.3, 0.6)
        s.append(chip(f"{id_}_l", (ax + bx) / 2, (ay + by) / 2 - 30, lab, col, 30)); c.pop(f"#{id_}_l", C["n3"][cue] + 0.6); c.sound("pop", C["n3"][cue] + 0.6, 0.3)
    s.append(arrow("n3_co2", 1100, 520, 440, 300, DIM, 6)); c.draw("#n3_co2", C["n3"][5] + 1.0, 0.6)
    hideall(c, ["#n3_m", "#n3_ml", "#n3_t", "#n3_co2"] + [f"#{w[0]}{x}" for w in web for x in ("", "_a", "_l")], c.end("n3"))
    # n4 kidney failure chain
    chain = [("kidneys stop removing water + wastes", T["n4"] + 1.5, CORAL), ("water builds up: ankles swell, fluid in lungs", C["n4"][1], WARM),
             ("lungs move less oxygen into blood", C["n4"][2], BLUE), ("heart works harder", C["n4"][3], RED)]
    s.append(MI("n4_k", "kidney-1", 150, 260, 120)); c.fade_in("#n4_k", T["n4"] + 1.2)
    s.append(P(c, "n4_kx", "M 140 260 L 290 470", T["n4"] + 1.8, CORAL, 10)); c.sound("wrong", T["n4"] + 1.8, 0.35)
    for i, (tx, t, col) in enumerate(chain):
        y = 290 + i * 160
        s.append(card(f"n4_c{i}", 360, y - 70, 1000, 110, col, op=0)); c.fade_in(f"#n4_c{i}", t, y=10)
        s.append(W(c, f"n4_t{i}", 390, y + 5, tx, t + 0.2, 42))
        if i: s.append(arrow(f"n4_a{i}", 860, y - 88, 860, y - 72, col, 8)); c.draw(f"#n4_a{i}", t - 0.1, 0.3)
    s.append(MI("n4_oe", "oedema-legs", 1450, 360, 330)); c.fade_in("#n4_oe", C["n4"][1] + 0.6)
    s.append(chip("n4_3", 1610, 900, "1 organ → 3 systems", GOLD, 40)); c.pop("#n4_3", C["n4"][4]); c.sound("ding", C["n4"][4], 0.35)
    s.append(txt("n4_ask", 960, 1050, "ask: what does it depend on? what depends on it?", 38, TEAL, weight=800)); c.fade_in("#n4_ask", C["n4"][5])
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- recap
def recap(c):
    t0, t1 = chapter_span(c, "recap")
    T, C = c.T, c.C
    s = ['<g id="g_rc" opacity="0">', lab_bg("rc_bg", op=1)]
    c.scene("#g_rc", t0, t1)
    panels = [(80, 150, 860, 280, "structure → function", GOLD, 1), (980, 150, 860, 280, "6 levels", TEAL, 2), (80, 470, 860, 280, "11 systems, all linked", CORAL, 3),
              (980, 470, 860, 280, "arteries away · veins toward", GREEN, 4), (530, 790, 860, 230, "normal ranges keep her alive", VIOLET, 5)]
    for i, (x, y, w, h, tt, col, cue) in enumerate(panels):
        s.append(card(f"rc_p{i}", x, y, w, h, col, op=0)); c.fade_in(f"#rc_p{i}", C["r1"][cue] - 0.1, y=20); c.sound("swish", C["r1"][cue], 0.3)
        s.append(W(c, f"rc_t{i}", x + w / 2, y + 70, tt, C["r1"][cue] + 0.1, 46, col, anchor="middle"))
    s.append(f'<g id="rc_h" opacity="0">{medart.image("heart-front", OUT, 140, 250, 120)}</g>'); c.fade_in("#rc_h", C["r1"][1] + 0.6)
    s.append(W(c, "rc_hs", 300, 340, "anatomy: what it looks like", C["r1"][1] + 0.6, 34, WHITE))
    s.append(W(c, "rc_hp", 300, 400, "physiology: how it works", C["r1"][1] + 1.6, 34, WHITE))
    for i in range(6):
        s.append(f'<rect id="rc_l{i}" x="{1020 + i*135}" y="300" width="120" height="90" rx="14" fill="{[TEAL,GREEN,GOLD,WARM,CORAL,VIOLET][i]}" opacity="0"/>')
        s.append(txt(f"rc_lt{i}", 1080 + i * 135, 355, ["chemical", "cell", "tissue", "organ", "organ sys.", "organism"][i], 19, "#081428", weight=900))
        c.fade_in(f"#rc_l{i}", C["r1"][2] + 0.6 + i * 0.4, y=-10); c.fade_in(f"#rc_lt{i}", C["r1"][2] + 0.6 + i * 0.4, y=-10)
    for i in range(11):
        s.append(f'<g id="rc_s{i}" opacity="0"><g transform="translate({120 + i*72} 600)">{sys_icon(i, 0, 0, 62)}</g></g>'); c.fade_in(f"#rc_s{i}", C["r1"][3] + 0.3 + i * 0.12, y=10)
    s.append(arrow("rc_a1", 1100, 650, 1400, 650, GOLD, 9)); s.append(arrow("rc_a2", 1720, 710, 1420, 710, TEAL, 9, "aht"))
    c.draw("#rc_a1", C["r1"][4] + 0.4, 0.6); c.draw("#rc_a2", C["r1"][4] + 1.0, 0.6)
    s.append(f'<g id="rc_vh" opacity="0">{heart_icon("rc_hh", 1040, 690, 1.2, RED, 1)}</g>'); c.fade_in("#rc_vh", C["r1"][4] + 0.2)
    s.append(txt("rc_cx", 1650, 615, "capillaries exchange", 26, GREEN, weight=900)); c.fade_in("#rc_cx", C["r1"][4] + 1.6)
    s.append(f'<g id="rc_tb" opacity="0"><rect x="600" y="900" width="680" height="40" rx="20" fill="#0d1d38" stroke="{DIM}" stroke-width="3"/><rect x="840" y="900" width="200" height="40" fill="{GREEN}" opacity=".35"/><circle cx="930" cy="920" r="18" fill="{CORAL}"/></g>')
    c.fade_in("#rc_tb", C["r1"][5] + 0.5)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- practice
def practice(c):
    t0, t1 = chapter_span(c, "practice")
    s = ['<g id="g_pc" opacity="0">', lab_bg("pc_bg", op=1)]
    c.scene("#g_pc", t0, t1)
    s.append(problem(c, "pb1", "p1q", "p1a", 1, ["Put in order, smallest to largest:", "organ · cell · organ system · molecule · tissue"],
                     [('<tspan fill="#3fe07a">molecule → cell → tissue → organ → organ system</tspan>', 0), ("then the organism on top", 1), ("an organ is built FROM tissues", 3)],
                     ("swapping tissue and organ", 2)))
    s.append(problem(c, "pb2", "p2q", "p2a", 2, ["The pulmonary arteries carry low-oxygen blood", "from the heart to the lungs.", '"They should really be called veins." Right or wrong?'],
                     [('<tspan fill="#ff6b6b">wrong</tspan>', 0), ("named by direction, not oxygen", 1), ("they carry blood AWAY from the heart: arteries", 2)],
                     ("artery means oxygen-rich", 3)))
    s.append(problem(c, "pb3", "p3q", "p3a", 3, ["The kidney is fine, but a stone is stuck in the tube", "from that kidney to the bladder.", "Which tube is blocked?"],
                     [('<tspan fill="#3fe07a">a ureter</tspan>', 0), ("two of them, one per kidney, down to the bladder", 1), ("two ureters, one urethra", 3)],
                     ("urethra: bladder to outside", 2)))
    s.append('</g>')
    return "".join(s)

def outro(c):
    t0, t1 = chapter_span(c, "outro")
    T, C = c.T, c.C
    fm, fg = track("tr3", op=1)
    s = ['<g id="g_ou" opacity="0">', fm]
    c.scene("#g_ou", t0, t1 + 1)
    s.append(f'<g id="ou_fin"><rect x="1180" y="620" width="40" height="460" fill="#f4f6fb"/>' + "".join(f'<rect x="1180" y="{620+k*40}" width="20" height="20" fill="#111"/><rect x="1200" y="{640+k*40}" width="20" height="20" fill="#111"/>' for k in range(11)) + '</g>')
    c.set("#tr3_mk", t0, "opacity:0")
    s.append(jimg("ou_j", "jordan-hips", 1320, 1040, 0.58, op=1))
    s.append('<rect x="120" y="150" width="1040" height="830" rx="40" fill="#081428" opacity=".72"/>')
    c.sound("crowd_cheer_real", T["end"], 0.45); c.sound("crowd_cheer_real", T["end"] + 4, 0.3)
    s.append(fg + '</g>')
    s.append(W(c, "ou_1", 640, 260, 'the big picture of A&amp;P ✓', T["end"] + 0.2, 60, GREEN, anchor="middle"))
    s.append(f'<text id="ou_site" x="640" y="470" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="{TEAL}" opacity="0">levlprep.com</text>')
    c.fade_in("#ou_site", C["end"][1], y=20); c.sound("shimmer", C["end"][1], 0.5)
    s.append(L(c, "ou_free", 640, 550, "free practice questions", C["end"][1] + 0.3, 40, WHITE))
    s.append(card("ou_next", 260, 640, 760, 300, GOLD, op=0)); c.fade_in("#ou_next", C["end"][2], y=20)
    s.append(L(c, "ou_nl", 640, 700, "NEXT", C["end"][2] + 0.1, 34, GOLD))
    s.append(W(c, "ou_nt", 640, 790, 'the language of A&amp;P', C["end"][2] + 0.3, 62, anchor="middle"))
    s.append(W(c, "ou_nt2", 640, 880, 'word parts + directional terms', C["end"][2] + 1.6, 40, INK, anchor="middle"))
    s.append("</g>")
    return "".join(s)

CHAPTER_FUNCS = [intro, anatphys, levels, systems1, systems2, vessels, alive, normal, recap, practice, outro]

def build_spec():
    def compose(c):
        os_ = __import__("os"); os_.makedirs(OUT, exist_ok=True)
        out = "".join(f(c) for f in CHAPTER_FUNCS)
        ch = {x["id"]: x["t"] for x in c.CH}
        c.spec["music"] = [(0, c.C["hook"][5], 0.10), (c.C["hook"][5], ch["anatphys"], 0.06), (ch["levels"], c.C["l1"][3], 0.08),
                           (ch["recap"], ch["practice"], 0.06), (ch["outro"], c.TOTAL, 0.10)]
        return out
    return dict(css="#hdr .ch div{background:rgba(5,12,26,.75);padding:0 14px;border-radius:10px}", id=S.ID, course_tag="A&amp;P · FOUNDATIONS 1", chapters=S.CHAPTERS, compose=compose, tail=6.0,
                images=[f"{CHD}/{n}.png" for n in IMGS])

SPEC = build_spec()
