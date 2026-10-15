"""Round 3: 3 thumbnails for 'Introduction to Limits (AP Calculus AB 1.1 to 1.2)'.
Every art is the whole idea of a limit in one picture: a curve, a hole at x = a, arrows closing in from BOTH sides,
and the notation lim f(x) = L tied to the same graph (a on the x axis, L on the y axis)."""
import math, sys
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, render, sheet, page3, pill3, title3, scope

c = COURSE["calc"]
A, D, M = c["accent"], c["deep"], c["mid"]
OUT = "/home/claude/lp/thumbs/calc3"
YEL = "#FFD23F"
SVG = '<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">'
MATH = "font-family:'Liberation Serif',serif;font-weight:700"
CSS = """.m{font-family:'Liberation Serif',serif;font-weight:700;white-space:nowrap}
.arw{font-family:'DejaVu Sans',sans-serif;font-weight:700}"""
PILL = pill3(c, "AP CALC · UNIT 1")
TITLE = title3([("Intro to", "w"), ("Limits", "a")], c, y=150, size=104)
GLOW = """<defs><filter id=glow x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter></defs>"""
BG = (f"<div class=abs style='inset:0;background:radial-gradient(circle at 74% 48%,{M} 0%,#2a0b18 50%,{D} 100%)'></div>"
      f"<div class=abs style='inset:0;background:repeating-linear-gradient(90deg,{A}0f 0 2px,transparent 2px 64px),"
      f"repeating-linear-gradient(0deg,{A}0f 0 2px,transparent 2px 64px)'></div>")


# ---------- drawing helpers ----------
class Plot:
    def __init__(s, l, t, w, h, xr, yr):
        s.l, s.t, s.w, s.h, s.xr, s.yr = l, t, w, h, xr, yr

    def P(s, x, y):
        return (s.l + (x - s.xr[0]) / (s.xr[1] - s.xr[0]) * s.w,
                s.t + s.h - (y - s.yr[0]) / (s.yr[1] - s.yr[0]) * s.h)

    def pts(s, f, x0, x1, n=80):
        return [s.P(x0 + (x1 - x0) * i / n, f(x0 + (x1 - x0) * i / n)) for i in range(n + 1)]


def poly(pts, col, w, op=1):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polyline points="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}"/>'


def head(p1, p2, col, size=34, outline=None, ow=6):
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    bx, by = p2[0] - size * math.cos(ang), p2[1] - size * math.sin(ang)
    px, py = -math.sin(ang), math.cos(ang)
    hw = size * .6
    tri = f"{p2[0]:.1f},{p2[1]:.1f} {bx + px * hw:.1f},{by + py * hw:.1f} {bx - px * hw:.1f},{by - py * hw:.1f}"
    o = f'<polygon points="{tri}" fill="{outline}" stroke="{outline}" stroke-width="{ow * 2}" stroke-linejoin="round"/>' if outline else ""
    return o + f'<polygon points="{tri}" fill="{col}" stroke="{col}" stroke-width="3" stroke-linejoin="round"/>'


def curve_arrow(pl, f, x0, x1, col, w=18, size=48, outline=D, ow=7, glow=True):
    """Thick arrow riding along the curve from x0 to x1 (the tip ends at x1)."""
    p = pl.pts(f, x0, x1, 60)
    tip, prev = p[-1], p[-4]
    ang = math.atan2(tip[1] - prev[1], tip[0] - prev[0])
    shaft = p[:-1] + [(tip[0] - size * .7 * math.cos(ang), tip[1] - size * .7 * math.sin(ang))]
    halo = f'<g filter="url(#glow)" opacity=".75">{poly(shaft, col, w + 10)}{head(prev, tip, col, size + 8)}</g>' if glow else ""
    out = poly(shaft, outline, w + 2 * ow) + head(prev, tip, outline, size, outline, ow) if outline else ""
    return f'{halo}{out}{poly(shaft, col, w)}{head(prev, tip, col, size)}'


