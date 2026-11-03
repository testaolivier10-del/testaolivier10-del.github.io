import sys, math, skia
sys.path.insert(0,'/home/claude/plane')
from onebody import *
W,H=1080,1100
surf=skia.Surface(W,H); c=surf.getCanvas(); c.clear(C((70,90,110)))
b=Build(h=460)
mech=Person(b, skin=(214,160,122), top=(92,104,78), top_sh=None, legs=(70,78,60), legs_sh=None, boots=(50,38,30),
            hair=(60,42,30), cap=(96,108,80), sleeve=0.45, belt=(50,40,30))
poses=[Pose(160,700,face=1,arm_n=(10,15),arm_f=(-12,12),leg_n=(8,4),leg_f=(-8,6)),
       Pose(420,700,face=1,lean=8,arm_n=(95,10),arm_f=(-5,40),leg_n=(20,15),leg_f=(-15,10),mouth=0.6),
       Pose(680,700,face=-1,lean=12,neck=-25,arm_n=(60,110),arm_f=(40,120),leg_n=(0,0),leg_f=(5,0)),
       Pose(930,760,face=1,lean=25,arm_n=(150,20),arm_f=(-40,90),leg_n=(60,90),leg_f=(-20,40))]
for p in poses: mech.draw(c,p,light=(-0.7,-0.7))
surf.makeImageSnapshot().save('/home/claude/plane/test_body.png')
