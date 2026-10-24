"""Draw the gradient traced courtyard (art/bg2.json): every region a vector shape with its fitted linear gradient."""
import json, math, sys
import numpy as np, skia
sys.path.append('/home/claude/trace')
import vec

ORDER = ['sky', 'far', 'building', 'trees', 'wall', 'ground']


class BG:
    def __init__(self, path='/home/claude/jump/art/bg2.json'):
        D = json.load(open(path))
        self.W, self.H = D['W'], D['H']
        self.items = {k: [] for k in ORDER}
        self.sky = D['sky']; self.sun = D['sun']
        self.clouds = []
        for cl in D['clouds']:
            p = vec.to_path(cl['segs'])
            sh = skia.GradientShader.MakeLinear([skia.Point(0, cl['y0']), skia.Point(0, cl['y1'])], [skia.Color(*cl['top']), skia.Color(*cl['bot'])])
            self.clouds.append((p, sh))
        for r in sorted(D['regions'], key=lambda r: -r['area']):
            p = vec.to_path(r['segs'])
            sh = skia.GradientShader.MakeLinear([skia.Point(*r['g0']), skia.Point(*r['g1'])],
                                                [skia.Color(*r['c0']), skia.Color(*r['c1'])])
            self.items[r['layer']].append((p, sh, r))

    def draw_layer(self, c, name, t=0.0):
        fill = skia.Paint(AntiAlias=True)
        for p, sh, r in self.items[name]:
            fill.setShader(sh)
            c.drawPath(p, fill)

    def draw_sky(self, c, t=0.0, x0=-3000, x1=6000, y_top=-1500, shift=0.0):
        rows = self.sky; n = len(rows)
        ys = np.linspace(0, n - 1, 14).astype(int)
        top = (np.array(rows[0], float) * 0.80).astype(int)
        pos = [0.0] + [(y - y_top) / (n - y_top) for y in ys]
        sh = skia.GradientShader.MakeLinear([skia.Point(0, y_top), skia.Point(0, n)], [skia.Color(*top)] + [skia.Color(*rows[y]) for y in ys], pos)
        c.drawRect(skia.Rect(x0, y_top, x1, n + 400), skia.Paint(Shader=sh))
        sx, sy, sr = self.sun
        g = skia.GradientShader.MakeRadial(skia.Point(sx + shift, sy), sr * (1 + 0.02 * math.sin(t * 1.3)),
                                           [skia.Color(255, 252, 225, 255), skia.Color(255, 232, 160, 190), skia.Color(255, 214, 150, 60), skia.Color(255, 210, 150, 0)],
                                           [0.0, 0.18, 0.55, 1.0])
        c.drawCircle(sx + shift, sy, sr, skia.Paint(Shader=g))
        # clouds drawn in code in the house style: puffs on a flat base, lit top, cooler underside, drifting
        c.save(); c.translate(shift * 0.6 + t * 5.0, 0)
        for (cx, cy, w) in ((250, 78, 300), (905, 58, 270), (-420, 100, 250), (1500, 88, 290)):
            path = skia.Path()
            puffs = [(-0.34, 0.03, 0.10), (-0.15, -0.02, 0.145), (0.07, -0.005, 0.125), (0.28, 0.035, 0.085)]
            for px, py, pr in puffs:
                path.addCircle(cx + px * w, cy + py * w, pr * w)
            path.addRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 0.44 * w, cy + 0.03 * w, cx + 0.40 * w, cy + 0.11 * w), 0.04 * w, 0.04 * w))
            path.setFillType(skia.PathFillType.kWinding)
            clip = skia.Path(); clip.addRect(skia.Rect(cx - w, cy - w, cx + w, cy + 0.11 * w))
            sh = skia.GradientShader.MakeLinear([skia.Point(0, cy - 0.17 * w), skia.Point(0, cy + 0.11 * w)],
                                                [skia.Color(236, 244, 252, 235), skia.Color(150, 186, 224, 235)])
            c.save(); c.clipPath(clip, doAntiAlias=True)
            c.drawPath(path, skia.Paint(AntiAlias=True, Shader=sh))
            c.restore()
        c.restore()

    def draw(self, c, t=0.0, shift=None):
        shift = shift or {}
        self.draw_sky(c, t, shift=shift.get('sky', 0.0))
        for name in ORDER:
            c.save(); c.translate(shift.get(name, 0.0), 0)
            self.draw_layer(c, name, t)
            c.restore()


if __name__ == '__main__':
    from PIL import Image
    bgi = BG(sys.argv[1] if len(sys.argv) > 1 else '/home/claude/jump/art/bg2.json')
    s = skia.Surface(bgi.W * 2, bgi.H * 2); c = s.getCanvas(); c.clear(skia.ColorWHITE); c.scale(2, 2)
    bgi.draw(c)
    a = s.makeImageSnapshot().toarray()[..., [2, 1, 0]]
    orig = np.array(Image.open('/home/claude/jump/art/scene_crop.png').resize((bgi.W * 2, bgi.H * 2)))
    Image.fromarray(a).save('/home/claude/jump/t_bg2_full.png')
    Image.fromarray(np.concatenate([orig[300:900, 700:1600], a[300:900, 700:1600]], 1)).save('/home/claude/jump/t_bg2_crop.png')
    Image.fromarray(a).resize((bgi.W, bgi.H)).save('/home/claude/jump/t_bg2.png')
