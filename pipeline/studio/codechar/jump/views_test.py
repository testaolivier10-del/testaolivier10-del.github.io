import sys, math, numpy as np, skia
from PIL import Image
sys.path.insert(0, '/home/claude/jump'); sys.path.insert(0, '/home/claude/jump/side')
import views, model
s = skia.Surface(1500, 1000); c = s.getCanvas(); c.clear(skia.Color(205, 205, 205))
ground = 950
fr = views.View('front'); q3 = views.View('q3')
fr.draw(c, 220, ground, 1.0, 0.0, dict(breath=1.0))
q3.draw(c, 560, ground, 1.0, 0.0, dict(arm_l=0.05, arm_r=-0.05))
fr.blink = 1.0; fr.draw(c, 1300, ground, 1.0, 0.0, dict(head=0.06, arm_l=0.08, arm_r=-0.08, sway=0.02))
rig, spec, joints, radius = model.build()
W = rig.fk(dict(delta={}, world={}, root=(0, 0), root_rot=0.0))
sole = 8 + model.TH_L + model.SHIN_L + model.ANKLE_H
rig.draw(c, W, np.array([[1.0, 0, 900], [0, 1.0, ground - sole], [0, 0, 1]]))
Image.fromarray(s.makeImageSnapshot().toarray()[..., [2, 1, 0]]).save('t_views.png')
