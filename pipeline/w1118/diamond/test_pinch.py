import sys; sys.path.insert(0,'/home/claude/w1118/diamond')
import chars as CH, skia, hands as H, cv2, numpy as np
from lpk import P, SP
tiles=[]
for (ang, side) in ((-0.2, 1), (-0.2, -1), (3.0, 1), (3.0, -1)):
    s = skia.Surface(700, 700); c = s.getCanvas(); c.drawRect(skia.Rect(0,0,700,700), P((230,200,150)))
    W = H.hand(c, (300 if ang < 1 else 420, 350), ang, side, 4.0, curls=(0.42, 0.42, 0.78, 0.82, 0.86), spread=0.1, nails=True)
    for (u, v, col) in ((80, 17, (255,0,0)), (88, 14, (0,160,0)), (60, 30, (0,0,255)), (70, 24, (255,0,255))):
        p = W(u, v); c.drawCircle(p[0], p[1], 6, P(col))
    im = s.makeImageSnapshot().toarray()[:, :, :3].copy(); cv2.putText(im, f'{ang} {side}', (20,60), 0, 1.5, (0,0,0), 3); tiles.append(im)
cv2.imwrite('out/test/pinch.png', cv2.resize(np.hstack(tiles), None, fx=0.6, fy=0.6))
