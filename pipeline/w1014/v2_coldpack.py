"""w1014-02 Cold pack (AP Chem thermodynamics): Jordan twists her ankle on the track, an instant cold pack turns ice
cold -> dive into the pack: the NH4NO3 lattice comes apart, water's H bonds break (cost), water wraps the ions the right
way round (give back), cost > give back -> zoom out: heat flows from her ankle into the pack -> endothermic does not
mean "can't happen on its own" -> the ions spread out, entropy up -> dG = dH - TdS, TdS wins, dG < 0 (favored)."""
import math, random
import beats_w1014 as B
import lpx, chem
from lpx import wt, cam_to, char, swap, chip

ID = "w1014-02-cold-pack"


# ---------- soft shaded atoms (same look as the chem.py palette) ----------
def atom(x, y, r, kind):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#g{kind})"/>'


def nh4(x, y, cls="", s=1.0, rot=0):
    hs = "".join(atom(28 * math.cos(a), 28 * math.sin(a), 13, "H") for a in (math.radians(d + rot) for d in (45, 135, 225, 315)))
    return (f'<g class="ion nh {cls}"><g transform="translate({x:.1f} {y:.1f}) scale({s})">{hs}{atom(0, 0, 24, "N")}'
            f'<text x="18" y="-24" class="lbl" font-size="38" fill="#ffd23f">+</text></g></g>')


def no3(x, y, cls="", s=1.0, rot=0):
    os_ = "".join(atom(32 * math.cos(a), 32 * math.sin(a), 19, "O") for a in (math.radians(d + rot) for d in (90, 210, 330)))
    return (f'<g class="ion no {cls}"><g transform="translate({x:.1f} {y:.1f}) scale({s})">{atom(0, 0, 18, "N")}{os_}'
            f'<text x="26" y="-34" class="lbl" font-size="44" fill="#7fd1ff">−</text></g></g>')


def water(x, y, ang, cls="w", s=1.0):
    """ang: direction the O points to (H atoms on the opposite side, 104.5 degrees apart)."""
    a = math.radians(ang + 180)
    h1 = (22 * math.cos(a - 0.91), 22 * math.sin(a - 0.91)); h2 = (22 * math.cos(a + 0.91), 22 * math.sin(a + 0.91))
    return (f'<g class="{cls}"><g transform="translate({x:.1f} {y:.1f}) scale({s})">{atom(*h1, 11, "H")}{atom(*h2, 11, "H")}{atom(0, 0, 18, "O")}</g></g>')


def water_h_in(x, y, ang, cls="w", s=1.0):
    """Water with one H pointing in direction ang (toward an anion)."""
    a = math.radians(ang)
    h1 = (22 * math.cos(a), 22 * math.sin(a)); b = a + math.radians(104.5)
    h2 = (22 * math.cos(b), 22 * math.sin(b))
    return (f'<g class="{cls}"><g transform="translate({x:.1f} {y:.1f}) scale({s})">{atom(*h1, 11, "H")}{atom(*h2, 11, "H")}{atom(0, 0, 18, "O")}</g></g>')


LAT = [(380 + i * 108, 250 + j * 108, (i + j) % 2) for j in range(3) for i in range(4)]


def track_svg(c):
    lines = "".join(f'<path d="M-200 {y} L1280 {y+dy}" stroke="#f4efe6" stroke-width="5" opacity=".75"/>' for y, dy in ((700, 30), (780, 60), (880, 90)))
    lights = "".join(f'<g filter="url(#blur3)"><rect x="{x}" y="40" width="70" height="36" rx="6" fill="#fff8d6"/><circle cx="{x+35}" cy="58" r="60" fill="#fff3b0" opacity=".25"/></g><rect x="{x+31}" y="76" width="8" height="300" fill="#2a3342"/>' for x in (60, 880))
    crowd = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" opacity=".7"/>' for x, y, r, col in (
        (random.Random(i).randint(-50, 1130), random.Random(i + 99).randint(330, 470), random.Random(i + 7).randint(10, 16),
         random.Random(i + 3).choice(["#c24a5a", "#3d6fb8", "#e0b84a", "#4aa37a", "#d9d4ca"])) for i in range(70)))
    return f'''
  <g id="tFar">
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gDusk)"/>
    {lights}
    <g filter="url(#blur8)"><rect x="-200" y="300" width="1480" height="200" fill="#26304a"/>{crowd}</g>
    <rect x="-200" y="500" width="1480" height="40" fill="#3a4a3a"/>
  </g>
  <g id="tMid"><rect x="-200" y="540" width="1480" height="600" fill="url(#gTrack)"/>{lines}</g>
  <g id="jW">
    <ellipse cx="470" cy="905" rx="170" ry="22" fill="#000" opacity=".3"/>
    <circle id="ankGlow" cx="537" cy="730" r="90" fill="url(#gPainR)" opacity="0"/>
    {char(c, "jordan-foot", 290, 230, 680, "jF")}
    <g id="burst">{"".join(f'<path d="M{537+50*math.cos(math.radians(a)):.0f} {730+50*math.sin(math.radians(a)):.0f} L{537+86*math.cos(math.radians(a)):.0f} {730+86*math.sin(math.radians(a)):.0f}" stroke="#ff5a4a" stroke-width="9" stroke-linecap="round"/>' for a in range(0, 360, 45))}</g>
    {char(c, "jordan-bent", 300, 300, 610, "jB", opacity=0)}
    <g id="jSweat">{"".join(f'<path class="jsw" d="M{x} {y} c-5 9 -5 16 0 18 c5 -2 5 -9 0 -18 Z" fill="#bfe9ff" opacity="0"/>' for x, y in ((470, 260), (520, 270)))}</g>
  </g>
  <g id="packW" opacity="0">{pack(760, 400, "pk")}</g>
  <g id="burstIn" opacity="0"><circle cx="760" cy="475" r="40" fill="none" stroke="#e8fbff" stroke-width="8"/>
    {"".join(f'<circle class="dropl" cx="760" cy="475" r="{r}" fill="#bfe9ff"/>' for r in (8, 7, 9, 6, 8, 7))}</g>
  <g id="thermo" opacity="0">{thermo(950, 200, "th")}</g>
  <g id="noFreezer" opacity="0" transform="translate(40 120) scale(1.2)"><rect x="70" y="80" width="150" height="190" rx="16" fill="#dfe8f2" stroke="#9fb3c8" stroke-width="5"/>
    <path d="M70 150 L220 150" stroke="#9fb3c8" stroke-width="5"/><rect x="190" y="100" width="10" height="34" rx="4" fill="#9fb3c8"/><rect x="190" y="168" width="10" height="50" rx="4" fill="#9fb3c8"/>
    <path d="M60 70 L230 280 M230 70 L60 280" stroke="#ff4f6b" stroke-width="14" stroke-linecap="round"/></g>
'''


