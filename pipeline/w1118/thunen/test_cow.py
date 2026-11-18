import sys, math; sys.path[:0]=['/home/claude/w1118/thunen','/home/claude/short','/home/claude/guy']
import skia, cow as CW
s = skia.Surface(1600, 900); c = s.getCanvas(); c.clear(skia.Color(150, 190, 120))
CW.cow(c, 300, 400, 1.6, graze=0.0, tail=0.3)
CW.cow(c, 1000, 400, 1.6, graze=1.0, chew=1.0, tail=-0.5, look=CW.PIED)
for i in range(6): CW.cow(c, 150+i*230, 800, 0.7, walk=i/6, facing=-1)
s.makeImageSnapshot().save('out/test/cow.png')
