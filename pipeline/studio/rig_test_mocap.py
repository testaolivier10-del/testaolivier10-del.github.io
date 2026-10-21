"""Same rig test, but the lean comes from real motion capture (CMU 15_06 'lean forward, reach for')."""
import sys, json; sys.path.insert(0, "/home/claude/lp")
src = open("/home/claude/lp/studio/rig_test.py").read()
src = src.replace('open(f"{OUT}/index.html", "w")', 'open(f"{OUT}/index_mocap.html", "w")')
pre, post = src.split("html = f\"\"\"", 1)
exec(pre)
from studio import mocap as M
mo = M.load("15_06")
MAP = {"pelvis": ("Hips", "Spine1"), "spine": ("Spine1", "Neck"), "neck": ("Neck", "Head"), "head": ("Head", "Head_end")}
clip["bones"].pop("chest", None)
mc = M.to_clip(mo, bones, MAP, view="side", t0=0.35, t1=1.55, smooth=3, time_scale=1.25, at=0.7)
# the clip starts from whatever pose the actor had: make it start from our rest by subtracting its first value
for bid, tr in mc["bones"].items():
    v0 = tr[0][1]
    clip["bones"][bid] = [[0, 0]] + [[t, round(v - v0, 3), e] for t, v, e in tr]
clip["root"] = [[0, 0, 0], [0.8, 0, 0], [1.7, 10, 6, "inout"], [5, 10, 6]]
exec("html = f\"\"\"" + post)
print("mocap lean frames", mc["frames"])
