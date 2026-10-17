"""w1014-01 Aspirin, chew it: Frank has chest pain at the dinner table and is about to swallow his aspirin whole ->
dive into the heart (Servier heart, coronary arteries light up) -> inside the artery: plaque cracks, platelets pile on,
clot starves the muscle -> aspirin calms the platelets (does not dissolve the clot), chewed beats whole ->
EMT kneels: screening questions, 4 x 81 mg chewable, chew then swallow."""
import re, math
import beats_w1014 as B
import lpx, medart, chem, rig, lottiefx
from lpx import wt, cam_to, char, swap, chip

ID = "w1014-01-aspirin-rig"


def room_svg(c):
    win = "".join(f'<rect x="{x}" y="{y}" width="10" height="16" fill="#ffd98a" opacity="{o}"/>' for x, y, o in (
        (668, 150, .8), (690, 172, .6), (720, 140, .7), (760, 186, .5), (800, 156, .8), (836, 176, .6), (700, 210, .5), (782, 214, .7)))
    return f'''
  <g id="aFar">
    <rect x="-200" y="-120" width="1480" height="1200" fill="url(#gWall)"/>
    <g filter="url(#blur3)">
      <rect x="610" y="70" width="330" height="300" rx="10" fill="url(#gNight)" stroke="#6b4f3e" stroke-width="14"/>
      <path d="M630 330 L660 250 L690 290 L730 230 L770 300 L810 260 L850 310 L900 250 L930 330 Z" fill="#14203a"/>
      {win}
      <path d="M775 70 L775 370 M610 220 L940 220" stroke="#6b4f3e" stroke-width="10"/>
      <circle cx="880" cy="120" r="20" fill="#f4f1de" opacity=".85"/>
      <rect x="80" y="120" width="190" height="150" rx="6" fill="#3b2f2c" stroke="#a07a4e" stroke-width="10"/>
      <path d="M100 250 L150 180 L190 220 L220 190 L250 250 Z" fill="#5d7b6a"/><circle cx="215" cy="160" r="14" fill="#e8b65a"/>
      <rect x="-60" y="420" width="220" height="300" rx="10" fill="#4a3530"/><rect x="-40" y="440" width="180" height="120" rx="6" fill="#5a423b"/>
      <circle cx="40" cy="410" r="10" fill="#d9b27a"/>
    </g>
    <path d="M540 -120 L540 40" stroke="#2a2220" stroke-width="5"/>
    <path d="M470 40 L610 40 L580 84 L500 84 Z" fill="#c98a3a"/>
    <ellipse cx="540" cy="88" rx="34" ry="12" fill="#fff4cf"/>
    <path id="cone" d="M500 86 L580 86 L900 760 L180 760 Z" fill="url(#gCone)" opacity=".55"/>
  </g>
  <g id="frankW">
     <circle id="chestGlow" cx="391" cy="424" r="150" fill="url(#gPain)" opacity="0"/>
    {rig.char(c, "frank-chest", 150, 165, 705, "fr")}
    <g id="sweat">{"".join(f'<path class="sw" d="M{x} {y} c-6 10 -6 18 0 20 c6 -2 6 -10 0 -20 Z" fill="#bfe9ff" stroke="#e8f8ff" stroke-width="1.5" opacity="0"/>' for x, y in ((310, 222), (372, 214), (392, 250)))}</g>
    <circle id="chestRing" cx="391" cy="424" r="60" fill="none" stroke="#ff5a5a" stroke-width="6" opacity="0"/>
    <g id="chestHeart" opacity="0"><circle cx="396" cy="428" r="62" fill="#ff6b6b" opacity=".35" filter="url(#blur8)"/>{medart.inline("heart-front", f"/home/claude/lp/out/{c.spec['id']}", "chh", 351, 380, 92)}</g>
  </g>
  <path id="tabPath" d="M682 548 C640 420 520 320 452 300" stroke="#ffd23f" stroke-width="5" stroke-dasharray="4 12" fill="none" stroke-linecap="round" opacity="0"/>
  <g id="flyTab"><g transform="translate(682 548)"><ellipse rx="22" ry="14" fill="#fff" stroke="#d9d4ca" stroke-width="3"/><path d="M-18 0 L18 0" stroke="#d9d4ca" stroke-width="3"/></g></g>
  <g id="wholeTag" opacity="0"><rect x="452" y="214" width="170" height="58" rx="29" fill="#081428" stroke="#ff6b6b" stroke-width="4"/><text x="537" y="254" text-anchor="middle" class="lbl" font-size="34" fill="#ff8a8a">whole?</text></g>
  <g id="tableW">
    <rect x="440" y="560" width="760" height="30" rx="8" fill="url(#gWood)"/>
    <rect x="460" y="588" width="720" height="40" fill="#5a3a26"/>
    <rect x="980" y="628" width="34" height="320" fill="#4c2f1f"/><rect x="480" y="628" width="34" height="320" fill="#4c2f1f"/>
    <ellipse cx="650" cy="556" rx="120" ry="16" fill="#e9e4da"/><ellipse cx="650" cy="552" rx="84" ry="10" fill="#f6f3ec"/>
    <g id="glass"><path d="M760 470 L812 470 L806 556 L766 556 Z" fill="#bfe3f5" opacity=".55" stroke="#e8f6ff" stroke-width="3"/>
      <path d="M764 500 L808 500 L806 556 L766 556 Z" fill="#7cc4ea" opacity=".6"/><path d="M772 478 L770 548" stroke="#fff" stroke-width="4" opacity=".7"/></g>
    <g id="bottle"><rect x="868" y="482" width="66" height="76" rx="10" fill="#f4f1ea"/><rect x="864" y="470" width="74" height="18" rx="6" fill="#e05a3a"/>
      <rect x="872" y="504" width="58" height="34" rx="4" fill="#ff8a3d"/><text x="901" y="527" text-anchor="middle" class="lbl" font-size="15" fill="#fff">ASPIRIN</text></g>
    <g id="tabDish"><ellipse cx="650" cy="548" rx="16" ry="7" fill="#fff"/><ellipse cx="682" cy="550" rx="16" ry="7" fill="#fff"/>
      <path d="M636 548 L664 548 M668 550 L696 550" stroke="#d9d4ca" stroke-width="2"/></g>
    <g id="tabGlow" opacity="0"><ellipse cx="666" cy="549" rx="56" ry="24" fill="none" stroke="#ffd23f" stroke-width="5" filter="url(#glowS)"/></g>
  </g>
  <g id="slowW" opacity="0">
    <circle cx="820" cy="330" r="70" fill="#081428" stroke="#ff6b6b" stroke-width="6"/>
    <circle cx="820" cy="330" r="56" fill="none" stroke="#2a3d5e" stroke-width="3"/>
    <rect x="808" y="248" width="24" height="14" rx="4" fill="#ff6b6b"/>
    <path id="slowHand" d="M820 330 L820 284" stroke="#ff6b6b" stroke-width="7" stroke-linecap="round"/>
    <circle cx="820" cy="330" r="7" fill="#ff6b6b"/>
    <text x="820" y="440" text-anchor="middle" class="lbl" font-size="42" fill="#ff8a8a">slow</text>
  </g>
'''


