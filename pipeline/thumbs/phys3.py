"""Round 3: 3 thumbnails for 'Kinematics: Position, Velocity and Acceleration (AP Physics 1, Unit 1)'.
Every art shows ONE moving object with its position, velocity and acceleration together (and the graphs that tie them)."""
import math, sys
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, uri, render, sheet, page3, pill3, title3, scope

c = COURSE["phys"]
A, D, M = c["accent"], c["deep"], c["mid"]
OUT = "/home/claude/lp/thumbs/phys3"
SPRINT = "/home/claude/lp/thumbs/phys/src/sprint.png"  # jordan-sprint without its green ground shadow (made by phys.py prep())
RED = "#ff5a4a"
BLUE = "#4f8fe8"
SVG = '<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">'
PILL = pill3(c, "AP PHYSICS 1 · UNIT 1")
TITLE = title3([("1D", "w"), ("Kinematics", "a")], c, y=160, size=98)
BG = (f"<div class=abs style='inset:0;background:radial-gradient(circle at 74% 48%,{M} 0%,#1c1406 50%,{D} 100%)'></div>"
      f"<div class=abs style='inset:0;background:repeating-linear-gradient(90deg,{A}0c 0 2px,transparent 2px 64px),"
      f"repeating-linear-gradient(0deg,{A}0c 0 2px,transparent 2px 64px)'></div>")
DEFS = f"""<defs>
<linearGradient id=body x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#ffd27a"/><stop offset=1 stop-color="{A}"/></linearGradient>
<linearGradient id=glass x1=0 y1=0 x2=1 y2=1><stop offset=0 stop-color="#cfe6ff"/><stop offset=1 stop-color="#7fb0e0"/></linearGradient>
<linearGradient id=card x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#2c2009"/><stop offset=1 stop-color="#140e04"/></linearGradient>
<filter id=sh x=-30% y=-30% width=160% height=160%><feDropShadow dx=0 dy=10 stdDeviation=9 flood-color="#000" flood-opacity=".55"/></filter>
</defs>"""


def arrow(x1, y1, x2, y2, col, w=14, head=32, ow=7):
    ang = math.atan2(y2 - y1, x2 - x1)
    bx, by = x2 - head * math.cos(ang), y2 - head * math.sin(ang)
    px, py = -math.sin(ang), math.cos(ang)
    hw = head * .62
    tri = f"{x2:.1f},{y2:.1f} {bx + px * hw:.1f},{by + py * hw:.1f} {bx - px * hw:.1f},{by - py * hw:.1f}"
    return (f'<path d="M{x1},{y1} L{bx:.1f},{by:.1f}" stroke="{D}" stroke-width="{w + ow * 2}" stroke-linecap="round"/>'
            f'<polygon points="{tri}" fill="{D}" stroke="{D}" stroke-width="{ow * 2}" stroke-linejoin="round"/>'
            f'<path d="M{x1},{y1} L{bx:.1f},{by:.1f}" stroke="{col}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<polygon points="{tri}" fill="{col}" stroke="{col}" stroke-width="2" stroke-linejoin="round"/>')


def lab(x, y, t, col="#fff", size=44, anchor="middle", sw=10, italic=True):
    st = "font-style:italic;" if italic else ""
    return (f'<text x="{x}" y="{y}" font-family="I" font-weight="900" font-size="{size}" text-anchor="{anchor}" '
            f'style="{st}paint-order:stroke fill" stroke="{D}" stroke-width="{sw}" stroke-linejoin="round" fill="{col}">{t}</text>')


def car(x, y, s=1.0, op=1.0, ghost=False):
    """Side view car facing right, 240 wide x 110 tall at s=1, origin = rear bottom of the body (wheels sit on y)."""
    fill = f"{A}" if ghost else "url(#body)"
    glass = f"{A}" if ghost else "url(#glass)"
    filt = "" if ghost else 'filter="url(#sh)"'
    return f"""<g {filt} opacity="{op}" transform="translate({x},{y}) scale({s})">
 <path d="M6,-22 Q4,-58 30,-62 L66,-64 L100,-100 Q108,-106 120,-106 L168,-106 Q180,-106 188,-98 L218,-66 Q238,-62 238,-44 L238,-22 Z"
  fill="{fill}" stroke="{D}" stroke-width="7" stroke-linejoin="round"/>
 <path d="M86,-66 L110,-94 L142,-94 L142,-66 Z" fill="{glass}" stroke="{D}" stroke-width="5" stroke-linejoin="round"/>
 <path d="M152,-66 L152,-94 L176,-94 L202,-66 Z" fill="{glass}" stroke="{D}" stroke-width="5" stroke-linejoin="round"/>
 <rect x="226" y="-56" width="12" height="9" rx="3" fill="#fff6c8"/>
 <circle cx="58" cy="-20" r="25" fill="#1d1d22" stroke="{D}" stroke-width="6"/><circle cx="58" cy="-20" r="9" fill="#c9c9cf"/>
 <circle cx="190" cy="-20" r="25" fill="#1d1d22" stroke="{D}" stroke-width="6"/><circle cx="190" cy="-20" r="9" fill="#c9c9cf"/></g>"""