def hole(x, y, r=20, ring="#fff", sw=8, fill=None):
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r + sw / 2 + 5}" fill="{D}"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill or D}" stroke="{ring}" stroke-width="{sw}"/>')


def mtext(x, y, t, size=56, col="#fff", anchor="middle", sw=10, italic=True):
    st = "font-style:italic;" if italic else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{anchor}" '
            f'style="{MATH};{st}paint-order:stroke fill" stroke="{D}" stroke-width="{sw}" stroke-linejoin="round" fill="{col}">{t}</text>')


def axes(pl, col="#ffffff", w=6, op=.85, arrow=18):
    l, t, r, b = pl.l, pl.t, pl.l + pl.w, pl.t + pl.h
    ox, oy = pl.P(0, 0)
    ox = max(l, ox); oy = min(b, oy)
    return (f'<g opacity="{op}"><path d="M{ox:.1f},{b + 6:.1f} L{ox:.1f},{t - 4:.1f} M{l - 6:.1f},{oy:.1f} L{r + 4:.1f},{oy:.1f}" stroke="{col}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<polygon points="{ox:.1f},{t - arrow - 6:.1f} {ox - arrow * .6:.1f},{t:.1f} {ox + arrow * .6:.1f},{t:.1f}" fill="{col}"/>'
            f'<polygon points="{r + arrow + 6:.1f},{oy:.1f} {r:.1f},{oy - arrow * .6:.1f} {r:.1f},{oy + arrow * .6:.1f}" fill="{col}"/></g>')


def lim_html(x, y, size, col, sub="a", rhs="L", rhs_col=None, sub_col=None, fx="<i>f</i>(<i>x</i>)", w=None, center=False):
    """lim with 'x -> a' stacked under it, then f(x) = L, set in HTML math type."""
    sc = sub_col or col
    rc = rhs_col or col
    wd = f"width:{w}px;justify-content:center;" if center else ""
    return (f'<div class="abs m" style="left:{x}px;top:{y}px;{wd}display:flex;align-items:flex-start;color:{col}">'
            f'<div style="display:flex;flex-direction:column;align-items:center;margin-right:{size * .16:.0f}px">'
            f'<div style="font-size:{size}px;line-height:1">lim</div>'
            f'<div style="font-size:{size * .4:.0f}px;line-height:1;margin-top:{size * .02:.0f}px;color:{sc}"><i>x</i>'
            f'<span class=arw style="font-size:{size * .34:.0f}px;margin:0 {size * .04:.0f}px">&#8594;</span>{sub}</div></div>'
            f'<div style="font-size:{size}px;line-height:1">{fx}&nbsp;=&nbsp;<span style="color:{rc}">{rhs}</span></div></div>')


def f_demo(x):
    """Smooth demo curve. Hole at x = 3 where the curve would be 2, so the limit is L = 2 there."""
    u = x - 3
    return 2 + 0.75 * u - 0.09 * u ** 3


designs, labels = {}, []

# =====================================================================================================
# 1. THE CLASSIC PICTURE: one big graph with the hole, both arrows closing in, dashed guides to a and L, and the
#    notation set right above it with a and L colored to match the graph labels.
pl = Plot(760, 232, 440, 360, (0, 6.2), (-0.3, 4.6))
hx, hy = pl.P(3, 2)
ox, oy = pl.P(0, 0)
curve = pl.pts(f_demo, 0.25, 6.0)
designs["calc3-1"] = page3(f"""
{BG}
<div class=abs style="left:{hx - 300:.0f}px;top:{hy - 300:.0f}px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,{A}55 0%,transparent 65%)"></div>
{SVG}{GLOW}
{axes(pl)}
<path d="M{hx:.1f},{hy + 34:.1f} L{hx:.1f},{oy:.1f}" stroke="#fff" stroke-width="5" stroke-dasharray="14 12" opacity=".75"/>
<path d="M{hx - 34:.1f},{hy:.1f} L{ox:.1f},{hy:.1f}" stroke="{YEL}" stroke-width="5" stroke-dasharray="14 12" opacity=".9"/>
{poly([p for p in curve if p[0] < hx - 26], '#fff', 9, .5)}{poly([p for p in curve if p[0] > hx + 26], '#fff', 9, .5)}
{curve_arrow(pl, f_demo, 0.8, 2.6, A)}
{curve_arrow(pl, f_demo, 5.4, 3.4, A)}
{hole(hx, hy, 22, '#fff', 9)}
{mtext(hx, oy + 60, 'a', 58)}
{mtext(ox - 22, hy + 20, 'L', 58, YEL, anchor='end')}
</svg>
{lim_html(735, 40, 92, '#fff', sub='<i>a</i>', rhs='<i>L</i>', rhs_col=YEL)}
{PILL}{TITLE}
{scope("what f(x) is heading toward", y=392)}
""", c, CSS)
labels.append("1  Intro to Limits  |  what f(x) is heading toward  |  graph + notation")

