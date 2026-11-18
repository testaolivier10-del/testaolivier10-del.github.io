import sys, math; sys.path[:0]=['/home/claude/w1118/thunen','/home/claude/short','/home/claude/guy']
import skia, cast as K
from lpk import P
def pour_pose(t, th):
    Cc = (190, -600)
    hl = K.handle_pt(Cc, th, -1); angl = math.atan2(hl[1] + 760, hl[0] - 60) if False else math.radians(30)
    bot = K.cpt(Cc, th, 66, 206); angr = math.radians(-20)
    def prop(c, AR, AL): K.churn(c, Cc, th, fill=0.0)
    return K.pose(ik_l=K.hand_wrist(hl, angl, 46), hand_ang_l=angl, ik_r=K.hand_wrist(bot, angr, 40), hand_ang_r=angr, ik_bend_r=1.0, ik_bend_l=-1.0,
                  l_hand=dict(curls=(0.6, 0.8, 0.82, 0.82, 0.8), spread=0.05), r_hand=dict(curls=(0.3, 0.55, 0.6, 0.62, 0.64), spread=0.1),
                  prop=prop, worry=0.8, frown=1.0, brow=0.4, head_yaw=0.3, look=(0.7, 0.2), lid=0.75)
s = skia.Surface(1600, 1200); c = s.getCanvas(); c.clear(skia.Color(150, 190, 120))
K.farmer(c, K.pose(), 300, 1150, 0.95)
K.farmer(c, pour_pose(0, math.radians(108)), 900, 1150, 0.95)
s.makeImageSnapshot().save('out/test/lineup.png')
