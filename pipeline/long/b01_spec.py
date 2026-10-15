"""AP Bio 01: Properties of Water and Hydrogen Bonding. Visual compose for engine_long (quality v2).
Story frame: Jordan (character library, jordan-*) on a long hot run; her sweat is the payoff of the hook.
Tools: Servier Medical Art via medart (skin with sweat gland, pot, glass, salt, fish, DNA, protein; credit in the description),
RDKit 2D molecules via chem.mol2d (glucose, hexane), a 3D water molecule via chem.mol3d(in_svg=True),
real sounds (run steps, breathing, water, bubbling, splash, glass, pen), one Manim graph (overlaid after render, see manim_b01.py).
Water molecules are our own soft shaded SVG (gradient spheres) so every part can move on its spoken word.
"""
import sys, math, random, json
sys.path.insert(0, "/home/claude/lp"); sys.path.insert(0, "/home/claude/lp/long")
import b01_script as S
import medart, chem
from engine_long import TEAL, GOLD, CORAL, INK, GREEN, VIOLET, WHITE
from n01_spec import W, L, P, card, chip, hideall, chapter_span, qcheck, problem
from a01_spec import jimg, IMGS, txt, bob, drops, fall, heat_waves, rise, arrow, tick_box, tick, drift, steps

DIM = "#4d6488"; RED = "#ff5a5a"; BLUE = "#5aa9ff"; WARM = "#ffb35c"; ICE = "#cfefff"
CHD = "/home/claude/lp/chars"
OUT = f"/home/claude/lp/out/{S.ID}"
NEG = "#ff7a8a"; POS = "#7ab8ff"   # partial charge halos: negative warm red, positive blue (electrostatic map convention)

def MI(id, name, x, y, w, op=0, extra=""):
    return f'<g id="{id}" opacity="{op}" {extra}>{medart.image(name, OUT, x, y, w)}</g>'

def MIN(id, name, x, y, w, op=0):
    return f'<g id="{id}" opacity="{op}">{medart.inline(name, OUT, id + "i", x, y, w)}</g>'

# ------------------------------------------------------------- shared art
GRAD = f'''<defs>
<radialGradient id="gO" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffb0a8"/><stop offset=".45" stop-color="#f0544f"/><stop offset="1" stop-color="#9e2230"/></radialGradient>
<radialGradient id="gH" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#dfe7f2"/><stop offset="1" stop-color="#8e9cb3"/></radialGradient>
<radialGradient id="gC" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#8a8f99"/><stop offset=".55" stop-color="#3b3f48"/><stop offset="1" stop-color="#15171c"/></radialGradient>
<radialGradient id="gNa" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#d9c8ff"/><stop offset=".55" stop-color="#8b6cf0"/><stop offset="1" stop-color="#4a2fa8"/></radialGradient>
<radialGradient id="gCl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#d6ffc8"/><stop offset=".55" stop-color="#4fcf6a"/><stop offset="1" stop-color="#1d7a35"/></radialGradient>
<radialGradient id="gNuc" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffd0c4"/><stop offset="1" stop-color="#c2465a"/></radialGradient>
<radialGradient id="gNeu" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#e8edf5"/><stop offset="1" stop-color="#7d8798"/></radialGradient>
<radialGradient id="gCloud" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5fd8ff" stop-opacity=".0"/><stop offset=".55" stop-color="#5fd8ff" stop-opacity=".22"/><stop offset="1" stop-color="#5fd8ff" stop-opacity="0"/></radialGradient>
<radialGradient id="gNeg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{NEG}" stop-opacity=".75"/><stop offset="1" stop-color="{NEG}" stop-opacity="0"/></radialGradient>
<radialGradient id="gPos" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{POS}" stop-opacity=".8"/><stop offset="1" stop-color="{POS}" stop-opacity="0"/></radialGradient>
<radialGradient id="gFast" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{GOLD}" stop-opacity=".9"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
<linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb6e8" stop-opacity=".85"/><stop offset="1" stop-color="#1b4f8f" stop-opacity=".95"/></linearGradient>
<linearGradient id="gGlassWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".08"/><stop offset="1" stop-color="#ffffff" stop-opacity=".3"/></linearGradient>
<linearGradient id="gBark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3b26"/><stop offset=".5" stop-color="#8a5d3b"/><stop offset="1" stop-color="#4a3020"/></linearGradient>
<radialGradient id="gLeaf" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#8fe08a"/><stop offset="1" stop-color="#2f8a44"/></radialGradient>
<linearGradient id="gIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fcff" stop-opacity=".95"/><stop offset="1" stop-color="#9fd8f2" stop-opacity=".8"/></linearGradient>
<linearGradient id="gOil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#e0a52a"/></linearGradient>
<linearGradient id="gPH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".25" stop-color="#ffb35c"/><stop offset=".5" stop-color="#3fe07a"/><stop offset=".75" stop-color="#5aa9ff"/><stop offset="1" stop-color="#9b7bff"/></linearGradient>
</defs>'''

HA = math.radians(104.5 / 2)
def hpos(rot=0, d=48):
    """positions of the two H atoms relative to O for a molecule rotated rot degrees (0 = Hs pointing down)"""
    out = []
    for sg in (-1, 1):
        a = math.radians(90 + rot) + sg * HA
        out.append((d * math.cos(a), d * math.sin(a)))
    return out

def mol(id, cx, cy, s=1.0, rot=0, op=1, charges=False, halo=False):
    """soft shaded water molecule. Parts: {id}_O, {id}_H1, {id}_H2, optional {id}_dm, {id}_dp1, {id}_dp2 (charges), halos {id}_hn/{id}_hp1/{id}_hp2"""
    (x1, y1), (x2, y2) = hpos(rot)
    p = [f'<g id="{id}" opacity="{op}"><g transform="translate({cx:.1f} {cy:.1f}) scale({s})">']
    if halo:
        p.append(f'<circle id="{id}_hn" cx="0" cy="0" r="62" fill="url(#gNeg)" opacity="0"/>'
                 f'<circle id="{id}_hp1" cx="{x1:.1f}" cy="{y1:.1f}" r="40" fill="url(#gPos)" opacity="0"/><circle id="{id}_hp2" cx="{x2:.1f}" cy="{y2:.1f}" r="40" fill="url(#gPos)" opacity="0"/>')
    p.append(f'<circle id="{id}_H1" cx="{x1:.1f}" cy="{y1:.1f}" r="19" fill="url(#gH)"/><circle id="{id}_H2" cx="{x2:.1f}" cy="{y2:.1f}" r="19" fill="url(#gH)"/>'
             f'<circle id="{id}_O" cx="0" cy="0" r="31" fill="url(#gO)"/>')
    if charges:
        a = math.radians(rot - 90)
        p.append(f'<text id="{id}_dm" x="{58*math.cos(a):.0f}" y="{58*math.sin(a)+12:.0f}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="{NEG}" opacity="0">δ−</text>')
        for i, (hx, hy) in enumerate(((x1, y1), (x2, y2))):
            p.append(f'<text id="{id}_dp{i+1}" x="{hx*1.75:.0f}" y="{hy*1.75+12:.0f}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="{POS}" opacity="0">δ+</text>')
    p.append('</g></g>')
    return "".join(p)

def hb(id, xa, ya, xb, yb, op=0, color=WHITE, w=4):
    """hydrogen bond: dashed line"""
    return f'<line id="{id}" x1="{xa:.1f}" y1="{ya:.1f}" x2="{xb:.1f}" y2="{yb:.1f}" stroke="{color}" stroke-width="{w}" stroke-dasharray="9 8" stroke-linecap="round" opacity="{op}"/>'

def water_bg(id, op=0, seed=3, tint="#0b2a4e"):
    """underwater backdrop for molecule chapters: deep blue, soft light rays, slow bubbles (far), vignette"""
    R = random.Random(seed)
    s = [f'<g id="{id}" opacity="{op}"><rect x="-1600" y="-1000" width="5120" height="3080" fill="{tint}"/>',
         f'<g filter="url(#blur14)" opacity=".5">'] + [f'<path d="M {300+i*380} -100 L {420+i*380} -100 L {120+i*380} 1200 L {40+i*380} 1200 Z" fill="#5fc8ff" opacity=".10"/>' for i in range(5)] + ['</g>']
    s.append(f'<g id="{id}_bub" filter="url(#blur6)">' + "".join(f'<circle cx="{R.uniform(0,1920):.0f}" cy="{R.uniform(100,1100):.0f}" r="{R.uniform(4,12):.0f}" fill="#9fe3ff" opacity=".22"/>' for _ in range(40)) + '</g>')
    s.append(f'<radialGradient id="{id}_vg" cx="50%" cy="50%" r="72%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>'
             f'<rect x="-420" y="-300" width="2760" height="1680" fill="url(#{id}_vg)"/></g>')
    return "".join(s)

def bubbles_up(c, sel, t0, t1, dy=-160):
    c.g(f'tl.fromTo("{sel}",{{y:0}},{{y:{dy},duration:{max(1,t1-t0):.2f},ease:"none",immediateRender:false}},{t0:.2f});')

def jiggle(c, ids, t0, t1, amp=8, per=0.5, seed=1):
    """random small motion of molecules (thermal motion), each on its own rhythm"""
    R = random.Random(seed)
    for id in ids:
        p = per * R.uniform(0.7, 1.3); n = max(1, int((t1 - t0) / p))
        c.g(f'tl.fromTo("#{id}",{{x:0,y:0}},{{x:{R.uniform(-amp,amp):.1f},y:{R.uniform(-amp,amp):.1f},duration:{p/2:.2f},yoyo:true,repeat:{2*n-1},ease:"sine.inOut",immediateRender:false}},{t0 + R.uniform(0,0.2):.2f});')

def bigdrops(id, x, y, n=4, seed=1, op=0):
    R = random.Random(seed); s = [f'<g id="{id}" opacity="{op}">']
    for i in range(n):
        xx, yy = x + R.uniform(-50, 50), y + R.uniform(-40, 40)
        s.append(f'<path class="{id}_d" d="M {xx:.0f} {yy-24:.0f} Q {xx+15:.0f} {yy:.0f} {xx:.0f} {yy+10:.0f} Q {xx-15:.0f} {yy:.0f} {xx:.0f} {yy-24:.0f} Z" fill="#e6f8ff" stroke="#5fb4dc" stroke-width="3"/>')
    return "".join(s) + "</g>"

def hot_road(id, op=0):
    """park road on a hot afternoon: hazy skyline and trees (far, blurred), sun glare, asphalt with scrolling dashes, heat shimmer, vignette"""
    R = random.Random(11)
    far = [f'<g id="{id}" opacity="{op}"><g id="{id}_far"><g filter="url(#blur6)">',
           f'<linearGradient id="{id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7b955"/><stop offset=".5" stop-color="#f6d58a"/><stop offset="1" stop-color="#e7c08a"/></linearGradient>',
           f'<rect x="-300" y="-100" width="2520" height="760" fill="url(#{id}_sky)"/>',
           f'<circle cx="1620" cy="120" r="260" fill="#fff4c8" opacity=".55"/><circle cx="1620" cy="120" r="110" fill="#fffbe8"/>']
    x = -300
    while x < 2220:
        w = R.uniform(90, 200); h = R.uniform(140, 330)
        far.append(f'<rect x="{x:.0f}" y="{560-h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="#c89a72" opacity=".55"/>'); x += w + R.uniform(10, 40)
    for i in range(16):
        tx = -250 + i * 160 + R.uniform(-30, 30)
        far.append(f'<ellipse cx="{tx:.0f}" cy="{540 + R.uniform(-20,20):.0f}" rx="{R.uniform(80,120):.0f}" ry="{R.uniform(70,100):.0f}" fill="{R.choice(["#6f9a4a","#5f8a3e","#7aa856"])}"/>')
    far.append('</g></g>')
    mid = [f'<g id="{id}_mid"><rect x="-300" y="590" width="2520" height="70" fill="#86b25a"/>',
           f'<path d="M -300 650 L 2220 640 L 2220 1180 L -300 1180 Z" fill="#5b5652"/>',
           f'<rect x="-300" y="640" width="2520" height="14" fill="#c9c2b6"/>',
           f'<g id="{id}_dash">' + "".join(f'<rect x="{-300 + k*260}" y="900" width="120" height="14" rx="4" fill="#f3e9c8" opacity=".75"/>' for k in range(16)) + '</g>',
           f'<g id="{id}_shim" opacity=".35" filter="url(#blur6)">' + "".join(f'<path d="M {k*240} 700 q 30 -14 60 0 t 60 0 t 60 0" fill="none" stroke="#fff3d0" stroke-width="5"/>' for k in range(9)) + '</g>',
           '</g>']
    fg = (f'<g id="{id}_fg"><radialGradient id="{id}_vg" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1200" stop-opacity=".55"/></radialGradient>'
          f'<rect x="-300" y="-200" width="2520" height="1480" fill="url(#{id}_vg)"/></g>')
    return "".join(far) + "".join(mid), fg + "</g>"

def road_motion(c, id, t0, t1):
    n = max(1, int((t1 - t0) / 0.5))
    c.g(f'tl.fromTo("#{id}_dash",{{x:0}},{{x:-520,duration:0.5,ease:"none",repeat:{n-1},immediateRender:false}},{t0:.2f});')
    c.g(f'tl.fromTo("#{id}_far",{{x:0}},{{x:-140,duration:{t1-t0:.2f},ease:"none",immediateRender:false}},{t0:.2f});')
    c.g(f'tl.fromTo("#{id}_shim",{{x:0}},{{x:-120,duration:{t1-t0:.2f},ease:"none",immediateRender:false}},{t0:.2f});')

def pond(id, op=0, winter=False):
    """pond: blurred far shore and trees, water surface with ripples and lily pads (mid), reeds in the dark foreground"""
    R = random.Random(5)
    sky = ("#bcd6ea", "#e6eef5") if winter else ("#8fc7ef", "#d9f0ff")
    s = [f'<g id="{id}" opacity="{op}"><g filter="url(#blur6)">',
         f'<linearGradient id="{id}_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky[0]}"/><stop offset="1" stop-color="{sky[1]}"/></linearGradient>',
         f'<rect x="-300" y="-200" width="2520" height="760" fill="url(#{id}_sky)"/>']
    for i in range(18):
        tx = -260 + i * 140 + R.uniform(-30, 30)
        col = R.choice(["#9fb0bd", "#b7c4cf"]) if winter else R.choice(["#4f8a3e", "#5f9a4a", "#3f7a36"])
        s.append(f'<ellipse cx="{tx:.0f}" cy="{470 + R.uniform(-30,30):.0f}" rx="{R.uniform(70,110):.0f}" ry="{R.uniform(90,140):.0f}" fill="{col}"/>')
    s.append(f'<rect x="-300" y="520" width="2520" height="60" fill="{"#c9d6df" if winter else "#6e9a4e"}"/></g>')
    s.append(f'<linearGradient id="{id}_w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4dc"/><stop offset="1" stop-color="#1a4f7c"/></linearGradient>'
             f'<rect id="{id}_water" x="-300" y="560" width="2520" height="700" fill="url(#{id}_w)"/>')
    s.append(f'<g id="{id}_rip" opacity=".35">' + "".join(f'<ellipse cx="{R.uniform(0,1920):.0f}" cy="{R.uniform(620,1000):.0f}" rx="{R.uniform(60,140):.0f}" ry="{R.uniform(6,12):.0f}" fill="none" stroke="#e8f8ff" stroke-width="3"/>' for _ in range(14)) + '</g>')
    if not winter:
        for (x, y, r) in ((240, 760, 70), (1650, 700, 55), (1480, 930, 80)):
            s.append(f'<path d="M {x} {y} m -{r} 0 a {r} {r*0.35} 0 1 0 {2*r} 0 a {r} {r*0.35} 0 1 0 -{2*r} 0" fill="#4f9a48" opacity=".9"/>')
    s.append(f'<g id="{id}_fg">' + "".join(f'<path d="M {x} 1100 Q {x+R.uniform(-30,30):.0f} 900 {x+R.uniform(-60,60):.0f} {R.uniform(640,760):.0f}" stroke="#1d2f1a" stroke-width="{R.uniform(8,14):.0f}" fill="none"/>' for x in list(range(-40, 200, 34)) + list(range(1760, 2000, 30)))
             + f'<radialGradient id="{id}_vg" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>'
             f'<rect x="-300" y="-200" width="2520" height="1480" fill="url(#{id}_vg)"/></g></g>')
    return "".join(s)

def strider(id, x, y, s=1.0, op=0):
    """water strider: slim body, six long legs; the four long legs rest on the surface in dimples"""
    leg = "#2b2620"
    p = [f'<g id="{id}" opacity="{op}"><g transform="translate({x} {y}) scale({s})">',
         f'<g id="{id}_dim">' + "".join(f'<ellipse cx="{dx}" cy="4" rx="34" ry="7" fill="#0e3556" opacity=".55"/>' for dx in (-230, -120, 130, 240)) + '</g>',
         f'<path d="M -30 -40 Q -120 -90 -230 0 M -20 -38 Q -70 -70 -120 0 M 20 -38 Q 80 -70 130 0 M 30 -40 Q 130 -90 240 0" fill="none" stroke="{leg}" stroke-width="5" stroke-linecap="round"/>',
         f'<path d="M 40 -52 Q 80 -60 100 -40" fill="none" stroke="{leg}" stroke-width="5" stroke-linecap="round"/>',
         f'<ellipse cx="0" cy="-48" rx="64" ry="14" fill="#4a3c2c"/><ellipse cx="-10" cy="-52" rx="44" ry="7" fill="#7a6650" opacity=".7"/>',
         f'<circle cx="62" cy="-50" r="9" fill="#3a2e22"/></g></g>']
    return "".join(p)

def tree(id, x, y, h=820, op=0):
    """tall tree: shaded trunk, layered canopy blobs"""
    R = random.Random(9)
    p = [f'<g id="{id}" opacity="{op}">', f'<path d="M {x-38} {y} L {x-24} {y-h*0.62} L {x+24} {y-h*0.62} L {x+38} {y} Z" fill="url(#gBark)"/>']
    for i in range(22):
        a = R.uniform(0, 2 * math.pi); rr = R.uniform(0, 1)
        cx_, cy_ = x + 260 * rr * math.cos(a), y - h * 0.72 + 170 * rr * math.sin(a)
        p.append(f'<circle cx="{cx_:.0f}" cy="{cy_:.0f}" r="{R.uniform(70,120):.0f}" fill="url(#gLeaf)" opacity=".95"/>')
    p.append('</g>')
    return "".join(p)

