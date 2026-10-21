"""LevlPrep studio liquid system (2026-10-21, studio system section 7).

Liquids are simulated as particles and drawn MERGED into one continuous style B shape (metaballs), never as
separate drops that pop in and fade. Streams stretch, thin and break into droplets on their own; liquid lands,
runs along surfaces, pools, soaks into absorbers (gauze) as a growing stain, and stays.

Use:
    from studio import liquid as L
    sim = L.Sim(W=1920, H=1080, fps=30, px_per_m=1100)
    sim.add_emitter(L.arterial(x, y, angle_deg, bpm=110, start=0.5))
    sim.add_surface([(x0, y0), (x1, y1), ...], kind="skin")       # polyline the liquid hits and runs along
    sim.add_floor(y)                                               # flat floor where it pools
    sim.add_absorber([(x, y), ...])                                 # polygon that soaks it up (gauze)
    sim.run(seconds)
    L.render(sim, "out/dir", style=L.ARTERIAL)                      # 0000.png ... transparent RGBA frames

The frames play in engine2 / engine_long like an acting shot: <img class="mclip" data-dir=... data-start=...
data-n=... data-fps="30">. Everything is deterministic (fixed seed), so a re-render gives the same frames.
"""
import math, os, json
import numpy as np
import cv2
from scipy.spatial import cKDTree

# ---------------------------------------------------------------- styles (style B: flat fill, darker edge, warm rim)
def _hex(h):
    h = h.lstrip("#"); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255

ARTERIAL = dict(body="#d0142c", dark="#7c0a1b", rim="#ff9a6a", spec="#ffe2d6",
                stain="#a3101f", stain_edge="#5e0712", trail="#b0122a")
VENOUS = dict(body="#8f1121", dark="#4f0812", rim="#d9604a", spec="#f3b8ac",
              stain="#7a0d1b", stain_edge="#43060e", trail="#7e0e1d")
WATER = dict(body="#5fc4f0", dark="#2a7fb8", rim="#e9fbff", spec="#ffffff",
             stain="#3d9bd0", stain_edge="#2a6f9c", trail="#6fcdf2")


# ---------------------------------------------------------------- emitters
class Emitter:
    """Particles leave (x, y) along angle (degrees, 0 = right, 90 = down) at speed (m/s) with spread.
    rate(t) gives particles per second, speed_mul(t) scales speed (heartbeat pulses)."""
    def __init__(self, x, y, angle, speed, spread_deg, rate, speed_mul=lambda t: 1.0,
                 start=0.0, stop=1e9, jitter=1.5, radius=1.0):
        self.x, self.y, self.angle, self.speed = x, y, angle, speed
        self.spread, self.rate, self.speed_mul = spread_deg, rate, speed_mul
        self.start, self.stop, self.jitter, self.radius = start, stop, jitter, radius
        self.acc = 0.0


def heartbeat(t, bpm):
    """0..1 pressure wave: a fast systolic rise and a slower fall, then a quiet diastole (arterial pulse shape)."""
    ph = (t * bpm / 60.0) % 1.0
    if ph < 0.12: return math.sin(ph / 0.12 * math.pi / 2) ** 2
    if ph < 0.45: return 0.5 + 0.5 * math.cos((ph - 0.12) / 0.33 * math.pi)
    return 0.0


def arterial(x, y, angle, bpm=110, start=0.0, stop=1e9, peak_speed=3.0, base=0.18):
    """Bright red, spurting in pulses timed to the heartbeat; each spurt arcs out and falls."""
    def mul(t): return base + (1 - base) * heartbeat(t, bpm)
    def rate(t): return 220 + 900 * heartbeat(t, bpm)
    return Emitter(x, y, angle, peak_speed, 4.0, rate, mul, start, stop)


def venous(x, y, angle=90, start=0.0, stop=1e9, speed=0.35):
    """Dark red, a steady flow with no pulsing, running out and down."""
    return Emitter(x, y, angle, speed, 10.0, lambda t: 260, lambda t: 1.0, start, stop, jitter=3.0)


