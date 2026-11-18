import sys, cv2, numpy as np
ts = sys.argv[1].split(','); out = sys.argv[2]; w = int(sys.argv[3]); n = int(sys.argv[4])
ims = []
for t in ts:
    im = cv2.imread(f'out/stills/st_{float(t):05.2f}.png'); im = cv2.resize(im, (w, int(w * im.shape[0] / im.shape[1])))
    cv2.putText(im, t, (8, 30), 0, 0.9, (0, 0, 255), 2); ims.append(im)
while len(ims) % n: ims.append(np.zeros_like(ims[0]))
cv2.imwrite(out, np.vstack([np.hstack(ims[i:i + n]) for i in range(0, len(ims), n)]), [cv2.IMWRITE_JPEG_QUALITY, 85])
