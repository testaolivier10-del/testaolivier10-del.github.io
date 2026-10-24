"""Two thumbnail concepts for the landing Short, drawn with the real character and courtyard (skia, house fonts)."""
import sys, math
sys.path.insert(0, '/home/claude/runner'); sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig')
sys.path.insert(0, '/home/claude/short'); sys.path.insert(0, '/home/claude/jump'); sys.path.insert(0, '/home/claude/jump/side')
import numpy as np, skia
from PIL import Image
import model, perf, phys, layout as L
import mocap_perf as MP
import world as WLD
from layout import col, TEAL, YELLOW, CORAL, WHITE

TK = MP.Take('13_11', near='Left'); perf.repair(TK)
rig, spec, joints, radius = model.build()
clk = {'tau': 0.7}
P = MP.MocapPerformer(rig, spec, lambda t: [('a', TK, clk['tau'], 1.0)], ground_take=TK)


def pose_at(tau):
    for j in range(int((tau - 0.7) * 120)):
        clk['tau'] = 0.7 + j / 120; W = P.pose(j / 120)
    return W


W = pose_at(2.56)                    # deep in the bent landing
SOLE = P.ground + model.ANKLE_H
Wd = WLD.World()


def scene(z, feet_scr, x_scr):
    s = skia.Surface(1080, 1920); c = s.getCanvas()
    hip = W['body'][2]
    wx = 405 + 0.2 * hip[0]
    cam = (wx - (x_scr - 540) / z, WLD.FEET_Y - (feet_scr - 960) / z, z)
    Wd.draw(c, 0.0, cam, ref_cx=480)
    c.drawRect(skia.Rect(0, 0, 1080, 1920), skia.Paint(Color=skia.Color(5, 10, 26, 90)))
    a = z * 0.2
    xf = np.array([[a, 0, z * (405 - cam[0]) + 540], [0, a, z * (WLD.FEET_Y - 0.2 * SOLE - cam[1]) + 960], [0, 0, 1.0]])
    gy = xf[1, 2] + a * SOLE
    hs = xf @ np.array([*hip, 1.0])
    c.drawOval(skia.Rect(hs[0] - 150, gy - 14, hs[0] + 150, gy + 14), skia.Paint(AntiAlias=True, Color=skia.Color(40, 30, 20, 110),
                                                                          MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10)))
    rig.draw(c, W, xf)
    return s, c, xf, gy


def big(c, lines, y0, size):
    for i, ln in enumerate(lines):
        L.rich_line(c, ln, 540, y0 + i * size * 1.02, size)


# A: the question
s, c, xf, gy = scene(5.2, 1560, 560)
big(c, [[('LOCKED', CORAL)], [('KNEES?', CORAL)]], 330, 190)
big(c, [[('or ', WHITE), ('BENT', TEAL), ('?', WHITE)]], 700, 140)
Image.fromarray(s.makeImageSnapshot().toarray()[..., [2, 1, 0]]).save('/home/claude/jump/out/thumb_a.png')

# B: the graph idea
s, c, xf, gy = scene(4.4, 1640, 760)
big(c, [[('SAME Δp', YELLOW)], [('SMALLER HIT', TEAL)]], 290, 150)
x0, y0, w, h = 90, 600, 520, 520
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 30, y0 - 30, x0 + w + 30, y0 + h + 40), 30, 30), skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, 215)))
ax = skia.Paint(AntiAlias=True, Color=col(WHITE, 220), StrokeWidth=6, StrokeCap=skia.Paint.kRound_Cap)
c.drawLine(x0, y0, x0, y0 + h, ax); c.drawLine(x0, y0 + h, x0 + w, y0 + h, ax)
for fn, colr in ((lambda u: 0.95 * math.sin(math.pi * min(u / 0.16, 1)) ** 2 if u < 0.16 else 0, CORAL),
                 (lambda u: 0.24 * math.sin(math.pi * min(u / 0.55, 1)) ** 1.2 if u < 0.55 else 0, TEAL)):
    p = skia.Path()
    for j, u in enumerate(np.linspace(0, 1, 200)):
        q = (x0 + 20 + u * (w - 40), y0 + h - 8 - fn(u) * (h - 30))
        (p.moveTo if j == 0 else p.lineTo)(*q)
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(colr), StrokeWidth=12, Style=skia.Paint.kStroke_Style, StrokeJoin=skia.Paint.kRound_Join))
Image.fromarray(s.makeImageSnapshot().toarray()[..., [2, 1, 0]]).save('/home/claude/jump/out/thumb_b.png')
print('thumbs written')