def heart_svg(c, out):
    s = medart.inline("heart-vascularization", out, "hv", 250, 70, 580)
    def tag(m):
        p = m.group(0)
        if ('#e67857' in p or '#ea846c' in p or '#ec9e8d' in p) and not re.search(r'd="M2(16|07)\.', p):
            return p.replace("<path ", '<path class="cor" ', 1)
        return p
    s = re.sub(r"<path [^>]*>", tag, s)
    return f'''
    <circle cx="540" cy="420" r="380" fill="url(#gHeartHalo)"/>
    <g id="heartBeat">{s}</g>
    {chip("corTag", 540, 40, "coronary artery", "#ff9a6b", 40)}
    <circle id="corRing" cx="640" cy="420" r="46" fill="none" stroke="#ffd23f" stroke-width="6" opacity="0" filter="url(#glowS)"/>
'''


LUM_T, LUM_B = 250, 650
PX = 470


def rbc(x, y, s=1.0, cls="rb", rot=0):
    return (f'<g class="{cls}"><g transform="translate({x} {y}) rotate({rot}) scale({s})">'
            f'<ellipse cx="0" cy="0" rx="34" ry="30" fill="url(#gRbc)"/>'
            f'<ellipse cx="0" cy="0" rx="17" ry="14" fill="#8e1b2a" opacity=".55"/>'
            f'<path d="M-22 -14 C-14 -24 6 -26 18 -18" stroke="#ffb3b8" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/></g></g>')


def platelet(x, y, cls, spikes=True, op=1):
    sp = "".join(f'<path class="spk" d="M{12*math.cos(a):.1f} {12*math.sin(a):.1f} L{32*math.cos(a):.1f} {32*math.sin(a):.1f}" stroke="#e0c8ff" stroke-width="6" stroke-linecap="round"/>'
                 for a in [i * 0.785 for i in range(8)]) if spikes else ""
    return (f'<g class="{cls}" opacity="{op}"><g transform="translate({x} {y})"><g class="pin">{sp}'
            f'<ellipse rx="17" ry="12" fill="url(#gPlt)" stroke="#e4d2ff" stroke-width="2"/>'
            f'<circle cx="-4" cy="-2" r="3" fill="#7a54c9"/><circle cx="5" cy="3" r="2.5" fill="#7a54c9"/></g></g></g>')


def artery_svg(c, out):
    import random
    rnd = random.Random(4)
    flow = "".join(rbc(rnd.randint(-700, 1100), rnd.randint(LUM_T + 50, LUM_B - 60), rnd.uniform(.75, 1.0), "rb", rnd.randint(-30, 30)) for _ in range(22))
    pile_pos = [(PX - 70, 520), (PX - 30, 505), (PX + 10, 498), (PX + 50, 506), (PX + 88, 522), (PX - 50, 478), (PX - 8, 470), (PX + 34, 474),
                (PX + 72, 486), (PX - 26, 444), (PX + 14, 440), (PX + 52, 450), (PX - 60, 452), (PX + 92, 470)]
    pile = "".join(platelet(x, y, f"pl pl{i}", op=0) for i, (x, y) in enumerate(pile_pos))
    passing = "".join(platelet(x, y, "pp", spikes=False) for x, y in ((-60, 330), (-160, 400), (-260, 360), (-360, 420)))
    trapped = "".join(rbc(x, y, .7, "tr", r) for x, y, r in ((PX - 40, 470, 20), (PX + 40, 456, -15), (PX + 4, 420, 5), (PX + 70, 430, 30)))
    fib = "".join(f'<path class="fib" d="{d}" pathLength="1" stroke="#fff3c4" stroke-width="4" fill="none" stroke-dasharray="1" stroke-dashoffset="1" opacity=".9"/>' for d in (
        f"M{PX-110} 530 C{PX-60} 420 {PX+20} 470 {PX+120} 410", f"M{PX-100} 470 C{PX-20} 520 {PX+60} 400 {PX+130} 500",
        f"M{PX-80} 420 C{PX} 470 {PX+40} 380 {PX+110} 450", f"M{PX-120} 500 C{PX-30} 380 {PX+80} 520 {PX+100} 390"))
    asp = "".join(f'<g class="asp"><g transform="translate({x} {y})"><circle r="11" fill="#ffffff" stroke="#bcd3ff" stroke-width="3"/><circle r="4" fill="#bcd3ff"/></g></g>'
                  for x, y in ((-40, 330), (-120, 470), (-200, 380), (-280, 560), (-360, 320), (-440, 450)))
    wall_cells = "".join(f'<ellipse cx="{x}" cy="{LUM_T-8}" rx="26" ry="8" fill="#f2b5b0" stroke="#d98a86" stroke-width="2"/>' for x in range(-20, 1120, 54))
    wall_cells_b = "".join(f'<ellipse cx="{x}" cy="{LUM_B+8}" rx="26" ry="8" fill="#f2b5b0" stroke="#d98a86" stroke-width="2"/>' for x in range(-20, 1120, 54) if not (PX - 150 < x < PX + 150))
    muscle = "".join(f'<path d="M{x} {LUM_B+150+k*28} C{x+30} {LUM_B+170+k*28} {x+60} {LUM_B+130+k*28} {x+90} {LUM_B+150+k*28}" stroke="#f0a0a6" stroke-width="5" fill="none" opacity=".5"/>' for x in range(-180, 1120, 90) for k in range(3))
    return f'''
    <rect x="-200" y="-100" width="1480" height="1200" fill="#3a0f18"/>
    <rect x="-200" y="{LUM_T-90}" width="1480" height="90" fill="url(#gWallT)"/>
    <rect x="-200" y="{LUM_B}" width="1480" height="110" fill="url(#gWallB)"/>
    <rect x="-200" y="{LUM_T}" width="1480" height="{LUM_B-LUM_T}" fill="url(#gLumen)"/>
    {wall_cells}{wall_cells_b}
    <g id="flowL">{flow}</g>
    <path d="M{PX-170} {LUM_B+10} C{PX-120} {LUM_B-150} {PX+120} {LUM_B-150} {PX+170} {LUM_B+10} Z" fill="url(#gPlaque)" stroke="#e0b14a" stroke-width="3"/>
    {"".join(f'<circle cx="{PX+dx}" cy="{LUM_B+dy}" r="{r}" fill="#fff0b0" opacity=".7"/>' for dx, dy, r in ((-60, -40, 10), (-20, -70, 8), (30, -50, 12), (70, -30, 7), (0, -20, 9)))}
    <path id="capL" d="M{PX-170} {LUM_B+10} C{PX-130} {LUM_B-110} {PX-40} {LUM_B-150} {PX-4} {LUM_B-150} L{PX-4} {LUM_B-126} C{PX-40} {LUM_B-126} {PX-120} {LUM_B-90} {PX-150} {LUM_B+10} Z" fill="#f2b5b0" stroke="#d98a86" stroke-width="3"/>
    <path id="capR" d="M{PX+170} {LUM_B+10} C{PX+130} {LUM_B-110} {PX+40} {LUM_B-150} {PX+4} {LUM_B-150} L{PX+4} {LUM_B-126} C{PX+40} {LUM_B-126} {PX+120} {LUM_B-90} {PX+150} {LUM_B+10} Z" fill="#f2b5b0" stroke="#d98a86" stroke-width="3"/>
    <g id="crack" opacity="0"><ellipse cx="{PX}" cy="{LUM_B-120}" rx="40" ry="26" fill="#ffd23f" opacity=".5" filter="url(#glow)"/>
      <path d="M{PX} {LUM_B-152} L{PX-14} {LUM_B-118} L{PX+8} {LUM_B-96} L{PX-6} {LUM_B-70}" stroke="#3a0f18" stroke-width="7" fill="none" stroke-linecap="round"/></g>
    {chip("plaqueTag", PX, LUM_B + 130, "plaque cracks", "#ffd23f", 38)}
    <g id="clot" opacity="0">{trapped}{fib}</g>
    {pile}
    {passing}
    {asp}
    <g id="muscleW"><rect x="-200" y="{LUM_B+110}" width="1480" height="260" fill="url(#gMyo)"/>{muscle}
      <rect id="muscleDark" x="{PX+60}" y="{LUM_B+110}" width="1000" height="260" fill="url(#gDark)" opacity="0"/></g>
    {chip("muscleTag", 860, LUM_B + 160, "heart muscle", "#ffb3a0", 34)}
    {chip("starveTag", 860, LUM_B + 160, "starving for oxygen", "#ff6b6b", 34)}
    {chip("pltTag", PX, 100, "platelets pile on", "#c9a6ff", 40)}
    {chip("clotTag", PX, 100, "a clot grows", "#ff8a8a", 40)}
    {chip("stickyTag", PX, 100, "less sticky", "#2ee6d6", 40)}
    {chip("noDiss", PX, 100, "won't dissolve the clot", "#ff6b6b", 40)}
    {chip("stopTag", PX, 100, "helps stop it growing", "#3fe07a", 40)}
    <g id="dashClot" opacity="0"><ellipse cx="{PX+10}" cy="{LUM_B-160}" rx="170" ry="130" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 12"/></g>
    <g id="aspMol" opacity="0"><rect x="690" y="30" width="370" height="320" rx="28" fill="#081428" fill-opacity=".92" stroke="#bcd3ff" stroke-width="5"/>
      {chem.mol2d("CC(=O)Oc1ccccc1C(=O)O", out, "asm", 705, 40, 340, 250, bond_px=7)}
      <text x="875" y="330" text-anchor="middle" class="lbl" font-size="40" fill="#bcd3ff">aspirin</text></g>
'''