def pack(x, y, p):
    frost = "".join(f'<path class="{p}fr" d="M{x+dx} {y+dy} l0 -22 M{x+dx} {y+dy} l19 -11 M{x+dx} {y+dy} l19 11 M{x+dx} {y+dy} l0 22 M{x+dx} {y+dy} l-19 11 M{x+dx} {y+dy} l-19 -11" stroke="#e8fbff" stroke-width="4" stroke-linecap="round" opacity="0"/>'
                    for dx, dy in ((-60, -80), (50, -40), (-30, 30), (60, 80), (-70, 110), (10, -120)))
    return f'''<g id="{p}"><g id="{p}Sq">
      <rect x="{x-110}" y="{y-170}" width="220" height="340" rx="34" fill="url(#gPack)" stroke="#cfe6f5" stroke-width="5"/>
      <rect id="{p}Cold" x="{x-110}" y="{y-170}" width="220" height="340" rx="34" fill="#7fd6ff" opacity="0"/>
      <path d="M{x-110} {y-130} L{x+110} {y-130}" stroke="#cfe6f5" stroke-width="4" stroke-dasharray="10 8"/>
      <rect x="{x-70}" y="{y-60}" width="140" height="70" rx="14" fill="#2e86de"/>
      <text x="{x}" y="{y-12}" text-anchor="middle" class="lbl" font-size="40" fill="#fff">COLD</text>
      <path id="{p}Pouch" d="M{x-60} {y+40} C{x-60} {y+10} {x+60} {y+10} {x+60} {y+40} L{x+60} {y+110} C{x+60} {y+140} {x-60} {y+140} {x-60} {y+110} Z" fill="#bfe9ff" opacity=".6" stroke="#fff" stroke-width="3"/>
      {frost}</g></g>'''


def thermo(x, y, p):
    return f'''<rect x="{x-26}" y="{y}" width="52" height="300" rx="26" fill="#081428" stroke="#e3ebf7" stroke-width="5"/>
      <circle cx="{x}" cy="{y+320}" r="40" fill="#081428" stroke="#e3ebf7" stroke-width="5"/>
      <rect id="{p}Fill" x="{x-12}" y="{y+40}" width="24" height="260" rx="12" fill="#ff6b6b"/>
      <circle id="{p}Bulb" cx="{x}" cy="{y+320}" r="28" fill="#ff6b6b"/>'''