# =====================================================================================================
# 2. NOTATION PANEL: a flat rose panel, the notation huge in dark ink, and the same idea drawn underneath in ink:
#    the curve with its hole and two arrows closing in. The panel carries the whole definition at a glance.
pp = Plot(680, 360, 520, 250, (0, 6.2), (-0.3, 4.6))
px_, py_ = pp.P(3, 2)
pox, poy = pp.P(0, 0)
pc = pp.pts(f_demo, 0.25, 6.0)
INK = D
designs["calc3-2"] = page3(f"""
<div class=abs style="inset:0;background:{D}"></div>
<div class=abs style="left:610px;top:-40px;width:900px;height:800px;background:{A};transform:skewX(-8deg);transform-origin:0 0"></div>
<div class=abs style="left:610px;top:-40px;width:900px;height:800px;transform:skewX(-8deg);transform-origin:0 0;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.25) 0%,transparent 60%)"></div>
{lim_html(610, 92, 116, INK, sub='<i>a</i>', rhs='<i>L</i>', rhs_col='#fff', w=680, center=True)}
{SVG}
<g opacity=".9">{axes(pp, INK, 6, 1, 16)}</g>
<path d="M{px_:.1f},{py_ + 26:.1f} L{px_:.1f},{poy:.1f}" stroke="{INK}" stroke-width="4" stroke-dasharray="11 9" opacity=".7"/>
<path d="M{px_ - 26:.1f},{py_:.1f} L{pox:.1f},{py_:.1f}" stroke="#fff" stroke-width="4" stroke-dasharray="11 9"/>
{poly([p for p in pc if p[0] < px_ - 20], INK, 8, .35)}{poly([p for p in pc if p[0] > px_ + 20], INK, 8, .35)}
{curve_arrow(pp, f_demo, 0.8, 2.6, INK, 17, 44, outline=None, glow=False)}
{curve_arrow(pp, f_demo, 5.4, 3.4, INK, 17, 44, outline=None, glow=False)}
<circle cx="{px_:.1f}" cy="{py_:.1f}" r="17" fill="{A}" stroke="{INK}" stroke-width="7"/>
<text x="{px_:.1f}" y="{poy + 46:.1f}" font-size="44" text-anchor="middle" style="{MATH};font-style:italic" fill="{INK}">a</text>
<text x="{pox - 16:.1f}" y="{py_ + 15:.1f}" font-size="44" text-anchor="end" style="{MATH};font-style:italic;paint-order:stroke fill" stroke="{INK}" stroke-width="7" fill="#fff">L</text>
</svg>
{PILL}{TITLE}
{scope("where f(x) is heading", y=392)}
""", c, CSS)
labels.append("2  Intro to Limits  |  where f(x) is heading  |  notation panel")

# =====================================================================================================
# 3. A REAL EXAMPLE: f(x) = (x^3 - 8)/(x - 2), which equals x^2 + 2x + 4 except at x = 2, where it is 0/0 (a hole).
#    Graph, hole at (2, 12), arrows from both sides with computed values, and lim x->2 f(x) = 12: graph, table and
#    notation of the whole video in one picture.
def g(x):
    return x * x + 2 * x + 4

