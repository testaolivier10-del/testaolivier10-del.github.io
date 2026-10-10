/* AP® Chemistry tool math: window.ApChemMath. Pure functions, no DOM, so the
   validators (scripts/lib/apchem-tool-checks/_shared.mjs) recompute every
   authored number with the same code students run (as ApBioMath does for
   AP® Biology; docs/apchem-architecture.md, "Tools").

   Constants are the equations and constants sheet's values (2024 edition),
   so a seeded drill and the exam agree to the digit:
     R = 8.314 J/(mol·K) = 0.08206 L·atm/(mol·K), F = 96,485 C/mol e⁻,
     h = 6.626 × 10⁻³⁴ J·s, c = 2.998 × 10⁸ m/s, NA = 6.022 × 10²³ mol⁻¹,
     Kw = 1.0 × 10⁻¹⁴ at 25 °C, K = °C + 273.15.

   Phase 0 holds the shared pieces the trainers and drills will need; each
   drill adds its own model here, with tests, when it is built. */
(function(){
  var C = {
    R_J: 8.314, R_LATM: 0.08206, F: 96485, h: 6.626e-34, c: 2.998e8, NA: 6.022e23, Kw: 1.0e-14, T0: 273.15
  };

  /* Rounding. round(x, d) to d decimals; fixed() as a string; sig(x, n) to n
     significant figures (the number, not a string). */
  function round(x, d){ var k = Math.pow(10, d || 0); return Math.round((x + (x >= 0 ? 1e-12 : -1e-12)) * k) / k; }
  function fixed(x, d){ var r = round(x, d); if(Object.is(r, -0) || r === 0) r = 0; return r.toFixed(d); }
  function sig(x, n){ if(!x) return 0; return Number(Number(x).toPrecision(n)); }

  /* A seeded random source (mulberry32), so a drill's numbers come back the
     same for the same seed: rng(seed)() in [0, 1); .int(a, b); .pick(list). */
  function rng(seed){
    var s = (seed >>> 0) || 1;
    function next(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    next.int = function(a, b){ return a + Math.floor(next() * (b - a + 1)); };
    next.pick = function(a){ return a[Math.floor(next() * a.length)]; };
    return next;
  }

  /* Acids and bases at 25 °C. */
  function pH(h){ return -Math.log10(h); }
  function hFromPH(p){ return Math.pow(10, -p); }
  /* A weak acid HA at concentration c with Ka: [H3O+] solved exactly from
     x² / (c − x) = Ka (no small-x approximation), and the approximation for
     comparison. */
  function weakAcid(c, Ka){
    var x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
    return { h: x, pH: pH(x), approx: Math.sqrt(Ka * c), percent: 100 * x / c };
  }
  /* Henderson-Hasselbalch: pH = pKa + log([A−]/[HA]) (base-10 log). */
  function hh(pKa, base, acid){ return pKa + Math.log10(base / acid); }

  /* Free energy, equilibrium and cell potential (consistent units: J, K). */
  function dG(dH_kJ, T, dS_J){ return dH_kJ - T * dS_J / 1000; }           // kJ/mol
  function KfromDG(dG_kJ, T){ return Math.exp(-dG_kJ * 1000 / (C.R_J * T)); }
  function dGfromE(n, E){ return -n * C.F * E / 1000; }                      // kJ/mol

  var base = {
    C: C, round: round, fixed: fixed, sig: sig, rng: rng,
    pH: pH, hFromPH: hFromPH, weakAcid: weakAcid, hh: hh,
    dG: dG, KfromDG: KfromDG, dGfromE: dGfromE
  };
  // The drills' models and seeded generators (below) extend this object.
  window.ApChemMath = base;
})();


/* ===================================================================
   Drill models and seeded generators (Units 3, 4, 7, 8 and the math
   chapter): ICE tables, Q vs K, buffers, titration curves, particle
   pictures, units and significant figures. Pure: no DOM, strings only, so
   the validators (scripts/lib/apchem-tool-checks/<slug>.mjs) and the node
   tests run exactly this code. Every generator takes a seeded rng
   (ApChemMath.rng) and a context from the tool's data file and returns a
   problem whose every number was computed here.

   A numeric answer is a "cell": { answer, rel, abs?, mistakes: [{ value,
   why }] }. diagnose(cell, x) says whether x is right and, when x matches a
   known slip, which one. A mistake that would be accepted as the answer is
   dropped when the cell is made, so feedback never contradicts the grade. */
(function(){
  'use strict';
  var M = window.ApChemMath;
  var SUPD = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sup(n){ return String(n).replace(/[0-9-]/g, function(c){ return SUPD[c]; }); }
  function minus(s){ return String(s).replace(/^-/, '−'); }
  function F(x, d){ return minus(M.fixed(x, d)); }
  /* x to n significant figures: plain from 0.001 to 9999, else a × 10ⁿ. */
  function fmt(x, n){
    n = n || 3;
    if(!isFinite(x)) return String(x);
    if(x === 0) return '0';
    var v = M.sig(x, n), e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    if(e < -3 || e >= 4 || e >= n){
      var c = v / Math.pow(10, e);
      return minus(c.toFixed(n - 1)) + ' × 10' + sup(e);
    }
    return minus(v.toFixed(Math.max(0, n - 1 - e)));
  }
  function between(r, a, b, n){ return M.sig(a + r() * (b - a), n || 3); }
  function logBetween(r, a, b, n){ return M.sig(Math.pow(10, a + r() * (b - a)), n || 2); }
  function near(x, a, rel, abs){ return Math.abs(x - a) <= (rel || 0) * Math.abs(a) + (abs || 0) + 1e-12 * Math.abs(a) + 1e-300; }
  function cell(answer, rel, mistakes, abs){
    var seen = [];
    var ms = (mistakes || []).filter(function(m){
      if(!isFinite(m.value) || near(m.value, answer, 2.5 * rel, 2.5 * (abs || 0))) return false;
      if(seen.some(function(v){ return near(m.value, v, 2 * rel, 2 * (abs || 0)); })) return false;
      seen.push(m.value); return true;
    });
    var c = { answer: answer, rel: rel, mistakes: ms };
    if(abs) c.abs = abs;
    return c;
  }
  function diagnose(c, x){
    if(typeof x !== 'number' || !isFinite(x)) return { ok: false, blank: true };
    if(near(x, c.answer, c.rel, c.abs)) return { ok: true };
    for(var i = 0; i < c.mistakes.length; i++) if(near(x, c.mistakes[i].value, c.rel, c.abs)) return { ok: false, why: c.mistakes[i].why };
    if(c.answer && near(-x, c.answer, c.rel, c.abs)) return { ok: false, why: 'The size is right but the sign is wrong.' };
    if(c.answer && (near(x / 1000, c.answer, c.rel, c.abs) || near(x * 1000, c.answer, c.rel, c.abs))) return { ok: false, why: 'Off by a factor of 1000: check a kilo or milli conversion.' };
    return { ok: false };
  }
  function shuffleWith(r, a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function list(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* --------------------------------------------- equilibrium core */
  /* A reaction is a list of species { html, nu, phase? }: nu < 0 for a
     reactant, > 0 for a product. Solids and liquids are left out of Q and K. */
  function inQ(s){ return s.phase !== 's' && s.phase !== 'l'; }
  function Q(sp, c){ var q = 1; sp.forEach(function(s, i){ if(inQ(s)) q *= Math.pow(c[i], s.nu); }); return q; }
  function Qflat(sp, c){ var q = 1; sp.forEach(function(s, i){ if(inQ(s)) q *= Math.pow(c[i], s.nu > 0 ? 1 : -1); }); return q; }
  function at(sp, c0, x){ return sp.map(function(s, i){ return c0[i] + s.nu * x; }); }
  /* The exact extent x where Q = K: bisection on ln Q, which rises with x. */
  function solveExtent(sp, c0, K){
    var lo = -Infinity, hi = Infinity, lk = Math.log(K);
    sp.forEach(function(s, i){ if(!inQ(s)) return; if(s.nu < 0) hi = Math.min(hi, c0[i] / -s.nu); else lo = Math.max(lo, -c0[i] / s.nu); });
    for(var i = 0; i < 400; i++){
      var mid = (lo + hi) / 2, c = at(sp, c0, mid), lq = 0, inf = 0;
      sp.forEach(function(s, j){ if(!inQ(s)) return; if(c[j] <= 0) inf += s.nu < 0 ? 1 : -1; else lq += s.nu * Math.log(c[j]); });
      if(inf > 0 || (inf === 0 && lq > lk)) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  }
  /* Small-x: products start at zero and x is dropped next to every
     reactant's initial amount. noCoef is the slip of writing x for a product
     formed with coefficient 2 (x², not (2x)²). */
  function smallX(sp, c0, K, noCoef){
    var pow = 0, rhs = K;
    sp.forEach(function(s, i){
      if(!inQ(s)) return;
      if(s.nu < 0) rhs *= Math.pow(c0[i], -s.nu);
      else { pow += s.nu; if(!noCoef) rhs /= Math.pow(s.nu, s.nu); }
    });
    return Math.pow(rhs, 1 / pow);
  }
  function eqHtml(sp){
    var side = function(sg){ return sp.filter(function(s){ return sg * s.nu > 0; }).map(function(s){ var n = Math.abs(s.nu); return (n > 1 ? n + ' ' : '') + s.html + (s.phase ? '(' + s.phase + ')' : ''); }).join(' + '); };
    return side(-1) + ' ⇌ ' + side(1);
  }
  function exprHtml(sp, Kp){
    var term = function(s){ var n = Math.abs(s.nu); return (Kp ? 'P<sub>' + s.html + '</sub>' : '[' + s.html + ']') + (n > 1 ? '<sup>' + n + '</sup>' : ''); };
    var top = sp.filter(function(s){ return s.nu > 0 && inQ(s); }), bot = sp.filter(function(s){ return s.nu < 0 && inQ(s); });
    var t = top.map(term).join(''), b = bot.map(term).join('');
    return (t || '1') + (b ? ' / ' + (bot.length > 1 ? '(' + b + ')' : b) : '');
  }

  /* ------------------------------------------------ 1. ICE tables */
  /* ctx: { id, K: 'Kc'|'Kp', species, types: ['findK'|'smallx'|'square'],
     c0: [lo, hi] (M or atm), moles?: true (Kc: give moles and a volume),
     withProduct?: true (findK: a product may start above zero),
     Ksmall: [log lo, log hi] (smallx), Kfail?: [log lo, log hi] (smallx where
     the 5% check fails; the exact equation must be a quadratic),
     Ksq: [log lo, log hi] (square: A + B ⇌ products with K a perfect square) } */
  var ICE_TOPIC = { findK: 'calculating-k', smallx: 'equilibrium-concentrations', square: 'equilibrium-concentrations' };
  var VOLS = [1.00, 2.00, 0.500, 5.00, 4.00];
  function iceGenerate(r, ctx, type){
    type = type && ctx.types.indexOf(type) > -1 ? type : r.pick(ctx.types);
    for(var tries = 0; tries < 200; tries++){ var p = iceTry(r, ctx, type); if(p) return p; }
    throw new Error('ice: no problem for ' + ctx.id + ' ' + type);
  }
  function iceTry(r, ctx, type){
    var sp = ctx.species, Kp = ctx.K === 'Kp', u = Kp ? 'atm' : 'M';
    var c0 = sp.map(function(){ return 0; }), mol = null, V = null, reac = [], prod = [];
    sp.forEach(function(s, i){ (s.nu < 0 ? reac : prod).push(i); });
    var lo = ctx.c0[0], hi = ctx.c0[1];
    if(type === 'square'){ var cs = between(r, lo, hi, 3); reac.forEach(function(i){ c0[i] = cs; }); }
    else reac.forEach(function(i){ c0[i] = between(r, lo, hi, 3); });
    var useMol = !Kp && ctx.moles && type !== 'square' && r() < 0.6;
    if(useMol){ V = r.pick(VOLS); mol = c0.map(function(c){ return M.sig(c * V, 3); }); c0 = mol.map(function(m){ return m / V; }); }
    if(type === 'findK' && ctx.withProduct && r() < 0.35){
      var jp = r.pick(prod); c0[jp] = between(r, lo / 4, hi / 3, 3);
      if(mol){ mol[jp] = M.sig(c0[jp] * V, 3); c0[jp] = mol[jp] / V; }
    }
    var x, K, meas = null, mj = null, pct = null, ok = null, xa = null, xEx = null, fail = false;
    if(type === 'findK'){
      var xmax = Math.min.apply(null, reac.map(function(i){ return c0[i] / -sp[i].nu; }));
      x = (0.15 + 0.5 * r()) * xmax;
      mj = r.pick(prod);
      meas = M.sig(c0[mj] + sp[mj].nu * x, 3);
      x = (meas - c0[mj]) / sp[mj].nu;
      if(!(x > 0)) return null;
      K = Q(sp, at(sp, c0, x));
    } else if(type === 'smallx'){
      fail = !!(ctx.Kfail && r() < 0.3);
      var kr = fail ? ctx.Kfail : ctx.Ksmall;
      K = logBetween(r, kr[0], kr[1], 2);
      xa = smallX(sp, c0, K);
      pct = Math.max.apply(null, reac.map(function(i){ return 100 * -sp[i].nu * xa / c0[i]; }));
      ok = pct <= 5;
      if(fail ? (pct < 7 || pct > 45) : pct > 4.6) return null;
      xEx = solveExtent(sp, c0, K);
      x = ok ? xa : xEx;
    } else {
      K = logBetween(r, ctx.Ksq[0], ctx.Ksq[1], 3);
      var P = 1; prod.forEach(function(i){ P *= Math.pow(sp[i].nu, sp[i].nu); });
      x = c0[reac[0]] * Math.sqrt(K) / (Math.sqrt(P) + Math.sqrt(K));
      xEx = solveExtent(sp, c0, K);
      if(Math.abs(x - xEx) > 1e-9 * c0[reac[0]]) return null;
    }
    var E = at(sp, c0, x);
    // Every reactant keeps at least 8% of its start, so rounding to three
    // figures cannot move K by more than the tolerance.
    if(reac.some(function(i){ return E[i] < 0.08 * c0[i]; })) return null;
    if(prod.some(function(i){ return E[i] <= 0; })) return null;
    return iceBuild({ type: type, ctx: ctx, sp: sp, c0: c0, mol: mol, V: V, x: x, K: K, E: E, meas: meas, mj: mj, pct: pct, ok: ok, xa: xa, xEx: xEx, Kp: Kp, u: u, reac: reac, prod: prod });
  }
  function iceBuild(o){
    var sp = o.sp, Kname = o.Kp ? 'K<sub>p</sub>' : 'K<sub>c</sub>', u = o.u, R = 0.02;
    var name = function(i){ return o.Kp ? 'P<sub>' + sp[i].html + '</sub>' : '[' + sp[i].html + ']'; };
    var start = sp.map(function(s, i){
      if(o.mol) return o.mol[i] ? fmt(o.mol[i], 3) + ' mol ' + s.html : null;
      return o.c0[i] ? (o.Kp ? s.html + ' at ' + fmt(o.c0[i], 3) + ' atm' : fmt(o.c0[i], 3) + ' M ' + s.html) : null;
    }).filter(Boolean);
    var vessel = o.mol ? 'a ' + fmt(o.V, 3) + ' L flask' : o.Kp ? 'a rigid vessel' : 'a sealed flask';
    var text = '<p class="bt-eq">' + eqHtml(sp) + '</p><p>A mixture of ' + list(start) + ' is placed in ' + vessel + ' at constant temperature. ';
    text += o.type === 'findK' ? 'At equilibrium, ' + name(o.mj) + ' = ' + fmt(o.meas, 3) + ' ' + u + '. Find ' + Kname + '.</p>'
      : Kname + ' = ' + fmt(o.K, o.type === 'square' ? 3 : 2) + ' at this temperature. Find the equilibrium ' + (o.Kp ? 'partial pressures' : 'concentrations') + '.</p>';
    var I = sp.map(function(s, i){
      var ms = [];
      if(o.mol && o.mol[i]) ms.push({ value: o.mol[i], why: 'That is the amount in moles. An ICE table for K<sub>c</sub> needs concentrations: ' + fmt(o.mol[i], 3) + ' mol ÷ ' + fmt(o.V, 3) + ' L.' });
      return o.c0[i] ? cell(o.c0[i], R, ms) : cell(0, 0, [], 1e-9);
    });
    var C = sp.map(function(s){
      var ms = [{ value: -s.nu, why: 'Wrong sign. The reaction runs forward here (Q < K at the start), so reactants are used up (−) and products form (+).' }];
      if(Math.abs(s.nu) !== 1) ms.push({ value: s.nu > 0 ? 1 : -1, why: 'The change follows the coefficients: ' + Math.abs(s.nu) + ' ' + s.html + ' ' + (s.nu > 0 ? 'form' : 'react') + ' for every x, so the change is ' + (s.nu > 0 ? '+' : '−') + Math.abs(s.nu) + 'x.' });
      return cell(s.nu, 0, ms, 1e-9);
    });
    var xm = [];
    if(o.type === 'findK'){
      if(Math.abs(sp[o.mj].nu) !== 1) xm.push({ value: o.meas - o.c0[o.mj], why: 'That is the change in ' + name(o.mj) + ', which is +' + sp[o.mj].nu + 'x. Divide by ' + sp[o.mj].nu + ' to get x.' });
      if(o.c0[o.mj]) xm.push({ value: o.meas / sp[o.mj].nu, why: name(o.mj) + ' did not start at 0: subtract its initial ' + fmt(o.c0[o.mj], 3) + ' ' + u + ' first.' });
    }
    if(o.type === 'smallx' && !o.ok) xm.push({ value: o.xa, why: 'That is the small-x value, but the 5% check fails, so it is not accurate enough. Solve the full equation with the quadratic formula.' });
    if(o.type === 'square'){
      var P = 1; o.prod.forEach(function(i){ P *= Math.pow(sp[i].nu, sp[i].nu); });
      xm.push({ value: o.c0[o.reac[0]] * Math.sqrt(o.K / P), why: 'K is not small here, so x cannot be dropped next to the initial amount. Keep (initial − x) and take the square root of both sides.' });
      xm.push({ value: o.c0[o.reac[0]] * o.K / (Math.sqrt(P) + o.K), why: 'Take the square root of K too: √K equals the square root of the right side.' });
    }
    var noCoef = { value: smallX(sp, o.c0, o.K, true), why: 'Each product term is (coefficient × x), and the whole term is raised to the coefficient: (2x)², not x².' };
    var X = cell(o.x, R, o.type === 'smallx' && o.ok ? xm.concat([noCoef]) : xm);
    var E = sp.map(function(s, i){
      var ms = [{ value: o.c0[i] - s.nu * o.x, why: 'Equilibrium = initial + change. Check the sign of the change for ' + s.html + '.' }];
      if(Math.abs(s.nu) !== 1) ms.push({ value: o.c0[i] + (s.nu > 0 ? 1 : -1) * o.x, why: 'The change for ' + s.html + ' is ' + (s.nu > 0 ? '+' : '−') + Math.abs(s.nu) + 'x, not ' + (s.nu > 0 ? '+' : '−') + 'x.' });
      if(o.c0[i]) ms.push({ value: o.c0[i], why: 'That is the initial amount. Add the change row.' });
      return cell(o.E[i], R, ms);
    });
    var steps = [
      { key: 'I', kind: 'row', row: 'I', label: 'Initial row (I)', hint: (o.mol ? 'Concentrations in mol/L (moles ÷ liters).' : 'In ' + u + '.') + ' A species not added starts at 0.', cells: I, practice: '5.F' },
      { key: 'C', kind: 'coef', row: 'C', label: 'Change row (C)', hint: 'Write each change in terms of x: −x, +2x and so on.', cells: C, practice: '5.F' }
    ];
    var Erow = { key: 'E', kind: 'row', row: 'E', label: 'Equilibrium row (E)', hint: 'Initial + change, with the value of x.', cells: E, practice: '5.F' };
    if(o.type === 'findK'){
      steps.push({ key: 'x', kind: 'num', label: 'Find x from the measured ' + name(o.mj), hint: fmt(o.c0[o.mj], 3) + ' + ' + sp[o.mj].nu + 'x = ' + fmt(o.meas, 3), cell: X, unit: u, practice: '5.F' });
      steps.push(Erow);
      var Km = [
        { value: 1 / o.K, why: 'That is the expression upside down: products go on top, reactants on the bottom.' },
        { value: Qflat(sp, o.E), why: 'Raise each concentration to its coefficient in the balanced equation.' }
      ];
      if(o.c0.every(function(c){ return c > 0; })) Km.push({ value: Q(sp, o.c0), why: 'K uses the equilibrium row, not the initial row.' });
      steps.push({ key: 'K', kind: 'num', label: 'Calculate ' + Kname + ' = ' + exprHtml(sp, o.Kp), cell: cell(o.K, 0.04, Km), unit: '', practice: '5.F' });
    } else if(o.type === 'smallx'){
      steps.push({ key: 'xa', kind: 'num', label: 'Solve for x, assuming x is small next to each initial amount', hint: Kname + ' = ' + exprHtml(sp, o.Kp) + ', with the E row in terms of x.', cell: cell(o.xa, R, [noCoef]), unit: u, practice: '5.F' });
      steps.push({ key: 'pct', kind: 'num', label: 'The 5% check: the change in the reactant as a percent of its initial amount', hint: '(change ÷ initial) × 100, for the reactant with the largest percent.', cell: cell(o.pct, 0.05, [], 0.3), unit: '%', practice: '5.F' });
      steps.push({ key: 'okay', kind: 'choice', label: 'Does the approximation hold?', options: ['Yes: under 5%, keep the small-x value', 'No: over 5%, solve exactly'], correct: o.ok ? 0 : 1, fixed: true, practice: '6.D',
        why: ['The change is ' + F(o.pct, 1) + '% of the initial amount.', 'The change is ' + F(o.pct, 1) + '% of the initial amount.'] });
      if(!o.ok) steps.push({ key: 'x', kind: 'num', label: 'Solve exactly (quadratic formula) for x', hint: 'Keep x next to the initial amount; take the root that keeps every concentration positive.', cell: X, unit: u, practice: '5.F' });
      steps.push(Erow);
    } else {
      steps.push({ key: 'x', kind: 'num', label: 'Solve for x (take the square root of both sides)', hint: 'Both reactants start equal, so ' + exprHtml(sp, o.Kp) + ' is a perfect square.', cell: X, unit: u, practice: '5.F' });
      steps.push(Erow);
    }
    return {
      kind: 'ice', type: o.type, ctx: o.ctx.id, topic: ICE_TOPIC[o.type], Kp: o.Kp, unit: u,
      species: sp.map(function(s){ return { html: s.html, nu: s.nu }; }), equation: eqHtml(sp), expr: exprHtml(sp, o.Kp),
      text: text, c0: o.c0, x: o.x, K: o.K, E: o.E, pct: o.pct, ok: o.ok, xApprox: o.xa, xExact: o.xEx, steps: steps,
      solution: iceSolution(o)
    };
  }
  function iceSolution(o){
    var sp = o.sp, u = o.u, s = [];
    s.push('I: ' + sp.map(function(x, i){ return x.html + ' ' + fmt(o.c0[i], 3); }).join(', ') + ' ' + u + (o.mol ? ' (moles ÷ ' + fmt(o.V, 3) + ' L)' : '') + '.');
    s.push('C: ' + sp.map(function(x){ return x.html + ' ' + (x.nu > 0 ? '+' : '−') + (Math.abs(x.nu) > 1 ? Math.abs(x.nu) : '') + 'x'; }).join(', ') + ', from the coefficients.');
    if(o.type === 'findK') s.push('x = (' + fmt(o.meas, 3) + ' − ' + fmt(o.c0[o.mj], 3) + ') ÷ ' + sp[o.mj].nu + ' = ' + fmt(o.x, 3) + ' ' + u + '.');
    if(o.type === 'smallx'){
      s.push('Drop x next to each initial amount: x ≈ ' + fmt(o.xa, 3) + ' ' + u + '.');
      s.push('Check: ' + F(o.pct, 1) + '% of the initial amount, ' + (o.ok ? 'under 5%, so the approximation holds.' : 'over 5%, so solve the quadratic exactly: x = ' + fmt(o.xEx, 3) + ' ' + u + '.'));
    }
    if(o.type === 'square') s.push('Take the square root of both sides, then solve the linear equation: x = ' + fmt(o.x, 3) + ' ' + u + '.');
    s.push('E: ' + sp.map(function(x, i){ return x.html + ' ' + fmt(o.E[i], 3); }).join(', ') + ' ' + u + '.');
    s.push((o.Kp ? 'K<sub>p</sub>' : 'K<sub>c</sub>') + ' = ' + exprHtml(sp, o.Kp) + ' = ' + fmt(Q(sp, o.E), 3) + (o.type === 'findK' ? '.' : '; putting the E row back into the expression returns K, a check on the work.'));
    return s;
  }

  /* ------------------------------------------------ 2. Q vs K */
  /* ctx: { id, topic?, K: 'Kc'|'Kp', species (with draw: a particle template
     key in particles mode), mode: 'numbers'|'particles', c: [lo, hi]
     (numbers), per: M per particle and max count (particles) } */
  function qkGenerate(r, ctx){
    for(var t = 0; t < 200; t++){ var p = qkTry(r, ctx); if(p) return p; }
    throw new Error('q-vs-k: no problem for ' + ctx.id);
  }
  function qkTry(r, ctx){
    var sp = ctx.species, Kp = ctx.K === 'Kp', u = Kp ? 'atm' : 'M', parts = ctx.mode === 'particles';
    var roll = r(), dir = roll < 0.18 ? 'eq' : roll < 0.59 ? 'f' : 'r';
    var counts = null, c;
    if(parts){ counts = sp.map(function(s){ return inQ(s) ? r.int(1, ctx.max || 8) : 0; }); c = counts.map(function(n){ return M.round(n * ctx.per, 6); }); }
    else c = sp.map(function(s){ return inQ(s) ? between(r, ctx.c[0], ctx.c[1], 2) : 0; });
    var q = Q(sp, c), K;
    if(dir === 'eq'){ K = M.sig(q, 2); if(Math.abs(K - q) / q > 0.02) return null; }
    else { var f = Math.pow(10, 0.5 + r()); K = M.sig(dir === 'f' ? q * f : q / f, 2); }
    var Kname = ctx.K === 'Ksp' ? 'K<sub>sp</sub>' : Kp ? 'K<sub>p</sub>' : 'K<sub>c</sub>';
    var qm = [
      { value: 1 / q, why: 'That is the expression upside down: products over reactants, as for K.' },
      { value: Qflat(sp, c), why: 'Raise each concentration to its coefficient, as in the K expression.' }
    ];
    if(parts) qm.push({ value: Q(sp, counts), why: 'Those are particle counts. Turn each count into a concentration first: each particle stands for ' + fmt(ctx.per, 2) + ' M.' });
    var cmp = dir === 'eq' ? 2 : dir === 'f' ? 0 : 1, qs = fmt(q, 2), ks = fmt(K, 2), big = K > 1;
    var kOnly = 'K = ' + ks + ' is ' + (big ? 'greater' : 'less') + ' than 1, so ' + (big ? 'products are favored and the reaction moves forward.' : 'reactants are favored and the reaction moves in reverse.');
    var J = {
      f: ['Q = ' + qs + ' is less than K = ' + ks + ', so the reaction proceeds forward, toward products, until Q increases to equal K.',
        'Q = ' + qs + ' is less than K = ' + ks + ', so the reaction shifts toward reactants until Q equals K.', kOnly,
        'There are more reactant particles than product particles, so the forward reaction is faster and products form.'],
      r: ['Q = ' + qs + ' is greater than K = ' + ks + ', so the reaction proceeds in reverse, toward reactants, until Q decreases to equal K.',
        'Q = ' + qs + ' is greater than K = ' + ks + ', so the reaction shifts toward products until Q equals K.', kOnly,
        'The products are crowded, so the reverse reaction is faster and reactants form.'],
      eq: ['Q = ' + qs + ' equals K = ' + ks + ', so the mixture is at equilibrium: the forward and reverse rates are equal and there is no net change.',
        'Q = ' + qs + ' equals K = ' + ks + ', so the reaction proceeds forward until the reactants are used up.', kOnly,
        'Q equals K, so both reactions have stopped and nothing happens at the particle level.']
    }[dir];
    var why = [
      'This earns the point: it states both values, compares Q with K, and names the direction that brings Q to K.',
      dir === 'eq' ? 'When Q = K there is no net change; nothing drives the reaction forward.' : 'The direction is backward. ' + (dir === 'f' ? 'Q < K, so Q must rise: products must form.' : 'Q > K, so Q must fall: reactants must form.'),
      'The size of K alone never gives the direction; only comparing Q with K does.',
      dir === 'eq' ? 'Equilibrium is dynamic: both reactions continue at equal rates. "Stopped" loses the point.' : 'A rate argument without comparing Q and K does not earn the point; readers want Q compared with K.'
    ];
    var others = sp.filter(function(s){ return !inQ(s); });
    var mix = parts ? 'The box shows a mixture at one moment. Each particle represents ' + fmt(ctx.per, 2) + ' ' + u + '.'
      : 'At one moment a mixture has ' + list(sp.map(function(s, i){ return inQ(s) ? (Kp ? 'P<sub>' + s.html + '</sub> = ' : '[' + s.html + '] = ') + fmt(c[i], 2) + ' ' + u : null; }).filter(Boolean)) + (others.length ? ', with some ' + others.map(function(s){ return s.html + '(' + s.phase + ')'; }).join(' and ') + ' present' : '') + '.';
    return {
      kind: 'qk', ctx: ctx.id, topic: ctx.topic || 'q-and-k', mode: parts ? 'particles' : 'numbers', Kp: Kp, unit: u,
      species: sp.map(function(s){ return { html: s.html, nu: s.nu, phase: s.phase || '', draw: s.draw || null }; }),
      equation: eqHtml(sp), expr: exprHtml(sp, Kp), counts: counts, c: c, per: ctx.per || null, Q: q, K: K, dir: dir,
      text: '<p class="bt-eq">' + eqHtml(sp) + ' &nbsp; ' + Kname + ' = ' + ks + '</p><p>' + mix + '</p>',
      steps: [
        // Within 5%: the amounts are given to 2 significant figures, and a Q
        // rounded to 2 figures can sit up to 5% from the exact value.
        { key: 'Q', kind: 'num', label: 'Calculate Q = ' + exprHtml(sp, Kp), hint: (parts ? 'Concentration = count × ' + fmt(ctx.per, 2) + ' ' + u + '. ' : '') + (others.length ? 'Leave solids and liquids out.' : 'Same form as K, with the amounts right now.'), cell: cell(q, 0.05, qm), unit: '', practice: '5.F' },
        { key: 'cmp', kind: 'choice', label: 'Compare Q with K', options: ['Q < K', 'Q > K', 'Q = K'], correct: cmp, fixed: true, practice: '6.D', why: ['Q is ' + qs + ', K is ' + ks + '.', 'Q is ' + qs + ', K is ' + ks + '.', 'Q is ' + qs + ', K is ' + ks + '.'] },
        { key: 'dir', kind: 'choice', label: 'Which way does the reaction go?', options: ['Forward, toward products', 'In reverse, toward reactants', 'No net change: already at equilibrium'], correct: cmp, fixed: true, practice: '6.D',
          why: ['Q < K: products form, raising Q to K.', 'Q > K: reactants form, lowering Q to K.', 'Q = K: the mixture is at equilibrium.'] },
        { key: 'just', kind: 'choice', label: 'Which justification earns the point?', options: J, correct: 0, practice: '6.D', why: why }
      ],
      solution: [
        'Q = ' + exprHtml(sp, Kp) + (parts ? ' with each count × ' + fmt(ctx.per, 2) + ' ' + u : '') + (others.length ? ' (solids and liquids are left out)' : '') + ' = ' + fmt(q, 3) + '.',
        'Q ' + (dir === 'f' ? '<' : dir === 'r' ? '>' : '=') + ' K = ' + ks + '.',
        J[0]
      ]
    };
  }

  /* ------------------------------------------------ 3. Buffers */
  /* ctx: { id, acid: { name, HA, A, Ka } | base: { name, B, BH, Kb },
     types: ['ph','ratio','add','capacity'], c: [lo, hi] } */
  var BUF_TOPIC = { ph: 'henderson-hasselbalch', ratio: 'henderson-hasselbalch', add: 'buffer-properties', capacity: 'buffer-limits' };
  function bufGenerate(r, ctx, type){
    type = type && ctx.types.indexOf(type) > -1 ? type : r.pick(ctx.types);
    for(var t = 0; t < 200; t++){ var p = bufTry(r, ctx, type); if(p) return p; }
    throw new Error('buffer: no problem for ' + ctx.id + ' ' + type);
  }
  function bufTry(r, ctx, type){
    var isBase = !!ctx.base, a = ctx.acid || {}, b = ctx.base || {};
    var Ka = isBase ? M.C.Kw / b.Kb : a.Ka, pKa = -Math.log10(Ka), pKb = isBase ? -Math.log10(b.Kb) : null;
    var HA = isBase ? b.BH : a.HA, A = isBase ? b.B : a.A, nm = isBase ? b.name : a.name;
    var lead = '<p>' + nm + ': ' + (isBase ? 'K<sub>b</sub> of ' + b.B + ' = ' + fmt(b.Kb, 2) : 'K<sub>a</sub> of ' + a.HA + ' = ' + fmt(a.Ka, 2)) + ' at 25 °C.</p>';
    var pkaStep = { key: 'pKa', kind: 'num', label: 'pK<sub>a</sub> of ' + HA, hint: isBase ? 'pK<sub>a</sub> + pK<sub>b</sub> = 14.00 at 25 °C.' : 'pK<sub>a</sub> = −log K<sub>a</sub>.', d: 2, practice: '5.F',
      cell: cell(pKa, 0, isBase ? [{ value: pKb, why: 'That is pK<sub>b</sub> of ' + b.B + '. Henderson-Hasselbalch needs pK<sub>a</sub> of the conjugate acid ' + b.BH + ': 14.00 − pK<sub>b</sub>.' }] : [{ value: -Math.log(Ka), why: 'pK<sub>a</sub> uses the base-10 log, not ln.' }], 0.02) };
    var steps = [], sol = [], text;
    if(type === 'ph'){
      var cA = between(r, ctx.c[0], ctx.c[1], 3), cH = between(r, ctx.c[0], ctx.c[1], 3), ratio = cA / cH;
      if(Math.abs(Math.log10(ratio)) < 0.12 || !hhOk(Ka, cA, cH)) return null;
      var pH = pKa + Math.log10(ratio);
      text = lead + '<p>A buffer is ' + fmt(cH, 3) + ' M ' + HA + ' and ' + fmt(cA, 3) + ' M ' + A + '. Find its pH.</p>';
      var ms = [
        { value: pKa + Math.log(ratio), why: 'Henderson-Hasselbalch uses log (base 10), not ln.' },
        { value: pKa - Math.log10(ratio), why: 'The ratio is upside down: base over acid, [' + A + '] / [' + HA + '].' }
      ];
      if(isBase) ms.push({ value: pKb + Math.log10(ratio), why: 'You used pK<sub>b</sub>. For a weak-base buffer use pK<sub>a</sub> of ' + b.BH + ' = 14.00 − pK<sub>b</sub>.' });
      if(isBase) ms.push({ value: 14 - (pKb + Math.log10(ratio)), why: 'pOH = pK<sub>b</sub> + log([' + HA + '] / [' + A + ']); this used the ratio the wrong way round for pOH.' });
      steps.push(pkaStep, { key: 'pH', kind: 'num', label: 'pH of the buffer', hint: 'pH = pK<sub>a</sub> + log([' + A + '] / [' + HA + '])', cell: cell(pH, 0, ms, 0.02), d: 2, practice: '5.F' });
      sol.push('pK<sub>a</sub> = ' + (isBase ? '14.00 − ' + F(pKb, 2) + ' = ' : '−log(' + fmt(Ka, 2) + ') = ') + F(pKa, 2) + '.');
      sol.push('pH = ' + F(pKa, 2) + ' + log(' + fmt(cA, 3) + ' / ' + fmt(cH, 3) + ') = ' + F(pKa, 2) + ' + (' + F(Math.log10(ratio), 3) + ') = ' + F(pH, 2) + '.');
      return bufOut(ctx, type, text, steps, sol, { pKa: pKa, pH: pH, ratio: ratio, cA: cA, cH: cH });
    }
    if(type === 'ratio'){
      var off = (r() < 0.5 ? -1 : 1) * (0.15 + 0.8 * r()), target = M.round(pKa + off, 2), rat = Math.pow(10, target - pKa);
      if(Math.abs(target - pKa) < 0.12) return null;
      text = lead + '<p>You need a buffer at pH ' + F(target, 2) + ' made from ' + HA + ' and ' + A + '. What ratio [' + A + '] / [' + HA + '] do you need?</p>';
      // Within 5%, plus 0.006 so a ratio worked from the two-decimal pKa and
      // rounded to two decimal places (as the answer is shown) still counts.
      steps.push(pkaStep, { key: 'ratio', kind: 'num', label: 'Ratio [' + A + '] / [' + HA + ']', hint: 'Rearrange: log([' + A + '] / [' + HA + ']) = pH − pK<sub>a</sub>.', d: 2, practice: '5.F', cell: cell(rat, 0.05, [
        { value: 1 / rat, why: 'That is [' + HA + '] / [' + A + ']: upside down. A pH ' + (target > pKa ? 'above' : 'below') + ' pK<sub>a</sub> needs ' + (target > pKa ? 'more base than acid' : 'more acid than base') + '.' },
        { value: Math.exp(target - pKa), why: 'Undo a base-10 log with 10<sup>x</sup>, not e<sup>x</sup>.' },
        { value: target - pKa, why: 'That is the log of the ratio. Raise 10 to that power.' }
      ], 0.006) });
      steps.push({ key: 'more', kind: 'choice', label: 'Which form must be present in the larger amount?', options: [A + ' (the base form)', HA + ' (the acid form)'], correct: target > pKa ? 0 : 1, fixed: true, practice: '6.D',
        why: ['pH above pK<sub>a</sub> means [base] > [acid].', 'pH below pK<sub>a</sub> means [acid] > [base].'] });
      sol.push('pK<sub>a</sub> = ' + F(pKa, 2) + '.');
      sol.push('log([' + A + '] / [' + HA + ']) = ' + F(target, 2) + ' − ' + F(pKa, 2) + ' = ' + F(target - pKa, 2) + ', so the ratio = 10<sup>' + F(target - pKa, 2) + '</sup> = ' + fmt(rat, 2) + '.');
      return bufOut(ctx, type, text, steps, sol, { pKa: pKa, target: target, ratio: rat });
    }
    var Vb = r.pick([50.0, 100.0, 200.0, 250.0]) / 1000;
    var cA2 = between(r, ctx.c[0], ctx.c[1], 3), cH2 = between(r, ctx.c[0], ctx.c[1], 3);
    var nA = cA2 * Vb, nH = cH2 * Vb, vol = fmt(Vb * 1000, 3) + ' mL';
    if(type === 'add'){
      var acidAdded = r() < 0.5, cap = acidAdded ? nA : nH;
      var nAdd = M.sig(cap * (0.15 + 0.55 * r()), 2);
      var nA2 = acidAdded ? nA - nAdd : nA + nAdd, nH2 = acidAdded ? nH + nAdd : nH - nAdd;
      var pH0 = pKa + Math.log10(nA / nH), pH1 = pKa + Math.log10(nA2 / nH2);
      if(Math.abs(pH1 - pH0) < 0.08 || !hhOk(Ka, cA2, cH2) || !hhOk(Ka, nA2 / Vb, nH2 / Vb)) return null;
      var who = acidAdded ? 'HCl' : 'NaOH', wA = acidAdded ? nA + nAdd : nA - nAdd, wH = acidAdded ? nH - nAdd : nH + nAdd;
      text = lead + '<p>' + vol + ' of a buffer is ' + fmt(cH2, 3) + ' M ' + HA + ' and ' + fmt(cA2, 3) + ' M ' + A + '. You add ' + fmt(nAdd, 2) + ' mol of ' + who + ' (no volume change). Find the new pH.</p>';
      steps.push({ key: 'nA', kind: 'num', label: 'Moles of ' + A + ' after the reaction', unit: 'mol', practice: '5.F',
        hint: 'Start: ' + fmt(nA, 3) + ' mol ' + A + ' (M × L). ' + (acidAdded ? 'H₃O⁺ reacts with the base: ' + A + ' + H₃O⁺ → ' + HA + '.' : 'OH⁻ reacts with the acid: ' + HA + ' + OH⁻ → ' + A + ' + H₂O.'),
        cell: cell(nA2, 0.02, [
          { value: wA, why: acidAdded ? 'Added acid is used up by the base form, so ' + A + ' goes down, not up.' : 'Added base turns ' + HA + ' into ' + A + ', so ' + A + ' goes up.' },
          { value: nA, why: 'Do the stoichiometry first: the strong ' + (acidAdded ? 'acid' : 'base') + ' reacts completely with the buffer.' },
          { value: cA2, why: 'That is a concentration. Moles = M × L.' }]) });
      steps.push({ key: 'nH', kind: 'num', label: 'Moles of ' + HA + ' after the reaction', unit: 'mol', practice: '5.F', hint: 'Start: ' + fmt(nH, 3) + ' mol ' + HA + '.',
        cell: cell(nH2, 0.02, [
          { value: wH, why: acidAdded ? 'The reaction makes ' + HA + ', so it goes up.' : 'OH⁻ uses up ' + HA + ', so it goes down.' },
          { value: nH, why: 'Do the stoichiometry first: the strong ' + (acidAdded ? 'acid' : 'base') + ' reacts completely.' }]) });
      steps.push({ key: 'pH', kind: 'num', label: 'The new pH', hint: 'Henderson-Hasselbalch with moles: the volume cancels in the ratio.', d: 2, practice: '5.F',
        cell: cell(pH1, 0, [
          { value: pKa + Math.log10(wA / wH), why: 'The changes went the wrong way: added ' + (acidAdded ? 'acid lowers' : 'base raises') + ' the pH a little.' },
          { value: pH0, why: 'That is the pH before the addition.' },
          { value: pKa + Math.log(nA2 / nH2), why: 'Use log (base 10), not ln.' },
          { value: pKa - Math.log10(nA2 / nH2), why: 'The ratio is upside down: base over acid.' }], 0.02) });
      sol.push((acidAdded ? A + ' + H₃O⁺ → ' + HA : HA + ' + OH⁻ → ' + A + ' + H₂O') + ': all ' + fmt(nAdd, 2) + ' mol of ' + who + ' reacts.');
      sol.push(A + ': ' + fmt(nA, 3) + ' ' + (acidAdded ? '−' : '+') + ' ' + fmt(nAdd, 2) + ' = ' + fmt(nA2, 3) + ' mol. ' + HA + ': ' + fmt(nH, 3) + ' ' + (acidAdded ? '+' : '−') + ' ' + fmt(nAdd, 2) + ' = ' + fmt(nH2, 3) + ' mol.');
      sol.push('pH = ' + F(pKa, 2) + ' + log(' + fmt(nA2, 3) + ' / ' + fmt(nH2, 3) + ') = ' + F(pH1, 2) + '. It was ' + F(pH0, 2) + ': a buffer changes pH only a little.');
      return bufOut(ctx, type, text, steps, sol, { pKa: pKa, pH0: pH0, pH: pH1, nA: nA2, nH: nH2, added: nAdd, acidAdded: acidAdded, cA: cA2, cH: cH2, L: Vb });
    }
    var k = r.pick([2, 3, 4, 5]), high = { cH: M.sig(cH2 * k, 3), cA: M.sig(cA2 * k, 3) }, low = { cH: cH2, cA: cA2 };
    if(Math.abs(high.cA / high.cH - low.cA / low.cH) > 1e-9 * low.cA / low.cH) return null;
    var vsAcid = r() < 0.5, firstHigh = r() < 0.5, X1 = firstHigh ? high : low, X2 = firstHigh ? low : high;
    var capMol = (vsAcid ? high.cA : high.cH) * Vb, form = vsAcid ? A : HA, oth = vsAcid ? HA : A;
    text = lead + '<p>Buffer 1 is ' + fmt(X1.cH, 3) + ' M ' + HA + ' and ' + fmt(X1.cA, 3) + ' M ' + A + '. Buffer 2 is ' + fmt(X2.cH, 3) + ' M ' + HA + ' and ' + fmt(X2.cA, 3) + ' M ' + A + '. Each is ' + vol + '.</p>';
    steps.push({ key: 'same', kind: 'choice', label: 'How do the pH values of the two buffers compare?', options: ['They are the same', 'Buffer 1 has the higher pH', 'Buffer 2 has the higher pH'], correct: 0, fixed: true, practice: '6.D',
      why: ['Both have the same ratio [' + A + '] / [' + HA + '], and the pH depends only on the ratio and pK<sub>a</sub>.', 'The pH depends on the ratio, not on how concentrated the buffer is.', 'The pH depends on the ratio, not on how concentrated the buffer is.'] });
    steps.push({ key: 'which', kind: 'choice', label: 'Which buffer can neutralize more added strong ' + (vsAcid ? 'acid' : 'base') + ' before its pH changes sharply?', options: ['Buffer 1', 'Buffer 2'], correct: firstHigh ? 0 : 1, fixed: true, practice: '6.D',
      why: [firstHigh ? 'It has more moles of ' + form + ' to react with the added ' + (vsAcid ? 'acid' : 'base') + ': greater capacity.' : 'Same ratio, but fewer moles of each component: less capacity.',
        firstHigh ? 'Same ratio, but fewer moles of each component: less capacity.' : 'It has more moles of ' + form + ' to react with the added ' + (vsAcid ? 'acid' : 'base') + ': greater capacity.'] });
    steps.push({ key: 'cap', kind: 'num', label: 'In all, how many moles of strong ' + (vsAcid ? 'acid' : 'base') + ' can the more concentrated buffer neutralize?', unit: 'mol', practice: '5.F',
      hint: 'Added ' + (vsAcid ? 'H₃O⁺ reacts with ' + A : 'OH⁻ reacts with ' + HA) + ' until that component runs out.',
      cell: cell(capMol, 0.02, [
        { value: (vsAcid ? high.cH : high.cA) * Vb, why: 'Added ' + (vsAcid ? 'acid reacts with the base form, ' + A : 'base reacts with the acid form, ' + HA) + ', so ' + form + ' sets the limit, not ' + oth + '.' },
        { value: vsAcid ? high.cA : high.cH, why: 'That is a concentration. Moles = M × L.' }]) });
    sol.push('Both ratios are ' + fmt(cA2 / cH2, 3) + ', so the pH values are equal.');
    sol.push('Capacity depends on the amounts: the more concentrated buffer has ' + k + ' times as much of each component.');
    sol.push('It neutralizes up to ' + fmt(vsAcid ? high.cA : high.cH, 3) + ' M × ' + fmt(Vb, 3) + ' L = ' + fmt(capMol, 3) + ' mol of strong ' + (vsAcid ? 'acid' : 'base') + ', when its ' + form + ' runs out.');
    return bufOut(ctx, type, text, steps, sol, { pKa: pKa, cap: capMol, high: firstHigh ? 1 : 2, b1: X1, b2: X2, L: Vb, vsAcid: vsAcid });
  }
  /* The exact pH of a buffer (charge balance with water), to keep only
     problems where Henderson-Hasselbalch, the method the exam expects, is
     within 0.02 of the truth: neither component so dilute next to [H₃O⁺] or
     [OH⁻] that the ratio shifts. */
  function bufExactPH(Ka, cA, cH){
    var lo = -14, hi = 0, Kw = M.C.Kw;
    for(var i = 0; i < 100; i++){ var m = (lo + hi) / 2, h = Math.pow(10, m), oh = Kw / h; if(h * (cA + h - oh) - Ka * (cH - h + oh) > 0) hi = m; else lo = m; }
    return -(lo + hi) / 2;
  }
  function hhOk(Ka, cA, cH){ var r = cA / cH; return r >= 0.1 && r <= 10 && Math.abs(bufExactPH(Ka, cA, cH) - (-Math.log10(Ka) + Math.log10(r))) <= 0.02; }
  function bufOut(ctx, type, text, steps, sol, v){ return { kind: 'buffer', type: type, ctx: ctx.id, topic: BUF_TOPIC[type], text: text, steps: steps, solution: sol, values: v }; }

  /* ------------------------------------------------ 4. Titration curves */
  /* sys: { kind: 'sa'|'wa'|'wb'|'di', Ca (M), Va (mL), Ct (M), Ka: [..]
     (acids), Kb (wb) }. pH at a volume of titrant from the exact charge
     balance, solved by bisection on log[H₃O⁺]: every point on the curve is
     the equilibrium math, with no approximations. */
  function nbar(h, Ka){
    // Average number of protons an acid molecule has lost (0..n).
    var n = Ka.length, prod = 1, s = Math.pow(h, n), num = 0;
    for(var k = 1; k <= n; k++){ prod *= Ka[k - 1]; var t = prod * Math.pow(h, n - k); s += t; num += k * t; }
    return num / s;
  }
  function titrationPH(sys, v){
    var V = sys.Va + v, Kw = M.C.Kw, CA = sys.Ca * sys.Va / V, CT = sys.Ct * v / V, f;
    if(sys.kind === 'wb'){ var Ka = Kw / sys.Kb; f = function(h){ return h + CA * h / (h + Ka) - Kw / h - CT; }; }
    else if(sys.kind === 'sa') f = function(h){ return h + CT - Kw / h - CA; };
    else f = function(h){ return h + CT - Kw / h - CA * nbar(h, sys.Ka); };
    var lo = -16, hi = 1.5;
    for(var i = 0; i < 100; i++){ var mid = (lo + hi) / 2; if(f(Math.pow(10, mid)) > 0) hi = mid; else lo = mid; }
    return -(lo + hi) / 2;
  }
  function titrationEq(sys){ var n = sys.Ca * sys.Va / sys.Ct; return sys.kind === 'di' ? [n, 2 * n] : [n]; }
  function titrationCurve(sys, vmax, step){
    var pts = [], st = step || vmax / 240;
    for(var v = 0; v <= vmax + 1e-9; v += st) pts.push(M.round(v, 4));
    titrationEq(sys).forEach(function(e){ for(var d = -1; d <= 1.0001; d += 0.05){ var w = M.round(e + d, 4); if(w > 0 && w < vmax) pts.push(w); } });
    pts.sort(function(a, b){ return a - b; });
    return pts.filter(function(v, i){ return !i || v - pts[i - 1] > 1e-6; }).map(function(v){ return [v, titrationPH(sys, v)]; });
  }
  var INDICATORS = [
    { name: 'Methyl orange', lo: 3.1, hi: 4.4 },
    { name: 'Methyl red', lo: 4.4, hi: 6.2 },
    { name: 'Bromothymol blue', lo: 6.0, hi: 7.6 },
    { name: 'Phenolphthalein', lo: 8.2, hi: 10.0 },
    { name: 'Alizarin yellow R', lo: 10.1, hi: 12.0 }
  ];
  /* ctx: { id, kind, analyte, titrant, HA?, A?, HA1? (diprotic middle form),
     B?, BH?, Ka?: [..], pKa1?: [lo, hi], gap?: [lo, hi] (diprotic: pKa2 −
     pKa1), Kb?, Ca: [lo, hi], Va: [mL...], Ct: [lo, hi] } */
  function titGenerate(r, ctx){
    for(var t = 0; t < 300; t++){ var p = titTry(r, ctx); if(p) return p; }
    throw new Error('titration: no curve for ' + ctx.id);
  }
  function titTry(r, ctx){
    var sys = { kind: ctx.kind, Ca: between(r, ctx.Ca[0], ctx.Ca[1], 3), Va: r.pick(ctx.Va), Ct: between(r, ctx.Ct[0], ctx.Ct[1], 3) };
    if(ctx.Ka) sys.Ka = ctx.Ka.slice();
    if(ctx.kind === 'di'){
      var p1 = M.round(ctx.pKa1[0] + (ctx.pKa1[1] - ctx.pKa1[0]) * r(), 2), p2 = M.round(p1 + ctx.gap[0] + (ctx.gap[1] - ctx.gap[0]) * r(), 2);
      sys.Ka = [M.sig(Math.pow(10, -p1), 2), M.sig(Math.pow(10, -p2), 2)];
    }
    if(ctx.Kb) sys.Kb = ctx.Kb;
    var eqs = titrationEq(sys), e1 = eqs[0], last = eqs[eqs.length - 1];
    if(e1 < 10 || last > 45) return null;
    var vmax = Math.ceil(last * 1.6 / 5) * 5;
    var pKa = sys.kind === 'wb' ? 14 + Math.log10(sys.Kb) : sys.kind === 'sa' ? null : -Math.log10(sys.Ka[0]);
    var pKa2 = sys.kind === 'di' ? -Math.log10(sys.Ka[1]) : null;
    var half = sys.kind === 'sa' ? null : e1 / 2, phHalf = half == null ? null : titrationPH(sys, half);
    if(pKa != null && Math.abs(phHalf - pKa) > 0.05) return null;
    var half2 = sys.kind === 'di' ? 1.5 * e1 : null, phHalf2 = half2 == null ? null : titrationPH(sys, half2);
    if(pKa2 != null && Math.abs(phHalf2 - pKa2) > 0.05) return null;
    var phEq = titrationPH(sys, last);
    var fits = INDICATORS.map(function(d, i){ return d.lo <= phEq && phEq <= d.hi ? i : -1; }).filter(function(i){ return i > -1; });
    if(fits.length !== 1) return null;
    // The jump is steep: 0.5 mL either side of the last equivalence point
    // spans at least 2 pH units.
    if(Math.abs(titrationPH(sys, last + 0.5) - titrationPH(sys, last - 0.5)) < 2) return null;
    var regions = sys.kind === 'sa' ? ['start', 'before', 'eq', 'after'] : sys.kind === 'di' ? ['start', 'buffer1', 'eq1', 'buffer2', 'eq2', 'after'] : ['start', 'buffer', 'half', 'eq', 'after'];
    var reg = r.pick(regions);
    var spot = { start: 0, before: e1 * (0.3 + 0.4 * r()), buffer: e1 * (0.15 + 0.2 * r()), half: half, eq: e1, after: last * (1.2 + 0.25 * r()),
      buffer1: e1 * (0.25 + 0.15 * r()), eq1: e1, buffer2: e1 * (1.6 + 0.15 * r()), eq2: last }[reg];
    spot = M.round(spot, 2);
    var T = titSpecies(ctx, sys);
    var p = {
      kind: 'titration', ctx: ctx.id, topic: ctx.topic || 'acid-base-titrations', sys: sys, vmax: vmax, eqs: eqs,
      half: half, half2: half2, pKa: pKa, pKa2: pKa2, phHalf: phHalf, phHalf2: phHalf2, phEq: phEq, phEqs: eqs.map(function(e){ return titrationPH(sys, e); }),
      indicator: fits[0], curve: titrationCurve(sys, vmax),
      text: '<p>' + fmt(sys.Va, 3) + ' mL of ' + fmt(sys.Ca, 3) + ' M ' + ctx.analyte + ' is titrated with ' + fmt(sys.Ct, 3) + ' M ' + ctx.titrant + '.</p>',
      point: { region: reg, v: spot, pH: titrationPH(sys, spot), options: T.order.map(function(k){ return T.text[k]; }), correct: T.order.indexOf(reg), why: T.order.map(function(k){ return T.why[k]; }) }
    };
    titSteps(p, ctx);
    return p;
  }
  /* The reader's steps. Volumes are read off the graph, so they count within
     0.6 mL; pK<sub>a</sub> within 0.15 of the pH at half-equivalence. */
  function titSteps(p, ctx){
    var sys = p.sys, e = p.eqs, V = 0.6, di = sys.kind === 'di', wb = sys.kind === 'wb', S = [], sol = [];
    var eqName = di ? 'the first equivalence point' : 'the equivalence point';
    var volCell = function(v, ms){ return cell(v, 0, ms, V); };
    S.push({ key: 'eq', kind: 'vol', max: p.vmax, label: 'Volume of titrant at ' + eqName, hint: 'The middle of the steepest part of the curve.', unit: 'mL', practice: '5.D',
      cell: volCell(e[0], (p.half != null ? [{ value: p.half, why: 'That is the half-equivalence point, halfway to the equivalence point. The equivalence point is the middle of the steep rise.' }] : []).concat([{ value: p.vmax, why: 'That is the total volume on the axis, not the equivalence volume.' }])) });
    if(di) S.push({ key: 'eq2', kind: 'vol', max: p.vmax, label: 'Volume of titrant at the second equivalence point', hint: 'A diprotic acid gives two jumps; the second needs twice the volume of the first.', unit: 'mL', practice: '5.D',
      cell: volCell(e[1], [{ value: e[0], why: 'That is the first equivalence point. The second comes at twice that volume.' }, { value: p.half2, why: 'That is halfway between the two equivalence points, where pH = pK<sub>a2</sub>.' }]) });
    if(p.half != null){
      S.push({ key: 'half', kind: 'vol', max: p.vmax, label: 'Volume at the half-equivalence point' + (di ? ' (first proton)' : ''), hint: 'Half the volume needed to reach ' + eqName + '.', unit: 'mL', practice: '5.D',
        cell: volCell(p.half, [{ value: e[0], why: 'That is the equivalence point itself. Half-equivalence is at half that volume.' }, { value: e[0] * 2, why: 'Halve the equivalence volume; do not double it.' }]) });
      var pk = wb ? 'pK<sub>a</sub> of ' + ctx.BH : di ? 'pK<sub>a1</sub>' : 'pK<sub>a</sub> of ' + ctx.HA;
      S.push({ key: 'pKa', kind: 'num', label: 'Read ' + pk + ' from the curve', hint: 'At half-equivalence, [acid] = [conjugate base], so pH = pK<sub>a</sub>.', d: 2, practice: '5.D',
        cell: cell(p.phHalf, 0, [{ value: p.phEqs[0], why: 'That is the pH at the equivalence point. pK<sub>a</sub> equals the pH at the half-equivalence point.' }].concat(wb ? [{ value: 14 - p.phHalf, why: 'That is pK<sub>b</sub> of ' + ctx.B + '. The curve gives pK<sub>a</sub> of ' + ctx.BH + ' directly: pH at half-equivalence.' }] : []), 0.15) });
    }
    if(di) S.push({ key: 'pKa2', kind: 'num', label: 'Read pK<sub>a2</sub> from the curve', hint: 'Halfway between the two equivalence points, [' + ctx.HA1 + '] = [' + ctx.A + '].', d: 2, practice: '5.D',
      cell: cell(p.phHalf2, 0, [{ value: p.phHalf, why: 'That is pK<sub>a1</sub>. pK<sub>a2</sub> is the pH halfway between the two equivalence points.' }, { value: p.phEqs[0], why: 'That is the pH at the first equivalence point.' }], 0.15) });
    var ind = INDICATORS[p.indicator], last = e[e.length - 1];
    // Volume at which the curve crosses a pH near the last equivalence point
    // (the curve rises for an acid analyte, falls for a base).
    var crossAt = function(ph){
      var lo = Math.max(0, last - 0.25 * last), hi = last + 0.25 * last, up = !wb;
      for(var j = 0; j < 60; j++){ var m = (lo + hi) / 2, y = titrationPH(sys, m); if(up ? y < ph : y > ph) lo = m; else hi = m; }
      return (lo + hi) / 2;
    };
    // An indicator whose whole range sits on the steep jump changes color
    // within a drop or two (0.1 mL) of equivalence: not the best match, but not
    // wrong in practice, and the feedback says so.
    var inJump = function(d){ return Math.max(Math.abs(crossAt(d.lo) - last), Math.abs(crossAt(d.hi) - last)) <= 0.1; };
    S.push({ key: 'indicator', kind: 'choice', label: 'Which indicator fits ' + (di ? 'the second equivalence point' : 'this titration') + ' best? Use the table of color-change ranges.', options: INDICATORS.map(function(d){ return d.name + ' (pH ' + F(d.lo, 1) + '–' + F(d.hi, 1) + ')'; }), correct: p.indicator, fixed: true, practice: '2.B',
      why: INDICATORS.map(function(d, i){
        if(i === p.indicator) return 'Its range, pH ' + F(d.lo, 1) + '–' + F(d.hi, 1) + ', contains the pH at the equivalence point (' + F(p.phEq, 2) + '), so it changes color on the steep part.';
        var base = 'Its range, pH ' + F(d.lo, 1) + '–' + F(d.hi, 1) + ', does not contain the pH at the equivalence point (' + F(p.phEq, 2) + ')';
        return inJump(d) ? base + ', so it is not the best match. The jump here is so steep that it would still change color within a drop or two of the equivalence point, but the best choice is the indicator whose range contains the equivalence pH.'
          : base + ': it would change color ' + ((wb ? d.lo > p.phEq : d.hi < p.phEq) ? 'too early' : 'too late') + '.';
      }) });
    S.push({ key: 'species', kind: 'choice', label: 'The dot on the curve is at ' + F(p.point.v, 2) + ' mL. Which species are present in the largest amounts there?', options: p.point.options, correct: p.point.correct, fixed: true, practice: '1.B', why: p.point.why });
    sol.push('Equivalence: moles of titrant = moles of ' + (wb ? 'base' : 'acid') + (di ? ' (per proton)' : '') + ': V = ' + fmt(sys.Ca, 3) + ' M × ' + fmt(sys.Va, 3) + ' mL ÷ ' + fmt(sys.Ct, 3) + ' M = ' + F(e[0], 1) + ' mL' + (di ? '; the second at ' + F(e[1], 1) + ' mL' : '') + '.');
    if(p.half != null) sol.push('Half-equivalence at ' + F(p.half, 1) + ' mL, where pH = ' + F(p.phHalf, 2) + ' = pK<sub>a</sub>' + (di ? '1' : '') + (wb ? ' of ' + ctx.BH + ' (pK<sub>b</sub> = 14.00 − ' + F(p.phHalf, 2) + ' = ' + F(14 - p.phHalf, 2) + ')' : '') + '.');
    if(di) sol.push('Halfway between the equivalence points (' + F(p.half2, 1) + ' mL), pH = ' + F(p.phHalf2, 2) + ' = pK<sub>a2</sub>.');
    sol.push('pH at ' + (di ? 'the second' : 'the') + ' equivalence point = ' + F(p.phEq, 2) + (sys.kind === 'sa' ? ' (neutral salt)' : wb ? ' (the conjugate acid makes it acidic)' : ' (the conjugate base makes it basic)') + ', inside the range of ' + ind.name + ' (' + F(ind.lo, 1) + '–' + F(ind.hi, 1) + ').');
    sol.push('At ' + F(p.point.v, 2) + ' mL: ' + p.point.why[p.point.correct]);
    p.steps = S; p.solution = sol; p.last = last;
  }
  function titSpecies(ctx, sys){
    var T = {};
    if(sys.kind === 'sa'){
      T.order = ['start', 'before', 'eq', 'after'];
      T.text = { start: 'H₃O⁺ and Cl⁻, no Na⁺ yet', before: 'H₃O⁺ in excess, with Na⁺ and Cl⁻', eq: 'Na⁺ and Cl⁻ only (pH 7)', after: 'OH⁻ in excess, with Na⁺ and Cl⁻' };
      T.why = { start: 'Before any base is added, HCl is fully ionized: H₃O⁺ and Cl⁻.', before: 'Some H₃O⁺ has been neutralized; the rest is still in excess.', eq: 'Every H₃O⁺ has been neutralized, and neither Na⁺ nor Cl⁻ reacts with water.', after: 'Past equivalence, added OH⁻ has nothing left to react with.' };
      return T;
    }
    if(sys.kind === 'wb'){
      var B = ctx.B, BH = ctx.BH;
      T.order = ['start', 'buffer', 'half', 'eq', 'after'];
      T.text = { start: B + ' and water only, mostly un-ionized', buffer: 'More ' + B + ' than ' + BH + ' (a buffer)', half: B + ' and ' + BH + ' in equal amounts', eq: BH + ' and Cl⁻, no ' + B + ' left', after: 'H₃O⁺ in excess, with ' + BH + ' and Cl⁻' };
      T.why = { start: 'No acid added yet: a weak base is mostly un-ionized.', buffer: 'Less than half the base has become ' + BH + ': a buffer with more base.', half: 'Half the base has been converted, so pH = pK<sub>a</sub> of ' + BH + '.', eq: 'All the base has become its conjugate acid, so the solution is acidic.', after: 'Past equivalence, added H₃O⁺ is in excess and sets the pH.' };
      return T;
    }
    if(sys.kind === 'di'){
      var H2 = ctx.HA, H1 = ctx.HA1, A2 = ctx.A;
      T.order = ['start', 'buffer1', 'eq1', 'buffer2', 'eq2', 'after'];
      T.text = { start: H2 + ', mostly un-ionized', buffer1: H2 + ' and ' + H1, eq1: H1 + ' (with Na⁺)', buffer2: H1 + ' and ' + A2, eq2: A2 + ' (with Na⁺)', after: A2 + ' and excess OH⁻' };
      T.why = { start: 'No base added: the weak acid is mostly un-ionized.', buffer1: 'Before the first equivalence point, some ' + H2 + ' has become ' + H1 + '.', eq1: 'At the first equivalence point each ' + H2 + ' has lost one proton.', buffer2: 'Between the equivalence points, ' + H1 + ' is being converted to ' + A2 + '.', eq2: 'At the second equivalence point each molecule has lost both protons.', after: 'Past the second equivalence point, OH⁻ is in excess.' };
      return T;
    }
    var HA = ctx.HA, A = ctx.A;
    T.order = ['start', 'buffer', 'half', 'eq', 'after'];
    T.text = { start: HA + ' and water only, mostly un-ionized', buffer: 'More ' + HA + ' than ' + A + ' (a buffer)', half: HA + ' and ' + A + ' in equal amounts', eq: A + ' and Na⁺, no ' + HA + ' left', after: 'OH⁻ in excess, with ' + A + ' and Na⁺' };
    T.why = { start: 'No base added: a weak acid is mostly un-ionized.', buffer: 'Less than half the acid has become ' + A + ': a buffer with more acid.', half: 'Half the acid has been converted, so [' + HA + '] = [' + A + '] and pH = pK<sub>a</sub>.', eq: 'All the acid has become its conjugate base, so the solution is basic.', after: 'Past equivalence, added OH⁻ is in excess and sets the pH.' };
    return T;
  }

  /* ------------------------------------------------ 5. Particle pictures */
  /* Molecules are drawn from atoms { el, dx, dy, r?, label? }. Every atom
     carries its symbol, so color is never the only cue, and every picture
     has a text alternative built from the same counts it draws. */
  var TEMPL = {
    A: [{ el: 'A', dx: 0, dy: 0 }], B: [{ el: 'B', dx: 0, dy: 0 }],
    A2: [{ el: 'A', dx: -9, dy: 0 }, { el: 'A', dx: 9, dy: 0 }], B2: [{ el: 'B', dx: -9, dy: 0 }, { el: 'B', dx: 9, dy: 0 }],
    AB: [{ el: 'A', dx: -9, dy: 0 }, { el: 'B', dx: 9, dy: 0 }],
    H2: [{ el: 'H', dx: -6, dy: 0, r: 6 }, { el: 'H', dx: 6, dy: 0, r: 6 }],
    O2: [{ el: 'O', dx: -9, dy: 0 }, { el: 'O', dx: 9, dy: 0 }], N2: [{ el: 'N', dx: -9, dy: 0 }, { el: 'N', dx: 9, dy: 0 }],
    Cl2: [{ el: 'Cl', dx: -10, dy: 0, r: 10 }, { el: 'Cl', dx: 10, dy: 0, r: 10 }],
    CO: [{ el: 'C', dx: -9, dy: 0 }, { el: 'O', dx: 9, dy: 0 }],
    H2O: [{ el: 'O', dx: 0, dy: 0 }, { el: 'H', dx: -9, dy: 8, r: 6 }, { el: 'H', dx: 9, dy: 8, r: 6 }],
    NH3: [{ el: 'N', dx: 0, dy: 0 }, { el: 'H', dx: -11, dy: 6, r: 6 }, { el: 'H', dx: 11, dy: 6, r: 6 }, { el: 'H', dx: 0, dy: -12, r: 6 }],
    CO2: [{ el: 'O', dx: -17, dy: 0 }, { el: 'C', dx: 0, dy: 0 }, { el: 'O', dx: 17, dy: 0 }],
    HCl: [{ el: 'H', dx: -10, dy: 0, r: 6 }, { el: 'Cl', dx: 5, dy: 0, r: 10 }],
    HA: [{ el: 'H', dx: -10, dy: 0, r: 6 }, { el: 'A', dx: 5, dy: 0, r: 10 }],
    'A-': [{ el: 'A', dx: 0, dy: 0, r: 10, label: 'A⁻' }],
    'H3O+': [{ el: 'O', dx: 0, dy: 0, label: 'O⁺' }, { el: 'H', dx: -10, dy: 7, r: 6 }, { el: 'H', dx: 10, dy: 7, r: 6 }, { el: 'H', dx: 0, dy: -12, r: 6 }]
  };
  var ELCLS = { A: 'pa', B: 'pb', H: 'ph', O: 'po', N: 'pn', Cl: 'pcl', C: 'pc' };
  var NAMES = { A: 'A', B: 'B', A2: 'A₂', B2: 'B₂', AB: 'AB', H2: 'H₂', O2: 'O₂', N2: 'N₂', Cl2: 'Cl₂', CO: 'CO', H2O: 'H₂O', NH3: 'NH₃', CO2: 'CO₂', HCl: 'HCl', HA: 'HA', 'A-': 'A⁻', 'H3O+': 'H₃O⁺' };
  function rot(dx, dy, a){ var c = Math.cos(a), s = Math.sin(a); return [dx * c - dy * s, dx * s + dy * c]; }
  function atomSvg(x, y, at){
    var rr = at.r || 9, lab = at.label || at.el, fs = rr < 7 ? 8 : lab.length > 1 ? 9 : 11;
    return '<g class="pt-atom ' + (ELCLS[at.el] || 'pa') + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rr + '"/><text x="' + x.toFixed(1) + '" y="' + (y + fs * 0.36).toFixed(1) + '" text-anchor="middle" font-size="' + fs + '">' + lab + '</text></g>';
  }
  function molSvg(kind, x, y, a){
    var t = TEMPL[kind] || TEMPL.A;
    return '<g class="pt-mol">' + t.slice().sort(function(p, q){ return (q.r || 9) - (p.r || 9); }).map(function(at){ var p = rot(at.dx, at.dy, a || 0); return atomSvg(x + p[0], y + p[1], at); }).join('') + '</g>';
  }
  function describe(counts, names){
    names = names || {};
    var k = Object.keys(counts).filter(function(x){ return counts[x] > 0; });
    if(!k.length) return 'nothing';
    return list(k.map(function(x){ return counts[x] + ' ' + (names[x] || NAMES[x] || x); }));
  }
  /* A box of particles, laid out on a jittered grid from a seeded rng so the
     same problem always draws the same picture. */
  function boxSvg(counts, seed, o){
    o = o || {};
    var W = o.w || 220, H = o.h || 150, r = M.rng(seed || 1), items = [];
    Object.keys(counts).forEach(function(k){ for(var i = 0; i < counts[k]; i++) items.push(k); });
    var n = items.length, cols = Math.max(3, Math.ceil(Math.sqrt(n * W / H))), rows = Math.max(2, Math.ceil(n / cols));
    var cw = (W - 20) / cols, ch = (H - 20) / rows, slots = [];
    for(var i = 0; i < cols * rows; i++) slots.push(i);
    slots = shuffleWith(r, slots).slice(0, n);
    items = shuffleWith(r, items);
    var g = items.map(function(k, j){
      var s = slots[j], cx = 10 + cw * (s % cols + 0.5) + (r() - 0.5) * cw * 0.2, cy = 10 + ch * (Math.floor(s / cols) + 0.5) + (r() - 0.5) * ch * 0.2;
      return molSvg(k, cx, cy, (r() - 0.5) * 2.2);
    }).join('');
    var label = o.label || 'A box containing ' + describe(counts, o.names);
    return '<svg class="chem-svg pt-box" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + '"><rect class="pt-frame" x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="10"/>' + g + '</svg>';
  }
  /* An ion and six water molecules. orient: 'O-in' (oxygen toward the ion),
     'H-in' (hydrogens toward it), 'mixed' (no pattern). */
  function hydrationSvg(ion, orient, seed){
    var W = 200, H = 180, cx = 100, cy = 90, r = M.rng(seed || 3), g = [];
    for(var i = 0; i < 6; i++){
      var a = i * Math.PI / 3 + 0.3, x = cx + 54 * Math.cos(a), y = cy + 54 * Math.sin(a);
      var o = orient === 'mixed' ? (i % 2 ? 'O-in' : 'H-in') : orient;
      // The water template has O at the origin and both H toward +y. Rotating
      // by ang turns +y to (−sin ang, cos ang); point it away from the ion for
      // O-in and toward the ion for H-in.
      var out = Math.atan2(y - cy, x - cx), face = o === 'O-in' ? out : out + Math.PI;
      var ang = face - Math.PI / 2 + (orient === 'mixed' ? (r() - 0.5) * 1.2 : 0);
      g.push(molSvg('H2O', x, y, ang));
    }
    var lab = ion.name + ' (' + ion.label + ') with six water molecules around it, ' + (orient === 'O-in' ? 'each with its oxygen end pointing toward the ion' : orient === 'H-in' ? 'each with its hydrogen ends pointing toward the ion' : 'in no pattern: some point oxygen and some point hydrogen toward the ion');
    return '<svg class="chem-svg pt-box" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + lab + '"><rect class="pt-frame" x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="10"/>' + g.join('') +
      '<g class="pt-atom ' + (ion.charge > 0 ? 'pcat' : 'pani') + '"><circle cx="' + cx + '" cy="' + cy + '" r="18"/><text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="11">' + ion.label + '</text></g></svg>';
  }
  /* ctx: { id, topic, kind: 'hydration' (ions: [{ name, label, el, charge }])
     | 'acid' (acids: [{ name, formula, anion, strong?, Ka?, c }])
     | 'limiting' (reactions: [{ equation, species: [{ k, nu }] }])
     | 'equilibrium' } */
  function ptGenerate(r, ctx){
    for(var t = 0; t < 200; t++){ var p = ptTry(r, ctx); if(p) return p; }
    throw new Error('particles: no problem for ' + ctx.id);
  }
  function ptTry(r, ctx){
    var seed = r.int(1, 999999);
    if(ctx.kind === 'hydration'){
      var ion = r.pick(ctx.ions), cat = ion.charge > 0, ors = [cat ? 'O-in' : 'H-in', cat ? 'H-in' : 'O-in', 'mixed'];
      return ptOut(ctx, 'hydration', '<p>Which picture shows how water molecules surround ' + ion.name + ' (' + ion.label + ') in water?</p>',
        ors.map(function(o, i){ return { svg: hydrationSvg(ion, o, seed + i), key: o }; }), 0, [
          'Right: ' + (cat ? 'the partially negative oxygen end of each water molecule is attracted to the positive ion.' : 'the partially positive hydrogen ends of each water molecule are attracted to the negative ion.') + ' This is an ion-dipole attraction.',
          cat ? 'The hydrogen ends of water are partially positive, so they are repelled by a cation, not drawn to it.' : 'The oxygen end of water is partially negative, so it is repelled by an anion, not drawn to it.',
          'Water molecules around an ion are not random: the ion-dipole attraction lines up each dipole the same way.'
        ], '1.A', { ion: ion.label, cation: cat });
    }
    if(ctx.kind === 'acid'){
      var acid = r.pick(ctx.acids), N = 6, pct = acid.strong ? 100 : M.weakAcid(acid.c, acid.Ka).percent;
      var pics = [{ 'H3O+': N, 'A-': N }, { HA: N - 1, 'H3O+': 1, 'A-': 1 }, { HA: N }, { HA: N / 2, 'H3O+': N / 2, 'A-': N / 2 }];
      var names = { HA: acid.formula + ' molecules', 'A-': acid.anion + ' ions', 'H3O+': 'H₃O⁺ ions' };
      return ptOut(ctx, 'acid', '<p>Which picture best represents ' + fmt(acid.c, 2) + ' M ' + acid.name + ' (' + acid.formula + (acid.strong ? ', a strong acid' : ', K<sub>a</sub> = ' + fmt(acid.Ka, 2)) + ')? Water molecules are left out. In the pictures, HA is ' + acid.formula + ' and A⁻ is ' + acid.anion + '.</p>',
        pics.map(function(p, i){ return { svg: boxSvg(p, seed + i, { names: names }), key: i }; }), acid.strong ? 0 : 1, [
          acid.strong ? 'Right: a strong acid ionizes completely. Every molecule has given its proton to water, leaving only H₃O⁺ and ' + acid.anion + '.' : 'This shows complete ionization, which is a strong acid. A weak acid is mostly un-ionized.',
          acid.strong ? 'This shows a weak acid, with most molecules intact. A strong acid ionizes completely.' : 'Right: a weak acid is mostly un-ionized. At this concentration only about ' + F(pct, 1) + '% of the molecules ionize, so most stay as ' + acid.formula + ' with a few H₃O⁺ and ' + acid.anion + ' ions.',
          'An acid in water always gives some protons to water; a picture with no ions shows no acid behavior at all.',
          acid.strong ? 'A strong acid ionizes completely, not halfway.' : 'Half ionized is far too much: about ' + F(pct, 1) + '% ionize. Equal amounts of HA and A⁻ is a buffer at pH = pK<sub>a</sub>.'
        ], '1.B', { pct: pct, strong: !!acid.strong });
    }
    if(ctx.kind === 'limiting'){
      var rx = r.pick(ctx.reactions), sp = rx.species, reac = sp.filter(function(s){ return s.nu < 0; }), prod = sp.filter(function(s){ return s.nu > 0; });
      var st = {}; reac.forEach(function(s){ st[s.k] = r.int(2, 7); });
      var ext = Math.min.apply(null, reac.map(function(s){ return Math.floor(st[s.k] / -s.nu); }));
      if(ext < 1) return null;
      var after = {}; sp.forEach(function(s){ after[s.k] = (st[s.k] || 0) + s.nu * ext; });
      var gone = reac.filter(function(s){ return after[s.k] === 0; }), left = reac.filter(function(s){ return after[s.k] > 0; });
      if(gone.length !== 1 || left.length !== 1) return null;
      var lim = gone[0], exc = left[0];
      var noLeft = {}, wrongLeft = {}, noCoef = {};
      sp.forEach(function(s){
        noLeft[s.k] = s.nu > 0 ? after[s.k] : 0;
        wrongLeft[s.k] = s === exc ? 0 : s === lim ? after[exc.k] : after[s.k];
        noCoef[s.k] = s.nu > 0 ? ext : after[s.k];
      });
      var cands = [after, noLeft, wrongLeft, noCoef], keys = cands.map(function(c){ return JSON.stringify(c); });
      if(keys.some(function(k, i){ return keys.indexOf(k) !== i; })) return null;
      var nm = function(s){ return NAMES[s.k] || s.k; };
      return ptOut(ctx, 'limiting', '<p class="bt-eq">' + rx.equation + '</p><p>The first box shows the reactants before the reaction. Which box shows the contents after the reaction has gone to completion?</p>',
        cands.map(function(c, i){ return { svg: boxSvg(c, seed + i), key: i }; }), 0, [
          'Right: ' + ext + ' reaction event' + (ext === 1 ? '' : 's') + ' use up all the ' + nm(lim) + ' (limiting), leave ' + after[exc.k] + ' ' + nm(exc) + ' (in excess) and make ' + prod.map(function(s){ return after[s.k] + ' ' + nm(s); }).join(' and ') + '. Every atom is accounted for.',
          'Atoms are not conserved: the reactant in excess does not disappear. Some ' + nm(exc) + ' must be left over.',
          'The leftover is the wrong reactant: ' + nm(lim) + ' runs out first.',
          'Products form in the ratio of the coefficients: each reaction event makes ' + prod.map(function(s){ return s.nu + ' ' + nm(s); }).join(' and ') + '.'
        ], '1.B', { before: boxSvg(st, seed + 9, { label: 'Before the reaction: a box containing ' + describe(st) }), start: st, after: after });
    }
    // equilibrium: A₂ + B₂ ⇌ 2 AB. Δn = 0, so K is the ratio of particle counts.
    var a0 = r.int(3, 6), b0 = r.int(3, 6), full = Math.min(a0, b0), x = r.int(1, full - 1);
    var mk = function(y){ return { A2: a0 - y, B2: b0 - y, AB: 2 * y }; };
    var alt = x + 1 < full ? x + 1 : x - 1;
    if(alt < 1) return null;
    var xs = [x, full, 0, alt], e = mk(x), K = e.AB * e.AB / (e.A2 * e.B2);
    var Qof = function(y){ var c = mk(y); return c.A2 * c.B2 === 0 ? Infinity : c.AB * c.AB / (c.A2 * c.B2); };
    var qs = function(y){ var q = Qof(y); return isFinite(q) ? fmt(q, 3) : 'not defined, because a reactant is gone'; };
    return ptOut(ctx, 'equilibrium', '<p class="bt-eq">A₂ + B₂ ⇌ 2 AB &nbsp; K = ' + fmt(K, 3) + '</p><p>The first box shows the mixture before any reaction. Every particle stands for the same concentration, and the number of gas particles does not change, so K can be worked out from particle counts. Which box shows the mixture at equilibrium?</p>',
      xs.map(function(y, i){ return { svg: boxSvg(mk(y), seed + i), key: y }; }), 0, [
        'Right: Q = (' + e.AB + ')² / (' + e.A2 + ' × ' + e.B2 + ') = ' + qs(x) + ', equal to K. Some of every species remains.',
        'That is complete reaction, limiting-reactant thinking. An equilibrium mixture keeps some of every species; here Q is ' + qs(full) + '.',
        'No reaction has happened: Q = 0, far below K, so the reaction must go forward.',
        'For this box Q = ' + qs(alt) + ', not equal to K = ' + fmt(K, 3) + '.'
      ], '6.E', { before: boxSvg(mk(0), seed + 9, { label: 'Before any reaction: a box containing ' + describe(mk(0)) }), K: K, x: x, eq: e });
  }
  var PT_LABEL = { hydration: 'Choose the picture', acid: 'Choose the picture', limiting: 'Choose the box after the reaction', equilibrium: 'Choose the equilibrium box' };
  function ptOut(ctx, type, text, opts, correct, why, practice, extra){
    extra = extra || {};
    var alt = function(svg){ var m = /aria-label="([^"]*)"/.exec(svg); return m ? m[1] : ''; };
    var steps = [{ key: type, kind: 'choice', label: PT_LABEL[type], options: opts.map(function(o){ return alt(o.svg); }), optionsHtml: opts.map(function(o){ return o.svg; }), correct: correct, why: why, practice: practice }];
    var sol = [why[correct]];
    if(type === 'limiting'){
      var rs = Object.keys(extra.start), lim = rs.filter(function(k){ return extra.after[k] === 0; })[0];
      steps.push({ key: 'limiting-reactant', kind: 'choice', label: 'Which reactant is limiting?', options: rs.map(function(k){ return NAMES[k] || k; }), correct: rs.indexOf(lim), fixed: true, practice: '5.F',
        why: rs.map(function(k){ return k === lim ? 'It runs out first: ' + extra.start[k] + ' particles are used up while the other reactant is left over.' : 'Some ' + (NAMES[k] || k) + ' is left over, so it is in excess.'; }) });
      sol.push('The limiting reactant is the one with none left: ' + (NAMES[lim] || lim) + '.');
    }
    if(type === 'acid') sol.push(extra.strong ? 'Strong acids (HCl, HBr, HI, HNO₃, HClO₄, H₂SO₄ for its first proton) ionize completely in water.' : 'Percent ionization = [H₃O⁺] ÷ initial concentration × 100 = ' + F(extra.pct, 1) + '%, worked out exactly from K<sub>a</sub>.');
    return { kind: 'particles', type: type, ctx: ctx.id, topic: ctx.topic, text: text, options: opts, correct: correct, why: why, practice: practice, extra: extra, steps: steps, solution: sol };
  }

  /* ------------------------------------------------ 6. Units and sig figs */
  /* Each problem is one bank-format item (ids "<slug>:<context>:<kind>"),
     graded by ApChemQuestions on value, units and significant figures
     separately. ctx: { id, topic, kind: 'muldiv'|'addsub'|'gas'|'calorimetry'|'pH'|'rchoice' } */
  function sfOf(str){ var d = String(str).replace(/^[-−]/, ''); var dot = d.indexOf('.') > -1, all = d.replace('.', '').replace(/^0+/, ''); return dot ? all.length : all.replace(/0+$/, '').length; }
  function decOf(str){ var d = String(str); return d.indexOf('.') > -1 ? d.split('.')[1].length : 0; }
  function meas(r, a, b, places){ return (a + r() * (b - a)).toFixed(places); }
  function ulp(ans, sf){ return Math.pow(10, Math.floor(Math.log10(Math.abs(ans))) - sf + 1); }
  /* The key written with sf significant figures can be read back with sf
     figures (no ambiguous trailing zeros such as "20"). */
  function clean(ans, sf){ var s = Math.abs(M.sig(ans, sf)).toPrecision(sf); return s.indexOf('e') < 0 && sfOf(s) === sf; }
  function unGenerate(r, ctx){
    for(var t = 0; t < 200; t++){ var p = unTry(r, ctx); if(p) return p; }
    throw new Error('units: no problem for ' + ctx.id);
  }
  function unTry(r, ctx){
    var q, slug = ctx.slug || 'units-sig-figs', setup = null;
    // setup (tools upgrade): the quantities a student multiplies or divides,
    // as written in the stem, with units and significant figures, so the page
    // can let them build the setup and cancel units. place: 1 on top, -1 below,
    // 0 a distractor that belongs nowhere. sf null for exact numbers.
    if(ctx.kind === 'muldiv'){
      var m = meas(r, 10, 99, r.pick([1, 2, 3])), v = meas(r, 5, 49, r.pick([1, 2])), sf = Math.min(sfOf(m), sfOf(v)), ans = +m / +v;
      if(!clean(ans, sf)) return null;
      setup = { target: 'g/mL', factors: [{ label: 'mass', v: m, u: 'g', place: 1, sf: sfOf(m) }, { label: 'volume', v: v, u: 'mL', place: -1, sf: sfOf(v) }] };
      q = { q: 'A metal sample has a mass of ' + m + ' g and a volume of ' + v + ' mL. What is its density?',
        numeric: { answer: ans, tol: ulp(ans, sf), unit: 'g/mL', units: ['g/cm^3'], askUnit: true, sigfigs: sf, mistakes: [{ value: +v / +m, why: 'Density is mass ÷ volume, not volume ÷ mass.' }] },
        why: { correct: 'd = m / V = ' + m + ' g ÷ ' + v + ' mL = ' + fmt(ans, sf) + ' g/mL. When you multiply or divide, keep the fewest significant figures in the data: ' + sfOf(m) + ' and ' + sfOf(v) + ', so ' + sf + '.' } };
    } else if(ctx.kind === 'addsub'){
      var p1 = r.pick([1, 2, 3]), p2 = r.pick([1, 2, 3]);
      if(p1 === p2) return null;
      var tot = meas(r, 40, 99, p1), beak = meas(r, +tot - 9.5, +tot - 1.2, p2), dp = Math.min(p1, p2), ans2 = +tot - +beak, shown = M.fixed(ans2, dp), sf2 = sfOf(shown);
      if(Math.min(sfOf(tot), sfOf(beak)) === sf2) return null;
      setup = { addsub: [tot, beak], places: [p1, p2], result: shown };
      q = { q: 'A beaker with a sample in it has a mass of ' + tot + ' g. The empty beaker is ' + beak + ' g. What is the mass of the sample?',
        numeric: { answer: ans2, tol: Math.pow(10, -dp) / 2, unit: 'g', askUnit: true, sigfigs: sf2, mistakes: [] },
        why: { correct: tot + ' g − ' + beak + ' g = ' + shown + ' g. When you add or subtract, keep the fewest decimal places (' + p1 + ' and ' + p2 + ', so ' + dp + '), not the fewest significant figures. Here that leaves ' + sf2 + ' significant figures.' } };
    } else if(ctx.kind === 'gas'){
      var n = meas(r, 0.1, 0.9, 3), T = meas(r, 15, 95, 1), V = meas(r, 1, 9, 2), Tk = +T + M.C.T0, P = +n * M.C.R_LATM * Tk / +V, sf3 = Math.min(sfOf(n), sfOf(V));
      if(!clean(P, sf3)) return null;
      setup = { target: 'atm', factors: [{ label: 'n', v: n, u: 'mol', place: 1, sf: sfOf(n) }, { label: 'R', v: '0.08206', u: 'L·atm/(mol·K)', place: 1, sf: 4, constant: true },
        { label: 'T', v: M.fixed(Tk, 2), u: 'K', place: 1, sf: 4, note: T + ' + 273.15; the sum keeps one decimal place, so it counts as 4 significant figures (the extra digit is carried)' }, { label: 'V', v: V, u: 'L', place: -1, sf: sfOf(V) },
        { label: 'T in °C', v: T, u: '°C', place: 0, sf: sfOf(T), why: 'Gas laws need kelvin; °C does not cancel the K in R.' }, { label: 'R', v: '8.314', u: 'J/(mol·K)', place: 0, sf: 4, constant: true, why: 'This R is in joules: with L and atm the units do not cancel to atm.' }] };
      q = { q: 'A ' + V + ' L flask holds ' + n + ' mol of an ideal gas at ' + T + ' °C. What is the pressure in atmospheres?',
        numeric: { answer: P, tol: ulp(P, sf3), unit: 'atm', askUnit: true, sigfigs: sf3, mistakes: [
          { value: +n * M.C.R_LATM * +T / +V, why: 'Gas laws need kelvin: T = ' + T + ' + 273.15 = ' + fmt(Tk, 4) + ' K. With degrees Celsius the pressure comes out wrong.' },
          { value: +n * M.C.R_J * Tk / +V, why: 'With P in atm and V in L, use R = 0.08206 L·atm/(mol·K). R = 8.314 J/(mol·K) gives kilopascals here, not atmospheres.' }] },
        why: { correct: 'P = nRT / V = (' + n + ' mol)(0.08206 L·atm/(mol·K))(' + fmt(Tk, 4) + ' K) ÷ ' + V + ' L = ' + fmt(P, sf3) + ' atm. Convert to kelvin first (273.15 is exact). The amount and the volume have ' + sfOf(n) + ' and ' + sfOf(V) + ' significant figures and the kelvin temperature has 4, so ' + sf3 + '.' } };
    } else if(ctx.kind === 'calorimetry'){
      var mass = meas(r, 50, 150, 1), dT = meas(r, 2, 9, 2), mol = meas(r, 0.02, 0.09, 4);
      var qJ = +mass * 4.18 * +dT, dH = -qJ / 1000 / +mol, sf4 = Math.min(sfOf(mass), sfOf(dT), sfOf(mol), 3);
      if(!clean(dH, sf4)) return null;
      setup = { target: 'kJ/mol', sign: true, factors: [{ label: 'mass', v: mass, u: 'g', place: 1, sf: sfOf(mass) }, { label: 'c', v: '4.18', u: 'J/(g·°C)', place: 1, sf: 3 },
        { label: 'ΔT', v: dT, u: '°C', place: 1, sf: sfOf(dT) }, { label: 'kJ per J', v: '1 kJ / 1000 J', u: 'kJ/J', place: 1, sf: null }, { label: 'moles', v: mol, u: 'mol', place: -1, sf: sfOf(mol) }] };
      q = { q: 'Dissolving ' + mol + ' mol of a salt in ' + mass + ' g of water raises the temperature by ' + dT + ' °C. Take c = 4.18 J/(g·°C) for the solution and ignore the heat absorbed by the cup. What is ΔH of dissolution in kJ/mol?',
        numeric: { answer: dH, tol: ulp(dH, sf4), unit: 'kJ/mol', askUnit: true, sigfigs: sf4, mistakes: [
          { value: -qJ / +mol, why: 'That is in J/mol. Divide by 1000 to report kJ/mol.' },
          { value: qJ / 1000 / +mol, why: 'The water warmed up, so dissolving released heat: ΔH is negative (exothermic).' },
          { value: -qJ / 1000, why: 'ΔH is per mole: divide the heat by the moles dissolved.' }] },
        why: { correct: 'q = mcΔT = ' + mass + ' g × 4.18 J/(g·°C) × ' + dT + ' °C = ' + fmt(qJ, 4) + ' J = ' + fmt(qJ / 1000, 4) + ' kJ released. ΔH = −' + fmt(qJ / 1000, 4) + ' kJ ÷ ' + mol + ' mol = ' + fmt(dH, sf4) + ' kJ/mol, to ' + sf4 + ' significant figures (c has 3).' } };
    } else if(ctx.kind === 'pH'){
      var sf5 = r.pick([2, 3]), coef = (1 + 8.9 * r()).toFixed(sf5 - 1), ex = r.int(2, 5), h = +coef * Math.pow(10, -ex), ph = -Math.log10(h);
      q = { q: 'A strong acid solution has [H₃O⁺] = ' + coef + ' × 10<sup>−' + ex + '</sup> M. What is its pH?',
        numeric: { answer: ph, tol: Math.pow(10, -sf5), places: sf5, mistakes: [{ value: -Math.log(h), why: 'pH uses the base-10 log, not ln.' }, { value: 14 - ph, why: 'That is the pOH. pH = −log[H₃O⁺].' }] },
        why: { correct: 'pH = −log(' + coef + ' × 10⁻' + ex + ') = ' + ph.toFixed(sf5) + '. For a logarithm, the number of decimal places equals the significant figures in the concentration (' + sf5 + ').' } };
    } else {
      var which = r.int(0, 2), unitP = ['atm', 'kPa', 'torr'][which];
      q = { type: 'single', q: 'A gas sample is measured with its pressure in ' + unitP + ' and its volume in liters. Which value of R goes in PV = nRT?', options: ['0.08206 L·atm/(mol·K)', '8.314 J/(mol·K)', '62.36 L·torr/(mol·K)', '1.987 cal/(mol·K)'], correct: which, fixed: true,
        why: { correct: ['Atmospheres and liters go with R = 0.08206 L·atm/(mol·K).', '1 kPa·L = 1 J, so R = 8.314 J/(mol·K) is also 8.314 L·kPa/(mol·K).', 'Torr and liters go with R = 62.36 L·torr/(mol·K).'][which],
          options: ['This value fits pressure in atm and volume in L.', 'This value fits energy in joules, and L·kPa, since 1 L·kPa = 1 J.', 'This value fits pressure in torr and volume in L.', 'Calories are not used on the exam; energy is in joules.'] } };
    }
    q.id = slug + ':' + ctx.id + ':' + ctx.kind;
    q.type = q.type || 'numeric'; q.topic = ctx.topic; q.practice = ctx.kind === 'rchoice' ? '5.B' : '5.F'; q.level = 'apply'; q.diff = 2;
    if(q.numeric) q.numeric.mistakes = q.numeric.mistakes.filter(function(mk){ return Math.abs(mk.value - q.numeric.answer) > 2.5 * q.numeric.tol; });
    return { kind: 'units', ctx: ctx.id, topic: ctx.topic, item: q, setup: setup };
  }

  /* A change-row entry typed by a student: "−2x", "+x", "x", "0" -> the
     coefficient of x (NaN when it is not a multiple of x). */
  function parseCoef(s){
    s = String(s || '').replace(/[−–]/g, '-').replace(/\s+/g, '').toLowerCase();
    if(s === '0' || s === '+0' || s === '-0') return 0;
    var m = /^([+-]?)(\d*\.?\d*)\*?x$/.exec(s);
    if(!m || m[2] === '.') return NaN;
    var n = m[2] === '' ? 1 : parseFloat(m[2]);
    return m[1] === '-' ? -n : n;
  }
  function coefText(n){ return n === 0 ? '0' : (n > 0 ? '+' : '−') + (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'x'; }

  /* ===================================================================
     Explore models (tools upgrade Phase 2, docs/tools-upgrade-notes/chem.md).
     Pure, tested in scripts/test/apchem-explore.test.mjs. */

  /* Titration: millimoles of each species at v mL of titrant, from the
     exact pH (titrationPH) and the acid's distribution fractions. Spectator
     ions (Na⁺, Cl⁻) are left out. Keys: H3O, OH, and HA, A (weak acid),
     H2A, HA, A (diprotic), B, BH (weak base). */
  function titrationSpecies(sys, v){
    var V = sys.Va + v, pH = titrationPH(sys, v), h = Math.pow(10, -pH), Kw = M.C.Kw, n0 = sys.Ca * sys.Va;
    var out = { pH: pH, V: V, H3O: h * V, OH: Kw / h * V };
    if(sys.kind === 'sa') return out;
    if(sys.kind === 'wb'){ var Kb = Kw / sys.Kb; out.BH = n0 * h / (h + Kb); out.B = n0 - out.BH; return out; }
    var Ka = sys.Ka, n = Ka.length, t = [], s = 0, prod = 1;
    for(var k = 0; k <= n; k++){ if(k) prod *= Ka[k - 1]; var x = prod * Math.pow(h, n - k); t.push(x); s += x; }
    if(n === 1){ out.HA = n0 * t[0] / s; out.A = n0 * t[1] / s; }
    else { out.H2A = n0 * t[0] / s; out.HA = n0 * t[1] / s; out.A = n0 * t[2] / s; }
    return out;
  }
  /* Where a volume sits on the curve: 'start' (nothing added), a landmark
     ('half', 'eq'; diprotic 'half1', 'eq1', 'half2', 'eq2'): a half point
     within 2% of the first equivalence volume (at least 0.1 mL), an
     equivalence point within 0.1 mL (two drops; the pH jumps there), or
     the stretch between:
     strong acid 'before'/'after'; weak acid or base 'acid-rich' (before
     half-equivalence), 'base-rich' (between half and equivalence), 'after';
     diprotic 'b1a', 'b1b', 'b2a', 'b2b', 'after'. */
  function titrationRegion(sys, v){
    var e = titrationEq(sys), tol = Math.max(0.1, 0.02 * e[0]), at = function(w, t){ return Math.abs(v - w) <= (t || tol) + 1e-9; };
    if(v <= 1e-9) return 'start';
    if(sys.kind === 'sa') return at(e[0], 0.1) ? 'eq' : v < e[0] ? 'before' : 'after';
    if(sys.kind === 'di'){
      var marks = [[e[0] / 2, 'half1', 'b1a'], [e[0], 'eq1', 'b1b', 0.1], [1.5 * e[0], 'half2', 'b2a'], [e[1], 'eq2', 'b2b', 0.1]];
      for(var i = 0; i < marks.length; i++){ if(at(marks[i][0], marks[i][3])) return marks[i][1]; if(v < marks[i][0]) return marks[i][2]; }
      return 'after';
    }
    if(at(e[0] / 2)) return 'half';
    if(v < e[0] / 2) return 'acid-rich';
    if(at(e[0], 0.1)) return 'eq';
    return v < e[0] ? 'base-rich' : 'after';
  }
  /* The volume at which the curve first reaches pH ph (curves are monotonic:
     rising for an acid analyte, falling for a base): 0 when the start is
     already past it, Infinity when it is never reached by vmax. */
  function titrationCross(sys, ph, vmax){
    var up = sys.kind !== 'wb', f = function(v){ return titrationPH(sys, v); };
    var past = function(y){ return up ? y >= ph : y <= ph; };
    if(past(f(0))) return 0;
    if(!past(f(vmax))) return Infinity;
    var lo = 0, hi = vmax;
    for(var i = 0; i < 60; i++){ var m = (lo + hi) / 2; if(past(f(m))) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }

  /* Buffer taking strong acid or base, in moles, with no volume change.
     o: { Ka, nHA, nA (mol at the start), V (L), b (mol of strong base added;
     negative for strong acid) }. Stoichiometry first (the strong species
     reacts completely), then the pH two ways:
       pH        exact, from the charge balance with water (any amount added):
                 [H₃O⁺] − Kw/[H₃O⁺] + (nA + b)/V − C·Ka/([H₃O⁺] + Ka) = 0,
                 C = (nHA + nA)/V. The same equation holds for a weak-base
                 buffer (HA = BH⁺, A = B, Ka = Kw/Kb, the salt's Cl⁻ in place
                 of Na⁺).
       method    how the exam expects it: 'hh' (both forms left, ratio 0.1-10),
                 'hh-edge' (both left, ratio outside 0.1-10), 'weak-base' /
                 'weak-acid' (exactly one form left), 'excess-base' /
                 'excess-acid' (capacity passed: pH from the leftover strong
                 species alone), with pHmethod its value.
     water: the pH the same addition gives in pure water (exact). */
  function bufferState(o){
    var Kw = M.C.Kw, Ka = o.Ka, V = o.V, b = o.b || 0, eps = 1e-9 * (o.nHA + o.nA);
    var r = { nHA: o.nHA, nA: o.nA, exOH: 0, exH: 0 };
    if(b >= 0){ var u = Math.min(b, o.nHA); r.nHA = o.nHA - u; r.nA = o.nA + u; r.exOH = b - u; }
    else { var w = Math.min(-b, o.nA); r.nA = o.nA - w; r.nHA = o.nHA + w; r.exH = -b - w; }
    ['nHA', 'nA', 'exOH', 'exH'].forEach(function(k){ if(Math.abs(r[k]) < eps) r[k] = 0; });
    var C = (o.nHA + o.nA) / V, Na = (o.nA + b) / V, lo = -15, hi = 1;
    for(var i = 0; i < 100; i++){ var m = (lo + hi) / 2, h = Math.pow(10, m); if(h - Kw / h + Na - C * Ka / (h + Ka) > 0) hi = m; else lo = m; }
    r.pH = -(lo + hi) / 2;
    if(r.exOH > 0){ r.method = 'excess-base'; r.pHmethod = 14 + Math.log10(r.exOH / V); }
    else if(r.exH > 0){ r.method = 'excess-acid'; r.pHmethod = -Math.log10(r.exH / V); }
    else if(r.nHA > 0 && r.nA > 0){ var q = r.nA / r.nHA; r.method = q >= 0.1 && q <= 10 ? 'hh' : 'hh-edge'; r.pHmethod = -Math.log10(Ka) + Math.log10(q); }
    else if(r.nA > 0){ r.method = 'weak-base'; r.pHmethod = 14 - M.weakAcid(r.nA / V, Kw / Ka).pH; }
    else { r.method = 'weak-acid'; r.pHmethod = M.weakAcid(r.nHA / V, Ka).pH; }
    var cb = b / V;
    // [H₃O⁺] − [OH⁻] = −cb, written without cancellation for either sign.
    var root = Math.sqrt(cb * cb + 4 * Kw);
    r.water = -Math.log10(cb > 0 ? 2 * Kw / (cb + root) : (root - cb) / 2);
    return r;
  }

  /* Q vs K with amounts: n (mol per species) in V liters. equilibrate()
     returns the amounts once the net reaction has run until Q = K. */
  function concOf(n, V){ return n.map(function(x){ return x / V; }); }
  /* Solids and liquids stay out of Q but still limit how far the reaction
     can run: if a solid runs out first, the run stops there (Q has not
     reached K, and no more can react). Extent in mol, by bisection on ln Q. */
  function equilibrate(sp, n, V, K){
    var lo = -Infinity, hi = Infinity, lk = Math.log(K);
    sp.forEach(function(s, i){ if(s.nu < 0) hi = Math.min(hi, n[i] / -s.nu); else lo = Math.max(lo, -n[i] / s.nu); });
    var lnQ = function(x){ var q = 0, inf = 0; sp.forEach(function(s, i){ if(!inQ(s)) return; var c = (n[i] + s.nu * x) / V; if(c <= 0) inf += s.nu < 0 ? 1 : -1; else q += s.nu * Math.log(c); }); return inf > 0 ? Infinity : inf < 0 ? -Infinity : q; };
    var a = lo, b = hi;
    for(var i = 0; i < 300; i++){ var m = (a + b) / 2; if(lnQ(m) > lk) b = m; else a = m; }
    var x = (a + b) / 2;
    return sp.map(function(s, i){ var v = n[i] + s.nu * x; return Math.abs(v) < 1e-12 * (Math.abs(n[i]) + 1e-12) ? 0 : v; });
  }

  /* Atoms in a set of particle counts ({ H2: 3, O2: 1 } -> { H: 6, O: 2 }),
     from the same templates the pictures draw. */
  function atomsOf(counts){
    var out = {};
    Object.keys(counts).forEach(function(k){ (TEMPL[k] || []).forEach(function(at){ out[at.el] = (out[at.el] || 0) + (counts[k] || 0); }); });
    return out;
  }

  /* Units as exponent maps: 'L·atm/(mol·K)' -> { L: 1, atm: 1, mol: -1, K: -1 }.
     unitMul(list) multiplies [{ u, p }] (p = +1 on top, −1 below);
     unitText(map) writes the leftover unit, '' when everything cancels. */
  function unitParse(u){
    var out = {}, s = String(u || '').replace(/[()\s]/g, ''), parts = s.split('/');
    parts.forEach(function(part, i){ part.split(/[·*]/).forEach(function(t){
      if(!t || t === '1') return;
      var m = /^(.*?)\^?(-?\d+)?$/.exec(t), name = m[1], e = m[2] ? +m[2] : 1;
      out[name] = (out[name] || 0) + (i ? -e : e);
    }); });
    return out;
  }
  function unitMul(list){
    var out = {};
    list.forEach(function(f){ var m = unitParse(f.u); Object.keys(m).forEach(function(k){ out[k] = (out[k] || 0) + f.p * m[k]; }); });
    Object.keys(out).forEach(function(k){ if(!out[k]) delete out[k]; });
    return out;
  }
  function unitText(map){
    var pow = function(k, e){ return k + (e > 1 ? '^' + e : ''); };
    var top = Object.keys(map).filter(function(k){ return map[k] > 0; }).map(function(k){ return pow(k, map[k]); });
    var bot = Object.keys(map).filter(function(k){ return map[k] < 0; }).map(function(k){ return pow(k, -map[k]); });
    if(!top.length && !bot.length) return '';
    return (top.join('·') || '1') + (bot.length ? '/' + (bot.length > 1 ? '(' + bot.join('·') + ')' : bot[0]) : '');
  }
  function unitSame(a, b){ var x = unitMul([{ u: a, p: 1 }, { u: b, p: -1 }]); return !Object.keys(x).length; }

  var D = {
    fmt: fmt, sup: sup, cell: cell, diagnose: diagnose, near: near, list: list, parseCoef: parseCoef, coefText: coefText,
    bufferState: bufferState, equilibrate: equilibrate, concOf: concOf, atomsOf: atomsOf,
    unitParse: unitParse, unitMul: unitMul, unitText: unitText, unitSame: unitSame,
    Q: Q, Qflat: Qflat, at: at, inQ: inQ, solveExtent: solveExtent, smallX: smallX, eqHtml: eqHtml, exprHtml: exprHtml,
    ice: { generate: iceGenerate },
    qk: { generate: qkGenerate },
    buffer: { generate: bufGenerate },
    titration: { generate: titGenerate, pH: titrationPH, curve: titrationCurve, eq: titrationEq, nbar: nbar, INDICATORS: INDICATORS,
      species: titrationSpecies, region: titrationRegion, cross: titrationCross },
    particles: { generate: ptGenerate, box: boxSvg, hydration: hydrationSvg, mol: molSvg, describe: describe },
    units: { generate: unGenerate, sigFigsOf: sfOf, decimalsOf: decOf }
  };
  for(var k in D) M[k] = D[k];
})();
