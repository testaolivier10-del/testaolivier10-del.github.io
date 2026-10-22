/* LevlPrep sci kit: kinetic particle systems (2026-10-21).
   Gas in a container (temperature sets the speed distribution), diffusion across a membrane with channels,
   osmosis of water, and collision reactions A + B -> C with an activation energy. Needs common.js.

   new LPParticles(svgGroup, opts)   opts:
     box: {x, y, w, h}                    container interior in px
     species: {name: {shape, r, m, color, color2, lipid}}
         shape: "diatomic" (N2, O2), "water" (H2O), "ball" (atom / ion), "ring" (glucose, 6 ring), "pair" (A-B product)
         r: collision radius px, m: mass in amu (speeds scale with sqrt(T/m) like a real gas)
         lipid: true = small nonpolar molecule that crosses the bilayer anywhere (O2, CO2)
     fill: [{s: name, n, region: [x, y, w, h]}]   initial particles (positions random, no overlaps)
     T: kelvin, number or keyframes [[t, T, ease]]; thermostat: tau seconds (0 = isolated, energy conserved)
     vScale: px/s for the 1 sigma speed of a 28 amu molecule at 300 K (real N2 is ~300 m/s; scaled to be watchable)
     membrane: {x, th, channels: [{y, h, pass: [names], kind}], osmosis: false, fill0: 0.75}
     reactions: [{a, b, c, Ea}]           Ea in units of k*300K. A and B merge into C when the collision energy
                                          along the line of centers (reduced mass) is at least Ea. Momentum is
                                          conserved exactly; the kinetic energy lost in the merge goes to heat
                                          (simplification: product is a single disk, no reverse reaction).
     trails: true                         short motion streaks behind fast molecules (shows speed)
     hist: {bins, vmax, tau, s}           keep a time averaged speed histogram in state (st.hist, fraction per bin)
     seed, dt (default 1/240), art: {...} override drawing functions
   p.draw(t) -> state; p.state(t); p.speeds(t, species?) ; p.temperature(t) ; p.counts(t) -> {L: {...}, R: {...}}
   p.sigma(T, m) -> 1 sigma speed (px/s) of the 2D Maxwell-Boltzmann (Rayleigh) distribution

   Physics: 2D hard disks, exact elastic collision impulses (momentum and kinetic energy conserved), specular
   walls. In 2D the equilibrium speed distribution is Rayleigh f(v) = v/s^2 exp(-v^2 / 2 s^2), s = sqrt(kT/m);
   initial speeds are drawn from it and collisions keep it. The thermostat (Berendsen, only if tau > 0) rescales
   all velocities gently toward the target T so heating and cooling can be shown; collisions keep the shape.
   Simplifications: molecules collide as disks (diatomics are drawn as two atoms but collide as one circle);
   rotation is free spinning at the equipartition rate and not exchanged in collisions; osmosis treats the
   liquid as incompressible (each side's level follows its particle count) and ignores hydrostatic back
   pressure, so it runs until water concentration is equal on both sides. */