# values shown on the tags (exact): f(1.99) = 11.9401, f(2.01) = 12.0601
assert abs((1.99 ** 3 - 8) / (1.99 - 2) - 11.9401) < 1e-9 and abs((2.01 ** 3 - 8) / (2.01 - 2) - 12.0601) < 1e-9
gp = Plot(700, 200, 490, 380, (-1.0, 3.5), (0, 22))
gx, gy = gp.P(2, 12)
gox, goy = gp.P(0, 0)
gc = gp.pts(g, 0, 3.5)
tagL = gp.P(2, 12); tagR = gp.P(2, 12)
def vals(x, y):
    """Mini table card: values closing in on x = 2 from both sides (exact values)."""
    rows = [("1.99", "11.9401"), ("2.01", "12.0601")]
    w, rh = 196, 46
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{rh * 2 + 52}" rx="14" fill="{D}" stroke="{A}" stroke-width="4" opacity=".96"/>'
    out += (f'<text x="{x + 54}" y="{y + 38}" font-size="32" text-anchor="middle" style="{MATH};font-style:italic" fill="{A}">x</text>'
            f'<text x="{x + 138}" y="{y + 38}" font-size="32" text-anchor="middle" style="{MATH};font-style:italic" fill="{A}">f(x)</text>'
            f'<path d="M{x + 10},{y + 50} H{x + w - 10}" stroke="{A}" stroke-width="3"/>')
    for i, (a_, b_) in enumerate(rows):
        yy = y + 50 + rh * (i + 1) - 12
        out += (f'<text x="{x + 54}" y="{yy}" font-family="I" font-weight="800" font-size="26" text-anchor="middle" fill="#fff">{a_}</text>'
                f'<text x="{x + 138}" y="{yy}" font-family="I" font-weight="800" font-size="26" text-anchor="middle" fill="{YEL}">{b_}</text>')
    return out


def tag(x, y, txt, col, anchor):
    w = 250
    lx = x - w if anchor == "end" else x
    return (f'<rect x="{lx:.1f}" y="{y - 40:.1f}" width="{w}" height="56" rx="14" fill="{D}" stroke="{col}" stroke-width="4"/>'
            f'<text x="{lx + w / 2:.1f}" y="{y - 1:.1f}" font-family="I" font-weight="800" font-size="27" text-anchor="middle" fill="#fff">{txt}</text>')
designs["calc3-3"] = page3(f"""
{BG}
<div class=abs style="left:{gx - 300:.0f}px;top:{gy - 300:.0f}px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,{A}55 0%,transparent 65%)"></div>
{SVG}{GLOW}
{axes(gp)}
<path d="M{gx:.1f},{gy + 32:.1f} L{gx:.1f},{goy:.1f}" stroke="#fff" stroke-width="5" stroke-dasharray="14 12" opacity=".75"/>
<path d="M{gx - 32:.1f},{gy:.1f} L{gox:.1f},{gy:.1f}" stroke="{YEL}" stroke-width="5" stroke-dasharray="14 12" opacity=".9"/>
{poly([p for p in gc if p[0] < gx - 24], '#fff', 9, .5)}{poly([p for p in gc if p[0] > gx + 24], '#fff', 9, .5)}
{curve_arrow(gp, g, 0.2, 1.84, A)}
{curve_arrow(gp, g, 3.3, 2.14, A)}
{hole(gx, gy, 21, '#fff', 9)}
{vals(1052, 412)}
{mtext(gx, goy + 58, '2', 56, '#fff', italic=False)}
{mtext(gox - 20, gy + 19, '12', 54, YEL, anchor='end', italic=False)}
</svg>
{lim_html(770, 40, 86, '#fff', sub='2', rhs='12', rhs_col=YEL)}
{PILL}{TITLE}
{scope("graphs, tables, notation", y=392)}
""", c, CSS)
labels.append("3  Intro to Limits  |  graphs, tables, notation  |  worked example")

render(designs, OUT)
sheet(OUT, list(designs), labels, OUT + "/sheet.png")
print("ok")
