"""y1011-02 Burn story: sleeve catches fire on a gas stove -> burned forearm -> dive into the skin (three zones side by side:
red superficial rim, blistered partial thickness ring, numb full thickness center) -> EMT treatment on the same arm.
2.5D: layered scenes with parallax, camera moves and a dive transition."""
import math
import faces
from person import kitchen_figure, head as phead
from anatomy import forearm_dorsal, hand_dorsal, kitchen_arm, kitchen_torso

# ---------- skin slab (scene C) ----------
X0, X1 = 30, 740
DX, DY = 40, -36
YS, YE, YD, YF, YM = 260, 312, 580, 770, 900
SUP = ((120, 210), (560, 650))
PAR = ((210, 300), (470, 560))
CORE = (300, 470)
NERVES = [(95, "out"), (165, "sup"), (255, "par"), (340, "core"), (430, "core"), (515, "par"), (605, "sup"), (700, "out")]
MX, MTOP, MBOT = 800, 220, 640

JS = r"""
const P = {v:1};
function pm(){ const h = 400*P.v/10; const f=document.getElementById('mfill'); if(!f) return; f.setAttribute('y', 640-h); f.setAttribute('height', h);
  document.getElementById('mval').textContent = Math.round(P.v);
  document.getElementById('mknob').setAttribute('cy', 640-h); }
pm();
"""


def wave_pts(y, x0, x1, amp=9, per=46):
    pts, x = [], x0
    while x <= x1:
        pts.append(f"{x:.0f},{y + amp * math.sin((x - x0) / per * 2 * math.pi):.1f}")
        x += 6
    return pts


def nerve(x, kind):
    col = "#6f7480" if kind == "core" else "#ffd23f"
    tipc = "#5d626d" if kind == "core" else "#ffe26b"
    br = (f'<path d="M{x} 380 C{x-6} 360 {x-18} 346 {x-24} 330"/><path d="M{x} 380 C{x+6} 360 {x+16} 344 {x+22} 326"/>'
          f'<path d="M{x} 376 L{x+1} 338"/>')
    tips = "".join(f'<circle class="nt {kind}" cx="{px}" cy="{py}" r="7.5" fill="{tipc}"/>' for px, py in ((x - 24, 330), (x + 22, 326), (x + 1, 336)))
    sig = 0 if kind in ("core", "out") else 0.85
    return (f'<g class="nf {kind}" fill="none" stroke="{col}" stroke-width="5" stroke-linecap="round">'
            f'<path d="M{x} 600 C{x-26} 530 {x+24} 450 {x} 372"/>{br}</g>{tips}'
            f'<path class="sig {kind}" d="M{x} 372 C{x+24} 450 {x-26} 530 {x} 600" pathLength="1" fill="none" stroke="#ffffff" '
            f'stroke-width="9" stroke-linecap="round" stroke-dasharray="0.07 0.43" opacity="{sig}"/>')


