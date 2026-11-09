import sys; sys.path[:0]=['/home/claude/w1108/04']
import skia, math
import person as PP, airman2 as A2, gait as G
from kit import P
MAN = PP.Person(0.25, palette={A2.OL:(226,212,182),A2.OL_SH:(196,178,146),A2.OL_HI:(240,230,206),A2.CUFF:(226,212,182),
  A2.BELT:(120,70,44),A2.BELT_SH:(90,50,30),A2.BOOT_C:(110,70,44),A2.BOOT_SH:(84,52,32),A2.SOLE:(60,40,28),
  A2.HAIR:(44,32,26),(150,120,80):(226,212,182)}, cap=False, trouser=(96,78,62))
s=skia.Surface(1080,700); c=s.getCanvas(); c.clear(skia.Color(200,190,170))
for i in range(8):
    d=i*130; x=60+i*130
    ps=A2.Pose(x=x, ground=600, face=1, lean=4, neck=0, **G.legs(d), **G.arms(d))
    MAN.draw(c, ps)
    c.drawLine(0,600,1080,600,skia.Paint(Color=skia.ColorBLACK))
s.makeImageSnapshot().save('/tmp/gait.png')
print('drift', G.gait_check([i*3.0 for i in range(2000)], 0.25))