(function (G) {
  const S = G.LPSci, mk = S.mk;
  const KB = 1;                                     // energy unit: k*300 K == m_ref * vScale^2 with m_ref = 28
  const DEF = { box: { x: 200, y: 200, w: 800, h: 600 }, species: {}, fill: [], T: 300, thermostat: 0, vScale: 150, seed: 7, dt: 1 / 240,
    membrane: null, reactions: [], trails: true, bg: "#16204a", fluid: null };

  // ---------------------------------------------------------------- art (swap these for painted textures later)
  const ART = {
    // build the element(s) for one particle of species sp; returns a <g>. Drawn around (0,0), pointing along +x.
    make(g, sp, root) {
      const r = sp.r, el = mk("g", {}, g);
      const ball = (cx, cy, rr, col) => mk("circle", { cx, cy, r: rr, fill: S.sphere(root, col) }, el);
      if (sp.shape === "diatomic") { ball(-r * 0.42, 0, r * 0.72, sp.color); ball(r * 0.42, 0, r * 0.72, sp.color); }
      else if (sp.shape === "water") {                // O with two H at 104.5 degrees (real bond angle)
        // space filling proportions: O-H 0.96 A, O radius 1.52 A, H radius 1.2 A (scaled so the whole molecule fits r)
        const a = (104.5 / 2) * Math.PI / 180, d = r * 0.62, ox = -r * 0.28;
        ball(ox, 0, r * 0.72, sp.color || "#e8402f");
        ball(ox + Math.cos(a) * d, Math.sin(a) * d, r * 0.46, "#eef1f6"); ball(ox + Math.cos(-a) * d, Math.sin(-a) * d, r * 0.46, "#eef1f6");
      } else if (sp.shape === "ring") {               // pyranose ring (glucose): 5 C + 1 O hexagon, rounded, with OH bumps
        const pts = []; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + 0.52; pts.push([Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.62]); }
        for (let k = 0; k < 6; k++) if (k !== 1) ball(pts[k][0] * 1.16, pts[k][1] * 1.2, r * 0.26, "#e8402f");   // OH groups on the ring carbons
        mk("path", { d: S.smooth(pts, true, 0.35), fill: S.sphere(root, sp.color, { flat: 0.3 }) }, el);
        mk("path", { d: S.smooth(pts.map((p) => [p[0] * 0.42, p[1] * 0.42]), true, 0.5), fill: S.darken(sp.color, 0.3), opacity: 0.55 }, el);
        ball(pts[1][0], pts[1][1], r * 0.24, "#e8402f");          // ring oxygen
      } else if (sp.shape === "pair") { ball(-r * 0.36, 0, r * 0.7, sp.color); ball(r * 0.4, 0, r * 0.62, sp.color2 || sp.color); }
      else ball(0, 0, r, sp.color);
      return el;
    },
    container(g, o, root) {                          // glass tank: deep interior, thick rounded glass walls, warm rim
      const b = o.box, w = 22;
      const L = {};
      L.back = mk("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 18, fill: S.lin(root, S.lighten(o.bg, 0.08), S.darken(o.bg, 0.15), 90) }, g);
      L.fluid = mk("g", {}, g);
      L.frameEl = mk("path", { "fill-rule": "evenodd", fill: S.lin(root, "#cfe3f5", "#7e9cc4", 120), opacity: 0.9, filter: "url(#sciRim)",
        d: `M${b.x - w + 30} ${b.y - w}h${b.w + 2 * w - 60}a30 30 0 0 1 30 30v${b.h + 2 * w - 60}a30 30 0 0 1 -30 30h${-(b.w + 2 * w - 60)}a30 30 0 0 1 -30 -30v${-(b.h + 2 * w - 60)}a30 30 0 0 1 30 -30Z M${b.x} ${b.y + 18}a18 18 0 0 1 18 -18h${b.w - 36}a18 18 0 0 1 18 18v${b.h - 36}a18 18 0 0 1 -18 18h${-(b.w - 36)}a18 18 0 0 1 -18 -18Z` }, g);
      mk("rect", { x: b.x + 14, y: b.y + 16, width: 10, height: b.h * 0.55, rx: 5, fill: "#ffffff", opacity: 0.12 }, g);   // glass glint
      return L;
    },
    membrane(g, o, root) {                           // phospholipid bilayer: two rows of heads with tails, plus channel proteins
      const m = o.membrane, b = o.box, el = mk("g", {}, g), headR = Math.max(5, m.th * 0.13), step = headR * 2.15;
      const inCh = (y) => m.channels.some((c) => Math.abs(y - c.y) < c.h / 2 + headR * 1.6);
      const tails = mk("g", { opacity: 0.95 }, el);
      for (let y = b.y + headR; y < b.y + b.h; y += step) {
        if (inCh(y)) continue;
        for (const side of [-1, 1]) {
          const hx = m.x + side * (m.th / 2 - headR);
          mk("path", { d: `M${hx} ${y - headR * 0.3}Q${hx - side * m.th * 0.25} ${y - headR * 0.6} ${m.x + side * headR * 0.4} ${y - headR * 0.25}`, stroke: "#f2c879", "stroke-width": headR * 0.42, fill: "none", "stroke-linecap": "round" }, tails);
          mk("path", { d: `M${hx} ${y + headR * 0.3}Q${hx - side * m.th * 0.25} ${y + headR * 0.6} ${m.x + side * headR * 0.4} ${y + headR * 0.3}`, stroke: "#e3b261", "stroke-width": headR * 0.42, fill: "none", "stroke-linecap": "round" }, tails);
          mk("circle", { cx: hx, cy: y, r: headR, fill: S.sphere(root, "#f08a5d") }, el);
        }
      }
      for (const c of m.channels) {                  // transmembrane protein: two lobes with a pore between them
        const col = c.color || (c.kind === "aquaporin" ? "#4fb3d9" : "#8a6ad8"), pw = c.h * 0.5, lobeH = (c.h - pw) / 2 + headR * 1.4;
        for (const s of [-1, 1]) {
          const cy = c.y + s * (pw / 2 + lobeH / 2) ;
          mk("rect", { x: m.x - m.th * 0.68, y: cy - lobeH / 2, width: m.th * 1.36, height: lobeH, rx: Math.min(lobeH, m.th) * 0.45, fill: S.sphere(root, col, { flat: 0.2 }), filter: "url(#sciRimOnly)" }, el);
        }
      }
      return el;
    },
  };

  class Particles {
    constructor(group, opts) {
      this.g = group; this.o = Object.assign({}, DEF, opts || {}); this.art = Object.assign({}, ART, (opts || {}).art || {});
      const o = this.o; this.spNames = Object.keys(o.species);
      S.defs(group);
      this.L = this.art.container(mk("g", {}, group), o, group);
      this.memG = mk("g", {}, group);
      this.trailG = mk("g", { opacity: 0.5 }, group);
      this.partG = mk("g", { filter: "url(#sciRimOnly)" }, group);
      if (o.membrane) { o.membrane = Object.assign({ th: 44, channels: [], osmosis: false, fill0: 0.75 }, o.membrane); this.art.membrane(this.memG, o, group); }
      this.cache = new S.Cache(o.dt, () => this.init(), (st, t, dt) => this.step(st, t, dt),
        (st) => ({ ...st, P: st.P.map((p) => ({ ...p })), hist: st.hist && st.hist.slice(), level: st.level && { ...st.level }, }), 1);
      this.els = [];
    }
    kT(T) { return KB * T / 300; }
    sigma(T, m) { return this.o.vScale * Math.sqrt((T / 300) * (28 / m)); }
    Tat(t) { return S.val(this.o.T, t, 300); }

    init() {
      const o = this.o, r = S.rng(o.seed), P = [], b = o.box;
      const T0 = this.Tat(0);
      for (const f of o.fill) {
        const sp = o.species[f.s], reg = f.region || [b.x, b.y, b.w, b.h];
        for (let i = 0, tries = 0; i < f.n && tries < f.n * 400; tries++) {
          const x = reg[0] + sp.r + r() * (reg[2] - 2 * sp.r), y = reg[1] + sp.r + r() * (reg[3] - 2 * sp.r);
          if (o.membrane && Math.abs(x - o.membrane.x) < o.membrane.th / 2 + sp.r) continue;
          if (o.membrane && o.membrane.osmosis && y < b.y + b.h * (1 - o.membrane.fill0) + sp.r) continue;
          if (P.some((q) => (q.x - x) ** 2 + (q.y - y) ** 2 < (q.r + sp.r + 2) ** 2)) continue;
          const s = this.sigma(T0, sp.m), v = s * Math.sqrt(-2 * Math.log(1 - r())), a = r() * 6.283;   // Rayleigh sample
          const w = (r() < 0.5 ? -1 : 1) * this.sigma(T0, sp.m) / (sp.r * 2.2) * (0.6 + r() * 0.8);
          P.push({ s: f.s, x, y, vx: v * Math.cos(a), vy: v * Math.sin(a), r: sp.r, m: sp.m, ang: r() * 6.283, w, alive: true,
                   side: o.membrane ? Math.sign(x - o.membrane.x) : 0, transit: false });
          i++;
        }
      }
      const st = { P, reacted: 0 };
      if (o.hist) this.histStep(st, 0);
      if (o.membrane && o.membrane.osmosis) { st.n0 = this.sideCounts(P); st.level = { "-1": 0, "1": 0 }; this.levels(st); }
      return st;
    }
    sideCounts(P) { const c = { "-1": 0, "1": 0 }; for (const p of P) if (p.alive) c[p.side]++; return c; }
    levels(st) {                                     // incompressible liquid: each side's height follows its count
      const o = this.o, b = o.box, m = o.membrane, c = this.sideCounts(st.P);
      for (const s of ["-1", "1"]) st.level[s] = b.y + b.h - b.h * m.fill0 * (c[s] / Math.max(1, st.n0[s]));
    }

    step(st, t, dt) {
      const o = this.o, b = o.box, P = st.P, m = o.membrane, T = this.Tat(t);
      st.r = S.rng(o.seed * 7919 + st.n * 104729);     // per step stream: identical whether restored from a snapshot or not
      // thermostat (Berendsen): measured T from mean kinetic energy, 2D equipartition <KE> = kT
      if (o.thermostat > 0) {
        let ke = 0, n = 0; for (const p of P) if (p.alive) { ke += 0.5 * p.m * (p.vx * p.vx + p.vy * p.vy); n++; }
        const Tm = (ke / n) / (28 * o.vScale * o.vScale) * 300 * 2 / 2;      // KE/particle = kT  ->  T
        const lam = Math.sqrt(Math.max(0.5, Math.min(2, 1 + (dt / o.thermostat) * (T / Math.max(1, Tm) - 1))));
        for (const p of P) { p.vx *= lam; p.vy *= lam; }
        st.Tm = Tm;
      }
      for (const p of P) {
        if (!p.alive) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.ang += p.w * dt;
        let top = b.y; if (m && m.osmosis) top = st.level[p.side] || b.y;
        if (p.x < b.x + p.r) { p.x = b.x + p.r; p.vx = Math.abs(p.vx); }
        if (p.x > b.x + b.w - p.r) { p.x = b.x + b.w - p.r; p.vx = -Math.abs(p.vx); }
        if (p.y < top + p.r) { p.y = top + p.r; p.vy = Math.abs(p.vy); }
        if (p.y > b.y + b.h - p.r) { p.y = b.y + b.h - p.r; p.vy = -Math.abs(p.vy); }
        if (m) this.membraneStep(p, st);
      }
      this.collide(st, t);
      if (m && m.osmosis) this.levels(st);
      if (o.hist) this.histStep(st, dt);
    }

    membraneStep(p, st) {
      const m = this.o.membrane, sp = this.o.species[p.s], half = m.th / 2 + p.r, dx = p.x - m.x;
      if (Math.abs(dx) >= half) { if (p.transit) { p.transit = false; p.side = Math.sign(dx); } return; }
      if (!p.transit) {
        let ch = null;
        if (!sp.lipid) for (const c of m.channels) if (c.pass.includes(p.s) && Math.abs(p.y - c.y) <= c.h / 4 - p.r * 0.3) { ch = c; break; }
        if (sp.lipid || ch) { p.transit = true; p.ch = ch; }
        else { p.x = m.x + p.side * half; p.vx = p.side * Math.abs(p.vx); return; }       // bounce off the bilayer
      }
      if (p.ch) {                                     // inside the pore: the pore walls confine it
        const lim = Math.max(0, p.ch.h / 4 - p.r * 0.3);
        if (p.y < p.ch.y - lim) { p.y = p.ch.y - lim; p.vy = Math.abs(p.vy); }
        if (p.y > p.ch.y + lim) { p.y = p.ch.y + lim; p.vy = -Math.abs(p.vy); }
      }
    }

    collide(st) {
      const P = st.P.filter((p) => p.alive).sort((a, b) => a.x - b.x), n = P.length, rx = this.o.reactions, m = this.o.membrane;
      let rmax = 0; for (const p of P) rmax = Math.max(rmax, p.r);
      for (let i = 0; i < n; i++) {
        const a = P[i]; if (!a.alive) continue;
        for (let j = i + 1; j < n; j++) {
          const c = P[j]; if (c.x - a.x > a.r + rmax) break; if (!c.alive) continue;
          if (m && !a.transit && !c.transit && a.side !== c.side) continue;     // the membrane separates them
          const dx = a.x - c.x, dy = a.y - c.y, d2 = dx * dx + dy * dy, R = a.r + c.r;
          if (d2 >= R * R || d2 === 0) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, vrel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
          if (vrel < 0) {
            const re = rx.find((q) => (q.a === a.s && q.b === c.s) || (q.a === c.s && q.b === a.s));
            const mu = a.m * c.m / (a.m + c.m), E = 0.5 * mu * vrel * vrel / (28 * this.o.vScale * this.o.vScale);   // in k*300K
            if (re && E >= re.Ea) {                   // effective collision: merge, conserving momentum
              const M = a.m + c.m, sp = this.o.species[re.c];
              a.vx = (a.m * a.vx + c.m * c.vx) / M; a.vy = (a.m * a.vy + c.m * c.vy) / M;
              a.x = (a.m * a.x + c.m * c.x) / M; a.y = (a.m * a.y + c.m * c.y) / M; a.m = M; a.s = re.c; a.r = sp.r;
              a.ang = Math.atan2(-ny, -nx); a.born = st.t; c.alive = false; st.reacted++; continue;
            }
            const k1 = 2 * c.m / (a.m + c.m) * vrel, k2 = 2 * a.m / (a.m + c.m) * vrel;  // elastic impulse along the normal
            a.vx -= k1 * nx; a.vy -= k1 * ny; c.vx += k2 * nx; c.vy += k2 * ny;
          }
          const ov = R - d, wa = c.m / (a.m + c.m), wc = a.m / (a.m + c.m);      // separate overlap by inverse mass
          a.x += nx * ov * wa; a.y += ny * ov * wa; c.x -= nx * ov * wc; c.y -= ny * ov * wc;
        }
      }
    }

    // time averaged speed histogram (fraction per bin), exponential moving average over o.hist.tau seconds.
    // A single frame of ~100 molecules is noisy; averaging over time is what an instrument would read.
    histStep(st, dt) {
      const h = this.o.hist, bw = h.vmax / h.bins, cnt = new Array(h.bins).fill(0); let n = 0;
      for (const p of st.P) if (p.alive && (!h.s || p.s === h.s)) { const k = Math.floor(Math.hypot(p.vx, p.vy) / bw); if (k < h.bins) cnt[k]++; n++; }
      if (!st.hist) { st.hist = cnt.map((c) => c / n); return; }
      const a = Math.min(1, dt / (h.tau || 0.6)); for (let i = 0; i < h.bins; i++) st.hist[i] += (cnt[i] / n - st.hist[i]) * a;
    }
    state(t) { return this.cache.at(t); }
    speeds(t, s) { return this.state(t).P.filter((p) => p.alive && (!s || p.s === s)).map((p) => Math.hypot(p.vx, p.vy)); }
    temperature(t) { const P = this.state(t).P.filter((p) => p.alive); let ke = 0; for (const p of P) ke += 0.5 * p.m * (p.vx * p.vx + p.vy * p.vy);
      return (ke / P.length) / (28 * this.o.vScale * this.o.vScale) * 300; }
    counts(t) { const c = { L: {}, R: {} }, m = this.o.membrane; for (const p of this.state(t).P) if (p.alive) { const k = (m ? p.x < m.x : p.x < this.o.box.x + this.o.box.w / 2) ? "L" : "R"; c[k][p.s] = (c[k][p.s] || 0) + 1; } return c; }

    draw(t) {
      const o = this.o, st = this.state(t), b = o.box, m = o.membrane;
      // liquid fill (osmosis levels) or plain fluid tint
      if (m && m.osmosis) {
        if (!this.fl) this.fl = [-1, 1].map(() => mk("path", { fill: o.fluid || "#3f8fd0", opacity: 0.32 }, this.L.fluid));
        [-1, 1].forEach((s, k) => { const y = st.level[s], x0 = s < 0 ? b.x : m.x, x1 = s < 0 ? m.x : b.x + b.w;
          this.fl[k].setAttribute("d", `M${x0} ${y + 6}Q${x0} ${y} ${x0 + 12} ${y}H${x1 - 12}Q${x1} ${y} ${x1} ${y + 6}V${b.y + b.h - 18}Q${x1} ${b.y + b.h} ${x1 - 18} ${b.y + b.h}H${x0 + 18}Q${x0} ${b.y + b.h} ${x0} ${b.y + b.h - 18}Z`); });
      } else if (o.fluid && !this.fl) { this.fl = [mk("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 18, fill: o.fluid, opacity: 0.28 }, this.L.fluid)]; }
      let td = "";
      st.P.forEach((p, i) => {
        let el = this.els[i];
        if (!el || el._s !== p.s) { if (el) el.remove(); el = this.els[i] = this.art.make(this.partG, o.species[p.s], this.g); el._s = p.s; }
        if (!p.alive) { el.setAttribute("display", "none"); return; }
        el.removeAttribute("display");
        // reaction flash: the product pops in slightly larger and settles
        const pop = p.born != null && t - p.born < 0.35 ? 1 + 0.35 * Math.sin((t - p.born) / 0.35 * Math.PI) : 1;
        el.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.ang * 57.3).toFixed(1)})${pop !== 1 ? ` scale(${pop.toFixed(3)})` : ""}`);
        if (o.trails) { const v = Math.hypot(p.vx, p.vy), L = Math.min(v * 0.09, p.r * 4); if (L > p.r * 0.6) {
          const ux = p.vx / v, uy = p.vy / v, w = p.r * 0.55, ex = p.x - ux * (L + p.r * 0.4), ey = p.y - uy * (L + p.r * 0.4);
          td += `M${(p.x - uy * w).toFixed(1)} ${(p.y + ux * w).toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}L${(p.x + uy * w).toFixed(1)} ${(p.y - ux * w).toFixed(1)}Z`; } }
      });
      if (o.trails) { if (!this.trail) this.trail = mk("path", { fill: "#bfe0ff", opacity: 0.5 }, this.trailG); this.trail.setAttribute("d", td); }
      return st;
    }
  }
  G.LPParticles = Particles;
})(window);
