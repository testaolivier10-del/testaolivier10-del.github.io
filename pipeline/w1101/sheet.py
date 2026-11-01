import sys,glob
from PIL import Image
d=sys.argv[1]; ts=sys.argv[2].split(',')
ims=[Image.open(f'{d}/st_{float(x):05.2f}.png').resize((270,480)) for x in ts]
n=len(ims); cols=min(n,6); rows=(n+cols-1)//cols
s=Image.new('RGB',(270*cols,480*rows))
for i,im in enumerate(ims): s.paste(im,((i%cols)*270,(i//cols)*480))
s.save(f'{d}/sheet.png')
