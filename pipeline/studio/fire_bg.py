# Background prep for the burning building scene: sky layer (for parallax), flame boxes, collapse chunks.
import numpy as np, cv2, json
from PIL import Image
P=np.array(Image.open('B_plate.png').convert('RGB')).astype(float)
C=np.array(Image.open('B_collapsed.png').convert('RGB')).astype(float)
H,W=P.shape[:2]
# --- sky: per row colour from a clean sky strip (x 1250..1500 above the lamps' cones top, else 650..900)
def skyrow(im):
    rows=[];last=None
    for y in range(H):
        px=im[y]; ok=(px[:,2]>px[:,0]+18)&(px[:,2]>px[:,1]+18)
        v=np.median(px[ok],0) if ok.sum()>40 else last
        rows.append(v); last=v
    rows=np.array(rows,float)
    ys=np.arange(H); fit=ys<880
    rows=np.stack([np.polyval(np.polyfit(ys[fit],rows[fit,c],4),np.minimum(ys,880)) for c in range(3)],1)
    # sky only exists down to the horizon (~y 890); below that keep the last value
    rows=cv2.GaussianBlur(rows[None].astype(np.float32),(1,41),0)[0]
    return rows
R=skyrow(P)
sky=np.repeat(R[:,None,:],W,1)
Image.fromarray(sky.clip(0,255).astype(np.uint8)).save('S_sky.png')
# foreground alpha: pixels that differ from the sky colour of their row
def fg_alpha(im,R):
    d=np.abs(im-R[:,None,:]).sum(2)
    a=np.clip((d-18)/30,0,1)
    a[890:]=1
    cand=(a<0.5).astype(np.uint8)
    n,lab,st,_=cv2.connectedComponentsWithStats(cand)
    keep=np.zeros(n,bool); keep[1:]=st[1:,4]>30000
    a=np.where(keep[lab],a,1.0)
    a=cv2.GaussianBlur(a.astype(np.float32),(3,3),0)
    return a
for n,im in [('S_plate',P),('S_collapsed',C)]:
    a=fg_alpha(im,R)
    Image.fromarray(np.dstack([im,a[...,None]*255]).clip(0,255).astype(np.uint8),'RGBA').save(n+'.png')
# --- flames: bright orange / yellow pixels
def flames(im,name):
    r,g,b=im[...,0],im[...,1],im[...,2]
    f=((r>215)&(g>90)&(b<120)&(r-b>120)).astype(np.uint8)
    f=cv2.dilate(f,np.ones((9,9),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(f)
    boxes=[[int(x),int(y),int(w),int(h)] for x,y,w,h,s in st[1:] if s>400 and y+h<915]
    return boxes
FB={'plate':flames(P,'p'),'collapsed':flames(C,'c')}
print(len(FB['plate']),len(FB['collapsed']))
# --- upper building pieces (falling chunks), cut from the plate along jagged crack lines
rng=np.random.default_rng(3)
def jag(p0,p1,n=9,amp=14):
    pts=[]
    for i in range(n+1):
        t=i/n; x=p0[0]+(p1[0]-p0[0])*t; y=p0[1]+(p1[1]-p0[1])*t
        if 0<i<n: x+=rng.uniform(-amp,amp); y+=rng.uniform(-amp,amp)
        pts.append((x,y))
    return pts
L,Rt,TOP,F3,F2,FL=105,990,0,222,448,662
outline=[(105,FL),(105,150),(140,120),(190,112),(190,18),(272,18),(272,112),(790,82),(880,60),(990,150),(990,FL)]
# horizontal cuts and vertical cracks per band
cuts={'r':(TOP,F3,575),'3':(F3,F2,600),'2':(F2,FL,650)}
HL={F3:jag((0,F3),(W,F3),24,10),F2:jag((0,F2),(W,F2),24,10),FL:[(0,FL),(W,FL)],TOP:[(0,-5),(W,-5)]}
def band_mask(y0,y1):
    m=np.zeros((H,W),np.uint8)
    cv2.fillPoly(m,[np.array(HL[y0]+HL[y1][::-1],np.int32)],1); return m
bmask=np.zeros((H,W),np.uint8); cv2.fillPoly(bmask,[np.array(outline,np.int32)],1)
skyA=fg_alpha(P,R); bmask=bmask&(skyA>0.5).astype(np.uint8)
smoke=(np.abs(P-np.array([45,45,62])).sum(2)<55)&(np.arange(W)[None,:]>820)  # keep the smoke column out of the pieces
chunks=[]
for k,(y0,y1,xc) in cuts.items():
    bm=band_mask(y0,y1)&bmask
    crack=jag((xc+rng.uniform(-20,20),y0-20),(xc+rng.uniform(-30,30),y1+20),8,18)
    lm=np.zeros((H,W),np.uint8); cv2.fillPoly(lm,[np.array([(0,-50)]+crack+[(0,H+50)],np.int32)],1)
    for side,sm in [('L',lm),('R',1-lm)]:
        m=(bm&sm).astype(bool)&~smoke
        m=cv2.dilate(m.astype(np.uint8),np.ones((5,5),np.uint8)).astype(bool)&bmask.astype(bool)&~smoke
        ys,xs=np.where(m); x0,x1,y0b,y1b=xs.min(),xs.max()+1,ys.min(),ys.max()+1
        cut=np.dstack([P[y0b:y1b,x0:x1],m[y0b:y1b,x0:x1,None]*255]).astype(np.uint8)
        nm=f'K_{k}{side}.png'; Image.fromarray(cut,'RGBA').save(nm)
        chunks.append({'img':nm,'x':int(x0),'y':int(y0b),'w':int(x1-x0),'h':int(y1b-y0b),'band':k,'side':side})
mask_all=np.zeros((H,W),bool)
for c in chunks:
    im=np.array(Image.open(c['img']))[...,3]>0; mask_all[c['y']:c['y']+c['h'],c['x']:c['x']+c['w']]|=im
# what shows behind the pieces: the collapsed painting there
behind=np.dstack([C,cv2.dilate(mask_all.astype(np.uint8),np.ones((5,5),np.uint8))[...,None]*255]).clip(0,255).astype(np.uint8)
Image.fromarray(behind,'RGBA').save('S_behind.png')
json.dump({'flames':FB,'chunks':chunks},open('fire_bg.json','w'))
print(chunks)
