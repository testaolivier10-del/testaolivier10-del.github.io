import sys; sys.path.insert(0,'/home/claude/w1108/03')
import skia, airman2 as A, cast
s=skia.Surface(1400,800); c=s.getCanvas(); c.clear(skia.Color(200,196,186))
w=cast.wife(0.5)
for i,d in enumerate((0,15,30,45,60)):
    kw=cast.walk_kw(d,1,arms=10); kw['thigh_n']*=0.6; kw['thigh_f']*=0.6; kw['knee_n']*=0.6; kw['knee_f']*=0.6
    w.draw(c, A.Pose(x=150+i*260, ground=760, **kw))
s.makeImageSnapshot().save('/home/claude/w1108/03/lineup2.png')
