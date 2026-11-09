import sys; sys.path[:0]=['/home/claude/w1108/02']
import skia, build as B
ts=[float(x) for x in sys.argv[2].split(',')]
fn=getattr(B, sys.argv[1])
for t in ts:
    s=skia.Surface(1080,1920); c=s.getCanvas(); fn(c,t); s.makeImageSnapshot().save(f'st_{sys.argv[1]}_{t:05.2f}.png')
