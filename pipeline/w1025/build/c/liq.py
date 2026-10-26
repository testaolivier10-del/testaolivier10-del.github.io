"""Runoff for w1025-03 with the studio liquid system (particles drawn merged, they run, pool and soak, never fade).
1 lawn: rain water collects on the fertilized grass and trickles downhill across the lawn face to the shore.
2 buffer: in the cut away (side view) runoff runs along the lawn surface and soaks into the plant strip (absorber)."""
import sys, json
sys.path.insert(0, '/home/claude/lp')
from studio import liquid as L
RUNOFF = dict(body="#86a596", dark="#4f6d5f", rim="#e8f6f1", spec="#ffffff", pool="#6f8d80",
              stain="#5f7f66", stain_edge="#3f5a45", trail="#7e9b8e")
which = sys.argv[1]
if which == 'lawn':
    sim = L.Sim(W=1080, H=1935, fps=30, px_per_m=380, r=6.0, seed=3)
    for k, (x, y) in enumerate([(380, 1330), (470, 1300), (560, 1340), (640, 1290), (300, 1380), (720, 1330)]):
        e = L.Emitter(x, y, 55, 0.35, 25.0, lambda t: 90, start=0.1 * k, jitter=6.0)
        sim.add_emitter(e)
    sim.add_face([(0, 1200), (1080, 1100), (1080, 1153), (323, 1935), (0, 1935)], drag=6.0, gravity=0.30)
    sim.run(4.2)
    L.render(sim, '/home/claude/w1025/c/liq/lawn', style=RUNOFF, scale=0.75, stain=False)
else:
    sim = L.Sim(W=1080, H=1935, fps=30, px_per_m=300, r=5.0, seed=4)
    for k, x in enumerate((40, 110, 190)):
        sim.add_emitter(L.Emitter(x, 810, 20, 0.25, 15.0, lambda t: 70, start=0.15 * k, jitter=3.0))
    sim.add_surface([(0, 826), (120, 836), (250, 846), (380, 856), (520, 866), (640, 876), (790, 890)], kind='grass', friction=0.25, adhesion=0.7)
    sim.add_absorber([(230, 800), (790, 800), (790, 900), (230, 900)], rate=1.0)
    sim.run(5.0)
    L.render(sim, '/home/claude/w1025/c/liq/buffer', style=RUNOFF, scale=0.75)
print('frames', len(sim.frames))
