import sys, time; sys.path.insert(0, '/home/claude/w1111/smog')
import build as B, skia, os
os.makedirs('/home/claude/w1111/smog/out/stills', exist_ok=True)
pre = sys.argv[1]
for tt in [float(x) for x in sys.argv[2].split(',')]:
    t0 = time.time(); B.SHORT.frame(tt).makeImageSnapshot().save(f'/home/claude/w1111/smog/out/stills/{pre}_{tt:05.2f}.png'); print(tt, round(time.time() - t0, 2))
