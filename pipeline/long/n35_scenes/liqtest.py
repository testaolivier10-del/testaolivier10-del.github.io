import sys, numpy as np, cv2
sys.path[:0] = ['/home/claude/n35', '/home/claude/lp']
import geo
from studio import liquid as L
P = geo.P
sim = L.Sim(W=1920, H=1080, fps=30, px_per_m=2600, r=6.0)
# arm top edge (skin surface) and the arm's side face
top = [P(400, 252), P(470, 248), P(540, 243), P(620, 235), P(700, 223), P(760, 219)]
bot = [P(760, 389), P(700, 387), P(620, 380), P(540, 371), P(460, 362), P(400, 360)]
sim.add_surface(top, kind='skin')
sim.add_face(top + bot, drag=7.0, gravity=0.22)
gauze = [P(468, 300), P(472, 228), P(560, 222), P(628, 235), P(622, 308), P(540, 318)]
sim.add_absorber(gauze, rate=0.6)
e = L.arterial(*P(474, 244), angle=-150, bpm=118, peak_speed=1.5, base=0.25)
sim.add_emitter(e)
e2 = L.arterial(*P(626, 240), angle=-40, bpm=118, peak_speed=0.9, base=0.15)
sim.add_emitter(e2)
sim.run(float(sys.argv[1]) if len(sys.argv) > 1 else 5.0)
n = L.render(sim, '/tmp/liq_hook', style=L.ARTERIAL, only={30, 90, 149})
print('frames', n)
base = geo.plate('g_arm.png'); hand = geo.plate('l_hand.png', sharpen=False)
for f in (30, 90, 149):
    l = cv2.cvtColor(cv2.imread(f'/tmp/liq_hook/{f:04d}.png', cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA)
    out = base.astype(float)
    al = l[..., 3:4] / 255.0; out = out * (1 - al) + l[..., :3] * al
    ah = hand[..., 3:4] / 255.0; out = out * (1 - ah) + hand[..., :3] * ah
    cv2.imwrite(f'/tmp/liq_{f}.jpg', cv2.cvtColor(out.astype(np.uint8), cv2.COLOR_RGB2BGR))
