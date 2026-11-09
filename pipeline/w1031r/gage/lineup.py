import sys; sys.path.insert(0,'.')
import skia, airman2 as A, gcast as G
from kit import P
s=skia.Surface(1800,900); c=s.getCanvas(); c.clear(skia.Color(200,214,206))
g=G.gage(0.42); ga=G.gage(0.42,after=True); gh=G.gage(0.42,hat=None)
GY=820
# tamp pose: facing left, rod vertical at x0-150
x0=200; rodx=x0-120
kw=dict(face=-1, lean=14, neck=10, thigh_n=-8, knee_n=-6, thigh_f=12, knee_f=-4, hand_n='grip', hand_f='grip')
un,en,_=G.arm_to(g,dict(kw,x=x0),'n',(rodx,GY-300),GY)
uf,ef,_=G.arm_to(g,dict(kw,x=x0),'f',(rodx,GY-360),GY)
c.drawLine(rodx,GY-520,rodx,GY+10,skia.Paint(AntiAlias=True,Color=skia.Color(70,74,80),StrokeWidth=12))
g.draw(c,A.Pose(x=x0,ground=GY,**dict(kw,uarm_n=un,elbow_n=en,uarm_f=uf,elbow_f=ef)))
# standing, pointing, after
ga.draw(c,A.Pose(x=520,ground=GY,face=-1,uarm_n=70,elbow_n=10,hand_n='point',brow=1,mouth=0.6))
# sitting with legs forward (hat off)
gh.draw(c,A.Pose(x=860,ground=GY+84*0.42,face=-1,thigh_n=90,knee_n=0,thigh_f=86,knee_f=0,ank_n=-80,ank_f=-80,lean=-10,uarm_n=-30,elbow_n=10,uarm_f=-40,elbow_f=0,hand_n='flat',hand_f='flat'))
for i,(f,x) in enumerate([(G.worker_a,1160),(G.worker_b,1380),(G.boss,1600)]):
    f(0.42).draw(c,A.Pose(x=x,ground=GY,face=-1 if i<2 else 1,uarm_n=-3,elbow_n=20))
s.makeImageSnapshot().save('/tmp/claude-0/lineup.png')
