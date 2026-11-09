import sys; sys.path[:0]=['/home/claude/w1108/01']
import skia, airman2 as A2, cast
s=skia.Surface(1080,1920); c=s.getCanvas(); c.clear(skia.Color(230,220,200))
c.drawRect(skia.Rect(0,1290,1080,1920), skia.Paint(Color=skia.Color(120,80,60)))
cast.SIS.draw(c, A2.Pose(x=300, ground=1640, face=1, hand_n='flat'))
cast.BRO.draw(c, A2.Pose(x=800, ground=1640, face=-1, uarm_n=40, elbow_n=60, hand_n='grip'))
s.makeImageSnapshot().save('/tmp/claude-0/cast.png')
