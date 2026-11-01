import sys
sys.path.insert(0, '/home/claude/lv')
import skia, render as R
ts = [float(x) for x in sys.argv[1].split(',')]
cols = 2; tw, th = 960, 540
rows = (len(ts) + 1) // 2
out = skia.Surface(cols * tw, rows * th); oc = out.getCanvas()
big = skia.Surface(1920, 1080)
for i, t in enumerate(ts):
    R.frame(t, big)
    oc.drawImageRect(big.makeImageSnapshot(), skia.Rect((i % 2) * tw, (i // 2) * th, (i % 2) * tw + tw, (i // 2) * th + th), skia.SamplingOptions(skia.FilterMode.kLinear))
out.makeImageSnapshot().save(sys.argv[2], skia.kPNG)
