"""3 thumbnails for orgo 02 'Atomic Orbitals' (s and p orbitals, electron configuration, Hund's rule).
Every art stands for the whole topic: the orbital shapes plus how electrons fill them."""
import sys, math
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, render, sheet, page3, pill3, title3, scope

c = COURSE["orgo"]
A, D, M = c["accent"], c["deep"], c["mid"]
Y = "#ffd23f"; TE = "#2ee6d6"
OUT = "/home/claude/lp/thumbs/orgo_o2"
GRID = (f"repeating-linear-gradient(90deg,{A}0d 0 2px,transparent 2px 64px),"
        f"repeating-linear-gradient(0deg,{A}0d 0 2px,transparent 2px 64px)")
PILL = "ORGO · FOUNDATIONS"
TITLE = [("Atomic", "w"), ("Orbitals", "a")]

DEFS = f"""<defs>
<radialGradient id=pa cx=.7 cy=.4 r=.75><stop offset=0 stop-color="#a8fbf2"/><stop offset=.6 stop-color="#2ec9bd"/><stop offset=1 stop-color="#0f7d77"/></radialGradient>
<radialGradient id=pb cx=.7 cy=.4 r=.75><stop offset=0 stop-color="#ece6ff"/><stop offset=.6 stop-color="{A}"/><stop offset=1 stop-color="#5a44b8"/></radialGradient>
<radialGradient id=sp cx=.42 cy=.38 r=.62><stop offset=0 stop-color="#c9fff9" stop-opacity=".9"/><stop offset=.7 stop-color="#2ec9bd" stop-opacity=".6"/><stop offset=1 stop-color="#139c94" stop-opacity=".45"/></radialGradient>
<radialGradient id=nu cx=.38 cy=.32 r=.7><stop offset=0 stop-color="#ffd0c4"/><stop offset=1 stop-color="#c2465a"/></radialGradient>
<radialGradient id=halo><stop offset=0 stop-color="{A}" stop-opacity=".55"/><stop offset=1 stop-color="{A}" stop-opacity="0"/></radialGradient>
<filter id=sh x=-30% y=-30% width=160% height=160%><feDropShadow dx=0 dy=8 stdDeviation=8 flood-color="#000" flood-opacity=".55"/></filter>
</defs>"""

def lobe(L, w):
    a = L * .18
    return f"M 0 0 C {a:.0f} {-w:.0f} {L*.92:.0f} {-w*1.12:.0f} {L:.0f} 0 C {L*.92:.0f} {w*1.12:.0f} {a:.0f} {w:.0f} 0 0 Z"

def porb(cx, cy, ang, L, w, fl=1.0, op=.95):
    return (f'<g transform="translate({cx} {cy}) rotate({ang})" opacity="{op}">'
            f'<path d="{lobe(L*fl, w)}" fill="url(#pa)" stroke="#e6fffc" stroke-opacity=".6" stroke-width="3"/>'
            f'<path d="{lobe(L*fl, w)}" transform="rotate(180)" fill="url(#pb)" stroke="#f3efff" stroke-opacity=".6" stroke-width="3"/></g>')

def axes(cx, cy, r):
    return (f'<g stroke="#fff" stroke-opacity=".45" stroke-width="3"><line x1="{cx-r}" y1="{cy}" x2="{cx+r}" y2="{cy}"/><line x1="{cx}" y1="{cy-r}" x2="{cx}" y2="{cy+r}"/>'
            f'<line x1="{cx+r*.6}" y1="{cy-r*.5}" x2="{cx-r*.6}" y2="{cy+r*.5}" stroke-dasharray="10 8"/></g>')

def T(x, y, t, s, f, w=900, anchor="middle", extra="", fam="I"):
    return f'<text x="{x}" y="{y}" font-family="{fam}" font-weight="{w}" font-size="{s}" fill="{f}" text-anchor="{anchor}" dominant-baseline="central" {extra}>{t}</text>'

def arr(x, y, up, col="#fff", h=22, sw=6):
    d = (f"M {x} {y+h} L {x} {y-h} M {x-10} {y-h+12} L {x} {y-h} L {x+10} {y-h+12}" if up else
         f"M {x} {y-h} L {x} {y+h} M {x-10} {y+h-12} L {x} {y+h} L {x+10} {y+h-12}")
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'

def bx(x, y, s, arrows, lab=None):
    g = f'<rect x="{x-s/2}" y="{y-s/2}" width="{s}" height="{s}" rx="10" fill="{D}" stroke="#fff" stroke-width="4"/>'
    if arrows == 2: g += arr(x - 12, y, True, Y) + arr(x + 12, y, False, Y)
    elif arrows == 1: g += arr(x, y, True, Y)
    if lab: g += T(x, y + s/2 + 26, lab, 26, "#d9d4f5", 800)
    return g

