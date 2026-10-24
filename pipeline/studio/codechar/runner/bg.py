"""Burning building street (approved fire scene plate, pipeline/studio/sci/art/fire/B_plate.png) as a vertical
world: plate scaled by PS, road extended below, flames animated in place (a rising heat ripple that is strongest
at the flame tips, brightness flicker and a warm glow), embers drifting up from the windows."""
import json, math
import numpy as np, cv2, skia
from PIL import Image

ART = '/tmp/m/pipeline/studio/sci/art/fire/'
PS = 1.6
EXT = 520                                   # world px of road added under the plate
NEAR_Y = 958                                # plate row where the sidewalk (near layer) starts


def _img(a):
    a = np.ascontiguousarray(a)
    return skia.Image.fromarray(a, colorType=skia.ColorType.kRGBA_8888_ColorType)


class Street:
    def __init__(self):
        P = np.array(Image.open(ART + 'B_plate.png').convert('RGB'))
        H, W = P.shape[:2]
        big = cv2.resize(P, (int(W * PS), int(H * PS)), interpolation=cv2.INTER_CUBIC)
        # road below: the plate's last rows, stretched and darkened toward the bottom
        tail = big[-40:].astype(np.float32).mean(0, keepdims=True)
        ext = np.repeat(tail, EXT, 0)
        k = np.linspace(1.0, 0.55, EXT)[:, None, None]
        ext = (ext * k).clip(0, 255).astype(np.uint8)
        world = np.concatenate([big, ext], 0)
        self.W, self.H = world.shape[1], world.shape[0]
        self.base = _img(np.dstack([world, np.full(world.shape[:2], 255, np.uint8)]))
        # near layer: the sidewalk band and the road (moves 1:1 with the runner's feet), continued to the right by a
        # repeating stretch of plain sidewalk so a long run never reaches the corner; the far layer (everything above
        # the grass line) can then slide slower (parallax) during the long tracking run
        y0 = int(NEAR_Y * PS)
        near = world[y0:]
        x_keep, t0, t1 = int(1300 * PS), int(740 * PS), int(1300 * PS)
        tile = near[:, t0:t1].astype(np.float32)
        fw = 60
        ramp = np.linspace(0, 1, fw)[None, :, None]
        tile[:, :fw] = tile[:, :fw] * ramp + near[:, t1:t1 + fw].astype(np.float32) * (1 - ramp)   # seamless wrap
        parts = [near[:, :x_keep].astype(np.float32)]
        while sum(p.shape[1] for p in parts) < 11000:
            parts.append(tile)
        strip = np.concatenate(parts, 1).clip(0, 255).astype(np.uint8)
        a = np.full(strip.shape[:2], 255, np.uint8)
        a[:10] = np.linspace(0, 255, 10).astype(np.uint8)[:, None]
        self.near_y = y0
        self.near = _img(np.dstack([strip, a]))
        self.near_w = strip.shape[1]
        fb = json.load(open(ART + 'fire_bg.json'))['flames']['plate']
        self.flames = []
        r, g, b = [P[..., i].astype(int) for i in range(3)]
        hot = ((r > 200) & (g > 70) & (b < 140) & (r - b > 100)).astype(np.float32)
        for (x, y, w, h) in fb:
            x0, y0 = max(x - 10, 0), max(y - 26, 0)
            x1, y1 = min(x + w + 10, W), min(y + h + 6, H)
            crop = big[int(y0 * PS):int(y1 * PS), int(x0 * PS):int(x1 * PS)]
            m = cv2.resize(hot[y0:y1, x0:x1], (crop.shape[1], crop.shape[0]))
            m = cv2.GaussianBlur(cv2.dilate(m, np.ones((5, 5), np.uint8)), (0, 0), 3)
            self.flames.append(dict(x=x0 * PS, y=y0 * PS, crop=crop, mask=m.clip(0, 1),
                                    seed=(x * 7 + y * 13) % 100, cx=(x + w / 2) * PS, cy=(y + h * 0.55) * PS, r=max(w, h) * PS))
        rng = np.random.default_rng(5)
        self.embers = [dict(f=rng.integers(len(fb)), t0=rng.uniform(0, 4), life=rng.uniform(1.6, 3.2),
                            dx=rng.uniform(-30, 60), sz=rng.uniform(2.0, 4.2), wob=rng.uniform(0, 6)) for _ in range(70)]

    def flame_imgs(self, t):
        out = []
        for f in self.flames:
            h, w = f['crop'].shape[:2]
            yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
            up = 1 - yy / h                                  # 0 at the base, 1 at the tip
            s = f['seed']
            dx = (2.6 * np.sin(yy * 0.09 - t * 9.0 + s) + 1.4 * np.sin(yy * 0.21 - t * 15 + s * 2)) * up ** 1.4 * PS
            dy = (3.0 * np.sin(xx * 0.07 + t * 7.0 + s) * up) * PS - 2.0 * up * PS * (0.5 + 0.5 * math.sin(t * 5 + s))
            warp = cv2.remap(f['crop'], xx + dx, yy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            flick = 1.0 + 0.10 * math.sin(t * 11 + s) + 0.06 * math.sin(t * 23 + 2 * s)
            warp = (warp.astype(np.float32) * flick).clip(0, 255).astype(np.uint8)
            a = (f['mask'] * 255).astype(np.uint8)
            out.append((f, _img(np.dstack([warp, a]))))
        return out

    def draw(self, c, t, shift=0.0):
        """Draw in world coordinates (the caller sets the camera matrix). shift: how far the far layer (building, sky,
        lamps, grass) is moved right of its true place, for parallax; the sidewalk always stays in place."""
        smp = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kNone)
        c.save(); c.translate(shift, 0)
        self._far(c, t, smp)
        c.restore()
        c.drawImage(self.near, 0, self.near_y, smp)

    def _far(self, c, t, smp):
        c.drawImage(self.base, 0, 0, smp)
        for f, im in self.flame_imgs(t):
            c.drawImage(im, f['x'], f['y'], smp)
        # warm glow breathing around each fire
        for f in self.flames:
            k = 0.75 + 0.25 * math.sin(t * 6.3 + f['seed']) * math.sin(t * 2.1 + f['seed'] * 0.3)
            rr = f['r'] * 1.1
            sh = skia.GradientShader.MakeRadial(skia.Point(f['cx'], f['cy']), rr,
                                                [skia.Color(255, 150, 50, int(60 * k)), skia.Color(255, 120, 40, 0)])
            c.drawCircle(f['cx'], f['cy'], rr, skia.Paint(Shader=sh, BlendMode=skia.BlendMode.kPlus))
        # embers
        for e in self.embers:
            f = self.flames[e['f']]
            u = ((t - e['t0']) % e['life']) / e['life']
            x = f['cx'] + e['dx'] * u * PS + 10 * math.sin(e['wob'] + t * 3) * u
            y = f['y'] + 10 - u * 260 * PS
            a = math.sin(math.pi * u) ** 0.8
            c.drawCircle(x, y, e['sz'] * (1 - 0.5 * u), skia.Paint(AntiAlias=True, Color=skia.Color(255, 190, 90, int(220 * a)),
                                                                     MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 1.2)))
