"""Round 3: three whole topic thumbnails for AP Bio 1.1 Properties of Water (yt-apbio-01-water-hydrogen-bonding)."""
import sys, math, base64, random
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, render, sheet, page3, pill3, title3, scope

c = COURSE["apbio"]; A, D, M = c["accent"], c["deep"], c["mid"]
OUT = "/home/claude/lp/thumbs/apbio3"
GREEK = "/home/claude/lp/node_modules/@fontsource/inter/files/inter-greek-900-normal.woff2"
GCSS = ("@font-face{font-family:I;font-weight:900;unicode-range:U+0370-03FF;src:url(data:font/woff2;base64,"
        + base64.b64encode(open(GREEK, "rb").read()).decode() + ")}")
HALF = 104.5 / 2          # H-O-H angle 104.5 degrees
YEL, NEG, POS = "#ffd23f", "#ff6b6b", "#7cc4ff"

DEFS = """<defs>
<radialGradient id=gO cx=.35 cy=.3 r=.75><stop offset=0 stop-color="#ff9a8a"/><stop offset=.45 stop-color="#ec3b33"/><stop offset=1 stop-color="#9c1414"/></radialGradient>
<radialGradient id=gH cx=.35 cy=.3 r=.75><stop offset=0 stop-color="#ffffff"/><stop offset=.6 stop-color="#e8eef2"/><stop offset=1 stop-color="#a9b6c0"/></radialGradient>
<filter id=sh x=-.5 y=-.5 width=2 height=2><feDropShadow dx=0 dy=8 stdDeviation=8 flood-color="#000" flood-opacity=".45"/></filter>
</defs>"""
SVG = lambda inner, extra="": f'<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%;{extra}">{DEFS}{inner}</svg>'
BG = (f'<div class=abs style="inset:0;background:radial-gradient(circle at 73% 50%,{M} 0%,#14331a 48%,{D} 100%)"></div>'
      f'<div class=abs style="inset:0;opacity:.06;background:repeating-linear-gradient(60deg,{A} 0 2px,transparent 2px 46px),repeating-linear-gradient(-60deg,{A} 0 2px,transparent 2px 46px)"></div>')


def ang(x1, y1, x2, y2):
    """direction from point 1 to point 2; 0 = down (+y), 90 = right (+x)"""
    return math.degrees(math.atan2(x2 - x1, y2 - y1))


def hpos(cx, cy, rot, d):
    return [(cx + d * math.sin(math.radians(rot + s * HALF)), cy + d * math.cos(math.radians(rot + s * HALF))) for s in (-1, 1)]