def slab_svg():
    junction = wave_pts(YE, X0, X1)
    epi = f"M{X0},{YS} L{X1},{YS} L" + " L".join(reversed(junction)) + " Z"
    derm = "M" + " L".join(junction) + f" L{X1},{YD} L{X0},{YD} Z"
    fat = "".join(f'<ellipse cx="{x}" cy="{y}" rx="32" ry="22" fill="url(#gFat)" stroke="#d9a63a" stroke-width="3"/>'
                  for row, y in enumerate(range(605, 760, 46)) for x in range(X0 + 30 + (row % 2) * 34, X1 - 10, 68))
    stri = "".join(f'<path d="M{X0} {y} C{X0+260} {y-8} {X1-260} {y+8} {X1} {y}" stroke="#8f2730" stroke-width="3" opacity=".55" fill="none"/>' for y in range(786, 900, 16))
    collagen = "".join(f'<path d="M{X0+10} {y} C{X0+200} {y-14} {X0+380} {y+14} {X0+560} {y-6} S{X1-60} {y+10} {X1-10} {y}" stroke="#fff" stroke-width="3" opacity=".16" fill="none"/>' for y in range(352, 572, 22))
    caps = "".join(f'<path d="M{x-10} 520 C{x-12} 420 {x-8} 330 {x} 326 C{x+8} 330 {x+12} 420 {x+10} 520" stroke="#e5484d" stroke-width="3.5" fill="none" opacity=".75"/>' for x in range(78, 740, 92))
    vessels = (f'<path d="M{X0} 524 C200 512 400 536 600 520 S{X1-40} 528 {X1} 520" stroke="#d42f3a" stroke-width="12" fill="none" stroke-linecap="round"/>'
               f'<path d="M{X0} 546 C200 560 400 538 600 552 S{X1-40} 546 {X1} 552" stroke="#4f6fd8" stroke-width="12" fill="none" stroke-linecap="round"/>'
               f'<path class="flow" d="M{X0} 524 C200 512 400 536 600 520 S{X1-40} 528 {X1} 520" stroke="#ffb3b8" stroke-width="5" fill="none" stroke-dasharray="10 34" stroke-linecap="round" opacity=".8"/>'
               f'<path class="flow" d="M{X1} 552 C{X1-40} 546 600 552 600 552 C400 538 200 560 {X0} 546" stroke="#b8c8ff" stroke-width="5" fill="none" stroke-dasharray="10 34" stroke-linecap="round" opacity=".8"/>')
    hair = (f'<path d="M672 {YS-70} C674 {YS-30} 676 {YS} 678 640" stroke="#3a2416" stroke-width="7" fill="none" stroke-linecap="round"/>'
            f'<path d="M662 {YS+6} L666 630 L690 630 L692 {YS+6}" fill="none" stroke="#b9787a" stroke-width="4"/>'
            f'<ellipse cx="678" cy="642" rx="22" ry="18" fill="#c98a84" stroke="#9c5b5d" stroke-width="3"/>')
    gland = (f'<g fill="none" stroke="#7fd1e0" stroke-width="5" stroke-linecap="round"><path d="M52 {YS+4} C56 360 42 440 54 560"/>'
             f'<path d="M54 560 C22 570 26 606 54 604 C82 602 86 572 60 576 C38 580 40 616 66 616"/></g>')
    trunk = f'<path d="M{X0} 612 C200 600 520 620 {X1} 606" stroke="#ffd23f" stroke-width="9" fill="none" opacity=".9"/>'
    nerves = "".join(nerve(x, k) for x, k in NERVES)
    # burn: superficial over the whole patch, partial ring, full thickness core
    burn = (f'<rect x="{SUP[0][0]}" y="{YS}" width="{SUP[1][1]-SUP[0][0]}" height="{YE-YS+8}" fill="#ff3b30" opacity=".55"/>'
            f'<rect x="{PAR[0][0]}" y="{YS}" width="{PAR[1][1]-PAR[0][0]}" height="{YE-YS+8}" fill="#c4182a" opacity=".8"/>'
            f'<rect x="{PAR[0][0]}" y="{YE+8}" width="{PAR[1][1]-PAR[0][0]}" height="{440-YE}" fill="url(#gPar)"/>')
    spots = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" opacity="{o}"/>' for x, y, rx, ry, c, o in (
        (345, 296, 30, 11, "#efe6d6", .8), (420, 286, 36, 10, "#f6efe2", .7), (330, 400, 40, 24, "#140906", .6),
        (430, 470, 46, 26, "#120806", .5), (360, 530, 30, 16, "#4a2a20", .7), (450, 360, 20, 30, "#0f0806", .55)))
    cracks = (f'<path d="M318 {YS} L338 300 L328 340 M392 {YS} L404 312 L396 360 L414 400 M450 {YS} L440 318 L456 368" '
              f'stroke="#0a0504" stroke-width="5" fill="none" stroke-linecap="round"/>')
    core = (f'<path d="M{CORE[0]} {YS} L{CORE[1]} {YS} L{CORE[1]} {YD} C{CORE[1]-50} {YD+12} {CORE[0]+50} {YD+12} {CORE[0]} {YD} Z" fill="url(#gChar)"/>'
            f'{spots}{cracks}')
    top_rings = (f'<ellipse cx="{385+DX/2}" cy="{YS+DY/2}" rx="265" ry="14" fill="#ff5a4a" opacity=".9"/>'
                 f'<ellipse cx="{385+DX/2}" cy="{YS+DY/2}" rx="175" ry="12" fill="#c4182a"/>'
                 f'<ellipse cx="{385+DX/2}" cy="{YS+DY/2}" rx="85" ry="10" fill="#2a1712"/>'
                 f'<ellipse cx="{385+DX/2-20}" cy="{YS+DY/2-2}" rx="40" ry="4" fill="#efe6d6" opacity=".7"/>')
    blisters = "".join(
        f'<g class="blW"><g class="bl"><path d="M{a+4} {YS+2} C{a+12} {YS-58} {b-12} {YS-58} {b-4} {YS+2} Z" fill="url(#gBl)" stroke="#fff" stroke-width="5"/>'
        f'<path d="M{a+18} {YS-26} C{a+30} {YS-40} {a+46} {YS-42} {a+58} {YS-40}" stroke="#fff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/></g></g>'
        for a, b in PAR)
    return f'''
  <g filter="url(#sh)">
    <path d="M{X0} {YS} L{X1} {YS} L{X1+DX} {YS+DY} L{X0+DX} {YS+DY} Z" fill="url(#gTop)"/>
    <path d="M{X1} {YS} L{X1+DX} {YS+DY} L{X1+DX} {YM+DY} L{X1} {YM} Z" fill="#b8706a"/>
    <path d="M{X1} {YS} L{X1+DX} {YS+DY} L{X1+DX} {YE+DY} L{X1} {YE} Z" fill="#d9a07f"/>
    <path d="M{X1} {YD} L{X1+DX} {YD+DY} L{X1+DX} {YF+DY} L{X1} {YF} Z" fill="#d8ac4a"/>
    <path d="M{X1} {YF} L{X1+DX} {YF+DY} L{X1+DX} {YM+DY} L{X1} {YM} Z" fill="#8a2a33"/>
    <rect x="{X0}" y="{YS}" width="{X1-X0}" height="{YM-YS}" fill="url(#gMus)"/>
  </g>
  {top_rings}
  <g clip-path="url(#slab)">
    <rect x="{X0}" y="{YF}" width="{X1-X0}" height="{YM-YF}" fill="url(#gMus)"/>{stri}
    <rect x="{X0}" y="{YD}" width="{X1-X0}" height="{YF-YD}" fill="#f7d27a"/>{fat}
    <path d="{derm}" fill="url(#gDerm)"/>{collagen}{caps}{vessels}{gland}{hair}{trunk}
    <path d="{epi}" fill="url(#gEpi)"/>
    <g id="nerves">{nerves}</g>
    {burn}{core}
  </g>
  <path d="M672 {YS-70} C674 {YS-30} 676 {YS} 678 {YS+4}" stroke="#3a2416" stroke-width="7" fill="none" stroke-linecap="round"/>
  <rect x="{X0}" y="{YS}" width="{X1-X0}" height="{YM-YS}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>
  {blisters}
  <g id="cEmbers">{"".join(f'<circle class="ce" cx="{x}" cy="{YS-8}" r="{r}" fill="{col}" opacity="0"/>' for x, r, col in ((330, 5, "#ffb347"), (370, 4, "#ffd23f"), (410, 6, "#ff7a3d"), (450, 4, "#fff2a8"), (395, 3, "#ffd23f")))}</g>
  <!-- zone focus boxes and chips -->
  {"".join(f'<rect class="fSup" x="{a}" y="{YS-4}" width="{b-a}" height="{YE-YS+16}" rx="10" fill="none" stroke="#ffd23f" stroke-width="7" filter="url(#glow)" opacity="0"/>' for a, b in SUP)}
  {"".join(f'<rect class="fPar" x="{a}" y="{YS-64}" width="{b-a}" height="{440-YS+64}" rx="12" fill="none" stroke="#ff9a3d" stroke-width="7" filter="url(#glow)" opacity="0"/>' for a, b in PAR)}
  <rect id="fCore" x="{CORE[0]}" y="{YS-6}" width="{CORE[1]-CORE[0]}" height="{YD-YS+16}" rx="12" fill="none" stroke="#ff4f6b" stroke-width="7" filter="url(#glow)" opacity="0"/>
  <g id="chSup" opacity="0"><path d="M165 {YS-12} L240 150 M605 {YS-12} L530 150" stroke="#ffd23f" stroke-width="4" stroke-dasharray="7 7"/>
    <rect x="215" y="92" width="340" height="64" rx="32" fill="#081428" stroke="#ffd23f" stroke-width="4"/><text x="385" y="137" text-anchor="middle" class="lbl" font-size="36" fill="#ffd23f">superficial rim</text></g>
  <g id="chPar" opacity="0"><path d="M255 {YS-66} L300 150 M515 {YS-66} L470 150" stroke="#ff9a3d" stroke-width="4" stroke-dasharray="7 7"/>
    <rect x="195" y="92" width="380" height="64" rx="32" fill="#081428" stroke="#ff9a3d" stroke-width="4"/><text x="385" y="137" text-anchor="middle" class="lbl" font-size="36" fill="#ff9a3d">partial thickness</text></g>
  <g id="chCore" opacity="0"><path d="M385 {YS-10} L385 156" stroke="#ff6b7d" stroke-width="4" stroke-dasharray="7 7"/>
    <rect x="215" y="92" width="340" height="64" rx="32" fill="#081428" stroke="#ff6b7d" stroke-width="4"/><text x="385" y="137" text-anchor="middle" class="lbl" font-size="36" fill="#ff6b7d">full thickness</text></g>
  <g id="edgeTag" opacity="0"><path d="M300 662 L255 470 M470 662 L515 470" stroke="#fff" stroke-width="5" stroke-dasharray="8 8" fill="none"/>
    <circle cx="255" cy="470" r="9" fill="#fff"/><circle cx="515" cy="470" r="9" fill="#fff"/>
    <rect x="215" y="662" width="340" height="66" rx="33" fill="#081428" stroke="#ff6b6b" stroke-width="5"/>
    <text x="385" y="707" text-anchor="middle" class="lbl" font-size="36" fill="#ff8a8a">ring still hurts</text></g>
  <!-- pain meter -->
  <g id="meter">
    <text x="{MX+48}" y="{MTOP-62}" text-anchor="middle" class="lbl" font-size="34" fill="#a9bbd8">PAIN</text>
    <text id="mval" x="{MX+48}" y="{MTOP-14}" text-anchor="middle" class="lbl" font-size="50" fill="#fff">1</text>
    <rect x="{MX}" y="{MTOP}" width="96" height="{MBOT-MTOP}" rx="48" fill="#081a33" stroke="#1d3a66" stroke-width="6"/>
    <rect x="{MX+14}" y="{MTOP+14}" width="68" height="{MBOT-MTOP-28}" rx="34" fill="url(#gMeter)" opacity=".16"/>
    <rect id="mfill" x="{MX+14}" y="620" width="68" height="20" rx="18" fill="url(#gMeter)"/>
    <circle id="mknob" cx="{MX+48}" cy="620" r="20" fill="#fff" stroke="#081428" stroke-width="5"/>
    <text transform="translate({MX+122} {(MTOP+MBOT)//2}) rotate(-90)" text-anchor="middle" class="lbl" font-size="34" fill="#e3ebf7">illustrative scale</text>
  </g>
  <g id="numb" opacity="0"><rect x="{MX-42}" y="{MBOT+20}" width="180" height="62" rx="31" fill="#8fa3bf"/><text x="{MX+48}" y="{MBOT+62}" text-anchor="middle" class="lbl" font-size="34" fill="#081428">NUMB</text></g>
'''


