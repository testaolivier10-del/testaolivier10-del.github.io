import sys, cv2, numpy as np
sys.path[:0] = ['/home/claude/w1111/tide']
import build as B, skia
ts = [float(x) for x in sys.argv[2].split(',')]; ims = []
for t in ts:
    a = B.SHORT.frame(t).makeImageSnapshot().toarray()[:, :, :3]
    a = cv2.resize(np.ascontiguousarray(a), (432, 768), interpolation=cv2.INTER_AREA); cv2.putText(a, f'{t:.2f}', (8, 28), 0, 0.8, (255, 255, 255), 2); ims.append(a)
cv2.imwrite(sys.argv[1], np.hstack(ims), [cv2.IMWRITE_JPEG_QUALITY, 90])