def mol(cx, cy, rot, k=1.0, op=1.0, shadow=True):
    """water molecule; rot = direction of the H side bisector. Returns svg, H positions, O radius, H radius"""
    rO, rH, d = 50 * k, 31 * k, 66 * k
    hs = hpos(cx, cy, rot, d)
    f = ' filter="url(#sh)"' if shadow else ""
    g = f'<g{f} opacity="{op}">'
    for x, y in hs:
        g += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rH:.1f}" fill="url(#gH)" stroke="{D}" stroke-width="{4*k:.1f}"/>'
    g += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rO:.1f}" fill="url(#gO)" stroke="{D}" stroke-width="{4*k:.1f}"/></g>'
    return g, hs, rO, rH


def hbond(h, rH, o, rO, w=8, op=1.0, outline=True):
    """dotted H...O hydrogen bond from the edge of H to the edge of O"""
    dx, dy = o[0] - h[0], o[1] - h[1]; L = math.hypot(dx, dy); ux, uy = dx / L, dy / L
    p1 = (h[0] + ux * (rH + 8), h[1] + uy * (rH + 8)); p2 = (o[0] - ux * (rO + 8), o[1] - uy * (rO + 8))
    ln = lambda col, ww: (f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" stroke="{col}" stroke-width="{ww}" '
                          f'stroke-linecap="round" stroke-dasharray="0.1 {w*2.4:.1f}" opacity="{op}"/>')
    return (ln(D, w + 8) if outline else "") + ln(YEL, w)


def glyph(x, y, t, col, size=50, sw=9):
    return (f'<text x="{x:.0f}" y="{y:.0f}" font-family="I" font-weight="900" font-size="{size}" fill="{col}" text-anchor="middle" '
            f'stroke="{D}" stroke-width="{sw}" paint-order="stroke" dominant-baseline="middle">{t}</text>')


def cluster(cx, cy, k, charges=True):
    """central water molecule H bonded to 4 neighbours: it donates its two H to two O, and its O accepts H from two others"""
    gc, hs, rO, rH = mol(cx, cy, 0, k)
    d = 66 * k; reach = d * 3.7             # O to O distance of an H bond (about 2.8 A vs 0.96 A covalent)
    back, front = "", ""
    # acceptors: O along the direction of each central H
    for s, (hx, hy) in zip((-1, 1), hs):
        a = s * HALF
        ox, oy = cx + reach * math.sin(math.radians(a)), cy + reach * math.cos(math.radians(a))
        g, _, _, _ = mol(ox, oy, a + s * 40, k)
        back += g; front += hbond((hx, hy), rH, (ox, oy), rO)
    # donors: above, tetrahedral like, each pointing one H at the central O
    for s in (-1, 1):
        a = 180 + s * 58
        ox, oy = cx + reach * math.sin(math.radians(a)), cy + reach * math.cos(math.radians(a))
        r = ang(ox, oy, cx, cy) - HALF * (1 if s < 0 else -1)
        g, hh, _, _ = mol(ox, oy, r, k)
        h = hh[1] if s < 0 else hh[0]
        back += g; front += hbond(h, rH, (cx, cy), rO)
    ch = ""
    if charges:
        ch = (glyph(cx, cy - rO - 40 * k, "δ−", NEG, 56 * k + 8)
              + glyph(hs[0][0] - 62 * k, hs[0][1] - 14 * k, "δ+", POS, 56 * k + 8)
              + glyph(hs[1][0] + 62 * k, hs[1][1] - 14 * k, "δ+", POS, 56 * k + 8))
    return back + front + gc + ch


TITLE = title3([("Properties", "w"), ("of Water", "a")], c, y=128, size=100)
PILL = pill3(c, "AP BIO · UNIT 1")
designs, labels = {}, []

# ---------- 1. THE H BOND NETWORK: one water molecule hydrogen bonded to four neighbours ----------
bgm = ""
random.seed(4)
for (x, y) in [(700, 110), (1210, 110), (1235, 430), (690, 590), (1150, 600), (860, 650), (1010, 60)]:
    rr = random.uniform(0, 360); hh = hpos(x, y, rr, 36)
    bgm += "".join(f'<circle cx="{a:.0f}" cy="{b:.0f}" r="17" fill="none" stroke="{A}" stroke-width="4" opacity=".28"/>' for a, b in hh)
    bgm += f'<circle cx="{x}" cy="{y}" r="27" fill="{A}" opacity=".22"/>'
designs["apbio3-1"] = page3(f"""{BG}
<div class=abs style="left:640px;top:40px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,{A}44 0%,transparent 66%)"></div>
{SVG(bgm + cluster(950, 300, .9))}
{PILL}{TITLE}{scope("all from one bond", y=375)}
""", c, css=GCSS)
labels.append("1  Properties of Water  |  all from one bond  |  art: H bond network")

# ---------- 2. A WATER DROP whose inside is the H bond network ----------
DX, DY, DH = 945, 420, 240          # drop centre of the round part, radius
drop = (f"M{DX},{DY-DH*1.65:.0f} C{DX+DH*.35:.0f},{DY-DH*1.1:.0f} {DX+DH:.0f},{DY-DH*.55:.0f} {DX+DH:.0f},{DY+DH*.05:.0f} "
        f"A{DH},{DH} 0 0 1 {DX-DH},{DY+DH*.05:.0f} C{DX-DH:.0f},{DY-DH*.55:.0f} {DX-DH*.35:.0f},{DY-DH*1.1:.0f} {DX},{DY-DH*1.65:.0f} Z")
k2 = .56; d2 = 66 * k2; sp = d2 * 3.3
pts = []
random.seed(11)
for r in range(-8, 6):
    for q in range(-6, 7):
        x = DX + q * sp + (r % 2) * sp / 2 + random.uniform(-5, 5); y = DY - 10 + r * sp * .866 + random.uniform(-6, 6)
        pts.append((x, y))
net_b, net_f = "", ""
for i, (x, y) in enumerate(pts):
    nb = sorted([p for j, p in enumerate(pts) if j != i], key=lambda p: math.hypot(p[0] - x, p[1] - y))[:6]
    t = nb[random.randrange(6)]
    r = ang(x, y, *t) - HALF
    g, hs, rO, rH = mol(x, y, r, k2, shadow=False)
    net_b += g
    net_f += hbond(hs[1], rH, t, rO, w=6, outline=False)
    # second H: bond it to whichever O lies closest to its direction
    a2 = r - HALF
    best = min(nb, key=lambda p: abs((ang(x, y, *p) - a2 + 180) % 360 - 180))
    if abs((ang(x, y, *best) - a2 + 180) % 360 - 180) < 22:
        net_f += hbond(hs[0], rH, best, rO, w=6, outline=False)
dropsvg = f"""
<defs><clipPath id=dc><path d="{drop}"/></clipPath>
<linearGradient id=dw x1=0 y1=0 x2=.4 y2=1><stop offset=0 stop-color="#3fa6e0"/><stop offset=1 stop-color="#0d4f8a"/></linearGradient>
<radialGradient id=dg cx=.3 cy=.25 r=.6><stop offset=0 stop-color="#fff" stop-opacity=".35"/><stop offset=1 stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<path d="{drop}" fill="{D}" transform="translate(0 14)" opacity=".6"/>
<path d="{drop}" fill="url(#dw)"/>
<g clip-path="url(#dc)">{net_f}{net_b}<path d="{drop}" fill="url(#dg)"/></g>
<path d="{drop}" fill="none" stroke="{D}" stroke-width="16"/>
<path d="{drop}" fill="none" stroke="#dff6ff" stroke-width="7"/>
<path d="M{DX-DH*.7:.0f},{DY-DH*.2:.0f} Q{DX-DH*.62:.0f},{DY-DH*.7:.0f} {DX-DH*.3:.0f},{DY-DH*1.05:.0f}" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".8"/>
"""
designs["apbio3-2"] = page3(f"""{BG}
<div class=abs style="left:620px;top:20px;width:660px;height:700px;border-radius:50%;background:radial-gradient(circle,{A}40 0%,transparent 66%)"></div>
{SVG(dropsvg)}
{PILL}{TITLE}{scope("every property, one bond", y=375)}
""", c, css=GCSS)
labels.append("2  Properties of Water  |  every property, one bond  |  art: drop full of H bonds")

# ---------- 3. HUB: an H bonded pair in the middle, the six properties around it ----------
HX, HY, RR = 945, 355, 245


def badge(i, inner):
    a = math.radians(-90 + i * 60)
    x, y = HX + RR * math.cos(a), HY + RR * math.sin(a)
    return (x, y, f'<g transform="translate({x:.0f} {y:.0f})"><circle r="66" fill="{D}" stroke="{A}" stroke-width="6" filter="url(#sh)"/>'
                  f'<g transform="scale(1.18)">{inner}</g></g>')


icons = [
    # 0 top: cohesion, a water bead sitting on a leaf surface
    f'<path d="M-44,22 L44,22" stroke="{A}" stroke-width="8" stroke-linecap="round"/><path d="M-34,20 Q-34,-30 0,-30 Q34,-30 34,20 Z" fill="#4fb3ea" stroke="#dff6ff" stroke-width="5"/><path d="M-18,-6 Q-16,-18 -4,-20" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>',
    # 1 upper right: adhesion, water climbing a tree
    f'<rect x="-7" y="-6" width="14" height="40" rx="3" fill="#8a5a34"/><circle cx="-14" cy="-16" r="18" fill="{A}"/><circle cx="14" cy="-16" r="18" fill="{A}"/><circle cx="0" cy="-30" r="20" fill="#a8dc8a"/><path d="M0,32 L0,0" stroke="#7cc4ff" stroke-width="4"/><path d="M-8,8 L0,-2 L8,8" fill="none" stroke="#7cc4ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    # 2 lower right: high specific heat, thermometer
    f'<rect x="-9" y="-40" width="18" height="58" rx="9" fill="#fff"/><circle cx="0" cy="26" r="16" fill="#fff"/><rect x="-4" y="-12" width="8" height="34" fill="{NEG}"/><circle cx="0" cy="26" r="10" fill="{NEG}"/><path d="M14,-30 L24,-30 M14,-18 L24,-18 M14,-6 L24,-6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    # 3 bottom: solvent, salt dissolving (Na+ and Cl- spreading out)
    f'<circle cx="-20" cy="-14" r="15" fill="#b98cf0"/><circle cx="18" cy="-18" r="19" fill="{A}"/><circle cx="-14" cy="22" r="19" fill="{A}"/><circle cx="22" cy="18" r="15" fill="#b98cf0"/><text x="-20" y="-9" font-family="I" font-weight="900" font-size="15" fill="{D}" text-anchor="middle">+</text><text x="22" y="23" font-family="I" font-weight="900" font-size="15" fill="{D}" text-anchor="middle">+</text><text x="18" y="-12" font-family="I" font-weight="900" font-size="18" fill="{D}" text-anchor="middle">−</text><text x="-14" y="28" font-family="I" font-weight="900" font-size="18" fill="{D}" text-anchor="middle">−</text>',
    # 4 lower left: ice floats, iceberg mostly under the water line
    f'<path d="M-46,-8 L46,-8" stroke="#7cc4ff" stroke-width="5" stroke-linecap="round"/><path d="M-12,-8 L-4,-24 L4,-16 L12,-8 Z" fill="#fff"/><path d="M-12,-8 L12,-8 L26,10 L14,36 L-16,36 L-28,14 Z" fill="#9fd8f0" opacity=".85"/>',
    # 5 upper left: evaporative cooling, sweat drop with a molecule leaving
    f'<path d="M-10,-26 C-4,-12 14,2 14,18 A24,24 0 0 1 -34,18 C-34,2 -16,-12 -10,-26 Z" fill="#4fb3ea" stroke="#dff6ff" stroke-width="4" transform="translate(0 6)"/><circle cx="24" cy="-26" r="9" fill="url(#gO)"/><circle cx="16" cy="-20" r="5.5" fill="url(#gH)"/><circle cx="32" cy="-20" r="5.5" fill="url(#gH)"/><path d="M12,-4 L20,-14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
]
spokes, badges = "", ""
for i, ic in enumerate(icons):
    x, y, b = badge(i, ic)
    spokes += f'<line x1="{HX}" y1="{HY}" x2="{x:.0f}" y2="{y:.0f}" stroke="{A}" stroke-width="5" opacity=".55" stroke-dasharray="2 12" stroke-linecap="round"/>'
    badges += b
# the pair: left molecule donates an H to the right molecule's O
k3 = .7
lx, ly, rx, ry = HX - 78, HY - 4, HX + 92, HY + 10
r = ang(lx, ly, rx, ry) - HALF
gl, hl, rO3, rH3 = mol(lx, ly, r, k3)
gr, hr, _, _ = mol(rx, ry, ang(lx, ly, rx, ry) + 10, k3)
pair = (f'<circle cx="{HX+10}" cy="{HY}" r="150" fill="{D}" opacity=".9"/><circle cx="{HX+10}" cy="{HY}" r="150" fill="none" stroke="{A}" stroke-width="7"/>'
        + gl + gr + hbond(hl[1], rH3, (rx, ry), rO3, w=7))
designs["apbio3-3"] = page3(f"""{BG}
{SVG(spokes + badges + pair)}
{PILL}{TITLE}{scope("1 bond → 6 properties", y=375)}
""", c, css=GCSS)
labels.append("3  Properties of Water  |  1 bond → 6 properties  |  art: H bond hub")

names = [f"apbio3-{i}" for i in (1, 2, 3)]
render(designs, OUT)
sheet(OUT, names, labels, OUT + "/sheet.png")
print("ok")