def lattice_svg(c, out):
    rnd = random.Random(11)
    ions = "".join((nh4 if k == 0 else no3)(x, y, f"L{n}", 1.0, rnd.randint(0, 40)) for n, (x, y, k) in enumerate(LAT))
    # bulk water: some with dashed hydrogen bonds between them (bottom cluster)
    hb = [(250, 600, 20), (330, 650, 200), (410, 600, -30), (490, 655, 160), (570, 600, 10), (650, 650, 190), (730, 600, -20), (810, 650, 170)]
    hbl = "".join(f'<path class="hb" d="M{a[0]} {a[1]} L{b[0]} {b[1]}" stroke="#7fd1ff" stroke-width="4" stroke-dasharray="6 7" opacity=".9"/>' for a, b in zip(hb, hb[1:]))
    hw = "".join(water(x, y, ang, f"hw hw{i}") for i, (x, y, ang) in enumerate(hb))
    loose = "".join(water(rnd.randint(120, 960), rnd.choice([rnd.randint(150, 200), rnd.randint(520, 560)]), rnd.randint(0, 360), "lw") for _ in range(10))
    # hydration shells around the two pulled ions (placed later at 300,430 and 780,430)
    shellN = "".join(water(300 + 74 * math.cos(math.radians(a)), 430 + 74 * math.sin(math.radians(a)), a + 180, "shN") for a in (0, 72, 144, 216, 288))
    shellO = "".join(water_h_in(780 + 80 * math.cos(math.radians(a)), 430 + 80 * math.sin(math.radians(a)), a + 180, "shO") for a in (30, 102, 174, 246, 318))
    bars = f'''<g id="bars" opacity="0">
      <rect x="60" y="700" width="960" height="250" rx="28" fill="#081428" fill-opacity=".92" stroke="#2a3d5e" stroke-width="4"/>
      <text x="90" y="758" class="lbl" font-size="42" fill="#ff8a8a">pulling apart: costs</text>
      <rect x="90" y="774" width="0" height="40" rx="20" fill="#ff6b6b" id="barCost"/>
      <text x="90" y="872" class="lbl" font-size="42" fill="#3fe07a" id="giveTxt" opacity="0">attractions: give back</text>
      <rect x="90" y="888" width="0" height="40" rx="20" fill="#3fe07a" id="barGive"/>
      <g id="netW" opacity="0"><rect x="{90+700}" y="768" width="140" height="52" rx="10" fill="none" stroke="#ffd23f" stroke-width="5" stroke-dasharray="10 6"/>
        <text x="{90+770}" y="858" text-anchor="middle" class="lbl" font-size="36" fill="#ffd23f">net cost</text></g>
    </g>'''
    head = f'''<g id="ionHead" opacity="0"><rect x="250" y="40" width="580" height="150" rx="26" fill="#081428" fill-opacity=".9" stroke="#2ee6d6" stroke-width="4"/>
      {chem.mol2d("[NH4+]", out, "ia", 270, 52, 200, 126, bond_px=4)}
      {chem.mol2d("[O-][N+](=O)[O-]", out, "ib", 560, 48, 240, 134, bond_px=4)}
      <text x="540" y="128" text-anchor="middle" class="lbl" font-size="44" fill="#e3ebf7">+</text></g>
      {chip("anTag", 540, 205, "ammonium nitrate", "#2ee6d6", 38)}'''
    return f'''
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gSol)"/>
    {"".join(f'<circle class="bub" cx="{random.Random(i).randint(0,1080)}" cy="{random.Random(i+50).randint(0,960)}" r="{random.Random(i+9).randint(3,7)}" fill="#bfe9ff" opacity=".25"/>' for i in range(26))}
    <g transform="translate(540 430) scale(1.32) translate(-540 -430)">
    <g id="hbW">{hbl}{hw}</g>
    {loose}
    <g id="latW">{ions}</g>
    <g id="shN" opacity="0">{shellN}</g><g id="shO" opacity="0">{shellO}</g></g>
    {head}
    {chip("ionsTag", 540, 40, "pull the ions apart", "#ff8a8a", 40)}
    {chip("waterTag", 540, 40, "and the water apart", "#7fd1ff", 40)}
    {chip("hydTag", 540, 40, "water wraps the ions", "#3fe07a", 40)}
    {bars}
'''


def ankle_svg(c):
    heat = "".join(f'<path class="heat" d="M{x} 690 C{x+20} 640 {x-30} 600 {x+10} 540" stroke="url(#gHeat)" stroke-width="10" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="0.35 0.65" opacity="0"/>' for x in (420, 480, 540, 600, 660))
    return f'''
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gTrack)"/>
    <g filter="url(#blur8)" opacity=".5">{"".join(f'<path d="M-200 {y} L1280 {y+40}" stroke="#f4efe6" stroke-width="8"/>' for y in (200, 520, 860))}</g>
    <!-- lower leg and foot, Jordan's skin and shoe colors -->
    <path d="M380 -40 C370 160 380 380 400 560 C410 640 440 700 470 730 L700 730 C700 690 690 640 670 580 C640 420 640 160 650 -40 Z" fill="url(#gSkin)"/>
    <path d="M400 560 C450 600 610 600 670 580" stroke="#df805b" stroke-width="5" fill="none" opacity=".5"/>
    <path d="M440 700 C520 720 640 720 700 700 L700 760 L440 760 Z" fill="#f4f8f8"/>
    <path d="M420 740 C420 720 450 712 520 712 L760 712 C860 712 960 740 980 800 C990 840 960 860 900 860 L460 860 C430 860 418 820 420 740 Z" fill="#eef7f7" stroke="#cfdede" stroke-width="4"/>
    <path d="M440 830 L960 830" stroke="#2ee6d6" stroke-width="12" stroke-linecap="round"/>
    <path d="M560 740 L720 740 M580 770 L740 770" stroke="#2ee6d6" stroke-width="6" stroke-linecap="round"/>
    <circle id="ankHot" cx="560" cy="640" r="120" fill="url(#gPainR)" opacity=".8"/>
    {heat}
    <g id="heatArr" opacity="0">{"".join(f'<path d="M{x} 650 L{x} 590 M{x-16} 608 L{x} 588 L{x+16} 608" stroke="#ffb347" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' for x in (450, 560, 670))}</g>
    <g id="packOn"><g transform="translate(560 470) rotate(-6)">
      <rect x="-150" y="-110" width="300" height="200" rx="36" fill="url(#gPack)" stroke="#cfe6f5" stroke-width="5"/>
      <rect id="poCold" x="-150" y="-110" width="300" height="200" rx="36" fill="#7fd6ff" opacity=".35"/>
      <rect x="-60" y="-40" width="120" height="56" rx="12" fill="#2e86de"/><text x="0" y="0" text-anchor="middle" class="lbl" font-size="32" fill="#fff">COLD</text>
      <path d="M-150 60 C-60 90 60 90 150 60" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/></g></g>
    
    <rect id="scrim" x="-200" y="-120" width="1480" height="1200" fill="#06101f" opacity="0"/>
    <g id="endoW" opacity="0"><rect x="250" y="60" width="580" height="170" rx="30" fill="#081428" fill-opacity=".94" stroke="#7fd1ff" stroke-width="6"/>
      <text x="540" y="136" text-anchor="middle" class="lbl" font-size="58" fill="#7fd1ff">ENDOTHERMIC</text>
      <text x="540" y="200" text-anchor="middle" class="lbl" font-size="46" fill="#e3ebf7">ΔH &gt; 0</text></g>
    <g id="mythW" opacity="0"><rect x="80" y="270" width="920" height="210" rx="30" fill="#081428" fill-opacity=".95" stroke="#ff6b6b" stroke-width="6"/>
      <text x="540" y="356" text-anchor="middle" class="lbl" font-size="54" fill="#e3ebf7">endothermic means</text>
      <text x="540" y="432" text-anchor="middle" class="lbl" font-size="54" fill="#e3ebf7">it can&#39;t happen?</text>
      <g id="mythX" opacity="0"><path d="M120 300 L960 450" stroke="#ff4f6b" stroke-width="9" stroke-linecap="round" opacity=".85"/>
        <rect x="360" y="496" width="360" height="86" rx="43" fill="#ff4f6b"/><text x="540" y="555" text-anchor="middle" class="lbl" font-size="52" fill="#fff">FALSE</text></g></g>
'''