# ---------- kitchen (scene A) ----------
def flame(x, y, s, cls, grad="gFl"):
    """A layered fire tongue: soft glow, red outer flame with a curling tip, orange body, white-hot core."""
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<ellipse cx="0" cy="-40" rx="70" ry="80" fill="url(#gGlowF)"/>'
            f'<g class="{cls}"><path d="M2 4 C-38 -10 -34 -56 -10 -86 C-4 -100 -12 -118 -2 -136 C12 -112 30 -96 30 -66 C40 -60 44 -40 38 -22 C34 -6 20 4 2 4 Z" fill="#ff4a1c" opacity=".9"/></g>'
            f'<g class="{cls}"><path d="M2 2 C-26 -8 -24 -44 -6 -66 C0 -78 -4 -92 4 -104 C14 -84 26 -70 24 -48 C30 -40 32 -24 26 -12 C20 -2 12 2 2 2 Z" fill="url(#{grad})"/></g>'
            f'<g class="{cls}"><path d="M2 0 C-12 -6 -12 -26 -2 -40 C2 -48 0 -56 4 -64 C12 -50 16 -38 14 -26 C16 -14 12 -2 2 0 Z" fill="#fff4c2"/></g>'
            f'</g>')


def kitchen_svg():
    tiles = "".join(f'<path d="M-100 {y} L1180 {y}" stroke="#ffffff" stroke-opacity=".07" stroke-width="3"/>' for y in range(380, 640, 52))
    tiles += "".join(f'<path d="M{x} 380 L{x} 640" stroke="#ffffff" stroke-opacity=".07" stroke-width="3"/>' for x in range(-80, 1180, 104))
    blue = "".join(f'<path class="gas" d="M{x} 662 C{x-8} 648 {x-4} 630 {x} 616 C{x+4} 630 {x+8} 648 {x} 662 Z" fill="url(#gGas)"/>' for x in range(630, 790, 18))
    cuff = "".join(flame(x, y, s, "cf") for x, y, s in ((664, 578, .78), (690, 566, 1.02), (716, 562, .9), (740, 572, .64), (640, 588, .56)))
    sparks = "".join(f'<circle class="spk" cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="0"/>' for x, y, r, c in (
        (645, 545, 3.5, "#ffd23f"), (665, 525, 3, "#fff2a8"), (689, 535, 4, "#ffb347"), (705, 515, 3, "#ffd23f"), (727, 533, 3.5, "#ff9a3d"),
        (675, 505, 2.5, "#fff2a8"), (740, 511, 3, "#ffd23f"), (657, 491, 3.5, "#ffb347")))
    smoke = "".join(f'<circle class="smk" cx="{x}" cy="{y}" r="{r}" fill="#9aa3b5" opacity="0"/>' for x, y, r in ((500, 470, 28), (532, 448, 36), (514, 416, 42), (552, 398, 32)))
    return f'''
  <g id="aFar">
    <rect x="-200" y="-100" width="1480" height="1160" fill="url(#gWall)"/>
    {tiles}
    <g filter="url(#blur3)">
      <rect x="-80" y="20" width="420" height="270" rx="10" fill="#4a3a52"/><rect x="-60" y="40" width="180" height="230" rx="8" fill="#56455f"/><rect x="140" y="40" width="180" height="230" rx="8" fill="#56455f"/>
      <rect x="760" y="20" width="420" height="270" rx="10" fill="#4a3a52"/><rect x="780" y="40" width="180" height="230" rx="8" fill="#56455f"/><rect x="980" y="40" width="180" height="230" rx="8" fill="#56455f"/>
      <rect x="400" y="50" width="300" height="230" rx="12" fill="#1b2a4a" stroke="#6b5a74" stroke-width="10"/>
      <circle cx="610" cy="110" r="26" fill="#fff6d6" opacity=".8"/>
      <ellipse cx="550" cy="40" rx="260" ry="120" fill="#ffb86b" opacity=".18"/>
      <rect x="420" y="250" width="260" height="14" rx="4" fill="#6b5a74"/>
      <path d="M470 250 C460 220 470 200 486 196 C500 200 506 222 498 250 Z" fill="#3f8a5a"/><rect x="468" y="236" width="34" height="20" rx="4" fill="#c46a4a"/>
      <path d="M600 252 C596 236 606 226 618 226 C628 230 630 244 624 252 Z" fill="#4fa06a"/>
    </g>
    <g filter="url(#blur3)" opacity=".95">
      <rect x="40" y="318" width="300" height="12" rx="4" fill="#7a5a3e"/>
      <rect x="62" y="270" width="40" height="48" rx="8" fill="#e8d7b8"/><rect x="62" y="264" width="40" height="12" rx="4" fill="#c4542e"/>
      <rect x="116" y="262" width="44" height="56" rx="8" fill="#d9c49c"/><rect x="116" y="256" width="44" height="12" rx="4" fill="#3a7a5a"/>
      <rect x="174" y="276" width="36" height="42" rx="8" fill="#f0e2c4"/><rect x="174" y="270" width="36" height="12" rx="4" fill="#b8862b"/>
      <rect x="224" y="258" width="48" height="60" rx="8" fill="#e2c9a2"/><rect x="224" y="252" width="48" height="12" rx="4" fill="#2a5a8a"/>
      <rect x="284" y="272" width="36" height="46" rx="8" fill="#edd9b4"/><rect x="284" y="266" width="36" height="12" rx="4" fill="#a83a3a"/>
      <path d="M600 300 L980 300 L940 380 L640 380 Z" fill="url(#gSteel)"/><rect x="630" y="380" width="320" height="16" rx="4" fill="#4a5262"/>
      <ellipse cx="790" cy="398" rx="150" ry="10" fill="#fff2c4" opacity=".55"/>
      <path d="M760 300 L760 -100 L820 -100 L820 300 Z" fill="#7d8798"/>
      <rect x="500" y="470" width="44" height="64" rx="8" fill="#e9e2d6"/><circle cx="514" cy="494" r="5" fill="#6b6460"/><circle cx="530" cy="494" r="5" fill="#6b6460"/><circle cx="514" cy="514" r="5" fill="#6b6460"/><circle cx="530" cy="514" r="5" fill="#6b6460"/>
      <path d="M1000 420 L1180 420" stroke="#9aa4b4" stroke-width="8" stroke-linecap="round"/>
      <path d="M1040 420 L1040 452 M1110 420 L1110 448" stroke="#9aa4b4" stroke-width="5"/>
      <circle cx="1040" cy="486" r="36" fill="#3a3f4a" stroke="#5d6575" stroke-width="6"/><rect x="1036" y="448" width="8" height="12" fill="#5d6575"/>
      <ellipse cx="1110" cy="476" rx="26" ry="30" fill="#6a4a3a"/>
    </g>
  </g>
  <g id="charW">
    <g id="pA"><image href="poseA_full.png" x="-330" y="38" width="1440" height="1075"/></g>
    <g id="pB" opacity="0"><image href="poseB_full.png" x="-330" y="38" width="1440" height="1075"/></g>
    <g id="wA" opacity="1"><g transform="translate(744 560) rotate(-4)"><rect x="-7" y="-26" width="14" height="52" rx="5" fill="#2b2f3a"/><circle cx="0" cy="-20" r="12" fill="#cfd6e2" stroke="#8b94a5" stroke-width="3"/><circle cx="0" cy="-20" r="8" fill="#0e1622"/><path d="M0 -20 L0 -26 M0 -20 L4 -18" stroke="#2ee6d6" stroke-width="2" stroke-linecap="round"/></g></g><g id="wB" opacity="0"><g transform="translate(548 478) rotate(28)"><rect x="-7" y="-26" width="14" height="52" rx="5" fill="#2b2f3a"/><circle cx="0" cy="-20" r="12" fill="#cfd6e2" stroke="#8b94a5" stroke-width="3"/><circle cx="0" cy="-20" r="8" fill="#0e1622"/><path d="M0 -20 L0 -26 M0 -20 L4 -18" stroke="#2ee6d6" stroke-width="2" stroke-linecap="round"/></g></g>
  </g>
  <g id="aMid">
    <rect x="-200" y="660" width="1480" height="40" fill="#5a4a46"/>
    <rect x="-200" y="700" width="1480" height="400" fill="url(#gCab)"/>
    <rect x="520" y="640" width="520" height="34" rx="6" fill="#20232b"/>
    <rect x="560" y="720" width="440" height="200" rx="14" fill="#262a33" stroke="#3a3f4a" stroke-width="6"/>
    <rect x="600" y="740" width="360" height="40" rx="8" fill="#14171d"/>
    <path d="M610 646 L790 646 M700 630 L700 664 M640 636 L760 656 M640 656 L760 636" stroke="#0c0d10" stroke-width="9" stroke-linecap="round"/>
    <rect x="-200" y="656" width="1480" height="6" fill="#8a7a74" opacity=".6"/>
    <g filter="url(#sh)">
      <rect x="300" y="636" width="200" height="24" rx="8" fill="url(#gWood)"/>
      <path d="M318 640 L480 640" stroke="#d9a670" stroke-width="3" opacity=".6"/>
      <circle cx="350" cy="628" r="18" fill="#e0453a"/><path d="M344 612 C350 606 358 608 360 614" stroke="#3f8a5a" stroke-width="5" fill="none"/>
      <path d="M380 630 C384 622 392 620 400 624 L404 632 Z" fill="#e0453a"/><path d="M400 628 L404 632" stroke="#f6c9b0" stroke-width="2"/>
      <path d="M420 634 L486 626 L490 632 L424 640 Z" fill="#c9d2de"/><rect x="486" y="624" width="34" height="12" rx="4" fill="#2a2d33" transform="rotate(-7 486 630)"/>
    </g>
    <rect x="590" y="676" width="380" height="10" rx="4" fill="#3a3f4a"/>
    {"".join(f'<circle cx="{x}" cy="700" r="13" fill="#14171d" stroke="#4a5262" stroke-width="4"/>' for x in (620, 690, 870, 940))}
    <g id="gasW">{blue}</g>
    <g filter="url(#sh)">
      <path d="M1090 566 L1180 560 C1194 560 1196 576 1182 578 L1092 584 Z" fill="#2a2d33"/>
      <rect x="912" y="540" width="190" height="80" rx="14" fill="url(#gPot)"/>
      <ellipse cx="1007" cy="540" rx="96" ry="18" fill="#c9d2de"/><ellipse cx="1007" cy="540" rx="80" ry="12" fill="#8b94a5"/>
    </g>
  </g>
  <g id="armW">
    <g id="fireW"><g id="cuffFire">{cuff}</g>
    {sparks}</g>
    {smoke}
  </g>
  <g id="fireLight" style="mix-blend-mode:screen"><ellipse cx="690" cy="540" rx="460" ry="360" fill="url(#gFireLight)"/></g>
  <g id="aFront" filter="url(#blur3)" opacity=".85"><ellipse cx="80" cy="980" rx="260" ry="90" fill="#140f18"/><ellipse cx="1040" cy="1000" rx="300" ry="110" fill="#140f18"/></g>
'''


