"""Orgo 02: Atomic orbitals. Visual compose for engine_long (v2 standard).
Calm navy background throughout (pure explaining video, no story scenes). Our own soft shaded SVG orbitals
(gradient lobes, two phase colors: teal = plus, lilac = minus) so every part can move on its spoken word.
Tools: RDKit 3D methane (chem.mol3d, hook only, shape matters), handwriting (c.hw / W) for every worked line,
real sounds (pen, page) plus interface sounds.
"""
import sys, math, random
sys.path.insert(0, "/home/claude/lp"); sys.path.insert(0, "/home/claude/lp/long")
import o02_script as S
import chem
from engine_long import TEAL, GOLD, CORAL, INK, GREEN, VIOLET, WHITE
from n01_spec import W, L, P, card, chip, hideall, chapter_span, qcheck, problem
from a01_spec import txt, arrow, tick_box, tick

OUT = f"/home/claude/lp/out/{S.ID}"
LIL = "#b7a6ff"; LILD = "#7a64d8"; TEALD = "#139c94"; DIM = "#4d6488"; ECOL = "#7fe8ff"; ORGO = "#9C8FE0"

GRAD = f'''<defs>
<radialGradient id="gNuc2" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffd0c4"/><stop offset="1" stop-color="#c2465a"/></radialGradient>
<radialGradient id="gS" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#7ff5ea" stop-opacity=".85"/><stop offset=".7" stop-color="#2ec9bd" stop-opacity=".55"/><stop offset="1" stop-color="#139c94" stop-opacity=".35"/></radialGradient>
<radialGradient id="gSL" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#e0d8ff" stop-opacity=".85"/><stop offset=".7" stop-color="#a08cf0" stop-opacity=".6"/><stop offset="1" stop-color="#6a54c8" stop-opacity=".4"/></radialGradient>
<radialGradient id="gS2" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#7ff5ea" stop-opacity=".45"/><stop offset=".8" stop-color="#2ec9bd" stop-opacity=".45"/><stop offset="1" stop-color="#139c94" stop-opacity=".3"/></radialGradient>
<radialGradient id="gPA" cx="70%" cy="40%" r="75%"><stop offset="0" stop-color="#9ffaf1"/><stop offset=".6" stop-color="#2ec9bd"/><stop offset="1" stop-color="#0f7d77"/></radialGradient>
<radialGradient id="gPB" cx="70%" cy="40%" r="75%"><stop offset="0" stop-color="#e6deff"/><stop offset=".6" stop-color="#a08cf0"/><stop offset="1" stop-color="#5a44b8"/></radialGradient>
<radialGradient id="gGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{GOLD}" stop-opacity=".85"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
<radialGradient id="gCloud2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7ff5ea" stop-opacity=".5"/><stop offset=".6" stop-color="#2ec9bd" stop-opacity=".18"/><stop offset="1" stop-color="#2ec9bd" stop-opacity="0"/></radialGradient>
</defs>'''

# ------------------------------------------------------------- art helpers
def nuc(id, x, y, r=16, label=None, op=1):
    t = f'<text x="{x}" y="{y + r*0.38:.0f}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="{r*1.05:.0f}" fill="#fff">{label}</text>' if label else ""
    return f'<g id="{id}" opacity="{op}"><circle cx="{x}" cy="{y}" r="{r}" fill="url(#gNuc2)"/>{t}</g>'

def lobe_d(L_, w):
    a = L_ * 0.18
    return f"M 0 0 C {a:.0f} {-w:.0f} {L_*0.92:.0f} {-w*1.12:.0f} {L_:.0f} 0 C {L_*0.92:.0f} {w*1.12:.0f} {a:.0f} {w:.0f} 0 0 Z"

def p_orb(id, cx, cy, ang, L_=260, w=105, ga="gPA", gb="gPB", op=0, fl=1.0):
    """p orbital: two lobes along angle ang (deg). fl < 1 foreshortens (for the z axis). Parts {id}_a (plus), {id}_b (minus)."""
    return (f'<g id="{id}" opacity="{op}"><g transform="translate({cx} {cy}) rotate({ang})">'
            f'<path id="{id}_a" d="{lobe_d(L_*fl, w)}" fill="url(#{ga})" stroke="#c9fff9" stroke-opacity=".5" stroke-width="2" opacity=".92"/>'
            f'<path id="{id}_b" d="{lobe_d(L_*fl, w)}" transform="rotate(180)" fill="url(#{gb})" stroke="#efeaff" stroke-opacity=".5" stroke-width="2" opacity=".92"/>'
            f'</g></g>')

def clover(id, cx, cy, L_=80, w=36, op=0):
    p = [f'<g id="{id}" opacity="{op}"><g transform="translate({cx} {cy})">']
    for i, a in enumerate((45, 135, 225, 315)):
        p.append(f'<path d="{lobe_d(L_, w)}" transform="rotate({a})" fill="url(#{"gPA" if i % 2 == 0 else "gPB"})" opacity=".9"/>')
    p.append(f'<circle r="5" fill="url(#gNuc2)"/></g></g>')
    return "".join(p)

def forb(id, cx, cy, L_=70, w=24, op=0):
    p = [f'<g id="{id}" opacity="{op}"><g transform="translate({cx} {cy})">']
    for i in range(6):
        p.append(f'<path d="{lobe_d(L_, w)}" transform="rotate({i*60+30})" fill="url(#{"gPA" if i % 2 == 0 else "gPB"})" opacity=".9"/>')
    p.append(f'<circle r="5" fill="url(#gNuc2)"/></g></g>')
    return "".join(p)

def spin(id, x, y, up=True, color=WHITE, op=0, h=30, sw=6):
    if up: d = f"M {x} {y+h} L {x} {y-h} M {x-13} {y-h+15} L {x} {y-h} L {x+13} {y-h+15}"
    else:  d = f"M {x} {y-h} L {x} {y+h} M {x-13} {y+h-15} L {x} {y+h} L {x+13} {y+h-15}"
    return f'<path id="{id}" d="{d}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}"/>'

def box(id, x, y, label=None, s=92, op=0, color=INK, lsize=34):
    lab = f'<text x="{x}" y="{y + s/2 + 42:.0f}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="{lsize}" fill="{INK}">{label}</text>' if label else ""
    return f'<g id="{id}" opacity="{op}"><rect x="{x - s/2:.0f}" y="{y - s/2:.0f}" width="{s}" height="{s}" rx="10" fill="rgba(8,20,40,.75)" stroke="{color}" stroke-width="4"/>{lab}</g>'

def boxes(pre, x, y, labels, s=92, gap=0, op=0, label_each=True, group_label=None):
    """row of touching boxes. returns svg and list of centers"""
    out, cs = [], []
    for i, lb in enumerate(labels):
        cx = x + i * (s + gap); cs.append(cx)
        out.append(box(f"{pre}{i}", cx, y, lb if label_each else None, s, op))
    if group_label:
        mid = (cs[0] + cs[-1]) / 2
        out.append(f'<text id="{pre}gl" x="{mid}" y="{y + s/2 + 42:.0f}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="34" fill="{INK}" opacity="{op}">{group_label}</text>')
    return "".join(out), cs

def ap(c, id, t, snd="tick", g=0.35):
    c.fade_in(f"#{id}", t, d=0.25, y=-14); c.sound(snd, t, g)

def show_box(c, pre, n, t, step=0.12, gl=False):
    for i in range(n): c.fade_in(f"#{pre}{i}", t + i * step, d=0.3, y=10)
    if gl: c.fade_in(f"#{pre}gl", t, d=0.3, y=10)
    c.sound("pop", t, 0.3)

def wave_path(x0, x1, y, amp, per, ph=0):
    pts = []
    n = 120
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        pts.append(f"{x:.1f} {y - amp*math.sin(2*math.pi*(x - x0)/per + ph):.1f}")
    return "M " + " L ".join(pts)

def dots_cloud(pre, cx, cy, n, scale, seed=5, groups=10, r=4.2, color=ECOL):
    """1s-like dot picture: 3D points with radial density r^2 e^(-2r), projected onto the screen."""
    R = random.Random(seed); out = [f'<g id="{pre}">']
    gs = [[] for _ in range(groups)]
    for i in range(n):
        while True:
            rr = R.gammavariate(3, 0.5)
            if rr < 4.2: break
        u = R.uniform(-1, 1); th = R.uniform(0, 2 * math.pi); sq = math.sqrt(1 - u * u)
        x, y = rr * sq * math.cos(th), rr * sq * math.sin(th)
        gs[i % groups].append(f'<circle cx="{cx + x*scale:.1f}" cy="{cy + y*scale:.1f}" r="{r}" fill="{color}"/>')
    for k, g in enumerate(gs):
        out.append(f'<g id="{pre}_{k}" opacity="0">' + "".join(g) + '</g>')
    out.append("</g>")
    return "".join(out)

def methane2d(id, cx, cy, s=1.0, op=0, label=True, angle=False):
    """CH4 drawn with wedge and dash (tetrahedral perspective). Parts {id}_b0..3 bonds."""
    hs = [(0, -150), (-140, 60), (90, 95), (150, 20)]
    p = [f'<g id="{id}" opacity="{op}"><g transform="translate({cx} {cy}) scale({s})">']
    p.append(f'<line id="{id}_b0" x1="0" y1="0" x2="0" y2="-150" stroke="#dfe7f2" stroke-width="12" stroke-linecap="round"/>')
    p.append(f'<line id="{id}_b1" x1="0" y1="0" x2="-140" y2="60" stroke="#dfe7f2" stroke-width="12" stroke-linecap="round"/>')
    p.append(f'<path id="{id}_b2" d="M 0 0 L 82 104 L 100 88 Z" fill="#dfe7f2"/>')
    p.append(f'<g id="{id}_b3">' + "".join(f'<line x1="{150*k/7:.0f}" y1="{20*k/7-4-k*1.3:.0f}" x2="{150*k/7:.0f}" y2="{20*k/7+4+k*1.3:.0f}" stroke="#dfe7f2" stroke-width="6"/>' for k in range(1, 7)) + '</g>')
    for i, (x, y) in enumerate(hs):
        p.append(f'<circle cx="{x}" cy="{y}" r="34" fill="#f4f6fb"/><text x="{x}" y="{y+13}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="36" fill="#3a4658">H</text>')
    p.append('<circle cx="0" cy="0" r="46" fill="#3b3f48" stroke="#8a8f99" stroke-width="3"/><text x="0" y="16" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="#fff">C</text>')
    if angle:
        p.append(f'<path id="{id}_ang" d="M 0 -78 A 78 78 0 0 0 -72 31" fill="none" stroke="{GOLD}" stroke-width="6" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>')
    p.append('</g></g>')
    return "".join(p)

def lewis(id, cx, cy, center, arms, lps, op=0, s=1.0, col=WHITE):
    """simple Lewis drawing: center atom, arms = list of (angle, label), lps = list of angles for lone pairs. parts {id}_arm{i}, {id}_lp{i}"""
    p = [f'<g id="{id}" opacity="{op}"><g transform="translate({cx} {cy}) scale({s})">']
    for i, (a, lb) in enumerate(arms):
        r = math.radians(a); x2, y2 = 150 * math.cos(r), 150 * math.sin(r)
        p.append(f'<g id="{id}_arm{i}"><line x1="{50*math.cos(r):.0f}" y1="{50*math.sin(r):.0f}" x2="{x2-38*math.cos(r):.0f}" y2="{y2-38*math.sin(r):.0f}" stroke="#dfe7f2" stroke-width="10" stroke-linecap="round"/>'
                 f'<text x="{x2:.0f}" y="{y2+16:.0f}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="48" fill="{col}">{lb}</text></g>')
    for i, a in enumerate(lps):
        r = math.radians(a); bx, by = 72 * math.cos(r), 72 * math.sin(r); nx, ny = -math.sin(r) * 10, math.cos(r) * 10
        p.append(f'<g id="{id}_lp{i}"><circle cx="{bx+nx:.0f}" cy="{by+ny:.0f}" r="9" fill="{GOLD}"/><circle cx="{bx-nx:.0f}" cy="{by-ny:.0f}" r="9" fill="{GOLD}"/></g>')
    p.append(f'<text x="0" y="20" text-anchor="middle" font-family="Inter" font-weight="900" font-size="60" fill="{col}">{center}</text></g></g>')
    return "".join(p)

def cross(id, x1, y1, x2, y2, t, c, color=CORAL):
    c.draw(f"#{id}", t, d=0.35); c.sound("wrong", t, 0.35)
    return f'<path id="{id}" d="M {x1} {y1} L {x2} {y2}" stroke="{color}" stroke-width="9" stroke-linecap="round" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>'

def gid(c, id, cid):
    t0, t1 = chapter_span(c, cid)
    c.scene(f"#{id}", t0 - 0.3, t1)
    return t0, t1

def flash(c, t):
    c.g(f'tl.fromTo("#flash",{{opacity:0.55}},{{opacity:0,duration:0.35,immediateRender:false}},{t:.2f});'); c.sound("tick", t, 0.5)

