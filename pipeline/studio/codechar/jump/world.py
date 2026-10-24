"""The courtyard world for the landing Short: the gradient traced painting (bgdraw2.BG) placed in world coordinates
(= painting px), with what the vertical frame needs on top of it:
  - grass extended below the painting (the frame sees lower than the painting goes), with code drawn tufts
  - gentle tree sway (each tree's regions shear about its trunk base, own phase)
  - depth of field: sky, far, building and trees drawn through a soft blur, the wall slightly, the ground sharp
  - parallax: far layers slide less than the ground when the camera pans
Camera: (cx, cy, z) = world point at the frame centre and the zoom (screen px per world px)."""
import math, sys
import numpy as np, skia
sys.path.insert(0, '/home/claude/jump')
import bgdraw2

W_, H_ = 1080, 1920
FEET_Y = 482.0                       # where she stands on the walkway (world y)
TRUNKS = [(148, 325), (236, 325), (402, 325)]
PARALLAX = {'sky': 0.15, 'far': 0.35, 'building': 0.55, 'trees': 0.6, 'wall': 0.85, 'ground': 1.0}
BLUR = {'back': 1.1, 'wall': 0.45}   # world px sigma


class World:
    def __init__(self):
        self.bg = bgdraw2.BG()
        # group tree regions by nearest trunk
        self.tree_groups = {i: [] for i in range(len(TRUNKS))}
        for p, sh, r in self.bg.items['trees']:
            i = int(np.argmin([abs(r['cx'] - tx) for tx, _ in TRUNKS]))
            self.tree_groups[i].append((p, sh))
        rng = np.random.default_rng(3)
        # foreground grass tufts below the walkway (world coords)
        self.tufts = []
        for _ in range(260):
            x = rng.uniform(-200, 1250); y = rng.uniform(524, 760)
            self.tufts.append((x, y, rng.uniform(5, 11) * (0.6 + (y - 520) / 300), rng.uniform(0, 6.28), rng.integers(0, 3)))
        self.tufts.sort(key=lambda q: q[1])

    def _layer(self, c, name, t):
        fill = skia.Paint(AntiAlias=True)
        if name != 'trees':
            for p, sh, r in self.bg.items[name]:
                fill.setShader(sh); c.drawPath(p, fill)
            return
        for i, items in self.tree_groups.items():
            bx, by = TRUNKS[i]
            k = 0.012 * math.sin(t * 1.1 + i * 1.9) + 0.006 * math.sin(t * 2.3 + i)
            c.save()
            m = skia.Matrix(); m.setSkew(k, 0, bx, by)
            c.concat(m)
            for p, sh in items:
                fill.setShader(sh); c.drawPath(p, fill)
            c.restore()

    def _ground_ext(self, c):
        # grass below the painting: continue the painting's bottom colours, darker toward the viewer
        sh = skia.GradientShader.MakeLinear([skia.Point(0, 520), skia.Point(0, 820)],
                                            [skia.Color(64, 98, 38), skia.Color(40, 74, 32)])
        c.drawRect(skia.Rect(-600, 546, 1700, 1400), skia.Paint(Shader=sh))
        # left / right of the painting at ground level (if the camera ever sees past it)
        c.drawRect(skia.Rect(-600, 420, 0, 546), skia.Paint(Color=skia.Color(240, 214, 170)))
        c.drawRect(skia.Rect(1021, 420, 1700, 546), skia.Paint(Color=skia.Color(195, 188, 176)))

    def _tufts(self, c, t, cx, z):
        pa = skia.Paint(AntiAlias=True)
        for x, y, s, ph, kind in self.tufts:
            if abs(x - cx) > 700 / z + 30:
                continue
            sw = 0.25 * math.sin(t * 1.6 + ph)
            colr = [(88, 132, 46), (70, 116, 40), (104, 146, 56)][kind]
            pa.setColor(skia.Color(*colr, 255))
            path = skia.Path()
            for j, (dx, h) in enumerate(((-0.5, 1.0), (0.0, 1.35), (0.55, 0.9))):
                bx = x + dx * s * 0.8
                tip = (bx + (dx * 0.6 + sw) * s, y - h * s)
                path.moveTo(bx - 0.22 * s, y); path.quadTo(bx, y - h * s * 0.5, *tip); path.quadTo(bx + 0.1 * s, y - h * s * 0.45, bx + 0.22 * s, y); path.close()
            c.drawPath(path, pa)

    def draw(self, c, t, cam, ref_cx=500.0):
        """cam = (cx, cy, z). ref_cx: camera x where all layers line up as painted (parallax is relative to it)."""
        cx, cy, z = cam
        def place(name):
            c.save()
            c.translate(W_ / 2, H_ / 2); c.scale(z, z)
            c.translate(-(ref_cx + (cx - ref_cx) * PARALLAX[name]), -cy)
        # back group (sky, far, building, trees) blurred together, so no halos between layers
        b = BLUR['back'] * z
        c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(b, b, skia.TileMode.kClamp)))
        place('sky'); self.bg.draw_sky(c, t, x0=-3000, x1=4000, y_top=-1500); c.restore()
        for name in ('far', 'building', 'trees'):
            place(name); self._layer(c, name, t); c.restore()
        c.restore()
        b = BLUR['wall'] * z
        c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(b, b)))
        place('wall'); self._layer(c, 'wall', t); c.restore()
        c.restore()
        place('ground')
        self._ground_ext(c)
        self._layer(c, 'ground', t)
        c.restore()

    def front(self, c, t, cam, ref_cx=500.0):
        """Foreground grass tufts, drawn after the character."""
        cx, cy, z = cam
        c.save(); c.translate(W_ / 2, H_ / 2); c.scale(z, z); c.translate(-cx, -cy)
        self._tufts(c, t, cx, z)
        c.restore()

    @staticmethod
    def to_screen(cam, p):
        cx, cy, z = cam
        return np.array([z * (p[0] - cx) + W_ / 2, z * (p[1] - cy) + H_ / 2])
