/* LevlPrep studio science kit: shared helpers (2026-10-21).
   Loaded before every sci/ module. Exposes window.LPSci with:
     rng(seed) -> () => [0,1)            seeded mulberry32, deterministic
     gauss(r) -> standard normal from rng r
     noise3(x, y, z)                     smooth gradient noise in [-1, 1] (deterministic, seedless)
     curl(x, y, z, eps) -> [vx, vy]      divergence free swirl field from the noise (curl of a scalar potential)
     mk(tag, attrs, parent)              SVG element helper
     defs(svg)                           installs the shared style B filters once and returns <defs>
     sphere(svg, hex, opts)              radial gradient url for a shaded ball of that color (light from upper left)
     lin(svg, hex0, hex1, angleDeg)      linear gradient url
     lighten / darken / mix              color math on #rrggbb
     track(keys, t, n)                   keyframe helper (LPTrack from skin.js when loaded, else the same code)
     Cache(dt, init, step)               fixed step forward integrator, cached, resets when t goes backwards
     arrow(x0, y0, x1, y1, w)            filled arrow path (no outline) for force / velocity vectors
     smooth(pts, closed, tension)        Catmull-Rom path through points
     label(group, opts)                  dark pill label (Inter ExtraBold), returns {el, set(text, x, y, opacity)}

   Style B in code: flat fills with smooth gradients, a warm rim on the lit (upper left) edge, a soft dark plane on
   the far edge, soft drop shadows, never outlines. Art is kept apart from simulation state everywhere: every module
   has a pure simulate step (numbers only) and a draw step that maps state to shapes, so the shapes can later be
   swapped for painted textures without touching the physics. */
