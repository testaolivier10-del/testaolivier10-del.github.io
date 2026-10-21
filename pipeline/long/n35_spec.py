"""NREMT 35: Bleeding control. Visual compose for engine_long (video standard 2026-10-18: style B, full frame).
Art source: 3 new style B stills made this run on Modal (garage wide, forearm close up, nosebleed kitchen; reservation $0.54)
plus code motion drawn in the same style (gradients, rim light, soft shadows). No acting shots anywhere in the video
(budget fallback 2, kept for the whole video): people move only through slow camera moves on the stills.
Calm teaching background = the garage still, blurred and darkened (same world).
Motion list for the animation accuracy check: MOTIONS at the bottom."""
import sys, math, random, shutil
sys.path[:0] = ["/home/claude/lp", "/home/claude/lp/long"]
import n35_script as S
from engine_long import TEAL, GOLD, CORAL, INK, GREEN, WHITE
from n01_spec import W, L, P, card, chip, hideall, chapter_span, qcheck, problem
from a01_spec import arrow

OUT = f"/home/claude/lp/out/{S.ID}"
MINT = "#3FC2A9"; RED = "#e8343c"; DRED = "#7a1020"; BRED = "#ff4a4a"; GLOVE = "#4f86e0"; SKIN = "#f08a5d"
FILL = "rgba(9,15,30,.84)"

DEFS = f'''<defs>
<linearGradient id="gSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc19c"/><stop offset="1" stop-color="#e98458"/></linearGradient>
<linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a6"/><stop offset="1" stop-color="#f2c376"/></linearGradient>
<linearGradient id="gMus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8494a"/><stop offset="1" stop-color="#8a2430"/></linearGradient>
<radialGradient id="gMusR" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#d4595a"/><stop offset="1" stop-color="#7f1f2c"/></radialGradient>
<radialGradient id="gBone" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#d9c9a8"/></radialGradient>
<radialGradient id="gArt" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ff7a6e"/><stop offset="1" stop-color="#c8102e"/></radialGradient>
<radialGradient id="gVein" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#a8323e"/><stop offset="1" stop-color="#5a0d1a"/></radialGradient>
<linearGradient id="gArtL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6f63"/><stop offset=".5" stop-color="#e3172f"/><stop offset="1" stop-color="#a50e24"/></linearGradient>
<linearGradient id="gVeinL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b2a37"/><stop offset=".5" stop-color="#6d1422"/><stop offset="1" stop-color="#4a0a15"/></linearGradient>
<linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3a8"/><stop offset="1" stop-color="#d9727a"/></linearGradient>
<radialGradient id="gRbc" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#ff8a7a"/><stop offset="1" stop-color="#d0142c"/></radialGradient>
<radialGradient id="gRbcD" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#b13a45"/><stop offset="1" stop-color="#5e0c19"/></radialGradient>
<radialGradient id="gPlt" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#f6e3ff"/><stop offset="1" stop-color="#b48ad8"/></radialGradient>
<radialGradient id="gDrop" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff7a6e"/><stop offset=".55" stop-color="#d4122c"/><stop offset="1" stop-color="#8e0a1e"/></radialGradient>
<radialGradient id="gDropD" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#a5303c"/><stop offset=".6" stop-color="#6a0f1d"/><stop offset="1" stop-color="#3e0610"/></radialGradient>
<radialGradient id="gPool" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#e0283a"/><stop offset=".7" stop-color="#a50f22"/><stop offset="1" stop-color="#7c0818"/></radialGradient>
<radialGradient id="gStain" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#b3101f"/><stop offset=".6" stop-color="#d42435" stop-opacity=".9"/><stop offset="1" stop-color="#e8343c" stop-opacity="0"/></radialGradient>
<linearGradient id="gGauze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe6ee"/></linearGradient>
<linearGradient id="gGlove" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb0ff"/><stop offset="1" stop-color="#3d6fc8"/></linearGradient>
<linearGradient id="gStrap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#15181f"/><stop offset=".35" stop-color="#3a404c"/><stop offset=".6" stop-color="#262b34"/><stop offset="1" stop-color="#101318"/></linearGradient>
<linearGradient id="gStrapH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6576"/><stop offset=".5" stop-color="#363c48"/><stop offset="1" stop-color="#1c2028"/></linearGradient>
<linearGradient id="gRod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c7484"/><stop offset=".45" stop-color="#2b3039"/><stop offset="1" stop-color="#14171c"/></linearGradient>
<linearGradient id="gLimb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb48c"/><stop offset=".55" stop-color="#ef8a5c"/><stop offset="1" stop-color="#c9643f"/></linearGradient>
<linearGradient id="gBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a6f93"/><stop offset=".5" stop-color="#8ea3c4"/><stop offset="1" stop-color="#5a6f93"/></linearGradient>
<linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe7ff" stop-opacity=".35"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#9ec3ea" stop-opacity=".25"/></linearGradient>
<linearGradient id="gBlood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e0a1e"/><stop offset=".3" stop-color="#d4122c"/><stop offset=".7" stop-color="#b30f25"/><stop offset="1" stop-color="#7a0818"/></linearGradient>
<linearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a16" stop-opacity="0"/><stop offset="1" stop-color="#050a16" stop-opacity=".85"/></linearGradient>
<linearGradient id="fadeT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a16" stop-opacity=".75"/><stop offset="1" stop-color="#050a16" stop-opacity="0"/></linearGradient>
<linearGradient id="fadeR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050a16" stop-opacity="0"/><stop offset=".45" stop-color="#050a16" stop-opacity=".55"/><stop offset="1" stop-color="#050a16" stop-opacity=".88"/></linearGradient>
<radialGradient id="gGlowG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{GOLD}" stop-opacity=".7"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
<radialGradient id="gGlowR" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff4a4a" stop-opacity=".75"/><stop offset="1" stop-color="#ff4a4a" stop-opacity="0"/></radialGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".45"/></filter>
<filter id="bl3"><feGaussianBlur stdDeviation="3"/></filter>
</defs>'''


def IMG(id, f, op=0):
    return f'<g id="{id}" opacity="{op}"><g id="{id}_k"><image href="{f}" x="0" y="-2" width="1920" height="1084" preserveAspectRatio="xMidYMid slice"/></g></g>'


def _cl(s, x, y):
    return max(1920 - 1920 * s, min(0, x)), max(1080 - 1082 * s, min(-2 * s, y))


def ken(c, id, t0, t1, s0=1.0, s1=1.08, x0=0, y0=0, x1=0, y1=0, ease="sine.inOut"):
    x0, y0 = _cl(s0, x0, y0); x1, y1 = _cl(s1, x1, y1)
    c.g(f'tl.fromTo("#{id}_k",{{scale:{s0},x:{x0},y:{y0}}},{{scale:{s1},x:{x1},y:{y1},duration:{max(0.3, t1 - t0):.2f},ease:"{ease}",immediateRender:false}},{t0:.2f});')


def focus(c, id, t, px, py, s, d=1.2, ease="power2.inOut"):
    """camera on a still: put point (px,py) at the frame centre with scale s"""
    x, y = _cl(s, 960 - px * s, 540 - py * s)
    c.g(f'tl.to("#{id}_k",{{scale:{s},x:{x:.1f},y:{y:.1f},duration:{d},ease:"{ease}"}},{t:.2f});')


def box(id, x, y, w, h, color=TEAL, op=0, r=26):
    return f'<rect id="{id}" x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{FILL}" stroke="{color}" stroke-width="4" opacity="{op}" filter="url(#sh)"/>'


def tick(id, x, y, s=1.0, color=GREEN):
    return (f'<g id="{id}" opacity="0"><circle cx="{x}" cy="{y}" r="{30*s}" fill="{color}"/>'
            f'<path d="M {x-14*s} {y} L {x-4*s} {y+11*s} L {x+15*s} {y-11*s}" stroke="#08301a" stroke-width="{7*s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>')


def cross(id, x, y, s=1.0, color=CORAL):
    return (f'<g id="{id}" opacity="0"><circle cx="{x}" cy="{y}" r="{30*s}" fill="{color}"/>'
            f'<path d="M {x-12*s} {y-12*s} L {x+12*s} {y+12*s} M {x+12*s} {y-12*s} L {x-12*s} {y+12*s}" stroke="#3a0b0b" stroke-width="{7*s}" stroke-linecap="round"/></g>')


def strike(id, x1, y, x2, color=CORAL):
    return f'<path id="{id}" d="M {x1} {y} L {x2} {y}" stroke="{color}" stroke-width="4" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>'


def drop(id, x, y, s=1.0, grad="gDrop", op=0):
    return (f'<g id="{id}" opacity="{op}"><path d="M {x} {y - 22*s} C {x + 6*s} {y - 10*s} {x + 15*s} {y - 2*s} {x + 15*s} {y + 8*s} '
            f'C {x + 15*s} {y + 18*s} {x + 8*s} {y + 24*s} {x} {y + 24*s} C {x - 8*s} {y + 24*s} {x - 15*s} {y + 18*s} {x - 15*s} {y + 8*s} '
            f'C {x - 15*s} {y - 2*s} {x - 6*s} {y - 10*s} {x} {y - 22*s} Z" fill="url(#{grad})"/>'
            f'<ellipse cx="{x - 5*s}" cy="{y + 4*s}" rx="{3.5*s}" ry="{6*s}" fill="#fff" opacity=".45"/></g>')


def rbc(id, x, y, s=1.0, dark=False, op=1):
    g = "gRbcD" if dark else "gRbc"
    return (f'<g id="{id}" opacity="{op}"><ellipse cx="{x}" cy="{y}" rx="{13*s}" ry="{9*s}" fill="url(#{g})"/>'
            f'<ellipse cx="{x}" cy="{y}" rx="{6*s}" ry="{3.5*s}" fill="#000" opacity=".18"/></g>')


def flow(c, sel, t0, t1, dx, per, stagger=0.0):
    """cells drifting along a vessel, looping (the group is clipped to the vessel)"""
    n = max(1, int((t1 - t0) / per))
    c.g(f'tl.fromTo("{sel}",{{x:0}},{{x:{dx},duration:{per:.2f},ease:"none",repeat:{n - 1},immediateRender:false}},{t0:.2f});')


def spulse(c, sel, s, e, amp=1.1, per=0.8):
    """heartbeat pulse on an element whose svgOrigin is already set"""
    n = max(1, int((e - s) / per))
    c.g(f'tl.fromTo("{sel}",{{scale:1}},{{scale:{amp},duration:{per/2:.2f},yoyo:true,repeat:{2*n-1},ease:"sine.inOut",immediateRender:false}},{s:.2f});')


def W2(c, id, x, y, text, t, size=48, color=WHITE, **kw):
    return W(c, id, x, y, text, t, size, color, **kw)


