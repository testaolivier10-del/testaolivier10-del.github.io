import sys, numpy as np, skia
from PIL import Image
sys.path.insert(0,'/home/claude/rig')
import model, acting
rig, spec, joints, radius = model.build()
P = acting.Performer(rig, spec)
ts=[float(v) for v in sys.argv[1:]] or [0.5]
tiles=[]
t=0; i=0
for tt in ts:
    while t < tt:
        W=P.pose(t, acting.script); t+=1/60
    s=skia.Surface(800,1150); c=s.getCanvas(); c.clear(skia.Color(205,205,205))
    xf=np.array([[0.95,0,300-0.95*P.x*0.0],[0,0.95,600],[0,0,1]])
    xf[0,2]=330-P.x*0.95
    rig.blink = 0
    rig.draw(c, W, xf)
    tiles.append(s.makeImageSnapshot().toarray()[...,[2,1,0]])
im=np.concatenate(tiles,1)
Image.fromarray(im).save('still.png')
