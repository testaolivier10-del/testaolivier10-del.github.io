"""Round 3: three whole topic thumbnails for "Moles and Molar Mass (AP Chemistry 1.1)". Custom SVG art.
Whole topic idea: the mole links a mass you can weigh (grams, via molar mass) to a number of particles you can't count."""
import sys, math, random
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, render, sheet, page3, pill3, title3, scope

c = COURSE["apchem"]; A, D, M = c["accent"], c["deep"], c["mid"]
OUT = "/home/claude/lp/thumbs/apchem3"
YEL, LCD = "#ffd23f", "#7cf0a8"
PILL = "AP CHEM · UNIT 1"
TITLE = [("Moles &amp;", "w"), ("Molar Mass", "a")]

DEFS = f"""<defs>
<radialGradient id=cg cx=.35 cy=.3 r=.75><stop offset=0 stop-color="#9aa1b8"/><stop offset=.45 stop-color="#3b4152"/><stop offset=1 stop-color="#12151f"/></radialGradient>
<radialGradient id=ag cx=.35 cy=.3 r=.75><stop offset=0 stop-color="#e4ecff"/><stop offset=.4 stop-color="{A}"/><stop offset=1 stop-color="#1b2f7a"/></radialGradient>
<linearGradient id=sc x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#f4f6fb"/><stop offset=1 stop-color="#b9c0d3"/></linearGradient>
<linearGradient id=pan x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#ffffff"/><stop offset=1 stop-color="#cfd5e3"/></linearGradient>
<radialGradient id=lens cx=.4 cy=.35 r=.8><stop offset=0 stop-color="#2a4cb0"/><stop offset=1 stop-color="#0d1a4a"/></radialGradient>
<filter id=sh x=-30% y=-30% width=160% height=170%><feDropShadow dx=0 dy=12 stdDeviation=12 flood-color="#000" flood-opacity=".5"/></filter>
</defs>"""
SVG = lambda inner: f'<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{DEFS}{inner}</svg>'
BG = (f'<div class=abs style="inset:0;background:radial-gradient(circle at 74% 50%,{M} 0%,#122564 46%,{D} 100%)"></div>'
      f'<div class=abs style="inset:0;opacity:.07;background:repeating-linear-gradient(90deg,{A} 0 2px,transparent 2px 64px),repeating-linear-gradient(0deg,{A} 0 2px,transparent 2px 64px)"></div>')


def heap(cx, base, w, h, r, fill, seed=1):
    """A mound of identical spheres (half ellipse outline) centered at cx, resting on y=base."""
    rnd = random.Random(seed); pts = []
    for i in range(int(h / (r * 1.55))):
        y = base - r - i * r * 1.55
        half = w / 2 * math.sqrt(max(0, 1 - ((base - y) / h) ** 2))
        k = int(half * 2 / (r * 1.9))
        for j in range(k + 1):
            x = cx - half + (j + (0.5 if i % 2 else 0)) * (half * 2 / max(k, 1))
            if abs(x - cx) <= half + 1:
                pts.append((x + rnd.uniform(-2, 2), y + rnd.uniform(-2, 2)))
    pts.sort(key=lambda p: p[1])
    return "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#{fill})" stroke="#0a0d16" stroke-width="2"/>' for x, y in pts)


def scale(cx, top, w, reading, k=1.0, seed=7, pile=True, fs=60, dw=.54):
    """Digital kitchen scale with a carbon pile. top = y of the pan."""
    s = f'<g transform="translate({cx},{top}) scale({k})">'
    s += f'''<g filter="url(#sh)">
      <path d="M{-w*.48},28 L{w*.48},28 L{w*.54},170 Q{w*.545},186 {w*.52},186 L{-w*.52},186 Q{-w*.545},186 {-w*.54},170 Z" fill="url(#sc)" stroke="{D}" stroke-width="8" stroke-linejoin="round"/>
      <rect x="{-w*dw/2}" y="72" width="{w*dw}" height="86" rx="14" fill="#0d1a3a" stroke="{D}" stroke-width="6"/>
      <rect x="-30" y="6" width="60" height="26" fill="#9aa3ba" stroke="{D}" stroke-width="6"/>
      <ellipse cx="0" cy="0" rx="{w*.5}" ry="28" fill="url(#pan)" stroke="{D}" stroke-width="8"/></g>'''
    if pile:
        s += heap(0, -2, w * .8, w * .55, 16, "cg", seed)
    s += f'<text x="0" y="138" text-anchor="middle" font-family="I" font-weight="900" font-size="{fs}" fill="{LCD}" letter-spacing="1">{reading}</text></g>'
    return s


