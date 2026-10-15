"""Round 3: 3 thumbnails for 'Intro to EMS: How the EMS System Works (EMT Chapter 1)', each art showing the WHOLE system."""
import sys
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, uri, render, sheet, page3, pill3, title3, scope, outline_filter

c = COURSE["nremt"]
A, D, M = c["accent"], c["deep"], c["mid"]
CH = "/tmp/claude-0/-home-claude/cae291e7-9832-5169-b112-05b77bfd798f/scratchpad/m/characters/"
OUT = "/home/claude/lp/thumbs/nremt3"
INK = "#0a1a20"
RED = "#e0454a"
BLUE = "#2f6fd0"


def white_outline(px=4, glow=True):
    d = [(px, 0), (-px, 0), (0, px), (0, -px), (px * .7, px * .7), (-px * .7, px * .7), (px * .7, -px * .7), (-px * .7, -px * .7)]
    f = " ".join(f"drop-shadow({a:.1f}px {b:.1f}px 0 #fff)" for a, b in d)
    if glow: f += f" drop-shadow(0 0 24px {A}aa)"
    return f + " drop-shadow(0 12px 18px rgba(0,0,0,.55))"


DEFS = f"""<defs><linearGradient id=wall x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#fff"/><stop offset=1 stop-color="#d3dfe8"/></linearGradient>
<filter id=sh x=-30% y=-30% width=160% height=160%><feDropShadow dx=0 dy=10 stdDeviation=9 flood-color="#000" flood-opacity=".5"/></filter>
<filter id=glow x=-50% y=-50% width=200% height=200%><feGaussianBlur stdDeviation=8/></filter></defs>"""


def ambulance(x, y, s=1.0, rot=0):
    """Side view, facing right, 190x110 at s=1. Neutral markings: red and mint side stripes, rooftop light bar. No cross."""
    return f"""<g filter="url(#sh)" transform="translate({x},{y}) rotate({rot}) scale({s})">
 <path d="M0,20 Q0,8 12,8 L120,8 L120,92 L0,92 Z" fill="url(#wall)" stroke="{D}" stroke-width="6"/>
 <path d="M120,34 L158,34 Q166,34 172,42 L190,66 L190,92 L120,92 Z" fill="url(#wall)" stroke="{D}" stroke-width="6" stroke-linejoin="round"/>
 <path d="M128,42 L156,42 L172,64 L128,64 Z" fill="#7fb8e0"/>
 <rect x="3" y="62" width="184" height="10" fill="{RED}"/><rect x="3" y="75" width="184" height="5" fill="{A}"/>
 <rect x="40" y="-4" width="22" height="12" rx="3" fill="{BLUE}" stroke="{D}" stroke-width="4"/>
 <rect x="64" y="-4" width="22" height="12" rx="3" fill="{RED}" stroke="{D}" stroke-width="4"/>
 <circle cx="40" cy="94" r="17" fill="#20262e" stroke="{D}" stroke-width="5"/><circle cx="40" cy="94" r="6" fill="#b9c3cc"/>
 <circle cx="152" cy="94" r="17" fill="#20262e" stroke="{D}" stroke-width="5"/><circle cx="152" cy="94" r="6" fill="#b9c3cc"/></g>"""


def hospital(x, y, s=1.0):
    """200 wide x 220 tall at s=1 (origin top left of the sign). White H on a blue sign."""
    return f"""<g filter="url(#sh)" transform="translate({x},{y}) scale({s})">
 <rect x="0" y="50" width="200" height="170" fill="url(#wall)" stroke="{D}" stroke-width="8"/>
 <rect x="60" y="0" width="80" height="60" fill="url(#wall)" stroke="{D}" stroke-width="8"/>
 <rect x="72" y="9" width="56" height="42" rx="6" fill="{BLUE}"/>
 <text x="100" y="44" font-family="I" font-weight="900" font-size="38" fill="#fff" text-anchor="middle">H</text>
 <g fill="#7fb8e0"><rect x="22" y="76" width="34" height="28"/><rect x="83" y="76" width="34" height="28"/><rect x="144" y="76" width="34" height="28"/>
 <rect x="22" y="126" width="34" height="28"/><rect x="144" y="126" width="34" height="28"/></g>
 <rect x="76" y="156" width="48" height="64" fill="#5a6b7a"/></g>"""


def badge(x, y, n, r=22):
    return (f'<g><circle cx="{x}" cy="{y}" r="{r}" fill="{A}" stroke="{D}" stroke-width="6"/>'
            f'<text x="{x}" y="{y + r * .45}" font-family="I" font-weight="900" font-size="{r * 1.25}" fill="{D}" text-anchor="middle">{n}</text></g>')