def capillary(x, y, w, start=0.0, stop=1e9):
    """Slow oozing that beads up across a scrape: many tiny low speed sources along a line of width w."""
    e = Emitter(x, y, 90, 0.03, 60.0, lambda t: 40, lambda t: 1.0, start, stop, jitter=w / 2)
    e.line = w
    return e


# ---------------------------------------------------------------- simulation
class Sim:
    FIELDS = ("p", "v", "age", "contact", "land", "pool", "page")

    def __init__(self, W=1920, H=1080, fps=30, px_per_m=1100, r=7.0, seed=7, substeps=4):
        self.W, self.H, self.fps, self.ppm, self.r = W, H, fps, px_per_m, r
        self.rng = np.random.default_rng(seed)
        self.sub = substeps
        self.g = 9.81 * px_per_m
        self.p = np.zeros((0, 2), np.float32); self.v = np.zeros((0, 2), np.float32)
        self.age = np.zeros(0, np.float32); self.contact = np.zeros(0, bool)
        self.land = np.zeros(0, np.float32)     # floor y where this particle lands (perspective depth)
        self.pool = np.zeros(0, bool)           # resting in a puddle on the floor
        self.page = np.zeros(0, np.float32)     # time spent in the puddle (it spreads)
        self.emitters, self.surfaces, self.absorbers = [], [], []
        self.floor = None
        self.frames = []
        self.absorbed = []         # (frame, x, y, absorber index)
        self.t = 0.0

    def _keep(self, m):
        for f in self.FIELDS: setattr(self, f, getattr(self, f)[m])

    def add_emitter(self, e): self.emitters.append(e); return e
    def add_surface(self, pts, kind="skin", friction=0.18, adhesion=0.6):
        pts = np.array(pts, np.float32)
        self.surfaces.append(dict(a=pts[:-1], b=pts[1:], kind=kind, fr=friction, ad=adhesion)); return self

    def add_floor(self, y, depth=0.0, persp=0.28, spread=1.0):
        """A floor seen at an angle. Drops land around y (+/- depth px in screen y, so a puddle has depth), stop,
        and spread into a flat puddle drawn as ellipses squashed by persp (0 = edge on, 1 = straight down)."""
        self.floor = dict(y=float(y), depth=float(depth), persp=persp, spread=spread); return self

    def add_absorber(self, poly, rate=1.0, stain=None, stain_edge=None, grow=1.0):
        """A polygon that soaks liquid up (gauze, cloth). stain colors override the style's (blood on denim is
        darker and browner than on white gauze); grow scales how far it wicks."""
        self.absorbers.append(dict(poly=np.array(poly, np.float32), rate=rate, stain=stain, stain_edge=stain_edge,
                                   grow=grow)); return self

    def _add(self, P, V):
        n = len(P)
        P = np.array(P, np.float32).reshape(-1, 2); V = np.array(V, np.float32).reshape(-1, 2)
        if self.floor is not None:
            f = self.floor
            land = f["y"] + np.clip(self.rng.normal(0, f["depth"] * 0.5 + 1e-3, n), -f["depth"], f["depth"])
        else:
            land = np.full(n, 1e9)
        self.p = np.vstack([self.p, P]); self.v = np.vstack([self.v, V])
        self.age = np.concatenate([self.age, np.zeros(n, np.float32)])
        self.contact = np.concatenate([self.contact, np.zeros(n, bool)])
        self.land = np.concatenate([self.land, land.astype(np.float32)])
        self.pool = np.concatenate([self.pool, np.zeros(n, bool)])
        self.page = np.concatenate([self.page, np.zeros(n, np.float32)])

    def _emit(self, dt):
        newp, newv = [], []
        for e in self.emitters:
            if not (e.start <= self.t < e.stop): continue
            e.acc += e.rate(self.t - e.start) * dt
            n = int(e.acc); e.acc -= n
            for _ in range(n):
                a = math.radians(e.angle + self.rng.normal(0, e.spread))
                s = e.speed * e.speed_mul(self.t - e.start) * (1 + self.rng.normal(0, 0.06)) * self.ppm
                ox = self.rng.uniform(-1, 1) * getattr(e, "line", 0) / 2
                off = self.r * 1.6                      # leave the wound, not from inside the skin
                newp.append((e.x + ox + math.cos(a) * off + self.rng.normal(0, e.jitter),
                             e.y + math.sin(a) * off + self.rng.normal(0, e.jitter)))
                newv.append((math.cos(a) * s, math.sin(a) * s))
        if newp: self._add(newp, newv)

    def _neighbours(self, dt, act):
        """Pressure and cohesion between near moving particles (keeps a stream connected and lets it neck and
        break into drops), plus velocity smoothing (viscosity)."""
        idx = np.nonzero(act)[0]
        if len(idx) < 2: return
        P = self.p[idx]
        h = self.r * 2.6
        pairs = cKDTree(P).query_pairs(h, output_type="ndarray")
        if len(pairs) == 0: return
        i, j = pairs[:, 0], pairs[:, 1]
        d = P[j] - P[i]
        dist = np.linalg.norm(d, axis=1) + 1e-6
        nrm = d / dist[:, None]
        rest = self.r * 1.5
        k = np.where(dist < rest, 2600.0, 380.0)
        f = (k * (dist - rest) / h)[:, None] * nrm
        acc = np.zeros_like(P)
        np.add.at(acc, i, f); np.add.at(acc, j, -f)
        V = self.v[idx]
        V += acc * dt * self.r
        w = (1 - dist / h)[:, None] * 0.08
        dv = (V[j] - V[i]) * w
        dvv = np.zeros_like(V)
        np.add.at(dvv, i, dv); np.add.at(dvv, j, -dv)
        self.v[idx] = V + dvv

    def _collide(self, dt, act):
        self.contact[:] = self.pool
        r = self.r
        idx = np.nonzero(act)[0]
        if len(idx) == 0: return
        P, V, C = self.p[idx], self.v[idx], np.zeros(len(idx), bool)
        for s in self.surfaces:
            a, b = s["a"], s["b"]
            for k in range(len(a)):
                ab = b[k] - a[k]; L2 = float(ab @ ab) + 1e-6
                t = np.clip(((P - a[k]) @ ab) / L2, 0, 1)
                q = a[k] + t[:, None] * ab
                d = P - q
                dist = np.linalg.norm(d, axis=1) + 1e-6
                hit = dist < r * 1.05
                if not hit.any(): continue
                nrm = d[hit] / dist[hit][:, None]
                P[hit] = q[hit] + nrm * r * 1.05
                v = V[hit]
                vn = (v * nrm).sum(1)
                into = vn < 0
                v[into] -= (vn[into] * 1.05)[:, None] * nrm[into]
                tang = v - (v * nrm).sum(1)[:, None] * nrm
                v = (v - tang) + tang * (1 - s["fr"])
                slow = (np.linalg.norm(v, axis=1) < 0.6 * self.ppm)[:, None]
                v -= nrm * s["ad"] * r * 8 * dt * 60 * slow          # slow liquid clings and runs along skin
                V[hit] = v; C[hit] = True
        self.p[idx], self.v[idx] = P, V
        self.contact[idx] = C
        # landing on the floor: stop, splash a little crown, join the puddle
        if self.floor is not None:
            landed = act & (self.p[:, 1] >= self.land) & (self.v[:, 1] > 0)
            if landed.any():
                li = np.nonzero(landed)[0]
                sp = self.v[li, 1]
                fast = li[sp > 2.0 * self.ppm]
                if len(fast):                                   # a few splash droplets from hard landings
                    pick = fast[self.rng.random(len(fast)) < 0.25]
                    if len(pick):
                        ang = self.rng.uniform(-155, -25, len(pick))
                        spd = self.rng.uniform(0.4, 0.9, len(pick)) * self.ppm
                        P2 = self.p[pick] + np.array([0, -2], np.float32)
                        V2 = np.stack([np.cos(np.radians(ang)) * spd, np.sin(np.radians(ang)) * spd * 0.6], 1)
                        self._add(P2, V2)
                        # the new particles land at the same depth as their parent
                        self.land[-len(pick):] = self.land[pick]
                self.p[li, 1] = self.land[li]
                self.v[li] = 0; self.pool[li] = True; self.contact[li] = True

    def _spread(self, dt):
        """Puddle particles slide apart (a puddle keeps spreading, fast at first, then slowing)."""
        idx = np.nonzero(self.pool)[0]
        self.page[idx] += dt
        if len(idx) < 2: return
        P = self.p[idx]
        pairs = cKDTree(P).query_pairs(self.r * 2.2, output_type="ndarray")
        if len(pairs) == 0: return
        i, j = pairs[:, 0], pairs[:, 1]
        d = P[j] - P[i]; dist = np.linalg.norm(d, axis=1) + 1e-6
        persp = self.floor["persp"] if self.floor else 0.3
        push = (self.r * 2.2 - dist)[:, None] * d / dist[:, None] * 0.5 * dt * 6 * self.floor.get("spread", 1)
        push[:, 1] *= persp
        mv = np.zeros_like(P); np.add.at(mv, i, -push); np.add.at(mv, j, push)
        self.p[idx] += mv

    def _absorb(self, frame):
        if not self.absorbers or len(self.p) == 0: return
        keep = np.ones(len(self.p), bool)
        for ai, a in enumerate(self.absorbers):
            path = a["poly"]
            x0, y0 = path.min(0); x1, y1 = path.max(0)
            cand = np.nonzero(keep & (self.p[:, 0] >= x0) & (self.p[:, 0] <= x1) & (self.p[:, 1] >= y0) & (self.p[:, 1] <= y1))[0]
            poly = path.reshape(-1, 1, 2)
            for idx in cand:
                if cv2.pointPolygonTest(poly, (float(self.p[idx, 0]), float(self.p[idx, 1])), False) >= 0:
                    keep[idx] = False
                    self.absorbed.append((frame, float(self.p[idx, 0]), float(self.p[idx, 1]), ai))
        if not keep.all(): self._keep(keep)

    def _cull(self):
        m = (self.p[:, 0] > -200) & (self.p[:, 0] < self.W + 200) & (self.p[:, 1] < self.H + 200)
        if not m.all(): self._keep(m)

    def run(self, seconds, max_particles=7000):
        nf = int(round(seconds * self.fps))
        dt = 1.0 / (self.fps * self.sub)
        for f in range(nf):
            for _ in range(self.sub):
                self._emit(dt)
                if len(self.p):
                    act = ~self.pool
                    self.v[act, 1] += self.g * dt
                    self.v[act] *= (1 - 0.15 * dt)
                    self._neighbours(dt, act)
                    sp = np.linalg.norm(self.v, axis=1)
                    cap = 6.0 * self.ppm
                    over = sp > cap
                    if over.any(): self.v[over] *= (cap / sp[over])[:, None]
                    self.p[act] += self.v[act] * dt
                    self._collide(dt, act)
                    self._spread(dt)
                    self.age += dt
                self.t += dt
            self._absorb(f)
            self._cull()
            if len(self.p) > max_particles:                   # thin the oldest puddle particles, the shape stays
                old = np.nonzero(self.pool)[0]
                drop = old[np.argsort(-self.page[old])][: (len(self.p) - max_particles)][::2]
                keep = np.ones(len(self.p), bool); keep[drop] = False; self._keep(keep)
            self.frames.append(dict(p=self.p.copy(), v=self.v.copy(), contact=self.contact.copy(),
                                    pool=self.pool.copy(), page=self.page.copy()))
        return self


