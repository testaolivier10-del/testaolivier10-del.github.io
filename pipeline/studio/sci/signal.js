/* LevlPrep sci kit: nerve impulse and synapse (2026-10-21). Needs common.js.

   MODEL: Hodgkin-Huxley 1952 squid giant axon (rest -65 mV; gNa 120, gK 36, gL 0.3 mS/cm^2; ENa +50, EK -77,
   EL -54.4 mV; Cm 1 uF/cm^2; rate functions as published at 6.3 C, scaled by 3^((T-6.3)/10)) on a 1D cable:
       Cm dV/dt = -I_ion + (a / 2Ri) d2V/dx2 + I_stim        a = 238 um, Ri = 35.4 ohm cm (D = 33.6 mm^2/ms)
   Numerics: gates by exact exponential update (Rush-Larsen), ionic current explicit, cable term implicit
   (backward Euler, tridiagonal), dt = 0.005 ms, dx = 0.2 mm, sealed ends. The spike shape, overshoot,
   undershoot and speed come out of the equations, not a drawn curve. Check: at 18.5 C this gives ~18.8 m/s,
   the speed Hodgkin and Huxley computed for this axon (21.2 m/s measured).
   Myelin: internodes have no channels and myelin cuts capacitance and leak to 1/50 (simplification: a real
   myelinated axon is thinner with much shorter nodes; here only the node/internode contrast is modeled, which is
   what makes conduction saltatory: the depolarization jumps node to node and is much faster).
   Ions: each compartment integrates its Na+ and K+ current; every `ionQ` nC/cm^2 of charge emits one drawn ion
   crossing the membrane there (Na+ in during the rising phase, K+ out during repolarization), so ions cross exactly
   where and when the model's currents flow. Real ion counts are vastly larger and concentrations barely change
   (simplification: drawn ions are tokens of charge).

   new LPAxon(svgGroup, {x, y, length (px), radius (px), lengthMM: 30, myelin: false, internodeMM: 2,
                         stimAt: 0 (display s), stimDur: 0.4 ms, msPerSec: 0.4 (sim ms per display second), seed,
                         profile: true (draw V(x) above), charges: true (+/- along membrane), ions: true})
     axon.draw(t) -> {tau (ms), V: Float64Array, vel (mm/ms, measured), front (mm)} ; axon.Vat(t, mm)
   new LPSynapse(svgGroup, {x, y, scale, release: display time of arrival, seed})
     action potential arrives -> voltage gated Ca2+ channels open, Ca2+ enters -> vesicles dock and fuse
     (exocytosis) -> neurotransmitter diffuses across the cleft (random walk) -> binds receptors (ligand gated
     channels open, Na+ enters the postsynaptic cell) -> unbinds and is cleared (reuptake). Timeline is scaled for
     viewing; the order and directions are the real ones. synapse.draw(t) -> {bound, released}                   */
