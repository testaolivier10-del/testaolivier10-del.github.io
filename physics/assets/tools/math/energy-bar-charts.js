/* Energy bar charts model: ApPhysMath.energyBarCharts (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/energy-bar-charts.mjs) and the test
   (scripts/test/apphys-tool-energy-bar-charts.test.mjs) run exactly this code.

   Loaded on physics/tools/energy-bar-charts.html after phys-tool-math.js and
   before physics/assets/tools/energy-bar-charts.js. SI units throughout.

   Explore model
     SCENES                 skater (valley, hill, drop tracks), launcher (spring,
                            floor, ramp), ramp (frictionless ramp onto a rough
                            floor), lift (a cable lifts a box from rest to rest)
     path(scene, o)         a track sampled by arc length: { s[], x[], y[],
                            th[] (tangent angle), k[] (curvature), mu[] }
     sim(scene, o)          a run: { step(dt), state() } where state() is
                            { t, s, x, y, v, K, Ug, Us, Eth, Wc, ... }. The
                            motion is integrated in small steps (semi-implicit
                            Euler at 1 ms) and the speed is then set from the
                            energy ledger, so K + Ug + Us + Eth = E0 + Wc holds
                            exactly at every step: the bars always add up.
     ledger(s0, s, system)  the bar chart for a system choice
                            { earth, spring, surface } (the object is always
                            in): start and now bars (K, Ug, Us, Eth), and the
                            work done across the boundary by each outside
                            agent (gravity, spring, friction, cable). Start +
                            work = now, for every system.
   Test yourself
     generate(rng, ctx, type) -> { ctx, topic, type, text, figure, steps,
                            solution, values } for ApPhysTools.drill. Types:
                            bars (pick the system, then build the before and
                            after bar charts in units), speed, height, spring,
                            friction, work, power, ke. */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  var F = function(x, d){ return M.minus(M.fixed(x, d)); };
  var fmt = function(x, n){ return M.fmt(x, n || 3); };

  /* ------------------------------------------------------------ tracks */
  /* max(0, z) with its corner rounded by a parabola of half-width r: slope
     and height match at both ends, so the track is smooth (C1) and exactly
     flat for z < -r (a rough floor that starts there has no curvature). */
  function softplus(z, r){ return z <= -r ? 0 : z >= r ? z : (z + r) * (z + r) / (4 * r); }
  var DEG = Math.PI / 180;
  var TRACKS = {
    valley: { label: 'Valley', x: [0, 10], y: function(x, o){ var H = o.H || 4.5; return H * Math.pow((x - 5) / 5, 2); } },
    hill: { label: 'Hill', x: [0, 10], y: function(x){ return 0.6 + 4.6 * Math.pow((x - 5) / 5, 4) + 2.3 * Math.exp(-Math.pow((x - 5) / 1.15, 2)); } },
    drop: { label: 'Drop', x: [0, 10], y: function(x){ return 0.5 + 4.5 / (1 + Math.exp((x - 1.7) / 0.45)) + 4.8 * Math.pow(Math.max(0, (x - 7) / 3), 2); } }
  };
  /* A path: y(x) sampled finely, then indexed by arc length. */
  function makePath(yf, x0, x1, muf){
    var N = 1600, xs = [], ys = [], s = [0], th = [], kap = [], mu = [], h = (x1 - x0) / N;
    for(var i = 0; i <= N; i++){ var x = x0 + i * h; xs.push(x); ys.push(yf(x)); }
    for(i = 0; i <= N; i++){
      var a = Math.max(0, i - 1), b = Math.min(N, i + 1);
      var d1 = (ys[b] - ys[a]) / (xs[b] - xs[a]);
      var d2 = i > 0 && i < N ? (ys[i + 1] - 2 * ys[i] + ys[i - 1]) / (h * h) : 0;
      th.push(Math.atan(d1));
      kap.push(d2 / Math.pow(1 + d1 * d1, 1.5));
      mu.push(muf ? muf(xs[i]) : 0);
      if(i > 0) s.push(s[i - 1] + Math.sqrt(h * h + Math.pow(ys[i] - ys[i - 1], 2)));
    }
    return { x: xs, y: ys, s: s, th: th, k: kap, mu: mu, len: s[N], n: N };
  }
  /* Values at arc length q, by linear interpolation in the table. */
  function at(P, q){
    q = Math.max(0, Math.min(P.len, q));
    var lo = 0, hi = P.n;
    while(hi - lo > 1){ var m = (lo + hi) >> 1; if(P.s[m] <= q) lo = m; else hi = m; }
    var f = P.s[hi] > P.s[lo] ? (q - P.s[lo]) / (P.s[hi] - P.s[lo]) : 0;
    function L(a){ return a[lo] + (a[hi] - a[lo]) * f; }
    return { x: L(P.x), y: L(P.y), th: L(P.th), k: L(P.k), mu: P.mu[f < 0.5 ? lo : hi] };
  }
  /* The arc length nearest a point (x, y): for dragging the start spot. */
  function nearest(P, x, y){
    var best = 0, bd = Infinity;
    for(var i = 0; i <= P.n; i += 2){ var d = Math.pow(P.x[i] - x, 2) + Math.pow(P.y[i] - y, 2); if(d < bd){ bd = d; best = i; } }
    return P.s[best];
  }

  var SCENES = {
    skater: { label: 'Skater', agents: ['earth', 'surface'], object: 'skater', surface: 'track' },
    launcher: { label: 'Launcher', agents: ['earth', 'spring'], object: 'block', surface: 'floor' },
    ramp: { label: 'Ramp', agents: ['earth', 'surface'], object: 'block', surface: 'floor' },
    lift: { label: 'Lift', agents: ['earth', 'cable'], object: 'box', surface: null }
  };
  var LAUNCH = { L0: 1.2, flat: 5, ang: 30, top: 11 };
  function path(scene, o){
    o = o || {};
    if(scene === 'skater'){
      var T = TRACKS[o.track || 'valley'] || TRACKS.valley, mu = o.mu || 0;
      return makePath(function(x){ return T.y(x, o); }, T.x[0], T.x[1], function(){ return mu; });
    }
    if(scene === 'launcher'){
      var tn = Math.tan(LAUNCH.ang * DEG);
      return makePath(function(x){ return tn * softplus(x - LAUNCH.flat, 0.4); }, 0, LAUNCH.top, null);
    }
    if(scene === 'ramp'){
      var h = o.h || 1.5, t2 = Math.tan(35 * DEG), xb = h / t2, muF = o.mu == null ? 0.4 : o.mu;
      var P = makePath(function(x){ return t2 * softplus(xb - x, 0.3); }, 0, xb + 10.8, function(x){ return x >= xb + 0.4 ? muF : 0; });
      P.floorX = xb + 0.4;
      return P;
    }
    return null;
  }

  /* ------------------------------------------------------------ the run */
  function sim(scene, o){
    o = o || {};
    var g = o.g || M.C.g, m = o.m || (scene === 'skater' ? 50 : scene === 'lift' ? 40 : 1);
    if(scene === 'lift') return liftSim(o, g, m);
    var P = path(scene, o), k = o.k || 200, xc = o.x || 0.2;
    var s0 = scene === 'launcher' ? LAUNCH.L0 - xc : scene === 'ramp' ? 0 : (o.s0 == null ? 0.2 : o.s0);
    s0 = Math.max(0, Math.min(P.len, s0));
    function spring(q){ if(scene !== 'launcher') return { U: 0, F: 0 }; var c = Math.max(0, LAUNCH.L0 - q); return { U: 0.5 * k * c * c, F: k * c }; }
    var p0 = at(P, s0), st = { t: 0, s: s0, v: 0, Eth: 0, Wc: 0 };
    var E0 = m * g * p0.y + spring(s0).U, rest = false, h = 0.001;
    function sub(){
      var p = at(P, st.s), sp = spring(st.s);
      var N = Math.max(0, m * (g * Math.cos(p.th) + st.v * st.v * p.k)), fr = p.mu * N;
      var Fc = -m * g * Math.sin(p.th) + sp.F;
      if(st.v === 0 && Math.abs(Fc) <= fr){ rest = true; st.t += h; return; }
      rest = false;
      var dir = st.v !== 0 ? (st.v > 0 ? 1 : -1) : (Fc > 0 ? 1 : -1);
      var v1 = st.v + (Fc - dir * fr) / m * h;
      if(st.v !== 0 && v1 * st.v < 0 && Math.abs(Fc) <= fr){
        // Friction stops it within this step and can hold it: the last bit
        // of kinetic energy becomes thermal energy, and it stays put.
        st.Eth += 0.5 * m * st.v * st.v; st.v = 0; st.t += h; return;
      }
      var s1 = st.s + v1 * h;
      if(s1 <= 0 || s1 >= P.len){ s1 = Math.max(0, Math.min(P.len, s1)); v1 = -v1; }  // a padded end stop
      // The ledger sets the speed: K = E0 + Wc - Ug - Us - Eth, exactly.
      var Kat = function(q){ return E0 + st.Wc - m * g * at(P, q).y - spring(q).U - st.Eth - fr * Math.abs(q - st.s); };
      var K = Kat(s1);
      if(K < 0){
        // A turning point (or friction stopping it) inside this step: find
        // where K reaches 0 and stop there for an instant.
        var lo = 0, hi = 1;
        for(var it = 0; it < 48; it++){ var mid = (lo + hi) / 2; if(Kat(st.s + (s1 - st.s) * mid) >= 0) lo = mid; else hi = mid; }
        s1 = st.s + (s1 - st.s) * lo; K = Math.max(0, Kat(s1)); v1 = 0;
      }
      st.Eth += fr * Math.abs(s1 - st.s);
      st.s = s1;
      st.v = v1 === 0 || K === 0 ? 0 : (v1 > 0 ? 1 : -1) * Math.sqrt(2 * K / m);
      st.t += h;
    }
    function state(){
      var p = at(P, st.s), sp = spring(st.s);
      var K = 0.5 * m * st.v * st.v;
      return { t: st.t, s: st.s, x: p.x, y: p.y, th: p.th, v: st.v, speed: Math.abs(st.v), m: m, g: g,
        K: K, Ug: m * g * p.y, Us: sp.U, Eth: st.Eth, Wc: 0, comp: Math.max(0, LAUNCH.L0 - st.s), rest: rest && st.v === 0, P: 0, E0: E0 };
    }
    return {
      path: P, m: m, g: g, s0: s0,
      step: function(dt){ var n = Math.max(1, Math.round(dt / h)); for(var i = 0; i < n; i++) sub(); return state(); },
      state: state,
      // Stopped for good: at rest with no net force able to move it.
      settled: function(){ if(st.v !== 0) return false; var p = at(P, st.s), sp = spring(st.s), N = m * g * Math.cos(p.th); return Math.abs(-m * g * Math.sin(p.th) + sp.F) <= p.mu * N + 1e-9 && st.t > 0.05; }
    };
  }
  /* The lift: from rest, speeds up at a for v/a, rises at constant v, slows
     at a to rest at the top. Every quantity is exact (closed form). */
  function liftSim(o, g, m){
    var H = o.H || 6, v = o.v || 1, a = o.a || 1.5, t1 = v / a, d1 = 0.5 * a * t1 * t1;
    if(2 * d1 > H){ t1 = Math.sqrt(H / a); d1 = H / 2; v = a * t1; }
    var t2 = (H - 2 * d1) / v, T = 2 * t1 + t2, t = 0;
    function kin(tt){
      tt = Math.max(0, Math.min(T, tt));
      if(tt <= t1) return { y: 0.5 * a * tt * tt, v: a * tt, T: m * (g + a) };
      if(tt <= t1 + t2) return { y: d1 + v * (tt - t1), v: v, T: m * g };
      var u = tt - t1 - t2; return { y: d1 + v * t2 + v * u - 0.5 * a * u * u, v: v - a * u, T: m * (g - a) };
    }
    function state(){
      var k = kin(t), K = 0.5 * m * k.v * k.v, Ug = m * g * k.y;
      // Work by the cable so far = the energy it moved in = K + Ug (from rest at y = 0).
      return { t: t, s: k.y, x: 0, y: k.y, th: 0, v: k.v, speed: k.v, m: m, g: g, K: K, Ug: Ug, Us: 0, Eth: 0, Wc: K + Ug, tension: k.T, P: k.T * k.v, rest: t >= T, E0: 0, T: T, vmax: v };
    }
    return { m: m, g: g, H: H, T: T, vmax: v, a: a,
      step: function(dt){ t = Math.min(T, t + dt); return state(); },
      state: state, settled: function(){ return t >= T; },
      // Work by the cable from the tension piecewise: an independent check.
      work: function(){ return m * (g + a) * d1 + m * g * (H - 2 * d1) + m * (g - a) * d1; } };
  }

  /* ---------------------------------------------------------- the ledger */
  /* system: { earth, spring, surface } (booleans). The object is always in;
     the cable never is. Returns start/now bars and the work across the
     boundary, and whether start + work = now (it always should). */
  function ledger(s0, s, sys){
    sys = sys || {};
    var start = { K: s0.K, Ug: sys.earth ? s0.Ug : null, Us: sys.spring ? s0.Us : null, Eth: sys.surface ? 0 : null };
    var now = { K: s.K, Ug: sys.earth ? s.Ug : null, Us: sys.spring ? s.Us : null, Eth: sys.surface ? s.Eth - s0.Eth : null };
    var work = {
      grav: sys.earth ? 0 : -(s.Ug - s0.Ug),
      spring: sys.spring ? 0 : -(s.Us - s0.Us),
      fric: sys.surface ? 0 : -(s.Eth - s0.Eth),
      cable: s.Wc - s0.Wc
    };
    var sum = function(o){ return Object.keys(o).reduce(function(a, k){ return a + (o[k] || 0); }, 0); };
    var W = sum(work), A = sum(start), B = sum(now);
    var scale = Math.max(1, Math.abs(A), Math.abs(B), Math.abs(work.grav), Math.abs(work.spring), Math.abs(work.fric), Math.abs(work.cable));
    return { start: start, now: now, work: work, W: W, totalStart: A, totalNow: B, balanced: Math.abs(A + W - B) <= 1e-9 * scale };
  }

  /* ---------------------------------------------------- Test yourself */
  var STEP = function(o){ o.level = o.level || 'apply'; return o; };
  function sysName(obj, surf, sys){
    var parts = ['the ' + obj];
    if(sys.earth) parts.push('Earth');
    if(sys.spring) parts.push('the spring');
    if(sys.surface) parts.push('the ' + surf);
    return parts.length === 1 ? 'the ' + obj + ' alone' : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* Situations for the bar charts. Each is told as energy STORES in units
     (exact integers): the object's K before and after, and for each agent
     the energy it holds with the object (Earth: U_g, spring: U_s, a rough
     surface: thermal energy gained), plus the work a cable does (always
     outside). bars(sys) then follows from the system choice alone:
       a store is a bar when its agent is inside the system;
       W = −(change in each outside store) + cable work.
     So start + W = after for every system, by construction. */
  var AG = {
    earth: { name: 'Earth', store: 'U<sub>g</sub>', pre: 'Ugi', post: 'Ugf' },
    spring: { name: 'the spring', store: 'U<sub>s</sub>', pre: 'Usi', post: 'Usf' },
    surface: { name: null, store: 'thermal energy', pre: null, post: 'Ethf' }
  };
  function agName(a, o){ return a === 'surface' ? 'the ' + o.surf : a === 'cable' ? 'the cable' : AG[a].name; }
  function barSituation(r, g, which){
    var kinds = ['ramp', 'rough', 'launch', 'launchUp', 'lift', 'skater', 'skaterRough'];
    var k = which && kinds.indexOf(which) > -1 ? which : r.pick(kinds), o = { kind: k, st: {}, cable: 0 };
    if(k === 'ramp' || k === 'rough'){
      o.obj = 'block'; o.surf = 'floor'; o.m = r.pick([1.0, 2.0, 2.5, 4.0, 5.0]); var hu = r.pick([0.25, 0.5]);
      o.n = r.int(3, 7); o.h = o.n * hu; o.u = o.m * g * hu;
      o.Ki = 0; o.Kf = k === 'ramp' ? o.n : 0; o.st.earth = [o.n, 0];
      if(k === 'rough') o.st.surface = [0, o.n];
      o.text = 'A ' + fmt(o.m, 2) + ' kg block starts from rest at the top of a frictionless ramp ' + F(o.h, 2) + ' m high' +
        (k === 'ramp' ? ' and slides to the bottom.' : ', slides down and then across a rough floor until it stops.');
      o.after = k === 'ramp' ? 'at the bottom of the ramp' : 'once it has stopped on the floor';
      o.how = 'mgh = ' + fmt(o.m, 2) + ' kg × ' + F(g, 1) + ' m/s² × ' + F(o.h, 2) + ' m = ' + fmt(o.m * g * o.h, 3) + ' J = ' + o.n + ' units.';
      o.fig = { scene: 'ramp', h: o.h, m: o.m, rough: k === 'rough' ? 'floor' : null };
    } else if(k === 'launch' || k === 'launchUp'){
      var c = r.pick(SPRINGS); o.obj = 'block'; o.surf = 'floor'; o.m = r.pick([0.50, 1.0, 2.0]); o.k = c.k; o.x = c.x; o.u = c.u; o.n = c.n;
      o.Ki = 0; o.Kf = k === 'launch' ? o.n : 0; o.st.spring = [o.n, 0];
      if(k === 'launchUp') o.st.earth = [0, o.n];
      o.text = 'A ' + fmt(o.m, 2) + ' kg block is pushed against a spring (k = ' + fmt(o.k, 3) + ' N/m), compressing it ' + F(o.x * 100, 0) + ' cm, and released from rest on a frictionless floor' +
        (k === 'launch' ? '.' : ' that leads to a frictionless ramp. Take U<sub>g</sub> = 0 on the floor.');
      o.after = k === 'launch' ? 'after it has left the spring, still on the floor' : 'at its highest point on the ramp';
      o.how = '½kx² = ½ × ' + fmt(o.k, 3) + ' N/m × (' + F(o.x, 2) + ' m)² = ' + fmt(0.5 * o.k * o.x * o.x, 3) + ' J = ' + o.n + ' units.';
      o.fig = { scene: 'launcher', k: o.k, x: o.x, m: o.m, up: k === 'launchUp' };
    } else if(k === 'lift'){
      o.obj = 'box'; o.surf = null; o.m = r.pick([10, 20, 25, 40, 50]); var hu2 = r.pick([0.5, 1.0]); o.n = r.int(3, 7); o.h = o.n * hu2; o.u = o.m * g * hu2;
      o.Ki = 0; o.Kf = 0; o.st.earth = [0, o.n]; o.cable = o.n;
      o.text = 'A cable lifts a ' + fmt(o.m, 2) + ' kg box from rest on the floor to rest ' + F(o.h, 1) + ' m above the floor. Take U<sub>g</sub> = 0 at the floor.';
      o.after = 'at rest at the top';
      o.how = 'mgh = ' + fmt(o.m, 2) + ' kg × ' + F(g, 1) + ' m/s² × ' + F(o.h, 1) + ' m = ' + fmt(o.m * g * o.h, 3) + ' J = ' + o.n + ' units, all of it brought in by the cable.';
      o.fig = { scene: 'lift', h: o.h, m: o.m };
    } else {
      o.obj = 'skater'; o.surf = 'track'; o.m = r.pick([40, 50, 60, 70]); var h1 = r.int(4, 7), h2 = r.int(1, h1 - 2);
      o.u = o.m * g; o.h1 = h1; o.h2 = h2; o.Ki = 0; o.st.earth = [h1, h2];
      if(k === 'skater'){
        o.Kf = h1 - h2;
        o.text = 'A ' + fmt(o.m, 2) + ' kg skater starts from rest ' + h1 + '.0 m above the ground on a frictionless track and rolls down to a point ' + h2 + '.0 m above the ground. Take U<sub>g</sub> = 0 at the ground.';
        o.how = 'U<sub>g</sub> = mgh: ' + h1 + ' units at ' + h1 + '.0 m and ' + h2 + ' units at ' + h2 + '.0 m (one unit for each meter of height).';
      } else {
        var kf = r.int(1, h1 - h2 - 1), th = h1 - h2 - kf;
        o.v = Math.sqrt(2 * kf * o.u / o.m); o.Kf = kf; o.st.surface = [0, th];
        o.text = 'A ' + fmt(o.m, 2) + ' kg skater starts from rest ' + h1 + '.0 m above the ground on a rough track and rolls down to a point ' + h2 + '.0 m above the ground, moving at ' + fmt(o.v, 3) + ' m/s. Take U<sub>g</sub> = 0 at the ground.';
        o.how = 'U<sub>g</sub> = mgh: ' + h1 + ' units at ' + h1 + '.0 m and ' + h2 + ' units at ' + h2 + '.0 m. K after = ½mv² = ½ × ' + fmt(o.m, 2) + ' kg × (' + fmt(o.v, 3) + ' m/s)² = ' + fmt(0.5 * o.m * o.v * o.v, 3) + ' J = ' + kf + ' units. Thermal energy is what is left: ' + th + ' units.';
      }
      o.after = 'at the lower point';
      o.fig = { scene: 'skater', h1: h1, h2: h2, m: o.m, rough: k === 'skaterRough' };
    }
    o.agents = Object.keys(o.st);
    o.bars = function(sys){ return barsFor(o, sys); };
    return o;
  }
  /* The answer row for a system: one value per cell key. */
  function barsFor(o, sys){
    var b = { Ki: o.Ki, Kf: o.Kf, W: o.cable };
    Object.keys(o.st).forEach(function(a){
      var s = o.st[a], d = AG[a];
      if(sys[a]){ if(d.pre) b[d.pre] = s[0]; b[d.post] = s[1]; }
      else { if(d.pre) b[d.pre] = 0; b[d.post] = 0; b.W -= s[1] - s[0]; }
    });
    return b;
  }
  /* Spring settings whose stored energy is a whole number (3 to 8) of units. */
  var SPRINGS = (function(){
    var out = [];
    [100, 150, 200, 250, 300, 400, 500, 600, 800].forEach(function(k){
      [0.05, 0.10, 0.15, 0.20, 0.25, 0.30].forEach(function(x){
        [0.25, 0.5, 1, 2].forEach(function(u){ var n = 0.5 * k * x * x / u; if(Math.abs(n - Math.round(n)) < 1e-9 && n >= 3 && n <= 8) out.push({ k: k, x: x, u: u, n: Math.round(n) }); });
      });
    });
    return out;
  })();

  /* The cells of a chart: before (K, U_g, U_s), the work column, after
     (K, U_g, U_s, thermal), only those the situation can have. */
  var CELLS = [
    { key: 'Ki', label: 'K before', sym: 'K', grp: 'i' }, { key: 'Ugi', label: 'Gravitational energy before', sym: 'U_g', grp: 'i', ag: 'earth' }, { key: 'Usi', label: 'Spring energy before', sym: 'U_s', grp: 'i', ag: 'spring' },
    { key: 'W', label: 'Work done on the system', sym: 'W', grp: 'w' },
    { key: 'Kf', label: 'K after', sym: 'K', grp: 'f' }, { key: 'Ugf', label: 'Gravitational energy after', sym: 'U_g', grp: 'f', ag: 'earth' }, { key: 'Usf', label: 'Spring energy after', sym: 'U_s', grp: 'f', ag: 'spring' }, { key: 'Ethf', label: 'Thermal energy after', sym: 'E_th', grp: 'f', ag: 'surface' }
  ];
  function cellsOf(o){ return CELLS.filter(function(c){ return !c.ag || o.st[c.ag]; }); }
  function symHtml(s){ return s.replace(/_(\w+)/, '<sub>$1</sub>'); }
  var SHOW = ['As potential energy bars, inside the system', 'As work in the W column, from outside the system', 'As thermal energy bars, inside the system', 'It does not change the energy here'];

  function genBars(r, ctx, g){
    var o = barSituation(r, g, ctx.situation), A = o.agents.length > 1 && r() < 0.5;
    var subsets = (function(){ var out = [{}]; o.agents.forEach(function(a){ out = out.concat(out.map(function(s){ var t = {}; Object.keys(s).forEach(function(k){ t[k] = true; }); t[a] = true; return t; })); }); return out; })();
    var closed = subsets[subsets.length - 1], sys, choice;
    var names = function(list){ return list.map(function(a){ return agName(a, o); }); };
    var join = function(l){ return l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]; };
    if(A){
      // Pick the system: the one with no work across its boundary.
      sys = closed;
      var opts = subsets.slice(0, 4);
      if(opts.indexOf(closed) < 0) opts[3] = closed;
      var ci = opts.indexOf(closed);
      choice = STEP({ kind: 'choice', key: 'system', practice: '3.B', label: 'Choose the system so that <b>no work crosses its boundary</b>: every energy change shows as a bar inside it.',
        options: opts.map(function(s){ return cap(sysName(o.obj, o.surf, s)); }), correct: ci,
        why: opts.map(function(s, i){
          if(i === ci) return 'Right. Everything that pushes or pulls on the ' + o.obj + ' (' + join(names(o.agents)) + ') is inside, so those forces are internal and W = 0. Each interaction is a bar: ' + o.agents.map(function(a){ return AG[a].store + ' for ' + agName(a, o); }).join(', ') + '.';
          var out = o.agents.filter(function(a){ return !s[a]; });
          return 'With ' + join(names(out)) + ' outside, ' + (out.length > 1 ? 'those forces do' : 'that force does') + ' work across the boundary, so W is not zero' + (out.indexOf('earth') > -1 ? ', and there is no U<sub>g</sub> bar (potential energy needs both objects inside)' : '') + '.';
        }) });
    } else {
      // A given system: how does one agent show on its chart?
      // Never a chart of all zeros (the block alone on a rough floor: gravity's
      // work in, friction's out, nothing left to draw).
      sys = r.pick(subsets.filter(function(s){ var b = o.bars(s); return Object.keys(b).some(function(k){ return k !== 'W' && b[k] !== 0; }); }));
      var pool = o.agents.concat(o.cable ? ['cable'] : []), ag = r.pick(pool);
      var correct = ag === 'cable' ? 1 : sys[ag] ? (ag === 'surface' ? 2 : 0) : 1, nm = ag === 'surface' ? 'the rough ' + o.surf + ' (friction)' : ag === 'earth' ? 'Earth (gravity)' : agName(ag, o);
      choice = STEP({ kind: 'choice', key: 'agent', practice: '3.B', fixed: true, options: SHOW.slice(), correct: correct,
        label: 'The system is ' + sysName(o.obj, o.surf, sys) + '. How does <b>' + nm + '</b> show on its bar charts?',
        why: SHOW.map(function(t, i){
          if(i === correct){
            if(ag === 'cable') return 'Right. The cable is outside the system, so the energy it moves in is work done on the system: a positive W.';
            if(i === 0) return 'Right. ' + cap(nm) + ' is inside the system, so the interaction stores energy as ' + AG[ag].store + ' bars.';
            if(i === 2) return 'Right. Friction between the ' + o.obj + ' and the ' + o.surf + ', both inside, turns kinetic energy into thermal energy of the system: a thermal bar.';
            return 'Right. ' + cap(nm) + ' is outside the system, so its effect is work done on the system, in the W column' + (ag === 'surface' ? ' (negative: friction takes energy out).' : '.');
          }
          if(i === 0) return ag === 'surface' ? 'Friction stores no energy that can come back: there is no potential energy for friction.' : ag === 'cable' ? 'A cable pulling stores no potential energy in the system; it moves energy in from outside.' : 'Potential energy belongs to a system that holds both interacting objects. ' + cap(agName(ag, o)) + ' is outside, so there is no ' + AG[ag].store + ' bar: its effect is work.';
          if(i === 1) return cap(agName(ag, o)) + ' is inside this system, so its force is internal and does no work across the boundary.';
          if(i === 2) return ag === 'surface' ? 'Thermal energy is a bar only when the ' + o.surf + ' is inside the system; here friction is an outside force doing negative work.' : 'Thermal energy comes from friction between surfaces, not from ' + agName(ag, o) + '.';
          return cap(agName(ag, o)) + ' does change the ' + o.obj + '\'s energy here, so it shows on the chart one way or the other.';
        }) });
    }
    var ans = o.bars(sys), cells = cellsOf(o);
    // Each slip the readers report, as the value the student would enter:
    // an agent counted on the wrong side of the boundary, thermal energy
    // forgotten, and W left at 0.
    var cellObjs = cells.map(function(c){
      var a = ans[c.key], ms = [];
      o.agents.forEach(function(ag){
        var flip = {}; Object.keys(sys).forEach(function(k){ flip[k] = sys[k]; }); flip[ag] = !sys[ag];
        var v = o.bars(flip)[c.key];
        if(v === a) return;
        if(c.ag === ag && !sys[ag]) ms.push({ value: v, why: ag === 'earth' ? 'U<sub>g</sub> with the wrong system: gravitational potential energy belongs to the ' + o.obj + '-Earth system. Earth is outside here, so this bar is 0 and gravity\'s work goes in the W column.' : ag === 'spring' ? 'The elastic energy is stored in the spring, which is outside this system: this bar is 0 and the spring\'s push is work in W.' : 'The ' + o.surf + ' is outside the system, so the thermal energy it gets is not a bar here: friction\'s negative work in W takes it out.' });
        else if(c.ag === ag && sys[ag] && ag === 'surface') ms.push({ value: v, why: 'Forgetting thermal energy: friction warms the ' + o.obj + ' and the ' + o.surf + '. With the ' + o.surf + ' inside the system, that energy is a bar of its own, and it makes the totals balance.' });
        else if(c.ag === ag) ms.push({ value: v, why: cap(agName(ag, o)) + ' is inside the system, so its energy is a bar here, not work.' });
        else if(c.key === 'W') ms.push({ value: v, why: sys[ag] ? cap(agName(ag, o)) + ' is inside the system: its force is internal and does no work on the system. Its energy shows as ' + AG[ag].store + ' bars instead.' : cap(agName(ag, o)) + ' is outside the system, so its force does work on it: count it in W' + (ag === 'surface' ? ' (negative).' : '.') });
      });
      if(c.key === 'W' && a !== 0) ms.push({ value: 0, why: 'Something outside the system pushes or pulls on it as it moves, so W is not 0. Before + W must equal the total after.' });
      if(c.key === 'Kf' && o.st.surface && a !== o.Kf + o.st.surface[1]) ms.push({ value: o.Kf + o.st.surface[1], why: 'That is the kinetic energy with no friction. Some energy became thermal energy, so K after is smaller.' });
      return M.cell(a, 0, ms, 0.3);
    });
    var unitStr = fmt(o.u, 3) + ' J', sum = function(grp){ return cells.filter(function(c){ return c.grp === grp; }).reduce(function(s, c){ return s + ans[c.key]; }, 0); };
    var text = '<p>' + o.text + ' Use g = ' + F(g, 1) + ' m/s².</p><p>One unit = <b>' + unitStr + '</b>. "After" means ' + o.after + '.</p>';
    var list = function(grp){ return cells.filter(function(c){ return c.grp === grp; }).map(function(c){ return symHtml(c.sym) + ' = ' + M.minus(String(ans[c.key])); }).join(', '); };
    var sol = [
      (A ? 'With no outside work, the system must hold every agent: ' : 'The system is ') + sysName(o.obj, o.surf, sys) + '. Inside it, Earth gives U<sub>g</sub> bars, a spring U<sub>s</sub>, a rough surface thermal energy; any agent outside does work W instead.',
      'One unit is ' + unitStr + '. ' + o.how,
      'Before: ' + list('i') + '. W = ' + M.minus(String(ans.W)) + '. After: ' + list('f') + '.',
      'Check: ' + sum('i') + ' + (' + M.minus(String(ans.W)) + ') = ' + sum('f') + ' units. Before plus work equals after.'
    ];
    var steps = [choice, STEP({ kind: 'row', key: 'bars', row: 'bars', practice: '1.A', level: 'analyze',
      label: 'Build the before and after bar charts for ' + (A ? 'the system you chose' : 'this system') + ': drag each bar to its height in units, or type it. Work that takes energy out is negative.',
      cells: cellObjs })];
    return { ctx: ctx.id, topic: ctx.topic, type: 'bars', text: text, steps: steps, solution: sol,
      figure: { kind: 'bars', scene: o.fig, cells: cells.map(function(c){ return { key: c.key, label: c.label, sym: c.sym, grp: c.grp }; }), sys: sys, sysName: sysName(o.obj, o.surf, sys), given: !A },
      values: { kind: o.kind, sys: sys, ans: ans, u: o.u, m: o.m, h: o.h, h1: o.h1, h2: o.h2, n: o.n, k: o.k, x: o.x, v: o.v, kf: o.Kf, st: o.st, cable: o.cable, g: g, A: A } };
  }

  function num(o){ var c = M.cell(o.answer, o.rel || 0.02, o.mistakes || []); return STEP({ kind: 'num', key: o.key, label: o.label, unit: o.unit, cell: c, practice: o.practice || '2.B', hint: o.hint }); }

  function genSpeed(r, ctx, g){
    var m = r.pick([40, 45, 50, 55, 60, 65, 70]), h1 = r.between(3.0, 8.0, 2), h2 = M.round(r.between(0.5, h1 - 1.2, 2), 1), dh = h1 - h2; // h2 to 0.1 m, as printed
    var dU = m * g * dh, v = Math.sqrt(2 * g * dh);
    var text = '<p>A ' + m + ' kg skater starts from rest ' + F(h1, 1) + ' m above the ground on a frictionless track and rolls down to a point ' + F(h2, 1) + ' m above the ground. Use g = ' + F(g, 1) + ' m/s².</p>';
    var steps = [
      num({ key: 'dU', label: 'How much gravitational potential energy does the skater-Earth system lose?', unit: 'J', answer: dU, mistakes: [
        { value: m * g * h1, why: 'That is mgh for the whole starting height. Only the drop matters: Δh = ' + F(h1, 1) + ' − ' + F(h2, 1) + ' m.' },
        { value: m * dh, why: 'Missing g: U<sub>g</sub> = mgΔh, in joules.' }] }),
      num({ key: 'v', label: 'How fast is the skater moving at the lower point?', unit: 'm/s', answer: v, mistakes: [
        { value: Math.sqrt(g * dh), why: 'The ½ was dropped on one side: ½mv² = mgΔh gives v = √(2gΔh).' },
        { value: 2 * g * dh, why: 'KE not squared: K = ½mv², so v = √(2gΔh). Take the square root.' },
        { value: Math.sqrt(2 * g * h1), why: 'That is the speed after falling the whole ' + F(h1, 1) + ' m. Use the drop Δh = ' + F(dh, 2) + ' m.' },
        { value: dU / m, why: 'Divide 2ΔU by m and take the square root: v = √(2ΔU/m).' }] }),
      STEP({ kind: 'choice', key: 'mass', practice: '2.D', label: 'If a skater with twice the mass did the same run, the speed at the lower point would be', options: ['the same', 'twice as large', 'half as large', '√2 times as large'], correct: 0,
        why: ['Right. Both U<sub>g</sub> and K are proportional to m, so m cancels: v = √(2gΔh).', 'Mass appears in both mgΔh and ½mv², so it cancels; the speed does not depend on mass.', 'A heavier skater has more U<sub>g</sub> to convert and needs more K for the same speed; the two cancel.', 'm cancels out of mgΔh = ½mv², so there is no √2 from the mass.'] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'speed', text: text, steps: steps,
      figure: { kind: 'scene', scene: { scene: 'skater', h1: h1, h2: h2, m: m, track: 'speed' } },
      solution: ['System: skater, track and Earth, with no friction, so K + U<sub>g</sub> is constant.', 'ΔU<sub>g</sub> = mgΔh = ' + m + ' × ' + F(g, 1) + ' × ' + F(dh, 2) + ' = ' + fmt(dU, 3) + ' J lost.', 'That becomes K: ½mv² = mgΔh, so v = √(2gΔh) = √(2 × ' + F(g, 1) + ' × ' + F(dh, 2) + ') = ' + fmt(v, 3) + ' m/s.', 'The mass cancels, so it does not change the speed.'],
      values: { m: m, h1: h1, h2: h2, g: g } };
  }
  function genHeight(r, ctx, g){
    var m = r.between(0.5, 3.0, 2), v = r.between(2.0, 7.0, 2), ang = r.pick([20, 25, 30, 35, 40]);
    var K = 0.5 * m * v * v, h = v * v / (2 * g), d = h / Math.sin(ang * DEG);
    var text = '<p>A ' + fmt(m, 2) + ' kg block slides at ' + fmt(v, 2) + ' m/s onto a frictionless ramp inclined at ' + ang + '° and coasts up it. Use g = ' + F(g, 1) + ' m/s².</p>';
    var steps = [
      num({ key: 'K', label: 'What is the block\'s kinetic energy at the bottom of the ramp?', unit: 'J', answer: K, mistakes: [
        { value: 0.5 * m * v, why: 'KE not squared: K = ½mv², with the speed squared.' },
        { value: m * v * v, why: 'Missing the ½: K = ½mv².' }] }),
      num({ key: 'h', label: 'How high above the bottom does the block rise before it stops?', unit: 'm', answer: h, mistakes: [
        { value: d, why: 'That is the distance along the ramp. The question asks for the height: h = d sin θ, and energy gives the height directly, h = v²/2g.' },
        { value: v / (2 * g), why: 'KE not squared: ½mv² = mgh gives h = v²/(2g).' },
        { value: v * v / g, why: 'The ½ was lost: h = v²/(2g).' },
        { value: K / m, why: 'Divide K by mg, not by m: h = K/(mg).' }] }),
      num({ key: 'd', label: 'How far along the ramp does it slide?', unit: 'm', answer: d, practice: '2.A', mistakes: [
        { value: h * Math.sin(ang * DEG), why: 'Height and distance along the ramp: h = d sin θ, so d = h / sin θ (d is longer than h).' },
        { value: h / Math.cos(ang * DEG), why: 'Use sin θ: the height is the side opposite the ramp angle, h = d sin θ.' }] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'height', text: text, steps: steps,
      figure: { kind: 'scene', scene: { scene: 'incline', ang: ang, m: m, v: v } },
      solution: ['K = ½mv² = ½ × ' + fmt(m, 2) + ' × ' + fmt(v, 2) + '² = ' + fmt(K, 3) + ' J.', 'System: block, ramp and Earth, no friction: all of K becomes U<sub>g</sub> at the top. ½mv² = mgh, so h = v²/(2g) = ' + fmt(h, 3) + ' m (the mass cancels).', 'Along the ramp: h = d sin θ, so d = h / sin ' + ang + '° = ' + fmt(d, 3) + ' m.'],
      values: { m: m, v: v, ang: ang, g: g } };
  }
  function genSpring(r, ctx, g){
    var k = r.pick([80, 120, 150, 200, 250, 300, 400, 500]), m = r.between(0.4, 2.5, 2), out = r() < 0.5;
    var text, steps, sol, vals;
    if(out){
      var v = r.between(1.0, 4.0, 2), K = 0.5 * m * v * v, x = v * Math.sqrt(m / k);
      text = '<p>A ' + fmt(m, 2) + ' kg block slides at ' + fmt(v, 2) + ' m/s along a frictionless floor into a spring with k = ' + k + ' N/m.</p>';
      steps = [
        num({ key: 'K', label: 'What is the block\'s kinetic energy before it touches the spring?', unit: 'J', answer: K, mistakes: [{ value: 0.5 * m * v, why: 'KE not squared: K = ½mv².' }] }),
        num({ key: 'x', label: 'What is the spring\'s greatest compression?', unit: 'm', answer: x, mistakes: [
          { value: v * Math.sqrt(m / (2 * k)), why: 'A ½ was dropped on the spring side: ½mv² = ½kx², so x = v√(m/k).' },
          { value: v * Math.sqrt(2 * m / k), why: 'A ½ was dropped on the kinetic side: ½mv² = ½kx², so x = v√(m/k).' },
          { value: m * v * v / k, why: 'The compression is squared in U<sub>s</sub> = ½kx²: take the square root at the end.' },
          { value: m * v / k, why: 'Set the energies equal, not mv = kx: ½mv² = ½kx².' }] }),
        STEP({ kind: 'choice', key: 'stiffer', practice: '2.D', label: 'With a spring 4 times as stiff, the greatest compression would be', options: ['half as large', 'a quarter as large', 'the same', 'twice as large'], correct: 0,
          why: ['Right. x = v√(m/k): four times k gives 1/√4 = ½ the compression.', 'x depends on 1/√k, not 1/k: ½kx² is fixed, so x² is a quarter and x is half.', 'The same energy is stored, but a stiffer spring stores it in less compression.', 'A stiffer spring compresses less, not more.'] })
      ];
      sol = ['K = ½mv² = ' + fmt(K, 3) + ' J.', 'System: block and spring, frictionless floor. At the greatest compression the block is at rest, so all K is U<sub>s</sub>: ½mv² = ½kx².', 'x = v√(m/k) = ' + fmt(v, 2) + ' × √(' + fmt(m, 2) + '/' + k + ') = ' + fmt(x, 3) + ' m.', 'x ∝ 1/√k: 4k gives half the compression.'];
      vals = { m: m, v: v, k: k, out: true };
    } else {
      var xc = r.int(5, 30) / 100, U = 0.5 * k * xc * xc, v2 = xc * Math.sqrt(k / m);
      text = '<p>A spring (k = ' + k + ' N/m) is compressed ' + F(xc * 100, 0) + ' cm and launches a ' + fmt(m, 2) + ' kg block from rest along a frictionless floor.</p>';
      steps = [
        num({ key: 'U', label: 'How much elastic potential energy does the compressed spring store?', unit: 'J', answer: U, mistakes: [
          { value: 0.5 * k * xc * 100 * xc * 100, why: 'Convert centimeters to meters first: x = ' + F(xc, 2) + ' m.' },
          { value: 0.5 * k * xc, why: 'The compression is squared: U<sub>s</sub> = ½kx².' },
          { value: k * xc * xc, why: 'Missing the ½: U<sub>s</sub> = ½kx².' }] }),
        num({ key: 'v', label: 'How fast does the block move after it leaves the spring?', unit: 'm/s', answer: v2, mistakes: [
          { value: U / m, why: 'KE not squared: ½mv² = U<sub>s</sub>, so v = √(2U<sub>s</sub>/m).' },
          { value: Math.sqrt(U / m), why: 'The ½ in K was lost: v = √(2U<sub>s</sub>/m).' }] })
      ];
      sol = ['U<sub>s</sub> = ½kx² = ½ × ' + k + ' × ' + F(xc, 2) + '² = ' + fmt(U, 3) + ' J (x in meters).', 'System: block and spring, frictionless floor: U<sub>s</sub> becomes K. ½mv² = ½kx², so v = x√(k/m) = ' + fmt(v2, 3) + ' m/s.'];
      vals = { m: m, k: k, x: xc, out: false };
    }
    return { ctx: ctx.id, topic: ctx.topic, type: 'spring', text: text, steps: steps, solution: sol, values: vals,
      figure: { kind: 'scene', scene: { scene: 'launcher', k: k, m: m, x: vals.x || null } } };
  }
  function genFriction(r, ctx, g){
    var m = r.between(0.5, 4.0, 2), text, steps, sol, vals, fig;
    if(r() < 0.5){
      var h = r.between(0.8, 3.0, 2), vi = Math.sqrt(2 * g * h), v = r.between(0.45 * vi, 0.85 * vi, 2);
      var U = m * g * h, K = 0.5 * m * v * v, W = K - U;
      text = '<p>A ' + fmt(m, 2) + ' kg block starts from rest at the top of a rough ramp ' + F(h, 2) + ' m high and reaches the bottom at ' + fmt(v, 2) + ' m/s. Use g = ' + F(g, 1) + ' m/s².</p>';
      steps = [
        num({ key: 'U', label: 'How much gravitational potential energy does the block-Earth system lose?', unit: 'J', answer: U, mistakes: [{ value: m * h, why: 'Missing g: ΔU<sub>g</sub> = mgh.' }] }),
        num({ key: 'K', label: 'What is the block\'s kinetic energy at the bottom?', unit: 'J', answer: K, mistakes: [{ value: 0.5 * m * v, why: 'KE not squared: K = ½mv².' }, { value: U, why: 'That would be K with no friction. Use the speed given: K = ½mv².' }] }),
        num({ key: 'W', label: 'How much work does friction do on the block? (Give the sign.)', unit: 'J', answer: W, practice: '2.A', mistakes: [
          { value: -U, why: 'Friction did not take all the energy: the block still moves at the bottom. W<sub>f</sub> = K − ΔU<sub>g</sub> lost.' },
          { value: -K, why: 'W<sub>f</sub> is the energy missing from K: W<sub>f</sub> = K<sub>bottom</sub> − mgh.' }] })
      ];
      sol = ['ΔU<sub>g</sub> = mgh = ' + fmt(U, 3) + ' J lost by the block-Earth system.', 'K = ½mv² = ' + fmt(K, 3) + ' J at the bottom.', 'For the block-Earth system, friction from the ramp (outside) does work: K<sub>bottom</sub> = mgh + W<sub>f</sub>, so W<sub>f</sub> = ' + fmt(K, 3) + ' − ' + fmt(U, 3) + ' = ' + fmt(W, 3) + ' J.', 'Negative work: energy leaves the system as thermal energy of the ramp and block.'];
      vals = { m: m, h: h, v: v, mode: 'ramp' }; fig = { scene: 'ramp', h: h, m: m, rough: 'ramp' };
    } else {
      var v0 = r.between(1.5, 6.0, 2), mu = r.pick([0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50]);
      var K0 = 0.5 * m * v0 * v0, d = v0 * v0 / (2 * mu * g);
      text = '<p>A ' + fmt(m, 2) + ' kg block slides at ' + fmt(v0, 2) + ' m/s onto a rough, level floor (μ<sub>k</sub> = ' + F(mu, 2) + ') and slides to a stop. Use g = ' + F(g, 1) + ' m/s².</p>';
      steps = [
        num({ key: 'W', label: 'How much work does friction do on the block while it stops? (Give the sign.)', unit: 'J', answer: -K0, practice: '2.A', mistakes: [{ value: -0.5 * m * v0, why: 'KE not squared: K = ½mv².' }] }),
        num({ key: 'd', label: 'How far does the block slide?', unit: 'm', answer: d, mistakes: [
          { value: v0 * v0 / (mu * g), why: 'The ½ was lost: μmgd = ½mv², so d = v²/(2μg).' },
          { value: v0 / (2 * mu * g), why: 'KE not squared: d = v²/(2μg).' },
          { value: K0 / mu, why: 'The friction force is μmg, not μ: d = K/(μmg).' }] }),
        STEP({ kind: 'choice', key: 'double', practice: '2.D', label: 'If the block started twice as fast, it would slide', options: ['4 times as far', '2 times as far', 'the same distance', '√2 times as far'], correct: 0,
          why: ['Right. d = v²/(2μg): twice the speed is four times the kinetic energy, so four times the distance.', 'K grows as v², so doubling v quadruples K and the stopping distance.', 'Faster means more kinetic energy for friction to remove, so a longer slide.', 'd ∝ v², not √v: doubling v gives 4d.'] })
      ];
      sol = ['K = ½mv² = ' + fmt(K0, 3) + ' J. Friction removes all of it, so W<sub>f</sub> = −' + fmt(K0, 3) + ' J (negative: opposite to the motion).', 'W<sub>f</sub> = −μ<sub>k</sub>mgd, so d = ½mv²/(μ<sub>k</sub>mg) = v²/(2μ<sub>k</sub>g) = ' + fmt(d, 3) + ' m.', 'd ∝ v²: twice the speed, four times the distance.'];
      vals = { m: m, v: v0, mu: mu, mode: 'floor' }; fig = { scene: 'floor', m: m, v: v0, mu: mu };
    }
    return { ctx: ctx.id, topic: ctx.topic, type: 'friction', text: text, steps: steps, solution: sol, values: vals, figure: { kind: 'scene', scene: fig } };
  }
  function genWork(r, ctx, g){
    var Fm = r.between(10, 60, 2), d = r.between(1.5, 8.0, 2), ang = r.pick([0, 20, 25, 30, 35, 40, 45, 50, 60]), m = r.between(2.0, 12, 2);
    var W = Fm * d * Math.cos(ang * DEG), v = Math.sqrt(2 * W / m);
    var text = '<p>A rope pulls a ' + fmt(m, 2) + ' kg crate from rest across a frictionless floor with a constant ' + fmt(Fm, 2) + ' N force at ' + ang + '° above the horizontal. The crate moves ' + fmt(d, 2) + ' m.</p>';
    var ms = [{ value: Fm * d, why: 'Only the part of the force along the displacement does work: W = Fd cos θ.' }];
    if(ang) ms.push({ value: Fm * d * Math.sin(ang * DEG), why: 'Wrong trig: the component along the floor is F cos θ, so W = Fd cos θ.' });
    var steps = [
      num({ key: 'W', label: 'How much work does the rope do on the crate?', unit: 'J', answer: W, mistakes: ms }),
      num({ key: 'v', label: 'How fast is the crate moving at the end?', unit: 'm/s', answer: v, mistakes: [
        { value: W / m, why: 'KE not squared: W = ½mv², so v = √(2W/m).' },
        { value: Math.sqrt(W / m), why: 'The ½ in K was lost: v = √(2W/m).' }] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'work', text: text, steps: steps, values: { F: Fm, d: d, ang: ang, m: m },
      figure: { kind: 'scene', scene: { scene: 'pull', ang: ang, F: Fm, m: m } },
      solution: ['W = Fd cos θ = ' + fmt(Fm, 2) + ' × ' + fmt(d, 2) + ' × cos ' + ang + '° = ' + fmt(W, 3) + ' J.', 'Work-energy theorem: the rope is the only force doing work (gravity and the normal force are perpendicular to the motion), so ΔK = W.', '½mv² = W, so v = √(2W/m) = ' + fmt(v, 3) + ' m/s.'] };
  }
  function genPower(r, ctx, g){
    var m = r.pick([20, 25, 30, 40, 50, 60, 75, 80, 100, 120]), h = r.between(2.0, 15, 2), t = r.between(3.0, 20, 2);
    var W = m * g * h, P = W / t, v = h / t;
    var text = '<p>A motor lifts a ' + m + ' kg box ' + fmt(h, 2) + ' m at a constant speed in ' + fmt(t, 2) + ' s. Use g = ' + F(g, 1) + ' m/s².</p>';
    var steps = [
      num({ key: 'W', label: 'How much work does the motor\'s cable do on the box?', unit: 'J', answer: W, mistakes: [{ value: m * h, why: 'Missing g: at constant speed the cable pulls with mg, so W = mgh.' }] }),
      num({ key: 'P', label: 'What is the motor\'s average power output?', unit: 'W', answer: P, mistakes: [
        { value: m * h / t, why: 'Missing g: P = mgh/t.' },
        { value: W * t, why: 'Power is energy per time: divide by the time, P = W/Δt.' }] }),
      num({ key: 'P2', label: 'Check with P = Fv: what is the box\'s speed?', unit: 'm/s', answer: v, practice: '2.A', mistakes: [{ value: t / h, why: 'Speed is distance over time: v = h/t.' }] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'power', text: text, steps: steps, values: { m: m, h: h, t: t, g: g },
      figure: { kind: 'scene', scene: { scene: 'lift', h: h, m: m } },
      solution: ['At constant speed the tension equals the weight, mg = ' + fmt(m * g, 3) + ' N, so W = mgh = ' + fmt(W, 3) + ' J.', 'Average power = energy transferred per time: P = W/Δt = ' + fmt(W, 3) + ' J / ' + fmt(t, 2) + ' s = ' + fmt(P, 3) + ' W.', 'v = h/t = ' + fmt(v, 3) + ' m/s, and Fv = mg × v = ' + fmt(m * g * v, 3) + ' W: the same power.'] };
  }
  function genKE(r, ctx, g){
    var m = r.pick([800, 900, 1000, 1200, 1500, 1800]), v1 = r.between(5, 15, 2), v2 = r.between(v1 + 3, 30, 2);
    var K1 = 0.5 * m * v1 * v1, dK = 0.5 * m * (v2 * v2 - v1 * v1);
    var text = '<p>A ' + m + ' kg car speeds up from ' + fmt(v1, 2) + ' m/s to ' + fmt(v2, 2) + ' m/s.</p>';
    var steps = [
      num({ key: 'K1', label: 'What is the car\'s kinetic energy at ' + fmt(v1, 2) + ' m/s?', unit: 'J', answer: K1, mistakes: [{ value: 0.5 * m * v1, why: 'KE not squared: K = ½mv².' }, { value: m * v1, why: 'That is momentum (kg·m/s), not kinetic energy: K = ½mv².' }] }),
      num({ key: 'dK', label: 'By how much does its kinetic energy increase?', unit: 'J', answer: dK, mistakes: [
        { value: 0.5 * m * Math.pow(v2 - v1, 2), why: 'ΔK is not ½m(Δv)²: find each K, then subtract, ½m(v₂² − v₁²).' },
        { value: 0.5 * m * (v2 - v1), why: 'KE not squared, and ΔK needs both speeds squared: ½m(v₂² − v₁²).' }] }),
      num({ key: 'W', label: 'How much net work is done on the car?', unit: 'J', answer: dK, practice: '3.B', mistakes: [{ value: 0.5 * m * v2 * v2, why: 'The net work equals the change in K (work-energy theorem), not the final K.' }] })
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'ke', text: text, steps: steps, values: { m: m, v1: v1, v2: v2 },
      figure: { kind: 'scene', scene: { scene: 'car', v1: v1, v2: v2, m: m } },
      solution: ['K = ½mv² = ½ × ' + m + ' × ' + fmt(v1, 2) + '² = ' + fmt(K1, 3) + ' J.', 'ΔK = ½m(v₂² − v₁²) = ' + fmt(dK, 3) + ' J. Not ½m(Δv)², which gives ' + fmt(0.5 * m * Math.pow(v2 - v1, 2), 3) + ' J.', 'Work-energy theorem: W<sub>net</sub> = ΔK = ' + fmt(dK, 3) + ' J.'] };
  }

  var GEN = { bars: genBars, speed: genSpeed, height: genHeight, spring: genSpring, friction: genFriction, work: genWork, power: genPower, ke: genKE };
  var TYPES = ['bars', 'speed', 'height', 'spring', 'friction', 'work', 'power', 'ke'];
  M.register('energyBarCharts', {
    TRACKS: TRACKS, SCENES: SCENES, LAUNCH: LAUNCH, TYPES: TYPES, CELLS: CELLS, SPRINGS: SPRINGS,
    path: path, at: at, nearest: nearest, sim: sim, ledger: ledger, barSituation: barSituation, sysName: sysName,
    generate: function(r, ctx, type){
      var g = M.g(ctx), list = (ctx.types || TYPES).filter(function(t){ return GEN[t]; });
      var t = type && list.indexOf(type) > -1 ? type : r.pick(list);
      return GEN[t](r, ctx, g);
    }
  });
})();