# ---------- burned forearm (scene B) ----------
def arm_svg():
    blis = "".join(f'<g class="bB"><path d="M{x-rx} {y} C{x-rx} {y-ry*1.2:.0f} {x+rx*0.2:.0f} {y-ry*1.3:.0f} {x+rx} {y-ry*0.2:.0f} C{x+rx*1.1:.0f} {y+ry*0.8:.0f} {x-rx*0.6:.0f} {y+ry*1.1:.0f} {x-rx} {y} Z" fill="#ffe6d8" fill-opacity=".72" stroke="#fff4ee" stroke-width="3"/>'
                   f'<ellipse cx="{x-rx*0.3:.0f}" cy="{y-ry*0.45:.0f}" rx="{rx*0.32:.0f}" ry="{ry*0.22:.0f}" fill="#fff" opacity=".9"/></g>'
                   for x, y, rx, ry in ((292, 474, 24, 15), (336, 550, 30, 17), (522, 456, 20, 13), (566, 522, 28, 18), (468, 576, 18, 11), (372, 446, 15, 10), (258, 530, 14, 9)))
    return f'''
  <g id="bBg">
    <rect x="-200" y="-100" width="1480" height="1160" fill="url(#gWall)"/>
    <g filter="url(#blur8)">
      <rect x="-80" y="-40" width="440" height="300" rx="10" fill="#4a3a52"/><rect x="760" y="-40" width="420" height="300" rx="10" fill="#4a3a52"/>
      <circle cx="560" cy="60" r="90" fill="#ffb86b" opacity=".35"/><circle cx="880" cy="150" r="40" fill="#ffd9a0" opacity=".35"/><circle cx="160" cy="200" r="50" fill="#ffd9a0" opacity=".25"/>
      <path d="M470 180 C460 150 470 128 488 124 C504 128 512 150 502 180 Z" fill="#3f8a5a"/><rect x="466" y="170" width="40" height="30" rx="6" fill="#c46a4a"/>
      <rect x="840" y="210" width="110" height="120" rx="30" fill="#7d8798"/><path d="M950 240 C990 240 990 290 950 296" stroke="#7d8798" stroke-width="14" fill="none"/><rect x="866" y="196" width="56" height="20" rx="8" fill="#5d6575"/>
      <rect x="60" y="250" width="70" height="90" rx="12" fill="#d8cbb8"/><path d="M80 250 L66 180 M100 250 L108 172" stroke="#5a4a40" stroke-width="10" stroke-linecap="round"/>
      <circle cx="300" cy="110" r="30" fill="#ffd9a0" opacity=".3"/><circle cx="700" cy="230" r="22" fill="#ffd9a0" opacity=".3"/>
    </g>
    <rect x="-200" y="560" width="1480" height="560" fill="url(#gCounter)"/>
    <rect x="-200" y="560" width="1480" height="6" fill="#8a7e84" opacity=".7"/>
    <g opacity=".9"><path d="M-40 690 C120 676 260 684 360 700 L380 960 L-40 960 Z" fill="#e7e2d6"/>
      <path d="M-40 720 C120 706 260 714 364 730 M-40 760 C120 746 260 754 368 770" stroke="#2ea6c2" stroke-width="12" fill="none" opacity=".7"/>
      <path d="M40 700 C60 780 70 860 66 960" stroke="#000" stroke-opacity=".08" stroke-width="18" fill="none"/></g>
    {"".join(f'<circle cx="{(i*137)%1180-50}" cy="{600+(i*71)%340}" r="{2+(i%3)}" fill="#fff" opacity=".12"/>' for i in range(60))}
  </g>
  <ellipse cx="480" cy="650" rx="560" ry="46" fill="#000" opacity=".35" filter="url(#blur8)"/>
  <g id="foreW">
    {forearm_dorsal()}
    <!-- hand -->
    {hand_dorsal()}
    <!-- burn patch: red rim, blistered ring, pale charred center -->
    <ellipse cx="425" cy="505" rx="250" ry="104" fill="url(#gRim)"/>
    <ellipse cx="425" cy="505" rx="172" ry="74" fill="url(#gRing)"/>
    <ellipse id="bCore" cx="425" cy="505" rx="92" ry="42" fill="url(#gCore)"/>
    <ellipse cx="408" cy="496" rx="30" ry="10" fill="#f6efe2" opacity=".8"/><ellipse cx="450" cy="516" rx="22" ry="8" fill="#e9dfcc" opacity=".7"/>
    <path d="M370 492 L392 506 L384 522 M444 486 L456 500 L470 498 M420 528 L432 518" stroke="#2a1510" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="400" cy="520" rx="18" ry="8" fill="#2a1510" opacity=".7"/><ellipse cx="458" cy="494" rx="12" ry="6" fill="#2a1510" opacity=".6"/>
    {blis}
    <!-- rolled sleeve, scorched edge -->
    <path d="M-80 336 C20 330 120 334 170 340 C186 380 190 600 172 664 C110 672 20 676 -80 676 Z" fill="url(#gSweater)"/>
    <path d="M150 338 L172 352 L160 372 L182 392 L166 414 L186 440 L170 466 L188 494 L170 522 L190 552 L172 580 L188 612 L170 640 L176 664" stroke="#2a1608" stroke-width="12" fill="none" stroke-linejoin="round"/>
    <path d="M20 360 C40 450 40 560 20 650 M90 350 C110 450 110 560 92 660" stroke="#a96d1a" stroke-width="6" fill="none" opacity=".6"/>
    <g id="ember">{flame(196, 440, 1.05, "ef")}{flame(190, 540, .8, "ef")}{flame(200, 620, .55, "ef")}</g>
    <g id="bSmoke">{"".join(f'<circle class="bs" cx="{x}" cy="{y}" r="{r}" fill="#9aa3b5" opacity="0"/>' for x, y, r in ((180, 380, 26), (196, 330, 34), (176, 290, 40), (200, 250, 30)))}</g>
    <!-- watch and ring -->
    <g id="watchW"><g id="watch">
      <path d="M716 412 L756 418 L756 600 L716 604 Z" fill="#2b2f3a"/>
      <path d="M720 430 L752 434 M720 470 L752 472 M720 510 L752 512 M720 550 L752 552" stroke="#454b58" stroke-width="3"/>
      <circle cx="736" cy="420" r="40" fill="#cfd6e2" stroke="#8b94a5" stroke-width="6"/><circle cx="736" cy="420" r="30" fill="#0e1622"/>
      <path d="M736 420 L736 398 M736 420 L752 428" stroke="#2ee6d6" stroke-width="5" stroke-linecap="round"/>
    </g></g>
  </g>
  <!-- treatment props -->
  <g id="water" opacity="0">
    <g filter="url(#sh)"><path d="M330 -80 L470 -80 L470 30 C470 60 450 76 420 76 L380 76 C350 76 330 60 330 30 Z" fill="#c9d6e6"/><rect x="384" y="70" width="32" height="26" rx="6" fill="#9fb0c6"/></g>
    <rect x="388" y="96" width="24" height="380" rx="12" fill="#8fd6ff" opacity=".75"/>
    <path id="wDash" d="M400 96 L400 476" stroke="#e6f7ff" stroke-width="8" stroke-dasharray="18 26" stroke-linecap="round"/>
    <ellipse cx="410" cy="500" rx="160" ry="60" fill="#8fd6ff" opacity=".28"/>
    {"".join(f'<circle class="dr" cx="{x}" cy="490" r="{r}" fill="#bfe9ff"/>' for x, r in ((360, 7), (440, 6), (330, 5), (470, 8), (400, 6), (500, 5)))}
  </g>
  <g id="noIce" opacity="0"><g filter="url(#sh)"><rect x="830" y="150" width="120" height="110" rx="22" fill="#cfefff" stroke="#fff" stroke-width="5"/>
    <path d="M850 180 L900 172 M860 210 L920 200" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/></g>
    <path d="M818 140 L962 270 M962 140 L818 270" stroke="#ff4f6b" stroke-width="16" stroke-linecap="round"/>
    <text x="890" y="320" text-anchor="middle" class="lbl" font-size="36" fill="#ff8a9a">no ice</text></g>
  <g id="gauzeW" opacity="0"><g id="gauze" filter="url(#sh)">
    <rect x="215" y="402" width="420" height="206" rx="14" fill="#fbfdff"/>
    {"".join(f'<path d="M{x} 406 L{x} 604" stroke="#dde6f2" stroke-width="3"/>' for x in range(235, 635, 22))}
    {"".join(f'<path d="M219 {y} L631 {y}" stroke="#dde6f2" stroke-width="3"/>' for y in range(420, 606, 22))}
    <rect x="215" y="402" width="420" height="206" rx="14" fill="none" stroke="#c7d3e3" stroke-width="5"/>
  </g></g>
  <g id="dryTag" opacity="0"><rect x="300" y="300" width="250" height="60" rx="30" fill="#fbfdff"/><text x="425" y="342" text-anchor="middle" class="lbl" font-size="34" fill="#081428">dry + sterile</text></g>
  <g id="blanketW" opacity="0"><g id="blanket" filter="url(#sh)">
    <clipPath id="blClip"><path d="M-140 250 C40 270 150 300 200 340 C214 420 210 560 196 690 C380 650 640 700 900 652 C1000 640 1120 660 1220 650 L1220 1120 L-140 1120 Z"/></clipPath>
    <g clip-path="url(#blClip)">
      <rect x="-140" y="240" width="1360" height="880" fill="#b8363c"/>
      {"".join(f'<rect x="{x}" y="240" width="34" height="880" fill="#7d1f2a" opacity=".55"/>' for x in range(-120, 1220, 120))}
      {"".join(f'<rect x="-140" y="{y}" width="1360" height="34" fill="#7d1f2a" opacity=".55"/>' for y in range(260, 1120, 120))}
      {"".join(f'<rect x="{x}" y="240" width="8" height="880" fill="#f4d58d" opacity=".5"/>' for x in range(-80, 1220, 120))}
      {"".join(f'<rect x="-140" y="{y}" width="1360" height="8" fill="#f4d58d" opacity=".5"/>' for y in range(300, 1120, 120))}
      <path d="M80 300 C120 420 110 560 60 690 M300 690 C420 780 520 820 700 760 M600 720 C760 830 900 840 1100 760" stroke="#000" stroke-opacity=".22" stroke-width="22" fill="none"/>
    </g>
    <path d="M-140 250 C40 270 150 300 200 340 C214 420 210 560 196 690 C380 650 640 700 900 652 C1000 640 1120 660 1220 650" stroke="#f4d58d" stroke-width="7" stroke-dasharray="14 10" fill="none" opacity=".8"/>
  </g></g>
  <!-- airway inset -->
  <g id="pipW" opacity="0"><g id="pip">
    <circle cx="190" cy="190" r="160" fill="#0d1a30" stroke="#2ee6d6" stroke-width="8"/>
    <g clip-path="url(#pipClip)"><rect x="30" y="30" width="320" height="320" fill="#1b2440"/>
      <image href="poseA_full.png" x="-704" y="-196" width="1920" height="1434"/></g>
    <circle id="lens" cx="262" cy="252" r="54" fill="none" stroke="#ffd23f" stroke-width="8"/>
    <path d="M300 290 L330 320" stroke="#ffd23f" stroke-width="12" stroke-linecap="round"/>
  </g>
  {"".join(f'<g id="aw{i}" opacity="0"><rect x="370" y="{70+i*76}" width="300" height="60" rx="30" fill="#081428" stroke="#2ee6d6" stroke-width="4"/><text x="520" y="{111+i*76}" text-anchor="middle" class="lbl" font-size="32" fill="#bff8f2">{t}</text></g>' for i, t in enumerate(("soot?", "singed hair?", "hoarse voice?")))}
  </g>
'''


