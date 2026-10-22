/* LevlPrep sci kit: smoke, steam, flames and plumes (2026-10-21). Needs common.js. Draws on a <canvas>.

   new LPSmoke(canvas, {emitters: [{preset, x, y, w, rate, start, stop, dir: [vx, vy], scale}], wind: [vx, vy] or
                        keyframes [[t, vx, vy]], seed, dt: 1/60, res: 0.5 (internal resolution), curlScale: 160})
     presets: "smoke", "steam", "flame", "plume" (industrial smoke, brown grey, long lived), "vapor" (water cycle:
     faint white rising vapor), "cloud" (slow, large, bright puffs)
     smoke.draw(t) clears the canvas and paints every emitter. smoke.stats(t) -> {alive}
     LPSmoke.PRESETS can be edited or extended (motion and look are separate fields: sim vs layers).

   Simulation (pure numbers): particles are born at fixed times (rate per second), each with seeded properties.
   Motion: initial velocity + buoyancy (hot gas rises; acceleration fades as it cools) + wind (felt more as the
   puff slows and ages) + curl noise (divergence free swirl, so it looks like turbulent eddies without sinks or
   sources) with linear drag. Puffs grow as they mix with air (smoke, steam) or shrink as fuel burns out (flame).
   Integrated forward at a fixed step and cached (deterministic, any frame in any order).
   Drawing (art, swappable): particles go into an offscreen layer, are blurred and passed through an alpha
   threshold (a "goo" filter), which merges them into one continuous soft edged shape, then filled with a
   gradient. Each preset stacks layers: the body silhouette, then a cool shade (offset down-right) and a warm
   light (offset up-left) painted only inside the body with heavy blur (style B shadow plane and rim light, no
   outlines). Flames nest red, orange and yellow-white bodies and add an additive glow. Not physically resolved: no real fluid solve
   (simplification: curl noise imitates turbulence; buoyancy is a per-puff force, not a pressure field).          */
