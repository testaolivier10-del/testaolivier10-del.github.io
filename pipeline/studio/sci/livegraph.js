/* LevlPrep sci kit: graphs that draw themselves from live values (2026-10-21). Needs common.js.

   new LPGraph(svgGroup, {x, y, w, h, xr: [x0, x1], yr: [y0, y1], xTicks, yTicks, xLabel, yLabel, title,
                          fmtX, fmtY, grid: true, axisColor, in: [t, dur] (axes draw on), dark: true})
     graph.curve({fn, color, width, from, to, step, dot, label, fill})     a series y = fn(x) or y = fn(t)
         live time series: fn(t) is sampled at `step` while t advances (memoized, so a simulation is only ever asked
           for increasing times), the line grows to the current time and a dot rides its tip with label(v)
         static function: {fn, sweep: (t) => xMax}: the curve is drawn up to sweep(t) (pass x => const for a full curve)
         fill: {a, b: (t) => x, color, rects: n, rule: "left" | "mid" | "right"}: area under the curve from a to b(t),
           as a smooth fill or as n Riemann rectangles; graph.area(series, a, b) integrates numerically (Simpson)
     graph.bars({edges: [x0..xn], counts: (t) => [..], color})              histogram that rises as counts grow
     graph.draw(t); graph.px(x, y) -> screen point
   new LPGalton(svgGroup, {x, y, rows: 12, spacing: 54, balls: 300, interval: 0.018, start: 0.3, hop: 0.085,
                           r: 7, seed, curve: true, perRow: 3})
     Each ball's path is fixed by seeded fair coin flips at every peg (exactly binomial(rows, 1/2)); it hops peg to
     peg on short parabolic arcs (gravity like, with a small bounce), drops into its bin and lands on top of the balls
     that arrived before it. The bell curve drawn over the bins is the normal approximation N(n/2, n/4) scaled to the
     number of balls released so far. galton.draw(t) -> {counts, landed}
   Simplification (Galton): balls don't collide with each other; real boards are only approximately binomial. */
