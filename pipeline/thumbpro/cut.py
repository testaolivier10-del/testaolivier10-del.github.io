"""Cut the hero out of a clean frame of the video's own art: python3 cut.py frame.png x0,y0,x1,y1 out.png"""
import sys, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session
src, box, out = sys.argv[1], tuple(int(v) for v in sys.argv[2].split(',')), sys.argv[3]
im = Image.open(src).convert('RGB').crop(box)
c = np.array(remove(im, session=new_session('isnet-general-use'), post_process_mask=True))
m = cv2.morphologyEx((c[..., 3] > 60).astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
k, lab, st, _ = cv2.connectedComponentsWithStats(m)
big = 1 + np.argmax(st[1:, 4])
keep = np.isin(lab, [i for i in range(1, k) if st[i, 4] > 0.02 * st[big, 4]])
c[..., 3][~(cv2.dilate(keep.astype(np.uint8), np.ones((5, 5))) > 0)] = 0
Image.fromarray(c).save(out)
print(out, Image.fromarray(c).getbbox())