def race_svg():
    def lane(y, lab, col):
        return (f'<rect x="90" y="{y}" width="900" height="120" rx="60" fill="#081428" fill-opacity=".92" stroke="{col}" stroke-width="5"/>'
                f'<text x="140" y="{y+76}" class="lbl" font-size="44" fill="{col}">{lab}</text>'
                f'<g transform="translate(930 {y+60})"><path d="M0 -26 C-18 -4 -20 10 -14 18 C-8 26 8 26 14 18 C20 10 18 -4 0 -26 Z" fill="#e5484d"/></g>')
    crumbs = "".join(f'<circle class="crumb" cx="{x}" cy="{y}" r="{r}" fill="#fff"/>' for x, y, r in ((0, -8, 9), (12, 6, 8), (-10, 8, 7), (6, -2, 6), (-4, -14, 6)))
    return f'''<g id="raceW" opacity="0">
      <rect x="60" y="80" width="960" height="420" rx="30" fill="#04101f" fill-opacity=".85"/>
      {lane(110, "chewed", "#3fe07a")}{lane(260, "whole", "#ff6b6b")}
      <g id="chewTab"><g transform="translate(380 170)">{crumbs}</g></g>
      <g id="wholeTab"><g transform="translate(380 320)"><g id="wholeSpin"><ellipse rx="28" ry="18" fill="#fff"/><path d="M-24 0 L24 0" stroke="#d9d4ca" stroke-width="3"/></g></g></g>
      <g id="winChk" opacity="0"><circle cx="930" cy="170" r="44" fill="#3fe07a" filter="url(#glowS)"/><path d="M908 170 l16 16 l28 -32" stroke="#081428" stroke-width="10" fill="none" stroke-linecap="round"/></g>
      <text id="fastTxt" x="540" y="458" text-anchor="middle" class="lbl" font-size="46" fill="#3fe07a" opacity="0">into the blood faster</text>
    </g>'''


def tx_svg(c):
    q = ["Allergy?", "Bleeding?", "Aspirin today?"]
    qs = "".join(f'<g id="q{i}" opacity="0"><rect x="470" y="{40+i*96}" width="480" height="80" rx="40" fill="#081428" stroke="#2ee6d6" stroke-width="5"/>'
                 f'<text x="505" y="{94+i*96}" class="lbl" font-size="46" fill="#e3f7f5">{t}</text>'
                 f'<g id="qc{i}" opacity="0"><circle cx="905" cy="{80+i*96}" r="25" fill="#3fe07a"/><path d="M891 {80+i*96} l10 10 l18 -20" stroke="#081428" stroke-width="6" fill="none" stroke-linecap="round"/></g></g>'
                 for i, t in enumerate(q))
    tabs = "".join(f'<g id="tb{i}" opacity="0" transform="translate({635+i*90} 190)"><ellipse rx="34" ry="34" fill="#fff" stroke="#ffd2b0" stroke-width="4"/>'
                   f'<path d="M-22 0 L22 0" stroke="#e8dccb" stroke-width="4"/><text y="70" text-anchor="middle" class="lbl" font-size="30" fill="#ffd23f">81</text></g>' for i in range(4))
    return f'''
    <g id="dosePanel" opacity="0"><rect x="550" y="60" width="440" height="300" rx="28" fill="#081428" fill-opacity=".92" stroke="#ffd23f" stroke-width="4"/>
      <text x="770" y="116" text-anchor="middle" class="lbl" font-size="36" fill="#ffd23f">chewable aspirin</text>
      {tabs}
      <text id="doseNum" x="770" y="334" text-anchor="middle" class="lbl" font-size="34" fill="#e3ebf7" opacity="0">= 324 mg, per protocol</text></g>
    {qs}
    <g id="chewW" opacity="0"><rect x="570" y="80" width="400" height="210" rx="28" fill="#081428" fill-opacity=".92" stroke="#3fe07a" stroke-width="4"/>
      <text x="770" y="150" text-anchor="middle" class="lbl" font-size="56" fill="#3fe07a">chew</text>
      <g id="teeth"><g transform="translate(770 190)">{"".join(f'<circle class="cr" cx="{dx}" cy="{dy}" r="{r}" fill="#fff"/>' for dx, dy, r in ((-14, -6, 15), (14, -6, 15), (-14, 10, 13), (14, 10, 13)))}</g></g>
      <text id="thenSw" x="770" y="260" text-anchor="middle" class="lbl" font-size="44" fill="#e3f7f5" opacity="0">then swallow</text></g>
'''