# ------------------------------------------------------------- 0 intro
def intro(c):
    T, C = c.T, c.C
    t0, t1 = 0, chapter_span(c, "what")[0] - 2.2
    s = ['<g id="g_in"><g id="in_left" transform="translate(40 -130) scale(1.25)">']
    c.hide("#g_in", t1 - 0.3)
    # hook: carbon tile, 4 valence electrons -> 4 bonds
    s.append(f'<g id="in_tile"><rect x="150" y="250" width="260" height="290" rx="26" fill="rgba(8,20,40,.8)" stroke="{ORGO}" stroke-width="6"/>'
             f'<text x="280" y="300" text-anchor="middle" font-family="Inter" font-weight="800" font-size="34" fill="{INK}">6</text>'
             f'<text x="280" y="450" text-anchor="middle" font-family="Inter" font-weight="900" font-size="170" fill="#fff">C</text>'
             f'<text x="280" y="510" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="{INK}">carbon</text></g>')
    c.fade_in("#in_tile", 0.05, d=0.3, y=0, scale=0.9)
    for i in range(4):
        a = math.radians(-40 + i * 26.7)
        s.append(f'<circle id="in_v{i}" cx="{280 + 190*math.cos(a):.0f}" cy="{395 + 190*math.sin(a):.0f}" r="15" fill="{GOLD}" opacity="0"/>')
        c.pop(f"#in_v{i}", 0.6 + i * 0.25); c.sound("pop", 0.6 + i * 0.25, 0.3)
    s.append(W(c, "in_h1", 150, 640, "4 valence e⁻ → 4 bonds", 0.5, 50, GOLD))
    # {1}: look closer: orbital boxes say 2
    bx, cs = boxes("in_bx", 230, 820, ["2s", "2p", "2p", "2p"], s=86, op=0, label_each=False)
    s.append(bx)
    s.append(f'<text id="in_bl0" x="230" y="905" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="{INK}" opacity="0">2s</text>'
             f'<text id="in_bl1" x="{cs[2]}" y="905" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="{INK}" opacity="0">2p</text>')
    t = C["hook"][1]
    show_box(c, "in_bx", 4, t); c.fade_in("#in_bl0", t, y=0); c.fade_in("#in_bl1", t, y=0)
    s.append(spin("in_s0", cs[0] - 16, 820, True) + spin("in_s1", cs[0] + 16, 820, False) + spin("in_s2", cs[1], 820, True, GOLD) + spin("in_s3", cs[2], 820, True, GOLD))
    for i in range(4): ap(c, f"in_s{i}", t + 0.6 + i * 0.25)
    s.append(W(c, "in_h2", 560, 835, '<tspan fill="#ff6b6b">only 2 bonds?</tspan>', t + 1.8, 52))
    s.append('</g>')
    c.pulse("#in_s2", t + 1.8, t + 3.0, 1.15, 0.5); c.pulse("#in_s3", t + 1.9, t + 3.1, 1.15, 0.5)
    # {2}{3}: methane in 3D
    s.append(f'<g id="in_3d" opacity="0">' + chem.mol3d("C", OUT, "in3", x=1060, y=120, w=820, h=740, start=C["hook"][2], turns=1.0, dur=8.0, zoom=2.6, in_svg=True) + '</g>')
    c.fade_in("#in_3d", C["hook"][2] - 0.2, y=0); c.show("#in3", C["hook"][2] - 0.2, 0.4); c.sound("whoosh", C["hook"][2], 0.4)
    s.append(W(c, "in_m1", 1520, 900, "methane (CH₄): 4 bonds", C["hook"][2] + 0.3, 52, WHITE, anchor="middle"))
    s.append(W(c, "in_m2", 1520, 980, "tetrahedron", C["hook"][3] + 1.4, 48, TEAL, anchor="middle"))
    # small wire tetrahedron icon
    s.append(P(c, "in_tet", "M 1700 170 L 1640 290 L 1780 300 Z M 1700 170 L 1780 300 M 1700 170 L 1700 330 L 1640 290 M 1700 330 L 1780 300", C["hook"][3] + 1.2, TEAL, 4, 1.0))
    # {4}: orbitals
    hideall(c, ["#in_tile"] + [f"#in_v{i}" for i in range(4)] + ["#in_h1", "#in_h2", "#in_bl0", "#in_bl1"] + [f"#in_bx{i}" for i in range(4)] + [f"#in_s{i}" for i in range(4)], C["hook"][4] - 0.3)
    s.append(W(c, "in_orb", 560, 560, "orbitals", C["hook"][4] + 0.2, 150, TEAL, anchor="middle"))
    c.sound("shimmer", C["hook"][4] + 0.2, 0.45)
    s.append(P(c, "in_orbu", "M 330 600 L 790 600", C["hook"][4] + 1.0, GOLD, 8, 0.5))
    hideall(c, ["#in_3d", "#in3", "#in_m1", "#in_m2", "#in_tet", "#in_orb", "#in_orbu"], T["promise"] - 0.2)
    # promise
    tp = T["promise"]
    s.append(W(c, "pr_cfg", 960, 330, "1s² 2s² 2p⁶ 3s² 3p⁶ 4s²", tp + 0.3, 76, WHITE, anchor="middle"))
    s.append(L(c, "pr_up", 960, 410, "any atom up to calcium", tp + 1.2, 34, INK))
    bx, cs = boxes("pr_bx", 820, 600, ["", "", ""], s=96, op=0, label_each=False); s.append(bx)
    s.append(L(c, "pr_bl", 916, 700, "box by box", C["promise"][1] + 0.4, 34, INK))
    show_box(c, "pr_bx", 3, C["promise"][1])
    for i, (u, j) in enumerate(((True, 0), (True, 1), (True, 2), (False, 0))):
        s.append(spin(f"pr_s{i}", cs[j] + (-16 if (i == 0) else (16 if i == 3 else 0)), 600, u))
        ap(c, f"pr_s{i}", C["promise"][1] + 0.4 + i * 0.3)
    s.append(chip("pr_c", 960, 880, "C: stuck at 2 bonds?", CORAL, 46)); c.pop("#pr_c", C["promise"][2]); c.sound("pop", C["promise"][2], 0.4)
    hideall(c, ["#pr_cfg", "#pr_up", "#pr_bl", "#pr_c"] + [f"#pr_bx{i}" for i in range(3)] + [f"#pr_s{i}" for i in range(4)], T["why"] - 0.2)
    # why
    tw = T["why"]
    s.append(f'<g id="wy_math" opacity="0"><text x="300" y="380" font-family="Kalam" font-weight="700" font-size="64" fill="{DIM}">Ĥψ = Eψ</text>'
             f'<text x="1180" y="330" font-family="Kalam" font-weight="700" font-size="54" fill="{DIM}">∇²ψ + (8π²m/h²)(E − V)ψ = 0</text>'
             f'<text x="420" y="880" font-family="Kalam" font-weight="700" font-size="56" fill="{DIM}">|ψ|² dV</text></g>')
    c.fade_in("#wy_math", tw + 0.2, y=0)
    s.append(cross("wy_x1", 280, 280, 1640, 920, C["why"][1], c))
    c.hide("#wy_math", C["why"][2] - 0.4); c.hide("#wy_x1", C["why"][2] - 0.4)
    s.append(f'<g id="wy_orb" opacity="0"><circle cx="960" cy="560" r="230" fill="url(#gS)"/><circle cx="960" cy="560" r="230" fill="none" stroke="#c9fff9" stroke-width="3" stroke-dasharray="12 10"/></g>')
    s.append(nuc("wy_n", 960, 560, 18))
    c.fade_in("#wy_orb", C["why"][2], y=0, scale=0.6); c.fade_in("#wy_n", C["why"][2], y=0); c.sound("shimmer", C["why"][2], 0.35)
    s.append(spin("wy_s0", 1060, 470, True, GOLD, 0, 34, 7) + spin("wy_s1", 1100, 470, False, GOLD, 0, 34, 7))
    ap(c, "wy_s0", C["why"][2] + 2.4); ap(c, "wy_s1", C["why"][2] + 2.7)
    s.append(W(c, "wy_l1", 1250, 520, "orbital = where an", C["why"][2] + 0.6, 48, WHITE))
    s.append(W(c, "wy_l2", 1250, 590, "electron is likely to be", C["why"][2] + 1.3, 48, WHITE))
    s.append(W(c, "wy_l3", 1250, 680, "holds 2", C["why"][2] + 2.4, 56, GOLD))
    c.pulse("#wy_orb", C["why"][3], C["why"][3] + 2.4, 1.04, 0.8)
    hideall(c, ["#wy_orb", "#wy_n", "#wy_s0", "#wy_s1", "#wy_l1", "#wy_l2", "#wy_l3"], T["need"] - 0.2)
    # need: shells from video 1
    tn = T["need"]; cx, cy = 760, 570
    s.append(f'<g id="nd_at" opacity="0"><circle cx="{cx}" cy="{cy}" r="120" fill="none" stroke="{INK}" stroke-width="3" stroke-dasharray="10 9"/>'
             f'<circle cx="{cx}" cy="{cy}" r="250" fill="none" stroke="{INK}" stroke-width="3" stroke-dasharray="10 9"/></g>')
    s.append(nuc("nd_n", cx, cy, 34, "C"))
    c.fade_in("#nd_at", tn + 0.2, y=0, scale=0.8); c.fade_in("#nd_n", tn + 0.2, y=0)
    s.append('<g id="nd_k" opacity="0">' + "".join(f'<circle cx="{cx + 120*math.cos(a):.0f}" cy="{cy + 120*math.sin(a):.0f}" r="14" fill="{ECOL}"/>' for a in (math.pi * 0.2, math.pi * 1.2)) + '</g>')
    s.append('<g id="nd_v" opacity="0">' + "".join(f'<circle cx="{cx + 250*math.cos(a):.0f}" cy="{cy + 250*math.sin(a):.0f}" r="15" fill="{GOLD}"/>' for a in (0.3, 1.9, 3.5, 5.0)) + '</g>')
    c.fade_in("#nd_k", C["need"][1], y=0); c.sound("pop", C["need"][1], 0.3)
    s.append(L(c, "nd_kl", 1180, 420, "K holds 2", C["need"][1] + 0.2, 48, ECOL, anchor="start"))
    s.append(L(c, "nd_ll", 1180, 500, "L holds 8", C["need"][1] + 1.6, 48, INK, anchor="start"))
    c.fade_in("#nd_v", C["need"][2], y=0); c.pulse("#nd_v", C["need"][2] + 0.3, C["need"][2] + 2.3, 1.08, 0.5)
    s.append(L(c, "nd_vl", 1180, 600, "valence: they bond", C["need"][2] + 0.2, 48, GOLD, anchor="start"))
    s.append(W(c, "nd_q", 1180, 760, "why 2? why 8?", C["need"][3] + 0.2, 72, GOLD))
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 1 what an orbital is
def what(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_wh", "what")
    s = ['<g id="g_wh" opacity="0">']
    cx, cy = 960, 570
    s.append(nuc("wh_n", cx, cy, 20)); c.pop("#wh_n", C["o1a"][1]); c.sound("pop", C["o1a"][1], 0.3)
    s.append(L(c, "wh_nl", cx + 40, cy - 30, "1 proton", C["o1a"][1] + 0.2, 32, CORAL, anchor="start"))
    s.append(L(c, "wh_h", cx, 200, "hydrogen", T["o1a"] + 0.2, 52, WHITE))
    # wrong picture: orbit track with a circling electron
    s.append(f'<g id="wh_orbit" opacity="0"><circle cx="{cx}" cy="{cy}" r="200" fill="none" stroke="{INK}" stroke-width="4"/>'
             f'<g id="wh_orbe"><circle cx="{cx + 200}" cy="{cy}" r="16" fill="{ECOL}"/></g></g>')
    c.fade_in("#wh_orbit", C["o1a"][1] + 0.5, y=0)
    c.g(f'tl.fromTo("#wh_orbe",{{rotation:0}},{{rotation:720,svgOrigin:"{cx} {cy}",duration:4.5,ease:"none",immediateRender:false}},{C["o1a"][1]+0.5:.2f});')
    s.append(cross("wh_x", cx - 230, cy - 230, cx + 230, cy + 230, C["o1a"][2] + 2.4, c))
    s.append(L(c, "wh_nt", cx, 920, "not a track", C["o1a"][2] + 2.5, 44, CORAL))
    hideall(c, ["#wh_orbit", "#wh_x", "#wh_nt", "#wh_nl"], C["o1a"][3] - 0.3)
    s.append('<rect id="flash" x="-200" y="-200" width="2320" height="1480" fill="#fff" opacity="0"/>')
    snaps = [(cx + 70, cy - 40), (cx - 110, cy + 60), (cx + 30, cy + 140)]
    for i, (x, y) in enumerate(snaps):
        s.append(f'<circle id="wh_e{i}" cx="{x}" cy="{y}" r="9" fill="{ECOL}" opacity="0"/>')
        t = C["o1a"][3 + i]; flash(c, t); c.fade_in(f"#wh_e{i}", t + 0.05, d=0.15, y=0)
    s.append(L(c, "wh_sn", 1500, 300, "snapshot", C["o1a"][3] + 0.2, 40, INK))
    c.hide("#wh_sn", T["o1b"])
    # o1b: thousands of dots
    s.append(dots_cloud("wh_cl", cx, cy, 2200, 105, 5, 12))
    for k in range(12):
        tk = C["o1b"][1] + k * (C["o1b"][2] - C["o1b"][1] + 1.5) / 12
        c.fade_in(f"#wh_cl_{k}", tk, d=0.35, y=0)
    for i in range(3): c.hide(f"#wh_e{i}", C["o1b"][2] + 1.0)
    c.sound("shimmer", C["o1b"][1], 0.3)
    s.append(L(c, "wh_thick", cx - 820, cy - 20, "thick near the nucleus", C["o1b"][2] + 0.2, 36, WHITE, anchor="start"))
    s.append(arrow("wh_ta", cx - 400, cy - 10, cx - 60, cy, WHITE, 5, "ahw")); c.draw("#wh_ta", C["o1b"][2] + 0.4, d=0.4)
    s.append(L(c, "wh_thin", cx + 560, cy + 330, "thinner farther out", C["o1b"][3], 36, INK))
    s.append(W(c, "wh_lk", cx, 200 + 0, "likely, not exact", C["o1b"][4] + 0.3, 58, GOLD, anchor="middle"))
    c.hide("#wh_h", C["o1b"][4])
    hideall(c, ["#wh_thick", "#wh_ta", "#wh_thin"], T["o1c"] - 0.2)
    # o1c: boundary, orbital, 1s
    c.hide("#wh_lk", T["o1c"])
    s.append(L(c, "wh_ne", cx, 190, "the cloud never ends, so pick a cutoff", T["o1c"] + 0.3, 38, INK))
    s.append(f'<circle id="wh_b" cx="{cx}" cy="{cy}" r="290" fill="none" stroke="{GOLD}" stroke-width="5" stroke-dasharray="14 10" opacity="0"/>')
    c.fade_in("#wh_b", C["o1c"][1], y=0, scale=0.5); c.sound("swish", C["o1c"][1], 0.35)
    s.append(chip("wh_90", cx + 320, cy - 250, "90%", GOLD, 44)); c.pop("#wh_90", C["o1c"][1] + 1.2)
    c.hide("#wh_ne", C["o1c"][2])
    s.append(f'<circle id="wh_sph" cx="{cx}" cy="{cy}" r="290" fill="url(#gS)" opacity="0"/>')
    c.to("#wh_sph", C["o1c"][2], "opacity:0.75", 0.8)
    s.append(W(c, "wh_or", cx, 190, "orbital: a cloud of chances", C["o1c"][2] + 0.2, 56, TEAL, anchor="middle"))
    # move the picture left for the name
    c.g(f'tl.to("#wh_n, #wh_cl, #wh_b, #wh_sph, #wh_90",{{x:-420,duration:0.9,ease:"power2.inOut"}},{C["o1c"][3]-0.4:.2f});')
    s.append(W(c, "wh_1s", 1340, 560, "1s", C["o1c"][3] + 0.2, 200, WHITE, anchor="middle"))
    s.append(P(c, "wh_a1", "M 1280 600 L 1230 740", C["o1c"][4], ECOL, 5, 0.4, "aht"))
    s.append(W(c, "wh_l1", 1100, 800, "shell: n = 1 (K)", C["o1c"][4] + 0.3, 46, ECOL))
    s.append(P(c, "wh_a2", "M 1420 600 L 1520 740", C["o1c"][5], GOLD, 5, 0.4))
    s.append(W(c, "wh_l2", 1470, 880, "shape: round", C["o1c"][5] + 0.3, 46, GOLD))
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 2 Pauli
def pauli(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_pa", "pauli")
    s = ['<g id="g_pa" opacity="0">']
    cx, cy = 560, 560
    s.append(f'<circle id="pa_sph" cx="{cx}" cy="{cy}" r="240" fill="url(#gS)" opacity="0"/>'); c.fade_in("#pa_sph", t0, y=0, scale=0.8)
    s.append(nuc("pa_n", cx, cy, 30, "He", 0)); c.fade_in("#pa_n", t0, y=0)
    s.append(L(c, "pa_t", cx, 240, "helium: 2 electrons", T["o2a"] + 0.1, 46, WHITE))
    s.append(f'<circle id="pa_e1" cx="{cx - 90}" cy="{cy - 60}" r="14" fill="{ECOL}" opacity="0"/><circle id="pa_e2" cx="{cx + 80}" cy="{cy + 90}" r="14" fill="{ECOL}" opacity="0"/>')
    c.pop("#pa_e1", C["o2a"][1]); c.pop("#pa_e2", C["o2a"][1] + 0.3); c.sound("pop", C["o2a"][1], 0.3)
    s.append(box("pa_b", 1300, 560, "1s", 130)); c.fade_in("#pa_b", C["o2a"][1] + 0.2, y=10)
    s.append(L(c, "pa_spin", 1300, 300, "spin", C["o2a"][2] + 0.3, 56, GOLD))
    # magnets
    for i, (x, up) in enumerate(((1140, True), (1460, False))):
        rot = 0 if up else 180
        s.append(f'<g id="pa_mg{i}" opacity="0"><g transform="translate({x} 400) rotate({rot}) scale(1.6)"><rect x="-18" y="-50" width="36" height="50" rx="6" fill="#ff6b6b"/><rect x="-18" y="0" width="36" height="50" rx="6" fill="#5aa9ff"/>'
                 f'<text x="0" y="-16" text-anchor="middle" font-family="Inter" font-weight="900" font-size="24" fill="#fff" transform="rotate({-rot} 0 -25)">N</text></g></g>')
        c.fade_in(f"#pa_mg{i}", C["o2a"][3] + i * 0.4, y=0); c.sound("pop", C["o2a"][3] + i * 0.4, 0.25)
    s.append(L(c, "pa_ud", 1300, 480, "up or down", C["o2a"][3] + 0.6, 34, INK))
    c.hide("#pa_ud", C["o2a"][4] - 0.2)
    s.append(spin("pa_u", 1270, 560, True, WHITE, 0, 40, 8) + spin("pa_d", 1330, 560, False, WHITE, 0, 40, 8))
    ap(c, "pa_u", C["o2a"][4] + 0.2); ap(c, "pa_d", C["o2a"][4] + 0.9)
    hideall(c, ["#pa_mg0", "#pa_mg1", "#pa_spin", "#pa_e1", "#pa_e2"], T["o2b"] - 0.2)
    # o2b lithium
    c.hide("#pa_t", T["o2b"] - 0.2)
    s.append(L(c, "pa_li", cx, 240, "lithium: 3 electrons", T["o2b"] + 0.1, 46, WHITE))
    s.append(nuc("pa_nli", cx, cy, 30, "Li", 0)); c.hide("#pa_n", T["o2b"]); c.show("#pa_nli", T["o2b"])
    s.append(spin("pa_3", 1300, 330, True, GOLD, 0, 40, 8)); ap(c, "pa_3", C["o2b"][1] - 0.6)
    c.g(f'tl.to("#pa_3",{{y:150,duration:0.4,ease:"power2.in"}},{C["o2b"][1]:.2f});tl.to("#pa_3",{{y:20,duration:0.5,ease:"back.out(2)"}},{C["o2b"][1]+0.4:.2f});')
    c.sound("wrong", C["o2b"][1] + 0.4, 0.4)
    s.append(W(c, "pa_pp", 960, 860, "Pauli exclusion principle", C["o2b"][2] + 0.1, 60, GOLD, anchor="middle"))
    s.append(L(c, "pa_r1", 960, 950, "same orbital + same spin: never", C["o2b"][3] + 0.1, 40, WHITE))
    c.hide("#pa_r1", C["o2b"][4] - 0.2)
    s.append(L(c, "pa_r2", 960, 950, "max 2 per orbital: one ↑, one ↓", C["o2b"][4] + 0.1, 40, WHITE))
    c.pulse("#pa_u", C["o2b"][4] + 0.4, C["o2b"][4] + 1.6, 1.15, 0.6); c.pulse("#pa_d", C["o2b"][4] + 0.7, C["o2b"][4] + 1.9, 1.15, 0.6)
    s.append(L(c, "pa_sh1", 1300, 730, "shell 1: only this one orbital", C["o2b"][5] + 0.1, 38, INK))
    s.append(box("pa_b2", 1560, 560, "2s", 130)); c.fade_in("#pa_b2", C["o2b"][5] + 1.2, y=10)
    c.g(f'tl.to("#pa_3",{{x:260,y:230,duration:0.8,ease:"power2.inOut"}},{C["o2b"][5]+1.8:.2f});'); c.sound("swish", C["o2b"][5] + 1.8, 0.3)
    end = T["k1q"] - 0.2
    hideall(c, ["#pa_sph", "#pa_nli", "#pa_li", "#pa_b", "#pa_b2", "#pa_u", "#pa_d", "#pa_3", "#pa_pp", "#pa_r2", "#pa_sh1"], end)
    s.append(qcheck(c, "q1", "k1q", ["Could an orbital ever hold 3 electrons?"]))
    s.append(W(c, "q1a1", 320, 560, '<tspan fill="#3fe07a">never</tspan>', T["k1a"] + 0.1, 64))
    s.append(W(c, "q1a2", 320, 650, "only 2 spins → max 2 electrons", C["k1a"][1] + 0.1, 48))
    c.sound("ding", T["k1a"] + 0.1, 0.35)
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 3 shapes
def shapes(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_sh", "shapes")
    s = ['<g id="g_sh" opacity="0">']
    # o3a: wave with nodes
    wp = wave_path(260, 1660, 330, 80, 560)
    s.append(P(c, "sh_w", wp, C["o3a"][1], TEAL, 6, 1.6))
    s.append(f'<line id="sh_wl" x1="240" y1="330" x2="1680" y2="330" stroke="{DIM}" stroke-width="3" opacity="0"/>'); c.fade_in("#sh_wl", C["o3a"][1], y=0)
    for i, x in enumerate((540, 820, 1100, 1380)):
        s.append(f'<circle id="sh_nd{i}" cx="{x}" cy="330" r="13" fill="{GOLD}" opacity="0"/>'); c.pop(f"#sh_nd{i}", C["o3a"][1] + 2.6 + i * 0.2)
    c.sound("pop", C["o3a"][1] + 2.6, 0.3)
    s.append(L(c, "sh_ndl", 960, 470, "nodes: the wave is zero", C["o3a"][1] + 2.8, 42, GOLD))
    hideall(c, ["#sh_w", "#sh_wl", "#sh_ndl"] + [f"#sh_nd{i}" for i in range(4)], C["o3a"][2] - 0.3)
    s.append(f'<g id="sh_1s" opacity="0"><circle cx="560" cy="600" r="130" fill="url(#gS)"/></g>' + nuc("sh_1n", 560, 600, 12, None, 0))
    s.append(L(c, "sh_1l", 560, 820, "1s", C["o3a"][2] - 0.1, 56, WHITE))
    c.fade_in("#sh_1s", C["o3a"][2] - 0.1, y=0); c.fade_in("#sh_1n", C["o3a"][2] - 0.1, y=0)
    s.append(f'<g id="sh_2s" opacity="0"><circle cx="1260" cy="600" r="260" fill="url(#gS2)"/>'
             f'<circle id="sh_2in" cx="1260" cy="600" r="85" fill="url(#gS)" opacity=".9"/>'
             f'<circle id="sh_2nd" cx="1260" cy="600" r="112" fill="none" stroke="{GOLD}" stroke-width="5" stroke-dasharray="12 9" opacity="0"/></g>' + nuc("sh_2n", 1260, 600, 12, None, 0))
    c.fade_in("#sh_2s", C["o3a"][2] + 0.4, y=0, scale=0.5); c.fade_in("#sh_2n", C["o3a"][2] + 0.4, y=0); c.sound("swish", C["o3a"][2] + 0.4, 0.3)
    s.append(L(c, "sh_2l", 1260, 940, "2s: bigger", C["o3a"][2] + 0.6, 56, WHITE))
    c.to("#sh_2nd", C["o3a"][3], "opacity:1", 0.4); c.pulse("#sh_2nd", C["o3a"][3] + 0.3, C["o3a"][3] + 2.0, 1.06, 0.5)
    s.append(L(c, "sh_2ndl", 1260, 260, "node inside", C["o3a"][3] + 0.1, 44, GOLD))
    s.append(P(c, "sh_2na", "M 1260 285 L 1260 470", C["o3a"][3] + 0.2, GOLD, 5, 0.4))
    s.append(L(c, "sh_wall", 1260, 200, "not a wall: the wave is just 0 there", C["o3a"][4] + 0.1, 36, INK))
    hideall(c, ["#sh_1s", "#sh_1n", "#sh_1l", "#sh_2s", "#sh_2n", "#sh_2l", "#sh_2ndl", "#sh_2na", "#sh_wall"], T["o3b"] - 0.2)
    # o3b: one p orbital
    cx, cy = 960, 590
    s.append(L(c, "sh_pt", 960, 200, "the p orbital", T["o3b"] + 0.2, 52, WHITE))
    s.append(P(c, "sh_xax", f"M 300 {cy} L 1640 {cy}", C["o3b"][1] - 0.2, INK, 3, 0.6, "ahw"))
    s.append(L(c, "sh_xl", 1660, cy + 50, "x", C["o3b"][1], 40, INK))
    s.append(p_orb("sh_p", cx, cy, 0, 330, 140)); c.fade_in("#sh_p", C["o3b"][1], y=0, scale=0.3); c.sound("whoosh", C["o3b"][1], 0.35)
    s.append(nuc("sh_pn", cx, cy, 13, None, 0)); c.fade_in("#sh_pn", C["o3b"][1], y=0)
    s.append(L(c, "sh_db", 960, 900, "a dumbbell", C["o3b"][2] + 0.1, 46, INK))
    c.hide("#sh_db", C["o3b"][3] - 0.2)
    s.append(f'<path id="sh_np" d="M {cx-70} {cy-260} L {cx+70} {cy-190} L {cx+70} {cy+260} L {cx-70} {cy+190} Z" fill="{GOLD}" fill-opacity=".18" stroke="{GOLD}" stroke-width="4" stroke-dasharray="12 9" opacity="0"/>')
    c.fade_in("#sh_np", C["o3b"][3], y=0); c.sound("swish", C["o3b"][3], 0.3)
    s.append(L(c, "sh_npl", cx + 120, cy - 280, "nodal plane: never here", C["o3b"][3] + 0.3, 40, GOLD, anchor="start"))
    s.append(P(c, "sh_br", f"M {cx-330} {cy+235} Q {cx-330} {cy+275} {cx-200} {cy+275} L {cx+200} {cy+275} Q {cx+330} {cy+275} {cx+330} {cy+235}", C["o3b"][4], WHITE, 5, 0.7))
    s.append(W(c, "sh_one", cx - 80, cy + 360, "ONE orbital", C["o3b"][4] + 0.4, 64, WHITE, anchor="middle"))
    c.pulse("#sh_p", C["o3b"][4] + 0.2, C["o3b"][4] + 2.2, 1.04, 0.5)
    s.append(spin("sh_pu", cx + 170, cy + 340, True, GOLD, 0, 30, 7) + spin("sh_pd", cx + 205, cy + 340, False, GOLD, 0, 30, 7))
    ap(c, "sh_pu", C["o3b"][5] + 0.3); ap(c, "sh_pd", C["o3b"][5] + 0.7)
    s.append(L(c, "sh_h2", cx + 240, cy + 356, "holds 2", C["o3b"][5] + 0.4, 44, GOLD, anchor="start"))
    hideall(c, ["#sh_pt", "#sh_xax", "#sh_xl", "#sh_p", "#sh_pn", "#sh_np", "#sh_npl", "#sh_br", "#sh_one", "#sh_pu", "#sh_pd", "#sh_h2"], T["o3c"] - 0.2)
    # o3c: three p orbitals on axes (z oblique)
    ox, oy = 900, 560
    s.append(f'<g id="sh_axes" opacity="0"><line x1="{ox-420}" y1="{oy}" x2="{ox+420}" y2="{oy}" stroke="{INK}" stroke-width="3"/>'
             f'<line x1="{ox}" y1="{oy+370}" x2="{ox}" y2="{oy-370}" stroke="{INK}" stroke-width="3"/>'
             f'<line x1="{ox+230}" y1="{oy-190}" x2="{ox-230}" y2="{oy+190}" stroke="{INK}" stroke-width="3" stroke-dasharray="10 8"/>'
             f'<text x="{ox+440}" y="{oy+14}" font-family="Inter" font-weight="800" font-size="40" fill="{INK}">x</text>'
             f'<text x="{ox+14}" y="{oy-380}" font-family="Inter" font-weight="800" font-size="40" fill="{INK}">y</text>'
             f'<text x="{ox-280}" y="{oy+230}" font-family="Inter" font-weight="800" font-size="40" fill="{INK}">z</text></g>')
    c.fade_in("#sh_axes", T["o3c"], y=0)
    s.append(p_orb("sh_px", ox, oy, 0, 300, 110)); c.fade_in("#sh_px", C["o3c"][1], y=0, scale=0.3); c.sound("whoosh", C["o3c"][1], 0.3)
    s.append(p_orb("sh_py", ox, oy, -90, 300, 110)); c.fade_in("#sh_py", C["o3c"][2], y=0, scale=0.3); c.sound("whoosh", C["o3c"][2], 0.3)
    s.append(p_orb("sh_pz", ox, oy, 140, 300, 120, fl=0.65)); c.fade_in("#sh_pz", C["o3c"][3], y=0, scale=0.3); c.sound("whoosh", C["o3c"][3], 0.3)
    s.append(nuc("sh_on", ox, oy, 12, None, 0)); c.fade_in("#sh_on", C["o3c"][1], y=0)
    s.append(L(c, "sh_lx", ox + 330, oy + 70, "2px", C["o3c"][1] + 0.2, 48, TEAL, anchor="start"))
    s.append(L(c, "sh_ly", ox - 50, oy - 320, "2py", C["o3c"][2] + 0.2, 48, TEAL, anchor="end"))
    s.append(L(c, "sh_lz", ox - 330, oy + 300, "2pz (toward you)", C["o3c"][3] + 0.2, 48, TEAL, anchor="middle"))
    s.append(P(c, "sh_ang", f"M {ox+380} {oy} A 380 380 0 0 0 {ox} {oy-380}", C["o3c"][4], GOLD, 6, 0.6))
    s.append(L(c, "sh_90", ox + 285, oy - 285, "90°", C["o3c"][4] + 0.2, 44, GOLD, anchor="start"))
    # degenerate: three equal boxes on one energy line
    s.append(f'<line id="sh_el" x1="1460" y1="830" x2="1840" y2="830" stroke="{INK}" stroke-width="3" opacity="0"/>'); c.fade_in("#sh_el", C["o3c"][5], y=0)
    bx, cs = boxes("sh_db", 1550, 760, ["", "", ""], s=86, label_each=False); s.append(bx); show_box(c, "sh_db", 3, C["o3c"][5])
    s.append(W(c, "sh_deg", 1650, 920, "degenerate", C["o3c"][5] + 2.6, 52, GOLD, anchor="middle"))
    s.append(L(c, "sh_deg2", 1650, 980, "same energy", C["o3c"][5] + 1.0, 38, INK))
    hideall(c, ["#sh_lx", "#sh_ly", "#sh_lz", "#sh_el", "#sh_deg", "#sh_deg2", "#sh_ang", "#sh_90"] + [f"#sh_db{i}" for i in range(3)], T["o3d"] - 0.2)
    # o3d: the 90 vs 109.5 puzzle
    c.g(f'tl.to("#sh_axes, #sh_px, #sh_py, #sh_pz, #sh_on",{{x:-420,scale:0.62,transformOrigin:"{ox}px {oy}px",duration:0.8}},{T["o3d"]:.2f});')
    s.append(L(c, "sh_q90", 480, 950, "bonds 90° apart?", C["o3d"][1], 48, CORAL))
    s.append(methane2d("sh_me", 1330, 560, 1.4, 0, angle=True)); c.fade_in("#sh_me", C["o3d"][1] + 1.2, y=0, scale=0.8)
    c.draw("#sh_me_ang", C["o3d"][2], d=0.5)
    s.append(W(c, "sh_109", 1330, 950, "methane: 109.5°", C["o3d"][2] + 0.2, 64, GOLD, anchor="middle"))
    s.append(chip("sh_clue", 960, 200, "a big clue: next video", GOLD, 40)); c.pop("#sh_clue", C["o3d"][3]); c.sound("pop", C["o3d"][3], 0.35)
    hideall(c, ["#sh_axes", "#sh_px", "#sh_py", "#sh_pz", "#sh_on", "#sh_q90", "#sh_me", "#sh_109", "#sh_clue"], T["o3e"] - 0.2)
    # o3e: which shapes in which shell
    rows = [("shell 1", "s"), ("shell 2", "s  p"), ("shell 3", "s  p  d (5)"), ("shell 4", "s  p  d  f (7)")]
    keys = [C["o3e"][1], C["o3e"][1] + 1.2, C["o3e"][2], C["o3e"][3]]
    for i, ((a, b), t) in enumerate(zip(rows, keys)):
        y = 300 + i * 150
        s.append(L(c, f"sh_r{i}a", 360, y, a, t, 46, INK, anchor="start"))
        s.append(W(c, f"sh_r{i}b", 620, y, b, t + 0.2, 56, WHITE))
    s.append(clover("sh_d", 1450, 600, 110, 48)); c.fade_in("#sh_d", C["o3e"][2] + 0.3, y=0, scale=0.5); c.sound("pop", C["o3e"][2] + 0.3, 0.3)
    s.append(L(c, "sh_dl", 1450, 790, "a d orbital: four leaf clover", C["o3e"][2] + 0.5, 38, INK))
    s.append(forb("sh_f", 1450, 600, 110, 36)); c.hide("#sh_d", C["o3e"][3] - 0.1); c.hide("#sh_dl", C["o3e"][3] - 0.1)
    c.fade_in("#sh_f", C["o3e"][3] + 0.1, y=0, scale=0.5)
    s.append(L(c, "sh_fl", 1450, 790, "an f orbital", C["o3e"][3] + 0.3, 38, INK))
    s.append(f'<rect id="sh_hl" x="604" y="240" width="112" height="530" rx="20" fill="none" stroke="{GOLD}" stroke-width="5" opacity="0"/>')
    c.fade_in("#sh_hl", C["o3e"][4], y=0); c.sound("swish", C["o3e"][4], 0.3)
    s.append(L(c, "sh_oc", 680, 860, "organic chemistry: s and p", C["o3e"][4] + 0.2, 44, GOLD))
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 4 counting
def count(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_co", "count")
    s = ['<g id="g_co" opacity="0">']
    s.append(L(c, "co_t", 960, 200, "why 2 and 8?", T["o4a"] + 0.2, 54, GOLD))
    s.append(L(c, "co_s1", 330, 400, "shell 1", C["o4a"][1], 46, INK, anchor="start"))
    s.append(box("co_b1", 640, 390, "1s")); c.fade_in("#co_b1", C["o4a"][1] + 0.2, y=10)
    s.append(W(c, "co_r1", 1000, 410, "1 orbital × 2 = 2", C["o4a"][1] + 0.8, 56, WHITE))
    s.append(L(c, "co_s2", 330, 640, "shell 2", C["o4a"][2], 46, INK, anchor="start"))
    bx, cs = boxes("co_b2", 640, 630, ["2s", "", "2p", ""], s=92, gap=8, label_each=True); s.append(bx); show_box(c, "co_b2", 4, C["o4a"][2] + 0.2)
    s.append(W(c, "co_r2", 1100, 650, "4 × 2 = 8", C["o4a"][3], 64, WHITE))
    s.append(W(c, "co_r3", 960, 900, "K: 2 · L: 8  ✓", C["o4a"][4] + 0.2, 60, GREEN, anchor="middle")); c.sound("ding", C["o4a"][4] + 0.2, 0.35)
    hideall(c, ["#co_t", "#co_s1", "#co_b1", "#co_r1", "#co_r2", "#co_r3"], T["o4b"] - 0.2)
    # o4b octet: fill 8 arrows into shell 2 boxes
    c.g(f'tl.to("#co_s2, [id^=co_b2]",{{y:-140,duration:0.6}},{T["o4b"]:.2f});')
    s.append(W(c, "co_oct", 960, 220, "the octet rule", T["o4b"] + 0.2, 64, GOLD, anchor="middle"))
    for i, el in enumerate(("C", "N", "O", "F")):
        s.append(chip(f"co_el{i}", 700 + i * 170, 330, el, ORGO, 44, w=110)); c.pop(f"#co_el{i}", C["o4b"][1] + i * 0.2)
    c.sound("pop", C["o4b"][1], 0.3)
    k = 0
    for j, x in enumerate(cs):
        for up in (True, False):
            s.append(spin(f"co_e{k}", x + (-16 if up else 16), 490, up, GOLD))
            ap(c, f"co_e{k}", C["o4b"][1] + 1.2 + k * 0.22, "tick", 0.25); k += 1
    s.append(L(c, "co_8", 1240, 500, "8, full", C["o4b"][1] + 3.2, 44, GREEN, anchor="start"))
    # energy ladder: ninth electron must go far up
    s.append(f'<g id="co_lad" opacity="0"><line x1="560" y1="900" x2="1240" y2="900" stroke="{INK}" stroke-width="4"/><line x1="560" y1="700" x2="1240" y2="700" stroke="{CORAL}" stroke-width="4" stroke-dasharray="12 9"/>'
             f'<text x="1260" y="912" font-family="Inter" font-weight="800" font-size="34" fill="{INK}">shell 2</text><text x="1260" y="712" font-family="Inter" font-weight="800" font-size="34" fill="{CORAL}">higher shell</text>'
             f'<path d="M 470 940 L 470 620" stroke="{INK}" stroke-width="4" marker-end="url(#ahw)"/><text x="440" y="780" transform="rotate(-90 440 780)" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="{INK}">energy</text></g>')
    c.g(f'tl.to("#co_lad",{{opacity:1,duration:0.4}},{C["o4b"][2]-0.3:.2f});')
    s.append(spin("co_9", 900, 880, True, CORAL, 0, 26, 6)); ap(c, "co_9", C["o4b"][2])
    c.g(f'tl.to("#co_9",{{y:-180,duration:1.0,ease:"power2.inOut"}},{C["o4b"][2]+0.5:.2f});'); c.sound("riser", C["o4b"][2] + 0.3, 0.3)
    s.append(L(c, "co_far", 900, 790, "farther out, way higher energy", C["o4b"][2] + 1.3, 36, CORAL))
    hideall(c, ["#co_lad", "#co_9", "#co_far"], C["o4b"][3] - 0.2)
    s.append(W(c, "co_low", 960, 840, "full shell 2 = low energy", C["o4b"][3] + 0.1, 64, GREEN, anchor="middle"))
    s.append(L(c, "co_sg", 960, 920, "so atoms share or gain electrons to get there", C["o4b"][3] + 1.6, 36, INK))
    end = T["k2q"] - 0.2
    hideall(c, ["#co_s2", "#co_oct", "#co_8", "#co_low", "#co_sg"] + [f"#co_el{i}" for i in range(4)] + [f"#co_e{i}" for i in range(8)] + [f"#co_b2{i}" for i in range(4)], end)
    s.append(qcheck(c, "q2", "k2q", ["Three p orbitals in one shell.", "How many electrons can the whole set hold?"]))
    s.append(W(c, "q2a1", 320, 640, "3 orbitals × 2 = " + '<tspan fill="#3fe07a">6</tspan>', C["k2a"][1] - 0.6, 60)); c.sound("ding", C["k2a"][1], 0.35)
    s.append(W(c, "q2a2", 320, 740, '<tspan fill="#ff6b6b">trap: 2</tspan> (that is one p orbital)', C["k2a"][2] + 0.1, 44))
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 5 phase
def h_atom(id, x, y, grad="gS", r=150, op=0):
    return f'<g id="{id}" opacity="{op}"><circle cx="{x}" cy="{y}" r="{r}" fill="url(#{grad})"/><circle cx="{x}" cy="{y}" r="13" fill="url(#gNuc2)"/></g>'

def phase(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_ph", "phase")
    s = ['<g id="g_ph" opacity="0">']
    cx, cy = 960, 470
    s.append(p_orb("ph_p", cx, cy, 0, 300, 125)); c.fade_in("#ph_p", t0, y=0, scale=0.8)
    s.append(nuc("ph_n", cx, cy, 12));
    c.pulse("#ph_p_a", T["o5a"] + 0.5, T["o5a"] + 2.2, 1.05, 0.5); c.pulse("#ph_p_b", T["o5a"] + 0.8, T["o5a"] + 2.5, 1.05, 0.5)
    # wave below
    s.append(f'<line id="ph_wl" x1="560" y1="880" x2="1360" y2="880" stroke="{DIM}" stroke-width="3" opacity="0"/>'); c.fade_in("#ph_wl", C["o5a"][1], y=0)
    s.append(P(c, "ph_w", wave_path(560, 1360, 880, 70, 800, math.pi), C["o5a"][1], WHITE, 5, 1.2))
    s.append(L(c, "ph_wp", 1180, 790, "+", C["o5a"][1] + 2.0, 60, TEAL)); s.append(L(c, "ph_wm", 740, 990, "−", C["o5a"][1] + 2.4, 60, LIL))
    s.append(L(c, "ph_lp", cx + 190, cy + 18, "+", C["o5a"][2], 80, "#063a37")); s.append(L(c, "ph_lm", cx - 190, cy + 18, "−", C["o5a"][2] + 0.2, 80, "#2b1d6e"))
    s.append(W(c, "ph_ph", cx, 200, "phase = the sign of the wave", C["o5a"][2] + 0.3, 56, WHITE, anchor="middle"))
    s.append(f'<line id="ph_np" x1="{cx}" y1="{cy-230}" x2="{cx}" y2="{cy+230}" stroke="{GOLD}" stroke-width="6" stroke-dasharray="14 10" opacity="0"/>')
    c.to("#ph_np", C["o5a"][3], "opacity:1", 0.3); c.pulse("#ph_np", C["o5a"][3], C["o5a"][3] + 1.8, 1.03, 0.5)
    s.append(L(c, "ph_fl", cx, cy + 290, "sign flips here, so the wave is 0", C["o5a"][3] + 0.2, 38, GOLD))
    c.hide("#ph_fl", C["o5a"][4] - 0.2)
    s.append(chip("ph_nc", cx, cy + 270, "NOT charges", CORAL, 50)); c.pop("#ph_nc", C["o5a"][4]); c.sound("wrong", C["o5a"][4], 0.3)
    hideall(c, ["#ph_p", "#ph_n", "#ph_wl", "#ph_w", "#ph_wp", "#ph_wm", "#ph_lp", "#ph_lm", "#ph_ph", "#ph_np", "#ph_nc"], T["o5b"] - 0.2)
    # o5b: same phase -> bond
    y1 = 380
    s.append(L(c, "ph_t1", 200, 200, "same phase", C["o5b"][1], 48, TEAL, anchor="start"))
    s.append(h_atom("ph_a1", 560, y1, "gS", 140)); s.append(h_atom("ph_a2", 1360, y1, "gS", 140))
    c.fade_in("#ph_a1", T["o5b"] + 0.2, y=0); c.fade_in("#ph_a2", T["o5b"] + 0.2, y=0)
    s.append(L(c, "ph_h1", 560, y1 + 168, "H", T["o5b"] + 0.3, 36, INK)); s.append(L(c, "ph_h2", 1360, y1 + 168, "H", T["o5b"] + 0.3, 36, INK))
    c.g(f'tl.to("#ph_a1, #ph_h1",{{x:290,duration:1.2,ease:"power2.inOut"}},{C["o5b"][1]+0.2:.2f});tl.to("#ph_a2, #ph_h2",{{x:-290,duration:1.2,ease:"power2.inOut"}},{C["o5b"][1]+0.2:.2f});')
    c.sound("whoosh", C["o5b"][1] + 0.2, 0.3)
    s.append(f'<ellipse id="ph_glow" cx="960" cy="{y1}" rx="130" ry="110" fill="url(#gGlow)" opacity="0"/>')
    c.to("#ph_glow", C["o5b"][2], "opacity:0.9", 0.5); c.sound("shimmer", C["o5b"][2], 0.3)
    s.append(L(c, "ph_add", 960, y1 - 190, "waves add up", C["o5b"][2] + 0.2, 40, GOLD))
    s.append(f'<g id="ph_pair" opacity="0"><circle cx="945" cy="{y1}" r="13" fill="{ECOL}"/><circle cx="975" cy="{y1}" r="13" fill="{ECOL}"/></g>'); c.pop("#ph_pair", C["o5b"][3])
    s.append(arrow("ph_f1", 850, y1 + 70, 920, y1 + 30, GOLD, 5) + arrow("ph_f2", 1070, y1 + 70, 1000, y1 + 30, GOLD, 5))
    c.draw("#ph_f1", C["o5b"][3] + 0.8, 0.4); c.draw("#ph_f2", C["o5b"][3] + 0.8, 0.4)
    s.append(W(c, "ph_bond", 1180, y1 + 160, "bond ✓", C["o5b"][3] + 2.2, 56, GREEN)); c.sound("ding", C["o5b"][3] + 2.2, 0.3)
    # o5c: opposite phase -> node, antibonding
    y2 = 830
    s.append(L(c, "ph_t2", 200, 620, "opposite phase", T["o5c"] + 0.2, 48, LIL, anchor="start"))
    s.append(h_atom("ph_b1", 560, y2, "gS", 140)); s.append(h_atom("ph_b2", 1360, y2, "gSL", 140))
    c.fade_in("#ph_b1", T["o5c"] + 0.2, y=0); c.fade_in("#ph_b2", T["o5c"] + 0.2, y=0)
    c.g(f'tl.to("#ph_b1",{{x:270,duration:1.1,ease:"power2.inOut"}},{T["o5c"]+0.6:.2f});tl.to("#ph_b2",{{x:-270,duration:1.1,ease:"power2.inOut"}},{T["o5c"]+0.6:.2f});')
    s.append(L(c, "ph_can", 960, y2 - 185, "waves cancel", C["o5c"][1] + 0.1, 40, CORAL))
    s.append(f'<line id="ph_node" x1="960" y1="{y2-150}" x2="960" y2="{y2+150}" stroke="{GOLD}" stroke-width="7" stroke-dasharray="14 10" opacity="0"/>')
    c.to("#ph_node", C["o5c"][2], "opacity:1", 0.3); c.sound("pop", C["o5c"][2], 0.3)
    s.append(L(c, "ph_nl", 1010, y2 + 200, "node", C["o5c"][2] + 0.1, 40, GOLD, anchor="start"))
    s.append(f'<g id="ph_ex" opacity="0"><g id="ph_ex1"><circle cx="760" cy="{y2}" r="13" fill="{ECOL}"/></g><g id="ph_ex2"><circle cx="1160" cy="{y2}" r="13" fill="{ECOL}"/></g></g>')
    c.fade_in("#ph_ex", C["o5c"][3], y=0)
    c.g(f'tl.fromTo("#ph_ex1",{{x:180}},{{x:-60,duration:0.9,ease:"power2.out",immediateRender:false}},{C["o5c"][3]:.2f});tl.fromTo("#ph_ex2",{{x:-180}},{{x:60,duration:0.9,ease:"power2.out",immediateRender:false}},{C["o5c"][3]:.2f});')
    s.append(W(c, "ph_anti", 1270, y2 + 15, "antibonding: no bond", C["o5c"][4] + 0.1, 52, "#ff9a9a")); c.sound("wrong", C["o5c"][4], 0.3)
    c.hide("#ph_nl", C["o5c"][4])
    s.append(chip("ph_back", 960, 1010, "back later: double bonds", GOLD, 34)); c.pop("#ph_back", C["o5c"][5])
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 6 filling
def ladder(pre, x0, rungs, op=0):
    """rungs: list of (label, y, nboxes). returns svg and dict label -> list of box centers"""
    out, cen = [f'<g id="{pre}" opacity="{op}">'], {}
    out.append(f'<path d="M {x0-60} {max(y for _, y, _ in rungs)+70} L {x0-60} {min(y for _, y, _ in rungs)-80}" stroke="{INK}" stroke-width="4" marker-end="url(#ahw)"/>'
               f'<text x="{x0-90}" y="{(max(y for _, y, _ in rungs)+min(y for _, y, _ in rungs))/2:.0f}" transform="rotate(-90 {x0-90} {(max(y for _, y, _ in rungs)+min(y for _, y, _ in rungs))/2:.0f})" text-anchor="middle" font-family="Inter" font-weight="800" font-size="38" fill="{INK}">energy</text>')
    out.append("</g>")
    for lab, y, n in rungs:
        xs = [x0 + 60 + i * 84 for i in range(n)]
        cen[lab] = (xs, y)
        out.append(f'<g id="{pre}_{lab}" opacity="{op}"><text x="{x0}" y="{y+12}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="36" fill="{WHITE}">{lab}</text>'
                   + "".join(f'<rect x="{x-38}" y="{y-38}" width="76" height="76" rx="9" fill="rgba(8,20,40,.75)" stroke="{INK}" stroke-width="4"/>' for x in xs) + '</g>')
    return "".join(out), cen

def filling(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_fi", "filling")
    s = ['<g id="g_fi" opacity="0">']
    lad, cen = ladder("fi_l", 300, [("1s", 900, 1), ("2s", 700, 1), ("2p", 540, 3)])
    s.append(lad)
    c.fade_in("#fi_l", T["o6a"] + 0.2, y=0)
    for i, lb in enumerate(("1s", "2s", "2p")): c.fade_in(f"#fi_l_{lb}", T["o6a"] + 0.3 + i * 0.25, y=10)
    s.append(W(c, "fi_au", 760, 260, "Aufbau: lowest energy first", C["o6a"][1], 56, GOLD))
    s.append(L(c, "fi_bu", 760, 330, "German: building up", C["o6a"][1] + 1.5, 40, INK, anchor="start"))
    s.append(L(c, "fi_sp", 760, 620, "s lower than p", C["o6a"][2] + 0.1, 40, TEAL, anchor="start"))
    c.pulse("#fi_l_2s", C["o6a"][2], C["o6a"][2] + 1.5, 1.04, 0.5)
    c.hide("#fi_sp", C["o6a"][3] - 0.1)
    s.append(chip("fi_B", 940, 460, "boron: 5 electrons", ORGO, 40)); c.pop("#fi_B", C["o6a"][3]); c.sound("pop", C["o6a"][3], 0.3)
    xs, y = cen["1s"]; s.append(spin("fi_e0", xs[0] - 14, y, True, GOLD) + spin("fi_e1", xs[0] + 14, y, False, GOLD))
    ap(c, "fi_e0", C["o6a"][4]); ap(c, "fi_e1", C["o6a"][4] + 0.35)
    xs, y = cen["2s"]; s.append(spin("fi_e2", xs[0] - 14, y, True, GOLD) + spin("fi_e3", xs[0] + 14, y, False, GOLD))
    ap(c, "fi_e2", C["o6a"][5]); ap(c, "fi_e3", C["o6a"][5] + 0.35)
    xs, y = cen["2p"]; s.append(spin("fi_e4", xs[0], y, True, GOLD)); ap(c, "fi_e4", C["o6a"][6])
    c.hide("#fi_au", T["o6b"] - 0.2); c.hide("#fi_bu", T["o6b"] - 0.2); c.hide("#fi_B", T["o6b"] - 0.2)
    # o6b: configuration notation
    s.append(L(c, "fi_ec", 1200, 230, "electron configuration", T["o6b"] + 0.2, 48, WHITE))
    s.append(W(c, "fi_ex", 1200, 420, "2p¹", C["o6b"][1], 110, WHITE, anchor="middle"))
    s.append(L(c, "fi_exa", 1060, 500, "orbital", C["o6b"][1] + 0.6, 34, TEAL))
    s.append(L(c, "fi_exb", 1330, 340, "electrons in it", C["o6b"][1] + 1.6, 34, GOLD))
    hideall(c, ["#fi_ex", "#fi_exa", "#fi_exb"], C["o6b"][2] - 0.2)
    s.append(W(c, "fi_c1", 900, 420, "1s²", C["o6b"][2], 96, WHITE)); c.sound("pen_scratch_real", C["o6b"][2], 0.25)
    s.append(W(c, "fi_c2", 1090, 420, "2s²", C["o6b"][3], 96, WHITE))
    s.append(W(c, "fi_c3", 1280, 420, "2p¹", C["o6b"][4], 96, WHITE))
    c.pulse("#fi_e0", C["o6b"][2], C["o6b"][2] + 0.8, 1.2, 0.4); c.pulse("#fi_e2", C["o6b"][3], C["o6b"][3] + 0.8, 1.2, 0.4); c.pulse("#fi_e4", C["o6b"][4], C["o6b"][4] + 0.8, 1.2, 0.4)
    s.append(W(c, "fi_sum", 1000, 560, "2 + 2 + 1 = 5 ✓", C["o6b"][5] + 0.2, 64, GREEN)); c.sound("ding", C["o6b"][5] + 1.0, 0.3)
    hideall(c, ["#fi_l"] + [f"#fi_l_{x}" for x in ("1s", "2s", "2p")] + [f"#fi_e{i}" for i in range(5)] + ["#fi_ec", "#fi_c1", "#fi_c2", "#fi_c3", "#fi_sum"], T["o6c"] - 0.2)
    # o6c: penetration graph
    gx0, gy0, gw, gh = 360, 900, 1200, 600
    s.append(f'<g id="fi_ax" opacity="0"><path d="M {gx0} {gy0-gh-30} L {gx0} {gy0} L {gx0+gw+40} {gy0}" fill="none" stroke="{INK}" stroke-width="4"/>'
             f'<text x="{gx0+gw/2}" y="{gy0+60}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="38" fill="{INK}">distance from the nucleus →</text>'
             f'<text x="{gx0-40}" y="{gy0-gh/2}" transform="rotate(-90 {gx0-40} {gy0-gh/2})" text-anchor="middle" font-family="Inter" font-weight="800" font-size="38" fill="{INK}">chance of finding it</text></g>')
    c.fade_in("#fi_ax", T["o6c"] + 0.2, y=0)
    def curve(f, xmax=20.0, sc=1.0):
        pts = []
        for i in range(201):
            r = xmax * i / 200
            pts.append(f"{gx0 + gw * r / xmax:.1f} {gy0 - gh * sc * f(r):.1f}")
        return "M " + " L ".join(pts)
    f1 = lambda r: 4 * r * r * math.exp(-2 * r * 2.2) * 2.2 ** 3 / 1.1
    f2s = lambda r: (r * r * (2 - r) ** 2 * math.exp(-r)) / 8 / 0.55
    f2p = lambda r: (r ** 4 * math.exp(-r)) / 24 / 0.82
    s.append(f'<path id="fi_c1s" d="{curve(f1, 14, 0.9)} L {gx0+gw} {gy0} L {gx0} {gy0} Z" fill="{DIM}" fill-opacity=".55" stroke="{INK}" stroke-width="4" opacity="0"/>')
    c.fade_in("#fi_c1s", C["o6c"][1] - 0.6, y=0)
    s.append(L(c, "fi_1sl", gx0 + 150, gy0 - gh * 0.95, "1s pair (close in)", C["o6c"][1] - 0.4, 38, INK, anchor="start"))
    s.append(L(c, "fi_shl", gx0 + 470, gy0 - gh * 0.8, "shielding", C["o6c"][1] + 2.0, 40, WHITE, anchor="start"))
    s.append(P(c, "fi_c2s", curve(f2s, 14, 0.9), C["o6c"][2], TEAL, 6, 1.4))
    s.append(P(c, "fi_lg1", "M 1320 330 L 1400 330", C["o6c"][2] + 0.3, TEAL, 6, 0.3)); s.append(L(c, "fi_2sl", 1420, 344, "2s", C["o6c"][2] + 0.4, 40, TEAL, anchor="start"))
    s.append(f'<ellipse id="fi_bump" cx="{gx0 + gw*0.62/14:.0f}" cy="{gy0 - 50}" rx="70" ry="60" fill="none" stroke="{GOLD}" stroke-width="5" opacity="0"/>')
    c.to("#fi_bump", C["o6c"][2] + 2.2, "opacity:1", 0.3); c.pulse("#fi_bump", C["o6c"][2] + 2.4, C["o6c"][2] + 4.2, 1.1, 0.5)
    s.append(P(c, "fi_c2p", curve(f2p, 14, 0.9), C["o6c"][3], LIL, 6, 1.4))
    s.append(P(c, "fi_lg2", "M 1320 400 L 1400 400", C["o6c"][3] + 0.3, LIL, 6, 0.3)); s.append(L(c, "fi_2pl", 1420, 414, "2p", C["o6c"][3] + 0.4, 40, LIL, anchor="start"))
    s.append(f'<circle id="fi_zero" cx="{gx0}" cy="{gy0}" r="16" fill="none" stroke="{LIL}" stroke-width="5" opacity="0"/>')
    c.to("#fi_zero", C["o6c"][3] + 1.5, "opacity:1", 0.3)
    s.append(L(c, "fi_zl", gx0 + 30, gy0 + 100, "2p: zero at the nucleus", C["o6c"][3] + 1.6, 38, LIL, anchor="start"))
    s.append(W(c, "fi_pen", 640, 560, "penetration", C["o6c"][4], 52, GOLD)); s.append(P(c, "fi_pena", f"M 650 580 L {gx0+90} {gy0-80}", C["o6c"][4] + 0.3, GOLD, 5, 0.5, "ah"))
    s.append(W(c, "fi_ch", 960, 200, "more penetration → stronger pull → lower energy", C["o6c"][5] + 0.1, 46, GREEN, anchor="middle"))
    hideall(c, ["#fi_ax", "#fi_c1s", "#fi_1sl", "#fi_shl", "#fi_c2s", "#fi_2sl", "#fi_lg1", "#fi_lg2", "#fi_bump", "#fi_c2p", "#fi_2pl", "#fi_zero", "#fi_zl", "#fi_pen", "#fi_pena", "#fi_ch"], T["o6d"] - 0.2)
    # o6d: worked phosphorus
    s.append(chip("fi_P", 960, 210, "phosphorus: 15 electrons", ORGO, 44)); c.pop("#fi_P", T["o6d"] + 0.3); c.sound("page_flip_real", T["o6d"], 0.3)
    parts = [("1s²", 1, "2"), ("2s²", 2, "4"), ("2p⁶", 3, "10"), ("3s²", 4, "12"), ("3p³", 5, "15")]
    for i, (p, n, tot) in enumerate(parts):
        x = 380 + i * 250
        s.append(W(c, f"fi_w{i}", x, 480, p, C["o6d"][n], 96, WHITE))
        s.append(L(c, f"fi_t{i}", x + 70, 590, tot, C["o6d"][n] + 0.5, 40, INK))
    c.sound("pen_scratch_real", C["o6d"][1], 0.25)
    s.append(L(c, "fi_rt", 260, 590, "total:", C["o6d"][1] + 0.5, 34, INK, anchor="start"))
    s.append(W(c, "fi_15", 1520, 720, "= 15 ✓", C["o6d"][6], 72, GREEN, anchor="middle")); c.sound("ding", C["o6d"][6], 0.35)
    hideall(c, ["#fi_P", "#fi_rt", "#fi_15"] + [f"#fi_w{i}" for i in range(5)] + [f"#fi_t{i}" for i in range(5)], T["t1q"] - 0.1)
    s.append(chip("fi_Cl", 960, 300, "your turn: chlorine, 17 electrons", GOLD, 46)); c.pop("#fi_Cl", T["t1q"] + 0.1); c.sound("riser", T["t1q"] - 0.4, 0.3)
    ans = [("1s² 2s² 2p⁶ 3s²", 1), ("3p⁵", 2)]
    s.append(W(c, "fi_a0", 340, 560, "1s² 2s² 2p⁶ 3s²", C["t1a"][1], 96, WHITE)); s.append(L(c, "fi_a0t", 700, 660, "12 so far", C["t1a"][1] + 0.5, 36, INK))
    s.append(W(c, "fi_a1", 1170, 560, "3p⁵", C["t1a"][2], 96, GREEN)); s.append(L(c, "fi_a1t", 1260, 660, "5 left", C["t1a"][2] + 0.3, 36, INK))
    c.sound("ding", C["t1a"][3], 0.35)
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 7 4s vs 3d
def fours(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_fo", "fours")
    s = ['<g id="g_fo" opacity="0">']
    s.append(chip("fo_K", 760, 220, "K = potassium (not the K shell)", CORAL, 42)); c.pop("#fo_K", T["o7a"] + 0.6); c.sound("pop", T["o7a"] + 0.6, 0.3)
    lad, cen = ladder("fo_l", 300, [("3s", 880, 1), ("3p", 720, 3), ("4s", 520, 1), ("3d", 380, 5)])
    s.append(lad)
    c.fade_in("#fo_l", C["o7a"][1], y=0)
    for i, lb in enumerate(("3s", "3p")): c.fade_in(f"#fo_l_{lb}", C["o7a"][1] + i * 0.2, y=10)
    s.append(L(c, "fo_18", 1100, 800, "first 18: just like argon", C["o7a"][1] + 0.4, 40, INK, anchor="start"))
    for lb in ("3s", "3p"):
        xs, y = cen[lb]
        for j, x in enumerate(xs):
            s.append(spin(f"fo_f{lb}{j}u", x - 13, y, True, INK, 0, 26, 5) + spin(f"fo_f{lb}{j}d", x + 13, y, False, INK, 0, 26, 5))
            c.fade_in(f"#fo_f{lb}{j}u", C["o7a"][1] + 0.6, y=0); c.fade_in(f"#fo_f{lb}{j}d", C["o7a"][1] + 0.6, y=0)
    c.fade_in("#fo_l_4s", C["o7a"][2] - 0.4, y=10); c.fade_in("#fo_l_3d", C["o7a"][2] - 0.4, y=10)
    s.append(spin("fo_19", 1250, 560, True, GOLD, 0, 34, 7)); ap(c, "fo_19", C["o7a"][2])
    s.append(L(c, "fo_q", 1320, 575, "19th: where?", C["o7a"][2] + 0.2, 44, GOLD, anchor="start"))
    xs3d, y3d = cen["3d"]; xs4s, y4s = cen["4s"]
    c.g(f'tl.to("#fo_19",{{x:{xs3d[0]-1250},y:{y3d-560},duration:0.8,ease:"power2.inOut"}},{C["o7a"][3]+0.3:.2f});')
    c.hide("#fo_q", C["o7a"][3])
    s.append(L(c, "fo_3dx", xs3d[-1] + 70, y3d + 14, "3d? ✗", C["o7a"][4] - 0.3, 44, CORAL, anchor="start")); c.sound("wrong", C["o7a"][4] - 0.3, 0.3)
    c.hide("#fo_3dx", C["o7a"][4] + 1.2)
    c.g(f'tl.to("#fo_19",{{x:{xs4s[0]-1250},y:{y4s-560},duration:0.8,ease:"back.out(1.6)"}},{C["o7a"][4]:.2f});'); c.sound("ding", C["o7a"][4] + 0.6, 0.35)
    s.append(L(c, "fo_4s", 640, y4s + 14, "← lower!", C["o7a"][4] + 0.6, 40, GREEN, anchor="start"))
    hideall(c, ["#fo_18", "#fo_K"], T["o7b"] - 0.2)
    # o7b: why 4s is lower
    s.append(clover("fo_d", 1130, 400, 90, 40)); c.fade_in("#fo_d", C["o7b"][1], y=0, scale=0.5)
    s.append(L(c, "fo_dl", 1130, 560, "3d: never at the nucleus", C["o7b"][1] + 0.3, 34, LIL))
    s.append(f'<g id="fo_s" opacity="0"><circle cx="1660" cy="400" r="120" fill="url(#gS2)"/><circle cx="1660" cy="400" r="70" fill="url(#gS2)"/><circle cx="1660" cy="400" r="30" fill="url(#gS)"/><circle cx="1660" cy="400" r="6" fill="url(#gNuc2)"/></g>')
    c.fade_in("#fo_s", C["o7b"][1] + 1.6, y=0, scale=0.5)
    s.append(L(c, "fo_sl", 1660, 560, "4s: dives in close", C["o7b"][1] + 1.8, 34, TEAL))
    c.pulse("#fo_l_4s", C["o7b"][2], C["o7b"][2] + 1.5, 1.04, 0.5)
    s.append(W(c, "fo_rule", 1100, 800, "energy sets the order", C["o7b"][3] + 0.1, 64, GOLD))
    s.append(L(c, "fo_rule2", 1100, 880, "not the shell number", C["o7b"][3] + 1.3, 40, WHITE, anchor="start"))
    hideall(c, ["#fo_l", "#fo_4s", "#fo_19", "#fo_d", "#fo_dl", "#fo_s", "#fo_sl", "#fo_rule", "#fo_rule2"] + [f"#fo_l_{x}" for x in ("3s", "3p", "4s", "3d")]
            + [f"#fo_f{lb}{j}{u}" for lb, n in (("3s", 1), ("3p", 3)) for j in range(n) for u in "ud"], T["o7c"] - 0.2)
    # o7c: noble gas shorthand
    s.append(L(c, "fo_kh", 960, 200, "potassium: 19 electrons", T["o7c"] + 0.1, 46, WHITE))
    c.hide("#fo_kh", T["t2q"] - 0.1)
    s.append(W(c, "fo_ar", 960, 330, "[Ar] = argon's 18 electrons", C["o7c"][1], 72, WHITE, anchor="middle"))
    s.append(L(c, "fo_arl", 960, 410, "1s² 2s² 2p⁶ 3s² 3p⁶", C["o7c"][1] + 1.0, 40, INK))
    s.append(W(c, "fo_k1", 960, 590, "K: [Ar] 4s¹", C["o7c"][2], 96, GREEN, anchor="middle")); c.sound("ding", C["o7c"][2] + 1.0, 0.3)
    s.append(W(c, "fo_k2", 960, 780, "[Ar] 3d¹", C["o7c"][3] + 0.1, 80, CORAL, anchor="middle"))
    s.append(cross("fo_kx", 790, 740, 1130, 770, C["o7c"][3] + 0.9, c))
    s.append(L(c, "fo_tr", 960, 870, "the trap", C["o7c"][3] + 1.0, 40, CORAL))
    hideall(c, ["#fo_ar", "#fo_arl", "#fo_k1", "#fo_k2", "#fo_kx", "#fo_tr"], T["t2q"] - 0.1)
    s.append(chip("fo_Ca", 960, 300, "your turn: calcium, 20 electrons", GOLD, 46)); c.pop("#fo_Ca", T["t2q"] + 0.1); c.sound("riser", T["t2q"] - 0.4, 0.3)
    s.append(W(c, "fo_c1", 960, 520, "18 = [Ar], 2 left", T["t2a"] + 0.2, 64, INK, anchor="middle"))
    s.append(W(c, "fo_c2", 960, 680, "Ca: [Ar] 4s²", C["t2a"][2], 96, GREEN, anchor="middle")); c.sound("ding", C["t2a"][2] + 1.0, 0.35)
    s.append(L(c, "fo_c3", 960, 800, "3d starts after calcium", C["t2a"][3] + 0.1, 40, INK))
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 8 Hund
def hund(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_hu", "hund")
    s = ['<g id="g_hu" opacity="0">']
    def config_row(pre, y, t_full, up2p, extra_down, t2p, step=0.35, color=GOLD):
        """1s, 2s full; 2p boxes; up2p = number of up arrows (one per box), extra_down = list of box indices that get a down arrow."""
        out = [box(f"{pre}b0", 360, y, "1s"), box(f"{pre}b1", 520, y, "2s")]
        bx, cs = boxes(f"{pre}p", 720, y, ["", "", ""], s=92, gap=0, label_each=False, group_label="2p")
        out.append(bx)
        for i in range(2): c.fade_in(f"#{pre}b{i}", t_full, y=10)
        show_box(c, f"{pre}p", 3, t_full + 0.2, gl=True)
        for i, x in enumerate((360, 520)):
            out.append(spin(f"{pre}f{i}u", x - 14, y, True, INK) + spin(f"{pre}f{i}d", x + 14, y, False, INK))
            c.fade_in(f"#{pre}f{i}u", t_full + 0.3, y=0); c.fade_in(f"#{pre}f{i}d", t_full + 0.3, y=0)
        ids = []
        for i in range(up2p):
            sh = -14 if i in extra_down else 0
            out.append(spin(f"{pre}u{i}", cs[i] + sh, y, True, color)); ids.append(f"{pre}u{i}")
        for k, i in enumerate(extra_down):
            out.append(spin(f"{pre}d{i}", cs[i] + 14, y, False, color)); ids.append(f"{pre}d{i}")
        return "".join(out), cs, ids
    # o8a nitrogen
    s.append(L(c, "hu_N", 960, 200, "nitrogen: 7 electrons", T["o8a"] + 0.2, 50, WHITE))
    s.append(W(c, "hu_Nc", 960, 300, "1s² 2s² 2p³", C["o8a"][1], 72, WHITE, anchor="middle"))
    row, cs, ids = config_row("hn", 520, C["o8a"][1] + 0.8, 3, [], 0)
    s.append(row)
    # wrong option ghost
    s.append(f'<g id="hu_wr" opacity="0">' + "".join(f'<rect x="{1160 + i*92}" y="474" width="92" height="92" rx="10" fill="none" stroke="{DIM}" stroke-width="4"/>' for i in range(3))
             + spin("hu_w1", 1192, 520, True, DIM, 1) + spin("hu_w2", 1220, 520, False, DIM, 1) + spin("hu_w3", 1298, 520, True, DIM, 1) + '</g>')
    c.fade_in("#hu_wr", C["o8a"][3], y=0)
    s.append(L(c, "hu_wq", 1298, 650, "pair + one?", C["o8a"][3] + 0.2, 36, INK))
    s.append(cross("hu_wx", 1150, 460, 1450, 580, C["o8a"][4], c))
    for i in range(3): ap(c, f"hnu{i}", C["o8a"][4] + 0.4 + i * 0.3)
    for i in range(3): c.pulse(f"#hnu{i}", C["o8a"][5], C["o8a"][5] + 1.2, 1.15, 0.6)
    s.append(L(c, "hu_same", 856, 690, "one per box, same way", C["o8a"][5] + 0.1, 36, GOLD))
    hideall(c, ["#hu_wr", "#hu_wq", "#hu_wx", "#hu_same"], T["o8b"] - 0.2)
    # o8b Hund's rule
    s.append(W(c, "hu_r", 1180, 380, "Hund's rule", T["o8b"] + 0.2, 72, GOLD))
    s.append(L(c, "hu_r1", 1180, 460, "one each before pairing", C["o8b"][1] + 0.1, 40, WHITE, anchor="start"))
    # repel demo box
    s.append(box("hu_rb", 1300, 680, None, 110) + box("hu_rb2", 1460, 680, None, 110))
    c.fade_in("#hu_rb", C["o8b"][2], y=10); c.fade_in("#hu_rb2", C["o8b"][2], y=10)
    s.append(spin("hu_ra", 1284, 680, True, CORAL, 0, 34, 7) + spin("hu_rc", 1316, 680, True, CORAL, 0, 34, 7))
    ap(c, "hu_ra", C["o8b"][2] + 0.2); ap(c, "hu_rc", C["o8b"][2] + 0.2)
    c.g(f'tl.fromTo("#hu_ra",{{x:0}},{{x:-6,duration:0.08,yoyo:true,repeat:15,ease:"none",immediateRender:false}},{C["o8b"][2]+0.6:.2f});tl.fromTo("#hu_rc",{{x:0}},{{x:6,duration:0.08,yoyo:true,repeat:15,ease:"none",immediateRender:false}},{C["o8b"][2]+0.6:.2f});')
    s.append(L(c, "hu_rl", 1380, 790, "− and − push apart", C["o8b"][2] + 0.6, 40, "#ff9a9a"))
    c.g(f'tl.to("#hu_rc",{{x:144,duration:0.6,ease:"back.out(1.6)"}},{C["o8b"][3]:.2f});'); c.sound("swish", C["o8b"][3], 0.3)
    c.to("#hu_ra", C["o8b"][3], "stroke:\"#ffd23f\"", 0.3); c.to("#hu_rc", C["o8b"][3], "stroke:\"#ffd23f\"", 0.3)
    s.append(L(c, "hu_rg", 1380, 860, "same direction: take as given", C["o8b"][4] + 0.1, 38, INK))
    hideall(c, ["#hu_rb", "#hu_rb2", "#hu_ra", "#hu_rc", "#hu_rl", "#hu_rg"], C["o8b"][5] - 0.2)
    s.append(L(c, "hu_un", 816, 380, "unpaired", C["o8b"][5] + 0.1, 46, GOLD))
    c.hide("#hu_N", T["o8c"] - 0.2); c.hide("#hu_r", T["o8c"] - 0.2); c.hide("#hu_r1", T["o8c"] - 0.2)
    # o8c ammonia
    for i in range(3):
        s.append(L(c, f"hu_n{i}", cs[i], 430, str(i + 1), C["o8c"][1] - 0.3 + i * 0.35, 44, GOLD)); c.sound("tick", C["o8c"][1] - 0.3 + i * 0.35, 0.4)
    c.hide("#hu_un", C["o8c"][1] - 0.4)
    s.append(lewis("hu_nh3", 1400, 560, "N", [(150, "H"), (30, "H"), (90, "H")], [270], 0, 1.0))
    c.fade_in("#hu_nh3", C["o8c"][2], y=0)
    for i in range(3): c.fade_in(f"#hu_nh3_arm{i}", C["o8c"][2] + i * 0.35, y=0); c.sound("pop", C["o8c"][2] + i * 0.35, 0.25)
    c.set("#hu_nh3_lp0", 0, "opacity:0")
    s.append(L(c, "hu_3b", 1400, 830, "3 bonds", C["o8c"][2] + 1.4, 48, WHITE))
    c.to("#hu_nh3_lp0", C["o8c"][3], "opacity:1", 0.3); c.pulse("#hu_nh3_lp0", C["o8c"][3] + 0.3, C["o8c"][3] + 2.0, 1.2, 0.5)
    c.pulse("#hnf1u", C["o8c"][3], C["o8c"][3] + 1.6, 1.2, 0.5); c.pulse("#hnf1d", C["o8c"][3], C["o8c"][3] + 1.6, 1.2, 0.5)
    s.append(L(c, "hu_lp", 1400, 360, "lone pair", C["o8c"][3] + 0.2, 44, GOLD))
    hideall(c, ["#hu_Nc", "#hu_nh3", "#hu_3b", "#hu_lp"] + [f"#hu_n{i}" for i in range(3)] + ["#hnb0", "#hnb1", "#hnpgl"] + [f"#hnp{i}" for i in range(3)]
            + [f"#hnf{i}{u}" for i in range(2) for u in "ud"] + [f"#hnu{i}" for i in range(3)], T["o8d"] - 0.2)
    # o8d oxygen
    s.append(L(c, "hu_O", 960, 200, "oxygen: 8 electrons", T["o8d"] + 0.1, 50, WHITE))
    row, cs, ids = config_row("ho", 520, T["o8d"] + 0.3, 3, [0], 0); s.append(row)
    for i in range(3): ap(c, f"hou{i}", C["o8d"][1] + i * 0.3)
    ap(c, "hod0", C["o8d"][2] + 0.2)
    c.g(f'tl.fromTo("#hou0",{{x:14}},{{x:0,duration:0.3,immediateRender:false}},{C["o8d"][2]+0.2:.2f});')
    s.append(L(c, "hu_O2", 856, 690, "2 unpaired", C["o8d"][3] + 0.1, 44, GOLD))
    c.pulse("#hou1", C["o8d"][3], C["o8d"][3] + 1.2, 1.15, 0.5); c.pulse("#hou2", C["o8d"][3], C["o8d"][3] + 1.2, 1.15, 0.5)
    s.append(lewis("hu_h2o", 1420, 560, "O", [(150, "H"), (30, "H")], [215, 325], 0)); c.fade_in("#hu_h2o", C["o8d"][4], y=0)
    c.set("#hu_h2o_lp0", 0, "opacity:0"); c.set("#hu_h2o_lp1", 0, "opacity:0")
    s.append(L(c, "hu_2b", 1420, 820, "2 bonds", C["o8d"][4] + 0.4, 48, WHITE))
    c.to("#hu_h2o_lp0", C["o8d"][5], "opacity:1", 0.3); c.to("#hu_h2o_lp1", C["o8d"][5] + 0.3, "opacity:1", 0.3)
    c.pulse("#hof1u", C["o8d"][5], C["o8d"][5] + 1.4, 1.2, 0.5); c.pulse("#hou0", C["o8d"][5], C["o8d"][5] + 1.4, 1.2, 0.5)
    s.append(L(c, "hu_2lp", 1420, 340, "2 lone pairs", C["o8d"][5] + 0.2, 44, GOLD))
    hideall(c, ["#hu_O", "#hu_O2", "#hu_h2o", "#hu_2b", "#hu_2lp", "#hob0", "#hob1", "#hopgl"] + [f"#hop{i}" for i in range(3)]
            + [f"#hof{i}{u}" for i in range(2) for u in "ud"] + [f"#hou{i}" for i in range(3)] + ["#hod0"], T["t3q"] - 0.1)
    # t3 fluorine
    s.append(chip("hu_F", 960, 220, "your turn: fluorine, 9 electrons", GOLD, 46)); c.pop("#hu_F", T["t3q"] + 0.1); c.sound("riser", T["t3q"] - 0.4, 0.3)
    row, cs, ids = config_row("hf", 520, T["t3q"] + 0.6, 3, [0, 1], 0); s.append(row)
    for i in range(3): ap(c, f"hfu{i}", C["t3a"][1] + i * 0.25)
    ap(c, "hfd0", C["t3a"][1] + 1.0); ap(c, "hfd1", C["t3a"][1] + 1.3)
    s.append(L(c, "hu_F1", 856, 690, "1 unpaired → 1 bond", C["t3a"][2] + 0.1, 44, GOLD)); c.pulse("#hfu2", C["t3a"][2], C["t3a"][2] + 1.2, 1.2, 0.5)
    s.append(lewis("hu_hf", 1460, 560, "F", [(180, "H")], [270, 0, 90], 0)); c.fade_in("#hu_hf", C["t3a"][2] + 0.4, y=0)
    s.append(L(c, "hu_F3", 1460, 780, "3 lone pairs ✓", C["t3a"][3] + 0.1, 44, GREEN)); c.sound("ding", C["t3a"][3] + 0.1, 0.3)
    hideall(c, ["#hu_F", "#hu_F1", "#hu_hf", "#hu_F3", "#hfb0", "#hfb1", "#hfpgl"] + [f"#hfp{i}" for i in range(3)]
            + [f"#hff{i}{u}" for i in range(2) for u in "ud"] + [f"#hfu{i}" for i in range(3)] + ["#hfd0", "#hfd1"], T["o8e"] - 0.2)
    # o8e carbon
    s.append(L(c, "hu_C", 960, 200, "carbon: 6 electrons", T["o8e"] + 0.1, 50, WHITE))
    s.append(W(c, "hu_Cc", 960, 300, "1s² 2s² 2p²", C["o8e"][1], 72, WHITE, anchor="middle"))
    row, cs, ids = config_row("hc", 520, C["o8e"][1] + 0.3, 2, [], 0); s.append(row)
    ap(c, "hcu0", C["o8e"][2] + 0.1); ap(c, "hcu1", C["o8e"][2] + 0.5)
    s.append(L(c, "hu_C2", 856, 690, "2 unpaired, 1 empty", C["o8e"][3] + 0.1, 44, GOLD))
    c.g(f'tl.fromTo("#hcp2",{{opacity:1}},{{opacity:0.35,duration:0.3,yoyo:true,repeat:3,immediateRender:false}},{C["o8e"][3]+0.8:.2f});')
    s.append(lewis("hu_ch2", 1430, 560, "C", [(150, "H"), (30, "H")], [], 0)); c.fade_in("#hu_ch2", C["o8e"][4], y=0)
    s.append(W(c, "hu_ch2l", 1430, 800, "CH₂?", C["o8e"][4] + 0.3, 64, CORAL, anchor="middle"))
    c.hide("#hu_ch2", C["o8e"][5] - 0.1); c.hide("#hu_ch2l", C["o8e"][5] - 0.1)
    s.append(methane2d("hu_ch4", 1430, 600, 1.05, 0)); c.fade_in("#hu_ch4", C["o8e"][5], y=0, scale=0.8); c.sound("whoosh", C["o8e"][5], 0.35)
    s.append(W(c, "hu_ch4l", 1430, 860, "CH₄ has FOUR bonds", C["o8e"][5] + 0.3, 56, GREEN, anchor="middle"))
    s.append(chip("hu_next", 960, 990, "electrons rearrange: next video, hybridization", GOLD, 38)); c.pop("#hu_next", C["o8e"][6]); c.sound("shimmer", C["o8e"][6], 0.35)
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- 9 blocks
PT = {1: ["H", None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, "He"],
      2: ["Li", "Be"] + [None] * 10 + ["B", "C", "N", "O", "F", "Ne"],
      3: ["Na", "Mg"] + [None] * 10 + ["Al", "Si", "P", "S", "Cl", "Ar"],
      4: ["K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"]}
def blocks(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_bl", "blocks")
    s = ['<g id="g_bl" opacity="0">']
    cw, x0, y0 = 88, 168, 250
    col = lambda g: "s" if g < 2 else ("d" if g < 12 else "p")
    fills = {"s": "#1d6f6a", "d": "#8a5a1e", "p": "#5a4aa8"}
    org = {"H", "C", "N", "O", "F", "S", "P", "Cl", "Br"}
    cells = {"s": [], "p": [], "d": []}
    for r, row in PT.items():
        for g, el in enumerate(row):
            if not el: continue
            x, y = x0 + g * cw, y0 + (r - 1) * cw
            b = "s" if el == "He" else col(g)
            cells[b].append(f'<rect x="{x}" y="{y}" width="{cw-6}" height="{cw-6}" rx="8" fill="{fills[b]}"/>')
            s_ = f'<text id="bl_e_{el}" x="{x + cw/2 - 3}" y="{y + cw/2 + 10}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#fff">{el}</text>'
            cells.setdefault("txt", []).append(s_)
    s.append(f'<g id="bl_base" opacity="0">' + "".join(f'<rect x="{x0 + g*cw}" y="{y0 + (r-1)*cw}" width="{cw-6}" height="{cw-6}" rx="8" fill="rgba(8,20,40,.8)" stroke="{DIM}" stroke-width="2"/>' for r, row in PT.items() for g, el in enumerate(row) if el) + '</g>')
    c.fade_in("#bl_base", C["o9a"][1], y=0); c.sound("swish", C["o9a"][1], 0.3)
    for b in ("s", "p", "d"):
        s.append(f'<g id="bl_{b}" opacity="0">' + "".join(cells[b]) + '</g>')
    s.append('<g id="bl_txt" opacity="0">' + "".join(cells["txt"]) + '</g>'); c.fade_in("#bl_txt", C["o9a"][1], y=0)
    # f block rows below
    fy = y0 + 4 * cw + 60
    s.append(f'<g id="bl_fb" opacity="0">' + "".join(f'<rect x="{x0 + (2+i)*cw}" y="{fy + k*cw}" width="{cw-6}" height="{cw-6}" rx="8" fill="rgba(8,20,40,.8)" stroke="{DIM}" stroke-width="2"/>' for k in range(2) for i in range(14)) + '</g>')
    s.append(f'<g id="bl_f" opacity="0">' + "".join(f'<rect x="{x0 + (2+i)*cw}" y="{fy + k*cw}" width="{cw-6}" height="{cw-6}" rx="8" fill="#6e3b5a"/>' for k in range(2) for i in range(14)) + '</g>')
    c.fade_in("#bl_fb", C["o9a"][1], y=0)
    c.to("#bl_s", C["o9a"][2], "opacity:1", 0.4); c.sound("pop", C["o9a"][2], 0.3)
    s.append(L(c, "bl_sl", x0 + cw, y0 - 30, "s block: 2", C["o9a"][2] + 0.2, 34, TEAL))
    c.to("#bl_p", C["o9a"][3], "opacity:1", 0.4); c.sound("pop", C["o9a"][3], 0.3)
    s.append(L(c, "bl_pl", x0 + 15 * cw, y0 - 30, "p block: 6", C["o9a"][3] + 0.2, 34, LIL))
    c.to("#bl_d", C["o9a"][4], "opacity:1", 0.4); c.sound("pop", C["o9a"][4], 0.3)
    s.append(L(c, "bl_dl", x0 + 7 * cw, y0 + 2 * cw - 30, "d block: 10", C["o9a"][4] + 0.2, 34, "#f0b45c"))
    c.to("#bl_f", C["o9a"][5], "opacity:1", 0.4); c.sound("pop", C["o9a"][5], 0.3)
    s.append(L(c, "bl_fl", x0 + 9 * cw, fy + 2 * cw + 50, "f block", C["o9a"][5] + 0.2, 34, "#e6a3c8"))
    hl = []
    for r, row in PT.items():
        for g, el in enumerate(row):
            if el in org:
                hl.append(f'<rect x="{x0 + g*cw - 3}" y="{y0 + (r-1)*cw - 3}" width="{cw}" height="{cw}" rx="10" fill="none" stroke="{GOLD}" stroke-width="5"/>')
    s.append('<g id="bl_hl" opacity="0">' + "".join(hl) + '</g>'); c.fade_in("#bl_hl", C["o9a"][6], y=0); c.sound("shimmer", C["o9a"][6], 0.35)
    c.pulse("#bl_hl", C["o9a"][6] + 0.4, C["o9a"][6] + 3.0, 1.01, 0.6)
    s.append(L(c, "bl_org", 960, 1010, "organic chemistry: the p block (plus hydrogen)", C["o9a"][6] + 0.4, 38, GOLD))
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- recap
def recap(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_rc", "recap")
    s = ['<g id="g_rc" opacity="0">']
    pans = [(110, 160, 1), (690, 160, 2), (1270, 160, 3), (110, 600, 4), (690, 600, 5), (1270, 600, 6)]
    for i, (x, y, n) in enumerate(pans):
        s.append(card(f"rc_c{i}", x, y, 540, 400, ORGO if i < 5 else CORAL)); c.fade_in(f"#rc_c{i}", C["recap"][n] - 0.1, y=20); c.sound("swish", C["recap"][n], 0.25)
    t = C["recap"]
    # 1 orbital holds 2
    s.append(f'<g id="rc_1" opacity="0"><circle cx="380" cy="330" r="110" fill="url(#gS)"/><circle cx="380" cy="330" r="10" fill="url(#gNuc2)"/></g>' + spin("rc_1u", 360, 330, True, GOLD, 0) + spin("rc_1d", 400, 330, False, GOLD, 0))
    c.fade_in("#rc_1", t[1], y=0); ap(c, "rc_1u", t[1] + 0.8); ap(c, "rc_1d", t[1] + 1.1)
    s.append(L(c, "rc_1l", 380, 510, "orbital: holds 2, opposite spins", t[1] + 0.4, 32, WHITE))
    # 2 s sphere + p dumbbells
    s.append(f'<circle id="rc_2s" cx="800" cy="340" r="60" fill="url(#gS)" opacity="0"/>'); c.fade_in("#rc_2s", t[2], y=0)
    s.append(p_orb("rc_px", 1060, 340, 0, 110, 46)); s.append(p_orb("rc_py", 1060, 340, -90, 110, 46)); s.append(p_orb("rc_pz", 1060, 340, 140, 110, 50, fl=0.65))
    for k, idd in enumerate(("rc_px", "rc_py", "rc_pz")): c.fade_in(f"#{idd}", t[2] + 1.2 + k * 0.3, y=0, scale=0.4)
    s.append(L(c, "rc_2l", 960, 510, "s: sphere · p: 3 dumbbells at 90°", t[2] + 0.4, 30, WHITE))
    # 3 shell two
    bx, cs = boxes("rc_3b", 1390, 330, ["2s", "", "2p", ""], s=74, label_each=False); s.append(bx); show_box(c, "rc_3b", 4, t[3])
    s.append(L(c, "rc_3l", 1540, 510, "4 orbitals × 2 = 8: the octet", t[3] + 0.4, 30, WHITE))
    # 4 ladder 4s below 3d
    s.append(f'<g id="rc_4" opacity="0"><line x1="230" y1="770" x2="420" y2="770" stroke="{INK}" stroke-width="5"/><text x="440" y="782" font-family="Inter" font-weight="900" font-size="34" fill="{INK}">3d</text>'
             f'<line x1="230" y1="860" x2="420" y2="860" stroke="{GREEN}" stroke-width="5"/><text x="440" y="872" font-family="Inter" font-weight="900" font-size="34" fill="{GREEN}">4s</text>'
             f'<text x="230" y="905" font-family="Inter" font-weight="800" font-size="28" fill="{GREEN}">4s fills first</text></g>')
    c.fade_in("#rc_4", t[4], y=0)
    s.append(L(c, "rc_4l", 380, 960, "lowest energy first", t[4] + 0.4, 32, WHITE))
    # 5 nitrogen boxes
    bx, cs5 = boxes("rc_5b", 840, 790, ["", "", ""], s=80, label_each=False); s.append(bx); show_box(c, "rc_5b", 3, t[5])
    for i in range(3): s.append(spin(f"rc_5u{i}", cs5[i], 790, True, GOLD)); ap(c, f"rc_5u{i}", t[5] + 0.6 + i * 0.25)
    s.append(L(c, "rc_5l", 960, 950, "N: 3 unpaired → 3 bonds", t[5] + 0.4, 32, WHITE))
    # 6 carbon?
    bx, cs6 = boxes("rc_6b", 1420, 790, ["", "", ""], s=80, label_each=False); s.append(bx); show_box(c, "rc_6b", 3, t[6])
    for i in range(2): s.append(spin(f"rc_6u{i}", cs6[i], 790, True, CORAL)); ap(c, f"rc_6u{i}", t[6] + 0.3 + i * 0.25)
    s.append(W(c, "rc_6l", 1540, 950, "carbon: 2? but 4!", t[6] + 0.3, 40, CORAL, anchor="middle"))
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- practice
def practice(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_pc", "practice")
    s = ['<g id="g_pc" opacity="0">']
    s.append(problem(c, "pb1", "p1q", "p1a", 1, ["Sulfur, 16 electrons.", "Write its configuration. How many unpaired?"],
                     [("1s² 2s² 2p⁶ 3s² = 12", 0), ("+ 3p⁴", 1), ("3p boxes: one each, then pair", 2), ('<tspan fill="#3fe07a">2 unpaired</tspan>', 3)],
                     ("pairing two and two → 0", 4)))
    bx, cs = boxes("pc_bx", 1300, 700, ["", "", ""], s=110, label_each=False, group_label="3p"); s.append(bx); show_box(c, "pc_bx", 3, C["p1a"][2])
    for i, (x, up, dx) in enumerate(((cs[0], True, -16), (cs[1], True, 0), (cs[2], True, 0), (cs[0], False, 16))):
        s.append(spin(f"pc_s{i}", x + dx, 700, up, GOLD, 0, 36, 7)); ap(c, f"pc_s{i}", C["p1a"][2] + 0.5 + i * 0.35)
    c.pulse("#pc_s1", C["p1a"][3], C["p1a"][3] + 1.2, 1.15, 0.5); c.pulse("#pc_s2", C["p1a"][3], C["p1a"][3] + 1.2, 1.15, 0.5)
    hideall(c, ["#pc_bxgl"] + [f"#pc_bx{i}" for i in range(3)] + [f"#pc_s{i}" for i in range(4)], c.T["p1a"] + c.D["p1a"] + 0.3)
    s.append(problem(c, "pb2", "p3q", "p3a", 2, ["Two H 1s orbitals overlap in opposite colors.", "\"Opposite colors attract: strong bond.\"", "Right or wrong?"],
                     [('<tspan fill="#ff6b6b">wrong</tspan>: colors = phase, not charge', 1), ("opposite phase: waves cancel", 2), ("node in the middle → antibonding", 3)],
                     ("thinking the colors are charges", 4)))
    # small picture for problem 2
    s.append(h_atom("pc_a", 1420, 770, "gS", 95) + h_atom("pc_b", 1560, 770, "gSL", 95))
    c.fade_in("#pc_a", C["p3q"][1], y=0); c.fade_in("#pc_b", C["p3q"][1], y=0)
    s.append(f'<line id="pc_nd" x1="1490" y1="670" x2="1490" y2="870" stroke="{GOLD}" stroke-width="6" stroke-dasharray="12 9" opacity="0"/>'); c.to("#pc_nd", C["p3a"][3], "opacity:1", 0.3)
    hideall(c, ["#pc_a", "#pc_b", "#pc_nd"], c.T["p3a"] + c.D["p3a"] + 0.3)
    s.append("</g>")
    return "".join(s)

# ------------------------------------------------------------- outro
def outro(c):
    T, C = c.T, c.C
    t0, t1 = gid(c, "g_ou", "outro")
    s = ['<g id="g_ou" opacity="0">']
    s.append(p_orb("ou_p", 1460, 520, -30, 260, 110, op=0)); c.fade_in("#ou_p", T["end"], y=0, scale=0.6)
    c.pulse("#ou_p", T["end"] + 0.5, T["end"] + c.D["end"] + 3, 1.03, 1.2)
    s.append(W(c, "ou_1", 640, 260, "orbitals ✓", T["end"] + 0.2, 72, GREEN, anchor="middle"))
    s.append(f'<text id="ou_site" x="640" y="470" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="{TEAL}" opacity="0">levlprep.com</text>')
    c.fade_in("#ou_site", C["end"][1], y=20); c.sound("shimmer", C["end"][1], 0.5)
    s.append(L(c, "ou_free", 640, 550, "free notes + practice questions", C["end"][1] + 0.3, 40, WHITE))
    s.append(card("ou_next", 260, 640, 760, 300, GOLD, op=0)); c.fade_in("#ou_next", C["end"][2], y=20)
    s.append(L(c, "ou_nl", 640, 700, "NEXT", C["end"][2] + 0.1, 34, GOLD))
    s.append(W(c, "ou_nt", 640, 790, "hybridization", C["end"][2] + 0.3, 72, anchor="middle"))
    s.append(W(c, "ou_nt2", 640, 880, "2 unpaired → 4 identical bonds", C["end"][2] + 1.6, 40, INK, anchor="middle"))
    s.append("</g>")
    return "".join(s)

CHAPTER_FUNCS = [intro, what, pauli, shapes, count, phase, filling, fours, hund, blocks, recap, practice, outro]

def build_spec():
    def compose(c):
        import os as os_; os_.makedirs(OUT, exist_ok=True)
        out = GRAD + "".join(f(c) for f in CHAPTER_FUNCS)
        ch = {x["id"]: x["t"] for x in c.CH}
        c.spec["music"] = [(0, ch["what"], 0.06), (ch["outro"], c.TOTAL, 0.08)]
        return out
    css = (f"#hdr .tag{{color:{ORGO};border-color:{ORGO}}} #hdr .ch div{{background:rgba(5,12,26,.75);padding:0 14px;border-radius:10px}} #pause{{top:36px}}")
    return dict(css=css, id=S.ID, course_tag="ORGO · FOUNDATIONS 2", chapters=S.CHAPTERS, compose=compose, tail=6.0)

SPEC = build_spec()
