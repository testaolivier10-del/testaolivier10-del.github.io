import sys; sys.path.insert(0,'/home/claude/w1118/diamond')
import chars as CH, skia, hands as H
from lpk import P
s = skia.Surface(1080, 1920); c = s.getCanvas(); c.drawRect(skia.Rect(0,0,1080,1920), P((230,200,150)))
ps = CH.pose(head_yaw=0.3, lid=0.6, look=(0.5,0.2), worry=0.5, l_hand=CH.PN.RELAX, l_over=CH.ring_on_finger(0.5))
CH.person(c, 'lost', ps, 300, 1700, 1.15)
ps2 = CH.pose(head_yaw=-0.3, r_up=30, r_fore=140, r_wrist=-30, r_hand=H.GRIP, r_prop=CH.held_bottle(t=0.3, glint=0.6), smile=0.3)
CH.person(c, 'seller', ps2, 780, 1700, 1.15)
s.makeImageSnapshot().save('out/test/lineup.png')
