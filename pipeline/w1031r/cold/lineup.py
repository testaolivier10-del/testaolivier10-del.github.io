import sys, math; sys.path.insert(0, '.')
import skia, cast
from cast import Pose
R, O, Pt = cast.make(0.3)
s = skia.Surface(1600, 900); c = s.getCanvas(); c.clear(skia.Color(60, 74, 120))
c.drawRect(skia.Rect(0, 600, 1600, 900), skia.Paint(Color=skia.Color(130, 150, 200)))
R.draw(c, Pose(x=150, ground=600, face=1), light=(0.75, -0.65), world=True)
# kneeling, both hands on a target
ps = Pose(x=420, ground=600, face=1, lean=30, hip_h=330, foot_tn=(150, -10), foot_tf=(-200, -40), ank_f=-70, free_ank=True, hand_n='grip', hand_f='grip')
tg = (560, 470)
ps.hand_tn = R.wpt(ps, tg); ps.hand_tf = R.wpt(ps, (tg[0] + 6, tg[1] + 6))
R.draw(c, ps, world=True); c.drawCircle(*tg, 5, skia.Paint(Color=skia.Color(0, 255, 0)))
O.draw(c, Pose(x=800, ground=600, face=-1, lean=8, thigh_n=20, knee_n=-20, thigh_f=-18, knee_f=-10, hand_n='grip'), world=True)
Pt.draw(c, Pose(x=1000, ground=600, face=1, blink=True, hand_n='flat', hand_f='flat'), world=True)
c.save(); c.translate(1500, 820); c.rotate(-90)
Pt.draw(c, Pose(x=0, ground=0, face=1, blink=True, uarm_n=0, elbow_n=4, uarm_f=0, elbow_f=4), shadow=False)
c.restore()
s.makeImageSnapshot().save('lineup.png')
