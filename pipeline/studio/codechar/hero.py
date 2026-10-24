"""The code drawn paramedic in a real painted scene (style B park, sun upper left), portrait 1080x1920."""
import sys, json
sys.path.insert(0, '/home/claude/rig')
import render, model

bg = render.bg_image('/tmp/m/characters/style_b/w1021/v2_park_bg.png', (1080, 1920))
r = render.run(model, '/home/claude/trace/paramedic_park.mp4', size=(1080, 1920), scale=1.07, origin=(330, 1307),
               bg=bg, follow=False)
print(json.dumps(r))