def cam_to(c, t, px, py, k, d=0.8, ease="power2.inOut"):
    c.cam(t, k, -(px - 540) * k, -(py - 480) * k, d, ease)


def compose(c):
    import shutil, os
    for f in ("poseA_full.png", "poseB_full.png"):
        shutil.copy(f"/home/claude/lp/gen/{f}", f"/home/claude/lp/out/{c.spec['id']}/{f}")
    T, C = c.T, c.C
    TOT = c.TOTAL
    svg = f'''<svg viewBox="0 0 1080 960">
  <defs>
    <linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2c46"/><stop offset="1" stop-color="#1c1828"/></linearGradient>
    <linearGradient id="gCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3a36"/><stop offset="1" stop-color="#2a201e"/></linearGradient>
    <linearGradient id="gCounter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4448"/><stop offset="1" stop-color="#2a2528"/></linearGradient>
    <linearGradient id="gPot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e0ea"/><stop offset="1" stop-color="#7d8798"/></linearGradient>
    <linearGradient id="gSweater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b043"/><stop offset="1" stop-color="#c48218"/></linearGradient>
    <linearGradient id="gSkinA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6cfab"/><stop offset="1" stop-color="#dba07a"/></linearGradient>
    <linearGradient id="gForearm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8bf9e"/><stop offset=".5" stop-color="#f4aa86"/><stop offset="1" stop-color="#dc8d6c"/></linearGradient>
    <linearGradient id="gHand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8d3b2"/><stop offset="1" stop-color="#dfa27c"/></linearGradient>
    <radialGradient id="gRim"><stop offset=".55" stop-color="#ff5a4a" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a4a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gRing"><stop offset="0" stop-color="#b8142a"/><stop offset=".8" stop-color="#d42a3c"/><stop offset="1" stop-color="#e8545a" stop-opacity=".6"/></radialGradient>
    <radialGradient id="gCore" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#eee6d6"/><stop offset=".6" stop-color="#b9a48c"/><stop offset="1" stop-color="#4a2a20"/></radialGradient>
    <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8862b"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#a87a22"/></linearGradient>
    <linearGradient id="gBlanket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a6f9e"/><stop offset="1" stop-color="#173f60"/></linearGradient>
    <linearGradient id="gFl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4f2e"/><stop offset=".55" stop-color="#ff9f2e"/><stop offset="1" stop-color="#ffe27a" stop-opacity=".25"/></linearGradient>
    <radialGradient id="gGlowF"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a1c" stop-opacity="0"/></radialGradient>
    <radialGradient id="gFireLight"><stop offset="0" stop-color="#ff9a3d" stop-opacity=".55"/><stop offset=".5" stop-color="#ff7a2d" stop-opacity=".18"/><stop offset="1" stop-color="#ff7a2d" stop-opacity="0"/></radialGradient>
    <linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa4b4"/><stop offset="1" stop-color="#5d6575"/></linearGradient>
    <linearGradient id="gWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b7834f"/><stop offset="1" stop-color="#8e5f34"/></linearGradient>
    <linearGradient id="gGas" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f6bff"/><stop offset="1" stop-color="#9fd0ff" stop-opacity=".3"/></linearGradient>
    <linearGradient id="gEpi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d4b8"/><stop offset="1" stop-color="#e9b08f"/></linearGradient>
    <linearGradient id="gDerm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4b3a8"/><stop offset="1" stop-color="#e38f8c"/></linearGradient>
    <radialGradient id="gFat" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff2b8"/><stop offset="1" stop-color="#f5c95a"/></radialGradient>
    <linearGradient id="gMus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d2525b"/><stop offset="1" stop-color="#a8323c"/></linearGradient>
    <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe2cc"/><stop offset="1" stop-color="#f0c4a2"/></linearGradient>
    <linearGradient id="gPar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d61f33" stop-opacity=".85"/><stop offset="1" stop-color="#d61f33" stop-opacity="0"/></linearGradient>
    <linearGradient id="gChar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2520"/><stop offset=".6" stop-color="#2a1814"/><stop offset="1" stop-color="#5a2a24"/></linearGradient>
    <radialGradient id="gBl" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#ffcf9e" stop-opacity=".9"/></radialGradient>
    <linearGradient id="gMeter" gradientUnits="userSpaceOnUse" x1="0" y1="{MBOT}" x2="0" y2="{MTOP}"><stop offset="0" stop-color="#8a96a8"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff3b4e"/></linearGradient>
    <filter id="sh" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".5"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="blur3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="blur8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
    <clipPath id="slab"><rect x="{X0}" y="{YS}" width="{X1-X0}" height="{YM-YS}"/></clipPath>
    <clipPath id="pipClip"><circle cx="190" cy="190" r="152"/></clipPath>
  </defs>
  <g id="scA">{kitchen_svg()}</g>
  <g id="scB" opacity="0">{arm_svg()}</g>
  <g id="scC" opacity="0">{slab_svg()}</g>
</svg>'''
    c.g(JS.replace("\n", " "))
    g = c.g
    # ever-running motion
    for cls in ("cf", "ef"):
        for j, (d, sy, sx, sk) in enumerate(((0.11, 1.28, 0.84, 7), (0.13, 1.18, 0.9, -9), (0.09, 1.35, 0.8, 5))):
            g(f'tl.fromTo(".{cls}:nth-of-type({j+1})",{{scaleY:1,scaleX:1,skewX:0,transformOrigin:"50% 100%"}},{{scaleY:{sy},scaleX:{sx},skewX:{sk},duration:{d},yoyo:true,repeat:{int(TOT/d)},stagger:0.035,ease:"sine.inOut"}},0);')
    g(f'tl.fromTo(".spk",{{y:0,x:0,opacity:0.95,scale:1}},{{y:-150,x:(i)=>((i%2)?1:-1)*(14+i*5),opacity:0,scale:0.4,duration:0.75,stagger:0.09,repeat:2,ease:"power1.out"}},0);')
    g(f'tl.fromTo("#fireLight",{{opacity:0.85}},{{opacity:0.55,duration:0.12,yoyo:true,repeat:12,ease:"sine.inOut"}},0); tl.to("#fireLight",{{opacity:0,duration:0.5}},1.3);')
    g(f'tl.fromTo(".gas",{{scaleY:1,transformOrigin:"50% 100%"}},{{scaleY:1.25,duration:0.1,yoyo:true,repeat:{int(TOT/0.1)},stagger:0.02,ease:"sine.inOut"}},0);')
    g(f'tl.fromTo(".flow",{{strokeDashoffset:0}},{{strokeDashoffset:-440,duration:{TOT:.2f},ease:"none"}},0);')
    g(f'tl.fromTo(".sig",{{strokeDashoffset:0}},{{strokeDashoffset:-1,duration:0.7,repeat:{int(TOT/0.7)+1},ease:"none"}},0);')
    g(f'tl.fromTo("#wDash",{{strokeDashoffset:0}},{{strokeDashoffset:-440,duration:{TOT:.2f},ease:"none"}},0);')

    # ---------------- titles ----------------
    c.title('Part of it <span class="y">doesn&#39;t hurt.</span><br>That&#39;s the <span class="r">bad sign.</span>', 0, out=T["dive"] - 0.15, size=88)
    c.title('Look <span class="t">inside</span> the skin', T["dive"], out=T["d1"] - 0.12, size=96)
    c.title('<span class="y">Red rim</span><br>superficial', T["d1"], out=T["d2"] - 0.12, size=96)
    c.title('<span class="y">Blisters</span><br>partial thickness', T["d2"], out=T["d3"] - 0.12, size=92)
    c.title('<span class="r">Center</span><br>full thickness', T["d3"], out=T["tx"] - 0.12, size=96)
    c.title('<span class="t">EMT</span> treatment', T["tx"], out=C["tx"][1] - 0.1, size=104)
    c.title('<span class="t">1</span> Stop the burning', C["tx"][1], out=C["tx"][2] - 0.1, size=90)
    c.title('<span class="t">2</span> Check the airway', C["tx"][2], out=T["t2"] - 0.1, size=90)
    c.title('<span class="t">3</span> Rings + watch off', T["t2"], out=C["t2"][1] - 0.1, size=90)
    c.title('<span class="t">4</span> Cool water,<br><span class="r">never ice</span>', C["t2"][1], out=T["t3"] - 0.1, size=88)
    c.title('<span class="t">5</span> Dry sterile<br>dressing', T["t3"], out=C["t3"][1] - 0.1, size=88)
    c.title('<span class="t">6</span> Keep them <span class="y">warm</span>', C["t3"][1], out=T["end"] - 0.12, size=88)

    # ---------------- A: kitchen, sleeve on fire at frame zero ----------------
    g('tl.fromTo("#cam",{scale:1.12,x:-30,y:30},{scale:1.08,x:-24,y:26,duration:0.4,ease:"sine.inOut"},0);')
    g('tl.fromTo("#pA",{x:0},{x:8,duration:0.42,ease:"sine.in"},0);')
    g('tl.set("#pA, #wA",{opacity:0},0.42); tl.set("#pB, #wB",{opacity:1},0.42);')
    g('tl.fromTo("#wA",{x:0},{x:8,duration:0.42,ease:"sine.in"},0);')
    g('tl.fromTo("#wB",{x:10,y:-4},{x:-16,y:0,duration:0.3,ease:"power3.out",immediateRender:false},0.42);')
    g('tl.fromTo("#pB",{x:10,y:-4},{x:-16,y:0,duration:0.3,ease:"power3.out",immediateRender:false},0.42);')
    g('tl.set("#fireW",{x:-180,y:-62},0.42); tl.set("#fireLight",{x:-170,y:-50},0.42);')
    g('tl.to("#cam",{x:-6,duration:0.06,yoyo:true,repeat:5,ease:"none"},0.42);')
    c.sound("fire", 0.0, 1.1); c.sound("ignite", 0.0, 1.0); c.sound("sizzle", 0.15, 0.6)
    c.sound("flinch", 0.42, 1.2); c.sound("whoosh", 0.4, 0.7); c.sound("fire", 0.9, 0.7)
    g('tl.to("#cam",{scale:1.0,x:0,y:0,duration:1.0,ease:"power2.inOut"},0.8);')
    g('tl.to("#aFar",{x:24,duration:1.6,ease:"sine.inOut"},0.6); tl.to("#aMid",{x:-14,duration:1.6,ease:"sine.inOut"},0.6); tl.to("#charW",{y:-5,duration:1.6,ease:"sine.inOut"},0.9); tl.to("#aFront",{x:-60,duration:1.6,ease:"sine.inOut"},0.6);')
    g('tl.to("#cuffFire",{scale:0,transformOrigin:"50% 100%",duration:0.5,ease:"power2.in"},1.25);')
    g('tl.fromTo(".smk",{opacity:0,y:0,scale:0.6},{opacity:0.55,y:-90,scale:1.4,duration:1.0,stagger:0.12,ease:"sine.out"},1.35);')
    g('tl.to(".smk",{opacity:0,y:-170,duration:0.8,stagger:0.1,ease:"sine.in"},2.4);')
    c.sound("hiss", 1.25, 0.9)
    # cut to the burned forearm
    tb = C["hook"][1]
    c.fade_out("#scA", tb - 0.05, 0.3)
    g(f'tl.fromTo("#scB",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{tb-0.05:.2f});')
    g(f'tl.fromTo("#cam",{{scale:1.18,x:20,y:0}},{{scale:1.0,x:0,y:0,duration:{T["dive"]-tb:.2f},ease:"sine.out",immediateRender:false}},{tb-0.05:.2f});')
    c.sound("swish", tb - 0.1, 0.8); c.sound("sizzle", tb + 0.1, 0.35)
    g(f'tl.fromTo("#bCore",{{opacity:1}},{{opacity:0.6,duration:0.3,yoyo:true,repeat:5,ease:"sine.inOut",immediateRender:false}},{tb+0.6:.2f});')
    g(f'tl.fromTo(".bB",{{scale:1,transformOrigin:"50% 50%"}},{{scale:1.08,duration:0.4,yoyo:true,repeat:5,ease:"sine.inOut",immediateRender:false}},{tb:.2f});')
    g(f'tl.to("#ember",{{opacity:0,duration:0.01}},{tb-0.05:.2f});')

    # ---------------- dive into the skin ----------------
    t = T["dive"]
    cam_to(c, t, 425, 505, 5.0, 0.75, "power3.in")
    c.sound("dive", t - 0.05, 1.2); c.sound("heartbeat", t + 0.75, 0.9); c.sound("heartbeat", t + 1.55, 0.7)
    td = t + 0.62
    c.set("#scB", td, "opacity:0")
    c.set("#scC", td, "opacity:1")
    g(f'tl.set("#cam",{{scale:2.6,x:{-(385-540)*2.6:.0f},y:{-(430-480)*2.6:.0f}}},{td:.2f});')
    g(f'tl.to("#cam",{{scale:1.0,x:0,y:0,duration:0.9,ease:"power3.out"}},{td:.2f});')
    g(f'tl.set(P,{{v:5,onUpdate:pm}},{td:.2f});')
    g(f'tl.fromTo(".ce",{{y:0,opacity:0}},{{y:-130,opacity:0.9,duration:1.3,stagger:0.18,repeat:{int(TOT/1.3)},ease:"sine.out",immediateRender:false}},{td:.2f});')

    # ---------------- C: three zones ----------------
    def focus(sel, t0, t1):
        g(f'tl.fromTo("{sel}",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{t0:.2f}); tl.to("{sel}",{{opacity:0,duration:0.25}},{t1:.2f});')
    t = T["d1"]
    focus(".fSup", t + 0.1, T["d2"] - 0.15); c.fade_in("#chSup", t + 0.1, 0.3, -12); c.fade_out("#chSup", T["d2"] - 0.15, 0.2)
    c.sound("pop", t + 0.1, 0.6)
    cam_to(c, t, 470, 430, 1.05, 0.7)
    g(f'tl.to(P,{{v:5,duration:0.4,onUpdate:pm}},{t:.2f});')
    g(f'tl.fromTo(".sig.sup",{{strokeWidth:9}},{{strokeWidth:14,duration:0.2,yoyo:true,repeat:5,immediateRender:false}},{C["d1"][1]:.2f});')
    g(f'tl.fromTo(".nt.sup",{{scale:1,transformOrigin:"50% 50%"}},{{scale:1.7,duration:0.2,yoyo:true,repeat:5,ease:"sine.inOut",immediateRender:false}},{C["d1"][1]:.2f});')
    c.sound("zap", C["d1"][1], 0.6); c.sound("zap", C["d1"][1] + 0.4, 0.4)
    t = T["d2"]
    focus(".fPar", t + 0.1, T["d3"] - 0.15); c.fade_in("#chPar", t + 0.1, 0.3, -12); c.fade_out("#chPar", T["d3"] - 0.15, 0.2)
    c.sound("pop", t + 0.1, 0.6)
    g(f'tl.fromTo(".bl",{{scaleY:1,transformOrigin:"50% 100%"}},{{scaleY:1.12,duration:0.35,yoyo:true,repeat:5,ease:"sine.inOut",immediateRender:false}},{t+0.2:.2f});')
    p1 = C["d2"][1]
    g(f'tl.to(P,{{v:9.5,duration:0.4,ease:"back.out(1.6)",onUpdate:pm}},{p1:.2f});')
    g(f'tl.fromTo("#meter",{{x:0}},{{x:6,duration:0.05,yoyo:true,repeat:13,ease:"none",immediateRender:false}},{p1+0.3:.2f});')
    g(f'tl.fromTo(".sig.par",{{strokeWidth:9}},{{strokeWidth:15,duration:0.18,yoyo:true,repeat:7,immediateRender:false}},{p1:.2f});')
    g(f'tl.fromTo(".nt.par",{{scale:1,transformOrigin:"50% 50%"}},{{scale:1.8,duration:0.18,yoyo:true,repeat:7,ease:"sine.inOut",immediateRender:false}},{p1:.2f});')
    c.sound("zap", p1, 1.0); c.sound("zap", p1 + 0.22, 0.9); c.sound("zap", p1 + 0.44, 0.8); c.sound("heartbeat", p1 + 0.1, 0.8); c.sound("heartbeat", p1 + 0.65, 0.8)
    t = T["d3"]
    focus("#fCore", t + 0.1, T["tx"] - 0.3); c.fade_in("#chCore", t + 0.1, 0.3, -12); c.fade_out("#chCore", T["tx"] - 0.3, 0.2)
    c.sound("pop", t + 0.1, 0.6)
    k1 = C["d3"][1]
    cam_to(c, k1 - 0.1, 455, 420, 1.1, 0.5)
    g(f'tl.fromTo(".nt.core",{{scale:1,transformOrigin:"50% 50%"}},{{scale:1.8,duration:0.22,yoyo:true,repeat:3,ease:"sine.inOut",immediateRender:false}},{k1+0.1:.2f});')
    g(f'tl.to(P,{{v:1,duration:0.7,ease:"power3.inOut",onUpdate:pm}},{k1+0.1:.2f});')
    c.sound("numb", k1 + 0.1, 1.1)
    k2 = C["d3"][2]
    cam_to(c, k2 - 0.1, 470, 440, 1.03, 0.5)
    g(f'tl.fromTo("#numb",{{opacity:0,scale:0.3,transformOrigin:"50% 50%"}},{{opacity:1,scale:1,duration:0.4,ease:"back.out(2.2)",immediateRender:false}},{k2:.2f});'); c.sound("check", k2, 0.5)
    c.sound("zap", k2 + 0.5, 0.5); c.sound("zap", k2 + 0.8, 0.4)
    # music falls away on "numb", then comes back under the riser into treatment
    c.music_auto += [(k1, k1 + 0.4, 0.5), (k1 + 0.4, T["tx"] - 1.0, 0.12), (T["tx"] - 1.0, T["tx"] - 0.3, 0.5)]
    # music sits low under the fire so the crackle carries the hook, and low inside the skin so the heartbeat reads
    c.music_auto += [(0, 1.6, 0.35), (T["dive"], T["dive"] + 2.2, 0.45)]
    c.fade_in("#edgeTag", k2 + 0.5, 0.3, 14)

    # ---------------- D: treatment on the same arm ----------------
    t = T["tx"]
    c.fade_out("#scC", t - 0.1, 0.3)
    g(f'tl.fromTo("#scB",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{t-0.1:.2f});')
    g(f'tl.set("#ember",{{opacity:1}},{t-0.1:.2f});')
    g(f'tl.fromTo("#cam",{{scale:1.12,x:0,y:0}},{{scale:1.0,x:0,y:0,duration:0.8,ease:"power2.out",immediateRender:false}},{t-0.1:.2f});')
    c.sound("riser", t - 1.0, 0.8); c.sound("swish", t - 0.1, 0.8)
    s1 = C["tx"][1]
    g(f'tl.to("#ember",{{scale:0,transformOrigin:"50% 100%",duration:0.4,ease:"power2.in"}},{s1+0.1:.2f});')
    g(f'tl.fromTo(".bs",{{opacity:0,y:0,scale:0.6}},{{opacity:0.55,y:-80,scale:1.4,duration:0.8,stagger:0.1,ease:"sine.out",immediateRender:false}},{s1+0.3:.2f});')
    g(f'tl.to(".bs",{{opacity:0,y:-120,duration:0.4,stagger:0.05,ease:"sine.in"}},{min(s1+0.8, C["tx"][2]-0.55):.2f});')
    cam_to(c, s1, 300, 470, 1.15, 0.5)
    c.sound("hiss", s1 + 0.1, 0.9); c.sound("swish", s1 - 0.08, 0.6)
    s2 = C["tx"][2]
    c.cam(s2, 1.0, 0, 0, 0.5)
    g(f'tl.fromTo("#pipW",{{opacity:0}},{{opacity:1,duration:0.3,immediateRender:false}},{s2:.2f});')
    g(f'tl.fromTo("#pip",{{scale:0.4,transformOrigin:"190px 190px"}},{{scale:1,duration:0.45,ease:"back.out(2)",immediateRender:false}},{s2:.2f});')
    c.sound("shimmer", s2, 0.8); c.sound("swish", s2 - 0.08, 0.6)
    for i in range(3):
        c.fade_in(f"#aw{i}", s2 + 0.35 + i * 0.25, 0.25, 10); c.sound("check", s2 + 0.35 + i * 0.25, 0.9)
    g(f'tl.fromTo("#lens",{{x:0,y:0}},{{x:-30,y:-40,duration:0.5,yoyo:true,repeat:2,ease:"sine.inOut",immediateRender:false}},{s2+0.3:.2f});')
    t = T["t2"]
    c.fade_out("#pipW, #aw0, #aw1, #aw2", t - 0.05, 0.25)
    cam_to(c, t, 800, 470, 1.18, 0.5)
    g(f'tl.to("#watch",{{x:260,y:-260,rotation:40,svgOrigin:"736 500",opacity:0,duration:0.7,ease:"power2.in"}},{t+0.25:.2f});')
    g(f'tl.to("#ring",{{x:110,duration:0.45,ease:"power2.in"}},{t+0.45:.2f}); tl.to("#ring",{{y:-220,x:260,rotation:180,transformOrigin:"50% 50%",opacity:0,duration:0.5,ease:"power2.out"}},{t+0.9:.2f});')
    c.sound("swish", t - 0.08, 0.6); c.sound("clink", t + 0.3, 0.9); c.sound("whoosh", t + 0.35, 0.5); c.sound("clink", t + 0.95, 0.7)
    w1 = C["t2"][1]
    c.cam(w1 - 0.1, 1.0, 0, 0, 0.5)
    g(f'tl.fromTo("#water",{{opacity:0,y:-200}},{{opacity:1,y:0,duration:0.35,ease:"power2.out",immediateRender:false}},{w1:.2f});')
    g(f'tl.fromTo(".dr",{{y:0,x:0,opacity:1}},{{y:-60,x:"random(-60,60)",opacity:0,duration:0.5,repeat:5,stagger:0.08,ease:"power2.out",immediateRender:false}},{w1+0.3:.2f});')
    c.sound("swish", w1 - 0.08, 0.6); c.sound("water", w1, 1.0); c.sound("water", w1 + 2.2, 0.8)
    g(f'tl.fromTo("#noIce",{{opacity:0,scale:0.4,transformOrigin:"50% 50%"}},{{opacity:1,scale:1,duration:0.4,ease:"back.out(2)",immediateRender:false}},{w1+0.9:.2f});'); c.sound("wrong", w1 + 0.9, 0.8)
    t = T["t3"]
    c.fade_out("#water, #noIce", t - 0.05, 0.3)
    g(f'tl.fromTo("#gauzeW",{{opacity:0}},{{opacity:1,duration:0.15,immediateRender:false}},{t+0.1:.2f});')
    g(f'tl.fromTo("#gauze",{{y:-420,rotation:-8,svgOrigin:"425 505"}},{{y:0,rotation:-2,duration:0.6,ease:"bounce.out",immediateRender:false}},{t+0.1:.2f});')
    c.fade_in("#dryTag", t + 0.7, 0.3, 10); c.sound("swish", t - 0.08, 0.6); c.sound("pat", t + 0.62, 1.0)
    b1 = C["t3"][1]
    c.fade_out("#dryTag", b1, 0.2)
    g(f'tl.fromTo("#blanketW",{{opacity:0}},{{opacity:1,duration:0.15,immediateRender:false}},{b1:.2f});')
    g(f'tl.fromTo("#blanket",{{y:460,x:-120}},{{y:0,x:0,duration:0.8,ease:"power3.out",immediateRender:false}},{b1:.2f});')
    c.sound("cloth", b1, 1.0)
    cam_to(c, b1 + 0.2, 470, 520, 1.06, 1.2, "sine.inOut")
    return svg


