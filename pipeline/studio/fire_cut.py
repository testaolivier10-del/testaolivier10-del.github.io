# Cut runner frames out of a green sheet: key the green, despill, separate figures by connected parts.
import sys,numpy as np
from PIL import Image
from scipy import ndimage
src,outp=sys.argv[1],sys.argv[2]
im=np.array(Image.open(src).convert('RGB')).astype(float)
r,g,b=im[...,0],im[...,1],im[...,2]
key=np.clip((g-np.maximum(r,b)-25)/60,0,1)          # 1 = green
a=1-key
a[:28]=0;a[-28:]=0;a[:,:28]=0;a[:,-28:]=0
# despill: green may not exceed the larger of red/blue near edges
m=np.maximum(r,b);g2=np.where(g>m,m+(g-m)*0.15,g)
rgb=np.stack([r,g2,b],-1)
lab,n=ndimage.label(a>0.5)
sizes=ndimage.sum(np.ones_like(a),lab,range(1,n+1))
keep=[i+1 for i,s in enumerate(sizes) if s>4000]
figs=[]
for k in keep:
    m=lab==k; m=ndimage.binary_dilation(m,iterations=3)
    ys,xs=np.where(m); figs.append((xs.min(),m,ys,xs))
figs.sort(key=lambda f:f[0])
for i,(x0,m,ys,xs) in enumerate(figs):
    y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    al=(a*m)[y0:y1,x0:x1]
    out=np.dstack([rgb[y0:y1,x0:x1],al*255]).clip(0,255).astype(np.uint8)
    Image.fromarray(out,'RGBA').save(f'{outp}_{i}.png'); print(i,x0,x1,y0,y1)
