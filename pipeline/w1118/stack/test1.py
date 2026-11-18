import sys; sys.path[:0]=['/home/claude/w1118/stack','/home/claude/short','/home/claude/guy']
import skia, math, world as Wd, reader as R
s=skia.Surface(1080,1920); c=s.getCanvas()
t=1.0
Wd.wall(c,t); Wd.floor(c,t)
ps=R.Pose(look=(0.8,0.6), focus=0.6)
shR,shL=R.bust(c,200,870,ps,t)
Wd.table(c,t); Wd.lamp(c,t)
xs=Wd.stack_x((0,0,0,0))
# left arm pushes top book left end
tip=(xs[0]-2, Wd.YTT-3.5*Wd.T); ang=math.radians(14)
wr=R.wrist_for(tip,ang)
R.arm(c, shL, wr, bend=-1)
wr2=(60,1200); R.arm(c, shR, wr2, bend=1)
Wd.draw_stack(c,xs)
R.hand(c, wr, ang, -1, R.PUSH)
R.hand(c, wr2, math.radians(10), 1, R.REST)
Wd.beam(c,t)
s.makeImageSnapshot().save('out/test/t1.png')