def room_svg_simple(c):
    return f'''<rect x="-200" y="-120" width="1480" height="1200" fill="url(#gWall)"/>
      <g filter="url(#blur8)"><rect x="610" y="70" width="330" height="300" rx="10" fill="url(#gNight)" stroke="#6b4f3e" stroke-width="14"/>
      <rect x="80" y="120" width="190" height="150" rx="6" fill="#3b2f2c" stroke="#a07a4e" stroke-width="10"/></g>
      <path d="M380 86 L460 86 L800 760 L60 760 Z" fill="url(#gCone)" opacity=".45"/>
      <rect x="-200" y="860" width="1480" height="200" fill="#1d1418"/>
      <circle id="chestGlow2" cx="256" cy="470" r="90" fill="url(#gPain)" opacity=".45"/>
      {rig.char(c, "frank-chest", 26, 165, 705, "fT")}
      <g id="mouthCr">{"".join(f'<circle class="mc" cx="{291+dx}" cy="{300+dy}" r="{r}" fill="#fff" stroke="#c9c2b6" stroke-width="2" opacity="0"/>' for dx, dy, r in ((-10, 4, 8), (8, 8, 7), (18, 2, 6), (0, 14, 7)))}</g>'''


# ---- continuous story to diagram layout (2026-10-17 rig test)
A_S, A_X, A_Y = 0.62, -40, 200          # scene A shrinks to the left so Frank stays on screen
H_S, H_X, H_Y = 0.82, 150, 20           # heart grows to the right (svgOrigin 540 420)
CH = (391 * A_S + A_X, 424 * A_S + A_Y)  # Frank's chest after the shrink
LENS = (540 + 100 * H_S + H_X, 420 + H_Y)  # coronary spot on the grown heart
INS = (150, 690, 115)                    # Frank inset circle (x, y, r)
INS_S, INS_X, INS_Y = 0.68, 150 - 0.68 * 400, 690 - 0.68 * 330   # inset maps Frank's face and chest into the circle


def tangents(c1, r1, c2, r2):
    """Outer tangent points of two circles (for the callout cone from the chest to the heart)."""
    (x1, y1), (x2, y2) = c1, c2
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy); a = math.atan2(dy, dx); b = math.acos((r1 - r2) / d)
    pts = []
    for sgn in (1, -1):
        t = a + sgn * b
        pts.append(((x1 + r1 * math.cos(t), y1 + r1 * math.sin(t)), (x2 + r2 * math.cos(t), y2 + r2 * math.sin(t))))
    return pts


