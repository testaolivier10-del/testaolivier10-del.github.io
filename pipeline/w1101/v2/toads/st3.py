import sys; sys.path.insert(0,'/home/claude/toads2')
import build3 as B, numpy as np
from PIL import Image
ts=[float(x) for x in sys.argv[2].split(',')]
ims=[]
for t in ts:
    a=B.frame(t).makeImageSnapshot().toarray()
    ims.append(Image.fromarray(a[:,:,[2,1,0]]).resize((432,768)))
sh=Image.new('RGB',(432*len(ims),768))
for i,im in enumerate(ims): sh.paste(im,(i*432,0))
sh.save(sys.argv[1])
