import sys,numpy as np,cv2
from PIL import Image
src,box,out,thr=sys.argv[1],[int(v) for v in sys.argv[2].split(',')],sys.argv[3],int(sys.argv[4])
im=np.array(Image.open(src).convert('RGB')).astype(int)
x0,y0,x1,y1=box;crop=im[y0:y1,x0:x1]
bgL=crop[:,:40].mean(1,keepdims=True);bgR=crop[:,-40:].mean(1,keepdims=True)
xs=np.linspace(0,1,crop.shape[1])[None,:,None];bg=bgL*(1-xs)+bgR*xs
m=(np.abs(crop-bg).sum(2)>thr).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
n,lab,st,_=cv2.connectedComponentsWithStats(m);big=1+np.argmax(st[1:,4]);m=(lab==big).astype(np.uint8)
ff=m.copy();mk=np.zeros((m.shape[0]+2,m.shape[1]+2),np.uint8);cv2.floodFill(ff,mk,(0,0),1);m=m|(1-ff)
a=cv2.GaussianBlur(m.astype(np.float32),(0,0),0.8)
rgba=np.dstack([crop.astype(np.uint8),(a*255).astype(np.uint8)])
ys,xx=np.nonzero(rgba[...,3]>10);rgba=rgba[max(ys.min()-4,0):ys.max()+4,max(xx.min()-4,0):xx.max()+4]
Image.fromarray(rgba).save(out)
b=Image.new('RGBA',(rgba.shape[1],rgba.shape[0]),(255,0,255,255));b.alpha_composite(Image.fromarray(rgba));b.convert('RGB').save(out.replace('.png','_mag.png'))
print(rgba.shape)
