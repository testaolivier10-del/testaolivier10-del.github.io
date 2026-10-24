import sys, math, numpy as np, skia
from PIL import Image
sys.path.insert(0, '/home/claude/jump/side')
import model
rig, spec, joints, radius = model.build()
D = math.radians


def render(pose, scale=1.0, bg=(205, 205, 205), size=(539, 963), at=(285, 498)):
    W = rig.fk(pose)
    s = skia.Surface(*size); c = s.getCanvas(); c.clear(skia.Color(*bg))
    xf = np.array([[scale, 0, at[0]], [0, scale, at[1]], [0, 0, 1]])
    rig.blink = 0
    rig.draw(c, W, xf)
    return s.makeImageSnapshot().toarray()[..., [2, 1, 0]]


rest = dict(delta={}, world={}, root=(0, 0), root_rot=0.0)
paint = dict(delta={}, root=(0, 0), root_rot=model.LEAN,
             world={'head': D(-90) + model.LEAN,
                    'n_up': D(112), 'n_lo': D(103), 'n_hand': D(100),
                    'f_up': D(75), 'f_lo': D(80), 'f_hand': D(85),
                    'n_th': D(80), 'n_sh': D(85), 'n_ft': D(0),
                    'f_th': D(110), 'f_sh': D(120), 'f_ft': D(30)})
src = np.array(Image.open('src.png').convert('RGB'))
im = np.concatenate([render(rest, at=(285, 490)), render(paint), src], 1)
Image.fromarray(im).save('still.png')
