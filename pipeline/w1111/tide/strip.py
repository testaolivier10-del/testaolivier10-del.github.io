"""strip of consecutive frames, cropped: strip.py out.jpg t0 n step x0 y0 x1 y1"""
import sys, cv2, numpy as np
sys.path[:0] = ['/home/claude/w1111/tide']
import build as B
o, t0, n, st = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); x0, y0, x1, y1 = map(int, sys.argv[5:9]); ims = []
for i in range(n):
    t = t0 + i * st / 30
    a = np.ascontiguousarray(B.SHORT.frame(t).makeImageSnapshot().toarray()[y0:y1, x0:x1, :3]); k = 300 / a.shape[1]
    a = cv2.resize(a, (300, int(a.shape[0] * k)), interpolation=cv2.INTER_AREA); cv2.putText(a, f'{t:.2f}', (6, 24), 0, 0.7, (255, 255, 255), 2); ims.append(a)
rows = [np.hstack(ims[i:i + 8]) for i in range(0, len(ims), 8)]
cv2.imwrite(o, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
