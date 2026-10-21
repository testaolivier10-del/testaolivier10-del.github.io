import sys, time; sys.path.insert(0, "/home/claude/lp")
from studio import liquid as L
s = 1920/1360
P = lambda pts: [(x*s, y*s) for x, y in pts]
sim = L.Sim(W=1920, H=1080, fps=30, px_per_m=1300, r=6.0)
wx, wy = 560*s, 312*s
sim.add_emitter(L.arterial(wx, wy - 4, -60, bpm=110, start=0.3, peak_speed=3.0))
sim.add_surface(P([(250,282),(330,290),(420,300),(560,312),(700,318),(712,330)]), kind="skin")
sim.add_surface(P([(712,330),(712,450)]), kind="skin")
sim.add_absorber(P([(150,768),(300,600),(500,505),(700,468),(790,480),(830,768)]), stain="#3a1320", stain_edge="#240a12", grow=0.8)
sim.add_floor(1010, depth=45, persp=0.26)
t=time.time(); sim.run(6.0); print("sim", round(time.time()-t,1), "s; particles", len(sim.p))
t=time.time(); n = L.render(sim, "/home/claude/lp/out/liqtest/art", style=L.ARTERIAL); print("render", round(time.time()-t,1), n)