# ------------------------------------------------------------------ shared art pieces
def tissue(id, x, y, w, h, vy, vr=34, dark=False, tear=None):
    """skin / fat / muscle block with a horizontal vessel at depth vy (absolute). tear = x of a hole in the top wall."""
    g = "gVeinL" if dark else "gArtL"
    s = [f'<g id="{id}">',
         f'<clipPath id="{id}_cp"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="28"/></clipPath>',
         f'<g clip-path="url(#{id}_cp)" filter="url(#soft)">',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#gMus)"/>']
    for i in range(9):
        yy = y + 120 + i * (h - 140) / 9
        s.append(f'<path d="M {x} {yy:.0f} C {x + w*0.3:.0f} {yy - 14:.0f} {x + w*0.6:.0f} {yy + 14:.0f} {x + w} {yy:.0f}" stroke="#6f1a26" stroke-width="3" fill="none" opacity=".35"/>')
    s.append(f'<rect x="{x}" y="{y + 46}" width="{w}" height="62" fill="url(#gFat)"/>')
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="50" fill="url(#gSkin)"/>')
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="6" fill="#fff" opacity=".45"/>')
    s.append(f'<g id="{id}_v"><rect x="{x - 10}" y="{vy - vr - 8}" width="{w + 20}" height="{2*vr + 16}" fill="url(#gWall)"/>'
             f'<rect id="{id}_lum" x="{x - 10}" y="{vy - vr}" width="{w + 20}" height="{2*vr}" fill="url(#{g})"/>'
             f'<rect x="{x - 10}" y="{vy - vr - 8}" width="{w + 20}" height="4" fill="#fff" opacity=".4"/></g>')
    s.append('</g></g>')
    return "".join(s)


def cells(id, x0, x1, vy, vr, n=14, dark=False, seed=3):
    R = random.Random(seed); s = [f'<g id="{id}">']
    span = x1 - x0
    for i in range(n * 2):
        x = x0 - span + i * span / n + R.uniform(-15, 15)
        s.append(rbc(f"{id}_{i}", x, vy + R.uniform(-vr * 0.5, vr * 0.5), 1.0 + R.uniform(-.15, .15), dark))
    s.append('</g>')
    return "".join(s)


def limbx(id, cx, cy, R, op=0, labels=False, vs=1.0):
    """limb cross section: skin, fat, muscle, bone, artery next to the bone, vein beside it"""
    s = [f'<g id="{id}" opacity="{op}" filter="url(#soft)">',
         f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#gSkin)"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{R - 14}" fill="url(#gFat)"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{R - 34}" fill="url(#gMusR)"/>',
         f'<ellipse cx="{cx + R*0.12:.0f}" cy="{cy + R*0.08:.0f}" rx="{R*0.27:.0f}" ry="{R*0.25:.0f}" fill="url(#gBone)"/>',
         f'<g id="{id}_a"><circle cx="{cx - R*0.25:.0f}" cy="{cy - R*0.18:.0f}" r="{R*0.11*vs:.0f}" fill="url(#gArt)" stroke="#ffd0c8" stroke-width="3"/></g>',
         f'<g id="{id}_vn"><circle cx="{cx - R*0.42:.0f}" cy="{cy - R*0.02:.0f}" r="{R*0.10*vs:.0f}" fill="url(#gVein)" stroke="#d99" stroke-width="2"/></g>',
         f'<path d="M {cx - R*0.72:.0f} {cy - R*0.62:.0f} A {R} {R} 0 0 1 {cx + R*0.2:.0f} {cy - R + 2:.0f}" stroke="#fff" stroke-width="5" fill="none" opacity=".45"/>',
         '</g>']
    return "".join(s)


def gauze(id, x, y, w, h, op=0, rot=0):
    s = [f'<g id="{id}" opacity="{op}" transform="rotate({rot} {x + w/2} {y + h/2})">',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="url(#gGauze)" filter="url(#soft)"/>']
    for i in range(1, 6):
        s.append(f'<path d="M {x + i*w/6:.0f} {y + 4} L {x + i*w/6:.0f} {y + h - 4}" stroke="#c9d3df" stroke-width="2"/>')
    s.append('</g>')
    return "".join(s)


def strap_on_arm(id, x, ytop, ybot, w=70, op=0, tag=True):
    """windlass tourniquet seen from the side, wrapped around the forearm in the close up"""
    s = [f'<g id="{id}" opacity="{op}" filter="url(#soft)">',
         f'<path d="M {x - w/2} {ytop - 6} Q {x} {ytop - 16} {x + w/2} {ytop - 6} L {x + w/2} {ybot + 6} Q {x} {ybot + 16} {x - w/2} {ybot + 6} Z" fill="url(#gStrap)"/>',
         f'<path d="M {x - w/2 + 8} {ytop + 2} L {x - w/2 + 8} {ybot - 2} M {x + w/2 - 8} {ytop + 2} L {x + w/2 - 8} {ybot - 2}" stroke="#5c6474" stroke-width="2" stroke-dasharray="6 6"/>',
         f'<g id="{id}_rod"><rect x="{x - 12}" y="{ytop - 78}" width="24" height="110" rx="10" fill="url(#gRod)"/>'
         f'<rect x="{x - 7}" y="{ytop - 74}" width="5" height="100" rx="2" fill="#fff" opacity=".25"/></g>',
         f'<path d="M {x - 34} {ytop - 30} L {x - 20} {ytop - 54} L {x + 20} {ytop - 54} L {x + 34} {ytop - 30} Z" fill="#2a2f38" stroke="#4b5260" stroke-width="2"/>',
         f'<rect x="{x - w/2 - 10}" y="{ytop + 40}" width="{w + 20}" height="34" rx="6" fill="#d32f3a"/>']
    if tag:
        s.append(f'<g id="{id}_tag"><rect x="{x - 64}" y="{ybot + 18}" width="128" height="58" rx="8" fill="#f4f1e8" stroke="#2a2f38" stroke-width="3"/>'
                 f'<text x="{x - 54}" y="{ybot + 37}" font-family="Inter" font-weight="900" font-size="15" fill="#2a2f38">TIME</text>'
                 f'<text id="{id}_tm" x="{x - 30}" y="{ybot + 68}" font-family="Kalam" font-weight="700" font-size="32" fill="#1b1f27" opacity="0">16:42</text></g>')
    s.append('</g>')
    return "".join(s)


def tq_big(id, cx, cy, op=0):
    """large labeled commercial windlass tourniquet (flat lay): wide strap with hook and loop face, windlass rod on its base, C clip, red tab"""
    y0, y1 = cy + 40, cy + 112
    hatch = "".join(f'<path d="M {x} {y0 + 8} l 10 56" stroke="#5f6878" stroke-width="2" opacity=".55"/>' for x in range(cx - 540, cx + 520, 16))
    s = [f'<g id="{id}" opacity="{op}" filter="url(#soft)">',
         f'<linearGradient id="{id}_sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7888"/><stop offset=".5" stop-color="#4a5262"/><stop offset="1" stop-color="#2e343f"/></linearGradient>',
         f'<rect x="{cx - 560}" y="{y0}" width="1080" height="{y1 - y0}" rx="14" fill="url(#{id}_sg)"/>', hatch,
         f'<path d="M {cx - 556} {y0 + 7} L {cx + 516} {y0 + 7} M {cx - 556} {y1 - 7} L {cx + 516} {y1 - 7}" stroke="#aeb6c4" stroke-width="2.5" stroke-dasharray="9 7"/>',
         f'<rect x="{cx - 556}" y="{y0 + 2}" width="1072" height="6" rx="3" fill="#fff" opacity=".22"/>',
         f'<rect x="{cx - 612}" y="{y0 - 6}" width="70" height="{y1 - y0 + 12}" rx="12" fill="#d32f3a"/><rect x="{cx - 606}" y="{y0}" width="58" height="9" rx="4" fill="#fff" opacity=".35"/>',
         f'<rect x="{cx - 150}" y="{cy - 6}" width="300" height="140" rx="22" fill="#262b35" stroke="#4b5262" stroke-width="3"/>',
         f'<g id="{id}_rod"><rect x="{cx - 230}" y="{cy + 20}" width="460" height="44" rx="20" fill="url(#gRod)"/>'
         f'<rect x="{cx - 220}" y="{cy + 26}" width="440" height="8" rx="4" fill="#fff" opacity=".3"/>'
         f'<circle cx="{cx}" cy="{cy + 42}" r="14" fill="#1c2027" stroke="#6c7484" stroke-width="3"/></g>',
         f'<g id="{id}_clip"><path d="M {cx + 262} {cy - 60} L {cx + 262} {cy + 40} Q {cx + 262} {cy + 70} {cx + 292} {cy + 70} L {cx + 332} {cy + 70} Q {cx + 362} {cy + 70} {cx + 362} {cy + 40} L {cx + 362} {cy - 60}" '
         f'fill="none" stroke="#3a404c" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>'
         f'<path d="M {cx + 262} {cy - 60} L {cx + 262} {cy + 40} Q {cx + 262} {cy + 70} {cx + 292} {cy + 70} L {cx + 332} {cy + 70} Q {cx + 362} {cy + 70} {cx + 362} {cy + 40} L {cx + 362} {cy - 60}" '
         f'fill="none" stroke="#7d8696" stroke-width="5" stroke-linecap="round" opacity=".7"/></g>',
         '</g>']
    return "".join(s)


def arm_diagram(id, x, y, s=1.0, op=0):
    """a straight arm (shoulder at left, hand at right) drawn as a shaded limb, joints marked by ids"""
    k = s
    p = (f'M {x} {y - 70*k} C {x + 120*k} {y - 78*k} {x + 300*k} {y - 66*k} {x + 420*k} {y - 52*k} '
         f'C {x + 460*k} {y - 50*k} {x + 480*k} {y - 46*k} {x + 500*k} {y - 46*k} '
         f'C {x + 640*k} {y - 50*k} {x + 780*k} {y - 40*k} {x + 860*k} {y - 30*k} '
         f'C {x + 920*k} {y - 40*k} {x + 1010*k} {y - 30*k} {x + 1040*k} {y} '
         f'C {x + 1010*k} {y + 34*k} {x + 920*k} {y + 40*k} {x + 860*k} {y + 30*k} '
         f'C {x + 780*k} {y + 40*k} {x + 640*k} {y + 50*k} {x + 500*k} {y + 46*k} '
         f'C {x + 480*k} {y + 46*k} {x + 460*k} {y + 50*k} {x + 420*k} {y + 52*k} '
         f'C {x + 300*k} {y + 66*k} {x + 120*k} {y + 78*k} {x} {y + 70*k} Z')
    return (f'<g id="{id}" opacity="{op}" filter="url(#soft)"><path d="{p}" fill="url(#gLimb)"/>'
            f'<path d="M {x} {y - 70*k} C {x + 120*k} {y - 78*k} {x + 300*k} {y - 66*k} {x + 420*k} {y - 52*k} C {x + 640*k} {y - 50*k} {x + 780*k} {y - 40*k} {x + 860*k} {y - 30*k}" stroke="#fff" stroke-width="5" fill="none" opacity=".4"/></g>')


def leg_diagram(id, x, y, s=1.0, op=0):
    """a straight leg lying flat (hip at left, foot at right)"""
    k = s
    p = (f'M {x} {y - 110*k} C {x + 200*k} {y - 112*k} {x + 380*k} {y - 84*k} {x + 470*k} {y - 66*k} '
         f'C {x + 520*k} {y - 64*k} {x + 560*k} {y - 64*k} {x + 600*k} {y - 70*k} '
         f'C {x + 700*k} {y - 72*k} {x + 820*k} {y - 46*k} {x + 900*k} {y - 40*k} '
         f'L {x + 960*k} {y - 120*k} C {x + 1000*k} {y - 130*k} {x + 1020*k} {y - 100*k} {x + 1010*k} {y - 40*k} '
         f'L {x + 1000*k} {y + 44*k} C {x + 940*k} {y + 50*k} {x + 860*k} {y + 44*k} {x + 820*k} {y + 44*k} '
         f'C {x + 720*k} {y + 54*k} {x + 620*k} {y + 66*k} {x + 560*k} {y + 64*k} '
         f'C {x + 500*k} {y + 64*k} {x + 460*k} {y + 70*k} {x + 400*k} {y + 82*k} '
         f'C {x + 300*k} {y + 100*k} {x + 160*k} {y + 112*k} {x} {y + 110*k} Z')
    return (f'<g id="{id}" opacity="{op}" filter="url(#soft)"><path d="{p}" fill="url(#gLimb)"/>'
            f'<path d="M {x} {y - 110*k} C {x + 200*k} {y - 112*k} {x + 380*k} {y - 84*k} {x + 470*k} {y - 66*k} C {x + 700*k} {y - 72*k} {x + 820*k} {y - 46*k} {x + 900*k} {y - 40*k}" stroke="#fff" stroke-width="5" fill="none" opacity=".4"/></g>')


def body(id, cx, top, s=1.0, op=0):
    """faceless body map (front view) for junctional areas; a diagram, not a character"""
    k = s
    p = (f'M {cx} {top} C {cx + 46*k} {top} {cx + 62*k} {top + 36*k} {cx + 60*k} {top + 70*k} C {cx + 58*k} {top + 104*k} {cx + 40*k} {top + 124*k} {cx + 30*k} {top + 140*k} '
         f'L {cx + 30*k} {top + 156*k} C {cx + 90*k} {top + 168*k} {cx + 140*k} {top + 178*k} {cx + 160*k} {top + 220*k} '
         f'L {cx + 196*k} {top + 420*k} C {cx + 204*k} {top + 470*k} {cx + 210*k} {top + 520*k} {cx + 200*k} {top + 560*k} L {cx + 170*k} {top + 560*k} '
         f'L {cx + 150*k} {top + 420*k} L {cx + 128*k} {top + 300*k} L {cx + 120*k} {top + 430*k} '
         f'L {cx + 120*k} {top + 500*k} L {cx + 104*k} {top + 900*k} L {cx + 40*k} {top + 900*k} L {cx + 10*k} {top + 560*k} L {cx} {top + 540*k} '
         f'L {cx - 10*k} {top + 560*k} L {cx - 40*k} {top + 900*k} L {cx - 104*k} {top + 900*k} L {cx - 120*k} {top + 500*k} L {cx - 120*k} {top + 430*k} '
         f'L {cx - 128*k} {top + 300*k} L {cx - 150*k} {top + 420*k} L {cx - 170*k} {top + 560*k} L {cx - 200*k} {top + 560*k} '
         f'C {cx - 210*k} {top + 520*k} {cx - 204*k} {top + 470*k} {cx - 196*k} {top + 420*k} L {cx - 160*k} {top + 220*k} '
         f'C {cx - 140*k} {top + 178*k} {cx - 90*k} {top + 168*k} {cx - 30*k} {top + 156*k} L {cx - 30*k} {top + 140*k} '
         f'C {cx - 40*k} {top + 124*k} {cx - 58*k} {top + 104*k} {cx - 60*k} {top + 70*k} C {cx - 62*k} {top + 36*k} {cx - 46*k} {top} {cx} {top} Z')
    return (f'<g id="{id}" opacity="{op}" filter="url(#soft)"><path d="{p}" fill="url(#gBody)" stroke="#c9d6ec" stroke-width="3"/>'
            f'<path d="M {cx - 60*k} {top + 70*k} C {cx - 62*k} {top + 36*k} {cx - 46*k} {top} {cx} {top}" stroke="#fff" stroke-width="4" fill="none" opacity=".4"/></g>')


def glowspot(id, x, y, r, color="R"):
    return f'<circle id="{id}" cx="{x}" cy="{y}" r="{r}" fill="url(#gGlow{color})" opacity="0"/>'


def ring(id, x, y, r, color=GOLD, w=6):
    return f'<circle id="{id}" cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{color}" stroke-width="{w}" opacity="0"/>'


# ================================================================== chapters
def bg_teach(c, t_in, t_out):
    """the calm teaching background (blurred garage) for one span"""
    c.g(f'tl.to("#bgT",{{opacity:1,duration:0.5}},{t_in:.2f}); tl.to("#bgT",{{opacity:0,duration:0.5}},{t_out - 0.5:.2f});')


def intro(c):
    T, C, g = c.T, c.C, c.g
    s = []
    t_end = c.CH[1]["t"] + 0.2
    s.append('<g id="g_s1" opacity="1"><g id="g_s1_k">'
             '<image href="a_s1.jpg" x="0" y="-2" width="1920" height="1084" preserveAspectRatio="xMidYMid slice"/>'
             # the pool on the concrete grows from the drops already there
             '<g id="pool"><ellipse cx="1505" cy="992" rx="80" ry="16" fill="url(#gPool)"/><ellipse cx="1480" cy="986" rx="30" ry="5" fill="#fff" opacity=".35"/></g>'
             # the stain soaking through the gauze under her hands
             '<ellipse id="stain" cx="972" cy="642" rx="34" ry="22" fill="url(#gStain)" opacity="0"/>'
             + "".join(drop(f"hs_{i}", 1004, 652, 0.85 - i * 0.08) for i in range(5)) +
             '</g></g>')
    s.append('<rect id="s1_fade" x="0" y="0" width="1920" height="1080" fill="url(#fadeR)" opacity="0"/>')
    s.append('<rect id="s1_fadeB" x="0" y="680" width="1920" height="400" fill="url(#fadeB)" opacity="0"/>')
    g('gsap.set("#g_s1_k",{svgOrigin:"0 0"}); gsap.set("#pool",{svgOrigin:"1505 992"}); gsap.set("#stain",{svgOrigin:"972 642"});')
    # frame zero is already moving: slow push toward the arm while the gauze reddens on every beat
    c.g('tl.fromTo("#g_s1_k",{scale:1.0,x:0,y:0},{scale:1.12,x:-150,y:-70,duration:3.3,ease:"sine.inOut"},0);')
    g('tl.fromTo("#pool",{scale:0.5},{scale:1.0,duration:3.0,ease:"sine.out"},0);')
    beats = [0.25 + i * 0.8 for i in range(int((T["promise"] - 0.5) / 0.8))]
    for i, b in enumerate(beats):
        sc = min(1.0 + i * 0.07, 2.1)
        g(f'tl.fromTo("#stain",{{opacity:.95,scale:{sc:.2f}}},{{opacity:.8,scale:{sc * 0.94:.2f},duration:0.6,ease:"sine.out",immediateRender:false}},{b:.2f});')
        if i < 14: c.sound("heartbeat", b, 0.35)
        if b < T["promise"] - 0.3:
            for k in range(5):
                g(f'tl.fromTo("#hs_{k}",{{opacity:1,x:0,y:0}},{{keyframes:[{{x:{26 + k*16},y:{-30 + k*5},duration:0.28,ease:"power2.out"}},{{x:{60 + k*28},y:{70 + k*12},opacity:0,duration:0.42,ease:"power2.in"}}]}},{b + k*0.03:.2f});')
    # {2} bright red, pumping: close on the gauze
    focus(c, "g_s1", C["hook"][2] - 0.3, 975, 640, 2.3, 1.4)
    s.append(chip("hk_c1", 1500, 330, "BRIGHT RED", BRED, 54)); c.pop("#hk_c1", C["hook"][2] + 0.5)
    s.append(chip("hk_c2", 1500, 440, "pumping with each heartbeat", WHITE, 38)); c.fade_in("#hk_c2", C["hook"][2] + 1.6, y=12)
    hideall(c, ["#hk_c1", "#hk_c2"], C["hook"][3] - 0.3)
    # {3} can kill in a few minutes: pull back to the pool spreading on the floor
    focus(c, "g_s1", C["hook"][3] - 0.2, 1220, 760, 1.25, 1.2)
    g(f'tl.to("#pool",{{scale:2.4,duration:7,ease:"sine.out"}},{C["hook"][3]:.2f});')
    s.append(chip("hk_c3", 1500, 860, "a few minutes", CORAL, 52)); c.pop("#hk_c3", C["hook"][3] + 0.8)
    c.hide("#hk_c3", C["hook"][4] - 0.2)
    # {4} what do your hands do: onto her gloved hands
    focus(c, "g_s1", C["hook"][4] - 0.1, 1000, 610, 1.7, 1.3)
    s.append(ring("hk_r", 960, 520, 150, GOLD, 7)); c.g(f'tl.fromTo("#hk_r",{{opacity:0,attr:{{r:60}}}},{{opacity:1,attr:{{r:150}},duration:0.5,ease:"back.out(1.6)"}},{C["hook"][4] + 0.9:.2f});')
    c.hide("#hk_r", T["promise"] - 0.1)
    # promise: the scene settles, four promises on the dark side
    focus(c, "g_s1", T["promise"] - 0.2, 900, 560, 1.15, 1.4)
    c.show("#s1_fade", T["promise"] + 0.2, 0.6)
    items = [("press it", WHITE, T["promise"] + 1.0), ("tourniquet right away", GOLD, C["promise"][1]),
             ("where it goes + how tight", TEAL, C["promise"][2]), ("pack it", MINT, C["promise"][3])]
    for i, (tx, col, t) in enumerate(items):
        s.append(chip(f"pr_{i}", 1500, 330 + i * 130, tx, col, 44)); c.fade_in(f"#pr_{i}", t, y=16)
        c.sound("swish", t, 0.3)
    hideall(c, [f"#pr_{i}" for i in range(4)], T["why"] - 0.1)
    # why: old teaching vs now
    ken(c, "g_s1", T["why"], t_end, 1.15, 1.22, 960 - 900 * 1.15, 540 - 560 * 1.15, 960 - 820 * 1.22, 540 - 560 * 1.22)
    s.append(chip("wy_old", 1440, 320, "old: tourniquet = last resort", INK, 40)); c.fade_in("#wy_old", C["why"][1] - 0.2, y=12)
    s.append(strike("wy_st", 1170, 314, 1710)); c.draw("#wy_st", C["why"][2] - 0.2, 0.4)
    s.append(chip("wy_mil", 1400, 450, "limb almost always fine", WHITE, 38)); c.fade_in("#wy_mil", C["why"][2] + 0.4, y=12)
    s.append(chip("wy_wait", 1440, 570, "waiting gets people killed", CORAL, 42)); c.pop("#wy_wait", C["why"][3])
    s.append(f'<g id="wy_now" opacity="0"><rect x="1050" y="660" width="780" height="190" rx="28" fill="{FILL}" stroke="{GOLD}" stroke-width="5" filter="url(#sh)"/>'
             f'<text x="1440" y="735" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="{WHITE}">life threatening bleed, arm or leg</text>'
             f'<text x="1440" y="810" text-anchor="middle" font-family="Inter" font-weight="900" font-size="50" fill="{GOLD}">→ tourniquet right away</text></g>')
    c.fade_in("#wy_now", C["why"][4], y=20); c.sound("riser", C["why"][4] - 0.5, 0.3)
    hideall(c, ["#wy_old", "#wy_st", "#wy_mil", "#wy_wait", "#wy_now", "#s1_fade"], t_end - 0.6)
    c.hide("#g_s1", t_end - 0.4, 0.4)
    return "".join(s)


def read(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "read")
    bg_teach(c, t0 - 0.3, T["r4"] + 0.3)
    s = ['<g id="g_rd">']
    PX = [(110, "art"), (700, "vein"), (1290, "cap")]
    Y0, PH, PW = 250, 400, 520
    for x, k in PX:
        vy = Y0 + 270
        s.append(f'<g id="rd_{k}" opacity="0">' + tissue(f"rdt_{k}", x, Y0, PW, PH, vy, 30 if k != "cap" else 10, dark=(k != "art")))
        # cells moving in the vessel (clipped to the lumen)
        s.append(f'<clipPath id="rdc_{k}"><rect x="{x}" y="{vy - 30}" width="{PW}" height="60"/></clipPath>')
        if k != "cap":
            s.append(f'<g clip-path="url(#rdc_{k})">' + cells(f"rdcl_{k}", x, x + PW, vy, 30, 10, dark=(k == "vein"), seed=len(k)) + '</g>')
        cx = x + PW / 2
        if k != "cap":
            # the cut: a channel from the vessel up through the skin
            s.append(f'<path d="M {cx - 16} {Y0} L {cx - 8} {vy - 30} L {cx + 8} {vy - 30} L {cx + 16} {Y0} Z" fill="{DRED}"/>')
        s.append('</g>')
    # labels
    labs = [("art", 370, "arterial", "bright red · spurts with the pulse", BRED),
            ("vein", 960, "venous", "dark red · steady flow", "#d06070"),
            ("cap", 1550, "capillary", "dark red ooze · often stops", "#d06070")]
    for k, x, a, b, col in labs:
        s.append(f'<g id="rdl_{k}" opacity="0"><text x="{x}" y="{Y0 + PH + 70}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="{col}">{a}</text>'
                 f'<text x="{x}" y="{Y0 + PH + 120}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="{WHITE}">{b}</text></g>')
    # artery spurts: drops thrown up in an arc on every beat
    cxA = 370
    for i in range(6):
        s.append(drop(f"sp_{i}", cxA, Y0 - 10, 1.6 - i * 0.12))
    # vein: a steady dark stream running down over the skin
    cxV = 960
    s.append(f'<path id="vst" d="M {cxV} {Y0 - 4} C {cxV + 40} {Y0 - 10} {cxV + 90} {Y0 + 2} {cxV + 120} {Y0 + 8} L {cxV + 255} {Y0 + 8}" stroke="url(#gDropD)" stroke-width="16" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>')
    s.append(f'<ellipse id="vpool" cx="{cxV}" cy="{Y0 - 6}" rx="26" ry="10" fill="url(#gDropD)" opacity="0"/>')
    # capillary: small beads of ooze on a scraped patch
    s.append(f'<g id="cscr" opacity="0"><rect x="1420" y="{Y0 + 2}" width="260" height="20" rx="8" fill="#d77a62"/>'
             + "".join(f'<path d="M {1430 + i*25} {Y0 + 8} l 18 8" stroke="#b5503f" stroke-width="3"/>' for i in range(10)) + '</g>')
    R = random.Random(5)
    for i in range(7):
        s.append(f'<g id="cb_{i}" opacity="0"><ellipse cx="{1440 + i*36 + R.uniform(-6,6):.0f}" cy="{Y0 - 2}" rx="{9 + R.uniform(0,5):.0f}" ry="8" fill="url(#gDropD)"/></g>')
    s.append('</g>')
    # r1: artery
    c.fade_in("#rd_art", T["r1"] + 0.3, y=20); c.fade_in("#rd_vein", T["r1"] + 0.6, y=20); c.fade_in("#rd_cap", T["r1"] + 0.9, y=20)
    flow(c, "#rdcl_art", T["r1"] + 0.3, T["r4"], 520, 0.8)
    flow(c, "#rdcl_vein", T["r1"] + 0.3, T["r4"], 520, 3.0)
    c.fade_in("#rdl_art", C["r1"][1], y=10)
    g('gsap.set("[id^=sp_]",{svgOrigin:"370 240"});')
    tb = C["r1"][2]
    k = 0
    while tb < T["r2"] - 0.6:
        for i in range(6):
            dx = 50 + i * 45; dy = -170 + i * 16
            g(f'tl.fromTo("#sp_{i}",{{opacity:1,x:0,y:0}},{{keyframes:[{{x:{dx*0.6:.0f},y:{dy:.0f},duration:0.32,ease:"power2.out"}},{{x:{dx:.0f},y:{dy*0.1:.0f},opacity:0,duration:0.38,ease:"power2.in"}}],immediateRender:false}},{tb + i*0.03:.2f});')
        if k % 2 == 0: c.sound("heartbeat", tb, 0.25)
        tb += 0.8; k += 1
    c.g(f'tl.to("#rd_art",{{opacity:.45,duration:0.4}},{T["r2"]:.2f});')
    # r2: vein, then capillary
    c.fade_in("#rdl_vein", C["r2"][1], y=10)
    c.show("#vpool", C["r2"][1]); c.draw("#vst", C["r2"][1] + 0.2, 2.0, "none")
    c.g(f'tl.fromTo("#vpool",{{scale:0.6,transformOrigin:"50% 50%"}},{{scale:1.15,duration:1.2,yoyo:true,repeat:4,ease:"sine.inOut",immediateRender:false}},{C["r2"][1]:.2f});')
    c.g(f'tl.to("#rd_vein, #vst, #vpool",{{opacity:.45,duration:0.4}},{C["r2"][3] - 0.3:.2f});')
    c.fade_in("#rdl_cap", C["r2"][3], y=10); c.show("#cscr", C["r2"][3])
    for i in range(7):
        c.g(f'tl.fromTo("#cb_{i}",{{opacity:1,scale:0,transformOrigin:"50% 100%"}},{{scale:1,duration:1.4,ease:"sine.out",immediateRender:false}},{C["r2"][3] + 0.3 + i * 0.25:.2f});')
    # {4} usually stops on its own: beads darken and stop growing
    c.g(f'tl.to("[id^=cb_] ellipse",{{fill:"#4a0a12",duration:1.0}},{C["r2"][4]:.2f});')
    s.append(chip("rd_stop", 1550, 860, "usually stops on its own", GREEN, 34)); c.pop("#rd_stop", C["r2"][4] + 0.2)
    hideall(c, ["#g_rd", "#rdl_art", "#rdl_vein", "#rdl_cap", "#rd_stop", "#vst", "#vpool"], T["r3"] - 0.3)
    # r3: volumes, as containers that fill
    s.append(volumes(c))
    # r4: back on the garage, the four signs of a life threatening bleed
    t4 = T["r4"] - 0.3
    s.append(IMG("g_r4", "a_s1.jpg"))
    c.g(f'gsap.set("#g_r4_k",{{svgOrigin:"0 0"}});')
    c.scene("#g_r4", t4, T["q1q"] - 0.1, 0.5)
    ken(c, "g_r4", t4, T["q1q"], 1.35, 1.45, 960 - 900 * 1.35, 540 - 640 * 1.35, 960 - 880 * 1.45, 540 - 650 * 1.45)
    s.append('<rect id="r4_fade" x="0" y="0" width="1920" height="1080" fill="url(#fadeR)" opacity="0"/>'); c.show("#r4_fade", t4 + 0.2, 0.5)
    s.append(L(c, "r4_t", 1440, 230, "life threatening if it's…", T["r4"] + 0.4, 42, GOLD))
    for i, tx in enumerate(["spurting", "pooling fast", "soaking through in seconds", "part of the limb is gone"]):
        s.append(chip(f"r4_{i}", 1440, 340 + i * 115, tx, WHITE, 40)); c.fade_in(f"#r4_{i}", C["r4"][i + 1], y=14); c.sound("swish", C["r4"][i + 1], 0.25)
    s.append(chip("r4_tq", 1440, 820, "→ think tourniquet", GOLD, 50)); c.pop("#r4_tq", C["r4"][5])
    hideall(c, ["#r4_fade", "#r4_t", "#r4_tq"] + [f"#r4_{i}" for i in range(4)], T["q1q"] - 0.3)
    # quick check 1
    bg_teach(c, T["q1q"] - 0.4, t1 + 0.2)
    s.append(qcheck(c, "qc1", "q1q", ["Dark red, steady flow from a deep shin cut.", "No spurting. Which vessel is open?"]))
    s.append(tissue("qc1_t", 1180, 560, 560, 300, 760, 26, dark=True))
    c.g('gsap.set("#qc1_t",{opacity:0});'); c.fade_in("#qc1_t", C["q1q"][1], y=20)
    s.append(f'<path id="qc1_st" d="M 1460 560 C 1500 552 1560 562 1600 568 L 1740 568" stroke="url(#gDropD)" stroke-width="16" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>')
    c.draw("#qc1_st", C["q1q"][1] + 0.5, 2.5, "none")
    s.append(W(c, "qc1_a", 320, 640, "a vein: dark + steady", T["q1a"] + 0.1, 56, GREEN))
    s.append(W(c, "qc1_b", 320, 730, "bright + spurting = an artery", C["q1a"][2], 44, BRED))
    hideall(c, ["#qc1_g", "#qc1_t", "#qc1_st", "#qc1_a", "#qc1_b"], t1 - 0.3)
    return "".join(s)


def jug(id, x, base, w, h, level, color="gBlood", op=0):
    """a glass container with a liquid fill (fill group id_l scales from the bottom)"""
    nk = w * 0.36
    p = (f'M {x + w/2 - nk/2} {base - h} L {x + w/2 + nk/2} {base - h} L {x + w/2 + nk/2} {base - h + h*0.12} '
         f'C {x + w} {base - h + h*0.16} {x + w} {base - h + h*0.22} {x + w} {base - h + h*0.3} L {x + w} {base - 18} Q {x + w} {base} {x + w - 18} {base} '
         f'L {x + 18} {base} Q {x} {base} {x} {base - 18} L {x} {base - h + h*0.3} C {x} {base - h + h*0.22} {x} {base - h + h*0.16} {x + w/2 - nk/2} {base - h + h*0.12} Z')
    return (f'<g id="{id}" opacity="{op}"><clipPath id="{id}_cp"><path d="{p}"/></clipPath>'
            f'<path d="{p}" fill="#0d1a30" opacity=".55"/>'
            f'<g clip-path="url(#{id}_cp)"><g id="{id}_l"><rect x="{x - 5}" y="{base - h*level}" width="{w + 10}" height="{h*level + 5}" fill="url(#{color})"/>'
            f'<rect x="{x - 5}" y="{base - h*level}" width="{w + 10}" height="6" fill="#ff8a7a" opacity=".55"/></g></g>'
            f'<path d="{p}" fill="url(#gGlass)" stroke="#d8ecff" stroke-width="4" opacity=".4"/>'
            f'<path d="M {x + 14} {base - h*0.6} L {x + 14} {base - 30}" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5"/></g>')


def volumes(c):
    T, C, g = c.T, c.C, c.g
    t0 = T["r3"] - 0.2; t_end = T["r4"] - 0.3
    s = ['<g id="g_vol">']
    s.append(jug("vA", 140, 820, 300, 460, 0.9, op=0))
    s.append(jug("vA1", 560, 820, 130, 230, 0.0, op=0))
    s.append(jug("vC", 880, 820, 200, 300, 0.9, op=0))
    s.append(jug("vC1", 1130, 820, 100, 170, 0.0, op=0))
    s.append(jug("vI", 1400, 820, 120, 170, 0.9, op=0))
    s.append(jug("vI1", 1590, 820, 70, 110, 0.0, op=0))
    s.append('</g>')
    g('gsap.set("#vA_l",{svgOrigin:"290 820"}); gsap.set("#vA1_l",{svgOrigin:"625 820"}); gsap.set("#vC_l",{svgOrigin:"980 820"});'
      'gsap.set("#vC1_l",{svgOrigin:"1180 820"}); gsap.set("#vI_l",{svgOrigin:"1460 820"}); gsap.set("#vI1_l",{svgOrigin:"1625 820"});'
      'gsap.set("#vA_l,#vA1_l,#vC1_l,#vI1_l",{scaleY:0});')
    s.append(L(c, "vol_q", 960, 220, "how much blood?", T["r3"] + 0.2, 52, GOLD)); c.hide("#vol_q", C["r3"][5] - 0.3)
    c.fade_in("#vA", T["r3"] + 0.6, y=20)
    g(f'tl.fromTo("#vA_l",{{scaleY:0}},{{scaleY:1,duration:1.8,ease:"sine.inOut"}},{C["r3"][1]:.2f});')
    s.append(L(c, "vA_t", 290, 900, "adult: about 5 L", C["r3"][1], 40, WHITE))
    # {2} one liter out: the adult's level drops a fifth while the bottle fills
    c.fade_in("#vA1", C["r3"][2] - 0.3, y=20)
    g(f'tl.fromTo("#vA1_l",{{scaleY:0}},{{scaleY:1,duration:1.6,ease:"sine.inOut",immediateRender:false}},{C["r3"][2] + 0.2:.2f});')
    g(f'tl.set("#vA1_l rect",{{attr:{{y:{820 - 230*0.9:.0f},height:{230*0.9 + 5:.0f}}}}},{C["r3"][2] - 0.4:.2f});')
    g(f'tl.to("#vA_l",{{scaleY:0.8,duration:1.6,ease:"sine.inOut"}},{C["r3"][2] + 0.2:.2f});')
    c.sound("water_pour_real", C["r3"][2] + 0.2, 0.25)
    # the liquid surface sways gently while the adult jug is introduced
    g(f'tl.fromTo("#vA_l rect",{{y:0}},{{y:-6,duration:0.9,yoyo:true,repeat:5,ease:"sine.inOut"}},{C["r3"][1]:.2f});')
    s.append(L(c, "vA1_t", 625, 900, "≈ 1 L = serious", C["r3"][2] + 0.6, 34, CORAL))
    s.append(L(c, "vA1_f", 625, 945, "(about a fifth)", C["r3"][2] + 1.4, 28, INK))
    # {3} child
    c.fade_in("#vC", C["r3"][3] - 0.3, y=20); c.fade_in("#vC1", C["r3"][3], y=20)
    s.append(L(c, "vC_t", 980, 900, "child: a lot less", C["r3"][3], 36, WHITE))
    g(f'tl.set("#vC1_l rect",{{attr:{{y:{820 - 170*0.9:.0f},height:{170*0.9 + 5:.0f}}}}},{C["r3"][3] - 0.4:.2f});')
    g(f'tl.fromTo("#vC1_l",{{scaleY:0}},{{scaleY:1,duration:1.3,ease:"sine.inOut",immediateRender:false}},{C["r3"][3] + 0.6:.2f});')
    s.append(L(c, "vC1_t", 1180, 945, "≈ 500 mL", C["r3"][3] + 1.2, 34, CORAL))
    # {4} infant
    c.fade_in("#vI", C["r3"][4] - 0.3, y=20); c.fade_in("#vI1", C["r3"][4], y=20)
    s.append(L(c, "vI_t", 1460, 900, "infant", C["r3"][4], 36, WHITE))
    g(f'tl.set("#vI1_l rect",{{attr:{{y:{820 - 110*0.9:.0f},height:{110*0.9 + 5:.0f}}}}},{C["r3"][4] - 0.4:.2f});')
    g(f'tl.fromTo("#vI1_l",{{scaleY:0}},{{scaleY:1,duration:1.2,ease:"sine.inOut",immediateRender:false}},{C["r3"][4] + 0.5:.2f});')
    s.append(L(c, "vI1_t", 1625, 945, "100–200 mL", C["r3"][4] + 1.0, 32, CORAL))
    # {5} the same puddle
    s.append(chip("vol_p", 960, 250, "same puddle, very different problem", GOLD, 44)); c.pop("#vol_p", C["r3"][5])
    g(f'tl.to("#vA1, #vC1, #vI1",{{scale:1.08,transformOrigin:"50% 100%",duration:0.4,yoyo:true,repeat:1}},{C["r3"][5] + 0.3:.2f});')
    hideall(c, ["#vA", "#vA1", "#vC", "#vC1", "#vI", "#vI1", "#vA_t", "#vA1_t", "#vA1_f", "#vC_t", "#vC1_t", "#vI_t", "#vI1_t", "#vol_p"], t_end)
    return "".join(s)


def glove_palm(id, x, y, w=220, h=110, op=0):
    """a gloved hand pressing flat, seen from the side (palm down, fingers to the left, her navy sleeve to the right)"""
    sx, sy = w / 300, h / 90
    t = f'translate({x} {y}) scale({sx:.3f} {sy:.3f})'
    return (f'<g id="{id}" opacity="{op}" filter="url(#soft)"><g transform="{t}">'
            '<path d="M 296 14 L 420 6 L 430 92 L 296 88 Z" fill="#1d2f5c"/><path d="M 300 16 L 420 8" stroke="#f0b070" stroke-width="3" opacity=".7"/>'
            '<path d="M 300 16 L 252 18 C 214 4 164 0 122 12 C 92 20 52 28 20 38 C 4 43 2 60 16 64 C 42 71 72 76 104 78 L 232 82 L 252 88 L 300 88 Z" fill="url(#gGlove)"/>'
            '<rect x="250" y="14" width="52" height="76" rx="10" fill="#3d6fc8"/><rect x="254" y="18" width="44" height="6" rx="3" fill="#cfe2ff" opacity=".5"/>'
            '<path d="M 116 28 C 80 36 48 44 22 50 M 116 44 C 86 50 54 56 24 60" stroke="#2f5fae" stroke-width="3" fill="none" opacity=".65"/>'
            '<path d="M 186 58 C 160 62 136 66 116 70" stroke="#2f5fae" stroke-width="3" fill="none" opacity=".5"/>'
            '<path d="M 248 20 C 212 8 164 4 124 15 C 94 23 56 31 24 41" stroke="#d9e8ff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>'
            '</g></g>')


def bandage(id, x, y, w, h, op=0):
    """a roller bandage wrapped around a limb segment (box), revealed left to right by its clip (id_cr)"""
    stripes = "".join(f'<path d="M {x + k*36} {y} L {x + k*36 + 26} {y + h}" stroke="#d8cfb8" stroke-width="5"/>' for k in range(int(w / 36) + 1))
    return (f'<g id="{id}" opacity="{op}"><clipPath id="{id}_cp"><rect id="{id}_cr" x="{x}" y="{y - 10}" width="0" height="{h + 20}"/></clipPath>'
            f'<g clip-path="url(#{id}_cp)" filter="url(#soft)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h*0.18:.0f}" fill="#f4eedf"/>{stripes}'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h*0.18:.0f}" rx="8" fill="#fff" opacity=".55"/></g></g>')


def press(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "press")
    bg_teach(c, t0 - 0.3, t1 + 0.2)
    X, Y, Wd, Hh, VY, VR = 210, 380, 1500, 520, 700, 46
    s = ['<g id="g_pr" opacity="0"><g id="g_pr_k">', tissue("prt", X, Y, Wd, Hh, VY, VR)]
    s.append(f'<clipPath id="prc"><rect x="{X}" y="{VY - VR}" width="{Wd}" height="{2*VR}"/></clipPath>')
    s.append('<g clip-path="url(#prc)">' + cells("prf", X, X + Wd, VY, VR, 18, seed=8) + '</g>')
    # the torn spot: a channel from the vessel to the skin
    s.append(f'<path id="pr_ch" d="M 944 {Y} L 948 {VY - VR} L 972 {VY - VR} L 976 {Y} Z" fill="{DRED}"/>')
    s.append(f'<ellipse id="pr_hole" cx="960" cy="{VY - VR - 2}" rx="18" ry="9" fill="#5a0610"/>')
    for i in range(5):
        s.append(drop(f"pj_{i}", 960, Y - 14, 1.0 - i * 0.1))
    # platelets and the clot
    R = random.Random(11)
    for i in range(10):
        s.append(f'<ellipse id="plt_{i}" cx="{700 + R.uniform(0, 520):.0f}" cy="{VY + R.uniform(-30, 30):.0f}" rx="9" ry="6" fill="url(#gPlt)" opacity="0"/>')
    s.append(f'<g id="clot" opacity="0">' + "".join(f'<path d="M {934 + i*8} {VY - VR - 10} L {956 + i*6} {VY - VR + 8}" stroke="#f3e6c8" stroke-width="2.5"/>' for i in range(6))
             + f'<ellipse cx="960" cy="{VY - VR - 4}" rx="30" ry="14" fill="url(#gDropD)"/></g>')
    s.append(gauze("pr_gz", 800, Y - 70, 320, 60))
    s.append(glove_palm("pr_hand", 830, Y - 180, 260, 110))
    s.append('</g></g>')
    g(f'gsap.set("#prt_v",{{svgOrigin:"960 {VY}"}}); gsap.set("#g_pr_k",{{svgOrigin:"0 0"}}); gsap.set("[id^=pj_]",{{svgOrigin:"960 {Y}"}});')
    c.fade_in("#g_pr", T["p1"] + 0.2, y=0)
    s.append(L(c, "pr_l0", 960, 150, "a torn vessel under the skin", C["p1"][1], 40, WHITE))
    # free bleeding before the press: cells race, drops jet out of the skin
    flow(c, "#prf", T["p1"] + 0.2, C["p1"][2], Wd, 0.9)
    tb = T["p1"] + 0.6
    while tb < C["p1"][2]:
        for i in range(5):
            g(f'tl.fromTo("#pj_{i}",{{opacity:1,x:0,y:0}},{{keyframes:[{{x:{(i-2)*22},y:{-110 + i*8},duration:0.3,ease:"power2.out"}},{{x:{(i-2)*40},y:{-20},opacity:0,duration:0.35,ease:"power2.in"}}],immediateRender:false}},{tb + i*0.04:.2f});')
        tb += 0.8
    # {2} press: the gauze and the gloved palm come down, the vessel pinches flatter
    c.hide("#pr_l0", C["p1"][2] - 0.2)
    g(f'tl.fromTo("#pr_gz",{{opacity:1,y:-120}},{{y:58,duration:0.6,ease:"power2.in"}},{C["p1"][2]:.2f});')
    g(f'tl.fromTo("#pr_hand",{{opacity:1,y:-160}},{{y:58,duration:0.65,ease:"power2.in"}},{C["p1"][2] + 0.05:.2f});')
    c.sound("cloth_real", C["p1"][2] + 0.5, 0.5)
    g(f'tl.to("#prt_v",{{scaleY:0.38,duration:0.8,ease:"power2.out"}},{C["p1"][2] + 0.6:.2f});')
    g(f'tl.to("#prt > g",{{y:10,duration:0.6}},{C["p1"][2] + 0.5:.2f});')
    s.append(arrow("pr_ar", 960, Y - 210, 960, Y - 140, GOLD, 12)); c.draw("#pr_ar", C["p1"][2] + 0.3, 0.4)
    s.append(L(c, "pr_l1", 960, 150, "pressure pinches the vessel flatter", C["p1"][2] + 0.6, 40, GOLD))
    # {3} less blood through, less force: the cells slow down
    flow(c, "#prf", C["p1"][2] + 0.9, t1, Wd, 3.6)
    s.append(chip("pr_c1", 1500, 980, "less blood · less force", WHITE, 38)); c.fade_in("#pr_c1", C["p1"][3], y=10)
    hideall(c, ["#pr_l1", "#pr_c1", "#pr_ar"], T["p2"] - 0.2)
    # p2: zoom on the hole; platelets stick, a clot builds
    g(f'tl.to("#g_pr_k",{{scale:1.9,x:{960 - 960*1.9:.0f},y:{540 - (VY - 60)*1.9:.0f},duration:1.4,ease:"power2.inOut"}},{T["p2"] + 0.2:.2f});')
    g(f'tl.to("#pr_gz, #pr_hand",{{opacity:0,duration:0.6}},{T["p2"] + 0.2:.2f});')
    for i in range(10):
        tx = 930 + (i % 5) * 15; ty = VY - VR + 4 + (i // 5) * 6
        g(f'tl.to("#plt_{i}",{{opacity:1,duration:0.2}},{C["p2"][1] + i*0.12:.2f}); tl.to("#plt_{i}",{{attr:{{cx:{tx},cy:{ty}}},duration:0.9,ease:"power2.out"}},{C["p2"][1] + i*0.12:.2f});')
    s.append(chip("pr_pl", 960, 860, "platelets stick to the torn edge", "#d8b8f4", 38)); c.fade_in("#pr_pl", C["p2"][1] + 0.3, y=10)
    c.fade_in("#clot", C["p2"][2], y=0, scale=0.3)
    s.append(chip("pr_cl", 960, 890, "a clot builds across the hole", WHITE, 38)); c.fade_in("#pr_cl", C["p2"][2] + 0.2, y=10); c.hide("#pr_pl", C["p2"][2])
    s.append(chip("pr_x", 560, 985, "blood blasting through: no clot", CORAL, 34)); c.fade_in("#pr_x", C["p2"][3], y=10)
    s.append(chip("pr_ok", 1360, 985, "slower flow: the clot holds", GREEN, 34)); c.pop("#pr_ok", C["p2"][4])
    hideall(c, ["#pr_pl", "#pr_cl", "#pr_x", "#pr_ok"], T["p3"] - 0.2)
    c.hide("#g_pr", T["p3"] - 0.3, 0.4)
    # p3: three ways
    xs = [360, 960, 1560]
    labs = ["gloved hand", "hand + dressing", "pressure dressing"]
    for i, x in enumerate(xs):
        t = C["p3"][i + 1]
        s.append(f'<g id="p3_{i}" opacity="0">' + box(f"p3b_{i}", x - 260, 300, 520, 520, TEAL, op=1))
        s.append(f'<rect x="{x - 200}" y="640" width="400" height="120" rx="20" fill="url(#gSkin)" filter="url(#soft)"/>'
                 f'<rect x="{x - 200}" y="700" width="400" height="60" rx="16" fill="url(#gMus)"/>')
        if i == 0:
            s.append(glove_palm(f"p3h_{i}", x - 150, 530, 240, 110, op=1))
        elif i == 1:
            s.append(gauze(f"p3g_{i}", x - 120, 600, 240, 44, op=1) + glove_palm(f"p3h_{i}", x - 150, 490, 240, 110, op=1))
        else:
            s.append(gauze(f"p3g_{i}", x - 120, 600, 240, 44, op=1))
            s.append(bandage("p3bd", x - 170, 588, 340, 176, op=1))
        s.append(f'<text x="{x}" y="420" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="{WHITE}">{labs[i]}</text></g>')
        c.fade_in(f"#p3_{i}", t, y=24); c.sound("swish", t, 0.3)
    g(f'tl.to("#p3bd_cr",{{attr:{{width:340}},duration:1.6,ease:"none"}},{C["p3"][3] + 0.4:.2f});')
    s.append(L(c, "p3_n", 1560, 880, "keeps pressing without you", C["p3"][3] + 1.8, 32, GOLD))
    hideall(c, [f"#p3_{i}" for i in range(3)] + ["#p3_n"], t1 - 0.3)
    return "".join(s)


def steps(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "steps")
    bg_teach(c, t0 - 0.3, t1 + 0.2)
    s = []
    s.append(box("st_card", 70, 150, 760, 820, GOLD, op=0)); c.fade_in("#st_card", T["s1"] - 0.1, y=20)
    lines = [("1  press hard", "s1"), ("2  hold it", "s2"), ("3  no big stack", "s3"), ("4  pressure dressing", "s4"), ("5  don't peel it off", "s5")]
    for i, (tx, k) in enumerate(lines):
        s.append(W(c, f"st_l{i}", 120, 260 + i * 150, tx, T[k] + 0.1, 56, WHITE))
        c.sound("pen_scratch_real", T[k] + 0.1, 0.3)
    subs = [("palm / fingers, toward a bone", C["s1"][1]), ("massive: all the way in", C["s2"][1]), ("thick = weak pressure", C["s3"][2]),
            ("wrap it firm", C["s4"][1]), ("soaked? leave it, press harder", C["s5"][3])]
    for i, (tx, t) in enumerate(subs):
        s.append(W(c, f"st_s{i}", 175, 318 + i * 150, tx, t, 32, INK))
    # highlight the current line
    for i, (tx, k) in enumerate(lines):
        if i > 0: c.g(f'tl.to("#st_l{i-1}",{{fill:"#a9bbd8",duration:0.3}},{T[k]:.2f});')
    # ---- s1: limb cross section; push toward the bone flattens the artery
    s.append(limbx("st_x", 1360, 560, 260))
    c.fade_in("#st_x", T["s1"] + 0.3, y=20)
    s.append(L(c, "st_xl1", 1360, 250, "artery", T["s1"] + 1.0, 34, BRED))
    s.append(P(c, "st_xp1", "M 1360 262 L 1300 440", T["s1"] + 1.0, BRED, 3, 0.4))
    s.append(L(c, "st_xl2", 1640, 880, "bone", T["s1"] + 1.4, 34, "#f3e6c8"))
    s.append(P(c, "st_xp2", "M 1600 860 L 1460 640", T["s1"] + 1.4, "#f3e6c8", 3, 0.4))
    s.append(glove_palm("st_h", 1170, 200, 240, 100))
    g('gsap.set("#st_h",{svgOrigin:"1240 250"}); gsap.set("#st_x_a",{svgOrigin:"1295 513"});')
    g(f'tl.fromTo("#st_h",{{opacity:1,y:-80}},{{y:0,duration:0.6,ease:"power2.out"}},{C["s1"][2] - 0.2:.2f});')
    s.append(arrow("st_ar", 1290, 330, 1330, 470, GOLD, 10)); c.draw("#st_ar", C["s1"][2] + 0.2, 0.5)
    g(f'tl.to("#st_x_a",{{scaleY:0.35,scaleX:1.25,rotation:-25,duration:0.7}},{C["s1"][2] + 0.6:.2f});')
    s.append(chip("st_c1", 1360, 940, "squeeze it against something firm", GOLD, 32)); c.fade_in("#st_c1", C["s1"][2] + 0.8, y=10)
    c.hide("#st_c1", C["s1"][3] - 0.2)
    s.append(chip("st_c2", 1360, 930, "spurting? no hunting for gauze", CORAL, 34)); c.fade_in("#st_c2", C["s1"][3], y=10)
    s.append(chip("st_c3", 1360, 1015, "gloved hand on it NOW", WHITE, 34)); c.pop("#st_c3", C["s1"][4])
    s.append(chip("st_c4", 1360, 118, "limb: keep pressing while the tourniquet comes out", GOLD, 28)); c.fade_in("#st_c4", C["s1"][4] + 1.6, y=10)
    hideall(c, ["#st_x", "#st_xl1", "#st_xp1", "#st_xl2", "#st_xp2", "#st_h", "#st_ar", "#st_c2", "#st_c3", "#st_c4"], T["s2"] - 0.2)
    # ---- s2: how long
    s.append(chip("st_m1", 1360, 430, "massive: all the way to the hospital", BRED, 36)); c.fade_in("#st_m1", C["s2"][1], y=12)
    s.append(chip("st_m2", 1360, 600, "smaller: hold steady, no peeking", WHITE, 36)); c.fade_in("#st_m2", C["s2"][2], y=12)
    s.append(f'<g id="st_tm" opacity="0"><circle cx="1360" cy="790" r="70" fill="{FILL}" stroke="{GOLD}" stroke-width="6"/>'
             f'<path id="st_tmh" d="M 1360 790 L 1360 735" stroke="{GOLD}" stroke-width="7" stroke-linecap="round"/></g>')
    g('gsap.set("#st_tmh",{svgOrigin:"1360 790"});')
    c.fade_in("#st_tm", C["s2"][2] + 0.3, y=10); g(f'tl.to("#st_tmh",{{rotation:720,duration:{T["s3"] - C["s2"][2] - 1:.2f},ease:"none"}},{C["s2"][2] + 0.4:.2f});')
    hideall(c, ["#st_m1", "#st_m2", "#st_tm"], T["s3"] - 0.2)
    # ---- s3: a tall stack cushions the hand
    s.append(f'<g id="st_sk" opacity="0"><rect x="960" y="760" width="760" height="110" rx="20" fill="url(#gSkin)" filter="url(#soft)"/><rect x="960" y="820" width="760" height="50" rx="14" fill="url(#gMus)"/></g>')
    c.fade_in("#st_sk", C["s3"][1] - 0.3, y=10)
    for k in range(9):
        s.append(gauze(f"st_g{k}", 1010, 712 - k * 46, 280, 44))
        c.fade_in(f"#st_g{k}", C["s3"][1] + k * 0.18, y=-30)
    c.sound("cloth_real", C["s3"][1] + 0.3, 0.4)
    s.append(f'<rect id="st_soak" x="1012" y="712" width="276" height="0" fill="#c8102e" opacity=".55"/>')
    g(f'tl.set("#st_soak",{{opacity:.55}},{C["s3"][2]:.2f}); tl.to("#st_soak",{{attr:{{y:{712 - 4*46},height:{4*46 + 44}}},duration:2.4,ease:"sine.inOut"}},{C["s3"][2]:.2f});')
    s.append(arrow("st_a1", 1150, 230, 1150, 290, GOLD, 5))
    c.draw("#st_a1", C["s3"][2] + 0.4, 0.4)
    s.append(gauze("st_g1b", 1440, 712, 240, 44))
    c.fade_in("#st_g1b", C["s3"][2] + 0.8, y=-30)
    s.append(arrow("st_a2", 1560, 480, 1560, 690, GOLD, 16)); c.draw("#st_a2", C["s3"][2] + 1.2, 0.5)
    s.append(L(c, "st_w1", 1150, 200, "pressing LESS", C["s3"][2] + 0.7, 34, CORAL))
    s.append(L(c, "st_w2", 1560, 440, "pressing hard", C["s3"][2] + 1.5, 34, GREEN))
    hideall(c, ["#st_sk", "#st_soak", "#st_a1", "#st_a2", "#st_g1b", "#st_w1", "#st_w2"] + [f"#st_g{k}" for k in range(9)], T["s4"] - 0.2)
    # ---- s4: a pressure dressing wraps around the limb
    s.append(f'<g id="st_lb" opacity="0" filter="url(#soft)"><rect x="1000" y="470" width="720" height="230" rx="110" fill="url(#gLimb)"/>'
             f'<rect x="1040" y="480" width="640" height="10" rx="5" fill="#fff" opacity=".35"/></g>')
    c.fade_in("#st_lb", T["s4"] + 0.2, y=10)
    s.append(gauze("st_lg", 1230, 450, 260, 40)); c.fade_in("#st_lg", T["s4"] + 0.5, y=-20)
    s.append(bandage("st_bd", 1180, 436, 360, 276, op=1))
    g(f'tl.to("#st_bd_cr",{{attr:{{width:360}},duration:1.8,ease:"none"}},{C["s4"][1] + 0.3:.2f});')
    c.sound("cloth_real", C["s4"][1] + 0.4, 0.45)
    s.append(chip("st_pd", 1360, 860, "pressure stays on without your hands", GOLD, 34)); c.fade_in("#st_pd", C["s4"][1] + 2.2, y=10)
    hideall(c, ["#st_lb", "#st_lg", "#st_pd", "#st_bd"], T["s5"] - 0.2)
    # ---- s5: peeling it off tears the clot
    s.append(f'<g id="st_s5" opacity="0"><rect x="1000" y="640" width="720" height="140" rx="20" fill="url(#gSkin)" filter="url(#soft)"/><rect x="1000" y="710" width="720" height="70" rx="16" fill="url(#gMus)"/></g>')
    c.fade_in("#st_s5", T["s5"] + 0.2, y=10)
    s.append(f'<g id="st_cl" opacity="0"><ellipse cx="1360" cy="642" rx="60" ry="16" fill="url(#gDropD)"/></g>')
    c.fade_in("#st_cl", T["s5"] + 0.3, y=0)
    s.append(f'<g id="st_pg">' + gauze("st_pgz", 1200, 594, 320, 48, op=1) + '<ellipse cx="1360" cy="618" rx="70" ry="16" fill="url(#gStain)"/></g>')
    g('gsap.set("#st_pg",{opacity:0,svgOrigin:"1200 640"});'); c.fade_in("#st_pg", T["s5"] + 0.4, y=-20)
    g(f'tl.to("#st_pg",{{rotation:-24,y:-60,duration:0.7,ease:"power2.out"}},{C["s5"][1] + 0.3:.2f});')
    s.append(drop("st_rd", 1370, 610, 1.0)); s.append(glowspot("st_rg", 1360, 640, 90))
    g(f'tl.to("#st_rg",{{opacity:1,duration:0.2,yoyo:true,repeat:3}},{C["s5"][2]:.2f}); tl.fromTo("#st_rd",{{opacity:1,y:0}},{{y:-60,opacity:0,duration:0.7}},{C["s5"][2]:.2f});')
    c.sound("wrong", C["s5"][2], 0.4)
    s.append(chip("st_tr", 1360, 400, "tears the clot open", CORAL, 40)); c.pop("#st_tr", C["s5"][2] + 0.2)
    g(f'tl.to("#st_pg",{{rotation:0,y:0,duration:0.6,ease:"power2.inOut"}},{C["s5"][3] - 0.3:.2f});')
    c.hide("#st_tr", C["s5"][3] - 0.3)
    s.append(glove_palm("st_ph", 1260, 440, 200, 110))
    g(f'tl.fromTo("#st_ph",{{opacity:1,y:-120}},{{y:40,duration:0.5,ease:"power2.in"}},{C["s5"][3] + 0.2:.2f});')
    s.append(chip("st_ok", 1360, 900, "leave it + press harder", GREEN, 40)); c.pop("#st_ok", C["s5"][3] + 0.4)
    s.append(chip("st_mo", 1360, 1010, "= you need to do more", GOLD, 34)); c.fade_in("#st_mo", C["s5"][4], y=10)
    hideall(c, ["#st_s5", "#st_cl", "#st_pg", "#st_ph", "#st_ok", "#st_mo"], T["s6"] - 0.2)
    # ---- s6: what "more" means
    c.hide("#st_card", T["s6"] - 0.1); hideall(c, [f"#st_l{i}" for i in range(5)] + [f"#st_s{i}" for i in range(5)], T["s6"] - 0.1)
    s.append(L(c, "s6_t", 960, 220, "doing more", T["s6"] + 0.2, 52, GOLD))
    s.append(f'<g id="s6_a" opacity="0">{box("s6_ab", 160, 330, 740, 380, TEAL, op=1)}'
             f'<text x="530" y="420" text-anchor="middle" font-family="Inter" font-weight="900" font-size="42" fill="{WHITE}">arm or leg,</text>'
             f'<text x="530" y="475" text-anchor="middle" font-family="Inter" font-weight="800" font-size="34" fill="{INK}">pressure isn’t stopping it</text>'
             f'<text x="530" y="620" text-anchor="middle" font-family="Inter" font-weight="900" font-size="58" fill="{GOLD}">→ tourniquet</text></g>')
    s.append(f'<g id="s6_b" opacity="0">{box("s6_bb", 1020, 330, 740, 380, MINT, op=1)}'
             f'<text x="1390" y="420" text-anchor="middle" font-family="Inter" font-weight="900" font-size="42" fill="{WHITE}">where a tourniquet</text>'
             f'<text x="1390" y="475" text-anchor="middle" font-family="Inter" font-weight="900" font-size="42" fill="{WHITE}">can’t go</text>'
             f'<text x="1390" y="590" text-anchor="middle" font-family="Inter" font-weight="900" font-size="58" fill="{MINT}">→ pack it</text>'
             f'<text x="1390" y="655" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="{INK}">plain or hemostatic (clot helping) gauze</text></g>')
    c.fade_in("#s6_a", C["s6"][1], y=20); c.fade_in("#s6_b", C["s6"][2], y=20)
    g('gsap.set("#s6_a",{svgOrigin:"530 520"}); gsap.set("#s6_b",{svgOrigin:"1390 520"});')
    for k, (sel, t) in enumerate((("#s6_a", C["s6"][2] + 0.6), ("#s6_b", C["s6"][2] + 2.4), ("#s6_a", C["s6"][2] + 4.2), ("#s6_b", C["s6"][2] + 6.0))):
        g(f'tl.to("{sel}",{{scale:1.04,duration:0.6,yoyo:true,repeat:1,ease:"sine.inOut"}},{t:.2f});')
    s.append(f'<g id="s6_c" opacity="0"><rect x="360" y="790" width="1200" height="150" rx="30" fill="{FILL}" stroke="{CORAL}" stroke-width="6" filter="url(#sh)"/>'
             f'<text x="960" y="885" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="{WHITE}">life threatening limb bleed: <tspan fill="{GOLD}">don’t wait</tspan></text></g>')
    c.fade_in("#s6_c", C["s6"][3], y=20); c.sound("riser", C["s6"][3] - 0.5, 0.3)
    hideall(c, ["#s6_t", "#s6_a", "#s6_b", "#s6_c"], t1 - 0.3)
    return "".join(s)


def nose(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "nose")
    s = [IMG("g_ns", "a_nose.jpg")]
    g('gsap.set("#g_ns_k",{svgOrigin:"0 0"});')
    c.scene("#g_ns", t0 - 0.2, t1 + 0.3, 0.5)
    ken(c, "g_ns", t0 - 0.2, C["n1"][1], 1.0, 1.06, 0, 0, -40, -20)
    s.append('<rect id="ns_fade" x="0" y="0" width="1920" height="1080" fill="url(#fadeR)" opacity="0"/>'); c.show("#ns_fade", T["n1"] + 0.5, 0.6)
    s.append(chip("ns_back", 1490, 300, "tip the head back", INK, 44)); c.fade_in("#ns_back", C["n1"][1], y=12)
    s.append(cross("ns_bx", 1170, 290, 1.0)); c.pop("#ns_bx", C["n1"][2])
    chain = [("blood runs down the throat", C["n1"][2] + 0.6), ("swallowed", C["n1"][3]), ("irritates the stomach", C["n1"][3] + 1.1), ("vomiting", C["n1"][3] + 2.4)]
    for i, (tx, t) in enumerate(chain):
        s.append(chip(f"ns_c{i}", 1490, 430 + i * 120, ("↓ " if i else "") + tx, CORAL if i == 3 else WHITE, 38)); c.fade_in(f"#ns_c{i}", t, y=12)
    hideall(c, ["#ns_back", "#ns_bx"] + [f"#ns_c{i}" for i in range(4)], T["n2"] - 0.2)
    # n2: upright and forward (his whole posture), then pinch the soft part
    s.append(f'<path id="ns_lean" d="M 520 900 C 560 700 640 560 760 470" stroke="{GREEN}" stroke-width="10" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" opacity="0" marker-end="url(#aht)"/>')
    c.draw("#ns_lean", C["n2"][1], 0.8)
    s.append(chip("ns_up", 1490, 330, "upright, lean FORWARD", GREEN, 44)); c.pop("#ns_up", C["n2"][1] + 0.2)
    c.hide("#ns_lean", C["n2"][2] - 0.4)
    focus(c, "g_ns", C["n2"][2] - 0.5, 840, 500, 2.6, 1.3)
    s.append(ring("ns_soft", 930, 560, 70, GOLD, 7))
    c.g(f'tl.fromTo("#ns_soft",{{opacity:0,attr:{{r:20}}}},{{opacity:1,attr:{{r:70}},duration:0.5,ease:"back.out(1.6)"}},{C["n2"][2] + 1.0:.2f});')
    s.append(L(c, "ns_sl", 1300, 600, "pinch the soft part", C["n2"][2] + 1.0, 48, GOLD))
    s.append(chip("ns_bl", 1450, 210, "bony bridge: can't squeeze", WHITE, 36, w=640)); c.fade_in("#ns_bl", C["n2"][2] + 3.2, y=10)
    s.append(P(c, "ns_bp", "M 1200 236 L 860 462", C["n2"][2] + 3.2, WHITE, 4, 0.5))
    s.append(L(c, "ns_fr", 1300, 680, "most nosebleeds start here, at the front", C["n2"][2] + 5.0, 32, WHITE))
    s.append(chip("ns_end", 960, 960, "lean forward + pinch", GREEN, 50)); c.pop("#ns_end", C["n2"][3])
    hideall(c, ["#ns_soft", "#ns_sl", "#ns_bl", "#ns_bp", "#ns_fr", "#ns_end", "#ns_up", "#ns_fade"], t1 - 0.2)
    return "".join(s)


def tq(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "tq")
    s = ['<g id="g_t1" opacity="0"><g id="g_t1_k"><image href="a_s1.jpg" x="0" y="-2" width="1920" height="1084" preserveAspectRatio="xMidYMid slice"/>'
         '<ellipse id="t1_st" cx="972" cy="642" rx="38" ry="25" fill="url(#gStain)" opacity="0"/>'
         + "".join(drop(f"ts_{i}", 1004, 652, 0.85 - i * 0.08) for i in range(5)) + '</g></g>']
    g('gsap.set("#g_t1_k",{svgOrigin:"0 0"}); gsap.set("#t1_st",{svgOrigin:"972 642"});')
    c.scene("#g_t1", t0 - 0.2, T["t2"] - 0.1, 0.5)
    ken(c, "g_t1", t0 - 0.2, C["t1"][1], 1.1, 1.5, 960 - 960 * 1.1, 540 - 600 * 1.1, 960 - 975 * 1.5, 540 - 630 * 1.5, "power2.inOut")
    # the stain is part of the still layer, so it follows the camera
    g(f'tl.set("#t1_st",{{opacity:.9}},{t0:.2f});')
    s_beats = [t0 + 0.3 + i * 0.8 for i in range(int((T["t2"] - t0 - 0.6) / 0.8))]
    for i, b in enumerate(s_beats):
        g(f'tl.fromTo("#t1_st",{{scale:{1 + i*0.12:.2f}}},{{scale:{0.95 + i*0.12:.2f},duration:0.6,ease:"sine.out",immediateRender:false}},{b:.2f});')
        if i < 10: c.sound("heartbeat", b, 0.3)
        for k in range(5):
            g(f'tl.fromTo("#ts_{k}",{{opacity:1,x:0,y:0}},{{keyframes:[{{x:{26 + k*16},y:{-30 + k*5},duration:0.28,ease:"power2.out"}},{{x:{60 + k*28},y:{70 + k*12},opacity:0,duration:0.42,ease:"power2.in"}}]}},{b + k*0.03:.2f});')
    s.append('<rect id="t1_fade" x="0" y="0" width="1920" height="1080" fill="url(#fadeR)" opacity="0"/>'); c.show("#t1_fade", C["t1"][1], 0.5)
    s.append(chip("t1_c1", 1480, 340, "spurting through the gauze", BRED, 42)); c.fade_in("#t1_c1", C["t1"][1], y=12)
    s.append(chip("t1_c2", 1480, 470, "life threatening, from a limb", WHITE, 40)); c.fade_in("#t1_c2", C["t1"][2], y=12)
    s.append(chip("t1_c3", 1480, 620, "tourniquet. right now.", GOLD, 52)); c.pop("#t1_c3", C["t1"][3]); c.sound("riser", C["t1"][3] - 0.5, 0.3)
    hideall(c, ["#t1_c1", "#t1_c2", "#t1_c3", "#t1_fade", "#t1_st"], T["t2"] - 0.3)
    # t2: the device, part by part
    bg_teach(c, T["t2"] - 0.4, t1 + 0.2)
    s.append(f'<rect id="tqb_bg" x="300" y="300" width="1320" height="520" rx="40" fill="#24324d" stroke="#3d5278" stroke-width="3" opacity="0" filter="url(#sh)"/>')
    c.fade_in("#tqb_bg", T["t2"] + 0.1, y=20)
    s.append(tq_big("tqb", 960, 470))
    g('gsap.set("#tqb_rod",{svgOrigin:"960 512"});')
    c.fade_in("#tqb", T["t2"] + 0.2, y=30)
    s.append(L(c, "tq_l0", 960, 230, "commercial windlass tourniquet", T["t2"] + 0.3, 46, WHITE))
    s.append(L(c, "tq_l1", 560, 700, "wide strap", C["t2"][1], 44, TEAL)); s.append(P(c, "tq_p1", "M 560 660 L 560 590", C["t2"][1], TEAL, 4, 0.4))
    s.append(L(c, "tq_l2", 960, 380, "windlass (the rod)", C["t2"][2], 44, GOLD))
    for k in range(2):
        g(f'tl.to("#tqb_rod",{{rotation:{180 * (k + 1)},duration:0.7,ease:"power2.inOut"}},{C["t2"][2] + 0.5 + k * 0.8:.2f});')
    s.append(L(c, "tq_l3", 1380, 700, "clip: locks the rod", C["t2"][3], 44, WHITE)); s.append(P(c, "tq_p3", "M 1360 660 L 1320 560", C["t2"][3], WHITE, 4, 0.4))
    g(f'tl.to("#tqb_clip path:first-child",{{stroke:"{GOLD}",duration:0.3,yoyo:true,repeat:1}},{C["t2"][3] + 0.4:.2f});')
    c.sound("clink", C["t2"][3] + 0.4, 0.5)
    hideall(c, ["#tqb", "#tqb_bg", "#tq_l0", "#tq_l1", "#tq_p1", "#tq_l2", "#tq_l3", "#tq_p3"], T["t3"] - 0.2)
    # t3: wide strap vs narrow belt
    s.append(limbx("t3_w", 560, 560, 230, vs=1.7)); s.append(limbx("t3_n", 1360, 560, 230, vs=1.7))
    g('gsap.set("#t3_w_a",{svgOrigin:"502 519"}); gsap.set("#t3_w_vn",{svgOrigin:"463 555"}); gsap.set("#t3_n_a",{svgOrigin:"1302 519"}); gsap.set("#t3_n_vn",{svgOrigin:"1263 555"});')
    c.fade_in("#t3_w", T["t3"] + 0.2, y=20); c.fade_in("#t3_n", T["t3"] + 0.4, y=20)
    s.append(f'<circle id="t3_wb" cx="560" cy="560" r="236" fill="none" stroke="url(#gStrapH)" stroke-width="40" opacity="0"/>')
    s.append(f'<circle id="t3_nb" cx="1360" cy="560" r="234" fill="none" stroke="#6b4a2e" stroke-width="12" opacity="0"/>')
    s.append(L(c, "t3_lw", 560, 230, "wide strap", T["t3"] + 0.3, 44, TEAL))
    s.append(L(c, "t3_ln", 1360, 230, "belt / cloth: narrow", T["t3"] + 0.5, 44, INK))
    c.show("#t3_wb", C["t3"][1] - 0.3); c.show("#t3_nb", C["t3"][1] - 0.3)
    c.g(f'tl.to("#t3_w_a, #t3_w_vn",{{scaleY:0.2,scaleX:1.3,duration:0.8}},{C["t3"][1] + 0.3:.2f});')
    c.g(f'tl.to("#t3_n_vn",{{scaleY:0.2,scaleX:1.3,duration:0.8}},{C["t3"][2]:.2f});')
    spulse(c, "#t3_n_a", C["t3"][2] + 0.6, t1 - 0.5, 1.2, 0.8)
    s.append(chip("t3_c1", 560, 880, "artery + veins shut", GREEN, 36)); c.fade_in("#t3_c1", C["t3"][1] + 0.9, y=10)
    s.append(chip("t3_c2", 1360, 880, "veins shut, artery OPEN", CORAL, 36)); c.fade_in("#t3_c2", C["t3"][2] + 0.4, y=10)
    s.append(chip("t3_c3", 1360, 990, "bleeding gets WORSE", CORAL, 44)); c.pop("#t3_c3", C["t3"][2] + 2.6)
    s.append(chip("t3_c4", 960, 140, "improvise only if there's nothing else", GOLD, 34)); c.fade_in("#t3_c4", C["t3"][3] + 1.2, y=10)
    hideall(c, ["#t3_w", "#t3_n", "#t3_wb", "#t3_nb", "#t3_lw", "#t3_ln", "#t3_c1", "#t3_c2", "#t3_c3", "#t3_c4"], t1 - 0.3)
    return "".join(s)


TQX, TQT, TQB = 860, 458, 652     # tourniquet on his forearm in the close up (2 to 3 in above the gauze)
TQ2X = 760                         # the second one, just above the first


def cu_group(id):
    return (f'<g id="{id}" opacity="0"><g id="{id}_k"><image href="a_cu.jpg" x="0" y="-2" width="1920" height="1084" preserveAspectRatio="xMidYMid slice"/>'
            + strap_on_arm(f"{id}_tq", TQX, TQT, TQB) + strap_on_arm(f"{id}_tq2", TQ2X, TQT - 4, TQB - 2, tag=False)
            + '</g></g>')


def place(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "place")
    s = [cu_group("g_cu")]
    g('gsap.set("#g_cu_k",{svgOrigin:"0 0"});')
    c.scene("#g_cu", t0 - 0.2, T["w2"] - 0.1, 0.5)
    ken(c, "g_cu", t0 - 0.2, T["w2"], 1.0, 1.06, 0, 0, -60, -20)
    s.append('<rect id="cu_fadeT" x="0" y="0" width="1920" height="300" fill="url(#fadeT)" opacity="0"/>'); c.show("#cu_fadeT", t0, 0.5)
    # {1} two to three inches above the wound, toward the heart
    s.append(f'<g id="w1_br" opacity="0"><path d="M 990 400 L 990 380 L {TQX} 380 L {TQX} 400" stroke="{GOLD}" stroke-width="6" fill="none"/>'
             f'<text x="{(990 + TQX) / 2:.0f}" y="355" text-anchor="middle" font-family="Inter" font-weight="900" font-size="44" fill="{GOLD}">2–3 in</text></g>')
    c.fade_in("#w1_br", C["w1"][1], y=10)
    s.append(arrow("w1_ah", 820, 300, 520, 300, WHITE, 6, "ahw")); c.draw("#w1_ah", C["w1"][1] + 1.0, 0.6)
    s.append(L(c, "w1_ht", 670, 270, "toward the heart", C["w1"][1] + 1.0, 34, WHITE))
    s.append(L(c, "w1_hs", 760, 770, "on healthy skin above the wound", C["w1"][1] + 2.6, 32, WHITE))
    # {2} never over a joint: his elbow lights red
    s.append(f'<ellipse id="w1_el" cx="560" cy="520" rx="70" ry="130" fill="#ff3b3b" opacity="0"/>')
    c.g(f'tl.to("#w1_el",{{opacity:.35,duration:0.4,yoyo:true,repeat:3}},{C["w1"][2]:.2f}); tl.to("#w1_el",{{opacity:.3,duration:0.3}},{C["w1"][2] + 1.7:.2f});')
    s.append(cross("w1_ex", 560, 330, 1.1)); c.pop("#w1_ex", C["w1"][2] + 0.3)
    s.append(chip("w1_j", 560, 860, "elbow or knee: bone + tendon shield the artery", CORAL, 30)); c.fade_in("#w1_j", C["w1"][2] + 1.4, y=10)
    hideall(c, ["#w1_el", "#w1_ex", "#w1_j", "#w1_ah", "#w1_ht", "#w1_hs"], C["w1"][3] - 0.2)
    # {3} his cut is near the wrist: the tourniquet goes on a few inches toward the elbow
    g(f'tl.fromTo("#g_cu_tq",{{opacity:0,y:-40}},{{opacity:1,y:0,duration:0.6,ease:"power2.out"}},{C["w1"][3] + 0.6:.2f});')
    c.sound("cloth_real", C["w1"][3] + 0.6, 0.5)
    g(f'tl.set("#g_cu_tq_tag",{{opacity:0}},{t0:.2f});')
    hideall(c, ["#w1_br"], T["w2"] - 0.3)
    # w2: high and tight, shown on a body map
    bg_teach(c, T["w2"] - 0.4, T["w5"])
    BX, BT, BS = 700, 120, 1.0
    s.append(body("w2_b", BX, BT, BS)); c.fade_in("#w2_b", T["w2"] + 0.1, y=20)
    AX = BX - 176 * BS                     # his right arm (viewer's left), roughly vertical
    s.append(f'<ellipse id="w2_wd" cx="{BX - 182*BS:.0f}" cy="{BT + 490*BS:.0f}" rx="12" ry="20" fill="url(#gDrop)" opacity="0"/>'); c.fade_in("#w2_wd", T["w2"] + 0.4, y=0)
    for i, tx in enumerate(["amputation", "more than one wound", "can't tell where it's from"]):
        s.append(chip(f"w2_c{i}", 1400, 330 + i * 130, tx, WHITE, 42))
        c.fade_in(f"#w2_c{i}", C["w2"][i + 1], y=12)
    def band(id, x, y, w=52, op=0):
        return (f'<g id="{id}" opacity="{op}" filter="url(#soft)"><rect x="{x - w/2:.0f}" y="{y - 16:.0f}" width="{w}" height="32" rx="8" fill="url(#gStrapH)"/>'
                f'<rect x="{x - 30:.0f}" y="{y - 7:.0f}" width="60" height="14" rx="6" fill="url(#gRod)"/><rect x="{x + w/2 - 4:.0f}" y="{y - 10:.0f}" width="14" height="20" rx="4" fill="#d32f3a"/></g>')
    s.append(band("w2_tq", BX - 146 * BS, BT + 250 * BS))
    g(f'tl.fromTo("#w2_tq",{{opacity:0,y:240}},{{opacity:1,y:0,duration:0.9,ease:"power2.inOut"}},{C["w2"][4]:.2f});')
    s.append(chip("w2_ht", 1400, 760, "→ high and tight", GOLD, 48)); c.pop("#w2_ht", C["w2"][4] + 0.8)
    hideall(c, ["#w2_tq", "#w2_ht", "#w2_c0", "#w2_c1", "#w2_c2"], T["w3"] - 0.2)
    # w3: how tight: bleeding stops AND the distal pulse is gone
    s.append(band("w3_tq", BX - 176 * BS, BT + 410 * BS)); c.fade_in("#w3_tq", T["w3"] + 0.2, y=-20)
    s.append(f'<circle id="w3_pr" cx="{BX - 184*BS:.0f}" cy="{BT + 535*BS:.0f}" r="20" fill="none" stroke="{GOLD}" stroke-width="5" opacity="0"/>')
    s.append(chip("w3_c1", 1400, 330, "bleeding stops", GREEN, 46)); c.pop("#w3_c1", C["w3"][1])
    s.append(chip("w3_c2", 1400, 460, "+ distal pulse gone", GOLD, 46)); c.pop("#w3_c2", C["w3"][1] + 0.9)
    c.g(f'tl.fromTo("#w3_pr",{{opacity:1,attr:{{r:16}}}},{{attr:{{r:40}},opacity:0,duration:0.7,repeat:5,ease:"sine.out"}},{C["w3"][1] + 1.6:.2f});')
    g(f'tl.to("#w2_b, #w2_wd, #w3_tq, #w3_pr",{{scale:1.3,svgOrigin:"{BX - 176*BS:.0f} {BT + 180*BS:.0f}",duration:{T["w4"] - T["w3"] - 0.4:.2f},ease:"sine.inOut"}},{T["w3"] + 0.2:.2f});')
    s.append(L(c, "w3_pl", 1400, 590, "the pulse below it: wrist (arm) or foot (leg)", C["w3"][1] + 2.4, 32, WHITE))
    hideall(c, ["#w2_b", "#w2_wd", "#w3_tq", "#w3_c1", "#w3_c2", "#w3_pl"], T["w4"] - 0.2)
    # w4: the inside of the arm
    s.append(mechanism(c))
    # w5: back on his arm; it will hurt
    tw5 = T["w5"] - 0.3
    c.g(f'tl.to("#g_cu",{{opacity:1,duration:0.5}},{tw5:.2f}); tl.set("#cu_fadeT",{{opacity:1}},{tw5:.2f});')
    focus(c, "g_cu", tw5, 900, 560, 1.25, 0.1)
    ken(c, "g_cu", tw5 + 0.1, T["q2q"], 1.25, 1.32, 960 - 900 * 1.25, 540 - 560 * 1.25, 960 - 880 * 1.32, 540 - 560 * 1.32)
    s.append(chip("w5_c1", 960, 160, "it will hurt: tell him first", WHITE, 42)); c.fade_in("#w5_c1", C["w5"][1], y=10)
    s.append(chip("w5_c2", 960, 270, "pain is not a reason to loosen it", GOLD, 42)); c.pop("#w5_c2", C["w5"][2])
    hideall(c, ["#w5_c1", "#w5_c2", "#g_cu", "#cu_fadeT"], T["q2q"] - 0.3)
    # quick check 2: a wound just below the knee
    bg_teach(c, T["q2q"] - 0.4, t1 + 0.2)
    s.append(qcheck(c, "qc2", "q2q", ["Spurting cut just below the knee.", "2–3 in up lands ON the knee. Where?"], y=170, size=48))
    LX, LY, LS = 380, 820, 1.05
    s.append(leg_diagram("qc2_leg", LX, LY, LS)); c.fade_in("#qc2_leg", C["q2q"][1], y=20)
    KX = LX + 530 * LS; WX = LX + 650 * LS
    s.append(f'<ellipse id="qc2_wd" cx="{WX:.0f}" cy="{LY - 60:.0f}" rx="34" ry="14" fill="url(#gDrop)" opacity="0"/>'); c.fade_in("#qc2_wd", C["q2q"][1] + 0.3, y=0)
    s.append(L(c, "qc2_kl", KX, LY + 150, "knee", C["q2q"][1] + 0.6, 34, WHITE))
    s.append(f'<g id="qc2_br" opacity="0"><path d="M {WX:.0f} {LY - 120:.0f} L {WX:.0f} {LY - 140:.0f} L {KX:.0f} {LY - 140:.0f} L {KX:.0f} {LY - 120:.0f}" stroke="{CORAL}" stroke-width="6" fill="none"/></g>')
    c.fade_in("#qc2_br", C["q2q"][2], y=0)
    s.append(f'<ellipse id="qc2_kz" cx="{KX:.0f}" cy="{LY:.0f}" rx="55" ry="90" fill="#ff3b3b" opacity="0"/>')
    c.g(f'tl.to("#qc2_kz",{{opacity:.35,duration:0.4}},{C["q2q"][2] + 0.5:.2f});')
    s.append(f'<g id="qc2_tq" opacity="0" filter="url(#soft)"><rect x="{KX - 200:.0f}" y="{LY - 100:.0f}" width="70" height="200" rx="12" fill="url(#gStrap)"/>'
             f'<rect x="{KX - 177:.0f}" y="{LY - 160:.0f}" width="24" height="90" rx="10" fill="url(#gRod)"/></g>')
    c.g(f'tl.fromTo("#qc2_tq",{{opacity:0,x:200}},{{opacity:1,x:0,duration:0.8,ease:"power2.inOut",immediateRender:false}},{T["q2a"] + 0.2:.2f});')
    s.append(W(c, "qc2_a1", 320, 590, "on the thigh, above the knee", T["q2a"] + 0.3, 50, GREEN))
    s.append(W(c, "qc2_a2", 320, 660, "never on the joint itself", C["q2a"][1], 40, WHITE))
    hideall(c, ["#qc2_g", "#qc2_leg", "#qc2_wd", "#qc2_kl", "#qc2_br", "#qc2_kz", "#qc2_tq", "#qc2_a1", "#qc2_a2"], t1 - 0.3)
    return "".join(s)


def mechanism(c):
    T, C, g = c.T, c.C, c.g
    t0 = T["w4"] - 0.2; tE = T["w5"] - 0.3
    X0, X1, SX, SW = 160, 1760, 700, 90       # limb span, strap x and width
    AY, VY_, R_ = 520, 640, 24
    s = ['<g id="g_mx" opacity="0">']
    # the limb, lengthwise (proximal part and distal part so the distal part can swell)
    s.append(f'<path d="M {X0 + 60} 400 L {SX + 20} 400 L {SX + 20} 760 L {X0 + 60} 760 Q {X0} 760 {X0} 700 L {X0} 460 Q {X0} 400 {X0 + 60} 400 Z" fill="url(#gLimb)" filter="url(#soft)"/>')
    dp = f'M {SX} 400 L {X1 - 60} 400 Q {X1} 400 {X1} 460 L {X1} 700 Q {X1} 760 {X1 - 60} 760 L {SX} 760 Z'
    s.append(f'<g id="mx_dist"><path d="{dp}" fill="url(#gLimb)"/><path id="mx_cong" d="{dp}" fill="#8a1a3a" opacity="0"/></g>')
    s.append(f'<rect x="{X0 + 20}" y="410" width="{X1 - X0 - 40}" height="8" rx="4" fill="#fff" opacity=".35"/>')
    # vessels in three pieces: before the strap, under it, after it
    for nm, y, grd in (("a", AY, "gArtL"), ("v", VY_, "gVeinL")):
        s.append(f'<rect x="{X0}" y="{y - R_ - 5}" width="{SX - X0}" height="{2*R_ + 10}" fill="url(#gWall)"/><rect x="{X0}" y="{y - R_}" width="{SX - X0}" height="{2*R_}" fill="url(#{grd})"/>')
        s.append(f'<g id="mx_{nm}m"><rect x="{SX}" y="{y - R_ - 5}" width="{SW}" height="{2*R_ + 10}" fill="url(#gWall)"/><rect x="{SX}" y="{y - R_}" width="{SW}" height="{2*R_}" fill="url(#{grd})"/></g>')
        s.append(f'<rect x="{SX + SW}" y="{y - R_ - 5}" width="{X1 - SX - SW - 60}" height="{2*R_ + 10}" fill="url(#gWall)"/><rect x="{SX + SW}" y="{y - R_}" width="{X1 - SX - SW - 60}" height="{2*R_}" fill="url(#{grd})"/>')
        for side, xa, xb in (("p", X0, SX), ("d", SX + SW, X1 - 60)):
            s.append(f'<clipPath id="mxc_{nm}{side}"><rect x="{xa}" y="{y - R_}" width="{xb - xa}" height="{2*R_}"/></clipPath>')
            s.append(f'<g clip-path="url(#mxc_{nm}{side})">' + cells(f"mxl_{nm}{side}", xa, xb, y, R_, 9, dark=(nm == "v"), seed=ord(side) + len(nm)) + '</g>')
    # the wound near the hand end, from the artery side
    WX_ = 1500
    s.append(f'<path d="M {WX_ - 10} 400 L {WX_ - 6} {AY - R_} L {WX_ + 6} {AY - R_} L {WX_ + 10} 400 Z" fill="{DRED}"/>')
    for i in range(5):
        s.append(drop(f"mxd_{i}", WX_, 380, 0.9 - i * 0.08))
    s.append(ring("mx_pr", 1660, 580, 30, GOLD, 7))
    s.append(f'<g id="mx_strap" opacity="0" filter="url(#soft)"><rect x="{SX}" y="372" width="{SW}" height="416" rx="16" fill="url(#gStrap)"/>'
             f'<rect x="{SX + SW/2 - 14}" y="300" width="28" height="110" rx="12" fill="url(#gRod)"/></g>')
    s.append('</g>')
    g(f'gsap.set("#mx_am",{{svgOrigin:"{SX + SW/2} {AY}"}}); gsap.set("#mx_vm",{{svgOrigin:"{SX + SW/2} {VY_}"}}); gsap.set("#mx_dist",{{svgOrigin:"{SX} 580"}}); gsap.set("[id^=mxd_]",{{svgOrigin:"{WX_} 380"}}); gsap.set("#mx_strap",{{svgOrigin:"{SX + SW/2} 580"}});')
    c.scene("#g_mx", t0, tE, 0.5)
    s.append(L(c, "mx_h", 230, 360, "← heart", T["w4"] + 0.2, 36, WHITE, anchor="start"))
    s.append(L(c, "mx_w", WX_, 300, "wound", T["w4"] + 0.2, 40, WHITE))
    s.append(L(c, "mx_al", 190, AY + 10, "artery: in, high pressure", T["w4"] + 0.4, 28, "#ffe0d8", anchor="start"))
    s.append(L(c, "mx_vl", 190, VY_ + 10, "vein: out, low pressure", C["w4"][1], 28, "#ffd0d0", anchor="start"))
    # flow: artery cells run toward the hand (pumped), vein cells run back toward the heart
    fa_p = flow(c, "#mxl_ap", T["w4"], tE, SX - X0, 0.9)
    flow(c, "#mxl_ad", T["w4"], C["w4"][5] + 0.5, X1 - 60 - SX - SW, 0.9)
    flow(c, "#mxl_vp", T["w4"], C["w4"][2] + 0.4, -(SX - X0), 3.2)
    flow(c, "#mxl_vd", T["w4"], C["w4"][2] + 0.4, -(X1 - 60 - SX - SW), 3.2)
    def spurts(ta, tb, big=1.0):
        tt = ta
        while tt < tb - 0.3:
            for i in range(5):
                g(f'tl.fromTo("#mxd_{i}",{{opacity:1,x:0,y:0}},{{keyframes:[{{x:{(i - 2)*18*big:.0f},y:{-90*big + i*6:.0f},duration:0.3,ease:"power2.out"}},{{x:{(i - 2)*34*big:.0f},y:-10,opacity:0,duration:0.35,ease:"power2.in"}}],immediateRender:false}},{tt + i*0.04:.2f});')
            tt += 0.8
    spurts(T["w4"] + 0.3, C["w4"][4], 0.8)
    g('gsap.set("#mx_pr",{svgOrigin:"1660 580"});'); spulse(c, "#mx_pr", T["w4"] + 0.5, C["w4"][6] - 0.2, 1.4, 0.8)
    g(f'tl.to("#mx_pr",{{opacity:1,duration:0.3}},{T["w4"] + 0.5:.2f});')
    # {2} a loose strap: the veins close first
    c.g(f'tl.fromTo("#mx_strap",{{opacity:0,y:-200}},{{opacity:1,y:0,duration:0.6,ease:"power2.out"}},{C["w4"][2] - 0.3:.2f});')
    c.g(f'tl.to("#mx_vm",{{scaleY:0.08,duration:0.6}},{C["w4"][2] + 0.1:.2f});')
    s.append(chip("mx_c1", 745, 860, "loose: veins shut", CORAL, 36)); c.fade_in("#mx_c1", C["w4"][2] + 0.2, y=10)
    # {3} artery still pumping in (it keeps flowing)
    s.append(chip("mx_c2", 745, 250, "artery still pumping in", BRED, 36)); c.fade_in("#mx_c2", C["w4"][3], y=10)
    # {4} the limb fills up, the wound bleeds harder
    c.g(f'tl.to("#mx_dist",{{scaleY:1.08,duration:1.6,ease:"sine.inOut"}},{C["w4"][4]:.2f}); tl.to("#mx_cong",{{opacity:.35,duration:1.6}},{C["w4"][4]:.2f});')
    spurts(C["w4"][4], C["w4"][5] + 0.3, 1.35)
    s.append(chip("mx_c3", 1480, 860, "fills up, bleeds HARDER", CORAL, 36)); c.pop("#mx_c3", C["w4"][4] + 1.2)
    c.sound("wrong", C["w4"][4] + 1.2, 0.35)
    # {5} tighter: the artery closes too
    c.g(f'tl.to("#mx_strap",{{scaleX:0.82,duration:0.5}},{C["w4"][5] - 0.2:.2f}); tl.to("#mx_am",{{scaleY:0.08,duration:0.6}},{C["w4"][5]:.2f});')
    hideall(c, ["#mx_c1", "#mx_c2", "#mx_c3"], C["w4"][5] - 0.1)
    s.append(chip("mx_c4", 745, 250, "tight: artery shut too", GREEN, 36)); c.fade_in("#mx_c4", C["w4"][5] + 0.2, y=10)
    c.g(f'tl.to("#mxl_ad",{{opacity:0,duration:1.2}},{C["w4"][5] + 0.5:.2f});')
    # {6} nothing gets in: bleeding stops, the distal pulse is gone
    c.g(f'tl.to("#mx_pr",{{opacity:0.15,duration:0.5}},{C["w4"][6]:.2f}); tl.to("#mx_cong",{{opacity:.1,duration:1.0}},{C["w4"][6]:.2f});')
    s.append(chip("mx_c5", 1480, 860, "bleeding stops · pulse gone", GREEN, 36)); c.pop("#mx_c5", C["w4"][6] + 0.3)
    c.sound("check", C["w4"][6] + 0.3, 0.4)
    hideall(c, ["#mx_h", "#mx_w", "#mx_al", "#mx_vl", "#mx_c4", "#mx_c5"], tE - 0.3)
    return "".join(s)


def after(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "after")
    s = [cu_group("g_cf")]
    g('gsap.set("#g_cf_k",{svgOrigin:"0 0"}); gsap.set("#g_cf_tq2",{opacity:0});')
    c.scene("#g_cf", t0 - 0.2, t1 + 0.3, 0.5)
    g(f'tl.set("#g_cf_tq",{{opacity:1}},{t0 - 0.2:.2f});')
    ken(c, "g_cf", t0 - 0.2, C["f1"][1], 1.0, 1.4, 0, 0, 960 - TQX * 1.4, 540 - 640 * 1.4)
    s.append('<rect id="cf_fadeT" x="0" y="0" width="1920" height="300" fill="url(#fadeT)" opacity="0"/>'); c.show("#cf_fadeT", t0, 0.5)
    # {1} the time, written on the tourniquet's tag (camera frames the tag)
    c.g(f'tl.to("#g_cf_tq_tm",{{opacity:1,duration:0.6}},{C["f1"][1] + 0.2:.2f});'); c.sound("pen_scratch_real", C["f1"][1] + 0.2, 0.5)
    s.append(chip("cf_c1", 960, 170, "time on the tourniquet", WHITE, 40)); c.fade_in("#cf_c1", C["f1"][1], y=10)
    s.append(chip("cf_c2", 960, 280, "+ in your report", WHITE, 40)); c.fade_in("#cf_c2", C["f1"][2], y=10)
    s.append(chip("cf_c3", 960, 880, "say it at handoff: “on at 16:42”", GOLD, 40)); c.fade_in("#cf_c3", C["f1"][3], y=10)
    s.append(chip("cf_c4", 960, 990, "longer on = more risk to the limb", CORAL, 36)); c.fade_in("#cf_c4", C["f1"][3] + 2.0, y=10)
    hideall(c, ["#cf_c1", "#cf_c2", "#cf_c3", "#cf_c4"], T["f2"] - 0.2)
    # f2: never covered
    focus(c, "g_cf", T["f2"] - 0.3, 900, 560, 1.1, 1.0)
    s.append(f'<g id="cf_bl" opacity="0" filter="url(#soft)"><path d="M 560 330 C 760 300 1000 320 1180 340 L 1200 800 C 1000 820 760 800 540 790 Z" fill="#7d8fb3"/>'
             + "".join(f'<path d="M {600 + i*120} 340 C {640 + i*120} 500 {600 + i*120} 650 {630 + i*120} 790" stroke="#62749a" stroke-width="5" fill="none"/>' for i in range(5)) + '</g>')
    c.g(f'tl.fromTo("#cf_bl",{{opacity:0,x:-600}},{{opacity:1,x:0,duration:1.2,ease:"power1.out",immediateRender:false}},{C["f2"][1] - 0.2:.2f});')
    s.append(cross("cf_bx", 880, 560, 1.4)); c.pop("#cf_bx", C["f2"][1] + 0.5); c.sound("wrong", C["f2"][1] + 0.5, 0.35)
    c.g(f'tl.to("#cf_bl",{{x:-1400,opacity:0,duration:1.0,ease:"power1.in"}},{C["f2"][2] - 0.4:.2f});'); c.hide("#cf_bx", C["f2"][2] - 0.2)
    s.append(chip("cf_v", 960, 170, "leave it where people can see it", GREEN, 40)); c.fade_in("#cf_v", C["f2"][2], y=10)
    s.append(chip("cf_l", 960, 960, "don't loosen it · don't take it off", GOLD, 40)); c.pop("#cf_l", C["f2"][3])
    s.append(chip("cf_l2", 960, 860, "loosen it and the bleeding starts again", CORAL, 32)); c.fade_in("#cf_l2", C["f2"][3] + 2.5, y=10)
    hideall(c, ["#cf_v", "#cf_l", "#cf_l2"], T["f3"] - 0.2)
    # f3: a second one, just above the first
    s.append(chip("cf_s0", 960, 170, "as tight as it goes, still bleeding?", WHITE, 40)); c.fade_in("#cf_s0", T["f3"] + 0.2, y=10)
    g(f'tl.fromTo("#g_cf_tq2",{{opacity:0,y:-40}},{{opacity:1,y:0,duration:0.6,ease:"power2.out"}},{C["f3"][1] + 0.2:.2f});')
    c.sound("cloth_real", C["f3"][1] + 0.2, 0.5)
    s.append(chip("cf_s1", 960, 960, "second tourniquet, right above the first", GOLD, 40)); c.pop("#cf_s1", C["f3"][1] + 0.5)
    hideall(c, ["#cf_s0", "#cf_s1", "#cf_fadeT"], t1 - 0.3)
    return "".join(s)


def pack(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "pack")
    bg_teach(c, t0 - 0.3, t1 + 0.2)
    BX, BT, BS = 960, 150, 0.92
    s = [body("pk_b", BX, BT, BS)]
    c.fade_in("#pk_b", T["k1"] + 0.2, y=20)
    gy = BT + 545 * BS; ay = BT + 262 * BS
    s.append(glowspot("pk_g", BX + 62 * BS, BT + 505 * BS, 58)); s.append(glowspot("pk_a1", BX - 124 * BS, ay, 50)); s.append(glowspot("pk_a2", BX + 124 * BS, ay, 50))
    c.g(f'tl.to("#pk_g",{{opacity:1,duration:0.4}},{C["k1"][1]:.2f});')
    c.g(f'tl.to("#pk_a1, #pk_a2",{{opacity:1,duration:0.4}},{C["k1"][2]:.2f});')
    s.append(L(c, "pk_gl", BX + 300, BT + 515 * BS, "groin", C["k1"][1], 44, WHITE, anchor="start"))
    s.append(L(c, "pk_al", BX + 300, ay, "armpit", C["k1"][2], 44, WHITE, anchor="start"))
    s.append(chip("pk_j", 960, 1000, "junctional: where a limb meets the body", GOLD, 38)); c.fade_in("#pk_j", C["k1"][3], y=10)
    s.append(chip("pk_n", 420, 560, "no limb to wrap", CORAL, 38)); c.fade_in("#pk_n", T["k1"] + 0.8, y=10)
    hideall(c, ["#pk_b", "#pk_g", "#pk_a1", "#pk_a2", "#pk_gl", "#pk_al", "#pk_j", "#pk_n"], T["k2"] - 0.2)
    # k2: packing a wound cavity, cross section
    X, Y, Wd, Hh = 360, 380, 1200, 560
    s.append('<g id="pk_x" opacity="0">' + tissue("pkt", X, Y, Wd, Hh, 860, 30))
    s.append(f'<path d="M 860 {Y} C 880 {Y + 160} 900 {Y + 300} 930 {Y + 430} L 990 {Y + 430} C 1020 {Y + 300} 1040 {Y + 160} 1060 {Y} Z" fill="#4a0812"/>')
    s.append(f'<circle id="pk_src" cx="960" cy="{Y + 455}" r="26" fill="url(#gArt)" stroke="#ffd0c8" stroke-width="3"/>')
    s.append(glowspot("pk_sg", 960, Y + 440, 60))
    s.append(f'<clipPath id="pkcav"><path d="M 860 {Y - 40} L 1060 {Y - 40} L 1060 {Y} C 1040 {Y + 160} 1020 {Y + 300} 990 {Y + 434} L 930 {Y + 434} C 900 {Y + 300} 880 {Y + 160} 860 {Y} Z"/></clipPath>')
    zz = [f"M 960 {Y + 430}"]
    yy = Y + 420
    while yy > Y + 10:
        half = 18 + (Y + 430 - yy) * 0.22
        zz.append(f"L {960 - half:.0f} {yy - 14:.0f} L {960 + half:.0f} {yy - 28:.0f}"); yy -= 30
    s.append(f'<linearGradient id="gGzS" gradientUnits="userSpaceOnUse" x1="0" y1="{Y}" x2="0" y2="{Y + 440}"><stop offset="0" stop-color="#f6f3ea"/><stop offset=".7" stop-color="#efe6dc"/><stop offset="1" stop-color="#d98a8a"/></linearGradient>'
             '<pattern id="pWeave" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 0 5 L 10 5 M 5 0 L 5 10" stroke="#cfc6b4" stroke-width="1.5"/></pattern>')
    s.append(f'<clipPath id="pkfill"><rect id="pkfill_r" x="800" y="{Y + 440}" width="320" height="0"/></clipPath>')
    s.append(f'<g clip-path="url(#pkcav)"><g id="pk_strip" opacity="0"><clipPath id="pkst"><rect id="pkst_r" x="940" y="{Y - 40}" width="40" height="0"/></clipPath><g clip-path="url(#pkst)"><rect x="944" y="{Y - 40}" width="32" height="480" rx="6" fill="url(#gGzS)"/><rect x="944" y="{Y - 40}" width="32" height="480" fill="url(#pWeave)" opacity=".7"/></g></g>'
             f'<g clip-path="url(#pkfill)"><path id="pk_gz" d="{" ".join(zz)}" stroke="url(#gGzS)" stroke-width="30" fill="none" stroke-linejoin="round"/>'
             f'<path d="{" ".join(zz)}" stroke="#cfc6b4" stroke-width="2" stroke-dasharray="3 5" fill="none"/>'
             f'<path d="{" ".join(zz)}" stroke="#b9ae98" stroke-width="2" fill="none" transform="translate(0 12)" opacity=".6"/></g></g>')
    s.append(f'<g id="pk_gzt" opacity="0"><rect x="944" y="{Y - 220}" width="32" height="190" rx="6" fill="#f6f3ea"/><rect x="944" y="{Y - 220}" width="32" height="190" fill="url(#pWeave)" opacity=".7"/></g>')
    s.append('</g>')
    c.fade_in("#pk_x", T["k2"] + 0.1, y=20)
    c.g(f'tl.fromTo("#pk_sg",{{opacity:.9}},{{opacity:.25,duration:0.4,repeat:{int((C["k2"][3] + 3 - T["k2"]) / 0.8)},yoyo:true,immediateRender:false}},{T["k2"] + 0.2:.2f});')
    s.append(L(c, "pk_l1", 1300, 300, "gauze INTO the wound", C["k2"][1], 42, WHITE, anchor="start"))
    c.show("#pk_gzt", C["k2"][1] - 0.1)
    s.append(chip("pk_l2", 1330, Y + 455, "← down to the source", BRED, 34)); c.fade_in("#pk_l2", C["k2"][2], y=10)
    c.g(f'tl.set("#pk_strip",{{opacity:1}},{C["k2"][1]:.2f}); tl.to("#pkst_r",{{attr:{{height:{480}}},duration:{C["k2"][3] - C["k2"][1] - 0.2:.2f},ease:"sine.inOut"}},{C["k2"][1]:.2f});')
    c.g(f'tl.to("#pkfill_r",{{attr:{{y:{Y - 40},height:{480}}},duration:3.0,ease:"none"}},{C["k2"][3]:.2f});')
    c.sound("cloth_real", C["k2"][1], 0.4); c.sound("cloth_real", C["k2"][3], 0.4)
    s.append(L(c, "pk_l3", 1300, 362, "packed tight", C["k2"][3] + 1.6, 42, GREEN, anchor="start"))
    c.g(f'tl.to("#pk_sg",{{opacity:0,duration:0.6}},{C["k2"][3] + 2.8:.2f});')
    hideall(c, ["#pk_l1", "#pk_l2", "#pk_l3"], T["k3"] - 0.2)
    # k3: press on top, with a timer
    s.append(glove_palm("pk_h", 840, Y - 170, 240, 110))
    c.g(f'tl.fromTo("#pk_h",{{opacity:1,y:-100}},{{y:60,duration:0.6,ease:"power2.in",immediateRender:false}},{T["k3"] + 0.3:.2f});')
    c.hide("#pk_gzt", T["k3"] + 0.3, 0.3)
    s.append(f'<g id="pk_tm" opacity="0"><circle cx="1460" cy="560" r="110" fill="{FILL}" stroke="#3b4a66" stroke-width="12"/>'
             f'<circle id="pk_tr" cx="1460" cy="560" r="110" fill="none" stroke="{GOLD}" stroke-width="12" stroke-dasharray="691.2" stroke-dashoffset="0" transform="rotate(-90 1460 560)"/>'
             f'<text x="1460" y="580" text-anchor="middle" font-family="Inter" font-weight="900" font-size="56" fill="{WHITE}">3:00</text></g>')
    c.fade_in("#pk_tm", C["k3"][1], y=10)
    g(f'tl.to("#pk_x, #pk_h",{{scale:1.1,svgOrigin:"960 640",duration:{C["k3"][3] - T["k3"] - 0.4:.2f},ease:"sine.inOut"}},{T["k3"] + 0.4:.2f});')
    c.g(f'tl.fromTo("#pk_tr",{{strokeDashoffset:0}},{{strokeDashoffset:691.2,duration:{C["k3"][2] - C["k3"][1]:.2f},ease:"none",immediateRender:false}},{C["k3"][1]:.2f});')
    s.append(L(c, "pk_h1", 1460, 740, "hemostatic: at least 3 min", C["k3"][1] + 0.3, 34, GOLD))
    s.append(L(c, "pk_h2", 1460, 800, "plain: until it's controlled", C["k3"][2], 34, WHITE))
    hideall(c, ["#pk_x", "#pk_h", "#pk_tm", "#pk_h1", "#pk_h2"], C["k3"][3] - 0.2)
    # {3} gauze laid on top is a dressing, not packing
    s.append('<g id="pk_y" opacity="0">' + tissue("pky", X, Y, Wd, Hh, 860, 30)
             + f'<path d="M 860 {Y} C 880 {Y + 160} 900 {Y + 300} 930 {Y + 430} L 990 {Y + 430} C 1020 {Y + 300} 1040 {Y + 160} 1060 {Y} Z" fill="#7a1020"/>'
             + gauze("pk_yg", 820, Y - 46, 280, 44, op=1) + '</g>')
    c.fade_in("#pk_y", C["k3"][3] - 0.1, y=10)
    s.append(cross("pk_yx", 1460, 250, 1.1)); c.pop("#pk_yx", C["k3"][3] + 0.8)
    s.append(L(c, "pk_yl", 960, 260, "on top = a dressing, not packing", C["k3"][3] + 0.4, 42, CORAL))
    hideall(c, ["#pk_y", "#pk_yx", "#pk_yl"], T["k4"] - 0.2)
    # k4: never the chest or belly; the neck is its own case
    s.append(body("pk_b2", BX, BT, BS)); c.fade_in("#pk_b2", T["k4"] + 0.1, y=20)
    cy_ = BT + 300 * BS; by_ = BT + 440 * BS
    s.append(f'<g id="pk_cz" opacity="0"><ellipse cx="{BX}" cy="{cy_:.0f}" rx="105" ry="85" fill="#ff3b3b" opacity=".35"/><ellipse cx="{BX}" cy="{by_:.0f}" rx="100" ry="70" fill="#ff3b3b" opacity=".35"/></g>')
    c.fade_in("#pk_cz", C["k4"][1], y=0)
    s.append(chip("pk_np", 470, 400, "never pack: chest, belly", CORAL, 40)); c.pop("#pk_np", C["k4"][1] + 0.2)
    s.append(L(c, "pk_r1", 470, 520, "nothing solid to pack against", C["k4"][1] + 1.8, 30, WHITE))
    s.append(L(c, "pk_r2", 470, 570, "can't press on what's inside", C["k4"][1] + 5.0, 30, WHITE))
    hideall(c, ["#pk_cz", "#pk_np", "#pk_r1", "#pk_r2"], C["k4"][2] - 0.2)
    ny = BT + 148 * BS
    s.append(glowspot("pk_ng", BX, ny, 60)); c.g(f'tl.to("#pk_ng",{{opacity:1,duration:0.4}},{C["k4"][2]:.2f});')
    g(f'tl.to("#pk_b2, #pk_ng, #pk_oc, #pk_oa, #pk_wr, #pk_wx, [id^=pk_air]",{{scale:1.6,svgOrigin:"{BX} {ny:.0f}",duration:{T["rc"] - C["k4"][2] - 1.0:.2f},ease:"sine.inOut"}},{C["k4"][2] + 0.2:.2f});')
    for k in range(6):
        s.append(f'<circle id="pk_air{k}" cx="{BX + 150 + k*14}" cy="{ny - 40 + (k % 3)*20:.0f}" r="{6 + k % 3}" fill="#e8f6ff" opacity="0"/>')
        g(f'tl.fromTo("#pk_air{k}",{{opacity:0,x:0,y:0}},{{keyframes:[{{opacity:.9,duration:0.3}},{{x:{-140 - k*14},y:{10 - (k % 3)*20},duration:1.4,ease:"power1.in"}},{{opacity:0,duration:0.2}}],repeat:2}},{C["k4"][2] + 0.8 + k*0.25:.2f});')
    s.append(L(c, "pk_nl", 1450, 300, "neck: a torn vein can suck in air", C["k4"][2] + 0.2, 36, WHITE))
    s.append(f'<rect id="pk_oc" x="{BX + 6}" y="{ny - 34:.0f}" width="62" height="58" rx="8" fill="#dff4ff" fill-opacity=".55" stroke="#ffffff" stroke-width="4" opacity="0"/>')
    c.pop("#pk_oc", C["k4"][3])
    s.append(L(c, "pk_ol", 1450, 380, "occlusive dressing: seals air out", C["k4"][3] + 0.2, 36, MINT))
    s.append(arrow("pk_oa", BX + 150, ny - 20, BX + 60, ny - 4, GOLD, 8)); c.draw("#pk_oa", C["k4"][3] + 1.6, 0.4)
    s.append(L(c, "pk_ol2", 1450, 450, "press on that one side", C["k4"][3] + 1.6, 34, GOLD))
    s.append(f'<ellipse id="pk_wr" cx="{BX}" cy="{ny:.0f}" rx="44" ry="16" fill="none" stroke="#e6e0d0" stroke-width="12" opacity="0"/>')
    c.fade_in("#pk_wr", C["k4"][4], y=0)
    s.append(cross("pk_wx", BX + 110, ny - 70, 0.9)); c.pop("#pk_wx", C["k4"][4] + 0.4)
    s.append(L(c, "pk_wl", 1450, 540, "never wrap the neck", C["k4"][4] + 0.4, 40, CORAL))
    hideall(c, [f"#pk_air{k}" for k in range(6)], C["k4"][3] - 0.2)
    hideall(c, ["#pk_b2", "#pk_ng", "#pk_nl", "#pk_oc", "#pk_ol", "#pk_oa", "#pk_ol2", "#pk_wr", "#pk_wx", "#pk_wl"], t1 - 0.3)
    return "".join(s)


def recap(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "recap")
    bg_teach(c, t0 - 0.3, t1 + 0.2)
    s = [box("rc_bg", 120, 150, 1680, 860, GOLD, op=0)]
    c.fade_in("#rc_bg", T["rc"] + 0.1, y=20)
    s.append(f'<rect id="rc_hl" x="150" y="190" width="1620" height="110" rx="20" fill="{GOLD}" opacity="0"/>')
    for i in range(5):
        t = C["rc"][i + 1]
        if i == 0: g(f'tl.to("#rc_hl",{{opacity:.14,duration:0.4}},{t - 0.2:.2f});')
        else: g(f'tl.to("#rc_hl",{{attr:{{y:{190 + i*160}{", height:170" if i == 2 else ", height:110"}}},duration:0.6,ease:"power2.inOut"}},{t - 0.3:.2f});')
    rows = [("small or slow", "press · hold · wrap", WHITE, 1), ("soaks through", "leave it, do more", WHITE, 2),
            ("arm or leg, life threatening", "tourniquet first: 2–3 in above, not on a joint,", GOLD, 3),
            ("groin or armpit", "pack it + press", MINT, 4), ("nosebleed", "lean forward + pinch", GREEN, 5)]
    for i, (a, b, col, n) in enumerate(rows):
        y = 260 + i * 160
        t = C["rc"][n]
        s.append(W(c, f"rc_a{i}", 180, y, a, t, 44, INK))
        s.append(W(c, f"rc_b{i}", 760, y, b, t + 0.6, 40 if i == 2 else 46, col))
        c.sound("pen_scratch_real", t, 0.25)
    s.append(W(c, "rc_b2x", 760, 260 + 2 * 160 + 62, "tight till bleeding + distal pulse stop", C["rc"][3] + 4.5, 40, GOLD))
    hideall(c, ["#rc_bg", "#rc_b2x", "#rc_hl"] + [f"#rc_a{i}" for i in range(5)] + [f"#rc_b{i}" for i in range(5)], t1 - 0.3)
    return "".join(s)


def practice(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "practice")
    bg_teach(c, t0 - 0.3, t1 + 0.2)
    s = []
    s.append(problem(c, "x1", "x1q", "x1a", 1, ["Blood soaking through your gauze (forearm).", "Partner wants to peel it off for a fresh one."],
                     [("stop them: leave it on", 0), ("peeling it tears the forming clot", 1), ("press harder; still bleeding → tourniquet", 2)],
                     ("a fresh dressing feels cleaner, but tears the clot", 2)))
    s.append(problem(c, "x2", "x2q", "x2a", 2, ["Thigh tourniquet: bleeding slowed, didn't stop.", "The foot still has a pulse. What's wrong?"],
                     [("not tight enough", 0), ("veins shut, artery still open", 1), ("twist till both stop, or add a 2nd above", 2)],
                     ("slowed is not stopped", 1)))
    s.append(problem(c, "x3", "x3q", "x3a", 3, ["Stab wound in the groin, pouring.", "Tourniquet, or pack it?"],
                     [("pack it: the groin is junctional", 0), ("gauze in to the source, packed tight", 2), ("then press hard", 2)],
                     ("the tourniquet has nowhere to go", 3)))
    # a small picture for each problem, bottom right
    s.append('<clipPath id="x1cp"><rect x="1330" y="560" width="480" height="290" rx="24"/></clipPath>'
             '<g id="x1_im" opacity="0"><g clip-path="url(#x1cp)"><image href="a_cu.jpg" x="860" y="338" width="1280" height="723"/>'
             '<ellipse cx="1430" cy="520" rx="1" ry="1" fill="none"/></g>'
             f'<rect x="1330" y="560" width="480" height="290" rx="24" fill="none" stroke="{TEAL}" stroke-width="4"/></g>')
    s.append(f'<ellipse id="x1_st" cx="1570" cy="705" rx="36" ry="46" fill="url(#gStain)" opacity="0"/>')
    c.fade_in("#x1_im", C["x1q"][1], y=14); c.g(f'tl.to("#x1_st",{{opacity:.95,duration:2.0}},{C["x1q"][1] + 0.5:.2f});')
    hideall(c, ["#x1_im", "#x1_st"], T["x1a"] + c.D["x1a"] + 0.3)
    s.append(leg_diagram("x2_leg", 1160, 780, 0.64))
    s.append(f'<g id="x2_tq" opacity="0" filter="url(#soft)"><rect x="1304" y="694" width="44" height="170" rx="9" fill="url(#gStrap)"/><rect x="1315" y="656" width="22" height="66" rx="9" fill="url(#gRod)"/></g>')
    s.append(f'<circle id="x2_p" cx="{1160 + 980*0.64:.0f}" cy="{780 - 60*0.64:.0f}" r="16" fill="none" stroke="{GOLD}" stroke-width="5" opacity="0"/>')
    c.fade_in("#x2_leg", C["x2q"][1], y=14); c.fade_in("#x2_tq", C["x2q"][1] + 0.3, y=-10)
    c.g(f'tl.fromTo("#x2_p",{{opacity:1,attr:{{r:12}}}},{{attr:{{r:34}},opacity:0,duration:0.8,repeat:9,ease:"sine.out"}},{C["x2q"][1] + 0.8:.2f});')
    hideall(c, ["#x2_leg", "#x2_tq"], T["x2a"] + c.D["x2a"] + 0.3)
    s.append(body("x3_b", 1570, 470, 0.5)); s.append(glowspot("x3_g", 1570 + 62 * 0.5, 470 + 505 * 0.5, 34))
    c.fade_in("#x3_b", C["x3q"][1], y=14); c.g(f'tl.to("#x3_g",{{opacity:1,duration:0.4}},{C["x3q"][1] + 0.4:.2f});')
    hideall(c, ["#x3_b", "#x3_g"], T["x3a"] + c.D["x3a"] + 0.3)
    return "".join(s)


def outro(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = chapter_span(c, "outro")
    s = [IMG("g_end", "a_s1.jpg")]
    g('gsap.set("#g_end_k",{svgOrigin:"0 0"});')
    c.scene("#g_end", t0 - 0.2, c.TOTAL + 2, 0.6)
    ken(c, "g_end", t0 - 0.2, c.TOTAL, 1.05, 1.15, -40, -20, -160, -80)
    s.append('<rect id="end_f" x="0" y="0" width="1920" height="1080" fill="#050a16" opacity="0"/>')
    c.g(f'tl.to("#end_f",{{opacity:.62,duration:0.8}},{T["end"] + 0.5:.2f});')
    s.append(L(c, "end_t1", 960, 170, "notes + practice for this topic, free on", C["end"][1], 44, WHITE))
    s.append(L(c, "end_t2", 960, 275, "levlprep.com", C["end"][1] + 0.6, 92, MINT, weight=900))
    s.append(chip("end_nx", 960, 960, "next: internal bleeding + catching shock early", GOLD, 42)); c.fade_in("#end_nx", C["end"][2], y=14)
    return "".join(s)


def _no_immediate(line):
    """add immediateRender:false to the to-vars of every tl.fromTo in a line (so nothing shows before its start)"""
    out, i = [], 0
    while True:
        j = line.find("tl.fromTo(", i)
        if j < 0: out.append(line[i:]); break
        k = j + len("tl.fromTo(")
        objs = 0; depth = 0; p = k
        while p < len(line):
            ch = line[p]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    objs += 1
                    if objs == 2:
                        seg = line[k:p]
                        if "immediateRender" not in seg[seg.rfind("{", 0, len(seg)) if False else 0:]:
                            out.append(line[i:p] + ",immediateRender:false"); i = p; break
                        out.append(line[i:p]); i = p; break
            p += 1
        else:
            out.append(line[i:]); break
    return "".join(out)


CHAPTER_FUNCS = [intro, read, press, steps, nose, tq, place, after, pack, recap, practice, outro]


def build_spec():
    def compose(c):
        bgt = '<g id="bgT" opacity="0"><image href="a_bg.jpg" x="0" y="-2" width="1920" height="1084" preserveAspectRatio="xMidYMid slice"/></g>'
        body_ = "".join(f(c) for f in CHAPTER_FUNCS)
        t1s = [ch["t"] for ch in c.CH if ch["id"] == "tq"][0]
        c.spec["music"] = [(0, c.CH[1]["t"], 0.08), (t1s, c.T["t2"], 0.05), (c.CH[-1]["t"], c.TOTAL, 0.08)]
        # a very slow breathing push on the whole stage, so calm teaching never sits frozen while the narrator talks
        n = int(c.TOTAL / 16) + 1
        c.g(f'tl.fromTo("#cam",{{scale:1}},{{scale:1.03,duration:8,yoyo:true,repeat:{2*n - 1},ease:"sine.inOut"}},0);')
        c.L[:] = [_no_immediate(x) for x in c.L]
        return DEFS + bgt + body_
    return dict(id=S.ID, course_tag="NREMT · TRAUMA · BLEEDING", chapters=S.CHAPTERS, compose=compose, tail=6.0,
                images=[f"/home/claude/work/assets/{n}" for n in ("a_s1.jpg", "a_cu.jpg", "a_nose.jpg", "a_bg.jpg")],
                css="#hdr .ch div{background:rgba(5,12,26,.75);padding:0 14px;border-radius:10px} #pause{top:36px} #hdr .tag{color:#3FC2A9;border-color:#3FC2A9}")


SPEC = build_spec()

MOTIONS = """Motion list (for the animation accuracy check):
hook: slow camera push on the garage still; a red stain on the gauze under her gloved hands swells on each heartbeat (0.8 s);
  a blood pool on the floor spreads; camera onto the gauze, then the pool, then her hands.
read: three tissue blocks (skin, fat, muscle, vessel): artery cells move fast, bright red drops spurt out of a cut in arcs on each
  beat; vein cells move slowly, a dark red stream runs steadily over the skin; capillary: dark beads of ooze grow on a scraped
  surface and stop. Volumes: an adult jug (5 L) drops by a fifth while a 1 L bottle fills; a smaller child jug with a 500 mL
  bottle; a small infant jug with a 100 to 200 mL vial.
press: a torn artery under skin spurts; a gauze pad and a gloved palm press down; the vessel is pinched to about half height;
  cells slow; zoom: platelets drift to the torn edge and stick; fibrin strands and a dark clot cover the hole.
steps: limb cross section, palm pushes the artery flat against the bone; gauze stack of 9 pads soaks red (weak arrow) vs one
  pad (strong arrow); bandage wraps a dressing on a limb; a soaked dressing is peeled back and the clot under it tears (red
  flash), it is put back and pressed harder.
nose: kitchen still, boy leaning forward pinching his nose; arrow shows the forward lean; zoom to his nose, ring on the soft
  part, label pointing to the bony bridge.
tq: gauze stain grows in pulses; flat lay tourniquet: strap, windlass rod turns 2 half turns, clip highlights. Cross sections:
  wide strap ring closes artery and vein; narrow belt closes the vein only, the artery keeps pulsing.
place: close up of his forearm: bracket 2 to 3 in from the gauze toward the elbow, arrow toward the heart, the elbow glows red;
  a tourniquet drops onto the forearm a few inches above the wrist dressing. Arm diagram: a tourniquet slides to the top of the
  upper arm (high and tight). Distal pulse ring at the wrist pulses. Lengthwise limb: artery cells flow toward the hand, vein
  cells back toward the heart; a loose strap closes the vein segment, the distal part swells and darkens, the wound spurts
  harder; tightening closes the artery segment, distal artery cells fade, spurts stop, the pulse ring stops.
q2: leg diagram, wound just below the knee, bracket lands on the knee (red), tourniquet slides onto the thigh.
after: time 16:42 written on the tourniquet tag; a blanket slides over it (cross) and away; a second tourniquet appears just
  above the first (toward the elbow).
pack: body map glows at groin and armpits; wound cavity cross section: gauze ribbon goes in to the bleeding artery at the bottom
  and fills the cavity in folds, the source stops glowing; gloved palm presses on top, 3:00 timer runs; gauze on top only is
  crossed; body map: chest and belly red; neck: occlusive dressing on one side, pressure arrow on that side, a wrap around the
  neck crossed out.
"""