def axis_line(x0, x1, y, ticks, zero_x, unit=True):
    """Number line (position axis) with ticks; 0 marked."""
    out = [f'<path d="M{x0},{y} L{x1 - 4},{y}" stroke="#fff" stroke-width="6" stroke-linecap="round"/>',
           f'<polygon points="{x1 + 18},{y} {x1 - 4},{y - 12} {x1 - 4},{y + 12}" fill="#fff"/>']
    for tx in ticks:
        out.append(f'<path d="M{tx},{y - 12} L{tx},{y + 12}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>')
    out.append(lab(zero_x, y + 52, "0", size=36, sw=0, italic=False))
    out.append(lab(x1 + 8, y + 52, "x", size=40, sw=0))
    return "".join(out)


designs, labels = {}, []

# ---------- 1. A car speeding up along a position axis: equal time dots with growing gaps (motion diagram),
#               the position x measured from 0, the velocity arrow and the acceleration arrow, all on one object.
ROAD = 500
SC = 1.3
CX = 840                            # rear bumper of the car
cc = CX + 120 * SC                  # car centre, where x is read
d9 = (cc - 700) / 9
dots_x = [700, 700 + d9, 700 + 4 * d9, cc]  # equal time steps from rest, constant a: x = 0, 1, 4, 9 units
x1 = car(CX, ROAD, SC)
dots = "".join(f'<circle cx="{dx:.0f}" cy="{ROAD + 2}" r="11" fill="{A}" stroke="{D}" stroke-width="4" opacity="{o}"/>'
               for dx, o in zip(dots_x, (.45, .6, .8, 1)))
designs["phys3-1"] = page3(f"""
{BG}
<div class=abs style='left:700px;top:90px;width:560px;height:520px;border-radius:50%;background:radial-gradient(circle,{A}48 0%,transparent 65%)'></div>
{SVG}{DEFS}
<path d="M680,{ROAD + 2} L1240,{ROAD + 2}" stroke="#5a4416" stroke-width="10" stroke-linecap="round"/>
{dots}
{x1}
{axis_line(690, 1225, ROAD + 62, [700, 800, 900, 1000, 1100, 1200], 700)}
<path d="M{cc:.0f},{ROAD - 120} L{cc:.0f},{ROAD + 80}" stroke="#ffd23f" stroke-width="5" stroke-dasharray="10 9"/>
{arrow(700, ROAD + 132, cc, ROAD + 132, '#ffd23f', 11, 28, ow=6)}{lab(820, ROAD + 118, 'x', col='#ffd23f', size=48)}
{arrow(cc - 120, 220, cc + 200, 220, '#fff', 18, 42)}{lab(cc - 140, 240, 'v', size=56, anchor='end')}
{arrow(cc - 120, 320, cc + 90, 320, A, 18, 42)}{lab(cc - 140, 340, 'a', col=A, size=56, anchor='end')}
</svg>
{PILL}{TITLE}
{scope("position → velocity → acceleration", y=400, size=40)}
""", c)
labels.append("1  1D Kinematics  |  position → velocity → accel.  |  art: car with x, v, a")


# ---------- 2. Jordan sprinting (accelerating from the start), x, v, a on her, tied to a small x/v/a graph stack beside her.
def mini_graph(x, y, w, h, kind, name):
    l, r, t, b = x + 46, x + w - 18, y + 16, y + h - 16
    out = [f'<path d="M{l},{t} L{l},{b} L{r},{b}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>']
    X = lambda u: l + (r - l - 8) * u
    if kind == "x":
        pts = " ".join(f"{X(i / 30):.1f},{b - (b - t - 6) * (i / 30) ** 2:.1f}" for i in range(31))
    elif kind == "v":
        pts = f"{X(0):.1f},{b:.1f} {X(1):.1f},{t + 6:.1f}"
    else:
        ya = b - (b - t) * .55
        pts = f"{X(0):.1f},{ya:.1f} {X(1):.1f},{ya:.1f}"
    col = {"x": "#ffd23f", "v": "#fff", "a": A}[kind]
    out.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')
    out.append(lab(x + 22, y + h / 2 + 14, name, col=col, size=38, sw=0))
    return "".join(out)


