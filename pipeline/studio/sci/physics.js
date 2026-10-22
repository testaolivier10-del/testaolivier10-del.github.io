/* LevlPrep sci kit: 2D mechanics (2026-10-21). Needs common.js; LPCarts and LPIncline also need vendor/planck-1.4.2.min.js.
   All sims run in SI units (m, s, kg) and map to px with `scale` (px per m). Vectors are computed from the state.

   Which engine and why:
     LPProjectile, LPSpring, LPPendulum: the governing ODEs integrated with RK4 (projectile without drag uses the
       exact closed form). These are one-body problems where the textbook equation IS the model; a rigid body engine
       would only add error (Box2D has no air drag and its springs are soft constraints, not Hooke's law).
     LPCarts, LPIncline: planck.js 1.4.2 (MIT, a JS port of Box2D) for contacts: collision impulses with restitution
       (momentum conserved exactly, equal and opposite impulses) and Coulomb friction with static/kinetic behavior.
       Its velocity threshold is lowered so slow elastic collisions stay elastic.

   new LPProjectile(g, {origin: [px, py], scale, v0, angle (deg), g: 9.81, drag: k (1/m, a = -g - k|v|v), launchAt,
                        ground: py, strobe: 0.25, showComponents: true, units: "m/s"})
   new LPCarts(g, {track: {x0, x1, y}, scale, carts: [{m, v, x (m), w (m), color}], e: 1 (0 = stick together), walls: true})
   new LPSpring(g, {wall: [px, py], scale, k, m, x0 (m), rest (m), damping (kg/s)})
   new LPPendulum(g, {pivot: [px, py], scale, L (m), theta0 (deg), g, damping (1/s)})
   new LPIncline(g, {origin: [px, py], scale, angle (deg), len (m), m, mu_s, mu_k, start (m along ramp)})
   each: .draw(t) -> state ;  .state(t) -> numbers (positions, velocities, forces)                                  */
