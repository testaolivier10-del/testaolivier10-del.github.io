import sys, math, numpy as np, skia
from PIL import Image
sys.path.insert(0, '/home/claude/runner')
import model
rig, spec, joints, radius = model.build()
D = math.radians


def render(pose, scale=1.0, bg=(205, 205, 205), size=(572, 1023), at=(276, 548)):
    W = rig.fk(pose)
    s = skia.Surface(*size); c = s.getCanvas(); c.clear(skia.Color(*bg))
    xf = np.array([[scale, 0, at[0]], [0, scale, at[1]], [0, 0, 1]])
    rig.blink = 0
    rig.draw(c, W, xf)
    return s.makeImageSnapshot().toarray()[..., [2, 1, 0]]


rest = dict(delta={}, world={}, root=(0, 0), root_rot=0.0)
paint = dict(delta={}, root=(0, 0), root_rot=model.LEAN,
             world={'head': D(-90) + 0.35 * model.LEAN,
                    'n_up': D(150), 'n_lo': D(105), 'n_hand': D(90),
                    'f_up': D(85), 'f_lo': D(4), 'f_hand': D(-8),
                    'n_th': D(62), 'n_sh': D(74), 'n_ft': D(-23),
                    'f_th': D(106), 'f_sh': D(140), 'f_ft': D(38)})
src = np.array(Image.open('src.png').convert('RGB'))
im = np.concatenate([render(rest, at=(286, 520)), render(paint), src], 1)
Image.fromarray(im).save('still.png')
