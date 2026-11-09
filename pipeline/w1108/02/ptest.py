import sys; sys.path[:0]=['/home/claude/w1108/02']
import skia, math, airman2 as A2, cast
RUN=cast.runner(0.3); MED=cast.medic(0.3); MED2=cast.medic(0.3,(222,176,140),(196,150,118),(120,80,50))
s=skia.Surface(1080,1920); c=s.getCanvas(); c.clear(skia.Color(200,215,225))
RUN.draw(c, A2.Pose(x=150, ground=800, face=1, lean=10, thigh_n=25,knee_n=-40,thigh_f=-15,knee_f=-10, uarm_n=30,elbow_n=80,uarm_f=-20,elbow_f=80))
MED.draw(c, A2.Pose(x=450, ground=800, face=-1, thigh_n=60, knee_n=-120, thigh_f=40, knee_f=-110, lean=30, uarm_n=60, elbow_n=20, hand_n='flat'))
MED2.draw(c, A2.Pose(x=750, ground=800, face=1))
for i,(th,kn,ln) in enumerate([(30,-80,20),(70,-140,30),(90,-150,50)]):
    RUN.draw(c, A2.Pose(x=150+300*i, ground=1300, face=1, lean=ln, thigh_n=th,knee_n=kn,thigh_f=th-10,knee_f=kn, uarm_n=40,elbow_n=30,uarm_f=30,elbow_f=30, hand_n='flat',hand_f='flat'))
s.makeImageSnapshot().save('ptest.png')
