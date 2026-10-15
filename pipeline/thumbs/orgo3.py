"""Round 3: 3 thumbnails for 'Atomic Structure for Organic Chemistry (Valence Electrons, Octet Rule)'.
Every art stands for atomic structure as a whole: a full carbon atom (nucleus, shells, valence electrons)."""
import sys, math
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, render, sheet, page3, pill3, title3, scope

c = COURSE["orgo"]
A, D, M = c["accent"], c["deep"], c["mid"]
Y = "#ffd23f"
PALE = "#d9d4f5"
OUT = "/home/claude/lp/thumbs/orgo3"
GRID = (f"repeating-linear-gradient(90deg,{A}0d 0 2px,transparent 2px 64px),"
        f"repeating-linear-gradient(0deg,{A}0d 0 2px,transparent 2px 64px)")
PILL = "ORGO · START HERE"
TITLE = [("Atomic", "w"), ("Structure", "a")]

DEFS = f"""<defs>
<radialGradient id=pr cx=.35 cy=.3 r=.75><stop offset=0 stop-color="#ffc2b8"/><stop offset=.55 stop-color="#f06a68"/><stop offset=1 stop-color="#b8383f"/></radialGradient>
<radialGradient id=ne cx=.35 cy=.3 r=.75><stop offset=0 stop-color="#ffffff"/><stop offset=.6 stop-color="#c9c5e6"/><stop offset=1 stop-color="#8e89b8"/></radialGradient>
<radialGradient id=ev cx=.35 cy=.3 r=.8><stop offset=0 stop-color="#e4defc"/><stop offset=.6 stop-color="{A}"/><stop offset=1 stop-color="#6c5fc0"/></radialGradient>
<radialGradient id=halo><stop offset=0 stop-color="{A}" stop-opacity=".55"/><stop offset=1 stop-color="{A}" stop-opacity="0"/></radialGradient>
<radialGradient id=core><stop offset=0 stop-color="#ff9a8a" stop-opacity=".45"/><stop offset=1 stop-color="#ff9a8a" stop-opacity="0"/></radialGradient>
<filter id=sh x=-30% y=-30% width=160% height=160%><feDropShadow dx=0 dy=8 stdDeviation=8 flood-color="#000" flood-opacity=".55"/></filter>
</defs>"""


def nucleus(cx, cy, r):
    """Carbon 12 nucleus: 6 protons + 6 neutrons in a round packed cluster (rows 2,4,4,2) so every ball shows."""
    rows = [(-1.5, 2), (-.5, 4), (.5, 4), (1.5, 2)]
    kinds = list("pn" "npnp" "pnpn" "np")  # 6 p, 6 n, alternating
    g, i = f'<circle cx="{cx}" cy="{cy}" r="{r * 4.2:.1f}" fill="url(#core)"/>', 0
    for ry, n in rows:
        for k in range(n):
            x = cx + (k - (n - 1) / 2) * r * 1.62
            y = cy + ry * r * 1.45
            kind = kinds[i]; i += 1
            g += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="url(#{"pr" if kind == "p" else "ne"})" stroke="{D}" stroke-width="{r * .16:.1f}"/>'
    return g