(function (G) {
  const S = G.LPSci, mk = S.mk;
  const COL = { v: "#ffd34d", vx: "#53b7ff", vy: "#ff7a6b", F: "#ff9f43", N: "#7be0a6", f: "#e46bd8", W: "#ff7a6b", T: "#8fc9ff" };

  // ---------------------------------------------------------------- shared art
  const ART = {
    ball(g, root, r, col) { const e = mk("g", {}, g); mk("ellipse", { cx: r * 0.2, cy: r * 1.05, rx: r * 0.9, ry: r * 0.22, fill: "#0b1230", opacity: 0 , class: "sh" }, e);
      mk("circle", { r, fill: S.sphere(root, col) }, e); mk("path", { d: `M${-r * 0.95} ${-r * 0.1}Q0 ${r * 0.35} ${r * 0.95} ${-r * 0.1}`, stroke: S.darken(col, 0.3), "stroke-width": r * 0.09, fill: "none", opacity: 0.6 }, e);
      mk("path", { d: `M${-r * 0.1} ${-r * 0.97}Q${r * 0.35} 0 ${-r * 0.1} ${r * 0.97}`, stroke: S.darken(col, 0.3), "stroke-width": r * 0.09, fill: "none", opacity: 0.6 }, e); return e; },
    // vector arrow with a value pill. Arrows are filled shapes, no strokes.
    vec(g) { const e = mk("g", {}, g); const p = mk("path", {}, e); const lab = mk("g", {}, e); const r = mk("rect", { rx: 16, fill: "#141c38", opacity: 0.85 }, lab);
      const tx = mk("text", { "font-family": "Inter, Arial", "font-weight": 800, "font-size": 26, "text-anchor": "middle", fill: "#fff" }, lab);
      return { e, set(x0, y0, x1, y1, col, text, lx, ly, w) {
        const L = Math.hypot(x1 - x0, y1 - y0); e.setAttribute("opacity", L < 2 ? 0 : 1);
        p.setAttribute("d", S.arrow(x0, y0, x1, y1, w || 9, 1.5)); p.setAttribute("fill", col);
        if (text) { tx.textContent = text; tx.setAttribute("fill", col); const tw = text.length * 14.5 + 26; r.setAttribute("x", -tw / 2); r.setAttribute("y", -22); r.setAttribute("width", tw); r.setAttribute("height", 40);
          tx.setAttribute("y", 8); lab.setAttribute("transform", `translate(${lx == null ? x1 : lx} ${ly == null ? y1 - 34 : ly})`); lab.setAttribute("opacity", 1); } else lab.setAttribute("opacity", 0); } };
    },
    ground(g, root, x0, x1, y) { mk("rect", { x: x0, y, width: x1 - x0, height: 1080 - y, fill: S.lin(root, "#3d7d4a", "#22492f", 90) }, g);
      mk("rect", { x: x0, y, width: x1 - x0, height: 10, fill: "#6fbf6a" }, g); },
  };
  const fmt = (v, d) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(d == null ? 1 : d);

  function rk4(f, s, t, dt) {                       // s: array, f(s, t) -> ds/dt
    const k1 = f(s, t), a = s.map((v, i) => v + k1[i] * dt / 2), k2 = f(a, t + dt / 2), b = s.map((v, i) => v + k2[i] * dt / 2),
      k3 = f(b, t + dt / 2), c = s.map((v, i) => v + k3[i] * dt), k4 = f(c, t + dt);
    return s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  // ---------------------------------------------------------------- projectile
  class Projectile {
    constructor(g, o) {
      this.o = o = Object.assign({ origin: [200, 900], scale: 40, v0: 20, angle: 45, g: 9.81, drag: 0, launchAt: 0.3, r: 22, color: "#f08a3c",
        strobe: 0.25, showComponents: true, showVelocity: true, trace: true, ground: null, dt: 1 / 480 }, o);
      S.defs(g); this.g = g;
      this.traceEl = mk("path", { fill: "none", stroke: "#fff1d6", "stroke-width": 5, "stroke-linecap": "round", "stroke-dasharray": "2 14", opacity: 0.7 }, g);
      this.ghostG = mk("g", { opacity: 0.3 }, g); this.ghosts = [];
      this.ball = ART.ball(g, g, o.r, o.color);
      this.vecs = { vx: ART.vec(g), vy: ART.vec(g), v: ART.vec(g) };
      this.guide = mk("path", { fill: "none", stroke: "#ffffff", "stroke-width": 3, "stroke-dasharray": "8 10", opacity: 0.35 }, g);
      const a = o.angle * Math.PI / 180;
      this.cache = new S.Cache(o.dt, () => ({ x: 0, y: 0, vx: o.v0 * Math.cos(a), vy: o.v0 * Math.sin(a), landed: false, path: [[0, 0]] }),
        (st, t, dt) => this.step(st, t, dt), (st) => ({ ...st, path: st.path.slice() }), 0.5);
    }
    exact(t) {                                      // closed form, no drag: x = v0x t, y = v0y t - g t^2 / 2
      const o = this.o, a = o.angle * Math.PI / 180, vx = o.v0 * Math.cos(a), vy0 = o.v0 * Math.sin(a), T = 2 * vy0 / o.g, tt = Math.min(Math.max(0, t), T);
      return { x: vx * tt, y: vy0 * tt - 0.5 * o.g * tt * tt, vx: tt < T ? vx : 0, vy: tt < T ? vy0 - o.g * tt : 0, landed: t >= T, tf: T };
    }
    step(st, t, dt) {
      if (st.landed) return;
      const o = this.o, f = (s) => { const sp = Math.hypot(s[2], s[3]); return [s[2], s[3], -o.drag * sp * s[2], -o.g - o.drag * sp * s[3]]; };
      const n = rk4(f, [st.x, st.y, st.vx, st.vy], t, dt);
      if (n[1] < 0 && st.t > 0) { const u = st.y / (st.y - n[1]); st.x += (n[0] - st.x) * u; st.y = 0; st.landed = true; st.vx = st.vy = 0; }
      else { st.x = n[0]; st.y = n[1]; st.vx = n[2]; st.vy = n[3]; }
      if (st.n % 8 === 0 || st.landed) st.path.push([st.x, st.y]);
    }
    state(t) {
      const o = this.o, tt = t - o.launchAt;
      if (tt <= 0) return { x: 0, y: 0, vx: 0, vy: 0, landed: false, tf: 0, path: [], pre: true, tt };
      if (!o.drag) { const e = this.exact(tt); e.tt = tt; return e; }
      const st = this.cache.at(tt); return Object.assign({}, st, { tt });
    }
    px(x, y) { return [this.o.origin[0] + x * this.o.scale, this.o.origin[1] - y * this.o.scale]; }
    draw(t) {
      const o = this.o, st = this.state(t), [X, Y] = this.px(st.x, st.y);
      this.ball.setAttribute("transform", `translate(${X.toFixed(1)} ${(Y - o.r).toFixed(1)}) rotate(${(-st.x * 40).toFixed(1)})`);
      // trace: from the closed form or the integrated path
      let pts = [];
      if (!st.pre) { if (!o.drag) { const n = 60, T = Math.min(st.tt, st.tf); for (let i = 0; i <= n; i++) { const e = this.exact(T * i / n); pts.push(this.px(e.x, e.y)); } }
        else pts = st.path.map((p) => this.px(p[0], p[1])).concat([[X, Y]]); }
      if (o.trace) this.traceEl.setAttribute("d", pts.length > 1 ? "M" + pts.map((p) => p[0].toFixed(1) + " " + (p[1] - o.r).toFixed(1)).join("L") : "");
      // strobe: faint copies at equal time steps (equal horizontal spacing shows vx is constant without drag)
      const k = st.pre ? 0 : Math.floor(Math.min(st.tt, st.tf || st.tt) / o.strobe);
      for (let i = 0; i <= k; i++) {
        if (!this.ghosts[i]) this.ghosts[i] = mk("circle", { r: o.r, fill: S.sphere(this.g, o.color, { flat: 0.4 }) }, this.ghostG);
        const tt = i * o.strobe, p = !o.drag ? this.exact(tt) : (() => { const q = this.cache.at(tt); return q; })();
        const [gx, gy] = this.px(p.x, p.y); this.ghosts[i].setAttribute("cx", gx); this.ghosts[i].setAttribute("cy", gy - o.r); this.ghosts[i].setAttribute("opacity", 1);
      }
      for (let i = k + 1; i < this.ghosts.length; i++) this.ghosts[i].setAttribute("opacity", 0);
      if (o.drag && !st.pre) this.cache.at(st.tt);    // restore the cache head after strobe lookups
      // velocity vector and its components (px per m/s = o.vScale)
      const vs = o.vScale || 9, cy = Y - o.r, show = !st.pre && !st.landed;
      const V = this.vecs;
      if (show && o.showComponents) {
        V.vx.set(X, cy, X + st.vx * vs, cy, COL.vx, `vx ${fmt(st.vx)} m/s`, X + st.vx * vs / 2 + 20, cy + (st.vy >= 0 ? 52 : -48));
        V.vy.set(X, cy, X, cy - st.vy * vs, COL.vy, `vy ${fmt(st.vy)} m/s`, X - 120, cy - st.vy * vs / 2 + (Math.abs(st.vy * vs) < 60 ? -40 * Math.sign(st.vy || 1) : 0));
        this.guide.setAttribute("d", `M${X + st.vx * vs} ${cy}V${cy - st.vy * vs}H${X}`);
      } else { V.vx.set(0, 0, 0, 0); V.vy.set(0, 0, 0, 0); this.guide.setAttribute("d", ""); }
      const sp = Math.hypot(st.vx, st.vy) || 1, ux = st.vx / sp, uy = -st.vy / sp;
      if (show && o.showVelocity !== false) V.v.set(X, cy, X + st.vx * vs, cy - st.vy * vs, COL.v, `v ${fmt(sp)} m/s`, X + st.vx * vs + ux * 80, cy - st.vy * vs + uy * 50 - 10, 11);
      else V.v.set(0, 0, 0, 0);
      return st;
    }
  }

  // ---------------------------------------------------------------- carts on a track (planck.js contacts)
  class Carts {
    constructor(g, o) {
      this.o = o = Object.assign({ track: { x0: 160, x1: 1760, y: 700 }, scale: 200, e: 1, walls: true, dt: 1 / 480, carts: [] }, o);
      if (!G.planck) throw new Error("LPCarts needs vendor/planck-1.4.2.min.js");
      S.defs(g); this.g = g; const T = o.track;
      mk("rect", { x: T.x0 - 30, y: T.y + 4, width: T.x1 - T.x0 + 60, height: 24, rx: 12, fill: S.lin(g, "#9fb3d6", "#5d6f99", 90), filter: "url(#sciRimOnly)" }, g);
      mk("rect", { x: T.x0 - 30, y: T.y + 26, width: T.x1 - T.x0 + 60, height: 30, rx: 8, fill: "#2a3566", opacity: 0.8 }, g);
      if (o.walls) for (const x of [T.x0 - 40, T.x1 + 10]) mk("rect", { x, y: T.y - 110, width: 30, height: 140, rx: 10, fill: S.lin(g, "#c3cbe0", "#7c88aa", 0), filter: "url(#sciRim)" }, g);
      this.cartEls = o.carts.map((c) => this.makeCart(c));
      this.vecs = o.carts.map(() => ART.vec(g));
    }
    makeCart(c) {
      const g = mk("g", { filter: "url(#sciShadow)" }, this.g), w = c.w * this.o.scale, h = Math.max(70, w * 0.5), r = Math.min(h * 0.3, 26);
      const body = mk("g", {}, g);
      mk("rect", { x: -w / 2, y: -h - r * 1.1, width: w, height: h, rx: h * 0.24, fill: S.lin(this.g, S.lighten(c.color, 0.25), S.darken(c.color, 0.2), 90) }, body);
      mk("rect", { x: -w / 2 + 10, y: -h - r * 1.1 + 8, width: w - 20, height: h * 0.18, rx: h * 0.09, fill: "#ffffff", opacity: 0.25 }, body);
      const lab = mk("text", { x: 0, y: -r * 1.1 - h * 0.36, "text-anchor": "middle", "font-family": "Inter, Arial", "font-weight": 800, "font-size": Math.min(30, h * 0.42), fill: "#fff" }, body);
      lab.textContent = `${c.m} kg`;
      const wheels = [-w * 0.3, w * 0.3].map((x) => { const wg = mk("g", {}, g); mk("circle", { r, fill: S.sphere(this.g, "#2b2f45") }, wg); mk("circle", { r: r * 0.42, fill: "#b8c2dc" }, wg);
        mk("rect", { x: -r * 0.12, y: -r * 0.8, width: r * 0.24, height: r * 0.6, rx: r * 0.1, fill: "#b8c2dc" }, wg); wg._x = x; return wg; });
      return { g, wheels, r, h };
    }
    build() {
      const pl = G.planck, o = this.o; pl.Settings.velocityThreshold = 0.0001;      // keep slow collisions elastic
      const world = new pl.World({ gravity: pl.Vec2(0, 0) }), T = o.track, L = (T.x1 - T.x0) / o.scale;
      if (o.walls) { const wb = world.createBody(); wb.createFixture(pl.Box(0.05, 1, pl.Vec2(-0.05, 0.5), 0), { restitution: 1 }); wb.createFixture(pl.Box(0.05, 1, pl.Vec2(L + 0.05, 0.5), 0), { restitution: 1 }); }
      this.bodies = o.carts.map((c) => {
        const b = world.createBody({ type: "dynamic", position: pl.Vec2(c.x, 0.5), fixedRotation: true, bullet: true });
        const hw = c.w / 2, hh = 0.2; b.createFixture(pl.Box(hw, hh), { density: c.m / (4 * hw * hh), friction: 0, restitution: o.e });
        b.setLinearVelocity(pl.Vec2(c.v, 0)); return b; });
      this.world = world; this.wt = 0; this.n = 0;
    }
    state(t) {
      if (!this.world || t < this.wt - 1e-9) this.build();
      while (this.wt + this.o.dt <= t + 1e-9) { this.world.step(this.o.dt, 20, 10); this.n++; this.wt = this.n * this.o.dt; }
      const cs = this.bodies.map((b, i) => { const v = b.getLinearVelocity().x, m = this.o.carts[i].m; return { x: b.getPosition().x, v, m, p: m * v, ke: 0.5 * m * v * v }; });
      return { carts: cs, P: cs.reduce((a, c) => a + c.p, 0), KE: cs.reduce((a, c) => a + c.ke, 0) };
    }
    draw(t) {
      const o = this.o, st = this.state(t), T = o.track;
      st.carts.forEach((c, i) => {
        const el = this.cartEls[i], X = T.x0 + c.x * o.scale;
        el.g.setAttribute("transform", `translate(${X.toFixed(1)} ${T.y})`);
        el.wheels.forEach((w) => w.setAttribute("transform", `translate(${w._x} ${-el.r * 0.9}) rotate(${(c.x * o.scale / el.r * 57.3).toFixed(1)})`));
        const vs = o.vScale || 110, top = T.y - el.h - el.r * 1.1 - 50;
        this.vecs[i].set(X, top, X + c.v * vs, top, COL.v, `v ${fmt(c.v, 2)} m/s`, X + c.v * vs / 2, top - 44, 11);
      });
      return st;
    }
  }

  // ---------------------------------------------------------------- spring-mass (Hooke's law, RK4)
  class Spring {
    constructor(g, o) {
      this.o = o = Object.assign({ wall: [300, 600], scale: 300, k: 20, m: 1, x0: 0.4, rest: 1.2, damping: 0, dt: 1 / 480, color: "#5b8def" }, o);
      S.defs(g); this.g = g;
      mk("rect", { x: o.wall[0] - 40, y: o.wall[1] - 120, width: 40, height: 220, rx: 8, fill: S.lin(g, "#c3cbe0", "#7c88aa", 0), filter: "url(#sciRim)" }, g);
      mk("rect", { x: o.wall[0] - 40, y: o.wall[1] + 70, width: 1500, height: 24, rx: 10, fill: S.lin(g, "#9fb3d6", "#5d6f99", 90) }, g);
      this.coil = mk("path", { fill: "none", stroke: S.lin(g, "#e9eef8", "#8c99b8", 90), "stroke-width": 9, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
      this.block = mk("rect", { width: 140, height: 140, rx: 22, fill: S.lin(g, S.lighten(o.color, 0.25), S.darken(o.color, 0.2), 90), filter: "url(#sciRim)" }, g);
      this.F = ART.vec(g); this.V = ART.vec(g);
      this.cache = new S.Cache(o.dt, () => ({ x: o.x0, v: 0 }), (st, t, dt) => { const n = rk4((s) => [s[1], (-o.k * s[0] - o.damping * s[1]) / o.m], [st.x, st.v], t, dt); st.x = n[0]; st.v = n[1]; }, (s) => ({ ...s }), 0.5);
    }
    state(t) { const s = this.cache.at(t), o = this.o; return { x: s.x, v: s.v, F: -o.k * s.x, a: -o.k * s.x / o.m, E: 0.5 * o.k * s.x * s.x + 0.5 * o.m * s.v * s.v }; }
    draw(t) {
      const o = this.o, st = this.state(t), x0 = o.wall[0], y = o.wall[1], X = x0 + (o.rest + st.x) * o.scale;
      const n = 14, L = X - 70 - x0; let d = `M${x0} ${y}h20`;
      for (let i = 0; i < n; i++) d += `L${(x0 + 20 + (L - 40) * (i + 0.5) / n).toFixed(1)} ${y + (i % 2 ? 34 : -34)}`;
      d += `L${X - 90} ${y}H${X - 70}`; this.coil.setAttribute("d", d);
      this.block.setAttribute("x", X - 70); this.block.setAttribute("y", y - 70);
      this.F.set(X, y - 110, X + st.F * (o.fScale || 12), y - 110, COL.F, `F = -kx = ${fmt(st.F)} N`, X + st.F * (o.fScale || 12) / 2, y - 156, 11);
      if (o.showVelocity) this.V.set(X, y + 110, X + st.v * (o.vScale || 60), y + 110, COL.v, `v ${fmt(st.v, 2)} m/s`, X + st.v * (o.vScale || 60) / 2, y + 156, 9); else this.V.set(0, 0, 0, 0);
      return st;
    }
  }

  // ---------------------------------------------------------------- pendulum (full nonlinear equation, RK4)
  class Pendulum {
    constructor(g, o) {
      this.o = o = Object.assign({ pivot: [960, 200], scale: 300, L: 2, theta0: 40, g: 9.81, damping: 0, m: 1, dt: 1 / 480, color: "#e5483b", r: 46 }, o);
      S.defs(g); this.g = g;
      mk("rect", { x: o.pivot[0] - 160, y: o.pivot[1] - 30, width: 320, height: 30, rx: 10, fill: S.lin(g, "#c3cbe0", "#7c88aa", 90), filter: "url(#sciRim)" }, g);
      this.rod = mk("path", { stroke: "#d9deea", "stroke-width": 7, "stroke-linecap": "round" }, g);
      mk("circle", { cx: o.pivot[0], cy: o.pivot[1], r: 12, fill: S.sphere(g, "#9aa6c4") }, g);
      this.bob = ART.ball(g, g, o.r, o.color);
      this.W = ART.vec(g); this.T = ART.vec(g); this.V = ART.vec(g);
      this.cache = new S.Cache(o.dt, () => ({ th: o.theta0 * Math.PI / 180, w: 0 }),
        (st, t, dt) => { const n = rk4((s) => [s[1], -(o.g / o.L) * Math.sin(s[0]) - o.damping * s[1]], [st.th, st.w], t, dt); st.th = n[0]; st.w = n[1]; }, (s) => ({ ...s }), 0.5);
    }
    state(t) { const s = this.cache.at(t), o = this.o; return { th: s.th, w: s.w, v: o.L * s.w, T: o.m * (o.g * Math.cos(s.th) + o.L * s.w * s.w), W: o.m * o.g }; }
    draw(t) {
      const o = this.o, st = this.state(t), [px, py] = o.pivot, X = px + Math.sin(st.th) * o.L * o.scale, Y = py + Math.cos(st.th) * o.L * o.scale;
      this.rod.setAttribute("d", `M${px} ${py}L${X.toFixed(1)} ${Y.toFixed(1)}`);
      this.bob.setAttribute("transform", `translate(${X.toFixed(1)} ${Y.toFixed(1)})`);
      const fs = o.fScale || 10, ux = (px - X) / (o.L * o.scale), uy = (py - Y) / (o.L * o.scale);
      this.W.set(X, Y, X, Y + st.W * fs, COL.W, `mg ${fmt(st.W)} N`, X + 90, Y + st.W * fs, 10);
      this.T.set(X, Y, X + ux * st.T * fs, Y + uy * st.T * fs, COL.T, `T ${fmt(st.T)} N`, X + ux * st.T * fs - 90, Y + uy * st.T * fs, 10);
      const vs = o.vScale || 50, tx = Math.cos(st.th), ty = -Math.sin(st.th);
      this.V.set(X, Y, X + tx * st.v * vs, Y + ty * st.v * vs, COL.v, `v ${fmt(Math.abs(st.v))} m/s`, X + tx * st.v * vs, Y + ty * st.v * vs - 36, 10);
      return st;
    }
  }

  // ---------------------------------------------------------------- block on an incline (planck.js: gravity, normal and Coulomb friction)
  class Incline {
    constructor(g, o) {
      this.o = o = Object.assign({ origin: [200, 900], scale: 160, angle: 30, len: 9, m: 2, mu_s: 0.3, mu_k: 0.2, start: 7.5, g: 9.81, dt: 1 / 480, size: 0.8, color: "#f2a33a" }, o);
      if (!G.planck) throw new Error("LPIncline needs vendor/planck-1.4.2.min.js");
      S.defs(g); this.g = g; const a = o.angle * Math.PI / 180, [ox, oy] = o.origin, L = o.len * o.scale;
      mk("path", { d: `M${ox} ${oy}L${ox + L * Math.cos(a)} ${oy}L${ox + L * Math.cos(a)} ${oy - L * Math.sin(a)}Z`, fill: S.lin(g, "#7d8fc2", "#3d4a7a", 60), filter: "url(#sciRim)" }, g);
      this.block = mk("rect", { width: o.size * o.scale, height: o.size * o.scale, x: -o.size * o.scale / 2, y: -o.size * o.scale / 2, rx: 14, fill: S.lin(g, S.lighten(o.color, 0.25), S.darken(o.color, 0.25), 90), filter: "url(#sciRim)" }, g);
      this.vec = { W: ART.vec(g), N: ART.vec(g), f: ART.vec(g), v: ART.vec(g) };
    }
    // the ramp rises to the right: its surface runs from origin (bottom left) up to the top right corner
    build() {
      const pl = G.planck, o = this.o, a = o.angle * Math.PI / 180;
      const world = new pl.World({ gravity: pl.Vec2(0, -o.g), allowSleep: false });
      const ramp = world.createBody(); ramp.createFixture(pl.Edge(pl.Vec2(0, 0), pl.Vec2(o.len * Math.cos(a), o.len * Math.sin(a))), { friction: 1 });
      ramp.createFixture(pl.Edge(pl.Vec2(-20, 0), pl.Vec2(0, 0)), { friction: 1 });
      const h = o.size / 2, s = o.start, c = [s * Math.cos(a) - Math.sin(a) * h, s * Math.sin(a) + Math.cos(a) * h];
      const b = world.createBody({ type: "dynamic", position: pl.Vec2(c[0], c[1]), angle: a, fixedRotation: true });
      // Box2D uses one friction coefficient; we switch it between mu_s (at rest) and mu_k (sliding) each step,
      // which is the Coulomb static/kinetic model. Box2D mixes friction as sqrt(f1 f2): the ramp has 1 and the
      // block gets mu^2, so the contact uses exactly mu.
      this.fix = b.createFixture(pl.Box(h, h), { density: o.m / (o.size * o.size), friction: o.mu_s * o.mu_s, restitution: 0 });
      this.N = 0; this.f = 0;
      world.on("post-solve", (contact, imp) => { if (contact.getFixtureA().getBody() === b || contact.getFixtureB().getBody() === b) {
        this.Nacc += imp.normalImpulses.reduce((x, y) => x + y, 0); this.facc += imp.tangentImpulses.reduce((x, y) => x + y, 0); } });
      this.world = world; this.body = b; this.wt = 0; this.n = 0;
    }
    state(t) {
      const o = this.o;
      if (!this.world || t < this.wt - 1e-9) this.build();
      while (this.wt + o.dt <= t + 1e-9) {
        const v = this.body.getLinearVelocity(); const mu = Math.hypot(v.x, v.y) > 1e-3 ? o.mu_k : o.mu_s; this.fix.setFriction(mu * mu);
        for (let c = this.body.getContactList(); c; c = c.next) c.contact.resetFriction();
        this.Nacc = 0; this.facc = 0; this.world.step(o.dt, 20, 10); this.N = this.Nacc / o.dt; this.f = this.facc / o.dt; this.n++; this.wt = this.n * o.dt;
      }
      const p = this.body.getPosition(), v = this.body.getLinearVelocity(), a = o.angle * Math.PI / 180;
      const along = -(v.x * Math.cos(a) + v.y * Math.sin(a));          // speed down the slope
      return { x: p.x, y: p.y, v: along, N: this.N, f: this.f, W: o.m * o.g,
        aTheory: Math.max(0, o.g * (Math.sin(a) - o.mu_k * Math.cos(a))), slides: Math.tan(a) > o.mu_s };
    }
    draw(t) {
      const o = this.o, st = this.state(t), a = o.angle * Math.PI / 180, [ox, oy] = o.origin, X = ox + st.x * o.scale, Y = oy - st.y * o.scale;
      this.block.setAttribute("transform", `translate(${X.toFixed(1)} ${Y.toFixed(1)}) rotate(${-o.angle})`);
      const fs = o.fScale || 9, nx = -Math.sin(a), ny = -Math.cos(a), dx = -Math.cos(a), dy = Math.sin(a);   // screen: surface normal (up-left) and downhill
      const V = this.vec;
      V.W.set(X, Y, X, Y + st.W * fs, COL.W, `mg ${fmt(st.W)} N`, X + 40, Y + st.W * fs + 30, 10);
      V.N.set(X, Y, X + nx * st.N * fs, Y + ny * st.N * fs, COL.N, `N ${fmt(st.N)} N`, X + nx * st.N * fs - 40, Y + ny * st.N * fs - 30, 10);
      const h = o.size * o.scale / 2, cx = X - nx * h, cy = Y - ny * h, F = Math.abs(st.f) * fs;     // friction acts along the contact face
      V.f.set(cx, cy, cx - dx * F, cy - dy * F, COL.f, `f ${fmt(Math.abs(st.f))} N`, cx - dx * F + 70, cy - dy * F + 20, 10);
      V.v.set(0, 0, 0, 0);
      return st;
    }
  }

  G.LPProjectile = Projectile; G.LPCarts = Carts; G.LPSpring = Spring; G.LPPendulum = Pendulum; G.LPIncline = Incline;
  G.LPPhysicsArt = ART;
})(window);
