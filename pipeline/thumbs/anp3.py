"""Round 3: 3 whole video thumbnails for A&P long video 01, Intro to Anatomy & Physiology.
Art: Jordan (the video's runner) with her organ systems shown inside her body (built by anp3/xray.py)."""
import sys, subprocess
sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, uri, page3, pill3, title3, scope, render, sheet

c = COURSE["anp"]
A, DEEP, MID = c["accent"], c["deep"], c["mid"]
OUT = "/home/claude/lp/thumbs/anp3"
ART = "/home/claude/lp/thumbs/anp/art/"
CH = "/tmp/claude-0/-home-claude/cae291e7-9832-5169-b112-05b77bfd798f/scratchpad/m/characters/"
YEL = "#ffd23f"
subprocess.run(["python3", OUT + "/xray.py"], check=True, capture_output=True)

def art(n): return uri(ART + n + ".png")
HALF, HOLO = uri(OUT + "/half.png"), uri(OUT + "/holo.png")
JH = 1275  # jordan-hips native height (530 wide)

BG = f"""<div class=abs style="inset:0;background:radial-gradient(circle at 74% 50%,{MID} 0%,#2a1015 42%,{DEEP} 100%)"></div>
<div class=abs style="inset:0;background:repeating-linear-gradient(90deg,rgba(236,132,108,.045) 0 2px,transparent 2px 64px),repeating-linear-gradient(0deg,rgba(236,132,108,.045) 0 2px,transparent 2px 64px)"></div>"""
GLOW = f"drop-shadow(0 0 28px {A}66) drop-shadow(0 18px 24px rgba(0,0,0,.6))"

def place(x, y, h):
    """map a point (px, py) in jordan-hips pixels to page pixels for an image at left x, top y, height h"""
    s = h / JH
    return lambda px, py: (x + px * s, y + py * s)

D = {}

# 1. HALF SCAN: Jordan split down the middle, skin on her right side, organ systems on the other, six system callouts.
x0, y0, h0 = 700, 28, 670
P = place(x0, y0, h0)
calls = [  # label, point in jordan px, label anchor side, label y
    ("nervous", (300, 110), "r", 66),
    ("respiratory", (335, 320), "r", 166),
    ("cardiovascular", (312, 385), "r", 266),
    ("digestive", (330, 560), "r", 366),
    ("muscular", (372, 820), "r", 466),
    ("skeletal", (336, 930), "r", 566),
]
lines, tags = "", ""
for lab, (px, py), side, ly in calls:
    ex, ey = P(px, py)
    lx = 1040
    lines += f'<path d="M{ex:.0f},{ey:.0f} L{lx-10},{ly+19}" stroke="{DEEP}" stroke-width="9" stroke-linecap="round"/><path d="M{ex:.0f},{ey:.0f} L{lx-10},{ly+19}" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="{ex:.0f}" cy="{ey:.0f}" r="7" fill="{YEL}" stroke="{DEEP}" stroke-width="3"/>'
    tags += f'<div class=abs style="left:{lx}px;top:{ly}px;font-weight:800;font-size:{22 if len(lab) > 11 else 24}px;color:{DEEP};background:{A};border-radius:999px;padding:4px 14px;box-shadow:0 0 0 3px {DEEP}">{lab}</div>'
D["anp3-1"] = page3(f"""
{BG}
<div class=abs style="left:700px;top:30px;width:540px;height:660px;border-radius:50%;background:radial-gradient(ellipse,{A}44 0%,transparent 65%)"></div>
<img class=abs src="{HALF}" style="left:{x0}px;top:{y0}px;height:{h0}px;filter:{GLOW}">
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{lines}</svg>
{tags}
{pill3(c, "A&amp;P · CH 1")}
{title3([("Anatomy &amp;", "w"), ("Physiology", "a")], c, size=96)}
{scope("how your body is built", y=370)}
""", c)

