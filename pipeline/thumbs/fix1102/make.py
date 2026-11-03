import sys; sys.path.insert(0, "/home/claude/lp/thumbs")
from lib import COURSE, uri, page3, pill3, title3, scope, render, sheet
F = "/home/claude/th/fr/"; YEL = "#ffd23f"
def bgd(c, cx=74):
    A, D, M = c["accent"], c["deep"], c["mid"]; a8 = A + "0b"
    return (f'<div class=abs style="inset:0;background:radial-gradient(circle at {cx}% 50%,{M} 0%,{D} 70%)"></div>'
            f'<div class=abs style="inset:0;background:repeating-linear-gradient(90deg,{a8} 0 2px,transparent 2px 64px),repeating-linear-gradient(0deg,{a8} 0 2px,transparent 2px 64px)"></div>')
def glow(c): return f"drop-shadow(0 0 28px {c['accent']}66) drop-shadow(0 18px 24px rgba(0,0,0,.6))"
def stick(c, px=5):
    d = [(px,0),(-px,0),(0,px),(0,-px),(px*.7,px*.7),(-px*.7,px*.7),(px*.7,-px*.7),(-px*.7,-px*.7)]
    return " ".join(f"drop-shadow({a:.1f}px {b:.1f}px 0 #fff)" for a,b in d) + " " + glow(c)
def tag(c, lab, x, y, size=24):
    return f'<div class=abs style="left:{x}px;top:{y}px;font-weight:800;font-size:{size}px;color:{c["deep"]};background:{c["accent"]};border-radius:999px;padding:4px 14px;box-shadow:0 0 0 3px {c["deep"]};white-space:nowrap">{lab}</div>'
def line(c, x1, y1, x2, y2):
    D = c["deep"]
    return (f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{D}" stroke-width="9" stroke-linecap="round"/>'
            f'<path d="M{x1},{y1} L{x2},{y2}" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'
            f'<circle cx="{x1}" cy="{y1}" r="7" fill="{YEL}" stroke="{D}" stroke-width="3"/>')
def lens(c, path, crop, x, y, d, num=None):
    A, D = c["accent"], c["deep"]
    n = (f'<div class=abs style="left:{x-6}px;top:{y-6}px;width:46px;height:46px;border-radius:50%;background:{A};color:{D};font-weight:900;font-size:26px;'
         f'display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px {D}">{num}</div>') if num else ""
    return (f'<div class=abs style="left:{x}px;top:{y}px;width:{d}px;height:{d}px;border-radius:50%;overflow:hidden;border:6px solid {A};'
            f'box-shadow:0 0 0 6px {D},0 0 34px {A}88,0 14px 24px rgba(0,0,0,.6)"><img src="{uri(path, crop=crop)}" style="width:100%;height:100%;object-fit:cover"></div>{n}')
def chips(parts, x, y, size=46):
    out, cx = "", x
    for t, col, sub in parts:
        w = int(len(t) * size * .62 + 26)
        out += (f'<div class=abs style="left:{cx}px;top:{y}px;font-weight:900;font-size:{size}px;color:#1a1020;background:{col};border-radius:12px;padding:2px 13px;box-shadow:0 0 0 4px #160a12,0 10px 18px rgba(0,0,0,.5)">{t}</div>')
        if sub: out += f'<div class=abs style="left:{cx}px;top:{y+size+22}px;width:{w}px;text-align:center;font-family:K;font-weight:700;font-size:30px;color:{col}">{sub}</div>'
        cx += w + 14
    return out
D = {}
# ---------- A&P 02 ----------
c = COURSE["anp"]; PER = uri(F + "c_person.png")
PW, PH = 364, 777
def person(x, y, h): 
    s = h / PH
    return f'<img class=abs src="{PER}" style="left:{x}px;top:{y}px;height:{h}px;filter:{stick(c)}">', (lambda px, py: (round(x + px*s), round(y + py*s)))
img, P = person(820, 44, 640)
pts = [("superior", (180, 14), 1010, 40), ("medial", (182, 250), 1040, 160), ("lateral", (300, 270), 1060, 262),
       ("proximal", (285, 175), 1040, 352), ("distal", (330, 440), 1050, 452), ("inferior", (150, 760), 1010, 610)]
L, T = "", ""
for lab, (px, py), lx, ly in pts:
    ex, ey = P(px, py); L += line(c, ex, ey, lx - 8, ly + 19); T += tag(c, lab, lx, ly)
