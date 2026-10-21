/* LevlPrep studio inside the body: a blood vessel cutaway driven by the real physiology (2026-10-21,
   studio system section 6). Red cells and platelets flow with a laminar (parabolic) profile, faster in the middle
   and slow at the wall, surging on each heartbeat. External pressure flattens the vessel at a point, which cuts
   the flow (flow ~ radius^4). A tear in the wall leaks cells out while pressure is high and the tear is open;
   platelets that pass the tear stick to its edges and build a plug that closes it. Deterministic (seeded),
   integrated forward at 120 Hz and cached, so any frame can be drawn in any order.

   new LPVessel(group, opts)   opts: {x0, x1, cy, r0, wall, bpm, cells, platelets, seed,
                                      press: [[t, amount 0..1, ease]], pressX, pressW,
                                      tear: {x, w, start}, plugNeeded, colors}
   vessel.draw(t)                                                                                  */
(function (G) {
  const NS = "http://www.w3.org/2000/svg";
  const track = G.LPTrack;
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function beat(t, bpm) { const ph = (t * bpm / 60) % 1; return ph < 0.15 ? Math.sin(ph / 0.15 * Math.PI / 2) ** 2 : ph < 0.5 ? 0.5 + 0.5 * Math.cos((ph - 0.15) / 0.35 * Math.PI) : 0; }
  const DEF = { x0: 0, x1: 1920, cy: 540, r0: 120, wall: 34, bpm: 90, cells: 170, platelets: 26, seed: 3, pressX: 960, pressW: 150,
    press: [[0, 0]], tear: null, plugNeeded: 18, speed: 260,
    colors: { wallOut: "#b8475a", wallIn: "#d9707d", endo: "#f2a3a4", plasma: "#f6d2b0", plasmaD: "#e9b993",
              rbc: "#d1263a", rbcD: "#9e1427", rbcL: "#f05a5f", plt: "#e9c46a", pltD: "#c89a35", tissue: "#e7a58a", leak: "#b3192d" } };

  class Vessel {
    constructor(group, opts) {
      this.g = group; this.o = Object.assign({}, DEF, opts || {}); this.o.colors = Object.assign({}, DEF.colors, (opts || {}).colors || {});
      const C = this.o.colors, mk = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); (parent || group).appendChild(e); return e; };
      this.leakG = mk("g", {});
      this.lumen = mk("path", { fill: C.plasma });
      this.flowLines = mk("g", { opacity: 0.35 });
      this.cellG = mk("g", {});
      this.plugG = mk("g", {});
      this.wallTop = mk("path", { fill: C.wallOut }); this.wallBot = mk("path", { fill: C.wallOut });
      this.endoTop = mk("path", { fill: "none", stroke: C.endo, "stroke-width": 6, "stroke-linecap": "round" });
      this.endoBot = mk("path", { fill: "none", stroke: C.endo, "stroke-width": 6, "stroke-linecap": "round" });
      const r = this.r = rng(this.o.seed);
      this.cells = []; const L = this.o.x1 - this.o.x0;
      for (let i = 0; i < this.o.cells; i++) this.cells.push({ x: this.o.x0 + r() * L, d: (r() * 2 - 1) * 0.85, ph: r() * 6.28, spin: 0.6 + r() * 2, plt: false, out: false });
      for (let i = 0; i < this.o.platelets; i++) this.cells.push({ x: this.o.x0 + r() * L, d: (r() * 2 - 1) * 0.9, ph: r() * 6.28, spin: 1 + r() * 2, plt: true, out: false });
      this.els = this.cells.map((c) => {
        const g = mk("g", {}, this.cellG);
        if (c.plt) { mk("path", { fill: C.plt }, g); }
        else { mk("ellipse", { fill: C.rbc }, g); mk("ellipse", { fill: C.rbcD, opacity: 0.55 }, g); mk("ellipse", { fill: C.rbcL, opacity: 0.6 }, g); }
        return g;
      });
      this.cache = null;
    }
    // pressure comes from the skin side: the top wall is pushed down toward the bone, the bottom stays put
    edges(x, t) { const o = this.o; const p = (track(o.press, t, 1) || [0])[0]; const u = (x - o.pressX) / o.pressW;
      const top = o.cy - o.r0 + 2 * o.r0 * 0.88 * p * Math.exp(-u * u), bot = o.cy + o.r0; return [top, bot]; }
    R(x, t) { const [a, b] = this.edges(x, t); return (b - a) / 2; }
    mid(x, t) { const [a, b] = this.edges(x, t); return (a + b) / 2; }
    opening(st) { const o = this.o; if (!o.tear) return 0; return Math.max(0, 1 - st.plug.length / o.plugNeeded); }
    reset() { this.cache = { t: 0, cells: this.cells.map((c) => Object.assign({}, c)), plug: [], leak: [], rr: rng(this.o.seed + 101) }; }
    step(st, t, dt) {
      const o = this.o; const pulse = 0.35 + 0.65 * beat(t, o.bpm);
      const p = (track(o.press, t, 1) || [0])[0];
      const rmin = o.r0 * (1 - 0.88 * p);
      const Q = pulse * Math.min(1, Math.pow(rmin / o.r0, 4) * 1.0 + 0.0);       // Poiseuille: flow ~ r^4
      const open = this.opening(st), tear = o.tear && t >= (o.tear.start || 0);
      for (const c of st.cells) {
        if (c.out) {                                   // leaked cells drift out into the tissue and settle
          c.vy *= 0.992; c.vx *= 0.99; c.lx += c.vx * dt; c.ly += c.vy * dt; c.ph += c.spin * dt * 0.3; continue;
        }
        if (c.stuck) continue;
        const R = this.R(c.x, t);
        const v = o.speed * Q * (o.r0 * o.r0) / (R * R);                           // continuity: faster through the narrowing
        const u = v * 1.5 * (1 - c.d * c.d);                                       // laminar profile
        c.x += u * dt; c.ph += c.spin * dt * (0.4 + u / o.speed);
        c.d += (st.rr() - 0.5) * 0.02;
        const lim = c.plt ? 0.92 : 0.84; if (c.d > lim) c.d = lim; if (c.d < -lim) c.d = -lim;
        if (c.x > o.x1 + 20) { c.x = o.x0 - 20; c.d = (st.rr() * 2 - 1) * 0.85; }
        if (tear && Math.abs(c.x - o.tear.x) < o.tear.w * 0.6 && c.d < (c.plt ? -0.35 : -0.55)) {
          if (c.plt && open > 0 && st.plug.length < o.plugNeeded) {               // platelets stick at the tear edges
            c.stuck = true; st.plug.push(c);
            const k = st.plug.length, side = k % 2 ? -1 : 1, fill = Math.ceil(k / 2) / Math.ceil(o.plugNeeded / 2);
            c.px = o.tear.x + side * o.tear.w * 0.5 * (1 - fill); c.py = this.edges(o.tear.x, t)[0] - o.wall * (0.2 + 0.6 * ((k * 0.37) % 1));
          } else if (!c.plt && open > 0.05 && st.rr() < 2.2 * open * pulse * Q * dt * 60) {   // pressure pushes cells out
            c.out = true; c.lx = c.x; c.ly = this.edges(c.x, t)[0] - o.wall * 0.5;
            c.vx = (st.rr() - 0.5) * 120; c.vy = -(160 + st.rr() * 220) * pulse;
          }
        }
      }
    }
    state(t) {
      const dt = 1 / 120;
      if (!this.cache || t < this.cache.t - 1e-9) this.reset();
      while (this.cache.t + dt <= t) { this.cache.t += dt; this.step(this.cache, this.cache.t, dt); }
      return this.cache;
    }
    draw(t) {
      const o = this.o, C = o.colors, st = this.state(t);
      const N = 48, xs = []; for (let i = 0; i <= N; i++) xs.push(o.x0 + (o.x1 - o.x0) * i / N);
      const open = this.opening(st), tear = o.tear && t >= (o.tear.start || 0);
      const top = xs.map((x) => [x, this.edges(x, t)[0]]), bot = xs.map((x) => [x, this.edges(x, t)[1]]);
      const pl = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
      this.lumen.setAttribute("d", pl(top) + pl(bot.slice().reverse()).replace("M", "L") + "Z");
      // walls (top wall has the tear gap while open)
      const wallPath = (edge, dir, gap) => {
        let segs = [[]];
        edge.forEach((p) => { if (gap && Math.abs(p[0] - o.tear.x) < gap) { if (segs[segs.length - 1].length) segs.push([]); } else segs[segs.length - 1].push(p); });
        return segs.filter((s) => s.length > 1).map((s) => pl(s) + pl(s.slice().reverse().map((p) => [p[0], p[1] + dir * o.wall])).replace("M", "L") + "Z").join("");
      };
      const gap = tear ? o.tear.w * 0.5 * Math.max(0.12, open) : 0;
      this.wallTop.setAttribute("d", wallPath(top, -1, gap));
      this.wallBot.setAttribute("d", wallPath(bot, 1, 0));
      const endo = (edge, g) => { let s = ""; let pen = false; edge.forEach((p) => { if (g && Math.abs(p[0] - o.tear.x) < g) { pen = false; return; } s += (pen ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); pen = true; }); return s; };
      this.endoTop.setAttribute("d", endo(top, gap)); this.endoBot.setAttribute("d", endo(bot, 0));
      // cells
      st.cells.forEach((c, i) => {
        const el = this.els[i];
        let x, y, s = c.plt ? 7 : 17, rot;
        if (c.out) { x = c.lx; y = c.ly; rot = c.ph * 40; }
        else if (c.stuck) { x = c.px; y = c.py; rot = 0; }
        else { const R = this.R(c.x, t); x = c.x; y = this.mid(c.x, t) + c.d * Math.max(0, R - s * 0.9); rot = Math.sin(c.ph) * 35; }
        if (x < o.x0 - 40 || x > o.x1 + 40) { el.setAttribute("opacity", 0); return; } else el.setAttribute("opacity", 1);
        const tumble = 0.32 + 0.68 * Math.abs(Math.cos(c.ph));
        el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`);
        if (c.plt) {
          const act = c.stuck ? 1 : 0;   // activated platelets grow spiky arms
          let d = ""; const n = 7;
          for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * 6.283; const rr = k % 2 ? s * (0.8 + act * 0.1) : s * (1 + act * 0.9);
            d += (k ? "L" : "M") + (Math.cos(a) * rr).toFixed(1) + " " + (Math.sin(a) * rr * (act ? 1 : 0.6)).toFixed(1); }
          el.firstChild.setAttribute("d", d + "Z"); el.firstChild.setAttribute("fill", act ? C.pltD : C.plt);
        } else {
          const [e0, e1, e2] = el.childNodes;
          e0.setAttribute("rx", (s * tumble).toFixed(1)); e0.setAttribute("ry", s);
          e1.setAttribute("rx", (s * tumble * 0.45).toFixed(1)); e1.setAttribute("ry", (s * 0.45).toFixed(1));
          e2.setAttribute("rx", (s * tumble * 0.25).toFixed(1)); e2.setAttribute("ry", (s * 0.3).toFixed(1)); e2.setAttribute("cx", (-s * tumble * 0.35).toFixed(1)); e2.setAttribute("cy", (-s * 0.45).toFixed(1));
        }
      });
      return { open, plug: st.plug.length, leaked: st.cells.filter((c) => c.out).length };
    }
  }
  G.LPVessel = Vessel;
})(window);
