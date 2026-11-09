import sys; sys.path[:0]=['/home/claude/w1108/01']
import skia, airman2 as A2, cast
s=skia.Surface(1080,700); c=s.getCanvas(); c.clear(skia.Color(200,170,140))
for i,(x,f,neck,mouth) in enumerate([(160,1,0,0),(420,1,-30,0.7),(700,-1,0,0),(950,-1,10,0)]):
    c.save(); c.translate(0,-700); cast.SIS.draw(c, A2.Pose(x=x, ground=1640, face=f, neck=neck, mouth=mouth)); c.restore()
s.makeImageSnapshot().save('/tmp/claude-0/sis.png')
