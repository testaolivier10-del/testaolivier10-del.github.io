import sys; sys.path.insert(0, '.')
import skia, cast
from cast import Pose
R, O, Pt = cast.make(0.6)
s = skia.Surface(900, 900); c = s.getCanvas(); c.clear(skia.Color(60, 74, 120))
R.draw(c, Pose(x=200, ground=850, face=1), world=True)
O.draw(c, Pose(x=520, ground=850, face=1), world=True)
O.draw(c, Pose(x=780, ground=850, face=-1, lean=30, neck=30), world=True)
s.makeImageSnapshot().save('/tmp/lineup2.png')
