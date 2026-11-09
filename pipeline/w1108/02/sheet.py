import cv2,numpy as np,glob,sys
fs=sorted(glob.glob(sys.argv[1]+'/st_*.png'));im=[cv2.resize(cv2.imread(f),(270,480)) for f in fs]
n=int(sys.argv[2]) if len(sys.argv)>2 else 9
while len(im)%n: im.append(np.zeros_like(im[0]))
rows=[np.hstack(im[i:i+n]) for i in range(0,len(im),n)];cv2.imwrite(sys.argv[1]+'/sheet.png',np.vstack(rows))
