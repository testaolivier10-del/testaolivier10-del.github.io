import sys, subprocess
from PIL import Image
vid=sys.argv[1]; ts=sys.argv[2:]
subprocess.run(['node','render_long.js',f'out/{vid}','stills']+ts,check=True,cwd='/home/claude/lp')
ims=[Image.open(f'/home/claude/lp/out/{vid}/still_{t}.png').resize((640,360)) for t in ts]
cols=3; rows=(len(ims)+cols-1)//cols
c=Image.new('RGB',(640*cols,360*rows))
for i,im in enumerate(ims): c.paste(im,((i%cols)*640,(i//cols)*360))
c.save(f'/tmp/claude-0/{vid}.png'); print('ok')