BG = (f"<div class=abs style='inset:0;background:radial-gradient(circle at 72% 50%,{M} 0%,#0c2a2c 45%,{D} 100%)'></div>"
      f"<div class=abs style='inset:0;background:repeating-linear-gradient(90deg,{A}0d 0 2px,transparent 2px 64px),"
      f"repeating-linear-gradient(0deg,{A}0d 0 2px,transparent 2px 64px)'></div>")
LEFT_SHADE = f"<div class=abs style='left:0;top:0;width:640px;height:720px;background:linear-gradient(90deg,{D}ee 0%,{D}99 70%,{D}00 100%)'></div>"
PILL = pill3(c, "NREMT · CH 1")
d = {}

# 1 THE CHAIN: caller, dispatcher, EMTs, ambulance, hospital joined by one mint route (Z path), numbered 1 to 5
WO = white_outline()
d["nremt3-1"] = page3(f"""{BG}{LEFT_SHADE}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
 <path d="M690,215 L1010,215 Q1060,215 1030,262 L740,420 Q700,445 740,470 L1150,470" fill="none" stroke="{INK}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
 <path d="M690,215 L1010,215 Q1060,215 1030,262 L740,420 Q700,445 740,470 L1150,470" fill="none" stroke="{A}" stroke-width="10" stroke-dasharray="24 18" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
<img class=abs src="{uri(CH + 'maya-phone.png')}" style="left:600px;top:38px;height:300px;filter:{WO}">
<img class=abs src="{uri(CH + 'emd-talking.png')}" style="left:930px;top:40px;height:250px;filter:{WO}">
<img class=abs src="{uri(CH + 'emts-walk.png')}" style="left:640px;top:330px;height:290px;filter:{WO}">
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
 {ambulance(880, 470, 0.95)}
 {hospital(1080, 360, 0.82)}
 {badge(612, 70, 1)}{badge(950, 60, 2)}{badge(700, 350, 3)}{badge(890, 452, 4)}{badge(1062, 352, 5)}
</svg>
{PILL}{title3([("How EMS", "w"), ("Works", "a")], c, y=170, size=110)}
{scope("911 call → hospital", y=420, size=50)}
""", c)

# 2 THE SYSTEM AROUND ONE PATIENT: Frank in the middle, a clockwise ring of caller, dispatcher, EMTs, ambulance, hospital
cx, cy, R = 900, 360, 250
import math
nodes = []
for i in range(5):
    t = math.radians(-90 + 72 * i)
    nodes.append((cx + R * math.cos(t), cy + R * math.sin(t)))
NR = 62


def node_img(i, src, crop, w, dx=0, dy=0):
    x, y = nodes[i]
    return (f'<div class=abs style="left:{x - NR}px;top:{y - NR}px;width:{2 * NR}px;height:{2 * NR}px;border-radius:50%;overflow:hidden;'
            f'background:radial-gradient(circle at 50% 35%,#ffffff,#cfe9e3);border:6px solid {A};box-shadow:0 0 0 6px {D},0 0 30px {A}88,0 12px 20px rgba(0,0,0,.5)">'
            f'<img src="{uri(CH + src, crop)}" style="position:absolute;left:{dx}px;top:{dy}px;width:{w}px"></div>')


def node_svg(i, inner):
    x, y = nodes[i]
    return (f'<div class=abs style="left:{x - NR}px;top:{y - NR}px;width:{2 * NR}px;height:{2 * NR}px;border-radius:50%;overflow:hidden;'
            f'background:radial-gradient(circle at 50% 35%,#ffffff,#cfe9e3);border:6px solid {A};box-shadow:0 0 0 6px {D},0 0 30px {A}88,0 12px 20px rgba(0,0,0,.5)">'
            f'<svg viewBox="0 0 112 112" style="position:absolute;inset:0;width:100%;height:100%">{DEFS}{inner}</svg></div>')


# arcs between nodes with arrowheads (clockwise)
arcs = ""
for i in range(4):
    a0 = math.radians(-90 + 72 * i + 17)
    a1 = math.radians(-90 + 72 * (i + 1) - 17)
    x0, y0 = cx + R * math.cos(a0), cy + R * math.sin(a0)
    x1, y1 = cx + R * math.cos(a1), cy + R * math.sin(a1)
    arcs += f'<path d="M{x0:.0f},{y0:.0f} A{R},{R} 0 0 1 {x1:.0f},{y1:.0f}" fill="none" stroke="{INK}" stroke-width="22" stroke-linecap="round"/>'
    arcs += f'<path d="M{x0:.0f},{y0:.0f} A{R},{R} 0 0 1 {x1:.0f},{y1:.0f}" fill="none" stroke="{A}" stroke-width="9" stroke-linecap="round" marker-end="url(#ah)"/>'
