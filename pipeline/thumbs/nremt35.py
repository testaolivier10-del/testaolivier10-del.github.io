"""3 thumbnails for 'Bleeding Control: Direct Pressure, Tourniquets and Wound Packing' (yt-nremt-35), art from the video's style B stills."""
import sys, base64
sys.path[:0] = ["/home/claude/lp/thumbs", "/home/claude/lp/long"]
from lib import COURSE, uri, render, sheet, page3, pill3, title3, scope
import n35_spec as SP

c = COURSE["nremt"]; A, D, M = c["accent"], c["deep"], c["mid"]
OUT = "/home/claude/lp/thumbs/nremt35"
ART = "/home/claude/work/assets/"
PILL = pill3(c, "NREMT · BLEEDING")
TITLE = title3([("Bleeding", "w"), ("Control", "a")], c, y=150, size=112)
SHADE = f"<div class=abs style='left:0;top:0;width:700px;height:720px;background:linear-gradient(90deg,{D}f2 0%,{D}cc 62%,{D}00 100%)'></div>"


def b64(p):
    return "data:image/jpeg;base64," + base64.b64encode(open(p, "rb").read()).decode()


def art_svg(img, vb, extra="", w=1280, h=720, x=0, y=0):
    return (f'<svg class=abs viewBox="{vb}" preserveAspectRatio="xMidYMid slice" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">'
            f'{SP.DEFS}<image href="{b64(ART + img)}" x="0" y="-2" width="1920" height="1084"/>{extra}</svg>')


d = {}
# 1: his forearm with the tourniquet on, gauze over the wound (the answer of the video)
tq = SP.strap_on_arm("t1", SP.TQX, SP.TQT, SP.TQB, op=1).replace('<g id="t1_tag">', '<g id="t1_tag" opacity="0">')
blood = ('<clipPath id="gzc"><rect x="992" y="448" width="150" height="210" rx="6"/></clipPath><g clip-path="url(#gzc)">'
         '<ellipse cx="1062" cy="548" rx="70" ry="96" fill="url(#gStain)"/><path d="M 1050 482 C 1080 478 1098 500 1092 524 C 1110 540 1104 572 1084 584 C 1088 612 1058 626 1040 606 C 1016 612 1006 586 1018 568 C 1002 548 1012 520 1030 514 C 1026 494 1036 484 1050 482 Z" fill="#b30d24" opacity=".8"/></g>')
SHADE1 = f"<div class=abs style='left:0;top:0;width:640px;height:720px;background:linear-gradient(90deg,{D} 0%,{D}f0 70%,{D}00 100%)'></div>"
OL = ('<filter id="ol" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/>'
      f'<feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="o"/><feGaussianBlur in="d" stdDeviation="14" result="g"/>'
      f'<feFlood flood-color="{A}" flood-opacity=".8"/><feComposite in2="g" operator="in" result="gg"/>'
      '<feMerge><feMergeNode in="gg"/><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')
d["n35-1"] = page3(f"""{art_svg('a_cu.jpg', '330 290 880 495', OL + '<g filter="url(#ol)">' + tq + '</g>' + blood)}{SHADE1}
{PILL}{TITLE}{scope("press, tourniquet, pack", y=405, size=58)}""", c)
# 2: the hook: gloved hands pressing on the bleeding forearm in the garage
stain = '<ellipse cx="972" cy="642" rx="62" ry="40" fill="url(#gStain)"/>'
d["n35-2"] = page3(f"""{art_svg('a_s1.jpg', '520 330 1000 562', stain)}{SHADE}
{PILL}{TITLE}{scope("stop it in the right order", y=420, size=44)}""", c)
# 3: the garage scene, with a round close up of the tourniquet on his arm
inset = (f"<div class=abs style='left:860px;top:250px;width:330px;height:330px;border-radius:50%;overflow:hidden;border:8px solid {A};"
         f"box-shadow:0 0 0 7px {D},0 0 40px {A}99,0 16px 26px rgba(0,0,0,.6)'>{art_svg('a_cu.jpg', '660 340 420 420', tq, 330, 330)}</div>")
d["n35-3"] = page3(f"""{art_svg('a_s1.jpg', '380 220 1240 698', stain)}{SHADE}{inset}
{PILL}{TITLE}{scope("press, tourniquet, pack", y=420, size=48)}""", c)

render(d, OUT)
sheet(OUT, list(d), ["1  forearm + tourniquet", "2  gloved hands on the bleed", "3  garage + tourniquet close up"], OUT + "/sheet.png")
print("ok")