(function (G) {
  const NS = "http://www.w3.org/2000/svg";
  const S = {};
  S.NS = NS;

  S.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  S.gauss = function (r) { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); };

  // ---- gradient noise (3D, hashed lattice, quintic fade). Deterministic, no state.
  function hash(i, j, k) { let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
  const GR = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  function grad(i, j, k, x, y, z) { const g = GR[hash(i, j, k) % 12]; return g[0] * x + g[1] * y + g[2] * z; }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  S.noise3 = function (x, y, z) {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z); x -= X; y -= Y; z -= Z;
    const u = fade(x), v = fade(y), w = fade(z), L = (a, b, t) => a + (b - a) * t;
    return L(L(L(grad(X, Y, Z, x, y, z), grad(X + 1, Y, Z, x - 1, y, z), u), L(grad(X, Y + 1, Z, x, y - 1, z), grad(X + 1, Y + 1, Z, x - 1, y - 1, z), u), v),
             L(L(grad(X, Y, Z + 1, x, y, z - 1), grad(X + 1, Y, Z + 1, x - 1, y, z - 1), u), L(grad(X, Y + 1, Z + 1, x, y - 1, z - 1), grad(X + 1, Y + 1, Z + 1, x - 1, y - 1, z - 1), u), v), w);
  };
  // curl noise: v = (dP/dy, -dP/dx) of a 2 octave potential P. Divergence free, so smoke swirls without sinks.
  S.curl = function (x, y, z, eps) {
    eps = eps || 0.01;
    const P = (a, b) => S.noise3(a, b, z) + 0.5 * S.noise3(a * 2.03 + 17.1, b * 2.03 - 4.7, z * 1.7);
    const dx = (P(x + eps, y) - P(x - eps, y)) / (2 * eps), dy = (P(x, y + eps) - P(x, y - eps)) / (2 * eps);
    return [dy, -dx];
  };

  S.mk = function (tag, a, parent) {
    const e = document.createElementNS(NS, tag);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  // ---- color math
  const hx = (h) => { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  S.mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  S.lighten = (a, t) => S.mix(a, "#fff4e0", t);   // warm white: the key light is warm
  S.darken = (a, t) => S.mix(a, "#141a3a", t);    // cool deep navy: shadows lean blue, never grey/black
  S.rgba = (a, op) => { const c = hx(a); return `rgba(${c[0]},${c[1]},${c[2]},${op})`; };

  function svgOf(el) { return el.ownerSVGElement || (el.tagName === "svg" ? el : null) || document.querySelector("svg"); }
  S.defs = function (el) {
    const svg = svgOf(el);
    let d = svg.querySelector("defs#lpsci-defs");
    if (d) return d;
    d = S.mk("defs", { id: "lpsci-defs" }); svg.insertBefore(d, svg.firstChild);
    d.innerHTML = `
<filter id="sciRim" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feOffset in="SourceAlpha" dx="2.4" dy="2.2" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="edge"/>
  <feGaussianBlur in="edge" stdDeviation="0.8" result="edgeB"/><feFlood flood-color="#ffc27a" flood-opacity="0.85"/><feComposite in2="edgeB" operator="in" result="rim"/>
  <feOffset in="SourceAlpha" dx="-12" dy="-8" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="far"/>
  <feGaussianBlur in="far" stdDeviation="4.5" result="farB"/><feComposite in="farB" in2="SourceAlpha" operator="in" result="farIn"/>
  <feFlood flood-color="#0b1230" flood-opacity="0.32"/><feComposite in2="farIn" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shadow"/><feMergeNode in="rim"/></feMerge></filter>
<filter id="sciRimOnly" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feOffset in="SourceAlpha" dx="1.6" dy="1.5" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="edge"/>
  <feGaussianBlur in="edge" stdDeviation="0.6" result="edgeB"/><feFlood flood-color="#ffd59a" flood-opacity="0.9"/><feComposite in2="edgeB" operator="in" result="rim"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="rim"/></feMerge></filter>
<filter id="sciShadow" x="-30%" y="-30%" width="160%" height="170%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="9"/><feOffset dx="6" dy="14" result="b"/>
  <feFlood flood-color="#0b1230" flood-opacity="0.33"/><feComposite in2="b" operator="in" result="sh"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="sciGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`;
    return d;
  };

  const gradCache = new WeakMap();
  function cacheFor(svg) { let c = gradCache.get(svg); if (!c) { c = {}; gradCache.set(svg, c); } return c; }
  // shaded ball: warm highlight upper left, body color, cool shade lower right. opts.flat (0..1) softens it.
  S.sphere = function (el, hex, opts) {
    opts = opts || {}; const svg = svgOf(el), c = cacheFor(svg), key = "s" + hex + (opts.flat || 0);
    if (c[key]) return c[key];
    const id = "sciS" + Object.keys(c).length + "_" + hex.replace("#", "");
    const f = opts.flat || 0, d = S.defs(svg);
    const g = S.mk("radialGradient", { id, cx: "0.42", cy: "0.38", r: "0.68", fx: "0.32", fy: "0.26" }, d);
    S.mk("stop", { offset: "0", "stop-color": S.lighten(hex, 0.45 * (1 - f)) }, g);
    S.mk("stop", { offset: "0.45", "stop-color": hex }, g);
    S.mk("stop", { offset: "1", "stop-color": S.darken(hex, 0.38 * (1 - f)) }, g);
    return (c[key] = `url(#${id})`);
  };
  S.lin = function (el, a, b, ang) {
    const svg = svgOf(el), c = cacheFor(svg), key = "l" + a + b + (ang || 90);
    if (c[key]) return c[key];
    const id = "sciL" + Object.keys(c).length, r = ((ang == null ? 90 : ang) * Math.PI) / 180;
    const g = S.mk("linearGradient", { id, x1: 0.5 - Math.cos(r) / 2, y1: 0.5 - Math.sin(r) / 2, x2: 0.5 + Math.cos(r) / 2, y2: 0.5 + Math.sin(r) / 2 }, S.defs(svg));
    S.mk("stop", { offset: 0, "stop-color": a }, g); S.mk("stop", { offset: 1, "stop-color": b }, g);
    return (c[key] = `url(#${id})`);
  };

  // keyframes [[t, v1..vn, ease]] (same contract as LPTrack in skin.js)
  const EASE = { linear: (x) => x, in: (x) => x * x * x, out: (x) => 1 - Math.pow(1 - x, 3),
    inout: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), step: (x) => (x < 1 ? 0 : 1) };
  S.EASE = EASE;
  S.track = function (keys, t, n) {
    if (G.LPTrack) return G.LPTrack(keys, t, n);
    if (!keys || !keys.length) return null;
    if (t <= keys[0][0]) return keys[0].slice(1, 1 + n);
    for (let i = 1; i < keys.length; i++) {
      const b = keys[i];
      if (t <= b[0]) { const a = keys[i - 1], e = EASE[b[1 + n] || "inout"] || EASE.inout, u = e((t - a[0]) / Math.max(1e-6, b[0] - a[0]));
        const o = []; for (let k = 1; k <= n; k++) o.push(a[k] + (b[k] - a[k]) * u); return o; }
    }
    return keys[keys.length - 1].slice(1, 1 + n);
  };
  S.val = (v, t, def) => (v == null ? def : Array.isArray(v) ? S.track(v, t, 1)[0] : typeof v === "function" ? v(t) : v);

  // fixed step forward integration with a cache, so any frame can be requested in any order (backwards resets to 0).
  // Snapshots every `snapEvery` seconds (via clone) make backward seeks cheap when clone is provided.
  class Cache {
    constructor(dt, init, step, clone, snapEvery) { this.dt = dt; this.init = init; this.stepf = step; this.clone = clone; this.snapEvery = snapEvery || 1; this.snaps = []; this.st = null; }
    at(t) {
      if (!this.st || t < this.st.t - 1e-9) {
        let s = null;
        if (this.clone) for (let i = this.snaps.length - 1; i >= 0; i--) if (this.snaps[i].t <= t + 1e-9) { s = this.clone(this.snaps[i]); break; }
        this.st = s || Object.assign(this.init(), { t: 0, n: 0 });
      }
      const st = this.st;
      while (st.t + this.dt <= t + 1e-9) {
        this.stepf(st, st.t, this.dt); st.n++; st.t = st.n * this.dt;
        if (this.clone && st.n % Math.round(this.snapEvery / this.dt) === 0 && !this.snaps.some((q) => q.n === st.n)) this.snaps.push(this.clone(st));
      }
      return st;
    }
  }
  S.Cache = Cache;

  // filled arrow from (x0,y0) to (x1,y1), shaft width w, head scaled to w (vectors in physics/graphs; no outline)
  S.arrow = function (x0, y0, x1, y1, w, headK) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    if (L < 1) return "";
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, hw = w * (headK || 1.25), hl = Math.min(L * 0.6, w * 2.6), sw = w / 2;
    const bx = x1 - ux * hl, by = y1 - uy * hl, f = (v) => v.toFixed(1);
    return `M${f(x0 + nx * sw)} ${f(y0 + ny * sw)}L${f(bx + nx * sw)} ${f(by + ny * sw)}L${f(bx + nx * hw)} ${f(by + ny * hw)}L${f(x1)} ${f(y1)}` +
           `L${f(bx - nx * hw)} ${f(by - ny * hw)}L${f(bx - nx * sw)} ${f(by - ny * sw)}L${f(x0 - nx * sw)} ${f(y0 - ny * sw)}Z`;
  };

  S.smooth = function (P, closed, tension) {
    tension = tension == null ? 0.5 : tension; const n = P.length; if (n < 2) return "";
    const f = (v) => v.toFixed(1); let d = `M${f(P[0][0])} ${f(P[0][1])}`;
    const lim = closed ? n : n - 1;
    for (let i = 0; i < lim; i++) {
      const p0 = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      d += `C${f(p1[0] + (p2[0] - p0[0]) * tension / 3)} ${f(p1[1] + (p2[1] - p0[1]) * tension / 3)} ${f(p2[0] - (p3[0] - p1[0]) * tension / 3)} ${f(p2[1] - (p3[1] - p1[1]) * tension / 3)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + (closed ? "Z" : "");
  };

  S.label = function (group, o) {
    o = Object.assign({ size: 34, bg: "#141c38", fg: "#ffffff", pad: 26, op: 0.92 }, o || {});
    const g = S.mk("g", { opacity: 0 }, group), r = S.mk("rect", { rx: o.size, fill: o.bg, opacity: o.op }, g);
    const tx = S.mk("text", { "text-anchor": "middle", "font-family": "Inter, Arial", "font-weight": 800, "font-size": o.size, fill: o.fg }, g);
    let last = null;
    return { el: g, text: tx, set(text, x, y, op) {
      if (text !== last) { tx.textContent = text; last = text; const w = tx.getComputedTextLength() + o.pad * 2, h = o.size * 1.8;
        r.setAttribute("x", -w / 2); r.setAttribute("y", -h / 2); r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", h / 2);
        tx.setAttribute("y", o.size * 0.36); }
      g.setAttribute("transform", `translate(${x} ${y})`); g.setAttribute("opacity", op == null ? 1 : op); } };
  };

  G.LPSci = S;
})(window);