d["nremt3-2"] = page3(f"""{BG}{LEFT_SHADE}
<div class=abs style="left:{cx - 230}px;top:{cy - 230}px;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,{A}55 0%,transparent 68%)"></div>
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">
 <defs><marker id=ah viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
 <path d="M0,0 L10,5 L0,10 Z" fill="{A}"/></marker></defs>{arcs}</svg>
<img class=abs src="{uri(CH + 'frank-chest.png')}" style="left:{cx - 110}px;top:{cy - 172}px;height:350px;filter:{white_outline(5)}">
{node_img(0, 'maya-phone.png', (0, 0, 225, 225), 124, -2, 6)}
{node_img(1, 'emd-talking.png', (230, 0, 591, 361), 124, 0, 4)}
{node_img(2, 'emts-walk.png', (0, 0, 583, 583), 124, 0, 8)}
{node_svg(3, ambulance(10, 34, 0.48))}
{node_svg(4, hospital(26, 14, 0.30).replace('filter="url(#sh)" ', ''))}
{PILL}{title3([("The EMS", "w"), ("System", "a")], c, y=170, size=110)}
{scope("how the whole system fits", y=420, size=46)}
""", c)

# 3 THE MAP: a city map with the whole run at once: call from a house, dispatch center radios, ambulance leaves the station, route to hospital
blocks = ""
for gx in range(5):
    for gy in range(4):
        bx, by = 600 + gx * 136, 60 + gy * 150
        blocks += f'<rect x="{bx}" y="{by}" width="110" height="122" rx="14" fill="#123b3c" stroke="#1d5250" stroke-width="3"/>'
ROUTE = "M720,505 L720,567 L1004,567 L1004,265 L1100,265"
d["nremt3-3"] = page3(f"""{BG}
<div class=abs style="left:560px;top:20px;width:720px;height:640px;-webkit-mask-image:radial-gradient(ellipse 60% 62% at 55% 50%,#000 70%,transparent 100%)">
<svg viewBox="560 20 720 640" style="width:720px;height:640px">
 <rect x="560" y="20" width="720" height="640" fill="#0b2729"/>{blocks}
</svg></div>
{LEFT_SHADE}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
 <path d="{ROUTE}" fill="none" stroke="{A}" stroke-width="30" stroke-linejoin="round" stroke-linecap="round" opacity=".35" filter="url(#glow)"/>
 <path d="{ROUTE}" fill="none" stroke="{A}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
 <!-- radio link: dispatch to ambulance -->
 <path d="M850,190 Q900,360 870,506" fill="none" stroke="#ffd23f" stroke-width="5" stroke-dasharray="4 12" stroke-linecap="round"/>
 <!-- house with the 911 call -->
 <g filter="url(#sh)"><path d="M626,470 L700,412 L774,470 Z" fill="{RED}" stroke="{D}" stroke-width="7" stroke-linejoin="round"/>
 <rect x="642" y="466" width="116" height="84" fill="url(#wall)" stroke="{D}" stroke-width="7"/><rect x="686" y="504" width="28" height="46" fill="#5a6b7a"/></g>
 <g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"><path d="M640,410 a30,30 0 0 1 0,-42"/><path d="M620,425 a58,58 0 0 1 0,-72"/></g>
 <!-- dispatch center with antenna -->
 <g filter="url(#sh)"><rect x="800" y="110" width="110" height="80" fill="url(#wall)" stroke="{D}" stroke-width="7"/>
 <path d="M855,110 L855,52" stroke="{D}" stroke-width="12"/><path d="M855,110 L855,52" stroke="#fff" stroke-width="5"/>
 <circle cx="855" cy="48" r="9" fill="#ffd23f" stroke="{D}" stroke-width="4"/>
 <rect x="818" y="128" width="30" height="24" fill="#7fb8e0"/><rect x="862" y="128" width="30" height="24" fill="#7fb8e0"/>
 <rect x="838" y="160" width="34" height="30" fill="#5a6b7a"/></g>
 <g fill="none" stroke="#ffd23f" stroke-width="6" stroke-linecap="round"><path d="M878,32 a26,26 0 0 1 0,32"/><path d="M896,18 a48,48 0 0 1 0,60"/>
 <path d="M832,32 a26,26 0 0 0 0,32"/><path d="M814,18 a48,48 0 0 0 0,60"/></g>
 {ambulance(800, 516, 0.82)}
 {hospital(1070, 170, 0.78)}
 {badge(640, 586, 1)}{badge(930, 96, 2)}{badge(790, 610, 3)}{badge(1050, 160, 4)}
</svg>
{PILL}{title3([("How EMS", "w"), ("Works", "a")], c, y=170, size=110)}
{scope("from 911 call to the ER", y=420, size=46)}
""", c)

render(d, OUT)
labels = ["1  How EMS Works | 911 call → hospital | art: chain",
          "2  The EMS System | whole system fits | art: ring",
          "3  How EMS Works | 911 call to the ER | art: map"]
sheet(OUT, list(d), labels, OUT + "/sheet.png")
print("ok")
