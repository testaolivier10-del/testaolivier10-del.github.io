#!/bin/bash
# sheet.sh <name> <times...>: render stills into stills/<name>/ and tile them into /tmp/claude-0/<name>.png
n=$1; shift; mkdir -p stills/$n
SD=stills/$n python3 build.py --stills $(echo "$@" | tr ' ' ',') 2>&1 | grep -v Fontconfig | tail -3
python3 -c "
import cv2,numpy as np,glob,sys
fs=sorted(glob.glob('stills/$n/st_*.png'));ims=[cv2.resize(cv2.imread(f),(324,576)) for f in fs]
while len(ims)%5: ims.append(np.zeros_like(ims[0]))
rows=[np.hstack(ims[i:i+5]) for i in range(0,len(ims),5)]
cv2.imwrite('/tmp/claude-0/$n.png',np.vstack(rows))"
