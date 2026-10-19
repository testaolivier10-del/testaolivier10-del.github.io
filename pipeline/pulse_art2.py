"""Close up for t1018 built from AI stills (Qwen-Image-Edit on Modal, style B) plus code-drawn pieces in the same flat style.
Stage coords 1080x960. The AI stills are 1088x960 and are placed at x=-4."""
import numpy as np, shutil

CU = "/tmp/m/characters/style_b"
# top edge of his forearm in the base still (image coords, measured)
EX = [380, 410, 440, 470, 500, 530, 560, 590, 620, 650, 680, 710, 740]
EY = [491, 491, 490, 487, 482, 477, 471, 464, 457, 449, 441, 434, 418]
DX = -4


def edge(x):
    return float(np.interp(x - DX, EX, EY))


def copy_assets(out):
    for src, dst in (("clean82_0.png", "cu_base.png"), ("L_thumb.png", "cu_thumb.png"), ("L_fing.png", "cu_fing.png"),
                     ("watch2_0.png", "cu_watch.png")):
        shutil.copy(f"{CU}/{src}", f"{out}/{dst}")


# the radial artery runs just under the skin on the thumb side, close to the top edge of the forearm
X0, X1 = 392, 640
DEPTH = 20


def _center(n=40):
    xs = np.linspace(X0, X1, n)
    return [(x, edge(x) + DEPTH) for x in xs]


def _poly(pts):
    return "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)


def window_path(h=25):
    """Almond window around the artery line, widest in the middle."""
    c = _center(48)
    n = len(c)
    top, bot = [], []
    for i, (x, y) in enumerate(c):
        t = i / (n - 1)
        w = h * (np.sin(np.pi * t) ** 0.6)
        top.append((x, y - w)); bot.append((x, y + w))
    return _poly(top + bot[::-1]) + " Z"


def artery_path(x0=X0 + 8, x1=X1 - 8):
    c = [(x, y) for x, y in _center(48) if x0 <= x <= x1]
    return _poly(c)


SEG_X0, SEG_X1 = 432, 512     # under her two fingertips


DEFS = """
<linearGradient id="g2Tis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9c6b0"/><stop offset="1" stop-color="#eda48c"/></linearGradient>
<linearGradient id="g2Art" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5b62"/><stop offset=".55" stop-color="#d4223a"/><stop offset="1" stop-color="#8f0f24"/></linearGradient>
<radialGradient id="g2Glow"><stop offset="0" stop-color="#ff7b86" stop-opacity=".95"/><stop offset=".6" stop-color="#ff4d61" stop-opacity=".45"/><stop offset="1" stop-color="#ff4d61" stop-opacity="0"/></radialGradient>
<filter id="g2Soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
<radialGradient id="g2Vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#050a1c" stop-opacity="0"/><stop offset="1" stop-color="#050a1c" stop-opacity=".6"/></radialGradient>
<clipPath id="g2Win"><path d="{WIN}"/></clipPath>
<clipPath id="g2WatchC"><circle cx="0" cy="0" r="150"/></clipPath>
"""


def defs():
    return DEFS.replace("{WIN}", window_path())


def artery():
    """X-ray style view under the skin near the wrist: the skin stays, made see-through, with the radial artery beneath it."""
    ap = artery_path()
    seg = _poly([(x, y) for x, y in _center(48) if SEG_X0 <= x <= SEG_X1])
    return f'''
<g id="art2">
  <g clip-path="url(#g2Win)">
    <rect x="{X0 - 10}" y="380" width="{X1 - X0 + 20}" height="160" fill="url(#g2Tis)"/>
    <path d="{ap}" stroke="#7d1a22" stroke-width="28" fill="none" stroke-linecap="round" opacity=".25" transform="translate(0 4)"/>
    <g id="artTube">
      <path id="artBody" d="{ap}" stroke="url(#g2Art)" stroke-width="17" fill="none" stroke-linecap="round"/>
      <path id="sqCover" d="{seg}" stroke="#eea48d" stroke-width="30" fill="none" opacity="0"/>
      <path id="sqThin" d="{seg}" stroke="#a3162c" stroke-width="5" fill="none" stroke-linecap="round" opacity="0"/>
      <path id="artFlow" d="{ap}" stroke="#ffb3a8" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="10 46" opacity=".75"/>
      <path d="{ap}" stroke="#ffd9cf" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55" transform="translate(0 -6)"/>
    </g>
    <path id="artSurge" d="{ap}" stroke="#ff6a75" stroke-width="36" fill="none" stroke-linecap="round" opacity="0" filter="url(#g2Soft)"/>
    <rect x="{X0 - 10}" y="380" width="{X1 - X0 + 20}" height="160" fill="#ef8a64" opacity=".22"/>
  </g>
  <path d="{window_path()}" fill="none" stroke="#ef8a64" stroke-width="10" opacity=".85" filter="url(#g2Soft)"/>
  <path d="{window_path()}" fill="none" stroke="#fff1e4" stroke-width="2.5" stroke-dasharray="7 7" opacity=".85"/>
</g>'''