(function (G) {
  const S = G.LPSci, mk = S.mk;
  const FONT = "Inter, Arial";

  class Graph {
    constructor(group, opts) {
      const o = this.o = Object.assign({ x: 200, y: 200, w: 900, h: 500, xr: [0, 10], yr: [0, 10], xTicks: 1, yTicks: 1, xLabel: "", yLabel: "", title: "",
        fmtX: (v) => +v.toFixed(2) + "", fmtY: (v) => +v.toFixed(2) + "", grid: true, axisColor: "#e6ebf7", gridColor: "#9fb0e0", in: null }, opts || {});
      S.defs(group); this.g = group; this.series = [];
      const g = this.root = mk("g", {}, group);
      this.gridG = mk("g", { opacity: 0.16 }, g); this.fillG = mk("g", {}, g); this.barG = mk("g", {}, g); this.lineG = mk("g", {}, g); this.axG = mk("g", {}, g); this.dotG = mk("g", {}, g);
      const X0 = o.x, Y0 = o.y + o.h;
      // axes as filled shapes with arrow heads; ticks as small bars; labels in Inter
      this.xAxis = mk("path", { fill: o.axisColor }, this.axG); this.yAxis = mk("path", { fill: o.axisColor }, this.axG);
      this.ticks = [];
      const tk = (v, isX) => { const el = mk("rect", { fill: o.axisColor, rx: 1.5 }, this.axG);
        const tx = mk("text", { "font-family": FONT, "font-weight": 700, "font-size": 22, fill: o.axisColor, "text-anchor": isX ? "middle" : "end" }, this.axG);
        tx.textContent = isX ? o.fmtX(v) : o.fmtY(v); this.ticks.push({ v, isX, el, tx }); };
      for (let v = Math.ceil(o.xr[0] / o.xTicks) * o.xTicks; v <= o.xr[1] + 1e-9; v += o.xTicks) tk(+v.toFixed(10), true);
      for (let v = Math.ceil(o.yr[0] / o.yTicks) * o.yTicks; v <= o.yr[1] + 1e-9; v += o.yTicks) tk(+v.toFixed(10), false);
      if (o.grid) { for (const t of this.ticks) { const [px, py] = this.px(t.isX ? t.v : o.xr[0], t.isX ? o.yr[0] : t.v);
        mk("rect", t.isX ? { x: px - 1, y: o.y, width: 2, height: o.h, fill: o.gridColor } : { x: o.x, y: py - 1, width: o.w, height: 2, fill: o.gridColor }, this.gridG); } }
      this.xl = mk("text", { x: X0 + o.w, y: Y0 + 66, "text-anchor": "end", "font-family": FONT, "font-weight": 800, "font-size": 26, fill: o.axisColor }, this.axG); this.xl.textContent = o.xLabel;
      this.yl = mk("text", { x: X0 - 10, y: o.y - 26, "text-anchor": "start", "font-family": FONT, "font-weight": 800, "font-size": 26, fill: o.axisColor }, this.axG); this.yl.textContent = o.yLabel;
      if (o.title) { const tt = mk("text", { x: X0 + o.w / 2, y: o.y - 60, "text-anchor": "middle", "font-family": FONT, "font-weight": 800, "font-size": 32, fill: "#fff" }, this.axG); tt.textContent = o.title; }
    }
    px(x, y) { const o = this.o; return [o.x + (x - o.xr[0]) / (o.xr[1] - o.xr[0]) * o.w, o.y + o.h - (y - o.yr[0]) / (o.yr[1] - o.yr[0]) * o.h]; }
    curve(s) {
      s = Object.assign({ color: "#ffd34d", width: 6, step: 1 / 60, dot: true, from: 0, mode: s.sweep ? "static" : "live" }, s);
      s.path = mk("path", { fill: "none", stroke: s.color, "stroke-width": s.width, "stroke-linecap": "round", "stroke-linejoin": "round" }, this.lineG);
      if (s.fill) { s.fill = Object.assign({ color: s.color, op: 0.35, rule: "mid" }, s.fill); s.fillEl = mk("path", { fill: s.fill.color, opacity: s.fill.op }, this.fillG); }
      if (s.dot) { s.dotEl = mk("g", {}, this.dotG); mk("circle", { r: 15, fill: s.color, opacity: 0.25 }, s.dotEl); mk("circle", { r: 9, fill: S.sphere(this.g, s.color) }, s.dotEl);
        s.lab = S.label(this.dotG, { size: 22, bg: "#141c38" }); }
      s.memo = []; this.series.push(s); return s;
    }
    bars(b) { b = Object.assign({ color: "#4f94e8" }, b); b.els = []; for (let i = 0; i < b.edges.length - 1; i++) b.els.push(mk("rect", { rx: 6, fill: S.lin(this.g, S.lighten(b.color, 0.25), b.color, 90) }, this.barG)); this.series.push(Object.assign(b, { mode: "bars" })); return b; }
    sample(s, k) { if (s.memo[k] === undefined) s.memo[k] = s.fn(s.from + k * s.step); return s.memo[k]; }   // live samples, memoized (forward only calls)
    area(s, a, b, n) { n = n || 200; const h = (b - a) / n, f = s.fn; let sum = f(a) + f(b); for (let i = 1; i < n; i++) sum += f(a + i * h) * (i % 2 ? 4 : 2); return sum * h / 3; }
    draw(t) {
      const o = this.o, f = (v) => v.toFixed(1);
      // axes draw on (optional)
      const u = o.in ? Math.max(0, Math.min(1, (t - o.in[0]) / o.in[1])) : 1, ue = u * u * (3 - 2 * u);
      const [ox, oy] = this.px(o.xr[0], Math.max(o.yr[0], Math.min(o.yr[1], 0)));
      this.xAxis.setAttribute("d", S.arrow(o.x - 4, oy, o.x + (o.w + 30) * ue, oy, 4, 2.4)); this.yAxis.setAttribute("d", S.arrow(o.x, o.y + o.h + 4, o.x, o.y + o.h - (o.h + 30) * ue, 4, 2.4));
      for (const tk of this.ticks) { const [px, py] = this.px(tk.isX ? tk.v : o.xr[0], tk.isX ? o.yr[0] : tk.v), vis = tk.isX ? (px - o.x) / o.w <= ue : (o.y + o.h - py) / o.h <= ue;
        tk.el.setAttribute("opacity", vis ? 1 : 0); tk.tx.setAttribute("opacity", vis ? 1 : 0);
        if (tk.isX) { tk.el.setAttribute("x", px - 1.5); tk.el.setAttribute("y", oy - 8); tk.el.setAttribute("width", 3); tk.el.setAttribute("height", 16); tk.tx.setAttribute("x", px); tk.tx.setAttribute("y", Math.max(oy, o.y + o.h) + 36); }
        else { tk.el.setAttribute("x", o.x - 8); tk.el.setAttribute("y", py - 1.5); tk.el.setAttribute("width", 16); tk.el.setAttribute("height", 3); tk.tx.setAttribute("x", o.x - 16); tk.tx.setAttribute("y", py + 8); } }
      this.gridG.setAttribute("opacity", 0.16 * ue); this.xl.setAttribute("opacity", ue); this.yl.setAttribute("opacity", ue);
      for (const s of this.series) {
        if (s.mode === "bars") { const c = s.counts(t); s.els.forEach((e, i) => { const [x0] = this.px(s.edges[i], 0), [x1, y1] = this.px(s.edges[i + 1], c[i] || 0), [, y0] = this.px(0, o.yr[0]);
          e.setAttribute("x", x0 + 2); e.setAttribute("width", Math.max(0, x1 - x0 - 4)); e.setAttribute("y", Math.min(y0, y1)); e.setAttribute("height", Math.abs(y0 - y1)); }); continue; }
        let pts = [], tip = null;
        if (s.mode === "live") {
          const kmax = Math.floor((Math.min(t, s.to == null ? 1e9 : s.to) - s.from) / s.step + 1e-9);
          for (let k = 0; k <= kmax; k++) { const v = this.sample(s, k); pts.push(this.px(s.from + k * s.step, v)); }
          if (kmax >= 0) tip = [s.from + kmax * s.step, this.sample(s, kmax)];
        } else {
          const xm = Math.min(o.xr[1], s.sweep(t)), n = 160;
          for (let k = 0; k <= n; k++) { const x = o.xr[0] + (xm - o.xr[0]) * k / n; pts.push(this.px(x, s.fn(x))); }
          tip = xm > o.xr[0] ? [xm, s.fn(xm)] : null;
          if (s.fill) {                              // area under the curve from a to b(t)
            const a = s.fill.a, b = Math.max(a, Math.min(typeof s.fill.b === "function" ? s.fill.b(t) : s.fill.b, o.xr[1])), [, y0] = this.px(0, 0);
            let d = "";
            if (b > a) {
              if (s.fill.rects) { const n2 = s.fill.rects, w = (typeof s.fill.to === "number" ? s.fill.to - a : b - a) / n2;
                for (let i = 0; i < n2; i++) { const xa = a + i * w; if (xa >= b - 1e-9) break; const xb = Math.min(b, xa + w), xs = s.fill.rule === "left" ? xa : s.fill.rule === "right" ? xa + w : xa + w / 2;
                  const [X0] = this.px(xa, 0), [X1, Y1] = this.px(xb, s.fn(xs)); d += `M${f(X0 + 1.5)} ${f(y0)}V${f(Y1)}H${f(X1 - 1.5)}V${f(y0)}Z`; } }
              else { const m = 100; d = `M${f(this.px(a, 0)[0])} ${f(y0)}`; for (let k = 0; k <= m; k++) { const x = a + (b - a) * k / m, [X, Y] = this.px(x, s.fn(x)); d += `L${f(X)} ${f(Y)}`; } d += `L${f(this.px(b, 0)[0])} ${f(y0)}Z`; }
            }
            s.fillEl.setAttribute("d", d); s.areaNow = b > a ? this.area(s, a, b) : 0;
          }
        }
        s.path.setAttribute("d", pts.length > 1 ? S.smooth(pts, false, 0.35) : "");
        if (s.dot) { if (tip) { const [X, Y] = this.px(tip[0], tip[1]); s.dotEl.setAttribute("transform", `translate(${f(X)} ${f(Y)})`); s.dotEl.setAttribute("opacity", 1);
            if (s.label) s.lab.set(s.label(tip[1], tip[0], s), X + 20 + 70, Y - 40, 1); } else { s.dotEl.setAttribute("opacity", 0); if (s.label) s.lab.set("", 0, 0, 0); } }
      }
    }
  }

  // ---------------------------------------------------------------- Galton board
  class Galton {
    constructor(group, opts) {
      const o = this.o = Object.assign({ x: 960, y: 120, rows: 12, spacing: 54, rowH: 40, balls: 300, interval: 0.018, start: 0.3, hop: 0.085, r: 7, seed: 21, curve: true, perRow: 3,
        ball: "#ffb84d", peg: "#c8d3f0", binH: 380 }, opts || {});
      S.defs(group); this.g = group; const g = this.root = mk("g", {}, group), n = o.rows, sp = o.spacing;
      this.binTop = o.y + (n + 0.6) * o.rowH; this.floor = this.binTop + o.binH;
      // backboard, funnel, pegs, bins
      const bwid = (n + 2) * sp; mk("path", { d: `M${o.x} ${o.y - 60}L${o.x + bwid / 2} ${o.y + (n - 0.2) * o.rowH}V${o.y + (n + 0.6) * o.rowH + o.binH + 20}H${o.x - bwid / 2}V${o.y + (n - 0.2) * o.rowH}Z`, fill: "#1a2656", opacity: 0.7 }, g);
      mk("path", { d: `M${o.x - 150} ${o.y - 110}L${o.x - 22} ${o.y - 34}V${o.y - 14}H${o.x - 30}V${o.y - 28}L${o.x - 170} ${o.y - 110}Z M${o.x + 150} ${o.y - 110}L${o.x + 22} ${o.y - 34}V${o.y - 14}H${o.x + 30}V${o.y - 28}L${o.x + 170} ${o.y - 110}Z`, fill: S.lin(g, "#9fb3d6", "#5d6f99", 90), filter: "url(#sciRimOnly)" }, g);
      const pg = mk("g", { filter: "url(#sciRimOnly)" }, g);
      for (let k = 0; k < n; k++) for (let j = 0; j <= k; j++) mk("circle", { cx: this.pegX(k, j), cy: o.y + k * o.rowH, r: 6.5, fill: S.sphere(g, o.peg) }, pg);
      const bw = sp, nb = n + 1, x0 = o.x - nb * bw / 2;
      this.binX0 = x0; this.bw = bw;
      for (let i = 0; i <= nb; i++) mk("rect", { x: x0 + i * bw - 3, y: this.binTop, width: 6, height: o.binH, rx: 3, fill: S.lin(g, "#c8d3f0", "#7b8bb8", 90) }, g);
      mk("rect", { x: x0 - 10, y: this.floor, width: nb * bw + 20, height: 12, rx: 6, fill: "#7b8bb8" }, g);
      this.ballG = mk("g", {}, g); this.els = []; this.paths = []; this.curveEl = mk("path", { fill: "none", stroke: "#fff1d6", "stroke-width": 5, "stroke-linecap": "round", opacity: 0.9 }, g);
      const r = S.rng(o.seed); this.bins = []; const binCount = new Array(nb).fill(0);
      for (let i = 0; i < o.balls; i++) { const steps = []; let j = 0; for (let k = 0; k < n; k++) { const right = r() < 0.5 ? 1 : 0; steps.push(right); j += right; }
        this.paths.push({ steps, bin: j, slot: binCount[j]++, jit: (r() - 0.5) * 0.6 }); }
      this.ballFill = S.sphere(g, o.ball);
    }
    pegX(k, j) { return this.o.x + (j - k / 2) * this.o.spacing; }
    pos(i, t) {                                       // position of ball i at time t (pure function)
      const o = this.o, P = this.paths[i], t0 = o.start + i * o.interval, n = o.rows;
      let u = t - t0; if (u < 0) return null;
      // drop from the funnel to the first peg
      const d0 = 0.16; if (u < d0) { const a = u / d0; return [o.x, o.y - 30 + (o.rowH - 8 + 22) * a * a - o.rowH + 8, 0]; }
      u -= d0; const k = Math.floor(u / o.hop);
      if (k < n) {                                    // hop from above peg (k, j) to above peg (k+1, j or j+1): small bounce up, then fall
        let j = 0; for (let q = 0; q < k; q++) j += P.steps[q];
        const a = (u - k * o.hop) / o.hop, dir = P.steps[k] ? 1 : -1;
        const xA = this.pegX(k, j), x = xA + dir * o.spacing / 2 * a, yA = o.y + k * o.rowH - o.r - 6.5;
        const y = yA - 16 * Math.sin(Math.PI * Math.min(1, a * 1.6)) * (1 - a) + o.rowH * a * a;
        return [x, y, 0];
      }
      // fall into the bin and stack (balls fill the bin perRow across)
      const bx = this.binX0 + P.bin * this.bw + this.bw / 2, col = P.slot % o.perRow, row = Math.floor(P.slot / o.perRow);
      const tx = bx + (col - (o.perRow - 1) / 2) * (o.r * 2.05) + (row % 2 ? o.r * 0.5 : 0) * 0, ty = this.floor - o.r - row * o.r * 1.85;
      const fx = this.pegX(n - 1, P.steps.slice(0, n - 1).reduce((a, b) => a + b, 0)) + (P.steps[n - 1] ? 1 : -1) * o.spacing / 2, fy = o.y + n * o.rowH - o.r - 6.5;
      const v = u - n * o.hop, fallT = Math.sqrt(Math.max(1, ty - fy) / 2600);       // free fall at g ~ 2600 px/s^2 (scaled)
      if (v < fallT) { const a = v / fallT; return [fx + (tx - fx) * Math.min(1, a * 1.4), fy + (ty - fy) * a * a, 0]; }
      return [tx, ty, 1];
    }
    draw(t) {
      const o = this.o, nb = o.rows + 1, counts = new Array(nb).fill(0); let landed = 0, released = 0;
      for (let i = 0; i < o.balls; i++) {
        const p = this.pos(i, t); let el = this.els[i];
        if (!p) { if (el) el.setAttribute("opacity", 0); continue; }
        released++;
        if (!el) el = this.els[i] = mk("circle", { r: o.r, fill: this.ballFill }, this.ballG);
        el.setAttribute("opacity", 1); el.setAttribute("cx", p[0].toFixed(1)); el.setAttribute("cy", p[1].toFixed(1));
        if (p[2]) { counts[this.paths[i].bin]++; landed++; }
      }
      // normal approximation of binomial(n, 1/2), scaled to the balls that have landed: expected stack height per bin
      if (o.curve && landed > 0) {
        const n = o.rows, mu = n / 2, sd = Math.sqrt(n) / 2, pts = [];
        for (let x = -0.5; x <= n + 0.5; x += 0.1) { const pdf = Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)), cnt = landed * pdf;
          pts.push([this.binX0 + (x + 0.5) * this.bw, this.floor - (cnt / o.perRow) * o.r * 1.85]); }
        this.curveEl.setAttribute("d", S.smooth(pts, false)); this.curveEl.setAttribute("opacity", Math.min(0.9, landed / 40));
      }
      return { counts, landed, released };
    }
  }

  G.LPGraph = Graph; G.LPGalton = Galton;
})(window);