(function (G) {
  const S = G.LPSci, mk = S.mk;
  const HH = { gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387, Cm: 1, D: 33.6 };
  const am = (V) => { const x = V + 40; return Math.abs(x) < 1e-6 ? 1 : 0.1 * x / (1 - Math.exp(-x / 10)); };
  const bm = (V) => 4 * Math.exp(-(V + 65) / 18);
  const ah = (V) => 0.07 * Math.exp(-(V + 65) / 20);
  const bh = (V) => 1 / (1 + Math.exp(-(V + 35) / 10));
  const an = (V) => { const x = V + 55; return Math.abs(x) < 1e-6 ? 0.1 : 0.01 * x / (1 - Math.exp(-x / 10)); };
  const bn = (V) => 0.125 * Math.exp(-(V + 65) / 80);
  const gate = (a, b, x, dt) => { const inf = a / (a + b), tau = 1 / (a + b); return inf + (x - inf) * Math.exp(-dt / tau); };

  const COL = { cyto: "#f6d6b8", cytoHot: "#ffd23f", ecf: "#1d3a6a", mem: "#f2c879", memD: "#d99a4e", head: "#f08a5d", na: "#f39c38", k: "#9b6bf2", ca: "#52d1a6",
    myelin: "#f7efdc", myelinD: "#d9c9a6", chNa: "#e0603f", chK: "#7a5bd6", plus: "#ffffff", nt: "#5fe0c8", vesicle: "#f7e3c4" };

  class Axon {
    constructor(group, opts) {
      const o = this.o = Object.assign({ x: 160, y: 540, length: 1600, radius: 46, lengthMM: 30, myelin: false, internodeMM: 2, stimAt: 0.2, stimDur: 0.3, stimAmp: 800,
        msPerSec: 0.4, seed: 3, profile: true, charges: true, ions: true, ionQ: null, dt: 0.005, dx: 0.2, tempC: 18.5 }, opts || {});
      o.colors = Object.assign({}, COL, (opts || {}).colors || {});
      S.defs(group); this.g = group; const C = o.colors;
      const N = this.N = Math.round(o.lengthMM / o.dx) + 1;
      this.phi = Math.pow(3, (o.tempC - 6.3) / 10);
      // compartment types: node (HH channels) or internode (passive, myelinated)
      this.node = new Uint8Array(N); this.cmK = new Float64Array(N).fill(1); this.glK = new Float64Array(N).fill(1);
      for (let i = 0; i < N; i++) {
        const mm = i * o.dx, ph = mm % o.internodeMM;
        this.node[i] = !o.myelin || ph < o.dx * 0.5 || o.internodeMM - ph < o.dx * 0.5 ? 1 : 0;
        if (!this.node[i]) { this.cmK[i] = 1 / 50; this.glK[i] = 1 / 50; }
      }
      const rest = -65, m0 = am(rest) / (am(rest) + bm(rest)), h0 = ah(rest) / (ah(rest) + bh(rest)), n0 = an(rest) / (an(rest) + bn(rest));
      this.cache = new S.Cache(o.dt, () => ({ V: new Float64Array(N).fill(rest), m: new Float64Array(N).fill(m0), h: new Float64Array(N).fill(h0), ng: new Float64Array(N).fill(n0),
        qNa: new Float64Array(N), qK: new Float64Array(N), ev: [], cross: new Float64Array(N).fill(-1) }), (st, t, dt) => this.step(st, t, dt),
        (st) => ({ ...st, V: st.V.slice(), m: st.m.slice(), h: st.h.slice(), ng: st.ng.slice(), qNa: st.qNa.slice(), qK: st.qK.slice(), ev: st.ev.slice(), cross: st.cross.slice() }), 0.5);
      // tridiagonal scratch
      this.a = new Float64Array(N); this.b = new Float64Array(N); this.c = new Float64Array(N); this.d = new Float64Array(N);
      this.build();
    }
    stimT() { return this.o.stimAt * this.o.msPerSec; }
    step(st, t, dt) {
      const o = this.o, N = this.N, V = st.V, k = HH.D / (o.dx * o.dx);
      const t0 = this.stimT();
      for (let i = 0; i < N; i++) {
        const v = V[i];
        let I = HH.gL * this.glK[i] * (v - HH.EL);
        if (this.node[i]) {
          const ph = this.phi;                       // temperature factor on all rates (Q10 = 3, HH 1952)
          st.m[i] = gate(ph * am(v), ph * bm(v), st.m[i], dt); st.h[i] = gate(ph * ah(v), ph * bh(v), st.h[i], dt); st.ng[i] = gate(ph * an(v), ph * bn(v), st.ng[i], dt);
          const INa = HH.gNa * st.m[i] ** 3 * st.h[i] * (v - HH.ENa), IK = HH.gK * st.ng[i] ** 4 * (v - HH.EK);
          I += INa + IK;
          // charge bookkeeping for drawn ions (INa < 0 = inward Na+, IK > 0 = outward K+)
          st.qNa[i] += INa < 0 ? -INa * dt : 0; st.qK[i] += IK > 0 ? IK * dt : 0;
          const q = o.ionQ || (o.myelin ? 70 : 650);      // charge per drawn ion token (nC/cm^2)
          while (st.qNa[i] >= q) { st.qNa[i] -= q; st.ev.push([t, i, 0, st.ev.length]); }
          while (st.qK[i] >= q) { st.qK[i] -= q; st.ev.push([t, i, 1, st.ev.length]); }
        }
        const stim = t >= t0 && t < t0 + o.stimDur && i * o.dx < 1.0 ? o.stimAmp : 0;
        this.d[i] = v + dt * (stim - I) / (HH.Cm * this.cmK[i]);
      }
      // implicit cable: (1 + 2r) V_i - r V_{i-1} - r V_{i+1} = d_i, r = k dt / cm_i, sealed ends
      for (let i = 0; i < N; i++) { const r = k * dt / this.cmK[i]; this.a[i] = i > 0 ? -r : 0; this.c[i] = i < N - 1 ? -r : 0; this.b[i] = 1 + (i > 0 ? r : 0) + (i < N - 1 ? r : 0); }
      // Thomas algorithm
      const cp = this.c, dp = this.d, bb = this.b, aa = this.a;
      for (let i = 1; i < N; i++) { const w = aa[i] / bb[i - 1]; bb[i] -= w * cp[i - 1]; dp[i] -= w * dp[i - 1]; }
      V[N - 1] = dp[N - 1] / bb[N - 1]; for (let i = N - 2; i >= 0; i--) V[i] = (dp[i] - cp[i] * V[i + 1]) / bb[i];
      for (let i = 0; i < N; i++) if (st.cross[i] < 0 && V[i] > 0) st.cross[i] = t + dt;      // first time each point crossed 0 mV
    }
    tau(t) { return Math.max(0, t * this.o.msPerSec); }
    state(t) { return this.cache.at(this.tau(t)); }
    Vat(t, mm) { const st = this.state(t); const i = Math.max(0, Math.min(this.N - 1, Math.round(mm / this.o.dx))); return st.V[i]; }

    // ------------------------------------------------------------ drawing
    build() {
      const o = this.o, C = o.colors, g = this.g, r = o.radius, L = o.length, x0 = o.x, y = o.y, mt = 16;
      this.px = (mm) => x0 + mm / o.lengthMM * L;
      const rnd = S.rng(o.seed);
      // background ions in the fluid: Na+ mostly outside, K+ mostly inside (real gradients ~145/12 and 4/140 mM)
      this.bgG = mk("g", { opacity: 0.85 }, g); this.bg = [];
      const ball = (parent, col, rr) => { const e = mk("g", {}, parent); mk("circle", { r: rr, fill: S.sphere(g, col) }, e);
        mk("path", { d: `M${-rr * 0.45} 0H${rr * 0.45}M0 ${-rr * 0.45}V${rr * 0.45}`, stroke: "#fff", "stroke-width": rr * 0.24, "stroke-linecap": "round", opacity: 0.9 }, e); return e; };
      for (let i = 0; i < Math.round(L / 40); i++) { const top = rnd() < 0.5; this.bg.push({ el: ball(this.bgG, C.na, 8), x: x0 + rnd() * L, y: top ? y - r - mt - 26 - rnd() * 80 : y + r + mt + 26 + rnd() * 80, ph: rnd() * 6.28 }); }
      for (let i = 0; i < Math.round(L / 160); i++) this.bg.push({ el: ball(this.bgG, C.na, 8), x: x0 + rnd() * L, y: y + (rnd() * 2 - 1) * (r - 14), ph: rnd() * 6.28 });
      for (let i = 0; i < Math.round(L / 60); i++) this.bg.push({ el: ball(this.bgG, C.k, 8), x: x0 + rnd() * L, y: y + (rnd() * 2 - 1) * (r - 14), ph: rnd() * 6.28 });
      for (let i = 0; i < Math.round(L / 200); i++) { const top = rnd() < 0.5; this.bg.push({ el: ball(this.bgG, C.k, 8), x: x0 + rnd() * L, y: top ? y - r - mt - 30 - rnd() * 70 : y + r + mt + 30 + rnd() * 70, ph: rnd() * 6.28 }); }
      // cytoplasm with a voltage gradient (one stop per few compartments)
      const d = S.defs(g), gid = "ax" + (Axon.n = (Axon.n || 0) + 1);
      this.grad = mk("linearGradient", { id: gid, x1: x0, x2: x0 + L, y1: 0, y2: 0, gradientUnits: "userSpaceOnUse" }, d);
      this.stops = []; for (let i = 0; i <= 80; i++) this.stops.push(mk("stop", { offset: i / 80 }, this.grad));
      mk("rect", { x: x0 - 30, y: y - r, width: L + 60, height: 2 * r, rx: 0, fill: `url(#${gid})` }, g);
      this.glow = mk("rect", { x: x0 - 30, y: y - r * 0.45, width: L + 60, height: r * 0.5, fill: "#ffffff", opacity: 0.14 }, g);
      // membrane (bilayer band, heads as a dotted texture of small circles)
      for (const s of [-1, 1]) {
        const yy = y + s * (r + mt / 2);
        mk("rect", { x: x0 - 30, y: yy - mt / 2, width: L + 60, height: mt, fill: S.lin(g, C.mem, C.memD, 90) }, g);
        const hp = mk("g", {}, g); for (let x = x0 - 24; x < x0 + L + 30; x += 11) { mk("circle", { cx: x, cy: yy - mt / 2, r: 4.2, fill: C.head }, hp); mk("circle", { cx: x + 5.5, cy: yy + mt / 2, r: 4.2, fill: C.head }, hp); }
      }
      // channels: at nodes (myelin) or every ~1.5 mm (bare axon); Na and K side by side, top and bottom membranes
      this.ch = [];
      const chAt = []; if (o.myelin) for (let mm = 0; mm <= o.lengthMM + 1e-6; mm += o.internodeMM) chAt.push(mm); else for (let mm = 1.5; mm < o.lengthMM; mm += 3) chAt.push(mm);
      for (const mm of chAt) for (const s of [-1, 1]) for (const [kind, dx] of [["na", -16], ["k", 16]]) {
        const e = { mm, kind, s, x: this.px(mm) + dx * (s < 0 ? 1 : -1), y: y + s * (r + mt / 2), a: mk("rect", { rx: 7, fill: kind === "na" ? C.chNa : C.chK }, g), b: mk("rect", { rx: 7, fill: kind === "na" ? C.chNa : C.chK }, g) };
        e.i = Math.round(mm / o.dx); this.ch.push(e);
      }
      // myelin sheaths (Schwann cell wraps) over internodes
      if (o.myelin) {
        const mg = mk("g", { filter: "url(#sciRim)" }, g);
        for (let mm = 0; mm < o.lengthMM - 1e-6; mm += o.internodeMM) {
          const xa = this.px(mm) + 30, xb = this.px(mm + o.internodeMM) - 30, h = r + mt + 30;
          mk("rect", { x: xa, y: y - h, width: xb - xa, height: 2 * h, rx: 34, fill: S.lin(g, C.myelin, C.myelinD, 90) }, mg);
          for (let k = 1; k < 4; k++) mk("rect", { x: xa + 12, y: y - h + k * 7, width: xb - xa - 24, height: 2.5, rx: 1.2, fill: C.myelinD, opacity: 0.5 }, mg);
          mk("ellipse", { cx: (xa + xb) / 2, cy: y - h + 16, rx: (xb - xa) * 0.18, ry: 9, fill: "#cdb88f", opacity: 0.7 }, mg);   // Schwann cell nucleus
        }
      }
      // +/- charges along the inner and outer membrane faces
      this.chg = [];
      if (o.charges) for (let x = x0 + 20; x < x0 + L; x += 46) for (const s of [-1, 1]) for (const side of [0, 1]) {
        const yy = y + s * (side ? r + mt + 16 : r - 14);
        const e = mk("text", { x, y: yy + 8, "text-anchor": "middle", "font-family": "Inter, Arial", "font-weight": 800, "font-size": 24, fill: "#fff" }, g);
        this.chg.push({ e, mm: (x - x0) / L * o.lengthMM, inside: !side });
      }
      this.ionG = mk("g", {}, g); this.ionEls = [];
      this.ball = ball;
      if (o.profile) { this.prof = mk("path", { fill: "none", stroke: "#ffd34d", "stroke-width": 5, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
        this.prof0 = mk("path", { fill: "none", stroke: "#ffffff", "stroke-width": 2, "stroke-dasharray": "6 8", opacity: 0.35 }, g); }
    }
    vcol(v) {                                         // rest -> cool cytoplasm, peak -> hot yellow
      const u = Math.max(0, Math.min(1, (v + 70) / 110)); return S.mix(this.o.colors.cyto, this.o.colors.cytoHot, u * u * (3 - 2 * u));
    }
    draw(t) {
      const o = this.o, st = this.state(t), tau = this.tau(t), V = st.V, N = this.N, r = o.radius, y = o.y, mt = 16, C = o.colors;
      this.stops.forEach((s, k) => { const i = Math.round(k / 80 * (N - 1)); s.setAttribute("stop-color", this.vcol(V[i])); });
      for (const b of this.bg) { const dx = Math.sin(t * 0.7 + b.ph) * 6, dy = Math.cos(t * 0.9 + b.ph * 1.3) * 5; b.el.setAttribute("transform", `translate(${(b.x + dx).toFixed(1)} ${(b.y + dy).toFixed(1)})`); }
      for (const e of this.ch) {                       // open fraction from the gates at that compartment
        const i = e.i, open = e.kind === "na" ? Math.min(1, st.m[i] ** 3 * st.h[i] * 4) : Math.min(1, (st.ng[i] ** 4) * 2.2);
        const gap = 3 + 11 * open, w = 12, h = mt + 22;
        e.a.setAttribute("x", e.x - gap / 2 - w); e.b.setAttribute("x", e.x + gap / 2); for (const q of [e.a, e.b]) { q.setAttribute("y", e.y - h / 2); q.setAttribute("width", w); q.setAttribute("height", h); }
      }
      for (const c of this.chg) { const v = V[Math.round(c.mm / o.dx)] || -65, pos = c.inside ? v > 0 : v <= 0; c.e.textContent = pos ? "+" : "−"; c.e.setAttribute("fill", pos ? "#fff2c4" : "#9fd0ff"); }
      // ion crossing events alive now (life 0.5 ms of sim time, eased); Na+ goes in, K+ goes out
      const life = 0.45, live = [];
      for (let k = st.ev.length - 1; k >= 0; k--) { const e = st.ev[k]; if (tau - e[0] > life) break; live.push(e); }
      while (this.ionEls.length < live.length) this.ionEls.push({ na: this.ball(this.ionG, C.na, 9), k: this.ball(this.ionG, C.k, 9) });
      this.ionEls.forEach((el, k) => {
        const e = live[k]; if (!e) { el.na.setAttribute("opacity", 0); el.k.setAttribute("opacity", 0); return; }
        const isK = e[2] === 1, h = S.rng(e[3] * 7919 + 13), side = h() < 0.5 ? -1 : 1, jx = (h() - 0.5) * (o.myelin ? 14 : 40);
        const u = Math.max(0, Math.min(1, (tau - e[0]) / life)), ue = u * u * (3 - 2 * u);
        const yOut = y + side * (r + mt + 46), yIn = y + side * (r - 26);
        const yy = isK ? yIn + (yOut - yIn) * ue : yOut + (yIn - yOut) * ue;
        const el1 = isK ? el.k : el.na, el2 = isK ? el.na : el.k;
        el2.setAttribute("opacity", 0); el1.setAttribute("opacity", Math.min(1, Math.sin(u * Math.PI) * 2.5));
        el1.setAttribute("transform", `translate(${(this.px(e[1] * o.dx) + jx).toFixed(1)} ${yy.toFixed(1)})`);
      });
      if (this.prof) {                                 // V(x) right above the axon: rest line at -65, peak ~ +40 mV
        const base = y - r - mt - (o.myelin ? 75 : 45), sc = 0.95; let d = "";
        for (let i = 0; i < N; i += 1) d += (i ? "L" : "M") + this.px(i * o.dx).toFixed(1) + " " + (base - (V[i] + 65) * sc).toFixed(1);
        this.prof.setAttribute("d", d); this.prof0.setAttribute("d", `M${o.x} ${base}H${o.x + o.length}`);
        this.profBase = base;
      }
      // measured conduction velocity from 0 mV crossing times between 25% and 75% of the length
      const i1 = Math.round(N * 0.25), i2 = Math.round(N * 0.75), vel = st.cross[i1] > 0 && st.cross[i2] > 0 ? (i2 - i1) * o.dx / (st.cross[i2] - st.cross[i1]) : null;
      let front = 0; for (let i = 0; i < N; i++) if (st.cross[i] > 0) front = i * o.dx;
      return { tau, V, vel, front };
    }
  }

  // ---------------------------------------------------------------- synapse
  class Synapse {
    constructor(group, opts) {
      const o = this.o = Object.assign({ x: 960, y: 540, scale: 1, release: 0.5, seed: 5, vesicles: 7, ntPer: 14, dt: 1 / 120 }, opts || {});
      o.colors = Object.assign({}, COL, (opts || {}).colors || {}); const C = o.colors; S.defs(group);
      const root = this.root = mk("g", { transform: `translate(${o.x} ${o.y}) scale(${o.scale})` }, group);
      // presynaptic bouton (top), cleft at y in [0, 60], postsynaptic membrane at y = 60
      mk("path", { d: "M-420 -560 C-380 -380 -330 -260 -300 -170 C-260 -40 -150 0 0 0 C150 0 260 -40 300 -170 C330 -260 380 -380 420 -560Z", fill: S.lin(root, "#f6d6b8", "#e9b48e", 90), filter: "url(#sciRim)" }, root);
      mk("path", { d: "M-300 -170 C-260 -40 -150 0 0 0 C150 0 260 -40 300 -170", fill: "none", stroke: C.mem, "stroke-width": 14 }, root);
      mk("path", { d: "M-520 70 C-300 62 300 62 520 70 V420 H-520Z", fill: S.lin(root, "#f6d6b8", "#e2a986", 90), filter: "url(#sciRim)" }, root);
      mk("path", { d: "M-520 70 C-300 62 300 62 520 70", fill: "none", stroke: C.mem, "stroke-width": 14 }, root);
      this.caCh = [-175, 175].map((x) => ({ x, a: mk("rect", { rx: 6, fill: C.ca }, root), b: mk("rect", { rx: 6, fill: C.ca }, root) }));
      this.rec = [-150, -75, 0, 75, 150].map((x) => ({ x, a: mk("path", { fill: "#7aa8ff" }, root), b: mk("path", { fill: "#7aa8ff" }, root), site: mk("circle", { r: 8, fill: "#2a3a72" }, root) }));
      this.vesG = mk("g", {}, root); this.ntG = mk("g", {}, root); this.ionG = mk("g", {}, root);
      const r = S.rng(o.seed);
      this.ves = []; for (let i = 0; i < o.vesicles; i++) { const x = (i - (o.vesicles - 1) / 2) * 62 + (r() - 0.5) * 16, y0 = -120 - r() * 160;
        const g = mk("g", {}, this.vesG); const body = mk("circle", { r: 26, fill: S.sphere(root, C.vesicle, { flat: 0.2 }) }, g); const dots = [];
        for (let k = 0; k < 5; k++) dots.push(mk("circle", { r: 4.5, fill: C.nt, cx: (r() - 0.5) * 24, cy: (r() - 0.5) * 24 }, g));
        this.ves.push({ x, y0, g, body, dots, delay: 0.15 + (i % 3) * 0.08 + r() * 0.12, fuses: i % 3 !== 2 }); }
      this.nt = []; this.ntEl = [];
      this.ca = []; for (let i = 0; i < 10; i++) this.ca.push({ el: this.ballIon(C.ca, root), side: i % 2 ? 1 : -1, d: r() * 0.4, jx: (r() - 0.5) * 16 });
      this.naPost = []; for (let i = 0; i < 10; i++) this.naPost.push({ el: this.ballIon(C.na, root), rec: i % 5, d: r() * 0.5 });
      this.cache = new S.Cache(o.dt, () => ({ P: [], bound: new Array(this.rec.length).fill(-1), rel: 0, fused: new Array(o.vesicles).fill(0) }), (st, t, dt) => this.step(st, t, dt), null);
    }
    memY(x) {                                        // presynaptic membrane: y on the bouton curve at x (Bezier sampled by x)
      const seg = x < 0 ? [[-300, -170], [-260, -40], [-150, 0], [0, 0]] : [[0, 0], [150, 0], [260, -40], [300, -170]];
      let lo = 0, hi = 1; const bz = (u, k) => (1 - u) ** 3 * seg[0][k] + 3 * (1 - u) ** 2 * u * seg[1][k] + 3 * (1 - u) * u * u * seg[2][k] + u ** 3 * seg[3][k];
      for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (bz(m, 0) < x) lo = m; else hi = m; } return bz((lo + hi) / 2, 1);
    }
    ballIon(col, root) { const e = mk("g", { opacity: 0 }, this.ionG || root); mk("circle", { r: 9, fill: S.sphere(root, col) }, e);
      mk("path", { d: "M-4 0H4M0 -4V4", stroke: "#fff", "stroke-width": 2.2, "stroke-linecap": "round" }, e); return e; }
    step(st, t, dt) {
      const o = this.o, tr = t - o.release, rr = S.rng(o.seed * 977 + Math.round(t / dt) * 31);
      this.ves.forEach((v, vi) => { if (v.fuses && tr >= v.delay + 0.35 && !st.fused[vi]) { st.fused[vi] = 1;   // fusion pore opens: contents spill into the cleft
        for (let k = 0; k < o.ntPer; k++) st.P.push({ x: v.x + (rr() - 0.5) * 30, y: 6, vx: (rr() - 0.5) * 200, vy: 150 + rr() * 150, bound: -1, born: t, gone: false }); st.rel++; } });
      for (const p of st.P) {
        if (p.gone) continue;
        if (p.bound >= 0) { if (t - p.tb > 0.9 + (p.x % 1 + 1) * 0.3) { st.bound[p.bound] = -1; p.bound = -1; p.vy = -80; } else continue; }   // unbind
        p.vx += (rr() - 0.5) * 12000 * dt; p.vy += (rr() - 0.5) * 12000 * dt; p.vx *= 0.92; p.vy *= 0.92;    // Brownian (Langevin) motion
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < 8) { p.y = 8; p.vy = Math.abs(p.vy); } if (p.y > 56) { p.y = 56; p.vy = -Math.abs(p.vy); }
        this.rec.forEach((rc, k) => { if (st.bound[k] < 0 && p.bound < 0 && Math.abs(p.x - rc.x) < 18 && p.y > 40) { st.bound[k] = 1; p.bound = k; p.tb = t; p.x = rc.x; p.y = 50; } });
        if (Math.abs(p.x) > 360 || t - p.born > 3.2) p.gone = true;                                      // diffuses away / reuptake
      }
      if (this.o.clearAt != null && t > this.o.clearAt) for (const p of st.P) if (p.bound < 0) p.gone = true;
    }
    draw(t) {
      const o = this.o, tr = t - o.release, C = o.colors;
      const st = this.cache.at(Math.max(0, t));
      // Ca2+ channels open when the spike arrives (tr in 0..0.5), Ca2+ flows in
      const caOpen = tr > 0 && tr < 0.6 ? Math.sin(Math.min(1, tr / 0.6) * Math.PI) : 0;
      // Ca2+ channels sit in the bouton membrane beside the active zone (on the curve, rotated to its tangent)
      for (const c of this.caCh) { const gap = 4 + 14 * caOpen, x = c.x, yy = this.memY(x), ang = Math.atan2(this.memY(x + 1) - this.memY(x - 1), 2) * 57.3;
        c.a.setAttribute("x", x - gap / 2 - 12); c.b.setAttribute("x", x + gap / 2);
        for (const q of [c.a, c.b]) { q.setAttribute("y", yy - 22); q.setAttribute("width", 12); q.setAttribute("height", 44); q.setAttribute("transform", `rotate(${ang.toFixed(1)} ${x} ${yy})`); } }
      // Ca2+ moves from the cleft side (outside) through the open channel into the bouton
      this.ca.forEach((c) => { const u = (tr - c.d) / 0.5; if (u < 0 || u > 1.6) { c.el.setAttribute("opacity", 0); return; }
        const ch = this.caCh[c.side > 0 ? 1 : 0], ue = Math.min(1, u), yy = this.memY(ch.x), sx = ch.x * 1.15 + c.jx, sy = yy + 50, ex = ch.x * 0.75 + c.jx, ey = yy - 90;
        c.el.setAttribute("opacity", u > 1.2 ? Math.max(0, 1 - (u - 1.2) / 0.4) : Math.min(1, u * 4)); c.el.setAttribute("transform", `translate(${(sx + (ex - sx) * ue).toFixed(1)} ${(sy + (ey - sy) * ue).toFixed(1)})`); });
      // vesicles: move to the active zone (docking), then fuse: the sphere merges into the membrane and opens
      for (const v of this.ves) {
        const u = (tr - v.delay) / 0.35, dock = Math.max(0, Math.min(1, u)), ue = dock * dock * (3 - 2 * dock);
        let y = v.y0 + (-30 - v.y0) * (v.fuses ? ue : ue * 0.4), sc = 1, sy = 1, op = 1;
        if (v.fuses && u > 1) { const f = Math.min(1, (u - 1) / 0.8); y = -30 + 22 * f; sy = 1 - 0.85 * f; sc = 1 + 0.5 * f; op = 1 - f; }
        v.g.setAttribute("transform", `translate(${v.x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)} ${sy.toFixed(3)})`); v.g.setAttribute("opacity", op.toFixed(3));
      }
      // neurotransmitter molecules
      const P = st.P; while (this.ntEl.length < P.length) this.ntEl.push(mk("circle", { r: 7, fill: S.sphere(this.root, C.nt) }, this.ntG));
      this.ntEl.forEach((e, k) => { const p = P[k]; if (!p || p.gone) { e.setAttribute("opacity", 0); return; } e.setAttribute("opacity", 1); e.setAttribute("cx", p.x.toFixed(1)); e.setAttribute("cy", p.y.toFixed(1)); });
      // receptors: ligand gated channels, open while bound
      let nb = 0;
      this.rec.forEach((rc, k) => { const open = st.bound[k] > 0 ? 1 : 0; nb += open; const gap = 4 + 12 * open, x = rc.x, y0 = 62;
        rc.a.setAttribute("d", `M${x - gap / 2 - 16} ${y0 - 14}h16v46h-16z`); rc.b.setAttribute("d", `M${x + gap / 2} ${y0 - 14}h16v46h-16z`);
        rc.a.setAttribute("fill", open ? "#9cc3ff" : "#6f8fd6"); rc.b.setAttribute("fill", open ? "#9cc3ff" : "#6f8fd6"); rc.site.setAttribute("cx", x); rc.site.setAttribute("cy", y0 - 18); });
      // Na+ enters the postsynaptic cell through open receptors
      this.naPost.forEach((n) => { const k = n.rec, open = st.bound[k] > 0; if (!open) { n.el.setAttribute("opacity", 0); return; }
        const u = ((t * 1.3 + n.d) % 1); n.el.setAttribute("opacity", Math.sin(u * Math.PI)); n.el.setAttribute("transform", `translate(${this.rec[k].x} ${(20 + 160 * u).toFixed(1)})`); });
      return { bound: nb, released: st.rel };
    }
  }

  G.LPAxon = Axon; G.LPSynapse = Synapse; G.LPHH = HH;
})(window);
