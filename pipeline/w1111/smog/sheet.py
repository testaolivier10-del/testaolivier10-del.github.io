import sys, cv2, numpy as np
out, files = sys.argv[1], sys.argv[2:]
ims = [cv2.resize(cv2.imread(f), (540, 960), interpolation=cv2.INTER_AREA) for f in files]
cv2.imwrite(out, np.hstack(ims), [cv2.IMWRITE_JPEG_QUALITY, 88])
