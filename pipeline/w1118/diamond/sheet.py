import sys, glob, cv2, numpy as np
fs = sorted(glob.glob(sys.argv[1])); out = sys.argv[2]; w = int(sys.argv[3]) if len(sys.argv) > 3 else 360
ims = []
for f in fs:
    im = cv2.imread(f); im = cv2.resize(im, (w, int(w * im.shape[0] / im.shape[1])))
    cv2.putText(im, f.split('_')[-1][:-4], (8, 30), 0, 0.9, (0, 0, 255), 2); ims.append(im)
n = int(sys.argv[4]) if len(sys.argv) > 4 else 7
while len(ims) % n: ims.append(np.zeros_like(ims[0]))
rows = [np.hstack(ims[i:i + n]) for i in range(0, len(ims), n)]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
