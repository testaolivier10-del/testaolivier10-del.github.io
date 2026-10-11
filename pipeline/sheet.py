import sys, subprocess
from PIL import Image
vid=sys.argv[1]; ts=sys.argv[2:]
subprocess.run(['node','render.js',f'out/{vid}']+ts,check=True)
ims=[Image.open(f'out/{vid}/still_{t}.png').resize((360,640)) for t in ts]
cols=4; rows=(len(ims)+3)//4
c=Image.new('RGB',(360*cols,640*rows))
for i,im in enumerate(ims): c.paste(im,((i%cols)*360,(i//cols)*640))
c.save(f'/tmp/claude-0/{vid}.png'); print('ok')