def squash_cover():
    """Tissue coloured pinch that closes the tube under the fingertips when she presses too hard."""
    pts = [(x, y) for x, y in _center(48) if SEG_X0 - 6 <= x <= SEG_X1 + 6]
    mx = (pts[0][0] + pts[-1][0]) / 2; my = (pts[0][1] + pts[-1][1]) / 2
    ang = np.degrees(np.arctan2(pts[-1][1] - pts[0][1], pts[-1][0] - pts[0][0]))
    L = pts[-1][0] - pts[0][0]
    return (f'<g clip-path="url(#g2Win)"><g transform="translate({mx:.1f} {my:.1f}) rotate({ang:.1f})">'
            f'<rect id="sqTop" x="{-L / 2:.1f}" y="-30" width="{L:.1f}" height="28" rx="6" fill="#f2ad94" opacity="0"/>'
            f'<rect id="sqBot" x="{-L / 2:.1f}" y="2" width="{L:.1f}" height="28" rx="6" fill="#e3907a" opacity="0"/>'
            f'<rect id="sqLine" x="{-L / 2 + 4:.1f}" y="-2.5" width="{L - 8:.1f}" height="5" rx="2.5" fill="#9e1a2c" opacity="0"/>'
            f'</g></g>'), (mx, my)


def hands():
    s = 'position:absolute;left:-4px;top:0;width:1088px;height:960px'
    return (f'<div id="eThumb" style="{s};opacity:0"><div id="eThumbIn" style="position:absolute;inset:0">'
            f'<img src="cu_thumb.png" style="position:absolute;inset:0;width:1088px;height:960px"></div></div>'
            f'<div id="eFing" style="{s};opacity:0"><div id="eFingIn" style="position:absolute;inset:0">'
            f'<img src="cu_fing.png" style="position:absolute;inset:0;width:1088px;height:960px"></div></div>')


THUMB_PAD = (444, 478)
TIPS = [(446, 494), (496, 490)]
WATCH = (900, 680, 100)


def watch():
    cx, cy, r = WATCH
    sc = r / 150
    return f'''
<g id="watch" opacity="0"><g transform="translate({cx} {cy})"><g id="wShake">
  <circle r="{r + 10}" fill="#050a1c" opacity=".45" transform="translate(6 10)"/>
  <g transform="scale({sc:.3f})"><g clip-path="url(#g2WatchC)"><image href="cu_watch.png" x="-205" y="-205" width="410" height="410"/></g></g>
  <circle id="wRing" r="{r * 0.78:.1f}" fill="none" stroke="#2ee6d6" stroke-width="7" stroke-dasharray="{2 * np.pi * r * 0.78:.2f}" stroke-dashoffset="{2 * np.pi * r * 0.78:.2f}" transform="rotate(-90)" opacity=".95"/>
  <g id="wHandG"><rect id="wHand" x="-3" y="{-r * 0.72:.1f}" width="6" height="{r * 0.72 + 12:.1f}" rx="3" fill="#ffd23f"/></g>
  <circle r="9" fill="#ffd23f"/>
  <rect x="-92" y="{r + 14:.0f}" width="184" height="58" rx="29" fill="#081428" stroke="#ffd23f" stroke-width="4"/>
  <text id="wNum" y="{r + 56:.0f}" text-anchor="middle" class="lbl" font-size="38" fill="#ffffff">0</text>
  <text id="wSec" y="{-r * 0.24:.0f}" text-anchor="middle" class="lbl" font-size="26" fill="#a9bbd8">30 s</text>
</g></g></g>'''