BG = f"""<div class=abs style="inset:0;background:radial-gradient(circle at 76% 50%,{M} 0%,#1b1445 42%,{D} 85%)"></div>
<div class=abs style="inset:0;background:{GRID};-webkit-mask-image:linear-gradient(90deg,transparent 30%,#000 70%)"></div>"""

designs = {}
cx, cy = 925, 360
three_p = (f'<circle cx="{cx}" cy="{cy}" r="300" fill="url(#halo)" opacity=".6"/>{axes(cx, cy, 300)}'
           + porb(cx, cy, 0, 250, 92) + porb(cx, cy, -90, 250, 92) + porb(cx, cy, 145, 240, 96, .8, .9)
           + f'<circle cx="{cx}" cy="{cy}" r="12" fill="url(#nu)"/>')

# 1. THE ORBITAL SET: the three p orbitals at right angles around one nucleus, with a small s sphere tag.
designs["o2-1"] = page3(f"""{BG}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
  {three_p}
  <g filter="url(#sh)"><circle cx="1170" cy="130" r="64" fill="url(#sp)" stroke="#fff" stroke-width="4"/>{T(1170, 132, "s", 54, D)}</g>
  <g filter="url(#sh)"><rect x="1100" y="530" width="140" height="70" rx="35" fill="{D}" stroke="{A}" stroke-width="4"/>{T(1170, 566, "p × 3", 32, A)}</g>
</svg>
{pill3(c, PILL)}{title3(TITLE, c)}{scope("where electrons really live", y=400, size=42)}
""", c)

# 2. SHAPES + FILLING: one big p orbital above, the orbital boxes of nitrogen filling below (configuration + Hund).
designs["o2-2"] = page3(f"""{BG}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
  <circle cx="930" cy="250" r="260" fill="url(#halo)" opacity=".6"/>
  {porb(930, 250, -16, 290, 118)}<circle cx="930" cy="250" r="13" fill="url(#nu)"/>
  <rect x="640" y="470" width="590" height="160" rx="26" fill="{D}d8" stroke="{A}" stroke-width="4" filter="url(#sh)"/>
  {bx(712, 540, 70, 2, "1s")}{bx(800, 540, 70, 2, "2s")}{bx(900, 540, 70, 1)}{bx(970, 540, 70, 1)}{bx(1040, 540, 70, 1)}
  {T(970, 600, "2p", 26, "#d9d4f5", 800)}
  {T(1150, 525, "N", 64, "#fff")}{T(1150, 585, "3 unpaired", 22, Y, 800)}
</svg>
{pill3(c, PILL)}{title3(TITLE, c)}{scope("shapes, filling, box by box", y=400, size=42)}
""", c)

# 3. TAGGED: the orbital set with the video's big ideas pointing at it.
def tag(x, y, text, col, tx, ty):
    w = len(text) * 17 + 44
    ex = x if tx < x else x + w if tx > x + w else tx
    ey = y + 26 if (tx < x or tx > x + w) else (y if ty < y else y + 52)
    return (f'<path d="M{tx},{ty} L{ex},{ey}" stroke="{col}" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>'
            f'<circle cx="{tx}" cy="{ty}" r="8" fill="{col}" stroke="{D}" stroke-width="3"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="52" rx="26" fill="{D}" stroke="{col}" stroke-width="4" filter="url(#sh)"/>'
            + T(x + w / 2, y + 27, text, 27, col, 900))
designs["o2-3"] = page3(f"""{BG}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}
  {three_p}
  {tag(1010, 70, "nodal planes", Y, cx, cy)}
  {tag(640, 110, "2py", TE, cx, 200)}
  {tag(1080, 470, "2px", "#fff", 1110, 380)}
  {tag(650, 590, "2pz", A, 820, 450)}
</svg>
{pill3(c, PILL)}{title3(TITLE, c)}{scope("where electrons really live", y=400, size=42)}
""", c)

names = ["o2-1", "o2-2", "o2-3"]
labels = ["1  Atomic Orbitals | where electrons really live | art: 3 p orbitals + s",
          "2  Atomic Orbitals | shapes, filling, box by box | art: p orbital + N boxes",
          "3  Atomic Orbitals | where electrons really live | art: labeled p set"]
render(designs, OUT)
sheet(OUT, names, labels, OUT + "/sheet.png")
print("ok")
