import sys; sys.path.insert(0,'/home/claude/w1108/03')
import skia, airman2 as A, cast
s=skia.Surface(1800,800); c=s.getCanvas(); c.clear(skia.Color(200,196,186))
ppl=[cast.worker(0.5),cast.wife(0.48),cast.baker(0.5),cast.pressman(0.5)]
x=180
for p in ppl:
    p.draw(c, A.Pose(x=x, ground=760, face=1)); 
    p.draw(c, A.Pose(x=x+200, ground=760, face=-1, **{k:v for k,v in cast.walk_kw(30,-1).items() if k!='face'}))
    x+=420
s.makeImageSnapshot().save('/home/claude/w1108/03/lineup.png')