SPEC = dict(
    id="y1011-02-burn-story", badge="NREMT  BURNS", tail=1.6, bpm=88, key=-2, seed=29,
    vars="--glow:#3a1a14;--acc1:#ff8a3d;--acc2:#2ee6d6",
    css="#end-l1{font-size:88px;letter-spacing:-1.5px}",
    end_line='Judge the <span style="color:#ffd23f">depth</span>,<br>not the pain',
    beats=[
        dict(key="hook", vo="His sleeve caught fire, {1}and part of the burn doesn't hurt. That's the bad sign.",
             disp="His sleeve caught fire, and part of the burn doesn't hurt. That's the bad sign."),
        dict(key="dive", vo="Look inside the skin.", disp="Look inside the skin."),
        dict(key="d1", vo="The red rim is superficial, just the epidermis. {1}It hurts.",
             disp="The red rim is superficial, just the epidermis. It hurts."),
        dict(key="d2", vo="The blistered ring is partial thickness, into the dermis. {1}Intense pain.",
             disp="The blistered ring is partial thickness, into the dermis. Intense pain."),
        dict(key="d3", vo="The center is full thickness. {1}The nerve endings are destroyed, {2}so it can feel numb.",
             disp="The center is full thickness. The nerve endings are destroyed, so it can feel numb."),
        dict(key="tx", vo="Here's your treatment. {1}Stop the burning. {2}Check the airway.",
             disp="Here's your treatment. Stop the burning. Check the airway."),
        dict(key="t2", vo="Pull off rings and watches. {1}Cool it with cool running water, never ice.",
             disp="Pull off rings and watches. Cool it with cool running water, never ice."),
        dict(key="t3", vo="Cover it with a dry, sterile dressing, {1}and keep them warm.",
             disp="Cover it with a dry, sterile dressing, and keep them warm."),
        dict(key="end", vo="", disp=""),
    ],
    compose=compose,
    caption="His sleeve caught fire and part of the burn doesn't hurt. Why that's the bad sign, and the 6 steps EMTs use to treat it. Free NREMT practice at levlprep.com #NREMT #EMT #burns",
    yt_title="Part of this burn doesn't hurt. That's the bad sign.",
)
