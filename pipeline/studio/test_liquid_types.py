import sys; sys.path.insert(0, "/home/claude/lp")
from studio import liquid as L
from PIL import Image
s = 1920/1360
P = lambda pts: [(x*s, y*s) for x, y in pts]
bg = Image.open("/tmp/m/characters/style_b/forearm_cu.png").convert("RGBA").resize((1920,1080))
tiles = []
for name, em, style in (("venous", lambda: L.venous(560*s, 330*s, angle=95, speed=0.25), L.VENOUS),
                        ("capillary", lambda: L.capillary(560*s, 360*s, 130), L.ARTERIAL)):
    sim = L.Sim(W=1920, H=1080, fps=30, px_per_m=1300, r=5.5)
    sim.add_emitter(em())
    sim.add_surface(P([(250,282),(330,290),(420,300),(560,312),(700,318),(712,330)]))
    sim.add_face(P([(250,284),(420,300),(560,312),(700,318),(712,330),(712,450),(560,446),(250,440)]), drag=7 if name=="venous" else 14, gravity=0.35 if name=="venous" else 0.08)
    sim.add_floor(1010, depth=40, persp=0.26)
    sim.run(6.0)
    only = [179]
    L.render(sim, f"/home/claude/lp/out/liqtypes/{name}", style=style, only=only)
    im = bg.copy(); im.alpha_composite(Image.open(f"/home/claude/lp/out/liqtypes/{name}/0179.png")); tiles.append(im.crop((500,250,1200,750)))
sheet = Image.new("RGB", (1400, 500)); [sheet.paste(t, (i*700, 0)) for i, t in enumerate(tiles)]
sheet.save("/home/claude/lp/out/liqtypes/sheet.png")