def spread_svg(c):
    rnd = random.Random(21)
    ions = ""
    for n, (x, y, k) in enumerate(LAT):
        ions += (nh4 if k == 0 else no3)(x - 40, y + 30, f"S{n}", 1.25, rnd.randint(0, 40))
    waters = "".join(water(rnd.randint(40, 1040), rnd.randint(60, 760), rnd.randint(0, 360), "sw", 1.1) for _ in range(26))
    return f'''
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gSol)"/>
    {waters}
    <g id="sIons">{ions}</g>
    <g id="sMeter" opacity="0"><rect x="880" y="120" width="120" height="560" rx="30" fill="#081428" fill-opacity=".92" stroke="#9b7bff" stroke-width="5"/>
      <rect id="sFill" x="902" y="560" width="76" height="100" rx="20" fill="url(#gEnt)"/>
      <text x="940" y="100" text-anchor="middle" class="lbl" font-size="40" fill="#c9b6ff">S</text>
      <path id="sArrow" d="M940 760 L940 700 M918 722 L940 700 L962 722" stroke="#c9b6ff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0"/></g>
    {chip("spreadTag", 420, 40, "ions spread out", "#c9b6ff", 40)}
    {chip("entTag", 420, 40, "entropy goes up, ΔS &gt; 0", "#c9b6ff", 40)}
'''


def eq_svg(c):
    term = lambda tid, x, txt, col: f'<text id="{tid}" x="{x}" y="150" text-anchor="middle" class="lbl" font-size="76" fill="{col}" opacity="0">{txt}</text>'
    return f'''
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gSol)" opacity=".7"/>
    <rect x="40" y="50" width="1000" height="150" rx="30" fill="#081428" fill-opacity=".92" stroke="#2a3d5e" stroke-width="4"/>
    {term("eG", 160, "ΔG°", "#3fe07a")}{term("eEq", 290, "=", "#e3ebf7")}{term("eH", 430, "ΔH°", "#ff8a8a")}{term("eMin", 575, "−", "#e3ebf7")}{term("eS", 760, "TΔS°", "#7fd1ff")}
    <!-- energy bars from a zero line -->
    <path d="M140 560 L940 560" stroke="#e3ebf7" stroke-width="4" stroke-dasharray="10 8"/>
    <text x="960" y="572" class="lbl" font-size="30" fill="#a9bbd8">0</text>
    {"".join(f'<rect x="{x}" y="330" width="160" height="230" rx="14" fill="none" stroke="#2a3d5e" stroke-width="4" stroke-dasharray="12 10"/>' for x in (200, 460))}
    <rect x="720" y="560" width="160" height="120" rx="14" fill="none" stroke="#2a3d5e" stroke-width="4" stroke-dasharray="12 10"/>
    <text id="qG" x="800" y="460" text-anchor="middle" class="lbl" font-size="80" fill="#2a3d5e">?</text>
    <rect id="bH" x="200" y="560" width="160" height="0" rx="14" fill="url(#gBarR)"/>
    <text id="lH" x="280" y="306" text-anchor="middle" class="lbl" font-size="52" fill="#ff8a8a" opacity="0">ΔH° (+)</text>
    <rect id="bS" x="460" y="560" width="160" height="0" rx="14" fill="url(#gBarB)"/>
    <text id="lS" x="540" y="310" text-anchor="middle" class="lbl" font-size="52" fill="#7fd1ff" opacity="0">TΔS° (+)</text>
    <g id="winW" opacity="0"><text x="540" y="230" text-anchor="middle" class="lbl" font-size="44" fill="#ffd23f">wins</text></g>
    <rect id="bG" x="720" y="560" width="160" height="0" rx="14" fill="url(#gBarG)"/>
    <text id="lG" x="800" y="690" text-anchor="middle" class="lbl" font-size="52" fill="#3fe07a" opacity="0">ΔG° &lt; 0</text>
    <g id="favW" opacity="0"><rect x="190" y="800" width="700" height="110" rx="55" fill="#0d2a1c" stroke="#3fe07a" stroke-width="5"/>
      <text x="540" y="872" text-anchor="middle" class="lbl" font-size="46" fill="#3fe07a">thermodynamically favored</text></g>
'''