(function (G) {
  const S = G.LPSci;
  // layer roles: "body" = merged silhouette (alpha threshold), "shade" / "light" = soft shading painted only inside
  // the body (offset down-right / up-left: style B shadow plane and warm rim), "glow" = additive halo (flames)
  const PRESETS = {
    smoke: { sim: { r0: 14, grow: 16, life: 4.5, speed: 50, spread: 0.3, buoy: -38, buoyFade: 0, curl: 40, drag: 0.6, windK: 1 },
      layers: [{ role: "body", c: ["#8d92a2", "#62677a"], blur: 9, goo: 2.0, op: 0.95 }, { role: "shade", c: ["#2c3142", "#2c3142"], dx: 16, dy: 20, blur: 22, op: 0.55 },
               { role: "light", c: ["#f1e7d6", "#d8d2c6"], dx: -14, dy: -18, rs: 0.8, blur: 20, op: 0.55 }] },
    plume: { sim: { r0: 16, grow: 11, life: 6.5, speed: 60, spread: 0.2, buoy: -40, buoyFade: 0, curl: 34, drag: 0.9, windK: 1.4 },
      layers: [{ role: "body", c: ["#a39684", "#776b5d"], blur: 10, goo: 2.0, op: 0.95 }, { role: "shade", c: ["#3d342d", "#3d342d"], dx: 18, dy: 22, blur: 24, op: 0.5 },
               { role: "light", c: ["#f6ead6", "#e0d2bb"], dx: -16, dy: -20, rs: 0.8, blur: 22, op: 0.55 }] },
    steam: { sim: { r0: 9, grow: 26, life: 2.2, speed: 150, spread: 0.25, buoy: -45, buoyFade: 0, curl: 50, drag: 1.0, windK: 1 },
      layers: [{ role: "body", c: ["#ffffff", "#e3ebf5"], blur: 9, goo: 1.7, op: 0.85 }, { role: "shade", c: ["#93a8c4", "#93a8c4"], dx: 12, dy: 14, blur: 18, op: 0.45 }] },
    vapor: { sim: { r0: 8, grow: 14, life: 3.5, speed: 35, spread: 0.6, buoy: -40, buoyFade: 0, curl: 30, drag: 0.8, windK: 1 },
      layers: [{ role: "body", c: ["#ffffff", "#e6f1fb"], blur: 10, goo: 1.3, op: 0.45 }] },
    cloud: { sim: { r0: 44, grow: 6, life: 9, speed: 12, spread: 1.2, buoy: -4, buoyFade: 5, curl: 14, drag: 0.5, windK: 1 },
      layers: [{ role: "body", c: ["#ffffff", "#e9eff8"], blur: 12, goo: 2.6, op: 1 }, { role: "shade", c: ["#9fb2d0", "#8ea3c4"], dx: 20, dy: 26, blur: 26, op: 0.6 },
               { role: "light", c: ["#fff6e2", "#fff6e2"], dx: -16, dy: -20, rs: 0.8, blur: 22, op: 0.5 }] },
    // flame: short lived, fast rising, shrinking; nested shapes: red-orange outside, orange, yellow-white core at the base
    flame: { sim: { r0: 36, grow: -40, life: 0.72, speed: 60, spread: 0.12, buoy: -430, buoyFade: 0, curl: 55, drag: 1.2, windK: 0.3, flick: 1 },
      layers: [{ role: "glow", c: ["#ff8a2a", "#ff5a2a"], rs: 2.4, blur: 26, op: 0.32, comp: "lighter" },
               { role: "body", c: ["#ff8a26", "#e8402a"], rs: 1.05, blur: 7, goo: 3.2, op: 1 },
               { role: "body", c: ["#ffc63c", "#ff9a26"], rs: 0.74, blur: 6, goo: 3.4, op: 1, dy: 8, fadeTop: 0.75 },
               { role: "body", c: ["#fffbe6", "#ffe38c"], rs: 0.45, blur: 5, goo: 3.6, op: 1, dy: 16, fadeTop: 0.5 }] },
  };

  let gooN = 0;
  function gooFilter(slope) {                         // alpha threshold: a = slope * a - (slope - 1) * 0.5, clamped
    const id = "lpgoo" + String(slope).replace(".", "_");
    if (document.getElementById(id)) return id;
    let svg = document.getElementById("lpsmoke-defs");
    if (!svg) { svg = document.createElementNS(S.NS, "svg"); svg.id = "lpsmoke-defs"; svg.setAttribute("width", 0); svg.setAttribute("height", 0); svg.style.position = "absolute"; document.body.appendChild(svg); }
    svg.insertAdjacentHTML("beforeend", `<filter id="${id}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="${slope * 2}" intercept="${-(slope * 2 - 1) * 0.45}"/></feComponentTransfer></filter>`);
    gooN++; return id;
  }

  class Smoke {
    constructor(canvas, opts) {
      const o = this.o = Object.assign({ emitters: [], wind: [0, 0], seed: 3, dt: 1 / 60, res: 0.5, curlScale: 160 }, opts || {});
      this.cv = canvas; this.ctx = canvas.getContext("2d"); this.W = canvas.width; this.H = canvas.height;
      const mkc = () => { const c = document.createElement("canvas"); c.width = Math.ceil(this.W * o.res); c.height = Math.ceil(this.H * o.res); return c; };
      this.buf = mkc(); this.tmp = mkc();
      this.em = o.emitters.map((e, k) => Object.assign({ w: 10, rate: 30, start: 0, stop: 1e9, dir: [0, -1], scale: 1, k }, e, { P: PRESETS[e.preset] || PRESETS.smoke }));
      for (const e of this.em) for (const L of e.P.layers) if (L.goo) gooFilter(L.goo);
      this.cache = new S.Cache(o.dt, () => ({ P: [], born: this.em.map(() => 0) }), (st, t, dt) => this.step(st, t, dt), null);
    }
    wind(t) { const w = this.o.wind; return Array.isArray(w[0]) ? S.track(w, t, 2) : w; }
    spawn(e, i, tb) {
      const r = S.rng((this.o.seed * 7919 + e.k * 104729 + i * 31337) >>> 0), sm = e.P.sim, sc = e.scale;
      const a = Math.atan2(e.dir[1], e.dir[0]) + (r() - 0.5) * 2 * sm.spread, sp = sm.speed * sc * (0.7 + 0.6 * r());
      return { e: e.k, x: e.x + (r() - 0.5) * e.w, y: e.y + (r() - 0.5) * e.w * 0.2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, tb,
        life: sm.life * (0.75 + 0.5 * r()), r0: sm.r0 * sc * (0.7 + 0.6 * r()), ph: r() * 100 };
    }
    step(st, t, dt) {
      const o = this.o, W = this.wind(t);
      this.em.forEach((e, k) => {                      // births at fixed times: particle i is born at start + i / rate
        const n = Math.floor(Math.max(0, Math.min(t + dt, e.stop) - e.start) * e.rate);
        while (st.born[k] < n) { const i = st.born[k]++; st.P.push(this.spawn(e, i, e.start + i / e.rate)); }
      });
      const cs = o.curlScale;
      for (const p of st.P) {
        const e = this.em[p.e], sm = e.P.sim, sc = e.scale, u = p.age / p.life;
        const by = sm.buoy * sc * (sm.buoyFade ? Math.exp(-p.age / sm.buoyFade) : 1);
        const [cx, cy] = S.curl(p.x / (cs * sc), p.y / (cs * sc), t * 0.35 + e.k * 7.3, 0.02);
        const ck = sm.curl * sc * (0.4 + u);           // eddies grow as the puff ages and mixes
        const wk = sm.windK * Math.min(1, 0.3 + u * 1.5);
        p.vx += ((W[0] * wk - p.vx) * sm.drag * 0.5 + cx * ck) * dt;
        p.vy += (by + (W[1] * wk - p.vy) * sm.drag * 0.5 + cy * ck) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.age += dt;
      }
      st.P = st.P.filter((p) => p.age < p.life);
    }
    stats(t) { return { alive: this.cache.at(t).P.length }; }
    draw(t) {
      const st = this.cache.at(t), ctx = this.ctx, o = this.o, res = o.res, b = this.buf.getContext("2d"), tm = this.tmp.getContext("2d");
      ctx.clearRect(0, 0, this.W, this.H);
      for (const e of this.em) {
        const P = st.P.filter((p) => p.e === e.k); if (!P.length) continue;
        let y0 = 1e9, y1 = -1e9; for (const p of P) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
        // per emitter accumulation canvas: bodies are drawn, shade/light are painted only inside them (source-atop)
        const acc = this.acc || (this.acc = (() => { const c = document.createElement("canvas"); c.width = this.buf.width; c.height = this.buf.height; return c; })()), ac = acc.getContext("2d");
        ac.clearRect(0, 0, acc.width, acc.height);
        const paint = (L) => {
          b.clearRect(0, 0, this.buf.width, this.buf.height); b.fillStyle = "#fff";
          for (const p of P) {
            const u = p.age / p.life, sm = e.P.sim;
            let r = Math.max(0, p.r0 + sm.grow * e.scale * p.age) * (L.rs || 1);
            if (sm.flick) r *= 0.85 + 0.3 * Math.abs(S.noise3(p.ph, t * 6, 0.5));            // flame flicker
            const fadeIn = Math.min(1, p.age / 0.15), fadeOut = L.fadeTop ? Math.max(0, 1 - u / L.fadeTop) : Math.min(1, (1 - u) / 0.45);
            const a = fadeIn * fadeOut; if (a <= 0.01 || r < 0.5) continue;
            b.globalAlpha = a; b.beginPath(); b.arc((p.x + (L.dx || 0)) * res, (p.y + (L.dy || 0)) * res, r * res * (0.6 + 0.4 * a), 0, 6.2832); b.fill();
          }
          tm.clearRect(0, 0, this.tmp.width, this.tmp.height); tm.globalCompositeOperation = "source-over";
          tm.filter = `blur(${(L.blur * res).toFixed(1)}px)` + (L.goo ? ` url(#${gooFilter(L.goo)})` : ""); tm.drawImage(this.buf, 0, 0); tm.filter = "none";
          tm.globalCompositeOperation = "source-in";
          const gr = tm.createLinearGradient(0, (y0 - 40) * res, 0, (y1 + 40) * res); gr.addColorStop(0, L.c[0]); gr.addColorStop(1, L.c[1]);
          tm.fillStyle = gr; tm.fillRect(0, 0, this.tmp.width, this.tmp.height); tm.globalCompositeOperation = "source-over";
        };
        for (const L of e.P.layers) {
          paint(L);
          if (L.role === "glow") { ctx.globalAlpha = L.op; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(this.tmp, 0, 0, this.W, this.H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; continue; }
          ac.globalAlpha = L.role === "body" ? 1 : L.op; ac.globalCompositeOperation = L.role === "body" ? "source-over" : "source-atop";
          ac.drawImage(this.tmp, 0, 0); ac.globalAlpha = 1; ac.globalCompositeOperation = "source-over";
        }
        const bodyOp = (e.P.layers.find((L) => L.role === "body") || { op: 1 }).op;
        ctx.globalAlpha = bodyOp; ctx.imageSmoothingQuality = "high"; ctx.drawImage(acc, 0, 0, this.W, this.H); ctx.globalAlpha = 1;
      }
      return { alive: st.P.length };
    }
  }
  Smoke.PRESETS = PRESETS;
  G.LPSmoke = Smoke;
})(window);
