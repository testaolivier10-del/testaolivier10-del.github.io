import sys; sys.path.insert(0,'/home/claude/w1118/diamond')
import chars as CH, skia, hands as H, cv2, numpy as np
from lpk import P
tiles=[]
for habs in (-30, 0, 180, 210):
    s = skia.Surface(700, 900); c = s.getCanvas(); c.drawRect(skia.Rect(0,0,700,900), P((230,200,150)))
    ps2 = CH.pose(head_yaw=-0.3, r_up=30, r_fore=140, r_wrist=-30, r_hand=H.GRIP, r_habs=habs, r_prop=CH.held_bottle(t=0.3, glint=0.6))
    CH.person(c, 'seller', ps2, 400, 1700, 1.4)
    im = s.makeImageSnapshot().toarray()[:, :, :3].copy(); cv2.putText(im, str(habs), (20,60), 0, 2, (0,0,0), 3); tiles.append(im)
cv2.imwrite('out/test/hold.png', cv2.resize(np.hstack(tiles), None, fx=0.6, fy=0.6))