def txt(x, y, t, size=40, col="#fff", anchor="middle", sw=9):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="I" font-weight="900" font-size="{size}" fill="{col}" '
            f'stroke="{D}" stroke-width="{sw}" paint-order="stroke" letter-spacing="1">{t}</text>')


AVO = lambda size: f'6.022 &#215; 10<tspan dy="-{size*.42:.0f}" font-size="{size*.6:.0f}">23</tspan>'


def lens_atoms(cx, cy, r, n_r=18):
    """Close packed atoms filling a circle (the zoomed in view)."""
    s = ""; step = n_r * 2.05
    rows = int(r * 2 / (step * .87)) + 2
    for i in range(-rows, rows + 1):
        y = cy + i * step * .87
        for j in range(-rows, rows + 1):
            x = cx + j * step + (step / 2 if i % 2 else 0)
            if math.hypot(x - cx, y - cy) < r - n_r * .2:
                s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{n_r}" fill="url(#cg)" stroke="#05070d" stroke-width="2"/>'
    return s


designs, labels = {}, []
HEAD = pill3(c, PILL) + title3(TITLE, c, y=132, size=92)

# 1. ZOOM: a scale weighs 12.01 g of carbon; a magnifier on the pile reveals it is 6.022 x 10^23 atoms.
LX, LY, LR = 1100, 250, 122
designs["apchem3-1"] = page3(BG + SVG(f"""
  <ellipse cx="820" cy="622" rx="250" ry="22" fill="#000" opacity=".25"/>
  {scale(820, 440, 380, "12.01 g", seed=7, fs=56, dw=.6)}
  <path d="M{LX-92},{LY+84} L935,340" stroke="{D}" stroke-width="30" stroke-linecap="round"/>
  <path d="M{LX-92},{LY+84} L935,340" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
  <circle cx="935" cy="340" r="30" fill="none" stroke="#fff" stroke-width="6"/>
  <circle cx="{LX}" cy="{LY}" r="{LR+22}" fill="{D}" filter="url(#sh)"/>
  <clipPath id=lc><circle cx="{LX}" cy="{LY}" r="{LR}"/></clipPath>
  <circle cx="{LX}" cy="{LY}" r="{LR}" fill="url(#lens)"/>
  <g clip-path="url(#lc)">{lens_atoms(LX, LY, LR + 20, 19)}
    <path d="M{LX-90},{LY-48} A115,115 0 0 1 {LX-24},{LY-104}" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".45"/></g>
  <circle cx="{LX}" cy="{LY}" r="{LR+6}" fill="none" stroke="{A}" stroke-width="14"/>
  <circle cx="{LX}" cy="{LY}" r="{LR+15}" fill="none" stroke="#fff" stroke-width="5" opacity=".9"/>
  {txt(1100, 420, AVO(36), 36, YEL)}{txt(1100, 462, "atoms", 34, YEL)}
  <g transform="translate(1135,560) rotate(-4)" filter="url(#sh)">
    <rect x="-92" y="-30" width="184" height="60" rx="16" fill="#fff"/>
    <text x="0" y="14" text-anchor="middle" font-family="I" font-weight="900" font-size="36" fill="{D}">1 mol C</text></g>
""") + HEAD + scope("grams ↔ moles ↔ atoms", y=370), c)
labels.append("1  Moles & Molar Mass  |  grams ↔ moles ↔ atoms  |  art: zoom lens")

# 2. BALANCE: an equal arm balance, 12.01 g weight on one pan, 6.022 x 10^23 carbon atoms on the other, pivot = 1 mol.
PX, PY, ARM = 900, 250, 205
def pan(x, y):
    return (f'<path d="M{x},{y} L{x-98},{y+150} M{x},{y} L{x+98},{y+150}" stroke="#c9d2e3" stroke-width="5"/>'
            f'<path d="M{x-120},{y+150} L{x+120},{y+150} Q{x+100},{y+192} {x},{y+192} Q{x-100},{y+192} {x-120},{y+150} Z" fill="url(#pan)" stroke="{D}" stroke-width="7"/>')
weight = f"""<g filter="url(#sh)"><path d="M{PX-ARM-88},{PY+150} L{PX-ARM+88},{PY+150} L{PX-ARM+68},{PY+40} L{PX-ARM-68},{PY+40} Z" fill="#c8ccd8" stroke="{D}" stroke-width="7" stroke-linejoin="round"/>
  <rect x="{PX-ARM-22}" y="{PY+16}" width="44" height="28" rx="8" fill="#c8ccd8" stroke="{D}" stroke-width="7"/></g>
  <text x="{PX-ARM}" y="{PY+112}" text-anchor="middle" font-family="I" font-weight="900" font-size="38" fill="{D}">12.01 g</text>"""
designs["apchem3-2"] = page3(BG + SVG(f"""
  <ellipse cx="{PX}" cy="612" rx="250" ry="20" fill="#000" opacity=".25"/>
  <g filter="url(#sh)">
    <path d="M{PX-120},600 L{PX+120},600 L{PX+90},560 L{PX-90},560 Z" fill="#2d4aa8" stroke="{D}" stroke-width="7" stroke-linejoin="round"/>
    <rect x="{PX-16}" y="{PY}" width="32" height="320" fill="#2d4aa8" stroke="{D}" stroke-width="7"/>
    <rect x="{PX-ARM-20}" y="{PY-12}" width="{2*ARM+40}" height="24" rx="12" fill="#e8ecf6" stroke="{D}" stroke-width="7"/>
  </g>
  {pan(PX-ARM, PY)}{pan(PX+ARM, PY)}
  {weight}
  {heap(PX+ARM, PY+152, 210, 140, 15, "cg", seed=11)}
  <g filter="url(#sh)"><circle cx="{PX}" cy="{PY}" r="62" fill="{A}" stroke="#fff" stroke-width="8"/></g>
  <text x="{PX}" y="{PY+14}" text-anchor="middle" font-family="I" font-weight="900" font-size="38" fill="#fff" stroke="{D}" stroke-width="6" paint-order="stroke">1 mol</text>
  {txt(PX-ARM, PY+250, "mass you weigh", 30, "#fff")}
  {txt(PX+ARM, PY+250, AVO(36), 36, YEL)}{txt(PX+ARM, PY+292, "atoms you count", 30, YEL)}
""") + HEAD + scope("weigh it, then count it", y=370), c)
labels.append("2  Moles & Molar Mass  |  weigh it, then count it  |  art: balance")

# 3. HUB: one mole at the center, equal to three things: molar mass on the periodic tile, 12.01 g on a scale, 6.022 x 10^23 atoms.
HX, HY = 975, 345
tile = f"""<g transform="translate(1140,150) rotate(4)" filter="url(#sh)">
  <rect x="-80" y="-96" width="160" height="192" rx="18" fill="#fff" stroke="{A}" stroke-width="8"/>
  <text x="-58" y="-56" font-family="I" font-weight="900" font-size="32" fill="{D}">6</text>
  <text x="0" y="28" text-anchor="middle" font-family="I" font-weight="900" font-size="100" fill="{D}">C</text>
  <text x="0" y="76" text-anchor="middle" font-family="I" font-weight="900" font-size="34" fill="{D}">12.01</text>
  <ellipse cx="0" cy="64" rx="66" ry="26" fill="none" stroke="{YEL}" stroke-width="6"/></g>"""
pile_atoms = "".join(
    f'<circle cx="{1150 + dx}" cy="{500 + dy}" r="16" fill="url(#cg)" stroke="#0a0d16" stroke-width="2"/>'
    for dx, dy in [(-38, -30), (0, -34), (38, -30), (-56, 2), (-19, 0), (19, 0), (56, 2), (-38, 32), (0, 34), (38, 32)])
designs["apchem3-3"] = page3(BG + SVG(f"""
  <g stroke="{A}" stroke-width="10" stroke-dasharray="2 18" stroke-linecap="round" opacity=".9">
    <path d="M{HX},{HY} L1140,170"/><path d="M{HX},{HY} L720,480"/><path d="M{HX},{HY} L1150,500"/></g>
  <circle cx="{HX}" cy="{HY}" r="150" fill="{A}" opacity=".18"/>
  <g filter="url(#sh)"><circle cx="{HX}" cy="{HY}" r="108" fill="{A}" stroke="#fff" stroke-width="10"/></g>
  <text x="{HX}" y="{HY+8}" text-anchor="middle" font-family="I" font-weight="900" font-size="64" fill="#fff" stroke="{D}" stroke-width="8" paint-order="stroke">1 mol</text>
  <text x="{HX}" y="{HY+52}" text-anchor="middle" font-family="I" font-weight="900" font-size="30" fill="{D}">of carbon</text>
  {tile}
  {txt(1148, 298, "12.01 g/mol", 28, YEL)}
  {scale(700, 440, 240, "12.01 g", seed=5, fs=40, dw=.72, pile=False)}{heap(700, 438, 210, 110, 15, "cg", 5)}
  <circle cx="1150" cy="500" r="74" fill="{D}" stroke="#fff" stroke-width="7"/>
  {pile_atoms}
  {txt(1110, 618, AVO(30) + " atoms", 30, YEL, "middle")}
""") + HEAD + scope("1 mol = grams = atoms", y=370), c)
labels.append("3  Moles & Molar Mass  |  1 mol = grams = atoms  |  art: mole hub")

names = list(designs)
render(designs, OUT)
sheet(OUT, names, labels, f"{OUT}/sheet.png")
print("ok")
