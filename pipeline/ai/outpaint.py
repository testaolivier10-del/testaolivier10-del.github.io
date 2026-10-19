"""Extend a 1088x960 still to a full 1088x1920 phone frame (core kept at y=440), via Qwen-Image-Edit on Modal.
usage: python3 outpaint.py in.png out.png "what to put above" "what to put below" [seed]"""
import sys, json, subprocess, os
from PIL import Image, ImageFilter
import numpy as np
src, dst, above, below = sys.argv[1:5]; seed = int(sys.argv[5]) if len(sys.argv) > 5 else 7
TOP = 440
im = Image.open(src).convert('RGB').resize((1088, 960), Image.LANCZOS)
can = Image.new('RGB', (1088, 1920), (128, 128, 128)); can.paste(im, (0, TOP))
tmp = dst + '.pad.png'; can.resize((768, 1360), Image.LANCZOS).save(tmp)
p = ("This is a tall phone frame. The middle band is a finished illustration; the flat plain gray areas above and below it are empty. "
     f"Extend the illustration to fill the whole frame: above it, {above}; below it, {below}. Keep the middle band exactly as it is, "
     "continue every line, color, light and object across the edges seamlessly, same flat 2D vector illustration style, same lighting. "
     "No gray left, no borders, no text, no frames.")
job = dict(refs=[tmp], width=768, height=1360, steps=40, cfg=4.0, seed=seed, prompts=[p])
jp = dst + '.job.json'; json.dump(job, open(jp, 'w'))
subprocess.run(['python3', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lpimg.py'), jp, dst + '.gen'], check=True)
gen = Image.open(dst + '.gen_0.png').convert('RGB').resize((1088, 1920), Image.LANCZOS)
# paste the untouched core back with a soft vertical blend
m = np.zeros((1920, 1088), np.float32); F = 36
for y in range(TOP, TOP + 960):
    d = min(y - TOP, TOP + 960 - 1 - y); m[y, :] = min(1.0, d / F)
mask = Image.fromarray((m * 255).astype('uint8'))
big = Image.new('RGB', (1088, 1920)); big.paste(im, (0, TOP))
Image.composite(big, gen, mask).save(dst)
print('saved', dst)