def thermo(id, x, y, h=300, op=0, fill_id=None, level=0.4, color=CORAL):
    """soft thermometer; the fill rect {id}_f is scaled from the bottom"""
    return (f'<g id="{id}" opacity="{op}"><rect x="{x-22}" y="{y-h}" width="44" height="{h}" rx="22" fill="#f4f6fb" stroke="#c7d0de" stroke-width="4"/>'
            f'<circle cx="{x}" cy="{y+18}" r="40" fill="{color}" stroke="#c7d0de" stroke-width="4"/>'
            f'<rect id="{id}_f" x="{x-11}" y="{y-h+20}" width="22" height="{h-10}" rx="11" fill="{color}" transform="scale(1 1)" data-ob="1"/></g>')

def set_level(c, id, t, lv, d=0.6, ease="power2.inOut"):
    c.g(f'tl.to("#{id}_f",{{scaleY:{lv},duration:{d},ease:"{ease}"}},{t:.2f});')

# ------------------------------------------------------------- intro
def intro(c):
    T, C = c.T, c.C
    t1 = chapter_span(c, "polar")[0] - 0.4
    far_mid, fg = hot_road("rd", op=1)
    s = ['<g id="g_in">', GRAD, far_mid]
    road_motion(c, "rd", 0, C["why"][5] + 1.5); steps(c, 0, C["promise"][1], 0.5)
    c.sound("breath_female_real", 0.3, 0.45); c.sound("breath_female_real", 8.5, 0.35); c.sound("breath_female_real", 16.0, 0.3)
    # street thermometer sign: 33 °C
    s.append('<g id="in_sign" opacity="0"><rect x="1450" y="300" width="14" height="300" fill="#6d6a66"/><rect x="1330" y="200" width="260" height="130" rx="16" fill="#1d2a3c" stroke="#ff9a3c" stroke-width="5"/>'
             f'<text x="1460" y="292" text-anchor="middle" font-family="Inter" font-weight="900" font-size="84" fill="#ffb35c">33 °C</text></g>')
    c.fade_in("#in_sign", 0.3, y=-20)
    s.append(jimg("jd", "jordan-sprint", 520, 1010, 0.62, op=1)); bob(c, "#jd_b", 0, C["why"][5] + 1.5)
    # {1} muscles pumping out heat: warm glow + heat waves rising off her legs and arms
    s.append(f'<ellipse id="in_leg" cx="780" cy="650" rx="140" ry="100" fill="{WARM}" opacity="0" filter="url(#blur14)"/>')
    s.append(heat_waves("in_hw", 720, 600, WARM, 0, 4))
    c.to("#in_leg", C["hook"][1], "opacity:.65", 0.5); rise(c, "#in_hw", C["hook"][1], 1.4, 3); c.set("#in_hw", C["hook"][1], "opacity:1")
    c.pulse("#in_leg", C["hook"][1] + 0.5, C["hook"][2], 1.08, 0.7)
    # {2} core temperature gauge, creeping up only a little
    s.append(card("in_tc", 1220, 400, 560, 380, CORAL, op=0))
    s.append(thermo("in_th", 1330, 700, 250, op=0, level=0.5))
    s.append(txt("in_tl", 1560, 500, "core temperature", 34, WHITE, weight=800))
    s.append(txt("in_t37", 1560, 600, "37 °C", 64, WHITE, weight=900)); s.append(txt("in_t38", 1560, 600, "≈ 38 to 39 °C", 52, GOLD, weight=900))
    s.append(txt("in_tsm", 1560, 670, "only up a degree or two", 30, INK, weight=700))
    c.fade_in("#in_tc", C["hook"][2] - 0.2, y=20); c.fade_in("#in_th", C["hook"][2]); c.fade_in("#in_tl", C["hook"][2]); c.fade_in("#in_t37", C["hook"][2])
    c.set("#in_th_f", 0, "scaleY:0.55"); set_level(c, "in_th", C["hook"][2] + 0.8, 0.66, 1.4)
    c.fade_out("#in_t37", C["hook"][2] + 1.2); c.fade_in("#in_t38", C["hook"][2] + 1.3, y=0); c.fade_in("#in_tsm", C["hook"][2] + 1.6, y=0)
    c.hide("#in_leg", C["hook"][3]); c.hide("#in_hw", C["hook"][3])
    # {3} sweat: drops bead and roll on her face and arm; then the question
    s.append(bigdrops("in_sw1", 900, 360, 4, 3)); s.append(bigdrops("in_sw2", 700, 520, 4, 4)); s.append(bigdrops("in_sw3", 960, 560, 3, 6))
    for k in (1, 2, 3):
        c.set(f"#in_sw{k}", C["hook"][3], "opacity:1"); fall(c, f"#in_sw{k} path", C["hook"][3] + 0.1 * k, 1.3, 80, 2)
    s.append(chip("in_wc", 330, 300, "sweat = water", TEAL, 42, 0)); c.pop("#in_wc", C["hook"][3] + 0.4)
    c.sound("water_pour_real", C["hook"][3] + 0.2, 0.18)
    hideall(c, ["#in_tc", "#in_th", "#in_tl", "#in_t38", "#in_tsm"], C["hook"][4] - 0.3)
    s.append(card("in_qc", 1110, 330, 780, 300, GOLD, op=0))
    s.append(W(c, "in_q1", 1500, 440, "how does drying sweat", C["hook"][4] + 1.0, 52, WHITE, anchor="middle"))
    s.append(W(c, "in_q2", 1500, 530, "pull heat OUT of you?", C["hook"][4] + 2.4, 52, GOLD, anchor="middle"))
    c.fade_in("#in_qc", C["hook"][4], y=20); c.sound("riser", C["hook"][4] - 0.4, 0.3)
    hideall(c, ["#in_qc", "#in_q1", "#in_q2", "#in_wc", "#in_sign"], T["promise"] - 0.1)
    # promise: four teaser cards, one per spoken phenomenon
    tz = [("in_p1", "water strider", 1), ("in_p2", "water up a tree", 2), ("in_p3", "ice floats", 3), ("in_p4", "salt yes, oil no", 4)]
    for i, (pid, lab, cue) in enumerate(tz):
        x = 1010 + (i % 2) * 440; y = 230 + (i // 2) * 330
        s.append(f'<g id="{pid}" opacity="0">' + card(pid + "_c", x, y, 400, 290, [TEAL, GREEN, ICE, GOLD][i], op=1))
        if i == 0:
            s.append(f'<rect x="{x+20}" y="{y+150}" width="360" height="110" rx="10" fill="url(#gWater)"/>' + strider(pid + "_s", x + 200, y + 152, 0.62, 1))
        elif i == 1:
            s.append(f'<g transform="translate({x+200} {y+275}) scale(0.24) translate({-(x+200)} {-(y+265)})">' + tree(pid + "_t", x + 200, y + 265, 820, 1) + "</g>" + "".join(f'<circle cx="{x+200}" cy="{y+250-k*22}" r="6" fill="#7fd6ff"/>' for k in range(6)))
        elif i == 2:
            s.append(f'<rect x="{x+60}" y="{y+120}" width="280" height="140" rx="10" fill="url(#gWater)"/><rect id="{pid}_ice" x="{x+150}" y="{y+90}" width="100" height="80" rx="12" fill="url(#gIce)"/>')
        else:
            s.append(f'<rect x="{x+30}" y="{y+90}" width="340" height="170" rx="10" fill="url(#gWater)"/>'
                     + "".join(f'<circle cx="{x+70+k*26}" cy="{y+190+(k%2)*20}" r="7" fill="url(#gNa)"/>' for k in range(5))
                     + f'<ellipse cx="{x+290}" cy="{y+120}" rx="56" ry="22" fill="url(#gOil)"/>')
        s.append(txt(pid + "_l", x + 200, y + 60, lab, 36, WHITE, weight=900, op=1) + '</g>')
        c.fade_in(f"#{pid}", C["promise"][cue] - 0.1, y=30); c.sound("swish", C["promise"][cue], 0.3)
    c.g(f'tl.to("#in_p1_s",{{y:4,duration:0.6,yoyo:true,repeat:5,ease:"sine.inOut"}},{C["promise"][1]+0.3:.2f});')
    c.g(f'tl.to("#in_p3_ice",{{y:8,duration:0.8,yoyo:true,repeat:3,ease:"sine.inOut"}},{C["promise"][3]+0.3:.2f});')
    s.append(chip("in_ap", 1440, 960, "AP Biology 1.1 · Structure of Water and Hydrogen Bonding", TEAL, 34, 0)); c.pop("#in_ap", C["promise"][5])
    hideall(c, [f"#{p[0]}" for p in tz] + ["#in_ap"], T["why"] - 0.1)
    # why: the list, then the one idea
    s.append(card("in_lc", 1000, 200, 840, 560, INK, op=0)); c.fade_in("#in_lc", T["why"] + 0.2, y=20)
    items = ["cohesion", "adhesion", "high specific heat", "heat of vaporization", "ice floats", "solvent"]
    for i, it in enumerate(items):
        s.append(W(c, f"in_li{i}", 1060, 290 + i * 76, "• " + it, C["why"][1] + i * 0.35, 46, WHITE))
    c.sound("pen_scratch_real", C["why"][1], 0.3)
    for i in range(6):
        c.to(f"#in_li{i}", C["why"][2] + 0.1 + i * 0.06, "x:300,opacity:0", 0.5, "power2.in")
    s.append(txt("in_one", 1420, 500, "ONE thing", 110, GOLD, weight=900)); c.pop("#in_one", C["why"][2] + 0.4); c.hide("#in_one", C["why"][3] - 0.3)
    s.append(mol("in_m1", 1260, 450, 1.3, 30, 0, True, True)); s.append(mol("in_m2", 1580, 470, 1.3, -60, 0, True, True))
    c.fade_in("#in_m1", C["why"][3] - 0.2, y=0); c.fade_in("#in_m2", C["why"][3] - 0.2, y=0)
    for m in ("in_m1", "in_m2"):
        for p in ("hn", "hp1", "hp2", "dm", "dp1", "dp2"): c.to(f"#{m}_{p}", C["why"][3] + 0.4, "opacity:1", 0.4)
    c.g(f'tl.to("#in_m2",{{x:-110,y:-10,duration:1.0,ease:"back.out(1.6)"}},{C["why"][3]+1.2:.2f});')
    s.append(L(c, "in_stick", 1420, 680, "polar → they stick", C["why"][3] + 1.6, 46, GOLD))
    c.sound("pop", C["why"][3] + 2.0, 0.4)
    # {5} dive into a sweat drop on her arm: camera push into the drop
    s.append(f'<g id="in_drop" opacity="0"><path d="M 690 548 Q 712 590 690 606 Q 668 590 690 548 Z" fill="#dff6ff" stroke="#9ad8f5" stroke-width="2"/></g>')
    hideall(c, ["#in_lc", "#in_one", "#in_m1", "#in_m2", "#in_stick"], C["why"][5] - 0.4)
    c.fade_in("#in_drop", C["why"][5] - 0.3, y=0)
    c.g(f'tl.to("#cam",{{scale:9,x:{(960-690)*9:.0f},y:{(540-585)*9:.0f},duration:1.6,ease:"power3.in"}},{C["why"][5]:.2f});')
    c.g(f'tl.set("#cam",{{scale:1,x:0,y:0}},{t1+0.35:.2f});')
    c.sound("whoosh_real", C["why"][5] + 0.4, 0.5)
    s.append(fg + '</g>')
    c.hide("#g_in", t1 - 0.2, 0.5)
    return "".join(s)

# ------------------------------------------------------------- polar
def polar(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "polar")
    s = ['<g id="g_po" opacity="0">', water_bg("po_bg", 1, 3)]
    c.scene("#g_po", t0 - 0.3, t1); bubbles_up(c, "#po_bg_bub", t0, t1)
    # w1: atom: nucleus (protons +, neutrons), electron cloud; second atom joins by a shared pair
    ax, ay = 760, 560
    s.append(f'<g id="po_at" opacity="0"><circle id="po_cl" cx="{ax}" cy="{ay}" r="270" fill="url(#gCloud)"/>')
    R = random.Random(2)
    for i in range(8):
        a = i * 2.4; r = 36 * math.sqrt(i / 8 + 0.05)
        g = "gNuc" if i % 2 == 0 else "gNeu"
        s.append(f'<circle class="po_{"p" if g=="gNuc" else "n"}" cx="{ax + r*math.cos(a):.0f}" cy="{ay + r*math.sin(a):.0f}" r="23" fill="url(#{g})"/>')
    s.append(f'<g id="po_el">' + "".join(f'<circle cx="{ax + 200*math.cos(k*1.57+0.4):.0f}" cy="{ay + 200*math.sin(k*1.57+0.4):.0f}" r="13" fill="#7fe8ff"/>' for k in range(4)) + '</g></g>')
    c.fade_in("#po_at", T["w1"] - 0.3, y=0, scale=0.6)
    c.g(f'tl.fromTo("#po_el",{{rotation:0}},{{rotation:360,svgOrigin:"{ax} {ay}",duration:6,repeat:2,ease:"none",immediateRender:false}},{T["w1"]:.2f});')
    s.append(L(c, "po_lpr", 1100, 400, "nucleus: protons (+), neutrons (no charge)", C["w1"][1], 34, CORAL, anchor="start"))
    c.pulse(".po_p", C["w1"][1] + 0.3, C["w1"][1] + 2.0, 1.15, 0.5)
    s.append(L(c, "po_le", 1100, 460, "electrons (−): a light cloud around it", C["w1"][2], 34, "#7fe8ff", anchor="start"))
    c.pulse("#po_cl", C["w1"][2], C["w1"][3], 1.06, 0.8)
    # {3}{4}: two atoms share a pair
    s.append(f'<g id="po_a2" opacity="0"><circle cx="1240" cy="760" r="120" fill="url(#gCloud)"/><circle cx="1240" cy="760" r="20" fill="url(#gNuc)"/></g>')
    s.append(f'<g id="po_a3" opacity="0"><circle cx="1500" cy="760" r="120" fill="url(#gCloud)"/><circle cx="1500" cy="760" r="20" fill="url(#gNuc)"/></g>')
    c.fade_in("#po_a2", C["w1"][3], y=0); c.fade_in("#po_a3", C["w1"][3], y=0)
    c.g(f'tl.to("#po_a2",{{x:70,duration:0.9,ease:"power2.out"}},{C["w1"][3]+0.4:.2f});tl.to("#po_a3",{{x:-70,duration:0.9,ease:"power2.out"}},{C["w1"][3]+0.4:.2f});')
    s.append('<g id="po_pair" opacity="0"><circle cx="1360" cy="745" r="11" fill="#7fe8ff"/><circle cx="1380" cy="775" r="11" fill="#7fe8ff"/></g>')
    c.pop("#po_pair", C["w1"][4]); c.sound("pop", C["w1"][4], 0.35)
    s.append(L(c, "po_lcb", 1370, 940, "covalent bond = a shared pair of electrons", C["w1"][4] + 0.3, 34, GOLD))
    s.append(L(c, "po_lm", 1370, 610, "atoms held by covalent bonds = a molecule", C["w1"][5], 34, WHITE))
    hideall(c, ["#po_at", "#po_lpr", "#po_le", "#po_a2", "#po_a3", "#po_pair", "#po_lcb", "#po_lm"], T["w2"] - 0.1)
    # w2: the water molecule (3D spin + our 2D drawing with its two bonds)
    s.append(f'<g id="po_3d" opacity="0">' + chem.mol3d("O", OUT, "po3", x=120, y=230, w=640, h=600, start=T["w2"], turns=1.0, dur=C["w3"][1] - T["w2"], zoom=2.4, in_svg=True) + '</g>')
    c.fade_in("#po_3d", T["w2"], y=0); c.show("#po3", T["w2"], 0.4)
    s.append(L(c, "po_3l", 440, 880, "one oxygen, two hydrogens", T["w2"] + 0.6, 36, WHITE))
    MX, MY = 1320, 520
    (h1x, h1y), (h2x, h2y) = hpos(0, 150)
    s.append(f'<g id="po_m" opacity="0"><g id="po_bonds"><line x1="{MX}" y1="{MY}" x2="{MX+h1x:.0f}" y2="{MY+h1y:.0f}" stroke="#dfe7f2" stroke-width="14"/><line x1="{MX}" y1="{MY}" x2="{MX+h2x:.0f}" y2="{MY+h2y:.0f}" stroke="#dfe7f2" stroke-width="14"/></g>'
             f'<circle id="po_hn" cx="{MX}" cy="{MY}" r="150" fill="url(#gNeg)" opacity="0"/>'
             f'<circle id="po_hp1" cx="{MX+h1x:.0f}" cy="{MY+h1y:.0f}" r="90" fill="url(#gPos)" opacity="0"/><circle id="po_hp2" cx="{MX+h2x:.0f}" cy="{MY+h2y:.0f}" r="90" fill="url(#gPos)" opacity="0"/>'
             f'<circle id="po_H1" cx="{MX+h1x:.0f}" cy="{MY+h1y:.0f}" r="48" fill="url(#gH)"/><circle id="po_H2" cx="{MX+h2x:.0f}" cy="{MY+h2y:.0f}" r="48" fill="url(#gH)"/>'
             f'<circle id="po_O" cx="{MX}" cy="{MY}" r="80" fill="url(#gO)"/>'
             f'<text x="{MX}" y="{MY+16}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="48" fill="#fff">O</text>'
             f'<text id="po_Ht1" x="{MX+h1x:.0f}" y="{MY+h1y+14:.0f}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#3a4658">H</text>'
             f'<text id="po_Ht2" x="{MX+h2x:.0f}" y="{MY+h2y+14:.0f}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#3a4658">H</text>')
    # shared electron pairs on each bond (they slide toward O in w3)
    for i, (hx, hy) in enumerate(((h1x, h1y), (h2x, h2y))):
        mx, my = MX + hx * 0.55, MY + hy * 0.55; nx, ny = -hy / 150 * 14, hx / 150 * 14
        s.append(f'<g id="po_e{i}"><circle cx="{mx+nx:.0f}" cy="{my+ny:.0f}" r="11" fill="#7fe8ff"/><circle cx="{mx-nx:.0f}" cy="{my-ny:.0f}" r="11" fill="#7fe8ff"/></g>')
    s.append('</g>')
    c.fade_in("#po_m", T["w2"] + 0.4, y=0, scale=0.7)
    s.append(W(c, "po_f", MX, 200, "H₂O", C["w2"][1], 90, WHITE, anchor="middle"))
    c.pulse("#po_e0", C["w2"][2], C["w2"][2] + 1.6, 1.3, 0.4); c.pulse("#po_e1", C["w2"][2] + 0.3, C["w2"][2] + 1.9, 1.3, 0.4)
    s.append(L(c, "po_l2", MX, 860, "2 covalent bonds, each a shared pair", C["w2"][2] + 0.2, 36, "#7fe8ff"))
    hideall(c, ["#po_3l", "#po_l2"], T["w3"] - 0.1)
    # w3: electronegativity
    s.append(card("po_dc", 90, 230, 760, 170, GOLD, op=0)); c.fade_in("#po_dc", C["w3"][1] - 0.2, y=20); c.hide("#po_3d", C["w3"][1] - 0.3)
    s.append(W(c, "po_d1", 130, 300, "electronegativity:", C["w3"][1], 48, GOLD))
    s.append(W(c, "po_d2", 130, 365, "how hard an atom pulls on shared electrons", C["w3"][1] + 0.9, 32, WHITE))
    s.append(f'<g id="po_8p" opacity="0"><circle cx="{MX}" cy="{MY}" r="96" fill="none" stroke="{GOLD}" stroke-width="6"/></g>')
    s.append(L(c, "po_8l", 520, 520, "O: 8 protons, pair sits close → pulls HARD", C["w3"][2], 34, GOLD))
    c.to("#po_8p", C["w3"][2], "opacity:1", 0.3); c.pulse("#po_O", C["w3"][2] + 0.2, C["w3"][3], 1.07, 0.5)
    s.append(L(c, "po_1l", 520, 600, "H: 1 proton → pulls weakly", C["w3"][3], 34, INK))
    c.hide("#po_8p", C["w3"][4])
    for i, (hx, hy) in enumerate(((h1x, h1y), (h2x, h2y))):
        c.g(f'tl.to("#po_e{i}",{{x:{-hx*0.28:.0f},y:{-hy*0.28:.0f},duration:1.2,ease:"power2.inOut"}},{C["w3"][4]:.2f});')
    s.append(L(c, "po_pcb", 520, 690, "polar covalent bond: two ends, two charges", C["w3"][5], 34, TEAL))
    hideall(c, ["#po_dc", "#po_d1", "#po_d2", "#po_8l", "#po_1l", "#po_pcb"], T["w4"] - 0.1)
    # w4: partial charges
    c.to("#po_hn", T["w4"] + 0.4, "opacity:1", 0.8)
    s.append(txt("po_dm", MX, MY - 120, "δ−", 72, NEG, weight=900)); c.pop("#po_dm", C["w4"][1]); c.sound("pop", C["w4"][1], 0.3)
    s.append(L(c, "po_dml", 520, 420, "δ− = partial negative charge", C["w4"][1] + 0.4, 38, NEG))
    s.append(txt("po_dp1", MX + h1x * 1.55, MY + h1y * 1.55 + 20, "δ+", 64, POS, weight=900)); s.append(txt("po_dp2", MX + h2x * 1.55, MY + h2y * 1.55 + 20, "δ+", 64, POS, weight=900))
    c.to("#po_hp1", C["w4"][2], "opacity:1", 0.6); c.to("#po_hp2", C["w4"][2], "opacity:1", 0.6); c.pop("#po_dp1", C["w4"][2] + 0.2); c.pop("#po_dp2", C["w4"][2] + 0.4)
    s.append(L(c, "po_dpl", 520, 500, "δ+ = partial positive charge", C["w4"][2] + 0.5, 38, POS))
    s.append(L(c, "po_ion", 520, 610, "an ion has gained or lost a WHOLE electron", C["w4"][3], 32, INK))
    s.append(L(c, "po_lean", 520, 670, "here: just a lean", C["w4"][3] + 2.6, 40, WHITE))
    hideall(c, ["#po_dml", "#po_dpl", "#po_ion", "#po_lean"], T["w5"] - 0.1)
    # w5: the bend. Hs swing from a straight line into 104.5 degrees as the lone pairs appear
    s.append(f'<g id="po_lp" opacity="0">' + "".join(f'<ellipse cx="{MX + 95*math.cos(math.radians(a)):.0f}" cy="{MY + 95*math.sin(math.radians(a)):.0f}" rx="44" ry="26" transform="rotate({a} {MX + 95*math.cos(math.radians(a)):.0f} {MY + 95*math.sin(math.radians(a)):.0f})" fill="#7fe8ff" opacity=".35"/>' for a in (-125, -55)) + '</g>')
    s.append(f'<path id="po_arc" d="M {MX + 95*math.cos(math.radians(90-52.25)):.0f} {MY + 95*math.sin(math.radians(90-52.25)):.0f} A 95 95 0 0 1 {MX + 95*math.cos(math.radians(90+52.25)):.0f} {MY + 95*math.sin(math.radians(90+52.25)):.0f}" fill="none" stroke="{GOLD}" stroke-width="5" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>')
    s.append(txt("po_ang", MX, MY + 150, "104.5°", 40, GOLD, weight=900))
    # straightening then bending: rotate whole H halves around O
    c.hide("#po_e0", T["w5"]); c.hide("#po_e1", T["w5"])
    for part, sg in (("1", -1), ("2", 1)):
        ids = json.dumps([f"po_H{part}", f"po_hp{part}", f"po_dp{part}", f"po_Ht{part}"])
        c.g(f'(function(){{const o={{a:0}};const ids={ids};const ap=()=>ids.forEach(i=>{{const e=document.getElementById(i);if(e)e.setAttribute("transform","rotate("+o.a+" {MX} {MY})");}});'
            f'tl.fromTo(o,{{a:{sg*37.75}}},{{a:0,duration:1.4,ease:"back.out(1.4)",onUpdate:ap,onStart:ap,immediateRender:false}},{C["w5"][1]+0.6:.2f});}})();')
    c.g(f'tl.fromTo("#po_bonds",{{opacity:0}},{{opacity:1,duration:1.4,immediateRender:false}},{C["w5"][1]+0.6:.2f});')
    c.to("#po_lp", C["w5"][1] + 2.6, "opacity:1", 0.6); c.pulse("#po_lp", C["w5"][1] + 3.2, C["w5"][2], 1.08, 0.6)
    c.draw("#po_arc", C["w5"][1] + 1.6, 0.6); c.fade_in("#po_ang", C["w5"][1] + 1.8, y=0)
    s.append(L(c, "po_lpl", MX - 160, MY - 190, "2 unshared pairs push the bonds together", C["w5"][1] + 2.8, 34, "#7fe8ff", anchor="end"))
    s.append(f'<path id="po_side1" d="M {MX-240} {MY+215} L {MX+240} {MY+215}" stroke="{POS}" stroke-width="8" stroke-dasharray="14 10" opacity="0"/>')
    c.to("#po_side1", C["w5"][2], "opacity:1", 0.4)
    s.append(L(c, "po_pend", MX + 380, MY + 225, "+ end", C["w5"][2] + 0.2, 52, POS))
    s.append(L(c, "po_nend", MX + 380, MY - 90, "− end", C["w5"][3], 52, NEG)); c.pulse("#po_hn", C["w5"][3], C["w5"][4], 1.08, 0.6)
    s.append(chip("po_pm", 520, 640, "water is a POLAR molecule", GOLD, 44, 0)); c.pop("#po_pm", C["w5"][4] + 1.2)
    hideall(c, ["#po_lpl", "#po_side1", "#po_pend", "#po_nend", "#po_pm", "#po_arc", "#po_ang", "#po_lp", "#po_f"], T["w6"] - 0.1)
    hideall(c, ["#po_m", "#po_dm", "#po_dp1", "#po_dp2"], T["w6"])
    s.append(mol("po_wc", 1480, 560, 2.2, 0, 0, True, True)); c.fade_in("#po_wc", T["w6"] + 0.4, y=0)
    for p in ("hn", "hp1", "hp2", "dm", "dp1", "dp2"): c.to(f"#po_wc_{p}", T["w6"] + 0.6, "opacity:1", 0.4)
    s.append(L(c, "po_wcl", 1480, 400, "water: bent", T["w6"] + 0.6, 40, WHITE))
    s.append(L(c, "po_wcp", 1480, 780, "polar", C["w6"][4] + 1.0, 44, GOLD))
    # w6: CO2 straight line, double bonds, pulls cancel
    CX, CY = 640, 560
    s.append(f'<g id="po_co2" opacity="0">'
             f'<line x1="{CX-170}" y1="{CY-10}" x2="{CX+170}" y2="{CY-10}" stroke="#dfe7f2" stroke-width="10"/><line x1="{CX-170}" y1="{CY+12}" x2="{CX+170}" y2="{CY+12}" stroke="#dfe7f2" stroke-width="10"/>'
             f'<circle cx="{CX-170}" cy="{CY}" r="62" fill="url(#gO)"/><circle cx="{CX+170}" cy="{CY}" r="62" fill="url(#gO)"/><circle cx="{CX}" cy="{CY}" r="55" fill="url(#gC)"/>'
             f'<text x="{CX-170}" y="{CY+15}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#fff">O</text>'
             f'<text x="{CX}" y="{CY+15}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#fff">C</text>'
             f'<text x="{CX+170}" y="{CY+15}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#fff">O</text></g>')
    c.fade_in("#po_co2", C["w6"][1] - 0.3, y=20)
    s.append(L(c, "po_cl1", CX, 400, "carbon dioxide, CO₂", C["w6"][1] - 0.2, 40, WHITE))
    s.append(L(c, "po_db", CX, 700, "double bond = 2 shared pairs", C["w6"][1] + 1.4, 34, "#7fe8ff"))
    s.append(f'<line id="po_line" x1="{CX-300}" y1="{CY}" x2="{CX+300}" y2="{CY}" stroke="{GOLD}" stroke-width="4" stroke-dasharray="6 10" opacity="0"/>'); c.to("#po_line", C["w6"][2], "opacity:.8", 0.4)
    s.append(arrow("po_pl", CX - 90, CY - 110, CX - 300, CY - 110, NEG, 9, "ahc")); s.append(arrow("po_pr", CX + 90, CY - 110, CX + 300, CY - 110, NEG, 9, "ahc"))
    c.draw("#po_pl", C["w6"][3], 0.6); c.draw("#po_pr", C["w6"][3], 0.6)
    s.append(L(c, "po_cc", CX, 330, "equal and opposite → cancel", C["w6"][3] + 0.6, 36, GOLD))
    s.append(chip("po_np", CX, 800, "nonpolar", INK, 44, 0)); c.pop("#po_np", C["w6"][4] + 1.0)
    s.append(card("po_sc", 330, 870, 1260, 120, GOLD, op=0)); c.fade_in("#po_sc", C["w6"][5] - 0.2, y=20)
    s.append(W(c, "po_sum", 960, 950, "polar bonds + bent shape = polar molecule", C["w6"][5], 50, GOLD, anchor="middle"))
    hideall(c, ["#po_co2", "#po_cl1", "#po_db", "#po_line", "#po_pl", "#po_pr", "#po_cc", "#po_np", "#po_sc", "#po_sum", "#po_wc", "#po_wcl", "#po_wcp"], T["c1q"] - 0.1)
    s.append(qcheck(c, "qc1", "c1q", ["Why does water's oxygen end", "carry a partial negative charge?"]))
    s.append(W(c, "qc1_a1", 320, 600, "O is more electronegative than H", T["c1a"] + 0.2, 52, GREEN))
    s.append(W(c, "qc1_a2", 320, 690, "→ shared electrons spend more time near O", C["c1a"][1], 44, WHITE))
    s.append(mol("qc1_m", 1520, 820, 1.6, 0, 0, True, True)); c.fade_in("#qc1_m", C["c1a"][1], y=0)
    for p in ("hn", "dm"): c.to(f"#qc1_m_{p}", C["c1a"][1] + 0.4, "opacity:1", 0.4)
    c.sound("ding", T["c1a"] + 0.2, 0.35)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- hydrogen bonds
def hbond(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "hbond")
    s = ['<g id="g_hb" opacity="0">', water_bg("hb_bg", 1, 8)]
    c.scene("#g_hb", t0 - 0.3, t1); bubbles_up(c, "#hb_bg_bub", t0, t1)
    # h1: two molecules meet. Right molecule's O faces left molecule's H.
    s.append(mol("hb_a", 640, 540, 2.2, -37.75, 0, True, True)); s.append(mol("hb_b", 1280, 540, 2.2, -90, 0, True, True))
    c.fade_in("#hb_a", T["h1"] + 0.2, y=0); c.fade_in("#hb_b", T["h1"] + 0.2, y=0)
    c.g(f'tl.fromTo("#hb_b",{{x:260}},{{x:0,duration:2.0,ease:"power2.out",immediateRender:false}},{T["h1"]+0.2:.2f});')
    for m in ("hb_a", "hb_b"):
        for p in ("hn", "hp1", "hp2", "dm", "dp1", "dp2"): c.to(f"#{m}_{p}", C["h1"][1], "opacity:1", 0.5)
    (ax1, ay1), (ax2, ay2) = hpos(-37.75)
    hx, hy = 640 + ax1 * 2.2, 540 + ay1 * 2.2
    c.pulse("#hb_a_hp1", C["h1"][2], C["h1"][3], 1.2, 0.5); c.pulse("#hb_b_hn", C["h1"][2] + 0.3, C["h1"][3], 1.12, 0.5)
    s.append(hb("hb_l", hx + 44, hy, 1280 - 72, 540, 0, GOLD, 7)); c.to("#hb_l", C["h1"][3], "opacity:1", 0.5); c.sound("pop", C["h1"][3], 0.35)
    s.append(chip("hb_lab", 960, 300, "hydrogen bond", GOLD, 48, 0)); c.pop("#hb_lab", C["h1"][3] + 0.3)
    s.append(L(c, "hb_sol", 700, 880, "solid line: covalent bond (strong, inside)", C["h1"][4], 34, WHITE))
    s.append(L(c, "hb_das", 1260, 960, "dashed line: hydrogen bond (weak, between)", C["h1"][4] + 1.2, 34, GOLD))
    hideall(c, ["#hb_a", "#hb_b", "#hb_l", "#hb_lab", "#hb_sol", "#hb_das"], T["h2"] - 0.1)
    # h2: one molecule, four neighbors: two through its Hs, two through its unshared pairs
    CX, CY = 960, 560
    s.append(mol("hb_c", CX, CY, 1.9, 0, 0, True, True)); c.fade_in("#hb_c", T["h2"], y=0, scale=0.8)
    (p1x, p1y), (p2x, p2y) = hpos(0, 48 * 1.9)
    nbr = [(CX + p1x * 2.6, CY + p1y * 2.6, 150), (CX + p2x * 2.6, CY + p2y * 2.6, 210),
           (CX + 220 * math.cos(math.radians(-125)), CY + 220 * math.sin(math.radians(-125)), -125 + 90 + 180 - 52),
           (CX + 220 * math.cos(math.radians(-55)), CY + 220 * math.sin(math.radians(-55)), -55 + 90 + 180 + 52)]
    for i, (nx, ny, rot) in enumerate(nbr):
        s.append(mol(f"hb_n{i}", nx, ny, 1.5, rot, 0))
        tt = T["h2"] + 0.3 if i < 2 else C["h2"][1]
        c.fade_in(f"#hb_n{i}", tt + 0.2 * (i % 2), y=0, scale=0.8)
        if i < 2:
            s.append(hb(f"hb_d{i}", CX + p1x * (1.0 if i == 0 else 0) + p2x * (1.0 if i == 1 else 0), CY + p1y, nx, ny, 0, GOLD, 6))
        else:
            a = -125 if i == 2 else -55
            s.append(hb(f"hb_d{i}", CX + 60 * math.cos(math.radians(a)), CY + 60 * math.sin(math.radians(a)), nx - 0.18 * (nx - CX), ny - 0.18 * (ny - CY), 0, GOLD, 6))
        c.to(f"#hb_d{i}", tt + 0.5 + 0.2 * (i % 2), "opacity:1", 0.4); c.sound("pop", tt + 0.5 + 0.2 * (i % 2), 0.25)
    for p in ("hp1", "hp2"): c.pulse(f"#hb_c_{p}", T["h2"] + 0.2, C["h2"][1], 1.2, 0.5)
    c.to("#hb_c_hn", C["h2"][1], "opacity:1", 0.4)
    s.append(chip("hb_4", 960, 940, "up to 4 neighbors", GOLD, 48, 0)); c.pop("#hb_4", C["h2"][2])
    # {3} network: zoom out into a whole shifting network
    R = random.Random(4)
    net, wid = [], []
    for k in range(46):
        x = R.uniform(-250, 2170); y = R.uniform(-150, 1230)
        if abs(x - CX) < 380 and abs(y - CY) < 340: continue
        net.append((x, y)); wid.append(f"hb_w{k}"); s.append(mol(f"hb_w{k}", x, y, 1.5, R.uniform(0, 360), 0))
    for k, (x, y) in enumerate(net[:-1]):
        x2, y2 = min(net[k + 1:], key=lambda p: (p[0] - x) ** 2 + (p[1] - y) ** 2)
        if (x2 - x) ** 2 + (y2 - y) ** 2 > 260 ** 2: x2, y2 = x, y
        s.append(hb(f"hb_nl{k}", x, y, x2, y2, 0, GOLD, 5))
    hideall(c, ["#hb_4"], C["h2"][3])
    c.cam(C["h2"][3], 0.75, 0, 0, 1.6)
    c.g(f'tl.to("{",".join("#"+w for w in wid)}",{{opacity:1,duration:0.6,stagger:0.02}},{C["h2"][3]+0.2:.2f});')
    c.g(f'tl.to("[id^=hb_nl]",{{opacity:.8,duration:0.5,stagger:0.02}},{C["h2"][3]+0.8:.2f});')
    jiggle(c, wid[:30], C["h2"][3], T["h3"] + c.D["h3"], 10, 0.8, 4)
    # h3: weak and short lived: bonds flicker, but there are many
    c.cam(T["h3"], 1, 0, 0, 1.2)
    c.g(f'tl.to("{",".join("#"+w for w in wid)}",{{opacity:0.45,duration:0.6}},{T["h3"]:.2f});')
    s.append(card("hb_sc", 200, 160, 760, 250, TEAL, op=0)); c.fade_in("#hb_sc", T["h3"] + 0.3, y=20)
    s.append(L(c, "hb_cvl", 230, 240, "covalent", T["h3"] + 0.5, 34, WHITE, anchor="start"))
    s.append('<rect id="hb_cvb" x="420" y="210" width="500" height="40" rx="12" fill="#dfe7f2" opacity="0" data-ol="1"/>')
    s.append(L(c, "hb_hbl", 230, 340, "hydrogen bond", T["h3"] + 1.0, 34, GOLD, anchor="start"))
    s.append(f'<rect id="hb_hbb" x="520" y="310" width="25" height="40" rx="8" fill="{GOLD}" opacity="0" data-ol="1"/>')
    c.g(f'tl.fromTo("#hb_cvb",{{opacity:1,scaleX:0}},{{scaleX:1,duration:0.8}},{T["h3"]+0.6:.2f});tl.fromTo("#hb_hbb",{{opacity:1,scaleX:0}},{{scaleX:1,duration:0.4}},{T["h3"]+1.4:.2f});')
    s.append(L(c, "hb_20", 700, 395, "about 1/20 as strong", T["h3"] + 2.0, 30, GOLD))
    for k in range(len(net) - 1):
        c.g(f'tl.to("#hb_nl{k}",{{opacity:0.1,duration:0.15,yoyo:true,repeat:{5 + k % 4},repeatDelay:{0.3 + (k % 5) * 0.12:.2f}}},{C["h3"][1] + (k % 7) * 0.13:.2f});')
    c.to("#hb_c_dm", T["h2"], "opacity:0", 0.1)
    for i in range(4):
        c.g(f'tl.to("#hb_d{i}",{{opacity:0.1,duration:0.15,yoyo:true,repeat:5,repeatDelay:0.35}},{C["h3"][1] + i * 0.2:.2f});')
    s.append(chip("hb_fl", 960, 1000, "each lasts a tiny fraction of a second, then re-forms", WHITE, 32, 0)); c.pop("#hb_fl", C["h3"][1] + 0.4)
    s.append(chip("hb_many", 1500, 260, "but MANY of them", GOLD, 44, 0)); c.pop("#hb_many", C["h3"][2])
    c.g(f'tl.to("[id^=hb_nl]",{{opacity:1,duration:0.3}},{C["h3"][2]:.2f});')
    s.append(L(c, "hb_props", 1500, 360, "→ almost every property of water", C["h3"][3], 34, WHITE))
    end_net = T["h4"] - 0.1
    hideall(c, ["#hb_sc", "#hb_cvl", "#hb_cvb", "#hb_hbl", "#hb_hbb", "#hb_20", "#hb_fl", "#hb_many", "#hb_props", "#hb_c", "#hb_4"] + [f"#hb_n{i}" for i in range(4)] + [f"#hb_d{i}" for i in range(4)], end_net)
    c.g(f'tl.to("{",".join("#"+w for w in wid)},[id^=hb_nl]",{{opacity:0,duration:0.3}},{end_net:.2f});')
    # h4: inside vs between, then boiling
    s.append(mol("hb_i1", 520, 480, 2.4, -37.75, 0)); s.append(mol("hb_i2", 1000, 480, 2.4, -90, 0))
    c.fade_in("#hb_i1", T["h4"] + 0.2, y=0); c.fade_in("#hb_i2", T["h4"] + 0.2, y=0)
    (a1x, a1y), _ = hpos(-37.75, 48 * 2.4)
    s.append(hb("hb_ib", 520 + a1x + 46, 480 + a1y, 1000 - 76, 480, 0, GOLD, 7)); c.to("#hb_ib", T["h4"] + 0.6, "opacity:1", 0.3)
    s.append(f'<ellipse id="hb_ring1" cx="545" cy="500" rx="150" ry="140" fill="none" stroke="{TEAL}" stroke-width="6" opacity="0"/>')
    c.to("#hb_ring1", C["h4"][1], "opacity:1", 0.3)
    s.append(L(c, "hb_in", 560, 700, "covalent: INSIDE one molecule", C["h4"][1], 36, TEAL))
    c.pulse("#hb_ib", C["h4"][2], C["h4"][2] + 1.8, 1.05, 0.5)
    s.append(L(c, "hb_bt", 900, 300, "hydrogen bond: BETWEEN molecules", C["h4"][2], 36, GOLD))
    s.append(MI("hb_pot", "pot-water-hot", 1240, 380, 560)); c.fade_in("#hb_pot", C["h4"][3] - 0.3, y=20)
    c.sound("bubbling_real", C["h4"][3], 0.35)
    c.to("#hb_ib", C["h4"][3] + 0.3, "opacity:0", 0.2); c.sound("pop", C["h4"][3] + 0.3, 0.3)
    c.g(f'tl.to("#hb_i2",{{x:380,y:-230,duration:1.6,ease:"power2.out"}},{C["h4"][3]+0.4:.2f});')
    s.append(chip("hb_steam", 1420, 300, "steam: still H₂O", GREEN, 40, 0)); c.pop("#hb_steam", C["h4"][4] + 0.5)
    c.pulse("#hb_i2", C["h4"][4], C["h4"][4] + 1.8, 1.08, 0.6)
    hideall(c, ["#hb_i1", "#hb_i2", "#hb_ring1", "#hb_in", "#hb_bt", "#hb_pot", "#hb_steam"], T["h5"] - 0.1)
    # h5: not only water: DNA and proteins
    s.append(L(c, "hb_on", 960, 240, "H on O or N  ···  attracted to another O or N", C["h5"][1], 44, GOLD))
    s.append(MI("hb_dna", "dna-double-stranded-ribbon", 100, 440, 900))
    s.append(f'<g id="hb_pro" opacity="0"><path d="M 1100 760 C 1140 560 1260 560 1290 700 S 1440 860 1470 690 S 1600 520 1640 680 S 1760 820 1780 600" fill="none" stroke="#9b7bff" stroke-width="26" stroke-linecap="round"/>'
             + "".join(hb(f"hb_ph{k}", x1, y1, x2, y2, 1, GOLD, 5) for k, (x1, y1, x2, y2) in enumerate(((1200, 600, 1270, 700), (1380, 760, 1460, 700), (1560, 620, 1630, 690), (1700, 760, 1770, 650)))) + '</g>')
    c.fade_in("#hb_dna", C["h5"][2], y=20); c.fade_in("#hb_pro", C["h5"][2] + 0.4, y=20)
    s.append(L(c, "hb_dl", 540, 640, "DNA: strands held together", C["h5"][2] + 0.4, 36, WHITE)); s.append(L(c, "hb_pl", 1440, 900, "proteins: held in their folded shape", C["h5"][2] + 0.8, 36, WHITE))
    for k in range(10):
        s.append(f'<rect id="hb_rg{k}" x="{196 + k*68}" y="455" width="10" height="60" fill="{GOLD}" opacity="0"/>')
    c.g(f'tl.to("[id^=hb_rg]",{{opacity:.9,duration:0.2,stagger:0.08}},{C["h5"][2]+0.6:.2f});')
    hideall(c, ["#hb_on", "#hb_dna", "#hb_pro", "#hb_dl", "#hb_pl"] + [f"#hb_rg{k}" for k in range(10)], T["c2q"] - 0.1)
    s.append(qcheck(c, "qc2", "c2q", ["An ice cube melts. Are covalent bonds", "breaking, or hydrogen bonds?"]))
    s.append(f'<g id="qc2_ice" opacity="0"><rect id="qc2_cube" x="1500" y="560" width="200" height="180" rx="22" fill="url(#gIce)" data-ob="1"/><ellipse id="qc2_pool" cx="1600" cy="745" rx="40" ry="10" fill="#7fd0f5" opacity=".8"/></g>')
    c.fade_in("#qc2_ice", C["c2q"][1], y=0)
    c.g(f'tl.to("#qc2_cube",{{scaleY:0.35,scaleX:0.8,duration:{c.D["c2q"]+4:.1f},ease:"none"}},{C["c2q"][1]+0.5:.2f});tl.to("#qc2_pool",{{attr:{{rx:170}},duration:{c.D["c2q"]+4:.1f},ease:"none"}},{C["c2q"][1]+0.5:.2f});')
    s.append(W(c, "qc2_a1", 320, 600, "hydrogen bonds", T["c2a"] + 0.2, 56, GREEN))
    s.append(W(c, "qc2_a2", 320, 690, "melting loosens links BETWEEN molecules", C["c2a"][1], 40, WHITE))
    s.append(W(c, "qc2_a3", 320, 770, "the covalent bonds in each H₂O: untouched", C["c2a"][2], 40, WHITE))
    c.sound("ding", T["c2a"] + 0.2, 0.35)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- cohesion, adhesion, trees
def leaf_section(id, x, y, op=0):
    """leaf cross section in soft style: upper epidermis, mesophyll cells, air space, lower epidermis with one stoma (two guard cells)"""
    p = [f'<g id="{id}" opacity="{op}"><rect x="{x}" y="{y}" width="900" height="380" rx="30" fill="#3f8f4a"/>',
         f'<rect x="{x}" y="{y}" width="900" height="44" rx="20" fill="#a9e09a"/>']
    for k in range(9):
        p.append(f'<rect x="{x+20+k*98}" y="{y+52}" width="80" height="120" rx="30" fill="url(#gLeaf)"/>')
    R = random.Random(3)
    for k in range(14):
        p.append(f'<ellipse cx="{x+40+k*62}" cy="{y+230+R.uniform(-14,14):.0f}" rx="34" ry="28" fill="url(#gLeaf)" opacity=".9"/>')
    p.append(f'<rect x="{x}" y="{y+330}" width="900" height="50" rx="20" fill="#a9e09a"/>')
    gx, gy = x + 450, y + 355
    p.append(f'<rect x="{gx-30}" y="{gy-28}" width="60" height="60" fill="#163a22"/>')
    p.append(f'<g id="{id}_g1"><ellipse cx="{gx-34}" cy="{gy}" rx="30" ry="26" fill="#6fd06a" stroke="#2c6b30" stroke-width="4"/></g>'
             f'<g id="{id}_g2"><ellipse cx="{gx+34}" cy="{gy}" rx="30" ry="26" fill="#6fd06a" stroke="#2c6b30" stroke-width="4"/></g>')
    p.append(f'<rect x="{x+330}" y="{y+170}" width="40" height="160" rx="16" fill="#7fd6ff" opacity=".5"/>')   # xylem in the vein
    p.append('</g>')
    return "".join(p)

def cohesion(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "cohesion")
    s = ['<g id="g_co" opacity="0">', pond("co_pd", 1)]
    c.scene("#g_co", t0 - 0.3, chapter_span(c, "cohesion")[0] + (T["k3"] - t0))
    c.g(f'tl.fromTo("#co_pd_rip",{{x:0}},{{x:-80,duration:{T["k3"]-t0:.2f},ease:"none",immediateRender:false}},{t0:.2f});')
    c.sound("splash_real", t0 + 0.4, 0.2)
    s.append(chip("co_def", 960, 200, "cohesion: water sticking to water", GOLD, 46, 0)); c.pop("#co_def", T["k1"] + 0.3)
    # {2}-{5} magnifier circle at the surface
    MX, MY, MR = 960, 640, 300
    s.append(f'<g id="co_mag" opacity="0"><clipPath id="co_cp"><circle cx="{MX}" cy="{MY}" r="{MR}"/></clipPath>'
             f'<circle cx="{MX}" cy="{MY}" r="{MR}" fill="#9ed8f2"/><g clip-path="url(#co_cp)"><rect x="{MX-MR}" y="{MY-100}" width="{2*MR}" height="{MR+120}" fill="url(#gWater)"/>')
    R = random.Random(6)
    for i in range(5):
        for j in range(4):
            x = MX - 240 + i * 120 + (60 if j % 2 else 0); y = MY - 60 + j * 105
            if (i, j) in ((2, 0), (2, 2)): continue
            s.append(mol(f"co_m{i}{j}", x, y, 1.0, R.uniform(0, 360), 1))
    s.append(mol("co_top", MX, MY - 60, 1.15, 0, 1)); s.append(mol("co_mid", MX, MY + 150, 1.15, 0, 1))
    s.append('</g>')
    for k, a in enumerate(range(0, 360, 45)):
        s.append(arrow(f"co_mar{k}", MX + 45 * math.cos(math.radians(a)), MY + 150 + 45 * math.sin(math.radians(a)), MX + 110 * math.cos(math.radians(a)), MY + 150 + 110 * math.sin(math.radians(a)), GOLD, 6))
    for k, a in enumerate((180, 135, 90, 45, 0)):
        s.append(arrow(f"co_ta{k}", MX + 45 * math.cos(math.radians(a)), MY - 60 + 45 * math.sin(math.radians(a)), MX + 115 * math.cos(math.radians(a)), MY - 60 + 115 * math.sin(math.radians(a)), CORAL, 7, "ahc"))
    s.append(f'<path id="co_skin" d="M {MX-MR+10} {MY-100} L {MX+MR-10} {MY-100}" stroke="{GOLD}" stroke-width="8" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>')
    s.append(f'<circle cx="{MX}" cy="{MY}" r="{MR}" fill="none" stroke="#fff" stroke-width="8"/></g>')
    c.fade_in("#co_mag", C["k1"][1] + 0.4, y=0, scale=0.6); c.sound("whoosh_real", C["k1"][1] + 0.4, 0.4)
    c.pulse("#co_mid", C["k1"][2], C["k1"][3], 1.12, 0.5)
    c.g(f'tl.to("[id^=co_mar]",{{strokeDashoffset:0,opacity:1,duration:0.5,stagger:0.06}},{C["k1"][2]+0.3:.2f});')
    c.g(f'tl.to("[id^=co_mar]",{{opacity:0,duration:0.3}},{C["k1"][3]-0.1:.2f});')
    c.pulse("#co_top", C["k1"][3], C["k1"][4], 1.12, 0.5)
    s.append(chip("co_air", MX, MY - 330, "air above: no water pulling up", WHITE, 32, 0)); c.pop("#co_air", C["k1"][3] + 0.3)
    c.g(f'tl.to("[id^=co_ta]",{{strokeDashoffset:0,opacity:1,duration:0.5,stagger:0.1}},{C["k1"][4]:.2f});')
    c.draw("#co_skin", C["k1"][5], 0.8); c.pulse("#co_skin", C["k1"][5] + 0.8, C["k1"][5] + 3.0, 1.01, 0.5)
    s.append(chip("co_st", MX, 1010, "surface tension", GOLD, 46, 0)); c.pop("#co_st", C["k1"][5] + 2.2)
    hideall(c, ["#co_mag", "#co_air", "#co_st", "#co_def"], T["k2"] - 0.1)
    # k2: water strider on the surface
    s.append(strider("co_sd", 960, 700, 1.6, 0)); c.fade_in("#co_sd", T["k2"] + 0.2, y=-40)
    c.g(f'tl.fromTo("#co_sd_dim",{{scaleY:0.6,transformOrigin:"50% 0%"}},{{scaleY:1.8,duration:0.8,ease:"power2.out"}},{C["k2"][1]:.2f});')
    c.g(f'tl.to("#co_sd",{{x:120,duration:{c.D["k2"]:.2f},ease:"sine.inOut"}},{T["k2"]+0.6:.2f});')
    s.append(chip("co_dent", 960, 860, "it just dents the surface", WHITE, 38, 0)); c.pop("#co_dent", C["k2"][1] + 0.3)
    s.append(chip("co_hold", 960, 960, "hydrogen bonds hold it up", GOLD, 38, 0)); c.pop("#co_hold", C["k2"][2])
    c.sound("splash_real", C["k2"][1], 0.15)
    hideall(c, ["#co_sd", "#co_dent", "#co_hold"], T["k3"] - 0.1)
    # k3-k4: lab bench: adhesion to glass, capillary tube, paper towel
    s.append('</g><g id="g_co2" opacity="0">' + water_bg("co_bg2", 1, 12, "#10284a"))
    c.scene("#g_co2", T["k3"] - 0.3, T["k5"] - 0.1)
    s.append(L(c, "co_ad", 960, 200, "adhesion: water sticking to a DIFFERENT surface", T["k3"] + 0.2, 46, TEAL))
    s.append(f'<g id="co_wall" opacity="0"><rect x="560" y="300" width="70" height="620" rx="12" fill="url(#gGlassWall)" stroke="#cfe8ff" stroke-width="3"/>'
             + "".join(f'<text x="595" y="{350+k*70}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="{NEG if k%2 else POS}">{"−" if k%2 else "+"}</text>' for k in range(9)) + '</g>')
    c.fade_in("#co_wall", T["k3"] + 0.4, y=0)
    s.append(L(c, "co_gl", 595, 970, "glass: polar surface", T["k3"] + 0.8, 30, WHITE))
    s.append(MI("co_gw", "glass-water", 1200, 320, 300)); c.fade_in("#co_gw", T["k3"] + 2.0, y=20)
    s.append(L(c, "co_gwl", 1350, 960, "glass, paper, plant tube walls", T["k3"] + 2.2, 34, TEAL))
    for k in range(4):
        s.append(mol(f"co_aw{k}", 760 + (k % 2) * 40, 400 + k * 140, 1.3, 90 if k % 2 == 0 else -90, 0))
        s.append(hb(f"co_ah{k}", 632, 400 + k * 140, 718 + (k % 2) * 40, 400 + k * 140, 0, TEAL, 5))
        c.fade_in(f"#co_aw{k}", T["k3"] + 1.0 + k * 0.2, y=0)
    c.g(f'tl.to("[id^=co_ah]",{{opacity:1,duration:0.3,stagger:0.15}},{C["k3"][1]:.2f});'); c.sound("pop", C["k3"][1], 0.25)
    hideall(c, ["#co_ad", "#co_wall", "#co_gl", "#co_gw", "#co_gwl"] + [f"#co_aw{k}" for k in range(4)] + [f"#co_ah{k}" for k in range(4)], T["k4"] - 0.1)
    # k4: narrow tube in a dish: water climbs
    s.append(f'<g id="co_cap" opacity="0"><rect x="560" y="760" width="800" height="200" rx="20" fill="url(#gWater)"/>'
             f'<rect x="920" y="280" width="80" height="620" rx="10" fill="url(#gGlassWall)" stroke="#cfe8ff" stroke-width="4"/>'
             f'<rect id="co_col" x="926" y="460" width="68" height="440" fill="url(#gWater)" data-ob="1"/>'
             f'<path id="co_men" d="M 926 470 Q 960 500 994 470" fill="none" stroke="#bfefff" stroke-width="6"/></g>')
    c.fade_in("#co_cap", T["k4"] + 0.2, y=20)
    c.g(f'tl.fromTo("#co_col",{{scaleY:0.32}},{{scaleY:1,duration:{C["k4"][3]-C["k4"][1]+0.4:.2f},ease:"power1.out",immediateRender:false}},{C["k4"][1]:.2f});')
    c.g(f'tl.fromTo("#co_men",{{y:300}},{{y:0,duration:{C["k4"][3]-C["k4"][1]+0.4:.2f},ease:"power1.out",immediateRender:false}},{C["k4"][1]:.2f});')
    s.append(arrow("co_wa1", 900, 760, 900, 520, TEAL, 8, "aht")); s.append(arrow("co_wa2", 1020, 760, 1020, 520, TEAL, 8, "aht"))
    c.draw("#co_wa1", C["k4"][1], 0.6); c.draw("#co_wa2", C["k4"][1], 0.6)
    s.append(L(c, "co_lad", 620, 560, "adhesion: up the walls", C["k4"][1] + 0.3, 34, TEAL))
    s.append(arrow("co_ma", 960, 820, 960, 640, GOLD, 8)); c.draw("#co_ma", C["k4"][2], 0.6)
    s.append(L(c, "co_lco", 1200, 660, "cohesion: drags the middle along", C["k4"][2] + 0.3, 34, GOLD, anchor="start"))
    s.append(chip("co_cpa", 960, 200, "capillary action", WHITE, 46, 0)); c.pop("#co_cpa", C["k4"][3] + 0.6)
    c.sound("water_pour_real", C["k4"][1], 0.15)
    # paper towel soaking a spill
    s.append(f'<g id="co_tw" opacity="0"><rect x="1440" y="420" width="260" height="440" rx="12" fill="#f4f1ea"/>'
             f'<rect id="co_twet" x="1440" y="420" width="260" height="440" rx="12" fill="#7fc6ee" opacity=".7" data-ob="1"/>'
             f'<ellipse cx="1570" cy="880" rx="220" ry="34" fill="#5fb4dc" opacity=".85"/></g>')
    c.fade_in("#co_tw", C["k4"][4] - 0.2, y=20)
    c.g(f'tl.fromTo("#co_twet",{{scaleY:0.05}},{{scaleY:0.8,duration:2.4,ease:"power1.out",immediateRender:false}},{C["k4"][4]+0.2:.2f});')
    s.append(L(c, "co_twl", 1570, 380, "paper towel soaking a spill", C["k4"][4] + 0.2, 32, WHITE))
    s.append('</g>')
    # k5-k7: the tree
    s.append('<g id="g_co3" opacity="0">')
    c.scene("#g_co3", T["k5"] - 0.3, T["c3q"] - 0.1)
    s.append(f'<g filter="url(#blur6)"><linearGradient id="co_sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fbde8"/><stop offset="1" stop-color="#d8eecf"/></linearGradient>'
             f'<rect x="-200" y="-200" width="2320" height="1480" fill="url(#co_sky3)"/><ellipse cx="400" cy="940" rx="900" ry="200" fill="#7fae5a"/><ellipse cx="1600" cy="960" rx="900" ry="220" fill="#6f9e4e"/></g>'
             f'<rect x="-200" y="960" width="2320" height="300" fill="#6a4a2e"/>')
    s.append(tree("co_tr", 560, 980, 900, 1)); c.sound("page_flip_real", T["k5"], 0.0)
    s.append(f'<g id="co_50"><line x1="900" y1="120" x2="900" y2="960" stroke="#fff" stroke-width="4" stroke-dasharray="10 10"/><text x="930" y="560" font-family="Inter" font-weight="900" font-size="54" fill="#fff">up to 50 m</text></g>')
    c.fade_in("#co_50", T["k5"] + 2.4, y=0)
    # roots
    s.append(f'<g id="co_root" opacity="0">' + "".join(f'<path d="M 560 980 Q {560+dx*0.5:.0f} {1030+abs(dx)*0.1:.0f} {560+dx} 1080" stroke="#4a3020" stroke-width="10" fill="none"/>' for dx in (-260, -140, -40, 60, 170, 290)) + '</g>')
    c.fade_in("#co_root", T["k5"] + 0.6, y=0)
    # {1} cutaway trunk with xylem tubes and a chain of molecules inside
    s.append(card("co_xc", 1080, 160, 760, 820, TEAL, op=0)); c.fade_in("#co_xc", C["k5"][1] - 0.2, y=20); c.hide("#co_50", C["k5"][1] - 0.3)
    s.append(f'<g id="co_xs" opacity="0">' + "".join(f'<path d="M {548+k*12} 975 L {548+k*12} 420" stroke="#7fd6ff" stroke-width="5" opacity=".8"/>' for k in range(3)) + '</g>')
    c.fade_in("#co_xs", C["k5"][1], y=0)
    s.append(P(c, "co_lnk", "M 600 600 L 1080 600", C["k5"][1] + 0.1, TEAL, 4, 0.5))
    s.append(L(c, "co_xl", 1460, 230, "xylem: narrow, hollow tubes of dead cells", C["k5"][1], 30, TEAL))
    for k in range(3):
        s.append(f'<rect id="co_xt{k}" x="{1160 + k*200}" y="270" width="110" height="680" rx="18" fill="#3b2a1c" stroke="#c9a37a" stroke-width="5" opacity="0"/>')
        c.fade_in(f"#co_xt{k}", C["k5"][1] + 0.2 + k * 0.15, y=0)
    # water chain in the middle tube
    chain = []
    for j in range(9):
        chain.append(f"co_ch{j}"); s.append(mol(f"co_ch{j}", 1460, 900 - j * 72, 0.9, 180 if j % 2 else 0, 0))
    hbonds = []
    for j in range(8):
        hbonds.append(f"co_chb{j}"); s.append(hb(f"co_chb{j}", 1460, 900 - j * 72 - 30, 1460, 900 - (j + 1) * 72 + 30, 0, GOLD, 8))
    c.g(f'tl.to("{",".join("#"+x for x in chain)}",{{opacity:1,duration:0.3,stagger:0.08}},{C["k5"][1]+0.8:.2f});')
    c.cam(C["k5"][1] - 0.2, 1.0, 0, 0, 0.6)
    # {2}{3}: leaf section with stoma and guard cells
    hideall(c, ["#co_xc", "#co_xl"] + [f"#co_xt{k}" for k in range(3)] + ["#" + x for x in chain], C["k5"][2] - 0.3)
    s.append(leaf_section("co_lf", 960, 300, 0)); c.fade_in("#co_lf", C["k5"][2] - 0.2, y=20)
    s.append(chip("co_lfl", 1410, 250, "inside a leaf", WHITE, 36, 0)); c.pop("#co_lfl", C["k5"][2])
    s.append(chip("co_sto", 1410, 770, "stoma: a tiny pore", GOLD, 36, 0)); c.pop("#co_sto", C["k5"][2] + 0.3)
    s.append(chip("co_gcl", 1410, 860, "guard cells open and close it", GREEN, 34, 0)); c.pop("#co_gcl", C["k5"][3] + 0.2)
    c.g(f'tl.to("#co_lf_g1",{{x:-16,duration:0.6,yoyo:true,repeat:3,ease:"sine.inOut"}},{C["k5"][3]:.2f});tl.to("#co_lf_g2",{{x:16,duration:0.6,yoyo:true,repeat:3,ease:"sine.inOut"}},{C["k5"][3]:.2f});')
    # k6: vapor leaves the open stoma; transpiration
    c.g(f'tl.to("#co_lf_g1",{{x:-16,duration:0.5}},{T["k6"]:.2f});tl.to("#co_lf_g2",{{x:16,duration:0.5}},{T["k6"]:.2f});')
    for k in range(5):
        s.append(mol(f"co_v{k}", 1410 + (k - 2) * 26, 700, 0.55, k * 70, 0))
        c.g(f'tl.fromTo("#co_v{k}",{{opacity:1,y:0,x:0}},{{opacity:0,y:{170 + k*20},x:{(k-2)*50},duration:1.8,repeat:2,ease:"sine.out",immediateRender:false}},{T["k6"] + 0.4 + k*0.3:.2f});')
    s.append(chip("co_tp", 1410, 990, "transpiration: water vapor leaves the plant", GOLD, 34, 0)); c.pop("#co_tp", C["k6"][1])
    hideall(c, ["#co_lf", "#co_lfl", "#co_sto", "#co_gcl", "#co_tp"], C["k6"][2] - 0.3)
    # {2}-{4}: chain of molecules: top one leaves, pull ripples down to the roots
    c.fade_in("#co_xc", C["k6"][2] - 0.2, y=0); c.fade_in("#co_xt1", C["k6"][2] - 0.2, y=0)
    c.g(f'tl.to("{",".join("#"+x for x in chain)}",{{opacity:1,duration:0.3}},{C["k6"][2]-0.2:.2f});')
    c.g(f'tl.to("{",".join("#"+x for x in hbonds)}",{{opacity:1,duration:0.3,stagger:0.05}},{C["k6"][2]+0.2:.2f});')
    s.append(L(c, "co_chl", 1460, 230, "cohesion links one continuous chain", C["k6"][2] + 0.2, 32, GOLD))
    c.g(f'tl.to("#co_ch8",{{y:-140,opacity:0,duration:0.9,ease:"power2.in"}},{C["k6"][2]+1.2:.2f});tl.to("#co_chb7",{{opacity:0,duration:0.3}},{C["k6"][2]+1.2:.2f});')
    for j in range(8):
        c.g(f'tl.to("#co_ch{j}",{{y:-72,duration:0.5,ease:"power2.inOut"}},{C["k6"][3] + (7 - j) * 0.18:.2f});')
        c.g(f'tl.to("#co_chb{j}",{{y:-72,duration:0.5,ease:"power2.inOut"}},{C["k6"][3] + (7 - j) * 0.18:.2f});')
    s.append(f'<rect id="co_rip" x="1420" y="250" width="80" height="60" rx="30" fill="{GOLD}" opacity="0" filter="url(#blur6)"/>')
    c.g(f'tl.fromTo("#co_rip",{{opacity:.8,y:0}},{{opacity:.8,y:640,duration:1.6,ease:"none",immediateRender:false}},{C["k6"][3]:.2f});tl.to("#co_rip",{{opacity:0,duration:0.3}},{C["k6"][3]+1.6:.2f});')
    s.append(L(c, "co_pul", 1460, 1010, "the pull passes all the way down", C["k6"][3] + 0.3, 30, WHITE))
    for k in range(6):
        s.append(f'<circle id="co_sw{k}" cx="{300 + k*100}" cy="1110" r="10" fill="#7fd6ff" opacity="0"/>')
        c.g(f'tl.fromTo("#co_sw{k}",{{opacity:1,x:0,y:0}},{{opacity:0,x:{(560-(300+k*100))*0.8:.0f},y:-110,duration:1.4,repeat:1,ease:"sine.in",immediateRender:false}},{C["k6"][4] + k*0.15:.2f});')
    s.append(L(c, "co_rtl", 560, 1050, "roots draw in water from the soil", C["k6"][4], 30, "#7fd6ff"))
    hideall(c, ["#co_chl", "#co_pul", "#co_rtl"], T["k7"] - 0.1)
    # k7: adhesion to the walls, capillary is not enough, bubble breaks the chain
    for j in range(8):
        s.append(hb(f"co_wl{j}", 1405, 828 - j * 72, 1430, 828 - j * 72, 0, TEAL, 4) + hb(f"co_wr{j}", 1490, 828 - j * 72, 1515, 828 - j * 72, 0, TEAL, 4))
    c.g(f'tl.to("[id^=co_wl],[id^=co_wr]",{{opacity:1,duration:0.3,stagger:0.04}},{C["k7"][1]:.2f});')
    s.append(L(c, "co_adl", 1460, 230, "adhesion to the walls holds the column", C["k7"][1], 32, TEAL))
    c.hide("#co_adl", C["k7"][2] - 0.2)
    s.append(card("co_cap2", 40, 110, 470, 250, CORAL, op=0)); c.fade_in("#co_cap2", C["k7"][2], y=20)
    s.append(W(c, "co_c1", 70, 180, "capillary action alone:", C["k7"][2] + 0.2, 40, CORAL))
    s.append(W(c, "co_c2", 70, 250, "under 1 m in typical tubes,", C["k7"][2] + 1.4, 32, WHITE)); s.append(W(c, "co_c3", 70, 310, "a few m at most", C["k7"][2] + 2.6, 32, WHITE))
    s.append(arrow("co_lift", 560, 330, 560, 170, GOLD, 12)); c.draw("#co_lift", C["k7"][3], 0.6)
    for k in range(5):
        s.append(f'<circle id="co_tv{k}" cx="{440 + k*60}" cy="190" r="12" fill="#ffffff" opacity="0"/>')
        c.g(f'tl.fromTo("#co_tv{k}",{{opacity:.9,y:0}},{{opacity:0,y:-110,duration:1.4,repeat:3,ease:"sine.out",immediateRender:false}},{C["k7"][3] + k*0.2:.2f});')
    s.append(L(c, "co_toplab", 1460, 230, "the real lift: evaporation pulling from the top", C["k7"][3], 30, GOLD))
    s.append(f'<circle id="co_bub" cx="1460" cy="612" r="34" fill="#e8f8ff" stroke="#fff" stroke-width="4" opacity="0"/>')
    c.pop("#co_bub", C["k7"][4]); c.sound("pop", C["k7"][4], 0.45)
    c.g(f'tl.to("#co_chb3,#co_chb4",{{opacity:0,duration:0.2}},{C["k7"][4]:.2f});')
    s.append(chip("co_stop", 1460, 1010, "chain broken: that tube stops", CORAL, 34, 0)); c.pop("#co_stop", C["k7"][4] + 0.6)
    c.hide("#co_toplab", C["k7"][4])
    hideall(c, ["#co_cap2", "#co_c1", "#co_c2", "#co_c3", "#co_lift", "#co_bub", "#co_stop", "#co_xc", "#co_xt1", "#co_root"], T["c3q"] - 0.3)
    s.append('</g><g id="g_co4" opacity="0">' + water_bg("co_bg4", 1, 13))
    c.scene("#g_co4", T["c3q"] - 0.3, t1)
    s.append(qcheck(c, "qc3", "c3q", ["Which property carries the leaf's pull", "down to the roots: cohesion or adhesion?"]))
    s.append(W(c, "qc3_a1", 320, 600, "cohesion", T["c3a"] + 0.2, 60, GREEN))
    s.append(W(c, "qc3_a2", 320, 690, "hydrogen bonded molecules = one unbroken chain", C["c3a"][1], 40, WHITE))
    s.append(W(c, "qc3_a3", 320, 770, "adhesion holds that chain to the walls", C["c3a"][2], 40, TEAL))
    c.sound("ding", T["c3a"] + 0.2, 0.35)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- specific heat
MANIM_BOX = (1000, 300, 820, 560)   # x, y, w, h of the Manim graph overlay (composited after render; see manim_b01.py)

def heat(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "heat")
    s = ['<g id="g_ht" opacity="0">', water_bg("ht_bg", 1, 21, "#0f2242")]
    c.scene("#g_ht", t0 - 0.3, t1)
    # t1: a box of molecules; motion = kinetic energy; thermometer; heat flows hot to cold; joules
    s.append(f'<rect id="ht_box" x="300" y="300" width="640" height="520" rx="30" fill="url(#gWater)" opacity="0"/>'); c.fade_in("#ht_box", T["t1"], y=0)
    R = random.Random(8); bx = []
    for k in range(14):
        x = 360 + (k % 5) * 125 + R.uniform(-15, 15); y = 380 + (k // 5) * 160 + R.uniform(-15, 15)
        bx.append(f"ht_m{k}"); s.append(mol(f"ht_m{k}", x, y, 0.95, R.uniform(0, 360), 0))
    c.g(f'tl.to("{",".join("#"+x for x in bx)}",{{opacity:1,duration:0.3,stagger:0.03}},{T["t1"]+0.2:.2f});')
    jiggle(c, bx, T["t1"] + 0.3, C["t1"][2], 6, 1.0, 2)
    s.append(L(c, "ht_ke", 620, 240, "kinetic energy: energy of motion", C["t1"][1], 38, WHITE))
    s.append(thermo("ht_th", 1150, 760, 360, 0)); c.fade_in("#ht_th", C["t1"][2] - 0.2, y=0); c.set("#ht_th_f", 0, "scaleY:0.35")
    jiggle(c, bx, C["t1"][2], T["t2"], 16, 0.35, 3); set_level(c, "ht_th", C["t1"][2] + 0.4, 0.7, 1.6)
    s.append(L(c, "ht_tl", 1230, 450, "temperature = average kinetic energy", C["t1"][2] + 0.3, 34, CORAL, anchor="start"))
    s.append(L(c, "ht_tl2", 1230, 500, "(how fast the molecules move)", C["t1"][2] + 0.8, 30, INK, anchor="start"))
    s.append(f'<g id="ht_flame" opacity="0"><path d="M 620 900 Q 560 860 600 800 Q 610 840 640 830 Q 630 790 660 760 Q 700 830 680 860 Q 720 850 700 800 Q 760 860 700 900 Z" fill="#ff8a3c"/><path d="M 640 900 Q 610 870 640 840 Q 660 870 680 860 Q 690 885 660 900 Z" fill="#ffe07a"/></g>')
    c.fade_in("#ht_flame", C["t1"][3] - 0.2, y=10); c.pulse("#ht_flame", C["t1"][3], T["t2"], 1.06, 0.3); c.sound("ignite_real", C["t1"][3] - 0.1, 0.25)
    s.append(arrow("ht_ha", 640, 860, 640, 830, CORAL, 10, "ahc")); c.draw("#ht_ha", C["t1"][3] + 0.2, 0.5)
    s.append(L(c, "ht_hl", 1230, 600, "heat: energy flowing hotter → colder", C["t1"][3], 34, WARM, anchor="start"))
    s.append(L(c, "ht_jo", 1230, 700, "measured in joules (J)", C["t1"][4], 36, WHITE, anchor="start"))
    s.append(L(c, "ht_cal", 1230, 760, "1 food Calorie ≈ 4,200 J", C["t1"][4] + 1.6, 36, GOLD, anchor="start"))
    hideall(c, ["#ht_ke", "#ht_tl", "#ht_tl2", "#ht_hl", "#ht_jo", "#ht_cal", "#ht_flame", "#ht_ha"], T["t2"] - 0.1)
    # t2: definition card, water's number, bars
    s.append(card("ht_dc", 1050, 200, 790, 230, GOLD, op=0)); c.fade_in("#ht_dc", T["t2"], y=20)
    s.append(W(c, "ht_d1", 1090, 280, "specific heat:", T["t2"] + 0.2, 50, GOLD))
    s.append(W(c, "ht_d2", 1090, 350, "energy to raise 1 g by 1 °C", T["t2"] + 1.2, 40, WHITE))
    s.append(W(c, "ht_d3", 1090, 410, "water: 4.18 J/g·°C", C["t2"][1], 44, TEAL))
    s.append(f'<rect id="ht_bw" x="1250" y="560" width="120" height="360" rx="14" fill="{TEAL}" opacity="0" data-ob="1"/>')
    for k in range(4):
        s.append(f'<rect id="ht_bx{k}" x="{1430 + k*110}" y="{760 - k*25}" width="90" height="{160 + k*25}" rx="14" fill="{INK}" opacity="0" data-ob="1"/>')
    c.hide("#ht_th", T["t2"]); c.show("#ht_th", T["t3"] + 0.2)
    c.g(f'tl.fromTo("#ht_bw",{{opacity:1,scaleY:0}},{{scaleY:1,duration:0.8}},{C["t2"][2]:.2f});')
    c.g(f'tl.fromTo("[id^=ht_bx]",{{opacity:.8,scaleY:0}},{{scaleY:1,duration:0.6,stagger:0.1}},{C["t2"][2]+0.3:.2f});')
    s.append(L(c, "ht_bwl", 1310, 970, "water", C["t2"][2], 32, TEAL)); s.append(L(c, "ht_bol", 1635, 970, "most other liquids", C["t2"][2] + 0.4, 32, INK))
    hideall(c, ["#ht_dc", "#ht_d1", "#ht_d2", "#ht_d3", "#ht_bw", "#ht_bwl", "#ht_bol"] + [f"#ht_bx{k}" for k in range(4)], T["t3"] - 0.1)
    # t3: energy goes into breaking hydrogen bonds first
    links = []
    for k in range(13):
        if k % 5 == 4: continue
        links.append(f"ht_l{k}")
        x = 360 + (k % 5) * 125; y = 380 + (k // 5) * 160
        s.append(hb(f"ht_l{k}", x + 30, y, x + 95, y, 0, GOLD, 5))
    c.g(f'tl.to("{",".join("#"+x for x in links)}",{{opacity:1,duration:0.3,stagger:0.03}},{T["t3"]+0.2:.2f});')
    c.fade_in("#ht_flame", C["t3"][1] - 0.3, y=10); c.fade_in("#ht_ha", C["t3"][1] - 0.3, y=0)
    for i, l in enumerate(links):
        c.g(f'tl.to("#{l}",{{opacity:0,scale:1.4,transformOrigin:"50% 50%",duration:0.2}},{C["t3"][1] + 0.2 + i * 0.18:.2f});')
    c.sound("pop", C["t3"][1] + 0.3, 0.25); c.sound("pop", C["t3"][1] + 1.0, 0.2)
    s.append(L(c, "ht_br", 1230, 420, "energy goes into BREAKING bonds", C["t3"][1], 34, GOLD, anchor="start"))
    s.append(L(c, "ht_sl", 1230, 490, "molecules speed up only a little", C["t3"][2], 34, WHITE, anchor="start"))
    jiggle(c, bx, C["t3"][2], T["t4"], 8, 0.8, 5)
    c.set("#ht_th_f", T["t3"], "scaleY:0.35"); set_level(c, "ht_th", C["t3"][3], 0.45, 3.0, "none")
    s.append(L(c, "ht_slow", 1230, 560, "temperature climbs slowly", C["t3"][3], 34, CORAL, anchor="start"))
    c.hide("#ht_flame", C["t3"][4] - 0.2); c.hide("#ht_ha", C["t3"][4] - 0.2)
    c.g(f'tl.to("{",".join("#"+x for x in links)}",{{opacity:1,scale:1,duration:0.3,stagger:0.1}},{C["t3"][4]+0.2:.2f});')
    s.append(L(c, "ht_cool", 1230, 630, "cooling: bonds re-form, release energy", C["t3"][4] + 0.3, 34, TEAL, anchor="start"))
    hideall(c, ["#ht_box", "#ht_th", "#ht_br", "#ht_sl", "#ht_slow", "#ht_cool"] + ["#" + x for x in bx + links], T["t4"] - 0.1)
    # t4: worked example, whiteboard style; Manim graph appears at {5} in MANIM_BOX
    s.append(card("ht_wb", 80, 170, 880, 820, WHITE, fill="rgba(8,20,40,.85)", op=0)); c.fade_in("#ht_wb", T["t4"], y=20)
    s.append(W(c, "ht_q", 120, 260, "500 g of water, 20 → 30 °C", C["t4"][1], 48, WHITE)); c.sound("pen_scratch_real", C["t4"][1], 0.3)
    s.append(W(c, "ht_eq", 120, 380, "q = m · c · ΔT", C["t4"][2], 70, GOLD))
    for i, (lab, cue) in enumerate((("q = heat", 0.9), ("m = mass", 2.3), ("c = specific heat", 3.6), ("ΔT = change in temperature", 5.4))):
        s.append(L(c, f"ht_eql{i}", 140, 450 + i * 50, lab, C["t4"][2] + cue, 32, INK, anchor="start"))
    s.append(W(c, "ht_s1", 120, 730, "= 500 g × 4.18 J/g·°C × 10 °C", C["t4"][3], 44, WHITE)); c.sound("pen_scratch_real", C["t4"][3], 0.3)
    s.append(W(c, "ht_s2", 120, 830, "= 20,900 J", C["t4"][4], 70, GREEN)); c.sound("ding", C["t4"][4] + 0.5, 0.3)
    s.append(card("ht_mb", MANIM_BOX[0] - 20, MANIM_BOX[1] - 20, MANIM_BOX[2] + 40, MANIM_BOX[3] + 40, TEAL, op=0)); c.fade_in("#ht_mb", C["t4"][5] - 0.6, y=0)
    s.append(L(c, "ht_mt", MANIM_BOX[0] + MANIM_BOX[2] / 2, MANIM_BOX[1] - 40, "same energy, half the specific heat", C["t4"][5] - 0.4, 34, TEAL))
    hideall(c, ["#ht_wb", "#ht_q", "#ht_eq", "#ht_s1", "#ht_s2", "#ht_mb", "#ht_mt"] + [f"#ht_eql{i}" for i in range(4)], T["t5"] - 0.1)
    # t5: lake, coast vs inland, Jordan
    s.append(f'<g id="ht_lake" opacity="0"><rect x="120" y="380" width="520" height="420" rx="40" fill="#cfe7f5"/><ellipse cx="380" cy="640" rx="220" ry="90" fill="url(#gWater)"/>'
             f'<path d="M 140 760 L 620 760" stroke="#6f9e4e" stroke-width="30"/><text x="380" y="450" text-anchor="middle" font-family="Inter" font-weight="900" font-size="36" fill="#1b4f8f">big lake</text></g>')
    c.fade_in("#ht_lake", T["t5"], y=20)
    s.append(f'<path id="ht_lkg" d="M 160 560 Q 260 548 380 556 T 600 552" stroke="{TEAL}" stroke-width="6" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>')
    c.draw("#ht_lkg", T["t5"] + 0.6, 1.4)
    s.append(L(c, "ht_lkl", 380, 860, "temperature changes slowly", T["t5"] + 0.6, 30, WHITE))
    s.append(f'<g id="ht_cst" opacity="0"><rect x="700" y="380" width="520" height="420" rx="40" fill="#203a5e"/>'
             f'<rect x="700" y="640" width="200" height="160" fill="url(#gWater)"/>' + "".join(f'<rect x="{930+k*55}" y="{560-k*20}" width="44" height="{240+k*20}" fill="#9fb3cc"/>' for k in range(5)) + '</g>')
    c.fade_in("#ht_cst", C["t5"][1] - 0.2, y=20)
    s.append(L(c, "ht_csl", 960, 860, "coastal city: milder weather", C["t5"][1], 30, WHITE))
    s.append(jimg("ht_j", "jordan-drink", 1380, 900, 0.42, op=0)); c.fade_in("#ht_j", C["t5"][2] - 0.2, y=20)
    s.append(L(c, "ht_jl", 1520, 960, "body water steadies her temperature", C["t5"][2] + 0.2, 30, WHITE))
    c.sound("water_pour_real", C["t5"][2], 0.2)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- evaporation and sweat
def sweat(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "sweat")
    s = ['<g id="g_sw" opacity="0">', water_bg("sw_bg", 1, 31, "#0f2242")]
    c.scene("#g_sw", t0 - 0.3, T["t8"] - 0.1)
    # t6: definition and comparison bars
    s.append(card("sw_dc", 120, 200, 980, 230, GOLD, op=0)); c.fade_in("#sw_dc", C["t6"][1] - 0.2, y=20)
    s.append(W(c, "sw_d1", 160, 280, "heat of vaporization:", C["t6"][1], 50, GOLD))
    s.append(W(c, "sw_d2", 160, 350, "energy to turn 1 g of liquid into gas", C["t6"][1] + 1.2, 38, WHITE))
    s.append(W(c, "sw_d3", 160, 410, "water: about 2,260 J/g (at 100 °C)", C["t6"][2], 40, TEAL))
    s.append(MI("sw_pot", "pot-water-hot", 1260, 200, 520)); c.fade_in("#sw_pot", C["t6"][1], y=20); c.sound("bubbling_real", C["t6"][1] + 0.2, 0.25)
    s.append(f'<rect id="sw_bv" x="300" y="560" width="1100" height="90" rx="16" fill="{GOLD}" opacity="0" data-ol="1"/>')
    s.append(f'<rect id="sw_bh" x="300" y="700" width="200" height="90" rx="16" fill="{CORAL}" opacity="0" data-ol="1"/>')
    c.hide("#sw_pot", C["t6"][3]); c.g(f'tl.fromTo("#sw_bh",{{opacity:1,scaleX:0}},{{scaleX:1,duration:0.6}},{C["t6"][3]+0.3:.2f});tl.fromTo("#sw_bv",{{opacity:1,scaleX:0}},{{scaleX:1,duration:1.2}},{C["t6"][3]+1.0:.2f});')
    s.append(L(c, "sw_bvl", 1430, 618, "1 g: liquid → gas", C["t6"][3] + 1.6, 34, GOLD, anchor="start"))
    s.append(L(c, "sw_bhl", 530, 758, "1 g: heat from 0 to 100 °C", C["t6"][3] + 0.4, 34, CORAL, anchor="start"))
    s.append(chip("sw_5x", 850, 900, "more than 5 times", GOLD, 46, 0)); c.pop("#sw_5x", C["t6"][3] + 2.4)
    hideall(c, ["#sw_dc", "#sw_d1", "#sw_d2", "#sw_d3", "#sw_pot", "#sw_bv", "#sw_bh", "#sw_bvl", "#sw_bhl", "#sw_5x"], T["t7"] - 0.1)
    # t7: Servier skin block with its sweat gland; a sweat drop on the surface, molecules leave
    s.append(f'<g id="sw_skin" opacity="0">{medart.inline("skin", OUT, "swk", 90, 300, 640)}</g>')
    c.fade_in("#sw_skin", T["t7"] + 0.1, y=20)
    c.g(f'tl.to("#swk [fill=\\"#42875b\\"],#swk [fill=\\"#1c4713\\"]",{{fill:"#7fe8ff",duration:0.5,yoyo:true,repeat:3}},{T["t7"]+0.6:.2f});')
    s.append(L(c, "sw_gl", 410, 980, "sweat gland → sweat on the skin", T["t7"] + 0.6, 32, "#7fe8ff"))
    # zoomed drop: liquid surface with bonded molecules
    s.append(f'<g id="sw_drop" opacity="0"><path d="M 900 860 Q 900 420 1350 380 Q 1800 420 1800 860 Z" fill="url(#gWater)" stroke="#bfefff" stroke-width="5"/></g>')
    c.fade_in("#sw_drop", T["t7"] + 1.0, y=20)
    R = random.Random(12); dm = []
    for k in range(12):
        x = 1040 + (k % 6) * 120 + R.uniform(-10, 10); y = 560 + (k // 6) * 150 + R.uniform(-10, 10)
        dm.append(f"sw_m{k}"); s.append(mol(f"sw_m{k}", x, y, 0.95, R.uniform(0, 360), 0))
    c.g(f'tl.to("{",".join("#"+x for x in dm)}",{{opacity:1,duration:0.3,stagger:0.03}},{T["t7"]+1.3:.2f});')
    jiggle(c, dm, T["t7"] + 1.4, t1 - 3, 9, 0.6, 7)
    # the escaping molecule: fast (gold glow), bonds to neighbors break, flies off with speed lines
    s.append(f'<circle id="sw_fg" cx="1340" cy="470" r="70" fill="url(#gFast)" opacity="0"/>' + mol("sw_esc", 1340, 470, 1.0, 20, 0))
    for k, (x2, y2) in enumerate(((1220, 560), (1340, 590), (1460, 560))):
        s.append(hb(f"sw_eb{k}", 1340, 490, x2, y2 - 20, 0, GOLD, 5))
    c.fade_in("#sw_esc", T["t7"] + 1.3, y=0); c.g(f'tl.to("[id^=sw_eb]",{{opacity:1,duration:0.3}},{T["t7"]+1.6:.2f});')
    c.g(f'tl.to("[id^=sw_eb]",{{opacity:0,duration:0.15,stagger:0.25}},{C["t7"][1]+0.4:.2f});'); c.sound("pop", C["t7"][1] + 0.4, 0.3); c.sound("pop", C["t7"][1] + 0.9, 0.3)
    s.append(L(c, "sw_every", 1350, 300, "must break EVERY hydrogen bond", C["t7"][1], 38, GOLD))
    c.to("#sw_fg", C["t7"][2], "opacity:1", 0.3)
    c.g(f'tl.to("#sw_esc,#sw_fg",{{x:280,y:-320,duration:1.0,ease:"power2.in"}},{C["t7"][2]+0.4:.2f});'); c.sound("whoosh_real", C["t7"][2] + 0.4, 0.4)
    s.append(L(c, "sw_fast", 1350, 960, "only the fastest molecules make it out", C["t7"][2] + 0.2, 34, WHITE))
    s.append(chip("sw_en", 1060, 300, "carries energy away", GOLD, 34, 0)); c.pop("#sw_en", C["t7"][3])
    c.hide("#sw_every", C["t7"][3])
    # {4}: the molecules left behind slow down and turn cooler blue
    c.g(f'tl.to("{",".join("#"+x+"_O" for x in dm)}",{{fill:"#6aa8e8",duration:0.8}},{C["t7"][4]:.2f});')
    jiggle(c, dm, C["t7"][4], t1, 3, 1.2, 9)
    s.append(L(c, "sw_slow", 1350, 1010, "left behind: slower, so cooler", C["t7"][4] + 0.2, 34, BLUE))
    for k in range(3):
        s.append(arrow(f"sw_ha{k}", 760 + k * 40, 700 - k * 60, 980, 760 - k * 60, WARM, 9))
    c.g(f'tl.to("[id^=sw_ha]",{{strokeDashoffset:0,opacity:1,duration:0.6,stagger:0.2}},{C["t7"][5]+0.6:.2f});')
    s.append(L(c, "sw_soak", 640, 240, "cooler sweat soaks up heat from the skin", C["t7"][5] + 0.8, 34, WARM))
    s.append('</g>')
    # t8: back on the road with Jordan
    far_mid, fg = hot_road("rd2", op=1)
    s.append('<g id="g_sw2" opacity="0">' + far_mid)
    c.scene("#g_sw2", T["t8"] - 0.3, T["c4q"] - 0.1)
    road_motion(c, "rd2", T["t8"] - 0.3, T["c4q"]); steps(c, T["t8"], T["c4q"] - 0.5, 0.4)
    s.append(jimg("sw_j", "jordan-sprint", 520, 1010, 0.62, op=1)); bob(c, "#sw_j_b", T["t8"] - 0.3, T["c4q"])
    s.append(card("sw_tc", 1200, 220, 640, 260, WARM, op=0)); c.fade_in("#sw_tc", T["t8"] + 1.0, y=20)
    s.append(L(c, "sw_air", 1520, 300, "air: 33 °C", T["t8"] + 1.2, 44, WARM))
    s.append(L(c, "sw_sk2", 1520, 370, "almost as warm as her skin", T["t8"] + 2.4, 34, WHITE))
    s.append(L(c, "sw_left", 1520, 440, "→ evaporation is what's left", T["t8"] + 5.0, 34, GOLD))
    # vapor rising off her arms and face
    for k in range(10):
        x = 640 + (k % 5) * 70; y = 420 + (k // 5) * 160
        s.append(f'<circle id="sw_vp{k}" cx="{x}" cy="{y}" r="9" fill="#e8f8ff" opacity="0"/>')
        c.g(f'tl.fromTo("#sw_vp{k}",{{opacity:.9,y:0}},{{opacity:0,y:-160,duration:1.6,repeat:{int((T["c4q"]-C["t8"][1])/1.7)},ease:"sine.out",immediateRender:false}},{C["t8"][1] + k*0.17:.2f});')
    s.append(chip("sw_2k", 1520, 600, "> 2,000 J per gram of sweat", GOLD, 40, 0)); c.pop("#sw_2k", C["t8"][1] + 0.6)
    s.append(chip("sw_ec", 1520, 720, "evaporative cooling", TEAL, 46, 0)); c.pop("#sw_ec", C["t8"][2])
    s.append(card("sw_lc", 1300, 790, 440, 260, TEAL, op=0)); c.fade_in("#sw_lc", C["t8"][3] - 0.1, y=20)
    s.append(f'<g id="sw_leaf" opacity="0"><ellipse cx="1520" cy="900" rx="170" ry="70" fill="url(#gLeaf)" transform="rotate(-12 1520 900)"/><path d="M 1360 930 L 1690 870" stroke="#2c6b30" stroke-width="5"/></g>')
    c.fade_in("#sw_leaf", C["t8"][3], y=20)
    for k in range(4):
        s.append(f'<circle id="sw_lv{k}" cx="{1440 + k*55}" cy="860" r="8" fill="#e8f8ff" opacity="0"/>')
        c.g(f'tl.fromTo("#sw_lv{k}",{{opacity:.9,y:0}},{{opacity:0,y:-110,duration:1.4,repeat:2,ease:"sine.out",immediateRender:false}},{C["t8"][3] + 0.3 + k*0.2:.2f});')
    s.append(L(c, "sw_ll", 1520, 1010, "a leaf cools the same way", C["t8"][3] + 0.3, 32, WHITE))
    s.append(fg + '</g>')
    # quick check: a humid day
    s.append('<g id="g_sw3" opacity="0">' + water_bg("sw_bg3", 1, 33, "#1a2438"))
    c.scene("#g_sw3", T["c4q"] - 0.3, t1)
    s.append(qcheck(c, "qc4", "c4q", ["Humid day: sweat drips off instead of drying.", "Why do you feel hotter?"]))
    s.append(f'<g id="qc4_fog" opacity="0" filter="url(#blur14)">' + "".join(f'<ellipse cx="{200+k*260}" cy="{900 + (k%2)*40}" rx="200" ry="70" fill="#cdd8e6" opacity=".25"/>' for k in range(7)) + '</g>')
    c.fade_in("#qc4_fog", C["c4q"][1], y=0)
    s.append(jimg("qc4_j", "jordan-bent", 1500, 1070, 0.42, op=0)); c.fade_in("#qc4_j", C["c4q"][1], y=20)
    s.append(drops("qc4_d", 1560, 620, 6, "#cfefff", 0, 9)); c.set("#qc4_d", C["c4q"][1] + 0.4, "opacity:1"); fall(c, "#qc4_d path", C["c4q"][1] + 0.5, 1.2, 220, 4)
    s.append(W(c, "qc4_a1", 320, 600, "cooling needs EVAPORATION", T["c4a"] + 0.2, 52, GREEN))
    s.append(W(c, "qc4_a2", 320, 690, "humid air is already full of vapor", C["c4a"][1], 40, WHITE))
    s.append(W(c, "qc4_a3", 320, 770, "→ sweat evaporates slowly and drips off", C["c4a"][1] + 2.0, 40, WHITE))
    c.sound("ding", T["c4a"] + 0.2, 0.35)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- ice
def hex_lattice(prefix, cx, cy, r=120, s=0.9):
    """open six sided ring layout: positions of 2 rings of molecules (ice)"""
    pts = []
    for ring in range(2):
        ox = cx + (ring - 0.5) * r * 1.75
        for k in range(6):
            a = math.radians(60 * k + 30)
            pts.append((ox + r * math.cos(a), cy + r * math.sin(a)))
    uniq = []
    for p in pts:
        if all((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 > 400 for q in uniq): uniq.append(p)
    return uniq

def ice(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "ice")
    s = ['<g id="g_ic" opacity="0">', water_bg("ic_bg", 1, 41, "#0d2140")]
    c.scene("#g_ic", t0 - 0.3, t1)
    # density: same box, more vs fewer dots
    s.append(card("ic_dc", 120, 170, 760, 120, TEAL, op=0)); c.fade_in("#ic_dc", T["i1"] + 0.1, y=20)
    s.append(W(c, "ic_d", 160, 248, "density: mass packed into a space", T["i1"] + 0.3, 40, TEAL))
    s.append(L(c, "ic_most", 500, 360, "most substances: solid sinks", T["i1"] + 3.4, 34, INK))
    s.append(chip("ic_exc", 500, 440, "water: a famous exception", GOLD, 40, 0)); c.pop("#ic_exc", C["i1"][1])
    # liquid jumble -> lattice
    pts = hex_lattice("ic", 1320, 560, 150)
    R = random.Random(14); im = []
    for k, (x, y) in enumerate(pts):
        jx, jy = 1320 + R.uniform(-260, 260), 560 + R.uniform(-180, 180)
        im.append((f"ic_m{k}", x, y, jx, jy))
        s.append(f'<g id="ic_mw{k}">' + mol(f"ic_m{k}", x, y, 1.1, R.uniform(0, 360), 0) + '</g>')
        c.set(f"#ic_mw{k}", 0, f"x:{jx - x:.0f},y:{jy - y:.0f}")
    c.g(f'tl.to("{",".join("#"+m[0] for m in im)}",{{opacity:1,duration:0.4,stagger:0.04}},{T["i1"]+0.4:.2f});')
    jiggle(c, [m[0] for m in im], T["i1"] + 0.5, C["i1"][2], 18, 0.35, 6)
    jiggle(c, [m[0] for m in im], C["i1"][2], C["i1"][3], 6, 0.9, 7)
    s.append(L(c, "ic_cool", 1320, 230, "cooling toward 0 °C: molecules slow down", C["i1"][2], 34, BLUE))
    for k, (id, x, y, jx, jy) in enumerate(im):
        c.g(f'tl.to("#ic_mw{k}",{{x:0,y:0,duration:1.2,ease:"power3.inOut"}},{C["i1"][3] + k*0.05:.2f});')
    lines = []
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            d = math.dist(pts[i], pts[j])
            if d < 160:
                lines.append(f"ic_l{i}_{j}"); s.append(hb(f"ic_l{i}_{j}", *pts[i], *pts[j], 0, GOLD, 5))
    c.g(f'tl.to("{",".join("#"+x for x in lines)}",{{opacity:1,duration:0.3,stagger:0.05}},{C["i1"][3]+1.3:.2f});')
    s.append(L(c, "ic_4", 1320, 900, "hydrogen bonds lock at fixed angles", C["i1"][3] + 0.8, 30, GOLD))
    s.append(f'<polygon id="ic_gap" points="{" ".join(f"{1320 - 150*0.875 + 150*math.cos(math.radians(60*k+30)):.0f},{560 + 150*math.sin(math.radians(60*k+30)):.0f}" for k in range(6))}" fill="{TEAL}" opacity="0"/>')
    c.to("#ic_gap", C["i1"][4], "opacity:.25", 0.5); c.pulse("#ic_gap", C["i1"][4] + 0.5, C["i1"][4] + 3.5, 1.05, 0.6)
    s.append(chip("ic_open", 1320, 1000, "an open six sided grid", TEAL, 40, 0)); c.pop("#ic_open", C["i1"][4] + 0.4)
    hideall(c, ["#ic_dc", "#ic_d", "#ic_most", "#ic_exc", "#ic_cool", "#ic_4"], T["i2"] - 0.1)
    # i2: glass of water with a floating ice cube
    s.append(MI("ic_gw", "glass-water", 330, 330, 300)); c.fade_in("#ic_gw", T["i2"], y=20); c.sound("glass_clink_real", T["i2"] + 0.2, 0.35)
    s.append(f'<rect id="ic_cube" x="410" y="470" width="140" height="110" rx="16" fill="url(#gIce)" opacity="0"/>')
    c.g(f'tl.fromTo("#ic_cube",{{opacity:1,y:-260}},{{y:0,duration:0.9,ease:"bounce.out",immediateRender:false}},{T["i2"]+0.4:.2f});'); c.sound("splash_real", T["i2"] + 1.0, 0.25)
    c.g(f'tl.to("#ic_cube",{{y:8,duration:1.0,yoyo:true,repeat:{int((T["i3"]-T["i2"])/1.0)},ease:"sine.inOut"}},{T["i2"]+1.4:.2f});')
    s.append(L(c, "ic_fewer", 480, 300, "fewer molecules in the same space", T["i2"] + 0.4, 34, WHITE))
    s.append(chip("ic_8", 480, 980, "about 8% less dense → floats", GOLD, 40, 0)); c.pop("#ic_8", C["i2"][1])
    hideall(c, ["#ic_gw", "#ic_cube", "#ic_fewer", "#ic_8", "#ic_gap", "#ic_open"] + ["#ic_mw" + str(k) for k in range(len(im))] + ["#" + x for x in lines], T["i3"] - 0.1)
    # i3: a pond in winter: ice on top, fish in liquid water below
    s.append(f'<g id="ic_pond" opacity="0"><rect x="160" y="300" width="1600" height="700" rx="40" fill="#cfe0ee"/>'
             f'<rect x="200" y="420" width="1520" height="540" rx="20" fill="url(#gWater)"/>'
             f'<rect id="ic_layer" x="200" y="420" width="1520" height="70" fill="url(#gIce)" data-ol="1"/></g>')
    c.fade_in("#ic_pond", T["i3"], y=20)
    c.g(f'tl.fromTo("#ic_layer",{{scaleX:0}},{{scaleX:1,duration:1.4,ease:"power2.out",immediateRender:false}},{C["i3"][1]:.2f});')
    s.append(L(c, "ic_top", 960, 380, "freezes from the top down", C["i3"][1], 36, "#1b3a5e"))
    s.append(L(c, "ic_ins", 960, 540, "ice layer on top insulates the water below", C["i3"][2], 34, WHITE))
    s.append(f'<g id="ic_fish" opacity="0">{medart.image("fish-1", OUT, 700, 700, 420)}</g>'); c.fade_in("#ic_fish", C["i3"][3] - 0.2, y=0)
    c.g(f'tl.fromTo("#ic_fish",{{x:-200}},{{x:300,duration:{t1 - C["i3"][3]:.1f},ease:"sine.inOut",immediateRender:false}},{C["i3"][3]:.2f});')
    s.append(L(c, "ic_liq", 960, 920, "fish stay in liquid water all winter", C["i3"][3] + 0.3, 34, WHITE))
    s.append(f'<g id="ic_sink" opacity="0"><rect x="200" y="840" width="1520" height="120" fill="url(#gIce)" opacity=".85"/>'
             f'<text x="960" y="915" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="#b8333f">if ice sank: frozen from the bottom up ✗</text></g>')
    c.fade_in("#ic_sink", C["i3"][4], y=40); c.sound("wrong", C["i3"][4], 0.3)
    c.hide("#ic_liq", C["i3"][4] - 0.2)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- solvent
def solvent(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "solvent")
    s = ['<g id="g_sv" opacity="0">', water_bg("sv_bg", 1, 51, "#0e2546")]
    c.scene("#g_sv", t0 - 0.3, t1)
    s.append(MI("sv_bk", "Beaker_water", 120, 300, 420)); c.fade_in("#sv_bk", T["v1"] + 0.1, y=20)
    s.append(L(c, "sv_sol", 330, 250, "solution: one substance spread evenly through another", T["v1"] + 0.4, 32, WHITE, anchor="start"))
    s.append(L(c, "sv_ute", 640, 520, "solute: what gets dissolved", C["v1"][1], 38, GOLD, anchor="start"))
    s.append(L(c, "sv_vnt", 640, 600, "solvent: what does the dissolving", C["v1"][2], 38, TEAL, anchor="start"))
    s.append(chip("sv_uni", 1060, 760, '"the universal solvent" (not quite everything)', WHITE, 34, 0)); c.pop("#sv_uni", C["v1"][3])
    hideall(c, ["#sv_bk", "#sv_sol", "#sv_ute", "#sv_vnt", "#sv_uni"], T["v2"] - 0.1)
    # v2: salt crystal; electron moves Na -> Cl; ionic bond
    s.append(MI("sv_shk", "salt", 120, 260, 220)); c.fade_in("#sv_shk", T["v2"], y=-20); c.sound("glass_clink_real", T["v2"] + 0.3, 0.3)
    CX, CY, SP = 760, 560, 92
    ions = []
    for i in range(4):
        for j in range(4):
            na = (i + j) % 2 == 0
            ions.append((f"sv_i{i}{j}", CX + i * SP, CY + j * SP, na))
            s.append(f'<g id="sv_i{i}{j}" opacity="0"><circle cx="{CX + i*SP}" cy="{CY + j*SP}" r="{30 if na else 42}" fill="url(#{"gNa" if na else "gCl"})"/>'
                     f'<text class="sv_ch" x="{CX + i*SP}" y="{CY + j*SP + 12}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#fff" opacity="0">{"+" if na else "−"}</text></g>')
    c.g(f'tl.to("{",".join("#"+i[0] for i in ions)}",{{opacity:1,duration:0.3,stagger:0.04}},{C["v2"][1]:.2f});')
    s.append(L(c, "sv_nacl", CX + 140, CY - 90, "sodium chloride, NaCl", C["v2"][1] + 0.2, 38, WHITE))
    s.append(f'<circle id="sv_e" cx="{CX}" cy="{CY}" r="11" fill="#7fe8ff" opacity="0"/>')
    c.g(f'tl.fromTo("#sv_e",{{opacity:1,x:0}},{{x:{SP},duration:1.0,ease:"power2.inOut",immediateRender:false}},{C["v2"][2]+0.2:.2f});tl.to("#sv_e",{{opacity:0,duration:0.2}},{C["v2"][2]+1.3:.2f});')
    c.g(f'tl.to(".sv_ch",{{opacity:1,duration:0.4}},{C["v2"][3]:.2f});')
    s.append(L(c, "sv_na", 1320, 470, "Na⁺: sodium ion (positive)", C["v2"][3], 34, "#c7b4ff", anchor="start"))
    s.append(L(c, "sv_cl", 1320, 540, "Cl⁻: chloride ion (negative)", C["v2"][3] + 1.5, 34, "#a8f0a0", anchor="start"))
    s.append(L(c, "sv_ib", 1320, 640, "opposite ions attract: ionic bond", C["v2"][4], 34, GOLD, anchor="start"))
    hideall(c, ["#sv_nacl", "#sv_na", "#sv_cl", "#sv_ib", "#sv_shk"], T["v3"] - 0.1)
    # v3: water turns O toward Na+, H toward Cl-; corner ions pulled out with their shells
    na_t, cl_t = ("sv_i00", CX, CY), ("sv_i10", CX + SP, CY)
    for k in range(4):
        a = math.radians(180 + k * 45 - 70)
        x, y = CX + 135 * math.cos(a), CY + 135 * math.sin(a)
        rot = math.degrees(a) + 90 - 180  # Hs point away from Na (O faces the ion)
        s.append(f'<g id="sv_wn{k}">' + mol(f"sv_wn{k}m", x, y, 0.95, math.degrees(a) - 90 + 180 - 180 + 0, 0) + '</g>')
    for k in range(4):
        a = math.radians(-150 + k * 40)
        x, y = CX + SP + 150 * math.cos(a), CY + 150 * math.sin(a)
        s.append(f'<g id="sv_wc{k}">' + mol(f"sv_wc{k}m", x, y, 0.95, math.degrees(a) + 90, 0) + '</g>')
    c.g(f'tl.to("#sv_wn0,#sv_wn1,#sv_wn2,#sv_wn3,#sv_wn0m,#sv_wn1m,#sv_wn2m,#sv_wn3m",{{opacity:1,duration:0.4,stagger:0.12}},{C["v3"][1]:.2f});')
    c.g(f'tl.to("#sv_wc0,#sv_wc1,#sv_wc2,#sv_wc3,#sv_wc0m,#sv_wc1m,#sv_wc2m,#sv_wc3m",{{opacity:1,duration:0.4,stagger:0.12}},{C["v3"][2]:.2f});')
    s.append(L(c, "sv_on", 520, 960, "oxygen (δ−) faces Na⁺", C["v3"][1] + 0.2, 40, NEG))
    s.append(L(c, "sv_hc", 1400, 960, "hydrogens (δ+) face Cl⁻", C["v3"][2] + 0.2, 40, POS))
    c.g(f'tl.to("#sv_i00,#sv_wn0,#sv_wn1,#sv_wn2,#sv_wn3",{{x:-260,y:-60,duration:1.4,ease:"power2.inOut"}},{C["v3"][3]:.2f});')
    c.g(f'tl.to("#sv_i10,#sv_wc0,#sv_wc1,#sv_wc2,#sv_wc3",{{x:420,y:-120,duration:1.4,ease:"power2.inOut"}},{C["v3"][3]+0.3:.2f});')
    s.append(L(c, "sv_pull", 960, 1035, "shells of water pull the ions out and keep them apart", C["v3"][3] + 0.3, 34, WHITE))
    c.g(f'tl.to("{",".join("#"+i[0] for i in ions if i[0] not in ("sv_i00","sv_i10"))}",{{x:"random(-500,500)",y:"random(-300,300)",opacity:0.0,duration:1.6,stagger:0.05}},{C["v3"][4]:.2f});')
    s.append(chip("sv_dis", 960, 250, "the salt dissolves", GREEN, 44, 0)); c.pop("#sv_dis", C["v3"][4] + 0.4)
    hideall(c, ["#sv_i00", "#sv_i10", "#sv_wn0,#sv_wn1,#sv_wn2,#sv_wn3", "#sv_wc0,#sv_wc1,#sv_wc2,#sv_wc3", "#sv_on", "#sv_hc", "#sv_pull", "#sv_dis"], T["v4"] - 0.1)
    # v4: glucose drawn by RDKit, OH groups highlighted, water hydrogen bonds to them
    glc = "OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O"
    s.append(f'<g id="sv_glc" opacity="0">' + chem.mol2d(glc, OUT, "glc", x=520, y=280, w=880, h=600, bond_px=5) + '</g>')
    c.fade_in("#sv_glc", T["v4"], y=20)
    s.append(L(c, "sv_gl", 960, 230, "sugar (glucose): covered in O–H groups", T["v4"] + 0.4, 38, WHITE))
    from rdkit import Chem as _Ch
    oxy = [a.GetIdx() for a in _Ch.MolFromSmiles(glc).GetAtoms() if a.GetSymbol() == "O" and a.GetTotalNumHs() == 1]
    s.append(f'<g id="sv_glh" opacity="0">' + chem.mol2d(glc, OUT, "glch", x=520, y=280, w=880, h=600, bond_px=5, highlight=oxy) + '</g>')
    c.to("#sv_glh", T["v4"] + 2.0, "opacity:1", 0.5); c.sound("pop", T["v4"] + 2.0, 0.25)
    for k in range(6):
        a = math.radians(k * 60 + 15)
        s.append(mol(f"sv_gw{k}", 960 + 470 * math.cos(a), 590 + 330 * math.sin(a), 0.95, k * 60 + 15 + 90, 0))
    c.g(f'tl.to("#sv_gw0,#sv_gw1,#sv_gw2,#sv_gw3,#sv_gw4,#sv_gw5",{{opacity:1,duration:0.4,stagger:0.15}},{T["v4"]+2.2:.2f});')
    c.g(f'tl.to("#sv_gw0,#sv_gw1,#sv_gw2,#sv_gw3,#sv_gw4,#sv_gw5",{{x:"random(-40,40)",y:"random(-30,30)",duration:0.8,yoyo:true,repeat:5,ease:"sine.inOut"}},{T["v4"]+3.0:.2f});')
    s.append(chip("sv_hyd", 960, 980, "hydrophilic: water loving", TEAL, 44, 0)); c.pop("#sv_hyd", C["v4"][1])
    hideall(c, ["#sv_glc", "#sv_glh", "#sv_gl", "#sv_gw0,#sv_gw1,#sv_gw2,#sv_gw3,#sv_gw4,#sv_gw5", "#sv_hyd"], T["v5"] - 0.1)
    # v5: oil (hexane drawn by RDKit), no partial charges, squeezed into drops
    s.append(f'<g id="sv_hex" opacity="0">' + chem.mol2d("CCCCCC", OUT, "hex", x=120, y=290, w=780, h=360, bond_px=5, hs=True) + '</g>')
    c.fade_in("#sv_hex", C["v5"][1] - 0.3, y=20)
    s.append(L(c, "sv_ch2", 500, 260, "oil: mostly carbon and hydrogen", C["v5"][1], 36, GOLD))
    s.append(L(c, "sv_nop", 500, 670, "C and H pull about equally → no partial charges", C["v5"][2], 32, WHITE))
    s.append(f'<g id="sv_tank" opacity="0"><rect x="980" y="300" width="800" height="600" rx="30" fill="url(#gWater)"/></g>'); c.fade_in("#sv_tank", C["v5"][2] + 0.4, y=0)
    R = random.Random(15)
    for k in range(9):
        x, y = 1060 + R.uniform(0, 640), 360 + R.uniform(0, 480)
        s.append(f'<ellipse id="sv_od{k}" cx="{x:.0f}" cy="{y:.0f}" rx="{R.uniform(22,40):.0f}" ry="{R.uniform(16,28):.0f}" fill="url(#gOil)" opacity="0"/>')
        c.g(f'tl.to("#sv_od{k}",{{opacity:1,duration:0.3}},{C["v5"][2]+0.6+k*0.05:.2f});tl.to("#sv_od{k}",{{x:{1380 - x:.0f},y:{560 - y:.0f},duration:1.6,ease:"power2.inOut"}},{C["v5"][3]+k*0.08:.2f});')
    s.append(f'<ellipse id="sv_big" cx="1380" cy="560" rx="120" ry="80" fill="url(#gOil)" opacity="0"/>'); c.to("#sv_big", C["v5"][4], "opacity:1", 0.5)
    c.g(f'tl.to("[id^=sv_od]",{{opacity:0,duration:0.3}},{C["v5"][4]+0.3:.2f});')
    s.append(L(c, "sv_sq", 1380, 270, "water bonds to water and squeezes the oil out", C["v5"][3], 30, WHITE))
    s.append(chip("sv_phob", 1380, 980, "hydrophobic: water avoiding", CORAL, 44, 0)); c.pop("#sv_phob", C["v5"][5])
    c.sound("water_pour_real", C["v5"][3], 0.15)
    hideall(c, ["#sv_hex", "#sv_ch2", "#sv_nop", "#sv_tank", "#sv_big", "#sv_sq", "#sv_phob"], T["c5q"] - 0.1)
    s.append(qcheck(c, "qc5", "c5q", ["Which part of a water molecule", "faces a chloride ion?"]))
    s.append(W(c, "qc5_a1", 320, 600, "the hydrogen side (δ+)", T["c5a"] + 0.2, 56, GREEN))
    s.append(W(c, "qc5_a2", 320, 690, "chloride is negative: opposites attract", T["c5a"] + 1.8, 40, WHITE))
    s.append(card("qc5_tc", 300, 800, 1320, 110, CORAL, op=0)); c.fade_in("#qc5_tc", C["c5a"][1], y=10); c.sound("wrong", C["c5a"][1], 0.4)
    s.append(W(c, "qc5_tr", 340, 872, '<tspan fill="#ff6b6b">trap:</tspan> oxygen faces the POSITIVE sodium', C["c5a"][1] + 0.3, 40))
    c.sound("ding", T["c5a"] + 0.2, 0.35)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- pH
def ph(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "ph")
    s = ['<g id="g_ph" opacity="0">', water_bg("ph_bg", 1, 61, "#0e2546")]
    c.scene("#g_ph", t0 - 0.3, t1)
    # p1: one molecule hands H+ to its neighbour
    s.append(mol("ph_a", 640, 520, 2.4, -60, 0)); s.append(mol("ph_b", 1200, 540, 2.4, 120, 0))
    c.fade_in("#ph_a", T["p1"] + 0.1, y=0); c.fade_in("#ph_b", T["p1"] + 0.1, y=0)
    s.append(L(c, "ph_nh", 960, 220, "this isn't heat: one molecule hands H⁺ to a neighbor", T["p1"] + 0.3, 36, WHITE))
    (hx, hy), _ = hpos(-60, 48 * 2.4)
    c.g(f'tl.to("#ph_a_H1",{{attr:{{cx:{(1200-110 - 640)/2.4:.1f},cy:{(540-30-520)/2.4:.1f}}},duration:1.2,ease:"power2.inOut"}},{C["p1"][1]-0.6:.2f});')
    c.sound("pop", C["p1"][1] + 0.6, 0.35)
    s.append(L(c, "ph_hp", 1240, 760, "H⁺ = a proton, riding on the neighbor", C["p1"][1] + 0.2, 34, POS))
    s.append(txt("ph_bp", 1300, 400, "+", 70, POS, weight=900)); c.pop("#ph_bp", C["p1"][1] + 0.8)
    s.append(txt("ph_am", 560, 380, "−", 80, NEG, weight=900)); c.pop("#ph_am", C["p1"][2])
    s.append(L(c, "ph_oh", 640, 760, "left behind: OH⁻, hydroxide ion", C["p1"][2] + 0.2, 34, NEG))
    s.append(chip("ph_eq", 960, 940, "pure water: equal numbers of H⁺ and OH⁻", GOLD, 38, 0)); c.pop("#ph_eq", C["p1"][3])
    hideall(c, ["#ph_a", "#ph_b", "#ph_nh", "#ph_hp", "#ph_bp", "#ph_am", "#ph_oh", "#ph_eq"], T["p2"] - 0.1)
    # p2: acid adds H+, base lowers it
    s.append(card("ph_ac", 160, 280, 740, 520, CORAL, op=0)); c.fade_in("#ph_ac", T["p2"], y=20)
    s.append(W(c, "ph_at", 530, 370, "acid", T["p2"] + 0.2, 64, CORAL, anchor="middle"))
    s.append(W(c, "ph_ad", 530, 450, "adds H⁺", T["p2"] + 0.8, 44, WHITE, anchor="middle"))
    for k in range(6):
        s.append(f'<g id="ph_ah{k}" opacity="0"><circle cx="{300 + k*80}" cy="620" r="24" fill="{POS}"/><text x="{300 + k*80}" y="632" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#fff">+</text></g>')
        c.fade_in(f"#ph_ah{k}", T["p2"] + 1.0 + k * 0.15, y=-60)
    s.append(card("ph_bc", 1020, 280, 740, 520, BLUE, op=0)); c.fade_in("#ph_bc", C["p2"][1], y=20)
    s.append(W(c, "ph_bt", 1390, 370, "base", C["p2"][1] + 0.2, 64, BLUE, anchor="middle"))
    s.append(W(c, "ph_bd", 1390, 450, "lowers H⁺", C["p2"][1] + 0.8, 44, WHITE, anchor="middle"))
    s.append(L(c, "ph_b1", 1390, 560, "grabs H⁺, or adds OH⁻", C["p2"][1] + 1.6, 34, INK))
    s.append(L(c, "ph_b2", 1390, 700, "OH⁻ + H⁺ → H₂O", C["p2"][1] + 3.0, 44, GOLD))
    hideall(c, ["#ph_ac", "#ph_at", "#ph_ad", "#ph_bc", "#ph_bt", "#ph_bd", "#ph_b1", "#ph_b2"] + [f"#ph_ah{k}" for k in range(6)], T["p3"] - 0.1)
    # p3: the scale, backwards, x10 per step
    s.append(f'<rect id="ph_bar" x="160" y="420" width="1600" height="90" rx="45" fill="url(#gPH)" opacity="0"/>'); c.fade_in("#ph_bar", T["p3"] + 0.1, y=0)
    for k in range(15):
        s.append(txt(f"ph_num{k}", 200 + k * (1520 / 14), 580, str(k), 40, WHITE, weight=900))
    c.g(f'tl.to("[id^=ph_num]",{{opacity:1,duration:0.2,stagger:0.05}},{C["p3"][1]:.2f});')
    s.append(f'<path id="ph_7" d="M 960 380 L 960 540" stroke="#fff" stroke-width="8" opacity="0"/>'); c.to("#ph_7", C["p3"][1] + 1.8, "opacity:1", 0.3)
    s.append(L(c, "ph_7l", 960, 350, "7: neutral (pure water)", C["p3"][1] + 1.8, 38, WHITE))
    s.append(arrow("ph_al", 900, 660, 260, 660, CORAL, 10, "ahc")); c.draw("#ph_al", C["p3"][2], 0.8)
    s.append(L(c, "ph_all", 580, 720, "acidic: MORE H⁺", C["p3"][2] + 0.4, 40, CORAL))
    s.append(arrow("ph_ar", 1020, 660, 1660, 660, BLUE, 10)); c.draw("#ph_ar", C["p3"][3], 0.8)
    s.append(L(c, "ph_arl", 1340, 720, "basic: less H⁺", C["p3"][3] + 0.3, 40, BLUE))
    s.append(chip("ph_x10", 960, 230, "each step = ×10", GOLD, 52, 0)); c.pop("#ph_x10", C["p3"][4] + 0.6)
    # {5}: pH 7 -> 6: ten times the H+ dots
    s.append(f'<g id="ph_box7" opacity="0"><rect x="380" y="800" width="420" height="220" rx="20" fill="#13325c" stroke="{WHITE}" stroke-width="3"/><circle cx="590" cy="910" r="14" fill="{POS}"/><text x="590" y="790" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="#fff">pH 7</text></g>')
    R = random.Random(66)
    s.append(f'<g id="ph_box6" opacity="0"><rect x="1120" y="800" width="420" height="220" rx="20" fill="#13325c" stroke="{CORAL}" stroke-width="3"/>'
             + "".join(f'<circle cx="{1160 + R.uniform(0,340):.0f}" cy="{830 + R.uniform(0,160):.0f}" r="14" fill="{POS}"/>' for _ in range(10))
             + f'<text x="1330" y="790" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="{CORAL}">pH 6: 10× the H⁺</text></g>')
    hideall(c, ["#ph_al", "#ph_all", "#ph_ar", "#ph_arl"], C["p3"][5] - 0.2)
    c.fade_in("#ph_box7", C["p3"][5], y=20); c.fade_in("#ph_box6", C["p3"][5] + 1.2, y=20); c.sound("pop", C["p3"][5] + 1.3, 0.3)
    hideall(c, ["#ph_bar", "[id^=ph_num]", "#ph_7", "#ph_7l", "#ph_x10", "#ph_box7", "#ph_box6"], T["p4"] - 0.1)
    # p4: blood buffer
    s.append(f'<g id="ph_blood" opacity="0"><path d="M 420 300 Q 560 520 560 640 A 140 140 0 0 1 280 640 Q 280 520 420 300 Z" fill="#c8323e"/><path d="M 360 600 Q 360 520 400 470" stroke="#ff9aa2" stroke-width="10" fill="none" stroke-linecap="round"/></g>')
    c.fade_in("#ph_blood", T["p4"], y=20)
    s.append(L(c, "ph_74", 420, 860, "blood: pH 7.4", T["p4"] + 0.4, 46, WHITE))
    s.append(card("ph_buf", 760, 300, 1040, 520, GOLD, op=0)); c.fade_in("#ph_buf", C["p4"][1] - 0.2, y=20)
    s.append(W(c, "ph_bu1", 800, 380, "buffer: soaks up H⁺ when too many,", C["p4"][1], 40, GOLD))
    s.append(W(c, "ph_bu2", 800, 440, "releases H⁺ when too few", C["p4"][1] + 1.6, 40, GOLD))
    s.append(L(c, "ph_ca", 1050, 600, "carbonic acid", C["p4"][2], 40, WHITE)); s.append(L(c, "ph_bi", 1550, 600, "bicarbonate", C["p4"][2] + 0.4, 40, WHITE))
    s.append(f'<circle id="ph_hh" cx="1300" cy="700" r="22" fill="{POS}" opacity="0"/>'); c.to("#ph_hh", C["p4"][2] + 0.8, "opacity:1", 0.2)
    c.g(f'tl.to("#ph_hh",{{x:-200,duration:0.8,yoyo:true,repeat:3,ease:"sine.inOut"}},{C["p4"][2]+1.0:.2f});')
    s.append(chip("ph_rem", 960, 980, "for now: the scale, and ×10 per step", TEAL, 40, 0)); c.pop("#ph_rem", C["p4"][3])
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- recap
def recap(c):
    T, C = c.T, c.C
    t0, t1 = chapter_span(c, "recap")
    s = ['<g id="g_rc" opacity="0">', water_bg("rc_bg", 1, 71)]
    c.scene("#g_rc", t0 - 0.3, t1)
    s.append(mol("rc_m1", 860, 540, 1.6, 30, 0, True, True)); s.append(mol("rc_m2", 1080, 540, 1.6, -150, 0, True, True))
    c.fade_in("#rc_m1", T["r1"], y=0); c.fade_in("#rc_m2", T["r1"], y=0)
    for m in ("rc_m1", "rc_m2"):
        for p in ("hn", "hp1", "hp2", "dm", "dp1", "dp2"): c.to(f"#{m}_{p}", C["r1"][1] + 0.3, "opacity:1", 0.4)
    s.append(L(c, "rc_pol", 960, 380, "O pulls harder + bent = polar", C["r1"][1] + 0.2, 34, WHITE))
    (hx, hy), _ = hpos(30, 48 * 1.6)
    s.append(hb("rc_hb", 860 + hx, 540 + hy, 1080 - 40, 540, 0, GOLD, 6)); c.to("#rc_hb", C["r1"][2], "opacity:1", 0.3)
    s.append(L(c, "rc_hbl", 960, 730, "hydrogen bonds", C["r1"][2] + 0.2, 40, GOLD))
    panels = [(80, 140, "cohesion · surface tension", "water sticks to water", TEAL, ("r1", 4)),
              (1360, 140, "adhesion · capillary action", "sticks to polar surfaces", TEAL, ("r1", 5)),
              (80, 420, "high specific heat", "energy breaks bonds first", WARM, ("r2", 1)),
              (1360, 420, "high heat of vaporization", "breaks ALL bonds: sweat cools", WARM, ("r2", 2)),
              (80, 700, "ice floats", "bonds lock an open lattice", ICE, ("r2", 3)),
              (1360, 700, "great solvent", "partial charges surround ions", GREEN, ("r2", 4))]
    for i, (x, y, h1, h2, col, (k, n)) in enumerate(panels):
        s.append(card(f"rc_p{i}", x - (20 if x > 900 else 0), y, 500, 220, col, op=0)); c.fade_in(f"#rc_p{i}", C[k][n] - 0.1, y=20); c.sound("swish", C[k][n], 0.3)
        s.append(W(c, f"rc_t{i}", x + 240, y + 80, h1, C[k][n] + 0.1, 34, col, anchor="middle"))
        s.append(L(c, f"rc_s{i}", x + 230, y + 150, h2, C[k][n] + 0.6, 28, WHITE))
        s.append(P(c, f"rc_l{i}", f"M {x + (480 if x < 900 else 0)} {y + 110} L {860 if x < 900 else 1080} 540", C[k][n] + 0.2, col, 4, 0.6))
    s.append(chip("rc_one", 960, 980, "one idea, six properties", GOLD, 50, 0)); c.pop("#rc_one", C["r2"][5]); c.sound("shimmer", C["r2"][5], 0.4)
    c.pulse("#rc_hb", C["r2"][5], C["r2"][5] + 2.5, 1.05, 0.5)
    s.append('</g>')
    return "".join(s)

# ------------------------------------------------------------- practice
def practice(c):
    t0, t1 = chapter_span(c, "practice")
    s = ['<g id="g_pc" opacity="0">', water_bg("pc_bg", 1, 81, "#0b1d3a")]
    c.scene("#g_pc", t0, t1)
    s.append(problem(c, "pb1", "q1q", "q1a", 1, ["Boiling water: a student says the heat breaks", "water molecules into hydrogen and oxygen gas.", "Right or wrong?"],
                     [('<tspan fill="#ff6b6b">wrong</tspan>', 0), ("boiling breaks hydrogen bonds BETWEEN molecules", 1), ("covalent bonds stay: the bubbles are still H₂O", 2)],
                     ("mixing up the two kinds of bonds", 3)))
    s.append(problem(c, "pb2", "q2q", "q2a", 2, ["How much heat warms 200 g of water by 5 °C?", "(c = 4.18 J/g·°C)"],
                     [("q = m · c · ΔT", 0), ("= 200 g × 4.18 J/g·°C × 5 °C", 1), ('<tspan fill="#3fe07a">= 4,180 J</tspan>', 2), ("g and °C cancel, leaving J", 4)],
                     ("forgetting the mass: 20.9", 3)))
    s.append(problem(c, "pb3", "q4q", "q4a", 3, ["Solution A: pH 4. Solution B: pH 6.", "How many times more H⁺ does A have?"],
                     [("6 − 4 = 2 pH units", 0), ("10 × 10", 1), ('<tspan fill="#3fe07a">= 100 times more H⁺</tspan>', 2)],
                     ("2 times: every step multiplies by 10", 3)))
    s.append('</g>')
    return "".join(s)

def outro(c):
    t0, t1 = chapter_span(c, "outro")
    T, C = c.T, c.C
    far_mid, fg = hot_road("rd3", op=1)
    s = ['<g id="g_ou" opacity="0">', far_mid]
    c.scene("#g_ou", t0, t1 + 1)
    c.g(f'tl.fromTo("#rd3_far",{{x:0}},{{x:-60,duration:{t1-t0+1:.2f},ease:"none",immediateRender:false}},{t0:.2f});')
    s.append(f'<g id="ou_fin"><rect x="1850" y="300" width="26" height="560" fill="#f4f6fb"/><rect x="1620" y="300" width="250" height="70" fill="#f4f6fb"/><text x="1745" y="350" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#c8323e">FINISH</text></g>')
    s.append(jimg("ou_j", "jordan-drink", 1320, 1040, 0.58, op=1))
    s.append('<rect x="120" y="150" width="1040" height="830" rx="40" fill="#081428" opacity=".72"/>')
    c.sound("water_pour_real", T["end"] + 0.4, 0.25); c.sound("crowd_cheer_real", T["end"], 0.2)
    s.append(fg + '</g>')
    s.append(W(c, "ou_1", 640, 260, 'one bent molecule → cool runner ✓', T["end"] + 0.2, 52, GREEN, anchor="middle"))
    s.append(f'<text id="ou_site" x="640" y="470" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="{TEAL}" opacity="0">levlprep.com</text>')
    c.fade_in("#ou_site", C["end"][1], y=20); c.sound("shimmer", C["end"][1], 0.5)
    s.append(L(c, "ou_free", 640, 550, "free notes + practice questions", C["end"][1] + 0.3, 40, WHITE))
    s.append(card("ou_next", 260, 640, 760, 300, GOLD, op=0)); c.fade_in("#ou_next", C["end"][2], y=20)
    s.append(L(c, "ou_nl", 640, 700, "NEXT", C["end"][2] + 0.1, 34, GOLD))
    s.append(W(c, "ou_nt", 640, 790, 'the elements of life', C["end"][2] + 0.3, 62, anchor="middle"))
    s.append(W(c, "ou_nt2", 640, 880, '+ the four big families of molecules', C["end"][2] + 1.6, 36, INK, anchor="middle"))
    s.append("</g>")
    return "".join(s)

CHAPTER_FUNCS = [intro, polar, hbond, cohesion, heat, sweat, ice, solvent, ph, recap, practice, outro]

def build_spec():
    def compose(c):
        import os as os_; os_.makedirs(OUT, exist_ok=True)
        c.g('gsap.set("[data-ob]",{transformOrigin:"50% 100%"});gsap.set("[data-ol]",{transformOrigin:"0% 50%"});')
        out = "".join(f(c) for f in CHAPTER_FUNCS)
        ch = {x["id"]: x["t"] for x in c.CH}
        c.spec["music"] = [(0, c.C["hook"][4], 0.10), (c.C["hook"][4], ch["polar"], 0.06),
                           (c.T["t8"] - 0.3, c.T["c4q"], 0.07), (ch["recap"], ch["practice"], 0.06), (ch["outro"], c.TOTAL, 0.10)]
        return out
    return dict(css="#hdr .ch div{background:rgba(5,12,26,.75);padding:0 14px;border-radius:10px} #pause{top:36px}", id=S.ID, course_tag="AP BIO · UNIT 1 · 1.1",
                chapters=S.CHAPTERS, compose=compose, tail=6.0, images=[f"{CHD}/{n}.png" for n in ("jordan-sprint", "jordan-drink", "jordan-bent")])

SPEC = build_spec()
