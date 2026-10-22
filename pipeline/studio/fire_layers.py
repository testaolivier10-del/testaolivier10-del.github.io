# Split the green screen runner (g_runner_rig.png) into rig layers in the same 572x1024 frame, filling hidden areas.
import numpy as np, cv2, json
from PIL import Image
from scipy import ndimage
im=np.array(Image.open('g_runner_rig.png').convert('RGB')).astype(float)
H,W=im.shape[:2]
r,g,b=im[...,0],im[...,1],im[...,2]
a=1-np.clip((g-np.maximum(r,b)-25)/60,0,1); a[:6]=0;a[-6:]=0;a[:,:6]=0;a[:,-6:]=0
m=np.maximum(r,b); rgb=np.stack([r,np.where(g>m,m+(g-m)*0.1,g),b],-1)
lum=0.3*r+0.59*np.minimum(g,m)+0.11*b
Y,X=np.mgrid[:H,:W]
fg=a>0.5
def poly(pts):
    mk=np.zeros((H,W),np.uint8); cv2.fillPoly(mk,[np.array(pts,np.int32)],1); return mk>0
# ---- legs: below the hoodie hem the near jeans are lighter (lum ~76) than the far jeans (~52)
legzone=(Y>548)&fg
L8=np.where(fg,lum,0).astype(np.uint8); L8=cv2.medianBlur(L8,15)
near_c=legzone&(L8>64)&(L8<110)
near_c=ndimage.binary_opening(near_c,iterations=2)
lab,n=ndimage.label(near_c); sz=ndimage.sum(near_c,lab,range(1,n+1)); near_c=lab==(1+np.argmax(sz))
near_c=ndimage.binary_closing(near_c,iterations=6)
near_c=ndimage.binary_fill_holes(near_c)
near_shoe=(Y>870)&(X>360)&fg
far_shoe=(Y>840)&(X<250)&fg
near_leg=(near_c|near_shoe)&fg
near_leg=ndimage.binary_dilation(near_leg,iterations=1)&fg
far_leg=legzone&~near_leg&(X<380)
far_leg=ndimage.binary_opening(far_leg,iterations=1)
# ---- near arm: grey sleeve and fist behind the body, left of the back crease
near_arm=fg&poly([(300,268),(318,300),(226,372),(200,392),(192,470),(186,560),(70,560),(95,330),(150,272)])
# ---- far arm: the dark forearm and fist in front of the body
far_arm=fg&(((X>350)&(Y>395)&(Y<475))|((X>440)&(Y>375)&(Y<475)))
body=fg&~near_arm&~far_arm&~near_leg&~far_leg
# keep the jeans top (under the hem) in the body so the hips never open
hips=fg&(Y>=548)&(Y<600)&poly([(200,548),(345,548),(330,600),(215,600)])
body|=hips
def save(name,mask,fillmask=None,fillcol=None):
    al=(a*ndimage.binary_dilation(mask,iterations=1)).clip(0,1)
    col=rgb.copy()
    if fillmask is not None:
        src=np.clip(col,0,255).astype(np.uint8)
        col=cv2.inpaint(src,(fillmask*255).astype(np.uint8),9,cv2.INPAINT_TELEA).astype(float)
        al=np.maximum(al,fillmask.astype(float))
    out=np.dstack([col,al*255]).clip(0,255).astype(np.uint8)
    Image.fromarray(out,'RGBA').save(name)
# body: refill what the near arm covered over the back and shoulder (hoodie grey), only inside the body silhouette
back=poly([(300,268),(318,300),(226,372),(212,392),(206,470),(205,545),(250,545),(250,330)])&~body
back&=poly([(195,260),(330,262),(330,560),(195,560)])
save('L_body.png',body,back)
# far leg: refill the far thigh where the near leg covered it (tube from hip to knee)
tube=np.zeros((H,W),np.uint8); cv2.line(tube,(232,575),(205,735),1,58); tube=(tube>0)&~far_leg&(Y>548)
save('L_farleg.png',far_leg,tube)
save('L_nearleg.png',near_leg)
save('L_neararm.png',near_arm)
# far arm: visible forearm + fist, plus a painted upper arm (hidden behind the body most of the time)
fa=np.dstack([rgb,a[...,None]*255*far_arm[...,None]]).clip(0,255).astype(np.uint8)
up=np.zeros((H,W),np.uint8); cv2.line(up,(300,300),(362,440),1,44); cv2.line(up,(362,440),(380,432),1,40)
upm=(up>0)&~far_arm
col=np.array([58,60,82],float)  # dark sleeve, sampled look
fa[upm,:3]=col; fa[upm,3]=255
Image.fromarray(fa,'RGBA').save('L_fararm.png')
for k,mk in [('body',body),('near_leg',near_leg),('far_leg',far_leg),('near_arm',near_arm),('far_arm',far_arm)]: print(k,int(mk.sum()))