def atom(cx, cy, R, val_angles=(55, 145, 235, 325), core_angles=(20, 200), tilt=0, labels=False):
    """Bohr model of carbon: 2 core electrons on the inner shell, 4 valence electrons on the outer shell."""
    r1 = R * .5
    g = f'<circle cx="{cx}" cy="{cy}" r="{R * 1.25:.1f}" fill="url(#halo)" opacity=".55"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="{r1:.1f}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="{R * .018:.1f}"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="{R:.1f}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="{R * .026:.1f}"/>'
    g += nucleus(cx, cy, R * .095)
    for a in core_angles:
        t = math.radians(a)
        g += f'<circle cx="{cx + r1 * math.cos(t):.1f}" cy="{cy - r1 * math.sin(t):.1f}" r="{R * .052:.1f}" fill="{PALE}" stroke="{D}" stroke-width="{R * .014:.1f}"/>'
    for a in val_angles:
        t = math.radians(a)
        x, y = cx + R * math.cos(t), cy - R * math.sin(t)
        g += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{R * .16:.1f}" fill="url(#halo)"/>'
        g += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{R * .078:.1f}" fill="url(#ev)" stroke="#fff" stroke-width="{R * .02:.1f}"/>'
    return g


def T(x, y, t, s, f, w=900, anchor="middle", extra=""):
    return f'<text x="{x}" y="{y}" font-family="I" font-weight="{w}" font-size="{s}" fill="{f}" text-anchor="{anchor}" dominant-baseline="central" {extra}>{t}</text>'


BG = f"""<div class=abs style="inset:0;background:radial-gradient(circle at 76% 50%,{M} 0%,#1b1445 42%,{D} 85%)"></div>
<div class=abs style="inset:0;background:{GRID};-webkit-mask-image:linear-gradient(90deg,transparent 30%,#000 70%)"></div>"""

designs = {}

# 1. THE FULL ATOM: one large, polished carbon atom on the right; the whole structure in one picture.
designs["orgo3-1"] = page3(f"""{BG}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
  {atom(920, 350, 268)}
  <g filter="url(#sh)"><rect x="1128" y="74" width="104" height="112" rx="18" fill="{A}" stroke="#fff" stroke-width="5"/>
  {T(1146, 98, "6", 26, D, anchor="start")}{T(1180, 140, "C", 62, D)}</g>
</svg>
{pill3(c, PILL)}{title3(TITLE, c)}{scope("the atoms behind every reaction", y=400, size=40)}
""", c)

# 2. ATOM TO BOND: carbon's Bohr atom, its 4 valence electrons become Lewis dots, which bond into methane (CH4).
def dot(x, y, f, r=11):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{f}" stroke="{D}" stroke-width="4"/>'

lew_cx, lew_cy = 1110, 178
lewis = T(lew_cx, lew_cy, "C", 96, "#fff") + "".join(dot(lew_cx + dx, lew_cy + dy, A, 12) for dx, dy in ((0, -66), (0, 66), (-62, 0), (62, 0)))
mcx, mcy = 1096, 478
meth = T(mcx, mcy, "C", 84, "#fff")
for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
    hx, hy = mcx + dx * 122, mcy + dy * 100
    meth += T(hx, hy, "H", 62, PALE)
    px, py = mcx + dx * 56, mcy + dy * 52
    if dx == 0:
        meth += dot(px - 10, py, A, 10) + dot(px + 10, py, "#fff", 10)
    else:
        meth += dot(px, py - 10, A, 10) + dot(px, py + 10, "#fff", 10)
meth += f'<circle cx="{mcx}" cy="{mcy}" r="74" fill="none" stroke="{Y}" stroke-width="5" stroke-dasharray="12 10"/>'
meth += T(mcx + 92, mcy - 84, "8", 44, Y)

arrow = lambda d: f'<path d="{d}" fill="none" stroke="{Y}" stroke-width="7" stroke-linecap="round"/>'
designs["orgo3-2"] = page3(f"""{BG}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
  {atom(790, 360, 172)}
  <rect x="1010" y="82" width="200" height="194" rx="28" fill="{D}d0" stroke="{A}" stroke-width="5" filter="url(#sh)"/>
  {lewis}
  {arrow("M960,200 Q980,180 1000,180")}<path d="M990,166 L1004,180 L990,194" fill="none" stroke="{Y}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  {arrow("M1110,290 L1110,338")}<path d="M1096,326 L1110,342 L1124,326" fill="none" stroke="{Y}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  {meth}
</svg>
{pill3(c, PILL)}{title3(TITLE, c)}{scope("from atoms to bonds", y=400, size=46)}
""", c)

# 3. ONLY THESE 4 MATTER: the full atom with the video's 4 big ideas as tags pointing to the parts they describe.
def tag(x, y, text, col, tx, ty):
    """Pill label at (x, y) with a dotted leader to the target point (tx, ty), from the pill edge nearest the target."""
    w = len(text) * 18 + 44
    ex = x if tx < x else x + w if tx > x + w else tx
    ey = y + 26 if (tx < x or tx > x + w) else (y if ty < y else y + 52)
    return (f'<path d="M{tx},{ty} L{ex},{ey}" stroke="{col}" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>'
            f'<circle cx="{tx}" cy="{ty}" r="8" fill="{col}" stroke="{D}" stroke-width="3"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="52" rx="26" fill="{D}" stroke="{col}" stroke-width="4" filter="url(#sh)"/>'
            + T(x + w / 2, y + 27, text, 28, col, 900, extra='letter-spacing="1"'))

# atom center (900, 370), R 215: outer shell r 215, inner shell r 107.5
designs["orgo3-3"] = page3(f"""{BG}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
  {atom(900, 370, 215, val_angles=(65, 155, 245, 335), core_angles=(130, 310))}
  <circle cx="900" cy="370" r="215" fill="none" stroke="{Y}" stroke-width="6" stroke-dasharray="1 0" opacity="0"/>
  {tag(1050, 70, "valence e⁻", Y, 991, 175)}
  {tag(640, 120, "nucleus", "#ff9a8a", 878, 350)}
  {tag(1040, 560, "shells", "#fff", 993, 424)}
  {tag(660, 586, "octet rule", A, 760, 534)}
</svg>
{pill3(c, PILL)}{title3(TITLE, c)}{scope("only these 4 matter", y=400, size=46)}
""", c)

names = [f"orgo3-{i}" for i in (1, 2, 3)]
labels = ["1  Atomic Structure  |  the atoms behind every reaction  |  art: carbon atom",
          "2  Atomic Structure  |  from atoms to bonds  |  art: atom to CH4",
          "3  Atomic Structure  |  only these 4 matter  |  art: tagged atom"]
render(designs, OUT)
sheet(OUT, names, labels, OUT + "/sheet.png")
print("ok")