def compose(c):
    out = f"/home/claude/lp/out/{c.spec['id']}"
    T, C, g = c.T, c.C, c.g
    TOT = c.TOTAL
    HC = (540 + H_X, 420 + H_Y)
    (p1, q1), (p2, q2) = tangents(CH, 22, HC, 250)
    call_d = f"M{p1[0]:.1f} {p1[1]:.1f} L{q1[0]:.1f} {q1[1]:.1f} L{q2[0]:.1f} {q2[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f} Z"
    call_l = "".join(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b[0]:.1f} {b[1]:.1f}" stroke="#ff8a7a" stroke-width="3" stroke-dasharray="10 9" opacity=".8"/>' for a, b in ((p1, q1), (p2, q2)))
    # Lottie effects (free LottieFiles animations, see lottie/README.md), only where they match the moment
    lf_alert, scr = lottiefx.place(c, "alert-dot", PX + 120, 300, 120, 120, C["asp"][1] + 0.05, dur=1.6, recolor={"#ff2d55": "#ff6b6b", "#fe2c55": "#ff6b6b"})
    lf_spark, _ = lottiefx.place(c, "sparkle-stars", 790, 30, 280, 280, C["asp"][3] + 1.25, dur=1.8)
    lf_bulb, _ = lottiefx.place(c, "idea-bulb", 150, 445, 180, 180, wt(c, "asp", "chewing") - 0.1, dur=1.9, recolor={"#ffbd59": "#ffd23f"})
    svg = scr + f'''<svg viewBox="0 0 1080 960"><defs>{lpx.DEFS}
    <linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a33"/><stop offset=".6" stop-color="#2a1f2a"/><stop offset="1" stop-color="#160f18"/></linearGradient>
    <linearGradient id="gNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1c3a"/><stop offset="1" stop-color="#26355e"/></linearGradient>
    <linearGradient id="gCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd58a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></linearGradient>
    <linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b07a4e"/><stop offset="1" stop-color="#7a4f30"/></linearGradient>
    <radialGradient id="gPain"><stop offset="0" stop-color="#ff3b3b" stop-opacity=".75"/><stop offset=".55" stop-color="#ff3b3b" stop-opacity=".25"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient>
    <radialGradient id="gHeartHalo"><stop offset="0" stop-color="#ff7a6b" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a6b" stop-opacity="0"/></radialGradient>
    <linearGradient id="gLumen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1426"/><stop offset=".5" stop-color="#9c1c30"/><stop offset="1" stop-color="#7a1426"/></linearGradient>
    <linearGradient id="gWallT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8545e"/><stop offset="1" stop-color="#e8908e"/></linearGradient>
    <linearGradient id="gWallB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8908e"/><stop offset="1" stop-color="#b8545e"/></linearGradient>
    <radialGradient id="gRbc" cx=".4" cy=".35"><stop offset="0" stop-color="#ff6b78"/><stop offset="1" stop-color="#c4182a"/></radialGradient>
    <radialGradient id="gPlt" cx=".4" cy=".35"><stop offset="0" stop-color="#efe2ff"/><stop offset="1" stop-color="#a98be0"/></radialGradient>
    <radialGradient id="gPlaque" cx=".5" cy=".7"><stop offset="0" stop-color="#fff0a0"/><stop offset="1" stop-color="#e8b84a"/></radialGradient>
    <linearGradient id="gMyo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9727a"/><stop offset="1" stop-color="#9c3a44"/></linearGradient>
    <linearGradient id="gDark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2140" stop-opacity="0"/><stop offset=".25" stop-color="#2a2140"/><stop offset="1" stop-color="#2a2140"/></linearGradient>
    <linearGradient id="gDim" x1="0" y1="0" x2="1" y2="0"><stop offset=".33" stop-color="#0c0a14" stop-opacity="0"/><stop offset=".5" stop-color="#0c0a14" stop-opacity=".86"/><stop offset="1" stop-color="#0c0a14" stop-opacity=".94"/></linearGradient>
    <linearGradient id="gCall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5a5a" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a6b" stop-opacity=".08"/></linearGradient>
    <clipPath id="lensClip"><circle id="lensC" cx="{LENS[0]:.1f}" cy="{LENS[1]:.1f}" r="0"/></clipPath>
    <clipPath id="insClip"><circle id="insC" cx="{INS[0]}" cy="{INS[1]}" r="520"/></clipPath>
    <clipPath id="txClip"><circle id="txC" cx="{INS[0]}" cy="{INS[1]}" r="{INS[2]}"/></clipPath>
    <mask id="mA" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1900" height="1800"><rect x="-150" y="-60" width="1380" height="1080" fill="#fff" filter="url(#blurM)"/></mask>
    <filter id="blurM" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="38"/></filter>
    </defs>
    <rect x="-200" y="-120" width="1480" height="1200" fill="#140e16"/>
    <g id="scA" mask="url(#mA)">{room_svg(c)}</g>
    <rect id="dimA" x="-200" y="-120" width="1480" height="1200" fill="url(#gDim)" opacity="0"/>
    <g id="callout" opacity="0"><path d="{call_d}" fill="url(#gCall)"/>{call_l}
      <circle cx="{CH[0]:.1f}" cy="{CH[1]:.1f}" r="22" fill="none" stroke="#ff8a7a" stroke-width="4"/></g>
    <g id="scH" opacity="0"><g id="hGrow">{heart_svg(c, out)}</g></g>
    <g clip-path="url(#lensClip)"><g id="scV" opacity="0"><g id="vZoom"><g id="vCam">{artery_svg(c, out)}{race_svg()}{lf_alert}{lf_spark}</g></g></g></g>
    <g id="insW" opacity="0">
      <circle cx="{INS[0]}" cy="{INS[1]}" r="{INS[2]}" fill="#2a1f2a"/>
      <g clip-path="url(#insClip)"><g id="insMove">
        <rect id="insWall" x="-200" y="-120" width="1480" height="1200" fill="url(#gWall)" opacity="0"/>
        <circle id="insGlow" cx="391" cy="424" r="150" fill="url(#gPain)" opacity=".7"/>
        {rig.char(c, "frank-chest", 150, 165, 705, "fi")}
      </g></g>
      <circle id="insRing" cx="{INS[0]}" cy="{INS[1]}" r="{INS[2]}" fill="none" stroke="#ff8a7a" stroke-width="7" opacity="0"/>
      {lf_bulb}
    </g>
    <g clip-path="url(#txClip)"><g id="scT" opacity="0"><g id="tZoom">
      {room_svg_simple(c)}
      {rig.char(c, "emtb-pulse", 560, 300, 580, "eP", flip=True)}
      {rig.char(c, "emtb-offer", 520, 300, 580, "eO", flip=True, opacity=0)}
      {rig.char(c, "emtb-chew", 560, 300, 580, "eC", flip=True, opacity=0)}
      {tx_svg(c)}
    </g></g></g>
    </svg>'''
    # ---- ever running motion
    g(f'tl.fromTo(".rb",{{x:0}},{{x:900,duration:{TOT:.2f},ease:"none"}},0);')
    g(f'tl.fromTo("#heartBeat",{{scale:1,svgOrigin:"540 420"}},{{scale:1.035,duration:0.38,yoyo:true,repeat:{int(TOT/0.38)},ease:"sine.inOut"}},0);')
    g(f'tl.fromTo("#cone",{{opacity:0.5}},{{opacity:0.62,duration:1.7,yoyo:true,repeat:{int(TOT/1.7)},ease:"sine.inOut"}},0);')
    g(f'tl.fromTo("#chestGlow2",{{opacity:0.25}},{{opacity:0.6,duration:0.42,yoyo:true,repeat:{int(TOT/0.42)},ease:"sine.inOut"}},0);')

    # ---- titles
    c.title('Chest pain?<br><span class="y">Don&#39;t swallow it whole.</span>', 0, out=T["dive"] - 0.15, size=86)
    c.title('<span class="t">Aspirin</span> for chest pain', T["dive"], out=wt(c, "dive", "coronary") - 0.2, size=92)
    c.title('Inside a <span class="r">coronary artery</span>', wt(c, "dive", "coronary") - 0.1, out=wt(c, "dive", "cracks") - 0.25, size=86)
    c.title('A plaque <span class="y">cracks</span>', wt(c, "dive", "cracks") - 0.15, out=wt(c, "dive", "platelets") - 0.1, size=96)
    c.title('<span class="y">Platelets</span> pile on', wt(c, "dive", "platelets"), out=T["asp"] - 0.12, size=96)
    c.title('<span class="t">Aspirin</span> calms them', T["asp"], out=wt(c, "asp", "chewing") - 0.1, size=96)
    c.title('<span class="g">Chewed</span> beats whole', wt(c, "asp", "chewing"), out=T["tx"] - 0.12, size=96)
    c.title('<span class="t">EMT</span>: check first', T["tx"], out=wt(c, "tx", "then") - 0.1, size=96)
    c.title('<span class="y">4 × 81 mg</span> chewable', wt(c, "tx", "then"), out=wt(c, "tx", "chewed") - 0.1, size=96)
    c.title('<span class="g">Chew</span>, then swallow', wt(c, "tx", "chewed"), out=T["end"] - 0.12, size=96)

    # ---- A: Frank at the table, chest pain at frame zero
    g('tl.fromTo("#cam",{scale:1.16,x:60,y:40},{scale:1.1,x:40,y:30,duration:1.2,ease:"sine.out"},0);')
    g('tl.fromTo("#chestGlow",{opacity:0.35,scale:0.8,svgOrigin:"391 424"},{opacity:0.95,scale:1.15,duration:0.42,yoyo:true,repeat:23,ease:"sine.inOut"},0);')
    g('tl.fromTo("#chestRing",{opacity:0.9,scale:0.6,svgOrigin:"391 424"},{opacity:0,scale:1.7,duration:0.84,repeat:5,ease:"power1.out"},0);')
    g('tl.fromTo(".sw",{opacity:0,y:0},{opacity:1,y:70,duration:1.1,stagger:0.35,repeat:4,ease:"power1.in"},0);')
    g('tl.to("#aFar",{x:24,duration:5,ease:"sine.inOut"},0); tl.to("#tableW",{x:-24,duration:5,ease:"sine.inOut"},0);')
    for i in range(6): c.sound("heartbeat_real", 0.02 + i * 0.84, 0.75)
    c.sound("gasp_male_real", 0.05, 0.55)
    c.music_auto += [(0, T["dive"] - 0.6, 0.35)]
    tsw0 = wt(c, "hook", "swallow")
    g(f'tl.to("#tabPath",{{opacity:0.9,duration:0.2}},{tsw0-0.3:.2f});')
    g(f'tl.to("#flyTab",{{x:-230,y:-248,duration:0.9,ease:"power2.inOut"}},{tsw0-0.3:.2f}); tl.to("#flyTab",{{y:-242,duration:0.4,yoyo:true,repeat:5,ease:"sine.inOut"}},{tsw0+0.6:.2f});')
    c.fade_in("#wholeTag", tsw0 + 0.5, 0.3, 10); c.sound("swish", tsw0 - 0.3, 0.5)
    c.fade_out("#tabPath, #wholeTag, #flyTab", T["dive"] - 0.15, 0.2)
    t_asp = wt(c, "hook", "aspirin")
    cam_to(c, t_asp - 0.3, 520, 420, 1.22, 0.9)
    g(f'tl.fromTo("#tabGlow",{{opacity:0}},{{opacity:1,duration:0.25,yoyo:true,repeat:3,immediateRender:false}},{t_asp:.2f});')
    c.sound("pop", t_asp, 0.6)
    ts = C["hook"][1]
    c.pop("#slowW", ts, 0.4); c.sound("tick", ts, 0.5)
    g(f'tl.to("#slowHand",{{rotation:60,svgOrigin:"820 330",duration:{T["dive"]-ts:.2f},ease:"none"}},{ts:.2f});')
    for k in range(4): c.sound("tock", ts + 0.4 + k * 0.45, 0.45)
    c.fade_out("#slowW", T["dive"] - 0.1, 0.25)

    # ---- Frank stays on screen; the heart grows out of his chest (continuous, no dive into the body)
    t = T["dive"]
    tk = wt(c, "dive", "cracks")
    c.cam(t - 0.35, 1.0, 0, 0, 0.6, "power2.inOut")
    c.sound("dive", t - 0.1, 1.0); c.sound("riser", t - 0.6, 0.5)
    g(f'tl.to("#scA",{{scale:{A_S},x:{A_X},y:{A_Y},svgOrigin:"0 0",duration:0.8,ease:"power3.inOut"}},{t-0.3:.2f});')
    g(f'tl.to("#dimA",{{opacity:1,duration:0.6}},{t:.2f});')
    g(f'tl.fromTo("#chestHeart",{{opacity:0,scale:0.6,svgOrigin:"396 430"}},{{opacity:0.85,scale:1,duration:0.35,ease:"back.out(2)",immediateRender:false}},{t-0.25:.2f});')
    g(f'tl.to("#chestHeart",{{opacity:0,duration:0.3}},{t+0.55:.2f});')
    c.set("#scH", t + 0.1, "opacity:1")
    g(f'tl.fromTo("#hGrow",{{scale:0.06,x:{CH[0]-540:.1f},y:{CH[1]-420:.1f},svgOrigin:"540 420"}},{{scale:{H_S},x:{H_X},y:{H_Y},duration:0.95,ease:"power3.out",immediateRender:false}},{t+0.1:.2f});')
    g(f'tl.fromTo("#callout",{{opacity:0}},{{opacity:1,duration:0.5,immediateRender:false}},{t+0.45:.2f});')
    rig.react(c, "fr", "wince", wt(c, "dive", "attacks") - 0.05)
    tc = wt(c, "dive", "coronary")
    g(f'tl.to(".cor",{{fill:"#ffb02e",duration:0.3}},{tc:.2f});')
    g(f'tl.fromTo("#corRing",{{opacity:0,scale:0.4,svgOrigin:"640 420"}},{{opacity:1,scale:1,duration:0.35,ease:"back.out(2)",immediateRender:false}},{tc:.2f});')
    c.fade_in("#corTag", tc, 0.3, 14); c.sound("shimmer", tc, 0.7)
    # ---- the artery opens out of the coronary spot like a lens; Frank slides into a corner inset
    tl0 = tk - 0.6

    def vcam(t, px, py, k, d=0.8, ease="power2.inOut"):
        """Camera inside the artery view only, so the Frank inset never leaves the frame."""
        g(f'tl.to("#vCam",{{scale:{k},x:{540 - k * px:.1f},y:{480 - k * py:.1f},svgOrigin:"0 0",duration:{d},ease:"{ease}"}},{t:.2f});')
    c.sound("whoosh", tl0, 0.8)
    c.set("#scV", tl0, "opacity:1")
    g(f'tl.fromTo("#lensC",{{attr:{{r:0}}}},{{attr:{{r:1250}},duration:0.95,ease:"power2.in",immediateRender:false}},{tl0:.2f});')
    g(f'tl.fromTo("#vZoom",{{scale:0.35,x:{LENS[0]-0.35*PX:.1f},y:{LENS[1]-0.35*560:.1f},svgOrigin:"0 0"}},{{scale:1,x:0,y:0,duration:1.05,ease:"power2.inOut",immediateRender:false}},{tl0:.2f});')
    g(f'tl.to("#callout",{{opacity:0,duration:0.25}},{tl0:.2f});')
    c.set("#insW", tl0, "opacity:1"); c.set("#frankW", tl0, "opacity:0")
    g(f'tl.fromTo("#insMove",{{scale:{A_S},x:{A_X},y:{A_Y},svgOrigin:"0 0"}},{{scale:{INS_S},x:{INS_X:.1f},y:{INS_Y:.1f},duration:0.95,ease:"power2.inOut",immediateRender:false}},{tl0:.2f});')
    g(f'tl.fromTo("#insC",{{attr:{{r:520}}}},{{attr:{{r:{INS[2]}}},duration:0.95,ease:"power2.inOut",immediateRender:false}},{tl0:.2f});')
    g(f'tl.to("#insRing",{{opacity:1,duration:0.4}},{tl0+0.6:.2f}); tl.to("#insWall",{{opacity:1,duration:0.6}},{tl0+0.3:.2f});')
    c.set("#scA, #dimA, #scH", tk + 0.3, "opacity:0")
    g(f'tl.fromTo("#insGlow",{{opacity:0.35}},{{opacity:0.85,duration:0.42,yoyo:true,repeat:{int((T["tx"]-tl0)/0.42)},ease:"sine.inOut",immediateRender:false}},{tl0:.2f});')
    g(f'tl.to("#capL",{{rotation:-9,svgOrigin:"{PX-170} {LUM_B+10}",duration:0.25,ease:"back.out(3)"}},{tk:.2f}); tl.to("#capR",{{rotation:9,svgOrigin:"{PX+170} {LUM_B+10}",duration:0.25,ease:"back.out(3)"}},{tk:.2f});')
    g(f'tl.fromTo("#crack",{{opacity:0}},{{opacity:1,duration:0.15,immediateRender:false}},{tk:.2f});')
    c.sound("punch", tk, 0.8); c.fade_in("#plaqueTag", tk + 0.05, 0.3, 12)
    tp = wt(c, "dive", "platelets")
    c.fade_out("#plaqueTag", tp - 0.1, 0.2)
    c.fade_in("#pltTag", tp, 0.3, 12)
    g(f'tl.fromTo(".pl",{{x:-560,y:-80,opacity:0}},{{x:0,y:0,opacity:1,duration:0.5,stagger:0.08,ease:"power3.out",immediateRender:false}},{tp:.2f});')
    for k in range(6): c.sound("pop", tp + 0.25 + k * 0.17, 0.3)
    tcl = wt(c, "dive", "clot")
    c.fade_out("#pltTag", tcl - 0.1, 0.2); c.fade_in("#clotTag", tcl, 0.3, 12)
    g(f'tl.set("#clot",{{opacity:1}},{tcl:.2f});')
    g(f'tl.to(".fib",{{strokeDashoffset:0,duration:0.6,stagger:0.1,ease:"power2.out"}},{tcl:.2f});')
    g(f'tl.fromTo(".tr",{{opacity:0,scale:0.4,transformOrigin:"50% 50%"}},{{opacity:1,scale:1,duration:0.35,stagger:0.08,ease:"back.out(2)",immediateRender:false}},{tcl+0.1:.2f});')
    tsv = wt(c, "dive", "starves")
    g(f'tl.to(".rb",{{opacity:0.3,duration:0.6}},{tsv:.2f});')
    c.fade_in("#muscleTag", tsv - 0.3, 0.25, 10)
    g(f'tl.to("#muscleDark",{{opacity:0.88,duration:0.9,ease:"power1.in"}},{tsv:.2f});')
    c.fade_out("#muscleTag", tsv + 0.45, 0.2); c.fade_in("#starveTag", tsv + 0.5, 0.3, 10)
    vcam(tsv - 0.1, 760, 640, 1.18, 0.6)
    c.sound("heartbeat_real", tsv, 0.5); c.sound("heartbeat_real", tsv + 1.0, 0.35)
    c.music_auto += [(tsv, T["asp"] - 0.1, 0.25)]

    # ---- aspirin arrives
    t = T["asp"]
    vcam(t - 0.1, 540, 480, 1.0, 0.6)
    g(f'tl.to(".rb",{{opacity:1,duration:0.4}},{t:.2f});')
    c.fade_out("#clotTag, #starveTag", t - 0.1, 0.2)
    c.pop("#aspMol", t + 0.05, 0.45); c.sound("swish", t - 0.05, 0.7); c.sound("shimmer", t + 0.1, 0.5)
    g(f'tl.fromTo(".asp",{{x:0}},{{x:560,duration:1.2,stagger:0.1,ease:"power2.out",immediateRender:false}},{t+0.2:.2f});')
    g(f'tl.to(".asp",{{opacity:0,duration:0.3,stagger:0.06}},{t+1.3:.2f});')
    tls = wt(c, "asp", "less")
    g(f'tl.to(".pl .spk",{{scale:0,svgOrigin:"0 0",duration:0.4,stagger:0.01,ease:"power2.in"}},{tls:.2f});')
    g(f'tl.to(".pl .pin ellipse",{{fill:"#7d8798",stroke:"#cfd6e2",strokeDasharray:"4 4",duration:0.4}},{tls:.2f});')
    g(f'tl.to(".pl",{{y:-6,duration:0.3,yoyo:true,repeat:1,stagger:0.02}},{tls:.2f});')
    c.fade_in("#stickyTag", tls, 0.3, 12); c.sound("check", tls + 0.2, 0.5)
    tw = C["asp"][1]
    c.fade_out("#stickyTag, #aspMol", tw - 0.1, 0.2)
    g(f'tl.fromTo("#dashClot",{{opacity:0}},{{opacity:1,duration:0.2,immediateRender:false}},{tw:.2f});')
    c.fade_in("#noDiss", tw + 0.05, 0.3, 12); c.sound("wrong", tw + 0.4, 0.5)
    g(f'tl.to("#clot",{{x:6,duration:0.06,yoyo:true,repeat:7,ease:"none"}},{tw+0.2:.2f});')
    vcam(tw, PX, 470, 1.2, 0.5)
    tg = C["asp"][2]
    c.fade_out("#noDiss, #dashClot", tg - 0.1, 0.2)
    c.fade_in("#stopTag", tg, 0.3, 12)
    g(f'tl.fromTo(".pp",{{x:0}},{{x:1500,duration:1.5,stagger:0.16,ease:"none",immediateRender:false}},{tg:.2f});')
    vcam(tg, 540, 480, 1.0, 0.5); c.sound("check", tg + 0.3, 0.5)
    tr = C["asp"][3]
    c.fade_out("#stopTag", tr - 0.1, 0.2)
    g(f'tl.fromTo("#raceW",{{opacity:0,y:30}},{{opacity:1,y:0,duration:0.3,immediateRender:false}},{tr:.2f});')
    c.sound("swish", tr - 0.05, 0.7)
    g(f'tl.fromTo(".crumb",{{x:0,y:0}},{{x:(i)=>(i-2)*16,y:(i)=>((i%2)?1:-1)*12,duration:0.25,ease:"back.out(3)",immediateRender:false}},{tr+0.15:.2f});')
    g(f'tl.to("#chewTab",{{x:900,duration:0.9,ease:"power2.in"}},{tr+0.4:.2f});')
    g(f'tl.to("#wholeTab",{{x:260,duration:{T["tx"]-tr-0.5:.2f},ease:"none"}},{tr+0.4:.2f}); tl.to("#wholeSpin",{{rotation:200,duration:{T["tx"]-tr-0.5:.2f},ease:"none"}},{tr+0.4:.2f});')
    g(f'tl.fromTo("#winChk",{{opacity:0,scale:0.3,svgOrigin:"930 170"}},{{opacity:1,scale:1,duration:0.35,ease:"back.out(2.5)",immediateRender:false}},{tr+1.3:.2f});')
    c.sound("whoosh_real", tr + 0.45, 0.8); c.sound("ding", tr + 1.3, 0.6)
    c.fade_in("#fastTxt", tr + 1.3, 0.3, 10)

    # ---- treatment: EMT at the table
    t = T["tx"]
    # the inset opens back up into the room: same Frank, same spot, the circle just grows
    tt0 = t - 0.15
    k0x, k0y = INS_X + INS_S * (150 - 26), INS_Y
    c.set("#scT", tt0, "opacity:1")
    g(f'tl.fromTo("#tZoom",{{scale:{INS_S},x:{k0x:.1f},y:{k0y:.1f},svgOrigin:"0 0"}},{{scale:1,x:0,y:0,duration:0.95,ease:"power2.inOut",immediateRender:false}},{tt0:.2f});')
    g(f'tl.fromTo("#txC",{{attr:{{r:{INS[2]}}}}},{{attr:{{r:1400}},duration:0.95,ease:"power2.in",immediateRender:false}},{tt0:.2f});')
    c.set("#insW", tt0 + 0.05, "opacity:0"); c.set("#scV", tt0 + 1.0, "opacity:0")
    c.sound("riser", t - 0.9, 0.6); c.sound("swish", t - 0.1, 0.8); c.sound("cloth_real", t + 0.2, 0.7)
    for i, w in enumerate(("allergies", "bleeding", "aspirin")):
        tq = wt(c, "tx", w)
        c.fade_in(f"#q{i}", tq, 0.3, 14); c.sound("pop", tq, 0.5)
        g(f'tl.fromTo("#qc{i}",{{opacity:0,scale:0.3,transformOrigin:"50% 50%"}},{{opacity:1,scale:1,duration:0.3,ease:"back.out(2.5)",immediateRender:false}},{tq+0.45:.2f});')
        c.sound("check", tq + 0.45, 0.6)
    tgv = C["tx"][1]
    c.fade_out("#q0, #q1, #q2", tgv - 0.1, 0.25)
    swap(c, "#eP", "#eO", tgv)
    c.fade_in("#dosePanel", tgv, 0.3, 14); c.sound("swish", tgv - 0.05, 0.6)
    t4 = wt(c, "tx", "four")
    for i in range(4):
        c.pop(f"#tb{i}", tgv + 0.25 + i * 0.18, 0.35); c.sound("tick", tgv + 0.25 + i * 0.18, 0.5)
    g(f'tl.fromTo("#tb0, #tb1, #tb2, #tb3",{{scale:1}},{{scale:1.25,transformOrigin:"50% 50%",duration:0.18,yoyo:true,repeat:1,stagger:0.12,immediateRender:false}},{t4-0.1:.2f});')
    c.sound("ding", t4, 0.4)
    g(f'tl.to("#doseNum",{{opacity:1,duration:0.3}},{t4+0.4:.2f});')
    tch = C["tx"][2]
    c.fade_out("#dosePanel", tch - 0.1, 0.2)
    swap(c, "#eO", "#eC", tch)
    g(f'tl.fromTo(".cr",{{x:0,y:0,scale:1}},{{x:(i)=>((i%2)?1:-1)*(22+i*8),y:(i)=>(i<2?-1:1)*(10+i*4),scale:0.55,transformOrigin:"50% 50%",duration:0.35,stagger:0.08,ease:"back.out(2)",immediateRender:false}},{tch+0.15:.2f});')
    c.sound("pop", tch + 0.1, 0.4); c.sound("pop", tch + 0.34, 0.4)
    cam_to(c, tch + 0.1, 300, 340, 1.45, 0.6, "power2.inOut")
    g(f'tl.fromTo(".mc",{{opacity:0,y:0}},{{opacity:1,y:(i)=>14+i*6,x:(i)=>((i%2)?1:-1)*12,duration:0.3,stagger:0.12,repeat:2,ease:"power1.out",immediateRender:false}},{tch+0.3:.2f});')
    tsw = wt(c, "tx", "swallowed")
    g(f'tl.to("#thenSw",{{opacity:1,duration:0.3}},{tsw:.2f});'); c.sound("check", tsw + 0.2, 0.6)
    c.sound("cloth_real", tch + 0.3, 0.3)
    cam_to(c, T["tx"] + 0.8, 540, 470, 1.05, 2.4, "sine.inOut")
    cam_to(c, tgv, 700, 400, 1.3, 0.8, "power2.inOut")
    cam_to(c, wt(c, "tx", "four") + 0.6, 560, 460, 1.04, 0.8, "power2.inOut")

    # ---- character life: breathing, blinks, head sway, reactions on the words
    rig.idle(c, "fr", 0, tk + 0.4, seed=3, fast=True)
    rig.react(c, "fr", "wince", 0.05)
    rig.react(c, "fr", "squint", ts)
    rig.idle(c, "fi", tl0, T["tx"] + 0.9, seed=5, fast=True)
    rig.react(c, "fi", "wince", tsv)
    rig.react(c, "fi", "lookup", wt(c, "asp", "chewing"))
    rig.idle(c, "fT", tt0, TOT, seed=7, fast=True)
    for w in ("allergies", "bleeding", "today"):
        rig.react(c, "fT", "shake" if w != "today" else "nod", wt(c, "tx", w) + 0.35, 0.7)
    rig.react(c, "fT", "relief", tsw)
    rig.idle(c, "eP", tt0, tgv + 0.3, seed=11)
    rig.react(c, "eP", "nod", wt(c, "tx", "today") + 0.3, 0.8)
    rig.idle(c, "eO", tgv - 0.2, tch + 0.3, seed=13)
    rig.react(c, "eO", "nod", t4, 0.8)
    rig.idle(c, "eC", tch - 0.2, TOT, seed=17, sway=0)
    return svg


SPEC = dict(
    id=ID, badge="NREMT  CHEST PAIN", tail=1.8, bpm=84, key=-3, seed=41,
    vars="--glow:#3a1420;--acc1:#ff6b6b;--acc2:#2ee6d6",
    css="#end-l1{font-size:84px;letter-spacing:-1.5px} #badge span{color:#ff8a8a;border-color:#ff8a8a} .cap .w.on{color:#ff9a8a} .cap span.box{background:rgba(40,8,16,.88);border-color:rgba(255,120,120,.25)} #wm{color:#ff9a8a}",
    end_line='Chest pain aspirin?<br><span style="color:#3fe07a">Chew it.</span><div style="font-size:58px;color:#bff8f2;margin-top:34px;font-weight:800">Free practice on</div>',
    beats=B.ASPIRIN, compose=compose,
)
lpx.apply_gaps(SPEC)