D["ap02-1"] = page3(f"""{bgd(c)}<div class=abs style="left:760px;top:40px;width:420px;height:660px;border-radius:50%;background:radial-gradient(ellipse,{c['accent']}40 0%,transparent 65%)"></div>
{img}<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{L}</svg>{T}
{pill3(c, "A&amp;P · CH 1")}{title3([("Medical", "w"), ("Terminology", "a")], c, size=96)}{scope("word parts + body directions", y=370, size=42)}""", c)
# 2: chips on top, person below-right
img2, P2 = person(960, 230, 470)
arr = (f'<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">'
       f'<path d="M1195,420 L1195,250" stroke="{c["deep"]}" stroke-width="16" stroke-linecap="round"/><path d="M1195,420 L1195,250" stroke="{YEL}" stroke-width="7" stroke-linecap="round"/>'
       f'<path d="M1177,272 L1195,246 L1213,272" fill="none" stroke="{YEL}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>')
D["ap02-2"] = page3(f"""{bgd(c, 78)}{chips([("hepat", "#EC846C", "liver"), ("o", "#f3e6c8", ""), ("megaly", "#ffd23f", "enlarged")], 650, 80, 54)}
{img2}{arr}{tag(c, "superior", 1110, 200)}
{pill3(c, "A&amp;P · CH 1")}{title3([("Medical", "w"), ("Terminology", "a")], c, size=96)}{scope("decode it, then point to it", y=370, size=42)}""", c)
# 3: Directional terms title, person with arrows
img3, P3 = person(840, 60, 620)
ar = ""
for (x1, y1, x2, y2, lab, lx, ly) in [(1010, 330, 1010, 70, "superior", 1060, 70), (1010, 470, 1010, 690, "inferior", 1060, 640),
                                       (1130, 380, 1250, 380, "lateral", 1150, 320), (900, 380, 990, 380, "medial", 760, 320)]:
    ar += (f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{c["deep"]}" stroke-width="15" stroke-linecap="round"/><path d="M{x1},{y1} L{x2},{y2}" stroke="{YEL}" stroke-width="6" stroke-linecap="round"/>')
D["ap02-3"] = page3(f"""{bgd(c)}{img3}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%">{line(c, *P3(182, 250), 1060, 200)}{line(c, *P3(330, 440), 1080, 560)}</svg>
{tag(c, "medial", 1060, 182)}{tag(c, "distal", 1080, 542)}{tag(c, "superior", 1040, 40)}{tag(c, "inferior", 1040, 660)}
{pill3(c, "A&amp;P · CH 1")}{title3([("Directional", "w"), ("Terms", "a")], c, size=100)}{scope("plus word parts, decoded", y=370, size=42)}""", c)
# ---------- NREMT 35 ----------
c = COURSE["nremt"]; EMT = uri(F + "c_emt.png")
PILL, TITLE = pill3(c, "NREMT · BLEEDING"), title3([("Bleeding", "w"), ("Control", "a")], c, y=150, size=112)
TQ = (F + "n_556.png", (720, 300, 1400, 980)); PR = (F + "p_244.png", (760, 120, 1340, 700)); PK = (F + "n_600.png", (760, 300, 1280, 820))
D["n35-1"] = page3(f"""{bgd(c)}<div class=abs style="left:640px;top:60px;width:560px;height:600px;border-radius:50%;background:radial-gradient(ellipse,{c['accent']}38 0%,transparent 65%)"></div>
<img class=abs src="{EMT}" style="left:610px;top:170px;height:520px;filter:{stick(c)}">
{lens(c, *TQ, 990, 40, 260)}{tag(c, "tourniquet", 1030, 300)}
{PILL}{TITLE}{scope("press, tourniquet, pack", y=405, size=52)}""", c)
D["n35-2"] = page3(f"""{bgd(c)}
<svg class=abs viewBox="0 0 1280 720" style="inset:0;width:100%;height:100%"><path d="M880,150 L1110,360 L880,570" fill="none" stroke="{c['accent']}" stroke-width="10" stroke-dasharray="26 18" stroke-linecap="round" opacity=".85"/></svg>
{lens(c, *PR, 760, 40, 230, 1)}{lens(c, *TQ, 1010, 250, 230, 2)}{lens(c, *PK, 760, 455, 230, 3)}
{tag(c, "press", 1000, 110)}{tag(c, "tourniquet", 1040, 500)}{tag(c, "pack", 1000, 640)}
{PILL}{TITLE}{scope("press, tourniquet, pack", y=405, size=52)}""", c)
D["n35-3"] = page3(f"""{bgd(c)}<div class=abs style="left:600px;top:60px;width:560px;height:600px;border-radius:50%;background:radial-gradient(ellipse,{c['accent']}38 0%,transparent 65%)"></div>
<img class=abs src="{EMT}" style="left:560px;top:150px;height:540px;filter:{stick(c)}">
{lens(c, *PR, 1050, 30, 190, 1)}{lens(c, *TQ, 1070, 255, 190, 2)}{lens(c, *PK, 1050, 480, 190, 3)}
{PILL}{TITLE}{scope("press, tourniquet, pack", y=405, size=52)}""", c)
render(D, "/home/claude/th/out")
sheet("/home/claude/th/out", list(D), list(D), "/home/claude/th/out/sheet.png")
print("ok")
