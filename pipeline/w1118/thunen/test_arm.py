import sys, math; sys.path[:0]=['/home/claude/w1118/thunen','/home/claude/short','/home/claude/guy']
import skia, build as B, cast as K
s = skia.Surface(1400, 1000); c = s.getCanvas(); c.clear(skia.Color(236, 226, 200))
ps, tilt, Cc, flow = B.farmer_pour(2.0)
K.farmer(c, ps, 450, 1650, 1.45)
s.makeImageSnapshot().save('out/test/arm_big.png')
