import sys, math, copy; sys.path[:0]=['/home/claude/w1118/thunen','/home/claude/short','/home/claude/guy']
import skia, build as B, cast as K
s = skia.Surface(2100, 700); c = s.getCanvas(); c.clear(skia.Color(236, 226, 200))
base = dict(K.FARMER['cfg'])
for i, mod in enumerate([{}, {'rolled': False}, {'waistcoat': None}]):
    K.FARMER['cfg'] = dict(base, **mod)
    ps, tilt, Cc, flow = B.farmer_pour(2.0)
    c.save(); c.translate(i * 700, 0); K.farmer(c, ps, 300, 1450, 1.2); c.restore()
s.makeImageSnapshot().save('out/test/arm_var.png')
