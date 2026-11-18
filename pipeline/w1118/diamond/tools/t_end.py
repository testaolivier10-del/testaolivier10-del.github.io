import sys; sys.path.insert(0,'/home/claude/w1118/diamond')
import build as B, cv2, numpy as np
ims=[]
for h in (0,):
    B.BOTTLE_HABS = h
    im = B.SHORT.frame(40.5).makeImageSnapshot().toarray()[:, :, :3].copy()
    ims.append(cv2.resize(im[900:1700, 0:800], (400, 400)))
cv2.imwrite('out/test/e2.jpg', np.hstack(ims))
