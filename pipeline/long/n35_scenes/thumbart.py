import sys
sys.path[:0] = ['/home/claude/n35']
import numpy as np, skia
from PIL import Image
import core as K, closeup as CU, wide as WD, geo
import s_intro  # registers presses/gauze spans
def save(fn, path):
    im = K.offscreen(fn).toarray()[..., [2, 1, 0]]
    Image.fromarray(im).save(path)
def cu(c):
    cam = (geo.X(600), geo.Y(270), 1.15)
    K.draw_plate(c, 'g_arm.png', cam); K.push_cam(c, cam)
    CU.wound(c)
    CU.gauze_and_stain(c, 78); CU.tourniquet(c, CU.TQX, twist=1.0, rod_angle=3.4, tag_text='6:42', t=1, t_tag=0)
    c.restore()
save(cu, '/home/claude/n35/thumb_cu.png')
L = K.Liq('/home/claude/n35/liq/wide', 0.0)
def wd(c):
    WD.garage().draw(c, 26.0, (25.0, 27.0), (560.0, 600.0, 1.32), lambda cc, tt, w, lay: L.draw(cc, 16.0) if lay == 'mid' else None)
save(wd, '/home/claude/n35/thumb_wide.png')
print('ok')
