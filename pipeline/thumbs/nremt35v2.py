"""3 thumbnails for the rebuilt bleeding control video (flat look art from the video itself)."""
import sys
sys.path[:0] = ["/home/claude/lp/thumbs"]
from lib import COURSE, uri, render, sheet, page3, pill3, title3, scope
c = COURSE["nremt"]; A, D = c["accent"], c["deep"]
OUT = "/home/claude/lp/thumbs/nremt35v2"
PILL = pill3(c, "NREMT · BLEEDING")
TITLE = title3([("Bleeding", "w"), ("Control", "a")], c, y=150, size=112)
def shade(w=700):
    return f"<div class=abs style='left:0;top:0;width:{w}px;height:720px;background:linear-gradient(90deg,{D}f4 0%,{D}d8 60%,{D}00 100%)'></div>"
def bg(path, crop, x=0, w=1280):
    m = "-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 260px)" if x else ""
    return f"<img class=abs src='{uri(path, crop=crop)}' style='left:{x}px;top:0;width:{w}px;height:720px;object-fit:cover;{m}'>"
CU = "/home/claude/n35/thumb_cu.png"; WD = "/home/claude/n35/thumb_wide.png"
d = {}
d["n35-1"] = page3(f"{bg(CU, (200, 60, 1920, 1028))}{shade()}{PILL}{TITLE}{scope('press, tourniquet, pack', y=405, size=56)}", c)
d["n35-2"] = page3(f"<div class=abs style='left:0;top:0;width:1280px;height:720px;background:{D}'></div>{bg(WD, (0, 40, 1800, 1053), x=240)}{shade(640)}{PILL}{TITLE}{scope('stop it in the right order', y=420, size=46)}", c)
inset = (f"<div class=abs style='left:860px;top:200px;width:380px;height:380px;border-radius:50%;overflow:hidden;border:8px solid {A};"
         f"box-shadow:0 0 0 7px {D},0 0 40px {A}99,0 16px 26px rgba(0,0,0,.6)'>"
         f"<img src='{uri(CU, crop=(860, 200, 1640, 980))}' style='width:380px;height:380px'></div>")
d["n35-3"] = page3(f"<div class=abs style='left:0;top:0;width:1280px;height:720px;background:{D}'></div>{bg(WD, (0, 0, 1920, 1080), x=200)}{shade(640)}{inset}{PILL}{TITLE}{scope('press, tourniquet, pack', y=420, size=48)}", c)
render(d, OUT)
sheet(OUT, list(d), ["1  forearm: gauze, glove, tourniquet", "2  garage: her hands on the bleed", "3  garage + tourniquet close up"], OUT + "/sheet.png")
print("ok")