# ---------------------------------------------------------------- drawing
def _smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def _shift(m, dx, dy):
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    return cv2.warpAffine(m, M, (m.shape[1], m.shape[0]), borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def _field(fr, W, H, r, scale, fps, persp=0.28):
    """Density field: moving particles are splatted as short segments along their motion (so fast drops stretch
    into streaks instead of breaking into dashes), puddle particles as flat ellipses that grow as the puddle
    spreads. Blurred, then thresholded by the caller into one merged shape."""
    w, h = int(W * scale), int(H * scale)
    fld = np.zeros((h, w), np.float32)
    p, v = fr["p"], fr["v"]
    if len(p) == 0: return fld
    pool = fr.get("pool", np.zeros(len(p), bool)); page = fr.get("page", np.zeros(len(p)))
    mv = np.nonzero(~pool)[0]
    for k in mv:
        x, y = p[k] * scale
        vx, vy = v[k] / fps * 0.32 * scale
        n = max(1, int(math.hypot(vx, vy) / 1.5))            # a soft streak made of points: round ends, no blocks
        for q in range(n + 1):
            f = q / n
            xi, yi = int(x - vx * f), int(y - vy * f)
            if 0 <= xi < w and 0 <= yi < h: fld[yi, xi] += 1.0 / (1 + 0.6 * n)
        if 0 <= int(x) < w and 0 <= int(y) < h: fld[int(y), int(x)] += 0.6
    for k in np.nonzero(pool)[0]:
        x, y = p[k] * scale
        rx = r * scale * (1.0 + min(1.6, 1.2 * math.sqrt(page[k] + 0.01)))
        cv2.ellipse(fld, (int(x), int(y)), (max(1, int(rx)), max(1, int(rx * persp))), 0, 0, 360, 0.55, -1, lineType=cv2.LINE_AA)
    sig = max(1.0, r * scale * 1.15)
    return cv2.GaussianBlur(fld, (0, 0), sig)


def _stain_mask(sim, frame, ai, scale, grow=1.0):
    """Absorbed liquid spreads through the gauze: discs that keep growing (wicking) with a ragged edge."""
    w, h = int(sim.W * scale), int(sim.H * scale)
    m = np.zeros((h, w), np.float32)
    rng = np.random.default_rng(11 + ai)
    for (f, x, y, a) in sim.absorbed:
        if a != ai or f > frame: continue
        age = (frame - f) / sim.fps
        rad = (sim.r * 1.6 + 26 * grow * math.sqrt(age + 0.02)) * scale
        cv2.circle(m, (int(x * scale), int(y * scale)), int(rad), 1.0, -1, lineType=cv2.LINE_AA)
    if m.max() == 0: return m
    noise = cv2.GaussianBlur(rng.random((h, w)).astype(np.float32), (0, 0), 6 * scale + 1)
    noise = (noise - noise.mean()) / (noise.std() + 1e-6)
    soft = cv2.GaussianBlur(m, (0, 0), 7 * scale + 1)
    m = _smooth(soft + noise * 0.08, 0.42, 0.52)
    poly = np.zeros((h, w), np.uint8)
    cv2.fillPoly(poly, [(sim.absorbers[ai]["poly"] * scale).astype(np.int32)], 1)
    return m * poly


def render(sim, out_dir, style=ARTERIAL, light=(-0.7, -0.7), scale=0.75, trail=True, stain=True, start_index=0, only=None):
    """Draw every simulated frame as a transparent 1920x1080 (or W x H) PNG: flat body color, darker edge away
    from the light, a warm rim on the lit edge, a small specular highlight, a fading trail where it ran over
    skin, and stains in absorbers with a darker tide line."""
    os.makedirs(out_dir, exist_ok=True)
    W, H, r = sim.W, sim.H, sim.r
    col = {k: _hex(v) for k, v in style.items()}
    lx, ly = light; ln = math.hypot(lx, ly); lx, ly = lx / ln, ly / ln
    d1 = r * scale * 0.9; d2 = r * scale * 0.35
    trail_acc = np.zeros((int(H * scale), int(W * scale)), np.float32)
    for fi, fr in enumerate(sim.frames):
        if only is not None and fi not in only and not (trail and fi < max(only)): continue
        if only is not None and fi not in only:
            # keep the trail accumulating without drawing the frame
            cp = fr["p"][fr["contact"]]
            if len(cp):
                t = np.zeros_like(trail_acc)
                xi = np.clip((cp[:, 0] * scale).astype(int), 0, t.shape[1] - 1)
                yi = np.clip((cp[:, 1] * scale).astype(int), 0, t.shape[0] - 1)
                np.add.at(t, (yi, xi), 1.0)
                trail_acc = np.maximum(trail_acc * 0.997, cv2.GaussianBlur(t, (0, 0), r * scale * 0.7) * 6)
            continue
        fld = _field(fr, W, H, r, scale, sim.fps, sim.floor['persp'] if sim.floor else 0.28)
        peak = 1.0 / (2 * math.pi * (max(1.0, r * scale * 1.15)) ** 2)
        m = _smooth(fld, peak * 0.42, peak * 0.62)
        rgb = np.zeros(m.shape + (3,), np.float32); a = np.zeros(m.shape, np.float32)
        # stains under everything
        if stain and sim.absorbers:
            for ai in range(len(sim.absorbers)):
                ab = sim.absorbers[ai]
                sm = _stain_mask(sim, fi, ai, scale, ab.get("grow", 1.0))
                if sm.max() == 0: continue
                edge = np.clip(sm - cv2.erode(sm, np.ones((5, 5), np.uint8)), 0, 1)
                body = sm * 0.92
                cs = _hex(ab["stain"]) if ab.get("stain") else col["stain"]
                ce = _hex(ab["stain_edge"]) if ab.get("stain_edge") else col["stain_edge"]
                c = cs[None, None] * (body - edge)[..., None] + ce[None, None] * edge[..., None]
                rgb = rgb * (1 - sm[..., None]) + c
                a = np.maximum(a, sm * 0.95)
        # trail left on skin and floor where liquid ran
        if trail and len(fr["p"]):
            cp = fr["p"][fr["contact"]]
            if len(cp):
                t = np.zeros_like(trail_acc)
                xi = np.clip((cp[:, 0] * scale).astype(int), 0, t.shape[1] - 1)
                yi = np.clip((cp[:, 1] * scale).astype(int), 0, t.shape[0] - 1)
                np.add.at(t, (yi, xi), 1.0)
                trail_acc = np.maximum(trail_acc * 0.997, cv2.GaussianBlur(t, (0, 0), r * scale * 0.7) * 6)
            tm = np.clip(trail_acc, 0, 1) * 0.55
            rgb = rgb * (1 - tm[..., None]) + col["trail"][None, None] * tm[..., None]
            a = np.maximum(a, tm)
        # the liquid itself
        if m.max() > 0:
            away = m * (1 - _shift(m, -lx * d1, -ly * d1))       # edge facing away from the light
            lit = m * (1 - _shift(m, lx * d2, ly * d2))          # thin edge facing the light
            core = cv2.erode(m, np.ones((3, 3), np.uint8), iterations=2)
            spec = core * (1 - _shift(core, lx * d2 * 1.6, ly * d2 * 1.6)) * _smooth(fld, peak * 0.9, peak * 1.6)
            c = col["body"][None, None] * np.ones_like(m)[..., None]
            c = c * (1 - away[..., None] * 0.75) + col["dark"][None, None] * (away[..., None] * 0.75)
            c = c * (1 - lit[..., None] * 0.8) + col["rim"][None, None] * (lit[..., None] * 0.8)
            c = c * (1 - spec[..., None] * 0.85) + col["spec"][None, None] * (spec[..., None] * 0.85)
            rgb = rgb * (1 - m[..., None]) + c * m[..., None]
            a = np.maximum(a, m)
        rgba = np.dstack([rgb, a])
        rgba = cv2.resize(rgba, (W, H), interpolation=cv2.INTER_LINEAR)
        out = np.clip(rgba * 255, 0, 255).astype(np.uint8)
        # premultiplied -> straight alpha for PNG
        al = out[..., 3:4].astype(np.float32) / 255
        rgb8 = np.where(al > 0, np.clip(out[..., :3] / np.maximum(al, 1e-3), 0, 255), 0).astype(np.uint8)
        cv2.imwrite(f"{out_dir}/{start_index + fi:04d}.png", cv2.cvtColor(np.dstack([rgb8, out[..., 3]]), cv2.COLOR_RGBA2BGRA))
    json.dump(dict(n=len(sim.frames), fps=sim.fps, W=W, H=H), open(f"{out_dir}/meta.json", "w"))
    return len(sim.frames)
