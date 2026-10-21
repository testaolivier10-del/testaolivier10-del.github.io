"""Liquid layer for the bleeding control showcase wide shots: before the clip starts the forearm bled freely
(arterial, 4 s of pre roll, so the gauze is soaked and a puddle is on the floor at frame zero); during the clip,
with her pressing, only a slow seep runs from under the gauze; at the end it has stopped."""
import sys; sys.path.insert(0, "/home/claude/lp")
from studio import liquid as L, cast_patient as PT

PRE = 4.0
W = PT.WOUND
sim = L.Sim(W=1920, H=1080, fps=30, px_per_m=1300, r=5.5, seed=9)
sim.add_emitter(L.arterial(W[0] - 6, W[1] - 10, -84, bpm=112, start=0.0, stop=PRE - 2.4, peak_speed=1.5))
seep = L.venous(W[0] + 10, W[1] + 22, angle=95, start=PRE, stop=PRE + 3.0, speed=0.08)
seep.rate = lambda t: 45
sim.add_emitter(seep)
# forearm top edge (liquid runs along it), the forearm seen from the side as a face it trickles down
sim.add_face([(1235, 714), (1012, 692), (1012, 716), (1235, 752)], drag=8, gravity=0.3)
sim.add_absorber([(W[0] - 34, W[1] - 14), (W[0] + 38, W[1] - 14), (W[0] + 38, W[1] + 8), (W[0] - 34, W[1] + 8)], grow=0.7)
sim.add_floor(915, depth=26, persp=0.24, spread=0.3)
sim.run(PRE + 37.4)
wide = [f for f in range(int(PRE * 30), int((PRE + 37.4) * 30)) if (f - PRE * 30) < 4.7 * 30 or (f - PRE * 30) > 35.0 * 30]
n = L.render(sim, "/home/claude/lp/out/showcase/liq_all", style=L.ARTERIAL, only=wide)
import os, shutil
os.makedirs("/home/claude/lp/out/showcase/liq", exist_ok=True)
for f in wide:
    src = f"/home/claude/lp/out/showcase/liq_all/{f:04d}.png"
    if os.path.exists(src): shutil.copy(src, f"/home/claude/lp/out/showcase/liq/{f - int(PRE * 30):04d}.png")
print("liquid frames", len(wide))