def compose(c):
    out = f"/home/claude/lp/out/{c.spec['id']}"
    T, C, g = c.T, c.C, c.g
    TOT = c.TOTAL
    rg = lambda i, a, b: f'<radialGradient id="g{i}" cx=".35" cy=".3"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient>'
    lg = lambda i, a, b, x2="0", y2="1": f'<linearGradient id="g{i}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'
    svg = f'''<svg viewBox="0 0 1080 960"><defs>{lpx.DEFS}
    {rg("N", "#9db8ff", "#3a5bd9")}{rg("H", "#ffffff", "#b9c4d6")}{rg("O", "#ff9a9a", "#d63a3a")}
    {lg("Dusk", "#2a2450", "#5a3a5a")}{lg("Track", "#b8543c", "#7a3424")}{lg("Pack", "#ffffff", "#d8e8f2")}
    {lg("Sol", "#0b2a4a", "#06182e")}{lg("Skin", "#f8a877", "#e48c62", "1", "0")}{lg("Ent", "#c9b6ff", "#7a54c9")}
    {lg("BarR", "#ff9a9a", "#d63a3a")}{lg("BarB", "#9fe0ff", "#2e86de")}{lg("BarG", "#7ff0a8", "#1f9a52")}
    <linearGradient id="gHeat" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a3d"/><stop offset="1" stop-color="#ffd23f"/></linearGradient>
    <radialGradient id="gPainR"><stop offset="0" stop-color="#ff3b3b" stop-opacity=".7"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient>
    </defs>
    <g id="scA">{track_svg(c)}</g>
    <g id="scM" opacity="0">{lattice_svg(c, out)}</g>
    <g id="scL" opacity="0">{ankle_svg(c)}</g>
    <g id="scS" opacity="0">{spread_svg(c)}</g>
    <g id="scE" opacity="0">{eq_svg(c)}</g>
    </svg>'''
    # ---- always moving
    g(f'tl.fromTo(".bub",{{y:0}},{{y:-260,duration:{TOT:.2f},ease:"none"}},0);')
    g(f'tl.fromTo(".lw, .sw",{{rotation:0,x:0}},{{rotation:40,x:30,duration:2.4,yoyo:true,repeat:{int(TOT/2.4)},ease:"sine.inOut",transformOrigin:"50% 50%"}},0);')
    g(f'tl.fromTo("#latW .ion",{{x:0}},{{x:3,duration:0.18,yoyo:true,repeat:{int(TOT/0.18)},stagger:0.03,ease:"sine.inOut"}},0);')

    # ---- titles
    c.title('No freezer.<br><span class="t">Ice cold</span> in seconds?', 0, out=T["dive"] - 0.15, size=94)
    c.title('<span class="t">Instant cold pack</span>', T["dive"], out=C["dive"][1] - 0.1, size=96)
    c.title('<span class="r">Costs</span> more than it <span class="g">gives</span>', C["dive"][1], out=C["dive"][3] - 0.1, size=84)
    c.title('Heat flows <span class="y">into the pack</span>', C["dive"][3], out=T["trap"] - 0.12, size=88)
    c.title('<span class="t">Endothermic</span>…', T["trap"], out=C["trap"][1] - 0.1, size=100)
    c.title('…but it still <span class="y">happens</span>', C["trap"][1], out=C["trap"][2] - 0.1, size=92)
    c.title('<span class="v" style="color:#c9b6ff">Entropy</span> goes up', C["trap"][2], out=T["rule"] - 0.12, size=96)
    c.title('<span class="y">AP Chem</span>: ΔG° = ΔH° − TΔS°', T["rule"], out=T["cta"] - 0.12, size=68)

    # ---- A: the twist, frame zero already moving
    g('tl.fromTo("#cam",{scale:1.14,x:30,y:-20},{scale:1.08,x:20,y:-10,duration:1.4,ease:"sine.out"},0);')
    g('tl.fromTo("#jF",{y:-26,rotation:-3,svgOrigin:"500 900"},{y:0,rotation:0,duration:0.45,ease:"bounce.out"},0);')
    g('tl.to("#cam",{x:12,duration:0.05,yoyo:true,repeat:5,ease:"none"},0.02);')
    g('tl.fromTo("#ankGlow",{opacity:0.9,scale:0.7,svgOrigin:"537 730"},{opacity:0.4,scale:1.3,duration:0.45,yoyo:true,repeat:9,ease:"sine.inOut"},0);')
    g('tl.fromTo("#burst",{opacity:1,scale:0.7,svgOrigin:"537 730"},{opacity:0,scale:1.4,duration:0.5,repeat:2,ease:"power2.out"},0);')
    g(f'tl.set("#burst",{{opacity:0}},{wt(c, "hook", "and"):.2f});')
    g('tl.fromTo(".jsw",{opacity:0,y:0},{opacity:1,y:60,duration:0.9,stagger:0.3,repeat:4,ease:"power1.in"},0);')
    g('tl.to("#tFar",{x:30,duration:5,ease:"sine.inOut"},0); tl.to("#tMid",{x:-20,duration:5,ease:"sine.inOut"},0);')
    c.sound("run_steps_real", 0.0, 0.6); c.sound("gasp_female_real", 0.08, 0.9); c.sound("punch", 0.05, 0.5)
    c.music_auto += [(0, 1.4, 0.35)]
    tb = wt(c, "hook", "and")
    swap(c, "#jF", "#jB", tb); c.sound("breath_female_real", tb, 0.45)
    g(f'tl.to("#ankGlow",{{x:-37,y:130,duration:0.2}},{tb:.2f});')
    tp = wt(c, "hook", "pack")
    g(f'tl.fromTo("#packW",{{opacity:0,x:200,rotation:12,svgOrigin:"760 400"}},{{opacity:1,x:0,rotation:0,duration:0.45,ease:"back.out(1.6)",immediateRender:false}},{tp-0.25:.2f});')
    c.sound("swish", tp - 0.25, 0.7); c.sound("cloth_real", tp, 0.6)
    tic = wt(c, "hook", "ice")
    g(f'tl.to("#pkCold",{{opacity:0.55,duration:0.8}},{tic:.2f}); tl.fromTo(".pkfr",{{opacity:0,scale:0.2,transformOrigin:"50% 50%"}},{{opacity:1,scale:1,duration:0.35,stagger:0.1,ease:"back.out(2)",immediateRender:false}},{tic:.2f});')
    c.fade_in("#thermo", tic - 0.2, 0.3, 10)
    g(f'tl.to("#thFill",{{attr:{{y:290,height:10}},fill:"#7fd1ff",duration:1.2,ease:"power2.out"}},{tic:.2f}); tl.to("#thBulb",{{fill:"#7fd1ff",duration:1.0}},{tic:.2f});')
    c.sound("shimmer", tic, 0.8)
    tnf = wt(c, "hook", "freezer") - 0.25
    c.pop("#noFreezer", tnf, 0.4); c.sound("wrong", tnf + 0.1, 0.5)

    # ---- squeeze and dive into the pack
    t = T["dive"]
    c.fade_out("#noFreezer, #thermo", t - 0.1, 0.25)
    cam_to(c, t - 0.1, 760, 400, 1.6, 0.4)
    c.fade_out("#jW", t - 0.1, 0.3)
    g(f'tl.to("#pkCold",{{opacity:0.9,duration:0.6}},{t+0.25:.2f});')
    g(f'tl.set("#burstIn",{{opacity:1}},{t+0.25:.2f}); tl.fromTo("#burstIn circle:first-child",{{attr:{{r:12}},opacity:1}},{{attr:{{r:170}},opacity:0,duration:0.9,ease:"power2.out",immediateRender:false}},{t+0.25:.2f});')
    g(f'tl.fromTo(".dropl",{{x:0,y:0,opacity:1}},{{x:(i)=>Math.cos(i*1.05)*130,y:(i)=>Math.sin(i*1.05)*130,opacity:0,duration:0.9,ease:"power2.out",immediateRender:false}},{t+0.25:.2f});')
    g(f'tl.to("#pkSq",{{scaleX:0.86,scaleY:1.06,svgOrigin:"760 400",duration:0.18,yoyo:true,repeat:1,ease:"power2.inOut"}},{t+0.0:.2f});')
    g(f'tl.to("#pkPouch",{{scale:1.4,opacity:0,svgOrigin:"760 475",duration:0.25,ease:"power2.out"}},{t+0.25:.2f});')
    c.sound("splash_real", t + 0.25, 0.8); c.sound("pop", t + 0.25, 0.6)
    tdv = wt(c, "dive", "and")
    cam_to(c, tdv, 760, 420, 6.0, 0.55, "power3.in"); c.sound("dive", tdv, 1.0)
    tin = tdv + 0.5
    c.set("#scA", tin, "opacity:0"); c.set("#scM", tin, "opacity:1")
    g(f'tl.set("#cam",{{scale:2.4,x:0,y:0}},{tin:.2f}); tl.to("#cam",{{scale:1.0,x:0,y:0,duration:0.9,ease:"power3.out"}},{tin:.2f});')
    tam = wt(c, "dive", "ammonium")
    c.fade_in("#ionHead", tam, 0.35, 14); c.fade_in("#anTag", tam + 0.15, 0.3, 10); c.sound("pop", tam, 0.6)
    g(f'tl.fromTo("#latW .nh",{{scale:1}},{{scale:1.12,transformOrigin:"50% 50%",duration:0.2,yoyo:true,repeat:1,stagger:0.03,immediateRender:false}},{tam:.2f});')
    g(f'tl.fromTo("#latW .no",{{scale:1}},{{scale:1.12,transformOrigin:"50% 50%",duration:0.2,yoyo:true,repeat:1,stagger:0.03,immediateRender:false}},{wt(c, "dive", "nitrate"):.2f});')
    tds = wt(c, "dive", "dissolves")
    g(f'tl.to("#latW .ion",{{x:(i)=>((i%4)-1.5)*26,y:(i)=>(Math.floor(i/4)-1)*22,duration:0.8,ease:"power2.out"}},{tds:.2f});')
    # pulling the ions apart
    tpl = C["dive"][1]
    c.fade_out("#ionHead, #anTag", tpl - 0.1, 0.25)
    c.fade_in("#bars", tpl, 0.3, 14)
    tio = wt(c, "dive", "ions")
    c.fade_in("#ionsTag", tio, 0.3, 12)
    g(f'tl.to("#latW .L5",{{x:-188,y:72,duration:0.7,ease:"power2.inOut"}},{tio:.2f});')
    g(f'tl.to("#latW .L6",{{x:184,y:72,duration:0.7,ease:"power2.inOut"}},{tio+0.05:.2f});')
    g(f'tl.to("#latW .ion:not(.L5):not(.L6)",{{opacity:0.22,duration:0.5}},{tio:.2f});')
    g(f'tl.to("#barCost",{{attr:{{width:420}},duration:0.6,ease:"power2.out"}},{tio:.2f});')
    c.sound("whoosh_real", tio, 0.7); c.sound("tick", tio + 0.3, 0.5)
    twa = wt(c, "dive", "water")
    c.fade_out("#ionsTag", twa - 0.1, 0.2); c.fade_in("#waterTag", twa, 0.3, 10)
    g(f'tl.to(".hb",{{opacity:0,duration:0.3}},{twa+0.2:.2f}); tl.to(".hw",{{x:(i)=>((i%2)?1:-1)*24,y:(i)=>((i%2)?26:-26),duration:0.6,ease:"power2.out"}},{twa+0.2:.2f});')
    g(f'tl.to("#barCost",{{attr:{{width:840}},duration:0.7,ease:"power2.out"}},{wt(c, "dive", "costs"):.2f});')
    c.sound("tick", twa + 0.3, 0.5); c.sound("riser", wt(c, "dive", "costs") - 0.3, 0.4)
    # new attractions give back (shorter bar), water wraps the right way round
    tna = C["dive"][2]
    c.fade_out("#waterTag", tna - 0.1, 0.2); c.fade_in("#hydTag", tna, 0.3, 12)
    g(f'tl.fromTo("#shN, #shO",{{opacity:0,scale:1.6,svgOrigin:"540 430"}},{{opacity:1,scale:1,duration:0.6,ease:"power3.out",immediateRender:false}},{tna:.2f});')
    g(f'tl.fromTo(".shN, .shO",{{rotation:0}},{{rotation:8,transformOrigin:"50% 50%",duration:0.5,yoyo:true,repeat:5,ease:"sine.inOut",immediateRender:false}},{tna+0.6:.2f});')
    c.fade_in("#giveTxt", tna, 0.25, 6)
    g(f'tl.to("#barGive",{{attr:{{width:700}},duration:0.7,ease:"power2.out"}},{tna+0.2:.2f});')
    c.sound("glass_clink_real", tna + 0.1, 0.5); c.sound("check", tna + 0.6, 0.5)
    tgb = wt(c, "dive", "give")
    g(f'tl.fromTo("#netW",{{opacity:0}},{{opacity:1,duration:0.3,yoyo:true,repeat:3,immediateRender:false}},{tgb:.2f});')
    g(f'tl.set("#netW",{{opacity:1}},{tgb+1.3:.2f});')
    # zoom out to the ankle: heat flows into the pack
    th = C["dive"][3]
    cam_to(c, th - 0.45, 540, 430, 0.4, 0.45, "power2.in")
    c.set("#scM", th - 0.05, "opacity:0"); c.set("#scL", th - 0.05, "opacity:1")
    g(f'tl.set("#cam",{{scale:1.6,x:0,y:-100}},{th-0.05:.2f}); tl.to("#cam",{{scale:1.0,x:0,y:0,duration:0.8,ease:"power3.out"}},{th-0.05:.2f});')
    c.sound("whoosh", th - 0.45, 0.7)
    g(f'tl.set(".heat",{{opacity:1}},{wt(c, "dive", "heat"):.2f});')
    g(f'tl.fromTo(".heat",{{strokeDashoffset:0}},{{strokeDashoffset:-2,duration:1.2,repeat:6,stagger:0.15,ease:"none",immediateRender:false}},{wt(c, "dive", "heat"):.2f});')
    g(f'tl.to("#ankHot",{{opacity:0.15,scale:0.7,svgOrigin:"560 640",duration:2.2,ease:"power1.inOut"}},{wt(c, "dive", "ankle"):.2f});')
    g(f'tl.to("#poCold",{{opacity:0.8,duration:2.0}},{wt(c, "dive", "heat"):.2f});')
    cam_to(c, wt(c, "dive", "heat"), 560, 560, 1.18, 2.4, "sine.inOut")
    g(f'tl.fromTo("#heatArr",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{wt(c, "dive", "flows"):.2f}); tl.to("#heatArr",{{opacity:0,duration:0.2}},{T["trap"]-0.1:.2f});')
    c.sound("water_pour_real", wt(c, "dive", "heat"), 0.25); c.sound("shimmer", wt(c, "dive", "pack"), 0.6)

    # ---- trap: endothermic, but it still happens
    t = T["trap"]
    c.fade_out("#heatTag", t - 0.1, 0.2)
    c.cam(t - 0.1, 1.0, 0, 0, 0.6)
    ten = wt(c, "trap", "endothermic")
    c.pop("#endoW", ten - 0.1, 0.4); c.sound("punch", ten, 0.6)
    g(f'tl.to("#scrim",{{opacity:0.85,duration:0.3}},{ten-0.1:.2f});')
    tb2 = C["trap"][1]
    c.fade_in("#mythW", tb2, 0.3, 14); c.sound("swish", tb2 - 0.05, 0.6)
    tx = wt(c, "trap", "can't")
    c.pop("#mythX", tx, 0.35); c.sound("wrong", tx, 0.8)
    g(f'tl.to("#endoW, #mythW",{{y:-20,duration:1.2,ease:"sine.inOut"}},{tb2:.2f});')
    # spread out
    tsp = C["trap"][2]
    c.set("#scL", tsp - 0.1, "opacity:0")
    g(f'tl.fromTo("#scS",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{tsp-0.1:.2f});')
    c.fade_in("#spreadTag", tsp, 0.3, 12); c.sound("swish", tsp - 0.1, 0.7)
    rnd = random.Random(5)
    cells = [(x, y) for x in range(110, 1000, 220) for y in range(150, 800, 220)]
    rnd.shuffle(cells)
    pos = [(cx + rnd.randint(-50, 50), cy + rnd.randint(-40, 40)) for cx, cy in cells[:len(LAT)]]
    for n, (x, y, k) in enumerate(LAT):
        px, py = pos[n]
        g(f'tl.to("#sIons .S{n}",{{x:{px-(x-40)},y:{py-(y+30)},rotation:{rnd.randint(-90, 90)},transformOrigin:"50% 50%",duration:0.9,ease:"power2.out"}},{wt(c, "trap", "spread")-0.35+n*0.02:.2f});')
    c.sound("bubbling_real", tsp + 0.2, 0.35)
    ten2 = C["trap"][3]
    c.fade_out("#spreadTag", ten2 - 0.1, 0.2); c.fade_in("#entTag", ten2, 0.3, 12)
    c.fade_in("#sMeter", ten2 - 0.3, 0.3, 10)
    g(f'tl.to("#sFill",{{attr:{{y:160,height:500}},duration:0.8,ease:"power2.out"}},{wt(c, "trap", "up")-0.3:.2f});')
    g(f'tl.fromTo("#sArrow",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.3,immediateRender:false}},{wt(c, "trap", "up"):.2f});')
    c.sound("riser", ten2 - 0.2, 0.5); c.sound("ding", wt(c, "trap", "up"), 0.5)

    # ---- rule: dG = dH - TdS
    t = T["rule"]
    c.set("#scS", t - 0.1, "opacity:0")
    g(f'tl.fromTo("#scE",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{t-0.1:.2f});')
    c.sound("swish", t - 0.1, 0.7)
    for tid, w, n in (("#eG", "delta", 1), ("#eEq", "equals", 1), ("#eH", "delta", 2), ("#eMin", "minus", 1), ("#eS", "t", 1)):
        tt = wt(c, "rule", w, n); c.pop(tid, tt, 0.35); c.sound("pop", tt, 0.5)
    tH = wt(c, "rule", "delta", 2)
    g(f'tl.to("#bH",{{attr:{{y:330,height:230}},duration:0.6,ease:"power2.out"}},{tH+0.2:.2f}); tl.to("#lH",{{opacity:1,duration:0.3}},{tH+0.3:.2f});')
    tS = wt(c, "rule", "t", 1)
    g(f'tl.to("#bS",{{attr:{{y:330,height:230}},duration:0.6,ease:"power2.out"}},{tS+0.3:.2f}); tl.to("#lS",{{opacity:1,duration:0.3}},{tS+0.4:.2f});')
    tw_ = C["rule"][1]
    g(f'tl.to("#bS",{{attr:{{y:250,height:310}},duration:0.6,ease:"back.out(1.6)"}},{tw_:.2f}); tl.to("#lS",{{attr:{{y:232}},duration:0.6,ease:"back.out(1.6)"}},{tw_:.2f});')
    g(f'tl.fromTo("#eS",{{scale:1}},{{scale:1.18,transformOrigin:"50% 50%",duration:0.25,yoyo:true,repeat:1,immediateRender:false}},{tw_:.2f});')
    c.sound("riser", tw_ - 0.4, 0.5); c.sound("punch", wt(c, "rule", "wins"), 0.6)
    tG = wt(c, "rule", "wins") + 0.3
    c.fade_out("#qG", tG, 0.2)
    g(f'tl.to("#bG",{{attr:{{height:60}},duration:0.6,ease:"power2.out"}},{tG+0.2:.2f}); tl.to("#lG",{{opacity:1,duration:0.3}},{tG+0.4:.2f});')
    g(f'tl.fromTo("#eG",{{scale:1}},{{scale:1.2,transformOrigin:"50% 50%",duration:0.25,yoyo:true,repeat:1,immediateRender:false}},{wt(c, "rule", "negative"):.2f});')
    c.fade_in("#favW", tG + 0.35, 0.35, 14); c.sound("ding", tG + 0.35, 0.7)
    cam_to(c, tw_, 560, 470, 1.06, 2.6, "sine.inOut")
    return svg


SPEC = dict(
    id=ID, badge="AP CHEM  THERMODYNAMICS", tail=0.4, bpm=96, key=2, seed=17,
    vars="--glow:#0f3a5e;--acc1:#7fd1ff;--acc2:#9b7bff",
    css="#end-l1{font-size:74px;letter-spacing:-1.5px} #badge span{color:#9fe0ff;border-color:#9fe0ff} .cap .w.on{color:#9fe0ff} .cap span.box{background:rgba(6,24,46,.9);border-color:rgba(159,224,255,.3)} .tt .y{color:#ffe08a} #wm{color:#9fe0ff}",
    end_line='Endothermic, yet<br><span style="color:#3fe07a">thermodynamically favored</span><div style="font-size:58px;color:#bff8f2;margin-top:34px;font-weight:800">Free practice on</div>',
    beats=B.COLD, compose=compose,
)
lpx.apply_gaps(SPEC)