# 2. ELEVEN SYSTEMS AROUND HER: the organ hologram in the middle, all 11 system icons on a ring around her.
names = "integumentary skeletal muscular nervous endocrine cardiovascular lymphatic respiratory digestive urinary reproductive".split()
import math
cx, cy, rx, ry = 960, 372, 255, 300
ring = ""
for i, n in enumerate(names):
    ang = math.radians(-90 + i * 360 / 11)
    x, y = cx + rx * math.cos(ang), cy + ry * math.sin(ang)
    ring += (f'<div class=abs style="left:{x-44:.0f}px;top:{y-44:.0f}px;width:88px;height:88px;border-radius:50%;background:radial-gradient(circle,#3a1a22,{DEEP});'
             f'border:4px solid {A};box-shadow:0 0 0 4px {DEEP},0 8px 16px rgba(0,0,0,.5)">'
             f'<img src="{art("ic_" + n)}" style="position:absolute;left:50%;top:50%;max-width:62px;max-height:60px;transform:translate(-50%,-50%)"></div>')
D["anp3-2"] = page3(f"""
{BG}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{A}" stroke-width="4" stroke-dasharray="3 14" stroke-linecap="round" opacity=".8"/></svg>
<div class=abs style="left:{cx-230}px;top:{cy-300}px;width:460px;height:600px;border-radius:50%;background:radial-gradient(ellipse,{A}38 0%,transparent 62%)"></div>
<img class=abs src="{HOLO}" style="left:{cx-110}px;top:{cy-265}px;height:530px;filter:{GLOW}">
{ring}
{pill3(c, "A&amp;P · CH 1")}
{title3([("Intro to", "w"), ("A&amp;P", "a")], c, size=118)}
{scope("11 systems, one body", y=400)}
""", c)

# 3. LEVELS + SYSTEMS: a scale ladder from atom to organism leading into the half scanned Jordan.
lv = [("chemical", "water", 44), ("cellular", "cell", 22), ("tissue", "tissue", 40), ("organ", "heart", 56), ("organ system", "urinary", 58)]
x3, y3, h3 = 935, 22, 600
ladder = ""
for i, (lab, im, ih) in enumerate(lv):
    y = 592 - i * 120
    ladder += (f'<div class=abs style="left:672px;top:{y}px;width:96px;height:96px;border-radius:50%;background:radial-gradient(circle,#3a1a22,{DEEP});'
               f'border:4px solid {A};box-shadow:0 0 0 4px {DEEP}"><img src="{art(im)}" style="position:absolute;left:50%;top:50%;max-width:76px;height:{ih}px;object-fit:contain;transform:translate(-50%,-50%)"></div>'
               f'<div class=abs style="left:776px;top:{y+30}px;font-weight:800;font-size:23px;color:#ffe3da;text-shadow:0 2px 0 {DEEP}">{lab}</div>')
D["anp3-3"] = page3(f"""
{BG}
<div class=abs style="left:880px;top:20px;width:380px;height:600px;border-radius:50%;background:radial-gradient(ellipse,{A}44 0%,transparent 65%)"></div>
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">
  <path d="M720,600 L720,140" stroke="{A}" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>
  <path d="M700,80 C730,62 750,56 760,54 M880,52 C900,58 920,72 936,96" fill="none" stroke="{DEEP}" stroke-width="18" stroke-linecap="round"/>
  <path d="M700,80 C730,62 750,56 760,54 M880,52 C900,58 920,72 936,96" fill="none" stroke="{YEL}" stroke-width="8" stroke-linecap="round"/>
  <path d="M906,92 L940,100 L930,66" fill="none" stroke="{DEEP}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M906,92 L940,100 L930,66" fill="none" stroke="{YEL}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
{ladder}
<img class=abs src="{HALF}" style="left:{x3}px;top:{y3}px;height:{h3}px;filter:{GLOW}">
<div class=abs style="left:764px;top:12px;font-weight:800;font-size:23px;color:{DEEP};background:{A};border-radius:999px;padding:3px 14px;box-shadow:0 0 0 3px {DEEP}">organism</div>
{pill3(c, "A&amp;P · CH 1")}
{title3([("Anatomy &amp;", "w"), ("Physiology", "a")], c, size=96)}
{scope("atoms → whole body", y=370)}
""", c)

if __name__ == "__main__":
    render(D, OUT)
    labels = ["1  Anatomy & Physiology  |  how your body is built  |  art: half scan Jordan",
              "2  Intro to A&P  |  11 systems, one body  |  art: 11 system ring",
              "3  Anatomy & Physiology  |  atoms → whole body  |  art: levels to Jordan"]
    sheet(OUT, list(D), labels, OUT + "/sheet.png")
    print("ok")
