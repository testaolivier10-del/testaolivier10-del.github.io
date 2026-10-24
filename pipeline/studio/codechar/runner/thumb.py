"""Two Shorts thumbnail concepts, drawn with the real character (skia, house fonts)."""
import sys, math
sys.path.insert(0, '/home/claude/runner'); sys.path.insert(0, '/home/claude/short'); sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig')
import numpy as np, skia
from PIL import Image, ImageFilter
import model, perf, phys, short_sprint as SS, layout as L
import mocap_perf as MP
from layout import col, TEAL, YELLOW, CORAL, WHITE, GREEN

rig, spec, joints, radius = model.build()
P = MP.MocapPerformer(rig, spec, lambda t: perf.plan_m(min(t, 0.77)), ground_take=perf.START)
P.extra = lambda t: perf.extra_m(min(t, 0.77))
for i in range(80):
    W = P.pose(i / 60)
com = phys.com(rig, W)
an = rig.joint(W, 'n_ft'); wa = rig.world_angle(W, 'n_ft')
cont = np.array([an[0] + math.cos(wa) * 0.72 * model.FOOT_LEN - math.sin(wa) * model.ANKLE_H, P.ground + model.ANKLE_H])
import bg as BG
_st = BG.Street(); _s = skia.Surface(1080, 1920); _c = _s.getCanvas(); _c.translate(540, 960); _c.translate(-760, -1544 + 380); _st.draw(_c, 1.0)
bgimg = Image.fromarray(_s.makeImageSnapshot().toarray()[..., [2, 1, 0]]).filter(ImageFilter.GaussianBlur(9))
bg = np.array(bgimg); bg = (bg * 0.55).astype(np.uint8)


def base():
    s = skia.Surface(1080, 1920); c = s.getCanvas()
    c.drawImage(skia.Image.fromarray(np.dstack([bg, np.full(bg.shape[:2], 255, np.uint8)]), colorType=skia.ColorType.kRGBA_8888_ColorType), 0, 0)
    return s, c


def bigtext(c, lines, y0, size):
    for i, ln in enumerate(lines):
        y = y0 + i * size * 1.0
        f = skia.Font(L.BLACK, size)
        w = sum(f.measureText(t) for t, _ in ln)
        if w > 960:
            f = skia.Font(L.BLACK, size * 960 / w); w = 960
        x = (1080 - w) / 2
        for t, colr in ln:
            p = skia.Path(); 
            c.drawString(t, x, y + 10, f, skia.Paint(AntiAlias=True, Color=skia.Color(8, 20, 40)))
            c.drawString(t, x, y, f, skia.Paint(AntiAlias=True, Color=skia.Color(8, 20, 40), Style=skia.Paint.kStroke_Style, StrokeWidth=22, StrokeJoin=skia.Paint.kRound_Join))
            c.drawString(t, x, y, f, skia.Paint(AntiAlias=True, Color=col(colr)))
            x += f.measureText(t)


def runner(c, W, xf, glow=(46, 230, 214)):
    S = rig.shapes(W, xf[:2])
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.DropShadow(0, 0, 26, 26, col(glow, 200))))
    rig.silhouette_fill(c, S, skia.ColorWHITE)
    c.restore()
    c.save()
    c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Dilate(7, 7)))
    rig.silhouette_fill(c, S, skia.ColorWHITE)
    c.restore(); c.restore()
    rig.draw(c, W, xf)


def mark(c):
    f = skia.Font(L.XBOLD, 46); r = skia.RRect.MakeRectXY(skia.Rect(790, 1820, 1044, 1886), 16, 16)
    c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(8, 20, 40, 205)))
    c.drawString('Levl', 808, 1870, skia.Font(L.BLACK, 46), skia.Paint(AntiAlias=True, Color=col(TEAL)))
    c.drawString('Prep', 808 + skia.Font(L.BLACK, 46).measureText('Levl'), 1870, f, skia.Paint(AntiAlias=True, Color=col(WHITE)))


# concept A: the lean with the force line through the centre of mass
s, c = base()
sc = 1.55
xf = np.array([[sc, 0, 560 - sc * com[0]], [0, sc, 1180 - sc * com[1]], [0, 0, 1.0]])
runner(c, W, xf)
cs, ct = xf[:2] @ np.array([*com, 1]), xf[:2] @ np.array([*cont, 1])
d = cs - ct
SS.arrow(c, ct, ct + d * 0.62, YELLOW, w=26, head=70)
SS.dashed(c, ct + d * 0.64, ct + d * 1.35, YELLOW, w=10, on=30, off=18)
SS.arrow(c, ct, ct + np.array([d[0] * 0.62, 0]), TEAL, w=22, head=58)
c.drawCircle(*cs, 30, skia.Paint(AntiAlias=True, Color=skia.Color(8, 10, 24))); c.drawCircle(*cs, 22, skia.Paint(AntiAlias=True, Color=col(YELLOW)))
bigtext(c, [[('WHY THEY', WHITE)], [('LEAN', YELLOW)]], 330, 210)
mark(c)
Image.fromarray(s.makeImageSnapshot().toarray()[..., [2, 1, 0]]).save('/home/claude/runner/out/thumb_a.png')

# concept B: stand up straight and you tip over
s, c = base()
T = dict(x=2.45)
pose = SS.hook_pose(2.2, T); W2 = rig.fk(pose)
c2 = phys.com(rig, W2)
xf = np.array([[sc, 0, 520 - sc * c2[0]], [0, sc, 1150 - sc * c2[1]], [0, 0, 1.0]])
runner(c, W2, xf, glow=(255, 107, 107))
SS.x_stamp(c, 820, 1500, 1.3, 1.0)
bigtext(c, [[('STAND UP', WHITE)], [('= ', WHITE), ('FALL?', CORAL)]], 330, 200)
mark(c)
Image.fromarray(s.makeImageSnapshot().toarray()[..., [2, 1, 0]]).save('/home/claude/runner/out/thumb_b.png')
a = Image.open('/home/claude/runner/out/thumb_a.png').resize((360, 640)); b = Image.open('/home/claude/runner/out/thumb_b.png').resize((360, 640))
sm = [im.resize((180, 320)) for im in (a, b)]
sheet = Image.new('RGB', (1140, 680), (15, 15, 15)); sheet.paste(a, (20, 20)); sheet.paste(b, (400, 20)); sheet.paste(sm[0], (780, 20)); sheet.paste(sm[1], (960, 20))
sheet.save('/home/claude/runner/out/thumb_preview.png')