GX, GY, GW, GH = 1040, 150, 200, 112
graphs2 = "".join(mini_graph(GX, GY + i * (GH + 14), GW, GH, k, k) for i, k in enumerate("xva"))
sp = uri(SPRINT)
H2 = 470
W2 = round(897 * H2 / 1203)
RX = 660
designs["phys3-2"] = page3(f"""
{BG}
<div class=abs style='left:600px;top:100px;width:500px;height:520px;border-radius:50%;background:radial-gradient(circle,{A}50 0%,transparent 66%)'></div>
<div class=abs style='left:{GX - 14}px;top:{GY - 22}px;width:{GW + 28}px;height:{3 * GH + 2 * 14 + 40}px;border-radius:22px;background:linear-gradient(160deg,#2c2009,#140e04);border:4px solid {A}77;box-shadow:0 16px 30px rgba(0,0,0,.6)'></div>
<img class=abs src="{sp}" style="left:{RX}px;top:146px;height:{H2}px;filter:drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 0 30px {A}) drop-shadow(0 16px 24px rgba(0,0,0,.6))">
{SVG}{DEFS}
{graphs2}
{lab(GX + GW / 2 + 20, GY + 3 * GH + 2 * 14 + 8, 't', size=30, sw=0)}
{axis_line(670, 1000, 640, [690, 770, 850, 930], 690)}
{arrow(690, 118, 900, 118, '#ffd23f', 10, 26, ow=6)}{lab(780, 100, 'x', col='#ffd23f', size=46)}
<path d="M900,118 L900,632" stroke="#ffd23f" stroke-width="4" stroke-dasharray="10 10" opacity=".5"/>
{arrow(790, 330, 1000, 330, '#fff', 16, 38)}{lab(975, 392, 'v', size=46)}
{arrow(790, 430, 940, 430, A, 16, 38)}{lab(915, 492, 'a', col=A, size=46)}
</svg>
{PILL}{TITLE}
{scope("x, v, a and their graphs", y=410, size=44)}
""", c)
labels.append("2  1D Kinematics  |  x, v, a and their graphs  |  art: runner + x/v/a graphs")


# ---------- 3. The kinematics chain as one picture: a car on top, then its x vs t, v vs t, a vs t stacked and aligned in time,
#               with "slope" links going down and "area" links coming back up. Constant acceleration from rest.
L3, R3 = 740, 1070
rows = [(170, "x"), (330, "v"), (490, "a")]
RH = 120
def graph_row(top, kind):
    l, r, t, b = L3, R3, top, top + RH
    X = lambda u: l + (r - l) * u
    out = [f'<rect x="{l - 62}" y="{t - 14}" width="{r - l + 90}" height="{RH + 28}" rx="20" fill="url(#card)" stroke="{A}66" stroke-width="4" filter="url(#sh)"/>',
           f'<path d="M{l},{t + 4} L{l},{b} L{r},{b}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>']
    col = {"x": "#ffd23f", "v": "#fff", "a": A}[kind]
    if kind == "x":
        pts = " ".join(f"{X(i / 40):.1f},{b - (RH - 12) * (i / 40) ** 2:.1f}" for i in range(41))
    elif kind == "v":
        out.append(f'<polygon points="{X(0)},{b} {X(.8):.1f},{b - (RH - 12) * .7:.1f} {X(.8):.1f},{b}" fill="{A}" opacity=".35"/>')
        pts = f"{X(0)},{b} {X(1)},{t + 12}"
    else:
        ya = b - RH * .55
        out.append(f'<rect x="{X(0)}" y="{ya}" width="{X(.8) - X(0):.1f}" height="{b - ya}" fill="{A}" opacity=".3"/>')
        pts = f"{X(0)},{ya} {X(1)},{ya}"
    out.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="8" stroke-linecap="round"/>')
    out.append(lab(l - 36, t + RH / 2 + 16, kind, col=col, size=46, sw=0))
    return "".join(out)


g3 = "".join(graph_row(t, k) for t, k in rows)
link = ""
for (t1, _), (t2, _) in zip(rows, rows[1:]):
    ym = (t1 + RH + t2) / 2
    link += f'<path d="M{R3 + 54},{t1 + RH - 6} Q{R3 + 92},{ym} {R3 + 54},{t2 + 18}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>'
    link += f'<polygon points="{R3 + 46},{t2 + 26} {R3 + 68},{t2 + 12} {R3 + 44},{t2 + 4}" fill="#fff"/>'
designs["phys3-3"] = page3(f"""
{BG}
{SVG}{DEFS}
<path d="M720,128 L1200,128" stroke="#5a4416" stroke-width="8" stroke-linecap="round"/>
{car(740, 128, .5, .2, ghost=True)}{car(812, 128, .5, .32, ghost=True)}{car(920, 128, .5)}
{arrow(1060, 48, 1200, 48, '#fff', 12, 30, ow=6)}{lab(1216, 62, 'v', size=40, anchor='start')}
{arrow(1060, 96, 1140, 96, A, 12, 30, ow=6)}{lab(1156, 110, 'a', col=A, size=40, anchor='start')}
{g3}
{link}
{lab(R3 + 100, 316, 'slope', size=30, anchor='start', italic=False, sw=8)}
{lab(R3 + 100, 476, 'slope', size=30, anchor='start', italic=False, sw=8)}
{lab(L3 + 190, rows[1][0] + RH - 12, 'area = Δx', size=26, italic=False, sw=8)}
{lab(L3 + 150, rows[2][0] + RH - 16, 'area = Δv', size=26, italic=False, sw=8)}
{lab(R3 - 4, rows[2][0] + RH + 44, 't', size=34, sw=0)}
</svg>
{PILL}{TITLE}
{scope("one motion, three graphs", y=410, size=46)}
""", c)
labels.append("3  1D Kinematics  |  one motion, three graphs  |  art: car + graph chain")

if __name__ == "__main__":
    names = [f"phys3-{i}" for i in range(1, 4)]
    render(designs, OUT)
    sheet(OUT, names, labels, OUT + "/sheet.png")
